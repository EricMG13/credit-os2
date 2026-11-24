"""Digests: a user's saved brief plus a schedule, and the runs that follow it (spec 5.8).

A digest has one owner, who alone sees it. It covers "All stories", or topics and groups (a group
only while the owner can see it). Its schedule is a ``schedule.Schedule`` (UTC). Its brief has five
parts: the subject (the form's brief text), the period (the schedule's own day, week or month), the
number of points, what to list as upcoming and the look-ahead days. Its length is short or standard.
A user has at most ``MAX_DIGESTS`` digests.

A run gathers the stories in scope for the period, highest signal first (the AI pass's 1 to 3; a
story with none comes after those with one), then newest first, at most ``SCOPE_CAP``: the stories
of the covered topics published in the period, and the stories shared in the covered groups (a
thread started from a story) in the period. With none in scope it stores an issue saying nothing
material happened and makes no model call. With some in scope it needs a ``Writer`` (the AI pass's,
``ai_digest``, given only while the pass is on); without one no issue is written and the run is
recorded as skipped, with the reason.

A run with a writer makes its model call outside every transaction: a first write transaction
reads the scope (a scheduled run also claims its slot there, by moving ``next_run_at`` on, so no
other runner takes it); the writer then drafts the issue, holding no lock; a second write
transaction re-reads the digest and stores the issue only if the digest still exists with the same
settings and the same period start. A draft for a digest that changed meanwhile is dropped (its
call is already paid and counted). A writer that fails (``WriterFailed``: the call was refused,
failed or came back invalid) stores no issue and leaves the period where it was, so the next run
covers it again.

Every run, whatever its outcome, ends its period and the next period starts there, so a period is
as long as the time since the last run: one schedule period, plus the downtime a late run catches
up. A digest whose schedule changes starts its new period no earlier than one new period before its
next run. A digest left with nothing to cover (its topics and groups were deleted, or its groups
are no longer visible to its owner) runs as skipped, with the reason ``NO_COVER``, and writes no
issue: it never says that nothing material happened.

Runs are due when ``next_run_at`` has passed. A digest whose time passed while the service was down
runs once at the next start: the run covers the whole gap and the next run is the first slot after
now. A run that fails because the database is busy or locked (SQLITE_BUSY, SQLITE_LOCKED), or
whose model call failed in a way that may pass (``WriterFailed.transient``: the provider asked to
be called later), is left due, so the next tick retries it, and the pass says how many it left
(``Ran.left_due``); any other failure, a lasting database fault included, is recorded as skipped
and the digest moves to its next slot. Every write is one write transaction.
"""

from __future__ import annotations

import logging
import sqlite3
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal, Protocol

from deploy_workflow.signal import groups, schedule
from deploy_workflow.signal.store import (
    Conflict,
    Missing,
    StoreError,
    _require,
    _utc_text,
    _write_transaction,
    plain_text,
)

log = logging.getLogger(__name__)

MAX_DIGESTS = 5
MAX_NAME = 60
MAX_SUBJECT = 500
MAX_UPCOMING = 200
MAX_COVERS = 10
SCOPE_CAP = 60
DEFAULT_LOOK_AHEAD = 7
MAX_LOOK_AHEAD = 60
KEEP_ISSUES = 60  # issues kept per digest; older ones are dropped as new ones are written
KEEP_RUNS = 120

COVER_ALL = "All stories"
TOPIC_PREFIX = "Topic: "
GROUP_PREFIX = "Group: "
# What the form offers for length, and what each choice stores: (length, number of points).
LENGTHS = {
    "Up to 3 points": ("short", 3),
    "Up to 5 points": ("standard", 5),
    "Up to 8 points": ("standard", 8),
}
DEFAULT_LENGTH = "Up to 5 points"
DEFAULT_SCHEDULE = "Weekly, Friday 07:00 UTC"
SKIPPED = "the AI pass is off, so no issue was written for the stories in scope"
NO_COVER = "the digest covers nothing now, so no issue was written"
NOTHING = "nothing"  # the kind of an issue saying that no story reached the digest
WRITTEN = "written"  # the kind of an issue the AI pass wrote, with its points
CHANGED = "the digest changed while its issue was being written; run it again"
NOT_WRITTEN = "no issue was written: "  # a writer's failure; the run leaves the period as it was
ISSUE_KINDS = (NOTHING, WRITTEN)

