"""Signal's monthly AI spend: the owner's cap, the reserve-then-settle ledger and the switch-off.

Money code. Every amount is USD (``CURRENCY``), a ``Decimal`` end to end, stored as exact decimal
text (``pricing.money_text``) and summed exactly (``budget.exact_sum``, which refuses to round). No
float touches an amount. ``deploy_workflow.model.budget`` keeps a per-run ledger in marker files
under one run folder; a monthly ledger shared by several processes needs SQLite, so this is a small
ledger of the same reserve-then-settle design (spec 5.10).

The rules, each applied inside one write transaction (``BEGIN IMMEDIATE``), so two passes in two
processes are serialised by the database lock and cannot both fit under the cap:

* The ledger and the cap are per Signal store (the ``signal.db`` under one ``--root``): a second
  root, or a store deleted and made again, starts its month at zero.
* A month is a UTC calendar month (``month_of``). A call counts in the month of its reservation,
  whenever it settles.
* ``spent`` is the month's settled actual costs plus the full reservation of every call whose cost
  could not be established; ``held`` is the month's open reservations. ``reserve`` refuses a call
  unless ``spent + held + reservation <= cap``, where the cap is the lower of the owner's stored
  cap and the ruled cap its caller checked just before; it refuses every call while no cap is set
  or while the pass is switched off.
* The digest writer makes at most ``digests_per_day`` calls in one UTC day for the whole service
  (``DIGESTS_PER_DAY`` until the owner sets it with ``signal ai digests-per-day <n>``), and at most
  ``digests_per_name`` for the digests of any one name (``DIGESTS_PER_NAME`` until the owner sets it
  with ``signal ai digests-per-name <n>``; a digest call's row carries its digest's owner);
  ``reserve`` refuses the next one (``day_full``; ``NameFull``). Every call reserved counts,
  whatever became of it, except one the adapter established was not sent (it cost nothing). So
  deleting and re-creating digests, or editing their schedules, cannot pass either limit. The rows
  of calls not sent are pruned once older than ``NOT_SENT_KEPT``, in the reserve transaction.
* ``settle`` records the actual cost. A cost that cannot be established (``None``) leaves the call
  counted at its full reservation (status ``unknown``) and switches the pass off until the owner
  clears it (``clear``); it is never counted as zero. A cost above the reservation is recorded in
  full and switches the pass off too: the worst case was wrong, so the cap is no longer assured.
* A reservation left open by a crash stays counted. Once it is older than ``STALE_AFTER`` (twice the
  model adapter's own 30-minute bound on a call) it is taken as a call whose cost cannot be
  established: it becomes ``unknown`` at its full reservation and the pass is switched off. Nothing
  else ever releases a reservation, and a call already taken as ``unknown`` keeps its full amount
  even if its settlement arrives later.

So long as no call costs more than its reservation, a month's ``spent + held`` never passes the
cap in force when its calls were reserved (``tests/test_signal_ai_ledger.py`` checks this over
arbitrary sequences of calls, failures, crashes, two processes and month ends).
"""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Literal

from deploy_workflow.model.budget import exact_sum
from deploy_workflow.model.pricing import money_text
from deploy_workflow.model.transport import OVERALL_S
from deploy_workflow.signal.store import StoreError, _utc_text, _write_transaction

CURRENCY = "USD"
STALE_AFTER = timedelta(hours=1)
# The model adapter's own bound on one call (its overall bound, with a minute for its abort and
# teardown): a call reserved longer ago than this is no longer in flight in any process.
CALL_BOUND = timedelta(seconds=OVERALL_S) + timedelta(minutes=1)
MAX_CAP = Decimal(100000)
DIGESTS_PER_DAY = 50  # the digest writer's calls a UTC day for the whole service, until set
DIGESTS_PER_NAME = 5  # the digest writer's calls a UTC day for one name's digests, until set
MAX_DIGESTS_PER_DAY = 1000  # the most either limit may be set to
NOT_SENT_KEPT = timedelta(days=1)
PRUNE_SPAN = timedelta(days=30)
_CAP = "ai_cap_usd"
_OFF = "ai_switched_off"
_PER_DAY = "ai_digests_per_day"
_PER_NAME = "ai_digests_per_name"
_NOT_SENT = "not_sent:%"  # the outcome of a call the adapter established was not sent

