"""CP-OS running independent modules at once: synthetic and offline, no provider is called.

Scope: the synthetic proof case (`proof/launcher.py`, canned handoffs, no model latency). These
tests show the schedule, the cap and the byte-identity of what a run retains and publishes; they
are not a measurement of a live run's time.
"""

import errno
import faulthandler
import hashlib
import json
import os
import re
import shutil
import sys
import threading
import time
import warnings
from datetime import datetime
from decimal import Decimal, localcontext
from pathlib import Path
from types import SimpleNamespace

import pytest

from deploy_vii.registry import dependencies
from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.budget import Budget, BudgetExhausted, RunStopped
from deploy_workflow.model.handoff import HandoffExecutor
from deploy_workflow.model.run_lock import RunDirBusy, _single_writer
from deploy_workflow.model.turn import Compaction, ToolCall, Turn, Usage
from deploy_workflow.owners import cpos, cpos_launch
from deploy_workflow.owners.cpos import (
    MAX_MODULE_WIDTH,
    MODULE_WIDTH,
    HandoffTask,
    ModuleHalted,
    run_handoffs,
)
from deploy_workflow.run_events import EVENTS, append_event, progress, read_events, stop_reason
from proof import DUMMY_KEY, launcher
from proof.launcher import FILING, canned_handoff

PROJECT = Path(__file__).resolve().parents[1]
RULING = PROJECT / "docs/rulings/2026-11-11-run-start-submit.md"
CONFIG = "copilot-sol-medium"
WAIT = 30  # seconds a test waits for another thread before it fails
RUN = 90  # seconds a launch with modules in flight may take before the test fails
HARD = 240  # seconds any one test may take before the whole run is ended with a stack dump


@pytest.fixture(autouse=True)
def _never_stalls(monkeypatch):
    """These tests start threads that wait for each other. A defect that leaves one waiting must
    fail here, not stall the suite or the tests after it.

    A launch is bounded by ``_bounded`` and fails its test when it has not ended. Whatever
    module threads it left waiting are then stopped here: every board made during the test is
    told that nothing more will be accepted, which wakes each thread waiting at a check or
    refuses its next call, and the test fails if a module thread is still alive after that. The
    module threads are daemon threads, so even one stuck elsewhere cannot keep the process from
    exiting. Last, after ``HARD`` seconds in one test every thread's stack is written and the
    process exits."""
    from deploy_workflow.owners import cpos

    boards = []
    made = cpos._Board.__init__

    def recorded(self, ordered, handoffs):
        made(self, ordered, handoffs)
        boards.append(self)

    monkeypatch.setattr(cpos._Board, "__init__", recorded)
    faulthandler.dump_traceback_later(HARD, exit=True)
    yield
    faulthandler.cancel_dump_traceback_later()
    for board in boards:
        board.stop_after(None)
    deadline = time.monotonic() + 10
    while _module_threads() and time.monotonic() < deadline:
        time.sleep(0.01)
    assert not _module_threads(), "module threads were left running by this test"


def _module_threads() -> list[str]:
    return [t.name for t in threading.enumerate() if t.name.startswith("cpos-module")]


def _bounded(launch, limit: float = RUN):
    """``launch()`` on a thread of its own, its result returned or its exception raised here; an
    assertion failure when it has not ended after ``limit`` seconds."""
    done: list = []

    def run() -> None:
        try:
            done.append((launch(), None))
        except BaseException as error:  # noqa: BLE001 -- raised again below, interrupts included
            done.append((None, error))

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    thread.join(limit)
    assert done, f"the launch had not ended after {limit} s"
    result, error = done[0]
    if error is not None:
        raise error
    return result


# ---------------------------------------------------------------- the synthetic case


def workspace(root: Path) -> tuple[Path, Path]:
    """The proof's context and upload under ``root``: (context file, sources folder)."""
    data = json.loads((PROJECT / "cases/context/research-minimal.json").read_text())
    data["run"].update(
        pathway="credit_snapshot", as_of="2025-04-30", cutoff="", case_kind="synthetic"
    )
    data["identity"].update(issuer_name="Example Synthetic Group", issuer_id="example")
    data["attachments"]["legal_documents"] = "none"
    drop = root / "drop"
    drop.mkdir(parents=True)
    shutil.copy(FILING, drop / FILING.name)
    context = root / "context.json"
    context.write_text(json.dumps(data))
    return context, drop


class Case:
    """The synthetic plan as a provider-free manifest, and the canned answer of each module."""

    def __init__(self, root: Path) -> None:
        context, drop = workspace(root)
        prepared = cpos_launch.prepare(
            context, drop, root / "prepared", config=CONFIG, cap="25", prior="none"
        )
        plan = json.loads(prepared.manifest.read_text())
        plan["execution"], plan["provider_cap_usd"] = "synthetic", "0"
        self.manifest = prepared.directory / "synthetic.json"
        self.manifest.write_text(json.dumps(plan))
        self.ordered = tuple(prepared.ordered)
        self.check = cpos_launch.checker(prepared.layout)
        self.case = f"{prepared.plan.run.issuer_name} as of {prepared.plan.run.as_of}."
        self.root = root

    def answer(self, task: HandoffTask) -> bytes:
        context = {
            "module_id": task.module_id,
            "sources": {n: hashlib.sha256(raw).hexdigest() for n, raw in task.sources.items()},
            "handoffs": {
                m: {"sha256": hashlib.sha256(raw).hexdigest()} for m, raw in task.handoffs.items()
            },
        }
        return canned_handoff(context, self.case, gated=True).encode()

    def run(self, name: str, execute, width: int, check=None, manifest=None, **more) -> Path:
        """One launch into ``self.root / name``. With modules in flight it is bounded
        (``_bounded``); one at a time it runs on the calling thread, as the loop does."""
        out = self.root / name

        def launch() -> Path:
            return run_handoffs(
                manifest or self.manifest,
                out,
                execute=execute,
                check=check or self.check,
                events=out,
                width=width,
                **more,
            )

        return launch() if width == 1 else _bounded(launch)

    def revised(self, name: str, *modules: str) -> Path:
        """A copy of the manifest in which each of ``modules`` has a changed instruction: the
        documented repair of a module whose request was sent and not answered."""
        plan = json.loads(self.manifest.read_text())
        for module_id in modules:
            old = self.manifest.parent / plan["instructions"][module_id]["path"]
            new = old.with_name(f"{name}-{module_id}.md")
            new.write_bytes(old.read_bytes() + b"\nState every figure with its period.\n")
            plan["instructions"][module_id] = {
                "path": str(new.relative_to(self.manifest.parent)),
                "sha256": hashlib.sha256(new.read_bytes()).hexdigest(),
            }
        manifest = self.manifest.with_name(f"{name}.json")
        manifest.write_text(json.dumps(plan))
        return manifest

    def events(self, name: str, kind: str) -> list[str]:
        found = read_events(self.root / name / EVENTS)
        return [e["module"] for e in found if e["event"] == kind]


@pytest.fixture(scope="module")
def case(tmp_path_factory) -> Case:
    return Case(tmp_path_factory.mktemp("case"))


def _until(condition, what: str) -> None:
    """Wait for ``condition`` (a state another thread reaches), failing after ``WAIT`` seconds."""
    deadline = time.monotonic() + WAIT
    while not condition():
        assert time.monotonic() < deadline, f"timed out waiting for {what}"
        time.sleep(0.005)


def _tree(root: Path) -> dict[str, str]:
    return {
        p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(root.rglob("*"))
        if p.is_file()
    }


# ---------------------------------------------------------------- the schedule


def test_two_independent_modules_are_in_flight_at_once(case, tmp_path_factory):
    """CP-1 and CP-1A each need CP-0 only. Each answer waits until the other has started: with one
    module at a time the second never starts, and the wait fails."""
    together = threading.Barrier(2, timeout=WAIT)
    threads = {}

    def execute(task: HandoffTask) -> bytes:
        threads[task.module_id] = threading.current_thread().name
        if task.module_id in ("CP-1", "CP-1A"):
            together.wait()
        return case.answer(task)

    assert case.run("overlap", execute, 2).is_file()
    assert threads["CP-1"] != threads["CP-1A"]
    assert case.events("overlap", "module_accepted") == list(case.ordered)

    alone = threading.Barrier(2, timeout=0.5)

    def serial(task: HandoffTask) -> bytes:
        if task.module_id in ("CP-1", "CP-1A"):
            alone.wait()
        return case.answer(task)

    with pytest.raises(threading.BrokenBarrierError):
        case.run("no-overlap", serial, 1)


@pytest.mark.parametrize("width", [2, MAX_MODULE_WIDTH])
def test_the_width_is_never_exceeded_and_a_module_starts_only_after_its_producers(case, width):
    lock = threading.Lock()
    flying: set[str] = set()
    most = 0
    done: list[str] = []
    seen: dict[str, set[str]] = {}

    def execute(task: HandoffTask) -> bytes:
        nonlocal most
        with lock:
            flying.add(task.module_id)
            most = max(most, len(flying))
            seen[task.module_id] = set(done)
        time.sleep(0.02)  # long enough for every free slot to be filled
        with lock:
            flying.discard(task.module_id)
            done.append(task.module_id)
        return case.answer(task)

    case.run(f"width-{width}", execute, width)
    assert 2 <= most <= width
    producers = dependencies(case.ordered)
    for module_id in case.ordered:
        assert producers[module_id] <= seen[module_id], module_id
    assert case.ordered[-1] == "CP-6" and seen["CP-6"] == set(case.ordered) - {"CP-6"}


def test_a_module_that_finishes_while_others_are_started_is_still_accepted(case, monkeypatch):
    """A module can finish between the scheduler's starts and its wait. The modules after it
    wait for it at their checks, so the scheduler must not wait for them alone: here the
    scheduler is held after it started CP-1 and CP-1A until CP-1 has finished, and CP-1A's check
    waits for CP-1."""
    from concurrent.futures import wait

    from deploy_workflow.owners import cpos

    take_off = cpos._ModuleLoop._take_off

    def held_take_off(self, board, pool, width):
        take_off(self, board, pool, width)
        if "CP-1A" in self.flights and "CP-1" not in self.selected:
            wait([self.flights["CP-1"][1]], timeout=WAIT)  # CP-1 has finished, unlanded

    monkeypatch.setattr(cpos._ModuleLoop, "_take_off", held_take_off)
    done: list[Path | Exception] = []

    def run() -> None:
        try:
            done.append(case.run("lost-finish", case.answer, 2))
        except Exception as error:  # noqa: BLE001 -- asserted below
            done.append(error)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    thread.join(60)
    assert not thread.is_alive(), "the scheduler waits for a module that waits for a finished one"
    assert isinstance(done[0], Path) and done[0].is_file(), done


def test_one_at_a_time_runs_on_the_calling_thread_in_plan_order(case):
    """Width 1 is the loop as it was: no worker thread, plan order, and each check is given
    exactly the handoffs accepted before its module."""
    calls: list[tuple[str, str]] = []
    given: dict[str, tuple[str, ...]] = {}

    def execute(task: HandoffTask) -> bytes:
        calls.append((task.module_id, threading.current_thread().name))
        assert type(task.accepted).__name__ == "mappingproxy"  # the snapshot, not a waiting view
        return case.answer(task)

    def check(task: HandoffTask, raw: bytes) -> tuple[str, ...]:
        given[task.module_id] = tuple(task.accepted)
        return case.check(task, raw)

    case.run("serial", execute, 1, check)
    here = threading.current_thread().name
    assert calls == [(m, here) for m in case.ordered]
    assert given == {m: case.ordered[:i] for i, m in enumerate(case.ordered)}


def test_a_check_reads_the_same_accepted_handoffs_whichever_module_finishes_first(case):
    """The determinism rule: with modules in flight at once, a module's check still reads every
    handoff the plan lists before it. Later modules answer first here, so each must wait."""
    given: dict[str, dict[str, str]] = {}
    lock = threading.Lock()

    def execute(task: HandoffTask) -> bytes:
        # the earlier a module is in the plan, the longer its answer takes
        time.sleep(0.01 * (len(case.ordered) - case.ordered.index(task.module_id)))
        return case.answer(task)

    def check(task: HandoffTask, raw: bytes) -> tuple[str, ...]:
        seen = {m: hashlib.sha256(v).hexdigest() for m, v in task.accepted.items()}
        with lock:
            assert given.setdefault(task.module_id, seen) == seen
        return case.check(task, raw)

    case.run("ordered-checks", execute, 2, check)
    assert {m: tuple(v) for m, v in given.items()} == {
        m: case.ordered[:i] for i, m in enumerate(case.ordered)
    }
    assert case.events("ordered-checks", "module_accepted") == list(case.ordered)


def test_serial_and_parallel_runs_retain_and_deliver_the_same_bytes(case):
    """Provider-free route: every file of the run folder is the same at width 1, 2 and the
    maximum, except the event log, whose times and order record what happened."""

    def slow_first(task: HandoffTask) -> bytes:
        time.sleep(0.01 * (len(case.ordered) - case.ordered.index(task.module_id)))
        return case.answer(task)

    trees = {}
    for width in (1, 2, MAX_MODULE_WIDTH):
        case.run(f"bytes-{width}", slow_first, width)
        trees[width] = _tree(case.root / f"bytes-{width}")
        assert any(name.startswith("deliveries/") for name in trees[width])
        del trees[width][EVENTS]
    assert trees[1] == trees[2] == trees[MAX_MODULE_WIDTH]


