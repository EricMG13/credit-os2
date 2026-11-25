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
        ("Max Healthcare exposure", "Software", "not_read"),
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
    ],
)
def test_single_name_and_info_rows_do_not_apply(row: Limit) -> None:
    [reading] = read_limits(
        reference("clo", row), sector="Software", rating_bucket="CCC", price=Decimal(1)
    )
    assert reading.outcome == "does_not_apply"


def test_a_breached_row_of_another_kind_is_not_read() -> None:
    row = limit_row("Liquidity", "Min cash", "≥ 1% NAV", "-1.00%", "Breach")
    [reading] = read_limits(
        reference("clo", row), sector="Software", rating_bucket="CCC", price=Decimal(1)
    )
    assert reading.outcome == "not_read"


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
    # First: BB, level 250 against a BB median of 300 -> Valuation 4, price 99 (above the floor).
    # Second: CCC, level 400 against a CCC median of 300 -> Valuation 1, price 80 (below the floor).
    first = Instrument("First", "loan", "BB", Decimal(250), Decimal(99))
    second = Instrument("Second", "loan", "CCC", Decimal(400), Decimal(80))
    held = tuple(pos(f"Ccc {i}", "300", asset="loan", bucket="CCC") for i in range(5))
    book_ = reference(
        "clo", limit_row(*CCC_ROW), limit_row("Price", "Minimum price", "≥ 90"), extra=held
    )
    result = portfolio_reading(credit(1), [first, second], book_)
    assert result.instrument is second
    assert result.valuation is not None
    assert (
        result.valuation.score,
        result.valuation.difference_bp,
        result.valuation.median_bp,
        result.valuation.bucket,
    ) == (1, Decimal(100), Decimal(300), "CCC")
    # Read on First (BB, price 99) neither limit would be breached and the cell would stay 1.
    assert [r.outcome for r in result.limits] == ["breached", "breached"]
    assert (result.uncapped, result.recommendation, len(result.capped_by)) == (1, 3, 2)


def test_per_instrument_proposal_uses_the_index_for_its_type_and_no_cap() -> None:
    breached = limit_row(*CCC_ROW)
    loans = reference("loan_index", breached, bucket="CCC")
    bonds_ = reference("hy_index", bucket="BB")
    loan = issuer(1, bucket="CCC", asset="loan")
    result = instrument_proposal(credit(1), loan, loan_index=loans, hy_index=bonds_)
    assert result.recommendation == 1 and result.valuation is not None
    assert (
        result.valuation.score,
        result.valuation.difference_bp,
        result.valuation.median_bp,
        result.valuation.bucket,
    ) == (1, Decimal(100), Decimal(300), "CCC")
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
    floored = credit_score(card({**{n: 1 for n in FACTORS[:14]}, "Liquidity": 5}))
    assert floored.floored is True and floored.score == 4
    texts = [floored.reason]
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


# --- Fix round 1: how a limit row is read ---------------------------------------------------------


def _one(
    row: Limit,
    *,
    sector: str | None = None,
    rating_bucket: str | None = "BB",
    price: Decimal | None = None,
) -> str:
    [reading] = read_limits(
        reference("clo", row), sector=sector, rating_bucket=rating_bucket, price=price
    )
    return reading.outcome


@pytest.mark.parametrize(
    ("parameter", "sector", "outcome"),
    [
        ("2nd largest sector: Healthcare", "Healthcare", "breached"),
        ("3rd largest sector: Chemicals", "Chemicals", "breached"),
        ("3rd largest sector: Chemicals", "Healthcare", "not_read"),
        ("Max Software & Services exposure", "Software and Services", "breached"),
        ("Max Software and Services exposure", "Software & Services", "breached"),
        ("Max HEALTHCARE, exposure.", "healthcare", "breached"),
        ("Max single sector (largest: Software)", "Healthcare", "not_read"),
        ("Max Healthcare exposure", "Health", "not_read"),
        ("Excluded sectors (Tobacco, Weapons)", "Healthcare", "not_read"),
    ],
)
def test_a_sector_row_applies_when_it_names_the_issuers_sector_as_whole_words(
    parameter: str, sector: str, outcome: str
) -> None:
    row = limit_row("Sector", parameter, "≤ 15% NAV", "-0.50%", "Breach")
    assert _one(row, sector=sector) == outcome


@pytest.mark.parametrize("sector", [None, "", "   "])
def test_an_unknown_or_blank_sector_reads_no_sector_row(sector: str | None) -> None:
    row = limit_row("Sector", "Excluded sectors (Tobacco, Weapons)", "0% NAV", "0.00%", "Pass")
    [reading] = read_limits(reference("clo", row), sector=sector, rating_bucket="BB", price=None)
    assert reading.outcome == "not_read" and "sector is not known" in reading.reason
    result = portfolio_reading(
        credit(1), [issuer(1, asset="loan")], reference("clo", row), Issuer(sector=sector)
    )
    assert (result.uncapped, result.recommendation, result.capped_by) == (1, 1, ())


def test_a_breached_ordinal_sector_row_caps_a_healthcare_issuer_to_mw() -> None:
    row = limit_row("Sector", "2nd largest sector: Healthcare", "≤ 15% NAV", "-0.50%", "Breach")
    result = portfolio_reading(
        credit(1), [issuer(1, asset="loan")], reference("clo", row), Issuer(sector="Healthcare")
    )
    assert (result.uncapped, result.recommendation) == (1, 3)
    assert result.capped_by[0].limit is row


