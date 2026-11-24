"""Signal's routes for groups, threads, comments, reactions, thread rules and notifications.

Every route needs a display name (the service answers 401 before a handler runs) and every write
needs the service's own Origin (403 otherwise, checked before the body is read). The handlers only
read the request and call the domain modules (``groups``, ``threads``, ``notif``), which decide
roles, visibility, limits and rules; a refusal is ``{"error": "<sentence>"}`` with 400 (not
valid), 403 (not allowed), 404 (no such thing, or one in a group the user cannot see) or 409 (the
state does not allow it). A success answers with the ids it made; the screens read the snapshot
again for everything else. A thread write is given the clock, not a time: the domain module
reads it once it holds the write lock. Moderation and clean-up (removing a thread or anyone's
comment, deleting a group with its threads) are the owner's, on the command line only.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import groups, notif, threads
from deploy_workflow.signal.groups import GroupError
from deploy_workflow.signal.routing import ID, Req, Route

_WORD = "(agree|disagree|seen)"
_WORDS = {"agree": "Agree", "disagree": "Disagree", "seen": "Seen"}


def _refusing(handler: Callable[[Req], Any]) -> Callable[[Req], Reply]:
    """Answer with the handler's value, or with the refusal a domain error carries."""

    def run(req: Req) -> Reply:
        try:
            return Reply(200, handler(req))
        except GroupError as error:
            raise refuse(error.status, str(error)) from None

    run.__name__ = handler.__name__
    return run


def _path_id(req: Req, index: int = 0) -> int:
    return int(req.groups[index])  # the route's pattern admits 1 to 18 ASCII digits only


def _body_id(body: dict[str, Any], key: str) -> int | None:
    """An id sent in the body (a number or the snapshot's decimal text); None when absent."""
    value = body.get(key)
    return None if value is None else groups.as_id(value, key)


def _now() -> datetime:
    return datetime.now(UTC)


# Groups (writers and the owner)


def _create(req: Req) -> Any:
    body = req.body()
    made = groups.create_group(req.db, req.person, body.get("name"), body.get("visibility"))
    return {"group": str(made)}


def _rename(req: Req) -> Any:
    groups.rename_group(req.db, req.person, _path_id(req), req.body().get("name"))
    return {"group": req.groups[0]}


def _delete(req: Req) -> Any:
    groups.delete_group(req.db, req.person, _path_id(req))
    return {"group": req.groups[0]}


def _visibility(req: Req) -> Any:
    groups.set_visibility(req.db, req.person, _path_id(req), req.body().get("visibility"))
    return {"group": req.groups[0]}


def _add_member(req: Req) -> Any:
    name = groups.add_member(req.db, req.person, _path_id(req), req.body().get("name"))
    return {"group": req.groups[0], "name": name}


def _remove_member(req: Req) -> Any:
    groups.remove_member(req.db, req.person, _path_id(req), req.body().get("name"))
    return {"group": req.groups[0]}


def _topics(req: Req) -> Any:
    held = groups.set_topics(req.db, req.person, _path_id(req), req.body().get("topics"))
    return {"group": req.groups[0], "topics": [str(n) for n in held]}


def _rule(req: Req) -> Any:
    body = req.body()
    groups.set_rule(req.db, req.person, _path_id(req), body.get("rule"), body.get("on"))
    return {"group": req.groups[0], "rule": body["rule"], "on": body["on"]}


# Threads, comments and reactions (writers post; anyone who sees the group marks it read)


def _share(req: Req) -> Any:
    body = req.body()
    item = threads.Item(_body_id(body, "story"), body.get("note"))
    made, joined = threads.share(req.db, req.person, _path_id(req), item, _now)
    return {"thread": str(made), "joined": joined}


def _comment(req: Req) -> Any:
    made = threads.comment(req.db, req.person, _path_id(req), req.body().get("text"), _now)
    return {"comment": str(made)}


def _reply(req: Req) -> Any:
    made = threads.reply(req.db, req.person, _path_id(req), req.body().get("text"), _now)
    return {"comment": str(made)}


def _edit(req: Req) -> Any:
    threads.edit(req.db, req.person, _path_id(req), req.body().get("text"), _now)
    return {"comment": req.groups[0]}


def _remove(req: Req) -> Any:
    threads.remove(req.db, req.person, _path_id(req), _now)
    return {"comment": req.groups[0]}


def _reaction(req: Req, on: bool) -> Any:
    reaction = threads.Reaction(_path_id(req), _WORDS[req.groups[1]], on)
    threads.react(req.db, req.person, reaction, _now)
    return {"comment": req.groups[0], "word": _WORDS[req.groups[1]], "on": on}


def _react(req: Req) -> Any:
    return _reaction(req, True)


def _unreact(req: Req) -> Any:
    return _reaction(req, False)


def _read(req: Req) -> Any:
    threads.mark_read(req.db, req.person, _path_id(req), _now)
    return {"thread": req.groups[0]}


def _notification(req: Req) -> Any:
    body = req.body()
    notif.set_switch(
        req.db, req.person.name, body.get("event"), body.get("channel"), body.get("on")
    )
    return {"event": body["event"], "channel": body["channel"], "on": body["on"]}


def _route(method: str, path: str, handler: Callable[[Req], Any]) -> Route:
    return Route(method, re.compile(path), _refusing(handler))


ROUTES: tuple[Route, ...] = (
    _route("POST", "/api/groups", _create),
    _route("DELETE", f"/api/groups/{ID}", _delete),
    _route("POST", f"/api/groups/{ID}/rename", _rename),
    _route("POST", f"/api/groups/{ID}/visibility", _visibility),
    _route("POST", f"/api/groups/{ID}/members", _add_member),
    _route("POST", f"/api/groups/{ID}/members/remove", _remove_member),
    _route("POST", f"/api/groups/{ID}/topics", _topics),
    _route("POST", f"/api/groups/{ID}/threads", _share),
    _route("POST", f"/api/groups/{ID}/rules", _rule),
    _route("POST", f"/api/threads/{ID}/comments", _comment),
    _route("POST", f"/api/threads/{ID}/read", _read),
    _route("POST", f"/api/comments/{ID}/replies", _reply),
    _route("POST", f"/api/comments/{ID}/edit", _edit),
    _route("DELETE", f"/api/comments/{ID}", _remove),
    _route("POST", f"/api/comments/{ID}/reactions/{_WORD}", _react),
    _route("DELETE", f"/api/comments/{ID}/reactions/{_WORD}", _unreact),
    _route("POST", "/api/notifications", _notification),
)
