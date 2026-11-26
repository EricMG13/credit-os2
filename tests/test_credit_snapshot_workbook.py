"""The Credit Snapshot workbook writer: layout and presentation facts the fidelity test does not
cover (`tests/test_credit_snapshot_fidelity.py` holds the content against the answer key).

SYNTHETIC: the runs are the key's invented "Northbridge" cases (`tests/credit_snapshot_case.py`).
"""

from __future__ import annotations

import io
from dataclasses import replace

import credit_snapshot_case as cs
import pytest
from openpyxl import load_workbook
from openpyxl.worksheet.cell_range import CellRange

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_workbook as writer
from deploy_workflow.cp2_scorecard import FACTORS, level_text

THREE = ("Snapshot", "Inputs", "Matrix")


@pytest.fixture(scope="module")
def full(tmp_path_factory):
    built = cs.build_case(tmp_path_factory.mktemp("full"), cs.CASES["full"])
    return built, snap.gather(snap.load_run(built.folder, built.stores.both()))


@pytest.fixture(scope="module")
def book(full):
    return load_workbook(io.BytesIO(writer.workbook_bytes(full[1])))


def sources(book) -> list[dict]:
    sheet = book["Sources"]
    header = [c.value for c in sheet[1]]
    return [
        dict(zip(header, (c.value for c in row), strict=True))
        for row in sheet.iter_rows(min_row=2)
        if any(c.value is not None for c in row)
    ]


def listed(book, block, **where) -> list[dict]:
    """Sources rows of `block` (on Snapshot unless `sheet=` says), narrowed by any of the keyword
    names `row`, `column`, `kind`."""
    want = {"Sheet": where.pop("sheet", "Snapshot"), "Block": block}
    want |= {key.title(): value for key, value in where.items()}
    return [r for r in sources(book) if all(r[k] == v for k, v in want.items())]


def cell_of(book, **where):
    (row,) = listed(book, **where)
    return book[row["Sheet"]][row["Cell"]]


# --- The sheet ------------------------------------------------------------------------------------


def test_snapshot_sheet_is_a_one_page_wide_landscape_page_with_a_frozen_title_band(book):
    sheet = book["Snapshot"]
    assert sheet.sheet_view.showGridLines is False
    assert sheet.freeze_panes == "A3"
    assert sheet.page_setup.orientation == "landscape"
    assert (sheet.page_setup.fitToWidth, sheet.page_setup.fitToHeight) == (1, 0)
    assert sheet.sheet_properties.pageSetUpPr.fitToPage is True
    assert sheet.print_title_rows == "$1:$2"


def test_the_four_sheets_in_order(book):
    assert book.sheetnames == ["Snapshot", "Inputs", "Matrix", "Sources"]


def test_cards_are_bordered_ranges_that_do_not_overlap(book):
    for name in THREE:
        ranges = [CellRange(str(r)) for r in book[name].merged_cells.ranges]
        for i, one in enumerate(ranges):
            assert all(one.isdisjoint(other) for other in ranges[i + 1 :]), (name, one)
    cell = cell_of(book, block="Header", row="Issuer", column="Value")
    assert cell.border.left.style == "thin" and cell.border.top.style == "thin"


def test_nothing_is_written_beyond_the_grid(book, full):
    widths = {layout.sheet: layout.width for layout in writer.LAYOUTS}
    for name in THREE:
        assert book[name].max_column <= widths[name]


# --- The heat strip -------------------------------------------------------------------------------


def test_the_heat_strip_is_one_cell_per_factor_with_a_three_colour_scale_and_no_yellow(book):
    sheet = book["Snapshot"]
    levels = listed(book, "Scorecard", column="Level")
    assert [r["Row"] for r in levels] == list(FACTORS)
    rules = [
        rule
        for item in sheet.conditional_formatting
        for rule in item.rules
        if rule.colorScale is not None
    ]
    assert len(rules) == 1 and len(rules[0].colorScale.color) == 3
    colours = [c.rgb[-6:] for c in rules[0].colorScale.color]
    assert colours == list(writer.HEAT)
    for colour in colours:
        red, green, blue = (int(colour[k : k + 2], 16) for k in (0, 2, 4))
        assert not (red >= 0xF0 and green >= 0xE0 and blue <= min(red, green) - 0x10), colour
    scale = next(item.sqref for item in sheet.conditional_formatting if item.rules[0].colorScale)
    strip = CellRange(str(scale))
    assert {(sheet[r["Cell"]].row, sheet[r["Cell"]].column) for r in levels} == set(strip.cells)
    # Each factor name is a label cell directly above its level.
    for r in levels:
        above = sheet.cell(sheet[r["Cell"]].row - 1, sheet[r["Cell"]].column)
        assert above.value == r["Row"]


