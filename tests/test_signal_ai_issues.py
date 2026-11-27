"""Third review, findings 6 and 16: a written issue keeps what it covered when it was written, so
an issue whose covers are all gone still draws (and the React reader accepts the snapshot), and
an issue is stored only while its owner still sees the groups its scope was read from.
SYNTHETIC: replies come from ``signal_ai_fakes.FakeModel``; the snapshot is checked with the real
React reader (``signal_reader_check``).
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import FakeModel, guard, ok, status_on
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import (
    ai_digest,
    ai_ledger,
    digests,
    groups,
    snapshot,
    store,
    threads,
    topics,
)
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")
RITA = User("Rita Reader", "reader")


def _ids(request: TurnRequest) -> list[str]:
    lines = request.messages[1].text.splitlines()
    return [json.loads(line)["id"] for line in lines if line.startswith('{"id"')]


def _points(request: TurnRequest) -> Any:
    reply = {"points": [{"lead": "A review opens", "body": "B.", "stories": [_ids(request)[0]]}]}
    return ok(json.dumps(reply), usd="0.006")


@pytest.fixture
def db(tmp_path: Path) -> Any:
    held = store.open_db(tmp_path / "root")
    source = store.propose_source(held, "Wire", "news", "https://wire.example/f", "x")
    store.set_source_state(held, source, "approved")
    when = NOW - timedelta(hours=1)
    entry = Entry(
        "Authority opens a review of the shipping merger", "https://w.example/1", when, ""
    )
    store.add_story(held, source, entry, when)
    ai_ledger.set_cap(held, Decimal(15), NOW)
    yield held
    held.close()


def _make(db: sqlite3.Connection, owner: str, covers: list[str]) -> int:
    form = digests.Form("Desk", covers, "Daily, 07:00 UTC", "Up to 3 points", "")
    spec = digests.spec_from_form(db, owner, form)
    return digests.create(db, owner, spec, NOW - timedelta(days=1))


def _record(db: sqlite3.Connection, user: User) -> dict[str, Any]:
    document = snapshot.build(db, user, NOW, service=snapshot.Service(ai=status_on()))
    assert react_refusal(document) is None, react_refusal(document)
    (record,) = document["scenes"][0]["snapshot"]["digests"]
    found: dict[str, Any] = record
    return found


def _run(db: sqlite3.Connection, tmp: Path, during: Callable[[], None] = lambda: None) -> Any:
    def answer(request: TurnRequest) -> Any:
        during()
        return _points(request)

    writer = ai_digest.Writer(db, FakeModel(answer=answer), guard(tmp / "gate", NOW), NOW)
    return digests.run_due(db, NOW, writer)


def test_an_issue_whose_covers_are_all_removed_still_draws_with_what_it_covered(db, tmp_path):
    reviews = topics.add_topic(db, "Reviews", ["review"], [], "Mara L")
    shipping = topics.add_topic(db, "Shipping", ["shipping"], [], "Mara L")
    with db:
        topics.match_story(db, 1)
    _make(db, "Rita Reader", ["Topic: Reviews", "Topic: Shipping"])
    assert [r.outcome for _, r in _run(db, tmp_path)] == ["written"]
    stored = db.execute("SELECT covers FROM digest_issue_ai").fetchone()[0]
    assert stored == "Reviews and Shipping"
    topics.delete_topic(db, reviews)
    topics.delete_topic(db, shipping)
    record = _record(db, RITA)  # no 500: the snapshot is built and the reader accepts it
    (issue,) = record["issues"]
    assert issue["summary"] == (
        "Covers 24 to 25 November. Written by a model from 1 story in Reviews and Shipping."
    )
    assert record["paused"] is None  # AI is on: the digest is drawn, its covers gone


def test_an_issue_of_all_stories_names_no_cover(db, tmp_path):
    _make(db, "Rita Reader", ["All stories"])
    _run(db, tmp_path)
    assert db.execute("SELECT covers FROM digest_issue_ai").fetchone()[0] == ""
    (issue,) = _record(db, RITA)["issues"]
    assert issue["summary"] == "Covers 24 to 25 November. Written by a model from 1 story."


def test_the_covers_phrase_has_one_two_or_many_names_and_none_when_nothing_is_left(db):
    for name in ("Alpha", "Beta", "Gamma"):
        topics.add_topic(db, name, [name.lower()], [], "Mara L")
    phrases = []
    for covers in (
        ["Topic: Alpha"],
        ["Topic: Alpha", "Topic: Beta"],
        ["Topic: Alpha", "Topic: Beta", "Topic: Gamma"],
    ):
        ident = digests.create(
            db,
            "Rita Reader",
            digests.spec_from_form(
                db,
                "Rita Reader",
                digests.Form(f"D{len(covers)}", covers, "Daily, 07:00 UTC", "Up to 3 points", ""),
            ),
            NOW,
        )
        phrases.append(digests.covers_phrase(db, digests.owned(db, "Rita Reader", ident)))
    assert phrases == ["Alpha", "Alpha and Beta", "Alpha, Beta and Gamma"]
    for row in db.execute("SELECT id FROM topics").fetchall():
        topics.delete_topic(db, row["id"])
    digest = digests.owned(db, "Rita Reader", ident)
    assert digests.covers_phrase(db, digest) == ""


# Finding 16: the owner's sight of a group during the call


def _group_world(db: sqlite3.Connection, with_topic: bool) -> int:
    group = groups.create_group(db, MARA, "Deal team", "invited")
    groups.add_member(db, MARA, group, "Mara L")
    groups.add_member(db, MARA, group, "Rita Reader")
    threads.share(db, MARA, group, threads.Item(1, None), NOW - timedelta(minutes=2))
    covers = ["Group: Deal team"]
    if with_topic:
        topics.add_topic(db, "Shipping", ["shipping"], [], "Mara L")
        covers.append("Topic: Shipping")
    _make(db, "Rita Reader", covers)
    return group


@pytest.mark.parametrize("with_topic", [False, True])
def test_no_issue_is_stored_when_its_owner_lost_sight_of_a_group_during_the_call(
    db, tmp_path, with_topic
):
    group = _group_world(db, with_topic)
    other = store.open_db(tmp_path / "root")
    ran = _run(db, tmp_path, lambda: groups.remove_member(other, MARA, group, "Rita Reader"))
    other.close()
    assert list(ran) == []  # the draft is dropped: its call is paid and counted
    assert db.execute("SELECT COUNT(*) FROM digest_issues").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM digest_points").fetchone()[0] == 0
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.006")


def test_an_issue_is_stored_while_the_owner_still_sees_the_group(db, tmp_path):
    _group_world(db, False)
    ran = _run(db, tmp_path)
    assert [r.outcome for _, r in ran] == ["written"]
    assert db.execute("SELECT covers FROM digest_issue_ai").fetchone()[0] == "Deal team"
