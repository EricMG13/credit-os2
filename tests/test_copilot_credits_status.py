"""A usage event whose ``aiCreditsStatus`` is not complete carries no known charge."""

import json
from decimal import Decimal
from typing import Any

import pytest

from deploy_workflow.model.copilot import parse_events
from deploy_workflow.model.providers import ErrorKind, ProviderError
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import Turn


def _usage(nano: int, status: str | None, **extra: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "model": "gpt-6.1-sol",
        "inputTokens": 100000,
        "outputTokens": 5,
        "copilotUsage": {"totalNanoAiu": nano},
        **extra,
    }
    if status is not None:
        data["aiCreditsStatus"] = status
    return {"type": "assistant.usage", "data": data}


def _parse(*events: dict[str, Any]) -> Turn | ProviderError:
    return parse_events(json.dumps(list(events)), Redactor(), [])


@pytest.mark.parametrize("status,nano", [("unavailable", 0), ("partial", 1000), ("other", 1000)])
def test_turn_charge_unknown_unless_complete(status: str, nano: int) -> None:
    result = _parse(_usage(nano, status))
    assert isinstance(result, Turn)
    assert result.billed_usd is None


@pytest.mark.parametrize("status", [None, "complete"])
def test_turn_charge_kept_when_absent_or_complete(status: str | None) -> None:
    result = _parse(_usage(1000, status))
    assert isinstance(result, Turn)
    assert result.billed_usd == Decimal("0.00000001")


def test_session_error_charge_unknown_when_not_complete() -> None:
    err = {"type": "session.error", "data": {"errorType": "p", "message": "m"}}
    result = _parse(_usage(0, "unavailable"), err)
    assert isinstance(result, ProviderError)
    assert result.kind is ErrorKind.SENT_CHARGE_USAGE
    assert result.billed_usd is None


def test_length_cut_charge_unknown_when_not_complete() -> None:
    result = _parse(_usage(1000, "partial", finishReason="length"))
    assert isinstance(result, ProviderError)
    assert result.error_class == "ReplyCut"
    assert result.billed_usd is None
