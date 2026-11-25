"""Signal's routes for topics, source proposals and digests.

Every route needs a display name (401 otherwise). Writing a topic or proposing a source needs a
writer or the owner (403 for a reader); any named user, a reader included, builds their own digests.
A refusal is ``{"error": "<plain sentence>"}``: 400 for a value that is not accepted, 403 for a
role, 404 for an id that is not there (or is not yours), 409 for a name already taken, a limit
reached or a topic still in use. A success is 200 with a small JSON object, and the reader reads the
snapshot again to see the change.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import ai_view, digests, fetch, store, topics
from deploy_workflow.signal.routing import ID, Req, Route

WRITERS = ("writer", "owner")


def _fail(error: store.StoreError) -> Reply:
    """The refusal a store error stands for."""
    if isinstance(error, store.Missing):
        return refuse(404, str(error))
    return refuse(409 if isinstance(error, store.Conflict) else 400, str(error))


def _writer(req: Req, what: str) -> str:
    """The asking user's name, refused (403) unless they are a writer or the owner."""
    person = req.person
    if person.role not in WRITERS:
        raise refuse(403, f"only a writer can {what}")
    return person.name


def _encodable(value: str, key: str) -> str:
    """`value` unchanged, or a 400: text with a lone surrogate (a JSON "\\ud800" escape) can be
    neither stored nor sent back, so it is refused where it comes in."""
    try:
        value.encode("utf-8")
    except UnicodeEncodeError:
        raise refuse(400, f"{key} holds a character that is not valid text") from None
    return value


def _text(body: dict[str, Any], key: str) -> str:
    value = body.get(key)
    if not isinstance(value, str):
        raise refuse(400, f"the request needs {key} as text")
    return _encodable(value, key)


def _texts(body: dict[str, Any], key: str) -> list[str]:
    value = body.get(key)
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise refuse(400, f"the request needs {key} as a list of text")
    return [_encodable(item, key) for item in value]


def _number(req: Req, index: int = 0) -> int:
    return int(req.groups[index])


def _now() -> datetime:
    return datetime.now(UTC)


# Topics


def _topic_rule(req: Req) -> tuple[str, list[str], list[str]]:
    body = req.body()
    return _text(body, "name"), _texts(body, "keywords"), _texts(body, "kinds")


def _new_topic(req: Req) -> Reply:
    by = _writer(req, "create a topic")
    name, keywords, kinds = _topic_rule(req)
    try:
        topic_id = topics.add_topic(req.db, name, keywords, kinds, by)
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(topic_id)})


def _edit_topic(req: Req) -> Reply:
    _writer(req, "change a topic")
    name, keywords, kinds = _topic_rule(req)
    try:
        topics.edit_topic(req.db, _number(req), name, keywords, kinds)
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(_number(req))})


def _delete_topic(req: Req) -> Reply:
    _writer(req, "delete a topic")
    try:
        topics.delete_topic(req.db, _number(req))
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"deleted": True})


# Sources: a proposal is stored as proposed; nothing is fetched until the owner approves it.


def _propose_source(req: Req) -> Reply:
    by = _writer(req, "propose a source")
    body = req.body()
    name, kind, url = _text(body, "name").strip(), _text(body, "kind"), _text(body, "url")
    try:
        fetch.check_form(url)
    except fetch.FetchRefused as error:
        raise refuse(400, str(error)) from None
    try:
        found = store.propose_source_limited(req.db, name, kind, url, by)
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(found)})


# Digests: any named user, a reader included, builds their own.


def _optional_text(body: dict[str, Any], key: str) -> str:
    return _text(body, key) if key in body else ""


def _covers(body: dict[str, Any]) -> list[str]:
    """The `covers` of a digest body: one option as delivered, or a list of them."""
    value = body.get("covers")
    return [_encodable(value, "covers")] if isinstance(value, str) else _texts(body, "covers")


def _look_ahead(body: dict[str, Any]) -> int:
    value = body.get("lookAhead", digests.DEFAULT_LOOK_AHEAD)
    if isinstance(value, bool) or not isinstance(value, int):
        raise refuse(400, "the request needs lookAhead as a whole number")
    return value


