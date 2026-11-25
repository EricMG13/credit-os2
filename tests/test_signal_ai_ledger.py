"""Signal's AI spend ledger (spec 5.10): the cap, reserve then settle, unknown costs, crashes,
two processes and month ends. SYNTHETIC: no model is called; amounts are written by hand in USD.
"""

from __future__ import annotations

import multiprocessing as mp
import sqlite3
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from deploy_workflow.signal import ai_ledger
from deploy_workflow.signal.ai_ledger import Refused
from deploy_workflow.signal.store import StoreError, open_db

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
CONFIG = "copilot-luna-xhigh"
RULED = Decimal(100000)  # a ruled cap above every stored one: the stored cap binds


@pytest.fixture
def db(tmp_path: Path) -> Any:
    held = open_db(tmp_path)
    yield held
    held.close()


def _row(db: sqlite3.Connection, call_id: int) -> tuple[str, str | None, str]:
    row = db.execute(
        "SELECT reserved_usd, settled_usd, status FROM ai_usage WHERE id=?", (call_id,)
    ).fetchone()
    return row["reserved_usd"], row["settled_usd"], row["status"]


# The cap as the owner types it


@pytest.mark.parametrize(
    ("text", "amount"),
    [
        ("15", Decimal(15)),
        ("15.5", Decimal("15.5")),
        ("15.00", Decimal("15.00")),
        (" 7 ", Decimal(7)),
    ],
)
def test_a_plain_cap_is_accepted_exactly(text, amount):
    got = ai_ledger.parse_cap(text)
    assert got == amount and str(got) == str(amount)


@pytest.mark.parametrize(
    "text", ["", "0", "0.00", "-1", "1e3", "15.001", "NaN", "Infinity", "1,000", "100000", "USD 5"]
)
def test_any_other_cap_is_refused(text):
    with pytest.raises(StoreError):
        ai_ledger.parse_cap(text)


def test_no_call_is_reserved_before_the_owner_sets_a_cap(db):
    with pytest.raises(Refused, match="no monthly cap"):
        ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 0


# Reserve and settle, with exact amounts


def test_reserve_then_settle_records_exact_decimal_amounts(db):
    ai_ledger.set_cap(db, Decimal("1.00"), NOW)
    first = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    assert ai_ledger.totals(db, "2026-11") == ai_ledger.Month(
        "2026-11", Decimal(0), Decimal("0.3585"), 1, 0
    )
    ai_ledger.settle(db, first, Decimal("0.000123456789"), "ok", NOW)
    assert _row(db, first) == ("0.3585", "0.000123456789", "settled")
    second = ai_ledger.reserve(
        db, "digest", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED, owner="Mara L"
    )
    ai_ledger.settle(db, second, Decimal("0.1"), "ok", NOW)
    month = ai_ledger.totals(db, "2026-11")
    assert month.spent == Decimal("0.100123456789") and month.held == 0
    assert month.total == Decimal("0.100123456789")


def test_a_call_that_would_pass_the_cap_is_refused_and_holds_nothing(db):
    ai_ledger.set_cap(db, Decimal("0.70"), NOW)
    ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)  # 0.3585 held
    with pytest.raises(Refused, match="would pass the monthly cap of USD 0.70"):
        ai_ledger.reserve(
            db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED
        )  # 0.717 > 0.70
    assert ai_ledger.totals(db, "2026-11").open_calls == 1


def test_a_call_that_meets_the_cap_exactly_is_made(db):
    ai_ledger.set_cap(db, Decimal("0.72"), NOW)
    ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.36"), NOW, ruled_cap=RULED)
    ai_ledger.reserve(
        db, "stories", CONFIG, Decimal("0.36"), NOW, ruled_cap=RULED
    )  # 0.72 == cap: fits
    with pytest.raises(Refused):
        ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.000000001"), NOW, ruled_cap=RULED)


def test_a_settled_call_frees_what_it_did_not_spend(db):
    ai_ledger.set_cap(db, Decimal("0.50"), NOW)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.40"), NOW, ruled_cap=RULED)
    ai_ledger.settle(db, call, Decimal("0.05"), "ok", NOW)
    ai_ledger.reserve(
        db, "stories", CONFIG, Decimal("0.40"), NOW, ruled_cap=RULED
    )  # 0.05 + 0.40 <= 0.50
    with pytest.raises(Refused):
        ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.06"), NOW, ruled_cap=RULED)


# A cost that cannot be established


