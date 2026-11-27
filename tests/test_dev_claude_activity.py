"""Project hook lifecycle events are scoped to a reserved Claude attempt."""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

import pytest

from tools.dev_claude_activity import bind, capture
from tools.dev_dashboard import dashboard
from tools.dev_ledger import connect, launch_run, settle_run, start_run


def reserve(db: sqlite3.Connection, run: str, client: str) -> argparse.Namespace:
    start_run(db, argparse.Namespace(run=run, spec="s", plan="p", cap=0, workers=2))
    db.execute("INSERT INTO dispatch_policies VALUES(?,?)", (run, json.dumps({"client": client})))
    launch_run(
        db, argparse.Namespace(run=run, id="A", expected_revision=1, reserve=0, spec="s", plan="p")
    )
    return argparse.Namespace(run=run, attempt="A", session="session-1", role="reviewer")


def hook(db: sqlite3.Connection, event: str, agent: str = "agent-1", **extra: str) -> None:
    capture(
        db,
        {
            "hook_event_name": f"Subagent{event}",
            "session_id": "session-1",
            "agent_type": "reviewer",
            "agent_id": agent,
            "last_assistant_message": "private content",
        }
        | extra,
    )


def test_only_an_explicitly_bound_start_and_matching_stop_are_recorded(tmp_path: Path) -> None:
    path = tmp_path / "dev.sqlite"
    with connect(path) as db:
        args = reserve(db, "claude", "claude")
        hook(db, "Start")
        bind(db, args)
        bind(db, args)
        hook(db, "Stop")
        hook(db, "Start", session_id="different-session")
        hook(db, "Start", agent_type="writer")
        assert (
            db.execute("SELECT count(*) FROM events WHERE kind='claude-start'").fetchone()[0] == 0
        )
        hook(db, "Start")
        hook(db, "Start", "agent-2")
        hook(db, "Stop", "agent-2")
        assert db.execute("SELECT count(*) FROM events WHERE kind='claude-stop'").fetchone()[0] == 0
        hook(db, "Stop")
        hook(db, "Stop")
        records = db.execute(
            "SELECT kind, result FROM events WHERE kind LIKE 'claude-%' ORDER BY rowid"
        ).fetchall()
        assert [row["kind"] for row in records] == ["claude-bind", "claude-start", "claude-stop"]
        assert "private content" not in "".join(row["result"] for row in records)
        assert db.execute("SELECT state FROM attempts").fetchone()[0] == "active"
    _, page = dashboard(path, "/view/", {"run": ["claude"]})
    assert b"Claude agent returned" in page and b"Awaiting verification" in page
    assert b"Agent time" in page and b"Model unverified" in page


def test_pending_bindings_cannot_collide_and_settlement_frees_the_role(tmp_path: Path) -> None:
    with connect(tmp_path / "dev.sqlite") as db:
        bind(db, reserve(db, "first", "claude"))
        hook(db, "Start")
        codex = reserve(db, "codex", "codex")
        with pytest.raises(ValueError, match="reserved Claude attempt"), db:
            bind(db, codex)
        settle_run(db, argparse.Namespace(run="codex", id="A", actual=0))
        second = reserve(db, "second", "claude")
        with pytest.raises(ValueError, match="unfinished binding"), db:
            bind(db, second)
        settle_run(db, argparse.Namespace(run="first", id="A", actual=0))
        bind(db, second)
        hook(db, "Start")
        hook(db, "Stop")
        hook(db, "Start", "agent-2")
        hook(db, "Stop", "agent-2")
        rows = db.execute(
            "SELECT run,kind FROM events WHERE kind IN ('claude-start','claude-stop') "
            "ORDER BY rowid"
        ).fetchall()
        assert [tuple(row) for row in rows] == [
            ("first", "claude-start"),
            ("second", "claude-start"),
            ("second", "claude-stop"),
        ]


def test_binder_and_hooks_resolve_the_same_project_ledger(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from tools import dev_claude_activity

    default = tmp_path / ".superpowers" / "dev.sqlite"
    custom = default.with_name("hybrid.sqlite")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(dev_claude_activity, "project_database", lambda: default)
    monkeypatch.delenv("CREDIT_OS2_DEV_DB", raising=False)
    assert dev_claude_activity.hook_database(None) == default
    monkeypatch.setenv("CREDIT_OS2_DEV_DB", str(custom))
    assert dev_claude_activity.hook_database(None) == custom.resolve()
    monkeypatch.setenv("CREDIT_OS2_DEV_DB", str(tmp_path / "unrelated.sqlite"))
    with pytest.raises(ValueError, match="absolute path in the project's"):
        dev_claude_activity.hook_database(None)
