"""CP-4 legal thresholds: a decimal written without a leading zero is read as written (S11-1-1)."""

import hashlib
from decimal import Decimal

import pytest

from deploy_vii.business_context import Quote
from deploy_vii.contracts import Source, Span
from deploy_vii.cp4_legal import Covenant, _sentence_ends, _threshold_issues, parse_threshold


@pytest.mark.parametrize(
    ("text", "unit", "expected"),
    [
        (".50 to 1.00", "multiple", Decimal("0.50")),
        (".75:1.00", "multiple", Decimal("0.75")),
        ("at least .25x", "multiple", Decimal("0.25")),
        (".5%", "percent", Decimal("0.5")),
        ("5.00 to 1.00", "multiple", Decimal("5.00")),
        ("at most 2.5x", "multiple", Decimal("2.5")),
        ("1,250.5%", "percent", Decimal("1250.5")),
        ("Ratio.....4 to 1", "multiple", Decimal(4)),
        ("Ratio..4 to 1", "multiple", Decimal(4)),
        ("Ratio\u20264 to 1", "multiple", Decimal(4)),
        ("Ratio...5x", "multiple", Decimal(5)),
        ("basket...10 per cent", "percent", Decimal(10)),
        ("Maximum Total Net Leverage Ratio . . . . .4 to 1", "multiple", Decimal(4)),
        ("Minimum Interest Cover . . . . .4x", "multiple", Decimal(4)),
        ("Maximum Total Net Leverage Ratio\u2026.4 to 1", "multiple", Decimal(4)),
        ("Maximum capex basket . . . . .5%", "percent", Decimal(5)),
        ("Ratio . . . . 4.50 to 1.00", "multiple", Decimal("4.50")),
        (". . . . .4.50 to 1.00", "multiple", Decimal("4.50")),
        ("Section 7.10 4.00 to 1.00", "multiple", Decimal("4.00")),
        ("7.1. .50x", "multiple", Decimal("0.50")),
        ("Section 7.1. .5x", "multiple", Decimal("0.5")),
        (" .5x", "multiple", Decimal("0.5")),
        ("(.5x)", "multiple", Decimal("0.5")),
        ("Ratio\u00b7\u00b7\u00b7\u00b7\u00b74 to 1", "multiple", Decimal(4)),
        # S11-4-5: an abbreviation's full stop, a space and ".5" is no leader (two spaced marks).
        ("approx. .5x", "multiple", Decimal("0.5")),
        ("U.S. .50 to 1.00", "multiple", Decimal("0.50")),
        ("Ratio. .4 to 1", "multiple", Decimal("0.4")),
    ],
)
def test_threshold_reads_the_value_as_written(text: str, unit: str, expected: Decimal) -> None:
    assert parse_threshold(text, unit) == (expected, None)


def test_section_number_and_full_stop_are_no_threshold() -> None:
    assert parse_threshold("See Section 7.10", "multiple")[0] is None
    assert parse_threshold("Section 7.10 percent", "percent")[0] != Decimal("0.10")
    assert parse_threshold("at most 1.00. Then", "multiple")[0] is None


def _covenant(value: str) -> Covenant:
    quote = Quote(source_id="D1", locator="p1", quote="Ratio not less than .50 to 1.00")
    return Covenant(
        name="c",
        kind="maintenance",
        document_id="D1",
        clause="7.1",
        definition_text="d",
        test_formula="f",
        threshold_text=".50 to 1.00",
        threshold_unit="multiple",
        threshold_value=value,
        comparison=">=",
        metric_ref=None,
        metric_basis="Not determinable",
        facility_ids=(),
        period_scope="p",
        citations=(quote,),
        limitation=None,
    )


def test_validator_accepts_written_value_and_refuses_the_dropped_point() -> None:
    assert _threshold_issues("c", _covenant("0.50"), []) == []
    refused = _threshold_issues("c", _covenant("50"), [])
    assert any("differs from 0.50" in issue for issue in refused)


def test_validator_reads_a_spaced_leader_as_no_decimal_point() -> None:
    quote = Quote(
        source_id="D1",
        locator="p1",
        quote="Maximum Total Net Leverage Ratio . . . . .4 to 1",
    )
    base = _covenant("4")
    right = base.model_copy(
        update={
            "threshold_text": "4 to 1",
            "threshold_value": "4",
            "citations": (quote,),
            "comparison": "<=",
        }
    )
    assert _threshold_issues("c", right, []) == []
    wrong = base.model_copy(
        update={
            "threshold_text": ".4 to 1",
            "threshold_value": "0.4",
            "citations": (quote,),
            "comparison": "<=",
        }
    )
    issues = _threshold_issues("c", wrong, [])
    assert any("is not a multiple threshold its governing quote states" in i for i in issues)


