from datetime import UTC, datetime, timedelta

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from test_signal_feeds import RSS

from deploy_workflow.signal.fetch import Fetched, FetchRefused
from deploy_workflow.signal.ingest import health, run_due
from deploy_workflow.signal.store import open_db, propose_source, set_source_state

NOW = datetime(2026, 11, 13, 9, tzinfo=UTC)


@pytest.fixture
def db(tmp_path):
    return open_db(tmp_path)


@pytest.fixture
def db_a(db):
    a = propose_source(db, "A", "news", "https://a.org/f", "x")
    set_source_state(db, a, "approved")
    return db


def recorded(body, etag='"v1"'):
    calls = []

    def fn(url, etag_in, modified_in):
        calls.append((url, etag_in, modified_in))
        return Fetched(body, etag, None)

    fn.calls = calls
    return fn


def test_only_approved_sources_are_fetched_with_recorded_feed(db):
    a = propose_source(db, "A", "news", "https://a.org/f", "x")
    set_source_state(db, a, "approved")
    propose_source(db, "B", "news", "https://b.org/f", "x")  # stays proposed
    p = propose_source(db, "P", "news", "https://p.org/f", "x")
    set_source_state(db, p, "paused")
    fn = recorded(RSS)
    assert run_due(db, NOW, fn) == [(a, True, "2 new")]
    assert [c[0] for c in fn.calls] == ["https://a.org/f"]


def test_source_is_not_checked_again_within_600_seconds_with_recorded_feed(db_a):
    fn = recorded(RSS)
    run_due(db_a, NOW, fn)
    assert run_due(db_a, NOW + timedelta(seconds=599), fn) == []
    assert len(run_due(db_a, NOW + timedelta(seconds=600), fn)) == 1


def test_second_pass_sends_validators_and_adds_nothing_with_recorded_feed(db_a):
    fn = recorded(RSS)
    run_due(db_a, NOW, fn)
    assert run_due(db_a, NOW + timedelta(hours=1), fn)[0][2] == "0 new"
    assert fn.calls[1][1] == '"v1"'
    assert db_a.execute("SELECT count(*) FROM stories").fetchone()[0] == 2
    assert db_a.execute("SELECT count(*) FROM story_duplicates").fetchone()[0] == 0


def test_failing_source_is_recorded_and_others_still_run_with_recorded_feed(db):
    bad = propose_source(db, "Bad", "news", "https://bad.org/f", "x")
    set_source_state(db, bad, "approved")
    good = propose_source(db, "Good", "news", "https://good.org/f", "x")
    set_source_state(db, good, "approved")

    def fn(url, e, m):
        if "bad" in url:
            raise FetchRefused("feed is larger than 2 MB")
        return Fetched(RSS, None, None)

    assert run_due(db, NOW, fn) == [(bad, False, "feed is larger than 2 MB"), (good, True, "2 new")]
    assert health(db, bad, NOW).state == "failing"
    assert health(db, bad, NOW).reason == "feed is larger than 2 MB"


def test_unparseable_feed_is_failing_with_the_parser_reason_with_recorded_feed(db_a):
    run_due(db_a, NOW, recorded(b"not xml"))
    assert health(db_a, 1, NOW).state == "failing"
    assert health(db_a, 1, NOW).reason


REASON = "unexpected error (RuntimeError); see the log"


def _two_sources_first_raises(db):
    a = propose_source(db, "A", "news", "https://a.org/f", "x")
    set_source_state(db, a, "approved")
    b = propose_source(db, "B", "news", "https://b.org/f", "x")
    set_source_state(db, b, "approved")
    calls = []

    def fn(url, e, m):
        calls.append(url)
        if "a.org" in url:
            raise RuntimeError("boom 10.0.0.5")
        return Fetched(RSS, None, None)

    fn.calls = calls
    return a, b, fn


def test_an_unexpected_error_fails_that_source_and_the_rest_still_run_with_recorded_feed(
    db, caplog
):
    a, b, fn = _two_sources_first_raises(db)
    out = run_due(db, NOW, fn)
    assert out == [(a, False, REASON), (b, True, "2 new")]
    reasons = [row["reason"] for row in db.execute("SELECT reason FROM source_checks")]
    assert reasons and not any("10.0.0.5" in reason for reason in reasons)
    errors = [r for r in caplog.records if r.levelname == "ERROR"]
    assert errors and errors[0].exc_info is not None
    assert "Traceback" in caplog.text and "boom 10.0.0.5" in caplog.text
    assert str(a) in errors[0].getMessage()


