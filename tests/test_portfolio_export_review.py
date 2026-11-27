"""Review fixes for the portfolio export validator (C8 fix round 1, batch A). Every export is the
synthetic one (tools/synthetic_portfolio_exports.py); expected values are written by hand."""

from __future__ import annotations

import re
from datetime import date

import pytest

from deploy_vii.inputs import portfolio_export as pe
from deploy_vii.inputs.portfolio_export import validate_export
from tools import synthetic_portfolio_exports as synth

RUN_DATE = date(2025, 3, 31)
TOKEN = "#N/A N/A"
FIGI, TICKER, MATURITY = 5, 0, 10  # holdings columns (HOLDING_HEADER)


def problems(spec: synth.Spec) -> list[str]:
    return [i.problem for i in validate_export(synth.files(spec), run_date=RUN_DATE).issues]


def recomputed(spec: synth.Spec) -> str:
    return "\n".join(validate_export(synth.files(spec), run_date=RUN_DATE).recomputed)


def test_the_clean_export_has_no_findings():
    assert problems(synth.clean()) == []


# --- M-5: a missing maturity is not zero ---------------------------------------------------------


def test_no_maturity_in_the_holdings_is_not_compared_as_zero():
    spec = synth.clean()
    for row in spec.holdings:
        row[MATURITY] = ""
    found = problems(spec)
    assert not any("0.0000%" in p for p in found)
    missing = [p for p in found if "maturity" in p and "cannot be checked" in p]
    assert len(missing) == 1


def test_maturity_value_is_none_without_maturities():
    empty = pe.Profile()
    assert pe.maturity_value(empty, 2028, None, False) is None
    assert pe.maturity_value(empty, (pe.Decimal(0), pe.Decimal(1)), date(2025, 3, 31), True) is None


# --- M-3: "No breach" is not a breach status -----------------------------------------------------


def _monitor_row(spec: synth.Spec, ident: str) -> list:
    return next(row for row in spec.constraints if row[0] == ident)


# --- M-2: an error token or N/A is not an identifier ---------------------------------------------


def test_two_loans_with_a_figi_token_do_not_share_a_figi():
    spec = synth.clean()
    spec.holdings[2][FIGI] = spec.holdings[3][FIGI] = TOKEN
    assert not any("is used on" in p for p in problems(spec))


def test_two_borrowers_with_a_ticker_token_do_not_share_a_ticker():
    spec = synth.clean()
    spec.holdings[2][TICKER] = spec.holdings[3][TICKER] = TOKEN
    assert not any("names 2 borrowers" in p for p in problems(spec))


def test_a_borrower_with_a_real_and_a_token_ticker_has_one_ticker():
    spec = synth.clean()
    spec.holdings[1][TICKER] = TOKEN  # Aster Fictional Co: ASTR on row 2
    assert not any("has 2 tickers" in p for p in problems(spec))


def test_a_ticker_token_is_not_counted_as_a_ticker():
    spec = synth.clean()
    spec.holdings[2][TICKER] = spec.holdings[3][TICKER] = TOKEN
    assert "tickers: 4;" in recomputed(spec)  # ASTR, DUNE, ELMI, FERN


# --- M-1: a one-cell data row is not a section title ---------------------------------------------


# --- M-4: the holdings columns are the Holdings sheet's ------------------------------------------


def test_market_data_does_not_replace_the_holdings_columns():
    spec = synth.clean()
    # Market Data carries a Holdings column of its own but no sector column on the holdings sheet.
    files = synth.files(spec)
    export = pe.read_export(files)
    assert export.holding_columns["par"] == 17  # the Holdings sheet's last column
    assert "sector" in export.holding_columns


def test_the_holdings_header_without_a_sector_is_reported_when_market_data_has_one():
    spec = synth.clean()
    files = synth.files(spec)
    import io

    from openpyxl import load_workbook

    book = load_workbook(io.BytesIO(files[synth.HOLDINGS]))
    book["Holdings"].cell(row=1, column=3).value = "Group"  # no sector column
    market = book["Market Data"]
    market.cell(row=1, column=18).value = "Quantity"  # a par column on Market Data
    out = io.BytesIO()
    book.save(out)
    files[synth.HOLDINGS] = out.getvalue()
    found = [i.problem for i in validate_export(files, run_date=RUN_DATE).issues]
    assert "the holdings header has no column for sector" in found


# --- M-9: a negated investment-grade label is not IG ---------------------------------------------


@pytest.mark.parametrize(
    ("label", "bucket"),
    [
        ("Below Investment Grade", None),
        ("Sub-IG", None),
        ("Non-Investment Grade (BB+ and below)", None),
        ("Non-IG", None),
        ("Investment Grade", "IG"),
        ("IG", "IG"),
        ("BBB", "IG"),
        ("BB", "BB"),
    ],
)
def test_label_bucket_negated_investment_grade(label, bucket):
    assert pe.label_bucket(label) == bucket


