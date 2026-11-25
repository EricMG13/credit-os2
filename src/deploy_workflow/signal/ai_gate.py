"""Whether Signal's AI pass is on, decided by one function (``check``) from four preconditions.

The pass is on only when all four hold at the time of the check:

1. A standing ruling for Signal exists in ``docs/rulings/``. Only files named
   ``YYYY-MM-DD-signal-ai-pass.md`` in ASCII digits (``RULING_PATTERN``) are rulings for Signal;
   the newest by the date in its name is read, and if any such name holds an impossible date or
   one after today (UTC), or the newest is not accepted, the pass is off: an older ruling is never
   read in its place. The newest is accepted only when it is a regular file (never a link or a
   folder), holds none of the draft's blanks (``____``) anywhere, passes the project's
   ``check_ruling`` (``lifts: live-provider-pause``, ``by: user``, ``date:``, ``configs:``) naming
   a configuration Signal may use (``CONFIGS``), its ``date:`` line is the date in its name, and
   its header block (``header_lines``: the run of lines holding its ``lifts:`` line, between blank
   lines) carries the ruled monthly cap as exactly one line ``cap_usd: <amount>`` (USD, a plain amount
   above zero with at most two decimal places, read as an exact Decimal: ``cap_usd: 15`` or
   ``cap_usd: 12.50``; ``ruled_cap``). A ``cap_usd:`` line in the body is never read. Another
   ruling that names the same configuration (the run start page's does) never switches Signal on.
2. The owner has set a monthly cap on the command line (``signal ai cap <amount>``) no higher
   than the ruled one. The command refuses a higher amount; a stored cap above the newest
   ruling's figure (the ruling changed since) counts as no valid cap.
3. The provider's credentials are in the launching environment: the variables the existing
   Copilot adapter reads, ``COPILOT_GITHUB_TOKEN`` (holding more than spaces) or, without it,
   ``COPILOT_USE_GH_LOGIN=1`` with ``gh`` on the service's PATH, and ``COPILOT_CLI_PATH`` naming
   the runtime by an absolute path to an existing file. Only their presence is checked; no value
   is read into a message.
4. The pass has not been switched off for a cost it could not establish
   (``signal ai clear`` lifts that).

With any missing the service runs as it did before the pass existed. ``status`` adds the month's
ledger: the pass is "capped" when it is on but the smallest call it makes would not fit beside the
month's settled spend under the cap (calls in flight are not counted there). Checking makes no model call and builds no adapter. ``ai_call.call`` makes the check again
immediately before every reservation.
"""

from __future__ import annotations

import os
import re
import shutil
import sqlite3
import stat
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, date, datetime
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
from deploy_workflow.signal import ai_ledger, ai_price
from deploy_workflow.signal.ai_ledger import CURRENCY

RULING_PATTERN = re.compile(r"([0-9]{4})-([0-9]{2})-([0-9]{2})-signal-ai-pass\.md", re.ASCII)
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
CAP_LINE = re.compile(r"[ \t]*cap_usd:[ \t]*(.*?)[ \t]*")
_LIFTS = re.compile(r"[ \t]*lifts:")
_AMOUNT = re.compile(r"(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,2})?")
NO_KEY = (
    f"The service was started without the provider's key: {TOKEN_VARIABLE}"
    f" (or {COPILOT_GH_LOGIN_VARIABLE}=1) is not set."
)
NO_RUNTIME = (
    f"The service was started without {COPILOT_RUNTIME_VARIABLE} naming the Copilot runtime"
    " (an absolute path to an existing file)."
)
NO_GH = (
    f"The service was started with {COPILOT_GH_LOGIN_VARIABLE}=1 but no gh command on its PATH,"
    " which that sign-in needs."
)
State = Literal["on", "off", "capped"]
# What Settings says for a credential sentence: no variable name is shown on a page (they are in
# ``signal ai status`` on the command line only).
_PLAIN = {
    NO_KEY: "The provider key is missing from the service's environment.",
    NO_RUNTIME: "The Copilot runtime is missing from the service's environment.",
    NO_GH: "The gh command the provider sign-in needs is missing from the service's environment.",
}


