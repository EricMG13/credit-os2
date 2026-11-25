"""The recommendation calculation: the Credit Score roll-up and the 5x5 table.

Answer key: `docs/methodology/portfolio-recommendation.md` sections 4 and 6, and
`docs/rulings/2026-11-25-deliverables-and-recommendations.md`. Where they differ the ruling governs.

This module computes and reads nothing else: no file, no provider, no workbook. Arithmetic is exact
(`int` and `Fraction`; no `float`). Levels that later parts of this module compare are in basis
points and are not converted: a reference's figures are in the file's own unit, and converting
them is the caller's job.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction

from deploy_workflow.cp2_scorecard import FACTORS, Scorecard

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
    cents = round(value * 100)
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