def _row(quote: str, text: str, value: str, comparison: str, unit: str = "multiple") -> Covenant:
    return _covenant(value).model_copy(
        update={
            "threshold_text": text,
            "threshold_unit": unit,
            "comparison": comparison,
            "citations": (Quote(source_id="D1", locator="p1", quote=quote),),
        }
    )


_FCCR = (  # S11-4-1 Q1: 104 characters between "permit" and "to be less than"
    "The Borrower shall not permit the Fixed Charge Coverage Ratio, calculated as of the last day "
    "of the most recently ended Test Period, to be less than 1.00 to 1.00 at any time Excess "
    "Availability is less than the greater of 10.0% of the Maximum Credit and $10,000,000."
)
_TNLR = (  # S11-4-1 Q2: "at least" times the first test date; it is no floor on the ratio
    "The Borrower will not permit the Total Net Leverage Ratio, as of the last day of any fiscal "
    "quarter ending at least six months after the Closing Date, to exceed 4.50 to 1.00."
)
_LSTA = (  # 81 characters between "permit" and "to exceed"
    "The Borrower shall not permit the Consolidated Total Net Leverage Ratio as of the last day "
    "of any Test Period to exceed 4.50 to 1.00."
)
_TWO = (
    "The Borrower shall not permit the Total Net Leverage Ratio to exceed 4.50 to 1.00 or the "
    "Interest Coverage Ratio to be less than 2.00 to 1.00."
)


@pytest.mark.parametrize(
    ("quote", "text", "stated", "opposite", "caught"),
    [
        # S11-r5 ruling: a quote holding other limit wording ("less than the greater of", "at
        # least six months", a second side) leaves the opposite comparison to the model.
        (_FCCR, "1.00 to 1.00", ">=", "<=", False),
        (_TNLR, "4.50 to 1.00", "<=", ">=", False),
        (_LSTA, "4.50 to 1.00", "<=", ">=", True),
        (_TWO, "4.50 to 1.00", "<=", ">=", False),
        (_TWO, "2.00 to 1.00", ">=", "<=", False),
        (
            "shall not permit the Ratio to be less than 2.00 to 1.00",
            "2.00 to 1.00",
            ">=",
            "<=",
            True,
        ),
        ("shall not exceed 4.00 to 1.00", "4.00 to 1.00", "<=", ">=", True),
        ("shall maintain a Ratio of at least 2.00 to 1.00", "2.00 to 1.00", ">=", "<=", True),
        ("Maximum Total Net Leverage Ratio. 4.50 to 1.00", "4.50 to 1.00", "<=", ">=", True),
    ],
)
def test_direction_is_read_from_the_phrase_governing_the_threshold(
    quote: str, text: str, stated: str, opposite: str, caught: bool
) -> None:
    value = text.split(" ")[0]
    accepted = _threshold_issues("c", _row(quote, text, value, stated), [])
    assert not any("contradicts the quote" in issue for issue in accepted)
    refused = _threshold_issues("c", _row(quote, text, value, opposite), [])
    assert any("contradicts the quote" in issue for issue in refused) is caught


def test_strict_comparison_on_a_long_inclusive_permit_phrase_is_refused() -> None:
    refused = _threshold_issues("c", _row(_LSTA, "4.50 to 1.00", "4.50", "<"), [])
    assert any("words the limit as inclusive" in issue for issue in refused)


def _step_issues(span: str, quote: str, text: str, value: str, unit: str) -> list[str]:
    source = Source(
        source_id="D1",
        name="Facility Agreement",
        status="ready",
        sha256=hashlib.sha256(span.encode()).hexdigest(),
        spans=(Span(locator="p1", text=span),),
        extraction_status="complete",
    )
    row = _row(quote, text, value, "<=", unit)
    return _threshold_issues("c", row, [source])


_LTV = "The Borrower shall ensure that the Loan to Value Ratio does not at any time exceed 65"


