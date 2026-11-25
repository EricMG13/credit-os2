"""Third review, findings 7 and 14: a story whose text makes the reply unreadable is isolated and
stored as invalid after at most three paid attempts, without holding up the others; and two passes
at once never pay twice for one story. SYNTHETIC: replies come from ``signal_ai_fakes.FakeModel``;
the second pass is a second connection to the same store, run while the first one's call is in
flight; no paid or networked call is made.
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
from signal_ai_fakes import FakeModel, guard, label, labels_reply, not_sent, ok

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_call, ai_ledger, ai_pass, ai_tries, store
from deploy_workflow.signal.feeds import Entry

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
CONFIG = "copilot-luna-xhigh"


def _ids(request: TurnRequest) -> list[int]:
    lines = request.messages[1].text.splitlines()
    return [int(json.loads(line)["id"]) for line in lines if line.startswith('{"id"')]


def _world(tmp: Path, count: int) -> sqlite3.Connection:
    """`count` stories, story 1 the newest."""
    db = store.open_db(tmp / "root")
    source = store.propose_source(db, "Wire", "news", "https://wire.example/f", "x")
    store.set_source_state(db, source, "approved")
    for n in range(count):
        when = NOW - timedelta(minutes=5 + n)
        entry = Entry(f"Story {n}", f"https://wire.example/{n}", when, "S.")
        store.add_story(db, source, entry, when)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    return db


def _poisoned(poison: int) -> Callable[[TurnRequest], Any]:
    def answer(request: TurnRequest) -> Any:
        sent = _ids(request)
        if poison in sent:
            return ok("I will not answer in JSON.", usd="0.002")
        return ok(labels_reply([label(n) for n in sent]), usd="0.004")

    return answer


def _sizes(model: FakeModel, start: int) -> list[int]:
    return [len(_ids(request)) for request in model.requests[start:]]


def test_a_poison_story_is_isolated_in_three_paid_attempts_and_the_others_go_on(tmp_path):
    db = _world(tmp_path, 25)
    model = FakeModel(answer=_poisoned(1))
    seen: list[tuple[list[int], int, int]] = []
    at = NOW
    for _ in range(5):
        before = len(model.requests)
        report = ai_pass.run(db, model, guard(tmp_path / "gate", at), at)
        seen.append((_sizes(model, before), report.written, report.invalid))
        at += timedelta(minutes=31)
    assert seen == [
        ([20], 0, 0),  # the poison's batch: unreadable, the pass stops
        ([5, 10], 5, 0),  # the five never sent first, then the poison's half
        ([10, 5], 10, 5),  # the other half, then the poison's quarter: third attempt, invalid
        ([5], 5, 0),
        ([], 0, 0),
    ]
    outcomes = dict(db.execute("SELECT outcome, COUNT(*) FROM story_ai GROUP BY outcome"))
    assert outcomes == {"written": 20, "invalid": 5}
    invalid = {r[0] for r in db.execute("SELECT story_id FROM story_ai WHERE outcome='invalid'")}
    assert 1 in invalid
    unreadable = db.execute(
        "SELECT COUNT(*) FROM ai_usage WHERE outcome='reply not readable'"
    ).fetchone()[0]
    assert unreadable == 3
    assert db.execute("SELECT COUNT(*) FROM story_ai_tries").fetchone()[0] == 0
    db.close()


def test_a_story_alone_in_an_unreadable_reply_is_invalid_at_once(tmp_path):
    db = _world(tmp_path, 1)
    report = ai_pass.run(db, FakeModel(answer=_poisoned(1)), guard(tmp_path / "gate", NOW), NOW)
    assert (report.calls, report.invalid) == (1, 1)
    row = db.execute("SELECT outcome, why FROM story_ai").fetchone()
    assert tuple(row) == ("invalid", None)
    assert ai_pass.pending(db, NOW + timedelta(hours=1)) == []
    db.close()


def test_three_paid_attempts_without_an_answer_make_a_story_invalid(tmp_path):
    db = _world(tmp_path, 2)
    ids = [1, 2]
    for attempt in range(1, 4):
        assert ai_tries.claim(db, ids, NOW) == ids
        spent = ai_tries.failed(db, ids, CONFIG, NOW, unreadable=False)  # unknown cost: no halving
        assert spent == ([] if attempt < 3 else ids)
    assert dict(db.execute("SELECT story_id, outcome FROM story_ai")) == {
        1: "invalid",
        2: "invalid",
    }
    db.close()


def test_a_call_not_sent_counts_no_attempt_and_releases_its_claim(tmp_path):
    db = _world(tmp_path, 3)
    report = ai_pass.run(db, FakeModel([not_sent()]), guard(tmp_path / "gate", NOW), NOW)
    assert report.stopped == "the model call failed (not_sent: KeyMissing)"
    rows = [tuple(r) for r in db.execute("SELECT attempts, batch, claimed_at FROM story_ai_tries")]
    assert rows == [(0, 20, None)] * 3
    assert [s.id for s in ai_pass.pending(db, NOW)] == [1, 2, 3]
    db.close()


def test_a_batch_is_cut_by_its_smallest_limit_and_by_attempt_count():
    def story(n: int, attempts: int = 0, limit: int = 20) -> ai_pass.Story:
        return ai_pass.Story(n, "t", "s", attempts, limit)

    fresh = [story(n) for n in range(1, 24)]
    tried = [story(n, 1, 5) for n in range(30, 37)]
    cut = ai_pass.batches([*fresh, *tried])
    assert [[s.id for s in b] for b in cut] == [
        list(range(1, 21)),
        [21, 22, 23],
        list(range(30, 35)),
        [35, 36],
    ]


# Finding 14: two passes at once


def test_two_passes_at_once_never_pay_twice_for_one_story(tmp_path):
    db = _world(tmp_path, 40)
    other = store.open_db(tmp_path / "root")
    second = FakeModel(answer=lambda r: ok(labels_reply([label(n) for n in _ids(r)]), usd="0.004"))
    reports: list[ai_pass.Report] = []

    def first_answer(request: TurnRequest) -> Any:
        if not reports:  # the other pass runs while this call is in flight
            reports.append(ai_pass.run(other, second, guard(tmp_path / "gate", NOW), NOW))
        return ok(labels_reply([label(n) for n in _ids(request)]), usd="0.004")

    first = FakeModel(answer=first_answer)
    report = ai_pass.run(db, first, guard(tmp_path / "gate", NOW), NOW)
    sent = [n for model in (first, second) for r in model.requests for n in _ids(r)]
    assert sorted(sent) == list(range(1, 41))  # every story sent once, in all
    assert (report.calls, reports[0].calls) == (1, 1)
    assert report.written + reports[0].written == 40
    assert ai_ledger.totals(db, "2026-11").spent == Decimal("0.008")
    other.close()
    db.close()


def test_a_claim_older_than_the_adapters_bound_is_taken_over(tmp_path):
    db = _world(tmp_path, 2)
    assert ai_tries.claim(db, [1, 2], NOW) == [1, 2]  # then that pass's process died
    assert ai_pass.pending(db, NOW + timedelta(minutes=30)) == []
    assert ai_tries.claim(db, [1, 2], NOW + timedelta(minutes=30)) == []
    later = NOW + ai_ledger.CALL_BOUND + timedelta(seconds=1)
    assert [s.id for s in ai_pass.pending(db, later)] == [1, 2]
    assert ai_tries.claim(db, [1, 2], later) == [1, 2]
    db.close()


@pytest.mark.parametrize("answered", ["written", "invalid"])
def test_an_answered_story_is_never_claimed_again(tmp_path, answered):
    db = _world(tmp_path, 1)
    with db:
        if answered == "written":
            db.execute(
                "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, moves, config_id,"
                " written_at, month) VALUES(1, 'written', 'W.', 2, '[]', 'news', '[]', ?, ?, '2026-11')",
                (CONFIG, NOW.isoformat()),
            )
        else:
            db.execute(
                "INSERT INTO story_ai(story_id, outcome, config_id, written_at, month)"
                " VALUES(1, 'invalid', ?, ?, '2026-11')",
                (CONFIG, NOW.isoformat()),
            )
    assert ai_tries.claim(db, [1], NOW) == []
    db.close()


def test_the_bound_is_the_adapters_overall_bound_and_a_minute():
    from deploy_workflow.model.transport import OVERALL_S

    assert OVERALL_S == 1800.0
    assert ai_ledger.CALL_BOUND == timedelta(minutes=31)
    assert ai_call.HOMES == ".copilot-home"
