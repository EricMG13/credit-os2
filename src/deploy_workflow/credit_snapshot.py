"""The Credit Snapshot workbook's reading side: a verified finished run, every block the workbook
shows, and where each cell came from. Imports no spreadsheet library; the writer is
`credit_snapshot_workbook`.

`load_run` takes a run folder through `library_index` (the completion record, the verified
delivery, hash-checked reads) and returns a `SnapshotRun`: the issuer, date, pathway and run id
from the hash-pinned delivery manifest, each handoff's verified bytes, the run's pinned context and
the reference portfolios. `gather` is pure: a `SnapshotRun` in, a `Snapshot` out, every cell one of
six kinds.

- copied: the handoff's own text, exactly, with the module, section and 1-based physical line
  (`handoff_delivery.physical_lines`) it came from. A blank cell is not copied; it is a gap.
- gap: what is missing, in reader words (`not in handoff` for a field the handoff does not have).
  Missing is never zero or blank.
- computed: a value `recommendation.py` or `reference_portfolios.py` returned, a ruled
  classification below, or EBITDA bridge arithmetic from its stated signed amounts. Also handoff
  as the reader sheets draw it when that differs from the handoff's own (a module code drawn as the
  module's name, a source reference left out): the exact text is kept in `written`, on Sources.
- entered at run start: text the analyst entered in the run's context, or the run record.
- analyst: a blank cell for the analyst; the workbook paints it yellow.
- blank: an empty cell that is not for the analyst and has no Sources row (a joined instrument's
  FIGI or Bloomberg ID the run's RV worksheet does not hold; the owner's rule, plan Amendment 2).

A malformed or missing block is that block's gap with the reason, logged (`logging`, warning). That
is the one fail-open: it keeps one bad table from hiding the rest of the page, and it never turns
into a zero or a blank. Anything that is not malformed handoff content (a bug, a refused run)
propagates.

Registers are found as the launcher finds them (`method_scripts._register_start`: a heading that
starts with the id, the id in bold or backticks, or a `<!-- table-id: -->` tag ending in it) and
read with `handoff_delivery.table`, so cell text is exact. Prose sections are read with
`handoff_delivery.section`. Two classifications are ruled here, both of CP-1 bridge steps:
`realised` / `unrealised` against CP-1D, and `unclassified` otherwise. The bridge's signed
aggregates are the sole arithmetic this adapter adds.
"""

from __future__ import annotations

import csv
import io
import logging
import re
from collections import Counter
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field, replace
from datetime import date, datetime
from decimal import Decimal, localcontext
from pathlib import Path
from typing import Literal

from deploy_vii.context import ContextRefused, RunContext, load_context
from deploy_vii.inputs import portfolio_export as pe
from deploy_workflow import credit_os_chips as chips
from deploy_workflow import handoff_delivery as hd
from deploy_workflow import library_index as li
from deploy_workflow import recommendation as rec
from deploy_workflow import reference_portfolios as rp
from deploy_workflow.cp2_scorecard import (
    ASSESSMENTS,
    FACTORS,
    NOT_ASSESSED,
    NOT_SCORED,
    Scorecard,
    ScorecardError,
    parse_scorecard,
)
from deploy_workflow.credit_os_catalogue import pathway_title, period_order
from deploy_workflow.method_scripts import _register_start, currency_of, scale_of
from deploy_workflow.owners.cpos_cp1_check import (
    METRICS,
    NET_DEBT_COLUMNS,
    asset_type_columns,
    stated_asset_type,
)
from deploy_workflow.owners.cpos_cp1_statements import STATEMENTS, StatementSpec

_LOG = logging.getLogger(__name__)

COPIED, GAP, COMPUTED, ENTERED, ANALYST, BLANK = (
    "copied",
    "gap",
    "computed",
    "entered at run start",
    "analyst",
    "blank",
)
NOT_IN_HANDOFF = "not in handoff"
BREACHED = "breached"  # a limit outcome, and the word the Matrix counts
CONTROL_CHARACTER = "text holds a control character"
# Excel's restricted controls plus code points excluded from XML 1.0 character data.
ILLEGAL = re.compile(r"[\000-\010\013-\014\016-\037\ud800-\udfff\ufffe\uffff]")
NEEDS_ADD_BACK_IDS = "needs add-back ids in the bridge"
BRIDGE_SCOPE_UNKNOWN = "bridge opening and closing amounts do not establish an empty bridge"
BRIDGE_RECONCILIATION_GAP = "bridge boundaries or signed amounts do not reconcile"
NO_REFERENCE = "no reference stored"
NOT_HELD = "not held / not matched"
HELD_NO_WEIGHT = "held, weight not stated"
NO_PEERS = "no peers named"
CONTEXT_UNREAD = "The run's inputs at run start could not be read."
UNCLASSIFIED = "unclassified"
RV_MODULE = "RV worksheet"
NO_MARKET = "no market data sheet supplied"
NO_MARKET_ROWS = "no rows for this issuer in the market data sheet"
MARKET_COLUMNS = (
    *("Company", "Borrower Name", "Bloomberg ID", "FIGI", "Loan Type"),
    *("Ranking", "Size ($Mn)", "Margin", "Maturity"),
)
IDENTIFIERS = ("FIGI", "Bloomberg ID")

# --- The number rule -----------------------------------------------------------------------------

MAX_DIGITS = 15  # a double holds 15 significant decimal digits exactly
_PLAIN = re.compile(r"-?(?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.[0-9]+)?", re.ASCII)


@dataclass(frozen=True)
class Figure:
    """A cell text the number rule accepts: the stored value and the number format that shows its
    decimals (and its thousands commas, when the text had them). Brackets for negatives are the
    writer's display choice; they are not in this format."""

    value: int | float
    number_format: str


def figure(text: str) -> Figure | None:
    """The cell as a number, or None when it must stay text. A figure is a number only when it is a
    plain decimal: an optional minus sign, digits (thousands commas in the 1,234 form), optional
    decimals, no leading zeros, at most 15 significant digits, and not a negative zero. Units,
    `x`, `%`, brackets, ranges, footnote marks, dashes, spaces and anything longer stay text. The
    stored double, written through `"%.16g"` and read back, is equal to the handoff's decimal, and
    it renders to the handoff's digits through `number_format`."""
    if _PLAIN.fullmatch(text) is None:
        return None
    plain = text.replace(",", "")
    whole, point, fraction = plain.partition(".")
    digits = (whole.removeprefix("-") + fraction).lstrip("0")
    if len(digits) > MAX_DIGITS or (plain.startswith("-") and not digits):
        return None
    value = float(plain) if point else int(plain)
    return Figure(
        value, ("#,##0" if "," in text else "0") + (f".{'0' * len(fraction)}" if point else "")
    )


# --- Reader text ---------------------------------------------------------------------------------

# A port of `readerText` (web/src/pages/connected/publishedReport.ts, ruling PM-b): the findings
# pages' rule for a module code in module-written text. Its literal cases are held in
# tests/test_credit_snapshot.py. File names and page locators stay as written.
UNNAMED_MODULE = "Unnamed module"
# The methodology's module codes that have no reader name (web/src/pages/connected/api.ts
# `UNNAMED_CODES`): drawn as `UNNAMED_MODULE`, never as the code.
UNNAMED_CODES = frozenset(
    {*("CP-MEMO", "CP-OS", "CP-PARSE", "CP-1E", "CP-2B", "CP-2C", "CP-2F", "CP-3A", "CP-3B")}
    | {*("CP-4A", "CP-4B", "CP-4D", "CP-5A", "CP-6A", "CP-L20", "CP-L23", "CP-L30", "CP-L40")}
)
_FLAGS = re.IGNORECASE | re.ASCII
_FILE_EXTENSIONS = "jsonl?|x?html?|xml|pdf|docx?|xlsx?|xlsm|csv|tsv|pptx?|txt|md|zip"
# A file name ahead before the next ";", ",", "|" or line end: the code belongs to a stored name.
_FILE_AHEAD = re.compile(rf"[^;,|\n]*\.(?:{_FILE_EXTENSIONS})\b", _FLAGS)
# A standalone run of module codes ("CP-1" or "CP-1/CP-2"): nothing path-like or word-like
# touches it.
_STANDALONE_CODES = re.compile(
    r"(?<![\w\-\\/.])CP-[A-Z0-9]+(?:/CP-[A-Z0-9]+)*(?![\w\-\\/])(?!\.[A-Za-z])", _FLAGS
)
_BRACKETED_CODE = re.compile(r" \((CP-[A-Za-z0-9]+)\)", _FLAGS)
_CODE = re.compile(r"CP-[A-Z0-9]+", _FLAGS)


def _name_of_code(code: str, names: Mapping[str, str]) -> str:
    upper = code.upper()
    return names.get(upper) or (UNNAMED_MODULE if upper in UNNAMED_CODES else code)


def reader_text(text: str, names: Mapping[str, str]) -> str:
    """Module-written text as the reader pages draw it. A " (CP-x)" right after that module's own
    name is dropped; after any other words it becomes " (<module name>)" (an unknown code stays);
    then each standalone known code becomes the module's name. A code inside a stored file name
    stays; a lower-case code reads as the upper-case one. `names` is
    `credit_os_chips.module_names(pathway)`."""

    def bracketed(found: re.Match[str]) -> str:
        name = _name_of_code(found[1], names)
        if name == found[1] or _FILE_AHEAD.match(text[found.end() :]):
            return found[0]
        return "" if text[: found.start()].lower().endswith(name.lower()) else f" ({name})"

    first = _BRACKETED_CODE.sub(bracketed, text)

    def standalone(found: re.Match[str]) -> str:
        run, at = found[0], found.start()
        after = first[found.end() : found.end() + 1]
        kept = first[:at].endswith(" (") and after == ")"
        if kept and _FILE_AHEAD.match(first[found.end() + 1 :]):
            return run
        return _CODE.sub(lambda code: _name_of_code(code[0], names), run)

    return _STANDALONE_CODES.sub(standalone, first)


# --- Source references in text (ruling PM-k) ---------------------------------------------------

# A port of `containsReference` and `withoutReferences`
# (web/src/pages/connected/publishedReport.ts):
# the findings pages draw a cell's own words and move its source reference to Evidence. The cases
# of the web tests are held, as literals, in tests/test_credit_snapshot.py.
SOURCE_REFERENCE = "Source reference: see Sources"
_FILE_REFERENCE = re.compile(
    rf"(?<![\w.-])[\w-]+(?:\.[\w-]+)*\.(?:{_FILE_EXTENSIONS})\b", re.IGNORECASE | re.ASCII
)
_LONG_HASH = re.compile(r"\b(?=[0-9a-f]*[a-f])[0-9a-f]{32,}\b", _FLAGS)
_ADDRESS_REFERENCE = re.compile(
    r"(?:\b[a-z][a-z0-9+.-]*://|[a-z]:/\S|\bwww\.|"
    r"(?:^|[\s(`\"':])(?:(?:~|\.{1,2})/\S|/{1,2}[^\s/]+/\S|[a-z]:\\\S|\\\\\S))",
    _FLAGS,
)
_REGISTER_ID = re.compile(
    r"\bCP-[A-Z0-9]+-(?:GAP|MON|FACT|CALC|EVID|SRC|ASSUMPTION)-[A-Z0-9-]+\b", _FLAGS
)
_GAP_ID = re.compile(r"∅\s*\[?G\d+\b", re.ASCII)
_RUN_CODE = re.compile(r"\b\d{8}-\d{6}-\d{2}\b", re.ASCII)
_REGISTER_CODE_IN_TEXT = re.compile(
    r"\bCP-[A-Z0-9]+ T[A-Z0-9]{0,4}\.\d+(?:\.\d+)?\b|\bcalculations? R\d+\b|\bscenario S\d{2}\b",
    re.ASCII,
)
_LETTER = r"[^\W\d_]"  # JavaScript's \p{L}
_PAREN_GAP = re.compile(r"\(G\d+\)", _FLAGS)
_NAMED_LABEL = re.compile(
    rf"(?:\bgroup of {_LETTER}+(?:-{_LETTER}+)?|\b(?:economies|currencies)"
    r"|\b(?:series|class|gen|tranche)\s+[\w-]+(?:\s+[\w-]+)?)\s*$",
    re.IGNORECASE,
)
_DEFINED_AFTER = re.compile(r"\s*(?:=|equals?\b)", _FLAGS)
_DEFINED_BEFORE = re.compile(r"(?:^|[,;:=]|\b(?:is|equals?))\s*\d+(?:\.\d+)?x\s*$", _FLAGS)
_PAGE = re.compile(r"(?<![\w&.-])(p|pg|pp|pages?)\.?(?u:\s*)(:(?u:\s*))?(\d+)\b", _FLAGS)
_PAGE_CUE = re.compile(r"\b(?:see|at|on|as)(?u:\s*)$", _FLAGS)
_PP_QUANTITY_AFTER = re.compile(
    rf"\s+(?:{_LETTER}+(?:-{_LETTER}+)*\s+)*(?:days?|weeks?|months?|quarters?|years?)\b",
    re.IGNORECASE,
)
_SENTENCE_BREAK = re.compile(r"(?<=[.!?])(?<!\bp\.)(?<!\bpp\.)\s+(?=[A-Z])")


