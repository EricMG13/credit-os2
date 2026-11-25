"""The Credit Score roll-up and the 5x5 table, against the worked examples and table of
docs/methodology/portfolio-recommendation.md (sections 2, 4 and 6). Expected values are literals."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from fractions import Fraction

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_vii.inputs.portfolio_export import quantity
from deploy_workflow import recommendation
from deploy_workflow.cp2_scorecard import ASSESSMENTS, FACTORS, Assessment, FactorScore, Scorecard
from deploy_workflow.recommendation import (
    RECOMMENDATION_NAMES,
    SCORE_NAMES,
    TABLE,
    CreditScore,
    Instrument,
    Issuer,
    Valuation,
    band,
    best,
    credit_score,
    eligible_types,
    instrument_proposal,
    portfolio_reading,
    proposal,
    read_limits,
    valuation,
)
from deploy_workflow.reference_portfolios import (
    AssetType,
    Kind,
    Limit,
    Portfolio,
    Position,
    Weight,
    limits,
    read_clo_pack,
)
from tools import synthetic_reference_portfolios as synth

# Methodology section 6, row by Credit Score 1..5, column by Valuation 1..5.
METHODOLOGY_TABLE = {
    1: (1, 2, 2, 3, 3),
    2: (2, 2, 3, 3, 4),
    3: (2, 3, 3, 4, 4),
    4: (3, 3, 4, 4, 5),
    5: (3, 4, 4, 5, 5),
}


def card(
    levels: dict[str, int | None] | list[int | None],
    views: str | None = "Neutral",
) -> Scorecard:
    """A scorecard: a list is read in FACTORS order; a dict names factors, the rest unscored."""
    if isinstance(levels, dict):
        given_levels = [levels.get(name) for name in FACTORS]
    else:
        given_levels = list(levels) + [None] * (len(FACTORS) - len(levels))
    factors = tuple(
        FactorScore(name, level, "basis" if level else "Not supplied: none")
        for name, level in zip(FACTORS, given_levels, strict=True)
    )
    assessments = tuple(
        Assessment(name, views if views in options else options[0], "x")
        for name, options in ASSESSMENTS.items()
    )
    return Scorecard(factors, assessments)


def test_example_1_fifteen_scored_sum_39_is_3() -> None:
    result = credit_score(card([3] * 9 + [2] * 6))  # sum 27 + 12 = 39, none a 5, two unscored
    assert (result.score, result.scored, result.mean, result.floored) == (
        3,
        15,
        Fraction(13, 5),
        False,
    )
    assert result.gaps == FACTORS[15:]


def test_example_2_sixteen_scored_sum_40_with_liquidity_5_is_4() -> None:
    levels: dict[str, int | None] = dict.fromkeys(FACTORS[:16], 2)
    for name in FACTORS[10:15]:
        levels[name] = 3  # five 3s, ten 2s among the fifteen others, then Liquidity 5
    levels["Liquidity"] = 5
    assert sum(v for v in levels.values() if v) == 40
    result = credit_score(card(levels))
    assert (result.scored, result.mean, result.score, result.floored) == (
        16,
        Fraction(5, 2),
        4,
        True,
    )
    assert "Liquidity" in result.reason


def test_table_matches_methodology_cell_by_cell() -> None:
    for credit, row in METHODOLOGY_TABLE.items():
        for column, expected in enumerate(row, start=1):
            assert proposal(credit, column) == expected
            assert TABLE[credit - 1][column - 1] == expected


def test_scale_names() -> None:
    assert SCORE_NAMES == ("Strong", "Good", "Fair", "Weak", "Stressed")
    assert RECOMMENDATION_NAMES == ("Strong OW", "Modest OW", "MW", "Modest UW", "Strong UW")


def test_eleven_scored_gives_no_score_and_lists_gaps() -> None:
    result = credit_score(card([3] * 11))
    assert result.score is None and result.mean is None and result.scored == 11
    assert result.gaps == FACTORS[11:]
    assert "11" in result.reason and "12" in result.reason and result.floored is False


def test_twelve_scored_gives_a_score() -> None:
    assert credit_score(card([3] * 12)).score == 3


@pytest.mark.parametrize(
    ("levels", "expected"),
    [
        ([2] * 6 + [3] * 6, 3),  # mean 2.5
        ([3] * 6 + [4] * 6, 4),  # mean 3.5
        ([4] * 6 + [5] * 6, 5),  # mean 4.5
        ([1] * 6 + [2] * 6, 2),  # mean 1.5
        ([2] * 7 + [3] * 5, 2),  # 29/12, below half
        ([2] * 5 + [3] * 7, 3),  # 31/12, above half
    ],
)
def test_exact_half_rounds_toward_the_weaker(levels: list[int | None], expected: int) -> None:
    result = credit_score(card(levels))
    assert result.score == expected and result.floored is False


@pytest.mark.parametrize("factor", ["Liquidity", "Maturity profile"])
def test_floor_from_liquidity_or_maturity_at_5(factor: str) -> None:
    levels: dict[str, int | None] = dict.fromkeys(FACTORS, 3)
    levels[factor] = 5
    result = credit_score(card(levels))  # mean 53/17 = 3.1 -> 3, floored to 4
    assert (result.score, result.floored) == (4, True)
    assert factor in result.reason


def test_other_factor_at_5_does_not_floor() -> None:
    levels: dict[str, int | None] = dict.fromkeys(FACTORS, 3)
    levels["Scale"] = 5
    assert credit_score(card(levels)).score == 3


def test_floor_not_flagged_when_score_already_4_or_5() -> None:
    four: dict[str, int | None] = dict.fromkeys(FACTORS, 4)
    four["Liquidity"] = 5
    five: dict[str, int | None] = dict.fromkeys(FACTORS, 5)
    for levels, score in ((four, 4), (five, 5)):
        result = credit_score(card(levels))
        assert (result.score, result.floored) == (score, False)


def test_floor_applies_only_when_a_score_exists() -> None:
    result = credit_score(card([5] + [None] * 16))
    assert result.score is None and result.floored is False


def test_assessments_never_enter_the_score() -> None:
    levels = [3] * 9 + [2] * 6
    base = credit_score(card(levels, "Positive"))
    other = credit_score(card(levels, "Negative"))
    assert base == other and base.score == 3
    emptied = Scorecard(card(levels).factors, ())
    assert credit_score(emptied) == base


@pytest.mark.parametrize(
    "factors",
    [
        FACTORS[:16],  # missing
        (*FACTORS[:16], "Scale"),  # repeated, one missing
        (*FACTORS[:16], "Invented"),  # unknown
        (*FACTORS, "Scale"),  # 18 rows
    ],
)
def test_malformed_factor_names_raise(factors: tuple[str, ...]) -> None:
    scorecard = Scorecard(tuple(FactorScore(n, 3, "b") for n in factors), ())
    with pytest.raises(ValueError, match="factor"):
        credit_score(scorecard)


@pytest.mark.parametrize("bad", [0, 6, -1])
def test_level_outside_1_to_5_raises(bad: int) -> None:
    levels: list[int | None] = [3] * 17
    levels[4] = bad
    with pytest.raises(ValueError, match="level"):
        credit_score(card(levels))


@pytest.mark.parametrize("bad", [0, 6])
def test_proposal_rejects_values_outside_range(bad: int) -> None:
    with pytest.raises(ValueError, match="1 to 5"):
        proposal(bad, 3)
    with pytest.raises(ValueError, match="1 to 5"):
        proposal(3, bad)


def test_proposal_none_when_either_input_is_none() -> None:
    assert proposal(None, 3) is None
    assert proposal(3, None) is None
    assert proposal(None, None) is None


def test_reasons_carry_no_module_ids() -> None:
    for result in (credit_score(card([3] * 11)), credit_score(card([3] * 15))):
        for banned in ("CP-2", "T2.13", "Fraction", "scored="):
            assert banned not in result.reason


levels_strategy = st.lists(st.one_of(st.none(), st.integers(1, 5)), min_size=17, max_size=17)


@settings(max_examples=300)
@given(levels_strategy)
def test_property_score_bounds_and_rounding(levels: list[int | None]) -> None:
    result = credit_score(card(levels))
    present = [v for v in levels if v is not None]
    if len(present) < 12:
        assert result.score is None
        return
    assert result.score is not None
    total, count = sum(present), len(present)
    expected = (2 * total + count) // (2 * count)  # round half up = toward the weaker
    liquidity, maturity = (
        levels[FACTORS.index("Liquidity")],
        levels[FACTORS.index("Maturity profile")],
    )
    floor = liquidity == 5 or maturity == 5
    assert 1 <= result.score <= 5
    if not result.floored:
        assert result.score == expected
        assert min(present) <= result.score <= max(present)
    else:
        assert floor and expected < 4 and result.score == 4
    assert result.score == (max(expected, 4) if floor else expected)


@settings(max_examples=300)
@given(levels_strategy, st.integers(0, 16))
def test_property_weaker_factor_never_improves(levels: list[int | None], index: int) -> None:
    current = levels[index]
    if current is None or current == 5:
        return
    weaker = [*levels]
    weaker[index] = current + 1
    before, after = credit_score(card(levels)).score, credit_score(card(weaker)).score
    if before is not None:
        assert after is not None and after >= before


def test_property_table_is_monotone() -> None:
    for row in range(5):
        assert all(TABLE[row][c] <= TABLE[row][c + 1] for c in range(4))
    for column in range(5):
        assert all(TABLE[r][column] <= TABLE[r + 1][column] for r in range(4))


@given(st.one_of(st.none(), st.integers(1, 5)), st.one_of(st.none(), st.integers(1, 5)))
def test_property_proposal_none_iff_an_input_is_none(
    credit: int | None, valuation: int | None
) -> None:
    assert (proposal(credit, valuation) is None) == (credit is None or valuation is None)


def test_module_has_no_float() -> None:
    assert not any(isinstance(v, float) for v in vars(recommendation).values())


# --- Valuation (methodology section 5) -----------------------------------------------------------


def test_mean_display_rounds_an_exact_half_up() -> None:
    # 16 scored factors summing 34: mean 2.125, shown as 2.13 (never 2.12); the score is 2.
    result = credit_score(card([3] * 2 + [2] * 14))
    assert (result.score, result.mean) == (2, Fraction(17, 8))
    assert "mean 2.13 " in result.reason


@pytest.mark.parametrize(
    ("difference", "expected"),
    [
        ("-101", 5),
        ("-100", 5),
        ("-99.99", 4),
        ("-41", 4),
        ("-40.01", 4),
        ("-40", 3),
        ("0", 3),
        ("40", 3),
        ("40.01", 2),
        ("99.99", 2),
        ("100", 1),
        ("101", 1),
    ],
)
def test_band_edges(difference: str, expected: int) -> None:
    assert band(Decimal(difference)) == expected


@pytest.mark.parametrize("bad", ["NaN", "Infinity", "-Infinity"])
def test_band_refuses_non_finite(bad: str) -> None:
    with pytest.raises(ValueError, match="finite"):
        band(Decimal(bad))


def pos(
    borrower: str | None,
    level: str | None,
    *,
    asset: AssetType = "bond",
    bucket: str = "BB",
    measure: str = "margin",
) -> Position:
    value = None if level is None else Decimal(level)
    if asset == "bond" or measure == "margin":
        return Position(1, borrower=borrower, asset_type=asset, rating_bucket=bucket, margin=value)
    return Position(
        1, borrower=borrower, asset_type=asset, rating_bucket=bucket, discount_margin=value
    )


def book(*positions: Position) -> Portfolio:
    return Portfolio(
        "x", "Index", "hy_index", None, datetime(2026, 11, 25, tzinfo=UTC), (), positions
    )


def bonds(*levels: str, bucket: str = "BB") -> list[Position]:
    return [pos(f"Name {i}", level, bucket=bucket) for i, level in enumerate(levels)]


def bond(level: str | None = "350", price: str | None = "99") -> Instrument:
    return Instrument(
        "Issuer 2030", "bond", "BB", None if level is None else Decimal(level), _price(price)
    )


def _price(price: str | None) -> Decimal | None:
    return None if price is None else Decimal(price)


def test_five_names_give_a_hand_computed_score() -> None:
    # Levels 200, 250, 300, 350, 400: odd count, median 300; 350 - 300 = +50 -> 2.
    result = valuation(bond("350"), book(*bonds("300", "200", "400", "250", "350")))
    assert (result.score, result.median_bp, result.difference_bp) == (2, 300, 50)
    assert (result.names, result.positions, result.bucket) == (5, 5, "BB")
    assert result.measures == ("spread",)
    assert "BB" in result.reason


def test_even_count_median_is_the_exact_mean_of_the_middle_two() -> None:
    # 100, 200, 301, 401, 500, 600: middle two 301 and 401 -> 351; 351.5 would be wrong.
    result = valuation(bond("312"), book(*bonds("100", "200", "301", "401", "500", "600")))
    assert (result.median_bp, result.difference_bp, result.score) == (351, -39, 3)
    # Middle two 300 and 301 -> 300.5, exact.
    odd_half = valuation(bond("341"), book(*bonds("100", "200", "300", "301", "500", "600")))
    assert (odd_half.median_bp, odd_half.difference_bp, odd_half.score) == (
        Decimal("300.5"),
        Decimal("40.5"),
        2,
    )


def test_wider_than_the_median_scores_better_than_tighter() -> None:
    reference = book(*bonds("300", "300", "300", "300", "300"))
    wide = valuation(bond("400"), reference).score
    tight = valuation(bond("200"), reference).score
    assert (wide, tight) == (1, 5)


def test_four_names_is_blank_and_the_reason_counts_them() -> None:
    result = valuation(bond(), book(*bonds("300", "310", "320", "330")))
    assert result.score is None
    assert (result.names, result.positions, result.median_bp) == (4, 4, 315)
    assert "BB" in result.reason
    assert "4 names" in result.reason


def test_five_positions_of_one_borrower_is_one_name() -> None:
    same = [pos("Acme Corp.", level) for level in ("300", "310", "320", "330", "340")]
    result = valuation(bond(), book(*same))
    assert (result.score, result.names, result.positions) == (None, 1, 5)
    assert "1 name" in result.reason


def test_names_compare_without_case_spaces_or_punctuation() -> None:
    spelled = [pos(name, "300") for name in ("Acme Corp.", "ACME  CORP", "acme-corp", "Beta", "Cy")]
    assert valuation(bond(), book(*spelled)).names == 3


def test_a_position_with_a_level_and_no_borrower_counts_in_the_median_not_the_names() -> None:
    reference = book(*bonds("300", "300", "300", "300"), pos(None, "300"))
    result = valuation(bond(), reference)
    assert (result.names, result.positions, result.score) == (4, 5, None)


def test_positions_without_a_level_are_left_out_not_read_as_zero() -> None:
    # Levels 340..380 (median 360), three positions with no level. Left out: 450 - 360 = +90 -> 2.
    # Read as zeros the median would be 345 and 450 would be +105 -> 1.
    levels = bonds("340", "350", "360", "370", "380")
    missing = [pos(f"Gap {i}", None) for i in range(3)]
    result = valuation(bond("450"), book(*levels, *missing))
    assert (result.median_bp, result.difference_bp, result.score) == (360, 90, 2)
    assert (result.names, result.positions) == (5, 5)


def test_a_level_of_zero_is_a_level() -> None:
    # Five names at 0 (median 0): a level of 0 counts, so the bucket scores; 0 - 0 = 0 -> 3.
    result = valuation(bond("0"), book(*bonds("0", "0", "0", "0", "0")))
    assert (result.score, result.names, result.positions, result.median_bp) == (3, 5, 5, 0)


def test_no_level_and_no_price_are_blank_for_different_reasons() -> None:
    reference = book(*bonds("300", "310", "320", "330", "340"))
    no_level = valuation(bond(level=None), reference)
    no_price = valuation(bond(price=None), reference)
    assert no_level.score is None and no_price.score is None
    assert "level" in no_level.reason and "price" not in no_level.reason
    assert "price" in no_price.reason and "level" not in no_price.reason
    assert no_level.median_bp == 320 and no_price.names == 5  # the bucket was still read
    assert no_level.difference_bp is None


def test_a_loan_bucket_mixing_measures_says_so() -> None:
    loans = [
        pos("A", "500", asset="loan", measure="discount_margin"),
        pos("B", "510", asset="loan", measure="discount_margin"),
        pos("C", "520", asset="loan", measure="discount_margin"),
        pos("D", "530", asset="loan", measure="margin"),
        pos("E", "540", asset="loan", measure="margin"),
    ]
    loan = Instrument("Term loan", "loan", "BB", Decimal(600), Decimal(98))
    result = valuation(loan, book(*loans))
    assert result.measures == ("discount_margin", "margin")
    assert (result.median_bp, result.score) == (520, 2)
    assert "mixes" in result.reason
    assert "mixes" not in valuation(bond(), book(*bonds("1", "2", "3", "4", "5"))).reason


def test_other_asset_types_and_buckets_do_not_move_the_median() -> None:
    reference = book(
        *bonds("300", "300", "300", "300", "300"),
        *bonds("900", "900", "900", bucket="B"),
        pos("Loan A", "1", asset="loan", measure="discount_margin"),
        pos("Loan B", "1", asset="loan", measure="margin"),
    )
    result = valuation(bond("350"), reference)
    assert (result.median_bp, result.names, result.score) == (300, 5, 2)


def test_non_finite_level_and_unknown_bucket_raise() -> None:
    reference = book(*bonds("1", "2", "3", "4", "5"))
    with pytest.raises(ValueError, match="finite"):
        valuation(bond("NaN"), reference)
    with pytest.raises(ValueError, match="rating bucket"):
        valuation(Instrument("x", "bond", "Purple", Decimal(1), Decimal(1)), reference)


def test_valuation_reason_carries_no_module_ids() -> None:
    reference = book(*bonds("300", "310", "320", "330"))
    for result in (valuation(bond(), reference), valuation(bond(level=None), reference)):
        for banned in ("CP-2", "T2.13", "discount_margin", "rating_bucket", "None"):
            assert banned not in result.reason


def _valued(score: int | None) -> Valuation:
    return Valuation(score, None, None, "BB", 5, 5, (), "r")


def test_best_is_the_lowest_score_first_on_a_tie_and_skips_blanks() -> None:
    assert best([_valued(None), _valued(3), _valued(2), _valued(2), _valued(4)]) == 2
    assert best([_valued(5)]) == 0


def test_best_is_none_when_every_valuation_is_blank() -> None:
    assert best([_valued(None), _valued(None)]) is None
    assert best([]) is None


decimals = st.fractions(min_value=-2000, max_value=2000, max_denominator=100).map(
    lambda f: Decimal(f.numerator) / f.denominator
)


@settings(max_examples=300)
@given(decimals, decimals)
def test_property_band_is_monotone_non_increasing(a: Decimal, b: Decimal) -> None:
    low, high = sorted((a, b))
    assert band(low) >= band(high)


@settings(max_examples=300)
@given(decimals)
def test_property_band_is_symmetric_and_three_only_within_forty(d: Decimal) -> None:
    assert band(d) + band(-d) == 6
    assert (band(d) == 3) == (-40 <= d <= 40)


@settings(max_examples=200)
@given(
    st.lists(st.integers(-1000, 1000), min_size=5, max_size=9),
    st.integers(-1000, 1000),
    st.integers(-5000, 5000),
)
def test_property_shifting_every_level_leaves_the_score_unchanged(
    levels: list[int], own: int, shift: int
) -> None:
    def score(delta: int) -> int | None:
        members = [pos(f"N{i}", str(v + delta)) for i, v in enumerate(levels)]
        return valuation(bond(str(own + delta)), book(*members)).score

    assert score(0) == score(shift)


# --- Eligibility, limits and the readings (methodology section 7; the four rulings) --------------

AT = datetime(2026, 11, 25, tzinfo=UTC)
CCC_ROW = ("Rating", "Max CCC+ and below", "≤ 7.5% NAV", "-12.50%", "Breach")
LEVEL_FOR_VALUATION = {1: "400", 2: "350", 3: "300", 4: "250", 5: "200"}  # against a median of 300


def limit_row(
    category: str, parameter: str, limit: str, headroom: str = "", status: str = ""
) -> Limit:
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


def reference(
    kind: Kind, *limits: Limit, bucket: str = "BB", names: int = 5, extra: tuple[Position, ...] = ()
) -> Portfolio:
    asset: AssetType = "bond" if kind == "hy_index" else "loan"
    members = tuple(pos(f"Name {i}", "300", asset=asset, bucket=bucket) for i in range(names))
    return Portfolio("p", "Portfolio", kind, None, AT, (), members + extra, limits)


def credit(score: int) -> CreditScore:
    return credit_score(card([score] * 17))


def issuer(
    valuation_score: int, *, bucket: str = "BB", asset: AssetType = "bond", price: str | None = "99"
) -> Instrument:
    return Instrument(
        "Issuer 2030", asset, bucket, Decimal(LEVEL_FOR_VALUATION[valuation_score]), _price(price)
    )


@pytest.mark.parametrize(
    ("kind", "declared", "expected"),
    [
        ("clo", None, ("loan",)),
        ("loan_index", None, ("loan",)),
        ("hy_index", None, ("bond",)),
        ("custom", "loan", ("loan",)),
        ("custom", "bond", ("bond",)),
        ("custom", None, ("loan", "bond")),
    ],
)
def test_eligibility_is_by_asset_type_alone(
    kind: Kind, declared: AssetType | None, expected: tuple[str, ...]
) -> None:
    assert eligible_types(reference(kind), declared) == expected


@pytest.mark.parametrize(
    ("kind", "asset", "holds"),
    [("clo", "bond", "loans"), ("loan_index", "bond", "loans"), ("hy_index", "loan", "bonds")],
)
def test_no_eligible_instrument_is_n_a_not_blank(kind: Kind, asset: AssetType, holds: str) -> None:
    result = portfolio_reading(credit(2), [issuer(2, asset=asset)], reference(kind))
    assert (result.status, result.recommendation, result.uncapped) == ("n/a", None, None)
    assert (result.instrument, result.valuation) == (None, None)
    assert holds in result.reason


@pytest.mark.parametrize(
    ("score", "valuation_score", "cell", "expected", "capped"),
    [
        (1, 1, 1, 3, True),
        (1, 2, 2, 3, True),
        (3, 3, 3, 3, False),
        (3, 4, 4, 4, False),
        (5, 5, 5, 5, False),
    ],
)
def test_a_breached_limit_holds_a_1_or_2_to_3_and_leaves_3_4_5(
    score: int, valuation_score: int, cell: int, expected: int, capped: bool
) -> None:
    book_ = reference("clo", limit_row(*CCC_ROW), bucket="CCC")
    result = portfolio_reading(
        credit(score), [issuer(valuation_score, bucket="CCC", asset="loan")], book_
    )
    assert (result.status, result.uncapped, result.recommendation) == ("proposed", cell, expected)
    assert len(result.capped_by) == (1 if capped else 0)
    assert len(result.limits) == 1 and result.limits[0].outcome == "breached"
    assert ("Max CCC+ and below" in result.reason) == capped


@pytest.mark.parametrize(
    ("headroom", "status", "outcome"),
    [
        ("0.00%", "", "breached"),
        ("-12.50%", "", "breached"),
        ("", "Breach", "breached"),
        ("0.40%", "Breach", "breached"),
        ("0.40%", "Pass", "within"),
        ("0.40%", "", "within"),
        ("", "Pass", "within"),
        ("", "", "not_read"),
        ("—", "Info", "not_read"),
    ],
)
def test_breach_decision_each_alone(headroom: str, status: str, outcome: str) -> None:
    row = limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", headroom, status)
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket="CCC", price=None)
    assert reading.outcome == outcome
    assert reading.limit is row
    assert "Max CCC+ and below" in reading.reason and "≤ 7.5% NAV" in reading.reason


def test_a_ccc_limit_does_not_apply_to_an_instrument_rated_b() -> None:
    book_ = reference("clo", limit_row(*CCC_ROW), bucket="B")
    result = portfolio_reading(credit(1), [issuer(1, bucket="B", asset="loan")], book_)
    assert result.limits[0].outcome == "does_not_apply"
    assert (result.uncapped, result.recommendation, result.capped_by) == (1, 1, ())


@pytest.mark.parametrize(
    ("parameter", "sector", "outcome"),
    [
        ("Max Software exposure", "Software", "breached"),
        ("Max software exposure", "Software", "breached"),
        ("Max Healthcare exposure", "Software", "does_not_apply"),
        ("Max single industry", "Software", "not_read"),
        ("Max Software exposure", None, "not_read"),
    ],
)
def test_a_sector_limit_is_tied_by_the_sector_it_names(
    parameter: str, sector: str | None, outcome: str
) -> None:
    row = limit_row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=sector, rating_bucket="BB", price=None)
    assert reading.outcome == outcome


def test_a_breached_sector_limit_caps_and_an_unreadable_one_does_not() -> None:
    breached = limit_row("Sector", "Max Software exposure", "≤ 15% NAV", "-1.00%")
    vague = limit_row("Sector", "Max single industry", "≤ 15% NAV", "-1.00%")
    capped = portfolio_reading(
        credit(1),
        [issuer(1, asset="loan")],
        reference("clo", breached),
        issuer=Issuer(sector="Software"),
    )
    assert (capped.uncapped, capped.recommendation) == (1, 3)
    free = portfolio_reading(
        credit(1),
        [issuer(1, asset="loan")],
        reference("clo", vague),
        issuer=Issuer(sector="Software"),
    )
    assert (free.recommendation, free.limits[0].outcome) == (1, "not_read")


@pytest.mark.parametrize(
    ("price", "outcome"),
    [("89.99", "breached"), ("90", "within"), ("95", "within"), (None, "not_read")],
)
def test_the_price_floor_compares_the_price_with_the_floor(price: str | None, outcome: str) -> None:
    row = limit_row(
        "Price", "Minimum price", "≥ 90", "0.00%", "Breach"
    )  # its columns do not decide
    [reading] = read_limits(
        reference("clo", row), sector=None, rating_bucket="BB", price=_price(price)
    )
    assert reading.outcome == outcome


def test_a_price_floor_with_no_figure_is_not_read() -> None:
    row = limit_row("Price", "Minimum price", "see agreement")
    [reading] = read_limits(
        reference("clo", row), sector=None, rating_bucket="BB", price=Decimal(50)
    )
    assert reading.outcome == "not_read"


def test_a_breached_price_floor_caps_on_the_best_instrument_price() -> None:
    row = limit_row("Price", "Minimum price", "≥ 90")
    result = portfolio_reading(
        credit(1), [issuer(1, asset="loan", price="80")], reference("clo", row)
    )
    assert (result.uncapped, result.recommendation) == (1, 3)


@pytest.mark.parametrize(
    "row",
    [
        limit_row("Single Name", "Max single issuer exposure", "≤ 2.5% NAV", "-1.00%", "Breach"),
        limit_row("Spread", "Weighted average spread", "Info only", "-1.00%", "Breach"),
        limit_row("Rating", "Max CCC+ and below", "Info only", "-1.00%", "Breach"),
        limit_row("Liquidity", "Min cash", "≥ 1% NAV", "-1.00%", "Breach"),
    ],
)
def test_single_name_info_and_other_rows_do_not_apply(row: Limit) -> None:
    [reading] = read_limits(
        reference("clo", row), sector="Software", rating_bucket="CCC", price=Decimal(1)
    )
    assert reading.outcome == "does_not_apply"


@pytest.mark.parametrize(
    ("bucket", "outcomes"),
    [
        ("CCC", ("does_not_apply", "breached", "does_not_apply")),
        ("BB", ("does_not_apply", "does_not_apply", "does_not_apply")),
        (None, ("does_not_apply", "not_read", "does_not_apply")),
    ],
)
def test_the_synthetic_pack_gives_one_outcome_per_row_in_order(
    bucket: str | None, outcomes: tuple[str, ...]
) -> None:
    found = read_clo_pack(synth.pack_files(), stored_at=AT)
    readings = read_limits(found, sector="Software", rating_bucket=bucket, price=Decimal(99))
    assert len(readings) == len(limits(found)) == 3
    assert tuple(r.outcome for r in readings) == outcomes
    assert [r.limit for r in readings] == list(limits(found))


def test_the_weight_comes_from_the_issuers_matched_positions() -> None:
    held = tuple(
        Position(i, borrower=name, asset_type="loan", weight=Decimal(w))
        for i, (name, w) in enumerate((("Aster Co", "60"), ("Birch Co", "40")), 1)
    )
    book_ = reference("clo", names=0, extra=held)
    named = portfolio_reading(
        credit(3), [issuer(3, asset="loan")], book_, Issuer(borrower="Aster Co")
    )
    assert named.weight == Weight(Decimal(60), "stated_weight", 1, 0, ("name",))
    assert portfolio_reading(credit(3), [issuer(3, asset="loan")], book_).weight is None


def test_blank_when_no_credit_score_or_no_valuation_and_the_limits_are_still_read() -> None:
    row = limit_row(*CCC_ROW)
    no_credit = portfolio_reading(
        credit_score(card([3] * 11)),
        [issuer(3, bucket="CCC", asset="loan")],
        reference("clo", row, bucket="CCC"),
    )
    assert (no_credit.status, no_credit.recommendation, no_credit.uncapped) == ("blank", None, None)
    assert "No Credit Score" in no_credit.reason and len(no_credit.limits) == 1
    thin = portfolio_reading(credit(3), [issuer(3, asset="loan")], reference("clo", names=4))
    assert (thin.status, thin.recommendation, thin.valuation, thin.instrument) == (
        "blank",
        None,
        None,
        None,
    )
    assert "No Valuation" in thin.reason and "4 names" in thin.reason


def test_the_best_eligible_instrument_decides_and_its_bucket_is_the_one_limits_read_on() -> None:
    both = [issuer(4, asset="loan"), Instrument("Second", "loan", "BB", Decimal(350), Decimal(99))]
    result = portfolio_reading(credit(2), both, reference("clo"))
    assert (result.instrument, result.valuation) == (both[1], valuation(both[1], reference("clo")))
    assert (result.uncapped, result.recommendation) == (2, 2)


def test_per_instrument_proposal_uses_the_index_for_its_type_and_no_cap() -> None:
    breached = limit_row(*CCC_ROW)
    loans = reference("loan_index", breached, bucket="CCC")
    bonds_ = reference("hy_index", bucket="BB")
    loan = issuer(1, bucket="CCC", asset="loan")
    result = instrument_proposal(credit(1), loan, loan_index=loans, hy_index=bonds_)
    assert (result.recommendation, result.valuation) == (1, valuation(loan, loans))
    assert (
        instrument_proposal(credit(2), issuer(3), loan_index=loans, hy_index=bonds_).recommendation
        == 3
    )


@pytest.mark.parametrize("case", ["no credit", "no index", "no valuation"])
def test_per_instrument_proposal_is_blank_with_a_reason(case: str) -> None:
    held = reference("hy_index", names=4 if case == "no valuation" else 5)
    score = credit_score(card([3] * 11)) if case == "no credit" else credit(3)
    index = None if case == "no index" else held
    result = instrument_proposal(score, issuer(3), loan_index=None, hy_index=index)
    assert (result.recommendation, result.status) == (None, "blank")
    assert {"no credit": "Credit Score", "no index": "high-yield", "no valuation": "Valuation"}[
        case
    ] in result.reason


def test_readings_carry_no_module_ids_or_field_names() -> None:
    held = reference("clo", limit_row(*CCC_ROW), limit_row("Price", "Minimum price", "≥ 90"))
    texts = [credit_score(card({"Liquidity": 5, **{n: 1 for n in FACTORS[:14]}})).reason]
    for score, kind in (
        (credit(1), "clo"),
        (credit(3), "hy_index"),
        (credit_score(card([])), "clo"),
    ):
        result = portfolio_reading(score, [issuer(1, bucket="CCC", asset="loan")], held)
        texts += [result.reason, *(r.reason for r in result.limits)]
        texts.append(portfolio_reading(score, [issuer(1, asset="bond")], reference(kind)).reason)
    texts.append(instrument_proposal(credit(1), issuer(1), loan_index=None, hy_index=None).reason)
    for text in texts:
        assert not any(b in text for b in ("CP-", "T2.", "_", "None", "Instrument(", "Fraction"))


@settings(max_examples=300)
@given(
    st.integers(1, 5),
    st.integers(1, 5),
    st.sampled_from(["-12.50%", "0.00%", "0.40%", ""]),
    st.sampled_from(["Breach", "Pass", ""]),
)
def test_property_the_cap_never_improves_and_holds_a_1_or_2_to_3(
    score: int, valuation_score: int, headroom: str, status: str
) -> None:
    row = limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", headroom, status)
    result = portfolio_reading(
        credit(score),
        [issuer(valuation_score, bucket="CCC", asset="loan")],
        reference("clo", row, bucket="CCC"),
    )
    cell = proposal(score, valuation_score)
    breached = any(r.outcome == "breached" for r in result.limits)
    assert result.uncapped == cell and result.recommendation is not None and cell is not None
    assert result.recommendation >= cell
    assert result.recommendation == (max(cell, 3) if breached else cell)
    assert bool(result.capped_by) == (breached and cell < 3)
