"""The hardened ``http.server`` base of the run start service, and through it of the React
application's server, which hosts Signal.

The service has no login and may be reachable from other machines, so every request is hostile
input. The rules are specified in the module docstring of ``run_start/service.py``; this module is
their one implementation. Plain ``http.server``; no framework.

What every service on this base shares lives here: the server with its connection ceiling, the
reply type, the checks every request passes before any body byte is read
(``Handler.serve_request``, in this order: the target is a path, ``Host``, ``Sec-Fetch-Site``,
``Origin``, no ``Transfer-Encoding``; an HTTP/0.9 request line is closed with no reply before
them), the ``Content-Length`` and JSON body rules, the headers every response carries, the fixed
500, and the way a file is served (``contained_file``).

What a service may set differently is a named parameter, never a branch on which service it is.
The run start service and the application built on it set the two that are left:

``Server.connection_limits``
    The most connections open at once, read for every connection.
``Handler.logger``
    The service's own logger.

Routes, methods, body size limits and the kind of JSON value accepted stay in each service.
"""

from __future__ import annotations

import ipaddress
import json
import logging
import mimetypes
import os
import socket
import threading
import urllib.parse
from collections.abc import Callable, Mapping
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, cast

from deploy_workflow.platform_io import flags as flag_bits
from deploy_workflow.platform_io import regular_open

__all__ = [
    "FAILED",
    "JSON",
    "WILDCARD_MESSAGE",
    "Body",
    "ClientGone",
    "Handler",
    "Reply",
    "Server",
    "contained_file",
    "hosts",
    "json_value",
    "read_regular",
    "refuse",
    "wildcard",
]

log = logging.getLogger(__name__)

JSON = "application/json; charset=utf-8"
FAILED = "the service failed; see its log"
WILDCARD_MESSAGE = (
    "--host: pass this machine's own address, not 0.0.0.0 (no Host header would match)"
)


class ClientGone(Exception):
    """The client's connection failed while its request body was being read."""


class Body:
    """The request body, whose reads turn a reset or timeout of the client's connection into
    ``ClientGone``, so that the same errors raised elsewhere are not taken for a client leaving."""

    def __init__(self, stream: Any) -> None:
        self._stream = stream

    def read(self, size: int = -1) -> bytes:
        try:
            return cast(bytes, self._stream.read(size))
        except (ConnectionError, TimeoutError) as error:
            raise ClientGone(str(error)) from error


class Reply(Exception):  # control flow: it carries the response, not a failure
    def __init__(self, status: int, body: Any, headers: dict[str, str] | None = None) -> None:
        super().__init__(status)
        self.status, self.body, self.headers = status, body, headers or {}


def refuse(status: int, text: str) -> Reply:
    return Reply(status, {"error": text})


class Server(ThreadingHTTPServer):
    """A server bound to ``address`` as given, answering only to that host and its bound port."""

    daemon_threads = True
    allowed_hosts: frozenset[str]
    advertised_port: int

    def __init__(self, address: tuple[str, int], handler: type[BaseHTTPRequestHandler]) -> None:
        self.active_connections = 0
        self._count = threading.Lock()
        super().__init__(address, handler)
        self.advertised_port = self.server_address[1]
        self.allowed_hosts = hosts(address[0], self.advertised_port)

    def connection_limits(self) -> int:
        """The most connections open at once."""
        raise NotImplementedError

    def verify_request(self, request: Any, client_address: Any) -> bool:
        most = self.connection_limits()
        with self._count:
            if self.active_connections >= most:
                return False  # closed by the server loop with no handler thread
            self.active_connections += 1
        return True

    def _release(self) -> None:
        with self._count:
            self.active_connections -= 1

    def process_request(self, request: Any, client_address: Any) -> None:
        try:
            super().process_request(request, client_address)
        except BaseException:
            # the handler thread never ran (the OS refused it), so it cannot release
            self._release()
            raise

    def process_request_thread(self, request: Any, client_address: Any) -> None:
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._release()


