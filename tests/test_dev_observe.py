from __future__ import annotations

import hashlib
import json
import time
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace

import pytest

from tools.dev_ledger import connect as connect_ledger
from tools.dev_ledger import decision_run, start_run
from tools.dev_observe import (
    Cohort,
    ReviewEvent,
    RoutePolicy,
    apply_completed_reviews,
    assess,
    evidence_file,
    ingest,
    open_db,
)
from tools.dev_route import (
    Route,
    canary_attempt_key,
    claim_canary,
    connect_registry,
    owner_route,
    resolve_route,
    select_route,
)

COHORT = Cohort(
    client="codex",
    environment="local",
    role="builder",
    task_family="parser-fixes",
    risk="low",
    policy_epoch="1",
    scoring_protocol="frozen-oracle-1",
)
OTHER = COHORT.model_copy(update={"task_family": "docs-fixes"})
INCUMBENT = {"model": "gpt-6-luna", "effort": "medium"}
CHALLENGER = {"model": "gpt-6-luna", "effort": "high"}


def make_event(root: Path, *, task: str, event_id: str, **changes: object) -> ReviewEvent:
    evidence = root / f"{event_id}.txt"
    evidence.parent.mkdir(parents=True, exist_ok=True)
    evidence.write_text(f"immutable evidence {event_id}")
    values: dict[str, object] = {
        "event_id": event_id,
        "task_id": task,
        "attempt_id": f"attempt-{event_id}",
        "run_id": "run-1",
        "cohort": COHORT,
        "spec_revision": "spec-1",
        "brief_revision": "brief-1",
        "route_requested_model": INCUMBENT["model"],
        "route_requested_effort": INCUMBENT["effort"],
        "route_resolved_model": INCUMBENT["model"],
        "route_resolved_effort": INCUMBENT["effort"],
        "route_evidence": "worker-ledger",
        "skill_version": "skill-1",
        "reviewer": "reviewer-1",
        "verifier": "verifier-1",
        "candidate_sha": "a" * 40,
        "evidence_path": evidence.name,
        "evidence_sha256": hashlib.sha256(evidence.read_bytes()).hexdigest(),
        "event_time": datetime.now(UTC),
        "cause": "clean",
        "first_grade": "Perfect",
        "final_grade": "Perfect",
        "severity": "clear",
        "independent_confirmed": True,
        "accepted": True,
        "gates_passed": True,
        "accepted_seconds": 60,
        "queue_seconds": 5,
        "active_seconds": 30,
        "review_seconds": 10,
        "rework_seconds": 0,
        "human_wait_seconds": 0,
        "tokens": 1000,
        "cost_units": 0,
    }
    values.update(changes)
    return ReviewEvent.model_validate(values)


def approved_policy(db_path: Path, *, cap: int = 0) -> RoutePolicy:
    dispatch_policy = json.dumps(
        {
            "client": "codex",
            "routes": [INCUMBENT, CHALLENGER],
            "max_attempt_seconds": 100,
            "unmetered": True,
        }
    )
    with connect_ledger(db_path) as ledger:
        start_run(
            ledger,
            SimpleNamespace(
                run="run-1",
                spec="spec-sha",
                plan="plan-sha",
                cap=cap,
                workers=2,
                deadline=int(time.time()) + 3600,
                policy=dispatch_policy,
            ),
        )
        decision_run(
            ledger,
            SimpleNamespace(
                run="run-1",
                id="D-APPROVE-ROUTE",
                expected_revision=1,
                payload=json.dumps(
                    {
                        "action": "approve-route-policy",
                        "cohort": COHORT.model_dump(mode="json"),
                        "incumbent": INCUMBENT,
                        "challenger": CHALLENGER,
                    }
                ),
            ),
        )
    return RoutePolicy(
        run_id="run-1",
        approval_decision_id="D-APPROVE-ROUTE",
        cohort=COHORT,
        incumbent=Route(**INCUMBENT),
        challenger=Route(**CHALLENGER),
    )