def test_the_basis_of_a_factor_is_the_comment_on_its_level(book, full):
    built, _ = full
    lines = cs.physical_lines(built.handoff_text["CP-2"])
    start = next(i for i, line in enumerate(lines) if "T2.13" in line)
    basis = {}
    for line in lines[start:]:
        cells = cs.pipe_cells(line) if line.lstrip().startswith("|") else []
        if len(cells) == 3 and cells[0] in FACTORS:
            basis[cells[0]] = cells[2]
    assert set(basis) == set(FACTORS)
    for factor in FACTORS:
        comment = cell_of(book, block="Scorecard", row=factor, column="Level").comment
        assert comment is not None and comment.text == basis[factor]
        assert "CP-" not in comment.text and ".pdf" not in comment.text
    assessed = cell_of(book, block="Assessments", row="Management", column="View").comment
    assert assessed is not None and assessed.text


def test_a_not_scored_factor_is_text_and_a_scored_one_is_a_number(book):
    assert (
        cell_of(book, block="Scorecard", row="Market share", column="Level").value == "Not scored"
    )
    scale = cell_of(book, block="Scorecard", row="Scale", column="Level")
    assert scale.value == 2 and scale.number_format == "0"


# --- Strengths and weaknesses ---------------------------------------------------------------------


def test_strengths_and_weaknesses_face_each_other_with_glyphs(book):
    sheet = book["Snapshot"]
    glyphs = {r["Row"]: sheet[r["Cell"]] for r in listed(book, writer.STRENGTHS, column="Glyph")}
    assert {k: c.value for k, c in glyphs.items()} == {
        **{f"Strength {n}": "▲" for n in (1, 2)},
        **{f"Weakness {n}": "▼" for n in (1, 2)},
    }
    for row, glyph in glyphs.items():
        label = cell_of(book, block=writer.STRENGTHS, row=row, column="Label")
        assert label.row == glyph.row and label.column > glyph.column
    left, right = glyphs["Strength 1"], glyphs["Weakness 1"]
    assert left.row == right.row and left.column < right.column
    # The glyph is its own cell: the handoff text is not touched.
    assert cell_of(book, block=writer.STRENGTHS, row="Strength 1", column="Label").value == (
        "Aftermarket annuity"
    )


# --- Numbers --------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("row", "column", "value", "number_format"),
    [
        ("Revenue", "FY2025", 1234.5, "#,##0.0;(#,##0.0)"),
        ("Revenue", "FY2024", 1180.0, "#,##0.0;(#,##0.0)"),
        ("Net Cash from Investing Activities", "FY2025", -85.2, "0.0;(0.0)"),
        ("Net Cash from Investing Activities", "FY2024", -70.4, "0.0;(0.0)"),
        ("Opening Cash", "FY2024", 62.0, "0.0;(0.0)"),
    ],
)
def test_financials_figures_keep_their_decimals_and_show_negatives_in_brackets(
    book, row, column, value, number_format
):
    cell = cell_of(book, block="Financials", row=row, column=column)
    assert (cell.value, cell.number_format) == (value, number_format)


@pytest.mark.parametrize(
    ("row", "column", "text"),
    [
        ("EBITDA (Reported)", "FY2024", "298.12345678901234567"),  # more than 15 digits
        ("Net Cash from Operating Activities", "FY2025", "212.0m"),  # a unit in the cell
        ("Net Cash from Financing Activities", "FY2024", "(40.0)"),  # brackets are text
        ("Gross profit", "FY2024", "–"),  # a period the table has and leaves empty
    ],
)
def test_figures_the_rule_refuses_stay_text(book, row, column, text):
    cell = cell_of(book, block="Financials", row=row, column=column)
    assert cell.value == text and cell.data_type == "s"


