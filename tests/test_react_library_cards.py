"""C1-008: compact cards preserve designated module prose and its exact provenance."""

from __future__ import annotations

import json
from typing import Any

import pytest

from deploy_workflow.inbox.layout import Layout
from react_frontend import _library_index


def publication(
    tmp_path: Any,
    candidates: list[tuple[str, str]],
    pathway: str = "credit_snapshot",
    requested: list[str] | None = None,
) -> Layout:
    layout = Layout(tmp_path)
    workspace: dict[str, Any] = {"runs": {}, "outputs": {}, "handoffs": {}}
    modules = {}
    for index, (code, text) in enumerate(candidates):
        output = f"case/{code}.md"
        sha = str(index + 1) * 64
        modules[code] = {"outputs": [output], "default": output}
        workspace["outputs"][output] = {
            "id": output,
            "module": code,
            "run": "case-key",
            "sha256": sha,
        }
        workspace["handoffs"][sha] = [
            {"heading": "Findings", "level": 2, "line": 1, "blocks": []},
            {
                "heading": "Bottom line",
                "level": 3,
                "line": 2,
                "blocks": [
                    {"type": "text", "line": 3, "end": 4, "text": text},
                ],
            },
            {
                "heading": "Key findings",
                "level": 3,
                "line": 5,
                "blocks": [
                    {"type": "text", "line": 6, "end": 6, "text": "X" * 100_000},
                ],
            },
        ]
    workspace["runs"]["case-key"] = {
        "folder": "case",
        "issuerKey": "issuer",
        "pathway": pathway,
        "publicationVerified": True,
        "modules": modules,
        **({} if requested is None else {"requested": requested}),
    }
    snapshot = {"catalogue": {"real": []}, "workspace": workspace, "chips": {}, "activity": {}}
    library = layout.engine / "library"
    library.mkdir(parents=True)
    (library / "data.js").write_text(
        f"window.CREDIT_OS_DATA={json.dumps(snapshot)};", encoding="utf-8"
    )
    return layout


def test_card_lead_keeps_exact_paragraph_basis_and_source_identity(tmp_path: Any) -> None:
    text = "Debt is USD 3,105m; cover is 2.67x.\nBasis: filing.txt, p. 2."
    reply = _library_index(publication(tmp_path, [("CP-2", text)]))
    assert reply.body["workspace"]["runs"]["case-key"]["lead"] == {
        "module": "CP-2",
        "output": "case/CP-2.md",
        "sha256": "1" * 64,
        "line": 3,
        "text": text,
    }
    assert len(json.dumps(reply.body)) < 2000
    assert "X" * 100 not in json.dumps(reply.body)


@pytest.mark.parametrize(
    ("candidates", "pathway", "expected"),
    [
        ([("CP-2", "Fundamental view."), ("CP-6", "Committee view.")], "credit_snapshot", "CP-2"),
        (
            [("CP-6", "Not assessable: no inputs."), ("CP-2", "Credit view.")],
            "credit_snapshot",
            "CP-2",
        ),
        ([("CP-L10", "Snapshot view."), ("CP-2", "Credit view.")], "short_snapshot", "CP-L10"),
        ([("CP-1B", "Earnings view.")], "earnings_update", "CP-1B"),
        (
            [("CP-L10", "Screening view."), ("CP-2", "Credit view.")],
            "credit_screening",
            "CP-L10",
        ),
    ],
)
def test_card_lead_uses_the_pathways_verified_analytical_owner(
    tmp_path: Any,
    candidates: list[tuple[str, str]],
    pathway: str,
    expected: str,
) -> None:
    reply = _library_index(publication(tmp_path, candidates, pathway))
    assert reply.body["workspace"]["runs"]["case-key"]["lead"]["module"] == expected


@pytest.mark.parametrize(
    ("requested", "candidates", "expected"),
    [
        # Covenant Capacity: the last planned module with a usable Bottom line.
        (["CP-0", "CP-1", "CP-4", "CP-8"], [("CP-1", "Base."), ("CP-4", "Covenant view.")], "CP-4"),
        # Governance and ESG: CP-2E is last in planned order; CP-1A leads when CP-2E has none.
        (
            ["CP-0", "CP-1", "CP-1A", "CP-2E"],
            [("CP-1A", "Business view."), ("CP-2E", "Rates view.")],
            "CP-2E",
        ),
        (["CP-0", "CP-1", "CP-1A", "CP-2E"], [("CP-1A", "Business view.")], "CP-1A"),
        (
            ["CP-0", "CP-1", "CP-1A", "CP-2E"],
            [("CP-2E", "Not assessable: no inputs."), ("CP-1A", "Business view.")],
            "CP-1A",
        ),
        # CP-2 leads whenever it delivered a usable entry.
        (
            ["CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"],
            [("CP-6", "Committee view."), ("CP-2", "Credit view.")],
            "CP-2",
        ),
        # CP-0 and CP-5 never lead; a decision module's passage is never a card's lead.
        (
            ["CP-0", "CP-1", "CP-5", "CP-6"],
            [
                ("CP-0", "Sources."),
                ("CP-1", "Base."),
                ("CP-5", "Evidence."),
                ("CP-6", "Committee."),
            ],
            "CP-1",
        ),
    ],
)
def test_card_lead_of_a_custom_run_is_cp2_else_the_last_planned_module_with_a_usable_view(
    tmp_path: Any, requested: list[str], candidates: list[tuple[str, str]], expected: str
) -> None:
    layout = publication(tmp_path, candidates, "custom", requested)
    assert (
        _library_index(layout).body["workspace"]["runs"]["case-key"]["lead"]["module"] == expected
    )