def test_a_module_already_halted_makes_no_further_call(case):
    """`proceed` is what the executor asks before each paid exchange: it raises for a module
    after the failed one as soon as the failure is known, not only at the module's check."""
    both = threading.Barrier(2, timeout=WAIT)
    outcome = []

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == "CP-1":
            both.wait()
            raise RuntimeError("cpos_live_stopped: CP-1")
        if task.module_id == "CP-1A":
            both.wait()
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                try:
                    task.proceed()
                except ModuleHalted as error:
                    outcome.append(str(error))
                    raise
                time.sleep(0.01)
            raise AssertionError("CP-1A was not halted after CP-1 failed")
        return case.answer(task)

    with pytest.raises(RuntimeError, match="cpos_live_stopped: CP-1"):
        case.run("halted", execute, 2)
    assert outcome == ["cpos_halted: CP-1A: a module before it in the plan was not accepted"]


def test_a_failed_module_stops_new_starts_and_the_modules_after_it(case):
    """CP-1 fails while CP-1A is in flight beside it. Nothing else starts; CP-1A, which is after
    CP-1 in the plan, is halted at its check; the failure raised is CP-1's."""
    both = threading.Barrier(2, timeout=WAIT)
    halted = []

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == "CP-1":
            both.wait()
            raise RuntimeError("cpos_live_stopped: the provider stopped CP-1")
        if task.module_id == "CP-1A":
            both.wait()
            try:
                case.check(task, case.answer(task))  # as the loop's write does: reads `accepted`
            except ModuleHalted:
                halted.append(task.module_id)
                raise
        return case.answer(task)

    with pytest.raises(RuntimeError, match="the provider stopped CP-1"):
        case.run("failed", execute, 2)
    assert halted == ["CP-1A"]
    assert case.events("failed", "module_started") == ["CP-0", "CP-1", "CP-1A"]
    assert case.events("failed", "module_accepted") == ["CP-0"]


def test_a_module_before_the_failed_one_still_finishes_and_is_accepted(case):
    """CP-1A fails first; CP-1, before it in the plan and already in flight, is accepted; then
    the run stops with CP-1A's failure and starts nothing more. A relaunch reuses the accepted
    answers without a call and stops at the module that was cut short, as a serial run does."""
    failed = threading.Event()
    calls = []

    def execute(task: HandoffTask) -> bytes:
        calls.append(task.module_id)
        if task.module_id == "CP-1A":
            failed.set()
            raise RuntimeError("cpos_live_stopped: the provider stopped CP-1A")
        if task.module_id == "CP-1":
            assert failed.wait(WAIT)
            task.proceed()  # a module before the failed one is not halted
        return case.answer(task)

    with pytest.raises(RuntimeError, match="the provider stopped CP-1A"):
        case.run("later-failed", execute, 2)
    assert case.events("later-failed", "module_accepted") == ["CP-0", "CP-1"]
    assert sorted(calls) == ["CP-0", "CP-1", "CP-1A"]

    calls.clear()
    with pytest.raises(ValueError, match="cpos_interrupted: response not retained for CP-1A"):
        case.run("later-failed", execute, 2)
    assert calls == []  # CP-0 and CP-1 were reused; CP-DR was not started after the stop


def _the_scheduler_took_the_stop(monkeypatch) -> threading.Event:
    """Set once the scheduler has taken in a failure (an observer's stop is one)."""
    from deploy_workflow.owners import cpos

    land = cpos._ModuleLoop._land
    taken = threading.Event()

    def watched_land(self, board):
        land(self, board)
        if self.failures:
            taken.set()

    monkeypatch.setattr(cpos._ModuleLoop, "_land", watched_land)
    return taken


@pytest.mark.parametrize("width", [1, 2])
def test_a_run_an_observer_stopped_is_resumable(case, monkeypatch, width):
    """`run_handoffs`: the observer "may stop for evidence review; resume rechecks the bytes".
    The observer stops the run when CP-1 is accepted. At width 2 CP-1A has a call out then: it
    is not cut off from it, the answer that call brings is accepted and retained, nothing is
    announced or started after the stop, and the relaunch reuses all three answers and delivers,
    as it does one at a time."""
    stopped = _the_scheduler_took_the_stop(monkeypatch)
    calls = []

    def execute(task: HandoffTask) -> bytes:
        calls.append(task.module_id)
        if task.module_id == "CP-1A" and width > 1 and calls.count("CP-1A") == 1:
            assert stopped.wait(WAIT)  # its call is still out after the run was stopped
        return case.answer(task)

    def stop_at_cp1(task: HandoffTask, raw: bytes) -> None:
        if task.module_id == "CP-1":
            raise RuntimeError("evidence review")

    name = f"observer-{width}"
    with pytest.raises(RuntimeError, match="evidence review"):
        case.run(name, execute, width, on_handoff=stop_at_cp1)
    assert case.events(name, "module_accepted") == ["CP-0", "CP-1"]
    started = ["CP-0", "CP-1"] if width == 1 else ["CP-0", "CP-1", "CP-1A"]
    assert case.events(name, "module_started") == started and sorted(calls) == started

    calls.clear()
    assert case.run(name, execute, width).is_file()
    assert set(calls) == set(case.ordered) - set(started)  # each started module's answer reused
    assert case.events(name, "module_accepted")[2:] == list(case.ordered)


def _held_until_the_scheduler_saw(monkeypatch, failed_module: str) -> threading.Event:
    """Set once the scheduler has run a round of starts with ``failed_module``'s failed call
    already finished: what it would start beside a known failure, it has started by then."""
    from deploy_workflow.owners import cpos

    take_off = cpos._ModuleLoop._take_off
    seen = threading.Event()

    def watched(self, board, pool, width):
        known = failed_module in self.flights and self.flights[failed_module][1].done()
        take_off(self, board, pool, width)
        if known:
            seen.set()

    monkeypatch.setattr(cpos._ModuleLoop, "_take_off", watched)
    return seen


def test_nothing_starts_once_a_module_in_flight_has_failed(case, monkeypatch):
    """CP-2A and CP-2E are in flight; CP-2E, the later one, fails while CP-2A is still running.
    The failure is acted on then, not when CP-2A is accepted: CP-2D, next in the plan with its
    producers accepted and a slot free, is never started, so width 2 starts (and pays for)
    exactly the modules width 1 does in the same failure."""

    def started(width: int) -> list[str]:
        seen = _held_until_the_scheduler_saw(monkeypatch, "CP-2E")
        calls = []

        def execute(task: HandoffTask) -> bytes:
            calls.append(task.module_id)
            if task.module_id == "CP-2E":
                raise RuntimeError("cpos_live_stopped: the provider refused CP-2E")
            if task.module_id == "CP-2A" and width > 1:
                assert seen.wait(WAIT)  # still in flight after the failure
            return case.answer(task)

        name = f"known-failure-{width}"
        with pytest.raises(RuntimeError, match="the provider refused CP-2E"):
            case.run(name, execute, width)
        monkeypatch.undo()
        assert sorted(calls) == sorted(case.events(name, "module_started"))
        assert case.events(name, "module_accepted")[-1] == "CP-2A"
        return case.events(name, "module_started")

    one, two = started(1), started(2)
    assert two == one
    assert one[-2:] == ["CP-2A", "CP-2E"] and "CP-2D" not in two


def test_a_failure_of_the_later_module_is_raised_when_the_earlier_one_is_accepted(case):
    """CP-1A fails; CP-1 then finishes and is accepted. The failure found while CP-1 was still in
    flight is the one raised, with nothing else started."""
    failed = threading.Event()

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == "CP-1A":
            failed.set()
            raise ValueError("cpos_module_failed: CP-1A: the checker refused it")
        if task.module_id == "CP-1":
            assert failed.wait(WAIT)
        return case.answer(task)

    with pytest.raises(ValueError, match="cpos_module_failed: CP-1A") as raised:
        case.run("late-failure", execute, 2)
    assert stop_reason(raised.value) == "checker"
    assert case.events("late-failure", "module_started") == ["CP-0", "CP-1", "CP-1A"]


def test_an_interrupt_halts_the_modules_in_flight_and_waits_for_their_threads(case):
    """The scheduling thread is interrupted (here at CP-1's acceptance) while CP-1A is in
    flight. CP-1A makes no further call, and the interrupt propagates only when CP-1A's thread
    has ended: no module thread is left running behind it."""
    outcome = []

    def execute(task: HandoffTask) -> bytes:
        if task.module_id != "CP-1A":
            return case.answer(task)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            try:
                task.proceed()  # what the executor asks before each paid exchange
            except ModuleHalted as error:
                outcome.append(str(error))
                raise
            time.sleep(0.005)
        outcome.append("went on")
        return case.answer(task)

    def interrupt(task: HandoffTask, raw: bytes) -> None:
        if task.module_id == "CP-1":
            raise KeyboardInterrupt

    with pytest.raises(KeyboardInterrupt):
        case.run("interrupted", execute, 2, on_handoff=interrupt)
    # already there: the launch waited for the thread. No module failed, and it is not told so.
    assert outcome == ["cpos_halted: CP-1A: the launch was stopped before its next call"]
    assert not _module_threads()


def test_a_halt_names_an_earlier_modules_failure_only_where_there_is_one():
    """The launch-wide stop (an interrupt, or the end of a launch) halts every module. A module
    after one that failed or was not accepted is told that; any other is told the launch was
    stopped."""
    from deploy_workflow.owners.cpos import _Board

    def halt(board: _Board, module_id: str) -> str:
        with pytest.raises(ModuleHalted) as raised:
            board.proceed(module_id)
        return str(raised.value)

    not_accepted = "cpos_halted: {}: a module before it in the plan was not accepted"
    stopped = "cpos_halted: {}: the launch was stopped before its next call"
    ordered = ("CP-0", "CP-1", "CP-1A", "CP-2A")
    board = _Board(ordered, {})
    board.stop_after(None)
    assert [halt(board, m) for m in ordered] == [stopped.format(m) for m in ordered]
    for fail in (
        lambda board: board.report("CP-1", RuntimeError("cpos_live_stopped: CP-1")),
        lambda board: board.stop_after("CP-1"),
    ):
        for stop_first in (False, True):
            board = _Board(ordered, {})
            if stop_first:
                board.stop_after(None)
            fail(board)
            if not stop_first:
                board.proceed("CP-0")
                board.proceed("CP-1")
                assert halt(board, "CP-1A") == not_accepted.format("CP-1A")
                board.stop_after(None)
            assert halt(board, "CP-0") == stopped.format("CP-0")
            assert halt(board, "CP-1") == stopped.format("CP-1")
            assert halt(board, "CP-1A") == not_accepted.format("CP-1A")
            assert halt(board, "CP-2A") == not_accepted.format("CP-2A")
            with pytest.raises(ModuleHalted, match="CP-2A: a module before it"):
                board.before("CP-2A")


@pytest.mark.parametrize("native_started", [False, True], ids=["before-launch", "during-bootstrap"])
def test_a_startup_interrupt_joins_the_workers_that_started(case, monkeypatch, native_started):
    interrupt = KeyboardInterrupt("module startup interrupted")
    bootstrap_waiting = threading.Event()
    release_bootstrap = threading.Event()
    bootstrap_ended = threading.Event()
    join_entered = threading.Event()
    start_thread = threading.Thread.start
    start_native = threading._start_joinable_thread

    def start(thread):
        if not native_started and thread.name == "cpos-module-CP-0":
            raise interrupt
        start_thread(thread)

    def start_with_paused_bootstrap(function, *, handle, daemon):
        if function.__self__.name != "cpos-module-CP-0":
            return start_native(function, handle=handle, daemon=daemon)

        def bootstrap():
            bootstrap_waiting.set()
            assert release_bootstrap.wait(WAIT)
            function()
            bootstrap_ended.set()

        class ObservedHandle:
            def __getattr__(self, name):
                return getattr(handle, name)

            def join(self):
                join_entered.set()
                release_bootstrap.set()
                handle.join()

        start_native(bootstrap, handle=handle, daemon=daemon)
        assert bootstrap_waiting.wait(WAIT)
        # Keep bootstrap parked until scheduler cleanup reaches the real native join.
        function.__self__._handle = ObservedHandle()
        raise interrupt

    monkeypatch.setattr(threading.Thread, "start", start)
    monkeypatch.setattr(threading, "_start_joinable_thread", start_with_paused_bootstrap)
    try:
        with pytest.raises(KeyboardInterrupt) as raised:
            case.run(f"startup-interrupt-{native_started}", case.answer, 2)
        assert raised.value is interrupt
        assert join_entered.is_set() is native_started
        assert bootstrap_ended.is_set() is native_started
    finally:
        release_bootstrap.set()


INTERRUPTED_CHILD = """
import sys, threading, time
from pathlib import Path
sys.path.insert(0, "tests")
from test_cpos_parallel import Case
from deploy_workflow.owners.cpos import ModuleHalted, run_handoffs

case = Case(Path(sys.argv[1]))

def execute(task):
    if task.module_id != "CP-1A":
        return case.answer(task)
    while True:  # in flight when the launch is interrupted
        try:
            task.proceed()
        except ModuleHalted:
            break
        time.sleep(0.005)
    time.sleep(0.3)  # the launching thread has left, if it does not wait for this one
    import dataclasses  # as a module's thread goes on: a lazy import that defines a dataclass
    dataclasses.make_dataclass("Late", ["field"])
    raise ModuleHalted("halted")

def interrupt(task, raw):
    if task.module_id == "CP-1":
        raise KeyboardInterrupt

out = case.root / "run"
run_handoffs(case.manifest, out, execute=execute, check=case.check, on_handoff=interrupt,
             events=out, width=2)
"""


TWICE_INTERRUPTED_CHILD = """
import sys, time
from pathlib import Path
sys.path.insert(0, "tests")
from test_cpos_parallel import Case
from deploy_workflow.owners.cpos import ModuleHalted, run_handoffs

case = Case(Path(sys.argv[1]))

def execute(task):
    if task.module_id not in ("CP-1", "CP-1A"):
        return case.answer(task)
    print("INFLIGHT", flush=True)
    while True:  # until the first interrupt halts the modules in flight
        try:
            task.proceed()
        except ModuleHalted:
            break
        time.sleep(0.005)
    if task.module_id == "CP-1A":
        print("HALTED", flush=True)
        time.sleep(300)  # a call that stays out: the launch is waiting for this thread
    raise ModuleHalted("halted")

out = case.root / "run"
run_handoffs(case.manifest, out, execute=execute, check=case.check, events=out, width=2)
"""