def seed_worker_ledger(db_path: Path, event: ReviewEvent, *, merged: bool = False) -> None:
    with connect_ledger(db_path) as ledger:
        route = json.dumps(
            {
                "decision_id": "D-ROUTE-TEST",
                "model": event.route_resolved_model,
                "effort": event.route_resolved_effort,
                "client": event.cohort.client,
            }
        )
        observation = json.dumps(
            {
                "returncode": 0,
                "requested_model": event.route_requested_model,
                "observed_model": event.route_resolved_model,
                "requested_effort": event.route_requested_effort,
                "observed_effort": event.route_resolved_effort,
                "elapsed_seconds": event.accepted_seconds,
            }
        )
        started = int(time.time()) - 60
        accepted = started + (event.accepted_seconds or 60)
        for suffix, kind, payload, timestamp in (
            ("launch", "launch", "{}", started),
            ("route", "route", route, started),
            ("observed", "worker-result", observation, accepted),
            ("accept", "accept", "{}", accepted),
        ):
            ledger.execute(
                "INSERT INTO events VALUES(?,?,?,?,?)",
                (event.run_id, f"{suffix}:{event.attempt_id}", kind, payload, timestamp),
            )
        ledger.execute(
            "INSERT INTO attempts VALUES(?,?,?,?,?,?)",
            (event.run_id, event.attempt_id, 1, "accepted", 0, 0),
        )
        if merged:
            ledger.execute(
                "INSERT INTO events VALUES(?,?,?,?,?)",
                (
                    event.run_id,
                    f"merged:{event.attempt_id}",
                    "merged",
                    json.dumps(
                        {
                            "candidate_sha": event.candidate_sha,
                            "merged_sha": event.merged_sha,
                        }
                    ),
                    accepted + 1,
                ),
            )


def add_trial(
    db,
    root: Path,
    db_path: Path,
    stages: tuple[str, ...] = (
        "baseline",
        "incumbent_replay",
        "challenger_replay",
        "canary",
    ),
) -> list[ReviewEvent]:
    stage_counts = {
        "baseline": (10, INCUMBENT, 4),
        "incumbent_replay": (6, INCUMBENT, 4),
        "challenger_replay": (6, CHALLENGER, 1),
        "canary": (5, CHALLENGER, 0),
    }
    events: list[ReviewEvent] = []
    for stage, (count, route, defects) in stage_counts.items():
        if stage not in stages:
            continue
        for index in range(count):
            task = (
                f"baseline-{index}"
                if stage == "baseline"
                else f"canary-task-{index}"
                if stage == "canary"
                else f"replay-{index}"
            )
            serious = index < defects
            item = make_event(
                root,
                task=task,
                event_id=f"{stage}-{index}",
                route_requested_model=route["model"],
                route_requested_effort=route["effort"],
                route_resolved_model=route["model"],
                route_resolved_effort=route["effort"],
                trial_id="trial-1",
                trial_stage=stage,
                fixture=f"fixture-{task}",
                attempt_id=f"attempt-{stage}-{index}",
                route_evidence="worker-ledger" if stage == "canary" else "retained-trial",
                cause="implementation" if serious else "clean",
                first_grade="Bad" if serious else "Perfect",
                final_grade="Bad" if serious else "Perfect",
                severity="M" if serious else "clear",
                cost_units=0,
            )
            ingest(db, item, evidence_file(root, item))
            if stage == "canary":
                seed_worker_ledger(db_path, item)
            events.append(item)
    return events


def test_record_is_idempotent_and_conflict_or_changed_source_fails(tmp_path: Path) -> None:
    root = tmp_path / "evidence"
    db = open_db(tmp_path / "dev.sqlite")
    item = make_event(root, task="task-1", event_id="event-1")
    source = evidence_file(root, item)
    assert ingest(db, item, source) == "recorded"
    assert ingest(db, item, source) == "duplicate"
    changed = item.model_copy(update={"accepted_seconds": 61})
    with pytest.raises(ValueError, match="different contents"):
        ingest(db, changed, source)
    source.write_text("tampered")
    with pytest.raises(ValueError, match="does not match"):
        evidence_file(root, item)