Outcome = Literal["nothing", "skipped", "written"]
Trigger = Literal["schedule", "manual"]


@dataclass(frozen=True)
class Spec:
    """A digest as the owner built it, checked and with its covers resolved to ids."""

    name: str
    schedule: schedule.Schedule
    covers_all: bool
    topic_ids: tuple[int, ...]
    group_ids: tuple[int, ...]
    subject: str
    length: str
    points: int
    upcoming: str = ""
    look_ahead_days: int = DEFAULT_LOOK_AHEAD


@dataclass(frozen=True)
class Digest:
    id: int
    owner: str
    spec: Spec
    period_from: datetime
    next_run_at: datetime


@dataclass(frozen=True)
class Issue:
    id: int
    digest_id: int
    kind: str
    period_start: datetime
    period_end: datetime
    created_at: datetime
    read: bool


@dataclass(frozen=True)
class ScopedStory:
    id: int
    title: str
    summary: str
    link: str
    source: str
    published_at: datetime
    why: str | None = None  # the AI line, when the pass wrote one
    signal: int | None = None


@dataclass(frozen=True)
class Scope:
    """What a run found: the digest, its period and the stories in scope (newest first)."""

    digest: Digest
    start: datetime
    end: datetime
    stories: tuple[ScopedStory, ...]


@dataclass(frozen=True)
class Run:
    outcome: Outcome
    issue_id: int | None
    stories: int
    reason: str


class WriterFailed(Exception):
    """The writer wrote no issue: its call was refused or failed, or its result was invalid.
    `transient`: the failure may pass (the provider asked to be called later), so the run is left
    due rather than recorded."""

    def __init__(self, reason: str, *, transient: bool = False) -> None:
        super().__init__(reason)
        self.transient = transient


class _RetryLater(Exception):
    """A run left due: its writer's failure may pass."""


class Ran(list[tuple[int, "Run"]]):
    """The runs a pass made, and the digests it left due for the next tick (`left_due`)."""

    def __init__(self) -> None:
        super().__init__()
        self.left_due: list[int] = []


class Writer(Protocol):
    """The AI pass's digest writer (``ai_digest``). None in its place: AI is off or at its cap."""

    def draft(self, scope: Scope) -> object:
        """Make the one model call for `scope` and return the validated result; WriterFailed
        otherwise. Called outside every transaction."""
        ...

    def store(self, db: sqlite3.Connection, scope: Scope, draft: object, now: datetime) -> int:
        """Store the issue `draft` describes inside the caller's write transaction; its id."""
        ...


@dataclass(frozen=True)
class Form:
    """The body of a create or edit request, as the screens deliver it."""

    name: str
    covers: Sequence[str]
    schedule: str
    length: str
    brief: str
    upcoming: str = ""
    look_ahead_days: int = DEFAULT_LOOK_AHEAD


# Building a spec from the form's strings


def _lookup(db: sqlite3.Connection, sql: str, name: str, what: str) -> int:
    try:
        row = db.execute(sql, (name,)).fetchone()
    except UnicodeEncodeError:  # a lone surrogate: no name stored can match it
        row = None
    if row is None:
        raise StoreError(f"there is no {what} called {name!r}")
    return int(row["id"])


def _resolve_covers(
    db: sqlite3.Connection, owner: str, covers: Sequence[str]
) -> tuple[bool, tuple[int, ...], tuple[int, ...]]:
    """(covers all stories, topic ids, group ids) for the cover choices of the form."""
    chosen = list(dict.fromkeys(covers))
    if not chosen or len(chosen) > MAX_COVERS:
        raise StoreError(f"choose from 1 to {MAX_COVERS} things to cover")
    if COVER_ALL in chosen:
        if len(chosen) > 1:
            raise StoreError(f"{COVER_ALL!r} covers every story; choose it alone")
        return True, (), ()
    visible = set(groups.visible_group_ids(db, owner))
    topic_ids: list[int] = []
    group_ids: list[int] = []
    for text in chosen:
        if text.startswith(TOPIC_PREFIX):
            sql = "SELECT id FROM topics WHERE name=?"
            topic_ids.append(_lookup(db, sql, text[len(TOPIC_PREFIX) :], "topic"))
        elif text.startswith(GROUP_PREFIX):
            found = _lookup(
                db, "SELECT id FROM groups WHERE name=?", text[len(GROUP_PREFIX) :], "group"
            )
            if found not in visible:  # a group the owner cannot see is answered as one not there
                raise StoreError(f"there is no group called {text[len(GROUP_PREFIX) :]!r}")
            group_ids.append(found)
        else:
            raise StoreError(f"{text[:60]!r} is not one of the things a digest can cover")
    return False, tuple(topic_ids), tuple(group_ids)


