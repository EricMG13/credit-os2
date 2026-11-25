"""Signal's calls through the project's real ``CopilotAdapter`` class, with the adapter test rig's
FAKE client in place of the SDK client (``client_factory``): no runtime is started, nothing is sent
anywhere, no provider can be reached. The token is an obviously fake value in a mapping passed to
the adapter, never ``os.environ``. SYNTHETIC throughout.

Third review, finding 4: which failures may be tried again at no cost is decided on the reply kinds
this adapter really produces. Only ``not_sent`` (the adapter established nothing was sent) is free
and retried; a provider rate limit reaches Signal as a session error, ``sent_unknown``: it counts at
the call's full hold and switches the pass off until the owner runs ``signal ai clear``.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import LUNA_HOLD, clock_at, label, labels_reply, write_ruling

from deploy_workflow.model.copilot_adapter import CopilotAdapter
from deploy_workflow.model.turn import ModelSpec
from deploy_workflow.signal import ai_call, ai_digest, ai_ledger, ai_pass, digests, store
from deploy_workflow.signal.feeds import Entry
from tests.model.test_copilot_adapter import Emit, FakeClient, Idle, said, wire

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
SPEC = ModelSpec("copilot-luna-xhigh", "copilot", "gpt-6-luna", "xhigh")
MODELS = [{"id": "gpt-6-luna", "supportedReasoningEfforts": ["low", "medium", "high", "xhigh"]}]
FAKE_TOKEN = "ghp_" + "A" * 36  # the adapter rig's shape of token; obviously not a real one


def usage(**extra: Any) -> Emit:
    data = {"model": "gpt-6-luna", "inputTokens": 3000, "outputTokens": 900, "finishReason": "stop"}
    return Emit(wire("assistant.usage", {**data, **extra}))


def paid(nano: int) -> Emit:
    """The runtime's reported cost: 1,000,000,000 nano-AIU is USD 0.01."""
    return usage(copilotUsage={"totalNanoAiu": nano})


RATE_LIMITED = Emit(
    wire(
        "session.error",
        {"errorType": "rate_limited", "message": "Too many requests", "statusCode": 429},
    )
)


class World:
    """A store, a rulings folder, a fake runtime file and the working directory the adapter keeps
    its exchange homes under (a temporary one)."""

    def __init__(self, tmp: Path, monkeypatch: pytest.MonkeyPatch, stories: int = 2) -> None:
        self.tmp = tmp
        monkeypatch.chdir(tmp)
        self.rulings = tmp / "rulings"
        self.ruling = write_ruling(self.rulings)
        runtime = tmp / "copilot-runtime"
        runtime.write_text("#!/bin/sh\n", encoding="utf-8")
        self.env = {"COPILOT_GITHUB_TOKEN": FAKE_TOKEN, "COPILOT_CLI_PATH": str(runtime)}
        self.db = store.open_db(tmp / "root")
        source = store.propose_source(self.db, "Wire", "news", "https://wire.example/f", "x")
        store.set_source_state(self.db, source, "approved")
        for n in range(stories):
            when = NOW - timedelta(minutes=5 + n)
            entry = Entry(f"Story {n} about a bond", f"https://wire.example/{n}", when, "S.")
            store.add_story(self.db, source, entry, when)
        ai_ledger.set_cap(self.db, Decimal(15), NOW)
        self.guard = ai_call.Guard(self.env, self.rulings, clock_at(NOW))

    def adapter(self, script: list[Any], env: dict[str, str] | None = None) -> CopilotAdapter:
        client = FakeClient(script, MODELS)
        return CopilotAdapter(
            SPEC,
            self.ruling,
            environ=self.env if env is None else env,
            rulings_root=self.rulings,
            client_factory=lambda options: client,
            idle_s=3.0,
            overall_s=6.0,
        )

    def usage_rows(self) -> list[tuple[Any, ...]]:
        rows = self.db.execute(
            "SELECT status, outcome, reserved_usd, settled_usd FROM ai_usage ORDER BY id"
        )
        return [tuple(row) for row in rows]


GOOD = labels_reply([label(1), label(2)])


