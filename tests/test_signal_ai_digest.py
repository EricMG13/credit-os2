"""The AI pass's digest writer and the run around it: one call per issue, outside every
transaction, its result checked, stored with its points, or no issue and the period kept.
SYNTHETIC: every reply comes from ``signal_ai_fakes.FakeModel``, written by hand; no paid or
networked model call is made.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import FakeModel, not_sent, ok
from test_signal_digest import NOW, at, count, make, source, story

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_digest, ai_ledger, digests, store
from deploy_workflow.signal.store import Conflict


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = store.open_db(tmp_path)
    store.add_user(database, "Mara L", "writer")
    ai_ledger.set_cap(database, Decimal(15), NOW)
    yield database
    database.close()


def points(*entries: tuple[str, str, list[int]]) -> str:
    return json.dumps(
        {
            "points": [
                {"lead": a, "body": b, "stories": [str(n) for n in ids]} for a, b, ids in entries
            ]
        }
    )


def label(db: sqlite3.Connection, story_id: int, signal: int, why: str) -> None:
    with db:
        db.execute(
            "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, moves, config_id,"
            " written_at, month) VALUES(?, 'written', ?, ?, '[]', 'news', '[]', 'x', ?, '2026-11')",
            (story_id, why, signal, NOW.isoformat()),
        )


def test_a_written_issue_is_stored_with_its_points_and_ends_the_period(db):
    wire = source(db)
    first = story(db, wire, "Corvane closes two plants", NOW - timedelta(hours=5))
    second = story(db, wire, "Tessaly sells its towers", NOW - timedelta(hours=1))
    ident = make(db)
    reply = points(
        ("Packaging capacity is shrinking", "Corvane closes two of nine plants.", [first]),
        (
            "A tower sale funds a repayment",
            "Tessaly sells towers to repay 2027 notes.",
            [second, first],
        ),
    )
    model = FakeModel([ok(reply, usd="0.003")])
    run = digests.run_now(db, "Mara L", ident, NOW, ai_digest.Writer(db, model, NOW))
    assert (run.outcome, run.stories, run.reason) == ("written", 2, "written by the AI pass")
    issue = db.execute("SELECT * FROM digest_issues").fetchone()
    assert (issue["id"], issue["kind"]) == (run.issue_id, "written")
    rows = [tuple(r) for r in db.execute("SELECT number, lead, body, story_ids FROM digest_points")]
    assert rows == [
        (1, "Packaging capacity is shrinking", "Corvane closes two of nine plants.", f"[{first}]"),
        (
            2,
            "A tower sale funds a repayment",
            "Tessaly sells towers to repay 2027 notes.",
            f"[{second}, {first}]",
        ),
    ]
    assert tuple(db.execute("SELECT stories, config_id FROM digest_issue_ai").fetchone()) == (
        2,
        "copilot-luna-xhigh",
    )
    assert digests.owned(db, "Mara L", ident).period_from == NOW
    usage = db.execute("SELECT purpose, settled_usd FROM ai_usage").fetchone()
    assert tuple(usage) == ("digest", "0.003")


def test_the_scope_goes_to_the_model_highest_signal_first_with_its_ai_line(db):
    wire = source(db)
    quiet = story(db, wire, "Newest but light", NOW - timedelta(hours=1))
    loud = story(db, wire, "Older but strong", NOW - timedelta(hours=3))
    bare = story(db, wire, "No AI line", NOW - timedelta(hours=2))
    label(db, quiet, 1, "A small change.")
    label(db, loud, 3, "A default is likely.")
    ident = make(db, brief="Lead with defaults.")
    model = FakeModel([ok(points(("Lead", "Body.", [loud])))])
    digests.run_now(db, "Mara L", ident, NOW, ai_digest.Writer(db, model, NOW, nonce=lambda: "n1"))
    user = model.requests[0].messages[1].text.splitlines()
    assert user[0] == "Write at most 5 points."
    assert user[1] == "BEGIN BRIEF n1" and user[3] == "END BRIEF n1"
    assert json.loads(user[2])["subject"] == "Lead with defaults."
    sent = [json.loads(line) for line in user[5:-1]]
    assert [(s["id"], s["why"]) for s in sent] == [
        (str(loud), "A default is likely."),
        (str(quiet), "A small change."),
        (str(bare), None),
    ]
    assert sent[0]["link"] == "https://example.org/Older-but-strong"


@pytest.mark.parametrize(
    "reply",
    [
        points(("Lead", "Body.", [999])),  # an id outside the scope
        points(*[(f"Lead {n}", "Body.", [1]) for n in range(6)]),  # more points than the five asked
        points(("Lead", "See https://example.com.", [1])),
        points(("Lead", "Body.", [])),
        points(("Lead", "Body.", [1, 1])),
        '{"points": []}',
        "not JSON",
    ],
)
def test_a_result_that_fails_its_check_writes_no_issue_and_keeps_the_period(db, reply):
    wire = source(db)
    story(db, wire, "Only story", NOW - timedelta(hours=1))
    ident = make(db)
    before = digests.owned(db, "Mara L", ident).period_from
    run = digests.run_now(
        db, "Mara L", ident, NOW, ai_digest.Writer(db, FakeModel([ok(reply)]), NOW)
    )
    assert (run.outcome, run.issue_id) == ("skipped", None)
    assert run.reason == "no issue was written: the model's result failed its check"
    assert count(db, "digest_issues") == 0
    assert digests.owned(db, "Mara L", ident).period_from == before  # the next run covers it again
    assert db.execute("SELECT outcome FROM ai_usage").fetchone()[0] == "result failed its check"


def test_a_failed_call_writes_no_issue_and_the_next_run_covers_the_period_again(db):
    wire = source(db)
    only = story(db, wire, "Only story", NOW - timedelta(hours=1))
    ident = make(db)
    start = digests.owned(db, "Mara L", ident).period_from
    run = digests.run_now(
        db, "Mara L", ident, NOW, ai_digest.Writer(db, FakeModel([not_sent()]), NOW)
    )
    assert run.reason == "no issue was written: the model call failed (not_sent: KeyMissing)"
    later = NOW + timedelta(hours=1)
    model = FakeModel([ok(points(("Lead", "Body.", [only])))])
    again = digests.run_now(db, "Mara L", ident, later, ai_digest.Writer(db, model, later))
    assert again.outcome == "written"
    period = db.execute("SELECT period_start FROM digest_issues").fetchone()[0]
    assert period == start.isoformat()


def test_with_no_story_in_scope_the_issue_says_nothing_material_and_no_call_is_made(db):
    ident = make(db)
    model = FakeModel()
    run = digests.run_now(db, "Mara L", ident, NOW, ai_digest.Writer(db, model, NOW))
    assert run.outcome == "nothing" and model.requests == []
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 0


def test_at_the_cap_no_call_is_made_and_no_issue_written(db):
    wire = source(db)
    story(db, wire, "Only story", NOW - timedelta(hours=1))
    ident = make(db)
    ai_ledger.set_cap(db, Decimal("0.10"), NOW)
    model = FakeModel()
    run = digests.run_now(db, "Mara L", ident, NOW, ai_digest.Writer(db, model, NOW))
    assert model.requests == []
    assert run.reason == "no issue was written: the call would pass the monthly cap of USD 0.10"


def test_the_model_call_is_made_while_no_write_lock_is_held(db, tmp_path):
    wire = source(db)
    only = story(db, wire, "Only story", NOW - timedelta(hours=1))
    ident = make(db)

    def write_meanwhile(request: TurnRequest) -> Any:
        other = sqlite3.connect(tmp_path / "signal" / "signal.db", timeout=0.1)
        other.execute("BEGIN IMMEDIATE")  # would time out if the run held the lock
        other.execute("UPDATE users SET role='writer' WHERE name='Mara L'")
        other.execute("COMMIT")
        other.close()
        return ok(points(("Lead", "Body.", [only])))

    model = FakeModel(answer=write_meanwhile)
    assert (
        digests.run_now(db, "Mara L", ident, NOW, ai_digest.Writer(db, model, NOW)).outcome
        == "written"
    )


def test_a_digest_changed_during_the_call_keeps_no_issue(db):
    wire = source(db)
    only = story(db, wire, "Only story", NOW - timedelta(hours=1))
    ident = make(db)

    def edit_meanwhile(request: TurnRequest) -> Any:
        spec = digests.spec_from_form(
            db,
            "Mara L",
            digests.Form("Renamed", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", ""),
        )
        digests.edit(db, "Mara L", ident, spec, NOW)
        return ok(points(("Lead", "Body.", [only])))

    with pytest.raises(Conflict, match="changed while its issue was being written"):
        digests.run_now(
            db, "Mara L", ident, NOW, ai_digest.Writer(db, FakeModel(answer=edit_meanwhile), NOW)
        )
    assert count(db, "digest_issues") == 0 and count(db, "digest_runs") == 0


def test_a_scheduled_run_claims_its_slot_before_the_call_and_keeps_the_period_on_failure(db):
    wire = source(db)
    story(db, wire, "Only story", at("2026-11-26 09:00"))
    ident = make(db)
    seen: list[Any] = []

    def look(request: TurnRequest) -> Any:
        seen.append(digests.owned(db, "Mara L", ident).next_run_at)
        return not_sent()

    friday = at("2026-11-27 07:00")
    ran = digests.run_due(db, friday, ai_digest.Writer(db, FakeModel(answer=look), friday))
    assert seen == [at("2026-12-04 07:00")]  # claimed before the call: no other runner takes it
    assert [(n, r.outcome) for n, r in ran] == [(ident, "skipped")]
    assert digests.owned(db, "Mara L", ident).period_from == at("2026-11-20 07:00")


def test_run_once_now_while_ai_is_on_is_run_by_the_loop_as_a_manual_run(db):
    wire = source(db)
    only = story(db, wire, "Only story", NOW - timedelta(hours=1))
    ident = make(db)
    digests.request_run(db, "Mara L", ident, NOW)
    model = FakeModel([ok(points(("Lead", "Body.", [only])))])
    later = NOW + timedelta(minutes=1)
    ran = digests.run_due(db, later, ai_digest.Writer(db, model, later))
    assert [(n, r.outcome) for n, r in ran] == [(ident, "written")]
    row = db.execute("SELECT trigger FROM digest_runs").fetchone()
    assert row["trigger"] == "manual"
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2026-11-27 07:00")  # unchanged
    assert digests.run_due(db, later, ai_digest.Writer(db, FakeModel(), later)) == []  # once
