"""The Credit Snapshot workbook writer: the repository's one `.xlsx` writer.

`workbook_bytes(snapshot)` turns the `Snapshot` that `credit_snapshot.gather` builds into one file
with four sheets, `Snapshot`, `Inputs`, `Matrix` and `Sources`. The values and layout are its own;
the methodology's constants, the Excel formulas that derive each proposal from them and the
dropdowns come from `credit_snapshot_formulas`, which names cells by (sheet, block, row, column)
and leaves it to this module, which knows where each landed, to turn those names into addresses.

Every cell a block holds is written where `SnapshotCell.sheet` says, once, and is listed once on
`Sources` (`Sheet | Cell | Kind | Block | Row | Column | Module | Section | Line | Handoff text |
Handoff sha256 | Run | As of`). A cell is one of the five kinds of `credit_snapshot` (copied, gap,
computed, entered at run start, analyst) or one of three the writer adds: `label` (a title,
header, row name or rubric text, never a number), `formula` (its text is the formula as written)
and `rule` (a methodology constant, a plain number or name). Module ids, source references
(file names, page locators), hashes and run codes are drawn on `Sources` only: module text that
holds them is drawn without them on the other sheets. A `Basis:` line is kept on `Sources` beside
its paragraph and is never a cell of the other three sheets; a scorecard row's own Basis cell is
the comment on its level cell.

A figure is stored as a number only when `credit_snapshot.figure` says so (the plain-decimal rule),
with the number format it returns, so the cell shows the handoff's digits; everything else is text.
Analyst cells are blank, pale yellow, and the only cells filled yellow: no conditional format uses
yellow. A formula cell holds no cached value (openpyxl stores none), so a program that does not
calculate shows it empty; the plain values the app computed (Credit Score, medians) stay beside.
The function is pure in the sense that cell values, styles and `Sources` rows are a function of the
snapshot; the zip and document timestamps are not promised identical.

openpyxl ships no type information and the repository allows neither a stub dependency nor a
type-check suppression, so its modules are loaded with `importlib` and used as untyped objects.
"""

from __future__ import annotations

import importlib
import io
import json
import logging
import math
import re
from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, replace
from decimal import Decimal, localcontext
from typing import Any

from deploy_vii.period_order import PeriodClass, parse_period
from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_formulas as fx
from deploy_workflow.cp2_scorecard import level_text
from deploy_workflow.credit_os_catalogue import period_order
from deploy_workflow.method_scripts import _register_start
from deploy_workflow.owners.cp2g import DRIVER_LABEL, DRIVER_UNIT
from deploy_workflow.owners.cpos_periods import period_of
from deploy_workflow.recommendation import RECOMMENDATION_NAMES

_LOG = logging.getLogger(__name__)
_cashflow = importlib.import_module("credit_os.cashflow")
_xl = importlib.import_module("openpyxl")
_styles = importlib.import_module("openpyxl.styles")
_comments = importlib.import_module("openpyxl.comments")
_rules = importlib.import_module("openpyxl.formatting.rule")
_props = importlib.import_module("openpyxl.worksheet.properties")
_validation = importlib.import_module("openpyxl.worksheet.datavalidation")
_utils = importlib.import_module("openpyxl.utils")

SNAPSHOT, MODEL, INPUTS, MATRIX, SOURCES = "Snapshot", "Model", "Inputs", "Matrix", "Sources"
MODEL_ROW_LABEL_WIDTH = 3
LABEL, FORMULA, RULE = fx.LABEL, fx.FORMULA, fx.RULE
SOURCES_HEADER = (
    *("Sheet", "Cell", "Kind", "Block", "Row", "Column", "Module", "Section", "Line"),
    *("Handoff text", "Handoff sha256", "Run", "As of"),
)
SOURCES_WIDTHS = (10, 8, 20, 26, 32, 24, 9, 24, 6, 70, 22, 30, 12)
TEXT_COLUMN = SOURCES_HEADER.index("Handoff text") + 1

# The app's blue accent and neutrals (DESIGN.md). Yellow is the analyst fill and nothing else.
INK, QUIET, GAP_INK = "0A0A0A", "6B6B74", "52525B"
BLUE, BLUE_DARK, BLUE_TINT, HAIRLINE, GAP_EDGE = "1D4ED8", "1E3A8A", "EFF6FF", "D4D4D8", "8E8E96"
ANALYST_FILL = "FFF2CC"
HEAT = ("BFDBFE", "F4F4F5", "FDBA74")  # level 1 (strongest), 3, 5 (weakest): blue, neutral, orange

TITLE_ROWS = 2
FIRST_BAND = 4
LINE_POINTS = 12.0
MAX_HEIGHT = 409.0
CHARS_PER_UNIT = 1.15
CAP_WEIGHT = 60
TAIL_COLUMNS = fx.TAIL_COLUMNS  # shown after the periods they describe
NO_HEADER = ("Value", "Text")  # a one-column block needs no header over its values
GAP_LINE_ROW, GAP_LINE_COLUMN = "Gap", "Text"

SCORECARD, STRENGTHS, FINANCIALS = "Scorecard", "Strengths and weaknesses", "Financials"
OPERATING_KPIS, SEGMENTS = "Operating KPIs", "Segment data"
SOURCE_FINANCIALS, BRIDGE = "Source financials", "EBITDA bridge"
ADJUSTMENTS = "EBITDA adjustments"
DEBT_FACILITIES, ASSUMPTIONS = "Debt instruments", "Assumptions"
HEADER_BLOCK, NEW_ISSUE, INSTRUMENTS = "Header", "New issue", "Instruments"
CONFIRMATION, REFERENCE_UNIT, RUBRIC = "Confirmation", "Reference unit", "Risk rubric"
INSTRUMENT_INPUTS = (
    *("Type", "Rating bucket", "Level (bp)", "Price", "FIGI", "Bloomberg ID", "Facility rating"),
    *("Bid", "Ask", "1M move", "YTD move"),
)
NEW_ISSUE_INPUTS = ("Guidance", "OID", "Expected ratings", "Commit date", "Covenant score")
GLYPHS = (("Strength", "▲", "Strengths"), ("Weakness", "▼", "Weaknesses"))

Band = tuple[tuple[str, int], ...]

# What may not appear on Snapshot, Inputs or Matrix (also in a cell comment): a module id, a file
# name (a token ending in a dot and a 2-7 letter extension) or a hash, in any case. The run id is
# checked beside.
_LEAKS = re.compile(r"CP-\w+|\w\.[A-Za-z]{2,7}\b|\b[0-9a-f]{64}\b", re.IGNORECASE)


def _leaks(text: str, run_id: str) -> bool:
    return _LEAKS.search(text) is not None or run_id in text


@dataclass(frozen=True)
class _Layout:
    sheet: str
    width: int  # grid columns
    column_width: float
    title: str
    note: str
    bands: tuple[Band, ...]


LAYOUTS = (
    _Layout(
        SNAPSHOT,
        17,
        10.0,
        "Credit Snapshot",
        "Yellow cells are for the analyst. Every cell is listed on the Sources sheet.",
        (
            ((HEADER_BLOCK, 5), ("Corporate ratings", 6), ("Equity value", 6)),
            ((fx.KEY_FIGURES, 7), (fx.RECOMMENDATION, 10)),
            (("Business description", 9), ("Investment thesis", 8)),
            (("Operating model", 17),),
            (("Shareholders", 17),),
            ((SCORECARD, 17),),
            (("Assessments", 5), ("Transaction summary", 12)),
            ((NEW_ISSUE, 17),),
            (("Capital structure", 17),),
            (("Capital structure totals", 17),),
            ((fx.RV_LOANS, 17),),
            ((fx.RV_BONDS, 17),),
            (("EBITDA bridge", 9), ("EBITDA measures", 8)),
            (("Near-term events", 9), ("Monitoring triggers", 8)),
            ((STRENGTHS, 17),),
            (("Historical performance", 17),),
            ((FINANCIALS, 17),),
            (("Peers", 17),),
        ),
    ),
    _Layout(
        MODEL,
        25,
        12.0,
        "Credit Snapshot Model",
        "Figures and periods are copied from the run. Unlinked add-back status remains a gap.",
        (
            ((OPERATING_KPIS, 25),),
            ((FINANCIALS, 25),),
            ((SOURCE_FINANCIALS, 25),),
            ((SEGMENTS, 25),),
            ((BRIDGE, 25),),
            ((ADJUSTMENTS, 25),),
            ((DEBT_FACILITIES, 25),),
            ((ASSUMPTIONS, 25),),
        ),
    ),
    _Layout(
        INPUTS,
        12,
        14.0,
        "Inputs",
        "Yellow cells are for the analyst. Values the app computed are shown for reference.",
        (
            (("Credit Score", 3), (fx.CREDIT_SCORE, 3), (CONFIRMATION, 3), (REFERENCE_UNIT, 3)),
            ((INSTRUMENTS, 12),),
            (("Market identifiers", 12),),
            (("Quotes as entered", 12),),
            (("Reference medians", 12),),
        ),
    ),
    _Layout(
        MATRIX,
        12,
        14.0,
        "Matrix",
        "Reference levels are shown as stored, in the unit of the column the file used.",
        (
            (("Reference status", 12),),
            (("Reference medians", 12),),
            (("Issuer weight", 4), ("Breached sector limits", 4), ("Limits not read", 4)),
            (("Rating limits", 12),),
            (("Price floors", 6),),
            ((RUBRIC, 12),),
            ((fx.REC_TABLE, 6), (fx.SCALES, 6)),
            ((fx.BANDS, 4), (fx.CS_RULES, 4), (fx.ELIG_TYPES, 4)),
            ((fx.PORTFOLIO, 4),),
            ((fx.ELIGIBLE, 6), (fx.MEDIAN_BP, 6)),
            ((fx.DIFFERENCE, 6), (fx.VALUATION, 6)),
            ((fx.BREACH, 6), (fx.RESULT, 6)),
        ),
    ),
)


# --- Looks ----------------------------------------------------------------------------------------


@dataclass(frozen=True)
class _Look:
    font: Any
    fill: Any
    border: Any


def _font(color: str = INK, *, bold: bool = False, italic: bool = False, size: int = 9) -> Any:
    return _styles.Font(name="Calibri", size=size, bold=bold, italic=italic, color=color)


def _fill(color: str | None) -> Any:
    return _styles.PatternFill() if color is None else _styles.PatternFill("solid", color, color)


def _box(style: str, color: str) -> Any:
    side = _styles.Side(style=style, color=color)
    return _styles.Border(left=side, right=side, top=side, bottom=side)


_BOX, _GAP_BOX = _box("thin", HAIRLINE), _box("dashed", GAP_EDGE)
_LOOKS = {
    "banner": _Look(_font("FFFFFF", bold=True, size=14), _fill(BLUE), _BOX),
    "note": _Look(_font(QUIET, italic=True), _fill(None), _styles.Border()),
    "title": _Look(_font("FFFFFF", bold=True, size=10), _fill(BLUE), _BOX),
    "header": _Look(_font(BLUE_DARK, bold=True), _fill(BLUE_TINT), _BOX),
    "blank": _Look(_font(), _fill(BLUE_TINT), _BOX),
    LABEL: _Look(_font(QUIET), _fill(None), _BOX),
    snap.COPIED: _Look(_font(), _fill(None), _BOX),
    snap.ENTERED: _Look(_font(), _fill(None), _BOX),
    snap.COMPUTED: _Look(_font(BLUE_DARK), _fill(None), _BOX),
    snap.GAP: _Look(_font(GAP_INK, italic=True), _fill(None), _GAP_BOX),
    snap.ANALYST: _Look(_font(), _fill(ANALYST_FILL), _BOX),
    FORMULA: _Look(_font(BLUE_DARK, bold=True), _fill(None), _BOX),
    RULE: _Look(_font(), _fill(None), _BOX),
}
# The colour of a recommendation chip by the name it shows, strongest overweight first: blue for
# overweight, neutral for market weight, orange for underweight; none of them yellow.
CHIP_COLOURS = ("93C5FD", "DBEAFE", "F4F4F5", "FED7AA", "FDBA74")
_LEFT = _styles.Alignment(horizontal="left", vertical="top", wrap_text=True)
_RIGHT = _styles.Alignment(horizontal="right", vertical="top", wrap_text=True)
_CENTRE = _styles.Alignment(horizontal="center", vertical="center", wrap_text=True)


# --- What goes into a cell and onto Sources -------------------------------------------------------


@dataclass(frozen=True)
class _Put:
    """One cell: where it is listed on Sources (`block`, `row`, `column`, `kind`), what it shows
    (`text`), how it looks (`look`) and the gathered item it came from, if any."""

    block: str
    row: str
    column: str
    kind: str
    text: str
    look: str
    item: snap.SnapshotCell | None = None


@dataclass(frozen=True)
class _Frame:
    top: int
    left: int
    width: int


@dataclass(frozen=True)
class _ModelAxis:
    periods: tuple[str, ...]
    aliases: dict[str, str]

    def label(self, column: str) -> str:
        return self.aliases.get(column, column)


def _bracketed(number_format: str) -> str:
    return f"{number_format};({number_format})"


def _lines(text: str, chars: float) -> int:
    return sum(max(1, math.ceil(len(part) / max(chars, 1.0))) for part in text.split("\n"))


def _cell_value(spec: _Put, figure: snap.Figure | None) -> int | float | str | None:
    if figure is not None:
        return figure.value
    if spec.kind in (snap.ANALYST, FORMULA):
        return None
    item = spec.item
    if (
        spec.kind == snap.COPIED
        and item is not None
        and item.number_format == "0.00%"
        and snap._PLAIN.fullmatch(spec.text) is not None
    ):
        # Excel cannot apply its percentage format to exact fractions held as text.
        with localcontext() as context:
            context.prec = len(spec.text)
            return f"{Decimal(spec.text.replace(',', '')).scaleb(2):f}%"
    return spec.text


