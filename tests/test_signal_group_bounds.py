"""The snapshot's size and time bounds (review findings: one writer could blank every screen with
260 posts; the snapshot scanned the whole comments table for every delivered comment).

The browser reaches the service through a forwarder that refuses a reply over 4 MiB and gives up
after 5 s; the snapshot must stay under 3 MiB and build fast in every store state the routes can
reach. The worst states are seeded with plain SQL for speed; every row is one a route or the
ingest loop can write (lengths at the store's limits, text of four-byte characters, so a
character costs the most bytes it can). Every snapshot built here is read by the real React
reader (``tests/signal_reader_check.py``). Expected values are written by hand.
"""

from __future__ import annotations

import json
import sqlite3
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_reader_check import react_refusal

from deploy_workflow.signal import groups, snapshot, threads
from deploy_workflow.signal.groups import Conflict
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import _utc_text, add_user, open_db

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
CAP = 3 * 1024 * 1024
MARA = User("Mara L", "writer")
INES = User("Ines K", "writer")
STRANGER = User("Somebody Else", "reader")
BOMB = "\U0001f4a3"  # four UTF-8 bytes
LONGEST = BOMB * threads.MAX_TEXT  # a note or comment at its limit: 16,000 bytes


def _bytes(built: dict[str, Any]) -> int:
    return len(json.dumps(built, ensure_ascii=False).encode("utf-8"))


def _read(db: sqlite3.Connection, user: User | None, **focus: int) -> dict[str, Any]:
    """The snapshot, checked under the cap and against the React reader."""
    built = snapshot.build(db, user, NOW, focus=snapshot.Focus(**focus))
    assert _bytes(built) < CAP
    assert react_refusal(built) is None
    snap: dict[str, Any] = built["scenes"][0]["snapshot"]
    return snap


def _stamp(**ago: float) -> str:
    return _utc_text(NOW - timedelta(**ago))


@pytest.fixture
def db(tmp_path: Path) -> Any:
    held = open_db(tmp_path)
    add_user(held, "Mara L", "writer")
    add_user(held, "Ines K", "writer")
    yield held
    held.close()


# One writer against every other user's screen


def test_one_writer_filling_a_thread_cannot_blank_anyone_else(db):
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    thread, _ = threads.share(db, INES, desk, threads.Item(None, "start"), NOW)
    tops = [threads.comment(db, INES, thread, LONGEST, NOW) for _ in range(13)]
    for n in range(threads.MAX_COMMENTS - 13):
        threads.reply(db, INES, tops[n % 13], LONGEST, NOW)
    with pytest.raises(Conflict) as refused:
        threads.comment(db, INES, thread, "one more", NOW)
    assert str(refused.value) == "this thread holds 500 comments, the most it can hold"

    snap = _read(db, STRANGER)
    (item,) = snap["groups"][0]["threads"]
    assert item["commentCount"] == "500 comments"
    (whole,) = snap["threads"]
    assert whole["comments"] == []
    assert whole["subline"] == "Desk, 500 comments, shown when the thread is opened"

    # Opened, the thread carries its newest comments within its own budget, the latest shown.
    focused = _read(db, STRANGER, thread=thread)
    (whole,) = focused["threads"]
    assert whole["subline"] == "Desk, 500 comments, the latest shown"
    held = [c for top in whole["comments"] for c in [top, *top["replies"]]]
    assert 0 < len(held) < 500
    assert all(c["text"] == LONGEST for c in held)
    newest_top = max(tops)
    assert whole["comments"][-1]["id"] == str(newest_top)  # the newest top-level comment is kept


