"""Unit tests of `credit_snapshot` (PR 4, Task 2): the number rule, the register locator, each
block's gaps, the three context states and the three reference states.

The answer key (`tests/fixtures/credit_snapshot/`, `credit_snapshot_case.py`) is read, never edited:
the gather-level comparison with the expected cells is in `test_credit_snapshot_fidelity.py`. The
handoffs here are the key's synthetic ones with one change each, so every expected value is read
off the fixture text, never taken from the code under test.
"""

from __future__ import annotations

import csv
import json
import logging
import re
from dataclasses import replace
from datetime import date
from decimal import Decimal
from pathlib import Path

import credit_snapshot_case as cs
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_vii.context import load_context
from deploy_vii.inputs import portfolio_export as pe
from deploy_workflow import credit_os_chips as chips
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


MACHINERY = re.compile(r"CP-|`|register|Expected one|T[0-9]\.[0-9]|UTF-8|fault|_")


def reader_gap(cell, sentence, reason):
    """A gap that says only what the reader needs (`sentence`, no machinery); the technical
    reason is on the cell for Sources, not in its text (ruling PM-f)."""
    assert (cell.kind, cell.text) == ("gap", sentence)
    assert not MACHINERY.search(cell.text)
    assert reason in (cell.written or "")


def test_a_heading_inside_a_code_fence_is_not_a_register(caplog):
    text = f"## Findings\n\n```\n### ownership_register\n\n{OWNERSHIP_TABLE}\n```\n"
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of({"CP-1A": text}))
    (gap,) = where(snapshot, "Shareholders")
    assert (gap.kind, gap.row, gap.column) == ("gap", "Gap", "Text")
    reader_gap(
        gap,
        "The Shareholders table of Business & governance could not be read.",
        "no ownership_register register",
    )
    assert any("ownership_register" in record.getMessage() for record in caplog.records)


def test_a_register_written_twice_is_a_gap_not_a_guess():
    once = f"### ownership_register\n\n{OWNERSHIP_TABLE}\n"
    text = f"{once}\n{once}"
    (gap,) = where(snap.gather(run_of({"CP-1A": text})), "Shareholders")
    reader_gap(
        gap,
        "The Shareholders table of Business & governance could not be read.",
        "2 ownership_register registers",
    )


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
    reader_gap(
        gap,
        "The Shareholders table of Business & governance could not be read.",
        "has no `Credit relevance` column",
    )


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
    reader_gap(
        gap,
        "The Historical performance table of Earnings changes could not be read.",
        "UTF-8",
    )
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
        assert len(where(snapshot, "Instruments", sheet="Inputs")) == 15  # 5 x 3
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
    assert len(gaps) == 1
    reader_gap(
        gaps[0],
        "The Balance sheet table of Financial foundation could not be read.",
        "T4.6 Balance sheet has no `Unit` column",
    )
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
    reader_gap(
        gap, "The Key findings section of Earnings changes could not be read.", "Key findings"
    )
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
    reader_gap(gap, "The credit scorecard could not be read.", "1 fault")
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
    reader_gap(
        gap,
        "The Strengths and weaknesses table of Fundamental credit could not be read.",
        "NEUTRAL",
    )


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


# --- FIGI and Bloomberg ID from the run's RV worksheet (Task 5; rulings T5-a to T5-f) -------------

RV_HEADER = next(csv.reader((cs.FIXTURES / cs.RV_NAME).read_text("utf-8").splitlines()))
LOAN_B, NOTES_2030 = "Term Loan B", "4.50% Senior Notes 2030"


def rv_file(directory: Path, rows, *, header=None, name="rv.csv") -> tuple[str, Path]:
    """A synthetic RV worksheet: each row a dict of header -> text, every other column empty."""
    path = directory / name
    columns = header or {h: h for h in RV_HEADER}
    with path.open("w", newline="", encoding="utf-8") as handle:
        out = csv.writer(handle)
        out.writerow(columns.values())
        out.writerows([row.get(h, "") for h in columns] for row in rows)
    return name, path


def rv_row(bloomberg="", figi="", maturity="31-Mar-31", loan="B", company=cs.ISSUER_NAME, **more):
    return {
        "Company": company,
        "Borrower Name": "Holdco Ltd",
        "Bloomberg ID": bloomberg,
        "FIGI": figi,
        "Loan Type": loan,
        "Ranking": "1L Gtd Sr. Secd",
        "Size ($Mn)": "600",
        "Margin": "375",
        "Maturity": maturity,
        "Bid": "98.5",
        **more,
    }


def gathered_with(tmp_path, *sources, handoffs=None):
    case = replace(cs.CASES["full"], sources=tuple(sources))
    if handoffs:
        case = replace(case, handoffs={**case.handoffs, **handoffs})
    built = cs.build_case(tmp_path, case)
    return snap.gather(snap.load_run(built.folder, built.stores.both())), built


def ids(snapshot, name):
    return {
        c.column: c
        for c in where(snapshot, "Instruments", name, sheet="Inputs")
        if c.column in snap.IDENTIFIERS
    }


def test_a_joined_instrument_with_both_identifiers_copies_both_from_the_sheet_row(tmp_path):
    row = rv_row("SYN1", "ABCDEFGHIJK1")
    snapshot, _ = gathered_with(tmp_path, rv_file(tmp_path, [row]))
    got = ids(snapshot, LOAN_B)
    assert [(c.kind, c.text) for c in got.values()] == [
        ("copied", "ABCDEFGHIJK1"),
        ("copied", "SYN1"),
    ]
    assert {(c.module, c.section, c.line) for c in got.values()} == {(snap.RV_MODULE, "rv.csv", 2)}
    block = {(c.row, c.column): c.text for c in where(snapshot, "Market identifiers")}
    assert block[("Row 2", "Maturity")] == "31-Mar-31" and len(block) == 9
    assert snapshot.source_sha256 == {"rv.csv": cs.sha256((tmp_path / "rv.csv").read_bytes())}


def test_a_missing_identifier_beside_a_present_one_is_a_blank_cell_not_a_gap_or_analyst_cell(
    tmp_path,
):
    for bloomberg, figi, missing in (
        ("SYN1", "#N/A N/A", "FIGI"),
        ("#N/A N/A", "ABCDEFGHIJK1", "Bloomberg ID"),
    ):
        directory = tmp_path / missing.replace(" ", "")
        directory.mkdir()
        snapshot, _ = gathered_with(directory, rv_file(directory, [rv_row(bloomberg, figi)]))
        got = ids(snapshot, LOAN_B)
        assert got[missing].kind == "blank" and got[missing].text == ""
        assert {c.kind for k, c in got.items() if k != missing} == {"copied"}


