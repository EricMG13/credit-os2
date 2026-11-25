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
        ([20, 5], 5, 0),  # the poison's batch is unreadable; the pass goes on to the other five
        ([10, 10], 10, 0),  # the poison's half (unreadable), then the other half
        ([5, 5], 5, 5),  # the poison's quarter: its third attempt, invalid; then the rest
        ([], 0, 0),
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
                " written_at, month)"
                " VALUES(1, 'written', 'W.', 2, '[]', 'news', '[]', ?, ?, '2026-11')",
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


# Fourth review, N5: a reply-breaking story added every pass never stops the labelling


def test_a_poison_story_added_every_30_minutes_never_stops_the_clean_ones(tmp_path):
    """review4/a6_tries.py part 2: before the fix 0 of 40 clean stories were labelled in 8 h."""
    db = _world(tmp_path, 40)
    source = int(db.execute("SELECT id FROM sources").fetchone()[0])
    poison: set[int] = set()

    def answer(request: TurnRequest) -> Any:
        sent = _ids(request)
        if poison & set(sent):
            return ok("I will not answer in JSON.", usd="0.002")
        return ok(labels_reply([label(n) for n in sent]), usd="0.004")

    model = FakeModel(answer=answer)
    labelled = []
    for k in range(17):  # every 30 minutes for 8 hours
        at = NOW + timedelta(minutes=30 * k)
        entry = Entry(f"Poison {k}", f"https://wire.example/p{k}", at, "S.")
        store.add_story(db, source, entry, at)
        poison.add(int(db.execute("SELECT MAX(id) FROM stories").fetchone()[0]))
        ai_pass.run(db, model, guard(tmp_path / "gate", at), at)
        labelled.append(
            db.execute("SELECT COUNT(*) FROM story_ai WHERE outcome='written'").fetchone()[0]
        )
    # By hand: pass 1 sends the first poison with the 19 newest clean stories (unreadable) and
    # the other 21 clean ones in batches of 20 and 1, which are answered. Each later poison is
    # newest and alone in its attempt group, so alone in its call: invalid at once. The first
    # poison is isolated in its three paid attempts (batches 20, 10, 5): the four clean stories
    # in its last batch of 5 are stored invalid with it, as the isolation rule allows.
    assert labelled[0] == 21
    assert labelled[-1] == 36
    outcomes = dict(
        db.execute("SELECT outcome, COUNT(*) FROM story_ai WHERE story_id <= 40 GROUP BY 1")
    )
    assert outcomes == {"written": 36, "invalid": 4}
    db.close()


def test_an_unreadable_reply_does_not_cool_the_next_pass(tmp_path):
    db = _world(tmp_path, 1)
    calls = {"n": 0}

    def answer(request: TurnRequest) -> Any:
        calls["n"] += 1
        return ok("not JSON", usd="0.002")

    ai_pass.run(db, FakeModel(answer=answer), guard(tmp_path / "gate", NOW), NOW)
    source = int(db.execute("SELECT id FROM sources").fetchone()[0])
    later = NOW + timedelta(minutes=1)
    store.add_story(db, source, Entry("Fresh", "https://wire.example/fresh", later, "S."), later)
    report = ai_pass.run(db, FakeModel(answer=answer), guard(tmp_path / "gate", later), later)
    assert report.calls == 1 and report.stopped is None


def test_a_failed_call_still_stops_the_pass_and_cools_it_for_30_minutes(tmp_path):
    from signal_ai_fakes import sent_unknown

    db = _world(tmp_path, 25)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    report = ai_pass.run(db, FakeModel([sent_unknown()]), guard(tmp_path / "gate", NOW), NOW)
    assert report.calls == 1 and report.stopped == (
        "the model call failed (sent_unknown: OverallTimeout)"
    )
    ai_ledger.clear(db)  # the owner clears the switch-off the unknown cost caused
    later = NOW + timedelta(minutes=29)
    held = ai_pass.run(db, FakeModel(), guard(tmp_path / "gate", later), later)
    assert held.calls == 0 and held.stopped == "the last call failed less than 30 minutes ago"