def test_a_thread_past_its_comment_bound_says_the_latest_are_shown(db):
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    thread, _ = threads.share(db, INES, desk, threads.Item(None, "start"), NOW)
    tops = [threads.comment(db, INES, thread, f"top {n}", NOW) for n in range(101)]
    for n in range(21):
        threads.reply(db, MARA, tops[-1], f"reply {n}", NOW)
    for focus in ({}, {"thread": thread}):
        (whole,) = _read(db, STRANGER, **focus)["threads"]
        assert whole["subline"] == "Desk, 122 comments, the latest shown"
        assert [c["text"] for c in whole["comments"]][:2] == ["top 1", "top 2"]
        assert len(whole["comments"]) == 100
        assert [r["text"] for r in whole["comments"][-1]["replies"]][:2] == ["reply 1", "reply 2"]
        assert len(whole["comments"][-1]["replies"]) == 20


def test_a_thread_cannot_hold_more_than_its_comment_cap_by_replies_either(db):
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    thread, _ = threads.share(db, INES, desk, threads.Item(None, "start"), NOW)
    top = threads.comment(db, INES, thread, "top", NOW)
    with db:
        db.executemany(
            "INSERT INTO comments(thread_id, parent_id, author, body, created_at)"
            " VALUES(?, ?, 'Ines K', 'x', ?)",
            [(thread, top, _stamp())] * (threads.MAX_COMMENTS - 1),
        )
    with pytest.raises(Conflict, match="this thread holds 500 comments"):
        threads.reply(db, MARA, top, "one more", NOW)
    with pytest.raises(Conflict, match="this thread holds 500 comments"):
        threads.comment(db, MARA, thread, "one more", NOW)


def test_a_group_holds_at_most_a_thousand_threads(db):
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    stamp = _stamp(hours=1)
    with db:
        db.executemany(
            "INSERT INTO threads(group_id, created_at, created_by, note, last_activity_at)"
            " VALUES(?, ?, 'Ines K', 'n', ?)",
            [(desk, stamp, stamp)] * groups.MAX_THREADS,
        )
    with pytest.raises(Conflict) as refused:
        threads.share(db, INES, desk, threads.Item(None, "one more"), NOW)
    assert str(refused.value) == "this group holds 1,000 threads, the most it can hold"


# The worst reachable store


LETTER = "\U0001d504"  # a letter of four UTF-8 bytes


def _long(prefix: str, length: int) -> str:
    return (prefix + LETTER * length)[:length]


