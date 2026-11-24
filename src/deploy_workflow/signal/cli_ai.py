"""The owner's AI commands (spec 5.2: the owner's powers stay on the command line).

    signal ai cap <amount>   set the monthly cap, in USD, no higher than the ruling's cap_usd:
    signal ai status         the state, each precondition, the month's spend and holds
    signal ai clear          clear the switch-off a call of unknown cost caused
    signal ai pass           one pass over the new stories now, only while the pass is on

No command shows a key's value: the status names the variables it looked for, and whether each
precondition holds.
"""

from __future__ import annotations

import argparse
import sqlite3
from datetime import UTC, datetime
from decimal import Decimal

from deploy_workflow.model.pricing import money_text
from deploy_workflow.signal import ai_gate, ai_ledger, ai_run
from deploy_workflow.signal.ai_ledger import CURRENCY
from deploy_workflow.signal.store import StoreError


def add_parser(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    verbs = commands.add_parser("ai", help="the AI pass: cap, status, clear, pass").add_subparsers(
        dest="action", required=True
    )
    verbs.add_parser("cap", help=f"set the monthly cap in {CURRENCY}").add_argument("amount")
    verbs.add_parser("status")
    verbs.add_parser("clear", help="clear the switch-off after a call of unknown cost")
    verbs.add_parser("pass", help="one pass over the new stories now")


def _holds(gate: ai_gate.Gate, stored: Decimal | None) -> list[str]:
    """The ruling and the cap lines; `stored` is the cap the owner set (which the gate does not
    count when it is above the ruling's)."""
    ruling = "missing" if gate.ruling is None else f"{gate.ruling.name} ({gate.config_id})"
    cap = "not set" if stored is None else f"{CURRENCY} {money_text(stored)} a month"
    if stored is not None and gate.cap is None:
        cap += ", above the ruled cap"
    return [f"ruling: {ruling}", f"cap: {cap}"]


def _status(db: sqlite3.Connection, now: datetime, setup: ai_run.Setup) -> None:
    held = ai_run.status(db, now, setup)
    month = held.month
    print(f"state: {held.state}")
    for line in _holds(held.gate, ai_ledger.cap(db)):
        print(line)
    for sentence in held.gate.missing:
        print(f"missing: {sentence}")
    print(
        f"{month.month} (UTC): spent {CURRENCY} {money_text(month.spent)},"
        f" held {CURRENCY} {money_text(month.held)} in {month.open_calls} open calls,"
        f" {month.unknown_calls} calls of unknown cost"
    )
    print(f"stories whose output failed its check this month: {held.invalid}")
    if held.last_problem is None:
        print("last failed call: none this month")
    else:
        at, outcome = held.last_problem
        print(f"last failed call: {at} UTC, {outcome}")


def _pass(db: sqlite3.Connection, now: datetime, setup: ai_run.Setup) -> int:
    report = ai_run.story_pass(db, now, setup)
    if report is None:
        held = ai_run.status(db, now, setup)
        print(f"no pass: the AI pass is {held.state}")
        for sentence in held.gate.missing:
            print(f"missing: {sentence}")
        return 2
    print(
        f"calls: {report.calls}, stories written: {report.written},"
        f" stories whose output failed its check: {report.invalid}"
    )
    if report.stopped is not None:
        print(f"stopped: {report.stopped}")
    return 0


def _within_ruling(amount: Decimal, setup: ai_run.Setup) -> None:
    """Refuse a cap above the newest Signal ruling's (with no accepted ruling the pass stays off,
    whatever the cap, and the gate checks it again once one exists)."""
    held = ai_gate.newest_ruled_cap(setup.rulings_root)
    if held is not None and amount > held[1]:
        ruled = f"{CURRENCY} {money_text(held[1])}"
        raise StoreError(f"the cap is at most the ruled {ruled} a month ({held[0].name})")


def run(db: sqlite3.Connection, args: argparse.Namespace, setup: ai_run.Setup) -> int:
    """One `ai` command; its exit code. A refused amount raises StoreError (the caller says so)."""
    now = datetime.now(UTC)
    if args.action == "cap":
        amount = ai_ledger.parse_cap(args.amount)
        _within_ruling(amount, setup)
        ai_ledger.set_cap(db, amount, now)
        print(f"monthly cap set to {CURRENCY} {money_text(amount)}")
    elif args.action == "status":
        _status(db, now, setup)
    elif args.action == "clear":
        cleared = ai_ledger.clear(db)
        print("switch-off cleared" if cleared else "the AI pass was not switched off")
    else:
        return _pass(db, now, setup)
    return 0