@pytest.mark.skipif(sys.platform == "win32", reason="signals and their exit status are POSIX's")
def test_a_second_interrupt_exits_without_waiting_for_the_calls_still_out(tmp_path):
    """The first interrupt halts the modules in flight and waits for the call one of them still
    has out. The second ends the wait: the process exits at once, as an interrupted process, and
    leaves that call behind (its thread is a daemon thread)."""
    import os
    import signal
    import subprocess

    env = dict(os.environ, PYTHONPATH=os.pathsep.join(("src", "apps/issuer-library", ".")))
    child = subprocess.Popen(
        [sys.executable, "-B", "-c", TWICE_INTERRUPTED_CHILD, str(tmp_path / "case")],
        cwd=PROJECT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        assert [child.stdout.readline().strip() for _ in range(2)] == ["INFLIGHT", "INFLIGHT"]
        child.send_signal(signal.SIGINT)
        assert child.stdout.readline().strip() == "HALTED"  # the first interrupt was taken
        with pytest.raises(subprocess.TimeoutExpired):
            child.wait(1)  # and the launch waits for the call still out
        child.send_signal(signal.SIGINT)
        assert child.wait(20) == -signal.SIGINT
        assert "KeyboardInterrupt" in child.stderr.read()
    finally:
        child.kill()
        child.wait()


@pytest.mark.skipif(sys.platform == "win32", reason="the exit status of an interrupt is POSIX's")
def test_an_interrupted_launch_exits_with_the_interrupts_status(tmp_path):
    """A process whose launch is interrupted with a module in flight ends as an interrupted
    process does (killed by SIGINT), every time. When the interrupt left a module's thread
    running, code that thread compiled and ran during interpreter shutdown (a dataclass being
    defined does) turned the exit status into 1."""
    import os
    import signal
    import subprocess

    env = dict(os.environ, PYTHONPATH=os.pathsep.join(("src", "apps/issuer-library", ".")))
    child = subprocess.run(
        [sys.executable, "-B", "-c", INTERRUPTED_CHILD, str(tmp_path / "case")],
        cwd=PROJECT,
        env=env,
        capture_output=True,
        text=True,
        timeout=RUN,
        check=False,
    )
    assert "KeyboardInterrupt" in child.stderr
    assert child.returncode == -signal.SIGINT, child.stderr[-2000:]


def test_a_plan_with_retained_handoffs_runs_one_at_a_time_whatever_width_is_asked(case):
    """A retained module is refused before any call once an accepted module contradicts its pin;
    that order holds only one at a time, so such a plan is not run in parallel."""
    from deploy_workflow.owners.cpos import HandoffPlan, RetainedHandoff

    done = case.root / "to-retain"
    case.run("to-retain", case.answer, 1)
    pins = {}
    for record in sorted((done / "requests").glob("*/*/1.request.json")):
        asked = json.loads(record.read_text())
        response = (record.parent / "1.response.md").read_bytes()
        kept = case.manifest.parent / "retained" / f"{asked['module_id']}.md"
        kept.parent.mkdir(exist_ok=True)
        kept.write_bytes(response)
        pins[asked["module_id"]] = RetainedHandoff(
            path=f"retained/{kept.name}",
            sha256=hashlib.sha256(response).hexdigest(),
            source_hashes=asked["sources"],
            upstream=asked["handoffs"],
        )
    plan = HandoffPlan.model_validate_json(case.manifest.read_bytes())
    manifest = case.manifest.with_name("retained.json")
    manifest.write_text(plan.model_copy(update={"retained_handoffs": pins}).model_dump_json())
    threads = set()

    def check(task: HandoffTask, raw: bytes) -> tuple[str, ...]:
        threads.add(threading.current_thread().name)
        return case.check(task, raw)

    out = case.root / "retained-run"
    receipt = case.run(
        "retained-run",
        lambda task: pytest.fail("a retained answer was asked for again"),
        2,
        check,
        manifest,
    )
    assert receipt.is_file()
    assert len(threads) == 1 and not any(t.startswith("cpos-module") for t in threads)
    assert read_events(out / EVENTS)[0]["modules_at_once"] == 1


def test_cp8_runs_last_and_alone_at_width_two(tmp_path):
    """A lite run with an earlier lite run listed plans CP-8 last. At width 2 CP-1 and CP-1A are
    in flight together, and CP-8 starts only when every other module is accepted, with nothing
    else in flight, and is delivered. Synthetic answers: this proves the wiring, not analysis."""
    from library_fixtures import make_run
    from test_changes import PRIOR_TABLES, cp8_answer
    from test_cpos_launch import LITE_MODULES, answer, context_file, issuer_folder

    root = tmp_path / "ws"
    make_run(
        root,
        "prior-1",
        as_of="2024-12-31",
        pathway="lite_credit_assessment",
        cp1_extra=PRIOR_TABLES,
    )
    prepared = cpos_launch.prepare(
        context_file(tmp_path, "lite_credit_assessment"),
        issuer_folder(tmp_path),
        root / "runs/cur",
        config="sol-medium",
        cap="15",
    )
    assert prepared.ordered == (*LITE_MODULES, "CP-8")
    plan = json.loads(prepared.manifest.read_text())
    plan["execution"], plan["provider_cap_usd"] = "synthetic", "0"
    manifest = prepared.directory / "synthetic.json"
    manifest.write_text(json.dumps(plan))
    routes = list(prepared.plan.layout.routes)
    out = tmp_path / "out"
    together = threading.Barrier(2, timeout=WAIT)
    lock = threading.Lock()
    flying: set[str] = set()
    at_cp8 = {}

    def execute(task: HandoffTask) -> bytes:
        with lock:
            flying.add(task.module_id)
        if task.module_id in ("CP-1", "CP-1A"):
            together.wait()
        if task.module_id == "CP-8":
            accepted = [
                e["module"] for e in read_events(out / EVENTS) if e["event"] == "module_accepted"
            ]
            at_cp8.update(flying=set(flying), accepted=accepted)
        context = {
            "module_id": task.module_id,
            "sources": {n: hashlib.sha256(raw).hexdigest() for n, raw in task.sources.items()},
            "handoffs": {
                m: {"sha256": hashlib.sha256(raw).hexdigest(), "markdown": raw.decode()}
                for m, raw in task.handoffs.items()
            },
        }
        text = cp8_answer(context) if task.module_id == "CP-8" else answer(context, routes)
        with lock:
            flying.discard(task.module_id)
        return text.encode()

    receipt = _bounded(
        lambda: run_handoffs(
            manifest,
            out,
            execute=execute,
            check=cpos_launch.checker(prepared.layout),
            events=out,
            width=2,
        )
    )
    assert at_cp8 == {"flying": {"CP-8"}, "accepted": list(LITE_MODULES)}
    assert (receipt.parent / "CP-8.md").is_file() and (receipt.parent / "changes.json").is_file()
    names = [(e["event"], e.get("module")) for e in read_events(out / EVENTS)]
    assert [m for e, m in names if e == "module_accepted"] == [*LITE_MODULES, "CP-8"]
    assert names[0] == ("launch_started", None) and "changes_not_produced" not in dict(names)


def test_a_width_outside_the_bound_is_refused(case):
    for width in (0, MAX_MODULE_WIDTH + 1):
        with pytest.raises(ValueError, match="cpos_width"):
            case.run("refused", case.answer, width)
    assert not (case.root / "refused").exists()


# ---------------------------------------------------------------- the event log


S, A, LAUNCH = "module_started", "module_accepted", ("launch_started", None)


def _log(*pairs: tuple[str, str | None]) -> list[dict[str, str]]:
    return [{"event": event, **({"module": module} if module else {})} for event, module in pairs]


def test_progress_reads_two_running_modules():
    started = (LAUNCH, (S, "CP-0"), (A, "CP-0"), (S, "CP-1"), (S, "CP-1A"))
    assert dict(progress(_log(*started)).modules) == {
        "CP-0": "done",
        "CP-1": "running",
        "CP-1A": "running",
    }
    assert dict(progress(_log(*started, (A, "CP-1A"))).modules) == {
        "CP-0": "done",
        "CP-1": "running",
        "CP-1A": "done",
    }
    stopped = progress([*_log(*started), {"event": "stopped", "reason": "provider"}])
    assert dict(stopped.modules) == {"CP-0": "done", "CP-1": "stopped", "CP-1A": "stopped"}
    assert stopped.stop == "provider"


def test_what_a_killed_launch_left_running_ends_at_the_next_launch_not_at_a_repeated_module():
    """A killed launch writes no `stopped`. The relaunch's `launch_started` ends the two modules
    it left running; the relaunch then starts modules the log already has, CP-1 and CP-1A both
    in flight, and neither start ends the other."""
    killed = (LAUNCH, (S, "CP-0"), (A, "CP-0"), (S, "CP-1"), (S, "CP-1A"))
    assert dict(progress(_log(*killed, LAUNCH)).modules) == {
        "CP-0": "done",
        "CP-1": "stopped",
        "CP-1A": "stopped",
    }
    relaunched = _log(*killed, LAUNCH, (S, "CP-0"), (A, "CP-0"), (S, "CP-1"), (S, "CP-1A"))
    assert dict(progress(relaunched).modules) == {
        "CP-0": "done",
        "CP-1": "running",
        "CP-1A": "running",
    }
    killed_in_delivery = [*_log(LAUNCH, (S, "CP-0"), (A, "CP-0")), {"event": "delivery_started"}]
    assert progress(killed_in_delivery).report == "running"
    assert progress([*killed_in_delivery, *_log(LAUNCH)]).report == "stopped"


def test_a_log_written_before_launches_were_recorded_reads_as_it_always_did():
    """No `launch_started`: the one-at-a-time loop wrote the log, and every start ends the module
    running before it (a launch killed mid-module and relaunched; CP-8 not produced)."""
    assert dict(progress(_log((S, "CP-0"), (A, "CP-0"), (S, "CP-1"), (S, "CP-0"))).modules) == {
        "CP-0": "running",
        "CP-1": "stopped",
    }
    assert dict(progress(_log((S, "CP-0"), (S, "CP-1"))).modules) == {
        "CP-0": "stopped",
        "CP-1": "running",
    }
    # an old log continued by a launch that records itself: the old rule up to it, the new after
    mixed = _log((S, "CP-0"), (A, "CP-0"), (S, "CP-1"), LAUNCH, (S, "CP-0"), (A, "CP-0"))
    mixed += _log((S, "CP-1"), (S, "CP-1A"))
    assert dict(progress(mixed).modules) == {"CP-0": "done", "CP-1": "running", "CP-1A": "running"}


def test_each_launch_records_its_start_and_a_relaunch_at_width_two_shows_both_modules_running(case):
    """End to end on the log `run_handoffs` writes: an earlier launch was killed with CP-1 and
    CP-1A running. While both are in flight again in the relaunch at width 2, the activity page's
    reading shows both running (it showed CP-1 stopped when a repeated start ended the others)."""
    from deploy_workflow.inbox.activity import module_states

    out = case.root / "relaunched"
    for event, module in ((S, "CP-0"), (A, "CP-0"), (S, "CP-1"), (S, "CP-1A")):
        append_event(out, event, module=module)  # the killed launch: no `stopped`
    together = threading.Barrier(2, timeout=WAIT)
    read = {}

    def execute(task: HandoffTask) -> bytes:
        if task.module_id in ("CP-1", "CP-1A"):
            together.wait()
            states = dict(module_states("credit_snapshot", read_events(out / EVENTS)))
            read[task.module_id] = (states["CP-0"], states["CP-1"], states["CP-1A"])
        return case.answer(task)

    assert case.run("relaunched", execute, 2).is_file()
    assert read == {m: ("done", "running", "running") for m in ("CP-1", "CP-1A")}
    events = read_events(out / EVENTS)
    assert events[4] == {"at": events[4]["at"], "event": "launch_started", "modules_at_once": 2}
    assert [e["event"] for e in events].count("launch_started") == 1
    final = dict(module_states("credit_snapshot", events))
    assert set(final.values()) == {"done"}


def test_a_failed_event_write_does_not_cut_another_threads_line(tmp_path, monkeypatch):
    """Two modules in flight both write events. A write that fails is cut back to the size the
    file had before it; another thread's line appended meanwhile must not be cut with it. Here
    thread A's write is held at its sync until thread B has either reached the append lock or
    finished its append, and then fails."""
    from deploy_workflow import run_events

    append_event(tmp_path, "first")
    lock = run_events._APPENDING
    progressed = threading.Event()
    first = threading.current_thread()

    class Watched:
        def __enter__(self):
            if threading.current_thread() is not first:
                progressed.set()  # B is at the lock, behind A
            return lock.__enter__()

        def __exit__(self, *exc):
            return lock.__exit__(*exc)

    def second() -> None:
        append_event(tmp_path, "second")
        progressed.set()  # B finished: nothing held it

    other = threading.Thread(target=second, daemon=True)
    sync = run_events.os.fsync

    def failing_sync(fd: int) -> None:
        if threading.current_thread() is not first:
            return sync(fd)
        other.start()
        assert progressed.wait(WAIT)
        raise OSError("disk full")

    monkeypatch.setattr(run_events, "_APPENDING", Watched())
    monkeypatch.setattr(run_events.os, "fsync", failing_sync)
    with pytest.warns(RuntimeWarning, match="run event not recorded: lost"):
        append_event(tmp_path, "lost")
    other.join(WAIT)
    assert [e["event"] for e in read_events(tmp_path / EVENTS)] == ["first", "second"]


def test_the_activity_page_states_show_both_running_modules():
    from deploy_workflow.inbox.activity import module_states

    events = _log(LAUNCH, (S, "CP-0"), (A, "CP-0"), (S, "CP-1"), (S, "CP-1A"))
    states = dict(module_states("credit_snapshot", events))
    assert (states["CP-0"], states["CP-1"], states["CP-1A"]) == ("done", "running", "running")
    assert states["CP-DR"] == "waiting" and states["Report"] == "waiting"


# ---------------------------------------------------------------- the cap


def _committed(budget: Budget) -> Decimal:
    with budget._lock:  # one consistent reading of spend plus open holds
        return budget._reserved() + budget._spent()


def _in_thread(function) -> tuple[threading.Thread, list]:
    result: list = []

    def run() -> None:
        try:
            result.append(function())
        except Exception as error:  # noqa: BLE001 -- the caller asserts on it
            result.append(error)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread, result


def _waiting(budget: Budget) -> threading.Event:
    """Set when a reserve on ``budget`` starts to wait for another thread's hold. The reserve
    holds the budget's lock until it waits, so whoever sees the event and then settles or
    releases does so after the wait began."""
    began = threading.Event()
    wait = budget._changed.wait

    def waiting(timeout: float | None = None) -> bool:
        began.set()
        return wait(timeout)

    budget._changed.wait = waiting
    return began


@pytest.fixture
def no_owner_check(monkeypatch):
    """A waiting reserve is woken only by being told (a settlement, a release, `abandon`, a
    stop), not by its periodic look at whether the other thread is alive."""
    from deploy_workflow.model import budget as budget_module

    monkeypatch.setattr(budget_module, "_OWNER_CHECK_S", 600.0)


def test_a_reserve_blocked_only_by_another_modules_hold_waits_for_its_settlement(
    tmp_path, no_owner_check
):
    budget = Budget(Decimal(10), tmp_path)
    budget.reserve("first", Decimal(6), config_id=CONFIG)
    waiting = _waiting(budget)
    thread, result = _in_thread(lambda: budget.reserve("second", Decimal(6), config_id=CONFIG))
    assert waiting.wait(WAIT) and not result  # waiting: neither refused nor held
    assert budget.reserved == Decimal(6)
    assert not (tmp_path / "owner-run-audit/reservations/second").exists()
    budget.settle("first", Decimal(1))
    thread.join(10)
    assert result == [None], "the settlement did not wake the waiting reserve"
    assert (budget.spent, budget.reserved) == (Decimal(1), Decimal(6))


def test_spend_plus_holds_never_passes_the_cap_under_concurrent_reserves(tmp_path):
    """Eight threads each make 25 calls that hold 4 and settle at 0.01 against a cap of 10: at
    most two holds fit at once, so the others wait for a settlement, and none is refused."""
    budget = Budget(Decimal(10), tmp_path)
    worst = Decimal(0)
    errors = []

    def calls(thread: int) -> None:
        nonlocal worst
        try:
            for index in range(25):
                call_id = f"call-{thread}-{index}"
                budget.reserve(call_id, Decimal(4), config_id=CONFIG)
                worst = max(worst, _committed(budget))
                budget.settle(call_id, Decimal("0.01"))
        except Exception as error:  # noqa: BLE001 -- reported below
            errors.append(error)

    threads = [threading.Thread(target=calls, args=(n,), daemon=True) for n in range(8)]
    for thread in threads:
        thread.start()
    deadline = time.monotonic() + WAIT
    for thread in threads:
        thread.join(max(0, deadline - time.monotonic()))
    assert not errors and not any(thread.is_alive() for thread in threads)
    assert Decimal(4) <= worst <= Decimal(10)
    assert budget.spent == Decimal(2) and budget.reserved == 0
    markers = sorted(p.name for p in (tmp_path / "owner-run-audit/reservations").iterdir())
    assert len(markers) == 400  # every reservation and settlement journaled once
    assert json.loads((tmp_path / "owner-run-audit/reservations/call-0-0").read_text()) == {
        "config_id": CONFIG,
        "retry_of": None,
        "usd": "4",
    }


def test_a_reserve_that_passes_the_cap_on_settled_spend_is_refused_at_once(tmp_path):
    """Spend 5 is settled and another thread holds 4. A hold of 6 would pass the cap of 10 even
    with that hold gone, so it is refused as it always was, without waiting."""
    budget = Budget(Decimal(10), tmp_path)
    budget.reserve("spent", Decimal(5), config_id=CONFIG)
    budget.settle("spent", Decimal(5))
    budget.reserve("open", Decimal(4), config_id=CONFIG)
    thread, result = _in_thread(lambda: budget.reserve("late", Decimal(6), config_id=CONFIG))
    thread.join(WAIT)
    assert not thread.is_alive()
    assert isinstance(result[0], BudgetExhausted) and "passes the cap" in str(result[0])
    assert budget.unsettled == ("open",)


def test_a_thread_never_waits_for_its_own_hold(tmp_path):
    budget = Budget(Decimal(10), tmp_path)
    budget.reserve("mine", Decimal(6), config_id=CONFIG)
    with pytest.raises(BudgetExhausted):
        budget.reserve("mine-too", Decimal(6), config_id=CONFIG)


@pytest.mark.parametrize("ending", ["unknown", "abandoned", "overrun", "marker fault"])
def test_a_waiting_reserve_stops_when_the_hold_it_waits_for_stops_the_run(
    tmp_path, monkeypatch, no_owner_check, ending
):
    from deploy_workflow.model import budget as budget_module

    budget = Budget(Decimal(10), tmp_path)
    budget.reserve("first", Decimal(6), config_id=CONFIG)
    waiting = _waiting(budget)
    thread, result = _in_thread(lambda: budget.reserve("second", Decimal(6), config_id=CONFIG))
    assert waiting.wait(WAIT)
    if ending == "unknown":
        budget.settle("first", None)
    elif ending == "abandoned":
        budget.abandon()  # this thread's module ended without settling its hold
    elif ending == "overrun":
        with pytest.raises(RunStopped):
            budget.settle("first", Decimal(7))
    else:  # the settlement's marker cannot be written: the budget's state is unknown, it stops

        def no_write(path: Path, payload: dict[str, object]) -> None:
            raise OSError("disk full")

        monkeypatch.setattr(budget_module, "_write_once", no_write)
        with pytest.raises(OSError, match="disk full"):
            budget.settle("first", Decimal(1))
    thread.join(5)
    assert not thread.is_alive(), "the waiting reserve was not told the run stopped"
    assert isinstance(result[0], RunStopped) and not isinstance(result[0], BudgetExhausted)
    assert not (tmp_path / "owner-run-audit/reservations/second").exists()
    if ending == "abandoned":
        assert budget.stop_kind == "crash_left"
        assert Budget(Decimal(10), tmp_path).stop_kind == "crash_left"  # as a reload reads it
    if ending == "marker fault":
        assert "a marker write failed" in str(result[0])


def test_a_reserve_never_waits_for_a_hold_whose_thread_has_ended(tmp_path, monkeypatch):
    """A thread that reserved and ended without settling or `abandon` (the executor always
    abandons; this is anything else) will never settle its hold. The hold is left as a crash
    leaves one: a later reserve stops with the run at once, and one already waiting stops at its
    next look, instead of waiting for ever."""
    from deploy_workflow.model import budget as budget_module

    monkeypatch.setattr(budget_module, "_OWNER_CHECK_S", 0.05)
    budget = Budget(Decimal(10), tmp_path)
    gone = threading.Thread(target=lambda: budget.reserve("gone", Decimal(6), config_id=CONFIG))
    gone.start()
    gone.join(WAIT)
    thread, result = _in_thread(lambda: budget.reserve("after", Decimal(6), config_id=CONFIG))
    thread.join(10)
    assert not thread.is_alive(), "the reserve waits for a dead thread's hold"
    assert isinstance(result[0], RunStopped) and "left unsettled by a crash" in str(result[0])
    assert budget.stop_kind == "crash_left" and budget.unsettled == ("gone",)

    budget = Budget(Decimal(10), tmp_path / "second")
    leave = threading.Event()

    def holds_then_ends() -> None:
        budget.reserve("held", Decimal(6), config_id=CONFIG)
        assert leave.wait(WAIT)

    owner = threading.Thread(target=holds_then_ends, daemon=True)
    owner.start()
    _until(lambda: budget.unsettled == ("held",), "the first hold")
    waiting = _waiting(budget)
    thread, result = _in_thread(lambda: budget.reserve("waiter", Decimal(6), config_id=CONFIG))
    assert waiting.wait(WAIT)
    leave.set()  # the owner ends; nobody settles, releases or abandons its hold
    thread.join(10)
    assert not thread.is_alive(), "the reserve still waits for a dead thread's hold"
    assert isinstance(result[0], RunStopped) and "left unsettled by a crash" in str(result[0])
    assert not (tmp_path / "second/owner-run-audit/reservations/waiter").exists()


# ---------------------------------------------------------------- the executor


GOOD = (
    b"## Request\nx\n## Sources\nx\n## Findings\nx\n## Calculations\nx\n## Gaps\nx\n"
    b"## Next module\nx\n"
)


def _task(module_id: str, proceed=None) -> HandoffTask:
    from datetime import date

    from deploy_vii.contracts import Run

    run = Run(
        run_id="parallel-test",
        issuer_id="TDG",
        issuer_name="TransDigm Group Incorporated",
        as_of=date(2024, 9, 30),
        case_kind="synthetic",
        pathway="credit_snapshot",
        requested_modules=("CP-1", "CP-1A"),
    )
    extra = {} if proceed is None else {"proceed": proceed}
    return HandoffTask(run, module_id, b"Write.", {"S1.txt": b"Revenue 100"}, {}, 1, (), **extra)


def _reply(compactions=()) -> AdapterReply:
    usage = Usage(input_tokens=100, output_tokens=50)
    call = ToolCall("w", "write_handoff", {"markdown": GOOD.decode()})
    turn = Turn("", (call,), usage, "tool_use", "gpt-6.1-sol", "test", 200)
    return AdapterReply("ok", turn, None, 200, None, None, 1, 2, usage, compactions=compactions)


class TogetherAdapter:
    """Each module's call waits until both modules are inside a call, holding their reservations."""

    config_id = "sol-medium"
    ruling = None

    def __init__(self, compacted: str) -> None:
        self.together = threading.Barrier(2, timeout=WAIT)
        self.compacted = compacted
        self.digests: dict[str, str] = {}

    def complete(self, request, *, invocation_digest, **_identity):
        module_id = json.loads(request.messages[1].text)["module_id"]
        self.digests[module_id] = invocation_digest
        self.together.wait()
        found = (
            (Compaction("complete", "attempt-1", 9, 4, 20, True, usd=Decimal(0)),)
            if module_id == self.compacted
            else ()
        )
        return _reply(found)


def test_two_module_runs_share_one_executor_one_lock_and_one_budget(tmp_path):
    """Both calls are in flight at once through one executor: neither is refused as a second
    writer, both holds are in the one budget, each run's compaction flag is its own thread's, and
    a second process is still excluded while they run."""
    adapter = TogetherAdapter(compacted="CP-1A")
    executor = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(20), check=lambda task, raw: ()
    )
    budgets, flags, busy = [], {}, []
    wait = adapter.together.wait

    def both_inside() -> None:
        wait()
        budgets.append((executor.budget, executor.budget.reserved))
        try:
            with _single_writer(tmp_path):
                busy.append(False)
        except RunDirBusy:
            busy.append(True)

    adapter.together.wait = both_inside

    def run(module_id: str) -> bytes:
        raw = executor(_task(module_id))
        flags[module_id] = executor.written_after_compaction
        return raw

    first, one = _in_thread(lambda: run("CP-1"))
    second, two = _in_thread(lambda: run("CP-1A"))
    first.join(WAIT)
    second.join(WAIT)
    assert one == [GOOD] and two == [GOOD]
    assert busy == [True, True]
    (budget_a, held_a), (budget_b, held_b) = budgets
    assert budget_a is budget_b is executor.budget
    hold = Decimal(executor.log.records()[0]["reserved_usd"])
    assert max(held_a, held_b) == 2 * hold  # both holds open at once, in the one budget
    assert flags["CP-1"] is None and flags["CP-1A"].attempt_id == "attempt-1"
    assert executor.written_after_compaction is None  # this thread ran no module
    assert executor.budget.reserved == 0 and len(executor.budget.settled_calls) == 2
    with _single_writer(tmp_path):  # the last run out let the lock go
        pass
    assert len({s.digest for s in executor._sessions}) == 2