def test_a_row_with_a_malformed_figi_and_no_bloomberg_id_has_no_identifier(tmp_path):
    for bloomberg, figi in (("", "abc"), ("#N/A N/A", "SHORT"), ("#NAME?", "")):
        directory = tmp_path / f"{len(bloomberg)}{len(figi)}"
        directory.mkdir()
        snapshot, _ = gathered_with(directory, rv_file(directory, [rv_row(bloomberg, figi)]))
        assert {c.kind for c in ids(snapshot, LOAN_B).values()} == {"analyst"}
        assert len(where(snapshot, "Market identifiers")) == 9  # still listed


def test_two_matched_rows_on_one_date_join_nothing(tmp_path):
    rows = [rv_row("SYN1", "ABCDEFGHIJK1"), rv_row("SYN2", "ABCDEFGHIJK2")]
    snapshot, _ = gathered_with(tmp_path, rv_file(tmp_path, rows))
    assert {c.kind for c in ids(snapshot, LOAN_B).values()} == {"analyst"}
    assert len({c.row for c in where(snapshot, "Market identifiers")}) == 2


def test_another_companys_row_on_the_same_date_does_not_make_the_date_ambiguous(tmp_path):
    rows = [
        rv_row("SYN1", "ABCDEFGHIJK1"),
        rv_row("SYN9", "ABCDEFGHIJK9", company="Cobalt Freight plc"),
    ]
    snapshot, _ = gathered_with(tmp_path, rv_file(tmp_path, rows))
    assert ids(snapshot, LOAN_B)["Bloomberg ID"].text == "SYN1"
    assert {c.row for c in where(snapshot, "Market identifiers")} == {"Row 2"}


def test_the_issuer_matches_the_borrower_name_column_and_ignores_case_and_spaces(tmp_path):
    row = rv_row(
        "SYN1",
        "ABCDEFGHIJK1",
        company="Someone",
        **{"Borrower Name": "  NORTHBRIDGE   holdings PLC "},
    )
    snapshot, _ = gathered_with(tmp_path, rv_file(tmp_path, [row]))
    assert ids(snapshot, LOAN_B)["FIGI"].text == "ABCDEFGHIJK1"


def test_headers_are_found_in_any_case_and_spacing(tmp_path):
    header = {
        h: f"  {h.upper()} " if h in ("FIGI", "Company") else h.lower().replace(" ", "   ")
        for h in RV_HEADER
    }
    snapshot, _ = gathered_with(
        tmp_path, rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1")], header=header)
    )
    assert ids(snapshot, LOAN_B)["Bloomberg ID"].text == "SYN1"


def test_a_bond_and_a_loan_sharing_a_maturity_never_swap_identifiers(tmp_path):
    # The sheet's loan matures on the 4.50% Senior Notes' date: a bond, so no join.
    sheet = rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1", maturity="15-Jun-30")])
    snapshot, _ = gathered_with(tmp_path, sheet)
    assert {c.kind for c in ids(snapshot, NOTES_2030).values()} == {"analyst"}
    assert {c.kind for c in ids(snapshot, LOAN_B).values()} == {"analyst"}
    # The term loan moved onto the notes' date: two instruments on one date, so neither joins.
    cp1 = FIXTURE["CP-1"].replace("2031-03-31", "2030-06-15")
    moved = tmp_path / "CP-1.md"
    moved.write_text(cp1, "utf-8")
    (tmp_path / "b").mkdir()
    snapshot, _ = gathered_with(tmp_path / "b", sheet, handoffs={"CP-1": moved})
    for name in (LOAN_B, NOTES_2030):
        assert {c.kind for c in ids(snapshot, name).values()} == {"analyst"}


def test_an_instrument_of_unknown_type_or_a_sheet_row_without_a_loan_type_never_joins(tmp_path):
    snapshot, _ = gathered_with(
        tmp_path, rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1", loan="")])
    )
    assert {c.kind for c in ids(snapshot, LOAN_B).values()} == {"analyst"}
    other = tmp_path / "t"
    other.mkdir()
    snapshot, _ = gathered_with(
        other, rv_file(other, [rv_row("SYN1", "ABCDEFGHIJK1", maturity="31-Dec-27")])
    )  # the receivables facility's date
    assert {c.kind for c in ids(snapshot, "Receivables facility").values()} == {"analyst"}


def test_a_sheet_with_no_row_for_the_issuer_is_a_reasoned_gap_line(tmp_path):
    other = rv_row("SYN1", "ABCDEFGHIJK1", company="Cobalt Freight plc")
    snapshot, _ = gathered_with(tmp_path, rv_file(tmp_path, [other]))
    (gap,) = where(snapshot, "Market identifiers")
    assert (gap.kind, gap.text) == ("gap", snap.NO_MARKET_ROWS)
    assert {c.kind for c in ids(snapshot, LOAN_B).values()} == {"analyst"}


def test_no_sheet_is_one_gap_line_and_every_instrument_keeps_analyst_cells():
    snapshot = snap.gather(run_of(full()))
    (gap,) = where(snapshot, "Market identifiers")
    assert (gap.sheet, gap.row, gap.column, gap.kind, gap.text) == (
        "Inputs",
        "Gap",
        "Text",
        "gap",
        "no market data sheet supplied",
    )
    assert {c.kind for c in where(snapshot, "Instruments", column="FIGI")} == {"analyst"}


def test_a_source_that_is_not_a_worksheet_is_skipped_with_a_logged_reason(tmp_path, caplog):
    note = tmp_path / "note.txt"
    note.write_text("just a note, not a sheet\n", "utf-8")
    binary = tmp_path / "scan.pdf"
    binary.write_bytes(b"%PDF-1.7\x00\x01\x02 not a sheet")
    with caplog.at_level(logging.INFO, logger=LOGGER):
        snapshot, _ = gathered_with(tmp_path, ("note.txt", note), ("scan.pdf", binary))
    assert [
        m for m in (r.getMessage() for r in caplog.records) if "note.txt" in m or "scan.pdf" in m
    ]
    assert where(snapshot, "Market identifiers")[0].text == snap.NO_MARKET


