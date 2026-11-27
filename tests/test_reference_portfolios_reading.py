"""Reading and matching in `deploy_workflow.reference_portfolios`: names in any script, a loan or
a bond's measure, header columns, workbook sheets and a stated ticker. Every file and name here
is SYNTHETIC; expected values are literals written by hand. Offline only."""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from openpyxl import Workbook  # type: ignore[import-untyped]

from deploy_workflow import recommendation as rec
from deploy_workflow import reference_portfolios as rp

AT = datetime(2026, 11, 25, 9, 30, tzinfo=UTC)


def csv_bytes(rows: list[list[str]]) -> bytes:
    out = io.StringIO()
    csv.writer(out).writerows(rows)
    return out.getvalue().encode()


def read_csv(rows: list[list[str]], name: str = "mine") -> rp.Portfolio:
    return rp.read_portfolio_files({"book.csv": csv_bytes(rows)}, name=name, stored_at=AT)


def book(sheets: list[list[list[str]]]) -> bytes:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for number, rows in enumerate(sheets, 1):
        sheet = workbook.create_sheet(f"Sheet{number}")
        for row in rows:
            sheet.append(row)
    out = io.BytesIO()
    workbook.save(out)
    return out.getvalue()


def held(*names: str) -> rp.Portfolio:
    members = tuple(
        rp.Position(i, borrower=name, weight=Decimal(100) / len(names))
        for i, name in enumerate(names, 1)
    )
    return rp.Portfolio("p", "P", "custom", None, AT, (), members)


# --- C13-1: a name with no ASCII letters ---------------------------------------------------------


def test_holdings_with_no_ascii_letters_are_not_matched_to_another_such_borrower():
    found = rp.issuer_weight(held("Газпром", "Лукойл"), borrower="Роснефть")
    assert (found.weight, found.matched, found.matched_by) == (Decimal(0), 0, ())


def test_a_borrower_in_cyrillic_matches_its_own_name_whole():
    found = rp.issuer_weight(held("Газпром", "Лукойл"), borrower="газпром")
    assert (found.weight, found.matched, found.matched_by) == (Decimal(50), 1, ("name",))


def test_a_cyrillic_name_matches_the_same_words_once_a_legal_form_is_left_out():
    found = rp.issuer_weight(held("Газпром Inc", "Лукойл"), borrower="Газпром Ltd")
    assert (found.weight, found.matched, found.matched_by) == (
        Decimal(50),
        1,
        ("name_without_legal_form",),
    )


def test_ascii_names_still_match_without_their_legal_forms():
    found = rp.issuer_weight(held("The Aster Corp", "Birch LLC"), borrower="Aster Inc")
    assert (found.weight, found.matched, found.matched_by) == (
        Decimal(50),
        1,
        ("name_without_legal_form",),
    )


def test_names_that_differ_in_a_diacritic_are_not_the_same_name():
    found = rp.issuer_weight(held("Müller AG", "Birch LLC"), borrower="Möller")
    assert (found.weight, found.matched, found.matched_by) == (Decimal(0), 0, ())


def test_an_accented_name_still_matches_without_its_legal_form():
    found = rp.issuer_weight(held("Société Générale SA", "Birch LLC"), borrower="Société Générale")
    assert (found.matched, found.matched_by) == (1, ("name_without_legal_form",))


@pytest.mark.parametrize("held_name", ["Gazprom", "Gazprom ООО", "Gazprom АО", "Gazprom 株式会社"])
def test_a_name_matches_the_same_name_with_a_legal_form_in_another_script(held_name):
    found = rp.issuer_weight(held(held_name, "Birch LLC"), borrower="Gazprom ПАО")
    assert (found.matched, found.matched_by) == (1, ("name_without_legal_form",))


def test_a_legal_form_joined_to_a_japanese_name_is_left_out():
    found = rp.issuer_weight(held("トヨタ株式会社", "Birch LLC"), borrower="トヨタ")
    assert (found.matched, found.matched_by) == (1, ("name_without_legal_form",))


