"""The recommendation calculation: the Credit Score roll-up and the 5x5 table.

Answer key: `docs/methodology/portfolio-recommendation.md` sections 4 and 6, and
`docs/rulings/2026-11-25-deliverables-and-recommendations.md`. Where they differ the ruling governs.

This module computes and reads nothing else: no file, no provider, no workbook. Arithmetic is exact
(`int`, `Fraction` and `Decimal`; no `float`). Levels that Valuation compares are in basis points
and are not converted: a reference's figures are in the file's own unit, and converting them is the
caller's job.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Context, Decimal, Inexact
from fractions import Fraction
from math import floor

from deploy_workflow.cp2_scorecard import FACTORS, Scorecard
from deploy_workflow.reference_portfolios import AssetType, Measure, Portfolio, rows

MIN_SCORED = 12
FLOOR_FACTORS = ("Liquidity", "Maturity profile")
FLOOR_LEVEL = 4
SCORE_NAMES = ("Strong", "Good", "Fair", "Weak", "Stressed")
RECOMMENDATION_NAMES = ("Strong OW", "Modest OW", "MW", "Modest UW", "Strong UW")
# Methodology section 6: row by Credit Score 1..5, column by Valuation 1..5. Literal data, never
# computed by a rule.
TABLE = (
    (1, 2, 2, 3, 3),
    (2, 2, 3, 3, 4),
    (2, 3, 3, 4, 4),
    (3, 3, 4, 4, 5),
    (3, 4, 4, 5, 5),
)


@dataclass(frozen=True)
class CreditScore:
    """The roll-up. `score` None means no Credit Score, and `reason` says why."""

    score: int | None
    scored: int
    mean: Fraction | None
    gaps: tuple[str, ...]
    floored: bool
    reason: str


def _hundredths(value: Fraction) -> str:
    """A value to two decimals, in exact arithmetic."""
    cents = floor(value * 100 + Fraction(1, 2))  # an exact half rounds up
    return f"{cents // 100}.{cents % 100:02d}"


def _checked_levels(scorecard: Scorecard) -> dict[str, int | None]:
    """Each factor's level, refusing a scorecard that is not the 17 factors once each or whose
    level is outside 1 to 5: that is malformed input, not a low score."""
    names = [row.factor for row in scorecard.factors]
    if sorted(names) != sorted(FACTORS):
        raise ValueError(
            f"The scorecard must hold each of the {len(FACTORS)} factors exactly once; "
            f"it holds {len(names)} rows ({len(set(names))} distinct factor names)."
        )
    for row in scorecard.factors:
        if row.level is not None and not 1 <= row.level <= 5:
            raise ValueError(f"The level of {row.factor} must be 1 to 5, not {row.level}.")
    return {row.factor: row.level for row in scorecard.factors}


def credit_score(scorecard: Scorecard) -> CreditScore:
    """Methodology section 4: the equal-weight mean of the scored factors, an exact half rounded
    toward the weaker (higher) level, no better than 4 when Liquidity or Maturity profile is 5.
    Fewer than 12 scored factors give no score. The four assessments are never read."""
    levels = _checked_levels(scorecard)
    gaps = tuple(row.factor for row in scorecard.factors if row.level is None)
    present = [level for level in levels.values() if level is not None]
    scored = len(present)
    if scored < MIN_SCORED:
        reason = (
            f"No Credit Score: {scored} of {len(FACTORS)} factors are scored and "
            f"{MIN_SCORED} are needed."
        )
        return CreditScore(None, scored, None, gaps, False, reason)
    mean = Fraction(sum(present), scored)
    rounded = (2 * sum(present) + scored) // (2 * scored)  # half rounds up, to the weaker level
    reason = f"Credit Score {rounded}: mean {_hundredths(mean)} of {scored} scored factors."
    capping = [name for name in FLOOR_FACTORS if levels[name] == 5]
    floored = bool(capping) and rounded < FLOOR_LEVEL
    if floored:
        reason = (
            f"Credit Score {FLOOR_LEVEL}: mean {_hundredths(mean)} of {scored} scored factors "
            f"gives {rounded}, held to no better than {FLOOR_LEVEL} because "
            f"{' and '.join(capping)} {'is' if len(capping) == 1 else 'are'} scored 5."
        )
    return CreditScore(
        max(rounded, FLOOR_LEVEL) if capping else rounded, scored, mean, gaps, floored, reason
    )


def proposal(credit: int | None, valuation: int | None) -> int | None:
    """The 5x5 table's recommendation for a Credit Score and a Valuation; None when either is."""
    for name, value in (("Credit Score", credit), ("Valuation", valuation)):
        if value is not None and not 1 <= value <= 5:
            raise ValueError(f"{name} must be 1 to 5, not {value}.")
    if credit is None or valuation is None:
        return None
    return TABLE[credit - 1][valuation - 1]