def test_card_lead_of_a_custom_run_with_only_excluded_modules_is_none(tmp_path: Any) -> None:
    held = [("CP-0", "Sources."), ("CP-5", "Evidence."), ("CP-6", "Committee view.")]
    layout = publication(tmp_path, held, "custom", ["CP-0", "CP-5", "CP-6"])
    assert _library_index(layout).body["workspace"]["runs"]["case-key"]["lead"] is None


def test_earnings_output_does_not_lead_another_pathway(tmp_path: Any) -> None:
    reply = _library_index(publication(tmp_path, [("CP-1B", "Earnings view.")]))
    assert reply.body["workspace"]["runs"]["case-key"].get("lead") is None


def test_report_metadata_marks_declared_not_assessable_without_changing_delivery(
    tmp_path: Any,
) -> None:
    from react_frontend import _report_entries

    layout = publication(
        tmp_path, [("CP-2", "Credit view."), ("CP-6", "Not assessable: no inputs.")]
    )
    raw = (layout.engine / "library" / "data.js").read_text()
    snapshot = json.loads(raw.removeprefix("window.CREDIT_OS_DATA=").removesuffix(";"))
    snapshot["catalogue"]["real"] = [{"id": "case", "name": "Issuer", "date": "2026-03-31"}]
    metadata = _report_entries(snapshot)["case"]
    assert metadata["not_assessable"] == ["CP-6"]
    assert metadata["id"] == "case"
    assert metadata["pathway"] == "credit_snapshot"
    assert _report_entries(None) == {}


def test_card_never_uses_another_runs_or_unselected_output(tmp_path: Any) -> None:
    layout = publication(tmp_path, [("CP-6", "Committee view."), ("CP-2", "Current credit view.")])
    path = layout.engine / "library" / "data.js"
    snapshot = json.loads(path.read_text().removeprefix("window.CREDIT_OS_DATA=").removesuffix(";"))
    output = snapshot["workspace"]["outputs"]["case/CP-2.md"]
    output["run"] = "other-key"
    path.write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};", encoding="utf-8")
    assert _library_index(layout).body["workspace"]["runs"]["case-key"]["lead"] is None
    output["run"] = "case-key"
    snapshot["workspace"]["runs"]["case-key"]["modules"]["CP-2"]["default"] = None
    path.write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};", encoding="utf-8")
    assert _library_index(layout).body["workspace"]["runs"]["case-key"]["lead"] is None


def test_card_does_not_draw_a_bottom_line_from_an_audit_section(tmp_path: Any) -> None:
    layout = publication(tmp_path, [("CP-2", "Audit words only.")])
    path = layout.engine / "library" / "data.js"
    snapshot = json.loads(path.read_text().removeprefix("window.CREDIT_OS_DATA=").removesuffix(";"))
    snapshot["workspace"]["handoffs"]["1" * 64][0]["heading"] = "Request"
    path.write_text(f"window.CREDIT_OS_DATA={json.dumps(snapshot)};", encoding="utf-8")
    assert _library_index(layout).body["workspace"]["runs"]["case-key"].get("lead") is None


def test_blocked_metadata_follows_the_readers_first_nonempty_level_three_rule(
    tmp_path: Any,
) -> None:
    from react_frontend import _report_entries

    layout = publication(tmp_path, [("CP-6", "Not assessable: no inputs.")])
    path = layout.engine / "library" / "data.js"
    snapshot = json.loads(path.read_text().removeprefix("window.CREDIT_OS_DATA=").removesuffix(";"))
    snapshot["catalogue"]["real"] = [{"id": "case", "name": "Issuer", "date": "2026-03-31"}]
    snapshot["workspace"]["handoffs"]["1" * 64][:0] = [
        {"heading": "Request", "level": 2, "line": 1, "blocks": []},
        {
            "heading": "Inputs",
            "level": 3,
            "line": 2,
            "blocks": [
                {"type": "text", "line": 3, "end": 3, "text": "Source inputs."},
            ],
        },
    ]
    assert "not_assessable" not in _report_entries(snapshot)["case"]
    snapshot["workspace"]["outputs"]["case/CP-6.md"]["state"] = {"established": False}
    assert _report_entries(snapshot)["case"]["not_assessable"] == ["CP-6"]


def test_a_custom_run_names_the_modules_it_delivered_and_a_preset_run_does_not(
    tmp_path: Any,
) -> None:
    """Ruling C21: the library entry asks whether a custom run delivered Fundamental credit."""
    held = [("CP-1", "Base."), ("CP-4", "Covenant view.")]
    custom = _library_index(publication(tmp_path, held, "custom", ["CP-0", "CP-1", "CP-4"]))
    assert custom.body["workspace"]["runs"]["case-key"]["delivered"] == ["CP-1", "CP-4"]
    preset = _library_index(publication(tmp_path / "p", held, "credit_snapshot"))
    assert "delivered" not in preset.body["workspace"]["runs"]["case-key"]