@pytest.mark.parametrize(
    ("span", "quote", "text", "value", "unit"),
    [
        (
            (
                f"{_LTV} per cent. (or, on and after the first anniversary of the Utilisation "
                "Date, 60 per cent.)."
            ),
            f"{_LTV} per cent.",
            "65 per cent",
            "65",
            "percent",
        ),
        (
            f"{_LTV}% (or, on and after the first anniversary of the Utilisation Date, 60%).",
            f"{_LTV}%",
            "65%",
            "65",
            "percent",
        ),
        (
            (
                "The Borrower shall not permit the Total Net Leverage Ratio to exceed 4.75 to 1.00 "
                "for any Test Period ending on or before the first anniversary of the Closing Date "
                "(i.e. Fiscal Year 2025) and 4.50 to 1.00 for any Test Period ending thereafter."
            ),
            "The Borrower shall not permit the Total Net Leverage Ratio to exceed 4.75 to 1.00",
            "4.75 to 1.00",
            "4.75",
            "multiple",
        ),
        (
            (
                "The Borrower shall not permit the Total Net Leverage Ratio to exceed 4.75 to 1.00 "
                "(e.g. Fiscal Year 2025) and approx. Year 2026 or U.S. Holdings no. Sect. 4 c. "
                "Year 2027 at 4.50 to 1.00 thereafter."
            ),
            "The Borrower shall not permit the Total Net Leverage Ratio to exceed 4.75 to 1.00",
            "4.75 to 1.00",
            "4.75",
            "multiple",
        ),
        (
            (
                "Maximum Total Net Leverage Ratio Test Period ending 4.75 to 1.00 . . . . . . "
                "March 31, 2025 4.50 to 1.00 . . . . . . June 30, 2025"
            ),
            "Maximum Total Net Leverage Ratio Test Period ending 4.75 to 1.00",
            "4.75 to 1.00",
            "4.75",
            "multiple",
        ),
    ],
)
def test_step_down_guard_reads_the_whole_sentence(
    span: str, quote: str, text: str, value: str, unit: str
) -> None:
    issues = _step_issues(span, quote, text, value, unit)
    assert any("states more than one" in issue for issue in issues)


def test_step_down_guard_still_ends_a_sentence_before_the_next() -> None:
    span = (
        "The Borrower shall not permit the Total Net Leverage Ratio to exceed 65 per cent. The "
        "Borrower shall ensure Gearing does not exceed 60 per cent."
    )
    quote = "The Borrower shall not permit the Total Net Leverage Ratio to exceed 65 per cent."
    assert _step_issues(span, quote, "65 per cent", "65", "percent") == []


