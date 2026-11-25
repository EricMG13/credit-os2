"""Signal inside the application's own process: its ``/signal/api/*`` routes and its loop.

There is one process and one port. The application's server answers a request under
``/signal/api/`` from Signal's route table (``deploy_workflow.signal.service.answer``) and, when
started with ``serve``, runs Signal's loop on a thread of its own. Nothing here opens a connection:
the only network use is the loop's, fetching the sources the owner approved.

A request reaches ``divert`` only after the application server's own checks (exact ``Host``,
``Origin`` on every write, ``Sec-Fetch-Site``, no ``Transfer-Encoding``: ``http_base.Handler``
runs them before any route). What is decided here:

* Where no Signal is hosted (the read-only preview, synthetic mode) every path under
  ``/signal/api/`` is 404, and PUT, PATCH, HEAD and OPTIONS keep the ``http.server`` 501.
* The path is Signal's with the ``/signal`` prefix dropped. Which paths and methods exist is the
  route table's: 404 for any other path, 405 with ``Allow`` for a listed path and another method.
* The query string goes with a GET only, printable ASCII and at most ``MAX_QUERY`` bytes (400).
* A body is read on a POST only, needs ``Content-Length`` where the route requires one (411), is
  at most ``MAX_BODY`` (413) and must be a JSON object (400); the read and the JSON rules are
  ``http_base``'s. A GET or DELETE that sends one is 400. PUT, PATCH, HEAD and OPTIONS have no
  route, so what they send is neither read nor judged: 405 or 404 as the route table says. An
  accepted body is read before the route runs; a refused request's is left unread, and the
  connection closes after the one reply.
* Every reply to a request whose target is under ``/signal/api/`` carries ``REPLY_HEADERS``, each
  once: Signal's own, the refusals of the application's checks, the fixed 500, and the replies
  ``http.server`` writes itself for a request it refuses (400, 414, 431, 501, 505). They are added
  in the application's ``end_headers`` (``reply_headers``), which every reply passes through. A
  reply is data, never a document that may run, load or be framed.

Money. The AI pass runs only while its gate holds (``deploy_workflow.signal.ai_gate``), and one
of the gate's preconditions is the model adapter's key in the environment of the process that runs
the loop. The application's environment already carries that key for analysis runs, so here the
loop is given the launching environment only when it also sets ``CREDIT_OS_SIGNAL_AI=1``; otherwise
it is given an empty one and the gate reports the pass off for want of a key (``ai_environ``).
"""

from __future__ import annotations

import logging
import re
import sqlite3
import threading
import urllib.parse
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from pathlib import Path
from types import MappingProxyType
from typing import Any

from deploy_workflow import http_base
from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import ai_run, service, store
from deploy_workflow.signal.routing import Incoming

__all__ = [
    "AI_SWITCH",
    "PAGE_PATHS",
    "REPLY_HEADERS",
    "SignalHost",
    "ai_environ",
    "divert",
    "other_method",
    "reply_headers",
    "running",
]

API_PREFIX = "/signal/api/"
PAGE_PATHS = frozenset({"/signal", "/signal/"})
MAX_QUERY = 512
MAX_BODY = 64 * 1024
TICK = 60.0  # seconds between two passes of the loop
STOP_SECONDS = 5.0  # how long shutdown waits for a pass in flight (the thread is a daemon)
AI_SWITCH = "CREDIT_OS_SIGNAL_AI"
# A reply is data: it may load nothing, run nothing and be framed nowhere.
REPLY_HEADERS: Mapping[str, str] = MappingProxyType(
    {
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
        "X-Frame-Options": "DENY",
    }
)
_BODY_RULES = frozenset({"GET", "POST", "DELETE"})  # the methods the route table has routes for
_QUERY = re.compile(r"[\x21-\x7e]*")
_NO_ENVIRONMENT: Mapping[str, str] = MappingProxyType({})
log = logging.getLogger(__name__)


def ai_environ(environ: Mapping[str, str]) -> Mapping[str, str]:
    """The environment the hosted loop's AI gate reads: `environ` itself when it sets
    ``CREDIT_OS_SIGNAL_AI`` to exactly ``1``, else an empty one that cannot be written to."""
    return environ if environ.get(AI_SWITCH) == "1" else _NO_ENVIRONMENT


