"""C1-028/C5-033: existing accepted bytes supply display metadata, never new analysis."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import pytest

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.run_events import append_event
from react_frontend.run_activity import reply


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


BLOCKED = (
    b"# CP-0\n\n## Findings\n\n### Bottom line\nNot assessable: the source set is incomplete.\n"
)
READABLE = b"# CP-0\n\n## Findings\n\n### Bottom line\nThe recorded source set is complete.\n"
INSTRUCTIONS = "Recorded instructions."


def candidate(
    directory: Path,
    workflow: dict[str, Any],
    response: bytes,
    *,
    attempt: int = 1,
    retained: bool = False,
) -> Path:
    inputs = {
        "run": workflow["run"],
        "module_id": "CP-0",
        "instructions": INSTRUCTIONS,
        "sources": {"filing.txt": "a" * 64},
        "handoffs": {},
        "retained_response_sha256": digest(response) if retained else None,
    }
    fingerprint = digest(json.dumps(inputs, sort_keys=True).encode())
    folder = directory / "requests" / "CP-0" / fingerprint
    folder.mkdir(parents=True, exist_ok=True)
    request = {**inputs, "attempt": attempt, "feedback": []}
    (folder / f"{attempt}.request.json").write_text(json.dumps(request))
    path = folder / f"{attempt}.response.md"
    path.write_bytes(response)
    (folder / f"{attempt}.review.json").write_text(
        json.dumps({"response_sha256": digest(response), "issues": []})
    )
    return path


def runtime(tmp_path: Path, *, retained: bool = False) -> tuple[Layout, Path, dict[str, Any]]:
    layout = Layout(tmp_path)
    layout.state.mkdir(parents=True)
    record = runs.Record(
        id="case",
        folder="case",
        pathway="credit_snapshot",
        status="running",
        claimed_at="2026-11-17T12:00:00Z",
        issuer_id="issuer",
        issuer_name="Issuer",
        as_of="2026-11-17",
    )
    runs.save(layout, record)
    directory = layout.runs / "case"
    directory.mkdir(parents=True)
    workflow: dict[str, Any] = {
        "run": {
            "run_id": "issuer-2026-11-17-credit_snapshot-sol-medium",
            "issuer_id": "issuer",
            "issuer_name": "Issuer",
            "as_of": "2026-11-17",
            "pathway": "credit_snapshot",
            "requested_modules": ["CP-0", "CP-1"],
        },
        "instructions": {
            code: {"path": f"instructions/{code}.md", "sha256": digest(INSTRUCTIONS.encode())}
            for code in ("CP-0", "CP-1")
        },
        "sources": {"filing.txt": {"path": "inputs/filing", "sha256": "a" * 64}},
        "retained_handoffs": {
            "CP-0": {
                "path": "inputs/retained",
                "sha256": digest(BLOCKED),
                "source_hashes": {"filing.txt": "a" * 64},
                "upstream": {},
            }
        }
        if retained
        else {},
        "execution": "synthetic",
    }
    (directory / "workflow.json").write_text(json.dumps(workflow))
    (directory / "identity.json").write_text(json.dumps({"run": workflow["run"]}))
    path = candidate(directory, workflow, BLOCKED, retained=retained)
    append_event(directory, "module_started", module="CP-0")
    append_event(directory, "module_accepted", module="CP-0")
    append_event(directory, "module_started", module="CP-1")
    return layout, path, workflow


def output(sha: str | None, provenance: str | None, assessment: str | None) -> dict[str, Any]:
    return {
        "module": "CP-0",
        "assessment": assessment,
        "provenance": provenance,
        "response_sha256": sha,
    }


@pytest.mark.parametrize("retained", [False, True])
def test_live_accepted_blocked_response_has_exact_provenance_without_changing_execution_counts(
    tmp_path: Path, retained: bool
) -> None:
    layout, _, _ = runtime(tmp_path, retained=retained)
    body = reply(layout, "case").body
    assert body["module_outputs"] == [
        output(
            digest(BLOCKED), "retained-response" if retained else "new-response", "not-assessable"
        )
    ]
    assert body["status"] == "running"
    assert body["modules"] == [["CP-0", "done"], ["CP-1", "running"], ["Report", "waiting"]]


@pytest.mark.parametrize(
    "fault",
    ["hash", "issues", "fingerprint", "identity", "instruction", "source", "link", "ambiguous"],
)
def test_untrusted_or_ambiguous_candidate_is_an_explicit_unknown(
    tmp_path: Path, fault: str
) -> None:
    layout, response, workflow = runtime(tmp_path)
    request = response.with_suffix(".json").with_name("1.request.json")
    review = response.with_name("1.review.json")
    if fault == "hash":
        response.write_bytes(READABLE)
    elif fault == "issues":
        review.write_text(json.dumps({"response_sha256": digest(BLOCKED), "issues": ["refused"]}))
    elif fault in {"fingerprint", "identity", "instruction", "source"}:
        value = json.loads(request.read_text())
        if fault == "identity":
            value["run"]["run_id"] = "another"
        elif fault == "instruction":
            value["instructions"] = "Another instruction set."
        elif fault == "source":
            value["sources"]["filing.txt"] = "b" * 64
        else:
            value["feedback"] = []
            value["attempt"] = 2
        request.write_text(json.dumps(value))
        if fault != "fingerprint":
            inputs = {
                key: item for key, item in value.items() if key not in {"attempt", "feedback"}
            }
            renamed = request.parent.with_name(digest(json.dumps(inputs, sort_keys=True).encode()))
            request.parent.rename(renamed)
    elif fault == "link":
        outside = tmp_path / "outside.md"
        outside.write_bytes(BLOCKED)
        response.unlink()
        response.symlink_to(outside)
    else:
        candidate(response.parents[3], workflow, READABLE, attempt=2)
    assert reply(layout, "case").body["module_outputs"] == [output(None, None, None)]


def test_a_new_start_does_not_reuse_an_earlier_accepted_assessment(tmp_path: Path) -> None:
    layout, response, _ = runtime(tmp_path)
    append_event(response.parents[3], "module_started", module="CP-0")
    assert reply(layout, "case").body["module_outputs"] == []


def test_a_later_rejected_draft_does_not_reuse_an_old_accepted_assessment(tmp_path: Path) -> None:
    layout, response, _ = runtime(tmp_path)
    append_event(response.parents[3], "draft_rejected", module="CP-0")
    body = reply(layout, "case").body
    assert body["module_outputs"] == [output(None, None, None)]
    assert body["modules"][0] == ["CP-0", "done"]


def test_missing_metadata_is_not_a_recorded_empty_result(tmp_path: Path) -> None:
    layout, response, _ = runtime(tmp_path)
    (response.parents[3] / "workflow.json").unlink()
    assert reply(layout, "case").body["module_outputs"] is None


def publication(layout: Layout, *, listed: bool) -> None:
    snapshot: dict[str, Any] = {
        "catalogue": {
            "real": [{"id": "case", "name": "Issuer", "date": "2026-11-17"}] if listed else []
        },
        "workspace": {
            "runs": {"key": {"folder": "case", "issuerKey": "issuer", "pathway": "credit_snapshot"}}
            if listed
            else {},
            "outputs": {},
            "handoffs": {},
            "models": [],
        },
        "activity": {},
        "chips": {},
    }
    directory = layout.engine / "library"
    directory.mkdir()
    (directory / "data.js").write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};")


@pytest.mark.parametrize(
    ("status", "present", "listed", "expected"),
    [
        ("finished", True, True, "listed"),
        ("finished", True, False, "not-listed"),
        ("running", True, True, "not-listed"),
        ("finished", False, False, None),
    ],
)
def test_library_admission_uses_actual_scoped_membership(
    tmp_path: Path, status: runs.Status, present: bool, listed: bool, expected: str | None
) -> None:
    layout, _, _ = runtime(tmp_path)
    record = runs.load_readable(layout)[0][0]
    record.status = status
    runs.save(layout, record)
    if present:
        publication(layout, listed=listed)
    assert reply(layout, "case").body["library_admission"] == expected


def selection(directory: Path, workflow: dict[str, Any], response: Path) -> None:
    path = response.relative_to(directory).as_posix()
    manifest = {
        "run": workflow["run"],
        "handoffs": {
            "CP-0": {
                "path": path,
                "sha256": digest(response.read_bytes()),
            }
        },
    }
    raw = json.dumps(manifest).encode()
    pin = digest(raw)
    (directory / f"delivery-{pin}.json").write_bytes(raw)
    completion = {
        "kind": "cpos-markdown-delivery/1",
        "delivery_manifest_sha256": pin,
        "modules": {"CP-0": path},
    }
    raw_completion = json.dumps(completion).encode()
    (directory / f"completed-{digest(raw_completion)}.json").write_bytes(raw_completion)


def test_final_selection_resolves_multiple_candidates_without_a_live_event_log(
    tmp_path: Path,
) -> None:
    layout, original, workflow = runtime(tmp_path, retained=True)
    candidate(original.parents[3], workflow, BLOCKED, attempt=2, retained=True)
    selection(original.parents[3], workflow, original)
    (original.parents[3] / "events.jsonl").unlink()
    assert reply(layout, "case").body["module_outputs"] == [
        output(digest(BLOCKED), "retained-response", "not-assessable")
    ]


def test_selected_response_must_belong_to_the_selected_module(tmp_path: Path) -> None:
    layout, original, workflow = runtime(tmp_path)
    request = json.loads(original.with_name("1.request.json").read_text())
    request["module_id"] = "CP-1"
    inputs = {key: value for key, value in request.items() if key not in {"attempt", "feedback"}}
    new_directory = (
        original.parents[2] / "CP-1" / digest(json.dumps(inputs, sort_keys=True).encode())
    )
    new_directory.mkdir(parents=True)
    (new_directory / "1.request.json").write_text(json.dumps(request))
    (new_directory / "1.response.md").write_bytes(BLOCKED)
    (new_directory / "1.review.json").write_text(
        json.dumps({"response_sha256": digest(BLOCKED), "issues": []})
    )
    selection(original.parents[3], workflow, new_directory / "1.response.md")
    assert reply(layout, "case").body["module_outputs"] == [output(None, None, None)]


def test_review_and_request_links_are_never_followed(tmp_path: Path) -> None:
    layout, original, _ = runtime(tmp_path)
    request = original.with_name("1.request.json")
    outside = tmp_path / "request.json"
    request.rename(outside)
    request.symlink_to(outside)
    assert reply(layout, "case").body["module_outputs"] == [output(None, None, None)]


def test_metadata_caps_are_exercised_with_small_inputs(tmp_path: Path) -> None:
    from react_frontend import run_metadata

    layout, _, _ = runtime(tmp_path)
    assert run_metadata._Reads(layout.runs / "case", remaining=10).remaining == 10
    with pytest.raises(OSError):
        run_metadata._Reads(layout.runs / "case", remaining=10).raw("workflow.json")
    with pytest.raises(ValueError, match="too many"):
        run_metadata._Reads(layout.runs / "case", names_remaining=0).names("")


def test_publication_link_and_bad_json_are_unknown_not_not_listed(tmp_path: Path) -> None:
    layout, _, _ = runtime(tmp_path)
    publication(layout, listed=False)
    path = layout.engine / "library/data.js"
    valid = path.read_bytes()
    path.write_text("window.CREDIT_OS_DATA={invalid};")
    assert reply(layout, "case").body["library_admission"] is None
    outside = tmp_path / "publication.js"
    outside.write_bytes(valid)
    path.unlink()
    path.symlink_to(outside)
    assert reply(layout, "case").body["library_admission"] is None


def test_unreadable_publication_shape_does_not_hide_the_run_record(tmp_path: Path) -> None:
    layout, _, _ = runtime(tmp_path)
    publication(layout, listed=False)
    path = layout.engine / "library/data.js"
    value = json.loads(path.read_text().removeprefix("window.CREDIT_OS_DATA=").removesuffix(";"))
    value["workspace"]["runs"] = None
    path.write_text(f"window.CREDIT_OS_DATA={json.dumps(value)};")
    body = reply(layout, "case").body
    assert body["id"] == "case"
    assert body["library_admission"] is None