def test_a_pass_makes_at_most_ten_story_calls(tmp_path):
    db = _world(tmp_path, 30)
    with db:  # every story may go only alone (as after unreadable replies), one paid attempt each
        db.executemany(
            "INSERT INTO story_ai_tries(story_id, attempts, batch, claimed_at)"
            " VALUES(?, 1, 1, NULL)",
            [(n,) for n in range(1, 31)],
        )
    model = FakeModel(answer=lambda request: ok("not JSON", usd="0.002"))
    report = ai_pass.run(db, model, guard(tmp_path / "gate", NOW), NOW)
    assert report.calls == 10 and len(model.requests) == 10
    assert report.stopped == "this pass made its 10 calls; the others wait"
    assert report.invalid == 10  # alone in an unreadable reply: invalid at once
    db.close()


# Fourth review, N12: a story deleted while its batch's call is in flight


def _two_sources(tmp: Path) -> tuple[sqlite3.Connection, int]:
    """Stories 1 to 3 from source 1, stories 4 and 5 from source 2 (which the test removes)."""
    db = _world(tmp, 3)
    other = store.propose_source(db, "Other", "news", "https://other.example/f", "x")
    store.set_source_state(db, other, "approved")
    for n in range(2):
        when = NOW - timedelta(minutes=30 + n)
        store.add_story(
            db, other, Entry(f"Other {n}", f"https://other.example/{n}", when, "S."), when
        )
    return db, other


@pytest.mark.parametrize("reply", ["labels", "unreadable"])
def test_a_story_removed_during_its_call_loses_nothing_of_the_others(tmp_path, reply):
    """review4/a6_tries.py part 4: the paid reply was dropped whole (IntegrityError) and its
    claims held for 31 minutes."""
    db, other = _two_sources(tmp_path)
    second = store.open_db(tmp_path / "root")

    def answer(request: TurnRequest) -> Any:
        sent = _ids(request)
        store.remove_source(second, other, with_stories=True)  # the owner, meanwhile
        if reply == "unreadable":
            return ok("not JSON", usd="0.002")
        return ok(labels_reply([label(n) for n in sent]), usd="0.004")

    report = ai_pass.run(db, FakeModel(answer=answer), guard(tmp_path / "gate", NOW), NOW)
    left = {int(r[0]) for r in db.execute("SELECT id FROM stories")}
    assert left == {1, 2, 3}
    tries = [tuple(r) for r in db.execute("SELECT story_id, claimed_at FROM story_ai_tries")]
    answered = dict(db.execute("SELECT story_id, outcome FROM story_ai"))
    if reply == "labels":
        assert (report.calls, report.written, report.stopped) == (1, 3, None)
        assert answered == {1: "written", 2: "written", 3: "written"} and tries == []
    else:  # one paid attempt each, claims released for the next pass
        assert answered == {} and sorted(tries) == [(1, None), (2, None), (3, None)]
    assert db.execute("PRAGMA foreign_key_check").fetchall() == []
    second.close()
    db.close()


def test_a_story_removed_before_its_claim_is_left_out_of_the_call(tmp_path):
    db, other = _two_sources(tmp_path)
    planned = ai_pass.pending(db, NOW)
    store.remove_source(db, other, with_stories=True)
    assert ai_tries.claim(db, [s.id for s in planned], NOW) == [1, 2, 3]
    db.close()


def test_stories_never_sent_come_before_newer_ones_sent_before(tmp_path):
    """A pass takes PASS_LIMIT stories: those never sent first, so a crowd of retried stories,
    newer than one never sent, never keeps it out of the pass."""
    db = _world(tmp_path, ai_pass.PASS_LIMIT + 1)
    retried = range(1, ai_pass.PASS_LIMIT + 1)  # story 1 the newest; the oldest is never sent
    with db:
        db.executemany(
            "INSERT INTO story_ai_tries(story_id, attempts, batch, claimed_at)"
            " VALUES(?, 1, 20, NULL)",
            [(n,) for n in retried],
        )
    listed = [s.id for s in ai_pass.pending(db, NOW)]
    assert listed[0] == ai_pass.PASS_LIMIT + 1 and len(listed) == ai_pass.PASS_LIMIT
    db.close()