# --- Valuation (methodology section 5) -----------------------------------------------------------

MIN_NAMES = 5
EXACT = Context(prec=200, traps=[Inexact])  # a sum or difference that would round raises instead
MEASURE_WORDS: dict[Measure, str] = {
    "discount_margin": "discount margin",
    "margin": "margin",
    "spread": "spread",
}


@dataclass(frozen=True)
class Instrument:
    """A loan or bond as the caller supplies it; `level_bp` is its spread, in basis points."""

    name: str
    asset_type: AssetType
    rating_bucket: str
    level_bp: Decimal | None
    price: Decimal | None


@dataclass(frozen=True)
class Valuation:
    """One instrument against its rating bucket. `score` None means blank, and `reason` says why.
    `names` counts distinct borrowers with a level in the bucket and `positions` the bucket
    positions with a level (what the median rests on)."""

    score: int | None
    difference_bp: Decimal | None
    median_bp: Decimal | None
    bucket: str
    names: int
    positions: int
    measures: tuple[Measure, ...]
    reason: str


def _finite(value: Decimal, what: str) -> Decimal:
    if not value.is_finite():
        raise ValueError(f"{what} must be a finite number, not {value}.")
    return value


def band(difference_bp: Decimal) -> int:
    """Methodology section 5, with the ruled edges: +40 and -40 are 3, +100 is 1, -100 is 5."""
    _finite(difference_bp, "The difference")
    if difference_bp >= 100:
        return 1
    if difference_bp > 40:
        return 2
    if difference_bp >= -40:
        return 3
    return 4 if difference_bp > -100 else 5


def _median(levels: Sequence[Decimal]) -> Decimal:
    """The exact median: the mean of the two middle values for an even count."""
    ordered = sorted(levels)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return EXACT.divide(EXACT.add(ordered[middle - 1], ordered[middle]), Decimal(2))


def _name_key(name: str) -> str:
    return "".join(char for char in name.casefold() if char.isalnum())


def _count(number: int, noun: str) -> str:
    return f"{number} {noun}" if number == 1 else f"{number} {noun}s"


def valuation(instrument: Instrument, portfolio: Portfolio) -> Valuation:
    """The instrument's level less its rating bucket's median in the portfolio, banded.
    Blank with no level, no price or fewer than five distinct borrowers in the bucket."""
    if instrument.level_bp is not None:
        _finite(instrument.level_bp, f"The level of {instrument.name}")
    in_bucket = rows(
        portfolio, asset_type=instrument.asset_type, rating_bucket=instrument.rating_bucket
    )
    bucket_rows = [row for row in in_bucket if row.spread is not None]
    levels = [
        _finite(row.spread, "A reference level") for row in bucket_rows if row.spread is not None
    ]
    names = {_name_key(row.position.borrower or "") for row in bucket_rows} - {""}
    measures = tuple(sorted({row.measure for row in bucket_rows if row.measure}))
    median = _median(levels) if levels else None
    causes = []
    if instrument.level_bp is None:
        causes.append(f"{instrument.name} has no level")
    if instrument.price is None:
        causes.append(f"{instrument.name} has no price")
    if len(names) < MIN_NAMES:
        causes.append(
            f"the {instrument.rating_bucket} bucket holds {_count(len(names), 'name')} "
            f"and {MIN_NAMES} are needed"
        )
    score = difference = None
    if not causes and median is not None and instrument.level_bp is not None:
        difference = EXACT.subtract(instrument.level_bp, median)
        score = band(difference)
        reason = (
            f"Valuation {score}: {instrument.name} is {difference} bp from the "
            f"{instrument.rating_bucket} median of {median} bp "
            f"({_count(len(names), 'name')}, {_count(len(levels), 'position')})."
        )
    else:
        reason = f"No Valuation: {'; '.join(causes)}."
    if len(measures) > 1:
        words = " and ".join(MEASURE_WORDS[m] for m in measures)
        reason += f" The {instrument.rating_bucket} bucket mixes {words}."
    return Valuation(
        score,
        difference,
        median,
        instrument.rating_bucket,
        len(names),
        len(levels),
        measures,
        reason,
    )


def best(valuations: Sequence[Valuation]) -> int | None:
    """The index of the lowest (best) score, the first on a tie; blanks are skipped and None
    means every one is blank. An index, so the caller knows which instrument it came from."""
    scored = [
        (item.score, index) for index, item in enumerate(valuations) if item.score is not None
    ]
    return min(scored)[1] if scored else None