def test_a_source_that_raised_is_not_retried_within_600_seconds_with_recorded_feed(db):
    _a, _b, fn = _two_sources_first_raises(db)
    run_due(db, NOW, fn)
    fn.calls.clear()
    assert run_due(db, NOW + timedelta(seconds=60), fn) == []
    assert fn.calls == []
    run_due(db, NOW + timedelta(seconds=601), fn)
    assert sorted(fn.calls) == ["https://a.org/f", "https://b.org/f"]


def test_health_reports_a_source_that_raised_as_failing_with_recorded_feed(db):
    a, _b, fn = _two_sources_first_raises(db)
    run_due(db, NOW, fn)
    h = health(db, a, NOW)
    assert (h.state, h.reason) == ("failing", REASON)


def test_not_modified_is_ok_and_keeps_validators_with_recorded_feed(db_a):
    run_due(db_a, NOW, recorded(RSS))
    out = run_due(db_a, NOW + timedelta(hours=1), lambda u, e, m: Fetched(None, None, None))
    assert out == [(1, True, "not modified")]
    seen = []

    def fn(u, e, m):
        seen.append(e)
        return Fetched(RSS, e, None)

    run_due(db_a, NOW + timedelta(hours=2), fn)
    assert seen == ['"v1"']


def test_health_states_and_weekly_counts_with_recorded_feed(db_a):
    assert health(db_a, 1, NOW).state == "never checked"
    run_due(db_a, NOW, recorded(RSS))  # one item dated 13 Nov 08:00Z, one undated -> NOW
    h = health(db_a, 1, NOW)
    assert (h.state, h.per_week) == ("healthy", (0, 0, 0, 0, 0, 2))
    later = NOW + timedelta(days=8)
    run_due(db_a, later, recorded(RSS))
    assert health(db_a, 1, later).state == "quiet"
    assert health(db_a, 1, later).per_week == (0, 0, 0, 0, 2, 0)


def test_source_whose_items_all_fold_is_healthy_with_its_items(db):
    body = (
        b'<rss version="2.0"><channel><item><title>Case 1 merger inquiry opened today</title>'
        b"<link>https://r.example.org/cases/1</link>"
        b"<pubDate>Fri, 13 Nov 2026 08:00:00 +0000</pubDate></item></channel></rss>"
    )
    for name in ("cases", "news"):
        sid = propose_source(db, name, "regulator", f"https://r.example.org/{name}.rss", "x")
        set_source_state(db, sid, "approved")
    run_due(db, NOW, recorded(body))
    first, second = health(db, 1, NOW), health(db, 2, NOW)
    assert db.execute("SELECT count(*) FROM story_duplicates").fetchone()[0] == 1
    assert second.state == "healthy"
    assert second.last_item == datetime(2026, 11, 13, 8, tzinfo=UTC)
    assert second.per_week == first.per_week == (0, 0, 0, 0, 0, 1)


def test_the_weeks_are_counted_at_their_edges_and_only_within_six_weeks(db_a):
    """A window is (start, end]: an item exactly 7 days old is in the previous week, one exactly
    six weeks old is in none, one a second younger is in the oldest, one at `now` in the newest;
    an item later than `now` and a duplicate folded from the source count as theirs would."""
    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import _utc_text, add_story

    week = timedelta(days=7)
    times = [
        NOW - week,
        NOW - 6 * week,
        NOW - 6 * week + timedelta(seconds=1),
        NOW,
        NOW - week + timedelta(microseconds=1),
    ]
    for n, at in enumerate(times):
        add_story(db_a, 1, Entry(f"Story {n}", f"https://a.org/{n}", at, ""), NOW)
    with db_a:
        db_a.execute(
            "INSERT INTO story_duplicates(story_id, duplicate_source_id, link, link_key,"
            " published_at, seen_at) VALUES(1, 1, 'https://a.org/d', 'd', ?, ?)",
            (_utc_text(NOW - 2 * week), _utc_text(NOW)),
        )
    got = health(db_a, 1, NOW)
    assert got.per_week == (1, 0, 0, 1, 1, 2)
    assert got.last_item == NOW
    assert health(db_a, 1, NOW - 3 * week).per_week == (0, 0, 1, 1, 0, 0)  # the rest is later


