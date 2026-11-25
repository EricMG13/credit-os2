"""Edges the second review's mutations showed no test held: a check pruned exactly at its age
limit, the spellings of an address that must stay apart, the tie-break of two stories published
at the same moment, and a text cut where it has no space. Expected values are written by hand."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from deploy_workflow.signal import feedview
from deploy_workflow.signal.store import Check, canonical_url, open_db, prune_checks, record_check
from deploy_workflow.signal.texts import shortened

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    yield database
    database.close()


def _source(db: sqlite3.Connection) -> None:
    db.execute(
        "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
        " VALUES('Wire', 'news', 'https://wire.example/feed', 'approved', 'x', 'x')"
    )
    db.commit()


def test_a_check_made_exactly_at_the_age_limit_is_kept_and_one_just_before_it_goes(db):
    _source(db)
    limit = NOW - timedelta(days=30)
    for at in (limit - timedelta(microseconds=1), limit, NOW):
        record_check(db, 1, Check(at, True, "ok", None, None, 0))
    assert prune_checks(db, limit, 100) == 1
    assert [row[0] for row in db.execute("SELECT at FROM source_checks ORDER BY at")] == [
        limit.isoformat(),
        NOW.isoformat(),
    ]


@pytest.mark.parametrize(
    ("given", "canonical"),
    [
        ("https://x.example:80/a", "https://x.example:80/a"),  # 80 is not https' default port
        ("http://x.example:443/a", "http://x.example:443/a"),  # nor 443 http's
        ("https://x.example:443/a", "https://x.example/a"),
        ("http://x.example:80/a", "http://x.example/a"),
        ("https://user@x.example:443/a", "https://user@x.example:443/a"),  # kept as given
        ("https://user:pw@x.example/a", "https://user:pw@x.example/a"),
    ],
)
def test_ports_and_userinfo_are_not_dropped_by_the_canonical_form(given, canonical):
    assert canonical_url(given) == canonical


def test_an_escaped_dot_is_never_decoded_so_a_dot_segment_is_never_made_or_merged():
    """`/a/%2e%2e/b` and `/a/../b` are two spellings a server may read differently; they stay two
    sources. The escape is spelled in one case (`%2E`) and left an escape."""
    assert canonical_url("https://h.example/a/%2e%2e/b") == "https://h.example/a/%2E%2E/b"
    assert canonical_url("https://h.example/a/%2E%2e/b") == "https://h.example/a/%2E%2E/b"
    assert canonical_url("https://h.example/a/../b") == "https://h.example/a/../b"
    assert canonical_url("https://h.example/a/%2e%2e/b") != canonical_url(
        "https://h.example/a/../b"
    )
    assert canonical_url("https://h.example/f%2exml?q=%2e") == "https://h.example/f%2Exml?q=%2E"
    assert canonical_url("https://h.example/%7euser/%2e") == "https://h.example/~user/%2E"


def _ties(db: sqlite3.Connection, count: int) -> None:
    """`count` stories published at one moment (ids 1 to count) in one source."""
    _source(db)
    stamp = NOW.isoformat()
    db.executemany(
        "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
        " fetched_at, summary) VALUES(1, ?, ?, ?, ?, ?, ?, '')",
        [(f"t{n}", f"l{n}", f"k{n}", f"t{n}", stamp, stamp) for n in range(count)],
    )
    db.commit()


def test_stories_published_together_come_highest_id_first_whether_read_from_members(db):
    _ties(db, 12)
    db.executemany("INSERT INTO topics VALUES(?, ?, '[]', '[]', 'x', 'x')", [(1, "A")])
    db.executemany("INSERT INTO topic_stories VALUES(1, ?)", [(n,) for n in (2, 5, 9, 11, 4)])
    # Five members, three asked for: the members' route.
    assert feedview.view_ids(db, "u", "topic:1", 3) == [11, 9, 5]


def test_stories_published_together_come_highest_id_first_when_the_view_is_walked(db):
    _ties(db, 1000)
    db.execute("INSERT INTO topics VALUES(1, 'A', '[]', '[]', 'x', 'x')")
    db.executemany("INSERT INTO topic_stories VALUES(1, ?)", [(n,) for n in range(10, 1001, 10)])
    # 100 members spread over 1,000 stories, three asked for: too many members to read them
    # all, so the newest 123 stories are walked; of the stories published at one moment those are
    # the highest ids.
    assert feedview.view_ids(db, "u", "topic:1", 3) == [1000, 990, 980]


def test_a_text_with_no_space_is_cut_at_its_limit_and_one_with_spaces_at_a_word():
    assert shortened("a" * 300, 280) == "a" * 280 + "…"
    assert shortened("word word word word", 12) == "word word…"
    assert shortened("word word", 9) == "word word"
