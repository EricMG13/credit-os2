"""Busy stores around a digest's paid call, with the real ``ai_digest.Writer``, ``ai_call`` and
ledger and a second sqlite connection holding the write lock (busy timeout shortened). The only
double is the model (``FakeModel``, SYNTHETIC: no paid call is made); each test counts its provider
calls, the paid attempts for the period. Expected values are written by hand from the calendar."""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from collections.abc import Iterator
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

import pytest
from signal_ai_fakes import FakeModel, guard, ok, setup
from test_signal_digest import NOW, at, make, source, story

from deploy_workflow.signal import ai_call, ai_digest, ai_ledger, ai_run, digests, store

DUE = at("2026-11-27 07:00")
REPLY = json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["1"]}]})


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = store.open_db(tmp_path)
    store.add_user(database, "Mara L", "writer")
    database.execute("PRAGMA busy_timeout=400")
    yield database
    database.close()


@pytest.fixture
def other(tmp_path: Path, db: sqlite3.Connection) -> Iterator[sqlite3.Connection]:
    """A second connection to the same store, to hold the write lock."""
    path = tmp_path / "signal" / "signal.db"
    conn = sqlite3.connect(path, isolation_level=None, timeout=0.1, check_same_thread=False)
    yield conn
    if conn.in_transaction:
        conn.execute("ROLLBACK")
    conn.close()


def _ready(db: sqlite3.Connection) -> int:
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ai_ledger.set_cap(db, Decimal(15), NOW)
    return make(db)


def _row(db: sqlite3.Connection, ident: int) -> tuple[object, ...]:
    return tuple(
        db.execute(
            "SELECT next_run_at, run_requested_at, claimed_by, claimed_at FROM digests WHERE id=?",
            (ident,),
        ).fetchone()
    )


class LockedAfterDraft(ai_digest.Writer):
    """The real writer; once its call is paid and settled, another process takes the write lock and
    lets it go 0.6 s later: the 0.4 s busy timeout of the store write fails, the release's does
    not."""

    lock: sqlite3.Connection

    def draft(self, scope: digests.Scope) -> object:
        result = super().draft(scope)
        self.lock.execute("BEGIN IMMEDIATE")
        threading.Timer(0.6, lambda: self.lock.execute("ROLLBACK")).start()
        return result


class LockedBeforeCall(ai_digest.Writer):
    """The real writer; another process holds the write lock when the call is about to reserve, and
    lets it go 0.6 s later: the reservation's 0.4 s busy timeout fails, the claim release's does
    not."""

    lock: sqlite3.Connection

    def draft(self, scope: digests.Scope) -> object:
        self.lock.execute("BEGIN IMMEDIATE")
        threading.Timer(0.6, lambda: self.lock.execute("ROLLBACK")).start()
        return super().draft(scope)


def test_r1_a_busy_store_after_a_paid_draft_does_not_pay_again(tmp_path, db, other):
    ident = _ready(db)
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    writer = LockedAfterDraft(db, model, guard(tmp_path, DUE), DUE)
    writer.lock = other
    ran = digests.run_due(db, DUE, writer)
    time.sleep(0.7)  # the other process has let go
    assert _row(db, ident)[0] in ("2026-11-27T07:00:00+00:00", "2026-12-04T07:00:00+00:00")
    model.replies.append(ok(REPLY, "0.006"))
    for minutes in (1, 2, 3):
        fresh = ai_digest.Writer(db, model, guard(tmp_path, DUE), DUE)
        digests.run_due(db, DUE + timedelta(minutes=minutes), fresh)
    assert len(model.requests) == 1  # one paid attempt for the period, whatever the ticks
    assert list(ran) == [] and ran.left_due == [] and ran.held == [ident]
    assert _row(db, ident)[0] == "2026-12-04T07:00:00+00:00"


def test_r2_a_busy_reservation_releases_the_claim_and_is_left_due(tmp_path, db, other):
    ident = _ready(db)
    before = _row(db, ident)
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    writer = LockedBeforeCall(db, model, guard(tmp_path, DUE), DUE)
    writer.lock = other
    ran = digests.run_due(db, DUE, writer)
    assert len(model.requests) == 0  # nothing reserved, nothing sent, nothing paid
    assert list(ran) == [] and ran.left_due == [ident] and ran.held == []
    assert _row(db, ident) == before
    time.sleep(0.3)  # the other process has let go
    again = ai_digest.Writer(db, model, guard(tmp_path, DUE), DUE)
    second = digests.run_due(db, DUE + timedelta(minutes=1), again)
    assert [(one, run.outcome) for one, run in second] == [(ident, "written")]
    assert len(model.requests) == 1


def test_r2_a_manual_request_survives_a_busy_reservation(tmp_path, db, other):
    ident = _ready(db)
    digests.request_run(db, "Mara L", ident, NOW)
    before = _row(db, ident)
    assert before[1] == "2026-11-24T12:00:00+00:00"
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    writer = LockedBeforeCall(db, model, guard(tmp_path, NOW + timedelta(minutes=5)), NOW)
    writer.lock = other
    ran = digests.run_due(db, NOW + timedelta(minutes=5), writer)
    assert ran.left_due == [ident] and len(model.requests) == 0
    assert _row(db, ident) == before