def test_a_workflow_that_is_not_the_one_the_completion_names_gives_a_logged_gap_and_no_sheet(
    tmp_path, caplog
):
    built = cs.build_case(
        tmp_path,
        replace(cs.CASES["full"], sources=(rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1")]),)),
    )
    path = built.folder / "workflow.json"
    path.write_bytes(path.read_bytes() + b" ")  # the completion record still names the old hash
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        run = snap.load_run(built.folder, built.stores.both())
    assert isinstance(run.market, snap.MarketGap) and "completion record names" in run.market.reason
    assert [r for r in caplog.records if "no market data sheet" in r.getMessage()]
    snapshot = snap.gather(run)
    assert where(snapshot, "Market identifiers")[0].text == snap.NO_MARKET
    assert {c.kind for c in ids(snapshot, LOAN_B).values()} == {"analyst"}


def test_a_workbook_sheet_is_read_like_a_csv_and_a_date_cell_is_the_date(tmp_path):
    # An XLSX sheet's rows as `portfolio_export.sheet_rows` returns them (no workbook is written
    # here: only the writer may write one); a maturity cell holds a date serial.
    serial = (date(2031, 3, 31) - date(1899, 12, 30)).days
    text = lambda row: [pe.Cell(row.get(h, "")) for h in RV_HEADER]
    head = [pe.Cell(h) for h in RV_HEADER]
    body = text(rv_row("SYN1", "ABCDEFGHIJK1"))
    body[RV_HEADER.index("Maturity")] = pe.Cell(str(serial), numeric=True, date_format=True)
    sheet = snap.market_sheet("book.xlsx", "0" * 64, [(3, []), (4, head), (5, body), (6, [])])
    (found,) = sheet.rows
    assert (found.line, found.maturity) == (5, date(2031, 3, 31))
    assert found.cells["Maturity"] == "2031-03-31" and found.cells["Bloomberg ID"] == "SYN1"


def test_a_sheet_missing_a_required_header_or_repeating_one_is_not_a_worksheet():
    for drop in ("FIGI", "Bloomberg ID"):
        head = [pe.Cell(h) for h in RV_HEADER if h != drop]
        assert snap.market_sheet("a.csv", "0" * 64, [(1, head)]) is None
    both = [pe.Cell(h) for h in RV_HEADER if h not in ("Company", "Borrower Name")]
    assert snap.market_sheet("a.csv", "0" * 64, [(1, both)]) is None
    twice = [pe.Cell(h) for h in (*RV_HEADER, "FIGI")]
    assert snap.market_sheet("a.csv", "0" * 64, [(1, twice)]) is None
    assert snap.market_sheet("a.csv", "0" * 64, []) is None


def test_the_sheets_two_digit_year_is_read_as_python_reads_it():
    for text, want in (("27-Jun-32", date(2032, 6, 27)), ("01-Jan-68", date(2068, 1, 1))):
        assert snap._maturity(pe.Cell(text)) == want
    assert snap._maturity(pe.Cell("2032-06-27")) == date(2032, 6, 27)
    assert snap._maturity(pe.Cell("#N/A N/A")) is None


# --- Task 5 fix 1: unreadable maturities (T5-i), pinned-source failures -------------------


def loan_twin(date_text: str) -> str:
    """CP-1 with the revolver made a term loan whose maturity reads `date_text`."""
    return (
        FIXTURE["CP-1"]
        .replace(
            "| Revolving Credit Facility | Revolver |", "| Revolving Credit Facility | Term loan |"
        )
        .replace("| 2029-06-30 |", f"| {date_text} |")
    )


def moved_cp1(directory: Path, text: str) -> dict:
    directory.mkdir(exist_ok=True)
    path = directory / "CP-1.md"
    path.write_text(text, "utf-8")
    return {"CP-1": path}


def loan_b_kinds(snapshot) -> set[str]:
    return {c.kind for c in ids(snapshot, LOAN_B).values()}


def test_an_unreadable_loan_maturity_on_either_side_stops_every_join(tmp_path):
    clean = rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1")])
    snapshot, _ = gathered_with(tmp_path / "ok", clean)  # control: the same sheet joins
    assert loan_b_kinds(snapshot) == {"copied"}
    for number, text in enumerate(("31 March 2031", "12/03/2031", "03/12/2031")):
        directory = tmp_path / f"t{number}"
        handoffs = moved_cp1(directory, loan_twin(text))
        snapshot, _ = gathered_with(
            directory, rv_file(directory, [rv_row("SYN1", "ABCDEFGHIJK1")]), handoffs=handoffs
        )
        assert loan_b_kinds(snapshot) == {"analyst"}, text
    for number, text in enumerate(("garbage", "12/03/2031", "31 March 2031")):
        directory = tmp_path / f"r{number}"
        directory.mkdir()
        rows = [rv_row("SYN1", "ABCDEFGHIJK1"), rv_row("SYN2", "ABCDEFGHIJK2", maturity=text)]
        snapshot, _ = gathered_with(directory, rv_file(directory, rows))
        assert loan_b_kinds(snapshot) == {"analyst"}, text


def test_a_vendor_error_token_or_a_blank_maturity_does_not_stop_a_join(tmp_path):
    for number, text in enumerate(("#N/A N/A", "")):
        directory = tmp_path / str(number)
        directory.mkdir()
        rows = [rv_row("SYN1", "ABCDEFGHIJK1"), rv_row("SYN2", "ABCDEFGHIJK2", maturity=text)]
        snapshot, _ = gathered_with(directory, rv_file(directory, rows))
        assert ids(snapshot, LOAN_B)["Bloomberg ID"].text == "SYN1", text


def test_a_maturity_with_surrounding_spaces_is_read_the_same_on_both_sides(tmp_path):
    handoffs = moved_cp1(tmp_path, loan_twin("2029-06-30"))
    rows = [rv_row("SYN1", "ABCDEFGHIJK1", maturity=" 31-Mar-31 ")]
    snapshot, _ = gathered_with(tmp_path, rv_file(tmp_path, rows), handoffs=handoffs)
    assert ids(snapshot, LOAN_B)["Bloomberg ID"].text == "SYN1"
    assert snap.read_day(" 2031-03-31 ") == date(2031, 3, 31)
    assert snap.read_day("12/03/2031") is None


def test_a_source_whose_hash_fails_is_skipped_logged_and_leaves_the_gap_line(tmp_path, caplog):
    built = cs.build_case(
        tmp_path,
        replace(cs.CASES["full"], sources=(rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1")]),)),
    )
    pin = json.loads((built.folder / "workflow.json").read_text())["sources"]["rv.csv"]
    stored = built.folder / "inputs" / pin["sha256"]
    stored.write_bytes(stored.read_bytes() + b"\n")
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        run = snap.load_run(built.folder, built.stores.both())
    assert run.market == ()
    assert [r for r in caplog.records if "rv.csv" in r.getMessage()]
    snapshot = snap.gather(run)
    assert where(snapshot, "Market identifiers")[0].text == snap.NO_MARKET
    assert loan_b_kinds(snapshot) == {"analyst"}


def test_two_sources_that_together_make_a_date_ambiguous_join_nothing(tmp_path):
    (tmp_path / "a").mkdir()
    (tmp_path / "b").mkdir()
    first = rv_file(tmp_path / "a", [rv_row("SYN1", "ABCDEFGHIJK1")], name="one.csv")
    second = rv_file(tmp_path / "b", [rv_row("SYN2", "ABCDEFGHIJK2")], name="two.csv")
    snapshot, _ = gathered_with(tmp_path, first, second)
    assert loan_b_kinds(snapshot) == {"analyst"}
    assert len({(c.section, c.row) for c in where(snapshot, "Market identifiers")}) == 2


# --- Fix round 1 of Task 4: one parse per workbook, control characters, Run kind ----------------


def test_a_workbook_source_is_parsed_once_inside_the_markets_reading_scope(monkeypatch):
    # The product's own four-sheet workbook stands for a multi-sheet source.
    from deploy_workflow import credit_snapshot_workbook as wb

    raw = wb.workbook_bytes(snap.gather(run_of(full())))
    calls = []
    real = pe.xlsx_content
    monkeypatch.setattr(pe, "xlsx_content", lambda data: calls.append(1) or real(data))
    snap._source_rows(raw)
    outside = len(calls)
    calls.clear()
    with pe.reading():
        snap._source_rows(raw)
    assert (outside, len(calls)) == (1, 1)  # the source's own scope: one parse per workbook


def test_market_sheets_reads_the_whole_run_inside_one_reading_scope(tmp_path, monkeypatch):
    from deploy_workflow import credit_snapshot_workbook as wb

    raw = wb.workbook_bytes(snap.gather(run_of(full())))
    digest = cs.sha256(raw)
    (tmp_path / "inputs").mkdir()
    (tmp_path / "inputs" / digest).write_bytes(raw)
    calls = []
    real = pe.xlsx_content
    monkeypatch.setattr(pe, "xlsx_content", lambda data: calls.append(1) or real(data))
    pin = {"path": "model.xlsx", "sha256": digest}
    assert snap._market_sheets(tmp_path, {"model.xlsx": pin}) == ()
    assert len(calls) == 1


def test_each_source_is_read_in_its_own_reading_scope(tmp_path, monkeypatch):
    # One scope per source: a workbook's parse is released before the next source is read.
    held = []
    real = snap._source_rows
    monkeypatch.setattr(
        snap, "_source_rows", lambda raw: held.append(pe._READING.get()) or real(raw)
    )
    pins = {}
    (tmp_path / "inputs").mkdir()
    for name in ("a.csv", "b.csv"):
        raw = name.encode()
        digest = cs.sha256(raw)
        (tmp_path / "inputs" / digest).write_bytes(raw)
        pins[name] = {"path": name, "sha256": digest}
    snap._market_sheets(tmp_path, pins)
    assert len(held) == 2 and held[0] is not None and held[0] is not held[1]
    assert pe._READING.get() is None


def test_a_tab_over_the_row_cap_never_hides_a_valid_rv_tab(monkeypatch):
    # The writer's own workbook has no RV tab, so the sheets come from `portfolio_export`.
    head = [pe.Cell(h) for h in RV_HEADER]
    rv = [(1, head), (2, [pe.Cell("x") for _ in RV_HEADER])]
    big = [(n, [pe.Cell("v")]) for n in range(1, 6)]
    monkeypatch.setattr(rp, "MAX_ROWS", 3)
    monkeypatch.setattr(pe, "workbook_sheets", lambda raw: ("RV", "Data"))
    monkeypatch.setattr(pe, "sheet_rows", lambda raw, name: rv if name == "RV" else big)
    assert snap._source_rows(b"PK\x03\x04") == [rv]
    monkeypatch.setattr(rp, "MAX_ROWS", 1)
    with pytest.raises(ValueError, match="more than 1 rows"):
        snap._source_rows(b"PK\x03\x04")


def test_a_csv_without_the_rv_headers_is_not_read_past_its_first_row():
    junk = b"a,b,c\n" + b"x,y,z\n" * 10
    assert snap._source_rows(junk) == []
    head = ",".join(RV_HEADER)
    (rows,) = snap._source_rows(f"\n{head}\nx\n".encode())
    assert [n for n, _ in rows] == [1, 2, 3]


def test_a_sheet_over_the_row_cap_is_skipped_with_a_logged_reason(tmp_path, monkeypatch, caplog):
    monkeypatch.setattr(rp, "MAX_ROWS", 3)
    raw = (",".join(RV_HEADER) + "\n" + "a\n" * 5).encode()
    digest = cs.sha256(raw)
    (tmp_path / "inputs").mkdir()
    (tmp_path / "inputs" / digest).write_bytes(raw)
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        found = snap._market_sheets(tmp_path, {"rv.csv": {"path": "rv.csv", "sha256": digest}})
    assert found == ()
    assert "more than 3 rows" in caplog.text


@pytest.mark.parametrize("char", ["\x01", "\x08", "\x1b", "\x1f"])
def test_a_control_character_in_copied_text_is_that_cells_gap(char, caplog):
    text = FIXTURE["CP-1A"].replace("designs and makes", f"designs{char} and makes", 1)
    assert char in text
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of(full(**{"CP-1A": text})))
    (cell,) = [c for c in snapshot.cells() if c.text == snap.CONTROL_CHARACTER]
    assert (cell.kind, cell.module) == ("gap", "CP-1A") and cell.line is not None
    assert snap.CONTROL_CHARACTER == "text holds a control character"
    assert "control character" in caplog.text and "CP-1A" in caplog.text
    assert not any(char in c.text for c in snapshot.cells())


@pytest.mark.parametrize(
    ("execution", "kind"),
    [
        ({"CP-1": "live-provider"}, "Model provider"),
        ({"CP-1": "synthetic", "CP-1A": "live-provider"}, "Model provider; Synthetic"),
        (
            {"a": "synthetic", "b": "retained-response-replay", "c": "host-session"},
            "Host session; Reused from an earlier run; Synthetic",
        ),
        ({"CP-1": "live-provider", "CP-1A": "oddity"}, "Model provider; Not recorded"),
        ({"CP-1": "oddity"}, "Not recorded"),
        ({}, "Not recorded"),
    ],
)
def test_run_kind_joins_the_distinct_execution_words_in_the_libraries_order(execution, kind):
    assert snap.run_kind(execution) == kind
    run = replace(run_of(full()), execution=execution)
    cell = one(snap.gather(run), "Header", "Run kind", "Value")
    assert (cell.kind, cell.text) == ("computed", kind)


def test_the_illegal_character_pattern_is_the_workbook_writers():
    from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE

    assert snap.ILLEGAL.pattern == ILLEGAL_CHARACTERS_RE.pattern


def test_a_control_character_in_a_row_label_is_a_gap_and_the_workbook_still_writes():
    from deploy_workflow import credit_snapshot_workbook as wb

    text = FIXTURE["CP-1"].replace("| Term Loan B |", "| Term\x01 Loan B |")
    assert text != FIXTURE["CP-1"]
    snapshot = snap.gather(run_of(full(**{"CP-1": text})))
    assert not any("\x01" in c.row + c.column + c.text for c in snapshot.cells())
    assert wb.workbook_bytes(snapshot)[:2] == b"PK"


# --- Mutation testing of the figure path (PR 4, Task 6) ------------------------------------------


def test_the_control_character_warning_names_the_block_module_and_line_and_keeps_clean_labels(
    caplog,
):
    text = FIXTURE["CP-1A"].replace("designs and makes", "designs\x01 and makes", 1)
    line = next(i for i, part in enumerate(text.split("\n"), 1) if "\x01" in part)
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(run_of(full(**{"CP-1A": text})))
    expected = (
        "credit snapshot: Business description: a cell, its row or its column holds a control "
        f"character (module CP-1A, line {line})"
    )
    assert [r.getMessage() for r in caplog.records] == [expected]
    cell = one(snapshot, "Business description", "Description", "Value")
    assert (cell.kind, cell.text, cell.line) == ("gap", snap.CONTROL_CHARACTER, line)


def test_a_control_character_in_a_column_heading_replaces_that_column_name_only():
    text = FIXTURE["CP-1"].replace("| FY2025 |", "| FY2025\x01 |", 1)
    assert text != FIXTURE["CP-1"]
    snapshot = snap.gather(run_of(full(**{"CP-1": text})))
    assert not any("\x01" in c.row + c.column + c.text for c in snapshot.cells())
    hit = [c for c in snapshot.cells() if c.column == snap.CONTROL_CHARACTER]
    assert hit and all(c.kind == "gap" and c.text == snap.CONTROL_CHARACTER for c in hit)
    assert {c.row for c in hit} >= {"Revenue"}
    assert one(snapshot, "Financials", "Revenue", "FY2024").kind == "copied"


T49_ROW = "| {label} | f | 1 | s | 2 | s | {period} | GBP | {unit} | 1.5 | C | 1 | L |"


def with_t49_rows(*rows):
    return FIXTURE["CP-1"].replace(
        "| Net debt / EBITDA |", "\n".join(rows) + "\n| Net debt / EBITDA |", 1
    )


def test_a_unit_that_differs_between_a_labels_periods_is_that_rows_gap_only():
    old = "| 4.63 |"
    row = next(r for r in FIXTURE["CP-1"].split("\n") if old in r and "FY2024" in r)
    assert row.count("| GBP m |") == 1
    cp1 = FIXTURE["CP-1"].replace(row, row.replace("| GBP m |", "| EUR m |"))
    snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    gap = one(snapshot, "Financials", "Total debt / EBITDA", "Unit")
    assert (gap.kind, gap.text, gap.module, gap.line) == (
        "gap",
        "unit differs by period",
        None,
        None,
    )
    assert one(snapshot, "Financials", "Total debt / EBITDA", "Currency").text == "GBP"
    assert one(snapshot, "Financials", "Net debt / EBITDA", "Unit").text == "GBP m"


def test_a_unit_gap_for_a_free_label_row_leaves_that_row_with_values_and_no_unit_cell():
    rows = [
        T49_ROW.format(label="Senior leverage", period="FY2025 / 2025-12-31", unit="GBP m"),
        T49_ROW.format(label="Senior leverage", period="FY2024 / 2024-12-31", unit="EUR m"),
    ]
    snapshot = snap.gather(run_of(full(**{"CP-1": with_t49_rows(*rows)})))
    assert one(snapshot, "Financials", "Senior leverage", "Unit").text == "unit differs by period"
    assert one(snapshot, "Capital structure totals", "Senior leverage", "FY2025 / 2025-12-31").text
    assert not where(snapshot, "Capital structure totals", "Senior leverage", "Unit")
    same = [T49_ROW.format(label="Senior leverage", period="FY2025 / 2025-12-31", unit="GBP m")]
    snapshot = snap.gather(run_of(full(**{"CP-1": with_t49_rows(*same)})))
    assert one(snapshot, "Capital structure totals", "Senior leverage", "Unit").text == "GBP m"


def test_a_free_label_row_in_a_register_without_a_unit_column_has_values_and_no_unit_cell():
    row = T49_ROW.format(label="Senior leverage", period="FY2025 / 2025-12-31", unit="GBP m")
    cp1 = with_t49_rows(row).replace("| Currency | Unit |", "| Currency | Units |")
    snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    assert one(snapshot, "Financials", "Senior leverage", "Unit").text == "unit not in handoff"
    assert one(snapshot, "Capital structure totals", "Senior leverage", "FY2025 / 2025-12-31").text
    assert not where(snapshot, "Capital structure totals", "Senior leverage", "Unit")


@pytest.mark.parametrize(
    ("old", "new"),
    [
        ("| Instrument | Type |", "| Instrument | Kind |"),
        ("| Maturity | Annual Amortisation |", "| Matures | Annual Amortisation |"),
    ],
)
def test_an_instrument_table_without_a_type_or_maturity_column_joins_nothing(tmp_path, old, new):
    assert old in FIXTURE["CP-1"]
    moved = tmp_path / "CP-1.md"
    moved.write_text(FIXTURE["CP-1"].replace(old, new), "utf-8")
    (tmp_path / "w").mkdir()
    snapshot, _ = gathered_with(
        tmp_path / "w",
        rv_file(tmp_path, [rv_row("SYN1", "ABCDEFGHIJK1")]),
        handoffs={"CP-1": moved},
    )
    assert {c.kind for c in where(snapshot, "Instruments", column="FIGI")} == {"analyst"}
    assert {c.kind for c in where(snapshot, "Instruments", column="Bloomberg ID")} == {"analyst"}


# --- The newer CP-1 shape (bridge Add-Back ID, T4.18 Asset type, pro forma table) -----------------


def new_shape_cp1(text: str) -> str:
    """The key's CP-1 with the columns and the table the newer CP-1 handoff adds, built in code."""
    lines = text.splitlines()
    out: list[str] = []
    section = ""
    add_back = 0
    for line in lines:
        if line.startswith("### "):
            section = line
        if section.startswith("### Chart data: EBITDA bridge") and line.startswith("|"):
            cells = line.split("|")[1:-1]
            if cells[0].strip() == "Step":
                cells.insert(2, " Add-Back ID ")
            elif set(cells[0].strip()) == {"-"}:
                cells.insert(2, "---")
            else:
                add_back += 1
                cells.insert(2, f" AB-{add_back} ")
            line = "|" + "|".join(cells) + "|"
        elif section.startswith("### T4.18") and line.startswith("|"):
            cells = line.split("|")[1:-1]
            if cells[0].strip() == "Instrument":
                cells.insert(2, " Asset type ")
            elif set(cells[0].strip()) == {"-"}:
                cells.insert(2, "---")
            else:
                cells.insert(2, " Loan ")
            line = "|" + "|".join(cells) + "|"
        out.append(line)
    out += [
        "",
        "### Pro forma interest and cover",
        "",
        "| Measure | FY2025 | Reporting unit | Basis and limitation |",
        "|---|---|---|---|",
        "| Pro forma cash interest | 99999.9 | GBP millions | Invented; not shown. |",
        "| Pro forma cover | 8.8888 | times | Invented; not shown. |",
    ]
    return "\n".join(out) + "\n"


def test_a_cp1_handoff_in_the_new_shape_reads_the_same_and_the_new_table_adds_nothing():
    new = new_shape_cp1(FIXTURE["CP-1"])
    assert "| Step | Amount | Add-Back ID | Reporting unit | Basis and limitation |" in new
    assert "| Instrument | Type | Asset type | Carrying Value |" in new
    old_snapshot = snap.gather(run_of(full()))
    new_snapshot = snap.gather(run_of(full(**{"CP-1": new})))
    # The bridge steps and amounts, and every T4.18 column the workbook shows, read as before.
    steps = ("Reported EBITDA", "Restructuring costs", "Run-rate synergies", "Adjusted EBITDA")
    for step, amount in zip(steps, ("312.4", "20.0", "12.5", "351.2"), strict=True):
        assert one(new_snapshot, "EBITDA bridge", step, "Amount").text == amount
    assert one(new_snapshot, "Capital structure", "Term Loan B", "Principal").text == "600.0"
    assert not where(new_snapshot, "Capital structure", column="Asset type")
    # Nothing else moved, and the pro forma table (and its invented figures) is not shown.
    assert new_snapshot.cells() == old_snapshot.cells()
    shown = {c.text for c in new_snapshot.cells()}
    assert not {"99999.9", "8.8888", "Pro forma cash interest", "Pro forma cover"} & shown


@pytest.mark.parametrize("shape", ["old", "new"])
def test_the_join_type_rule_is_the_same_for_the_new_cp1_shape(tmp_path, shape):
    """A Type column lets the instruments join; without one (Asset type is no stand-in) none do."""
    base = FIXTURE["CP-1"] if shape == "old" else new_shape_cp1(FIXTURE["CP-1"])
    for name, text, kind in (
        ("typed", base, "copied"),
        ("untyped", base.replace("| Instrument | Type |", "| Instrument | Kind |"), "analyst"),
    ):
        directory = tmp_path / name
        directory.mkdir()
        moved = directory / "CP-1.md"
        moved.write_text(text, "utf-8")
        (directory / "w").mkdir()
        snapshot, _ = gathered_with(
            directory / "w",
            rv_file(directory, [rv_row("SYN1", "ABCDEFGHIJK1")]),
            handoffs={"CP-1": moved},
        )
        assert {c.kind for c in where(snapshot, "Instruments", LOAN_B, "FIGI")} == {kind}


# --- Branch fix 1: a leading T4.18 column, same-name references, formula identifiers --------------


def test_a_t418_with_a_column_before_instrument_downloads_and_labels_its_inputs_like_capital():
    from deploy_workflow import credit_snapshot_workbook as wb

    lines = FIXTURE["CP-1"].splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith("### T4.18"))
    out, seen = [], 0
    for i, line in enumerate(lines):
        if i > start and line.startswith("|"):
            cell = "#" if seen == 0 else ("---" if seen == 1 else str(seen - 1))
            line = f"| {cell} " + line
            seen += 1
        elif i > start and seen and not line.startswith("|"):
            start = len(lines)
        out.append(line)
    snapshot = snap.gather(run_of(full(**{"CP-1": "\n".join(out) + "\n"})))
    inputs = list(dict.fromkeys(c.row for c in snapshot.cells() if c.block == "Instruments"))
    capital = list(dict.fromkeys(c.row for c in snapshot.cells() if c.block == "Capital structure"))
    assert inputs and inputs == capital
    assert wb.workbook_bytes(snapshot)


def test_a_custom_portfolio_named_like_a_standing_one_gets_its_own_matrix_and_snapshot_cells(
    tmp_path,
):
    import io

    from openpyxl import load_workbook

    from deploy_workflow import credit_snapshot_workbook as wb

    built = cs.build_case(tmp_path, cs.CASES["full"])
    own = replace(cs.lvln_portfolio(), key="custom", name="CLO portfolio", kind="custom")
    built.stores.run.save(own)
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    book = load_workbook(io.BytesIO(wb.workbook_bytes(snapshot)))
    rows = list(book["Sources"].iter_rows(min_row=2, values_only=True))

    def formulas(sheet, block, column):
        return [
            book[r[0]][r[1]].value
            for r in rows
            if (r[0], r[3], r[5]) == (sheet, block, column)
            and r[4] in ("CLO portfolio", "CLO portfolio (2)")
        ]

    proposed = formulas("Snapshot", "Recommendation", "Proposed")
    results = formulas("Matrix", "Portfolio result", "Result")
    assert len(proposed) == len(results) == 2
    assert proposed[0] != proposed[1] and results[0] != results[1]


def test_a_formula_in_an_rv_workbook_is_its_stored_value_or_an_absent_identifier(tmp_path, caplog):
    import io

    from openpyxl import Workbook

    book = Workbook()
    sheet = book.active
    sheet.title = "RV"
    sheet.append(list(snap.MARKET_COLUMNS))
    sheet.append(
        ["Northbridge Holdings plc", "Northbridge Holdings plc", '=BDP("NBG TL","ID_BB_UNIQUE")',
         "", "Term Loan", "Senior secured", "600", "375", "2031-03-31"]
    )  # fmt: skip
    buffer = io.BytesIO()
    book.save(buffer)
    raw = buffer.getvalue()
    digest = cs.sha256(raw)
    (tmp_path / "inputs").mkdir()
    (tmp_path / "inputs" / digest).write_bytes(raw)
    found = snap._market_sheets(tmp_path, {"rv.xlsx": {"path": "rv.xlsx", "sha256": digest}})
    row = found[0].rows[0]
    assert "Formula" not in row.cells["Bloomberg ID"] and "=" not in row.cells["Bloomberg ID"]
    assert not any("=" in v or "Formula" in v for v in snap._present(row).values())


def test_a_reference_name_with_a_control_character_is_the_gap_text_and_is_logged(tmp_path, caplog):
    built = cs.build_case(tmp_path, cs.CASES["full"])
    own = replace(cs.clo_portfolio(), key="custom", name="Own\x01 book", kind="custom")
    built.stores.run.save(own)
    with caplog.at_level(logging.WARNING, logger=LOGGER):
        snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    names = [view.name for view in snapshot.references]
    assert snap.CONTROL_CHARACTER in names and not any(snap.ILLEGAL.search(n) for n in names)
    assert "its name holds a control character" in caplog.text


# --- Reader text (PM-2): the literal cases of the web port's tests --------------------------------
# Copied as literals from web/src/pages/connected/moduleCodes.cases.json ("reader" cases) and
# readerText.lowercase.test.ts / readerText.creditScreening.test.ts.

READER_CASES = [
    (
        "CP-1 does not state a single canonical figure.",
        "Financial foundation does not state a single canonical figure.",
    ),
    (
        "Blocked interface only: CP-2A is explicitly blocked.",
        "Blocked interface only: Downside is explicitly blocked.",
    ),
    ("CP-2A: covenant headroom restated", "Downside: covenant headroom restated"),
    (
        "The classifier clears CP-3 and CP-3D.",
        "The classifier clears Security selection and Market-implied risk.",
    ),
    (
        "Financial foundation (CP-1) reports leverage of 5.2x.",
        "Financial foundation reports leverage of 5.2x.",
    ),
    (
        "Leverage is 5.2x (FY2024) and 4.8x pro forma; USD 1,250.0 million.",
        "Leverage is 5.2x (FY2024) and 4.8x pro forma; USD 1,250.0 million.",
    ),
    ("See CP-2E-GAP-001 for the hedge gap.", "See CP-2E-GAP-001 for the hedge gap."),
    (
        "Read from outputs/CP-1.md and CP-1-tables.md.",
        "Read from outputs/CP-1.md and CP-1-tables.md.",
    ),
    ("Deck (CP-1) Q3.pdf", "Deck (CP-1) Q3.pdf"),
    (
        "CP-2G-forecast-block.md is the forecast block.",
        "CP-2G-forecast-block.md is the forecast block.",
    ),
    ("CP-99 is not scheduled.", "CP-99 is not scheduled."),
    ("XCP-1 and CP-1x are not module codes.", "XCP-1 and CP-1x are not module codes."),
    ("Read by CP-1/CP-2.", "Read by Financial foundation/Fundamental credit."),
    ("See CP-2A/notes.md for the working.", "See CP-2A/notes.md for the working."),
    ("outputs/CP-1 holds the tables.", "outputs/CP-1 holds the tables."),
    ("The TDG-CP-1 pack is stored.", "The TDG-CP-1 pack is stored."),
    ("archive.CP-1 is a folder name.", "archive.CP-1 is a folder name."),
    ("CP-1's leverage is 5.2x.", "Financial foundation's leverage is 5.2x."),
    ("The haircut (CP-3) holds.", "The haircut (Security selection) holds."),
    (
        "Security selection (CP-3) and the haircut (CP-3) agree.",
        "Security selection and the haircut (Security selection) agree.",
    ),
    ("Downside (CP-2A) closed it.", "Downside closed it."),
    ("business & governance (CP-1A) is unchanged.", "business & governance is unchanged."),
    ("Checked twice (CP-99) today.", "Checked twice (CP-99) today."),
    (
        "Leverage of 5.2x (CP-1) and 4.8x (CP-2).",
        "Leverage of 5.2x (Financial foundation) and 4.8x (Fundamental credit).",
    ),
    (
        "Financial data foundation (CP-1) reports leverage of 5.2x.",
        "Financial data foundation (Financial foundation) reports leverage of 5.2x.",
    ),
]
LOWERCASE_CASES = [
    (
        "cp-1 does not state a single canonical figure.",
        "Financial foundation does not state a single canonical figure.",
    ),
    (
        "Blocked interface only: cp-2a is explicitly blocked.",
        "Blocked interface only: Downside is explicitly blocked.",
    ),
    ("cp-2a: covenant headroom restated", "Downside: covenant headroom restated"),
    (
        "The classifier clears cp-3 and cp-3d.",
        "The classifier clears Security selection and Market-implied risk.",
    ),
    ("cp-1's leverage is 5.2x.", "Financial foundation's leverage is 5.2x."),
    ("Read by cp-1/cp-2.", "Read by Financial foundation/Fundamental credit."),
    (
        "Financial foundation (cp-1) reports leverage of 5.2x.",
        "Financial foundation reports leverage of 5.2x.",
    ),
    ("The haircut (cp-3) holds.", "The haircut (Security selection) holds."),
    (
        "Leverage of 5.2x (cp-1) and 4.8x (cp-2).",
        "Leverage of 5.2x (Financial foundation) and 4.8x (Fundamental credit).",
    ),
    ("cp-99 is not scheduled.", "cp-99 is not scheduled."),
    ("Checked twice (cp-99) today.", "Checked twice (cp-99) today."),
    ("xcp-1 and cp-1x are not module codes.", "xcp-1 and cp-1x are not module codes."),
    (
        "Read from outputs/cp-1.md and cp-1-tables.md.",
        "Read from outputs/cp-1.md and cp-1-tables.md.",
    ),
    ("Deck (cp-1) Q3.pdf", "Deck (cp-1) Q3.pdf"),
    (
        "cp-2g-forecast-block.md is the forecast block.",
        "cp-2g-forecast-block.md is the forecast block.",
    ),
    ("See cp-2a/notes.md for the working.", "See cp-2a/notes.md for the working."),
    ("outputs/cp-1 holds the tables.", "outputs/cp-1 holds the tables."),
    ("The tdg-cp-1 pack is stored.", "The tdg-cp-1 pack is stored."),
    ("archive.cp-1 is a folder name.", "archive.cp-1 is a folder name."),
    ("See cp-2e-gap-001 for the hedge gap.", "See cp-2e-gap-001 for the hedge gap."),
]
CREDIT_SCREENING_CASES = [
    ("CP-L10 found no gap.", "credit_screening", "Credit screening found no gap."),
    (
        "See CP-L10 and CP-1.",
        "credit_screening",
        "See Credit screening and Financial foundation.",
    ),
    ("CP-L10 found no gap.", None, "Short credit snapshot found no gap."),
    ("CP-L10 found no gap.", "lite_credit_assessment", "Short credit snapshot found no gap."),
]


@pytest.mark.parametrize(("text", "expected"), READER_CASES + LOWERCASE_CASES)
def test_reader_text_matches_the_web_ports_literal_cases(text, expected):
    assert snap.reader_text(text, chips.module_names(None)) == expected


@pytest.mark.parametrize(("text", "pathway", "expected"), CREDIT_SCREENING_CASES)
def test_reader_text_names_cp_l10_by_the_runs_pathway(text, pathway, expected):
    assert snap.reader_text(text, chips.module_names(pathway)) == expected


@pytest.mark.parametrize("code", sorted(snap.UNNAMED_CODES - set(chips.MODULE_NAMES)))
def test_a_module_code_with_no_reader_name_reads_as_unnamed(code):
    assert snap.reader_text(f"{code} reads it.", chips.module_names(None)) == (
        "Unnamed module reads it."
    )


# --- Pro forma interest and cover (PM-4, ruling PM-d) ---------------------------------------------

PRO_FORMA_HEAD = (
    "| As of | Pro forma interest | Interest measure | EBITDA | Pro forma interest cover "
    "| Reporting unit | Basis and limitation |"
)


def with_pro_forma(*rows):
    """The key's CP-1 with a `### Pro forma interest and cover` table in `PRO_FORMA`'s header
    order, one row per argument."""
    table = [
        "",
        "### Pro forma interest and cover",
        "",
        PRO_FORMA_HEAD,
        "|---|---|---|---|---|---|---|",
    ]
    return full(**{"CP-1": FIXTURE["CP-1"] + "\n".join([*table, *rows, ""])})


REPORTED = (
    "| 2026-03-31 | 70.0 | cash interest | 351.2 | 5.02 | GBP millions "
    "| Reported EBITDA; the press release. |"
)
ADJUSTED = (
    "| 2026-03-31 | 70.0 | cash interest | 380.0 | 5.43 | GBP millions "
    "| Adjusted EBITDA; the press release. |"
)
NOT_SUPPLIED = "Not supplied: no source states it"


def pro_forma_cells(snapshot, label):
    return {c.column: c for c in where(snapshot, "Capital structure totals", label)}


def test_the_pro_forma_totals_rows_are_the_reported_ebitda_rows_figures_with_their_units():
    snapshot = snap.gather(run_of(with_pro_forma(REPORTED, ADJUSTED)))
    interest = pro_forma_cells(snapshot, "Pro forma interest")
    assert (interest["Value"].kind, interest["Value"].text) == ("copied", "70.0")
    assert (interest["Unit"].kind, interest["Unit"].text) == ("copied", "GBP millions")
    assert (interest["Value"].module, interest["Value"].line) == ("CP-1", interest["Unit"].line)
    cover = pro_forma_cells(snapshot, "Pro forma interest cover")
    assert (cover["Value"].kind, cover["Value"].text) == ("copied", "5.02")  # not Adjusted's 5.43
    assert (cover["Unit"].kind, cover["Unit"].text) == ("computed", "times")
    assert cover["Value"].figure is not None and cover["Value"].figure.value == 5.02


def test_the_reported_row_is_read_even_when_the_adjusted_row_comes_first():
    snapshot = snap.gather(run_of(with_pro_forma(ADJUSTED, REPORTED)))
    assert pro_forma_cells(snapshot, "Pro forma interest cover")["Value"].text == "5.02"


@pytest.mark.parametrize(
    "row",
    [
        (
            f"| 2026-03-31 | {NOT_SUPPLIED} | cash interest | 351.2 | {NOT_SUPPLIED} "
            "| GBP millions | Reported EBITDA; none. |"
        ),
        "| " + " | ".join(["Not stated"] * 6) + " | Reported EBITDA; none. |",
    ],
)
def test_a_pro_forma_cell_that_states_no_figure_is_not_in_handoff(row):
    snapshot = snap.gather(run_of(with_pro_forma(row)))
    for label in ("Pro forma interest", "Pro forma interest cover"):
        cells = where(snapshot, "Capital structure totals", label)
        assert [(c.column, c.kind, c.text) for c in cells] == [("Value", "gap", "not in handoff")]


def test_a_stated_interest_with_no_reporting_unit_has_the_unit_gap_and_the_cover_is_not_lost():
    row = REPORTED.replace("GBP millions", "Not supplied: the source gives no unit")
    snapshot = snap.gather(run_of(with_pro_forma(row)))
    interest = pro_forma_cells(snapshot, "Pro forma interest")
    assert (interest["Value"].text, interest["Unit"].kind, interest["Unit"].text) == (
        "70.0",
        "gap",
        "unit not in handoff",
    )
    assert pro_forma_cells(snapshot, "Pro forma interest cover")["Value"].text == "5.02"


def test_without_the_table_the_pro_forma_rows_stay_not_in_handoff():
    snapshot = snap.gather(run_of(full()))
    for label in ("Pro forma interest", "Pro forma interest cover"):
        cells = where(snapshot, "Capital structure totals", label)
        assert [(c.column, c.kind, c.text) for c in cells] == [("Value", "gap", "not in handoff")]


def test_an_unreadable_peer_table_names_its_module_by_name_and_keeps_the_reason_on_the_gap():
    broken = FIXTURE["CP-1C"].replace("| Entity Name |", "| Entity |", 1)
    snapshot = snap.gather(run_of(full(**{"CP-1C": broken})))
    gaps = [c for c in where(snapshot, "Peers") if c.kind == "gap"]
    assert len(gaps) == 1
    reader_gap(gaps[0], "The Peer benchmark peer table could not be read.", "`Entity Name` column")
    assert [c.text for c in where(snapshot, "Peers") if c.kind == "copied"]  # CP-DR's still read


def test_an_unreadable_dr_peer_table_names_research_questions():
    broken = FIXTURE["CP-DR"].replace("| name |", "| entity |", 1)
    assert broken != FIXTURE["CP-DR"]
    snapshot = snap.gather(run_of(full(**{"CP-DR": broken})))
    (gap,) = [c for c in where(snapshot, "Peers") if c.kind == "gap"]
    reader_gap(gap, "The Research questions peer table could not be read.", "`name` column")


# --- Repeated labels (L2, ruling PM-g) ------------------------------------------------------------


def test_a_repeated_label_is_numbered_until_it_is_a_label_the_block_does_not_hold():
    first = next(line for line in FIXTURE["CP-1"].split("\n") if line.startswith("| Term Loan B |"))
    renamed = first.replace("| Term Loan B |", "| Term Loan B (2) |", 1)
    cp1 = FIXTURE["CP-1"].replace(first, f"{first}\n{renamed}\n{first}", 1)
    snapshot = snap.gather(run_of(full(**{"CP-1": cp1})))
    rows = list(dict.fromkeys(c.row for c in where(snapshot, "Capital structure")))
    assert rows[:4] == [
        "Term Loan B",
        "Term Loan B (2)",
        "Term Loan B (3)",
        "Revolving Credit Facility",
    ]
    principal = [where(snapshot, "Capital structure", r, "Principal")[0].text for r in rows[:3]]
    assert principal == ["600.0", "600.0", "600.0"]
    for block in snapshot.blocks:  # no two cells of any block share a row and column
        keys = [(c.row, c.column) for c in block.cells]
        assert len(keys) == len(set(keys)), block.name


def test_a_literal_label_that_comes_after_the_repeat_keeps_its_name():
    cells = [
        snap.SnapshotCell("Snapshot", "B", row, "Text", "copied", row)
        for row in ("Event", "Event", "Event (2)")
    ]
    assert [c.row for c in snap._numbered(cells)] == ["Event", "Event (3)", "Event (2)"]
