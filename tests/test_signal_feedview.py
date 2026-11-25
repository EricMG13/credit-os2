import sqlite3
import tempfile
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.feedview import Page, ViewError, feed, new_count, save, unsave
from deploy_workflow.signal.store import add_story, open_db, propose_source, set_source_state
from deploy_workflow.signal.topics import add_topic, follow

FETCHED = datetime(2026, 11, 13, 9, 40, tzinfo=UTC)
LAST = datetime(2026, 11, 13, 9, 35, tzinfo=UTC)


def build_feed_db(root: Path):
    """Two sources, 35 regulator stories one minute apart, a newer wire story, one link fold."""
    db = open_db(root)
    for name, kind, url in (
        ("Authority", "regulator", "https://a.org/f"),
        ("Wire", "news", "https://w.org/f"),
    ):
        set_source_state(db, propose_source(db, name, kind, url, "x"), "approved")
    for n in range(1, 36):
        entry = Entry(
            f"Story {n:02d}",
            f"https://a.org/{n}",
            LAST - timedelta(minutes=35 - n),
            f"Summary {n}",
        )
        add_story(db, 1, entry, FETCHED)
    # Same link as source 1's Story 35: a link fold (titles under four words never fold by title).
    same_link = Entry("Story 35", "https://a.org/35", LAST, "Summary 35")
    assert add_story(db, 2, same_link, FETCHED) == "duplicate"
    wire = Entry(
        "Wire piece on remedy", "https://w.org/1", LAST + timedelta(minutes=1), "About a remedy"
    )
    add_story(db, 2, wire, FETCHED)
    add_topic(db, "Remedy", ["remedy"], [], "x")
    return db


@pytest.fixture
def db_feed(tmp_path):
    db = build_feed_db(tmp_path)
    yield db
    db.close()


@contextmanager
def feed_db():
    with tempfile.TemporaryDirectory() as folder:
        db = build_feed_db(Path(folder))
        try:
            yield db
        finally:
            db.close()


def test_latest_pages_by_30_newest_first(db_feed):
    first = feed(db_feed, "ak", "latest")
    assert len(first.cards) == 30 and first.cards[0].title == "Wire piece on remedy"
    assert first.cards[1].title == "Story 35" and first.cards[1].other_sources == 1
    second = feed(db_feed, "ak", "latest", before=first.next_before)
    assert [c.title for c in second.cards] == [f"Story {n:02d}" for n in range(6, 0, -1)]
    assert second.next_before is None


def test_kind_filter_and_card_fields(db_feed):
    page = feed(db_feed, "ak", "latest", kind="news")
    (card,) = page.cards
    assert (card.source, card.kind, card.published_at, card.saved, card.topics) == (
        "Wire",
        "news",
        "2026-11-13T09:36:00+00:00",
        False,
        ("Remedy",),
    )


def test_foryou_is_followed_topics_only(db_feed):
    assert feed(db_feed, "ak", "foryou").cards == ()
    follow(db_feed, "ak", 1)
    assert [c.title for c in feed(db_feed, "ak", "foryou").cards] == ["Wire piece on remedy"]
    assert feed(db_feed, "ml", "foryou").cards == ()


def test_topic_view_and_unknown_topic(db_feed):
    assert len(feed(db_feed, "ak", "topic:1").cards) == 1
    with pytest.raises(ViewError):
        feed(db_feed, "ak", "topic:99")


def test_save_is_personal_idempotent_and_listed(db_feed):
    save(db_feed, "ak", 5)
    save(db_feed, "ak", 5)
    assert [c.id for c in feed(db_feed, "ak", "saved").cards] == [5]
    assert feed(db_feed, "ml", "saved").cards == ()
    before = "2026-11-13T09:06:00+00:00|6"
    assert next(c for c in feed(db_feed, "ak", "latest", before=before).cards if c.id == 5).saved
    unsave(db_feed, "ak", 5)
    unsave(db_feed, "ak", 5)
    assert feed(db_feed, "ak", "saved").cards == ()
    with pytest.raises(ViewError):
        save(db_feed, "ak", 9999)


def test_search_matches_all_terms(db_feed):
    found = feed(db_feed, "ak", "latest", query="wire remedy").cards
    assert [c.title for c in found] == ["Wire piece on remedy"]
    assert feed(db_feed, "ak", "latest", query="wire absent").cards == ()


@pytest.mark.parametrize(
    "query", ['"', 'a"b', "*", "NEAR", "x AND", "-", "(", "title:x", "\x00", "ß" * 300]
)
def test_search_text_is_never_query_syntax(db_feed, query):
    feed(db_feed, "ak", "latest", query=query)  # must not raise


@settings(suppress_health_check=[HealthCheck.too_slow], deadline=None, max_examples=50)
@given(st.text(max_size=200))
def test_any_search_text_returns_a_page(query):
    with feed_db() as db:
        assert isinstance(feed(db, "ak", "latest", query=query), Page)