@pytest.mark.parametrize(
    ("headroom", "status", "outcome"),
    [
        ("0.40%", "No breach", "within"),
        ("", "No Breach", "within"),
        ("", "  no   breach ", "within"),
        ("", "Fail", "breached"),
        ("0.40%", "Fail", "breached"),
        ("", "Failed", "breached"),
        ("", "Non-compliant", "breached"),
        ("", "Not compliant", "breached"),
        ("", "In breach", "breached"),
        ("", "Breached", "breached"),
        ("", "In compliance", "within"),
        ("", "Compliant", "within"),
        ("", "OK", "within"),
        ("", "Within limit", "within"),
        ("", "Passed", "within"),
        ("0.00%", "Pass", "breached"),
        ("(0.50%)", "", "breached"),
        ("(0.50%)", "Pass", "breached"),
        ("−0.50%", "", "breached"),
        ("0.40%", "Review", "within"),
        ("", "Review", "not_read"),
        ("", "Not a breach today", "not_read"),
        ("(0.50%) x", "", "not_read"),
    ],
)
def test_status_is_matched_whole_against_closed_sets_and_headroom_reads_signs(
    headroom: str, status: str, outcome: str
) -> None:
    row = limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", headroom, status)
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket="CCC", price=None)
    assert reading.outcome == outcome
    if outcome == "not_read":
        assert "not recognised" in reading.reason


def test_a_no_breach_row_does_not_cap() -> None:
    row = limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", "2.40%", "No breach")
    result = portfolio_reading(
        credit(1),
        [issuer(1, bucket="CCC", asset="loan")],
        reference("clo", row, bucket="CCC"),
    )
    assert (result.recommendation, result.capped_by) == (1, ())


@pytest.mark.parametrize(
    ("cells", "price", "outcome"),  # cells: parameter, limit, headroom, status
    [
        (("Maximum purchase price", "≤ 101", "", ""), "95", "not_read"),
        (("Max assets priced below 80", "≤ 7.5% NAV", "-0.50%", "Breach"), "75", "not_read"),
        (("Min weighted average price", "≥ 95.0", "1.20", "Pass"), "92", "not_read"),
        (("Minimum average price", "≥ 95.0", "", ""), "92", "not_read"),
        (("Minimum price", "≥ 90%", "", ""), "80", "not_read"),
        (("Minimum price", "≤ 90", "", ""), "80", "not_read"),
        (("Minimum price", "see agreement", "", ""), "80", "not_read"),
        (("Minimum price", "≥ 90", "", ""), None, "not_read"),
        (("Minimum price", "≥ 90", "", ""), "89.99", "breached"),
        (("Min price", "> 90", "", ""), "90", "within"),
        (("Price floor", "90", "", ""), "89", "breached"),
        (("Price floor", "90", "", ""), "90", "within"),
    ],
)
def test_only_a_minimum_price_on_one_instrument_is_a_floor(
    cells: tuple[str, str, str, str], price: str | None, outcome: str
) -> None:
    row = limit_row("Price", *cells)
    assert _one(row, price=_price(price)) == outcome


def test_a_row_that_is_not_a_floor_says_so_and_does_not_cap() -> None:
    row = limit_row("Price", "Maximum purchase price", "≤ 101")
    result = portfolio_reading(
        credit(1), [issuer(1, asset="loan", price="95")], reference("clo", row)
    )
    assert (result.uncapped, result.recommendation) == (1, 1)
    assert "not a price floor on a single instrument" in result.limits[0].reason


@pytest.mark.parametrize(
    ("category", "parameter", "bucket", "outcome"),
    [
        ("Rating", "Max CCC and unrated", "CCC", "breached"),
        ("Rating", "Max CCC and unrated", "Unrated", "breached"),
        ("Rating", "Max CCC and unrated", "B", "does_not_apply"),
        ("Rating", "Max Caa and NR", "CCC", "breached"),
        ("Rating", "Max B3 and below", "CCC", "breached"),
        ("Rating", "Max B3 and below", "B", "breached"),
        ("Rating", "Max B3 and below", "BB", "does_not_apply"),
        ("Rating", "Max B and CCC", "B", "breached"),
        ("Rating", "Max Caa1 and below", "CCC", "breached"),
        ("Rating", "Max CCC+ and below", "CCC", "breached"),
        ("Rating", "Max CCC+ and below", "B", "does_not_apply"),
        ("Rating", "Max sub-investment grade", "BB", "breached"),
        ("Rating", "Max sub-investment grade", "CCC", "breached"),
        ("Rating", "Max sub-investment grade", "IG", "does_not_apply"),
        ("Rating", "Max sub-investment grade", "Unrated", "not_read"),
        ("Rating", "Max non-IG exposure", "IG", "does_not_apply"),
        ("Rating", "Max non-IG exposure", "B", "breached"),
        ("Rating", "Min BB or better", "BB", "not_read"),
        ("Rating", "Min BB or better", "IG", "not_read"),
        ("Rating", "Min BB or better", "B", "not_read"),
        ("Rating", "Rating limit", "B", "not_read"),
        ("Collateral quality", "Max Caa obligations", "CCC", "breached"),
        ("Rating", "Max Caa1 and below", "B", "does_not_apply"),
        ("Rating", "Max B-rated", "B", "breached"),
        ("Rating", "Max investment grade", "IG", "breached"),
        ("Rating", "Max sub investment grade", "IG", "does_not_apply"),
        ("Rating", "Max non-investment grade", "BB", "breached"),
        ("Rating", "Max below investment grade", "CCC", "breached"),
        ("Rating", "Max high yield", "BB", "breached"),
        ("Rating", "Max speculative", "B", "breached"),
        ("Rating", "Max rated obligations", "BB", "not_read"),
        ("Rating", "Max CCC & below", "CCC", "breached"),
        ("Rating", "Max CCC & below", "B", "does_not_apply"),
        ("Rating", "Max B3 & below", "CCC", "breached"),
        ("Rating", "Max B3 & below", "B", "breached"),
        ("Rating", "Max B3 & below", "BB", "does_not_apply"),
        ("Rating", "Max CCC+ & lower", "CCC", "breached"),
    ],
)
def test_a_rating_row_covers_every_bucket_it_names_or_implies(
    category: str, parameter: str, bucket: str, outcome: str
) -> None:
    row = limit_row(category, parameter, "≤ 7.5% NAV", "-1.00%", "Breach")
    assert _one(row, rating_bucket=bucket) == outcome


