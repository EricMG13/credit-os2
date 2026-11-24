"""Groups: who manages them, visibility, members, topics, deletion and the thread rules.

Expected values are written by hand. Users: Mara L (writer), Olu A (owner), Tobias O (reader).
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.signal import groups, threads
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.groups import Conflict, Forbidden, GroupError, NotFound
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import add_story, open_db, propose_source, set_source_state
from deploy_workflow.signal.topics import add_topic

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
WRITER = User("Mara L", "writer")
OWNER = User("Olu A", "owner")
READER = User("Tobias O", "reader")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    source = propose_source(database, "Wire", "news", "https://wire.example/feed", "Mara L")
    set_source_state(database, source, "approved")
    add_story(
        database, source, Entry("Corvane closes two plants", "https://w.example/1", NOW, ""), NOW
    )
    yield database
    database.close()


def test_writers_and_the_owner_create_groups_and_a_reader_cannot(db):
    assert groups.create_group(db, WRITER, "Leveraged credit", "everyone") == 1
    assert groups.create_group(db, OWNER, "Shipping desk", "invited") == 2
    with pytest.raises(Forbidden, match="only a writer can manage groups"):
        groups.create_group(db, READER, "Readers", "everyone")
    assert [r["name"] for r in db.execute("SELECT name FROM groups ORDER BY id")] == [
        "Leveraged credit",
        "Shipping desk",
    ]


@pytest.mark.parametrize(
    ("raw", "kept"),
    [
        ("  Leveraged   credit ", "Leveraged credit"),
        ("Tab\there\nand line", "Tab here and line"),
        ("<b>Bold</b> & co", "<b>Bold</b> & co"),
        ("x" * 60, "x" * 60),
    ],
)
def test_a_group_name_is_one_trimmed_line_kept_as_written(db, raw, kept):
    made = groups.create_group(db, WRITER, raw, "everyone")
    assert db.execute("SELECT name FROM groups WHERE id=?", (made,)).fetchone()[0] == kept


@pytest.mark.parametrize("raw", ["", "   ", "x" * 61, None, 5, ["a"]])
def test_an_empty_long_or_non_text_name_is_refused(db, raw):
    with pytest.raises(GroupError) as caught:
        groups.create_group(db, WRITER, raw, "everyone")
    assert caught.value.status == 400


def test_a_name_and_a_visibility_are_checked(db):
    groups.create_group(db, WRITER, "Desk", "everyone")
    with pytest.raises(Conflict, match="already exists"):
        groups.create_group(db, WRITER, "Desk", "invited")
    with pytest.raises(GroupError, match="visibility must be 'everyone' or 'invited'"):
        groups.create_group(db, WRITER, "Other", "members")


def test_the_number_of_groups_is_capped(db, monkeypatch):
    monkeypatch.setattr(groups, "MAX_GROUPS", 2)
    groups.create_group(db, WRITER, "One", "everyone")
    groups.create_group(db, WRITER, "Two", "everyone")
    with pytest.raises(Conflict, match="at most 2 groups"):
        groups.create_group(db, WRITER, "Three", "everyone")


def test_visibility_everyone_or_invited_decides_who_sees_a_group(db):
    open_one = groups.create_group(db, WRITER, "Open", "everyone")
    closed = groups.create_group(db, WRITER, "Closed", "invited")
    groups.add_member(db, WRITER, closed, "Tobias O")
    assert groups.visible_group_ids(db, "Tobias O") == [open_one, closed]
    assert groups.visible_group_ids(db, "Mara L") == [open_one]  # a writer is not a member
    assert groups.visible_group_ids(db, "Someone") == [open_one]
    assert groups.member_group_ids(db, "Tobias O") == [closed]
    groups.set_visibility(db, WRITER, open_one, "invited")
    groups.set_visibility(db, OWNER, closed, "everyone")
    assert groups.visible_group_ids(db, "Mara L") == [closed]
    with pytest.raises(Forbidden):
        groups.set_visibility(db, READER, closed, "invited")
    with pytest.raises(NotFound, match="no group with id 9"):
        groups.set_visibility(db, WRITER, 9, "invited")
    with pytest.raises(GroupError):
        groups.set_visibility(db, WRITER, closed, "Members only")


def test_members_are_added_by_cleaned_name_once_and_removed(db):
    made = groups.create_group(db, WRITER, "Desk", "invited")
    assert groups.add_member(db, WRITER, made, "  Ines   K ") == "Ines K"
    groups.add_member(db, OWNER, made, "Ines K")
    groups.add_member(db, WRITER, made, "<script>")
    assert groups.members(db, made) == ["Ines K", "<script>"]
    groups.remove_member(db, WRITER, made, "Ines K")
    groups.remove_member(db, WRITER, made, "nobody")  # not a member: nothing changes
    assert groups.members(db, made) == ["<script>"]
    with pytest.raises(Forbidden):
        groups.add_member(db, READER, made, "Tobias O")
    with pytest.raises(Forbidden):
        groups.remove_member(db, READER, made, "<script>")
    with pytest.raises(GroupError, match="must not be empty"):
        groups.add_member(db, WRITER, made, " \t ")
    with pytest.raises(NotFound):
        groups.add_member(db, WRITER, 7, "Ines K")


def test_the_number_of_members_is_capped(db, monkeypatch):
    monkeypatch.setattr(groups, "MAX_MEMBERS", 1)
    made = groups.create_group(db, WRITER, "Desk", "invited")
    groups.add_member(db, WRITER, made, "One")
    with pytest.raises(Conflict, match="at most 1 members"):
        groups.add_member(db, WRITER, made, "Two")


def test_topics_are_replaced_and_checked(db):
    made = groups.create_group(db, WRITER, "Desk", "everyone")
    one = add_topic(db, "Packaging", ["plants"], [], "Mara L")
    two = add_topic(db, "Ratings", ["downgrade"], [], "Mara L")
    assert groups.set_topics(db, WRITER, made, [two, one, two]) == [one, two]
    assert groups.set_topics(db, WRITER, made, [two]) == [two]
    assert groups.group_topic_ids(db, made) == [two]
    with pytest.raises(NotFound, match="no topic with id 99"):
        groups.set_topics(db, WRITER, made, [one, 99])
    assert groups.group_topic_ids(db, made) == [two]  # a refused write changes nothing
    assert groups.set_topics(db, WRITER, made, [str(one)]) == [one]  # the snapshot's text id
    for bad in ([True], ["x"], [0], [1.0], "1", None):
        with pytest.raises(GroupError):
            groups.set_topics(db, WRITER, made, bad)
    with pytest.raises(Forbidden):
        groups.set_topics(db, READER, made, [])
    assert groups.set_topics(db, WRITER, made, []) == []


def test_a_group_without_threads_can_be_deleted_one_with_threads_cannot(db):
    empty = groups.create_group(db, WRITER, "Empty", "invited")
    groups.add_member(db, WRITER, empty, "Ines K")
    groups.delete_group(db, WRITER, empty)
    assert db.execute("SELECT COUNT(*) FROM group_members").fetchone()[0] == 0
    busy = groups.create_group(db, WRITER, "Busy", "everyone")
    assert busy == empty + 1  # a deleted group's id is not given again
    threads.share(db, WRITER, busy, threads.Item(1), NOW)
    with pytest.raises(Conflict, match="holds threads"):
        groups.delete_group(db, WRITER, busy)
    with pytest.raises(Forbidden):
        groups.delete_group(db, READER, busy)
    with pytest.raises(NotFound):
        groups.delete_group(db, WRITER, empty)


def test_rename(db):
    one = groups.create_group(db, WRITER, "One", "everyone")
    groups.create_group(db, WRITER, "Two", "everyone")
    groups.rename_group(db, WRITER, one, " Uno ")
    assert db.execute("SELECT name FROM groups WHERE id=?", (one,)).fetchone()[0] == "Uno"
    with pytest.raises(Conflict):
        groups.rename_group(db, WRITER, one, "Two")
    with pytest.raises(Forbidden):
        groups.rename_group(db, READER, one, "Mine")
    with pytest.raises(NotFound):
        groups.rename_group(db, WRITER, 5, "Five")


def test_each_group_has_its_own_thread_rules_starting_at_the_defaults(db):
    desk = groups.create_group(db, WRITER, "Desk", "everyone")
    other = groups.create_group(db, WRITER, "Other", "everyone")
    assert [groups.rule_on(db, desk, r) for r in groups.RULES] == [True, True, False]
    groups.set_rule(db, WRITER, desk, "archive-quiet", True)
    groups.set_rule(db, OWNER, desk, "archive-quiet", True)  # repeating keeps one row
    groups.set_rule(db, WRITER, desk, "comments-edited", False)
    assert [groups.rule_on(db, desk, r) for r in groups.RULES] == [False, True, True]
    assert [groups.rule_on(db, other, r) for r in groups.RULES] == [True, True, False]
    assert db.execute("SELECT COUNT(*) FROM thread_rules").fetchone()[0] == 2
    groups.set_rule(db, WRITER, desk, "archive-quiet", False)
    assert groups.rule_on(db, desk, "archive-quiet") is False
    # A new group starts at the defaults; a deleted group's rules go with it.
    groups.delete_group(db, WRITER, desk)
    assert db.execute("SELECT COUNT(*) FROM thread_rules").fetchone()[0] == 0
    third = groups.create_group(db, WRITER, "Third", "everyone")
    assert [groups.rule_on(db, third, r) for r in groups.RULES] == [True, True, False]
    with pytest.raises(Forbidden):
        groups.set_rule(db, READER, other, "archive-quiet", False)
    with pytest.raises(NotFound, match="no thread rule 'archive-30'"):
        groups.set_rule(db, WRITER, other, "archive-30", True)
    with pytest.raises(GroupError, match="on must be true or false"):
        groups.set_rule(db, WRITER, other, "archive-quiet", 1)
    with pytest.raises(NotFound, match="no group with id 99"):
        groups.set_rule(db, WRITER, 99, "archive-quiet", True)


def test_the_migration_holds_the_names_the_digests_rely_on(db):
    columns = {
        table: [row[1] for row in db.execute(f"PRAGMA table_info({table})")]
        for table in ("groups", "group_members", "threads")
    }
    assert columns["groups"][:3] == ["id", "name", "visibility"]
    assert columns["group_members"] == ["group_id", "user_name"]
    assert {"id", "group_id", "story_id", "created_at"} <= set(columns["threads"])
    with pytest.raises(sqlite3.IntegrityError), db:
        db.execute(
            "INSERT INTO groups(name, visibility, created_by, created_at)"
            " VALUES('x', 'all', 'a', 'b')"
        )
