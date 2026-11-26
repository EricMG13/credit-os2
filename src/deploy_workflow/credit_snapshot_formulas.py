"""The Credit Snapshot workbook's recommendation side: the methodology's constants, the Excel
formulas that derive each proposal from them, and the cells those formulas read.

`extend(snapshot, found)` takes the blocks `credit_snapshot_workbook` has built so far and returns
a `Plan`: the same blocks plus the blocks and cells this module adds, every formula as a template,
the dropdowns and the cells that are coloured as recommendation chips. It writes no file and
imports no spreadsheet library. A formula cell is a `SnapshotCell` of kind `formula` whose text is
a handle (`=#3`) to its `Formula`; the workbook writer, which knows where each cell landed, calls
`resolve` to turn the template into the text Excel reads. A formula only names cells by their
(sheet, block, row, column), so it is written before the layout is.

What is derived in Excel (methodology sections 4 to 7), from cells the analyst can edit:

- Credit Score: the mean of the scored factors (the Snapshot's own Level cells), an exact half
  rounded to the weaker score, none under 12 scored, no better than 4 when Liquidity or Maturity
  profile is 5.
- Per instrument row and per reference portfolio: eligibility by asset type, the reference
  bucket's median in basis points (the unit cell decides), the difference, the Valuation band,
  whether a limit of that portfolio is breached, and the result (the 5x5 table, held to 3).
- Per portfolio: `n/a`, blank, or the best result; then the name, the analyst's own view, the
  confirm cell and the `proposed` tag. Per capital-structure row: the table on the Credit Score
  and the row's Valuation against the index for its type, with no cap.

Every function used is in `openpyxl.utils.FORMULAE`. The constants are written as `rule` cells on
Matrix (numbers as numbers) and the formulas read them from there: nothing in a formula is a
methodology constant except the level 5 that triggers the floor and the five bucket words.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field, replace
from datetime import date

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import recommendation as rec
from deploy_workflow import reference_portfolios as rp
from deploy_workflow.cp2_scorecard import ASSESSMENTS

_LOG = logging.getLogger(__name__)
SNAPSHOT, INPUTS, MATRIX = "Snapshot", "Inputs", "Matrix"
FORMULA, RULE, LABEL, ANALYST = "formula", "rule", "label", snap.ANALYST
HANDLE = "=#"  # a formula cell's text until the writer knows where every cell is

SCORECARD, ASSESSMENTS_BLOCK = "Scorecard", "Assessments"
INSTRUMENTS, REFERENCE_UNIT = "Instruments", "Reference unit"
CAPITAL, TOTALS, EQUITY, MEASURES = (
    *("Capital structure", "Capital structure totals", "Equity value", "EBITDA measures"),
)
CREDIT_SCORE = "Credit Score from factors"
KEY_FIGURES, RECOMMENDATION = "Key figures", "Recommendation"
RV_LOANS, RV_BONDS = "Relative value: loans", "Relative value: bonds"
INDEX_ROW = "Index"
INDEX_COLUMNS = ("Rating bucket", "Level (bp)", "Price", "1M move", "YTD move")
PEERS, PEER_ISSUER = "Peers", "Peer issuer"
PEER_COLUMNS = (*INDEX_COLUMNS[:3], "FIGI", "Facility rating", "Bid", "Ask", *INDEX_COLUMNS[3:])
REC_TABLE, BANDS, SCALES, CS_RULES = (
    *("Recommendation table", "Valuation bands", "Scales", "Credit Score rules"),
)
ELIG_TYPES, ELIGIBLE, MEDIAN_BP, DIFFERENCE = (
    *("Eligible types", "Eligible", "Median (bp)", "Difference (bp)"),
)
VALUATION, BREACH, RESULT, PORTFOLIO = (
    *("Valuation", "Limit breach", "Result", "Portfolio result"),
)
PROPOSED_COLUMN, PERCENT_EV = "Proposed recommendation", "% EV"
HELD, HELD_TO = "Held by", "Held to MW"
LIMIT_NAMES, LIMIT_HITS, LIMITS_HOLD = "Limit names", "Limit hits", "Limits holding at 3"
NO_ORDER = "period order not stated"
TAIL_COLUMNS = ("Unit", "Currency")
EMPTY = '""'

TYPES = ("loan", "bond")
UNITS = ("basis points", "percent")
BAND_EDGES = (
    ("Score 1 edge", 100),
    ("Score 2 edge", 40),
    ("Score 4 edge", -40),
    ("Score 5 edge", -100),
)
VALUATION_NAMES = ("Very attractive", None, None, None, "Very unattractive")  # section 2
ARROWS = {"Improving": "▲", "Stable": "►", "Deteriorating": "▼"}
WORST_LEVEL = 5  # a factor scored 5 triggers the floor (section 4)
MIN_NAMES_TEXT = str(rec.MIN_NAMES)


# --- What a formula is -------------------------------------------------------------------------


@dataclass(frozen=True)
class At:
    """One cell by where the writer lists it: (sheet, block, row, column)."""

    sheet: str
    block: str
    row: str
    column: str


@dataclass(frozen=True)
class Span:
    """The smallest rectangle holding all of `cells` (on one sheet). With `shape` (rows, columns)
    the cells must be exactly that grid, one per grid cell: a table lookup reads positions."""

    cells: tuple[At, ...]
    shape: tuple[int, int] | None = None


Ref = At | Span
_MARK = re.compile("⟦([0-9]+)⟧")
_END = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
_A1 = re.compile(r"([A-Z]+)([0-9]+)")


@dataclass(frozen=True)
class Formula:
    """A formula with its cell names left open: `template` holds markers, `refs[n]` is what
    marker n stands for. `mirror` is the ref whose number format the cell copies."""

    template: str
    refs: tuple[Ref, ...]
    number_format: str | None = None
    mirror: At | None = None


@dataclass(frozen=True)
class Dropdown:
    """A list on every cell listed at (sheet, block, column): fixed words, or a range."""

    sheet: str
    block: str
    column: str
    items: tuple[str, ...] | Span
    row: str | None = None


@dataclass(frozen=True)
class Plan:
    found: dict[tuple[str, str], snap.Block]
    formulas: tuple[Formula, ...]
    dropdowns: tuple[Dropdown, ...]
    chips: tuple[tuple[str, str, str], ...]  # (sheet, block, column) coloured by the name shown


class _Draft:
    """Collects the cells a formula names and hands back the marker to write in its place."""

    def __init__(self) -> None:
        self.refs: list[Ref] = []

    def __call__(self, ref: Ref) -> str:
        self.refs.append(ref)
        return f"⟦{len(self.refs) - 1}⟧"

    def formula(
        self, template: str, number_format: str | None = None, mirror: At | None = None
    ) -> Formula:
        return Formula(template, tuple(self.refs), number_format, mirror)


def _column_number(letters: str) -> int:
    number = 0
    for letter in letters:
        number = number * 26 + ord(letter) - 64
    return number


def _column_letters(number: int) -> str:
    letters = ""
    while number:
        number, rest = divmod(number - 1, 26)
        letters = chr(65 + rest) + letters
    return letters


def _split(address: str) -> tuple[int, int]:
    found = _A1.fullmatch(address)
    if found is None:
        raise ValueError(f"{address!r} is not a cell address")
    return int(found.group(2)), _column_number(found.group(1))


def _absolute(row: int, column: int) -> str:
    return f"${_column_letters(column)}${row}"


def _located(at: At, where: Mapping[tuple[str, str, str, str], str]) -> str:
    try:
        return where[at.sheet, at.block, at.row, at.column]
    except KeyError:
        raise ValueError(f"a formula names a cell the workbook does not hold: {at}") from None


def _ref_text(ref: Ref, where: Mapping[tuple[str, str, str, str], str]) -> str:
    if isinstance(ref, At):
        row, column = _split(_located(ref, where))
        return f"{ref.sheet}!{_absolute(row, column)}"
    places = [_split(_located(at, where)) for at in ref.cells]
    sheets = {at.sheet for at in ref.cells}
    if len(sheets) != 1 or not places:
        raise ValueError(f"a range must hold cells of one sheet: {ref}")
    rows, columns = [p[0] for p in places], [p[1] for p in places]
    top, bottom, left, right = min(rows), max(rows), min(columns), max(columns)
    if ref.shape is not None and (
        (bottom - top + 1, right - left + 1) != ref.shape or len(set(places)) != len(places)
    ):
        raise ValueError(f"the cells are not laid out as a {ref.shape} grid: {ref.cells[0]}")
    (sheet,) = sheets
    first, last = _absolute(top, left), _absolute(bottom, right)
    return f"{sheet}!{first}" if first == last else f"{sheet}!{first}:{last}"


def place(at: At, where: Mapping[tuple[str, str, str, str], str]) -> tuple[str, str]:
    """The sheet and plain address (`C5`) of a cell the workbook holds."""
    return at.sheet, _located(at, where)


def resolve(formula: Formula, where: Mapping[tuple[str, str, str, str], str]) -> str:
    """The formula as Excel reads it. `where` maps (sheet, block, row, column) to the cell address
    the writer put it at; a name it does not hold raises."""
    return _MARK.sub(
        lambda found: _ref_text(formula.refs[int(found.group(1))], where), formula.template
    )


MAX_LIST_TEXT = 255  # Excel refuses a literal list of more characters


def _listable(items: Sequence[str]) -> bool:
    """Whether Excel can hold `items` as a literal list: it splits items on commas and has no
    escape for a double quote, and caps the text at `MAX_LIST_TEXT` characters."""
    return not any("," in i or '"' in i for i in items) and len(",".join(items)) <= MAX_LIST_TEXT


def list_text(items: tuple[str, ...] | Span, where: Mapping[tuple[str, str, str, str], str]) -> str:
    """A dropdown's list as a data-validation formula: quoted words, or a range."""
    if isinstance(items, Span):
        return _ref_text(items, where)
    return '"' + ",".join(items) + '"'


