"""Two connections interleave digest runs and recovery, with synthetic writers."""

import sqlite3
from collections.abc import Callable
from contextlib import closing
from dataclasses import replace
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from signal_ai_fakes import CONFIG, LUNA_HOLD, FakeModel, off_setup, ok, setup
from test_signal_digest import RecordingWriter, at, count, make, source, story

from deploy_workflow.signal import ai_digest, ai_ledger, ai_run, digests, store

DUE = at("2026-11-27 07:00")
RECOVERY = DUE + timedelta(minutes=40)
NEXT_DUE = at("2026-12-04 07:00")
REPLY = '{"points":[{"lead":"Plants","body":"A plant closed.","stories":["1"]}]}'
MANUAL = DUE - timedelta(minutes=30)
TICK = DUE + timedelta(minutes=2)


class DelayedWriter(RecordingWriter):
    def __init__(self, during: Callable[[], None], outcome: str = "written") -> None:
        super().__init__()
        self.during = during
        self.outcome = outcome

    def clock(self) -> datetime:
        return DUE

    def draft(self, scope: digests.Scope) -> object:
        self.during()
        if self.outcome == "invalid":
            raise digests.WriterFailed("stub rejected result")
        if self.outcome == "retry":
            raise digests.WriterFailed("stub call was not sent", again=True, fault=True)
        if self.outcome == "error":
            raise RuntimeError("stub drafting error")
        if self.outcome == "database-error":
            raise sqlite3.OperationalError("stub lasting database error")
        return super().draft(scope)


def _ready(db: sqlite3.Connection) -> int:
    story(db, source(db), "Plant closure", at("2026-11-26 09:00"))
    return make(db)


def _interrupted(db: sqlite3.Connection) -> None:
    assert digests.recover_claims(db, RECOVERY - timedelta(minutes=30), RECOVERY) == 1


def _claim(db: sqlite3.Connection, ident: int, due: datetime) -> None:
    with store._write_transaction(db):
        successor = RecordingWriter()
        successor.clock = lambda: due
        digest = digests.owned(db, "Mara L", ident)
        assert digest.next_run_at == due
        assert isinstance(digests._plan(db, digest, due, "schedule", successor), digests.Scope)


@pytest.mark.parametrize("outcome", ["written", "invalid", "retry", "error", "database-error"])
@pytest.mark.parametrize("successor", [False, True])
def test_late_completion_cannot_change_the_recovered_run(tmp_path, outcome, successor):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        before = digests.owned(db, "Mara L", ident)

        def recover() -> None:
            _interrupted(other)
            if successor:
                _claim(other, ident, NEXT_DUE)

        ran = digests.run_due(db, DUE, DelayedWriter(recover, outcome))
        assert not ran
        assert not ran.waiting and not ran.left_due
        assert count(db, "digest_issues") == 0
        runs = db.execute("SELECT reason FROM digest_runs").fetchall()
        assert [row["reason"] for row in runs] == [digests.INTERRUPTED]
        after = digests.owned(db, "Mara L", ident)
        assert (after.period_from, after.story_mark) == (before.period_from, before.story_mark)
        row = db.execute(
            "SELECT claimed_by, claimed_at FROM digests WHERE id=?", (ident,)
        ).fetchone()
        expected = ("schedule", NEXT_DUE.isoformat()) if successor else (None, None)
        assert tuple(row) == expected
        assert after.next_run_at == (NEXT_DUE + timedelta(days=7) if successor else NEXT_DUE)


def test_manual_request_is_refused_during_an_active_claim(tmp_path):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        asked = DUE + timedelta(minutes=1)

        def request_during_write() -> None:
            with pytest.raises(digests.Conflict, match="This digest is being written now"):
                digests.request_run(other, "Mara L", ident, asked)
            ran = digests.run_due(other, asked, RecordingWriter())
            assert not ran and not ran.waiting and not ran.left_due
            row = other.execute("SELECT claimed_at, run_requested_at FROM digests").fetchone()
            assert tuple(row) == (DUE.isoformat(), None)

        ran = digests.run_due(db, DUE, DelayedWriter(request_during_write))
        assert [(found, run.outcome) for found, run in ran] == [(ident, "written")]
        assert count(db, "digest_runs") == 1
        assert digests.owned(db, "Mara L", ident).requested_at is None


