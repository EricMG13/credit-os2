import hashlib
import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor

import pytest
from pydantic import ValidationError

from tools.dev_route import (
    Trial,
    apply_trial,
    assess,
    canary_attempt_key,
    claim_canary,
    connect_registry,
    explain_route,
    main,
    owner_route,
    resolve_route,
    rollback_route,
)

INCUMBENT = {"model": "gpt-6-luna", "effort": "medium"}
CHALLENGER = {"model": "gpt-6-luna", "effort": "high"}
COHORT = {
    "client": "codex",
    "environment": "local",
    "role": "builder",
    "task_family": "parser-fixes",
    "risk": "low",
    "policy_epoch": "1",
    "scoring_protocol": "frozen-oracle-1",
}


def batch(prefix, count, route, defects=0):
    return [
        {
            "task": f"{prefix}-{index}",
            "run": "run-1",
            "attempt": f"attempt-{prefix}-{index}",
            "fixture": f"{prefix}-{index}-v1",
            "cohort": COHORT,
            "evidence": f"artifact/{prefix}-{index}/{route['effort']}",
            "route": route,
            "severity": "M" if index < defects else "clear",
            "cause": "implementation" if index < defects else "clean",
            "accepted_seconds": 60,
            "gates": True,
            "cost_units": 100,
        }
        for index in range(count)
    ]


def pilot():
    return {
        "cohort": COHORT,
        "incumbent": INCUMBENT,
        "challenger": CHALLENGER,
        "max_trial_cost_units": 2000,
        "attempt_deadline_seconds": 100,
        "baseline": batch("baseline", 10, INCUMBENT, 4),
        "incumbent_replay": batch("replay", 6, INCUMBENT, 4),
        "challenger_replay": batch("replay", 6, CHALLENGER, 1),
        "canary": batch("canary", 5, CHALLENGER),
    }


def decision(record):
    return assess(Trial.model_validate_json(json.dumps(record)))


def test_promotes_only_after_full_eligible_trial():
    record = pilot()
    assert decision(record) == "eligible-to-promote"
    record["canary"].pop()
    assert decision(record) == "continue-canary"


def test_timeouts_cannot_select_the_challenger():
    record = pilot()
    for task in record["challenger_replay"][2:]:
        task.update(accepted_seconds=None, severity=None, cause="unknown", gates=False)
    assert decision(record) == "hold-replay"


def test_mixed_or_missing_route_stops_inference():
    record = pilot()
    record["baseline"][0]["route"] = None
    assert decision(record) == "hold-incomplete-baseline"
    record["baseline"][0]["route"] = INCUMBENT
    record["baseline"][0]["cause"] = "mixed"
    assert decision(record) == "hold-incomplete-baseline"


def test_context_errors_are_not_model_defects():
    record = pilot()
    for task in record["baseline"][:3]:
        task["cause"] = "brief"
    assert decision(record) == "retain-incumbent"


@pytest.mark.parametrize("failure", ["severity", "budget", "speed", "escape"])
def test_failed_canary_restores_incumbent(failure):
    record = pilot()
    if failure == "severity":
        record["canary"][0].update(severity="M", cause="implementation")
    elif failure == "budget":
        record["max_trial_cost_units"] = 1600
    elif failure == "speed":
        for item in record["canary"]:
            item["accepted_seconds"] = 73
    else:
        record["high_escape"] = True
    assert decision(record) == "restore-incumbent"


def test_duplicate_attempts_and_changed_fixtures_cannot_manufacture_evidence():
    record = pilot()
    record["challenger_replay"][0]["fixture"] = "revised"
    assert decision(record) == "hold-replay"
    record["challenger_replay"][0]["task"] = record["challenger_replay"][1]["task"]
    with pytest.raises(ValidationError, match="duplicate task"):
        decision(record)


@pytest.mark.parametrize("field", ["cohort", "evidence"])
def test_trial_requires_comparable_and_distinct_evidence(field):
    record = pilot()
    task = record["canary"][0]
    if field == "cohort":
        task["cohort"] = {**COHORT, "scoring_protocol": "different"}
    else:
        task["evidence"] = record["baseline"][0]["evidence"]
    with pytest.raises(ValidationError):
        decision(record)


def evidence_bundle(tmp_path, record):
    tmp_path.mkdir(parents=True, exist_ok=True)
    trial_path = tmp_path / "trial.json"
    trial_bytes = json.dumps(record).encode()
    trial_path.write_bytes(trial_bytes)
    files = {}
    reviews = (
        record["baseline"]
        + record["incumbent_replay"]
        + record["challenger_replay"]
        + record["canary"]
    )
    evidence_root = tmp_path / "evidence"
    evidence_root.mkdir()
    for index, review in enumerate(reviews):
        relative = f"review-{index}.json"
        content = json.dumps({"review": review, "grader": "independent"}).encode()
        (evidence_root / relative).write_bytes(content)
        files[review["evidence"]] = {
            "path": relative,
            "sha256": hashlib.sha256(content).hexdigest(),
        }
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "trial_sha256": hashlib.sha256(trial_bytes).hexdigest(),
                "files": files,
            }
        )
    )
    return trial_path, manifest_path, evidence_root


