"""C3 fix round 1 (dispatch A): the Credit Snapshot writer keeps every handoff cell exactly.

SYNTHETIC: tables are invented, built directly as handoff tables; the end-to-end cases start from
the key's invented "Northbridge" run (`tests/credit_snapshot_case.py`). Scope: written cell values
and types are compared with the literal handoff table text they come from.
"""

from __future__ import annotations

import io
import re
import zipfile
from dataclasses import replace

import credit_snapshot_case as cs
import pytest
from openpyxl import load_workbook

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_workbook as writer


def table(headers, *rows):
    return snap._Table(
        "CP-1",
        "cp1.test",
        tuple(headers),
        tuple(snap._Row(10 + i, tuple(row)) for i, row in enumerate(rows)),
    )


def triples(cells):
    return {(c.row, c.column, c.text) for c in cells}


@pytest.fixture(scope="module")
def run(tmp_path_factory):
    built = cs.build_case(tmp_path_factory.mktemp("cells"), cs.CASES["full"])
    return snap.gather(snap.load_run(built.folder, built.stores.both()))


def with_block(run, name, edit):
    blocks = tuple(
        replace(block, cells=edit(block.cells)) if block.name == name else block
        for block in run.blocks
    )
    return replace(run, blocks=blocks)


def texts(book):
    return {
        c.value
        for ws in book.worksheets
        for row in ws.iter_rows()
        for c in row
        if isinstance(c.value, str)
    }


def test_duplicate_strength_rows_do_not_crash_and_keep_every_cell(run):
    def edit(cells):
        return tuple(replace(c, row="Strength 1") if c.row == "Strength 2" else c for c in cells)

    data = writer.workbook_bytes(with_block(run, writer.STRENGTHS, edit))
    shown = texts(load_workbook(io.BytesIO(data)))
    for text in (
        "Aftermarket annuity",
        (
            "Aftermarket is 38% of sales and recurs, so cash flow is steadier "
            "and supports debt service."
        ),
        "Diversified end markets",
        "No customer is above 5% of sales, so a single loss cannot break cover.",
    ):
        assert text in shown


def test_segment_schedule_is_named_by_business_unit_column():
    cells = writer._segment_schedule_cells(
        table(
            ["Period", "Business Unit", "Revenue", "EBITDA", "Unit"],
            ["FY2025", "Airframe", "100", "10", "USD millions"],
            ["FY2025", "Power", "200", "20", "USD millions"],
        )
    )
    assert triples(cells) == {
        ("Airframe · Revenue (USD millions)", "FY2025", "100"),
        ("Airframe · EBITDA (USD millions)", "FY2025", "10"),
        ("Power · Revenue (USD millions)", "FY2025", "200"),
        ("Power · EBITDA (USD millions)", "FY2025", "20"),
    }


def test_segment_schedule_without_name_column_is_an_explicit_gap():
    cells = writer._segment_schedule_cells(
        table(["Period", "Segment", "Revenue"], ["FY2025", "Airframe", "100"])
    )
    assert [c.kind for c in cells] == [snap.GAP]
    assert "Business Unit" in cells[0].written


@pytest.mark.parametrize(
    "row",
    [
        ["Net leverage", "(1.5)", "(2.0)"],
        ["ARPU", "$45", "$46"],
        ["Churn", "Not calculable: no subscriber count", "Not calculable: no subscriber count"],
    ],
)
def test_operating_kpi_row_is_kept_with_exact_text(row):
    cells = writer._period_table_cells(
        table(["Metric Name", "FY2025", "FY2026"], row), writer.OPERATING_KPIS
    )
    assert triples(cells) == {(row[0], "FY2025", row[1]), (row[0], "FY2026", row[2])}


def test_segment_value_columns_are_excluded_by_whole_header_only():
    cells = writer._segment_schedule_cells(
        table(
            ["Period", "Business Unit", "Community Revenue", "Units sold", "Notes", "Source"],
            ["FY2025", "Airframe", "100", "7", "a note", "p.4"],
        )
    )
    assert triples(cells) == {
        ("Airframe · Community Revenue", "FY2025", "100"),
        ("Airframe · Units sold", "FY2025", "7"),
    }


@pytest.mark.parametrize(
    "header", ["Resource cost", "Notes receivable", "Noteholder consent", "Units sold"]
)
def test_debt_property_keeps_headers_that_only_contain_an_excluded_word(header):
    assert writer._debt_property(header)


@pytest.mark.parametrize("header", ["Source", "Basis", "Locator", "Evidence", "Note"])
def test_debt_property_still_excludes_the_whole_header_names(header):
    assert not writer._debt_property(header)


def test_error_looking_text_is_written_as_a_string_cell(run):
    errors = ("#N/A", "#DIV/0!", "#REF!")

    def edit(cells):
        out, k = [], 0
        for c in cells:
            if c.column == "Mechanism" and k < len(errors):
                c, k = replace(c, text=errors[k]), k + 1
            out.append(c)
        return tuple(out)

    data = writer.workbook_bytes(with_block(run, writer.STRENGTHS, edit))
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        for name in zf.namelist():
            if name.startswith("xl/worksheets/"):
                assert 't="e"' not in zf.read(name).decode()
    book = load_workbook(io.BytesIO(data))
    for error in errors:
        located = [
            c for ws in book.worksheets for row in ws.iter_rows() for c in row if c.value == error
        ]
        assert located, error
        assert all(c.data_type == "s" for c in located)
    sources = book["Sources"]
    assert any(c.value == "#N/A" for row in sources.iter_rows() for c in row)


def test_currency_column_is_labelled_currency_and_both_values_kept():
    cells = writer._period_table_cells(
        table(
            ["Metric Name", "FY2025", "Unit", "Currency"],
            ["Revenue", "100", "millions", "USD"],
        ),
        writer.OPERATING_KPIS,
    )
    assert triples(cells) == {
        ("Revenue", "FY2025", "100"),
        ("Revenue", "Unit", "millions"),
        ("Revenue", "Currency", "USD"),
    }


def test_second_value_for_the_same_row_and_column_is_logged_and_kept(caplog):
    axis = writer._ModelAxis(("FY2025",), {})
    one = snap.SnapshotCell("Model", "B", "Revenue", "Unit", snap.COPIED, "millions")
    two = snap.SnapshotCell("Model", "B", "Revenue", "Unit", snap.COPIED, "USD")
    with caplog.at_level("WARNING"):
        rows = writer._align_model_rows(["Unit"], [("Revenue", [one, two])], axis)
    assert [(name, [c and c.text for c in cells]) for name, cells in rows] == [
        ("Revenue", ["millions"]),
        ("Revenue (second Unit value)", ["USD"]),
    ]
    assert "two values" in caplog.text
    assert re.search(r"Revenue", caplog.text)
