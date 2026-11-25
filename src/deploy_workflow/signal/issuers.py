"""The issuer watchlist: issuers, follows, the stories that belong to each, and the filing source
an issuer's SEC CIK proposes (docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md).

An issuer has a name, up to ``MAX_ALIASES`` aliases (other names and tickers it goes by), an
optional CIK (exactly ten ASCII digits) and an optional library key (text the page links to the
issuer library with; Signal never reads the library). Writers and the owner keep issuers; every
user may follow one. Ids are never given again (``store.fresh_id``/``store.retire_id``).

The matching rule. The name and every alias hold at least ``MIN_MARKS`` letters or digits. A story
belongs to an issuer when its title or stored summary holds the name or an alias as a phrase of
whole tokens, through the FTS5 index topics use (its tokens are runs of letters and digits, matched
without regard to case or accents): "Next" does not match "Nextdoor", but does match the word "next"
in a sentence, the known limit of a common-word alias. A phrase (compared case-folded) belongs to
one issuer. A new story is matched in its topics' write transaction (``topics.match_story`` calls
``link_story``); creating an issuer, or changing its name or aliases, re-matches every stored story
in that write transaction with one index query (the phrases joined by OR), whatever the store
holds. A filing story belongs to the issuer whose filing source stored it, never by text; a market
post belongs to none.

The filing source. Setting a CIK proposes one source of kind ``filing`` named "<issuer> filings
(SEC)" at the SEC's per-company Atom address (``filing_url``); only the owner approves it. Taking
the CIK off, or removing the issuer, pauses the source and unlinks it (its stories stay, with no
issuer). Setting a CIK whose source exists already links it again, set to proposed if it was
paused. Renaming the issuer renames its source.
"""

from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

from deploy_workflow.signal.store import (
    FILING,
    MARKET,
    Conflict,
    Missing,
    StoreError,
    _utc_text,
    _write_transaction,
    canonical_url,
    fresh_id,
    fts_phrase,
    insert_source,
    plain_text,
    retire_id,
)

MAX_ISSUERS = 100
MAX_ALIASES = 8
MAX_NAME = 80
MAX_ALIAS = 60
MAX_LIBRARY_KEY = 120
MIN_MARKS = 3  # letters or digits a name or alias holds at least
FILING_URL = (
    "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=&dateb="
    "&owner=include&count=40&output=atom"
)
_CIK = re.compile(r"[0-9]{10}")


@dataclass(frozen=True)
class Form:
    """An issuer as a writer gives it: an empty or None CIK or library key is none."""

    name: str
    aliases: Sequence[str] = ()
    cik: str | None = None
    library_key: str | None = None


@dataclass(frozen=True)
class Issuer:
    id: int
    name: str
    aliases: tuple[str, ...]
    cik: str | None
    library_key: str | None
    source_id: int | None

    @property
    def phrases(self) -> tuple[str, ...]:
        return (self.name, *self.aliases)


def filing_url(cik: str) -> str:
    return canonical_url(FILING_URL.format(cik=cik))


def _marked(text: str) -> str:
    if sum(unicodedata.category(ch)[0] in "LN" for ch in text) < MIN_MARKS:
        raise StoreError(f"{text!r} needs at least {MIN_MARKS} letters or digits to be matched")
    return text


def _aliases(name: str, given: Sequence[str]) -> tuple[str, ...]:
    if len(given) > MAX_ALIASES:
        raise StoreError(f"an issuer has at most {MAX_ALIASES} aliases")
    kept: list[str] = []
    seen = {name.casefold()}
    for alias in given:
        cleaned = _marked(plain_text(alias, MAX_ALIAS, "an alias"))
        if cleaned.casefold() not in seen:
            seen.add(cleaned.casefold())
            kept.append(cleaned)
    return tuple(kept)


def _cik(given: str | None) -> str | None:
    if given is None or given == "":
        return None
    if not given.isascii() or _CIK.fullmatch(given) is None:
        raise StoreError("a CIK is 10 digits, such as 0000320193")
    return given


def _key(given: str | None) -> str | None:
    if given is None or given == "":
        return None
    return plain_text(given, MAX_LIBRARY_KEY, "a library key")


def clean(form: Form) -> Form:
    """The form checked and trimmed; StoreError names the first thing not accepted."""
    name = _marked(plain_text(form.name, MAX_NAME, "an issuer's name"))
    return Form(name, _aliases(name, form.aliases), _cik(form.cik), _key(form.library_key))


def _issuer(row: sqlite3.Row) -> Issuer:
    return Issuer(
        int(row["id"]),
        str(row["name"]),
        tuple(json.loads(row["aliases"])),
        row["cik"],
        row["library_key"],
        row["source_id"],
    )