def test_an_unknown_cost_counts_its_full_reservation_and_switches_the_pass_off(db):
    ai_ledger.set_cap(db, Decimal(15), NOW)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    ai_ledger.settle(db, call, None, "sent_unknown: OverallTimeout", NOW)
    assert _row(db, call) == ("0.3585", None, "unknown")
    month = ai_ledger.totals(db, "2026-11")
    assert (month.spent, month.held, month.unknown_calls) == (Decimal("0.3585"), 0, 1)
    off = ai_ledger.switched_off(db)
    assert (
        off is not None and off[0] == "the cost of a call made at 2026-11-24 12:00 UTC is not known"
    )
    with pytest.raises(Refused, match="switched off"):
        ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    assert ai_ledger.clear(db) is True
    assert ai_ledger.clear(db) is False
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.3585")  # still counted after clear
    ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)


def test_a_cost_above_its_reservation_is_recorded_in_full_and_switches_the_pass_off(db):
    ai_ledger.set_cap(db, Decimal(15), NOW)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.10"), NOW, ruled_cap=RULED)
    ai_ledger.settle(db, call, Decimal("0.25"), "ok", NOW)
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.25")
    off = ai_ledger.switched_off(db)
    assert off is not None and "cost more than it held" in off[0]


# A crash between reserve and settle


def test_a_reservation_left_open_stays_counted_and_after_an_hour_is_an_unknown_cost(db):
    ai_ledger.set_cap(db, Decimal(15), NOW)
    call = ai_ledger.reserve(
        db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED
    )  # then the process dies
    assert ai_ledger.expire(db, NOW + timedelta(minutes=59)) == 0
    assert ai_ledger.totals(db, "2026-11").held == Decimal("0.3585")
    assert ai_ledger.expire(db, NOW + timedelta(minutes=61)) == 1
    assert _row(db, call)[2] == "unknown"
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.3585")
    off = ai_ledger.switched_off(db)
    assert off is not None and off[0] == "a call reserved at 2026-11-24 12:00 UTC was never settled"
    ai_ledger.settle(db, call, Decimal("0.001"), "ok", NOW + timedelta(hours=2))  # arrives late
    assert _row(db, call) == ("0.3585", None, "unknown")  # it keeps its full amount


def test_a_stale_reservation_is_expired_by_the_next_reserve(db):
    ai_ledger.set_cap(db, Decimal(15), NOW)
    ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    with pytest.raises(Refused, match="switched off"):
        ai_ledger.reserve(
            db, "stories", CONFIG, Decimal("0.3585"), NOW + timedelta(hours=2), ruled_cap=RULED
        )


# Months are UTC months; a call counts in the month it was reserved in


def test_the_month_turns_at_midnight_utc_and_a_late_settlement_stays_in_its_month(db):
    ai_ledger.set_cap(db, Decimal("0.40"), NOW)
    last = datetime(2026, 11, 30, 23, 59, 30, tzinfo=UTC)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.36"), last, ruled_cap=RULED)
    first = datetime(2026, 12, 1, 0, 0, 10, tzinfo=UTC)
    ai_ledger.settle(db, call, Decimal("0.30"), "ok", first)
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.30")
    assert ai_ledger.totals(db, "2026-12").total == 0
    ai_ledger.reserve(
        db, "stories", CONFIG, Decimal("0.36"), first, ruled_cap=RULED
    )  # December has its own cap
    berlin = datetime(2026, 12, 1, 0, 30, tzinfo=UTC).astimezone()  # any zone: the UTC month
    assert ai_ledger.month_of(berlin) == "2026-12"


# Property: spend never passes the cap


AMOUNTS = st.decimals(min_value=Decimal("0.0001"), max_value=Decimal("0.5"), places=4)
STEP = st.tuples(
    st.sampled_from(["reserve", "settle", "unknown", "crash", "clear", "tick"]),
    AMOUNTS,
    st.integers(min_value=0, max_value=40),  # minutes the clock moves on
    st.integers(min_value=0, max_value=9),  # which open call a settle picks
    st.integers(min_value=0, max_value=100),  # the actual cost, in per cent of the hold
)


def _check(db: sqlite3.Connection, cap: Decimal, months: set[str]) -> None:
    for month in months:
        assert ai_ledger.totals(db, month).total <= cap


