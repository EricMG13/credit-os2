"""The coordinator ledger serializes decisions and reserves shared run capacity."""

from __future__ import annotations

import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / "tools" / "dev_ledger.py"


def call(db: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--db", str(db), *args],
        capture_output=True,
        check=False,
        text=True,
    )


def start(db: Path, workers: int = 2, cap: int = 100) -> None:
    assert call(db, "start", "run-a", "spec-v1", "plan-v1", str(cap), str(workers)).returncode == 0


def test_run_requires_approved_spec_and_plan_and_stale_decisions_fail(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    changed = call(db, "launch", "run-a", "a", "1", "10", "spec-v2", "plan-v1")
    assert changed.returncode == 2
    decision = call(db, "decision", "run-a", "D-1", "1", '{"choice":"period"}')
    assert json.loads(decision.stdout)["revision"] == 2
    stale = call(db, "launch", "run-a", "b", "1", "10", "spec-v1", "plan-v1")
    assert stale.returncode == 2


def test_concurrent_launches_cannot_overbook_cap_or_workers(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db, workers=2, cap=100)

    def launch(name: str) -> subprocess.CompletedProcess[str]:
        return call(db, "launch", "run-a", name, "1", "60", "spec-v1", "plan-v1")

    with ThreadPoolExecutor(max_workers=3) as pool:
        outcomes = list(pool.map(launch, ["a", "b", "c"]))
    assert sum(outcome.returncode == 0 for outcome in outcomes) == 1


def test_settlement_is_once_and_releases_unused_reservation(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db, workers=1, cap=100)
    assert call(db, "launch", "run-a", "a", "1", "90", "spec-v1", "plan-v1").returncode == 0
    assert call(db, "settle", "run-a", "a", "30").returncode == 0
    assert call(db, "settle", "run-a", "a", "30").returncode == 2
    assert call(db, "launch", "run-a", "b", "1", "70", "spec-v1", "plan-v1").returncode == 0


def test_late_result_keeps_its_cost_but_cannot_be_accepted(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    assert call(db, "launch", "run-a", "old", "1", "60", "spec-v1", "plan-v1").returncode == 0
    payload = '{"choice":"period"}'
    first = call(db, "decision", "run-a", "D-1", "1", payload)
    replay = call(db, "decision", "run-a", "D-1", "1", payload)
    conflict = call(db, "decision", "run-a", "D-1", "1", '{"choice":"different"}')
    assert first.returncode == replay.returncode == 0
    assert conflict.returncode == 2
    assert call(db, "settle", "run-a", "old", "60").returncode == 0
    assert call(db, "accept", "run-a", "old", "1").returncode == 2
    assert call(db, "accept", "run-a", "old", "2").returncode == 2
    assert call(db, "launch", "run-a", "new", "2", "41", "spec-v1", "plan-v1").returncode == 2
    assert call(db, "launch", "run-a", "new", "2", "40", "spec-v1", "plan-v1").returncode == 0
    assert call(db, "settle", "run-a", "new", "40").returncode == 0
    assert call(db, "accept", "run-a", "new", "2").returncode == 0


def test_reservations_share_headroom_across_runs(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db, workers=2, cap=30)
    assert call(db, "start", "run-b", "spec-b", "plan-b", "30", "2").returncode == 0
    with ThreadPoolExecutor(max_workers=2) as pool:
        a = pool.submit(call, db, "launch", "run-a", "a", "1", "20", "spec-v1", "plan-v1")
        b = pool.submit(call, db, "launch", "run-b", "b", "1", "20", "spec-b", "plan-b")
        assert sorted((a.result().returncode, b.result().returncode)) == [0, 2]


def test_spend_overrun_stops_launches_even_below_project_cap(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db, cap=100)
    assert call(db, "launch", "run-a", "a", "1", "5", "spec-v1", "plan-v1").returncode == 0
    assert call(db, "settle", "run-a", "a", "6").returncode == 0
    status = json.loads(call(db, "status", "run-a").stdout)
    assert status["attempts"][0]["settled"] == 6
    blocked = call(db, "launch", "run-a", "b", "1", "10", "spec-v1", "plan-v1")
    assert blocked.returncode == 2
    assert "exceeded its reservation" in blocked.stderr
    assert call(db, "reconcile", "run-a", "a", "5", "wrong amount").returncode == 2
    assert call(db, "reconcile", "run-a", "a", "6", "Owner verified invoice").returncode == 0
    assert call(db, "launch", "run-a", "b", "1", "95", "spec-v1", "plan-v1").returncode == 2
    assert call(db, "launch", "run-a", "b", "1", "94", "spec-v1", "plan-v1").returncode == 0
    assert json.loads(call(db, "status", "run-a").stdout)["project_spend"] == {
        "reserved": 94,
        "spent": 6,
    }


def test_approved_documents_pause_resume_and_read_only_explanation(tmp_path: Path) -> None:
    import hashlib
    import time

    spec, plan = tmp_path / "spec", tmp_path / "plan"
    spec.write_text("a")
    plan.write_text("b")
    db = tmp_path / "run.sqlite"
    args = ("approve", "run", str(spec), str(plan), "100", "1")
    hashes = tuple(hashlib.sha256(p.read_bytes()).hexdigest() for p in (spec, plan))
    future = str(int(time.time()) + 3600)
    base = "0123456789abcdef0123456789abcdef01234567"
    base_args = ("--base", base, "--shown-base", base)
    assert call(db, *args, "1", *hashes, *base_args).returncode == 2
    assert call(db, *args, future, hashes[0], hashes[0], *base_args).returncode == 2
    assert call(db, *args, future, *hashes, *base_args).returncode == 0
    assert json.loads(call(db, *args, future, *hashes, *base_args).stdout)["replayed"]
    assert call(db, *args, str(int(future) + 1), *hashes, *base_args).returncode == 2
    changed_base = "1123456789abcdef0123456789abcdef01234567"
    assert (
        call(
            db,
            *args,
            future,
            *hashes,
            "--base",
            changed_base,
            "--shown-base",
            changed_base,
        ).returncode
        == 2
    )
    pause = ("decision", "run", "D-1", "1", '{"action":"pause","reason":"owner request"}')
    assert call(db, *pause).returncode == call(db, *pause).returncode == 0
    explanation = json.loads(call(db, "explain", "run", "D-1").stdout)
    assert explanation["payload"]["reason"] == "owner request"
    assert call(db, "launch", "run", "w", "2", "0", *hashes).returncode == 2
    assert call(db, "decision", "run", "D-2", "2", '{"action":"resume"}').returncode == 0
    assert call(db, "launch", "run", "w", "3", "0", *hashes).returncode == 0


def test_approved_dispatch_policy_cannot_change_on_retry(tmp_path: Path) -> None:
    import hashlib
    import time

    db = tmp_path / "run.sqlite"
    doc = tmp_path / "spec"
    doc.write_text("approved")
    digest = hashlib.sha256(doc.read_bytes()).hexdigest()
    policy = tmp_path / "policy"
    limits = {
        "client": "codex",
        "unmetered": True,
        "max_attempt_seconds": 60,
        "routes": [{"model": "m", "effort": "high"}],
    }
    policy.write_text(json.dumps(limits))
    args = (
        "approve",
        "run",
        str(doc),
        str(doc),
        "0",
        "1",
        str(int(time.time()) + 3600),
        digest,
        digest,
        "--base",
        "0123456789abcdef0123456789abcdef01234567",
        "--shown-base",
        "0123456789abcdef0123456789abcdef01234567",
        "--dispatch-policy",
        str(policy),
        "--shown-policy",
    )
    shown = hashlib.sha256(policy.read_bytes()).hexdigest()
    assert call(db, *args, shown).returncode == 0
    limits["max_attempt_seconds"] = 1000
    policy.write_text(json.dumps(limits))
    assert call(db, *args, shown).returncode == 2
    assert call(db, *args, hashlib.sha256(policy.read_bytes()).hexdigest()).returncode == 2


def test_existing_ledger_schema_adds_approved_base_without_losing_runs(tmp_path: Path) -> None:
    import sqlite3

    path = tmp_path / "old.sqlite"
    with sqlite3.connect(path) as db:
        db.execute(
            """CREATE TABLE runs (
               id TEXT PRIMARY KEY, spec TEXT NOT NULL, plan TEXT NOT NULL,
               cap INTEGER NOT NULL, workers INTEGER NOT NULL,
               revision INTEGER NOT NULL DEFAULT 1, state TEXT NOT NULL DEFAULT 'approved',
               created INTEGER NOT NULL)"""
        )
        db.execute("INSERT INTO runs(id,spec,plan,cap,workers,created) VALUES('old','s','p',0,1,1)")
    from tools.dev_ledger import connect

    with connect(path) as db:
        row = db.execute("SELECT id,base_sha FROM runs WHERE id='old'").fetchone()
        assert tuple(row) == ("old", None)


def test_failed_or_missing_worker_observation_blocks_acceptance(tmp_path: Path) -> None:
    import sqlite3

    db = tmp_path / "run.sqlite"
    start(db)
    assert call(db, "launch", "run-a", "a", "1", "0", "spec-v1", "plan-v1").returncode == 0
    with sqlite3.connect(db) as conn:
        conn.execute("INSERT INTO events VALUES('run-a','route:a','route-resolved','{}',0)")
    assert call(db, "settle", "run-a", "a", "0").returncode == 0
    assert call(db, "accept", "run-a", "a", "1").returncode == 2
    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO events VALUES('run-a','observed:a','worker-result',?,0)",
            (json.dumps({"returncode": 125}),),
        )
    assert call(db, "accept", "run-a", "a", "1").returncode == 2


def test_narrower_run_keeps_its_own_limits_inside_shared_project_cap(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db, workers=2, cap=100)
    assert call(db, "start", "small", "s", "p", "10", "1").returncode == 0
    assert call(db, "launch", "run-a", "big", "1", "90", "spec-v1", "plan-v1").returncode == 0
    assert call(db, "launch", "small", "x", "1", "11", "s", "p").returncode == 2
    assert call(db, "launch", "small", "x", "1", "10", "s", "p").returncode == 0
    assert call(db, "launch", "small", "y", "1", "0", "s", "p").returncode == 2


def test_text_status_ranks_owner_decisions_before_applied_choices(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    for index, kind in enumerate(("verified", "applied", "owner"), 1):
        payload = json.dumps({"kind": kind, "summary": f"Item {index}"})
        assert call(db, "note", "run-a", f"D-{index}", "1", payload).returncode == 0
    lines = call(db, "status", "run-a", "--text").stdout.splitlines()
    assert [line.split(" · ")[0] for line in lines if line.startswith("D-")] == [
        "D-3",
        "D-2",
        "D-1",
    ]


def test_milestone_notes_keep_inflight_results_eligible(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    assert call(db, "launch", "run-a", "w", "1", "0", "spec-v1", "plan-v1").returncode == 0
    payload = '{"kind":"verified","summary":"Fixture checked"}'
    assert call(db, "note", "run-a", "D-1", "1", payload).returncode == 0
    assert call(db, "decision", "run-a", "D-1", "1", payload).returncode == 2
    assert call(db, "settle", "run-a", "w", "0").returncode == 0
    assert call(db, "accept", "run-a", "w", "1").returncode == 0


def test_restart_settles_only_proven_terminal_unmetered_attempts(tmp_path: Path) -> None:
    import sqlite3

    db = tmp_path / "run.sqlite"
    start(db)
    for worker in ("finished", "unknown"):
        assert call(db, "launch", "run-a", worker, "1", "0", "spec-v1", "plan-v1").returncode == 0
    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO dispatch_policies VALUES('run-a',?)", (json.dumps({"unmetered": True}),)
        )
        conn.execute(
            "INSERT INTO events VALUES('run-a','observed:finished','worker-result',?,0)",
            (json.dumps({"returncode": 125}),),
        )
    assert json.loads(call(db, "recover", "run-a").stdout) == {
        "settled": ["finished"],
        "awaiting_terminal_evidence": ["unknown"],
    }
    assert json.loads(call(db, "recover", "run-a").stdout)["settled"] == []
    assert call(db, "accept", "run-a", "finished", "1").returncode == 2


def test_merge_receipt_binds_accepted_tree_and_target(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.chdir(tmp_path)

    def git(*args: str) -> str:
        return subprocess.check_output(
            ["git", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", *args],
            text=True,
        ).strip()

    git("init", "-q")
    git("commit", "--allow-empty", "-qm", "candidate")
    candidate = git("rev-parse", "HEAD")
    git("commit", "--allow-empty", "-qm", "merged with identical tree")
    merged = git("rev-parse", "HEAD")
    target = "refs/remotes/origin/test-target"
    git("update-ref", target, merged)
    db = tmp_path / "run.sqlite"
    start(db)
    assert call(db, "launch", "run-a", "w", "1", "0", "spec-v1", "plan-v1").returncode == 0
    assert call(db, "settle", "run-a", "w", "0").returncode == 0
    assert call(db, "accept", "run-a", "w", "1", "--candidate", candidate).returncode == 0
    args = ("merged", "run-a", "w", candidate, merged, target)
    assert call(db, *args).returncode == call(db, *args).returncode == 0
    Path("app.txt").write_text("difference")
    git("add", "app.txt")
    git("commit", "-qm", "changed tree")
    assert (
        call(db, "merged", "run-a", "w", candidate, git("rev-parse", "HEAD"), target).returncode
        == 2
    )


def test_native_policy_enforces_subscription_and_medium_effort(tmp_path: Path) -> None:
    import argparse
    import hashlib

    import pytest

    from tools.dev_ledger import approved_policy

    path = tmp_path / "policy.json"
    policy = {"client": "codex", "max_attempt_seconds": 60}

    def approve(model: str, effort: str, unmetered: bool = True) -> str | None:
        policy["unmetered"] = unmetered
        path.write_text(json.dumps({**policy, "routes": [{"model": model, "effort": effort}]}))
        return approved_policy(
            argparse.Namespace(
                dispatch_policy=path, shown_policy=hashlib.sha256(path.read_bytes()).hexdigest()
            )
        )

    for model in ("gpt-6.2-astra", "claude-fable-5-2", "Fable"):
        assert approve(model, "medium") is not None
        for effort in ("high", "xhigh", "max", "ultra"):
            with pytest.raises(ValueError, match="medium for Astra and Fable"):
                approve(model, effort)
    assert approve("gpt-6-luna", "low") is not None
    policy["client"] = "gemini"
    assert approve("gemini-4-neon", "high") is not None
    assert approve("gemini-pro", "medium") is not None
    assert approve("gemini-flash", "low") is not None
    policy["client"] = "codex"
    with pytest.raises(ValueError, match="subscription client"):
        approve("gpt-6.2-astra", "medium", unmetered=False)


def test_redirect_carries_only_reviewed_work_across_each_revision(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    for ident in ("source", "model"):
        assert call(db, "launch", "run-a", ident, "1", "5", "spec-v1", "plan-v1").returncode == 0
    reviewed = {"reason": "Source assumptions still hold", "revalidated_attempts": ["source"]}
    assert call(db, "decision", "run-a", "D-1", "1", json.dumps(reviewed)).returncode == 0
    for ident in ("source", "model"):
        assert call(db, "settle", "run-a", ident, "3").returncode == 0
    for invalid in (["source", "model"], ["source", "unknown"], ["source", "source"]):
        payload = json.dumps({**reviewed, "revalidated_attempts": invalid})
        assert call(db, "decision", "run-a", "D-2", "2", payload).returncode == 2
    assert call(db, "decision", "run-a", "D-2", "2", json.dumps(reviewed)).returncode == 0
    assert call(db, "accept", "run-a", "source", "2").returncode == 2
    assert call(db, "accept", "run-a", "model", "3").returncode == 2
    assert call(db, "accept", "run-a", "source", "3").returncode == 0
    status = json.loads(call(db, "status", "run-a").stdout)
    assert {attempt["revision"] for attempt in status["attempts"]} == {1}


def test_revalidation_requires_redirect_evidence_and_cannot_survive_pause(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    assert call(db, "launch", "run-a", "w", "1", "0", "spec-v1", "plan-v1").returncode == 0
    ids = {"revalidated_attempts": ["w"]}
    reviewed = {**ids, "reason": "The same date still applies"}
    assert call(db, "decision", "run-a", "D-1", "1", json.dumps(ids)).returncode == 2
    assert call(db, "note", "run-a", "D-1", "1", json.dumps(reviewed)).returncode == 2
    pause = json.dumps({**reviewed, "action": "pause"})
    assert call(db, "decision", "run-a", "D-1", "1", pause).returncode == 2
    assert call(db, "decision", "run-a", "D-1", "1", json.dumps(reviewed)).returncode == 0
    assert call(db, "decision", "run-a", "D-2", "2", '{"action":"pause"}').returncode == 0
    assert call(db, "settle", "run-a", "w", "0").returncode == 0
    assert call(db, "decision", "run-a", "D-3", "3", '{"action":"resume"}').returncode == 0
    assert call(db, "accept", "run-a", "w", "4").returncode == 2


def test_competing_redirects_revalidate_only_the_winning_scope(tmp_path: Path) -> None:
    db = tmp_path / "run.sqlite"
    start(db)
    for ident in ("a", "b"):
        assert call(db, "launch", "run-a", ident, "1", "1", "spec-v1", "plan-v1").returncode == 0

    def redirect(ident: str) -> int:
        payload = json.dumps({"reason": "Checked dependencies", "revalidated_attempts": [ident]})
        return call(db, "decision", "run-a", f"D-{ident}", "1", payload).returncode

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(redirect, ("a", "b")))
    assert sorted(outcomes) == [0, 2]
    for ident, result in zip(("a", "b"), outcomes, strict=True):
        assert call(db, "settle", "run-a", ident, "1").returncode == 0
        assert call(db, "accept", "run-a", ident, "2").returncode == result
