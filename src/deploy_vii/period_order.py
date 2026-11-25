"""The one period-ordering rule: oldest fiscal year, ..., latest, then YTD/PYTD, LTM, PF, forecasts.

docs/superpowers/specs/2026-11-25-chart-periods.md states the rule; `web/src/utils/periodOrder.ts`
is its TypeScript twin and both are tested against `tests/fixtures/period-order-cases.json`.
A label is read as a class and an optional period end; nothing here reads a financial value.
"""

from __future__ import annotations

import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date
from enum import IntEnum
from typing import Literal

type PeriodEnd = tuple[int, int, int]
type PeriodSpan = Literal["date", "month", "quarter", "half", "year"]


class PeriodClass(IntEnum):
    ACTUAL = 0
    YTD = 1
    LTM = 2
    PF = 3
    FORECAST = 4


@dataclass(frozen=True, slots=True)
class ParsedPeriod:
    """`end` is (year, month, day); only a label carrying its own date has a real day, the others
    are placed on day 31 of their last month. `prior_ytd` marks a PYTD label of the ytd class."""

    period_class: PeriodClass
    end: PeriodEnd | None
    span: PeriodSpan | None
    prior_ytd: bool = False


# The characters JavaScript's \s matches, spelled out so both implementations agree on them.
_SPACES = re.compile("[\t\n\v\f\r    -     　﻿]+")

_PUNCTUATION = re.compile(r"['’(),.:]")
_SEPARATORS = re.compile(r"[ /\-–—_·|]+")

_PRIOR_YTD = re.compile(r"(?<![A-Z])PYTD(?![A-Z])")
# Highest class first. A word may touch digits (`LTM2025`), never another letter.
_CLASS_WORDS: tuple[tuple[PeriodClass, re.Pattern[str]], ...] = (
    (
        PeriodClass.FORECAST,
        re.compile(
            r"(?<![A-Z])(?:NTM|FORECAST|PROJECTED|PROJECTION|PROJ|BUDGET|GUIDANCE|OUTLOOK"
            r"|ESTIMATED|ESTIMATE|EST|PLAN|TARGET)(?![A-Z])"
        ),
    ),
    (PeriodClass.PF, re.compile(r"(?<![A-Z])(?:PF|PRO[ -]?FORMA)(?![A-Z])")),
    (PeriodClass.LTM, re.compile(r"(?<![A-Z])(?:LTM|TTM)(?![A-Z])")),
    (PeriodClass.YTD, re.compile(r"(?<![A-Z])(?:PYTD|YTD)(?![A-Z])")),
)
_NEXT_TWELVE = re.compile(r"(?<![A-Z])NTM(?![A-Z])")


def _wordy_forecast(period_class: PeriodClass, text: str) -> bool:
    """Whether an undated label is a forecast by a word alone (`Outlook`, `Target`, `Plan`): such
    a word without a year names no period. `NTM` is a period of its own."""
    return period_class is PeriodClass.FORECAST and _NEXT_TWELVE.search(text) is None


_COUNT = re.compile(r"(?<![0-9A-Z])([369])M(?![A-Z])")

