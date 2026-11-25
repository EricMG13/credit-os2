"""One paid model call for Signal, through the gate and the ledger: check, reserve, call, settle.

Signal reaches the project's existing model adapter (``deploy_workflow.model``; the live one is
the GitHub Copilot adapter, the provider every live call now uses) through ``Model``, a narrow
interface of its own, so tests inject a fake and nothing here imports a provider. Prices are the
project's existing table (``deploy_workflow.model.pricing``); the hold is ``ai_price``'s.

Immediately before every reservation the whole gate is checked again (``ai_gate.check`` with the
``Guard``'s launching environment and rulings folder): a job's model is built once, but a ruling
withdrawn, made invalid or lowered, a key gone or a switch-off during the job stops its very next
call. A call refused so (``ai_ledger.Refused``) holds nothing, costs nothing and ends the job.

The charge follows the analytical modules' rules (``model.handoff``): nothing for a call refused
before it was sent or answered with a 4xx; unknown for a call whose outcome is unknown; else the
priced usage (``pricing.price_usage``: for Copilot the runtime's reported cost, unknown when it
reports none) plus the charges of any context compactions the runtime reported.

Nothing here logs a prompt, a reply or a key: a log line names the purpose, the call id and the
outcome only.
"""

from __future__ import annotations

import logging
import sqlite3
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Protocol

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.budget import exact_sum
from deploy_workflow.model.configs import CONFIGS
from deploy_workflow.model.pricing import PricingError, price_usage
from deploy_workflow.model.turn import Message, TurnRequest, Usage
from deploy_workflow.signal import ai_gate, ai_ledger
from deploy_workflow.signal.ai_price import FRAMING_TOKENS, Prompt, reservation_usd

log = logging.getLogger(__name__)

__all__ = ["FRAMING_TOKENS", "Answer", "Guard", "Model", "Prompt", "call", "reservation_usd"]


class Model(Protocol):
    """The part of the project's model adapter Signal uses (``model.adapter.ModelAdapter``)."""

    config_id: str

    def complete(
        self,
        request: TurnRequest,
        *,
        invocation_digest: str,
        call_index: int,
        reservation_id: str,
    ) -> AdapterReply: ...


# Builds the live adapter for a configuration the ruling names: (config id, ruling path).
ModelFactory = Callable[[str, Path], Model]


@dataclass(frozen=True)
class Guard:
    """What every call is checked against just before it is reserved: the gate's launching
    environment and rulings folder, and the clock the ledger's times are read from."""

    environ: Mapping[str, str]
    rulings_root: Path
    clock: Callable[[], datetime]


@dataclass(frozen=True)
class Answer:
    """What came back: the reply's text (None when there is no usable reply) and the outcome."""

    text: str | None
    outcome: str
    call_id: int
    transient: bool = False  # the call failed in a way that may pass: try again at the next tick


def _compactions_usd(reply: AdapterReply) -> Decimal | None:
    """What the call's completed compactions charged; None when any charge cannot be read. A failed
    compaction that reported no usage was not charged (as ``model.handoff`` counts it)."""
    done = [
        c
        for c in reply.compactions
        if c.kind == "complete"
        and not (c.success is False and c.usd is None and not c.usage_reported)
    ]
    if any(c.usd is None for c in done):
        return None
    return exact_sum(c.usd for c in done if c.usd is not None)


def charge(reply: AdapterReply, config_id: str) -> Decimal | None:
    """What one call cost in USD, or None when it cannot be established."""
    if reply.kind in ("not_sent", "sent_known"):
        return Decimal(0)
    if reply.kind == "sent_unknown":
        return None
    usage = reply.turn.usage if reply.turn is not None else reply.usage
    try:
        priced = price_usage(config_id, usage or Usage(), reply.billed_usd)
    except PricingError:
        return None
    extra = _compactions_usd(reply)
    if priced.usd is None or extra is None:
        return None
    return exact_sum((priced.usd, extra))


# A 4xx refusal that asks to be called later (payment wait, timeout, conflict, too early, rate
# limit). Every other failure is lasting: it is recorded, and a digest moves to its next slot.
TRANSIENT_STATUSES = frozenset({402, 408, 409, 425, 429})
TRANSIENT = "transient "  # the outcome text of such a call starts so


def transient(reply: AdapterReply) -> bool:
    return reply.kind == "sent_known" and reply.http_status in TRANSIENT_STATUSES


def _outcome(reply: AdapterReply) -> str:
    if reply.kind == "ok":
        return "ok"
    text = f"{reply.kind}: {reply.error_class or 'no class'}"
    return (TRANSIENT + text if transient(reply) else text)[:80]


def _release(model: Model, digest: str) -> None:
    """Free the adapter's session for a finished exchange (the Copilot adapter holds one)."""
    release = getattr(model, "release", None)
    if callable(release):
        try:
            release(digest)
        except Exception as error:  # noqa: BLE001 -- advisory: the call is settled already
            log.warning("could not release a Signal model session: %s", type(error).__name__)


def _reserve(
    db: sqlite3.Connection, guard: Guard, purpose: ai_ledger.Purpose, config_id: str, usd: Decimal
) -> int:
    """The gate checked again, then the hold; ai_ledger.Refused (nothing held) when it is off or
    no longer names `config_id`."""
    now = guard.clock()
    gate = ai_gate.check(db, guard.environ, guard.rulings_root, now)
    if not gate.on or gate.ruled_cap is None:
        raise ai_ledger.Refused(f"the AI pass is off: {gate.missing[0] if gate.missing else ''}")
    if gate.config_id != config_id:
        raise ai_ledger.Refused(f"the ruling no longer allows {config_id}")
    return ai_ledger.reserve(db, purpose, config_id, usd, now, ruled_cap=gate.ruled_cap)


def call(
    db: sqlite3.Connection,
    model: Model,
    guard: Guard,
    purpose: ai_ledger.Purpose,
    prompt: Prompt,
) -> Answer:
    """Check the gate, reserve, make one call, settle. ai_ledger.Refused when no call may be made
    (nothing is held then). A call that raises is settled as unknown (it may have been sent),
    which switches the pass off; the error is logged by type only."""
    usd = reservation_usd(model.config_id, prompt)
    call_id = _reserve(db, guard, purpose, model.config_id, usd)
    digest = f"signal-{purpose}-{call_id}"
    request = TurnRequest(
        (Message("system", prompt.system), Message("user", prompt.user)),
        (),
        prompt.max_output,
        CONFIGS[model.config_id].effort,
    )
    try:
        reply = model.complete(
            request, invocation_digest=digest, call_index=0, reservation_id=f"signal-{call_id}"
        )
    except Exception as error:  # noqa: BLE001 -- settled as unknown, never as zero
        log.warning("Signal %s call %s raised %s", purpose, call_id, type(error).__name__)
        ai_ledger.settle(db, call_id, None, f"raised: {type(error).__name__}"[:80], guard.clock())
        return Answer(None, "raised", call_id)
    outcome = _outcome(reply)
    ai_ledger.settle(db, call_id, charge(reply, model.config_id), outcome, guard.clock())
    _release(model, digest)
    log.info("Signal %s call %s: %s", purpose, call_id, outcome)
    text = reply.turn.text if reply.turn is not None else None
    return Answer(text, outcome, call_id, transient(reply))
