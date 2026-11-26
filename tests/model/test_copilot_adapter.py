"""CopilotAdapter against a fake client. No runtime, no network, no provider.

The fake imports the SDK only to build real ``SessionEvent`` objects and a real
``ToolInvocation``; the adapter under test imports nothing from the SDK. The fake plays a
script: ``Emit`` delivers an event, ``Invoke`` delivers ``tool.execution_start`` and calls the
registered tool handler in a task, ``Idle`` delivers ``session.idle``, ``Await`` waits for every
started handler to return before the script goes on.
"""

import asyncio
import dataclasses
import json
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path, PureWindowsPath
from typing import Any

import pytest
from copilot.generated.session_events import SessionEvent
from copilot.tools import ToolInvocation

from deploy_workflow.model import copilot_adapter
from deploy_workflow.model.adapter import (
    _REFLECTED_RAW,
    AdapterReply,
    LivePauseInForce,
    recorded_adapter,
)
from deploy_workflow.model.copilot import event_record
from deploy_workflow.model.copilot_adapter import (
    ClientOptions,
    CopilotAdapter,
    _Call,
    real_client,
)
from deploy_workflow.model.handoff import HandoffExecutor
from deploy_workflow.model.record import CallLog, export_recording
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.transport import IDLE_S, OVERALL_S
from deploy_workflow.model.turn import (
    Message,
    ModelSpec,
    ToolCall,
    ToolSpec,
    TurnRequest,
    dump_json,
)
from tests.test_handoff_loop import check, task

SPEC = ModelSpec("copilot-sol-medium", "copilot", "gpt-6.1-sol", "medium")
DIGEST = "d" * 64
TOKEN = "ghp_" + "A" * 36
RULING_TEXT = (
    "lifts: live-provider-pause\nby: user\ndate: 2026-11-01\nconfigs: copilot-sol-medium\n"
)
TOOL = ToolSpec("read_pages", "Read pages.", {"type": "object", "properties": {"p": {}}})
SYSTEM = Message("system", "SYSTEM TEXT")
USER = Message("user", "hello")


# ---------------------------------------------------------------- the script


@dataclass
class Emit:
    event: dict[str, Any]


@dataclass
class Invoke:
    call_id: str
    name: str
    arguments: dict[str, Any]
    handler_arguments: dict[str, Any] | None = None  # the handler is invoked with these instead


@dataclass
class Idle:
    pass


@dataclass
class Await:
    pass


Step = Emit | Invoke | Idle | Await


def wire(kind: str, data: dict[str, Any], agent: str | None = None) -> dict[str, Any]:
    return {
        "type": kind,
        "id": str(uuid.uuid4()),
        "timestamp": "2026-11-06T00:00:00Z",
        "data": data,
        "agentId": agent,
    }


def usage(**extra: Any) -> Emit:
    data = {"model": "gpt-6.1-sol", "inputTokens": 10, "outputTokens": 5, "finishReason": "stop"}
    return Emit(wire("assistant.usage", {**data, **extra}))


def said(content: str, agent: str | None = None) -> Emit:
    return Emit(wire("assistant.message", {"content": content, "messageId": "m"}, agent))


def text_script(content: str = "ANSWER") -> list[Step]:
    return [said(content), usage(copilotUsage={"totalNanoAiu": 123456}), Idle()]


class FakeSession:
    def __init__(self, script: list[Step], options: dict[str, Any]) -> None:
        self.script, self.options = script, options
        self.handlers: list[Callable[[Any], None]] = []
        self.sent: list[str] = []
        self.aborted = 0
        self.disconnected = 0
        self.tasks: dict[str, asyncio.Task[Any]] = {}
        self.results: dict[str, Any] = {}
        self._played: asyncio.Task[None] | None = None
        self.followups: list[list[Step]] = []  # scripts played by the later sends (nudges)

    def on(self, handler: Callable[[Any], None]) -> Callable[[], None]:
        self.handlers.append(handler)
        return lambda: self.handlers.remove(handler)

    async def send(self, text: str, /) -> str:
        self.sent.append(text)
        if self._played is None:
            self._played = asyncio.ensure_future(self._play())
        elif self.followups:  # a later send is a nudge: the next follow-up script answers it
            self.script = self.followups.pop(0)
            self._played = asyncio.ensure_future(self._play())
        return "message-id"

    async def abort(self) -> None:
        self.aborted += 1

    async def disconnect(self) -> None:
        self.disconnected += 1

    def deliver(self, event: dict[str, Any]) -> None:
        parsed = SessionEvent.from_dict(event)
        for handler in list(self.handlers):
            handler(parsed)

    async def _call(self, step: Invoke) -> None:
        tool = next(t for t in self.options["tools"] if t.name == step.name)
        self.results[step.call_id] = await tool.handler(
            ToolInvocation(
                tool_call_id=step.call_id,
                tool_name=step.name,
                arguments=step.arguments
                if step.handler_arguments is None
                else step.handler_arguments,
            )
        )

    async def _play(self) -> None:
        for step in self.script:
            await asyncio.sleep(0)
            if isinstance(step, Emit):
                self.deliver(step.event)
            elif isinstance(step, Idle):
                self.deliver(wire("session.idle", {}))
            elif isinstance(step, Invoke):
                self.deliver(
                    wire(
                        "tool.execution_start",
                        {
                            "toolCallId": step.call_id,
                            "toolName": step.name,
                            "arguments": step.arguments,
                        },
                    )
                )
                self.tasks[step.call_id] = asyncio.ensure_future(self._call(step))
            else:
                await asyncio.gather(*self.tasks.values(), return_exceptions=True)


class FakeClient:
    def __init__(self, script: list[Step], models: list[dict[str, Any]] | None = None) -> None:
        self.script = script
        self.models = (
            models
            if models is not None
            else [{"id": "gpt-6.1-sol", "supportedReasoningEfforts": ["low", "medium", "high"]}]
        )
        self.started = 0
        self.stopped = 0
        self.force_stopped = 0
        self.sessions: list[FakeSession] = []
        self.followups: list[list[Step]] = []
        # What the runtime reports as a session's context tier: by default the tier the session
        # asked for (None when it asked for none); a test sets a function to report something else.
        self.tier_read: Callable[[FakeSession], str | None] | None = None

    async def start(self) -> None:
        self.started += 1

    async def list_models(self) -> list[dict[str, Any]]:
        return self.models

    async def create_session(self, **options: Any) -> FakeSession:
        session = FakeSession(self.script, options)
        session.followups = self.followups
        self.sessions.append(session)
        return session

    async def context_tier(self, session: FakeSession) -> str | None:
        if self.tier_read is not None:
            return self.tier_read(session)
        requested = session.options.get("context_tier")
        return requested if isinstance(requested, str) else None

    async def stop(self) -> None:
        self.stopped += 1

    async def force_stop(self) -> None:
        self.force_stopped += 1


