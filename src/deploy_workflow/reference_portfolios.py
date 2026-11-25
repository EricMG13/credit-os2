"""Reference portfolios: dated, typed holdings and limits an issuer's loans and bonds are read
against (spec 2026-11-25-deliverables-credit-snapshot, sections 4.4 to 4.6).

Three standing references (`STANDING`: a CLO portfolio, a loan-index fund and a high-yield fund)
and any portfolio an analyst supplies for a run. This module reads their files into a
`Portfolio`, keeps one good set per key in a `Store`, and answers the questions later code asks:
`list_portfolios`, `rows`, `issuer_weight`, `limits`. It fetches nothing and scores nothing.

Reading is the fund export's (`deploy_vii.inputs.portfolio_export`): its files' roles, its cells,
its figures with units, its dates and its rating scale. A CLO pack is the holdings (a CSV file or
a workbook sheet) with, when supplied, the constraints and the mandate. A fund's daily holdings
workbook is read by its header row alone: the row is found by the field words it holds
(`_FIELD_WORDS`), every field is optional, and `Portfolio.columns_found` and `columns_missing`
say which were there. The layout of the real fund files was NOT verified when this was written
(they could not be fetched), so nothing here depends on a row number, a column position or an
exact header text.

Nothing is coerced. A blank cell (or a dash or `n/a`) is missing (None) and `0` is zero; a vendor
error marker (`#N/A N/A`) or a cell that is not a number or a date is missing and flagged on its
position; a row with no price is kept and flagged; amounts are the digits the file holds, as
`Decimal`. A figure's unit is the file's (a margin of 300 is what the file wrote, not converted);
the one reading applied is a workbook cell shown as a percentage, taken as the percentage shown
(0.625 shown as 62.50% is 62.5). The as-of date is the files' own, or None with a finding; the
stored time is the caller's.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from collections.abc import Callable, Iterator, Mapping, Sequence
from dataclasses import dataclass, fields, is_dataclass, replace
from datetime import UTC, date, datetime, timedelta
from decimal import Context, Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Literal, NamedTuple

from deploy_vii.inputs import portfolio_export as pe

Kind = Literal["clo", "loan_index", "hy_index", "custom"]
AssetType = Literal["loan", "bond"]
Measure = Literal["discount_margin", "margin", "spread"]
Basis = Literal["stated_weight", "market_value"]
Scope = Literal["standing", "run"]

SCHEMA = 1  # the stored file's version; a file of another version is reported, never guessed at
BUCKET_NAMES: tuple[str, ...] = (*(name for name, _ in pe.BUCKETS), "Unrated")

# Position flags. `ERROR_MARKER` and `UNREADABLE` are followed by `:` and the field's name.
UNPRICED = "unpriced"  # the file has price columns and the row has no mid price or market value
ERROR_MARKER = "error_marker"  # a vendor error marker (`#N/A N/A`) in the cell: missing
UNREADABLE = "unreadable"  # the cell is not a number (or, for a maturity, a date): missing
FIGI_MALFORMED = "figi_malformed"  # not 12 capital letters and digits: no FIGI
RATING_UNREAD = "rating_unread"  # a rating on neither agency's scale: bucket Unrated
BUCKET_DIFFERS = "rating_bucket_differs"  # the file's own bucket is not the rating's bucket
MARKET_VALUE_AT_MID = "market_value_at_mid"  # no market value column: par x mid price / 100

# A position's fields that a file's column can supply, in the order they are reported.
FIELDS: tuple[str, ...] = (
    *("borrower", "instrument", "figi", "ticker", "cusip", "isin", "sedol", "identifier"),
    *("sector", "rating", "stated_bucket", "ranking", "lien", "par", "market_value", "currency"),
    *("weight", "margin", "discount_margin", "coupon", "ytm", "maturity", "bid", "ask"),
    "mid_price",
)


class PortfolioFileError(ValueError):
    """The files are not a portfolio that can be read; the message is worded for a reader."""


class StoreError(Exception):
    """A stored portfolio cannot be read; the message is worded for a reader."""


class NotStored(StoreError):
    """No set is stored under the key."""


# --- The model -----------------------------------------------------------------------------------


@dataclass(frozen=True)
class Reference:
    """What a portfolio is, before any file is read. `asset_type` is what its holdings are when
    the file does not say; `ticker` and `url` are a fund's (`url` its daily holdings workbook)."""

    key: str
    name: str
    kind: Kind
    asset_type: AssetType | None = None
    ticker: str | None = None
    url: str | None = None


