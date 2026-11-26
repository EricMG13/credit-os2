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
and `rule` (a methodology constant, a plain number or name). Module ids, file names,
hashes and run codes appear on `Sources` only. A `Basis:` line is kept on `Sources` beside its
paragraph and is never a cell of the other three sheets; a scorecard row's own Basis cell is the
comment on its level cell.

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
import logging
import math
import re
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, replace
from typing import Any

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_formulas as fx
from deploy_workflow.cp2_scorecard import level_text
from deploy_workflow.recommendation import RECOMMENDATION_NAMES

_LOG = logging.getLogger(__name__)
_xl = importlib.import_module("openpyxl")
_styles = importlib.import_module("openpyxl.styles")
_comments = importlib.import_module("openpyxl.comments")
_rules = importlib.import_module("openpyxl.formatting.rule")
_props = importlib.import_module("openpyxl.worksheet.properties")
_validation = importlib.import_module("openpyxl.worksheet.datavalidation")
_utils = importlib.import_module("openpyxl.utils")

SNAPSHOT, INPUTS, MATRIX, SOURCES = "Snapshot", "Inputs", "Matrix", "Sources"
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


def _bracketed(number_format: str) -> str:
    return f"{number_format};({number_format})"


def _lines(text: str, chars: float) -> int:
    return sum(max(1, math.ceil(len(part) / max(chars, 1.0))) for part in text.split("\n"))


class _Page:
    """One sheet being written: the cells, their heights, and the Sources rows they add."""

    def __init__(self, book: _Book, ws: Any, layout: _Layout) -> None:
        self.book, self.ws, self.layout = book, ws, layout
        self.headers: Counter[str] = Counter()

    def put(self, row: int, col: int, span: int, spec: _Put) -> str:
        """Write `spec` at (row, col), merged over `span` grid columns; return its address."""
        item = spec.item
        if spec.kind == RULE:
            figure = snap.figure(spec.text)  # a constant is a number where it is one
        else:
            figure = item.figure if item is not None else None
        empty = spec.kind in (snap.ANALYST, FORMULA)
        value: Any = figure.value if figure is not None else None if empty else spec.text
        first = self.ws.cell(row=row, column=col)
        self._paint(row, col, span, spec, isinstance(value, int | float))
        first.value = value
        if isinstance(value, str) and value.startswith("="):
            first.data_type = "s"  # copied text is never a formula
        if figure is not None:
            fmt = figure.number_format
            first.number_format = _bracketed(fmt) if spec.block == FINANCIALS else fmt
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
    rows: dict[str, list[snap.SnapshotCell]] = {}
    for cell in cells:
        rows.setdefault(cell.row, []).append(cell)
    return list(rows.items())


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


def _part(page: _Page, frame: _Frame, part: _Part) -> int:
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
    row = frame.top
    for table in _tables_of(_by_row(cells)):
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
    return found


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
        first = True
        for layout in LAYOUTS:
            ws = self.workbook.active if first else self.workbook.create_sheet()
            first = False
            ws.title = layout.sheet
            self._sheet(_Page(self, ws, layout), self.plan.found)
        self._finish()
        self._sources(self.workbook.create_sheet(SOURCES))
        self.workbook.properties.creator = "Credit Snapshot"
        buffer = io.BytesIO()
        self.workbook.save(buffer)
        return buffer.getvalue()

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
                if isinstance(cell.value, str) and cell.value.startswith("="):
                    cell.data_type = "s"
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
        return self.snapshot.handoff_sha256.get(module)

    def _row_basis(
        self, number: int, item: snap.SnapshotCell, column: str, text: str | None
    ) -> list[Any]:
        """A scorecard or assessment row's own Basis cell, its value as the handoff wrote it
        (`**5**`), or the reason a gap could not be read, exactly (the comment, when it is clean,
        repeats the Basis): on Sources only, traced to its row's handoff line."""
        module = item.module
        return [
            *(SOURCES, f"{_utils.get_column_letter(TEXT_COLUMN)}{number}", snap.COPIED),
            *(item.block, item.row, column, module, item.section, item.line, text),
            self.snapshot.handoff_sha256.get(module) if module is not None else None,
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