def test_two_modules_under_a_cap_that_fits_one_hold_take_turns_and_both_finish(tmp_path):
    """The cap fits one call's hold, not two. CP-1's call is held open until CP-1A's reserve is
    waiting for it: CP-1A is neither refused at the cap nor sent while CP-1's hold is open, and
    both modules finish."""
    second: list = []

    class OneAtATime:
        config_id = "sol-medium"
        ruling = None
        inside = 0
        most = 0
        gate = threading.Lock()

        def complete(self, request, **_identity):
            with self.gate:
                self.inside += 1
                self.most = max(self.most, self.inside)
            if not second:  # CP-1's call: start CP-1A and wait until its reserve waits
                waiting = _waiting(executor.budget)
                second.extend(_in_thread(lambda: executor(_task("CP-1A"))))
                assert waiting.wait(WAIT)
                assert len(executor.budget.unsettled) == 1  # CP-1A holds nothing while it waits
            with self.gate:
                self.inside -= 1
            return _reply()

    adapter = OneAtATime()
    executor = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(8), check=lambda task, raw: ()
    )
    assert executor(_task("CP-1")) == GOOD
    thread, result = second
    thread.join(WAIT)
    assert result == [GOOD]
    hold = Decimal(executor.log.records()[0]["reserved_usd"])
    assert hold <= Decimal(8) < 2 * hold  # the premise: one hold fits, two do not
    assert adapter.most == 1
    assert executor.budget.reserved == 0 and executor.budget.spent < Decimal(1)