def test_sparse_unresolved_and_mixed_observations_hold_routing(tmp_path: Path) -> None:
    root = tmp_path / "evidence"
    db_path = tmp_path / "dev.sqlite"
    db = open_db(db_path)
    approved_policy(db_path)
    for index in range(10):
        item = make_event(
            root,
            task=f"task-{index}",
            event_id=f"event-{index}",
            route_resolved_model=None if index == 0 else INCUMBENT["model"],
            route_resolved_effort=None if index == 0 else INCUMBENT["effort"],
            cause="mixed" if index == 1 else ("implementation" if index < 5 else "clean"),
            first_grade="Bad" if index < 5 else "Perfect",
            final_grade="Bad" if index < 5 else "Perfect",
            severity="M" if index < 5 else "clear",
            independent_confirmed=index not in {0, 1},
            route_evidence="unverified" if index == 0 else "worker-ledger",
        )
        ingest(db, item, evidence_file(root, item))
        if index != 0:
            seed_worker_ledger(db_path, item)
    report = assess(db, COHORT, root)
    assert report["eligible_first_reviews"] == 8
    assert report["ungraded_or_unresolved"] == 2
    assert report["implementation_HM"] == 3
    assert report["recommendation"] == "hold-incomplete-evidence"
    assert report["applies_route"] is False


def test_brief_failures_are_not_attributed_to_model(tmp_path: Path) -> None:
    root = tmp_path / "evidence"
    db_path = tmp_path / "dev.sqlite"
    db = open_db(db_path)
    approved_policy(db_path)
    for index in range(10):
        cause = "brief" if index < 4 else "clean"
        item = make_event(
            root,
            task=f"task-{index}",
            event_id=f"event-{index}",
            cause=cause,
            first_grade="Bad" if index < 4 else "Perfect",
            final_grade="Bad" if index < 4 else "Perfect",
            severity="M" if index < 4 else "clear",
        )
        ingest(db, item, evidence_file(root, item))
        seed_worker_ledger(db_path, item)
    report = assess(db, COHORT, root)
    assert report["causes"]["brief"] == 4
    assert report["implementation_HM"] == 0
    assert report["recommendation"] == "retain-incumbent"


def test_approved_trial_starts_canary_promotes_and_owner_can_reverse(tmp_path: Path) -> None:
    root = tmp_path / "evidence"
    db_path = tmp_path / "dev.sqlite"
    db = open_db(db_path)
    policy = approved_policy(db_path)
    registry = db_path
    add_trial(db, root, db_path, stages=("baseline", "incumbent_replay", "challenger_replay"))

    notices = apply_completed_reviews(db, registry, root, policy)
    assert len(notices) == 1
    assert "Five low-risk tasks" in notices[0]
    assert apply_completed_reviews(db, registry, root, policy) == []
    active = resolve_route(registry, COHORT)
    assert active["route"] == INCUMBENT
    assert active["canary_route"] == CHALLENGER

    with connect_registry(registry) as route_db:
        for index in range(5):
            route_db.execute("BEGIN IMMEDIATE")
            claim_canary(
                route_db,
                COHORT,
                canary_attempt_key("run-1", f"attempt-canary-{index}"),
            )
            route_db.commit()
    add_trial(db, root, db_path, stages=("canary",))
    notices = apply_completed_reviews(db, registry, root, policy)
    assert len(notices) == 1
    assert "passed the verified canary" in notices[0]
    assert resolve_route(registry, COHORT)["route"] == CHALLENGER
    assert apply_completed_reviews(db, registry, root, policy) == []
    with connect_registry(registry) as route_db:
        assert select_route(route_db, COHORT, Route(**INCUMBENT)) == Route(**CHALLENGER)

    owner_route(
        registry,
        _write_json(tmp_path / "cohort.json", COHORT.model_dump(mode="json")),
        _write_json(tmp_path / "route.json", INCUMBENT),
        "D-OWNER-1",
        "Restore after comparing the next cycle",
    )
    assert resolve_route(registry, COHORT)["route"] == INCUMBENT
    with connect_registry(registry) as route_db:
        assert select_route(route_db, COHORT, Route(**CHALLENGER)) == Route(**INCUMBENT)
    with pytest.raises(ValueError, match="no qualified route"):
        resolve_route(registry, OTHER)


