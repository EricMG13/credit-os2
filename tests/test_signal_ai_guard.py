"""Third review, finding 1: the whole gate is checked again immediately before every reservation,
so a precondition lost while a job runs stops the job's very next call, and a refused call costs
nothing. SYNTHETIC: every reply comes from ``signal_ai_fakes.FakeModel``; rulings live in a
temporary folder; the key is a fake value in a mapping.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import (
    FakeModel,
    clock_at,
    environ,
    label,
    labels_reply,
    ok,
    write_ruling,
)

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_call, ai_ledger, ai_pass, ai_run, digests, store
from deploy_workflow.signal.feeds import Entry

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
CONFIG = "copilot-luna-xhigh"


def _ids(request: TurnRequest) -> list[int]:
    lines = request.messages[1].text.splitlines()
    return [int(json.loads(line)["id"]) for line in lines if line.startswith('{"id"')]


def _world(tmp: Path, stories: int) -> tuple[sqlite3.Connection, Path, dict[str, str]]:
    db = store.open_db(tmp / "root")
    source = store.propose_source(db, "Wire", "news", "https://wire.example/feed", "x")
    store.set_source_state(db, source, "approved")
    for n in range(stories):
        when = NOW - timedelta(minutes=5 + n)
        entry = Entry(f"Story {n} about a bond", f"https://wire.example/{n}", when, "S.")
        store.add_story(db, source, entry, when)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    rulings = tmp / "rulings"
    write_ruling(rulings)
    return db, rulings, environ(tmp)


def _labelling(during: Callable[[], None]) -> FakeModel:
    """A model that labels every story it is sent, after running `during` (the call in flight)."""

    def answer(request: TurnRequest) -> Any:
        during()
        return ok(labels_reply([label(n) for n in _ids(request)]), usd="0.005")

    return FakeModel(answer=answer)


def _first_call_only(action: Callable[[], None]) -> Callable[[], None]:
    done: list[bool] = []

    def once() -> None:
        if not done:
            done.append(True)
            action()

    return once


def test_a_ruling_withdrawn_during_the_first_call_stops_the_story_pass_at_the_next(tmp_path):
    db, rulings, env = _world(tmp_path, 100)
    ruling = rulings / "2026-11-25-signal-ai-pass.md"
    model = _labelling(_first_call_only(ruling.unlink))
    setup = ai_run.Setup(env, rulings, lambda config_id, path: model, clock_at(NOW))
    report = ai_run.story_pass(db, NOW, setup)
    assert report is not None
    assert (report.calls, report.written, len(model.requests)) == (1, 20, 1)
    assert report.stopped == (
        "the AI pass is off: No standing ruling for Signal's model calls is in docs/rulings"
        " (a file named YYYY-MM-DD-signal-ai-pass.md)."
    )
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 1  # the refusal holds none
    assert ai_ledger.totals(db, "2026-11").total == Decimal("0.005")
    db.close()


def test_a_ruled_cap_lowered_below_the_stored_cap_during_a_call_stops_the_next(tmp_path):
    db, rulings, env = _world(tmp_path, 100)
    model = _labelling(_first_call_only(lambda: write_ruling(rulings, cap="0.01")))
    setup = ai_run.Setup(env, rulings, lambda config_id, path: model, clock_at(NOW))
    report = ai_run.story_pass(db, NOW, setup)
    assert report is not None and len(model.requests) == 1
    assert report.stopped == (
        "the AI pass is off: The owner's monthly cap of USD 15 is above the ruled cap of USD 0.01;"
        " the owner sets one no higher (signal ai cap)."
    )
    db.close()


@pytest.mark.parametrize(
    ("change", "stopped"),
    [
        (
            lambda env, rulings: env.pop("COPILOT_GITHUB_TOKEN"),
            "the AI pass is off: The service was started without the provider's key:",
        ),
        (
            lambda env, rulings: write_ruling(rulings, configs="copilot-sol-medium"),
            "the AI pass is off: The ruling 2026-11-25-signal-ai-pass.md is not accepted:",
        ),
    ],
)
def test_a_key_or_configuration_lost_during_a_call_stops_the_next(tmp_path, change, stopped):
    db, rulings, env = _world(tmp_path, 60)
    model = _labelling(_first_call_only(lambda: change(env, rulings)))
    guard = ai_call.Guard(env, rulings, clock_at(NOW))
    report = ai_pass.run(db, model, guard, NOW)
    assert len(model.requests) == 1 and report.stopped is not None
    assert report.stopped.startswith(stopped)
    db.close()


def test_a_switch_off_by_another_process_during_a_call_stops_the_next(tmp_path):
    db, rulings, env = _world(tmp_path, 60)
    other = store.open_db(tmp_path / "root")

    def switch_off() -> None:
        held = ai_ledger.reserve(
            other, "stories", CONFIG, Decimal("0.3585"), NOW, ruled_cap=Decimal(15)
        )
        ai_ledger.settle(other, held, None, "raised: RuntimeError", NOW)

    model = _labelling(_first_call_only(switch_off))
    report = ai_pass.run(db, model, ai_call.Guard(env, rulings, clock_at(NOW)), NOW)
    assert len(model.requests) == 1
    assert report.stopped is not None and "switched off because" in report.stopped
    other.close()
    db.close()


def test_the_ruled_cap_bounds_a_reservation_whatever_cap_is_stored(tmp_path):
    db = store.open_db(tmp_path)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    with pytest.raises(ai_ledger.Refused, match="would pass the monthly cap of USD 0.50"):
        ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.51"), NOW, ruled_cap=Decimal("0.50"))
    ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.50"), NOW, ruled_cap=Decimal("0.50"))
    assert ai_ledger.totals(db, "2026-11").held == Decimal("0.50")
    for bad in (Decimal(0), Decimal(-1), Decimal("NaN")):
        with pytest.raises(store.StoreError):
            ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.1"), NOW, ruled_cap=bad)
    db.close()


def _digest_world(tmp: Path, count: int) -> tuple[sqlite3.Connection, Path, dict[str, str]]:
    db, rulings, env = _world(tmp, 1)
    with db:
        db.execute(
            "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, stage, moves,"
            " config_id, written_at, month) VALUES(1, 'written', 'W.', 2, '[]', 'news', NULL,"
            " '[]', ?, ?, '2026-11')",
            (CONFIG, store._utc_text(NOW)),
        )
    form = digests.Form("D", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", "")
    for person in range(count):
        name = f"Visitor {person}"
        spec = digests.spec_from_form(db, name, form)
        digests.create(db, name, spec, NOW - timedelta(days=1))
    return db, rulings, env


def test_a_ruling_withdrawn_during_the_first_digest_call_stops_the_digest_pass(tmp_path):
    db, rulings, env = _digest_world(tmp_path, 40)
    ruling = rulings / "2026-11-25-signal-ai-pass.md"
    reply = json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["1"]}]})

    def answer(request: TurnRequest) -> Any:
        if ruling.exists():
            ruling.unlink()
        return ok(reply, usd="0.006")

    model = FakeModel(answer=answer)
    setup = ai_run.Setup(env, rulings, lambda config_id, path: model, clock_at(NOW))
    ran = ai_run.digest_pass(db, NOW, setup)
    assert len(model.requests) == 1
    assert [run.outcome for _, run in ran] == ["written"]
    # the second digest's call was refused: it is due again as it was, with no run recorded
    due = db.execute(
        "SELECT COUNT(*) FROM digests WHERE next_run_at <= ? AND period_from < ?",
        (store._utc_text(NOW), store._utc_text(NOW)),
    ).fetchone()[0]
    assert due == 39
    assert db.execute("SELECT COUNT(*) FROM digest_runs").fetchone()[0] == 1
    assert ai_ledger.totals(db, "2026-11").total == Decimal("0.006")
    db.close()


def test_a_ruling_that_now_allows_another_configuration_refuses_the_models_calls(
    tmp_path, monkeypatch
):
    from deploy_workflow.signal import ai_gate

    monkeypatch.setattr(ai_gate, "CONFIGS", ("copilot-sol-medium", CONFIG))
    db, rulings, env = _world(tmp_path, 60)
    model = _labelling(
        _first_call_only(lambda: write_ruling(rulings, configs="copilot-sol-medium"))
    )
    report = ai_pass.run(db, model, ai_call.Guard(env, rulings, clock_at(NOW)), NOW)
    assert len(model.requests) == 1
    assert report.stopped == f"the ruling no longer allows {CONFIG}"
    db.close()
