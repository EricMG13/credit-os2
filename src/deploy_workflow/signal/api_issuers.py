"""Signal's routes for the issuer watchlist.

Every route needs a display name (401 otherwise) and every write the service's own Origin. Keeping
issuers (create, edit, delete) needs a writer or the owner: the role is checked first (403), then
the id (404), as the topic routes do. Following is open to every named user (404 for an unknown
id). A refusal is ``{"error": "<plain sentence>"}``: 400 for a value not accepted, 409 for a name,
alias or CIK another issuer has, or the limit reached. The reader reads the snapshot again
(``?format=2``) to see the change.

    POST   /api/issuers               {name, aliases?, cik?, libraryKey?}  -> {"id": "<id>"}
    POST   /api/issuers/<id>/edit     {name, aliases?, cik?, libraryKey?}  -> {"id": "<id>"}
    DELETE /api/issuers/<id>                                               -> {"deleted": true}
    POST   /api/issuers/<id>/follow                                        -> {"following": true}
    DELETE /api/issuers/<id>/follow                                        -> {"following": false}

`aliases` is a list of text; `cik` and `libraryKey` are text or null. On create, an absent key, null
or "" is none. On edit, `name` is required and an ABSENT key keeps the stored value (a page that
never sent `cik` cannot take it off, so it cannot pause an approved filing source by accident); an
explicit null (or "", or `[]` for `aliases`) takes it off.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from typing import Any

from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import issuers, store
from deploy_workflow.signal.api_settings import _encodable, _fail, _text, _texts, _writer
from deploy_workflow.signal.routing import ID, Req, Route


def _maybe_text(body: dict[str, Any], key: str) -> str | None:
    value = body.get(key)
    if value is not None and not isinstance(value, str):
        raise refuse(400, f"the request needs {key} as text or null")
    return None if value is None else _encodable(value, key)


_KEYS = {"aliases": "aliases", "cik": "cik", "libraryKey": "library_key"}  # body key: field


def _form(body: dict[str, Any]) -> issuers.Form:
    aliases = _texts(body, "aliases") if body.get("aliases") is not None else []
    return issuers.Form(
        _text(body, "name"), aliases, _maybe_text(body, "cik"), _maybe_text(body, "libraryKey")
    )


def _kept(body: dict[str, Any]) -> frozenset[str]:
    """The fields an edit leaves as stored: those whose key the body does not hold."""
    return frozenset(field for key, field in _KEYS.items() if key not in body)


def _number(req: Req) -> int:
    return int(req.groups[0])


def _new(req: Req) -> Reply:
    by = _writer(req, "add an issuer")
    try:
        made = issuers.add_issuer(req.db, _form(req.body()), by)
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(made)})


def _edit(req: Req) -> Reply:
    by = _writer(req, "change an issuer")
    body = req.body()
    form = _form(body)
    try:
        issuers.edit_issuer(req.db, _number(req), form, by, keep=_kept(body))
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(_number(req))})


def _delete(req: Req) -> Reply:
    _writer(req, "remove an issuer")
    try:
        issuers.remove_issuer(req.db, _number(req))
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"deleted": True})


def _following(action: Callable[[Any, str, int], None], on: bool) -> Callable[[Req], Reply]:
    def handle(req: Req) -> Reply:
        try:
            action(req.db, req.person.name, _number(req))
        except store.StoreError as error:
            raise _fail(error) from None
        return Reply(200, {"following": on})

    return handle


ROUTES: tuple[Route, ...] = (
    Route("POST", re.compile("/api/issuers"), _new),
    Route("POST", re.compile(f"/api/issuers/{ID}/edit"), _edit),
    Route("DELETE", re.compile(f"/api/issuers/{ID}"), _delete),
    Route("POST", re.compile(f"/api/issuers/{ID}/follow"), _following(issuers.follow, True)),
    Route("DELETE", re.compile(f"/api/issuers/{ID}/follow"), _following(issuers.unfollow, False)),
)
