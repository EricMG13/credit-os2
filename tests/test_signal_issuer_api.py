"""Signal's issuer routes through the HTTP service, run for real on a loopback port: who may call
each, the order of its refusals (the role first, then the id, as the topic routes have it), the
Origin and method rules, the size and text limits, and hostile text stored and returned as data.
Every snapshot read here is checked by the real React reader. Nothing is fetched."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from signal_app import Live
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)

from deploy_workflow.signal import store

WRITER, READER, OWNER = "Mara L", "Tobias O", "Ida Owner"
COOKIES: dict[str, str] = {}
ACME = {"name": "Acme Corp", "aliases": ["ACME"], "cik": "0000320193", "libraryKey": "id:acme"}


def cookie(name: str) -> str:
    return f"credit_os_session={COOKIES[name]}"


@pytest.fixture
def root(tmp_path: Path) -> Path:
    db = store.open_db(tmp_path)
    db.close()
    return tmp_path


@pytest.fixture
def svc(root: Path) -> Iterator[Live]:
    live = Live(root, signed_in=True)
    COOKIES.clear()
    COOKIES[WRITER] = live.create_account_session(WRITER, "analyst")[1]
    COOKIES[READER] = live.create_account_session(READER, "reader")[1]
    COOKIES[OWNER] = live.create_account_session(OWNER, "admin")[1]
    try:
        yield live
    finally:
        live.close()
        COOKIES.clear()


def rows(root: Path, sql: str) -> list[tuple[Any, ...]]:
    db = store.open_db(root)
    try:
        return [tuple(row) for row in db.execute(sql).fetchall()]
    finally:
        db.close()


def snapshot(svc: Live, name: str, query: str = "") -> dict[str, Any]:
    status, _, body = svc.call("GET", "/api/snapshot" + query, cookie=cookie(name))
    assert status == 200
    if "format=2" not in query:
        assert react_refusal(body) is None, react_refusal(body)
    return dict(body["scenes"][0]["snapshot"])


WRITES = [
    ("POST", "/api/issuers", ACME),
    ("POST", "/api/issuers/1/edit", ACME),
    ("DELETE", "/api/issuers/1", None),
    ("POST", "/api/issuers/1/follow", None),
    ("DELETE", "/api/issuers/1/follow", None),
]
IDS = [f"{method} {path}" for method, path, _ in WRITES]


@pytest.mark.parametrize(("method", "path", "body"), WRITES, ids=IDS)
def test_every_issuer_route_needs_a_display_name(svc, method, path, body):
    status, _, reply = svc.call(method, path, body=body)
    assert (status, reply) == (401, {"error": "sign in first"})


@pytest.mark.parametrize(("method", "path", "body"), WRITES, ids=IDS)
def test_a_write_from_another_origin_is_refused_and_changes_nothing(svc, root, method, path, body):
    svc.call("POST", "/api/issuers", body=ACME, cookie=cookie(WRITER))
    before = rows(root, "SELECT * FROM issuers") + rows(root, "SELECT * FROM issuer_follows")
    for origin in ("http://evil.example", "http://127.0.0.1:1", None):
        status, _, _ = svc.call(method, path, body=body, cookie=cookie(WRITER), origin=origin)
        assert status == 403
    after = rows(root, "SELECT * FROM issuers") + rows(root, "SELECT * FROM issuer_follows")
    assert after == before


@pytest.mark.parametrize(("method", "path", "body"), WRITES, ids=IDS)
def test_an_issuer_route_answers_no_put_patch_or_options(svc, method, path, body):
    for wrong in ("PUT", "PATCH", "OPTIONS"):
        status, headers, _ = svc.call(wrong, path, body=body, cookie=cookie(WRITER))
        assert status == 405 and method in headers["Allow"]


def test_a_reader_is_refused_before_the_id_is_looked_up(svc, root):
    for method, path, body in WRITES[:3]:
        status, _, reply = svc.call(method, path, body=body, cookie=cookie(READER))
        assert status == 403 and reply["error"].startswith("only a writer can")
    for method, path, body in WRITES[1:3]:  # a writer on an unknown id: 404
        status, _, reply = svc.call(method, path, body=body, cookie=cookie(WRITER))
        assert (status, reply) == (404, {"error": "no issuer with id 1"})
    for method, path, body in WRITES[3:]:  # any named user follows; an unknown id is 404
        status, _, reply = svc.call(method, path, body=body, cookie=cookie(READER))
        assert (status, reply) == (404, {"error": "no issuer with id 1"})
    assert rows(root, "SELECT COUNT(*) FROM issuers") == [(0,)]


def test_a_writer_and_the_owner_keep_issuers_and_a_reader_follows(svc, root):
    status, _, reply = svc.call("POST", "/api/issuers", body=ACME, cookie=cookie(WRITER))
    assert (status, reply) == (200, {"id": "1"})
    assert rows(root, "SELECT id, name, aliases, cik, library_key, created_by FROM issuers") == [
        (1, "Acme Corp", '["ACME"]', "0000320193", "id:acme", WRITER)
    ]
    assert rows(root, "SELECT name, kind, state, proposed_by FROM sources") == [
        ("Acme Corp filings (SEC)", "filing", "proposed", WRITER)
    ]
    edited = {"name": "Acme Holdings", "aliases": [], "cik": None, "libraryKey": None}
    status, _, reply = svc.call("POST", "/api/issuers/1/edit", body=edited, cookie=cookie(OWNER))
    assert (status, reply) == (200, {"id": "1"})
    assert rows(root, "SELECT name, aliases, cik, library_key FROM issuers") == [
        ("Acme Holdings", "[]", None, None)
    ]
    # The proposal was never approved or fetched: it is deleted, not kept paused (review finding 5).
    assert rows(root, "SELECT state FROM sources") == []
    follow = svc.call("POST", "/api/issuers/1/follow", cookie=cookie(READER))
    assert follow[0] == 200 and follow[2] == {"following": True}
    assert rows(root, "SELECT user_name, issuer_id FROM issuer_follows") == [(READER, 1)]
    unfollow = svc.call("DELETE", "/api/issuers/1/follow", cookie=cookie(READER))
    assert unfollow[0] == 200 and unfollow[2] == {"following": False}
    gone = svc.call("DELETE", "/api/issuers/1", cookie=cookie(WRITER))
    assert gone[0] == 200 and gone[2] == {"deleted": True}
    assert rows(root, "SELECT COUNT(*) FROM issuers") == [(0,)]


def test_only_a_name_is_needed(svc, root):
    status, _, reply = svc.call(
        "POST", "/api/issuers", body={"name": "Acme"}, cookie=cookie(WRITER)
    )
    assert (status, reply) == (200, {"id": "1"})
    assert rows(root, "SELECT aliases, cik, library_key FROM issuers") == [("[]", None, None)]


BAD = [
    ({}, 400, "the request needs name as text"),
    ({"name": 5}, 400, "the request needs name as text"),
    ({"name": "Acme", "aliases": "ACME"}, 400, "the request needs aliases as a list of text"),
    ({"name": "Acme", "aliases": [1]}, 400, "the request needs aliases as a list of text"),
    ({"name": "Acme", "cik": 320193}, 400, "the request needs cik as text or null"),
    ({"name": "Acme", "libraryKey": []}, 400, "the request needs libraryKey as text or null"),
    ({"name": "Acme", "cik": "320193"}, 400, "a CIK is 10 digits, such as 0000320193"),
    ({"name": "GE"}, 400, "'GE' cannot be matched: each of its words is shorter than 3 letters"),
    ({"name": "x" * 81}, 400, "an issuer's name is at most 80 characters of plain text"),
    ({"name": "Acme", "aliases": ["\ud800ab"]}, 400, "aliases holds a character that is not"),
]


@pytest.mark.parametrize(("body", "status", "words"), BAD)
def test_an_issuer_that_is_not_accepted_says_why_and_stores_nothing(svc, root, body, status, words):
    got, _, reply = svc.call("POST", "/api/issuers", body=body, cookie=cookie(WRITER))
    assert got == status and reply["error"].startswith(words), reply
    assert rows(root, "SELECT COUNT(*) FROM issuers") == [(0,)]


def test_a_taken_phrase_or_cik_and_the_limit_are_conflicts(svc):
    svc.call("POST", "/api/issuers", body=ACME, cookie=cookie(WRITER))
    for body, words in (
        ({"name": "acme corp"}, "'acme corp' is already the name or an alias"),
        ({"name": "Other", "cik": "0000320193"}, "the CIK 0000320193 is already"),
    ):
        status, _, reply = svc.call("POST", "/api/issuers", body=body, cookie=cookie(WRITER))
        assert status == 409 and reply["error"].startswith(words), reply
    for number in range(99):
        body = {"name": f"Issuer number {number}"}
        assert svc.call("POST", "/api/issuers", body=body, cookie=cookie(WRITER))[0] == 200
    status, _, reply = svc.call(
        "POST", "/api/issuers", body={"name": "Last"}, cookie=cookie(WRITER)
    )
    assert status == 409 and "100 issuers" in reply["error"]


def test_a_body_over_64_kib_is_refused(svc):
    big = {"name": "Acme", "aliases": ["a" * 70000]}
    assert svc.call("POST", "/api/issuers", body=big, cookie=cookie(WRITER))[0] == 413


def test_an_id_the_route_pattern_does_not_take_is_not_found(svc):
    for path in ("/api/issuers/abc/edit", "/api/issuers/-1", "/api/issuers/1234567890123456789"):
        method, body = ("POST", ACME) if path.endswith("edit") else ("DELETE", None)
        assert svc.call(method, path, body=body, cookie=cookie(WRITER))[0] == 404


def test_hostile_text_is_stored_and_returned_as_plain_data(svc):
    hostile = {
        "name": '<img src=x onerror="alert(1)">',
        "aliases": ["'; DROP TABLE issuers; --"],
        "libraryKey": "javascript:alert(1)",
    }
    assert svc.call("POST", "/api/issuers", body=hostile, cookie=cookie(WRITER))[0] == 200
    held = snapshot(svc, READER, "?format=2")["settings"]["issuers"][0]
    assert held["name"] == hostile["name"] and held["aliases"] == hostile["aliases"]
    assert held["libraryKey"] == "javascript:alert(1)"  # text: the page decides what a link is


def test_format_one_carries_no_issuer_data(svc):
    svc.call("POST", "/api/issuers", body=ACME, cookie=cookie(WRITER))
    svc.call("POST", "/api/issuers/1/follow", cookie=cookie(READER))
    plain = snapshot(svc, READER)
    assert "issuers" not in plain["channels"] and "issuers" not in plain["feed"]
    assert "issuers" not in plain["settings"] and "filings" not in plain["settings"]
    assert all(source["kind"] != "Filings" for source in plain["settings"]["sources"])
    assert snapshot(svc, READER, "?format=1") == plain


def test_a_format_or_issuer_focus_that_is_not_accepted_is_400(svc):
    for query in ("?format=3", "?format=", "?format=two", "?format=2&issuer=x"):
        status, _, reply = svc.call("GET", "/api/snapshot" + query, cookie=cookie(READER))
        assert status == 400, query
        assert reply["error"] in ("format must be 1 or 2", "issuer must be an id: digits only")


def test_an_edit_keeps_every_field_its_body_leaves_out_and_null_takes_one_off(svc, root):
    """Review finding 7: an edit from a page that never sent `cik` paused an approved feed."""
    assert svc.call("POST", "/api/issuers", body=ACME, cookie=cookie(WRITER))[0] == 200
    db = store.open_db(root)
    store.set_source_state(db, 1, "approved")
    db.close()
    status, _, reply = svc.call(
        "POST", "/api/issuers/1/edit", body={"name": "Acme Holdings"}, cookie=cookie(WRITER)
    )
    assert (status, reply) == (200, {"id": "1"})
    assert rows(root, "SELECT name, aliases, cik, library_key, source_id FROM issuers") == [
        ("Acme Holdings", '["ACME"]', "0000320193", "id:acme", 1)
    ]
    assert rows(root, "SELECT name, state FROM sources") == [
        ("Acme Holdings filings (SEC)", "approved")
    ]
    off = {"name": "Acme Holdings", "aliases": [], "libraryKey": None}
    assert svc.call("POST", "/api/issuers/1/edit", body=off, cookie=cookie(WRITER))[0] == 200
    assert rows(root, "SELECT aliases, cik, library_key FROM issuers") == [
        ("[]", "0000320193", None)
    ]
    cik_off = {"name": "Acme Holdings", "cik": None}
    assert svc.call("POST", "/api/issuers/1/edit", body=cik_off, cookie=cookie(WRITER))[0] == 200
    assert rows(root, "SELECT cik, source_id FROM issuers") == [(None, None)]
    assert rows(root, "SELECT state FROM sources") == [("paused",)]  # it was approved
    no_name = svc.call("POST", "/api/issuers/1/edit", body={"cik": None}, cookie=cookie(WRITER))
    assert no_name[0] == 400