@pytest.mark.parametrize(
    "bad",
    [
        {"view": "top"},
        {"view": "latest", "kind": "blog"},
        {"view": "latest", "before": "x"},
        {"view": "topic:abc"},
    ],
)
def test_bad_requests_raise_view_error(db_feed, bad):
    with pytest.raises(ViewError):
        feed(db_feed, "ak", **bad)


def test_page_reports_the_newest_story_id(db_feed):
    assert feed(db_feed, "ak", "latest").newest == 36


def test_new_count_counts_ids_after_the_cursor(db_feed):
    assert new_count(db_feed, "ak", "latest", 36) == 0
    assert new_count(db_feed, "ak", "latest", 30) == 6
    assert new_count(db_feed, "ak", "latest", 0) == 36
    assert new_count(db_feed, "ak", "topic:1", 0) == 1


@pytest.mark.parametrize("after", [-1, 2**63, True, "x", 1.5, None])
def test_new_count_refuses_a_bad_after(db_feed, after):
    with pytest.raises(ViewError):
        new_count(db_feed, "ak", "latest", after)


def test_empty_store_newest_is_zero(tmp_path):
    db = open_db(tmp_path)
    try:
        assert feed(db, "ak", "latest").newest == 0
    finally:
        db.close()


def test_story_stored_after_the_load_with_an_earlier_fetched_at_is_counted(db_feed):
    """An ingest pass stamps fetched_at at its start but commits later."""
    loaded = feed(db_feed, "ak", "latest").newest
    early = FETCHED - timedelta(hours=1)  # earlier than the page load, inserted after it
    entry = Entry("Late commit story", "https://a.org/late", LAST, "Committed after the load")
    assert add_story(db_feed, 1, entry, early) == "new"
    assert new_count(db_feed, "ak", "latest", loaded) == 1


@pytest.mark.parametrize(
    "bad",
    [
        {"view": "topic:99999999999999999999"},
        {"view": "latest", "before": "2026-11-13T09:00:00+00:00|99999999999999999999"},
        {"view": "latest", "before": "2026-11-13T09:00:00|5"},
    ],
)
def test_oversized_ids_and_zoneless_cursor_raise_view_error(db_feed, bad):
    with pytest.raises(ViewError):
        feed(db_feed, "ak", **bad)


def test_ids_of_thousands_of_digits_raise_view_error(db_feed):
    with pytest.raises(ViewError):
        feed(db_feed, "ak", "topic:" + "9" * 5000)
    with pytest.raises(ViewError):
        feed(db_feed, "ak", "latest", before="2026-11-13T09:00:00+00:00|" + "9" * 5000)


def _stale_store(root: Path, stories: int, members: list[int]) -> object:
    """`stories` stories, story n published n minutes after the first; topic 1 holds `members`;
    "ak" saves the same stories and follows topic 1."""
    db = open_db(root)
    base = datetime(2026, 1, 1, tzinfo=UTC)
    with db:
        db.execute(
            "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
            " VALUES('W', 'news', 'https://w.example/f', 'approved', 'x', 'x')"
        )
        db.executemany(
            "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(1, 'S', ?, ?, 't', ?, 'x', '')",
            [
                (f"https://w.example/{n}", f"k{n}", (base + timedelta(minutes=n)).isoformat())
                for n in range(1, stories + 1)
            ],
        )
        db.execute("INSERT INTO topics VALUES(1, 'Old news', '[]', '[]', 'x', 'x')")
        db.executemany("INSERT INTO topic_stories VALUES(1, ?)", [(n,) for n in members])
        db.executemany("INSERT INTO saves VALUES('ak', ?, 'x')", [(n,) for n in members])
        db.execute("INSERT INTO topic_follows VALUES('ak', 1)")
    return db


def test_a_view_of_many_old_members_does_not_walk_the_whole_store(tmp_path):
    """Review finding N12: 4,000 members, all older than the newest 16,000 stories. The walk is
    cut off after a bounded number of steps and the members are read instead."""
    from deploy_workflow.signal import feedview

    db = _stale_store(tmp_path, 20000, list(range(1, 4001)))
    seen: list[str] = []
    db.set_trace_callback(seen.append)
    for view in ("topic:1", "saved", "foryou"):
        assert feedview.view_ids(db, "ak", view, 30) == list(range(4000, 3970, -1))
    db.set_trace_callback(None)
    walks = [sql for sql in seen if "FROM (SELECT * FROM stories ORDER BY" in sql]
    # Each walk stops after 4 * 30 * 20,000 / 4,000 + 30 = 630 steps, not 16,030.
    assert len(walks) == 3 and all("LIMIT 630)" in sql for sql in walks)
    assert sum("CROSS JOIN stories" in sql for sql in seen) == 3


@settings(
    max_examples=60, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture]
)
@given(
    st.integers(1, 120),
    st.sets(st.integers(1, 120), max_size=120),
    st.integers(1, 12),
)
def test_every_plan_gives_the_ids_and_order_of_reading_every_story(tmp_path, stories, held, limit):
    from deploy_workflow.signal import feedview

    members = sorted(n for n in held if n <= stories)
    root = Path(tempfile.mkdtemp(dir=tmp_path))
    db = _stale_store(root, stories, members)
    expected = sorted(members, reverse=True)[:limit]  # story n is the n-th oldest
    for view in ("topic:1", "saved", "foryou"):
        assert feedview.view_ids(db, "ak", view, limit) == expected
    assert feedview.view_ids(db, "ak", "latest", limit) == list(range(stories, 0, -1))[:limit]
    assert new_count(db, "ak", "saved", 0) == len(members)
    assert new_count(db, "ak", "topic:1", 10) == len([n for n in members if n > 10])
    db.close()