_ISO_DATE = re.compile(r"(?<![0-9])([0-9]{4})-([0-9]{2})-([0-9]{2})(?![0-9])")
_DAY = r"(?:0?[1-9]|[12][0-9]|3[01])"
# A day number beside the month is taken out with it and not used.
_MONTH = re.compile(
    rf"(?:(?<![0-9]){_DAY}[ -])?"
    r"(?<![A-Z])(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?"
    r"|SEP(?:T|TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)(?![A-Z])"
    rf"(?:[ -]{_DAY}(?=[ -][0-9]{{4}}(?![0-9])))?"
)
_MONTH_NUMBER = {
    name: number
    for number, name in enumerate(
        ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"), 1
    )
}
# Year expressions: group 1 the fiscal prefix, 2 the digits, 3 the second year or the suffix.
_PREFIX = r"(?:(?<![A-Z])(FYE|FY|CY) ?)?(?<![0-9])"
_SUFFIX = r"(?![0-9])(?: ?([AEFBP])(?![0-9A-Z]))?"
_CENTURY_YEAR = r"(19[0-9]{2}|2[01][0-9]{2})"
_SPLIT_YEAR = re.compile(rf"{_PREFIX}{_CENTURY_YEAR}[/-]([0-9]{{4}}|[0-9]{{2}})(?![0-9])")
_FOUR_DIGITS = re.compile(rf"{_PREFIX}{_CENTURY_YEAR}{_SUFFIX}")
_TWO_DIGITS = re.compile(rf"{_PREFIX}([0-9]{{2}}){_SUFFIX}")
_LONE_PREFIX = re.compile(r"(?<![A-Z])(?:FYE|FY|CY)(?![0-9A-Z])")
_FORECAST_SUFFIXES = frozenset("EFBP")
_TWO_DIGIT_PIVOT = 70
# Groups 1 and 2 a quarter, 3 and 4 a half.
_PART = re.compile(r"(?<![0-9A-Z])(?:Q([1-4])|([1-4])Q|H([12])|([12])H)(?![0-9A-Z])")
_QUALIFIERS = re.compile(
    r"(?<![A-Z])(?:ACTUAL|REPORTED|RESTATED|ADJUSTED|ADJ|AUDITED|UNAUDITED|AS|AT|TO|YEAR|QUARTER"
    r"|HALF|PERIOD|ENDED|ENDING|END)(?![A-Z])"
)

_SPAN_RANK: dict[PeriodSpan, int] = {"date": 0, "month": 0, "quarter": 1, "half": 2, "year": 3}
# An undated label sorts after every dated one of its class; an undated PYTD before them.
_UNDATED_YEAR = 10000
_STRUCTURED: dict[str, tuple[PeriodClass, PeriodSpan]] = {
    "QUARTER": (PeriodClass.ACTUAL, "quarter"),
    "FY": (PeriodClass.ACTUAL, "year"),
    "PERIOD_END": (PeriodClass.ACTUAL, "date"),
    "YTD": (PeriodClass.YTD, "date"),
    "LTM": (PeriodClass.LTM, "date"),
    "PF": (PeriodClass.PF, "date"),
}


@dataclass(frozen=True, slots=True)
class _Year:
    """A year expression taken out of a label; `rest` is the label without it."""

    value: int
    forecast: bool
    prefixed: bool
    rest: str


def _normalise(label: str) -> str:
    return _SPACES.sub(" ", _PUNCTUATION.sub(" ", label.upper())).strip(" ")


def _cut(text: str, match: re.Match[str]) -> str:
    return f"{text[: match.start()]} {text[match.end() :]}"


def _take(pattern: re.Pattern[str], text: str) -> tuple[re.Match[str] | None, str]:
    """The first match of a token and the text without it: a label has at most one of each."""
    match = pattern.search(text)
    return (match, _cut(text, match)) if match else (None, text)


def _calendar_date(year: int, month: int, day: int) -> PeriodEnd | None:
    try:
        date(year, month, day)
    except ValueError:
        return None
    return (year, month, day)


def _class_words(text: str) -> tuple[PeriodClass, str]:
    found = PeriodClass.ACTUAL
    for period_class, words in _CLASS_WORDS:
        text, count = words.subn(" ", text)
        if count:
            found = max(found, period_class)
    return found, text


def _year_taken(text: str, match: re.Match[str], value: int) -> _Year:
    """Take the year out with its prefix, or with one standing elsewhere (`FY ended Dec 2024`)."""
    rest = _cut(text, match)
    lone = None if match[1] else _LONE_PREFIX.search(rest)
    forecast = match[3] in _FORECAST_SUFFIXES
    prefixed = bool(match[1] or lone)
    return _Year(value, forecast, prefixed, _cut(rest, lone) if lone else rest)


def _year(text: str, named: bool) -> _Year | Literal["invalid"] | None:
    """The one year a label names, None when it names none, "invalid" for a broken split year.

    `named` says a class marker or a month was found: one of the things, with a fiscal prefix,
    a forecast suffix or a quarter or half, that let a two-digit number be read as a year.
    """
    split = _SPLIT_YEAR.search(text)
    if split:
        year = int(split[2]) + 1
        expected = year if len(split[3]) == len(split[2]) else year % 100
        return _year_taken(text, split, year) if int(split[3]) == expected else "invalid"
    four_digits = _FOUR_DIGITS.search(text)
    if four_digits:
        return _year_taken(text, four_digits, int(four_digits[2]))
    two_digits = list(_TWO_DIGITS.finditer(text))
    if not two_digits:
        return None
    number = int(two_digits[-1][2])
    century = 1900 if number >= _TWO_DIGIT_PIVOT else 2000
    found = _year_taken(text, two_digits[-1], century + number)
    anchored = named or found.forecast or found.prefixed or _PART.search(found.rest)
    return found if anchored else None