def spec_from_form(db: sqlite3.Connection, owner: str, form: Form) -> Spec:
    """Check a form and resolve it; StoreError names the first thing that is not accepted."""
    if form.length not in LENGTHS:
        raise StoreError(f"{form.length[:60]!r} is not one of the lengths offered")
    if not 0 <= form.look_ahead_days <= MAX_LOOK_AHEAD:
        raise StoreError(f"look-ahead days are from 0 to {MAX_LOOK_AHEAD}")
    try:
        when = schedule.parse(form.schedule)
    except schedule.ScheduleError as error:
        raise StoreError(str(error)) from None
    covers_all, topic_ids, group_ids = _resolve_covers(db, owner, form.covers)
    length, points = LENGTHS[form.length]
    return Spec(
        name=plain_text(form.name, MAX_NAME, "the name"),
        schedule=when,
        covers_all=covers_all,
        topic_ids=topic_ids,
        group_ids=group_ids,
        subject=plain_text(form.brief, MAX_SUBJECT, "the brief", lines=True),
        length=length,
        points=points,
        upcoming=plain_text(form.upcoming, MAX_UPCOMING, "the upcoming list", lines=True),
        look_ahead_days=form.look_ahead_days,
    )


def length_label(spec: Spec) -> str:
    """The form's words for a digest's length."""
    return next(
        text
        for text, (kind, points) in LENGTHS.items()
        if (kind, points) == (spec.length, spec.points)
    )


# Storing digests


def _row(db: sqlite3.Connection, digest_id: int) -> sqlite3.Row | None:
    found: sqlite3.Row | None = db.execute(
        "SELECT * FROM digests WHERE id=?", (digest_id,)
    ).fetchone()
    return found


def _ids(db: sqlite3.Connection, table: str, column: str, digest_id: int) -> tuple[int, ...]:
    rows = db.execute(
        f"SELECT {column} FROM {table} WHERE digest_id=? ORDER BY {column}", (digest_id,)
    )
    return tuple(int(row[0]) for row in rows)


def _digest(db: sqlite3.Connection, row: sqlite3.Row) -> Digest:
    when = schedule.Schedule(row["cadence"], row["minute"], row["weekday"], row["month_day"])
    spec = Spec(
        name=row["name"],
        schedule=when,
        covers_all=bool(row["covers_all"]),
        topic_ids=_ids(db, "digest_topics", "topic_id", row["id"]),
        group_ids=_ids(db, "digest_groups", "group_id", row["id"]),
        subject=row["subject"],
        length=row["length"],
        points=row["points"],
        upcoming=row["upcoming"],
        look_ahead_days=row["look_ahead_days"],
    )
    return Digest(
        row["id"],
        row["owner"],
        spec,
        datetime.fromisoformat(row["period_from"]),
        datetime.fromisoformat(row["next_run_at"]),
    )


def owned(db: sqlite3.Connection, owner: str, digest_id: int) -> Digest:
    """The digest, or Missing: another user's digest is answered as one that does not exist."""
    row = _row(db, digest_id)
    if row is None or row["owner"] != owner:
        raise Missing(f"no digest with id {digest_id}")
    return _digest(db, row)


def list_digests(db: sqlite3.Connection, owner: str) -> list[Digest]:
    rows = db.execute("SELECT * FROM digests WHERE owner=? ORDER BY id", (owner,)).fetchall()
    return [_digest(db, row) for row in rows]


