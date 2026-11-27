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
