"""What the tool loop and the handoff executor share: redaction of what crosses to and from a
provider, and the one catch-all (moved from ``loop``, which still exports every name). Kept apart
from ``loop`` so that the handoff executor does not import the owner workflows.
"""

from collections.abc import Callable
from dataclasses import replace

from deploy_workflow.model.providers import redact_block
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import Message, ToolCall, ToolSpec, Turn, TurnRequest

__all__ = ["redacted_request", "redacted_turn"]


def redacted_request(redactor: Redactor, request: TurnRequest) -> TurnRequest:
    """The request with every string, tool argument and schema redacted."""

    def call(item: ToolCall) -> ToolCall:
        return ToolCall(
            redactor.text(item.call_id),
            redactor.text(item.name),
            redactor.json_value(item.arguments),
            None if item.bad_arguments is None else redactor.text(item.bad_arguments),
        )

    def message(item: Message) -> Message:
        return Message(
            item.role,
            redactor.text(item.text),
            tuple(call(c) for c in item.tool_calls),
            None if item.tool_call_id is None else redactor.text(item.tool_call_id),
            tuple(redact_block(redactor, b) for b in item.provider_blocks),
        )

    return TurnRequest(
        tuple(message(m) for m in request.messages),
        tuple(
            ToolSpec(
                redactor.text(t.name),
                redactor.text(t.description),
                redactor.json_value(t.parameters),
            )
            for t in request.tools
        ),
        request.max_output_tokens,
        request.effort,
    )


def redacted_turn(redactor: Redactor, turn: Turn) -> Turn:
    """The returned turn with every string and tool argument redacted, before any tool runs."""
    if any(not c.call_id for c in turn.tool_calls):
        raise ValueError("a tool call has an empty call id")
    return replace(
        turn,
        text=redactor.text(turn.text),
        tool_calls=tuple(
            ToolCall(
                redactor.text(c.call_id),
                redactor.text(c.name),
                redactor.json_value(c.arguments),
                None if c.bad_arguments is None else redactor.text(c.bad_arguments),
            )
            for c in turn.tool_calls
        ),
        reported_model=None if turn.reported_model is None else redactor.text(turn.reported_model),
        request_id=None if turn.request_id is None else redactor.text(turn.request_id),
        provider_blocks=tuple(redact_block(redactor, b) for b in turn.provider_blocks),
    )


def _caught[T](action: Callable[[], T]) -> tuple[T | None, Exception | None]:
    """Run ``action``; return its value, or the exception it raised. The loop's one catch-all:
    a failure here is never dropped. The caller records its class and redacted text, settles the
    call, and stops the run (``StepStopped``), so nothing fails open."""
    try:
        return action(), None
    except Exception as error:  # noqa: BLE001 - returned to the caller, which records and stops
        return None, error
