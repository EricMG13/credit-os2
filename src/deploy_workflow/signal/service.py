"""Signal's service without a transport: the route table of the JSON API the React Signal
screens read, and the background loop.

There is one caller, ``react_frontend`` (``react_frontend.signal_host``). The application's server
answers ``/signal/api/*`` in its own process by calling ``answer`` with the ``/signal`` prefix
dropped, and runs ``Loop`` on one thread. This module listens on no socket and serves no page and no
file. What belongs to a transport is decided there, not here: the ``Host``, ``Origin`` and
``Sec-Fetch-Site`` checks, the body's rules (a body on a POST only, ``Content-Length``, 64 KiB, a
JSON object), the headers every reply carries, the connection limits, the fixed 500 and the
loop's tick.

``GET /api/snapshot`` is the whole reader-facing state for the asking user
(``deploy_workflow.signal.snapshot``); ``?topic=<id>`` and ``?thread=<id>`` ask it to carry that
topic's older stories and that thread's comments (decimal ids, else 400; an id naming nothing the
asker can see is ignored). ``?format=2`` asks for the format with filing and market stories and
the issuer keys (``?issuer=<id>``: that issuer's older stories); without it (or ``format=1``) the
reply is what the current React reader accepts; any other format is 400. Beside ``scenes`` the
reply carries ``asOf``, the time it was built (UTC, ISO 8601), which the page sends back as
``seen`` when it marks a thread read (``POST /api/threads/<id>/read``), so nothing that arrived
after the page was drawn is marked read. The other routes read pages of the feed and save or follow.

Only the routes in ``_ROUTES`` exist; any other path is 404 and a listed path with another method
is 405 with ``Allow``. A query string holds at most ``MAX_PARAMS`` parameters (else 400). No
request path is ever joined to a directory, so no file under the data root is reachable.

Identity is the account already checked by the application's one request gate. The Signal request
receives that account directly; it never parses the cookie or opens the account store. An Analyst
maps to a writer and an Admin maps to an owner for Signal's existing permissions. Admin
moderation is available through exact routes in ``api_admin``; the AI cap remains on the command
line. Every API route except ``/api/me``, ``/api/status`` and ``/api/snapshot`` needs an account
(401 otherwise);
the snapshot of a viewer with no account holds no stories, no groups and no person's name. Each
request opens its own database connection and closes it; the loop has its own.

A refusal is ``{"error": "<plain sentence>"}``, returned or raised as ``http_base.Reply``. Whatever
else a handler raises passes through ``answer`` to the caller, whose server answers 500
``{"error": "the service failed; see its log"}``, the cause in its log only.
"""

from __future__ import annotations

import dataclasses
import logging
import re
import sqlite3
import threading
import urllib.parse
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path

from deploy_workflow.http_base import Reply as _Reply
from deploy_workflow.http_base import refuse as _refuse
from deploy_workflow.signal import (
    ai_gate,
    ai_run,
    api_admin,
    api_groups,
    api_issuers,
    api_logos,
    api_settings,
    feedview,
    fetch,
    identity,
    ingest,
    logos,
    market,
    snapshot,
    store,
    topics,
)
from deploy_workflow.signal.ingest import FetchFn
from deploy_workflow.signal.routing import ID as _ID
from deploy_workflow.signal.routing import NEEDS_NAME as _NEEDS_NAME
from deploy_workflow.signal.routing import Incoming as _Incoming
from deploy_workflow.signal.routing import LoopState
from deploy_workflow.signal.routing import Req as _Req
from deploy_workflow.signal.routing import Route as _Route

__all__ = ["Loop", "answer"]

log = logging.getLogger(__name__)

MAX_PARAMS = 20  # the most parameters one query string may hold


def _fetch_logo(url: str) -> fetch.Fetched:
    """A logo fetch: every rule of ``fetch.fetch``, the icon cap, the ordinary client."""
    return fetch.fetch(url, None, None, limit=logos.MAX_BYTES, accept=logos.ACCEPT)


