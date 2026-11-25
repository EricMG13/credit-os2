"""The AI pass end to end through the service's background loop and its routes, and the proof that
with no ruling nothing reaches a model. SYNTHETIC: the model is ``signal_ai_fakes.FakeModel``,
answering with replies written by hand; no paid or networked call is made anywhere here.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from signal_ai_fakes import FakeModel, environ, label, labels_reply, ok, setup, write_ruling
from signal_app import Live
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)
from test_signal_feeds import RSS

from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.signal import ai_ledger, ai_run, digests, store, topics
from deploy_workflow.signal.fetch import Fetched, FetchRefused
from deploy_workflow.signal.service import Loop

NOW = datetime(2026, 11, 13, 10, 0, tzinfo=UTC)  # the recorded feed's stories are from this day
COOKIE = "signal_name=Mara%20L"


def feed(url: str, etag: str | None, modified: str | None) -> Fetched:
    return Fetched(RSS, None, None)


def answer(request: TurnRequest) -> Any:
    """Stories: label each one sent. A digest: one point on the first story sent."""
    system, user = request.messages[0].text, request.messages[1].text
    lines = [json.loads(line) for line in user.splitlines() if line.startswith("{")]
    if system.startswith("You label"):
        return ok(labels_reply([label(int(s["id"]), signal=3) for s in lines]), usd="0.0031")
    first = next(s["id"] for s in lines if "title" in s)
    reply = {
        "points": [
            {"lead": "A review opens", "body": "The authority opened a review.", "stories": [first]}
        ]
    }
    return ok(json.dumps(reply), usd="0.0022")


def seed(root: Path, *, cap: bool = True) -> None:
    db = store.open_db(root)
    store.add_user(db, "Mara L", "writer")
    source = store.propose_source(db, "Authority", "regulator", "https://a.org/f", "x")
    store.set_source_state(db, source, "approved")
    followed = topics.add_topic(db, "Reviews", ["review"], [], "Mara L")
    topics.follow(db, "Mara L", followed)
    form = digests.Form("Daily reviews", ["All stories"], "Daily, 07:00 UTC", "Up to 3 points", "")
    digests.create(
        db, "Mara L", digests.spec_from_form(db, "Mara L", form), NOW - timedelta(days=1)
    )
    if cap:
        ai_ledger.set_cap(db, Decimal(15), NOW)
    db.close()


def test_one_tick_ingests_labels_and_writes_the_due_digest_and_the_snapshot_shows_it(tmp_path):
    root = tmp_path / "root"
    seed(root)
    model = FakeModel(answer=answer)
    loop = Loop(root, fetch_fn=feed, ai=setup(tmp_path, model))
    loop.run_once(NOW)  # the digest was due at 07:00 today
    assert (loop.last_error, loop.ai_error, loop.digest_error) == (None, None, None)
    db = store.open_db(root)
    assert [tuple(r) for r in db.execute("SELECT story_id, outcome, signal FROM story_ai")] == [
        (1, "written", 3),
        (2, "written", 3),
    ]
    assert [
        tuple(r) for r in db.execute("SELECT purpose, settled_usd FROM ai_usage ORDER BY id")
    ] == [
        ("stories", "0.0031"),
        ("digest", "0.0022"),
    ]
    run = db.execute("SELECT outcome, stories FROM digest_runs").fetchone()
    assert tuple(run) == ("written", 2)
    db.close()
    assert model.closed  # each job closes the adapter it was given
    live = Live(root, loop=loop)
    try:
        status, _, document = live.call("GET", "/api/snapshot", cookie=COOKIE)
        assert status == 200 and react_refusal(document) is None
        snap = document["scenes"][0]["snapshot"]
        assert snap["settings"]["ai"]["state"] == "on"
        assert {s["ai"]["line"] for s in snap["feed"]["stories"]} == {
            "The sale proceeds repay the 2027 notes."
        }
        (record,) = snap["digests"]
        assert (
            record["paused"] is None
            and record["issues"][0]["points"][0]["lead"] == "A review opens"
        )
        status, _, body = live.call("POST", "/api/digests/1/run", cookie=COOKIE, body={})
        assert (status, body["outcome"]) == (200, "queued")  # no model call in the handler
        assert len(model.requests) == 2
    finally:
        live.close()
    loop.run_once(NOW + timedelta(minutes=1))  # the loop runs it: nothing new is in scope
    db = store.open_db(root)
    last = db.execute("SELECT trigger, outcome FROM digest_runs ORDER BY id DESC").fetchone()
    assert tuple(last) == ("manual", "nothing")
    db.close()


def test_with_no_ruling_the_service_makes_no_model_call_and_runs_as_before(tmp_path):
    root = tmp_path / "root"
    seed(root)
    built: list[str] = []

    def factory(config_id: str, ruling: Path) -> Any:
        built.append(config_id)
        return FakeModel(answer=lambda request: (_ for _ in ()).throw(AssertionError("called")))

    rulings = tmp_path / "rulings"
    rulings.mkdir()
    write_ruling(rulings, name="2026-11-11-run-start-submit.md")  # another ruling naming Luna
    loop = Loop(root, fetch_fn=feed, ai=ai_run.Setup(environ(tmp_path), rulings, factory))
    loop.run_once(NOW)
    loop.run_once(NOW + timedelta(days=1))
    assert built == []
    assert (loop.last_error, loop.ai_error, loop.digest_error) == (None, None, None)
    db = store.open_db(root)
    assert db.execute("SELECT COUNT(*) FROM story_ai").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM ai_usage").fetchone()[0] == 0
    assert db.execute("SELECT outcome FROM digest_runs").fetchone()[0] == "skipped"
    db.close()
    live = Live(root, loop=loop)
    try:
        snap = live.call("GET", "/api/snapshot", cookie=COOKIE)[2]["scenes"][0]["snapshot"]
        assert snap["settings"]["ai"]["state"] == "off"
        assert snap["settings"]["ai"]["notice"]["text"].startswith("No standing ruling")
        assert "test-token" not in json.dumps(snap)
        status, _, body = live.call("POST", "/api/digests/1/run", cookie=COOKIE, body={})
        assert (status, body["outcome"]) == (200, "nothing")  # run at once, no writer, no story
    finally:
        live.close()
    assert built == []


# Fourth review, D5: a hand-edited AI setting turns the pass off on the pages, never a 500


def _offline(url: str, etag: str | None, modified: str | None) -> Fetched:
    raise FetchRefused("no network in tests")


def test_a_hand_edited_ai_setting_shows_the_pass_off_and_every_page_still_reads(tmp_path):
    root = tmp_path / "root"
    seed(root)
    rulings = tmp_path / "rulings"
    write_ruling(rulings)
    db = store.open_db(root)
    store.add_user(db, "Olga", "owner")
    with db:
        db.execute("UPDATE settings SET value='abc' WHERE key='ai_cap_usd'")
    db.close()
    model = FakeModel(answer=answer)
    loop = Loop(  # the ingest job's fetch is a stand-in: no test reaches the network
        root, fetch_fn=_offline, ai=ai_run.Setup(environ(tmp_path), rulings, lambda c, p: model)
    )
    live = Live(root, loop=loop)
    try:
        code, _, built = live.call("GET", "/api/snapshot", cookie="signal_name=Olga")
        assert code == 200 and react_refusal(built) is None
        ai = built["scenes"][0]["snapshot"]["settings"]["ai"]
        assert ai["state"] == "off"
        assert ai["notice"]["text"].startswith(
            "The store's AI settings cannot be read, so the AI pass is off until the owner sets"
            " them again on the command line (signal ai cap, signal ai clear)."
        )
        code, _, reader = live.call("GET", "/api/snapshot", cookie=COOKIE)
        assert code == 200 and reader["scenes"][0]["snapshot"]["settings"]["ai"]["state"] == "off"
        code, _, status = live.call("GET", "/api/status")
        assert (code, status["ai_state"]) == (200, "off")
    finally:
        live.close()
    loop.run_once(NOW)  # the loop's AI jobs fail alone and make no call
    assert model.requests == [] and loop.ai_error is not None
