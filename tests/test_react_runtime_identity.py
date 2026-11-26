"""R4-011: bind activity metadata to actual synthetic engine run artifacts."""

from __future__ import annotations

import hashlib
import json
import shutil
import threading
from http.client import HTTPConnection
from pathlib import Path

import pytest

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout
from proof import DUMMY_KEY, launcher_command, test_launcher
from react_frontend import make_server
from react_frontend.run_activity import reply


@pytest.fixture(scope="module")
def engine_case(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Retain the offline Example Synthetic Group export for 2025-04-30."""
    retained = tmp_path_factory.mktemp("runtime-engine") / "case"
    with test_launcher.open_offline_scheduler() as scheduler:
        record = test_launcher.run_full_assessment(scheduler, "executed", "gpt", "balanced")
        test_launcher.assert_exported_report(scheduler.layout, record.id, "executed")
        shutil.copytree(scheduler.layout.root, retained)
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
    assert workflow["run"]["run_id"] == "example-2025-04-30-credit_snapshot-copilot-sol-medium"
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


def test_actual_synthetic_adapter_is_classified_at_the_settled_record_api(
    actual_run: tuple[Layout, runs.Record, Path],
) -> None:
    layout, record, directory = actual_run
    workflow = json.loads((directory / "workflow.json").read_bytes())
    assert workflow["execution"] == "live-provider"  # The prepared engine route, not its adapter.
    calls = [json.loads(line) for line in (directory / "live/calls.jsonl").read_text().splitlines()]
    assert len(calls) == 17  # Full: seventeen model calls (2026-11-25)
    assert {call["reported_model"] for call in calls} == {"synthetic"}
    assert {call["request_id"] for call in calls} == {"synthetic"}
    body = reply(layout, record.id).body
    assert body["status"] == "finished"
    assert body["library_admission"] == "listed"
    assert body["execution"] == "synthetic"


def test_actual_adapter_classification_reaches_the_connected_http_record(
    actual_run: tuple[Layout, runs.Record, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    layout, record, _ = actual_run
    web = layout.root / "web-stub"
    (web / "assets").mkdir(parents=True)
    (web / "index.html").write_text(
        '<html><head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'">'
        '<script src="./assets/app.js"></script></head><body></body></html>'
    )
    (web / "assets/app.js").write_text("void 0")
    monkeypatch.setenv("OPENAI_API_KEY", DUMMY_KEY)
    with make_server(
        layout.root, web=web, launcher=launcher_command(), synthetic=True, read_only=True
    ) as server:
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
        try:
            connection.request("GET", f"/connected/activity/{record.id}")
            response = connection.getresponse()
            body = json.loads(response.read())
            assert response.status == 200
            assert response.getheader("Cache-Control") == "no-store"
            assert body["execution"] == "synthetic"
            assert body["status"] == "finished"
            assert len(body["module_outputs"]) == 17
        finally:
            connection.close()
            server.shutdown()
            thread.join()


def test_synthetic_issuer_data_does_not_reclassify_actual_provider_call_provenance(
    actual_run: tuple[Layout, runs.Record, Path],
) -> None:
    """Alter retained metadata only; this control never invokes a provider."""
    layout, record, directory = actual_run
    assert json.loads((directory / "workflow.json").read_bytes())["run"]["case_kind"] == "synthetic"
    path = directory / "live/calls.jsonl"
    calls = [json.loads(line) for line in path.read_text().splitlines()]
    for call in calls:
        call.update(reported_model="gpt-6.1-sol", request_id="provider-request-identity")
    path.write_text("".join(json.dumps(call) + "\n" for call in calls))
    assert reply(layout, record.id).body["execution"] == "live-provider"


@pytest.mark.parametrize(
    "fault",
    [
        "mixed",
        "model-only",
        "request-only",
        "partial",
        "non-object",
        "schema",
        "link",
        "missing-workflow",
        "missing-identity",
        "workflow-identity",
        "run_id",
        "case_id",
        "pathway",
        "config_id",
        "module_id",
    ],
)
def test_actual_adapter_classification_refuses_partial_mixed_or_unbound_provenance(
    actual_run: tuple[Layout, runs.Record, Path], fault: str
) -> None:
    layout, record, directory = actual_run
    path = directory / "live/calls.jsonl"
    calls = [json.loads(line) for line in path.read_text().splitlines()]
    if fault == "mixed":
        calls[0].update(reported_model="gpt-6.1-sol", request_id="provider-request-identity")
    elif fault in {"model-only", "request-only"}:
        calls[0]["request_id" if fault == "model-only" else "reported_model"] = None
    elif fault in {"run_id", "case_id", "pathway", "config_id", "module_id"}:
        calls[0][fault] = "another"
    elif fault == "schema":
        calls[0]["schema_version"] = "unrecognised"
    if fault in {"partial", "non-object"}:
        with path.open("a") as stream:
            stream.write('{"schema_version":' if fault == "partial" else "[]\n")
    elif fault == "link":
        outside = directory.parent / "outside-calls.jsonl"
        path.rename(outside)
        path.symlink_to(outside)
    else:
        path.write_text("".join(json.dumps(call) + "\n" for call in calls))
    if fault in {"missing-workflow", "missing-identity"}:
        (directory / ("workflow.json" if fault == "missing-workflow" else "identity.json")).unlink()
    elif fault == "workflow-identity":
        workflow = json.loads((directory / "workflow.json").read_bytes())
        workflow["run"]["issuer_id"] = "another"
        (directory / "workflow.json").write_text(json.dumps(workflow))
        (directory / "identity.json").write_text(json.dumps({"run": workflow["run"]}))
    assert reply(layout, record.id).body["execution"] is None


@pytest.mark.parametrize("mode", ["host-session", "retained-response-replay", "synthetic", None])
def test_actual_adapter_does_not_replace_explicit_non_provider_or_unknown_execution(
    actual_run: tuple[Layout, runs.Record, Path], mode: str | None
) -> None:
    layout, record, directory = actual_run
    workflow = json.loads((directory / "workflow.json").read_bytes())
    workflow["execution"] = mode
    (directory / "workflow.json").write_text(json.dumps(workflow))
    assert reply(layout, record.id).body["execution"] == mode


@pytest.mark.parametrize("missing", [False, True])
def test_missing_or_not_started_call_journal_preserves_the_prepared_provider_route(
    actual_run: tuple[Layout, runs.Record, Path], missing: bool
) -> None:
    layout, record, directory = actual_run
    path = directory / "live/calls.jsonl"
    if missing:
        path.unlink()
    else:
        path.write_text("")
    assert reply(layout, record.id).body["execution"] == "live-provider"


@pytest.mark.parametrize("status", ["running", "failed"])
def test_recorded_adapter_provenance_does_not_change_run_outcome(
    actual_run: tuple[Layout, runs.Record, Path], status: runs.Status
) -> None:
    layout, record, _ = actual_run
    record.status = status
    record.reason = "stopped: checker" if status == "failed" else ""
    runs.save(layout, record)
    body = reply(layout, record.id).body
    assert body["execution"] == "synthetic"
    assert body["status"] == status
    assert body["stopped_by"] == ("checker" if status == "failed" else "")


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
