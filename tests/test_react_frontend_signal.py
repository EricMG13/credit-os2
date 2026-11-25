"""Signal hosted by the React application's server (react_frontend/signal_host.py), run for real.

One process: each test starts the application's own server on a loopback port over a temporary
shared folder and talks to ``/signal/api/*`` through that port; Signal's store is the one under
that folder. No test starts Signal's background loop against the network: ``make_server`` starts no
thread at all, and the tests of ``serve`` replace the loop's pass with a recorder. SYNTHETIC where
the AI pass is concerned: the environments, the ruling folder and the model factory are fakes
written here; no key is real and no model is built or called. Expected values are written by hand,
never computed from the code under test.
"""

import dataclasses
import gzip
import json
import logging
import os
import socket
import sqlite3
import sys
import threading
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from datetime import UTC, datetime
from decimal import Decimal
from http.client import HTTPConnection
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import pytest
from signal_ai_fakes import FakeModel, write_ruling
from signal_ai_fakes import environ as key_environ

import react_frontend
from deploy_workflow.signal import ai_ledger, ai_run, feedview, store, topics
from deploy_workflow.signal import service as signal_service
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.fetch import Fetched
from react_frontend import Server, make_server, signal_host

NOW = datetime(2026, 11, 13, 10, 0, tzinfo=UTC)
DANA = {"Cookie": "unrelated=1; signal_name=Dana%20Reyes; other=2"}
POLICY = "default-src 'none'; frame-ancestors 'none'"
NO_KEY = (
    "The service was started without the provider's key: COPILOT_GITHUB_TOKEN"
    " (or COPILOT_USE_GH_LOGIN=1) is not set."
)
NO_RUNTIME = (
    "The service was started without COPILOT_CLI_PATH naming the Copilot runtime"
    " (an absolute path to an existing file)."
)


@pytest.fixture
def web(tmp_path: Path) -> Path:
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text(
        '<html><head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'">'
        "</head><body></body></html>",
        encoding="utf-8",
    )
    return tmp_path


@pytest.fixture
def root() -> Iterator[Path]:
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp") as name:
        yield Path(name)


def seed(root: Path) -> None:
    """One approved source with one story, and one topic. No loop runs, so nothing is fetched."""
    db = store.open_db(root)
    source = store.propose_source(db, "Authority", "regulator", "https://a.org/feed", "owner")
    store.set_source_state(db, source, "approved")
    entry = Entry("Remedy accepted by the regulator", "https://a.org/1", None, "A remedy.")
    assert store.add_story(db, source, entry, datetime(2026, 11, 13, 9, 0, tzinfo=UTC)) == "new"
    assert topics.add_topic(db, "Remedy", ["remedy"], [], "owner") == 1
    db.close()


@pytest.fixture
def seeded(root: Path) -> Path:
    seed(root)
    return root


@contextmanager
def react(
    root: Path,
    web: Path,
    *,
    read_only: bool = False,
    synthetic: bool = False,
    environ: Mapping[str, str] | None = None,
) -> Iterator[Server]:
    """The application's server, serving. Its Signal environment is empty unless one is given, so
    no test depends on what the machine running it has set."""
    launcher = ("unused-by-test",) if synthetic else None
    with make_server(
        root,
        web=web,
        read_only=read_only,
        synthetic=synthetic,
        launcher=launcher,
        environ={} if environ is None else environ,
    ) as server:
        thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.02})
        thread.start()
        try:
            yield server
        finally:
            server.shutdown()
            thread.join()


def call(
    server: Server,
    path: str,
    method: str = "GET",
    *,
    headers: Mapping[str, str | None] | None = None,
    body: bytes | str | None = None,
) -> tuple[int, bytes, list[tuple[str, str]]]:
    """One request to the application. A write carries the page's own Origin; a header given as
    None is left out, so ``{"Origin": None}`` sends a write with no Origin."""
    port = server.server_address[1]
    sent: dict[str, str | None] = {"Origin": f"http://127.0.0.1:{port}"} if method != "GET" else {}
    sent.update(headers or {})
    wire = {key: value for key, value in sent.items() if value is not None}
    connection = HTTPConnection("127.0.0.1", port, timeout=20)
    try:
        connection.request(method, path, headers=wire, body=body)
        reply = connection.getresponse()
        return reply.status, reply.read(), reply.getheaders()
    finally:
        connection.close()


def raw_call(server: Server, data: bytes, *, half_close: bool = False) -> bytes:
    """Whatever the server answers to these exact bytes."""
    with socket.create_connection(("127.0.0.1", server.server_address[1]), timeout=10) as sock:
        sock.sendall(data)
        if half_close:
            sock.shutdown(socket.SHUT_WR)
        chunks = []
        while chunk := sock.recv(65536):
            chunks.append(chunk)
    return b"".join(chunks)


def raw_post(server: Server, path: str, extra: str = "", body: str = "") -> bytes:
    """A POST from the page's own origin as these exact bytes: no header the test did not write."""
    port = server.server_address[1]
    head = f"Host: 127.0.0.1:{port}\r\nOrigin: http://127.0.0.1:{port}\r\n"
    return raw_call(server, f"POST {path} HTTP/1.1\r\n{head}{extra}\r\n{body}".encode())


def status_line(reply: bytes) -> bytes:
    return reply.split(b"\r\n")[0]


def json_of(reply: bytes) -> Any:
    return json.loads(reply.partition(b"\r\n\r\n")[2])


def header(headers: list[tuple[str, str]], name: str) -> str | None:
    found = [value for key, value in headers if key.lower() == name.lower()]
    assert len(found) <= 1, (name, found)
    return found[0] if found else None


def rows(folder: Path, sql: str) -> list[tuple[object, ...]]:
    db = store.open_db(folder)
    try:
        return [tuple(row) for row in db.execute(sql).fetchall()]
    finally:
        db.close()


# -- what a reader depends on --------------------------------------------------------------------


