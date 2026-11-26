"""Where the AI pass is wired in: what the service and the command line give it, and its two jobs.

``Setup`` holds the launching environment, the rulings folder, the factory that builds the live
adapter and the clock the ledger reads. ``session`` builds a model only while ``ai_gate.status``
says the pass is on (not off, not at its cap), and closes it after the job; otherwise it yields None
and nothing is built, so with no ruling, cap or key the service runs exactly as before. The model is
built once per job, but every call the job makes checks the whole gate again first (``ai_call.call``
with ``Setup.guard``), so a precondition lost during a job ends it. The jobs: ``story_pass``
(``ai_pass.run``) and ``digest_pass`` (``digests.run_due`` with ``ai_digest.Writer`` while on,
without it otherwise).
"""

from __future__ import annotations

import os
import sqlite3
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
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


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class Setup:
    environ: Mapping[str, str] = field(default_factory=lambda: os.environ)
    rulings_root: Path = LIVE_RULINGS_ROOT
    factory: ai_call.ModelFactory = live_model
    clock: Callable[[], datetime] = utc_now  # read when a call is reserved, settled or expired

    @property
    def guard(self) -> ai_call.Guard:
        return ai_call.Guard(self.environ, self.rulings_root, self.clock)


def status(db: sqlite3.Connection, now: datetime, setup: Setup) -> ai_gate.Status:
    return ai_gate.status(db, now, setup.environ, setup.rulings_root)


def shown_status(db: sqlite3.Connection, now: datetime, setup: Setup) -> ai_gate.Status:
    """The status pages show (``ai_gate.shown_status``): off when a setting cannot be read."""
    return ai_gate.shown_status(db, now, setup.environ, setup.rulings_root)


@dataclass(frozen=True)
class Job:
    """One job's model and the guard every one of its calls is checked against."""

    model: ai_call.Model
    guard: ai_call.Guard


@contextmanager
def session(db: sqlite3.Connection, now: datetime, setup: Setup) -> Iterator[Job | None]:
    """The model for one job while the pass is on, else None. When the job ends the model is
    closed (the adapter's exchanges are torn down) and the exchange homes its calls caused are
    removed (``ai_call.remove_homes``)."""
    ai_ledger.expire(db, setup.clock())
    held = status(db, now, setup)
    if held.state != "on" or held.gate.config_id is None or held.gate.ruling is None:
        yield None
        return
    job = Job(setup.factory(held.gate.config_id, held.gate.ruling), setup.guard)
    try:
        yield job
    finally:
        close = getattr(job.model, "close", None)
        try:
            if callable(close):
                close()
        finally:
            ai_call.remove_homes(job.guard)


def recover(db: sqlite3.Connection, setup: Setup) -> tuple[int, int]:
    """What a process does as it starts (the application hosting Signal, ``signal ai pass``): every
    open reservation older than the adapter's own bound on a call (``ai_ledger.CALL_BOUND``) is
    settled as unknown at its full hold, which switches the pass off; every digest run claimed
    before then with no result is recorded as failed (``digests.recover_claims``). Younger ones are
    left: another process may own them. (reservations settled, runs recorded)."""
    now = setup.clock()
    held = ai_ledger.expire(db, now, ai_ledger.CALL_BOUND)
    return held, digests.recover_claims(db, now - ai_ledger.CALL_BOUND, now)


def story_pass(db: sqlite3.Connection, now: datetime, setup: Setup) -> ai_pass.Report | None:
    """One pass over the new stories; None when the pass is not on."""
    with session(db, now, setup) as job:
        return None if job is None else ai_pass.run(db, job.model, job.guard, now)


class DigestsLeftDue(RuntimeError):
    """A pass left digests due by a fault (a busy database before anything was sent, or a call the
    adapter did not send), or holds digests whose claim it could not release (a busy database after
    a paid call: not due again, the claim stays for the next start); digests left waiting for a
    limit or a refusal are not a fault."""


def digest_pass(
    db: sqlite3.Connection, now: datetime, setup: Setup
) -> list[tuple[int, digests.Run]]:
    """The due digests, with the AI pass's writer while it is on. DigestsLeftDue when the pass
    left any due for the next tick or holds any claim, so the loop's digest error says so."""
    with session(db, now, setup) as job:
        writer = None if job is None else ai_digest.Writer(db, job.model, job.guard, now)
        ran = digests.run_due(db, now, writer)
    said = []
    if ran.left_due:
        said.append(f"{len(ran.left_due)} digests were left due for the next tick")
    if ran.held:
        said.append(f"{len(ran.held)} digests hold their claim (not due again; see the log)")
    if said:
        raise DigestsLeftDue("; ".join(said))
    return list(ran)