class Loop:
    """The background loop: one pass per tick, the ingest of the approved sources that are due,
    then the approved sources' logos that are due (``logos.run_due``), then the AI pass over the
    new stories, then the digests that are due, then the day's market post when it is due
    (``market.run_due``). The jobs fail alone: each has its own connection and its own recorded
    error. Logos are fetched with `logo_fetch`; left out, with the real fetcher when no `fetch_fn`
    is given either (the hosted loop), and not at all when a `fetch_fn` stands in for the network (a
    test's fake world fetches no logo unless it gives one). The AI pass and the digests'
    writer get a model only while ``ai_gate`` says the pass is on (``ai_run``); `ai` holds the
    launching environment and the rulings folder it reads (the process's own by default)."""

    def __init__(
        self,
        root: Path,
        fetch_fn: FetchFn | None = None,
        ai: ai_run.Setup | None = None,
        logo_fetch: logos.LogoFetch | None = None,
    ) -> None:
        self.root = root
        self.fetch_fn = fetch_fn
        self.logo_fetch = logo_fetch or (_fetch_logo if fetch_fn is None else None)
        self.logo_error: str | None = None
        self.ai = ai_run.Setup() if ai is None else ai
        self.last_error: str | None = None  # the ingest job's
        self.ai_error: str | None = None
        self.digest_error: str | None = None
        self.market_error: str | None = None

    def run_once(self, now: datetime) -> None:
        """One pass: each job on its own connection; a failing job is logged and recorded."""
        self.last_error = self._job("ingest", lambda db: ingest.run_due(db, now, self.fetch_fn))
        self.logo_error = self._job("logos", lambda db: logos.run_due(db, now, self.logo_fetch))
        self.ai_error = self._job("AI", lambda db: ai_run.story_pass(db, now, self.ai))
        self.digest_error = self._job("digest", lambda db: ai_run.digest_pass(db, now, self.ai))
        self.market_error = self._job("market", lambda db: market.run_due(db, now, self._fetch))

    def _fetch(self, url: str, etag: str | None, modified: str | None) -> fetch.Fetched:
        chosen = fetch.fetch if self.fetch_fn is None else self.fetch_fn
        return chosen(url, etag, modified)

    def ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status:
        """The AI pass's status now (no model is built and no call made)."""
        return ai_run.status(db, now, self.ai)

    def shown_ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status:
        """The status a page shows: off, saying so, when a stored AI setting cannot be read."""
        return ai_run.shown_status(db, now, self.ai)

    def _job(self, name: str, job: Callable[[sqlite3.Connection], object]) -> str | None:
        """Run `job`; None when it finished, else the text /api/status shows for its failure."""
        try:
            db = store.open_db(self.root)
            try:
                job(db)
            finally:
                db.close()
        except Exception as error:
            # The one documented fail-open of the loop: whatever a job raises (a bug, a locked
            # store) must not end the service or stop the other job, so the traceback goes to the
            # log, the failure is shown by /api/status (its type only, never the cause), and the
            # next tick tries again. KeyboardInterrupt and SystemExit are not caught.
            log.exception("%s pass failed", name)
            return f"the last {name} pass failed ({type(error).__name__}); see the log"
        return None

    def run_until(self, stop: threading.Event, tick: float) -> None:
        while True:
            self.run_once(datetime.now(UTC))
            if stop.wait(tick):
                return


def _me(req: _Req) -> _Reply:
    if req.user is None:
        return _Reply(200, {"name": None})
    return _Reply(200, {"name": req.user.name, "role": req.user.role})


