"""One ingest pass over the approved sources that are due, and a health summary per source.

The market source is not fetched here: its daily post is the background loop's market job
(``market``). A filing source is fetched only while the owner's contact is set and its issuer
links it (``filings``), each fetch in its one-second slot, at most ``filings.PER_PASS`` a pass; a
filing source skipped so records no check (it stays due). Its entries are stored as filing stories
(``filings.story_entry``) and belong to its issuer."""

import logging
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal, Protocol

from deploy_workflow.signal import fetch, filings, issuers, logos, market
from deploy_workflow.signal.feeds import Entry, FeedError, parse
from deploy_workflow.signal.fetch import Declared, Fetched, FetchRefused
from deploy_workflow.signal.fold import link_key
from deploy_workflow.signal.store import (
    FILING,
    MARKET,
    Check,
    _utc_text,
    add_story,
    last_check,
    prune_checks,
    record_check,
    set_meta,
    sources,
)
from deploy_workflow.signal.topics import match_story

log = logging.getLogger(__name__)

MIN_INTERVAL = timedelta(seconds=600)
QUIET_AFTER = timedelta(days=7)
HEALTH_WEEKS = 6
_WEEK = timedelta(days=7)
# Checks older than the weeks the service reads are pruned, at most this many per pass (a source's
# last check always stays); a store that never pruned catches up over a few hundred passes.
KEEP_CHECKS = HEALTH_WEEKS * _WEEK
PRUNE_PER_PASS = 10_000
# Entries one fetch stores at most (new or folded; those the source holds already are passed over),
# newest first: the rest wait for later passes, so one large feed never holds the loop for minutes.
ENTRIES_PER_FETCH = 500
_EPOCH = datetime(1970, 1, 1, tzinfo=UTC)


class FetchFn(Protocol):
    """``fetch.fetch``'s shape as the pass calls it (`declared`: for a filing source only)."""

    def __call__(
        self,
        url: str,
        etag: str | None,
        modified: str | None,
        /,
        *,
        declared: Declared | None = None,
    ) -> Fetched: ...


@dataclass(frozen=True)
class _Plan:
    """How one source is fetched and how its entries are stored."""

    fetch: Callable[[str, str | None, str | None], Fetched]
    shape: Callable[[Entry], Entry] = lambda entry: entry


def _is_due(db: sqlite3.Connection, source_id: int, now: datetime) -> bool:
    previous = last_check(db, source_id)
    return previous is None or datetime.fromisoformat(previous["at"]) <= now - MIN_INTERVAL


def _match_new(db: sqlite3.Connection, source_id: int, link: str) -> None:
    story = db.execute(
        "SELECT id FROM stories WHERE source_id=? AND link_key=?", (source_id, link_key(link))
    ).fetchone()
    match_story(db, story["id"])


def _check_source(db: sqlite3.Connection, source: sqlite3.Row, now: datetime, plan: _Plan) -> Check:
    previous = last_check(db, source["id"])
    etag = previous["etag"] if previous else None
    modified = previous["modified"] if previous else None
    try:
        fetched = plan.fetch(source["url"], etag, modified)
        if fetched.body is None:
            return Check(now, True, "not modified", etag, modified, 0)
        parsed = parse(fetched.body)
        entries = [plan.shape(entry) for entry in parsed.entries]
    except (FetchRefused, FeedError) as error:
        return Check(now, False, str(error), etag, modified, 0)
    logos.note_declared(db, source["id"], parsed.image)  # where its logo is fetched from
    new, stored, rest = 0, 0, 0
    for position, entry in enumerate(_newest_first(entries)):
        if stored >= ENTRIES_PER_FETCH:
            rest = len(entries) - position
            break
        outcome = add_story(db, source["id"], entry, now)
        stored += outcome != "seen"
        if outcome == "new":
            new += 1
            _match_new(db, source["id"], entry.link)
    if rest:  # no validators kept: the next pass reads the whole feed again and takes the rest
        reason = f"{new} new; up to {rest} older entries wait for the next pass"
        return Check(now, True, reason, None, None, new)
    return Check(now, True, f"{new} new", fetched.etag, fetched.modified, new)


def _newest_first(entries: list[Entry]) -> list[Entry]:
    """The entries newest first, undated ones last, in feed order otherwise."""
    return sorted(
        entries, key=lambda one: (one.published is None, -(one.published or _EPOCH).timestamp())
    )


def _filing_plan(
    db: sqlite3.Connection, source: sqlite3.Row, fetch_fn: FetchFn, pace: filings.Pace
) -> _Plan | None:
    """How a filing source is fetched: with the owner's contact, in its one-second slot, its
    entries shaped with its issuer's name; None while no contact is set or no issuer links it."""
    asking = filings.declared(db)
    owner = issuers.of_source(db, source["id"])
    if asking is None or owner is None:
        return None

    def paced(url: str, etag: str | None, modified: str | None) -> Fetched:
        fetch.check_form(
            url
        )  # a hand-edited row at another port is refused, never sent the contact
        filings.claim_slot(db, pace)
        return fetch_fn(url, etag, modified, declared=asking)

    return _Plan(paced, lambda entry: filings.story_entry(owner.name, entry))


