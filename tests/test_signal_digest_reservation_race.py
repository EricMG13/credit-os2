"""The production writer holds only its own digest claim and waits after a paid storage fault."""

import sqlite3
from contextlib import closing
from datetime import timedelta
from decimal import Decimal

import pytest
from signal_ai_fakes import CONFIG, LUNA_HOLD, FakeModel, guard, ok, setup
from test_signal_digest import make
from test_signal_digest_claim_ownership import DUE, NEXT_DUE, REPLY, _ready

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.turn import Compaction, Turn, Usage
from deploy_workflow.signal import ai_call, ai_digest, ai_ledger, ai_run, digests, store


def test_expired_worker_cannot_send_after_successor_recovery(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db, closing(store.open_db(tmp_path)) as other:
        ident = _ready(db)
        requested = DUE - timedelta(minutes=30)
        successor_time = DUE + timedelta(minutes=2)
        ai_ledger.set_cap(db, Decimal(15), DUE)
        original, successor = FakeModel([ok(REPLY)]), FakeModel([ok(REPLY)])
        digests.request_run(db, "Mara L", ident, requested)
        draft = ai_digest.Writer.draft

        def recover_before_draft(writer, scope):
            if writer.model is original:
                ai_run.digest_pass(
                    other, successor_time, setup(tmp_path, successor, clock=successor_time)
                )
            return draft(writer, scope)

        monkeypatch.setattr(ai_digest.Writer, "draft", recover_before_draft)
        ai_run.digest_pass(db, requested, setup(tmp_path, original, clock=requested))

        assert len(successor.requests) == 1
        assert original.requests == []
        assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.004")


@pytest.mark.parametrize("valid_reply", [True, False])
def test_paid_storage_fault_refuses_manual_retry_before_next_slot(
    tmp_path, monkeypatch, valid_reply
):
    with closing(store.open_db(tmp_path)) as db:
        ident = _ready(db)
        model = FakeModel([ok(REPLY if valid_reply else "invalid digest text")])
        ai_ledger.set_cap(db, Decimal(15), DUE)

        def cannot_store(*args):
            raise sqlite3.IntegrityError("simulated write failure")

        if valid_reply:
            monkeypatch.setattr(ai_digest.Writer, "store", cannot_store)
        else:
            monkeypatch.setattr(digests, "_close", cannot_store)
        ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))

        assert len(model.requests) == 1
        assert digests.owned(db, "Mara L", ident).next_run_at == NEXT_DUE
        with pytest.raises(digests.Conflict, match="next scheduled time"):
            digests.request_run(db, "Mara L", ident, DUE + timedelta(minutes=31))


def test_failed_settlement_keeps_claim_and_prevents_second_paid_call(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db:
        ident = _ready(db)
        ai_ledger.set_cap(db, Decimal(15), DUE)
        model = FakeModel([ok(REPLY)])

        def cannot_settle(*args):
            raise sqlite3.IntegrityError("simulated ledger write failure")

        with monkeypatch.context() as patch:
            patch.setattr(ai_ledger, "settle", cannot_settle)
            with pytest.raises(ai_run.DigestsLeftDue, match="hold their claim"):
                ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))

        assert len(model.requests) == 1
        assert ai_ledger.totals(db, "2026-11").open_calls == 1
        later = DUE + ai_ledger.CALL_BOUND + timedelta(minutes=1)
        with pytest.raises(digests.Conflict, match="being written now"):
            digests.request_run(db, "Mara L", ident, later)
        second = FakeModel([ok(REPLY)])
        ai_run.digest_pass(db, later, setup(tmp_path, second, clock=later))
        assert second.requests == []
        claimed = db.execute("SELECT claimed_at FROM digests WHERE id=?", (ident,)).fetchone()[0]
        assert claimed == DUE.isoformat()


def test_failed_settlement_stops_new_calls_for_the_pass(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db:
        _ready(db)
        for index in range(10):
            make(db, owner=f"Member {index}", name=f"Digest {index}")
        model = FakeModel([ok(REPLY)] * 11)
        ai_ledger.set_cap(db, Decimal(15), DUE)
        settle = ai_ledger.settle

        def fail_first(database, call_id, *args):
            if call_id == 1:
                raise sqlite3.IntegrityError("simulated ledger write failure")
            return settle(database, call_id, *args)

        monkeypatch.setattr(ai_ledger, "settle", fail_first)
        with pytest.raises(ai_run.DigestsLeftDue, match="hold their claim"):
            ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))

        assert ai_ledger.totals(db, "2026-11").open_calls == 1
        assert len(model.requests) == 1


