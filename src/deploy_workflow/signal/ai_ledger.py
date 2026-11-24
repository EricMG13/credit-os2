"""Signal's monthly AI spend: the owner's cap, the reserve-then-settle ledger and the switch-off.

Money code. Every amount is USD (``CURRENCY``), a ``Decimal`` end to end, stored as exact decimal
text (``pricing.money_text``) and summed exactly (``budget.exact_sum``, which refuses to round). No
float touches an amount. ``deploy_workflow.model.budget`` keeps a per-run ledger in marker files
under one run folder; a monthly ledger shared by several processes needs SQLite, so this is a small
ledger of the same reserve-then-settle design (spec 5.10).

The rules, each applied inside one write transaction (``BEGIN IMMEDIATE``), so two passes in two
processes are serialised by the database lock and cannot both fit under the cap:

* A month is a UTC calendar month (``month_of``). A call counts in the month of its reservation,
  whenever it settles.
* ``spent`` is the month's settled actual costs plus the full reservation of every call whose cost
  could not be established; ``held`` is the month's open reservations. ``reserve`` refuses a call
  unless ``spent + held + reservation <= cap``; it refuses every call while no cap is set or while
  the pass is switched off.
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

import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Literal

from deploy_workflow.model.budget import exact_sum
from deploy_workflow.model.pricing import money_text
from deploy_workflow.signal.store import StoreError, _utc_text, _write_transaction

CURRENCY = "USD"
STALE_AFTER = timedelta(hours=1)
MAX_CAP = Decimal(100000)
_CAP = "ai_cap_usd"
_OFF = "ai_switched_off"

Purpose = Literal["stories", "digest"]


class Refused(Exception):
    """No call is made: no cap is set, the pass is switched off, or the call would pass the cap."""


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


def _expire(db: sqlite3.Connection, now: datetime) -> int:
    """Inside the caller's write transaction: every open reservation older than STALE_AFTER becomes
    a call of unknown cost (counted in full), and the pass is switched off. Returns how many."""
    limit = _utc_text(now - STALE_AFTER)
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


def expire(db: sqlite3.Connection, now: datetime) -> int:
    """Apply the stale-reservation rule now (the background loop does, every tick)."""
    with _write_transaction(db):
        return _expire(db, now)


def reserve(
    db: sqlite3.Connection, purpose: Purpose, config_id: str, usd: Decimal, now: datetime
) -> int:
    """Hold `usd` for one call and return the call's id; Refused when no call may be made.

    The cap check and the hold are one write transaction."""
    if not isinstance(usd, Decimal) or not usd.is_finite() or usd <= 0:
        raise StoreError("a reservation is a positive Decimal amount")
    month = month_of(now)
    with _write_transaction(db):
        _expire(db, now)
        if switched_off(db) is not None:
            raise Refused("the AI pass is switched off until the owner clears it")
        limit = cap(db)
        if limit is None:
            raise Refused("no monthly cap is set")
        if exact_sum((totals(db, month).total, usd)) > limit:
            raise Refused(f"the call would pass the monthly cap of {CURRENCY} {money_text(limit)}")
        cur = db.execute(
            "INSERT INTO ai_usage(purpose, config_id, month, reserved_usd, status, outcome,"
            " reserved_at) VALUES(?, ?, ?, ?, 'open', 'in progress', ?)",
            (purpose, config_id, month, money_text(usd), _utc_text(now)),
        )
    assert cur.lastrowid is not None
    return cur.lastrowid


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
    "CURRENCY",
    "STALE_AFTER",
    "Month",
    "Refused",
    "cap",
    "clear",
    "expire",
    "month_of",
    "parse_cap",
    "relabel",
    "reserve",
    "set_cap",
    "settle",
    "switched_off",
    "totals",
]
