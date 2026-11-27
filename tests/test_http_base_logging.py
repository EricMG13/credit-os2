"""Log lines built from request-controlled text carry no raw control character.

Scope: ``deploy_workflow.http_base.Handler`` logging (the access line from ``log_message`` and the
lines ``serve_request`` writes), driven over a real socket through the toy service of
``test_http_base``. Replies and status codes are checked only to show they are unchanged.
"""

from __future__ import annotations

import logging
from collections.abc import Iterator

import pytest

from tests.test_http_base import Toy, _PlainHandler


@pytest.fixture
def toy() -> Iterator[Toy]:
    made = Toy()
    yield made
    made.server.shutdown()
    made.server.server_close()


def _messages(caplog: pytest.LogCaptureFixture) -> list[str]:
    return [record.getMessage() for record in caplog.records if record.name == "toy"]


@pytest.mark.parametrize(
    ("target", "escaped"),
    [
        ("/\x1b[31mFAKE", "/\\x1b[31mFAKE"),
        ("/a\x01b", "/a\\x01b"),
        ("/a\x7fb", "/a\\x7fb"),
    ],
)
def test_the_access_line_escapes_control_characters_of_the_request_line(
    toy,
    caplog,
    target,
    escaped,
):
    caplog.set_level(logging.INFO, logger="toy")
    status, _, body = toy.ask("GET", target)
    assert (status, body) == (404, b'{"error": "not found"}')
    lines = _messages(caplog)
    assert lines == [f'127.0.0.1 "GET {escaped}" 404 -']
    assert all("\x1b" not in line for line in lines)


def test_the_failure_line_logs_the_path_without_the_query_and_no_raw_escape(toy, caplog):
    caplog.set_level(logging.INFO, logger="toy")
    status, _, _ = toy.ask("GET", "/boom?\x1b[2J")
    assert status == 500
    failure = [m for m in _messages(caplog) if m.startswith("GET /boom")]
    assert failure == ["GET /boom"]
    assert all("\x1b" not in m and "2J" not in m for m in _messages(caplog))


def test_a_plain_request_line_is_logged_unchanged(toy, caplog):
    caplog.set_level(logging.INFO, logger="toy")
    assert toy.ask("GET", "/")[0] == 200
    assert _messages(caplog) == ['127.0.0.1 "GET /" 200 -']


def test_a_carriage_return_and_line_feed_in_the_method_or_path_cannot_forge_a_line(caplog):
    # CR and LF cannot ride in a request line the parser accepts, so the handler is driven
    # directly. The query (with its control bytes) is dropped; method and path are escaped.
    caplog.set_level(logging.INFO, logger="toy")
    handler = object.__new__(_PlainHandler)
    handler.client_address = ("127.0.0.1", 1)
    handler.command = "G\rE\nT"
    handler.path = "/a\r\nINFO forged \x85?q=\x1b[2J"
    handler.log_message("%s", "ignored")
    assert _messages(caplog) == ["127.0.0.1 G\\x0dE\\x0aT /a\\x0d\\x0aINFO forged \\x85"]


def test_a_c1_byte_in_the_request_line_is_escaped_in_the_access_line(toy, caplog):
    caplog.set_level(logging.INFO, logger="toy")
    answer = toy.raw(f"GET /a\x9fb HTTP/1.1\r\nHost: {toy.host}\r\n\r\n".encode("latin-1"))
    assert answer.startswith(b"HTTP/1.0 404")
    assert _messages(caplog) == ['127.0.0.1 "GET /a\\x9fb" 404 -']