class _Page:
    """One sheet being written: the cells, their heights, and the Sources rows they add."""

    def __init__(
        self, book: _Book, ws: Any, layout: _Layout, axis: _ModelAxis | None = None
    ) -> None:
        self.book, self.ws, self.layout = book, ws, layout
        self.model_axis = axis
        self.headers: Counter[str] = Counter()

    def put(self, row: int, col: int, span: int, spec: _Put) -> str:
        """Write `spec` at (row, col), merged over `span` grid columns; return its address."""
        item = spec.item
        if spec.kind == RULE:
            figure = snap.figure(spec.text)  # a constant is a number where it is one
        else:
            figure = item.figure if item is not None else None
        value = _cell_value(spec, figure)
        first = self.ws.cell(row=row, column=col)
        self._paint(row, col, span, spec, isinstance(value, int | float))
        first.value = value
        if isinstance(value, str):
            first.data_type = "s"  # copied text is never a formula or an error value
        if figure is not None:
            fmt = figure.number_format
            first.number_format = _bracketed(fmt) if spec.block == FINANCIALS else fmt
        if item is not None and item.number_format is not None and figure is not None:
            first.number_format = item.number_format
        self._height(row, "" if spec.kind == FORMULA else spec.text, span)
        if item is not None and item.written is not None:
            self.book.add_written(item)
        if item is not None and item.basis:
            self.book.add_basis(item)
            if not _leaks(item.basis, self.book.snapshot.run_id):
                self._comment(first, item.basis)
        self.book.add_source(self.layout.sheet, first.coordinate, spec)
        return str(first.coordinate)

    def held(self, row: int, col: int, span: int, item: snap.SnapshotCell) -> None:
        """An empty cell a formula may name and the analyst leaves empty: no fill, no Sources
        row."""
        self.blank(row, col, span, LABEL)
        first = self.ws.cell(row=row, column=col)
        self.book.places[self.layout.sheet, item.block, item.row, item.column] = first.coordinate

    def blank(self, row: int, col: int, span: int, look: str) -> None:
        """A styled cell with nothing in it and no Sources row (a header corner)."""
        self._paint(row, col, span, _Put("", "", "", LABEL, "", look), False)

    def _paint(self, row: int, col: int, span: int, spec: _Put, number: bool) -> None:
        """Style the `span` cells from (row, col), then merge them when more than one."""
        self._style(row, col, span, spec, number)
        if span > 1:
            self.ws.merge_cells(
                start_row=row, start_column=col, end_row=row, end_column=col + span - 1
            )

    def _style(self, row: int, col: int, span: int, spec: _Put, number: bool) -> None:
        look = _LOOKS[spec.look]
        centred = ("header", "banner", FORMULA)
        align = _RIGHT if number else _CENTRE if spec.look in centred else _LEFT
        for offset in range(span):
            cell = self.ws.cell(row=row, column=col + offset)
            cell.font, cell.fill, cell.border, cell.alignment = (
                look.font,
                look.fill,
                look.border,
                align,
            )

    def _height(self, row: int, text: str, span: int) -> None:
        chars = span * self.layout.column_width * CHARS_PER_UNIT
        need = min(LINE_POINTS * _lines(text, chars) + 3, MAX_HEIGHT)
        current = self.ws.row_dimensions[row].height or 15.0
        self.ws.row_dimensions[row].height = max(current, need)

    def _comment(self, cell: Any, text: str) -> None:
        comment = _comments.Comment(text, "Credit Snapshot")
        comment.width = 320
        comment.height = min(60 + 14 * _lines(text, 48), 400)
        cell.comment = comment

    def height_for(self, row: int, points: float) -> None:
        current = self.ws.row_dimensions[row].height or 15.0
        self.ws.row_dimensions[row].height = max(current, points)


# --- Splitting width and rows ---------------------------------------------------------------------


def _spans(weights: Sequence[float], total: int) -> list[int]:
    """Whole grid columns for each weight: at least one each, the rest by weight (largest
    remainder). More weights than columns gives one each; callers chunk before that."""
    count = len(weights)
    if count >= total:
        return [1] * count
    spare, whole = total - count, sum(weights) or 1.0
    exact = [w / whole * spare for w in weights]
    spans = [1 + int(x) for x in exact]
    order = sorted(range(count), key=lambda i: exact[i] - int(exact[i]), reverse=True)
    for i in order[: total - sum(spans)]:
        spans[i] += 1
    return spans


def _weight(texts: Iterable[str], low: int = 4, high: int = CAP_WEIGHT) -> float:
    return float(min(max(max((len(t) for t in texts), default=0), low), high))


def _chunks(count: int, room: int) -> list[range]:
    room = max(room, 1)
    return [range(start, min(start + room, count)) for start in range(0, count, room)]


Row = tuple[str, list[snap.SnapshotCell]]  # a row's name and its cells, in the block's order
Aligned = tuple[str, list[snap.SnapshotCell | None]]  # the same, one slot per table column


@dataclass(frozen=True)
class _Table:
    columns: list[str]
    rows: list[Aligned]


def _by_row(cells: Iterable[snap.SnapshotCell]) -> list[Row]:
    rows: dict[tuple[str, snap._RowKey | None], list[snap.SnapshotCell]] = {}
    for cell in cells:
        rows.setdefault((cell.row, cell.row_key), []).append(cell)
    return [(label, items) for (label, _), items in rows.items()]


def _main(columns: Iterable[str]) -> set[str]:
    return {c for c in columns if c not in TAIL_COLUMNS}


def _joins(have: list[str], columns: list[str]) -> bool:
    """A row joins the table above when its columns (units aside) lie within the table's or
    the table's lie within the row's; otherwise it starts a table with its own header."""
    a, b = _main(have), _main(columns)
    if not a and not b:
        return bool(columns) and set(have) == set(columns)  # rows that are only a unit
    return bool(a) and bool(b) and (a <= b or b <= a)


def _union(have: list[str], columns: list[str]) -> list[str]:
    extra = Counter(columns) - Counter(have)
    merged = list(have)
    for column in columns:
        if extra[column] > 0:
            merged.append(column)
            extra[column] -= 1
    return merged


def _ordered(columns: list[str]) -> list[str]:
    """A unit (and the currency beside it) is read after the figures it describes; a currency
    column in a table with no unit (an instrument's currency) stays where the table put it."""
    if "Unit" not in columns:
        return columns
    return sorted(columns, key=lambda c: c in TAIL_COLUMNS)  # stable


def _align(columns: list[str], cells: list[snap.SnapshotCell]) -> list[snap.SnapshotCell | None]:
    pool = list(cells)
    slots: list[snap.SnapshotCell | None] = []
    for column in columns:
        found = next((i for i, c in enumerate(pool) if c.column == column), None)
        slots.append(None if found is None else pool.pop(found))
    return slots


def _tables_of(rows: list[Row]) -> list[_Table]:
    """Consecutive rows that share their columns make one table; a row with a column the table
    lacks widens it (rows without that column leave it empty)."""
    grouped: list[tuple[list[str], list[Row]]] = []
    for row in rows:
        columns = [c.column for c in row[1]]
        if grouped and _joins(grouped[-1][0], columns):
            grouped[-1] = (_union(grouped[-1][0], columns), [*grouped[-1][1], row])
        else:
            grouped.append((columns, [row]))
    tables = []
    for columns, members in grouped:
        ordered = _ordered(columns)
        tables.append(_Table(ordered, [(n, _align(ordered, cells)) for n, cells in members]))
    return tables


def _names_itself(row: Aligned) -> bool:
    """The row's name is already its first cell (a table whose first column is the row name)."""
    label, cells = row
    first = cells[0] if cells else None
    if first is not None and first.kind == FORMULA and first.column == "Instrument":
        return True  # a relative-value row names itself by formula, and only when it applies
    return (
        first is not None
        and label in (first.text, first.written)  # drawn text may differ from the raw label
        and first.kind != snap.ANALYST
    )


# --- Rendering a block ----------------------------------------------------------------------------


def _title(page: _Page, frame: _Frame, name: str) -> int:
    page.put(
        frame.top, frame.left, frame.width, _Put(name, "(title)", "Title", LABEL, name, "title")
    )
    return frame.top + 1


def _gap_line(page: _Page, frame: _Frame, cell: snap.SnapshotCell) -> int:
    page.put(frame.top, frame.left, frame.width, _as_put(cell))
    return frame.top + 1


def _is_gap_line(cells: Sequence[snap.SnapshotCell]) -> bool:
    return (
        len(cells) == 1
        and cells[0].kind == snap.GAP
        and (cells[0].row, cells[0].column) == (GAP_LINE_ROW, GAP_LINE_COLUMN)
    )


def _as_put(cell: snap.SnapshotCell) -> _Put:
    return _Put(cell.block, cell.row, cell.column, cell.kind, cell.text, cell.kind, cell)


@dataclass(frozen=True)
class _Part:
    """One table of a block, or one slice of it when it has more columns than the card is wide:
    the columns (indexes into the table's) it shows and whether a row-name column leads it."""

    table: _Table
    indexes: range
    labelled: bool
    header: bool


def _header_name(page: _Page, block: str) -> str:
    page.headers[block] += 1
    count = page.headers[block]
    return "(header)" if count == 1 else f"(header {count})"


def _part_weights(part: _Part) -> list[float]:
    rows = part.table.rows
    weights = [_weight((r[0] for r in rows), high=14)] if part.labelled else []
    for i in part.indexes:
        texts = [c.text for _, cells in rows if (c := cells[i]) is not None]
        weights.append(_weight([*texts, part.table.columns[i]]))
    return weights


def _part_header(page: _Page, frame: _Frame, part: _Part, spans: list[int]) -> None:
    name = _header_name(page, _block_of(part))
    col, offset = frame.left, 0
    if part.labelled:
        page.blank(frame.top, col, spans[0], "blank")
        col, offset = col + spans[0], 1
    for i, span in zip(part.indexes, spans[offset:], strict=True):
        column = part.table.columns[i]
        page.put(frame.top, col, span, _Put(_block_of(part), name, column, LABEL, column, "header"))
        col += span


def _block_of(part: _Part) -> str:
    return next(c.block for _, cells in part.table.rows for c in cells if c is not None)


def _part(page: _Page, frame: _Frame, part: _Part, spans: list[int] | None = None) -> int:
    if spans is None:
        spans = _spans(_part_weights(part), frame.width)
    row = frame.top
    if part.header:
        _part_header(page, frame, part, spans)
        row += 1
    for label, cells in part.table.rows:
        col, offset = frame.left, 0
        if part.labelled:
            spec = _Put(_block_of(part), label, "Row label", LABEL, label, LABEL)
            page.put(row, col, spans[0], spec)
            col, offset = col + spans[0], 1
        for i, span in zip(part.indexes, spans[offset:], strict=True):
            cell = cells[i]
            if cell is None:
                page.blank(row, col, span, LABEL)
            elif cell.kind == snap.BLANK:
                page.held(row, col, span, cell)
            else:
                page.put(row, col, span, _as_put(cell))
            col += span
        row += 1
    return row


def _tables(page: _Page, frame: _Frame, cells: Sequence[snap.SnapshotCell]) -> int:
    rows = _by_row(cells)
    axis = page.model_axis
    if axis is not None:
        columns = _aligned_model_columns(cells, axis)
        if columns is not None:
            model = _Table(columns, _align_model_rows(columns, rows, axis))
            indexes = range(len(columns))
            spans = [MODEL_ROW_LABEL_WIDTH] + [1] * len(columns)
            return _part(page, frame, _Part(model, indexes, True, True), spans)
    row = frame.top
    for table in _tables_of(rows):
        width = len(table.columns)
        labelled = not all(_names_itself(r) for r in table.rows)
        header = not (width == 1 and table.columns[0] in NO_HEADER)
        for number, indexes in enumerate(_chunks(width, frame.width - (1 if labelled else 0))):
            part = _Part(table, indexes, labelled or number > 0, header)
            row = _part(page, replace(frame, top=row), part)
    return row


def _strip(page: _Page, frame: _Frame, cells: Sequence[snap.SnapshotCell]) -> int:
    """The heat strip: one column per factor, its name over its level, the 3-colour scale on the
    levels, the row's basis in the level's comment."""
    row = frame.top
    for chunk in _chunks(len(cells), frame.width):
        for position, i in enumerate(chunk):
            cell = cells[i]
            col = frame.left + position
            page.put(
                row, col, 1, _Put(cell.block, cell.row, "Factor name", LABEL, cell.row, "header")
            )
            page.put(row + 1, col, 1, _as_put(cell))
        page.height_for(row, 40)
        last = frame.left + len(chunk) - 1
        first, end = (_utils.get_column_letter(n) for n in (frame.left, last))
        page.ws.conditional_formatting.add(f"{first}{row + 1}:{end}{row + 1}", _heat())
        row += 2
    return row


def _heat() -> Any:
    low, mid, high = HEAT
    return _rules.ColorScaleRule(
        start_type="num",
        start_value=1,
        start_color=low,
        mid_type="num",
        mid_value=3,
        mid_color=mid,
        end_type="num",
        end_value=5,
        end_color=high,
    )


def _sides(rows: list[Row]) -> tuple[list[Row], list[Row]] | None:
    """Strength rows and weakness rows, or None when the block is not that shape."""
    strengths = [r for r in rows if r[0].startswith(GLYPHS[0][0])]
    weaknesses = [r for r in rows if r[0].startswith(GLYPHS[1][0])]
    if not rows or len(strengths) + len(weaknesses) != len(rows):
        return None
    if any(len(cells) != 2 for _, cells in rows):
        return None  # a merged or partial row is not the two-cell shape `_side` draws
    return strengths, weaknesses


