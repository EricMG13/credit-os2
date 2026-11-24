"""The Top order (spec 5.6): one deterministic function, tested with hand-written cases and the
property tests the spec asks for. Strength is the AI pass's and absent today."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from hypothesis import given
from hypothesis import strategies as st

from deploy_workflow.signal.threadrank import Standing, top_order

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)


def story(n: int, hours: float, shares: int = 0, comments: int = 0, strength: int | None = None):
    return Standing(n, NOW - timedelta(hours=hours), shares, comments, strength)


def test_with_nothing_but_age_top_is_the_latest_order():
    items = [story(1, 5), story(2, 1), story(3, 30), story(4, 1)]
    assert top_order(items, NOW) == [4, 2, 1, 3]  # equal times: the higher id first


def test_a_share_outweighs_a_day_of_age_and_four_comments_equal_a_share():
    # Doubling the raise is worth one half-life (24 h): a share takes 1 to 2.
    assert top_order([story(1, 0), story(2, 23, shares=1)], NOW) == [2, 1]
    assert top_order([story(1, 0), story(2, 25, shares=1)], NOW) == [1, 2]
    assert top_order([story(1, 10, shares=1), story(2, 10, comments=4)], NOW) == [2, 1]


def test_strength_raises_a_story_when_it_exists():
    assert top_order([story(1, 0), story(2, 20, strength=3)], NOW) == [2, 1]
    assert top_order([story(1, 0, strength=1), story(2, 0)], NOW) == [2, 1]  # 1 equals absent


def test_a_years_old_story_and_a_future_time_still_order():
    assert top_order([story(1, 24 * 3650), story(2, 24 * 3650, shares=1), story(3, -5)], NOW) == [
        3,
        2,
        1,
    ]


ages = st.floats(min_value=0, max_value=24 * 400, allow_nan=False)
standings = st.lists(
    st.tuples(ages, st.integers(0, 20), st.integers(0, 200), st.sampled_from([None, 1, 2, 3])),
    min_size=1,
    max_size=25,
).map(lambda rows: [story(i + 1, *row) for i, row in enumerate(rows)])


@given(standings)
def test_top_is_a_deterministic_order_of_the_same_ids(items):
    first = top_order(items, NOW)
    assert sorted(first) == sorted(item.story_id for item in items)
    assert top_order(list(reversed(items)), NOW) == first


@given(st.lists(st.tuples(ages, st.integers(0, 3)), min_size=1, max_size=25))
def test_without_engagement_or_strength_top_equals_latest(rows):
    items = [story(i + 1, hours) for i, (hours, _) in enumerate(rows)]
    latest = sorted(items, key=lambda s: (s.published_at, s.story_id), reverse=True)
    assert top_order(items, NOW) == [s.story_id for s in latest]


@given(standings, st.data())
def test_more_shares_comments_or_strength_never_lower_a_story(items, data):
    index = data.draw(st.integers(0, len(items) - 1))
    before = top_order(items, NOW).index(items[index].story_id)
    one = items[index]
    raised = Standing(
        one.story_id,
        one.published_at,
        one.shares + data.draw(st.integers(0, 5)),
        one.comments + data.draw(st.integers(0, 50)),
        max(one.strength or 1, data.draw(st.sampled_from([1, 2, 3]))),
    )
    changed = [*items[:index], raised, *items[index + 1 :]]
    assert top_order(changed, NOW).index(one.story_id) <= before


@given(standings, st.data())
def test_an_older_copy_of_a_story_never_ranks_above_it(items, data):
    one = data.draw(st.sampled_from(items))
    older = Standing(
        10_000,
        one.published_at - timedelta(hours=data.draw(st.floats(0.01, 500))),
        one.shares,
        one.comments,
        one.strength,
    )
    order = top_order([*items, older], NOW)
    assert order.index(one.story_id) < order.index(10_000)


def test_a_comment_is_worth_a_quarter_of_a_share():
    # 48 h of age halves twice: a story needs a raise above 4 to beat an untouched new one.
    # One share and four comments: 1 + 1 + 1 = 3, below; one share and twelve: 5, above.
    assert top_order([story(1, 0), story(2, 48, shares=1, comments=4)], NOW) == [1, 2]
    assert top_order([story(1, 0), story(2, 48, shares=1, comments=12)], NOW) == [2, 1]
    # Eight comments alone: 1 + 2 = 3, below; with weight 1 they would be 9, above.
    assert top_order([story(1, 0), story(2, 48, comments=8)], NOW) == [1, 2]