def test_a_normal_reply_is_settled_at_the_runtimes_reported_cost(tmp_path, monkeypatch):
    world = World(tmp_path, monkeypatch)
    model = world.adapter([said(GOOD), paid(500_000_000), Idle()])
    report = ai_pass.run(world.db, model, world.guard, NOW)
    model.close()
    assert (report.calls, report.written, report.stopped) == (1, 2, None)
    assert world.usage_rows() == [("settled", "ok", "0.35850000", "0.00500000000")]


def test_a_rate_limit_counts_at_the_full_hold_and_switches_the_pass_off(tmp_path, monkeypatch):
    world = World(tmp_path, monkeypatch)
    model = world.adapter([RATE_LIMITED, Idle()])
    report = ai_pass.run(world.db, model, world.guard, NOW)
    model.close()
    assert report.stopped == "the model call failed (sent_unknown: SessionError)"
    assert world.usage_rows() == [("unknown", "sent_unknown: SessionError", "0.35850000", None)]
    assert ai_ledger.totals(world.db, "2026-11").spent == LUNA_HOLD
    off = ai_ledger.switched_off(world.db)
    assert (
        off is not None and off[0] == "the cost of a call made at 2026-11-25 12:00 UTC is not known"
    )
    later = ai_pass.run(world.db, world.adapter([]), world.guard, NOW + timedelta(hours=1))
    assert later.calls == 0 and later.stopped is not None and "signal ai clear" in later.stopped


def test_a_reply_with_no_reported_cost_counts_at_the_full_hold(tmp_path, monkeypatch):
    world = World(tmp_path, monkeypatch)
    model = world.adapter([said(GOOD), usage(), Idle()])
    ai_pass.run(world.db, model, world.guard, NOW)
    model.close()
    assert world.usage_rows() == [("unknown", "ok", "0.35850000", None)]
    assert ai_ledger.switched_off(world.db) is not None


def test_a_call_the_adapter_did_not_send_is_free_and_tried_again_at_the_next_tick(
    tmp_path, monkeypatch
):
    world = World(tmp_path, monkeypatch)
    keyless = {"COPILOT_CLI_PATH": world.env["COPILOT_CLI_PATH"]}  # the adapter's own view
    model = world.adapter([said(GOOD), paid(500_000_000), Idle()], env=keyless)
    report = ai_pass.run(world.db, model, world.guard, NOW)
    model.close()
    assert report.stopped == "the model call failed (not_sent: KeyMissing)"
    assert world.usage_rows() == [("settled", "not_sent: KeyMissing", "0.35850000", "0")]
    assert ai_ledger.switched_off(world.db) is None
    again = world.adapter([said(GOOD), paid(500_000_000), Idle()])
    later = NOW + timedelta(minutes=1)  # no 30-minute wait after a call that cost nothing
    report = ai_pass.run(world.db, again, world.guard, later)
    again.close()
    assert (report.calls, report.written) == (1, 2)


def _digest(world: World) -> int:
    with world.db:
        world.db.execute(
            "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, stage, moves,"
            " config_id, written_at, month) VALUES(1, 'written', 'W.', 2, '[]', 'news', NULL, '[]',"
            " 'copilot-luna-xhigh', ?, '2026-11')",
            (store._utc_text(NOW),),
        )
    form = digests.Form("D", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", "")
    spec = digests.spec_from_form(world.db, "Rita Reader", form)
    return digests.create(world.db, "Rita Reader", spec, NOW - timedelta(days=1))


def _points() -> str:
    return json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["1"]}]})


def test_a_digest_whose_call_was_not_sent_stays_due_as_it_was(tmp_path, monkeypatch):
    world = World(tmp_path, monkeypatch)
    ident = _digest(world)
    before = digests.owned(world.db, "Rita Reader", ident)
    keyless = {"COPILOT_CLI_PATH": world.env["COPILOT_CLI_PATH"]}
    model = world.adapter([said(_points()), paid(600_000_000), Idle()], env=keyless)
    ran = digests.run_due(world.db, NOW, ai_digest.Writer(world.db, model, world.guard, NOW))
    model.close()
    assert ran.left_due == [ident] and list(ran) == []  # a fault the loop shows
    after = digests.owned(world.db, "Rita Reader", ident)
    assert (after.next_run_at, after.period_from) == (before.next_run_at, before.period_from)
    assert world.db.execute("SELECT COUNT(*) FROM digest_runs").fetchone()[0] == 0
    model = world.adapter([said(_points()), paid(600_000_000), Idle()])
    later = NOW + timedelta(minutes=1)
    ran = digests.run_due(world.db, later, ai_digest.Writer(world.db, model, world.guard, later))
    model.close()
    assert [(n, r.outcome) for n, r in ran] == [(ident, "written")]


