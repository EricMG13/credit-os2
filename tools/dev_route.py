"""Evaluate builder trials and maintain the Credit OS2 route registry.

Use evaluate for a read-only score and apply for a verified transition. The coordinator
owns independent review provenance and binds each dispatch to the approved run policy.
"""

import argparse
import hashlib
import json
import sqlite3
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, PositiveInt, ValidationError, model_validator


class Evidence(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, str_strip_whitespace=True)


class Route(Evidence):
    model: str = Field(min_length=1)
    effort: str = Field(min_length=1)


class Cohort(Evidence):
    client: str = Field(min_length=1)
    environment: str = Field(min_length=1)
    role: Literal["builder"]
    task_family: str = Field(min_length=1)
    risk: str = Field(min_length=1)
    policy_epoch: str = Field(min_length=1)
    scoring_protocol: str = Field(min_length=1)


class Review(Evidence):
    run: str | None = Field(default=None, min_length=1)
    attempt: str | None = Field(default=None, min_length=1)
    task: str = Field(min_length=1)
    evidence: str = Field(min_length=1)
    fixture: str = Field(min_length=1)
    cohort: Cohort
    route: Route | None
    cause: Literal["implementation", "brief", "process", "mixed", "unknown", "clean"]
    severity: Literal["H", "M", "L", "clear"] | None
    accepted_seconds: PositiveInt | None
    gates: bool
    cost_units: int | None = Field(ge=0)

    @model_validator(mode="after")
    def consistent_grade(self) -> Self:
        if self.severity is not None and (self.cause == "clean") != (self.severity == "clear"):
            raise ValueError("clear severity and clean cause must agree")
        return self

    @property
    def serious(self) -> bool:
        return self.severity in {"H", "M"} and self.cause == "implementation"

    @property
    def complete(self) -> bool:
        return (
            self.accepted_seconds is not None
            and self.gates
            and self.severity is not None
            and self.cost_units is not None
            and self.cause not in {"mixed", "unknown"}
        )


class Trial(Evidence):
    cohort: Cohort
    incumbent: Route
    challenger: Route
    max_trial_cost_units: int = Field(ge=0)
    attempt_deadline_seconds: PositiveInt
    baseline: list[Review] = Field(max_length=10)
    incumbent_replay: list[Review] = Field(default_factory=list, max_length=6)
    challenger_replay: list[Review] = Field(default_factory=list, max_length=6)
    canary: list[Review] = Field(default_factory=list, max_length=5)
    high_escape: bool = False

    @model_validator(mode="after")
    def distinct_task_groups(self) -> Self:
        if self.incumbent == self.challenger:
            raise ValueError("the challenger must differ from the incumbent")
        groups = (self.baseline, self.incumbent_replay, self.challenger_replay, self.canary)
        for group in groups:
            if len({item.task for item in group}) != len(group):
                raise ValueError("duplicate task within a trial stage")
        evidence = [item.evidence for group in groups for item in group]
        if len(evidence) != len(set(evidence)):
            raise ValueError("each review must have a distinct evidence reference")
        if any(item.cohort != self.cohort for group in groups for item in group):
            raise ValueError("review context differs from the declared trial cohort")
        replay_tasks = {item.task for group in groups[1:3] for item in group}
        baseline_tasks = {item.task for item in self.baseline}
        if replay_tasks & baseline_tasks:
            raise ValueError("replay tasks must be held out from the trigger baseline")
        earlier = replay_tasks | baseline_tasks
        if earlier.intersection(item.task for item in self.canary):
            raise ValueError("canary work must be distinct from baseline and replay")
        return self


class EvidenceFile(Evidence):
    path: str = Field(min_length=1)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class EvidenceManifest(Evidence):
    trial_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    files: dict[str, EvidenceFile]


@dataclass(frozen=True)
class RouteUpdate:
    cohort: Cohort
    route: Route
    decision_id: str
    action: str
    reason: str