@dataclass(frozen=True)
class Gate:
    """The four preconditions as checked: a plain sentence per one that does not hold."""

    ruling: Path | None  # the ruling file, when it holds
    config_id: str | None  # the configuration it allows Signal, when it holds
    cap: Decimal | None  # the owner's stored cap, when it is a valid one
    missing: tuple[str, ...]
    ruled_cap: Decimal | None = None  # the ruling's cap_usd:, when the ruling holds

    @property
    def on(self) -> bool:
        return not self.missing

    @property
    def reasons(self) -> tuple[str, ...]:
        """The missing preconditions as Settings shows them to writers and the owner: the same
        sentences, with no environment variable named."""
        return tuple(_PLAIN.get(sentence, sentence) for sentence in self.missing)


def _named_date(name: str) -> date | None:
    """The real calendar date in a ruling's name, or None (an impossible date such as 9999-99-99)."""
    found = RULING_PATTERN.fullmatch(name)
    if found is None:
        return None
    try:
        return date(*(int(part) for part in found.groups()))
    except ValueError:
        return None


def _candidates(rulings_root: Path) -> list[str]:
    """The names in `rulings_root` that are Signal ruling names (ASCII digits only)."""
    try:
        return sorted(p.name for p in rulings_root.iterdir() if RULING_PATTERN.fullmatch(p.name))
    except OSError:
        return []


def header_lines(text: str) -> list[str]:
    """A ruling's header block: the run of non-blank lines holding its first ``lifts:`` line,
    where ``check_ruling``'s header lines are written (empty when it has none)."""
    lines = [line.rstrip("\r") for line in text.split("\n")]
    found = [n for n, line in enumerate(lines) if _LIFTS.match(line)]
    if not found:
        return []
    start = end = found[0]
    while start > 0 and lines[start - 1].strip():
        start -= 1
    while end + 1 < len(lines) and lines[end + 1].strip():
        end += 1
    return lines[start : end + 1]


def ruled_cap(text: str) -> Decimal | None:
    """The monthly cap in USD on the one ``cap_usd:`` line of the ruling's header block
    (``header_lines``); None when the block has no such line, more than one, or one that is not a
    plain amount above zero with at most two decimal places (a blank left in a draft included). A
    ``cap_usd:`` line in the body is never read."""
    found = [m.group(1) for line in header_lines(text) if (m := CAP_LINE.fullmatch(line))]
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


def _refused(name: str, why: str) -> _Ruled:
    return _Ruled(problem=f"The ruling {name} is not accepted: {why}")


def _newest(rulings_root: Path, today: date) -> tuple[str, date] | _Ruled:
    """The newest ruling name and its date, or why the pass is off: no ruling, or a name whose
    date is not a real one or is after `today` (such a file is never passed over for an older)."""
    names = _candidates(rulings_root)
    if not names:
        return _Ruled(problem=NO_RULING)
    dated: list[tuple[date, str]] = []
    for name in names:
        day = _named_date(name)
        if day is None:
            return _refused(name, "the date in its name is not a real date.")
        if day > today:
            return _refused(name, "it is dated after today (UTC).")
        dated.append((day, name))
    day, name = max(dated)
    return name, day


def _text(path: Path) -> str | None:
    """The ruling's text when it is a regular file of UTF-8 (never followed through a link)."""
    try:
        if not stat.S_ISREG(path.lstat().st_mode):
            return None
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def _ruling(rulings_root: Path, today: date) -> _Ruled:
    newest = _newest(rulings_root, today)
    if isinstance(newest, _Ruled):
        return newest
    name, day = newest
    found = rulings_root / name
    text = _text(found)
    if text is None:
        return _refused(name, "it is not a regular file of text (a link or folder is never read).")
    if "____" in text:
        return _refused(name, "it still holds a blank of the draft (____).")
    problem = ""
    for config_id in CONFIGS:
        try:
            checked = check_ruling(config_id, found, rulings_root=rulings_root)
        except LivePauseInForce as error:
            problem = str(error)
            continue
        if checked.date != day:
            return _refused(name, "its date: line is not the date in its name.")
        cap = ruled_cap(text)
        if cap is None:
            return _refused(
                name,
                f"it needs exactly one cap_usd: line among its header lines, holding the ruled"
                f" monthly cap in {CURRENCY}, such as cap_usd: 15.",
            )
        return _Ruled(found, config_id, cap)
    return _refused(name, f"{problem}.")


