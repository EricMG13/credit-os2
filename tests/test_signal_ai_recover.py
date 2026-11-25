"""Third review, finding 10: what a process does as it starts. An open reservation older than the
adapter's own bound on a call is settled as unknown at its full hold (the pass goes off), a
younger one is left; a digest run cut short during its model call is recorded as a failed write
and waits for its next slot. SYNTHETIC: replies come from ``signal_ai_fakes.FakeModel``; the
service is started on 127.0.0.1 and stopped at once; no paid or networked call is made.
"""

from __future__ import annotations

import contextlib
import io
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import LUNA_HOLD, FakeModel, guard, ok, setup

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_digest, ai_ledger, ai_run, digests, service, store
from deploy_workflow.signal.cli import main
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.store import Conflict

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
CONFIG = "copilot-luna-xhigh"


def _world(root: Path) -> Any:
    db = store.open_db(root)
    source = store.propose_source(db, "Wire", "news", "https://wire.example/f", "x")
    when = NOW - timedelta(hours=1)
    store.add_story(db, source, Entry("A bond story", "https://wire.example/1", when, "S."), when)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    return db


def _reserve(db: Any, at: datetime) -> int:
    return ai_ledger.reserve(db, "stories", CONFIG, LUNA_HOLD, at, ruled_cap=Decimal(15))


def test_at_start_up_a_hold_older_than_the_adapters_bound_is_an_unknown_cost(tmp_path):
    db = _world(tmp_path / "root")
    old = _reserve(db, NOW - timedelta(minutes=32))
    young = _reserve(db, NOW - timedelta(minutes=30))
    assert ai_run.recover(db, setup(tmp_path, clock=NOW)) == (1, 0)
    rows = dict(db.execute("SELECT id, status FROM ai_usage"))
    assert rows == {old: "unknown", young: "open"}  # another process may own the young one
    off = ai_ledger.switched_off(db)
    assert off is not None and off[0] == "a call reserved at 2026-11-25 11:28 UTC was never settled"
    assert ai_ledger.totals(db, "2026-11").spent == LUNA_HOLD
    db.close()


def _crashed_digest_run(tmp: Path) -> tuple[Any, int]:
    db = _world(tmp / "root")
    form = digests.Form("D", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", "")
    ident = digests.create(
        db, "Rita Reader", digests.spec_from_form(db, "Rita Reader", form), NOW - timedelta(days=2)
    )
    digests.request_run(db, "Rita Reader", ident, NOW)

    def dies(request: TurnRequest) -> Any:
        raise KeyboardInterrupt  # the service is stopped while the call is in flight

    with pytest.raises(KeyboardInterrupt):
        digests.run_due(
            db, NOW, ai_digest.Writer(db, FakeModel(answer=dies), guard(tmp / "gate", NOW), NOW)
        )
    return db, ident


def test_a_digest_run_cut_short_during_its_call_is_recorded_at_the_next_start(tmp_path):
    db, ident = _crashed_digest_run(tmp_path)
    row = db.execute("SELECT claimed_by, claimed_at, run_requested_at FROM digests").fetchone()
    assert tuple(row) == ("schedule", NOW.isoformat(), None)  # it was due by its schedule too
    assert db.execute("SELECT COUNT(*) FROM digest_runs").fetchone()[0] == 0
    assert ai_run.recover(db, setup(tmp_path, clock=NOW + timedelta(minutes=5))) == (0, 0)  # young
    later = NOW + timedelta(minutes=32)
    assert ai_run.recover(db, setup(tmp_path, clock=later)) == (1, 1)
    run = db.execute("SELECT trigger, outcome, reason, period_end FROM digest_runs").fetchone()
    assert tuple(run) == (
        "schedule",
        "skipped",
        "no issue was written: the service stopped while its model call was in flight",
        NOW.isoformat(),
    )
    held = digests.owned(db, "Rita Reader", ident)
    assert held.period_from == datetime(2026, 11, 23, 7, 0, tzinfo=UTC)  # the period is kept
    assert db.execute("SELECT claimed_at FROM digests").fetchone()[0] is None
    with pytest.raises(Conflict, match="runs again at its next scheduled time, 26 Nov 07:00 UTC"):
        digests.request_run(db, "Rita Reader", ident, later + timedelta(hours=1))
    db.close()


def test_every_recorded_or_given_back_run_clears_its_claim(tmp_path):
    db = _world(tmp_path / "root")
    form = digests.Form("D", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", "")
    ident = digests.create(
        db, "Rita Reader", digests.spec_from_form(db, "Rita Reader", form), NOW - timedelta(days=1)
    )
    reply = json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["1"]}]})
    digests.run_due(
        db, NOW, ai_digest.Writer(db, FakeModel([ok(reply)]), guard(tmp_path / "gate", NOW), NOW)
    )
    assert db.execute("SELECT claimed_by, claimed_at FROM digests").fetchone()[:] == (None, None)
    ai_ledger.set_cap(db, Decimal("0.10"), NOW)  # the next call is refused: the run is given back
    slot = NOW + timedelta(days=1)
    source = db.execute("SELECT id FROM sources").fetchone()[0]
    entry = Entry("Another bond story", "https://wire.example/2", slot - timedelta(hours=1), "S.")
    store.add_story(db, source, entry, slot - timedelta(hours=1))
    digests.run_due(
        db, slot, ai_digest.Writer(db, FakeModel(), guard(tmp_path / "gate", slot), slot)
    )
    assert db.execute("SELECT claimed_by, claimed_at FROM digests").fetchone()[:] == (None, None)
    assert digests.owned(db, "Rita Reader", ident).next_run_at <= slot
    db.close()


