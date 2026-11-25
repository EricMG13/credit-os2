"""SYNTHETIC reference-portfolio files: a CLO pack as three CSV files, and two holdings workbooks
in an ASSUMED fund-holdings shape.

Every name, identifier and number here is invented; none is fund, index or market data. They are
inputs for `deploy_workflow.reference_portfolios`, never an output of a run. What the reader must
give for each is written by hand in tests/test_reference_portfolios.py.

The pack has the column headers of the owner's reconciled pack (holdings, constraints, mandate),
and one further column the reader does not know.

The two workbooks are NOT the layout of any real fund's daily holdings file: those files could not
be read when this was written, so their header row and columns are unverified. `LOANS` and `BONDS`
differ on purpose in every respect a reader could wrongly depend on (the rows above the header,
the header's row, its names and their order, how the as-of date is written, percentages as numbers
or as percent cells), to prove the reading follows the header. To look at them:

    uv run python tools/synthetic_reference_portfolios.py <folder>
"""

from __future__ import annotations

import argparse
import csv
import io
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, replace
from datetime import date
from pathlib import Path

from openpyxl import Workbook  # type: ignore[import-untyped]

Row = list[object]

PACK_HOLDINGS = "SYNTHETIC holdings.csv"
PACK_CONSTRAINTS = "SYNTHETIC constraints.csv"
PACK_MANDATE = "SYNTHETIC mandate.csv"
PACK_HEADER: tuple[str, ...] = (
    *("Ticker", "Borrower Name", "Index Sector", "Sub Sector", "Loan Name", "FIGI", "Ranking"),
    *("Ratings", "Size ($Mn)", "Margin", "Maturity", "Bid", "Ask", "Δ 1M", "Δ YTD", "Mid YTM"),
    *("Mid 3Y DM", "Holdings", "Position ID", "Currency", "Mid Price (per 100 par)"),
    *("Mid Market Value (USD)", "Share of Priced MV (%)", "Rating Bucket", "Lien"),
    *("Source Workbook Row", "Companion File", "Companion Row", "Data Quality Flags"),
    "Reviewer Initials",
)
ERROR = "#N/A N/A"


def pack_row(**cells: str) -> dict[str, str]:
    """One holdings row by column name, `_` for a space (`Borrower_Name`); the rest are blank."""
    return {name.replace("_", " "): value for name, value in cells.items()}


