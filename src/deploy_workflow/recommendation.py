"""The recommendation calculation: the Credit Score roll-up and the 5x5 table.

Answer key: `docs/methodology/portfolio-recommendation.md` sections 4 and 6, and
`docs/rulings/2026-11-25-deliverables-and-recommendations.md`. Where they differ the ruling governs.

This module computes and reads nothing else: no file, no provider, no workbook. Arithmetic is exact
(`int`, `Fraction` and `Decimal`; no `float`). Levels that Valuation compares are in basis points
and are not converted: a reference's figures are in the file's own unit, and converting them is the
caller's job.
"""

from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Context, Decimal, Inexact
from fractions import Fraction
from math import floor
from typing import Literal

from deploy_vii.inputs import portfolio_export as pe
from deploy_workflow.cp2_scorecard import FACTORS, Scorecard
from deploy_workflow.reference_portfolios import (
    AssetType,
    Limit,
    Measure,
    Portfolio,
    Weight,
    issuer_weight,
    limits,
    rows,
)

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
    if instrument.price is not None:
        _finite(instrument.price, f"The price of {instrument.name}")
    in_bucket = [  # a position with no stated asset type is read as the instrument's
        row
        for row in rows(portfolio, rating_bucket=instrument.rating_bucket)
        if row.position.asset_type in (instrument.asset_type, None)
    ]
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


# --- Eligibility, limits and the readings (methodology section 7) --------------------------------

ELIGIBLE: dict[str, tuple[AssetType, ...]] = {
    "clo": ("loan",),
    "loan_index": ("loan",),
    "hy_index": ("bond",),
}
HOLDS = {"loan": "loans", "bond": "bonds"}
CAP_AT = 3  # a breached limit holds an Overweight (1 or 2) to this, MW
Outcome = Literal["breached", "within", "not_read", "does_not_apply"]
SINGLE_NAME = (
    "single name",
    "single issuer",
    "single obligor",
    "single borrower",
    "largest issuer",
)
# Statuses are matched whole, after folding case and spaces; anything else decides nothing.
BREACH_STATUS = frozenset(
    {"breach", "breached", "in breach", "fail", "failed", "non-compliant", "not compliant"}
)
PASS_STATUS = frozenset(
    {"pass", "passed", "ok", "compliant", "in compliance", "no breach", "within limit"}
)
# Rating buckets, strongest to weakest; Unrated is outside the order.
BUCKET_ORDER = ("IG", "BB", "B", "CCC")
# Wording that names every sub-investment bucket; the word "investment" or "IG" inside it does not
# also name IG.
BUCKET_GROUPS = (
    "sub investment",
    "non investment",
    "non ig",
    "below investment",
    "high yield",
    "speculative",
)
GROUP_BUCKETS = ("BB", "B", "CCC")
WEAKER_WORDS = (" and below ", " or below ", " and lower ", " or lower ", " or worse ")
STRONGER_WORDS = (" and above ", " or above ", " or better ", " or higher ")
PRICE_FLOOR_WORDS = frozenset({"minimum", "min", "floor"})
PRICE_AVERAGE_WORDS = frozenset({"average", "weighted"})
STATE: dict[Outcome, str] = {
    "breached": "is breached",
    "within": "is within",
    "not_read": "is not read",
    "does_not_apply": "does not apply",
}
WORD = re.compile(r"[a-z0-9]+")


def eligible_types(
    portfolio: Portfolio, declared: AssetType | None = None
) -> tuple[AssetType, ...]:
    """The asset types an issuer's instruments can be read in: loans for a CLO or a loan index,
    bonds for a high-yield index, and for a custom portfolio the declared type, or both."""
    if portfolio.kind == "custom":
        return (declared,) if declared else ("loan", "bond")
    return ELIGIBLE[portfolio.kind]


@dataclass(frozen=True)
class LimitReading:
    """One constraints row read against the issuer, in the file's order. `outcome` is breached,
    within, not_read (it applies but its status wording or headroom is not recognised, or it
    cannot be tied to the issuer) or does_not_apply."""

    limit: Limit
    outcome: Outcome
    reason: str


