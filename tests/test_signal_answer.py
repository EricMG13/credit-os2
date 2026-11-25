"""``service.answer`` called directly over a seeded store: no socket, no server, no loop.

What the transport checks before a request reaches Signal (``Host``, ``Origin``, the body's
length) is not ``answer``'s and is not tested here. Expected values are written by hand.
"""

from __future__ import annotations

import re
import sqlite3
from pathlib import Path
from typing import Any

import pytest
from test_signal_feedview import build_feed_db

from deploy_workflow.http_base import Reply
from deploy_workflow.signal import service
from deploy_workflow.signal.routing import Req, Request, Route

READER = "signal_name=Reader"


def _no_body() -> dict[str, Any]:
    raise AssertionError("this request's body was not to be read")


def ask(
    root: Path, method: str, target: str, *, cookie: str | None = None, body: Any = None
) -> Reply:
    """The reply `answer` returns or raises (a refusal is raised) for `target`, a path with an
    optional ``?query``, with no background loop."""

    def given() -> dict[str, Any]:
        return _no_body() if body is None else body

    path, _, query = target.partition("?")
    request = Request(method, path, query, cookie, body=given, optional_body=lambda: body or {})
    try:
        return service.answer(root, None, request)
    except Reply as refusal:
        return refusal


@pytest.fixture
def root(tmp_path: Path) -> Path:
    build_feed_db(tmp_path).close()
    return tmp_path


@pytest.fixture
def opened(monkeypatch: pytest.MonkeyPatch) -> list[sqlite3.Connection]:
    """Every connection the service opens while the test runs."""
    found: list[sqlite3.Connection] = []
    real = service.store.open_db

    def recording(folder: Path) -> sqlite3.Connection:
        found.append(real(folder))
        return found[-1]

    monkeypatch.setattr(service.store, "open_db", recording)
    return found


def _is_closed(db: sqlite3.Connection) -> bool:
    try:
        db.execute("SELECT 1")
    except sqlite3.ProgrammingError:  # "Cannot operate on a closed database."
        return True
    return False


def test_known_route_answers_for_the_asking_user(root: Path) -> None:
    nobody = ask(root, "GET", "/api/me")
    assert (nobody.status, nobody.body, nobody.headers) == (200, {"name": None}, {})
    named = ask(root, "GET", "/api/me", cookie=READER)
    assert (named.status, named.body) == (200, {"name": "Reader", "role": "reader"})


def test_route_reads_its_path_group_query_and_body(root: Path) -> None:
    saved = ask(root, "POST", "/api/stories/5/save", cookie=READER)
    assert (saved.status, saved.body) == (200, {"saved": True})
    count = ask(root, "GET", "/api/feed/new?view=latest&after=30", cookie=READER)
    assert (count.status, count.body) == (200, {"count": 6})  # stories 31 to 36
    chosen = ask(root, "POST", "/api/me", body={"name": "  A.  Kovac "})
    assert (chosen.status, chosen.body) == (200, {"name": "A. Kovac", "role": "reader"})
    assert chosen.headers["Set-Cookie"].startswith("signal_name=")


def test_unknown_path_is_404_and_opens_no_connection(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    for path in ("/nowhere", "/", "/api", "/api/me/", "/api/me/x", "/signal/api/me", "/API/me"):
        reply = ask(root, "GET", path, cookie=READER)
        assert (reply.status, reply.body) == (404, {"error": "not found"}), path
    assert opened == []


def test_known_path_with_another_method_is_405_with_allow(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    expected = {
        ("DELETE", "/api/me"): "GET, POST",
        ("PUT", "/api/me"): "GET, POST",
        ("POST", "/api/status"): "GET",
        ("POST", "/api/feed"): "GET",
        ("GET", "/api/stories/5/save"): "POST, DELETE",
        ("GET", "/api/topics/1/follow"): "POST, DELETE",
    }
    for (method, path), allow in expected.items():
        reply = ask(root, method, path, cookie=READER)
        assert (reply.status, reply.body) == (405, {"error": "method not allowed"}), (method, path)
        assert reply.headers == {"Allow": allow}, (method, path)
    assert opened == []


def test_route_that_needs_a_name_is_401_without_one(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    refusal = {"error": "choose a display name first"}
    for method, path in (
        ("GET", "/api/feed"),
        ("GET", "/api/topics"),
        ("POST", "/api/stories/5/save"),
        ("DELETE", "/api/topics/1/follow"),
    ):
        for cookie in (None, "", "other=1", "signal_name="):
            reply = ask(root, method, f"{path}?view=latest", cookie=cookie)
            assert (reply.status, reply.body) == (401, refusal), (method, path, cookie)
    assert len(opened) == 16
    assert all(_is_closed(db) for db in opened)
    # Nothing was saved by the refused requests.
    count = ask(root, "GET", "/api/feed/new?view=saved&after=0", cookie=READER)
    assert count.body == {"count": 0}


def test_connection_is_closed_after_the_handler_returns_or_refuses(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    assert ask(root, "GET", "/api/me").status == 200
    assert ask(root, "GET", "/api/feed", cookie=READER).status == 400  # the handler wants ?view
    assert ask(root, "POST", "/api/topics/99/follow", cookie=READER).status == 404
    assert len(opened) == 3
    assert all(_is_closed(db) for db in opened)


def test_connection_is_closed_after_the_handler_raises(
    root: Path, opened: list[sqlite3.Connection], monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[Req] = []

    def broken(req: Req) -> Reply:
        seen.append(req)
        assert req.db.execute("SELECT 1").fetchone()[0] == 1  # open while the handler runs
        raise RuntimeError("the handler fell over")

    routes = (Route("GET", re.compile("/api/broken"), broken, open_to_all=True),)
    monkeypatch.setattr(service, "_ROUTES", routes)
    request = Request("GET", "/api/broken", "", None, body=_no_body, optional_body=_no_body)
    with pytest.raises(RuntimeError, match="the handler fell over"):
        service.answer(root, None, request)
    assert len(seen) == 1
    assert len(opened) == 1
    assert opened[0] is seen[0].db
    assert _is_closed(opened[0])


def test_query_that_cannot_be_read_is_400_before_a_connection_is_opened(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    reply = ask(root, "GET", "/api/me?" + "&".join(f"p{n}=1" for n in range(21)))
    assert (reply.status, reply.body) == (400, {"error": "the query string is not valid"})
    assert opened == []
