"""Signal's Admin-only moderation routes, reusing the CLI's domain operations."""

from __future__ import annotations

import re
from collections.abc import Callable
from datetime import UTC, datetime

from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import groups, store, threads
from deploy_workflow.signal.groups import NotFound
from deploy_workflow.signal.routing import ID, Req, Route


def _admin(req: Req) -> None:
    if req.person.role != "owner":
        raise refuse(403, "only an Admin can do this")


def _id(req: Req) -> int:
    return int(req.groups[0])


def _source(req: Req, state: str) -> Reply:
    _admin(req)
    source_id = _id(req)
    try:
        store.set_source_state(req.db, source_id, state)
    except store.StoreError as error:
        raise refuse(400, str(error)) from None
    return Reply(200, {"id": str(source_id), "state": state})


def _approve(req: Req) -> Reply:
    return _source(req, "approved")


def _pause(req: Req) -> Reply:
    return _source(req, "paused")


def _thread(req: Req) -> Reply:
    _admin(req)
    try:
        threads.remove_thread(req.db, _id(req))
    except NotFound as error:
        raise refuse(404, str(error)) from None
    return Reply(200, {"removed": True})


def _comment(req: Req) -> Reply:
    _admin(req)
    try:
        threads.moderate_comment(req.db, _id(req), lambda: datetime.now(UTC))
    except NotFound as error:
        raise refuse(404, str(error)) from None
    return Reply(200, {"removed": True})


def _group(req: Req) -> Reply:
    _admin(req)
    body = req.body()
    cascade = body.get("with_threads")
    if not isinstance(cascade, bool):
        raise refuse(400, "the request needs with_threads as a boolean")
    try:
        groups.remove_group(req.db, _id(req), with_threads=cascade)
    except groups.GroupError as error:
        raise refuse(error.status, str(error)) from None
    return Reply(200, {"removed": True})


def _route(method: str, path: str, handler: Callable[[Req], Reply]) -> Route:
    return Route(method, re.compile(path), handler)


ROUTES: tuple[Route, ...] = (
    _route("POST", f"/api/admin/sources/{ID}/approve", _approve),
    _route("POST", f"/api/admin/sources/{ID}/pause", _pause),
    _route("DELETE", f"/api/admin/threads/{ID}", _thread),
    _route("DELETE", f"/api/admin/comments/{ID}", _comment),
    _route("POST", f"/api/admin/groups/{ID}/remove", _group),
)
