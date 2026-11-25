"""Third review, finding 2: what bounds the digest writer's calls whatever names are typed.
(a) "Run once now" is refused within 30 minutes of the digest's last run; (b) after a paid call
that wrote no issue it is refused until the next scheduled time; (c) one due pass makes at most
10 digest calls, the longest due first; (d) the whole service makes at most `digests-per-day`
digest calls in a UTC day. SYNTHETIC: replies come from ``signal_ai_fakes.FakeModel``; the HTTP
service is the real one on 127.0.0.1 with a fake model; no paid or networked call is made.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import FakeModel, clock_at, guard, ok, setup
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)
from test_signal_service import Live

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_digest, ai_gate, ai_ledger, ai_run, ai_view, digests, store
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.service import Loop, make_server
from deploy_workflow.signal.store import Conflict

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
FORM = digests.Form("D", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", "")


def _ids(request: TurnRequest) -> list[str]:
    lines = request.messages[1].text.splitlines()
    return [json.loads(line)["id"] for line in lines if line.startswith('{"id"')]


def written(request: TurnRequest) -> Any:
    reply = {"points": [{"lead": "L", "body": "B.", "stories": [_ids(request)[0]]}]}
    return ok(json.dumps(reply), usd="0.006")


def failing(request: TurnRequest) -> Any:
    """A reply naming a story outside the scope: it fails its check (and is paid)."""
    return ok(
        json.dumps({"points": [{"lead": "L", "body": "B.", "stories": ["999"]}]}), usd="0.006"
    )


def _store(root: Path) -> sqlite3.Connection:
    """A store with one story (its source only proposed, so no loop ever fetches it)."""
    db = store.open_db(root)
    source = store.propose_source(db, "Wire", "news", "https://wire.example/feed", "x")
    when = NOW - timedelta(hours=1)
    store.add_story(db, source, Entry("A bond story", "https://wire.example/1", when, "S."), when)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    return db


def _digest(db: sqlite3.Connection, owner: str = "Rita Reader") -> int:
    return digests.create(
        db, owner, digests.spec_from_form(db, owner, FORM), NOW - timedelta(days=1)
    )


def _many(db: sqlite3.Connection, count: int) -> list[int]:
    return [_digest(db, f"Visitor {n}") for n in range(count)]


# (a) and (b): "Run once now"


def test_run_once_now_is_refused_within_30_minutes_of_the_last_run_of_any_outcome(tmp_path):
    db = _store(tmp_path)
    ident = _digest(db)
    ran_at = NOW.replace(hour=12, minute=5)
    assert digests.run_now(db, "Rita Reader", ident, ran_at).outcome == "skipped"  # AI off
    for when in (ran_at, ran_at + timedelta(minutes=29, seconds=59)):
        with pytest.raises(Conflict) as refused:
            digests.request_run(db, "Rita Reader", ident, when)
        assert (
            str(refused.value) == "This digest ran at 12:05 UTC. It can run again from 12:35 UTC."
        )
        with pytest.raises(Conflict):
            digests.run_now(db, "Rita Reader", ident, when)
    assert digests.owned(db, "Rita Reader", ident).requested_at is None
    digests.request_run(db, "Rita Reader", ident, ran_at + timedelta(minutes=30))
    assert digests.owned(db, "Rita Reader", ident).requested_at == ran_at + timedelta(minutes=30)
    db.close()


def test_the_refusal_names_the_day_when_it_is_not_today(tmp_path):
    db = _store(tmp_path)
    ident = _digest(db)
    late = datetime(2026, 11, 25, 23, 50, tzinfo=UTC)
    digests.run_now(db, "Rita Reader", ident, late)
    with pytest.raises(Conflict, match=r"^This digest ran at 23:50 UTC\. It can run again from 26"):
        digests.request_run(db, "Rita Reader", ident, late + timedelta(minutes=5))
    db.close()


def test_asking_again_while_a_run_is_asked_for_keeps_its_place(tmp_path):
    db = _store(tmp_path)
    ident = _digest(db)
    digests.request_run(db, "Rita Reader", ident, NOW)
    digests.request_run(db, "Rita Reader", ident, NOW + timedelta(minutes=5))
    assert digests.owned(db, "Rita Reader", ident).requested_at == NOW
    db.close()


def test_after_a_paid_call_that_wrote_no_issue_the_digest_waits_for_its_next_slot(tmp_path):
    db = _store(tmp_path)
    ident = _digest(db)
    check = guard(tmp_path / "gate", NOW)
    model = FakeModel(answer=failing)
    digests.request_run(db, "Rita Reader", ident, NOW)
    ran = digests.run_due(db, NOW, ai_digest.Writer(db, model, check, NOW))
    assert [(n, r.reason) for n, r in ran] == [
        (ident, "no issue was written: the model's result failed its check")
    ]
    later = NOW + timedelta(hours=2)
    with pytest.raises(Conflict) as refused:
        digests.request_run(db, "Rita Reader", ident, later)
    assert str(refused.value) == (
        "The last run of this digest wrote no issue, so it runs again at its next scheduled"
        " time, 26 Nov 07:00 UTC."
    )
    assert digests.run_due(db, later, ai_digest.Writer(db, model, check, later)) == []
    assert len(model.requests) == 1  # one paid attempt in the period
    slot = datetime(2026, 11, 26, 7, 0, tzinfo=UTC)
    ran = digests.run_due(db, slot, ai_digest.Writer(db, FakeModel(answer=written), check, slot))
    assert [r.outcome for _, r in ran] == ["written"]
    db.close()


def test_a_scheduled_run_that_wrote_no_issue_is_not_run_again_before_its_next_slot(tmp_path):
    db = _store(tmp_path)
    _digest(db)
    check = guard(tmp_path / "gate", NOW)
    model = FakeModel(answer=failing)
    for minutes in range(0, 120, 7):
        at = NOW + timedelta(minutes=minutes)
        digests.run_due(db, at, ai_digest.Writer(db, model, check, at))
    assert len(model.requests) == 1
    db.close()


def test_the_route_refuses_run_once_now_with_409_and_the_sentence(tmp_path):
    root = tmp_path / "root"
    db = _store(root)
    store.add_user(db, "Rita Reader", "reader")
    ident = _digest(db)
    db.close()
    loop = Loop(root, ai=setup(tmp_path, FakeModel(answer=written)))
    live = Live(make_server(root, "127.0.0.1", 0, loop=loop))
    cookie = "signal_name=Rita%20Reader"
    try:
        status, _, body = live.call("POST", f"/api/digests/{ident}/run", cookie=cookie, body={})
        assert (status, body["outcome"]) == (200, "queued")
        loop.run_once(datetime.now(UTC))
        status, _, body = live.call("POST", f"/api/digests/{ident}/run", cookie=cookie, body={})
        assert status == 409
        assert (
            body["error"].startswith("This digest ran at ")
            and "It can run again from" in body["error"]
        )
    finally:
        live.close()


# (c): at most 10 digest calls a pass, the longest due first


def test_one_due_pass_makes_at_most_ten_digest_calls_and_the_rest_wait(tmp_path):
    db = _store(tmp_path)
    made = _many(db, 25)
    model = FakeModel(answer=written)
    check = guard(tmp_path / "gate", NOW)
    ran = digests.run_due(db, NOW, ai_digest.Writer(db, model, check, NOW))
    assert len(model.requests) == 10 and len(ran) == 10
    assert ran.waiting == made[10:] and ran.left_due == []
    ran = digests.run_due(db, NOW, ai_digest.Writer(db, model, check, NOW))
    assert len(model.requests) == 20 and [n for n, _ in ran] == made[10:20]
    db.close()


def test_the_longest_due_runs_first_and_a_queued_run_is_due_from_when_it_was_asked(tmp_path):
    db = _store(tmp_path)
    first, second, third = _many(db, 3)  # all due at 07:00 today
    db.execute(
        "UPDATE digests SET next_run_at=? WHERE id=?",
        (store._utc_text(NOW + timedelta(hours=5)), first),
    )
    db.commit()
    digests.request_run(db, "Visitor 0", first, NOW - timedelta(hours=6))  # asked at 06:00
    model = FakeModel(answer=written)
    writer = ai_digest.Writer(db, model, guard(tmp_path / "gate", NOW), NOW, per_pass=2)
    ran = digests.run_due(db, NOW, writer)
    assert [n for n, _ in ran] == [first, second] and ran.waiting == [third]
    db.close()


def test_a_digest_left_waiting_keeps_its_time_and_its_asked_time(tmp_path):
    db = _store(tmp_path)
    first, second = _many(db, 2)
    digests.request_run(db, "Visitor 1", second, NOW - timedelta(minutes=1))
    before = digests.owned(db, "Visitor 1", second)
    writer = ai_digest.Writer(
        db, FakeModel(answer=written), guard(tmp_path / "gate", NOW), NOW, per_pass=1
    )
    ran = digests.run_due(db, NOW, writer)
    assert [n for n, _ in ran] == [first] and ran.waiting == [second]
    after = digests.owned(db, "Visitor 1", second)
    assert (after.next_run_at, after.requested_at) == (before.next_run_at, before.requested_at)
    db.close()


# (d): the service's digest calls a UTC day


def test_the_day_allows_its_digest_calls_and_the_others_wait_for_the_next_day(tmp_path):
    db = _store(tmp_path)
    ai_ledger.set_digests_per_day(db, 3, NOW)
    made = _many(db, 5)
    model = FakeModel(answer=written)
    check = guard(tmp_path / "gate", NOW)
    ran = digests.run_due(db, NOW, ai_digest.Writer(db, model, check, NOW))
    assert len(model.requests) == 3 and ran.waiting == made[3:]
    assert ai_ledger.digest_calls_on(db, NOW) == 3
    later = NOW + timedelta(hours=11, minutes=59)
    digests.run_due(db, later, ai_digest.Writer(db, model, guard(tmp_path / "gate", later), later))
    assert len(model.requests) == 3
    with pytest.raises(ai_ledger.Refused) as refused:
        ai_ledger.reserve(
            db, "digest", "copilot-luna-xhigh", Decimal("0.3585"), NOW, ruled_cap=Decimal(15)
        )
    assert str(refused.value) == (
        "the digests have made today's 3 model calls, the most a day allows; the others wait"
        " until 00:00 UTC"
    )
    story_call = ai_ledger.reserve(
        db, "stories", "copilot-luna-xhigh", Decimal("0.3585"), NOW, ruled_cap=Decimal(15)
    )
    ai_ledger.settle(db, story_call, Decimal("0.004"), "ok", NOW)  # stories are not limited
    tomorrow = datetime(2026, 11, 26, 0, 0, tzinfo=UTC)
    ran = digests.run_due(
        db, tomorrow, ai_digest.Writer(db, model, guard(tmp_path / "gate", tomorrow), tomorrow)
    )
    assert [n for n, _ in ran] == made[3:] and len(model.requests) == 5
    db.close()


def test_a_full_day_holds_the_digest_whose_call_is_refused_through_the_loops_job(tmp_path):
    db = _store(tmp_path)
    ai_ledger.set_digests_per_day(db, 0, NOW)
    made = _many(db, 2)
    model = FakeModel(answer=written)
    ran = ai_run.digest_pass(db, NOW, setup(tmp_path, model, clock=NOW))
    assert ran == [] and model.requests == []
    assert [digests.owned(db, f"Visitor {n}", d).next_run_at for n, d in enumerate(made)] == [
        datetime(2026, 11, 25, 7, 0, tzinfo=UTC)
    ] * 2
    assert db.execute("SELECT COUNT(*) FROM digest_runs").fetchone()[0] == 0
    db.close()


def test_a_refused_call_leaves_its_digest_asked_for_at_its_first_time(tmp_path):
    db = _store(tmp_path)
    ident = _digest(db)
    asked = NOW - timedelta(minutes=1)
    digests.request_run(db, "Rita Reader", ident, asked)
    db.execute(
        "UPDATE digests SET next_run_at=? WHERE id=?",
        (store._utc_text(NOW + timedelta(hours=9)), ident),
    )
    db.commit()
    ai_ledger.set_cap(db, Decimal("0.10"), NOW)  # below one hold: the call is refused
    writer = ai_digest.Writer(db, FakeModel(), guard(tmp_path / "gate", NOW), NOW)
    ran = digests.run_due(db, NOW, writer)
    assert ran.waiting == [ident] and writer.stopped is not None
    held = digests.owned(db, "Rita Reader", ident)
    assert (held.requested_at, held.next_run_at) == (asked, NOW + timedelta(hours=9))
    db.close()


@pytest.mark.parametrize("text", ["-1", "1001", "5.0", "1e2", "", "٣", "fifty"])
def test_the_digest_calls_a_day_are_a_plain_whole_number(text):
    with pytest.raises(store.StoreError):
        ai_ledger.parse_per_day(text)


def test_settings_and_the_queued_reply_say_the_day_is_full(tmp_path):
    db = _store(tmp_path)
    ai_ledger.set_digests_per_day(db, 1, NOW)
    call = ai_ledger.reserve(
        db, "digest", "copilot-luna-xhigh", Decimal("0.3585"), NOW, ruled_cap=Decimal(15)
    )
    ai_ledger.settle(db, call, Decimal("0.006"), "ok", NOW)
    check = guard(tmp_path / "gate", NOW)
    held = ai_gate.status(db, NOW, check.environ, check.rulings_root)
    assert (held.state, held.digests_today, held.digests_per_day, held.day_full) == (
        "on",
        1,
        1,
        True,
    )
    note = ai_view.settings_ai(held, User("Olga", "owner"), NOW)["spend"]["note"]
    assert note.endswith(
        "Digests have made today's 1 model calls, the most a day allows; the others are written"
        " after 00:00 UTC."
    )
    db.close()


def test_worst_case_reserved_by_the_digest_writer(tmp_path):
    """The bound the limits imply at the default settings: 10 calls a pass and 50 a UTC day, each
    holding USD 0.3585 (hand-computed: 10 x 0.3585 = 3.585; 50 x 0.3585 = 17.925)."""
    hold = ai_gate.smallest_hold("copilot-luna-xhigh")
    assert hold == Decimal("0.3585")
    assert ai_digest.CALLS_PER_PASS * hold == Decimal("3.5850")
    assert ai_ledger.DIGESTS_PER_DAY * hold == Decimal("17.9250")
    assert clock_at(NOW)() == NOW
