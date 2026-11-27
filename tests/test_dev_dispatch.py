from __future__ import annotations

import json
import time
from pathlib import Path

import pytest

from tools.dev_dispatch import CodexRequest, rpc_read, run_codex


class FakeInput:
    def __init__(self) -> None:
        self.value = b""

    def write(self, value: bytes) -> int:
        self.value += value
        return len(value)

    def flush(self) -> None:
        return None


class FakeOutput:
    def __init__(self, messages: list[dict[str, object]]) -> None:
        self.messages = bytearray(b"".join(json.dumps(item).encode() + b"\n" for item in messages))

    def fileno(self) -> int:
        return 10


class FakeProcess:
    def __init__(self, messages: list[dict[str, object]]) -> None:
        self.stdin = FakeInput()
        self.stdout = FakeOutput(messages)


def test_rpc_reader_preserves_buffered_messages(monkeypatch: pytest.MonkeyPatch) -> None:
    from tools import dev_dispatch

    ready_messages = [
        {"id": 1, "result": {"ok": True}},
        {"id": 2, "result": {"model": "gpt-6.2-luna"}},
    ]
    process = FakeProcess(ready_messages)

    def ready(*_args: object) -> tuple[list[object], list[object], list[object]]:
        return ([process.stdout], [], [])

    def read(_fd: int, _size: int) -> bytes:
        output = bytes(process.stdout.messages)
        process.stdout.messages.clear()
        return output

    monkeypatch.setattr(dev_dispatch.select, "select", ready)
    monkeypatch.setattr(dev_dispatch.os, "read", read)
    buffer = bytearray()
    deadline = time.monotonic() + 1
    assert rpc_read(process, deadline, buffer) == ready_messages[0]
    assert rpc_read(process, deadline, buffer) == ready_messages[1]


