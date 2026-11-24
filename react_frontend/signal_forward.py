"""Forward the browser's ``/signal/api/*`` calls to the one Signal service this process was
started with (``--signal-url``). Plain ``http.client``; no framework.

The browser never calls Signal itself. The local request has already passed this server's own
checks (exact ``Host``, ``Origin`` on every write, ``Sec-Fetch-Site``: ``http_base.Handler``
runs them before any route), so what is decided here is only what may leave this process:

* The target (host and port) is fixed from the validated ``--signal-url`` at start-up. Nothing in a
  request chooses a host, port or scheme: the path is matched against a strict allowlist
  (``/signal/api/`` and lowercase letters, digits and ``/`` between segments: no ``.``, ``%``,
  empty segment or trailing ``/``) and anything else is 404 before a connection is opened.
* GET, POST and DELETE only (405 otherwise). The query string goes with a GET only, printable ASCII
  and at most ``MAX_QUERY`` bytes. A POST body is at most ``MAX_BODY`` (64 KiB, Signal's own limit).
* The outbound request carries ``Host`` and, for a write, ``Origin`` of Signal's own address (its
  service requires them), ``Content-Type`` and ``Content-Length`` when there is a body, and the one
  ``signal_name=<value>`` pair of the browser's ``Cookie`` when it is well formed. No other browser
  header is sent, and no other cookie.
* Signal's answer is trusted for nothing but its status, a JSON body of at most ``MAX_REPLY`` bytes
  (the snapshot is a few hundred KiB; 4 MiB leaves room to grow while bounding what 64 concurrent
  requests can hold) and a ``Set-Cookie`` that sets ``signal_name`` in the form Signal writes it.
  A redirect, a body over the cap, another content type or encoding, a failed or slow connection
  (``IO_TIMEOUT`` per read, ``DEADLINE`` for the whole exchange) is 502 ``Signal is not reachable``.
"""

from __future__ import annotations

import http.client
import logging
import re
import socket
import threading
import urllib.parse

from deploy_workflow import http_base
from deploy_workflow.http_base import Reply, refuse

__all__ = ["API_PREFIX", "PAGE_PATHS", "SignalForwarder", "divert", "is_api", "other_method"]

log = logging.getLogger(__name__)

API_PREFIX = "/signal/api/"
PAGE_PATHS = frozenset({"/signal", "/signal/"})
METHODS = ("GET", "POST", "DELETE")
MAX_PATH = 128
MAX_QUERY = 512
MAX_BODY = 64 * 1024
MAX_REPLY = 4 * 1024 * 1024
IO_TIMEOUT = 5.0  # seconds one connect or read may wait
DEADLINE = 10.0  # seconds the whole exchange may last, however slowly Signal trickles
_CHUNK = 64 * 1024
_COOKIE = "signal_name"
_PATH = re.compile(r"/signal/api/[a-z0-9]+(?:/[a-z0-9]+)*")
_QUERY = re.compile(r"[\x21-\x7e]*")
_COOKIE_VALUE = re.compile(r"[A-Za-z0-9%._~-]{1,1024}")
_SET_COOKIE = re.compile(
    rf"{_COOKIE}=[A-Za-z0-9%._~-]{{0,1024}}"
    r"(?:; (?:Path=/|Max-Age=[0-9]{1,10}|SameSite=(?:Strict|Lax)|HttpOnly|Secure))*"
)
_UNREACHABLE = "Signal is not reachable"


def is_api(path: str) -> bool:
    """Whether ``path`` is in the forwarded area (it may still be refused as a path)."""
    return path.startswith(API_PREFIX)


class _Failed(Exception):
    """Signal's answer cannot be passed on; the text is for the log only."""


def _cookie_pair(headers: list[str]) -> str | None:
    """``signal_name=<value>`` from the browser's Cookie headers, or None; the first one counts, as
    in Signal, and a value outside the plain cookie alphabet is dropped, never repaired."""
    for header in headers:
        for part in header.split(";"):
            key, sep, value = part.partition("=")
            if sep and key.strip() == _COOKIE:
                value = value.strip()
                return f"{_COOKIE}={value}" if _COOKIE_VALUE.fullmatch(value) else None
    return None


def _set_cookie(headers: list[str]) -> str | None:
    """The first Set-Cookie that sets ``signal_name`` in the form Signal writes it, or None."""
    return next((value for value in headers if _SET_COOKIE.fullmatch(value)), None)


def _read_capped(response: http.client.HTTPResponse) -> bytes:
    if response.length is not None and response.length > MAX_REPLY:  # as http.client read it
        raise _Failed("the reply is over the size cap")
    chunks: list[bytes] = []
    size = 0
    while chunk := response.read(min(_CHUNK, MAX_REPLY + 1 - size)):
        size += len(chunk)
        if size > MAX_REPLY:
            raise _Failed("the reply is over the size cap")
        chunks.append(chunk)
    if response.length:  # read(n) ends quietly at a closed connection: fewer bytes than declared
        raise _Failed("the reply ended before its declared length")
    return b"".join(chunks)


def _cut(connection: socket.socket, expired: threading.Event) -> None:
    expired.set()
    try:
        connection.shutdown(socket.SHUT_RDWR)  # wakes a read blocked on a trickling reply
    except OSError:  # already closed
        return