# The columns the rows below give, in their order; every row also has `_EVERY_ROW`.
_GIVEN = (
    *("Ticker", "Borrower Name", "Loan Name", "FIGI", "Index Sector", "Ranking", "Ratings"),
    *("Margin", "Maturity", "Bid", "Ask", "Mid YTM", "Mid 3Y DM", "Holdings"),
    *("Mid Price (per 100 par)", "Mid Market Value (USD)", "Share of Priced MV (%)"),
    *("Rating Bucket", "Lien"),
)
_EVERY_ROW = {
    "Sub Sector": "Sub-sector (fictional)",
    "Size ($Mn)": "500",
    "Currency": "USD",
    "Position ID": "P-1",
    "Reviewer Initials": "zz",
}
# Priced market value 2,000,000 + 1,000,000 + 500,000 + 1,000,000 + 500,000 + 0 = 5,000,000; the
# stated shares are of that. Elm (row 7) has no price; Fern (row 8) is a position of zero.
_VALUES: tuple[tuple[str, ...], ...] = (
    (
        *("ASTR", "Aster Fictional Co", "ASTR TL B", "BBG00SYN0001", "Software", "1L Sr. Secd"),
        *("B2 / B", "300", "2029-06-30", "99.5", "100.5", "8.0", "350", "2,000,000.00"),
        *("100", "2000000.00", "40", "B", "1L"),
    ),
    (
        *("ASTR", "Aster Fictional Co", "ASTR TL B2", "BBG00SYN0002", "Software", "1L Sr. Secd"),
        *("B2 / B", "350", "2030-01-31", "97.5", "98.5", "8.5", "400", "1234567.89"),
        *("98", "1,000,000", "20", "B", "1L"),
    ),
    (
        *("BRCH", "Birch Imaginary Inc", "BRCH TL", "BBG00SYN0003", "Chemicals", "1L Sr. Secd"),
        *("Ba3 / BB-", "400", "2028-03-31", "99.5", "100.5", "9.0", "450", "500000"),
        *("100", "500000", "10", "BB", "1L"),
    ),
    (
        *("CEDR", "Cedar Example LLC", "CEDR 2L TL", "BBG00SYN0004", "Software", "2L Secd"),
        *("Caa1 / B-", "600", "2031-03-31", "99.5", "100.5", "11.0", "650", "1000000"),
        *("100", "1000000", "20", "B", "2L"),
    ),
    (
        *("DUNE", "Dune Sample Corp", "DUNE TL B", "BBG00SYN0005", "Healthcare", "1L Sr. Secd"),
        *("Baa3 / BBB-", "175", "2030-06-30", "99.5", "100.5", "6.5", "", "500000"),
        *("100", "500000", "10", "IG", "1L"),
    ),
    (
        *("ELMI", "Elm Invented Ltd", "ELMI TL", ERROR, "Healthcare", "1L Sr. Secd"),
        *("WR / NR", "450", "2029-09-30", ERROR, ERROR, ERROR, ERROR, "750000"),
        *("", "", "", "Unrated", "1L"),
    ),
    (
        *("FERN", "Fern Placeholder SA", "FERN TL", "BBG00SYN07", "Chemicals", "Sr. Secd"),
        *("B2 / B", "0", "2028-12-31", "0", "0", "0", "0", "0"),
        *("0", "0", "0", "B", ""),
    ),
)
PACK_ROWS: tuple[dict[str, str], ...] = tuple(
    {**_EVERY_ROW, **dict(zip(_GIVEN, values, strict=True))} for values in _VALUES
)
PACK_CONSTRAINTS_ROWS: tuple[tuple[str, ...], ...] = (
    (
        *("Constraint Category", "Parameter", "Limit / Guideline", "Breach Type"),
        *("Current Exposure", "Headroom", "Observed Status", "Basis / Notes"),
    ),
    (
        *("Single Name", "Max single issuer exposure", "≤ 2.5% NAV", "Hard"),
        *("2.10%", "0.40%", "Pass", "largest issuer (fictional)"),
    ),
    ("Rating", "Max CCC+ and below", "≤ 7.5% NAV", "Hard", "20.00%", "-12.50%", "Breach", ""),
    ("Spread", "Weighted average spread", "Info only", "—", "361.25 bps", "—", "Info", "no limit"),
)
PACK_MANDATE_ROWS: tuple[tuple[str, ...], ...] = (
    ("Section", "Field", "Value", "Notes"),
    ("Strategy", "Fund Name", "SYNTHETIC Example Loan Fund (fictional)", ""),
    ("Reporting", "As of Date", "31-Oct-2026", "positions date"),
)


def csv_bytes(rows: Sequence[Sequence[object]]) -> bytes:
    stream = io.StringIO()
    csv.writer(stream, lineterminator="\n").writerows(rows)
    return stream.getvalue().encode("utf-8")


def holdings_csv(
    rows: Sequence[Mapping[str, str]] = PACK_ROWS, header: Sequence[str] = PACK_HEADER
) -> bytes:
    return csv_bytes([list(header), *([row.get(name, "") for name in header] for row in rows)])


def pack_files(
    rows: Sequence[Mapping[str, str]] = PACK_ROWS, header: Sequence[str] = PACK_HEADER
) -> dict[str, bytes]:
    """The pack as its three CSV files."""
    return {
        PACK_HOLDINGS: holdings_csv(rows, header),
        PACK_CONSTRAINTS: csv_bytes(PACK_CONSTRAINTS_ROWS),
        PACK_MANDATE: csv_bytes(PACK_MANDATE_ROWS),
    }


# --- Holdings workbooks in an assumed shape (see the module's note) ------------------------------


@dataclass(frozen=True)
class Layout:
    """A holdings workbook: `above` are the rows before the header (None is a row left empty),
    `below` the rows after the last holding. `percent` names header cells whose column is written
    as percent cells (the stored number is a fraction)."""

    sheet: str
    above: tuple[Row | None, ...]
    header: tuple[str, ...]
    rows: tuple[Row, ...]
    below: tuple[Row | None, ...] = ()
    percent: tuple[str, ...] = ()
    indent: int = 0  # empty columns left of the table