class Rig:
    def __init__(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        self.root = tmp_path / "rulings"
        self.root.mkdir()
        self.ruling = self.root / "lift.md"
        self.ruling.write_text(RULING_TEXT, encoding="utf-8")
        self.runtime = tmp_path / "copilot-runtime"
        self.runtime.write_text("#!/bin/sh\n")
        self.home_root = tmp_path
        monkeypatch.chdir(tmp_path)
        self.environ = {"COPILOT_GITHUB_TOKEN": TOKEN, "COPILOT_CLI_PATH": str(self.runtime)}
        self.client = FakeClient([])
        self.options: list[ClientOptions] = []
        self.adapters: list[CopilotAdapter] = []
        self.clock_value = 1000.0

    def factory(self, options: ClientOptions) -> FakeClient:
        self.options.append(options)
        return self.client

    def clock(self) -> float:
        self.clock_value += 1.0
        return self.clock_value

    def make(self, script: list[Step], **kwargs: Any) -> CopilotAdapter:
        self.client.script = script
        adapter = CopilotAdapter(
            kwargs.pop("spec", SPEC),
            self.ruling,
            environ=kwargs.pop("environ", self.environ),
            clock=self.clock,
            rulings_root=self.root,
            client_factory=kwargs.pop("client_factory", self.factory),
            **kwargs,
        )
        self.adapters.append(adapter)
        return adapter

    def released(self) -> None:
        """Wait for the background release of every exchange (close() joins it)."""
        for adapter in self.adapters:
            adapter.close()

    @property
    def session(self) -> FakeSession:
        return self.client.sessions[0]


@pytest.fixture
def rig(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Any:
    made = Rig(tmp_path, monkeypatch)
    yield made
    for adapter in made.adapters:
        adapter.close()


def request(*messages: Message, tools: tuple[ToolSpec, ...] = (TOOL,)) -> TurnRequest:
    return TurnRequest(messages or (SYSTEM, USER), tools, 1000, "medium")


def call(
    adapter: CopilotAdapter, req: TurnRequest, index: int = 0, digest: str = DIGEST
) -> AdapterReply:
    return adapter.complete(req, invocation_digest=digest, call_index=index, reservation_id="r")


def tool_script(*, then: list[Step] | None = None) -> list[Step]:
    first: list[Step] = [
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1),
        Invoke("c1", "read_pages", {"p": 1}),
        Await(),
    ]
    return first + (then if then is not None else text_script())


def tool_turn_history() -> tuple[Message, ...]:
    return (
        SYSTEM,
        USER,
        Message("assistant", "", (ToolCall("c1", "read_pages", {"p": 1}),)),
    )


# ---------------------------------------------------------------- refusals before any send


def test_gate_runs_before_environment(rig: Rig) -> None:
    rig.ruling.write_text(RULING_TEXT.replace("copilot-sol-medium", "other"), encoding="utf-8")
    with pytest.raises(LivePauseInForce):
        rig.make(text_script(), environ=None)
    assert rig.options == []


def test_missing_token_is_not_sent(rig: Rig) -> None:
    env = {**rig.environ, "COPILOT_GITHUB_TOKEN": ""}
    reply = call(rig.make(text_script(), environ=env), request())
    assert reply.kind == "not_sent" and reply.error_class == "KeyMissing"
    assert reply.message is not None and "COPILOT_GITHUB_TOKEN" in reply.message
    assert rig.options == [] and rig.client.sessions == []


@pytest.mark.parametrize("runtime", [None, "directory", "absent"])
def test_missing_runtime_is_not_sent(rig: Rig, tmp_path: Path, runtime: str | None) -> None:
    env = {"COPILOT_GITHUB_TOKEN": TOKEN}
    if runtime == "directory":
        env["COPILOT_CLI_PATH"] = str(tmp_path)
    elif runtime == "absent":
        env["COPILOT_CLI_PATH"] = str(tmp_path / "missing")
    reply = call(rig.make(text_script(), environ=env), request())
    assert reply.kind == "not_sent" and reply.error_class == "RuntimeMissing"
    assert reply.message is not None and "COPILOT_CLI_PATH" in reply.message
    assert str(tmp_path) not in reply.message
    assert rig.client.sessions == []


def test_model_not_listed_is_not_sent(rig: Rig) -> None:
    rig.client.models = [{"id": "other", "supportedReasoningEfforts": ["medium"]}]
    reply = call(rig.make(text_script()), request())
    assert reply.kind == "not_sent" and reply.error_class == "ModelUnavailable"
    assert rig.client.sessions == []


def test_effort_not_supported_is_not_sent(rig: Rig) -> None:
    rig.client.models = [{"id": "gpt-6.1-sol", "supportedReasoningEfforts": ["low"]}]
    reply = call(rig.make(text_script()), request())
    assert reply.kind == "not_sent" and reply.error_class == "EffortUnavailable"
    assert rig.client.sessions == []


def test_invalid_reservation_id_is_not_sent(rig: Rig) -> None:
    reply = rig.make(text_script()).complete(
        request(), invocation_digest=DIGEST, call_index=0, reservation_id="../x"
    )
    assert reply.kind == "not_sent" and reply.error_class == "InvalidDigest"
    assert rig.options == [] and not (rig.home_root / ".copilot-home").exists()


def test_max_output_tokens_out_of_range_is_not_sent(rig: Rig) -> None:
    big = TurnRequest((SYSTEM, USER), (TOOL,), 10**9, "medium")
    reply = call(rig.make(text_script()), big)
    assert reply.kind == "not_sent" and reply.error_class == "MaxOutputTooLarge"
    assert rig.client.sessions == []


# ---------------------------------------------------------------- the session


def test_first_call_creates_an_empty_mode_session_with_the_tools(rig: Rig) -> None:
    call(rig.make(text_script()), request())
    (options,) = rig.options
    assert options.token == TOKEN and options.runtime == str(rig.runtime)
    home = Path(options.home)
    assert home == rig.home_root / ".copilot-home" / DIGEST / "r" and home.is_dir()
    assert rig.client.started == 1
    given = rig.session.options
    assert given["model"] == "gpt-6.1-sol" and given["reasoning_effort"] == "medium"
    assert given["system_message"] == {"mode": "replace", "content": "SYSTEM TEXT"}
    assert given["streaming"] is False and given["session_id"] == DIGEST
    assert list(given["available_tools"]) == ["custom:*"]
    (tool,) = given["tools"]
    assert tool.name == "read_pages" and tool.description == "Read pages."
    assert tool.parameters == dict(TOOL.parameters) and tool.skip_permission is True
    assert rig.session.sent == ["hello"]
    assert callable(given["on_permission_request"])


def test_text_reply_is_ok(rig: Rig) -> None:
    reply = call(rig.make(text_script()), request())
    assert reply.kind == "ok" and reply.http_status == 200 and reply.error_class is None
    assert reply.turn is not None and reply.turn.text == "ANSWER"
    assert reply.billed_usd == Decimal("0.00000123456") == reply.turn.billed_usd
    assert reply.usage == reply.turn.usage and reply.usage is not None
    assert reply.usage.input_tokens == 10 and reply.usage.output_tokens == 5
    assert reply.started_at is not None and reply.finished_at is not None
    assert reply.started_at < reply.finished_at
    events = [
        SessionEvent.from_dict(s.event) if isinstance(s, Emit) else None for s in text_script()
    ]
    records = [event_record(e) for e in events if e is not None]
    records.append({"type": "session.idle", "data": {}})
    assert reply.raw == Redactor.from_environ(rig.environ).bytes_(dump_json(records).encode())
    rig.released()
    assert rig.session.disconnected == 1 and rig.client.stopped == 1


def test_tool_calls_block_until_the_next_complete(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    first = call(adapter, request())
    assert first.kind == "ok" and first.turn is not None
    assert first.turn.stop_reason == "tool_use"
    assert first.turn.tool_calls == (ToolCall("c1", "read_pages", {"p": 1}),)
    assert rig.session.disconnected == 0
    assert not rig.session.tasks["c1"].done()  # the handler is still blocked
    second = call(
        adapter,
        request(*tool_turn_history(), Message("tool", "PAGE TEXT", tool_call_id="c1")),
        1,
    )
    assert second.kind == "ok" and second.turn is not None and second.turn.text == "ANSWER"
    assert rig.session.results == {"c1": "PAGE TEXT"}
    assert rig.session.sent == ["hello"]
    rig.released()
    assert rig.session.disconnected == 1


def test_user_nudge_after_tool_results_is_sent(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    call(adapter, request())
    nudge = Message("user", "NUDGE")
    reply = call(
        adapter,
        request(*tool_turn_history(), Message("tool", "PAGE TEXT", tool_call_id="c1"), nudge),
        1,
    )
    assert reply.kind == "ok"
    assert rig.session.sent == ["hello", "NUDGE"]


def test_history_mismatch_is_not_sent(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    call(adapter, request())
    altered = (SYSTEM, Message("user", "different"), tool_turn_history()[2])
    reply = call(adapter, request(*altered, Message("tool", "X", tool_call_id="c1")), 1)
    assert reply.kind == "not_sent" and reply.error_class == "HistoryMismatch"
    assert rig.session.results == {}


def test_two_user_messages_in_the_first_request_is_not_sent(rig: Rig) -> None:
    reply = call(rig.make(text_script()), request(SYSTEM, USER, Message("user", "again")))
    assert reply.kind == "not_sent" and reply.error_class == "HistoryMismatch"
    assert rig.client.sessions == []


def test_a_changed_tool_set_is_not_sent(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    call(adapter, request())
    other = ToolSpec("other", "x", {})
    reply = call(
        adapter,
        request(*tool_turn_history(), Message("tool", "X", tool_call_id="c1"), tools=(other,)),
        1,
    )
    assert reply.kind == "not_sent" and reply.error_class == "HistoryMismatch"


def test_call_index_without_session_is_not_sent(rig: Rig) -> None:
    reply = call(rig.make(text_script()), request(), 3)
    assert reply.kind == "not_sent" and reply.error_class == "SessionMissing"
    assert rig.client.sessions == [] and rig.options == []


@pytest.mark.parametrize("answers", [("zzz",), ("c1", "zzz"), ()])
def test_tool_result_mismatch_is_not_sent(rig: Rig, answers: tuple[str, ...]) -> None:
    adapter = rig.make(tool_script())
    call(adapter, request())
    tail = tuple(Message("tool", "X", tool_call_id=i) for i in answers)
    reply = call(adapter, request(*tool_turn_history(), *tail, Message("user", "nudge")), 1)
    assert reply.kind == "not_sent" and reply.error_class == "ToolResultMismatch"
    assert rig.session.results == {} and rig.session.sent == ["hello"]


def test_a_repeated_tool_result_is_not_sent(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    call(adapter, request())
    twice = (Message("tool", "X", tool_call_id="c1"),) * 2
    reply = call(adapter, request(*tool_turn_history(), *twice), 1)
    assert reply.kind == "not_sent" and reply.error_class == "ToolResultMismatch"


# ---------------------------------------------------------------- timeouts


def test_idle_timeout_after_usage_is_sent_usage(rig: Rig) -> None:
    script: list[Step] = [said("part"), usage(copilotUsage={"totalNanoAiu": 100})]
    reply = call(rig.make(script, idle_s=0.2, overall_s=30.0), request())
    assert reply.kind == "sent_usage" and reply.error_class == "IdleTimeout"
    assert reply.usage is not None and reply.usage.input_tokens == 10
    assert reply.billed_usd == Decimal("0.000000001")
    assert reply.raw is not None and b"part" in reply.raw
    rig.released()
    assert rig.session.aborted == 1 and rig.session.disconnected == 1


def test_overall_timeout_before_usage_is_sent_unknown(rig: Rig) -> None:
    started = time.monotonic()
    reply = call(rig.make([], idle_s=30.0, overall_s=0.3), request())
    assert reply.kind == "sent_unknown" and reply.error_class == "OverallTimeout"
    assert time.monotonic() - started < 10
    rig.released()
    assert rig.session.aborted == 1 and rig.session.disconnected == 1


def test_idle_timeout_before_usage_is_sent_unknown(rig: Rig) -> None:
    reply = call(rig.make([], idle_s=0.2, overall_s=30.0), request())
    assert reply.kind == "sent_unknown" and reply.error_class == "IdleTimeout"


# ---------------------------------------------------------------- outcomes


def test_session_error_is_reported(rig: Rig) -> None:
    script: list[Step] = [Emit(wire("session.error", {"errorType": "boom", "message": "bad"}))]
    reply = call(rig.make(script), request())
    assert reply.kind == "sent_unknown" and reply.error_class == "SessionError"
    assert reply.message is not None and "boom" in reply.message
    rig.released()
    assert rig.session.disconnected == 1 and rig.client.stopped == 1


def test_session_error_text_and_archived_body_hold_no_home_directory(rig: Rig) -> None:
    # S03-A04/C03: the runtime's own error names local files. Expected by hand: each home
    # directory ("/home/jane.doe", r"C:\Users\Jane Doe") becomes "<home>"; the error type, the
    # rest of the message and the status are kept.
    message = r"ENOENT: open '/home/jane.doe/.copilot/c.json' and C:\Users\Jane Doe\AppData\x.js"
    data = {"errorType": "fs", "message": message, "statusCode": 500}
    reply = call(rig.make([Emit(wire("session.error", data))]), request())
    scrubbed = r"ENOENT: open '<home>/.copilot/c.json' and <home>\AppData\x.js"
    assert (reply.kind, reply.error_class, reply.http_status) == (
        "sent_unknown",
        "SessionError",
        500,
    )
    assert reply.message == f"fs: {scrubbed}"
    assert reply.raw is not None and b"jane.doe" not in reply.raw and b"Jane Doe" not in reply.raw
    (event,) = json.loads(reply.raw)
    assert event["data"]["message"] == scrubbed
    assert event["data"]["statusCode"] == 500
    rig.released()


def test_a_private_path_is_replaced_only_as_whole_segments() -> None:
    # S03-C03: "/home/jan" is not a prefix to cut out of "/home/janet" or "/home/jan.doe"; a
    # path ending in a separator, or followed by a sentence's ".", still is replaced.
    paths = ["/home/jan", "/opt/run/"]
    text = "/home/janet/x /home/jan.doe/y /home/jan/z /home/jan. /opt/run/bin"
    expected = "/home/janet/x /home/jan.doe/y <path>/z <path>. <path>bin"
    assert copilot_adapter._paths_in(text, paths) == expected


def test_model_mismatch_is_sent_usage(rig: Rig) -> None:
    script: list[Step] = [said("x"), usage(model="other-model"), Idle()]
    reply = call(rig.make(script), request())
    assert reply.kind == "sent_usage" and reply.error_class == "ModelMismatch"
    assert reply.usage is not None and reply.raw is not None
    rig.released()
    assert rig.session.disconnected == 1


def test_model_mismatch_without_counts_or_charge_is_sent_unknown(rig: Rig, tmp_path: Path) -> None:
    # The usage event names another model and carries no token field and no copilotUsage: no
    # count and no charge, so the paid amount is unknown (the other Copilot paths say the same).
    # The call record is cost unknown, the export writes sent_unknown, and the replay gives the
    # same kind and class the live reply had.
    script: list[Step] = [
        said("x"),
        Emit(wire("assistant.usage", {"model": "other-model"})),
        Idle(),
    ]
    adapter = rig.make(script, idle_s=2.0)
    run, exported = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    assert (rec["error_class"], rec["http_status"], rec["cost_status"]) == (
        "ModelMismatch", 200, "unknown",
    )  # fmt: skip
    assert exported["response"]["kind"] == "sent_unknown"
    (out := tmp_path / "rec").mkdir()
    (out / "r.jsonl").write_bytes((tmp_path / "out.jsonl").read_bytes())
    replayed = recorded_adapter(SPEC, out).complete(
        request(),
        invocation_digest=exported["invocation_digest"],
        call_index=exported["call_index"],
        reservation_id="r",
    )
    assert (replayed.kind, replayed.error_class) == ("sent_unknown", "ModelMismatch")


def test_model_mismatch_with_a_zero_charge_stays_sent_usage(rig: Rig) -> None:
    script: list[Step] = [
        said("x"),
        usage(model="other-model", copilotUsage={"totalNanoAiu": 0}),
        Idle(),
    ]
    reply = call(rig.make(script), request())
    assert reply.kind == "sent_usage" and reply.error_class == "ModelMismatch"
    assert reply.billed_usd == Decimal(0)


@pytest.mark.parametrize(
    ("flag", "error_class"), [("isByok", "ByokRouted"), ("isAuto", "AutoRouted")]
)
def test_routed_replies_are_refused(rig: Rig, flag: str, error_class: str) -> None:
    script: list[Step] = [
        said("x"),
        usage(copilotUsage={"totalNanoAiu": 100}, **{flag: True}),
        Idle(),
    ]
    reply = call(rig.make(script), request())
    assert reply.kind == "sent_usage" and reply.error_class == error_class
    assert reply.billed_usd == Decimal("0.000000001") and reply.raw is not None


def test_token_echoed_in_events_is_withheld(rig: Rig) -> None:
    script: list[Step] = [said(f"my token is {TOKEN}"), usage(), Idle()]
    reply = call(rig.make(script), request())
    assert reply.error_class == "KeyReflected"
    assert reply.raw == _REFLECTED_RAW
    assert TOKEN not in repr(reply)
    rig.released()
    assert rig.session.disconnected == 1


def test_agent_events_are_ignored(rig: Rig) -> None:
    script: list[Step] = [
        said("SUB-AGENT", agent="agent-1"),
        Emit(wire("assistant.usage", {"model": "x"}, "agent-1")),
        *text_script(),
    ]
    reply = call(rig.make(script), request())
    assert reply.kind == "ok" and reply.turn is not None and reply.turn.text == "ANSWER"
    assert reply.raw is not None and b"SUB-AGENT" not in reply.raw


# ---------------------------------------------------------------- close


def test_close_releases_blocked_handlers(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    first = call(adapter, request())
    assert first.turn is not None and first.turn.stop_reason == "tool_use"
    awaited = adapter._states[DIGEST].pending["c1"]  # the future the handler is blocked on
    started = time.monotonic()
    adapter.close()
    assert time.monotonic() - started < 2
    assert awaited.cancelled()
    assert rig.session.disconnected == 1 and rig.client.stopped == 1
    adapter.close()  # idempotent
    assert rig.session.disconnected == 1 and rig.client.stopped == 1


def test_close_before_any_call_is_a_no_op(rig: Rig) -> None:
    adapter = rig.make(text_script())
    adapter.close()
    adapter.close()
    assert rig.options == []


def test_complete_after_close_is_not_sent(rig: Rig) -> None:
    adapter = rig.make(text_script())
    adapter.close()
    reply = call(adapter, request())
    assert reply.kind == "not_sent" and reply.error_class == copilot_adapter.PRE_SEND_FAILURE
    assert reply.message is not None and reply.message.startswith("AdapterClosed")


def _run_and_export(
    rig: Rig, tmp_path: Path, adapter: CopilotAdapter
) -> tuple[Path, dict[str, Any]]:
    run = tmp_path / "run"
    run.mkdir()
    executor = HandoffExecutor(run, adapter=adapter, cap_usd=Decimal(10), check=check)
    try:
        executor(task())
    except RuntimeError:
        pass  # the loop stops on the failed call; the record is what is checked
    out = tmp_path / "out.jsonl"
    assert export_recording(run, out, Redactor()) == 1
    return run, json.loads(out.read_text(encoding="utf-8").splitlines()[0])


def test_closed_adapter_through_the_executor_exports_not_sent(rig: Rig, tmp_path: Path) -> None:
    adapter = rig.make(text_script())
    adapter.close()
    run, exported = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    assert rec["error_class"] == copilot_adapter.PRE_SEND_FAILURE
    assert exported["response"]["kind"] == "not_sent"


def test_zero_cost_usage_timeout_keeps_a_billed_zero(rig: Rig, tmp_path: Path) -> None:
    adapter = rig.make(
        [said("part"), usage(copilotUsage={"totalNanoAiu": 0})], idle_s=0.2, overall_s=30.0
    )
    run, exported = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    assert rec["http_status"] is None and rec["error_class"] == "IdleTimeout"
    assert rec["cost_status"] == "billed" and rec["settled_usd"] == "0"
    assert exported["response"]["kind"] == "sent_usage"
    assert exported["response"]["billed_usd"] == "0"
    (out := tmp_path / "rec").mkdir()
    (out / "r.jsonl").write_bytes((tmp_path / "out.jsonl").read_bytes())
    replayed = recorded_adapter(SPEC, out).complete(
        request(),
        invocation_digest=exported["invocation_digest"],
        call_index=exported["call_index"],
        reservation_id="r",
    )
    assert replayed.kind == "sent_usage" and replayed.billed_usd == Decimal(0)


def test_pre_send_failure_text_is_bounded_and_holds_no_absolute_path(
    rig: Rig, tmp_path: Path
) -> None:
    install = tmp_path / "install"
    frame = f"    at start ({install}/lib/index.js:10:5)\n    at main (/Users/x/AppData/Local/n.js:1:1)\n"
    rig.client = OpenFails(RuntimeError("boom\n" + frame * 2000))
    adapter = rig.make([])
    run, _ = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    text = str(rec["error"])
    assert text.startswith("PreSendFailure: RuntimeError")
    assert len(text) <= 500
    assert str(install) not in text and "/Users/x/AppData" not in text
    assert "<path>" in text


def test_windows_paths_with_spaces_are_scrubbed_from_error_text(rig: Rig, tmp_path: Path) -> None:
    install = tmp_path / "Copilot Install Dir"
    install.mkdir()
    runtime = install / "copilot-runtime"
    runtime.write_text("#!/bin/sh\n")
    profile, local = r"C:\Users\Jane Doe", r"C:\Users\Jane Doe\AppData\Local"
    files = r"C:\Program Files"
    environ = {
        **rig.environ,
        "COPILOT_CLI_PATH": str(runtime),
        "USERPROFILE": profile,
        "LOCALAPPDATA": local,
        "ProgramFiles": files,
    }
    frames = (
        f"at a ({local}\\x\\y.js:1:1)\nat b ({files}\\GitHub Copilot\\bin\\copilot.exe:2:2)\n"
        f"at c ({install}/lib.js:3:3)\n"
    )
    rig.client = OpenFails(RuntimeError("boom\n" + frames * 50))
    adapter = rig.make([], environ=environ)
    run, _ = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    text = str(rec["error"])
    assert len(text) <= 500
    for secret in ("Jane Doe", "Program Files", "GitHub Copilot", "Copilot Install Dir"):
        assert secret not in text


# ---------------------------------------------------------------- fix round 1


class HangingSession(FakeSession):
    """A wedged runtime: abort is slow, disconnect never returns."""

    async def abort(self) -> None:
        self.aborted += 1
        await asyncio.sleep(0.5)

    async def disconnect(self) -> None:
        self.disconnected += 1
        await asyncio.Event().wait()


class HangingClient(FakeClient):
    async def create_session(self, **options: Any) -> FakeSession:
        session = HangingSession(self.script, options)
        self.sessions.append(session)
        return session

    async def stop(self) -> None:
        self.stopped += 1
        await asyncio.Event().wait()


@pytest.fixture
def small_bounds(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ("_DISCONNECT_S", "_STOP_S", "_FORCE_S"):
        monkeypatch.setattr(copilot_adapter, name, 0.3)


def test_second_model_call_is_billed_with_the_first(rig: Rig) -> None:
    script: list[Step] = [
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 1000}),
        said("I could not find that tool."),  # the announced call never reaches a handler
        usage(copilotUsage={"totalNanoAiu": 2000}),
        Idle(),
    ]
    started = time.monotonic()
    reply = call(rig.make(script, idle_s=5.0, overall_s=30.0), request())
    assert time.monotonic() - started < 3  # the second usage ended the call, no idle wait
    # F1a: both charges are readable, so the call settles at their exact sum (nano-AIU 1000 +
    # 2000 = 3000, each 1e-11 USD), with the raw body kept
    assert reply.kind == "sent_usage" and reply.billed_usd == Decimal("0.00000003")
    assert reply.usage is not None and reply.raw is not None


def test_two_readable_usage_events_in_a_timeout_body_are_summed(rig: Rig) -> None:
    adapter = rig.make(text_script())
    records = [
        event_record(SessionEvent.from_dict(usage(copilotUsage={"totalNanoAiu": n}).event))
        for n in (1000, 2000)
    ]
    body = dump_json(records).encode()
    call_ = _Call(request(), DIGEST, 0, "medium", 0.0, 0.0, "r")
    reply = adapter._timeout_reply(call_, body, body, "IdleTimeout", Redactor())
    assert reply.kind == "sent_usage" and reply.billed_usd == Decimal("0.00000003")  # F1c
    assert reply.usage is not None and reply.raw == body


def test_f1b_a_second_usage_without_a_charge_is_sent_unknown(rig: Rig) -> None:
    script: list[Step] = [
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 1000}),
        usage(),
        Idle(),
    ]
    reply = call(rig.make(script, idle_s=5.0, overall_s=30.0), request())
    assert reply.kind == "sent_unknown" and reply.usage is None and reply.billed_usd is None
    assert reply.raw is not None


def test_f1b_timeout_body_with_an_unreadable_charge_is_sent_unknown(rig: Rig) -> None:
    adapter = rig.make(text_script())
    records = [
        event_record(SessionEvent.from_dict(usage(**extra).event))
        for extra in ({"copilotUsage": {"totalNanoAiu": 1000}}, {})
    ]
    body = dump_json(records).encode()
    call_ = _Call(request(), DIGEST, 0, "medium", 0.0, 0.0, "r")
    reply = adapter._timeout_reply(call_, body, body, "IdleTimeout", Redactor())
    assert reply.kind == "sent_unknown" and reply.usage is None and reply.billed_usd is None


def test_f1d_two_requests_past_the_hold_are_booked_as_spent_and_stop_the_run(
    rig: Rig, tmp_path: Path
) -> None:
    """One call reports two usages, USD 4.60 + 5.52 (nano-AIU at 1e-11 USD each) = USD 10.12,
    over the cap of 10 (the hold is USD 7.21608): the ledger books 10.12, not the hold."""
    script: list[Step] = [
        said(""),
        usage(
            finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 460 * 10**9}
        ),
        usage(copilotUsage={"totalNanoAiu": 552 * 10**9}),
        Idle(),
    ]
    adapter = rig.make(script, idle_s=5.0, overall_s=30.0)
    run = tmp_path / "run"
    run.mkdir()
    executor = HandoffExecutor(run, adapter=adapter, cap_usd=Decimal(10), check=check)
    with pytest.raises(RuntimeError, match="overrun=True"):
        executor(task())
    assert executor.budget.stop_kind == "overrun"
    assert executor.budget.spent == Decimal("10.12")


def test_slow_teardown_does_not_lose_the_reply(rig: Rig, monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ("_DISCONNECT_S", "_STOP_S"):
        monkeypatch.setattr(copilot_adapter, name, 1.0)
    rig.client = HangingClient([])
    adapter = rig.make(text_script(), overall_s=1.0)
    started = time.monotonic()
    reply = call(adapter, request())
    assert time.monotonic() - started < 0.8  # the 2 s release is not on the reply's path
    assert reply.kind == "ok" and reply.billed_usd == Decimal("0.00000123456")
    with pytest.raises(RuntimeError, match="stop failed"):
        adapter.close()
    assert rig.client.force_stopped == 1


def test_outer_timeout_keeps_usage(rig: Rig, small_bounds: None) -> None:
    rig.client = HangingClient([])
    script: list[Step] = [said("part"), usage(copilotUsage={"totalNanoAiu": 5000})]
    adapter = rig.make(script, idle_s=30.0, overall_s=0.3)
    reply = call(adapter, request())
    assert reply.kind == "sent_usage" and reply.usage is not None
    assert reply.error_class == "OverallTimeout" and rig.session.aborted == 1
    with pytest.raises(RuntimeError):
        adapter.close()
    assert rig.client.stopped == 1 and rig.client.force_stopped == 1


def test_stop_has_the_sdk_shutdown_budget_and_a_failed_stop_is_forced(
    rig: Rig, monkeypatch: pytest.MonkeyPatch
) -> None:
    assert copilot_adapter._STOP_S >= 30  # shutdown RPC 10 + graceful 10 + terminate 5 + kill 5
    monkeypatch.setattr(copilot_adapter, "_STOP_S", 0.3)
    monkeypatch.setattr(copilot_adapter, "_DISCONNECT_S", 0.3)
    rig.client = HangingClient([])
    adapter = rig.make(text_script())
    assert call(adapter, request()).kind == "ok"
    with pytest.raises(RuntimeError, match="stop failed"):
        adapter.close()
    assert rig.client.force_stopped == 1


def test_close_releases_many_kept_exchanges(rig: Rig, small_bounds: None) -> None:
    clients: list[HangingClient] = []

    def factory(options: ClientOptions) -> HangingClient:
        clients.append(HangingClient(tool_script()))
        return clients[-1]

    adapter = rig.make(tool_script(), client_factory=factory)
    for n in "123":
        reply = call(adapter, request(), digest=n * 64)
        assert reply.kind == "ok" and reply.turn is not None
        assert reply.turn.stop_reason == "tool_use"
    started = time.monotonic()
    with pytest.raises(RuntimeError):
        adapter.close()
    assert time.monotonic() - started < 3  # one exchange's budget, not three
    assert len(clients) == 3 and all(c.stopped + c.force_stopped >= 1 for c in clients)
    assert adapter._thread is not None and not adapter._thread.is_alive()
    adapter.close()  # released: a no-op


def test_cancelled_handler_is_tool_call_lost(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    assert call(adapter, request()).kind == "ok"
    task = rig.session.tasks["c1"]

    async def cancel() -> None:
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    assert adapter._loop is not None
    asyncio.run_coroutine_threadsafe(cancel(), adapter._loop).result(5)
    answer = Message("tool", "PAGE TEXT", tool_call_id="c1")
    second = call(adapter, request(*tool_turn_history(), answer), 1)
    assert second.kind == "sent_unknown" and second.error_class == "ToolCallLost"
    assert "c1" not in rig.session.results


def test_nudge_after_text_turn_uses_the_same_session(rig: Rig) -> None:
    adapter = rig.make(text_script("FIRST"))
    rig.client.followups = [text_script("SECOND")]
    first = call(adapter, request())
    assert first.turn is not None and first.turn.stop_reason == "end"
    history = (SYSTEM, USER, Message("assistant", "FIRST"))
    second = call(adapter, request(*history, Message("user", "NUDGE")), 1)
    assert second.kind == "ok" and second.turn is not None and second.turn.text == "SECOND"
    assert len(rig.client.sessions) == 1 and rig.session.sent == ["hello", "NUDGE"]
    assert rig.session.disconnected == 0


def test_refused_replay_keeps_the_live_exchange(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    assert call(adapter, request()).kind == "ok"
    replay = call(adapter, request(), 0)
    assert replay.kind == "not_sent" and replay.error_class == "ExchangeExists"
    assert DIGEST in adapter._states and rig.session.disconnected == 0
    assert len(rig.client.sessions) == 1
    answer = Message("tool", "PAGE TEXT", tool_call_id="c1")
    assert call(adapter, request(*tool_turn_history(), answer), 1).kind == "ok"


def test_max_tokens_turn_with_calls_keeps_its_handlers(rig: Rig) -> None:
    script: list[Step] = [
        said(""),
        usage(finishReason="length", numToolCalls=1),
        Invoke("c1", "read_pages", {"p": 1}),
        Await(),
        *text_script(),
    ]
    adapter = rig.make(script)
    first = call(adapter, request())
    assert first.turn is not None and first.turn.stop_reason == "max_tokens"
    assert first.turn.tool_calls and not rig.session.tasks["c1"].done()
    answer = Message("tool", "PAGE TEXT", tool_call_id="c1")
    assert call(adapter, request(*tool_turn_history(), answer), 1).kind == "ok"
    assert rig.session.results == {"c1": "PAGE TEXT"}


def test_invocation_differing_from_start_event_is_mismatch(rig: Rig) -> None:
    script: list[Step] = [
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 100}),
        Invoke("c1", "read_pages", {"p": 1}, handler_arguments={"p": 2}),
        Await(),
    ]
    reply = call(rig.make(script), request())
    assert reply.kind == "sent_usage" and reply.error_class == "ToolCallMismatch"
    assert reply.usage is not None and reply.billed_usd == Decimal("0.000000001")


def test_tool_turn_waits_for_every_start_event(rig: Rig) -> None:
    script: list[Step] = [
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1),
        Invoke("c1", "read_pages", {"p": 1}),
        Await(),
    ]
    reply = call(rig.make(script), request())
    assert reply.turn is not None and [c.call_id for c in reply.turn.tool_calls] == ["c1"]


def test_runtime_environment_is_allowlisted(rig: Rig) -> None:
    secret = "ghp_" + "G" * 36
    env = {
        **rig.environ,
        "PATH": "/usr/bin",
        "LC_ALL": "C",
        "https_proxy": "http://proxy",
        "OPENAI_API_KEY": "sk-secret-value",
        "ANTHROPIC_API_KEY": "plainvalue-anthropic",
        "GH_TOKEN": secret,
        "GITHUB_TOKEN": secret,
        "PATHEXT": ".EXE",
        "WINDIR": "C:/W",
        "USERNAME": "u",
    }
    call(rig.make(text_script(), environ=env), request())
    (options,) = rig.options
    assert dict(options.env) == {
        "PATH": "/usr/bin",
        "LC_ALL": "C",
        "https_proxy": "http://proxy",
        "PATHEXT": ".EXE",
        "WINDIR": "C:/W",
        "USERNAME": "u",
    }
    assert TOKEN not in repr(dict(options.env)) and options.token == TOKEN


def test_options_repr_hides_the_token() -> None:
    options = ClientOptions("/opt/copilot", TOKEN, "/tmp/home", {"PATH": "/bin"})
    assert TOKEN not in repr(options) and TOKEN not in str(options)
    assert "PATH" not in repr(options)


def test_windows_paths_are_scrubbed(rig: Rig) -> None:
    home = str(PureWindowsPath(r"C:\Users\eric\Documents\final-workflow") / ".copilot-home" / "d")
    runtime = str(PureWindowsPath(r"C:\Users\eric\AppData\Local\copilot\copilot.exe"))
    options = ClientOptions(runtime, "t", home)
    adapter = rig.make(text_script())
    for error in (
        FileNotFoundError(3, "The system cannot find the path specified", home),
        PermissionError(13, "Access is denied", runtime),
    ):
        for text in (str(error), repr(error), str(error).upper(), str(error).replace("\\", "/")):
            assert "eric" not in adapter._scrub(text, options).lower(), text


def test_existing_home_is_refused(rig: Rig) -> None:
    (rig.home_root / ".copilot-home" / DIGEST / "r").mkdir(parents=True)
    reply = call(rig.make(text_script()), request())
    assert reply.kind == "not_sent" and reply.error_class == "HomeExists"
    assert reply.message == "HomeExists" and rig.options == []
    ignore = Path(__file__).resolve().parents[2] / ".gitignore"
    assert ".copilot-home/" in ignore.read_text(encoding="utf-8").splitlines()


class SendFails(FakeSession):
    async def send(self, text: str, /) -> str:
        await asyncio.sleep(0)
        raise RuntimeError("runtime went away")


class SendFailsClient(FakeClient):
    async def create_session(self, **options: Any) -> FakeSession:
        session = SendFails(self.script, options)
        self.sessions.append(session)
        return session


def test_sdk_exception_is_an_adapter_error_that_exports(rig: Rig, tmp_path: Path) -> None:
    rig.client = SendFailsClient([])
    adapter = rig.make([])
    run = tmp_path / "run"
    run.mkdir()
    executor = HandoffExecutor(run, adapter=adapter, cap_usd=Decimal(10), check=check)
    with pytest.raises(RuntimeError, match="cpos_live_stopped: sent_unknown"):
        executor(task())
    (rec,) = CallLog(run, Redactor()).records()
    assert rec["error_class"] == "AdapterError"
    assert str(rec["error"]).startswith("AdapterError: RuntimeError")
    assert export_recording(run, tmp_path / "out.jsonl", Redactor()) == 1


class OpenFails(FakeClient):
    def __init__(self, error: BaseException) -> None:
        super().__init__([])
        self.error = error

    async def create_session(self, **options: Any) -> FakeSession:
        raise self.error


@pytest.mark.parametrize(
    "error, message",
    [
        (RuntimeError("session refused"), "RuntimeError"),
        (TimeoutError(), "OverallTimeout"),
    ],
)
def test_pre_send_failure_is_not_sent_that_exports_and_replays(
    rig: Rig, tmp_path: Path, error: BaseException, message: str
) -> None:
    rig.client = OpenFails(error)
    adapter = rig.make([])
    run = tmp_path / "run"
    run.mkdir()
    executor = HandoffExecutor(run, adapter=adapter, cap_usd=Decimal(10), check=check)
    with pytest.raises(RuntimeError):
        executor(task())
    (rec,) = CallLog(run, Redactor()).records()
    assert rec["error_class"] == copilot_adapter.PRE_SEND_FAILURE
    assert message in str(rec["error"])
    if message == "RuntimeError":
        assert str(rec["error"]).startswith("PreSendFailure: RuntimeError")
    assert export_recording(run, tmp_path / "out.jsonl", Redactor()) == 1
    exported = json.loads((tmp_path / "out.jsonl").read_text(encoding="utf-8").splitlines()[0])
    assert exported["response"]["kind"] == "not_sent"
    assert exported["response"]["error_class"] == copilot_adapter.PRE_SEND_FAILURE
    (out := tmp_path / "rec").mkdir()
    (out / "r.jsonl").write_bytes((tmp_path / "out.jsonl").read_bytes())
    replayed = recorded_adapter(SPEC, out).complete(
        request(),
        invocation_digest=exported["invocation_digest"],
        call_index=exported["call_index"],
        reservation_id="r",
    )
    assert replayed.kind == "not_sent" and replayed.error_class == copilot_adapter.PRE_SEND_FAILURE


def test_profile_path_ending_at_a_space_leaves_no_surname(rig: Rig, tmp_path: Path) -> None:
    environ = {**rig.environ, "USERPROFILE": r"C:\Users\Jane Doe"}
    rig.client = OpenFails(RuntimeError(r"mkdir 'C:\Users\Jane Doe' failed"))
    adapter = rig.make([], environ=environ)
    run, _ = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    assert "Doe" not in str(rec["error"]) and "Jane" not in str(rec["error"])


def test_relative_or_root_values_do_not_erase_ordinary_text(rig: Rig, tmp_path: Path) -> None:
    environ = {**rig.environ, "COPILOT_CLI_PATH": "copilot-runtime", "HOME": "/"}
    rig.client = OpenFails(RuntimeError("failed after 3/4 retries at step 1.2"))
    (tmp_path / "copilot-runtime").write_text("#!/bin/sh\n")
    adapter = rig.make([], environ=environ)
    run, _ = _run_and_export(rig, tmp_path, adapter)
    (rec,) = CallLog(run, Redactor()).records()
    assert "after 3/4 retries at step 1.2" in str(rec["error"])


def gh_env(rig: Rig, tmp_path: Path, **extra: str) -> dict[str, str]:
    """An environment whose PATH holds a real executable file named gh."""
    bin_dir = tmp_path / "ghbin"
    bin_dir.mkdir(exist_ok=True)
    gh = bin_dir / "gh"
    gh.write_text("#!/bin/sh\n")
    gh.chmod(0o755)
    return {
        "COPILOT_USE_GH_LOGIN": "1",
        "COPILOT_CLI_PATH": str(rig.runtime),
        "PATH": f"{bin_dir}:/usr/bin",
        **extra,
    }


def test_gh_login_opt_in_sends_no_token_and_pins_gh(rig: Rig, tmp_path: Path) -> None:
    adapter = rig.make(text_script(), environ=gh_env(rig, tmp_path))
    reply = call(adapter, request())
    assert reply.kind == "ok" and [o.token for o in rig.options] == [None]
    assert rig.options[0].env["PATH"].startswith(str(tmp_path / "ghbin") + ":")
    assert adapter.auth == "gh-login"


def test_gh_not_found_is_key_missing_before_any_runtime(rig: Rig, tmp_path: Path) -> None:
    env = {**gh_env(rig, tmp_path), "PATH": str(tmp_path / "nowhere")}
    reply = call(rig.make(text_script(), environ=env), request())
    assert reply.kind == "not_sent" and reply.error_class == "KeyMissing"
    assert reply.message is not None
    assert "COPILOT_GITHUB_TOKEN" in reply.message and "COPILOT_USE_GH_LOGIN" in reply.message
    assert "gh" in reply.message and rig.options == []


@pytest.mark.parametrize("value", ["true", "0", "", "yes", " 1"])
def test_other_opt_in_values_are_key_missing(rig: Rig, tmp_path: Path, value: str) -> None:
    env = {**gh_env(rig, tmp_path), "COPILOT_USE_GH_LOGIN": value}
    reply = call(rig.make(text_script(), environ=env), request())
    assert reply.kind == "not_sent" and reply.error_class == "KeyMissing"
    assert reply.message is not None
    assert "COPILOT_GITHUB_TOKEN" in reply.message and "COPILOT_USE_GH_LOGIN" in reply.message
    assert rig.options == []


def test_token_wins_over_the_opt_in(rig: Rig, tmp_path: Path) -> None:
    env = {**gh_env(rig, tmp_path), "COPILOT_GITHUB_TOKEN": TOKEN}
    adapter = rig.make(text_script(), environ=env)
    call(adapter, request())
    assert [o.token for o in rig.options] == [TOKEN] and adapter.auth == "token"
    assert rig.options[0].env["PATH"] == env["PATH"]  # no gh pin when a token is set


@pytest.mark.parametrize(("token", "logged_in"), [(None, True), (TOKEN, False)])
def test_real_client_builds_the_sdk_client_from_the_credential(
    monkeypatch: pytest.MonkeyPatch, token: str | None, logged_in: bool
) -> None:
    import copilot

    seen: dict[str, Any] = {}
    monkeypatch.setattr(copilot, "CopilotClient", lambda **kw: seen.update(kw))
    real_client(ClientOptions("/opt/copilot", token, "/tmp/home"))
    assert seen["github_token"] == token and seen["use_logged_in_user"] is logged_in


def test_relative_path_entry_pins_an_absolute_gh_dir(rig: Rig, tmp_path: Path) -> None:
    gh = tmp_path / "gh"  # the rig's cwd is tmp_path
    gh.write_text("#!/bin/sh\n")
    gh.chmod(0o755)
    env = {**gh_env(rig, tmp_path), "PATH": ".:/usr/bin"}
    call(rig.make(text_script(), environ=env), request())
    assert rig.options[0].env["PATH"].startswith(str(tmp_path) + ":")


@pytest.mark.parametrize("value", [None, "true", "0", ""])
def test_auth_is_none_without_a_credential(rig: Rig, value: str | None) -> None:
    env = {"COPILOT_CLI_PATH": str(rig.runtime)}
    if value is not None:
        env["COPILOT_USE_GH_LOGIN"] = value
    assert rig.make(text_script(), environ=env).auth == "none"


def test_default_idle_bound_is_the_overall_bound(rig: Rig) -> None:
    # the reply is not streamed: the runtime is silent while the model writes
    adapter = rig.make(text_script())
    assert adapter._idle_s == adapter._overall_s == OVERALL_S
    assert adapter._idle_s > IDLE_S


# ---------------------------------------------------------------- compaction events (T3)


def compaction_script(*events: tuple[str, dict[str, Any]]) -> list[Step]:
    """A text turn with the runtime's compaction events arriving mid-call, before the usage."""
    return [
        *(Emit(wire(kind, data)) for kind, data in events),
        said("ANSWER"),
        usage(copilotUsage={"totalNanoAiu": 123456}),
        Idle(),
    ]


def test_a_compaction_that_completes_mid_call_is_on_the_reply(rig: Rig) -> None:
    from deploy_workflow.model.turn import Compaction
    from tests.model._compaction import COMPLETE_CP8, CP8_USD, START_CP8

    script = compaction_script(
        ("session.compaction_start", START_CP8), ("session.compaction_complete", COMPLETE_CP8)
    )
    reply = call(rig.make(script), request())
    assert reply.kind == "ok"
    assert [c.kind for c in reply.compactions] == ["start", "complete"]
    done = reply.compactions[1]
    assert done == Compaction(
        kind="complete",
        attempt_id="9adc3933-fffb-4810-a23a-717e91c08200",
        tokens_before=259070,
        tokens_after=42447,
        token_limit=272000,
        success=True,
        usd=Decimal(CP8_USD),
        usage_reported=True,
        request_count=1,
    )
    # the call's own charge is untouched: the compaction's is a separate amount on the reply
    assert reply.billed_usd == Decimal("0.00000123456")


def test_a_call_without_compaction_has_none(rig: Rig) -> None:
    assert call(rig.make(text_script()), request()).compactions == ()


def test_a_start_with_no_complete_is_recorded_as_a_start_only(rig: Rig) -> None:
    from tests.model._compaction import START_MEDIUM_CP8

    script = compaction_script(("session.compaction_start", START_MEDIUM_CP8))
    reply = call(rig.make(script), request())
    assert [c.kind for c in reply.compactions] == ["start"]
    assert reply.compactions[0].tokens_before == 225537


def test_a_compaction_in_a_timed_out_call_is_still_on_the_reply(rig: Rig) -> None:
    from tests.model._compaction import COMPLETE_CP8

    script: list[Step] = [
        Emit(wire("session.compaction_complete", COMPLETE_CP8)),
        said("part"),
        usage(copilotUsage={"totalNanoAiu": 5}),
    ]
    reply = call(rig.make(script, idle_s=0.2, overall_s=30.0), request())
    assert reply.kind == "sent_usage" and reply.error_class == "IdleTimeout"
    assert [c.kind for c in reply.compactions] == ["complete"]


def test_runtime_cannot_start_unreserved_background_model_calls(rig: Rig) -> None:
    call(rig.make(text_script()), request())
    assert rig.session.options["infinite_sessions"] == {"enabled": False}
    assert rig.session.options["autopilot"] == {"continuation_enabled": False}


def test_a_compaction_call_exports_with_the_turns_own_billed_amount(
    rig: Rig, tmp_path: Path
) -> None:
    """calls.jsonl carries the compaction and a settled charge that includes it; the recording
    still exports, with the turn's own billed amount (what the raw body parses to)."""
    from tests.model._compaction import COMPLETE_CP8, START_CP8
    from tests.test_handoff_loop import GOOD

    script: list[Step] = [
        Emit(wire("session.compaction_start", START_CP8)),
        Emit(wire("session.compaction_complete", COMPLETE_CP8)),
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 123456}),
        Invoke("c1", "write_handoff", {"markdown": GOOD.decode()}),
        Await(),
    ]
    run, exported = _run_and_export(rig, tmp_path, rig.make(script))
    (rec,) = CallLog(run, Redactor()).records()
    assert rec["cost_status"] == "billed"
    # 0.00000123456 (the turn: 123,456 nano-AIU) + 0.0996381 (the compaction), by hand
    assert Decimal(rec["settled_usd"]) == Decimal("0.09963933456")
    assert [c["kind"] for c in rec["compactions"]] == ["start", "complete"]
    assert exported["response"]["billed_usd"] == "0.00000123456"  # the turn's own, not the sum


def test_a_completion_that_arrives_after_the_boundary_is_drained_when_the_module_ends(
    rig: Rig,
) -> None:
    """Probe t3adv-p1: the compaction completes after the call's boundary, while the session is
    still open. The reply cannot carry it; the drain hands it back."""
    from tests.model._compaction import COMPLETE_CP8, CP8_USD, START_CP8

    script: list[Step] = [
        Emit(wire("session.compaction_start", START_CP8)),
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 123456}),
        Invoke("c1", "read_pages", {"p": 1}),
        Emit(wire("session.compaction_complete", COMPLETE_CP8)),
        Await(),
    ]
    adapter = rig.make(script)
    reply = call(adapter, request())
    assert [c.kind for c in reply.compactions] == ["start"]
    late = adapter.drain_compactions(DIGEST)
    assert [(c.kind, c.usd) for c in late] == [("complete", Decimal(CP8_USD))]
    assert adapter.drain_compactions(DIGEST) == ()  # drained once


