"""Signal's settings writes through the HTTP service, run for real on a loopback port: topics,
source proposals and digests. Role, ownership, unknown ids, Origin and method rules, size limits and
hostile text are checked on every write, and each snapshot a write leads to is read by the real
React reader. Nothing here reaches beyond loopback; no source is fetched and no model is called.
"""

from __future__ import annotations

import re
import socket
import urllib.parse
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_reader_check import react_refusal
from test_signal_service import Live

from deploy_workflow.signal import digests, groups, ingest, store, topics
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.service import make_server

WRITER = "Mara L"
READER = "Tobias O"
OWNER = "Ida Owner"


def cookie(name: str) -> str:
    return f"signal_name={urllib.parse.quote(name)}"


@pytest.fixture
def root(tmp_path: Path) -> Iterator[Path]:
    db = store.open_db(tmp_path)
    store.add_user(db, WRITER, "writer")
    store.add_user(db, READER, "reader")
    store.add_user(db, OWNER, "owner")
    db.close()
    yield tmp_path


@pytest.fixture
def svc(root: Path) -> Iterator[Live]:
    live = Live(make_server(root, "127.0.0.1", 0))
    yield live
    live.close()


def rows(root: Path, sql: str, *params: Any) -> list[tuple[Any, ...]]:
    db = store.open_db(root)
    try:
        return [tuple(row) for row in db.execute(sql, params).fetchall()]
    finally:
        db.close()


def snapshot_of(svc: Live, name: str) -> dict[str, Any]:
    """The snapshot as the asking user gets it, checked by the React reader."""
    status, _, body = svc.call("GET", "/api/snapshot", cookie=cookie(name))
    assert status == 200
    assert react_refusal(body) is None, react_refusal(body)
    return dict(body["scenes"][0]["snapshot"])


def seed_story(root: Path, title: str, summary: str = "", kind: str = "news") -> int:
    db = store.open_db(root)
    try:
        slug = f"{title.lower().replace(' ', '-')}"
        found = store.propose_source(db, f"Src {slug}", kind, f"https://{slug}.example/f", "x")
        store.set_source_state(db, found, "approved")
        when = datetime.now(UTC) - timedelta(hours=1)
        store.add_story(db, found, Entry(title, f"https://{slug}.example/1", when, summary), when)
        return int(db.execute("SELECT id FROM stories WHERE title=?", (title,)).fetchone()["id"])
    finally:
        db.close()


# Every write: who may call it, which method, which origin, how big a body


WRITES = [
    ("POST", "/api/topics", {"name": "T", "keywords": ["k"], "kinds": []}),
    ("POST", "/api/topics/1/edit", {"name": "T", "keywords": ["k"], "kinds": []}),
    ("DELETE", "/api/topics/1", None),
    ("POST", "/api/sources", {"name": "S", "kind": "news", "url": "https://s.example/f"}),
    (
        "POST",
        "/api/digests",
        {
            "name": "D",
            "covers": "All stories",
            "schedule": "Daily, 07:00 UTC",
            "length": "Up to 3 points",
        },
    ),
    (
        "POST",
        "/api/digests/1/edit",
        {
            "name": "D",
            "covers": "All stories",
            "schedule": "Daily, 07:00 UTC",
            "length": "Up to 3 points",
        },
    ),
    ("DELETE", "/api/digests/1", None),
    ("POST", "/api/digests/1/run", None),
    ("POST", "/api/digests/1/read", None),
    ("POST", "/api/digests/1/issues/1/read", None),
]
IDS = [f"{method} {path}" for method, path, _ in WRITES]


@pytest.mark.parametrize(("method", "path", "body"), WRITES, ids=IDS)
def test_every_write_needs_a_display_name(svc, method, path, body):
    status, _, reply = svc.call(method, path, body=body)
    assert status == 401 and reply == {"error": "choose a display name first"}


@pytest.mark.parametrize(("method", "path", "body"), WRITES, ids=IDS)
def test_a_write_from_another_origin_is_refused_and_changes_nothing(svc, root, method, path, body):
    before = rows(
        root,
        "SELECT (SELECT COUNT(*) FROM topics), (SELECT COUNT(*) FROM sources),"
        " (SELECT COUNT(*) FROM digests), (SELECT COUNT(*) FROM digest_runs)",
    )
    for origin in ("http://evil.example", "http://127.0.0.1:1", None):
        status, _, _ = svc.call(method, path, body=body, cookie=cookie(WRITER), origin=origin)
        assert status == 403
    assert (
        rows(
            root,
            "SELECT (SELECT COUNT(*) FROM topics), (SELECT COUNT(*) FROM sources),"
            " (SELECT COUNT(*) FROM digests), (SELECT COUNT(*) FROM digest_runs)",
        )
        == before
    )


@pytest.mark.parametrize(("method", "path", "body"), WRITES, ids=IDS)
def test_a_write_route_answers_no_put_patch_or_options(svc, method, path, body):
    for wrong in ("PUT", "PATCH", "OPTIONS"):
        status, headers, _ = svc.call(wrong, path, body=body, cookie=cookie(WRITER))
        assert status == 405 and method in headers["Allow"]


def test_a_body_over_64_kib_or_not_an_object_is_refused(svc):
    big = {"name": "T", "keywords": ["k" * 70000], "kinds": []}
    assert svc.call("POST", "/api/topics", body=big, cookie=cookie(WRITER))[0] == 413
    for raw in (b"[1]", b'"text"', b"not json", b"null"):
        status, _, _ = svc.call(
            "POST",
            "/api/topics",
            raw=raw,
            cookie=cookie(WRITER),
            headers={"Content-Type": "application/json"},
        )
        assert status == 400