# Assumed shape 1: four rows above the header, the as-of date as text in the cell beside a label.
LOANS = Layout(
    sheet="holdings",
    above=(
        ["Fund Name:", "SYNTHETIC Example Senior Loan Fund (fictional)"],
        ["Ticker Symbol:", "LVLN"],
        ["Holdings:", "As of 24-Nov-2026"],
        None,
    ),
    header=(
        *("Name", "Ticker", "Identifier", "SEDOL", "Weight", "Sector", "Par Value"),
        *("Market Value", "Coupon", "Maturity", "Rating", "Local Currency"),
    ),
    rows=(
        [
            *("Aster Fictional Co", "ASTR", "SYN000AA1", "SYN0001", 2.5, "Software", 2500000),
            *(2475000.5, 8.25, date(2029, 6, 30), "B2", "USD"),
        ],
        [
            *("Aster Fictional Co", "ASTR", "SYN000AA2", "SYN0002", 1.5, "Software", 1500000),
            *(1470000, 8.75, date(2030, 1, 31), "B2", "USD"),
        ],
        [
            *("Birch Imaginary Inc", "BRCH", "SYN000BB1", "SYN0003", 0, "Chemicals", 0),
            *(0, 7.5, date(2028, 3, 31), "BB-", "USD"),
        ],
        [
            *("Cedar Example LLC", None, "SYN000CC1", None, None, None, 1000000),
            *(None, None, None, "NR", "USD"),
        ],
        [
            *("Dune Sample Corp", "DUNE", "SYN000DD1", "SYN0005", 96, "Healthcare", 96000000),
            *(95000000, 9, date(2031, 3, 31), "CCC+", "USD"),
        ],
    ),
    below=(
        None,
        ["SYNTHETIC disclaimer: past performance is not a guide to future performance."],
        ["Weights may not add to 100 because of rounding."],
    ),
)
# Assumed shape 2: two rows above the header, the as-of date as a date cell, weights as percent
# cells, other names in another order, a total row and a source line below the holdings.
BONDS = Layout(
    sheet="Portfolio Holdings",
    above=(
        ["SYNTHETIC Example High Yield Bond Fund (fictional)"],
        ["As of Date", date(2026, 11, 23)],
    ),
    header=(
        *("Weight (%)", "ISIN", "CUSIP", "Issuer", "Security Description", "Shares Held"),
        *("Spread", "Maturity Date", "Credit Rating", "Industry", "Currency", "Yield"),
    ),
    rows=(
        [
            *(0.625, "SY0000000011", "SYN000EE1", "Elm Invented Ltd", "ELM 6.5 2030", 5000000),
            *(325, date(2030, 5, 15), "Ba3 / BB-", "Energy", "USD", 7.125),
        ],
        [
            *(0.375, "SY0000000029", "SYN000FF1", "Fern Placeholder SA", "FERN 9 2031", 3000000),
            *(610, date(2031, 2, 1), "Caa1 / B-", "Retail", "USD", 11.25),
        ],
    ),
    below=(["Total", None, None, None, None, 8000000], ["Source: SYNTHETIC, not fund data."]),
    percent=("Weight (%)",),
)


def rearranged(
    layout: Layout, order: Sequence[int], renamed: Mapping[str, str], *, lower: int = 0
) -> Layout:
    """`layout` with its columns in `order`, the header cells in `renamed` given their new names,
    and `lower` more rows above the header."""
    header = tuple(renamed.get(layout.header[i], layout.header[i]) for i in order)
    rows = tuple([row[i] for i in order] for row in layout.rows)
    notes: list[Row | None] = [["SYNTHETIC note"] for _ in range(lower)]
    above = (*notes, *layout.above)
    return replace(layout, header=header, rows=rows, above=above)


def workbook_bytes(layout: Layout) -> bytes:
    book = Workbook()
    sheet = book.active
    sheet.title = layout.sheet
    lines: list[Row | None] = [*layout.above]
    lines += [[*([None] * layout.indent), *row] for row in (layout.header, *layout.rows)]
    lines += layout.below
    first = len(layout.above) + 2  # the first holding's row
    for number, line in enumerate(lines, 1):
        for column, value in enumerate(line or [], 1):
            if value is not None:
                sheet.cell(row=number, column=column, value=value)
    for name in layout.percent:
        column = layout.indent + layout.header.index(name) + 1
        for number in range(first, first + len(layout.rows)):
            sheet.cell(row=number, column=column).number_format = "0.00%"
    stream = io.BytesIO()
    book.save(stream)
    return stream.getvalue()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    parser.add_argument("folder", type=Path)
    folder: Path = parser.parse_args(argv).folder
    folder.mkdir(parents=True, exist_ok=True)
    written = dict(pack_files())
    written["SYNTHETIC assumed shape 1 (loans).xlsx"] = workbook_bytes(LOANS)
    written["SYNTHETIC assumed shape 2 (bonds).xlsx"] = workbook_bytes(BONDS)
    for name, raw in written.items():
        (folder / name).write_bytes(raw)
        print(folder / name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