def test_a_breached_group_row_caps_a_bb_instrument_to_3_and_is_named() -> None:
    row = limit_row("Rating", "Max sub-investment grade", "≤ 7.5% NAV", "-1.00%", "Breach")
    result = portfolio_reading(
        credit(1), [issuer(1, bucket="BB", asset="loan")], reference("clo", row)
    )
    assert result.recommendation == 3
    assert "Max sub-investment grade" in result.reason


def test_a_custom_portfolio_with_no_declared_asset_type_still_has_a_bucket() -> None:
    members = tuple(
        Position(i, borrower=f"Name {i}", rating_bucket="BB", margin=Decimal(300 + 10 * i))
        for i in range(6)
    )
    held = Portfolio("mine", "My book", "custom", None, AT, (), members, ())
    bond = Instrument("Bond 2031", "bond", "BB", Decimal(425), Decimal(99))
    result = portfolio_reading(credit(2), [bond], held, Issuer(declared=None))
    assert result.valuation is not None
    assert (result.status, result.recommendation) == ("proposed", 2)
    assert (result.valuation.score, result.valuation.median_bp, result.valuation.names) == (
        1,
        Decimal(325),
        6,
    )


def test_a_stated_asset_type_in_the_bucket_still_has_to_match() -> None:
    stated = tuple(pos(f"Loan {i}", "500", asset="loan") for i in range(5))
    unstated = tuple(
        Position(i, borrower=f"Name {i}", rating_bucket="BB", margin=Decimal(300)) for i in range(5)
    )
    held = Portfolio("mine", "My book", "custom", None, AT, (), stated + unstated, ())
    bond = Instrument("Bond 2031", "bond", "BB", Decimal(400), Decimal(99))
    result = valuation(bond, held)
    assert (result.median_bp, result.positions, result.names) == (Decimal(300), 5, 5)


@pytest.mark.parametrize(
    "row",
    [
        limit_row("Sector", "Max single issuer in Healthcare", "≤ 2.5% NAV", "-1.00%", "Breach"),
        limit_row("Rating", "Max single obligor rated CCC", "≤ 2.5% NAV", "-1.00%", "Breach"),
        limit_row("Sector", "Largest issuer sector Healthcare", "≤ 2.5% NAV", "-1.00%", "Breach"),
    ],
)
def test_a_single_name_row_carrying_a_sector_or_rating_word_still_does_not_apply(
    row: Limit,
) -> None:
    assert _one(row, sector="Healthcare", rating_bucket="CCC") == "does_not_apply"


def test_zero_headroom_beside_a_pass_caps() -> None:
    row = limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", "0.00%", "Pass")
    result = portfolio_reading(
        credit(1), [issuer(1, bucket="CCC", asset="loan")], reference("clo", row, bucket="CCC")
    )
    assert (result.uncapped, result.recommendation) == (1, 3)


def test_the_identifier_alone_matches_the_weight() -> None:
    held = (
        Position(1, borrower="Aster Co", asset_type="loan", weight=Decimal(60), ticker="AST"),
        Position(2, borrower="Birch Co", asset_type="loan", weight=Decimal(40)),
    )
    book_ = reference("clo", names=0, extra=held)
    result = portfolio_reading(
        credit(3), [issuer(3, asset="loan")], book_, Issuer(identifier="ast")
    )
    assert result.weight == Weight(Decimal(60), "stated_weight", 1, 0, ("identifier",))


@pytest.mark.parametrize("bad", ["NaN", "Infinity", "-Infinity"])
def test_a_non_finite_price_raises_value_error(bad: str) -> None:
    loan = Instrument("TL", "loan", "BB", Decimal(400), Decimal(bad))
    with pytest.raises(ValueError, match="finite"):
        valuation(loan, reference("clo"))


@pytest.mark.parametrize("borrower", ["", "   ", " - . "])
def test_a_borrower_of_only_spaces_with_no_identifier_is_not_given(borrower: str) -> None:
    result = portfolio_reading(
        credit(3), [issuer(3, asset="loan")], reference("clo"), Issuer(borrower=borrower)
    )
    assert result.weight is None


# --- Fix round 3: every word of a limit row is read, or the row is not read -----------------------

_NAV = "≤ 7.5% NAV"
_CCC_LIST = "Max CCC+ and below (incl. Unrated & Other)"
_TOBACCO = "Excluded sectors (Tobacco, Weapons)"


