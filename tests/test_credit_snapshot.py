"""Unit tests of `credit_snapshot` (PR 4, Task 2): the number rule, the register locator, each
block's gaps, the three context states and the three reference states.

The answer key (`tests/fixtures/credit_snapshot/`, `credit_snapshot_case.py`) is read, never edited:
the gather-level comparison with the expected cells is in `test_credit_snapshot_fidelity.py`. The
handoffs here are the key's synthetic ones with one change each, so every expected value is read
off the fixture text, never taken from the code under test.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import replace
from decimal import Decimal
from pathlib import Path

import credit_snapshot_case as cs
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_vii.context import load_context
from deploy_workflow import credit_snapshot as snap
from deploy_workflow import library_index
from deploy_workflow import recommendation as rec
from deploy_workflow import reference_portfolios as rp

LOGGER = "deploy_workflow.credit_snapshot"
DAMAGED = (
    "The stored portfolio 'jnk' cannot be read: its file is damaged or is not a stored portfolio."
)
FIXTURE = {path.stem: path.read_text("utf-8") for path in sorted(cs.HANDOFFS.glob("*.md"))}


def run_of(handoffs=None, *, context=None, references=(), issuer=cs.ISSUER_NAME):
    texts = FIXTURE if handoffs is None else handoffs
    return snap.SnapshotRun(
        issuer=issuer,
        as_of=cs.AS_OF,
        pathway="credit_snapshot",
        run_id="synthetic-run",
        handoffs={module: text.encode() for module, text in texts.items()},
        context=context,
        references=tuple(references),
    )


def full(**changes):
    """The key's every-module handoffs, with `changes` (module -> text) replacing some."""
    modules = {m: FIXTURE[m] for m in ("CP-1", "CP-1A", "CP-1B", "CP-1C", "CP-1D", "CP-2", "CP-DR")}
    return {**modules, **changes}


def where(snapshot, block, row=None, column=None, *, sheet=None):
    return [
        c
        for c in snapshot.cells()
        if c.block == block
        and (row is None or c.row == row)
        and (column is None or c.column == column)
        and (sheet is None or c.sheet == sheet)
    ]


def one(snapshot, block, row, column, *, sheet=None):
    (found,) = where(snapshot, block, row, column, sheet=sheet)
    return found


def context():
    return load_context(cs.context_bytes())


# --- The number rule ------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("text", "value", "number_format"),
    [
        ("2", 2, "0"),
        ("-85.2", -85.2, "0.0"),
        ("600.0", 600.0, "0.0"),
        ("1,234.5", 1234.5, "#,##0.0"),
        ("0.7875", 0.7875, "0.0000"),
        ("123456789012345", 123456789012345, "0"),
        ("1,450", 1450, "#,##0"),
        ("0", 0, "0"),
        ("0.00", 0.0, "0.00"),
    ],
)
def test_plain_decimals_are_numbers_with_a_format_that_keeps_their_decimals(
    text, value, number_format
):
    found = snap.figure(text)
    assert found is not None
    assert (found.value, type(found.value), found.number_format) == (
        value,
        type(value),
        number_format,
    )


@pytest.mark.parametrize(
    "text",
    [
        "212.0m",  # a unit inside the cell
        "(40.0)",  # brackets are text
        "3.73x",
        "12.5%",
        "298.12345678901234567",  # more than 15 significant digits
        "1234567890123456",  # 16 digits
        "1,23,4",
        "1,2345",
        "–",
        "",
        " 5",
        "5 ",
        "2-3",
        "1e5",
        "+5",
        "-",
        ".5",
        "5.",
        "007",
        "00.5",
        "0,123",
        "-0",
        "-0.0",
        "−5",
        "Not supplied: no balance printed",
        "２",  # a full-width digit
    ],
)
def test_anything_else_is_text(text):
    assert snap.figure(text) is None


def test_fifteen_significant_digits_count_without_the_leading_zeros_or_the_point():
    assert snap.figure("0.000123456789012345") is not None  # 15 significant digits
    assert snap.figure("0.0001234567890123456") is None  # 16
    assert snap.figure("12345678901234.5") is not None  # 15
    assert snap.figure("123456789012345.5") is None  # 16


PLAIN_TEXTS = st.builds(
    lambda sign, whole, fraction: f"{sign}{whole}.{fraction}" if fraction else f"{sign}{whole}",
    st.sampled_from(["", "-"]),
    st.from_regex(r"0|[1-9][0-9]{0,11}", fullmatch=True),
    st.from_regex(r"[0-9]{0,6}", fullmatch=True),
)
ARBITRARY = st.text(alphabet="0123456789,.-+ eExX%()–m", max_size=22)


def shows(value, number_format: str) -> str:
    """The digits a reader sees: the stored number through the format's own decimals."""
    decimals = max(len(number_format.partition(".")[2]), 0)
    return f"{Decimal(repr(value)):.{decimals}f}"


@given(st.one_of(PLAIN_TEXTS, ARBITRARY))
@settings(max_examples=400, deadline=None)
def test_any_text_the_rule_calls_a_number_round_trips_to_the_same_digits(text):
    found = snap.figure(text)
    if found is None:
        return
    plain = text.replace(",", "")
    stored = found.value
    written = f"{stored:.16g}"  # how openpyxl writes every number
    reread = float(written) if "." in plain else int(float(written))
    assert reread == stored
    assert Decimal(repr(reread)) == Decimal(plain)
    assert shows(reread, found.number_format) == plain
    assert ("," in text) == found.number_format.startswith("#,##0")


