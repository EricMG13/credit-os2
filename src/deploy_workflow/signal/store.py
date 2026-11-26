"""SQLite store for Signal users, sources, checks and stories."""

from __future__ import annotations

import hashlib
import re
import sqlite3
import string
import time
import unicodedata
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit, urlunsplit

from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.fold import MIN_TITLE_WORDS, TITLE_WINDOW, link_key, title_key

ROLES = ("reader", "writer", "owner")
# The feed kinds: what writers propose and topics filter on.
KINDS = ("regulator", "news", "ratings", "research")
FILING = "filing"  # an issuer's SEC filings: proposed by setting the issuer's CIK
MARKET = "market"  # the daily market backdrop: proposed by `signal market propose`
SOURCE_KINDS = (*KINDS, FILING, MARKET)
STATES = ("proposed", "approved", "paused")


class StoreError(ValueError):
    """An invalid role, kind, state, empty name or duplicate."""


class Conflict(StoreError):
    """What was asked clashes with what is stored: a name already taken, or a limit reached."""


class Missing(StoreError):
    """What was asked about is not stored: an unknown id."""


_MIGRATION_1 = """
CREATE TABLE users(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL
);
CREATE TABLE sources(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    proposed_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE source_checks(
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    at TEXT NOT NULL,
    ok INTEGER NOT NULL,
    reason TEXT NOT NULL,
    etag TEXT,
    modified TEXT,
    new_stories INTEGER NOT NULL
);
CREATE TABLE stories(
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    link_key TEXT NOT NULL,
    title_key TEXT NOT NULL,
    published_at TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    summary TEXT NOT NULL,
    UNIQUE(source_id, link_key)
);
CREATE TABLE story_duplicates(
    story_id INTEGER NOT NULL REFERENCES stories(id),
    duplicate_source_id INTEGER NOT NULL REFERENCES sources(id),
    link TEXT NOT NULL,
    link_key TEXT NOT NULL,
    published_at TEXT NOT NULL,
    seen_at TEXT NOT NULL,
    UNIQUE(duplicate_source_id, link_key)
);
CREATE INDEX IF NOT EXISTS idx_story_duplicates_link_key ON story_duplicates(link_key);
CREATE VIRTUAL TABLE stories_fts USING fts5(
    title, summary, content='stories', content_rowid='id'
);
CREATE TRIGGER stories_ai AFTER INSERT ON stories BEGIN
    INSERT INTO stories_fts(rowid, title, summary) VALUES (new.id, new.title, new.summary);
END;
CREATE TRIGGER stories_ad AFTER DELETE ON stories BEGIN
    INSERT INTO stories_fts(stories_fts, rowid, title, summary)
    VALUES ('delete', old.id, old.title, old.summary);
END;
CREATE TRIGGER stories_au AFTER UPDATE ON stories BEGIN
    INSERT INTO stories_fts(stories_fts, rowid, title, summary)
    VALUES ('delete', old.id, old.title, old.summary);
    INSERT INTO stories_fts(rowid, title, summary) VALUES (new.id, new.title, new.summary);
END;
"""

_MIGRATION_2 = """
CREATE TABLE topics(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    keywords TEXT NOT NULL,
    kinds TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE topic_stories(
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    story_id INTEGER NOT NULL REFERENCES stories(id),
    UNIQUE(topic_id, story_id)
);
CREATE TABLE topic_follows(
    user_name TEXT NOT NULL,
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    UNIQUE(user_name, topic_id)
);
CREATE TABLE saves(
    user_name TEXT NOT NULL,
    story_id INTEGER NOT NULL REFERENCES stories(id),
    saved_at TEXT NOT NULL,
    UNIQUE(user_name, story_id)
);
CREATE INDEX IF NOT EXISTS idx_story_duplicates_story_id ON story_duplicates(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_published_at_id ON stories(published_at, id);
CREATE INDEX IF NOT EXISTS idx_topic_stories_story_id ON topic_stories(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_link_key ON stories(link_key);
CREATE INDEX IF NOT EXISTS idx_stories_title_key ON stories(title_key);
"""

# Groups, members, threads, comments, reactions, read marks and notification settings.
# A thread's story_id is NULL for a note thread; topic_id is set when a group topic posted it
# (created_by is then NULL) and goes back to NULL when that topic is deleted.
# A group's thread rules: a row per rule the group has set; a rule with no row has its default.
# A deleted group's, thread's or comment's id is never given again (AUTOINCREMENT): a page that
# still names one gets 404, and a stale write never lands on someone else's new thread or comment.
_MIGRATION_3 = """
CREATE TABLE groups(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    visibility TEXT NOT NULL CHECK (visibility IN ('everyone','invited')),
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE group_members(
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    UNIQUE(group_id, user_name)
);
CREATE TABLE group_topics(
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    UNIQUE(group_id, topic_id)
);
CREATE TABLE threads(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    story_id INTEGER REFERENCES stories(id),
    created_at TEXT NOT NULL,
    created_by TEXT,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    note TEXT,
    last_activity_at TEXT NOT NULL,
    CHECK (story_id IS NOT NULL OR note IS NOT NULL),
    CHECK (created_by IS NULL OR topic_id IS NULL),
    UNIQUE(group_id, story_id)
);
CREATE TABLE comments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    removed_at TEXT
);
CREATE TABLE reactions(
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    word TEXT NOT NULL CHECK (word IN ('Agree','Disagree','Seen')),
    UNIQUE(comment_id, user_name, word)
);
CREATE TABLE read_marks(
    user_name TEXT NOT NULL,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    read_at TEXT NOT NULL,
    UNIQUE(user_name, thread_id)
);
CREATE TABLE thread_rules(
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    rule TEXT NOT NULL CHECK (rule IN ('comments-edited','authors-remove','archive-quiet')),
    is_on INTEGER NOT NULL CHECK (is_on IN (0, 1)),
    UNIQUE(group_id, rule)
);
CREATE TABLE notification_settings(
    user_name TEXT NOT NULL,
    event TEXT NOT NULL CHECK (event IN ('replies','threads','signal','digest')),
    in_signal INTEGER NOT NULL CHECK (in_signal IN (0, 1)),
    on_desktop INTEGER NOT NULL CHECK (on_desktop IN (0, 1)),
    UNIQUE(user_name, event)
);
CREATE INDEX idx_threads_group_activity ON threads(group_id, last_activity_at);
CREATE INDEX idx_threads_story_id ON threads(story_id);
CREATE INDEX idx_comments_thread_id ON comments(thread_id, created_at);
CREATE INDEX idx_comments_parent_id ON comments(parent_id, created_at);
CREATE INDEX idx_group_topics_topic_id ON group_topics(topic_id);
CREATE INDEX idx_group_members_user ON group_members(user_name);
CREATE INDEX idx_read_marks_thread ON read_marks(thread_id);
CREATE INDEX idx_threads_topic_id ON threads(topic_id);
"""

