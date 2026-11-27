"""F1: a null in a later Anthropic usage event does not erase a count already reported."""

import json
from typing import Any

from deploy_workflow.model.providers import parse
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import Turn


def _sse(*events: dict[str, Any]) -> bytes:
    lines = [f"event: {e['type']}\ndata: {json.dumps(e)}\n\n" for e in events]
    lines.append('event: message_stop\ndata: {"type":"message_stop"}\n\n')
    return "".join(lines).encode()


def _start(usage: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "message_start",
        "message": {"id": "msg_1", "model": "claude-opus-5-5", "usage": usage},
    }


def _delta(usage: dict[str, Any]) -> dict[str, Any]:
    return {"type": "message_delta", "delta": {"stop_reason": "end_turn"}, "usage": usage}


def test_null_counts_in_message_delta_keep_the_message_start_counts() -> None:
    body = _sse(
        _start({"input_tokens": 10, "cache_read_input_tokens": 2}),
        _delta({"output_tokens": 5, "input_tokens": None, "cache_read_input_tokens": None}),
    )
    turn = parse("anthropic", 200, body, {}, Redactor())
    assert isinstance(turn, Turn)
    assert turn.usage.input_tokens == 10
    assert turn.usage.cached_read_tokens == 2
    assert turn.usage.output_tokens == 5


def test_a_non_null_later_count_still_replaces_the_earlier_one() -> None:
    body = _sse(
        _start({"input_tokens": 10, "output_tokens": 1}),
        _delta({"output_tokens": 7, "input_tokens": 12}),
    )
    turn = parse("anthropic", 200, body, {}, Redactor())
    assert isinstance(turn, Turn)
    assert turn.usage.input_tokens == 12
    assert turn.usage.output_tokens == 7


def test_a_null_delta_output_does_not_inherit_the_message_start_placeholder() -> None:
    body = _sse(
        _start({"input_tokens": 25, "output_tokens": 1}),
        _delta({"output_tokens": None}),
    )
    turn = parse("anthropic", 200, body, {}, Redactor())
    assert not isinstance(turn, Turn) or turn.usage.output_tokens is None
    assert not (isinstance(turn, Turn) and turn.usage.output_tokens == 1)