def _parenthesized_gap(text: str) -> bool:
    for found in _PAREN_GAP.finditer(text):
        before, after = text[: found.start()], text[found.end() :]
        defined = _DEFINED_AFTER.match(after) or _DEFINED_BEFORE.search(before)
        if not _NAMED_LABEL.search(before) and not defined:
            return True
    return False


def _page_citation(text: str) -> bool:
    for found in _PAGE.finditer(text):
        before, after = text[: found.start()], text[found.end() :]
        marker = found[1].lower()
        if found[2] or _PAGE_CUE.search(before):
            return True
        if marker == "pp":
            if re.search(r"\d\s*$", before):
                continue
            if re.search(rf"{_LETTER}\s*$", before) and _PP_QUANTITY_AFTER.match(after):
                continue
        if not (marker == "page" and re.search(r"\bfront\s+$", before, re.IGNORECASE)):
            return True
    return False


def contains_reference(text: str) -> bool:
    """Whether `text` holds a source reference: a file name, an address, a long hash, a register or
    gap id, a register code in a sentence, a page locator or a run code."""
    return (
        any(
            p.search(text)
            for p in (
                _FILE_REFERENCE,
                _ADDRESS_REFERENCE,
                _LONG_HASH,
                _REGISTER_ID,
                _GAP_ID,
            )
        )
        or _parenthesized_gap(text)
        or bool(_REGISTER_CODE_IN_TEXT.search(text))
        or _page_citation(text)
        or bool(_RUN_CODE.search(text))
    )


def without_references(text: str) -> str:
    """What a cell says besides its sources: its sentences that cite none, in order. Empty when
    every sentence cites."""
    parts = _SENTENCE_BREAK.split(text)
    return " ".join(part for part in parts if not contains_reference(part)).strip()


def drawn_text(text: str, names: Mapping[str, str]) -> str:
    """Copied module text as the reader sheets draw it: the cell's own words without any source
    reference, module codes as module names; `SOURCE_REFERENCE` when no words are left."""
    if not contains_reference(text):
        return reader_text(text, names)
    words = without_references(text)
    return reader_text(words, names) if words else SOURCE_REFERENCE


# --- The data model -----------------------------------------------------------------------------


type _RowKey = tuple[str, str, int]


@dataclass(frozen=True)
class SnapshotCell:
    """One item the workbook shows. `block`, `row` and `column` are the key's vocabulary
    (`tests/fixtures/credit_snapshot/expected_workings.md`); `sheet` says where the block lives.
    A copied cell (and a gap for a blank handoff cell) carries `module`, `section` and the 1-based
    `line` of its handoff. `basis` is the same row's Basis cell, exactly, for a scorecard or
    assessment cell: the writer's cell comment, never a cell. `written` is the handoff's exact text
    of a scorecard level or assessment view that is not the plain value `cp2_scorecard` read
    (`**5**`) or of module text that named a module by its code: the cell then holds the parsed or
    reader value, as computed, and `written` is kept on Sources. On a gap, `written` is the
    technical reason the table could not be read (Sources only). The Model's optional row key
    holds the add-back ID, unit and occurrence within a period. The displayed label stays as
    written."""

    sheet: str
    block: str
    row: str
    column: str
    kind: str
    text: str
    module: str | None = None
    section: str | None = None
    line: int | None = None
    basis: str | None = None
    written: str | None = None
    number_format: str | None = None
    row_key: _RowKey | None = None

    @property
    def figure(self) -> Figure | None:
        """The number rule applied to this cell's text; None for a gap or an analyst cell."""
        return figure(self.text) if self.kind in (COPIED, COMPUTED, ENTERED) else None


@dataclass(frozen=True)
class Block:
    sheet: str
    name: str
    cells: tuple[SnapshotCell, ...]


@dataclass(frozen=True)
class BasisLine:
    """A `Basis:` line of a prose section, exactly, kept for Sources beside the paragraph `row`
    (a row of `block`) it follows. It is never a cell of Snapshot, Inputs or Matrix."""

    module: str
    section: str
    line: int
    text: str
    row: str
    block: str


@dataclass(frozen=True)
class ContextGap:
    """The run's pinned context could not be trusted or read: why, in reader words."""

    reason: str


@dataclass(frozen=True)
class StoreGap:
    """A stored reference portfolio that cannot be read: the store's own sentence."""

    reason: str


@dataclass(frozen=True)
class MarketRow:
    """One data row of a supplied RV worksheet: its 1-based row number in the sheet (the record
    number of a CSV), the cells of `MARKET_COLUMNS` as entered, and the maturity as a date."""

    line: int
    cells: Mapping[str, str]
    maturity: date | None
    unreadable: bool = False


@dataclass(frozen=True)
class MarketSheet:
    """A supplied RV source, with its pinned file, selected worksheet title and data rows."""

    file: str
    sha256: str
    rows: tuple[MarketRow, ...]
    tab: str | None = None

    @property
    def section(self) -> str:
        return self.file if self.tab is None else f"{self.file} [worksheet {self.tab}]"


@dataclass(frozen=True)
class MarketGap:
    """The run's sources are not read (the workflow pin did not verify): why, logged."""

    reason: str


@dataclass(frozen=True)
class SnapshotRun:
    """A verified finished run, as `gather` needs it. `handoffs` are each module's verified bytes.
    `context` is the run's pinned context, None when the run pins none, or a `ContextGap`.
    `references` pairs each reference with its stored portfolio, None for "no reference stored",
    or a `StoreGap` for one that cannot be read."""

    issuer: str
    as_of: str
    pathway: str
    run_id: str
    handoffs: Mapping[str, bytes]
    context: RunContext | ContextGap | None
    references: Sequence[tuple[rp.Reference, rp.Portfolio | StoreGap | None]]
    market: tuple[MarketSheet, ...] | MarketGap = ()
    execution: Mapping[str, str] = field(default_factory=dict)  # module -> how it was answered
    model_files: Mapping[str, bytes] = field(default_factory=dict)


@dataclass(frozen=True)
class Median:
    """One reference portfolio's rating bucket for one asset type: the median level as stored
    (None when no position in the bucket has one), its distinct names, the measure and the header
    the file used for it, and whether it has too few names for a Valuation."""

    asset_type: str
    bucket: str
    median: Decimal | None
    names: int
    measure: str | None
    file_column: str | None
    under_five: bool


@dataclass(frozen=True)
class ReferenceView:
    """One reference as the Matrix shows it. `state` is stored, not stored or unreadable; `message`
    is then the gap sentence. Limit outcomes are read through `recommendation.read_limits` once with
    no bucket and no price (`breached`, `not_read`), once per rating bucket and once at a price
    floor's own value: `rating_limits` is (parameter, ((bucket, outcome words), ...)) and
    `price_floors` (parameter, floor). `kind` is the reference's kind and `eligible` the asset
    types an issuer's instruments can be read in against it (methodology section 7)."""

    key: str
    name: str
    state: Literal["stored", "not stored", "unreadable"]
    message: str
    as_of: str | None
    medians: tuple[Median, ...]
    weight: Decimal | None
    weight_gap: str
    breached: tuple[str, ...]
    not_read: tuple[str, ...]
    rating_limits: tuple[tuple[str, tuple[tuple[str, str], ...]], ...]
    price_floors: tuple[tuple[str, Decimal], ...]
    kind: str
    eligible: tuple[str, ...]


@dataclass(frozen=True)
class Snapshot:
    """Every block of the workbook, in sheet order, with the values the formulas need beside them:
    the scorecard as `cp2_scorecard` read it, `recommendation.credit_score` on it, each reference's
    medians and limit readings, and each handoff's sha256 for the Sources sheet."""

    issuer: str
    as_of: str
    pathway: str
    pathway_title: str
    run_id: str
    blocks: tuple[Block, ...]
    basis_lines: tuple[BasisLine, ...]
    handoff_sha256: Mapping[str, str]
    scorecard: Scorecard | None
    credit_score: rec.CreditScore | None
    references: tuple[ReferenceView, ...]
    source_sha256: Mapping[str, str] = field(default_factory=dict)
    model_files: Mapping[str, bytes] = field(default_factory=dict)
    model_handoffs: Mapping[str, bytes] = field(default_factory=dict)
    bridge_classifications: Mapping[str, _BridgeClassification] = field(default_factory=dict)

    def cells(self) -> Sequence[SnapshotCell]:
        return tuple(cell for block in self.blocks for cell in block.cells)


# --- Reading a handoff ----------------------------------------------------------------------------


class _Absent(Exception):
    """The block's module did not run in this run."""


class _Unreadable(ValueError):
    """Handoff content that is missing or malformed; becomes the block's gap. The message is the
    technical reason (logged, and kept on Sources); `module` is the handoff it was read from, so
    the gap can name that module in reader words."""

    def __init__(self, message: str, module: str | None = None) -> None:
        super().__init__(message)
        self.module = module


class _Said(ValueError):
    """As `_Unreadable`, but the message is already the whole gap sentence; `reason` is the
    technical reason, kept on Sources."""

    def __init__(self, message: str, reason: str | None = None) -> None:
        super().__init__(message)
        self.reason = reason


def _fold(text: str) -> str:
    """A label as compared: case and surrounding or repeated spaces ignored."""
    return " ".join(text.casefold().split())


def _name(cell: str) -> str:
    """As `cp2_scorecard` compares a factor's name: emphasis marks ignored as well."""
    return _fold(re.sub(r"[*_`]", "", cell))


@dataclass(frozen=True)
class _Row:
    line: int
    cells: tuple[str, ...]


@dataclass(frozen=True)
class _At:
    """Where in a handoff a value was read: its module, section and 1-based physical line."""

    module: str
    section: str
    line: int


@dataclass(frozen=True)
class _BridgeClassification:
    value: str
    at: _At | None = None
    unit: str | None = None


@dataclass(frozen=True)
class _BridgeLayout:
    table: _Table
    step: int
    amount: int
    unit: int
    id_index: int | None
    basis_index: int | None
    id_counts: Counter[str]


@dataclass(frozen=True)
class _Table:
    module: str
    section: str
    headers: tuple[str, ...]
    rows: tuple[_Row, ...]

    def at(self, line: int) -> _At:
        return _At(self.module, self.section, line)

    def index(self, name: str) -> int:
        if name in self.headers:
            return self.headers.index(name)
        folded = [_fold(header) for header in self.headers]
        if _fold(name) not in folded:
            raise _Unreadable(f"{self.section} has no `{name}` column", self.module)
        return folded.index(_fold(name))


@dataclass(frozen=True)
class _Doc:
    module: str
    lines: tuple[str, ...]  # physical lines, with comments and fenced code hidden
    text: str
    sha256: str
    error: str = ""

    def register(self, ident: str) -> _Table:
        """The table of the register `ident`, found as the launcher finds it."""
        self.check()
        pattern = _register_start(ident)
        found = [i for i, line in enumerate(self.lines) if pattern.match(line)]
        if len(found) != 1:
            count = "no" if not found else str(len(found))
            raise _Unreadable(
                f"the handoff has {count} {ident} register{'s' if found else ''}", self.module
            )
        start = found[0]
        end = next(
            (i for i in range(start + 1, len(self.lines)) if hd.heading_of(self.lines[i])),
            len(self.lines),
        )
        label = self._label(self.lines[start], ident)
        return self._table(
            label,
            [(i + 1, self.lines[i]) for i in range(start + 1, end)],
            preserve_controls=ident == "T4.18",
        )

    def heading_table(self, title: str) -> _Table:
        """The first table under the section headed exactly `title`."""
        self.check()
        return self._table(title, self.prose(title))

    def prose(self, title: str) -> list[tuple[int, str]]:
        """The (line, text) pairs of the section headed exactly `title`."""
        self.check()
        try:
            return hd.section(list(self.lines), title)
        except ValueError as error:
            raise _Unreadable(str(error), self.module) from error

    def check(self) -> None:
        if self.error:
            raise _Unreadable(self.error, self.module)

    def _table(
        self, label: str, rows: list[tuple[int, str]], *, preserve_controls: bool = False
    ) -> _Table:
        try:
            headers, body = hd.table(rows, preserve_controls=preserve_controls)
        except ValueError as error:
            raise _Unreadable(f"{label}: {error}", self.module) from error
        found = tuple(_Row(line, tuple(cells)) for line, _, cells in body)
        return _Table(self.module, label, tuple(headers), found)

    @staticmethod
    def _label(line: str, ident: str) -> str:
        heading = hd.heading_of(line)
        if heading is not None:
            return hd.plain(heading[1])
        tag = re.match(r"<!-- table-id: (\S+) -->", line)
        return tag[1] if tag else ident


def _doc(module: str, raw: bytes) -> _Doc:
    sha = li.sha256(raw)
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        _LOG.warning(
            "credit snapshot: the %s handoff is not valid UTF-8; its blocks are gaps", module
        )
        return _Doc(module, (), "", sha, "the handoff is not valid UTF-8 text")
    try:
        lines = hd.hide_fenced(hd.hide_comments(hd.physical_lines(text), module))
    except ValueError as error:
        _LOG.warning("credit snapshot: the %s handoff cannot be read: %s", module, error)
        return _Doc(module, (), text, sha, str(error))
    return _Doc(module, tuple(lines), text, sha)


# --- Making cells ---------------------------------------------------------------------------------