def test_a_module_that_ends_with_its_hold_open_stops_the_module_waiting_for_it(
    tmp_path, monkeypatch
):
    """A fault between CP-1's reserve and its call leaves its hold open (here the turn event
    raises). CP-1A is waiting in reserve for that hold. The executor leaves the hold as a crash
    leaves one when CP-1 ends, so CP-1A stops with the run instead of waiting for ever."""
    from deploy_workflow.model import handoff

    record = handoff.append_event
    second: list = []

    def faulty(directory: Path, event: str, **fields: str | int) -> None:
        if event == "turn" and fields.get("module") == "CP-1":
            waiting = _waiting(executor.budget)
            second.extend(_in_thread(lambda: executor(_task("CP-1A"))))
            assert waiting.wait(WAIT)
            raise RuntimeError("fault after the reserve, before the call")
        record(directory, event, **fields)

    class Unused:
        config_id = "sol-medium"
        ruling = None

        def complete(self, request, **_identity):
            pytest.fail("no call is sent: CP-1 faulted before it and CP-1A is stopped")

    monkeypatch.setattr(handoff, "append_event", faulty)
    executor = HandoffExecutor(
        tmp_path / "live",
        adapter=Unused(),
        cap_usd=Decimal(8),
        check=lambda task, raw: (),
        events=tmp_path,
    )
    with pytest.raises(RuntimeError, match="fault after the reserve"):
        executor(_task("CP-1"))
    thread, result = second
    thread.join(5)
    assert not thread.is_alive(), "CP-1A still waits for a hold nobody will settle"
    assert isinstance(result[0], RunStopped), result
    assert "left unsettled by a crash" in str(result[0])
    assert executor.budget.stop_kind == "crash_left" and len(executor.budget.unsettled) == 1


class Priced:
    """A fake Copilot adapter whose charges the test sets: each call is billed ``usd`` against
    the configuration's flat hold. ``hook(adapter, module, call index, canned answer)`` may
    return another reply or raise."""

    config_id = CONFIG
    ruling = Path("fake-ruling")  # not None: the reply's billed amount is the charge

    def __init__(self, case: Case, hook=None) -> None:
        self.case, self.hook = case, hook
        self.executor: HandoffExecutor | None = None
        self.digests: dict[str, str] = {}
        self.calls: list[tuple[str, int]] = []

    @staticmethod
    def reply(markdown: str | None, usd: str = "0.10") -> AdapterReply:
        usage = Usage(input_tokens=100, output_tokens=50)
        calls = (
            () if markdown is None else (ToolCall("w", "write_handoff", {"markdown": markdown}),)
        )
        kind = "tool_use" if calls else "end"
        turn = Turn("thinking" if markdown is None else "", calls, usage, kind, "m", "test", 200)
        return AdapterReply("ok", turn, None, 200, None, None, 1, 2, usage, Decimal(usd))

    def complete(self, request, *, call_index, invocation_digest, **_identity):
        context = json.loads(request.messages[1].text)
        self.digests[context["module_id"]] = invocation_digest
        self.calls.append((context["module_id"], call_index))
        good = canned_handoff(context, self.case.case, gated=True)
        found = (
            None if self.hook is None else self.hook(self, context["module_id"], call_index, good)
        )
        return self.reply(good) if found is None else found


def _priced_run(case: Case, name: str, width: int, hook, cap: str = "40", **more):
    """The synthetic plan through the real executor and budget; a stop is recorded in the event
    log as `run_live_handoffs` records it. Returns the folder, the executor and the failure."""
    out = case.root / name
    adapter = more.pop("kind", Priced)(case, hook)  # `kind`: another adapter class or factory
    executor = adapter.executor = HandoffExecutor(
        out / "live",
        adapter=adapter,
        cap_usd=Decimal(cap),
        check=case.check,
        events=out,
        max_turns=2,
    )
    try:
        case.run(name, executor, width, **more)
    except Exception as error:  # noqa: BLE001 -- returned to the test
        append_event(out, "stopped", reason=stop_reason(error))
        return out, executor, error
    return out, executor, None


def _status(case: Case, name: str) -> tuple[str, str]:
    """The run start service's status for the run, from its event log (`inbox.runs.outcome`)."""
    from types import SimpleNamespace

    from deploy_workflow.inbox.runs import outcome

    return outcome(SimpleNamespace(runs=case.root), SimpleNamespace(id=name), 1)


@pytest.mark.parametrize("width", [1, 2])
def test_an_overrun_is_reported_as_the_stop_whichever_module_meets_it_first(case, width):
    """CP-1A's call overruns its hold. At width 2 CP-1, before it in the plan, is between two
    calls then, and its next reserve is refused because the run is stopped. The run's reason is
    the overrun (`budget`, status `capped`) at both widths, never the refusal that followed it.

    The accepted sets differ, unavoidably: one at a time CP-1 had finished before CP-1A started;
    at width 2 CP-1 still needed a call the stopped budget may not hold for."""
    name = f"overrun-{width}"

    def hook(adapter: Priced, module: str, index: int, good: str):
        if module == "CP-1A":
            return Priced.reply(good, usd="8.00")  # above the USD 7.17 hold
        if module == "CP-1" and index == 0:
            if width > 1:
                _until(lambda: adapter.executor.budget.stop_kind == "overrun", "CP-1A's overrun")
            return Priced.reply(None)  # no tool call: the loop asks again, a second call follows
        return None

    out, _, error = _priced_run(case, name, width, hook)
    assert str(error).startswith("cpos_live_stopped") and "overrun=True" in str(error)
    assert stop_reason(error) == "budget"
    assert progress(read_events(out / EVENTS)).stop == "budget"
    assert _status(case, name) == ("capped", "stopped at the cap")
    accepted = case.events(name, "module_accepted")
    if width == 1:
        assert accepted == ["CP-0", "CP-1"] and not getattr(error, "__notes__", [])
    else:
        assert accepted == ["CP-0"]
        (note,) = error.__notes__
        assert note.startswith("CP-1 also stopped: the run is stopped:") and "overran" in note


@pytest.mark.parametrize(
    ("kind", "reason", "reported"),
    [
        ("unknown", "has an unknown charge", "provider"),
        ("overrun", "overran its reservation", "budget"),
    ],
)
def test_a_stopped_budget_releases_a_reserved_unsent_call(
    case, monkeypatch, kind, reason, reported
):
    from deploy_workflow.model import handoff
    from deploy_workflow.model.budget import read_reservation_snapshot

    reserved = threading.Event()
    adapter = Priced(case)
    append = handoff.append_event

    def delay_at_turn(directory, event, **fields):
        # CP-1 holds its reservation here, past the look after its reserve: only the last look,
        # after this event, is left before its call would be sent
        append(directory, event, **fields)
        if event == "turn" and fields["module"] == "CP-1":
            reserved.set()
            _until(lambda: adapter.executor.budget.stop_kind == kind, f"CP-1A's {kind} settlement")

    def hook(_adapter, module, _index, good):
        if module == "CP-1A":
            assert reserved.wait(WAIT), "CP-1 did not reach its final check with a hold"
            if kind == "overrun":
                return Priced.reply(good, usd="8.00")
            return AdapterReply("sent_unknown", None, None, None, "ConnectionLost", None, 1, 2)
        return None

    adapter.hook = hook
    monkeypatch.setattr(handoff, "append_event", delay_at_turn)
    name = f"reserved-unsent-{kind}"
    out, executor, error = _priced_run(case, name, 2, hook, kind=lambda *_: adapter)
    assert adapter.calls == [("CP-0", 0), ("CP-1A", 0)]
    unsent = [(e["module"], e["turn"]) for e in _events(out, "turn_not_sent")]
    assert unsent == [("CP-1", 1)]  # its first turn was logged, then not sent
    assert executor.budget.unsettled == ()
    markers = {marker.status: marker for marker in read_reservation_snapshot(out / "live")}
    assert markers.keys() == {"settled", "released", kind}
    assert markers["released"].settled_usd == Decimal(0)
    assert str(error).startswith("cpos_live_stopped:") and stop_reason(error) == reported
    (note,) = error.__notes__
    assert note == f"CP-1 also stopped: the run is stopped: {markers[kind].call_id!r} {reason}"


@pytest.mark.parametrize("width", [1, 2])
def test_a_cap_stop_is_capped_at_every_width_with_the_same_modules_accepted(case, width):
    """Each call is billed 0.10 and holds 7.17 against a cap of 7.40: CP-0, CP-1 and CP-1A fit
    (0.20 spent + 7.17), CP-DR does not (0.30 + 7.17). At width 2 there is room
    for one module at a time. Both runs stop at the same module, as `capped`."""
    name = f"capped-{width}"
    out, executor, error = _priced_run(case, name, width, None, cap="7.40")
    assert isinstance(error, BudgetExhausted) and stop_reason(error) == "budget"
    assert _status(case, name) == ("capped", "stopped at the cap")
    assert case.events(name, "module_accepted") == ["CP-0", "CP-1", "CP-1A"]
    assert executor.budget.spent == Decimal("0.30") and executor.budget.reserved == 0
    assert len((out / "live" / "calls.jsonl").read_text().splitlines()) == 3  # none past the cap


@pytest.mark.parametrize("width", [1, 2])
def test_a_later_module_cannot_consume_an_earlier_modules_second_turn(case, monkeypatch, width):
    from deploy_workflow.owners import cpos

    name = f"second-turn-{width}"
    decided = threading.Event()
    overlapping = False
    take_off = cpos._ModuleLoop._take_off

    def after_starts(loop, board, pool, count):
        nonlocal overlapping
        take_off(loop, board, pool, count)
        if "CP-1" in loop.flights and not decided.is_set():
            overlapping = "CP-1A" in loop.flights
            decided.set()

    monkeypatch.setattr(cpos._ModuleLoop, "_take_off", after_starts)

    def hook(adapter, module, index, good):
        if module == "CP-1" and index == 0:
            if width == 2:
                assert decided.wait(WAIT)
                if overlapping:
                    _until(lambda: adapter.executor.budget.spent >= 7, "CP-1A's settlement")
            return Priced.reply(None, "1.00")
        return Priced.reply(good, "7.00" if module == "CP-1A" else "0.10")

    _, executor, error = _priced_run(case, name, width, hook, cap="15")
    assert isinstance(error, BudgetExhausted)
    assert case.events(name, "module_accepted") == ["CP-0", "CP-1", "CP-1A"]
    assert executor.budget.spent == Decimal("8.20")
    assert executor.adapter.calls == [("CP-0", 0), ("CP-1", 0), ("CP-1", 1), ("CP-1A", 0)]


def test_admission_and_every_worker_share_the_budget_reloaded_before_dispatch(case, monkeypatch):
    from deploy_workflow.owners import cpos

    name = "reload-before-dispatch"
    adapter = Priced(case)
    directory = case.root / name / "live"
    executor = HandoffExecutor(
        directory, adapter=adapter, cap_usd=Decimal(25), max_turns=1, check=case.check
    )
    with _single_writer(directory):
        prior = Budget(Decimal(25), directory)
        prior.reserve("prior", Decimal(12), config_id=CONFIG)
        prior.settle("prior", Decimal(12))
    first = []
    dispatched = cpos._ModuleLoop._dispatch

    def capture(loop, *args):
        if not first:
            first.append((executor.budget, executor.budget.spent))
            with pytest.raises(RunDirBusy), _single_writer(directory):
                pass
        return dispatched(loop, *args)

    monkeypatch.setattr(cpos._ModuleLoop, "_dispatch", capture)
    case.run(name, executor, 2)
    assert first == [(executor.budget, Decimal(12))]
    events = [(e["event"], e.get("module")) for e in read_events(case.root / name / EVENTS)]
    assert events.index(("module_accepted", "CP-1")) < events.index(("module_started", "CP-1A"))


@pytest.mark.parametrize(
    ("config", "case_kind", "cap", "funded"),
    [
        ("sol-medium", "public", "44.55999999999999999999999999999", False),
        ("sol-medium", "private", "44.56", True),
        ("sol-medium", "synthetic", "43.92", True),
        ("copilot-opus-medium", "private", "1000000000", False),
    ],
)
def test_overlap_prices_all_attempts_and_searches_and_requires_a_context_ceiling(
    tmp_path, config, case_kind, cap, funded
):
    adapter = Priced(None)
    adapter.config_id = config
    executor = HandoffExecutor(
        tmp_path,
        adapter=adapter,
        cap_usd=Decimal(cap),
        check=lambda *_: (),
        max_turns=2,
        web_search=config == "sol-medium",
    )
    # Two turns in each of two attempts per module, at 5.49 each on Sol.
    # Public/private CP-DR can also use 16 hosted searches per turn at 0.01 each.
    with executor.shared_budget():
        assert executor.can_overlap(("CP-1", "CP-DR"), case_kind, 2) is funded


def test_overlap_defers_when_money_would_round(tmp_path):
    adapter = Priced(None)
    adapter.config_id = "sol-medium"
    executor = HandoffExecutor(
        tmp_path,
        adapter=adapter,
        cap_usd=Decimal("44.20"),
        check=lambda *_: (),
        max_turns=2,
        web_search=True,
    )
    with executor.shared_budget():
        with localcontext(prec=2):
            # Full exposure is 44.56. An ambient two-digit price calculation admits both.
            assert not executor.can_overlap(("CP-1", "CP-DR"), "public", 2)
        executor.budget.reserve("prior", Decimal(1), config_id=adapter.config_id)
        executor.budget.settle("prior", Decimal("1e-119"))
        # The combined bound needs 121 significant digits with settled spend. A serial
        # reservation fits at the ledger's 120-digit precision.
        assert not executor.can_overlap(("CP-1", "CP-DR"), "public", 1)
        executor.budget.reserve("one-call", Decimal("5.49"), config_id=adapter.config_id)
        executor.budget.release("one-call")