def test_every_number_has_the_format_the_number_rule_chose_and_never_general(book):
    seen = 0
    for row in sources(book):
        if row["Sheet"] not in THREE or row["Kind"] not in (
            "copied",
            "computed",
            "entered at run start",
        ):
            continue
        cell = book[row["Sheet"]][row["Cell"]]
        figure = snap.figure(row["Handoff text"] or "")
        if figure is None:
            assert not isinstance(cell.value, int | float), row
            continue
        seen += 1
        expected = figure.number_format
        if row["Block"] == "Financials":
            expected = f"{expected};({expected})"
        assert (cell.value, cell.number_format) == (figure.value, expected), row
        assert cell.number_format != "General"
    assert seen > 100


def test_only_financials_uses_the_bracket_format(book):
    for row in sources(book):
        if row["Sheet"] in THREE and row["Block"] != "Financials":
            cell = book[row["Sheet"]][row["Cell"]]
            assert ";" not in cell.number_format, row


# --- Analyst cells and Sources --------------------------------------------------------------------


def test_the_investment_thesis_is_a_blank_yellow_analyst_cell(book):
    cell = cell_of(book, block="Investment thesis", row="Thesis", column="Value")
    assert cell.value is None and cell.fill.start_color.rgb[-6:] == writer.ANALYST_FILL
    assert len(listed(book, "Investment thesis", row="Thesis", kind="analyst")) == 1


def test_the_writer_adds_analyst_cells_for_the_fields_no_module_supplies(book, full):
    instruments = [r for r in listed(book, "Instruments", sheet="Inputs") if r["Kind"] == "analyst"]
    names = {
        r["Row"]
        for r in listed(book, "Instruments", column="Instrument", sheet="Inputs", kind="copied")
    }
    assert len(names) == 5
    joined = {"Term Loan B"}  # the one instrument the key's RV worksheet identifies
    assert {(r["Row"], r["Column"]) for r in instruments} == {
        (n, c)
        for n in names
        for c in writer.INSTRUMENT_INPUTS
        if not (n in joined and c in snap.IDENTIFIERS)
    }
    units = listed(book, "Reference unit", column="Unit", sheet="Inputs", kind="analyst")
    assert sorted(r["Row"] for r in units) == ["CLO portfolio", "Loan index fund (LVLN)"]
    assert {r["Kind"] for r in units} == {"analyst"}
    new_issue = [r for r in listed(book, "New issue") if r["Kind"] == "analyst"]
    assert len(new_issue) == 2 * len(writer.NEW_ISSUE_INPUTS)
    assert len(listed(book, "Header", row="Issuer ID", kind="analyst")) == 1
    assert {r["Row"] for r in listed(book, "Confirmation", sheet="Inputs", kind="analyst")} == {
        "Analyst",
        "Confirmation date",
    }


def test_basis_lines_are_copied_text_on_sources_only(book, full):
    built, snapshot = full
    sheet = book["Sources"]
    rows = [r for r in sources(book) if r["Column"] == "Basis"]
    assert len(rows) == len(snapshot.basis_lines) == 5
    for row, line in zip(rows, snapshot.basis_lines, strict=True):
        assert row["Sheet"] == "Sources" and row["Kind"] == "copied"
        assert sheet[row["Cell"]].value == line.text == row["Handoff text"]
        assert row["Handoff sha256"] == cs.sha256(built.handoff_text[line.module].encode())


def test_the_sources_header_is_the_contract_and_the_title_cells_are_labels(book):
    assert tuple(c.value for c in book["Sources"][1]) == cs.SOURCES_HEADER
    banner = listed(book, "Page", row="(title)")
    assert [r["Kind"] for r in banner] == ["label"]


def test_hidden_blocks_leave_no_title_or_row(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["no_scorecard"])
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    blocks = {r["Block"] for r in sources(book)}
    assert not blocks & {"New issue", "Quotes as entered", "Assessments", "Monitoring triggers"}
    (gap,) = listed(book, "Scorecard", kind="gap")
    assert gap["Row"] == "Gap" and book["Snapshot"][gap["Cell"]].value == gap["Handoff text"]
    assert not listed(book, "Reference unit", sheet="Inputs")  # no stored reference