@given(PLAIN_TEXTS)
@settings(max_examples=300, deadline=None)
def test_a_plain_decimal_of_at_most_fifteen_digits_is_always_a_number(text):
    digits = re.sub(r"[-.]", "", text).lstrip("0")
    negative_zero = text.startswith("-") and not digits
    assert (snap.figure(text) is not None) == (len(digits) <= 15 and not negative_zero)


# --- The register locator -------------------------------------------------------------------------

OWNERSHIP = (
    FIXTURE["CP-1A"].split("### 1. ownership_register")[1].split("### **operating_model**")[0]
)
OWNERSHIP_TABLE = OWNERSHIP.strip("\n")


@pytest.mark.parametrize(
    "heading",
    [
        "### ownership_register",
        "## 1. ownership_register",
        "### **ownership_register**",
        "### `ownership_register`",
        "### 2) ownership_register - holders",
        "<!-- table-id: cp1a.ownership_register -->",
        "<!-- table-id: ownership_register -->",
    ],
)
def test_a_register_is_found_by_the_launchers_heading_and_tag_forms(heading):
    text = f"## Findings\n\n{heading}\n\n{OWNERSHIP_TABLE}\n"
    lines = text.split("\n")
    first = next(i for i, line in enumerate(lines, 1) if line.startswith("| Northbridge Capital"))
    snapshot = snap.gather(run_of({"CP-1A": text}))
    cell = one(snapshot, "Shareholders", "Northbridge Capital LP (sponsor)", "Control")
    assert (cell.kind, cell.text, cell.module, cell.line) == ("copied", "Majority", "CP-1A", first)


def test_a_heading_inside_a_code_fence_is_not_a_register(caplog):
    text = f"## Findings\n\n```\n### ownership_register\n\n{OWNERSHIP_TABLE}\n```\n"
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of({"CP-1A": text}))
    (gap,) = where(snapshot, "Shareholders")
    assert (gap.kind, gap.row, gap.column) == ("gap", "Gap", "Text")
    assert "no ownership_register register" in gap.text
    assert any("ownership_register" in record.getMessage() for record in caplog.records)


def test_a_register_written_twice_is_a_gap_not_a_guess():
    once = f"### ownership_register\n\n{OWNERSHIP_TABLE}\n"
    text = f"{once}\n{once}"
    (gap,) = where(snap.gather(run_of({"CP-1A": text})), "Shareholders")
    assert gap.kind == "gap" and "2 ownership_register registers" in gap.text


def test_a_table_without_its_header_is_that_blocks_gap_and_the_others_still_read(caplog):
    broken = FIXTURE["CP-1A"].replace("| Owner / class | Control | Economic interest |", "| x |", 1)
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of({"CP-1A": broken}))
    (gap,) = where(snapshot, "Shareholders")
    assert gap.kind == "gap" and gap.text
    assert one(snapshot, "Transaction summary", "Refinancing of the 2027 term loan", "Status")
    assert [r for r in caplog.records if "Shareholders" in r.getMessage()]


def test_a_missing_column_is_the_blocks_gap_naming_the_column():
    broken = FIXTURE["CP-1A"].replace(
        "Credit relevance | Source |\n|---|---|---|---|---|\n| North",
        "Why | Source |\n|---|---|---|---|---|\n| North",
    )
    (gap,) = where(snap.gather(run_of({"CP-1A": broken})), "Shareholders")
    assert gap.kind == "gap" and "Credit relevance" in gap.text


def test_a_cell_the_table_leaves_blank_is_a_gap_never_a_blank_cell():
    blank = FIXTURE["CP-1A"].replace("| Majority |", "|   |", 1)
    cell = one(
        snap.gather(run_of({"CP-1A": blank})),
        "Shareholders",
        "Northbridge Capital LP (sponsor)",
        "Control",
    )
    assert (cell.kind, cell.text, cell.module) == ("gap", "not in handoff", "CP-1A")


def test_a_handoff_that_is_not_utf8_gaps_its_blocks_and_reads_the_rest(caplog):
    run = run_of(full())
    run = snap.SnapshotRun(
        **{**run.__dict__, "handoffs": {**run.handoffs, "CP-1B": b"\xff\xfe## x"}}
    )
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run)
    (gap,) = where(snapshot, "Historical performance")
    assert gap.kind == "gap" and "UTF-8" in gap.text
    assert where(snapshot, "Header", "Issuer")[0].kind == "copied"


def test_a_row_label_that_repeats_in_a_block_gets_a_number_not_a_merge():
    twice = FIXTURE["CP-1A"].replace("| 2026-H2 | Completion", "| 2026-Q2 | Completion")
    snapshot = snap.gather(run_of({"CP-1A": twice}))
    rows = sorted({c.row for c in where(snapshot, "Near-term events")})
    assert rows == ["2026-Q2", "2026-Q2 (2)"]
    assert one(snapshot, "Near-term events", "2026-Q2 (2)", "Date / window").text == "2026-Q2"


# --- Blocks, one by one ---------------------------------------------------------------------------


def test_the_header_prefers_the_handoff_and_falls_back_to_the_run_and_context_by_kind():
    snapshot = snap.gather(run_of({"CP-1": FIXTURE["CP-1"]}, context=context()))
    assert one(snapshot, "Header", "Issuer", "Value").kind == "entered at run start"
    assert one(snapshot, "Header", "Issuer", "Value").text == cs.ISSUER_NAME
    assert one(snapshot, "Header", "Sector", "Value").text == "Industrials"
    assert one(snapshot, "Header", "Country", "Value").text == "United Kingdom"
    bare = snap.gather(run_of({"CP-1": FIXTURE["CP-1"]}))
    gap = one(bare, "Header", "Sector", "Value")
    assert (gap.kind, gap.text) == ("gap", "not in handoff")
    assert one(bare, "Business description", "Gap", "Text").kind == "gap"
    assert one(bare, "Header", "Pathway", "Value").text == "Full credit assessment"
    assert one(bare, "Header", "Run date", "Value").text == cs.AS_OF


