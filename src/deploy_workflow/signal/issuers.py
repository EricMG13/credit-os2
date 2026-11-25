"""The issuer watchlist: issuers, follows, the stories that belong to each, and the filing source
an issuer's SEC CIK proposes (docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md).

An issuer has a name, up to ``MAX_ALIASES`` aliases (other names and tickers it goes by), an
optional CIK (exactly ten ASCII digits) and an optional library key (text the page links to the
issuer library with; Signal never reads the library). Writers and the owner keep issuers; every
user may follow one. Ids are never given again (``store.fresh_id``/``store.retire_id``).

The matching rule. The name and every alias hold a word of at least ``MIN_TOKEN`` letters or digits
("AT&T" is the words "at" and "t" and is refused: "AT&T Inc" is accepted). A story belongs to an
issuer when its title or stored summary holds the name or an alias as a phrase of whole tokens,
through the FTS5 index topics use (its tokens are runs of letters and digits, matched without regard
to case or accents): "Next" does not match "Nextdoor", but does match the word "next" in a sentence,
the known limit of a common-word alias. A phrase belongs to one issuer, compared as the words the
index makes of it (``tokens``: case, accents, punctuation and spacing folded). A new story is
matched in its topics' write transaction (``topics.match_story`` calls ``link_story``); creating an
issuer, or changing its name or aliases, re-matches every stored story in that write transaction
with one index query (the phrases joined by OR), whatever the store holds. A filing story belongs to
the issuer whose filing source stored it, never by text; a market post belongs to none.

The filing source. Setting a CIK proposes one source of kind ``filing`` named "<issuer> filings
(SEC)" (cut to the source-name limit) at the SEC's per-company Atom address (``filing_url``); only
the owner approves it. Taking the CIK off, or removing the issuer, unlinks the source: one still
proposed that was never fetched and holds no story is deleted, any other is paused (its stories
stay, with no issuer). Setting a CIK whose source exists already links that row again, and every
link sets it to proposed, so it waits for the owner whatever it was. At most ``FILING_PROPOSALS``
filing sources wait for the owner at once (service-wide; they are not counted in a writer's cap on
hand proposals). Renaming the issuer renames its source.
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
    MAX_SOURCE_NAME,
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
FILING_PROPOSALS = MAX_ISSUERS  # filing sources waiting for the owner at once, service-wide
MIN_TOKEN = 3  # letters or digits the longest word of a name or alias holds at least
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


def _token_char(ch: str) -> bool:
    category = unicodedata.category(ch)
    return category[0] in "LN" or category == "Co"


def tokens(text: str) -> tuple[str, ...]:
    """The words the story index makes of `text`, as this module models it: accents taken off
    (NFD, combining marks dropped), lower case, runs of letters, digits and private-use characters
    (the FTS5 unicode61 tokenizer's default token characters); everything else separates."""
    folded = "".join(
        ch for ch in unicodedata.normalize("NFD", text) if unicodedata.category(ch) != "Mn"
    ).lower()
    found: list[str] = []
    word: list[str] = []
    for ch in folded:
        if _token_char(ch):
            word.append(ch)
        elif word:
            found.append("".join(word))
            word = []
    if word:
        found.append("".join(word))
    return tuple(found)


def _marked(text: str) -> str:
    """`text` when one of its words holds at least MIN_TOKEN letters or digits; StoreError
    otherwise ("AT&T" is the words "at" and "t", which would match "at T-Mobile")."""
    if not any(len(word) >= MIN_TOKEN for word in tokens(text)):
        raise StoreError(
            f"{text!r} cannot be matched: each of its words is shorter than {MIN_TOKEN} letters or"
            " digits, so it would match ordinary text; give a longer name or alias, such as"
            ' "AT&T Inc"'
        )
    return text


def _aliases(name: str, given: Sequence[str]) -> tuple[str, ...]:
    if len(given) > MAX_ALIASES:
        raise StoreError(f"an issuer has at most {MAX_ALIASES} aliases")
    kept: list[str] = []
    seen = {tokens(name)}
    for alias in given:
        cleaned = _marked(plain_text(alias, MAX_ALIAS, "an alias"))
        if tokens(cleaned) not in seen:  # the same words as the name or an earlier alias
            seen.add(tokens(cleaned))
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
    """Conflict when another issuer has one of the form's phrases (compared as the words the
    index makes of it: "Altice-USA" is "Altice USA") or its CIK."""
    for other in every(db):
        if other.id == own:
            continue
        theirs = {tokens(phrase) for phrase in other.phrases}
        for phrase in (form.name, *form.aliases):
            if tokens(phrase) in theirs:
                raise Conflict(
                    f"{phrase!r} is already the name or an alias of the issuer {other.name!r}"
                )
        if form.cik is not None and form.cik == other.cik:
            raise Conflict(f"the CIK {form.cik} is already that of the issuer {other.name!r}")


_FILINGS = " filings (SEC)"


def _source_name(name: str) -> str:
    """ "<issuer> filings (SEC)", the issuer's name cut (with an ellipsis) to keep it within the
    source-name limit."""
    whole = f"{name}{_FILINGS}"
    if len(whole) <= MAX_SOURCE_NAME:
        return whole
    return name[: MAX_SOURCE_NAME - len(_FILINGS) - 1].rstrip() + "\u2026" + _FILINGS


def _proposed_filings(db: sqlite3.Connection) -> int:
    row = db.execute("SELECT COUNT(*) FROM sources WHERE kind=? AND state='proposed'", (FILING,))
    return int(row.fetchone()[0])


def _link_source(db: sqlite3.Connection, name: str, cik: str, by: str) -> int:
    """The filing source for `cik`, set to proposed whatever its state (every link waits for the
    owner): the stored one, renamed, or a new one. Conflict when the address is a source of another
    kind, or when FILING_PROPOSALS filing sources wait for the owner already (a cap of its own:
    the writer's cap on hand proposals does not count them)."""
    url = filing_url(cik)
    held = [
        row
        for row in db.execute("SELECT id, kind, url, state FROM sources").fetchall()
        if canonical_url(row["url"]) == url
    ]
    if held and held[0]["kind"] != FILING:
        raise Conflict(f"the SEC address of this CIK is already a source of kind {held[0]['kind']}")
    if (not held or held[0]["state"] != "proposed") and _proposed_filings(db) >= FILING_PROPOSALS:
        raise Conflict(
            f"{FILING_PROPOSALS} filing sources are waiting for the owner, the most Signal holds;"
            " set this CIK once the owner has reviewed them"
        )
    if not held:
        return insert_source(db, _source_name(name), FILING, url, by)
    db.execute(
        "UPDATE sources SET name=?, state='proposed' WHERE id=?",
        (_source_name(name), held[0]["id"]),
    )
    return int(held[0]["id"])


def _let_go(db: sqlite3.Connection, source_id: int | None) -> None:
    """A filing source no issuer links any more: deleted when the owner never let it be fetched
    (still proposed, with no check, story or folded copy), else paused (its stories stay). The
    caller has unlinked it already."""
    if source_id is None:
        return
    never = db.execute(
        "SELECT 1 FROM sources WHERE id=? AND state='proposed'"
        " AND NOT EXISTS(SELECT 1 FROM source_checks WHERE source_id=sources.id)"
        " AND NOT EXISTS(SELECT 1 FROM stories WHERE source_id=sources.id)"
        " AND NOT EXISTS(SELECT 1 FROM story_duplicates WHERE duplicate_source_id=sources.id)",
        (source_id,),
    ).fetchone()
    if never is None:
        db.execute("UPDATE sources SET state='paused' WHERE id=?", (source_id,))
        return
    db.execute("DELETE FROM source_logos WHERE source_id=?", (source_id,))  # its icon, if any
    db.execute("DELETE FROM sources WHERE id=?", (source_id,))


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
    created_by = plain_text(created_by, MAX_NAME, "who adds the issuer")
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
    db.execute("UPDATE issuers SET source_id=NULL WHERE id=?", (old.id,))  # its UNIQUE slot
    _let_go(db, old.source_id)
    return None if checked.cik is None else _link_source(db, checked.name, checked.cik, by)


KEPT_FIELDS = ("aliases", "cik", "library_key")  # what an edit may leave as stored


def _merged(old: Issuer, checked: Form, keep: frozenset[str]) -> Form:
    """The edit's form with the fields in `keep` taken from the stored issuer, checked again
    (an alias that is now the name's words is dropped)."""
    return clean(
        Form(
            checked.name,
            old.aliases if "aliases" in keep else checked.aliases,
            old.cik if "cik" in keep else checked.cik,
            old.library_key if "library_key" in keep else checked.library_key,
        )
    )


def edit_issuer(
    db: sqlite3.Connection,
    issuer_id: int,
    form: Form,
    by: str = "",
    *,
    keep: frozenset[str] = frozenset(),
) -> None:
    """Set an issuer's name, and its aliases, CIK and library key except those named in `keep`
    (``KEPT_FIELDS``), which stay as stored, in one write transaction. Changed phrases or a
    changed filing source re-match the stored stories; follows are kept."""
    if not keep <= set(KEPT_FIELDS):
        raise StoreError(f"an edit keeps only {', '.join(KEPT_FIELDS)}")
    given = clean(form)  # what the writer gave is refused (400) before the id is looked up (404)
    with _write_transaction(db):
        old = get(db, issuer_id)
        checked = _merged(old, given, keep)
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
    """Delete an issuer with its matches, follows and digest covers; its filing source is let go
    (``_let_go``: deleted if never fetched, else paused). Its id is never given again."""
    with _write_transaction(db):
        old = get(db, issuer_id)
        retire_id(db, "issuers", issuer_id)
        db.execute("DELETE FROM issuers WHERE id=?", (issuer_id,))
        _let_go(db, old.source_id)


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


def _text_matches(db: sqlite3.Connection, story_id: int) -> list[int]:
    """The issuers whose phrases the story's title or summary holds. The story is copied into a
    one-story FTS5 index on the connection (``temp.issuer_match``, the same two columns and the
    same default tokenizer as ``stories_fts``), so each phrase query reads one story's words, not
    the store's: the same matches as querying ``stories_fts`` for the story's row, at a cost that
    does not grow with the store. One query over every issuer's phrases first; only when it
    matches, one query per issuer."""
    every_one = every(db)
    if not every_one:
        return []
    db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS temp.issuer_match USING fts5(title, summary)")
    db.execute("DELETE FROM temp.issuer_match")
    db.execute(
        "INSERT INTO temp.issuer_match(rowid, title, summary)"
        " SELECT 1, title, summary FROM stories WHERE id=?",
        (story_id,),
    )
    phrases = [phrase for one in every_one for phrase in one.phrases]
    sql = "SELECT 1 FROM temp.issuer_match WHERE issuer_match MATCH ?"
    if db.execute(sql, (_query(phrases),)).fetchone() is None:
        return []
    return [one.id for one in every_one if db.execute(sql, (_query(one.phrases),)).fetchone()]


def link_story(db: sqlite3.Connection, story_id: int) -> list[int]:
    """Record the issuers a newly stored story belongs to, inside the caller's write transaction;
    their ids. A filing story belongs to its source's issuer; a market post to none; any other
    story to every issuer whose phrases it holds (``_text_matches``)."""
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
        found = _text_matches(db, story_id)
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