# S11-5-5 (hand-keyed LSTA/LMA corpus, copied from the probe): the stated comparison is never
# refused; where `caught`, the words state one side only and the opposite is refused.
_DIRECTION_CORPUS = [
    (
        (
            "The Borrower shall not permit the Consolidated Total Net Leverage Ratio as of the "
            "last day of any Test Period to exceed 4.50 to 1.00."
        ),
        "4.50 to 1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        (
            "The Borrower will not permit the First Lien Net Leverage Ratio, as of the last day "
            "of any Test Period ending on or after March 31, 2025 (commencing with the first "
            "full fiscal quarter after the Closing Date), to exceed 6.25 to 1.00."
        ),
        "6.25 to 1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        (
            "Holdings shall not permit the Total Leverage Ratio, determined as of the last day "
            "of each fiscal quarter in accordance with Section 1.03, to be greater than 5.00 to "
            "1.00."
        ),
        "5.00 to 1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        (
            "The Consolidated Leverage Ratio shall not exceed 3.50:1.00 as of the last day of "
            "any fiscal quarter."
        ),
        "3.50:1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        "The Total Leverage Ratio shall be no greater than 4.00x.",
        "4.00x",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        "The Leverage Ratio shall be 4.00x or less on each Test Date.",
        "4.00x",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        "The Borrower shall maintain a Leverage Ratio of not more than 3.75 to 1.00.",
        "3.75 to 1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        (
            "The Borrower shall not permit the Total Leverage Ratio to be greater than or equal "
            "to 5.00 to 1.00."
        ),
        "5.00 to 1.00",
        "multiple",
        "<",
        ">=",
        False,
    ),
    (
        "The Total Leverage Ratio shall not be greater than or equal to 5.00 to 1.00.",
        "5.00 to 1.00",
        "multiple",
        "<",
        ">=",
        False,
    ),
    (
        (
            "The Borrower shall not permit the Total Net Leverage Ratio to exceed, as of the "
            "last day of any fiscal quarter ending at least six months after the Closing Date, "
            "4.50 to 1.00."
        ),
        "4.50 to 1.00",
        "multiple",
        "<=",
        ">=",
        False,
    ),
    (
        (
            "The Borrower shall not permit the Fixed Charge Coverage Ratio, calculated as of the "
            "last day of the most recently ended Test Period, to be less than 1.00 to 1.00 at "
            "any time Excess Availability is less than the greater of 10.0% of the Maximum "
            "Credit and $10,000,000."
        ),
        "1.00 to 1.00",
        "multiple",
        ">=",
        "<=",
        False,
    ),
    (
        (
            "The Borrower shall not permit the Interest Coverage Ratio for any Test Period to be "
            "less than 2.50 to 1.00."
        ),
        "2.50 to 1.00",
        "multiple",
        ">=",
        "<=",
        True,
    ),
    (
        "The Borrower shall maintain a Fixed Charge Coverage Ratio of at least 1.10 to 1.00.",
        "1.10 to 1.00",
        "multiple",
        ">=",
        "<=",
        True,
    ),
    (
        (
            "The Borrower shall not permit the Fixed Charge Coverage Ratio to be less than or "
            "equal to 1.00 to 1.00."
        ),
        "1.00 to 1.00",
        "multiple",
        ">",
        "<=",
        False,
    ),
    (
        "Interest Cover shall not be less than or equal to 1.00:1.",
        "1.00:1",
        "multiple",
        ">",
        "<=",
        False,
    ),
    (
        "The Interest Coverage Ratio shall be not less than 3.00x for each Test Period.",
        "3.00x",
        "multiple",
        ">=",
        "<=",
        True,
    ),
    (
        (
            "The Borrower shall not permit the Interest Coverage Ratio to be less than, for any "
            "Test Period in which no more than $10,000,000 of Revolving Loans are outstanding, "
            "2.00 to 1.00."
        ),
        "2.00 to 1.00",
        "multiple",
        ">=",
        "<=",
        False,
    ),
    (
        (
            "Interest Cover in respect of any Relevant Period shall not be less than 4.00:1, "
            "provided that for any Relevant Period ending no more than six months after the "
            "Closing Date Interest Cover shall be calculated on an annualised basis."
        ),
        "4.00:1",
        "multiple",
        ">=",
        "<=",
        False,
    ),
    (
        (
            "The Parent shall ensure that Leverage in respect of any Relevant Period does not "
            "exceed 3.50:1."
        ),
        "3.50:1",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        (
            "The Borrower shall ensure that, on each Test Date falling at least three months "
            "after the Utilisation Date, the Loan to Value Ratio does not at any time exceed 65 "
            "per cent."
        ),
        "65 per cent",
        "percent",
        "<=",
        ">=",
        False,
    ),
    (
        "The Borrower shall ensure that the Loan to Value Ratio does not exceed 70 per cent.",
        "70 per cent",
        "percent",
        "<=",
        ">=",
        True,
    ),
    (
        "The Borrower shall ensure that Interest Cover is not at any time less than 150 per cent.",
        "150 per cent",
        "percent",
        ">=",
        "<=",
        False,
    ),
    (
        "The Obligors shall ensure that Gearing is not more than 125 percent. on any Test Date.",
        "125 percent",
        "percent",
        "<=",
        ">=",
        True,
    ),
    (
        "The Debt Service Cover Ratio shall be at least 1.20:1 on each Calculation Date.",
        "1.20:1",
        "multiple",
        ">=",
        "<=",
        True,
    ),
    (
        (
            "Minimum Liquidity: the Group shall maintain Liquidity of a minimum of 15% of Total "
            "Commitments."
        ),
        "15%",
        "percent",
        ">=",
        "<=",
        False,
    ),
    (
        "Cashflow Cover in respect of any Relevant Period shall be no less than 1.10:1.",
        "1.10:1",
        "multiple",
        ">=",
        "<=",
        True,
    ),
    (
        (
            "(a) The Borrower shall ensure that the Loan to Value Ratio does not at any time "
            "exceed 70 per cent."
        ),
        "70 per cent",
        "percent",
        "<=",
        ">=",
        False,
    ),
    (
        "(ii) the Interest Cover is not less than 175 per cent.",
        "175 per cent",
        "percent",
        ">=",
        "<=",
        True,
    ),
    (
        "Maximum Total Net Leverage Ratio. 4.50 to 1.00",
        "4.50 to 1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        "The Senior Secured Leverage Ratio shall be less than or equal to 2.75 to 1.00.",
        "2.75 to 1.00",
        "multiple",
        "<=",
        ">=",
        True,
    ),
    (
        "The Asset Coverage Ratio shall be greater than or equal to 1.50 to 1.00.",
        "1.50 to 1.00",
        "multiple",
        ">=",
        "<=",
        True,
    ),
    (
        (
            "The Borrower shall not, as of the last day of any fiscal quarter, permit the Total "
            "Leverage Ratio to exceed 4.00 to 1.00."
        ),
        "4.00 to 1.00",
        "multiple",
        "<=",
        ">=",
        False,
    ),
]


