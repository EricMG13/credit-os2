"""Whether Signal's AI pass is on, decided by one function (``check``) from four preconditions.

The pass is on only when all four hold at the time of the check:

1. A standing ruling for Signal exists in ``docs/rulings/``: the newest file named
   ``YYYY-MM-DD-signal-ai-pass.md`` (``RULING_PATTERN``), in the project's ``check_ruling`` format
   (``lifts: live-provider-pause``, ``by: user``, ``date:``, ``configs:``), naming a configuration
   Signal may use (``CONFIGS``). Only that file is read: another ruling that names the same
   configuration (the run start page's does) never switches Signal on.
2. The owner has set a monthly cap on the command line (``signal ai cap <amount>``).
3. The provider's credentials are in the launching environment: the variables the existing
   Copilot adapter reads, ``COPILOT_GITHUB_TOKEN`` (or ``COPILOT_USE_GH_LOGIN=1``) and
   ``COPILOT_CLI_PATH`` naming the runtime. Only their presence is checked; no value is read
   into a message.
4. The pass has not been switched off for a cost it could not establish
   (``signal ai clear`` lifts that).

With any missing the service runs as it did before the pass existed. ``status`` adds the month's
ledger: the pass is "capped" when it is on but the smallest call it makes would not fit under the
cap. Checking makes no model call and builds no adapter.
"""

from __future__ import annotations

import re
import sqlite3
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Literal

from deploy_workflow.model.adapter import (
    COPILOT_GH_LOGIN_VARIABLE,
    COPILOT_RUNTIME_VARIABLE,
    KEY_VARIABLES,
    LivePauseInForce,
    check_ruling,
)
from deploy_workflow.model.budget import exact_sum
from deploy_workflow.signal import ai_call, ai_ledger

RULING_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}-signal-ai-pass\.md")
# The configurations Signal may use, cheapest first; it uses the first one the ruling names. Only
# GPT-6 Luna is listed: the Copilot route holds a call's whole context, which at Sol's or Opus's
# rates is several dollars a call (see the report of step 5).
CONFIGS = ("copilot-luna-xhigh",)
TOKEN_VARIABLE = KEY_VARIABLES["copilot"]

NO_RULING = (
    "No standing ruling for Signal's model calls is in docs/rulings"
    " (a file named YYYY-MM-DD-signal-ai-pass.md)."
)
NO_CAP = "The owner has not set a monthly cap."
NO_KEY = (
    f"The service was started without the provider's key: {TOKEN_VARIABLE}"
    f" (or {COPILOT_GH_LOGIN_VARIABLE}=1) is not set."
)
NO_RUNTIME = (
    f"The service was started without {COPILOT_RUNTIME_VARIABLE} naming the Copilot runtime."
)
State = Literal["on", "off", "capped"]


@dataclass(frozen=True)
class Gate:
    """The four preconditions as checked: a plain sentence per one that does not hold."""

    ruling: Path | None  # the ruling file, when it holds
    config_id: str | None  # the configuration it allows Signal, when it holds
    cap: Decimal | None
    missing: tuple[str, ...]

    @property
    def on(self) -> bool:
        return not self.missing


def find_ruling(rulings_root: Path) -> Path | None:
    """The newest Signal ruling in `rulings_root`, by its dated name; None when there is none."""
    try:
        names = sorted(p.name for p in rulings_root.iterdir() if RULING_PATTERN.fullmatch(p.name))
    except OSError:
        return None
    return rulings_root / names[-1] if names else None


def _ruling(rulings_root: Path) -> tuple[Path | None, str | None, str | None]:
    """(ruling, configuration, the sentence when it does not hold)."""
    found = find_ruling(rulings_root)
    if found is None:
        return None, None, NO_RULING
    problem = ""
    for config_id in CONFIGS:
        try:
            check_ruling(config_id, found, rulings_root=rulings_root)
        except LivePauseInForce as error:
            problem = str(error)
            continue
        return found, config_id, None
    return None, None, f"The ruling {found.name} is not accepted: {problem}."


def _credentials(environ: Mapping[str, str]) -> list[str]:
    """The sentences for the provider credentials that are missing (presence only)."""
    missing = []
    if not environ.get(TOKEN_VARIABLE) and environ.get(COPILOT_GH_LOGIN_VARIABLE) != "1":
        missing.append(NO_KEY)
    runtime = environ.get(COPILOT_RUNTIME_VARIABLE)
    if not runtime or not Path(runtime).is_file():
        missing.append(NO_RUNTIME)
    return missing


def check(db: sqlite3.Connection, environ: Mapping[str, str], rulings_root: Path) -> Gate:
    """The one decision: which of the four preconditions hold now."""
    ruling, config_id, no_ruling = _ruling(rulings_root)
    missing = [] if no_ruling is None else [no_ruling]
    limit = ai_ledger.cap(db)
    if limit is None:
        missing.append(NO_CAP)
    missing += _credentials(environ)
    off = ai_ledger.switched_off(db)
    if off is not None:
        reason, _ = off
        missing.append(
            f"The pass was switched off because {reason}; only the owner can clear it"
            " (signal ai clear)."
        )
    return Gate(ruling, config_id, limit, tuple(missing))


# The smallest call the pass makes: a one-story batch, whose hold every other call is at least.
_SMALLEST = ai_call.Prompt("", "", 1)


@dataclass(frozen=True)
class Status:
    """The gate with the month's ledger, as Settings, the CLI and the loop read it."""

    gate: Gate
    month: ai_ledger.Month
    invalid: int  # stories this month whose output failed its check
    last_problem: tuple[str, str] | None  # ("YYYY-MM-DD HH:MM" UTC, outcome): the last failed call
    state: State


def smallest_hold(config_id: str) -> Decimal:
    """What the smallest call the pass makes holds until it settles, in USD."""
    return ai_call.reservation_usd(config_id, _SMALLEST)


def _capped(gate: Gate, month: ai_ledger.Month) -> bool:
    if gate.config_id is None or gate.cap is None:
        return False
    return exact_sum((month.total, smallest_hold(gate.config_id))) > gate.cap


def status(
    db: sqlite3.Connection, now: datetime, environ: Mapping[str, str], rulings_root: Path
) -> Status:
    """Everything about the pass at `now`, read without writing (the caller's transaction)."""
    gate = check(db, environ, rulings_root)
    month = ai_ledger.totals(db, ai_ledger.month_of(now))
    invalid = db.execute(
        "SELECT COUNT(*) FROM story_ai WHERE month=? AND outcome='invalid'", (month.month,)
    ).fetchone()[0]
    row = db.execute(
        "SELECT reserved_at, outcome FROM ai_usage WHERE month=? AND outcome NOT IN"
        " ('ok','in progress') ORDER BY id DESC LIMIT 1",
        (month.month,),
    ).fetchone()
    problem = None
    if row is not None:
        at = datetime.fromisoformat(row["reserved_at"]).astimezone(UTC)
        problem = (f"{at:%Y-%m-%d %H:%M}", str(row["outcome"]))
    state: State = "off" if not gate.on else "capped" if _capped(gate, month) else "on"
    return Status(gate, month, int(invalid), problem, state)