def _store_covers(db: sqlite3.Connection, digest_id: int, spec: Spec) -> None:
    """Replace the digest's covers; Conflict when a topic or group was removed since the form was
    checked (the whole write then rolls back)."""
    db.execute("DELETE FROM digest_topics WHERE digest_id=?", (digest_id,))
    db.execute("DELETE FROM digest_groups WHERE digest_id=?", (digest_id,))
    try:
        db.executemany(
            "INSERT INTO digest_topics(digest_id, topic_id) VALUES(?, ?)",
            [(digest_id, topic_id) for topic_id in spec.topic_ids],
        )
        db.executemany(
            "INSERT INTO digest_groups(digest_id, group_id) VALUES(?, ?)",
            [(digest_id, group_id) for group_id in spec.group_ids],
        )
    except sqlite3.IntegrityError as exc:
        raise Conflict("a topic or group you chose was removed just now; choose again") from exc


def _fields(spec: Spec) -> tuple[Any, ...]:
    """The columns a spec sets, in the order `create` and `edit` write them."""
    when = spec.schedule
    return (
        spec.name,
        when.cadence,
        when.minute,
        when.weekday,
        when.day,
        int(spec.covers_all),
        spec.subject,
        spec.length,
        spec.points,
        spec.upcoming,
        spec.look_ahead_days,
    )


def create(db: sqlite3.Connection, owner: str, spec: Spec, now: datetime) -> int:
    """Store a new digest; Conflict at `MAX_DIGESTS` or when the owner already has that name."""
    first = schedule.next_run(spec.schedule, now)
    with _write_transaction(db):
        count = db.execute("SELECT COUNT(*) FROM digests WHERE owner=?", (owner,)).fetchone()[0]
        if count >= MAX_DIGESTS:
            raise Conflict(f"you already have {MAX_DIGESTS} digests; delete one first")
        try:
            cur = db.execute(
                "INSERT INTO digests(owner, name, cadence, minute, weekday, month_day, covers_all,"
                " subject, length, points, upcoming, look_ahead_days, period_from, next_run_at,"
                " created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    owner,
                    *_fields(spec),
                    _utc_text(schedule.previous_run(spec.schedule, first)),
                    _utc_text(first),
                    _utc_text(now),
                ),
            )
        except sqlite3.IntegrityError as exc:
            raise Conflict(f"you already have a digest called {spec.name!r}") from exc
        assert cur.lastrowid is not None
        _store_covers(db, cur.lastrowid, spec)
    return cur.lastrowid


def edit(db: sqlite3.Connection, owner: str, digest_id: int, spec: Spec, now: datetime) -> None:
    """Replace a digest's settings. Its issues stay. A changed schedule is next due after `now`, and
    its first period starts no earlier than one new period before that run."""
    with _write_transaction(db):
        old = owned(db, owner, digest_id)
        due, period_from = old.next_run_at, old.period_from
        if old.spec.schedule != spec.schedule:
            due = schedule.next_run(spec.schedule, now)
            period_from = max(period_from, schedule.previous_run(spec.schedule, due))
        try:
            db.execute(
                "UPDATE digests SET name=?, cadence=?, minute=?, weekday=?, month_day=?,"
                " covers_all=?, subject=?, length=?, points=?, upcoming=?, look_ahead_days=?,"
                " next_run_at=?, period_from=? WHERE id=?",
                (*_fields(spec), _utc_text(due), _utc_text(period_from), digest_id),
            )
        except sqlite3.IntegrityError as exc:
            raise Conflict(f"you already have a digest called {spec.name!r}") from exc
        _store_covers(db, digest_id, spec)


def delete(db: sqlite3.Connection, owner: str, digest_id: int) -> None:
    """Delete a digest with its covers, issues and runs."""
    with _write_transaction(db):
        owned(db, owner, digest_id)
        for table in ("digest_runs", "digest_issues", "digest_topics", "digest_groups"):
            db.execute(f"DELETE FROM {table} WHERE digest_id=?", (digest_id,))
        db.execute("DELETE FROM digests WHERE id=?", (digest_id,))