_FUND_FILES = "https://www.ssga.com/library-content/products/fund-data/etfs/us/"
CLO = Reference("clo", "CLO portfolio", "clo", "loan")
LVLN = Reference(
    *("lvln", "Loan index fund (LVLN)", "loan_index", "loan", "LVLN"),
    _FUND_FILES + "holdings-daily-us-en-lvln.xlsx",
)
JNK = Reference(
    *("jnk", "High-yield bond fund (JNK)", "hy_index", "bond", "JNK"),
    _FUND_FILES + "holdings-daily-us-en-jnk.xlsx",
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
# one of whose phrases it holds as whole words, so `Rating Bucket` is never the rating and
# `Mid Price (per 100 par)` never the par. These are guesses at how a file may name a column, not
# a known layout.
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
    ("ytm", ("yield", "ytm")),
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


def _map_columns(header: Sequence[str], known: Mapping[str, int]) -> dict[str, int]:
    """The column of each field `header` names, beside the columns already `known`."""
    cells = [_words(text) for text in header]
    found, used = dict(known), set(known.values())
    for name, phrases in _FIELD_WORDS:
        if name in found:
            continue
        index = next(
            (
                i
                for phrase in phrases
                for i, words in enumerate(cells)
                if i not in used
                and _holds(words, phrase.split())
                and not (name == "sector" and "sub" in words)
            ),
            None,
        )
        if index is not None:
            found[name] = index
            used.add(index)
    if "borrower" not in found and "instrument" in found:
        found["borrower"] = found["instrument"]  # one name column names both
    return found


@dataclass(frozen=True)
class _Table:
    """A holdings table: the file's rows, its header row's number and each field's column.
    `whole`: every filled row under the header is a holding (the export's rule); otherwise the
    table ends at the first row that is not one."""

    file: str
    rows: Grid
    start: int
    columns: Mapping[str, int]
    header: Sequence[str]
    whole: bool = False

    @property
    def priced(self) -> bool:
        return any(name in self.columns for name in _PRICES)

    @property
    def value_currency(self) -> str | None:
        """The currency the market value column's header names (`Market Value (USD)`)."""
        index = self.columns.get("market_value")
        found = None if index is None else _CURRENCY.search(self.header[index])
        return None if found is None else found[1]


def _export_table(files: Mapping[str, bytes]) -> _Table | None:
    """The holdings of a pack in the export's shape: the first holdings part whose header has a
    borrower and a par column."""
    for part in pe.parts(files):
        if part.role != "holdings":
            continue
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
        return _Table(part.file, rows, start, _map_columns(header, known), header, whole=True)
    return None


def _header_table(file: str, rows: Grid) -> _Table | None:
    """The table under the first row naming at least `_HEADER_LEAST` fields, or None when no row
    does. A header with no name column, or with no weight, par or market value, is an error."""
    for number, cells in rows[:_HEADER_WITHIN]:
        header = [cell.text for cell in cells]
        columns = _map_columns(header, {})
        if len(set(columns.values())) < _HEADER_LEAST:
            continue
        lacking = None
        if not any(name in columns for name in _NAMES):
            lacking = "the holding's name"
        elif not any(name in columns for name in _AMOUNTS):
            lacking = "a weight, par or market value"
        if lacking is not None:
            raise PortfolioFileError(
                f"{file}: the header row (row {number}) has no column for {lacking}."
            )
        return _Table(file, rows, number, columns, header)
    return None


_NO_HEADER = "{} has no header row naming a holding and its weight, par or market value."


def _workbook_table(file: str, raw: bytes) -> _Table:
    sheets = pe.workbook_sheets(raw)
    if not sheets:
        raise PortfolioFileError(f"{file} cannot be read as an Excel workbook.")
    for sheet in sheets:
        table = _header_table(file, pe.sheet_rows(raw, sheet) or [])
        if table is not None:
            return table
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


def _number(cell: pe.Cell) -> Decimal | None:
    """A cell's figure: a workbook number as stored (a percent cell as the percentage shown), or
    text `portfolio_export.quantity` reads exactly. None when it is neither."""
    if not cell.numeric:
        found = pe.quantity(cell.text)
        return None if found is None or found.approximate else found.value
    try:
        value = Decimal(cell.text)
    except InvalidOperation:
        return None
    if not value.is_finite():
        return None
    return pe.EXACT.multiply(value, pe.HUNDRED) if cell.percent_format else value


_BLANK = pe.NOT_APPLICABLE | {""}  # an empty cell, or one that says not applicable (a dash, n/a)


class _Cells:
    """One row's cells by field. A blank or not-applicable cell is None; an error marker or a
    cell that cannot be read is None and adds a flag."""

    def __init__(self, cells: Sequence[pe.Cell], columns: Mapping[str, int]) -> None:
        self._cells = cells
        self._columns = columns
        self.flags: list[str] = []

    def _cell(self, name: str) -> pe.Cell | None:
        index = self._columns.get(name)
        if index is None or index >= len(self._cells):
            return None
        if pe.folded(self._cells[index].text) in _BLANK:
            return None
        if pe.TOKEN.match(self._cells[index].text):
            self.flags.append(f"{ERROR_MARKER}:{name}")
            return None
        return self._cells[index]

    def _read[T](self, name: str, read: Callable[[pe.Cell], T | None]) -> T | None:
        cell = self._cell(name)
        value = None if cell is None else read(cell)
        if cell is not None and value is None:
            self.flags.append(f"{UNREADABLE}:{name}")
        return value

    def text(self, name: str) -> str | None:
        cell = self._cell(name)
        return None if cell is None else cell.text

    def number(self, name: str) -> Decimal | None:
        return self._read(name, _number)

    def when(self, name: str) -> date | None:
        return self._read(name, pe.read_date)


def _figi(read: _Cells) -> str | None:
    marked = len(read.flags)
    text = read.text("figi")
    if text is not None and pe.FIGI.match(text):
        return text
    if text is not None or len(read.flags) > marked:
        read.flags.append(FIGI_MALFORMED)
    return None


_NOT_RATED = pe.WITHDRAWN | {"NOT RATED", "UNRATED"}


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
        agencies = [part.strip().upper() for part in rating.split("/")]
        if any(part and part not in _NOT_RATED for part in agencies):
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


def _position(
    number: int, cells: Sequence[pe.Cell], table: _Table, asset_type: AssetType | None
) -> Position:
    """The row as a position. Flags come in the order the cells are read: identifiers, rating,
    par, market value and prices, then weight, margins, coupon, yield and maturity."""
    read = _Cells(cells, table.columns)
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
        asset_type=asset_type,
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


def _positions(
    table: _Table, asset_type: AssetType | None
) -> tuple[tuple[Position, ...], list[int]]:
    """The table's positions, and the filled rows at and after its end that are not read."""
    found: list[Position] = []
    for number, cells in table.rows:
        if number <= table.start:
            continue
        if _is_holding(cells, table):
            found.append(_position(number, cells, table, asset_type))
        elif not table.whole:
            break
    if table.whole:
        return tuple(found), []
    last = found[-1].row if found else table.start
    left = [n for n, cells in table.rows if n > last and any(cell.text for cell in cells)]
    return tuple(found), left


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


def _stated_date(rows: Grid) -> date | None:
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
                if cell is not None and (when := pe.read_date(cell)) is not None:
                    return when
    return None


def _stated_text(rows: Grid, *phrases: tuple[str, ...]) -> str | None:
    """The value beside (or after the colon of) the first cell holding one of `phrases`."""
    for text, beside in _labelled(rows, lambda words: any(_holds(words, p) for p in phrases)):
        inline = _AFTER_COLON.search(text)
        if inline is not None:
            return inline[1].strip()
        if beside is not None:
            return beside.text
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
)
_ABOUT_100 = (Decimal(90), Decimal(110))


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
    if weights and not _ABOUT_100[0] <= total <= _ABOUT_100[1]:
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


