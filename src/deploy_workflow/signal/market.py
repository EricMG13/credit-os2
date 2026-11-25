"""The market backdrop: one deterministic post a day, written by code from FRED's public CSV
(docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md, section 5). No AI.

The source. One source of kind ``market`` (``propose``, on the command line), which the owner
approves like any other. Each series is fetched through the fetch function the ingest pass uses
(``fetch.fetch`` and its rules), one request per series at ``SERIES_URL``, with no validators.

When. Once a UTC day, at or after the stored hour (``hour``, default ``DEFAULT_HOUR``), the
background loop's market job makes one attempt (``run_due``). An attempt that read no series is
tried again ``RETRY_AFTER`` later, the same UTC day. ``post_now`` (``signal market post``) makes
today's attempt now. At most one post a UTC day.

The arithmetic. Every value is a ``Decimal`` read from the CSV's text, never a float; "." or an
empty cell is a missing observation, never zero, and is passed over. Per series: the latest
observation and its own date; the previous one (the latest before it); the latest on or before
seven days earlier ("Week"); the latest on or before the same day of the month before, clamped to
that month's last day ("Month"). A change is latest minus earlier, exact; it is shown in basis
points for a series in Percent and as the plain difference with the unit otherwise, with its sign
only, no word judging it.

The post. Written only when some series has an observation newer than in the last post. Kind
``market``; title "Market backdrop: <the newest observation date>"; the stored summary one compact
line of each series' short name, value and change from the previous observation, at most 300
characters; the full table in ``market_posts`` (exact text, ISO dates), delivered separately. A
series that could not be fetched or read says so in its row, and the others are still posted. A
market post is not folded, matched to a topic or an issuer, or given to the AI pass.
"""

from __future__ import annotations

import calendar
import csv
import io
import json
import re
import sqlite3
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from deploy_workflow.signal import texts
from deploy_workflow.signal.feeds import SUMMARY_LIMIT
from deploy_workflow.signal.fetch import Fetched, FetchRefused
from deploy_workflow.signal.store import (
    MARKET,
    Check,
    Conflict,
    Missing,
    StoreError,
    _utc_text,
    _write_transaction,
    fresh_id,
    get_setting,
    insert_source,
    last_check,
    plain_text,
    record_check,
    set_setting,
    sources,
)

SOURCE_NAME = "Market backdrop (FRED)"
SOURCE_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv"
SERIES_URL = SOURCE_URL + "?id={id}"
POST_LINK = "https://fred.stlouisfed.org/"
DEFAULT_HOUR = 7
HOUR_KEY = "market_hour"
MAX_SERIES = 20
RETRY_AFTER = timedelta(hours=1)
PERCENT = "Percent"
LABELS = ("Previous", "Week", "Month")
NOTHING_READ = "no series could be read"
NO_SERIES = "the market post reads no series; add one with: signal market series add"
_ID = re.compile(r"[A-Z0-9_]{1,40}")
_NUMBER = re.compile(r"-?[0-9]+(?:\.[0-9]+)?")
_DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
_DATE_COLUMNS = ("observation_date", "date")
_MONTHS = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)  # fmt: skip
_ICE = "ICE Data Indices, LLC, via FRED"
_FRB = "Board of Governors of the Federal Reserve System (US), via FRED"
_TREASURY = "Market Yield on U.S. Treasury Securities at {}-Year Constant Maturity, Quoted on an"


class MarketError(ValueError):
    """A CSV that cannot be read, said in one sentence."""


@dataclass(frozen=True)
class Series:
    id: str
    title: str
    short: str
    unit: str
    source: str


DEFAULTS = (
    Series("BAMLH0A0HYM2", "ICE BofA US High Yield Index Option-Adjusted Spread", "US HY",
           PERCENT, _ICE),
    Series("BAMLH0A1HYBB", "ICE BofA BB US High Yield Index Option-Adjusted Spread", "US BB",
           PERCENT, _ICE),
    Series("BAMLH0A2HYB", "ICE BofA Single-B US High Yield Index Option-Adjusted Spread", "US B",
           PERCENT, _ICE),
    Series("BAMLH0A3HYC", "ICE BofA CCC & Lower US High Yield Index Option-Adjusted Spread",
           "US CCC", PERCENT, _ICE),
    Series("BAMLHE00EHYIOAS", "ICE BofA Euro High Yield Index Option-Adjusted Spread", "Euro HY",
           PERCENT, _ICE),
    Series("DGS2", _TREASURY.format(2) + " Investment Basis", "UST 2y", PERCENT, _FRB),
    Series("DGS10", _TREASURY.format(10) + " Investment Basis", "UST 10y", PERCENT, _FRB),
    Series("SOFR", "Secured Overnight Financing Rate", "SOFR", PERCENT,
           "Federal Reserve Bank of New York, via FRED"),
)  # fmt: skip