class Handler(BaseHTTPRequestHandler):
    """One request per connection, checked before any body byte is read.

    A service subclasses this, sets ``timeout`` and ``server_version``, and gives each ``do_*``
    method it serves a call of ``serve_request`` with its route.
    """

    sys_version = ""
    logger: logging.Logger = log

    def log_message(self, format: str, *args: Any) -> None:
        self.logger.info("%s %s", self.address_string(), format % args)

    def serve_request(self, route: Callable[[urllib.parse.SplitResult], Reply | None]) -> None:
        """Check the request, then send what ``route`` returns or raises; None is a 404."""
        if self.request_version == "HTTP/0.9":
            self.close_connection = True  # no headers exist to check and none can be sent
            self.logger.info("%s: HTTP/0.9 request closed", self.address_string())
            return
        try:
            if not self.path.startswith("/"):
                raise refuse(400, "the request target must be a path")
            self.check_origin()
            if self.headers.get("Transfer-Encoding") is not None:
                raise refuse(411, "a body needs Content-Length")
            reply = route(urllib.parse.urlsplit(self.path))
            if reply is None:
                raise refuse(404, "not found")
            self.send_reply(reply)
        except Reply as reply:
            self.send_reply(reply)
        except ClientGone as gone:
            # A client that reset or stalled mid-body is not a service failure: one info line. Only
            # the reading of the request body raises this; the same errors met anywhere else (a
            # timeout on the shared folder) fall to the 500 below.
            self.logger.info("%s %s: connection lost (%s)", self.command, self.path, gone)
            self.close_connection = True
        except Exception:
            # The only catch-all, documented: whatever a handler raises becomes a 500 with fixed
            # text. The traceback goes to the log; neither it, the exception text nor any
            # environment value (the provider key) reaches the client. KeyboardInterrupt and
            # SystemExit (BaseException) are not caught.
            self.logger.exception("%s %s", self.command, self.path)
            self.send_reply(refuse(500, FAILED))

    def check_origin(self) -> None:
        service = cast(Server, self.server)
        found = self.headers.get_all("Host") or []
        if len(found) != 1 or found[0] not in service.allowed_hosts:
            raise refuse(403, "this address is not the one the service was started on")
        site = self.headers.get_all("Sec-Fetch-Site")
        if site is not None and site not in (["same-origin"], ["none"]) and not self.navigation():
            raise refuse(403, "the request came from another site")
        origins = self.headers.get_all("Origin") or []
        acceptable = [f"http://{found[0]}"]
        if service.advertised_port == 80 and found[0].endswith(":80"):
            acceptable.append(f"http://{found[0][:-3]}")  # browsers leave the default port out
        if (self.command != "GET" or origins) and not (
            len(origins) == 1 and origins[0] in acceptable
        ):
            raise refuse(403, "the request did not come from the service's own page")

    def navigation(self) -> bool:
        """A top-level navigation to a document: only a GET with both fetch-metadata values."""
        return (
            self.command == "GET"
            and self.headers.get_all("Sec-Fetch-Mode") == ["navigate"]
            and self.headers.get_all("Sec-Fetch-Dest") == ["document"]
        )

    def end_headers(self) -> None:
        # Here, not in send_reply, so the replies http.server writes itself (501, 400, 414) carry
        # them.
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def send_reply(self, reply: Reply) -> None:
        if isinstance(reply.body, bytes):
            data, headers = reply.body, reply.headers
        else:
            data = json.dumps(reply.body, ensure_ascii=False).encode("utf-8")
            headers = {"Content-Type": JSON, "Cache-Control": "no-store", **reply.headers}
        try:
            self.send_response(reply.status)
            self.send_header("Content-Length", str(len(data)))
            for name, value in headers.items():
                self.send_header(name, value)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)
        except OSError as error:  # the peer went away or stalled: nothing more can be said to it
            self.logger.info("%s %s: reply not delivered (%s)", self.command, self.path, error)

    def content_length(self) -> int:
        """``Content-Length`` as a number; 411 when absent, 400 when it is no length."""
        values = self.headers.get_all("Content-Length") or []
        if self.headers.get("Transfer-Encoding") is not None or not values:
            raise refuse(411, "a body needs Content-Length")
        text = values[0].strip()
        if len(values) != 1 or not (text.isascii() and text.isdigit()) or len(text) > 15:
            raise refuse(400, "Content-Length is not a length")
        return int(text)

    def sized_body(self, limit: int) -> bytes:
        """The whole body, of at most ``limit`` bytes; 411, 413 or 400 otherwise."""
        length = self.content_length()
        if length > limit:
            raise refuse(413, f"a request body is at most {limit // 1024} KiB")
        data = Body(self.rfile).read(length)  # a connection that fails meanwhile is ClientGone
        if len(data) != length:
            raise refuse(400, "the request body ended early")
        return data

    def json_body(self, limit: int) -> Any:
        """The body as one JSON value of at most ``limit`` bytes; 411, 413 or 400 otherwise."""
        return json_value(self.sized_body(limit))