def _table_findings(table: _Table, left: Sequence[int]) -> list[str]:
    out: list[str] = []
    par = table.columns.get("par")
    if par is not None and not _PAR_WORDS & set(_words(table.header[par])):
        out.append(f"Par is read from the column '{table.header[par]}'.")
    if left:
        out.append(
            "Below the holdings table and not read as positions: "
            f"{pe.count(len(left), 'row')} with text ({pe.rows_named(left)})."
        )
    return out


# --- Reading -------------------------------------------------------------------------------------


def _utc(at: datetime) -> datetime:
    if at.tzinfo is None or at.utcoffset() != timedelta(0):
        raise ValueError("the stored time must be a datetime in UTC")
    return at.astimezone(UTC)


def _portfolio(
    reference: Reference, files: Mapping[str, bytes], table: _Table, stored_at: datetime
) -> Portfolio:
    """The portfolio whose holdings are `table`, with the limits and mandate among `files`."""
    # An export's holdings workbook may hold the constraints and the mandate as sheets.
    beside = {name: raw for name, raw in files.items() if table.whole or name != table.file}
    export = pe.read_export(beside)
    positions, left = _positions(table, reference.asset_type)
    if not positions:
        raise PortfolioFileError(f"{table.file}: the holdings table has no rows.")
    above = [(number, cells) for number, cells in table.rows if number < table.start]
    dated = pe.mandate_findings(export, {}, pe.Findings()) if export.mandate else []
    as_of = dated[0][1] if dated else _stated_date(above)
    ticker = _stated_text(above, ("ticker",), ("symbol",))
    used = {table.file} | {
        label.split(" [")[0]
        for label, role in export.roles.items()
        if role in ("mandate", "constraints")
    }
    findings = [] if as_of is not None else ["The files state no as-of date that could be read."]
    if reference.kind in ("clo", "custom") and not export.constraints:
        findings.append("No constraints file was supplied: the portfolio has no limits.")
    if reference.kind in ("clo", "custom") and not export.mandate:
        findings.append("No mandate file was supplied.")
    if reference.ticker and ticker and ticker.upper() != reference.ticker.upper():
        findings.append(
            f"The file names the fund ticker {ticker}; {reference.ticker} was expected."
        )
    if unused := sorted(set(files) - used):
        findings.append(f"Not part of a reference portfolio and not read: {', '.join(unused)}.")
    findings += _table_findings(table, left) + _figure_findings(positions)
    return Portfolio(
        key=reference.key,
        name=reference.name,
        kind=reference.kind,
        as_of=as_of,
        stored_at=_utc(stored_at),
        sources=tuple(
            SourceFile(name, hashlib.sha256(files[name]).hexdigest()) for name in sorted(used)
        ),
        positions=positions,
        limits=_limits(export),
        mandate=_mandate(export),
        stated_name=_stated_text(above, ("fund", "name")),
        stated_ticker=ticker,
        columns_found=tuple(
            (name, table.header[table.columns[name]]) for name in FIELDS if name in table.columns
        ),
        columns_missing=tuple(name for name in FIELDS if name not in table.columns),
        findings=(*findings, *_flag_findings(positions)),
    )