class SignalForwarder:
    """The fixed target of every forwarded call: Signal's host and port."""

    def __init__(self, link: str) -> None:
        """``link`` is ``run_start.service.signal_link``'s normalised ``http://host:port/``."""
        parts = urllib.parse.urlsplit(link)
        if parts.scheme != "http" or not parts.hostname or parts.port is None:
            raise ValueError("a Signal link is http://<host>:<port>/")
        self.host, self.port = parts.hostname, parts.port
        self.address = f"{self.host}:{self.port}"

    def handle(self, handler: http_base.Handler, url: urllib.parse.SplitResult) -> Reply:
        """The reply to one local request for ``url``; a refusal is raised as ``Reply``."""
        path = url.path
        if url.scheme or url.netloc or len(path) > MAX_PATH or not _PATH.fullmatch(path):
            raise refuse(404, "not found")
        method = handler.command
        if method not in METHODS:
            raise Reply(405, {"error": "method not allowed"}, {"Allow": ", ".join(METHODS)})
        query = url.query if method == "GET" else ""
        if len(query) > MAX_QUERY or not _QUERY.fullmatch(query):
            raise refuse(400, "the query string is not valid")
        body = self._body(handler)
        headers = {"Host": self.address, "Connection": "close"}
        if method != "GET":
            headers["Origin"] = f"http://{self.address}"
        if method == "POST":
            headers["Content-Length"] = str(len(body))
            if body:
                headers["Content-Type"] = "application/json"
        cookie = _cookie_pair(handler.headers.get_all("Cookie") or [])
        if cookie is not None:
            headers["Cookie"] = cookie
        try:
            sent = path.removeprefix("/signal")  # Signal's own routes start at /api/
            return self._exchange(method, f"{sent}?{query}" if query else sent, headers, body)
        except (OSError, http.client.HTTPException, _Failed) as error:
            # One line per failed request: the method and path, the failure's type and the start of
            # its text (it may quote what Signal sent). Never the headers, so never the cookie.
            log.warning(
                "Signal forward %s %s failed: %s: %.200s", method, path, type(error).__name__, error
            )
            raise refuse(502, _UNREACHABLE) from None

    @staticmethod
    def _body(handler: http_base.Handler) -> bytes:
        """The body a POST sent, at most ``MAX_BODY``; any other method sends none."""
        if handler.headers.get_all("Content-Length") is None:
            return b""  # a browser's bodiless DELETE has no length; a bodiless POST has 0
        length = handler.content_length()
        if length and handler.command != "POST":
            raise refuse(400, "this request takes no body")
        if length > MAX_BODY:
            raise refuse(413, f"a request body is at most {MAX_BODY // 1024} KiB")
        data = handler.read_body(length)
        if len(data) != length:
            raise refuse(400, "the request body ended early")
        return data

    def _exchange(self, method: str, target: str, headers: dict[str, str], body: bytes) -> Reply:
        connection = http.client.HTTPConnection(self.host, self.port, timeout=IO_TIMEOUT)
        expired = threading.Event()
        timer: threading.Timer | None = None
        try:
            connection.connect()
            assert connection.sock is not None
            timer = threading.Timer(DEADLINE, _cut, args=(connection.sock, expired))
            timer.daemon = True
            timer.start()
            connection.request(method, target, body=body or None, headers=headers)
            response = connection.getresponse()
            data = _read_capped(response)
            if expired.is_set():
                raise _Failed("the reply did not finish in time")
            return self._reply(response, data)
        finally:
            if timer is not None:
                timer.cancel()
            connection.close()

    @staticmethod
    def _reply(response: http.client.HTTPResponse, data: bytes) -> Reply:
        if not (200 <= response.status < 300 or 400 <= response.status < 600):
            raise _Failed(f"unexpected status {response.status}")  # a redirect is never followed
        kind = (response.getheader("Content-Type") or "").partition(";")[0].strip().lower()
        if kind != "application/json":
            raise _Failed(f"unexpected content type {kind!r}")
        if (response.getheader("Content-Encoding") or "identity").strip().lower() != "identity":
            raise _Failed("the reply is encoded")
        headers = {"Content-Type": http_base.JSON, "Cache-Control": "no-store"}
        cookie = _set_cookie(response.headers.get_all("Set-Cookie") or [])
        if cookie is not None:
            headers["Set-Cookie"] = cookie
        return Reply(response.status, data, headers)


def divert(
    forwarder: SignalForwarder | None, handler: http_base.Handler, url: urllib.parse.SplitResult
) -> None:
    """Raise the reply to a request under ``/signal/api/``: forwarded to Signal, or 404 where no
    Signal service is set (the read-only preview included). Any other request passes."""
    if is_api(url.path):
        if forwarder is None:
            raise refuse(404, "not found")
        raise forwarder.handle(handler, url)


def other_method(handler: http_base.Handler, forwarder: SignalForwarder | None) -> None:
    """PUT, PATCH, HEAD and OPTIONS: 405 under ``/signal/api/`` where Signal is set, else the
    ``http.server`` default of 501."""
    if forwarder is None or not is_api(urllib.parse.urlsplit(handler.path).path):
        handler.send_error(501, f"Unsupported method ({handler.command!r})")
        return
    handler.serve_request(lambda url: divert(forwarder, handler, url))