def _end_in_year(
    year: int,
    month: re.Match[str] | None,
    part: re.Match[str] | None,
    count: re.Match[str] | None,
) -> tuple[PeriodEnd, PeriodSpan]:
    if month:
        return (year, _MONTH_NUMBER[month[1][:3]], 31), "month"
    if part and (part[1] or part[2]):
        return (year, 3 * int(part[1] or part[2]), 31), "quarter"
    if part:
        return (year, 6 * int(part[3] or part[4]), 31), "half"
    if count:
        return (year, int(count[1]), 31), "month"
    return (year, 12, 31), "year"


def parse_period(label: str) -> ParsedPeriod | None:
    """Read a period label as its class and end; None when the label is unparseable.

    The label is read strictly: every token of the rule is taken out of it, at most one date,
    year, month and part, and anything left over makes it unparseable.
    """
    text = text_before = _normalise(label)
    prior = _PRIOR_YTD.search(text) is not None
    iso, text = _take(_ISO_DATE, text)
    day = _calendar_date(int(iso[1]), int(iso[2]), int(iso[3])) if iso else None
    period_class, text = _class_words(text)
    count, text = _take(_COUNT, text)
    month, text = _take(_MONTH, text)
    year = _year(text, named=bool(period_class or count or month))
    if year == "invalid" or (iso and day is None):
        return None
    part, text = _take(_PART, year.rest if year else text)
    if _SEPARATORS.sub("", _QUALIFIERS.sub(" ", text)):
        return None
    if count:
        period_class = max(period_class, PeriodClass.YTD)
    if year and year.forecast:
        period_class = PeriodClass.FORECAST
    prior_ytd = prior and period_class is PeriodClass.YTD
    if day:
        return ParsedPeriod(period_class, day, "date", prior_ytd)
    if year:
        return ParsedPeriod(period_class, *_end_in_year(year.value, month, part, count), prior_ytd)
    if period_class is PeriodClass.ACTUAL or _wordy_forecast(period_class, text_before):
        return None
    return ParsedPeriod(period_class, None, None, prior_ytd)


def _key(
    period_class: PeriodClass, end: PeriodEnd | None, span: PeriodSpan | None, prior_ytd: bool
) -> tuple[int, ...]:
    after_prior = 0 if prior_ytd else 1
    if end is None or span is None:
        return (period_class, _UNDATED_YEAR * after_prior, 0, 0, 0, after_prior)
    return (period_class, *end, _SPAN_RANK[span], after_prior)


def period_key(label: str) -> tuple[int, ...] | None:
    """(class, year, month, day, span, PYTD-first) of a label; None when it is unparseable."""
    parsed = parse_period(label)
    if parsed is None:
        return None
    return _key(parsed.period_class, parsed.end, parsed.span, parsed.prior_ytd)


def structured_period_key(period_type: str, end: date | None) -> tuple[int, ...]:
    """The key of a structured (T4.14) period, comparable with `period_key`.

    A period without an end date sorts after the dated ones of its class.
    """
    if period_type not in _STRUCTURED:
        raise ValueError(f"unknown period type for ordering: {period_type!r}")
    period_class, span = _STRUCTURED[period_type]
    day = None if end is None else (end.year, end.month, end.day)
    return _key(period_class, day, span, prior_ytd=False)


def order_periods[T](
    items: Sequence[T], label: Callable[[T], str]
) -> tuple[tuple[T, ...], tuple[T, ...]]:
    """(ordered, gaps): items in rule order, then the unparseable ones as authored; gaps are those.

    Items with equal keys keep their authored order.
    """
    keyed = [(period_key(label(item)), item) for item in items]
    dated = sorted(
        ((key, item) for key, item in keyed if key is not None), key=lambda pair: pair[0]
    )
    gaps = tuple(item for key, item in keyed if key is None)
    return (*(item for _, item in dated), *gaps), gaps
