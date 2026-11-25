"""The one period-ordering rule (docs/superpowers/specs/2026-11-25-chart-periods.md).

Expected values come from the hand-written shared table or from literals here, never from
`deploy_vii.period_order` itself. The same table is read by web/src/utils/periodOrder.test.ts.
"""

from __future__ import annotations

import json
from datetime import date
from itertools import pairwise
from pathlib import Path
from typing import Any

import pytest

from deploy_vii.period_order import (
    ParsedPeriod,
    PeriodClass,
    order_periods,
    parse_period,
    period_key,
    structured_period_key,
)

CASES: dict[str, Any] = json.loads(
    (Path(__file__).parent / "fixtures" / "period-order-cases.json").read_text(encoding="utf-8")
)


def test_the_shared_table_has_every_kind_of_case() -> None:
    assert len(CASES["labels"]) == 82
    assert len(CASES["unparseable"]) == 52
    assert len(CASES["orders"]) == 12


@pytest.mark.parametrize("case", CASES["labels"], ids=lambda case: repr(case["label"]))
def test_label_is_read_as_its_class_end_and_span(case: dict[str, Any]) -> None:
    parsed = parse_period(case["label"])

    assert parsed is not None
    assert parsed.period_class.name.lower() == case["class"]
    assert parsed.end == (None if case["end"] is None else tuple(case["end"]))
    assert parsed.span == case["span"]
    assert period_key(case["label"]) is not None


@pytest.mark.parametrize("label", CASES["unparseable"], ids=repr)
def test_label_without_a_period_is_unparseable(label: str) -> None:
    assert parse_period(label) is None
    assert period_key(label) is None


@pytest.mark.parametrize("case", CASES["orders"], ids=lambda case: case["name"])
def test_labels_are_ordered_and_gaps_reported(case: dict[str, Any]) -> None:
    ordered, gaps = order_periods(case["input"], lambda label: label)

    assert list(ordered) == case["ordered"]
    assert list(gaps) == case["gaps"]


def test_a_label_names_at_most_one_year() -> None:
    assert parse_period("FY2024 FY2025") is None
    assert parse_period("FY24 FY25") is None
    assert parse_period("2024 2025E") is None


def test_a_four_digit_year_is_between_1900_and_2199() -> None:
    assert parse_period("1899") is None
    assert parse_period("FY2200") is None
    assert parse_period("1900") == ParsedPeriod(PeriodClass.ACTUAL, (1900, 12, 31), "year")
    assert parse_period("FY2199") == ParsedPeriod(PeriodClass.ACTUAL, (2199, 12, 31), "year")


def test_a_two_digit_year_turns_the_century_at_seventy() -> None:
    assert parse_period("FY69") == ParsedPeriod(PeriodClass.ACTUAL, (2069, 12, 31), "year")
    assert parse_period("FY70") == ParsedPeriod(PeriodClass.ACTUAL, (1970, 12, 31), "year")
    assert parse_period("FY00") == ParsedPeriod(PeriodClass.ACTUAL, (2000, 12, 31), "year")


def test_a_letter_after_the_year_is_a_suffix_only_when_it_stands_alone() -> None:
    assert parse_period("2024 EBITDA") is None
    assert parse_period("2024 Flow") is None
    assert parse_period("2024EA") is None
    assert parse_period("2024 A") == ParsedPeriod(PeriodClass.ACTUAL, (2024, 12, 31), "year")
    assert parse_period("2024 F") == ParsedPeriod(PeriodClass.FORECAST, (2024, 12, 31), "year")
    assert parse_period("26E") == ParsedPeriod(PeriodClass.FORECAST, (2026, 12, 31), "year")
    assert parse_period("26A") is None


def test_a_fiscal_prefix_standing_apart_from_its_year_is_read_with_it() -> None:
    assert parse_period("FY ended 31 Dec 2024") == ParsedPeriod(
        PeriodClass.ACTUAL, (2024, 12, 31), "month"
    )
    assert parse_period("FY Q3 24") == ParsedPeriod(PeriodClass.ACTUAL, (2024, 9, 31), "quarter")
    assert parse_period("FY") is None
    assert parse_period("LTM FY") is None