@settings(max_examples=40, deadline=None)
@given(
    st.lists(st.integers(-3 * 86400, 50 * 86400), max_size=30),
    st.integers(0, 999_999),
)
def test_the_weekly_counts_are_those_of_counting_by_hand(tmp_path_factory, ages, micro):
    """Items `ages` seconds before `now` (some later than it); `now` with any microseconds."""
    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story

    db = open_db(tmp_path_factory.mktemp("weeks"))
    source = propose_source(db, "A", "news", "https://a.org/f", "x")
    now = NOW + timedelta(microseconds=micro)
    for n, age in enumerate(ages):
        at = now - timedelta(seconds=age)
        add_story(db, source, Entry(f"S{n}", f"https://a.org/{n}", at, ""), now + timedelta(days=9))
    expected = [0] * 6
    for age in ages:  # the window (now - (6 - k) weeks, now - (5 - k) weeks] is week k
        for k in range(6):
            if (5 - k) * 7 * 86400 <= age < (6 - k) * 7 * 86400:
                expected[k] += 1
    assert health(db, source, now).per_week == tuple(expected)
    db.close()


def _long_running(db, sources: int, days: int, per_day: int) -> None:
    """The store a service left running reaches by itself: `sources` approved sources, one check
    each every 10 minutes for `days` days, `per_day` stories a day each, a topic over them."""
    from deploy_workflow.signal.store import _utc_text

    with db:
        for s in range(1, sources + 1):
            db.execute(
                "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
                " VALUES(?, 'news', ?, 'approved', 'x', ?)",
                (f"Source {s}", f"https://s{s}.example/feed", _utc_text(NOW)),
            )
            db.executemany(
                "INSERT INTO source_checks(source_id, at, ok, reason, etag, modified,"
                " new_stories) VALUES(?, ?, 1, 'not modified', 'W/\"a\"', NULL, 0)",
                ((s, _utc_text(NOW - timedelta(minutes=10 * k))) for k in range(days * 144)),
            )
            gap = 1440 // per_day
            db.executemany(
                "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
                " fetched_at, summary) VALUES(?, ?, ?, ?, ?, ?, ?, 'A summary.')",
                (
                    (
                        s,
                        f"Bank story {s}-{k}",
                        f"https://s{s}.example/{k}",
                        f"k{s}-{k}",
                        f"t{s}-{k}",
                        _utc_text(NOW - timedelta(minutes=gap * k)),
                        _utc_text(NOW),
                    )
                    for k in range(days * per_day)
                ),
            )
        db.execute("INSERT INTO topics VALUES(1, 'Banks', '[\"bank\"]', '[]', 'x', 'x')")
        db.execute("INSERT INTO topic_stories SELECT 1, id FROM stories WHERE id % 3 = 0")
        db.execute("INSERT INTO users(name, role) VALUES('Tobias O', 'reader')")
        db.execute("INSERT INTO topic_follows VALUES('Tobias O', 1)")


def _reads(db):
    """Every statement of a snapshot (named and unnamed), /api/status and the loop's due check."""
    from deploy_workflow.signal import ingest, snapshot, store
    from deploy_workflow.signal.identity import User

    def run():
        for who in (User("Tobias O", "reader"), None):
            snapshot.build(db, who, NOW)
        for row in store.sources(db, "approved"):
            ingest.health(db, row["id"], NOW)
            ingest._is_due(db, row["id"], NOW)

    return run


def test_no_snapshot_status_or_due_check_scans_the_checks_or_the_stories(db):
    _long_running(db, 3, 2, 25)
    statements: list[str] = []
    db.set_trace_callback(statements.append)
    _reads(db)()
    db.set_trace_callback(None)
    scans = set()
    for sql in statements:
        if not sql.lstrip().upper().startswith(("SELECT", "WITH")):
            continue
        for row in db.execute("EXPLAIN QUERY PLAN " + sql):
            words = str(row[3]).split() + [""]
            aliases = {"s": "stories", "d": "story_duplicates", "ts": "topic_stories"}
            table = aliases.get(words[1], words[1])
            if words[1] in aliases and f"{table} {words[1]} " not in sql + " ":
                continue  # an alias of a subquery (a view's members), not of the table
            scanned = ("source_checks", "stories", "story_duplicates", "topic_stories")
            if words[0] != "SCAN" or table not in scanned:
                continue
            # The newest stories walked through their time index, a bounded number of them.
            walked = "idx_stories_published_at_id" in str(row[3]) and " LIMIT " in sql
            if not walked:
                scans.add((str(row[3]), " ".join(sql.split())[:90]))
    assert scans == set()
    # The Saved badge counts the saves, not every story newer than 0.
    assert not [sql for sql in statements if "FROM stories s WHERE s.id >" in sql]