NOT_SENT = AdapterReply("not_sent", None, None, None, "RateLimited", None, 1, 2, message="429")


class Draining(Priced):
    """As the Copilot adapter: the executor drains a module's session when its run ends. The
    drain of the module whose call failed is held until the test lets it go."""

    def __init__(self, case: Case, hook=None) -> None:
        super().__init__(case, hook)
        self.failed = ""  # the module whose drain is held
        self.draining, self.release = threading.Event(), threading.Event()

    def drain_compactions(self, invocation_digest: str) -> tuple[()]:
        if invocation_digest == self.digests.get(self.failed):
            self.draining.set()
            assert self.release.wait(WAIT)
        return ()


def _a_round_of_starts_after(monkeypatch, accepted: str, then) -> None:
    """Call ``then`` once the scheduler has run a round of starts with ``accepted`` accepted."""
    from deploy_workflow.owners import cpos

    take_off = cpos._ModuleLoop._take_off

    def watched(self, board, pool, width):
        take_off(self, board, pool, width)
        if accepted in self.selected:
            then()

    monkeypatch.setattr(cpos._ModuleLoop, "_take_off", watched)


def test_nothing_starts_while_a_failed_module_is_still_draining_its_session(case, monkeypatch):
    """CP-1A's call fails. Its thread then drains its session, which can take seconds, and only
    after that is its failure visible as a finished module. CP-1 is accepted meanwhile and CP-DR
    is next, its producers accepted and a slot free. The failure was told when it was raised:
    CP-DR is not started and makes no call, as one module at a time never starts it."""

    def started(width: int) -> list[str]:
        made: list[Draining] = []

        def kind(case_: Case, hook_) -> Draining:
            made.append(Draining(case_, hook_))
            made[-1].failed = "CP-1A"
            if width == 1:
                made[-1].release.set()  # nothing is in flight beside CP-1A: no one to wait for
            return made[-1]

        def hook(adapter: Draining, module: str, index: int, good: str):
            if module == "CP-1A":
                return NOT_SENT
            if module == "CP-1" and width > 1:
                assert adapter.draining.wait(WAIT)  # answered while CP-1A drains
            return None

        _a_round_of_starts_after(monkeypatch, "CP-1", lambda: made[-1].release.set())
        name = f"draining-{width}"
        _, _, error = _priced_run(case, name, width, hook, kind=kind)
        monkeypatch.undo()
        assert str(error).startswith("cpos_live_stopped: not_sent"), error
        assert {m for m, _ in made[-1].calls} == set(case.events(name, "module_started"))
        return case.events(name, "module_started")

    assert started(2) == started(1) == ["CP-0", "CP-1", "CP-1A"]


def test_nothing_starts_while_a_failed_call_is_still_being_settled_and_logged(case, monkeypatch):
    """CP-1A's call comes back refused. Before its thread raises, it settles the call and writes
    the call log and the response, which takes time on a slow disk; here the call log's append is
    held. CP-1 is accepted meanwhile and CP-DR is next. The failure was told when the reply was
    known bad: CP-DR is not started, as one module at a time never starts it."""

    def started(width: int) -> list[str]:
        logging, release = threading.Event(), threading.Event()
        calls = []

        def hook(adapter: Priced, module: str, index: int, good: str):
            calls.append(module)
            if module == "CP-1A":
                append = adapter.executor.log.append

                def held(record) -> None:
                    if record.module_id == "CP-1A":
                        logging.set()
                        assert width == 1 or release.wait(WAIT)
                    append(record)

                adapter.executor.log.append = held
                return NOT_SENT
            if module == "CP-1" and width > 1:
                assert logging.wait(WAIT)  # answered while CP-1A's failed call is being logged
            return None

        _a_round_of_starts_after(monkeypatch, "CP-1", release.set)
        name = f"logging-{width}"
        _, _, error = _priced_run(case, name, width, hook)
        monkeypatch.undo()
        assert str(error) == "cpos_live_stopped: not_sent; charge=0; overrun=False", error
        assert sorted(set(calls)) == sorted(case.events(name, "module_started"))
        return case.events(name, "module_started")

    assert started(2) == started(1) == ["CP-0", "CP-1", "CP-1A"]


def test_a_reported_failure_halts_the_later_modules_without_the_scheduler(case, monkeypatch):
    """CP-2A, CP-2E and CP-2D are in flight. The scheduling thread is busy (in the observer of
    CP-2A's acceptance) when CP-2E's failure is reported. CP-2D, after CP-2E in the plan, is
    refused its next call from the report itself, not from the scheduler's next look."""
    from deploy_workflow.owners import cpos

    report = cpos._Board.report
    observing, reported, asked = threading.Event(), threading.Event(), threading.Event()
    outcome = []

    def watched_report(self, module_id, error):
        report(self, module_id, error)
        reported.set()

    monkeypatch.setattr(cpos._Board, "report", watched_report)

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == "CP-2E":
            assert observing.wait(WAIT)
            raise RuntimeError("cpos_live_stopped: the provider stopped CP-2E")
        if task.module_id == "CP-2D":
            assert reported.wait(WAIT)
            try:
                task.proceed()  # what the executor asks before each paid exchange
                outcome.append("went on")
            except ModuleHalted:
                outcome.append("halted")
                raise
            finally:
                asked.set()
        return case.answer(task)

    def busy(task: HandoffTask, raw: bytes) -> None:
        if task.module_id == "CP-2A":
            observing.set()
            assert asked.wait(WAIT)  # the scheduler does nothing until CP-2D has asked

    with pytest.raises(RuntimeError, match="the provider stopped CP-2E"):
        case.run("report-halts", execute, 3, on_handoff=busy)
    assert outcome == ["halted"]


def test_a_start_is_decided_with_the_board_held(case, monkeypatch):
    """While the scheduler decides and makes a start, no module thread can report a failure in
    between: the board is held from the last look at the failures to the start itself."""
    from deploy_workflow.owners import cpos

    start, dispatch = cpos._ModuleLoop._start, cpos._ModuleLoop._dispatch
    boards, free = [], []

    def watched_start(self, board, pool, width):
        boards.append(board)
        start(self, board, pool, width)

    def probe() -> None:
        taken = boards[-1]._changed.acquire(blocking=False)
        free.append(taken)
        if taken:
            boards[-1]._changed.release()

    def watched_dispatch(self, module_id, accepted, proceed):
        if boards:  # a start with modules in flight: can another thread take the board now?
            other = threading.Thread(target=probe)
            other.start()
            other.join(WAIT)
        return dispatch(self, module_id, accepted, proceed)

    monkeypatch.setattr(cpos._ModuleLoop, "_start", watched_start)
    monkeypatch.setattr(cpos._ModuleLoop, "_dispatch", watched_dispatch)
    assert case.run("board-held", case.answer, 2).is_file()
    assert free == [False] * len(case.ordered)


@pytest.mark.parametrize("width", [3, 4])
def test_an_observer_stop_ends_with_a_halted_module_between_two_in_flight(case, monkeypatch, width):
    """The observer stops the run at CP-2A's acceptance with CP-2E and CP-2D in flight. CP-2E
    needs another call and is halted for the review. CP-2D's call returns its handoff, and its
    check waits for every module before it, CP-2E among them: it is told CP-2E will not be
    accepted, and the launch ends (it waited for ever)."""
    stopped = _the_scheduler_took_the_stop(monkeypatch)
    halted = threading.Event()
    outcome = []

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == "CP-2E":
            assert stopped.wait(WAIT)
            try:
                task.proceed()  # its next call: refused, the run is stopped for review
            finally:
                halted.set()
        if task.module_id == "CP-2D":
            assert halted.wait(WAIT)
            try:
                len(task.accepted)  # its check reads the handoffs before it
                outcome.append("checked")
            except ModuleHalted:
                outcome.append("halted")
                raise
        return case.answer(task)

    def stop_at_cp2a(task: HandoffTask, raw: bytes) -> None:
        if task.module_id == "CP-2A":
            raise RuntimeError("evidence review")

    name = f"observer-three-{width}"
    with pytest.raises(RuntimeError, match="evidence review") as raised:
        case.run(name, execute, width, on_handoff=stop_at_cp2a)
    assert outcome == ["halted"] and not getattr(raised.value, "__notes__", [])
    assert case.events(name, "module_started")[-3:] == ["CP-2A", "CP-2E", "CP-2D"]
    assert case.events(name, "module_accepted")[-1] == "CP-2A"


def test_nothing_starts_while_a_module_that_was_not_accepted_drains_its_session(case, monkeypatch):
    """CP-1A is not accepted within its bounds: every draft it writes is refused, and its run
    ends with no bad reply at all. Its thread then drains its session, held here. CP-1 is
    accepted meanwhile and CP-DR is next. The executor told the failure when the run raised it,
    before the drain: CP-DR is not started."""
    made: list[Draining] = []

    def kind(case_: Case, hook_) -> Draining:
        made.append(Draining(case_, hook_))
        made[-1].failed = "CP-1A"
        return made[-1]

    def hook(adapter: Draining, module: str, index: int, good: str):
        if module == "CP-1A":
            return Priced.reply("# CP-1A\n\nnot a handoff\n")
        if module == "CP-1":
            assert adapter.draining.wait(WAIT)  # answered while CP-1A drains
        return None

    _a_round_of_starts_after(monkeypatch, "CP-1", lambda: made[-1].release.set())
    _, _, error = _priced_run(case, "refused-draining", 2, hook, kind=kind)
    assert str(error).startswith("cpos_live_not_accepted: CP-1A"), error
    assert case.events("refused-draining", "module_started") == ["CP-0", "CP-1", "CP-1A"]
    assert "CP-DR" not in {m for m, _ in made[-1].calls}


def test_a_failure_reported_between_landing_and_a_start_stops_the_start(case, monkeypatch):
    """The scheduler has accepted CP-1 and is about to start CP-DR when CP-1A's failure is
    reported. The failures are read again, with the board held, before each start: CP-DR is not
    started."""
    from deploy_workflow.owners import cpos

    land, report = cpos._ModuleLoop._land, cpos._ModuleLoop._report
    accepted, reported = threading.Event(), threading.Event()

    def watched_land(self, board):
        land(self, board)
        if "CP-1" in self.selected and not self.failures:
            accepted.set()
            assert reported.wait(WAIT)  # held here, past the landing's own look at the failures

    def watched_report(board, module_id, error):
        report(board, module_id, error)
        reported.set()

    monkeypatch.setattr(cpos._ModuleLoop, "_land", watched_land)
    monkeypatch.setattr(cpos._ModuleLoop, "_report", staticmethod(watched_report))

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == "CP-1A":
            assert accepted.wait(WAIT)
            raise RuntimeError("cpos_live_stopped: the provider stopped CP-1A")
        return case.answer(task)

    with pytest.raises(RuntimeError, match="the provider stopped CP-1A"):
        case.run("between", execute, 2)
    assert case.events("between", "module_started") == ["CP-0", "CP-1", "CP-1A"]


def test_the_failure_of_the_last_module_is_the_one_raised(case):
    """Nothing is left to start when the last module fails, so only the landing reads it."""

    def execute(task: HandoffTask) -> bytes:
        if task.module_id == case.ordered[-1]:
            raise RuntimeError("cpos_live_stopped: the provider stopped the last module")
        return case.answer(task)

    with pytest.raises(RuntimeError, match="the provider stopped the last module"):
        case.run("last-fails", execute, 2)
    assert case.events("last-fails", "module_accepted") == list(case.ordered[:-1])


def test_a_module_halted_in_flight_is_stranded_until_it_is_repaired_too(case):
    """The known difference from one at a time, as the ruling states it. CP-1 fails while CP-1A,
    after it in the plan, is in flight; CP-1A is halted with its request retained and no answer.
    After CP-1 alone is repaired (a revised instruction: a new request) the folder stops at
    CP-1A, nothing is sent for it again, and repairing CP-1A the same way lets the run deliver.
    One at a time CP-1A was never started, and repairing CP-1 is enough."""
    both = threading.Barrier(2, timeout=WAIT)
    calls = []

    def first(task: HandoffTask) -> bytes:
        if task.module_id == "CP-1":
            both.wait()
            raise RuntimeError("cpos_live_stopped: not_sent; the provider refused CP-1")
        if task.module_id == "CP-1A":
            both.wait()
            case.check(task, case.answer(task))  # halted here, at its check
        return case.answer(task)

    def later(task: HandoffTask) -> bytes:
        calls.append(task.module_id)
        return case.answer(task)

    with pytest.raises(RuntimeError, match="the provider refused CP-1"):
        case.run("stranded", first, 2)
    with pytest.raises(ValueError, match="cpos_interrupted: response not retained for CP-1A"):
        case.run("stranded", later, 1, manifest=case.revised("stranded-a", "CP-1"))
    assert calls == ["CP-1"]  # the repaired module was asked once; CP-1A was not asked again
    calls.clear()
    both_revised = case.revised("stranded-b", "CP-1", "CP-1A")
    assert case.run("stranded", later, 1, manifest=both_revised).is_file()
    assert calls == list(case.ordered[2:])  # CP-0 and the repaired CP-1 are reused