def test_name_round_trip_and_writes_reach_the_store_through_the_applications_port(
    seeded: Path, web: Path
) -> None:
    with react(seeded, web) as server:
        status, body, headers = call(server, "/signal/api/me")
        assert (status, json.loads(body)) == (200, {"name": None})
        assert header(headers, "Cache-Control") == "no-store"
        assert header(headers, "Content-Type") == "application/json; charset=utf-8"
        assert header(headers, "Set-Cookie") is None

        status, body, headers = call(
            server, "/signal/api/me", "POST", body=json.dumps({"name": "Dana  Reyes"})
        )
        assert (status, json.loads(body)) == (200, {"name": "Dana Reyes", "role": "reader"})
        assert header(headers, "Set-Cookie") == (
            "signal_name=Dana%20Reyes; Path=/; Max-Age=31536000; SameSite=Strict; HttpOnly"
        )
        status, body, _ = call(server, "/signal/api/me", headers=DANA)
        assert (status, json.loads(body)) == (200, {"name": "Dana Reyes", "role": "reader"})

        # A page that is not Signal's is refused by Signal's own 401, status and text intact.
        status, body, _ = call(server, "/signal/api/topics")
        assert (status, json.loads(body)) == (401, {"error": "choose a display name first"})

        status, body, _ = call(server, "/signal/api/stories/1/save", "POST", headers=DANA)
        assert (status, json.loads(body)) == (200, {"saved": True})
        assert rows(seeded, "SELECT user_name, story_id FROM saves") == [("Dana Reyes", 1)]
        status, body, _ = call(server, "/signal/api/stories/1/save", "DELETE", headers=DANA)
        assert (status, json.loads(body)) == (200, {"saved": False})
        assert rows(seeded, "SELECT user_name, story_id FROM saves") == []

        status, body, _ = call(server, "/signal/api/topics/1/follow", "POST", headers=DANA)
        assert (status, json.loads(body)) == (200, {"following": True})
        assert rows(seeded, "SELECT user_name, topic_id FROM topic_follows") == [("Dana Reyes", 1)]
        status, body, _ = call(server, "/signal/api/topics", headers=DANA)
        assert status == 200
        assert json.loads(body) == [{"id": 1, "name": "Remedy", "following": True, "stories": 1}]
        status, body, _ = call(server, "/signal/api/stories/99/save", "POST", headers=DANA)
        assert status == 404 and json.loads(body)["error"]
        status, body, _ = call(server, "/signal/api/status")
        assert status == 200
        assert json.loads(body) == {
            "last_pass_at": None,  # make_server started no loop: no pass has run
            "sources": {"approved": 1, "failing": 0},
            "loop_error": None,
            "ai_state": "off",
            "ai_last_problem": None,
        }


def test_the_snapshot_is_served_for_a_named_reader(seeded: Path, web: Path) -> None:
    with react(seeded, web) as server:
        status, body, _ = call(server, "/signal/api/snapshot", headers=DANA)
        assert status == 200
        document = json.loads(body)
        assert "Remedy accepted by the regulator" in body.decode("utf-8")
        assert isinstance(document["scenes"], list) and document["asOf"].startswith("20")
        status, body, _ = call(server, "/signal/api/snapshot?format=3", headers=DANA)
        assert (status, json.loads(body)) == (400, {"error": "format must be 1 or 2"})


NEEDS_NAME = "choose a display name first"
# Each of Signal's own routes, asked with no name: what only Signal's route table answers.
REACHING = [
    ("GET", "/signal/api/snapshot", 200, None),
    ("GET", "/signal/api/me", 200, None),
    ("POST", "/signal/api/me", 400, "the request body is not valid JSON"),  # a POST of no bytes
    ("GET", "/signal/api/status", 200, None),
    ("GET", "/signal/api/feed", 401, NEEDS_NAME),
    ("GET", "/signal/api/feed/new", 401, NEEDS_NAME),
    ("GET", "/signal/api/topics", 401, NEEDS_NAME),
    ("POST", "/signal/api/stories/12/save", 401, NEEDS_NAME),
    ("DELETE", "/signal/api/stories/12/save", 401, NEEDS_NAME),
    ("POST", "/signal/api/topics/3/follow", 401, NEEDS_NAME),
    ("DELETE", "/signal/api/topics/3/follow", 401, NEEDS_NAME),
]


def test_the_service_routes_answer_under_the_signal_prefix(seeded: Path, web: Path) -> None:
    with react(seeded, web) as server:
        for method, path, expected, error in REACHING:
            status, body, _ = call(server, path, method)
            assert status == expected, (method, path)
            if error is not None:
                assert json.loads(body) == {"error": error}, (method, path)


REFUSED_PATHS = [
    "/signal/api",
    "/signal/api/",
    "/signal/apix",
    "/signal/api/..",
    "/signal/api/../me",
    "/signal/api/a/../me",
    "/signal/api/./me",
    "/signal/api/%2e%2e/me",
    "/signal/api/%2E%2E%2Fme",
    "/signal/api/%6De",
    "/signal/api/me%00",
    "/signal/api/me%0d%0aX-Evil:%201",
    "/signal/api/me/",
    "/signal/api//me",
    "/signal/api/me//",
    "/signal/api/Me",
    "/signal/api/me.json",
    "/signal/api/me;x=1",
    "/signal/api/me%5Cx",
    "/signal/api/me\\x",
    "/signal/api/m%20e",
    "/signal/api/m%C3%A9",
    "/signal/api/" + "a" * 200,
    "/signal/api/" + "a/" * 70 + "a",
    "//evil.test/signal/api/me",
    "//127.0.0.1:1/signal/api/me",
    "/signal/%61pi/me",
    "/%73ignal/api/me",
    "/signal/api%2Fme",
]


@pytest.mark.parametrize("path", REFUSED_PATHS)
def test_a_path_that_is_no_route_is_404_for_every_method(
    seeded: Path, web: Path, path: str
) -> None:
    with react(seeded, web) as server:
        for method in ("GET", "POST", "DELETE"):
            assert call(server, path, method, headers=DANA)[0] == 404, method


def test_an_absolute_target_is_refused_by_the_base_checks(seeded: Path, web: Path) -> None:
    with react(seeded, web) as server:
        port = server.server_address[1]
        data = f"GET http://evil.test/signal/api/me HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n\r\n"
        assert raw_call(server, data.encode()).startswith(b"HTTP/1.0 400")


@pytest.mark.parametrize("method", ["PUT", "PATCH", "OPTIONS", "HEAD"])
def test_other_methods_are_405_where_signal_is_hosted(seeded: Path, web: Path, method: str) -> None:
    with react(seeded, web) as server:
        status, body, headers = call(server, "/signal/api/me", method)
        assert status == 405
        assert header(headers, "Allow") == "GET, POST"  # the methods /api/me has
        assert body == (b"" if method == "HEAD" else b'{"error": "method not allowed"}')
        status, _, headers = call(server, "/signal/api/stories/1/save", method)
        assert (status, header(headers, "Allow")) == (405, "POST, DELETE")
        assert call(server, "/signal/api/Nothing", method)[0] == 404
        assert call(server, "/signal/api/me", method, headers={"Origin": None})[0] == 403
        assert call(server, "/start", method)[0] == 501  # the rest of the server is unchanged


