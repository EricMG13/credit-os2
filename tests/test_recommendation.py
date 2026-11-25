"""The Credit Score roll-up and the 5x5 table, against the worked examples and table of
docs/methodology/portfolio-recommendation.md (sections 2, 4 and 6). Expected values are literals."""

from __future__ import annotations

from fractions import Fraction

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_workflow import recommendation
from deploy_workflow.cp2_scorecard import ASSESSMENTS, FACTORS, Assessment, FactorScore, Scorecard
from deploy_workflow.recommendation import (
    RECOMMENDATION_NAMES,
    SCORE_NAMES,
    TABLE,
    credit_score,
    proposal,
)

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
        for valuation, expected in enumerate(row, start=1):
            assert proposal(credit, valuation) == expected
            assert TABLE[credit - 1][valuation - 1] == expected


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
