"""Reference portfolios (`deploy_workflow.reference_portfolios`): reading a CLO pack and a
fund-holdings workbook into typed positions and limits, storing them, and the questions later
code asks of them.

Every file here is SYNTHETIC (tools/synthetic_reference_portfolios.py and
tools/synthetic_portfolio_exports.py); no name or number is a fund's, an index's or the owner's.
The two holdings workbooks are an ASSUMED shape: no real fund's daily holdings file was read, so
these tests prove the reading follows the header row, not that it reads any real file.
Expected values are written by hand, with the arithmetic beside them. Offline only.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta, timezone
from decimal import Decimal

import pytest

from deploy_vii.inputs import portfolio_export as pe
from deploy_vii.inputs.csv_text import CsvDecodeError
from deploy_vii.inputs.portfolio_export import Quantity
from deploy_workflow import reference_portfolios as rp
from tools import synthetic_portfolio_exports as exports
from tools import synthetic_reference_portfolios as synth

AT = datetime(2026, 11, 25, 9, 30, tzinfo=UTC)
LATER = datetime(2026, 11, 26, 7, 0, tzinfo=UTC)


def pack(rows=synth.PACK_ROWS, header=synth.PACK_HEADER) -> rp.Portfolio:
    return rp.read_clo_pack(synth.pack_files(rows, header), stored_at=AT)


def one(**cells: str) -> rp.Position:
    """The position read from a pack whose one holdings row has `cells`, a borrower and a
    market value."""
    priced = {"Borrower Name": "Aster Fictional Co", "Mid Market Value (USD)": "100"}
    row = {**priced, **synth.pack_row(**cells)}
    return pack([row]).positions[0]


def loans(layout: synth.Layout = synth.LOANS) -> rp.Portfolio:
    raw = synth.workbook_bytes(layout)
    return rp.read_ssga_holdings(raw, rp.LVLN, file_name="loans.xlsx", stored_at=AT)


def bonds(layout: synth.Layout = synth.BONDS) -> rp.Portfolio:
    raw = synth.workbook_bytes(layout)
    return rp.read_ssga_holdings(raw, rp.JNK, file_name="bonds.xlsx", stored_at=AT)


# --- The standing references ---------------------------------------------------------------------


def test_the_three_standing_references_and_where_the_two_funds_files_are():
    assert list(rp.STANDING) == ["clo", "lvln", "jnk"]
    assert (rp.CLO.kind, rp.CLO.asset_type, rp.CLO.url) == ("clo", "loan", None)
    assert (rp.LVLN.kind, rp.LVLN.asset_type) == ("loan_index", "loan")
    assert (rp.JNK.kind, rp.JNK.asset_type) == ("hy_index", "bond")
    folder = "https://www.ssga.com/library-content/products/fund-data/etfs/us/"
    assert rp.LVLN.url == folder + "holdings-daily-us-en-lvln.xlsx"
    assert rp.JNK.url == folder + "holdings-daily-us-en-jnk.xlsx"
    assert rp.BUCKET_NAMES == ("IG", "BB", "B", "CCC", "Unrated")


# --- The CLO pack as three CSV files -------------------------------------------------------------


def test_a_pack_position_keeps_every_field_as_the_file_states_it():
    found = pack()
    assert (found.key, found.name, found.kind) == ("clo", "CLO portfolio", "clo")
    assert found.as_of == date(2026, 10, 31)  # the mandate's `As of Date`, 31-Oct-2026
    assert found.stored_at == AT
    assert [p.row for p in found.positions] == [2, 3, 4, 5, 6, 7, 8]
    assert found.positions[0] == rp.Position(
        row=2,
        borrower="Aster Fictional Co",
        instrument="ASTR TL B",
        figi="BBG00SYN0001",
        ticker="ASTR",
        asset_type="loan",
        sector="Software",  # Index Sector, not Sub Sector
        rating="B2 / B",  # Ratings, not Rating Bucket
        rating_bucket="B",
        stated_bucket="B",
        ranking="1L Sr. Secd",
        lien="first",
        par=Decimal("2000000.00"),  # Holdings, not Mid Price (per 100 par)
        market_value=Decimal("2000000.00"),
        currency="USD",
        market_value_currency="USD",
        weight=Decimal(40),
        margin=Decimal(300),
        discount_margin=Decimal(350),  # Mid 3Y DM
        ytm=Decimal("8.0"),
        maturity=date(2029, 6, 30),
        bid=Decimal("99.5"),
        ask=Decimal("100.5"),
        mid_price=Decimal(100),
    )
    assert found.positions[0].flags == ()
    assert found.positions[0].identifiers == ("BBG00SYN0001", "ASTR")


def test_the_source_files_are_named_with_their_sha256():
    files = synth.pack_files()
    assert pack().sources == tuple(
        rp.SourceFile(name, hashlib.sha256(files[name]).hexdigest())
        for name in (synth.PACK_CONSTRAINTS, synth.PACK_HOLDINGS, synth.PACK_MANDATE)
    )


def test_amounts_keep_every_digit_written_with_or_without_thousands_separators():
    first, second = pack().positions[:2]
    assert str(first.par) == "2000000.00"  # written 2,000,000.00
    assert str(second.par) == "1234567.89"
    assert str(second.market_value) == "1000000"  # written 1,000,000
    assert (second.currency, second.market_value_currency) == ("USD", "USD")


def test_a_blank_cell_is_missing_and_a_zero_is_zero():
    elm, fern = pack().positions[5:]
    # Fern states 0 in every figure: a position of zero, priced at zero.
    assert (fern.par, fern.market_value, fern.weight) == (Decimal(0), Decimal(0), Decimal(0))
    assert (fern.margin, fern.discount_margin, fern.mid_price) == (Decimal(0), Decimal(0), 0)
    assert fern.par is not None
    assert "unpriced" not in fern.flags
    # Elm leaves market value, share and mid price blank: missing, never zero.
    assert (elm.market_value, elm.weight, elm.mid_price) == (None, None, None)
    assert elm.par == Decimal(750000)
    dune = pack().positions[4]
    assert dune.discount_margin is None  # blank, and no flag: nothing was wrong with the cell
    assert dune.flags == ()


def test_a_cell_that_says_not_applicable_is_missing_with_nothing_wrong():
    position = one(Margin="n/a", Mid_3Y_DM="—", Mid_YTM="-", Holdings="0")
    assert (position.margin, position.discount_margin, position.ytm) == (None, None, None)
    assert position.par == Decimal(0)
    assert position.flags == ()


def test_an_unpriced_row_is_kept_and_flagged_with_its_error_markers():
    found = pack()
    elm = found.positions[5]
    assert elm.borrower == "Elm Invented Ltd"
    assert (elm.bid, elm.ask, elm.ytm, elm.discount_margin, elm.figi) == (None,) * 5
    assert elm.flags == (
        "error_marker:figi",
        "figi_malformed",
        "error_marker:bid",
        "error_marker:ask",
        "unpriced",
        "error_marker:discount_margin",
        "error_marker:ytm",
    )
    assert "No price or market value, kept and marked unpriced: 1 position (row 7)." in (
        found.findings
    )
    assert "A vendor error marker in a cell, read as missing: 1 position (row 7)." in found.findings


@pytest.mark.parametrize(
    ("cell", "flags"),
    [
        ("BBG00SYN07", ("figi_malformed",)),  # ten characters
        ("bbg00syn0001", ("figi_malformed",)),  # lower case is not corrected
        ("BBG00SYN0001 ", ()),  # surrounding space is not part of a cell's text
        ("BBG-0SYN0001", ("figi_malformed",)),
        ("#N/A N/A", ("error_marker:figi", "figi_malformed")),
        ("", ()),  # blank: missing, nothing malformed
    ],
)
def test_a_malformed_figi_is_a_missing_identifier_and_the_row_is_kept(cell, flags):
    position = one(FIGI=cell, Ticker="ASTR")
    assert position.figi == ("BBG00SYN0001" if cell.strip() == "BBG00SYN0001" else None)
    assert position.flags == flags
    assert position.ticker == "ASTR"


def test_the_malformed_figi_rows_are_named_in_a_finding():
    assert "A FIGI that is not 12 capital letters and digits, read as missing: 2 positions " in (
        " ".join(pack().findings)
    )
    assert any("(rows 7, 8)" in line and "FIGI" in line for line in pack().findings)


@pytest.mark.parametrize(
    ("rating", "bucket"),
    [
        ("B2 / B", "B"),
        ("Caa1 / B-", "CCC"),  # Moody's first: Caa1 is CCC whatever S&P says
        ("WR / NR", "Unrated"),
        ("Ba3 / BB-", "BB"),
        ("Baa3 / BBB-", "IG"),
        ("NR / BB+", "BB"),  # no Moody's rating: S&P
        ("B3", "B"),  # one rating, on Moody's scale
        ("BBB-", "IG"),  # one rating, on S&P's scale
        ("CCC+", "CCC"),
        ("#N/A N/A", "Unrated"),
        ("", "Unrated"),
    ],
)
def test_the_rating_bucket_is_the_projects_scale_moodys_first(rating, bucket):
    assert one(Ratings=rating).rating_bucket == bucket


def test_the_rating_text_is_kept_as_given_and_an_unread_one_is_flagged():
    assert one(Ratings="Caa1 / B-").rating == "Caa1 / B-"
    assert one(Ratings="WR / NR").flags == ()  # withdrawn and not rated: unrated, no defect
    assert one(Ratings="").rating is None
    odd = one(Ratings="Single-B")
    assert (odd.rating, odd.rating_bucket, odd.flags) == ("Single-B", "Unrated", ("rating_unread",))


def test_the_packs_own_bucket_is_kept_and_a_disagreement_is_flagged():
    found = pack()
    cedar = found.positions[3]
    assert (cedar.rating, cedar.rating_bucket, cedar.stated_bucket) == ("Caa1 / B-", "CCC", "B")
    assert cedar.flags == ("rating_bucket_differs",)
    assert [p.stated_bucket for p in found.positions] == ["B", "B", "BB", "B", "IG", "Unrated", "B"]
    assert [p.rating_bucket for p in found.positions] == [
        *("B", "B", "BB", "CCC", "IG", "Unrated", "B")
    ]
    assert (
        "The file's own rating bucket differs from the bucket its rating gives: 1 position (row 5)."
        in found.findings
    )


def test_the_lien_is_read_from_the_lien_column_then_the_ranking():
    found = pack()
    assert [p.lien for p in found.positions] == [
        *("first", "first", "first", "second", "first", "first", None)
    ]
    assert one(Ranking="2L Secd").lien == "second"
    assert one(Ranking="Sr. Secd", Lien="First Lien").lien == "first"


def test_a_cell_that_is_not_a_number_or_a_date_is_missing_and_flagged():
    position = one(Holdings="about 5m", Maturity="next year", Margin="~300")
    assert (position.par, position.maturity, position.margin) == (None, None, None)
    assert position.flags == ("unreadable:par", "unreadable:margin", "unreadable:maturity")


def test_the_limits_are_the_constraints_rows_as_given_with_the_limits_figure():
    limits = rp.limits(pack())
    assert limits[0] == rp.Limit(
        source=synth.PACK_CONSTRAINTS,
        row=2,
        category="Single Name",
        parameter="Max single issuer exposure",
        limit="≤ 2.5% NAV",
        breach_type="Hard",
        current_exposure="2.10%",
        headroom="0.40%",
        observed_status="Pass",
        notes="largest issuer (fictional)",
        quantity=Quantity(Decimal("2.5"), "% NAV", "<=", places=1),
    )
    assert [(item.row, item.limit, item.observed_status) for item in limits] == [
        (2, "≤ 2.5% NAV", "Pass"),
        (3, "≤ 7.5% NAV", "Breach"),
        (4, "Info only", "Info"),
    ]
    assert limits[1].quantity == Quantity(Decimal("7.5"), "% NAV", "<=", places=1)
    assert limits[1].headroom == "-12.50%"
    assert (limits[2].quantity, limits[2].breach_type, limits[2].notes) == (None, "—", "no limit")


def test_the_mandate_rows_are_kept_as_given():
    assert pack().mandate == (
        rp.MandateRow(2, "Strategy", "Fund Name", "SYNTHETIC Example Loan Fund (fictional)", ""),
        rp.MandateRow(3, "Reporting", "As of Date", "31-Oct-2026", "positions date"),
    )


def test_the_columns_found_are_recorded_and_an_unknown_column_is_ignored():
    found = pack()
    columns = dict(found.columns_found)
    assert columns["rating"] == "Ratings"
    assert columns["stated_bucket"] == "Rating Bucket"
    assert columns["par"] == "Holdings"
    assert columns["mid_price"] == "Mid Price (per 100 par)"
    assert columns["market_value"] == "Mid Market Value (USD)"
    assert columns["weight"] == "Share of Priced MV (%)"
    assert columns["sector"] == "Index Sector"
    assert columns["discount_margin"] == "Mid 3Y DM"
    assert columns["margin"] == "Margin"
    assert columns["lien"] == "Lien"
    assert columns["ranking"] == "Ranking"
    assert columns["instrument"] == "Loan Name"
    assert "Reviewer Initials" not in columns.values()
    assert "Position ID" not in columns.values()
    assert found.columns_missing == ("cusip", "isin", "sedol", "identifier", "coupon")


def test_a_pack_without_a_mandate_has_no_as_of_date_and_says_so():
    files = synth.pack_files()
    del files[synth.PACK_MANDATE], files[synth.PACK_CONSTRAINTS]
    found = rp.read_clo_pack(files, stored_at=AT)
    assert found.as_of is None
    assert (found.limits, found.mandate) == ((), ())
    assert found.findings[:3] == (
        "The files state no as-of date that could be read.",
        "No constraints file was supplied: the portfolio has no limits.",
        "No mandate file was supplied.",
    )


def test_a_file_that_is_not_part_of_the_pack_is_named_not_read():
    files = {**synth.pack_files(), "notes.csv": b"a,b\n1,2\n"}
    found = rp.read_clo_pack(files, stored_at=AT)
    assert "Not part of a reference portfolio and not read: notes.csv." in found.findings
    assert "notes.csv" not in [source.name for source in found.sources]


def test_a_pack_with_a_holdings_workbook_takes_market_value_at_the_mid_price():
    found = rp.read_clo_pack(exports.files(exports.clean()), stored_at=AT)
    assert found.as_of == date(2025, 3, 31)
    assert len(found.positions) == 7
    second = found.positions[1]
    # Aster's second loan: par 10,000,000 at (97.5 + 98.5) / 2 = 98 is 9,800,000.
    assert (second.row, second.par, second.mid_price) == (3, Decimal(10000000), Decimal(98))
    assert second.market_value == Decimal(9800000)
    assert second.flags == ("market_value_at_mid",)
    assert second.maturity == date(2030, 1, 31)  # a date cell
    assert (second.currency, second.market_value_currency, second.weight) == (None, None, None)
    assert len(found.limits) == 22  # 15 rows of the monitor and 7 of the second constraints file
    assert any(line.startswith("Market value is not stated") for line in found.findings)


def test_files_with_no_holdings_table_are_an_error_not_an_empty_portfolio():
    files = synth.pack_files()
    del files[synth.PACK_HOLDINGS]
    with pytest.raises(rp.PortfolioFileError, match="holdings"):
        rp.read_clo_pack(files, stored_at=AT)
    with pytest.raises(rp.PortfolioFileError, match="no rows"):
        pack(rows=[])


# --- A fund-holdings workbook (assumed shapes) ---------------------------------------------------


def test_a_holdings_workbook_is_read_by_its_header_row():
    raw = synth.workbook_bytes(synth.LOANS)
    found = rp.read_ssga_holdings(raw, rp.LVLN, file_name="loans.xlsx", stored_at=AT)
    assert (found.key, found.kind, found.name) == ("lvln", "loan_index", rp.LVLN.name)
    assert found.as_of == date(2026, 11, 24)  # `As of 24-Nov-2026` beside `Holdings:`
    assert found.stated_name == "SYNTHETIC Example Senior Loan Fund (fictional)"
    assert found.stated_ticker == "LVLN"
    assert [p.row for p in found.positions] == [6, 7, 8, 9, 10]  # the header is row 5
    assert found.positions[0] == rp.Position(
        row=6,
        borrower="Aster Fictional Co",
        ticker="ASTR",
        sedol="SYN0001",
        identifier="SYN000AA1",
        asset_type="loan",
        sector="Software",
        rating="B2",
        rating_bucket="B",
        par=Decimal(2500000),
        market_value=Decimal("2475000.5"),
        currency="USD",
        market_value_currency="USD",
        weight=Decimal("2.5"),
        coupon=Decimal("8.25"),
        maturity=date(2029, 6, 30),
    )
    assert [p.rating_bucket for p in found.positions] == ["B", "B", "BB", "Unrated", "CCC"]
    assert found.sources == (rp.SourceFile("loans.xlsx", hashlib.sha256(raw).hexdigest()),)


def test_a_holdings_workbook_keeps_missing_and_zero_apart_and_flags_the_unpriced_row():
    birch, cedar = loans().positions[2:4]
    assert (birch.weight, birch.par, birch.market_value) == (Decimal(0), Decimal(0), Decimal(0))
    assert birch.flags == ()
    assert (cedar.weight, cedar.market_value, cedar.ticker, cedar.sector) == (None,) * 4
    assert cedar.par == Decimal(1000000)
    assert cedar.flags == ("unpriced",)


def test_rows_below_the_holdings_table_are_not_positions_and_are_counted():
    found = loans()
    assert [p.borrower for p in found.positions][-1] == "Dune Sample Corp"
    assert (
        "Below the holdings table and not read as positions: 2 rows with text (rows 12, 13)."
        in found.findings
    )
    # The second shape ends in a total row and a source line.
    assert [p.row for p in bonds().positions] == [4, 5]
    assert (
        "Below the holdings table and not read as positions: 2 rows with text (rows 6, 7)."
        in bonds().findings
    )


def test_the_columns_found_and_not_found_are_recorded():
    found = loans()
    assert found.columns_found == (
        ("borrower", "Name"),
        ("ticker", "Ticker"),
        ("sedol", "SEDOL"),
        ("identifier", "Identifier"),
        ("sector", "Sector"),
        ("rating", "Rating"),
        ("par", "Par Value"),
        ("market_value", "Market Value"),
        ("currency", "Local Currency"),
        ("weight", "Weight"),
        ("coupon", "Coupon"),
        ("maturity", "Maturity"),
    )
    assert found.columns_missing == (
        *("instrument", "figi", "cusip", "isin", "stated_bucket", "ranking", "lien", "margin"),
        *("discount_margin", "ytm", "bid", "ask", "mid_price"),
    )


def test_a_second_shape_with_other_names_order_and_rows_above_reads_the_same_way():
    found = bonds()
    assert found.as_of == date(2026, 11, 23)  # a date cell beside `As of Date`
    assert (found.stated_name, found.stated_ticker) == (None, None)
    assert found.positions[0] == rp.Position(
        row=4,
        borrower="Elm Invented Ltd",
        instrument="ELM 6.5 2030",
        cusip="SYN000EE1",
        isin="SY0000000011",
        asset_type="bond",
        sector="Energy",  # Industry
        rating="Ba3 / BB-",
        rating_bucket="BB",
        par=Decimal(5000000),  # Shares Held
        currency="USD",
        weight=Decimal("62.5"),  # a percent cell holding 0.625
        margin=Decimal(325),  # Spread
        ytm=Decimal("7.125"),
        maturity=date(2030, 5, 15),
    )
    assert found.positions[0].flags == ()  # the file has no price column: nothing is unpriced
    assert found.positions[1].weight == Decimal("37.5")
    assert found.positions[1].rating_bucket == "CCC"
    assert "Par is read from the column 'Shares Held'." in found.findings


def test_a_changed_header_row_still_maps():
    renamed = {
        "Name": "Security Name",
        "Weight": "% of Net Assets",
        "Par Value": "Notional",
        "Market Value": "MV (USD)",
        "Local Currency": "Currency",
        "Rating": "Credit Rating",
    }
    order = list(reversed(range(len(synth.LOANS.header))))
    layout = replace(synth.rearranged(synth.LOANS, order, renamed, lower=3), indent=2)
    found, before = loans(layout), loans()
    assert [p.row for p in found.positions] == [9, 10, 11, 12, 13]  # three rows lower
    assert found.as_of == date(2026, 11, 24)
    assert dict(found.columns_found)["weight"] == "% of Net Assets"
    assert dict(found.columns_found)["par"] == "Notional"
    first = found.positions[0]
    assert (first.weight, first.par, first.market_value) == (
        *(Decimal("2.5"), Decimal(2500000), Decimal("2475000.5")),
    )
    # `Security Name` is the instrument; with no issuer column it is the borrower too.
    assert (first.borrower, first.instrument) == ("Aster Fictional Co", "Aster Fictional Co")
    assert [replace(p, row=p.row - 3, instrument=None) for p in found.positions] == list(
        before.positions
    )


def test_a_header_that_loses_the_name_column_is_an_error():
    order = list(range(1, len(synth.LOANS.header)))  # every column but Name
    with pytest.raises(rp.PortfolioFileError, match="no column for the holding's name") as error:
        loans(synth.rearranged(synth.LOANS, order, {}))
    assert "row 5" in str(error.value)
    assert "CP-" not in str(error.value)


def test_a_header_with_no_weight_par_or_market_value_is_an_error():
    order = [0, 1, 2, 3, 5, 8, 9, 10, 11]
    with pytest.raises(rp.PortfolioFileError, match="weight, par or market value"):
        loans(synth.rearranged(synth.LOANS, order, {}))


def test_a_workbook_with_no_header_row_or_no_workbook_at_all_is_an_error():
    notes = replace(synth.LOANS, header=("Notes",), rows=(["SYNTHETIC text"],), below=())
    with pytest.raises(rp.PortfolioFileError, match="no header row"):
        loans(notes)
    with pytest.raises(rp.PortfolioFileError, match="cannot be read as an Excel workbook"):
        rp.read_ssga_holdings(b"not a workbook", rp.LVLN, file_name="x.xlsx", stored_at=AT)


def test_a_file_with_no_as_of_date_has_none_and_says_so():
    found = loans(replace(synth.LOANS, above=(["Fund Name:", "SYNTHETIC fund (fictional)"],)))
    assert found.as_of is None
    assert "The files state no as-of date that could be read." in found.findings


def test_a_file_naming_another_fund_is_reported():
    raw = synth.workbook_bytes(synth.LOANS)
    found = rp.read_ssga_holdings(raw, rp.JNK, file_name="loans.xlsx", stored_at=AT)
    assert "The file names the fund ticker LVLN; JNK was expected." in found.findings


def test_weights_that_do_not_add_to_about_100_are_reported():
    rows = tuple([*row[:4], 0.25, *row[5:]] for row in synth.LOANS.rows)
    found = loans(replace(synth.LOANS, rows=rows))
    # Five positions stated at 0.25 each: 1.25, as a file of fractions would read.
    assert "The stated weights add to 1.25%, not about 100%." in found.findings
    assert not any("stated weights add" in line for line in loans().findings)  # 100


# --- Whatever an analyst supplies ----------------------------------------------------------------


def test_an_analysts_pack_is_a_custom_portfolio():
    found = rp.read_portfolio_files(synth.pack_files(), name="Analyst book", stored_at=AT)
    assert (found.key, found.name, found.kind) == ("custom", "Analyst book", "custom")
    assert len(found.positions) == 7
    assert len(found.limits) == 3
    assert {p.asset_type for p in found.positions} == {None}  # not stated


def test_an_analysts_holdings_workbook_is_a_custom_portfolio_with_any_limits_supplied():
    files = {
        "book.xlsx": synth.workbook_bytes(synth.BONDS),
        "limits.csv": synth.csv_bytes(synth.PACK_CONSTRAINTS_ROWS),
    }
    found = rp.read_portfolio_files(files, name="Analyst bonds", stored_at=AT)
    assert [p.borrower for p in found.positions] == ["Elm Invented Ltd", "Fern Placeholder SA"]
    assert found.as_of == date(2026, 11, 23)
    assert len(found.limits) == 3
    assert [source.name for source in found.sources] == ["book.xlsx", "limits.csv"]


def test_a_sheet_named_holdings_in_another_shape_is_still_read_by_its_header():
    # The first shape's sheet is named `holdings`, as the pack's holdings sheet is.
    files = {"loans.xlsx": synth.workbook_bytes(synth.LOANS)}
    found = rp.read_portfolio_files(files, reference=rp.LVLN, stored_at=AT)
    assert (found.key, len(found.positions), found.as_of) == ("lvln", 5, date(2026, 11, 24))


def test_files_that_are_no_portfolio_are_an_error():
    with pytest.raises(rp.PortfolioFileError, match="notes.csv"):
        rp.read_portfolio_files({"notes.csv": b"a,b\n1,2\n"}, name="x", stored_at=AT)
    with pytest.raises(rp.PortfolioFileError):
        rp.read_portfolio_files({}, name="x", stored_at=AT)
    with pytest.raises(ValueError, match="name or a reference"):
        rp.read_portfolio_files(synth.pack_files(), stored_at=AT)


def test_the_stored_time_is_the_callers_and_must_be_utc():
    with pytest.raises(ValueError, match="UTC"):
        rp.read_clo_pack(synth.pack_files(), stored_at=datetime(2026, 11, 25, 9, 30))
    paris = timezone(timedelta(hours=1))
    with pytest.raises(ValueError, match="UTC"):
        rp.read_clo_pack(synth.pack_files(), stored_at=datetime(2026, 11, 25, 9, 30, tzinfo=paris))


# --- Questions later code asks -------------------------------------------------------------------


def test_rows_filters_by_asset_type_and_bucket_and_names_the_spread_measure():
    found = pack()
    assert [r.position.row for r in rp.rows(found, rating_bucket="B")] == [2, 3, 8]
    assert [r.position.row for r in rp.rows(found, asset_type="loan", rating_bucket="CCC")] == [5]
    assert rp.rows(found, asset_type="bond") == ()
    assert len(rp.rows(found)) == 7
    by_row = {r.position.row: (r.spread, r.measure) for r in rp.rows(found)}
    assert by_row[2] == (Decimal(350), "discount_margin")
    assert by_row[6] == (Decimal(175), "margin")  # Dune: no discount margin, so its margin
    assert by_row[7] == (Decimal(450), "margin")  # Elm: the discount margin is an error marker
    assert by_row[8] == (Decimal(0), "discount_margin")  # Fern: zero is a value
    assert one().rating_bucket == "Unrated"
    blank = rp.rows(pack([{"Borrower Name": "Aster Fictional Co", "Holdings": "1"}]))[0]
    assert (blank.spread, blank.measure) == (None, None)
    with pytest.raises(ValueError, match="rating bucket"):
        rp.rows(found, rating_bucket="Single-B")


def test_a_bonds_measure_is_its_spread():
    ccc = rp.rows(bonds(), asset_type="bond", rating_bucket="CCC")
    assert [(r.position.borrower, r.spread, r.measure) for r in ccc] == [
        ("Fern Placeholder SA", Decimal(610), "spread")
    ]
    assert rp.rows(bonds(), asset_type="loan") == ()


def test_an_issuers_weight_is_the_sum_of_its_stated_weights():
    found = pack()
    # Aster holds two loans stated at 40% and 20%.
    assert rp.issuer_weight(found, borrower="Aster Fictional Co") == rp.Weight(
        Decimal(60), "stated_weight", matched=2, matched_by=("name",)
    )
    assert rp.issuer_weight(found, borrower="  ASTER fictional, CO. ") == rp.Weight(
        Decimal(60), "stated_weight", matched=2, matched_by=("name",)
    )
    assert rp.issuer_weight(found, borrower="Fern Placeholder SA").weight == Decimal(0)


def test_a_name_matches_whole_never_as_part_of_another():
    found = pack()
    none = rp.Weight(Decimal(0), "stated_weight", matched=0)
    assert rp.issuer_weight(found, borrower="Aster") == none
    assert rp.issuer_weight(found, borrower="Aster Fictional Co Holdings II") == none
    assert rp.issuer_weight(found, borrower="Golden Mock Holdings") == none


def test_an_issuer_is_matched_by_any_identifier():
    found = pack()
    assert rp.issuer_weight(found, identifier="BBG00SYN0002") == rp.Weight(
        Decimal(20), "stated_weight", matched=1, matched_by=("identifier",)
    )
    assert rp.issuer_weight(found, identifier="astr").matched == 2  # the ticker, either case
    assert rp.issuer_weight(found, identifier="BBG00SYN9999").matched == 0
    assert rp.issuer_weight(bonds(), identifier="SYN000FF1") == rp.Weight(
        Decimal("37.5"), "stated_weight", matched=1, matched_by=("identifier",)
    )
    # A name and an identifier together: a position matching either.
    both = rp.issuer_weight(found, borrower="Birch Imaginary Inc", identifier="BBG00SYN0001")
    assert both == rp.Weight(
        Decimal(50), "stated_weight", matched=2, matched_by=("name", "identifier")
    )  # 10 + 40
    with pytest.raises(ValueError, match="borrower or an identifier"):
        rp.issuer_weight(found)


def test_a_matched_position_with_no_stated_weight_is_counted_not_added_as_zero():
    found = pack()
    assert rp.issuer_weight(found, borrower="Elm Invented Ltd") == rp.Weight(
        None, "stated_weight", matched=1, unweighted=1, matched_by=("name",)
    )
    both = rp.issuer_weight(found, borrower="Elm Invented Ltd", identifier="DUNE")
    assert both == rp.Weight(
        Decimal(10), "stated_weight", matched=2, unweighted=1, matched_by=("name", "identifier")
    )


def test_without_stated_weights_the_weight_is_market_value_over_priced_market_value():
    found = rp.read_clo_pack(exports.files(exports.clean()), stored_at=AT)
    # At mid: Aster 20,000,000 + 9,800,000 = 29,800,000 of 100,000,000 priced.
    assert rp.issuer_weight(found, borrower="Aster Fictional Co") == rp.Weight(
        Decimal("29.8"), "market_value", matched=2, matched_by=("name",)
    )
    assert rp.issuer_weight(found, borrower="Nobody Fictional") == rp.Weight(
        Decimal(0), "market_value", matched=0
    )


def test_with_neither_weights_nor_market_values_no_weight_can_be_given():
    order = list(range(1, len(synth.BONDS.header)))  # the bonds without the weight column
    found = bonds(replace(synth.rearranged(synth.BONDS, order, {}), percent=()))
    assert rp.issuer_weight(found, borrower="Elm Invented Ltd") == rp.Weight(
        None, None, matched=1, matched_by=("name",)
    )
    assert rp.issuer_weight(found, borrower="Nobody Fictional") == rp.Weight(None, None, matched=0)


# --- The store -----------------------------------------------------------------------------------


def test_a_stored_portfolio_comes_back_exactly(tmp_path):
    store = rp.Store(tmp_path / "standing")
    for portfolio in (pack(), loans(), bonds()):
        store.save(portfolio)
        back = store.load(portfolio.key)
        assert back == portfolio
        # Equal decimals may be written differently (2000000.00 and 2000000): the text is kept.
        assert [str(p.par) for p in back.positions] == [str(p.par) for p in portfolio.positions]
        assert [str(p.weight) for p in back.positions] == [
            str(p.weight) for p in portfolio.positions
        ]
    assert str(store.load("clo").positions[0].par) == "2000000.00"
    assert store.load("clo").limits[0].quantity == Quantity(Decimal("2.5"), "% NAV", "<=", places=1)
    assert store.keys() == ("clo", "jnk", "lvln")
    assert sorted(path.name for path in (tmp_path / "standing").iterdir()) == [
        *("clo.json", "jnk.json", "lvln.json")  # no temporary file is left
    ]


def test_the_stored_file_is_json_with_a_schema_version_and_text_decimals(tmp_path):
    rp.Store(tmp_path).save(pack())
    stored = json.loads((tmp_path / "clo.json").read_text(encoding="utf-8"))
    assert stored["schema"] == 2  # version 2 carries `strict` in each limit's quantity
    body = stored["portfolio"]
    assert (body["as_of"], body["stored_at"]) == ("2026-10-31", "2026-11-25T09:30:00+00:00")
    assert body["positions"][1]["par"] == "1234567.89"
    assert body["positions"][5]["market_value"] is None
    assert body["positions"][6]["market_value"] == "0"
    assert body["positions"][0]["maturity"] == "2029-06-30"


def test_a_new_set_replaces_the_one_before(tmp_path):
    store = rp.Store(tmp_path)
    store.save(pack())
    newer = replace(pack(synth.PACK_ROWS[:2]), stored_at=LATER)
    store.save(newer)
    assert store.load("clo") == newer
    assert len(store.load("clo").positions) == 2


def test_a_failed_refresh_keeps_the_set_before_and_both_are_listed(tmp_path):
    store = rp.Store(tmp_path)
    store.save(loans())
    before = (tmp_path / "lvln.json").read_bytes()
    store.record_failure("lvln", "The fund's holdings file could not be fetched.", LATER)
    assert (tmp_path / "lvln.json").read_bytes() == before
    assert store.load("lvln") == loans()
    listed = {item.key: item for item in rp.list_portfolios(store)}
    assert listed["lvln"] == rp.Summary(
        key="lvln",
        name=rp.LVLN.name,
        kind="loan_index",
        scope="standing",
        as_of=date(2026, 11, 24),
        stored_at=AT,
        positions=5,
        failure=rp.Failure("The fund's holdings file could not be fetched.", LATER),
    )
    # The next good set clears the failure.
    store.save(replace(loans(), stored_at=LATER))
    assert rp.list_portfolios(store)[1].failure is None


def test_a_failure_with_no_set_before_is_listed_with_no_as_of_date(tmp_path):
    store = rp.Store(tmp_path)
    store.record_failure("jnk", "The fund's holdings file could not be fetched.", LATER)
    assert store.keys() == ("jnk",)
    assert rp.list_portfolios(store) == (
        rp.Summary("clo", rp.CLO.name, "clo", "standing"),
        rp.Summary("lvln", rp.LVLN.name, "loan_index", "standing"),
        rp.Summary(
            *("jnk", rp.JNK.name, "hy_index", "standing"),
            failure=rp.Failure("The fund's holdings file could not be fetched.", LATER),
        ),
    )
    with pytest.raises(rp.NotStored):
        store.load("jnk")


def test_the_three_standing_references_are_offered_before_anything_is_stored(tmp_path):
    listed = rp.list_portfolios(rp.Store(tmp_path / "not-made-yet"))
    assert [(item.key, item.as_of, item.positions, item.error) for item in listed] == [
        ("clo", None, None, None),
        ("lvln", None, None, None),
        ("jnk", None, None, None),
    ]
    assert not (tmp_path / "not-made-yet").exists()  # listing writes nothing


@pytest.mark.parametrize(
    "content",
    [
        b"{ not json",
        b"[]",
        b'{"schema": 99, "portfolio": {}}',
        b'{"schema": 1, "portfolio": {"key": "clo"}}',
        b"",
    ],
)
def test_a_stored_file_that_cannot_be_read_is_reported_for_its_key_only(tmp_path, content):
    store = rp.Store(tmp_path)
    store.save(pack())
    store.save(loans())
    (tmp_path / "clo.json").write_bytes(content)
    with pytest.raises(rp.StoreError, match="clo"):
        store.load("clo")
    listed = rp.list_portfolios(store)
    assert [item.key for item in listed] == ["clo", "lvln", "jnk"]
    clo = listed[0]
    assert (clo.name, clo.kind, clo.as_of, clo.positions) == (rp.CLO.name, "clo", None, None)
    assert clo.error is not None
    assert "cannot be read" in clo.error
    assert (listed[1].positions, listed[1].error) == (5, None)


@pytest.mark.parametrize("target_exists", [True, False], ids=["linked", "dangling"])
def test_a_symlinked_portfolio_is_reported_as_unreadable(tmp_path, target_exists):
    # Aster Fictional Co, 2026-10-31, synthetic CLO pack.
    target = tmp_path / "outside" / "clo.json"
    if target_exists:
        rp.Store(target.parent).save(pack())
    root = tmp_path / "standing"
    root.mkdir()
    (root / "clo.json").symlink_to(target)
    store = rp.Store(root)

    with pytest.raises(rp.StoreError, match="stored portfolio 'clo' cannot be read") as refused:
        store.load("clo")
    assert not isinstance(refused.value, rp.NotStored)
    assert store.keys() == ("clo",)
    assert rp.list_portfolios(store)[0].positions is None


@pytest.mark.parametrize("target_exists", [True, False], ids=["linked", "dangling"])
def test_a_symlinked_failure_is_reported_beside_the_good_portfolio(tmp_path, target_exists):
    # Aster Fictional Co, 2026-10-31, synthetic CLO pack.
    target = tmp_path / "outside" / "clo.failure.json"
    if target_exists:
        rp.Store(target.parent).record_failure("clo", "Outside failure record.", LATER)
    store = rp.Store(tmp_path / "standing")
    store.save(pack())
    (store.root / "clo.failure.json").symlink_to(target)

    with pytest.raises(rp.StoreError, match="last failed refresh of 'clo' cannot be read"):
        store.failure("clo")
    listed = rp.list_portfolios(store)[0]
    assert (listed.as_of, listed.positions, listed.failure, listed.error) == (
        date(2026, 10, 31),
        7,
        None,
        "The record of the last failed refresh of 'clo' cannot be read.",
    )


@pytest.mark.parametrize("target_exists", [True, False], ids=["linked", "dangling"])
def test_a_symlinked_final_store_root_is_unavailable(tmp_path, target_exists):
    # Aster Fictional Co, 2026-10-31, synthetic CLO pack.
    target = tmp_path / "outside"
    outside = rp.Store(target)
    if target_exists:
        outside.save(pack())
        outside.record_failure("clo", "Outside failure record.", LATER)
    root = tmp_path / "standing"
    root.symlink_to(target, target_is_directory=True)
    store = rp.Store(root)

    assert store.keys() == ()
    with pytest.raises(rp.StoreError, match="stored portfolio 'clo' cannot be read") as refused:
        store.load("clo")
    assert not isinstance(refused.value, rp.NotStored)
    with pytest.raises(rp.StoreError, match="last failed refresh of 'clo' cannot be read"):
        store.failure("clo")
    with pytest.raises(OSError):
        store.save(replace(pack(), stored_at=LATER))
    with pytest.raises(OSError):
        store.record_failure("clo", "Changed failure record.", LATER)
    if target_exists:
        assert outside.load("clo").stored_at == AT
        assert outside.failure("clo") == rp.Failure("Outside failure record.", LATER)
    else:
        assert not target.exists()


@pytest.mark.parametrize("file_is_root", [True, False], ids=["file-root", "file-ancestor"])
def test_a_store_whose_root_path_contains_a_file_has_no_records(tmp_path, file_is_root):
    # Synthetic CLO key, Aster Fictional Co, 2026-10-31. No holdings were stored.
    file = tmp_path / "not-a-directory"
    file.touch()
    store = rp.Store(file if file_is_root else file / "standing")

    assert store.keys() == ()
    with pytest.raises(rp.NotStored, match="No portfolio is stored as 'clo'"):
        store.load("clo")
    assert store.failure("clo") is None


def test_a_stored_file_written_by_a_newer_version_says_so(tmp_path):
    store = rp.Store(tmp_path)
    (tmp_path / "clo.json").write_text('{"schema": 99, "portfolio": {}}', encoding="utf-8")
    with pytest.raises(rp.StoreError, match="version 99"):
        store.load("clo")


def test_a_stored_figure_that_is_not_text_is_refused_not_coerced(tmp_path):
    store = rp.Store(tmp_path)
    store.save(pack())
    stored = json.loads((tmp_path / "clo.json").read_text(encoding="utf-8"))
    stored["portfolio"]["positions"][0]["par"] = 2000000.0
    (tmp_path / "clo.json").write_text(json.dumps(stored), encoding="utf-8")
    with pytest.raises(rp.StoreError):
        store.load("clo")


def test_a_runs_own_portfolio_is_listed_after_the_standing_ones(tmp_path):
    standing, run = rp.Store(tmp_path / "standing"), rp.Store(tmp_path / "run" / "portfolios")
    standing.save(pack())
    custom = rp.read_portfolio_files(synth.pack_files(), name="Analyst book", stored_at=LATER)
    run.save(custom)
    listed = rp.list_portfolios(standing, run)
    assert [(item.key, item.scope) for item in listed] == [
        *(("clo", "standing"), ("lvln", "standing"), ("jnk", "standing"), ("custom", "run"))
    ]
    assert listed[3] == rp.Summary(
        key="custom",
        name="Analyst book",
        kind="custom",
        scope="run",
        as_of=date(2026, 10, 31),
        stored_at=LATER,
        positions=7,
    )
    assert run.load("custom") == custom
    assert standing.keys() == ("clo",)


@pytest.mark.parametrize("key", ["", "../clo", "CLO", "a/b", "clo.json", "a b"])
def test_a_key_that_is_not_a_plain_name_is_refused(tmp_path, key):
    store = rp.Store(tmp_path)
    with pytest.raises(ValueError, match="key"):
        store.load(key)
    with pytest.raises(ValueError, match="key"):
        store.record_failure(key, "x", AT)
    with pytest.raises(ValueError, match="key"):
        store.save(replace(pack(), key=key))


# --- Review findings, 25 November 2026 ------------------------------------------------------------

SHEET = "xl/worksheets/sheet1.xml"


def custom_csv(rows: list[list[object]], name: str = "h.csv") -> rp.Portfolio:
    return rp.read_portfolio_files({name: synth.csv_bytes(rows)}, name="Analyst", stored_at=AT)


def with_above(day: str, layout: synth.Layout = synth.LOANS) -> synth.Layout:
    """LOANS with its `Holdings:` cell stating `day`."""
    return replace(layout, above=(*layout.above[:2], ["Holdings:", f"As of {day}"], None))


def analysts(layout: synth.Layout) -> rp.Portfolio:
    """The layout's workbook supplied by an analyst: a custom portfolio, no date order known."""
    files = {"book.xlsx": synth.workbook_bytes(layout)}
    return rp.read_portfolio_files(files, name="Analyst", stored_at=AT)


