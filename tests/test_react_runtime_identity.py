"""R4-011: bind activity metadata to actual synthetic engine run artifacts."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

import pytest

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout
from proof import test_launcher
from react_frontend.run_activity import reply


@pytest.fixture(scope="module")
def engine_case(tmp_path_factory: pytest.TempPathFactory) -> Path:
    retained = tmp_path_factory.mktemp("runtime-engine") / "case"
    original = test_launcher.assert_exported_report

    def retain(layout: Layout, run_id: str, legal: str) -> None:
        original(layout, run_id, legal)
        shutil.copytree(layout.root, retained)

    with pytest.MonkeyPatch.context() as patch:
        patch.setattr(test_launcher, "assert_exported_report", retain)
        test_launcher.test_real_scheduler_exports_the_submitted_run(patch, "executed")
    return retained


@pytest.fixture
def actual_run(engine_case: Path, tmp_path: Path) -> tuple[Layout, runs.Record, Path]:
    root = tmp_path / "case"
    shutil.copytree(engine_case, root)
    layout = Layout(root)
    [record] = runs.load_readable(layout)[0]
    return layout, record, layout.runs / record.id


def test_completed_engine_responses_supply_their_exact_verified_metadata(
    actual_run: tuple[Layout, runs.Record, Path],
) -> None:
    layout, record, directory = actual_run
    workflow = json.loads((directory / "workflow.json").read_bytes())
    assert workflow["run"]["run_id"] != record.id
    assert workflow["run"]["run_id"] == "example-2025-04-30-credit_snapshot-sol-medium"
    body = reply(layout, record.id).body
    assert body["module_outputs"] is not None
    outputs = {row["module"]: row for row in body["module_outputs"]}
    assert set(outputs) == set(test_launcher.MODULES)
    completion = json.loads(next(directory.glob("completed-*.json")).read_bytes())
    for code, path in completion["modules"].items():
        assert (
            outputs[code]["response_sha256"]
            == hashlib.sha256((directory / path).read_bytes()).hexdigest()
        )
        assert outputs[code]["provenance"] == "new-response"
    assert body["library_admission"] == "listed"


@pytest.mark.parametrize("accepted", [False, True])
def test_retained_engine_event_phases_distinguish_pending_and_accepted(
    actual_run: tuple[Layout, runs.Record, Path], accepted: bool
) -> None:
    """Replay genuine engine event prefixes, with no final delivery selection available."""
    layout, record, directory = actual_run
    record.status = "running"
    runs.save(layout, record)
    for path in directory.glob("completed-*.json"):
        path.unlink()
    events = (directory / "events.jsonl").read_text().splitlines(keepends=True)
    stop = "module_accepted" if accepted else "module_started"
    end = next(
        index + 1
        for index, line in enumerate(events)
        if (event := json.loads(line)).get("module") == "CP-0" and event.get("event") == stop
    )
    (directory / "events.jsonl").write_text("".join(events[:end]))
    body = reply(layout, record.id).body
    assert body["status"] == "running"
    assert body["library_admission"] == "not-listed"
    if accepted:
        [output] = body["module_outputs"]
        response = next((directory / "requests/CP-0").glob("*/1.response.md"))
        assert output["module"] == "CP-0"
        assert output["response_sha256"] == hashlib.sha256(response.read_bytes()).hexdigest()
        assert output["provenance"] == "new-response"
    else:
        assert body["module_outputs"] == []


@pytest.mark.parametrize("field", ["run_id", "issuer_id", "issuer_name", "as_of", "pathway"])
def test_actual_engine_workflow_cannot_name_another_scheduler_identity(
    actual_run: tuple[Layout, runs.Record, Path], field: str
) -> None:
    layout, record, directory = actual_run
    workflow = json.loads((directory / "workflow.json").read_bytes())
    workflow["run"][field] = record.id if field == "run_id" else "another"
    (directory / "workflow.json").write_text(json.dumps(workflow))
    (directory / "identity.json").write_text(json.dumps({"run": workflow["run"]}))
    assert reply(layout, record.id).body["module_outputs"] is None


@pytest.mark.parametrize(("model", "effort"), [("gpt", "high"), ("claude", "balanced")])
def test_actual_engine_workflow_must_match_the_scheduler_launch_config(
    actual_run: tuple[Layout, runs.Record, Path], model: str, effort: str
) -> None:
    layout, record, _ = actual_run
    record.model, record.effort = model, effort
    runs.save(layout, record)
    assert reply(layout, record.id).body["module_outputs"] is None


@pytest.mark.parametrize("fault", ["missing", "link", "run_id", "case_kind", "requested_modules"])
def test_actual_engine_identity_pin_must_be_present_local_and_exact(
    actual_run: tuple[Layout, runs.Record, Path], fault: str
) -> None:
    layout, record, directory = actual_run
    path = directory / "identity.json"
    if fault == "missing":
        path.unlink()
    elif fault == "link":
        outside = directory.parent / "outside-identity.json"
        path.rename(outside)
        path.symlink_to(outside)
    else:
        identity = json.loads(path.read_bytes())
        identity["run"][fault] = [] if fault == "requested_modules" else "another"
        path.write_text(json.dumps(identity))
    assert reply(layout, record.id).body["module_outputs"] is None
