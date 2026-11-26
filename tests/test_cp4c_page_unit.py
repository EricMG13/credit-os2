"""CP-4C refuses a cited statement page that is not millions of the run's currency."""

import dataclasses
import re

import pytest

from deploy_vii.business_context import Quote
from deploy_workflow.owners import cp4c
from deploy_workflow.owners.period_basis import DEFAULT_BASIS

_COLUMN = DEFAULT_BASIS.bs_column


def _issues(unit_line: str) -> list[str]:
    page = (
        f"NORTHBRIDGE SYNTHETIC GROUP\n{unit_line}\nCONSOLIDATED BALANCE SHEET\n"
        "Period end  Opening 2024-12-31  Q4 2025-12-31\nTrade payables  17000  20000"
    )
    claim = cp4c.ClaimClass(
        class_id="c02",
        name="Trade creditors",
        kind="unsecured_trade",
        rank="2",
        amount_source="source_row",
        amount_quote=Quote(source_id="financial", locator="page:4", quote="Trade payables"),
        period_column=_COLUMN,
        support=(),
        rationale="r",
        category="Documentary Fact",
        limitation=None,
    )
    return cp4c._source_row_issues(1, claim, {("financial", "page:4"): page}, DEFAULT_BASIS)


def test_millions_page_in_the_run_currency_is_accepted():
    assert _issues("IFRS; USD; amounts in millions; unaudited.") == []


@pytest.mark.parametrize(
    "unit_line", ["IFRS; USD; amounts in thousands.", "IFRS; EUR; amounts in millions."]
)
def test_other_scale_or_currency_page_is_refused(unit_line):
    issues = _issues(unit_line)
    assert issues
    assert all(i.startswith("claims[1].amount_quote: ") for i in issues)


def _book_issues(unit_line: str, currency: str) -> list[str]:
    basis = dataclasses.replace(DEFAULT_BASIS, currency=currency, money_unit=f"{currency} m")
    page = (
        f"NORTHBRIDGE SYNTHETIC GROUP\n{unit_line}\nCONSOLIDATED BALANCE SHEET\n"
        "Period end  Opening 2024-12-31  Q4 2025-12-31\nTrade payables  17  20"
    )
    claim = cp4c.ClaimClass(
        class_id="c02",
        name="Trade creditors",
        kind="unsecured_trade",
        rank="2",
        amount_source="source_row",
        amount_quote=Quote(source_id="financial", locator="page:4", quote="Trade payables"),
        period_column=_COLUMN,
        support=(),
        rationale="r",
        category="Documentary Fact",
        limitation=None,
    )
    return cp4c._source_row_issues(1, claim, {("financial", "page:4"): page}, basis)


@pytest.mark.parametrize(
    ("unit_line", "currency"),
    [
        ("All figures in EUR million unless otherwise stated", "EUR"),
        ("(in EUR million)", "EUR"),
        ("EURm", "EUR"),
        ("EUR m", "EUR"),
        ("€m", "EUR"),
        ("£m", "GBP"),
        ("£ million", "GBP"),
        ("GBPm", "GBP"),
        ("(in USD million)", "USD"),
        ("amounts in million", "USD"),
    ],
)
def test_million_spelled_the_european_way_in_the_run_currency_is_accepted(unit_line, currency):
    assert _book_issues(unit_line, currency) == []


@pytest.mark.parametrize(
    ("unit_line", "currency"),
    [
        ("IFRS; EUR; amounts in thousand.", "EUR"),
        ("EUR thousand", "EUR"),
        ("(in EUR thousands)", "EUR"),
        ("£m", "EUR"),
        ("GBPm", "EUR"),
        ("EUR m", "GBP"),
        ("(in USD million)", "EUR"),
        ("EURmm", "EUR"),
        ("CPI m", "EUR"),
    ],
)
def test_thousands_or_another_currency_stays_refused(unit_line, currency):
    assert _book_issues(unit_line, currency)


# S03-3-1 to 3-4: one reader of the unit phrase (answer keys: the four S03-3-* probes, by hand).
def _note_issues(unit_line: str, currency: str, note: str) -> list[str]:
    basis = dataclasses.replace(DEFAULT_BASIS, currency=currency, money_unit=f"{currency} m")
    page = (
        f"NORTHBRIDGE SYNTHETIC GROUP\n{unit_line}\nCONSOLIDATED BALANCE SHEET\n"
        f"Period end  Opening 2024-12-31  Q4 2025-12-31\nTrade payables  17  20\n{note}"
    )
    claim = cp4c.ClaimClass(
        class_id="c02",
        name="Trade creditors",
        kind="unsecured_trade",
        rank="2",
        amount_source="source_row",
        amount_quote=Quote(source_id="financial", locator="page:4", quote="Trade payables"),
        period_column=_COLUMN,
        support=(),
        rationale="r",
        category="Documentary Fact",
        limitation=None,
    )
    return cp4c._source_row_issues(1, claim, {("financial", "page:4"): page}, basis)


@pytest.mark.parametrize(
    ("unit_line", "currency"),
    [
        ("(in million EUR)", "USD"),
        ("(in million euros)", "USD"),
        ("(in million GBP)", "USD"),
        ("(in million pounds)", "USD"),
        ("(in millions EUR)", "USD"),
        ("(in millions, euros)", "USD"),
        ("(in million USD)", "EUR"),
        ("(in million dollars)", "EUR"),
        # 3-3: thousands in a spelling that was not read, beside a millions statement
        ("(£'000)\nNet debt (£m)", "GBP"),
        ("(£000)\nNet debt (£m)", "GBP"),
        ("(USD, thousands)\nShares outstanding (in millions)", "USD"),
        ("($000s)\nShares outstanding (in millions)", "USD"),
        ("(USD, thousands)", "USD"),
        ("€000", "EUR"),
        ("USD'000", "USD"),
        # 3-4 controls: the comma shape names its currency
        ("(EUR, millions)", "USD"),
        ("(USD, millions)", "EUR"),
    ],
)
def test_currency_after_the_scale_and_unread_thousands_are_refused(unit_line, currency):
    assert _book_issues(unit_line, currency)