def test_a_character_the_rule_does_not_know_makes_the_label_unparseable() -> None:
    assert parse_period("FY2024*") is None
    assert parse_period("FY2024 %") is None
    assert parse_period("FY2024 | Q4 — reported") == ParsedPeriod(
        PeriodClass.ACTUAL, (2024, 12, 31), "quarter"
    )


def test_ltm_and_pf_sit_after_fiscal_years_oldest_first() -> None:
    labels = ["PF FY2023", "LTM Jun 2024", "FY2025", "PF", "LTM Dec 2023", "FY2023", "FY2024"]

    ordered, gaps = order_periods(labels, lambda label: label)

    assert ordered == (
        "FY2023",
        "FY2024",
        "FY2025",
        "LTM Dec 2023",
        "LTM Jun 2024",
        "PF FY2023",
        "PF",
    )
    assert gaps == ()


def test_period_classes_are_ordered_as_the_ruling_orders_them() -> None:
    assert [member.name for member in sorted(PeriodClass)] == [
        "ACTUAL",
        "YTD",
        "LTM",
        "PF",
        "FORECAST",
    ]


def test_parsed_period_is_a_frozen_value() -> None:
    assert parse_period("FY2024") == ParsedPeriod(
        period_class=PeriodClass.ACTUAL, end=(2024, 12, 31), span="year", prior_ytd=False
    )
    assert parse_period("PYTD") == ParsedPeriod(
        period_class=PeriodClass.YTD, end=None, span=None, prior_ytd=True
    )


def test_a_dated_pytd_sorts_before_a_dated_ytd_on_the_same_end() -> None:
    ordered, gaps = order_periods(["YTD Sep 2025", "PYTD Sep 2025"], lambda label: label)

    assert ordered == ("PYTD Sep 2025", "YTD Sep 2025")
    assert gaps == ()


def test_items_are_ordered_by_the_label_the_caller_reads_from_them() -> None:
    rows = [{"Period": "LTM", "v": 1}, {"Period": "?", "v": 2}, {"Period": "FY2024", "v": 3}]

    ordered, gaps = order_periods(rows, lambda row: str(row["Period"]))

    assert [row["v"] for row in ordered] == [3, 1, 2]
    assert [row["v"] for row in gaps] == [2]


def test_structured_periods_order_by_type_then_date() -> None:
    keys = [
        structured_period_key("FY", date(2023, 12, 31)),
        structured_period_key("FY", date(2024, 12, 31)),
        structured_period_key("YTD", date(2023, 9, 30)),
        structured_period_key("LTM", date(2023, 6, 30)),
        structured_period_key("PF", date(2022, 12, 31)),
    ]

    assert all(earlier < later for earlier, later in pairwise(keys))


def test_structured_quarter_sorts_before_the_fiscal_year_on_one_end_date() -> None:
    end = date(2024, 12, 31)

    assert structured_period_key("PERIOD_END", end) < structured_period_key("QUARTER", end)
    assert structured_period_key("QUARTER", end) < structured_period_key("FY", end)
    assert structured_period_key("QUARTER", date(2024, 9, 30)) < structured_period_key("FY", end)
    assert structured_period_key("FY", end) < structured_period_key("QUARTER", date(2025, 3, 31))


def test_structured_keys_are_comparable_with_label_keys() -> None:
    label_keys = {label: period_key(label) for label in ("FY2023", "YTD Sep 2025", "FY2025E")}
    assert None not in label_keys.values()

    fy2024 = structured_period_key("FY", date(2024, 12, 31))
    ltm = structured_period_key("LTM", date(2025, 6, 30))

    assert label_keys["FY2023"] < fy2024 < label_keys["YTD Sep 2025"] < ltm  # type: ignore[operator]
    assert ltm < label_keys["FY2025E"]  # type: ignore[operator]
    assert fy2024[:4] == period_key("FY2024 / 2024-12-31")[:4]  # type: ignore[index]
    assert fy2024[:4] == (0, 2024, 12, 31)


def test_structured_period_without_a_date_sorts_last_in_its_class() -> None:
    assert structured_period_key("LTM", date(2030, 1, 31)) < structured_period_key("LTM", None)
    assert structured_period_key("LTM", None) < structured_period_key("PF", date(2001, 1, 31))


def test_structured_period_of_an_unknown_type_is_refused() -> None:
    with pytest.raises(ValueError, match="HALF"):
        structured_period_key("HALF", date(2024, 6, 30))