@dataclass(frozen=True)
class TrialApplication:
    db: sqlite3.Connection
    trial: Trial
    current: sqlite3.Row | None
    current_route: Route
    decision_id: str
    digest: str


def cohort_key(cohort: Cohort) -> str:
    value = json.dumps(cohort.model_dump(mode="json"), sort_keys=True)
    return hashlib.sha256(value.encode()).hexdigest()


def verify_manifest(trial_bytes: bytes, trial: Trial, manifest_path: Path, root: Path) -> None:
    manifest = EvidenceManifest.model_validate_json(manifest_path.read_bytes())
    if hashlib.sha256(trial_bytes).hexdigest() != manifest.trial_sha256:
        raise ValueError("evidence manifest does not bind this trial file")
    reviews = trial.baseline + trial.incumbent_replay + trial.challenger_replay + trial.canary
    refs = {review.evidence for review in reviews}
    if refs != set(manifest.files):
        raise ValueError("manifest evidence references do not exactly match the trial")
    evidence_root = root.resolve(strict=True)
    for reference, evidence in manifest.files.items():
        artifact = (evidence_root / evidence.path).resolve(strict=True)
        if not artifact.is_relative_to(evidence_root) or not artifact.is_file():
            raise ValueError(f"evidence path escapes root or is not a file: {reference}")
        digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
        if digest != evidence.sha256:
            raise ValueError(f"evidence digest mismatch: {reference}")


