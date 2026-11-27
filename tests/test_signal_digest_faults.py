"""Second review's digest findings: which database faults a run retries (N7), an issue of a kind
this build does not draw (N8), and where a digest card ranks in Top (N9). Model calls, where any,
are SYNTHETIC (the provider-failure tests moved to ``test_signal_ai_adapter``, which drives the real
Copilot adapter class with its fake client). Expected values are written by hand.
"""

from __future__ import annotations

import sqlite3
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from signal_ai_fakes import off_setup
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)
from test_signal_digest import NOW, WRITER, at, count, make, source, story

from deploy_workflow.signal import (
    digests,
    digestview,
    snapshot,
    store,
    topics,
)
from deploy_workflow.signal.service import Loop


@pytest.fixture
def db(tmp_path: Path) -> Any:
    held = store.open_db(tmp_path)
    yield held
    held.close()


# N7: a lasting database fault is recorded; only a busy or locked database is retried


def _raise(code: int, text: str) -> Any:
    def fail(*args: object) -> Any:
        error = sqlite3.OperationalError(text)
        error.sqlite_errorcode = code  # type: ignore[attr-defined]
        raise error

    return fail


def test_a_lasting_operational_error_is_recorded_and_the_digest_moves_on(db, monkeypatch):
    ident = make(db)
    monkeypatch.setattr(digests, "_plan", _raise(1, "no such column: why"))  # SQLITE_ERROR
    ran = digests.run_due(db, at("2026-11-27 07:00"))
    assert list(ran) == [] and ran.left_due == []
    row = db.execute("SELECT outcome, reason FROM digest_runs").fetchone()
    assert tuple(row) == ("skipped", "the run failed (OperationalError); see the log")
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2026-12-04 07:00")


@pytest.mark.parametrize(
    ("code", "text"), [(5, "database is locked"), (6, "table is locked"), (261, "busy")]
)
def test_a_busy_or_locked_database_leaves_the_digest_due_and_says_so(db, monkeypatch, code, text):
    ident = make(db)
    monkeypatch.setattr(digests, "_plan", _raise(code, text))
    ran = digests.run_due(db, at("2026-11-27 07:00"))
    assert ran.left_due == [ident] and count(db, "digest_runs") == 0
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2026-11-27 07:00")


def test_the_loop_shows_a_digest_left_due(tmp_path, monkeypatch):
    database = store.open_db(tmp_path)
    make(database)
    database.close()
    loop = Loop(tmp_path, ai=off_setup(tmp_path))
    monkeypatch.setattr(digests, "_plan", _raise(5, "database is locked"))
    loop.run_once(at("2026-11-27 07:00"))
    assert loop.digest_error == "the last digest pass failed (DigestsLeftDue); see the log"
    monkeypatch.undo()
    loop.run_once(at("2026-11-27 07:01"))
    assert loop.digest_error is None


# N8: an issue of a kind this build does not draw is left out, not a failed snapshot


def test_an_issue_of_an_unknown_kind_is_left_out_and_the_rest_stays_readable(db, caplog):
    ident = make(db)
    digests.run_now(db, "Mara L", ident, NOW - timedelta(hours=2))
    digests.run_now(db, "Mara L", ident, NOW - timedelta(hours=1))
    db.execute("UPDATE digest_issues SET kind='from-a-later-build' WHERE id=2")
    db.commit()
    built = snapshot.build(db, WRITER, NOW)
    assert react_refusal(built) is None
    (record,) = built["scenes"][0]["snapshot"]["digests"]
    assert [issue["id"] for issue in record["issues"]] == ["1"]
    assert "issues of a kind" in caplog.text


def test_the_store_refuses_an_issue_kind_it_does_not_know(db):
    ident = make(db)
    scope = digests.Scope(digests.owned(db, "Mara L", ident), NOW, NOW, (), 0)
    with pytest.raises(store.StoreError):
        digests.add_issue(db, scope, "something-else", NOW)


# N9: a card ranks in Top as a story of its own time would


def _issue_card(db: sqlite3.Connection, ident: int, when: Any) -> None:
    digests.run_now(db, "Mara L", ident, when)


def test_a_nothing_material_card_ranks_by_its_own_time_not_ahead_of_the_top_story(db):
    wire = source(db)
    old = story(db, wire, "Plants old", NOW - timedelta(hours=60))
    new = story(db, wire, "Plants new", NOW - timedelta(hours=1))
    topic = topics.add_topic(db, "Plants", ["plants"], [], "Mara L")
    topics.follow(db, "Mara L", topic)
    quiet = topics.add_topic(db, "Quiet", ["nothing here"], [], "Mara L")
    ident = make(db, covers=["Topic: Quiet"])
    _issue_card(db, ident, NOW - timedelta(hours=30))
    view = snapshot.build(db, WRITER, NOW)["scenes"][0]["snapshot"]["feed"]["views"]["for-you"]
    assert view["latest"] == [str(new), "d1", str(old)]
    assert view["top"] == [str(new), "d1", str(old)]
    assert quiet


def _key(entry: tuple[str, float, int]) -> Any:
    return entry[1], entry[2]


@settings(max_examples=60, deadline=None)
@given(
    stories=st.lists(st.tuples(st.integers(1, 3), st.integers(0, 200)), max_size=8),
    cards=st.lists(st.tuples(st.booleans(), st.integers(0, 200)), max_size=4),
)
def test_top_is_ordered_by_one_score_for_stories_and_cards(stories, cards):
    """Every entry of Top, story or card, is ranked by ``threadrank.score``: a story with its
    strength, a written card as strength 2, a nothing-material card as none."""
    from datetime import UTC, datetime

    from deploy_workflow.signal import threadrank

    now = datetime(2026, 11, 24, 12, tzinfo=UTC)
    entries = [
        (
            str(n),
            threadrank.score(threadrank.Standing(n, now - timedelta(hours=h), 0, 0, s), now),
            -h,
        )
        for n, (s, h) in enumerate(stories, start=1)
    ]
    entries += [
        (f"d{n}", digestview.card_score(written, now - timedelta(hours=h), now), -h)
        for n, (written, h) in enumerate(cards, start=1)
    ]
    keys = {entry[0]: _key(entry) for entry in entries}
    ordered = digestview.top_order([e[0] for e in entries], keys)
    assert [keys[e] for e in ordered] == sorted(keys.values(), reverse=True)
    assert digestview.card_score(True, now, now) == threadrank.score(
        threadrank.Standing(0, now, strength=2), now
    )
    assert digestview.card_score(False, now, now) == threadrank.score(
        threadrank.Standing(0, now), now
    )
