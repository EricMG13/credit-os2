"""Digest schedule arithmetic: hand-written tables (month ends, leap day, year end) and properties
checked against a day-by-day oracle that shares no code with the production arithmetic."""

from __future__ import annotations

import calendar
import itertools
from datetime import UTC, date, datetime, time, timedelta, timezone

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_workflow.signal.schedule import (
    Schedule,
    ScheduleError,
    label,
    next_run,
    options,
    parse,
    previous_run,
)


def at(text: str) -> datetime:
    return datetime.fromisoformat(text).replace(tzinfo=UTC)


DAILY = Schedule("daily")  # 07:00 UTC
FRIDAY = Schedule("weekly", weekday=4)
MONTHLY_31 = Schedule("monthly", day=31)
MONTHLY_30 = Schedule("monthly", day=30)
MONTHLY_29 = Schedule("monthly", day=29)
MONTHLY_15 = Schedule("monthly", day=15)

# (schedule, after, next run). 2026-11-24 is a Tuesday; 2026-11-27 and 2027-01-01 are Fridays.
NEXT_TABLE = [
    (DAILY, "2026-11-24 06:59", "2026-11-24 07:00"),
    (DAILY, "2026-11-24 07:00", "2026-11-25 07:00"),  # strictly after: the run itself is past
    (DAILY, "2026-11-24 07:01", "2026-11-25 07:00"),
    (DAILY, "2026-12-31 08:00", "2027-01-01 07:00"),  # year end
    (DAILY, "2028-02-28 08:00", "2028-02-29 07:00"),  # leap day exists in 2028
    (DAILY, "2028-02-29 08:00", "2028-03-01 07:00"),
    (DAILY, "2027-02-28 08:00", "2027-03-01 07:00"),  # and not in 2027
    (FRIDAY, "2026-11-24 12:00", "2026-11-27 07:00"),
    (FRIDAY, "2026-11-27 06:59", "2026-11-27 07:00"),
    (FRIDAY, "2026-11-27 07:00", "2026-12-04 07:00"),
    (FRIDAY, "2026-12-29 12:00", "2027-01-01 07:00"),  # year end
    (MONTHLY_15, "2026-11-14 12:00", "2026-11-15 07:00"),
    (MONTHLY_15, "2026-11-15 07:00", "2026-12-15 07:00"),
    (MONTHLY_15, "2026-12-15 07:01", "2027-01-15 07:00"),  # year end
    (MONTHLY_31, "2026-01-31 07:00", "2026-02-28 07:00"),  # a short month: its last day
    (MONTHLY_31, "2026-02-28 07:00", "2026-03-31 07:00"),
    (MONTHLY_31, "2026-03-31 07:00", "2026-04-30 07:00"),
    (MONTHLY_31, "2028-01-31 07:00", "2028-02-29 07:00"),  # leap February
    (MONTHLY_31, "2026-11-30 07:00", "2026-12-31 07:00"),
    (MONTHLY_30, "2026-01-30 07:00", "2026-02-28 07:00"),
    (MONTHLY_30, "2028-01-30 07:00", "2028-02-29 07:00"),
    (MONTHLY_30, "2026-02-28 07:00", "2026-03-30 07:00"),
    (MONTHLY_29, "2027-01-29 07:00", "2027-02-28 07:00"),
    (MONTHLY_29, "2028-01-29 07:00", "2028-02-29 07:00"),  # the 29th exists in a leap February
    (MONTHLY_29, "2028-02-29 07:00", "2028-03-29 07:00"),
    (Schedule("monthly", 23 * 60 + 59, day=31), "2026-12-31 23:58", "2026-12-31 23:59"),
    (Schedule("monthly", 23 * 60 + 59, day=31), "2026-12-31 23:59", "2027-01-31 23:59"),
    (Schedule("daily", 0), "2026-12-31 23:59", "2027-01-01 00:00"),
]


@pytest.mark.parametrize(("schedule", "after", "expected"), NEXT_TABLE)
def test_next_run_table(schedule: Schedule, after: str, expected: str) -> None:
    assert next_run(schedule, at(after)) == at(expected)


# (schedule, before, previous run)
PREVIOUS_TABLE = [
    (DAILY, "2026-11-24 07:00", "2026-11-23 07:00"),  # strictly before
    (DAILY, "2026-11-24 07:01", "2026-11-24 07:00"),
    (DAILY, "2027-01-01 06:00", "2026-12-31 07:00"),
    (DAILY, "2028-03-01 06:00", "2028-02-29 07:00"),
    (FRIDAY, "2026-11-27 07:00", "2026-11-20 07:00"),
    (FRIDAY, "2026-11-27 07:01", "2026-11-27 07:00"),
    (FRIDAY, "2027-01-02 00:00", "2027-01-01 07:00"),
    (MONTHLY_15, "2026-11-15 07:00", "2026-10-15 07:00"),
    (MONTHLY_15, "2027-01-10 00:00", "2026-12-15 07:00"),
    (MONTHLY_31, "2026-03-31 07:00", "2026-02-28 07:00"),
    (MONTHLY_31, "2026-03-01 00:00", "2026-02-28 07:00"),
    (MONTHLY_31, "2028-03-31 07:00", "2028-02-29 07:00"),
    (MONTHLY_31, "2026-05-01 00:00", "2026-04-30 07:00"),
    (MONTHLY_30, "2026-03-30 07:00", "2026-02-28 07:00"),
]