def read_clo_pack(
    files: Mapping[str, bytes], reference: Reference = CLO, *, stored_at: datetime
) -> Portfolio:
    """A CLO pack (file name -> bytes): the holdings as a CSV file or a workbook sheet in the
    export's shape (a borrower and a par column), with the constraints and the mandate when they
    are among the files. The as-of date is the mandate's. Raises `PortfolioFileError` when no
    file is such a holdings table or the table has no rows."""
    _utc(stored_at)
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
    return _portfolio(reference, {file_name: raw}, _workbook_table(file_name, raw), stored_at)


def read_portfolio_files(
    files: Mapping[str, bytes],
    *,
    name: str | None = None,
    reference: Reference | None = None,
    stored_at: datetime,
) -> Portfolio:
    """Whatever an analyst supplies (file name -> bytes): a pack in the export's shape, or any
    workbook or CSV file with a holdings header row, with constraints and mandate files when
    supplied. Give `name` for a run's own portfolio (`custom(name)`) or the `reference` the files
    are for. Raises `PortfolioFileError` when no file holds a holdings table."""
    if (name is None) == (reference is None):
        raise ValueError("give a name or a reference, one of the two")
    _utc(stored_at)
    chosen = reference if reference is not None else custom(name or "")
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
    stored; `error` says why a stored file cannot be read. `scope` is the store it is in."""

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


def _portfolio_from(data: Mapping[str, Any]) -> Portfolio:
    """The stored portfolio, refused unless writing it again gives the same content."""
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


def _write(path: Path, content: Mapping[str, object]) -> None:
    """Write `content` as JSON to `path`, whole or not at all (a temporary file, then a rename)."""
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
    references; a second store under a run's folder holds that run's own portfolio. Nothing is
    written until `save` or `record_failure`."""

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
        if not path.exists():
            raise NotStored(f"No portfolio is stored as '{key}'.")
        try:
            stored = json.loads(path.read_bytes())
            if stored["schema"] != SCHEMA:
                raise StoreError(
                    f"The stored portfolio '{key}' cannot be read: it was written as version "
                    f"{stored['schema']}, and this application reads version {SCHEMA}."
                )
            found = _portfolio_from(stored["portfolio"])
            if found.key != key:
                raise ValueError("the content is another portfolio's")
        except _UNREADABLE as error:
            raise StoreError(
                f"The stored portfolio '{key}' cannot be read: its file is damaged or is not a "
                "stored portfolio."
            ) from error
        return found

    def keys(self) -> tuple[str, ...]:
        """Every key with a stored set or a recorded failure, in name order."""
        if not self.root.is_dir():
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
        if not path.exists():
            return None
        try:
            stored = json.loads(path.read_bytes())
            return Failure(str(stored["message"]), _utc(datetime.fromisoformat(stored["at"])))
        except _UNREADABLE as error:
            raise StoreError(
                f"The record of the last failed refresh of '{key}' cannot be read."
            ) from error


