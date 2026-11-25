"""What one of Signal's model calls holds until it settles: its worst case from the project's
pricing table (``deploy_workflow.model.pricing``).

The hold is ``pricing.request_reservation_usd`` for the prompt's input bound (one token per byte of
prompt, which no tokenizer exceeds, plus ``FRAMING_TOKENS`` for the runtime's own framing) and the
request's output cap. For a Copilot configuration the table widens the hold to the model's whole
context and to the output the runtime cannot cap, as for the analytical modules.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from deploy_workflow.model.pricing import price_of, request_reservation_usd

FRAMING_TOKENS = 4096


@dataclass(frozen=True)
class Prompt:
    system: str
    user: str
    max_output: int  # tokens


def reservation_usd(config_id: str, prompt: Prompt) -> Decimal:
    """The call's worst-case cost in USD, from the pricing table."""
    size = len(prompt.system.encode("utf-8")) + len(prompt.user.encode("utf-8"))
    return request_reservation_usd(price_of(config_id), size + FRAMING_TOKENS, prompt.max_output)


def smallest_hold(config_id: str) -> Decimal:
    """What the smallest call the pass makes holds until it settles, in USD (an empty one-token
    prompt: every real call holds at least this)."""
    return reservation_usd(config_id, Prompt("", "", 1))
