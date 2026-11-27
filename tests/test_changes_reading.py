"""How CP-8 reads handoffs and checks its text: reader tables, figures, sizes, maturities."""

from decimal import Decimal

from deploy_workflow.changes import _maturities
from deploy_workflow.changes_check import (
    _direction_issues,
    _fact_row_issues,
    _figures,
    _passage_issues,
    _withheld_sizes,
)
from deploy_workflow.library_index import reader_summary
from deploy_workflow.reader_summary import reader_tables

BOTTOM = "| Bottom line | Confidence | Main limitation |\n| --- | --- | --- |\n"
FINDING = "| Finding | Creditor impact | Confidence |\n| --- | --- | --- |\n"


def summary(*parts: str) -> str:
    return "# CP-2\n\n### Reader summary\n\n" + "\n\n".join(parts) + "\n\n### Detail\n"


GOOD = summary(
    BOTTOM + "| Cover holds. | High | None. |", FINDING + "| Net debt 7. | Limits. | Low |"
)


# --- reader tables ------------------------------------------------------------------------------


def test_a_lone_separator_row_between_the_tables_adds_no_empty_table() -> None:
    text = summary(
        BOTTOM + "| Cover holds. | High | None. |",
        "|---|---|---|",
        FINDING + "| Net debt 7. | Limits. | Low |",
    )
    assert reader_tables(text) == [
        [["Bottom line", "Confidence", "Main limitation"], ["Cover holds.", "High", "None."]],
        [["Finding", "Creditor impact", "Confidence"], ["Net debt 7.", "Limits.", "Low"]],
    ]
    assert reader_summary(text) is not None


def test_a_blank_row_before_a_table_adds_no_empty_table() -> None:
    text = summary(
        BOTTOM + "| Cover holds. | High | None. |",
        "| | | |",
        FINDING + "| Net debt 7. | Limits. | Low |",
    )
    assert len(reader_tables(text)) == 2


def test_a_summary_with_an_empty_first_table_is_none_not_an_error() -> None:
    assert reader_summary(summary("|---|---|---|", "| a | b | c |")) is None
    assert reader_summary(summary("| a | b | c |", "|---|---|---|")) is None


def test_a_row_of_dashes_is_content_and_kept() -> None:
    text = summary(BOTTOM + "| - | - | - |", FINDING + "| Net debt 7. | Limits. | Low |")
    assert reader_tables(text)[0] == [
        ["Bottom line", "Confidence", "Main limitation"],
        ["-", "-", "-"],
    ]
    assert reader_summary(text) == {
        "bottom_line": "-",
        "confidence": "-",
        "limitation": "-",
        "findings": [{"finding": "Net debt 7.", "impact": "Limits.", "confidence": "Low"}],
    }


def test_a_delimiter_row_of_lone_dashes_under_the_header_is_the_delimiter() -> None:
    for rule in ("|-|-|-|", "| - | - | - |"):
        text = summary(
            "| Bottom line | Confidence | Main limitation |\n"
            f"{rule}\n| Cover holds. | High | None. |",
            FINDING + "| Net debt 7. | Limits. | Low |",
        )
        assert reader_tables(text)[0] == [
            ["Bottom line", "Confidence", "Main limitation"],
            ["Cover holds.", "High", "None."],
        ]
        assert reader_summary(text) is not None


def test_alignment_and_blank_rows_inside_a_table_are_still_dropped() -> None:
    text = summary(
        "| Bottom line | Confidence | Main limitation |\n| :--- | :---: | ---: |\n| | | |\n"
        "| Cover holds. | High | None. |",
        FINDING + "| Net debt 7. | Limits. | Low |",
    )
    assert reader_tables(text)[0] == [
        ["Bottom line", "Confidence", "Main limitation"],
        ["Cover holds.", "High", "None."],
    ]


def test_a_well_formed_summary_reads_as_before() -> None:
    assert reader_summary(GOOD) == {
        "bottom_line": "Cover holds.",
        "confidence": "High",
        "limitation": "None.",
        "findings": [{"finding": "Net debt 7.", "impact": "Limits.", "confidence": "Low"}],
    }


# --- withheld sizes -----------------------------------------------------------------------------


def measure(key: str, prior: str, current: str, difference: str) -> dict:
    return {
        "key": key,
        "label": key.title(),
        "comparable": "no",
        "difference": difference,
        "prior": {"value": prior},
        "current": {"value": current},
        "same_period": False,
    }


def withheld(*measures: dict) -> dict[Decimal, str]:
    return _withheld_sizes({"measures": list(measures)}, frozenset())


def test_a_difference_equal_to_the_earlier_value_is_no_difference() -> None:
    assert withheld(measure("cash", "250", "500", "250")) == {}


def test_a_difference_equal_to_the_earlier_value_is_no_difference_whatever_its_sign() -> None:
    assert withheld(measure("cash", "250", "0", "-250")) == {}


def test_a_difference_that_is_no_value_of_its_measure_is_withheld() -> None:
    assert withheld(measure("cash", "100", "500", "400")) == {Decimal(400): "Cash"}
    assert withheld(measure("cash", "500", "100", "-400")) == {Decimal(400): "Cash"}


def test_a_comparable_unflagged_measure_withholds_nothing() -> None:
    comparable = {**measure("cash", "100", "500", "400"), "comparable": "yes"}
    assert withheld(comparable) == {}


# --- figures ------------------------------------------------------------------------------------


def sizes(text: str) -> list[str]:
    return [str(f.signed) for f in _figures(text, counts=False)]


def test_an_amount_in_millions_written_m_after_a_currency_is_a_figure() -> None:
    assert sizes("raised US$7M of debt") == ["7"]
    assert sizes("raised USD 7M of debt") == ["7"]
    assert sizes("raised USD7M of debt") == ["7"]
    assert sizes("raised €7M of debt") == ["7"]
    assert sizes("raised £12M of debt") == ["12"]