@dataclass(frozen=True)
class Observation:
    day: date
    value: Decimal
    text: str  # as the CSV wrote it


@dataclass(frozen=True)
class Change:
    label: str
    since: date | None  # the earlier observation's date; None: there is none
    change: Decimal | None  # latest minus earlier, in the series' unit


@dataclass(frozen=True)
class Row:
    series: Series
    latest: Observation | None
    changes: tuple[Change, ...]
    problem: str | None  # why the row has no value


@dataclass(frozen=True)
class Outcome:
    story_id: int | None
    reason: str


Fetch = Callable[[str, str | None, str | None], Fetched]


# Reading FRED's CSV


def _text(body: bytes) -> str:
    try:
        return body.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise MarketError("the CSV is not UTF-8 text") from None


def _observation(cells: list[str], line: int) -> tuple[date, Observation | None]:
    """The line's day and its observation (None: no observation that day, never zero)."""
    if len(cells) != 2:
        raise MarketError(f"line {line} does not hold two cells")
    stamp, value = cells[0].strip(), cells[1].strip()
    if not _DATE.fullmatch(stamp):
        raise MarketError(f"line {line}: {stamp!r} is not a date")
    try:
        day = date.fromisoformat(stamp)
    except ValueError:
        raise MarketError(f"line {line}: {stamp!r} is not a date") from None
    if value in ("", "."):
        return day, None
    if not _NUMBER.fullmatch(value):
        raise MarketError(f"line {line}: {value!r} is not a number")
    return day, Observation(day, Decimal(value), value)


def parse_csv(body: bytes, series_id: str) -> list[Observation]:
    """The observations of FRED's CSV for `series_id`, oldest first; MarketError otherwise."""
    lines = list(csv.reader(io.StringIO(_text(body))))
    header = [cell.strip() for cell in lines[0]] if lines else []
    if len(header) != 2 or header[0].lower() not in _DATE_COLUMNS or header[1].upper() != series_id:
        raise MarketError(f"the CSV's header is not observation_date,{series_id}")
    found: list[Observation] = []
    previous: date | None = None
    for line, cells in enumerate(lines[1:], start=2):
        if not cells:
            continue
        day, held = _observation(cells, line)
        if previous is not None and day <= previous:
            raise MarketError(f"line {line}: {day} is not after the line before")
        previous = day
        if held is not None:
            found.append(held)
    return found


# The table


def month_before(day: date) -> date:
    """The same day of the month before, clamped to that month's last day."""
    year, month = (day.year, day.month - 1) if day.month > 1 else (day.year - 1, 12)
    return date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def _on_or_before(observed: Sequence[Observation], limit: date) -> Observation | None:
    """The latest observation on or before `limit` (`observed` is oldest first)."""
    return next((one for one in reversed(observed) if one.day <= limit), None)


def table_row(series: Series, observed: Sequence[Observation]) -> Row:
    """The row of a series from its observations (oldest first)."""
    if not observed:
        return Row(series, None, (), "No observation in the data")
    latest = observed[-1]
    limits = (
        latest.day - timedelta(days=1),
        latest.day - timedelta(days=7),
        month_before(latest.day),
    )
    changes = []
    for label, limit in zip(LABELS, limits, strict=True):
        earlier = _on_or_before(observed, limit)
        changes.append(
            Change(label, None, None)
            if earlier is None
            else Change(label, earlier.day, latest.value - earlier.value)
        )
    return Row(series, latest, tuple(changes), None)


def row_of(series: Series, body: bytes) -> Row:
    """The row of a series from its CSV bytes; a CSV that cannot be read is said in the row."""
    try:
        return table_row(series, parse_csv(body, series.id))
    except MarketError as error:
        return Row(series, None, (), f"Could not be read: {error}")


def _plain(amount: Decimal) -> str:
    text = format(amount, "f")
    return text.rstrip("0").rstrip(".") if "." in text else text


def change_text(change: Decimal, unit: str) -> str:
    """ "+4 bp", "-3.5 bp", "0 bp" for a series in Percent; "-1.5 Index" for any other unit."""
    amount = change * 100 if unit == PERCENT else change
    suffix = "bp" if unit == PERCENT else unit
    if amount == 0:
        return f"0 {suffix}"
    return f"{'+' if amount > 0 else '-'}{_plain(abs(amount))} {suffix}"


