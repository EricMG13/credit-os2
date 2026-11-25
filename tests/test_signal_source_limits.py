"""The Sources section's bound and the owner's clean-up of sources and digests (review finding F4:
nothing could remove a source, and 1,500 of them took the snapshot past its 4 MiB reply bound).
Expected values are written by hand. Every snapshot built here is read by the real React reader."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)

from deploy_workflow.signal import snapshot
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import (
    MAX_ALL_PENDING,
    Conflict,
    _utc_text,
    open_db,
    propose_source_limited,
    set_source_state,
)

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    yield database
    database.close()


def _add(db: sqlite3.Connection, name: str, state: str, *, failing: bool = False) -> int:
    """A source of this name and state; `failing`: its last check failed."""
    source = db.execute(
        "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
        " VALUES(?, 'news', ?, ?, 'Mara L', ?)",
        (name, f"https://{name.replace(' ', '-')}.example/feed", state, _utc_text(NOW)),
    ).lastrowid
    if state == "approved":
        db.execute(
            "INSERT INTO source_checks(source_id, at, ok, reason, new_stories)"
            " VALUES(?, ?, ?, 'feed is not well-formed XML', 0)",
            (source, _utc_text(NOW - timedelta(minutes=5)), int(not failing)),
        )
    assert source is not None
    return source


def _read(db: sqlite3.Connection) -> dict[str, Any]:
    built = snapshot.build(db, MARA, NOW)
    assert react_refusal(built) is None
    snap: dict[str, Any] = built["scenes"][0]["snapshot"]
    return snap


def test_settings_deliver_at_most_two_hundred_sources_approved_first_then_proposed_then_paused(
    db,
):
    with db:
        approved = [_add(db, f"A {n:03d}", "approved") for n in range(120)]
        proposed = [_add(db, f"P {n:03d}", "proposed") for n in range(90)]  # one past 200
        paused = [_add(db, f"Z {n:03d}", "paused") for n in range(50)]
    settings = _read(db)["settings"]
    delivered = [row["id"] for row in settings["sources"]]
    assert len(delivered) == 200
    # All approved, then the first 80 proposed by name; no paused one.
    expected = approved + proposed[:80]
    assert delivered == [str(n) for n in expected]  # in the order they were added
    assert paused and settings["sourcesMore"] == (
        "Showing 200 of 260 sources: the approved ones first, then the proposed, then the paused."
    )


def test_each_state_is_cut_by_name_and_the_names_rank_among_the_delivered(db):
    with db:
        for n in range(150):
            _add(db, f"B {149 - n:03d}", "proposed")  # added in reverse name order
        for n in range(100):
            _add(db, f"A {n:03d}", "paused")
    sources = _read(db)["settings"]["sources"]
    assert [row["name"] for row in sources[:3]] == ["B 149", "B 148", "B 147"]
    assert len(sources) == 200 and sources[-1]["name"] == "A 049"  # 150 proposed, 50 paused
    assert sorted(row["sort"]["name"] for row in sources) == list(range(1, 201))
    by_rank = {row["sort"]["name"]: row["name"] for row in sources}
    assert [by_rank[1], by_rank[50], by_rank[51], by_rank[200]] == [
        "A 000",
        "A 049",
        "B 000",
        "B 149",
    ]


def test_a_failing_source_is_always_delivered_so_the_freshness_line_agrees_with_the_list(db):
    with db:
        for n in range(250):
            _add(db, f"A {n:03d}", "approved", failing=n == 249)  # the last by name fails
    snap = _read(db)  # the reader refuses a freshness line naming a failing source not listed
    health = {row["name"]: row["health"] for row in snap["settings"]["sources"]}
    assert len(health) == 200 and health["A 249"] == "Failing"
    assert snap["feed"]["freshness"]["failing"] == "1 source failing"
    assert snap["feed"]["sources"] == {"approved": True}


def test_no_more_sentence_is_delivered_while_every_source_is_shown(db):
    with db:
        for n in range(200):
            _add(db, f"A {n:03d}", "approved")
    settings = _read(db)["settings"]
    assert len(settings["sources"]) == 200 and "sourcesMore" not in settings


def test_a_paused_proposal_no_longer_waits_for_the_owner(db):
    with db:
        for n in range(MAX_ALL_PENDING):
            _add(db, f"P {n:03d}", "proposed")
    with pytest.raises(Conflict, match="200 proposed sources are waiting"):
        propose_source_limited(db, "One more", "news", "https://more.example/feed", "Ines K")
    set_source_state(db, 1, "paused")
    propose_source_limited(db, "One more", "news", "https://more.example/feed", "Ines K")


# The owner's clean-up (command line only)


def _story(db: sqlite3.Connection, source: int, n: int, at: datetime = NOW) -> int:
    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story

    add_story(
        db, source, Entry(f"Corvane item {n} unique{n}", f"https://w.example/{n}", at, ""), at
    )
    return int(db.execute("SELECT MAX(id) FROM stories").fetchone()[0])


def _count(db: sqlite3.Connection, table: str) -> int:
    return int(db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


def _with_stories(db: sqlite3.Connection) -> tuple[int, int]:
    """Two approved sources; source 1 holds 5 stories with a topic match, a save, a group thread
    (with a comment and a read mark), a folded copy from source 2 and an AI row; source 2 holds
    one story of its own. Returns the two source ids."""
    from deploy_workflow.signal import groups, threads
    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story
    from deploy_workflow.signal.topics import add_topic

    first = db.execute(
        "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
        " VALUES('Wire', 'news', 'https://wire.example/feed', 'approved', 'Mara L', 'x')"
    ).lastrowid
    second = db.execute(
        "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
        " VALUES('Daily', 'news', 'https://daily.example/feed', 'approved', 'Mara L', 'x')"
    ).lastrowid
    assert first is not None and second is not None
    db.commit()
    mine = [_story(db, first, n) for n in range(1, 6)]
    _story(db, second, 99)
    add_topic(db, "Corvane", ["corvane"], [], "Mara L")
    add_story(  # a copy of story 1 from the other source
        db, second, Entry("Corvane item 1 unique1", "https://d.example/1", NOW, ""), NOW
    )
    db.execute("INSERT INTO saves VALUES('Mara L', ?, 'x')", (mine[0],))
    db.commit()
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    thread, _ = threads.share(db, MARA, desk, threads.Item(mine[1], "Look."), NOW)
    db.execute(
        "INSERT INTO story_ai(story_id, outcome, config_id, written_at, month)"
        " VALUES(?, 'invalid', 'c', 'x', '2026-11')",
        (mine[2],),
    )
    db.commit()
    assert thread == 1
    return first, second


def test_removing_a_source_that_has_stories_is_refused_unless_they_go_with_it(db):
    from deploy_workflow.signal.store import remove_source

    first, _ = _with_stories(db)
    with pytest.raises(Conflict, match="source 1 has 5 stories; remove them with it"):
        remove_source(db, first, with_stories=False)
    assert (_count(db, "sources"), _count(db, "stories")) == (2, 6)


def test_a_source_with_its_stories_leaves_nothing_behind_and_nothing_of_another_source(db):
    from deploy_workflow.signal.store import remove_source

    first, second = _with_stories(db)
    db.execute(
        "INSERT INTO source_checks(source_id, at, ok, reason, new_stories)"
        " VALUES(?, 'x', 1, '', 0)",
        (first,),
    )
    db.commit()
    assert remove_source(db, first, with_stories=True) == 5
    counts = {
        table: _count(db, table)
        for table in (
            "sources",
            "stories",
            "source_checks",
            "story_duplicates",
            "topic_stories",
            "saves",
            "threads",
            "comments",
            "read_marks",
            "story_ai",
            "stories_fts",
        )
    }
    assert counts == {
        "sources": 1,
        "stories": 1,  # the other source's own story
        "source_checks": 0,
        "story_duplicates": 0,  # the other source's copy of story 1 went with story 1
        "topic_stories": 1,  # its story matches the topic "Corvane" too
        "saves": 0,
        "threads": 0,
        "comments": 0,
        "read_marks": 0,
        "story_ai": 0,
        "stories_fts": 1,
    }
    assert db.execute("SELECT id FROM sources").fetchall()[0][0] == second


def test_a_source_with_no_stories_goes_with_its_checks_and_its_folded_copies(db):
    from deploy_workflow.signal.store import remove_source

    first, second = _with_stories(db)
    remove_source(db, first, with_stories=True)
    third = _add(db, "Third", "approved")
    db.commit()
    story = _story(db, second, 7)
    db.execute(
        "INSERT INTO story_duplicates VALUES(?, ?, 'https://t.example/1', 'k', 'x', 'x')",
        (story, third),
    )
    db.commit()
    assert remove_source(db, third, with_stories=False) == 0
    assert (_count(db, "story_duplicates"), _count(db, "source_checks")) == (0, 0)


def test_stories_go_in_batches_and_an_unknown_source_is_refused(db, monkeypatch):
    from deploy_workflow.signal import store
    from deploy_workflow.signal.store import Missing, remove_source

    monkeypatch.setattr(store, "STORY_BATCH", 2)
    first, _ = _with_stories(db)
    seen: list[int] = []
    other = open_db_path(db)
    db.set_trace_callback(
        lambda statement: (
            seen.append(_count(other, "stories"))
            if statement.startswith("BEGIN IMMEDIATE")
            else None
        )
    )
    remove_source(db, first, with_stories=True)
    assert seen == [6, 4, 2, 1]  # three batches of 2, 2, 1, then the source; each committed
    with pytest.raises(Missing, match="no source with id 99"):
        remove_source(db, 99, with_stories=True)


def open_db_path(db: sqlite3.Connection) -> sqlite3.Connection:
    path = db.execute("PRAGMA database_list").fetchone()["file"]
    return sqlite3.connect(path)


def test_a_story_id_removed_with_its_source_is_never_given_to_a_new_story(db):
    from deploy_workflow.signal.store import remove_source

    first, second = _with_stories(db)
    newest = int(db.execute("SELECT MAX(id) FROM stories").fetchone()[0])
    remove_source(db, second, with_stories=True)
    assert _story(db, first, 50) == newest + 1


def test_a_removed_proposal_no_longer_waits_for_the_owner(db):
    from deploy_workflow.signal.store import remove_source

    with db:
        for n in range(MAX_ALL_PENDING):
            _add(db, f"P {n:03d}", "proposed")
    remove_source(db, 1, with_stories=False)
    propose_source_limited(db, "One more", "news", "https://more.example/feed", "Ines K")


# Ids that are never given again


def test_a_deleted_topics_and_digests_ids_are_never_given_again(db):
    from deploy_workflow.signal import digests, topics

    first = topics.add_topic(db, "Plants", ["plants"], [], "Mara L")
    second = topics.add_topic(db, "Towers", ["towers"], [], "Mara L")
    topics.delete_topic(db, second)
    assert topics.add_topic(db, "Ports", ["ports"], [], "Mara L") == second + 1
    topics.delete_topic(db, first)  # not the newest: the newest's id stays the floor
    assert topics.add_topic(db, "Rail", ["rail"], [], "Mara L") == second + 2
    form = digests.Form("Brief", ["All stories"], "Weekly, Friday 07:00 UTC", "Up to 5 points", "")
    spec = digests.spec_from_form(db, "Mara L", form)
    one = digests.create(db, "Mara L", spec, NOW)
    digests.delete(db, "Mara L", one)
    assert digests.create(db, "Tobias O", spec, NOW) == one + 1