# Digests, their covers and runs. A digest belongs to one user and is read by that user only, so an
# issue's unread state is the digest owner's (`read_at`). `period_from` is where the next run's
# period starts: every run, whatever its outcome, moves it to the run's end, so a period is never
# longer than the time since the last run. `next_run_at` is the next scheduled run, in the store's
# UTC text form. A run is recorded for every attempt: 'nothing' (an issue saying nothing material
# happened), 'skipped' (stories were in scope and no writer was available, or the digest covers
# nothing now) or 'written' (reserved for the AI pass). A deleted topic or group takes its cover
# rows with it (ON DELETE CASCADE): a digest never blocks a deletion.
_MIGRATION_4 = """
CREATE TABLE digests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','monthly')),
    minute INTEGER NOT NULL CHECK (minute BETWEEN 0 AND 1439),
    weekday INTEGER CHECK (weekday BETWEEN 0 AND 6),
    month_day INTEGER CHECK (month_day BETWEEN 1 AND 31),
    covers_all INTEGER NOT NULL CHECK (covers_all IN (0, 1)),
    subject TEXT NOT NULL,
    length TEXT NOT NULL CHECK (length IN ('short','standard')),
    points INTEGER NOT NULL CHECK (points BETWEEN 1 AND 10),
    upcoming TEXT NOT NULL,
    look_ahead_days INTEGER NOT NULL CHECK (look_ahead_days BETWEEN 0 AND 60),
    period_from TEXT NOT NULL,
    next_run_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CHECK ((cadence = 'weekly') = (weekday IS NOT NULL)),
    CHECK ((cadence = 'monthly') = (month_day IS NOT NULL)),
    UNIQUE(owner, name)
);
CREATE TABLE digest_topics(
    digest_id INTEGER NOT NULL REFERENCES digests(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    UNIQUE(digest_id, topic_id)
);
CREATE TABLE digest_groups(
    digest_id INTEGER NOT NULL REFERENCES digests(id),
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(digest_id, group_id)
);
CREATE TABLE digest_issues(
    id INTEGER PRIMARY KEY,
    digest_id INTEGER NOT NULL REFERENCES digests(id),
    kind TEXT NOT NULL,  -- 'nothing'; the AI pass adds its own kind
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT
);
CREATE TABLE digest_runs(
    id INTEGER PRIMARY KEY,
    digest_id INTEGER NOT NULL REFERENCES digests(id),
    trigger TEXT NOT NULL CHECK (trigger IN ('schedule','manual')),
    ran_at TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('nothing','skipped','written')),
    reason TEXT NOT NULL,
    stories INTEGER NOT NULL,
    issue_id INTEGER REFERENCES digest_issues(id)
);
CREATE INDEX idx_digests_next_run ON digests(next_run_at);
CREATE INDEX idx_digest_topics_topic ON digest_topics(topic_id);
CREATE INDEX idx_digest_groups_group ON digest_groups(group_id);
CREATE INDEX idx_digest_issues_digest ON digest_issues(digest_id, id);
CREATE INDEX idx_digest_runs_digest ON digest_runs(digest_id, id);
"""