@settings(
    max_examples=60, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture]
)
@given(
    steps=st.lists(STEP, max_size=40),
    cap=st.decimals(min_value=Decimal("0.5"), max_value=Decimal(3), places=2),
)
def test_spend_never_passes_the_cap_over_any_sequence_of_calls(tmp_path_factory, steps, cap):
    db = open_db(tmp_path_factory.mktemp("ledger"))
    try:
        ai_ledger.set_cap(db, cap, NOW)
        now = datetime(2026, 11, 30, 22, 0, tzinfo=UTC)  # the steps cross the month end
        open_calls: list[tuple[int, Decimal]] = []
        months: set[str] = set()
        for action, amount, minutes, pick, share in steps:
            now += timedelta(minutes=minutes)
            months.add(ai_ledger.month_of(now))
            if action == "reserve":
                try:
                    open_calls.append(
                        (
                            ai_ledger.reserve(db, "stories", CONFIG, amount, now, ruled_cap=RULED),
                            amount,
                        )
                    )
                except Refused:
                    pass
            elif action in ("settle", "unknown") and open_calls:
                call, held = open_calls.pop(pick % len(open_calls))
                actual = None if action == "unknown" else held * share / 100
                ai_ledger.settle(db, call, actual, "ok", now)
            elif action == "crash" and open_calls:
                open_calls.pop(pick % len(open_calls))  # never settled: the process died
            elif action == "clear":
                ai_ledger.clear(db)
            else:
                ai_ledger.expire(db, now)
            _check(db, cap, months)
    finally:
        db.close()


# Two processes reserving at once


def _reserve_many(root: str, count: int, barrier: Any, out: Any) -> None:
    db = open_db(Path(root))
    barrier.wait(timeout=30)
    made = 0
    for _ in range(count):
        try:
            ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
            made += 1
        except Refused:
            pass
    db.close()
    out.put(made)


def test_two_processes_reserving_at_once_never_pass_the_cap_together(tmp_path):
    db = open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal("3.00"), NOW)  # room for 8 holds of 0.3585 (2.868)
    db.close()
    barrier, out = mp.Barrier(2), mp.Queue()
    procs = [
        mp.Process(target=_reserve_many, args=(str(tmp_path), 10, barrier, out)) for _ in range(2)
    ]
    for proc in procs:
        proc.start()
    made = [out.get(timeout=60) for _ in procs]
    for proc in procs:
        proc.join(30)
    assert sum(made) == 8
    db = open_db(tmp_path)
    assert ai_ledger.totals(db, "2026-11").held == Decimal("2.8680")
    db.close()


def test_two_threads_with_their_own_connections_never_pass_the_cap_together(tmp_path):
    db = open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal("1.00"), NOW)
    db.close()
    made: list[int] = []

    def work() -> None:
        own = open_db(tmp_path)
        for _ in range(5):
            try:
                call = ai_ledger.reserve(
                    own, "stories", CONFIG, Decimal("0.30"), NOW, ruled_cap=RULED
                )
                ai_ledger.settle(own, call, Decimal("0.25"), "ok", NOW)
                made.append(call)
            except Refused:
                pass
        own.close()

    workers = [threading.Thread(target=work) for _ in range(3)]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join()
    db = open_db(tmp_path)
    total = ai_ledger.totals(db, "2026-11").total
    db.close()
    assert total <= Decimal("1.00") and len(made) == 3  # 0.25 * 3 + a 0.30 hold would pass 1.00


# Third review, finding 12: reserve's expiry of a stale hold is committed even when it refuses


def test_the_expiry_a_refused_reserve_makes_is_kept_in_the_store(tmp_path):
    db = open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    later = NOW + timedelta(hours=2)
    with pytest.raises(Refused, match="switched off"):
        ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), later, ruled_cap=RULED)
    db.close()
    reopened = open_db(tmp_path)  # what another connection reads: the stored state
    assert _row(reopened, call) == ("0.3585", None, "unknown")
    off = ai_ledger.switched_off(reopened)
    assert off is not None and off[0] == "a call reserved at 2026-11-24 12:00 UTC was never settled"
    assert reopened.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 1
    reopened.close()


# Third review, finding 18: any amount the ledger can hold is shown without raising


@pytest.mark.parametrize(
    ("amount", "up", "shown"),
    [
        (Decimal("6.401"), True, "USD 6.41"),
        (Decimal("6.401"), False, "USD 6.40"),
        (Decimal("0.000123456789"), True, "USD 0.01"),
        (Decimal(0), True, "USD 0.00"),
        (Decimal("999999999999.99"), True, "USD 999999999999.99"),
        (Decimal("999999999999.991"), True, "USD 1000000000000.00"),  # rounded up, never down
        (Decimal(10) ** 27, True, "more than USD 999999999999.99"),
        (Decimal("1E+999999"), False, "more than USD 999999999999.99"),
    ],
)
def test_money_is_shown_to_the_cent_or_as_more_than_the_largest_shown(amount, up, shown):
    from deploy_workflow.signal import ai_view

    assert ai_view.usd(amount, up=up) == shown