def _seed_stories(db: sqlite3.Connection) -> list[int]:
    """One source; 50 topics (names, 12 keywords at their limits) each with 120 stories of its
    own; 120 newer stories in no topic; 120 older ones in every topic, saved by Mara L, who
    follows every topic. Titles of 1,000 characters, summaries at their 300, links of 2,000.
    Returns the ids of the stories in no view (for the group threads to share)."""
    db.execute(
        "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
        " VALUES(?, 'news', 'https://wire.example/feed', 'approved', 'Mara L', ?)",
        (_long("", 80), _stamp(days=30)),
    )
    keywords = json.dumps([_long(f"{k:02d}", 60) for k in range(12)], ensure_ascii=False)
    db.executemany(
        "INSERT INTO topics(name, keywords, kinds, created_by, created_at) VALUES(?, ?, '[]', ?, ?)",
        [(_long(f"{t:02d}", 80), keywords, "Mara L", _stamp(days=30)) for t in range(50)],
    )
    db.executemany(
        "INSERT INTO topic_follows(user_name, topic_id) VALUES('Mara L', ?)",
        [(t,) for t in range(1, 51)],
    )
    rows = []
    for n in range(120 + 50 * 200 + 120):
        title, link = _long(f"{n:05d} ", 1000), f"https://wire.example/{n:05d}/" + "a" * 2000
        rows.append((title, link, link, f"key {n}", _stamp(minutes=n), _long("", 300)))
    db.executemany(
        "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
        " fetched_at, summary) VALUES(1, ?, ?, ?, ?, ?, ?5, ?)",
        rows,
    )
    pairs = [(1 + (n - 120) // 200, n + 1) for n in range(120, 120 + 50 * 200)]
    old = range(120 + 50 * 200 + 1, 120 + 50 * 200 + 121)
    pairs += [(t, s) for s in old for t in range(1, 51)]
    db.executemany("INSERT INTO topic_stories(topic_id, story_id) VALUES(?, ?)", pairs)
    db.executemany(
        "INSERT INTO saves(user_name, story_id, saved_at) VALUES('Mara L', ?, ?)",
        [(s, _stamp()) for s in old],
    )
    # Each topic's stories 121 to 200 are in no view (its newest 120 are the most any holds).
    return [120 + t * 200 + k + 1 for t in range(50) for k in range(120, 200)]


def _seed_groups(db: sqlite3.Connection, spare: list[int]) -> tuple[int, int]:
    """100 groups open to everyone, names at their limit, 200 members each (Mara L among them);
    30 threads each with a note at its limit, every other one a story share; the newest thread
    holds 70 comments at their limit; one old thread holds 500 (its bound), 100 top-level
    comments with four replies each. Returns the newest and the full thread's ids."""
    for g in range(1, 101):
        db.execute(
            "INSERT INTO groups(name, visibility, created_by, created_at)"
            " VALUES(?, 'everyone', 'Mara L', ?)",
            (_long(f"{g:03d}", groups.MAX_GROUP_NAME), _stamp(days=30)),
        )
        names = ["Mara L"] + [_long(f"{m:03d} ", 60) for m in range(199)]
        db.executemany("INSERT INTO group_members VALUES(?, ?)", [(g, name) for name in names])
        for t in range(30):
            story = spare.pop() if t % 2 else None
            stamp = _stamp(minutes=g * 30 + t)
            db.execute(
                "INSERT INTO threads(group_id, story_id, created_at, created_by, note,"
                " last_activity_at) VALUES(?, ?, ?, ?, ?, ?)",
                (g, story, stamp, _long("", 60), LONGEST, stamp),
            )
    newest = int(
        db.execute(
            "SELECT id FROM threads WHERE group_id=1 AND note IS NOT NULL"
            " ORDER BY last_activity_at DESC LIMIT 1"
        ).fetchone()[0]
    )
    full = 3000
    comment = (
        "INSERT INTO comments(thread_id, parent_id, author, body, created_at) VALUES(?, ?, ?, ?, ?)"
    )
    db.executemany(comment, [(newest, None, "Ines K", LONGEST, _stamp())] * 70)
    for _ in range(100):
        top = db.execute(comment, (full, None, "Ines K", LONGEST, _stamp(days=1))).lastrowid
        db.executemany(comment, [(full, top, "Mara L", LONGEST, _stamp(hours=20))] * 4)
    return newest, full


@pytest.fixture(scope="module")
def worst(tmp_path_factory: pytest.TempPathFactory) -> Any:
    held = open_db(tmp_path_factory.mktemp("worst"))
    with held:
        spare = _seed_stories(held)
        ids = _seed_groups(held, spare)
    yield held, ids
    held.close()


def test_the_worst_reachable_store_stays_under_the_cap_for_every_viewer(worst):
    db, (newest, full) = worst
    started = time.perf_counter()
    snap = _read(db, MARA)
    elapsed = time.perf_counter() - started
    assert elapsed < 2
    views = snap["feed"]["views"]
    assert len(views["saved"]["latest"]) > 0
    first = snap["threads"][0]
    assert first["id"] == str(newest) and first["comments"] == []
    assert first["subline"].endswith(", 70 comments, shown when the thread is opened")
    for viewer in (STRANGER, INES, None):
        _read(db, viewer)
    _read(db, MARA, topic=7)
    opened = _read(db, MARA, thread=full)
    (whole,) = [t for t in opened["threads"] if t["id"] == str(full)]
    assert whole["subline"].endswith(", 500 comments, the latest shown")
    assert whole["comments"]


# Time


def _busy_store(db: sqlite3.Connection) -> None:
    """One open group of 60 threads holding 500 short comments each (30,000 in all): 100
    top-level comments with four replies each."""
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    comment = (
        "INSERT INTO comments(thread_id, parent_id, author, body, created_at)"
        " VALUES(?, ?, 'Ines K', 'A fairly ordinary comment of about eighty characters.', ?)"
    )
    with db:
        for t in range(60):
            stamp = _stamp(minutes=t)
            thread = db.execute(
                "INSERT INTO threads(group_id, created_at, created_by, note, last_activity_at)"
                " VALUES(?, ?, 'Ines K', 'A note', ?)",
                (desk, stamp, stamp),
            ).lastrowid
            for _ in range(100):
                top = db.execute(comment, (thread, None, stamp)).lastrowid
                db.executemany(comment, [(thread, top, stamp)] * 4)


def test_a_store_of_thirty_thousand_comments_builds_fast(db):
    _busy_store(db)
    for viewer, focus in ((MARA, {}), (STRANGER, {}), (MARA, {"thread": 60})):
        started = time.perf_counter()
        _read(db, viewer, **focus)
        assert time.perf_counter() - started < 2


def test_no_snapshot_read_scans_the_comments_or_their_reactions(db):
    _busy_store(db)
    threads.react(db, MARA, threads.Reaction(1, "Seen", True), NOW)
    threads.mark_read(db, MARA, 1, NOW)
    statements: list[str] = []
    db.set_trace_callback(statements.append)
    snapshot.build(db, MARA, NOW, focus=snapshot.Focus(thread=2))
    db.set_trace_callback(None)
    scans = set()
    for sql in statements:
        if not sql.lstrip().upper().startswith("SELECT"):
            continue
        for row in db.execute("EXPLAIN QUERY PLAN " + sql):
            words = str(row[3]).split()
            if words[0] != "SCAN":
                continue
            table = {"c": "comments", "p": "comments", "r": "read_marks"}.get(words[1], words[1])
            if words[1] == "t" and "threads t" in sql:
                table = "threads"
            if table in ("comments", "reactions", "read_marks", "threads"):
                scans.add((table, sql[:80]))
    assert scans == set()


def test_a_sparse_view_in_a_large_store_reads_the_same_ids_without_walking_every_story(db):
    """`feedview.view_ids` reads a view with few members from its members; the ids are those of
    walking the stories newest first (hand-built here from the seed's own rule)."""
    from deploy_workflow.signal import feedview

    with db:
        db.execute(
            "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
            " VALUES('W', 'news', 'https://w.example/f', 'approved', 'Mara L', ?)",
            (_stamp(days=1),),
        )
        db.executemany(
            "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(1, ?, ?, ?, ?, ?, ?, '')",
            [
                (f"S{n}", f"https://w.example/{n}", f"k{n}", f"t{n}", _stamp(minutes=n % 997), "x")
                for n in range(20000)
            ],
        )
        db.execute("INSERT INTO topics VALUES(1, 'Sparse', '[]', '[]', 'Mara L', 'x')")
        db.execute("INSERT INTO topics VALUES(2, 'Dense', '[]', '[]', 'Mara L', 'x')")
        db.executemany(
            "INSERT INTO topic_stories VALUES(1, ?)", [(n,) for n in range(7, 20001, 400)]
        )
        db.executemany("INSERT INTO topic_stories VALUES(2, ?)", [(n,) for n in range(1, 20001, 2)])
        db.executemany("INSERT INTO saves VALUES('Mara L', ?, 'x')", [(n,) for n in (5, 99, 19999)])
        db.execute("INSERT INTO topic_follows VALUES('Mara L', 1)")

    def newest(ids: set[int], limit: int) -> list[int]:
        # Story n was published (n - 1) % 997 minutes before NOW; ties: the higher id first.
        return sorted(ids, key=lambda n: (-((n - 1) % 997), n), reverse=True)[:limit]

    sparse = set(range(7, 20001, 400))
    assert feedview.view_ids(db, "Mara L", "topic:1", 30) == newest(sparse, 30)
    assert feedview.view_ids(db, "Mara L", "topic:2", 30) == newest(set(range(1, 20001, 2)), 30)
    assert feedview.view_ids(db, "Mara L", "saved", 120) == newest({5, 99, 19999}, 120)
    assert feedview.view_ids(db, "Mara L", "foryou", 120) == newest(sparse, 120)