# The AI pass (step 5). `story_ai`: one row per story the pass has answered for, 'written' (the
# validated fields) or 'invalid' (the model's output for it failed its check: no AI field is kept,
# and the story is not sent again). `story_ai_tries`: a story still waiting for its answer that a
# pass has sent: its paid attempts, the largest batch it may go in next (halved after a reply that
# could not be read) and the time a pass claimed it for its call in flight. `ai_usage`: one row per
# model call, in USD as exact decimal text; `month` (UTC, YYYY-MM) is the month of its reservation,
# where it counts; `owner` the name whose digest a digest-writer call was for (the per-name limit);
# ids are never given again (AUTOINCREMENT: an exchange id carries the call's id, and rows of calls
# not sent are pruned after a day). A call is 'open' while it holds its reservation, 'settled' at
# its actual cost, or 'unknown' (its cost could not be established: it counts at its full
# reservation, never as zero). `settings`: the owner's monthly cap, the switched-off state and the
# digest writer's calls a UTC day, service-wide and per name. `digest_points`: a written issue's
# numbered points, each with the ids of the stories behind it; `digest_issue_ai` the issue's model,
# story count and what it covered when it was written, in words (an old issue never depends on the
# digest's covers now).
# `digests.run_requested_at`: "Run once now" asked while AI is on; the background loop runs it.
# `digests.claimed_by`/`claimed_at`: a run whose model call is in flight (its trigger, its time), so
# a run a crash cut short is found and recorded at the next start.
# `meta.store_id`: a random id made with the store; a model call's exchange id carries it with the
# call's id, so a re-created store never reuses an earlier store's ids (or their homes).
_MIGRATION_5 = """
CREATE TABLE story_ai(
    story_id INTEGER PRIMARY KEY REFERENCES stories(id),
    outcome TEXT NOT NULL CHECK (outcome IN ('written','invalid')),
    why TEXT,
    signal INTEGER CHECK (signal BETWEEN 1 AND 3),
    tags TEXT,
    kind TEXT CHECK (kind IN ('news','regulatory case','rating action','other')),
    stage TEXT CHECK (stage IN ('opened','initial review','in-depth review','decision')),
    moves TEXT,
    config_id TEXT NOT NULL,
    written_at TEXT NOT NULL,
    month TEXT NOT NULL,
    CHECK ((outcome = 'written') = (why IS NOT NULL AND signal IS NOT NULL AND tags IS NOT NULL
        AND kind IS NOT NULL AND moves IS NOT NULL)),
    CHECK (outcome = 'written' OR stage IS NULL)
);
CREATE INDEX idx_story_ai_month ON story_ai(month, outcome);
CREATE TABLE story_ai_tries(
    story_id INTEGER PRIMARY KEY REFERENCES stories(id) ON DELETE CASCADE,
    attempts INTEGER NOT NULL CHECK (attempts >= 0),
    batch INTEGER NOT NULL CHECK (batch BETWEEN 1 AND 20),
    claimed_at TEXT
);
CREATE TABLE ai_usage(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purpose TEXT NOT NULL CHECK (purpose IN ('stories','digest')),
    owner TEXT,
    config_id TEXT NOT NULL,
    month TEXT NOT NULL,
    reserved_usd TEXT NOT NULL,
    settled_usd TEXT,
    status TEXT NOT NULL CHECK (status IN ('open','settled','unknown')),
    outcome TEXT NOT NULL,
    reserved_at TEXT NOT NULL,
    settled_at TEXT,
    CHECK ((status = 'settled') = (settled_usd IS NOT NULL)),
    CHECK ((purpose = 'digest') = (owner IS NOT NULL))
);
CREATE INDEX idx_ai_usage_month ON ai_usage(month, status);
CREATE INDEX idx_ai_usage_day ON ai_usage(purpose, reserved_at);
CREATE TABLE settings(
    key TEXT PRIMARY KEY CHECK (key IN ('ai_cap_usd','ai_switched_off','ai_digests_per_day',
        'ai_digests_per_name')),
    value TEXT NOT NULL,
    set_at TEXT NOT NULL
);
CREATE TABLE digest_issue_ai(
    issue_id INTEGER PRIMARY KEY REFERENCES digest_issues(id) ON DELETE CASCADE,
    stories INTEGER NOT NULL,
    config_id TEXT NOT NULL,
    covers TEXT NOT NULL
);
CREATE TABLE digest_points(
    issue_id INTEGER NOT NULL REFERENCES digest_issues(id) ON DELETE CASCADE,
    number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 10),
    lead TEXT NOT NULL,
    body TEXT NOT NULL,
    story_ids TEXT NOT NULL,
    PRIMARY KEY(issue_id, number)
);
ALTER TABLE digests ADD COLUMN run_requested_at TEXT;
ALTER TABLE digests ADD COLUMN claimed_by TEXT CHECK (claimed_by IN ('schedule','manual'));
ALTER TABLE digests ADD COLUMN claimed_at TEXT;
INSERT INTO meta(key, value) VALUES ('store_id', lower(hex(randomblob(8))));
"""

# Indexes the reads of a long-running service need on the tables of migrations 1 and 2: a
# source's last check (``last_check``, the loop's due check every tick), the checks the ingest pass
# prunes, and a source's recent stories and folded duplicates (``ingest.health``); and the child
# side of the foreign keys a delete follows (a topic's follows, a story's saves, a digest issue's
# runs), so no delete scans a table (tests/test_signal_deletes.py checks every key).
_MIGRATION_6 = """
CREATE INDEX idx_source_checks_source_at ON source_checks(source_id, at, id);
CREATE INDEX idx_stories_source_published ON stories(source_id, published_at);
CREATE INDEX idx_story_duplicates_source_published
    ON story_duplicates(duplicate_source_id, published_at);
CREATE INDEX idx_topic_follows_topic ON topic_follows(topic_id);
CREATE INDEX idx_saves_story ON saves(story_id);
CREATE INDEX idx_digest_runs_issue ON digest_runs(issue_id);
"""