def test_an_id_the_route_pattern_does_not_take_is_not_found(svc):
    for path in ("/api/topics/abc/edit", "/api/digests/-1", "/api/digests/1234567890123456789"):
        method = "DELETE" if "edit" not in path else "POST"
        assert svc.call(method, path, body=None, cookie=cookie(WRITER))[0] == 404


# Topics


TOPIC = {"name": "Packaging", "keywords": ["plant closure", "containerboard"], "kinds": ["news"]}


def test_a_reader_cannot_write_topics_and_the_writer_and_owner_can(svc, root):
    for method, path, body in WRITES[:3]:
        status, _, reply = svc.call(method, path, body=body or TOPIC, cookie=cookie(READER))
        assert status == 403 and "only a writer" in reply["error"]
    assert rows(root, "SELECT COUNT(*) FROM topics") == [(0,)]
    for name in (WRITER, OWNER):
        body = {**TOPIC, "name": f"Topic of {name}"}
        status, _, reply = svc.call("POST", "/api/topics", body=body, cookie=cookie(name))
        assert status == 200 and reply["id"].isdigit()


def test_a_new_topic_matches_the_stories_already_stored_and_reaches_the_snapshot(svc, root):
    seed_story(root, "Corvane plant closure", "Two plants shut", "news")
    seed_story(root, "Plant closure rated", "Agency note", "ratings")
    seed_story(root, "Tanker rates", "Charter rates rise")
    status, _, reply = svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    assert (status, reply) == (200, {"id": "1"})
    assert rows(root, "SELECT name, keywords, kinds, created_by FROM topics") == [
        ("Packaging", '["plant closure", "containerboard"]', '["news"]', WRITER)
    ]
    assert rows(root, "SELECT story_id FROM topic_stories") == [(1,)]  # the news story only
    snap = snapshot_of(svc, READER)  # every user sees topics
    assert snap["settings"]["topics"] == [
        {
            "id": "1",
            "name": "Packaging",
            "weekly": "1 story this week",
            "keywords": ["plant closure", "containerboard"],
            "kinds": ["News"],
        }
    ]
    assert [t["name"] for t in snap["channels"]["topics"]] == ["Packaging"]
    assert snap["feed"]["topics"]["1"]["latest"] == ["1"]


def test_a_topic_name_is_taken_once_and_hostile_text_is_stored_as_plain_data(svc):
    hostile = {
        "name": '<img src=x onerror="alert(1)">',
        "keywords": ["'; DROP TABLE topics; --"],
        "kinds": [],
    }
    assert svc.call("POST", "/api/topics", body=hostile, cookie=cookie(WRITER))[0] == 200
    status, _, reply = svc.call("POST", "/api/topics", body=hostile, cookie=cookie(WRITER))
    assert status == 409 and "already exists" in reply["error"]
    topic = snapshot_of(svc, WRITER)["settings"]["topics"][0]
    assert topic["name"] == hostile["name"] and topic["keywords"] == hostile["keywords"]


BAD_TOPICS = [
    ({"keywords": ["k"], "kinds": []}, "name as text"),
    ({"name": 5, "keywords": ["k"], "kinds": []}, "name as text"),
    ({"name": "T", "kinds": []}, "keywords as a list of text"),
    ({"name": "T", "keywords": "k", "kinds": []}, "keywords as a list of text"),
    ({"name": "T", "keywords": [1], "kinds": []}, "keywords as a list of text"),
    ({"name": "T", "keywords": ["k"]}, "kinds as a list of text"),
    ({"name": "T", "keywords": [], "kinds": []}, "at least one keyword"),
    ({"name": "T", "keywords": [" "], "kinds": []}, "keyword must be"),
    ({"name": "T", "keywords": ["x" * 61], "kinds": []}, "keyword must be"),
    ({"name": "T", "keywords": [str(n) for n in range(13)], "kinds": []}, "at most 12"),
    ({"name": "T", "keywords": ["k"], "kinds": ["blog"]}, "invalid kind"),
    ({"name": "  ", "keywords": ["k"], "kinds": []}, "must not be empty"),
    ({"name": "x" * 81, "keywords": ["k"], "kinds": []}, "plain text"),
    ({"name": "bell\x07", "keywords": ["k"], "kinds": []}, "plain text"),
    ({"name": "T", "keywords": ["bell\x07"], "kinds": []}, "keyword is plain text"),
    ({"name": "T", "keywords": ["flip\u202eit"], "kinds": []}, "keyword is plain text"),
    ({"name": "T", "keywords": ["two\nlines"], "kinds": []}, "keyword is plain text"),
]


@pytest.mark.parametrize(("body", "words"), BAD_TOPICS)
def test_a_topic_that_is_not_accepted_says_why_and_stores_nothing(svc, root, body, words):
    status, _, reply = svc.call("POST", "/api/topics", body=body, cookie=cookie(WRITER))
    assert status == 400 and words in reply["error"]
    seed_story(root, "A story")
    status, _, reply = svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    assert status == 200 and reply["id"] == "1"  # the refused one took no id and left no row


def test_there_are_at_most_fifty_topics(svc):
    for number in range(50):
        body = {"name": f"Topic {number}", "keywords": ["k"], "kinds": []}
        assert svc.call("POST", "/api/topics", body=body, cookie=cookie(WRITER))[0] == 200
    status, _, reply = svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    assert status == 409 and "50 topics" in reply["error"]


