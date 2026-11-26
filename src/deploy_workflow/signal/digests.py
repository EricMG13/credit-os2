"""Digests: a user's saved brief plus a schedule, and the runs that follow it (spec 5.8).

A digest has one owner, who alone sees it. It covers "All stories", or topics, groups and issuers
(a group only while the owner can see it; an issuer as "Issuer: <name>", its stories as
``issuers`` ties them). Its schedule is a ``schedule.Schedule`` (UTC). Its brief has five
parts: the subject (the form's brief text), the period (the schedule's own day, week or month), the
number of points, what to list as upcoming and the look-ahead days. Its length is short or standard.
A user has at most ``MAX_DIGESTS`` digests, and Signal at most ``MAX_ALL_DIGESTS``. Any named
visitor may build one (spec 5.8, "each user builds": a reader keeps the screens), so the global
cap is what bounds the digests, their runs and the due pass whatever names are typed.

A run gathers the stories in scope for the period, highest signal first (the AI pass's 1 to 3; a
story with none comes after those with one), then newest first, at most ``SCOPE_CAP``: the stories
of the covered topics and issuers, and the stories shared in the covered groups (a thread started
from a story) in the period, by share time. A digest keeps a mark, the highest story id its last
run considered (``story_mark``). A run reads the highest story id then stored, and takes the
stories above the mark up to it that were published after the period's start less one look-back,
the longer of the period and the schedule's own period; there is no upper bound on the published
time. So a story the feed stamped before a run but ingest stored after it is in the next run, once,
and a new source's old archive is not. A run that ends the period moves the mark to that id and
never lowers it; a failed write leaves both. Only stories of the four feed kinds are in
scope, whatever the digest covers: no filing and no market post (``SCOPE_CONDITION``).
With none in scope it stores an issue saying nothing material happened and makes no model call.
With some in scope it needs a ``Writer`` (the AI pass's, ``ai_digest``, given only while the pass
is on); without one no issue is written and the run is recorded as skipped, with the reason.

A run with a writer makes its model call outside every transaction: a first write transaction reads
the scope (a scheduled run also claims its slot there, by moving ``next_run_at`` on, so no other
runner takes it); the writer then drafts the issue, holding no lock; a second write transaction
re-reads the digest and stores the issue only if the digest still exists with the same settings and
the same period start, and its owner still sees the same covered groups. A draft for a digest that
changed meanwhile is dropped (its call is already paid and counted). A writer whose paid call failed
or came back invalid (``WriterFailed``) stores no issue and leaves the period where it was, so the
next scheduled run covers it again: the failure is recorded, the digest moves on to its next slot
and "Run once now" waits for that slot too (one paid attempt per period). A writer that made no paid
call (``WriterFailed.again``: the call was refused, or the adapter established it was not sent)
leaves the run due exactly as it was, and the pass ends there (``Writer.stopped``).

"Run once now" (``run_now``, ``request_run``) is refused within ``RUN_AGAIN_AFTER`` (30 minutes) of
the digest's last run of any outcome. That rule and "one paid attempt per period" are courtesy
limits: a digest deleted and made again, or given a new schedule, is held by neither. What bounds
what typed names can spend through digests is the ledger's, checked as each call is reserved:
``ai_ledger.digests_per_name`` paid calls a UTC day for one name's digests,
``ai_ledger.digests_per_day`` for the whole service, ``ai_digest.CALLS_PER_PASS`` a pass, and the
monthly cap.

Every run, whatever its outcome, ends its period and the next period starts there, so a period is
as long as the time since the last run: one schedule period, plus the downtime a late run catches
up. A digest whose schedule changes starts its new period no earlier than one new period before its
next run. A digest left with nothing to cover (its topics and groups were deleted, or its groups
are no longer visible to its owner) runs as skipped, with the reason ``NO_COVER``, and writes no
issue: it never says that nothing material happened.

Runs are due when ``next_run_at`` has passed. A digest whose time passed while the service was down
runs once at the next start: the run covers the whole gap and the next run is the first slot after
now. A run that fails because the database is busy or locked (SQLITE_BUSY, SQLITE_LOCKED), or
whose model call the adapter did not send, is left due, so the next tick retries it, and the pass
says how many it left (``Ran.left_due``); a run left for the writer's limits or a refusal is
``Ran.waiting``; any other failure, a lasting database fault included, is recorded as skipped and
the digest moves to its next slot. A run that needs a call the writer cannot make now (it has
stopped, or the owner's name has made its calls for the day) is left exactly as it was, and the
pass goes on: runs with nothing in scope, and other names' runs, are never held up behind it.
Every write is one write transaction.
"""