def json_value(data: bytes) -> Any:
    """``data`` as the one JSON value it spells in UTF-8; 400 otherwise."""
    try:
        return json.loads(data.decode("utf-8"))
    except (ValueError, RecursionError):  # bad UTF-8, bad JSON, or nesting past the parser
        raise refuse(400, "the request body is not valid JSON") from None


def contained_file(
    base: Path,
    relative: str,
    *,
    direct: bool,
    headers: Mapping[str, str],
    logger: logging.Logger = log,
) -> Reply:
    """The reply serving a regular file inside ``base``; anything else is a 404.

    The final path is decided first (``index.html`` appended for a folder), then resolved with
    links followed, and that resolved path is what is checked and read. ``direct`` also
    requires the file to sit in ``base`` itself. The type comes from the file name; ``headers``
    follow it.
    """
    root = base.resolve()
    data: bytes | None = None
    try:
        wanted = root / urllib.parse.unquote(relative, errors="strict").lstrip("/")
        if wanted.resolve().is_dir():
            wanted = wanted / "index.html"
        target = wanted.resolve()
        if target.is_relative_to(root) and (not direct or target.parent == root):
            data = read_regular(target, logger)
    except (UnicodeDecodeError, ValueError, OSError):  # not UTF-8, a NUL, a loop of links
        data = None
    if data is None:
        raise refuse(404, "not found")
    kind = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    return Reply(200, data, {"Content-Type": kind, **headers})


def read_regular(
    path: Path, logger: logging.Logger = log, *, limit: int | None = None
) -> bytes | None:
    """The bytes of ``path`` read from one handle, or None when it is not a regular file; with
    ``limit``, at most that many of them.

    The handle is opened by ``platform_io.regular_open`` (binary where the platform has the flag,
    without following a link, without waiting on a FIFO) and its own ``fstat`` decides, so a file
    swapped for a link after the path was checked is not read."""
    # O_NONBLOCK: opening a FIFO must not wait for a writer (it would hold this handler's thread).
    flags = flag_bits("O_RDONLY", "O_NOFOLLOW", "O_CLOEXEC", "O_NONBLOCK")
    try:
        fd = regular_open(path, flags)  # adds O_BINARY where it exists; refuses a link or non-file
    except (FileNotFoundError, NotADirectoryError, IsADirectoryError):
        return None
    except OSError as error:  # a link where O_NOFOLLOW forbids it (ELOOP), or not readable
        logger.info("library file %s not served: %s", path.name, error)
        return None
    with os.fdopen(fd, "rb") as handle:  # the handle owns the descriptor now
        return handle.read() if limit is None else handle.read(limit)


def wildcard(host: str) -> bool:
    """True when ``host`` is empty or resolves to an address that means every interface."""
    if not host:
        return True
    try:
        found = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except (socket.gaierror, UnicodeError):
        return False  # not an address: binding it fails with its own message
    for *_, sockaddr in found:
        address = ipaddress.ip_address(str(sockaddr[0]).partition("%")[0])
        mapped = getattr(address, "ipv4_mapped", None)
        if address.is_unspecified or (mapped is not None and mapped.is_unspecified):
            return True
    return False


def hosts(host: str, port: int) -> frozenset[str]:
    """The ``Host`` values answered for a service started on ``host:port``."""
    names = [host, "localhost"] if host == "127.0.0.1" else [host]
    allowed = {f"{name}:{port}" for name in names}
    if port == 80:
        allowed.update(names)  # a browser leaves the default port out of Host
    return frozenset(allowed)
