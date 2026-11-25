"""Focused checks for the native publication facts consumed by the React report reader."""

import json
from pathlib import Path
from typing import Any

import pytest
import update_library
from library_fixtures import make_run, method, rewrite_completion

from deploy_workflow.inbox.layout import Layout
from deploy_workflow.library_index import (
    Library,
    assessment_scope,
    build_library,
    publication_time,
    sha256,
)
from react_frontend import _library_index, _visible_scope
from react_frontend.library_cards import lead_summary


@pytest.mark.parametrize(
    ("selection", "requested", "delivered", "scope"),
    [
        ("preset", ["CP-2", "CP-8"], ["CP-1", "CP-2"], "standard"),
        ("preset", ["CP-2", "CP-8"], ["CP-1", "CP-2", "CP-8"], "standard"),
        ("preset", ["CP-2", "CP-8"], ["CP-2", "CP-8"], "partial"),
        ("explicit", ["CP-2"], ["CP-1", "CP-2"], "partial"),
        ("preset", ["CP-8"], ["CP-8"], "partial"),
        (None, ["CP-2"], ["CP-1", "CP-2"], "unverified"),
    ],
)
def test_assessment_scope_uses_the_frozen_plan(
    selection: str | None, requested: list[str], delivered: list[str], scope: str
) -> None:
    run = {"requested_modules": requested}
    instructions = dict.fromkeys({"CP-1", *requested})
    verified = {
        "manifest": {"run": run},
        "handoffs": dict.fromkeys(delivered),
        "delivery_sha256": "verified",
    }
    workflow = {
        "run": run,
        "selection": selection,
        "instructions": instructions,
        "preset_requested_modules": ["CP-2"],
    }
    assert assessment_scope(workflow, verified) == scope
    assert assessment_scope(workflow, {**verified, "delivery_sha256": None}) == "unverified"
    assert assessment_scope(workflow, {**verified, "manifest": {"run": {}}}) == "unverified"


def test_a_run_with_test_adaptations_is_never_standard() -> None:
    run = {"requested_modules": ["CP-2", "CP-8"]}
    verified = {
        "manifest": {"run": run},
        "handoffs": dict.fromkeys(["CP-1", "CP-2"]),
        "delivery_sha256": "verified",
    }
    workflow = {
        "run": run,
        "selection": "preset",
        "instructions": dict.fromkeys(["CP-1", "CP-2", "CP-8"]),
        "preset_requested_modules": ["CP-2"],
    }
    assert assessment_scope(workflow, verified) == "standard"
    flagged = {**workflow, "test_adaptations": ["test-assume-distress"]}
    assert assessment_scope(flagged, verified) == "partial"
    assert assessment_scope(flagged, {**verified, "delivery_sha256": None}) == "unverified"


def test_native_scope_requires_the_completion_to_pin_the_workflow(tmp_path: Path) -> None:
    directory = make_run(tmp_path, "acme", report_page=False)
    workflow = directory / "workflow.json"
    data = json.loads(workflow.read_bytes())
    data["preset_requested_modules"] = ["CP-0", "CP-1"]
    workflow.write_text(json.dumps(data))
    digest = sha256(workflow.read_bytes())
    page = tmp_path / "library"
    assert build_library(tmp_path, page, method()).runs[0]["assessmentScope"] == "unverified"

    rewrite_completion(directory, lambda value: value.update(workflow_sha256=digest))
    assert build_library(tmp_path, page, method()).runs[0]["assessmentScope"] == "standard"

    workflow.write_text(json.dumps({**data, "selection": "explicit"}))
    assert build_library(tmp_path, page, method()).runs[0]["assessmentScope"] == "unverified"


