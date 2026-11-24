"""The Signal snapshot: the slice the React Signal screens read, built from a seeded store.

Expected values are written by hand from the seed below, not computed with the production helpers.
The committed sample ``web/src/pages/signal/live/snapshot.sample.json`` is this module's sample
store built for its writer; the web tests read it with ``readSlice``, which is the proof that the
two sides agree. To rewrite the sample after a deliberate change, run

    SIGNAL_SNAPSHOT_SAMPLE=write uv run pytest tests/test_signal_snapshot.py -k sample

and review the diff. The file is written as ``prettier --check`` (web's settings) wants it.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from deploy_workflow.signal import snapshot
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.feedview import save
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import (
    Check,
    add_story,
    add_user,
    open_db,
    propose_source,
    record_check,
    set_source_state,
)
from deploy_workflow.signal.topics import add_topic, follow

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
SAMPLE = Path(__file__).resolve().parents[1] / "web/src/pages/signal/live/snapshot.sample.json"
WRITER = User("Mara L", "writer")
READER = User("Tobias O", "reader")


def _source(db: sqlite3.Connection, name: str, kind: str, state: str, by: str = "Mara L") -> int:
    slug = name.lower().replace(" ", "-")
    source = propose_source(db, name, kind, f"https://{slug}.example/feed", by)
    if state != "proposed":
        set_source_state(db, source, state)
    with db:  # a fixed proposal time: propose_source stamps the wall clock
        db.execute(
            "UPDATE sources SET created_at=? WHERE id=?",
            ((NOW - timedelta(hours=30)).isoformat(), source),
        )
    return source


def _check(db: sqlite3.Connection, source: int, at: datetime, ok: bool, reason: str) -> None:
    record_check(db, source, Check(at, ok, reason, None, None, 0))


def _story(db: sqlite3.Connection, source: int, title: str, link: str, *made: Any) -> str:
    """A story fetched six minutes ago; `made` is its age (a timedelta) and its summary."""
    age, text = made
    return add_story(db, source, Entry(title, link, NOW - age, text), NOW - timedelta(minutes=6))


def seed_sample(root: Path) -> sqlite3.Connection:
    """Six sources (healthy, healthy, quiet, failing, paused, proposed), six stories, one of them
    folded from two other sources, three topics, the writer following one and saving one story."""
    db = open_db(root)
    add_user(db, "Mara L", "writer")
    add_user(db, "Tobias O", "reader")
    wire = _source(db, "Harbour Wire", "news", "approved")
    ledger = _source(db, "Credit Ledger Daily", "news", "approved")
    gazette = _source(db, "Regulatory Gazette", "regulator", "approved")
    ratings = _source(db, "Northgate Ratings", "ratings", "approved")
    post = _source(db, "The Meridian Post", "news", "paused")
    _source(db, "Freight Monitor", "news", "proposed", by="Tobias O")
    corvane = "https://harbour-wire.example/corvane"
    _story(
        db,
        wire,
        "Corvane Packaging to close two plants as volumes fall",
        corvane,
        timedelta(hours=2),
        "Corvane will shut two of its nine plants by March and take a one-off charge.",
    )
    assert _story(db, ledger, "Corvane closes plants", corvane, timedelta(hours=2), "") == (
        "duplicate"
    )
    assert _story(db, post, "Corvane to shut plants", corvane, timedelta(hours=2), "") == (
        "duplicate"
    )
    _story(
        db,
        wire,
        "Tessaly Telecom agrees the sale of its towers",
        "https://harbour-wire.example/tessaly",
        timedelta(minutes=40),
        "The buyer takes 4,100 masts; the sale needs clearance.",
    )
    _story(
        db,
        wire,
        "Brightwell Foods extends its term loan by three years",
        "https://harbour-wire.example/brightwell",
        timedelta(hours=26),
        "Lenders holding most of the EUR 400m loan agreed to the extension.",
    )
    _story(
        db,
        gazette,
        "Authority opens a review of the Tessaly Telecom tower sale",
        "https://regulatory-gazette.example/case-17",
        timedelta(days=9),
        "The authority says the sale could reduce competition for mast access.",
    )
    _story(
        db,
        ratings,
        "Northgate Ratings downgrades Halvorsen Marine to B+",
        "https://northgate-ratings.example/halvorsen",
        timedelta(days=3),
        "The agency cites weaker charter rates and a refinancing due in 2027.",
    )
    _story(
        db,
        post,
        "Lenmark Shipping refinances its fleet loan",
        "https://the-meridian-post.example/lenmark",
        timedelta(days=20),
        "",
    )
    six_min = NOW - timedelta(minutes=6)
    for source in (wire, ledger, gazette):
        _check(db, source, six_min, True, "1 new")
    _check(db, ratings, six_min, False, "feed is larger than 2 MB")
    _check(db, post, NOW - timedelta(minutes=8), True, "2 new")  # paused after this check
    packaging = add_topic(db, "Packaging", ["packaging", "plant closure"], [], "Mara L")
    add_topic(db, "Telecoms", ["Tessaly", "towers"], ["news", "regulator"], "Mara L")
    add_topic(db, "Shipping", ["Halvorsen", "Lenmark"], [], "Mara L")
    follow(db, "Mara L", packaging)
    save(db, "Mara L", 5)  # Halvorsen
    return db


@pytest.fixture
def sample(tmp_path: Path) -> Any:
    db = seed_sample(tmp_path)
    yield db
    db.close()


def _snap(db: sqlite3.Connection, user: User | None, **options: Any) -> dict[str, Any]:
    built = snapshot.build(db, user, NOW, **options)
    (scene,) = built["scenes"]
    assert scene["id"] == "main"
    return scene["snapshot"]


# Prettier's JSON layout for the web folder (printWidth 100): an object with members is one member
# per line; an array of plain values stays on one line when it fits, else one value per line; an
# array holding an object breaks.


def _pretty(value: Any, indent: int, used: int, tail: int) -> str:
    if isinstance(value, dict):
        if not value:
            return "{}"
        inner = " " * (indent + 2)
        members = []
        for index, (key, item) in enumerate(value.items()):
            head = f"{inner}{json.dumps(key)}: "
            last = index == len(value) - 1
            members.append(head + _pretty(item, indent + 2, len(head), 0 if last else 1))
        return "{\n" + ",\n".join(members) + "\n" + " " * indent + "}"
    if isinstance(value, list):
        if not value:
            return "[]"
        flat = all(not isinstance(item, (dict, list)) for item in value)
        line = "[" + ", ".join(json.dumps(item, ensure_ascii=False) for item in value) + "]"
        if flat and used + len(line) + tail <= 100:
            return line
        inner = " " * (indent + 2)
        items = [inner + _pretty(item, indent + 2, len(inner), 1) for item in value]
        return "[\n" + ",\n".join(items) + "\n" + " " * indent + "]"
    return json.dumps(value, ensure_ascii=False)


def pretty_json(value: Any) -> str:
    return _pretty(value, 0, 0, 0) + "\n"


def test_the_committed_sample_is_the_sample_store_built_for_its_writer(sample):
    text = pretty_json(snapshot.build(sample, WRITER, NOW))
    if os.environ.get("SIGNAL_SNAPSHOT_SAMPLE") == "write":
        SAMPLE.parent.mkdir(parents=True, exist_ok=True)
        SAMPLE.write_text(text, encoding="utf-8")
    assert SAMPLE.read_text(encoding="utf-8") == text


# Hand-written expectations over the sample store (story ids follow the seed's order: 1 Corvane,
# 2 Tessaly, 3 Brightwell, 4 the Gazette's review, 5 Halvorsen, 6 Lenmark; topic ids 1 Packaging,
# 2 Telecoms, 3 Shipping).

EMPTY_VIEW = {"top": [], "latest": [], "waiting": None, "older": []}


def _view(*ids: str) -> dict[str, Any]:
    return {"top": list(ids), "latest": list(ids), "waiting": None, "older": []}


def _story_of(snap: dict[str, Any], ident: str) -> dict[str, Any]:
    (found,) = [story for story in snap["feed"]["stories"] if story["id"] == ident]
    return found


def test_a_viewer_with_no_name_sees_no_stories_and_no_counts(sample):
    snap = _snap(sample, None)
    assert snap["viewer"] == {
        "name": None,
        "initials": None,
        "role": "reader",
        "roleLabel": "Reader",
    }
    assert snap["feed"]["stories"] == []
    assert snap["feed"]["views"] == {
        "for-you": EMPTY_VIEW,
        "latest": EMPTY_VIEW,
        "saved": EMPTY_VIEW,
    }
    assert snap["feed"]["topics"] == {"1": EMPTY_VIEW, "2": EMPTY_VIEW, "3": EMPTY_VIEW}
    assert snap["channels"] == {
        "topics": [
            {
                "id": "1",
                "name": "Packaging",
                "count": None,
                "followed": False,
                "keywords": ["packaging", "plant closure"],
            },
            {
                "id": "2",
                "name": "Telecoms",
                "count": None,
                "followed": False,
                "keywords": ["Tessaly", "towers"],
            },
            {
                "id": "3",
                "name": "Shipping",
                "count": None,
                "followed": False,
                "keywords": ["Halvorsen", "Lenmark"],
            },
        ],
        "groups": [],
        "digests": [],
        "savedCount": None,
    }
    # What is not a story is still shown: the sources and the freshness line.
    assert [source["name"] for source in snap["settings"]["sources"]] == [
        "Harbour Wire",
        "Credit Ledger Daily",
        "Regulatory Gazette",
        "Northgate Ratings",
        "The Meridian Post",
        "Freight Monitor",
    ]
    assert snap["feed"]["freshness"] == {
        "state": "checked",
        "checked": "6 min ago",
        "failing": "1 source failing",
        "error": None,
    }


def test_the_writer_sees_every_view_with_its_follows_and_saves(sample):
    snap = _snap(sample, WRITER)
    assert snap["viewer"] == {
        "name": "Mara L",
        "initials": "ML",
        "role": "writer",
        "roleLabel": "Writer",
    }
    feed = snap["feed"]
    assert (feed["status"], feed["error"], feed["sources"]) == ("ready", None, {"approved": True})
    assert feed["views"] == {
        "for-you": _view("1"),
        "latest": _view("2", "1", "3", "5", "4", "6"),
        "saved": _view("5"),
    }
    assert feed["topics"] == {"1": _view("1"), "2": _view("2", "4"), "3": _view("5", "6")}
    assert [story["id"] for story in feed["stories"]] == ["2", "1", "3", "5", "4", "6"]
    assert [(t["count"], t["followed"]) for t in snap["channels"]["topics"]] == [
        ("1", True),
        ("2", False),
        ("2", False),
    ]
    assert snap["channels"]["savedCount"] == "1"
    assert [story["saved"] for story in feed["stories"]] == [
        False,
        False,
        False,
        True,
        False,
        False,
    ]
    assert _story_of(snap, "1") == {
        "id": "1",
        "kind": "news",
        "kindLabel": "News",
        "headline": "Corvane Packaging to close two plants as volumes fall",
        "url": "https://harbour-wire.example/corvane",
        "source": {"name": "Harbour Wire", "monogram": "HW"},
        "time": "2 h ago",
        "summary": "Corvane will shut two of its nine plants by March and take a one-off charge.",
        "tags": ["Packaging"],
        "alsoIn": {"label": "Also in 2 other sources", "monograms": ["CL", "MP"], "more": None},
        "sharedBy": None,
        "ai": None,
        "strength": None,
        "saved": False,
        "commentCount": None,
        "threadRef": None,
        "stage": None,
        "ratingMoves": [],
    }
    assert [(s["kind"], s["kindLabel"], s["time"]) for s in feed["stories"]] == [
        ("news", "News", "40 min ago"),
        ("news", "News", "2 h ago"),
        ("news", "News", "Yesterday"),
        ("ratings", "Rating action", "21 Nov"),
        ("regulator", "Regulatory case", "15 Nov"),
        ("news", "News", "4 Nov"),
    ]
    assert _story_of(snap, "6")["summary"] is None  # an empty summary is no summary


def test_everything_the_service_does_not_have_is_delivered_empty(sample):
    snap = _snap(sample, WRITER)
    assert (snap["groups"], snap["threads"], snap["digests"]) == ([], [], [])
    assert (snap["channels"]["groups"], snap["channels"]["digests"], snap["feed"]["digests"]) == (
        [],
        [],
        [],
    )
    settings = snap["settings"]
    assert (settings["groups"], settings["rules"], settings["notifications"]) == (
        [],
        [],
        {"events": []},
    )
    assert settings["ai"] == {
        "state": "off",
        "notice": {
            "title": "AI is off",
            "text": "The AI pass is not set up on this Signal service. Stories arrive with no AI "
            "line and no signal strength, and there are no digests.",
        },
        "spend": None,
        "parts": [],
    }
    for story in snap["feed"]["stories"]:
        empty = ("ai", "strength", "sharedBy", "commentCount", "threadRef", "stage")
        assert [story[key] for key in empty] == [None] * 6 and story["ratingMoves"] == []
    assert settings["digestForm"] == {
        "name": "New digest",
        "covers": "All stories",
        "coversOptions": ["All stories", "Topic: Packaging", "Topic: Telecoms", "Topic: Shipping"],
        "schedule": "Weekly, Friday 07:00 UTC",
        "scheduleOptions": ["Weekly, Friday 07:00 UTC", "Daily, 07:00 UTC"],
        "length": "Up to 5 points",
        "lengthOptions": ["Up to 3 points", "Up to 5 points", "Up to 8 points"],
        "brief": "",
    }


def test_a_reader_follows_nothing_and_saves_nothing_yet(sample):
    snap = _snap(sample, READER)
    assert snap["viewer"] == {
        "name": "Tobias O",
        "initials": "TO",
        "role": "reader",
        "roleLabel": "Reader",
    }
    assert snap["feed"]["views"]["for-you"] == EMPTY_VIEW
    assert snap["feed"]["views"]["saved"] == EMPTY_VIEW
    assert snap["channels"]["savedCount"] == "0"
    assert [t["followed"] for t in snap["channels"]["topics"]] == [False, False, False]
    assert [t["count"] for t in snap["channels"]["topics"]] == ["1", "2", "2"]  # counts are shared
    assert not any(story["saved"] for story in snap["feed"]["stories"])


def test_an_owner_writes_and_is_labelled_owner(sample):
    viewer = _snap(sample, User("Ida Owner", "owner"))["viewer"]
    assert viewer == {"name": "Ida Owner", "initials": "IO", "role": "writer", "roleLabel": "Owner"}


def test_a_save_and_a_follow_show_in_the_next_snapshot(sample):
    save(sample, "Mara L", 2)
    follow(sample, "Mara L", 2)
    snap = _snap(sample, WRITER)
    assert snap["feed"]["views"]["saved"] == _view("2", "5")
    assert snap["feed"]["views"]["for-you"] == _view("2", "1", "4")
    assert snap["channels"]["savedCount"] == "2"
    assert [t["followed"] for t in snap["channels"]["topics"]] == [True, True, False]
    assert _story_of(snap, "2")["saved"] is True


def test_a_story_folded_from_many_sources_shows_three_tiles_and_the_rest_as_a_number(tmp_path):
    db = open_db(tmp_path)
    names = ["Harbour Wire", "Credit Ledger Daily", "The Meridian Post", "Regulatory Gazette"]
    first, *others = [
        _source(db, name, "news", "approved") for name in [*names, "Northgate Ratings"]
    ]
    for index, source in enumerate([first, *others]):
        title = "Corvane closes two plants" if index else "Corvane Packaging closes two plants"
        _story(db, source, title, "https://x.example/corvane", timedelta(hours=1), "")
    (story,) = _snap(db, WRITER)["feed"]["stories"]
    assert story["alsoIn"] == {
        "label": "Also in 4 other sources",
        "monograms": ["CL", "MP", "RG"],
        "more": "+1",
    }
    db.close()


def test_one_other_source_is_said_in_the_singular(tmp_path):
    db = open_db(tmp_path)
    one, two = (_source(db, name, "news", "approved") for name in ("Alpha Wire", "Beta News"))
    _story(db, one, "Plant closes", "https://x.example/a", timedelta(hours=1), "")
    _story(db, two, "Plant closes", "https://x.example/a", timedelta(hours=1), "")
    (story,) = _snap(db, WRITER)["feed"]["stories"]
    assert story["alsoIn"] == {"label": "Also in 1 other source", "monograms": ["BN"], "more": None}
    db.close()


def test_a_topic_with_no_stories_has_an_empty_view_and_a_zero_count(sample):
    add_topic(sample, "Steel", ["steel mill"], ["research"], "Mara L")
    snap = _snap(sample, WRITER)
    assert snap["channels"]["topics"][3] == {
        "id": "4",
        "name": "Steel",
        "count": "0",
        "followed": False,
        "keywords": ["steel mill"],
    }
    assert snap["feed"]["topics"]["4"] == EMPTY_VIEW
    assert snap["settings"]["topics"][3] == {
        "id": "4",
        "name": "Steel",
        "weekly": "No stories this week",
        "keywords": ["steel mill"],
        "kinds": ["Research"],
    }


def test_settings_topics_say_their_week_and_their_kinds(sample):
    assert _snap(sample, WRITER)["settings"]["topics"] == [
        {
            "id": "1",
            "name": "Packaging",
            "weekly": "1 story this week",
            "keywords": ["packaging", "plant closure"],
            "kinds": ["News", "Regulatory cases", "Rating actions", "Research"],
        },
        {
            "id": "2",
            "name": "Telecoms",
            "weekly": "1 story this week",
            "keywords": ["Tessaly", "towers"],
            "kinds": ["News", "Regulatory cases"],
        },
        {
            "id": "3",
            "name": "Shipping",
            "weekly": "1 story this week",
            "keywords": ["Halvorsen", "Lenmark"],
            "kinds": ["News", "Regulatory cases", "Rating actions", "Research"],
        },
    ]


def test_no_approved_source_is_said_and_nothing_is_checked(tmp_path):
    db = open_db(tmp_path)
    _source(db, "Freight Monitor", "news", "proposed", by="Tobias O")
    _source(db, "The Meridian Post", "news", "paused")
    snap = _snap(db, WRITER)
    assert snap["feed"]["sources"] == {"approved": False}
    assert snap["feed"]["freshness"] == {
        "state": "not-checked",
        "checked": None,
        "failing": None,
        "error": None,
    }
    assert snap["feed"]["stories"] == [] and snap["channels"]["topics"] == []
    assert snap["feed"]["topics"] == {} and snap["settings"]["topics"] == []
    assert snap["settings"]["digestForm"]["coversOptions"] == ["All stories"]
    db.close()


def test_an_approved_source_not_yet_checked_has_no_health_and_no_weeks(tmp_path):
    db = open_db(tmp_path)
    _source(db, "Harbour Wire", "news", "approved")
    snap = _snap(db, WRITER)
    assert snap["feed"]["sources"] == {"approved": True}
    assert snap["feed"]["freshness"]["state"] == "not-checked"
    assert snap["settings"]["sources"] == [
        {
            "id": "1",
            "name": "Harbour Wire",
            "kind": "News",
            "state": "Approved",
            "health": None,
            "reason": None,
            "stateNote": None,
            "healthNote": None,
            "lastCheck": None,
            "lastItem": None,
            "weeks": [],
            "sort": {"name": 1, "state": 1, "health": 4},
        }
    ]
    db.close()


def test_sources_of_each_state_and_health(sample):
    keys = ("state", "health", "reason", "stateNote", "healthNote", "lastCheck", "lastItem", "sort")
    got = [
        (source["name"], source["kind"], *(source[key] for key in keys))
        for source in _snap(sample, WRITER)["settings"]["sources"]
    ]
    assert got == [
        (
            "Harbour Wire",
            "News",
            "Approved",
            "Healthy",
            None,
            None,
            None,
            "6 min ago",
            "40 min ago",
            {"name": 3, "state": 1, "health": 1},
        ),
        (
            "Credit Ledger Daily",
            "News",
            "Approved",
            "Healthy",
            None,
            None,
            None,
            "6 min ago",
            "2 h ago",
            {"name": 1, "state": 1, "health": 1},
        ),
        (
            "Regulatory Gazette",
            "Regulatory cases",
            "Approved",
            "Quiet",
            None,
            None,
            "No item for 9 days",
            "6 min ago",
            "15 Nov",
            {"name": 5, "state": 1, "health": 2},
        ),
        (
            "Northgate Ratings",
            "Rating actions",
            "Approved",
            "Failing",
            "The last check failed: feed is larger than 2 MB",
            None,
            None,
            "6 min ago",
            "21 Nov",
            {"name": 4, "state": 1, "health": 3},
        ),
        (
            "The Meridian Post",
            "News",
            "Paused",
            None,
            None,
            None,
            None,
            "8 min ago",
            "2 h ago",
            {"name": 6, "state": 2, "health": 4},
        ),
        (
            "Freight Monitor",
            "News",
            "Proposed",
            None,
            None,
            "By Tobias O, yesterday",
            None,
            None,
            None,
            {"name": 2, "state": 3, "health": 4},
        ),
    ]


def test_a_source_draws_six_weeks_of_items_ending_now(sample):
    sources = _snap(sample, WRITER)["settings"]["sources"]
    labels = ["13 Oct", "20 Oct", "27 Oct", "3 Nov", "10 Nov", "17 Nov"]
    expected = {
        "Harbour Wire": [0, 0, 0, 0, 0, 3],
        "Regulatory Gazette": [0, 0, 0, 0, 1, 0],
        "The Meridian Post": [0, 0, 0, 1, 0, 1],
    }
    for source in sources:
        if source["name"] in expected:
            counts = expected[source["name"]]
            assert source["weeks"] == [
                {"label": f"Week of {label}", "items": str(n), "height": 1 if n else 0}
                for label, n in zip(labels, counts, strict=True)
            ], source["name"]
    assert sources[5]["weeks"] == []  # proposed, never read
    assert _snap(sample, WRITER)["settings"]["sourceWeeksHeading"] == "Items per week, 6 weeks"


def test_week_bars_are_scaled_to_the_busiest_week_and_a_count_is_never_flat(tmp_path):
    db = open_db(tmp_path)
    wire = _source(db, "Harbour Wire", "news", "approved")
    for n in range(300):  # 300 in the newest week, 1 in the week before it
        _story(db, wire, f"Item {n}", f"https://x.example/{n}", timedelta(minutes=n + 1), "")
    _story(db, wire, "Old item", "https://x.example/old", timedelta(days=8), "")
    _check(db, wire, NOW - timedelta(minutes=1), True, "301 new")
    weeks = _snap(db, None)["settings"]["sources"][0]["weeks"]
    assert [(w["items"], w["height"]) for w in weeks] == [
        ("0", 0),
        ("0", 0),
        ("0", 0),
        ("0", 0),
        ("1", 0.01),
        ("300", 1),
    ]
    db.close()


def test_a_quiet_source_with_no_item_says_so(tmp_path):
    db = open_db(tmp_path)
    wire = _source(db, "Harbour Wire", "news", "approved")
    _check(db, wire, NOW - timedelta(hours=1), True, "0 new")
    (source,) = _snap(db, WRITER)["settings"]["sources"]
    assert (source["health"], source["healthNote"], source["lastCheck"], source["lastItem"]) == (
        "Quiet",
        "No item yet",
        "1 h ago",
        None,
    )
    db.close()


def test_two_failing_sources_are_counted_in_the_freshness_line(sample):
    _check(sample, 1, NOW - timedelta(minutes=2), False, "Harbour Wire resolved to no address")
    snap = _snap(sample, WRITER)
    assert snap["feed"]["freshness"] == {
        "state": "checked",
        "checked": "2 min ago",
        "failing": "2 sources failing",
        "error": None,
    }
    assert snap["settings"]["sources"][0]["reason"] == (
        "The last check failed: Harbour Wire resolved to no address"
    )


def test_a_failed_ingest_pass_is_said_in_the_freshness_line(sample):
    freshness = _snap(sample, WRITER, pass_failed=True)["feed"]["freshness"]
    assert freshness["error"] == "last ingest pass failed"


def _many(root: Path, count: int) -> sqlite3.Connection:
    """`count` stories from one source, one minute apart: story n is the n-th oldest."""
    db = open_db(root)
    wire = _source(db, "Harbour Wire", "news", "approved")
    for n in range(1, count + 1):
        age = timedelta(minutes=count - n + 1)
        _story(db, wire, f"Item {n}", f"https://x.example/{n}", age, "")
    return db


def test_a_view_shows_thirty_and_holds_the_next_ninety_as_older(tmp_path):
    db = _many(tmp_path, 130)
    snap = _snap(db, WRITER)
    latest = snap["feed"]["views"]["latest"]
    newest_thirty = [str(n) for n in range(130, 100, -1)]
    assert latest["top"] == newest_thirty and latest["latest"] == newest_thirty
    assert latest["older"] == [str(n) for n in range(100, 10, -1)]
    assert latest["waiting"] is None
    assert [story["id"] for story in snap["feed"]["stories"]] == [
        str(n) for n in range(130, 10, -1)
    ]  # the ten oldest are named by no view, so they are not sent
    db.close()


def test_thirty_one_stories_put_one_in_older(tmp_path):
    db = _many(tmp_path, 31)
    latest = _snap(db, WRITER)["feed"]["views"]["latest"]
    assert (len(latest["top"]), latest["older"]) == (30, ["1"])
    db.close()


def test_a_story_in_several_views_is_sent_once(sample):
    stories = [story["id"] for story in _snap(sample, WRITER)["feed"]["stories"]]
    assert sorted(stories) == ["1", "2", "3", "4", "5", "6"]


def test_hostile_text_passes_through_as_data(tmp_path):
    db = open_db(tmp_path)
    name = '<img src=x onerror="alert(1)">'
    source = _source(db, "</script> <b>Wire</b>", "news", "approved")
    headline = '<script>alert("x")</script> & {{constructor}} \u202e'
    _story(db, source, headline, "javascript:alert(1)", timedelta(hours=1), "a\x00b <i>")
    add_topic(db, "__proto__", ["script"], [], name)
    with db:
        db.execute("UPDATE sources SET proposed_by=? WHERE id=?", (name, source))
    snap = _snap(db, User(name, "writer"))
    (story,) = snap["feed"]["stories"]
    assert story["headline"] == headline and story["summary"] == "a\x00b <i>"
    assert story["url"] is None  # not a web address: the screens get no link to follow
    assert story["source"] == {"name": "</script> <b>Wire</b>", "monogram": "SB"}
    assert snap["viewer"]["name"] == name and snap["viewer"]["initials"] == "IS"
    assert snap["channels"]["topics"][0]["name"] == "__proto__"
    assert snap["feed"]["topics"] == {"1": _view("1")}
    # The text survives a JSON round trip unchanged.
    assert json.loads(json.dumps(snapshot.build(db, None, NOW))) == snapshot.build(db, None, NOW)
    db.close()


def test_the_whole_snapshot_is_read_in_one_read_transaction(sample):
    said: list[str] = []
    sample.set_trace_callback(said.append)
    _snap(sample, WRITER)
    sample.set_trace_callback(None)
    assert said[0] == "BEGIN" and said[-1] == "ROLLBACK"
    inside = said[1:-1]
    assert inside and all(line.lstrip().upper().startswith("SELECT") for line in inside), inside
    assert not sample.in_transaction


@pytest.mark.parametrize(
    ("at", "text"),
    [
        (NOW - timedelta(seconds=59), "just now"),
        (NOW + timedelta(minutes=5), "just now"),
        (NOW - timedelta(minutes=1), "1 min ago"),
        (NOW - timedelta(minutes=59, seconds=59), "59 min ago"),
        (NOW - timedelta(hours=1), "1 h ago"),
        (NOW - timedelta(hours=23, minutes=59), "23 h ago"),
        (NOW - timedelta(hours=24), "yesterday"),
        (NOW - timedelta(hours=35, minutes=59), "yesterday"),
        (NOW - timedelta(hours=36), "yesterday"),  # 23 Nov, 00:00 UTC
        (NOW - timedelta(hours=36, seconds=1), "22 Nov"),
        (datetime(2026, 1, 1, tzinfo=UTC), "1 Jan"),
        (datetime(2025, 12, 31, 23, 0, tzinfo=UTC), "31 Dec 2025"),
    ],
)
def test_times_are_said_relative_to_now_in_utc(at, text):
    assert snapshot.ago(at, NOW) == text


@pytest.mark.parametrize(
    ("name", "tile"),
    [
        ("Harbour Wire", "HW"),
        ("Credit Ledger Daily", "CL"),
        ("The Meridian Post", "MP"),
        ("The", "T"),
        ("Authority", "A"),
        ("-- émile zola", "ÉZ"),
        ("***", "?"),
    ],
)
def test_a_publication_tile(name, tile):
    assert snapshot.monogram(name) == tile


@pytest.mark.parametrize(
    ("name", "letters"),
    [("Ada King", "AK"), ("ada  king  lee", "AK"), ("7 of 9", "7O"), ("Zoe", "Z"), ("--", "?")],
)
def test_viewer_initials_follow_the_name_dialog(name, letters):
    assert snapshot.initials(name) == letters