def test_failure_before_claiming_leaves_a_successor_claim_intact(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        record_failure = digests._record_failure

        class PlanningFails(RecordingWriter):
            def blocked(self, owner: str) -> None:
                raise RuntimeError("stub planning error")

        def record_after_successor_claim(database, digest_id, now, name, *args):
            _claim(other, ident, DUE)
            record_failure(database, digest_id, now, name, *args)

        monkeypatch.setattr(digests, "_record_failure", record_after_successor_claim)
        assert not digests.run_due(db, DUE, PlanningFails())
        row = db.execute("SELECT claimed_at FROM digests WHERE id=?", (ident,)).fetchone()
        assert row["claimed_at"] == DUE.isoformat()
        assert count(db, "digest_runs") == 0


def test_storage_failure_rolls_back_and_records_the_still_owned_run(tmp_path):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)

        def ingest() -> None:
            story(other, source(other, "Bulletin"), "New forecast", DUE)

        class StorageFails(DelayedWriter):
            def store(self, db, scope, draft, now):
                super().store(db, scope, draft, now)
                raise RuntimeError("stub storage error")

        ran = digests.run_due(db, DUE, StorageFails(ingest))
        assert not ran and not ran.waiting and not ran.left_due
        assert count(db, "digest_issues") == 0
        row = db.execute("SELECT outcome, reason FROM digest_runs").fetchone()
        assert tuple(row) == (
            "skipped",
            f"{digests.NOT_WRITTEN}the run failed (RuntimeError); see the log",
        )
        digest = digests.owned(db, "Mara L", ident)
        assert (digest.period_from, digest.next_run_at, digest.story_mark) == (DUE, NEXT_DUE, 1)
        assert db.execute("SELECT claimed_at FROM digests").fetchone()[0] is None


def test_the_normal_pass_recovers_a_claim_left_young_at_startup(tmp_path):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        _claim(db, ident, DUE)
        started = DUE + timedelta(minutes=1)
        assert ai_run.recover(other, replace(off_setup(tmp_path), clock=lambda: started)) == (0, 0)

        model = FakeModel([ok(REPLY)])
        ai_ledger.set_cap(other, Decimal(15), NEXT_DUE)
        reserve_at = NEXT_DUE - timedelta(minutes=15)
        ai_ledger.reserve(other, "stories", CONFIG, LUNA_HOLD, reserve_at, ruled_cap=Decimal(15))
        ai_ledger.reserve(
            other, "digest", CONFIG, LUNA_HOLD, reserve_at, ruled_cap=Decimal(15), owner="Rita"
        )
        ran = ai_run.digest_pass(other, NEXT_DUE, setup(tmp_path, model, clock=NEXT_DUE))

        assert [(found, run.outcome) for found, run in ran] == [(ident, "written")]
        runs = other.execute("SELECT reason, period_end FROM digest_runs ORDER BY id").fetchall()
        assert [tuple(row) for row in runs] == [
            (
                "no issue was written: the run did not finish before its claim expired",
                DUE.isoformat(),
            ),
            ("written by the AI pass", NEXT_DUE.isoformat()),
        ]
        assert len(model.requests) == 1
        assert ai_ledger.totals(other, "2026-12").held == 2 * LUNA_HOLD