def test_a_drain_that_times_out_is_logged_not_silent(
    rig: Rig, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    adapter = rig.make(tool_script())
    call(adapter, request())
    monkeypatch.setattr(copilot_adapter, "_OUTER_SLACK_S", 0.2)
    assert adapter._loop is not None
    adapter._loop.call_soon_threadsafe(time.sleep, 1.0)  # the loop does not answer in time
    with caplog.at_level(logging.WARNING):
        assert adapter.drain_compactions(DIGEST) == ()
    assert any("drain" in r.getMessage() and r.levelno == logging.WARNING for r in caplog.records)


def test_a_summary_running_at_the_module_end_is_swept_before_close(
    rig: Rig, tmp_path: Path
) -> None:
    """The adapter is closed before the launcher totals the run: a summary that completes after
    the module's end drain is taken by the sweep that precedes the close."""
    import asyncio

    from deploy_workflow.run_events import read_events
    from tests.model._compaction import COMPLETE_CP8, START_CP8
    from tests.test_handoff_loop import GOOD

    script: list[Step] = [
        Emit(wire("session.compaction_start", START_CP8)),
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 123456}),
        Invoke("c1", "write_handoff", {"markdown": GOOD.decode()}),
        Await(),
    ]
    adapter = rig.make(script)
    run = tmp_path / "run"
    run.mkdir()
    executor = HandoffExecutor(
        run / "live", adapter=adapter, cap_usd=Decimal(25), check=check, events=run
    )
    assert executor(task()) == GOOD
    names = [e["event"] for e in read_events(run / "events.jsonl")]
    assert "compaction_uncharged" in names and "compaction_charge_late" not in names
    assert adapter._loop is not None
    adapter._loop.call_soon_threadsafe(
        rig.session.deliver, wire("session.compaction_complete", COMPLETE_CP8)
    )
    asyncio.run_coroutine_threadsafe(asyncio.sleep(0.05), adapter._loop).result(5)
    executor.drain_late()
    (late,) = [
        e for e in read_events(run / "events.jsonl") if e["event"] == "compaction_charge_late"
    ]
    assert Decimal(late["usd"]) == Decimal("0.0996381")