def _digest_spec(req: Req) -> digests.Spec:
    body = req.body()
    form = digests.Form(
        name=_text(body, "name"),
        covers=_covers(body),
        schedule=_text(body, "schedule"),
        length=_text(body, "length"),
        brief=_optional_text(body, "brief"),
        upcoming=_optional_text(body, "upcoming"),
        look_ahead_days=_look_ahead(body),
    )
    try:
        return digests.spec_from_form(req.db, req.person.name, form)
    except store.StoreError as error:
        raise _fail(error) from None


def _new_digest(req: Req) -> Reply:
    spec = _digest_spec(req)
    try:
        digest_id = digests.create(req.db, req.person.name, spec, _now())
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(digest_id)})


def _edit_digest(req: Req) -> Reply:
    spec = _digest_spec(req)
    try:
        digests.edit(req.db, req.person.name, _number(req), spec, _now())
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"id": str(_number(req))})


def _delete_digest(req: Req) -> Reply:
    try:
        digests.delete(req.db, req.person.name, _number(req))
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"deleted": True})


def _run_message(run: digests.Run) -> str:
    if run.outcome == "nothing":
        return "Nothing material happened in this period. The new issue says so."
    if run.outcome == "skipped" and run.reason == digests.NO_COVER:
        return (
            "This digest covers nothing now, so no issue was written."
            " Edit it to choose what it covers."
        )
    if run.outcome == "skipped":
        many = "story is" if run.stories == 1 else "stories are"
        return f"{run.stories} {many} in scope, but the AI pass is off, so no issue was written."
    return "The issue is written."


QUEUED = (
    "The AI pass is writing this issue now. It appears here within a few minutes;"
    " nothing is written if no story is in scope."
)
QUEUED_TOMORROW = (
    "Digests have made today's model calls, the most a day allows. This issue is written after"
    " 00:00 UTC; nothing is written if no story is in scope."
)


def _run_digest(req: Req) -> Reply:
    """ "Run once now". While the AI pass is on the background loop runs it
    (``digests.request_run``), so no model call is made in a request handler; at its cap it is
    refused (409, the cap sentence) and nothing changes, so no period is ended with its stories
    unwritten; otherwise (off) it runs here, with no writer. Within 30 minutes of the digest's
    last run, or after a run whose paid call wrote no issue and before its next scheduled time,
    it is refused (409, the sentence saying when it can run)."""
    now = _now()
    try:
        held = None if req.loop is None else req.loop.ai_status(req.db, now)
        if held is not None and held.state == "capped":
            digests.owned(req.db, req.person.name, _number(req))  # an unknown digest is a 404
            raise store.Conflict(ai_view.capped_run(now))
        if held is not None and held.state == "on":  # the loop decides when it runs
            digests.request_run(req.db, req.person.name, _number(req), now)
            message = QUEUED_TOMORROW if held.day_full else QUEUED
            queued = {"outcome": "queued", "issueId": None, "stories": None, "message": message}
            return Reply(200, queued)
        run = digests.run_now(req.db, req.person.name, _number(req), now)
    except store.StoreError as error:
        raise _fail(error) from None
    issue = None if run.issue_id is None else str(run.issue_id)
    reply = {"outcome": run.outcome, "issueId": issue, "stories": run.stories}
    return Reply(200, {**reply, "message": _run_message(run)})


def _mark_read(req: Req) -> Reply:
    issue = _number(req, 1) if len(req.groups) > 1 else None
    try:
        digests.mark_read(req.db, req.person.name, _number(req), issue, _now())
    except store.StoreError as error:
        raise _fail(error) from None
    return Reply(200, {"read": True})


ROUTES: tuple[Route, ...] = (
    Route("POST", re.compile("/api/topics"), _new_topic),
    Route("POST", re.compile(f"/api/topics/{ID}/edit"), _edit_topic),
    Route("DELETE", re.compile(f"/api/topics/{ID}"), _delete_topic),
    Route("POST", re.compile("/api/sources"), _propose_source),
    Route("POST", re.compile("/api/digests"), _new_digest),
    Route("POST", re.compile(f"/api/digests/{ID}/edit"), _edit_digest),
    Route("DELETE", re.compile(f"/api/digests/{ID}"), _delete_digest),
    Route("POST", re.compile(f"/api/digests/{ID}/run"), _run_digest),
    Route("POST", re.compile(f"/api/digests/{ID}/read"), _mark_read),
    Route("POST", re.compile(f"/api/digests/{ID}/issues/{ID}/read"), _mark_read),
)
