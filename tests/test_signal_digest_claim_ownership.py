"""Two connections interleave digest runs and startup recovery, with synthetic writers."""

import sqlite3
from collections.abc import Callable
from contextlib import closing
from datetime import datetime, timedelta

import pytest
from test_signal_digest import RecordingWriter, at, count, make, source, story

from deploy_workflow.signal import digests, store

DUE = at("2026-11-27 07:00")
RECOVERY = DUE + timedelta(minutes=40)
NEXT_DUE = at("2026-12-04 07:00")


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


def test_scheduled_pass_leaves_a_new_request_pending_during_an_active_claim(tmp_path):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        asked = DUE + timedelta(minutes=1)

        def request_during_write() -> None:
            digests.request_run(other, "Mara L", ident, asked)
            ran = digests.run_due(other, asked, RecordingWriter())
            assert not ran and not ran.waiting and not ran.left_due
            row = other.execute("SELECT claimed_at, run_requested_at FROM digests").fetchone()
            assert tuple(row) == (DUE.isoformat(), asked.isoformat())

        ran = digests.run_due(db, DUE, DelayedWriter(request_during_write))
        assert [(found, run.outcome) for found, run in ran] == [(ident, "written")]
        assert count(db, "digest_runs") == 1
        assert digests.owned(db, "Mara L", ident).requested_at == asked


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
        assert tuple(row) == ("skipped", "the run failed (RuntimeError); see the log")
        digest = digests.owned(db, "Mara L", ident)
        assert (digest.period_from, digest.next_run_at, digest.story_mark) == (DUE, NEXT_DUE, 2)
        assert db.execute("SELECT claimed_at FROM digests").fetchone()[0] is None