@pytest.mark.parametrize(("schedule", "before", "expected"), PREVIOUS_TABLE)
def test_previous_run_table(schedule: Schedule, before: str, expected: str) -> None:
    assert previous_run(schedule, at(before)) == at(expected)


def test_a_time_with_another_zone_is_read_as_the_same_instant() -> None:
    plus_two = timezone(timedelta(hours=2))
    after = datetime(2026, 11, 24, 8, 30, tzinfo=plus_two)  # 06:30 UTC
    assert next_run(DAILY, after) == at("2026-11-24 07:00")
    assert next_run(DAILY, after).tzinfo == UTC


def test_a_time_without_a_zone_is_refused() -> None:
    with pytest.raises(ScheduleError):
        next_run(DAILY, datetime(2026, 11, 24, 6, 0))
    with pytest.raises(ScheduleError):
        previous_run(DAILY, datetime(2026, 11, 24, 6, 0))


@pytest.mark.parametrize(
    "bad",
    [
        {"cadence": "hourly"},
        {"cadence": "daily", "minute": 24 * 60},
        {"cadence": "daily", "minute": -1},
        {"cadence": "daily", "weekday": 1},
        {"cadence": "daily", "day": 1},
        {"cadence": "weekly"},
        {"cadence": "weekly", "weekday": 7},
        {"cadence": "weekly", "weekday": -1},
        {"cadence": "weekly", "weekday": 1, "day": 3},
        {"cadence": "monthly"},
        {"cadence": "monthly", "day": 0},
        {"cadence": "monthly", "day": 32},
        {"cadence": "monthly", "day": 5, "weekday": 1},
    ],
)
def test_a_schedule_must_name_real_days_and_times(bad: dict[str, object]) -> None:
    with pytest.raises(ScheduleError):
        Schedule(**bad)  # type: ignore[arg-type]


# Labels

LABELS = {
    "Daily, 07:00 UTC": Schedule("daily"),
    "Daily, 00:05 UTC": Schedule("daily", 5),
    "Weekly, Friday 07:00 UTC": FRIDAY,
    "Weekly, Monday 23:59 UTC": Schedule("weekly", 23 * 60 + 59, weekday=0),
    "Weekly, Sunday 07:00 UTC": Schedule("weekly", weekday=6),
    "Monthly, day 1, 07:00 UTC": Schedule("monthly", day=1),
    "Monthly, day 15, 07:00 UTC": MONTHLY_15,
    "Monthly, day 28, 07:00 UTC": Schedule("monthly", day=28),
    "Monthly, day 29 (or the last day of a shorter month), 07:00 UTC": MONTHLY_29,
    "Monthly, day 30 (or the last day of a shorter month), 07:00 UTC": MONTHLY_30,
    "Monthly, last day, 07:00 UTC": MONTHLY_31,
}


@pytest.mark.parametrize(("text", "schedule"), LABELS.items())
def test_labels_are_written_and_read_by_hand(text: str, schedule: Schedule) -> None:
    assert label(schedule) == text
    assert parse(text) == schedule


@pytest.mark.parametrize(
    "text",
    [
        "",
        "Daily",
        "daily, 07:00 UTC",
        "Daily, 7:00 UTC",
        "Daily, 24:00 UTC",
        "Daily, 07:60 UTC",
        "Daily, 07:00",
        "Daily, 07:00 UTC ",
        "Weekly, Friday",
        "Weekly, Funday 07:00 UTC",
        "Weekly, friday 07:00 UTC",
        "Monthly, day 0, 07:00 UTC",
        "Monthly, day 31, 07:00 UTC",  # the 31st is "last day"
        "Monthly, day 32, 07:00 UTC",
        "Monthly, day 5 (or the last day of a shorter month), 07:00 UTC",
        "Monthly, day 05, 07:00 UTC",
        "Monthly, day 29, 07:00 UTC",  # the note belongs to the 29th and 30th, and only to them
        "Hourly, 07:00 UTC",
        "Daily, 07:00 UTC\nDaily, 08:00 UTC",
    ],
)
def test_text_that_is_not_a_label_is_refused(text: str) -> None:
    with pytest.raises(ScheduleError):
        parse(text)