def _facing(page: _Page, frame: _Frame, sides: tuple[list[Row], list[Row]]) -> int:
    """Strengths on the left, weaknesses on the right, a glyph column leading each side."""
    half = frame.width // 2
    frames = (
        replace(frame, width=half),
        replace(frame, left=frame.left + half, width=frame.width - half),
    )
    top = frame.top
    for (stem, glyph, heading), side, own in zip(GLYPHS, sides, frames, strict=True):
        page.put(
            top,
            own.left,
            own.width,
            _Put(STRENGTHS, f"({stem} heading)", "Heading", LABEL, heading, "header"),
        )
        _side(page, replace(own, top=top + 1), side, glyph)
    return top + 1 + max(len(s) for s in sides)


def _side(page: _Page, frame: _Frame, rows: list[Row], glyph: str) -> None:
    spans = _spans([1, 3], frame.width - 1)
    for k, (label, cells) in enumerate(rows):
        row, col = frame.top + k, frame.left
        page.put(row, col, 1, _Put(STRENGTHS, label, "Glyph", LABEL, glyph, LABEL))
        col += 1
        for cell, span in zip(cells, spans, strict=True):
            page.put(row, col, span, _as_put(cell))
            col += span


def _render(page: _Page, frame: _Frame, block: snap.Block) -> int:
    """Draw one card (its title, then its table or special form); return the next free row."""
    top = _title(page, frame, block.name)
    inner = replace(frame, top=top)
    cells = block.cells
    if _is_gap_line(cells):
        return _gap_line(page, inner, cells[0])
    if block.name == SCORECARD:
        return _strip(page, inner, cells)
    rows = _by_row(cells)
    sides = _sides(rows) if block.name == STRENGTHS else None
    if sides is not None:
        return _facing(page, inner, sides)
    return _tables(page, inner, cells)


# --- The blocks the writer adds -------------------------------------------------------------------


def _analyst(sheet: str, block: str, row: str, column: str) -> snap.SnapshotCell:
    return snap.SnapshotCell(sheet, block, row, column, snap.ANALYST, "")


def _with_analyst_columns(block: snap.Block, columns: Sequence[str]) -> snap.Block:
    """Every row of a copied table gets blank analyst cells for `columns` (the Bloomberg-deferred
    and entered-by-analyst fields) it has no cell for; a block that is one gap line gets none. A
    row keeps the order of the block's own columns first, then `columns` as listed."""
    if _is_gap_line(block.cells):
        return block
    rows = [label for label, _ in _by_row(block.cells)]
    have = {(c.row, c.column) for c in block.cells}
    extra = tuple(
        _analyst(block.sheet, block.name, row, c)
        for row in rows
        for c in columns
        if (row, c) not in have
    )
    rank = {c: i for i, c in enumerate((block.cells[0].column, *columns))}
    order = {row: i for i, row in enumerate(rows)}
    cells = sorted(
        block.cells + extra,
        key=lambda c: (order[c.row], rank.get(c.column, len(rank))),
    )
    return replace(block, cells=tuple(cells))


def _rubric(sheet: str) -> snap.Block:
    """The Risk Rubric's level text, as the methodology document holds it, one row per factor."""
    lines = level_text().splitlines()
    names = [c.strip() for c in lines[0].strip().strip("|").split("|")]
    cells: list[snap.SnapshotCell] = []
    for line in lines[1:]:
        parts = [c.strip() for c in line.strip().strip("|").split("|")]
        cells += [
            snap.SnapshotCell(sheet, RUBRIC, parts[1], name, LABEL, text)
            for name, text in zip(names[2:], parts[2:], strict=True)
        ]
    return snap.Block(sheet, RUBRIC, tuple(cells))


def _blocks(snapshot: snap.Snapshot) -> dict[tuple[str, str], snap.Block]:
    """Every block by (sheet, name): the gathered ones, the analyst columns and rows the writer
    adds to some, and the writer's own blocks."""
    found = {(b.sheet, b.name): b for b in snapshot.blocks if b.cells}  # empty: hidden
    header = found[SNAPSHOT, HEADER_BLOCK]
    found[SNAPSHOT, HEADER_BLOCK] = replace(
        header, cells=header.cells + (_analyst(SNAPSHOT, HEADER_BLOCK, "Issuer ID", "Value"),)
    )
    for sheet, name, columns in (
        (SNAPSHOT, NEW_ISSUE, NEW_ISSUE_INPUTS),
        (INPUTS, INSTRUMENTS, INSTRUMENT_INPUTS),
    ):
        if (sheet, name) in found:
            found[sheet, name] = _with_analyst_columns(found[sheet, name], columns)
    found[INPUTS, CONFIRMATION] = snap.Block(
        INPUTS,
        CONFIRMATION,
        tuple(
            _analyst(INPUTS, CONFIRMATION, row, "Value") for row in ("Analyst", "Confirmation date")
        ),
    )
    stored = [v.name for v in snapshot.references if v.state == "stored"]
    if stored:
        cells = tuple(_analyst(INPUTS, REFERENCE_UNIT, name, "Unit") for name in stored)
        found[INPUTS, REFERENCE_UNIT] = snap.Block(INPUTS, REFERENCE_UNIT, cells)
    found[MATRIX, RUBRIC] = _rubric(MATRIX)
    financials = found.get((SNAPSHOT, FINANCIALS))
    if financials is not None:
        found[MODEL, FINANCIALS] = snap.Block(
            MODEL,
            FINANCIALS,
            tuple(replace(cell, sheet=MODEL) for cell in financials.cells),
        )
    additions = _model_output_cells(snapshot)
    bridge = found.get((SNAPSHOT, "EBITDA bridge"))
    if bridge is not None:
        found[MODEL, BRIDGE] = snap.Block(MODEL, BRIDGE, tuple(_model_bridge_cells(bridge)))
    financials = found.get((MODEL, FINANCIALS))
    if additions or financials is not None:
        found[MODEL, FINANCIALS] = snap.Block(
            MODEL,
            FINANCIALS,
            (*(financials.cells if financials is not None else ()), *additions),
        )
    found.update(_model_handoff_blocks(snapshot))
    model_financials = found.get((MODEL, FINANCIALS))
    canonical = (
        {(cell.row, cell.column) for cell in model_financials.cells}
        if model_financials is not None
        else set()
    )
    source_financials = [
        cell
        for cell in _model_source_financials(snapshot)
        if (cell.row, cell.column) not in canonical
    ]
    if source_financials:
        found[MODEL, SOURCE_FINANCIALS] = snap.Block(
            MODEL, SOURCE_FINANCIALS, tuple(source_financials)
        )
    assumptions = _model_assumptions(snapshot)
    if assumptions is not None:
        found[MODEL, ASSUMPTIONS] = assumptions
    for key, block in tuple(found.items()):
        if key[0] == MODEL:
            found[key] = _clean(replace(snapshot, blocks=(block,))).blocks[0]
    return found


def _model_period_key(label: str) -> tuple[int, ...] | None:
    base, _, window = label.rpartition(" / ")
    start, has_window, end = window.partition(" to ")
    if base and has_window and (group := _model_period_group_key(base)) is not None:
        begins, closes = parse_period(start), parse_period(end)
        first = begins.end if begins is not None and begins.end is not None else ()
        last = closes.end if closes is not None and closes.end is not None else group[1:4]
        return (group[0], *last, *group[4:], *first)
    return _model_period_group_key(label)


def _model_period_group_key(label: str) -> tuple[int, ...] | None:
    if label == "Prior LTM":
        return (3, 0, 0, 0, 0)
    scenario = re.fullmatch(r"(Base|Downside) FY([0-9]{4})", label)
    if scenario is not None:
        return (5 if scenario[1] == "Base" else 6, int(scenario[2]))
    base, separator, _ = label.partition(" / ")
    declared = period_of(base)
    if declared is not None:
        kind, year, quarters = declared
        group = {"QUARTER": 0, "YTD": 1, "FY": 2}[kind]
        end: tuple[int, int, int] | None = (year, 3 * quarters, 31)
        if separator:
            dated = parse_period(label)
            end = dated.end if dated is not None else None
        return (group, *end, 1) if end is not None else None
    window: tuple[str, ...] | None = _cashflow.period_key(label)
    if window is not None and window[0] == "q":
        return (0, *map(int, window[-1].split("-")))
    period = parse_period(label)
    if period is None:
        return None
    group = {
        PeriodClass.ACTUAL: 0 if period.span == "quarter" else 2,
        PeriodClass.YTD: 1,
        PeriodClass.LTM: 3,
        PeriodClass.PF: 4,
        PeriodClass.FORECAST: 7,
    }[period.period_class]
    return (group, *(period.end or (9999, 0, 0)), int(not period.prior_ytd))


def _model_periods(found: dict[tuple[str, str], snap.Block]) -> _ModelAxis:
    blocks = tuple(block for (sheet, _), block in found.items() if sheet == MODEL)
    labels = dict.fromkeys(cell.column for block in blocks for cell in block.cells)
    keys = {label: key for label in labels if (key := _model_period_key(label)) is not None}
    aliases = _dated_model_aliases(keys, blocks)
    periods = tuple(sorted((label for label in keys if label not in aliases), key=keys.__getitem__))
    return _ModelAxis(periods, aliases)


def _dated_model_aliases(
    keys: dict[str, tuple[int, ...]], blocks: Sequence[snap.Block]
) -> dict[str, str]:
    """Align an undated heading with its unique explicit end date without merging source cells."""
    dated: dict[str, list[str]] = {}
    for label, key in keys.items():
        base, separator, date = label.partition(" / ")
        if (
            separator
            and base in keys
            and keys[base][0] == key[0]
            and re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", date)
        ):
            dated.setdefault(base, []).append(label)
    aliases = {base: labels[0] for base, labels in dated.items() if len(labels) == 1}
    for block in blocks:
        for _, cells in _by_row(block.cells):
            occupied = {cell.column for cell in cells}
            for column in occupied:
                if aliases.get(column) in occupied:
                    del aliases[column]
    return aliases


_ORDINALS = {2: "second", 3: "third", 4: "fourth", 5: "fifth"}


def _align_model_rows(
    columns: list[str], rows: list[Row], axis: _ModelAxis
) -> list[tuple[str, list[snap.SnapshotCell | None]]]:
    """Each row on the common axis. A second cell for the same row and column is never dropped:
    it is logged and shown on its own row, `<row> (second <column> value)`."""
    aligned: list[tuple[str, list[snap.SnapshotCell | None]]] = []
    for name, cells in rows:
        held: dict[str, snap.SnapshotCell] = {}
        extra: dict[str, list[snap.SnapshotCell]] = {}
        for cell in cells:
            label = axis.label(cell.column)
            if label in held:
                _LOG.warning(
                    "Model row %r has two values for column %r; the extra kept apart", name, label
                )
                extra.setdefault(label, []).append(cell)
            else:
                held[label] = cell
        aligned.append((name, [held.get(column) for column in columns]))
        for label, more in extra.items():
            for number, cell in enumerate(more, start=2):
                ordinal = _ORDINALS.get(number, f"#{number}")
                row = [cell if column == label else None for column in columns]
                aligned.append((f"{name} ({ordinal} {label} value)", row))
    return aligned


def _aligned_model_columns(
    cells: Sequence[snap.SnapshotCell], axis: _ModelAxis
) -> list[str] | None:
    """Use the common chronological axis whenever this section reports a period."""
    own = dict.fromkeys(axis.label(cell.column) for cell in cells)
    if not any(period in own for period in axis.periods):
        return None
    return [*axis.periods, *(column for column in own if column not in axis.periods)]


def _model_layout(
    layout: _Layout, found: dict[tuple[str, str], snap.Block], axis: _ModelAxis
) -> _Layout:
    columns = [
        aligned
        for (sheet, _), block in found.items()
        if sheet == MODEL and (aligned := _aligned_model_columns(block.cells, axis)) is not None
    ]
    width = MODEL_ROW_LABEL_WIDTH + max(map(len, columns), default=0)
    return replace(layout, width=max(layout.width, width))


def _model_handoff_blocks(snapshot: snap.Snapshot) -> dict[tuple[str, str], snap.Block]:
    raw = snapshot.model_handoffs.get("CP-1")
    if raw is None:
        return {}
    doc = snap._doc("CP-1", raw)
    blocks = {}
    for ident, name in (("T4.10", OPERATING_KPIS), ("T4.16", SEGMENTS), ("T4.17", ADJUSTMENTS)):
        try:
            table = doc.register(ident)
        except snap._Absent:
            continue
        except ValueError as error:
            blocks[MODEL, name] = _model_table_gap(name, str(error))
            continue
        cells = (
            _model_period_register_cells(doc, table, ident, name, snapshot.bridge_classifications)
            if ident == "T4.17" and "periodid" in {_clean_label(header) for header in table.headers}
            else _model_period_register_cells(doc, table, ident, name)
            if "periodid" in {_clean_label(header) for header in table.headers}
            else _period_table_cells(table, name)
        )
        if cells:
            blocks[MODEL, name] = snap.Block(MODEL, name, tuple(cells))
    _add_debt_and_segment_schedule(doc, blocks)
    return blocks


def _add_debt_and_segment_schedule(
    doc: snap._Doc, blocks: dict[tuple[str, str], snap.Block]
) -> None:
    debt_present = any(_register_start("T4.18").match(line) for line in doc.lines)
    try:
        debt = doc.register("T4.18")
    except snap._Absent:
        pass
    except ValueError as error:
        if (gap := _unreadable_table_gap(DEBT_FACILITIES, debt_present, error)) is not None:
            blocks[MODEL, DEBT_FACILITIES] = gap
    else:
        cells = _debt_facility_cells(doc, debt)
        if cells:
            blocks[MODEL, DEBT_FACILITIES] = snap.Block(MODEL, DEBT_FACILITIES, tuple(cells))
    schedule_present = any(
        line in ("## Segment schedule", "### Segment schedule") for line in doc.lines
    )
    try:
        cells = _segment_schedule_cells(doc.heading_table("Segment schedule"))
    except snap._Absent:
        return
    except ValueError as error:
        gap = _unreadable_table_gap("Segment schedule", schedule_present, error)
        cells = list(gap.cells) if gap is not None else []
    if cells:
        previous = blocks.get((MODEL, SEGMENTS))
        blocks[MODEL, SEGMENTS] = snap.Block(
            MODEL, SEGMENTS, (*(previous.cells if previous else ()), *cells)
        )