@pytest.mark.parametrize(
    ("category", "parameter", "limit", "issuer", "outcome"),
    [
        ("Rating", "Max sub-IG", _NAV, (None, "BB", None), "breached"),
        ("Rating", "Max sub-IG", _NAV, (None, "IG", None), "does_not_apply"),
        ("Rating", "Max sub-IG", _NAV, (None, "Unrated", None), "not_read"),
        ("Rating", "Max below IG", _NAV, (None, "B", None), "breached"),
        ("Rating", "Max obligations rated below B3", _NAV, (None, "CCC", None), "breached"),
        ("Rating", "Max obligations rated below B3", _NAV, (None, "B", None), "does_not_apply"),
        ("Rating", "Max not rated", _NAV, (None, "Unrated", None), "breached"),
        ("Rating", "Max not rated", _NAV, (None, "B", None), "does_not_apply"),
        ("Rating", "Max HY", _NAV, (None, "BB", None), "breached"),
        ("Rating", "Min average rating B2", _NAV, (None, "B", None), "not_read"),
        ("Rating", "Max obligations rated other than CCC", _NAV, (None, "CCC", None), "not_read"),
        ("Rating", "Max CCC excluding unrated", _NAV, (None, "Unrated", None), "not_read"),
        ("Rating", "Max 10 CCC", _NAV, (None, "CCC", None), "not_read"),
        ("Rating", _CCC_LIST, "≤ 12.5% NAV", (None, "CCC", None), "breached"),
        ("Rating", _CCC_LIST, "≤ 12.5% NAV", (None, "Unrated", None), "breached"),
        ("Rating", _CCC_LIST, "≤ 12.5% NAV", (None, "B", None), "does_not_apply"),
        (
            "Sector",
            "Max single sector other than Healthcare",
            _NAV,
            ("Healthcare", "BB", None),
            "not_read",
        ),
        (
            "Sector",
            "Max sector exposure excluding Healthcare",
            _NAV,
            ("Healthcare", "BB", None),
            "not_read",
        ),
        (
            "Sector",
            "Max single industry (other than Healthcare)",
            _NAV,
            ("Healthcare", "BB", None),
            "not_read",
        ),
        ("Exclusions", _TOBACCO, "0% NAV", ("Tobacco", "BB", None), "breached"),
        ("Exclusions", _TOBACCO, "0% NAV", ("Weapons", "BB", None), "breached"),
        ("Exclusions", _TOBACCO, "0% NAV", ("Healthcare", "BB", None), "not_read"),
        ("Concentration", "Max Healthcare exposure", _NAV, ("Healthcare", "BB", None), "breached"),
        (
            "Concentration",
            "Max Healthcare exposure",
            _NAV,
            ("Software", "BB", None),
            "not_read",
        ),
        ("Collateral quality", "Max B3 obligations", _NAV, (None, "B", None), "breached"),
        ("Collateral quality", "Max Ba3 and below", _NAV, (None, "IG", None), "does_not_apply"),
        (
            "Concentration",
            "Aggregate top 10 issuers",
            _NAV,
            ("Healthcare", "B", None),
            "not_read",
        ),
        ("Price", "Min price (CCC obligations)", "≥ 80", (None, "BB", Decimal(75)), "not_read"),
        (
            "Price",
            "Minimum price for second lien loans",
            "≥ 80",
            (None, "BB", Decimal(75)),
            "not_read",
        ),
        ("Price", "Minimum purchase price", "≥ 80", (None, "BB", Decimal(75)), "breached"),
    ],
)
def test_every_word_of_a_limit_row_is_read_or_the_row_is_not_read(
    category: str,
    parameter: str,
    limit: str,
    issuer: tuple[str | None, str, Decimal | None],
    outcome: str,
) -> None:
    sector, bucket, price = issuer
    row = limit_row(category, parameter, limit, "-1.00%", "Breach")
    assert _one(row, sector=sector, rating_bucket=bucket, price=price) == outcome


# --- Mutation audit: mutmut 3.8.1 survivors killed by literal expectations -----------------------


@pytest.mark.parametrize("level", [1, 2, 3, 4, 5])
def test_a_whole_mean_is_shown_with_two_decimals(level: int) -> None:
    # Methodology section 4: the mean of twelve equal levels is that level, shown as 3.00 etc.
    result = credit_score(card([level] * 12))
    assert result.reason == f"Credit Score {level}: mean {level}.00 of 12 scored factors."


def test_the_floor_reason_names_one_or_both_floor_factors_with_the_right_verb() -> None:
    one: dict[str, int | None] = dict.fromkeys(FACTORS, 3)
    one["Liquidity"] = 5  # sum 53 of 17: mean 3.12, rounds to 3, held to 4
    assert credit_score(card(one)).reason == (
        "Credit Score 4: mean 3.12 of 17 scored factors gives 3, held to no better than 4 "
        "because Liquidity is scored 5."
    )
    both = dict(one, **{"Maturity profile": 5})  # sum 55 of 17: mean 3.24, rounds to 3, held to 4
    assert credit_score(card(both)).reason == (
        "Credit Score 4: mean 3.24 of 17 scored factors gives 3, held to no better than 4 "
        "because Liquidity and Maturity profile are scored 5."
    )


@pytest.mark.parametrize(
    ("credit_", "valuation_", "message"),
    [
        (6, 3, "Credit Score must be 1 to 5, not 6."),
        (0, None, "Credit Score must be 1 to 5, not 0."),
        (3, 6, "Valuation must be 1 to 5, not 6."),
        (None, 0, "Valuation must be 1 to 5, not 0."),
    ],
)
def test_proposal_names_the_input_that_is_out_of_range(
    credit_: int | None, valuation_: int | None, message: str
) -> None:
    with pytest.raises(ValueError) as caught:
        proposal(credit_, valuation_)
    assert str(caught.value) == message


def test_band_names_the_non_finite_difference() -> None:
    with pytest.raises(ValueError) as caught:
        band(Decimal("NaN"))
    assert str(caught.value) == "The difference must be a finite number, not NaN."