def test_the_options_are_daily_each_weekday_and_the_month_days() -> None:
    offered = options()
    assert offered[:8] == [
        "Daily, 07:00 UTC",
        "Weekly, Monday 07:00 UTC",
        "Weekly, Tuesday 07:00 UTC",
        "Weekly, Wednesday 07:00 UTC",
        "Weekly, Thursday 07:00 UTC",
        "Weekly, Friday 07:00 UTC",
        "Weekly, Saturday 07:00 UTC",
        "Weekly, Sunday 07:00 UTC",
    ]
    assert offered[8] == "Monthly, day 1, 07:00 UTC"
    assert offered[-2:] == ["Monthly, day 28, 07:00 UTC", "Monthly, last day, 07:00 UTC"]
    assert len(offered) == 8 + 28 + 1 == len(set(offered))
    assert all(parse(text).minute == 7 * 60 for text in offered)


# Properties, against a day-by-day oracle

schedules = st.one_of(
    st.builds(Schedule, st.just("daily"), st.integers(0, 24 * 60 - 1)),
    st.builds(Schedule, st.just("weekly"), st.integers(0, 24 * 60 - 1), weekday=st.integers(0, 6)),
    st.builds(Schedule, st.just("monthly"), st.integers(0, 24 * 60 - 1), day=st.integers(1, 31)),
)
instants = st.datetimes(min_value=datetime(1990, 1, 1), max_value=datetime(2200, 12, 31)).map(
    lambda naive: naive.replace(tzinfo=UTC)
)


def _is_run_day(schedule: Schedule, day: date) -> bool:
    if schedule.cadence == "daily":
        return True
    if schedule.cadence == "weekly":
        return day.weekday() == schedule.weekday
    assert schedule.day is not None
    month_length = calendar.monthrange(day.year, day.month)[1]
    return day.day == min(schedule.day, month_length)


def _slots(schedule: Schedule, around: datetime) -> list[datetime]:
    """Every run within 70 days either side of `around`, found by asking each day."""
    found = []
    for offset in range(-70, 71):
        day = (around + timedelta(days=offset)).date()
        if _is_run_day(schedule, day):
            clock = time(schedule.minute // 60, schedule.minute % 60)
            found.append(datetime.combine(day, clock, UTC))
    return found


@settings(max_examples=300, deadline=None)
@given(schedules, instants)
def test_next_run_is_the_first_run_after_the_instant(schedule: Schedule, after: datetime) -> None:
    expected = min(slot for slot in _slots(schedule, after) if slot > after)
    assert next_run(schedule, after) == expected


@settings(max_examples=300, deadline=None)
@given(schedules, instants)
def test_previous_run_is_the_last_run_before_the_instant(
    schedule: Schedule, before: datetime
) -> None:
    expected = max(slot for slot in _slots(schedule, before) if slot < before)
    assert previous_run(schedule, before) == expected


@settings(max_examples=300, deadline=None)
@given(schedules, instants)
def test_the_next_run_is_after_and_on_the_stated_day_and_time(
    schedule: Schedule, after: datetime
) -> None:
    run = next_run(schedule, after)
    assert run > after
    assert (run.hour * 60 + run.minute, run.second, run.microsecond) == (schedule.minute, 0, 0)
    assert run.utcoffset() == timedelta(0)
    if schedule.cadence == "weekly":
        assert run.weekday() == schedule.weekday
    if schedule.cadence == "monthly":
        assert schedule.day is not None
        assert run.day == min(schedule.day, calendar.monthrange(run.year, run.month)[1])


@settings(max_examples=200, deadline=None)
@given(schedules, instants)
def test_iterating_visits_each_period_once(schedule: Schedule, start: datetime) -> None:
    runs = [next_run(schedule, start)]
    for _ in range(40):
        runs.append(next_run(schedule, runs[-1]))
    for first, second in itertools.pairwise(runs):
        assert second > first
        if schedule.cadence == "daily":
            assert second - first == timedelta(days=1)
        elif schedule.cadence == "weekly":
            assert second - first == timedelta(days=7)
        else:
            assert (second.year * 12 + second.month) - (first.year * 12 + first.month) == 1
        # Going back from the second run lands on the first: nothing lies between them.
        assert previous_run(schedule, second) == first


@settings(max_examples=200, deadline=None)
@given(schedules, instants)
def test_next_and_previous_bracket_the_instant(schedule: Schedule, moment: datetime) -> None:
    assert previous_run(schedule, next_run(schedule, moment)) <= moment
    assert next_run(schedule, previous_run(schedule, moment)) >= moment


@given(schedules)
def test_every_schedule_reads_back_from_its_label(schedule: Schedule) -> None:
    assert parse(label(schedule)) == schedule