def _summary(store: Store, key: str, scope: Scope) -> Summary:
    known = STANDING.get(key) if scope == "standing" else None
    listed = Summary(key, known.name if known else key, known.kind if known else None, scope)
    try:
        listed = replace(listed, failure=store.failure(key))
        found = store.load(key)
    except NotStored:
        return listed
    except StoreError as error:
        return replace(listed, error=str(error))
    return replace(
        listed,
        name=found.name,
        kind=found.kind,
        as_of=found.as_of,
        stored_at=found.stored_at,
        positions=len(found.positions),
    )


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


def _row(position: Position) -> Row:
    options: tuple[tuple[Measure, Decimal | None], ...] = (
        (("spread", position.margin),)
        if position.asset_type == "bond"
        else (("discount_margin", position.discount_margin), ("margin", position.margin))
    )
    for measure, value in options:
        if value is not None:
            return Row(position, value, measure)
    return Row(position, None, None)


def rows(
    portfolio: Portfolio,
    *,
    asset_type: AssetType | None = None,
    rating_bucket: str | None = None,
) -> tuple[Row, ...]:
    """The positions of `asset_type` in `rating_bucket` (one of `BUCKET_NAMES`), each with its
    spread measure; None takes every asset type or bucket. Unpriced and flagged positions are
    included: the caller decides what a median may rest on."""
    if rating_bucket is not None and rating_bucket not in BUCKET_NAMES:
        raise ValueError(f"{rating_bucket!r} is not a rating bucket ({', '.join(BUCKET_NAMES)})")
    return tuple(
        _row(position)
        for position in portfolio.positions
        if asset_type in (None, position.asset_type)
        and rating_bucket in (None, position.rating_bucket)
    )


@dataclass(frozen=True)
class Weight:
    """An issuer's weight in a portfolio, in percent. `basis`: `stated_weight`, the sum of the
    weights the file states; `market_value`, the issuer's market value over the market value of
    every priced position (to 28 significant digits); None when the file gives neither, or its
    market values are in more than one currency. `weight` is None when there is no basis, or
    when positions matched and none has a figure on it; with a basis and no match it is 0.
    `matched` counts the positions matched and `unweighted` those of them with no figure on the
    basis, which are left out of the sum, never added as zero."""

    weight: Decimal | None
    basis: Basis | None
    matched: int
    unweighted: int = 0


_DIVISION = Context(prec=28)


def _name_key(name: str) -> str:
    """A name without case, spaces or punctuation: names are equal when these are."""
    return "".join(char for char in name.casefold() if char.isalnum())


def _basis(portfolio: Portfolio) -> tuple[Basis | None, Decimal]:
    """The basis weights can be given on, and for market value the priced total."""
    if any(position.weight is not None for position in portfolio.positions):
        return "stated_weight", Decimal(0)
    priced = [p for p in portfolio.positions if p.market_value is not None]
    total = sum((p.market_value for p in priced if p.market_value is not None), Decimal(0))
    if total and len({p.market_value_currency for p in priced}) == 1:
        return "market_value", total
    return None, Decimal(0)


def issuer_weight(
    portfolio: Portfolio, *, borrower: str | None = None, identifier: str | None = None
) -> Weight:
    """The weight of the positions whose borrower is `borrower` (the whole name, whatever its
    case, spacing and punctuation; never part of a longer name) or that carry `identifier` (any
    of FIGI, ticker, CUSIP, ISIN, SEDOL; case does not matter). With both, a position matching
    either counts."""
    name = _name_key(borrower or "")
    code = (identifier or "").strip().upper()
    if not name and not code:
        raise ValueError("give a borrower or an identifier to match")
    matched = [
        position
        for position in portfolio.positions
        if (name and _name_key(position.borrower or "") == name)
        or (code and code in {item.upper() for item in position.identifiers})
    ]
    basis, total = _basis(portfolio)
    if basis is None:
        return Weight(None, None, len(matched))
    figures = [p.weight if basis == "stated_weight" else p.market_value for p in matched]
    given = [figure for figure in figures if figure is not None]
    missing = len(matched) - len(given)
    if matched and not given:
        return Weight(None, basis, len(matched), missing)
    added = sum(given, Decimal(0))
    if basis == "market_value":
        added = _DIVISION.divide(added * 100, total)
    return Weight(added, basis, len(matched), missing)


def limits(portfolio: Portfolio) -> tuple[Limit, ...]:
    """The portfolio's limits: its constraints rows as given, each with its limit's figure."""
    return portfolio.limits