def test_draining_an_unknown_or_closed_exchange_gives_nothing(rig: Rig) -> None:
    adapter = rig.make(text_script())
    assert adapter.drain_compactions("e" * 64) == ()
    call(adapter, request())
    adapter.close()
    assert adapter.drain_compactions(DIGEST) == ()


def test_a_late_completion_through_the_executor_is_disclosed_not_lost(
    rig: Rig, tmp_path: Path
) -> None:
    """Probe t3adv-p1's scenario end to end: the last call is settled without the summary's
    charge; the module's end drains it into a ``compaction_charge_late`` event."""
    from deploy_workflow.run_events import read_events
    from tests.model._compaction import COMPLETE_CP8, CP8_USD, START_CP8
    from tests.test_handoff_loop import GOOD

    script: list[Step] = [
        Emit(wire("session.compaction_start", START_CP8)),
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 123456}),
        Invoke("c1", "write_handoff", {"markdown": GOOD.decode()}),
        Emit(wire("session.compaction_complete", COMPLETE_CP8)),
        Await(),
    ]
    run = tmp_path / "run"
    run.mkdir()
    executor = HandoffExecutor(
        run / "live", adapter=rig.make(script), cap_usd=Decimal(25), check=check, events=run
    )
    assert executor(task()) == GOOD
    events = read_events(run / "events.jsonl")
    (late,) = [e for e in events if e["event"] == "compaction_charge_late"]
    assert Decimal(late["usd"]) == Decimal(CP8_USD) and late["module"] == "CP-2"
    assert not [e for e in events if e["event"] == "compaction_uncharged"]
    assert executor.budget.spent == Decimal("0.00000123456")  # the last call's marker is final


