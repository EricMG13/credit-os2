"""F8: direct Anthropic and OpenRouter configurations hold at the ruled 1 byte per token."""

import pytest

from deploy_workflow.model.pricing import handoff_input_bound

# by hand: ceil(1000 / bpt) + 4096 framing
_EXPECTED = {
    "opus-medium": 5096,
    "opus-high": 5096,
    "deepseek-max": 5096,
    "sol-medium": 4596,
    "sol-high": 4596,
    "copilot-opus-medium": 5096,
    "copilot-sol-medium": 4430,
}


@pytest.mark.parametrize(("config", "bound"), sorted(_EXPECTED.items()))
def test_handoff_input_bound_for_1000_bytes(config: str, bound: int) -> None:
    assert handoff_input_bound(config, 1000) == bound
