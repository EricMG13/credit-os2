"""The React server's Signal forwarding (react_frontend/signal_forward.py), run for real.

Two kinds of upstream. The behaviour a reader depends on runs against a real Signal service on a
loopback port over a temporary store (name round trip, a save reaching the store). The hostile
cases run against a tiny scripted TCP upstream whose every byte the test controls (a redirect, an
oversized or slow reply, extra headers) and which records exactly what the forwarder sent it.
Expected values are written by hand, never computed from the code under test.
"""

import gzip
import json
import logging
import os
import socket
import socketserver
import threading
import time
from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from datetime import UTC, datetime
from http.client import HTTPConnection
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest

from deploy_workflow.run_start.service import _Server
from deploy_workflow.signal import service as signal_service
from deploy_workflow.signal import store, topics
from deploy_workflow.signal.feeds import Entry
from react_frontend import make_server, signal_forward

NO_UPSTREAM = 1  # a port nothing listens on, for "Signal is down"
NOT_REACHABLE = {"error": "Signal is not reachable"}


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


@contextmanager
def react(root: Path, web: Path, signal_url: str, *, read_only: bool = False) -> Iterator[_Server]:
    with make_server(root, web=web, signal_url=signal_url, read_only=read_only) as server:
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            yield server
        finally:
            server.shutdown()
            thread.join()


