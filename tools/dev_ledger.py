"""Small durable local ledger for an approved Credit OS2 development run.

Usage: uv run python tools/dev_ledger.py --db .superpowers/dev.sqlite init
       uv run python tools/dev_ledger.py start RUN SPEC PLAN CAP WORKERS
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import subprocess
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
        CREATE TABLE IF NOT EXISTS dispatch_policies (
            run TEXT PRIMARY KEY REFERENCES runs(id), policy TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS deadlines (
            run TEXT PRIMARY KEY REFERENCES runs(id), expires INTEGER NOT NULL
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
        CREATE TABLE IF NOT EXISTS reconciliations (
            run TEXT NOT NULL, attempt TEXT NOT NULL, actual INTEGER NOT NULL,
            reason TEXT NOT NULL, PRIMARY KEY(run, attempt),
            FOREIGN KEY(run,attempt) REFERENCES attempts(run,id)
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
    previous = db.execute(
        """SELECT spec, plan, cap, workers, expires, policy, revision, state FROM runs
           LEFT JOIN deadlines ON deadlines.run=runs.id
           LEFT JOIN dispatch_policies ON dispatch_policies.run=runs.id WHERE runs.id=?""",
        (args.run,),
    ).fetchone()
    policy = getattr(args, "policy", None)
    if previous is not None:
        identity = (
            args.spec,
            args.plan,
            args.cap,
            args.workers,
            getattr(args, "deadline", None),
            policy,
        )
        if tuple(previous)[:6] != identity:
            raise ValueError("run ID already used with different approval")
        db.rollback()
        emit(
            {
                "ok": True,
                "run": args.run,
                "revision": previous["revision"],
                "state": previous["state"],
                "replayed": True,
            }
        )
        return
    limits = db.execute("SELECT * FROM project_limits WHERE id=1").fetchone()
    if limits is None:
        db.execute("INSERT INTO project_limits VALUES(1,?,?)", (args.cap, args.workers))
    elif args.cap > limits["cap"] or args.workers > limits["workers"]:
        raise ValueError("run exceeds approved project-wide limits")
    db.execute(
        "INSERT INTO runs(id,spec,plan,cap,workers,created) VALUES(?,?,?,?,?,?)",
        (args.run, args.spec, args.plan, args.cap, args.workers, int(time.time())),
    )
    if getattr(args, "deadline", None) is not None:
        if args.deadline <= int(time.time()):
            raise ValueError("run deadline must be in the future")
        db.execute("INSERT INTO deadlines VALUES(?,?)", (args.run, args.deadline))
    if policy is not None:
        db.execute("INSERT INTO dispatch_policies VALUES(?,?)", (args.run, policy))
    event(db, args.run, "start", "run", {"spec": args.spec, "plan": args.plan})
    db.commit()
    emit({"ok": True, "run": args.run, "revision": 1, "state": "approved"})


def approved_policy(args: argparse.Namespace) -> str | None:
    if args.dispatch_policy is None and args.shown_policy is None:
        return None
    if args.dispatch_policy is None or args.shown_policy is None:
        raise ValueError("dispatch policy file and displayed digest are both required")
    raw = args.dispatch_policy.read_bytes()
    if hashlib.sha256(raw).hexdigest() != args.shown_policy:
        raise ValueError("dispatch policy differs from the approved card")
    policy = json.loads(raw)
    fields = {"client", "routes", "max_attempt_seconds", "unmetered"}
    if not isinstance(policy, dict) or set(policy) != fields:
        raise ValueError("invalid dispatch policy fields")
    if policy["client"] not in ("codex", "claude") or type(policy["unmetered"]) is not bool:
        raise ValueError("invalid billing mode or local client")
    if type(policy["max_attempt_seconds"]) is not int or policy["max_attempt_seconds"] < 1:
        raise ValueError("max_attempt_seconds must be a positive integer")
    routes = policy["routes"]
    if (
        not isinstance(routes, list)
        or not routes
        or not all(valid_route(route) for route in routes)
    ):
        raise ValueError("provide an explicit allowlist of model and effort pairs")
    return json.dumps(policy, sort_keys=True)


def valid_route(route: object) -> bool:
    return (
        isinstance(route, dict)
        and set(route) == {"model", "effort"}
        and all(isinstance(v, str) and bool(v.strip()) for v in route.values())
    )


def approve_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    args.spec = hashlib.sha256(Path(args.spec).read_bytes()).hexdigest()
    args.plan = hashlib.sha256(Path(args.plan).read_bytes()).hexdigest()
    if (args.spec, args.plan) != (args.shown_spec, args.shown_plan):
        raise ValueError("documents differ from the spec and plan presented for approval")
    args.policy = approved_policy(args)
    start_run(db, args)


def explain_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    row = db.execute(
        "SELECT revision, payload FROM decisions WHERE run=? AND id=?", (args.run, args.id)
    ).fetchone()
    if row is None:
        raise ValueError("unknown decision for this run")
    emit({"decision": args.id, "revision": row["revision"], "payload": json.loads(row["payload"])})


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
    action = payload.get("action")
    if action in ("pause", "resume"):
        current, target = ("approved", "paused") if action == "pause" else ("paused", "approved")
        changed = db.execute(
            "UPDATE runs SET state=? WHERE id=? AND state=?", (target, args.run, current)
        )
        if changed.rowcount != 1:
            raise ValueError(f"run must be {current} to {action}")
    db.execute("UPDATE runs SET revision=? WHERE id=?", (revision, args.run))
    db.execute(
        "INSERT INTO decisions VALUES(?,?,?,?)",
        (args.run, args.id, revision, json.dumps(payload, sort_keys=True)),
    )
    event(db, args.run, f"decision:{args.id}", "decision", payload)
    db.commit()
    emit({"ok": True, "revision": revision, "decision": args.id, "payload": payload})


def reconcile_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if not args.reason.strip():
        raise ValueError("reconciliation requires the owner's reason")
    db.execute("BEGIN IMMEDIATE")
    row = db.execute(
        "SELECT settled,reserved FROM attempts WHERE run=? AND id=?", (args.run, args.id)
    ).fetchone()
    if row is None or row["settled"] != args.actual or args.actual <= row["reserved"]:
        raise ValueError("reconciliation requires an exact settled overrun")
    db.execute(
        "INSERT INTO reconciliations VALUES(?,?,?,?)", (args.run, args.id, args.actual, args.reason)
    )
    event(
        db,
        args.run,
        f"reconcile:{args.id}",
        "reconcile",
        {"attempt": args.id, "actual": args.actual, "reason": args.reason},
    )
    db.commit()
    emit({"ok": True, "reconciled": args.id, "actual": args.actual})


def capacity_available(
    db: sqlite3.Connection, cap: int, workers: int, reserve: int, run: str | None
) -> bool:
    usage = db.execute(
        """SELECT count(*) FILTER (WHERE state='active') AS active,
           coalesce(sum(coalesce(settled, reserved)), 0) AS committed
           FROM attempts WHERE ? IS NULL OR run=?""",
        (run, run),
    ).fetchone()
    return usage["active"] < workers and usage["committed"] + reserve <= cap


def launch_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.reserve < 0:
        raise ValueError("reservation must be non-negative")
    db.execute("BEGIN IMMEDIATE")
    row = db.execute("SELECT * FROM runs WHERE id=?", (args.run,)).fetchone()
    accounting = db.execute(
        """SELECT max(settled > reserved AND r.attempt IS NULL) AS overrun
           FROM attempts a LEFT JOIN reconciliations r ON a.run=r.run AND a.id=r.attempt"""
    ).fetchone()
    if accounting["overrun"]:
        raise ValueError("a worker exceeded its reservation; reconcile before further dispatch")
    if row is None or row["revision"] != args.expected_revision:
        raise ValueError("stale or unknown run revision")
    deadline = db.execute("SELECT expires FROM deadlines WHERE run=?", (args.run,)).fetchone()
    if row["state"] != "approved" or (deadline and deadline["expires"] <= int(time.time())):
        raise ValueError("run is paused or its approved deadline has elapsed")
    if row["spec"] != args.spec or row["plan"] != args.plan:
        raise ValueError("attempt must use the approved spec and plan")
    limits = db.execute("SELECT cap, workers FROM project_limits WHERE id=1").fetchone()
    if not capacity_available(db, row["cap"], row["workers"], args.reserve, args.run):
        raise ValueError("run worker or budget limit reached")
    if not capacity_available(db, limits["cap"], limits["workers"], args.reserve, None):
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
            "deadline_unix": db.execute(
                "SELECT (SELECT expires FROM deadlines WHERE run=?)", (args.run,)
            ).fetchone()[0],
            "project_spend": dict(
                db.execute(
                    """SELECT coalesce(sum(settled),0) AS spent,
                   coalesce(sum(CASE WHEN state='active' THEN reserved END),0) AS reserved
                   FROM attempts"""
                ).fetchone()
            ),
            "attempts": [dict(item) for item in attempts],
            "decisions": [
                {
                    "id": item["id"],
                    "revision": item["revision"],
                    "payload": json.loads(item["payload"]),
                }
                for item in db.execute(
                    "SELECT id,revision,payload FROM decisions WHERE run=? ORDER BY revision",
                    (args.run,),
                )
            ],
        }
    )


def accept_run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    db.execute("BEGIN IMMEDIATE")
    observed = db.execute(
        "SELECT result FROM events WHERE run=? AND id=?", (args.run, f"observed:{args.id}")
    ).fetchone()
    routed = db.execute(
        "SELECT 1 FROM events WHERE run=? AND id=?", (args.run, f"route:{args.id}")
    ).fetchone()
    if routed and observed is None:
        raise ValueError("worker observation is missing")
    if observed is not None and json.loads(observed["result"]).get("returncode") != 0:
        raise ValueError("worker failed or could not confirm its route")
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


def project_database() -> Path:
    common = subprocess.check_output(
        ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], text=True
    ).strip()
    git_dir = Path(common)
    if git_dir.name != ".git":
        raise ValueError("use --db to choose the coordinator ledger for this repository layout")
    return git_dir.parent / ".superpowers" / "dev.sqlite"


def approval_card(args: argparse.Namespace) -> None:
    """Read current document bytes and Git context without starting a run."""

    def git(*command: str) -> str:
        return subprocess.check_output(["git", *command], text=True).strip()

    root = Path(git("rev-parse", "--show-toplevel")).resolve(strict=True)
    files = {key: Path(getattr(args, key)).resolve(strict=True) for key in ("spec", "plan")}
    if any(not path.is_relative_to(root) for path in files.values()):
        raise ValueError("approval documents must belong to the current project checkout")
    emit(
        {
            "checkout": str(root),
            "ledger": str(args.db or project_database()),
            "candidate": git("rev-parse", "HEAD"),
            "branch": git("branch", "--show-current"),
            "target": "origin/main",
            "cached_target": git("rev-parse", "--verify", "origin/main"),
            "dirty": bool(git("status", "--porcelain")),
            "documents": {
                key: {
                    "path": str(path.relative_to(root)),
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                }
                for key, path in files.items()
            },
        }
    )


def add_approval_commands(sub: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    start = argparse.ArgumentParser(add_help=False)
    start.add_argument("run")
    start.add_argument("spec")
    start.add_argument("plan")
    start.add_argument("cap", type=int)
    start.add_argument("workers", type=int)
    sub.add_parser("start", parents=[start])
    approve = sub.add_parser("approve", parents=[start])
    approve.add_argument("--dispatch-policy", type=Path)
    approve.add_argument("--shown-policy")
    approve.add_argument("deadline", type=int)
    approve.add_argument("shown_spec", help="SHA-256 in the approved spec and plan card")
    approve.add_argument("shown_plan", help="SHA-256 in the approved spec and plan card")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--db", type=Path)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init")
    card = sub.add_parser("card")
    card.add_argument("spec")
    card.add_argument("plan")
    add_approval_commands(sub)
    explain = sub.add_parser("explain")
    explain.add_argument("run")
    explain.add_argument("id")
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
    reconcile = sub.add_parser("reconcile")
    reconcile.add_argument("run")
    reconcile.add_argument("id")
    reconcile.add_argument("actual", type=int)
    reconcile.add_argument("reason")
    accept = sub.add_parser("accept")
    accept.add_argument("run")
    accept.add_argument("id")
    accept.add_argument("expected_revision", type=int)
    handlers = {
        "start": start_run,
        "approve": approve_run,
        "explain": explain_run,
        "decision": decision_run,
        "launch": launch_run,
        "settle": settle_run,
        "reconcile": reconcile_run,
        "status": status_run,
        "accept": accept_run,
    }
    try:
        args = parser.parse_args()
        if args.command == "card":
            approval_card(args)
            return 0
        args.db = args.db or project_database()
        with connect(args.db) as db:
            if args.command == "init":
                emit({"ok": True, "db": str(args.db)})
            else:
                handlers[args.command](db, args)
    except (OSError, TypeError, ValueError, sqlite3.Error, subprocess.CalledProcessError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