def _model_source_financials(snapshot: snap.Snapshot) -> list[snap.SnapshotCell]:
    raw = snapshot.model_handoffs.get("CP-1")
    if raw is None:
        return []
    doc = snap._doc("CP-1", raw)
    cells: list[snap.SnapshotCell] = []
    for ident in ("T4.4", "T4.5", "T4.6"):
        try:
            table = doc.register(ident)
        except snap._Absent:
            continue
        except ValueError as error:
            cells.extend(_source_financial_gap(doc, ident, error))
            continue
        cells.extend(_named_gaps(_period_table_cells(table, SOURCE_FINANCIALS), ident))
    try:
        calculations = doc.register("T4.9")
    except snap._Absent:
        pass
    except ValueError as error:
        cells.extend(_source_financial_gap(doc, "T4.9", error))
    else:
        cells.extend(_named_gaps(_calculation_register_cells(calculations), "T4.9"))
    unique: dict[tuple[str, str], snap.SnapshotCell] = {}
    for cell in cells:
        identity = (cell.row, cell.column)
        existing = unique.get(identity)
        if existing is None or existing.text == cell.text:
            unique.setdefault(identity, cell)
            continue
        unique[(f"{cell.row} ({cell.text})", cell.column)] = replace(
            cell, row=f"{cell.row} ({cell.text})"
        )
    return list(unique.values())


def _source_financial_gap(doc: snap._Doc, ident: str, error: ValueError) -> list[snap.SnapshotCell]:
    """A gap for a present source-financials table the reader refused; nothing when absent."""
    present = any(_register_start(ident).match(line) for line in doc.lines)
    gap = _unreadable_table_gap(SOURCE_FINANCIALS, present, error)
    return _named_gaps(list(gap.cells), ident) if gap is not None else []


def _named_gaps(cells: list[snap.SnapshotCell], ident: str) -> list[snap.SnapshotCell]:
    """Each table's gap on its own row so the one-row-per-identity merge keeps every gap."""
    return [
        replace(
            cell,
            row=f"Gap ({ident})",
            written=cell.written
            if str(cell.written).startswith(ident)
            else f"{ident}: {cell.written}",
        )
        if cell.kind == snap.GAP and cell.row == "Gap"
        else cell
        for cell in cells
    ]


def _calculation_register_cells(table: Any) -> list[snap.SnapshotCell]:
    if not table.headers or len(table.headers) > 200 or len(table.rows) > 500:
        return [_register_gap(SOURCE_FINANCIALS, "T4.9 exceeds its safe row or column limit")]
    indexes = {_clean_label(header): index for index, header in enumerate(table.headers)}
    required = ("metricname", "period", "calculatedvalue")
    if any(field not in indexes for field in required):
        return [
            _register_gap(
                SOURCE_FINANCIALS, "T4.9 lacks a metric name, period or calculated value column"
            )
        ]
    metric_index, period_index, value_index = (indexes[field] for field in required)
    cells = []
    for row in table.rows:
        if max(metric_index, period_index, value_index) >= len(row.cells):
            continue
        metric, period, value = (
            row.cells[metric_index].strip(),
            row.cells[period_index].strip(),
            row.cells[value_index].strip(),
        )
        if not metric or not period:
            continue
        if value:
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    SOURCE_FINANCIALS,
                    metric,
                    period,
                    snap.COPIED,
                    value,
                    table.module,
                    table.section,
                    row.line,
                )
            )
        for header, column in (("unit", "Unit"), ("currency", "Currency")):
            index = indexes.get(header)
            if index is not None and index < len(row.cells) and row.cells[index].strip():
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        SOURCE_FINANCIALS,
                        metric,
                        column,
                        snap.COPIED,
                        row.cells[index].strip(),
                        table.module,
                        table.section,
                        row.line,
                    )
                )
        for header in ("calculationstatus", "limitations"):
            index = indexes.get(header)
            if index is not None and index < len(row.cells) and row.cells[index].strip():
                label = (
                    f"{period} status" if header == "calculationstatus" else f"{period} limitations"
                )
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        SOURCE_FINANCIALS,
                        metric,
                        label,
                        snap.COPIED,
                        row.cells[index].strip(),
                        table.module,
                        table.section,
                        row.line,
                    )
                )
    return cells


# Name columns: T4.16 `segment_name` (src/deploy_vii/model_interface.py:53-61), CP-1 step 5
# "business unit".
_SEGMENT_NAME_HEADERS = {"segmentname", "segment", "businessunit", "division", "lineofbusiness"}
# Citation columns: the whole name is a note, it starts with source/evidence/basis/locator, or it
# ends with basis/locator. `Notes receivable` and `Resource cost` are values and stay.
_CITATION_LEAD = {"source", "sources", "evidence", "basis", "locator"}
_CITATION_TAIL = {"basis", "locator"}
_CITATION_WHOLE = {"note", "notes"}


def _citation_header(header: str) -> bool:
    """A header that carries a citation or note, not a value."""
    words = re.findall(r"[a-z]+", header.casefold())
    return bool(words) and (
        words[0] in _CITATION_LEAD
        or words[-1] in _CITATION_TAIL
        or "".join(words) in _CITATION_WHOLE
    )


# Basis qualifiers: kept beside each segment figure as context, as the wide path keeps them.
_SEGMENT_CONTEXT_HEADERS = {"basis", "reportedbasis", "basisofpreparation"}


@dataclass(frozen=True)
class _SegmentColumns:
    period: int
    names: tuple[int, ...]
    values: tuple[tuple[str, int], ...]
    context: tuple[tuple[str, int], ...]


def _segment_columns(table: snap._Table) -> _SegmentColumns | None:
    """Period, name, value and context columns of a long segment table; None without a name."""
    labels = [_clean_label(header) for header in table.headers]
    names = tuple(i for i, label in enumerate(labels) if label in _SEGMENT_NAME_HEADERS)
    if not names:
        return None
    period = labels.index("period")
    not_value = {"period", "unit", "currency"} | _SEGMENT_NAME_HEADERS
    not_value |= _SEGMENT_CONTEXT_HEADERS
    return _SegmentColumns(
        period,
        names,
        tuple(
            (header, i)
            for i, header in enumerate(table.headers)
            if labels[i] not in not_value and not _citation_header(header)
        ),
        tuple(
            (header.strip(), i)
            for i, header in enumerate(table.headers)
            if labels[i] in _SEGMENT_CONTEXT_HEADERS
        ),
    )


def _segment_caption(row: snap._Row, indexes: dict[str, int]) -> str:
    """The Unit cell only; the Currency column is not part of the segment caption."""
    index = indexes.get("unit")
    return row.cells[index].strip() if index is not None and index < len(row.cells) else ""


def _segment_schedule_cells(table: snap._Table) -> list[snap.SnapshotCell]:
    if not table.headers or len(table.headers) > 200 or len(table.rows) > 500:
        return [_register_gap(SEGMENTS, "the table exceeds its safe row or column limit")]
    indexes = {_clean_label(header): index for index, header in enumerate(table.headers)}
    if "period" not in indexes:
        return _wide_segment_schedule_cells(table)
    columns = _segment_columns(table)
    if columns is None:
        return [
            _model_table_gap(
                SEGMENTS, "the segment schedule has no segment name (Business Unit) column"
            ).cells[0]
        ]
    used = [columns.period, *columns.names, *(i for _, i in columns.values + columns.context)]
    cells = []
    for row in table.rows:
        if max(used) >= len(row.cells):
            continue
        period = row.cells[columns.period].strip()
        name = " · ".join(c for c in (row.cells[i].strip() for i in columns.names) if c)
        if not period or not name:
            continue
        caption = _segment_caption(row, indexes)
        for header, index in columns.values:
            value = row.cells[index].strip()
            if value:
                metric = f"{header} ({caption})" if caption else header
                cells.append(_segment_cell(table, row, f"{name} · {metric}", period, value))
                for context, at in columns.context:
                    if row.cells[at].strip():
                        cells.append(
                            _segment_cell(
                                table,
                                row,
                                f"{name} · {metric}",
                                f"{period} {context}",
                                row.cells[at].strip(),
                            )
                        )
    return cells


def _segment_cell(
    table: snap._Table, row: snap._Row, label: str, column: str, text: str
) -> snap.SnapshotCell:
    return snap.SnapshotCell(
        MODEL, SEGMENTS, label, column, snap.COPIED, text, table.module, table.section, row.line
    )


def _wide_segment_schedule_cells(table: Any) -> list[snap.SnapshotCell]:
    if not table.headers or len(table.headers) > 200 or len(table.rows) > 500:
        return [_register_gap(SEGMENTS, "the table exceeds its safe row or column limit")]
    period_columns = [
        (header, index)
        for index, header in enumerate(table.headers)
        if period_order(header) is not None
    ]
    if not period_columns:
        return [_register_gap(SEGMENTS, "the table has no explicit period column")]
    label_index = 0
    indexes = {_clean_label(header): index for index, header in enumerate(table.headers)}
    unit_index = indexes.get("unit")
    basis_index = indexes.get("basis")
    cells = []
    for row in table.rows:
        if label_index >= len(row.cells):
            continue
        label = row.cells[label_index].strip()
        if not label:
            continue
        for period, index in period_columns:
            if index < len(row.cells) and row.cells[index].strip():
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        SEGMENTS,
                        label,
                        period,
                        snap.COPIED,
                        row.cells[index].strip(),
                        table.module,
                        table.section,
                        row.line,
                    )
                )
        for context_index, column in ((unit_index, "Unit"), (basis_index, "Reported basis")):
            if (
                context_index is not None
                and context_index < len(row.cells)
                and row.cells[context_index].strip()
            ):
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        SEGMENTS,
                        label,
                        column,
                        snap.COPIED,
                        row.cells[context_index].strip(),
                        table.module,
                        table.section,
                        row.line,
                    )
                )
    return cells


def _model_table_gap(name: str, reason: str) -> snap.Block:
    return snap.Block(
        MODEL,
        name,
        (
            snap.SnapshotCell(
                MODEL,
                name,
                "Gap",
                "Text",
                snap.GAP,
                f"The {name} table could not be read.",
                "CP-1",
                written=reason,
            ),
        ),
    )


def _period_table_cells(table: Any, name: str) -> list[snap.SnapshotCell]:
    if not table.headers or len(table.headers) > 200 or len(table.rows) > 500:
        return [_model_table_gap(name, "the table exceeds its safe row or column limit").cells[0]]
    metric_index = next(
        (
            index
            for index, header in enumerate(table.headers)
            if _clean_label(header) == "metricname"
        ),
        0,
    )
    period_columns = [
        (header, index)
        for index, header in enumerate(table.headers)
        if index > 0 and period_order(header) is not None
    ]
    if not period_columns:
        return [_model_table_gap(name, "the table has no explicit period column").cells[0]]
    unit_columns = [
        (header, index)
        for index, header in enumerate(table.headers)
        if _clean_label(header) in {"unit", "currency"}
    ]
    context_columns = [
        (header, index)
        for index, header in enumerate(table.headers)
        if _clean_label(header) in {"basis", "trenddirection", "limitation"}
    ]
    cells = []
    for source_row in table.rows:
        if not source_row.cells:
            continue
        label = (
            source_row.cells[metric_index].strip() if metric_index < len(source_row.cells) else ""
        )
        if not label:
            continue
        for column, index in period_columns:
            if index < len(source_row.cells) and source_row.cells[index].strip():
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        name,
                        label,
                        column,
                        snap.COPIED,
                        source_row.cells[index],
                        table.module,
                        table.section,
                        source_row.line,
                    )
                )
        for column, index in unit_columns:
            if index < len(source_row.cells) and source_row.cells[index].strip():
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        name,
                        label,
                        "Currency" if _clean_label(column) == "currency" else "Unit",
                        snap.COPIED,
                        source_row.cells[index],
                        table.module,
                        table.section,
                        source_row.line,
                    )
                )
        for column, index in context_columns:
            if index < len(source_row.cells) and source_row.cells[index].strip():
                context = "Reported basis" if _clean_label(column) == "basis" else column.strip()
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        name,
                        label,
                        context,
                        snap.COPIED,
                        source_row.cells[index],
                        table.module,
                        table.section,
                        source_row.line,
                    )
                )
    return cells


def _register_gap(name: str, reason: str) -> snap.SnapshotCell:
    _LOG.warning("credit snapshot: the %s table is not read: %s", name, reason)
    return _model_table_gap(name, reason).cells[0]


def _unreadable_table_gap(name: str, present: bool, error: ValueError) -> snap.Block | None:
    """A gap block for a table the handoff has but the reader refused; None when it is absent."""
    if not present:
        return None
    _LOG.warning("credit snapshot: the %s table cannot be read: %s", name, error)
    return _model_table_gap(name, str(error))


def _register_refusal(
    table: snap._Table, ident: str, indexes: dict[str, int], fields: tuple[str, str]
) -> str | None:
    """Why a PeriodID table is not read as a register, or None when it is readable."""
    if len(table.headers) > 200 or len(table.rows) > 500:
        return "the table exceeds its safe row or column limit"
    if ident not in {"T4.16", "T4.17"}:
        return f"a {ident} table with a PeriodID column is not read"
    absent = [field for field in (fields[0], "periodid", fields[1]) if field not in indexes]
    if absent:
        return f"required column missing or repeated: {', '.join(absent)}"
    return None


