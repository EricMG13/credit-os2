"""A group digest and the threads topics post into a group (C5-F2): ingest stamps such a thread
with the story's fetch time, before its commit, so a run that ended in between must still find it
in the next run, once. A real store; the writer is a test double for the model call only."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import timedelta
from pathlib import Path

import pytest
from test_signal_digest import NOW, WRITER, RecordingWriter, at, make, share, source, story

from deploy_workflow.signal import digests, groups, store, threads, topics


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = store.open_db(tmp_path)
    yield database
    database.close()


def _desk(db: sqlite3.Connection) -> tuple[int, int]:
    topic = topics.add_topic(db, "Plants", ["plant"], [], "Mara L")
    group = groups.create_group(db, WRITER, "Desk", "everyone")
    groups.set_topics(db, WRITER, group, [topic])
    return group, topic


def test_a_thread_committed_after_a_runs_end_but_stamped_before_it_is_in_the_next_run_once(db):
    wire = source(db)
    _, topic = _desk(db)
    ident = make(db, covers=["Group: Desk"])
    digests.run_now(db, "Mara L", ident, NOW)  # nothing yet: the period ends at 12:00
    # ingest stamped the story 11:59 (the pass's clock) and committed it after that run
    late = story(db, wire, "Plant closure", at("2026-11-24 11:59"))
    threads.post_topic_story(db, late, [topic])
    db.commit()
    writer = RecordingWriter()
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=1), writer)
    assert [[one.id for one in scope.stories] for scope in writer.scopes] == [[late]]
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=2), writer)
    assert len(writer.scopes) == 1  # not counted again: the second run found nothing


def test_a_thread_a_person_shares_in_the_period_is_still_in_it_once(db):
    wire = source(db)
    group, _ = _desk(db)
    shared = story(db, wire, "Plant closure", at("2026-11-24 09:00"))
    ident = make(db, covers=["Group: Desk"])
    digests.run_now(db, "Mara L", ident, NOW - timedelta(hours=1))
    share(db, group, shared, at("2026-11-24 11:30"))
    writer = RecordingWriter()
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=1), writer)
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=2), writer)
    assert [[one.id for one in scope.stories] for scope in writer.scopes] == [[shared]]


def test_a_topic_thread_stamped_after_the_pass_clock_is_in_one_run_only(db):
    wire = source(db)
    _, topic = _desk(db)
    ident = make(db, covers=["Group: Desk"])
    digests.run_now(db, "Mara L", ident, NOW)
    # another process's ingest stamped the story 13:01, after this pass's clock (13:00), and
    # committed it before this digest's scope was read
    late = story(db, wire, "Plant closure", at("2026-11-24 13:01"))
    threads.post_topic_story(db, late, [topic])
    db.commit()
    writer = RecordingWriter()
    digests.run_now(db, "Mara L", ident, at("2026-11-24 13:00"), writer)
    digests.run_now(db, "Mara L", ident, at("2026-11-24 14:00"), writer)
    assert [[one.id for one in scope.stories] for scope in writer.scopes] == [[late]]


def test_a_topic_thread_whose_topic_was_deleted_is_still_found_by_the_mark(db):
    wire = source(db)
    group, topic = _desk(db)
    ident = make(db, covers=["Group: Desk"])
    digests.run_now(db, "Mara L", ident, NOW)
    late = story(db, wire, "Plant closure", at("2026-11-24 11:59"))
    threads.post_topic_story(db, late, [topic])
    db.commit()
    groups.set_topics(db, WRITER, group, [])
    topics.delete_topic(db, topic)
    writer = RecordingWriter()
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=1), writer)
    assert [[one.id for one in scope.stories] for scope in writer.scopes] == [[late]]
