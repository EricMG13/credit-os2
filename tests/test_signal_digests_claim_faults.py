"""Digest runs and their claims under faults: a busy write after the claim leaves the digest due
only when no call was paid (a call not sent), and holds the claim after a paid call (C5-F1, C5-R1,
C5-R2), "Run once now" asked while a claim is live is refused (C5-F3), and a failed run never moves
the story mark past what its scope read (C5-F16). A real store; the writer is a test double for the
model call only. Expected values are written by hand from the calendar."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from test_signal_digest import NOW, RecordingWriter, at, count, make, source, story

from deploy_workflow.signal import digests, store
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.store import Conflict, Missing

DUE = at("2026-11-27 07:00")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = store.open_db(tmp_path)
    store.add_user(database, "Mara L", "writer")
    store.add_user(database, "Tobias O", "reader")
    yield database
    database.close()


def _busy() -> sqlite3.OperationalError:
    error = sqlite3.OperationalError("database is locked")
    error.sqlite_errorcode = sqlite3.SQLITE_BUSY  # type: ignore[attr-defined]
    return error


class BusyOnStore(RecordingWriter):
    """The write step of the run hits a busy database; the model call itself was made."""

    def store(self, db: sqlite3.Connection, scope: digests.Scope, draft: object, now: Any) -> int:
        raise _busy()


class FailingDuringCall(RecordingWriter):
    """While the model call is in flight ingest stores a story, then the call raises."""

    def __init__(self, src: int) -> None:
        super().__init__()
        self.src = src

    def draft(self, scope: digests.Scope) -> object:
        self.scopes.append(scope)
        late = Entry("Stored during the call", "https://example.org/late", NOW, "About it")
        store.add_story(self.conn, self.src, late, NOW)
        raise RuntimeError("the call failed")

    conn: sqlite3.Connection


def _row(db: sqlite3.Connection, ident: int) -> sqlite3.Row:
    return db.execute(
        "SELECT next_run_at, run_requested_at, claimed_by, claimed_at, period_from, story_mark"
        " FROM digests WHERE id=?",
        (ident,),
    ).fetchone()


class NotSentBusy(RecordingWriter):
    """The call was not sent (nothing paid): the writer says so as ai_digest.Writer does."""

    def draft(self, scope: digests.Scope) -> object:
        self.scopes.append(scope)
        raise digests.WriterFailed("busy before the call", again=True, fault=True)


def test_a_call_not_sent_leaves_a_scheduled_digest_really_due(db):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)
    before = tuple(_row(db, ident))
    ran = digests.run_due(db, DUE, NotSentBusy())
    assert list(ran) == [] and ran.left_due == [ident] and ran.held == []
    assert tuple(_row(db, ident)) == before
    assert (before[0], before[2], before[3]) == ("2026-11-27T07:00:00+00:00", None, None)
    again = RecordingWriter()
    second = digests.run_due(db, DUE + timedelta(minutes=1), again)
    assert [(one, run.outcome) for one, run in second] == [(ident, "written")]


def test_a_call_not_sent_keeps_a_manual_request(db):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)
    digests.request_run(db, "Mara L", ident, NOW)
    before = tuple(_row(db, ident))
    assert before[1] == "2026-11-24T12:00:00+00:00"
    ran = digests.run_due(db, NOW + timedelta(minutes=5), NotSentBusy())
    assert ran.left_due == [ident]
    assert tuple(_row(db, ident)) == before


def test_c5_r1_a_busy_store_after_a_paid_draft_holds_the_claim_and_never_drafts_again(db):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)
    writer = BusyOnStore()
    ran = digests.run_due(db, DUE, writer)
    assert list(ran) == [] and ran.left_due == [] and ran.held == [ident]
    row = _row(db, ident)
    assert (row["next_run_at"], row["claimed_by"], row["claimed_at"] is not None) == (
        "2026-12-04T07:00:00+00:00",
        "schedule",
        True,
    )
    for minutes in (1, 2, 3):
        digests.run_due(db, DUE + timedelta(minutes=minutes), writer)
    assert len(writer.scopes) == 1  # one paid attempt for the period


def test_c5_r1_a_manual_request_is_not_run_again_after_a_busy_store(db):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)
    digests.request_run(db, "Mara L", ident, NOW)
    writer = BusyOnStore()
    ran = digests.run_due(db, NOW + timedelta(minutes=5), writer)
    assert ran.left_due == [] and ran.held == [ident]
    digests.run_due(db, NOW + timedelta(minutes=6), writer)
    assert len(writer.scopes) == 1 and _row(db, ident)["run_requested_at"] is None


def test_c5_a_digest_edited_during_an_unsent_call_is_not_listed_as_left_due(db):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)

    class Edited(NotSentBusy):
        def draft(self, scope: digests.Scope) -> object:
            db.execute("UPDATE digests SET name='Renamed' WHERE id=?", (ident,))
            db.commit()
            return super().draft(scope)

    ran = digests.run_due(db, DUE, Edited())
    assert list(ran) == [] and ran.left_due == [] and ran.held == []
    assert _row(db, ident)["claimed_at"] is None


def test_a_request_while_a_claim_is_live_is_refused_and_no_second_run_follows(db):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)
    refusals: list[str] = []

    class AsksMidCall(RecordingWriter):
        def clock(self) -> Any:
            return DUE

        def draft(self, scope: digests.Scope) -> object:
            try:
                digests.request_run(db, "Mara L", ident, DUE + timedelta(minutes=1))
            except Conflict as refusal:
                refusals.append(str(refusal))
            return super().draft(scope)

    ran = digests.run_due(db, DUE, AsksMidCall())
    assert [run.outcome for _, run in ran] == ["written"]
    assert len(refusals) == 1
    assert _row(db, ident)["run_requested_at"] is None
    later = digests.run_due(db, DUE + timedelta(minutes=2), RecordingWriter())
    assert list(later) == [] and count(db, "digest_runs") == 1


def test_a_request_with_no_live_claim_is_stored_as_before(db):
    ident = make(db)
    digests.request_run(db, "Mara L", ident, NOW)
    assert _row(db, ident)["run_requested_at"] == "2026-11-24T12:00:00+00:00"


def test_a_failed_run_moves_the_mark_no_further_than_its_scope_read(db):
    wire = source(db)
    first = story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)
    writer = FailingDuringCall(wire)
    writer.conn = db
    ran = digests.run_due(db, DUE, writer)
    assert list(ran) == [] and ran.left_due == []
    late = db.execute("SELECT id FROM stories WHERE title='Stored during the call'").fetchone()
    assert (first, late["id"]) == (1, 2)
    row = _row(db, ident)
    assert row["story_mark"] == 1
    assert (row["claimed_at"], row["next_run_at"]) == (None, "2026-12-04T07:00:00+00:00")
    assert db.execute("SELECT outcome, reason FROM digest_runs").fetchone()[1] == (
        "the run failed (RuntimeError); see the log"
    )


def test_a_run_that_failed_before_its_scope_was_built_leaves_the_mark_where_it_was(db, monkeypatch):
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    ident = make(db)

    def fail(*args: object) -> Any:
        raise RuntimeError("no scope")

    monkeypatch.setattr(digests, "_plan", fail)
    digests.run_due(db, DUE, RecordingWriter())
    assert _row(db, ident)["story_mark"] == 0


# The adversary's round: faults anywhere after the claim, a stale claim, a paid failure, a claim
# that is no longer this run's


class BusyInDraft(RecordingWriter):
    """The busy fault comes from inside the model call (the ledger's reservation or settling)."""

    def draft(self, scope: digests.Scope) -> object:
        raise _busy()


def _ready(db: sqlite3.Connection) -> int:
    wire = source(db)
    story(db, wire, "Plant closure", at("2026-11-26 09:00"))
    return make(db)


def test_m1_a_busy_fault_inside_the_model_call_does_not_say_the_digest_is_due(db):
    ident = _ready(db)
    ran = digests.run_due(db, DUE, BusyInDraft())
    assert list(ran) == [] and ran.left_due == []
    assert _row(db, ident)["claimed_at"] is not None  # kept for the start-up recovery


def test_m1_a_busy_release_does_not_say_the_digest_is_due(db, monkeypatch):
    ident = _ready(db)

    def busy_release(*args: object) -> Any:
        raise _busy()

    monkeypatch.setattr(digests, "_due_again", busy_release)

    class NotSent(RecordingWriter):
        def draft(self, scope: digests.Scope) -> object:
            raise digests.WriterFailed("not sent", again=True, fault=True)

    ran = digests.run_due(db, DUE, NotSent())
    assert ran.left_due == [] and ran.held == [ident]
    assert _row(db, ident)["claimed_at"] is not None


def test_m2_a_claim_older_than_a_call_can_last_is_a_run_that_wrote_no_issue(db):
    """It is recorded as a paid attempt, so a request waits for the next slot (one paid attempt per
    period) rather than being let through to pay twice."""
    ident = _ready(db)
    db.execute(
        "UPDATE digests SET claimed_by='schedule', claimed_at='2026-11-27T07:00:00+00:00',"
        " next_run_at='2026-12-04T07:00:00+00:00' WHERE id=?",
        (ident,),
    )
    db.commit()
    with pytest.raises(Conflict):  # live: its call may be in flight
        digests.request_run(db, "Mara L", ident, DUE + timedelta(seconds=30))
    with pytest.raises(Conflict, match="ran at 09:00 UTC"):  # recorded when first met
        digests.request_run(db, "Mara L", ident, DUE + timedelta(hours=2))
    with pytest.raises(Conflict, match="wrote no issue, so it runs again at"):
        digests.request_run(db, "Mara L", ident, DUE + timedelta(hours=3))
    assert _row(db, ident)["claimed_at"] is None and _row(db, ident)["run_requested_at"] is None


def test_m4_a_busy_record_of_a_paid_failure_does_not_pay_again(db, monkeypatch):
    ident = _ready(db)
    calls: list[int] = []

    class PaidFail(RecordingWriter):
        def clock(self) -> Any:
            return DUE

        def draft(self, scope: digests.Scope) -> object:
            calls.append(1)
            raise digests.WriterFailed("the result failed its check")

    real = digests._close
    busy_once = [True]

    def close(*args: Any) -> None:
        if busy_once:
            busy_once.pop()
            raise _busy()
        real(*args)

    monkeypatch.setattr(digests, "_close", close)
    ran = digests.run_due(db, DUE, PaidFail())
    assert ran.left_due == []
    digests.run_due(db, DUE + timedelta(minutes=1), PaidFail())
    with pytest.raises(Conflict):
        digests.request_run(db, "Mara L", ident, DUE + timedelta(minutes=2))
    assert len(calls) == 1
    assert _row(db, ident)["next_run_at"] == "2026-12-04T07:00:00+00:00"


def test_l2_a_release_leaves_a_claim_that_is_no_longer_this_runs(db):
    ident = _ready(db)

    class Taken(BusyOnStore):
        def draft(self, scope: digests.Scope) -> object:
            db.execute(
                "UPDATE digests SET claimed_at='2026-11-27T07:05:00+00:00' WHERE id=?", (ident,)
            )
            db.commit()
            return super().draft(scope)

    ran = digests.run_due(db, DUE, Taken())
    assert ran.left_due == []
    row = _row(db, ident)
    assert (row["claimed_at"], row["next_run_at"]) == (
        "2026-11-27T07:05:00+00:00",
        "2026-12-04T07:00:00+00:00",
    )


# C5-S1: a stale claim that cannot be recorded never stops the pass or a request, and "Run once now"
# settles only its own digest's claim

LATE = DUE + timedelta(hours=2)  # 09:00: a claim made at 07:00 is older than CALL_BOUND (31 min)
CLAIM = "2026-11-27T07:00:00+00:00"


def _held(db, ident, period_from=None):
    db.execute(
        "UPDATE digests SET claimed_by='schedule', claimed_at=?, next_run_at=? WHERE id=?",
        (CLAIM, "2026-12-04T07:00:00+00:00", ident),
    )
    if period_from is not None:
        db.execute("UPDATE digests SET period_from=? WHERE id=?", (period_from, ident))
    db.commit()


def _claim(db, ident):
    return db.execute("SELECT claimed_at FROM digests WHERE id=?", (ident,)).fetchone()[0]


def _runs(db, ident):
    return [
        tuple(r)
        for r in db.execute(
            "SELECT trigger, ran_at, reason FROM digest_runs WHERE digest_id=?", (ident,)
        )
    ]


def test_busy_settle_holds_that_claim_and_the_pass_goes_on(db, monkeypatch):
    story(db, source(db), "Plant closure", at("2026-11-26 09:00"))
    a, b = make(db), make(db, name="Second brief")
    _held(db, a)
    real = digests._close

    def close(*args: Any) -> None:
        if args[1].digest.id == a:
            raise _busy()
        real(*args)

    monkeypatch.setattr(digests, "_close", close)
    writer = RecordingWriter()
    ran = digests.run_due(db, LATE, writer)
    assert [(i, r.outcome) for i, r in ran] == [(b, "written")]
    assert (ran.held, ran.left_due, ran.waiting) == ([a], [], [])
    assert _claim(db, a) == CLAIM and _runs(db, a) == []
    monkeypatch.setattr(digests, "_close", real)
    again = digests.run_due(db, LATE + timedelta(minutes=1), writer)
    assert (list(again), again.held, again.left_due) == ([], [], [])
    assert _claim(db, a) is None
    assert _runs(db, a) == [("schedule", "2026-11-27T09:01:00+00:00", digests.UNRECORDED)]
    assert len(writer.scopes) == 1


def test_unreadable_stale_row_is_held_every_tick_and_others_run(db):
    story(db, source(db), "Plant closure", at("2026-11-26 09:00"))
    a, b = make(db), make(db, name="Second brief")
    _held(db, a, period_from="not a time")
    writer = RecordingWriter()
    ran = digests.run_due(db, LATE, writer)
    assert [(i, r.outcome) for i, r in ran] == [(b, "written")]
    assert (ran.held, ran.left_due) == ([a], [])
    again = digests.run_due(db, LATE + timedelta(minutes=1), writer)
    assert (list(again), again.held, again.left_due) == ([], [a], [])
    assert _claim(db, a) == CLAIM and len(writer.scopes) == 1


def test_unknown_id_writes_nothing(db):
    a = make(db)
    _held(db, a)
    with pytest.raises(Missing):
        digests.request_run(db, "Mara L", 999, LATE)
    assert _claim(db, a) == CLAIM and count(db, "digest_runs") == 0


def test_other_owner_id_writes_nothing_and_own_request_leaves_others_claim(db):
    a = make(db)
    b = make(db, "Tobias O", name="His brief")
    _held(db, a)
    with pytest.raises(Missing):
        digests.request_run(db, "Tobias O", a, LATE)
    digests.request_run(db, "Tobias O", b, LATE)
    assert _claim(db, a) == CLAIM and count(db, "digest_runs") == 0
    assert (
        db.execute("SELECT run_requested_at FROM digests WHERE id=?", (b,)).fetchone()[0]
        == "2026-11-27T09:00:00+00:00"
    )


def test_unreadable_other_row_does_not_fail_a_request(db):
    a = make(db)
    b = make(db, "Tobias O", name="His brief")
    _held(db, a, period_from="not a time")
    digests.request_run(db, "Tobias O", b, LATE)
    assert (
        db.execute("SELECT run_requested_at FROM digests WHERE id=?", (b,)).fetchone()[0]
        == "2026-11-27T09:00:00+00:00"
    )


def test_own_stale_claim_settled_and_refused_and_kept(db):
    a = make(db)
    _held(db, a)
    with pytest.raises(
        Conflict, match="This digest ran at 09:00 UTC. It can run again from 09:30 UTC."
    ):
        digests.request_run(db, "Mara L", a, LATE)
    assert _claim(db, a) is None
    assert _runs(db, a) == [("schedule", "2026-11-27T09:00:00+00:00", digests.UNRECORDED)]


def test_claim_exactly_call_bound_old_is_refused_and_not_paid_twice(db):
    story(db, source(db), "Plant closure", at("2026-11-26 09:00"))
    a = make(db)
    _held(db, a)
    with pytest.raises(Conflict):
        digests.request_run(db, "Mara L", a, DUE + timedelta(minutes=31))
    writer = RecordingWriter()
    digests.run_due(db, DUE + timedelta(minutes=32), writer)
    assert len(writer.scopes) == 0