def _model_period_register_cells(
    doc: snap._Doc,
    table: snap._Table,
    ident: str,
    name: str,
    classifications: Mapping[str, snap._BridgeClassification] | None = None,
) -> list[snap.SnapshotCell]:
    headers = [_clean_label(header) for header in table.headers]
    header_counts = Counter(headers)
    indexes = {column: index for index, column in enumerate(headers) if header_counts[column] == 1}
    label_field, value_field = (
        ("segmentname", "revenue")
        if ident == "T4.16"
        else (
            "addbacklabel",
            "value",
        )
    )
    if (reason := _register_refusal(table, ident, indexes, (label_field, value_field))) is not None:
        return [_register_gap(name, reason)]
    periods = _period_register(doc)
    context = _RegisterContext(
        table,
        indexes,
        ident,
        name,
        classifications or {},
        _tagged_id_counts(table, indexes, periods) if ident == "T4.17" else Counter(),
        header_counts["addbackid"] > 1,
    )
    cells: list[snap.SnapshotCell] = []
    dates_seen: set[str] = set()
    units_seen: set[tuple[str, snap._RowKey | None]] = set()
    adjustment_counts: Counter[tuple[str, str, str]] = Counter()
    for row in table.rows:
        label, period_id, value = (
            _period_field(row, indexes, key) for key in (label_field, "periodid", value_field)
        )
        if not label or not period_id:
            continue
        registered = periods.get(period_id)
        if registered is None:
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    name,
                    label,
                    "Period not stated",
                    snap.GAP,
                    "A period label is unavailable for this source row.",
                    table.module,
                    table.section,
                    row.line,
                    written=f"T4.14 did not map {period_id}",
                )
            )
            continue
        period, unit = registered.label, registered.unit
        row_key = _tagged_row_key(row, label, registered, context, adjustment_counts)
        row_cells: list[snap.SnapshotCell] = []
        row_label = label
        if ident == "T4.16":
            row_label = f"{label} · Revenue ({unit})" if unit else f"{label} · Revenue"
        if value:
            row_cells.append(
                snap.SnapshotCell(
                    MODEL,
                    name,
                    row_label,
                    period,
                    snap.COPIED,
                    value,
                    table.module,
                    table.section,
                    row.line,
                )
            )
        if ident == "T4.17":
            row_cells.append(_tagged_bridge_status(row, label, registered, context))
        unit_key = label, row_key
        if ident != "T4.16" and unit and unit_key not in units_seen:
            row_cells.append(
                snap.SnapshotCell(
                    MODEL,
                    name,
                    label,
                    "Unit",
                    snap.COPIED,
                    unit,
                    *registered.source,
                )
            )
            units_seen.add(unit_key)
        _append_register_context(row_cells, row, label, period, context)
        cells.extend(replace(item, row_key=row_key) if row_key else item for item in row_cells)
        if period not in dates_seen:
            cells.extend(_registered_dates(registered, name))
            dates_seen.add(period)
    return cells


@dataclass(frozen=True)
class _RegisteredPeriod:
    label: str
    start: str
    end: str
    unit: str | None
    source: tuple[str, str, int]


def _registered_dates(period: _RegisteredPeriod, block: str) -> list[snap.SnapshotCell]:
    return [
        snap.SnapshotCell(MODEL, block, field, period.label, snap.COPIED, text, *period.source)
        for field, text in (("Period start", period.start), ("Period end", period.end))
        if text
    ]


def _period_field(row: snap._Row, indexes: dict[str, int], field: str) -> str:
    index = indexes.get(field)
    return row.cells[index].strip() if index is not None and index < len(row.cells) else ""


def _period_register(doc: snap._Doc) -> dict[str, _RegisteredPeriod]:
    try:
        table = doc.register("T4.14")
    except (snap._Absent, ValueError):
        return {}
    if len(table.headers) > 200 or len(table.rows) > 500:
        return {}
    indexes = {_clean_label(header): index for index, header in enumerate(table.headers)}
    if "periodid" not in indexes:
        return {}
    periods: dict[str, _RegisteredPeriod] = {}
    for row in table.rows:
        period_id = _period_field(row, indexes, "periodid")
        if not period_id:
            continue
        start = _period_field(row, indexes, "startdate")
        end = _period_field(row, indexes, "enddate")
        label = _period_label(
            period_id,
            _period_field(row, indexes, "fiscalyear"),
            _period_field(row, indexes, "fiscalquarter"),
            _period_field(row, indexes, "periodtype"),
            end,
        )
        if label is None:
            continue
        currency, unit = (_period_field(row, indexes, name) for name in ("currency", "unit"))
        caption = " ".join(filter(None, (currency, unit))) or None
        periods[period_id] = _RegisteredPeriod(
            label, start, end, caption, (table.module, table.section, row.line)
        )
    return _distinct_registered_windows(periods)


def _distinct_registered_windows(
    periods: dict[str, _RegisteredPeriod],
) -> dict[str, _RegisteredPeriod]:
    windows: dict[str, set[tuple[str, str]]] = {}
    for period in periods.values():
        windows.setdefault(period.label, set()).add((period.start, period.end))
    distinct = {}
    for period_id, period in periods.items():
        if len(windows[period.label]) > 1:
            start = period.start or "start not stated"
            end = period.end or "end not stated"
            period = replace(period, label=f"{period.label} / {start} to {end}")
        distinct[period_id] = period
    return distinct


def _period_label(period_id: str, year: str, quarter: str, kind: str, end: str) -> str | None:
    kind = _clean_label(kind)
    fiscal_year = f"FY{year}" if re.fullmatch(r"[0-9]{4}", year) else None
    quarter_number = re.fullmatch(r"(?:Q)?([1-4])", quarter.upper())
    fiscal_quarter = (
        f"Q{quarter_number[1]} {fiscal_year}" if quarter_number and fiscal_year else None
    )
    if kind in {"fy", "fiscalyear", "annual", "year"} and fiscal_year:
        return fiscal_year
    if kind in {"", "q", "quarter", "quarterly"} and fiscal_quarter:
        return fiscal_quarter
    group = {
        "ytd": "YTD",
        "yeartodate": "YTD",
        "pytd": "PYTD",
        "prioryeartodate": "PYTD",
        "ltm": "LTM",
        "ttm": "LTM",
        "lasttwelvemonths": "LTM",
        "pf": "PF",
        "proforma": "PF",
    }.get(kind)
    if group is not None:
        for anchor in (end, fiscal_quarter or fiscal_year):
            if anchor and period_order(label := f"{group} {anchor}") is not None:
                return label
    return period_id if period_order(period_id) is not None else None


@dataclass(frozen=True)
class _RegisterContext:
    table: snap._Table
    indexes: dict[str, int]
    ident: str
    block: str
    classifications: Mapping[str, snap._BridgeClassification]
    id_counts: Counter[tuple[str, str]]
    ambiguous_id_columns: bool


def _tagged_row_key(
    row: snap._Row,
    label: str,
    period: _RegisteredPeriod,
    context: _RegisterContext,
    counts: Counter[tuple[str, str, str]],
) -> snap._RowKey | None:
    if context.ident != "T4.17":
        return None
    key = snap._add_back_id_text(_period_field(row, context.indexes, "addbackid"))
    if not snap._valid_add_back_id(key):
        key = ""
    occurrence = label, period.label, key
    counts[occurrence] += 1
    return key, period.unit or "", counts[occurrence]


def _tagged_id_counts(
    table: snap._Table, indexes: dict[str, int], periods: dict[str, _RegisteredPeriod]
) -> Counter[tuple[str, str]]:
    counts: Counter[tuple[str, str]] = Counter()
    if "addbackid" not in indexes:
        return counts
    for row in table.rows:
        period = periods.get(_period_field(row, indexes, "periodid"))
        key = snap._add_back_id_text(_period_field(row, indexes, "addbackid"))
        if period is not None and key:
            counts[period.label, key] += 1
    return counts


def _tagged_bridge_status(
    row: snap._Row, label: str, period: _RegisteredPeriod, context: _RegisterContext
) -> snap.SnapshotCell:
    raw_key = _period_field(row, context.indexes, "addbackid")
    key = snap._add_back_id_text(raw_key)
    classification = (
        context.classifications.get(key) if context.id_counts[period.label, key] == 1 else None
    )
    at = context.table.at(row.line)
    text = snap.UNCLASSIFIED if key or context.ambiguous_id_columns else snap.NEEDS_ADD_BACK_IDS
    reason = "Conflicting Add-Back ID columns" if context.ambiguous_id_columns else None
    if classification is not None:
        at = classification.at or at
        if snap._comparable_bridge_unit(period.unit, classification.unit):
            text = classification.value
        else:
            reason = "The bridge and assessment reporting units cannot be compared."
    kind = snap.COMPUTED if text in {"realised", "unrealised"} else snap.GAP
    return snap.SnapshotCell(
        MODEL,
        context.block,
        label,
        f"{period.label} linked realization",
        kind,
        text,
        at.module,
        at.section,
        at.line,
        written=reason,
    )


def _append_register_context(
    cells: list[snap.SnapshotCell], row: Any, label: str, period: str, context: _RegisterContext
) -> None:
    table, indexes, ident = context.table, context.indexes, context.ident
    fields = (
        (
            ("status", "Status"),
            ("realizationstatus", "Source realization status"),
            ("source_definition", "Definition"),
        )
        if ident == "T4.17"
        else (("status", "Status"),)
    )
    for key, column in fields:
        index = indexes.get(_clean_label(key))
        if index is None or index >= len(row.cells) or not row.cells[index].strip():
            continue
        if ident == "T4.17" and column == "Source realization status":
            continue
        cells.append(
            snap.SnapshotCell(
                MODEL,
                context.block,
                label,
                column if column != "Status" else f"{period} status",
                snap.COPIED,
                row.cells[index].strip(),
                table.module,
                table.section,
                row.line,
            )
        )
    if ident == "T4.17":
        index = indexes.get("realizationstatus")
        if index is not None and index < len(row.cells) and row.cells[index].strip():
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    context.block,
                    label,
                    f"{period} source realization status",
                    snap.COPIED,
                    row.cells[index].strip(),
                    table.module,
                    table.section,
                    row.line,
                )
            )


def _clean_label(text: str) -> str:
    return re.sub(r"[^a-z]", "", text.casefold())


def _debt_facility_cells(doc: snap._Doc, table: snap._Table) -> list[snap.SnapshotCell]:
    if not table.headers or len(table.headers) > 200 or len(table.rows) > 500:
        return [_register_gap(DEBT_FACILITIES, "the table exceeds its safe row or column limit")]
    indexes = {_clean_label(header): index for index, header in enumerate(table.headers)}
    if "periodid" not in indexes:
        return _unperioded_debt_cells(table)
    name = next((field for field in ("facilityname", "instrument") if field in indexes), None)
    if name is None:
        return [_register_gap(DEBT_FACILITIES, "the dated table has no facility name column")]
    return _dated_debt_cells(table, _period_register(doc), indexes, name)


def _debt_property(header: str) -> bool:
    return not _citation_header(header)


def _unperioded_debt_cells(table: snap._Table) -> list[snap.SnapshotCell]:
    included = [
        (header, index)
        for index, header in enumerate(table.headers[1:], start=1)
        if _debt_property(header)
    ]
    cells = []
    for source_row in table.rows:
        instrument = source_row.cells[0].strip() if source_row.cells else ""
        if not instrument:
            continue
        for header, index in included:
            if index >= len(source_row.cells) or not source_row.cells[index].strip():
                continue
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    DEBT_FACILITIES,
                    instrument,
                    header.strip(),
                    snap.COPIED,
                    source_row.cells[index],
                    table.module,
                    table.section,
                    source_row.line,
                )
            )
    return cells


@dataclass(frozen=True)
class _DatedDebtColumns:
    amount: int | None
    properties: tuple[tuple[str, int], ...]


def _dated_debt_cells(
    table: snap._Table,
    periods: dict[str, _RegisteredPeriod],
    indexes: dict[str, int],
    name_field: str,
) -> list[snap.SnapshotCell]:
    amount = next(
        (
            indexes[key]
            for key in ("carryingvalue", "principal", "drawnamount", "outstanding")
            if key in indexes
        ),
        None,
    )
    identity = {name_field, "facilityid", "periodid"}
    columns = _DatedDebtColumns(
        amount,
        tuple(
            (header.strip().replace("_", " "), index)
            for index, header in enumerate(table.headers)
            if _clean_label(header) not in identity and _debt_property(header)
        ),
    )
    names = _dated_debt_names(table.rows, indexes, name_field)
    cells: list[snap.SnapshotCell] = []
    dates_seen: set[str] = set()
    for row in table.rows:
        facility_id = _period_field(row, indexes, "facilityid")
        name = names.get(facility_id, _period_field(row, indexes, name_field))
        if not name:
            continue
        period_id = _period_field(row, indexes, "periodid")
        period = periods.get(period_id)
        if period is None:
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    DEBT_FACILITIES,
                    name,
                    "Period not stated",
                    snap.GAP,
                    "A period label is unavailable for this source row.",
                    table.module,
                    table.section,
                    row.line,
                    written=f"T4.14 did not map {period_id}",
                )
            )
            continue
        if period.label not in dates_seen:
            cells.extend(_registered_dates(period, DEBT_FACILITIES))
            dates_seen.add(period.label)
        cells.extend(_dated_debt_terms(table, row, name, period.label, columns))
    return cells


def _dated_debt_names(
    rows: Sequence[snap._Row], indexes: dict[str, int], name_field: str
) -> dict[str, str]:
    names: dict[str, str] = {}
    for row in rows:
        facility_id = _period_field(row, indexes, "facilityid")
        name = _period_field(row, indexes, name_field)
        if facility_id and name:
            names.setdefault(facility_id, name)
    counts = Counter(names.values())
    return {
        facility_id: f"{name} ({facility_id})" if counts[name] > 1 else name
        for facility_id, name in names.items()
    }


def _dated_debt_terms(
    table: snap._Table,
    row: snap._Row,
    name: str,
    period: str,
    columns: _DatedDebtColumns,
) -> list[snap.SnapshotCell]:
    cells = []
    source = table.module, table.section, row.line
    for header, index in columns.properties:
        if index >= len(row.cells) or not row.cells[index].strip():
            continue
        column = f"{period} / {header}"
        if index == columns.amount:
            column = period
            cells.append(
                snap.SnapshotCell(MODEL, DEBT_FACILITIES, name, "Amount basis", LABEL, header)
            )
        cells.append(
            snap.SnapshotCell(
                MODEL, DEBT_FACILITIES, name, column, snap.COPIED, row.cells[index], *source
            )
        )
    return cells


