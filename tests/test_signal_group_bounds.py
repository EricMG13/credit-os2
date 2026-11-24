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