def get(db: sqlite3.Connection, issuer_id: int) -> Issuer:
    row = db.execute("SELECT * FROM issuers WHERE id=?", (issuer_id,)).fetchone()
    if row is None:
        raise Missing(f"no issuer with id {issuer_id}")
    return _issuer(row)


def every(db: sqlite3.Connection) -> list[Issuer]:
    """Every issuer, by name (A to Z, case folded), then id."""
    found = [_issuer(row) for row in db.execute("SELECT * FROM issuers").fetchall()]
    return sorted(found, key=lambda one: (one.name.casefold(), one.id))


def _unclaimed(db: sqlite3.Connection, form: Form, own: int | None) -> None:
    """Conflict when another issuer has one of the form's phrases or its CIK."""
    for other in every(db):
        if other.id == own:
            continue
        theirs = {phrase.casefold() for phrase in other.phrases}
        for phrase in (form.name, *form.aliases):
            if phrase.casefold() in theirs:
                raise Conflict(
                    f"{phrase!r} is already the name or an alias of the issuer {other.name!r}"
                )
        if form.cik is not None and form.cik == other.cik:
            raise Conflict(f"the CIK {form.cik} is already that of the issuer {other.name!r}")


def _source_name(name: str) -> str:
    return f"{name} filings (SEC)"


def _link_source(db: sqlite3.Connection, name: str, cik: str, by: str) -> int:
    """The filing source for `cik`: the stored one (renamed, proposed again if it was paused) or a
    new proposal. Conflict when the address is a source of another kind."""
    url = filing_url(cik)
    held = [
        row
        for row in db.execute("SELECT id, kind, url FROM sources").fetchall()
        if canonical_url(row["url"]) == url
    ]
    if not held:
        return insert_source(db, _source_name(name), FILING, url, by)
    row = held[0]
    if row["kind"] != FILING:
        raise Conflict(f"the SEC address of this CIK is already a source of kind {row['kind']}")
    db.execute(
        "UPDATE sources SET name=?, state=CASE state WHEN 'paused' THEN 'proposed' ELSE state END"
        " WHERE id=?",
        (_source_name(name), row["id"]),
    )
    return int(row["id"])


def _pause(db: sqlite3.Connection, source_id: int | None) -> None:
    if source_id is not None:
        db.execute("UPDATE sources SET state='paused' WHERE id=?", (source_id,))


def _query(phrases: Sequence[str]) -> str:
    return " OR ".join(fts_phrase(phrase) for phrase in phrases)


def _rematch(db: sqlite3.Connection, issuer: Issuer) -> None:
    """Hold exactly the stories the issuer's rule names: its phrases over every story but filings
    and market posts (one index query), and its filing source's stories."""
    db.execute("DELETE FROM issuer_stories WHERE issuer_id=?", (issuer.id,))
    db.execute(
        "INSERT OR IGNORE INTO issuer_stories(issuer_id, story_id)"
        " SELECT ?, s.id FROM stories_fts JOIN stories s ON s.id = stories_fts.rowid"
        " JOIN sources src ON src.id = s.source_id"
        " WHERE stories_fts MATCH ? AND src.kind NOT IN (?, ?)",
        (issuer.id, _query(issuer.phrases), FILING, MARKET),
    )
    if issuer.source_id is not None:
        db.execute(
            "INSERT OR IGNORE INTO issuer_stories(issuer_id, story_id)"
            " SELECT ?, id FROM stories WHERE source_id=?",
            (issuer.id, issuer.source_id),
        )


def add_issuer(db: sqlite3.Connection, form: Form, created_by: str) -> int:
    """Store an issuer, propose its filing source when it has a CIK, and match the stored stories,
    in one write transaction. Conflict at ``MAX_ISSUERS`` or for a phrase or CIK already taken."""
    checked = clean(form)
    with _write_transaction(db):
        if db.execute("SELECT COUNT(*) FROM issuers").fetchone()[0] >= MAX_ISSUERS:
            raise Conflict(f"Signal holds {MAX_ISSUERS} issuers, the most it can; remove one first")
        _unclaimed(db, checked, None)
        issuer_id = fresh_id(db, "issuers")
        source = (
            None if checked.cik is None else _link_source(db, checked.name, checked.cik, created_by)
        )
        db.execute(
            "INSERT INTO issuers(id, name, aliases, cik, library_key, source_id, created_by,"
            " created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
            (
                issuer_id,
                checked.name,
                json.dumps(list(checked.aliases)),
                checked.cik,
                checked.library_key,
                source,
                created_by,
                _utc_text(datetime.now(UTC)),
            ),
        )
        _rematch(db, get(db, issuer_id))
    return issuer_id