_STORE_ID = re.compile(r"[0-9a-f]{16}", re.ASCII)

Purpose = Literal["stories", "digest"]


def is_busy(error: sqlite3.OperationalError) -> bool:
    """Whether the fault is the database being busy or locked (SQLITE_BUSY, SQLITE_LOCKED, their
    extended codes included): a fault that may pass."""
    code = getattr(error, "sqlite_errorcode", None)
    return isinstance(code, int) and code & 0xFF in (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED)


class Refused(Exception):
    """No call is made: no cap is set, the pass is switched off, or the call would pass the cap."""


class NameFull(Refused):
    """No call is made: the digests of this name have made the day's calls a name may make."""


@dataclass(frozen=True)
class Month:
    """One UTC month of the ledger, in USD."""

    month: str
    spent: Decimal  # settled actual costs, plus unknown costs at their full reservation
    held: Decimal  # open reservations
    open_calls: int
    unknown_calls: int

    @property
    def total(self) -> Decimal:
        return exact_sum((self.spent, self.held))


def month_of(at: datetime) -> str:
    """The UTC month of `at`, as YYYY-MM."""
    return f"{at.astimezone(UTC):%Y-%m}"


def _amount(text: str) -> Decimal:
    return Decimal(text)


def _minute(at: datetime) -> str:
    return f"{at.astimezone(UTC):%Y-%m-%d %H:%M} UTC"


def parse_cap(text: str) -> Decimal:
    """A cap as the owner types it: a plain positive decimal of at most two places, below
    `MAX_CAP`; StoreError otherwise. "15", "15.5" and "15.00" are accepted; "1e3", "-1", "0",
    "15.001", "NaN" and "Infinity" are not."""
    cleaned = text.strip()
    if not cleaned or any(ch not in "0123456789." for ch in cleaned) or cleaned.count(".") > 1:
        raise StoreError("the cap is a plain amount in USD, such as 15 or 15.50")
    try:
        amount = Decimal(cleaned)
    except InvalidOperation:
        raise StoreError("the cap is a plain amount in USD, such as 15 or 15.50") from None
    exponent = amount.as_tuple().exponent
    if not isinstance(exponent, int) or exponent < -2:
        raise StoreError("the cap has at most two decimal places")
    if not Decimal(0) < amount < MAX_CAP:
        raise StoreError(f"the cap is more than 0 and less than {CURRENCY} {MAX_CAP}")
    return amount


def _setting(db: sqlite3.Connection, key: str) -> sqlite3.Row | None:
    row: sqlite3.Row | None = db.execute(
        "SELECT value, set_at FROM settings WHERE key=?", (key,)
    ).fetchone()
    return row


def cap(db: sqlite3.Connection) -> Decimal | None:
    """The owner's monthly cap in USD, or None while none is set."""
    row = _setting(db, _CAP)
    return None if row is None else _amount(row["value"])


def set_cap(db: sqlite3.Connection, amount: Decimal, now: datetime) -> None:
    checked = parse_cap(money_text(amount))
    with _write_transaction(db):
        db.execute(
            "INSERT OR REPLACE INTO settings(key, value, set_at) VALUES(?, ?, ?)",
            (_CAP, money_text(checked), _utc_text(now)),
        )


def store_id(db: sqlite3.Connection) -> str:
    """The store's own random id (made with the store, ``meta.store_id``): 16 lower-case hex
    digits. StoreError for any other value (a hand-edited row), so no exchange name is built from
    it and no call is reserved or made."""
    row = db.execute("SELECT value FROM meta WHERE key='store_id'").fetchone()
    if row is None:
        raise StoreError("the store has no store_id")
    value = row["value"]
    if not isinstance(value, str) or _STORE_ID.fullmatch(value) is None:
        raise StoreError("the store's store_id is not 16 lower-case hex digits; it was edited")
    return value


def _parse_count(text: str, what: str, example: int) -> int:
    """A whole number from 0 to `MAX_DIGESTS_PER_DAY` in plain digits; StoreError otherwise."""
    cleaned = text.strip()
    if not (cleaned.isascii() and cleaned.isdecimal()) or len(cleaned) > 4:
        raise StoreError(f"the {what} are a whole number, such as {example}")
    count = int(cleaned)
    if count > MAX_DIGESTS_PER_DAY:
        raise StoreError(f"the {what} are at most {MAX_DIGESTS_PER_DAY}")
    return count