# --- The cells each reference portfolio has on Matrix --------------------------------------------


@dataclass(frozen=True)
class _Pair:
    asset: str
    bucket: str
    median: At
    names: At


@dataclass(frozen=True)
class _Reference:
    """One reference's cells on Matrix, found by walking the blocks in the order `credit_snapshot`
    wrote them (its views' counts say how many cells each owns)."""

    view: snap.ReferenceView
    pairs: tuple[_Pair, ...]
    breached: tuple[At, ...]
    rating: Mapping[str, tuple[At, ...]]  # bucket -> one cell per rating-limit row
    floors: tuple[At, ...]


@dataclass(frozen=True)
class _Limit:
    """One limit of a reference, as the breach formula tests it: a breached sector cell (`cell`), a
    rating-limit row (`by_bucket`, its outcome cell for each bucket, named by `label`) or a price
    floor (`cell`, its price, named by `label`)."""

    kind: str
    cell: At | None = None
    by_bucket: Mapping[str, At] | None = None
    label: At | None = None


def _limits(ref: _Reference) -> list[_Limit]:
    """Each limit of the reference once, in the Matrix's own order: the breached sector cells, the
    rating-limit rows, then the price floors."""
    out = [_Limit("sector", cell) for cell in ref.breached]
    rows = len(next(iter(ref.rating.values()), ()))
    for i in range(rows):
        by_bucket = {word: cells[i] for word, cells in ref.rating.items()}
        label = At(MATRIX, "Rating limits", next(iter(by_bucket.values())).row, "Row label")
        out.append(_Limit("rating", None, by_bucket, label))
    out += [
        _Limit("floor", cell, None, At(MATRIX, "Price floors", cell.row, "Row label"))
        for cell in ref.floors
    ]
    return out


def _hit_column(ref: _Reference, k: int) -> str:
    return f"{ref.view.name} / Limit {k}"


def _at(cell: snap.SnapshotCell) -> At:
    return At(cell.sheet, cell.block, cell.row, cell.column)