# The issuer watchlist, company filings and the market backdrop
# (docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md). `issuers.aliases` is a JSON
# list; `cik` ten digits or NULL; `source_id` the issuer's filing source while it has a CIK (NULL
# otherwise; unlinked, it is paused, or deleted if never fetched). `issuer_stories` ties a story to
# an issuer (by text, or by the issuer's filing source). `service_settings`: the owner's contact
# string for the SEC and the market post's UTC hour. `market_series`: the FRED series the market
# post reads, in `position` order, each with the date of its newest observation a post carried
# (`posted`, ISO) and the last attempt's outcome (`problem`: why it could not be read, NULL when it
# was; `failing_since`: when it first failed in the current run of failures). `market_posts`: each
# market story's table, exact decimal text and ISO dates (`as_of` its newest observation date).
# `stories.category`: an Atom entry's first category term as the feed gave it (a filing's form
# type); NULL for every other story. `source_logos`: at most one icon per source (``logos``): the
# bytes as fetched (32 KiB at most) and their media type (both NULL until one is stored, or after
# the owner cleared it), the address they came from, the last attempt's time and failure note, the
# image address the source's feed declared, and `cleared` (the owner's: not fetched until
# refreshed). Ids of issuers are never given again (``fresh_id``/``retire_id``).
_MIGRATION_7 = """
CREATE TABLE issuers(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    aliases TEXT NOT NULL,
    cik TEXT UNIQUE CHECK (cik IS NULL OR (length(cik) = 10 AND cik NOT GLOB '*[^0-9]*')),
    library_key TEXT,
    source_id INTEGER UNIQUE REFERENCES sources(id),
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE issuer_stories(
    issuer_id INTEGER NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
    story_id INTEGER NOT NULL REFERENCES stories(id),
    UNIQUE(issuer_id, story_id)
);
CREATE INDEX idx_issuer_stories_story ON issuer_stories(story_id);
CREATE TABLE issuer_follows(
    user_name TEXT NOT NULL,
    issuer_id INTEGER NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
    UNIQUE(user_name, issuer_id)
);
CREATE INDEX idx_issuer_follows_issuer ON issuer_follows(issuer_id);
CREATE TABLE digest_issuers(
    digest_id INTEGER NOT NULL REFERENCES digests(id),
    issuer_id INTEGER NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
    UNIQUE(digest_id, issuer_id)
);
CREATE INDEX idx_digest_issuers_issuer ON digest_issuers(issuer_id);
CREATE TABLE service_settings(
    key TEXT PRIMARY KEY CHECK (key IN ('filings_contact', 'market_hour', 'logos')),
    value TEXT NOT NULL,
    set_at TEXT NOT NULL
);
CREATE TABLE market_series(
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short TEXT NOT NULL,
    unit TEXT NOT NULL,
    source TEXT NOT NULL,
    position INTEGER NOT NULL,
    added_at TEXT NOT NULL,
    posted TEXT,
    problem TEXT,
    failing_since TEXT
);
CREATE TABLE market_posts(
    story_id INTEGER PRIMARY KEY REFERENCES stories(id),
    as_of TEXT NOT NULL,
    rows TEXT NOT NULL
);
CREATE TABLE source_logos(
    source_id INTEGER PRIMARY KEY REFERENCES sources(id),
    data BLOB CHECK (data IS NULL OR length(data) <= 32768),
    media_type TEXT CHECK (media_type IS NULL OR media_type IN
        ('image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/x-icon')),
    url TEXT,
    fetched_at TEXT,
    note TEXT,
    declared TEXT,
    cleared INTEGER NOT NULL DEFAULT 0 CHECK (cleared IN (0, 1)),
    CHECK ((data IS NULL) = (media_type IS NULL))
);
ALTER TABLE stories ADD COLUMN category TEXT;
"""

# Version 8. `digests.story_mark`: the highest story id the digest's last run considered; a run
# covers the stories above it (see ``digests``), so a story stored after a run that was stamped
# before it is still found. A digest that already exists starts at the highest story id fetched
# by its period's start (both are ISO text, compared as text).
_MIGRATION_8 = """
ALTER TABLE digests ADD COLUMN story_mark INTEGER NOT NULL DEFAULT 0;
UPDATE digests SET story_mark = (
    SELECT COALESCE(MAX(id), 0) FROM stories WHERE fetched_at <= digests.period_from
);
"""

# Ordered; later slices append. Index i holds the script that brings the schema to version i + 1.
MIGRATIONS = [
    _MIGRATION_1,
    _MIGRATION_2,
    _MIGRATION_3,
    _MIGRATION_4,
    _MIGRATION_5,
    _MIGRATION_6,
    _MIGRATION_7,
    _MIGRATION_8,
]
_BUSY_SECONDS = 30
RELEASED = 2  # versions a released build made, before stores recorded their scripts' hash


def scripts_hash(version: int) -> str:
    """The sha256 of the migration scripts that bring a store to `version`, as `meta` records it
    (``schema_hash``), so a store made by a build whose scripts differ is told from this one's."""
    digest = hashlib.sha256()
    for script in MIGRATIONS[:version]:
        digest.update(hashlib.sha256(script.encode("utf-8")).digest())
    return digest.hexdigest()


def _schema_version(db: sqlite3.Connection) -> int:
    has_meta = db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'"
    ).fetchone()
    if has_meta is None:
        return 0
    row = db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
    return int(row[0]) if row else 0


@contextmanager
def _write_transaction(db: sqlite3.Connection) -> Iterator[None]:
    """Hold the write lock: commit when the block ends, roll back if it raises."""
    db.execute("BEGIN IMMEDIATE")
    try:
        yield
        db.execute("COMMIT")
    except BaseException:
        if db.in_transaction:
            db.execute("ROLLBACK")
        raise


def _apply_migration(db: sqlite3.Connection, version: int) -> None:
    """Apply one migration under the write lock; skip it if another opener already did."""
    with _write_transaction(db):
        if _schema_version(db) >= version:
            return
        db.execute("CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        db.executescript(MIGRATIONS[version - 1])
        db.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_version', ?)",
            (str(version),),
        )
        db.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_hash', ?)",
            (scripts_hash(version),),
        )


def _made_by(db: sqlite3.Connection) -> tuple[int, str | None]:
    """The store's schema version and its recorded scripts' hash, read in one statement (another
    opener may be migrating it meanwhile; each migration records both in one transaction)."""
    if (
        db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'").fetchone()
        is None
    ):
        return 0, None
    rows = db.execute(
        "SELECT key, value FROM meta WHERE key IN ('schema_version', 'schema_hash')"
    ).fetchall()
    held = {str(row["key"]): str(row["value"]) for row in rows}
    return int(held.get("schema_version", 0)), held.get("schema_hash")


