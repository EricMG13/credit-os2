"""Dispatch one approved local worker and record its resolved route.

The command uses the native Codex or Claude CLI. It requires a durable approved
run, exact approved document digests, and a route resolved from the local registry.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import select
import signal
import sqlite3
import subprocess
import sys
import time
from contextlib import redirect_stdout
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.dev_ledger import connect, event, launch_run, settle_run, valid_route
from tools.dev_route import (
    Cohort,
    canary_attempt_key,
    claim_canary,
    cohort_key,
    ensure_registry_schema,
    resolve_route,
    resolve_route_db,
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cli_command(client: str, model: str, effort: str, cwd: Path, prompt: str) -> list[str]:
    if client == "codex":
        return ["codex", "app-server", "--listen", "stdio://"]
    if client == "claude":
        return [
            "claude",
            "--print",
            "--output-format",
            "stream-json",
            "--verbose",
            "--no-session-persistence",
            "--effort",
            effort,
            "--model",
            model,
            "--add-dir",
            str(cwd),
            prompt,
        ]
    raise ValueError(f"unsupported local client: {client}")


def rpc_send(process: subprocess.Popen[bytes], message: dict[str, Any]) -> None:
    if process.stdin is None:
        raise RuntimeError("app-server stdin is unavailable")
    process.stdin.write((json.dumps(message) + "\n").encode())
    process.stdin.flush()


def rpc_read(
    process: subprocess.Popen[bytes], deadline: float, buffer: bytearray
) -> dict[str, Any]:
    if process.stdout is None:
        raise RuntimeError("app-server stdout is unavailable")
    while b"\n" not in buffer:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise subprocess.TimeoutExpired("codex app-server", 0)
        ready, _, _ = select.select([process.stdout], [], [], remaining)
        if not ready:
            raise subprocess.TimeoutExpired("codex app-server", remaining)
        chunk = os.read(process.stdout.fileno(), 4096)
        if not chunk:
            raise RuntimeError("Codex app-server exited before replying")
        buffer.extend(chunk)
    line, _, remainder = buffer.partition(b"\n")
    buffer[:] = remainder
    message = json.loads(line)
    if not isinstance(message, dict):
        raise TypeError("Codex app-server returned a non-object message")
    return message


def rpc_response(
    process: subprocess.Popen[bytes], request_id: int, deadline: float, buffer: bytearray
) -> dict[str, Any]:
    while True:
        message = rpc_read(process, deadline, buffer)
        if message.get("id") != request_id:
            continue
        if "error" in message:
            raise RuntimeError(f"Codex app-server request failed: {message['error']}")
        result = message.get("result")
        if not isinstance(result, dict):
            raise TypeError("Codex app-server response is missing its result")
        return result


@dataclass(frozen=True)
class CodexRequest:
    command: list[str]
    cwd: Path
    prompt: str
    model: str
    effort: str
    timeout: int
    sandbox_mode: str = "workspace-write"


@dataclass(frozen=True)
class RunApproval:
    run: str
    revision: int
    spec_digest: str
    plan_digest: str
    base_sha: str
    now: int


@dataclass(frozen=True)
class DispatchContext:
    args: argparse.Namespace
    cohort: Cohort
    resolved: dict[str, Any]
    prompt: str
    cwd: Path
    coordinator: Path
    approved_documents: dict[Path, str]
    spec_path: Path
    plan_path: Path


@dataclass(frozen=True)
class DispatchOutcome:
    result: dict[str, Any]
    returncode: int
    elapsed_seconds: float


def _verify_subscription(
    process: subprocess.Popen[bytes], deadline: float, buffer: bytearray
) -> dict[str, Any]:
    rpc_send(
        process,
        {
            "id": 1,
            "method": "initialize",
            "params": {
                "clientInfo": {
                    "name": "credit-os2-dev-coordinator",
                    "title": "Credit OS2 development coordinator",
                    "version": "1",
                }
            },
        },
    )
    rpc_response(process, 1, deadline, buffer)
    rpc_send(process, {"method": "initialized", "params": {}})
    rpc_send(process, {"id": 4, "method": "account/read", "params": {"refreshToken": False}})
    account_response = rpc_response(process, 4, deadline, buffer)
    account = account_response.get("account")
    if (
        not isinstance(account, dict)
        or account.get("type") != "chatgpt"
        or account.get("planType") not in ("go", "plus", "pro", "prolite", "promax")
    ):
        raise RuntimeError("Codex local account is not verified as a ChatGPT subscription")
    return account


def _start_thread(
    process: subprocess.Popen[bytes], request: CodexRequest, deadline: float, buffer: bytearray
) -> dict[str, Any]:
    rpc_send(
        process,
        {
            "id": 2,
            "method": "thread/start",
            "params": {
                "cwd": str(request.cwd),
                "model": request.model,
                "ephemeral": True,
                "sandbox": request.sandbox_mode,
                "approvalPolicy": "never",
                "config": {
                    "model_reasoning_effort": request.effort,
                    "sandbox_workspace_write": {
                        "writable_roots": [str(request.cwd)],
                        "exclude_slash_tmp": True,
                        "exclude_tmpdir_env_var": True,
                        "network_access": False,
                    },
                },
            },
        },
    )
    return rpc_response(process, 2, deadline, buffer)


def _validate_thread(thread: dict[str, Any], request: CodexRequest) -> tuple[str, list[Path]]:
    sandbox = thread.get("sandbox")
    if not isinstance(sandbox, dict):
        raise TypeError("Codex app-server returned an invalid sandbox policy")
    if (
        thread.get("model") != request.model
        or thread.get("modelProvider") != "openai"
        or thread.get("reasoningEffort") != request.effort
        or thread.get("cwd") != str(request.cwd)
        or thread.get("approvalPolicy") != "never"
        or sandbox.get("networkAccess", False)
        or not _sandbox_matches(sandbox, request)
    ):
        raise RuntimeError(
            "Codex app-server route or sandbox mismatch: "
            + json.dumps(
                {
                    "model": thread.get("model"),
                    "model_provider": thread.get("modelProvider"),
                    "effort": thread.get("reasoningEffort"),
                    "cwd": thread.get("cwd"),
                    "approval_policy": thread.get("approvalPolicy"),
                    "sandbox": sandbox,
                },
                sort_keys=True,
            )
        )
    roots = sandbox.get("writableRoots", [])
    if not isinstance(roots, list) or not all(isinstance(path, str) for path in roots):
        raise RuntimeError("Codex app-server returned invalid writable roots")
    writable_roots = [Path(path).resolve() for path in roots]
    if request.sandbox_mode == "workspace-write" and any(
        root != request.cwd for root in writable_roots
    ):
        raise RuntimeError(
            "Codex app-server writable roots differ from the single approved project"
        )
    if request.sandbox_mode == "read-only" and writable_roots:
        raise RuntimeError("read-only Codex smoke unexpectedly has writable roots")
    thread_data = thread.get("thread")
    thread_id = thread_data.get("id") if isinstance(thread_data, dict) else None
    if not isinstance(thread_id, str) or not thread_id:
        raise RuntimeError("Codex app-server did not return a thread ID")
    return thread_id, writable_roots


def _sandbox_matches(sandbox: dict[str, Any], request: CodexRequest) -> bool:
    if request.sandbox_mode == "read-only":
        return sandbox.get("type") == "readOnly"
    return (
        sandbox.get("type") == "workspaceWrite"
        and sandbox.get("excludeSlashTmp") is True
        and sandbox.get("excludeTmpdirEnvVar") is True
        and sandbox.get("writableRoots", []) in ([], [str(request.cwd)])
    )


def _await_turn(
    process: subprocess.Popen[bytes],
    request: CodexRequest,
    thread_id: str,
    deadline: float,
    buffer: bytearray,
) -> tuple[dict[str, Any], bool, list[dict[str, Any]], dict[str, Any] | None]:
    turn_result: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        message = rpc_read(process, deadline, buffer)
        if "method" in message and "id" in message and message.get("id") != 3:
            raise RuntimeError("worker requested an unsupported approval")
        if message.get("id") == 3:
            if "error" in message:
                raise RuntimeError(f"Codex turn failed to start: {message['error']}")
            result = message.get("result")
            turn_result = result if isinstance(result, dict) else None
        if message.get("method") == "model/rerouted":
            route_change = message.get("params", {})
            if not isinstance(route_change, dict):
                raise RuntimeError("Codex app-server returned invalid route-change metadata")
            return {"status": "interrupted"}, True, [route_change], turn_result
        if message.get("method") == "thread/settings/updated":
            params = message.get("params", {})
            settings = params.get("threadSettings", {}) if isinstance(params, dict) else {}
            if not _settings_match(settings, request):
                mismatch = settings if isinstance(settings, dict) else {}
                return {"status": "interrupted"}, True, [mismatch], turn_result
        if message.get("method") == "turn/completed":
            return _completed_turn(message, thread_id, turn_result), False, [], turn_result
    raise subprocess.TimeoutExpired(request.command, request.timeout)


def _settings_match(settings: object, request: CodexRequest) -> bool:
    if not isinstance(settings, dict):
        return False
    policy = settings.get("sandboxPolicy")
    return (
        isinstance(policy, dict)
        and settings.get("model") == request.model
        and settings.get("effort") == request.effort
        and settings.get("approvalPolicy") == "never"
        and _sandbox_matches(policy, request)
        and not policy.get("networkAccess", False)
    )


def _completed_turn(
    message: dict[str, Any], thread_id: str, turn_result: dict[str, Any] | None
) -> dict[str, Any]:
    params = message.get("params", {})
    if not isinstance(params, dict) or params.get("threadId") != thread_id:
        raise RuntimeError("Codex completed a different thread")
    turn = params.get("turn", {})
    if not isinstance(turn, dict):
        raise TypeError("Codex app-server returned an invalid completed turn")
    start_turn = turn_result.get("turn", {}) if isinstance(turn_result, dict) else {}
    expected_turn = start_turn.get("id") if isinstance(start_turn, dict) else None
    if expected_turn and turn.get("id") != expected_turn:
        raise RuntimeError("Codex completed a different turn")
    return turn


def run_codex(request: CodexRequest) -> dict[str, Any]:
    process = subprocess.Popen(
        request.command,
        cwd=request.cwd,
        bufsize=0,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    started = time.monotonic()
    deadline = started + request.timeout
    buffer = bytearray()
    try:
        account = _verify_subscription(process, deadline, buffer)
        thread = _start_thread(process, request, deadline, buffer)
        thread_id, writable_roots = _validate_thread(thread, request)
        sandbox = cast(dict[str, Any], thread["sandbox"])
        rpc_send(
            process,
            {
                "id": 3,
                "method": "turn/start",
                "params": {
                    "threadId": thread_id,
                    "model": request.model,
                    "effort": request.effort,
                    "cwd": str(request.cwd),
                    "input": [{"type": "text", "text": request.prompt}],
                },
            },
        )
        turn, rerouted, reroutes, turn_result = _await_turn(
            process, request, thread_id, deadline, buffer
        )
        return {
            "thread_id": thread_id,
            "model": thread["model"],
            "model_provider": thread.get("modelProvider"),
            "effort": thread["reasoningEffort"],
            "account_type": account["type"],
            "plan_type": account["planType"],
            "status": turn.get("status"),
            "rerouted": rerouted,
            "reroutes": reroutes,
            "error": "Worker interrupted after the approved route changed" if rerouted else None,
            "turn_id": turn.get("id"),
            "duration_ms": turn.get("durationMs"),
            "started_at": turn.get("startedAt"),
            "completed_at": turn.get("completedAt"),
            "turn_result_received": turn_result is not None,
            "sandbox_roots": [str(request.cwd), *(str(path) for path in writable_roots)],
            "sandbox": {
                "type": sandbox["type"],
                "network_access": sandbox.get("networkAccess", False),
                "exclude_slash_tmp": sandbox.get("excludeSlashTmp"),
                "exclude_tmpdir_env_var": sandbox.get("excludeTmpdirEnvVar"),
            },
            "final_text": "\n\n".join(
                item.get("text", "")
                for item in turn.get("items", [])
                if isinstance(item, dict) and item.get("type") == "agentMessage"
            ),
        }
    finally:
        if process.poll() is None:
            process_group = getattr(process, "pid", None)
            if process_group is None:
                process.kill()
            else:
                try:
                    os.killpg(process_group, signal.SIGTERM)
                    process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    try:
                        os.killpg(process_group, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                except ProcessLookupError:
                    pass
        process.wait(timeout=5)


def check_run(db: sqlite3.Connection, approval: RunApproval) -> tuple[int, int]:
    row = db.execute("SELECT * FROM runs WHERE id=?", (approval.run,)).fetchone()
    deadline = db.execute("SELECT expires FROM deadlines WHERE run=?", (approval.run,)).fetchone()
    if row is None or row["revision"] != approval.revision or row["state"] != "approved":
        raise ValueError("run is unknown, paused, or at a stale revision")
    if (approval.spec_digest, approval.plan_digest) != (row["spec"], row["plan"]):
        raise ValueError("spec or plan differs from the approved content")
    if approval.base_sha.lower() != row["base_sha"]:
        raise ValueError("worker base differs from the approved integration base")
    expires = deadline["expires"] if deadline else approval.now + 86400
    if expires <= approval.now:
        raise ValueError("approved run deadline has elapsed")
    return row["cap"], expires


def validate_worktree(cwd: Path, approved_base: str) -> Path:
    if re.fullmatch(r"[a-fA-F0-9]{40,64}", approved_base) is None:
        raise ValueError("approved base must be a full Git object ID")
    root = Path(
        subprocess.check_output(
            ["git", "-C", str(cwd), "rev-parse", "--show-toplevel"], text=True
        ).strip()
    ).resolve()
    if root != cwd:
        raise ValueError("worker directory must be the Credit OS2 worktree root")
    remote = subprocess.check_output(
        ["git", "-C", str(root), "remote", "get-url", "origin"], text=True
    ).strip()
    canonical_remote = remote.rstrip("/").removesuffix(".git").lower()
    if canonical_remote not in {
        "https://github.com/ericmg13/credit-os2",
        "git@github.com:ericmg13/credit-os2",
    }:
        raise ValueError("worker worktree origin is not Credit OS2")
    coordinator = Path(__file__).resolve().parents[1]
    common_dir = Path(
        subprocess.check_output(
            ["git", "-C", str(root), "rev-parse", "--path-format=absolute", "--git-common-dir"],
            text=True,
        ).strip()
    ).resolve()
    coordinator_common = Path(
        subprocess.check_output(
            [
                "git",
                "-C",
                str(coordinator),
                "rev-parse",
                "--path-format=absolute",
                "--git-common-dir",
            ],
            text=True,
        ).strip()
    ).resolve()
    if common_dir != coordinator_common:
        raise ValueError("worker worktree does not share the coordinator's Credit OS2 repository")
    current_base = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "--verify", "origin/main"], text=True
    ).strip()
    if current_base.lower() != approved_base.lower():
        raise ValueError("origin/main moved after the approved base was recorded")
    worktrees = subprocess.check_output(
        ["git", "-C", str(root), "worktree", "list", "--porcelain"], text=True
    )
    primary = Path(worktrees.splitlines()[0].removeprefix("worktree ")).resolve()
    if root == primary:
        raise ValueError("writers must run in a separate Credit OS2 worktree")
    base = subprocess.run(
        ["git", "-C", str(root), "merge-base", "--is-ancestor", approved_base, "HEAD"],
        check=False,
        capture_output=True,
        text=True,
    )
    if base.returncode != 0:
        raise ValueError("approved base is not an ancestor of the worker worktree")
    changed = subprocess.check_output(
        ["git", "-C", str(root), "status", "--porcelain", "--untracked-files=all"],
        text=True,
    )
    if changed.strip():
        raise ValueError("writer worktree must be clean before dispatch")
    return coordinator


def verify_worktree_documents(coordinator: Path, cwd: Path, documents: dict[Path, str]) -> None:
    for approved_path, expected_digest in documents.items():
        if not approved_path.is_relative_to(coordinator):
            continue
        candidate_path = cwd / approved_path.relative_to(coordinator)
        if (
            not candidate_path.resolve().is_relative_to(cwd)
            or not candidate_path.is_file()
            or digest(candidate_path) != expected_digest
        ):
            raise ValueError("worker worktree does not contain the approved spec and plan")


def prepare_dispatch(args: argparse.Namespace) -> DispatchContext:
    route_data = Cohort.model_validate_json(args.cohort.read_bytes())
    if route_data.client != args.client or route_data.environment != "local":
        raise ValueError("dispatch client or environment differs from the local cohort")
    if args.registry.resolve() != args.db.resolve():
        raise ValueError("route registry and coordinator ledger must share one database")
    resolved = cast(dict[str, Any], resolve_route(args.registry, route_data))
    route = cast(dict[str, Any], resolved["route"])
    if not route.get("model") or not route.get("effort") or not resolved.get("decision_id"):
        raise ValueError("route registry returned an incomplete decision")

    prompt = args.prompt.read_text()
    spec_path = args.spec.resolve(strict=True)
    plan_path = args.plan.resolve(strict=True)
    spec_bytes = spec_path.read_bytes()
    plan_bytes = plan_path.read_bytes()
    approved_spec = hashlib.sha256(spec_bytes).hexdigest()
    approved_plan = hashlib.sha256(plan_bytes).hexdigest()
    spec_text = spec_bytes.decode("utf-8")
    plan_text = plan_bytes.decode("utf-8")
    prompt = json.dumps(
        {
            "instruction": "Use the approved spec and plan as binding task context.",
            "approved_spec_sha256": approved_spec,
            "approved_spec": spec_text,
            "approved_plan_sha256": approved_plan,
            "approved_plan": plan_text,
            "requested_outcome": prompt,
        },
        ensure_ascii=False,
        indent=2,
    )
    cwd = args.cwd.resolve(strict=True)
    coordinator = validate_worktree(cwd, args.base)
    approved_documents = {spec_path: approved_spec, plan_path: approved_plan}
    verify_worktree_documents(coordinator, cwd, approved_documents)
    return DispatchContext(
        args,
        route_data,
        resolved,
        prompt,
        cwd,
        coordinator,
        approved_documents,
        spec_path,
        plan_path,
    )


def authorize_dispatch(
    db: sqlite3.Connection, context: DispatchContext
) -> tuple[list[dict[str, Any]], int]:
    args = context.args
    policy_row = db.execute(
        "SELECT policy FROM dispatch_policies WHERE run=?", (args.run,)
    ).fetchone()
    if policy_row is None:
        raise ValueError("run has no approved dispatch policy")
    policy = json.loads(policy_row["policy"])
    permitted_routes = policy.get("routes", [])
    if policy.get("client") != args.client:
        raise ValueError("resolved client or route is outside the approved policy")
    if args.client != "codex":
        raise ValueError("Claude effort identity is not exposed by its local CLI protocol")
    if policy.get("unmetered") is not True or args.reserve != 0:
        raise ValueError("only an explicitly approved unmetered native route is supported")
    if args.timeout < 1 or args.timeout > policy.get("max_attempt_seconds", 0):
        raise ValueError("timeout is outside the approved per-attempt limit")
    if args.db.resolve().is_relative_to(context.cwd):
        raise ValueError("ledger and route registry must be outside the worker directory")

    cap, expires = check_run(
        db,
        RunApproval(
            args.run,
            args.revision,
            context.approved_documents[context.spec_path],
            context.approved_documents[context.plan_path],
            args.base,
            int(time.time()),
        ),
    )
    if args.reserve > cap or args.reserve < 0:
        raise ValueError("reservation is outside the approved run ceiling")
    remaining_seconds = min(args.timeout, expires - int(time.time()))
    if remaining_seconds < 1:
        raise ValueError("not enough time remains in the approved run")
    return permitted_routes, remaining_seconds


def admit_dispatch(
    db: sqlite3.Connection, context: DispatchContext, permitted_routes: list[dict[str, Any]]
) -> dict[str, Any]:
    args, route_data, resolved = context.args, context.cohort, context.resolved
    selected = dict(resolved)
    launch = argparse.Namespace(
        run=args.run,
        id=args.attempt,
        expected_revision=args.revision,
        reserve=args.reserve,
        spec=digest(context.spec_path),
        plan=digest(context.plan_path),
    )

    def admit(connection: sqlite3.Connection) -> None:
        current = cast(dict[str, Any], resolve_route_db(connection, route_data))
        if (
            current.get("decision_id") != resolved["decision_id"]
            or current.get("route") != resolved["route"]
        ):
            raise ValueError("route changed while worker admission was pending")
        selected.clear()
        selected.update(current)
        if selected.get("canary_pending"):
            selected.update(
                claim_canary(
                    connection,
                    route_data,
                    canary_attempt_key(args.run, args.attempt),
                )
            )
        current_route = cast(dict[str, Any], selected["route"])
        allowed = valid_route(current_route) and any(
            item.get("model") == current_route.get("model")
            and item.get("effort") == current_route.get("effort")
            for item in permitted_routes
        )
        if not allowed or not selected.get("decision_id"):
            raise ValueError("resolved route is outside the approved policy")
        event(
            connection,
            args.run,
            f"route:{args.attempt}",
            "route-resolved",
            {
                "decision_id": selected["decision_id"],
                "cohort_key": cohort_key(route_data),
                "base_sha": args.base.lower(),
                "task": args.task,
                "model": current_route["model"],
                "effort": current_route["effort"],
                "client": args.client,
                "environment": route_data.environment,
                "role": route_data.role,
                "task_family": route_data.task_family,
                "risk": route_data.risk,
                "policy_epoch": route_data.policy_epoch,
            },
        )

    with redirect_stdout(io.StringIO()):
        launch_run(db, launch, admit=admit)
    return selected


def execute_dispatch(
    context: DispatchContext, selected: dict[str, Any], remaining_seconds: int
) -> DispatchOutcome:
    model, effort = selected["route"]["model"], selected["route"]["effort"]
    command = cli_command(context.args.client, model, effort, context.cwd, context.prompt)
    started = time.time()
    try:
        result = run_codex(
            CodexRequest(command, context.cwd, context.prompt, model, effort, remaining_seconds)
        )
        returncode = (
            0
            if result["status"] == "completed"
            and not result["rerouted"]
            and result["turn_result_received"]
            else 125
        )
    except subprocess.TimeoutExpired as exc:
        result = {"error": str(exc)}
        returncode = 124
    except (OSError, RuntimeError, TypeError, ValueError, KeyError, AttributeError) as exc:
        result = {"error": str(exc)}
        returncode = 125
    try:
        verify_worktree_documents(context.coordinator, context.cwd, context.approved_documents)
        if any(digest(path) != expected for path, expected in context.approved_documents.items()):
            raise ValueError("approved spec or plan changed during worker execution")
    except (OSError, ValueError) as exc:
        result["error"] = str(exc)
        returncode = 125
    return DispatchOutcome(result, returncode, round(time.time() - started, 3))


def finish_dispatch(
    db: sqlite3.Connection,
    context: DispatchContext,
    selected: dict[str, Any],
    outcome: DispatchOutcome,
) -> dict[str, Any]:
    args, route_data = context.args, context.cohort
    result, returncode = outcome.result, outcome.returncode
    timed_out = returncode == 124
    model, effort = selected["route"]["model"], selected["route"]["effort"]
    db.execute("BEGIN IMMEDIATE")
    event(
        db,
        args.run,
        f"observed:{args.attempt}",
        "worker-result",
        {
            "client": args.client,
            "account_type": result.get("account_type"),
            "plan_type": result.get("plan_type"),
            "model_provider": result.get("model_provider"),
            "requested_model": model,
            "observed_model": result.get("model"),
            "requested_effort": effort,
            "observed_effort": result.get("effort"),
            "decision_id": selected["decision_id"],
            "cohort_key": cohort_key(route_data),
            "task": args.task,
            "task_family": route_data.task_family,
            "risk": route_data.risk,
            "policy_epoch": route_data.policy_epoch,
            "returncode": returncode,
            "timed_out": timed_out,
            "elapsed_seconds": outcome.elapsed_seconds,
            "usage": result.get("usage", {}),
            "turn_id": result.get("turn_id"),
            "sandbox": result.get("sandbox"),
            "error": result.get("error"),
        },
    )
    db.commit()
    settle_args = argparse.Namespace(run=args.run, id=args.attempt, actual=0)
    with redirect_stdout(io.StringIO()):
        settle_run(db, settle_args)
    return {
        "run": args.run,
        "attempt": args.attempt,
        "decision_id": selected["decision_id"],
        "requested_model": model,
        "observed_model": result.get("model"),
        "effort": effort,
        "observed_effort": result.get("effort"),
        "status": "timed-out" if timed_out else "completed" if returncode == 0 else "failed",
        "returncode": returncode,
        "elapsed_seconds": outcome.elapsed_seconds,
        "usage": result.get("usage", {}),
        "model_provider": result.get("model_provider"),
        "sandbox_roots": result.get("sandbox_roots", []),
        "sandbox": result.get("sandbox"),
        "error": result.get("error"),
        "final_text": result.get("final_text", ""),
        "reroutes": result.get("reroutes", []),
    }


def dispatch(args: argparse.Namespace) -> dict[str, Any]:
    context = prepare_dispatch(args)
    with connect(args.db) as db:
        ensure_registry_schema(db)
        permitted_routes, remaining_seconds = authorize_dispatch(db, context)
        selected = admit_dispatch(db, context, permitted_routes)
        outcome = execute_dispatch(context, selected, remaining_seconds)
        return finish_dispatch(db, context, selected, outcome)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--db", type=Path, required=True)
    parser.add_argument("--registry", type=Path, required=True)
    parser.add_argument("--cohort", type=Path, required=True)
    parser.add_argument("--run", required=True)
    parser.add_argument("--attempt", required=True)
    parser.add_argument("--revision", type=int, required=True)
    parser.add_argument("--base", required=True)
    parser.add_argument("--task")
    parser.add_argument("--reserve", type=int, required=True)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--prompt", type=Path, required=True)
    parser.add_argument("--cwd", type=Path, required=True)
    parser.add_argument("--client", choices=("codex", "claude"), required=True)
    parser.add_argument("--timeout", type=int, required=True)
    args = parser.parse_args()
    if args.task is None:
        args.task = args.attempt
    try:
        result = dispatch(args)
        print(json.dumps(result, sort_keys=True))
    except (OSError, ValueError, sqlite3.Error, subprocess.SubprocessError) as error:
        print(json.dumps({"ok": False, "error": str(error)}), file=sys.stderr)
        return 2
    return int(result["returncode"])


if __name__ == "__main__":
    raise SystemExit(main())
