"""Reference portfolios: dated, typed holdings and limits an issuer's loans and bonds are read
against (spec 2026-11-25-deliverables-credit-snapshot, sections 4.4 to 4.6).

Three standing references (`STANDING`: a CLO portfolio, a loan-index fund and a high-yield fund)
and any portfolio an analyst supplies for a run. This module reads their files into a
`Portfolio`, keeps one good set per key in a `Store`, and answers the questions later code asks:
`list_portfolios`, `rows`, `issuer_weight`, `limits`. It fetches nothing and scores nothing.

Reading is the fund export's (`deploy_vii.inputs.portfolio_export`): its files' roles, its cells
and its rating scale; figures and dates are read here, more strictly (below). A CLO pack is the
holdings (a CSV file or a workbook sheet) with, when supplied, the constraints and the mandate (as
files or as sheets of the holdings workbook). A fund's daily holdings workbook is read by its
header row alone: the row is found by the field words it holds (`_FIELD_WORDS`), every field is
optional, and `Portfolio.columns_found` and `columns_missing` say which were there. The layout
of the real fund files was NOT verified when this was written (they could not be fetched), so
nothing here depends on a row number, a column position or an exact header text.

Nothing is coerced. A blank cell (or a dash or `n/a`) is missing (None) and `0` is zero; a vendor
error marker (`#N/A N/A`) or a cell that is not a number or a date is missing and flagged on its
position; a row with no price is kept and flagged; amounts are the digits the file holds, as
`Decimal`. A figure is a plain number (digits, comma thousands separators, a leading minus; a
trailing % in a weight, coupon or yield): `<5`, `5 bps`, `1.5m` or `1,000 EUR` is not one. A
figure's unit is the file's (a margin of 300 is what the file wrote, not converted); the one
reading applied is a workbook cell shown as a percentage, taken as the percentage shown (0.625
shown as 62.50% is 62.5). A formula cell is the value stored with it; with none stored it is
missing and flagged. The as-of date is the files' own, or None with a finding; the stored time is
the caller's.

Dates: a workbook's date cells count from its own epoch (1904 when the workbook says so). Text
dates are ISO, `24-Nov-2026`, `24 Nov 2026`, `Nov 24, 2026` and the same with the month written
out, or numeric `03/04/2026`. A numeric date is read in the reference's `date_order`; with none
known, one whose day and month could be either way round is no date (an as-of date is then None
with a finding naming both readings; a maturity is missing and flagged). An as-of year outside
2000 to 2100 is not read.

The table (`_positions`): every row under the header until a run of two or more rows with no
text after a position; rows after that are below the table. In it, a position is a row with a
name and one other field (in an export's holdings, any filled row, and its table runs to the end
of the sheet). A row whose name (or, with no name, first filled cell) is a total, a subtotal, a
sum, a source, a note or a disclaimer, or is a sentence (four words or more, ending in a full stop
or the like, most of them in lower case), is not a position however many figures it holds; nor,
outside an export's holdings, is a row with no other field (a section heading). Each such row is
counted in a finding, as are rows with text below the last position.

Each file is parsed once per read (`portfolio_export.reading`); a holdings table of more than
`MAX_ROWS` rows is refused, and a cell far to the right of the rest of its row is not read
(`portfolio_export.FAR_COLUMNS`). Whatever fails in reading a file's content is a
`PortfolioFileError` worded for a reader.
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import stat
import tempfile
from collections.abc import Callable, Iterator, Mapping, Sequence
from contextlib import contextmanager
from dataclasses import dataclass, fields, is_dataclass, replace
from datetime import UTC, date, datetime, timedelta
from decimal import Context, Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Literal, NamedTuple

from deploy_vii.inputs import portfolio_export as pe
from deploy_vii.inputs.csv_text import CsvDecodeError
from deploy_workflow.platform_io import flags, regular_open

Kind = Literal["clo", "loan_index", "hy_index", "custom"]
AssetType = Literal["loan", "bond"]
Measure = Literal["discount_margin", "margin", "spread"]
Basis = Literal["stated_weight", "market_value"]
Scope = Literal["standing", "run"]
DateOrder = Literal["month_first", "day_first"]
MatchedBy = Literal["name", "name_without_legal_form", "identifier"]

MAX_ROWS = 50_000  # rows with text under a holdings header; a larger table is refused

SCHEMA = 2  # the stored file's version; a file of another version is reported, never guessed at
READS = (1, SCHEMA)  # 1: written before `Quantity.strict`, read through `_schema_1`
BUCKET_NAMES: tuple[str, ...] = (*(name for name, _ in pe.BUCKETS), "Unrated")

# Position flags. `ERROR_MARKER` and `UNREADABLE` are followed by `:` and the field's name.
UNPRICED = "unpriced"  # the file has price columns and the row has no mid price or market value
ERROR_MARKER = "error_marker"  # a vendor error marker (`#N/A N/A`) in the cell: missing
UNREADABLE = "unreadable"  # the cell is not a number (or, for a maturity, a date): missing
FIGI_MALFORMED = "figi_malformed"  # not 12 capital letters and digits: no FIGI
RATING_UNREAD = "rating_unread"  # a rating on neither agency's scale: bucket Unrated
BUCKET_DIFFERS = "rating_bucket_differs"  # the file's own bucket is not the rating's bucket
MARKET_VALUE_AT_MID = "market_value_at_mid"  # no market value column: par x mid price / 100
# Followed by `:` and the field's name, as `ERROR_MARKER` and `UNREADABLE` are.
AMBIGUOUS_DATE = "date_ambiguous"  # a numeric date that reads day or month first: missing
NO_VALUE = "formula_without_value"  # a formula cell with no value stored with it: missing

# A position's fields that a file's column can supply, in the order they are reported.
FIELDS: tuple[str, ...] = (
    *("borrower", "instrument", "figi", "ticker", "cusip", "isin", "sedol", "identifier"),
    *("sector", "rating", "stated_bucket", "ranking", "lien", "par", "market_value", "currency"),
    *("weight", "margin", "discount_margin", "coupon", "ytm", "maturity", "bid", "ask"),
    "mid_price",
)


class PortfolioFileError(ValueError):
    """The files are not a portfolio that can be read; the message is worded for a reader."""


class _NoNameColumn(PortfolioFileError):
    """A header row that names three fields but not the holding's name; `data_rows` is the number
    of non-empty rows under it."""

    def __init__(self, message: str, data_rows: int = 0) -> None:
        super().__init__(message)
        self.data_rows = data_rows


class StoreError(Exception):
    """A stored portfolio cannot be read; the message is worded for a reader."""


class NotStored(StoreError):
    """No set is stored under the key."""


# --- The model -----------------------------------------------------------------------------------


@dataclass(frozen=True)
class Reference:
    """What a portfolio is, before any file is read. `asset_type` is what its holdings are when
    the file does not say; `ticker` and `url` are a fund's (`url` its daily holdings workbook).
    `date_order` is how its files write a numeric date (`03/04/2026`), None when that is not
    known: then a date that reads either way round is not read."""

    key: str
    name: str
    kind: Kind
    asset_type: AssetType | None = None
    ticker: str | None = None
    url: str | None = None
    date_order: DateOrder | None = None


_FUND_FILES = "https://www.ssga.com/library-content/products/fund-data/etfs/us/"
CLO = Reference("clo", "CLO portfolio", "clo", "loan")
# The two funds' files are the US-English ones (`holdings-daily-us-en-...`), so a numeric date in
# them is taken as month first. That is an ASSUMPTION: no real file was read to confirm it.
LVLN = Reference(
    *("lvln", "Loan index fund (LVLN)", "loan_index", "loan", "LVLN"),
    _FUND_FILES + "holdings-daily-us-en-lvln.xlsx",
    "month_first",
)
JNK = Reference(
    *("jnk", "High-yield bond fund (JNK)", "hy_index", "bond", "JNK"),
    _FUND_FILES + "holdings-daily-us-en-jnk.xlsx",
    "month_first",
)
STANDING: Mapping[str, Reference] = {item.key: item for item in (CLO, LVLN, JNK)}


def custom(name: str, *, key: str = "custom", asset_type: AssetType | None = None) -> Reference:
    """A portfolio an analyst supplies for a run."""
    return Reference(key, name, "custom", asset_type)


@dataclass(frozen=True)
class Position:
    """One holdings row. Every field but `row`, `rating_bucket` and `flags` is None when the file
    has no such column, the cell is blank or the cell could not be read (then `flags` says so).

    `rating` is the cell as given and `rating_bucket` the project's scale applied to it
    (`BUCKET_NAMES`; Moody's when it rates the holding, else S&P); `stated_bucket` is the file's
    own bucket column. `margin` is the margin or spread column and `discount_margin`, `coupon` and
    `ytm` theirs, each in the file's unit. `weight` is the stated percentage. `mid_price` is the
    file's, else (bid + ask) / 2; `market_value` the file's, else par x mid price / 100 when the
    file has no market value column (flag `market_value_at_mid`). `currency` is the row's and
    `market_value_currency` the one the market value is in (its column's, else the row's).
    `lien` is first, second or unsecured."""

    row: int
    borrower: str | None = None
    instrument: str | None = None
    figi: str | None = None
    ticker: str | None = None
    cusip: str | None = None
    isin: str | None = None
    sedol: str | None = None
    identifier: str | None = None  # a column named only "Identifier"
    asset_type: AssetType | None = None
    sector: str | None = None
    rating: str | None = None
    rating_bucket: str = "Unrated"
    stated_bucket: str | None = None
    ranking: str | None = None
    lien: str | None = None
    par: Decimal | None = None
    market_value: Decimal | None = None
    currency: str | None = None
    market_value_currency: str | None = None
    weight: Decimal | None = None
    margin: Decimal | None = None
    discount_margin: Decimal | None = None
    coupon: Decimal | None = None
    ytm: Decimal | None = None
    maturity: date | None = None
    bid: Decimal | None = None
    ask: Decimal | None = None
    mid_price: Decimal | None = None
    flags: tuple[str, ...] = ()

    @property
    def identifiers(self) -> tuple[str, ...]:
        """Every identifier the row carries: FIGI, ticker, CUSIP, ISIN, SEDOL, other."""
        found = (self.figi, self.ticker, self.cusip, self.isin, self.sedol, self.identifier)
        return tuple(item for item in found if item is not None)


@dataclass(frozen=True)
class Limit:
    """A constraints row as given ("" for an empty cell), and the limit's figure where
    `portfolio_export.quantity` reads one (`≤ 2.5% NAV`), else None (`Info only`)."""

    source: str
    row: int
    category: str
    parameter: str
    limit: str
    breach_type: str
    current_exposure: str
    headroom: str
    observed_status: str
    notes: str
    quantity: pe.Quantity | None = None


@dataclass(frozen=True)
class MandateRow:
    row: int
    section: str
    field: str
    value: str
    notes: str


@dataclass(frozen=True)
class SourceFile:
    name: str
    sha256: str


@dataclass(frozen=True)
class Portfolio:
    """A reference portfolio as read from its files. `as_of` is the date the files state (None,
    with a finding, when they state none). `stored_at` is when the caller fetched or stored the
    files, in UTC. `stated_name` and `stated_ticker` are the fund the file itself names.
    `columns_found` pairs each field read with its header as written; `columns_missing` are the
    fields no column supplied. `findings` are sentences for a reader."""

    key: str
    name: str
    kind: Kind
    as_of: date | None
    stored_at: datetime
    sources: tuple[SourceFile, ...]
    positions: tuple[Position, ...]
    limits: tuple[Limit, ...] = ()
    mandate: tuple[MandateRow, ...] = ()
    stated_name: str | None = None
    stated_ticker: str | None = None
    columns_found: tuple[tuple[str, str], ...] = ()
    columns_missing: tuple[str, ...] = ()
    findings: tuple[str, ...] = ()


# --- Columns -------------------------------------------------------------------------------------

Grid = Sequence[tuple[int, list[pe.Cell]]]

# Each field's header words, most telling field first: a header cell is given to the first field
# one of whose phrases it is whole, else holds as whole words, so `Rating Bucket` is never the
# rating and `Mid Price (per 100 par)` never the par. These are guesses at how a file may name a
# column, not a known layout. The yield is a yield to maturity or to worst only: a bare `Yield`
# could be either or a current yield, and is not read.
_FIELD_WORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("figi", ("figi",)),
    ("cusip", ("cusip",)),
    ("isin", ("isin",)),
    ("sedol", ("sedol",)),
    ("ticker", ("ticker", "symbol")),
    ("identifier", ("identifier", "security id")),
    ("stated_bucket", ("rating bucket",)),
    ("rating", ("rating", "ratings")),
    ("weight", ("weight", "of net assets", "of fund", "share of", "allocation")),
    ("market_value", ("market value", "mv")),
    ("mid_price", ("mid price", "price")),
    ("bid", ("bid",)),
    ("ask", ("ask", "offer")),
    ("par", ("par", "principal", "face", "notional", "holdings", "quantity", "shares")),
    ("currency", ("currency",)),
    ("coupon", ("coupon",)),
    ("discount_margin", ("discount margin", "dm")),
    ("margin", ("margin", "spread")),
    ("ytm", ("yield to maturity", "yield to worst", "ytm", "ytw")),
    ("maturity", ("maturity",)),
    ("sector", ("sector", "industry")),
    ("lien", ("lien",)),
    ("ranking", ("ranking", "seniority")),
    (
        "instrument",
        ("security name", "security description", "description", "loan name", "instrument"),
    ),
    ("borrower", ("issuer", "borrower", "obligor", "company", "name", "security")),
)
# The export's own holdings columns (`portfolio_export.holdings_header`) under this module's names.
_EXPORT_FIELDS: Mapping[str, str] = {
    **{name: name for name in ("ticker", "borrower", "sector", "figi", "ranking", "margin")},
    **{name: name for name in ("maturity", "bid", "ask", "ytm", "par")},
    "loan": "instrument",
    "ratings": "rating",
    "dm": "discount_margin",
}
# A header holding one of these words is never the field's column: a sub-sector is not the
# sector, a spread duration not the spread, a yield to maturity not the maturity, a price per 100
# par not the par.
_NOT_FIELD: Mapping[str, frozenset[str]] = {
    "sector": frozenset({"sub"}),
    "margin": frozenset({"duration"}),
    "maturity": frozenset({"yield"}),
    "par": frozenset({"price"}),
    "mid_price": frozenset({"bid", "ask", "offer"}),
    "borrower": frozenset({"type"}),
}
_NAMES = ("borrower", "instrument")
_AMOUNTS = ("weight", "par", "market_value")
_PRICES = ("bid", "ask", "mid_price", "market_value")
_PAR_WORDS = frozenset({"par", "principal", "face", "notional", "holdings"})
_HEADER_WITHIN = 60  # rows searched for the header row
_HEADER_LEAST = 3  # fields a row must name to be the header row
_WORD = re.compile(r"[a-z0-9]+")
_CURRENCY = re.compile(r"\b(USD|EUR|GBP)\b")


def _words(text: str) -> tuple[str, ...]:
    return tuple(_WORD.findall(text.casefold()))


def _holds(words: Sequence[str], phrase: Sequence[str]) -> bool:
    size = len(phrase)
    return any(tuple(words[i : i + size]) == tuple(phrase) for i in range(len(words) - size + 1))


def _says_mid(name: str, words: Sequence[str]) -> bool:
    """A header that says `mid` is the mid price however many sides it also names
    (`Mid Price (bid/ask average)`)."""
    return name == "mid_price" and "mid" in words


def _field_column(
    cells: Sequence[tuple[str, ...]],
    name: str,
    phrases: Sequence[str],
    used: set[int],
    *,
    whole: bool,
) -> int | None:
    """The first unused cell that is one of `phrases` whole (`whole`), else the first holding
    one."""
    refused = _NOT_FIELD.get(name, frozenset())
    free = [
        i
        for i, words in enumerate(cells)
        if i not in used and not (refused & set(words) and not _says_mid(name, words))
    ]
    for phrase in phrases:
        wanted = tuple(phrase.split())
        for index in free:
            if cells[index] == wanted or (not whole and _holds(cells[index], wanted)):
                return index
    return None


def _map_columns(header: Sequence[str], known: Mapping[str, int]) -> dict[str, int]:
    """The column of each field `header` names, beside the columns already `known`."""
    cells = [_words(text) for text in header]
    found, used = dict(known), set(known.values())
    for whole in (True, False):  # every field's exact header is taken before any loose match
        for name, phrases in _FIELD_WORDS:
            if name in found:
                continue
            index = _field_column(cells, name, phrases, used, whole=whole)
            if index is not None:
                found[name] = index
                used.add(index)
    if "borrower" not in found and "instrument" in found:
        found["borrower"] = found["instrument"]  # one name column names both
    return found


@dataclass(frozen=True)
class _Table:
    """A holdings table: the file's rows, its header row's number and each field's column.
    `whole`: every filled row under the header is a holding (the export's rule) unless it is a
    total or a note; otherwise see `_positions`. `far`: cells of the sheet left out for being far
    to the right of the rest of their row. `skipped`: the sheets of a workbook passed over."""

    file: str
    rows: Grid
    start: int
    columns: Mapping[str, int]
    header: Sequence[str]
    whole: bool = False
    far: int = 0
    skipped: tuple[str, ...] = ()  # sheets passed over, each with the reason

    @property
    def priced(self) -> bool:
        return any(name in self.columns for name in _PRICES)

    @property
    def value_currency(self) -> str | None:
        """The currency the market value column's header names (`Market Value (USD)`)."""
        index = self.columns.get("market_value")
        found = None if index is None else _CURRENCY.search(self.header[index])
        return None if found is None else found[1]


def _holdings_parts(files: Mapping[str, bytes]) -> list[pe.Part]:
    """The export's holdings parts among `files`, with a holdings CSV that is not one because no
    mandate or constraints file is beside it: a pack of holdings alone is still a pack."""
    known = pe.parts(files)
    named = {part.file for part in known}
    found = [part for part in known if part.role == "holdings"]
    for name in sorted(set(files) - named):
        if name.lower().endswith(".csv") and pe.is_holdings(rows := pe.csv_rows(files[name])):
            numbered = tuple((number, tuple(row)) for number, row in enumerate(rows, 1))
            found.append(pe.Part(name, None, "holdings", numbered))
    return sorted(found, key=lambda part: part.file)  # stable: a workbook's sheets keep order


def _export_table(files: Mapping[str, bytes]) -> _Table | None:
    """The holdings of a pack in the export's shape: the first holdings part whose header has a
    borrower and a par column."""
    for part in _holdings_parts(files):
        rows: Grid = (
            [(number, [pe.Cell(text) for text in row]) for number, row in part.rows]
            if part.sheet is None
            else pe.sheet_rows(files[part.file], part.sheet) or []
        )
        found = pe.holdings_header(rows)
        if found is None or "par" not in found[1]:
            continue
        start, columns = found
        header = [cell.text for cell in dict(rows)[start]]
        known = {_EXPORT_FIELDS[k]: i for k, i in columns.items() if k in _EXPORT_FIELDS}
        far = 0 if part.sheet is None else pe.far_cells(files[part.file], part.sheet)
        return _Table(part.file, rows, start, _map_columns(header, known), header, True, far)
    return None


def _data_rows(rows: Grid, header: int) -> int:
    """The non-empty rows under the header row numbered `header`."""
    return sum(1 for n, cells in rows if n > header and any(c.text.strip() for c in cells))


def _header_table(file: str, rows: Grid) -> _Table | None:
    """The table under the first row naming at least `_HEADER_LEAST` fields, or None when no row
    does. A header with no name column, or with no weight, par or market value, is an error."""
    for number, cells in rows[:_HEADER_WITHIN]:
        header = [cell.text for cell in cells]
        columns = _map_columns(header, {})
        if len(set(columns.values())) < _HEADER_LEAST:
            continue
        if not any(name in columns for name in _NAMES):
            raise _NoNameColumn(
                f"{file}: the header row (row {number}) has no column for the holding's name.",
                _data_rows(rows, number),
            )
        if not any(name in columns for name in _AMOUNTS):
            raise PortfolioFileError(
                f"{file}: the header row (row {number}) has no column for "
                "a weight, par or market value."
            )
        return _Table(file, rows, number, columns, header)
    return None


_NO_HEADER = "{} has no header row naming a holding and its weight, par or market value."


def _workbook_table(file: str, raw: bytes) -> _Table:
    sheets = pe.workbook_sheets(raw)
    if not sheets:
        raise PortfolioFileError(f"{file} cannot be read as an Excel workbook.")
    first: PortfolioFileError | None = None
    skipped: list[str] = []
    largest = 0  # data rows of the biggest sheet passed over
    for sheet in sheets:
        rows = pe.sheet_rows(raw, sheet) or []
        try:
            table = _header_table(file, rows)
        except _NoNameColumn as error:  # this sheet is not the holdings: try the next
            first = first or error
            largest = max(largest, error.data_rows)
            skipped.append(f"Sheet '{sheet}' was not read as holdings: {error}")
            continue
        if table is not None:
            if first is not None and largest >= _data_rows(rows, table.start):
                break  # a sheet passed over is as big: it may be the holdings, so refuse
            return replace(table, far=pe.far_cells(raw, sheet), skipped=tuple(skipped))
    if first is not None:
        raise PortfolioFileError(str(first)) from first
    raise PortfolioFileError(_NO_HEADER.format(file))


def _any_table(files: Mapping[str, bytes]) -> _Table:
    """A holdings table in any file that is not a mandate, constraints or exposure CSV."""
    found = pe.parts(files)
    other = {part.file for part in found if part.sheet is None and part.role != "holdings"}
    reasons: list[str] = []
    for name in sorted(set(files) - other):
        try:
            if name.lower().endswith(".xlsx"):
                return _workbook_table(name, files[name])
            if not name.lower().endswith(".csv"):
                raise PortfolioFileError(f"{name} is not a .xlsx or .csv file.")
            lines = enumerate(pe.csv_rows(files[name]), 1)
            table = _header_table(name, [(n, [pe.Cell(t) for t in row]) for n, row in lines])
            if table is not None:
                return table
            reasons.append(_NO_HEADER.format(name))
        except PortfolioFileError as error:
            reasons.append(str(error))
    raise PortfolioFileError(" ".join(["No holdings table was found.", *reasons]))


# --- Cells ---------------------------------------------------------------------------------------


# A plain number: digits, comma thousands separators, a decimal part, a leading minus.
_PLAIN = re.compile(r"^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$")
_PERCENT_FIELDS = frozenset({"weight", "coupon", "ytm"})  # may end in a percent sign


def _number(cell: pe.Cell, *, percent: bool = False) -> Decimal | None:
    """A cell's figure: a workbook number as stored (a percent cell as the percentage shown), or
    text that is a plain number (`_PLAIN`; with `percent`, it may end in %). None otherwise:
    `<5`, `5 bps`, `1.5m`, `1,000 EUR` and `(1,000)` are not figures."""
    if not cell.numeric:
        text = cell.text.removesuffix("%").rstrip() if percent else cell.text
        return Decimal(text.replace(",", "")) if _PLAIN.match(text) else None
    try:
        value = Decimal(cell.text)
    except InvalidOperation:
        return None
    if not value.is_finite():
        return None
    return pe.EXACT.multiply(value, pe.HUNDRED) if cell.percent_format else value


class _Dated(NamedTuple):
    """A cell read as a date. `both`: a numeric date that reads either way round, day first and
    month first (then `when` is None)."""

    when: date | None
    both: tuple[date, date] | None = None


_NAMED_DATES = (
    *("%Y-%m-%d", "%d-%b-%Y", "%d %b %Y", "%b %d, %Y"),
    *("%d-%B-%Y", "%d %B %Y", "%B %d, %Y"),
)
_NUMERIC_DATE = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")


def _day(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None


def _dated(cell: pe.Cell, order: DateOrder | None) -> _Dated:
    """A date cell (by its workbook's epoch), or a text date in one of `_NAMED_DATES` or numeric
    in `order`; with no order, a numeric date valid either way round and different is `both`."""
    if cell.date_format:
        return _Dated(pe.read_date(cell))
    text = " ".join(cell.text.split())
    for pattern in _NAMED_DATES:
        try:
            return _Dated(datetime.strptime(text, pattern).date())
        except ValueError:
            continue
    found = _NUMERIC_DATE.match(text)
    if found is None:
        return _Dated(None)
    first, second, year = (int(part) for part in found.groups())
    day_first, month_first = _day(year, second, first), _day(year, first, second)
    if order is not None:
        return _Dated(month_first if order == "month_first" else day_first)
    if day_first is not None and month_first is not None and day_first != month_first:
        return _Dated(None, (day_first, month_first))
    return _Dated(day_first or month_first)


_BLANK = pe.NOT_APPLICABLE | {""}  # an empty cell, or one that says not applicable (a dash, n/a)


def _all_tokens(rating: str) -> bool:
    """Every filled agency part of a Ratings cell is a vendor error token."""
    return all(pe.TOKEN.match(part.strip()) for part in pe.agency_parts(rating) if part.strip())


class _Cells:
    """One row's cells by field. A blank or not-applicable cell is None; an error marker, a
    formula with no stored value or a cell that cannot be read is None and adds a flag."""

    def __init__(
        self, cells: Sequence[pe.Cell], columns: Mapping[str, int], order: DateOrder | None
    ) -> None:
        self._cells = cells
        self._columns = columns
        self._order = order
        self.flags: list[str] = []

    def _cell(self, name: str) -> pe.Cell | None:
        index = self._columns.get(name)
        if index is None or index >= len(self._cells):
            return None
        cell = self._cells[index]
        if cell.formula and not cell.text:
            self.flags.append(f"{NO_VALUE}:{name}")
            return None
        if pe.folded(cell.text) in _BLANK:
            return None
        # A token-led Ratings cell keeps its other agency (`#N/A N/A / B+`); `_bucket` reads it.
        # One whose every agency part is a token (`#N/A N/A / #N/A N/A`) has none to keep.
        if pe.TOKEN.match(cell.text) and (name != "rating" or _all_tokens(cell.text)):
            self.flags.append(f"{ERROR_MARKER}:{name}")
            return None
        return cell

    def text(self, name: str) -> str | None:
        cell = self._cell(name)
        return None if cell is None else cell.text

    def number(self, name: str) -> Decimal | None:
        cell = self._cell(name)
        value = None if cell is None else _number(cell, percent=name in _PERCENT_FIELDS)
        if cell is not None and value is None:
            self.flags.append(f"{UNREADABLE}:{name}")
        return value

    def when(self, name: str) -> date | None:
        cell = self._cell(name)
        if cell is None:
            return None
        found = _dated(cell, self._order)
        if found.both is not None:
            self.flags.append(f"{AMBIGUOUS_DATE}:{name}")
        elif found.when is None:
            self.flags.append(f"{UNREADABLE}:{name}")
        return found.when


def _figi(read: _Cells) -> str | None:
    marked = len(read.flags)
    text = read.text("figi")
    if text is not None and pe.FIGI.match(text):
        return text
    if text is not None or len(read.flags) > marked:
        read.flags.append(FIGI_MALFORMED)
    return None


def _bucket(rating: str) -> str:
    """The project's bucket for a rating cell: `Moody's / S&P` as the export reads it, or one
    rating on either agency's scale."""
    for text in (rating, f"{rating} / {rating}"):
        found = pe.rating_bucket(pe.Holding(0, "", {"ratings": text}, {}))
        if found != "Unrated":
            return found
    return "Unrated"


def _rating(read: _Cells) -> tuple[str | None, str, str | None]:
    """The rating as given, its bucket and the file's own bucket."""
    rating = read.text("rating")
    bucket = "Unrated" if rating is None else _bucket(rating)
    if rating is not None and bucket == "Unrated":
        # Each agency part is a vendor token (missing), a not-rated mark, a rating, or unread.
        agencies = [part.strip() for part in pe.agency_parts(rating) if part.strip()]
        if any(pe.TOKEN.match(part) for part in agencies):
            read.flags.append(f"{ERROR_MARKER}:rating")
        if any(not pe.TOKEN.match(part) and not pe.not_rated(part) for part in agencies):
            read.flags.append(RATING_UNREAD)
    stated = read.text("stated_bucket")
    if stated is not None and (pe.label_bucket(stated) or stated) != bucket:
        read.flags.append(BUCKET_DIFFERS)
    return rating, bucket, stated


def _lien(*cells: str | None) -> str | None:
    """first, second or unsecured from the first cell that says (`portfolio_export.lien`)."""
    for text in cells:
        if text is not None:
            found = pe.lien(pe.Holding(0, "", {"ranking": text}, {}))
            if found != "unclassified":
                return found
    return None


class _Priced(NamedTuple):
    par: Decimal | None
    value: Decimal | None
    bid: Decimal | None
    ask: Decimal | None
    mid: Decimal | None


def _priced(read: _Cells, table: _Table) -> _Priced:
    par, value = read.number("par"), read.number("market_value")
    bid, ask, mid = read.number("bid"), read.number("ask"), read.number("mid_price")
    if mid is None and bid is not None and ask is not None:
        mid = pe.EXACT.divide(pe.EXACT.add(bid, ask), Decimal(2))
    if "market_value" not in table.columns and par is not None and mid is not None:
        value = pe.EXACT.divide(pe.EXACT.multiply(par, mid), pe.HUNDRED)
        read.flags.append(MARKET_VALUE_AT_MID)
    if table.priced and mid is None and value is None:
        read.flags.append(UNPRICED)
    return _Priced(par, value, bid, ask, mid)


def _position(number: int, cells: Sequence[pe.Cell], table: _Table, of: Reference) -> Position:
    """The row as a position. Flags come in the order the cells are read: identifiers, rating,
    par, market value and prices, then weight, margins, coupon, yield and maturity."""
    read = _Cells(cells, table.columns, of.date_order)
    borrower, instrument, figi = read.text("borrower"), read.text("instrument"), _figi(read)
    ticker, cusip, isin = read.text("ticker"), read.text("cusip"), read.text("isin")
    sedol, identifier, sector = read.text("sedol"), read.text("identifier"), read.text("sector")
    rating, bucket, stated = _rating(read)
    ranking = read.text("ranking")
    priced = _priced(read, table)
    currency = read.text("currency")
    return Position(
        row=number,
        borrower=borrower,
        instrument=instrument,
        figi=figi,
        ticker=ticker,
        cusip=cusip,
        isin=isin,
        sedol=sedol,
        identifier=identifier,
        asset_type=of.asset_type,
        sector=sector,
        rating=rating,
        rating_bucket=bucket,
        stated_bucket=stated,
        ranking=ranking,
        lien=_lien(read.text("lien"), ranking),
        par=priced.par,
        market_value=priced.value,
        currency=currency,
        market_value_currency=None if priced.value is None else table.value_currency or currency,
        weight=read.number("weight"),
        margin=read.number("margin"),
        discount_margin=read.number("discount_margin"),
        coupon=read.number("coupon"),
        ytm=read.number("ytm"),
        maturity=read.when("maturity"),
        bid=priced.bid,
        ask=priced.ask,
        mid_price=priced.mid,
        flags=tuple(dict.fromkeys(read.flags)),
    )


def _is_holding(cells: Sequence[pe.Cell], table: _Table) -> bool:
    """A row with a name and one other field's cell filled; under `table.whole`, any filled row."""
    if table.whole:
        return any(cell.text for cell in cells)
    filled = {i for i in table.columns.values() if i < len(cells) and cells[i].text}
    names = {table.columns[name] for name in _NAMES if name in table.columns}
    return bool(filled & names) and bool(filled - names)


class _Rows(NamedTuple):
    """A table's positions and the rows with text it does not read: total, note and disclaimer
    rows; other rows between the header and the last position; rows below the table."""

    positions: tuple[Position, ...]
    notes: list[int]
    inside: list[int]
    below: list[int]


def _kind(cells: Sequence[pe.Cell], table: _Table) -> Literal["position", "note", "other"]:
    """A position, a total or note row (`pe.row_kind`, the export check's own rule, on the cells
    under the export's column names), or another row."""
    if not _is_holding(cells, table):
        return "other"
    shared = {"instrument": "loan", "rating": "ratings"}
    texts = {
        shared.get(name, name): cells[i].text for name, i in table.columns.items() if i < len(cells)
    }
    first = next((cell.text for cell in cells if cell.text), "")
    return "position" if pe.row_kind(texts, first) == "position" else "note"


def _positions(table: _Table, of: Reference) -> _Rows:
    """The table's positions (see the module's note): rows under the header until two or more
    rows with no text after a position (under `table.whole`, every row), less total, note and
    other rows."""
    filled = [
        (n, cells) for n, cells in table.rows if n > table.start and any(c.text for c in cells)
    ]
    if len(filled) > MAX_ROWS:
        raise PortfolioFileError(
            f"{table.file}: the holdings table has more than {MAX_ROWS:,} rows; a reference "
            "portfolio that large is not read."
        )
    found: list[Position] = []
    notes: list[int] = []
    inside: list[int] = []
    waiting: list[int] = []  # other rows since the last position: inside if one follows
    below: list[int] = []
    last = table.start
    for number, cells in filled:
        if below or (found and not table.whole and number - last > 2):
            below.append(number)
            continue
        last = number
        kind = _kind(cells, table)
        if kind == "position":
            found.append(_position(number, cells, table, of))
            inside += waiting
            waiting = []
        elif kind == "note":
            notes.append(number)
        else:
            waiting.append(number)
    return _Rows(tuple(found), notes, inside, waiting + below)


# --- What the file says about itself -------------------------------------------------------------


def _labelled(
    rows: Grid, wanted: Callable[[tuple[str, ...]], bool]
) -> Iterator[tuple[str, pe.Cell | None]]:
    """Each cell whose words are `wanted`, with the next filled cell of its row."""
    for _, cells in rows:
        filled = [cell for cell in cells if cell.text]
        for index, cell in enumerate(filled):
            if wanted(_words(cell.text)):
                yield cell.text, filled[index + 1] if index + 1 < len(filled) else None


_AFTER_AS_OF = re.compile(r"as\s+of\b[\s:]*(.+)$", re.IGNORECASE)
_AFTER_COLON = re.compile(r":\s*(.+)$")


_YEARS = (2000, 2100)  # an as-of date's year is within these, or it is not read
_ECHO = 40  # characters of a cell's text a finding repeats
_MONTHS = (
    *("January", "February", "March", "April", "May", "June", "July"),
    *("August", "September", "October", "November", "December"),
)


def long_date(when: date) -> str:
    """A date as a reader writes it: `24 November 2026`."""
    return f"{when.day} {_MONTHS[when.month - 1]} {when.year}"


_AsOf = tuple[date | None, str | None]  # the date, or the finding saying why none is read


def _as_of_in(cell: pe.Cell, order: DateOrder | None) -> _AsOf | None:
    """The as-of date `cell` states, or why it is not read; None when the cell is no date."""
    found = _dated(cell, order)
    shown = " ".join(cell.text.split())[:_ECHO]
    if found.both is not None:
        day_first, month_first = (long_date(when) for when in found.both)
        return None, (
            f"The as-of date {shown} reads as {day_first} (day first) or {month_first} (month "
            "first), and the file does not say which: no as-of date is read."
        )
    if found.when is None:
        return None
    if not _YEARS[0] <= found.when.year <= _YEARS[1]:
        shown = long_date(found.when) if cell.date_format else shown
        return None, (
            f"The as-of date {shown} is outside the years {_YEARS[0]} to {_YEARS[1]}: no as-of "
            "date is read."
        )
    return found.when, None


def _stated_date(rows: Grid, order: DateOrder | None) -> _AsOf:
    """The as-of date the rows above the header state: in a cell saying `as of`, or beside one;
    failing that, beside a cell naming a date (but not an inception date)."""
    labels: tuple[Callable[[tuple[str, ...]], bool], ...] = (
        lambda words: _holds(words, ("as", "of")),
        lambda words: "date" in words and "inception" not in words,
    )
    for wanted in labels:
        for text, beside in _labelled(rows, wanted):
            inline = _AFTER_AS_OF.search(text) or _AFTER_COLON.search(text)
            for cell in (pe.Cell(inline[1].strip()) if inline else None, beside):
                if cell is not None and (found := _as_of_in(cell, order)) is not None:
                    return found
    return None, None


_MANDATE_DATES = ("as of", "as_of", "report date", "valuation date", "reporting date")


def _mandate_date(export: pe.Export, order: DateOrder | None) -> _AsOf:
    """The as-of date of the mandate's first row whose field names one (`As of Date`)."""
    for _, row in export.mandate[1:]:
        field, value = (row[i] if i < len(row) else "" for i in (1, 2))
        if any(word in pe.folded(field) for word in _MANDATE_DATES):
            found = _as_of_in(pe.Cell(value), order)
            if found is not None:
                return found
    return None, None


_LABEL_WORDS = 4  # a label of more words must still end with its label phrase
_TICKER = re.compile(r"^[A-Z0-9][A-Z0-9.\-]{0,9}$")  # letters and digits, 10 characters at most
_BRACKETED = re.compile(r"\(([^()]*)\)")
_TICKER_BRACKETS = re.compile(r"[(\[]([^()\[\]]*)[)\]]")  # a ticker in round or square brackets
_VALUE_WORDS = 3  # a ticker with an exchange or market code (`JNK US Equity`) is this many words


def _is_label(label: str, phrases: Sequence[tuple[str, ...]]) -> bool:
    """Whether `label` (a cell, or what is before its colon) is a label for one of `phrases`: it
    holds the phrase and is short, or ends with it once a bracketed qualifier is left out."""
    words = _words(label)
    plain = _words(_BRACKETED.sub(" ", label))
    for phrase in phrases:
        if _holds(words, phrase) and (
            len(words) <= _LABEL_WORDS or plain[max(0, len(plain) - len(phrase)) :] == tuple(phrase)
        ):
            return True
    return False


def ticker_in(value: str) -> str | None:
    """The ticker a stated value holds: the value if it is one (`JNK`), else the bracketed one
    (`SPDR ... ETF (JNK)`), else the first word of a short value (`JNK US`, in capitals); None
    when none is letters and digits (with . and -) of at most 10 characters."""
    text = value.strip()
    if _TICKER.match(text.upper()):
        return text
    for inner in reversed(_TICKER_BRACKETS.findall(text)):
        if _TICKER.match(str(inner).strip().upper()):
            return str(inner).strip()
    parts = text.split()
    if 1 < len(parts) <= _VALUE_WORDS and _TICKER.match(parts[0]):
        return parts[0]
    return None


def _stated_text(
    rows: Grid, *phrases: tuple[str, ...], extract: Callable[[str], str | None] | None = None
) -> str | None:
    """The value beside (or after the colon of) the first cell that is a label holding one of
    `phrases` (`_is_label`): the whole cell, or all of it before a colon, so a note that merely
    mentions the words is not one. `extract` gives the part of a value to keep, or None to pass
    the value over."""
    for text, beside in _labelled(rows, lambda words: any(_holds(words, p) for p in phrases)):
        label, colon, after = text.partition(":")
        if not _is_label(label, phrases):
            continue
        value = after.strip() if colon and after.strip() else beside.text if beside else None
        found = value if extract is None or value is None else extract(value)
        if found is not None:
            return found
    return None


# --- Limits and mandate --------------------------------------------------------------------------


def _limits(export: pe.Export) -> tuple[Limit, ...]:
    given = {
        (file, number): (row, header)
        for file, rows, header in export.constraints
        for number, row in rows
    }
    out: list[Limit] = []
    for item in pe.constraint_rows(export):
        row, header = given[(item.file, item.number)]

        def other(*words: str, row: list[str] = row, header: list[str] = header) -> str:
            index = pe.column_index(header, words)
            return row[index] if index is not None and index < len(row) else ""

        limit = item.cells.get("limit", "")
        out.append(
            Limit(
                source=item.file,
                row=item.number,
                category=item.cells.get("category", ""),
                parameter=item.cells.get("parameter", ""),
                limit=limit,
                breach_type=other("breach"),
                current_exposure=item.cells.get("current", ""),
                headroom=item.cells.get("headroom", ""),
                observed_status=item.cells.get("status", ""),
                notes=other("notes", "basis"),
                quantity=pe.quantity(limit),
            )
        )
    return tuple(out)


def _mandate(export: pe.Export) -> tuple[MandateRow, ...]:
    filled = [(number, [*row, "", "", "", ""]) for number, row in export.mandate if any(row)]
    return tuple(MandateRow(number, *row[:4]) for number, row in filled[1:])


# --- Findings ------------------------------------------------------------------------------------

_FLAG_WORDS: tuple[tuple[str, str], ...] = (
    (UNPRICED, "No price or market value, kept and marked unpriced"),
    (ERROR_MARKER, "A vendor error marker in a cell, read as missing"),
    (UNREADABLE, "A cell that is not a number or a date, read as missing"),
    (FIGI_MALFORMED, "A FIGI that is not 12 capital letters and digits, read as missing"),
    (RATING_UNREAD, "A rating on neither Moody's nor S&P's scale, read as unrated"),
    (BUCKET_DIFFERS, "The file's own rating bucket differs from the bucket its rating gives"),
    (MARKET_VALUE_AT_MID, "Market value is not stated, taken as par at the mid price"),
    (AMBIGUOUS_DATE, "A date that reads two ways (day or month first), read as missing"),
    (NO_VALUE, "A formula cell with no stored value, read as missing"),
)
_ABOUT_100 = (Decimal(90), Decimal(110))
_ABOUT_ONE = (Decimal("0.9"), Decimal("1.1"))  # stated weights adding to this are fractions


def _fractions(total: Decimal) -> bool:
    return _ABOUT_ONE[0] <= total <= _ABOUT_ONE[1]


def _flag_findings(positions: Sequence[Position]) -> list[str]:
    out: list[str] = []
    for flag, words in _FLAG_WORDS:
        rows = [
            position.row
            for position in positions
            if any(item == flag or item.startswith(flag + ":") for item in position.flags)
        ]
        if rows:
            out.append(f"{words}: {pe.count(len(rows), 'position')} ({pe.rows_named(rows)}).")
    return out


def _figure_findings(positions: Sequence[Position]) -> list[str]:
    out: list[str] = []
    weights = [position.weight for position in positions if position.weight is not None]
    total = sum(weights, Decimal(0))
    if weights and _fractions(total):
        out.append(
            f"The stated weights add to {pe.figure(total)}, as fractions of one would, not to "
            "about 100%: they are not used as weights."
        )
    elif weights and not _ABOUT_100[0] <= total <= _ABOUT_100[1]:
        out.append(f"The stated weights add to {pe.figure(total)}%, not about 100%.")
    currencies = sorted(
        {p.market_value_currency or "not stated" for p in positions if p.market_value is not None}
    )
    if len(currencies) > 1:
        out.append(
            f"Market values are in more than one currency ({', '.join(currencies)}): no weight "
            "can be computed from them."
        )
    return out


def _table_findings(table: _Table, read: _Rows) -> list[str]:
    out: list[str] = []
    par = table.columns.get("par")
    if par is not None and not _PAR_WORDS & set(_words(table.header[par])):
        out.append(f"Par is read from the column '{table.header[par]}'.")
    if read.notes:
        out.append(
            "Total, subtotal, note and disclaimer rows, not read as positions: "
            f"{pe.count(len(read.notes), 'row')} ({pe.rows_named(read.notes)})."
        )
    if read.inside:
        out.append(
            "Rows inside the holdings table that are not positions (such as section headings), "
            f"not read: {pe.count(len(read.inside), 'row')} ({pe.rows_named(read.inside)})."
        )
    if read.below:
        out.append(
            "Below the holdings table and not read as positions: "
            f"{pe.count(len(read.below), 'row')} with text ({pe.rows_named(read.below)})."
        )
    out.extend(table.skipped)
    if table.far:
        out.append(
            f"Cells more than {pe.FAR_COLUMNS} empty columns to the right of the cell before "
            f"them, not read: {pe.count(table.far, 'cell')}."
        )
    return out


# --- Reading -------------------------------------------------------------------------------------


def _utc(at: datetime) -> datetime:
    if at.tzinfo is None or at.utcoffset() != timedelta(0):
        raise ValueError("the stored time must be a datetime in UTC")
    return at.astimezone(UTC)


def _stated_findings(
    reference: Reference, export: pe.Export, as_of: _AsOf, ticker: str | None
) -> list[str]:
    """What the files say, or fail to say, about the portfolio: its date, limits, mandate and
    fund."""
    when, why = as_of
    out = [] if when is not None else [why or "The files state no as-of date that could be read."]
    if reference.kind in ("clo", "custom") and not export.constraints:
        out.append("No constraints file was supplied: the portfolio has no limits.")
    if reference.kind in ("clo", "custom") and not export.mandate:
        out.append("No mandate file was supplied.")
    if reference.ticker and ticker and ticker.upper() != reference.ticker.upper():
        out.append(f"The file names the fund ticker {ticker}; {reference.ticker} was expected.")
    return out


def _portfolio(
    reference: Reference, files: Mapping[str, bytes], table: _Table, stored_at: datetime
) -> Portfolio:
    """The portfolio whose holdings are `table`, with the limits and mandate among `files` (as
    files of their own or as sheets of the holdings workbook)."""
    export = pe.read_export(files)
    read = _positions(table, reference)
    if not read.positions:
        raise PortfolioFileError(f"{table.file}: the holdings table has no rows.")
    above = [(number, cells) for number, cells in table.rows if number < table.start]
    as_of = _mandate_date(export, reference.date_order)
    if as_of == (None, None):
        as_of = _stated_date(above, reference.date_order)
    ticker = _stated_text(above, ("ticker",), ("symbol",), extract=ticker_in)
    used = {table.file} | {
        part.file for part in pe.parts(files) if part.role in ("mandate", "constraints")
    }
    findings = _stated_findings(reference, export, as_of, ticker)
    if unused := sorted(set(files) - used):
        findings.append(f"Not part of a reference portfolio and not read: {', '.join(unused)}.")
    findings += _table_findings(table, read) + _figure_findings(read.positions)
    return Portfolio(
        key=reference.key,
        name=reference.name,
        kind=reference.kind,
        as_of=as_of[0],
        stored_at=_utc(stored_at),
        sources=tuple(
            SourceFile(name, hashlib.sha256(files[name]).hexdigest()) for name in sorted(used)
        ),
        positions=read.positions,
        limits=_limits(export),
        mandate=_mandate(export),
        stated_name=_stated_text(above, ("fund", "name")),
        stated_ticker=ticker,
        columns_found=tuple(
            (name, table.header[table.columns[name]]) for name in FIELDS if name in table.columns
        ),
        columns_missing=tuple(name for name in FIELDS if name not in table.columns),
        findings=(*findings, *_flag_findings(read.positions)),
    )


_DAMAGED = (
    "The files could not be read: one of them is damaged or is not a holdings file this reader "
    "knows."
)


@contextmanager
def _reading(files: Mapping[str, bytes]) -> Iterator[None]:
    """One reading of `files` (`portfolio_export.reading`, a formula cell as its stored value):
    each parsed once, and whatever fails in reading their content a `PortfolioFileError`."""
    with pe.reading(cached_formulas=True):
        try:
            for name in sorted(files):
                if name.lower().endswith(".csv"):
                    _csv_readable(name, files[name])
            yield
        except PortfolioFileError:
            raise
        except Exception as error:  # an untrusted file must not end the caller
            raise PortfolioFileError(_DAMAGED) from error


def _csv_readable(name: str, raw: bytes) -> None:
    try:
        pe.csv_rows(raw)
    except csv.Error as error:
        raise PortfolioFileError(
            f"{name} cannot be read as a CSV file: a cell is too long or its quotes do not close."
        ) from error
    except CsvDecodeError as error:
        raise PortfolioFileError(_DAMAGED) from error


def read_clo_pack(
    files: Mapping[str, bytes], reference: Reference = CLO, *, stored_at: datetime
) -> Portfolio:
    """A CLO pack (file name -> bytes): the holdings as a CSV file or a workbook sheet in the
    export's shape (a borrower and a par column), with the constraints and the mandate when they
    are among the files. The as-of date is the mandate's. Raises `PortfolioFileError` when no
    file is such a holdings table, the table has no rows or a file cannot be read."""
    _utc(stored_at)
    with _reading(files):
        table = _export_table(files)
        if table is None:
            raise PortfolioFileError(
                "None of the files is a holdings table with a borrower and a par column."
            )
        return _portfolio(reference, files, table, stored_at)


def read_ssga_holdings(
    raw: bytes, reference: Reference, *, file_name: str, stored_at: datetime
) -> Portfolio:
    """A fund's daily holdings workbook, read by its header row (see the module's note: the real
    layout is unverified). The as-of date and the fund's name and ticker are read from the rows
    above the header. Raises `PortfolioFileError` when the bytes are not a workbook, no row names
    a holding with a weight, par or market value, or the table has no rows."""
    _utc(stored_at)
    files = {file_name: raw}
    with _reading(files):
        return _portfolio(reference, files, _workbook_table(file_name, raw), stored_at)


def read_portfolio_files(
    files: Mapping[str, bytes],
    *,
    name: str | None = None,
    reference: Reference | None = None,
    stored_at: datetime,
) -> Portfolio:
    """Whatever an analyst supplies (file name -> bytes): a pack in the export's shape, or any
    workbook or CSV file with a holdings header row, with constraints and mandate files (or
    sheets) when supplied. Give `name` for a run's own portfolio (`custom(name)`) or the
    `reference` the files are for. Raises `PortfolioFileError` when no file holds a holdings
    table or a file cannot be read."""
    if (name is None) == (reference is None):
        raise ValueError("give a name or a reference, one of the two")
    _utc(stored_at)
    chosen = reference if reference is not None else custom(name or "")
    with _reading(files):
        table = _export_table(files) or _any_table(files)
        return _portfolio(chosen, files, table, stored_at)


# --- The store -----------------------------------------------------------------------------------

_KEY = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")
_DECIMALS = tuple(f.name for f in fields(Position) if "Decimal" in str(f.type))


@dataclass(frozen=True)
class Failure:
    """A refresh that failed: what a reader is told, and when (UTC)."""

    message: str
    at: datetime


@dataclass(frozen=True)
class Summary:
    """One portfolio on offer. `as_of`, `stored_at` and `positions` are the current good set's
    (None when none is stored); `failure` is the last refresh that failed since that set was
    stored; `error` says why a stored file cannot be read: the set's, the failure record's or
    both (a damaged failure record does not hide the set). `scope` is the store it is in."""

    key: str
    name: str
    kind: Kind | None
    scope: Scope
    as_of: date | None = None
    stored_at: datetime | None = None
    positions: int | None = None
    failure: Failure | None = None
    error: str | None = None


def _plain(value: object) -> object:
    """A value as JSON holds it: decimals and dates as text, tuples as lists."""
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, date):
        return value.isoformat()
    if is_dataclass(value) and not isinstance(value, type):
        return {item.name: _plain(getattr(value, item.name)) for item in fields(value)}
    if isinstance(value, tuple):
        return [_plain(item) for item in value]
    return value


def _decimal(value: object) -> Decimal | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise TypeError("a stored figure is text")
    return Decimal(value)


def _position_from(data: Mapping[str, Any]) -> Position:
    body = dict(data)
    for name in _DECIMALS:
        body[name] = _decimal(body[name])
    if body["maturity"] is not None:
        body["maturity"] = date.fromisoformat(body["maturity"])
    return Position(**{**body, "flags": tuple(body["flags"])})


def _limit_from(data: Mapping[str, Any]) -> Limit:
    stated = data["quantity"]
    if stated is not None:
        stated = pe.Quantity(
            **{**stated, "value": _decimal(stated["value"]), "scale": _decimal(stated["scale"])}
        )
    return Limit(**{**data, "quantity": stated})


def _schema_1(data: Mapping[str, Any]) -> dict[str, Any]:
    """A version-1 file written before `Quantity.strict`: the flag is read again from each stored
    limit text (a stored `<` keeps its strictness). The file itself is never edited."""
    migrated = dict(data)
    limits = []
    for item in data["limits"]:
        stated = item["quantity"]
        if isinstance(stated, dict) and "strict" not in stated:
            read = pe.quantity(item["limit"])
            item = {**item, "quantity": {**stated, "strict": read is not None and read.strict}}
        limits.append(item)
    migrated["limits"] = limits
    return migrated


def _portfolio_from(stored: Mapping[str, Any], schema: int) -> Portfolio:
    """The stored portfolio, refused unless writing it again gives the same content."""
    data = _schema_1(stored) if schema == 1 else stored
    body = dict(data)
    if body["as_of"] is not None:
        body["as_of"] = date.fromisoformat(body["as_of"])
    body["stored_at"] = _utc(datetime.fromisoformat(body["stored_at"]))
    body["sources"] = tuple(SourceFile(**item) for item in body["sources"])
    body["positions"] = tuple(_position_from(item) for item in body["positions"])
    body["limits"] = tuple(_limit_from(item) for item in body["limits"])
    body["mandate"] = tuple(MandateRow(**item) for item in body["mandate"])
    body["columns_found"] = tuple((name, header) for name, header in body["columns_found"])
    body["columns_missing"] = tuple(body["columns_missing"])
    body["findings"] = tuple(body["findings"])
    found = Portfolio(**body)
    if _plain(found) != data:
        raise ValueError("the content is not a stored portfolio's")
    return found


def _is_link(path: Path) -> bool:
    """Check the final path component without following it, including dangling links."""
    try:
        status = path.lstat()
    except FileNotFoundError:
        return False
    return stat.S_ISLNK(status.st_mode) or bool(
        getattr(status, "st_file_attributes", 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT
    )


def _read(path: Path) -> Any:
    if _is_link(path.parent) or _is_link(path):
        raise OSError("linked portfolio store paths are not accepted")
    descriptor = regular_open(path, os.O_RDONLY | flags("O_NOFOLLOW", "O_NONBLOCK", "O_CLOEXEC"))
    with os.fdopen(descriptor, "rb") as stream:
        return json.load(stream)


def _write(path: Path, content: Mapping[str, object]) -> None:
    """Write `content` as JSON to `path`, whole or not at all (a temporary file, then a rename)."""
    if _is_link(path.parent):
        raise OSError("a linked portfolio store directory is not accepted")
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            json.dump(content, stream, ensure_ascii=False, indent=1)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    except BaseException:
        Path(name).unlink(missing_ok=True)
        raise


_UNREADABLE = (OSError, ValueError, TypeError, KeyError, ArithmeticError, AttributeError)


class Store:
    """One current good set per key under `root`: `<key>.json`, and beside it
    `<key>.failure.json` while the last refresh has failed. A standing store holds the standing
    references; a second store under a run's folder holds that run's own portfolio. The caller
    configures the parent path. A linked final store directory is unavailable. Nothing is written
    until `save` or `record_failure`."""

    def __init__(self, root: Path) -> None:
        self.root = root

    def _path(self, key: str, suffix: str = ".json") -> Path:
        if not _KEY.match(key):
            raise ValueError(
                f"a portfolio key is lower-case letters, digits, '-' and '_', not {key!r}"
            )
        return self.root / f"{key}{suffix}"

    def save(self, portfolio: Portfolio) -> Path:
        """Store `portfolio` as its key's current set, replacing the one before, and clear the
        key's recorded failure."""
        path = self._path(portfolio.key)
        _write(path, {"schema": SCHEMA, "portfolio": _plain(portfolio)})
        self._path(portfolio.key, ".failure.json").unlink(missing_ok=True)
        return path

    def load(self, key: str) -> Portfolio:
        """The key's current set. Raises `NotStored` when there is none and `StoreError` when
        the file cannot be read or was written by another version."""
        path = self._path(key)
        try:
            stored = _read(path)
            if type(stored["schema"]) is not int or stored["schema"] not in READS:
                raise StoreError(
                    f"The stored portfolio '{key}' cannot be read: it was written as version "
                    f"{stored['schema']}, and this application reads versions 1 to {SCHEMA}."
                )
            found = _portfolio_from(stored["portfolio"], stored["schema"])
            if found.key != key:
                raise ValueError("the content is another portfolio's")
        except (FileNotFoundError, NotADirectoryError) as error:
            raise NotStored(f"No portfolio is stored as '{key}'.") from error
        except _UNREADABLE as error:
            raise StoreError(
                f"The stored portfolio '{key}' cannot be read: its file is damaged or is not a "
                "stored portfolio."
            ) from error
        return found

    def keys(self) -> tuple[str, ...]:
        """Every key with a stored set or a recorded failure, in name order."""
        if not self.root.is_dir(follow_symlinks=False) or _is_link(self.root):
            return ()
        names = (path.name.removesuffix(".json") for path in self.root.glob("*.json"))
        keys = {name.removesuffix(".failure") for name in names}
        return tuple(sorted(key for key in keys if _KEY.match(key)))

    def record_failure(self, key: str, message: str, at: datetime) -> None:
        """Record that a refresh of `key` failed at `at` (UTC). The current set is not touched."""
        content = {"schema": SCHEMA, "message": message, "at": _utc(at).isoformat()}
        _write(self._path(key, ".failure.json"), content)

    def failure(self, key: str) -> Failure | None:
        """The failed refresh recorded since the key's current set was stored, if any."""
        path = self._path(key, ".failure.json")
        try:
            stored = _read(path)
            return Failure(str(stored["message"]), _utc(datetime.fromisoformat(stored["at"])))
        except (FileNotFoundError, NotADirectoryError):
            return None
        except _UNREADABLE as error:
            raise StoreError(
                f"The record of the last failed refresh of '{key}' cannot be read."
            ) from error


def _summary(store: Store, key: str, scope: Scope) -> Summary:
    """The key's listing: its stored set, its recorded failure, and what of either cannot be read
    (a damaged failure record does not hide a good set)."""
    known = STANDING.get(key) if scope == "standing" else None
    listed = Summary(key, known.name if known else key, known.kind if known else None, scope)
    errors: list[str] = []
    found: Portfolio | None = None
    try:
        found = store.load(key)
    except NotStored:
        pass
    except StoreError as error:
        errors.append(str(error))
    try:
        listed = replace(listed, failure=store.failure(key))
    except StoreError as error:
        errors.append(str(error))
    if found is not None:
        listed = replace(
            listed,
            name=found.name,
            kind=found.kind,
            as_of=found.as_of,
            stored_at=found.stored_at,
            positions=len(found.positions),
        )
    return replace(listed, error=" ".join(errors) or None)


# --- Questions -----------------------------------------------------------------------------------


def list_portfolios(standing: Store, run: Store | None = None) -> tuple[Summary, ...]:
    """The portfolios on offer: the standing references (each listed whether or not a set is
    stored), anything else in the standing store, then the run's own. A key whose file cannot be
    read is listed with its `error`; a failed refresh is listed beside the set it left in place."""
    keys = dict.fromkeys((*STANDING, *standing.keys()))
    listed = [_summary(standing, key, "standing") for key in keys]
    if run is not None:
        own = run.keys()
        listed += [_summary(run, key, "run") for key in own]
    return tuple(listed)


@dataclass(frozen=True)
class Row:
    """A position with the value its valuation is read on: a loan's discount margin, else its
    margin; a bond's spread. `spread` and `measure` are None when the position has none."""

    position: Position
    spread: Decimal | None
    measure: Measure | None


def _row(position: Position, read_as: AssetType | None = None) -> Row:
    """`read_as`: the type an untyped position is read as (the instrument's). A bond is read on
    its spread (margin column), a loan on its discount margin, else its margin; an untyped
    position read as a bond with no spread but a discount margin keeps that, as it was before."""
    kind = position.asset_type or read_as
    options: tuple[tuple[Measure, Decimal | None], ...] = (
        (("spread", position.margin),)
        if kind == "bond"
        else (("discount_margin", position.discount_margin), ("margin", position.margin))
    )
    if kind == "bond" and position.asset_type is None:
        options += (("discount_margin", position.discount_margin),)
    for measure, value in options:
        if value is not None:
            return Row(position, value, measure)
    return Row(position, None, None)


def rows(
    portfolio: Portfolio,
    *,
    asset_type: AssetType | None = None,
    rating_bucket: str | None = None,
    read_as: AssetType | None = None,
) -> tuple[Row, ...]:
    """The positions of `asset_type` in `rating_bucket` (one of `BUCKET_NAMES`), each with its
    spread measure; None takes every asset type or bucket. A position with no asset type is read
    as `read_as` (a loan when None). Unpriced and flagged positions are included: the caller
    decides what a median may rest on."""
    if rating_bucket is not None and rating_bucket not in BUCKET_NAMES:
        raise ValueError(f"{rating_bucket!r} is not a rating bucket ({', '.join(BUCKET_NAMES)})")
    return tuple(
        _row(position, read_as)
        for position in portfolio.positions
        if asset_type in (None, position.asset_type)
        and rating_bucket in (None, position.rating_bucket)
    )


@dataclass(frozen=True)
class Weight:
    """An issuer's weight in a portfolio, in percent. `basis`: `stated_weight`, the sum of the
    weights the file states; `market_value`, the issuer's market value over the market value of
    every priced position (to 28 significant digits); None when the file gives neither, or its
    market values are in more than one currency. Stated weights that add to about 1 are fractions
    of one, not percentages: they are not used (nor scaled), and market value is the basis when
    there is one. `weight` is None when there is no basis, or when positions matched and none has
    a figure on it; with a basis and no match it is 0. `matched` counts the positions matched and
    `unweighted` those of them with no figure on the basis, which are left out of the sum, never
    added as zero. `matched_by` says how they matched: `name` (the whole name), else
    `name_without_legal_form` (the same words once Inc, Co, LLC, The and the like are left out),
    and `identifier`."""

    weight: Decimal | None
    basis: Basis | None
    matched: int
    unweighted: int = 0
    matched_by: tuple[MatchedBy, ...] = ()


_DIVISION = Context(prec=28)


def _name_key(name: str) -> str:
    """A name without case, spaces or punctuation: names are equal when these are."""
    return "".join(char for char in name.casefold() if char.isalnum())


def _basis(portfolio: Portfolio) -> tuple[Basis | None, Decimal]:
    """The basis weights can be given on, and for market value the priced total."""
    weights = [p.weight for p in portfolio.positions if p.weight is not None]
    if weights and not _fractions(sum(weights, Decimal(0))):
        return "stated_weight", Decimal(0)
    priced = [p for p in portfolio.positions if p.market_value is not None]
    total = sum((p.market_value for p in priced if p.market_value is not None), Decimal(0))
    if total and len({p.market_value_currency for p in priced}) == 1:
        return "market_value", total
    return None, Decimal(0)


_NAME_WORD = re.compile(r"[^\W_]+")  # letters and digits of any script, not ASCII alone


# Legal forms in other scripts: words of their own (Russian) or joined to the name (Chinese,
# Japanese), as `portfolio_export`'s Latin ones are. The longest first, so one is cut whole.
_LEGAL_WORDS = frozenset({"пао", "оао", "зао", "ооо", "ао"})
_LEGAL_JOINED = ("股份有限公司", "有限公司", "株式会社")


def _without_joined_form(word: str) -> str:
    for form in _LEGAL_JOINED:
        if word != form and word.startswith(form):
            return word[len(form) :]
        if word != form and word.endswith(form):
            return word[: -len(form)]
    return word


def _name_words(text: str) -> tuple[str, ...]:
    """A name as its words (any script), without case, punctuation and the legal forms Inc, LLC,
    The, ПАО, 株式会社 and the like; a name of nothing else keeps them. As
    `portfolio_export.name_words`, whose ASCII-only words leave a name with no ASCII letter or
    digit with none to compare."""
    words = [_without_joined_form(word) for word in _NAME_WORD.findall(text.casefold())]
    kept = tuple(
        w
        for w in words
        if w and w not in pe._LEGAL and w not in _LEGAL_WORDS and w not in _LEGAL_JOINED
    )
    return kept or tuple(w for w in words if w)


def _matches(
    positions: Sequence[Position], borrower: str, identifier: str
) -> tuple[list[Position], tuple[MatchedBy, ...]]:
    """The positions matching the borrower's name (whole, else without legal forms; never a part
    of a longer name) or carrying the identifier, in portfolio order, and how they matched."""
    name, code = _name_key(borrower), identifier.strip().upper()
    by_name = {i for i, p in enumerate(positions) if name and _name_key(p.borrower or "") == name}
    how: list[MatchedBy] = ["name"] if by_name else []
    if name and not by_name:
        words = _name_words(borrower)
        by_name = {
            i
            for i, p in enumerate(positions)
            if words and p.borrower and _name_words(p.borrower) == words
        }
        how += ["name_without_legal_form"] if by_name else []
    by_code = {
        i
        for i, p in enumerate(positions)
        if code and code in {item.upper() for item in p.identifiers}
    }
    how += ["identifier"] if by_code else []
    return [positions[i] for i in sorted(by_name | by_code)], tuple(how)


def issuer_weight(
    portfolio: Portfolio, *, borrower: str | None = None, identifier: str | None = None
) -> Weight:
    """The weight of the positions whose borrower is `borrower` (the whole name, whatever its
    case, spacing and punctuation, else the same name without its legal form; never part of a
    longer name) or that carry `identifier` (any of FIGI, ticker, CUSIP, ISIN, SEDOL; case does
    not matter). With both, a position matching either counts."""
    if not _name_key(borrower or "") and not (identifier or "").strip():
        raise ValueError("give a borrower or an identifier to match")
    matched, how = _matches(portfolio.positions, borrower or "", identifier or "")
    basis, total = _basis(portfolio)
    if basis is None:
        return Weight(None, None, len(matched), matched_by=how)
    figures = [p.weight if basis == "stated_weight" else p.market_value for p in matched]
    given = [figure for figure in figures if figure is not None]
    missing = len(matched) - len(given)
    if matched and not given:
        return Weight(None, basis, len(matched), missing, how)
    added = sum(given, Decimal(0))
    if basis == "market_value":
        added = _DIVISION.divide(added * 100, total)
    return Weight(added, basis, len(matched), missing, how)


def limits(portfolio: Portfolio) -> tuple[Limit, ...]:
    """The portfolio's limits: its constraints rows as given, each with its limit's figure."""
    return portfolio.limits
