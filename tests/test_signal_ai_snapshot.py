"""The AI parts of the snapshot, on, off and at the cap, each checked against the real React reader
(``tests/signal_reader_check.py``), and the snapshot's size with every AI field at its limit.
SYNTHETIC: the AI rows are written by hand as the pass would store them; no model is called.
Expected values are written by hand.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import CONFIG, FakeModel, ok, status_on
from signal_reader_check import react_refusal

from deploy_workflow.signal import (
    ai_digest,
    ai_gate,
    ai_ledger,
    digests,
    notif,
    snapshot,
    store,
    topics,
)
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
WRITER = User("Mara L", "writer")
NO_RULING = (
    "No standing ruling for Signal's model calls is in docs/rulings"
    " (a file named YYYY-MM-DD-signal-ai-pass.md)."
)
READER = User("Tobias O", "reader")


@pytest.fixture
def db(tmp_path: Path) -> Any:
    held = store.open_db(tmp_path)
    store.add_user(held, "Mara L", "writer")
    store.add_user(held, "Tobias O", "reader")
    for name, kind in (
        ("Harbour Wire", "news"),
        ("Regulatory Gazette", "regulator"),
        ("Northgate Ratings", "ratings"),
    ):
        made = store.propose_source(
            held, name, kind, f"https://{name.split()[0].lower()}.example/f", "x"
        )
        store.set_source_state(held, made, "approved")
    yield held
    held.close()


def add(db: sqlite3.Connection, source: int, title: str, hours: float) -> int:
    when = NOW - timedelta(hours=hours)
    store.add_story(db, source, Entry(title, f"https://x.example/{hours}", when, "Summary."), when)
    made = int(db.execute("SELECT MAX(id) FROM stories").fetchone()[0])
    topics.match_story(db, made)  # as the ingest does
    return made


def label(db: sqlite3.Connection, story_id: int, **row: Any) -> None:
    base = {
        "why": "Why it matters.",
        "signal": 2,
        "tags": "[]",
        "kind": "news",
        "stage": None,
        "moves": "[]",
    }
    fields = {**base, **row}
    with db:
        db.execute(
            "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, stage, moves,"
            " config_id,"
            " written_at, month) VALUES(?, 'written', ?, ?, ?, ?, ?, ?, ?, ?, '2026-11')",
            (
                story_id,
                fields["why"],
                fields["signal"],
                fields["tags"],
                fields["kind"],
                fields["stage"],
                fields["moves"],
                CONFIG,
                NOW.isoformat(),
            ),
        )


def seed(db: sqlite3.Connection) -> dict[str, int]:
    corvane = add(db, 1, "Corvane Packaging to close two plants", 2)
    tessaly = add(db, 2, "Authority opens in-depth review of Tessaly tower sale", 3)
    halvorsen = add(db, 3, "Northgate downgrades Halvorsen Marine to B+", 4)
    plain = add(db, 1, "Pellant plans a first bond", 1)
    label(
        db,
        corvane,
        why="The charge lands in the covenant step-down quarter.",
        signal=3,
        tags='["Packaging", "Restructuring"]',
    )
    label(
        db,
        tessaly,
        kind="regulatory case",
        stage="in-depth review",
        tags='["Telecoms", "Disposals"]',
    )
    label(
        db,
        halvorsen,
        kind="rating action",
        signal=3,
        moves='[{"from": "Negative", "to": "Stable"}, {"from": "BB-", "to": "B+"}]',
        tags='["Shipping"]',
    )
    with db:
        db.execute(
            "INSERT INTO story_ai(story_id, outcome, config_id, written_at, month)"
            " VALUES(?, 'invalid', ?, ?, '2026-11')",
            (plain, CONFIG, NOW.isoformat()),
        )
    packaging = topics.add_topic(db, "Packaging", ["Corvane", "Pellant"], [], "Mara L")
    topics.follow(db, "Mara L", packaging)
    topics.add_topic(db, "Shipping", ["Halvorsen", "Tessaly"], [], "Mara L")
    return {"corvane": corvane, "tessaly": tessaly, "halvorsen": halvorsen, "plain": plain}


def built(db: sqlite3.Connection, user: User | None, ai: ai_gate.Status | None) -> dict[str, Any]:
    document = snapshot.build(db, user, NOW, service=snapshot.Service(ai=ai))
    assert react_refusal(document) is None, react_refusal(document)
    found: dict[str, Any] = document["scenes"][0]["snapshot"]
    return found


def story_of(snap: dict[str, Any], story_id: int) -> dict[str, Any]:
    return next(s for s in snap["feed"]["stories"] if s["id"] == str(story_id))


def status(
    state: str,
    *,
    missing: tuple[str, ...] = (),
    spent: str = "6.4",
    held: str = "0",
    invalid: int = 0,
) -> ai_gate.Status:
    gate = ai_gate.Gate(Path("r.md"), CONFIG, Decimal(15), missing)
    month = ai_ledger.Month("2026-11", Decimal(spent), Decimal(held), 0, 0)
    return ai_gate.Status(gate, month, invalid, None, state)  # type: ignore[arg-type]


def test_with_ai_on_a_story_carries_what_the_pass_wrote(db):
    ids = seed(db)
    snap = built(db, WRITER, status_on())
    corvane = story_of(snap, ids["corvane"])
    assert corvane["ai"] == {"line": "The charge lands in the covenant step-down quarter."}
    assert corvane["strength"] == {"marks": 3, "word": "Strong"}
    assert (corvane["kind"], corvane["kindLabel"]) == ("news", "News")
    assert corvane["tags"] == ["Packaging", "Restructuring"]  # the topic name is not repeated
    tessaly = story_of(snap, ids["tessaly"])
    assert (tessaly["kind"], tessaly["kindLabel"]) == ("regulator", "Regulatory case")
    assert tessaly["stage"] == {
        "current": "In-depth review",
        "label": "Stage 3 of 4",
        "position": 0.75,
        "stages": [
            {"name": "Opened", "current": False},
            {"name": "Initial review", "current": False},
            {"name": "In-depth review", "current": True},
            {"name": "Decision", "current": False},
        ],
    }
    assert tessaly["tags"] == ["Telecoms", "Disposals", "Shipping"]  # the pass's, then its topic
    halvorsen = story_of(snap, ids["halvorsen"])
    assert halvorsen["ratingMoves"] == [
        {"from": "BB-", "to": "B+", "word": "Downgrade, one notch"},
        {"from": "Negative", "to": "Stable", "word": "Outlook"},
    ]
    assert (halvorsen["kind"], halvorsen["kindLabel"]) == ("ratings", "Rating action")
    plain = story_of(snap, ids["plain"])
    assert (plain["ai"], plain["strength"], plain["stage"], plain["ratingMoves"]) == (
        None,
        None,
        None,
        [],
    )


def test_with_ai_on_the_top_order_reads_signal_strength(db):
    ids = seed(db)
    on = built(db, WRITER, status_on())["feed"]["views"]["latest"]
    off = built(db, WRITER, None)["feed"]["views"]["latest"]
    by_age = [str(ids[k]) for k in ("plain", "corvane", "tessaly", "halvorsen")]
    assert off["top"] == by_age
    # log strength - age/24h * log 2: Corvane 3 at 2 h 1.04, Halvorsen 3 at 4 h 0.98, Tessaly 2 at
    # 3 h 0.61, Pellant (its output failed, so 1) at 1 h -0.03
    assert on["top"] == [str(ids[k]) for k in ("corvane", "halvorsen", "tessaly", "plain")]
    assert on["latest"] == by_age


@pytest.mark.parametrize("ai", [None, "off", "capped"])
def test_off_or_at_the_cap_no_story_carries_any_ai_field(db, ai):
    ids = seed(db)
    given = (
        None
        if ai is None
        else status(ai, missing=("The owner has not set a monthly cap.",) if ai == "off" else ())
    )
    snap = built(db, WRITER, given)
    for story in snap["feed"]["stories"]:
        assert (story["ai"], story["strength"], story["stage"], story["ratingMoves"]) == (
            None,
            None,
            None,
            [],
        )
    assert story_of(snap, ids["tessaly"])["kind"] == "regulator"  # the source's kind, as before
    assert story_of(snap, ids["corvane"])["tags"] == ["Packaging"]


def test_settings_say_why_ai_is_off_in_plain_sentences(db):
    off = status(
        "off",
        missing=(
            "The owner has not set a monthly cap.",
            NO_RULING,
        ),
    )
    ai = built(db, WRITER, off)["settings"]["ai"]
    assert ai["state"] == "off"
    assert ai["notice"] == {
        "title": "AI is off",
        "text": "The owner has not set a monthly cap. No standing ruling for Signal's model calls"
        " is in docs/rulings (a file named YYYY-MM-DD-signal-ai-pass.md). Stories arrive with no"
        " AI line and no signal strength, and digests are paused. Nothing more is spent while it"
        " is off.",
    }
    assert [part["on"] for part in ai["parts"]] == [False, False, False]


def test_settings_with_ai_on_show_the_spend_against_the_cap(db):
    ai = built(db, WRITER, status("on", spent="6.4", held="0.3585", invalid=2))["settings"]["ai"]
    assert ai == {
        "state": "on",
        "notice": None,
        "spend": {
            "title": "Spend in November",
            "label": "USD 6.40 of USD 15.00",
            "note": "The cap resets on 1 December. USD 0.36 more is held for calls in progress."
            " 2 stories this month had AI output that failed its check and show no AI line.",
            "position": 0.43,
        },
        "parts": [
            {
                "id": "ai-line",
                "label": "AI line on stories",
                "hint": "One line on why a story matters, marked AI.",
                "on": True,
            },
            {
                "id": "strength",
                "label": "Signal strength",
                "hint": "Three marks and a word on each story.",
                "on": True,
            },
            {
                "id": "digests",
                "label": "Digests",
                "hint": "Scheduled briefs. A digest with nothing to report makes no call.",
                "on": True,
            },
        ],
    }


def test_settings_at_the_cap_say_so_and_when_it_resets(db):
    ai = built(db, WRITER, status("capped", spent="14.9999"))["settings"]["ai"]
    assert ai["notice"] == {
        "title": "AI has reached its cap for November",
        "text": "Stories arrive with no AI line and no signal strength, and digests are paused"
        " until 1 December. Only the owner can raise the cap.",
    }
    assert ai["spend"]["label"] == "USD 15.00 of USD 15.00"  # a spend is never shown below itself
    assert (
        ai["spend"]["note"]
        == "Each call holds up to USD 0.36 until it is settled, and that no longer fits."
    )
    assert ai["spend"]["position"] == 1.0
    assert ai["parts"][2] == {
        "id": "digests",
        "label": "Digests",
        "hint": "Scheduled briefs.",
        "on": True,
    }


def test_a_reader_and_a_viewer_with_no_name_see_no_spend(db):
    for user in (READER, None):
        ai = built(db, user, status_on())["settings"]["ai"]
        assert (ai["state"], ai["notice"], ai["spend"], ai["parts"]) == ("on", None, None, [])


def test_the_signal_event_marks_a_followed_topics_strong_stories_while_its_switch_is_on(db):
    seed(db)
    on = built(db, WRITER, status_on())["channels"]["topics"]
    assert [(t["name"], t["count"]) for t in on] == [("Packaging", "1 strong"), ("Shipping", "2")]
    notif.set_switch(db, "Mara L", "signal", "inSignal", False)
    off = built(db, WRITER, status_on())["channels"]["topics"]
    assert [(t["name"], t["count"]) for t in off] == [("Packaging", "2"), ("Shipping", "2")]
    notif.set_switch(db, "Mara L", "signal", "inSignal", True)
    stopped = built(db, WRITER, None)["channels"]["topics"]
    assert [(t["name"], t["count"]) for t in stopped] == [("Packaging", "2"), ("Shipping", "2")]


def write_issue(db: sqlite3.Connection, ident: int, when: datetime, reply: str) -> None:
    ai_ledger.set_cap(db, Decimal(15), NOW)
    writer = ai_digest.Writer(db, FakeModel([ok(reply)]), when)
    assert digests.run_now(db, "Mara L", ident, when, writer).outcome == "written"


def _point(lead: str, body: str, *stories: int) -> dict[str, Any]:
    return {"lead": lead, "body": body, "stories": [str(n) for n in stories]}


def test_a_written_issue_is_drawn_with_its_points_while_ai_is_on(db):
    ids = seed(db)
    form = digests.Form(
        "Weekly brief",
        ["Topic: Packaging", "Topic: Shipping"],
        "Weekly, Friday 07:00 UTC",
        "Up to 5 points",
        "",
    )
    ident = digests.create(
        db, "Mara L", digests.spec_from_form(db, "Mara L", form), NOW - timedelta(days=2)
    )
    older = json.dumps({"points": [_point("Older lead", "Older body.", ids["corvane"])]})
    write_issue(db, ident, NOW - timedelta(minutes=30), older)  # its scope: the four stories
    charge = add(db, 1, "Corvane books a charge", 0.1)  # the only story of the next period
    newer = json.dumps(
        {"points": [_point("Packaging cuts capacity", "Corvane books a charge.", charge)]}
    )
    write_issue(db, ident, NOW, newer)
    snap = built(db, WRITER, status_on())
    (record,) = snap["digests"]
    assert record["paused"] is None
    newest, earlier = record["issues"]
    assert (newest["ai"], newest["nothing"]) == (True, None)
    assert newest["summary"] == (
        "Covers 24 November. Written by a model from 1 story in Packaging and Shipping."
    )
    assert newest["points"] == [
        {
            "number": "1",
            "lead": "Packaging cuts capacity",
            "body": "Corvane books a charge.",
            "storiesLine": "1 story behind this point",
            "stories": [
                {
                    "headline": "Corvane books a charge",
                    "url": "https://x.example/0.1",
                    "source": "Harbour Wire",
                    "time": "24 Nov",
                }
            ],
        }
    ]
    assert (earlier["ai"], earlier["summary"], earlier["points"]) == (
        True,
        "1 point from 4 stories",
        [],
    )
    card = next(c for c in snap["feed"]["digests"] if c["issueId"] == newest["id"])
    assert (card["ai"], card["points"], card["summary"], card["nothing"], card["unread"]) == (
        True,
        [{"number": "1", "lead": "Packaging cuts capacity"}],
        "1 point from 1 story",
        None,
        True,
    )
    assert snap["channels"]["digests"] == [
        {"id": str(ident), "name": "Weekly brief", "unread": True, "paused": False}
    ]
    paused = built(db, WRITER, None)["digests"][0]  # off: paused, every issue a row
    assert paused["paused"] is not None and all(issue["points"] == [] for issue in paused["issues"])


# Size: every AI field at its limit, in four-byte characters


BOMB = "\U0001f4a3"


def test_the_worst_state_with_every_ai_field_at_its_limit_stays_under_three_mib(db):
    long_title = BOMB * 2000
    many = []
    for n in range(400):
        when = NOW - timedelta(minutes=n + 1)
        store.add_story(
            db, 1, Entry(f"{long_title} {n}", f"https://x.example/{n}", when, BOMB * 300), when
        )
        many.append(int(db.execute("SELECT MAX(id) FROM stories").fetchone()[0]))
    for story_id in many:
        label(
            db,
            story_id,
            why=BOMB * 240,
            signal=3,
            kind="rating action",
            tags='["Aerospace and defence", "Business services", "Distressed exchange"]',
            moves='[{"from": "CCC+", "to": "CCC-"}, {"from": "Developing", "to": "Negative"}]',
        )
    topic = topics.add_topic(db, "Everything", ["x"], [], "Mara L")
    topics.follow(db, "Mara L", topic)
    with db:
        db.executemany(
            "INSERT INTO topic_stories(topic_id, story_id) VALUES(?, ?)", [(topic, n) for n in many]
        )
    lead, body = BOMB * ai_digest.MAX_LEAD, BOMB * ai_digest.MAX_BODY
    named = json.dumps(many[: ai_digest.MAX_STORIES])
    for d in range(digests.MAX_DIGESTS):
        form = digests.Form(
            f"{BOMB * 50} {d}", ["All stories"], "Daily, 07:00 UTC", "Up to 8 points", ""
        )
        ident = digests.create(db, "Mara L", digests.spec_from_form(db, "Mara L", form), NOW)
        with db:  # as many written issues as a digest keeps, each with 8 points at their limits
            for i in range(digests.KEEP_ISSUES):
                start, end = NOW - timedelta(days=i + 1), NOW - timedelta(days=i)
                cur = db.execute(
                    "INSERT INTO digest_issues(digest_id, kind, period_start, period_end,"
                    " created_at) VALUES(?, 'written', ?, ?, ?)",
                    (ident, start.isoformat(), end.isoformat(), end.isoformat()),
                )
                issue = cur.lastrowid
                db.execute("INSERT INTO digest_issue_ai VALUES(?, 60, ?)", (issue, CONFIG))
                db.executemany(
                    "INSERT INTO digest_points VALUES(?, ?, ?, ?, ?)",
                    [(issue, n, lead, body, named) for n in range(1, 9)],
                )
    document = snapshot.build(db, WRITER, NOW, service=snapshot.Service(ai=status_on()))
    size = len(json.dumps(document, ensure_ascii=False).encode("utf-8"))
    assert size < 3 * 1024 * 1024
    assert react_refusal(document) is None


def test_a_story_carries_at_most_six_tags_the_passs_first(db):
    ids = seed(db)
    for n in range(8):
        topics.add_topic(db, f"Corvane watch {n}", ["Corvane"], [], "Mara L")
    on = story_of(built(db, WRITER, status_on()), ids["corvane"])["tags"]
    assert on == [
        "Packaging",
        "Restructuring",
        "Corvane watch 0",
        "Corvane watch 1",
        "Corvane watch 2",
        "Corvane watch 3",
    ]
    off = story_of(built(db, WRITER, None), ids["corvane"])["tags"]
    assert off == ["Packaging", *(f"Corvane watch {n}" for n in range(5))]