def _feed(req: _Req) -> _Reply:
    filters: feedview.Filters = {}
    if "kind" in req.params:
        filters["kind"] = req.params["kind"]
    if "q" in req.params:
        filters["query"] = req.params["q"]
    if "before" in req.params:
        filters["before"] = req.params["before"]
    try:
        page = feedview.feed(req.db, req.person.name, req.param("view"), **filters)
    except feedview.ViewError as error:
        raise _refuse(400, str(error)) from None
    cards = [
        {key: value for key, value in dataclasses.asdict(card).items() if key != "source_id"}
        for card in page.cards
    ]  # the route's card keys as they were (the source id is the snapshot's, format 2)
    return _Reply(200, {"cards": cards, "next_before": page.next_before, "newest": page.newest})


MAX_AFTER_DIGITS = len(str(feedview.MAX_ID))


def _feed_new(req: _Req) -> _Reply:
    after = req.param("after")
    if not (after.isascii() and after.isdecimal() and len(after) <= MAX_AFTER_DIGITS):
        raise _refuse(400, f"invalid after {after!r}")
    try:
        count = feedview.new_count(req.db, req.person.name, req.param("view"), int(after))
    except feedview.ViewError as error:
        raise _refuse(400, str(error)) from None
    return _Reply(200, {"count": count})


def _story(
    req: _Req, action: Callable[[sqlite3.Connection, str, int], None], saved: bool
) -> _Reply:
    try:
        action(req.db, req.person.name, int(req.groups[0]))
    except feedview.ViewError as error:
        raise _refuse(404, str(error)) from None
    return _Reply(200, {"saved": saved})


def _topic(req: _Req, action: Callable[[sqlite3.Connection, str, int], None], on: bool) -> _Reply:
    try:
        action(req.db, req.person.name, int(req.groups[0]))
    except store.StoreError as error:
        raise _refuse(404, str(error)) from None
    return _Reply(200, {"following": on})


def _save(req: _Req) -> _Reply:
    return _story(req, feedview.save, True)


def _unsave(req: _Req) -> _Reply:
    return _story(req, feedview.unsave, False)


def _follow(req: _Req) -> _Reply:
    return _topic(req, topics.follow, True)


def _unfollow(req: _Req) -> _Reply:
    return _topic(req, topics.unfollow, False)


def _topics(req: _Req) -> _Reply:
    rows = topics.list_topics(req.db, req.person.name)
    keys = ("id", "name", "following", "stories")
    return _Reply(200, [{key: row[key] for key in keys} for row in rows])


def _status(req: _Req) -> _Reply:
    now = datetime.now(UTC)
    approved = store.sources(req.db, "approved")
    failing = sum(ingest.health(req.db, row["id"], now).state == "failing" for row in approved)
    return _Reply(
        200,
        {
            "last_pass_at": store.get_meta(req.db, "last_pass_at"),
            "sources": {"approved": len(approved), "failing": failing},
            "loop_error": _loop_error(req.loop),
            **_ai_status(req, now),
        },
    )


def _loop_error(loop: LoopState | None) -> str | None:
    """The first job of the loop whose last pass failed, as /api/status shows it."""
    if loop is None:
        return None
    return (
        loop.last_error
        or loop.ai_error
        or loop.digest_error
        or loop.market_error
        or loop.logo_error
    )


def _ai_status(req: _Req, now: datetime) -> dict[str, str | None]:
    """The AI pass's state and the month's last failed call ("<UTC time> UTC: <outcome>")."""
    if req.loop is None:
        return {"ai_state": "off", "ai_last_problem": None}
    held = req.loop.shown_ai_status(req.db, now)
    last = held.last_problem
    problem = None if last is None else f"{last[0]} UTC: {last[1]}"
    return {"ai_state": held.state, "ai_last_problem": problem}


def _focus_id(req: _Req, name: str) -> int | None:
    """A focus parameter: absent, or a decimal id (one that names nothing is ignored)."""
    if name not in req.params:
        return None
    value = req.params[name]
    if re.fullmatch(_ID, value) is None:
        raise _refuse(400, f"{name} must be an id: digits only")
    return int(value)


def _format(req: _Req) -> int:
    """The delivered format: 1 when absent (what the current React reader accepts), 1 or 2."""
    value = req.params.get("format", "1")
    if value not in ("1", "2"):
        raise _refuse(400, "format must be 1 or 2")
    return int(value)