def _words(text: str) -> list[str]:
    return WORD.findall(text.casefold())


def _stem(word: str) -> str:
    """A rating word without its trailing digits (`b3` is `b`, `caa1` is `caa`)."""
    return word.rstrip("0123456789")


def _label(limit: Limit) -> str:
    return f"{limit.parameter} ({limit.limit})" if limit.limit else limit.parameter


def _kind(limit: Limit) -> Literal["sector", "rating", "price", "other"]:
    """What the row limits, from its category and parameter. Information rows, single-name rows
    and every other category are `other`: no position size is assumed, so none can be breached."""
    text = pe.folded(f"{limit.category} {limit.parameter}")
    words = _words(text)
    if pe.folded(limit.limit).startswith("info") or any(name in text for name in SINGLE_NAME):
        return "other"
    if "price" in words:
        return "price"
    if {"sector", "sectors", "industry", "industries"} & set(words):
        return "sector"
    in_parameter = {_stem(word) for word in _words(limit.parameter)}
    named_ccc = bool({"ccc", "caa"} & in_parameter)
    return (
        "rating" if {"rating", "rated"} & {_stem(word) for word in words} or named_ccc else "other"
    )


def _signed(headroom: str) -> str:
    """A headroom as `quantity` reads signs: U+2212 is `-` and a figure wholly in parentheses is
    negative. Nothing else is changed."""
    text = headroom.strip().replace("\u2212", "-")
    inner = text[1:-1].strip()
    if text.startswith("(") and text.endswith(")") and "(" not in inner and ")" not in inner:
        return f"-{inner}"
    return text


def _decided(limit: Limit) -> tuple[Outcome, str]:
    """A sector or rating row that applies: breached on zero or negative headroom or a status in
    the breach set, within on a positive headroom or a status in the pass set, else not read."""
    headroom = pe.quantity(_signed(limit.headroom))
    status = pe.folded(limit.observed_status)
    if headroom is not None and headroom.value <= 0:
        return "breached", f"headroom is {limit.headroom}"
    if status in BREACH_STATUS:
        return "breached", f"its status is {limit.observed_status}"
    if headroom is not None:
        return "within", f"headroom is {limit.headroom}"
    if status in PASS_STATUS:
        return "within", f"its status is {limit.observed_status}"
    return "not_read", "its status wording or headroom was not recognised"


def _sector_reading(limit: Limit, sector: str | None) -> tuple[Outcome, str]:
    wanted = _words((sector or "").replace("&", " and "))
    if not wanted:
        return "not_read", "the issuer's sector is not known"
    words = _words(limit.parameter.replace("&", " and "))
    if any(words[i : i + len(wanted)] == wanted for i in range(len(words))):
        return _decided(limit)
    return "does_not_apply", f"it does not name the issuer's sector, {sector}"


def _covered(parameter: str) -> tuple[tuple[str, ...], bool]:
    """The rating buckets a row covers, in the order IG, BB, B, CCC, Unrated, and whether it
    covers them by group wording. Named buckets are every one the row names, a group wording covers
    BB, B and CCC, and "and below" or "and above" adds the weaker or stronger ones in the order."""
    text = f" {' '.join(_words(parameter))} "
    covered: set[str] = set()
    grouped = False
    for group in BUCKET_GROUPS:
        if f" {group} " in text:
            grouped = True
            covered.update(GROUP_BUCKETS)
            text = text.replace(f" {group} ", " ")
    words = (_stem(word) for word in text.split())
    covered.update(name for word in words if (name := pe.label_bucket(word)) is not None)
    ranks = [BUCKET_ORDER.index(name) for name in covered if name in BUCKET_ORDER]
    if ranks and any(phrase in text for phrase in WEAKER_WORDS):
        covered.update(BUCKET_ORDER[min(ranks) :])
    if ranks and any(phrase in text for phrase in STRONGER_WORDS):
        covered.update(BUCKET_ORDER[: max(ranks) + 1])
    return tuple(name for name in (*BUCKET_ORDER, "Unrated") if name in covered), grouped