def value_text(text: str, unit: str) -> str:
    return f"{text}%" if unit == PERCENT else f"{text} {unit}"


def _entry(row: Row) -> str:
    if row.latest is None:
        return f"{row.series.short} not available"
    head = f"{row.series.short} {value_text(row.latest.text, row.series.unit)}"
    first = row.changes[0]
    return (
        head if first.change is None else f"{head} ({change_text(first.change, row.series.unit)})"
    )


def summary(rows: Sequence[Row]) -> str:
    """One line of every row, cut to whole entries within SUMMARY_LIMIT characters."""
    entries = [_entry(row) for row in rows]
    whole = "; ".join(entries)
    if len(whole) <= SUMMARY_LIMIT:
        return whole
    for kept in range(len(entries) - 1, 0, -1):
        line = "; ".join(entries[:kept]) + f"; and {len(entries) - kept} more series"
        if len(line) <= SUMMARY_LIMIT:
            return line
    return f"{len(entries)} series"


def long_date(day: date) -> str:
    return f"{day.day} {_MONTHS[day.month - 1]} {day.year}"


# Stored tables


def _stored(row: Row) -> dict[str, object]:
    latest = row.latest
    return {
        "id": row.series.id,
        "title": row.series.title,
        "short": row.series.short,
        "unit": row.series.unit,
        "source": row.series.source,
        "value": None if latest is None else latest.text,
        "date": None if latest is None else latest.day.isoformat(),
        "changes": [
            {
                "label": c.label,
                "since": None if c.since is None else c.since.isoformat(),
                "change": None if c.change is None else str(c.change),
            }
            for c in row.changes
        ],
        "problem": row.problem,
    }


def _row(held: dict[str, object]) -> Row:
    series = Series(*(str(held[key]) for key in ("id", "title", "short", "unit", "source")))
    value, day = held["value"], held["date"]
    latest = (
        None
        if value is None or day is None
        else Observation(date.fromisoformat(str(day)), Decimal(str(value)), str(value))
    )
    changes = tuple(
        Change(
            str(c["label"]),
            None if c["since"] is None else date.fromisoformat(str(c["since"])),
            None if c["change"] is None else Decimal(str(c["change"])),
        )
        for c in held["changes"]  # type: ignore[attr-defined]
    )
    problem = held["problem"]
    return Row(series, latest, changes, None if problem is None else str(problem))


def post_rows(db: sqlite3.Connection, story_id: int) -> list[Row]:
    """The stored table of a market post (empty when the story is none)."""
    row = db.execute("SELECT rows FROM market_posts WHERE story_id=?", (story_id,)).fetchone()
    return [] if row is None else [_row(held) for held in json.loads(row["rows"])]


def tables(db: sqlite3.Connection, ids: Sequence[int]) -> dict[int, tuple[date, list[Row]]]:
    """The as-of date and table of each listed story that is a market post."""
    found: dict[int, tuple[date, list[Row]]] = {}
    unique = sorted(set(ids))
    for start in range(0, len(unique), 500):
        part = unique[start : start + 500]
        rows = db.execute(
            "SELECT story_id, as_of, rows FROM market_posts WHERE story_id IN"
            f" ({', '.join('?' * len(part))})",
            part,
        ).fetchall()
        for held in rows:
            table = [_row(one) for one in json.loads(held["rows"])]
            found[int(held["story_id"])] = (date.fromisoformat(held["as_of"]), table)
    return found


# Delivered (the snapshot's format 2: a market story's ``market`` key)


def _day(day: date, now: datetime) -> str:
    return texts.day(datetime(day.year, day.month, day.day, tzinfo=UTC), now)


def delivered(as_of: date, rows: Sequence[Row], now: datetime) -> dict[str, object]:
    """A market post's table as the page draws it: ``{asOf, rows}``; each row ``{id, name, short,
    unit, value, date, changes: [{label, since, value}], source, note}``, every text written here
    (a value as FRED wrote it, a date as "21 Nov", a change as "+4 bp"; null where there is none).
    """
    return {"asOf": long_date(as_of), "rows": [_delivered_row(row, now) for row in rows]}


def _delivered_row(row: Row, now: datetime) -> dict[str, object]:
    latest, unit = row.latest, row.series.unit
    return {
        "id": row.series.id,
        "name": row.series.title,
        "short": row.series.short,
        "unit": unit,
        "value": None if latest is None else latest.text,
        "date": None if latest is None else _day(latest.day, now),
        "changes": [
            {
                "label": change.label,
                "since": None if change.since is None else _day(change.since, now),
                "value": None if change.change is None else change_text(change.change, unit),
            }
            for change in row.changes
        ],
        "source": row.series.source,
        "note": row.problem,
    }


