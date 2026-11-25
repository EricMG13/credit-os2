"""Read side of Signal: feed pages, search, new-story counts and saves."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import NotRequired, TypedDict, Unpack

from deploy_workflow.signal.store import KINDS, _utc_text, _write_transaction
from deploy_workflow.signal.topics import fts_phrase

PAGE = 30
MAX_QUERY = 100


class ViewError(ValueError):
    """An unknown view, kind, topic or story, or a malformed cursor."""


@dataclass(frozen=True)
class Card:
    id: int
    title: str
    link: str
    summary: str
    source: str
    kind: str
    published_at: str
    other_sources: int
    saved: bool
    topics: tuple[str, ...]


@dataclass(frozen=True)
class Page:
    cards: tuple[Card, ...]
    next_before: str | None
    newest: int  # highest story id in the whole store when the page was read; 0 if empty


class Filters(TypedDict):
    """Optional keyword arguments of `feed`."""

    kind: NotRequired[str | None]
    query: NotRequired[str]
    before: NotRequired[str | None]


_FOLLOWED = (
    "EXISTS(SELECT 1 FROM topic_stories ts JOIN topic_follows f ON f.topic_id = ts.topic_id"
    " WHERE ts.story_id = s.id AND f.user_name = ?)"
)
# For you (spec 5.6): stories in the user's followed topics or shared in a group they belong to.
_FOR_YOU = (
    "(" + _FOLLOWED + " OR EXISTS(SELECT 1 FROM threads t JOIN group_members m"
    " ON m.group_id = t.group_id WHERE t.story_id = s.id AND m.user_name = ?))"
)
_SAVED = "EXISTS(SELECT 1 FROM saves v WHERE v.story_id = s.id AND v.user_name = ?)"
_IN_TOPIC = "EXISTS(SELECT 1 FROM topic_stories ts WHERE ts.story_id = s.id AND ts.topic_id = ?)"


MAX_ID = 2**63 - 1


def _id(number: str, what: str) -> int:
    """A decimal id that SQLite can hold, else ViewError."""
    if (
        not number.isascii()
        or not number.isdecimal()
        or len(number) > len(str(MAX_ID))  # before int(): a huge digit string raises ValueError
        or int(number) > MAX_ID
    ):
        raise ViewError(f"invalid {what} {number!r}")
    return int(number)


def _instant(text: str, what: str) -> str:
    """The stored UTC text of a zoned ISO time, else ViewError."""
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError as exc:
        raise ViewError(f"malformed {what} {text!r}") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ViewError(f"{what} {text!r} has no time zone")
    try:
        return _utc_text(parsed)
    except OverflowError as exc:  # a year-1 or year-9999 time with an offset leaves the UTC range
        raise ViewError(f"{what} {text!r} is out of range") from exc


def _after(after: object) -> int:
    """A story id cursor: an int from 0 to MAX_ID, else ViewError."""
    if isinstance(after, bool) or not isinstance(after, int) or not 0 <= after <= MAX_ID:
        raise ViewError(f"invalid after {after!r}")
    return after


@contextmanager
def read_transaction(db: sqlite3.Connection) -> Iterator[None]:
    """One read transaction, so every read inside it sees the same committed state."""
    db.execute("BEGIN")
    try:
        yield
    finally:
        if db.in_transaction:
            db.execute("ROLLBACK")


def _newest(db: sqlite3.Connection) -> int:
    return int(db.execute("SELECT COALESCE(MAX(id), 0) FROM stories").fetchone()[0])


def _view_clause(
    db: sqlite3.Connection, user_name: str, view: str
) -> tuple[str | None, list[object]]:
    """The fixed SQL condition for a validated view, with its parameters."""
    if view == "latest":
        return None, []
    if view == "foryou":
        return _FOR_YOU, [user_name, user_name]
    if view == "saved":
        return _SAVED, [user_name]
    prefix, _, number = view.partition(":")
    if prefix == "topic" and number.isascii() and number.isdecimal():
        topic_id = _id(number, "topic id")
        if db.execute("SELECT 1 FROM topics WHERE id=?", (topic_id,)).fetchone() is None:
            raise ViewError(f"no topic with id {topic_id}")
        return _IN_TOPIC, [topic_id]
    raise ViewError(f"unknown view {view!r}")


def _cursor(before: str) -> tuple[str, int]:
    stamp, bar, number = before.rpartition("|")
    if not bar:
        raise ViewError(f"malformed cursor {before!r}")
    return _instant(stamp, "cursor time"), _id(number, "cursor id")


def _search_match(query: str) -> str | None:
    terms = query[:MAX_QUERY].split()
    return " ".join(fts_phrase(term) for term in terms) if terms else None


def _topic_names(db: sqlite3.Connection, story_id: int) -> tuple[str, ...]:
    rows = db.execute(
        "SELECT t.name FROM topic_stories ts JOIN topics t ON t.id = ts.topic_id"
        " WHERE ts.story_id=? ORDER BY t.id",
        (story_id,),
    ).fetchall()
    return tuple(row["name"] for row in rows)


# A card's columns; the one parameter is the user whose saves are read.
_CARD_SELECT = (
    "SELECT s.id, s.title, s.link, s.summary, s.published_at, src.name AS source,"
    " src.kind AS kind,"
    " (SELECT COUNT(DISTINCT d.duplicate_source_id) FROM story_duplicates d"
    "  WHERE d.story_id = s.id) AS other_sources,"
    " EXISTS(SELECT 1 FROM saves me WHERE me.story_id = s.id AND me.user_name = ?) AS saved"
    " FROM stories s JOIN sources src ON src.id = s.source_id"
)
_CHUNK = 500  # ids per IN list, well under SQLite's variable limit


def _card(db: sqlite3.Connection, row: sqlite3.Row) -> Card:
    return Card(
        id=row["id"],
        title=row["title"],
        link=row["link"],
        summary=row["summary"],
        source=row["source"],
        kind=row["kind"],
        published_at=row["published_at"],
        other_sources=row["other_sources"],
        saved=bool(row["saved"]),
        topics=_topic_names(db, row["id"]),
    )


def feed(
    db: sqlite3.Connection,
    user_name: str,
    view: str,
    **filters: Unpack[Filters],
) -> Page:
    """One page of stories, newest first. Raises ViewError for an invalid request."""
    with read_transaction(db):
        return _read_page(db, user_name, view, filters)


def _read_page(db: sqlite3.Connection, user_name: str, view: str, filters: Filters) -> Page:
    kind = filters.get("kind")
    before = filters.get("before")
    conditions: list[str] = []
    params: list[object] = []
    clause, clause_params = _view_clause(db, user_name, view)
    if clause is not None:
        conditions.append(clause)
        params += clause_params
    if kind is not None:
        if kind not in KINDS:
            raise ViewError(f"unknown kind {kind!r}")
        conditions.append("src.kind = ?")
        params.append(kind)
    match = _search_match(filters.get("query", ""))
    if match is not None:
        conditions.append("s.id IN (SELECT rowid FROM stories_fts WHERE stories_fts MATCH ?)")
        params.append(match)
    if before is not None:
        stamp, story_id = _cursor(before)
        conditions.append("(s.published_at < ? OR (s.published_at = ? AND s.id < ?))")
        params += [stamp, stamp, story_id]
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    rows = db.execute(
        _CARD_SELECT + where + " ORDER BY s.published_at DESC, s.id DESC LIMIT ?",
        [user_name, *params, PAGE + 1],
    ).fetchall()
    cards = tuple(_card(db, row) for row in rows[:PAGE])
    more = len(rows) > PAGE
    last = cards[-1] if more else None
    return Page(cards, f"{last.published_at}|{last.id}" if last else None, _newest(db))


# The story ids of a view, read from the rows that put a story in it; the parameters are the
# view's own (`_view_clause`). Latest has none: every story is in it. For you is not read from one
# query: it is the newest of its followed topics' views and of the stories shared in the viewer's
# groups (`_for_you`).
_MEMBERS = {
    "topic": "SELECT story_id FROM topic_stories WHERE topic_id = ?",
    "saved": "SELECT story_id FROM saves WHERE user_name = ?",
    "foryou": (
        "SELECT ts.story_id FROM topic_stories ts JOIN topic_follows f"
        " ON f.topic_id = ts.topic_id AND f.user_name = ?"
        " UNION SELECT t.story_id FROM threads t JOIN group_members m"
        " ON m.group_id = t.group_id AND m.user_name = ? WHERE t.story_id IS NOT NULL"
    ),
}
# A view with more members than this is never read from them (it would sort them all); it is read
# from the newest WINDOW stories instead, so its work does not grow with the store. When the window
# holds fewer of its members than asked for, the rest are read from its own member rows, the
# highest story ids first (from the rows' index, a few times the limit), and shown in the feed's
# order after the window's: exact when story ids follow publication order among those members, as
# a feed's ingest gives them; otherwise the older part is the newest the store added.
MEMBERS_READ = 10_000
WINDOW = 20_000
WALK_FACTOR = 4


def view_ids(db: sqlite3.Connection, user_name: str, view: str, limit: int) -> list[int]:
    """The ids of the newest `limit` stories in the view, newest first (the feed's own order).

    Two ways to read them: walk the stories newest first until `limit` are in the view, or read
    the view's members and sort them (about members steps). A view with few members against the
    store is read from its members. Any other view is walked, but at most WALK_FACTOR times the
    steps an evenly spread view would take (`limit` * stories / members); a walk that finds fewer
    than `limit` in that many (the members are old: a topic whose keyword left the news) reads the
    members instead, as long as they are at most MEMBERS_READ. A view of more members is walked
    over the newest WINDOW stories; when that finds fewer than `limit`, the others are the newest
    of its member rows by story id (`_with_older`). Up to those bounds the ids and their order are
    those of the full walk (the older part of a big view: when ids follow publication order), and
    the work is at most a few times MEMBERS_READ or WINDOW. It opens no transaction: a caller
    reading several views holds one (`read_transaction`)."""
    clause, params = _view_clause(db, user_name, view)
    kind = view.partition(":")[0]
    members = _MEMBERS.get(kind)
    if members is None:  # Latest: every story is in it
        return _walk(db, None, [], limit, None)
    if kind == "foryou":
        return _for_you(db, user_name, limit)
    held = _held(db, members, params)
    if held > MEMBERS_READ:
        found = _walk(db, clause, params, limit, WINDOW)
        return found if len(found) == limit else _with_older(db, members, params, found, limit)
    total = db.execute("SELECT COALESCE(MAX(id), 0) FROM stories").fetchone()[0]
    if held <= limit or held * held <= limit * total:
        return _from_members(db, members, params, limit)
    steps = WALK_FACTOR * limit * total // held + limit
    found = _walk(db, clause, params, limit, steps)
    return found if len(found) == limit else _from_members(db, members, params, limit)


def _with_older(
    db: sqlite3.Connection, members: str, params: list[object], found: list[int], limit: int
) -> list[int]:
    """A big view whose window held only `found` (every member in it, newest first): those, then
    the newest of its other member rows by story id, in the feed's order, up to `limit` in all.
    The rows are read from their index, at most WALK_FACTOR * limit + len(found) of them."""
    rows = db.execute(
        f"{members} ORDER BY story_id DESC LIMIT ?", [*params, WALK_FACTOR * limit + len(found)]
    ).fetchall()
    older = {int(row[0]) for row in rows} - set(found)
    return found + _newest_of(db, older, limit - len(found))


def _held(db: sqlite3.Connection, members: str, params: list[object]) -> int:
    """How many members the view has, counted no further than MEMBERS_READ + 1."""
    sql = f"SELECT COUNT(*) FROM (SELECT 1 FROM ({members}) LIMIT ?)"
    return int(db.execute(sql, [*params, MEMBERS_READ + 1]).fetchone()[0])


# The stories shared into the groups the viewer is a member of, newest first.
_SHARED = (
    "SELECT s.id FROM threads t JOIN group_members m ON m.group_id = t.group_id AND m.user_name = ?"
    " JOIN stories s ON s.id = t.story_id GROUP BY s.id"
    " ORDER BY s.published_at DESC, s.id DESC LIMIT ?"
)


def _for_you(db: sqlite3.Connection, user_name: str, limit: int) -> list[int]:
    """The newest `limit` of the viewer's followed topics' views and of the stories shared in
    their groups: the newest of the whole is among the newest of each part."""
    found = {int(row[0]) for row in db.execute(_SHARED, (user_name, limit))}
    for row in db.execute("SELECT topic_id FROM topic_follows WHERE user_name=?", (user_name,)):
        found.update(view_ids(db, user_name, f"topic:{row[0]}", limit))
    return _newest_of(db, found, limit)


def _newest_of(db: sqlite3.Connection, ids: set[int], limit: int) -> list[int]:
    """The newest `limit` of the stories `ids`, newest first (published time, then id)."""
    stamped: list[tuple[str, int]] = []
    listed = sorted(ids)
    for start in range(0, len(listed), _CHUNK):
        part = listed[start : start + _CHUNK]
        rows = db.execute(
            "SELECT published_at, id FROM stories WHERE id IN (" + ", ".join("?" * len(part)) + ")",
            part,
        ).fetchall()
        stamped += [(row[0], int(row[1])) for row in rows]
    return [story_id for _, story_id in sorted(stamped, reverse=True)[:limit]]


def _from_members(
    db: sqlite3.Connection, members: str, params: list[object], limit: int
) -> list[int]:
    rows = db.execute(
        f"SELECT s.id FROM ({members}) d CROSS JOIN stories s ON s.id = d.story_id"
        " ORDER BY s.published_at DESC, s.id DESC LIMIT ?",
        [*params, limit],
    ).fetchall()
    return [int(row["id"]) for row in rows]


def _walk(
    db: sqlite3.Connection,
    clause: str | None,
    params: list[object],
    limit: int,
    steps: int | None,
) -> list[int]:
    """The newest `limit` stories meeting `clause` among the newest `steps` stories (all: None)."""
    source = (
        "stories"
        if steps is None
        else ("(SELECT * FROM stories ORDER BY published_at DESC, id DESC LIMIT ?)")
    )
    where = " WHERE " + clause if clause is not None else ""
    rows = db.execute(
        f"SELECT s.id FROM {source} s{where} ORDER BY s.published_at DESC, s.id DESC LIMIT ?",
        [*([] if steps is None else [steps]), *params, limit],
    ).fetchall()
    return [int(row["id"]) for row in rows]


def cards(db: sqlite3.Connection, user_name: str, ids: list[int]) -> dict[int, Card]:
    """The card of each listed story that exists, by id; `saved` is `user_name`'s."""
    found: dict[int, Card] = {}
    for start in range(0, len(ids), _CHUNK):
        part = ids[start : start + _CHUNK]
        marks = ", ".join("?" * len(part))
        rows = db.execute(
            _CARD_SELECT + " WHERE s.id IN (" + marks + ")", [user_name, *part]
        ).fetchall()
        found.update((int(row["id"]), _card(db, row)) for row in rows)
    return found


def other_sources(db: sqlite3.Connection, story_id: int) -> tuple[str, ...]:
    """The names of the other sources a story was folded from, in the order they were first seen."""
    rows = db.execute(
        "SELECT src.name FROM story_duplicates d JOIN sources src ON src.id = d.duplicate_source_id"
        " WHERE d.story_id = ? GROUP BY d.duplicate_source_id"
        " ORDER BY MIN(d.seen_at), d.duplicate_source_id",
        (story_id,),
    ).fetchall()
    return tuple(str(row["name"]) for row in rows)


def new_count(db: sqlite3.Connection, user_name: str, view: str, after: int) -> int:
    """Stories in the view with an id above `after`, the `newest` of an earlier page; counted over
    the view's members where it has them (each names a stored story once), so the count never
    walks the whole store."""
    floor = _after(after)
    clause, params = _view_clause(db, user_name, view)
    members = _MEMBERS.get(view.partition(":")[0])
    if members is not None:
        sql = f"SELECT COUNT(*) FROM ({members}) d WHERE d.story_id > ?"
        return int(db.execute(sql, [*params, floor]).fetchone()[0])
    where = " AND " + clause if clause is not None else ""
    row = db.execute(
        "SELECT COUNT(*) FROM stories s WHERE s.id > ?" + where, [floor, *params]
    ).fetchone()
    return int(row[0])


def _require_story(db: sqlite3.Connection, story_id: int) -> None:
    if db.execute("SELECT 1 FROM stories WHERE id=?", (story_id,)).fetchone() is None:
        raise ViewError(f"no story with id {story_id}")


def save(db: sqlite3.Connection, user_name: str, story_id: int) -> None:
    with _write_transaction(db):
        _require_story(db, story_id)
        db.execute(
            "INSERT OR IGNORE INTO saves(user_name, story_id, saved_at) VALUES(?, ?, ?)",
            (user_name, story_id, _utc_text(datetime.now().astimezone())),
        )


def unsave(db: sqlite3.Connection, user_name: str, story_id: int) -> None:
    with _write_transaction(db):
        _require_story(db, story_id)
        db.execute("DELETE FROM saves WHERE user_name=? AND story_id=?", (user_name, story_id))
