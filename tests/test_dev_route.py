import json

import pytest
from pydantic import ValidationError

from tools.dev_route import Trial, assess

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