def test_a_company_table_without_a_country_column_gaps_that_field_only():
    cut = FIXTURE["CP-1A"].replace("| Country | Sector |", "| Sector |")
    cut = cut.replace("| United Kingdom | Capital Goods |", "| Capital Goods |")
    cut = cut.replace(
        "|---|---|---|---|\n| Northbridge Holdings", "|---|---|---|\n| Northbridge Holdings"
    )
    assert cut != FIXTURE["CP-1A"]
    plain = snap.gather(run_of(full(**{"CP-1A": cut})))
    gap = one(plain, "Header", "Country", "Value")
    assert (gap.kind, gap.text) == ("gap", "not in handoff")
    assert one(plain, "Header", "Issuer", "Value").kind == "copied"
    assert one(plain, "Header", "Sector", "Value").text == "Capital Goods"
    assert one(plain, "Business description", "Description", "Value").kind == "copied"
    entered = snap.gather(run_of(full(**{"CP-1A": cut}), context=context()))
    country = one(entered, "Header", "Country", "Value")
    assert (country.kind, country.text) == ("entered at run start", "United Kingdom")
    assert not where(entered, "Header", "Gap")


def test_the_capital_structure_reads_columns_by_name_with_and_without_the_fx_columns():
    with_fx = snap.gather(run_of(full()))
    without = snap.gather(run_of(full(**{"CP-1": FIXTURE["CP-1-without-fx"]})))
    for snapshot, line in ((with_fx, 50), (without, 49)):
        cell = one(snapshot, "Capital structure", "Term Loan B", "Principal")
        assert cell.line == line
        assert (cell.text, cell.module) == ("600.0", "CP-1")
        assert len(where(snapshot, "Capital structure")) == 45
        assert len(where(snapshot, "Instruments", sheet="Inputs")) == 5
    assert one(with_fx, "Capital structure", "Revolving Credit Facility", "Principal").text == (
        "Not supplied: no drawn principal printed"
    )


def test_the_bridge_classification_has_one_rule_and_each_branch_is_exercised():
    def classify(snapshot, step):
        return one(snapshot, "EBITDA bridge", step, "Classification")

    base = snap.gather(run_of(full()))
    assert [
        classify(base, step).text
        for step in (
            "Restructuring costs",  # equals a description ignoring case and spaces; 20.0 of 20.0
            "Run-rate synergies",  # 4.0 of 12.5
            "Pro forma acquisition EBITDA",  # Insufficient Information
            "Other adjustments",  # matches nothing
        )
    ] == ["realised", "unrealised", "unclassified", "unclassified"]
    assert classify(base, "Restructuring costs").kind == "computed"
    # Two T1D.1 rows with one description: ambiguous, so unclassified.
    twin = FIXTURE["CP-1D"].replace("| Run-rate synergies |", "| RESTRUCTURING COSTS |")
    snapshot = snap.gather(run_of(full(**{"CP-1D": twin})))
    assert classify(snapshot, "Restructuring costs").text == "unclassified"
    # A run-rate figure that is not a plain number cannot be compared.
    words = FIXTURE["CP-1D"].replace("| 20.0 | 20.0 |", "| about 20 | 20.0 |")
    snapshot = snap.gather(run_of(full(**{"CP-1D": words})))
    assert classify(snapshot, "Restructuring costs").text == "unclassified"
    # Realised ahead of the claim is realised.
    ahead = FIXTURE["CP-1D"].replace("| 20.0 | 20.0 |", "| 20.0 | 25.0 |")
    snapshot = snap.gather(run_of(full(**{"CP-1D": ahead})))
    assert classify(snapshot, "Restructuring costs").text == "realised"


def test_no_cp1d_means_unclassified_and_an_unreadable_cp1d_is_logged(caplog):
    absent = snap.gather(run_of({"CP-1": FIXTURE["CP-1"]}))
    assert {c.text for c in where(absent, "EBITDA bridge", column="Classification")} == {
        "unclassified"
    }
    broken = FIXTURE["CP-1D"].replace("### T1D.2 Achievability Assessment", "### Other")
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of(full(**{"CP-1D": broken})))
    assert {c.text for c in where(snapshot, "EBITDA bridge", column="Classification")} == {
        "unclassified"
    }
    assert [r for r in caplog.records if "T1D.2" in r.getMessage()]


def test_the_bridge_always_names_what_it_cannot_say():
    snapshot = snap.gather(run_of(full()))
    for row in ("Structuring EBITDA", "House EBITDA"):
        cell = one(snapshot, "EBITDA bridge", row, "Value")
        assert (cell.kind, cell.text) == ("gap", "needs add-back ids in the bridge")


def test_an_optional_fixed_row_is_absent_when_the_table_lacks_it_a_required_one_is_a_gap():
    cp1 = FIXTURE["CP-1"]
    no_adjusted = "\n".join(
        line for line in cp1.split("\n") if not line.startswith("| EBITDA (Adjusted)")
    )
    snapshot = snap.gather(run_of(full(**{"CP-1": no_adjusted})))
    assert not where(snapshot, "Financials", "EBITDA (Adjusted)")
    assert not where(snapshot, "EBITDA measures", "EBITDA (Adjusted)")
    assert where(snapshot, "EBITDA measures", "EBITDA (Reported)")
    no_assets = "\n".join(line for line in cp1.split("\n") if not line.startswith("| Total Assets"))
    gap = one(
        snap.gather(run_of(full(**{"CP-1": no_assets}))), "Financials", "Total Assets", "Value"
    )
    assert (gap.kind, gap.text) == ("gap", "not in handoff")


