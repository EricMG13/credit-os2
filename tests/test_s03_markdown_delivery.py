"""S03 C1 fix A: comment spans, table recognition, fenced headings, named errors, Gaps items."""

from __future__ import annotations

import pytest

from deploy_workflow.markdown_delivery import (
    _headings_with_content,
    gap_limitations,
    literal_module,
)


def handoff(findings: str, gaps: str = "None.") -> str:
    return (
        "# CP-1\n\n## Request\nAsk.\n\n## Sources\nSrc.\n\n"
        f"## Findings\n{findings}\n\n## Calculations\nCalc.\n\n## Gaps\n{gaps}\n\n"
        "## Next module\nCP-2\n"
    )


def prose_texts(raw: str) -> list[str]:
    view = literal_module("CP-1", raw.encode())[0]
    return [f.text for f in view.facts if f.table_id.startswith("prose-") and f.text]


def test_single_line_comment_keeps_following_text() -> None:
    raw = handoff("<!-- reviewed --> Leverage rose to 4.1x, above the covenant level.")
    assert "Leverage rose to 4.1x, above the covenant level." in prose_texts(raw)
    findings = [h for h in _headings_with_content(raw, "CP-1") if h[1] == "Findings"]
    assert findings == [(findings[0][0], "Findings", True, False)]


def test_comment_only_line_contributes_nothing() -> None:
    raw = handoff("<!-- reviewed -->")
    assert all("reviewed" not in t for t in prose_texts(raw))
    assert [h for h in _headings_with_content(raw, "CP-1") if h[1] == "Findings"] == []


TABLE = "| Metric | FY24 |\n|---|---| \n| Revenue | 10 |"


def test_separator_with_trailing_space_is_a_table() -> None:
    view = literal_module("CP-1", handoff(TABLE).encode())[0]
    assert [t.row_header for t in view.tables if t.table_id.startswith("raw-")] == ["Metric"]
    found = [h for h in _headings_with_content(handoff(TABLE), "CP-1") if h[1] == "Findings"]
    assert found[0][2:] == (False, True)


def test_indented_table_is_a_table() -> None:
    raw = handoff("  | Metric | FY24 |\n  |---|---|\n  | Revenue | 10 |")
    view = literal_module("CP-1", raw.encode())[0]
    assert [t.row_header for t in view.tables if t.table_id.startswith("raw-")] == ["Metric"]
    found = [h for h in _headings_with_content(raw, "CP-1") if h[1] == "Findings"]
    assert found[0][2:] == (False, True)


def test_heading_inside_fence_does_not_retitle_table() -> None:
    raw = handoff("```\n# Fake heading\n```\n\n" + TABLE)
    view = literal_module("CP-1", raw.encode())[0]
    titles = [t.title for t in view.tables if t.table_id.startswith("raw-")]
    assert titles == ["Findings — Metric"]


def test_table_before_first_heading_is_value_error() -> None:
    raw = "| A | B |\n|---|---|\n| x | 1 |\n\n" + handoff("Text.")
    with pytest.raises(ValueError, match="before the first heading"):
        literal_module("CP-1", raw.encode())


def test_unknown_module_id_is_value_error() -> None:
    with pytest.raises(ValueError, match="NOT-A-MODULE"):
        literal_module("NOT-A-MODULE", handoff("Text.").encode())


def test_gap_list_items_are_separate_limitations() -> None:
    gaps = "- **G1**: FY2023 segment data not supplied.\n- **G2**: No covenant package.\n"
    assert gap_limitations(handoff("x", gaps)) == (
        "G1: FY2023 segment data not supplied.",
        "G2: No covenant package.",
    )
    numbered = "1. First gap.\n   wraps here.\n2. Second gap."
    assert gap_limitations(handoff("x", numbered)) == ("First gap. wraps here.", "Second gap.")