# --- M-6: parameter wording is matched without regard to case ------------------------------------


def _set_parameter(spec: synth.Spec, ident: str, parameter: str) -> None:
    _monitor_row(spec, ident)[2] = parameter


def test_an_ordinal_sector_in_capitals_is_the_second_largest():
    spec = synth.clean()
    _set_parameter(spec, "C-04", "2nd Largest Sector: Healthcare")  # holdings give 35.10%
    assert not any("largest sector (Software)" in p for p in problems(spec))


def test_a_named_issuer_in_capitals_is_checked_against_the_named_issuer():
    spec = synth.clean()
    _set_parameter(spec, "C-01", "Max single issuer exposure (Largest: Birch)")
    assert any("Birch" in p for p in problems(spec))


# --- M-7: a headroom is the difference of two rounded figures ------------------------------------


def test_headroom_may_differ_by_the_rounding_of_the_limit_and_the_current_value():
    spec = synth.clean()
    row = _monitor_row(spec, "C-01")
    row[3], row[6], row[7] = "≤ 30.0% NAV", "29.8%", "0.16%"  # 30.0 less 29.8 is 0.2, give or take
    assert not any("headroom 0.16%" in p for p in problems(spec))


def test_headroom_beyond_that_rounding_is_still_reported():
    spec = synth.clean()
    row = _monitor_row(spec, "C-01")
    row[3], row[6], row[7] = "≤ 30.0% NAV", "29.8%", "0.5%"
    assert any("headroom 0.5% is not the limit" in p for p in problems(spec))


def test_the_average_price_may_differ_by_the_rounding_of_the_stated_nav_and_par():
    spec = synth.clean()
    synth._set(spec.exposure, "NAV", 1, "USD 98.6m")  # 98.6 over 100.0, each give or take 0.05
    synth._set(spec.exposure, "Total Par", 1, "USD 100.0m")
    synth._set(spec.exposure, "Weighted Average Price", 1, "98.650")
    assert not any("stated NAV over the stated par" in p for p in problems(spec))


def test_the_average_price_far_from_nav_over_par_is_still_reported():
    spec = synth.clean()
    synth._set(spec.exposure, "NAV", 1, "USD 98.6m")
    synth._set(spec.exposure, "Total Par", 1, "USD 100.0m")
    synth._set(spec.exposure, "Weighted Average Price", 1, "99.500")
    assert any("stated NAV over the stated par" in p for p in problems(spec))


# --- M-8: Ã is mojibake only before a continuation byte ------------------------------------------


@pytest.mark.parametrize("name", ["SÃO PAULO TRANSPORTE", "Ãlvaro Corp", "ÃRVORE SA"])
def test_a_name_with_a_capital_a_tilde_is_not_mojibake(name):
    assert pe.MOJIBAKE.search(name) is None


@pytest.mark.parametrize("name", ["CafÃ© SA", "ZÃ¼rich AG", "Ã€ Corp", "Sociâ€™s", "Ã\u0081 Corp"])
def test_utf8_read_as_latin_1_is_mojibake(name):
    assert pe.MOJIBAKE.search(name) is not None


# --- Round 2 -------------------------------------------------------------------------------------


def test_titles_directly_under_data_rows_are_still_titles():
    rows = [
        ["Exposure Report - Fund X"],
        ["A. Summary"],
        ["Metric", "Value"],
        ["NAV", "100"],
        [],
        ["B. Rating Distribution"],
        ["Bucket", "% NAV"],
        ["IG", "10%"],
        ["C. Sector Exposure"],  # no blank row above it
        ["Sector", "% NAV"],
        ["Software", "40%"],
    ]
    found = pe.sections(list(enumerate(rows, start=1)))
    assert set(found) == {"summary", "ratings", "sectors"}
    assert [r[0] for _, r in found["ratings"].rows] == ["IG"]
    assert [r[0] for _, r in found["sectors"].rows] == ["Software"]


def test_the_limit_is_exact_so_headroom_gets_only_the_current_values_rounding():
    spec = synth.clean()
    row = _monitor_row(spec, "C-05")
    row[3], row[6], row[7] = "≤ 25% NAV", "20.00%", "4.60%"  # 25 less 20.00 is 5.00
    assert any("headroom 4.60% is not the limit" in p for p in problems(spec))


