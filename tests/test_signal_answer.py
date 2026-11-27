"""``service.answer`` called directly over a seeded store: no socket, no server, no loop.

What the transport checks before a request reaches Signal (``Host``, ``Origin``, the body's
length) is not ``answer``'s and is not tested here. The ``ask`` helper returns the reply whether
``answer`` returned it or raised it, because a transport must handle both. Expected values are
written by hand.
"""

from __future__ import annotations

import sqlite3
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import Any, cast

import pytest
from test_signal_feedview import build_feed_db

from deploy_workflow.accounts.store import Account
from deploy_workflow.http_base import Reply
from deploy_workflow.signal import ai_gate, service, store
from deploy_workflow.signal.routing import Incoming

READER = Account(
    id=1,
    tenant_id="00000000-0000-4000-8000-000000000001",
    object_id="00000000-0000-4000-8000-000000000002",
    display_name="Reader",
    email="reader@example.org",
    given_name=None,
    family_name=None,
    profile_type="reader",
    created_at=datetime(2026, 11, 26),
    disabled=False,
)
WRITER = Account(
    id=2,
    tenant_id=READER.tenant_id,
    object_id="00000000-0000-4000-8000-000000000003",
    display_name="Writer",
    email="writer@example.org",
    given_name=None,
    family_name=None,
    profile_type="analyst",
    created_at=datetime(2026, 11, 26),
    disabled=False,
)


def _no_body() -> dict[str, Any]:
    raise AssertionError("this request's body was not to be read")


def ask(
    root: Path, method: str, target: str, *, account: Account | None = None, body: Any = None
) -> Reply:
    """The reply `answer` returns or raises (a refusal is raised) for `target`, a path with an
    optional ``?query``, with no background loop."""

    def given() -> dict[str, Any]:
        return _no_body() if body is None else body

    path, _, query = target.partition("?")
    request = Incoming(
        method,
        path,
        query,
        account,
        body=given,
        optional_body=lambda: {} if body is None else body,
    )
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
    real = store.open_db

    def recording(folder: Path) -> sqlite3.Connection:
        found.append(real(folder))
        return found[-1]

    monkeypatch.setattr(store, "open_db", recording)
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
    named = ask(root, "GET", "/api/me", account=READER)
    assert (named.status, named.body) == (200, {"name": "Reader", "role": "reader"})


def test_route_reads_its_path_group_query_and_body(root: Path) -> None:
    saved = ask(root, "POST", "/api/stories/5/save", account=READER)
    assert (saved.status, saved.body) == (200, {"saved": True})
    count = ask(root, "GET", "/api/feed/new?view=latest&after=30", account=READER)
    assert (count.status, count.body) == (200, {"count": 6})  # stories 31 to 36
    retired = ask(root, "POST", "/api/me", account=READER, body={"name": "Forged"})
    assert (retired.status, retired.body) == (405, {"error": "method not allowed"})
    assert retired.headers == {"Allow": "GET"}
    assert "Set-Cookie" not in retired.headers


def test_unknown_path_is_404_and_opens_no_connection(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    for path in ("/nowhere", "/", "/api", "/api/me/", "/api/me/x", "/signal/api/me", "/API/me"):
        reply = ask(root, "GET", path, account=READER)
        assert (reply.status, reply.body) == (404, {"error": "not found"}), path
    assert opened == []


def test_known_path_with_another_method_is_405_with_allow(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    expected = {
        ("DELETE", "/api/me"): "GET",
        ("POST", "/api/me"): "GET",
        ("PUT", "/api/me"): "GET",
        ("POST", "/api/status"): "GET",
        ("POST", "/api/feed"): "GET",
        ("GET", "/api/stories/5/save"): "POST, DELETE",
        ("GET", "/api/topics/1/follow"): "POST, DELETE",
    }
    for (method, path), allow in expected.items():
        reply = ask(root, method, path, account=READER)
        assert (reply.status, reply.body) == (405, {"error": "method not allowed"}), (method, path)
        assert reply.headers == {"Allow": allow}, (method, path)
    assert opened == []


def test_route_that_needs_a_name_is_401_without_one(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    refusal = {"error": "sign in first"}
    for method, path in (
        ("GET", "/api/feed"),
        ("GET", "/api/topics"),
        ("POST", "/api/stories/5/save"),
        ("DELETE", "/api/topics/1/follow"),
    ):
        reply = ask(root, method, f"{path}?view=latest")
        assert (reply.status, reply.body) == (401, refusal), (method, path)
    assert len(opened) == 4
    assert all(_is_closed(db) for db in opened)
    # Nothing was saved by the refused requests.
    count = ask(root, "GET", "/api/feed/new?view=saved&after=0", account=READER)
    assert count.body == {"count": 0}


def test_connection_is_closed_after_the_handler_returns_or_refuses(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    assert ask(root, "GET", "/api/me").status == 200
    assert ask(root, "GET", "/api/feed", account=READER).status == 400  # the handler wants ?view
    assert ask(root, "POST", "/api/topics/99/follow", account=READER).status == 404
    assert len(opened) == 3
    assert all(_is_closed(db) for db in opened)


def test_connection_is_closed_after_the_handler_raises(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    seen: list[sqlite3.Connection] = []

    def broken() -> dict[str, Any]:
        (db,) = opened
        seen.append(db)
        assert db.execute("SELECT 1").fetchone()[0] == 1  # open while the handler runs
        raise RuntimeError("the handler fell over")

    request = Incoming("POST", "/api/topics", "", WRITER, body=broken, optional_body=_no_body)
    with pytest.raises(RuntimeError, match="the handler fell over"):
        service.answer(root, None, request)
    assert len(seen) == 1
    assert len(opened) == 1
    assert opened[0] is seen[0]
    assert _is_closed(opened[0])


class _FailedLoop:
    """A background loop whose ingest pass last failed with "x"; its AI pass is off."""

    last_error: str | None = "x"
    ai_error: str | None = None
    digest_error: str | None = None
    market_error: str | None = None
    logo_error: str | None = None

    def ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status:
        raise AssertionError("/api/status shows the held status")

    def shown_ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status:
        return cast(ai_gate.Status, _OffStatus())


class _OffStatus:
    state = "off"
    last_problem = None


def test_handler_is_given_the_loop(root: Path) -> None:
    request = Incoming("GET", "/api/status", "", None, body=_no_body, optional_body=_no_body)
    reply = service.answer(root, _FailedLoop(), request)
    assert reply.status == 200
    assert reply.body["loop_error"] == "x"
    assert reply.body["ai_state"] == "off"


def test_query_that_cannot_be_read_is_400_before_a_connection_is_opened(
    root: Path, opened: list[sqlite3.Connection]
) -> None:
    reply = ask(root, "GET", "/api/me?" + "&".join(f"p{n}=1" for n in range(21)))
    assert (reply.status, reply.body) == (400, {"error": "the query string is not valid"})
    assert opened == []


def test_a_5000_character_search_text_reaches_the_handler_and_is_answered(root: Path) -> None:
    # The application caps a query at 512 bytes, so only a direct call carries this far.
    for q in ['"', "*", "NEAR(", "%00", "a" * 5000]:
        target = "/api/feed?view=latest&q=" + urllib.parse.quote(q)
        assert ask(root, "GET", target, account=READER).status == 200