def test_qualified_trial_verifies_manifest_and_resolves_route(tmp_path):
    record = pilot()
    record["canary"] = []
    trial_path, manifest, evidence = evidence_bundle(tmp_path, record)
    registry = tmp_path / "registry.sqlite"
    assert apply_trial(trial_path, manifest, evidence, registry, "canary-1") == "canary-start"
    cohort = Trial.model_validate(record).cohort
    resolved = resolve_route(registry, cohort)
    assert resolved["route"] == INCUMBENT
    assert resolved["canary_pending"] is True
    assert resolved["canary_remaining"] == 5
    for index in range(5):
        with connect_registry(registry) as db:
            db.execute("BEGIN IMMEDIATE")
            claim = claim_canary(db, cohort, canary_attempt_key("run-1", f"attempt-canary-{index}"))
            db.commit()
        assert claim["route"] == CHALLENGER
    with connect_registry(registry) as db:
        db.execute("BEGIN IMMEDIATE")
        replay = claim_canary(db, cohort, canary_attempt_key("run-1", "attempt-canary-0"))
        db.commit()
    assert replay["replayed"] is True
    assert replay["remaining"] == 0
    ordinary = resolve_route(registry, cohort)
    assert ordinary["canary_pending"] is False
    assert ordinary["route"] == INCUMBENT
    assert ordinary["decision_id"].startswith("baseline:")
    with connect_registry(registry) as db:
        db.execute("BEGIN IMMEDIATE")
        with pytest.raises(ValueError, match="no unclaimed bounded canary"):
            claim_canary(db, cohort, "canary-5")
        db.rollback()

    record["canary"] = batch("canary", 5, CHALLENGER)
    trial_path, manifest, evidence = evidence_bundle(tmp_path / "complete", record)
    assert apply_trial(trial_path, manifest, evidence, registry, "promote-1") == "promote"
    resolved = resolve_route(registry, cohort)
    assert resolved["route"] == CHALLENGER
    assert resolved["canary_pending"] is False
    assert resolved["decision_id"] == "promote-1"
    with pytest.raises(ValueError, match="already been applied"):
        apply_trial(trial_path, manifest, evidence, registry, "promote-2")


def test_manifest_rejects_tampering_and_escaping_paths(tmp_path):
    record = pilot()
    trial_path, manifest, evidence = evidence_bundle(tmp_path, record)
    next(evidence.iterdir()).write_text("changed")
    with pytest.raises(ValueError, match="digest mismatch"):
        apply_trial(trial_path, manifest, evidence, tmp_path / "registry.sqlite", "promote")

    nested = tmp_path / "second"
    nested.mkdir()
    (nested / "outside.json").write_text("outside evidence root")
    trial_path, manifest, evidence = evidence_bundle(nested, record)
    manifest_data = json.loads(manifest.read_text())
    reference = next(iter(manifest_data["files"]))
    manifest_data["files"][reference]["path"] = "../outside.json"
    manifest.write_text(json.dumps(manifest_data))
    with pytest.raises((ValidationError, ValueError)):
        apply_trial(trial_path, manifest, evidence, tmp_path / "registry.sqlite", "escape")


def test_owner_override_and_rollback_are_audited(tmp_path):
    cohort_path = tmp_path / "cohort.json"
    cohort_path.write_text(json.dumps(COHORT))
    route_path = tmp_path / "route.json"
    route_path.write_text(json.dumps(INCUMBENT))
    registry = tmp_path / "registry.sqlite"
    owner_route(registry, cohort_path, route_path, "owner-1", "restore baseline")
    route_path.write_text(json.dumps(CHALLENGER))
    owner_route(registry, cohort_path, route_path, "owner-2", "try higher effort")
    rollback_route(registry, cohort_path, "rollback-1", "regression observed")
    rollback_route(registry, cohort_path, "rollback-1", "regression observed")
    resolved = resolve_route(registry, Trial.model_validate(pilot()).cohort)
    assert resolved["route"] == INCUMBENT
    assert resolved["decision_id"] == "rollback-1"
    with connect_registry(registry) as db:
        events = db.execute("SELECT action, reason FROM route_events ORDER BY rowid").fetchall()
    assert [row["action"] for row in events] == ["owner-override", "owner-override", "rollback"]
    explanation = explain_route(registry, "owner-2")
    assert explanation["previous"] == INCUMBENT
    assert explanation["selected"] == CHALLENGER
    assert explanation["reason"] == "try higher effort"