def _snapshot(req: _Req) -> _Reply:
    failed = req.loop is not None and req.loop.last_error is not None
    fmt = _format(req)
    focus = snapshot.Focus(
        _focus_id(req, "topic"), _focus_id(req, "thread"), _focus_id(req, "issuer")
    )
    ai = None if req.loop is None else req.loop.shown_ai_status(req.db, datetime.now(UTC))
    state = snapshot.Service(pass_failed=failed, ai=ai)
    # The clock is read inside the snapshot's read transaction: its `asOf` is never earlier than
    # a comment the snapshot holds.
    built = snapshot.build(
        req.db, req.user, lambda: datetime.now(UTC), focus=focus, service=state, fmt=fmt
    )
    return _Reply(200, built)


_ROUTES: tuple[_Route, ...] = (
    _Route("GET", re.compile("/api/me"), _me, open_to_all=True),
    _Route("GET", re.compile("/api/status"), _status, open_to_all=True),
    _Route("GET", re.compile("/api/snapshot"), _snapshot, open_to_all=True),
    _Route("GET", re.compile("/api/feed"), _feed),
    _Route("GET", re.compile("/api/feed/new"), _feed_new),
    _Route("POST", re.compile(f"/api/stories/{_ID}/save"), _save),
    _Route("DELETE", re.compile(f"/api/stories/{_ID}/save"), _unsave),
    _Route("GET", re.compile("/api/topics"), _topics),
    _Route("POST", re.compile(f"/api/topics/{_ID}/follow"), _follow),
    _Route("DELETE", re.compile(f"/api/topics/{_ID}/follow"), _unfollow),
    *api_groups.ROUTES,
    *api_admin.ROUTES,
    *api_settings.ROUTES,
    *api_issuers.ROUTES,
    *api_logos.ROUTES,
)


def _params(query: str) -> dict[str, str]:
    """The query's parameters, blanks kept, the first of a repeated one."""
    try:
        found = urllib.parse.parse_qs(
            query, keep_blank_values=True, errors="strict", max_num_fields=MAX_PARAMS
        )
    except (UnicodeDecodeError, ValueError):  # not UTF-8, or too many fields
        raise _refuse(400, "the query string is not valid") from None
    return {name: values[0] for name, values in found.items()}


def _match(method: str, path: str) -> tuple[_Route, tuple[str, ...]]:
    """The route for `method` and `path` with the path's groups; 405 with ``Allow`` for a listed
    path and another method, 404 for any other path."""
    allowed: list[str] = []
    for route in _ROUTES:
        found = route.pattern.fullmatch(path)
        if found is None:
            continue
        if route.method == method:
            return route, found.groups()
        allowed.append(route.method)
    if allowed:
        raise _Reply(405, {"error": "method not allowed"}, {"Allow": ", ".join(allowed)})
    raise _refuse(404, "not found")


def answer(root: Path, loop: LoopState | None, request: _Incoming) -> _Reply:
    """The reply to one API request, returned or (a refusal) raised.

    The transport has already checked ``Host`` and ``Origin``. The body's rules (its length,
    that it is a JSON object) are the transport's too, applied when a handler calls
    ``request.body`` or ``request.optional_body``, whose refusal passes through here. The
    request gets its own connection to the store under `root`, closed before this returns or
    raises. `loop` is the background loop whose state ``/api/status`` and the snapshot show: the
    application always passes its loop; None is for a direct call with no loop."""
    route, groups = _match(request.method, request.path)
    params = _params(request.query)
    db = store.open_db(root)  # this request's own connection
    try:
        user = identity.current_user(request.account)
        if user is None and not route.open_to_all:
            raise _refuse(401, _NEEDS_NAME)
        return route.handler(
            _Req(
                db,
                user,
                groups,
                params,
                body=request.body,
                loop=loop,
                optional_body=request.optional_body,
            )
        )
    finally:
        db.close()