def test_the_owners_pass_recovers_before_it_runs(tmp_path):
    root = tmp_path / "store"
    db = _world(root)
    now = datetime.now(UTC)
    _reserve(db, now - timedelta(hours=1, minutes=-25))  # 35 minutes ago: past the bound
    db.close()
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = main(["--root", str(root), "ai", "pass"], ai=setup(tmp_path))
    assert code == 2 and "switched off because a call reserved at" in out.getvalue()


def test_the_service_recovers_as_it_starts(tmp_path, monkeypatch):
    root = tmp_path / "root"
    db = _world(root)
    _reserve(db, datetime.now(UTC) - timedelta(minutes=40))
    db.close()
    monkeypatch.setattr(service.Loop, "run_until", lambda self, stop, tick: None)
    monkeypatch.setattr(
        service.ThreadingHTTPServer,
        "serve_forever",
        lambda self: (_ for _ in ()).throw(KeyboardInterrupt),
    )
    assert service.serve(root, "127.0.0.1", 0) == 0
    db = store.open_db(root)
    assert db.execute("SELECT status FROM ai_usage").fetchone()[0] == "unknown"
    db.close()


# Fourth review, N11: a digest's claim carries the writer's clock when its call starts


def test_a_second_process_starting_late_in_a_long_tick_leaves_a_live_digest_run_alone(tmp_path):
    """review4/a15_recover.py: the tick began at 12:00, its digest call started at 12:40 and a
    second process started at 12:41. The claim carried 12:00, so the second process recorded the
    live run as interrupted (and the issue was written as well)."""
    tick, started = NOW, NOW + timedelta(minutes=40)
    root = tmp_path / "root"
    db = _world(root)
    form = digests.Form("D", ["All stories"], "Daily, 11:59 UTC", "Up to 3 points", "")
    spec = digests.spec_from_form(db, "Rita", form)
    digests.create(db, "Rita", spec, tick - timedelta(days=1))
    second = store.open_db(root)
    seen: dict[str, Any] = {}

    def during(request: TurnRequest) -> Any:
        claimed = second.execute("SELECT claimed_at FROM digests").fetchone()[0]
        seen["claimed_at"] = datetime.fromisoformat(claimed)
        later = started + timedelta(minutes=1)
        seen["recover"] = ai_run.recover(second, setup(tmp_path, FakeModel(), clock=later))
        return ok(json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["1"]}]}), "0.006")

    ran = ai_run.digest_pass(db, tick, setup(tmp_path, FakeModel(answer=during), clock=started))
    assert seen["claimed_at"] == started
    assert seen["recover"] == (0, 0)  # nothing settled, no run recorded by the second process
    runs = db.execute("SELECT outcome, reason FROM digest_runs").fetchall()
    assert [tuple(r) for r in runs] == [("written", "written by the AI pass")]
    assert [r.outcome for _, r in ran] == ["written"]
    second.close()
    db.close()