def test_free_label_rows_match_ignoring_case_and_spaces_and_show_the_label_as_written():
    cp1 = (
        FIXTURE["CP-1"]
        .replace("| Revenue |", "|  REVENUE  |")
        .replace("| Gross profit |", "| gross   profit |")
    )
    snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    assert one(snapshot, "Financials", "REVENUE", "FY2025").text == "1,234.5"
    assert one(snapshot, "Financials", "gross   profit", "FY2025").text == "676.0"
    assert not where(snapshot, "Financials", "Revenues, net")


FREE_ROWS = (
    ("Senior debt", "T4.6"),
    ("Unsecured debt", "T4.6"),
    ("Senior leverage", "T4.9"),
    ("Unsecured leverage", "T4.9"),
)


@pytest.mark.parametrize(("label", "table"), FREE_ROWS)
def test_each_of_the_four_senior_and_unsecured_rows_is_copied_when_the_handoff_has_it(label, table):
    base = FIXTURE["CP-1"].replace(
        "| Senior debt | 1,030.0 | 985.0 |", "| Debt A | 1,030.0 | 985.0 |"
    )
    if table == "T4.6":
        row = f"| {label.upper()} | 900.0 | 880.0 | GBP millions | R | S |\n| Total Debt |"
        cp1 = base.replace("| Total Debt |", row, 1)
    else:
        row = (
            f"| {label} | f | 1 | s | 2 | s | FY2025 / 2025-12-31 | GBP | GBP m | 1.5 | C | 1 | L |"
        )
        cp1 = base.replace("| Net debt / EBITDA |", f"{row}\n| Net debt / EBITDA |", 1)
    snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    column = "FY2025" if table == "T4.6" else "FY2025 / 2025-12-31"
    shown = label.upper() if table == "T4.6" else label
    value = one(snapshot, "Capital structure totals", shown, column)
    assert value.kind == "copied" and value.module == "CP-1"
    assert one(snapshot, "Capital structure totals", shown, "Unit").kind == "copied"
    assert not where(snapshot, "Capital structure totals", shown, "Value")
    assert one(snapshot, "Financials", shown, column).text == value.text
    others = {name for name, _ in FREE_ROWS} - {label}
    for name in others:
        assert one(snapshot, "Capital structure totals", name, "Value").kind == "gap"
    assert one(snapshot, "Capital structure totals", "Pro forma interest", "Value").kind == "gap"


def test_units_are_copied_per_row_and_a_table_without_a_unit_column_is_a_gap_per_row():
    snapshot = snap.gather(run_of(full()))
    unit = one(snapshot, "Financials", "Revenue", "Unit")
    assert (unit.kind, unit.text, unit.module, unit.line) == ("copied", "GBP millions", "CP-1", 11)
    assert one(snapshot, "Financials", "Total debt / EBITDA", "Currency").text == "GBP"
    assert one(snapshot, "Capital structure totals", "Gross debt", "Unit").text == "GBP millions"
    assert (
        len(where(snapshot, "Financials", "Total debt / EBITDA", "Unit")) == 1
    )  # once, not per period
    head, mark, tail = FIXTURE["CP-1"].partition("### Net debt data")
    table, chart, rest = tail.partition("### Chart data: EBITDA bridge")
    dropped = []
    for line in table.split("\n"):
        cells = line.strip("|").split("|") if line.startswith("|") else None
        dropped.append(line if cells is None else "|" + "|".join(cells[:4] + cells[5:]) + "|")
    cp1 = head + mark + "\n".join(dropped) + chart + rest
    snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    for block in ("Financials", "Capital structure totals"):
        for measure in NET_DEBT_MEASURES:
            gap = one(snapshot, block, measure, "Unit")
            assert (gap.kind, gap.text) == ("gap", "unit not in handoff")
        assert one(snapshot, block, "Gross debt", "FY2025 / 2025-12-31").kind == "copied"
    nothing = FIXTURE["CP-1"].replace("| Currency | Unit |", "| Currencies | Units |")
    snapshot = snap.gather(run_of(full(**{"CP-1": nothing})))
    assert one(snapshot, "Financials", "Total debt / EBITDA", "Unit").text == "unit not in handoff"
    assert not where(snapshot, "Financials", "Total debt / EBITDA", "Currency")


NET_DEBT_MEASURES = ("Gross debt", "Cash", "Net debt")


def test_the_senior_rows_stay_gaps_when_the_handoff_has_no_row():
    snapshot = snap.gather(run_of({"CP-1": FIXTURE["CP-1-without-fx"]}))
    for name in ("Senior debt", "Unsecured debt", "Senior leverage", "Unsecured leverage"):
        assert one(snapshot, "Capital structure totals", name, "Value").kind == "gap"


def test_a_statement_table_without_its_unit_column_is_a_gap_for_that_table_only(caplog):
    head, balance, tail = FIXTURE["CP-1"].partition("### T4.6 Balance sheet")
    rest, tables, after = tail.partition("### T4.18")
    cp1 = head + balance + rest.replace("| Unit |", "| Units |", 1) + tables + after
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    gaps = where(snapshot, "Financials", column="Text")
    assert len(gaps) == 1 and "T4.6" in gaps[0].text and "`Unit` column" in gaps[0].text
    assert one(snapshot, "Financials", "FFO", "FY2025").text == "280.0"
    assert not where(snapshot, "Financials", "Total Debt")
    assert [r for r in caplog.records if "T4.6" in r.getMessage()]


# --- Prose, peers, scorecard ----------------------------------------------------------------------