def connect_registry(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=10, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    ensure_registry_schema(db)
    return db


def ensure_registry_schema(db: sqlite3.Connection) -> None:
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS active_routes (
            cohort TEXT PRIMARY KEY, cohort_json TEXT NOT NULL, model TEXT NOT NULL,
            effort TEXT NOT NULL, policy_epoch TEXT NOT NULL, updated INTEGER NOT NULL,
            canary_model TEXT, canary_effort TEXT, canary_limit INTEGER NOT NULL DEFAULT 0,
            canary_remaining INTEGER NOT NULL DEFAULT 0, canary_decision_id TEXT
        );
        CREATE TABLE IF NOT EXISTS route_events (
            decision_id TEXT PRIMARY KEY, cohort TEXT NOT NULL, action TEXT NOT NULL,
            previous TEXT, selected TEXT NOT NULL, reason TEXT NOT NULL, created INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS applied_trials (
            cohort TEXT NOT NULL, trial_sha256 TEXT NOT NULL, decision_id TEXT NOT NULL UNIQUE,
            PRIMARY KEY(cohort, trial_sha256)
        );
        CREATE TABLE IF NOT EXISTS canary_claims (
            cohort TEXT NOT NULL, attempt_id TEXT NOT NULL, route TEXT NOT NULL,
            decision_id TEXT NOT NULL, PRIMARY KEY(cohort, attempt_id)
        );
        """
    )
    columns = {row["name"] for row in db.execute("PRAGMA table_info(active_routes)")}
    migrations = {
        "canary_model": "TEXT",
        "canary_effort": "TEXT",
        "canary_limit": "INTEGER NOT NULL DEFAULT 0",
        "canary_remaining": "INTEGER NOT NULL DEFAULT 0",
        "canary_decision_id": "TEXT",
    }
    for name, declaration in migrations.items():
        if name not in columns:
            db.execute(f"ALTER TABLE active_routes ADD COLUMN {name} {declaration}")


def route_json(row: sqlite3.Row | None) -> str | None:
    if row is None:
        return None
    return json.dumps({"model": row["model"], "effort": row["effort"]}, sort_keys=True)


def select_route(db: sqlite3.Connection, cohort: Cohort, incumbent: Route) -> Route:
    key = cohort_key(cohort)
    row = db.execute("SELECT model, effort FROM active_routes WHERE cohort=?", (key,)).fetchone()
    if row is None:
        return incumbent
    return Route(model=row["model"], effort=row["effort"])


def resolve_route(registry: Path, cohort: Cohort) -> dict[str, object]:
    with connect_registry(registry) as db:
        return resolve_route_db(db, cohort)


def resolve_route_db(db: sqlite3.Connection, cohort: Cohort) -> dict[str, object]:
    key = cohort_key(cohort)
    row = db.execute(
        "SELECT model, effort, canary_model, canary_effort, canary_remaining, "
        "canary_decision_id FROM active_routes WHERE cohort=?",
        (key,),
    ).fetchone()
    event = db.execute(
        "SELECT decision_id FROM route_events WHERE cohort=? AND action != 'canary-start' "
        "ORDER BY created DESC, rowid DESC LIMIT 1",
        (key,),
    ).fetchone()
    if row is None or event is None:
        raise ValueError("no qualified route is registered for this cohort")
    return {
        "ok": True,
        "cohort_key": key,
        "route": {"model": row["model"], "effort": row["effort"]},
        "decision_id": event["decision_id"],
        "canary_pending": row["canary_model"] is not None and row["canary_remaining"] > 0,
        "canary_remaining": row["canary_remaining"],
        "canary_route": (
            {"model": row["canary_model"], "effort": row["canary_effort"]}
            if row["canary_model"] is not None
            else None
        ),
        "canary_decision_id": row["canary_decision_id"],
    }


def canary_attempt_key(run: str, attempt: str) -> str:
    return json.dumps([run, attempt], separators=(",", ":"))


def reviewed_attempts(reviews: list[Review]) -> set[str]:
    keys = set()
    for item in reviews:
        if item.run is None or item.attempt is None:
            raise ValueError("canary review must identify its run and worker attempt")
        keys.add(canary_attempt_key(item.run, item.attempt))
    return keys


def claim_canary(db: sqlite3.Connection, cohort: Cohort, attempt_id: str) -> dict[str, object]:
    if not db.in_transaction:
        raise ValueError("canary claim must share the worker launch transaction")
    if not attempt_id.strip():
        raise ValueError("canary attempt ID must not be empty")
    if cohort.risk != "low":
        raise ValueError("automatic canaries are limited to low-risk cohorts")
    key = cohort_key(cohort)
    row = db.execute("SELECT * FROM active_routes WHERE cohort=?", (key,)).fetchone()
    if row is None or row["canary_model"] is None:
        raise ValueError("no unclaimed bounded canary route is available")
    prior = db.execute(
        "SELECT route, decision_id FROM canary_claims WHERE cohort=? AND attempt_id=?",
        (key, attempt_id),
    ).fetchone()
    if prior is not None:
        if prior["decision_id"] != row["canary_decision_id"]:
            raise ValueError("attempt ID was already used in an earlier canary")
        return {
            "route": json.loads(prior["route"]),
            "decision_id": prior["decision_id"],
            "remaining": row["canary_remaining"],
            "replayed": True,
        }
    if row["canary_remaining"] <= 0:
        raise ValueError("no unclaimed bounded canary route is available")
    route = Route(model=row["canary_model"], effort=row["canary_effort"])
    remaining = row["canary_remaining"] - 1
    db.execute("UPDATE active_routes SET canary_remaining=? WHERE cohort=?", (remaining, key))
    db.execute(
        "INSERT INTO canary_claims VALUES(?,?,?,?)",
        (key, attempt_id, route.model_dump_json(), row["canary_decision_id"]),
    )
    return {
        "route": route.model_dump(mode="json"),
        "decision_id": row["canary_decision_id"],
        "remaining": remaining,
        "replayed": False,
    }


def write_route(
    db: sqlite3.Connection,
    update: RouteUpdate,
) -> None:
    db.execute("BEGIN IMMEDIATE")
    try:
        record_route(db, update)
        db.commit()
    except (sqlite3.Error, ValueError):
        db.rollback()
        raise


def record_route(db: sqlite3.Connection, update: RouteUpdate) -> None:
    cohort = update.cohort
    route = update.route
    decision_id = update.decision_id
    action = update.action
    reason = update.reason
    key = cohort_key(cohort)
    payload = route.model_dump_json()
    existing_event = db.execute(
        "SELECT cohort, action, selected, reason FROM route_events WHERE decision_id=?",
        (decision_id,),
    ).fetchone()
    if existing_event:
        if tuple(existing_event) == (key, action, payload, reason):
            return
        raise ValueError("decision ID already records different route evidence")
    previous = db.execute("SELECT * FROM active_routes WHERE cohort=?", (key,)).fetchone()
    db.execute(
        """INSERT INTO active_routes(
           cohort, cohort_json, model, effort, policy_epoch, updated
           ) VALUES(?,?,?,?,?,strftime('%s','now'))
           ON CONFLICT(cohort) DO UPDATE SET cohort_json=excluded.cohort_json,
           model=excluded.model, effort=excluded.effort, policy_epoch=excluded.policy_epoch,
           updated=excluded.updated""",
        (key, cohort.model_dump_json(), route.model, route.effort, cohort.policy_epoch),
    )
    db.execute(
        """UPDATE active_routes SET canary_model=NULL, canary_effort=NULL,
           canary_limit=0, canary_remaining=0, canary_decision_id=NULL WHERE cohort=?""",
        (key,),
    )
    db.execute(
        "INSERT INTO route_events VALUES(?,?,?,?,?,?,strftime('%s','now'))",
        (decision_id, key, action, route_json(previous), payload, reason),
    )


def start_canary(db: sqlite3.Connection, trial: Trial, decision_id: str, trial_digest: str) -> None:
    if trial.cohort.risk != "low":
        raise ValueError("automatic canaries are limited to low-risk cohorts")
    key = cohort_key(trial.cohort)
    current = db.execute("SELECT * FROM active_routes WHERE cohort=?", (key,)).fetchone()
    if current is not None and (
        current["model"] != trial.incumbent.model or current["effort"] != trial.incumbent.effort
    ):
        raise ValueError("active route changed since the trial incumbent was evaluated")
    canary_active = current is not None and current["canary_model"] is not None
    if canary_active:
        raise ValueError("a bounded canary is already active for this cohort")
    if current is None:
        record_route(
            db,
            RouteUpdate(
                trial.cohort,
                trial.incumbent,
                f"baseline:{key}",
                "baseline",
                "incumbent route used for the qualified trial",
            ),
        )
        current = db.execute("SELECT * FROM active_routes WHERE cohort=?", (key,)).fetchone()
    selected = trial.challenger.model_dump_json()
    reason = f"trial_sha256:{trial_digest}"
    db.execute(
        """UPDATE active_routes SET canary_model=?, canary_effort=?,
           canary_limit=5, canary_remaining=5, canary_decision_id=? WHERE cohort=?""",
        (trial.challenger.model, trial.challenger.effort, decision_id, key),
    )
    db.execute(
        "INSERT INTO route_events VALUES(?,?,?,?,?,?,strftime('%s','now'))",
        (decision_id, key, "canary-start", route_json(current), selected, reason),
    )


def canary_claims(db: sqlite3.Connection, cohort_key_value: str, decision_id: str) -> set[str]:
    return {
        row["attempt_id"]
        for row in db.execute(
            "SELECT attempt_id FROM canary_claims WHERE cohort=? AND decision_id=?",
            (cohort_key_value, decision_id),
        )
    }


def promote_trial(application: TrialApplication) -> None:
    db = application.db
    trial = application.trial
    current = application.current
    current_route = application.current_route
    if trial.cohort.risk != "low" or current_route != trial.incumbent:
        raise ValueError("active route changed or cohort is not low risk")
    if (
        current is None
        or current["canary_model"] != trial.challenger.model
        or current["canary_effort"] != trial.challenger.effort
        or current["canary_remaining"] != 0
    ):
        raise ValueError("the five claimed canary attempts are not complete")
    claims = canary_claims(db, cohort_key(trial.cohort), current["canary_decision_id"])
    if claims != reviewed_attempts(trial.canary) or len(claims) != 5:
        raise ValueError("canary reviews must match exactly five claimed attempts")
    record_route(
        db,
        RouteUpdate(
            trial.cohort,
            trial.challenger,
            application.decision_id,
            "promote",
            f"trial_sha256:{application.digest}",
        ),
    )


def restore_trial(application: TrialApplication) -> None:
    db = application.db
    trial = application.trial
    current = application.current
    current_route = application.current_route
    if current is not None and current["canary_model"] == trial.challenger.model:
        claims = canary_claims(db, cohort_key(trial.cohort), current["canary_decision_id"])
        if not reviewed_attempts(trial.canary).issubset(claims):
            raise ValueError("canary reviews must match claimed attempts")
    pending_canary = (
        current_route == trial.incumbent
        and current is not None
        and current["canary_model"] == trial.challenger.model
        and current["canary_effort"] == trial.challenger.effort
    )
    if not pending_canary and current_route != trial.challenger:
        raise ValueError("failed route does not match the active canary or promotion")
    record_route(
        db,
        RouteUpdate(
            trial.cohort,
            trial.incumbent,
            application.decision_id,
            "canary-rollback",
            f"trial_sha256:{application.digest}",
        ),
    )


@dataclass(frozen=True)
class AuthorizedRegistry:
    path: Path
    check: Callable[[sqlite3.Connection], object]


def begin_route_update(registry: Path | AuthorizedRegistry) -> sqlite3.Connection:
    db = connect_registry(registry.path if isinstance(registry, AuthorizedRegistry) else registry)
    try:
        db.execute("BEGIN IMMEDIATE")
        if isinstance(registry, AuthorizedRegistry):
            registry.check(db)
    except BaseException:
        db.rollback()
        db.close()
        raise
    return db


def apply_trial(
    trial_path: Path,
    manifest_path: Path,
    evidence_root: Path,
    registry: Path | AuthorizedRegistry,
    decision_id: str,
) -> str:
    trial_bytes = trial_path.read_bytes()
    trial = Trial.model_validate_json(trial_bytes)
    outcome = assess(trial)
    if outcome not in {"start-canary", "eligible-to-promote", "restore-incumbent"}:
        raise ValueError("trial is not eligible to promote")
    digest = hashlib.sha256(trial_bytes).hexdigest()
    with begin_route_update(registry) as db:
        try:
            verify_manifest(trial_bytes, trial, manifest_path, evidence_root)
            key = cohort_key(trial.cohort)
            if db.execute(
                "SELECT 1 FROM applied_trials WHERE cohort=? AND trial_sha256=?",
                (key, digest),
            ).fetchone():
                raise ValueError("this trial evidence has already been applied")
            current = db.execute("SELECT * FROM active_routes WHERE cohort=?", (key,)).fetchone()
            current_route = (
                Route(model=current["model"], effort=current["effort"])
                if current is not None
                else trial.incumbent
            )
            application = TrialApplication(db, trial, current, current_route, decision_id, digest)
            if outcome == "start-canary":
                if current_route != trial.incumbent:
                    raise ValueError("active route changed since the trial incumbent was evaluated")
                start_canary(db, trial, decision_id, digest)
                action = "canary-start"
            elif outcome == "eligible-to-promote":
                promote_trial(application)
                action = "promote"
            else:
                restore_trial(application)
                action = "canary-rollback"
            db.execute("INSERT INTO applied_trials VALUES(?,?,?)", (key, digest, decision_id))
            db.commit()
            return action
        except (OSError, ValueError, sqlite3.Error):
            db.rollback()
            raise


def owner_route(
    registry: Path, cohort_path: Path, route_path: Path, decision_id: str, reason: str
) -> None:
    cohort = Cohort.model_validate_json(cohort_path.read_bytes())
    route = Route.model_validate_json(route_path.read_bytes())
    if not reason.strip():
        raise ValueError("owner override requires a reason")
    with connect_registry(registry) as db:
        write_route(
            db,
            RouteUpdate(cohort, route, decision_id, "owner-override", reason.strip()),
        )


def rollback_route(
    registry: Path | AuthorizedRegistry,
    cohort_path: Path,
    decision_id: str,
    reason: str,
    expected_decision: str | None = None,
) -> None:
    cohort = Cohort.model_validate_json(cohort_path.read_bytes())
    key = cohort_key(cohort)
    with begin_route_update(registry) as db:
        try:
            replay = db.execute(
                "SELECT cohort,action,reason FROM route_events WHERE decision_id=?", (decision_id,)
            ).fetchone()
            if replay is not None:
                if tuple(replay) != (key, "rollback", reason):
                    raise ValueError("conflicting rollback decision ID")
                db.rollback()
                return
            row = db.execute(
                "SELECT decision_id, previous FROM route_events WHERE cohort=? "
                "ORDER BY created DESC, rowid DESC LIMIT 1",
                (key,),
            ).fetchone()
            if row is None or row["previous"] is None:
                raise ValueError("no prior route is recorded for this cohort")
            if expected_decision is not None and row["decision_id"] != expected_decision:
                raise ValueError("route decision changed before rollback")
            route = Route.model_validate_json(row["previous"])
            record_route(db, RouteUpdate(cohort, route, decision_id, "rollback", reason))
            db.commit()
        except (sqlite3.Error, ValueError):
            db.rollback()
            raise


def explain_route(registry: Path, decision_id: str) -> dict[str, object]:
    if not registry.is_file():
        raise ValueError("route registry does not exist")
    db = sqlite3.connect(f"{registry.resolve().as_uri()}?mode=ro", uri=True, timeout=10)
    db.row_factory = sqlite3.Row
    try:
        row = db.execute(
            "SELECT cohort, action, previous, selected, reason FROM route_events "
            "WHERE decision_id=?",
            (decision_id,),
        ).fetchone()
        if row is None:
            raise ValueError(f"unknown route decision ID: {decision_id}")
        return {
            "decision_id": decision_id,
            "cohort_key": row["cohort"],
            "action": row["action"],
            "previous": json.loads(row["previous"]) if row["previous"] else None,
            "selected": json.loads(row["selected"]),
            "reason": row["reason"],
        }
    finally:
        db.close()


def meets_gate(reviews: list[Review], expected: Route, deadline: int) -> bool:
    return all(
        item.complete
        and item.route == expected
        and item.accepted_seconds is not None
        and item.accepted_seconds <= deadline
        for item in reviews
    )


def within_time_limit(candidate: list[Review], baseline: list[Review]) -> bool:
    candidate_median = median(item.accepted_seconds or 0 for item in candidate)
    baseline_median = median(item.accepted_seconds or 0 for item in baseline)
    return candidate_median * 5 <= baseline_median * 6


def replay_wins(trial: Trial) -> bool:
    old = trial.incumbent_replay
    new = trial.challenger_replay
    if len(old) != 6 or len(new) != 6:
        return False
    if not meets_gate(old, trial.incumbent, trial.attempt_deadline_seconds):
        return False
    if not meets_gate(new, trial.challenger, trial.attempt_deadline_seconds):
        return False
    if {item.task: item.fixture for item in old} != {item.task: item.fixture for item in new}:
        return False
    old_highs = {item.task for item in old if item.severity == "H"}
    new_highs = {item.task for item in new if item.severity == "H"}
    return (
        not new_highs - old_highs
        and sum(item.serious for item in old) - sum(item.serious for item in new) >= 2
        and within_time_limit(new, old)
    )


def assess(trial: Trial) -> str:
    spent = trial.incumbent_replay + trial.challenger_replay + trial.canary
    if (
        trial.high_escape
        or sum(item.cost_units or 0 for item in spent) > trial.max_trial_cost_units
    ):
        return "restore-incumbent"
    baseline = trial.baseline
    if len(baseline) != 10 or not meets_gate(
        baseline, trial.incumbent, trial.attempt_deadline_seconds
    ):
        return "hold-incomplete-baseline"
    if sum(item.serious for item in baseline) < 3:
        return "retain-incumbent"
    if not trial.incumbent_replay and not trial.challenger_replay:
        return "investigate-and-replay"
    if not replay_wins(trial):
        return "hold-replay"
    return assess_canary(trial)


def assess_canary(trial: Trial) -> str:
    if any(item.serious or item.severity == "H" for item in trial.canary):
        return "restore-incumbent"
    if not meets_gate(trial.canary, trial.challenger, trial.attempt_deadline_seconds):
        return "hold-incomplete-canary"
    if not trial.canary:
        return "start-canary"
    if len(trial.canary) != 5:
        return "continue-canary"
    if not within_time_limit(trial.canary, trial.baseline):
        return "restore-incumbent"
    return "eligible-to-promote"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    evaluate = sub.add_parser("evaluate", help="evaluate trial evidence offline")
    evaluate.add_argument("trial", type=Path)
    apply = sub.add_parser("apply", help="verify and apply an eligible trial")
    apply.add_argument("trial", type=Path)
    apply.add_argument("--manifest", type=Path, required=True)
    apply.add_argument("--evidence-root", type=Path, required=True)
    apply.add_argument("--registry", type=Path, required=True)
    apply.add_argument("--decision-id", required=True)
    resolve = sub.add_parser("resolve", help="resolve a registered route for dispatch")
    resolve.add_argument("--registry", type=Path, required=True)
    resolve.add_argument("--cohort", type=Path, required=True)
    override = sub.add_parser("override", help="record an owner-selected route")
    override.add_argument("--registry", type=Path, required=True)
    override.add_argument("--cohort", type=Path, required=True)
    override.add_argument("--route", type=Path, required=True)
    override.add_argument("--decision-id", required=True)
    override.add_argument("--reason", required=True)
    rollback = sub.add_parser("rollback", help="restore the route before the last decision")
    rollback.add_argument("--registry", type=Path, required=True)
    rollback.add_argument("--cohort", type=Path, required=True)
    rollback.add_argument("--decision-id", required=True)
    rollback.add_argument("--reason", required=True)
    explain = sub.add_parser("explain", help="show a route decision and its evidence reference")
    explain.add_argument("--registry", type=Path, required=True)
    explain.add_argument("--decision-id", required=True)
    return parser


def main() -> int:
    parser = build_parser()
    command_args = sys.argv[1:]
    if (
        command_args
        and not command_args[0].startswith("-")
        and command_args[0]
        not in {
            "evaluate",
            "apply",
            "resolve",
            "override",
            "rollback",
            "explain",
        }
    ):
        command_args.insert(0, "evaluate")
    args = parser.parse_args(command_args)
    try:
        if args.command == "evaluate":
            trial = Trial.model_validate_json(args.trial.read_bytes())
            result = {
                "decision": assess(trial),
                "scope": "advisory; verify evidence before applying a route",
                "baseline_tasks": len(trial.baseline),
                "baseline_implementation_findings": sum(item.serious for item in trial.baseline),
                "incumbent_replays": len(trial.incumbent_replay),
                "challenger_replays": len(trial.challenger_replay),
                "canary_tasks": len(trial.canary),
            }
        elif args.command == "apply":
            action = apply_trial(
                args.trial, args.manifest, args.evidence_root, args.registry, args.decision_id
            )
            result = {"ok": True, "decision_id": args.decision_id, "action": action}
        elif args.command == "resolve":
            cohort = Cohort.model_validate_json(args.cohort.read_bytes())
            result = resolve_route(args.registry, cohort)
        elif args.command == "override":
            owner_route(args.registry, args.cohort, args.route, args.decision_id, args.reason)
            result = {"ok": True, "decision_id": args.decision_id, "action": "owner-override"}
        elif args.command == "rollback":
            rollback_route(args.registry, args.cohort, args.decision_id, args.reason)
            result = {"ok": True, "decision_id": args.decision_id, "action": "rollback"}
        else:
            result = explain_route(args.registry, args.decision_id)
    except (OSError, ValidationError, ValueError, sqlite3.Error) as error:
        parser.exit(2, f"Route operation failed: {error}\n")
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