@pytest.mark.parametrize(
    ("billed", "compactions"),
    [
        (Decimal("0." + "1" * 121), ()),
        (
            Decimal("1E+120"),
            (Compaction(kind="complete", success=True, usd=Decimal("0.001"), usage_reported=True),),
        ),
        (
            Decimal("0.001"),
            (
                Compaction(
                    kind="complete", success=True, usd=Decimal("1E+120"), usage_reported=True
                ),
                Compaction(
                    kind="complete", success=True, usd=Decimal("0.001"), usage_reported=True
                ),
            ),
        ),
    ],
)
def test_un_summable_charge_settles_as_unknown_at_full_hold(tmp_path, billed, compactions):
    usage = Usage(input_tokens=3000, output_tokens=900)
    turn = Turn(REPLY, (), usage, "end", None, None, 200, billed)
    reply = AdapterReply(
        "ok", turn, None, 200, None, None, None, None, usage, billed, compactions=compactions
    )
    assert ai_call.charge(reply, CONFIG) is None

    with closing(store.open_db(tmp_path)) as db:
        ai_ledger.set_cap(db, Decimal(15), DUE)
        model = FakeModel([reply])
        answer = ai_call.call(
            db, model, guard(tmp_path, DUE), "stories", ai_call.Prompt("s", "u", 100)
        )
        assert answer.outcome == "ok"
        row = db.execute(
            "SELECT status, settled_usd FROM ai_usage WHERE id=?", (answer.call_id,)
        ).fetchone()
        assert tuple(row) == ("unknown", None)
        assert ai_ledger.totals(db, "2026-11").spent == LUNA_HOLD
        assert ai_ledger.switched_off(db) is not None


@pytest.mark.parametrize("where", ["settle", "clock_on_ok", "clock_on_error"])
def test_unexpected_settlement_exception_raises_fault_and_holds_claim(tmp_path, monkeypatch, where):
    with closing(store.open_db(tmp_path)) as db:
        ident = _ready(db)
        ai_ledger.set_cap(db, Decimal(15), DUE)
        if where == "clock_on_error":

            def fail_complete(*args, **kwargs):
                raise RuntimeError("adapter crash")

            model = FakeModel()
            monkeypatch.setattr(model, "complete", fail_complete)
        else:
            model = FakeModel([ok(REPLY)])

        with monkeypatch.context() as patch:
            if where == "settle":

                def fail_settle(*args):
                    raise RuntimeError("unexpected settlement failure")

                patch.setattr(ai_ledger, "settle", fail_settle)
                clock = DUE
            else:
                armed = [False]
                real_reserve = ai_ledger.reserve

                def reserve_then_arm(*args, **kwargs):
                    call_id = real_reserve(*args, **kwargs)
                    armed[0] = True
                    return call_id

                patch.setattr(ai_ledger, "reserve", reserve_then_arm)

                def failing_settle_clock():
                    if armed[0]:
                        raise RuntimeError("clock failed during settle")
                    return DUE

                clock = failing_settle_clock

            with pytest.raises(ai_run.DigestsLeftDue, match="hold their claim"):
                ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=clock))

        if where != "clock_on_error":
            assert len(model.requests) == 1
        assert ai_ledger.totals(db, "2026-11").open_calls == 1
        claimed = db.execute("SELECT claimed_at FROM digests WHERE id=?", (ident,)).fetchone()[0]
        assert claimed == DUE.isoformat()

        later = DUE + ai_ledger.CALL_BOUND + timedelta(minutes=1)
        with pytest.raises(digests.Conflict, match="being written now"):
            digests.request_run(db, "Mara L", ident, later)
        second = FakeModel([ok(REPLY)])
        ai_run.digest_pass(db, later, setup(tmp_path, second, clock=later))
        assert second.requests == []
        claimed = db.execute("SELECT claimed_at FROM digests WHERE id=?", (ident,)).fetchone()[0]
        assert claimed == DUE.isoformat()


def test_unexpected_settlement_exception_stops_new_calls_for_the_pass(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db:
        _ready(db)
        for index in range(10):
            make(db, owner=f"Member {index}", name=f"Digest {index}")
        model = FakeModel([ok(REPLY)] * 11)
        ai_ledger.set_cap(db, Decimal(15), DUE)

        def fail_settle(*args):
            raise RuntimeError("unexpected settlement failure")

        monkeypatch.setattr(ai_ledger, "settle", fail_settle)
        with pytest.raises(ai_run.DigestsLeftDue, match="hold their claim"):
            ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))

        assert ai_ledger.totals(db, "2026-11").open_calls == 1
        assert len(model.requests) == 1


def test_writer_draft_counts_call_when_settlement_faults(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db:
        ident = _ready(db)
        ai_ledger.set_cap(db, Decimal(15), DUE)
        model = FakeModel([ok(REPLY)])
        writer = ai_digest.Writer(db, model, guard(tmp_path, DUE), DUE)

        def fail_settle(*args):
            raise RuntimeError("unexpected settlement failure")

        monkeypatch.setattr(ai_ledger, "settle", fail_settle)
        with store._write_transaction(db):
            digest = digests.owned(db, "Mara L", ident)
            scope = digests._plan(db, digest, DUE, "schedule", writer)
            assert isinstance(scope, digests.Scope)

        with pytest.raises(ai_call.SettlementFault):
            writer.draft(scope)

        assert writer.calls == 1
        assert writer.stopped is not None
        assert writer.fault is True