def test_prose_paragraphs_are_whole_lines_and_basis_lines_stay_beside_their_paragraph():
    snapshot = snap.gather(run_of(full()))
    cell = one(snapshot, "Historical performance", "Bottom line 2", "Text")
    assert (cell.module, cell.line) == ("CP-1B", 11)
    lines = FIXTURE["CP-1B"].split("\n")
    assert cell.text == lines[10]
    assert [(b.module, b.line, b.text, b.row) for b in snapshot.basis_lines] == [
        ("CP-1B", 9, lines[8], "Bottom line 1"),
        ("CP-1B", 12, lines[11], "Bottom line 2"),
        ("CP-1B", 16, lines[15], "Key findings 1"),
        ("CP-1B", 19, lines[18], "Key findings 2"),
        ("CP-1B", 22, lines[21], "Key findings 3"),
    ]
    assert not [c for c in snapshot.cells() if "Basis:" in c.text]


def test_a_missing_prose_section_is_its_own_gap_row():
    cut = FIXTURE["CP-1B"].replace("### Key findings", "### Other")
    snapshot = snap.gather(run_of(full(**{"CP-1B": cut})))
    gap = one(snapshot, "Historical performance", "Key findings", "Text")
    assert gap.kind == "gap" and "Key findings" in gap.text
    assert one(snapshot, "Historical performance", "Bottom line 1", "Text").kind == "copied"


def test_peers_from_cp1c_then_cp_dr_and_the_none_row_is_not_a_peer():
    snapshot = snap.gather(run_of(full()))
    assert [c.text for c in where(snapshot, "Peers")] == [
        "Alder Valves plc",
        "Birch Pumps Inc.",
        "Cedar Controls AG",
        "Dune Hydraulics Ltd",
        "Elm Fluid Systems",
    ]
    only_none = snap.gather(run_of(full(**{"CP-DR": FIXTURE["CP-DR-none"]})))
    assert [c.row for c in where(only_none, "Peers")] == ["Peer 1", "Peer 2", "Peer 3"]
    nothing = snap.gather(run_of({"CP-1": FIXTURE["CP-1"], "CP-DR": FIXTURE["CP-DR-none"]}))
    (gap,) = where(nothing, "Peers")
    assert (gap.row, gap.column, gap.kind, gap.text) == ("Gap", "Text", "gap", "no peers named")
    neither = snap.gather(run_of({"CP-1": FIXTURE["CP-1"]}))
    assert one(neither, "Peers", "Gap", "Text").text == "The peer list is not in this run."


def test_a_scorecard_parse_scorecard_refuses_is_one_gap_with_the_fault_count_and_no_score():
    cp2 = FIXTURE["CP-2"].replace("| Liquidity | 2 |", "| Liquidity | 9 |")
    snapshot = snap.gather(run_of(full(**{"CP-2": cp2})))
    gap = one(snapshot, "Scorecard", "Gap", "Text")
    assert gap.kind == "gap" and "1 fault" in gap.text
    assert not where(snapshot, "Assessments")
    assert snapshot.credit_score is None
    score = one(snapshot, "Credit Score", "Credit Score", "Value", sheet="Inputs")
    assert score.kind == "gap" and score.text.startswith("No Credit Score")
    assert not [c for c in snapshot.cells() if c.block == "Scorecard" and c.kind == "copied"]


def test_the_scorecard_levels_are_the_handoffs_text_and_the_basis_is_kept_for_the_comment():
    snapshot = snap.gather(run_of(full()))
    level = one(snapshot, "Scorecard", "Scale", "Level")
    assert (level.text, level.module, level.line) == ("2", "CP-2", 24)
    assert level.basis == "**Adjusted EBITDA** of GBP 351.2m sits in the 200–500m band *(FY2025)*."
    assert one(snapshot, "Scorecard", "Market share", "Level").text == "Not scored"
    assert one(snapshot, "Assessments", "Sponsor Quality", "View").text == "Not assessed"
    assert snapshot.credit_score is not None and snapshot.credit_score.score == 3
    assert not [
        c for c in snapshot.cells() if c.block == "Scorecard" and "Adjusted EBITDA" in c.text
    ]


def test_fewer_than_twelve_scored_factors_is_a_credit_score_gap_in_recommendations_words():
    cp2 = FIXTURE["CP-2"]
    for factor in (
        "Scale",
        "Market position",
        "Regulatory exposure",
        "Technology",
        "Leverage",
        "Liquidity",
    ):
        cp2 = re.sub(
            rf"\| {factor} \| \d \| [^|]*\|",
            f"| {factor} | Not scored | Not supplied: no evidence |",
            cp2,
        )
    snapshot = snap.gather(run_of(full(**{"CP-2": cp2})))
    score = one(snapshot, "Credit Score", "Credit Score", "Value")
    assert score.kind == "gap" and score.text == snapshot.credit_score.reason
    assert snapshot.credit_score.score is None


def test_a_missing_cp2_gives_the_scorecard_gap_and_hides_assessments_and_triggers():
    snapshot = snap.gather(run_of({"CP-1": FIXTURE["CP-1"]}))
    assert (
        one(snapshot, "Scorecard", "Gap", "Text").text == "The credit scorecard is not in this run."
    )
    assert not where(snapshot, "Assessments") and not where(snapshot, "Monitoring triggers")
    assert one(snapshot, "Strengths and weaknesses", "Gap", "Text").kind == "gap"
    assert one(snapshot, "Credit Score", "Credit Score", "Value").text == (
        "No Credit Score: the run has no credit scorecard."
    )


def test_a_strengths_row_with_an_unknown_direction_makes_the_block_a_gap():
    cp2 = FIXTURE["CP-2"].replace("| STRENGTH | 2 |", "| NEUTRAL | 2 |")
    (gap,) = where(snap.gather(run_of(full(**{"CP-2": cp2}))), "Strengths and weaknesses")
    assert gap.kind == "gap" and "NEUTRAL" in gap.text


