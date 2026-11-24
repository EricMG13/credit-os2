"""Test doubles for Signal's AI pass. SYNTHETIC: no test that uses them makes a paid or networked
model call. ``FakeModel`` stands in for the project's live adapter behind ``ai_call.Model`` and
answers with replies written in the tests, in the shape the Copilot adapter returns
(``AdapterReply`` with a ``Turn`` and the runtime's reported cost as ``billed_usd``).
``write_ruling`` writes a standing ruling in the project's ``check_ruling`` format into a temporary
rulings folder; no file is ever added under ``docs/rulings/``.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.turn import Turn, TurnRequest, Usage
from deploy_workflow.signal import ai_gate, ai_ledger, ai_run

CONFIG = "copilot-luna-xhigh"
# The worst case the pricing table holds for any Luna call through Copilot: its whole 1,050,000-
# token context at the dearest input rate (USD 0.25 per million, long-context cache write) plus the
# 128,000 output tokens the runtime cannot cap at the dearest output rate (USD 0.75 per million):
# 0.2625 + 0.096. Written by hand from model/pricing.py's _COPILOT_LUNA entry.
LUNA_HOLD = Decimal("0.3585")
ENV = {"COPILOT_GITHUB_TOKEN": "test-token-not-a-real-key"}


def write_ruling(
    folder: Path, configs: str = CONFIG, name: str = "2026-11-25-signal-ai-pass.md"
) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    path.write_text(
        "# Standing ruling: Signal AI pass (TEST, temporary folder)\n\n"
        "lifts: live-provider-pause\nby: user\ndate: 2026-11-25\n"
        f"configs: {configs}\n",
        encoding="utf-8",
    )
    return path


def environ(tmp: Path, **extra: str) -> dict[str, str]:
    """A launching environment with a (fake) key and an existing (fake) runtime file."""
    runtime = tmp / "copilot-runtime"
    runtime.write_text("not a runtime", encoding="utf-8")
    return {**ENV, "COPILOT_CLI_PATH": str(runtime), **extra}


def ok(text: str, usd: str | None = "0.004") -> AdapterReply:
    """A reply the model wrote, with the runtime's reported cost (None: no cost reported)."""
    turn = Turn(
        text, (), Usage(input_tokens=3000, output_tokens=900), "end", None, None, 200,
        None if usd is None else Decimal(usd),
    )  # fmt: skip
    return AdapterReply("ok", turn, None, 200, None, None, None, None, turn.usage, turn.billed_usd)


def not_sent() -> AdapterReply:
    return AdapterReply("not_sent", None, None, None, "KeyMissing", None, None, None)


def sent_unknown() -> AdapterReply:
    return AdapterReply("sent_unknown", None, None, None, "OverallTimeout", None, None, None)


@dataclass
class FakeModel:
    """SYNTHETIC model: each call takes the next reply (or calls `answer` with the request)."""

    replies: list[AdapterReply] = field(default_factory=list)
    answer: Callable[[TurnRequest], AdapterReply] | None = None
    config_id: str = CONFIG
    requests: list[TurnRequest] = field(default_factory=list)
    released: list[str] = field(default_factory=list)
    closed: bool = False

    def complete(
        self, request: TurnRequest, *, invocation_digest: str, call_index: int, reservation_id: str
    ) -> AdapterReply:
        self.requests.append(request)
        if self.answer is not None:
            return self.answer(request)
        return self.replies.pop(0)

    def release(self, digest: str) -> None:
        self.released.append(digest)

    def close(self) -> None:
        self.closed = True


def refusing_factory(config_id: str, ruling: Path) -> Any:
    raise AssertionError("no model may be built here")


def setup(
    tmp: Path, model: FakeModel | None = None, *, ruling: bool = True, key: bool = True
) -> ai_run.Setup:
    """A Setup over a temporary rulings folder; the factory hands out `model` (SYNTHETIC)."""
    rulings = tmp / "rulings"
    rulings.mkdir(parents=True, exist_ok=True)
    if ruling:
        write_ruling(rulings)
    env = environ(tmp) if key else {}
    if model is None:
        return ai_run.Setup(env, rulings, refusing_factory)
    return ai_run.Setup(env, rulings, lambda config_id, path: model)


def status_on(cap: str = "15") -> ai_gate.Status:
    """A hand-built "on" status for snapshot tests."""
    gate = ai_gate.Gate(Path("2026-11-25-signal-ai-pass.md"), CONFIG, Decimal(cap), ())
    month = ai_ledger.Month("2026-11", Decimal("6.4"), Decimal(0), 0, 0)
    return ai_gate.Status(gate, month, 0, None, "on")


def labels_reply(entries: list[dict[str, Any]]) -> str:
    return json.dumps({"stories": entries})


def label(story_id: int, **fields: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "id": str(story_id),
        "why": "The sale proceeds repay the 2027 notes.",
        "signal": 2,
        "tags": ["Telecoms"],
        "kind": "news",
        "stage": None,
        "moves": [],
    }
    return {**base, **fields}


def at(text: str) -> datetime:
    return datetime.fromisoformat(text + "+00:00")