def test_the_loop_says_a_digest_was_left_due(tmp_path, db, other, monkeypatch):
    _ready(db)
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    monkeypatch.setattr(ai_run.ai_digest, "Writer", LockedBeforeCall)
    monkeypatch.setattr(LockedBeforeCall, "lock", other, raising=False)
    with pytest.raises(ai_run.DigestsLeftDue, match="^1 digests were left due for the next tick$"):
        ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))
    assert len(model.requests) == 0


def test_the_loop_says_a_digest_is_held(tmp_path, db, other, monkeypatch):
    _ready(db)
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    monkeypatch.setattr(ai_run.ai_digest, "Writer", LockedAfterDraft)
    monkeypatch.setattr(LockedAfterDraft, "lock", other, raising=False)
    with pytest.raises(ai_run.DigestsLeftDue, match="^1 digests hold their claim"):
        ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))
    time.sleep(0.7)
    assert len(model.requests) == 1


def test_call_raises_a_distinct_error_when_the_reservation_is_busy(tmp_path, db, other):
    _ready(db)
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    other.execute("BEGIN IMMEDIATE")
    prompt = ai_call.Prompt("system", "user", 1000)
    with pytest.raises(ai_call.BusyBeforeSend):
        ai_call.call(db, model, guard(tmp_path, DUE), "digest", prompt, owner="Mara L")
    assert len(model.requests) == 0
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 0


class BusyStoreOnce(ai_digest.Writer):
    """The real writer; its first store write meets a busy database, after the paid call settled."""

    failed = False

    def store(self, db, scope, draft, now):  # type: ignore[no-untyped-def]
        if not BusyStoreOnce.failed:
            BusyStoreOnce.failed = True
            error = sqlite3.OperationalError("database is locked")
            error.sqlite_errorcode = sqlite3.SQLITE_BUSY  # type: ignore[attr-defined]
            raise error
        return super().store(db, scope, draft, now)


def _ask(db: sqlite3.Connection, ident: int, when: object) -> str:
    try:
        digests.request_run(db, "Mara L", ident, when)  # type: ignore[arg-type]
    except store.Conflict as refusal:
        return str(refusal)
    return "accepted"


def test_f1_a_held_claim_blocks_run_now_past_the_call_bound_until_the_next_slot(tmp_path, db):
    BusyStoreOnce.failed = False
    ident = _ready(db)
    model = FakeModel(replies=[ok(REPLY, "0.006"), ok(REPLY, "0.006")])
    digests.run_due(db, DUE, BusyStoreOnce(db, model, guard(tmp_path, DUE), DUE))
    later = DUE + ai_ledger.CALL_BOUND + timedelta(minutes=1)
    assert (
        _ask(db, ident, later) == "This digest ran at 07:32 UTC. It can run again from 08:02 UTC."
    )
    refusal = _ask(db, ident, later + timedelta(minutes=31))
    assert refusal.startswith("The last run of this digest wrote no issue, so it runs again at")
    tick = later + timedelta(minutes=1)
    digests.run_due(db, tick, ai_digest.Writer(db, model, guard(tmp_path, tick), tick))
    assert len(model.requests) == 1  # one paid attempt for the period
    reason = db.execute("SELECT reason FROM digest_runs").fetchone()[0]
    assert "service stopped" not in reason and reason.startswith("no issue was written: ")


def test_f1_a_held_paid_failure_blocks_run_now_past_the_call_bound(tmp_path, db, monkeypatch):
    ident = _ready(db)
    model = FakeModel(replies=[ok("not json", "0.006"), ok(REPLY, "0.006")])
    real = digests._close
    busy_once = [True]

    def close(*args):  # type: ignore[no-untyped-def]
        if busy_once:
            busy_once.pop()
            error = sqlite3.OperationalError("database is locked")
            error.sqlite_errorcode = sqlite3.SQLITE_BUSY  # type: ignore[attr-defined]
            raise error
        real(*args)

    monkeypatch.setattr(digests, "_close", close)
    ran = digests.run_due(db, DUE, ai_digest.Writer(db, model, guard(tmp_path, DUE), DUE))
    assert ran.held == [ident]
    later = DUE + ai_ledger.CALL_BOUND + timedelta(minutes=1)
    assert (
        _ask(db, ident, later) == "This digest ran at 07:32 UTC. It can run again from 08:02 UTC."
    )
    assert _ask(db, ident, later + timedelta(minutes=31)).startswith(
        "The last run of this digest wrote no issue, so it runs again at"
    )
    tick = later + timedelta(minutes=1)
    digests.run_due(db, tick, ai_digest.Writer(db, model, guard(tmp_path, tick), tick))
    assert len(model.requests) == 1


def test_f2_a_busy_reservation_is_still_a_sqlite_busy_error_for_other_callers(tmp_path, db, other):
    _ready(db)
    other.execute("BEGIN IMMEDIATE")
    prompt = ai_call.Prompt("system", "user", 1000)
    model = FakeModel(replies=[ok(REPLY, "0.006")])
    with pytest.raises(sqlite3.OperationalError) as caught:
        ai_call.call(db, model, guard(tmp_path, DUE), "stories", prompt)
    assert isinstance(caught.value, ai_call.BusyBeforeSend)
    assert ai_ledger.is_busy(caught.value)