# --- The three context states ---------------------------------------------------------------------


def test_a_loaded_context_fills_ratings_new_issue_and_quotes_by_kind():
    snapshot = snap.gather(run_of(full(), context=context()))
    assert one(snapshot, "Corporate ratings", "S&P", "Outlook").kind == "entered at run start"
    assert not [
        c for c in where(snapshot, "Corporate ratings") if c.text == "Ba3"
    ]  # facility scope
    assert one(snapshot, "New issue", "Senior Notes 2032", "Talk spread high (bps)").text == "450"
    blank = one(snapshot, "Quotes as entered", "Quote 2", "Bid")
    assert (blank.kind, blank.text, blank.sheet) == ("entered at run start", "", "Inputs")


def test_an_absent_context_gives_analyst_cells_for_ratings_and_hides_the_deal_blocks():
    snapshot = snap.gather(run_of(full(), context=None))
    ratings = where(snapshot, "Corporate ratings")
    assert (
        ratings and {c.kind for c in ratings} == {"analyst"} and {c.text for c in ratings} == {""}
    )
    assert not where(snapshot, "New issue") and not where(snapshot, "Quotes as entered")


def test_a_context_without_deal_terms_hides_the_new_issue_and_without_ratings_gives_analyst_cells():
    bare = context().model_copy(update={"deal_terms": (), "quotes": (), "ratings": ()})
    snapshot = snap.gather(run_of(full(), context=bare))
    assert not where(snapshot, "New issue") and not where(snapshot, "Quotes as entered")
    assert {c.kind for c in where(snapshot, "Corporate ratings")} == {"analyst"}


def test_a_refused_context_is_a_reasoned_gap_line_on_each_block_that_needs_it():
    gap = snap.ContextGap("the run's context file is not the one its record names")
    snapshot = snap.gather(run_of(full(), context=gap))
    for block in ("Corporate ratings", "New issue", "Quotes as entered"):
        (cell,) = where(snapshot, block)
        assert (cell.kind, cell.row, cell.column) == ("gap", "Gap", "Text")
        assert gap.reason in cell.text
    assert one(snapshot, "Header", "Run date", "Value").kind == "entered at run start"
    assert [c for c in snapshot.cells() if c.kind == "entered at run start"] == [
        c for c in snapshot.cells() if c.block == "Header" and c.kind == "entered at run start"
    ]