@pytest.mark.parametrize(
    ("unit_line", "currency"),
    [
        ("(in million EUR)", "EUR"),
        ("(in million euros)", "EUR"),
        ("(in million dollars)", "USD"),
        ("(millions, except per share data)", "USD"),
        ("(USD, millions)", "USD"),
        ("(EUR, millions)", "EUR"),
        ("(GBP, millions)", "GBP"),
        ("EUR (millions)", "EUR"),
        ("$ (millions)", "USD"),
        ("Millions of yen", "JPY"),
        # owner item 10: an ambiguous bare word names no recognised currency: scale-only reading
        ("(in millions of kroner)", "USD"),
        ("(in millions of pesos)", "USD"),
        ("(in millions of rupees)", "USD"),
        ("(in millions of kroner)", "NOK"),
    ],
)
def test_comma_and_bare_scale_headings_and_scale_only_readings_are_accepted(unit_line, currency):
    assert _book_issues(unit_line, currency) == []


@pytest.mark.parametrize(
    ("unit_line", "book", "named"),
    [
        ("(in millions of Swiss francs)", "CHF", "USD"),
        ("(Swiss franc, millions)", "CHF", "EUR"),
        ("(RMB millions)", "CNY", "USD"),
        ("(in millions of renminbi)", "CNY", "USD"),
        ("(Chinese yuan in millions)", "CNY", "USD"),
        ("(in millions of Swedish kronor)", "SEK", "USD"),
        ("(Swedish krona, millions)", "SEK", "USD"),
        ("(in millions of Norwegian kroner)", "NOK", "USD"),
        ("(Danish krone, millions)", "DKK", "USD"),
        ("(in millions of Danish kroner)", "DKK", "USD"),
        ("(in millions of Indian rupees)", "INR", "USD"),
        ("(in millions of Mexican pesos)", "MXN", "USD"),
        ("(in millions of South African rand)", "ZAR", "USD"),
    ],
)
def test_an_unambiguous_currency_name_is_read_for_its_currency(unit_line, book, named):
    assert _book_issues(unit_line, book) == []
    assert _book_issues(unit_line, named)
    assert _book_issues(unit_line, "GBP")


@pytest.mark.parametrize(
    ("unit_line", "currency", "note"),
    [
        ("($ in millions)", "USD", "(1) Includes $500 million of euro-denominated senior notes."),
        ("($ in millions)", "USD", "(1) Includes $1.2 billion of euro-denominated senior notes."),
        ("($ in millions)", "USD", "(1) Includes 300 million of GBP-denominated loans."),
        ("(€ in millions)", "EUR", "(1) Includes US$ 500 million of USD-denominated notes."),
    ],
)
def test_an_amount_with_a_scale_word_in_a_footnote_states_no_unit(unit_line, currency, note):
    assert _note_issues(unit_line, currency, note) == []


def test_cp2e_unit_issue_ignores_a_scale_word_after_an_amount():
    from deploy_workflow.owners import cp2e

    for note in (
        "(1) Includes $500 million of euro-denominated senior notes.",
        "(1) Includes $1.2 billion of euro-denominated senior notes.",
        "(1) Includes 300 million of GBP-denominated loans.",
    ):
        page = f"CONSOLIDATED BALANCE SHEET ($ in millions)\nTrade payables  17  20\n{note}"
        check = cp2e._Check({"page:4": page}, re.compile("x"), "USD")
        assert check.unit_issue("page:4") is None


@pytest.mark.parametrize(
    "unit_line",
    [
        "IFRS; USD; amounts in millions; weighted-average shares (in thousands).",
        "IFRS; USD; amounts in millions, except share counts in thousands.",
        "IFRS; USD; amounts in millions. Common shares outstanding (in thousands).",
        "IFRS; USD; amounts in millions, except shares, in thousands.",
    ],
)
def test_a_share_count_clause_in_thousands_states_no_monetary_unit(unit_line):
    """S03-2-1: the page's unit is the millions of its amounts, whatever the share clause says."""
    assert _issues(unit_line) == []


@pytest.mark.parametrize(
    "unit_line",
    [
        "IFRS; USD; amounts in thousands; weighted-average shares (in thousands).",
        "IFRS; USD; weighted-average shares (in thousands).",  # no amount unit at all
    ],
)
def test_a_share_count_clause_never_stands_in_for_the_amount_unit(unit_line):
    assert _issues(unit_line)


@pytest.mark.parametrize(
    ("unit_line", "currency", "refused"),
    [
        # ADV-5: the currency sentence and the unit sentence are one statement
        ("Presentation currency: EUR. Amounts in millions.", "USD", True),
        ("Presentation currency: EUR. Amounts in millions.", "EUR", False),
        ("Reporting currency: USD. Figures in millions.", "USD", False),
        ("Reporting currency: USD. Figures in millions.", "EUR", True),
        ("Currency: EUR\nAmounts in millions", "USD", True),  # the form with a line break
        ("Currency: EUR; amounts in millions", "USD", True),  # the form with a semicolon
        # a currency named in a sentence that is not the currency statement stays a scale-only page
        ("Group rate: 1 USD = 0.9 EUR. Amounts in millions.", "USD", False),
    ],
)
def test_a_currency_sentence_before_the_unit_sentence_names_the_pages_currency(
    unit_line, currency, refused
):
    assert bool(_book_issues(unit_line, currency)) is refused
