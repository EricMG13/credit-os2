"""Ingest completed, independently reviewed builder outcomes and assess a cohort."""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, PositiveInt, ValidationError, model_validator

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.dev_ledger import valid_route
from tools.dev_route import (
    AuthorizedRegistry,
    Cohort,
    Route,
    Trial,
    apply_trial,
    canary_attempt_key,
    cohort_key,
    connect_registry,
    resolve_route,
    resolve_route_db,
    rollback_route,
)
from tools.dev_route import (
    assess as assess_trial,
)


class ReviewEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, str_strip_whitespace=True)

    event_id: str = Field(min_length=1)
    task_id: str = Field(min_length=1)
    attempt_id: str = Field(min_length=1)
    run_id: str = Field(min_length=1)
    trial_id: str | None = None
    trial_stage: Literal["baseline", "incumbent_replay", "challenger_replay", "canary"] | None = (
        None
    )
    fixture: str | None = None
    first_review: bool = True
    cohort: Cohort
    spec_revision: str = Field(min_length=1)
    brief_revision: str = Field(min_length=1)
    route_requested_model: str = Field(min_length=1)
    route_requested_effort: str = Field(min_length=1)
    route_resolved_model: str | None = Field(default=None, min_length=1)
    route_resolved_effort: str | None = Field(default=None, min_length=1)
    route_evidence: Literal["worker-ledger", "retained-trial", "unverified"] = "unverified"
    skill_version: str = Field(min_length=1)
    reviewer: str = Field(min_length=1)
    verifier: str = Field(min_length=1)
    candidate_sha: str = Field(pattern=r"^[0-9a-f]{40,64}$")
    merged_sha: str | None = Field(default=None, pattern=r"^[0-9a-f]{40,64}$")
    linked_high_escape: bool = False
    evidence_path: str = Field(min_length=1)
    evidence_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    event_time: datetime
    cause: Literal["implementation", "brief", "process", "mixed", "unknown", "clean"]
    first_grade: Literal["Perfect", "Good", "Bad", "Ungraded"]
    final_grade: Literal["Perfect", "Good", "Bad", "Ungraded"]
    severity: Literal["H", "M", "L", "clear"] | None
    independent_confirmed: bool
    accepted: bool
    gates_passed: bool
    accepted_seconds: PositiveInt | None
    queue_seconds: int | None = Field(default=None, ge=0)
    active_seconds: int | None = Field(default=None, ge=0)
    review_seconds: int | None = Field(default=None, ge=0)
    rework_seconds: int | None = Field(default=None, ge=0)
    human_wait_seconds: int | None = Field(default=None, ge=0)
    tokens: int | None = Field(default=None, ge=0)
    cost_units: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def grade_agrees_with_severity(self) -> ReviewEvent:
        if (self.trial_id is None) != (self.trial_stage is None):
            raise ValueError("trial ID and stage must be supplied together")
        if self.trial_id is not None and self.fixture is None:
            raise ValueError("trial reviews require a fixture identity")
        if self.route_evidence == "retained-trial" and self.trial_id is None:
            raise ValueError("retained trial route evidence requires a trial identity")
        if self.severity == "H" and self.first_grade != "Bad":
            raise ValueError("High findings require a Bad first grade")
        if self.severity == "M" and self.first_grade != "Bad":
            raise ValueError("Medium findings require a Bad first grade")
        if self.severity == "L" and self.first_grade not in {"Good", "Bad"}:
            raise ValueError("Low findings require a Good or Bad first grade")
        if self.severity == "clear" and self.first_grade != "Perfect":
            raise ValueError("clear outcomes require a Perfect first grade")
        if self.cause == "clean" and self.severity != "clear":
            raise ValueError("clean cause requires clear severity")
        if self.cause in {"mixed", "unknown"} and self.independent_confirmed:
            raise ValueError("mixed or unknown cause cannot be independently confirmed")
        if self.linked_high_escape and not (
            self.merged_sha
            and self.independent_confirmed
            and self.cause == "implementation"
            and self.severity == "H"
            and self.route_evidence == "worker-ledger"
            and self.accepted
            and self.route_resolved_model
            and self.route_resolved_effort
        ):
            raise ValueError(
                "a linked High escape requires merged SHA and verified route attribution"
            )
        return self

    @property
    def eligible(self) -> bool:
        return (
            self.accepted
            and self.gates_passed
            and (self.accepted_seconds is not None or self.route_evidence == "worker-ledger")
            and self.first_grade != "Ungraded"
            and self.final_grade != "Ungraded"
            and self.cause not in {"mixed", "unknown"}
            and self.independent_confirmed
            and self.route_evidence != "unverified"
            and (self.route_evidence != "retained-trial" or self.trial_id is not None)
            and self.route_requested_model == self.route_resolved_model
            and self.route_requested_effort == self.route_resolved_effort
        )

    @property
    def serious_implementation_finding(self) -> bool:
        return self.eligible and self.cause == "implementation" and self.severity in {"H", "M"}