class SignalHost:
    """Signal as the application hosts it: the one background loop, over the store under `root`
    (``loop.root``).

    `environ` is the launching environment. Whether the loop's AI gate may read it is decided
    here, once (``ai_environ``): a process started without the switch stays off until it is
    started again. Building a host opens nothing and starts nothing."""

    def __init__(self, root: Path, *, environ: Mapping[str, str]) -> None:
        self.loop = service.Loop(root, ai=ai_run.Setup(environ=ai_environ(environ)))

    def answer(self, handler: http_base.Handler, url: urllib.parse.SplitResult) -> Reply:
        """The reply to one request under ``/signal/api/``; a refusal is raised as ``Reply``."""
        query = url.query if handler.command == "GET" else ""
        if len(query) > MAX_QUERY or not _QUERY.fullmatch(query):
            raise refuse(400, "the query string is not valid")
        data = _body(handler)
        request = Incoming(
            handler.command,
            url.path.removeprefix("/signal"),  # Signal's own routes start at /api/
            query,
            handler.headers.get("Cookie"),
            body=lambda: _json_object(data, required=True),
            optional_body=lambda: _json_object(data, required=False),
        )
        return service.answer(self.loop.root, self.loop, request)

    def recover(self) -> None:
        """What a start does before the first pass: open the store once and settle what a stop or
        crash cut short (``ai_run.recover``). OSError with ``signal serve``'s sentence when the
        store cannot be opened, so start-up stops there and not at each request."""
        try:
            db = store.open_db(self.loop.root)
            try:
                ai_run.recover(db, self.loop.ai)
            finally:
                db.close()
        except (OSError, sqlite3.Error, store.StoreError) as error:
            raise OSError(f"cannot open the store under {self.loop.root}: {error}") from error


def _body(handler: http_base.Handler) -> bytes | None:
    """The bytes a POST sent, at most ``MAX_BODY``; None when the request declares no length (a
    browser's bodiless DELETE has none; a bodiless POST has 0). A GET or DELETE takes no body; a
    method the route table has no route for is left to it, its body unread."""
    if handler.command not in _BODY_RULES or handler.headers.get_all("Content-Length") is None:
        return None
    if handler.command != "POST" and handler.content_length():
        raise refuse(400, "this request takes no body")
    return handler.sized_body(MAX_BODY)


def _json_object(data: bytes | None, *, required: bool) -> dict[str, Any]:
    """`data` as the JSON object a route reads. A route that requires a body refuses a request
    with no ``Content-Length`` (411); one whose body is optional reads {} for none or no bytes."""
    if not required and not data:
        return {}
    if data is None:
        raise refuse(411, "a body needs Content-Length")
    found = http_base.json_value(data)
    if not isinstance(found, dict):
        raise refuse(400, "the request body must be a JSON object")
    return found


def _api_path(path: str) -> bool:
    """Whether `path` is under ``/signal/api/``, or is ``/signal/api`` itself (refused alike)."""
    return path.startswith(API_PREFIX) or path == API_PREFIX.rstrip("/")


def _api_target(target: str) -> bool:
    """``_api_path`` for a request target as received; one that cannot be split is not."""
    try:
        return _api_path(urllib.parse.urlsplit(target).path)
    except ValueError:
        return False


def divert(
    host: SignalHost | None, handler: http_base.Handler, url: urllib.parse.SplitResult
) -> None:
    """Raise the reply to a request under ``/signal/api/``: Signal's own, or 404 where none is
    hosted. Any other request passes."""
    if _api_path(url.path):
        if host is None:
            raise refuse(404, "not found")
        raise host.answer(handler, url)


# `host` comes second here, unlike in ``divert``: the application binds it with ``partialmethod``,
# which passes the handler (self) first.
def other_method(handler: http_base.Handler, host: SignalHost | None) -> None:
    """PUT, PATCH, HEAD and OPTIONS: under ``/signal/api/`` where Signal is hosted, what its route
    table says (405 for a listed path, else 404); anywhere else the ``http.server`` 501."""
    if host is None or not _api_target(handler.path):
        handler.send_error(501, f"Unsupported method ({handler.command!r})")
        return
    handler.serve_request(lambda url: divert(host, handler, url))


def reply_headers(host: SignalHost | None, request_line: bytes) -> Mapping[str, str]:
    """The headers every reply to the request that began with `request_line` carries besides its
    own: ``REPLY_HEADERS`` for a target under ``/signal/api/`` where Signal is hosted, none
    anywhere else. The line is the one received (``raw_requestline``), read as ``http.server``
    reads it, because that server refuses some requests before it has a path."""
    words = request_line.decode("iso-8859-1").split()
    hosted = host is not None and len(words) > 1 and _api_target(words[1])
    return REPLY_HEADERS if hosted else {}


@contextmanager
def running(host: SignalHost | None, tick: float = TICK) -> Iterator[None]:
    """Run the hosted loop for the length of the block: recovery, then a pass every `tick`
    seconds on one thread, stopped and joined on the way out; a pass still running after
    ``STOP_SECONDS`` is left to its daemon thread, with a warning. With no host, nothing."""
    if host is None:
        yield
        return
    host.recover()
    stop = threading.Event()
    worker = threading.Thread(
        target=host.loop.run_until, args=(stop, tick), name="signal-loop", daemon=True
    )
    worker.start()
    try:
        yield
    finally:
        stop.set()
        worker.join(timeout=STOP_SECONDS)
        if worker.is_alive():
            log.warning(
                "a Signal pass was still running at shutdown; it was left to end with the process"
            )
