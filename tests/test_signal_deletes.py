"""Deleting from a long-running store: every foreign key's child column leads an index (review
finding F3: deleting a thread scanned the whole read-marks table, and pruning a group held the write
lock past the busy timeout), and the owner's bulk deletes work in batches that release the lock
between them. Expected values are written by hand."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.signal import groups, threads
from deploy_workflow.signal.groups import NotFound
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import _BUSY_SECONDS, open_db

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")
LONG_AGO = "2020-01-01T00:00:00+00:00"


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    yield database
    database.close()


def _led_by_an_index(db: sqlite3.Connection, table: str, column: str) -> bool:
    """Whether `column` is the first column of an index on `table` (or its integer key)."""
    for index in db.execute(f"PRAGMA index_list({table})").fetchall():
        first = db.execute(f"PRAGMA index_info({index['name']})").fetchone()
        if first is not None and first["name"] == column:
            return True
    info = db.execute(f"PRAGMA table_info({table})").fetchall()
    keys = [row for row in info if row["pk"]]
    return len(keys) == 1 and keys[0]["name"] == column and keys[0]["type"] == "INTEGER"


def test_every_foreign_keys_child_column_leads_an_index(db):
    """Deleting a parent row finds its children through an index, never by scanning the table."""
    tables = [
        row["name"]
        for row in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            " AND name NOT LIKE 'stories_fts%'"
        )
    ]
    unled = [
        (table, key["from"])
        for table in tables
        for key in db.execute(f"PRAGMA foreign_key_list({table})").fetchall()
        if not _led_by_an_index(db, table, key["from"])
    ]
    assert unled == []


def test_the_guard_sees_a_foreign_key_with_no_index(db):
    """The check above is not vacuous: a table whose key has none is reported."""
    db.execute("CREATE TABLE child(a INTEGER REFERENCES threads(id), b INTEGER)")
    assert not _led_by_an_index(db, "child", "a")
    db.execute("CREATE INDEX child_b_a ON child(b, a)")
    assert not _led_by_an_index(db, "child", "a")
    db.execute("CREATE INDEX child_a ON child(a)")
    assert _led_by_an_index(db, "child", "a")


def _seed_group(db: sqlite3.Connection, count: int, *, topic_posts: bool = False) -> int:
    """A group with `count` threads, each with a comment, a reaction and a read mark (or, with
    `topic_posts`, comment-less topic posts from long ago)."""
    with db:
        group = int(
            db.execute(
                "INSERT INTO groups(name, visibility, created_by, created_at)"
                " VALUES('Desk', 'everyone', 'x', 'x')"
            ).lastrowid  # type: ignore[arg-type]
        )
        if topic_posts:
            db.execute("INSERT INTO topics VALUES(1, 'Plants', '[\"p\"]', '[]', 'Mara L', 'x')")
        for n in range(count):
            thread = db.execute(
                "INSERT INTO threads(group_id, created_at, topic_id, note, last_activity_at)"
                " VALUES(?, ?, ?, 'n', ?)",
                (group, LONG_AGO, 1 if topic_posts else None, LONG_AGO),
            ).lastrowid
            if not topic_posts:
                comment = db.execute(
                    "INSERT INTO comments(thread_id, author, body, created_at)"
                    " VALUES(?, 'a', 'b', ?)",
                    (thread, LONG_AGO),
                ).lastrowid
                db.execute("INSERT INTO reactions VALUES(?, 'u', 'Seen')", (comment,))
            db.execute("INSERT INTO read_marks VALUES(?, ?, ?)", (f"user {n}", thread, LONG_AGO))
    return group


class _Watch:
    """What a second connection sees of `table` each time the connection under test is about to
    start a write transaction: the progress committed so far."""

    def __init__(self, path: Path, db: sqlite3.Connection, table: str) -> None:
        self.other = sqlite3.connect(path / "signal" / "signal.db", timeout=_BUSY_SECONDS)
        self.table, self.seen = table, []
        db.set_trace_callback(self._trace)

    def _trace(self, statement: str) -> None:
        if statement.startswith("BEGIN IMMEDIATE"):
            self.seen.append(self.other.execute(f"SELECT COUNT(*) FROM {self.table}").fetchone()[0])


def test_pruning_a_group_commits_in_batches(db, tmp_path, monkeypatch):
    """Review finding F3: pruning 999 threads held the write lock for 31 s. Each batch of at most
    ``groups.BATCH`` threads is its own transaction."""
    monkeypatch.setattr(groups, "BATCH", 3)
    group = _seed_group(db, 8, topic_posts=True)
    watch = _Watch(tmp_path, db, "threads")
    assert threads.prune_topic_posts(db, group, NOW) == 8
    assert watch.seen == [8, 5, 2]  # three batches (3, 3, 2), each committed before the next began
    assert db.execute("SELECT COUNT(*) FROM read_marks").fetchone()[0] == 0
    with pytest.raises(NotFound, match="no group with id 99"):
        threads.prune_topic_posts(db, 99, NOW)


def test_deleting_a_group_with_its_threads_commits_in_batches(db, tmp_path, monkeypatch):
    monkeypatch.setattr(groups, "BATCH", 3)
    group = _seed_group(db, 7)
    watch = _Watch(tmp_path, db, "threads")
    groups.remove_group(db, group, with_threads=True)
    assert watch.seen == [7, 4, 1]
    counts = [
        db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("groups", "threads", "comments", "reactions", "read_marks")
    ]
    assert counts == [0, 0, 0, 0, 0]
    with pytest.raises(NotFound, match=f"no group with id {group}"):
        groups.remove_group(db, group, with_threads=True)


def test_a_thread_posted_while_a_group_is_being_emptied_goes_with_it(db, monkeypatch):
    monkeypatch.setattr(groups, "BATCH", 2)
    group = _seed_group(db, 4)
    real = groups._write_transaction
    batches: list[int] = []

    @contextmanager
    def watched(connection: sqlite3.Connection) -> Iterator[None]:
        with real(connection):
            yield
        batches.append(1)
        if len(batches) == 1:  # a writer posts between two batches
            threads.share(connection, MARA, group, threads.Item(None, "Late"), NOW)

    monkeypatch.setattr(groups, "_write_transaction", watched)
    groups.remove_group(db, group, with_threads=True)
    assert db.execute("SELECT COUNT(*) FROM groups").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM threads").fetchone()[0] == 0
    assert len(batches) == 3


def test_a_group_with_threads_is_still_refused_without_the_flag(db):
    group = _seed_group(db, 1)
    with pytest.raises(groups.Conflict, match="a group that holds threads cannot be deleted"):
        groups.remove_group(db, group, with_threads=False)
    assert db.execute("SELECT COUNT(*) FROM threads").fetchone()[0] == 1


def test_the_read_marks_of_a_thread_are_found_through_an_index(db):
    plan = [
        str(row[3])
        for row in db.execute("EXPLAIN QUERY PLAN SELECT 1 FROM read_marks WHERE thread_id = 5")
    ]
    assert any("idx_read_marks_thread" in step for step in plan)