def test_a_rate_limited_digest_call_is_recorded_and_waits_for_its_next_slot(tmp_path, monkeypatch):
    world = World(tmp_path, monkeypatch)
    ident = _digest(world)
    model = world.adapter([RATE_LIMITED, Idle()])
    ran = digests.run_due(world.db, NOW, ai_digest.Writer(world.db, model, world.guard, NOW))
    model.close()
    assert [(n, r.reason) for n, r in ran] == [
        (ident, "no issue was written: the model call failed (sent_unknown: SessionError)")
    ]
    held = digests.owned(world.db, "Rita Reader", ident)
    assert held.next_run_at == datetime(2026, 11, 26, 7, 0, tzinfo=UTC)
    assert ai_ledger.totals(world.db, "2026-11").spent == LUNA_HOLD


# Finding 5: exchange ids carry the store's own id; the homes a job caused are removed


def test_each_store_has_its_own_random_id_so_a_recreated_store_reuses_no_exchange_id(tmp_path):
    first, second = store.open_db(tmp_path / "a"), store.open_db(tmp_path / "b")
    ids = {ai_ledger.store_id(first), ai_ledger.store_id(second)}
    assert len(ids) == 2 and all(len(i) == 16 and set(i) <= set("0123456789abcdef") for i in ids)
    first.close()
    again = store.open_db(tmp_path / "a")
    assert ai_ledger.store_id(again) in ids  # kept by the store it was made with
    again.close()
    second.close()


def test_a_recreated_store_in_the_same_directory_is_not_refused_by_an_old_home(
    tmp_path, monkeypatch
):
    world = World(tmp_path, monkeypatch)
    old = tmp_path / ".copilot-home" / "signal-stories-1" / "signal-1"  # the previous build's
    old.mkdir(parents=True)
    model = world.adapter([said(GOOD), paid(500_000_000), Idle()])
    report = ai_pass.run(world.db, model, world.guard, NOW)
    model.close()
    assert (report.calls, report.written) == (1, 2)
    tag = ai_ledger.store_id(world.db)
    made = tmp_path / ".copilot-home" / f"signal-stories-{tag}-1" / f"signal-{tag}-1"
    assert world.guard.homes == [made] and made.is_dir()
    ai_call.remove_homes(world.guard)
    assert not made.parent.exists() and world.guard.homes == []
    assert old.is_dir()  # nothing Signal did not name is touched


def test_the_job_removes_its_homes_after_the_model_is_closed(tmp_path, monkeypatch):
    from deploy_workflow.signal import ai_run

    world = World(tmp_path, monkeypatch)
    model = world.adapter([said(GOOD), paid(500_000_000), Idle()])
    setup = ai_run.Setup(world.env, world.rulings, lambda c, p: model, clock_at(NOW))
    report = ai_run.story_pass(world.db, NOW, setup)
    assert report is not None and report.written == 2
    assert list((tmp_path / ".copilot-home").iterdir()) == []


@pytest.mark.parametrize("shape", ["symlink", "file", "outside"])
def test_a_home_that_is_not_the_directory_signal_named_is_left_alone(tmp_path, shape):
    homes = tmp_path / ".copilot-home" / "signal-stories-x-1"
    homes.mkdir(parents=True)
    target = tmp_path / "elsewhere"
    target.mkdir()
    (target / "keep.txt").write_text("keep", encoding="utf-8")
    home = homes / "signal-x-1"
    if shape == "symlink":
        home.symlink_to(target, target_is_directory=True)
    elif shape == "file":
        home.write_text("a file", encoding="utf-8")
    else:
        home = target / "signal-x-1"  # not under .copilot-home at all
        home.mkdir()
    guard = ai_call.Guard({}, tmp_path, clock_at(NOW), [home])
    ai_call.remove_homes(guard)
    assert (target / "keep.txt").read_text(encoding="utf-8") == "keep"
    assert home.exists() or home.is_symlink()