def cover_texts(db: sqlite3.Connection, digest: Digest) -> list[str]:
    """What the digest covers in the form's words; a group its owner cannot see is left out."""
    if digest.spec.covers_all:
        return [COVER_ALL]
    texts = []
    for topic_id in digest.spec.topic_ids:
        row = db.execute("SELECT name FROM topics WHERE id=?", (topic_id,)).fetchone()
        texts.append(TOPIC_PREFIX + row["name"])
    visible = set(groups.visible_group_ids(db, digest.owner))
    for group_id in digest.spec.group_ids:
        row = db.execute("SELECT name FROM groups WHERE id=?", (group_id,)).fetchone()
        if group_id in visible:
            texts.append(GROUP_PREFIX + row["name"])
    return texts


def cover_options(db: sqlite3.Connection, owner: str | None) -> list[str]:
    """Every cover the owner may choose: all stories, the groups they can see, the topics.
    With no owner (a viewer with no name) the groups are left out."""
    options = [COVER_ALL]
    if owner is not None:
        for group_id in groups.visible_group_ids(db, owner):
            row = db.execute("SELECT name FROM groups WHERE id=?", (group_id,)).fetchone()
            options.append(GROUP_PREFIX + row["name"])
    options += [
        TOPIC_PREFIX + row["name"] for row in db.execute("SELECT name FROM topics ORDER BY id")
    ]
    return options


def covers_nothing(db: sqlite3.Connection, digest: Digest) -> bool:
    """Whether the digest has no cover left: not all stories, no topic, and no group its owner can
    see. A digest is left so when its topics or groups are deleted or its owner leaves the groups;
    editing it to choose a cover starts it again."""
    spec = digest.spec
    if spec.covers_all or spec.topic_ids:
        return False
    return not set(spec.group_ids) & set(groups.visible_group_ids(db, digest.owner))


# Issues and reading them


def _issue(row: sqlite3.Row) -> Issue:
    return Issue(
        row["id"],
        row["digest_id"],
        row["kind"],
        datetime.fromisoformat(row["period_start"]),
        datetime.fromisoformat(row["period_end"]),
        datetime.fromisoformat(row["created_at"]),
        row["read_at"] is not None,
    )


def recent_issues(db: sqlite3.Connection, digest_id: int, limit: int) -> list[Issue]:
    """The digest's newest issues, newest first."""
    rows = db.execute(
        "SELECT * FROM digest_issues WHERE digest_id=? ORDER BY id DESC LIMIT ?", (digest_id, limit)
    ).fetchall()
    return [_issue(row) for row in rows]


def mark_read(
    db: sqlite3.Connection, owner: str, digest_id: int, issue_id: int | None, now: datetime
) -> None:
    """Mark one issue (or, with None, every issue) of the owner's digest read."""
    with _write_transaction(db):
        owned(db, owner, digest_id)
        if (
            issue_id is not None
            and not db.execute(
                "SELECT 1 FROM digest_issues WHERE id=? AND digest_id=?", (issue_id, digest_id)
            ).fetchone()
        ):
            raise Missing(f"no issue with id {issue_id} in this digest")
        db.execute(
            "UPDATE digest_issues SET read_at=? WHERE digest_id=? AND read_at IS NULL"
            " AND (? IS NULL OR id=?)",
            (_utc_text(now), digest_id, issue_id, issue_id),
        )


# Running digests


def _marks(count: int) -> str:
    return ", ".join("?" * count)


