"""The group parts of the Signal snapshot: groups, threads, group channels, the story fields that
point at threads, thread rules, notifications, For you and the Top order.

Expected values are written by hand from the seed below. Every snapshot built here is also read by
the real React reader (``readSlice`` of ``web/src/pages/signal/slice.ts``, bundled with the web
folder's esbuild into a temporary folder and run with node); a snapshot it refuses fails the test.
Where node or the bundler is missing the reader check skips, and says so.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
import signal_reader_check
from hypothesis import given, settings
from hypothesis import strategies as st
from test_signal_snapshot import NOW, READER, WRITER, seed_sample

from deploy_workflow.signal import group_view, groups, notif, snapshot, threads
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import add_user

INES = User("Ines K", "writer")
JONAS = User("Jonas W", "writer")


@pytest.fixture(scope="session")
def reader_dir() -> Path:
    """The React slice reader, bundled once by ``signal_reader_check`` (skips or, under CI, fails
    when node or esbuild is missing)."""
    return signal_reader_check.bundle()


def reader_says(folder: Path, built: dict[str, Any]) -> str:
    refusal = signal_reader_check.react_refusal(built)
    return "ok" if refusal is None else f"refused: {refusal}"


@pytest.fixture
def read_by_react(reader_dir: Path) -> Any:
    """Build the snapshot for a viewer, check the React reader accepts it, return the snapshot."""

    def build(db: sqlite3.Connection, user: User | None, now: datetime = NOW) -> dict[str, Any]:
        built = snapshot.build(db, user, now)
        assert reader_says(reader_dir, built) == "ok"
        return built["scenes"][0]["snapshot"]

    return build


def at(**ago: float) -> datetime:
    return NOW - timedelta(**ago)


YESTERDAY_1620 = datetime(2026, 11, 23, 16, 20, tzinfo=UTC)
YESTERDAY_1640 = datetime(2026, 11, 23, 16, 40, tzinfo=UTC)


def seed_groups(db: sqlite3.Connection) -> None:
    """Over the snapshot sample store (stories 1 Corvane, 2 Tessaly, 3 Brightwell, 4 Gazette,
    5 Halvorsen, 6 Lenmark): three groups and four threads.

    1 Leveraged credit (everyone): six members. Thread 1: Ines K shares Corvane with a note (its
    comment 1), Mara L replies (2), Jonas W comments (3) and removes it, Mara L comments (4);
    Agree by Ines K and Mara L and Seen by Mara L on comment 1. Thread 2: Ines K's note
    yesterday 16:20, Mara L comments at 16:40 (5), Ines K replies to it 2 h ago (6). Thread 3:
    Ines K shares Halvorsen 3 h ago.
    2 Shipping desk (invited): Mara L, Tobias O, Amir S; no thread.
    3 Committee prep (invited): only Ines K. Thread 4: Ines K shares Brightwell with a note.
    """
    for name in ("Ines K", "Jonas W"):
        add_user(db, name, "writer")
    lev = groups.create_group(db, WRITER, "Leveraged credit", "everyone")
    ship = groups.create_group(db, WRITER, "Shipping desk", "invited")
    prep = groups.create_group(db, WRITER, "Committee prep", "invited")
    for name in ("Tobias O", "Ines K", "Mara L", "Jonas W", "Amir S", "Lea P"):
        groups.add_member(db, WRITER, lev, name)
    for name in ("Mara L", "Tobias O", "Amir S"):
        groups.add_member(db, WRITER, ship, name)
    groups.add_member(db, WRITER, prep, "Ines K")
    one, _ = threads.share(db, INES, lev, threads.Item(1, "Sharing for Thursday."), at(hours=1))
    threads.reply(db, WRITER, 1, "Agreed. Check the test date.", at(minutes=50))
    threads.comment(db, JONAS, one, "Wrong thread", at(minutes=40))
    threads.remove(db, JONAS, 3, at(minutes=35))
    threads.comment(db, WRITER, one, "I will pull the dates.", at(minutes=30))
    threads.react(db, INES, threads.Reaction(1, "Agree", True), at(minutes=20))
    threads.react(db, WRITER, threads.Reaction(1, "Agree", True), at(minutes=20))
    threads.react(db, WRITER, threads.Reaction(1, "Seen", True), at(minutes=20))
    note = threads.Item(None, "Has anyone looked at the closures?")
    two, _ = threads.share(db, INES, lev, note, YESTERDAY_1620)
    threads.comment(db, WRITER, two, "Closures look manageable.", YESTERDAY_1640)
    threads.reply(db, INES, 5, "Good. Add it to the list.", at(hours=2))
    threads.share(db, INES, lev, threads.Item(5), at(hours=3))
    threads.share(db, INES, prep, threads.Item(3, "Not for everyone."), at(hours=3))


@pytest.fixture
def grouped(tmp_path: Path) -> Any:
    db = seed_sample(tmp_path)
    seed_groups(db)
    yield db
    db.close()


def _story(snap: dict[str, Any], ident: str) -> dict[str, Any]:
    (found,) = [s for s in snap["feed"]["stories"] if s["id"] == ident]
    return found


LEV_MEMBERS = [
    {"initials": "TO", "name": "Tobias O"},
    {"initials": "IK", "name": "Ines K"},
    {"initials": "ML", "name": "Mara L"},
    {"initials": "JW", "name": "Jonas W"},
]
SHIP_MEMBERS = [
    {"initials": "ML", "name": "Mara L"},
    {"initials": "TO", "name": "Tobias O"},
    {"initials": "AS", "name": "Amir S"},
]


def test_the_writer_sees_the_groups_visible_to_her_with_their_threads(grouped, read_by_react):
    snap = read_by_react(grouped, WRITER)
    assert snap["channels"]["groups"] == [
        {"id": "1", "name": "Leveraged credit", "unread": "2"},
        {"id": "2", "name": "Shipping desk", "unread": None},
    ]
    lev, ship = snap["groups"]
    assert {key: lev[key] for key in ("id", "name", "visibility", "memberSummary")} == {
        "id": "1",
        "name": "Leveraged credit",
        "visibility": "Open to everyone",
        "memberSummary": "6 members",
    }
    assert (lev["members"], lev["moreMembers"]) == (LEV_MEMBERS, "+2")
    assert lev["threads"] == [
        {
            "id": "1",
            "storyId": "1",
            "note": None,
            "sharedBy": {"initials": "IK", "label": "Shared by Ines K, 1 h ago"},
            "commentCount": "4 comments",
            "archived": False,
            "unread": False,  # her own comment, 30 min ago, is the latest activity
            "lastActivity": "30 min ago",
        },
        {
            "id": "2",
            "storyId": None,
            "note": "Has anyone looked at the closures?",
            "sharedBy": {"initials": "IK", "label": "Ines K started a thread"},
            "commentCount": "2 comments",
            "archived": False,
            "unread": True,  # Ines K's reply came after Mara L's own comment
            "lastActivity": "2 h ago",
        },
        {
            "id": "3",
            "storyId": "5",
            "note": None,
            "sharedBy": {"initials": "IK", "label": "Shared by Ines K, 3 h ago"},
            "commentCount": None,
            "archived": False,
            "unread": True,
            "lastActivity": "3 h ago",
        },
    ]
    assert ship == {
        "id": "2",
        "name": "Shipping desk",
        "visibility": "Invited only",
        "memberSummary": "3 members",
        "members": SHIP_MEMBERS,
        "moreMembers": None,
        "threads": [],
    }


def test_a_thread_holds_its_comments_replies_removed_line_and_reactions(grouped, read_by_react):
    snap = read_by_react(grouped, WRITER)
    one = snap["threads"][0]
    assert {key: one[key] for key in one if key != "comments"} == {
        "id": "1",
        "groupId": "1",
        "storyId": "1",
        "note": None,
        "archived": False,
        "title": "Thread",
        "subline": "Leveraged credit, 4 comments",
        "archivedLine": None,
    }
    ines = {"initials": "IK", "name": "Ines K"}
    mara = {"initials": "ML", "name": "Mara L"}
    assert one["comments"] == [
        {
            "id": "1",
            "author": ines,
            "own": False,
            "time": "11:00 UTC",
            "text": "Sharing for Thursday.",
            "edited": False,
            "removed": False,
            "reactions": [
                {"word": "Agree", "count": "2", "mine": True},
                {"word": "Seen", "count": "1", "mine": True},
            ],
            "replies": [
                {
                    "id": "2",
                    "author": mara,
                    "own": True,
                    "time": "11:10 UTC",
                    "text": "Agreed. Check the test date.",
                    "edited": False,
                    "removed": False,
                    "reactions": [],
                    "replies": [],
                    "canEdit": False,  # her own, but 50 minutes old: past the 15-minute window
                    "canRemove": True,
                }
            ],
            "canEdit": False,  # Ines K's
            "canRemove": False,
        },
        {
            "id": "3",
            "author": {"initials": "JW", "name": "Jonas W"},
            "own": False,
            "time": "11:20 UTC",
            "text": None,
            "edited": False,
            "removed": True,
            "reactions": [],
            "replies": [],
            "canEdit": False,  # removed already
            "canRemove": False,
        },
        {
            "id": "4",
            "author": mara,
            "own": True,
            "time": "11:30 UTC",
            "text": "I will pull the dates.",
            "edited": False,
            "removed": False,
            "reactions": [],
            "replies": [],
            "canEdit": False,  # 30 minutes old
            "canRemove": True,
        },
    ]
    note = snap["threads"][1]
    assert (note["storyId"], note["note"], note["subline"]) == (
        None,
        "Has anyone looked at the closures?",
        "Leveraged credit, 2 comments",
    )
    assert [c["time"] for c in note["comments"]] == ["Yesterday 16:40 UTC"]
    assert [r["time"] for r in note["comments"][0]["replies"]] == ["10:00 UTC"]
    assert [t["id"] for t in snap["threads"]] == ["1", "2", "3"]


def test_shared_stories_carry_their_thread_and_are_in_the_feed(grouped, read_by_react):
    snap = read_by_react(grouped, WRITER)
    corvane = _story(snap, "1")
    assert (corvane["sharedBy"], corvane["commentCount"], corvane["threadRef"]) == (
        {"initials": "IK", "label": "Shared to Leveraged credit by Ines K"},
        "4",
        {"groupId": "1", "threadId": "1"},
    )
    halvorsen = _story(snap, "5")
    assert (halvorsen["commentCount"], halvorsen["threadRef"]) == (
        None,
        {"groupId": "1", "threadId": "3"},
    )
    # For you: the followed topic's Corvane and the stories shared in her groups.
    assert snap["feed"]["views"]["for-you"]["latest"] == ["1", "5"]


def test_nothing_of_a_group_she_cannot_see_reaches_her(grouped, read_by_react):
    snap = read_by_react(grouped, WRITER)
    brightwell = _story(snap, "3")
    assert (brightwell["sharedBy"], brightwell["commentCount"], brightwell["threadRef"]) == (
        None,
        None,
        None,
    )
    text = json.dumps({key: snap[key] for key in ("groups", "threads", "channels", "feed")})
    assert "Committee prep" not in text and "Not for everyone." not in text
    assert all(t["groupId"] != "3" for t in snap["threads"])
    # A writer manages every group, so Settings lists it with its members and topics, nothing
    # else.
    assert [g["name"] for g in snap["settings"]["groups"]] == [
        "Committee prep",
        "Leveraged credit",
        "Shipping desk",
    ]
    assert snap["settings"]["groups"][0] == {
        "id": "3",
        "name": "Committee prep",
        "members": [{"initials": "IK", "name": "Ines K"}],
        "moreMembers": None,
        "memberSummary": "1 member",
        "visibility": "Members only",
        "visibilityOptions": ["Visible to everyone", "Members only"],
        "topics": [],
        "rules": [
            {
                "id": "comments-edited",
                "label": "Comments can be edited for 15 minutes",
                "hint": 'An edited comment is marked "edited".',
                "on": True,
            },
            {
                "id": "authors-remove",
                "label": "Authors can remove their own comments",
                "hint": "The thread keeps a line saying a comment was removed.",
                "on": True,
            },
            {
                "id": "archive-quiet",
                "label": "Archive a thread after 90 days without a comment",
                "hint": "An archived thread can be read but not added to.",
                "on": False,
            },
        ],
    }


def test_a_reader_sees_visible_groups_and_settings_lists_no_other(grouped, read_by_react):
    snap = read_by_react(grouped, READER)  # Tobias O: member of 1 and 2
    assert [g["id"] for g in snap["groups"]] == ["1", "2"]
    assert [g["id"] for g in snap["settings"]["groups"]] == ["1", "2"]
    assert "Committee prep" not in json.dumps(snap)
    # Every thread is new to him; the badge counts the new threads of a group he is in.
    assert [t["unread"] for t in snap["groups"][0]["threads"]] == [True, True, True]
    assert snap["channels"]["groups"][0]["unread"] == "3"


def test_a_stranger_sees_only_the_open_group_and_no_badge(grouped, read_by_react):
    snap = read_by_react(grouped, User("Visitor", "reader"))
    assert [g["id"] for g in snap["groups"]] == ["1"]
    # Not a member: new threads raise no badge; the threads still say unread.
    assert snap["channels"]["groups"] == [{"id": "1", "name": "Leveraged credit", "unread": None}]
    assert [t["unread"] for t in snap["groups"][0]["threads"]] == [True, True, True]
    assert snap["feed"]["views"]["for-you"]["latest"] == []


def test_a_viewer_with_no_name_gets_no_groups(grouped, read_by_react):
    snap = read_by_react(grouped, None)
    assert (snap["groups"], snap["threads"], snap["channels"]["groups"]) == ([], [], [])
    assert (snap["settings"]["groups"], snap["settings"]["notifications"]) == ([], {"events": []})


def test_reading_a_thread_clears_its_unread_and_lowers_the_badge(grouped, read_by_react):
    threads.mark_read(grouped, WRITER, 2, NOW)
    snap = read_by_react(grouped, WRITER)
    assert [t["unread"] for t in snap["groups"][0]["threads"]] == [False, False, True]
    assert snap["channels"]["groups"][0]["unread"] == "1"


def test_the_in_signal_switches_decide_what_the_badge_counts(grouped, read_by_react):
    notif.set_switch(grouped, "Mara L", "threads", "inSignal", False)
    assert read_by_react(grouped, WRITER)["channels"]["groups"][0]["unread"] == "1"  # the reply
    notif.set_switch(grouped, "Mara L", "replies", "inSignal", False)
    snap = read_by_react(grouped, WRITER)
    assert snap["channels"]["groups"][0]["unread"] is None
    assert [t["unread"] for t in snap["groups"][0]["threads"]] == [False, True, True]


def test_an_archived_thread_is_listed_read_only_and_never_unread(grouped, read_by_react):
    groups.set_rule(grouped, WRITER, 1, "archive-quiet", True)
    later = NOW + timedelta(days=90)  # thread 1's last comment was 30 min before NOW
    snap = read_by_react(grouped, WRITER, later)
    lev = snap["groups"][0]
    assert [(t["id"], t["archived"], t["unread"]) for t in lev["threads"]] == [
        ("1", True, False),
        ("2", True, False),
        ("3", True, False),
    ]
    assert snap["threads"][0]["archivedLine"] == "Archived on 22 Feb"  # the year is later's own
    assert snap["channels"]["groups"][0]["unread"] is None


def test_thread_rules_and_notification_settings_are_delivered(grouped, read_by_react):
    groups.set_rule(grouped, WRITER, 1, "authors-remove", False)
    notif.set_switch(grouped, "Mara L", "digest", "onDesktop", True)
    settings = read_by_react(grouped, WRITER)["settings"]
    assert settings["rules"] == []  # per group now
    lev, ship = (g for g in settings["groups"] if g["id"] in ("1", "2"))
    assert [r["on"] for r in ship["rules"]] == [True, True, False]  # the defaults
    assert lev["rules"] == [
        {
            "id": "comments-edited",
            "label": "Comments can be edited for 15 minutes",
            "hint": 'An edited comment is marked "edited".',
            "on": True,
        },
        {
            "id": "authors-remove",
            "label": "Authors can remove their own comments",
            "hint": "The thread keeps a line saying a comment was removed.",
            "on": False,
        },
        {
            "id": "archive-quiet",
            "label": "Archive a thread after 90 days without a comment",
            "hint": "An archived thread can be read but not added to.",
            "on": False,
        },
    ]
    assert settings["notifications"] == {
        "events": [
            {
                "id": "replies",
                "label": "A reply to one of my comments",
                "inSignal": True,
                "onDesktop": False,
            },
            {
                "id": "threads",
                "label": "A new thread in one of my groups",
                "inSignal": True,
                "onDesktop": False,
            },
            {
                "id": "signal",
                "label": "A high-signal story in a topic I follow",
                "inSignal": True,
                "onDesktop": False,
            },
            {
                "id": "digest",
                "label": "A digest of mine is ready",
                "inSignal": True,
                "onDesktop": True,
            },
        ]
    }


def test_top_raises_discussed_stories_and_latest_stays_by_time(grouped, read_by_react):
    latest = read_by_react(grouped, WRITER)["feed"]["views"]["latest"]
    # Published: Tessaly 40 min, Corvane 2 h, Brightwell 26 h, Halvorsen 3 d, Gazette 9 d,
    # Lenmark 20 d ago. Corvane (one share, three live comments in her groups) beats Tessaly;
    # Halvorsen (one share): log 2 - 3 ln 2 = -2 ln 2 against Brightwell's -26/24 ln 2, so it
    # stays below.
    assert latest["latest"] == ["2", "1", "3", "5", "4", "6"]
    assert latest["top"] == ["1", "2", "3", "5", "4", "6"]


def test_a_topic_story_posts_into_the_group_and_shows_its_topic(tmp_path, read_by_react):
    db = seed_sample(tmp_path)
    shipping = groups.create_group(db, WRITER, "Ship talk", "everyone")
    groups.add_member(db, WRITER, shipping, "Mara L")
    groups.set_topics(db, WRITER, shipping, [3])  # Shipping: Halvorsen, Lenmark
    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story
    from deploy_workflow.signal.topics import match_story

    fetched = NOW - timedelta(minutes=5)
    entry = Entry("Lenmark sells two vessels", "https://wire.example/lenmark-2", fetched, "")
    assert add_story(db, 1, entry, fetched) == "new"
    match_story(db, 7)
    snap = read_by_react(db, WRITER)
    (item,) = snap["groups"][0]["threads"]
    assert (item["storyId"], item["sharedBy"]) == (
        "7",
        {"initials": "S", "label": "Posted from the topic Shipping, 5 min ago"},
    )
    assert _story(snap, "7")["sharedBy"] is None  # no colleague shared it
    assert _story(snap, "7")["threadRef"] == {"groupId": "1", "threadId": "1"}


def test_threads_and_comments_delivered_are_bounded(grouped, read_by_react, monkeypatch):
    monkeypatch.setattr(group_view, "THREADS_SHOWN", 2)
    monkeypatch.setattr(group_view, "COMMENTS_SHOWN", 1)
    snap = read_by_react(grouped, WRITER)
    assert [t["id"] for t in snap["groups"][0]["threads"]] == ["1", "2"]
    assert _story(snap, "5")["threadRef"] is None  # its thread is not delivered
    one = snap["threads"][0]
    assert [c["id"] for c in one["comments"]] == ["4"]
    assert one["subline"] == "Leveraged credit, 4 comments, the latest shown"
    # The badge counts the delivered threads only (2 raises it; 3, unread too, is not delivered),
    # so reading every thread shown clears it.
    assert snap["channels"]["groups"][0]["unread"] == "1"


def test_hostile_text_is_delivered_as_data(tmp_path, read_by_react):
    db = seed_sample(tmp_path)
    hostile = '<img src=x onerror="alert(1)"> **bold** </script>'
    made = groups.create_group(db, WRITER, hostile[:60], "everyone")
    thread, _ = threads.share(db, WRITER, made, threads.Item(None, hostile), NOW)
    threads.comment(db, WRITER, thread, hostile + "\n\nsecond line", NOW)
    snap = read_by_react(db, WRITER)
    assert snap["groups"][0]["name"] == hostile[:60].strip()
    assert snap["threads"][0]["note"] == hostile
    assert snap["threads"][0]["comments"][0]["text"] == hostile + "\n\nsecond line"


def test_the_whole_group_part_is_read_in_the_one_read_transaction(grouped, monkeypatch):
    seen: list[bool] = []
    original = group_view._add_group

    def spy(db: sqlite3.Connection, *rest: Any) -> None:
        seen.append(db.in_transaction)
        original(db, *rest)

    monkeypatch.setattr(group_view, "_add_group", spy)
    snapshot.build(grouped, WRITER, NOW)
    assert seen == [True, True]


def test_the_reader_check_does_refuse_a_broken_snapshot(grouped, reader_dir):
    built = snapshot.build(grouped, WRITER, NOW)
    snap = built["scenes"][0]["snapshot"]
    snap["feed"]["stories"] = [s for s in snap["feed"]["stories"] if s["id"] != "5"]
    for view in [*snap["feed"]["views"].values(), *snap["feed"]["topics"].values()]:
        for key in ("top", "latest", "older"):
            view[key] = [n for n in view[key] if n != "5"]
    assert reader_says(reader_dir, built) == (
        "refused: scenes[0].snapshot.groups[0].threads[2].storyId:"
        " expected the id of a story in the feed"
    )


def test_a_group_made_invited_disappears_with_everything_it_lent_its_stories(
    grouped, read_by_react
):
    stranger = User("Visitor", "reader")
    assert _story(read_by_react(grouped, stranger), "1")["threadRef"] == {
        "groupId": "1",
        "threadId": "1",
    }
    groups.set_visibility(grouped, WRITER, 1, "invited")
    snap = read_by_react(grouped, stranger)
    assert (snap["groups"], snap["threads"], snap["channels"]["groups"]) == ([], [], [])
    assert all(s["threadRef"] is None and s["sharedBy"] is None for s in snap["feed"]["stories"])
    assert "Leveraged credit" not in json.dumps(snap)
    # A member removed from it loses its threads and the stories it added to For you.
    groups.remove_member(grouped, WRITER, 1, "Mara L")
    mara = read_by_react(grouped, WRITER)
    assert [g["id"] for g in mara["groups"]] == ["2"]
    assert mara["feed"]["views"]["for-you"]["latest"] == ["1"]  # the followed topic's story


# Review finding 11: the cases each listed mutation of the unread, badge and Top rules survived.


def test_top_counts_only_threads_in_the_viewers_own_groups_and_live_comments(
    tmp_path, read_by_react
):
    """Story 2 (Tessaly, 40 min old) stays first in Top for Mara L unless Corvane (2 h old) is
    raised by her own groups: a share in an open group she is not a member of, or comments that
    were removed, raise nothing."""
    db = seed_sample(tmp_path)
    add_user(db, "Ines K", "writer")
    open_desk = groups.create_group(db, WRITER, "Open desk", "everyone")
    thread, _ = threads.share(db, INES, open_desk, threads.Item(1), at(minutes=30))
    for n in range(8):
        threads.comment(db, INES, thread, f"point {n}", at(minutes=20))
    top = read_by_react(db, WRITER)["feed"]["views"]["latest"]["top"]
    assert top[:2] == ["2", "1"]  # not a member: no raise
    mine = groups.create_group(db, WRITER, "Mine", "invited")
    groups.add_member(db, WRITER, mine, "Mara L")
    groups.add_member(db, WRITER, mine, "Ines K")
    own, _ = threads.share(db, INES, mine, threads.Item(1), at(minutes=30))
    made = [threads.comment(db, INES, own, f"line {n}", at(minutes=10)) for n in range(8)]
    for comment_id in made:
        threads.remove(db, INES, comment_id, at(minutes=5))
    # One share in her group, removed comments not counted: 1 + 1 = 2 against 2 h of age
    # (log 2 - 2/24 log 2 > -40/1440 log 2): raised above Tessaly.
    assert read_by_react(db, WRITER)["feed"]["views"]["latest"]["top"][:2] == ["1", "2"]
    # The order alone cannot tell the eight removed comments apart (it is raised either way):
    # the counts it reads hold one share and no live comment.
    assert group_view.engagement(db, "Mara L", [1]) == {1: (1, 0)}


def test_a_removed_comment_makes_nothing_unread_and_raises_no_badge(tmp_path, read_by_react):
    db = seed_sample(tmp_path)
    add_user(db, "Ines K", "writer")
    desk = groups.create_group(db, WRITER, "Desk", "everyone")
    groups.add_member(db, WRITER, desk, "Mara L")
    thread, _ = threads.share(db, WRITER, desk, threads.Item(None, "Note"), at(hours=2))
    mine = threads.comment(db, WRITER, thread, "Mine", at(hours=2))
    threads.mark_read(db, WRITER, thread, at(hours=1))
    reply = threads.reply(db, INES, mine, "A reply", at(minutes=30))
    other = threads.comment(db, INES, thread, "Another", at(minutes=30))
    snap = read_by_react(db, WRITER)
    assert snap["groups"][0]["threads"][0]["unread"] is True
    assert snap["channels"]["groups"][0]["unread"] == "1"  # the reply to her comment
    threads.remove(db, INES, reply, at(minutes=20))
    snap = read_by_react(db, WRITER)
    assert snap["groups"][0]["threads"][0]["unread"] is True  # "Another" is still unread
    assert snap["channels"]["groups"][0]["unread"] is None  # a removed reply raises no badge
    threads.remove(db, INES, other, at(minutes=20))
    assert read_by_react(db, WRITER)["groups"][0]["threads"][0]["unread"] is False


def test_an_edited_comment_is_marked_edited(tmp_path, read_by_react):
    db = seed_sample(tmp_path)
    desk = groups.create_group(db, WRITER, "Desk", "everyone")
    thread, _ = threads.share(db, WRITER, desk, threads.Item(None, "Note"), at(minutes=10))
    first = threads.comment(db, WRITER, thread, "First", at(minutes=10))
    threads.comment(db, WRITER, thread, "Second", at(minutes=9))
    threads.edit(db, WRITER, first, "First, fixed", at(minutes=8))
    (whole,) = read_by_react(db, WRITER)["threads"]
    assert [(c["text"], c["edited"]) for c in whole["comments"]] == [
        ("First, fixed", True),
        ("Second", False),
    ]


def test_comment_opens_the_thread_in_her_own_group_before_a_livelier_open_one(
    tmp_path, read_by_react
):
    db = seed_sample(tmp_path)
    add_user(db, "Ines K", "writer")
    mine = groups.create_group(db, WRITER, "Mine", "invited")
    groups.add_member(db, WRITER, mine, "Mara L")
    groups.add_member(db, WRITER, mine, "Ines K")
    lively = groups.create_group(db, WRITER, "Lively", "everyone")
    threads.share(db, INES, mine, threads.Item(1), at(hours=1))
    other, _ = threads.share(db, INES, lively, threads.Item(1), at(minutes=30))
    threads.comment(db, INES, other, "Busy here", at(minutes=5))
    story = _story(read_by_react(db, WRITER), "1")
    assert story["threadRef"] == {"groupId": str(mine), "threadId": "1"}
    assert story["commentCount"] is None  # her group's thread has no comment yet


def _group_topics(snap: dict[str, Any]) -> dict[str, list[str]]:
    listed = {t["id"] for t in snap["settings"]["topics"]}
    held = {g["name"]: g["topics"] for g in snap["settings"]["groups"]}
    assert all(set(ids) <= listed for ids in held.values())  # ids Settings' topics use
    return held


def test_settings_lists_each_groups_topics_as_set_replaced_and_cleared(grouped, read_by_react):
    from deploy_workflow.signal.topics import delete_topic

    # The sample's topics: 1 Packaging, 2 Telecoms, 3 Shipping.
    assert _group_topics(read_by_react(grouped, WRITER)) == {
        "Committee prep": [],
        "Leveraged credit": [],
        "Shipping desk": [],
    }
    groups.set_topics(grouped, WRITER, 2, ["3", 1])
    groups.set_topics(grouped, WRITER, 1, [2])
    held = _group_topics(read_by_react(grouped, WRITER))
    assert (held["Shipping desk"], held["Leveraged credit"]) == (["1", "3"], ["2"])  # by id
    groups.set_topics(grouped, WRITER, 2, [2])  # replaced
    groups.set_topics(grouped, WRITER, 1, [])  # cleared
    held = _group_topics(read_by_react(grouped, WRITER))
    assert (held["Shipping desk"], held["Leveraged credit"]) == (["2"], [])
    # A topic a group names cannot be deleted; once no group names it, it goes from every list.
    from deploy_workflow.signal.store import StoreError

    with pytest.raises(StoreError, match="a group still follows this topic"):
        delete_topic(grouped, 2)
    groups.set_topics(grouped, WRITER, 2, [3])
    delete_topic(grouped, 2)
    snap = read_by_react(grouped, WRITER)
    assert [t["id"] for t in snap["settings"]["topics"]] == ["1", "3"]
    assert _group_topics(snap)["Shipping desk"] == ["3"]
    # A reader's Settings lists the groups they see, with their topics too.
    assert _group_topics(read_by_react(grouped, READER))["Shipping desk"] == ["3"]


# Top over the whole delivered window (review-groups finding 5, spec 5.6)


def _forty(tmp_path: Path) -> sqlite3.Connection:
    """40 stories, story n published n minutes before NOW, all in the topic Plants that Tobias O
    follows; a group Desk with him as a member."""
    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story, open_db, propose_source, set_source_state
    from deploy_workflow.signal.topics import add_topic, follow

    db = open_db(tmp_path)
    for name in ("Mara L", "Ines K"):
        add_user(db, name, "writer")
    source = propose_source(db, "Wire", "news", "https://wire.example/feed", "Mara L")
    set_source_state(db, source, "approved")
    for n in range(1, 41):
        when = NOW - timedelta(minutes=n)
        add_story(db, source, Entry(f"Plants item {n}", f"https://w.example/{n}", when, ""), NOW)
    follow(db, "Tobias O", add_topic(db, "Plants", ["plants"], [], "Mara L"))
    desk = groups.create_group(db, WRITER, "Desk", "everyone")
    groups.add_member(db, WRITER, desk, "Tobias O")
    return db


def test_a_discussed_story_past_the_newest_thirty_rises_to_the_top(tmp_path, read_by_react):
    db = _forty(tmp_path)
    thread, _ = threads.share(db, WRITER, 1, threads.Item(31, "Read this."), NOW)
    for n in range(12):
        threads.comment(db, INES, thread, f"point {n}", NOW)
    # Story 31: one share and 13 live comments: log(1 + 1 + 3.25) - (31/1440) log 2, about 1.64,
    # against at most 0 for every quiet story.
    feed = read_by_react(db, READER)["feed"]
    assert feed["topics"]["1"]["latest"] == [str(n) for n in range(1, 31)]  # unfocused: 30
    focused = snapshot.build(db, READER, NOW, focus=snapshot.Focus(topic=1))
    from signal_reader_check import react_refusal

    assert react_refusal(focused) is None
    topic = focused["scenes"][0]["snapshot"]["feed"]["topics"]["1"]
    for view in (feed["views"]["for-you"], topic):
        assert view["top"][0] == "31"
        assert view["latest"] == [str(n) for n in range(1, 41)]
        assert sorted(view["top"]) == sorted(view["latest"]) and view["older"] == []
        assert view["shown"] == 30
        assert view["top"][1:] == [str(n) for n in range(1, 41) if n != 31]
    # Latest keeps its shape: the newest 30 (ranked among themselves) and the rest older.
    latest = feed["views"]["latest"]
    assert "shown" not in latest and "shown" not in feed["views"]["saved"]
    assert latest["latest"] == [str(n) for n in range(1, 31)]
    assert latest["older"] == [str(n) for n in range(31, 41)]


@settings(max_examples=15, deadline=None)
@given(
    st.lists(st.tuples(st.integers(1, 40), st.integers(0, 6)), max_size=8, unique_by=lambda x: x[0])
)
def test_top_is_the_rank_of_every_delivered_story(tmp_path_factory, shared):
    from deploy_workflow.signal import threadrank

    db = _forty(tmp_path_factory.mktemp("top"))
    for story, comments in shared:
        thread, _ = threads.share(db, WRITER, 1, threads.Item(story), NOW)
        for n in range(comments):
            threads.comment(db, INES, thread, f"c{n}", NOW)
    built = snapshot.build(db, READER, NOW)
    from signal_reader_check import react_refusal

    assert react_refusal(built) is None
    view = built["scenes"][0]["snapshot"]["feed"]["views"]["for-you"]
    engaged = {story: comments for story, comments in shared}
    standings = [
        threadrank.Standing(n, NOW - timedelta(minutes=n), int(n in engaged), engaged.get(n, 0))
        for n in range(1, 41)
    ]
    assert view["top"] == [str(n) for n in threadrank.top_order(standings, NOW)]
    assert sorted(view["top"], key=int) == sorted(view["latest"], key=int)