@pytest.mark.parametrize(
    ("recorded", "published"),
    [
        ("2026-01-31T21:32:03+02:00", "2026-01-31T19:32:03+00:00"),
        ("2026-02-30T21:32:03+00:00", None),
        ("2026-01-31T21:32:03", None),
        ("2026-01-31", None),
        ("0001-01-01T00:00:00+02:00", None),
        (None, None),
    ],
)
def test_publication_time_requires_an_explicit_timezone(
    recorded: str | None, published: str | None
) -> None:
    assert (
        publication_time({"published_at": recorded, "started_at": "2026-01-30T21:00:00Z"})
        == published
    )


def _report(
    primary: str | None,
    *,
    pathway: str = "credit_snapshot",
    later: str | None = None,
    focus: str = "CP-6",
) -> dict[str, Any]:
    modules, handoffs, outputs = {}, {}, {}
    for code, text in [
        ("CP-6", primary),
        ("CP-2", "Leverage is 3.50x.\nBasis: Annual.pdf p. 2."),
        ("CP-1B", "Quarterly EBITDA fell 3.2%."),
    ]:
        identifier = f"acme/{code}.md"
        digest = sha256(identifier.encode())
        modules[code] = {"default": identifier, "outputs": [identifier]}
        outputs[identifier] = {"module": code, "id": identifier, "run": "acme", "sha256": digest}
        text = primary if code == focus else text
        paragraphs = [] if text is None else [{"type": "text", "line": 7, "text": text}]
        if code == focus and later is not None:
            paragraphs.append({"type": "text", "line": 10, "text": later})
        handoffs[digest] = [
            {"level": 2, "heading": "Findings", "blocks": []},
            {"level": 3, "heading": "Bottom line", "blocks": paragraphs},
        ]
    run = {
        "folder": "acme",
        "issuerKey": "issuer:acme",
        "pathway": pathway,
        "publicationVerified": True,
        "assessmentScope": "standard",
        "publishedAt": "2026-01-31T19:32:03+00:00",
        "modules": modules,
    }
    return {
        "catalogue": {"real": [{"id": "acme"}]},
        "workspace": {"runs": {"acme": run}, "outputs": outputs, "handoffs": handoffs},
        "activity": {},
        "chips": {},
    }


@pytest.mark.parametrize(
    ("first", "later", "pathway", "expected"),
    [
        (None, None, "credit_snapshot", ("CP-2", 7)),
        ("Analysis rests on annual.pdf.", None, "credit_snapshot", ("CP-2", 7)),
        ("The company has improved leverage. See page 508.", None, "credit_snapshot", ("CP-2", 7)),
        (
            "Final Action Bias: Add / Increase.",
            "Leverage has fallen 1 pp over two years.",
            "credit_snapshot",
            ("CP-2", 7),
        ),
        ("Stable fundamentals. [annual.pdf]", None, "credit_snapshot", ("CP-2", 7)),
        (
            "Not assessable: price is missing.",
            "Credit quality improved.",
            "credit_snapshot",
            ("CP-2", 7),
        ),
        ("Stable fundamentals.", None, "earnings_update", ("CP-1B", 7)),
    ],
)
def test_index_and_scoped_reader_share_the_designated_lead(
    tmp_path: Path,
    first: str | None,
    later: str | None,
    pathway: str,
    expected: tuple[str, int],
) -> None:
    layout = Layout(tmp_path)
    publication = layout.engine / "library" / "data.js"
    publication.parent.mkdir(parents=True)
    publication.write_text(
        "window.CREDIT_OS_DATA=" + json.dumps(_report(first, pathway=pathway, later=later)) + ";"
    )
    index = _library_index(layout).body["workspace"]["runs"]["acme"]
    _, scoped = _visible_scope(layout, "acme")
    assert scoped is not None
    workspace = scoped["workspace"]
    current = workspace["runs"]["acme"]
    assert (current["assessmentScope"], current["publishedAt"]) == (
        "standard",
        index["publishedAt"],
    )
    assert index["lead"] == current["lead"]
    lead = index["lead"]
    owner, line = expected
    output = f"acme/{owner}.md"
    assert (lead["module"], lead["output"], lead["sha256"], lead["line"]) == (
        owner,
        output,
        workspace["outputs"][output]["sha256"],
        line,
    )


