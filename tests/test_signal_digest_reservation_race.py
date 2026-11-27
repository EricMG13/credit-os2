"""The production writer holds only its own digest claim and waits after a paid storage fault."""

import sqlite3
from contextlib import closing
from datetime import timedelta
from decimal import Decimal

import pytest
from signal_ai_fakes import FakeModel, ok, setup
from test_signal_digest_claim_ownership import DUE, NEXT_DUE, REPLY, _ready

from deploy_workflow.signal import ai_digest, ai_ledger, ai_run, digests, store


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


def test_paid_storage_fault_refuses_manual_retry_before_next_slot(tmp_path, monkeypatch):
    with closing(store.open_db(tmp_path)) as db:
        ident = _ready(db)
        model = FakeModel([ok(REPLY)])
        ai_ledger.set_cap(db, Decimal(15), DUE)

        def cannot_store(*args):
            raise sqlite3.IntegrityError("simulated write failure")

        monkeypatch.setattr(ai_digest.Writer, "store", cannot_store)
        ai_run.digest_pass(db, DUE, setup(tmp_path, model, clock=DUE))

        assert len(model.requests) == 1
        assert digests.owned(db, "Mara L", ident).next_run_at == NEXT_DUE
        with pytest.raises(digests.Conflict, match="next scheduled time"):
            digests.request_run(db, "Mara L", ident, DUE + timedelta(minutes=31))
