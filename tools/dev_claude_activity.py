"""Record opt-in Claude subagent timing in the existing development ledger."""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys
from contextlib import closing
from pathlib import Path

if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.dev_ledger import event, project_database


def pending_binding(db: sqlite3.Connection, session: str, role: str) -> sqlite3.Row | None:
    row: sqlite3.Row | None = db.execute(
        """SELECT b.run, json_extract(b.result,'$.attempt') AS attempt, s.result AS started,
                  (r.state='approved' AND coalesce(v.revision,a.revision)=r.revision
                   AND (d.expires IS NULL OR d.expires>unixepoch())) AS can_start
           FROM events b
           JOIN attempts a ON a.run=b.run AND a.id=json_extract(b.result,'$.attempt')
           JOIN runs r ON r.id=a.run LEFT JOIN deadlines d ON d.run=r.id
           LEFT JOIN revalidated_attempts v
             ON v.run=a.run AND v.attempt=a.id
           LEFT JOIN events s ON s.run=b.run
             AND s.id='claude-start:'||json_extract(b.result,'$.attempt')
           LEFT JOIN events e ON e.run=b.run
             AND e.id='claude-stop:'||json_extract(b.result,'$.attempt')
           WHERE b.kind='claude-bind' AND json_extract(b.result,'$.session')=?
             AND json_extract(b.result,'$.role')=? AND e.id IS NULL
             AND a.state='active'""",
        (session, role),
    ).fetchone()
    return row


def bind(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    db.execute("BEGIN IMMEDIATE")
    row = db.execute(
        """SELECT 1 FROM attempts a JOIN runs r ON r.id=a.run
           JOIN dispatch_policies p ON p.run=a.run LEFT JOIN deadlines d ON d.run=r.id
           LEFT JOIN revalidated_attempts v
           ON v.run=a.run AND v.attempt=a.id
           WHERE a.run=? AND a.id=? AND a.state='active' AND r.state='approved'
             AND coalesce(v.revision,a.revision)=r.revision
             AND (d.expires IS NULL OR d.expires>unixepoch())
             AND json_extract(p.policy,'$.client')='claude'""",
        (args.run, args.attempt),
    ).fetchone()
    if row is None:
        raise ValueError("binding requires a current reserved Claude attempt")
    pending = pending_binding(db, args.session, args.role)
    if pending is not None:
        if (pending["run"], pending["attempt"]) == (args.run, args.attempt):
            db.rollback()
            return
        raise ValueError(
            "this Claude session already has an unfinished binding for that agent type"
        )
    event(
        db,
        args.run,
        f"claude-bind:{args.attempt}",
        "claude-bind",
        {"attempt": args.attempt, "session": args.session, "role": args.role},
    )
    db.commit()


def hook_token(value: object) -> str:
    return value if isinstance(value, str) and re.fullmatch(r"[\w.:-]{1,160}", value) else ""


def capture(db: sqlite3.Connection, payload: object) -> None:
    if not isinstance(payload, dict):
        return
    session, role, agent = (
        hook_token(payload.get(key)) for key in ("session_id", "agent_type", "agent_id")
    )
    cause = payload.get("hook_event_name")
    if not (session and role and agent) or cause not in ("SubagentStart", "SubagentStop"):
        return
    db.execute("BEGIN IMMEDIATE")
    binding = pending_binding(db, session, role)
    if binding is None:
        db.rollback()
        return
    if cause == "SubagentStart":
        if binding["can_start"]:
            record_start(db, binding, session, agent)
    elif binding["started"] and json.loads(binding["started"])["agent"] == agent:
        event(db, binding["run"], f"claude-stop:{binding['attempt']}", "claude-stop", {})
    db.commit()


def record_start(db: sqlite3.Connection, binding: sqlite3.Row, session: str, agent: str) -> None:
    if (
        binding["started"] is not None
        or db.execute(
            """SELECT 1 FROM events WHERE kind='claude-start'
           AND json_extract(result,'$.session')=? AND json_extract(result,'$.agent')=?""",
            (session, agent),
        ).fetchone()
        is not None
    ):
        return
    event(
        db,
        binding["run"],
        f"claude-start:{binding['attempt']}",
        "claude-start",
        {"session": session, "agent": agent},
    )


def hook_database(override: Path | None) -> Path:
    if override is not None:
        return override
    os.chdir(Path(__file__).resolve().parents[1])
    default = project_database()
    configured = os.environ.get("CREDIT_OS2_DEV_DB")
    if not configured:
        return default
    path = Path(configured)
    if not path.is_absolute() or not path.resolve().is_relative_to(default.parent.resolve()):
        raise ValueError("CREDIT_OS2_DEV_DB must be an absolute path in the project's .superpowers")
    return path.resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path)
    commands = parser.add_subparsers(dest="command", required=True)
    binding = commands.add_parser("bind")
    for name in ("run", "attempt", "session", "role"):
        binding.add_argument(name)
    commands.add_parser("hook")
    args = parser.parse_args()
    try:
        database = hook_database(args.db)
        if not database.is_file():
            if args.command == "hook":
                return 0
            raise ValueError("development ledger does not exist")
        uri = f"{database.resolve().as_uri()}?mode=rw"
        with closing(sqlite3.connect(uri, uri=True, timeout=2, isolation_level=None)) as db:
            db.row_factory = sqlite3.Row
            if args.command == "hook":
                capture(db, json.load(sys.stdin))
            elif hook_token(args.session) and hook_token(args.role):
                bind(db, args)
            else:
                raise ValueError("use the exact Claude session ID and agent type")
    except (OSError, ValueError, sqlite3.Error, subprocess.CalledProcessError) as exc:
        print(f"Development activity unavailable: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
