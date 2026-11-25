"""The daily market backdrop: FRED's CSV read as exact decimals, the table arithmetic, the UTC day
and hour it runs at, "no new observation, no post", and the rule that nothing is fetched from a
market source the owner has not approved.

Every CSV here is SYNTHETIC: written by hand in the format of FRED's public
``fredgraph.csv?id=<SERIES>`` download (a header line naming the date column and the series id,
one line a day, "." or an empty cell for a day with no observation). No value here is a recorded
FRED observation, and nothing touches a network: fetches go to a fake. Expected values are worked
out by hand in the comments."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_workflow.signal import market, store
from deploy_workflow.signal.fetch import Fetched, FetchRefused
from deploy_workflow.signal.market import MarketError, Series
from deploy_workflow.signal.store import Conflict, Missing, StoreError, open_db

NOW = datetime(2026, 11, 25, 7, 0, tzinfo=UTC)  # a Wednesday, at the default hour

# SYNTHETIC: a spread series with a missing day (".") , an empty cell and a weekend gap.
HY = b"""observation_date,BAMLH0A0HYM2
2026-10-22,2.98
2026-10-23,3.00
2026-10-26,3.01
2026-11-16,3.25
2026-11-17,3.20
2026-11-18,
2026-11-19,3.10
2026-11-20,3.08
2026-11-23,.
2026-11-24,3.12
"""
# HY by hand: latest 3.12 on 24 Nov. Previous: 23 Nov is missing, so 20 Nov, 3.08: +0.04 = +4 bp.
# A week earlier: on or before 17 Nov: 17 Nov, 3.20: -0.08 = -8 bp. A month earlier: on or before
# 24 Oct: 23 Oct, 3.00: +0.12 = +12 bp.

# SYNTHETIC: a yield series in the older header form (DATE), a day behind, three decimals once.
TEN = b"""DATE,DGS10
2026-10-23,4.400
2026-11-17,4.35
2026-11-20,4.335
2026-11-23,4.30
"""
# DGS10 by hand: latest 4.30 on 23 Nov. Previous: 20 Nov, 4.335: -0.035 = -3.5 bp. A week earlier:
# on or before 16 Nov: 23 Oct, 4.400: -0.100 = -10 bp. A month earlier: on or before 23 Oct:
# 4.400: -10 bp.

SOFR_ONE = b"observation_date,SOFR\n2026-11-24,4.57\n"  # SYNTHETIC: one observation only
BAD_HEADER = b"observation_date,SOMETHING_ELSE\n2026-11-24,1.00\n"  # SYNTHETIC

SERIES = (
    Series("BAMLH0A0HYM2", "ICE BofA US High Yield Index Option-Adjusted Spread", "US HY",
           "Percent", "ICE Data Indices, LLC, via FRED"),
    Series("BAMLH0A1HYBB", "ICE BofA BB US High Yield Index Option-Adjusted Spread", "US BB",
           "Percent", "ICE Data Indices, LLC, via FRED"),
    Series("DGS2", "Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity, Quoted on"
           " an Investment Basis", "UST 2y", "Percent",
           "Board of Governors of the Federal Reserve System (US), via FRED"),
    Series("DGS10", "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted"
           " on an Investment Basis", "UST 10y", "Percent",
           "Board of Governors of the Federal Reserve System (US), via FRED"),
    Series("SOFR", "Secured Overnight Financing Rate", "SOFR", "Percent",
           "Federal Reserve Bank of New York, via FRED"),
)  # fmt: skip
URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={}"


class Fred:
    """A fake fetch: each series id answers from `bodies` (an exception is raised as given)."""

    def __init__(self, bodies: dict[str, bytes | Exception]) -> None:
        self.bodies = bodies
        self.calls: list[str] = []

    def __call__(self, url: str, etag: str | None, modified: str | None) -> Fetched:
        self.calls.append(url)
        assert (etag, modified) == (None, None)
        answer = self.bodies[url.rsplit("=", 1)[1]]
        if isinstance(answer, Exception):
            raise answer
        return Fetched(answer, None, None)


BODIES: dict[str, bytes | Exception] = {
    "BAMLH0A0HYM2": HY,
    "BAMLH0A1HYBB": BAD_HEADER,
    "DGS2": FetchRefused("server answered HTTP 500"),
    "DGS10": TEN,
    "SOFR": SOFR_ONE,
}


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    held = open_db(tmp_path)
    yield held
    held.close()


def _approved(db: sqlite3.Connection, series: tuple[Series, ...] = SERIES) -> int:
    source = market.propose(db, "Ida Owner", series=series)
    store.set_source_state(db, source, "approved")
    return source


# Reading FRED's CSV


def test_values_are_exact_decimals_and_missing_cells_are_skipped_never_zero():
    got = market.parse_csv(HY, "BAMLH0A0HYM2")
    assert [(o.day, o.text) for o in got][-3:] == [
        (date(2026, 11, 19), "3.10"),
        (date(2026, 11, 20), "3.08"),
        (date(2026, 11, 24), "3.12"),
    ]
    assert len(got) == 8  # ten lines, two of them no observation
    assert got[-1].value == Decimal("3.12") and isinstance(got[-1].value, Decimal)
    assert market.parse_csv(TEN, "DGS10")[0].text == "4.400"  # kept as FRED wrote it


@pytest.mark.parametrize(
    ("body", "words"),
    [
        (BAD_HEADER, "the CSV's header is not observation_date,BAMLH0A0HYM2"),
        (b"", "the CSV's header is not observation_date,BAMLH0A0HYM2"),
        (b"observation_date,BAMLH0A0HYM2\n2026-11-24,1e3\n", "line 2: '1e3' is not a number"),
        (b"observation_date,BAMLH0A0HYM2\n2026-11-24,NaN\n", "line 2: 'NaN' is not a number"),
        (b"observation_date,BAMLH0A0HYM2\n24/11/2026,1.0\n", "line 2: '24/11/2026' is not a date"),
        (
            b"observation_date,BAMLH0A0HYM2\n2026-11-24,1.0\n2026-11-24,1.1\n",
            "line 3: 2026-11-24 is not after the line before",
        ),
        (b"observation_date,BAMLH0A0HYM2\n2026-11-24\n", "line 2 does not hold two cells"),
        (b"\xff\xfe", "the CSV is not UTF-8 text"),
    ],
)
def test_a_csv_that_cannot_be_read_says_why(body, words):
    with pytest.raises(MarketError, match=words.replace("(", r"\(").replace(")", r"\)")):
        market.parse_csv(body, "BAMLH0A0HYM2")


# The table


def test_the_table_by_hand(db):
    _approved(db)
    outcome = market.attempt(db, NOW, Fred(BODIES))
    assert outcome.story_id == 1 and outcome.reason == "posted story 1"
    story = db.execute("SELECT title, summary, link, published_at FROM stories").fetchone()
    assert tuple(story) == (
        "Market backdrop: 24 November 2026",
        (
            "US HY 3.12% (+4 bp); US BB not available; UST 2y not available; UST 10y 4.30%"
            " (-3.5 bp); SOFR 4.57%"
        ),
        "https://fred.stlouisfed.org/",
        "2026-11-25T07:00:00+00:00",
    )
    rows = market.post_rows(db, 1)
    assert [(r.series.id, r.latest.text if r.latest else None) for r in rows] == [
        ("BAMLH0A0HYM2", "3.12"),
        ("BAMLH0A1HYBB", None),
        ("DGS2", None),
        ("DGS10", "4.30"),
        ("SOFR", "4.57"),
    ]
    hy, bb, two, ten, sofr = rows
    assert [(c.label, c.since, c.change) for c in hy.changes] == [
        ("Previous", date(2026, 11, 20), Decimal("0.04")),
        ("Week", date(2026, 11, 17), Decimal("-0.08")),
        ("Month", date(2026, 10, 23), Decimal("0.12")),
    ]
    assert [(c.since, c.change) for c in ten.changes] == [
        (date(2026, 11, 20), Decimal("-0.035")),
        (date(2026, 10, 23), Decimal("-0.100")),
        (date(2026, 10, 23), Decimal("-0.100")),
    ]
    assert [(c.since, c.change) for c in sofr.changes] == [(None, None)] * 3
    assert bb.problem == "Could not be read: the CSV's header is not observation_date,BAMLH0A1HYBB"
    assert two.problem == "Could not be read: server answered HTTP 500"
    assert ten.latest is not None and ten.latest.day == date(2026, 11, 23)  # its own date


@pytest.mark.parametrize(
    ("change", "unit", "text"),
    [
        (Decimal("0.04"), "Percent", "+4 bp"),
        (Decimal("-0.08"), "Percent", "-8 bp"),
        (Decimal("-0.035"), "Percent", "-3.5 bp"),
        (Decimal("0.00"), "Percent", "0 bp"),
        (Decimal("-0.000"), "Percent", "0 bp"),
        (Decimal("1.2345"), "Percent", "+123.45 bp"),
        (Decimal(12), "Percent", "+1200 bp"),
        (Decimal("-1.50"), "Index", "-1.5 Index"),
        (Decimal(250), "Billions of U.S. Dollars", "+250 Billions of U.S. Dollars"),
    ],
)
def test_a_change_is_shown_in_basis_points_for_percent_and_in_its_unit_otherwise(
    change, unit, text
):
    assert market.change_text(change, unit) == text


def test_a_month_earlier_is_the_same_day_clamped_to_the_shorter_month():
    assert market.month_before(date(2026, 3, 31)) == date(2026, 2, 28)
    assert market.month_before(date(2028, 3, 31)) == date(2028, 2, 29)
    assert market.month_before(date(2026, 1, 15)) == date(2025, 12, 15)
    assert market.month_before(date(2026, 11, 24)) == date(2026, 10, 24)


def test_no_judgement_word_is_written():
    words = ("better", "worse", "improv", "deteriorat", "risk", "good", "bad", "wider", "tighter")
    db_text = " ".join(
        market.change_text(Decimal(n), unit) for n in ("0.5", "-0.5") for unit in ("Percent", "X")
    )
    assert not any(word in db_text.lower() for word in words)


@settings(max_examples=200, deadline=None)
@given(
    days=st.lists(
        st.tuples(
            st.integers(min_value=0, max_value=120),
            st.one_of(st.none(), st.decimals(min_value=-50, max_value=50, places=3)),
        ),
        min_size=1,
        max_size=40,
        unique_by=lambda one: one[0],
    )
)
def test_every_comparison_is_the_latest_observation_on_or_before_its_day(days):
    """Against a plain search written here: the latest observation, then for each comparison
    the latest observation on or before its day, missing cells passed over; each change exactly
    latest minus earlier."""
    start = date(2026, 7, 1)
    ordered = sorted(days)
    lines = ["observation_date,X"] + [
        f"{start + timedelta(days=n)},{'.' if v is None else format(v, 'f')}" for n, v in ordered
    ]
    observed = [(start + timedelta(days=n), v) for n, v in ordered if v is not None]
    row = market.row_of(Series("X", "X", "X", "Percent", "s"), "\n".join(lines).encode())
    if not observed:
        assert row.latest is None and row.problem == "No observation in the data"
        return
    latest_day, latest = observed[-1]
    assert row.latest is not None and (row.latest.day, row.latest.value) == (latest_day, latest)

    def on_or_before(limit: date) -> tuple[date, Decimal] | None:
        held = [one for one in observed if one[0] <= limit]
        return held[-1] if held else None

    expected = [
        on_or_before(latest_day - timedelta(days=1)),
        on_or_before(latest_day - timedelta(days=7)),
        on_or_before(market.month_before(latest_day)),
    ]
    for change, want in zip(row.changes, expected, strict=True):
        if want is None:
            assert (change.since, change.change) == (None, None)
        else:
            assert (change.since, change.change) == (want[0], latest - want[1])
            shown = market.change_text(latest - want[1], "Percent")
            number = Decimal(shown.removesuffix(" bp").replace("+", ""))
            assert number == (latest - want[1]) * 100  # the basis points, exactly


# When it runs: the UTC day and the stored hour


def test_it_is_due_from_the_stored_hour_utc_once_a_day(db):
    _approved(db)
    assert not market.due(db, datetime(2026, 11, 25, 6, 59, 59, tzinfo=UTC))
    assert market.due(db, NOW)
    # 08:30 at UTC+2 is 06:30 UTC: not yet.
    assert not market.due(db, datetime(2026, 11, 25, 8, 30, tzinfo=timezone(timedelta(hours=2))))
    market.attempt(db, NOW, Fred(BODIES))
    assert not market.due(db, datetime(2026, 11, 25, 23, 59, tzinfo=UTC))
    assert not market.due(db, datetime(2026, 11, 26, 0, 0, tzinfo=UTC))  # a new day, before 07:00
    assert market.due(db, datetime(2026, 11, 26, 7, 0, tzinfo=UTC))
    market.set_hour(db, 13, NOW)
    assert not market.due(db, datetime(2026, 11, 26, 12, 59, tzinfo=UTC))
    assert market.due(db, datetime(2026, 11, 26, 13, 0, tzinfo=UTC))


def test_an_attempt_that_read_nothing_is_tried_again_an_hour_later_the_same_utc_day(db):
    _approved(db)
    down = Fred({key: FetchRefused("could not resolve fred.stlouisfed.org") for key in BODIES})
    outcome = market.attempt(db, datetime(2026, 11, 25, 22, 30, tzinfo=UTC), down)
    assert outcome.story_id is None and outcome.reason == "no series could be read"
    assert tuple(db.execute("SELECT ok, reason FROM source_checks").fetchone()) == (
        0,
        "no series could be read",
    )
    assert not market.due(db, datetime(2026, 11, 25, 23, 29, tzinfo=UTC))
    assert market.due(db, datetime(2026, 11, 25, 23, 30, tzinfo=UTC))
    assert not market.due(db, datetime(2026, 11, 26, 0, 30, tzinfo=UTC))  # next day: from 07:00


def test_no_new_observation_means_no_post_and_one_new_one_means_a_post(db):
    _approved(db)
    market.attempt(db, NOW, Fred(BODIES))
    again = market.attempt(db, NOW + timedelta(days=1), Fred(BODIES))
    assert (again.story_id, again.reason) == (None, "no new observation since the last post")
    assert db.execute("SELECT COUNT(*) FROM stories").fetchone()[0] == 1
    newer = dict(BODIES, SOFR=SOFR_ONE + b"2026-11-25,4.58\n")
    third = market.attempt(db, NOW + timedelta(days=2), Fred(newer))
    assert third.story_id == 2
    assert db.execute("SELECT title FROM stories WHERE id=2").fetchone()[0] == (
        "Market backdrop: 25 November 2026"
    )


def test_one_post_a_utc_day_at_most(db):
    _approved(db)
    market.attempt(db, NOW, Fred(BODIES))
    newer = dict(BODIES, SOFR=SOFR_ONE + b"2026-11-25,4.58\n")
    with pytest.raises(Conflict, match="today's market post is written already: story 1"):
        market.post_now(db, NOW + timedelta(hours=9), Fred(newer))


def test_an_unapproved_market_source_is_never_fetched(db):
    market.propose(db, "Ida Owner", series=SERIES)
    fred = Fred(BODIES)
    assert market.run_due(db, NOW, fred) is None
    with pytest.raises(StoreError, match="no approved market source"):
        market.post_now(db, NOW, fred)
    store.set_source_state(db, 1, "paused")
    assert market.run_due(db, NOW, fred) is None
    assert fred.calls == []


def test_the_post_fetches_one_address_per_series_through_the_fetch_function(db):
    _approved(db)
    fred = Fred(BODIES)
    market.run_due(db, NOW, fred)
    assert fred.calls == [URL.format(s.id) for s in SERIES]


# Proposing the source and the series


def test_propose_stores_the_market_source_with_the_default_series(db):
    source = market.propose(db, "Ida Owner")
    row = db.execute("SELECT name, kind, url, state, proposed_by FROM sources").fetchone()
    assert tuple(row) == (
        "Market backdrop (FRED)",
        "market",
        "https://fred.stlouisfed.org/graph/fredgraph.csv",
        "proposed",
        "Ida Owner",
    )
    assert source == 1
    assert [s.id for s in market.series(db)] == [
        "BAMLH0A0HYM2",
        "BAMLH0A1HYBB",
        "BAMLH0A2HYB",
        "BAMLH0A3HYC",
        "BAMLHE00EHYIOAS",
        "DGS2",
        "DGS10",
        "SOFR",
    ]
    assert (
        market.series(db)[3].title
        == "ICE BofA CCC & Lower US High Yield Index Option-Adjusted Spread"
    )
    assert {s.unit for s in market.series(db)} == {"Percent"}
    with pytest.raises(Conflict, match="the market source is stored already: source 1"):
        market.propose(db, "Ida Owner")


def test_series_are_added_and_removed_by_id_and_bounded(db):
    market.propose(db, "Ida Owner", series=())
    market.add_series(db, Series("dgs5", "Five-year", "UST 5y", "Percent", "FRB via FRED"), NOW)
    assert [s.id for s in market.series(db)] == ["DGS5"]  # FRED ids are upper case
    with pytest.raises(Conflict, match="DGS5 is already a series"):
        market.add_series(db, Series("DGS5", "Again", "x", "Percent", "s"), NOW)
    for bad in ("DGS 5", "", "x" * 41, "DGS5;DROP"):
        with pytest.raises(StoreError, match="a FRED series id is 1 to 40 letters, digits"):
            market.add_series(db, Series(bad, "T", "s", "Percent", "s"), NOW)
    market.remove_series(db, "dgs5")
    assert market.series(db) == []
    with pytest.raises(Missing, match="no series DGS5"):
        market.remove_series(db, "DGS5")
    for number in range(20):
        market.add_series(db, Series(f"S{number}", "T", "s", "Percent", "s"), NOW)
    with pytest.raises(Conflict, match="at most 20 series"):
        market.add_series(db, Series("S20", "T", "s", "Percent", "s"), NOW)


def test_a_post_with_many_series_keeps_its_summary_within_300_characters(db):
    many = tuple(Series(f"S{n}", "T", f"Series number {n}", "Percent", "s") for n in range(20))
    _approved(db, many)
    bodies: dict[str, bytes | Exception] = {
        f"S{n}": f"observation_date,S{n}\n2026-11-24,1.25\n".encode() for n in range(20)
    }
    market.attempt(db, NOW, Fred(bodies))
    summary = db.execute("SELECT summary FROM stories").fetchone()[0]
    assert len(summary) <= 300 and summary.startswith("Series number 0 1.25%; Series number 1")
    # Twelve entries fit with the ending: 10 of 21 characters and 2 of 22, 11 separators of 2 and
    # "; and 8 more series" (19): 295. A thirteenth would make 319.
    assert summary.endswith("Series number 11 1.25%; and 8 more series")


def test_the_hour_is_a_whole_number_from_0_to_23(db):
    for bad in (-1, 24):
        with pytest.raises(StoreError, match="the hour is a whole number from 0 to 23"):
            market.set_hour(db, bad, NOW)
    market.set_hour(db, 0, NOW)
    assert market.hour(db) == 0


def test_a_post_with_no_series_says_so_and_fetches_nothing(db):
    """Review doubt: with every series removed, the attempt said "no series could be read"."""
    _approved(db, ())
    fred = Fred({})
    outcome = market.attempt(db, NOW, fred)
    assert (outcome.story_id, outcome.reason) == (
        None,
        "the market post reads no series; add one with: signal market series add",
    )
    assert fred.calls == [] and db.execute("SELECT ok FROM source_checks").fetchone()[0] == 0
