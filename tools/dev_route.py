"""Evaluate one Credit OS2 builder-route trial from independently scored evidence.

Usage: uv run python tools/dev_route.py path/to/trial.json
This advisory command evaluates recorded evidence offline. The coordinator verifies its sources.
"""

import argparse
import json
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
    max_trial_cost_units: PositiveInt
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
    if len(trial.canary) != 5:
        return "continue-canary"
    if not within_time_limit(trial.canary, trial.baseline):
        return "restore-incumbent"
    return "eligible-to-promote"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("trial", type=Path)
    args = parser.parse_args()
    try:
        trial = Trial.model_validate_json(args.trial.read_bytes())
    except (OSError, ValidationError) as error:
        parser.exit(2, f"Invalid trial evidence: {error}\n")
    print(
        json.dumps(
            {
                "decision": assess(trial),
                "scope": "advisory; verify evidence before applying a route",
                "baseline_tasks": len(trial.baseline),
                "baseline_implementation_findings": sum(item.serious for item in trial.baseline),
                "incumbent_replays": len(trial.incumbent_replay),
                "challenger_replays": len(trial.challenger_replay),
                "canary_tasks": len(trial.canary),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
