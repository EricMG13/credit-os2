"""Threads: sharing, notes, comments, one level of replies, editing, removal, reactions, read
marks, archiving and the topic posts. Expected values are written by hand.

Users: Mara L and Ines K (writers), Tobias O (reader). Group 1 "Desk" (everyone, members Mara L
and Tobias O); group 2 "Closed" (invited, member Ines K only). Stories 1 and 2 exist.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from deploy_workflow.signal import groups, threads
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.groups import Conflict, Forbidden, GroupError, NotFound
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import add_story, open_db, propose_source, set_source_state
from deploy_workflow.signal.topics import add_topic, match_story

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")
INES = User("Ines K", "writer")
TOBIAS = User("Tobias O", "reader")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    source = propose_source(database, "Wire", "news", "https://wire.example/feed", "Mara L")
    set_source_state(database, source, "approved")
    for n, title in ((1, "Corvane closes two plants"), (2, "Tessaly sells its towers")):
        add_story(database, source, Entry(title, f"https://w.example/{n}", NOW, ""), NOW)
    desk = groups.create_group(database, MARA, "Desk", "everyone")
    groups.add_member(database, MARA, desk, "Mara L")
    groups.add_member(database, MARA, desk, "Tobias O")
    closed = groups.create_group(database, MARA, "Closed", "invited")
    groups.add_member(database, MARA, closed, "Ines K")
    yield database
    database.close()


def rows(db: sqlite3.Connection, sql: str, *args: object) -> list[tuple[object, ...]]:
    return [tuple(row) for row in db.execute(sql, args).fetchall()]


def comments(db: sqlite3.Connection) -> list[tuple[object, ...]]:
    return rows(db, "SELECT id, thread_id, parent_id, author, body FROM comments ORDER BY id")


def test_sharing_a_story_with_a_note_makes_the_note_the_sharers_first_comment(db):
    assert threads.share(db, MARA, 1, threads.Item(1, "Worth a look."), NOW) == (1, False)
    assert rows(db, "SELECT group_id, story_id, created_by, note, topic_id FROM threads") == [
        (1, 1, "Mara L", None, None)
    ]
    assert comments(db) == [(1, 1, None, "Mara L", "Worth a look.")]


def test_a_second_share_of_the_story_joins_its_thread_and_its_note_is_a_comment(db):
    threads.share(db, MARA, 1, threads.Item(1), NOW)
    later = NOW + timedelta(minutes=5)
    assert threads.share(db, INES, 1, threads.Item(1, "Me too."), later) == (1, True)
    assert threads.share(db, INES, 1, threads.Item(1), later) == (1, True)  # nothing to add
    assert threads.share(db, INES, 1, threads.Item(1, "  \n"), later) == (1, True)  # a blank box
    assert rows(db, "SELECT COUNT(*) FROM threads") == [(1,)]
    assert comments(db) == [(1, 1, None, "Ines K", "Me too.")]
    assert rows(db, "SELECT last_activity_at FROM threads") == [(later.isoformat(),)]
    # The same story in another group is that group's own thread.
    assert threads.share(db, INES, 2, threads.Item(1), later) == (2, False)


def test_a_note_alone_starts_a_thread_and_may_repeat(db):
    assert threads.share(db, MARA, 1, threads.Item(None, " Thursday?\r\nAgenda. "), NOW) == (
        1,
        False,
    )
    assert threads.share(db, MARA, 1, threads.Item(None, "Thursday?"), NOW) == (2, False)
    assert rows(db, "SELECT story_id, note FROM threads ORDER BY id") == [
        (None, "Thursday?\nAgenda."),
        (None, "Thursday?"),
    ]
    for empty in (None, "", "  \n ", 3):
        with pytest.raises(GroupError):
            threads.share(db, MARA, 1, threads.Item(None, empty), NOW)


def test_a_reader_reads_and_marks_read_but_posts_nothing(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    comment = threads.comment(db, MARA, thread, "First.", NOW)
    refused = [
        lambda: threads.share(db, TOBIAS, 1, threads.Item(2), NOW),
        lambda: threads.share(db, TOBIAS, 1, threads.Item(None, "Note"), NOW),
        lambda: threads.comment(db, TOBIAS, thread, "Mine.", NOW),
        lambda: threads.reply(db, TOBIAS, comment, "Mine.", NOW),
        lambda: threads.react(db, TOBIAS, threads.Reaction(comment, "Seen", True), NOW),
        lambda: threads.edit(db, TOBIAS, comment, "Mine.", NOW),
        lambda: threads.remove(db, TOBIAS, comment, NOW),
    ]
    for write in refused:
        with pytest.raises(Forbidden):
            write()
    threads.mark_read(db, TOBIAS, thread, NOW)
    assert rows(db, "SELECT user_name, thread_id FROM read_marks ORDER BY user_name") == [
        ("Mara L", 1),
        ("Tobias O", 1),
    ]


def test_a_group_the_writer_cannot_see_is_answered_as_missing(db):
    hidden, _ = threads.share(db, INES, 2, threads.Item(1, "Ours."), NOW)
    refused = [
        lambda: threads.share(db, MARA, 2, threads.Item(2), NOW),
        lambda: threads.comment(db, MARA, hidden, "Hello?", NOW),
        lambda: threads.reply(db, MARA, 1, "Hello?", NOW),
        lambda: threads.react(db, MARA, threads.Reaction(1, "Seen", True), NOW),
        lambda: threads.mark_read(db, MARA, hidden, NOW),
    ]
    for write in refused:
        with pytest.raises(NotFound):
            write()
    assert comments(db) == [(1, 1, None, "Ines K", "Ours.")]


def test_unknown_groups_stories_threads_and_comments(db):
    for write, text in [
        (lambda: threads.share(db, MARA, 9, threads.Item(1), NOW), "no group with id 9"),
        (lambda: threads.share(db, MARA, 1, threads.Item(9), NOW), "no story with id 9"),
        (lambda: threads.comment(db, MARA, 9, "x", NOW), "no thread with id 9"),
        (lambda: threads.reply(db, MARA, 9, "x", NOW), "no comment with id 9"),
        (lambda: threads.edit(db, MARA, 9, "x", NOW), "no comment with id 9"),
        (lambda: threads.remove(db, MARA, 9, NOW), "no comment with id 9"),
        (lambda: threads.mark_read(db, MARA, 9, NOW), "no thread with id 9"),
    ]:
        with pytest.raises(NotFound, match=text):
            write()


def test_replies_nest_one_level(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    top = threads.comment(db, MARA, thread, "Top.", NOW)
    answer = threads.reply(db, INES, top, "Answer.", NOW)
    assert comments(db) == [
        (top, thread, None, "Mara L", "Top."),
        (answer, thread, top, "Ines K", "Answer."),
    ]
    with pytest.raises(GroupError, match="replies nest one level") as caught:
        threads.reply(db, MARA, answer, "Deeper.", NOW)
    assert caught.value.status == 400
    threads.remove(db, MARA, top, NOW)
    with pytest.raises(Conflict, match="removed"):
        threads.reply(db, INES, top, "Late.", NOW)


def test_the_author_edits_for_fifteen_minutes_and_the_comment_is_marked_edited(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    comment = threads.comment(db, MARA, thread, "Frist.", NOW)
    threads.edit(db, MARA, comment, "First.", NOW + timedelta(minutes=15))
    assert rows(db, "SELECT body, edited_at FROM comments") == [
        ("First.", (NOW + timedelta(minutes=15)).isoformat())
    ]
    with pytest.raises(Conflict, match="15 minutes"):
        threads.edit(db, MARA, comment, "Later.", NOW + timedelta(minutes=15, microseconds=1))
    with pytest.raises(Forbidden, match="only its author"):
        threads.edit(db, INES, comment, "Hers.", NOW)
    groups.set_rule(db, MARA, 1, "comments-edited", False)
    with pytest.raises(Forbidden, match="cannot be edited"):
        threads.edit(db, MARA, comment, "Again.", NOW)
    assert rows(db, "SELECT body FROM comments") == [("First.",)]


def test_a_removed_comment_keeps_a_line_and_its_replies_and_loses_text_and_reactions(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    top = threads.comment(db, MARA, thread, "Wrong.", NOW)
    threads.reply(db, INES, top, "Why?", NOW)
    threads.react(db, INES, threads.Reaction(top, "Disagree", True), NOW)
    with pytest.raises(Forbidden, match="only its author"):
        threads.remove(db, INES, top, NOW)
    threads.remove(db, MARA, top, NOW)
    assert rows(db, "SELECT body, removed_at IS NOT NULL FROM comments ORDER BY id") == [
        ("", 1),
        ("Why?", 0),
    ]
    assert rows(db, "SELECT COUNT(*) FROM reactions") == [(0,)]
    for write in (
        lambda: threads.edit(db, MARA, top, "Back.", NOW),
        lambda: threads.remove(db, MARA, top, NOW),
        lambda: threads.react(db, INES, threads.Reaction(top, "Seen", True), NOW),
    ):
        with pytest.raises(Conflict, match="removed"):
            write()


def test_authors_cannot_remove_while_the_rule_is_off(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    comment = threads.comment(db, MARA, thread, "Stays.", NOW)
    groups.set_rule(db, MARA, 1, "authors-remove", False)
    with pytest.raises(Forbidden, match="cannot be removed"):
        threads.remove(db, MARA, comment, NOW)


def test_reactions_are_the_fixed_words_once_each_per_user(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    comment = threads.comment(db, MARA, thread, "Point.", NOW)
    for who, word in [(MARA, "Agree"), (MARA, "Agree"), (MARA, "Seen"), (INES, "Agree")]:
        threads.react(db, who, threads.Reaction(comment, word, True), NOW)
    threads.react(db, MARA, threads.Reaction(comment, "Seen", False), NOW)
    threads.react(db, MARA, threads.Reaction(comment, "Disagree", False), NOW)  # was not set
    assert rows(db, "SELECT user_name, word FROM reactions ORDER BY user_name, word") == [
        ("Ines K", "Agree"),
        ("Mara L", "Agree"),
    ]
    for word in ("agree", "Like", "", None):
        with pytest.raises(GroupError, match="Agree, Disagree or Seen"):
            threads.react(db, MARA, threads.Reaction(comment, word, True), NOW)


def test_a_thread_quiet_for_ninety_days_is_archived_only_while_the_rule_is_on(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    comment = threads.comment(db, MARA, thread, "Last word.", NOW)
    row = db.execute("SELECT * FROM threads").fetchone()
    quiet = NOW + timedelta(days=90)
    assert threads.archived_at(db, row, quiet + timedelta(days=400)) is None  # rule off
    groups.set_rule(db, MARA, 1, "archive-quiet", True)
    assert threads.archived_at(db, row, quiet - timedelta(microseconds=1)) is None
    assert threads.archived_at(db, row, quiet) == quiet
    refused = [
        lambda: threads.comment(db, INES, thread, "Late.", quiet),
        lambda: threads.reply(db, INES, comment, "Late.", quiet),
        lambda: threads.react(db, INES, threads.Reaction(comment, "Seen", True), quiet),
        lambda: threads.react(db, INES, threads.Reaction(comment, "Seen", False), quiet),
        lambda: threads.remove(db, MARA, comment, quiet),
        lambda: threads.share(db, INES, 1, threads.Item(1, "Again."), quiet),
    ]
    for write in refused:
        with pytest.raises(Conflict, match="archived"):
            write()
    assert threads.share(db, INES, 1, threads.Item(1), quiet) == (thread, True)  # adds nothing
    threads.mark_read(db, TOBIAS, thread, quiet)  # reading stays open
    groups.set_rule(db, MARA, 1, "archive-quiet", False)
    threads.comment(db, INES, thread, "Reopened.", quiet)


def test_a_comment_moves_the_threads_activity_and_marks_it_read_for_its_author(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1), NOW)
    later = NOW + timedelta(hours=1)
    threads.comment(db, INES, thread, "Seen it.", later)
    threads.comment(db, MARA, thread, "Earlier clock.", NOW + timedelta(minutes=1))
    assert rows(db, "SELECT last_activity_at FROM threads") == [(later.isoformat(),)]
    assert rows(db, "SELECT user_name, read_at FROM read_marks ORDER BY user_name") == [
        ("Ines K", later.isoformat()),
        ("Mara L", (NOW + timedelta(minutes=1)).isoformat()),
    ]
    threads.mark_read(db, MARA, thread, NOW)  # a read mark never moves back
    assert rows(db, "SELECT read_at FROM read_marks WHERE user_name='Mara L'") == [
        ((NOW + timedelta(minutes=1)).isoformat(),)
    ]


@pytest.mark.parametrize(
    ("raw", "kept"),
    [
        ("plain", "plain"),
        ("<b>x</b> **y** [z](javascript:1)", "<b>x</b> **y** [z](javascript:1)"),
        ("a\r\nb\rc\td", "a\nb\nc\td"),
        ("bell\x07 null\x00 esc\x1b", "bell null esc"),
        ("  trimmed  ", "trimmed"),
        ("x" * threads.MAX_TEXT, "x" * threads.MAX_TEXT),
    ],
)
def test_text_is_plain_and_kept_as_written(raw, kept):
    assert threads.clean_text(raw, "a comment") == kept


@pytest.mark.parametrize("raw", ["", " \n\t ", "\x00", "x" * (threads.MAX_TEXT + 1), None, 1])
def test_empty_long_or_non_text_is_refused(raw):
    with pytest.raises(GroupError) as caught:
        threads.clean_text(raw, "a comment")
    assert caught.value.status == 400


def test_a_groups_topics_post_each_new_story_once_per_group(db):
    packaging = add_topic(db, "Packaging", ["plants"], [], "Mara L")
    closures = add_topic(db, "Closures", ["closes"], [], "Mara L")
    groups.set_topics(db, MARA, 1, [packaging, closures])
    groups.set_topics(db, MARA, 2, [closures])
    fetched = NOW + timedelta(minutes=10)
    entry = Entry("Lenmark closes two plants", "https://w.example/3", fetched, "")
    assert add_story(db, 1, entry, fetched) == "new"
    assert match_story(db, 3) == [packaging, closures]
    match_story(db, 3)  # matching again posts nothing new
    assert rows(db, "SELECT group_id, story_id, created_by, topic_id, created_at FROM threads") == [
        (1, 3, None, packaging, fetched.isoformat()),
        (2, 3, None, closures, fetched.isoformat()),
    ]
    # A writer's later share joins the topic's thread.
    assert threads.share(db, MARA, 1, threads.Item(3, "Ours now."), fetched) == (1, True)
    # Stories 1 and 2 existed before the topics: they are not posted.
    assert rows(db, "SELECT COUNT(*) FROM threads WHERE story_id IN (1, 2)") == [(0,)]


def read_at(db: sqlite3.Connection, user: str, thread: int) -> object:
    found = rows(
        db, "SELECT read_at FROM read_marks WHERE user_name=? AND thread_id=?", user, thread
    )
    return found[0][0] if found else None


def test_a_writes_clock_is_read_once_it_holds_the_write_lock(db):
    """Review finding 9a: a comment whose time was taken before a reader's read mark but that
    committed after it was never unread. The routes now hand the clock to the write, which reads
    it inside its transaction, so it comes after every write committed before it."""
    thread, _ = threads.share(db, MARA, 1, threads.Item(1, "Mine."), NOW)
    seen: list[bool] = []

    def clock(at: datetime) -> threads.Moment:
        def now() -> datetime:
            seen.append(db.in_transaction)
            return at

        return now

    threads.mark_read(db, TOBIAS, thread, clock(NOW + timedelta(seconds=10, milliseconds=5)))
    made = threads.comment(db, INES, thread, "Late", clock(NOW + timedelta(seconds=11)))
    threads.reply(db, MARA, made, "Answer", clock(NOW + timedelta(seconds=12)))
    threads.edit(db, MARA, 1, "Mine, edited.", clock(NOW + timedelta(seconds=13)))
    threads.react(
        db, MARA, threads.Reaction(made, "Seen", True), clock(NOW + timedelta(seconds=14))
    )
    threads.remove(db, MARA, 3, clock(NOW + timedelta(seconds=15)))
    threads.share(db, INES, 1, threads.Item(None, "Note"), clock(NOW + timedelta(seconds=16)))
    assert seen == [True] * 7
    assert rows(db, "SELECT created_at FROM comments WHERE id=?", made) == [
        ("2026-11-24T12:00:11+00:00",)
    ]


def test_the_routes_hand_the_clock_to_the_write_not_a_time(monkeypatch):
    from deploy_workflow.signal import api_groups

    given: list[object] = []
    monkeypatch.setattr(threads, "comment", lambda db, actor, tid, text, at: given.append(at) or 9)

    class Req:
        db = None
        person = MARA
        groups = ("1",)

        @staticmethod
        def body() -> dict[str, object]:
            return {"text": "x"}

    api_groups._comment(Req())  # type: ignore[arg-type]
    assert given == [api_groups._now]


def test_joining_a_thread_by_sharing_does_not_mark_it_read_for_the_sharer(db):
    """Review finding 9b: the sharer shared from the feed and has not read the thread, so what
    others wrote there stays unread for them; their own comment never counts as unread."""
    thread, _ = threads.share(db, MARA, 1, threads.Item(1, "Mine."), NOW)
    threads.mark_read(db, INES, thread, NOW + timedelta(minutes=1))
    threads.comment(db, MARA, thread, "Second", NOW + timedelta(minutes=2))
    joined = threads.share(db, INES, 1, threads.Item(1, "Sharing too."), NOW + timedelta(minutes=3))
    assert joined == (thread, True)
    assert read_at(db, "Ines K", thread) == "2026-11-24T12:01:00+00:00"  # unmoved
    # A first share starts the sharer's own thread: it is read for them.
    threads.share(db, INES, 1, threads.Item(2, "Mine too."), NOW + timedelta(minutes=4))
    assert read_at(db, "Ines K", 2) == "2026-11-24T12:04:00+00:00"
    # Commenting or replying in the thread itself does mark it read.
    threads.comment(db, INES, thread, "Read it now", NOW + timedelta(minutes=5))
    assert read_at(db, "Ines K", thread) == "2026-11-24T12:05:00+00:00"


def test_the_owner_removes_a_thread_or_any_comment(db):
    thread, _ = threads.share(db, MARA, 1, threads.Item(1, "Mine."), NOW)
    reply = threads.reply(db, INES, 1, "Hers", NOW)
    threads.react(db, MARA, threads.Reaction(reply, "Agree", True), NOW)
    groups.set_rule(db, MARA, 1, "authors-remove", False)
    threads.moderate_comment(db, reply, NOW + timedelta(minutes=1))
    assert rows(db, "SELECT id, body, removed_at FROM comments ORDER BY id") == [
        (1, "Mine.", None),
        (2, "", "2026-11-24T12:01:00+00:00"),
    ]
    assert rows(db, "SELECT * FROM reactions") == []
    with pytest.raises(NotFound, match="no comment with id 9"):
        threads.moderate_comment(db, 9, NOW)
    threads.mark_read(db, TOBIAS, thread, NOW)
    assert threads.remove_thread(db, thread) == 2
    assert rows(db, "SELECT COUNT(*) FROM threads") == [(0,)]
    assert rows(db, "SELECT COUNT(*) FROM comments") == [(0,)]
    assert rows(db, "SELECT COUNT(*) FROM read_marks") == [(0,)]
    with pytest.raises(NotFound, match="no thread with id 1"):
        threads.remove_thread(db, thread)


def test_a_topic_story_is_not_posted_into_a_group_at_its_thread_bound(db, monkeypatch):
    monkeypatch.setattr(groups, "MAX_THREADS", 1)
    topic = add_topic(db, "Plants", ["plants"], [], "Mara L")
    groups.set_topics(db, MARA, 1, [topic])
    groups.set_topics(db, MARA, 2, [topic])
    threads.share(db, INES, 2, threads.Item(None, "Already one"), NOW)
    source = 1
    add_story(db, source, Entry("Corvane plants again", "https://w.example/3", NOW, ""), NOW)
    match_story(db, 3)
    assert rows(db, "SELECT group_id, story_id FROM threads ORDER BY id") == [(2, None), (1, 3)]


def _topic_stories(db: sqlite3.Connection, count: int) -> list[int]:
    """`count` new stories about plants, a minute apart (each later than those stored), each
    matched as the ingest pass does; returns their ids."""
    made = []
    held = int(db.execute("SELECT COUNT(*) FROM stories").fetchone()[0])
    for n in range(held, held + count):
        at = NOW - timedelta(hours=1) + timedelta(minutes=n)
        link = f"https://w.example/plants/{n}"
        add_story(db, 1, Entry(f"Corvane plants item {n} unique{n}", link, at, ""), at)
        made.append(int(db.execute("SELECT MAX(id) FROM stories").fetchone()[0]))
        match_story(db, made[-1])
    return made


def test_a_topic_post_into_a_full_group_takes_the_place_of_its_oldest_quiet_topic_post(
    db, monkeypatch
):
    monkeypatch.setattr(groups, "MAX_THREADS", 3)
    groups.set_topics(db, MARA, 1, [add_topic(db, "Plants", ["plants"], [], "Mara L")])
    first, second = _topic_stories(db, 2)
    note, _ = threads.share(db, MARA, 1, threads.Item(None, "A person's note"), NOW)
    assert rows(db, "SELECT story_id FROM threads WHERE group_id=1 ORDER BY id") == [
        (first,),
        (second,),
        (None,),
    ]
    (third,) = _topic_stories(db, 1)  # full: the oldest topic post without a comment goes
    assert rows(db, "SELECT story_id FROM threads WHERE group_id=1 ORDER BY id") == [
        (second,),
        (None,),
        (third,),
    ]
    talked = int(rows(db, "SELECT id FROM threads WHERE story_id=?", second)[0][0])
    threads.comment(db, MARA, talked, "Worth a look.", NOW)
    (fourth,) = _topic_stories(db, 1)  # the commented post and the note stay; the next goes
    assert rows(db, "SELECT story_id FROM threads WHERE group_id=1 ORDER BY id") == [
        (second,),
        (None,),
        (fourth,),
    ]
    with pytest.raises(Conflict, match="this group holds 3 threads, the most it can hold"):
        threads.share(db, MARA, 1, threads.Item(None, "One more note"), NOW)
    assert note == 3


def test_a_full_group_with_no_quiet_topic_post_takes_no_story_and_says_so(db, monkeypatch):
    from deploy_workflow.signal import group_view

    monkeypatch.setattr(groups, "MAX_THREADS", 2)
    groups.set_topics(db, MARA, 1, [add_topic(db, "Plants", ["plants"], [], "Mara L")])
    for text in ("One", "Two"):
        threads.share(db, MARA, 1, threads.Item(None, text), NOW)
    assert not threads.topics_blocked(db, 2)  # a full group that follows no topic is not blocked
    _topic_stories(db, 1)
    assert rows(db, "SELECT note FROM threads WHERE group_id=1 ORDER BY id") == [("One",), ("Two",)]
    assert threads.topics_blocked(db, 1)
    parts = group_view.build(db, MARA, NOW)
    assert parts.groups[0]["more"] == (
        "The group is full, so new stories from its topics are not posted here."
    )
    monkeypatch.setattr(group_view, "THREADS_SHOWN", 1)
    assert group_view.build(db, MARA, NOW).groups[0]["more"] == (
        "Showing the latest 1 of 2 threads."
        " The group is full, so new stories from its topics are not posted here."
    )


def test_the_owner_prunes_a_groups_old_topic_posts_that_hold_no_comment(db):
    groups.set_topics(db, MARA, 1, [add_topic(db, "Plants", ["plants"], [], "Mara L")])
    old, kept, recent = _topic_stories(db, 3)
    db.execute("UPDATE threads SET last_activity_at=? WHERE story_id IN (?, ?)", (
        (NOW - timedelta(days=40)).isoformat(), old, kept))
    db.commit()
    talked = int(rows(db, "SELECT id FROM threads WHERE story_id=?", kept)[0][0])
    threads.comment(db, MARA, talked, "Still relevant.", NOW)
    threads.share(db, MARA, 1, threads.Item(None, "A person's old note"), NOW - timedelta(days=50))
    assert threads.prune_topic_posts(db, 1, NOW - timedelta(days=30)) == 1
    assert rows(db, "SELECT story_id, note FROM threads WHERE group_id=1 ORDER BY id") == [
        (kept, None),
        (recent, None),
        (None, "A person's old note"),
    ]
    with pytest.raises(NotFound, match="no group with id 9"):
        threads.prune_topic_posts(db, 9, NOW)


def test_an_author_who_can_no_longer_see_the_group_cannot_touch_their_comment(db):
    """Review finding 11 (own_edit_in_unseen_group_allowed): the author's own comment in a group
    they no longer see is answered as no comment at all."""
    thread, _ = threads.share(db, MARA, 1, threads.Item(1, "Mine."), NOW)
    groups.set_visibility(db, MARA, 1, "invited")
    groups.remove_member(db, MARA, 1, "Mara L")
    for call in (
        lambda: threads.edit(db, MARA, 1, "x", NOW),
        lambda: threads.remove(db, MARA, 1, NOW),
        lambda: threads.reply(db, MARA, 1, "x", NOW),
        lambda: threads.react(db, MARA, threads.Reaction(1, "Seen", True), NOW),
    ):
        with pytest.raises(NotFound) as refused:
            call()
        assert str(refused.value) == "no comment with id 1"
    assert thread == 1


def test_two_groups_with_different_rules_behave_differently(db):
    """Spec 5.7: the rules are per group. Desk switches all three away from the defaults;
    Closed keeps them."""
    old = NOW - timedelta(days=91)
    desk, _ = threads.share(db, MARA, 1, threads.Item(None, "Desk note"), old)
    closed, _ = threads.share(db, INES, 2, threads.Item(None, "Closed note"), old)
    mine = threads.comment(db, MARA, desk, "Mine", NOW - timedelta(minutes=1))
    hers = threads.comment(db, INES, closed, "Hers", NOW - timedelta(minutes=1))
    for rule, on in (("comments-edited", False), ("authors-remove", False)):
        groups.set_rule(db, MARA, 1, rule, on)
    with pytest.raises(Forbidden, match="comments cannot be edited in this group"):
        threads.edit(db, MARA, mine, "x", NOW)
    with pytest.raises(Forbidden, match="comments cannot be removed in this group"):
        threads.remove(db, MARA, mine, NOW)
    threads.edit(db, INES, hers, "Hers, edited", NOW)
    threads.remove(db, INES, hers, NOW)
    # Archiving: both threads were quiet for 91 days before their comments; 91 days on, only
    # Desk's rule archives.
    later = NOW + timedelta(days=91)
    groups.set_rule(db, MARA, 1, "archive-quiet", True)
    row = {n: db.execute("SELECT * FROM threads WHERE id=?", (n,)).fetchone() for n in (1, 2)}
    assert threads.archived_at(db, row[1], later) is not None
    assert threads.archived_at(db, row[2], later) is None
    assert threads.thread_state(db, row[1], later) == threads.ThreadState(True, False, False)
    assert threads.thread_state(db, row[2], later) == threads.ThreadState(False, True, True)
    with pytest.raises(Conflict, match="archived"):
        threads.comment(db, MARA, desk, "Too late", later)
    threads.comment(db, INES, closed, "Still open", later)