def test_editing_a_topic_rule_rematches_the_stored_stories_in_one_step(svc, root):
    seed_story(root, "Corvane plant closure", "Two plants shut", "news")
    seed_story(root, "Tanker rates", "Charter rates rise", "news")
    seed_story(root, "Rated tanker", "Charter note", "ratings")
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    svc.call("POST", "/api/topics/1/follow", cookie=cookie(READER))
    assert rows(root, "SELECT story_id FROM topic_stories ORDER BY story_id") == [(1,)]
    new_rule = {"name": "Shipping", "keywords": ["tanker"], "kinds": []}
    status, _, reply = svc.call("POST", "/api/topics/1/edit", body=new_rule, cookie=cookie(WRITER))
    assert (status, reply) == (200, {"id": "1"})
    assert rows(root, "SELECT story_id FROM topic_stories ORDER BY story_id") == [(2,), (3,)]
    assert rows(root, "SELECT name, keywords, kinds FROM topics") == [
        ("Shipping", '["tanker"]', "[]")
    ]
    assert rows(root, "SELECT user_name FROM topic_follows") == [(READER,)]  # follows are kept
    narrowed = {"name": "Shipping", "keywords": ["tanker"], "kinds": ["ratings"]}
    svc.call("POST", "/api/topics/1/edit", body=narrowed, cookie=cookie(OWNER))
    assert rows(root, "SELECT story_id FROM topic_stories") == [(3,)]
    snap = snapshot_of(svc, READER)
    assert snap["settings"]["topics"][0]["kinds"] == ["Rating actions"]
    assert snap["channels"]["topics"][0]["followed"] is True


def test_an_edited_rule_holds_exactly_the_stories_it_names_whatever_the_old_rule_held(svc, root):
    seed_story(root, "Merger review opens", "The remedy phase", "news")
    seed_story(root, "Spectrum auction", "Roaming and tariff", "news")
    seed_story(root, "Spectrum auction paper", "Roaming and tariff", "research")
    svc.call(
        "POST",
        "/api/topics",
        body={"name": "A", "keywords": ["spectrum"], "kinds": []},
        cookie=cookie(WRITER),
    )
    assert rows(root, "SELECT story_id FROM topic_stories ORDER BY story_id") == [(2,), (3,)]
    rule = {"keywords": ["merger", "roaming", 'say "tariff"'], "kinds": ["news"]}
    svc.call("POST", "/api/topics/1/edit", body={"name": "A", **rule}, cookie=cookie(WRITER))
    # Stories 1 (merger) and 2 (roaming) are news; story 3 matches but is research; the phrase
    # "say tariff" is in no story.
    assert rows(root, "SELECT story_id FROM topic_stories ORDER BY story_id") == [(1,), (2,)]


def test_editing_only_the_name_keeps_the_matches(svc, root):
    seed_story(root, "Corvane plant closure", "", "news")
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    svc.call("POST", "/api/topics/1/edit", body={**TOPIC, "name": "Renamed"}, cookie=cookie(WRITER))
    assert rows(root, "SELECT name FROM topics") == [("Renamed",)]
    assert rows(root, "SELECT story_id FROM topic_stories") == [(1,)]


def test_editing_to_a_taken_name_or_an_unknown_topic_is_refused(svc, root):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    svc.call("POST", "/api/topics", body={**TOPIC, "name": "Other"}, cookie=cookie(WRITER))
    status, _, reply = svc.call("POST", "/api/topics/2/edit", body=TOPIC, cookie=cookie(WRITER))
    assert status == 409 and "already exists" in reply["error"]
    status, _, reply = svc.call("POST", "/api/topics/99/edit", body=TOPIC, cookie=cookie(WRITER))
    assert status == 404 and reply == {"error": "no topic with id 99"}
    bad = svc.call(
        "POST", "/api/topics/1/edit", body={**TOPIC, "keywords": []}, cookie=cookie(WRITER)
    )
    assert bad[0] == 400
    assert rows(root, "SELECT name, keywords FROM topics ORDER BY id") == [
        ("Packaging", '["plant closure", "containerboard"]'),
        ("Other", '["plant closure", "containerboard"]'),
    ]


def test_deleting_a_topic_removes_its_matches_and_follows(svc, root):
    seed_story(root, "Corvane plant closure", "", "news")
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    svc.call("POST", "/api/topics/1/follow", cookie=cookie(READER))
    status, _, reply = svc.call("DELETE", "/api/topics/1", cookie=cookie(WRITER))
    assert (status, reply) == (200, {"deleted": True})
    for table in ("topics", "topic_stories", "topic_follows"):
        assert rows(root, f"SELECT COUNT(*) FROM {table}") == [(0,)]
    assert snapshot_of(svc, READER)["settings"]["topics"] == []
    assert svc.call("DELETE", "/api/topics/1", cookie=cookie(WRITER))[0] == 404


# Sources


SOURCE = {"name": "Freight Monitor", "kind": "news", "url": "https://freight-monitor.example/feed"}


def test_a_reader_cannot_propose_a_source(svc, root):
    status, _, reply = svc.call("POST", "/api/sources", body=SOURCE, cookie=cookie(READER))
    assert status == 403 and "only a writer" in reply["error"]
    assert rows(root, "SELECT COUNT(*) FROM sources") == [(0,)]


