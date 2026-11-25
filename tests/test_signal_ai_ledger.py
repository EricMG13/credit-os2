"""Signal's AI spend ledger (spec 5.10): the cap, reserve then settle, unknown costs, crashes,
two processes and month ends. SYNTHETIC: no model is called; amounts are written by hand in USD.
"""

from __future__ import annotations

import multiprocessing as mp
import sqlite3
import threading
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
    second = ai_ledger.reserve(db, "digest", CONFIG, Decimal("0.3585"), NOW, ruled_cap=RULED)
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