def _scope_stories(
    db: sqlite3.Connection, digest: Digest, start: datetime, end: datetime
) -> tuple[ScopedStory, ...]:
    """The stories in scope for (start, end], highest signal then newest first, at most
    `SCOPE_CAP`."""
    span = [_utc_text(start), _utc_text(end)]
    spec = digest.spec
    parts: list[str] = []
    params: list[Any] = []
    if spec.covers_all:
        parts.append("SELECT id FROM stories WHERE published_at > ? AND published_at <= ?")
        params += span
    if spec.topic_ids:
        parts.append(
            "SELECT s.id FROM stories s JOIN topic_stories ts ON ts.story_id = s.id"
            f" WHERE ts.topic_id IN ({_marks(len(spec.topic_ids))})"
            " AND s.published_at > ? AND s.published_at <= ?"
        )
        params += [*spec.topic_ids, *span]
    seen = sorted(set(spec.group_ids) & set(groups.visible_group_ids(db, digest.owner)))
    if seen:
        parts.append(
            f"SELECT story_id FROM threads WHERE group_id IN ({_marks(len(seen))})"
            " AND story_id IS NOT NULL AND created_at > ? AND created_at <= ?"
        )
        params += [*seen, *span]
    if not parts:
        return ()
    rows = db.execute(
        "SELECT s.id, s.title, s.summary, s.link, s.published_at, src.name AS source,"
        " a.why, a.signal FROM stories s JOIN sources src ON src.id = s.source_id"
        " LEFT JOIN story_ai a ON a.story_id = s.id AND a.outcome = 'written'"
        f" WHERE s.id IN ({' UNION '.join(parts)})"
        " ORDER BY COALESCE(a.signal, 0) DESC, s.published_at DESC, s.id DESC LIMIT ?",
        [*params, SCOPE_CAP],
    ).fetchall()
    return tuple(
        ScopedStory(
            row["id"],
            row["title"],
            row["summary"],
            row["link"],
            row["source"],
            datetime.fromisoformat(row["published_at"]),
            row["why"],
            row["signal"],
        )
        for row in rows
    )


def add_issue(db: sqlite3.Connection, scope: Scope, kind: str, now: datetime) -> int:
    """Store an issue of `scope`'s period inside the caller's write transaction; its id. Only the
    kinds this build draws (``ISSUE_KINDS``) are stored (SQLite cannot add a CHECK to the table
    without rebuilding it)."""
    _require(kind, ISSUE_KINDS, "issue kind")
    cur = db.execute(
        "INSERT INTO digest_issues(digest_id, kind, period_start, period_end, created_at)"
        " VALUES(?, ?, ?, ?, ?)",
        (scope.digest.id, kind, _utc_text(scope.start), _utc_text(scope.end), _utc_text(now)),
    )
    assert cur.lastrowid is not None
    return cur.lastrowid


def _prune(db: sqlite3.Connection, digest_id: int) -> None:
    """Keep the newest `KEEP_ISSUES` issues and `KEEP_RUNS` runs of a digest."""
    older = "SELECT id FROM digest_issues WHERE digest_id=? ORDER BY id DESC LIMIT -1 OFFSET ?"
    db.execute(
        f"UPDATE digest_runs SET issue_id=NULL WHERE issue_id IN ({older})",
        (digest_id, KEEP_ISSUES),
    )
    db.execute(f"DELETE FROM digest_issues WHERE id IN ({older})", (digest_id, KEEP_ISSUES))
    db.execute(
        "DELETE FROM digest_runs WHERE id IN"
        " (SELECT id FROM digest_runs WHERE digest_id=? ORDER BY id DESC LIMIT -1 OFFSET ?)",
        (digest_id, KEEP_RUNS),
    )


def _record(
    db: sqlite3.Connection, scope: Scope, run: Run, trigger: Trigger, now: datetime
) -> None:
    db.execute(
        "INSERT INTO digest_runs(digest_id, trigger, ran_at, period_start, period_end, outcome,"
        " reason, stories, issue_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            scope.digest.id,
            trigger,
            _utc_text(now),
            _utc_text(scope.start),
            _utc_text(scope.end),
            run.outcome,
            run.reason,
            run.stories,
            run.issue_id,
        ),
    )


def _plan(
    db: sqlite3.Connection,
    digest: Digest,
    now: datetime,
    trigger: Trigger,
    writer: Writer | None,
) -> Run | Scope:
    """Inside the caller's write transaction: a run that needs no model call is made here (its Run);
    one that does returns its scope, with a scheduled run's slot claimed."""
    start = min(digest.period_from, now)
    bare = covers_nothing(db, digest)
    stories = () if bare else _scope_stories(db, digest, start, now)
    scope = Scope(digest, start, now, stories)
    db.execute("UPDATE digests SET run_requested_at=NULL WHERE id=?", (digest.id,))
    if trigger == "schedule":
        due = schedule.next_run(digest.spec.schedule, now)
        db.execute("UPDATE digests SET next_run_at=? WHERE id=?", (_utc_text(due), digest.id))
    if stories and writer is not None and not bare:
        return scope
    if bare:
        run = Run("skipped", None, 0, NO_COVER)
    elif not stories:
        run = Run("nothing", add_issue(db, scope, NOTHING, now), 0, "no story was in scope")
    else:
        run = Run("skipped", None, len(stories), SKIPPED)
    _close(db, scope, run, trigger, now)
    return run