def test_an_absurd_reported_cost_leaves_the_owners_settings_readable(db, tmp_path):
    from signal_ai_fakes import environ, write_ruling

    from deploy_workflow.signal import ai_gate, ai_view
    from deploy_workflow.signal.identity import User

    ai_ledger.set_cap(db, Decimal(15), NOW)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
    ai_ledger.settle(db, call, Decimal(10) ** 27, "ok", NOW)  # USD 1e27 reported by a runtime
    write_ruling(tmp_path / "rulings")
    held = ai_gate.status(db, NOW, environ(tmp_path), tmp_path / "rulings")
    spend = ai_view.settings_ai(held, User("Olga", "owner"), NOW)["spend"]
    assert spend["label"] == "more than USD 999999999999.99 of USD 15.00"
    assert spend["position"] == 1.0


# Property: the cap and the day's digest calls hold together, over any sequence


DAY_STEP = st.tuples(
    st.sampled_from(
        ["stories", "digest", "settle", "unknown", "not-sent", "clear", "per-day", "per-name"]
    ),
    st.integers(min_value=0, max_value=240),  # minutes the clock moves on
    st.integers(min_value=0, max_value=9),  # which open call a settle picks; a limit; a name
)
NAMES = ("Mara L", "Ines K")


@dataclass
class _Days:
    """What the test itself counts, independently of the ledger: per UTC day, the digest calls
    reserved that were not settled as not sent, service-wide and per name; and the open calls."""

    held: list[tuple[int, str, str | None]] = field(default_factory=list)  # (id, day, name)
    paid: dict[tuple[str, str | None], int] = field(default_factory=dict)  # (day, name|None)

    def count(self, day: str, name: str | None) -> int:
        return self.paid.get((day, name), 0)

    def add(self, day: str, name: str, step: int = 1) -> None:
        for key in ((day, None), (day, name)):
            self.paid[key] = self.paid.get(key, 0) + step


def _step(db: sqlite3.Connection, action: str, pick: int, now: datetime, seen: _Days) -> None:
    """One step; a digest call is made only while the day, and the name, have made fewer than
    their limits (calls settled as not sent count toward neither)."""
    day = f"{now:%Y-%m-%d}"
    if action in ("stories", "digest"):
        name = NAMES[pick % 2] if action == "digest" else None
        limits = (ai_ledger.digests_per_day(db), ai_ledger.digests_per_name(db))
        try:
            call = ai_ledger.reserve(
                db, action, CONFIG, Decimal("0.3585"), now, ruled_cap=RULED, owner=name
            )
        except Refused:
            return
        if name is not None:
            assert seen.count(day, None) < limits[0] and seen.count(day, name) < limits[1]
            seen.add(day, name)
        seen.held.append((call, day, name))
    elif action in ("settle", "unknown", "not-sent") and seen.held:
        call, made_on, name = seen.held.pop(pick % len(seen.held))
        if action == "not-sent":
            still_open = _row(db, call)[2] == "open"  # not yet taken as unknown (stale)
            ai_ledger.settle(db, call, Decimal(0), "not_sent: KeyMissing", now)
            if name is not None and still_open:  # a call not sent no longer counts
                seen.add(made_on, name, -1)
            return
        ai_ledger.settle(db, call, None if action == "unknown" else Decimal("0.01"), "ok", now)
    elif action == "clear":
        ai_ledger.clear(db)
    elif action == "per-day":
        ai_ledger.set_digests_per_day(db, pick, now)
    elif action == "per-name":
        ai_ledger.set_digests_per_name(db, pick % 4, now)


@settings(
    max_examples=60, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture]
)
@given(steps=st.lists(DAY_STEP, max_size=50), cap=st.decimals(min_value=1, max_value=4, places=2))
def test_no_day_has_more_digest_calls_than_its_limit_and_no_month_passes_its_cap(
    tmp_path_factory, steps, cap
):
    db = open_db(tmp_path_factory.mktemp("days"))
    try:
        ai_ledger.set_cap(db, cap, NOW)
        now = datetime(2026, 11, 30, 20, 0, tzinfo=UTC)  # the steps cross a day and a month
        seen = _Days()
        for action, minutes, pick in steps:
            now += timedelta(minutes=minutes)
            _step(db, action, pick, now, seen)
            assert ai_ledger.totals(db, ai_ledger.month_of(now)).total <= cap
    finally:
        db.close()