def test_a_busy_issue_write_expires_and_clears_its_queued_request(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        before = digests.owned(db, "Mara L", ident)
        ai_ledger.set_cap(db, Decimal(15), DUE)
        model = FakeModel([ok(REPLY), ok(REPLY)])
        original = ai_digest.Writer.store

        def busy(writer, database, scope, draft, now):
            original(writer, database, scope, draft, now)
            error = sqlite3.OperationalError("database is locked")
            error.sqlite_errorcode = sqlite3.SQLITE_BUSY
            raise error

        with monkeypatch.context() as patched:
            patched.setattr(ai_digest.Writer, "store", busy)
            with pytest.raises(ai_run.DigestsLeftDue):
                ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))
        assert count(db, "digest_issues") == 0
        waiting = DUE + timedelta(minutes=1)
        with pytest.raises(digests.Conflict, match="This digest is being written now"):
            digests.request_run(other, "Mara L", ident, waiting)
        # Recovery must clear a request queued by an earlier version.
        other.execute(
            "UPDATE digests SET run_requested_at=? WHERE id=?", (waiting.isoformat(), ident)
        )
        other.commit()

        boundary = DUE + ai_ledger.CALL_BOUND
        assert not ai_run.digest_pass(other, boundary, setup(tmp_path, model, clock=boundary))
        assert digests.owned(other, "Mara L", ident).requested_at == waiting
        assert count(db, "digest_runs") == 0

        assert not ai_run.digest_pass(other, RECOVERY, setup(tmp_path, model, clock=RECOVERY))
        recovered = digests.owned(other, "Mara L", ident)
        assert (recovered.period_from, recovered.story_mark) == (
            before.period_from,
            before.story_mark,
        )
        assert recovered.requested_at is None and recovered.next_run_at == NEXT_DUE
        receipt = db.execute("SELECT outcome, reason, period_end FROM digest_runs").fetchone()
        assert tuple(receipt) == (
            "skipped",
            "no issue was written: the run did not finish before its claim expired",
            DUE.isoformat(),
        )
        assert db.execute("SELECT claimed_at FROM digests").fetchone()[0] is None
        assert len(model.requests) == 1
        assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.004")

        after_cooldown = RECOVERY + timedelta(minutes=31)
        with pytest.raises(store.Conflict, match="runs again at its next scheduled time"):
            digests.request_run(other, "Mara L", ident, after_cooldown)
        assert not ai_run.digest_pass(
            other, after_cooldown, setup(tmp_path, model, clock=after_cooldown)
        )
        assert count(db, "digest_runs") == 1
        assert len(model.requests) == 1


def test_the_recurring_pass_waits_for_an_unsettled_digest_reservation(tmp_path):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        ai_ledger.set_cap(db, Decimal(15), MANUAL)
        digests.request_run(db, "Mara L", ident, MANUAL)

        def crashes(request):
            raise KeyboardInterrupt

        original = FakeModel(answer=crashes)
        with pytest.raises(KeyboardInterrupt):
            ai_run.digest_pass(db, MANUAL, setup(tmp_path, original, clock=MANUAL))
        young = MANUAL + timedelta(minutes=1)
        assert ai_run.recover(other, replace(off_setup(tmp_path), clock=lambda: young)) == (0, 0)

        contender = FakeModel([ok(REPLY)])
        assert not ai_run.digest_pass(other, TICK, setup(tmp_path, contender, clock=TICK))
        assert not contender.requests
        assert ai_ledger.totals(other, "2026-11").held == LUNA_HOLD
        assert count(other, "digest_runs") == 0

        expired = MANUAL + ai_ledger.STALE_AFTER + timedelta(seconds=1)
        settings = setup(tmp_path, contender, clock=expired)
        ai_run.digest_pass(other, expired, settings)
        assert ai_ledger.switched_off(other) is not None
        assert ai_ledger.totals(other, "2026-11").spent == LUNA_HOLD
        ai_run.digest_pass(other, expired, settings)
        assert db.execute("SELECT claimed_at FROM digests").fetchone()[0] is None
        assert not contender.requests


def test_an_expired_claim_does_not_discard_a_live_reservations_result(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        ai_ledger.set_cap(db, Decimal(15), MANUAL)
        digests.request_run(db, "Mara L", ident, MANUAL)
        clock = MANUAL
        reserved = MANUAL + timedelta(minutes=2)
        draft = ai_digest.Writer.draft

        def starts_later(writer, scope):
            nonlocal clock
            clock = reserved
            return draft(writer, scope)

        monkeypatch.setattr(ai_digest.Writer, "draft", starts_later)
        contender = FakeModel([ok(REPLY)])
        observed = []

        def intervenes(request):
            observed.append(ai_run.recover(other, replace(off_setup(tmp_path), clock=lambda: TICK)))
            observed.append(ai_run.digest_pass(other, TICK, setup(tmp_path, contender, clock=TICK)))
            return ok(REPLY)

        original = FakeModel(answer=intervenes)
        ran = ai_run.digest_pass(db, MANUAL, setup(tmp_path, original, clock=lambda: clock))
        assert observed == [(0, 0), []]
        assert not contender.requests
        assert [(found, run.outcome) for found, run in ran] == [(ident, "written")]
        assert ai_ledger.totals(other, "2026-11").spent == Decimal("0.004")
