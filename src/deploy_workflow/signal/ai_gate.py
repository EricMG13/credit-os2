"""Whether Signal's AI pass is on, decided by one function (``check``) from four preconditions.

The pass is on only when all four hold at the time of the check:

1. A standing ruling for Signal exists in ``docs/rulings/``: the newest file named
   ``YYYY-MM-DD-signal-ai-pass.md`` (``RULING_PATTERN``), in the project's ``check_ruling`` format
   (``lifts: live-provider-pause``, ``by: user``, ``date:``, ``configs:``), naming a configuration
   Signal may use (``CONFIGS``), and carrying the ruled monthly cap as exactly one header line
   ``cap_usd: <amount>`` (USD, a plain amount above zero with at most two decimal places, read as
   an exact Decimal: ``cap_usd: 15`` or ``cap_usd: 12.50``; ``ruled_cap``). Only that file is read:
   another ruling that names the same configuration (the run start page's does) never switches
   Signal on.
2. The owner has set a monthly cap on the command line (``signal ai cap <amount>``) no higher
   than the ruled one. The command refuses a higher amount; a stored cap above the newest
   ruling's figure (the ruling changed since) counts as no valid cap.
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
from deploy_workflow.model.pricing import money_text
from deploy_workflow.signal import ai_call, ai_ledger
from deploy_workflow.signal.ai_ledger import CURRENCY

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
# The ruled monthly cap: one header line, as the other header lines of a ruling are written.
CAP_LINE = re.compile(r"^[ \t]*cap_usd:[ \t]*(.*?)[ \t]*$", re.MULTILINE)
_AMOUNT = re.compile(r"(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,2})?")
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


def ruled_cap(ruling: Path) -> Decimal | None:
    """The monthly cap in USD that the ruling carries on its one ``cap_usd:`` line; None when it
    has no such line, more than one, or one that is not a plain amount above zero with at most two
    decimal places (a blank left in a draft included)."""
    try:
        text = ruling.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
    found = [value.rstrip("\r") for value in CAP_LINE.findall(text)]
    if len(found) != 1 or _AMOUNT.fullmatch(found[0]) is None:
        return None
    amount = Decimal(found[0])
    return amount if amount > 0 else None


@dataclass(frozen=True)
class _Ruled:
    """The newest Signal ruling as checked: the file, its configuration and its cap when it holds,
    else the sentence saying why it does not."""

    ruling: Path | None = None
    config_id: str | None = None
    cap: Decimal | None = None
    problem: str | None = None


def _ruling(rulings_root: Path) -> _Ruled:
    found = find_ruling(rulings_root)
    if found is None:
        return _Ruled(problem=NO_RULING)
    problem = ""
    for config_id in CONFIGS:
        try:
            check_ruling(config_id, found, rulings_root=rulings_root)
        except LivePauseInForce as error:
            problem = str(error)
            continue
        cap = ruled_cap(found)
        if cap is None:
            return _Ruled(
                problem=f"The ruling {found.name} is not accepted: it needs exactly one"
                f" cap_usd: line holding the ruled monthly cap in {CURRENCY}, such as"
                " cap_usd: 15."
            )
        return _Ruled(found, config_id, cap)
    return _Ruled(problem=f"The ruling {found.name} is not accepted: {problem}.")


def newest_ruled_cap(rulings_root: Path) -> tuple[Path, Decimal] | None:
    """The newest Signal ruling and its ruled cap, when it is accepted; else None."""
    ruled = _ruling(rulings_root)
    if ruled.ruling is None or ruled.cap is None:
        return None
    return ruled.ruling, ruled.cap


def _above(cap: Decimal, ruled: Decimal) -> str:
    return (
        f"The owner's monthly cap of {CURRENCY} {money_text(cap)} is above the ruled cap of"
        f" {CURRENCY} {money_text(ruled)}; the owner sets one no higher (signal ai cap)."
    )


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
    """The one decision: which of the four preconditions hold now. A stored cap above the
    ruling's is no valid cap (`Gate.cap` None)."""
    ruled = _ruling(rulings_root)
    missing = [] if ruled.problem is None else [ruled.problem]
    limit = ai_ledger.cap(db)
    if limit is None:
        missing.append(NO_CAP)
    elif ruled.cap is not None and limit > ruled.cap:
        missing.append(_above(limit, ruled.cap))
        limit = None
    missing += _credentials(environ)
    off = ai_ledger.switched_off(db)
    if off is not None:
        reason, _ = off
        missing.append(
            f"The pass was switched off because {reason}; only the owner can clear it"
            " (signal ai clear)."
        )
    return Gate(ruled.ruling, ruled.config_id, limit, tuple(missing))


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