def counted(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    calls: list[int] = []
    parse = pe.xlsx_content

    def counting(raw: bytes) -> object:
        calls.append(1)
        return parse(raw)

    monkeypatch.setattr(pe, "xlsx_content", counting)
    return calls


def pack_book(*extra: tuple[str, list[list[object] | None]]) -> bytes:
    """The pack as one workbook: its holdings, constraints and mandate as sheets, then `extra`."""
    holdings = [
        list(synth.PACK_HEADER),
        *([r.get(h, "") for h in synth.PACK_HEADER] for r in synth.PACK_ROWS),
    ]
    return synth.book_bytes(
        [
            ("Holdings", holdings),
            ("Constraints", [list(row) for row in synth.PACK_CONSTRAINTS_ROWS]),
            ("Mandate", [list(row) for row in synth.PACK_MANDATE_ROWS]),
            *extra,
        ]
    )


# 1. One parse of a workbook per read; rows no wider than their cells; a ceiling on rows.


def test_a_workbook_is_parsed_once_whichever_reader_reads_it(monkeypatch):
    filler: list[list[object] | None] = [[n, n * 2, n * 3] for n in range(20)]
    raw = pack_book(("Notes", filler), ("More notes", filler))
    calls = counted(monkeypatch)
    found = rp.read_portfolio_files({"pack.xlsx": raw}, name="Analyst", stored_at=AT)
    assert (len(found.positions), len(found.limits), len(calls)) == (7, 3, 1)
    calls.clear()
    assert len(rp.read_clo_pack({"pack.xlsx": raw}, stored_at=AT).positions) == 7
    assert len(calls) == 1
    calls.clear()
    rp.read_ssga_holdings(
        synth.workbook_bytes(synth.LOANS), rp.LVLN, file_name="x.xlsx", stored_at=AT
    )
    assert len(calls) == 1


def test_a_cell_far_to_the_right_is_not_read_and_said():
    lines: list[list[object] | None] = [["Name", "Weight", "Market Value"]]
    lines += [[f"Name {n}", 1, 10] for n in range(3)]
    far = '<c r="XFD1" t="inlineStr"><is><t>x</t></is></c>'
    raw = synth.edited(
        synth.book_bytes([("holdings", lines)]),
        SHEET,
        {'</row><row r="2"': far + '</row><row r="2"'},
    )
    found = rp.read_portfolio_files({"far.xlsx": raw}, name="Analyst", stored_at=AT)
    assert [p.row for p in found.positions] == [2, 3, 4]
    assert (
        "Cells more than 100 empty columns to the right of the cell before them, not read: 1 cell."
        in found.findings
    )


def test_a_holdings_table_over_the_row_ceiling_is_refused(monkeypatch):
    assert rp.MAX_ROWS == 50_000
    monkeypatch.setattr(rp, "MAX_ROWS", 3)
    header = ["Name", "Weight", "Market Value"]
    assert len(custom_csv([header, ["A", 1, 1], ["B", 1, 1], ["C", 1, 1]]).positions) == 3
    with pytest.raises(rp.PortfolioFileError) as error:
        custom_csv([header, ["A", 1, 1], ["B", 1, 1], ["C", 1, 1], ["D", 1, 1]])
    assert str(error.value) == (
        "h.csv: the holdings table has more than 3 rows; a reference portfolio that large is not "
        "read."
    )


# 2. Dates: the order of a numeric date, the 1904 date system, long forms, years.


def test_the_two_fund_files_read_a_numeric_date_month_first_and_the_others_do_not_say():
    assert (rp.LVLN.date_order, rp.JNK.date_order) == ("month_first", "month_first")
    assert (rp.CLO.date_order, rp.custom("x").date_order) == (None, None)
    assert loans(with_above("03/04/2026")).as_of == date(2026, 3, 4)  # 4 March, month first


def test_an_ambiguous_numeric_date_is_no_as_of_date_and_both_readings_are_named():
    found = analysts(with_above("03/04/2026"))
    assert found.as_of is None
    assert found.findings[0] == (
        "The as-of date 03/04/2026 reads as 3 April 2026 (day first) or 4 March 2026 (month "
        "first), and the file does not say which: no as-of date is read."
    )


@pytest.mark.parametrize(
    ("text", "custom", "fund"),
    [
        ("13/04/2026", date(2026, 4, 13), None),  # only day first; the fund's file is month first
        ("04/13/2026", date(2026, 4, 13), date(2026, 4, 13)),  # only month first
        ("12/12/2026", date(2026, 12, 12), date(2026, 12, 12)),  # the same either way
        ("2026-11-24", date(2026, 11, 24), date(2026, 11, 24)),
        ("November 24, 2026", date(2026, 11, 24), date(2026, 11, 24)),
        ("24 November 2026", date(2026, 11, 24), date(2026, 11, 24)),
        ("Nov 24, 2026", date(2026, 11, 24), date(2026, 11, 24)),
        ("24 Nov 2026", date(2026, 11, 24), date(2026, 11, 24)),
    ],
)
def test_a_numeric_date_that_reads_one_way_and_the_long_forms_are_read(text, custom, fund):
    assert analysts(with_above(text)).as_of == custom
    assert loans(with_above(text)).as_of == fund


@pytest.mark.parametrize("text", ["24-Nov-1901", "24-Nov-1999", "24-Nov-2101"])
def test_an_as_of_year_outside_2000_to_2100_is_not_read(text):
    found = loans(with_above(text))
    assert found.as_of is None
    assert found.findings[0] == (
        f"The as-of date {text} is outside the years 2000 to 2100: no as-of date is read."
    )


@pytest.mark.parametrize(
    ("text", "when"), [("1-Jan-2000", date(2000, 1, 1)), ("31-Dec-2100", date(2100, 12, 31))]
)
def test_the_first_and_last_years_are_read(text, when):
    assert loans(with_above(text)).as_of == when


def test_an_ambiguous_maturity_is_missing_and_flagged():
    position = one(Maturity="03/04/2030")
    assert (position.maturity, position.flags) == (None, ("date_ambiguous:maturity",))
    assert one(Maturity="13/04/2030").maturity == date(2030, 4, 13)
    assert (
        "A date that reads two ways (day or month first), read as missing: 1 position (row 2)."
        in (pack([{"Borrower Name": "Aster Fictional Co", "Maturity": "03/04/2030"}]).findings)
    )


def test_a_1904_workbooks_dates_are_read_from_1904():
    found = rp.read_ssga_holdings(
        synth.workbook_bytes(synth.LOANS, date1904=True), rp.LVLN, file_name="x.xlsx", stored_at=AT
    )
    assert [p.maturity for p in found.positions] == [
        *(date(2029, 6, 30), date(2030, 1, 31), date(2028, 3, 31), None, date(2031, 3, 31))
    ]
    raw = synth.workbook_bytes(synth.BONDS, date1904=True)
    assert rp.read_ssga_holdings(raw, rp.JNK, file_name="x.xlsx", stored_at=AT).as_of == date(
        2026, 11, 23
    )


# 3(d). Rows inside the table that are not positions; where the table ends.


def test_a_section_heading_inside_the_table_is_skipped_and_counted():
    rows = synth.LOANS.rows
    found = loans(replace(synth.LOANS, rows=(*rows[:2], ["Senior Secured Loans"], *rows[2:])))
    # The header is row 5; the heading is row 8 and the last holding row 11.
    assert [p.row for p in found.positions] == [6, 7, 9, 10, 11]
    assert (
        "Rows inside the holdings table that are not positions (such as section headings), not "
        "read: 1 row (row 8)." in found.findings
    )
    assert (
        "Below the holdings table and not read as positions: 2 rows with text (rows 13, 14)."
        in found.findings
    )


def test_one_blank_row_does_not_end_the_table_and_two_do():
    rows = synth.LOANS.rows
    one_gap = loans(replace(synth.LOANS, rows=(*rows[:2], [None], *rows[2:])))
    assert [p.row for p in one_gap.positions] == [6, 7, 9, 10, 11]
    two_gaps = loans(replace(synth.LOANS, rows=(*rows[:2], [None], [None], *rows[2:])))
    assert [p.row for p in two_gaps.positions] == [6, 7]
    # Rows 10 to 12 are the other three holdings; 13 is empty; 14 and 15 are the notes.
    assert (
        "Below the holdings table and not read as positions: 5 rows with text "
        "(rows 10, 11, 12, 14, 15)." in two_gaps.findings
    )


def test_a_disclaimer_that_looks_like_a_holding_is_not_a_position():
    header = ["Name", "ISIN", "Weight", "Par Value", "Market Value"]
    found = custom_csv(
        [
            header,
            ["Aster Co", "US0000000001", 60, 600, 600],
            ["Holdings are subject to change without notice.", "", "", "", 2026],
            ["Birch Co", "US0000000002", 40, 400, 400],
            ["Holdings are subject to change.", "", "", "", 2026],
        ]
    )
    assert [p.borrower for p in found.positions] == ["Aster Co", "Birch Co"]
    assert (
        "Total, subtotal, note and disclaimer rows, not read as positions: 2 rows (rows 3, 5)."
        in found.findings
    )
    # A name of four words or more ending in a full stop is still a name when it is mostly
    # capitalised, as names are.
    named = custom_csv([header, ["Bank of America Corp.", "US0000000003", 100, 1, 1]])
    assert [p.borrower for p in named.positions] == ["Bank of America Corp."]


# 5. Total, subtotal and note rows.


@pytest.mark.parametrize(
    "label",
    [
        "Total",
        "TOTAL:",
        "Subtotal",
        "Sub-total",
        "Grand Total",
        "Sum",
        "Note: unaudited",
        "Source: trustee",
        "Disclaimer",
    ],
)
def test_a_total_or_note_row_with_figures_is_not_a_position(label):
    header = ["Name", "ISIN", "Weight", "Par Value", "Market Value"]
    found = custom_csv(
        [
            header,
            ["Aster Co", "US0000000001", 60, 600, 600],
            [label, "", 60, 600, 600],
            ["Birch Co", "US0000000002", 40, 400, 400],
        ]
    )
    assert [p.borrower for p in found.positions] == ["Aster Co", "Birch Co"]
    assert "Total, subtotal, note and disclaimer rows, not read as positions: 1 row (row 3)." in (
        found.findings
    )
    assert rp.issuer_weight(found, borrower="Aster Co").weight == Decimal(60)


def test_a_borrower_whose_name_begins_with_total_is_a_position():
    header = ["Name", "ISIN", "Weight", "Par Value", "Market Value"]
    found = custom_csv([header, ["Total Play Telecomunicaciones", "US0000000001", 100, 1, 1]])
    assert [p.borrower for p in found.positions] == ["Total Play Telecomunicaciones"]


def test_a_packs_total_and_source_rows_are_not_positions_and_the_exports_own_count_is_kept():
    rows = [
        *synth.PACK_ROWS,
        synth.pack_row(Borrower_Name="Total", Holdings="5,984,567.89"),
        synth.pack_row(Borrower_Name="Source: trustee report, unaudited"),
    ]
    found = pack(rows)
    assert [p.row for p in found.positions] == [2, 3, 4, 5, 6, 7, 8]
    assert (
        "Total, subtotal, note and disclaimer rows, not read as positions: 2 rows (rows 9, 10)."
        in found.findings
    )
    # The export's own check now leaves total and note rows out, as the reference reader does.
    assert len(pe.read_export(synth.pack_files(rows)).holdings) == 7
    assert pe.row_kind({"borrower": "Total"}, "Total") == "total"  # the one rule both readers call
    assert pe.row_kind({"borrower": "Source: trustee report, unaudited"}, "Source:") == "note"


# 6. A file name with " [" in it; a file that cannot be read is a reader's error.


def test_file_names_with_brackets_are_read():
    files = synth.pack_files()
    renamed = {
        synth.PACK_HOLDINGS: files[synth.PACK_HOLDINGS],
        "constraints [Oct].csv": files[synth.PACK_CONSTRAINTS],
        "mandate [v2].csv": files[synth.PACK_MANDATE],
    }
    found = rp.read_clo_pack(renamed, stored_at=AT)
    assert (len(found.positions), len(found.limits), found.as_of) == (7, 3, date(2026, 10, 31))
    assert [source.name for source in found.sources] == [
        synth.PACK_HOLDINGS,
        "constraints [Oct].csv",
        "mandate [v2].csv",
    ]


def test_a_csv_with_a_field_longer_than_the_csv_reader_takes_is_a_readers_error():
    raw = b"Name,Weight,Market Value\n" + b'"' + b"A" * 140_000 + b'",1,1\nB,2,2\n'
    with pytest.raises(rp.PortfolioFileError) as error:
        rp.read_portfolio_files({"h.csv": raw}, name="Analyst", stored_at=AT)
    assert str(error.value) == (
        "h.csv cannot be read as a CSV file: a cell is too long or its quotes do not close."
    )


def test_any_other_failure_of_the_reading_is_a_readers_error(monkeypatch):
    def broken(files: object) -> object:
        raise KeyError("a part the file lacks")

    monkeypatch.setattr(pe, "read_export", broken)
    for read in (
        lambda: rp.read_clo_pack(synth.pack_files(), stored_at=AT),
        lambda: rp.read_portfolio_files(synth.pack_files(), name="Analyst", stored_at=AT),
        lambda: loans(),
    ):
        with pytest.raises(rp.PortfolioFileError) as error:
            read()
        assert str(error.value) == (
            "The files could not be read: one of them is damaged or is not a holdings file this "
            "reader knows."
        )


# 4. Column picks on the header path.


def test_a_spread_duration_is_not_the_spread_and_a_current_yield_is_not_the_yield():
    header = [
        "Name",
        "ISIN",
        "Weight",
        "Spread Duration",
        "Option Adjusted Spread",
        "Current Yield",
        "Yield to Maturity",
    ]
    found = custom_csv([header, ["Aster Co", "US0000000001", 100, "3.2", "425", "7.1", "8.4"]])
    columns = dict(found.columns_found)
    assert (columns["margin"], columns["ytm"]) == ("Option Adjusted Spread", "Yield to Maturity")
    assert "maturity" not in columns  # `Yield to Maturity` is the yield, not the maturity
    position = found.positions[0]
    assert (position.margin, position.ytm, position.maturity, position.flags) == (
        Decimal(425),
        Decimal("8.4"),
        None,
        (),
    )


@pytest.mark.parametrize(
    ("heading", "read"),
    [
        ("Yield to Maturity", True),
        ("YTM", True),
        ("Mid YTM", True),
        ("Yield to Worst", True),
        ("YTW", True),
        ("Yield", False),  # which yield the file does not say
        ("Current Yield", False),
        ("Dividend Yield", False),
    ],
)
def test_only_a_yield_to_maturity_or_to_worst_is_the_yield(heading, read):
    found = custom_csv([["Name", "ISIN", "Weight", heading], ["Aster Co", "I1", 100, "8.4"]])
    assert (found.positions[0].ytm == Decimal("8.4")) is read
    assert ("ytm" in found.columns_missing) is not read


def test_a_rating_bucket_before_the_ratings_and_a_par_after_the_price_are_read_right():
    header = [h for h in synth.PACK_HEADER if h not in ("Rating Bucket", "Holdings")]
    header.insert(header.index("Ratings"), "Rating Bucket")
    header.insert(header.index("Mid Price (per 100 par)") + 1, "Par")
    rows = [
        {**{k: v for k, v in row.items() if k != "Holdings"}, "Par": row["Holdings"]}
        for row in synth.PACK_ROWS
    ]
    found = pack(rows, tuple(header))
    columns = dict(found.columns_found)
    assert (columns["rating"], columns["stated_bucket"], columns["par"]) == (
        "Ratings",
        "Rating Bucket",
        "Par",
    )
    assert [p.rating_bucket for p in found.positions] == [p.rating_bucket for p in pack().positions]
    assert [p.par for p in found.positions] == [p.par for p in pack().positions]


# 9. An issuer's weight: a name without its legal form; weights stated as fractions.


def test_a_name_that_differs_only_in_its_legal_form_matches_and_says_so():
    found = pack()
    for name in ("Aster Fictional Co Inc", "The Aster Fictional Company", "Aster Fictional"):
        assert rp.issuer_weight(found, borrower=name) == rp.Weight(
            Decimal(60), "stated_weight", matched=2, matched_by=("name_without_legal_form",)
        )
    # The exact name is matched first; a part of a name never is.
    assert rp.issuer_weight(found, borrower="Aster Fictional Co").matched_by == ("name",)
    assert rp.issuer_weight(found, borrower="Aster").matched_by == ()
    assert rp.issuer_weight(found, borrower="Fictional Co").matched == 0


def test_weights_stated_as_fractions_are_not_used_and_market_value_is():
    header = ["Name", "ISIN", "Weight", "Par Value", "Market Value"]
    found = custom_csv(
        [header, ["Aster Co", "I1", "0.6", 600, 600], ["Birch Co", "I2", "0.4", 400, 400]]
    )
    # 0.6 + 0.4 = 1: fractions of one. Market value: 600 of 1,000 is 60%.
    assert rp.issuer_weight(found, borrower="Aster Co") == rp.Weight(
        Decimal(60), "market_value", matched=1, matched_by=("name",)
    )
    assert (
        "The stated weights add to 1, as fractions of one would, not to about 100%: they are not "
        "used as weights." in found.findings
    )
    assert not any("not about 100%" in line for line in found.findings)
    bare = custom_csv(
        [["Name", "ISIN", "Weight"], ["Aster Co", "I1", "0.6"], ["Birch Co", "I2", "0.4"]]
    )
    assert rp.issuer_weight(bare, borrower="Aster Co") == rp.Weight(
        None, None, matched=1, matched_by=("name",)
    )


# 10. Only a plain number is a figure.


@pytest.mark.parametrize(
    "text",
    [
        "<5",
        "≤ 5",
        "5 bps",
        "3 years",
        "1.5m",
        "2.5k",
        "1,000 EUR",
        "USD 1,000",
        "$1,000",
        "+1,000",
        "(1,000)",
        "1.234,56",
        "1.5E+06",
        " 1 000",
        "5%",
        "~100",
    ],
)
def test_text_that_is_not_a_plain_number_is_missing_and_flagged(text):
    position = one(Holdings=text)
    assert (position.par, position.flags) == (None, ("unreadable:par",))


@pytest.mark.parametrize(
    ("text", "par"),
    [
        ("1,234,567.89", Decimal("1234567.89")),
        ("-1,000", Decimal(-1000)),
        ("0", Decimal(0)),
        ("0.30000000000000004", Decimal("0.30000000000000004")),
    ],
)
def test_a_plain_number_is_read_with_every_digit(text, par):
    assert one(Holdings=text).par == par


def test_a_percentage_field_may_end_in_a_percent_sign():
    position = one(**{"Share of Priced MV (%)": "12.5%"})
    assert (position.weight, position.flags) == (Decimal("12.5"), ())


# 11. Formula cells.


def test_a_formula_cell_is_its_stored_value_or_missing_and_flagged():
    header = ["Name", "ISIN", "Weight", "Par Value", "Market Value"]
    lines: list[list[object] | None] = [
        ["As of 24-Nov-2026"],
        header,
        ["Aster Co", "I1", 60, 600, 1],
        ["Birch Co", "I2", 40, 400, 1],
        ["Cedar Co", "I3", 0, 0, 1],
    ]
    raw = synth.edited(
        synth.book_bytes([("holdings", lines)]),
        SHEET,
        {
            '<c r="E3" t="n"><v>1</v></c>': '<c r="E3"><f>D3</f><v>600</v></c>',
            '<c r="E4" t="n"><v>1</v></c>': '<c r="E4"><f>D4</f></c>',
            '<c r="E5" t="n"><v>1</v></c>': '<c r="E5" t="str"><f>"n/a"</f><v>n/a</v></c>',
        },
    )
    found = rp.read_portfolio_files({"f.xlsx": raw}, name="Analyst", stored_at=AT)
    aster, birch, cedar = found.positions
    assert (aster.market_value, aster.flags) == (Decimal(600), ())
    assert (birch.market_value, birch.flags) == (
        None,
        ("formula_without_value:market_value", "unpriced"),
    )
    assert (cedar.market_value, cedar.flags) == (None, ("unpriced",))
    assert (
        "A formula cell with no stored value, read as missing: 1 position (row 4)."
        in found.findings
    )
    assert not any("Formula:" in str(value) for p in found.positions for value in vars(p).values())


# 12. Sheets of the same workbook; a damaged failure record; a lone holdings file.


def test_constraints_and_mandate_sheets_beside_a_header_read_holdings_sheet_are_read():
    layout = synth.LOANS
    lines: list[list[object] | None] = [
        *layout.above,
        list(layout.header),
        *(list(r) for r in layout.rows),
    ]
    raw = synth.book_bytes(
        [
            ("holdings", lines),
            ("Limits", [list(row) for row in synth.PACK_CONSTRAINTS_ROWS]),
            ("Mandate", [list(row) for row in synth.PACK_MANDATE_ROWS]),
        ]
    )
    found = rp.read_portfolio_files({"book.xlsx": raw}, reference=rp.LVLN, stored_at=AT)
    assert (len(found.positions), len(found.limits), len(found.mandate)) == (5, 3, 2)
    assert found.limits[0].source == "book.xlsx [Limits]"
    assert found.as_of == date(2026, 10, 31)  # the mandate's `As of Date`
    assert not any(line.startswith("No constraints") for line in found.findings)
    assert [source.name for source in found.sources] == ["book.xlsx"]


def test_a_damaged_failure_record_does_not_hide_the_stored_set(tmp_path):
    store = rp.Store(tmp_path)
    store.save(loans())
    (tmp_path / "lvln.failure.json").write_text("[]", encoding="utf-8")
    listed = {item.key: item for item in rp.list_portfolios(store)}
    assert listed["lvln"] == rp.Summary(
        key="lvln",
        name=rp.LVLN.name,
        kind="loan_index",
        scope="standing",
        as_of=date(2026, 11, 24),
        stored_at=AT,
        positions=5,
        error="The record of the last failed refresh of 'lvln' cannot be read.",
    )


def test_a_lone_holdings_csv_is_still_read_as_a_pack():
    files = {synth.PACK_HOLDINGS: synth.pack_files()[synth.PACK_HOLDINGS]}
    assert pe.recognise(files) == {}  # not a fund export on its own
    assert len(rp.read_clo_pack(files, stored_at=AT).positions) == 7
    assert len(rp.read_portfolio_files(files, name="Analyst", stored_at=AT).positions) == 7


# 13. The synthetic workbook is the same bytes whenever it is built.


def test_the_synthetic_workbook_does_not_depend_on_when_it_is_built(monkeypatch):
    import datetime as clock
    import time as wall
    import types
    import zipfile

    from openpyxl.writer import excel

    first = synth.workbook_bytes(synth.LOANS)

    class Later(clock.datetime):
        @classmethod
        def now(cls, tz: object = None) -> clock.datetime:  # type: ignore[override]
            return clock.datetime(2031, 5, 6, 7, 8, 9)

    class LaterModule:
        datetime = Later
        timezone = clock.timezone

    monkeypatch.setattr(excel, "datetime", LaterModule)
    later = wall.mktime((2031, 5, 6, 7, 8, 9, 0, 0, -1))
    monkeypatch.setattr(
        zipfile, "time", types.SimpleNamespace(time=lambda: later, localtime=wall.localtime)
    )
    assert synth.workbook_bytes(synth.LOANS) == first


def test_a_ticker_that_spells_sum_does_not_make_a_named_position_a_total():
    # The name decides when the row has one; the first filled cell only when it has none.
    header = ["Ticker", "Name", "ISIN", "Weight", "Market Value"]
    found = custom_csv(
        [
            header,
            ["SUM", "Summit Example Materials", "US0000000001", 60, 600],
            ["", "Total", "", 100, 1000],
            ["ASTR", "Aster Co", "US0000000002", 40, 400],
        ]
    )
    assert [p.borrower for p in found.positions] == ["Summit Example Materials", "Aster Co"]
    assert "Total, subtotal, note and disclaimer rows, not read as positions: 1 row (row 3)." in (
        found.findings
    )


def test_a_mandates_ambiguous_as_of_date_is_not_read_and_a_known_order_reads_it():
    files = synth.pack_files()
    mandate = [list(row) for row in synth.PACK_MANDATE_ROWS]
    mandate[2][2] = "03/04/2026"
    files[synth.PACK_MANDATE] = synth.csv_bytes(mandate)
    found = rp.read_clo_pack(files, stored_at=AT)
    assert found.as_of is None
    assert found.findings[0] == (
        "The as-of date 03/04/2026 reads as 3 April 2026 (day first) or 4 March 2026 (month "
        "first), and the file does not say which: no as-of date is read."
    )
    day_first = rp.Reference("eu", "Example fund", "custom", date_order="day_first")
    assert rp.read_portfolio_files(files, reference=day_first, stored_at=AT).as_of == date(
        2026, 4, 3
    )


def test_blank_rows_right_under_the_header_do_not_end_the_table():
    rows = synth.LOANS.rows
    found = loans(replace(synth.LOANS, rows=([None], [None], *rows)))
    # The header is row 5; rows 6 and 7 are empty; the holdings are rows 8 to 12.
    assert [p.row for p in found.positions] == [8, 9, 10, 11, 12]


def _without_strict(stored: dict) -> None:
    for item in stored["portfolio"]["limits"]:
        if isinstance(item["quantity"], dict):
            del item["quantity"]["strict"]


def test_a_portfolio_stored_before_strict_limits_loads(tmp_path):
    base = pack()
    strict = replace(base.limits[0], limit="< 5% NAV", quantity=pe.quantity("< 5% NAV"))
    portfolio = replace(base, limits=(strict, *base.limits[1:]))
    assert strict.quantity is not None and strict.quantity.strict
    rp.Store(tmp_path).save(portfolio)
    path = tmp_path / "clo.json"
    stored = json.loads(path.read_text(encoding="utf-8"))
    _without_strict(stored)
    stored["schema"] = 1  # as the build before `strict` wrote it
    path.write_text(json.dumps(stored), encoding="utf-8")
    back = rp.Store(tmp_path).load("clo")
    assert back == portfolio
    assert back.limits[0].quantity.strict is True
    assert back.limits[1].quantity.strict is False


def test_a_version_2_file_without_strict_is_damaged_not_migrated(tmp_path):
    rp.Store(tmp_path).save(pack())
    path = tmp_path / "clo.json"
    stored = json.loads(path.read_text(encoding="utf-8"))
    assert stored["schema"] == 2
    _without_strict(stored)
    path.write_text(json.dumps(stored), encoding="utf-8")
    with pytest.raises(rp.StoreError, match="damaged"):
        rp.Store(tmp_path).load("clo")


@pytest.mark.parametrize("schema", ["1", True, 1.0])
def test_a_schema_that_is_not_a_whole_version_number_is_refused(tmp_path, schema):
    rp.Store(tmp_path).save(pack())
    path = tmp_path / "clo.json"
    stored = json.loads(path.read_text(encoding="utf-8"))
    stored["schema"] = schema
    path.write_text(json.dumps(stored), encoding="utf-8")
    with pytest.raises(rp.StoreError, match="written as version"):
        rp.Store(tmp_path).load("clo")


def test_a_stored_quantity_with_an_unknown_field_is_still_damaged(tmp_path):
    rp.Store(tmp_path).save(pack())
    path = tmp_path / "clo.json"
    stored = json.loads(path.read_text(encoding="utf-8"))
    stored["portfolio"]["limits"][0]["quantity"]["surprise"] = True
    path.write_text(json.dumps(stored), encoding="utf-8")
    with pytest.raises(rp.StoreError, match="damaged"):
        rp.Store(tmp_path).load("clo")


@pytest.mark.parametrize(
    ("rating", "bucket"),
    [("N/A / N/A", "Unrated"), ("N/A / B+", "B"), ("N/R / B+", "B"), ("n/a / B+", "B")],
)
def test_a_plain_not_available_marker_gives_no_rating_for_that_agency(rating, bucket):
    found = one(Ratings=rating)
    assert (found.rating, found.rating_bucket, found.flags) == (rating, bucket, ())


@pytest.mark.parametrize(
    "rating", ["#N/A N/A / B+", "#N/A N/A/B+", "#N/A Field Not Applicable / B+"]
)
def test_a_vendor_token_for_moodys_keeps_the_sp_rating(rating):
    # Mirror of `B1 / #N/A N/A`: no Moody's rating, S&P B+ (index 14), bucket B.
    found = one(Ratings=rating)
    assert (found.rating, found.rating_bucket) == (rating, "B")
    assert one(Ratings="B1 / #N/A N/A").rating_bucket == "B"
    lone = one(Ratings="#N/A N/A")
    assert (lone.rating, lone.flags) == (None, ("error_marker:rating",))


@pytest.mark.parametrize("rating", ["#N/A N/A / #N/A N/A", "#N/A N/A/#N/A N/A"])
def test_a_rating_cell_of_two_vendor_tokens_is_an_error_marker_as_one_token_is(rating):
    found = one(Ratings=rating)
    assert (found.rating, found.rating_bucket, found.flags) == (
        None,
        "Unrated",
        ("error_marker:rating",),
    )


@pytest.mark.parametrize("rating", ["Not Rated", "Unrated", "NR / -", "NR / NA", "WR / —"])
def test_a_not_rated_word_or_mark_is_no_rating_and_no_defect(rating):
    found = one(Ratings=rating)
    assert (found.rating_bucket, found.flags) == ("Unrated", ())


def test_a_totals_row_is_still_left_out_of_the_pack():
    rows = [
        {"Borrower Name": "Aster Fictional Co", "Mid Market Value (USD)": "100"}
        | synth.pack_row(Ratings="B2 / B"),
        {"Borrower Name": "Total", "Mid Market Value (USD)": "100"} | synth.pack_row(),
    ]
    read = rp.read_clo_pack(synth.pack_files(rows, synth.PACK_HEADER), stored_at=AT)
    assert [p.borrower for p in read.positions] == ["Aster Fictional Co"]


# --- One row classifier and one rating rule shared with the export check (S10 round 7) -----------

STORED = datetime(2025, 4, 1, tzinfo=UTC)


def _export_pack(spec: exports.Spec) -> rp.Portfolio:
    return rp.read_clo_pack(exports.files(spec), stored_at=STORED)


@pytest.mark.parametrize("name", ["Rossini S.à r.l.", "Lottomatica s.p.a.", "Biofarma s.p.a."])
def test_a_pack_borrower_with_a_lower_case_legal_form_is_a_position(name):
    spec = exports.clean()
    for row in spec.holdings:
        if row[1] == "Fern Placeholder SA":
            row[1] = name
    found = _export_pack(spec)
    assert len(found.positions) == 7
    assert [p.borrower for p in found.positions].count(name) == 1


@pytest.mark.parametrize(
    "rows",
    [
        ((2, "Software Total", 40_000_000), (2, "Chemicals Total", 25_000_000),
         (2, "Healthcare Total", 35_000_000), (2, "Grand Total", 100_000_000)),
        ((1, "Total Portfolio", 100_000_000),),
        ((1, "Total (USD)", 100_000_000),),
    ],
)  # fmt: skip
def test_a_pack_totals_row_is_left_out_as_the_export_check_leaves_it_out(rows):
    spec = exports.clean()
    for column, label, par in rows:
        row: list[object] = [""] * len(spec.holdings[0])
        row[column], row[-1] = label, par
        spec.holdings.append(row)
    found = _export_pack(spec)
    par = sum((p.par for p in found.positions if p.par is not None), start=Decimal(0))
    assert len(found.positions) == 7
    assert par == 100_000_000  # 20 + 10 + 15 + 10 + 25 + 10 + 10 (m)
    assert len({p.sector for p in found.positions if p.sector}) == 3


@pytest.mark.parametrize(
    "rating", ["#N/A N/A / NR", "#N/A N/A / WR", "#N/A N/A / Not Rated", "NR / #N/A N/A"]
)
def test_a_token_beside_a_not_rated_mark_is_an_error_marker_not_an_unread_rating(rating):
    found = one(Ratings=rating)
    assert found.rating_bucket == "Unrated"
    assert f"{rp.ERROR_MARKER}:rating" in found.flags
    assert rp.RATING_UNREAD not in found.flags


def test_a_windows_1252_pack_stores_the_borrower_as_written():
    name = "Dave & Buster’s Inc"  # 0x92 in Windows-1252 is U+2019
    spec = exports.clean()
    for row in spec.holdings:
        if row[1] == "Fern Placeholder SA":
            row[1] = name
    files = {
        key: raw.decode("utf-8").replace("≤", "<=").replace("≥", ">=").replace("Δ", "Chg")
        .encode("cp1252")
        if key.endswith(".csv")
        else raw
        for key, raw in exports.csv_files(spec).items()
    }  # fmt: skip
    assert rp.read_clo_pack(files, stored_at=STORED).positions[-1].borrower == name


def test_a_csv_that_is_neither_utf_8_nor_windows_1252_is_a_damaged_file():
    files = synth.pack_files()
    files[synth.PACK_HOLDINGS] += b"\nBad,\x81\n"  # 0x81 is undefined in Windows-1252
    with pytest.raises(rp.PortfolioFileError, match="damaged") as error:
        rp.read_clo_pack(files, stored_at=AT)
    assert isinstance(error.value.__cause__, CsvDecodeError)