from __future__ import annotations

import logging
import sqlite3
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Literal, Protocol

from deploy_workflow.signal import groups, schedule
from deploy_workflow.signal.texts import day, utc
from deploy_workflow.signal.store import (
    KINDS,
    Conflict,
    Missing,
    StoreError,
    _require,
    _utc_text,
    _write_transaction,
    kind_condition,
    plain_text,
)

log = logging.getLogger(__name__)

MAX_DIGESTS = 5
MAX_ALL_DIGESTS = 500  # in all, whoever owns them
DUE_PER_PASS = 200  # digests one due pass runs at most, the longest due first
MAX_NAME = 60
MAX_SUBJECT = 500
MAX_UPCOMING = 200
MAX_COVERS = 10
SCOPE_CAP = 60
DEFAULT_LOOK_AHEAD = 7
MAX_LOOK_AHEAD = 60
KEEP_ISSUES = 60  # issues kept per digest; older ones are dropped as new ones are written
KEEP_RUNS = 120
RUN_AGAIN_AFTER = timedelta(minutes=30)  # "Run once now" waits this long after any run

COVER_ALL = "All stories"
TOPIC_PREFIX = "Topic: "
GROUP_PREFIX = "Group: "
ISSUER_PREFIX = "Issuer: "
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
# A digest's scope, whatever it covers, holds stories of the four feed kinds only: no filing and
# no market post reaches a run, its model call or an issue drawn from it.
SCOPE_CONDITION = kind_condition(KINDS) or "1"

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
    issuer_ids: tuple[int, ...] = ()


@dataclass(frozen=True)
class Digest:
    id: int
    owner: str
    spec: Spec
    period_from: datetime
    next_run_at: datetime
    requested_at: datetime | None = None  # when "Run once now" was asked, while it waits
    story_mark: int = 0  # the highest story id its last run considered


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
    """What a run found: the digest, its period, the stories in scope (newest first), the highest
    story id stored when they were read (the digest's next mark) and the ids of the covered groups
    its owner could see then."""

    digest: Digest
    start: datetime
    end: datetime
    stories: tuple[ScopedStory, ...]
    upto: int
    groups: tuple[int, ...] = ()


@dataclass(frozen=True)
class Run:
    outcome: Outcome
    issue_id: int | None
    stories: int
    reason: str


class WriterFailed(Exception):
    """The writer wrote no issue: its call was refused or failed, or its result was invalid.
    `again`: no call was paid (it was refused before its reservation, or the adapter established
    that it was not sent), so the run is left due rather than recorded; `fault` says whether that
    is a fault the loop shows (a call not sent) or a limit doing its work (a refusal)."""

    def __init__(self, reason: str, *, again: bool = False, fault: bool = False) -> None:
        super().__init__(reason)
        self.again, self.fault = again, fault


class _RetryLater(Exception):
    """A run left due: its writer made no paid call (or could make none for it in this pass)."""

    def __init__(self, reason: str, *, fault: bool, stories: int) -> None:
        super().__init__(reason)
        self.fault, self.stories = fault, stories


class Ran(list[tuple[int, "Run"]]):
    """The runs a pass made; the digests it left due for the next tick by a fault (`left_due`: a
    busy database, a call not sent) and those left waiting because the writer stopped for a limit
    or a refusal (`waiting`)."""

    def __init__(self) -> None:
        super().__init__()
        self.left_due: list[int] = []
        self.waiting: list[int] = []


class Writer(Protocol):
    """The AI pass's digest writer (``ai_digest``). None in its place: AI is off or at its cap.
    `stopped` is why it makes no more calls in this pass (None while it may): the due pass then
    runs only the digests that need no call, and the others wait for the next one."""

    stopped: str | None

    def blocked(self, owner: str) -> WriterFailed | None:
        """Why no call can be made for a digest of `owner` in this pass (its run waits, as it
        was), or None. Asked before a run that needs a call is planned."""
        ...

    def clock(self) -> datetime:
        """The time now by the writer's own clock: a run's claim is stamped with it as its call
        starts (a pass may begin long before), so a process starting meanwhile sees it live."""
        ...

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