def test_a_non_finite_level_price_or_reference_level_is_named() -> None:
    reference_ = book(*bonds("1", "2", "3", "4", "5"))
    with pytest.raises(ValueError) as level:
        valuation(bond("Infinity"), reference_)
    assert str(level.value) == "The level of Issuer 2030 must be a finite number, not Infinity."
    with pytest.raises(ValueError) as price:
        valuation(bond(price="NaN"), reference_)
    assert str(price.value) == "The price of Issuer 2030 must be a finite number, not NaN."
    with pytest.raises(ValueError) as spread:
        valuation(bond(), book(*bonds("1", "2", "3", "4", "-Infinity")))
    assert str(spread.value) == "A reference level must be a finite number, not -Infinity."


def test_the_valuation_reasons_read_in_full() -> None:
    five = book(*bonds("300", "200", "400", "250", "350"))
    assert valuation(bond("350"), five).reason == (
        "Valuation 2: Issuer 2030 is 50 bp from the BB median of 300 bp (5 names, 5 positions)."
    )
    one_name = book(*[pos("Acme Corp.", level) for level in ("300", "310", "320", "330", "340")])
    assert valuation(bond(), one_name).reason == (
        "No Valuation: the BB bucket holds 1 name with a level and 5 are needed."
    )
    assert valuation(bond(), book()).reason == (
        "No Valuation: the BB bucket holds 0 names with a level and 5 are needed."
    )
    both = valuation(bond(level=None, price=None), five)
    assert both.reason == "No Valuation: Issuer 2030 has no level; Issuer 2030 has no price."


def test_a_mixed_measure_bucket_adds_its_sentence_to_the_valuation_reason() -> None:
    loans = [
        pos("A", "500", asset="loan", measure="discount_margin"),
        pos("B", "510", asset="loan", measure="discount_margin"),
        pos("C", "520", asset="loan", measure="discount_margin"),
        pos("D", "530", asset="loan", measure="margin"),
        pos("E", "540", asset="loan", measure="margin"),
    ]
    loan = Instrument("Term loan", "loan", "BB", Decimal(600), Decimal(98))
    assert valuation(loan, book(*loans)).reason == (
        "Valuation 2: Term loan is 80 bp from the BB median of 520 bp (5 names, 5 positions). "
        "The BB bucket mixes discount margin and margin."
    )
    blank = valuation(Instrument("Term loan", "loan", "BB", None, Decimal(98)), book(*loans))
    assert blank.reason == (
        "No Valuation: Term loan has no level. The BB bucket mixes discount margin and margin."
    )


@pytest.mark.parametrize(
    ("headroom", "status", "outcome"),
    [
        ("(5)", "", "breached"),  # a figure wholly in parentheses is negative
        ("(0.40%)", "", "breached"),
        ("(12.5%", "Pass", "within"),  # a parenthesis that is not closed changes nothing
        ("(12.5%", "", "not_read"),
    ],
)
def test_only_a_figure_wholly_in_parentheses_is_negative(
    headroom: str, status: str, outcome: str
) -> None:
    row = limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", headroom, status)
    assert _one(row, rating_bucket="CCC") == outcome


def test_a_row_with_no_stated_limit_is_labelled_by_its_parameter_alone() -> None:
    row = limit_row("Rating", "Max CCC+ and below", "", "-1.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket="CCC", price=None)
    assert reading.reason.startswith("Max CCC+ and below is breached: ")


@pytest.mark.parametrize(
    ("category", "parameter", "sector", "bucket", "outcome"),
    [
        # A row with no sector known never reads a word of its own as the sector.
        ("Concentration", "Max XXXX exposure", None, "BB", "not_read"),
        # Every word of the row is read, the lead-in before a list included.
        ("Sector", "Prohibited: Software", "Software", "BB", "not_read"),
        # A row that says it limits rated obligations, naming no bucket, cannot be tied.
        ("Collateral quality", "Max rated obligations", None, "CCC", "not_read"),
        # "lower", "worse" and "below" extend a bucket only after "and" or "or".
        ("Rating", "Max B3 lower", None, "B", "not_read"),
        ("Rating", "Max B3 worse", None, "CCC", "not_read"),
        ("Rating", "Max B3 below", None, "CCC", "not_read"),
        ("Rating", "Max B3 and lower", None, "CCC", "breached"),
        ("Rating", "Max B3 or worse", None, "CCC", "breached"),
        # After "and" or "or" a word that is not read leaves the row not read.
        ("Rating", "Max B3 and foo", None, "B", "not_read"),
        ("Rating", "Max B3 or foo", None, "B", "not_read"),
    ],
)
def test_limit_row_wording_that_is_not_read_leaves_the_row_not_read(
    category: str, parameter: str, sector: str | None, bucket: str, outcome: str
) -> None:
    row = limit_row(category, parameter, "≤ 7.5% NAV", "-1.00%", "Breach")
    assert _one(row, sector=sector, rating_bucket=bucket) == outcome


def test_an_information_row_gives_a_full_sentence() -> None:
    row = limit_row("Rating", "Max CCC+ and below", "Info", "", "")
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket="CCC", price=None)
    assert reading.outcome == "does_not_apply"
    assert reading.reason.startswith("Max CCC+ and below (Info) does not apply: it ")
    assert "None" not in reading.reason


def test_a_capped_reading_names_the_cell_it_was_held_from_and_each_breached_limit() -> None:
    held = reference(
        "clo",
        limit_row(*CCC_ROW),
        limit_row("Rating", "Max B3 and below", "≤ 7.5% NAV", "-1.00%", "Breach"),
        bucket="CCC",
    )
    result = portfolio_reading(credit(1), [issuer(1, bucket="CCC", asset="loan")], held)
    assert (result.portfolio, result.name) == ("p", "Portfolio")
    assert result.reason == (
        "MW, held from Strong OW by a breached limit: "
        "Max CCC+ and below (≤ 7.5% NAV) is breached: headroom is -12.50%; "
        "Max B3 and below (≤ 7.5% NAV) is breached: headroom is -1.00%. "
        "Strong OW: Credit Score 1 and Valuation 1 "
        "(Issuer 2030 is 100 bp from the CCC median of 300 bp (5 names, 5 positions).)"
    )