def _rating_reading(limit: Limit, bucket: str | None) -> tuple[Outcome, str]:
    covered, grouped = _covered(limit.parameter)
    if not covered:
        return (
            "not_read",
            "no rating bucket could be read from it, so it cannot be tied to the issuer",
        )
    if bucket is None:
        return "not_read", "there is no instrument to take a rating bucket from"
    if bucket in covered:
        return _decided(limit)
    if grouped and bucket == "Unrated":
        return "not_read", "an unrated instrument cannot be placed against a group of rated buckets"
    return "does_not_apply", f"it covers {', '.join(covered)} and the instrument is rated {bucket}"


def _price_reading(limit: Limit, price: Decimal | None) -> tuple[Outcome, str]:
    words = set(_words(limit.parameter))
    figure = limit.quantity
    is_floor = (
        bool(words & PRICE_FLOOR_WORDS)
        and not words & PRICE_AVERAGE_WORDS
        and figure is not None
        and figure.operator in (">=", "")
        and not figure.unit.startswith("%")
    )
    if figure is None or not is_floor:
        return "not_read", "it is not a price floor on a single instrument"
    if price is None:
        return "not_read", "there is no price to compare with it"
    if price < figure.value:
        return "breached", f"the price {price} is below the floor"
    return "within", f"the price {price} is at or above the floor"


def read_limits(
    portfolio: Portfolio, *, sector: str | None, rating_bucket: str | None, price: Decimal | None
) -> tuple[LimitReading, ...]:
    """One reading for every constraints row of the portfolio, in order, none dropped. A sector
    row applies when it names the issuer's `sector`, a rating row (a CCC limit among them) when it
    names the instrument's `rating_bucket`, and a price floor is breached by a `price` below it.
    A row that cannot be tied to the issuer is not read, never guessed."""
    out = []
    for limit in limits(portfolio):
        kind = _kind(limit)
        if kind == "other":
            outcome: Outcome = "does_not_apply"
            why = "it is an information row or limits no one issuer's position"
        elif kind == "sector":
            outcome, why = _sector_reading(limit, sector)
        elif kind == "rating":
            outcome, why = _rating_reading(limit, rating_bucket)
        else:
            outcome, why = _price_reading(limit, price)
        out.append(LimitReading(limit, outcome, f"{_label(limit)} {STATE[outcome]}: {why}."))
    return tuple(out)


@dataclass(frozen=True)
class Issuer:
    """What the caller knows of the issuer: how the portfolio's positions are matched to it
    (`borrower`, `identifier`), its `sector` (what sector limits are tied by) and, for a custom
    portfolio, the asset type it `declared`."""

    borrower: str | None = None
    identifier: str | None = None
    sector: str | None = None
    declared: AssetType | None = None


@dataclass(frozen=True)
class PortfolioReading:
    """An issuer read against one portfolio. `status` is proposed, blank (no Credit Score or no
    Valuation) or n/a (the portfolio holds no asset type the issuer has). `recommendation` is the
    table's cell `uncapped`, held to 3 when a limit is breached and the cell is 1 or 2, in which
    case `capped_by` names the breached limits. `instrument` and `valuation` are the best eligible
    instrument's, which is also what `limits` (every row, as read) rests on."""

    portfolio: str
    name: str
    status: Literal["proposed", "blank", "n/a"]
    recommendation: int | None
    uncapped: int | None
    capped_by: tuple[LimitReading, ...]
    valuation: Valuation | None
    instrument: Instrument | None
    limits: tuple[LimitReading, ...]
    weight: Weight | None
    reason: str


def _proposed(
    credit: CreditScore, valuation_: Valuation, cell: int, held: tuple[LimitReading, ...]
) -> tuple[int, str]:
    name = RECOMMENDATION_NAMES[cell - 1]
    reason = (
        f"{name}: Credit Score {credit.score} and Valuation {valuation_.score} "
        f"({valuation_.reason.removeprefix(f'Valuation {valuation_.score}: ')})"
    )
    if cell < CAP_AT and held:
        names = "; ".join(reading.reason.removesuffix(".") for reading in held)
        return CAP_AT, (
            f"{RECOMMENDATION_NAMES[CAP_AT - 1]}, held from {name} by a breached limit: {names}. "
            f"{reason}"
        )
    return cell, reason


