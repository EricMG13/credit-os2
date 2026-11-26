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


def test_prose_citation_quote_is_verbatim_source_and_passes_readiness() -> None:
    """C1R-1: the quote of an inline-comment line is the physical text, shown text is not."""
    from deploy_vii.readiness import citation_issues

    raw = handoff("Leverage <!-- x --> rose to 4.1x.")
    view, source, _ = literal_module("CP-1", raw.encode())
    facts = [f for f in view.facts if f.table_id.startswith("prose-") and f.text]
    fact = next(f for f in facts if "Leverage" in f.text)
    assert fact.text == "Leverage rose to 4.1x."
    assert [c.quote for c in fact.citations] == ["Leverage <!-- x --> rose to 4.1x."]
    assert citation_issues(fact.citations, (source,)) == ()


def test_multiline_comment_tail_is_published_and_cited_verbatim() -> None:
    """C1R-2 through the prose path: text after the closing `-->` is a fact with a valid quote."""
    from deploy_vii.readiness import citation_issues

    raw = handoff("<!--\nnote\n--> Leverage rose to 4.1x.")
    view, source, _ = literal_module("CP-1", raw.encode())
    fact = next(f for f in view.facts if f.text and "Leverage" in f.text)
    assert fact.text == "Leverage rose to 4.1x."
    assert "note" not in " ".join(f.text or "" for f in view.facts)
    assert citation_issues(fact.citations, (source,)) == ()


def test_hide_comments_keeps_text_after_closing_line() -> None:
    from deploy_workflow.handoff_delivery import hide_comments

    lines = ["<!--", "note", "--> Leverage rose to 4.1x.", "next"]
    assert hide_comments(lines, "t") == ["", "", " Leverage rose to 4.1x.", "next"]
    lines = ["<!--", "--> kept <!-- again", "hidden", "--> tail"]
    assert hide_comments(lines, "t") == ["", " kept ", "", " tail"]


def test_multiline_comment_in_table_row_with_cell_tail_is_refused() -> None:
    """C1S-1: the closing line ` |` must not be read as a one-cell table row."""
    raw = handoff(
        "| Metric | FY24 |\n|---|---|\n| Revenue | 10 | <!-- note\nmore --> |\n| Cost | 5 |"
    )
    assert raw.splitlines()[12] == "more --> |"
    with pytest.raises(ValueError, match=r"line 13: the text after -->"):
        literal_module("CP-1", raw.encode())


@pytest.mark.parametrize(
    "tail", ["--> | A | B |", "-->## H", "--> ```py", "--> ===", "--> <!-- c --> | x |"]
)
def test_hide_comments_refuses_structural_tail(tail: str) -> None:
    from deploy_workflow.handoff_delivery import hide_comments

    with pytest.raises(ValueError, match="t: line 3"):
        hide_comments(["<!--", "x", tail], "t")


def test_hide_comments_keeps_prose_tail_that_is_not_a_heading() -> None:
    from deploy_workflow.handoff_delivery import hide_comments

    assert hide_comments(["<!--", "x", "--> #1 risk"], "t") == ["", "", " #1 risk"]


@pytest.mark.parametrize("token", ["(0)", "(0.0)"])
def test_chart_route_bracketed_zero_is_positive_zero(token: str) -> None:
    """C1R-3: a bracketed zero is zero, not Decimal('-0')."""
    from deploy_workflow.handoff_delivery import MarkdownRoute
    from deploy_workflow.markdown_delivery import _numeric_observations

    raw = handoff(f"| Metric | FY24 |\n|---|---|\n| Leverage | {token} |")
    view = literal_module("CP-1", raw.encode())[0]
    table = next(t for t in view.tables if t.table_id.startswith("raw-"))
    route = MarkdownRoute(
        module_id="CP-1",
        heading="Findings",
        kind="chart",
        block_id="b",
        figure_id="S.1",
        value_columns=("FY24",),
        chart_unit="x",
    )
    updated = _numeric_observations(view, table, route)[0]
    fact = next(f for f in updated.facts if f.table_id.startswith("chart-"))
    assert fact.amount is not None
    assert fact.amount == 0
    assert not fact.amount.is_signed()
