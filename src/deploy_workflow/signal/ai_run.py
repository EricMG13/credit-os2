"""Where the AI pass is wired in: what the service and the command line give it, and its two jobs.

``Setup`` holds the launching environment, the rulings folder and the factory that builds the live
adapter. ``session`` builds a model only while ``ai_gate.status`` says the pass is on (not off, not
at its cap), and closes it after the job; otherwise it yields None and nothing is built, so with no
ruling, cap or key the service runs exactly as before. The jobs: ``story_pass`` (``ai_pass.run``)
and ``digest_pass`` (``digests.run_due`` with ``ai_digest.Writer`` while on, without it otherwise).
"""

from __future__ import annotations

import os
import sqlite3
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from deploy_workflow.model.adapter import LIVE_RULINGS_ROOT
from deploy_workflow.signal import ai_call, ai_digest, ai_gate, ai_ledger, ai_pass, digests


def live_model(config_id: str, ruling: Path) -> ai_call.Model:
    """The project's live adapter for `config_id` (the GitHub Copilot one); building it runs the
    adapter's own ruling check first. Imported here only, when the pass is on."""
    from deploy_workflow.model.configs import CONFIGS
    from deploy_workflow.model.copilot_adapter import CopilotAdapter
    from deploy_workflow.model.turn import ModelSpec

    chosen = CONFIGS[config_id]
    spec = ModelSpec(chosen.config_id, chosen.provider, chosen.model, chosen.effort)
    return CopilotAdapter(spec, ruling)


@dataclass(frozen=True)
class Setup:
    environ: Mapping[str, str] = field(default_factory=lambda: os.environ)
    rulings_root: Path = LIVE_RULINGS_ROOT
    factory: ai_call.ModelFactory = live_model


def status(db: sqlite3.Connection, now: datetime, setup: Setup) -> ai_gate.Status:
    return ai_gate.status(db, now, setup.environ, setup.rulings_root)


@contextmanager
def session(db: sqlite3.Connection, now: datetime, setup: Setup) -> Iterator[ai_call.Model | None]:
    """The model for one job while the pass is on, else None; closed when the job ends."""
    ai_ledger.expire(db, now)
    held = status(db, now, setup)
    if held.state != "on" or held.gate.config_id is None or held.gate.ruling is None:
        yield None
        return
    model = setup.factory(held.gate.config_id, held.gate.ruling)
    try:
        yield model
    finally:
        close = getattr(model, "close", None)
        if callable(close):
            close()


def story_pass(db: sqlite3.Connection, now: datetime, setup: Setup) -> ai_pass.Report | None:
    """One pass over the new stories; None when the pass is not on."""
    with session(db, now, setup) as model:
        return None if model is None else ai_pass.run(db, model, now)


def digest_pass(
    db: sqlite3.Connection, now: datetime, setup: Setup
) -> list[tuple[int, digests.Run]]:
    """The due digests, with the AI pass's writer while it is on."""
    with session(db, now, setup) as model:
        writer = None if model is None else ai_digest.Writer(db, model, now)
        return digests.run_due(db, now, writer)
