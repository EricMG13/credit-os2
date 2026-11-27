"""The group, thread, rule and notification routes, run for real on a loopback port.

Each write route is tried for its role rule (a reader is refused with 403 where only writers may
write), the name rule (401), unknown and unseen ids (404), the Origin and method rules, the body
limits, and its effect as the next snapshot shows it (checked by the React reader as well).

Store: Mara L (writer), Ines K (writer), Tobias O (reader); stories 1 and 2; topic 1. Group 1
"Desk" (everyone; members Mara L, Tobias O) with thread 1 on story 1 holding Mara L's comment 1,
posted now. Group 2 "Closed" (invited; member Ines K) with thread 2 holding Ines K's comment 2.
Group 3 "Spare" (everyone) is empty.
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
import test_signal_group_snapshot as group_snapshot
from signal_app import Live
from signal_reader_check import reader_part  # noqa: F401 (autouse)

from deploy_workflow.signal import api_groups, groups, threads
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import (
    add_story,
    open_db,
    propose_source,
    set_source_state,
)
from deploy_workflow.signal.topics import add_topic

MARA = ""
INES = ""
TOBIAS = ""
reader_says = group_snapshot.reader_says
ROUTE_PATH = re.compile("/api/[a-z0-9]+(/[a-z0-9]+)*")


def seed(root: Path) -> None:
    db = open_db(root)
    source = propose_source(db, "Wire", "news", "https://wire.example/feed", "Mara L")
    set_source_state(db, source, "approved")
    now = datetime.now(UTC)
    for n in (1, 2):
        add_story(
            db, source, Entry(f"Story {n} about plants", f"https://w.example/{n}", now, ""), now
        )
    add_topic(db, "Plants", ["plants"], [], "Mara L")
    mara, ines = User("Mara L", "writer"), User("Ines K", "writer")
    desk = groups.create_group(db, mara, "Desk", "everyone")
    groups.add_member(db, mara, desk, "Mara L")
    groups.add_member(db, mara, desk, "Tobias O")
    closed = groups.create_group(db, mara, "Closed", "invited")
    groups.add_member(db, mara, closed, "Ines K")
    groups.create_group(db, mara, "Spare", "everyone")
    threads.share(db, mara, desk, threads.Item(1, "Mine."), now)
    threads.share(db, ines, closed, threads.Item(2, "Hers."), now)
    db.close()


@pytest.fixture
def svc(tmp_path: Path) -> Iterator[Live]:
    seed(tmp_path)
    global MARA, INES, TOBIAS
    live = Live(tmp_path, signed_in=True)
    MARA = f"credit_os_session={live.create_account_session('Mara L', 'analyst')[1]}"
    INES = f"credit_os_session={live.create_account_session('Ines K', 'analyst')[1]}"
    TOBIAS = f"credit_os_session={live.create_account_session('Tobias O', 'reader')[1]}"
    try:
        yield live
    finally:
        live.close()
        MARA = INES = TOBIAS = ""


def snap(svc: Live, cookie: str | None = None) -> dict[str, Any]:
    status, _, body = svc.call("GET", "/api/snapshot", cookie=cookie or MARA)
    assert status == 200
    return body["scenes"][0]["snapshot"]


@pytest.fixture
def checked(svc: Live) -> Any:
    """The next snapshot, after the React reader accepted it."""

    def read(cookie: str | None = None) -> dict[str, Any]:
        status, _, body = svc.call("GET", "/api/snapshot", cookie=cookie or MARA)
        assert status == 200 and reader_says(body) == "ok"
        return body["scenes"][0]["snapshot"]

    return read


# (method, path, body) of every route, as a writer would call it successfully on the seed.
WRITES = [
    ("POST", "/api/groups", {"name": "New desk", "visibility": "invited"}),
    ("DELETE", "/api/groups/3", None),
    ("POST", "/api/groups/1/rename", {"name": "Desk two"}),
    ("POST", "/api/groups/1/visibility", {"visibility": "invited"}),
    ("POST", "/api/groups/1/members", {"name": "Amir S"}),
    ("POST", "/api/groups/1/members/remove", {"name": "Tobias O"}),
    ("POST", "/api/groups/1/topics", {"topics": ["1"]}),
    ("POST", "/api/groups/1/rules", {"rule": "archive-quiet", "on": True}),
    ("POST", "/api/groups/1/threads", {"story": "2", "note": "Also this."}),
    ("POST", "/api/threads/1/comments", {"text": "More."}),
    ("POST", "/api/comments/1/replies", {"text": "Answer."}),
    ("POST", "/api/comments/1/edit", {"text": "Mine, edited."}),
    ("DELETE", "/api/comments/1", None),
    ("POST", "/api/comments/1/reactions/agree", None),
    ("DELETE", "/api/comments/1/reactions/agree", None),
]
OPEN_TO_READERS = [
    ("POST", "/api/threads/1/read", None),
    ("POST", "/api/notifications", {"event": "threads", "channel": "inSignal", "on": False}),
]


def test_every_route_fits_the_reply_budget():
    for route in api_groups.ROUTES:
        assert route.method in ("GET", "POST", "DELETE")
    for method, path, _ in WRITES + OPEN_TO_READERS:
        assert ROUTE_PATH.fullmatch(path), path
        assert any(r.method == method and r.pattern.fullmatch(path) for r in api_groups.ROUTES)
    assert len(api_groups.ROUTES) == len(WRITES + OPEN_TO_READERS)


@pytest.mark.parametrize(("method", "path", "body"), WRITES)
def test_a_reader_is_refused_every_writer_route_and_nothing_changes(svc, method, path, body):
    before = snap(svc)
    status, _, reply = svc.call(method, path, body=body, cookie=TOBIAS)
    assert status == 403 and isinstance(reply["error"], str)
    assert snap(svc) == before


@pytest.mark.parametrize(("method", "path", "body"), WRITES + OPEN_TO_READERS)
def test_every_route_needs_a_name_and_the_services_origin(svc, method, path, body):
    before = snap(svc)
    assert svc.call(method, path, body=body)[0] == 401
    other = svc.call(method, path, body=body, cookie=MARA, origin="http://evil.example")
    assert other[0] == 403
    assert svc.call(method, path, body=body, cookie=MARA, origin=None)[0] == 403
    assert svc.call("PUT", path, body=body, cookie=MARA)[0] == 405
    assert snap(svc) == before


@pytest.mark.parametrize(("method", "path", "body"), WRITES + OPEN_TO_READERS)
def test_every_route_works_for_a_writer(svc, method, path, body, checked):
    status, _, reply = svc.call(method, path, body=body, cookie=MARA)
    assert status == 200, reply
    checked()


def test_a_read_mark_never_passes_the_time_of_the_snapshot_the_page_showed(svc, checked):
    """The page sends back the snapshot's asOf: a comment posted after that snapshot was read
    stays unread for the reader, though their read mark is made later."""
    status, _, shown = svc.call("GET", "/api/snapshot", cookie=TOBIAS)
    seen = shown["asOf"]
    assert status == 200 and re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{6})?\+00:00", seen)
    assert (
        svc.call("POST", "/api/threads/1/comments", body={"text": "Later."}, cookie=MARA)[0] == 200
    )
    assert svc.call("POST", "/api/threads/1/read", body={"seen": seen}, cookie=TOBIAS)[0] == 200
    assert checked(TOBIAS)["groups"][0]["threads"][0]["unread"] is True
    assert svc.call("POST", "/api/threads/1/read", cookie=TOBIAS)[0] == 200  # no body: up to now
    assert checked(TOBIAS)["groups"][0]["threads"][0]["unread"] is False


@pytest.mark.parametrize(
    "seen",
    ["yesterday", "2026-11-24T12:00:00", 1764000000, "0001-01-01T00:00:00+01:00", "x" * 65],
)
def test_a_seen_that_is_not_a_snapshot_time_is_400(svc, seen):
    status, _, reply = svc.call("POST", "/api/threads/1/read", body={"seen": seen}, cookie=TOBIAS)
    assert (status, reply) == (
        400,
        {"error": "seen must be the asOf time of the snapshot the page showed"},
    )


def test_readers_mark_read_and_set_their_own_switches(svc, checked):
    assert snap(svc, TOBIAS)["groups"][0]["threads"][0]["unread"] is True
    assert svc.call("POST", "/api/threads/1/read", cookie=TOBIAS)[0] == 200
    body = {"event": "digest", "channel": "onDesktop", "on": True}
    assert svc.call("POST", "/api/notifications", body=body, cookie=TOBIAS)[0] == 200
    after = checked(TOBIAS)
    assert after["groups"][0]["threads"][0]["unread"] is False
    assert after["settings"]["notifications"]["events"][3] == {
        "id": "digest",
        "label": "A digest of mine is ready",
        "inSignal": True,
        "onDesktop": True,
    }
    assert snap(svc)["settings"]["notifications"]["events"][3]["onDesktop"] is False


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("DELETE", "/api/groups/99", None),
        ("POST", "/api/groups/99/rename", {"name": "X"}),
        ("POST", "/api/groups/99/visibility", {"visibility": "invited"}),
        ("POST", "/api/groups/99/members", {"name": "X"}),
        ("POST", "/api/groups/99/members/remove", {"name": "X"}),
        ("POST", "/api/groups/99/topics", {"topics": []}),
        ("POST", "/api/groups/1/topics", {"topics": [99]}),
        ("POST", "/api/groups/1/rules", {"rule": "archive-30", "on": True}),
        ("POST", "/api/groups/99/rules", {"rule": "archive-quiet", "on": True}),
        ("POST", "/api/groups/99/threads", {"story": 1}),
        ("POST", "/api/groups/1/threads", {"story": 99}),
        ("POST", "/api/threads/99/comments", {"text": "x"}),
        ("POST", "/api/threads/99/read", None),
        ("POST", "/api/comments/99/replies", {"text": "x"}),
        ("POST", "/api/comments/99/edit", {"text": "x"}),
        ("DELETE", "/api/comments/99", None),
        ("POST", "/api/comments/99/reactions/seen", None),
        ("DELETE", "/api/comments/99/reactions/seen", None),
        ("POST", "/api/notifications", {"event": "comment", "channel": "inSignal", "on": True}),
        # What sits in a group Mara L cannot see is answered as missing, too.
        ("POST", "/api/groups/2/threads", {"note": "Let me in"}),
        ("POST", "/api/threads/2/comments", {"text": "x"}),
        ("POST", "/api/threads/2/read", None),
        ("POST", "/api/comments/2/replies", {"text": "x"}),
        ("POST", "/api/comments/2/reactions/seen", None),
    ],
)
def test_unknown_and_unseen_ids_are_404(svc, method, path, body):
    status, _, reply = svc.call(method, path, body=body, cookie=MARA)
    assert status == 404, reply


@pytest.mark.parametrize(
    ("path", "body", "status"),
    [
        ("/api/groups", {"name": "", "visibility": "everyone"}, 400),
        ("/api/groups", {"name": "Desk", "visibility": "everyone"}, 409),
        ("/api/groups", {"name": "X", "visibility": "Members only"}, 400),
        ("/api/groups/1/threads", {}, 400),
        ("/api/groups/1/threads", {"story": "1.5"}, 400),
        ("/api/groups/1/threads", {"story": True}, 400),
        ("/api/groups/1/threads", {"story": 1, "note": "x" * 4001}, 400),
        ("/api/threads/1/comments", {"text": " "}, 400),
        ("/api/threads/1/comments", {}, 400),
        ("/api/comments/1/edit", {"text": 3}, 400),
        ("/api/groups/1/rules", {"rule": "archive-quiet", "on": "yes"}, 400),
        ("/api/notifications", {"event": "digest", "channel": "email", "on": True}, 400),
    ],
)
def test_invalid_bodies_are_400_and_conflicts_409(svc, path, body, status):
    assert svc.call("POST", path, body=body, cookie=MARA)[0] == status


def test_bodies_are_capped_and_must_be_json_objects(svc):
    path = "/api/threads/1/comments"
    assert svc.call("POST", path, raw=b"x" * (64 * 1024 + 1), cookie=MARA)[0] == 413
    assert svc.call("POST", path, raw=b"[]", cookie=MARA)[0] == 400
    assert svc.call("POST", path, raw=b"{not json", cookie=MARA)[0] == 400


def test_only_the_author_edits_or_removes_and_replies_nest_one_level(svc):
    assert svc.call("POST", "/api/comments/1/edit", body={"text": "x"}, cookie=INES)[0] == 403
    assert svc.call("DELETE", "/api/comments/1", cookie=INES)[0] == 403
    status, _, reply = svc.call("POST", "/api/comments/1/replies", body={"text": "A"}, cookie=INES)
    assert status == 200
    deeper = f"/api/comments/{reply['comment']}/replies"
    assert svc.call("POST", deeper, body={"text": "B"}, cookie=MARA)[0] == 400


def test_a_share_and_a_conversation_show_in_the_next_snapshot(svc, checked):
    hostile = '<script>alert("x")</script> **not markdown**'
    status, _, made = svc.call(
        "POST", "/api/groups/1/threads", body={"story": 2, "note": hostile}, cookie=MARA
    )
    assert (status, made) == (200, {"thread": "3", "joined": False})
    again = svc.call("POST", "/api/groups/1/threads", body={"story": "2"}, cookie=INES)
    assert again[2] == {"thread": "3", "joined": True}
    note = svc.call("POST", "/api/groups/1/threads", body={"note": "Thursday?"}, cookie=INES)
    assert note[2] == {"thread": "4", "joined": False}
    reply = svc.call("POST", "/api/comments/1/replies", body={"text": "Yes."}, cookie=INES)
    assert reply[2] == {"comment": "4"}  # 1 and 2 were the seed's notes, 3 the note above
    react = svc.call("POST", "/api/comments/1/reactions/disagree", cookie=INES)
    assert react[2] == {"comment": "1", "word": "Disagree", "on": True}
    after = checked()
    desk = after["groups"][0]
    assert [(t["id"], t["storyId"], t["note"]) for t in desk["threads"]] == [
        ("1", "1", None),  # the reply above is the latest activity
        ("4", None, "Thursday?"),
        ("3", "2", None),
    ]
    (three,) = [t for t in after["threads"] if t["id"] == "3"]
    assert three["comments"][0]["text"] == hostile
    (one,) = [t for t in after["threads"] if t["id"] == "1"]
    assert one["comments"][0]["reactions"] == [{"word": "Disagree", "count": "1", "mine": False}]
    assert [r["text"] for r in one["comments"][0]["replies"]] == ["Yes."]
    (story,) = [s for s in after["feed"]["stories"] if s["id"] == "2"]
    assert story["threadRef"] == {"groupId": "1", "threadId": "3"}
    # Ines K's second share joined Mara L's thread: the thread's sharer stays Mara L.
    assert story["sharedBy"] == {"initials": "ML", "label": "Shared to Desk by you"}


def test_group_management_shows_in_the_next_snapshot(svc, checked):
    made = svc.call(
        "POST", "/api/groups", body={"name": " Rates ", "visibility": "everyone"}, cookie=MARA
    )
    assert made[2] == {"group": "4"}
    svc.call("POST", "/api/groups/4/members", body={"name": "Ines K"}, cookie=MARA)
    svc.call("POST", "/api/groups/1/visibility", body={"visibility": "invited"}, cookie=MARA)
    svc.call(
        "POST", "/api/groups/1/rules", body={"rule": "comments-edited", "on": False}, cookie=MARA
    )
    deleted = svc.call("DELETE", "/api/groups/3", cookie=MARA)
    assert deleted[:1] == (200,)
    assert svc.call("DELETE", "/api/groups/1", cookie=MARA)[0] == 409  # it holds a thread
    after = checked()
    assert [
        (g["name"], g["visibility"], g["memberSummary"]) for g in after["settings"]["groups"]
    ] == [
        ("Closed", "Members only", "1 member"),
        ("Desk", "Members only", "2 members"),
        ("Rates", "Visible to everyone", "1 member"),
    ]
    rules = {g["name"]: [r["on"] for r in g["rules"]] for g in after["settings"]["groups"]}
    assert rules == {
        "Closed": [True, True, False],
        "Desk": [False, True, False],  # only Desk's editing was switched off
        "Rates": [True, True, False],
    }
    assert after["settings"]["rules"] == []
    assert svc.call("POST", "/api/comments/1/edit", body={"text": "x"}, cookie=MARA)[0] == 403
    assert json.dumps(after).count("Spare") == 0


# What lies in a group the asker cannot see is answered as what does not exist (review finding 4)

COMMENT_ROUTES = [
    ("POST", "/api/comments/{}/replies", {"text": "x"}),
    ("POST", "/api/comments/{}/edit", {"text": "x"}),
    ("DELETE", "/api/comments/{}", None),
    *[("POST", "/api/comments/{}/reactions/" + w, None) for w in ("agree", "disagree", "seen")],
    *[("DELETE", "/api/comments/{}/reactions/" + w, None) for w in ("agree", "disagree", "seen")],
]
THREAD_ROUTES = [
    ("POST", "/api/threads/{}/comments", {"text": "x"}),
    ("POST", "/api/threads/{}/read", None),
]


@pytest.mark.parametrize(("method", "path", "body"), COMMENT_ROUTES + THREAD_ROUTES)
def test_an_unseen_comment_or_thread_answers_exactly_as_an_unknown_one(svc, method, path, body):
    # Comment 2 and thread 2 are in Closed, which Mara L cannot see; 98765 exists nowhere.
    unseen = svc.call(method, path.format(2), body=body, cookie=MARA)
    unknown = svc.call(method, path.format(98765), body=body, cookie=MARA)
    assert unseen[0] == unknown[0] == 404
    assert unseen[2] == json.loads(json.dumps(unknown[2]).replace("98765", "2"))
    assert unknown[2]["error"] in ("no comment with id 98765", "no thread with id 98765")


def test_a_full_thread_refuses_another_comment_with_a_sentence(svc, tmp_path):
    db = open_db(tmp_path)
    with db:
        db.executemany(
            "INSERT INTO comments(thread_id, author, body, created_at) VALUES(1, 'Ines K', 'x', ?)",
            [(datetime.now(UTC).isoformat(),)] * (threads.MAX_COMMENTS - 1),  # 1 is the seed's
        )
    db.close()
    for path in ("/api/threads/1/comments", "/api/comments/1/replies"):
        status, _, reply = svc.call("POST", path, body={"text": "more"}, cookie=MARA)
        assert (status, reply) == (
            409,
            {"error": "this thread holds 500 comments, the most it can hold"},
        )


# The snapshot's two focus parameters


@pytest.mark.parametrize(
    "query",
    [
        "thread=",
        "thread=abc",
        "thread=-1",
        "thread=1.5",
        "thread=%D9%A3",
        "thread=1%20",
        "topic=",
        "topic=x1",
        "topic=1e3",
        "topic=" + "9" * 19,
    ],
)
def test_a_focus_that_is_not_a_decimal_id_is_400(svc, query):
    status, _, reply = svc.call("GET", "/api/snapshot?" + query, cookie=MARA)
    name = query.split("=")[0]
    assert (status, reply) == (400, {"error": f"{name} must be an id: digits only"})


def test_an_unseen_or_unknown_focus_is_ignored_silently(svc, checked):
    # Thread 2 is in Closed, which Mara L cannot see; topic 2 and thread 98765 do not exist.
    plain = checked()
    for query in ("thread=2", "thread=98765", "thread=0", "topic=2", "topic=2&thread=2"):
        status, _, body = svc.call("GET", "/api/snapshot?" + query, cookie=MARA)
        assert status == 200
        assert body["scenes"][0]["snapshot"] == plain, query


def test_a_focused_thread_is_delivered_with_its_comments(svc, checked, monkeypatch):
    from deploy_workflow.signal import group_view

    monkeypatch.setattr(group_view, "GROUP_BUDGET", 0)  # nothing fits: every thread a summary
    plain = checked()
    (one,) = [t for t in plain["threads"] if t["id"] == "1"]
    assert (one["comments"], one["subline"]) == (
        [],
        "Desk, 1 comment, shown when the thread is opened",
    )
    status, _, body = svc.call("GET", "/api/snapshot?thread=1", cookie=MARA)
    assert status == 200 and reader_says(body) == "ok"
    (one,) = [t for t in body["scenes"][0]["snapshot"]["threads"] if t["id"] == "1"]
    assert one["subline"] == "Desk, 1 comment"
    assert [c["text"] for c in one["comments"]] == ["Mine."]


def test_the_every_group_rule_route_is_gone_and_a_groups_rule_answers_what_it_set(svc):
    status, _, reply = svc.call(
        "POST", "/api/rules", body={"rule": "archive-quiet", "on": True}, cookie=MARA
    )
    assert status == 404
    status, _, reply = svc.call(
        "POST", "/api/groups/1/rules", body={"rule": "archive-quiet", "on": True}, cookie=MARA
    )
    assert (status, reply) == (200, {"group": "1", "rule": "archive-quiet", "on": True})
    for body, answer in (
        ({"rule": "archive-30", "on": True}, (404, "no thread rule 'archive-30'")),
        ({"rule": "archive-quiet", "on": 1}, (400, "on must be true or false")),
    ):
        status, _, reply = svc.call("POST", "/api/groups/1/rules", body=body, cookie=MARA)
        assert (status, reply["error"]) == answer
    status, _, reply = svc.call(
        "POST", "/api/groups/1/rules", body={"rule": "archive-quiet", "on": True}, cookie=TOBIAS
    )
    assert (status, reply["error"]) == (403, "only a writer can manage groups")