@pytest.mark.parametrize("method", ["PUT", "PATCH", "OPTIONS", "HEAD"])
def test_other_methods_with_a_body_are_405_all_the_same(
    seeded: Path, web: Path, method: str
) -> None:
    """The route table decides before any body rule: a body changes nothing, and is not read."""
    with react(seeded, web) as server:
        sent = b'{"name": "Dana"}'
        status, body, headers = call(server, "/signal/api/me", method, body=sent)
        assert (status, header(headers, "Allow")) == (405, "GET, POST")
        assert body == (b"" if method == "HEAD" else b'{"error": "method not allowed"}')
        status, _, headers = call(
            server, "/signal/api/stories/1/save", method, headers=DANA, body=sent
        )
        assert (status, header(headers, "Allow")) == (405, "POST, DELETE")
        assert call(server, "/signal/api/Nothing", method, body=sent)[0] == 404
        # Nor is its length read: one past the limit, or one that is no length, is 405 too.
        for length in ("65537", "many", "-1"):
            declared = {"Content-Length": length}
            status, _, headers = call(server, "/signal/api/me", method, headers=declared)
            assert (status, header(headers, "Allow")) == (405, "GET, POST"), length
        assert rows(seeded, "SELECT COUNT(*) FROM saves") == [(0,)]