def test_two_names_that_are_only_other_legal_forms_do_not_match_each_other():
    found = rp.issuer_weight(held("ПАО", "Birch LLC"), borrower="ООО")
    assert found.matched == 0


# --- C13-2: a position with no asset type and two measures ---------------------------------------

_HEADER = ["Name", "Rating", "Spread", "Discount Margin", "Market Value"]


def bucket_rows(spread: list[str], dm: list[str]) -> list[list[str]]:
    return [
        _HEADER,
        *[
            [f"Name {i}", "B2", s, d, "100"]
            for i, (s, d) in enumerate(zip(spread, dm, strict=True))
        ],
    ]


_SPREADS = ["400", "410", "420", "430", "440"]
_DMS = ["350", "355", "360", "365", "370"]
_BOND = rec.Instrument("Bond 2031", "bond", "B", Decimal(400), Decimal(99))


def test_an_untyped_bond_is_compared_on_the_spread_not_the_discount_margin():
    portfolio = read_csv(bucket_rows(_SPREADS, _DMS))
    result = rec.valuation(_BOND, portfolio)
    assert (result.score, result.difference_bp, result.median_bp) == (3, Decimal(-20), Decimal(420))
    assert result.measures == ("spread",)


def test_an_untyped_loan_is_compared_on_the_discount_margin():
    portfolio = read_csv(bucket_rows(_SPREADS, _DMS))
    loan = rec.Instrument("Loan 2031", "loan", "B", Decimal(400), Decimal(99))
    result = rec.valuation(loan, portfolio)
    assert (result.score, result.difference_bp, result.median_bp) == (3, Decimal(40), Decimal(360))
    assert result.measures == ("discount_margin",)


def test_a_book_of_untyped_loans_with_both_measures_is_valued_on_the_discount_margin():
    spreads = ["500", "510", "520", "530", "540", "550"]
    dms = ["400", "405", "410", "415", "420", "425"]
    loan = rec.Instrument("Loan 2031", "loan", "B", Decimal(430), Decimal(99))
    result = rec.valuation(loan, read_csv(bucket_rows(spreads, dms)))
    assert (result.score, result.difference_bp, result.median_bp) == (
        3,
        Decimal("17.5"),
        Decimal("412.5"),
    )


def test_rows_read_an_untyped_position_as_the_type_given_and_as_a_loan_by_default():
    position = rp.Position(1, margin=Decimal(400), discount_margin=Decimal(350))
    assert (rp._row(position).spread, rp._row(position).measure) == (
        Decimal(350),
        "discount_margin",
    )
    as_bond = rp._row(position, "bond")
    assert (as_bond.spread, as_bond.measure) == (Decimal(400), "spread")


def test_typed_positions_in_a_portfolio_with_both_measures_keep_their_own_measure():
    rows = [[*row, "bond"] for row in bucket_rows(_SPREADS, _DMS)]
    rows[0][-1] = "Asset Type"
    portfolio = rp.read_portfolio_files(
        {"book.csv": csv_bytes(rows)}, reference=rp.custom("mine", asset_type="bond"), stored_at=AT
    )
    result = rec.valuation(_BOND, portfolio)
    assert (result.score, result.difference_bp, result.median_bp) == (3, Decimal(-20), Decimal(420))


def test_untyped_positions_with_only_a_spread_behave_as_before():
    rows = [["Name", "Rating", "Spread", "Market Value"]]
    rows += [[f"Name {i}", "B2", s, "100"] for i, s in enumerate(_SPREADS)]
    result = rec.valuation(_BOND, read_csv(rows))
    assert (result.score, result.difference_bp, result.median_bp) == (3, Decimal(-20), Decimal(420))