def test_no_maturity_finding_when_the_report_has_no_bucket_to_compare():
    spec = synth.clean()
    for row in spec.holdings:
        row[MATURITY] = ""
    start = spec.exposure.index(["E. Maturity Profile"])
    spec.exposure[start + 2 : start + 6] = []  # only the Total row is left
    assert not any("no priced holding has a maturity" in p for p in problems(spec))


def test_the_maturity_finding_has_its_own_fix_text():
    spec = synth.clean()
    for row in spec.holdings:
        row[MATURITY] = ""
    report = validate_export(synth.files(spec), run_date=RUN_DATE)
    [issue] = [i for i in report.issues if "no priced holding has a maturity" in i.problem]
    assert issue.fix == "export the holdings with their maturity dates"


# --- C8 round 2 review findings R1-R4 -----------------------------------------------------------


def test_r1_the_report_without_blank_rows_or_letters_reads_as_before():
    spec = synth.clean()
    spec.exposure = [
        [re.sub(r"^[A-E]\. ", "", r[0]), *r[1:]] if len(r) == 1 else r for r in spec.exposure if r
    ]
    assert problems(spec) == []


def _aster_undated(spec):
    for row in spec.holdings:
        if row[1] == "Aster Fictional Co":
            row[MATURITY] = ""


def test_r3_some_missing_maturities_are_named_not_compared_as_zero():
    spec = synth.clean()
    _aster_undated(spec)
    report = validate_export(synth.files(spec), run_date=RUN_DATE)
    found = [i.problem for i in report.issues]
    assert not any(p.startswith("maturity bucket") for p in found)
    [issue] = [i for i in report.issues if "have no maturity" in i.problem]
    assert issue.problem.startswith(
        "the priced holdings on rows 2, 3 (29,800,000) have no maturity"
    )
    assert issue.fix == "export the holdings with their maturity dates"
    assert any(
        p.startswith("the weighted average life")
        and p.endswith("it leaves out 2 positions with no maturity")
        for p in found
    )


def test_r3_a_bucket_beyond_what_the_undated_holdings_allow_is_still_reported():
    spec = synth.clean()
    _aster_undated(spec)
    synth._set(spec.exposure, "2028", 1, "60.00%")
    assert any(
        p.startswith(
            "maturity bucket 2028: its share is stated as 60.00%; the holdings give 55.0000%"
        )
        for p in problems(spec)
    )


@pytest.mark.parametrize(
    ("label", "bucket"),
    [
        ("CCC (below IG)", "CCC"),
        ("B (sub-IG)", "B"),
        ("BB (Non-Investment Grade)", "BB"),
        ("Non-IG (BB, B, CCC)", None),
        ("Sub-IG (BB+ and below)", None),
    ],
)
def test_r4_label_bucket(label, bucket):
    assert pe.label_bucket(label) == bucket


def _below_ig(spec, share):
    start = spec.exposure.index(["B. Rating Distribution"])
    spec.exposure[start + 2 : start + 5] = [["Below Investment Grade", share, "6"]]


def test_r4_one_below_ig_row_covers_bb_b_and_ccc():
    spec = synth.clean()
    _below_ig(spec, "100.00%")
    assert not any("lists no" in p or p.startswith("rating bucket") for p in problems(spec))


def test_r4_the_below_ig_row_is_checked_against_bb_b_and_ccc():
    spec = synth.clean()
    _below_ig(spec, "90.00%")
    assert any(
        p.startswith(
            "rating bucket Below Investment Grade (BB, B, CCC): its share is stated as 90.00%; "
            "the holdings give 100.0000%"
        )
        for p in problems(spec)
    )


# --- Reverted to the branch base: a title row is a one-cell row naming a section; a status is a
# --- breach when it contains the word "breach" ---------------------------------------------------


def test_one_cell_rows_naming_a_section_open_it_as_they_did_at_the_base():
    summary = [["Metric", "Value"], ["NAV", "100"], ["Max Single Sector", ""]]
    bogus = pe.sections(list(enumerate([["A. Summary"], *summary, ["Base Currency", "USD"]], 1)))
    assert set(bogus) == {"summary", "sectors"}  # the summary row opens a section
    assert bogus["sectors"].header == ["Base Currency", "USD"]
    trailing = [["A. Summary"], ["Metric", "Value"], ["NAV", "100"], ["Note: rating used"]]
    found = pe.sections(list(enumerate(trailing, 1)))
    assert set(found) == {"summary", "ratings"} and found["ratings"].rows == []


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        ("No breach", True),
        ("Breach", True),
        ("Not cured in hard breach", True),
        ("10 hard breaches; 0 soft breaches", True),
        ("Pass", False),
        ("", False),
    ],
)
def test_a_status_naming_a_breach_is_a_breach_as_at_the_base(status, expected):
    assert pe.is_breach_status(status) is expected