def _cells_of(found: Mapping[tuple[str, str], snap.Block], sheet: str, name: str) -> list[At]:
    block = found.get((sheet, name))
    return [] if block is None else [_at(cell) for cell in block.cells]


def _share(cells: Sequence[At], counts: Sequence[int], what: str) -> list[Sequence[At]]:
    if sum(counts) != len(cells):
        raise ValueError(f"{what}: {len(cells)} cells for {sum(counts)} expected by the views")
    shares, start = [], 0
    for count in counts:
        shares.append(cells[start : start + count])
        start += count
    return shares


def _references(
    snapshot: snap.Snapshot, found: Mapping[tuple[str, str], snap.Block]
) -> list[_Reference]:
    views = snapshot.references
    medians = _cells_of(found, MATRIX, "Reference medians")
    median_cells = _share(
        [c for c in medians if c.column == "Median"], [len(v.medians) for v in views], "medians"
    )
    names_cells = _share(
        [c for c in medians if c.column == "Names"], [len(v.medians) for v in views], "names"
    )
    breached = _share(
        _cells_of(found, MATRIX, "Breached sector limits"),
        [len(v.breached) for v in views],
        "limits",
    )
    ratings = _share(
        _cells_of(found, MATRIX, "Rating limits"),
        [sum(len(o) for _, o in v.rating_limits) for v in views],
        "rating limits",
    )
    floors = _share(
        _cells_of(found, MATRIX, "Price floors"), [len(v.price_floors) for v in views], "floors"
    )
    return [
        _Reference(
            view,
            tuple(
                _Pair(m.asset_type, m.bucket, med, name)
                for m, med, name in zip(view.medians, median_cells[i], names_cells[i], strict=True)
            ),
            tuple(breached[i]),
            _by_bucket(ratings[i]),
            tuple(floors[i]),
        )
        for i, view in enumerate(views)
    ]


def _by_bucket(cells: Iterable[At]) -> dict[str, tuple[At, ...]]:
    grouped: dict[str, list[At]] = {}
    for cell in cells:
        grouped.setdefault(cell.column, []).append(cell)
    return {bucket: tuple(items) for bucket, items in grouped.items()}


def _rows(cells: Iterable[snap.SnapshotCell]) -> list[str]:
    """The row names of a block of instruments, in order; none for a block that is one gap line."""
    items = list(cells)
    if len(items) == 1 and items[0].kind == snap.GAP:
        return []
    return list(dict.fromkeys(cell.row for cell in items))


def _rule(block: str, row: str, column: str, value: int | str) -> snap.SnapshotCell:
    return snap.SnapshotCell(MATRIX, block, row, column, RULE, str(value))


def _period_end(label: str) -> date | None:
    """The end date a period label states (`FY2024 / 2024-09-30`), None when it states none."""
    found = _END.search(label)
    if found is None:
        return None
    try:
        return date.fromisoformat(found.group())
    except ValueError:
        return None


def _gap(at: At, text: str) -> snap.SnapshotCell:
    return snap.SnapshotCell(at.sheet, at.block, at.row, at.column, snap.GAP, text)


def _label(sheet: str, block: str, row: str, column: str, text: str) -> snap.SnapshotCell:
    return snap.SnapshotCell(sheet, block, row, column, LABEL, text)


# --- The builder -------------------------------------------------------------------------------