@dataclass(frozen=True)
class _Covers:
    every: bool = False
    topics: tuple[int, ...] = ()
    groups: tuple[int, ...] = ()
    issuers: tuple[int, ...] = ()


def _resolve_covers(db: sqlite3.Connection, owner: str, covers: Sequence[str]) -> _Covers:
    """What the cover choices of the form name: all stories, or topic, group and issuer ids."""
    chosen = list(dict.fromkeys(covers))
    if not chosen or len(chosen) > MAX_COVERS:
        raise StoreError(f"choose from 1 to {MAX_COVERS} things to cover")
    if COVER_ALL in chosen:
        if len(chosen) > 1:
            raise StoreError(f"{COVER_ALL!r} covers every story; choose it alone")
        return _Covers(every=True)
    visible = set(groups.visible_group_ids(db, owner))
    topic_ids: list[int] = []
    group_ids: list[int] = []
    issuer_ids: list[int] = []
    for text in chosen:
        if text.startswith(TOPIC_PREFIX):
            sql = "SELECT id FROM topics WHERE name=?"
            topic_ids.append(_lookup(db, sql, text[len(TOPIC_PREFIX) :], "topic"))
        elif text.startswith(ISSUER_PREFIX):
            sql = "SELECT id FROM issuers WHERE name=?"
            issuer_ids.append(_lookup(db, sql, text[len(ISSUER_PREFIX) :], "issuer"))
        elif text.startswith(GROUP_PREFIX):
            found = _lookup(
                db, "SELECT id FROM groups WHERE name=?", text[len(GROUP_PREFIX) :], "group"
            )
            if found not in visible:  # a group the owner cannot see is answered as one not there
                raise StoreError(f"there is no group called {text[len(GROUP_PREFIX) :]!r}")
            group_ids.append(found)
        else:
            raise StoreError(f"{text[:60]!r} is not one of the things a digest can cover")
    return _Covers(False, tuple(topic_ids), tuple(group_ids), tuple(issuer_ids))


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
    covers = _resolve_covers(db, owner, form.covers)
    length, points = LENGTHS[form.length]
    return Spec(
        name=plain_text(form.name, MAX_NAME, "the name"),
        schedule=when,
        covers_all=covers.every,
        topic_ids=covers.topics,
        group_ids=covers.groups,
        issuer_ids=covers.issuers,
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
        issuer_ids=_ids(db, "digest_issuers", "issuer_id", row["id"]),
    )
    asked = row["run_requested_at"]
    return Digest(
        row["id"],
        row["owner"],
        spec,
        datetime.fromisoformat(row["period_from"]),
        datetime.fromisoformat(row["next_run_at"]),
        None if asked is None else datetime.fromisoformat(asked),
        row["story_mark"],
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
    for table in ("digest_topics", "digest_groups", "digest_issuers"):
        db.execute(f"DELETE FROM {table} WHERE digest_id=?", (digest_id,))
    try:
        db.executemany(
            "INSERT INTO digest_topics(digest_id, topic_id) VALUES(?, ?)",
            [(digest_id, topic_id) for topic_id in spec.topic_ids],
        )
        db.executemany(
            "INSERT INTO digest_groups(digest_id, group_id) VALUES(?, ?)",
            [(digest_id, group_id) for group_id in spec.group_ids],
        )
        db.executemany(
            "INSERT INTO digest_issuers(digest_id, issuer_id) VALUES(?, ?)",
            [(digest_id, issuer_id) for issuer_id in spec.issuer_ids],
        )
    except sqlite3.IntegrityError as exc:
        raise Conflict(
            "a topic, group or issuer you chose was removed just now; choose again"
        ) from exc


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
    begins = _utc_text(schedule.previous_run(spec.schedule, first))
    with _write_transaction(db):
        count = db.execute("SELECT COUNT(*) FROM digests WHERE owner=?", (owner,)).fetchone()[0]
        if count >= MAX_DIGESTS:
            raise Conflict(f"you already have {MAX_DIGESTS} digests; delete one first")
        if db.execute("SELECT COUNT(*) FROM digests").fetchone()[0] >= MAX_ALL_DIGESTS:
            raise Conflict(f"Signal holds {MAX_ALL_DIGESTS} digests, the most it can hold")
        try:
            cur = db.execute(
                "INSERT INTO digests(owner, name, cadence, minute, weekday, month_day, covers_all,"
                " subject, length, points, upcoming, look_ahead_days, period_from, next_run_at,"
                " created_at, story_mark) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,"
                " (SELECT COALESCE(MAX(id), 0) FROM stories WHERE fetched_at <= ?))",
                (
                    owner,
                    *_fields(spec),
                    begins,
                    _utc_text(first),
                    _utc_text(now),
                    begins,
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
        tables = (
            "digest_runs",
            "digest_issues",
            "digest_topics",
            "digest_groups",
            "digest_issuers",
        )
        for table in tables:
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
    for issuer_id in digest.spec.issuer_ids:
        row = db.execute("SELECT name FROM issuers WHERE id=?", (issuer_id,)).fetchone()
        texts.append(ISSUER_PREFIX + row["name"])
    return texts


def covers_phrase(db: sqlite3.Connection, digest: Digest) -> str:
    """What the digest covers now as a phrase ("Shipping and Packaging"); empty for all stories
    and for a digest left with nothing to cover."""
    if digest.spec.covers_all:
        return ""
    names = [
        text.removeprefix(TOPIC_PREFIX).removeprefix(GROUP_PREFIX).removeprefix(ISSUER_PREFIX)
        for text in cover_texts(db, digest)
    ]
    if len(names) < 2:
        return "".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


def cover_options(db: sqlite3.Connection, owner: str | None, *, issuers: bool = False) -> list[str]:
    """Every cover the owner may choose: all stories, the groups they can see, the topics, and
    with `issuers` the issuers (by name, A to Z). With no owner (a viewer with no name) the
    groups are left out."""
    options = [COVER_ALL]
    if owner is not None:
        for group_id in groups.visible_group_ids(db, owner):
            row = db.execute("SELECT name FROM groups WHERE id=?", (group_id,)).fetchone()
            options.append(GROUP_PREFIX + row["name"])
    options += [
        TOPIC_PREFIX + row["name"] for row in db.execute("SELECT name FROM topics ORDER BY id")
    ]
    if issuers:
        names = [str(row["name"]) for row in db.execute("SELECT name FROM issuers")]
        options += [ISSUER_PREFIX + name for name in sorted(names, key=str.casefold)]
    return options


def covers_nothing(db: sqlite3.Connection, digest: Digest) -> bool:
    """Whether the digest has no cover left: not all stories, no topic, and no group its owner can
    see. A digest is left so when its topics or groups are deleted or its owner leaves the groups;
    editing it to choose a cover starts it again."""
    spec = digest.spec
    if spec.covers_all or spec.topic_ids or spec.issuer_ids:
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


def _seen_groups(db: sqlite3.Connection, digest: Digest) -> tuple[int, ...]:
    """The digest's covered groups its owner can see now, in id order."""
    visible = set(groups.visible_group_ids(db, digest.owner))
    return tuple(sorted(set(digest.spec.group_ids) & visible))


def _look_back(digest: Digest, start: datetime, end: datetime) -> datetime:
    """The earliest published time a story may have to be in scope: the period's start less the
    longer of the period and the schedule's own period (a day, a week, the month's length)."""
    due = schedule.next_run(digest.spec.schedule, start)
    own = due - schedule.previous_run(digest.spec.schedule, due)
    return start - max(end - start, own)


def _scope_stories(
    db: sqlite3.Connection, digest: Digest, start: datetime, end: datetime, upto: int
) -> tuple[ScopedStory, ...]:
    """The stories in scope for the period (start, end]: ids above the digest's mark up to `upto`,
    published after the look-back (``_look_back``), and the stories shared in a covered group in
    the period; highest signal then newest first, at most `SCOPE_CAP`; stories of the four feed
    kinds only (``SCOPE_CONDITION``)."""
    span = [_utc_text(start), _utc_text(end)]
    fresh = [digest.story_mark, upto, _utc_text(_look_back(digest, start, end))]
    spec = digest.spec
    parts: list[str] = []
    params: list[Any] = []
    if spec.covers_all:
        parts.append("SELECT id FROM stories WHERE id > ? AND id <= ? AND published_at > ?")
        params += fresh
    if spec.topic_ids:
        parts.append(
            "SELECT s.id FROM stories s JOIN topic_stories ts ON ts.story_id = s.id"
            f" WHERE ts.topic_id IN ({_marks(len(spec.topic_ids))})"
            " AND s.id > ? AND s.id <= ? AND s.published_at > ?"
        )
        params += [*spec.topic_ids, *fresh]
    if spec.issuer_ids:
        parts.append(
            "SELECT s.id FROM stories s JOIN issuer_stories l ON l.story_id = s.id"
            f" WHERE l.issuer_id IN ({_marks(len(spec.issuer_ids))})"
            " AND s.id > ? AND s.id <= ? AND s.published_at > ?"
        )
        params += [*spec.issuer_ids, *fresh]
    seen = _seen_groups(db, digest)
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
        f" WHERE s.id IN ({' UNION '.join(parts)}) AND {SCOPE_CONDITION}"
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
    upto = _highest_story(db)
    stories = () if bare else _scope_stories(db, digest, start, now, upto)
    wait = None if writer is None or not stories else writer.blocked(digest.owner)
    if wait is not None:  # raised inside the caller's transaction: nothing is changed
        raise _RetryLater(str(wait), fault=wait.fault, stories=len(stories))
    scope = Scope(digest, start, now, stories, upto, _seen_groups(db, digest))
    db.execute("UPDATE digests SET run_requested_at=NULL WHERE id=?", (digest.id,))
    if trigger == "schedule":
        due = schedule.next_run(digest.spec.schedule, now)
        db.execute("UPDATE digests SET next_run_at=? WHERE id=?", (_utc_text(due), digest.id))
    if stories and writer is not None and not bare:
        db.execute(
            "UPDATE digests SET claimed_by=?, claimed_at=? WHERE id=?",
            (trigger, _utc_text(writer.clock()), digest.id),
        )
        return scope
    if bare:
        run = Run("skipped", None, 0, NO_COVER)
    elif not stories:
        run = Run("nothing", add_issue(db, scope, NOTHING, now), 0, "no story was in scope")
    else:
        run = Run("skipped", None, len(stories), SKIPPED)
    _close(db, scope, run, trigger, now)
    return run


def _highest_story(db: sqlite3.Connection) -> int:
    return int(db.execute("SELECT COALESCE(MAX(id), 0) FROM stories").fetchone()[0])


def _close(db: sqlite3.Connection, scope: Scope, run: Run, trigger: Trigger, now: datetime) -> None:
    """Record the run and end its period (every run but a failed write does, so a period is never
    longer than the time since the last run; the stories of a skipped run are not carried on). The
    mark moves with the period, to the id the scope was read up to, and never down."""
    _record(db, scope, run, trigger, now)
    _unclaim(db, scope.digest.id)
    if not run.reason.startswith(NOT_WRITTEN):
        db.execute(
            "UPDATE digests SET period_from=?, story_mark=MAX(story_mark, ?) WHERE id=?",
            (_utc_text(now), scope.upto, scope.digest.id),
        )
    _prune(db, scope.digest.id)


def _unclaim(db: sqlite3.Connection, digest_id: int) -> None:
    db.execute("UPDATE digests SET claimed_by=NULL, claimed_at=NULL WHERE id=?", (digest_id,))


def _unchanged(db: sqlite3.Connection, scope: Scope) -> bool:
    """Whether the digest still exists with the settings and period start of its scope, and its
    owner still sees the covered groups the scope was read from (no fewer, no more)."""
    row = _row(db, scope.digest.id)
    if row is None:
        return False
    now = _digest(db, row)
    return (now.owner, now.spec, now.period_from, now.story_mark, _seen_groups(db, now)) == (
        scope.digest.owner,
        scope.digest.spec,
        scope.digest.period_from,
        scope.digest.story_mark,
        scope.groups,
    )


def _write(
    db: sqlite3.Connection, scope: Scope, trigger: Trigger, writer: Writer, now: datetime
) -> Run | None:
    """Draft the issue outside any transaction, then store it in one; None when the digest changed
    meanwhile (nothing is stored then). _RetryLater when the writer made no paid call: the digest
    is made due again as it was, with its period and its place in the queue."""
    count = len(scope.stories)
    try:
        draft = writer.draft(scope)
    except WriterFailed as failed:
        if failed.again:
            _due_again(db, scope)
            raise _RetryLater(str(failed), fault=failed.fault, stories=count) from None
        run = Run("skipped", None, count, f"{NOT_WRITTEN}{failed}")
        with _write_transaction(db):
            if not _unchanged(db, scope):
                _unclaim(db, scope.digest.id)
                return None
            _close(db, scope, run, trigger, now)  # the period stays where it was
        return run
    with _write_transaction(db):
        if not _unchanged(db, scope):
            log.warning("digest %s changed while its issue was written; dropped", scope.digest.id)
            _unclaim(db, scope.digest.id)
            return None
        run = Run("written", writer.store(db, scope, draft, now), count, "written by the AI pass")
        _close(db, scope, run, trigger, now)
    return run


def _due_again(db: sqlite3.Connection, scope: Scope) -> None:
    """Undo a run's claim: its scheduled time and the time its run was asked for are put back as
    they were, so it keeps its place among the due digests (longest due first)."""
    digest = scope.digest
    asked = None if digest.requested_at is None else _utc_text(digest.requested_at)
    with _write_transaction(db):
        _unclaim(db, digest.id)
        if not _unchanged(db, scope):
            return
        db.execute(
            "UPDATE digests SET next_run_at=?, run_requested_at=? WHERE id=?",
            (_utc_text(digest.next_run_at), asked, digest.id),
        )


def _moment(at: datetime, now: datetime) -> str:
    """ "14:35 UTC" on `now`'s UTC day, else "27 Nov 07:00 UTC"."""
    hours = f"{utc(at):%H:%M} UTC"
    return hours if utc(at).date() == utc(now).date() else f"{day(at, now)} {hours}"


def _run_refusal(db: sqlite3.Connection, digest: Digest, now: datetime) -> str | None:
    """Why "Run once now" may not run the digest at `now`, or None: within RUN_AGAIN_AFTER of its
    last run of any outcome, or, after a run whose paid model call wrote no issue, before its next
    scheduled time (one paid attempt per period)."""
    row = db.execute(
        "SELECT ran_at, reason FROM digest_runs WHERE digest_id=? ORDER BY id DESC LIMIT 1",
        (digest.id,),
    ).fetchone()
    if row is None:
        return None
    ran = datetime.fromisoformat(row["ran_at"])
    if now < ran + RUN_AGAIN_AFTER:
        again = _moment(ran + RUN_AGAIN_AFTER, now)
        return f"This digest ran at {_moment(ran, now)}. It can run again from {again}."
    if str(row["reason"]).startswith(NOT_WRITTEN) and now < digest.next_run_at:
        return (
            "The last run of this digest wrote no issue, so it runs again at its next scheduled"
            f" time, {_moment(digest.next_run_at, now)}."
        )
    return None


def _may_run_now(db: sqlite3.Connection, digest: Digest, now: datetime) -> Digest:
    refusal = _run_refusal(db, digest, now)
    if refusal is not None:
        raise Conflict(refusal)
    return digest


def run_now(
    db: sqlite3.Connection,
    owner: str,
    digest_id: int,
    now: datetime,
    writer: Writer | None = None,
) -> Run:
    """ "Run once now": a run of the owner's digest that leaves its schedule as it was. With a
    writer the model call is made outside any transaction; Conflict (``CHANGED``) when the digest
    changed while its issue was being written. Conflict too, with the sentence saying when it can
    run, when ``_run_refusal`` refuses it. A writer that made no paid call leaves the run as it
    was."""
    try:
        with _write_transaction(db):
            digest = _may_run_now(db, owned(db, owner, digest_id), now)
            planned = _plan(db, digest, now, "manual", writer)
        if isinstance(planned, Run):
            return planned
        assert writer is not None
        run = _write(db, planned, "manual", writer, now)
    except _RetryLater as later:
        return Run("skipped", None, later.stories, f"{NOT_WRITTEN}{later}")
    if run is None:
        raise Conflict(CHANGED)
    return run


def request_run(db: sqlite3.Connection, owner: str, digest_id: int, now: datetime) -> None:
    """Ask the background loop to run the owner's digest once (``run_due``): "Run once now" while
    AI is on, so no model call is made in a request handler. Refused as ``run_now`` is; asking
    again while a run is asked for keeps its first time, and so its place among the due digests."""
    with _write_transaction(db):
        _may_run_now(db, owned(db, owner, digest_id), now)
        db.execute(
            "UPDATE digests SET run_requested_at=coalesce(run_requested_at, ?) WHERE id=?",
            (_utc_text(now), digest_id),
        )


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


INTERRUPTED = f"{NOT_WRITTEN}the service stopped while its model call was in flight"


def recover_claims(db: sqlite3.Connection, before: datetime, now: datetime) -> int:
    """At start-up: every run claimed before `before` (its model call in flight then, so cut
    short by a crash or a stop) that left no result is recorded as one whose paid call wrote no
    issue (``INTERRUPTED``): its period stays, and it waits for its next scheduled time like any
    failed write. Younger claims are left (another process may own them). How many."""
    with _write_transaction(db):
        rows = db.execute(
            "SELECT * FROM digests WHERE claimed_at IS NOT NULL AND claimed_at < ?",
            (_utc_text(before),),
        ).fetchall()
        for row in rows:
            digest = _digest(db, row)
            claimed = datetime.fromisoformat(row["claimed_at"])
            scope = Scope(digest, min(digest.period_from, claimed), claimed, (), digest.story_mark)
            _close(db, scope, Run("skipped", None, 0, INTERRUPTED), row["claimed_by"], now)
    return len(rows)


def _record_failure(db: sqlite3.Connection, digest_id: int, now: datetime, name: str) -> None:
    """A run that raised is recorded as skipped and the digest moves to its next slot, with its
    period ended, so one bad digest is not retried on every pass and its period does not grow."""
    with _write_transaction(db):
        row = _row(db, digest_id)
        if row is None:
            return
        digest = _digest(db, row)
        scope = Scope(digest, min(digest.period_from, now), now, (), digest.story_mark)
        reason = f"the run failed ({name}); see the log"
        _record(db, scope, Run("skipped", None, 0, reason), "schedule", now)
        due = schedule.next_run(digest.spec.schedule, now)
        db.execute(
            "UPDATE digests SET next_run_at=?, period_from=?, story_mark=MAX(story_mark, ?),"
            " run_requested_at=NULL, claimed_by=NULL, claimed_at=NULL WHERE id=?",
            (_utc_text(due), _utc_text(now), _highest_story(db), digest_id),
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


def _run_one(
    db: sqlite3.Connection, digest_id: int, now: datetime, writer: Writer | None, results: Ran
) -> None:
    """Run one due digest into `results`; a fault is logged and recorded, or left due."""
    try:
        run = _run_scheduled(db, digest_id, now, writer)
    except _RetryLater as later:  # a fault is a warning; a limit doing its work is not
        level = logging.WARNING if later.fault else logging.INFO
        log.log(level, "digest %s: no paid call was made (%s); it stays due", digest_id, later)
        (results.left_due if later.fault else results.waiting).append(digest_id)
        return
    except sqlite3.OperationalError as error:
        if _passing(error):
            log.exception("digest %s could not run now (database busy or locked)", digest_id)
            results.left_due.append(digest_id)
            return
        log.exception("digest %s failed (a lasting database fault)", digest_id)
        if not _fail(db, digest_id, now, error):
            results.left_due.append(digest_id)
        return
    except Exception as error:
        log.exception("digest %s failed", digest_id)
        if not _fail(db, digest_id, now, error):
            results.left_due.append(digest_id)
        return
    if run is not None:
        results.append((digest_id, run))


def run_due(db: sqlite3.Connection, now: datetime, writer: Writer | None = None) -> Ran:
    """Run every digest whose time has come, once each, however many periods it missed, and every
    digest whose owner asked for a run (``request_run``): the one due longest first (by its
    scheduled time, or the time its run was asked for if earlier), at most DUE_PER_PASS runs; the
    others stay due for the next pass.

    A digest whose run raises is logged and recorded as skipped, its digest moved to its next
    slot, unless the fault may pass (the database was busy or locked, or the writer's call was not
    sent): that one is left due for the next tick and listed in ``left_due``. Either way the pass
    goes on to the others, even when recording a failure fails too. A run that needs a call the
    writer cannot make now (``Writer.blocked``: the writer stopped, at a refused call, a call not
    sent or its limits for this pass, or the owner's name has made its calls for the day) is left
    due exactly as it was, changing nothing, and listed in ``waiting`` (in ``left_due`` when the
    stop was a call not sent); it does not count among the pass's runs, and the pass goes on, so
    the runs that need no call (nothing in scope) and other names' runs are never held up."""
    due = db.execute(
        "SELECT id FROM digests WHERE next_run_at <= ? OR run_requested_at IS NOT NULL"
        " ORDER BY min(next_run_at, coalesce(run_requested_at, next_run_at)), id LIMIT ?",
        (_utc_text(now), MAX_ALL_DIGESTS),
    ).fetchall()
    results = Ran()
    for row in due:
        if len(results) >= DUE_PER_PASS:
            break
        _run_one(db, int(row["id"]), now, writer, results)
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