# The source, the series and the hour


def source(db: sqlite3.Connection) -> sqlite3.Row | None:
    """The market source (there is at most one), whatever its state."""
    held = [row for row in sources(db) if row["kind"] == MARKET]
    return held[0] if held else None


def _check_series(one: Series) -> Series:
    ident = one.id.strip().upper()
    if not _ID.fullmatch(ident):
        raise StoreError("a FRED series id is 1 to 40 letters, digits or underscores")
    return Series(
        ident,
        plain_text(one.title, 200, "a series title"),
        plain_text(one.short, 20, "a short name"),
        plain_text(one.unit, 60, "a unit"),
        plain_text(one.source, 200, "a source"),
    )


def _insert_series(db: sqlite3.Connection, one: Series, now: datetime) -> None:
    if db.execute("SELECT 1 FROM market_series WHERE id=?", (one.id,)).fetchone():
        raise Conflict(f"{one.id} is already a series of the market post")
    if db.execute("SELECT COUNT(*) FROM market_series").fetchone()[0] >= MAX_SERIES:
        raise Conflict(f"the market post reads at most {MAX_SERIES} series; remove one first")
    top = db.execute("SELECT COALESCE(MAX(position), 0) FROM market_series").fetchone()[0]
    db.execute(
        "INSERT INTO market_series(id, title, short, unit, source, position, added_at)"
        " VALUES(?, ?, ?, ?, ?, ?, ?)",
        (one.id, one.title, one.short, one.unit, one.source, int(top) + 1, _utc_text(now)),
    )


def propose(db: sqlite3.Connection, by: str, *, series: Sequence[Series] = DEFAULTS) -> int:
    """Store the market source as proposed, with `series` when none is stored; its id. Conflict
    when the market source is stored already."""
    checked = [_check_series(one) for one in series]
    now = datetime.now(UTC)
    with _write_transaction(db):
        held = source(db)
        if held is not None:
            raise Conflict(
                f"the market source is stored already: source {held['id']}, {held['state']}"
            )
        made = insert_source(db, SOURCE_NAME, MARKET, SOURCE_URL, by)
        if db.execute("SELECT COUNT(*) FROM market_series").fetchone()[0] == 0:
            for one in checked:
                _insert_series(db, one, now)
    return made


def add_series(db: sqlite3.Connection, one: Series, now: datetime) -> None:
    checked = _check_series(one)
    with _write_transaction(db):
        _insert_series(db, checked, now)


def remove_series(db: sqlite3.Connection, series_id: str) -> None:
    ident = series_id.strip().upper()
    with _write_transaction(db):
        if db.execute("DELETE FROM market_series WHERE id=?", (ident,)).rowcount == 0:
            raise Missing(f"no series {ident} in the market post")


def series(db: sqlite3.Connection) -> list[Series]:
    rows = db.execute(
        "SELECT id, title, short, unit, source FROM market_series ORDER BY position, id"
    ).fetchall()
    return [
        Series(*(str(row[key]) for key in ("id", "title", "short", "unit", "source")))
        for row in rows
    ]


def hour(db: sqlite3.Connection) -> int:
    held = get_setting(db, HOUR_KEY)
    return DEFAULT_HOUR if held is None else int(held)


def set_hour(db: sqlite3.Connection, value: int, now: datetime) -> None:
    if isinstance(value, bool) or not 0 <= value <= 23:
        raise StoreError("the hour is a whole number from 0 to 23 (UTC)")
    set_setting(db, HOUR_KEY, str(value), now)


# Due and posting


def _approved(db: sqlite3.Connection) -> sqlite3.Row | None:
    held = source(db)
    return held if held is not None and held["state"] == "approved" else None


def due(db: sqlite3.Connection, now: datetime) -> bool:
    """Whether the approved market source's attempt is due at `now`: from today's hour (UTC), when
    no attempt was made since then, or the last one read no series and is RETRY_AFTER old."""
    held = _approved(db)
    if held is None:
        return False
    at = now.astimezone(UTC)
    slot = at.replace(hour=hour(db), minute=0, second=0, microsecond=0)
    if at < slot:
        return False
    previous = last_check(db, held["id"])
    if previous is None:
        return True
    checked = datetime.fromisoformat(previous["at"])
    if checked < slot:
        return True
    return not previous["ok"] and checked <= at - RETRY_AFTER