def test_after_an_observer_stop_a_module_in_flight_sends_no_new_call(case, monkeypatch):
    """The observer stops the run at CP-1 while CP-1A's first call is out. That call returns
    without a handoff, so CP-1A would need another call: it is not sent. CP-1A ends halted, like
    a module halted by a failure, and the run's failure is the observer's stop alone."""
    stopped = _the_scheduler_took_the_stop(monkeypatch)

    def hook(adapter: Priced, module: str, index: int, good: str):
        if module == "CP-1A":
            assert stopped.wait(WAIT)
            return Priced.reply(None)  # no handoff yet: the loop would ask again
        return None

    def stop_at_cp1(task: HandoffTask, raw: bytes) -> None:
        if task.module_id == "CP-1":
            raise RuntimeError("evidence review")

    _, executor, error = _priced_run(case, "observer-bound", 2, hook, on_handoff=stop_at_cp1)
    assert str(error) == "evidence review" and not getattr(error, "__notes__", [])
    assert executor.adapter.calls.count(("CP-1A", 0)) == 1
    assert ("CP-1A", 1) not in executor.adapter.calls
    assert executor.budget.reserved == 0 and executor.budget.stop_reason is None
    assert executor.budget.spent == Decimal("0.30")  # CP-0, CP-1 and the one call of CP-1A
    assert case.events("observer-bound", "module_accepted") == ["CP-0", "CP-1"]


def test_a_halted_module_reserves_nothing_and_sends_nothing(tmp_path):
    class Refusing:
        config_id = "sol-medium"
        ruling = None

        def complete(self, request, **_identity):
            pytest.fail("a halted module made a call")

    def halted() -> None:
        raise ModuleHalted("cpos_halted: CP-1A")

    executor = HandoffExecutor(
        tmp_path, adapter=Refusing(), cap_usd=Decimal(20), check=lambda task, raw: ()
    )
    with pytest.raises(ModuleHalted):
        executor(_task("CP-1A", halted))
    assert list((tmp_path / "owner-run-audit/reservations").iterdir()) == []
    assert executor.budget.stop_reason is None


@pytest.mark.parametrize("ask", [2, 3])
def test_a_module_halted_while_it_waited_for_the_cap_releases_its_hold_unsent(tmp_path, ask):
    """The executor asks three times for each exchange: before the hold, after it (the reserve
    may have waited), and immediately before the call is handed to the adapter (the turn event
    was written since). Halted at the second or the third, the hold is released and nothing is
    sent."""
    asked = []

    def halted_second_time() -> None:
        asked.append(1)
        if len(asked) >= ask:
            raise ModuleHalted("cpos_halted: CP-1A")

    class Refusing:
        config_id = "sol-medium"
        ruling = None

        def complete(self, request, **_identity):
            pytest.fail("a halted module made a call")

    executor = HandoffExecutor(
        tmp_path, adapter=Refusing(), cap_usd=Decimal(20), check=lambda task, raw: ()
    )
    with pytest.raises(ModuleHalted):
        executor(_task("CP-1A", halted_second_time))
    assert len(asked) == ask
    snapshot = executor.budget
    assert (snapshot.spent, snapshot.reserved, snapshot.stop_reason) == (0, 0, None)
    settled = list((tmp_path / "owner-run-audit/reservations").glob("*.settled"))
    assert [json.loads(p.read_text())["status"] for p in settled] == ["released"]


class _NeverCalled:
    config_id = "sol-medium"
    ruling = None

    def complete(self, request, **_identity):
        pytest.fail("a refused call was sent")


def _events(folder: Path, name: str) -> list[dict]:
    log = folder / EVENTS
    return [e for e in read_events(log) if e["event"] == name] if log.exists() else []


def _turns(folder: Path) -> list[tuple[str, str, int]]:
    """The `turn` and `turn_not_sent` events of the log, in order: (event, module, turn)."""
    log = folder / EVENTS
    return [
        (e["event"], e["module"], e["turn"])
        for e in (read_events(log) if log.exists() else [])
        if e["event"] in {"turn", "turn_not_sent"}
    ]


def _peer_unknown_charge(budget: Budget) -> None:
    """Another module's call, on its own thread, settles with an unknown charge: the shared
    ledger is stopped."""

    def peer() -> None:
        budget.reserve("call-peer", Decimal(1), config_id="sol-medium")
        budget.settle("call-peer", None)

    thread, result = _in_thread(peer)
    thread.join(WAIT)
    assert result == [None]


HALTED = "cpos_halted: CP-1A: halted for the test"
# what the module raises, by the way its call is stopped: its own halt, or the peer's stop
REFUSED = {"halt": (ModuleHalted, HALTED), "ledger": (RunStopped, "'call-peer' has an unknown")}


def _released_unsent(executor: HandoffExecutor, folder: Path, stop: str) -> None:
    """The hold of the module's one call was released, and the ledger holds nothing else of it."""
    from deploy_workflow.model.budget import read_reservation_snapshot

    markers = {m.call_id: m for m in read_reservation_snapshot(folder)}
    (mine,) = markers.keys() - {"call-peer"}
    assert (markers[mine].status, markers[mine].settled_usd) == ("released", Decimal(0))
    assert executor.budget.reserved == 0 and executor.budget.unsettled == ()
    if stop == "halt":
        assert markers.keys() == {mine} and executor.budget.stop_reason is None
    else:
        assert markers["call-peer"].status == "unknown"


@pytest.mark.parametrize("stop", ["halt", "ledger"])
def test_a_stop_that_arrives_while_the_turn_event_is_written_stops_the_call(
    tmp_path, monkeypatch, stop
):
    """The `turn` event is written after the reserve and the look that follows it, and the write
    takes time (a process-wide lock and an fsync). A halt of the module, or a stop of the shared
    ledger by another module's unknown charge, that arrives during that write still stops the
    call: nothing is sent, the hold is released, a `turn_not_sent` event follows the `turn`
    event, and the module raises the refusal with its own reason."""
    from deploy_workflow.model import handoff

    halted = threading.Event()
    executor = HandoffExecutor(
        tmp_path / "live",
        adapter=_NeverCalled(),
        cap_usd=Decimal(20),
        check=lambda task, raw: (),
        events=tmp_path,
    )
    append = handoff.append_event

    def stopped_while_written(directory, event, **fields):
        append(directory, event, **fields)
        if event == "turn":
            if stop == "halt":
                halted.set()
            else:
                _peer_unknown_charge(executor.budget)  # the ledger this run of the module loaded

    def proceed() -> None:
        if halted.is_set():
            raise ModuleHalted(HALTED)

    monkeypatch.setattr(handoff, "append_event", stopped_while_written)
    kind, reason = REFUSED[stop]
    with pytest.raises(kind, match=reason) as raised:
        executor(_task("CP-1A", proceed))
    assert type(raised.value) is kind and not getattr(raised.value, "__notes__", [])
    logged = [
        (e["event"], e["module"], e["turn"])
        for e in read_events(tmp_path / EVENTS)
        if e["event"] in {"turn", "turn_not_sent"}
    ]
    assert logged == [("turn", "CP-1A", 1), ("turn_not_sent", "CP-1A", 1)]
    _released_unsent(executor, tmp_path / "live", stop)


@pytest.mark.parametrize(
    ("look", "logged"), [(1, []), (2, [("turn", "CP-1A", 1), ("turn_not_sent", "CP-1A", 1)])]
)
def test_a_halt_reported_while_the_ledger_check_waits_for_its_lock_stops_the_call(
    tmp_path, monkeypatch, look, logged
):
    """Each look before a call checks the shared ledger, which takes the ledger's lock (another
    module may hold it across a marker write and its fsyncs), and the module. A halt reported
    while the ledger check waits, with no stop in the ledger, still stops the call: the module's
    check, which takes no lock, comes last. At the look after the reserve no `turn` event is
    written; at the look before dispatch a `turn_not_sent` event follows the `turn`. Nothing is
    sent, the hold is released, and the module raises its own halt."""
    halted = threading.Event()
    executor = HandoffExecutor(
        tmp_path / "live",
        adapter=_NeverCalled(),
        cap_usd=Decimal(20),
        check=lambda task, raw: (),
        events=tmp_path,
    )
    check_running, asked = Budget.check_running, []

    def halted_while_it_waits(budget: Budget) -> None:
        asked.append(1)
        if len(asked) == look:
            halted.set()  # CP-OS takes a peer's failure report meanwhile
        check_running(budget)  # and the ledger has no stop

    def proceed() -> None:
        if halted.is_set():
            raise ModuleHalted(HALTED)

    monkeypatch.setattr(Budget, "check_running", halted_while_it_waits)
    with pytest.raises(ModuleHalted, match=HALTED) as raised:
        executor(_task("CP-1A", proceed))
    assert type(raised.value) is ModuleHalted and not getattr(raised.value, "__notes__", [])
    assert len(asked) == look
    assert _turns(tmp_path) == logged
    _released_unsent(executor, tmp_path / "live", "halt")


class _NotSent:
    """The adapter reports the exchange was never sent (a rate limit before the request left)."""

    config_id = "sol-medium"
    ruling = None

    def complete(self, request, **_identity):
        return NOT_SENT


def test_a_reply_the_adapter_did_not_send_is_logged_as_a_turn_not_sent(tmp_path):
    """The `turn` event is written before the call is handed to the adapter. When the adapter
    replies `not_sent`, its hold is released and a `turn_not_sent` event follows that `turn`, as
    when a look refuses the call; the module still stops as before and its call is recorded once,
    unpriced and charged nothing."""
    executor = HandoffExecutor(
        tmp_path / "live",
        adapter=_NotSent(),
        cap_usd=Decimal(20),
        check=lambda task, raw: (),
        events=tmp_path,
    )
    with pytest.raises(RuntimeError, match="cpos_live_stopped: not_sent; charge=0; ") as raised:
        executor(_task("CP-1A"))
    assert type(raised.value) is RuntimeError and not getattr(raised.value, "__notes__", [])
    assert _turns(tmp_path) == [("turn", "CP-1A", 1), ("turn_not_sent", "CP-1A", 1)]
    (row,) = [json.loads(n) for n in (tmp_path / "live/calls.jsonl").read_text().splitlines()]
    assert (row["settled_usd"], row["error_class"]) == ("0", "RateLimited")
    _released_unsent(executor, tmp_path / "live", "halt")


class _DiskFull:
    """`os` as `run_events` sees it: once `full` is set, the fsync of an event write fails as a
    full disk does (`append_event` then cuts the line back and skips it)."""

    full = False

    def __getattr__(self, name: str):
        return getattr(os, name)

    def fsync(self, descriptor: int) -> None:
        if self.full:
            raise OSError(errno.ENOSPC, "No space left on device")
        os.fsync(descriptor)


def _halted_with_the_disk_full(tmp_path: Path, monkeypatch) -> pytest.ExceptionInfo:
    """The module is halted while its `turn` event is written, and the disk is full from then on,
    so the real `append_event` cannot write the `turn_not_sent` event."""
    from deploy_workflow import run_events
    from deploy_workflow.model import handoff

    halted, disk = threading.Event(), _DiskFull()
    executor = HandoffExecutor(
        tmp_path / "live",
        adapter=_NeverCalled(),
        cap_usd=Decimal(20),
        check=lambda task, raw: (),
        events=tmp_path,
    )
    append = handoff.append_event

    def full_after_the_turn(directory, event, **fields):
        append(directory, event, **fields)
        if event == "turn":
            disk.full = True
            halted.set()

    def proceed() -> None:
        if halted.is_set():
            raise ModuleHalted(HALTED)

    monkeypatch.setattr(run_events, "os", disk)
    monkeypatch.setattr(handoff, "append_event", full_after_the_turn)
    with pytest.raises(ModuleHalted, match=HALTED) as raised:
        executor(_task("CP-1A", proceed))
    assert [e["module"] for e in _events(tmp_path, "turn")] == ["CP-1A"]
    assert _events(tmp_path, "turn_not_sent") == []  # the log is still readable, line by line
    _released_unsent(executor, tmp_path / "live", "halt")
    return raised


def test_a_turn_not_sent_the_full_disk_refuses_is_missing_and_the_refusal_is_unchanged(
    tmp_path, monkeypatch
):
    """`append_event` is fail-open: the disk refusing the `turn_not_sent` write (an OSError in
    the write) only emits a RuntimeWarning. The event is missing, the hold is released, and the
    module raises its halt unchanged, with nothing noted on it."""
    with pytest.warns(RuntimeWarning, match="run event not recorded: turn_not_sent: .*No space"):
        raised = _halted_with_the_disk_full(tmp_path, monkeypatch)
    assert type(raised.value) is ModuleHalted and not getattr(raised.value, "__notes__", [])


def test_a_turn_not_sent_whose_warning_is_made_an_error_never_replaces_the_refusal(
    tmp_path, monkeypatch
):
    """Where a warnings filter makes that RuntimeWarning an error (`-W error`), `append_event`
    raises it. It is noted on the module's halt, which is still what the module raises, and the
    hold is released."""
    with warnings.catch_warnings():
        warnings.simplefilter("error", RuntimeWarning)
        raised = _halted_with_the_disk_full(tmp_path, monkeypatch)
    assert type(raised.value) is ModuleHalted
    (note,) = raised.value.__notes__
    assert note.startswith(
        "its turn_not_sent event was not written: RuntimeWarning: "
        "run event not recorded: turn_not_sent: [Errno 28] No space left on device"
    )