def _model_bridge_cells(bridge: snap.Block) -> list[snap.SnapshotCell]:
    """Reuse the gathered Snapshot bridge facts on the Model sheet."""
    result = []
    for cell in bridge.cells:
        if cell.column in {"Amount", "Reporting unit"}:
            column = "Bridge" if cell.column == "Amount" else "Unit"
            result.append(replace(cell, sheet=MODEL, block=BRIDGE, column=column))
        elif cell.column == "Classification" or (
            cell.column == "Value"
            and cell.row in {"Structuring EBITDA", "Less unrealised add-backs", "House EBITDA"}
        ):
            column = "Add-back status" if cell.column == "Classification" else "Bridge"
            result.append(replace(cell, sheet=MODEL, block=BRIDGE, column=column))
        elif cell.kind == snap.GAP:
            result.append(replace(cell, sheet=MODEL, block=BRIDGE, column="Bridge"))
    return result


def _metric_name(key: str) -> str:
    names = {
        "adj": "EBITDA (as named in Financial foundation)",
        "adj-margin": "EBITDA margin",
        "adj-growth": "EBITDA YoY growth",
        "ltm-adj": "LTM EBITDA",
        "interest": "Interest",
        "closing-debt": "Closing debt",
        "senior": "Senior secured leverage (secured debt / EBITDA)",
        "total-leverage": "Total leverage (debt / EBITDA)",
        "total_leverage": "Total leverage (debt / EBITDA)",
        "net-leverage": "Net leverage (net debt / EBITDA)",
        "net_leverage": "Net leverage (net debt / EBITDA)",
        "coverage": "Interest coverage (EBITDA / interest)",
        "revenue": "Revenue",
        "cogs": "Cost of goods sold",
        "gross_profit": "Gross profit",
        "ebitda": "EBITDA",
        "ebit": "EBIT",
        "da": "Depreciation and amortisation",
        "cfo": "Model cash from operations",
        "capex": "Capital expenditure",
        "fcf": "Cash proxy (not issuer free cash flow)",
        "tax_wc": "Cash taxes and working capital, combined",
        "opening_debt": "Opening debt",
        "closing_debt": "Closing debt (carrying value)",
        "opening_cash": "Opening cash",
        "closing_cash": "Closing cash",
        "undrawn": "Undrawn facility",
        "liquidity": "Accessible liquidity",
        "net_debt": "Net debt",
        "fcf_to_debt": "Cash proxy / debt",
        "dividends": "Distributions",
        "repayment": "Debt repayment",
    }
    return names.get(key, key.replace("_", " ").capitalize())


def _model_output_cells(snapshot: snap.Snapshot) -> list[snap.SnapshotCell]:
    """Copy retained history and Base/Downside amounts into the common Model grid."""
    seen = {
        (cell.row, cell.column)
        for cell in snapshot.cells()
        if cell.sheet == SNAPSHOT and cell.block == FINANCIALS
    }
    calculation = _json_object(snapshot.model_files.get("calculation.json"))
    schema = calculation.get("schema_version")
    if schema == "retained-handoff-model/1":
        cells = _legacy_model_cells(snapshot, calculation, seen)
        return cells + _forecast_model_cells(snapshot, calculation, seen)
    if schema != "cpos-model/1":
        return []
    return _history_model_cells(snapshot, calculation, seen) + _forecast_model_cells(
        snapshot, calculation, seen
    )


def _legacy_model_cells(
    snapshot: snap.Snapshot, calculation: dict[str, Any], seen: set[tuple[str, str]]
) -> list[snap.SnapshotCell]:
    values = calculation.get("values")
    periods = calculation.get("annual_periods")
    if not isinstance(values, dict) or not isinstance(periods, list) or len(periods) > 60:
        return []
    if not _input_pins_match(snapshot, calculation.get("inputs")):
        return []
    prior_units = _model_unit_map(snapshot)
    cells = _legacy_records(values, periods, seen, prior_units)
    quarters = calculation.get("quarters")
    if isinstance(quarters, dict) and len(quarters) <= 60:
        cells.extend(_legacy_records(quarters, list(quarters), seen, prior_units))
    return cells


def _legacy_records(
    records: dict[str, Any],
    periods: list[Any],
    seen: set[tuple[str, str]],
    prior_units: dict[str, str],
) -> list[snap.SnapshotCell]:
    cells: list[snap.SnapshotCell] = []
    for period in periods:
        if not isinstance(period, str):
            continue
        record = records.get(period)
        if not isinstance(record, dict) or len(record) > 200:
            continue
        for key, entry in record.items():
            if not isinstance(key, str) or not isinstance(entry, dict):
                continue
            amount = entry.get("amount")
            if amount is None:
                reason = entry.get("reason")
                if isinstance(reason, str) and reason:
                    _append_model_gap(
                        cells,
                        seen,
                        _ModelGap(
                            key,
                            period,
                            reason,
                            unit=_legacy_unit_caption(entry),
                            prior_unit=prior_units.get(_metric_name(key)),
                        ),
                    )
            elif isinstance(amount, str):
                _append_legacy_amount(cells, seen, (key, period, amount, entry), prior_units)
    return cells


def _append_legacy_amount(
    cells: list[snap.SnapshotCell],
    seen: set[tuple[str, str]],
    item: tuple[str, str, str, dict[str, Any]],
    prior_units: dict[str, str],
) -> None:
    key, period, amount, entry = item
    unit = _legacy_unit_caption(entry)
    if unit is None:
        _LOG.warning(
            "credit snapshot: model amount %s for %s states no unit; written as a gap", key, period
        )
        _append_model_gap(
            cells,
            seen,
            _ModelGap(key, period, "The model output states no unit for this amount."),
        )
        return
    _append_model_amount(
        cells,
        seen,
        _ModelAmount(
            key, period, amount, "calculation.json", unit, prior_units.get(_metric_name(key))
        ),
    )


_LEGACY_MONEY_SCALES = {"MILLIONS": "1000000", "THOUSANDS": "1000", "BILLIONS": "1000000000"}


def _legacy_unit_caption(entry: dict[str, Any]) -> str | None:
    """The unit the entry itself states (its currency where stated); None when it states none
    or its scale contradicts its unit, so the caller writes a gap rather than a bare figure."""
    unit, currency, scale = entry.get("unit"), entry.get("currency"), entry.get("scale")
    if not isinstance(unit, str):
        return None
    if unit in _LEGACY_MONEY_SCALES and scale == _LEGACY_MONEY_SCALES[unit]:
        word = str(unit).lower()
        return f"{currency} {word}" if isinstance(currency, str) and currency.strip() else word
    # PERCENT is a level stated as a figure (25 = 25%); the bare caption "percent" takes the 0.00%
    # format that rescales fractions, so PERCENT keeps its own caption and a plain number format.
    captions = {"FRACTION": "percent", "PERCENT": "percent (stated figure)", "MULTIPLE": "multiple"}
    return captions.get(unit)


def _input_pins_match(snapshot: snap.Snapshot, pins: Any) -> bool:
    if not isinstance(pins, dict):
        return False
    expected = {
        "annual": "annual.md",
        "current_synthesis": "current_synthesis.md",
        "quarter": "quarter.md",
        "forecast": "forecast.md",
        "forecast_exact": "forecast_exact.json",
    }
    if not {"annual", "current_synthesis"} <= pins.keys():
        return False
    if ("forecast" in pins) != ("forecast_exact" in pins):
        return False
    if not all(_input_pin_matches(snapshot, role, expected, item) for role, item in pins.items()):
        return False
    return _pin_sha(pins.get("annual")) == snapshot.handoff_sha256.get("CP-1") and _pin_sha(
        pins.get("current_synthesis")
    ) == snapshot.handoff_sha256.get("CP-2")


def _input_pin_matches(
    snapshot: snap.Snapshot, role: Any, expected: dict[str, str], item: Any
) -> bool:
    if not isinstance(role, str) or role not in expected or not isinstance(item, dict):
        return False
    path = expected[role]
    digest = item.get("sha256")
    return (
        item.get("path") == path
        and isinstance(digest, str)
        and re.fullmatch(r"[0-9a-f]{64}", digest) is not None
        and snapshot.source_sha256.get(f"model:{path}") == digest
    )


def _pin_sha(item: Any) -> str | None:
    digest = item.get("sha256") if isinstance(item, dict) else None
    return digest if isinstance(digest, str) else None


@dataclass(frozen=True)
class _UnitCaption:
    text: str
    module: str
    section: str
    line: int | None = None


def _model_unit_cell(
    row: str, unit: str, value_source: str, caption: _UnitCaption | None
) -> snap.SnapshotCell:
    source = caption if caption is not None and caption.text == unit else None
    return snap.SnapshotCell(
        MODEL,
        FINANCIALS,
        row,
        "Unit",
        snap.COPIED,
        unit,
        source.module if source is not None else "Model output",
        source.section if source is not None else value_source,
        source.line if source is not None else None,
    )


@dataclass(frozen=True)
class _ModelGap:
    key: str
    period: str
    reason: str
    source: str = "calculation.json"
    unit: str | None = None
    prior_unit: str | None = None
    unit_caption: _UnitCaption | None = None


def _model_row_label(source: str, key: str) -> str:
    """The Model row a key is written on: the one name for the prior-unit lookup and the row."""
    if source == "forecast_exact.json" and key == "ebitda":
        return "Adjusted EBITDA"
    return _metric_name(key)


def _append_model_gap(
    cells: list[snap.SnapshotCell],
    seen: set[tuple[str, str]],
    output: _ModelGap,
) -> None:
    label = _model_row_label(output.source, output.key)
    row = (
        f"{label} ({output.unit})"
        if output.unit and output.prior_unit and output.unit != output.prior_unit
        else label
    )
    if (row, output.period) in seen:
        return
    cells.append(
        snap.SnapshotCell(
            MODEL,
            FINANCIALS,
            row,
            output.period,
            snap.GAP,
            "n.a.",
            "Model output",
            output.source,
            written=output.reason,
        )
    )
    seen.add((row, output.period))
    if output.unit and (row, "Unit") not in seen:
        cells.append(_model_unit_cell(row, output.unit, output.source, output.unit_caption))
        seen.add((row, "Unit"))


def _history_model_cells(
    snapshot: snap.Snapshot,
    calculation: dict[str, Any],
    seen: set[tuple[str, str]],
) -> list[snap.SnapshotCell]:
    history = calculation.get("history")
    columns = (
        history.get("columns")
        if isinstance(history, dict) and history.get("schema_version") == "cpos-history/1"
        else None
    )
    if not isinstance(columns, list) or len(columns) > 60:
        return []
    bound_forecast = _bound_forecast(snapshot, calculation)
    if calculation.get("schema_version") == "cpos-model/1" and not bound_forecast:
        return []
    cells: list[snap.SnapshotCell] = []
    prior_units = _model_unit_map(snapshot)
    caption = _forecast_unit_caption(bound_forecast, snapshot.model_handoffs.get("CP-1"))
    unit = caption.text if caption is not None else None
    for column in columns:
        if not isinstance(column, dict) or not isinstance(column.get("values"), dict):
            continue
        values, label = column["values"], column.get("label")
        if len(values) > 200 or not isinstance(label, str):
            continue
        if _absent_history_period(column, values):
            continue
        start, end = column.get("start"), column.get("end")
        if isinstance(start, str) and isinstance(end, str):
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    FINANCIALS,
                    "Period dates",
                    label,
                    snap.COPIED,
                    f"{start} to {end}",
                    "Model output",
                    "calculation.json",
                )
            )
        for key, entry in values.items():
            amount = entry.get("amount") if isinstance(entry, dict) else None
            if isinstance(key, str) and isinstance(entry, dict) and amount is None:
                reason = entry.get("reason")
                if isinstance(reason, str) and reason:
                    _append_model_gap(
                        cells,
                        seen,
                        _ModelGap(
                            key,
                            label,
                            reason,
                            unit=_forecast_metric_unit(key, unit),
                            prior_unit=prior_units.get(_metric_name(key)),
                            unit_caption=caption,
                        ),
                    )
            elif isinstance(key, str) and isinstance(amount, str):
                _append_model_amount(
                    cells,
                    seen,
                    _ModelAmount(
                        key,
                        label,
                        amount,
                        "calculation.json",
                        _forecast_metric_unit(key, unit),
                        prior_units.get(_metric_name(key)),
                        caption,
                    ),
                )
    return cells


def _absent_history_period(column: dict[str, Any], values: dict[str, Any]) -> bool:
    """The producer's unanchored placeholders are not spreadsheet period columns."""
    label = column.get("label")
    if label not in ("Quarter", "Fiscal year", "YTD", "PYTD", "LTM", "Prior LTM", "PF LTM"):
        return False
    reason = column.get("reason")
    return bool(
        column.get("start") is None
        and column.get("end") is None
        and isinstance(reason, str)
        and reason.strip()
        and all(
            isinstance(entry, dict) and entry.get("amount") is None for entry in values.values()
        )
    )