def parse_per_day(text: str) -> int:
    """The digest writer's calls a day as the owner types them (0 to 1000)."""
    return _parse_count(text, "digest calls a day", DIGESTS_PER_DAY)


def parse_per_name(text: str) -> int:
    """The digest writer's calls a day for one name's digests as the owner types them (0 to
    1000)."""
    return _parse_count(text, "digest calls a name a day", DIGESTS_PER_NAME)


def _stored_count(db: sqlite3.Connection, key: str, default: int) -> int:
    row = _setting(db, key)
    return default if row is None else int(row["value"])


def _set_count(db: sqlite3.Connection, key: str, count: int, now: datetime) -> None:
    with _write_transaction(db):
        db.execute(
            "INSERT OR REPLACE INTO settings(key, value, set_at) VALUES(?, ?, ?)",
            (key, str(count), _utc_text(now)),
        )


def digests_per_day(db: sqlite3.Connection) -> int:
    """The most digest-writer calls the whole service makes in one UTC day."""
    return _stored_count(db, _PER_DAY, DIGESTS_PER_DAY)


def set_digests_per_day(db: sqlite3.Connection, count: int, now: datetime) -> None:
    _set_count(db, _PER_DAY, parse_per_day(str(count)), now)


def digests_per_name(db: sqlite3.Connection) -> int:
    """The most digest-writer calls one name's digests make in one UTC day."""
    return _stored_count(db, _PER_NAME, DIGESTS_PER_NAME)


def set_digests_per_name(db: sqlite3.Connection, count: int, now: datetime) -> None:
    _set_count(db, _PER_NAME, parse_per_name(str(count)), now)


def _day_span(at: datetime) -> tuple[str, str]:
    """`at`'s UTC day as the text bounds its stored times sort between."""
    day = at.astimezone(UTC).date()
    return f"{day:%Y-%m-%d}", f"{day + timedelta(days=1):%Y-%m-%d}"


def digest_calls_on(db: sqlite3.Connection, at: datetime, owner: str | None = None) -> int:
    """The digest-writer calls reserved in `at`'s UTC day (for `owner`'s digests, when given),
    whatever became of them, except calls the adapter established were not sent."""
    start, end = _day_span(at)
    sql = (
        "SELECT COUNT(*) FROM ai_usage WHERE purpose='digest' AND reserved_at >= ?"
        " AND reserved_at < ? AND outcome NOT LIKE ?"
    )
    params: tuple[str, ...] = (start, end, _NOT_SENT)
    if owner is not None:
        sql, params = sql + " AND owner=?", (*params, owner)
    return int(db.execute(sql, params).fetchone()[0])


def name_calls_on(db: sqlite3.Connection, owner: str, at: datetime) -> int:
    """The digest-writer calls reserved in `at`'s UTC day for `owner`'s digests."""
    return digest_calls_on(db, at, owner)


def day_full(count: int) -> str:
    """Why a digest call is refused once the day's calls are made."""
    return (
        f"the digests have made today's {count} model calls, the most a day allows;"
        " the others wait until 00:00 UTC"
    )


def name_full(count: int) -> str:
    """Why a digest call is refused once a name's digests have made the day's calls."""
    return (
        f"this name's digests have made today's {count} model calls, the most a name may make"
        " a day; they wait until 00:00 UTC"
    )


def switched_off(db: sqlite3.Connection) -> tuple[str, datetime] | None:
    """Why and when the pass was switched off for a cost it could not establish, or None."""
    row = _setting(db, _OFF)
    return None if row is None else (str(row["value"]), datetime.fromisoformat(row["set_at"]))


def _switch_off(db: sqlite3.Connection, reason: str, now: datetime) -> None:
    """Inside the caller's write transaction; the first reason stands until the owner clears it."""
    db.execute(
        "INSERT OR IGNORE INTO settings(key, value, set_at) VALUES(?, ?, ?)",
        (_OFF, reason, _utc_text(now)),
    )