def newest_ruled_cap(rulings_root: Path, now: datetime) -> tuple[Path, Decimal] | None:
    """The newest Signal ruling and its ruled cap at `now`, when it is accepted; else None."""
    ruled = _ruling(rulings_root, now.astimezone(UTC).date())
    if ruled.ruling is None or ruled.cap is None:
        return None
    return ruled.ruling, ruled.cap


def _above(cap: Decimal, ruled: Decimal) -> str:
    return (
        f"The owner's monthly cap of {CURRENCY} {money_text(cap)} is above the ruled cap of"
        f" {CURRENCY} {money_text(ruled)}; the owner sets one no higher (signal ai cap)."
    )


def _key(environ: Mapping[str, str]) -> str | None:
    """The sentence for a missing key, or None. A token set is what the adapter uses, so it must
    hold more than spaces; without one, the gh sign-in needs ``gh`` on the service's PATH (found
    as the adapter finds it)."""
    token = environ.get(TOKEN_VARIABLE)
    if token:
        return None if token.strip() else NO_KEY
    if environ.get(COPILOT_GH_LOGIN_VARIABLE) != "1":
        return NO_KEY
    return None if shutil.which("gh", path=environ.get("PATH")) else NO_GH


def _credentials(environ: Mapping[str, str]) -> list[str]:
    """The sentences for the provider credentials that are missing (presence only; no value is
    put in a sentence). The runtime is an absolute path to an existing regular file, so it does
    not depend on the working directory."""
    missing = [] if (key := _key(environ)) is None else [key]
    runtime = environ.get(COPILOT_RUNTIME_VARIABLE)
    if not runtime or not os.path.isabs(runtime) or not Path(runtime).is_file():
        missing.append(NO_RUNTIME)
    return missing


def check(
    db: sqlite3.Connection, environ: Mapping[str, str], rulings_root: Path, now: datetime
) -> Gate:
    """The one decision: which of the four preconditions hold at `now`. A stored cap above the
    ruling's is no valid cap (`Gate.cap` None). ``ai_call.call`` makes it again immediately before
    every reservation, so a ruling withdrawn or lowered during a job stops the job's next call."""
    ruled = _ruling(rulings_root, now.astimezone(UTC).date())
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
    return Gate(ruled.ruling, ruled.config_id, limit, tuple(missing), ruled.cap)


@dataclass(frozen=True)
class Status:
    """The gate with the month's ledger, as Settings, the CLI and the loop read it."""

    gate: Gate
    month: ai_ledger.Month
    invalid: int  # stories this month whose output failed its check
    last_problem: tuple[str, str] | None  # ("YYYY-MM-DD HH:MM" UTC, outcome): the last failed call
    state: State
    digests_today: int = 0  # digest-writer calls reserved in this UTC day, service-wide
    digests_per_day: int = ai_ledger.DIGESTS_PER_DAY

    @property
    def day_full(self) -> bool:
        """Whether the digest writer has made the day's calls: due digests wait for 00:00 UTC."""
        return self.digests_today >= self.digests_per_day


smallest_hold = ai_price.smallest_hold


def _capped(gate: Gate, month: ai_ledger.Month) -> bool:
    """At the cap: the smallest call's hold does not fit beside the month's settled spend. A call
    merely in flight is not counted here (it settles, mostly far below its hold): what viewers are
    told, and whether AI fields are delivered, follow settled spend; ``reserve`` alone counts
    holds, call by call."""
    if gate.config_id is None or gate.cap is None:
        return False
    return exact_sum((month.spent, smallest_hold(gate.config_id))) > gate.cap


def status(
    db: sqlite3.Connection, now: datetime, environ: Mapping[str, str], rulings_root: Path
) -> Status:
    """Everything about the pass at `now`, read without writing (the caller's transaction)."""
    gate = check(db, environ, rulings_root, now)
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
    today, per_day = ai_ledger.digest_calls_on(db, now), ai_ledger.digests_per_day(db)
    return Status(gate, month, int(invalid), problem, state, today, per_day)