def test_unknown_cohort_fails_closed_and_changed_decision_id_rejected(tmp_path):
    registry = tmp_path / "registry.sqlite"
    cohort = Trial.model_validate(pilot()).cohort
    with pytest.raises(ValueError, match="no qualified route"):
        resolve_route(registry, cohort)
    cohort_path = tmp_path / "cohort.json"
    cohort_path.write_text(json.dumps(COHORT))
    route_path = tmp_path / "route.json"
    route_path.write_text(json.dumps(INCUMBENT))
    owner_route(registry, cohort_path, route_path, "owner-1", "initial")
    route_path.write_text(json.dumps(CHALLENGER))
    with pytest.raises(ValueError, match="different route evidence"):
        owner_route(registry, cohort_path, route_path, "owner-1", "changed")


def test_failed_canary_restores_only_the_active_challenger(tmp_path):
    record = pilot()
    record["canary"] = []
    trial_path, manifest, evidence = evidence_bundle(tmp_path, record)
    registry = tmp_path / "registry.sqlite"
    apply_trial(trial_path, manifest, evidence, registry, "canary-start")
    cohort = Trial.model_validate(record).cohort
    with connect_registry(registry) as db:
        db.execute("BEGIN IMMEDIATE")
        claim_canary(db, cohort, canary_attempt_key("run-1", "attempt-canary-0"))
        db.commit()

    failed = pilot()
    failed["canary"] = batch("canary", 1, CHALLENGER, defects=1)
    failed["canary"][0].update(severity="H", cause="implementation")
    trial_path, manifest, evidence = evidence_bundle(tmp_path / "failed", failed)
    assert assess(Trial.model_validate(failed)) == "restore-incumbent"
    assert apply_trial(trial_path, manifest, evidence, registry, "restore") == "canary-rollback"
    resolved = resolve_route(registry, Trial.model_validate(failed).cohort)
    assert resolved["route"] == INCUMBENT
    assert resolved["canary_pending"] is False
    failed["high_escape"] = True
    trial_path, manifest, evidence = evidence_bundle(tmp_path / "failed-again", failed)
    with pytest.raises(ValueError, match="does not match the active canary or promotion"):
        apply_trial(trial_path, manifest, evidence, registry, "restore-again")


def test_zero_budget_allows_unmetered_trials_but_rejects_any_spend():
    record = pilot()
    record["max_trial_cost_units"] = 0
    for group in (
        record["baseline"],
        record["incumbent_replay"],
        record["challenger_replay"],
        record["canary"],
    ):
        for review in group:
            review["cost_units"] = 0
    assert decision(record) == "eligible-to-promote"
    record["challenger_replay"][0]["cost_units"] = 1
    assert decision(record) == "restore-incumbent"


def test_legacy_positional_trial_cli_remains_supported(tmp_path, monkeypatch, capsys):
    record = pilot()
    record["canary"] = []
    trial_path = tmp_path / "trial.json"
    trial_path.write_text(json.dumps(record))
    monkeypatch.setattr("sys.argv", ["dev_route.py", str(trial_path)])
    assert main() == 0
    assert json.loads(capsys.readouterr().out)["decision"] == "start-canary"


def test_concurrent_canary_claims_cannot_exceed_five_slots(tmp_path):
    record = pilot()
    record["canary"] = []
    trial_path, manifest, evidence = evidence_bundle(tmp_path, record)
    registry = tmp_path / "registry.sqlite"
    apply_trial(trial_path, manifest, evidence, registry, "canary-start")
    cohort = Trial.model_validate(record).cohort

    def claim(index):
        with connect_registry(registry) as db:
            db.execute("BEGIN IMMEDIATE")
            result = claim_canary(db, cohort, f"concurrent-{index}")
            db.commit()
            return result

    with ThreadPoolExecutor(max_workers=5) as workers:
        results = list(workers.map(claim, range(5)))
    assert len({result["route"]["effort"] for result in results}) == 1
    resolved = resolve_route(registry, cohort)
    assert resolved["canary_remaining"] == 0


def test_existing_route_registry_gains_canary_columns(tmp_path):
    registry = tmp_path / "existing.sqlite"
    with sqlite3.connect(registry) as db:
        db.executescript(
            """
            CREATE TABLE active_routes (
                cohort TEXT PRIMARY KEY, cohort_json TEXT NOT NULL, model TEXT NOT NULL,
                effort TEXT NOT NULL, policy_epoch TEXT NOT NULL, updated INTEGER NOT NULL
            );
            CREATE TABLE route_events (
                decision_id TEXT PRIMARY KEY, cohort TEXT NOT NULL, action TEXT NOT NULL,
                previous TEXT, selected TEXT NOT NULL, reason TEXT NOT NULL,
                created INTEGER NOT NULL
            );
            """
        )
    with connect_registry(registry) as db:
        names = {row["name"] for row in db.execute("PRAGMA table_info(active_routes)")}
        assert {"canary_model", "canary_effort", "canary_remaining"} <= names