def test_load_run_reads_issuer_as_of_pathway_and_run_id_from_the_pinned_manifest(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    run = snap.load_run(built.folder, built.stores.both())
    assert (run.issuer, run.as_of, run.pathway, run.run_id) == (
        cs.ISSUER_NAME,
        cs.AS_OF,
        "credit_snapshot",
        built.case.run_id,
    )
    assert set(run.handoffs) == set(built.case.handoffs)
    assert run.context is not None and not isinstance(run.context, snap.ContextGap)
    assert run.context.identity.sector == "Industrials"


def rewrite_pin(built, change):
    """Re-pin `workflow.json` after `change`, so the completion record names the new file."""
    path = built.folder / "workflow.json"
    workflow = json.loads(path.read_text())
    change(workflow)
    digest = cs.lf.put(path, json.dumps(workflow).encode())
    cs.lf.rewrite_completion(built.folder, lambda record: record.update(workflow_sha256=digest))
    return workflow


def test_a_run_whose_workflow_names_no_context_has_none(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["no_scorecard"])
    assert snap.load_run(built.folder, built.stores.both()).context is None


def test_a_pinned_context_file_that_changed_is_a_context_gap_not_a_refusal(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    pin = json.loads((built.folder / "workflow.json").read_text())["sources"]["context"]
    path = built.folder / "inputs" / pin["sha256"]
    path.write_bytes(path.read_bytes() + b" ")
    run = snap.load_run(built.folder, built.stores.both())
    assert isinstance(run.context, snap.ContextGap) and "context" in run.context.reason


def test_a_context_that_is_not_valid_is_a_context_gap_with_a_reason(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    junk = b'{"schema": "context/1"}'
    digest = cs.lf.put(built.folder / "inputs" / cs.sha256(junk), junk)
    rewrite_pin(built, lambda w: w["sources"]["context"].update(sha256=digest))
    run = snap.load_run(built.folder, built.stores.both())
    assert isinstance(run.context, snap.ContextGap) and run.context.reason


def test_a_context_for_another_date_or_pathway_is_a_context_gap(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    other = cs.context_bytes(as_of="2025-12-31")
    digest = cs.lf.put(built.folder / "inputs" / cs.sha256(other), other)
    rewrite_pin(built, lambda w: w["sources"]["context"].update(sha256=digest))
    run = snap.load_run(built.folder, built.stores.both())
    assert isinstance(run.context, snap.ContextGap) and "2025-12-31" in run.context.reason


def test_a_context_for_another_issuer_is_a_logged_context_gap(tmp_path, caplog):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    raw = json.loads(cs.context_bytes())
    raw["identity"]["issuer_name"] = "Someone Else plc"
    other = json.dumps(raw).encode()
    digest = cs.lf.put(built.folder / "inputs" / cs.sha256(other), other)
    rewrite_pin(built, lambda w: w["sources"]["context"].update(sha256=digest))
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        run = snap.load_run(built.folder, built.stores.both())
    assert isinstance(run.context, snap.ContextGap) and "Someone Else plc" in run.context.reason
    assert [r for r in caplog.records if "Someone Else plc" in r.getMessage()]


def test_a_workflow_that_names_another_run_is_refused(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    rewrite_pin(built, lambda w: w["run"].update(issuer_name="Someone Else plc"))
    with pytest.raises(library_index.Refused):
        snap.load_run(built.folder, built.stores.both())


# --- The three reference states -------------------------------------------------------------------


def references(*pairs):
    return tuple(pairs)


def test_load_run_gives_a_stored_a_not_stored_and_an_unreadable_reference(tmp_path, caplog):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    (built.stores.standing.root / "jnk.json").write_bytes(b"damaged")
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        run = snap.load_run(built.folder, built.stores.both())
    states = {ref.key: found for ref, found in run.references}
    assert isinstance(states["clo"], rp.Portfolio) and isinstance(states["lvln"], rp.Portfolio)
    assert isinstance(states["jnk"], snap.StoreGap)
    assert states["jnk"].reason == DAMAGED
    assert [r for r in caplog.records if "jnk" in r.getMessage()]
    clean = cs.build_case(tmp_path / "again", cs.CASES["full"])
    again = {
        ref.key: found for ref, found in snap.load_run(clean.folder, clean.stores.both()).references
    }
    assert again["jnk"] is None


def test_without_any_store_every_standing_reference_is_not_stored(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    run = snap.load_run(built.folder, [])
    assert [(ref.key, found) for ref, found in run.references] == [
        ("clo", None),
        ("lvln", None),
        ("jnk", None),
    ]


def test_a_run_stores_own_reference_is_read_with_the_standing_ones(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    own = rp.custom("Desk list", key="desk")
    portfolio = cs.lvln_portfolio()
    mine = rp.Portfolio(
        *("desk", "Desk list", "custom", portfolio.as_of, portfolio.stored_at, ()),
        portfolio.positions,
        columns_found=portfolio.columns_found,
    )
    built.stores.run.save(mine)
    run = snap.load_run(built.folder, built.stores.both())
    keys = [ref.key for ref, _ in run.references]
    assert keys == ["clo", "lvln", "jnk", "desk"]
    snapshot = snap.gather(run)
    assert one(snapshot, "Reference status", own.name, "As of", sheet="Matrix").kind == "computed"
    assert (
        one(snapshot, "Reference medians", "Desk list / loan / B", "Median", sheet="Matrix").text
        == "3.875"
    )


def test_load_run_takes_at_most_a_standing_store_and_a_run_store(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    with pytest.raises(ValueError, match="standing store"):
        snap.load_run(built.folder, [built.stores.standing, built.stores.run, built.stores.run])


def clo_view(snapshot):
    (view,) = [v for v in snapshot.references if v.key == "clo"]
    return view


def stored_run(*, sector_from=None, issuer=cs.ISSUER_NAME, ctx=None):
    refs = [(rp.CLO, cs.clo_portfolio()), (rp.LVLN, cs.lvln_portfolio()), (rp.JNK, None)]
    texts = full() if sector_from is None else {"CP-1": FIXTURE["CP-1"], **sector_from}
    return run_of(texts, context=ctx, references=refs, issuer=issuer)


def test_reference_views_carry_the_computed_values_and_matrix_cells_have_no_handoff_source():
    snapshot = snap.gather(stored_run(ctx=context()))
    view = clo_view(snapshot)
    rows = {(m.asset_type, m.bucket): m for m in view.medians}
    assert (rows["loan", "B"].median, rows["loan", "B"].names) == (Decimal(450), 6)
    assert rows["loan", "CCC"].under_five and not rows["loan", "BB"].under_five
    assert rows["loan", "BB"].file_column == "Mid 3Y DM"
    assert rows["loan", "BB"].measure == "discount margin"
    assert view.breached == ("Industrials max",) and view.not_read == ("Top 10 obligors",)
    assert view.weight == Decimal("3.25")
    assert all(c.module is None and c.line is None for c in snapshot.cells() if c.sheet == "Matrix")


def test_the_sector_for_limits_is_the_contexts_else_cp1as_else_unknown():
    with_context = clo_view(snap.gather(stored_run(ctx=context())))
    assert with_context.breached == ("Industrials max",)
    from_handoff = clo_view(snap.gather(stored_run(ctx=None)))  # CP-1A says Capital Goods
    # Capital Goods is not Industrials: the file shows that row breached but it cannot be tied to
    # this issuer, so it is not read (never assumed to apply, never assumed away).
    assert from_handoff.breached == () and "Industrials max" in from_handoff.not_read
    unknown = clo_view(snap.gather(stored_run(sector_from={}, ctx=None)))
    assert set(unknown.not_read) >= {"Industrials max", "Utilities max", "Top 10 obligors"}
    assert unknown.breached == ()


def test_limit_kinds_are_told_apart_only_through_recommendations_readings():
    view = clo_view(snap.gather(stored_run(ctx=context())))
    assert [name for name, _ in view.rating_limits] == ["CCC max", "B and below max"]
    by_bucket = dict(view.rating_limits)
    assert dict(by_bucket["CCC max"])["CCC"] == "breached"
    assert dict(by_bucket["B and below max"])["Unrated"] == "not read"
    assert [(name, str(floor)) for name, floor in view.price_floors] == [("Minimum price", "90")]
    assert tuple(bucket for bucket, _ in by_bucket["CCC max"]) == rp.BUCKET_NAMES


def test_a_matched_issuer_with_no_weight_figure_is_held_weight_not_stated():
    base = cs.clo_portfolio()
    positions = tuple(
        replace(p, weight=None) if p.borrower == cs.ISSUER_NAME else p for p in base.positions
    )
    unweighted = replace(base, positions=positions)
    run = run_of(full(), context=context(), references=[(rp.CLO, unweighted)])
    cell = one(snap.gather(run), "Issuer weight", "CLO portfolio", "Weight (%)")
    assert (cell.kind, cell.text) == ("gap", "held, weight not stated")


def test_an_issuer_name_that_cannot_be_matched_is_logged_and_not_held(caplog):
    run = run_of(full(), references=[(rp.CLO, cs.clo_portfolio())], issuer="!!!")
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run)
    cell = one(snapshot, "Issuer weight", "CLO portfolio", "Weight (%)")
    assert (cell.kind, cell.text) == ("gap", "not held / not matched")
    assert [r for r in caplog.records if "weight" in r.getMessage()]


def test_a_weight_of_none_is_not_held_never_zero():
    snapshot = snap.gather(stored_run(ctx=context()))
    cell = one(snapshot, "Issuer weight", "Loan index fund (LVLN)", "Weight (%)")
    assert (cell.kind, cell.text) == ("gap", "not held / not matched")
    elsewhere = snap.gather(stored_run(issuer="Nobody plc", ctx=context()))
    cell = one(elsewhere, "Issuer weight", "CLO portfolio", "Weight (%)")
    assert (cell.kind, cell.text) == ("gap", "not held / not matched")


def test_a_bucket_with_positions_but_no_level_is_a_median_gap_not_a_zero():
    base = cs.clo_portfolio()
    positions = tuple(
        rp.Position(p.row, borrower=p.borrower, asset_type="loan", rating_bucket="BB")
        if p.rating_bucket == "BB"
        else p
        for p in base.positions
    )
    bare = rp.Portfolio(
        *(base.key, base.name, base.kind, base.as_of, base.stored_at, ()),
        positions,
        base.limits,
        columns_found=base.columns_found,
    )
    run = run_of(full(), context=context(), references=[(rp.CLO, bare)])
    snapshot = snap.gather(run)
    median = one(
        snapshot, "Reference medians", "CLO portfolio / loan / BB", "Median", sheet="Matrix"
    )
    assert median.kind == "gap" and median.text
    assert one(snapshot, "Reference medians", "CLO portfolio / loan / BB", "Names").text == "0"


def test_an_unreadable_reference_is_the_stores_sentence_in_its_column():
    gap = snap.StoreGap("The stored portfolio 'jnk' cannot be read: its file is damaged.")
    snapshot = snap.gather(run_of(full(), references=[(rp.JNK, gap)]))
    cell = one(snapshot, "Reference status", rp.JNK.name, "Status")
    assert (cell.kind, cell.text) == ("gap", gap.reason)
    assert not where(snapshot, "Reference medians")


# --- Gather itself --------------------------------------------------------------------------------


def test_gather_is_pure_and_cells_are_a_function_of_the_run():
    run = stored_run(ctx=context())
    first, second = snap.gather(run), snap.gather(run)
    assert first == second and tuple(first.cells()) == tuple(second.cells())


def test_every_cell_has_a_known_kind_and_sheet_and_copied_cells_carry_provenance():
    snapshot = snap.gather(stored_run(ctx=context()))
    for cell in snapshot.cells():
        assert cell.kind in {"copied", "gap", "computed", "entered at run start", "analyst"}
        assert cell.sheet in {"Snapshot", "Inputs", "Matrix"}
        if cell.kind == "copied":
            assert cell.module and cell.section and cell.line and cell.text.strip()
        if cell.kind == "analyst":
            assert cell.text == ""
    assert set(snapshot.handoff_sha256) == set(FIXTURE) - {"CP-1-without-fx", "CP-DR-none"}
    assert snapshot.handoff_sha256["CP-1"] == cs.sha256(FIXTURE["CP-1"].encode())


def test_the_analyst_blocks_are_always_present_and_blank():
    snapshot = snap.gather(run_of({"CP-1": FIXTURE["CP-1"]}))
    for block, row in (
        ("Investment thesis", "Thesis"),
        ("Equity value", "Equity value"),
        ("Equity value", "EV multiple"),
    ):
        cell = one(snapshot, block, row, "Value")
        assert (cell.kind, cell.text) == ("analyst", "")


def test_a_figure_property_applies_the_number_rule_to_a_cells_text():
    snapshot = snap.gather(run_of(full()))
    assert one(snapshot, "Capital structure", "Term Loan B", "Principal").figure.value == 600.0
    assert one(snapshot, "Financials", "EBITDA (Reported)", "FY2024").figure is None  # 20 digits
    assert (
        one(snapshot, "Financials", "Net Cash from Operating Activities", "FY2025").figure is None
    )
    assert (
        one(snapshot, "Financials", "Gross profit", "FY2024").figure is None
    )  # a period left empty


def test_the_pathway_is_shown_as_its_title_and_an_unknown_one_as_its_id():
    run = run_of(full())
    other = snap.SnapshotRun(**{**run.__dict__, "pathway": "bespoke_path"})
    assert one(snap.gather(other), "Header", "Pathway", "Value").text == "bespoke_path"
    assert snap.gather(other).pathway == "bespoke_path"


def test_the_module_imports_no_openpyxl_and_no_private_name_of_the_calculation_modules():
    source = Path(snap.__file__).read_text(encoding="utf-8")
    assert "openpyxl" not in source
    assert not re.search(r"\b(recommendation|reference_portfolios|rec|rp)\._\w+", source)
    assert "rec." in source and "rp." in source


def test_rec_is_the_only_source_of_the_credit_score():
    snapshot = snap.gather(run_of(full()))
    from deploy_workflow.cp2_scorecard import parse_scorecard

    scorecard = parse_scorecard(FIXTURE["CP-2"])
    assert scorecard is not None
    assert snapshot.credit_score == rec.credit_score(scorecard)
    assert snapshot.scorecard == scorecard