@pytest.mark.parametrize("stop", ["halt", "ledger"])
def test_a_call_refused_before_its_turn_event_leaves_none(tmp_path, monkeypatch, stop):
    """A module halted, or the shared ledger stopped, once its hold is reserved (the reserve may
    have waited for another module's settlement) is refused before the `turn` event is written:
    the log shows no turn for it, sent or not, and its hold is released."""
    executor = HandoffExecutor(
        tmp_path / "live",
        adapter=_NeverCalled(),
        cap_usd=Decimal(20),
        check=lambda task, raw: (),
        events=tmp_path,
    )
    reserve = Budget.reserve

    def reserved_then_stopped(budget: Budget, call_id: str, *more, **named) -> None:
        reserve(budget, call_id, *more, **named)
        if stop == "ledger" and call_id != "call-peer":
            _peer_unknown_charge(budget)  # before this module's look

    def proceed() -> None:
        if stop == "halt" and executor.budget.reserved > 0:  # not when asked before the reserve
            raise ModuleHalted(HALTED)

    monkeypatch.setattr(Budget, "reserve", reserved_then_stopped)
    kind, reason = REFUSED[stop]
    with pytest.raises(kind, match=reason) as raised:
        executor(_task("CP-1A", proceed))
    assert type(raised.value) is kind and not getattr(raised.value, "__notes__", [])
    assert _events(tmp_path, "turn") == [] and _events(tmp_path, "turn_not_sent") == []
    _released_unsent(executor, tmp_path / "live", stop)


def test_a_release_that_fails_does_not_replace_the_refusal(tmp_path, monkeypatch):
    """The ledger faults after this module reserved (a peer's marker write failed), so its call
    is refused with `RunStopped`, and the release of its hold cannot be written either. The
    module still raises that `RunStopped`, the failed release noted on it: CP-OS reads it as a
    bystander of the stop, not as the run's cause. The hold stays open, as a crash leaves one."""
    from deploy_workflow.model import budget as ledger
    from deploy_workflow.owners.cpos import _stopped_by_another

    executor = HandoffExecutor(
        tmp_path, adapter=_NeverCalled(), cap_usd=Decimal(20), check=lambda task, raw: ()
    )
    asked = []

    def unwritable(path: Path, payload: dict[str, object]) -> None:
        raise OSError("disk full")

    def a_peers_write_fails() -> None:
        asked.append(1)
        if len(asked) == 2:  # after the reserve
            monkeypatch.setattr(ledger, "_write_once", unwritable)
            with executor.budget._lock:
                executor.budget._faulted = True

    with pytest.raises(RunStopped, match="a marker write failed") as raised:
        executor(_task("CP-1A", a_peers_write_fails))
    assert _stopped_by_another(raised.value)
    (note,) = raised.value.__notes__
    assert note == "its hold was not released: OSError: disk full"
    assert list((tmp_path / "owner-run-audit/reservations").glob("*.settled")) == []
    assert executor.budget.stop_kind == "faulted"


def test_a_halted_modules_unreleased_hold_is_noted_on_the_launchs_failure(case, monkeypatch):
    """The observer stops the run at CP-1 while CP-1A's first `turn` event is being written, its
    hold reserved. CP-1A is halted at the last look before its call is sent, and the release of
    its hold cannot be written (the disk is full). A halted module is not a failure and CP-OS does
    not report it, but the hold it left open is part of the run's record: the launch's failure,
    still the observer's stop, carries a note naming CP-1A and the hold."""
    from deploy_workflow.model import budget as ledger
    from deploy_workflow.model import handoff

    stopped = _the_scheduler_took_the_stop(monkeypatch)
    disk_full = threading.Event()
    append, write_once = handoff.append_event, ledger._write_once

    def stop_taken_while_written(directory, event, **fields):
        append(directory, event, **fields)
        if event == "turn" and fields["module"] == "CP-1A":
            assert stopped.wait(WAIT), "the observer's stop was not taken"
            disk_full.set()  # CP-0 and CP-1 are settled; nothing else starts

    def full(path: Path, payload: dict[str, object]) -> None:
        if disk_full.is_set() and path.name.endswith(".settled"):
            raise OSError("disk full")
        write_once(path, payload)

    def stop_at_cp1(task: HandoffTask, raw: bytes) -> None:
        if task.module_id == "CP-1":
            raise RuntimeError("evidence review")

    monkeypatch.setattr(handoff, "append_event", stop_taken_while_written)
    monkeypatch.setattr(ledger, "_write_once", full)
    out, executor, error = _priced_run(case, "halt-noted", 2, None, on_handoff=stop_at_cp1)
    assert str(error) == "evidence review"  # still the cause: CP-1A only halted
    (note,) = error.__notes__
    assert note == (
        "CP-1A halted: cpos_halted: CP-1A: the run was stopped for review before its next call; "
        "its hold was not released: OSError: disk full"
    )
    assert ("CP-1A", 0) not in executor.adapter.calls
    assert [(e["module"], e["turn"]) for e in _events(out, "turn_not_sent")] == [("CP-1A", 1)]
    assert len(executor.budget.unsettled) == 1 and executor.budget.stop_kind == "faulted"
    assert case.events("halt-noted", "module_accepted") == ["CP-0", "CP-1"]


# ---------------------------------------------------------------- the launcher's setting


def test_the_default_is_one_module_at_a_time_and_a_width_above_one_is_asked_for():
    """Unset, every entry point runs one module at a time, as before the change."""
    import inspect

    from deploy_workflow.owners import cpos

    width = cpos_launch.module_width
    assert MODULE_WIDTH == 1
    assert width(None, {}) == 1
    assert width(None, {cpos_launch.PARALLEL_VARIABLE: " "}) == 1
    assert inspect.signature(cpos.run_handoffs).parameters["width"].default == 1
    assert inspect.signature(cpos.run_live_handoffs).parameters["module_width"].default == 1
    assert width(None, {cpos_launch.PARALLEL_VARIABLE: "2"}) == 2
    assert width(3, {cpos_launch.PARALLEL_VARIABLE: "1"}) == 3
    for bad in ("0", "5", "two", "-1", "1.5"):
        with pytest.raises(cpos_launch.LaunchRefused, match="whole number from 1 to 4"):
            width(None, {cpos_launch.PARALLEL_VARIABLE: bad})
    parser = cpos_launch._parser()
    base = ["--context", "c", "--sources", "s", "--config", CONFIG]
    assert parser.parse_args(base).parallel_modules is None
    assert parser.parse_args([*base, "--parallel-modules", "2"]).parallel_modules == 2
    with pytest.raises(SystemExit):
        parser.parse_args([*base, "--parallel-modules", "5"])


# ---------------------------------------------------------------- end to end, synthetic


_TIME = re.compile(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|\+00:00)")
_BUILT = re.compile(r'"built_at": "[^"]*"')
_CALL = re.compile(r"call-[0-9a-f]{32}")
_CALLS = re.compile(r'"calls": \[(\{[^\[\]]*\})\]')  # the library's copy of the call log


def _library_data(text: str) -> str:
    """The library's data with its times left out and its call rows, which it lists in the call
    log's order, sorted."""
    text = _BUILT.sub("built", _TIME.sub("time", text))
    return _CALLS.sub(lambda rows: "calls:" + "".join(sorted(rows[1].split("}, {"))), text)


def _launched(root: Path, width: str | None, monkeypatch) -> dict[str, str]:
    """Launch the synthetic proof through the real launcher and loop (canned Copilot replies),
    rebuild the library, and return the workspace tree. Left out of the comparison, and nothing
    else: the times in the event log, the call log and the library's run record, and the time
    the library was built (`built_at`); the random
    call ids (the reservation markers' names and each response's `reservation_id`); and the order
    of the event and call log lines, and of the library's copy of the call log, which is the
    order things happened in; and the event log's `launch_started` line, which states the width."""
    context, drop = workspace(root)
    out = root / "runs" / "example-run"
    argv = [
        *("--context", str(context), "--sources", str(drop), "--config", CONFIG, "--cap", "25"),
        *("--out", str(out), "--no-library", "--prior", "none", "--live", "--ruling", str(RULING)),
        "--max-turns",
        "1",
        *(() if width is None else ("--parallel-modules", width)),
    ]
    monkeypatch.setenv("COPILOT_GITHUB_TOKEN", DUMMY_KEY)
    monkeypatch.setenv("COPILOT_CLI_PATH", str(Path(__file__)))
    assert launcher.run_engine(argv) == 0
    cpos_launch.update_library_at(root)
    tree = {}
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        name = path.relative_to(root).as_posix()
        text = path.read_bytes()
        if name.endswith((EVENTS, "live/calls.jsonl")):
            lines = _CALL.sub("call-id", _TIME.sub("time", text.decode())).splitlines()
            lines = [line for line in lines if '"launch_started"' not in line]  # states the width
            text = "\n".join(sorted(lines)).encode()
        elif name == "library/data.js":
            assert _CALLS.search(text.decode())
            text = _library_data(text.decode()).encode()
        elif "/live/modules/" in name and name.endswith(".response.json"):
            text = _CALL.sub("call-id", text.decode()).encode()
        elif "/owner-run-audit/reservations/" in name:
            name = _CALL.sub("call-id", name)
            tree[name] = tree.get(name, "") + hashlib.sha256(text).hexdigest()
            continue
        tree[name] = hashlib.sha256(text).hexdigest()
    return tree


@pytest.mark.parametrize(
    "asked_retained_said",
    [
        ("2", False, "Parallel: up to 2 independent modules at once, as asked"),
        ("3", True, "Parallel: one module at a time, not the 3 asked"),
        ("1", False, None),
        ("1", True, None),
        (None, True, None),
    ],
)
def test_the_launcher_states_the_width_the_run_uses(
    tmp_path, monkeypatch, capsys, asked_retained_said
):
    """The launcher's `Parallel` line, up to the hand-over to the loop (replaced here: nothing
    runs). A plan with retained handoffs is run one module at a time whatever width is asked
    (`test_a_plan_with_retained_handoffs_runs_one_at_a_time_whatever_width_is_asked`), and the
    launcher says that instead of the width asked."""
    import dataclasses

    from deploy_workflow.owners.cpos import RetainedHandoff

    asked, retained, said = asked_retained_said
    prepare = cpos_launch.prepare

    def prepared_with_retained(*args, **kwargs):
        prepared = prepare(*args, **kwargs)
        pin = RetainedHandoff(
            path="retained/CP-0.md", sha256="0" * 64, source_hashes={}, upstream={}
        )
        plan = prepared.plan.model_copy(update={"retained_handoffs": {"CP-0": pin}})
        return dataclasses.replace(prepared, plan=plan)

    def not_run(*args, **kwargs):
        raise RuntimeError("the loop is not part of this test")

    if retained:
        monkeypatch.setattr(cpos_launch, "prepare", prepared_with_retained)
    monkeypatch.setattr(cpos_launch, "run_live_handoffs", not_run)
    monkeypatch.delenv(cpos_launch.PARALLEL_VARIABLE, raising=False)
    monkeypatch.setenv("COPILOT_GITHUB_TOKEN", DUMMY_KEY)
    monkeypatch.setenv("COPILOT_CLI_PATH", str(Path(__file__)))
    context, drop = workspace(tmp_path)
    argv = [
        *("--context", str(context), "--sources", str(drop), "--config", CONFIG, "--cap", "25"),
        *("--out", str(tmp_path / "out"), "--no-library", "--prior", "none"),
        *("--live", "--ruling", str(RULING)),
        *(() if asked is None else ("--parallel-modules", asked)),
    ]
    assert cpos_launch.main(argv) == 1
    lines = [line for line in capsys.readouterr().out.splitlines() if line.startswith("Parallel")]
    if said is None:
        assert lines == []
        return
    (line,) = lines
    assert line.startswith(said)
    if retained:
        assert line.endswith("the plan has retained handoffs")
        assert "at once" not in line


def test_the_synthetic_run_is_the_same_tree_one_at_a_time_and_in_parallel(tmp_path, monkeypatch):
    """Scope: the synthetic proof case through the launcher, `HandoffExecutor`, the budget, the
    delivery and the library build, with canned replies (no model, no latency). The earlier a
    module is in the plan, the longer its canned reply takes here, so modules after it finish
    their model work first and must wait for it."""
    # Freeze publication time so the content-addressed completion records can be compared.
    monkeypatch.setattr(
        cpos, "datetime", SimpleNamespace(now=lambda tz: datetime(2026, 1, 29, tzinfo=tz))
    )
    reply = launcher.canned_handoff
    order = Case(tmp_path / "plan").ordered

    def slow_first(context, case, *, gated=False):
        time.sleep(0.01 * (len(order) - order.index(context["module_id"])))
        return reply(context, case, gated=gated)

    monkeypatch.setattr(launcher, "canned_handoff", slow_first)
    monkeypatch.delenv(cpos_launch.PARALLEL_VARIABLE, raising=False)
    serial = _launched(tmp_path / "serial", "1", monkeypatch)
    default = _launched(tmp_path / "default", None, monkeypatch)
    two = _launched(tmp_path / "two", "2", monkeypatch)
    widest = _launched(tmp_path / "widest", str(MAX_MODULE_WIDTH), monkeypatch)
    assert any(name.startswith("runs/example-run/deliveries/") for name in serial)
    assert "library/data.js" in serial and len(serial) > 200
    assert serial == default
    assert serial == two
    assert serial == widest

    def named(run: str) -> list[tuple[str, str | None]]:
        events = read_events(tmp_path / run / "runs" / "example-run" / EVENTS)
        return [(e["event"], e.get("module")) for e in events]

    # the default run is one at a time: every module is accepted before the next one starts
    marks = [n for n in named("default") if n[0] in ("module_started", "module_accepted")]
    assert marks == [(e, m) for m in order for e in ("module_started", "module_accepted")]
    widths = {
        run: read_events(tmp_path / run / "runs" / "example-run" / EVENTS)[0]
        for run in ("default", "two")
    }
    assert [widths[run]["modules_at_once"] for run in ("default", "two")] == [1, 2]
    # and the width-2 run did overlap: CP-1A started before CP-1 was accepted
    events = read_events(tmp_path / "two" / "runs" / "example-run" / EVENTS)
    names = named("two")
    assert names.index(("module_started", "CP-1A")) < names.index(("module_accepted", "CP-1"))
    assert [m for e, m in names if e == "module_accepted"] == list(order)
    states = progress(events)
    assert set(states.modules.values()) == {"done"} and states.delivered