def test_an_uncapped_reading_gives_the_cell_name_and_the_valuation_sentence() -> None:
    result = portfolio_reading(credit(2), [issuer(2)], reference("hy_index"))
    assert (result.status, result.recommendation, result.capped_by) == ("proposed", 2, ())
    assert result.reason == (
        "Modest OW: Credit Score 2 and Valuation 2 "
        "(Issuer 2030 is 50 bp from the BB median of 300 bp (5 names, 5 positions).)"
    )


def test_a_custom_portfolio_reads_the_declared_asset_type_and_names_both_when_undeclared() -> None:
    custom = reference("custom")
    declared = portfolio_reading(credit(3), [issuer(3)], custom, Issuer(declared="loan"))
    assert declared.status == "n/a"
    assert declared.reason == "Portfolio holds loans and the issuer has none."
    undeclared = portfolio_reading(credit(3), [], custom)
    assert undeclared.reason == "Portfolio holds loans and bonds and the issuer has none."


def test_a_blank_reading_joins_the_credit_reason_and_every_valuation_reason() -> None:
    no_credit = credit_score(card([3] * 11))
    thin = reference("hy_index", names=4)
    both = portfolio_reading(no_credit, [issuer(3)], thin)
    assert both.status == "blank"
    assert both.reason == (
        "No Credit Score: 11 of 17 factors are scored and 12 are needed. "
        "No Valuation: the BB bucket holds 4 names with a level and 5 are needed."
    )
    only_valuation = portfolio_reading(credit(3), [issuer(3), issuer(2)], thin)
    assert only_valuation.reason == (
        "No Valuation: the BB bucket holds 4 names with a level and 5 are needed. "
        "No Valuation: the BB bucket holds 4 names with a level and 5 are needed."
    )


def test_the_per_instrument_proposal_carries_its_instrument_valuation_and_reasons() -> None:
    loans = reference("loan_index", bucket="CCC")
    loan = issuer(1, bucket="CCC", asset="loan")
    proposed = instrument_proposal(credit(1), loan, loan_index=loans, hy_index=None)
    assert (proposed.instrument, proposed.status, proposed.recommendation) == (
        "Issuer 2030",
        "proposed",
        1,
    )
    assert proposed.valuation is not None and proposed.valuation.score == 1
    assert proposed.reason == (
        "Strong OW: Credit Score 1, Valuation 1: Issuer 2030 is 100 bp from the CCC median "
        "of 300 bp (5 names, 5 positions)."
    )
    no_credit = instrument_proposal(
        credit_score(card([3] * 11)), loan, loan_index=loans, hy_index=None
    )
    assert (no_credit.instrument, no_credit.status, no_credit.valuation) == (
        "Issuer 2030",
        "blank",
        None,
    )
    missing_loans = instrument_proposal(credit(3), loan, loan_index=None, hy_index=loans)
    assert (missing_loans.instrument, missing_loans.status, missing_loans.valuation) == (
        "Issuer 2030",
        "blank",
        None,
    )
    assert missing_loans.reason == "No recommendation for Issuer 2030: no loan index was supplied."
    missing_bonds = instrument_proposal(credit(3), issuer(3), loan_index=loans, hy_index=None)
    assert missing_bonds.reason == (
        "No recommendation for Issuer 2030: no high-yield index was supplied."
    )
    thin = reference("hy_index", names=4)
    no_valuation = instrument_proposal(credit(3), issuer(3), loan_index=None, hy_index=thin)
    assert no_valuation.instrument == "Issuer 2030" and no_valuation.status == "blank"
    assert no_valuation.valuation is not None and no_valuation.valuation.score is None
    assert (
        no_valuation.reason
        == "No Valuation: the BB bucket holds 4 names with a level and 5 are needed."
    )


# --- Whole-branch fix wave: H1, M1, M2, L1, L4 ----------------------------------------------------

HOTEL = "Hotel, Gaming & Leisure"
MEDIA = "Media: Broadcasting & Subscription"
BEVERAGE = "Beverage, Food & Tobacco"


@pytest.mark.parametrize(
    ("parameter", "sector"),
    [
        (f"Max single sector (largest: {HOTEL})", HOTEL),
        (f"Max sector: {MEDIA}", MEDIA),
        (f"Max {BEVERAGE}", BEVERAGE),
        (f"Max {BEVERAGE}", "beverage, food and tobacco"),
    ],
)
def test_a_sector_name_holding_list_marks_is_found_before_the_parameter_is_split(
    parameter: str, sector: str
) -> None:
    row = limit_row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    assert _one(row, sector=sector) == "breached"


@pytest.mark.parametrize("parameter", [f"Max single sector (largest: {HOTEL})", f"Max {MEDIA}"])
def test_a_row_naming_another_sector_with_list_marks_is_not_tied_and_is_not_read(
    parameter: str,
) -> None:
    row = limit_row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    assert _one(row, sector="Healthcare") == "not_read"


def test_a_breached_limit_on_a_sector_with_a_comma_caps_the_recommendation() -> None:
    row = limit_row(
        "Sector",
        f"Max single sector (largest: {HOTEL})",
        "≤ 15% NAV",
        "-1.00%",
        "Breach",
    )
    result = portfolio_reading(
        credit(1),
        [issuer(1, asset="loan")],
        reference("clo", row),
        issuer=Issuer(sector=HOTEL),
    )
    assert (result.uncapped, result.recommendation) == (1, 3)
    assert len(result.capped_by) == 1
    assert "Max single sector" in result.reason