# --- The rubric -----------------------------------------------------------------------------------


def test_the_matrix_rubric_is_the_methodology_text_one_row_per_factor(book):
    lines = level_text().splitlines()
    header = cs.pipe_cells(lines[0])
    expected = {}
    for line in lines[1:]:
        cells = cs.pipe_cells(line)
        expected.update(
            {(cells[1], name): text for name, text in zip(header[2:], cells[2:], strict=True)}
        )
    shown = {
        (r["Row"], r["Column"]): book["Matrix"][r["Cell"]].value
        for r in listed(book, "Risk rubric", sheet="Matrix")
        if r["Kind"] == "label" and r["Row"] != "(header)" and r["Column"] in header[2:]
    }
    assert len(expected) == 17 * 5
    assert shown == expected
    cell = book["Matrix"][
        listed(book, "Risk rubric", row="Scale", column="1 Excellent", sheet="Matrix")[0]["Cell"]
    ]
    assert cell.value.startswith("EBITDA > $1bn")


# --- Purity and awkward text ----------------------------------------------------------------------


def look_of(book) -> dict:
    out = {}
    for name in book.sheetnames:
        sheet = book[name]
        for row in sheet.iter_rows():
            for c in row:
                out[name, c.coordinate] = (
                    c.value,
                    c.number_format,
                    c.font.b,
                    c.font.i,
                    c.fill.start_color.rgb,
                    c.border.left.style if c.border.left else None,
                    c.alignment.wrap_text,
                    c.comment.text if c.comment else None,
                )
        out[name, "merged"] = sorted(str(r) for r in sheet.merged_cells.ranges)
        out[name, "widths"] = {k: d.width for k, d in sheet.column_dimensions.items()}
        out[name, "heights"] = {k: d.height for k, d in sheet.row_dimensions.items()}
        out[name, "cf"] = sorted(str(i.sqref) for i in sheet.conditional_formatting)
    return out


def test_workbook_bytes_is_a_function_of_its_snapshot(full):
    _, snapshot = full
    one = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    two = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    assert look_of(one) == look_of(two)
    assert sources(one) == sources(two)


def test_a_different_snapshot_gives_a_different_workbook(full):
    _, snapshot = full
    cells = tuple(
        replace(c, text="Changed Ltd") if (c.block, c.row) == ("Header", "Issuer") else c
        for c in snapshot.cells()
    )
    changed = replace(
        snapshot,
        blocks=tuple(
            replace(b, cells=tuple(c for c in cells if (c.sheet, c.block) == (b.sheet, b.name)))
            for b in snapshot.blocks
        ),
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(changed)))
    assert cell_of(book, block="Header", row="Issuer", column="Value").value == "Changed Ltd"


def test_copied_text_that_looks_like_a_formula_stays_text(full):
    _, snapshot = full
    blocks = tuple(
        replace(
            b, cells=tuple(replace(c, text="=1+1") if c.row == "Issuer" else c for c in b.cells)
        )
        if b.name == "Header"
        else b
        for b in snapshot.blocks
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(replace(snapshot, blocks=blocks))))
    cell = cell_of(book, block="Header", row="Issuer", column="Value")
    assert cell.value == "=1+1" and cell.data_type == "s"
    (row,) = listed(book, "Header", row="Issuer", column="Value")
    assert row["Handoff text"] == "=1+1"


def test_a_table_wider_than_its_card_is_cut_into_slices_and_loses_nothing(full):
    _, snapshot = full
    periods = [f"P{n:02d}" for n in range(1, 31)]
    cells = tuple(
        snap.SnapshotCell(
            "Snapshot", "Financials", row, period, "copied", f"{n}.5", "CP-1", "T4.4", 7
        )
        for n, row in enumerate(("Revenue", "EBITDA"), start=1)
        for period in periods
    )
    blocks = tuple(
        snap.Block("Snapshot", "Financials", cells) if b.name == "Financials" else b
        for b in snapshot.blocks
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(replace(snapshot, blocks=blocks))))
    rows = [r for r in listed(book, "Financials") if r["Kind"] == "copied"]
    assert len(rows) == 60
    assert len({r["Cell"] for r in rows}) == 60
    assert book["Snapshot"].max_column <= 17
    one = cell_of(book, block="Financials", row="Revenue", column="P30")
    assert (one.value, one.number_format) == (1.5, "0.0;(0.0)")