def test_owner_decision_is_required_and_zero_cost_trial_is_allowed(tmp_path: Path) -> None:
    root = tmp_path / "evidence"
    db_path = tmp_path / "dev.sqlite"
    db = open_db(db_path)
    add_trial(db, root, db_path, stages=("baseline", "incumbent_replay", "challenger_replay"))
    registry = db_path
    policy = RoutePolicy(
        run_id="run-1",
        approval_decision_id="missing",
        cohort=COHORT,
        incumbent=Route(**INCUMBENT),
        challenger=Route(**CHALLENGER),
    )
    with connect_ledger(db_path):
        pass
    with pytest.raises(Exception, match="no active approved coordinator run"):
        apply_completed_reviews(db, registry, root, policy)
    approved = approved_policy(db_path, cap=0)
    notices = apply_completed_reviews(db, registry, root, approved)
    assert len(notices) == 1
    assert resolve_route(registry, COHORT)["canary_route"] == CHALLENGER


def test_only_verified_high_escape_reverses_promoted_route(tmp_path: Path) -> None:
    root = tmp_path / "evidence"
    db_path = tmp_path / "dev.sqlite"
    db = open_db(db_path)
    policy = approved_policy(db_path)
    registry = db_path
    add_trial(db, root, db_path, stages=("baseline", "incumbent_replay", "challenger_replay"))
    apply_completed_reviews(db, registry, root, policy)
    with connect_registry(registry) as route_db:
        for index in range(5):
            route_db.execute("BEGIN IMMEDIATE")
            claim_canary(
                route_db,
                COHORT,
                canary_attempt_key("run-1", f"attempt-canary-{index}"),
            )
            route_db.commit()
    add_trial(db, root, db_path, stages=("canary",))
    apply_completed_reviews(db, registry, root, policy)
    assert resolve_route(registry, COHORT)["route"] == CHALLENGER

    def record_escape(event_id: str, *, seed_ledger: bool) -> tuple[ReviewEvent, Path]:
        event = make_event(
            root,
            task=f"task-{event_id}",
            event_id=event_id,
            route_requested_model=CHALLENGER["model"],
            route_requested_effort=CHALLENGER["effort"],
            route_resolved_model=CHALLENGER["model"],
            route_resolved_effort=CHALLENGER["effort"],
            route_evidence="worker-ledger",
            cause="implementation",
            first_grade="Bad",
            final_grade="Bad",
            severity="H",
            linked_high_escape=True,
            merged_sha="b" * 40,
        )
        source = evidence_file(root, event)
        if seed_ledger:
            seed_worker_ledger(db_path, event, merged=True)
        ingest(db, event, source)
        return event, source

    record_escape("unverified-high", seed_ledger=False)
    apply_completed_reviews(db, registry, root, policy)
    assert resolve_route(registry, COHORT)["route"] == CHALLENGER

    _, changed_source = record_escape("tampered-high", seed_ledger=True)
    changed_source.write_text("changed after ingestion")
    apply_completed_reviews(db, registry, root, policy)
    assert resolve_route(registry, COHORT)["route"] == CHALLENGER

    record_escape("confirmed-high", seed_ledger=True)
    notices = apply_completed_reviews(db, registry, root, policy)
    assert any("verified High escaped" in message for message in notices)
    assert resolve_route(registry, COHORT)["route"] == INCUMBENT


def _write_json(path: Path, value: object) -> Path:
    path.write_text(json.dumps(value))
    return path