def _check_made_here(db: sqlite3.Connection, folder: Path) -> None:
    """Refuse a store this build's migrations did not make: one of a later version, or one whose
    recorded scripts' hash is not this build's for its version (an earlier commit of a branch whose
    unreleased migrations were since amended). A store of a released version records no hash and
    is accepted: its scripts are unchanged."""
    version, recorded = _made_by(db)
    remedy = (
        f"delete the development store {folder / 'signal.db'} (with its -wal and -shm files)"
        " or open it with the build that made it; deleting it also erases this store's record"
        " of the month's AI spend, so its cap starts the month again from nothing"
    )
    if version > len(MIGRATIONS):
        raise StoreError(
            f"the store is at schema version {version}, later than this build's"
            f" {len(MIGRATIONS)}: {remedy}"
        )
    if recorded is None and version <= RELEASED:
        return
    if recorded != scripts_hash(version):
        raise StoreError(
            f"the store at schema version {version} was made by another build of Signal whose"
            f" migrations differ from this one's: {remedy}"
        )


def _migrate(db: sqlite3.Connection) -> None:
    # executescript leaves an explicit transaction alone only outside legacy transaction control.
    db.autocommit = True
    try:
        for version in range(1, len(MIGRATIONS) + 1):
            if _schema_version(db) < version:
                _apply_migration(db, version)
    finally:
        db.autocommit = sqlite3.LEGACY_TRANSACTION_CONTROL


def _enable_wal(db: sqlite3.Connection) -> None:
    """Switch to WAL. SQLite ignores the busy timeout for this pragma on a fresh file that
    another opener is initialising, so retry on "locked" until the same 30 s deadline."""
    deadline = time.monotonic() + _BUSY_SECONDS
    while True:
        try:
            mode = db.execute("PRAGMA journal_mode=WAL").fetchone()[0]
            break
        except sqlite3.OperationalError as exc:
            if "locked" not in str(exc) or time.monotonic() >= deadline:
                raise
            time.sleep(0.02)
    if str(mode).lower() != "wal":
        raise StoreError(f"could not enable WAL mode; database reports {mode!r}")


def open_db(root: Path) -> sqlite3.Connection:
    """Open (creating if needed) `<root>/signal/signal.db` and apply migrations; StoreError for a
    store this build's migrations did not make (``_check_made_here``)."""
    folder = root / "signal"
    folder.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(folder / "signal.db", timeout=_BUSY_SECONDS)
    try:
        db.row_factory = sqlite3.Row
        _enable_wal(db)
        db.execute("PRAGMA foreign_keys=ON")
        _check_made_here(db, folder)
        _migrate(db)
    except BaseException:
        db.close()
        raise
    return db


def set_meta(db: sqlite3.Connection, key: str, value: str) -> None:
    with db:
        db.execute("INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?)", (key, value))


def get_meta(db: sqlite3.Connection, key: str) -> str | None:
    row = db.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    return str(row["value"]) if row else None


def _utc_text(at: datetime) -> str:
    if at.tzinfo is None or at.utcoffset() is None:
        raise StoreError("time must be timezone-aware")
    return at.astimezone(UTC).isoformat()


def _require(value: str, allowed: tuple[str, ...], what: str) -> None:
    if value not in allowed:
        raise StoreError(f"invalid {what} {value!r}; expected one of {', '.join(allowed)}")


def _require_name(name: str) -> None:
    if not name.strip():
        raise StoreError("name must not be empty")


def plain_text(text: str, limit: int, what: str, *, lines: bool = False) -> str:
    """`text` trimmed, at most `limit` characters, with no control, format or surrogate character
    (a brief may keep its line breaks and tabs: `lines`); StoreError otherwise. A lone surrogate
    is refused here because no database or reply can hold it."""
    cleaned = text.strip()
    allowed = "\n\t" if lines else ""
    odd = any(unicodedata.category(ch)[0] == "C" and ch not in allowed for ch in cleaned)
    if len(cleaned) > limit or odd:
        raise StoreError(f"{what} is at most {limit} characters of plain text")
    if not cleaned and not lines:
        raise StoreError(f"{what} must not be empty")
    return cleaned


def fts_phrase(text: str) -> str:
    """`text` as one quoted FTS5 phrase, so query syntax in it is plain text."""
    return '"' + text.replace("\x00", " ").replace('"', '""') + '"'


def kind_condition(kinds: tuple[str, ...], column: str = "s.source_id") -> str | None:
    """An SQL condition true for a story row whose source is of one of `kinds` (`column` names
    its source id), or None when `kinds` is every kind. The kinds are this module's own names,
    checked here, so the condition holds no outside text."""
    for kind in kinds:
        _require(kind, SOURCE_KINDS, "kind")
    if set(kinds) == set(SOURCE_KINDS):
        return None
    listed = ", ".join(f"'{kind}'" for kind in kinds)
    return f"{column} IN (SELECT id FROM sources WHERE kind IN ({listed}))"


SETTING_KEYS = ("filings_contact", "market_hour", "logos")


def get_setting(db: sqlite3.Connection, key: str) -> str | None:
    """An owner's service setting (``service_settings``), or None when it was never set."""
    _require(key, SETTING_KEYS, "setting")
    row = db.execute("SELECT value FROM service_settings WHERE key=?", (key,)).fetchone()
    return None if row is None else str(row["value"])