@pytest.mark.parametrize("path", ["/signal/api", "/signal/api/"])
@pytest.mark.parametrize("method", ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS", "HEAD"])
def test_the_api_root_is_404_for_every_method_with_or_without_a_slash(
    seeded: Path, web: Path, path: str, method: str
) -> None:
    with react(seeded, web) as server:
        assert call(server, path, method)[0] == 404


# -- the application's own checks come first -----------------------------------------------------


@pytest.mark.parametrize("method", ["POST", "DELETE"])
def test_a_write_needs_the_pages_own_origin(seeded: Path, web: Path, method: str) -> None:
    db = store.open_db(seeded)
    feedview.save(db, "Dana Reyes", 1)  # so a DELETE that got through would be seen too
    db.close()
    before = [("Dana Reyes", 1)]
    with react(seeded, web) as server:
        path = "/signal/api/stories/1/save"
        port = server.server_address[1]
        refused = [
            {"Origin": None},
            {"Origin": "http://evil.test"},
            {"Origin": f"http://localhost:{port + 1}"},
            {"Origin": "null"},
            {"Sec-Fetch-Site": "cross-site"},
            {"Sec-Fetch-Site": "same-site"},
        ]
        for sent in refused:
            assert call(server, path, method, headers={**DANA, **sent})[0] == 403, sent
        _, body, _ = call(server, path, method, headers={**DANA, "Origin": None})
        assert json.loads(body) == {"error": "the request did not come from the service's own page"}
        assert rows(seeded, "SELECT user_name, story_id FROM saves") == before  # nothing changed
        assert call(server, path, method, headers=DANA)[0] == 200  # the page's own origin passes


def test_a_foreign_host_name_is_refused_before_signal_answers(seeded: Path, web: Path) -> None:
    """DNS rebinding: a page on evil.test that resolves to this machine sends Host: evil.test."""
    with react(seeded, web) as server:
        port = server.server_address[1]
        for host in ("evil.test", f"evil.test:{port}", f"127.0.0.1:{port + 1}"):
            for method in ("GET", "POST"):
                headers = {"Host": host, "Origin": f"http://{host}"}
                assert call(server, "/signal/api/me", method, headers=headers)[0] == 403
        status, body, _ = call(server, "/signal/api/me", headers={"Host": "evil.test"})
        assert (status, json.loads(body)) == (
            403,
            {"error": "this address is not the one the service was started on"},
        )
        status, body, _ = call(server, "/signal/api/me", headers={"Sec-Fetch-Site": "cross-site"})
        assert (status, json.loads(body)) == (
            403,
            {"error": "the request came from another site"},
        )
        assert call(server, "/signal/api/me", headers={"Origin": "http://evil.test"})[0] == 403
        assert call(server, "/signal/api/me", headers={"Host": f"localhost:{port}"})[0] == 200


def test_the_checks_run_before_any_signal_handler(
    seeded: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    asked: list[str] = []
    real = signal_service.answer

    def recording(folder: Path, loop: Any, request: Any) -> Any:
        asked.append(f"{request.method} {request.path}")
        return real(folder, loop, request)

    monkeypatch.setattr(signal_service, "answer", recording)
    with react(seeded, web) as server:
        assert call(server, "/signal/api/me", headers={"Host": "evil.test"})[0] == 403
        assert call(server, "/signal/api/me", "POST", headers={"Origin": None})[0] == 403
        assert call(server, "/signal/api/me", headers={"Sec-Fetch-Site": "cross-site"})[0] == 403
        chunked = raw_post(server, "/signal/api/me", "Transfer-Encoding: chunked\r\n", "0\r\n\r\n")
        assert b" 411 " in status_line(chunked)
        assert asked == []
        assert call(server, "/signal/api/me")[0] == 200
        assert asked == ["GET /api/me"]  # the prefix is dropped for Signal's route table


# -- the body rules ------------------------------------------------------------------------------


def test_a_body_is_read_on_a_post_only_and_bounded_at_64_kib(seeded: Path, web: Path) -> None:
    with react(seeded, web) as server:
        exact = b'{"name": "Dana", "pad": "' + b"x" * (64 * 1024 - 27) + b'"}'
        assert len(exact) == 64 * 1024
        status, body, _ = call(server, "/signal/api/me", "POST", body=exact)
        assert (status, json.loads(body)) == (200, {"name": "Dana", "role": "reader"})
        status, body, _ = call(server, "/signal/api/me", "POST", body=exact + b" ")
        assert (status, json.loads(body)) == (413, {"error": "a request body is at most 64 KiB"})

        no_body = {"error": "this request takes no body"}
        status, body, _ = call(
            server, "/signal/api/me", "GET", headers={"Content-Length": "2"}, body=b"{}"
        )
        assert (status, json.loads(body)) == (400, no_body)
        status, body, _ = call(
            server, "/signal/api/stories/1/save", "DELETE", headers=DANA, body=b"{}"
        )
        assert (status, json.loads(body)) == (400, no_body)
        assert call(server, "/signal/api/me", headers={"Content-Length": "0"})[0] == 200


def test_a_required_body_needs_content_length_and_an_optional_one_does_not(
    seeded: Path, web: Path
) -> None:
    with react(seeded, web) as server:
        missing = raw_post(server, "/signal/api/me")
        assert b" 411 " in status_line(missing)
        assert json_of(missing) == {"error": "a body needs Content-Length"}
        cookie = "Cookie: signal_name=Dana%20Reyes\r\n"
        saved = raw_post(server, "/signal/api/stories/1/save", cookie)  # this route reads no body
        assert b" 200 " in status_line(saved) and json_of(saved) == {"saved": True}
        status, body, _ = call(server, "/signal/api/stories/1/save", "POST", headers=DANA)
        assert (status, json.loads(body)) == (200, {"saved": True})  # Content-Length: 0


@pytest.mark.parametrize("sent", ["[1]", '"Dana"', "3", "null", "true"])
def test_a_json_body_that_is_not_an_object_is_refused(seeded: Path, web: Path, sent: str) -> None:
    with react(seeded, web) as server:
        status, body, _ = call(server, "/signal/api/me", "POST", body=sent)
        assert (status, json.loads(body)) == (
            400,
            {"error": "the request body must be a JSON object"},
        )


def test_a_body_that_is_not_json_or_ends_early_is_refused(seeded: Path, web: Path) -> None:
    with react(seeded, web) as server:
        not_json = {"error": "the request body is not valid JSON"}
        for sent in (b"{", b"name=Dana", b"\xff\xfe"):
            status, body, _ = call(server, "/signal/api/me", "POST", body=sent)
            assert (status, json.loads(body)) == (400, not_json), sent
        port = server.server_address[1]
        short = (
            f"POST /signal/api/me HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n"
            f"Origin: http://127.0.0.1:{port}\r\nContent-Length: 50\r\n\r\n{{}}"
        )
        early = raw_call(server, short.encode(), half_close=True)
        assert b" 400 " in status_line(early)
        assert json_of(early) == {"error": "the request body ended early"}


def test_a_request_line_cannot_smuggle_a_second_request_or_header(seeded: Path, web: Path) -> None:
    with react(seeded, web) as server:
        port = server.server_address[1]
        head = f"Host: 127.0.0.1:{port}\r\nOrigin: http://127.0.0.1:{port}\r\n"
        smuggled = (
            f"POST /signal/api/me%0d%0aX:y HTTP/1.1\r\n{head}Content-Length: 0\r\n\r\n"
            f"GET /signal/api/me HTTP/1.1\r\n{head}\r\n"
        )
        answered = raw_call(server, smuggled.encode())
        assert b" 404 " in status_line(answered)
        assert answered.count(b"HTTP/1.0 ") == 1  # one request per connection: the second is unread
        chunked = raw_post(server, "/signal/api/me", "Transfer-Encoding: chunked\r\n", "0\r\n\r\n")
        assert b" 411 " in status_line(chunked)
        twice = raw_post(
            server, "/signal/api/me", "Content-Length: 2\r\nContent-Length: 3\r\n", "{}"
        )
        assert b" 400 " in status_line(twice)
        assert json_of(twice) == {"error": "Content-Length is not a length"}


def test_a_query_goes_with_a_get_only_and_only_when_printable_and_short(
    seeded: Path, web: Path
) -> None:
    with react(seeded, web) as server:
        status, body, _ = call(server, "/signal/api/snapshot?format=2&topic=1", headers=DANA)
        assert status == 200 and json.loads(body)["scenes"]
        assert call(server, "/signal/api/snapshot?", headers=DANA)[0] == 200
        # A write's query is not read: a value the same route refuses on a GET changes nothing.
        status, body, _ = call(server, "/signal/api/stories/1/save?format=3", "POST", headers=DANA)
        assert (status, json.loads(body)) == (200, {"saved": True})
        status, _, _ = call(server, "/signal/api/stories/1/save?x=%ff", "DELETE", headers=DANA)
        assert status == 200
        not_valid = {"error": "the query string is not valid"}
        status, body, _ = call(server, "/signal/api/feed?q=" + "a" * 600, headers=DANA)
        assert (status, json.loads(body)) == (400, not_valid)
        port = server.server_address[1]
        for target in (b"/signal/api/feed?q=\xe2\x82\xac", b"/signal/api/feed?q=a\x01b"):
            data = b"GET " + target + b" HTTP/1.1\r\nHost: 127.0.0.1:%d\r\n\r\n" % port
            answered = raw_call(server, data)
            assert answered.startswith(b"HTTP/1.0 400") and json_of(answered) == not_valid


# -- what every Signal reply carries -------------------------------------------------------------


def test_every_signal_reply_carries_the_policy_and_the_frame_refusal(
    seeded: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    with react(seeded, web) as server:
        asked = [
            (200, "GET", "/signal/api/me", {}),
            (200, "POST", "/signal/api/stories/1/save", DANA),
            (401, "GET", "/signal/api/topics", {}),
            (404, "GET", "/signal/api/nothing", {}),
            (404, "GET", "/signal/api", {}),
            (405, "PUT", "/signal/api/me", {}),
            (400, "GET", "/signal/api/snapshot?format=3", {}),
            (403, "POST", "/signal/api/me", {"Origin": "http://evil.test"}),
            (403, "GET", "/signal/api/me", {"Host": "evil.test"}),
        ]
        for expected, method, path, sent in asked:
            status, _, headers = call(server, path, method, headers=sent)
            assert status == expected, (method, path)
            assert header(headers, "Content-Security-Policy") == POLICY, (method, path)
            assert header(headers, "X-Frame-Options") == "DENY", (method, path)
            assert header(headers, "X-Content-Type-Options") == "nosniff", (method, path)
            assert header(headers, "Cross-Origin-Resource-Policy") == "same-origin", (method, path)
            assert header(headers, "Cache-Control") == "no-store", (method, path)

        def broken(folder: Path) -> sqlite3.Connection:
            raise sqlite3.OperationalError("disk I/O error at /secret/place")

        with monkeypatch.context() as patch:
            patch.setattr(store, "open_db", broken)
            status, body, headers = call(server, "/signal/api/me")
        assert (status, json.loads(body)) == (500, {"error": "the service failed; see its log"})
        assert header(headers, "Content-Security-Policy") == POLICY
        assert header(headers, "X-Frame-Options") == "DENY"

        # The rest of the application keeps its own headers.
        status, _, headers = call(server, "/connected/context")
        assert (status, header(headers, "Content-Security-Policy")) == (200, None)
        assert header(headers, "X-Frame-Options") is None
        status, _, headers = call(server, "/signal")
        assert (status, header(headers, "Content-Security-Policy")) == (
            200,
            "frame-ancestors 'none'",
        )
        assert header(headers, "X-Frame-Options") == "DENY"


def raw_headers(reply: bytes) -> list[bytes]:
    """The header lines of a raw reply, lower-cased, in the order sent."""
    return [line.lower() for line in reply.partition(b"\r\n\r\n")[0].split(b"\r\n")[1:]]


# Requests the application's handler never sees: ``http.server`` refuses them and writes the reply.
WRITTEN_BY_HTTP_SERVER = [
    (505, b"GET %b HTTP/9.9\r\n"),  # no such version
    (400, b"GET %b HTTP/1.1 more\r\n"),  # a request line of four words
    (400, b"GET %b HTTP/1.x\r\n"),  # a version that is no number
    (501, b"BREW %b HTTP/1.1\r\n"),  # a method the server has no handler for
    (431, b"GET %b HTTP/1.1\r\nX-Long: " + b"a" * 70000 + b"\r\n"),  # a header line too long
    (414, b"GET %b?" + b"a" * 70000 + b" HTTP/1.1\r\n"),  # a request line too long
]


def test_the_replies_http_server_writes_itself_carry_the_two_headers_under_the_api_only(
    seeded: Path, web: Path
) -> None:
    policy = b"content-security-policy: " + POLICY.encode()
    with react(seeded, web) as server:
        host = b"Host: 127.0.0.1:%d\r\n\r\n" % server.server_address[1]
        for status, request in WRITTEN_BY_HTTP_SERVER:
            answered = raw_call(server, request % b"/signal/api/me" + host)
            assert status_line(answered).split()[1] == str(status).encode(), request[:30]
            sent = raw_headers(answered)
            assert sent.count(policy) == 1, (status, sent)
            assert sent.count(b"x-frame-options: deny") == 1, (status, sent)
            assert len([line for line in sent if line.startswith(b"content-security-")]) == 1
            assert len([line for line in sent if line.startswith(b"x-frame-options")]) == 1
            for target in (b"/start", b"/signal", b"/signal/apix", b"/x?/signal/api/me"):
                answered = raw_call(server, request % target + host)
                assert status_line(answered).split()[1] == str(status).encode(), target
                sent = raw_headers(answered)
                assert not [line for line in sent if line.startswith(b"content-security-")], target
                assert not [line for line in sent if line.startswith(b"x-frame-options")], target
                assert b"x-content-type-options: nosniff" in sent  # the base's own stay


def test_where_no_signal_is_hosted_no_reply_carries_signals_headers(root: Path, web: Path) -> None:
    with react(root, web, read_only=True) as server:
        host = b"Host: 127.0.0.1:%d\r\n\r\n" % server.server_address[1]
        answered = raw_call(server, b"GET /signal/api/me HTTP/9.9\r\n" + host)
        assert status_line(answered).split()[1] == b"505"
        assert not [line for line in raw_headers(answered) if b"content-security" in line]
        status, _, headers = call(server, "/signal/api/me")
        assert (status, header(headers, "Content-Security-Policy")) == (404, None)
        assert header(headers, "X-Frame-Options") is None


def test_a_large_json_reply_is_gzipped_for_a_browser_that_accepts_it(
    seeded: Path, web: Path
) -> None:
    db = store.open_db(seeded)
    for number in range(2, 22):
        assert topics.add_topic(db, f"Topic {number:02d}", [f"word{number}"], [], "owner") == number
    db.close()
    expected = [{"id": 1, "name": "Remedy", "following": False, "stories": 1}]
    expected += [
        {"id": number, "name": f"Topic {number:02d}", "following": False, "stories": 0}
        for number in range(2, 22)
    ]
    with react(seeded, web) as server:
        status, packed, headers = call(
            server, "/signal/api/topics", headers={**DANA, "Accept-Encoding": "gzip"}
        )
        assert status == 200 and header(headers, "Content-Encoding") == "gzip"
        assert header(headers, "Vary") == "Accept-Encoding"
        assert header(headers, "Content-Security-Policy") == POLICY
        assert json.loads(gzip.decompress(packed)) == expected
        status, plain, headers = call(server, "/signal/api/topics", headers=DANA)
        assert (status, json.loads(plain)) == (200, expected)
        assert header(headers, "Content-Encoding") is None


def test_answering_a_request_opens_no_outbound_connection(
    seeded: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    connected: list[Any] = []
    looked_up: list[Any] = []
    real_connect, real_lookup = socket.socket.connect, socket.getaddrinfo

    def connect(self: socket.socket, address: Any, *args: Any) -> Any:
        connected.append(address)
        return real_connect(self, address, *args)

    def lookup(host: Any, *args: Any, **kwargs: Any) -> Any:
        looked_up.append(host)
        return real_lookup(host, *args, **kwargs)

    with react(seeded, web) as server:
        asked = [
            ("GET", "/signal/api/me", None),
            ("POST", "/signal/api/me", '{"name": "Dana Reyes"}'),
            ("GET", "/signal/api/status", None),
            ("GET", "/signal/api/snapshot?format=2", None),
            ("GET", "/signal/api/feed?view=latest", None),
            ("GET", "/signal/api/topics", None),
            ("POST", "/signal/api/stories/1/save", None),
            ("DELETE", "/signal/api/stories/1/save", None),
            ("POST", "/signal/api/topics/1/follow", None),
            ("GET", "/signal/api/logos/1", None),
        ]
        with monkeypatch.context() as patch:
            patch.setattr(socket.socket, "connect", connect)
            patch.setattr(socket, "getaddrinfo", lookup)
            for method, path, body in asked:
                assert call(server, path, method, headers=DANA, body=body)[0] in (200, 404), path
        port = server.server_address[1]
    # The only connections are this test's own ten, to the application's port.
    assert connected == [("127.0.0.1", port)] * 10
    assert set(looked_up) == {"127.0.0.1"}


# -- where Signal is hosted ----------------------------------------------------------------------

META = b'<meta name="credit-os-signal" content="on">'


def test_the_signal_page_and_its_meta_are_served_where_signal_is_hosted(
    seeded: Path, web: Path
) -> None:
    with react(seeded, web) as server:
        assert isinstance(server.signal, signal_host.SignalHost)
        status, home, _ = call(server, "/")
        assert status == 200
        assert home.count(META) == 1 and home.count(b"credit-os-signal") == 1
        assert b'<meta name="credit-os-mode" content="live">' in home
        assert b"credit-os-signal-url" not in home
        for path in ("/signal", "/signal/"):
            status, page, headers = call(server, path)
            assert (status, page) == (200, home)
            assert header(headers, "X-Frame-Options") == "DENY"
            assert header(headers, "Cache-Control") == "no-store"
        assert call(server, "/signal/other")[0] == 404
        assert call(server, "/signal/x/y")[0] == 404
        assert call(server, "/Signal")[0] == 404


def test_no_file_of_the_store_or_the_source_is_served(seeded: Path, web: Path) -> None:
    """The store is under the folder the application serves: no path reaches it, or a module."""
    assert (seeded / "signal" / "signal.db").is_file()
    with react(seeded, web) as server:
        for path in ("/static/x", "/static/signal.js", "/static/brand.css"):
            status, body, headers = call(server, path)
            assert (status, json.loads(body)) == (404, {"error": "not found"}), path
            assert header(headers, "Content-Type") == "application/json; charset=utf-8"
        for path in (
            "/static/../store.py",
            "/static/store.py",
            "/static/%2e%2e/cli.py",
            "/signal/signal.db",
            "/static/",
        ):
            assert call(server, path)[0] == 404
        for path in (
            "/signal/signal.db",
            "/signal.db",
            "/static/signal.db",
            "/..%2fsignal/signal.db",
        ):
            assert call(server, path)[0] in (403, 404)


@pytest.mark.parametrize("mode", ["preview", "synthetic"])
def test_the_read_only_preview_and_synthetic_mode_host_no_signal(
    root: Path, web: Path, mode: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    opened: list[Path] = []
    real = store.open_db

    def recording(folder: Path) -> sqlite3.Connection:
        opened.append(folder)
        return real(folder)

    monkeypatch.setattr(store, "open_db", recording)
    keys = {**key_environ(root), "CREDIT_OS_SIGNAL_AI": "1"}  # even asked for, none is hosted
    with react(
        root, web, read_only=mode == "preview", synthetic=mode == "synthetic", environ=keys
    ) as server:
        assert server.signal is None
        not_found = {"error": "not found"}
        for path in ("/signal/api/me", "/signal/api/snapshot", "/signal/api/status"):
            status, body, _ = call(server, path)
            assert (status, json.loads(body)) == (404, not_found), path
        for path in ("/signal", "/signal/", "/signal/api", "/signal/api/"):
            assert call(server, path)[0] == 404, path
        for method in ("POST", "DELETE"):
            status, body, _ = call(server, "/signal/api/stories/1/save", method, headers=DANA)
            assert (status, json.loads(body)) == (404, not_found), method
        for method in ("PUT", "PATCH", "HEAD", "OPTIONS"):
            assert call(server, "/signal/api/me", method)[0] == 501, method
        page = call(server, "/")[1]
        assert f'<meta name="credit-os-mode" content="{mode}">'.encode() in page
        assert b"credit-os-signal" not in page
        if mode == "preview":
            assert call(server, "/api/submissions", "POST")[0] == 405  # the preview's own refusal
    assert opened == []  # no feed store was opened
    assert not (root / "signal").exists()  # and none was made


# -- the background loop -------------------------------------------------------------------------


class Passes:
    """Stands in for the loop's pass: records each one and the thread it ran on. No pass of the
    real loop runs, so nothing is fetched."""

    def __init__(self, monkeypatch: pytest.MonkeyPatch) -> None:
        self.events: list[str] = []
        self.threads: list[threading.Thread] = []
        self.ran = threading.Event()
        real_recover = ai_run.recover

        def run_once(loop: signal_service.Loop, now: datetime) -> None:
            self.events.append("pass")
            self.threads.append(threading.current_thread())
            self.ran.set()

        def recover(db: sqlite3.Connection, setup: ai_run.Setup) -> tuple[int, int]:
            self.events.append("recover")
            return real_recover(db, setup)

        monkeypatch.setattr(signal_service.Loop, "run_once", run_once)
        monkeypatch.setattr(ai_run, "recover", recover)


def test_make_server_starts_no_signal_thread(
    seeded: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    passes = Passes(monkeypatch)
    before = set(threading.enumerate())
    with make_server(seeded, web=web, environ={}) as server:
        assert isinstance(server.signal, signal_host.SignalHost)
        assert isinstance(server.signal.loop, signal_service.Loop)
        started = [thread.name for thread in set(threading.enumerate()) - before]
        assert not [name for name in started if "signal" in name.lower()], started
    with react(seeded, web) as server:
        assert call(server, "/signal/api/status")[0] == 200
        assert call(server, "/signal/api/snapshot", headers=DANA)[0] == 200
        names = [thread.name for thread in threading.enumerate()]
        assert "signal-loop" not in names
    assert passes.events == []  # neither a pass nor the start-up recovery
    assert rows(seeded, "SELECT value FROM meta WHERE key='last_pass_at'") == []


def test_serve_starts_the_loop_after_recovery_and_stops_it_on_the_way_out(
    root: Path,
    web: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    caplog: pytest.LogCaptureFixture,
) -> None:
    passes = Passes(monkeypatch)
    seen: dict[str, Any] = {}

    def scheduler_loop(scheduler: Any) -> None:
        """Stands in for the scheduler loop ``serve`` blocks in; returning ends ``serve``."""
        seen["ran"] = passes.ran.wait(timeout=20)
        seen["alive"] = [thread.is_alive() for thread in passes.threads]
        seen["names"] = [thread.name for thread in passes.threads]
        seen["address"] = capsys.readouterr().out.strip()
        port = int(seen["address"].rsplit(":", 1)[1].rstrip("/"))
        connection = HTTPConnection("127.0.0.1", port, timeout=20)
        try:
            connection.request("GET", "/signal/api/status")
            reply = connection.getresponse()
            seen["status"] = (reply.status, json.loads(reply.read()))
        finally:
            connection.close()

    monkeypatch.setattr(react_frontend.service, "_loop", scheduler_loop)
    react_frontend.serve(root, web=web, port=0, environ={})
    assert seen["ran"] is True
    assert seen["alive"] == [True] and seen["names"] == ["signal-loop"]
    assert seen["address"].startswith("http://127.0.0.1:")
    assert seen["status"][0] == 200 and seen["status"][1]["ai_state"] == "off"
    assert passes.events == ["recover", "pass"]  # recovery, then the first tick; one tick a minute
    (worker,) = passes.threads
    assert not worker.is_alive()
    assert "signal-loop" not in [thread.name for thread in threading.enumerate()]
    assert not [record for record in caplog.records if record.name.endswith("signal_host")]


@pytest.mark.parametrize("ending", [KeyboardInterrupt, RuntimeError])
def test_serve_stops_the_loop_however_it_ends(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch, ending: type[BaseException]
) -> None:
    passes = Passes(monkeypatch)

    def scheduler_loop(scheduler: Any) -> None:
        assert passes.ran.wait(timeout=20)
        raise ending("stop")

    monkeypatch.setattr(react_frontend.service, "_loop", scheduler_loop)
    with pytest.raises(ending):
        react_frontend.serve(root, web=web, port=0, environ={})
    (worker,) = passes.threads
    assert not worker.is_alive()


def test_serve_does_not_wait_out_a_pass_in_flight(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """Shutdown waits ``STOP_SECONDS`` for the pass, then leaves it to its daemon thread, which
    ends with the process (``ai_run.recover`` settles what that cuts short at the next start)."""
    started, release = threading.Event(), threading.Event()
    workers: list[threading.Thread] = []

    def slow_pass(loop: signal_service.Loop, now: datetime) -> None:
        workers.append(threading.current_thread())
        started.set()
        release.wait(timeout=60)

    monkeypatch.setattr(signal_service.Loop, "run_once", slow_pass)
    monkeypatch.setattr(signal_host, "STOP_SECONDS", 0.2)
    monkeypatch.setattr(react_frontend.service, "_loop", lambda scheduler: started.wait(timeout=20))
    with caplog.at_level(logging.WARNING, logger="react_frontend.signal_host"):
        react_frontend.serve(root, web=web, port=0, environ={})  # returns: it did not wait 60 s
    (worker,) = workers
    assert worker.is_alive() and worker.daemon
    assert [(record.name, record.levelname, record.getMessage()) for record in caplog.records] == [
        (
            "react_frontend.signal_host",
            "WARNING",
            "a Signal pass was still running at shutdown; it was left to end with the process",
        )
    ]
    release.set()
    worker.join(timeout=20)
    assert not worker.is_alive()  # the stop it was given ended it after that pass: no second one
    assert len(workers) == 1


def test_serve_starts_no_loop_in_synthetic_mode(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    passes = Passes(monkeypatch)
    threads: list[str] = []

    def scheduler_loop(scheduler: Any) -> None:
        threads.extend(thread.name for thread in threading.enumerate())

    monkeypatch.setattr(react_frontend.service, "_loop", scheduler_loop)
    keys = {**key_environ(root), "CREDIT_OS_SIGNAL_AI": "1"}
    react_frontend.serve(
        root, web=web, port=0, launcher=("unused-by-test",), synthetic=True, environ=keys
    )
    assert threads and "signal-loop" not in threads
    assert passes.events == []
    assert not (root / "signal").exists()


def test_a_store_that_cannot_be_opened_stops_start_up_with_signal_serves_message(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    passes = Passes(monkeypatch)
    (root / "signal").write_text("a file where the store's folder belongs", encoding="utf-8")
    reached: list[str] = []
    monkeypatch.setattr(react_frontend.service, "_loop", lambda scheduler: reached.append("loop"))
    with pytest.raises(OSError) as refused:
        react_frontend.serve(root, web=web, port=0, environ={})
    message = str(refused.value)
    assert message.startswith(f"cannot open the store under {root}: ")
    assert "exists" in message  # the cause, as the system words it
    assert reached == [] and passes.events == []  # no scheduler loop, no recovery, no pass
    capsys.readouterr()

    from react_frontend import __main__ as main

    def serve_this_build(path: Path, **options: Any) -> None:
        react_frontend.serve(path, web=web, environ={}, **options)  # the command has no --web

    monkeypatch.setattr(main, "serve", serve_this_build)
    monkeypatch.setattr(sys, "argv", ["react_frontend", "--root", str(root), "--port", "0"])
    with pytest.raises(SystemExit) as ended:
        main.main()
    assert ended.value.code == 2
    assert capsys.readouterr().err == message + "\n"
    # Start-up let go of what it held: the same folder starts once the store can be opened.
    (root / "signal").unlink()
    with make_server(root, web=web, environ={}) as server:
        assert server.server_address[1] > 0


def test_a_store_made_by_another_build_stops_start_up(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    passes = Passes(monkeypatch)

    def refusing(folder: Path) -> sqlite3.Connection:
        raise store.StoreError("the store was made by a newer build")

    monkeypatch.setattr(store, "open_db", refusing)
    monkeypatch.setattr(react_frontend.service, "_loop", lambda scheduler: None)
    with pytest.raises(OSError) as refused:
        react_frontend.serve(root, web=web, port=0, environ={})
    assert str(refused.value) == (
        f"cannot open the store under {root}: the store was made by a newer build"
    )
    assert passes.events == []


# -- money: the AI pass does not switch itself on (spec 4.4) -------------------------------------


def no_fetch(url: str, etag: str | None, modified: str | None) -> Fetched:
    raise AssertionError(f"a test of the AI switch fetched {url}")


class Factory:
    """SYNTHETIC: stands in for the live adapter's factory and records every model it is asked to
    build. The models are ``FakeModel``: nothing is sent anywhere."""

    def __init__(self) -> None:
        self.built: list[FakeModel] = []

    def __call__(self, config_id: str, ruling: Path) -> FakeModel:
        self.built.append(FakeModel())
        return self.built[-1]


def ready(root: Path, tmp: Path) -> tuple[dict[str, str], Path]:
    """Everything the AI pass needs but the switch: the owner's cap on the store, a valid ruling
    (in a temporary rulings folder) and a launching environment holding a fake key and runtime."""
    db = store.open_db(root)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    db.close()
    rulings = tmp / "rulings"
    write_ruling(rulings)
    return key_environ(tmp), rulings


def faked(host: signal_host.SignalHost, rulings: Path) -> Factory:
    """Point the hosted loop at the temporary rulings folder, a recording factory and a fetch that
    refuses. The environment the host chose, the subject of these tests, is left as it is."""
    factory = Factory()
    host.loop.ai = dataclasses.replace(host.loop.ai, rulings_root=rulings, factory=factory)
    host.loop.fetch_fn, host.loop.logo_fetch = no_fetch, None
    return factory


def loop_errors(loop: signal_service.Loop) -> tuple[str | None, ...]:
    return (
        loop.last_error,
        loop.logo_error,
        loop.ai_error,
        loop.digest_error,
        loop.market_error,
    )


def test_keys_in_the_environment_without_the_switch_leave_the_pass_off(
    root: Path, tmp_path: Path
) -> None:
    keys, rulings = ready(root, tmp_path)
    assert keys["COPILOT_GITHUB_TOKEN"] == "test-token-not-a-real-key"
    assert "CREDIT_OS_SIGNAL_AI" not in keys
    host = signal_host.SignalHost(root, environ=keys)
    assert host.loop.ai.environ == {}
    assert host.loop.ai.guard.environ == {}  # what every call is checked against, too
    factory = faked(host, rulings)

    db = store.open_db(root)
    held = host.loop.ai_status(db, NOW)
    shown = host.loop.shown_ai_status(db, NOW)
    db.close()
    assert held.state == "off" and shown.state == "off"
    assert held.gate.missing == (NO_KEY, NO_RUNTIME)  # the ruling and the cap hold: only the key
    assert shown.gate.missing == (NO_KEY, NO_RUNTIME)

    host.loop.run_once(NOW)
    assert loop_errors(host.loop) == (None, None, None, None, None)
    assert factory.built == []  # no adapter was constructed, so none was called
    assert rows(root, "SELECT COUNT(*) FROM ai_usage") == [(0,)]


def test_the_switch_set_to_1_passes_the_given_environment_to_the_loop(
    root: Path, tmp_path: Path
) -> None:
    keys, rulings = ready(root, tmp_path)
    given = {**keys, "CREDIT_OS_SIGNAL_AI": "1"}
    host = signal_host.SignalHost(root, environ=given)
    assert host.loop.ai.environ is given
    assert host.loop.ai.guard.environ is given
    factory = faked(host, rulings)

    db = store.open_db(root)
    held = host.loop.ai_status(db, NOW)
    db.close()
    assert (held.state, held.gate.missing) == ("on", ())

    host.loop.run_once(NOW)
    assert loop_errors(host.loop) == (None, None, None, None, None)
    assert len(factory.built) == 2  # one model per job: the story pass and the digest writer
    assert [model.closed for model in factory.built] == [True, True]
    assert [model.requests for model in factory.built] == [[], []]  # no story: nothing was asked


@pytest.mark.parametrize(
    "value", ["0", "", "true", " 1", "1 ", "01", "1.0", "yes", "on", "True", "11", "١"]
)
def test_any_value_but_exactly_1_leaves_the_pass_off(
    root: Path, tmp_path: Path, value: str
) -> None:
    keys, rulings = ready(root, tmp_path)
    host = signal_host.SignalHost(root, environ={**keys, "CREDIT_OS_SIGNAL_AI": value})
    assert host.loop.ai.environ == {}
    factory = faked(host, rulings)
    db = store.open_db(root)
    held = host.loop.ai_status(db, NOW)
    db.close()
    assert (held.state, held.gate.missing) == ("off", (NO_KEY, NO_RUNTIME))
    host.loop.run_once(NOW)
    assert factory.built == []


def test_a_differently_named_switch_does_not_count(root: Path, tmp_path: Path) -> None:
    keys, _ = ready(root, tmp_path)
    for name in ("credit_os_signal_ai", "CREDIT_OS_SIGNAL_AI ", "CREDIT_OS_SIGNAL", "SIGNAL_AI"):
        host = signal_host.SignalHost(root, environ={**keys, name: "1"})
        assert host.loop.ai.environ == {}, name


def test_the_switch_is_read_from_the_environment_given_not_the_processes(
    root: Path, web: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    keys, _ = ready(root, tmp_path)
    # The process says yes and holds keys; the environment given says nothing: off.
    monkeypatch.setenv("CREDIT_OS_SIGNAL_AI", "1")
    monkeypatch.setenv("COPILOT_GITHUB_TOKEN", "test-token-not-a-real-key")
    monkeypatch.setenv("COPILOT_CLI_PATH", keys["COPILOT_CLI_PATH"])
    with make_server(root, web=web, environ=keys) as server:
        assert server.signal is not None
        assert server.signal.loop.ai.environ == {}
    # The process says nothing; the environment given says yes: that mapping, and only it.
    monkeypatch.delenv("CREDIT_OS_SIGNAL_AI")
    given = {**keys, "CREDIT_OS_SIGNAL_AI": "1"}
    with make_server(root, web=web, environ=given) as server:
        assert server.signal is not None
        assert server.signal.loop.ai.environ is given


def test_with_no_environment_given_the_processes_own_decides(
    root: Path, web: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    keys, _ = ready(root, tmp_path)
    monkeypatch.setenv("COPILOT_GITHUB_TOKEN", "test-token-not-a-real-key")
    monkeypatch.setenv("COPILOT_CLI_PATH", keys["COPILOT_CLI_PATH"])
    monkeypatch.delenv("CREDIT_OS_SIGNAL_AI", raising=False)
    with make_server(root, web=web) as server:
        assert server.signal is not None
        assert server.signal.loop.ai.environ == {}
    monkeypatch.setenv("CREDIT_OS_SIGNAL_AI", "1")
    with make_server(root, web=web) as server:
        assert server.signal is not None
        assert server.signal.loop.ai.environ is os.environ


def test_the_switch_is_read_once_when_the_host_is_built(root: Path, tmp_path: Path) -> None:
    keys, rulings = ready(root, tmp_path)
    given = dict(keys)
    host = signal_host.SignalHost(root, environ=given)
    factory = faked(host, rulings)
    given["CREDIT_OS_SIGNAL_AI"] = "1"  # set after start-up: this process stays off
    host.loop.run_once(NOW)
    assert host.loop.ai.environ == {} and factory.built == []
    with pytest.raises(TypeError):
        host.loop.ai.environ["COPILOT_GITHUB_TOKEN"] = "x"  # type: ignore[index]


def test_the_pages_see_the_pass_off_without_the_switch_and_on_with_it(
    root: Path, web: Path, tmp_path: Path
) -> None:
    keys, rulings = ready(root, tmp_path)
    db = store.open_db(root)
    store.add_user(db, "Mara L", "writer")
    db.close()
    mara = {"Cookie": "signal_name=Mara%20L"}
    plain_reasons = [
        "The provider key is missing from the service's environment.",
        "The Copilot runtime is missing from the service's environment.",
    ]
    for given, state, reasons in (
        (keys, "off", plain_reasons),
        ({**keys, "CREDIT_OS_SIGNAL_AI": "true"}, "off", plain_reasons),
        ({**keys, "CREDIT_OS_SIGNAL_AI": "1"}, "on", []),
    ):
        with react(root, web, environ=given) as server:
            assert server.signal is not None
            factory = faked(server.signal, rulings)
            status, body, _ = call(server, "/signal/api/status")
            assert (status, json.loads(body)["ai_state"]) == (200, state)
            status, body, _ = call(server, "/signal/api/snapshot", headers=mara)
            assert status == 200
            shown = json.loads(body)["scenes"][0]["snapshot"]["settings"]["ai"]
            assert shown["state"] == state
            assert [reason for reason in plain_reasons if reason in body.decode("utf-8")] == reasons
            assert "COPILOT" not in body.decode("utf-8")  # no variable name reaches a page
            assert factory.built == []  # a request builds no model, whatever the state


def test_the_command_takes_no_signal_address(
    root: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    from react_frontend import __main__ as main

    launched: list[Path] = []
    monkeypatch.setattr(main, "serve", lambda path, **options: launched.append(path))
    argv = ["react_frontend", "--root", str(root), "--signal-url", "http://127.0.0.1:8766/"]
    monkeypatch.setattr(sys, "argv", argv)
    with pytest.raises(SystemExit) as ended:
        main.main()
    assert ended.value.code == 2 and launched == []
    assert "unrecognized arguments: --signal-url" in capsys.readouterr().err
    monkeypatch.setattr(sys, "argv", ["react_frontend", "--root", str(root), "--port", "0"])
    main.main()
    assert launched == [root]