def clear(db: sqlite3.Connection) -> bool:
    """The owner's clear of the switch-off; False when the pass was not switched off. The calls
    behind it stay counted at their full reservation."""
    with _write_transaction(db):
        cur = db.execute("DELETE FROM settings WHERE key=?", (_OFF,))
    return cur.rowcount > 0


def totals(db: sqlite3.Connection, month: str) -> Month:
    """The month's spend and holds, read in the caller's transaction (or as one statement)."""
    rows = db.execute(
        "SELECT status, reserved_usd, settled_usd FROM ai_usage WHERE month=?", (month,)
    ).fetchall()
    spent = [
        _amount(r["settled_usd"] if r["status"] == "settled" else r["reserved_usd"])
        for r in rows
        if r["status"] != "open"
    ]
    held = [_amount(r["reserved_usd"]) for r in rows if r["status"] == "open"]
    return Month(
        month,
        exact_sum(spent),
        exact_sum(held),
        len(held),
        sum(r["status"] == "unknown" for r in rows),
    )


def _expire(db: sqlite3.Connection, now: datetime, bound: timedelta = STALE_AFTER) -> int:
    """Inside the caller's write transaction: every open reservation older than `bound` becomes a
    call of unknown cost (counted in full), and the pass is switched off. Returns how many."""
    limit = _utc_text(now - bound)
    stale = db.execute(
        "SELECT id, reserved_at FROM ai_usage WHERE status='open' AND reserved_at < ? ORDER BY id",
        (limit,),
    ).fetchall()
    for row in stale:
        db.execute(
            "UPDATE ai_usage SET status='unknown', outcome='never settled', settled_at=?"
            " WHERE id=?",
            (_utc_text(now), row["id"]),
        )
    if stale:
        when = datetime.fromisoformat(stale[0]["reserved_at"])
        _switch_off(db, f"a call reserved at {_minute(when)} was never settled", now)
    return len(stale)


def expire(db: sqlite3.Connection, now: datetime, bound: timedelta = STALE_AFTER) -> int:
    """Apply the stale-reservation rule now (the background loop does, every tick, with
    STALE_AFTER; a process starting up does with CALL_BOUND, since no call older than the
    adapter's own bound can still be in flight anywhere)."""
    with _write_transaction(db):
        return _expire(db, now, bound)


def _prune(db: sqlite3.Connection, now: datetime) -> None:
    """Inside the caller's write transaction: drop the rows of calls not sent (they cost nothing
    and count toward nothing) once older than NOT_SENT_KEPT, so a call refused before sending on
    every tick does not grow the ledger without bound. Only the PRUNE_SPAN before that is looked
    at (an index range, not the whole ledger): every reservation prunes, so nothing older is
    left while the service runs."""
    cut = now - NOT_SENT_KEPT
    db.execute(
        "DELETE FROM ai_usage WHERE purpose IN ('stories', 'digest') AND reserved_at >= ?"
        " AND reserved_at < ? AND status='settled' AND outcome LIKE ?",
        (_utc_text(cut - PRUNE_SPAN), _utc_text(cut), _NOT_SENT),
    )


def reserve(  # noqa: PLR0913 -- one call's record (purpose, configuration, hold, time) and its cap
    db: sqlite3.Connection,
    purpose: Purpose,
    config_id: str,
    usd: Decimal,
    now: datetime,
    *,
    ruled_cap: Decimal,
    owner: str | None = None,
) -> int:
    """Hold `usd` for one call and return the call's id; Refused when no call may be made.

    The limit is the lower of the owner's stored cap and `ruled_cap`, the cap of the ruling the
    caller checked just before (``ai_call.call``), so a ruling lowered below the stored cap bounds
    the very next call. A digest call names `owner`, its digest's owner, for the per-name limit
    (StoreError without one); a story call names none. The checks and the hold are one write
    transaction."""
    if not isinstance(usd, Decimal) or not usd.is_finite() or usd <= 0:
        raise StoreError("a reservation is a positive Decimal amount")
    if not isinstance(ruled_cap, Decimal) or not ruled_cap.is_finite() or ruled_cap <= 0:
        raise StoreError("the ruled cap is a positive Decimal amount")
    if (purpose == "digest") != isinstance(owner, str):
        raise StoreError("a digest call names its digest's owner, and only a digest call does")
    month = month_of(now)
    with _write_transaction(db):
        _expire(db, now)  # committed whether or not the call is refused
        _prune(db, now)
        refusal = _refusal(db, purpose, usd, now, ruled_cap, owner)
        if refusal is None:
            cur = db.execute(
                "INSERT INTO ai_usage(purpose, owner, config_id, month, reserved_usd, status,"
                " outcome, reserved_at) VALUES(?, ?, ?, ?, ?, 'open', 'in progress', ?)",
                (purpose, owner, config_id, month, money_text(usd), _utc_text(now)),
            )
    if refusal is not None:
        raise refusal
    assert cur.lastrowid is not None
    return cur.lastrowid