def _today(db: sqlite3.Connection, held: sqlite3.Row, now: datetime) -> int | None:
    """Today's (UTC) market post, if one is written."""
    row = db.execute(
        "SELECT id FROM stories WHERE source_id=? AND link_key=?",
        (held["id"], _key(now)),
    ).fetchone()
    return None if row is None else int(row["id"])


def _key(now: datetime) -> str:
    return f"market:{now.astimezone(UTC).date().isoformat()}"


def _fetch_rows(db: sqlite3.Connection, fetch_fn: Fetch) -> list[Row]:
    rows = []
    for one in series(db):
        try:
            body = fetch_fn(SERIES_URL.format(id=one.id), None, None).body or b""
        except FetchRefused as error:
            rows.append(Row(one, None, (), f"Could not be read: {error}"))
            continue
        rows.append(row_of(one, body))
    return rows


def _last_dates(db: sqlite3.Connection, source_id: int) -> dict[str, str]:
    """Each series' latest observation date in the last post, as ISO text."""
    row = db.execute(
        "SELECT p.rows FROM market_posts p JOIN stories s ON s.id = p.story_id"
        " WHERE s.source_id=? ORDER BY s.published_at DESC, s.id DESC LIMIT 1",
        (source_id,),
    ).fetchone()
    if row is None:
        return {}
    return {str(one["id"]): str(one["date"]) for one in json.loads(row["rows"]) if one["date"]}


def _news(rows: Sequence[Row], last: dict[str, str]) -> bool:
    return any(
        row.latest is not None and row.latest.day.isoformat() > last.get(row.series.id, "")
        for row in rows
    )


def _write(db: sqlite3.Connection, source_id: int, rows: Sequence[Row], now: datetime) -> int:
    as_of = max(row.latest.day for row in rows if row.latest is not None)
    stamp = _utc_text(now)
    with _write_transaction(db):
        story = fresh_id(db, "stories")
        db.execute(
            "INSERT INTO stories(id, source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(?, ?, ?, ?, ?, '', ?, ?, ?)",
            (
                story,
                source_id,
                f"Market backdrop: {long_date(as_of)}",
                POST_LINK,
                _key(now),
                stamp,
                stamp,
                summary(rows),
            ),
        )
        db.execute(
            "INSERT INTO market_posts(story_id, as_of, rows) VALUES(?, ?, ?)",
            (story, as_of.isoformat(), json.dumps([_stored(row) for row in rows])),
        )
    return story


def _decide(db: sqlite3.Connection, held: sqlite3.Row, now: datetime, fetch_fn: Fetch) -> Outcome:
    written = _today(db, held, now)
    if written is not None:
        return Outcome(None, f"today's market post is written already: story {written}")
    rows = _fetch_rows(db, fetch_fn)
    if not rows:
        return Outcome(None, NO_SERIES)
    if all(row.latest is None for row in rows):
        return Outcome(None, NOTHING_READ)
    if not _news(rows, _last_dates(db, held["id"])):
        return Outcome(None, "no new observation since the last post")
    story = _write(db, held["id"], rows, now)
    return Outcome(story, f"posted story {story}")


def attempt(db: sqlite3.Connection, now: datetime, fetch_fn: Fetch) -> Outcome:
    """Today's attempt from the approved market source, recorded as the source's check (failed
    only when no series could be read); StoreError when no market source is approved."""
    held = _approved(db)
    if held is None:
        raise StoreError("no approved market source: propose it and have the owner approve it")
    outcome = _decide(db, held, now, fetch_fn)
    ok = outcome.reason not in (NO_SERIES, NOTHING_READ)
    posted = int(outcome.story_id is not None)
    record_check(db, held["id"], Check(now, ok, outcome.reason, None, None, posted))
    return outcome


def run_due(db: sqlite3.Connection, now: datetime, fetch_fn: Fetch) -> Outcome | None:
    """The background loop's market job: today's attempt when it is due (None otherwise)."""
    return attempt(db, now, fetch_fn) if due(db, now) else None


def post_now(db: sqlite3.Connection, now: datetime, fetch_fn: Fetch) -> Outcome:
    """``signal market post``: today's attempt now, whatever the hour. Conflict when today's post
    is written already; StoreError when no market source is approved."""
    held = _approved(db)
    if held is None:
        raise StoreError("no approved market source: propose it and have the owner approve it")
    written = _today(db, held, now)
    if written is not None:
        raise Conflict(f"today's market post is written already: story {written}")
    return attempt(db, now, fetch_fn)