def _forecast_model_cells(
    snapshot: snap.Snapshot, calculation: dict[str, Any], seen: set[tuple[str, str]]
) -> list[snap.SnapshotCell]:
    forecast = _bound_forecast(snapshot, calculation)
    outputs = forecast.get("outputs")
    if not isinstance(outputs, dict):
        return []
    downside = "DOWNSIDE" if _has_years(outputs.get("DOWNSIDE")) else "DOWNSIDE_DRIVERS"
    cells: list[snap.SnapshotCell] = []
    prior_units = _model_unit_map(snapshot)
    caption = _forecast_unit_caption(forecast, snapshot.model_handoffs.get("CP-1"))
    unit = caption.text if caption is not None else None
    for case, label in (("REFERENCE", "Base"), (downside, "Downside")):
        for year in _forecast_years(outputs.get(case)):
            period = f"{label} FY{year['year']}"
            start, end = year.get("planning_start"), year.get("planning_end")
            if isinstance(start, str) and isinstance(end, str):
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        FINANCIALS,
                        "Period dates",
                        period,
                        snap.COPIED,
                        f"{start} to {end}",
                        "Model output",
                        "forecast_exact.json",
                    )
                )
            for key, entry in year.items():
                amount = entry.get("amount") if isinstance(entry, dict) else None
                if key != "year" and isinstance(key, str) and isinstance(entry, dict):
                    if amount is None:
                        reason = entry.get("reason")
                        if isinstance(reason, str) and reason:
                            _append_model_gap(
                                cells,
                                seen,
                                _ModelGap(
                                    key,
                                    period,
                                    reason,
                                    "forecast_exact.json",
                                    _forecast_metric_unit(key, unit),
                                    prior_units.get(_model_row_label("forecast_exact.json", key)),
                                    caption,
                                ),
                            )
                        continue
                    if not isinstance(amount, str):
                        continue
                    _append_model_amount(
                        cells,
                        seen,
                        _ModelAmount(
                            key,
                            period,
                            amount,
                            "forecast_exact.json",
                            _forecast_metric_unit(key, unit),
                            prior_units.get(_model_row_label("forecast_exact.json", key)),
                            caption,
                        ),
                    )
    return cells


def _model_unit_map(snapshot: snap.Snapshot) -> dict[str, str]:
    return {
        cell.row: cell.text
        for cell in snapshot.cells()
        if cell.sheet == SNAPSHOT and cell.block == FINANCIALS and cell.column == "Unit"
    }


def _forecast_metric_unit(key: str, currency_unit: str | None) -> str | None:
    if key == "fcf_to_debt":
        return "percent"
    if key in {"total_leverage", "net_leverage", "coverage"}:
        return "multiple"
    return currency_unit


def _bound_forecast(snapshot: snap.Snapshot, calculation: dict[str, Any]) -> dict[str, Any]:
    forecast = _json_object(snapshot.model_files.get("forecast_exact.json"))
    consumed = forecast.get("consumed")
    if calculation.get("schema_version") == "retained-handoff-model/1":
        inputs = calculation.get("inputs")
        allowed = {
            _pin_sha(inputs.get(role))
            for role in ("annual", "current_synthesis", "quarter", "forecast")
            if isinstance(inputs, dict) and role in inputs
        }
        annual_sha = _pin_sha(inputs.get("annual")) if isinstance(inputs, dict) else None
        pins_match = (
            isinstance(consumed, dict)
            and bool(consumed)
            and annual_sha is not None
            and annual_sha in consumed.values()
            and all(isinstance(digest, str) and digest in allowed for digest in consumed.values())
            and _input_pins_match(snapshot, inputs)
        )
    else:
        required = {"CP-1.md"}
        if snapshot.handoff_sha256.get("CP-2G") is not None:
            required.add("CP-2G.md")
        pins_match = isinstance(consumed, dict) and set(consumed) == required
    if (
        isinstance(consumed, dict)
        and pins_match
        and calculation.get("schema_version") != "retained-handoff-model/1"
    ):
        for name, digest in consumed.items():
            if not isinstance(name, str) or not isinstance(digest, str):
                pins_match = False
                break
            module = name.removesuffix(".md")
            if name not in {"CP-1.md", "CP-2G.md"} or snapshot.handoff_sha256.get(module) != digest:
                pins_match = False
                break
    if (
        calculation.get("forecast_exact_sha256")
        != snapshot.source_sha256.get("model:forecast_exact.json")
        or calculation.get("forecast_exact_file") != "forecast_exact.json"
        or forecast.get("schema_version") != "cpos-forecast-exact/1"
        or not pins_match
    ):
        return {}
    return forecast


def _forecast_unit_caption(forecast: dict[str, Any], handoff: bytes | None) -> _UnitCaption | None:
    units, scale = forecast.get("units"), forecast.get("scale")
    if units is not None or scale is not None:
        if (
            scale is not None
            and isinstance(units, str)
            and 0 < len(units) <= 40
            and units.isprintable()
            and units.strip()
        ):
            return _UnitCaption(units, "Model output", "forecast_exact.json")
        return None
    if handoff is None:
        return None
    text = handoff.decode("utf-8", errors="replace")
    request = re.search(r"^## Request[ \t]*\r?\n(.*?)(?=^## |\Z)", text, re.MULTILINE | re.DOTALL)
    if request is None:
        return None
    phrase = re.search(r"\b[A-Z]{3}\s+(?:millions|billions|thousands)\b", request.group(1))
    if phrase is None:
        return None
    line = text.count("\n", 0, request.start(1) + phrase.start()) + 1
    return _UnitCaption(re.sub(r"\s+", " ", phrase.group(0)), "CP-1", "Request", line)


def _model_assumptions(snapshot: snap.Snapshot) -> snap.Block | None:
    calculation = _json_object(snapshot.model_files.get("calculation.json"))
    if calculation.get("schema_version") not in {
        "cpos-model/1",
        "retained-handoff-model/1",
    }:
        return None
    forecast = _bound_forecast(snapshot, calculation)
    drivers = forecast.get("reference_drivers")
    outputs = forecast.get("outputs")
    if not isinstance(outputs, dict):
        return None
    reference = outputs.get("REFERENCE")
    years = _forecast_years(reference)
    if not isinstance(drivers, dict) or not years or len(drivers) > 20:
        return None
    cells: list[snap.SnapshotCell] = []
    units_added: set[str] = set()
    caption = _forecast_unit_caption(forecast, snapshot.model_handoffs.get("CP-1"))
    currency_unit = caption.text if caption is not None else None
    base_scope = _DriverScope(drivers, years, "Base", currency_unit)
    _append_driver_assumptions(cells, units_added, base_scope)
    _append_downside_assumptions(cells, units_added, forecast, outputs, base_scope)
    _append_facility_assumptions(cells, forecast)
    _append_forecast_limits(cells, forecast)
    history = calculation.get("history")
    if isinstance(history, dict):
        _append_scope_limits(cells, history.get("limits"), "History scope", "calculation.json")
    _append_downside_shock(cells, forecast)
    if not cells:
        return None
    return snap.Block(MODEL, ASSUMPTIONS, tuple(cells))


def _append_downside_assumptions(
    cells: list[snap.SnapshotCell],
    units_added: set[str],
    forecast: dict[str, Any],
    outputs: dict[str, Any],
    base_scope: _DriverScope,
) -> None:
    downside_case = "DOWNSIDE" if _has_years(outputs.get("DOWNSIDE")) else "DOWNSIDE_DRIVERS"
    if downside_case != "DOWNSIDE_DRIVERS" and forecast.get("downside_basis") != "downside_drivers":
        return
    downside_drivers = forecast.get("downside_drivers")
    if not isinstance(downside_drivers, dict) or len(downside_drivers) > 20:
        return
    years = _forecast_years(outputs.get(downside_case))
    if not years or [year.get("year") for year in years] != [
        year.get("year") for year in base_scope.periods
    ]:
        return
    merged = {**base_scope.values, **downside_drivers}
    _append_driver_assumptions(
        cells, units_added, _DriverScope(merged, years, "Downside", base_scope.currency_unit)
    )


def _append_downside_shock(cells: list[snap.SnapshotCell], forecast: dict[str, Any]) -> None:
    shock = forecast.get("downside_shock")
    if isinstance(shock, dict):
        for key, row in (
            ("ebitda_decline", "Downside EBITDA decline"),
            ("rate_increase", "Downside interest-rate increase"),
        ):
            value = shock.get(key)
            if isinstance(value, str):
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        ASSUMPTIONS,
                        row,
                        "Downside shock",
                        snap.COPIED,
                        value,
                        "Model output",
                        "forecast_exact.json",
                        number_format="0.00%",
                    )
                )
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        ASSUMPTIONS,
                        row,
                        "Unit",
                        snap.COPIED,
                        "percent",
                        "Model output",
                        "forecast_exact.json",
                    )
                )


def _append_forecast_limits(cells: list[snap.SnapshotCell], forecast: dict[str, Any]) -> None:
    _append_scope_limits(
        cells, forecast.get("scope_limits"), "Forecast scope", "forecast_exact.json"
    )


def _append_scope_limits(
    cells: list[snap.SnapshotCell], limits: Any, label: str, source: str
) -> None:
    if isinstance(limits, list) and len(limits) <= 100:
        for index, limitation in enumerate(limits, start=1):
            if isinstance(limitation, str) and limitation.strip():
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        ASSUMPTIONS,
                        f"{label} limit {index}",
                        label,
                        snap.COPIED,
                        limitation,
                        "Model output",
                        source,
                    )
                )


def _append_facility_assumptions(cells: list[snap.SnapshotCell], forecast: dict[str, Any]) -> None:
    facilities = forecast.get("facilities")
    if isinstance(facilities, list) and len(facilities) <= 100:
        _append_facility_reference_rates(cells, facilities, forecast)
        _append_facility_year_rates(cells, facilities, "years")
    schedule = forecast.get("facility_schedule")
    if isinstance(schedule, list) and len(schedule) <= 100:
        _append_facility_year_rates(cells, schedule, "years")


def _append_facility_reference_rates(
    cells: list[snap.SnapshotCell], facilities: list[Any], forecast: dict[str, Any]
) -> None:
    outputs = forecast.get("outputs")
    years = _forecast_years(outputs.get("REFERENCE")) if isinstance(outputs, dict) else []
    for facility in facilities:
        if not isinstance(facility, dict) or not isinstance(facility.get("name"), str):
            continue
        rates = facility.get("reference_rate")
        if isinstance(rates, str):
            rates = [rates]
        if not isinstance(rates, list) or len(rates) > 20:
            continue
        label = f"{facility['name']} reference rate"
        added = False
        for year, rate in zip(years, rates, strict=False):
            if isinstance(rate, str) and _is_fraction(rate):
                _append_facility_rate(cells, label, f"Base FY{year['year']}", rate)
                added = True
        if added:
            _append_facility_unit(cells, label)


def _append_facility_year_rates(
    cells: list[snap.SnapshotCell], facilities: list[Any], key: str
) -> None:
    for facility in facilities:
        if not isinstance(facility, dict) or not isinstance(facility.get("name"), str):
            continue
        years = facility.get(key)
        if not isinstance(years, list) or len(years) > 20:
            continue
        label = f"{facility['name']} interest rate"
        added = False
        for year in years:
            if not isinstance(year, dict) or not isinstance(year.get("year"), int):
                continue
            rate = year.get("rate")
            if isinstance(rate, str):
                _append_facility_rate(cells, label, f"Base FY{year['year']}", rate)
                added = True
        if added:
            _append_facility_unit(cells, label)


def _append_facility_rate(
    cells: list[snap.SnapshotCell], label: str, period: str, rate: str
) -> None:
    cells.append(
        snap.SnapshotCell(
            MODEL,
            ASSUMPTIONS,
            label,
            period,
            snap.COPIED,
            rate,
            "Model output",
            "forecast_exact.json",
            number_format="0.00%",
        )
    )


def _append_facility_unit(cells: list[snap.SnapshotCell], label: str) -> None:
    cells.append(
        snap.SnapshotCell(
            MODEL,
            ASSUMPTIONS,
            label,
            "Unit",
            snap.COPIED,
            "percent",
            "Model output",
            "forecast_exact.json",
        )
    )


def _is_fraction(value: str) -> bool:
    if re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)", value) is None:
        return False
    try:
        return math.isfinite(float(value))
    except ValueError:
        return False


@dataclass(frozen=True)
class _DriverScope:
    values: dict[str, Any]
    periods: list[dict[str, Any]]
    label: str
    currency_unit: Any


def _append_driver_assumptions(
    cells: list[snap.SnapshotCell], seen_units: set[str], scope: _DriverScope
) -> None:
    for key, label in DRIVER_LABEL.items():
        driver = scope.values.get(key)
        if not isinstance(driver, dict):
            continue
        values = driver.get("values")
        if not isinstance(values, list) or len(values) != len(scope.periods):
            continue
        for period, value in zip(scope.periods, values, strict=True):
            if isinstance(value, str):
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        ASSUMPTIONS,
                        label,
                        f"{scope.label} FY{period['year']}",
                        snap.COPIED,
                        value,
                        "Model output",
                        "forecast_exact.json",
                        number_format="0.00%" if DRIVER_UNIT[key] == "percent" else None,
                    )
                )
        for field in ("category", "rationale", "limitation"):
            note = driver.get(field)
            if isinstance(note, str) and note.strip():
                cells.append(
                    snap.SnapshotCell(
                        MODEL,
                        ASSUMPTIONS,
                        f"{label} {field}",
                        scope.label,
                        snap.COPIED,
                        note,
                        "Model output",
                        "forecast_exact.json",
                    )
                )
        unit = "percent" if DRIVER_UNIT[key] == "percent" else scope.currency_unit
        if isinstance(unit, str) and unit and label not in seen_units:
            cells.append(
                snap.SnapshotCell(
                    MODEL,
                    ASSUMPTIONS,
                    label,
                    "Unit",
                    snap.COPIED,
                    unit,
                    "Model output",
                    "forecast_exact.json",
                )
            )
            seen_units.add(label)


def _forecast_years(output: Any) -> list[dict[str, Any]]:
    years = output.get("years") if isinstance(output, dict) else None
    if not isinstance(years, list) or len(years) > 20:
        return []
    return [
        year
        for year in years
        if isinstance(year, dict) and len(year) <= 200 and isinstance(year.get("year"), int)
    ]


@dataclass(frozen=True)
class _ModelAmount:
    key: str
    period: str
    amount: str
    source: str
    unit: str | None
    prior_unit: str | None = None
    unit_caption: _UnitCaption | None = None