def portfolio_reading(
    credit: CreditScore,
    instruments: Sequence[Instrument],
    portfolio: Portfolio,
    issuer: Issuer | None = None,
) -> PortfolioReading:
    """The issuer's recommendation in one portfolio: the table's cell on the Credit Score and the
    best eligible instrument's Valuation, held to no better than 3 when an applicable limit is
    breached (a 3, 4 or 5 is never changed). Limits are read on that instrument's rating bucket
    and price; with none, on no instrument."""
    issuer = issuer or Issuer()
    types = eligible_types(portfolio, issuer.declared)
    eligible = [item for item in instruments if item.asset_type in types]
    valued = [valuation(item, portfolio) for item in eligible]
    chosen = best(valued)
    instrument = None if chosen is None else eligible[chosen]
    best_valuation = None if chosen is None else valued[chosen]
    read = read_limits(
        portfolio,
        sector=issuer.sector,
        rating_bucket=None if instrument is None else instrument.rating_bucket,
        price=None if instrument is None else instrument.price,
    )
    weight = None
    if _name_key(issuer.borrower or "") or (issuer.identifier or "").strip():
        weight = issuer_weight(portfolio, borrower=issuer.borrower, identifier=issuer.identifier)

    def result(
        status: Literal["proposed", "blank", "n/a"],
        reason: str,
        recommendation: int | None = None,
        uncapped: int | None = None,
        capped_by: tuple[LimitReading, ...] = (),
    ) -> PortfolioReading:
        return PortfolioReading(
            portfolio=portfolio.key,
            name=portfolio.name,
            status=status,
            recommendation=recommendation,
            uncapped=uncapped,
            capped_by=capped_by,
            valuation=best_valuation,
            instrument=instrument,
            limits=read,
            weight=weight,
            reason=reason,
        )

    if not eligible:
        held_types = " and ".join(HOLDS[item] for item in types)
        return result("n/a", f"{portfolio.name} holds {held_types} and the issuer has none.")
    causes = [credit.reason] if credit.score is None else []
    if best_valuation is None:
        causes += [item.reason for item in valued]
    cell = (
        None if causes or best_valuation is None else proposal(credit.score, best_valuation.score)
    )
    if cell is None or best_valuation is None:
        return result("blank", " ".join(causes))
    breached = tuple(item for item in read if item.outcome == "breached")
    final, reason = _proposed(credit, best_valuation, cell, breached)
    return result("proposed", reason, final, cell, breached if final != cell else ())


@dataclass(frozen=True)
class InstrumentProposal:
    """One instrument's recommendation against the index for its type; no limit cap."""

    instrument: str
    status: Literal["proposed", "blank"]
    recommendation: int | None
    valuation: Valuation | None
    reason: str


def instrument_proposal(
    credit: CreditScore,
    instrument: Instrument,
    *,
    loan_index: Portfolio | None,
    hy_index: Portfolio | None,
) -> InstrumentProposal:
    """The table's cell on the Credit Score and the instrument's own Valuation against the loan
    index (a loan) or the high-yield index (a bond). Blank, with the reason, when the Credit
    Score, the index or the Valuation is missing."""
    index = loan_index if instrument.asset_type == "loan" else hy_index
    index_name = "loan index" if instrument.asset_type == "loan" else "high-yield index"
    if credit.score is None:
        return InstrumentProposal(instrument.name, "blank", None, None, credit.reason)
    if index is None:
        reason = f"No recommendation for {instrument.name}: no {index_name} was supplied."
        return InstrumentProposal(instrument.name, "blank", None, None, reason)
    valued = valuation(instrument, index)
    cell = proposal(credit.score, valued.score)
    if cell is None:
        return InstrumentProposal(instrument.name, "blank", None, valued, valued.reason)
    reason = f"{RECOMMENDATION_NAMES[cell - 1]}: Credit Score {credit.score}, {valued.reason}"
    return InstrumentProposal(instrument.name, "proposed", cell, valued, reason)
