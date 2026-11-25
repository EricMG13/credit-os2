"""When a digest runs: daily, weekly (a day of the week) or monthly (a day of the month), at a time.

Every time here is UTC, and so is every delivered label (they say "UTC"). The arithmetic is two pure
functions of ``(schedule, instant)``: ``next_run`` is the first run strictly after an instant and
``previous_run`` the last run strictly before it, so a run time is always on the stated day and
time, and stepping from one run to the next visits every period once.

A monthly digest set for a day a shorter month does not have (the 29th, 30th or 31st) runs on that
month's last day, so it still runs once every month. A digest set for the 31st is offered as "last
day of the month".
"""

from __future__ import annotations

import calendar
import re
from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta
from typing import Literal

Cadence = Literal["daily", "weekly", "monthly"]
CADENCES: tuple[Cadence, ...] = ("daily", "weekly", "monthly")
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
DEFAULT_MINUTE = 7 * 60  # the time of day the form offers
LAST_DAY = 31  # "last day of the month" is day 31, which a shorter month clamps
_SHORT_MONTH_NOTE = " (or the last day of a shorter month)"


class ScheduleError(ValueError):
    """A schedule that names no real day or time, or text that is not a schedule."""


@dataclass(frozen=True)
class Schedule:
    """`minute` is minutes after 00:00 UTC; `weekday` is 0 (Monday) to 6, for a weekly digest;
    `day` is 1 to 31, for a monthly one. A field the cadence does not use must be None."""

    cadence: Cadence
    minute: int = DEFAULT_MINUTE
    weekday: int | None = None
    day: int | None = None

    def __post_init__(self) -> None:
        if self.cadence not in CADENCES:
            raise ScheduleError(f"unknown cadence {self.cadence!r}")
        if not 0 <= self.minute < 24 * 60:
            raise ScheduleError("the time of day must be from 00:00 to 23:59")
        wanted_weekday = self.cadence == "weekly"
        wanted_day = self.cadence == "monthly"
        if (self.weekday is not None) != wanted_weekday or (self.day is not None) != wanted_day:
            raise ScheduleError(f"a {self.cadence} schedule has the wrong day fields")
        if self.weekday is not None and not 0 <= self.weekday <= 6:
            raise ScheduleError("the weekday must be from 0 (Monday) to 6 (Sunday)")
        if self.day is not None and not 1 <= self.day <= LAST_DAY:
            raise ScheduleError("the day of the month must be from 1 to 31")


def _utc(at: datetime) -> datetime:
    if at.tzinfo is None or at.utcoffset() is None:
        raise ScheduleError("a time must carry its time zone")
    return at.astimezone(UTC)


def _at(day: datetime, schedule: Schedule) -> datetime:
    """`day`'s date at the schedule's time of day."""
    return datetime.combine(day.date(), time(schedule.minute // 60, schedule.minute % 60), UTC)


def _monthly(year: int, month: int, schedule: Schedule) -> datetime:
    """The run of `month`: the schedule's day, or the month's last day when it has fewer days."""
    assert schedule.day is not None
    last = calendar.monthrange(year, month)[1]
    stamp = datetime(year, month, min(schedule.day, last), tzinfo=UTC)
    return _at(stamp, schedule)


def _month_step(year: int, month: int, step: int) -> tuple[int, int]:
    index = year * 12 + (month - 1) + step
    return index // 12, index % 12 + 1


def next_run(schedule: Schedule, after: datetime) -> datetime:
    """The first run strictly after `after`, in UTC."""
    moment = _utc(after)
    if schedule.cadence == "daily":
        found = _at(moment, schedule)
        return found if found > moment else found + timedelta(days=1)
    if schedule.cadence == "weekly":
        assert schedule.weekday is not None
        ahead = (schedule.weekday - moment.weekday()) % 7
        found = _at(moment + timedelta(days=ahead), schedule)
        return found if found > moment else found + timedelta(days=7)
    found = _monthly(moment.year, moment.month, schedule)
    if found > moment:
        return found
    return _monthly(*_month_step(moment.year, moment.month, 1), schedule)


def previous_run(schedule: Schedule, before: datetime) -> datetime:
    """The last run strictly before `before`, in UTC."""
    moment = _utc(before)
    if schedule.cadence == "daily":
        found = _at(moment, schedule)
        return found if found < moment else found - timedelta(days=1)
    if schedule.cadence == "weekly":
        assert schedule.weekday is not None
        behind = (moment.weekday() - schedule.weekday) % 7
        found = _at(moment - timedelta(days=behind), schedule)
        return found if found < moment else found - timedelta(days=7)
    found = _monthly(moment.year, moment.month, schedule)
    if found < moment:
        return found
    return _monthly(*_month_step(moment.year, moment.month, -1), schedule)


# Delivered text: the labels the digest form offers and the route reads back.

_CLOCK = r"([01][0-9]|2[0-3]):([0-5][0-9]) UTC"
_DAILY = re.compile(rf"Daily, {_CLOCK}")
_WEEKLY = re.compile(rf"Weekly, ({'|'.join(WEEKDAYS)}) {_CLOCK}")
_MONTH_DAY = re.compile(
    rf"Monthly, day (?:([1-9]|1[0-9]|2[0-8])|(29|30){re.escape(_SHORT_MONTH_NOTE)}), {_CLOCK}"
)
_MONTH_LAST = re.compile(rf"Monthly, last day, {_CLOCK}")


def label(schedule: Schedule) -> str:
    """The schedule as the form words it, e.g. "Weekly, Friday 07:00 UTC"."""
    clock = f"{schedule.minute // 60:02d}:{schedule.minute % 60:02d} UTC"
    if schedule.cadence == "daily":
        return f"Daily, {clock}"
    if schedule.weekday is not None:
        return f"Weekly, {WEEKDAYS[schedule.weekday]} {clock}"
    assert schedule.day is not None
    if schedule.day == LAST_DAY:
        return f"Monthly, last day, {clock}"
    note = _SHORT_MONTH_NOTE if schedule.day > 28 else ""
    return f"Monthly, day {schedule.day}{note}, {clock}"


def parse(text: str) -> Schedule:
    """The schedule a `label` names; ScheduleError for any other text."""
    if (found := _DAILY.fullmatch(text)) is not None:
        return Schedule("daily", _minute(found.group(1), found.group(2)))
    if (found := _WEEKLY.fullmatch(text)) is not None:
        return Schedule(
            "weekly", _minute(found.group(2), found.group(3)), weekday=WEEKDAYS.index(found[1])
        )
    if (found := _MONTH_DAY.fullmatch(text)) is not None:
        day = int(found.group(1) or found.group(2))
        return Schedule("monthly", _minute(found.group(3), found.group(4)), day=day)
    if (found := _MONTH_LAST.fullmatch(text)) is not None:
        return Schedule("monthly", _minute(found.group(1), found.group(2)), day=LAST_DAY)
    raise ScheduleError(f"{text[:80]!r} is not one of the schedules offered")


def _minute(hours: str, minutes: str) -> int:
    return int(hours) * 60 + int(minutes)


def options() -> list[str]:
    """The schedules the form offers, in the order it lists them: daily, each weekday, then the
    days 1 to 28 of the month and the last day. All are at 07:00 UTC."""
    offered = [Schedule("daily")]
    offered += [Schedule("weekly", weekday=weekday) for weekday in range(7)]
    offered += [Schedule("monthly", day=day) for day in (*range(1, 29), LAST_DAY)]
    return [label(one) for one in offered]