# --- Fix round 1: leaky Basis, one-sided strengths ------------------------------------------------


def with_basis(snapshot, basis):
    blocks = tuple(
        replace(b, cells=tuple(replace(c, basis=basis) if c.basis else c for c in b.cells))
        for b in snapshot.blocks
    )
    return replace(snapshot, blocks=blocks)


@pytest.mark.parametrize(
    "leaky",
    [
        "CP-1 T4.9; NBG_report_2026.pdf p.3",
        "See CP-2A for the band",
        "from the annual report.htm table",
        "ledger.jsonl line 4",
        "notes.md",
        "model.xlsx",
        "hash " + "a" * 64,
    ],
)
def test_a_basis_naming_a_module_file_or_hash_has_no_comment_but_a_sources_row(full, leaky):
    _, snapshot = full
    book = load_workbook(io.BytesIO(writer.workbook_bytes(with_basis(snapshot, leaky))))
    for block in ("Scorecard", "Assessments"):
        assert all(
            book["Snapshot"][r["Cell"]].comment is None for r in listed(book, block, kind="copied")
        )
    kept = [r for r in sources(book) if r["Column"] == "Row basis"]
    assert len(kept) == 21  # 17 factors and 4 assessments
    assert {r["Handoff text"] for r in kept} == {leaky}
    assert all(r["Sheet"] == "Sources" and r["Module"] == "CP-2" and r["Line"] for r in kept)


def test_a_run_id_in_a_basis_has_no_comment(full):
    _, snapshot = full
    book = load_workbook(
        io.BytesIO(writer.workbook_bytes(with_basis(snapshot, f"run {snapshot.run_id} says")))
    )
    assert (
        book["Snapshot"][listed(book, "Scorecard", row="Scale", column="Level")[0]["Cell"]].comment
        is None
    )


def test_a_clean_basis_keeps_its_comment_and_has_a_sources_row(book):
    comment = cell_of(book, block="Scorecard", row="Scale", column="Level").comment
    assert comment is not None
    rows = [r for r in sources(book) if r["Column"] == "Row basis" and r["Row"] == "Scale"]
    assert [r["Handoff text"] for r in rows] == [comment.text]


@pytest.mark.parametrize(
    ("keep", "drop", "glyph"), [("Weakness", "Strength", "▼"), ("Strength", "Weakness", "▲")]
)
def test_a_one_sided_strengths_block_keeps_the_facing_columns_and_glyphs(full, keep, drop, glyph):
    _, snapshot = full
    blocks = tuple(
        replace(b, cells=tuple(c for c in b.cells if not c.row.startswith(drop)))
        if b.name == writer.STRENGTHS
        else b
        for b in snapshot.blocks
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(replace(snapshot, blocks=blocks))))
    glyphs = listed(book, writer.STRENGTHS, column="Glyph")
    assert {book["Snapshot"][r["Cell"]].value for r in glyphs} == {glyph}
    headings = {r["Handoff text"] for r in listed(book, writer.STRENGTHS, column="Heading")}
    assert headings == {"Strengths", "Weaknesses"}