def set_setting(db: sqlite3.Connection, key: str, value: str | None, now: datetime) -> None:
    """Store an owner's service setting; None clears it. One write transaction."""
    _require(key, SETTING_KEYS, "setting")
    with _write_transaction(db):
        if value is None:
            db.execute("DELETE FROM service_settings WHERE key=?", (key,))
            return
        db.execute(
            "INSERT INTO service_settings(key, value, set_at) VALUES(?, ?, ?)"
            " ON CONFLICT(key) DO UPDATE SET value=excluded.value, set_at=excluded.set_at",
            (key, value, _utc_text(now)),
        )


def add_user(db: sqlite3.Connection, name: str, role: str) -> int:
    _require_name(name)
    _require(role, ROLES, "role")
    try:
        with db:
            cur = db.execute("INSERT INTO users(name, role) VALUES(?, ?)", (name, role))
    except sqlite3.IntegrityError as exc:
        raise StoreError(f"user {name!r} already exists") from exc
    assert cur.lastrowid is not None
    return cur.lastrowid


def role_of(db: sqlite3.Connection, name: str) -> str:
    row = db.execute("SELECT role FROM users WHERE name=?", (name,)).fetchone()
    return str(row["role"]) if row else "reader"


MAX_SOURCE_NAME = 80
MAX_URL = 512
MAX_PENDING = 5  # proposals one user may have waiting for the owner at a time
MAX_ALL_PENDING = 200  # proposals waiting for the owner in all, whoever made them
_DEFAULT_PORTS = {"http": 80, "https": 443}


_ESCAPE = re.compile(r"%([0-9A-Fa-f]{2})")
# Characters whose escape is decoded: the unreserved ones but the dot. "%2E" stays an escape, so a
# "%2e%2e" is never made a dot segment (and never merged with a literal "..", which a server may
# read differently).
_DECODED = frozenset(string.ascii_letters + string.digits + "-_~")


def _escapes(text: str) -> str:
    """Percent-escapes in one spelling (RFC 3986 6.2.2): an unreserved character's decoded
    ("%7E" is "~"; not the dot: "%2E" stays), any other's hex in upper case ("%2f" is "%2F"). Text
    with a "%" that starts no escape is left as it is: decoding next to it could make a new
    escape of other characters."""
    if "%" in _ESCAPE.sub("", text):
        return text

    def one(found: re.Match[str]) -> str:
        char = chr(int(found.group(1), 16))
        return char if char in _DECODED else "%" + found.group(1).upper()

    return _ESCAPE.sub(one, text)


def canonical_url(url: str) -> str:
    """A feed address in one spelling, so two spellings of one address are one source: the scheme
    and host in lower case, the scheme's default port and the fragment dropped, an empty path "/"
    and an empty query dropped, and the percent-escapes of the path and query in one spelling
    (``_escapes``). Text that is not an http or https address with a host is returned trimmed and
    otherwise as it is (the feed rules refuse it elsewhere)."""
    text = url.strip()
    if any(ch.isspace() for ch in text):  # never an address; left alone so the form is stable
        return text
    try:
        parts = urlsplit(text)
        port = parts.port
    except ValueError:
        return text
    host = parts.hostname
    if host is None or "@" in parts.netloc or parts.scheme.lower() not in _DEFAULT_PORTS:
        return text
    scheme = parts.scheme.lower()
    shown = f"[{host}]" if ":" in host else host
    netloc = shown if port in (None, _DEFAULT_PORTS[scheme]) else f"{shown}:{port}"
    return urlunsplit((scheme, netloc, _escapes(parts.path) or "/", _escapes(parts.query), ""))


def propose_source(db: sqlite3.Connection, name: str, kind: str, url: str, proposed_by: str) -> int:
    return _propose(db, (name, kind, url, proposed_by), None)


def propose_source_limited(
    db: sqlite3.Connection, name: str, kind: str, url: str, proposed_by: str
) -> int:
    """`propose_source` for a user of the service: Conflict when `proposed_by` already has
    `MAX_PENDING` proposals waiting for the owner, or `MAX_ALL_PENDING` wait in all. The counts and
    the insert share one write transaction."""
    return _propose(db, (name, kind, url, proposed_by), MAX_PENDING)


def _propose(
    db: sqlite3.Connection, fields: tuple[str, str, str, str], max_pending: int | None
) -> int:
    name, kind, url, proposed_by = fields
    _require_name(name)
    name = plain_text(name, MAX_SOURCE_NAME, "a source name")
    _require(kind, KINDS, "kind")
    if not url.strip():
        raise StoreError("url must not be empty")
    if len(url) > MAX_URL:
        raise StoreError(f"a source address is at most {MAX_URL} characters")
    url = canonical_url(url)
    with _write_transaction(db):
        if max_pending is not None and _pending(db, proposed_by) >= max_pending:
            raise Conflict(f"you already have {max_pending} proposals waiting for the owner")
        if max_pending is not None and _pending(db, None) >= MAX_ALL_PENDING:
            raise Conflict(
                f"{MAX_ALL_PENDING} proposed sources are waiting for the owner, the most Signal"
                " holds; propose this one once the owner has reviewed them"
            )
        if _spelled_otherwise(db, url):
            raise Conflict(f"source url {url!r} already exists")
        try:
            cur = db.execute(
                "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
                " VALUES(?, ?, ?, 'proposed', ?, ?)",
                (name, kind, url, proposed_by, _utc_text(datetime.now(UTC))),
            )
        except sqlite3.IntegrityError as exc:
            raise Conflict(f"source url {url!r} already exists") from exc
    assert cur.lastrowid is not None
    return cur.lastrowid