def test_untyped_positions_with_only_a_discount_margin_behave_as_before():
    rows = [["Name", "Rating", "Discount Margin", "Market Value"]]
    rows += [[f"Name {i}", "B2", d, "100"] for i, d in enumerate(_DMS)]
    result = rec.valuation(_BOND, read_csv(rows))
    assert (result.score, result.difference_bp, result.median_bp) == (3, Decimal(40), Decimal(360))


def test_a_loan_still_prefers_its_discount_margin_and_a_bond_its_spread():
    loan = rp.Position(1, asset_type="loan", margin=Decimal(400), discount_margin=Decimal(350))
    bond = rp.Position(2, asset_type="bond", margin=Decimal(400), discount_margin=Decimal(350))
    assert (rp._row(loan).spread, rp._row(loan).measure) == (Decimal(350), "discount_margin")
    assert (rp._row(bond).spread, rp._row(bond).measure) == (Decimal(400), "spread")


# --- C13-4: a header cell that holds another field's word ----------------------------------------


def columns(*header: str) -> dict[str, str]:
    rows = [list(header), *[["Aster" for _ in header], ["Birch" for _ in header]]]
    return dict(read_csv(rows).columns_found)


def test_bid_and_ask_prices_are_the_bid_and_ask_not_the_mid_price():
    found = columns("Name", "Bid Price", "Ask Price", "Par", "Rating")
    assert found == {
        "borrower": "Name",
        "rating": "Rating",
        "par": "Par",
        "bid": "Bid Price",
        "ask": "Ask Price",
    }


def test_a_mid_price_beside_a_bid_and_an_ask_is_still_the_mid_price():
    found = columns("Name", "Bid", "Ask", "Mid Price", "Par")
    assert (found["bid"], found["ask"], found["mid_price"]) == ("Bid", "Ask", "Mid Price")


def test_a_security_type_is_not_the_borrower_beside_a_security_name():
    found = columns("Security Name", "Security Type", "Par", "Rating")
    assert found["instrument"] == "Security Name"
    assert found["borrower"] == "Security Name"
    assert "Security Type" not in found.values()


def test_an_issuer_and_a_security_name_keep_their_own_columns():
    found = columns("Issuer", "Security Name", "Par", "Rating")
    assert (found["borrower"], found["instrument"]) == ("Issuer", "Security Name")


def test_a_bare_name_and_a_description_keep_their_own_columns():
    found = columns("Name", "Description", "Weight", "Rating")
    assert (found["borrower"], found["instrument"]) == ("Name", "Description")


# --- C13-5: a sheet with a header and no name ----------------------------------------------------

_SECTORS = [["Sector", "Weight", "Holdings"], ["Energy", "10", "5"]]
_HOLDINGS = [["Name", "Weight", "Par"], ["Aster Co", "60", "100"], ["Birch Co", "40", "50"]]


def test_a_later_sheet_is_read_when_the_first_has_a_header_with_no_name_column():
    raw = book([_SECTORS, _HOLDINGS])
    found = rp.read_portfolio_files({"book.xlsx": raw}, name="mine", stored_at=AT)
    assert [p.borrower for p in found.positions] == ["Aster Co", "Birch Co"]


def test_a_workbook_with_no_sheet_that_has_a_name_column_says_why_of_the_first():
    raw = book([_SECTORS, [["Sector", "Weight", "Par"], ["Energy", "10", "5"]]])
    with pytest.raises(rp.PortfolioFileError, match="has no column for the holding's name"):
        rp.read_portfolio_files({"book.xlsx": raw}, name="mine", stored_at=AT)


def test_a_workbook_with_no_header_row_in_any_sheet_is_still_refused():
    raw = book([[["a", "b"], ["c", "d"]]])
    with pytest.raises(rp.PortfolioFileError, match="has no header row"):
        rp.read_portfolio_files({"book.xlsx": raw}, name="mine", stored_at=AT)


# --- C13-3: a stated ticker ----------------------------------------------------------------------

_TABLE = [["Name", "Weight", "Par"], ["Aster Co", "60", "100"], ["Birch Co", "40", "50"]]