# ---------------------------------------------------------------- release at the module's end


def _wait_for_states(adapter: CopilotAdapter, want: int) -> None:
    """Let the loop thread run its queued teardown; bounded, no sleeping on the caller's side."""
    assert adapter._loop is not None

    async def settle() -> None:
        for _ in range(200):
            if len(adapter._states) == want:
                return
            await asyncio.sleep(0.01)

    asyncio.run_coroutine_threadsafe(settle(), adapter._loop).result(10)
    assert len(adapter._states) == want


def _two_clients(rig: Rig) -> tuple[list[FakeClient], Callable[[ClientOptions], FakeClient]]:
    clients: list[FakeClient] = []

    def factory(options: ClientOptions) -> FakeClient:
        clients.append(FakeClient(tool_script()))
        return clients[-1]

    return clients, factory


def test_released_modules_have_their_runtimes_stopped_before_close(rig: Rig) -> None:
    clients, factory = _two_clients(rig)
    adapter = rig.make(tool_script(), client_factory=factory)
    for n in "12":
        assert call(adapter, request(), digest=n * 64).kind == "ok"
    assert len(adapter._states) == 2
    adapter.release("1" * 64)
    adapter.release("2" * 64)
    _wait_for_states(adapter, 0)
    assert [c.stopped for c in clients] == [1, 1]  # stop was awaited for both, close() not yet run
    assert not adapter._closed
    adapter.close()  # nothing left to release, nothing to raise
    assert [c.stopped for c in clients] == [1, 1]


