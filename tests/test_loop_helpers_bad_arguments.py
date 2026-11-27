"""``bad_arguments`` (raw non-object argument text from the model) is redacted too."""

from deploy_workflow.model.loop_helpers import redacted_request, redacted_turn
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import Message, ToolCall, Turn, TurnRequest, Usage

KEY = "sk-ant-api03-" + "A" * 40


def _call(bad: str | None) -> ToolCall:
    return ToolCall("call-1", "lookup", {}, bad)


def _turn(bad: str | None) -> Turn:
    return Turn("", (_call(bad),), Usage(), "tool_use", None, None, 200)


def test_redacted_turn_redacts_bad_arguments() -> None:
    turn = _turn(f'"{KEY}"')
    out = redacted_turn(Redactor(), turn)
    assert out.tool_calls[0].bad_arguments == '"[redacted]"'


def test_redacted_turn_keeps_missing_bad_arguments_none() -> None:
    out = redacted_turn(Redactor(), _turn(None))
    assert out.tool_calls[0].bad_arguments is None


def test_redacted_request_redacts_bad_arguments() -> None:
    message = Message("assistant", "", (_call(f'"{KEY}"'),))
    out = redacted_request(Redactor(), TurnRequest((message,), (), 100, None))
    assert out.messages[0].tool_calls[0].bad_arguments == '"[redacted]"'


def test_redacted_request_keeps_missing_bad_arguments_none() -> None:
    message = Message("assistant", "", (_call(None),))
    out = redacted_request(Redactor(), TurnRequest((message,), (), 100, None))
    assert out.messages[0].tool_calls[0].bad_arguments is None