@dataclass
class _Builder:
    snapshot: snap.Snapshot
    found: dict[tuple[str, str], snap.Block]
    formulas: list[Formula] = field(default_factory=list)
    dropdowns: list[Dropdown] = field(default_factory=list)
    chips: list[tuple[str, str, str]] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.references = _references(self.snapshot, self.found)
        self.instruments = _rows(self._cells(INPUTS, INSTRUMENTS))
        self.held = {_at(c) for block in self.found.values() for c in block.cells}

    # -- plumbing

    def _cells(self, sheet: str, name: str) -> tuple[snap.SnapshotCell, ...]:
        block = self.found.get((sheet, name))
        return () if block is None else block.cells

    def add(self, sheet: str, name: str, cells: Iterable[snap.SnapshotCell]) -> None:
        extra = tuple(cells)
        if not extra:
            return
        block = self.found.get((sheet, name)) or snap.Block(sheet, name, ())
        self.found[sheet, name] = replace(block, cells=block.cells + extra)
        self.held.update(_at(c) for c in extra)

    def formula(
        self,
        at: At,
        draft: _Draft,
        template: str,
        number_format: str | None = None,
        mirror: At | None = None,
    ) -> snap.SnapshotCell:
        self.formulas.append(draft.formula(template, number_format, mirror))
        text = f"{HANDLE}{len(self.formulas) - 1}"
        return snap.SnapshotCell(at.sheet, at.block, at.row, at.column, FORMULA, text)

    def analyst(self, at: At) -> snap.SnapshotCell:
        return snap.SnapshotCell(at.sheet, at.block, at.row, at.column, ANALYST, "")

    def dropdown(
        self,
        sheet: str,
        block: str,
        column: str,
        items: tuple[str, ...] | Span,
        row: str | None = None,
    ) -> None:
        self.dropdowns.append(Dropdown(sheet, block, column, items, row))

    # -- the constants

    def constants(self) -> None:
        table = [
            _rule(REC_TABLE, f"Credit Score {c}", f"Valuation {v}", result)
            for c, line in enumerate(rec.TABLE, 1)
            for v, result in enumerate(line, 1)
        ]
        self.add(MATRIX, REC_TABLE, table)
        self.add(
            MATRIX, BANDS, [_rule(BANDS, n, "Difference (bp)", edge) for n, edge in BAND_EDGES]
        )
        scales = {
            "Credit Score": rec.SCORE_NAMES,
            "Valuation": VALUATION_NAMES,
            "Recommendation": rec.RECOMMENDATION_NAMES,
        }
        cells = []
        for scale, words in scales.items():
            for level, word in enumerate(words, 1):
                cells.append(_rule(SCALES, f"{scale} {level}", "Level", level))
                if word is not None:
                    cells.append(_rule(SCALES, f"{scale} {level}", "Name", word))
        self.add(MATRIX, SCALES, cells)
        first, second = rec.FLOOR_FACTORS
        rules = (
            ("Minimum scored factors", rec.MIN_SCORED),
            ("Floor level", rec.FLOOR_LEVEL),
            ("Floor factor 1", first),
            ("Floor factor 2", second),
            ("Cap level", rec.CAP_AT),
        )
        self.add(MATRIX, CS_RULES, [_rule(CS_RULES, n, "Value", v) for n, v in rules])

    # -- the Credit Score

    def credit_score(self) -> None:
        at = At(INPUTS, CREDIT_SCORE, "Credit Score", "Value")
        levels = [_at(c) for c in self._cells(SNAPSHOT, SCORECARD) if c.column == "Level"]
        if not levels:
            self.add(INPUTS, CREDIT_SCORE, [self.analyst(at)])
            return
        d = _Draft()
        box = d(Span(tuple(levels)))
        floor_cells = [d(At(SNAPSHOT, SCORECARD, name, "Level")) for name in rec.FLOOR_FACTORS]
        minimum, floor = (
            d(At(MATRIX, CS_RULES, "Minimum scored factors", "Value")),
            d(At(MATRIX, CS_RULES, "Floor level", "Value")),
        )
        capped = ",".join(f"{cell}={WORST_LEVEL}" for cell in floor_cells)
        template = (
            f'=IF(COUNT({box})<{minimum},"",MAX(INT((2*SUM({box})+COUNT({box}))/(2*COUNT({box}))),'
            f"IF(OR({capped}),{floor},0)))"
        )
        self.add(INPUTS, CREDIT_SCORE, [self.formula(at, d, template, "0")])

    @property
    def score(self) -> At:
        return At(INPUTS, CREDIT_SCORE, "Credit Score", "Value")

    # -- names and the table

    def names(self, scale: str) -> Span:
        return Span(tuple(At(MATRIX, SCALES, f"{scale} {n}", "Name") for n in range(1, 6)), (5, 1))

    def table(self) -> Span:
        cells = tuple(
            At(MATRIX, REC_TABLE, f"Credit Score {c}", f"Valuation {v}")
            for c in range(1, 6)
            for v in range(1, 6)
        )
        return Span(cells, (5, 5))

    # -- instrument by reference

    def grid(self) -> None:
        """Eligible, Median (bp), Difference (bp), Valuation, Limit breach and Result: one cell for
        every instrument row and reference portfolio; the last five only where the reference is
        stored and holds a median."""
        if not self.instruments:
            return
        self._eligible_types()
        for name in self.instruments:
            for ref in self.references:
                self._eligible(name, ref)
        for ref in (r for r in self.references if r.pairs):
            for name in self.instruments:
                self._median(name, ref)
                self._difference(name, ref)
                self._valuation(name, ref)
                self._breach(name, ref)
                self._result(name, ref)
                self._held(name, ref)
        for ref in (r for r in self.references if r.pairs):
            self._limit_cells(ref)

    def _eligible_types(self) -> None:
        cells = [
            _label(MATRIX, ELIG_TYPES, ref.view.name, f"Type {n}", kind)
            for ref in self.references
            for n, kind in enumerate(ref.view.eligible, 1)
        ]
        self.add(MATRIX, ELIG_TYPES, cells)

    def _inputs(self, name: str, column: str) -> At:
        return At(INPUTS, INSTRUMENTS, name, column)

    def _eligible(self, name: str, ref: _Reference) -> None:
        view = ref.view
        types = Span(
            tuple(
                At(MATRIX, ELIG_TYPES, view.name, f"Type {n}")
                for n in range(1, len(view.eligible) + 1)
            )
        )
        d = _Draft()
        kind = d(self._inputs(name, "Type"))
        template = f'=IF({kind}="","",IF(COUNTIF({d(types)},{kind})>0,1,0))'
        at = At(MATRIX, ELIGIBLE, name, view.name)
        self.add(MATRIX, ELIGIBLE, [self.formula(at, d, template)])

    def _median(self, name: str, ref: _Reference) -> None:
        d = _Draft()
        kind, bucket = d(self._inputs(name, "Type")), d(self._inputs(name, "Rating bucket"))
        unit = d(At(INPUTS, REFERENCE_UNIT, ref.view.name, "Unit"))
        eligible = d(At(MATRIX, ELIGIBLE, name, ref.view.name))
        median, count = "", ""
        for pair in reversed(ref.pairs):
            same = f'AND({kind}="{pair.asset}",{bucket}="{pair.bucket}")'
            median = f"IF({same},{d(pair.median)},{median or EMPTY})"
            count = f"IF({same},{d(pair.names)},{count or EMPTY})"
        known = f'OR({unit}="{UNITS[1]}",{unit}="{UNITS[0]}")'
        template = (
            f'=IF({eligible}<>1,"",IF(OR({bucket}="",NOT({known})),"",'
            f"IF(N({count})>={MIN_NAMES_TEXT},"
            f'{median}*IF({unit}="{UNITS[1]}",100,1),"")))'
        )
        at = At(MATRIX, MEDIAN_BP, name, ref.view.name)
        self.add(MATRIX, MEDIAN_BP, [self.formula(at, d, template)])

    def _difference(self, name: str, ref: _Reference) -> None:
        d = _Draft()
        level, price = d(self._inputs(name, "Level (bp)")), d(self._inputs(name, "Price"))
        median = d(At(MATRIX, MEDIAN_BP, name, ref.view.name))
        template = (
            f'=IF(OR({median}="",NOT(ISNUMBER({level})),NOT(ISNUMBER({price}))),"",'
            f"ROUND({level}-{median},6))"
        )
        at = At(MATRIX, DIFFERENCE, name, ref.view.name)
        self.add(MATRIX, DIFFERENCE, [self.formula(at, d, template)])

    def _valuation(self, name: str, ref: _Reference) -> None:
        d = _Draft()
        diff = d(At(MATRIX, DIFFERENCE, name, ref.view.name))
        one, two, four, five = (d(At(MATRIX, BANDS, n, "Difference (bp)")) for n, _ in BAND_EDGES)
        template = (
            f'=IF({diff}="","",IF({diff}>={one},1,IF({diff}>{two},2,'
            f"IF({diff}>={four},3,IF({diff}>{five},4,5)))))"
        )
        at = At(MATRIX, VALUATION, name, ref.view.name)
        self.add(MATRIX, VALUATION, [self.formula(at, d, template)])

    def _breach(self, name: str, ref: _Reference) -> None:
        d = _Draft()
        eligible = d(At(MATRIX, ELIGIBLE, name, ref.view.name))
        bucket, price = d(self._inputs(name, "Rating bucket")), d(self._inputs(name, "Price"))
        tests = []
        if ref.breached:
            tests.append("COUNTA(" + ",".join(d(cell) for cell in ref.breached) + ")>0")
        counts = [
            f'({bucket}="{word}")*COUNTIF({d(Span(cells))},"{snap.BREACHED}")'
            for word, cells in ref.rating.items()
        ]
        if counts:
            tests.append("+".join(counts) + ">0")
        if ref.floors:
            below = ",".join(f"{price}<{d(cell)}" for cell in ref.floors)
            tests.append(f"AND(ISNUMBER({price}),OR({below}))")
        found = f"IF(OR({','.join(tests)}),1,0)" if tests else "0"
        template = f'=IF({eligible}<>1,"",{found})'
        at = At(MATRIX, BREACH, name, ref.view.name)
        self.add(MATRIX, BREACH, [self.formula(at, d, template)])

    def _result(self, name: str, ref: _Reference) -> None:
        d = _Draft()
        score, value = d(self.score), d(At(MATRIX, VALUATION, name, ref.view.name))
        breach = d(At(MATRIX, BREACH, name, ref.view.name))
        table, cap = d(self.table()), d(At(MATRIX, CS_RULES, "Cap level", "Value"))
        cell = f"INDEX({table},{score},{value})"
        template = (
            f'=IF(OR({score}="",{value}=""),"",IF(AND({cell}<{cap},{breach}=1),{cap},{cell}))'
        )
        at = At(MATRIX, RESULT, name, ref.view.name)
        self.add(MATRIX, RESULT, [self.formula(at, d, template)])

    def _held(self, name: str, ref: _Reference) -> None:
        """Held by: the breached limits' names when this row's result was held to 3."""
        limits = _limits(ref)
        if not limits:
            return
        d = _Draft()
        score, value = d(self.score), d(At(MATRIX, VALUATION, name, ref.view.name))
        breach = d(At(MATRIX, BREACH, name, ref.view.name))
        table, cap = d(self.table()), d(At(MATRIX, CS_RULES, "Cap level", "Value"))
        cell = f"INDEX({table},{score},{value})"
        terms = "&".join(
            f'IF({d(At(MATRIX, LIMIT_HITS, name, _hit_column(ref, k)))}=1,"; "&'
            f'{d(At(MATRIX, LIMIT_NAMES, ref.view.name, f"Limit {k}"))},"")'
            for k in range(1, len(limits) + 1)
        )
        template = (
            f'=IF(OR({score}="",{value}=""),"",IF(AND({cell}<{cap},{breach}=1),'
            f'REPLACE({terms},1,2,""),""))'
        )
        at = At(MATRIX, HELD, name, ref.view.name)
        self.add(MATRIX, HELD, [self.formula(at, d, template)])

    def _limit_cells(self, ref: _Reference) -> None:
        """The cells that give each limit of the reference a name, a hit per instrument and a
        'holds some row at 3' flag, so Held by and Held to MW join short terms."""
        limits = _limits(ref)
        if not limits or not self.instruments:
            return
        name = ref.view.name
        names, hits, holds = [], [], []
        for k, limit in enumerate(limits, 1):
            names.append(self._limit_name(name, k, limit, len(name) + 3))
            hits += [self._limit_hit(n, ref, k, limit) for n in self.instruments]
            holds.append(self._limit_holds(ref, k))
        self.add(MATRIX, LIMIT_NAMES, names)
        self.add(MATRIX, LIMIT_HITS, hits)
        self.add(MATRIX, LIMITS_HOLD, holds)

    def _limit_name(self, name: str, k: int, limit: _Limit, cut: int) -> snap.SnapshotCell:
        """A sector's name is its own cell; a rating or floor row's is its Matrix label without the
        reference's name in front."""
        d = _Draft()
        if limit.label is not None:
            template = f'=REPLACE({d(limit.label)},1,{cut},"")'
        elif limit.cell is not None:
            cell = d(limit.cell)
            template = f'=IF({cell}="","",{cell})'
        else:
            raise ValueError(f"a limit with nothing to name: {limit}")
        return self.formula(At(MATRIX, LIMIT_NAMES, name, f"Limit {k}"), d, template)

    def _limit_hit(self, name: str, ref: _Reference, k: int, limit: _Limit) -> snap.SnapshotCell:
        """1 when this instrument row breaches this limit, else 0."""
        d = _Draft()
        if limit.kind == "sector" and limit.cell:
            template = f'=IF({d(limit.cell)}<>"",1,0)'
        elif limit.kind == "rating" and limit.by_bucket:
            bucket = d(self._inputs(name, "Rating bucket"))
            outcome = '""'
            for word in reversed(list(limit.by_bucket)):
                outcome = f'IF({bucket}="{word}",{d(limit.by_bucket[word])},{outcome})'
            template = f'=IF({outcome}="{snap.BREACHED}",1,0)'
        elif limit.cell:
            price = d(self._inputs(name, "Price"))
            template = f"=IF(AND(ISNUMBER({price}),{price}<{d(limit.cell)}),1,0)"
        else:
            raise ValueError(f"a limit with nothing to test: {limit}")
        return self.formula(At(MATRIX, LIMIT_HITS, name, _hit_column(ref, k)), d, template)

    def _limit_holds(self, ref: _Reference, k: int) -> snap.SnapshotCell:
        """1 when some instrument row of the reference at the cap breaches limit k."""
        d = _Draft()
        shape = (len(self.instruments), 1)
        results = d(
            Span(tuple(At(MATRIX, RESULT, n, ref.view.name) for n in self.instruments), shape)
        )
        hits = d(
            Span(
                tuple(At(MATRIX, LIMIT_HITS, n, _hit_column(ref, k)) for n in self.instruments),
                shape,
            )
        )
        cap = d(At(MATRIX, CS_RULES, "Cap level", "Value"))
        template = f"=IF(SUMPRODUCT(({results}={cap})*({hits}=1))>0,1,0)"
        return self.formula(At(MATRIX, LIMITS_HOLD, ref.view.name, f"Limit {k}"), d, template)

    # -- per portfolio

    def portfolios(self) -> None:
        cells = []
        for ref in self.references:
            at = At(MATRIX, PORTFOLIO, ref.view.name, "Result")
            d = _Draft()
            if not self.instruments:
                cells.append(self.formula(at, d, f"={EMPTY}"))  # no instrument read: not n/a (PM-e)
                continue
            eligible = d(
                Span(tuple(At(MATRIX, ELIGIBLE, n, ref.view.name) for n in self.instruments))
            )
            none = f'IF(SUM({eligible})=0,IF(COUNT({eligible})=ROWS({eligible}),"n/a",""),'
            if ref.pairs:
                results = d(
                    Span(tuple(At(MATRIX, RESULT, n, ref.view.name) for n in self.instruments))
                )
                template = (
                    f'={none}IF(OR({d(self.score)}="",COUNT({results})=0),"",MIN({results})))'
                )
            else:
                template = f'={none}"")'
            cells.append(self.formula(at, d, template))
        self.add(MATRIX, PORTFOLIO, cells)

    def recommendations(self) -> None:
        names = self.names("Recommendation")
        cells = []
        for ref in self.references:
            row = ref.view.name
            result = At(MATRIX, PORTFOLIO, row, "Result")
            proposed = At(SNAPSHOT, RECOMMENDATION, row, "Proposed")
            view = At(SNAPSHOT, RECOMMENDATION, row, "Analyst view")
            shown = At(SNAPSHOT, RECOMMENDATION, row, RECOMMENDATION)
            confirm = At(SNAPSHOT, RECOMMENDATION, row, "Confirm")
            d = _Draft()
            cells.append(self.formula(shown, d, f'=IF({d(view)}<>"",{d(view)},{d(proposed)})'))
            d = _Draft()
            tag = (
                f'IF({d(shown)}="","",IF({d(shown)}="n/a","",'
                f'IF({d(confirm)}<>"","confirmed","proposed")))'
            )
            cells.append(self.formula(At(SNAPSHOT, RECOMMENDATION, row, "Status"), d, f"={tag}"))
            d = _Draft()
            template = f"=IF(ISNUMBER({d(result)}),INDEX({d(names)},{d(result)}),{d(result)})"
            cells.append(self.formula(proposed, d, template))
            cells += self._held_to_mw(ref)
            cells += [self.analyst(view), self.analyst(confirm)]
            weight = At(MATRIX, "Issuer weight", row, "Weight (%)")
            if weight in self.held:
                d = _Draft()
                cells.append(
                    self.formula(
                        At(SNAPSHOT, RECOMMENDATION, row, "Weight (%)"), d, f"={d(weight)}"
                    )
                )
        self.add(SNAPSHOT, RECOMMENDATION, cells)
        self.dropdown(SNAPSHOT, RECOMMENDATION, "Analyst view", names)
        self.chips.append((SNAPSHOT, RECOMMENDATION, RECOMMENDATION))

    def _held_to_mw(self, ref: _Reference) -> list[snap.SnapshotCell]:
        """Held to MW: the limits that hold the portfolio's result at 3, named when the result is 3
        and no eligible row gives 3 uncapped; else blank."""
        name = ref.view.name
        if not (self.instruments and ref.pairs):
            return []
        held = tuple(At(MATRIX, HELD, n, name) for n in self.instruments)
        if not all(at in self.held for at in held):
            return []
        d = _Draft()
        result, cap = (
            d(At(MATRIX, PORTFOLIO, name, "Result")),
            d(At(MATRIX, CS_RULES, "Cap level", "Value")),
        )
        results = d(Span(tuple(At(MATRIX, RESULT, n, name) for n in self.instruments)))
        held_by = d(Span(held))
        terms = "&".join(
            f'IF({d(At(MATRIX, LIMITS_HOLD, name, f"Limit {k}"))}=1,"; "&'
            f'{d(At(MATRIX, LIMIT_NAMES, name, f"Limit {k}"))},"")'
            for k in range(1, len(_limits(ref)) + 1)
        )
        none_open = f'SUMPRODUCT(({results}={cap})*({held_by}=""))=0'
        template = f'=IF({result}={cap},IF({none_open},REPLACE({terms},1,2,""),""),"")'
        return [self.formula(At(SNAPSHOT, RECOMMENDATION, name, HELD_TO), d, template)]

    # -- capital structure

    def capital_structure(self) -> None:
        rows = _rows(self._cells(SNAPSHOT, CAPITAL))
        if not rows:
            return
        periods = self._enterprise_value()
        cells = [self._share_of_ev(row) for row in rows] if periods else []
        proposals = [
            self._proposal(name, row) for name, row in zip(self.instruments, rows, strict=True)
        ]
        extra = [c for p in proposals if p is not None for c in p]
        self.add(SNAPSHOT, CAPITAL, extra + cells)
        if extra:
            self.dropdown(SNAPSHOT, CAPITAL, PROPOSED_COLUMN, self.names("Recommendation"))
            self.chips.append((SNAPSHOT, CAPITAL, PROPOSED_COLUMN))

    def _periods(self, block: str, row: str) -> dict[str, At]:
        """The cells of a row of a block by period label (the part of the column before ` / `)."""
        return {
            c.column.split(" / ")[0]: _at(c)
            for c in self._cells(SNAPSHOT, block)
            if c.row == row and c.column not in TAIL_COLUMNS and c.kind != snap.GAP
        }

    def _enterprise_value(self) -> list[str]:
        """EV: the equity value plus the chosen period's Net debt, else the EV multiple times that
        period's reported EBITDA. The period is a yellow dropdown over the periods the handoff's
        Net debt and EBITDA rows hold. Returns those periods (none: no EV is built)."""
        debt, ebitda = (
            self._periods(TOTALS, "Net debt"),
            self._periods(MEASURES, "EBITDA (Reported)"),
        )
        labels = list(dict.fromkeys([*debt, *ebitda]))
        if not labels:
            return []
        d = _Draft()
        equity = d(At(SNAPSHOT, EQUITY, "Equity value", "Value"))
        multiple = d(At(SNAPSHOT, EQUITY, "EV multiple", "Value"))
        period = d(At(SNAPSHOT, EQUITY, "EV period", "Value"))

        def pick(cells: dict[str, At], use: str) -> str:
            out = '""'
            for label in reversed(labels):
                if label in cells:
                    cell = d(cells[label])
                    quoted = label.replace('"', '""')  # a string literal doubles its quotes
                    out = (
                        f'IF({period}="{quoted}",IF(ISNUMBER({cell}),{use.format(cell)},""),{out})'
                    )
            return out

        added = pick(debt, equity + "+{}")
        times = pick(ebitda, multiple + "*{}")
        template = (
            f'=IF({period}="","",IF(ISNUMBER({equity}),{added},'
            f'IF(ISNUMBER({multiple}),{times},"")))'
        )
        at = At(SNAPSHOT, EQUITY, "Enterprise value", "Value")
        extra = [
            self.formula(at, d, template, "#,##0.0"),
            self.analyst(At(SNAPSHOT, EQUITY, "EV period", "Value")),
            self.analyst(At(SNAPSHOT, EQUITY, "EV currency", "Value")),
        ]
        self.add(SNAPSHOT, EQUITY, extra)
        if _listable(labels):
            self.dropdown(SNAPSHOT, EQUITY, "Value", tuple(labels), "EV period")
        else:
            _LOG.warning(
                "credit snapshot: the EV period has no dropdown: a period label holds a comma or "
                "a double quote, or the list is over %s characters",
                MAX_LIST_TEXT,
            )
        return labels

    def _share_of_ev(self, row: str) -> snap.SnapshotCell:
        d = _Draft()
        principal = d(At(SNAPSHOT, CAPITAL, row, "Principal"))
        value = d(At(SNAPSHOT, EQUITY, "Enterprise value", "Value"))
        own, stated = (
            d(At(SNAPSHOT, CAPITAL, row, "Currency")),
            d(At(SNAPSHOT, EQUITY, "EV currency", "Value")),
        )
        template = (
            f"=IF(AND(ISNUMBER({principal}),ISNUMBER({value}),{own}={stated}),"
            f'IF({value}>0,{principal}/{value},""),"")'
        )
        return self.formula(At(SNAPSHOT, CAPITAL, row, PERCENT_EV), d, template, "0.0%")

    def _index(self, kind: str) -> _Reference | None:
        return next((r for r in self.references if r.view.kind == kind and r.pairs), None)

    def _proposal(self, name: str, row: str) -> list[snap.SnapshotCell] | None:
        loans, bonds = self._index("loan_index"), self._index("hy_index")
        if loans is None and bonds is None:
            return None
        d = _Draft()
        score, kind = d(self.score), d(self._inputs(name, "Type"))
        table, names = d(self.table()), d(self.names("Recommendation"))

        template = '""'
        for ref, word in ((bonds, "bond"), (loans, "loan")):
            if ref is None:
                continue
            value = d(At(MATRIX, VALUATION, name, ref.view.name))
            read = f'IF({value}="","",INDEX({names},INDEX({table},{score},{value})))'
            template = f'IF({kind}="{word}",{read},{template})'
        template = f'=IF({score}="","",{template})'
        proposal = At(SNAPSHOT, CAPITAL, row, PROPOSED_COLUMN)
        confirm = At(SNAPSHOT, CAPITAL, row, "Confirm")
        d2 = _Draft()
        tag = f'=IF({d2(proposal)}="","",IF({d2(confirm)}<>"","confirmed","proposed"))'
        return [
            self.formula(proposal, d, template),
            self.formula(At(SNAPSHOT, CAPITAL, row, "Status"), d2, tag),
            self.analyst(confirm),
        ]

    # -- relative value

    def relative_value(self) -> None:
        for block, word, index in (
            (RV_LOANS, "loan", self._index("loan_index")),
            (RV_BONDS, "bond", self._index("hy_index")),
        ):
            cells = [
                *self._index_row(block),
                *(c for name in self.instruments for c in self._rv_row(block, word, index, name)),
                *self._peer_rows(block),
            ]
            self.add(SNAPSHOT, block, cells)

    def _index_row(self, block: str) -> list[snap.SnapshotCell]:
        """The index row: its label and one analyst cell for each figure the analyst reads off the
        index (ruling PM-c)."""
        cells = [_label(SNAPSHOT, block, INDEX_ROW, "Instrument", INDEX_ROW)]
        cells += [self.analyst(At(SNAPSHOT, block, INDEX_ROW, c)) for c in INDEX_COLUMNS]
        return cells

    def _peer_rows(self, block: str) -> list[snap.SnapshotCell]:
        """One row per peer of the Peers block, in its order: the instrument cell draws that peer's
        issuer cell, the rest are analyst cells. No peers listed, no rows."""
        peers = [c for c in self._cells(SNAPSHOT, PEERS) if c.column == PEER_ISSUER]
        cells = []
        for peer in peers:
            d = _Draft()
            cells.append(
                self.formula(At(SNAPSHOT, block, peer.row, "Instrument"), d, f"={d(_at(peer))}")
            )
            cells += [self.analyst(At(SNAPSHOT, block, peer.row, c)) for c in PEER_COLUMNS]
        return cells

    def _rv_row(
        self, block: str, word: str, index: _Reference | None, name: str
    ) -> list[snap.SnapshotCell]:
        columns = [("Instrument", "Instrument")] + [
            (c, c)
            for c in ("Rating bucket", "Level (bp)", "Price", "FIGI", "Facility rating")
            + ("Bid", "Ask", "1M move", "YTD move")
        ]
        cells = []
        for column, source in columns:
            d = _Draft()
            kind, value = d(self._inputs(name, "Type")), d(self._inputs(name, source))
            guard = value if source == "Instrument" else f'IF({value}="","",{value})'
            template = f'=IF({kind}="{word}",{guard},"")'
            cells.append(self.formula(At(SNAPSHOT, block, name, column), d, template))
        if index is not None:
            for column, source in (("Index median (bp)", MEDIAN_BP), ("Valuation", VALUATION)):
                d = _Draft()
                kind = d(self._inputs(name, "Type"))
                value = d(At(MATRIX, source, name, index.view.name))
                template = f'=IF({kind}="{word}",{value},"")'
                cells.append(self.formula(At(SNAPSHOT, block, name, column), d, template))
        return cells

    # -- key figures

    def key_figures(self) -> None:
        self.add(
            SNAPSHOT, KEY_FIGURES, [*self._score_tile(), *self._valuation_tile(), *self._tiles()]
        )

    def _tile(self, row: str, tile: str) -> At:
        return At(SNAPSHOT, KEY_FIGURES, row, tile)

    def _score_tile(self) -> list[snap.SnapshotCell]:
        d = _Draft()
        score = d(self.score)
        value = self.formula(
            self._tile("Value", "Credit Score"), d, f'=IF({score}="","",{score})', "0"
        )
        d = _Draft()
        reading = (
            f'=IF({d(self.score)}="","",INDEX({d(self.names("Credit Score"))},{d(self.score)}))'
        )
        cells = [value, self.formula(self._tile("Reading", "Credit Score"), d, reading)]
        direction = At(SNAPSHOT, ASSESSMENTS_BLOCK, "Credit Direction", "View")
        if direction in self.held:
            d = _Draft()
            view = d(direction)
            arrows = '""'
            for word in reversed(ASSESSMENTS["Credit Direction"]):
                arrows = f'IF({view}="{word}","{ARROWS[word]}",{arrows})'
            cells.append(self.formula(self._tile("Direction", "Credit Score"), d, f"={arrows}"))
        return cells

    def _valuation_tile(self) -> list[snap.SnapshotCell]:
        cells = tuple(
            At(MATRIX, VALUATION, n, r.view.name)
            for r in self.references
            if r.pairs
            for n in self.instruments
        )
        if not cells:
            return []
        d = _Draft()
        box, names = d(Span(cells)), self.names("Valuation").cells
        value = self.formula(
            self._tile("Value", "Valuation"), d, f'=IF(COUNT({box})=0,"",MIN({box}))', "0"
        )
        d = _Draft()
        best = f'IF(COUNT({d(Span(cells))})=0,"",MIN({d(Span(cells))}))'
        low, high = d(names[0]), d(names[-1])
        reading = f'=IF({best}=1,{low},IF({best}={WORST_LEVEL},{high},""))'
        return [value, self.formula(self._tile("Reading", "Valuation"), d, reading)]

    def _tiles(self) -> list[snap.SnapshotCell]:
        """Leverage, cover and liquidity, all at one period: the latest by the end date the
        period's own label states (`FY2024 / 2024-09-30`). A period with no readable end date
        leaves its order unknown, so every tile shows that as a gap."""
        wanted = (
            ("Net leverage", "Net debt / EBITDA"),
            ("Interest cover", "EBITDA / cash interest"),
            ("Liquidity", "Cash"),
        )
        totals = [
            c
            for c in self._cells(SNAPSHOT, TOTALS)
            if c.column not in TAIL_COLUMNS and c.kind != snap.GAP
        ]
        sources = {tile: [c for c in totals if c.row == row] for tile, row in wanted}
        ends = {c.column: _period_end(c.column) for found in sources.values() for c in found}
        unordered = None in ends.values()
        latest = max((e for e in ends.values() if e is not None), default=None)
        cells: list[snap.SnapshotCell] = []
        for tile, row in wanted:
            at = self._tile("Value", tile)
            use = [c for c in sources[tile] if ends[c.column] == latest]
            if unordered or not use:
                cells.append(_gap(at, NO_ORDER if unordered else snap.NOT_IN_HANDOFF))
                continue
            there, d = _at(use[0]), _Draft()
            cells.append(self.formula(at, d, f"={d(there)}", mirror=there))
            cells.append(_label(SNAPSHOT, KEY_FIGURES, "Reading", tile, f"{row}, {use[0].column}"))
        return cells

    # -- the unit and the dropdowns that are fixed words

    def fixed_lists(self) -> None:
        self.dropdown(INPUTS, INSTRUMENTS, "Type", TYPES)
        self.dropdown(INPUTS, INSTRUMENTS, "Rating bucket", rp.BUCKET_NAMES)
        self.dropdown(INPUTS, REFERENCE_UNIT, "Unit", UNITS)


def extend(snapshot: snap.Snapshot, found: Mapping[tuple[str, str], snap.Block]) -> Plan:
    """`found` plus everything the recommendation side adds, and how to resolve it."""
    build = _Builder(snapshot, dict(found))
    build.constants()
    build.credit_score()
    build.grid()
    build.portfolios()
    build.recommendations()
    build.capital_structure()
    build.relative_value()
    build.key_figures()
    build.fixed_lists()
    return Plan(build.found, tuple(build.formulas), tuple(build.dropdowns), tuple(build.chips))


__all__ = ["Plan", "extend", "resolve"]