def test_committee_hold_is_bound_to_the_verified_output_and_survives_to_the_reader(
    tmp_path: Path,
) -> None:
    layout = Layout(tmp_path)
    report = _report("Final Action Bias: Add / Increase.")
    store = report["workspace"]
    run = store["runs"]["acme"]
    digest = store["outputs"]["acme/CP-6.md"]["sha256"]
    directory = layout.runs / "acme" / "deliveries" / "result"
    directory.mkdir(parents=True)
    path = directory / "report-view.json"
    body = b'{"schema_version":"report-view/1","call_withheld":"blocked"}'
    path.write_bytes(body)
    verified = {
        "delivery_sha256": "verified",
        "folder": "deliveries/result",
        "files": {"report-view.json": sha256(body)},
        "handoffs": {"CP-6": {"sha256": digest}},
    }
    library = Library(runs=[{"id": "acme"}], deliveries={"acme": verified})
    update_library.publication_fields(layout.engine, store, library)
    publication = layout.engine / "library" / "data.js"
    publication.parent.mkdir()
    publication.write_text("window.CREDIT_OS_DATA=" + json.dumps(report) + ";")
    _, scoped = _visible_scope(layout, "acme")
    assert scoped is not None
    published = scoped["workspace"]["runs"]["acme"]
    assert published["lead"]["module"] == "CP-2"
    assert published["actionTreatment"]["CP-6"] == {
        "output": "acme/CP-6.md",
        "sha256": digest,
        "state": "withheld",
        "scope": "committee",
        "reason": "The committee decision was withheld because its assessment was blocked.",
    }

    output = store["outputs"]["acme/CP-6.md"]
    treatment = update_library.action_treatment
    action = lambda: treatment(layout.runs / "acme", store, "acme", verified)
    output["sha256"] = "other"
    assert action() == {}
    output["sha256"] = digest
    path.write_bytes(
        b'{"schema_version":"report-view/1","call_withheld":null,'
        b'"call":[{"value_text":"Add / Increase"}]}'
    )
    assert action() == {}
    verified["files"]["report-view.json"] = sha256(path.read_bytes())
    assert action() == {}
    assert run["assessmentScope"] is None


@pytest.mark.parametrize(
    ("pathway", "owner", "heading"),
    [
        ("credit_snapshot", "CP-2", "Credit view"),
        ("earnings_update", "CP-1B", "Variance mechanics and comparative credit evaluation"),
        ("covenant_refinancing", "CP-2D", "Liquidity view"),
        ("distressed_restructuring", "CP-2A", "Distress gate"),
        ("relative_value", "CP-3D", "Market-implied view"),
    ],
)
def test_reader_selects_the_first_safe_paragraph_in_a_published_finding(
    pathway: str, owner: str, heading: str
) -> None:
    workspace = _report(None, pathway=pathway)["workspace"]
    run = workspace["runs"]["acme"]
    identifier = f"acme/{owner}.md"
    digest = sha256(identifier.encode())
    run["modules"][owner] = {"default": identifier, "outputs": [identifier]}
    output = {"module": owner, "id": identifier, "run": "acme", "sha256": digest}
    workspace["outputs"][identifier] = output
    workspace["handoffs"][digest] = [
        {"level": 2, "heading": "Findings", "blocks": []},
        {
            "level": 3,
            "heading": heading,
            "blocks": [
                {"type": "text", "line": 5, "text": "Initial results are in deck.pptx."},
                {"type": "text", "line": 6, "text": "The debt schedule at Q page:47 changed."},
                {"type": "text", "line": 7, "text": "Compare H4 table 51."},
                {"type": "text", "line": 9, "text": "Recurrence belongs in CP-1D."},
                {
                    "type": "text",
                    "line": 10,
                    "text": "The 2029 note is our preferred instrument at 98."
                    if pathway == "relative_value"
                    else "Sales increased 3 pp from the prior quarter.",
                },
            ],
        },
    ]
    lead = lead_summary(workspace, run, "acme")
    if pathway == "relative_value":
        assert lead is None
        return
    assert lead is not None
    assert (lead["module"], lead["output"], lead["sha256"], lead["line"]) == (
        owner,
        identifier,
        digest,
        10,
    )
    output["state"] = {"declared": "Blocked"}
    assert lead_summary(workspace, run, "acme") is None


