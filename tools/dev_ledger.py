"""Small durable local ledger for an approved Credit OS2 development run.

Usage: uv run python tools/dev_ledger.py --db .superpowers/dev.sqlite init
       uv run python tools/dev_ledger.py start RUN SPEC PLAN CAP WORKERS
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
from pathlib import Path


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=10, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY, spec TEXT NOT NULL, plan TEXT NOT NULL,
            cap INTEGER NOT NULL CHECK(cap >= 0), workers INTEGER NOT NULL CHECK(workers > 0),
            revision INTEGER NOT NULL DEFAULT 1, state TEXT NOT NULL DEFAULT 'approved',
            created INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_limits (
            id INTEGER PRIMARY KEY CHECK(id = 1), cap INTEGER NOT NULL,
            workers INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS decisions (
            run TEXT NOT NULL REFERENCES runs(id), id TEXT NOT NULL,
            revision INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(run, id)
        );
        CREATE TABLE IF NOT EXISTS attempts (
            run TEXT NOT NULL REFERENCES runs(id), id TEXT NOT NULL,
            revision INTEGER NOT NULL, state TEXT NOT NULL, reserved INTEGER NOT NULL,
            settled INTEGER, PRIMARY KEY(run, id)
        );
        CREATE TABLE IF NOT EXISTS events (
            run TEXT NOT NULL REFERENCES runs(id), id TEXT NOT NULL,
            kind TEXT NOT NULL, result TEXT NOT NULL, created INTEGER NOT NULL,
            PRIMARY KEY(run, id)
        );
        """
    )
    return db


def emit(value: object) -> None:
    print(json.dumps(value, sort_keys=True))


def event(
    db: sqlite3.Connection, run: str, ident: str, kind: str, payload: dict[str, object]
) -> None:
    db.execute(
        "INSERT INTO events VALUES (?, ?, ?, ?, ?)",
        (run, ident, kind, json.dumps(payload, sort_keys=True), int(time.time())),
    )


def start_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.cap < 0 or args.workers < 1:
        raise ValueError("cap must be non-negative and workers positive")
    db.execute("BEGIN IMMEDIATE")
    limits = db.execute("SELECT * FROM project_limits WHERE id=1").fetchone()
    if limits is None:
        db.execute("INSERT INTO project_limits VALUES(1,?,?)", (args.cap, args.workers))
    elif limits["cap"] != args.cap or limits["workers"] != args.workers:
        raise ValueError("project-wide limits already established")
    db.execute(
        "INSERT INTO runs(id,spec,plan,cap,workers,created) VALUES(?,?,?,?,?,?)",
        (args.run, args.spec, args.plan, args.cap, args.workers, int(time.time())),
    )
    event(db, args.run, "start", "run", {"spec": args.spec, "plan": args.plan})
    db.commit()
    emit({"ok": True, "run": args.run, "revision": 1, "state": "approved"})


def decision_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    payload = json.loads(args.payload)
    if not isinstance(payload, dict):
        raise TypeError("decision payload must be an object")
    db.execute("BEGIN IMMEDIATE")
    previous = db.execute(
        "SELECT result FROM events WHERE run=? AND id=?",
        (args.run, f"decision:{args.id}"),
    ).fetchone()
    if previous is not None:
        if previous["result"] == json.dumps(payload, sort_keys=True):
            db.rollback()
            emit({"ok": True, "replayed": True, "payload": payload})
            return
        raise ValueError("decision ID already used with different content")
    row = db.execute("SELECT revision FROM runs WHERE id=?", (args.run,)).fetchone()
    if row is None or row["revision"] != args.expected_revision:
        raise ValueError("stale or unknown decision revision")
    revision = args.expected_revision + 1
    db.execute("UPDATE runs SET revision=? WHERE id=?", (revision, args.run))
    db.execute(
        "INSERT INTO decisions VALUES(?,?,?,?)",
        (args.run, args.id, revision, json.dumps(payload, sort_keys=True)),
    )
    event(db, args.run, f"decision:{args.id}", "decision", payload)
    db.commit()
    emit({"ok": True, "revision": revision, "decision": args.id, "payload": payload})