def test_release_is_idempotent_and_a_no_op_for_unknown_or_closed(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    adapter.release("9" * 64)  # before any loop exists
    assert call(adapter, request()).kind == "ok"
    adapter.release("9" * 64)  # unknown digest
    adapter.release(DIGEST)
    adapter.release(DIGEST)
    _wait_for_states(adapter, 0)
    adapter.release(DIGEST)  # already released
    assert rig.client.stopped == 1
    adapter.close()
    adapter.release(DIGEST)  # after close
    assert rig.client.stopped == 1


def test_a_release_failure_is_raised_by_close(rig: Rig, small_bounds: None) -> None:
    class StopFails(FakeClient):
        async def stop(self) -> None:
            raise RuntimeError("stop failed")

    adapter = rig.make(tool_script(), client_factory=lambda options: StopFails(tool_script()))
    assert call(adapter, request()).kind == "ok"
    adapter.release(DIGEST)
    _wait_for_states(adapter, 0)
    with pytest.raises(RuntimeError, match="stop failed"):
        adapter.close()


def test_compactions_drained_before_the_release_are_what_the_caller_obtains(rig: Rig) -> None:
    from tests.model._compaction import COMPLETE_CP8, CP8_USD, START_CP8

    script: list[Step] = [
        Emit(wire("session.compaction_start", START_CP8)),
        said(""),
        usage(finishReason="tool_calls", numToolCalls=1, copilotUsage={"totalNanoAiu": 123456}),
        Invoke("c1", "read_pages", {"p": 1}),
        Emit(wire("session.compaction_complete", COMPLETE_CP8)),
        Await(),
    ]
    adapter = rig.make(script)
    assert call(adapter, request()).kind == "ok"
    late = adapter.drain_compactions(DIGEST)
    adapter.release(DIGEST)
    assert [(c.kind, c.usd) for c in late] == [("complete", Decimal(CP8_USD))]
    _wait_for_states(adapter, 0)
    assert adapter.drain_compactions(DIGEST) == ()  # a released session gives nothing more


def test_a_late_call_under_a_released_digest_is_refused_not_hung(rig: Rig) -> None:
    adapter = rig.make(tool_script())
    assert call(adapter, request()).kind == "ok"
    adapter.release(DIGEST)
    _wait_for_states(adapter, 0)
    late = call(adapter, request(SYSTEM, USER), index=1)
    assert late.kind == "not_sent" and late.error_class == "SessionMissing"
    assert rig.client.stopped == 1  # the stopped client was not reused
    adapter.close()


def test_a_first_call_after_a_release_opens_a_fresh_exchange(rig: Rig) -> None:
    clients, factory = _two_clients(rig)
    adapter = rig.make(tool_script(), client_factory=factory)
    assert call(adapter, request()).kind == "ok"
    adapter.release(DIGEST)
    _wait_for_states(adapter, 0)
    again = adapter.complete(request(), invocation_digest=DIGEST, call_index=0, reservation_id="s")
    assert again.kind == "ok"
    assert len(clients) == 2 and clients[0].stopped == 1 and clients[1].stopped == 0


def test_a_release_leaves_another_modules_exchange_in_flight_alone(rig: Rig) -> None:
    clients, factory = _two_clients(rig)
    adapter = rig.make(tool_script(), client_factory=factory)
    other = "3" * 64
    assert call(adapter, request(), digest=other).kind == "ok"
    assert call(adapter, request()).kind == "ok"
    adapter.release(DIGEST)
    _wait_for_states(adapter, 1)
    assert list(adapter._states) == [other]
    assert [c.stopped for c in clients] == [0, 1]
    tool_result = Message("tool", "PAGE TEXT", tool_call_id="c1")
    follow = call(adapter, request(*tool_turn_history(), tool_result), 1, digest=other)
    assert follow.kind == "ok"  # the other module's kept exchange still answers
    adapter.close()


def test_seat_catalogue_does_not_open_an_inference_session(rig: Rig) -> None:
    rig.client.models = [
        {"id": "gpt-6.1-sol", "supportedReasoningEfforts": ["medium", None, "high"]},
        {"id": "gpt-6-luna", "supportedReasoningEfforts": ["xhigh"]},
        {"id": "unknown"},
        {"id": "disabled", "supportedReasoningEfforts": ["high"], "policy": {"state": "disabled"}},
    ]
    adapter = rig.make([])
    assert asyncio.run(adapter.seat_models()) == {
        "gpt-6.1-sol": frozenset({"medium", "high"}),
        "gpt-6-luna": frozenset({"xhigh"}),
        "unknown": frozenset(),
        "disabled": frozenset(),
    }
    assert rig.client.started == rig.client.stopped == 1
    assert rig.client.sessions == []
    assert not Path(rig.options[0].home).exists()


@pytest.mark.parametrize(
    ("efforts", "policy", "available"),
    [
        (None, None, False),
        (["high"], None, False),
        (["xhigh"], None, True),
        (["xhigh"], "disabled", False),
        (["xhigh"], "unconfigured", False),
        (["xhigh"], "enabled", True),
    ],
)
def test_luna_xhigh_requires_explicit_runtime_support(
    rig: Rig, efforts: list[str] | None, policy: str | None, available: bool
) -> None:
    spec = ModelSpec("copilot-luna-xhigh", "copilot", "gpt-6-luna", "xhigh")
    rig.ruling.write_text(
        RULING_TEXT.replace("copilot-sol-medium", spec.config_id), encoding="utf-8"
    )
    listing: dict[str, Any] = {"id": spec.model, "supportedReasoningEfforts": efforts}
    if policy is not None:
        listing["policy"] = {"state": policy}
    rig.client.models = [listing]
    script = [said("ANSWER"), usage(model=spec.model, copilotUsage={"totalNanoAiu": 123}), Idle()]
    adapter = rig.make(script, spec=spec)
    reply = call(adapter, TurnRequest((SYSTEM, USER), (TOOL,), 1000, "xhigh"))
    if available:
        assert reply.kind == "ok"
        assert rig.session.options["model"] == "gpt-6-luna"
        assert rig.session.options["reasoning_effort"] == "xhigh"
    else:
        assert reply.kind == "not_sent" and reply.error_class == "EffortUnavailable"
        assert rig.client.sessions == []


def test_live_request_checks_catalogue_context_before_opening_a_session(rig: Rig) -> None:
    rig.client.models[0]["capabilities"] = {"limits": {"max_context_window_tokens": 500}}
    adapter = rig.make(text_script())
    reply = call(adapter, request())
    assert reply.kind == "not_sent" and reply.error_class == "ContextTooLong"
    assert rig.client.sessions == []


def test_continuation_checks_catalogue_limit_before_delivering_tool_results(rig: Rig) -> None:
    rig.client.models[0]["capabilities"] = {"limits": {"max_prompt_tokens": 1000}}
    adapter = rig.make(tool_script())
    assert call(adapter, request()).kind == "ok"
    tool_result = Message("tool", "x" * 6000, tool_call_id="c1")
    reply = call(adapter, request(*tool_turn_history(), tool_result), 1)
    assert reply.kind == "not_sent" and reply.error_class == "ContextTooLong"
    assert rig.session.sent == [USER.text]


# ---------------------------------------------------------------- the long-context tier
#
# 922,000 and 300,000 below are illustrative test figures, not readings from a seat. Request sizes
# are worked by hand: the guard estimates tokens as ceil(bytes / 3.85), so a request of N tokens
# (N a multiple of 20) is N * 385 / 100 bytes of compact JSON. The test measures the request's JSON
# with the standard library to pad it to exactly that size; it calls no production estimator.

OPUS = ModelSpec("copilot-opus-medium", "copilot", "claude-opus-5.5", "medium")
LONG = 922_000


TABLE_RATES: dict[str, Any] = {"inputPrice": 500, "outputPrice": 1500}


def sol_row(**long_tier: Any) -> dict[str, Any]:
    row: dict[str, Any] = {
        "id": "gpt-6.1-sol",
        "supportedReasoningEfforts": ["low", "medium", "high"],
    }
    if long_tier:
        # the long tier's listed prices, at the hold table's rates (USD 5 / 15 per million:
        # AI credits per batch x USD 0.01 x 1,000,000 / batchSize)
        row["billing"] = {
            "tokenPrices": {
                "batchSize": 1_000_000,
                "longContext": {**TABLE_RATES, **long_tier},
            }
        }
    return row


def sized(tokens: int, extra: int = 0) -> TurnRequest:
    """A request whose compact JSON is ``tokens * 385 / 100 + extra`` bytes."""
    assert tokens % 20 == 0
    target = tokens * 385 // 100 + extra

    def size(pad: int) -> int:
        req = TurnRequest((SYSTEM, Message("user", "x" * pad)), (TOOL,), 1000, "medium")
        return len(json.dumps(dataclasses.asdict(req), separators=(",", ":")).encode())

    pad = target - size(0)
    assert pad > 0 and size(pad) == target
    return TurnRequest((SYSTEM, Message("user", "x" * pad)), (TOOL,), 1000, "medium")


def long_rig(rig: Rig, row: dict[str, Any], script: list[Step] | None = None, **kw: Any) -> Any:
    rig.client.models = [row]
    return rig.make(script if script is not None else text_script(), long_context=True, **kw)


def test_a1_a_listed_long_tier_is_requested_and_confirmed(rig: Rig) -> None:
    adapter = long_rig(rig, sol_row(maxPromptTokens=LONG))
    reply = call(adapter, request())
    assert reply.kind == "ok"
    assert rig.session.options["context_tier"] == "long_context"


def test_a2_no_billing_row_opens_on_the_default_tier(rig: Rig) -> None:
    reply = call(long_rig(rig, sol_row()), request())
    assert reply.kind == "ok" and "context_tier" not in rig.session.options


def test_a3_the_long_budget_replaces_the_default_limits(rig: Rig) -> None:
    row = sol_row(maxPromptTokens=LONG)
    row["capabilities"] = {
        "limits": {"max_prompt_tokens": 272_000, "max_context_window_tokens": 272_000}
    }
    reply = call(long_rig(rig, row), sized(300_000))
    assert reply.kind == "ok"


def test_a4_without_a_long_tier_300k_tokens_is_refused_before_a_session(rig: Rig) -> None:
    reply = call(long_rig(rig, sol_row()), sized(300_000))
    assert reply.kind == "not_sent" and reply.error_class == "ContextTooLong"
    assert rig.client.sessions == []


def test_a5_the_budget_is_inclusive(rig: Rig) -> None:
    adapter = long_rig(rig, sol_row(maxPromptTokens=300_000))
    assert call(adapter, sized(300_000)).kind == "ok"
    over = call(adapter, sized(300_000, extra=1), digest="e" * 64)
    assert over.kind == "not_sent" and over.error_class == "ContextTooLong"
    assert len(rig.client.sessions) == 1


@pytest.mark.parametrize("bad", [True, 0, "922000", None])
def test_a6_an_unusable_budget_or_tier_means_the_default_tier(rig: Rig, bad: Any) -> None:
    row = sol_row(maxPromptTokens=bad)
    if bad is None:
        row["billing"]["tokenPrices"]["longContext"] = "not a dict"
    reply = call(long_rig(rig, row), request())
    assert reply.kind == "ok" and "context_tier" not in rig.session.options


def test_a7_the_deprecated_alias_is_read_when_the_budget_is_absent(rig: Rig) -> None:
    reply = call(long_rig(rig, sol_row(contextMax=LONG)), sized(300_000))
    assert reply.kind == "ok" and rig.session.options["context_tier"] == "long_context"


def test_a8_opus_stays_on_the_default_tier(rig: Rig) -> None:
    rig.ruling.write_text(
        RULING_TEXT.replace("copilot-sol-medium", "copilot-opus-medium"), encoding="utf-8"
    )
    row = {
        "id": "claude-opus-5.5",
        "supportedReasoningEfforts": ["medium", "high"],
        "billing": {"tokenPrices": {"longContext": {"maxPromptTokens": 1000}}},
    }
    rig.client.models = [row]
    script = [
        said("ANSWER"),
        usage(model="claude-opus-5.5", copilotUsage={"totalNanoAiu": 1}),
        Idle(),
    ]
    adapter = rig.make(script, spec=OPUS, long_context=True)
    reply = call(adapter, TurnRequest(sized(5000).messages, (TOOL,), 1000, "medium"))
    assert reply.kind == "ok" and "context_tier" not in rig.session.options


def _refused_on_a_default_session(rig: Rig, reply: AdapterReply) -> None:
    assert reply.kind == "not_sent" and reply.error_class == "ContextTooLong"
    assert len(rig.client.sessions) == 1
    assert rig.session.options["context_tier"] == "long_context"
    assert rig.session.sent == []
    rig.released()
    assert rig.session.disconnected == 1
    assert reply.message is not None and "context tier" in reply.message


def test_a9_a_session_that_reports_the_default_tier_is_guarded_by_the_default_limit(
    rig: Rig,
) -> None:
    rig.client.tier_read = lambda _session: "default"
    adapter = long_rig(rig, sol_row(maxPromptTokens=LONG))
    _refused_on_a_default_session(rig, call(adapter, sized(300_000)))


def test_a10_a_failed_tier_read_is_guarded_by_the_default_limit(rig: Rig) -> None:
    def broken(_session: FakeSession) -> str | None:
        raise RuntimeError("the runtime does not know session.model.getCurrent")

    rig.client.tier_read = broken
    adapter = long_rig(rig, sol_row(maxPromptTokens=LONG))
    _refused_on_a_default_session(rig, call(adapter, sized(300_000)))


def test_a11_a_continuation_is_guarded_by_the_long_budget(rig: Rig) -> None:
    adapter = long_rig(rig, sol_row(maxPromptTokens=1000), tool_script())
    assert call(adapter, request()).kind == "ok"
    tool_result = Message("tool", "x" * 6000, tool_call_id="c1")
    reply = call(adapter, request(*tool_turn_history(), tool_result), 1)
    assert reply.kind == "not_sent" and reply.error_class == "ContextTooLong"
    assert rig.session.sent == [USER.text]


def test_a12_a_budget_over_the_priced_context_is_not_pinned(rig: Rig) -> None:
    reply = call(long_rig(rig, sol_row(maxPromptTokens=1_050_001)), request())
    assert reply.kind == "ok" and "context_tier" not in rig.session.options


def test_a13_a_default_session_with_a_small_prompt_is_sent_and_says_why(rig: Rig) -> None:
    rig.client.tier_read = lambda _session: "default"
    reply = call(long_rig(rig, sol_row(maxPromptTokens=LONG)), request())
    assert reply.kind == "ok" and rig.session.sent == [USER.text]
    assert reply.message is not None and "context tier" in reply.message


def test_a14_an_adapter_built_without_the_keyword_stays_on_the_default_tier(rig: Rig) -> None:
    rig.client.models = [sol_row(maxPromptTokens=LONG)]
    reply = call(rig.make(text_script()), request())
    assert reply.kind == "ok" and "context_tier" not in rig.session.options


def test_a15_an_invalid_budget_falls_back_to_the_alias(rig: Rig) -> None:
    row = sol_row(maxPromptTokens="x", contextMax=LONG)
    reply = call(long_rig(rig, row), sized(300_000))
    assert reply.kind == "ok" and rig.session.options["context_tier"] == "long_context"


# ---- F2: the pin checks the seat's listed long-tier prices against the hold's rates
# (AI credits per batch x USD 0.01 x 1,000,000 / batchSize = USD per million tokens)


def _pinned(rig: Rig, row: dict[str, Any]) -> bool:
    reply = call(long_rig(rig, row), request())
    assert reply.kind == "ok"
    return rig.session.options.get("context_tier") == "long_context"


def test_f2a_prices_at_the_table_rates_pin(rig: Rig) -> None:
    assert _pinned(rig, sol_row(maxPromptTokens=LONG))


def test_f2a_the_batch_size_scales_the_price(rig: Rig) -> None:
    row = sol_row(maxPromptTokens=LONG, inputPrice=0.5, outputPrice=1.5)  # per 1,000 tokens
    row["billing"]["tokenPrices"]["batchSize"] = 1000
    assert _pinned(rig, row)


@pytest.mark.parametrize(
    "over",
    [
        {"inputPrice": 501},  # USD 5.01 per million: one credit-unit above the top input rate
        {"outputPrice": 1501},
        {"cacheReadPrice": 501},
        {"cacheWritePrice": 501},
        {"cacheWrite1hPrice": 501},
    ],
)
def test_f2b_f2c_a_price_above_the_hold_rate_is_not_pinned(
    rig: Rig, caplog: pytest.LogCaptureFixture, over: dict[str, Any]
) -> None:
    import logging

    with caplog.at_level(logging.WARNING):
        assert not _pinned(rig, sol_row(maxPromptTokens=LONG, **over))
    assert any(
        r.levelno == logging.WARNING and "long-tier" in r.getMessage() for r in caplog.records
    )


@pytest.mark.parametrize("name", ["batchSize", "inputPrice", "outputPrice"])
def test_f2d_a_missing_required_field_is_not_pinned(rig: Rig, name: str) -> None:
    row = sol_row(maxPromptTokens=LONG)
    prices = row["billing"]["tokenPrices"]
    (prices if name == "batchSize" else prices["longContext"]).pop(name)
    assert not _pinned(rig, row)


@pytest.mark.parametrize(
    "over",
    [
        {"inputPrice": True},
        {"outputPrice": True},
        {"inputPrice": "500"},
        {"cacheWritePrice": False},
        {"cacheReadPrice": "x"},
    ],
)
def test_f2d_a_bool_or_non_numeric_price_is_not_pinned(rig: Rig, over: dict[str, Any]) -> None:
    assert not _pinned(rig, sol_row(maxPromptTokens=LONG, **over))


@pytest.mark.parametrize("batch", [True, 0, -1, 1.5, "1000000", None])
def test_f2d_an_unusable_batch_size_is_not_pinned(rig: Rig, batch: Any) -> None:
    row = sol_row(maxPromptTokens=LONG)
    row["billing"]["tokenPrices"]["batchSize"] = batch
    assert not _pinned(rig, row)


LUNA = ModelSpec("copilot-luna-xhigh", "copilot", "gpt-6-luna", "xhigh")


def _luna_pinned(rig: Rig, input_price: int) -> bool:
    rig.ruling.write_text(
        RULING_TEXT.replace("copilot-sol-medium", "copilot-luna-xhigh"), encoding="utf-8"
    )  # USD 0.25 / 0.75 per million: 25 / 75 credits per 1,000,000
    row = {
        "id": "gpt-6-luna",
        "supportedReasoningEfforts": ["medium", "xhigh"],
        "billing": {
            "tokenPrices": {
                "batchSize": 1_000_000,
                "longContext": {
                    "maxPromptTokens": LONG,
                    "inputPrice": input_price,
                    "outputPrice": 75,
                },
            }
        },
    }
    rig.client.models = [row]
    script = [said("A"), usage(model="gpt-6-luna", copilotUsage={"totalNanoAiu": 1}), Idle()]
    asked = TurnRequest((SYSTEM, USER), (TOOL,), 1000, "xhigh")
    reply = call(rig.make(script, spec=LUNA, long_context=True), asked)
    assert reply.kind == "ok", reply.message
    return rig.session.options.get("context_tier") == "long_context"


def test_f2e_luna_pins_at_its_rates(rig: Rig) -> None:
    assert _luna_pinned(rig, 25)


def test_f2e_luna_at_026_input_is_not_pinned(rig: Rig) -> None:
    assert not _luna_pinned(rig, 26)


# ---- F4: events between create_session and the tier read are captured


def test_f4_an_event_before_the_tier_read_returns_is_in_the_call(rig: Rig) -> None:
    def early(session: FakeSession) -> str:
        session.deliver(said("EARLY ").event)
        return "long_context"

    rig.client.tier_read = early
    reply = call(long_rig(rig, sol_row(maxPromptTokens=LONG)), request())
    assert reply.kind == "ok" and reply.turn is not None and "EARLY" in reply.turn.text


# Batch fix 2 (B1-B6): a call with more than one assistant.usage event
def _two_usages(*before: Step, second: dict[str, Any] | None = None, **first: Any) -> list[Step]:
    return [
        *before,
        said(""),
        usage(copilotUsage={"totalNanoAiu": 1000}, **first),
        usage(**{"copilotUsage": {"totalNanoAiu": 2000}, **(second or {})}),
        Idle(),
    ]


def _run_two(rig: Rig, script: list[Step]) -> Any:
    return call(rig.make(script, idle_s=5.0, overall_s=30.0), request())


def test_b1a_a_key_split_across_messages_in_a_summed_call_is_withheld(rig: Rig) -> None:
    from deploy_workflow.model.adapter import _REFLECTED_RAW

    half = len(TOKEN) // 2
    reply = _run_two(rig, _two_usages(said(TOKEN[:half]), said(TOKEN[half:])))
    assert reply.kind == "sent_usage" and reply.billed_usd == Decimal("0.00000003")
    assert reply.raw == _REFLECTED_RAW


def test_b1b_the_same_split_key_in_a_one_usage_call_is_key_reflected(rig: Rig) -> None:
    half = len(TOKEN) // 2
    script = [
        said(TOKEN[:half]),
        said(TOKEN[half:]),
        usage(copilotUsage={"totalNanoAiu": 1}),
        Idle(),
    ]
    reply = _run_two(rig, script)
    assert reply.error_class == "KeyReflected" and reply.raw == b'"[redacted]"'


def test_b2_an_unavailable_credit_status_in_a_summed_call_is_sent_unknown(rig: Rig) -> None:
    second = {"copilotUsage": {"totalNanoAiu": 0}, "aiCreditsStatus": "unavailable"}
    reply = _run_two(rig, _two_usages(second=second))
    assert reply.kind == "sent_unknown" and reply.billed_usd is None


def test_b3_one_usage_event_delivered_twice_is_sent_unknown(rig: Rig) -> None:
    same = usage(copilotUsage={"totalNanoAiu": 1000}, apiCallId="req-1")
    reply = _run_two(rig, [said(""), same, Emit(dict(same.event)), Idle()])
    assert reply.kind == "sent_unknown" and reply.billed_usd is None


def test_b4_a_last_usage_that_asks_for_tool_calls_is_sent_unknown(rig: Rig) -> None:
    reply = _run_two(rig, _two_usages(second={"finishReason": "tool_calls"}))
    assert reply.kind == "sent_unknown" and reply.billed_usd is None


def test_b5_a_byok_usage_in_a_summed_call_keeps_its_routing_class(rig: Rig) -> None:
    from deploy_workflow.model.reply_classes import BYOK_ROUTED

    reply = _run_two(rig, _two_usages(isByok=True))
    assert reply.kind == "sent_usage" and reply.error_class == BYOK_ROUTED
    assert reply.billed_usd == Decimal("0.00000003")


def test_b6_a_budget_over_the_priced_context_logs_why_it_is_not_pinned(
    rig: Rig, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    with caplog.at_level(logging.WARNING):
        assert not _pinned(rig, sol_row(maxPromptTokens=1_050_001))
    assert any(
        r.levelno == logging.WARNING and "1,050,001" in r.getMessage() for r in caplog.records
    )


# Fix round 2 (G1-G4): the tier query the executor reads, the cachePrice alias, the SDK tier read
def test_g1_long_tier_in_force_is_true_only_for_a_confirmed_long_session(rig: Rig) -> None:
    adapter = long_rig(rig, sol_row(maxPromptTokens=LONG))
    assert adapter.long_tier_in_force(DIGEST) is False  # no exchange yet
    assert call(adapter, request()).kind == "ok"
    assert adapter.long_tier_in_force(DIGEST) is True
    assert adapter.long_tier_in_force("e" * 64) is False  # another digest
    adapter.release(DIGEST)
    rig.released()
    assert adapter.long_tier_in_force(DIGEST) is False


def test_g1_a_session_that_fell_back_to_the_default_tier_is_not_long_in_force(rig: Rig) -> None:
    rig.client.tier_read = lambda _session: "default"
    adapter = long_rig(rig, sol_row(maxPromptTokens=LONG))
    assert call(adapter, request()).kind == "ok"
    assert adapter.long_tier_in_force(DIGEST) is False


def test_g1_an_unpinned_session_is_not_long_in_force(rig: Rig) -> None:
    adapter = long_rig(rig, sol_row())  # the seat lists no long tier
    assert call(adapter, request()).kind == "ok"
    assert adapter.long_tier_in_force(DIGEST) is False


def test_g2_a_deprecated_cache_price_above_the_hold_rate_is_not_pinned(
    rig: Rig, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    # 100,000 credits per 1,000,000 tokens = USD 1,000 per million, 200x the top input rate
    with caplog.at_level(logging.WARNING):
        assert not _pinned(rig, sol_row(maxPromptTokens=LONG, cachePrice=100_000))
    assert any(
        r.levelno == logging.WARNING and "cachePrice" in r.getMessage() for r in caplog.records
    )


def test_g2_a_deprecated_cache_price_at_the_table_rate_pins(rig: Rig) -> None:
    assert _pinned(rig, sol_row(maxPromptTokens=LONG, cachePrice=500))


def _sdk_session(payload: dict[str, Any]) -> Any:
    from types import SimpleNamespace

    from copilot.generated.rpc import CurrentModel

    async def get_current() -> CurrentModel:
        return CurrentModel.from_dict(payload)

    return SimpleNamespace(rpc=SimpleNamespace(model=SimpleNamespace(get_current=get_current)))


@pytest.mark.parametrize(
    ("payload", "expected"),
    [
        ({"contextTier": "long_context", "modelId": "gpt-6.1-sol"}, "long_context"),
        ({"contextTier": "default"}, "default"),
        ({}, None),
    ],
)
def test_g4_the_sdk_wrapper_reads_the_tier_from_the_sdks_own_type(
    payload: dict[str, Any], expected: str | None
) -> None:
    from deploy_workflow.model.copilot_adapter import _SdkClient

    client = _SdkClient(None, None, None, None)
    assert asyncio.run(client.context_tier(_sdk_session(payload))) == expected


def test_g4_an_unknown_sdk_tier_raises_for_the_tier_read_to_record() -> None:
    from deploy_workflow.model.copilot_adapter import _SdkClient

    client = _SdkClient(None, None, None, None)
    with pytest.raises(AssertionError):  # the SDK's enum decoder asserts on an unknown value
        asyncio.run(client.context_tier(_sdk_session({"contextTier": "huge"})))


def test_g1_the_executor_reads_the_real_adapters_tier(rig: Rig, tmp_path: Path) -> None:
    from deploy_workflow.model.handoff import HandoffExecutor

    adapter = long_rig(rig, sol_row(maxPromptTokens=LONG))
    executor = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(1), check=lambda *_: (), events=tmp_path
    )
    assert executor._read_cap(DIGEST) == 1_100_000  # nothing opened yet
    assert call(adapter, request()).kind == "ok"
    assert executor._read_cap(DIGEST) == 2_145_904  # 3,137,712 - 991,808


@pytest.mark.parametrize(
    ("budget", "expected"),
    [
        (1_050_000, 2_145_904),
        (922_000, 2_145_904),
        (814_991, 2_145_904),
        (814_990, 2_145_903),
        (700_000, 1_703_192),
        (557_378, 1_154_097),
        (543_328, 1_100_004),
        (543_327, 1_100_000),
        (500_000, 1_100_000),
        (285_715, 1_100_000),
        (285_714, 1_100_000),
    ],
)
def test_m1r_the_read_cap_follows_the_long_budget(
    rig: Rig, tmp_path: Path, budget: int, expected: int
) -> None:
    from deploy_workflow.model.copilot_adapter import _guard_context, _Refuse

    adapter = long_rig(rig, sol_row(maxPromptTokens=budget))
    executor = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(1), check=lambda *_: (), events=tmp_path
    )
    assert call(adapter, request()).kind == "ok"
    cap = executor._read_cap(DIGEST)
    assert cap == expected

    state = adapter._states[DIGEST]
    history = state.history

    def sized(target: int) -> TurnRequest:
        base = TurnRequest((*history, Message("user", "")), request().tools, 1000, "medium")
        pad = target - len(json.dumps(dataclasses.asdict(base), separators=(",", ":")).encode())
        made = TurnRequest((*history, Message("user", "x" * pad)), request().tools, 1000, "medium")
        assert len(json.dumps(dataclasses.asdict(made), separators=(",", ":")).encode()) == target
        return made

    if budget >= 285_715:
        # a request of exactly the read cap passes the guard; the real next request is larger
        # (the reply and the tool wrapper), which the 991,808-byte headroom covers above the floor
        _guard_context(sized(cap), state)
    if 543_327 <= budget <= 814_990:
        _guard_context(sized(cap + 991_808), state)  # the headroom is exactly what the guard admits
        with pytest.raises(_Refuse) as refused:
            _guard_context(sized(cap + 991_808 + 1), state)
        assert refused.value.error_class == "ContextTooLong"


# Fix round 5 (H2): the read cap of a session that is not on the long tier follows what the next
# call admits. Expected values are worked by hand: A = min(prompt limit, window - max_output),
# bytes = floor(A x 3.85), cap = min(1,100,000, bytes // 2).
BIG_OUTPUT = 131_072


def _big_request() -> TurnRequest:
    return TurnRequest((SYSTEM, USER), (TOOL,), BIG_OUTPUT, "medium")


def test_h2_prompt_admits_is_none_before_a_call_and_after_release(rig: Rig) -> None:
    adapter = rig.make(text_script())
    assert adapter.prompt_admits(DIGEST) is None
    assert call(adapter, _big_request()).kind == "ok"
    assert adapter.prompt_admits(DIGEST) == 140_928  # 272,000 - 131,072
    adapter.release(DIGEST)
    rig.released()
    assert adapter.prompt_admits(DIGEST) is None


@pytest.mark.parametrize(
    ("limits", "admits", "cap"),
    [
        # the table's 272,000 window: 140,928 tokens, 542,572 bytes, half is 271,286
        (None, 140_928, 271_286),
        # a 1,000,000 window and no prompt limit: 868,928 tokens, 3,345,372 bytes, half 1,672,686
        ({"max_context_window_tokens": 1_000_000}, 868_928, 1_100_000),
        # a prompt limit under the window term binds: min(100,000, 868,928)
        (
            {"max_prompt_tokens": 100_000, "max_context_window_tokens": 1_000_000},
            100_000,
            192_500,
        ),
    ],
)
def test_h2_the_read_cap_follows_what_the_session_admits(
    rig: Rig, tmp_path: Path, limits: dict[str, int] | None, admits: int, cap: int
) -> None:
    if limits is not None:
        rig.client.models[0]["capabilities"] = {"limits": limits}
    adapter = rig.make(text_script())
    executor = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(1), check=lambda *_: (), events=tmp_path
    )
    assert executor._read_cap(DIGEST) == 1_100_000  # nothing opened yet
    assert call(adapter, _big_request()).kind == "ok"
    assert adapter.prompt_admits(DIGEST) == admits
    assert executor._read_cap(DIGEST) == cap