def test_a_month_count_stays_no_figure() -> None:
    assert sizes("over 7M of the period") == []
    assert sizes("12M LTM EBITDA") == []
    assert sizes("in the 9M to September") == []


def test_thousands_grouped_and_plain_numbers_are_read_as_before() -> None:
    assert sizes("Debt of 1,234,567 and 12.5x") == ["1234567", "12.5"]
    assert sizes("In 2024, the issuer") == []
    assert sizes("USD 1913 raised") == ["1913"]
    assert sizes("EUR437m") == ["437"]
    assert sizes("FY2024 EBITDA 1,234.5") == ["1234.5"]
    assert sizes("2024, 1,234 and 2025") == ["1234"]
    assert sizes("(5.5) and -3.2x") == ["-5.5", "-3.2"]
    assert sizes("version 2.0") == ["2.0"]


def test_a_list_of_numbers_is_not_one_grouped_number() -> None:
    assert [str(f.signed) for f in _figures("tests 1,2,3")] == ["1", "2", "3"]
    assert [str(f.signed) for f in _figures("ids 12,34")] == ["12", "34"]
    assert sizes("lots 100,200,300") == ["100200300"]


def test_a_leading_dot_decimal_is_a_figure() -> None:
    assert sizes("fell by .99x") == ["0.99"]
    assert sizes("up .5x and 1.5x") == ["0.5", "1.5"]


def test_a_date_in_a_fact_row_is_no_figure() -> None:
    pack = {"measures": [], "net_debt_change": None, "maturity_profile": None}
    row = ["Filing", "September 15, 2026", "-", "-", "-"]
    assert _fact_row_issues("Filing", row, pack, frozenset()) == []


def test_a_date_after_by_is_no_difference() -> None:
    assert (
        _direction_issues("Cash fell on Sept. 15, 2026 by 150", {Decimal(-150)}, "A passage") == []
    )
    issues = _direction_issues("Cash rose by 150", {Decimal(5)}, "A passage")
    assert len(issues) == 1


def test_a_leading_dot_difference_is_flagged_like_its_zero_form() -> None:
    zero = _direction_issues("Leverage rose by 0.99x", {Decimal(5)}, "A passage")
    assert len(zero) == 1
    assert _direction_issues("Leverage rose by .99x", {Decimal(5)}, "A passage") == [
        (
            "A passage: the figure 0.99 is written as a difference but is not a difference in the "
            "comparison pack; CP-8 never calculates."
        )
    ]


def test_an_amount_with_a_decimal_or_spaced_prefix_is_a_figure() -> None:
    assert sizes("net debt rose to US$7.5M") == ["7.5"]
    assert sizes("raised US$ 7M") == ["7"]
    assert sizes("raised $ 7M") == ["7"]
    assert [str(f.size) for f in _figures("raised USD -7M", counts=False)] == ["7"]
    assert [str(f.size) for f in _figures("raised USD (7M)", counts=False)] == ["7"]
    assert sizes("12M LTM") == []
    assert sizes("9M to Sep 2024") == []
    assert sizes("over 7M of the period") == []


def test_indian_grouping_is_one_figure() -> None:
    assert sizes("INR 1,00,000 raised") == ["100000"]
    assert sizes("INR 12,34,56,789 raised") == ["123456789"]
    assert [str(f.signed) for f in _figures("1,2,3")] == ["1", "2", "3"]
    assert [str(f.signed) for f in _figures("1,2345")] == ["1", "2345"]
    assert [str(f.signed) for f in _figures("1,234,56")] == ["1234", "56"]


# --- maturities ---------------------------------------------------------------------------------


def table(*rows: str) -> str:
    return (
        "### Chart data: debt maturities\n\n"
        "| Period | Debt maturing | Reporting unit | Basis and limitation |\n"
        "| --- | --- | --- | --- |\n" + "\n".join(rows) + "\n"
    )


def test_a_well_formed_maturity_table_is_read() -> None:
    text = table("| FY2026 | 500 | US$m | S. |", "| FY2027 | 100 | US$m | S. |")
    assert _maturities(text) == ("US$m", {"FY2026": "500", "FY2027": "100"})


def test_units_differing_only_in_white_space_are_one_unit() -> None:
    text = table("| FY2026 | 500 | USD  millions | S. |", "| FY2027 | 100 | USD millions | S. |")
    assert _maturities(text) is not None


def test_a_row_with_the_wrong_cell_count_makes_the_table_unreadable() -> None:
    text = table("| FY2026 | 500 | US$m | S. |", "| FY2027 | 100 | US$m |")
    assert _maturities(text) is None


def test_a_blank_unit_makes_the_table_unreadable() -> None:
    assert _maturities(table("| FY2026 | 500 |  | S. |", "| FY2027 | 100 |  | S. |")) is None
    assert _maturities(table("| FY2026 | 500 | US$m | S. |", "| FY2027 | 100 |  | S. |")) is None


def test_a_repeated_period_still_makes_the_table_unreadable() -> None:
    assert (
        _maturities(table("| FY2026 | 500 | US$m | S. |", "| FY2026 | 100 | US$m | S. |")) is None
    )


def test_a_count_in_brackets_after_a_currency_code_is_no_figure() -> None:
    for text in (
        "The debt sits in EUR (5 facilities) and cover holds.",
        "A USD +3 move.",
    ):
        assert _passage_issues([text], {"measures": []}) == []


def test_a_month_count_before_a_benchmark_rate_is_exempt_after_a_currency() -> None:
    assert sizes("USD 3M LIBOR + 250bp") == ["250"]
    assert sizes("raised USD 3MSOFR") == []