def _new_source(db: sqlite3.Connection, old: Issuer, checked: Form, by: str) -> int | None:
    """The source the edited issuer links: the old one (renamed) while the CIK stays, else the old
    one paused and the new CIK's linked."""
    if checked.cik == old.cik:
        if old.source_id is not None:
            db.execute(
                "UPDATE sources SET name=? WHERE id=?", (_source_name(checked.name), old.source_id)
            )
        return old.source_id
    _pause(db, old.source_id)
    db.execute("UPDATE issuers SET source_id=NULL WHERE id=?", (old.id,))  # its UNIQUE slot
    return None if checked.cik is None else _link_source(db, checked.name, checked.cik, by)


def edit_issuer(db: sqlite3.Connection, issuer_id: int, form: Form, by: str = "") -> None:
    """Replace an issuer's name, aliases, CIK and library key in one write transaction. Changed
    phrases or a changed filing source re-match the stored stories; follows are kept."""
    checked = clean(form)
    with _write_transaction(db):
        old = get(db, issuer_id)
        _unclaimed(db, checked, issuer_id)
        source = _new_source(db, old, checked, by or "issuer edit")
        db.execute(
            "UPDATE issuers SET name=?, aliases=?, cik=?, library_key=?, source_id=? WHERE id=?",
            (
                checked.name,
                json.dumps(list(checked.aliases)),
                checked.cik,
                checked.library_key,
                source,
                issuer_id,
            ),
        )
        new = get(db, issuer_id)
        if (new.phrases, new.source_id) != (old.phrases, old.source_id):
            _rematch(db, new)


def remove_issuer(db: sqlite3.Connection, issuer_id: int) -> None:
    """Delete an issuer with its matches, follows and digest covers; its filing source is paused.
    Its id is never given again."""
    with _write_transaction(db):
        old = get(db, issuer_id)
        _pause(db, old.source_id)
        retire_id(db, "issuers", issuer_id)
        db.execute("DELETE FROM issuers WHERE id=?", (issuer_id,))


def follow(db: sqlite3.Connection, user_name: str, issuer_id: int) -> None:
    with _write_transaction(db):
        get(db, issuer_id)
        db.execute(
            "INSERT OR IGNORE INTO issuer_follows(user_name, issuer_id) VALUES(?, ?)",
            (user_name, issuer_id),
        )


def unfollow(db: sqlite3.Connection, user_name: str, issuer_id: int) -> None:
    with _write_transaction(db):
        get(db, issuer_id)
        db.execute(
            "DELETE FROM issuer_follows WHERE user_name=? AND issuer_id=?", (user_name, issuer_id)
        )


def link_story(db: sqlite3.Connection, story_id: int) -> list[int]:
    """Record the issuers a newly stored story belongs to, inside the caller's write transaction;
    their ids. A filing story belongs to its source's issuer; a market post to none; any other
    story to every issuer whose phrases it holds (one index query per issuer)."""
    row = db.execute(
        "SELECT s.source_id, src.kind FROM stories s JOIN sources src ON src.id = s.source_id"
        " WHERE s.id=?",
        (story_id,),
    ).fetchone()
    if row is None or row["kind"] == MARKET:
        return []
    if row["kind"] == FILING:
        owners = db.execute("SELECT id FROM issuers WHERE source_id=?", (row["source_id"],))
        found = [int(one["id"]) for one in owners]
    else:
        found = [
            one.id
            for one in every(db)
            if db.execute(
                "SELECT 1 FROM stories_fts WHERE stories_fts MATCH ? AND rowid=?",
                (_query(one.phrases), story_id),
            ).fetchone()
        ]
    db.executemany(
        "INSERT OR IGNORE INTO issuer_stories(issuer_id, story_id) VALUES(?, ?)",
        [(issuer_id, story_id) for issuer_id in found],
    )
    return found


def of_source(db: sqlite3.Connection, source_id: int) -> Issuer | None:
    """The issuer whose filing source this is, if any."""
    row = db.execute("SELECT * FROM issuers WHERE source_id=?", (source_id,)).fetchone()
    return None if row is None else _issuer(row)


def of_stories(db: sqlite3.Connection, ids: Sequence[int]) -> dict[int, list[tuple[int, str]]]:
    """Each listed story's issuers as (id, name), by name (A to Z, case folded), then id."""
    found: dict[int, list[tuple[int, str]]] = {}
    unique = sorted(set(ids))
    for start in range(0, len(unique), 500):
        part = unique[start : start + 500]
        rows = db.execute(
            "SELECT l.story_id, i.id, i.name FROM issuer_stories l JOIN issuers i"
            f" ON i.id = l.issuer_id WHERE l.story_id IN ({', '.join('?' * len(part))})",
            part,
        ).fetchall()
        for row in rows:
            found.setdefault(int(row["story_id"]), []).append((int(row["id"]), str(row["name"])))
    for held in found.values():
        held.sort(key=lambda one: (one[1].casefold(), one[0]))
    return found