# Fix round 5 (H3): the default tier's listed prices against the hold's rates
def _dear_default(row: dict[str, Any], **prices: Any) -> dict[str, Any]:
    # credits per 1,000,000 tokens: 500 is USD 5 per million
    billing = row.setdefault("billing", {"tokenPrices": {"batchSize": 1_000_000}})
    billing["tokenPrices"].update(prices)
    return row


def test_h3_dear_default_prices_are_not_pinned_and_warned(
    rig: Rig, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    row = _dear_default(sol_row(maxPromptTokens=LONG), inputPrice=501)  # over USD 5 per million
    with caplog.at_level(logging.WARNING):
        assert not _pinned(rig, row)
    assert any(
        r.levelno == logging.WARNING and "default-tier inputPrice" in r.getMessage()
        for r in caplog.records
    )


def test_h3_default_prices_at_the_table_rates_still_pin(rig: Rig) -> None:
    row = _dear_default(sol_row(maxPromptTokens=LONG), inputPrice=500, outputPrice=1500)
    assert _pinned(rig, row)


def test_h3_a_default_session_with_dear_default_prices_opens_and_warns_once(
    rig: Rig, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    row = _dear_default(sol_row(), inputPrice=501)
    with caplog.at_level(logging.WARNING):
        reply = call(long_rig(rig, row), request())
    assert reply.kind == "ok" and "context_tier" not in rig.session.options
    warned = [r for r in caplog.records if "hold assumes the table's rates" in r.getMessage()]
    assert len(warned) == 1 and "default-tier inputPrice" in warned[0].getMessage()


def test_h3_default_prices_at_the_table_rates_do_not_warn(
    rig: Rig, caplog: pytest.LogCaptureFixture
) -> None:
    import logging

    row = _dear_default(sol_row(), inputPrice=500)
    with caplog.at_level(logging.WARNING):
        assert call(long_rig(rig, row), request()).kind == "ok"
    assert not any("hold assumes" in r.getMessage() for r in caplog.records)