def test_library_binds_the_published_output_instead_of_a_later_numbered_attempt(
    tmp_path: Path,
) -> None:
    layout = Layout(tmp_path)
    directory = make_run(layout.engine, "acme", modules=("CP-0", "CP-1", "CP-2"), report_page=False)
    for attempt in ("2", "99"):
        (directory / f"CP-2-attempt-{attempt}.md").write_text(
            f"## Findings\n\n### Bottom line\n\nLater unselected attempt {attempt}.\n"
        )
    page = layout.engine / "library"
    library = build_library(layout.engine, page, method())
    update_library.build_into(page, layout.engine, library)
    expected = library.deliveries["acme"]["handoffs"]["CP-2"]["sha256"]
    _, scoped = _visible_scope(layout, "acme")
    assert scoped is not None
    workspace = scoped["workspace"]
    module = workspace["runs"]["acme"]["modules"]["CP-2"]
    assert workspace["runs"]["acme"]["publicationVerified"] is True
    assert workspace["outputs"][module["default"]]["sha256"] == expected
    assert "acme/CP-2-attempt-99.md" in module["outputs"]
    assert "acme/CP-2-attempt-2.md" in module["outputs"]
    assert (page / "downloads/acme/CP-2.md").is_file()
    assert sha256((page / "downloads/acme/CP-2.md").read_bytes()) == expected
    assert _library_index(layout).body["workspace"]["runs"]["acme"]["lead"] is None


def test_unmarked_legacy_publication_keeps_modules_without_endorsing_an_attempt(
    tmp_path: Path,
) -> None:
    layout = Layout(tmp_path)
    report = _report("Newer unverified attempt.", focus="CP-2")
    workspace = report["workspace"]
    record = workspace["runs"]["acme"]
    record.pop("publicationVerified")
    record["actionTreatment"] = {"CP-6": {"state": "withheld"}}
    chosen = "acme/CP-2-attempt-99.md"
    output = workspace["outputs"].pop("acme/CP-2.md")
    workspace["outputs"][chosen] = {**output, "id": chosen}
    record["modules"]["CP-2"] = {"default": chosen, "outputs": [chosen]}
    legacy_lead = lead_summary(workspace, record, "acme")
    assert legacy_lead is not None and legacy_lead["output"] == chosen
    publication = layout.engine / "library" / "data.js"
    publication.parent.mkdir(parents=True)
    publication.write_text("window.CREDIT_OS_DATA=" + json.dumps(report) + ";")

    index = _library_index(layout).body["workspace"]["runs"]["acme"]
    _, scoped = _visible_scope(layout, "acme")
    assert scoped is not None
    shown = scoped["workspace"]["runs"]["acme"]
    for projection in (index, shown):
        assert projection["publicationVerified"] is False
        assert projection["lead"] is None
        assert projection["assessmentScope"] == "unverified"
        assert projection["publishedAt"] is None
        assert "actionTreatment" not in projection
    assert shown["modules"]["CP-2"]["default"] == chosen
    assert chosen in scoped["workspace"]["outputs"]


def test_designation_marker_requires_all_verified_handoffs() -> None:
    from credit_os.store import designate_published_outputs

    workspace = _report(None)["workspace"]
    runs, outputs = workspace["runs"], workspace["outputs"]
    digest = outputs["acme/CP-2.md"]["sha256"]
    designate_published_outputs(runs, outputs, {"acme": {"CP-2": digest, "CP-4": "missing"}})

    assert runs["acme"]["publicationVerified"] is False
    assert runs["acme"]["modules"]["CP-2"]["default"] == "acme/CP-2.md"