@pytest.mark.parametrize("case", _DIRECTION_CORPUS)
def test_stated_direction_is_never_refused(case: tuple[str, str, str, str, str, bool]) -> None:
    quote, text, unit, stated, opposite, caught = case
    value = text.split(" ")[0].split(":")[0].rstrip("x%")
    accepted = _threshold_issues("c", _row(quote, text, value, stated, unit), [])
    assert not any("contradicts" in issue for issue in accepted)
    if caught:
        refused = _threshold_issues("c", _row(quote, text, value, opposite, unit), [])
        assert any("contradicts" in issue for issue in refused)


# S11-5-6 (hand-keyed spans, copied from the probe): "per cent." before a paragraph label ends
# the sentence, as "%." does; before "(or, ...)", "(i.e. ...)" or "(being ...)" it does not.
@pytest.mark.parametrize(
    ("text", "sentences"),
    [
        (
            (
                "LTV does not exceed 65 per cent. (or, on and after the first anniversary, 60 "
                "per cent.)."
            ),
            1,
        ),
        (
            (
                "LTV does not exceed 70 per cent. (b) The Borrower shall ensure Interest Cover "
                "is 150 per cent."
            ),
            2,
        ),
        (
            (
                "LTV does not exceed 65 percent. (b) The Borrower shall not permit the Debt "
                "Yield to be less than 9.0 percent."
            ),
            2,
        ),
        (
            (
                "(i) LTV does not exceed 70 per cent. (ii) the Interest Cover is not less than "
                "175 per cent."
            ),
            2,
        ),
        ("Gearing is 60 per cent. (A) The Parent shall ensure.", 2),
        ("Gearing is 60 per cent. (iv) the Parent shall ensure.", 2),
        ("Gearing is 60 per cent. (10) The Parent shall ensure.", 2),
        ("LTV is 65 per cent. (i.e. as tested on each Test Date) and 60 per cent. thereafter.", 1),
        ("LTV is 65 per cent. (being the Base Case level) on each Test Date.", 1),
        ("LTV does not exceed 70%. (b) The Borrower shall ensure Interest Cover is 150%.", 2),
    ],
)
def test_per_cent_before_a_paragraph_label_ends_the_sentence(text: str, sentences: int) -> None:
    assert len([end for end in _sentence_ends(text) if end < len(text)]) + 1 == sentences


_WRAPPED = (
    "The Borrower shall not permit the First-\nLien Net Leverage Ratio to exceed 4.75 to 1.00 for "
    "any Test Period ending on or before December 31, 2025 and 4.50 to 1.00 thereafter."
)
_WRAP_QUOTE = (
    "The Borrower shall not permit the First-Lien Net Leverage Ratio to exceed 4.75 to 1.00"
)
_TWICE = (
    "(a) The Borrower shall not permit the Senior Secured Leverage Ratio to exceed 4.50 to 1.00. "
    "(b) The Borrower shall not permit the Total Leverage Ratio to exceed 4.50 to 1.00 for Test "
    "Periods ending in 2025 and 4.25 to 1.00 thereafter."
)


@pytest.mark.parametrize(
    ("span", "quote", "text"),
    [
        (
            _WRAPPED,
            _WRAP_QUOTE,
            "4.75 to 1.00",
        ),
        (_TWICE, "to exceed 4.50 to 1.00", "4.50 to 1.00"),
    ],
)
def test_step_down_guard_reads_a_hyphen_wrapped_or_repeated_quote_sentence(
    span: str, quote: str, text: str
) -> None:
    issues = _step_issues(span, quote, text, text.split()[0], "multiple")
    assert any("states more than one" in issue for issue in issues)