def _refusal(  # noqa: PLR0913 -- the call's purpose, hold, time, ruled cap and owner
    db: sqlite3.Connection,
    purpose: Purpose,
    usd: Decimal,
    now: datetime,
    ruled_cap: Decimal,
    owner: str | None,
) -> Refused | None:
    """Inside the caller's write transaction: why the call may not be reserved, or None."""
    if switched_off(db) is not None:
        return Refused("the AI pass is switched off until the owner clears it")
    stored = cap(db)
    if stored is None:
        return Refused("no monthly cap is set")
    limit = min(stored, ruled_cap)
    if purpose == "digest":
        per_day, per_name = digests_per_day(db), digests_per_name(db)
        if digest_calls_on(db, now) >= per_day:
            return Refused(day_full(per_day))
        if owner is not None and digest_calls_on(db, now, owner) >= per_name:
            return NameFull(name_full(per_name))
    if exact_sum((totals(db, month_of(now)).total, usd)) > limit:
        return Refused(f"the call would pass the monthly cap of {CURRENCY} {money_text(limit)}")
    return None


def settle(
    db: sqlite3.Connection, call_id: int, actual: Decimal | None, outcome: str, now: datetime
) -> None:
    """Record what call `call_id` cost: `actual` in USD, or None when it cannot be established.

    A call no longer open (taken as unknown after STALE_AFTER) keeps its full reservation."""
    if actual is not None and (not actual.is_finite() or actual < 0):
        raise StoreError("an actual cost is a finite, non-negative Decimal")
    with _write_transaction(db):
        row = db.execute(
            "SELECT reserved_usd, status FROM ai_usage WHERE id=?", (call_id,)
        ).fetchone()
        if row is None:
            raise StoreError(f"no AI call with id {call_id}")
        if row["status"] != "open":
            return
        stamp = _utc_text(now)
        if actual is None:
            db.execute(
                "UPDATE ai_usage SET status='unknown', outcome=?, settled_at=? WHERE id=?",
                (outcome, stamp, call_id),
            )
            _switch_off(db, f"the cost of a call made at {_minute(now)} is not known", now)
            return
        db.execute(
            "UPDATE ai_usage SET status='settled', settled_usd=?, outcome=?, settled_at=?"
            " WHERE id=?",
            (money_text(actual), outcome, stamp, call_id),
        )
        if actual > _amount(row["reserved_usd"]):
            _switch_off(db, f"a call made at {_minute(now)} cost more than it held", now)


def relabel(db: sqlite3.Connection, call_id: int, outcome: str) -> None:
    """Replace a settled call's outcome text (the pass names a reply it could not read)."""
    with _write_transaction(db):
        db.execute("UPDATE ai_usage SET outcome=? WHERE id=?", (outcome[:80], call_id))


__all__ = [
    "CALL_BOUND",
    "CURRENCY",
    "DIGESTS_PER_DAY",
    "DIGESTS_PER_NAME",
    "STALE_AFTER",
    "Month",
    "NameFull",
    "Refused",
    "cap",
    "clear",
    "day_full",
    "digest_calls_on",
    "digests_per_day",
    "digests_per_name",
    "expire",
    "month_of",
    "name_calls_on",
    "name_full",
    "parse_cap",
    "parse_per_day",
    "parse_per_name",
    "relabel",
    "reserve",
    "set_cap",
    "set_digests_per_day",
    "set_digests_per_name",
    "settle",
    "store_id",
    "switched_off",
    "totals",
]