def insert_source(db: sqlite3.Connection, name: str, kind: str, url: str, proposed_by: str) -> int:
    """A source of a kind no one proposes by hand (``FILING``, ``MARKET``), stored as proposed,
    inside the caller's write transaction; Conflict when its address is stored already. The
    caller has checked the name and the address."""
    _require(kind, (FILING, MARKET), "kind")
    url = canonical_url(url)
    if _spelled_otherwise(db, url):
        raise Conflict(f"source url {url!r} already exists")
    cur = db.execute(
        "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
        " VALUES(?, ?, ?, 'proposed', ?, ?)",
        (name, kind, url, proposed_by, _utc_text(datetime.now(UTC))),
    )
    assert cur.lastrowid is not None
    return cur.lastrowid


def _spelled_otherwise(db: sqlite3.Connection, url: str) -> bool:
    """Whether a stored source is this address in another spelling: one stored before its
    canonical form was (or a later rule of it), compared by its canonical form now. Sources are
    few (the owner approves each), so every stored address is read."""
    return any(canonical_url(row["url"]) == url for row in db.execute("SELECT url FROM sources"))


def _pending(db: sqlite3.Connection, user_name: str | None) -> int:
    """Hand proposals (the four feed kinds) waiting for the owner: `user_name`'s, or everyone's
    (None). Filing sources an issuer's CIK proposes have their own cap (``issuers``)."""
    row = db.execute(
        "SELECT COUNT(*) FROM sources WHERE state='proposed' AND (? IS NULL OR proposed_by=?)"
        f" AND kind IN ({', '.join('?' * len(KINDS))})",
        (user_name, user_name, *KINDS),
    ).fetchone()
    return int(row[0])


def set_source_state(db: sqlite3.Connection, source_id: int, state: str) -> None:
    _require(state, STATES, "state")
    with db:
        cur = db.execute("UPDATE sources SET state=? WHERE id=?", (state, source_id))
    if cur.rowcount == 0:
        raise StoreError(f"no source with id {source_id}")


STORY_BATCH = 200  # stories one transaction of a source's removal deletes
_STORY_DEPENDENTS = (
    "story_duplicates",
    "topic_stories",
    "saves",
    "story_ai",
    "threads",
    "issuer_stories",
    "market_posts",
)


def fresh_id(db: sqlite3.Connection, table: str) -> int:
    """An id above every one `table` holds and every one removed from it (`retire_id`), for a table
    whose ids the schema may reuse: a removed row's id is never given to another, so a page or a
    saved reference to the old one never lands on the new. In the caller's write transaction."""
    top = db.execute(f"SELECT COALESCE(MAX(id), 0) FROM {table}").fetchone()[0]
    floor = db.execute("SELECT value FROM meta WHERE key=?", (f"{table}_floor",)).fetchone()
    return max(int(top), int(floor[0]) if floor else 0) + 1


def retire_id(db: sqlite3.Connection, table: str, highest: int) -> None:
    """Note that `table` held an id up to `highest` (before removing rows), for ``fresh_id``."""
    db.execute(
        "INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE"
        " SET value = CAST(MAX(CAST(value AS INTEGER), CAST(excluded.value AS INTEGER)) AS TEXT)",
        (f"{table}_floor", str(highest)),
    )


def remove_source(db: sqlite3.Connection, source_id: int, *, with_stories: bool) -> int:
    """Delete a source with its checks and the copies it folded into other stories (the owner, on
    the command line); returns how many stories went. A source that has stories is refused
    (Conflict) unless `with_stories`, which deletes them too, with their topic matches, saves,
    folded copies, AI rows and group threads (comments, reactions and read marks with them),
    STORY_BATCH stories per transaction so the write lock is let go between batches. The source is
    paused first, so no fetch adds to it meanwhile; its stories' ids are never given again."""
    gone = 0
    while True:
        with _write_transaction(db):
            row = db.execute("SELECT 1 FROM sources WHERE id=?", (source_id,)).fetchone()
            if row is None:
                raise Missing(f"no source with id {source_id}")
            user = db.execute("SELECT name FROM issuers WHERE source_id=?", (source_id,)).fetchone()
            if user is not None:
                raise Conflict(
                    f"the issuer {user['name']!r} uses source {source_id} for its filings;"
                    " take the issuer's CIK off first"
                )
            held = db.execute("SELECT COUNT(*) FROM stories WHERE source_id=?", (source_id,))
            count = int(held.fetchone()[0])
            if count and not with_stories:
                raise Conflict(
                    f"source {source_id} has {count:,} stories; remove them with it using"
                    " --with-stories"
                )
            if count:
                db.execute("UPDATE sources SET state='paused' WHERE id=?", (source_id,))
                gone += _remove_stories(db, source_id)
                continue
            for table, column in (
                ("story_duplicates", "duplicate_source_id"),
                ("source_checks", "source_id"),
                ("source_logos", "source_id"),
            ):
                db.execute(f"DELETE FROM {table} WHERE {column}=?", (source_id,))
            db.execute("DELETE FROM sources WHERE id=?", (source_id,))
            return gone


def _remove_stories(db: sqlite3.Connection, source_id: int) -> int:
    """Delete up to STORY_BATCH of the source's stories with what hangs on them; how many."""
    ids = [
        int(row[0])
        for row in db.execute(
            "SELECT id FROM stories WHERE source_id=? ORDER BY id LIMIT ?",
            (source_id, STORY_BATCH),
        )
    ]
    marks = ", ".join("?" * len(ids))
    retire_id(db, "stories", max(ids))
    for table in _STORY_DEPENDENTS:
        db.execute(f"DELETE FROM {table} WHERE story_id IN ({marks})", ids)
    db.execute(f"DELETE FROM stories WHERE id IN ({marks})", ids)
    return len(ids)