def _close(db: sqlite3.Connection, scope: Scope, run: Run, trigger: Trigger, now: datetime) -> None:
    """Record the run and end its period (every run but a failed write does, so a period is never
    longer than the time since the last run; the stories of a skipped run are not carried on)."""
    _record(db, scope, run, trigger, now)
    if not run.reason.startswith(NOT_WRITTEN):
        db.execute("UPDATE digests SET period_from=? WHERE id=?", (_utc_text(now), scope.digest.id))
    _prune(db, scope.digest.id)


def _unchanged(db: sqlite3.Connection, scope: Scope) -> bool:
    """Whether the digest still exists with the settings and period start of its scope."""
    row = _row(db, scope.digest.id)
    if row is None:
        return False
    now = _digest(db, row)
    return (now.owner, now.spec, now.period_from) == (
        scope.digest.owner,
        scope.digest.spec,
        scope.digest.period_from,
    )


def _write(
    db: sqlite3.Connection, scope: Scope, trigger: Trigger, writer: Writer, now: datetime
) -> Run | None:
    """Draft the issue outside any transaction, then store it in one; None when the digest changed
    meanwhile (nothing is stored then). _RetryLater when the writer's failure may pass: the digest
    is made due again, with its period as it was."""
    count = len(scope.stories)
    try:
        draft = writer.draft(scope)
    except WriterFailed as failed:
        if failed.transient:
            _due_again(db, scope, trigger, now)
            raise _RetryLater(str(failed)) from None
        run = Run("skipped", None, count, f"{NOT_WRITTEN}{failed}")
        with _write_transaction(db):
            if not _unchanged(db, scope):
                return None
            _close(db, scope, run, trigger, now)  # the period stays where it was
        return run
    with _write_transaction(db):
        if not _unchanged(db, scope):
            log.warning("digest %s changed while its issue was written; dropped", scope.digest.id)
            return None
        run = Run("written", writer.store(db, scope, draft, now), count, "written by the AI pass")
        _close(db, scope, run, trigger, now)
    return run


def _due_again(db: sqlite3.Connection, scope: Scope, trigger: Trigger, now: datetime) -> None:
    """Undo a run's claim: a scheduled run is due at its old time again, a manual one asked again."""
    with _write_transaction(db):
        if not _unchanged(db, scope):
            return
        if trigger == "schedule":
            stamp = _utc_text(scope.digest.next_run_at)
            db.execute("UPDATE digests SET next_run_at=? WHERE id=?", (stamp, scope.digest.id))
        else:
            db.execute(
                "UPDATE digests SET run_requested_at=? WHERE id=?",
                (_utc_text(now), scope.digest.id),
            )


def run_now(
    db: sqlite3.Connection,
    owner: str,
    digest_id: int,
    now: datetime,
    writer: Writer | None = None,
) -> Run:
    """ "Run once now": a run of the owner's digest that leaves its schedule as it was. With a
    writer the model call is made outside any transaction; Conflict (``CHANGED``) when the digest
    changed while its issue was being written. A writer's failure that may pass leaves the run
    asked for, so the background loop tries it again."""
    with _write_transaction(db):
        planned = _plan(db, owned(db, owner, digest_id), now, "manual", writer)
    if isinstance(planned, Run):
        return planned
    assert writer is not None
    try:
        run = _write(db, planned, "manual", writer, now)
    except _RetryLater as later:
        reason = f"{NOT_WRITTEN}{later}; the run is tried again within a minute"
        return Run("skipped", None, len(planned.stories), reason)
    if run is None:
        raise Conflict(CHANGED)
    return run


def request_run(db: sqlite3.Connection, owner: str, digest_id: int, now: datetime) -> None:
    """Ask the background loop to run the owner's digest once (``run_due``): "Run once now" while
    AI is on, so no model call is made in a request handler."""
    with _write_transaction(db):
        owned(db, owner, digest_id)
        db.execute("UPDATE digests SET run_requested_at=? WHERE id=?", (_utc_text(now), digest_id))