class RoutePolicy(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    run_id: str = Field(min_length=1)
    approval_decision_id: str = Field(min_length=1)
    cohort: Cohort
    incumbent: Route
    challenger: Route

    @model_validator(mode="after")
    def unique_routes(self) -> RoutePolicy:
        if self.incumbent == self.challenger:
            raise ValueError("incumbent and challenger routes must differ")
        return self


class EffectivePolicy(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    run_id: str
    cohort: Cohort
    incumbent: Route
    challenger: Route
    max_trial_cost_units: int = Field(ge=0)
    attempt_deadline_seconds: PositiveInt


@dataclass(frozen=True)
class ObserverContext:
    registry: Path
    evidence_root: Path
    policy: RoutePolicy
    effective_policy: EffectivePolicy


def approved_route_policy(db: sqlite3.Connection, policy: RoutePolicy) -> EffectivePolicy:
    """Resolve limits and route permissions from the approved coordinator run."""
    run = db.execute(
        """SELECT runs.cap, runs.state, runs.revision, dispatch_policies.policy
           FROM runs JOIN dispatch_policies ON dispatch_policies.run=runs.id
           WHERE runs.id=?""",
        (policy.run_id,),
    ).fetchone()
    if run is None or run["state"] != "approved":
        raise ValueError("route policy has no active approved coordinator run")
    decision = db.execute(
        "SELECT revision, payload FROM decisions WHERE run=? AND id=?",
        (policy.run_id, policy.approval_decision_id),
    ).fetchone()
    if decision is None:
        raise ValueError("route policy lacks an owner-approved coordinator decision")
    if db.execute(
        "SELECT 1 FROM decisions WHERE run=? AND json_extract(payload, '$.supersedes')=? "
        "AND coalesce(json_extract(payload,'$.kind'),'') != 'progress'",
        (policy.run_id, policy.approval_decision_id),
    ).fetchone():
        raise ValueError("route policy approval has been superseded")
    approval = json.loads(decision["payload"])
    expected = {
        "action": "approve-route-policy",
        "cohort": policy.cohort.model_dump(mode="json"),
        "incumbent": policy.incumbent.model_dump(mode="json"),
        "challenger": policy.challenger.model_dump(mode="json"),
    }
    if any(approval.get(key) != value for key, value in expected.items()):
        raise ValueError("route policy differs from the coordinator owner's recorded decision")
    recorded = json.loads(run["policy"])
    if policy.cohort.client != recorded["client"] or recorded.get("unmetered") is not True:
        raise ValueError("route policy client is outside the approved subscription run")
    allowed = {(item["model"], item["effort"]) for item in recorded["routes"]}
    if any(
        (route.model, route.effort) not in allowed or not valid_route(route.model_dump())
        for route in (policy.incumbent, policy.challenger)
    ):
        raise ValueError("route is outside the approved model and effort allowlist")
    return EffectivePolicy(
        run_id=policy.run_id,
        cohort=policy.cohort,
        incumbent=policy.incumbent,
        challenger=policy.challenger,
        max_trial_cost_units=run["cap"],
        attempt_deadline_seconds=recorded["max_attempt_seconds"],
    )


def open_db(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=10, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")
    db.execute(
        """CREATE TABLE IF NOT EXISTS dev_observations (
            event_id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            cohort_key TEXT NOT NULL,
            payload TEXT NOT NULL,
            payload_sha256 TEXT NOT NULL,
            evidence_absolute_path TEXT NOT NULL,
            evidence_sha256 TEXT NOT NULL,
            recorded_at TEXT NOT NULL
        )"""
    )
    db.execute(
        """CREATE TABLE IF NOT EXISTS dev_route_assessments (
            run_id TEXT NOT NULL, trial_id TEXT NOT NULL, status TEXT NOT NULL,
            decision_id TEXT NOT NULL, updated_at TEXT NOT NULL,
            PRIMARY KEY(run_id, trial_id)
        )"""
    )
    db.execute(
        """CREATE TABLE IF NOT EXISTS dev_route_notifications (
            decision_id TEXT PRIMARY KEY, message TEXT NOT NULL, emitted INTEGER NOT NULL DEFAULT 0
        )"""
    )
    db.execute(
        """CREATE TABLE IF NOT EXISTS dev_observation_windows (
            cohort_key TEXT NOT NULL, window_number INTEGER NOT NULL,
            window_digest TEXT NOT NULL, decision_id TEXT NOT NULL,
            status TEXT NOT NULL, PRIMARY KEY(cohort_key,window_number)
        )"""
    )
    db.execute(
        """CREATE TABLE IF NOT EXISTS dev_route_notification_runs (
            decision_id TEXT NOT NULL, run_id TEXT NOT NULL, PRIMARY KEY(decision_id,run_id)
        )"""
    )
    return db


def evidence_file(root: Path, event: ReviewEvent) -> Path:
    base = root.resolve(strict=True)
    resolved = (base / event.evidence_path).resolve(strict=True)
    if not resolved.is_relative_to(base) or not resolved.is_file():
        raise ValueError("evidence must be a regular file inside the evidence root")
    actual = hashlib.sha256(resolved.read_bytes()).hexdigest()
    if actual != event.evidence_sha256:
        raise ValueError("evidence SHA-256 does not match the review event")
    return resolved


def worker_facts(db: sqlite3.Connection, event: ReviewEvent) -> tuple[bool, int | None, int | None]:
    """Confirm resolved route and elapsed time from accepted coordinator ledger events."""
    if event.route_evidence != "worker-ledger":
        return event.route_evidence == "retained-trial", event.accepted_seconds, event.cost_units
    records = {}
    for name, kind in (
        ("launch", "launch"),
        ("route", "route-resolved"),
        ("observed", "worker-result"),
        ("accept", "accept"),
    ):
        row = db.execute(
            "SELECT kind,result,created FROM events WHERE run=? AND id=?",
            (event.run_id, f"{name}:{event.attempt_id}"),
        ).fetchone()
        if row is None or row["kind"] != kind:
            return False, None, None
        records[name] = row
    attempt = db.execute(
        "SELECT state,settled FROM attempts WHERE run=? AND id=?",
        (event.run_id, event.attempt_id),
    ).fetchone()
    route = json.loads(records["route"]["result"])
    observed = json.loads(records["observed"]["result"])
    elapsed = records["accept"]["created"] - records["launch"]["created"]
    identity = {"task": event.task_id, "cohort_key": cohort_key(event.cohort)}
    expected_route = {
        **identity,
        "model": event.route_resolved_model,
        "effort": event.route_resolved_effort,
    }
    expected_observed = {
        **identity,
        "observed_model": event.route_resolved_model,
        "observed_effort": event.route_resolved_effort,
        "requested_model": event.route_requested_model,
        "requested_effort": event.route_requested_effort,
    }
    route_matches = (
        expected_route.items() <= route.items()
        and expected_observed.items() <= observed.items()
        and (event.route_requested_model, event.route_requested_effort)
        == (event.route_resolved_model, event.route_resolved_effort)
        and json.loads(records["accept"]["result"]).get("candidate_sha") == event.candidate_sha
    )
    valid = bool(
        attempt
        and attempt["state"] == "accepted"
        and observed.get("returncode") == 0
        and route_matches
        and elapsed >= 0
    )
    return valid, elapsed, attempt["settled"] if valid else None


def verified_merge(db: sqlite3.Connection, event: ReviewEvent) -> bool:
    row = db.execute(
        "SELECT kind,result FROM events WHERE run=? AND id=?",
        (event.run_id, f"merged:{event.attempt_id}"),
    ).fetchone()
    if row is None or row["kind"] != "merged":
        return False
    merge = json.loads(row["result"])
    return bool(
        merge.get("candidate_sha") == event.candidate_sha
        and merge.get("merged_sha") == event.merged_sha
    )


def valid_canary_claim(registry: Path, event: ReviewEvent, cohort: Cohort) -> bool:
    if event.route_evidence != "worker-ledger":
        return False
    attempt_key = canary_attempt_key(event.run_id, event.attempt_id)
    with connect_registry(registry) as route_db:
        claim = route_db.execute(
            "SELECT decision_id,route FROM canary_claims WHERE cohort=? AND attempt_id=?",
            (cohort_key(cohort), attempt_key),
        ).fetchone()
        if claim is None:
            return False
        start = route_db.execute(
            "SELECT action,selected FROM route_events WHERE cohort=? AND decision_id=?",
            (cohort_key(cohort), claim["decision_id"]),
        ).fetchone()
    route = json.loads(claim["route"])
    return bool(
        start
        and start["action"] == "canary-start"
        and json.loads(start["selected"]) == route
        and route
        == {
            "model": event.route_resolved_model,
            "effort": event.route_resolved_effort,
        }
    )


def ingest(db: sqlite3.Connection, event: ReviewEvent, source: Path) -> str:
    payload = json.dumps(event.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    payload_sha = hashlib.sha256(payload.encode()).hexdigest()
    previous = db.execute(
        "SELECT payload_sha256 FROM dev_observations WHERE event_id=?", (event.event_id,)
    ).fetchone()
    if previous is not None:
        if previous["payload_sha256"] == payload_sha:
            return "duplicate"
        raise ValueError("event ID was already recorded with different contents")
    db.execute("BEGIN IMMEDIATE")
    try:
        db.execute(
            """INSERT INTO dev_observations
               (event_id, task_id, cohort_key, payload, payload_sha256,
                evidence_absolute_path, evidence_sha256, recorded_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                event.event_id,
                event.task_id,
                cohort_key(event.cohort),
                payload,
                payload_sha,
                str(source),
                event.evidence_sha256,
                datetime.now().astimezone().isoformat(),
            ),
        )
        db.commit()
    except sqlite3.IntegrityError as error:
        db.rollback()
        raise ValueError("task already has a first-reviewed observation in this cohort") from error
    return "recorded"


def assess(
    db: sqlite3.Connection,
    cohort: Cohort,
    evidence_root: Path,
    window_number: int | None = None,
) -> dict[str, object]:
    rows = db.execute(
        "SELECT task_id, payload, evidence_absolute_path, evidence_sha256 FROM dev_observations "
        "WHERE cohort_key=? AND json_extract(payload, '$.first_review')=1 "
        "AND json_extract(payload, '$.trial_id') IS NULL "
        "ORDER BY recorded_at, event_id",
        (cohort_key(cohort),),
    ).fetchall()
    first_reviews: dict[str, sqlite3.Row] = {}
    for row in rows:
        first_reviews.setdefault(row["task_id"], row)
    ordered = list(first_reviews.values())
    selected = (
        ordered[-10:]
        if window_number is None
        else ordered[(window_number - 1) * 10 : window_number * 10]
    )
    events = []
    facts: dict[str, tuple[bool, int | None, int | None]] = {}
    invalid_provenance = 0
    reported_causes = []
    for row in selected:
        item = ReviewEvent.model_validate_json(row["payload"])
        events.append(item)
        if not stored_review_evidence(row, evidence_root, item):
            invalid_provenance += 1
            reported_causes.append("unknown")
            facts[item.event_id] = (False, None, None)
            continue
        reported_causes.append(item.cause)
        try:
            facts[item.event_id] = worker_facts(db, item)
        except sqlite3.Error:
            facts[item.event_id] = (False, None, None)
    eligible = [item for item in events if item.eligible and facts[item.event_id][0]]
    implementation = sum(item.serious_implementation_finding for item in eligible)
    causes = {
        cause: reported_causes.count(cause)
        for cause in ("implementation", "brief", "process", "mixed", "unknown", "clean")
    }
    recommendation = _recommendation(len(events), len(eligible), invalid_provenance, implementation)
    costs = [
        facts[item.event_id][2] if item.route_evidence == "worker-ledger" else item.cost_units
        for item in eligible
    ]
    return {
        "cohort": cohort.model_dump(mode="json"),
        "window": 10,
        "observations": len(events),
        "event_ids": [item.event_id for item in events],
        "eligible_first_reviews": len(eligible),
        "ungraded_or_unresolved": len(events) - len(eligible),
        "invalid_provenance": invalid_provenance,
        "implementation_HM": implementation,
        "causes": causes,
        "median_accepted_seconds": _median([facts[item.event_id][1] for item in eligible]),
        "worker_minutes": _known_sum(
            [[item.active_seconds, item.review_seconds, item.rework_seconds] for item in eligible]
        ),
        "owner_wait_minutes": _known_sum([[item.human_wait_seconds] for item in eligible]),
        "known_cost_units": sum(value for value in costs if value is not None),
        "unknown_costs": sum(value is None for value in costs),
        "recommendation": recommendation,
        "applies_route": False,
    }


def export_trial_review(
    db: sqlite3.Connection,
    row: sqlite3.Row,
    evidence_root: Path,
    registry: Path,
    policy: EffectivePolicy,
) -> tuple[dict[str, dict[str, str]], ReviewEvent, dict[str, object]]:
    event = ReviewEvent.model_validate_json(row["payload"])
    if event.trial_stage is None or event.fixture is None or event.trial_id is None:
        raise ValueError("trial event is missing its stage or fixture")
    source = Path(row["evidence_absolute_path"]).resolve(strict=True)
    base = evidence_root.resolve(strict=True)
    if not source.is_relative_to(base) or not source.is_file():
        raise ValueError("trial evidence is outside the evidence root")
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != row["evidence_sha256"] or digest != event.evidence_sha256:
        raise ValueError("trial evidence digest changed after ingestion")
    valid_route, seconds, cost = worker_facts(db, event)
    valid_route = valid_route and event.eligible and event.first_review
    if event.trial_stage == "canary":
        valid_route = valid_route and valid_canary_claim(registry, event, policy.cohort)
    route = None
    if valid_route and event.route_resolved_model and event.route_resolved_effort:
        route = Route(model=event.route_resolved_model, effort=event.route_resolved_effort)
    expected = (
        policy.incumbent
        if event.trial_stage in {"baseline", "incumbent_replay"}
        else policy.challenger
    )
    if route is not None and route != expected:
        raise ValueError("trial event resolved to a route other than its assigned route")
    evidence_ref = f"{event.trial_id}/{event.event_id}"
    review: dict[str, object] = {
        "task": event.task_id,
        "fixture": event.fixture,
        "cohort": event.cohort.model_dump(mode="json"),
        "run": event.run_id if event.trial_stage == "canary" else None,
        "attempt": event.attempt_id if event.trial_stage == "canary" else None,
        "evidence": evidence_ref,
        "route": route.model_dump(mode="json") if route else None,
        "severity": event.severity if valid_route else None,
        "cause": event.cause if valid_route else "unknown",
        "accepted_seconds": seconds if event.accepted else None,
        "gates": event.gates_passed and valid_route,
        "cost_units": cost if event.route_evidence == "worker-ledger" else event.cost_units,
    }
    file = {"path": source.relative_to(base).as_posix(), "sha256": digest}
    return {evidence_ref: file}, event, review


def export_trial(
    db: sqlite3.Connection,
    trial_id: str,
    evidence_root: Path,
    registry: Path,
    policy: EffectivePolicy,
) -> tuple[dict[str, object], dict[str, object]]:
    """Build the route evaluator input and exact evidence manifest."""
    rows = db.execute(
        "SELECT payload, evidence_absolute_path, evidence_sha256 FROM dev_observations "
        "WHERE json_extract(payload, '$.run_id')=? AND cohort_key=? "
        "AND json_extract(payload, '$.trial_id')=? ORDER BY event_id",
        (policy.run_id, cohort_key(policy.cohort), trial_id),
    ).fetchall()
    if not rows:
        raise ValueError("unknown trial")
    groups: dict[str, list[dict[str, object]]] = {
        "baseline": [],
        "incumbent_replay": [],
        "challenger_replay": [],
        "canary": [],
    }
    files: dict[str, dict[str, str]] = {}
    events: list[ReviewEvent] = []
    for row in rows:
        evidence, event, review = export_trial_review(db, row, evidence_root, registry, policy)
        files.update(evidence)
        events.append(event)
        if event.trial_stage is None:
            raise ValueError("trial event is missing its stage")
        groups[event.trial_stage].append(review)
    if any(event.cohort != policy.cohort or event.trial_id != trial_id for event in events):
        raise ValueError("trial events contain incomparable evidence")
    trial = {
        "cohort": policy.cohort.model_dump(mode="json"),
        "incumbent": policy.incumbent.model_dump(mode="json"),
        "challenger": policy.challenger.model_dump(mode="json"),
        "max_trial_cost_units": policy.max_trial_cost_units,
        "attempt_deadline_seconds": policy.attempt_deadline_seconds,
        **groups,
        "high_escape": any(
            event.linked_high_escape and worker_facts(db, event)[0] and verified_merge(db, event)
            for event in events
        ),
    }
    manifest: dict[str, object] = {"files": files}
    Trial.model_validate(trial)
    return trial, manifest


def apply_completed_reviews(
    db: sqlite3.Connection,
    registry: Path,
    evidence_root: Path,
    policy: RoutePolicy,
) -> list[str]:
    """Reconcile persisted reviews to approved route state after each event batch."""
    ledger = Path(db.execute("PRAGMA database_list").fetchone()["file"])
    if ledger.resolve() != registry.resolve():
        raise ValueError("automatic routing requires the shared coordinator ledger and registry")
    effective = approved_route_policy(db, policy)
    context = ObserverContext(registry, evidence_root, policy, effective)
    for row in high_escape_rows(db, policy):
        message = apply_high_escape(db, row, context)
        if message:
            store_notice(db, message[0], message[1], {policy.run_id})
    process_trial_reviews(db, context)
    return take_notifications(db)


def high_escape_rows(db: sqlite3.Connection, policy: RoutePolicy) -> list[sqlite3.Row]:
    return db.execute(
        "SELECT payload,evidence_absolute_path,evidence_sha256 FROM dev_observations "
        "WHERE json_extract(payload, '$.run_id')=? AND cohort_key=? "
        "AND json_extract(payload, '$.linked_high_escape')=1 ORDER BY recorded_at,event_id",
        (policy.run_id, cohort_key(policy.cohort)),
    ).fetchall()


def stored_review_evidence(row: sqlite3.Row, root: Path, event: ReviewEvent) -> bool:
    try:
        source = evidence_file(root, event)
    except (OSError, ValueError):
        return False
    return (
        source == Path(row["evidence_absolute_path"])
        and row["evidence_sha256"] == event.evidence_sha256
    )


def apply_high_escape(
    db: sqlite3.Connection,
    row: sqlite3.Row,
    context: ObserverContext,
) -> tuple[str, str] | None:
    event = ReviewEvent.model_validate_json(row["payload"])
    decision_id = "D-rollback-" + hashlib.sha256(event.event_id.encode()).hexdigest()[:12]
    notice = (
        decision_id,
        (
            f"{decision_id} applied. A verified High escaped on {event.merged_sha}. "
            "The coordinator applied the rollback and cleared any active canary."
        ),
    )
    with connect_registry(context.registry) as routes:
        if routes.execute(
            "SELECT 1 FROM route_events WHERE decision_id=? AND cohort=? AND action='rollback'",
            (decision_id, cohort_key(context.policy.cohort)),
        ).fetchone():
            return notice
    if not stored_review_evidence(row, context.evidence_root, event):
        return None
    if (
        not event.linked_high_escape
        or not worker_facts(db, event)[0]
        or not verified_merge(db, event)
    ):
        return None
    try:
        current = resolve_route(context.registry, context.policy.cohort)
    except ValueError:
        return None
    observed = {"model": event.route_resolved_model, "effort": event.route_resolved_effort}
    route_decision = (
        current["canary_decision_id"]
        if current["canary_route"] == observed
        else current["decision_id"]
    )
    if not isinstance(route_decision, str) or (
        current["route"] != observed and current["canary_route"] != observed
    ):
        return None
    with tempfile.TemporaryDirectory() as temporary:
        cohort_path = Path(temporary) / "cohort.json"
        cohort_path.write_text(context.policy.cohort.model_dump_json())
        rollback_route(
            AuthorizedRegistry(
                context.registry,
                lambda locked: approved_route_policy(locked, context.policy),
            ),
            cohort_path,
            decision_id,
            f"verified High escape {event.event_id} on merged revision {event.merged_sha}",
            expected_decision=route_decision,
        )
    return notice


def process_trial_reviews(
    db: sqlite3.Connection,
    context: ObserverContext,
) -> None:
    rows = db.execute(
        "SELECT DISTINCT json_extract(payload, '$.trial_id') AS trial_id "
        "FROM dev_observations WHERE json_extract(payload, '$.run_id')=? AND cohort_key=? "
        "AND json_extract(payload, '$.trial_id') IS NOT NULL ORDER BY trial_id",
        (context.policy.run_id, cohort_key(context.policy.cohort)),
    ).fetchall()
    for row in rows:
        message = process_one_trial(db, context, row["trial_id"])
        if message:
            store_notice(db, message[0], message[1], {context.policy.run_id})


def process_one_trial(
    db: sqlite3.Connection,
    context: ObserverContext,
    trial_id: str,
) -> tuple[str, str] | None:
    trial, manifest = export_trial(
        db, trial_id, context.evidence_root, context.registry, context.effective_policy
    )
    trial_model = Trial.model_validate(trial)
    outcome = assess_trial(trial_model)
    trial_bytes = json.dumps(trial, indent=2, sort_keys=True).encode()
    digest = hashlib.sha256(trial_bytes).hexdigest()
    prefix = (
        "D-route-" + hashlib.sha256(f"{context.policy.run_id}:{trial_id}".encode()).hexdigest()[:12]
    )
    applied = applied_trial_action(context.registry, cohort_key(context.policy.cohort), digest)
    if applied is not None:
        record_assessment(db, context.policy.run_id, trial_id, outcome, prefix)
        suffix, message = route_notice(prefix, applied)
        return prefix + suffix, message
    if outcome not in {"start-canary", "eligible-to-promote", "restore-incumbent"}:
        record_assessment(db, context.policy.run_id, trial_id, outcome, prefix)
        return _pending_trial_notice(outcome, prefix)
    decision_id = (
        prefix
        + {
            "start-canary": "-canary",
            "eligible-to-promote": "-promote",
            "restore-incumbent": "-rollback",
        }[outcome]
    )
    try:
        action = apply_trial_artifact(trial_bytes, manifest, context, decision_id)
    except TrialHold as hold:
        outcome = str(hold)
        record_assessment(db, context.policy.run_id, trial_id, outcome, prefix)
        return _pending_trial_notice(outcome, prefix)
    record_assessment(db, context.policy.run_id, trial_id, outcome, prefix)
    suffix, message = route_notice(prefix, action)
    return prefix + suffix, message


def record_assessment(
    db: sqlite3.Connection, run_id: str, trial_id: str, status: str, decision_id: str
) -> None:
    db.execute(
        """INSERT INTO dev_route_assessments VALUES(?,?,?,?,?)
           ON CONFLICT(run_id,trial_id) DO UPDATE SET status=excluded.status,
           decision_id=excluded.decision_id,updated_at=excluded.updated_at""",
        (run_id, trial_id, status, decision_id, datetime.now().astimezone().isoformat()),
    )


def applied_trial_action(registry: Path, cohort: str, digest: str) -> str | None:
    with connect_registry(registry) as route_db:
        row = route_db.execute(
            """SELECT route_events.action FROM applied_trials
               JOIN route_events ON route_events.decision_id=applied_trials.decision_id
               WHERE applied_trials.cohort=? AND applied_trials.trial_sha256=?""",
            (cohort, digest),
        ).fetchone()
    return row["action"] if row else None


def _pending_trial_notice(
    outcome: str,
    prefix: str,
) -> tuple[str, str] | None:
    decision_id = prefix + "-" + outcome
    return decision_id, f"{decision_id} pending. Route evidence is {outcome.replace('-', ' ')}."


class TrialHold(ValueError):
    """A reconciled trial is pending a prerequisite for its proposed transition."""


def check_route_authority(
    db: sqlite3.Connection, context: ObserverContext, decision_id: str
) -> None:
    approved_route_policy(db, context.policy)
    prefix, _, action = decision_id.rpartition("-")
    if action in {"promote", "rollback"}:
        try:
            current = resolve_route_db(db, context.policy.cohort)
        except ValueError:
            current = {}
        if (
            current.get("canary_decision_id") != prefix + "-canary"
            and current.get("decision_id") != prefix + "-promote"
        ):
            raise TrialHold("hold-failed-trial")
    if action != "promote":
        return
    starts = db.execute(
        """SELECT run, substr(id,7) AS attempt FROM events WHERE kind='route-resolved'
           AND json_extract(result,'$.cohort_key')=? ORDER BY created DESC,rowid DESC LIMIT 10""",
        (cohort_key(context.policy.cohort),),
    )
    for start in starts:
        row = db.execute(
            """SELECT payload FROM dev_observations WHERE cohort_key=? AND
               json_extract(payload,'$.run_id')=? AND json_extract(payload,'$.attempt_id')=?
               AND json_extract(payload,'$.first_review')=1
               AND json_extract(payload,'$.route_evidence')='worker-ledger'
               ORDER BY recorded_at,event_id LIMIT 1""",
            (cohort_key(context.policy.cohort), start["run"], start["attempt"]),
        ).fetchone()
        if row is None:
            raise TrialHold("hold-missing-start-outcome")
        event = ReviewEvent.model_validate_json(row["payload"])
        if not event.eligible or not worker_facts(db, event)[0]:
            raise TrialHold("hold-missing-start-outcome")
        try:
            evidence_file(context.evidence_root, event)
        except (OSError, ValueError) as error:
            raise TrialHold("hold-missing-start-outcome") from error


def apply_trial_artifact(
    trial_bytes: bytes,
    manifest: dict[str, object],
    context: ObserverContext,
    decision_id: str,
) -> str:
    with tempfile.TemporaryDirectory() as temporary:
        trial_path = Path(temporary) / "trial.json"
        manifest_path = Path(temporary) / "manifest.json"
        trial_path.write_bytes(trial_bytes)
        manifest["trial_sha256"] = hashlib.sha256(trial_bytes).hexdigest()
        manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True))
        return apply_trial(
            trial_path,
            manifest_path,
            context.evidence_root,
            AuthorizedRegistry(
                context.registry,
                lambda locked: check_route_authority(locked, context, decision_id),
            ),
            decision_id,
        )


def store_notice(db: sqlite3.Connection, decision_id: str, message: str, runs: set[str]) -> None:
    db.executemany(
        "INSERT OR IGNORE INTO dev_route_notification_runs VALUES(?,?)",
        [(decision_id, run) for run in runs],
    )
    db.execute(
        "INSERT OR IGNORE INTO dev_route_notifications(decision_id,message) VALUES(?,?)",
        (decision_id, message),
    )


def route_notice(prefix: str, action: str) -> tuple[str, str]:
    if action == "canary-start":
        return (
            "-canary",
            (
                f"{prefix}-canary applied. Five low-risk tasks "
                "will use the challenger route as a canary."
            ),
        )
    if action == "promote":
        return (
            "-promote",
            (
                f"{prefix}-promote applied. The challenger passed the verified canary "
                "and is selected for eligible work."
            ),
        )
    if action == "canary-rollback":
        return (
            "-rollback",
            (
                f"{prefix}-rollback applied. A failed canary restored the incumbent "
                "route for eligible work."
            ),
        )
    return (
        "-rollback",
        f"{prefix}-rollback applied. The affected route returned to its previous setting.",
    )


def assess_new_windows(db: sqlite3.Connection, evidence_root: Path) -> None:
    cohorts = db.execute(
        "SELECT DISTINCT cohort_key FROM dev_observations "
        "WHERE json_extract(payload, '$.first_review')=1 "
        "AND json_extract(payload, '$.trial_id') IS NULL"
    ).fetchall()
    for row in cohorts:
        key = row["cohort_key"]
        first = db.execute(
            "SELECT payload FROM dev_observations WHERE cohort_key=? "
            "AND json_extract(payload, '$.first_review')=1 "
            "AND json_extract(payload, '$.trial_id') IS NULL ORDER BY recorded_at,event_id",
            (key,),
        ).fetchall()
        events: dict[str, ReviewEvent] = {}
        for item in first:
            review = ReviewEvent.model_validate_json(item["payload"])
            events.setdefault(review.task_id, review)
        complete_windows = len(events) // 10
        last = db.execute(
            "SELECT coalesce(max(window_number),0) FROM dev_observation_windows WHERE cohort_key=?",
            (key,),
        ).fetchone()[0]
        cohort = next(iter(events.values())).cohort
        for window_number in range(last + 1, complete_windows + 1):
            report = assess(db, cohort, evidence_root, window_number)
            event_ids = report["event_ids"]
            serialized = json.dumps(event_ids, separators=(",", ":"))
            digest = hashlib.sha256(serialized.encode()).hexdigest()
            decision_id = (
                "D-observe-"
                + hashlib.sha256(f"{key}:{window_number}:{digest}".encode()).hexdigest()[:12]
            )
            status, message = observation_notice(decision_id, report)
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                "INSERT OR IGNORE INTO dev_observation_windows VALUES(?,?,?,?,?)",
                (key, window_number, digest, decision_id, status),
            )
            batch = list(events.values())[(window_number - 1) * 10 : window_number * 10]
            store_notice(db, decision_id, message, {item.run_id for item in batch})
            db.commit()


def observation_notice(decision_id: str, report: dict[str, object]) -> tuple[str, str]:
    severe = report["implementation_HM"]
    eligible = report["eligible_first_reviews"]
    causes = report["causes"]
    if not isinstance(severe, int) or not isinstance(eligible, int) or not isinstance(causes, dict):
        raise TypeError("assessment report has invalid observation counts")
    brief = causes.get("brief")
    process = causes.get("process")
    if not isinstance(brief, int) or not isinstance(process, int):
        raise TypeError("assessment report has invalid cause counts")
    if report["recommendation"] == "investigate-and-replay":
        return "investigate", (
            f"{decision_id} needs investigation. {severe} of 10 completed first reviews had "
            "independently confirmed implementation High/Medium findings. Run the approved "
            "matched, blinded replay and report its result before considering a route change."
        )
    if report["recommendation"] == "hold-incomplete-evidence":
        return "hold", (
            f"{decision_id} is on hold. Only {eligible} of 10 reviews "
            "have complete route, outcome and verification evidence. Reconcile the missing "
            "outcomes before comparing model routes."
        )
    if brief >= 3:
        return "repair-brief", (
            f"{decision_id} recommends a brief/context repair. {brief} of 10 findings "
            "were attributed to missing or incorrect task context. Keep the current model route."
        )
    if process >= 3:
        return "repair-process", (
            f"{decision_id} recommends a workflow repair. {process} of 10 findings "
            "were attributed to process delays or stale integration state. Keep the model route."
        )
    return "retain", f"{decision_id} reviewed 10 completed tasks. No route change is indicated."


def _known_sum(values: list[list[int | None]]) -> float | None:
    if any(value is None for group in values for value in group):
        return None
    return sum(value for group in values for value in group if value is not None) / 60


def _recommendation(
    observations: int,
    eligible: int,
    invalid_provenance: int,
    serious_implementation: int,
) -> str:
    if observations < 10 or eligible < 10 or invalid_provenance:
        return "hold-incomplete-evidence"
    if serious_implementation >= 3:
        return "investigate-and-replay"
    return "retain-incumbent"


def take_notifications(db: sqlite3.Connection) -> list[str]:
    db.execute("BEGIN IMMEDIATE")
    with db:
        pending = db.execute(
            "SELECT decision_id,message FROM dev_route_notifications WHERE emitted=0 ORDER BY rowid"
        ).fetchall()
        db.execute("UPDATE dev_route_notifications SET emitted=1 WHERE emitted=0")
    return [item["message"] for item in pending]


def _median(values: list[int | None]) -> float | None:
    available = sorted(value for value in values if value is not None)
    if not available:
        return None
    middle = len(available) // 2
    if len(available) % 2:
        return float(available[middle])
    return (available[middle - 1] + available[middle]) / 2


def run_record(args: argparse.Namespace, db: sqlite3.Connection) -> None:
    count = {"recorded": 0, "duplicate": 0}
    with args.events.open() as events_file:
        for line_number, line in enumerate(events_file, start=1):
            if not line.strip():
                continue
            try:
                event = ReviewEvent.model_validate_json(line)
                source = evidence_file(args.evidence_root, event)
                result = ingest(db, event, source)
                count[result] += 1
            except (ValidationError, OSError, ValueError) as error:
                raise ValueError(f"line {line_number}: {error}") from error
    if bool(args.registry) != bool(args.route_policy):
        raise ValueError("--registry and --route-policy must be supplied together")
    assess_new_windows(db, args.evidence_root)
    if args.registry:
        policy = RoutePolicy.model_validate_json(args.route_policy.read_bytes())
        notices = apply_completed_reviews(db, args.registry, args.evidence_root, policy)
    else:
        notices = take_notifications(db)
    print(json.dumps({"ok": True, **count, "decisions": notices}))


def run_assess(args: argparse.Namespace, db: sqlite3.Connection) -> None:
    cohort = Cohort.model_validate_json(args.cohort.read_bytes())
    print(json.dumps(assess(db, cohort, args.evidence_root), sort_keys=True))


def run_export(args: argparse.Namespace, db: sqlite3.Connection) -> None:
    policy = RoutePolicy.model_validate_json(args.route_policy.read_bytes())
    effective = approved_route_policy(db, policy)
    if policy.run_id != args.run_id:
        raise ValueError("route policy run does not match the requested export")
    trial, manifest = export_trial(
        db,
        args.trial_id,
        args.evidence_root,
        args.registry,
        effective,
    )
    args.output.write_text(json.dumps(trial, indent=2, sort_keys=True) + "\n")
    manifest["trial_sha256"] = hashlib.sha256(args.output.read_bytes()).hexdigest()
    args.manifest.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"ok": True, "trial": str(args.output), "manifest": str(args.manifest)}))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path(".superpowers/dev.sqlite"))
    commands = parser.add_subparsers(dest="command", required=True)
    record = commands.add_parser("record")
    record.add_argument("events", type=Path, help="JSONL of completed first-reviewed tasks")
    record.add_argument("--evidence-root", type=Path, required=True)
    record.add_argument("--registry", type=Path)
    record.add_argument("--route-policy", type=Path)
    report = commands.add_parser("assess")
    report.add_argument("cohort", type=Path, help="JSON object matching the cohort fields")
    report.add_argument("--evidence-root", type=Path, required=True)
    export = commands.add_parser("export-trial")
    export.add_argument("run_id")
    export.add_argument("trial_id")
    export.add_argument("--evidence-root", type=Path, required=True)
    export.add_argument("--output", type=Path, required=True)
    export.add_argument("--manifest", type=Path, required=True)
    export.add_argument("--registry", type=Path, required=True)
    export.add_argument("--route-policy", type=Path, required=True)
    args = parser.parse_args()
    try:
        with open_db(args.db) as db:
            if args.command == "record":
                run_record(args, db)
            elif args.command == "assess":
                run_assess(args, db)
            else:
                run_export(args, db)
    except (ValidationError, OSError, ValueError, sqlite3.Error) as error:
        print(json.dumps({"ok": False, "error": str(error)}), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
