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
from deploy_workflow.signal import ai_call, ai_gate, ai_ledger, ai_run

CONFIG = "copilot-luna-xhigh"
# The worst case the pricing table holds for any Luna call through Copilot: its whole 1,050,000-
# token context at the dearest input rate (USD 0.25 per million, long-context cache write) plus the
# 128,000 output tokens the runtime cannot cap at the dearest output rate (USD 0.75 per million):
# 0.2625 + 0.096. Written by hand from model/pricing.py's _COPILOT_LUNA entry.
LUNA_HOLD = Decimal("0.3585")
ENV = {"COPILOT_GITHUB_TOKEN": "test-token-not-a-real-key"}


RULING_NAME = "2026-11-01-signal-ai-pass.md"  # dated before every test's NOW


def write_ruling(
    folder: Path,
    configs: str = CONFIG,
    name: str = RULING_NAME,
    cap: str | None = "15",
) -> Path:
    """A Signal ruling in a temporary folder; `cap` is its ``cap_usd:`` text (None: no line). Its
    ``date:`` line is the date in its name."""
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    path.write_text(
        "# Standing ruling: Signal AI pass (TEST, temporary folder)\n\n"
        f"lifts: live-provider-pause\nby: user\ndate: {name[:10]}\n"
        f"configs: {configs}\n" + ("" if cap is None else f"cap_usd: {cap}\n"),
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


def off_setup(tmp: Path) -> ai_run.Setup:
    """A Setup with the AI pass off whatever ``docs/rulings`` holds or the process's environment
    carries: no key, an empty rulings folder of its own, and a factory that refuses to build."""
    return ai_run.Setup({}, tmp / "no-rulings", refusing_factory)


Clock = Callable[[], datetime]


def clock_at(now: datetime | Clock) -> Clock:
    """A clock that always reads `now` (or `now` itself when it is already a clock)."""
    return now if callable(now) else lambda: now


def guard(tmp: Path, now: datetime | Clock, *, ruling: bool = True) -> ai_call.Guard:
    """What every call is checked against (SYNTHETIC): a temporary rulings folder holding a valid
    ruling (cap_usd: 15), a fake key and runtime, and a clock reading `now`."""
    rulings = tmp / "rulings"
    rulings.mkdir(parents=True, exist_ok=True)
    if ruling and not (rulings / RULING_NAME).exists():
        write_ruling(rulings)
    return ai_call.Guard(environ(tmp), rulings, clock_at(now))


def setup(
    tmp: Path,
    model: FakeModel | None = None,
    *,
    ruling: bool = True,
    key: bool = True,
    clock: datetime | Clock | None = None,
) -> ai_run.Setup:
    """A Setup over a temporary rulings folder; the factory hands out `model` (SYNTHETIC). With no
    `clock` the ledger reads the real time."""
    rulings = tmp / "rulings"
    rulings.mkdir(parents=True, exist_ok=True)
    if ruling:
        write_ruling(rulings)
    env = environ(tmp) if key else {}
    read = ai_run.utc_now if clock is None else clock_at(clock)
    if model is None:
        return ai_run.Setup(env, rulings, refusing_factory, read)
    return ai_run.Setup(env, rulings, lambda config_id, path: model, read)


def status_on(cap: str = "15") -> ai_gate.Status:
    """A hand-built "on" status for snapshot tests."""
    gate = ai_gate.Gate(Path(RULING_NAME), CONFIG, Decimal(cap), (), Decimal(cap))
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