def test_bloomberg_id_sits_beside_figi_and_the_joined_blank_has_no_sources_row(book, full):
    sheet = book["Inputs"]
    header = next(r for r in sheet.iter_rows() if any(c.value == "FIGI" for c in r))
    shown = [c.value for c in header if c.value is not None]  # the Instruments header row
    assert shown[shown.index("FIGI") + 1] == "Bloomberg ID"
    listed_cells = {(r["Sheet"], r["Cell"]) for r in sources(book)}
    place = {
        (r["Row"], r["Column"]): r["Cell"] for r in listed(book, "Instruments", sheet="Inputs")
    }
    assert ("Term Loan B", "FIGI") not in place  # blank: no Sources row
    (loan,) = [
        r
        for r in listed(
            book, "Instruments", row="Term Loan B", column="Bloomberg ID", sheet="Inputs"
        )
    ]
    assert loan["Kind"] == "copied" and loan["Module"] == snap.RV_MODULE
    assert loan["Section"] == "SYNTHETIC-rv-worksheet.csv" and loan["Line"] == 2
    assert loan["Handoff sha256"] == full[1].source_sha256[loan["Section"]]
    blank = sheet.cell(row=int(loan["Cell"][1:]), column=sheet[loan["Cell"]].column - 1)
    assert blank.value is None and blank.fill.fill_type is None
    assert ("Inputs", blank.coordinate) not in listed_cells


# --- A control character reaching the writer by any path (fix round 2) ----------------------------


def _with_control_characters(shot: snap.Snapshot) -> snap.Snapshot:
    """The snapshot with a control character in a Basis line, a cell's section and a gap's text."""
    basis = [replace(line, text=line.text + "\x01") for line in shot.basis_lines[:1]]
    basis += shot.basis_lines[1:]
    marked = {"section": False, "gap": False}
    blocks = []
    for block in shot.blocks:
        cells = []
        for cell in block.cells:
            if cell.section and not marked["section"]:
                cell, marked["section"] = replace(cell, section=cell.section + "\x1b"), True
            elif cell.kind == snap.GAP and not marked["gap"]:
                cell, marked["gap"] = replace(cell, text="no ### \x08 section"), True
            cells.append(cell)
        blocks.append(replace(block, cells=tuple(cells)))
    assert all(marked.values()) and basis
    return replace(shot, basis_lines=tuple(basis), blocks=tuple(blocks))


def test_a_control_character_on_any_path_is_written_as_the_gap_text(full, caplog):
    with caplog.at_level("WARNING", logger="deploy_workflow.credit_snapshot_workbook"):
        opened = load_workbook(io.BytesIO(writer.workbook_bytes(_with_control_characters(full[1]))))
    texts = [c.value for ws in opened for row in ws.iter_rows() for c in row]
    assert not any(isinstance(v, str) and snap.ILLEGAL.search(v) for v in texts)
    assert texts.count(snap.CONTROL_CHARACTER) >= 3
    assert "holds a control character" in caplog.text


# --- Mutation testing of the figure path (PR 4, Task 6) -------------------------------------------


def text_cells(book):
    """(Sources row, worksheet cell) of each copied, computed or entered cell of the sheets."""
    for row in sources(book):
        if row["Sheet"] in THREE and row["Kind"] in ("copied", "computed", "entered at run start"):
            yield row, book[row["Sheet"]][row["Cell"]]


def test_a_number_is_right_aligned_a_title_or_header_centred_and_other_text_left(book):
    numbers = [
        c for row, c in text_cells(book) if snap.figure(row["Handoff text"] or "") is not None
    ]
    assert len(numbers) > 100 and {c.alignment.horizontal for c in numbers} == {"right"}
    words = [c for row, c in text_cells(book) if snap.figure(row["Handoff text"] or "") is None]
    assert len(words) > 100 and {c.alignment.horizontal for c in words} == {"left"}
    banner = book["Snapshot"]["A1"]
    assert banner.value == "Credit Snapshot" and banner.alignment.horizontal == "center"
    headings = listed(book, "Strengths and weaknesses", column="Heading")
    assert headings
    for row in headings:
        assert book[row["Sheet"]][row["Cell"]].alignment.horizontal == "center"
    title = cell_of(book, block="Header", column="Title")
    assert title.alignment.horizontal == "left"


def test_text_keeps_the_general_format_and_no_range_merges_a_single_cell(book):
    words = [c for row, c in text_cells(book) if snap.figure(row["Handoff text"] or "") is None]
    assert words and {c.number_format for c in words} == {"General"}
    for name in THREE:
        for merged in book[name].merged_cells.ranges:
            assert (merged.max_row, merged.max_col) != (merged.min_row, merged.min_col), (
                name,
                str(merged),
            )