def read_fund(above: list[list[str]]) -> rp.Portfolio:
    raw = book([[*above, *_TABLE]])
    return rp.read_ssga_holdings(raw, rp.JNK, file_name="jnk.xlsx", stored_at=AT)


def test_a_note_mentioning_tickers_is_not_the_stated_ticker():
    found = read_fund([["Note: ticker symbols and names change; see the fund's website."]])
    assert found.stated_ticker is None
    assert not any("names the fund ticker" in finding for finding in found.findings)


def test_a_sentence_about_tickers_with_a_cell_beside_it_is_not_the_stated_ticker():
    found = read_fund([["Ticker symbols change often.", "see website"]])
    assert found.stated_ticker is None


def test_a_label_and_its_value_in_two_cells_is_the_stated_ticker():
    assert read_fund([["Ticker", "JNK"]]).stated_ticker == "JNK"


def test_a_label_and_its_value_in_one_cell_is_the_stated_ticker():
    assert read_fund([["Fund Ticker: JNK"]]).stated_ticker == "JNK"


def test_a_value_that_is_not_shaped_like_a_ticker_is_not_the_stated_ticker():
    assert read_fund([["Ticker: not available at this time"]]).stated_ticker is None


def test_a_fund_name_label_is_still_read():
    found = read_fund([["Fund Name: Synthetic High Yield Fund"]])
    assert found.stated_name == "Synthetic High Yield Fund"


# --- A sheet passed over, and the mid price header -----------------------------------------------


def test_a_sheet_with_a_name_column_but_no_amount_column_still_refuses_the_workbook():
    holdings = [["Name", "ISIN", "Nominal", "Price", "Rating"]]
    holdings += [[f"Name {i}", f"XS000000000{i % 10}", "1", "99", "B2"] for i in range(20)]
    top = [["Issuer", "Weight", "Rating"], ["Aster", "5", "B2"], ["Birch", "4", "B2"]]
    raw = book([holdings, top])
    with pytest.raises(rp.PortfolioFileError, match="no column for a weight, par or market value"):
        rp.read_portfolio_files({"book.xlsx": raw}, name="mine", stored_at=AT)


def test_a_sheet_passed_over_for_having_no_name_column_is_named_in_the_findings():
    found = rp.read_portfolio_files(
        {"book.xlsx": book([_SECTORS, _HOLDINGS])}, name="mine", stored_at=AT
    )
    assert (
        "Sheet 'Sheet1' was not read as holdings: book.xlsx: the header row (row 1) has no column "
        "for the holding's name."
    ) in found.findings


def test_a_mid_price_header_that_also_names_bid_and_ask_is_still_the_mid_price():
    found = columns("Name", "Mid Price (bid/ask average)", "Par", "Rating")
    assert found["mid_price"] == "Mid Price (bid/ask average)"
    assert "bid" not in found
    assert "ask" not in found


def test_a_ticker_label_with_a_long_text_and_a_bracketed_qualifier_is_read():
    found = read_fund([["Primary Exchange Ticker Symbol (NYSE Arca):", "JNK"]])
    assert found.stated_ticker == "JNK"


def test_a_ticker_inside_a_fund_name_or_beside_a_market_code_is_the_stated_ticker():
    assert read_fund([["Ticker: SPDR Bloomberg High Yield Bond ETF (JNK)"]]).stated_ticker == "JNK"
    assert read_fund([["Ticker", "JNK US"]]).stated_ticker == "JNK"


def test_a_ticker_of_another_fund_is_still_read_so_that_it_is_refused():
    found = read_fund([["Ticker: SPDR Bloomberg Short Term High Yield Bond ETF (SJNK)"]])
    assert found.stated_ticker == "SJNK"
    assert "The file names the fund ticker SJNK; JNK was expected." in found.findings
    assert read_fund([["Ticker", "SJNK US"]]).stated_ticker == "SJNK"