@pytest.mark.parametrize(
    ("category", "parameter", "sector", "bucket"),
    [
        ("Sector", "Max Health Care exposure", "Healthcare", "BB"),
        ("Sector", "Max single industry", "Healthcare", "BB"),
        ("Concentration", "Max Health Care exposure", "Healthcare", "BB"),
        ("Concentration", "Max Healthcare exposure", None, "BB"),
        ("Collateral quality", "Max triple-C obligations", "Healthcare", "CCC"),
        ("Concentration", "Max high yield", "Healthcare", "BB"),
    ],
)
def test_a_breached_row_that_cannot_be_tied_to_the_issuer_is_not_read(
    category: str, parameter: str, sector: str | None, bucket: str
) -> None:
    row = limit_row(category, parameter, "≤ 15% NAV", "-1.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=sector, rating_bucket=bucket, price=None)
    assert reading.outcome == "not_read"
    assert "the file shows it breached and it could not be tied to the issuer" in reading.reason


def test_an_untied_row_with_nothing_readable_on_it_is_not_read() -> None:
    row = limit_row("Concentration", "Max Health Care exposure", "≤ 15% NAV")
    [reading] = read_limits(
        reference("clo", row), sector="Healthcare", rating_bucket="BB", price=None
    )
    assert reading.outcome == "not_read"
    assert "the file shows nothing that could be read on it" in reading.reason


def test_a_breached_status_on_an_untied_row_with_no_headroom_is_not_read() -> None:
    row = limit_row("Concentration", "Max Health Care exposure", "≤ 15% NAV", "", "Breach")
    assert _one(row, sector="Healthcare") == "not_read"


@pytest.mark.parametrize(
    ("row", "sector", "bucket"),
    [
        (
            limit_row(
                "Single Name", "Max single issuer exposure", "≤ 2.5% NAV", "-1.00%", "Breach"
            ),
            "Healthcare",
            "BB",
        ),
        (limit_row("Rating", "Max CCC+ and below", "≤ 7.5% NAV", "-1.00%", "Breach"), None, "B"),
        (
            limit_row("Sector", "Max Software exposure", "≤ 15% NAV", "0.40%", "Pass"),
            "Healthcare",
            "BB",
        ),
        (
            limit_row("Concentration", "Aggregate top 10 issuers", "≤ 30% NAV", "0.00%", "Pass"),
            "Healthcare",
            "BB",
        ),
    ],
)
def test_a_row_that_is_ruled_out_or_shows_no_excess_still_does_not_apply(
    row: Limit, sector: str | None, bucket: str
) -> None:
    [reading] = read_limits(reference("clo", row), sector=sector, rating_bucket=bucket, price=None)
    assert reading.outcome == "does_not_apply"


def test_an_information_row_keeps_its_reason_and_a_single_name_row_too() -> None:
    info = limit_row("Spread", "Weighted average spread", "Info only", "-1.00%", "Breach")
    single = limit_row(
        "Single Name", "Max single issuer exposure", "≤ 2.5% NAV", "-1.00%", "Breach"
    )
    readings = read_limits(
        reference("clo", info, single), sector="Software", rating_bucket="B", price=None
    )
    assert [item.outcome for item in readings] == ["does_not_apply", "does_not_apply"]
    assert all(
        "it is an information row or limits no one issuer's position" in r.reason for r in readings
    )


def test_an_unread_breached_row_is_named_in_the_reading_and_does_not_cap() -> None:
    row = limit_row("Rating", "Max CCC basket", "≤ 7.5% NAV", "-12.50%", "Breach")
    result = portfolio_reading(
        credit(1),
        [issuer(1, bucket="CCC", asset="loan")],
        reference("clo", row, bucket="CCC"),
    )
    assert (result.status, result.recommendation, result.capped_by) == ("proposed", 1, ())
    assert result.not_read == result.limits and len(result.not_read) == 1
    assert result.not_read[0].limit is row
    assert result.reason.endswith(
        "1 limit row could not be read and the recommendation does not reflect it: Max CCC basket."
    )


def test_two_unread_rows_are_counted_and_named_in_file_order() -> None:
    first = limit_row("Rating", "Max CCC basket", "≤ 7.5% NAV", "-12.50%", "Breach")
    second = limit_row("Concentration", "Max high yield", "≤ 5% NAV", "-1.00%", "Breach")
    result = portfolio_reading(
        credit(1),
        [issuer(1, bucket="CCC", asset="loan")],
        reference("clo", first, second, bucket="CCC"),
    )
    assert [item.limit for item in result.not_read] == [first, second]
    assert result.reason.endswith(
        "2 limit rows could not be read and the recommendation does not reflect them: "
        "Max CCC basket; Max high yield."
    )


def test_a_portfolio_with_no_limits_has_nothing_not_read() -> None:
    result = portfolio_reading(
        credit(1), [issuer(1, bucket="CCC", asset="loan")], reference("clo", bucket="CCC")
    )
    assert result.not_read == ()
    assert "could not be read" not in result.reason


def test_a_capped_reading_also_names_the_rows_not_read() -> None:
    held = limit_row(*CCC_ROW)
    unread = limit_row("Concentration", "Max high yield", "≤ 5% NAV", "-1.00%", "Breach")
    result = portfolio_reading(
        credit(1),
        [issuer(1, bucket="CCC", asset="loan")],
        reference("clo", held, unread, bucket="CCC"),
    )
    assert (result.recommendation, len(result.capped_by), len(result.not_read)) == (3, 1, 1)
    assert result.reason.endswith(
        "1 limit row could not be read and the recommendation does not reflect it: Max high yield."
    )


def test_a_blank_reading_still_lists_the_rows_not_read_but_adds_no_sentence() -> None:
    unread = limit_row("Concentration", "Max high yield", "≤ 5% NAV", "-1.00%", "Breach")
    result = portfolio_reading(
        credit(1), [issuer(1, asset="loan")], reference("clo", unread, names=4)
    )
    assert result.status == "blank"
    assert len(result.not_read) == 1
    assert "could not be read" not in result.reason


@pytest.mark.parametrize("bucket", ["IG", "BB", "B"])
def test_a_minimum_on_a_rating_is_not_read_as_a_limit_on_adding_the_name(bucket: str) -> None:
    row = limit_row("Rating", "Min BB or better", "≥ 60% NAV", "-5.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket=bucket, price=None)
    assert reading.outcome == "not_read"
    assert "a minimum cannot be read as a limit on adding the name" in reading.reason


def test_a_minimum_on_a_sector_is_not_read_and_the_price_floor_still_is() -> None:
    sector = limit_row("Sector", "Min Software exposure", "≥ 5% NAV", "-1.00%", "Breach")
    assert _one(sector, sector="Software") == "not_read"
    floor = limit_row("Price", "Minimum price", "≥ 90")
    assert _one(floor, price=Decimal(80)) == "breached"


def test_a_bucket_whose_borrowers_have_no_level_says_names_with_a_level() -> None:
    no_levels = book(
        *[Position(i, borrower=f"B{i}", rating_bucket="BB", asset_type="bond") for i in range(6)]
    )
    assert valuation(bond(), no_levels).reason == (
        "No Valuation: the BB bucket holds 0 names with a level and 5 are needed."
    )


# --- Fix wave: mutation survivors killed by literal expectations ---------------------------------


@pytest.mark.parametrize(
    ("sector", "parameter"),
    [
        (HOTEL, f"Max sector (foo {HOTEL})"),
        (HOTEL, f"Max sector ({HOTEL} foo)"),
        ("Chemicals, Plastics", "Max Chemicals, Plastics foo"),
        (HOTEL, f"Max max max max max max {HOTEL} foo"),
    ],
)
def test_every_word_of_the_item_holding_a_sector_with_list_marks_is_read(
    sector: str, parameter: str
) -> None:
    row = limit_row("Sector", parameter, "≤ 15% NAV", "-1.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=sector, rating_bucket="B", price=None)
    assert reading.outcome == "not_read"
    assert reading.reason.endswith(f"is not read: it names {sector} in wording that is not read.")


def test_an_unknown_sector_never_reads_a_word_of_the_row_as_the_sector() -> None:
    row = limit_row("Concentration", "Max XXXX exposure", "≤ 7.5% NAV", "-1.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket="BB", price=None)
    assert reading.reason == (
        "Max XXXX exposure (≤ 7.5% NAV) is not read: the file shows it breached and it could "
        "not be tied to the issuer."
    )


def test_a_rated_obligations_row_with_no_bucket_is_read_as_a_rating_row() -> None:
    row = limit_row("Collateral quality", "Max rated obligations", "≤ 7.5% NAV", "-1.00%", "Breach")
    [reading] = read_limits(reference("clo", row), sector=None, rating_bucket="CCC", price=None)
    assert reading.reason == (
        "Max rated obligations (≤ 7.5% NAV) is not read: no rating bucket could be read from it, "
        "so it is not tied to the issuer."
    )


@pytest.mark.parametrize(
    ("bucket", "outcome"),
    [("IG", "breached"), ("BB", "breached"), ("B", "does_not_apply"), ("CCC", "does_not_apply")],
)
def test_a_maximum_on_a_bucket_or_better_covers_the_stronger_buckets(
    bucket: str, outcome: str
) -> None:
    row = limit_row("Rating", "Max BB or better", "≤ 60% NAV", "-1.00%", "Breach")
    assert _one(row, rating_bucket=bucket) == outcome


def test_the_reasons_of_an_untied_row_are_read_in_full() -> None:
    sector = limit_row("Sector", "Max Healthcare exposure", "≤ 15% NAV", "0.40%", "Pass")
    other = limit_row("Concentration", "Aggregate top 10 issuers", "≤ 30% NAV", "0.00%", "Pass")
    unreadable = limit_row("Concentration", "Max high yield", "≤ 5% NAV")
    readings = read_limits(
        reference("clo", sector, other, unreadable),
        sector="Software",
        rating_bucket="BB",
        price=None,
    )
    assert [item.reason for item in readings] == [
        (
            "Max Healthcare exposure (≤ 15% NAV) does not apply: it does not name the issuer's "
            "sector, Software."
        ),
        (
            "Aggregate top 10 issuers (≤ 30% NAV) does not apply: it names neither the issuer's "
            "sector nor a rating bucket."
        ),
        (
            "Max high yield (≤ 5% NAV) is not read: the file shows nothing that could be read on "
            "it and it could not be tied to the issuer."
        ),
    ]


def test_an_unread_row_adds_one_sentence_after_the_cell_reason() -> None:
    row = limit_row("Rating", "Max CCC basket", "≤ 7.5% NAV", "-12.50%", "Breach")
    result = portfolio_reading(
        credit(1),
        [issuer(1, bucket="CCC", asset="loan")],
        reference("clo", row, bucket="CCC"),
    )
    assert result.reason == (
        "Strong OW: Credit Score 1 and Valuation 1 (Issuer 2030 is 100 bp from the CCC median "
        "of 300 bp (5 names, 5 positions).) 1 limit row could not be read and the "
        "recommendation does not reflect it: Max CCC basket."
    )