def sources(db: sqlite3.Connection, state: str | None = None) -> list[sqlite3.Row]:
    if state is None:
        return db.execute("SELECT * FROM sources ORDER BY id").fetchall()
    _require(state, STATES, "state")
    return db.execute("SELECT * FROM sources WHERE state=? ORDER BY id", (state,)).fetchall()


@dataclass(frozen=True)
class Check:
    """The outcome of one fetch of a source."""

    at: datetime
    ok: bool
    reason: str
    etag: str | None
    modified: str | None
    new_stories: int


def record_check(db: sqlite3.Connection, source_id: int, check: Check) -> None:
    stamp = _utc_text(check.at)
    try:
        with db:
            db.execute(
                "INSERT INTO source_checks(source_id, at, ok, reason, etag, modified, new_stories)"
                " VALUES(?, ?, ?, ?, ?, ?, ?)",
                (
                    source_id,
                    stamp,
                    int(check.ok),
                    check.reason,
                    check.etag,
                    check.modified,
                    check.new_stories,
                ),
            )
    except sqlite3.IntegrityError as exc:
        raise StoreError(f"no source with id {source_id}") from exc


def last_check(db: sqlite3.Connection, source_id: int) -> sqlite3.Row | None:
    row: sqlite3.Row | None = db.execute(
        "SELECT * FROM source_checks WHERE source_id=? ORDER BY at DESC, id DESC LIMIT 1",
        (source_id,),
    ).fetchone()
    return row


def prune_checks(db: sqlite3.Connection, before: datetime, limit: int) -> int:
    """Delete at most `limit` checks made before `before`, never a source's last check; returns
    how many went. One write transaction; each source is read through its own index range."""
    stamp = _utc_text(before)
    gone = 0
    with _write_transaction(db):
        for row in db.execute("SELECT id FROM sources ORDER BY id").fetchall():
            last = last_check(db, row["id"])
            if last is None or gone >= limit:
                continue
            cur = db.execute(
                "DELETE FROM source_checks WHERE id IN (SELECT id FROM source_checks"
                " WHERE source_id = ? AND at < ? AND id != ? ORDER BY at, id LIMIT ?)",
                (row["id"], stamp, last["id"], limit - gone),
            )
            gone += cur.rowcount
    return gone


def _earliest_match(
    db: sqlite3.Connection, source_id: int, lkey: str, tkey: str, published: datetime
) -> int | None:
    """Id of the earliest story with this link key (as a story or a folded duplicate), or, from
    another source, this title key within the window. A source never folds into itself by title,
    and a filing folds by its link only, in both directions: filings of one issuer from two filing
    sources share generic titles ("<issuer>: 8-K, current report") and are distinct filings."""
    filing = f"(SELECT id FROM sources WHERE kind = '{FILING}')"
    rows = db.execute(
        "SELECT id, published_at, link_key = ? AS same_link FROM stories"
        f" WHERE link_key = ? OR (title_key = ? AND source_id != ? AND source_id NOT IN {filing})"
        " UNION ALL"
        " SELECT s.id, s.published_at, 1 AS same_link FROM story_duplicates d"
        " JOIN stories s ON s.id = d.story_id WHERE d.link_key = ? AND s.source_id != ?",
        (lkey, lkey, tkey, source_id, lkey, source_id),
    ).fetchall()
    incoming = db.execute("SELECT kind FROM sources WHERE id=?", (source_id,)).fetchone()
    is_filing = incoming is not None and incoming["kind"] == FILING
    long_title = len(tkey.split()) >= MIN_TITLE_WORDS and not is_filing
    found: list[tuple[datetime, int]] = []
    for row in rows:
        at = datetime.fromisoformat(row["published_at"])
        if row["same_link"] or (long_title and abs(at - published) <= TITLE_WINDOW):
            found.append((at, row["id"]))
    return min(found)[1] if found else None


def _fold_or_insert(
    db: sqlite3.Connection, source_id: int, entry: Entry, fetched_at: datetime
) -> Literal["new", "duplicate", "seen"]:
    if entry.published is not None:
        _utc_text(entry.published)  # refuses a time without a zone
    lkey = link_key(entry.link)
    tkey = title_key(entry.title)
    if db.execute(
        "SELECT 1 FROM stories WHERE source_id=? AND link_key=?"
        " UNION ALL SELECT 1 FROM story_duplicates WHERE duplicate_source_id=? AND link_key=?",
        (source_id, lkey, source_id, lkey),
    ).fetchone():
        return "seen"
    published = entry.published
    if published is None or published > fetched_at:
        published = fetched_at
    stamp = _utc_text(published)
    story_id = _earliest_match(db, source_id, lkey, tkey, published)
    if story_id is not None:
        db.execute(
            "INSERT INTO story_duplicates(story_id, duplicate_source_id, link, link_key,"
            " published_at, seen_at) VALUES(?, ?, ?, ?, ?, ?)",
            (story_id, source_id, entry.link, lkey, stamp, _utc_text(fetched_at)),
        )
        return "duplicate"
    db.execute(
        "INSERT INTO stories(id, source_id, title, link, link_key, title_key, published_at,"
        " fetched_at, summary, category) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            fresh_id(db, "stories"),
            source_id,
            entry.title,
            entry.link,
            lkey,
            tkey,
            stamp,
            _utc_text(fetched_at),
            entry.summary,
            entry.category,
        ),
    )
    return "new"


def add_story(
    db: sqlite3.Connection, source_id: int, entry: Entry, fetched_at: datetime
) -> Literal["new", "duplicate", "seen"]:
    """Store `entry` unless this source has it ("seen") or another story folds it ("duplicate").

    The check and the write share one write-locked transaction, so two writers cannot both
    insert the same story."""
    with _write_transaction(db):
        return _fold_or_insert(db, source_id, entry, fetched_at)
