"""S03 C2 fix round 1: limit rows read by `read_limits`. Expected outcomes are literals."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import pytest

from deploy_vii.inputs.portfolio_export import quantity
from deploy_workflow.recommendation import read_limits
from deploy_workflow.reference_portfolios import Limit, Portfolio

AT = datetime(2026, 11, 25, tzinfo=UTC)


def row(category: str, parameter: str, limit: str, headroom: str, status: str) -> Limit:
    return Limit(
        "limits.csv",
        2,
        category,
        parameter,
        limit,
        "Hard",
        "",
        headroom,
        status,
        "",
        quantity(limit),
    )


def outcome(
    limit: Limit, *, sector: str | None = None, bucket: str | None = "BB", price: str | None = None
) -> str:
    portfolio = Portfolio("p", "Portfolio", "clo", None, AT, (), (), (limit,))
    [reading] = read_limits(
        portfolio,
        sector=sector,
        rating_bucket=bucket,
        price=None if price is None else Decimal(price),
    )
    return reading.outcome


NEEDS_EXPECTATION_CHANGE = (
    "needs expectation change: tests/test_recommendation.py::"
    "test_every_word_of_a_limit_row_is_read_or_the_row_is_not_read[...Excluded sectors (Tobacco, "
    "Weapons)...issuer19/issuer20] pins `breached` for a sibling list item (Weapons)"
)


@pytest.mark.parametrize(
    ("parameter", "expected"),
    [
        ("Energy second lien", "not_read"),
        ("Max Energy exposure", "breached"),
        *(
            pytest.param(text, "not_read", marks=pytest.mark.xfail(strict=True, reason=why))
            for text, why in (
                ("Energy (non-US)", NEEDS_EXPECTATION_CHANGE),
                ("Energy (second lien)", NEEDS_EXPECTATION_CHANGE),
                ("Energy, excluding Oil", NEEDS_EXPECTATION_CHANGE),
                ("Energy: floating-rate only", NEEDS_EXPECTATION_CHANGE),
                ("Energy; non-US", NEEDS_EXPECTATION_CHANGE),
            )
        ),
    ],
)
def test_c2_1_a_qualifier_in_another_list_item_leaves_a_sector_row_not_read(
    parameter: str, expected: str
) -> None:
    limit = row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Energy") == expected


def test_c2_2_a_parameter_naming_the_sector_in_a_sector_category_stays_a_sector_row() -> None:
    limit = row("Sector and rating", "Energy max", "≤ 15% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Energy", bucket="CCC") == "breached"


@pytest.mark.parametrize(
    ("parameter", "expected"),
    [
        ("Energy 2L max", "not_read"),
        ("Energy 144A", "not_read"),
        ("Energy 1L", "not_read"),
        ("Energy 2nd lien", "not_read"),
        ("Energy 10% max", "breached"),
        ("Energy 3rd max", "breached"),
        ("Energy 1st max", "breached"),
        ("Energy 4th max", "breached"),
        ("Energy 10 max", "breached"),
    ],
)
def test_c2_4_only_figures_and_ordinals_are_ignored(parameter: str, expected: str) -> None:
    limit = row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Energy") == expected


@pytest.mark.parametrize(
    ("category", "parameter"),
    [
        ("Industry", "Max single industry CCC"),
        ("Industry", "Largest industry CCC"),
        ("Rating", "Max CCC sector exposure"),
        ("Rating", "Max B3 and below sector exposure"),
        ("Sector", "Sector CCC limit"),
        ("Sector", "Max single sector (CCC)"),
    ],
)
def test_f1_a_per_sector_rating_limit_is_not_read(category: str, parameter: str) -> None:
    limit = row(category, parameter, "≤ 7.5% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Software", bucket="CCC") == "not_read"


@pytest.mark.parametrize(
    "parameter",
    [
        "Max Healthcare exposure $50m",
        "Healthcare max €25mn",
        "Healthcare max 100k",
        "Healthcare max 5x",
        "Healthcare max 2.5x",
        "Healthcare max 10bp",
        "Healthcare max 10pct",
    ],
)
def test_f2_a_figure_with_a_unit_suffix_is_ignored_in_a_sector_row(parameter: str) -> None:
    limit = row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Healthcare", bucket="B") == "breached"


@pytest.mark.parametrize("parameter", ["Minimum price 80c", "Price floor 80pts"])
def test_f2_a_figure_with_a_unit_suffix_is_ignored_in_a_price_floor(parameter: str) -> None:
    limit = row("Price", parameter, "≥ 80", "", "")
    assert outcome(limit, price="75") == "breached"


@pytest.mark.parametrize(
    "parameter", ["Software CCC max", "Software investment max", "Software $5b max"]
)
def test_c2r_1_a_row_naming_another_sector_stays_a_sector_row(parameter: str) -> None:
    limit = row("Sector and rating concentration", parameter, "≤ 7.5% NAV", "2.00%", "Pass")
    assert outcome(limit, sector="Energy", bucket="CCC") == "does_not_apply"


def test_a_dollar_figure_in_a_sector_row_is_not_breached() -> None:
    limit = row("Sector", "Max exposure $5b", "≤ 15% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Software", bucket="B") == "not_read"


def test_a_rating_parameter_under_another_sectors_category_is_not_breached() -> None:
    limit = row("Healthcare sector", "CCC max", "≤ 7.5% NAV", "-1.00%", "Breach")
    assert outcome(limit, sector="Energy", bucket="CCC") == "not_read"