def test_a_long_copied_text_makes_its_row_taller_than_a_single_line(book):
    tall = 0
    for row, cell in text_cells(book):
        text = row["Handoff text"] or ""
        sheet = book[row["Sheet"]]
        span = next(
            (m.max_col - m.min_col + 1 for m in sheet.merged_cells.ranges if cell.coordinate in m),
            1,
        )
        width = next(x.column_width for x in writer.LAYOUTS if x.sheet == row["Sheet"])
        if len(text) > span * width * 1.15 and "\n" not in text:
            tall += 1
            assert sheet.row_dimensions[cell.row].height >= 27, row
    assert tall > 0


def test_a_scorecard_level_written_another_way_is_listed_as_written_on_sources(full):
    _, shot = full
    marked = {}
    blocks = []
    for block in shot.blocks:
        cells = []
        for cell in block.cells:
            if cell.basis and cell.block == "Scorecard" and cell.column == "Level":
                cell = replace(cell, written=f"**{cell.text}**")
                marked[cell.row] = cell.written
            cells.append(cell)
        blocks.append(replace(block, cells=tuple(cells)))
    assert marked
    opened = load_workbook(io.BytesIO(writer.workbook_bytes(replace(shot, blocks=tuple(blocks)))))
    shown = {
        r["Row"]: r["Handoff text"]
        for r in sources(opened)
        if r["Block"] == "Scorecard" and r["Sheet"] == "Sources" and r["Column"] == "As written"
    }
    assert shown == marked
    plain = load_workbook(io.BytesIO(writer.workbook_bytes(shot)))
    assert not [r for r in sources(plain) if r["Column"] == "As written"]


def test_put_returns_the_address_of_the_cell_it_wrote(full):
    book = writer._Book(full[1])
    page = writer._Page(book, book.workbook.active, writer.LAYOUTS[0])
    spec = writer._Put("Header", "Title", "Value", snap.COPIED, "Northbridge", writer.LABEL)
    assert page.put(3, 2, 1, spec) == "B3"
    assert book.workbook.active["B3"].value == "Northbridge"


# --- Module codes in copied text (PM-2) -----------------------------------------------------------

CODE_EDITS = {
    "CP-1A": (
        "| Refinancing of the 2027 term loan | Proposed | Extends the maturity wall to 2031. |",
        (
            "| Refinancing of the 2027 term loan | Proposed | Extends the maturity wall to 2031, "
            "as the debt schedule of Financial foundation (CP-1) shows. |"
        ),
    ),
    "CP-2": (
        "| Signals a debt-funded step up in borrowing. |",
        (
            "| Signals a debt-funded step up in borrowing (NBG_annual_2025.pdf, page 60); CP-2A "
            "restates it. |"
        ),
    ),
}


def test_a_module_code_in_copied_text_reads_as_the_modules_name_and_sources_keeps_the_text(
    tmp_path,
):
    handoffs = dict(cs.CASES["full"].handoffs)
    for module, (old, new) in CODE_EDITS.items():
        text = handoffs[module].read_text(encoding="utf-8")
        assert old in text
        handoffs[module] = tmp_path / f"{module}.md"
        handoffs[module].write_text(text.replace(old, new, 1), encoding="utf-8")
    built = cs.build_case(tmp_path / "ws", replace(cs.CASES["full"], handoffs=handoffs))
    shown = load_workbook(
        io.BytesIO(
            writer.workbook_bytes(snap.gather(snap.load_run(built.folder, built.stores.both())))
        )
    )
    values = {
        cell.value
        for name in THREE
        for row in shown[name].iter_rows()
        for cell in row
        if isinstance(cell.value, str)
    }
    event = CODE_EDITS["CP-1A"][1].split("|")[3].strip()
    driver = CODE_EDITS["CP-2"][1].strip(" |")
    assert event.replace(" (CP-1)", "") in values
    assert (
        "Signals a debt-funded step up in borrowing (NBG_annual_2025.pdf, page 60); "
        "Downside restates it." in values
    )
    assert not [v for v in values if "CP-" in v]
    written = {r["Handoff text"] for r in sources(shown) if r["Column"] == "As written"}
    assert {event, driver} <= written