def _plans(
    db: sqlite3.Connection, now: datetime, fetch_fn: FetchFn, pace: filings.Pace
) -> list[tuple[sqlite3.Row, _Plan]]:
    """The approved sources due now with how each is fetched: the market source never (its own
    job), a filing source as `_filing_plan` says and at most filings.PER_PASS of them."""
    planned: list[tuple[sqlite3.Row, _Plan]] = []
    filing = 0
    for source in sources(db, "approved"):
        if source["kind"] == MARKET or not _is_due(db, source["id"], now):
            continue
        if source["kind"] != FILING:
            planned.append((source, _Plan(fetch_fn)))
            continue
        plan = _filing_plan(db, source, fetch_fn, pace) if filing < filings.PER_PASS else None
        if plan is not None:
            filing += 1
            planned.append((source, plan))
    return planned


def run_due(
    db: sqlite3.Connection,
    now: datetime,
    fetch_fn: FetchFn | None = None,
    *,
    pace: filings.Pace | None = None,
) -> list[tuple[int, bool, str]]:
    """Check every approved source with no check in the last MIN_INTERVAL (the market source and
    filing sources as the module docstring says; `pace` is the filing spacing's clock).

    A refused fetch or an unreadable feed is recorded as a failed check with its own reason.
    Any other Exception is logged with its traceback and recorded as a failed check whose
    reason names only the exception type (the text may hold internal detail), keeping the
    previous etag and modified; the pass goes on to the later sources. This is a documented,
    logged fail-open so one bad source cannot starve the rest. BaseException is not caught.
    The pass ends by pruning checks older than KEEP_CHECKS (at most PRUNE_PER_PASS)."""
    results: list[tuple[int, bool, str]] = []
    chosen = fetch.fetch if fetch_fn is None else fetch_fn
    for source, plan in _plans(db, now, chosen, filings.Pace() if pace is None else pace):
        try:
            check = _check_source(db, source, now, plan)
        except Exception as error:
            log.exception("unexpected error checking source %s", source["id"])
            previous = last_check(db, source["id"])
            check = Check(
                now,
                False,
                f"unexpected error ({type(error).__name__}); see the log",
                previous["etag"] if previous else None,
                previous["modified"] if previous else None,
                0,
            )
        record_check(db, source["id"], check)
        results.append((source["id"], check.ok, check.reason))
    prune_checks(db, now - KEEP_CHECKS, PRUNE_PER_PASS)
    set_meta(db, "last_pass_at", _utc_text(now))
    return results


@dataclass(frozen=True)
class Health:
    state: Literal["healthy", "quiet", "failing", "never checked"]
    last_check: datetime | None
    last_item: datetime | None
    per_week: tuple[int, ...]
    reason: str


# A source's items (its stories and the duplicates folded from it) published in (:start, :end].
_ITEMS = (
    "SELECT published_at FROM stories WHERE source_id = :source"
    " AND published_at > :start AND published_at <= :end"
    " UNION ALL SELECT published_at FROM story_duplicates WHERE duplicate_source_id = :source"
    " AND published_at > :start AND published_at <= :end"
)
_NEWEST = (
    "SELECT MAX(at) FROM (SELECT MAX(published_at) AS at FROM stories WHERE source_id = :source"
    " UNION ALL SELECT MAX(published_at) FROM story_duplicates"
    " WHERE duplicate_source_id = :source)"
)


def _per_week(db: sqlite3.Connection, source_id: int, now: datetime) -> tuple[int, ...]:
    """Items per 7-day window ending at `now`, oldest first; a window is (start, end]. Counted in
    SQL over the source's index range of the HEALTH_WEEKS weeks (stored times are UTC text, whose
    order is their time order)."""
    edges = {f"e{k}": _utc_text(now - (HEALTH_WEEKS - k) * _WEEK) for k in range(HEALTH_WEEKS + 1)}
    counts = ", ".join(
        f"COALESCE(SUM(published_at > :e{k} AND published_at <= :e{k + 1}), 0)"
        for k in range(HEALTH_WEEKS)
    )
    row = db.execute(
        f"SELECT {counts} FROM ({_ITEMS})",
        {"source": source_id, "start": edges["e0"], "end": edges[f"e{HEALTH_WEEKS}"], **edges},
    ).fetchone()
    return tuple(int(n) for n in row)


def health(db: sqlite3.Connection, source_id: int, now: datetime) -> Health:
    newest = db.execute(_NEWEST, {"source": source_id}).fetchone()[0]
    last_item = None if newest is None else datetime.fromisoformat(newest)
    weeks = _per_week(db, source_id, now)
    previous = last_check(db, source_id)
    if previous is None:
        return Health("never checked", None, last_item, weeks, "")
    checked = datetime.fromisoformat(previous["at"])
    state: Literal["healthy", "quiet", "failing"]
    reason = str(previous["reason"])
    partly = None if not previous["ok"] else market.failing_note(db, source_id)
    if not previous["ok"] or partly is not None:
        state = "failing"  # a market attempt that read some series names those it could not
        reason = reason if partly is None else partly
    elif last_item is None or last_item < now - QUIET_AFTER:
        state = "quiet"
    else:
        state = "healthy"
    return Health(state, checked, last_item, weeks, reason)