def call(
    server: _Server,
    path: str,
    method: str = "GET",
    *,
    headers: Mapping[str, str | None] | None = None,
    body: bytes | str | None = None,
) -> tuple[int, bytes, list[tuple[str, str]]]:
    """One request to the React server. A write carries the page's own Origin; a header given as
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


def raw_call(server: _Server, data: bytes) -> bytes:
    """Whatever the server answers to these exact bytes."""
    with socket.create_connection(("127.0.0.1", server.server_address[1]), timeout=10) as sock:
        sock.sendall(data)
        chunks = []
        while chunk := sock.recv(65536):
            chunks.append(chunk)
    return b"".join(chunks)


def header(headers: list[tuple[str, str]], name: str) -> str | None:
    found = [value for key, value in headers if key.lower() == name.lower()]
    assert len(found) <= 1, (name, found)
    return found[0] if found else None


# -- a scripted upstream ------------------------------------------------------------------------


def _read_request(sock: socket.socket) -> bytes:
    data = b""
    while b"\r\n\r\n" not in data:
        chunk = sock.recv(65536)
        if not chunk:
            return data
        data += chunk
    head, _, rest = data.partition(b"\r\n\r\n")
    length = 0
    for line in head.split(b"\r\n")[1:]:
        name, _, value = line.partition(b":")
        if name.strip().lower() == b"content-length":
            length = int(value)
    while len(rest) < length:
        chunk = sock.recv(65536)
        if not chunk:
            break
        rest += chunk
    return head + b"\r\n\r\n" + rest


def reply_bytes(
    body: bytes = b'{"ok": true}',
    *,
    status: str = "200 OK",
    kind: str | None = "application/json; charset=utf-8",
    extra: tuple[str, ...] = (),
    length: int | None = None,
) -> bytes:
    lines = [f"HTTP/1.1 {status}", f"Content-Length: {len(body) if length is None else length}"]
    if kind is not None:
        lines.append(f"Content-Type: {kind}")
    lines.extend(extra)
    return ("\r\n".join(lines) + "\r\n\r\n").encode("latin-1") + body


class Upstream:
    """A TCP server on a loopback port that answers each request with ``script(socket, request)``
    and records the raw bytes of every request and the number of connections."""

    def __init__(self, script: Callable[[socket.socket, bytes], None]) -> None:
        self.requests: list[bytes] = []
        self.connections = 0
        outer = self

        class Handle(socketserver.BaseRequestHandler):
            def handle(self) -> None:
                outer.connections += 1
                raw = _read_request(self.request)
                outer.requests.append(raw)
                try:
                    script(self.request, raw)
                except OSError:
                    return

        class Server(socketserver.ThreadingTCPServer):
            allow_reuse_address = True
            daemon_threads = True

        self.server = Server(("127.0.0.1", 0), Handle)
        self.port = self.server.server_address[1]
        self.url = f"http://127.0.0.1:{self.port}/"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def close(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)

    def head(self, index: int = 0) -> tuple[str, dict[str, str]]:
        """The request line and the headers (lower-cased names) of a recorded request."""
        text = self.requests[index].partition(b"\r\n\r\n")[0].decode("latin-1")
        first, *lines = text.split("\r\n")
        return first, {line.partition(":")[0].lower(): line.partition(": ")[2] for line in lines}

    def body(self, index: int = 0) -> bytes:
        return self.requests[index].partition(b"\r\n\r\n")[2]


def answer(data: bytes) -> Callable[[socket.socket, bytes], None]:
    def script(sock: socket.socket, _raw: bytes) -> None:
        sock.sendall(data)

    return script


@contextmanager
def upstream(script: Callable[[socket.socket, bytes], None]) -> Iterator[Upstream]:
    fake = Upstream(script)
    try:
        yield fake
    finally:
        fake.close()


@contextmanager
def forwarded(
    root: Path, web: Path, script: Callable[[socket.socket, bytes], None]
) -> Iterator[tuple[_Server, Upstream]]:
    with upstream(script) as fake, react(root, web, fake.url) as server:
        yield server, fake


def settle() -> None:
    time.sleep(0.15)  # a connection the forwarder wrongly opened would be counted by now


# -- the real Signal service --------------------------------------------------------------------


@contextmanager
def real_signal(folder: Path) -> Iterator[tuple[str, Path]]:
    folder.mkdir()
    db = store.open_db(folder)
    source = store.propose_source(db, "Authority", "regulator", "https://a.org/feed", "owner")
    store.set_source_state(db, source, "approved")
    entry = Entry("Remedy accepted by the regulator", "https://a.org/1", None, "A remedy.")
    assert store.add_story(db, source, entry, datetime(2026, 11, 13, 9, 0, tzinfo=UTC)) == "new"
    assert topics.add_topic(db, "Remedy", ["remedy"], [], "owner") == 1
    db.close()
    server = signal_service.make_server(folder, "127.0.0.1", 0)
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.02})
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}/", folder
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=10)


def rows(folder: Path, sql: str) -> list[tuple[object, ...]]:
    db = store.open_db(folder)
    try:
        return [tuple(row) for row in db.execute(sql).fetchall()]
    finally:
        db.close()


def test_name_round_trip_and_writes_reach_the_real_service(
    root: Path, web: Path, tmp_path: Path
) -> None:
    with (
        real_signal(tmp_path / "signal-data") as (url, data),
        react(root, web, url) as server,
    ):
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
        cookie = {"Cookie": "unrelated=1; signal_name=Dana%20Reyes; other=2"}
        status, body, _ = call(server, "/signal/api/me", headers=cookie)
        assert (status, json.loads(body)) == (200, {"name": "Dana Reyes", "role": "reader"})

        # A page that is not Signal's is refused by Signal's own 401, status and text intact.
        status, body, _ = call(server, "/signal/api/topics")
        assert (status, json.loads(body)) == (401, {"error": "choose a display name first"})

        status, body, _ = call(server, "/signal/api/stories/1/save", "POST", headers=cookie)
        assert (status, json.loads(body)) == (200, {"saved": True})
        assert rows(data, "SELECT user_name, story_id FROM saves") == [("Dana Reyes", 1)]
        status, body, _ = call(server, "/signal/api/stories/1/save", "DELETE", headers=cookie)
        assert (status, json.loads(body)) == (200, {"saved": False})
        assert rows(data, "SELECT user_name, story_id FROM saves") == []

        status, body, _ = call(server, "/signal/api/topics/1/follow", "POST", headers=cookie)
        assert (status, json.loads(body)) == (200, {"following": True})
        assert rows(data, "SELECT user_name, topic_id FROM topic_follows") == [("Dana Reyes", 1)]
        status, body, _ = call(server, "/signal/api/topics", headers=cookie)
        assert status == 200
        assert json.loads(body) == [{"id": 1, "name": "Remedy", "following": True, "stories": 1}]
        status, body, _ = call(server, "/signal/api/stories/99/save", "POST", headers=cookie)
        assert status == 404 and json.loads(body)["error"]
        status, body, _ = call(server, "/signal/api/status")
        assert status == 200
        assert json.loads(body) == {
            "last_pass_at": None,
            "sources": {"approved": 1, "failing": 0},
            "loop_error": None,
            "ai_state": "off",  # no background loop: the AI pass is off
            "ai_last_problem": None,
        }


# -- the allowlist -------------------------------------------------------------------------------

REACHING = [
    ("GET", "/signal/api/snapshot"),
    ("GET", "/signal/api/me"),
    ("POST", "/signal/api/me"),
    ("GET", "/signal/api/status"),
    ("GET", "/signal/api/feed"),
    ("GET", "/signal/api/feed/new"),
    ("GET", "/signal/api/topics"),
    ("POST", "/signal/api/stories/12/save"),
    ("DELETE", "/signal/api/stories/12/save"),
    ("POST", "/signal/api/topics/3/follow"),
    ("DELETE", "/signal/api/topics/3/follow"),
]


@pytest.mark.parametrize(("method", "path"), REACHING)
def test_the_service_routes_pass_with_the_signal_prefix_dropped(
    root: Path, web: Path, method: str, path: str
) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        status, body, _ = call(server, path, method)
        assert (status, body) == (200, b'{"ok": true}')
        assert fake.head()[0] == f"{method} {path.removeprefix('/signal')} HTTP/1.1"


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
def test_a_path_outside_the_allowlist_is_404_before_any_outbound_call(
    root: Path, web: Path, path: str
) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        for method in ("GET", "POST", "DELETE"):
            assert call(server, path, method)[0] == 404, method
        settle()
        assert fake.connections == 0


def test_an_absolute_target_is_refused_by_the_base_checks(root: Path, web: Path) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        port = server.server_address[1]
        data = f"GET http://evil.test/signal/api/me HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n\r\n"
        assert raw_call(server, data.encode()).startswith(b"HTTP/1.0 400")
        settle()
        assert fake.connections == 0


@pytest.mark.parametrize("method", ["PUT", "PATCH", "OPTIONS", "HEAD"])
def test_other_methods_are_405_and_never_forwarded(root: Path, web: Path, method: str) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        status, body, headers = call(server, "/signal/api/me", method)
        assert status == 405
        assert header(headers, "Allow") == "GET, POST, DELETE"
        assert body == (b"" if method == "HEAD" else b'{"error": "method not allowed"}')
        assert call(server, "/signal/api/Nothing", method)[0] == 404
        settle()
        assert fake.connections == 0
        assert call(server, "/start", "PUT")[0] == 501  # the rest of the server is unchanged


@pytest.mark.parametrize("path", ["/signal/api", "/signal/api/"])
@pytest.mark.parametrize("method", ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS", "HEAD"])
def test_the_api_root_is_404_for_every_method_with_or_without_a_slash(
    root: Path, web: Path, path: str, method: str
) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        assert call(server, path, method)[0] == 404
        settle()
        assert fake.connections == 0


def test_the_connect_timeout_is_what_is_left_of_the_deadline() -> None:
    assert signal_forward.connect_timeout(100.0, 100.0) == signal_forward.IO_TIMEOUT
    assert signal_forward.connect_timeout(100.0, 108.0) == pytest.approx(2.0)
    assert signal_forward.connect_timeout(100.0, 120.0) <= 0  # none left: no connect attempt


def test_a_status_line_with_control_bytes_reaches_the_log_escaped(
    root: Path, web: Path, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO)
    hostile = b"garbage\r2026-11-24 ERROR fake: key=sk-xxx\x1b[2K\r\n"
    with upstream(answer(hostile)) as fake, react(root, web, fake.url) as server:
        assert call(server, "/signal/api/me")[0] == 502
    messages = [r.getMessage() for r in caplog.records if r.name == signal_forward.log.name]
    assert len(messages) == 1
    assert not any(c in messages[0] for c in "\r\n\x1b")


# -- the local checks come first -----------------------------------------------------------------


@pytest.mark.parametrize("method", ["POST", "DELETE"])
def test_a_write_from_another_origin_is_refused_locally(root: Path, web: Path, method: str) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        path = "/signal/api/stories/1/save"
        port = server.server_address[1]
        other = {"Origin": "http://evil.test"}
        assert call(server, path, method, headers=other)[0] == 403
        assert call(server, path, method, headers={"Origin": None})[0] == 403
        assert (
            call(server, path, method, headers={"Origin": f"http://localhost:{port + 1}"})[0] == 403
        )
        assert call(server, path, method, headers={"Origin": "null"})[0] == 403
        site = {"Sec-Fetch-Site": "cross-site"}
        assert call(server, path, method, headers=site)[0] == 403
        settle()
        assert fake.connections == 0
        assert call(server, path, method)[0] == 200  # the page's own origin passes


def test_a_foreign_host_name_is_refused_before_anything_is_forwarded(root: Path, web: Path) -> None:
    """DNS rebinding: a page on evil.test that resolves to this machine sends Host: evil.test."""
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        port = server.server_address[1]
        for host in ("evil.test", f"evil.test:{port}", f"127.0.0.1:{port + 1}"):
            for method in ("GET", "POST"):
                headers = {"Host": host, "Origin": f"http://{host}"}
                assert call(server, "/signal/api/me", method, headers=headers)[0] == 403
        assert call(server, "/signal/api/me", headers={"Sec-Fetch-Site": "cross-site"})[0] == 403
        assert call(server, "/signal/api/me", headers={"Origin": "http://evil.test"})[0] == 403
        settle()
        assert fake.connections == 0
        assert call(server, "/signal/api/me", headers={"Host": f"localhost:{port}"})[0] == 200


# -- what is sent upstream -----------------------------------------------------------------------


def test_the_outbound_request_carries_only_the_listed_headers(root: Path, web: Path) -> None:
    browser = {
        "Cookie": "session=secret; signal_name=Dana%20Reyes; theme=dark",
        "Authorization": "Bearer token",
        "Referer": "http://127.0.0.1/start",
        "User-Agent": "Browser/1.0",
        "X-Forwarded-Host": "evil.test",
        "X-Forwarded-For": "10.0.0.9",
        "Forwarded": "host=evil.test",
        "Accept": "text/html",
        "Accept-Encoding": "gzip",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "text/plain",
        "Connection": "keep-alive",
    }
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        port = fake.port
        assert (
            call(server, "/signal/api/me", "POST", headers=browser, body='{"name": "Dana"}')[0]
            == 200
        )
        assert call(server, "/signal/api/feed?view=latest", headers=browser)[0] == 200
    expected_write = {
        "host": f"127.0.0.1:{port}",
        "origin": f"http://127.0.0.1:{port}",
        "cookie": "signal_name=Dana%20Reyes",
        "content-type": "application/json",
        "content-length": "16",
        "connection": "close",
        "accept-encoding": "identity",
    }
    assert fake.head(0) == ("POST /api/me HTTP/1.1", expected_write)
    assert fake.body(0) == b'{"name": "Dana"}'
    expected_read = {
        "host": f"127.0.0.1:{port}",
        "cookie": "signal_name=Dana%20Reyes",
        "connection": "close",
        "accept-encoding": "identity",
    }
    assert fake.head(1) == ("GET /api/feed?view=latest HTTP/1.1", expected_read)


@pytest.mark.parametrize(
    ("sent", "forwarded_cookie"),
    [
        ("session=secret; theme=dark", None),
        ("signal_name=Dana%20Reyes", "signal_name=Dana%20Reyes"),
        (" signal_name = Dana%20Reyes ;x=1", "signal_name=Dana%20Reyes"),
        ("signal_name=first; signal_name=second", "signal_name=first"),
        ("xsignal_name=a; signal_name_x=b", None),
        ("signal_name=a b", None),
        ('signal_name="quoted"', None),
        ("signal_name=a,b", None),
        ("signal_name=" + "a" * 2000, None),
        ("signal_name=", None),
        ("signal_name=%0d%0aX-Evil%3A1", "signal_name=%0d%0aX-Evil%3A1"),
        ("signal_name=a:b", None),
        ("signal_name=a\\b", None),
        ("signal_name=café", None),
    ],
)
def test_only_the_one_well_formed_name_cookie_goes_upstream(
    root: Path, web: Path, sent: str, forwarded_cookie: str | None
) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        headers = {"Cookie": sent.encode("utf-8").decode("latin-1")}
        assert call(server, "/signal/api/me", headers=headers)[0] == 200
        _, seen = fake.head()
        assert seen.get("cookie") == forwarded_cookie
        assert b"\r\nX-Evil" not in fake.requests[0]  # nothing became a header of its own
        assert len(fake.requests) == 1


def test_a_query_goes_with_a_get_only_and_only_when_printable_and_short(
    root: Path, web: Path
) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        query = "view=latest&q=a%20b&kind=%22x%22&q=%e2%82%ac"
        assert call(server, f"/signal/api/feed?{query}")[0] == 200
        assert fake.head(0)[0] == f"GET /api/feed?{query} HTTP/1.1"
        assert call(server, "/signal/api/feed?")[0] == 200
        assert fake.head(1)[0] == "GET /api/feed HTTP/1.1"
        assert call(server, "/signal/api/stories/1/save?x=1&y=2", "POST")[0] == 200
        assert fake.head(2)[0] == "POST /api/stories/1/save HTTP/1.1"
        assert call(server, "/signal/api/topics/1/follow?x=1", "DELETE")[0] == 200
        assert fake.head(3)[0] == "DELETE /api/topics/1/follow HTTP/1.1"
        assert call(server, "/signal/api/feed?q=" + "a" * 600)[0] == 400
        port = server.server_address[1]
        for target in (b"/signal/api/feed?q=\xe2\x82\xac", b"/signal/api/feed?q=a\x01b"):
            data = b"GET " + target + b" HTTP/1.1\r\nHost: 127.0.0.1:%d\r\n\r\n" % port
            assert raw_call(server, data).startswith(b"HTTP/1.0 400")
        settle()
        assert fake.connections == 4


def test_a_request_line_cannot_smuggle_a_second_request_or_header(root: Path, web: Path) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        port = server.server_address[1]
        head = f"Host: 127.0.0.1:{port}\r\nOrigin: http://127.0.0.1:{port}\r\n"
        smuggled = (
            f"POST /signal/api/me%0d%0aX:y HTTP/1.1\r\n{head}Content-Length: 0\r\n\r\n"
            f"GET /signal/api/me HTTP/1.1\r\n{head}\r\n"
        )
        assert b" 404 " in raw_call(server, smuggled.encode()).split(b"\r\n")[0]
        chunked = (
            f"POST /signal/api/me HTTP/1.1\r\n{head}Transfer-Encoding: chunked\r\n\r\n0\r\n\r\n"
        )
        assert b" 411 " in raw_call(server, chunked.encode()).split(b"\r\n")[0]
        lengths = "Content-Length: 2\r\nContent-Length: 3\r\n"
        twice = f"POST /signal/api/me HTTP/1.1\r\n{head}{lengths}\r\n{{}}"
        assert b" 400 " in raw_call(server, twice.encode()).split(b"\r\n")[0]
        settle()
        assert fake.connections == 0


def test_a_body_is_forwarded_exactly_and_bounded_at_64_kib(root: Path, web: Path) -> None:
    with forwarded(root, web, answer(reply_bytes())) as (server, fake):
        exact = b'{"name": "' + b"x" * (64 * 1024 - 12) + b'"}'
        assert len(exact) == 64 * 1024
        assert call(server, "/signal/api/me", "POST", body=exact)[0] == 200
        assert fake.body() == exact
        assert call(server, "/signal/api/me", "POST", body=exact + b" ")[0] == 413
        assert (
            call(server, "/signal/api/me", "GET", headers={"Content-Length": "2"}, body=b"{}")[0]
            == 400
        )
        assert call(server, "/signal/api/stories/1/save", "DELETE", body=b"{}")[0] == 400
        assert call(server, "/signal/api/stories/1/save", "POST")[0] == 200
        assert fake.head(1) == (
            "POST /api/stories/1/save HTTP/1.1",
            {
                "host": f"127.0.0.1:{fake.port}",
                "origin": f"http://127.0.0.1:{fake.port}",
                "content-length": "0",
                "connection": "close",
                "accept-encoding": "identity",
            },
        )
        port = server.server_address[1]
        short = (
            f"POST /signal/api/me HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n"
            f"Origin: http://127.0.0.1:{port}\r\nContent-Length: 50\r\n\r\n{{}}"
        )
        with socket.create_connection(("127.0.0.1", port), timeout=10) as sock:
            sock.sendall(short.encode())
            sock.shutdown(socket.SHUT_WR)
            assert b" 400 " in sock.recv(4096).split(b"\r\n")[0]
        settle()
        assert fake.connections == 2


# -- what comes back -----------------------------------------------------------------------------


def test_status_and_body_bytes_pass_unchanged_and_only_the_name_cookie_is_set(
    root: Path, web: Path
) -> None:
    body = '{"error": "choose a display name first", "note": "café"}'.encode()
    extra = (
        "Set-Cookie: session=abc; Path=/",
        "Set-Cookie: signal_name=Eve; Path=/; Domain=evil.test",
        "Set-Cookie: signal_name=Dana%20Reyes; Path=/; Max-Age=31536000; SameSite=Strict; HttpOnly",
        "Set-Cookie: signal_name=Other; Path=/",
        "X-Secret: 1",
        "Server: internal-box",
        "Content-Security-Policy: default-src *",
        "Cache-Control: public, max-age=999",
    )
    script = answer(reply_bytes(body, status="401 Unauthorized", extra=extra))
    with forwarded(root, web, script) as (server, _):
        status, got, headers = call(server, "/signal/api/me")
    assert (status, got) == (401, body)
    names = {key.lower() for key, _ in headers}
    assert "x-secret" not in names and "location" not in names
    assert header(headers, "Cache-Control") == "no-store"
    assert header(headers, "Content-Type") == "application/json; charset=utf-8"
    assert header(headers, "Content-Security-Policy") is None
    assert header(headers, "Server") != "internal-box"
    assert header(headers, "Set-Cookie") == (
        "signal_name=Dana%20Reyes; Path=/; Max-Age=31536000; SameSite=Strict; HttpOnly"
    )


@pytest.mark.parametrize(
    "cookie",
    [
        "session=abc",
        "signal_name2=a",
        "signal_name=a; Domain=evil.test",
        "signal_name=a; Path=/x",
        "signal_name=a; Expires=Thu, 01 Jan 2099 00:00:00 GMT",
        "signal_name=a b",
        "signal_name=a; SameSite=None",
        "signal_name=a;\r\n Path=/",
        "signal_name=a\x01",
    ],
)
def test_a_set_cookie_that_is_not_the_name_cookie_is_dropped(
    root: Path, web: Path, cookie: str
) -> None:
    script = answer(reply_bytes(extra=(f"Set-Cookie: {cookie}",)))
    with forwarded(root, web, script) as (server, _):
        status, _, headers = call(server, "/signal/api/me")
    assert status == 200
    assert header(headers, "Set-Cookie") is None


def test_a_large_json_reply_is_gzipped_for_a_browser_that_accepts_it(root: Path, web: Path) -> None:
    body = json.dumps({"scenes": [{"id": "main", "text": "word " * 20000}]}).encode()
    with forwarded(root, web, answer(reply_bytes(body))) as (server, _):
        status, got, headers = call(
            server, "/signal/api/snapshot", headers={"Accept-Encoding": "gzip"}
        )
        assert status == 200 and header(headers, "Content-Encoding") == "gzip"
        assert gzip.decompress(got) == body
        status, plain, headers = call(server, "/signal/api/snapshot")
        assert (status, plain) == (200, body)
        assert header(headers, "Content-Encoding") is None


def test_a_chunked_reply_at_the_cap_passes(root: Path, web: Path) -> None:
    with forwarded(root, web, chunked_reply(signal_forward.MAX_REPLY)) as (server, _):
        status, got, _ = call(server, "/signal/api/snapshot")
        assert (status, len(got), got[:9], got[-2:]) == (200, 4 * 1024 * 1024, b'{"pad": "', b'"}')


def test_the_largest_accepted_reply_passes(root: Path, web: Path) -> None:
    body = b'{"pad": "' + b"x" * (signal_forward.MAX_REPLY - 11) + b'"}'
    assert len(body) == 4 * 1024 * 1024
    with forwarded(root, web, answer(reply_bytes(body))) as (server, _):
        status, got, _ = call(server, "/signal/api/snapshot")
        assert (status, got) == (200, body)


# -- hostile or broken upstreams -----------------------------------------------------------------


def trickle(sock: socket.socket, _raw: bytes) -> None:
    """A reply that starts and then never finishes: one byte every 0.05 s."""
    sock.sendall(
        b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 100000\r\n\r\n"
    )
    for _ in range(400):
        sock.sendall(b" ")
        time.sleep(0.05)


def silence(sock: socket.socket, _raw: bytes) -> None:
    time.sleep(3)


def stream_over_the_cap(sock: socket.socket, _raw: bytes) -> None:
    """No Content-Length: the size is unknown until it is past the cap."""
    sock.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n")
    block = b" " * 65536
    for _ in range(signal_forward.MAX_REPLY // len(block) + 2):
        sock.sendall(block)


def close_delimited_trickle(sock: socket.socket, _raw: bytes) -> None:
    sock.sendall(
        b'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{"a":'
    )
    for _ in range(400):
        sock.sendall(b" ")
        time.sleep(0.05)


def chunked_reply(size: int) -> Callable[[socket.socket, bytes], None]:
    """A chunked JSON reply of ``size`` bytes in 64 KiB chunks."""

    def script(sock: socket.socket, _raw: bytes) -> None:
        sock.sendall(
            b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n"
            b"Transfer-Encoding: chunked\r\n\r\n"
        )
        body = b'{"pad": "' + b"x" * (size - 11) + b'"}'
        for start in range(0, len(body), 65536):
            piece = body[start : start + 65536]
            sock.sendall(b"%x\r\n%s\r\n" % (len(piece), piece))
        sock.sendall(b"0\r\n\r\n")

    return script


def header_flood(sock: socket.socket, _raw: bytes) -> None:
    lines = "".join(f"X-{n}: y\r\n" for n in range(300))
    sock.sendall(f"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n{lines}\r\n{{}}".encode())


BROKEN = {
    "chunked over the cap": chunked_reply(signal_forward.MAX_REPLY + 1),
    "more than a hundred headers": header_flood,
    "a header line of 100 KiB": answer(reply_bytes(extra=("X-Long: " + "y" * 100_000,))),
    "redirect": answer(
        reply_bytes(b"", status="302 Found", extra=("Location: http://127.0.0.1:1/",))
    ),
    "redirect with a json body": answer(
        reply_bytes(b"{}", status="307 Temporary Redirect", extra=("Location: /api/me",))
    ),
    "no content": answer(reply_bytes(b"", status="204 No Content", kind=None)),
    "html": answer(reply_bytes(b"<html></html>", kind="text/html")),
    "no content type": answer(reply_bytes(b"{}", kind=None)),
    "json lookalike": answer(reply_bytes(b"{}", kind="application/jsonp")),
    "encoded": answer(reply_bytes(b"{}", extra=("Content-Encoding: gzip",))),
    "declared over the cap": answer(reply_bytes(b"{}", length=signal_forward.MAX_REPLY + 1)),
    "streamed over the cap": stream_over_the_cap,
    "one byte over the cap": answer(reply_bytes(b" " * (signal_forward.MAX_REPLY + 1))),
    "truncated": answer(reply_bytes(b'{"a"', length=100)),
    "not http": answer(b"\x00\x01 this is not http\r\n\r\n"),
    "closes without a reply": answer(b""),
}


@pytest.mark.parametrize("name", list(BROKEN))
def test_an_upstream_reply_that_cannot_be_passed_on_is_502(
    root: Path, web: Path, name: str, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO)
    with upstream(BROKEN[name]) as fake, react(root, web, fake.url) as server:
        cookie = {"Cookie": "signal_name=Dana%20Reyes"}
        status, body, headers = call(server, "/signal/api/me", headers=cookie)
        assert (status, json.loads(body)) == (502, NOT_REACHABLE)
        assert header(headers, "Cache-Control") == "no-store"
        assert header(headers, "Location") is None
        assert fake.connections == 1  # a redirect was not followed
    failures = [r for r in caplog.records if r.name == signal_forward.log.name]
    assert len(failures) == 1 and failures[0].levelno == logging.WARNING
    assert "Dana" not in caplog.text and "signal_name" not in caplog.text


def test_a_redirect_to_a_live_server_is_not_followed(root: Path, web: Path) -> None:
    with upstream(answer(reply_bytes())) as target:
        redirect = reply_bytes(b"{}", status="302 Found", extra=(f"Location: {target.url}api/me",))
        with forwarded(root, web, answer(redirect)) as (server, fake):
            assert call(server, "/signal/api/me")[0] == 502
            settle()
            assert (fake.connections, target.connections) == (1, 0)


def test_a_silent_upstream_times_out_to_502(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(signal_forward, "IO_TIMEOUT", 0.4)
    with forwarded(root, web, silence) as (server, _):
        started = time.monotonic()
        status, body, _ = call(server, "/signal/api/me")
        assert (status, json.loads(body)) == (502, NOT_REACHABLE)
        assert time.monotonic() - started < 2.5


@pytest.mark.parametrize("script", [trickle, close_delimited_trickle])
def test_an_upstream_that_trickles_is_cut_at_the_deadline(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch, script: Callable[..., None]
) -> None:
    monkeypatch.setattr(signal_forward, "DEADLINE", 0.6)
    with forwarded(root, web, script) as (server, _):
        started = time.monotonic()
        status, body, _ = call(server, "/signal/api/snapshot")
        assert (status, json.loads(body)) == (502, NOT_REACHABLE)
        assert time.monotonic() - started < 3


def test_a_dead_signal_is_502_and_the_rest_of_the_server_answers(root: Path, web: Path) -> None:
    with react(root, web, f"http://127.0.0.1:{NO_UPSTREAM}/") as server:
        for method in ("GET", "POST", "DELETE"):
            status, body, _ = call(server, "/signal/api/stories/1/save", method)
            assert (status, json.loads(body)) == (502, NOT_REACHABLE)
        assert call(server, "/connected/context")[0] == 200
        assert call(server, "/signal")[0] == 200


def test_an_upstream_error_status_and_body_pass_through(root: Path, web: Path) -> None:
    body = b'{"error": "the service failed; see its log"}'
    with forwarded(root, web, answer(reply_bytes(body, status="500 Internal Server Error"))) as (
        server,
        _,
    ):
        assert call(server, "/signal/api/status")[:2] == (500, body)


# -- where the page and the forwarding exist -----------------------------------------------------


def test_the_signal_page_is_the_app_page_and_only_where_a_signal_url_is_set(
    root: Path, web: Path
) -> None:
    with react(root, web, "http://127.0.0.1:1/") as server:
        home = call(server, "/")
        assert home[0] == 200
        for path in ("/signal", "/signal/"):
            status, page, headers = call(server, path)
            assert (status, page) == (200, home[1])
            assert header(headers, "X-Frame-Options") == "DENY"
            assert header(headers, "Cache-Control") == "no-store"
        assert call(server, "/signal/other")[0] == 404
        assert call(server, "/signal/x/y")[0] == 404
        assert call(server, "/Signal")[0] == 404
    with react(root / "plain", web, "") as server:
        for path in ("/signal", "/signal/", "/signal/api/me", "/signal/api/snapshot"):
            assert call(server, path)[0] == 404
        for method in ("POST", "DELETE"):
            assert call(server, "/signal/api/me", method)[0] == 404
        assert call(server, "/signal/api/me", "PUT")[0] == 501
        assert b"credit-os-signal-url" not in call(server, "/")[1]


def test_the_read_only_preview_has_neither_the_page_nor_the_forwarding(
    root: Path, web: Path
) -> None:
    with (
        upstream(answer(reply_bytes())) as fake,
        react(root, web, fake.url, read_only=True) as server,
    ):
        for path in ("/signal", "/signal/", "/signal/api/me", "/signal/api/snapshot"):
            assert call(server, path)[0] == 404, path
        for method in ("POST", "DELETE"):
            assert call(server, "/signal/api/stories/1/save", method)[0] == 404
        assert call(server, "/api/submissions", "POST")[0] == 405  # the preview's own refusal
        assert b"credit-os-signal-url" not in call(server, "/")[1]
        settle()
        assert fake.connections == 0


def test_the_target_is_fixed_by_the_validated_link() -> None:
    forwarder = signal_forward.SignalForwarder("http://signal.internal:8770/")
    assert (forwarder.host, forwarder.port, forwarder.address) == (
        "signal.internal",
        8770,
        "signal.internal:8770",
    )
    for link in ("https://x:1/", "http://x/", "x"):
        with pytest.raises(ValueError, match="Signal link"):
            signal_forward.SignalForwarder(link)
    with pytest.raises(ValueError, match="signal-url"):
        make_server_refusing("http://user@x:1/")


def make_server_refusing(link: str) -> None:
    with TemporaryDirectory() as folder, TemporaryDirectory() as web:
        (Path(web) / "index.html").write_text(
            "<html><head><meta content=\"connect-src 'none'\"></head></html>", encoding="utf-8"
        )
        with make_server(Path(folder), web=Path(web), signal_url=link):
            pytest.fail("accepted a link with a login")