def test_codex_thread_identity_and_final_text_are_observed(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    from tools import dev_dispatch

    root = tmp_path.resolve()
    thread_response = {
        "id": 2,
        "result": {
            "cwd": str(root),
            "model": "gpt-6.2-luna",
            "modelProvider": "openai",
            "reasoningEffort": "low",
            "approvalPolicy": "never",
            "sandbox": {
                "type": "workspaceWrite",
                "networkAccess": False,
                "excludeSlashTmp": True,
                "excludeTmpdirEnvVar": True,
                "writableRoots": [str(root)],
            },
            "thread": {"id": "thread-1"},
        },
    }
    turn_response = {"id": 3, "result": {"turn": {"id": "turn-1"}}}
    completed = {
        "method": "turn/completed",
        "params": {
            "threadId": "thread-1",
            "turn": {
                "id": "turn-1",
                "status": "completed",
                "durationMs": 1000,
                "items": [{"id": "a", "type": "agentMessage", "text": "Ready"}],
            },
        },
    }

    class Process:
        def __init__(self, *_args: object, **_kwargs: object) -> None:
            self.stdin = FakeInput()
            self.stdout = FakeOutput(
                [
                    {"id": 1, "result": {}},
                    {
                        "id": 4,
                        "result": {"account": {"type": "chatgpt", "planType": "plus"}},
                    },
                    thread_response,
                    turn_response,
                    completed,
                ]
            )

        def poll(self) -> int:
            return 0

        def wait(self, timeout: int) -> int:
            return 0

    def ready(*_args: object) -> tuple[list[object], list[object], list[object]]:
        return ([process.stdout], [], [])

    def read(_fd: int, _size: int) -> bytes:
        output = bytes(process.stdout.messages)
        process.stdout.messages.clear()
        return output

    process = Process()
    monkeypatch.setattr(dev_dispatch.subprocess, "Popen", Process)
    monkeypatch.setattr(dev_dispatch.select, "select", ready)
    monkeypatch.setattr(dev_dispatch.os, "read", read)

    result = run_codex(
        CodexRequest(["codex", "app-server"], root, "Say Ready", "gpt-6.2-luna", "low", 10)
    )
    assert result["model"] == "gpt-6.2-luna"
    assert result["effort"] == "low"
    assert result["status"] == "completed"
    assert result["final_text"] == "Ready"
    assert result["turn_result_received"] is True


def test_codex_dispatch_fails_closed_on_wrong_resolved_effort(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    from tools import dev_dispatch

    root = tmp_path.resolve()
    thread_response = {
        "id": 2,
        "result": {
            "cwd": str(root),
            "model": "gpt-6.2-luna",
            "modelProvider": "openai",
            "reasoningEffort": "medium",
            "approvalPolicy": "never",
            "sandbox": {
                "type": "workspaceWrite",
                "networkAccess": False,
                "excludeSlashTmp": True,
                "excludeTmpdirEnvVar": True,
                "writableRoots": [str(root)],
            },
            "thread": {"id": "thread-1"},
        },
    }

    class Process:
        def __init__(self, *_args: object, **_kwargs: object) -> None:
            self.stdin = FakeInput()
            self.stdout = FakeOutput(
                [
                    {"id": 1, "result": {}},
                    {
                        "id": 4,
                        "result": {"account": {"type": "chatgpt", "planType": "plus"}},
                    },
                    thread_response,
                ]
            )
            self.killed = False

        def poll(self) -> int | None:
            return None if not self.killed else -9

        def kill(self) -> None:
            self.killed = True

        def wait(self, timeout: int) -> int:
            return -9

    process = Process()

    def ready(*_args: object) -> tuple[list[object], list[object], list[object]]:
        return ([process.stdout], [], [])

    def read(_fd: int, _size: int) -> bytes:
        output = bytes(process.stdout.messages)
        process.stdout.messages.clear()
        return output

    monkeypatch.setattr(dev_dispatch.subprocess, "Popen", lambda *_a, **_k: process)
    monkeypatch.setattr(dev_dispatch.select, "select", ready)
    monkeypatch.setattr(dev_dispatch.os, "read", read)

    with pytest.raises(RuntimeError, match="route or sandbox mismatch"):
        run_codex(
            CodexRequest(["codex", "app-server"], root, "Say Ready", "gpt-6.2-luna", "low", 10)
        )
    assert process.killed


def test_codex_subscription_route_rejects_api_key_auth(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    from tools import dev_dispatch

    class Process:
        def __init__(self, *_args: object, **_kwargs: object) -> None:
            self.stdin = FakeInput()
            self.stdout = FakeOutput(
                [
                    {"id": 1, "result": {}},
                    {"id": 4, "result": {"account": {"type": "apiKey"}}},
                ]
            )
            self.killed = False

        def poll(self) -> int | None:
            return None if not self.killed else -9

        def kill(self) -> None:
            self.killed = True

        def wait(self, timeout: int) -> int:
            return -9

    process = Process()

    def ready(*_args: object) -> tuple[list[object], list[object], list[object]]:
        return ([process.stdout], [], [])

    def read(_fd: int, _size: int) -> bytes:
        output = bytes(process.stdout.messages)
        process.stdout.messages.clear()
        return output

    monkeypatch.setattr(dev_dispatch.subprocess, "Popen", lambda *_a, **_k: process)
    monkeypatch.setattr(dev_dispatch.select, "select", ready)
    monkeypatch.setattr(dev_dispatch.os, "read", read)
    with pytest.raises(RuntimeError, match="not verified as a ChatGPT subscription"):
        run_codex(
            CodexRequest(["codex", "app-server"], tmp_path, "read only", "gpt-6-luna", "low", 10)
        )
    assert b"thread/start" not in process.stdin.value
    assert process.killed


def test_writer_rejects_unrelated_origin(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    from tools import dev_dispatch

    root = tmp_path.resolve()

    def output(command: list[str], **_kwargs: object) -> str:
        if "--show-toplevel" in command:
            return str(root)
        return "https://github.com/attacker/unrelated.git"

    monkeypatch.setattr(dev_dispatch.subprocess, "check_output", output)
    with pytest.raises(ValueError, match="origin is not Credit OS2"):
        dev_dispatch.validate_worktree(root, "0123456789abcdef0123456789abcdef01234567")


def test_writer_requires_a_full_git_base(tmp_path: Path) -> None:
    from tools.dev_dispatch import validate_worktree

    with pytest.raises(ValueError, match="full Git object ID"):
        validate_worktree(tmp_path, "main")


def test_approved_spec_and_plan_must_match_the_worker_checkout(tmp_path: Path) -> None:
    import hashlib

    from tools.dev_dispatch import verify_worktree_documents

    coordinator = tmp_path / "coordinator"
    worker = tmp_path / "worker"
    coordinator.mkdir()
    worker.mkdir()
    approved = coordinator / "spec.md"
    candidate = worker / "spec.md"
    approved.write_text("approved spec")
    candidate.write_text("approved spec")
    expected = hashlib.sha256(approved.read_bytes()).hexdigest()
    verify_worktree_documents(coordinator, worker, {approved: expected})
    candidate.write_text("modified spec")
    with pytest.raises(ValueError, match="does not contain the approved"):
        verify_worktree_documents(coordinator, worker, {approved: expected})


def test_approved_document_symlink_cannot_escape_worker_checkout(tmp_path: Path) -> None:
    import hashlib

    from tools.dev_dispatch import verify_worktree_documents

    coordinator = tmp_path / "coordinator"
    worker = tmp_path / "worker"
    coordinator.mkdir()
    worker.mkdir()
    approved = coordinator / "spec.md"
    approved.write_text("approved spec")
    candidate = worker / "spec.md"
    candidate.symlink_to(approved)
    expected = hashlib.sha256(approved.read_bytes()).hexdigest()

    with pytest.raises(ValueError, match="does not contain the approved"):
        verify_worktree_documents(coordinator, worker, {approved: expected})


def test_writer_rejects_origin_main_moving_after_approval(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    from tools import dev_dispatch

    root = tmp_path.resolve()
    base_sha = "0123456789abcdef0123456789abcdef01234567"
    current_sha = "1123456789abcdef0123456789abcdef01234567"

    def output(command: list[str], **_kwargs: object) -> str:
        if "--show-toplevel" in command:
            return str(root)
        if "get-url" in command:
            return "https://github.com/EricMG13/credit-os2.git"
        if "--git-common-dir" in command:
            return "/shared/credit-os2/.git"
        if "origin/main" in command:
            return current_sha
        return ""

    monkeypatch.setattr(dev_dispatch.subprocess, "check_output", output)
    with pytest.raises(ValueError, match="origin/main moved"):
        dev_dispatch.validate_worktree(root, base_sha)


@pytest.mark.parametrize(
    "account",
    [
        {"type": "apiKey"},
        {"type": "chatgpt", "planType": "free"},
        {"type": "chatgpt", "planType": "unknown"},
        {"type": "chatgpt", "planType": "self_serve_business_usage_based"},
    ],
)
def test_unsuitable_billing_stops_before_thread_start(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, account: dict[str, str]
) -> None:
    from tools import dev_dispatch

    process = FakeProcess([])
    monkeypatch.setattr(dev_dispatch.subprocess, "Popen", lambda *args, **kwargs: process)
    monkeypatch.setattr(dev_dispatch.os, "killpg", lambda *args: None)
    monkeypatch.setattr(process, "poll", lambda: 0, raising=False)
    monkeypatch.setattr(process, "wait", lambda **kwargs: 0, raising=False)
    monkeypatch.setattr(
        dev_dispatch,
        "rpc_response",
        lambda _process, request_id, *_: {"account": account} if request_id == 4 else {},
    )
    request = CodexRequest(["codex"], tmp_path, "Reply OK", "gpt-6.2-astra", "medium", 30)
    with pytest.raises(RuntimeError, match="ChatGPT subscription"):
        run_codex(request)
    assert b"thread/start" not in process.stdin.value


def test_existing_high_effort_route_cannot_reserve_worker(tmp_path: Path) -> None:
    import argparse

    from tools.dev_dispatch import DispatchContext, admit_dispatch, digest
    from tools.dev_ledger import connect, start_run
    from tools.dev_route import Cohort, owner_route, resolve_route

    db_path = tmp_path / "dev.sqlite"
    doc = tmp_path / "approved.md"
    doc.write_text("approved fixture")
    sha = digest(doc)
    context_args = argparse.Namespace(run="run", attempt="attempt", revision=1, reserve=0)
    cohort = Cohort(
        client="codex",
        environment="local",
        role="builder",
        task_family="smoke",
        risk="low",
        policy_epoch="legacy",
        scoring_protocol="test",
    )
    cohort_path = tmp_path / "cohort.json"
    cohort_path.write_text(cohort.model_dump_json())
    high = {"model": "gpt-6.2-astra", "effort": "high"}
    route_path = tmp_path / "route.json"
    route_path.write_text(json.dumps(high))
    owner_route(db_path, cohort_path, route_path, "D-OLD", "previous approval")
    context = DispatchContext(
        context_args,
        cohort,
        resolve_route(db_path, cohort),
        "",
        tmp_path,
        tmp_path,
        {doc: sha},
        doc,
        doc,
    )
    with connect(db_path) as db:
        start_run(db, argparse.Namespace(run="run", spec=sha, plan=sha, cap=0, workers=1))
        with pytest.raises(ValueError, match="outside the approved policy"), db:
            admit_dispatch(db, context, [high])
        assert db.execute("SELECT count(*) FROM attempts").fetchone()[0] == 0
        assert (
            db.execute("SELECT count(*) FROM events WHERE kind='route-resolved'").fetchone()[0] == 0
        )


def test_rpc_deadline_is_not_reset_by_partial_messages(monkeypatch: pytest.MonkeyPatch) -> None:
    from tools import dev_dispatch

    process = FakeProcess([])
    now = iter([1.0, 2.0, 4.0])
    waits: list[float] = []

    def ready(*args: object) -> tuple[list[object], list[object], list[object]]:
        waits.append(float(str(args[-1])))
        return ([process.stdout], [], [])

    monkeypatch.setattr(dev_dispatch.time, "monotonic", lambda: next(now))
    monkeypatch.setattr(dev_dispatch.select, "select", ready)
    monkeypatch.setattr(dev_dispatch.os, "read", lambda *_: b"{")

    with pytest.raises(dev_dispatch.subprocess.TimeoutExpired):
        rpc_read(process, 4.0, bytearray())
    assert waits == [3.0, 2.0]


@pytest.mark.parametrize(
    "notification",
    [
        {"method": "model/rerouted", "params": {"model": "another-model"}},
        {"method": "thread/settings/updated", "params": {"threadSettings": {"effort": "high"}}},
    ],
)
def test_unapproved_worker_route_interrupts_before_more_rpc_reads(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, notification: dict[str, object]
) -> None:
    from tools import dev_dispatch

    responses = iter([{"id": 3, "result": {"turn": {"id": "t-1"}}}, notification])
    monkeypatch.setattr(dev_dispatch, "rpc_read", lambda *_: next(responses))
    request = CodexRequest(["codex"], tmp_path, "Reply OK", "gpt-6.2-astra", "medium", 30)
    turn, rerouted, changes, receipt = dev_dispatch._await_turn(
        FakeProcess([]), request, "thread-1", time.monotonic() + 30, bytearray()
    )
    assert turn == {"status": "interrupted"}
    assert rerouted and changes and receipt is not None