def launch_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.reserve < 0:
        raise ValueError("reservation must be non-negative")
    db.execute("BEGIN IMMEDIATE")
    row = db.execute("SELECT * FROM runs WHERE id=?", (args.run,)).fetchone()
    active = db.execute(
        "SELECT count(*) AS n, coalesce(sum(reserved),0) AS held FROM attempts WHERE state='active'"
    ).fetchone()
    accounting = db.execute(
        "SELECT coalesce(sum(settled),0) AS spent, max(settled > reserved) AS overrun FROM attempts"
    ).fetchone()
    if accounting["overrun"]:
        raise ValueError("a worker exceeded its reservation; reconcile before further dispatch")
    if row is None or row["revision"] != args.expected_revision:
        raise ValueError("stale or unknown run revision")
    if row["spec"] != args.spec or row["plan"] != args.plan:
        raise ValueError("attempt must use the approved spec and plan")
    if (
        active["n"] >= row["workers"]
        or accounting["spent"] + active["held"] + args.reserve > row["cap"]
    ):
        raise ValueError("worker or budget limit reached")
    db.execute(
        "INSERT INTO attempts VALUES(?,?,?,?,?,NULL)",
        (args.run, args.id, args.expected_revision, "active", args.reserve),
    )
    event(db, args.run, f"launch:{args.id}", "launch", {"reserve": args.reserve})
    db.commit()
    emit({"ok": True, "attempt": args.id, "reserved": args.reserve})


def settle_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.actual < 0:
        raise ValueError("actual cost must be non-negative")
    db.execute("BEGIN IMMEDIATE")
    cur = db.execute(
        "UPDATE attempts SET state='settled', settled=? WHERE run=? AND id=? AND state='active'",
        (args.actual, args.run, args.id),
    )
    if cur.rowcount != 1:
        raise ValueError("unknown or already settled")
    event(db, args.run, f"settle:{args.id}", "settle", {"actual": args.actual})
    db.commit()
    emit({"ok": True, "attempt": args.id, "actual": args.actual})


def status_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    row = db.execute("SELECT * FROM runs WHERE id=?", (args.run,)).fetchone()
    if row is None:
        raise ValueError("unknown run")
    attempts = db.execute(
        "SELECT id, revision, state, reserved, settled FROM attempts WHERE run=? ORDER BY id",
        (args.run,),
    ).fetchall()
    emit(
        {
            "run": row["id"],
            "revision": row["revision"],
            "state": row["state"],
            "spec": row["spec"],
            "plan": row["plan"],
            "cap": row["cap"],
            "workers": row["workers"],
            "attempts": [dict(item) for item in attempts],
        }
    )


def accept_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    db.execute("BEGIN IMMEDIATE")
    cursor = db.execute(
        """UPDATE attempts SET state='accepted' WHERE run=? AND id=? AND state='settled'
           AND revision=? AND revision=(SELECT revision FROM runs WHERE id=?)""",
        (args.run, args.id, args.expected_revision, args.run),
    )
    if cursor.rowcount != 1:
        raise ValueError("attempt is unknown, unsettled, already accepted, or superseded")
    event(db, args.run, f"accept:{args.id}", "accept", {"revision": args.expected_revision})
    db.commit()
    emit({"ok": True, "attempt": args.id, "revision": args.expected_revision})


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--db", type=Path, default=Path(".superpowers/dev.sqlite"))
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init")
    start = sub.add_parser("start")
    start.add_argument("run")
    start.add_argument("spec")
    start.add_argument("plan")
    start.add_argument("cap", type=int)
    start.add_argument("workers", type=int)
    decision = sub.add_parser("decision")
    decision.add_argument("run")
    decision.add_argument("id")
    decision.add_argument("expected_revision", type=int)
    decision.add_argument("payload")
    attempt = sub.add_parser("launch")
    attempt.add_argument("run")
    attempt.add_argument("id")
    attempt.add_argument("expected_revision", type=int)
    attempt.add_argument("reserve", type=int)
    attempt.add_argument("spec")
    attempt.add_argument("plan")
    sub.add_parser("status").add_argument("run")
    settle = sub.add_parser("settle")
    settle.add_argument("run")
    settle.add_argument("id")
    settle.add_argument("actual", type=int)
    accept = sub.add_parser("accept")
    accept.add_argument("run")
    accept.add_argument("id")
    accept.add_argument("expected_revision", type=int)
    handlers = {
        "start": start_run,
        "decision": decision_run,
        "launch": launch_run,
        "settle": settle_run,
        "status": status_run,
        "accept": accept_run,
    }
    try:
        args = parser.parse_args()
        with connect(args.db) as db:
            if args.command == "init":
                emit({"ok": True, "db": str(args.db)})
            else:
                handlers[args.command](db, args)
    except (OSError, TypeError, ValueError, sqlite3.Error) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