# Review doubt: 50 followed topics of 200,000 old members each took 6 s (For you read every member)


def _work(db: sqlite3.Connection, view: str) -> int:
    """How many hundreds of virtual-machine steps SQLite took to read the view's 120 newest ids."""
    from deploy_workflow.signal import feedview

    counted = [0]

    def tick() -> int:
        counted[0] += 1
        return 0

    db.set_progress_handler(tick, 100)
    feedview.view_ids(db, "ak", view, 120)
    db.set_progress_handler(None, 0)
    return counted[0]


def test_a_view_of_more_members_than_it_reads_is_walked_over_the_newest_window(
    tmp_path, monkeypatch
):
    from deploy_workflow.signal import feedview

    monkeypatch.setattr(feedview, "MEMBERS_READ", 30)
    monkeypatch.setattr(feedview, "WINDOW", 50)
    # 200 stories, story n the n-th oldest; topic 1: 40 old members and 5 within the newest 50.
    db = _stale_store(tmp_path, 200, [*range(1, 41), *range(191, 196)])
    seen: list[str] = []
    db.set_trace_callback(seen.append)
    assert feedview.view_ids(db, "ak", "topic:1", 3) == [195, 194, 193]
    assert feedview.view_ids(db, "ak", "topic:1", 8) == [195, 194, 193, 192, 191]  # no older ones
    db.set_trace_callback(None)
    assert not any("CROSS JOIN stories" in sql for sql in seen)  # never read from the members
    assert sum("LIMIT 31)" in sql for sql in seen) == 2  # counted no further than MEMBERS_READ + 1
    # With the bound a view of 45 members is not one: raised to 50, it is read from its members.
    monkeypatch.setattr(feedview, "MEMBERS_READ", 50)
    assert feedview.view_ids(db, "ak", "topic:1", 8) == [195, 194, 193, 192, 191, 40, 39, 38]


def test_for_you_is_the_newest_of_the_followed_topics_and_the_shared_stories(tmp_path):
    from deploy_workflow.signal import feedview

    db = _stale_store(tmp_path, 100, [10, 20])
    with db:
        db.execute("INSERT INTO topics VALUES(2, 'Second', '[]', '[]', 'x', 'x')")
        db.execute("INSERT INTO topics VALUES(3, 'Unfollowed', '[]', '[]', 'x', 'x')")
        db.executemany("INSERT INTO topic_stories VALUES(2, ?)", [(15,), (30,)])
        db.executemany("INSERT INTO topic_stories VALUES(3, ?)", [(99,)])
        db.execute("INSERT INTO topic_follows VALUES('ak', 2)")
        db.execute("INSERT INTO groups VALUES(1, 'Desk', 'everyone', 'x', 'x')")
        db.execute("INSERT INTO group_members VALUES(1, 'ak')")
        db.execute("INSERT INTO groups VALUES(2, 'Other', 'everyone', 'x', 'x')")
        for story, group in ((25, 1), (80, 2), (25, 2), (None, 1)):
            db.execute(
                "INSERT INTO threads(group_id, story_id, created_at, note, last_activity_at)"
                " VALUES(?, ?, 'x', 'n', 'x')",
                (group, story),
            )
    assert feedview.view_ids(db, "ak", "foryou", 3) == [30, 25, 20]
    assert feedview.view_ids(db, "ak", "foryou", 10) == [30, 25, 20, 15, 10]


def test_the_work_of_a_big_topic_view_and_of_for_you_does_not_grow_with_its_members(
    tmp_path, monkeypatch
):
    from deploy_workflow.signal import feedview

    monkeypatch.setattr(feedview, "MEMBERS_READ", 500)
    monkeypatch.setattr(feedview, "WINDOW", 1000)
    work = []
    for members in (3000, 9000):  # all older than the newest 1,000 of 10,000 stories
        db = _stale_store(Path(tempfile.mkdtemp(dir=tmp_path)), 10000, [])
        with db:
            for topic in range(1, 9):
                db.execute(
                    "INSERT OR IGNORE INTO topics VALUES(?, ?, '[]', '[]', 'x', 'x')",
                    (topic, f"T{topic}"),
                )
                db.execute("INSERT OR IGNORE INTO topic_follows VALUES('ak', ?)", (topic,))
                db.executemany(
                    "INSERT INTO topic_stories VALUES(?, ?)",
                    [(topic, n) for n in range(1, members + 1)],
                )
        work.append((_work(db, "topic:1"), _work(db, "foryou")))
        db.close()
    (topic_small, for_you_small), (topic_big, for_you_big) = work
    assert topic_big <= topic_small * 1.1 + 2
    assert for_you_big <= for_you_small * 1.1 + 2