def _append_model_amount(
    cells: list[snap.SnapshotCell], seen: set[tuple[str, str]], output: _ModelAmount
) -> None:
    if output.unit is None:
        _LOG.warning(
            "credit snapshot: model amount %s for %s states no unit; written as a gap",
            output.key,
            output.period,
        )
        _append_model_gap(
            cells,
            seen,
            _ModelGap(
                output.key,
                output.period,
                "The model output states no unit for this amount.",
                output.source,
            ),
        )
        return
    label = _model_row_label(output.source, output.key)
    row = (
        f"{label} ({output.unit})"
        if output.unit and output.prior_unit and output.unit != output.prior_unit
        else label
    )
    if (row, output.period) not in seen:
        cells.append(
            snap.SnapshotCell(
                MODEL,
                FINANCIALS,
                row,
                output.period,
                snap.COPIED,
                output.amount,
                "Model output",
                output.source,
                number_format="0.00%" if output.unit == "percent" else None,
            )
        )
        seen.add((row, output.period))
    if output.unit and (row, "Unit") not in seen:
        cells.append(_model_unit_cell(row, output.unit, output.source, output.unit_caption))
        seen.add((row, "Unit"))


def _has_years(output: Any) -> bool:
    return (
        isinstance(output, dict)
        and isinstance(output.get("years"), list)
        and bool(output["years"])
        and len(output["years"]) <= 20
    )


def _json_object(raw: bytes | None) -> dict[str, Any]:
    if raw is None:
        return {}
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def _bands(
    layout: _Layout, found: dict[tuple[str, str], snap.Block]
) -> list[list[tuple[snap.Block, int]]]:
    """The bands of a sheet: absent blocks dropped, the rest of a band widened to fill it, and
    any block no band names placed alone at the end (nothing gathered is left off the page)."""
    bands: list[list[tuple[snap.Block, int]]] = []
    placed: set[str] = set()
    for band in layout.bands:
        present = [
            (found[layout.sheet, name], span)
            for name, span in band
            if (layout.sheet, name) in found
        ]
        if not present:
            continue
        widths = _spans([span for _, span in present], layout.width)
        bands.append([(block, w) for (block, _), w in zip(present, widths, strict=True)])
        placed.update(block.name for block, _ in present)
    for (sheet, name), block in found.items():
        if sheet == layout.sheet and name not in placed:
            bands.append([(block, layout.width)])
    return bands


# --- The book -------------------------------------------------------------------------------------


class _Book:
    def __init__(self, snapshot: snap.Snapshot) -> None:
        self.snapshot = snapshot
        self.sources: list[tuple[str, str, _Put]] = []
        self.bases: list[snap.SnapshotCell] = []
        self.writtens: list[snap.SnapshotCell] = []
        self.workbook = _xl.Workbook()
        self.plan = fx.Plan({}, (), (), ())
        self.formula_text: dict[tuple[str, str], str] = {}
        self.places: dict[tuple[str, str, str, str], str] = {}  # cells with no Sources row

    def add_source(self, sheet: str, cell: str, spec: _Put) -> None:
        self.sources.append((sheet, cell, spec))

    def add_basis(self, item: snap.SnapshotCell) -> None:
        self.bases.append(item)

    def add_written(self, item: snap.SnapshotCell) -> None:
        self.writtens.append(item)

    def build(self) -> bytes:
        self.plan = fx.extend(self.snapshot, _blocks(self.snapshot))
        self._link_financials_to_model()
        axis = _model_periods(self.plan.found)
        first = True
        for layout in LAYOUTS:
            ws = self.workbook.active if first else self.workbook.create_sheet()
            first = False
            ws.title = layout.sheet
            if layout.sheet == MODEL:
                layout = _model_layout(layout, self.plan.found, axis)
            page = _Page(self, ws, layout, axis if layout.sheet == MODEL else None)
            self._sheet(page, self.plan.found)
        self._finish()
        self._sources(self.workbook.create_sheet(SOURCES))
        self.workbook.properties.creator = "Credit Snapshot"
        buffer = io.BytesIO()
        self.workbook.save(buffer)
        return buffer.getvalue()

    def _link_financials_to_model(self) -> None:
        """Make the Snapshot a view of the same CP-1 figures shown on Model."""
        block = self.plan.found.get((SNAPSHOT, FINANCIALS))
        model = self.plan.found.get((MODEL, FINANCIALS))
        if block is None or model is None:
            return
        formulas = list(self.plan.formulas)
        linked = []
        for cell in block.cells:
            if cell.kind in (snap.COPIED, snap.GAP, snap.COMPUTED, snap.ENTERED):
                source = fx.At(MODEL, FINANCIALS, cell.row, cell.column)
                index = len(formulas)
                formulas.append(fx.Formula("=⟦0⟧", (source,), mirror=source))
                linked.append(replace(cell, kind=FORMULA, text=f"{fx.HANDLE}{index}"))
            else:
                linked.append(cell)
        self.plan = replace(
            self.plan,
            found={**self.plan.found, (SNAPSHOT, FINANCIALS): replace(block, cells=tuple(linked))},
            formulas=tuple(formulas),
        )

    def _finish(self) -> None:
        """Every cell is placed: write the formulas with their names turned into addresses, then
        the dropdowns and the chip colours."""
        where = {
            (sheet, spec.block, spec.row, spec.column): address
            for sheet, address, spec in self.sources
        } | self.places
        for sheet, address, spec in self.sources:
            if spec.kind != FORMULA:
                continue
            formula = self.plan.formulas[int(spec.text.removeprefix(fx.HANDLE))]
            cell = self.workbook[sheet][address]
            cell.value = self.formula_text[sheet, address] = fx.resolve(formula, where)
            if formula.mirror is not None:
                source, there = fx.place(formula.mirror, where)
                cell.number_format = self.workbook[source][there].number_format
            elif formula.number_format is not None:
                cell.number_format = formula.number_format
        for dropdown in self.plan.dropdowns:
            self._dropdown(dropdown, where)
        for sheet, block, column in self.plan.chips:
            where_chips = [
                a
                for s, a, p in self.sources
                if (s, p.block, p.column, p.kind) == (sheet, block, column, FORMULA)
            ]
            self._chips(sheet, where_chips)

    def _dropdown(self, dropdown: fx.Dropdown, where: dict[tuple[str, str, str, str], str]) -> None:
        cells = [
            address
            for sheet, address, spec in self.sources
            if (sheet, spec.block, spec.column) == (dropdown.sheet, dropdown.block, dropdown.column)
            and dropdown.row in (None, spec.row)
            and spec.kind in (snap.ANALYST, FORMULA)
        ]
        if not cells:
            return
        rule = _validation.DataValidation(
            type="list",
            formula1=fx.list_text(dropdown.items, where),
            allow_blank=True,
            showErrorMessage=True,
        )
        ws = self.workbook[dropdown.sheet]
        ws.add_data_validation(rule)
        for address in cells:
            rule.add(address)

    def _chips(self, sheet: str, addresses: list[str]) -> None:
        ws = self.workbook[sheet]
        for name, colour in zip(RECOMMENDATION_NAMES, CHIP_COLOURS, strict=True):
            rule = _rules.CellIsRule(operator="equal", formula=[f'"{name}"'], fill=_fill(colour))
            ws.conditional_formatting.add(" ".join(addresses), rule)

    def _sheet(self, page: _Page, found: dict[tuple[str, str], snap.Block]) -> None:
        layout, ws = page.layout, page.ws
        self._set_up(ws, layout)
        banner = _Put("Page", "(title)", "Title", LABEL, layout.title, "banner")
        page.put(1, 1, layout.width, banner)
        note = _Put("Page", "(note)", "Note", LABEL, layout.note, "note")
        page.put(2, 1, layout.width, note)
        page.height_for(1, 26)
        row = FIRST_BAND
        for band in _bands(layout, found):
            bottom, left = row, 1
            for block, span in band:
                bottom = max(bottom, _render(page, _Frame(row, left, span), block))
                left += span
            row = bottom + 1

    def _set_up(self, ws: Any, layout: _Layout) -> None:
        ws.sheet_view.showGridLines = False
        ws.freeze_panes = f"A{TITLE_ROWS + 1}"
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr = _props.PageSetupProperties(fitToPage=True)
        ws.print_title_rows = f"1:{TITLE_ROWS}"
        ws.sheet_properties.tabColor = BLUE
        for col in range(1, layout.width + 1):
            ws.column_dimensions[_utils.get_column_letter(col)].width = layout.column_width

    def _sources(self, ws: Any) -> None:
        ws.append(list(SOURCES_HEADER))
        for cell in ws[1]:
            cell.font, cell.fill = _font("FFFFFF", bold=True), _fill(BLUE)
        for col, width in enumerate(SOURCES_WIDTHS, start=1):
            ws.column_dimensions[_utils.get_column_letter(col)].width = width
        for sheet, address, spec in self.sources:
            ws.append(self._source_row(sheet, address, spec))
        for line in self.snapshot.basis_lines:
            ws.append(self._basis_row(ws.max_row + 1, line))
        for item in self.bases:
            ws.append(self._row_basis(ws.max_row + 1, item, "Row basis", item.basis))
        for item in self.writtens:
            column = "Reason" if item.kind == snap.GAP else "As written"
            ws.append(self._row_basis(ws.max_row + 1, item, column, item.written))
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.font = _font()
                if isinstance(cell.value, str):
                    cell.data_type = "s"  # exact text: never a formula or an error value
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions

    def _source_row(self, sheet: str, address: str, spec: _Put) -> list[Any]:
        item = spec.item
        module = item.module if item is not None else None
        text = None if spec.kind == snap.ANALYST else spec.text
        if spec.kind == FORMULA:
            text = self.formula_text[sheet, address]
        return [
            *(sheet, address, spec.kind, spec.block, spec.row, spec.column),
            module,
            item.section if item is not None else None,
            item.line if item is not None else None,
            text,
            self._sha(item, module),
            self.snapshot.run_id,
            self.snapshot.as_of,
        ]

    def _sha(self, item: snap.SnapshotCell | None, module: str | None) -> str | None:
        """The sha256 of the handoff, or of the supplied file a worksheet cell was copied from."""
        if module is None:
            return None
        if module == snap.RV_MODULE and item is not None:
            return self.snapshot.source_sha256.get(item.section or "")
        if module == "Model output" and item is not None:
            return self.snapshot.source_sha256.get(f"model:{item.section}")
        return self.snapshot.handoff_sha256.get(module)

    def _row_basis(
        self, number: int, item: snap.SnapshotCell, column: str, text: str | None
    ) -> list[Any]:
        """A scorecard or assessment row's own Basis cell, a cell's value as the handoff wrote it
        (`**5**`, a module code, a source reference), exactly (the comment, when it is clean,
        repeats the Basis): on Sources only, copied and traced to its row's handoff line. The
        reason a gap could not be read is the app's own text: kind computed, no handoff line."""
        module = item.module
        kind = snap.COMPUTED if item.kind == snap.GAP else snap.COPIED
        return [
            *(SOURCES, f"{_utils.get_column_letter(TEXT_COLUMN)}{number}", kind),
            *(item.block, item.row, column, module, item.section, item.line, text),
            self._sha(item, module),
            self.snapshot.run_id,
            self.snapshot.as_of,
        ]

    def _basis_row(self, number: int, line: snap.BasisLine) -> list[Any]:
        """A `Basis:` line: on Sources only, as copied text, its cell being the Sources cell."""
        address = f"{_utils.get_column_letter(TEXT_COLUMN)}{number}"
        return [
            *(SOURCES, address, snap.COPIED, line.block, line.row, "Basis"),
            *(line.module, line.section, line.line, line.text),
            self.snapshot.handoff_sha256.get(line.module),
            self.snapshot.run_id,
            self.snapshot.as_of,
        ]


def _safe(text: str, where: str) -> str:
    """`text`, or `snap.CONTROL_CHARACTER` (logged with `where`) when it holds a character a
    workbook cell cannot hold. Never stripped: the documented fail-open, so the download succeeds
    and the cell says why it is not the text."""
    if not snap.ILLEGAL.search(text):
        return text
    _LOG.warning("credit snapshot: %s holds a control character", where)
    return snap.CONTROL_CHARACTER


def _clean(snapshot: snap.Snapshot) -> snap.Snapshot:
    """The one check every string the writer is given passes, before any is written: each text of
    a cell (a changed `text` makes it a gap), its row, column, section, basis and written text,
    each Basis line and the run's names."""

    def cell(item: snap.SnapshotCell) -> snap.SnapshotCell:
        where = f"{item.sheet} / {item.block} / {item.row} / {item.column}"
        text = _safe(item.text, where)

        def optional(value: str | None) -> str | None:
            return None if value is None else _safe(value, where)

        return replace(
            item,
            row=_safe(item.row, where),
            column=_safe(item.column, where),
            kind=snap.GAP if text != item.text else item.kind,
            text=text,
            section=optional(item.section),
            basis=optional(item.basis),
            written=optional(item.written),
        )

    blocks = tuple(
        replace(block, name=_safe(block.name, block.name), cells=tuple(map(cell, block.cells)))
        for block in snapshot.blocks
    )
    lines = tuple(
        replace(
            line,
            text=_safe(line.text, f"Basis line of {line.module}"),
            section=_safe(line.section, f"Basis line of {line.module}"),
            row=_safe(line.row, f"Basis line of {line.module}"),
        )
        for line in snapshot.basis_lines
    )
    return replace(
        snapshot,
        blocks=blocks,
        basis_lines=lines,
        issuer=_safe(snapshot.issuer, "the issuer"),
        as_of=_safe(snapshot.as_of, "the as-of date"),
        pathway=_safe(snapshot.pathway, "the pathway"),
        pathway_title=_safe(snapshot.pathway_title, "the pathway title"),
        run_id=_safe(snapshot.run_id, "the run id"),
    )


def workbook_bytes(snapshot: snap.Snapshot) -> bytes:
    """The Credit Snapshot workbook for `snapshot`, as the bytes of an `.xlsx` file: four sheets,
    `Snapshot`, `Inputs`, `Matrix`, `Sources`."""
    return _Book(_clean(snapshot)).build()