def test_the_snapshot_status_and_due_check_stay_fast_however_long_the_service_ran(db):
    """Review finding N2 (5.9 s at 50 sources after a year): 50 sources, 60 days of checks
    (432,000) and 25 stories a day each; the reads must not grow with the checks."""
    import time

    _long_running(db, 50, 60, 25)
    run = _reads(db)
    run()  # warm the page cache
    started = time.perf_counter()
    run()
    assert time.perf_counter() - started < 1.0


def test_the_ingest_pass_prunes_old_checks_but_keeps_each_sources_last(db_a, monkeypatch):
    from deploy_workflow.signal import ingest
    from deploy_workflow.signal.store import _utc_text

    b = propose_source(db_a, "B", "news", "https://b.org/f", "x")  # proposed: never checked now
    old = [NOW - timedelta(days=60), NOW - timedelta(days=50), NOW - timedelta(days=41)]
    with db_a:
        db_a.executemany(
            "INSERT INTO source_checks(source_id, at, ok, reason, new_stories)"
            " VALUES(?, ?, 1, 'x', 0)",
            [(1, _utc_text(at)) for at in old] + [(b, _utc_text(NOW - timedelta(days=90)))],
        )
    monkeypatch.setattr(ingest, "PRUNE_PER_PASS", 1)
    run_due(db_a, NOW, recorded(RSS))
    left = [tuple(r) for r in db_a.execute("SELECT source_id, at FROM source_checks ORDER BY id")]
    assert left == [
        (1, _utc_text(old[1])),
        (1, _utc_text(old[2])),
        (b, _utc_text(NOW - timedelta(days=90))),  # B's last check, however old
        (1, _utc_text(NOW)),
    ]
    monkeypatch.setattr(ingest, "PRUNE_PER_PASS", 10)
    run_due(db_a, NOW + timedelta(hours=1), recorded(RSS))
    left = [tuple(r) for r in db_a.execute("SELECT source_id, at FROM source_checks ORDER BY id")]
    assert left == [
        (1, _utc_text(old[2])),  # 41 days before the pass's NOW + 1 h: within the six weeks
        (b, _utc_text(NOW - timedelta(days=90))),
        (1, _utc_text(NOW)),
        (1, _utc_text(NOW + timedelta(hours=1))),
    ]


def _big_rss(count):
    """SYNTHETIC: an RSS feed of `count` items, item n published n minutes before NOW."""
    items = "".join(
        f"<item><title>Item {n}</title><link>https://a.org/{n}</link>"
        f"<pubDate>{(NOW - timedelta(minutes=n)).strftime('%a, %d %b %Y %H:%M:%S +0000')}</pubDate>"
        "</item>"
        for n in range(count)
    )
    return f'<?xml version="1.0"?><rss version="2.0"><channel>{items}</channel></rss>'.encode()


def test_one_fetch_stores_at_most_500_entries_the_newest_and_the_rest_come_later(db_a):
    """Review finding 9: a first fetch of a large feed held the loop for minutes. The pass stores
    the newest 500 entries; the next passes, which read the whole feed again (no validators are
    kept meanwhile), take the next 500, then the last 200."""
    fn = recorded(_big_rss(1200))
    assert run_due(db_a, NOW, fn) == [
        (1, True, "500 new; up to 700 older entries wait for the next pass")
    ]
    newest = [row[0] for row in db_a.execute("SELECT title FROM stories ORDER BY id LIMIT 2")]
    assert newest == ["Item 0", "Item 1"]
    second = run_due(db_a, NOW + timedelta(minutes=10), fn)
    assert second == [(1, True, "500 new; up to 200 older entries wait for the next pass")]
    assert fn.calls[1][1] is None  # no validator: the whole feed is read again
    assert run_due(db_a, NOW + timedelta(minutes=20), fn) == [(1, True, "200 new")]
    assert db_a.execute("SELECT COUNT(*) FROM stories").fetchone()[0] == 1200
    run_due(db_a, NOW + timedelta(minutes=30), fn)
    assert fn.calls[3][1] == '"v1"'  # the whole feed is stored: validators again