def test_a_proposal_is_stored_as_proposed_and_nothing_is_fetched_or_looked_up(
    svc, root, monkeypatch
):
    real = socket.getaddrinfo

    def no_lookup(host: Any, *args: Any, **kwargs: Any) -> Any:
        if host != "127.0.0.1":  # the test's own client reaches the loopback service
            raise AssertionError(f"the proposal looked up {host}")
        return real(host, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", no_lookup)
    status, _, reply = svc.call("POST", "/api/sources", body=SOURCE, cookie=cookie(WRITER))
    assert (status, reply) == (200, {"id": "1"})
    got = rows(root, "SELECT name, kind, url, state, proposed_by FROM sources")
    assert got == [("Freight Monitor", "news", SOURCE["url"], "proposed", WRITER)]
    fetched: list[str] = []
    db = store.open_db(root)
    ingest.run_due(db, datetime.now(UTC), lambda url, etag, modified: fetched.append(url))  # type: ignore[arg-type, return-value]
    db.close()
    assert fetched == [] and rows(root, "SELECT COUNT(*) FROM source_checks") == [(0,)]
    (source,) = snapshot_of(svc, READER)["settings"]["sources"]
    assert (source["name"], source["state"], source["health"]) == (
        "Freight Monitor",
        "Proposed",
        None,
    )
    assert source["stateNote"] == f"By {WRITER}, just now"


BAD_SOURCES = [
    ({**SOURCE, "url": "http://freight.example/feed"}, "only https"),
    ({**SOURCE, "url": "https://203.0.113.9/feed"}, "plain host name"),
    ({**SOURCE, "url": "https://[2001:db8::1]/feed"}, "plain host name"),
    ({**SOURCE, "url": "https://localhost/feed"}, "plain host name"),
    ({**SOURCE, "url": "https://freight.example:8443/feed"}, "default port"),
    ({**SOURCE, "url": "https://user@freight.example/feed"}, "plain host name"),
    ({**SOURCE, "url": "https://freight.example/feed with space"}, "no spaces"),
    ({**SOURCE, "url": "https://freight.example/é"}, "no spaces"),
    ({**SOURCE, "url": "https://freight.example/" + "a" * 520}, "at most 512 characters"),
    ({**SOURCE, "url": "ftp://freight.example/feed"}, "only https"),
    ({**SOURCE, "url": ""}, "no spaces"),
    ({**SOURCE, "kind": "blog"}, "invalid kind"),
    ({**SOURCE, "name": "  "}, "must not be empty"),
    ({**SOURCE, "name": "n" * 81}, "at most 80 characters"),
    ({**SOURCE, "url": 5}, "url as text"),
    ({"name": "x", "kind": "news"}, "url as text"),
    ({**SOURCE, "kind": ["news"]}, "kind as text"),
    ({**SOURCE, "url": "https://freight.example:0/feed"}, "default port"),
    ({**SOURCE, "name": "bell\x07"}, "plain text"),
    ({**SOURCE, "name": "flip\u202eit"}, "plain text"),
    ({**SOURCE, "name": "two\nlines"}, "plain text"),
]


@pytest.mark.parametrize(("body", "words"), BAD_SOURCES)
def test_an_address_or_field_that_is_not_accepted_says_why_and_stores_nothing(
    svc, root, body, words
):
    status, _, reply = svc.call("POST", "/api/sources", body=body, cookie=cookie(WRITER))
    assert status == 400 and words in reply["error"]
    assert rows(root, "SELECT COUNT(*) FROM sources") == [(0,)]


def test_a_source_address_is_proposed_once(svc):
    assert svc.call("POST", "/api/sources", body=SOURCE, cookie=cookie(WRITER))[0] == 200
    status, _, reply = svc.call(
        "POST", "/api/sources", body={**SOURCE, "name": "Again"}, cookie=cookie(OWNER)
    )
    assert status == 409 and "already exists" in reply["error"]


def test_a_user_has_at_most_five_proposals_waiting_and_an_approval_frees_a_place(svc, root):
    def propose(name: str, number: int) -> int:
        body = {"name": f"S{number}", "kind": "news", "url": f"https://s{number}.example/feed"}
        return int(svc.call("POST", "/api/sources", body=body, cookie=cookie(name))[0])

    assert [propose(WRITER, n) for n in range(5)] == [200] * 5
    status, _, reply = svc.call(
        "POST",
        "/api/sources",
        body={**SOURCE, "url": "https://six.example/f"},
        cookie=cookie(WRITER),
    )
    assert status == 409 and "5 proposals waiting" in reply["error"]
    assert propose(OWNER, 10) == 200  # the limit is per user
    db = store.open_db(root)
    store.set_source_state(db, 1, "approved")  # the owner approves one on the command line
    db.close()
    assert propose(WRITER, 20) == 200
    assert rows(root, "SELECT COUNT(*) FROM sources WHERE state='proposed'") == [(6,)]


def test_hostile_text_in_a_proposal_is_stored_and_returned_as_plain_data(svc):
    body = {**SOURCE, "name": "<script>alert(1)</script>"}
    assert svc.call("POST", "/api/sources", body=body, cookie=cookie(WRITER))[0] == 200
    (source,) = snapshot_of(svc, WRITER)["settings"]["sources"]
    assert source["name"] == "<script>alert(1)</script>"


# Digests


def digest_body(**changes: Any) -> dict[str, Any]:
    base = {
        "name": "Weekly brief",
        "covers": "All stories",
        "schedule": "Weekly, Friday 07:00 UTC",
        "length": "Up to 5 points",
        "brief": "Lead with refinancing dates",
    }
    return {**base, **changes}


def test_any_named_user_builds_digests_and_the_form_the_snapshot_gave_posts_back(svc, root):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    for name in (READER, WRITER, OWNER):
        form = snapshot_of(svc, name)["settings"]["digestForm"]
        posted = {key: form[key] for key in ("name", "covers", "schedule", "length", "brief")}
        status, _, reply = svc.call("POST", "/api/digests", body=posted, cookie=cookie(name))
        assert status == 200 and reply["id"].isdigit()
        snap = snapshot_of(svc, name)
        assert [d["name"] for d in snap["digests"]] == ["New digest"]
        assert [c["name"] for c in snap["channels"]["digests"]] == ["New digest"]
    assert rows(root, "SELECT owner FROM digests ORDER BY id") == [(READER,), (WRITER,), (OWNER,)]


def test_every_option_the_form_delivers_is_accepted_by_the_create_route(svc):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    form = snapshot_of(svc, WRITER)["settings"]["digestForm"]
    for field, options in (
        ("covers", form["coversOptions"]),
        ("schedule", form["scheduleOptions"]),
        ("length", form["lengthOptions"]),
    ):
        for option in options:
            body = digest_body(name=f"{field}: {option}"[:60], **{field: option})
            status, _, reply = svc.call("POST", "/api/digests", body=body, cookie=cookie(WRITER))
            assert status == 200, (field, option, reply)
            svc.call("DELETE", f"/api/digests/{reply['id']}", cookie=cookie(WRITER))


def test_a_digest_is_stored_with_its_schedule_covers_and_brief(svc, root):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    body = digest_body(covers=["Topic: Packaging"], upcoming="Decisions due", lookAhead=14)
    status, _, reply = svc.call("POST", "/api/digests", body=body, cookie=cookie(READER))
    assert (status, reply) == (200, {"id": "1"})
    got = rows(
        root,
        "SELECT owner, name, cadence, minute, weekday, covers_all, subject, length, points,"
        " upcoming, look_ahead_days FROM digests",
    )
    assert got == [
        (
            READER,
            "Weekly brief",
            "weekly",
            420,
            4,
            0,
            "Lead with refinancing dates",
            "standard",
            5,
            "Decisions due",
            14,
        )
    ]
    assert rows(root, "SELECT topic_id FROM digest_topics") == [(1,)]
    (record,) = snapshot_of(svc, READER)["digests"]
    assert record["form"] == {
        "name": "Weekly brief",
        "covers": ["Topic: Packaging"],
        "schedule": "Weekly, Friday 07:00 UTC",
        "length": "Up to 5 points",
        "brief": "Lead with refinancing dates",
        "upcoming": "Decisions due",
        "lookAhead": 14,
    }


BAD_DIGESTS = [
    ({"name": 5}, "name as text"),
    ({"covers": 5}, "covers as a list of text"),
    ({"covers": [5]}, "covers as a list of text"),
    ({"schedule": ["Daily, 07:00 UTC"]}, "schedule as text"),
    ({"length": None}, "length as text"),
    ({"brief": 3}, "brief as text"),
    ({"lookAhead": True}, "lookAhead as a whole number"),
    ({"lookAhead": "7"}, "lookAhead as a whole number"),
    ({"lookAhead": 7.5}, "lookAhead as a whole number"),
    ({"lookAhead": 99}, "0 to 60"),
    ({"covers": "Everything"}, "not one of the things"),
    ({"covers": "Topic: Missing"}, "no topic called 'Missing'"),
    ({"covers": "Group: Closed"}, "no group called 'Closed'"),
    ({"schedule": "Daily, 07:00"}, "not one of the schedules"),
    ({"length": "Up to 9 points"}, "lengths offered"),
    ({"name": ""}, "must not be empty"),
    ({"brief": "x" * 501}, "at most 500"),
]


@pytest.mark.parametrize(("changes", "words"), BAD_DIGESTS)
def test_a_digest_that_is_not_accepted_says_why_and_stores_nothing(svc, root, changes, words):
    db = store.open_db(root)
    groups.add_member(
        db,
        User(WRITER, "writer"),
        groups.create_group(db, User(WRITER, "writer"), "Closed", "invited"),
        WRITER,
    )
    db.close()
    status, _, reply = svc.call(
        "POST", "/api/digests", body=digest_body(**changes), cookie=cookie(READER)
    )
    assert status == 400 and words in reply["error"]
    assert rows(root, "SELECT COUNT(*) FROM digests") == [(0,)]


def test_a_missing_key_is_a_refusal(svc):
    for key in ("name", "covers", "schedule", "length"):
        body = digest_body()
        del body[key]
        status, _, reply = svc.call("POST", "/api/digests", body=body, cookie=cookie(READER))
        assert status == 400 and key in reply["error"]
    body = digest_body()
    del body["brief"]  # the brief is optional
    assert svc.call("POST", "/api/digests", body=body, cookie=cookie(READER))[0] == 200


def test_a_user_has_five_digests_and_a_name_once_and_deleting_frees_a_place(svc):
    for number in range(5):
        body = digest_body(name=f"Digest {number}")
        assert svc.call("POST", "/api/digests", body=body, cookie=cookie(READER))[0] == 200
    status, _, reply = svc.call(
        "POST", "/api/digests", body=digest_body(name="Sixth"), cookie=cookie(READER)
    )
    assert status == 409 and "5 digests" in reply["error"]
    assert (
        svc.call("POST", "/api/digests", body=digest_body(name="Sixth"), cookie=cookie(WRITER))[0]
        == 200
    )
    assert svc.call("DELETE", "/api/digests/1", cookie=cookie(READER))[0] == 200
    status, _, reply = svc.call(
        "POST", "/api/digests", body=digest_body(name="Digest 3"), cookie=cookie(READER)
    )
    assert status == 409 and "already have a digest called" in reply["error"]
    assert (
        svc.call("POST", "/api/digests", body=digest_body(name="Sixth"), cookie=cookie(READER))[0]
        == 200
    )


def test_a_digest_is_its_owners_alone_for_every_write(svc, root):
    assert svc.call("POST", "/api/digests", body=digest_body(), cookie=cookie(READER))[0] == 200
    mine = rows(root, "SELECT * FROM digests")
    for other in (WRITER, OWNER):
        attempts = [
            ("POST", "/api/digests/1/edit", digest_body(name="Stolen")),
            ("DELETE", "/api/digests/1", None),
            ("POST", "/api/digests/1/run", None),
            ("POST", "/api/digests/1/read", None),
            ("POST", "/api/digests/1/issues/1/read", None),
        ]
        for method, path, body in attempts:
            status, _, reply = svc.call(method, path, body=body, cookie=cookie(other))
            assert status == 404 and reply == {"error": ("no digest with id 1")}, (method, path)
    assert rows(root, "SELECT * FROM digests") == mine
    assert rows(root, "SELECT COUNT(*) FROM digest_runs") == [(0,)]
    assert snapshot_of(svc, WRITER)["digests"] == []


def test_unknown_digests_and_issues_are_not_found(svc):
    svc.call("POST", "/api/digests", body=digest_body(), cookie=cookie(READER))
    for method, path, body in (
        ("POST", "/api/digests/99/edit", digest_body()),
        ("DELETE", "/api/digests/99", None),
        ("POST", "/api/digests/99/run", None),
        ("POST", "/api/digests/99/read", None),
        ("POST", "/api/digests/1/issues/99/read", None),
    ):
        status, _, reply = svc.call(method, path, body=body, cookie=cookie(READER))
        assert status == 404 and reply["error"].startswith("no "), (method, path)


def test_editing_a_digest_replaces_its_settings(svc, root):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    svc.call("POST", "/api/digests", body=digest_body(), cookie=cookie(READER))
    body = digest_body(
        name="Daily",
        covers=["Topic: Packaging"],
        schedule="Daily, 07:00 UTC",
        length="Up to 3 points",
        brief="",
    )
    status, _, reply = svc.call("POST", "/api/digests/1/edit", body=body, cookie=cookie(READER))
    assert (status, reply) == (200, {"id": "1"})
    assert rows(
        root, "SELECT name, cadence, weekday, covers_all, subject, length, points FROM digests"
    ) == [("Daily", "daily", None, 0, "", "short", 3)]
    assert rows(root, "SELECT topic_id FROM digest_topics") == [(1,)]
    bad = svc.call(
        "POST", "/api/digests/1/edit", body=digest_body(length="x"), cookie=cookie(READER)
    )
    assert bad[0] == 400
    assert rows(root, "SELECT name FROM digests") == [("Daily",)]
    assert snapshot_of(svc, READER)["digests"][0]["name"] == "Daily"


def test_run_once_now_with_no_story_stores_the_nothing_issue(svc, root):
    svc.call("POST", "/api/digests", body=digest_body(), cookie=cookie(READER))
    status, _, reply = svc.call("POST", "/api/digests/1/run", cookie=cookie(READER))
    assert status == 200
    assert reply == {
        "outcome": "nothing",
        "issueId": "1",
        "stories": 0,
        "message": "Nothing material happened in this period. The new issue says so.",
    }
    snap = snapshot_of(svc, READER)
    assert snap["digests"][0]["issues"][0]["nothing"].startswith("No story reached")
    assert snap["feed"]["digests"][0]["unread"] is True
    assert snap["feed"]["views"]["for-you"]["latest"] == ["d1"]


def test_run_once_now_with_stories_in_scope_writes_no_issue_and_says_why(svc, root):
    seed_story(root, "Corvane closes plants", "")
    seed_story(root, "Tanker rates", "")
    svc.call("POST", "/api/digests", body=digest_body(), cookie=cookie(READER))
    status, _, reply = svc.call("POST", "/api/digests/1/run", cookie=cookie(READER))
    assert (status, reply) == (
        200,
        {
            "outcome": "skipped",
            "issueId": None,
            "stories": 2,
            "message": "2 stories are in scope, but the AI pass is off, so no issue was written.",
        },
    )
    assert rows(root, "SELECT COUNT(*) FROM digest_issues") == [(0,)]
    snap = snapshot_of(svc, READER)
    (record,) = snap["digests"]
    assert record["issues"] == [] and "AI is off" in record["paused"]
    assert snap["feed"]["digests"] == []


def test_marking_issues_read_clears_the_cards_unread_mark(svc):
    svc.call("POST", "/api/digests", body=digest_body(), cookie=cookie(READER))
    svc.call("POST", "/api/digests/1/run", cookie=cookie(READER))
    svc.call("POST", "/api/digests/1/run", cookie=cookie(READER))
    status, _, reply = svc.call("POST", "/api/digests/1/issues/2/read", cookie=cookie(READER))
    assert (status, reply) == (200, {"read": True})
    cards = {c["issueId"]: c["unread"] for c in snapshot_of(svc, READER)["feed"]["digests"]}
    assert cards == {"1": True, "2": False}
    assert svc.call("POST", "/api/digests/1/read", cookie=cookie(READER))[0] == 200
    cards = {c["issueId"]: c["unread"] for c in snapshot_of(svc, READER)["feed"]["digests"]}
    assert cards == {"1": False, "2": False}


def test_hostile_text_in_a_digest_is_stored_and_returned_as_plain_data(svc):
    body = digest_body(name="<script>alert(1)</script>", brief='"><img src=x onerror=alert(1)>\n--')
    assert svc.call("POST", "/api/digests", body=body, cookie=cookie(READER))[0] == 200
    (record,) = snapshot_of(svc, READER)["digests"]
    assert record["name"] == "<script>alert(1)</script>"
    assert record["form"]["brief"] == body["brief"]


def test_the_digests_in_the_snapshot_are_the_viewers_only_and_survive_a_restart(svc, root):
    svc.call("POST", "/api/digests", body=digest_body(name="Reader's"), cookie=cookie(READER))
    svc.call("POST", "/api/digests", body=digest_body(name="Writer's"), cookie=cookie(WRITER))
    assert [d["name"] for d in snapshot_of(svc, READER)["digests"]] == ["Reader's"]
    assert [d["name"] for d in snapshot_of(svc, WRITER)["digests"]] == ["Writer's"]
    due = rows(root, "SELECT next_run_at FROM digests ORDER BY id")
    assert len(due) == 2
    reopened = store.open_db(root)  # the due times are in SQLite, not in memory
    assert [d.next_run_at > datetime.now(UTC) for d in digests.list_digests(reopened, READER)] == [
        True
    ]
    reopened.close()
    topics  # noqa: B018


def test_a_failing_digest_job_is_shown_by_status_but_is_not_an_ingest_failure(root, monkeypatch):
    from deploy_workflow.signal import service

    loop = service.Loop(root)
    live = Live(make_server(root, "127.0.0.1", 0, loop=loop))
    try:

        def boom(*args: object, **kwargs: object) -> None:
            raise RuntimeError("secret")

        monkeypatch.setattr(service.digests, "run_due", boom)
        loop.run_once(datetime.now(UTC))
        status, _, body = live.call("GET", "/api/status")
        assert status == 200
        assert body["loop_error"] == "the last digest pass failed (RuntimeError); see the log"
        fresh = snapshot_of(live, WRITER)["feed"]["freshness"]
        assert fresh["error"] is None  # the freshness line speaks of the ingest only
        monkeypatch.undo()
        loop.run_once(datetime.now(UTC))
        assert live.call("GET", "/api/status")[2]["loop_error"] is None
    finally:
        live.close()


def _tokens(text: str) -> list[str]:
    """Words as the full-text index sees them: runs of letters and digits, lower case."""
    return re.findall(r"[a-z0-9]+", text.lower())


def _holds(title: str, summary: str, keyword: str) -> bool:
    """Whether the keyword, as a phrase of whole words, occurs in the title or in the summary."""
    phrase = _tokens(keyword)
    for words in (_tokens(title), _tokens(summary)):
        for start in range(len(words) - len(phrase) + 1):
            if words[start : start + len(phrase)] == phrase:
                return True
    return False


def test_editing_a_rule_over_a_large_store_holds_exactly_the_stories_found_by_hand(root):
    db = store.open_db(root)
    words = ["merger", "remedy", "spectrum", "auction", "roaming", "tariff", "licence", "appeal"]
    base = datetime(2026, 1, 1, tzinfo=UTC)
    kinds_of = ("regulator", "news", "research")
    expected_titles: list[tuple[int, str, str, str]] = []
    with db:
        for index, kind in enumerate(kinds_of):
            db.execute(
                "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
                " VALUES(?, ?, ?, 'approved', 'x', ?)",
                (f"S{index}", kind, f"https://s{index}.example/f", base.isoformat()),
            )
        for number in range(1500):
            at = (base + timedelta(minutes=number)).isoformat()
            title = " ".join(words[(number * k + k) % len(words)] for k in (1, 3, 5))
            summary = words[number % len(words)]
            link = f"https://s{number % 3}.example/{number}"
            db.execute(
                "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
                " fetched_at, summary) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
                (number % 3 + 1, title, link, link, title, at, at, summary),
            )
            expected_titles.append((number + 1, kinds_of[number % 3], title, summary))
    topics.add_topic(db, "Old rule", ["merger"], [], "x")
    keywords, kinds = (
        ["spectrum", 'say "tariff"', "remedy spectrum", "no such word"],
        ["regulator", "news"],
    )
    started = datetime.now(UTC)
    topics.edit_topic(db, 1, "Edited", keywords, kinds)
    assert datetime.now(UTC) - started < timedelta(seconds=10)  # one index query per keyword
    held = {r[0] for r in db.execute("SELECT story_id FROM topic_stories WHERE topic_id=1")}
    by_hand = {
        number
        for number, kind, title, summary in expected_titles
        if kind in kinds and any(_holds(title, summary, keyword) for keyword in keywords)
    }
    assert held == by_hand and 0 < len(held) < 1500
    db.close()


# One address, one source


@pytest.mark.parametrize(
    "spelling",
    [
        "https://FREIGHT-monitor.example/feed",
        "https://freight-monitor.example:443/feed",
        "https://freight-monitor.example/feed#top",
        "https://Freight-Monitor.Example:443/feed#a",
        "HTTPS://freight-monitor.example/feed",
    ],
)
def test_another_spelling_of_a_proposed_address_is_the_same_source(svc, root, spelling):
    assert svc.call("POST", "/api/sources", body=SOURCE, cookie=cookie(WRITER))[0] == 200
    status, _, reply = svc.call(
        "POST", "/api/sources", body={**SOURCE, "url": spelling}, cookie=cookie(OWNER)
    )
    assert status == 409 and "already exists" in reply["error"]
    assert rows(root, "SELECT url FROM sources") == [(SOURCE["url"],)]


def test_a_proposed_address_is_stored_in_its_canonical_spelling(svc, root):
    url = "https://Freight-Monitor.EXAMPLE:443/feed?x=1#top"
    assert (
        svc.call("POST", "/api/sources", body={**SOURCE, "url": url}, cookie=cookie(WRITER))[0]
        == 200
    )
    assert rows(root, "SELECT url FROM sources") == [("https://freight-monitor.example/feed?x=1",)]


# Text no database can hold is refused, not a failure of the service

LONE = "x\ud800y"
TOPIC_OK = {"name": "Packaging", "keywords": ["plant"], "kinds": []}
DIGEST_OK = {
    "name": "Brief",
    "covers": "All stories",
    "schedule": "Daily, 07:00 UTC",
    "length": "Up to 3 points",
    "brief": "",
}
UNENCODABLE = [
    ("POST", "/api/topics", {**TOPIC_OK, "name": LONE}),
    ("POST", "/api/topics", {**TOPIC_OK, "keywords": [LONE]}),
    ("POST", "/api/topics", {**TOPIC_OK, "kinds": [LONE]}),
    ("POST", "/api/topics/1/edit", {**TOPIC_OK, "name": LONE}),
    ("POST", "/api/topics/1/edit", {**TOPIC_OK, "keywords": [LONE]}),
    ("POST", "/api/sources", {**SOURCE, "name": LONE}),
    ("POST", "/api/sources", {**SOURCE, "kind": LONE}),
    ("POST", "/api/sources", {**SOURCE, "url": f"https://a.example/{LONE}"}),
    ("POST", "/api/digests", {**DIGEST_OK, "name": LONE}),
    ("POST", "/api/digests", {**DIGEST_OK, "covers": f"Topic: {LONE}"}),
    ("POST", "/api/digests", {**DIGEST_OK, "covers": [f"Group: {LONE}"]}),
    ("POST", "/api/digests", {**DIGEST_OK, "schedule": LONE}),
    ("POST", "/api/digests", {**DIGEST_OK, "length": LONE}),
    ("POST", "/api/digests", {**DIGEST_OK, "brief": LONE}),
    ("POST", "/api/digests", {**DIGEST_OK, "upcoming": LONE}),
    ("POST", "/api/digests/1/edit", {**DIGEST_OK, "brief": LONE}),
    ("POST", "/api/digests/1/edit", {**DIGEST_OK, "covers": [f"Topic: {LONE}"]}),
]


@pytest.mark.parametrize(
    ("method", "path", "body"), UNENCODABLE, ids=[f"{m} {p} {sorted(b)}" for m, p, b in UNENCODABLE]
)
def test_a_lone_surrogate_in_any_text_is_refused_with_400_on_every_settings_route(
    svc, root, method, path, body
):
    svc.call("POST", "/api/topics", body={**TOPIC_OK, "name": "Existing"}, cookie=cookie(WRITER))
    svc.call("POST", "/api/digests", body={**DIGEST_OK, "name": "Existing"}, cookie=cookie(WRITER))
    before = rows(
        root,
        "SELECT (SELECT COUNT(*) FROM topics), (SELECT COUNT(*) FROM sources),"
        " (SELECT COUNT(*) FROM digests), (SELECT name FROM topics), (SELECT name FROM digests)",
    )
    status, _, reply = svc.call(method, path, body=body, cookie=cookie(WRITER))
    assert status == 400, (status, reply)
    assert isinstance(reply["error"], str) and "traceback" not in reply["error"].lower()
    after = rows(
        root,
        "SELECT (SELECT COUNT(*) FROM topics), (SELECT COUNT(*) FROM sources),"
        " (SELECT COUNT(*) FROM digests), (SELECT name FROM topics), (SELECT name FROM digests)",
    )
    assert after == before


# A digest with no cover


def test_deleting_a_topic_a_digest_covers_works_and_the_digest_says_what_happened(svc, root):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    svc.call(
        "POST", "/api/digests", body=digest_body(covers=["Topic: Packaging"]), cookie=cookie(READER)
    )
    status, _, reply = svc.call("DELETE", "/api/topics/1", cookie=cookie(WRITER))
    assert (status, reply) == (200, {"deleted": True})
    assert rows(root, "SELECT COUNT(*) FROM topics") == [(0,)] and rows(
        root, "SELECT COUNT(*) FROM digest_topics"
    ) == [(0,)]
    snap = snapshot_of(svc, READER)
    (record,) = snap["digests"]
    assert record["form"]["covers"] == [] and "covered was removed" in record["paused"]
    status, _, reply = svc.call("POST", "/api/digests/1/run", cookie=cookie(READER))
    assert (status, reply["outcome"], reply["issueId"], reply["stories"]) == (
        200,
        "skipped",
        None,
        0,
    )
    assert reply["message"] == (
        "This digest covers nothing now, so no issue was written. Edit it to choose what it covers."
    )
    edit = digest_body(covers=["All stories"])
    assert svc.call("POST", "/api/digests/1/edit", body=edit, cookie=cookie(READER))[0] == 200


def test_a_topic_a_group_still_lists_is_refused_with_a_sentence_that_says_so(svc, root):
    svc.call("POST", "/api/topics", body=TOPIC, cookie=cookie(WRITER))
    db = store.open_db(root)
    desk = groups.create_group(db, User(WRITER, "writer"), "Desk", "invited")
    groups.set_topics(db, User(WRITER, "writer"), desk, [1])
    db.close()
    status, _, reply = svc.call("DELETE", "/api/topics/1", cookie=cookie(WRITER))
    assert status == 409 and reply["error"] == (
        "a group still follows this topic; take it off the group's topics first"
    )
    assert rows(root, "SELECT COUNT(*) FROM topics") == [(1,)]