# Finding 17: the conftest guard (tests/conftest.py, no_live_copilot_adapter)


def test_building_the_live_adapter_without_a_fake_client_fails_the_test(
    tmp_path, monkeypatch, live_adapter_attempts
):
    from deploy_workflow.signal import ai_run

    world = World(tmp_path, monkeypatch)
    with pytest.raises(pytest.fail.Exception, match="without a fake client"):
        ai_run.live_model("copilot-luna-xhigh", world.ruling)  # the service's own factory
    with pytest.raises(pytest.fail.Exception, match="without a fake client"):
        CopilotAdapter(SPEC, world.ruling, environ=world.env, rulings_root=world.rulings)
    assert not (tmp_path / ".copilot-home").exists()
    assert [thread for _, thread in live_adapter_attempts] == ["MainThread"] * 2
    live_adapter_attempts.clear()  # provoked on purpose: the guard's teardown check passes


def test_a_job_whose_factory_builds_the_live_adapter_cannot_be_swallowed_by_the_loop(
    tmp_path, monkeypatch, live_adapter_attempts
):
    from deploy_workflow.signal import ai_run
    from deploy_workflow.signal.fetch import FetchRefused
    from deploy_workflow.signal.service import Loop

    def offline(url: str, etag: object, modified: object) -> object:
        raise FetchRefused("no network in tests")  # the ingest job never reaches the network

    world = World(tmp_path, monkeypatch)
    setup = ai_run.Setup(world.env, world.rulings, ai_run.live_model)
    loop = Loop(tmp_path / "root", fetch_fn=offline, ai=setup)  # type: ignore[arg-type]
    with pytest.raises(pytest.fail.Exception):
        loop.run_once(NOW)  # the loop's except Exception does not catch the guard

    assert len(live_adapter_attempts) == 1
    live_adapter_attempts.clear()  # provoked on purpose


# Fourth review, N13: the guard fails the test whichever thread builds the adapter, and covers
# every test module that imports the Signal package or react_frontend

_PROBE = """
import threading
from pathlib import Path

from signal_ai_fakes import write_ruling

{imports}


def test_built_on_a_background_thread(tmp_path):
    ruling = write_ruling(Path(tmp_path) / "rulings")
    from deploy_workflow.signal import ai_run

    thread = threading.Thread(target=ai_run.live_model, args=("copilot-luna-xhigh", ruling))
    thread.start()
    thread.join()  # the thread dies with Failed; the test body itself goes on and passes
"""


def _probe(tmp_path: Path, name: str, imports: str) -> tuple[int, str]:
    """Run one probe test module in its own pytest, beside a copy of this conftest (SYNTHETIC:
    the adapter is never built: the guard stops it)."""
    import os
    import shutil
    import subprocess
    import sys

    here = Path(__file__).parent
    folder = tmp_path / "probe"
    folder.mkdir()
    shutil.copy(here / "conftest.py", folder / "conftest.py")
    (folder / name).write_text(_PROBE.format(imports=imports), encoding="utf-8")
    env = {k: v for k, v in os.environ.items() if not k.startswith(("COPILOT_", "GH_"))}
    env["PYTHONPATH"] = os.pathsep.join([str(here), *sys.path])
    done = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", str(folder / name)],
        capture_output=True,
        text=True,
        env=env,
        timeout=120,
        cwd=folder,
        check=False,
    )
    return done.returncode, done.stdout + done.stderr


@pytest.mark.parametrize(
    ("name", "imports"),
    [
        ("test_signal_probe.py", ""),
        ("test_other_probe.py", "from deploy_workflow.signal import store"),
        ("test_more_probe.py", "import deploy_workflow.signal.ai_run"),
        ("test_web_probe.py", "import react_frontend"),
    ],
)
def test_an_attempt_on_a_background_thread_fails_the_test(tmp_path, name, imports):
    code, out = _probe(tmp_path, name, imports)
    assert code == 1, out
    assert "the live Copilot adapter was built without a fake client 1 time(s)" in out
    assert "Thread-" in out


def test_a_module_importing_neither_is_left_alone():
    from signal_guard import imports_guarded

    assert not imports_guarded(Path(__file__).parent / "test_handoff_loop.py")
    assert imports_guarded(Path(__file__).parent / "test_react_frontend_signal.py")