@dataclass(frozen=True)
class _Maker:
    sheet: str
    block: str
    names: Mapping[str, str]  # module names of the run's pathway, for the reader text

    def _cell(
        self, row: str, column: str, kind: str, text: str, at: _At | None = None
    ) -> SnapshotCell:
        where = (at.module, at.section, at.line) if at else (None, None, None)
        if ILLEGAL.search(row + column) or (kind != GAP and ILLEGAL.search(text)):
            _LOG.warning(
                "credit snapshot: %s: a cell, its row or its column holds a control character "
                "(module %s, line %s)",
                self.block,
                where[0],
                where[2],
            )
            row = CONTROL_CHARACTER if ILLEGAL.search(row) else row
            column = CONTROL_CHARACTER if ILLEGAL.search(column) else column
            kind, text = GAP, CONTROL_CHARACTER
        return SnapshotCell(self.sheet, self.block, row, column, kind, text, *where)

    def copied(
        self, at: _At, row: str, column: str, text: str, basis: str | None = None
    ) -> SnapshotCell:
        """The handoff's cell; a blank one is a gap (still located), never a blank copy. Text that
        names a module by its code is drawn with the module's name (ruling PM-b): the cell is then
        computed and `written` keeps the exact text for Sources."""
        if ILLEGAL.search(text):
            return replace(self._cell(row, column, COPIED, text, at), basis=basis)
        if not text.strip():
            return self._cell(row, column, GAP, NOT_IN_HANDOFF, at)
        shown = drawn_text(text, self.names)
        if shown != text:
            cell = self._cell(row, column, COMPUTED, shown, at)
            return replace(cell, basis=basis, written=text if cell.kind == COMPUTED else None)
        return replace(self._cell(row, column, COPIED, text, at), basis=basis)

    def gap(self, row: str, column: str, text: str, reason: str | None = None) -> SnapshotCell:
        """A gap. `reason`, when there is one, is the technical cause: it goes to Sources, never
        into the sentence the reader sees."""
        return replace(self._cell(row, column, GAP, text), written=reason)

    def unreadable(
        self, row: str, column: str, what: str, error: ValueError, module: str | None = None
    ) -> SnapshotCell:
        """The gap for something that could not be read: "The <what> of <module's name> could not
        be read." in reader words (the module is the error's, or `module`); the error's own text is
        the reason on Sources."""
        found = module or (error.module if isinstance(error, _Unreadable) else None)
        name = self.names.get(found or "")
        of = f" of {name}" if name else ""
        return self.gap(row, column, f"The {what}{of} could not be read.", str(error))

    def computed(self, row: str, column: str, text: str) -> SnapshotCell:
        return self._cell(row, column, COMPUTED, text)

    def entered(self, row: str, column: str, text: str) -> SnapshotCell:
        return self._cell(row, column, ENTERED, text)

    def analyst(self, row: str, column: str) -> SnapshotCell:
        return self._cell(row, column, ANALYST, "")

    def blank(self, row: str, column: str) -> SnapshotCell:
        return self._cell(row, column, BLANK, "")


def _numbered(cells: list[SnapshotCell]) -> list[SnapshotCell]:
    """A row label that repeats within a block (two events on one date) gets ` (2)`, ` (3)`...,
    so no two cells share a row and column. The number is the first that makes a label no cell
    of the block holds or has been given (a literal `Term Loan B (2)` is never taken over)."""
    taken = {(cell.row, cell.column) for cell in cells}
    seen: set[tuple[str, str]] = set()
    numbered = []
    for cell in cells:
        key = (cell.row, cell.column)
        if key not in seen:
            seen.add(key)
            numbered.append(cell)
            continue
        count = 2
        while (f"{cell.row} ({count})", cell.column) in taken:
            count += 1
        taken.add((f"{cell.row} ({count})", cell.column))
        numbered.append(replace(cell, row=f"{cell.row} ({count})"))
    return numbered


# --- The run being gathered -----------------------------------------------------------------------


@dataclass(frozen=True)
class _Score:
    state: Literal["absent", "refused", "ok"]
    scorecard: Scorecard | None = None
    faults: int = 0
    reason: str = ""


class _Run:
    """Working state of one `gather`: the parsed handoffs and what is read from them more than
    once. Nothing here outlives the call."""

    def __init__(self, run: SnapshotRun) -> None:
        self.run = run
        self.docs = {module: _doc(module, raw) for module, raw in run.handoffs.items()}
        self.basis: list[BasisLine] = []
        self._read: dict[tuple[str, str, str], _Table | Exception] = {}
        self.score = self._scorecard()
        self._views: tuple[ReferenceView, ...] | None = None
        self.bridge_classifications: dict[str, _BridgeClassification] = {}

    def matched(self) -> list[tuple[MarketSheet, MarketRow]]:
        """The issuer's rows of the run's RV worksheets, in sheet and row order: a `Company` or
        `Borrower Name` equal to the issuer ignoring case and surrounding or repeated spaces."""
        sheets, issuer = self.run.market, _fold(self.run.issuer)
        if isinstance(sheets, MarketGap) or not issuer:
            return []
        return [
            (sheet, row)
            for sheet in sheets
            for row in sheet.rows
            if issuer in (_fold(row.cells["Company"]), _fold(row.cells["Borrower Name"]))
        ]

    def doc(self, module: str) -> _Doc:
        if module not in self.docs:
            raise _Absent
        return self.docs[module]

    def table(self, module: str, kind: str, ident: str) -> _Table:
        """A register (`kind` "register") or heading table (`kind` "heading"), read once."""
        key = (module, kind, ident)
        if key not in self._read:
            try:
                doc = self.doc(module)
                self._read[key] = (
                    doc.register(ident) if kind == "register" else doc.heading_table(ident)
                )
            except (_Absent, ValueError) as error:
                self._read[key] = error
        held = self._read[key]
        if isinstance(held, Exception):
            raise held
        return held

    def register(self, module: str, ident: str) -> _Table:
        return self.table(module, "register", ident)

    def heading(self, module: str, title: str) -> _Table:
        return self.table(module, "heading", title)

    def need_context(self) -> RunContext:
        """The loaded context; none means the block is hidden, a refused one is a gap line in
        reader words (the reason names a path or a hash: it is logged and kept on Sources)."""
        context = self.run.context
        if context is None:
            raise _Absent
        if isinstance(context, ContextGap):
            raise _Said(CONTEXT_UNREAD, context.reason)
        return context

    def loaded_context(self) -> RunContext | None:
        context = self.run.context
        return None if isinstance(context, ContextGap) else context

    def company(self) -> tuple[_Table, _Row]:
        table = self.register("CP-1A", "company_description")
        if len(table.rows) != 1:
            raise _Unreadable(
                f"{table.section} has {len(table.rows)} rows and should have one", table.module
            )
        return table, table.rows[0]

    def sector(self) -> str | None:
        """The issuer's sector for sector limits: the context's when it has one, else CP-1A's
        Sector cell, else unknown (limits then read as not read)."""
        context = self.loaded_context()
        if context is not None and context.identity.sector.strip():
            return context.identity.sector
        try:
            table, row = self.company()
            return row.cells[table.index("Sector")].strip() or None
        except (_Absent, ValueError):
            return None

    def views(self) -> tuple[ReferenceView, ...]:
        if self._views is None:
            sector = self.sector()
            views = [
                _view(reference, found, self.run.issuer, sector)
                for reference, found in self.run.references
            ]
            used: set[str] = set()
            for at, view in enumerate(views):
                if ILLEGAL.search(view.name):  # a name a cell cannot hold: the documented gap text
                    _LOG.warning(
                        "credit snapshot: reference %s: its name holds a control character",
                        view.key,
                    )
                    view = replace(view, name=CONTROL_CHARACTER)
                name, count = view.name, 1
                while name in used:  # formula cells are keyed by name: each view needs its own
                    count += 1
                    name = f"{view.name} ({count})"
                used.add(name)
                views[at] = replace(view, name=name)
            self._views = tuple(views)
        return self._views

    def _scorecard(self) -> _Score:
        doc = self.docs.get("CP-2")
        if doc is None:
            return _Score("absent")
        if doc.error:
            return _Score("refused", reason=doc.error)
        try:
            scorecard = parse_scorecard(doc.text)
        except ScorecardError as error:
            _LOG.warning("credit snapshot: Scorecard: %s", error)
            return _Score("refused", faults=len(error.faults), reason=str(error))
        return _Score("absent") if scorecard is None else _Score("ok", scorecard)


Builder = Callable[[_Run, _Maker], list[SnapshotCell]]

_NOT_IN_RUN = {
    "Business description": "The business description is not in this run.",
    "Operating model": "The operating model is not in this run.",
    "Shareholders": "The shareholders are not in this run.",
    "Transaction summary": "The transaction summary is not in this run.",
    "Near-term events": "The near-term events are not in this run.",
    "Scorecard": "The credit scorecard is not in this run.",
    "Strengths and weaknesses": "Strengths and weaknesses are not in this run.",
    "Credit Score": "No Credit Score: the run has no credit scorecard.",
    "Historical performance": "The historical performance is not in this run.",
    "Capital structure": "The capital structure is not in this run.",
    "Capital structure totals": "The capital structure totals are not in this run.",
    "EBITDA bridge": "The EBITDA bridge is not in this run.",
    "EBITDA measures": "The EBITDA measures are not in this run.",
    "Financials": "The financials are not in this run.",
    "Peers": "The peer list is not in this run.",
}
_PROSE_BLOCKS = frozenset({"Historical performance"})  # read as sections, not tables
_GAP_AT = {"Credit Score": ("Credit Score", "Value")}


def _block(run: _Run, sheet: str, name: str, build: Builder) -> Block:
    maker = _Maker(sheet, name, chips.module_names(run.run.pathway))
    row, column = _GAP_AT.get(name, ("Gap", "Text"))
    try:
        cells = build(run, maker)
    except _Absent:
        text = _NOT_IN_RUN.get(name)
        cells = [maker.gap(row, column, text)] if text else []
    except ValueError as error:  # malformed handoff content: the block's gap (documented fail-open)
        _LOG.warning("credit snapshot: %s could not be read: %s", name, error)
        if isinstance(error, _Said):
            cells = [maker.gap(row, column, str(error), error.reason)]
        else:
            kind = "section" if name in _PROSE_BLOCKS else "table"
            cells = [maker.unreadable(row, column, f"{name} {kind}", error)]
    return Block(sheet, name, tuple(_numbered(cells)))


# --- Plain copied tables --------------------------------------------------------------------------


def _copy_table(module: str, ident: str, columns: Sequence[str]) -> Builder:
    """Every row of the register, one cell per named column; a row's label is its first column."""

    def build(run: _Run, mk: _Maker) -> list[SnapshotCell]:
        return _copy_register_cells(run.register(module, ident), mk, columns)

    return build


def _copy_register_cells(
    table: _Table, mk: _Maker, columns: Sequence[str], labels: Sequence[str] | None = None
) -> list[SnapshotCell]:
    at = [table.index(column) for column in columns]
    names = labels if labels is not None else [row.cells[at[0]] for row in table.rows]
    return [
        mk.copied(table.at(row.line), label, column, row.cells[i])
        for row, label in zip(table.rows, names, strict=True)
        for column, i in zip(columns, at, strict=True)
    ]