def _run_scheduled(
    db: sqlite3.Connection, digest_id: int, now: datetime, writer: Writer | None
) -> Run | None:
    """The digest's scheduled run, or the run its owner asked for; None when neither is due now
    (deleted, or another runner took it, since the list was read)."""
    with _write_transaction(db):
        row = _row(db, digest_id)
        if row is None:
            return None
        trigger: Trigger = "schedule"
        if datetime.fromisoformat(row["next_run_at"]) > now:
            if row["run_requested_at"] is None:
                return None
            trigger = "manual"
        planned = _plan(db, _digest(db, row), now, trigger, writer)
    if isinstance(planned, Run):
        return planned
    assert writer is not None
    return _write(db, planned, trigger, writer, now)


def _record_failure(db: sqlite3.Connection, digest_id: int, now: datetime, name: str) -> None:
    """A run that raised is recorded as skipped and the digest moves to its next slot, with its
    period ended, so one bad digest is not retried on every pass and its period does not grow."""
    with _write_transaction(db):
        row = _row(db, digest_id)
        if row is None:
            return
        digest = _digest(db, row)
        scope = Scope(digest, min(digest.period_from, now), now, ())
        reason = f"the run failed ({name}); see the log"
        _record(db, scope, Run("skipped", None, 0, reason), "schedule", now)
        due = schedule.next_run(digest.spec.schedule, now)
        db.execute(
            "UPDATE digests SET next_run_at=?, period_from=?, run_requested_at=NULL WHERE id=?",
            (_utc_text(due), _utc_text(now), digest_id),
        )


def _fail(db: sqlite3.Connection, digest_id: int, now: datetime, error: Exception) -> bool:
    """Record a failed run; if recording fails too, log it, leave the digest due and say so."""
    try:
        _record_failure(db, digest_id, now, type(error).__name__)
    except sqlite3.Error:
        log.exception("digest %s: the failure could not be recorded", digest_id)
        return False
    return True


_RETRIED = (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED)


def _passing(error: sqlite3.OperationalError) -> bool:
    """Whether the fault may pass: the database was busy or locked (extended codes included)."""
    code = getattr(error, "sqlite_errorcode", None)
    return isinstance(code, int) and code & 0xFF in _RETRIED


def run_due(db: sqlite3.Connection, now: datetime, writer: Writer | None = None) -> Ran:
    """Run every digest whose time has come, once each, however many periods it missed, and every
    digest whose owner asked for a run (``request_run``).

    A digest whose run raises is logged and recorded as skipped, its digest moved to its next
    slot, unless the fault may pass (the database was busy or locked, or the writer's failure is
    transient): that one is left due for the next tick and listed in ``left_due``. Either way the
    pass goes on to the others, even when recording a failure fails too."""
    due = db.execute(
        "SELECT id FROM digests WHERE next_run_at <= ? OR run_requested_at IS NOT NULL"
        " ORDER BY next_run_at, id",
        (_utc_text(now),),
    ).fetchall()
    results = Ran()
    for row in due:
        try:
            run = _run_scheduled(db, row["id"], now, writer)
        except _RetryLater:
            log.warning("digest %s: its model call may pass; it stays due", row["id"])
            results.left_due.append(row["id"])
            continue
        except sqlite3.OperationalError as error:
            if not _passing(error):
                log.exception("digest %s failed (a lasting database fault)", row["id"])
                if not _fail(db, row["id"], now, error):
                    results.left_due.append(row["id"])
                continue
            log.exception("digest %s could not run now (database busy or locked)", row["id"])
            results.left_due.append(row["id"])
            continue
        except Exception as error:
            log.exception("digest %s failed", row["id"])
            if not _fail(db, row["id"], now, error):
                results.left_due.append(row["id"])
            continue
        if run is not None:
            results.append((row["id"], run))
    return results


__all__ = [
    "Digest",
    "Form",
    "Issue",
    "Run",
    "Scope",
    "ScopedStory",
    "Spec",
    "Writer",
    "WriterFailed",
    "add_issue",
    "create",
    "delete",
    "edit",
    "mark_read",
    "owned",
    "request_run",
    "run_due",
    "run_now",
    "spec_from_form",
]