def _business(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    table, row = run.company()
    text = row.cells[table.index("Business description")]
    return [mk.copied(table.at(row.line), "Description", "Value", text)]


def _header(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """Issuer, sector and country from CP-1A; when CP-1A does not give one, the run record's issuer
    name or the context's sector and country (entered at run start), else a gap."""
    company: tuple[_Table, _Row] | None = None
    try:
        company = run.company()
    except _Absent:
        pass
    except ValueError as error:  # unreadable: the run record and context stand in, and it is logged
        _LOG.warning("credit snapshot: Header: the company description is unreadable: %s", error)
    context = run.loaded_context()
    fallback = {
        "Issuer": run.run.issuer,
        "Sector": context.identity.sector if context else "",
        "Country": context.identity.country if context else "",
    }
    cells = []
    for label, entered in fallback.items():
        at = _optional(company[0], label) if company else None
        text = company[1].cells[at] if company and at is not None else ""
        if company and text.strip():
            cells.append(mk.copied(company[0].at(company[1].line), label, "Value", text))
        elif entered.strip():
            cells.append(mk.entered(label, "Value", entered))
        else:
            cells.append(mk.gap(label, "Value", NOT_IN_HANDOFF))
    cells.append(mk.entered("Run date", "Value", run.run.as_of))
    cells.append(mk.entered("Pathway", "Value", pathway_title(run.run.pathway)))
    cells.append(mk.computed("Run kind", "Value", run_kind(run.run.execution)))
    return cells


def _analyst(rows: Sequence[tuple[str, str]]) -> Builder:
    def build(_run: _Run, mk: _Maker) -> list[SnapshotCell]:
        return [mk.analyst(row, column) for row, column in rows]

    return build


# --- The context's blocks -------------------------------------------------------------------------


def _ratings(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """Issuer-scope ratings as entered at run start; none entered gives blank analyst cells."""
    context = run.run.context
    if isinstance(context, ContextGap):
        raise _Said(CONTEXT_UNREAD, context.reason)
    issuer = [r for r in (context.ratings if context else ()) if r.scope == "issuer"]
    if not issuer:
        return [
            mk.analyst(agency, column)
            for agency in ("Moody's", "S&P", "Fitch")
            for column in ("Rating", "Outlook", "As of")
        ]
    return [
        mk.entered(r.agency, column, text)
        for r in issuer
        for column, text in (("Rating", r.rating), ("Outlook", r.outlook), ("As of", r.as_of))
    ]


def _new_issue(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """The deal terms the analyst entered at run start; hidden when there are none."""
    terms = run.need_context().deal_terms
    cells = []
    for term in terms:
        row = term.instrument or term.facility_id
        fields = (
            ("Instrument", term.instrument),
            ("Currency", term.currency),
            ("Size (m)", term.size_m),
            ("Maturity", term.maturity),
            ("Use of proceeds", term.use_of_proceeds),
            ("Talk spread low (bps)", term.talk_spread_bps_low),
            ("Talk spread high (bps)", term.talk_spread_bps_high),
        )
        for column, text in fields:
            if text.strip():
                cells.append(mk.entered(row, column, text))
            else:
                cells.append(mk.gap(row, column, "not entered at run start"))
    return cells


_QUOTE_FIELDS = (
    ("Facility id", "facility_id"),
    ("Kind", "kind"),
    ("Bid", "bid"),
    ("Ask", "ask"),
    ("Price", "price"),
    ("Yield (%)", "yield_pct"),
    ("Spread (bps)", "spread_bps"),
    ("As of", "as_of"),
    ("Provider", "provider"),
)


def _quotes(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """Every field of every quote as entered, a blank field shown blank, none joined to an
    instrument."""
    quotes = run.need_context().quotes
    return [
        mk.entered(f"Quote {number}", column, str(getattr(quote, name)))
        for number, quote in enumerate(quotes, 1)
        for column, name in _QUOTE_FIELDS
    ]


# --- Identifiers from the run's RV worksheet ------------------------------------------------------


def _present(row: MarketRow) -> dict[str, str]:
    """The identifiers the sheet row has, as entered: a FIGI of 12 capital letters and digits, a
    Bloomberg ID that is not empty and not a vendor error token (a missing one is not listed)."""
    found = {}
    figi = row.cells.get("FIGI", "")
    if pe.FIGI.fullmatch(figi):
        found["FIGI"] = figi
    bloomberg = row.cells.get("Bloomberg ID", "").strip()
    if bloomberg and not pe.TOKEN.match(bloomberg):
        found["Bloomberg ID"] = row.cells["Bloomberg ID"]
    return found


def _rv_loan(row: MarketRow) -> bool:
    kind = row.cells.get("Loan Type", "").strip()
    return bool(kind) and not pe.TOKEN.match(kind)


def _identifier_cells(
    mk: _Maker, label: str, found: tuple[MarketSheet, MarketRow] | None
) -> list[SnapshotCell]:
    if found is None:
        return [mk.analyst(label, column) for column in IDENTIFIERS]
    sheet, row = found
    present = _present(row)
    at = _At(RV_MODULE, sheet.section, row.line)
    return [
        mk.copied(at, label, column, present[column])
        if column in present
        else mk.blank(label, column)
        for column in IDENTIFIERS
    ]


def _instrument_labels(table: _Table, index: int) -> list[str]:
    """Keep valid written names and give each unreadable name its own safe caption."""
    stated = [row.cells[index] for row in table.rows]
    occupied = set(stated)
    labels = []
    for number, name in enumerate(stated, 1):
        if ILLEGAL.search(name):
            name = f"Instrument {number} (name unavailable)"
            suffix = 2
            while name in occupied:
                name = f"Instrument {number} (name unavailable {suffix})"
                suffix += 1
            occupied.add(name)
        labels.append(name)
    return labels


def _instruments(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """The T4.18 instruments, each with its FIGI and Bloomberg ID. An instrument is joined to a
    sheet row only when their maturities are the same date, that date is on exactly one of the
    issuer's sheet rows and exactly one instrument, both are loans, and the sheet row has an
    identifier; otherwise the two cells are the analyst's. No join is made while any loan row on
    either side has a stated unreadable maturity (ruling T5-i). An unreadable non-loan maturity
    does not prevent a join. Only the explicit Asset type supplies the instrument class."""
    table = run.register("CP-1", "T4.18")
    instrument_at = table.index("Instrument")
    labels = _instrument_labels(table, instrument_at)
    cells = _copy_register_cells(table, mk, ("Instrument",), labels)
    type_columns = asset_type_columns(table.headers)
    date_columns = [
        at for at, header in enumerate(table.headers) if _fold(hd.plain(header)) == "maturity"
    ]
    type_at = type_columns[0] if len(type_columns) == 1 else None
    date_at = date_columns[0] if len(date_columns) == 1 else None
    texts = [row.cells[date_at] if date_at is not None else "" for row in table.rows]
    days = [read_day(text) for text in texts]
    kinds = [
        stated_asset_type(row.cells[type_at], instrument=row.cells[instrument_at])
        if type_at is not None
        else None
        for row in table.rows
    ]
    matched = run.matched()
    unread = any(
        kind == "loan" and _unreadable(text, day)
        for kind, text, day in zip(kinds, texts, days, strict=True)
    ) or any(row.unreadable and _rv_loan(row) for _, row in matched)
    for label, day, kind in zip(labels, days, kinds, strict=True):
        same = [(s, r) for s, r in matched if day is not None and r.maturity == day]
        one = not unread and kind == "loan" and len(same) == 1 and days.count(day) == 1
        joined = same[0] if one and _rv_loan(same[0][1]) and _present(same[0][1]) else None
        cells += _identifier_cells(mk, label, joined)
    return cells


def _market(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """Every sheet row of the run's RV worksheet that names the issuer (names compared ignoring
    case and spaces), nine columns as entered. No prices, moves or ratings."""
    sheets = run.run.market
    if isinstance(sheets, MarketGap) or not sheets:
        return [mk.gap("Gap", "Text", NO_MARKET)]
    matched = run.matched()
    if not matched:
        return [mk.gap("Gap", "Text", NO_MARKET_ROWS)]
    return [
        mk.copied(
            _At(RV_MODULE, sheet.section, row.line), f"Row {row.line}", column, row.cells[column]
        )
        for sheet, row in matched
        for column in MARKET_COLUMNS
    ]


# --- Prose, peers, strengths ----------------------------------------------------------------------


def _paragraphs(
    run: _Run, mk: _Maker, doc: _Doc, title: str, rows: list[tuple[int, str]]
) -> list[SnapshotCell]:
    table = _Table(doc.module, title, (), ())
    cells: list[SnapshotCell] = []
    last = title
    for line, text in rows:
        stripped = text.strip()
        if not stripped or stripped.startswith(("#", "|")):
            continue
        if stripped.startswith("Basis:"):
            run.basis.append(BasisLine(doc.module, title, line, text, last, mk.block))
            continue
        last = f"{title} {len(cells) + 1}"
        cells.append(mk.copied(table.at(line), last, "Text", text))
    return cells or [mk.gap(title, "Text", NOT_IN_HANDOFF)]


def _historical(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    doc = run.doc("CP-1B")
    doc.check()  # a handoff that cannot be read at all is the block's one gap
    cells: list[SnapshotCell] = []
    for title in ("Bottom line", "Key findings"):
        try:
            cells += _paragraphs(run, mk, doc, title, doc.prose(title))
        except ValueError as error:  # a missing section is that section's gap
            _LOG.warning("credit snapshot: %s: %s could not be read: %s", mk.block, title, error)
            cells.append(mk.unreadable(title, "Text", f"{title} section", error, doc.module))
    return cells


def _peers_of(run: _Run, module: str, ident: str, column: str) -> list[tuple[_Table, _Row, str]]:
    table = run.register(module, ident)
    name = table.index(column)
    ident_at = table.headers.index("peer_id") if "peer_id" in table.headers else None
    return [
        (table, row, row.cells[name])
        for row in table.rows
        if ident_at is None or _fold(row.cells[ident_at]) != "none"
    ]


def _peers(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """Peer issuer names, CP-1C's T4.1 first and then CP-DR's TDR.4, names not merged. CP-DR's
    single `none` row (no CP-1C question in the brief) names no peer."""
    found: list[tuple[_Table, _Row, str]] = []
    problems: list[SnapshotCell] = []
    ran = False
    for module, ident, column in (("CP-1C", "T4.1", "Entity Name"), ("CP-DR", "TDR.4", "name")):
        if module not in run.docs:
            continue
        ran = True
        try:
            found += _peers_of(run, module, ident, column)
        except ValueError as error:  # one source unreadable: its gap, the other still read
            _LOG.warning(
                "credit snapshot: Peers: %s %s could not be read: %s", module, ident, error
            )
            problems.append(
                mk.gap(
                    "Gap",
                    "Text",
                    f"The {mk.names.get(module, module)} peer table could not be read.",
                    str(error),
                )
            )
    if not ran:
        raise _Absent
    cells = [
        mk.copied(table.at(row.line), f"Peer {number}", "Peer issuer", text)
        for number, (table, row, text) in enumerate(found, 1)
    ]
    cells += problems
    return cells or [mk.gap("Gap", "Text", NO_PEERS)]


def _strengths(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    table = run.register("CP-2", "cp_model_strengths_weaknesses")
    at = {name: table.index(name) for name in ("direction", "rank", "label", "mechanism")}
    cells = []
    for row in table.rows:
        direction = _fold(row.cells[at["direction"]])
        if direction not in ("strength", "weakness"):
            raise _Unreadable(
                f"{table.section} has the direction `{row.cells[at['direction']]}`, "
                "which is neither STRENGTH nor WEAKNESS",
                table.module,
            )
        label = f"{direction.capitalize()} {row.cells[at['rank']]}"
        for column, key in (("Label", "label"), ("Mechanism", "mechanism")):
            cells.append(mk.copied(table.at(row.line), label, column, row.cells[at[key]]))
    return cells


# --- The scorecard --------------------------------------------------------------------------------


def _need_scorecard(run: _Run) -> Scorecard:
    score = run.score
    if score.state == "absent":
        raise _Absent
    if score.state == "refused" or score.scorecard is None:
        count = score.faults
        said = f"{count} fault{'s' if count != 1 else ''} in its tables" if count else score.reason
        raise _Said("The credit scorecard could not be read.", said)
    return score.scorecard


def _scored(
    run: _Run, mk: _Maker, ident: str, parsed: Mapping[str, str], value_column: str
) -> list[SnapshotCell]:
    """One cell per scorecard or assessment row, in the ruled order, with the row's Basis cell
    kept for the writer's comment. `parsed` is each row's value as `cp2_scorecard` read it. A cell
    whose handoff text is that value is copied; one written another way (`**5**`) holds the parsed
    value as computed and keeps the exact text in `written`, so a formula reads a number."""
    table = run.register("CP-2", ident)
    first, value, basis = (
        table.index(table.headers[0]),
        table.index(value_column),
        table.index("Basis"),
    )
    by_name = {_name(row.cells[first]): row for row in table.rows}
    cells = []
    for name, wanted in parsed.items():
        row = by_name.get(_name(name))
        if row is None:
            raise _Unreadable(f"{table.section} has no row for {name}", table.module)
        text = row.cells[value]
        if text.strip() and text != wanted:
            cell = mk._cell(name, value_column, COMPUTED, wanted, table.at(row.line))
            cells.append(replace(cell, basis=row.cells[basis], written=text))
        else:
            cells.append(mk.copied(table.at(row.line), name, value_column, text, row.cells[basis]))
    return cells


def _scorecard(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    card = _need_scorecard(run)
    levels = {f.factor: NOT_SCORED if f.level is None else str(f.level) for f in card.factors}
    return _scored(run, mk, "T2.13", {n: levels[n] for n in FACTORS}, "Level")


def _assessments(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    try:
        card = _need_scorecard(run)
    except _Said:  # the Scorecard block says so; no second gap line
        raise _Absent from None
    views = {a.name: NOT_ASSESSED if a.view is None else a.view for a in card.assessments}
    return _scored(run, mk, "T2.14", {n: views[n] for n in ASSESSMENTS}, "View")


def _credit_score(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    score = run.score
    if score.state == "refused":
        return [
            mk.gap(
                "Credit Score", "Value", "No Credit Score: the credit scorecard could not be read."
            )
        ]
    credit = _credit(run)
    if credit is None:
        raise _Absent
    if credit.score is None:
        return [mk.gap("Credit Score", "Value", credit.reason)]
    return [mk.computed("Credit Score", "Value", str(credit.score))]


def _credit(run: _Run) -> rec.CreditScore | None:
    scorecard = run.score.scorecard
    return None if scorecard is None else rec.credit_score(scorecard)


# --- CP-1: capital structure, financials, bridge --------------------------------------------------


@dataclass(frozen=True)
class _Pick:
    """One value read from a CP-1 table; `line` 0 is a field the table does not have."""

    row: str
    column: str
    text: str
    table: _Table | None
    line: int
    key: str
    free: bool = False
    missing: str = NOT_IN_HANDOFF

    def cell(self, mk: _Maker) -> SnapshotCell:
        if self.table is None:
            return mk.gap(self.row, self.column, self.missing)
        return mk.copied(self.table.at(self.line), self.row, self.column, self.text)


_FREE = {  # a spec line with no fixed label: shown only when a row's label equals it
    "T4.4": ("Revenue", "Gross profit", "Margin", "Growth"),
    "T4.5": ("FFO",),
    "T4.6": ("Senior debt", "Unsecured debt"),
    "T4.9": ("Margin", "Growth", "Senior leverage", "Unsecured leverage"),
}
NO_UNIT = "unit not in handoff"
UNIT_DIFFERS = "unit differs by period"


def _optional(table: _Table, name: str) -> int | None:
    try:
        return table.index(name)
    except _Unreadable:
        return None


def _unit_pick(
    table: _Table,
    rows: Sequence[_Row],
    at: int | None,
    shown: tuple[str, str, bool],
    column: str = "Unit",
) -> _Pick:
    """The Unit (or Currency) cell of a row label, from its first period's row. No such column in
    the table is a per-row gap, and so is a unit that differs between the label's periods: one
    unit shown for figures stated in another would misread them."""
    label, key, free = shown
    if at is None:
        return _Pick(label, column, "", None, 0, key, free, NO_UNIT)
    if len({row.cells[at] for row in rows}) > 1:
        return _Pick(label, column, "", None, 0, key, free, UNIT_DIFFERS)
    return _Pick(label, column, rows[0].cells[at], table, rows[0].line, key, free)


def _statement(run: _Run, spec: StatementSpec) -> list[_Pick]:
    """The fixed rows of T4.4, T4.5 or T4.6 (the method file's list), the optional ones when the
    table has them, and the free-label rows whose label matches; every period column."""
    ident = spec.heading.split()[0]
    table = run.register("CP-1", ident)
    unit = table.index("Unit")
    periods = [(i, table.headers[i]) for i in range(1, unit)]
    if not periods:
        raise _Unreadable(f"{table.section} has no period column before `Unit`", table.module)
    named = {_fold(label): label for label in (*spec.fixed, *spec.optional)}
    free = {_fold(label) for label in _FREE[ident]}
    picks: list[_Pick] = []
    for row in table.rows:
        key = _fold(row.cells[0])
        if key not in named and key not in free:
            continue
        shown = named.get(key, row.cells[0])
        picks += [
            _Pick(shown, period, row.cells[i], table, row.line, key, key not in named)
            for i, period in periods
        ]
        picks.append(_unit_pick(table, [row], unit, (shown, key, key not in named)))
    present = {pick.key for pick in picks}
    picks += [
        _Pick(label, "Value", "", None, 0, _fold(label))
        for label in spec.fixed
        if _fold(label) not in present
    ]
    return picks


def _register_rows(run: _Run) -> list[_Pick]:
    """T4.9's six fixed metrics (the check's list) and its free-label rows, one pick per period."""
    table = run.register("CP-1", "T4.9")
    name, period, value = (table.index(c) for c in ("Metric Name", "Period", "Calculated Value"))
    fixed = {_fold(m.name): m.name for m in METRICS}
    free = {_fold(label) for label in _FREE["T4.9"]}
    units = {"Unit": _optional(table, "Unit"), "Currency": _optional(table, "Currency")}
    by_label: dict[str, list[_Row]] = {}
    for row in table.rows:
        by_label.setdefault(_fold(row.cells[name]), []).append(row)
    picks: list[_Pick] = []
    for row in table.rows:
        key = _fold(row.cells[name])
        if key not in fixed and key not in free:
            continue
        shown, free_row = fixed.get(key, row.cells[name]), key not in fixed
        picks.append(
            _Pick(shown, row.cells[period], row.cells[value], table, row.line, key, free_row)
        )
        if row is by_label[key][0]:  # a row label's Unit and Currency: its first occurrence
            picks += [
                _unit_pick(table, by_label[key], at, (shown, key, free_row), column)
                for column, at in units.items()
                if column == "Unit" or at is not None
            ]
    present = {pick.key for pick in picks}
    return picks + [
        _Pick(m.name, "Value", "", None, 0, _fold(m.name))
        for m in METRICS
        if _fold(m.name) not in present
    ]


def _net_debt(run: _Run) -> list[_Pick]:
    table = run.heading("CP-1", "Net debt data")
    period = table.index("Period")
    at = {column: table.index(column) for column in NET_DEBT_COLUMNS}
    unit = _optional(table, "Reporting unit")
    picks = [
        _Pick(column, row.cells[period], row.cells[at[column]], table, row.line, _fold(column))
        for row in table.rows
        for column in NET_DEBT_COLUMNS
    ]
    return picks + [
        _unit_pick(table, table.rows, unit, (column, _fold(column), False))
        for column in NET_DEBT_COLUMNS
    ]


def _reader_table(label: str) -> str:
    """A CP-1 table's name without its register code: `T4.4 Income statement` is `Income
    statement`."""
    return re.sub(r"^T[0-9]+\.[0-9]+ ", "", label)


def _financials(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    run.doc("CP-1")
    cells: list[SnapshotCell] = []
    sources: list[tuple[str, Callable[[], list[_Pick]]]] = [
        *((spec.heading, lambda s=spec: _statement(run, s)) for spec in STATEMENTS),
        ("T4.9 Calculation register", lambda: _register_rows(run)),
        ("Net debt data", lambda: _net_debt(run)),
    ]
    for label, read in sources:
        try:
            cells += [pick.cell(mk) for pick in read()]
        except ValueError as error:  # one table unreadable: its gap, the others still read
            _LOG.warning("credit snapshot: Financials: %s could not be read: %s", label, error)
            cells.append(mk.unreadable("Gap", "Text", f"{_reader_table(label)} table", error))
    return cells


_TOTALS_GAPS = (
    "Senior debt",
    "Unsecured debt",
    "Senior leverage",
    "Unsecured leverage",
    "Pro forma interest",
    "Pro forma interest cover",
)


def _balance_free_rows(run: _Run) -> list[_Pick]:
    """T4.6's free-label rows (`Senior debt`, `Unsecured debt`) when the handoff has them. An
    unreadable T4.6 is Financials' gap (logged there); here it leaves the plain gaps."""
    balance = next(spec for spec in STATEMENTS if spec.heading.startswith("T4.6"))
    try:
        return [p for p in _statement(run, balance) if p.free and p.table]
    except ValueError:
        return []


PRO_FORMA_TABLE = "Pro forma interest and cover"
PRO_FORMA_BASIS = "Reported EBITDA"  # the opening words of the Basis and limitation of that row
COVER_UNIT = "times"  # the cover's unit, as the table's rules state it ("as times, no `x`")


def _stated_gap(text: str) -> bool:
    """A cell that states no figure: `Not supplied: <reason>` or the none row's `Not stated`."""
    return _fold(text).startswith("not supplied") or _fold(text) == "not stated"


def _pro_forma_date(mk: _Maker, table: _Table, row: _Row, label: str) -> SnapshotCell:
    where = table.at(row.line)
    reason = None
    try:
        index = _unique_optional_index(table, "As of")
        date_text = row.cells[index] if index is not None else ""
    except _Unreadable as error:
        date_text, reason = "", str(error)
    if date_text and not _stated_gap(date_text):
        return mk.copied(where, label, "As of", date_text)
    return replace(
        mk.gap(label, "As of", "date not in handoff", reason or date_text or None),
        module=where.module,
        section=where.section,
        line=where.line,
    )


def _pro_forma(run: _Run, mk: _Maker) -> dict[str, list[SnapshotCell]]:
    """The two Totals rows `Pro forma interest` and `Pro forma interest cover`, from CP-1's `Pro
    forma interest and cover` table: the figures of its `Reported EBITDA` row (the one whose Basis
    and limitation opens with those words; no such row, no figures: the Totals rows name no EBITDA
    basis, so an Adjusted-basis cover is never shown under them), each by the reader's ordinary
    copied path. As of comes from the same row. A cell that states no figure is `not in handoff`.
    So is every row when the table, the row or a column is missing. A table that is present but
    unreadable or written twice is logged."""
    labels = ("Pro forma interest", "Pro forma interest cover")
    doc = run.doc("CP-1")
    written = sum(1 for line in doc.lines if line.strip() == f"### {PRO_FORMA_TABLE}")
    if written != 1:  # none: no table (or no readable handoff, which other blocks report)
        if written:  # the section twice is as unreadable as any table: logged, not silent
            _LOG.warning(
                "credit snapshot: Totals: %s could not be read: it is written %s times",
                PRO_FORMA_TABLE,
                written,
            )
        return {}
    try:
        table = run.heading("CP-1", PRO_FORMA_TABLE)
        columns = (*labels, "Reporting unit", "Basis and limitation")
        at = {
            name: index
            for name in columns
            if (index := _unique_optional_index(table, name)) is not None
        }
        if len(at) != len(columns):
            _LOG.warning("credit snapshot: Totals: %s lacks its required columns", PRO_FORMA_TABLE)
            return {}
        basis = at["Basis and limitation"]
        reported = [r for r in table.rows if r.cells[basis].startswith(PRO_FORMA_BASIS)]
        if len(reported) > 1:
            raise _Unreadable(f"{PRO_FORMA_TABLE} repeats the Reported EBITDA row", table.module)
    except _Unreadable as error:  # the section is there but its table cannot be read
        _LOG.warning("credit snapshot: Totals: %s could not be read: %s", PRO_FORMA_TABLE, error)
        return {label: [mk.gap(label, "Value", NOT_IN_HANDOFF, str(error))] for label in labels}
    if not reported:
        return {}
    row = reported[0]
    where = table.at(row.line)
    found: dict[str, list[SnapshotCell]] = {}
    for label in labels:
        text = row.cells[at[label]]
        if _stated_gap(text):
            continue
        cells = [mk.copied(where, label, "Value", text, basis=row.cells[basis])]
        if label == labels[1]:
            cells.append(mk.computed(label, "Unit", COVER_UNIT))
        else:
            unit = row.cells[at["Reporting unit"]]
            cells.append(
                mk.gap(label, "Unit", NO_UNIT)
                if _stated_gap(unit)
                else mk.copied(where, label, "Unit", unit)
            )
        found[label] = [*cells, _pro_forma_date(mk, table, row, label)]
    return found


def _totals(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    """Independent calculation and debt totals, with the written pro forma interest and cover."""
    run.doc("CP-1")
    register = _register_rows(run)
    found = [*_balance_free_rows(run), *(p for p in register if p.free and p.table)]
    cells = [pick.cell(mk) for pick in register if not pick.free]
    try:
        cells.extend(pick.cell(mk) for pick in _net_debt(run))
    except ValueError as error:
        cells.append(mk.unreadable("Net debt data", "Text", "Net debt data table", error))
    stated = _pro_forma(run, mk)
    for label in _TOTALS_GAPS:
        rows = [p for p in found if p.key == _fold(label)]
        if rows:
            cells += [p.cell(mk) for p in rows]
        else:
            cells += stated.get(label) or [mk.gap(label, "Value", NOT_IN_HANDOFF)]
    return cells


def _measures(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    income = next(spec for spec in STATEMENTS if spec.heading.startswith("T4.4"))
    wanted = {_fold(label) for label in (*income.fixed, *income.optional)}
    return [
        pick.cell(mk)
        for pick in _statement(run, income)
        if pick.key in wanted and pick.column != "Unit"
    ]


def _capital_structure(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    columns = (
        *("Instrument", "Type", "Ranking", "Currency", "Coupon or Margin", "Spread (bps)"),
        *("Maturity", "Principal", "Drawn"),
    )
    table = run.register("CP-1", "T4.18")
    return _copy_register_cells(
        table, mk, columns, _instrument_labels(table, table.index("Instrument"))
    )


def _classify(run: _Run) -> dict[str, _BridgeClassification]:
    """Classify unique CP-1D T1D.1/T1D.2 records under their exact shared Add-Back ID."""
    if "CP-1D" not in run.docs:
        return {}
    try:
        known = _add_backs(run.register("CP-1D", "T1D.1"), run.register("CP-1D", "T1D.2"))
    except ValueError as error:  # CP-1D unreadable: every step stays unclassified, and it is logged
        _LOG.warning(
            "credit snapshot: EBITDA bridge: the CP-1D add-backs cannot be read: %s", error
        )
        return {}
    return known


def _add_backs(register: _Table, achievable: _Table) -> dict[str, _BridgeClassification]:
    if any(len(table.rows) > 1000 or len(table.headers) > 200 for table in (register, achievable)):
        raise _Unreadable(
            "CP-1D add-back register exceeds the supported row or column count", "CP-1D"
        )
    register_id = _unique_index(register, "Add-Back ID")
    assess_id, claimed, realized, assessment = (
        _unique_index(achievable, name)
        for name in ("Add-Back ID", "Run-Rate Claimed", "Realized To Date", "Assessment")
    )
    unit_indexes = [
        index
        for index, header in enumerate(achievable.headers)
        if _fold(hd.plain(header)) in {_fold("Reporting unit"), _fold("Unit")}
    ]
    if len(unit_indexes) > 1:
        raise _Unreadable("T1D.2 has ambiguous reporting-unit columns", "CP-1D")
    unit_index = unit_indexes[0] if unit_indexes else None
    register_rows = _rows_by_id(register, register_id)
    assessment_rows = _rows_by_id(achievable, assess_id)
    result = {}
    for key in register_rows:
        if not _valid_add_back_id(key):
            continue
        matching_register = register_rows.get(key, [])
        matching_assessment = assessment_rows.get(key, [])
        if len(matching_register) != 1 or len(matching_assessment) != 1:
            result[key] = _BridgeClassification(UNCLASSIFIED)
            continue
        row = matching_assessment[0]
        value = (
            _verdict(row, claimed, realized, assessment)
            if unit_index is None or _usable_bridge_unit(row.cells[unit_index])
            else UNCLASSIFIED
        )
        result[key] = _BridgeClassification(
            value,
            achievable.at(row.line),
            row.cells[unit_index] if unit_index is not None else None,
        )
    return result


def _rows_by_id(table: _Table, index: int) -> dict[str, list[_Row]]:
    rows: dict[str, list[_Row]] = {}
    for row in table.rows:
        key = _add_back_id_text(row.cells[index])
        if key:
            rows.setdefault(key, []).append(row)
    return rows


def _add_back_id_text(value: str) -> str:
    """Unwrap whole-cell Markdown formatting while preserving punctuation inside a stable ID."""
    value = value.strip()
    for marker in ("**", "`", "*"):
        if value.startswith(marker) and value.endswith(marker) and len(value) > 2 * len(marker):
            inner = value[len(marker) : -len(marker)]
            if inner and not inner[0].isspace() and not inner[-1].isspace():
                return inner
    return value


def _valid_add_back_id(key: str) -> bool:
    return re.fullmatch(r"AB-[1-9][0-9]*", key, re.ASCII) is not None


def _unique_index(table: _Table, name: str) -> int:
    matches = [
        index
        for index, header in enumerate(table.headers)
        if _fold(hd.plain(header)) == _fold(name)
    ]
    if len(matches) != 1:
        raise _Unreadable(f"{table.section} requires exactly one `{name}` column", table.module)
    return matches[0]


def _unique_optional_index(table: _Table, name: str) -> int | None:
    matches = [
        index
        for index, header in enumerate(table.headers)
        if _fold(hd.plain(header)) == _fold(name)
    ]
    if len(matches) > 1:
        raise _Unreadable(f"{table.section} has ambiguous `{name}` columns", table.module)
    return matches[0] if matches else None


def _verdict(row: _Row, claimed: int, realized: int, assessment: int) -> str:
    stated = _fold(_add_back_id_text(row.cells[assessment]))
    if stated.startswith("[") and stated.endswith("]"):
        stated = stated[1:-1]
    if stated not in {"supported", "challenged", "rejected"}:
        return UNCLASSIFIED
    run_rate, achieved = row.cells[claimed], row.cells[realized]
    if not _PLAIN.fullmatch(run_rate) or not _PLAIN.fullmatch(achieved):
        return UNCLASSIFIED
    return "realised" if _decimal(achieved) >= _decimal(run_rate) else "unrealised"


def _decimal(text: str) -> Decimal:
    return Decimal(text.replace(",", ""))


def _bridge(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    classifications = run.bridge_classifications
    table = run.heading("CP-1", "Chart data: EBITDA bridge")
    if len(table.rows) > 1000 or len(table.headers) > 200:
        raise _Unreadable("EBITDA bridge exceeds the supported row or column count", "CP-1")
    step, amount, unit = (
        _unique_index(table, name) for name in ("Step", "Amount", "Reporting unit")
    )
    try:
        id_index = _unique_optional_index(table, "Add-Back ID")
    except _Unreadable:
        id_index = None
    basis_index = _unique_optional_index(table, "Basis and limitation")
    id_counts = (
        Counter(_add_back_id_text(row.cells[id_index]) for row in table.rows)
        if id_index is not None
        else Counter()
    )
    layout = _BridgeLayout(table, step, amount, unit, id_index, basis_index, id_counts)
    cells = _bridge_source_cells(layout, mk, classifications)
    cells.extend(_bridge_totals(layout, mk, classifications))
    return cells


def _optional_index(table: _Table, name: str) -> int | None:
    try:
        return table.index(name)
    except _Unreadable:
        return None


def _bridge_source_cells(
    layout: _BridgeLayout,
    mk: _Maker,
    classifications: dict[str, _BridgeClassification],
) -> list[SnapshotCell]:
    table, step, amount, unit = layout.table, layout.step, layout.amount, layout.unit
    id_index, id_counts = layout.id_index, layout.id_counts
    cells = []
    for position, row in enumerate(table.rows):
        label, at = row.cells[step], table.at(row.line)
        cells.append(mk.copied(at, label, "Step", row.cells[step]))
        for column, index in (("Amount", amount), ("Reporting unit", unit)):
            cells.append(mk.copied(at, label, column, row.cells[index]))
        raw_key = row.cells[id_index] if id_index is not None else ""
        key = _add_back_id_text(raw_key)
        if _bridge_endpoint(layout, position):
            cells.append(_bridge_computed(mk, at, label, "Classification", "not applicable"))
        elif id_index is None or not key:
            cells.append(_bridge_gap(mk, at, label, "Classification", NEEDS_ADD_BACK_IDS))
        elif not _valid_add_back_id(key) or id_counts[key] != 1:
            cells.append(_bridge_computed(mk, at, label, "Classification", UNCLASSIFIED))
        else:
            found = classifications.get(key)
            comparable = found is not None and _comparable_bridge_unit(row.cells[unit], found.unit)
            status = found.value if found is not None and comparable else UNCLASSIFIED
            status_at = (
                found.at if found is not None and comparable and found.at is not None else at
            )
            cells.append(
                _bridge_computed(
                    mk,
                    status_at,
                    label,
                    "Classification",
                    status,
                )
            )
    return cells


_BRIDGE_OPENING_LABELS = {"reported ebitda", "ebitda (reported)", "ebitda reported"}
_BRIDGE_CLOSING_LABELS = {
    "adjusted ebitda",
    "ebitda (adjusted)",
    "ebitda adjusted",
    "issuer adjusted ebitda",
    "ebitda as defined",
}


def _bridge_caption_names(caption: str, labels: set[str]) -> bool:
    return any(
        caption == label
        or (caption.startswith(f"{label} ") and period_order(caption[len(label) :]) is not None)
        for label in labels
    )


def _bridge_endpoint(layout: _BridgeLayout, position: int) -> bool:
    if position not in {0, len(layout.table.rows) - 1}:
        return False
    row = layout.table.rows[position]
    caption = _fold(hd.plain(row.cells[layout.step]))
    basis = _fold(hd.plain(row.cells[layout.basis_index])) if layout.basis_index is not None else ""
    opens = _bridge_caption_names(caption, _BRIDGE_OPENING_LABELS) or basis.startswith(
        ("opening:", "opening ")
    )
    closes = _bridge_caption_names(caption, _BRIDGE_CLOSING_LABELS) or basis.startswith(
        ("closing:", "closing ")
    )
    expected, opposite = (opens, closes) if position == 0 else (closes, opens)
    if opposite:
        return False
    if layout.id_index is None:
        return expected
    return _add_back_id_text(row.cells[layout.id_index]).casefold() == "not applicable"


def _bridge_computed(mk: _Maker, at: _At, row: str, column: str, value: str) -> SnapshotCell:
    return replace(
        mk.computed(row, column, value),
        module=at.module,
        section=at.section,
        line=at.line,
    )


def _bridge_gap(mk: _Maker, at: _At, row: str, column: str, value: str) -> SnapshotCell:
    return replace(mk.gap(row, column, value), module=at.module, section=at.section, line=at.line)


def _bridge_totals(
    layout: _BridgeLayout,
    mk: _Maker,
    classifications: dict[str, _BridgeClassification],
) -> list[SnapshotCell]:
    table, amount_index, unit_index = layout.table, layout.amount, layout.unit
    amounts = [row.cells[amount_index] for row in table.rows]
    units = [row.cells[unit_index] for row in table.rows]
    values = [_decimal(value) if _PLAIN.fullmatch(value) else None for value in amounts]
    boundaries = _bridge_boundaries(layout, units)
    structuring = _sum_bridge(values, units)
    if structuring is not None and boundaries:
        closing = values[-1]
        if closing is not None and closing != structuring[0]:
            structuring = None
    elif structuring is not None:
        structuring = None
    if structuring is None and boundaries and len(values) >= 2 and values[-1] is None:
        structuring = _sum_bridge(values[:-1] + [Decimal(0)], units)
    opening = table.rows[0] if table.rows else None
    cells: list[SnapshotCell] = []
    unrealised, unrealised_reason = _unrealised_adjustments(layout, values, classifications)
    for row_name in ("Structuring EBITDA", "Less unrealised add-backs", "House EBITDA"):
        if structuring is None or opening is None:
            cells.append(mk.gap(row_name, "Value", BRIDGE_RECONCILIATION_GAP))
            continue
        value: Decimal | None = structuring[0]
        reason: str | None = None
        if row_name == "Less unrealised add-backs":
            value = unrealised.copy_negate() if unrealised is not None else None
            reason = None if unrealised is not None else unrealised_reason
        elif row_name == "House EBITDA":
            value = (
                _exact_sum([structuring[0], unrealised.copy_negate()])
                if unrealised is not None
                else None
            )
            reason = None if unrealised is not None else unrealised_reason
        if reason or value is None:
            text = reason if reason in {NEEDS_ADD_BACK_IDS, BRIDGE_SCOPE_UNKNOWN} else UNCLASSIFIED
            cells.append(_bridge_gap(mk, table.at(opening.line), row_name, "Value", text))
        else:
            cells.append(
                _bridge_computed(
                    mk,
                    table.at(opening.line),
                    row_name,
                    "Value",
                    _decimal_text(value) if value is not None else UNCLASSIFIED,
                )
            )
        cells.append(mk.copied(table.at(opening.line), row_name, "Reporting unit", units[0]))
    return cells


def _bridge_boundaries(layout: _BridgeLayout, units: list[str]) -> bool:
    size = len(layout.table.rows)
    return (
        size >= 2
        and _same_bridge_units(units)
        and _bridge_endpoint(layout, 0)
        and _bridge_endpoint(layout, size - 1)
    )


def _same_bridge_units(units: list[str]) -> bool:
    return bool(units) and len(set(units)) == 1 and _comparable_bridge_unit(units[0], None)


def _sum_bridge(
    values: list[Decimal | None], units: list[str]
) -> tuple[Decimal, str | None] | None:
    if len(values) < 2 or len(values) != len(units) or not _same_bridge_units(units):
        return None
    if any(value is None for value in values):
        return None
    summands = [value for value in values[:-1] if value is not None]
    return _exact_sum(summands), None


def _usable_bridge_unit(unit: str) -> bool:
    normalized = unit.strip().casefold()
    if not normalized or normalized in {"—", "–", "-", "n/a", "na", "n.a."}:
        return False
    if normalized.startswith(("not supplied", "not stated", "not in handoff", "not applicable")):
        return False
    return _comparable_bridge_unit(unit, None)


def _comparable_bridge_unit(bridge_unit: str | None, assessment_unit: str | None) -> bool:
    bridge = _money_unit_parts(bridge_unit) if bridge_unit is not None else None
    if bridge is None:
        return False
    return assessment_unit is None or bridge == _money_unit_parts(assessment_unit)


def _money_unit_parts(unit: str) -> tuple[str, str] | None:
    if (
        re.fullmatch(
            r"(?:[A-Z]{3}|US\$|[$€£])\s*(?:millions?|m|mn|mm|billions?|bn|thousands?|k|units?)",
            unit.strip(),
            re.IGNORECASE | re.ASCII,
        )
        is None
    ):
        return None
    compact = re.fullmatch(r"([A-Z]{3})m", unit.strip(), re.ASCII)
    currency = currency_of(compact[1]) if compact else currency_of(unit)
    scale = scale_of(unit)
    return (currency, scale) if currency is not None and scale is not None else None


def _sum_precision(values: list[Decimal]) -> int:
    if not values:
        return 1
    whole_digits = max(max(value.adjusted() + 1, 1) for value in values)
    decimals = max(
        max(-exponent, 0) if isinstance(exponent := value.as_tuple().exponent, int) else 0
        for value in values
    )
    return whole_digits + decimals + len(str(len(values))) + 2


def _exact_sum(values: list[Decimal]) -> Decimal:
    with localcontext() as context:
        context.prec = _sum_precision(values)
        return sum(values, Decimal(0))


def _unrealised_adjustments(
    layout: _BridgeLayout,
    values: list[Decimal | None],
    classifications: dict[str, _BridgeClassification],
) -> tuple[Decimal | None, str | None]:
    table, units = layout.table, [row.cells[layout.unit] for row in layout.table.rows]
    id_index, id_counts = layout.id_index, layout.id_counts
    if len(table.rows) < 2 or len(values) < 2 or not _bridge_boundaries(layout, units):
        return None, BRIDGE_SCOPE_UNKNOWN
    if len(table.rows) == 2:
        known_empty = values[0] is not None and values[-1] is not None and values[0] == values[-1]
        return (Decimal(0), None) if known_empty else (None, BRIDGE_SCOPE_UNKNOWN)
    if id_index is None:
        return None, NEEDS_ADD_BACK_IDS
    unrealised: list[Decimal] = []
    for index, (row, amount) in enumerate(
        zip(table.rows[1:-1], values[1:-1], strict=True), start=1
    ):
        key = _add_back_id_text(row.cells[id_index])
        if not key or not _valid_add_back_id(key) or id_counts[key] != 1:
            return None, NEEDS_ADD_BACK_IDS if not key else UNCLASSIFIED
        classification = classifications.get(key)
        if (
            amount is None
            or classification is None
            or classification.value not in {"realised", "unrealised"}
            or (
                classification.unit is not None
                and not _comparable_bridge_unit(units[index], classification.unit)
            )
        ):
            return None, UNCLASSIFIED
        if classification.value == "unrealised":
            unrealised.append(amount)
    return _exact_sum(unrealised), None


def _decimal_text(value: Decimal) -> str:
    if value == 0:
        return "0"
    text = format(value, "f")
    return text.rstrip("0").rstrip(".") if "." in text else text


# --- The reference portfolios ---------------------------------------------------------------------

_OUTCOME_WORDS = {"not_read": "not read", "does_not_apply": "does not apply"}  # the rest as is
_FILE_FIELD = {"spread": "margin"}  # the other measures name their own file field
_UNDER_FIVE = "under five names: no Valuation"


def _view(
    reference: rp.Reference,
    found: rp.Portfolio | StoreGap | None,
    issuer: str,
    sector: str | None,
) -> ReferenceView:
    empty = ReferenceView(
        *(reference.key, reference.name, "not stored", NO_REFERENCE, None, (), None, NOT_HELD),
        *((), (), (), ()),
        *(reference.kind, _eligible(reference)),
    )
    if found is None:
        return empty
    if isinstance(found, StoreGap):
        return replace(empty, state="unreadable", message=found.reason)
    try:
        return _stored_view(reference, found, issuer, sector)
    except ValueError as error:  # a stored set this module cannot read: that reference's gap
        _LOG.warning("credit snapshot: reference %s could not be read: %s", reference.key, error)
        return replace(
            empty, state="unreadable", message=f"The reference could not be read: {error}."
        )


def _stored_view(
    portfolio_of: rp.Reference, portfolio: rp.Portfolio, issuer: str, sector: str | None
) -> ReferenceView:
    breached, not_read, rating, floors = _limits(portfolio, sector)
    return ReferenceView(
        portfolio_of.key,
        portfolio_of.name,
        "stored",
        "",
        None if portfolio.as_of is None else rp.long_date(portfolio.as_of),
        _medians(portfolio),
        *_weight(portfolio, issuer),
        breached,
        not_read,
        rating,
        floors,
        portfolio_of.kind,
        _eligible(portfolio_of, portfolio),
    )


def _eligible(reference: rp.Reference, portfolio: rp.Portfolio | None = None) -> tuple[str, ...]:
    """The asset types `recommendation.eligible_types` gives for the reference: loans for a CLO or
    the loan index, bonds for the high-yield index, a custom portfolio's declared type or both."""
    if portfolio is not None:
        return rec.eligible_types(portfolio, reference.asset_type)
    if reference.kind == "custom":
        return (reference.asset_type,) if reference.asset_type else ("loan", "bond")
    return rec.ELIGIBLE[reference.kind]


def _medians(portfolio: rp.Portfolio) -> tuple[Median, ...]:
    pairs = {
        (asset, position.rating_bucket)
        for position in portfolio.positions
        for asset in (
            (position.asset_type,) if position.asset_type else rec.eligible_types(portfolio)
        )
    }
    order = {name: i for i, name in enumerate(rp.BUCKET_NAMES)}
    headers = dict(portfolio.columns_found)
    medians = []
    for asset, bucket in sorted(pairs, key=lambda pair: (pair[0], order.get(pair[1], len(order)))):
        probe = rec.Instrument("reference", asset, bucket, Decimal(0), Decimal(100))
        valued = rec.valuation(probe, portfolio)
        columns = dict.fromkeys(headers.get(_FILE_FIELD.get(m, m), "") for m in valued.measures)
        medians.append(
            Median(
                asset,
                bucket,
                valued.median_bp,
                valued.names,
                " and ".join(rec.MEASURE_WORDS[m] for m in valued.measures) or None,
                " and ".join(c for c in columns if c) or None,
                valued.names < rec.MIN_NAMES,
            )
        )
    return tuple(medians)


def _weight(portfolio: rp.Portfolio, issuer: str) -> tuple[Decimal | None, str]:
    """The issuer's weight, or the gap sentence: not held or matched, or held with no figure."""
    try:
        weight = rp.issuer_weight(portfolio, borrower=issuer)
    except ValueError as error:  # an issuer name with no letters or digits matches nothing
        _LOG.warning("credit snapshot: issuer weight: %s cannot be matched: %s", issuer, error)
        return None, NOT_HELD
    if not weight.matched:
        return None, NOT_HELD
    return (weight.weight, "") if weight.weight is not None else (None, HELD_NO_WEIGHT)


def _limits(
    portfolio: rp.Portfolio, sector: str | None
) -> tuple[
    tuple[str, ...],
    tuple[str, ...],
    tuple[tuple[str, tuple[tuple[str, str], ...]], ...],
    tuple[tuple[str, Decimal], ...],
]:
    """Each constraints row read through `recommendation.read_limits`: with no bucket and no price
    (breached sector limits, rows not read), once per bucket (a row whose outcome changes with the
    bucket is a rating limit) and at a price's own value (a row that stops being not-read is a
    price floor). No private name of `recommendation` is used and no rule is re-implemented."""

    def read(bucket: str | None, price: Decimal | None) -> tuple[rec.LimitReading, ...]:
        return rec.read_limits(portfolio, sector=sector, rating_bucket=bucket, price=price)

    base = read(None, None)
    by_bucket = {bucket: read(bucket, None) for bucket in rp.BUCKET_NAMES}
    at_floor = _at_floor(base, read)
    rating, floors, unread = [], [], []
    for i, reading in enumerate(base):
        name = reading.limit.parameter
        if any(by_bucket[b][i].outcome != reading.outcome for b in rp.BUCKET_NAMES):
            rating.append(
                (
                    name,
                    tuple(
                        (b, _OUTCOME_WORDS.get(by_bucket[b][i].outcome, by_bucket[b][i].outcome))
                        for b in rp.BUCKET_NAMES
                    ),
                )
            )
        elif i in at_floor:
            floors.append((name, at_floor[i]))
        elif reading.outcome == "not_read":
            unread.append(name)
    breached = tuple(r.limit.parameter for r in base if r.outcome == BREACHED)
    return breached, tuple(unread), tuple(rating), tuple(floors)


def _at_floor(
    base: tuple[rec.LimitReading, ...],
    read: Callable[[str | None, Decimal | None], tuple[rec.LimitReading, ...]],
) -> dict[int, Decimal]:
    """The rows `read_limits` reads as a price floor: not read with no price, and read (not
    not-read) at the row's own quantity. Rows are grouped by that quantity, one call each."""
    wanted: dict[Decimal, list[int]] = {}
    for i, reading in enumerate(base):
        quantity = reading.limit.quantity
        if quantity is not None and reading.outcome == "not_read":
            wanted.setdefault(quantity.value, []).append(i)
    floors = {}
    for price, indexes in wanted.items():
        readings = read(None, price)
        floors.update({i: price for i in indexes if readings[i].outcome != "not_read"})
    return floors


def _status(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    cells = []
    for view in run.views():
        if view.state != "stored":
            cells.append(mk.gap(view.name, "Status", view.message))
        elif view.as_of is None:
            cells.append(mk.gap(view.name, "Status", "the file states no date"))
        else:
            cells.append(mk.computed(view.name, "As of", view.as_of))
    return cells


def _median_cells(run: _Run, mk: _Maker, *, only_median: bool) -> list[SnapshotCell]:
    cells = []
    for view in run.views():
        for m in view.medians:
            row = f"{view.name} / {m.asset_type} / {m.bucket}"
            cells += _median_row(mk, row, m, view.as_of, only_median)
    return cells


def _median_row(
    mk: _Maker, row: str, m: Median, as_of: str | None, only_median: bool
) -> list[SnapshotCell]:
    if m.median is None:
        median = mk.gap(row, "Median", "no level in the file for this bucket")
    else:
        median = mk.computed(row, "Median", str(m.median))
    if only_median:
        return [median]
    cells = [median, mk.computed(row, "Names", str(m.names))]
    if m.measure is not None:
        cells.append(mk.computed(row, "Measure", m.measure))
    if as_of is not None:
        cells.append(mk.computed(row, "As of", as_of))
    if m.file_column is not None:
        cells.append(mk.computed(row, "File column", m.file_column))
    if m.under_five:
        cells.append(mk.computed(row, "Note", _UNDER_FIVE))
    return cells


def _weights(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    return [
        mk.computed(v.name, "Weight (%)", str(v.weight))
        if v.weight is not None
        else mk.gap(v.name, "Weight (%)", v.weight_gap)
        for v in run.views()
        if v.state == "stored"
    ]


def _breached(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    return [
        mk.computed(v.name, f"Limit {n}", parameter)
        for v in run.views()
        for n, parameter in enumerate(v.breached, 1)
    ]


def _unread(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    cells = []
    for view in (v for v in run.views() if v.state == "stored"):
        cells.append(mk.computed(view.name, "Count", str(len(view.not_read))))
        if view.not_read:
            cells.append(mk.computed(view.name, "Names", "; ".join(view.not_read)))
    return cells


def _rating_limits(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    return [
        mk.computed(f"{v.name} / {parameter}", bucket, words)
        for v in run.views()
        for parameter, outcomes in v.rating_limits
        for bucket, words in outcomes
    ]


def _price_floors(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    return [
        mk.computed(f"{v.name} / {parameter}", "Floor", str(floor))
        for v in run.views()
        for parameter, floor in v.price_floors
    ]


def _median_matrix(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    return _median_cells(run, mk, only_median=False)


def _median_inputs(run: _Run, mk: _Maker) -> list[SnapshotCell]:
    return _median_cells(run, mk, only_median=True)


# --- gather ---------------------------------------------------------------------------------------

_BLOCKS: tuple[tuple[str, str, Builder], ...] = (
    ("Snapshot", "Header", _header),
    ("Snapshot", "Business description", _business),
    (
        *("Snapshot", "Operating model"),
        _copy_table(
            *("CP-1A", "operating_model"),
            ("Operating driver", "Measure", "Period", "Status", "Credit relevance"),
        ),
    ),
    (
        *("Snapshot", "Shareholders"),
        _copy_table(
            *("CP-1A", "ownership_register"),
            ("Owner / class", "Control", "Economic interest", "Credit relevance"),
        ),
    ),
    ("Snapshot", "Corporate ratings", _ratings),
    ("Snapshot", "Scorecard", _scorecard),
    ("Snapshot", "Assessments", _assessments),
    (
        *("Snapshot", "Transaction summary"),
        _copy_table(
            *("CP-1A", "transaction_summary"), ("Transaction", "Status", "Credit relevance")
        ),
    ),
    ("Snapshot", "New issue", _new_issue),
    ("Snapshot", "Capital structure", _capital_structure),
    ("Snapshot", "Capital structure totals", _totals),
    ("Snapshot", "Equity value", _analyst((("Equity value", "Value"), ("EV multiple", "Value")))),
    ("Snapshot", "EBITDA bridge", _bridge),
    ("Snapshot", "EBITDA measures", _measures),
    (
        *("Snapshot", "Near-term events"),
        _copy_table(
            *("CP-1A", "events_timeline"), ("Date / window", "Event", "Credit relevance", "Status")
        ),
    ),
    (
        *("Snapshot", "Monitoring triggers"),
        _copy_table(
            *("CP-2", "T2.12"),
            ("Trigger", "Threshold / Signal", "Why It Matters", "Credit Impact"),
        ),
    ),
    ("Snapshot", "Strengths and weaknesses", _strengths),
    ("Snapshot", "Historical performance", _historical),
    ("Snapshot", "Financials", _financials),
    ("Snapshot", "Peers", _peers),
    ("Snapshot", "Investment thesis", _analyst((("Thesis", "Value"),))),
    ("Inputs", "Credit Score", _credit_score),
    ("Inputs", "Instruments", _instruments),
    ("Inputs", "Market identifiers", _market),
    ("Inputs", "Quotes as entered", _quotes),
    ("Inputs", "Reference medians", _median_inputs),
    ("Matrix", "Reference status", _status),
    ("Matrix", "Reference medians", _median_matrix),
    ("Matrix", "Issuer weight", _weights),
    ("Matrix", "Breached sector limits", _breached),
    ("Matrix", "Limits not read", _unread),
    ("Matrix", "Rating limits", _rating_limits),
    ("Matrix", "Price floors", _price_floors),
)


def gather(run: SnapshotRun) -> Snapshot:
    """Every block of the workbook, structured, with provenance. Pure: the same run gives the same
    snapshot. A block whose module did not run is one gap line (or hidden, as noted per block); a
    malformed block is that block's gap with its reason, logged."""
    state = _Run(run)
    state.bridge_classifications = _classify(state)
    blocks = tuple(_block(state, sheet, name, build) for sheet, name, build in _BLOCKS)
    return Snapshot(
        issuer=run.issuer,
        as_of=run.as_of,
        pathway=run.pathway,
        pathway_title=pathway_title(run.pathway),
        run_id=run.run_id,
        blocks=blocks,
        basis_lines=tuple(state.basis),
        handoff_sha256={module: doc.sha256 for module, doc in state.docs.items()},
        scorecard=state.score.scorecard,
        credit_score=_credit(state),
        references=state.views(),
        source_sha256=(
            (
                {sheet.section: sheet.sha256 for sheet in run.market}
                if not isinstance(run.market, MarketGap)
                else {}
            )
            | {f"model:{name}": li.sha256(raw) for name, raw in run.model_files.items()}
        ),
        model_files=run.model_files,
        model_handoffs={"CP-1": run.handoffs["CP-1"]} if "CP-1" in run.handoffs else {},
        bridge_classifications=state.bridge_classifications,
    )


# --- load_run -------------------------------------------------------------------------------------

_SHA = re.compile(r"^[0-9a-f]{64}$")


def load_run(folder: Path, stores: Sequence[rp.Store]) -> SnapshotRun:
    """A finished run folder as a `SnapshotRun`. The folder must pass `report_completion` and
    `verified_delivery`, and every handoff is read through `read_pinned`: anything not verified
    raises `library_index.Refused`. `stores` is the standing reference store and, optionally, the
    run's own. The run's supplied sources (its context, any RV worksheet) are trusted only when
    `workflow.json` is the file the completion record names."""
    completion = li.report_completion(folder)
    delivered = li.verified_delivery(folder, completion)
    run = delivered["manifest"].get("run")
    if not isinstance(run, dict):
        raise li.Refused("the delivery manifest does not name its run")
    identity = li.run_identity(run)
    handoffs = {
        module: li.read_pinned(folder, pin["path"], pin["sha256"])
        for module, pin in delivered["handoffs"].items()
    }
    sources = _trusted_sources(folder, completion, identity)
    return SnapshotRun(
        issuer=identity["issuer_name"],
        as_of=identity["as_of"],
        pathway=identity["pathway"],
        run_id=identity["run_id"],
        handoffs=handoffs,
        context=_context(folder, sources, identity),
        references=_references(stores),
        market=_market_sheets(folder, sources),
        execution=_execution(completion),
        model_files={
            name: li.read_pinned(folder, f"{delivered['folder']}/{name}", delivered["files"][name])
            for name in (
                "calculation.json",
                "forecast_exact.json",
                "annual.md",
                "current_synthesis.md",
                "quarter.md",
                "forecast.md",
            )
            if name in delivered["files"]
        },
    )


def _execution(completion: Mapping[str, object]) -> dict[str, str]:
    """The completion record's `module_execution` as module -> word (text of any non-text value)."""
    held = completion.get("module_execution")
    if not isinstance(held, dict):
        return {}
    return {str(module): str(how) for module, how in held.items()}


def run_kind(execution: Mapping[str, str]) -> str:
    """How the run's modules were answered, in `library_index.EXECUTION_WORDS`' order joined with
    `; `. A module with a value the words do not name, or none recorded, gives `Not recorded`."""
    values = set(execution.values())
    words = [word for key, word in li.EXECUTION_WORDS.items() if key in values]
    if not execution or values - set(li.EXECUTION_WORDS):
        words.append("Not recorded")
    return "; ".join(words)


def _refused(reason: str) -> ContextGap:
    _LOG.warning("credit snapshot: the run's context is not used: %s", reason)
    return ContextGap(reason)


def _trusted_sources(
    folder: Path, completion: Mapping[str, object], identity: Mapping[str, str]
) -> Mapping[str, object] | str:
    """`workflow.json`'s `sources`, trusted only when the completion record's `workflow_sha256` is
    that file's hash: the reason (a sentence) when it is not. A workflow that names another run is
    refused, as `admit_run` refuses it."""
    raw = li.read_inside(folder, "workflow.json")
    workflow = li.json_object(raw, "workflow.json")
    li.same_identity(workflow.get("run"), identity, "workflow.json")
    if completion.get("workflow_sha256") != li.sha256(raw):
        return "the run's workflow record is not the one its completion record names"
    sources = workflow.get("sources")
    return sources if isinstance(sources, dict) else {}


def _context(
    folder: Path, sources: Mapping[str, object] | str, identity: Mapping[str, str]
) -> RunContext | ContextGap | None:
    """The context `workflow.json` pins. None when the run pins none; a `ContextGap` (logged) when
    the pin, the file or the context is not good."""
    if isinstance(sources, str):
        return _refused(f"{sources}, so the context it pins is not trusted")
    pin = sources.get("context")
    return None if pin is None else _pinned_context(folder, pin, identity)


def _pinned_context(
    folder: Path, pin: object, identity: Mapping[str, str]
) -> RunContext | ContextGap:
    digest = pin.get("sha256") if isinstance(pin, dict) else None
    if not isinstance(digest, str) or not _SHA.match(digest):
        return _refused("the pin for the run's context is malformed")
    try:
        context = load_context(li.read_pinned(folder, f"inputs/{digest}", digest))
    except li.Refused as error:
        return _refused(f"the pinned context file cannot be read: {error}")
    except ContextRefused as error:
        first = error.problems[0] if error.problems else str(error)
        return _refused(f"the pinned context file is not a valid context: {first}")
    if context.identity.issuer_name != identity["issuer_name"]:
        return _refused(
            f"the pinned context is for {context.identity.issuer_name}, "
            f"not for this run's issuer ({identity['issuer_name']})"
        )
    if (context.run.as_of, context.run.pathway) != (identity["as_of"], identity["pathway"]):
        return _refused(
            f"the pinned context is for {context.run.as_of} ({context.run.pathway}), "
            f"not for this run ({identity['as_of']}, {identity['pathway']})"
        )
    return context


def _references(
    stores: Sequence[rp.Store],
) -> tuple[tuple[rp.Reference, rp.Portfolio | StoreGap | None], ...]:
    if len(stores) > 2:
        raise ValueError("load_run takes at most a standing store and the run's own store")
    if not stores:
        return tuple((reference, None) for reference in rp.STANDING.values())
    standing, own = stores[0], (stores[1] if len(stores) > 1 else None)
    found = []
    for summary in rp.list_portfolios(standing, own):
        store = standing if summary.scope == "standing" else own
        reference = rp.STANDING.get(summary.key) if summary.scope == "standing" else None
        found.append(
            (reference or rp.custom(summary.name, key=summary.key), _stored(store, summary.key))
        )
    return tuple(found)


def _stored(store: rp.Store | None, key: str) -> rp.Portfolio | StoreGap | None:
    if store is None:
        return None
    try:
        return store.load(key)
    except rp.NotStored:
        return None
    except rp.StoreError as error:  # shown in the reference's column, with the store's sentence
        _LOG.warning("credit snapshot: reference %s cannot be read: %s", key, error)
        return StoreGap(str(error))


# --- The run's RV worksheet -----------------------------------------------------------------------


def _market_sheets(
    folder: Path, sources: Mapping[str, object] | str
) -> tuple[MarketSheet, ...] | MarketGap:
    """Every pinned source (the context aside) that is an RV worksheet: a CSV or a workbook sheet
    whose first non-empty row has `FIGI`, `Bloomberg ID` and `Company` or `Borrower Name` headers.
    A source that cannot be read as a sheet is skipped with a logged reason (the documented
    fail-open: a PDF or a text file is a source too); a pin that did not verify gives no sheet."""
    if isinstance(sources, str):
        reason = f"{sources}, so the sources it pins are not trusted"
        _LOG.warning("credit snapshot: no market data sheet is read: %s", reason)
        return MarketGap(reason)
    found = []
    for name, pin in sources.items():
        sheet = None if name == "context" else _market_source(folder, name, pin)
        if sheet is not None:
            found.append(sheet)
    return tuple(found)


def _market_source(folder: Path, name: str, pin: object) -> MarketSheet | None:
    digest = pin.get("sha256") if isinstance(pin, dict) else None
    if not isinstance(digest, str) or not _SHA.match(digest):
        _LOG.warning("credit snapshot: source %s is skipped: its pin is malformed", name)
        return None
    try:
        raw = li.read_pinned(folder, f"inputs/{digest}", digest)
    except li.Refused as error:
        _LOG.warning("credit snapshot: source %s is skipped: %s", name, error)
        return None
    path = pin["path"] if isinstance(pin, dict) and isinstance(pin.get("path"), str) else name
    file = str(path)
    try:
        with pe.reading():  # this workbook is parsed once, then released before the next source
            for tab, rows in _source_rows(raw):
                sheet = market_sheet(file, digest, rows, tab=tab)
                if sheet is not None:
                    return sheet
    except (csv.Error, ValueError) as error:
        _LOG.warning(
            "credit snapshot: source %s is skipped: it cannot be read as a sheet: %s", name, error
        )
        return None
    _LOG.info("credit snapshot: source %s is not an RV worksheet", name)
    return None


Cells = Sequence[tuple[int, Sequence[pe.Cell]]]


def _filled(cells: Sequence[pe.Cell]) -> bool:
    return any(cell.text.strip() for cell in cells)


def _capped(rows: Cells) -> Cells:
    """`rows`, or `ValueError` when more than `reference_portfolios.MAX_ROWS` have text."""
    if sum(1 for _, cells in rows if _filled(cells)) > rp.MAX_ROWS:
        raise ValueError(f"the sheet has more than {rp.MAX_ROWS:,} rows")
    return rows


def _has_rv_head(rows: Cells) -> bool:
    first = next((cells for _, cells in rows if _filled(cells)), None)
    return first is not None and _market_index(first) is not None


def _rv_workbook_tabs(raw: bytes) -> list[tuple[str | None, Cells]]:
    sheets: list[tuple[str | None, Cells]] = []
    refused = None
    with pe.reading(cached_formulas=True):  # a formula is its stored value, blank when none
        for name in pe.workbook_sheets(raw):
            rows = pe.sheet_rows(raw, name, exact=True)
            if rows is None or not _has_rv_head(rows):
                continue
            try:
                sheets.append((name, _capped(rows)))
            except ValueError as error:
                refused = error
                _LOG.warning("credit snapshot: RV tab %s is skipped: %s", name, error)
    if not sheets and refused is not None:
        raise refused
    return sheets


def _source_rows(raw: bytes) -> list[tuple[str | None, Cells]]:
    """The exact workbook titles with their rows, or a CSV's rows with no title. CSV cells are as
    entered and use the record number. A CSV whose first populated row lacks the RV headers gives
    no sheet. An oversized RV tab is refused independently of other tabs."""
    if raw.startswith(b"PK\x03\x04"):
        return _rv_workbook_tabs(raw)
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    rows: list[tuple[int, list[pe.Cell]]] = []
    filled = 0
    for number, row in enumerate(csv.reader(io.StringIO(text)), 1):
        cells = [pe.Cell(cell) for cell in row]
        if _filled(cells):
            if filled == 0 and _market_index(cells) is None:
                return []
            filled += 1
            if filled > rp.MAX_ROWS:
                raise ValueError(f"the sheet has more than {rp.MAX_ROWS:,} rows")
        rows.append((number, cells))
    return [(None, rows)]


_SLASH_DATE = re.compile(r"\d{1,2}/\d{1,2}/\d{4}")


def read_day(text: str) -> date | None:
    """A maturity as one date, surrounding spaces ignored on both sides of a join: a full-year
    form `portfolio_export` reads, else the sheet's `27-Jun-32` (`%y`: 2000-2068 for 00-68). A
    slash date (`dd/dd/dddd`) is unreadable: its day and month order is not stated."""
    text = text.strip()
    if _SLASH_DATE.fullmatch(text):
        return None
    found = pe.text_date(text)
    if found is not None:
        return found
    try:
        return datetime.strptime(text, "%d-%b-%y").date()
    except ValueError:
        return None


def _unreadable(text: str, day: date | None) -> bool:
    """A maturity that is stated (not empty, not a vendor error token) but gave no date."""
    stated = text.strip()
    return day is None and bool(stated) and not pe.TOKEN.match(stated)


def _maturity(cell: pe.Cell) -> date | None:
    """A sheet maturity: a date cell as `portfolio_export` reads it, else `read_day` of its text."""
    return pe.read_date(cell) if cell.date_format else read_day(cell.text)


def _market_index(head: Sequence[pe.Cell]) -> dict[str, int] | None:
    """Where each RV column is in the header row, or None when a header is missing or repeated."""
    heads = [_fold(cell.text) for cell in head]
    index: dict[str, int] = {}
    for column in MARKET_COLUMNS:
        hits = [i for i, name in enumerate(heads) if name == _fold(column)]
        if len(hits) > 1:
            return None
        if hits:
            index[column] = hits[0]
    if (
        not {"FIGI", "Bloomberg ID"} <= index.keys()
        or not {"Company", "Borrower Name"} & index.keys()
    ):
        return None
    return index


def market_sheet(
    file: str, sha256: str, rows: Cells, *, tab: str | None = None
) -> MarketSheet | None:
    """`rows` as an RV worksheet, or None when its first non-empty row lacks the headers (compared
    ignoring case and spaces) or repeats one of them."""
    start = next((i for i, (_, cells) in enumerate(rows) if _filled(cells)), None)
    if start is None:
        return None
    index = _market_index(rows[start][1])
    if index is None:
        return None
    body = []
    for number, cells in rows[start + 1 :]:
        if not _filled(cells):
            continue
        held = {
            column: cells[index[column]]
            if column in index and index[column] < len(cells)
            else pe.Cell("")
            for column in MARKET_COLUMNS
        }
        texts = {
            column: (cell.text if not cell.date_format else _shown(cell))
            for column, cell in held.items()
        }
        day = _maturity(held["Maturity"])
        body.append(MarketRow(number, texts, day, _unreadable(texts["Maturity"], day)))
    return MarketSheet(file, sha256, tuple(body), tab=tab)


def _shown(cell: pe.Cell) -> str:
    """A date cell's text as the date it holds (its text is the serial number)."""
    found = pe.read_date(cell)
    return cell.text if found is None else found.isoformat()
