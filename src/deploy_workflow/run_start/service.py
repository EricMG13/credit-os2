"""The run intake API and scheduler behind one local address.

The process holds the provider key and can start paid runs (each at its pathway's cap,
``PATHWAY_CAP_USD``), has no login and is reachable from other machines, so every request is
hostile input. Plain ``http.server``; no framework. The rules below that are not about one route
are implemented once, in ``deploy_workflow.http_base``, which Signal's service shares; this
docstring is their specification. Every request is checked before any body byte is read:

* ``Host`` must be exactly ``<host>:<port>`` as started (and ``localhost:<port>`` when the host is
  ``127.0.0.1``); otherwise 403. On port 80 the port may be left out of ``Host`` and ``Origin``.
* A request target must be a path (it starts with ``/``): an absolute URI is 400.
* Every request other than GET must carry ``Origin: http://<Host>``; otherwise 403 and no change.
  A GET that carries ``Origin`` must carry the same value. Any request whose ``Sec-Fetch-Site`` is
  present and is not ``same-origin`` or ``none`` is 403: a page on another site cannot read the
  library through an analyst's browser. The one exception is a top-level navigation: a GET with
  ``Sec-Fetch-Mode: navigate`` and ``Sec-Fetch-Dest: document`` is served whatever its
  ``Sec-Fetch-Site`` (colleagues open the page from a link in web chat or webmail; the linking
  site cannot read a navigated document, and framing is refused by ``frame-ancestors``). A request
  with neither header (not a browser) is served.
* Every response carries ``Cross-Origin-Resource-Policy: same-origin`` and ``nosniff``.
* At most ``MAX_CONNECTIONS`` connections are open; one beyond that is closed at once.
* A body needs ``Content-Length`` (else 411). JSON bodies are at most 1 MiB (else 413) and must be
  one JSON value (else 400). An upload's length is at most ``submissions.MAX_FILE`` (else 400,
  judged from the header). Every connection serves one request and closes.
* An HTTP/0.9 request line (no version, so no headers) is closed without a reply.

Requests. JSON answers carry ``Content-Type: application/json; charset=utf-8``. A refusal is
``{"error": "<plain sentence>"}`` with 400, an unknown submission or run is 404, an unexpected
failure is 500 ``{"error": "the service failed; see its log"}`` (its cause goes to the log only).

``POST /api/submissions``
    No body. 200 ``{"id": "<32 hex>"}``: a new, empty submission. 400 when too many are open.
``POST /api/submissions/<id>/files?name=<percent-encoded UTF-8 path>``
    The body is the file's raw bytes; ``Content-Length`` is required. 200 ``{"name": "<stored
    name>"}``. The name may hold ``/`` for folders. A name already stored is replaced. 400 for a
    bad or undecodable name, a missing ``name``, a limit, or a submission already submitted.
``DELETE /api/submissions/<id>/files?name=<percent-encoded UTF-8 path>``
    No body. 200 ``{"name": "<name>"}``; 400 when it is not stored or the submission is sealed.
``GET /api/submissions/<id>/reading``
    200 ``{"documents": [...], "ignored": [...], "error": ""}``: what the launcher makes of each
    uploaded file offline. ``error`` is a sentence when the files cannot be read.
``POST /api/submissions/<id>/summary``
    Header ``X-Shown-Cap: <USD>``: the cap the page displays for the answers' pathway; 400 "this
    page is out of date" when it is absent or not the pathway's cap (also on submit).
    Body: the answers object ``{"context", "modules", "max_turns", "level", "submitted_by",
    "model", "effort"}``. ``model`` is "gpt" or "claude", ``effort`` "fast", "balanced" or "high";
    other than "gpt" and "balanced" only at the "advanced" level.
    An optional ``newest_document_date`` in YYYY-MM-DD form overrides the date inferred from the
    uploaded documents and is covered by the digest. A date after the as-of date adds a limit.
    ``submitted_by`` is the analyst's name: a first name, a space, then one or two capital initials
    ("Eric G", "Eric MG"); anything else, an empty name included, is refused with the form to use.
    200 ``{"error": "", "digest", "modules", "items", "documents", "ignored", "omitted",
    "omitted_titles", "model", "effort", "changes", "lookup", "web_lookup", "prior"}``, the
    launcher's own
    forecast and the digest to approve (``omitted_titles`` is the reader-facing title of each
    id in ``omitted``, same order; ``changes`` says whether CP-8 will run, and against which
    earlier run: its pathway and as-of date; ``lookup`` is the launcher's own Lookup line and,
    when present, its SEC line, as the run Submit starts will have them; ``web_lookup`` is
    whether the research module will have the lookup tools in that run; ``prior`` is
    ``{"id", "as_of", "pathway"}`` of that run or null for a first run, and is part of the
    digest: the launcher is started with that run, ``--prior <id>`` or ``--prior none``; the
    modules list holds CP-8 when it will);
    or 200 ``{"error": "<sentence>"}`` with no digest when the answers or files are refused
    (Claude Opus without an Anthropic key on the service included). Only the latest digest
    issued is accepted.
``POST /api/submissions/<id>/submit``
    Body: ``{"answers": <the answers object>, "digest": "<digest of the latest summary>"}``.
    200 ``{"run": "<run id>", "status": "queued"}``. Repeating it returns the same run. 400 when
    the digest is not the one issued for exactly the files and answers now held.
``GET /api/runs/<run id>``
    200 ``{"id", "status", "reason", "started_at", "ended_at", "issuer_name", "pathway",
    "report", "modules"}``. ``modules`` is ``[[module, "done"|"running"|"waiting"], ...]`` in
    plan order, then ``["Report", ...]``; ``stalled`` is added (true) when no event for an hour.
    ``report`` is a path under the library folder, relative to the root, once filed.
``GET /api/runs/<run id>/inputs``
    200 ``prior.inputs``: the earlier run's context (dates blank), file names and sizes (never file
    content), level, modules and turns; ``error`` (relative names only) when the folder's listing
    was refused. 404 for an unknown run.
``GET /api/issuers/<issuer id>`` (``[a-z0-9-]{1,40}``)
    200 ``prior.issuer``: ``{"runs", "latest_as_of", "latest_run", "issuer_name"}``.
``POST /api/submissions/<id>/carry``
    Body ``{"run": "<run id>"}``. 200 ``{"carried": [...], "kept": [...]}``: the run's stored
    files copied into the submission, a name already held kept. 404 for an unknown run or
    submission; 400 for a bad body, a run with no stored documents or any other refusal.
``POST /api/submissions/<id>/reference-portfolio/files?name=<percent-encoded UTF-8 file name>``
    One file of the submission's comparison portfolio (``reference_portfolio``): a reference
    portfolio the analyst supplies for this run, optional in every pathway and never a source
    document (it is not in ``reading``, ``documents`` or the run's files). The body is the file's
    raw bytes, a .csv or .xlsx file of at most ``reference_portfolio.MAX_FILE`` bytes, at most
    ``reference_portfolio.MAX_FILES`` files; the name has no folder. 200 ``{"name": "<stored
    name>"}``; a name already stored is replaced. 400 for a bad name, a limit or a submission
    already submitted.
``DELETE /api/submissions/<id>/reference-portfolio/files?name=<file name>``
    No body. 200 ``{"name": "<name>"}``; 400 when it is not stored.
``POST /api/submissions/<id>/reference-portfolio``
    Body ``{"name": "<the analyst's name for the portfolio>", "holds": "loans" | "bonds" | ""}``
    (``holds`` may be left out: not stated). The name is trimmed, at most 80 printable characters;
    400 otherwise. 200: the reading below.
``GET /api/submissions/<id>/reference-portfolio``
    200 ``{"name", "holds", "files": [<stored names>], "portfolio", "error"}``. ``portfolio`` is
    null with no file, or when the files cannot be read as a portfolio, and then ``error`` is a
    sentence for a reader (the rest of the submission stays usable); otherwise ``{"name", "kind":
    "custom", "as_of": "YYYY-MM-DD" | null, "positions", "unpriced", "limits", "found",
    "not_found", "findings"}``: the counts of positions, of positions with no price and of limits,
    the fields the holdings supplied and did not, and the reader's findings. While a portfolio
    file is stored the summary carries the same object as ``reference_portfolio`` and its digest
    covers the name, ``holds`` and each file; a portfolio that cannot be read makes the summary an
    ``error`` until it is replaced or removed. Submit stores the approved portfolio for the run.
``DELETE /api/submissions/<id>/reference-portfolio``
    No body. 200 ``{"removed": true}``: the files and the name are gone (none is not an error).
``GET /api/reference-portfolios``
    The standing reference portfolios (``standing_portfolios``), read from their store alone: it
    never fetches. 200 ``{"portfolios": [{"key", "name", "kind", "as_of", "stored_at",
    "positions", "failure", "error", "fetchable"}, ...]}``, one per standing key (``clo``,
    ``lvln``, ``jnk``): ``as_of`` (YYYY-MM-DD), ``stored_at`` (ISO time, UTC) and ``positions``
    are the stored set's, null with none; ``failure`` is ``{"message", "at"}`` of the last failed
    fetch since that set was stored, or null; ``error`` says why a stored file cannot be read
    (without the key: it is shown on the portfolio's own line), or null; ``fetchable`` is whether
    the service fetches the key's file (the two funds).
``POST /api/reference-portfolios/<key>/refresh``
    No body. The analyst's "fetch latest": one fetch of the key's holdings file. 200 ``{"key",
    "name", "outcome": "stored" | "kept" | "failed", "as_of", "stored_at", "file_as_of",
    "message", "columns_gained", "columns_lost", "portfolios"}``: the set in the store after the
    fetch, the date the fetched file states, a sentence for a reader on ``kept`` and ``failed``,
    the columns (in a reader's words) the file has and the previous set's had not and the
    reverse, and the listing after the fetch. A failure leaves the previous set as it was. 400
    for a key with no file to fetch (nothing is fetched), 404 for a key that is not a standing
    one, 409 while that key is being fetched or replaced.
``POST /api/reference-portfolios/ensure``
    No body. Fetches each fetchable key with no stored set and no recorded failure (a key being
    fetched is skipped), then 200: the listing. After a failure only ``refresh`` fetches again.
``POST /api/reference-portfolios/<key>/files?name=<percent-encoded UTF-8 file name>``
    One file of a set the analyst supplies for a standing key, staged under the comparison
    portfolio's rules and limits. 200 ``{"name": "<stored name>"}``.
``DELETE /api/reference-portfolios/<key>/files``
    No body. 200 ``{"cleared": true}``: every staged file of the key is removed.
``POST /api/reference-portfolios/<key>``
    No body. Reads the staged files as the key's set and stores it, replacing the one before;
    the staged files are removed whatever the outcome. 200 ``{"portfolio": {...}, "portfolios":
    [...]}``: what was read (the comparison portfolio's ``portfolio`` shape) and the listing. 400
    with a sentence for a reader, the stored set kept, when nothing is staged or the files are
    not a dated portfolio; 409 while the key is being fetched or replaced.
``GET /library/downloads/<path>``
    A read-only file under ``_engine/library/downloads``. The final path (``index.html``
    appended for a folder) must be a regular file inside that folder. Other legacy static-library
    files are not served. The type comes from the file name. This response cannot call the intake
    API.
``GET /activity.js``
    ``_engine/activity.js`` (the library's Run activity, loaded as ``../activity.js``), under the
    same rules and headers as a library file; it must itself be in ``_engine``.

``main`` runs this server in a daemon thread and the scheduler's ``step`` every poll in the main
thread; ``step`` also sweeps stale uploads and, when the environment holds both
``CREDIT_OS_TEAMS_WEBHOOK`` and ``CREDIT_OS_TEAMS_LINK``, posts run cards to Teams
(``deploy_workflow.inbox.teams``). ``--host`` must be this machine's own address: a
wildcard address (``0.0.0.0``, ``::``, or any spelling that resolves to one) can never equal a
``Host`` header and is refused.
"""

from __future__ import annotations

import argparse
import logging
import re
import sys
import threading
import time
import urllib.parse
from collections.abc import Sequence
from datetime import UTC, datetime
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import Any, BinaryIO, cast

from deploy_vii.contracts import DEACTIVATED_PATHWAYS, PATHWAY_CAP_USD
from deploy_workflow import http_base
from deploy_workflow.http_base import Body, Reply, refuse
from deploy_workflow.inbox import activity, runs, teams
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox.scheduler import Scheduler, Settings
from deploy_workflow.run_start import prior, reference_portfolio, standing_portfolios, submissions
from deploy_workflow.run_start.submissions import Answers

__all__ = ["Handler", "main", "make_server"]

log = logging.getLogger(__name__)

MAX_JSON = 1024 * 1024
SOCKET_TIMEOUT = 60  # seconds a connection may stall; a stalled upload cannot hold a thread
# Each connection holds a thread for up to SOCKET_TIMEOUT. The service is used by a few colleagues,
# so 64 is far above real use and low enough that idle sockets cannot exhaust threads or memory.
MAX_CONNECTIONS = 64
_POLICY = (
    "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
    "font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; "
    "form-action 'none'; frame-ancestors 'none'"
)
_LIBRARY_POLICY = "connect-src 'none'; form-action 'none'; frame-ancestors 'self'"
_UNKNOWN = "unknown submission"  # the text submissions raises for an id it does not hold
_UNKNOWN_RUN = "unknown run"  # the text prior raises for a run id with no record
_SUBMISSION = re.compile(r"/api/submissions/([^/]+)/(files|reading|summary|submit|carry)")
_REFERENCE = re.compile(r"/api/submissions/([^/]+)/reference-portfolio(/files)?")
_STANDING = re.compile(r"/api/reference-portfolios(?:/([a-z0-9_-]{1,64})(/refresh|/files)?)?")
_RUN_ID = r"[0-9A-Za-z._-]{1,80}"
_RUN = re.compile(rf"/api/runs/({_RUN_ID})")
_RUN_INPUTS = re.compile(rf"/api/runs/({_RUN_ID})/inputs")
_ISSUER = re.compile(r"/api/issuers/([a-z0-9-]{1,40})")
_NO_FILES = "that run has no stored documents"
_RUN_FIELDS = (
    "id",
    "status",
    "reason",
    "started_at",
    "ended_at",
    "issuer_name",
    "pathway",
    "cap",
    "report",
    "modules",
    "stalled",
)
_DOWNLOADS = "/library/downloads/"
SHOWN_CAP_HEADER = "X-Shown-Cap"  # the cap the page displays, sent with summary and submit
_HOSTNAME = re.compile(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?")


class _Server(http_base.Server):
    scheduler: Scheduler
    standing: standing_portfolios.Desk  # the standing portfolios' locks and fetch wiring

    def connection_limits(self) -> tuple[int, int | None]:
        return MAX_CONNECTIONS, None  # no ceiling per remote address


class Handler(http_base.Handler):
    timeout = SOCKET_TIMEOUT
    server_version = "RunStart"
    logger = log

    # -- plumbing ---------------------------------------------------------------------------

    @property
    def _service(self) -> _Server:
        return cast(_Server, self.server)

    @property
    def _layout(self) -> Layout:
        return self._service.scheduler.layout

    def do_GET(self) -> None:
        self.serve_request(self._get)

    def do_POST(self) -> None:
        self.serve_request(self._post)

    def do_DELETE(self) -> None:
        self.serve_request(self._delete)

    def _json_body(self) -> Any:
        return self.json_body(MAX_JSON)  # any one JSON value: each route checks its own shape

    def _name(self, query: str) -> str:
        try:
            found = urllib.parse.parse_qs(query, keep_blank_values=True, errors="strict")
        except UnicodeDecodeError:
            raise refuse(400, "the file name is not valid UTF-8") from None
        names = found.get("name", [])
        if len(names) != 1:
            raise refuse(400, "the request needs exactly one name")
        return names[0]

    def _require_shown_cap(self, answers: Any) -> None:
        """Refuse a summary or submit whose page did not show the pathway's cap.

        The page sends the cap it displays in the ``X-Shown-Cap`` header (ruling
        2026-11-15-pathway-tiers-and-caps): the approved summary is the paid action, so what the
        analyst saw must be what is enforced. A page loaded before a cap changed sends none or
        another figure. Answers with no known pathway, or a deactivated one, are left to the
        summary's and Submit's own refusals."""
        try:
            pathway = answers["context"]["run"]["pathway"]
            cap = None if pathway in DEACTIVATED_PATHWAYS else PATHWAY_CAP_USD.get(pathway)
        except (KeyError, TypeError):
            return
        if cap is not None and self.headers.get_all(SHOWN_CAP_HEADER) != [str(cap)]:
            raise refuse(
                400,
                f"this page is out of date: it does not show this pathway's cap of USD {cap}. "
                "Reload the page.",
            )

    # -- routes -----------------------------------------------------------------------------

    def _get(self, url: urllib.parse.SplitResult) -> None:
        path = url.path
        if path.startswith(_DOWNLOADS):
            raise self._file(
                self._layout.engine / "library" / "downloads",
                path[len(_DOWNLOADS) :],
                direct=False,
            )
        if path.startswith("/library/"):
            raise refuse(404, "not found")
        if path == "/activity.js":
            raise self._file(self._layout.engine, "activity.js", direct=True)
        if path == "/api/reference-portfolios":
            raise Reply(200, standing_portfolios.listing(self._layout))
        found = _SUBMISSION.fullmatch(path)
        if found and found[2] == "reading":
            raise Reply(200, self._guarded(lambda: submissions.reading(self._layout, found[1])))
        reference = _REFERENCE.fullmatch(path)
        if reference and not reference[2]:
            sid = reference[1]
            raise Reply(200, self._guarded(lambda: reference_portfolio.reading(self._layout, sid)))
        inputs = _RUN_INPUTS.fullmatch(path)
        if inputs:
            raise Reply(200, self._guarded(lambda: prior.inputs(self._layout, inputs[1])))
        issuer = _ISSUER.fullmatch(path)
        if issuer:
            raise Reply(200, prior.issuer(self._layout, issuer[1]))
        run = _RUN.fullmatch(path)
        if run:
            raise Reply(200, self._run(run[1]))

    def _post(self, url: urllib.parse.SplitResult) -> None:
        if url.path == "/api/submissions":
            raise Reply(200, {"id": self._guarded(lambda: submissions.new(self._layout))})
        if reference := _REFERENCE.fullmatch(url.path):
            self._post_reference(reference[1], url.query if reference[2] else None)
        if (standing := _STANDING.fullmatch(url.path)) and standing[1]:
            self._post_standing(standing[1], standing[2], url.query)
        found = _SUBMISSION.fullmatch(url.path)
        if not found:
            return
        sid, action = found[1], found[2]
        if action == "files":
            self._upload(sid, self._name(url.query))
        if action == "summary":
            answers = self._json_body()
            self._require_shown_cap(answers)
            raise Reply(200, self._guarded(lambda: self._summary(sid, answers)))
        if action == "submit":
            body = self._json_body()
            self._require_shown_cap(body.get("answers") if isinstance(body, dict) else None)
            self._submit(sid, body)
        if action == "carry":
            self._carry(sid, self._json_body())

    def _post_reference(self, sid: str, query: str | None) -> None:
        """A comparison portfolio file (``query`` holds its name), or its name and what it holds."""
        if query is not None:
            name, length = self._name(query), self.content_length()
            body = cast(BinaryIO, Body(self.rfile))
            stored = self._guarded(
                lambda: reference_portfolio.add_file(self._layout, sid, name, body, length)
            )
            raise Reply(200, {"name": stored})
        given = self._json_body()
        if not isinstance(given, dict):
            raise refuse(400, "the request needs the portfolio's name")
        raise Reply(
            200,
            self._guarded(
                lambda: reference_portfolio.name_it(
                    self._layout, sid, given.get("name"), given.get("holds", "")
                )
            ),
        )

    def _post_standing(self, key: str, tail: str | None, query: str) -> None:
        """A standing portfolio's action: the first fetches, a fetch, a staged file or the read.
        Times are the scheduler's clock in UTC, as Submit stamps a run's own portfolio."""
        layout, desk = self._layout, self._service.standing
        now = self._service.scheduler.now().astimezone(UTC)
        if key == "ensure" and tail is None:
            listed = self._guarded(lambda: standing_portfolios.ensure_absent(layout, desk, now))
            raise Reply(200, listed)
        if tail == "/refresh":
            done = self._guarded(lambda: standing_portfolios.refresh(layout, desk, key, now))
            raise Reply(200, done)
        if tail == "/files":
            name, length = self._name(query), self.content_length()
            body = cast(BinaryIO, Body(self.rfile))
            stored = self._guarded(
                lambda: standing_portfolios.add_file(layout, key, name, body, length)
            )
            raise Reply(200, {"name": stored})
        read = self._guarded(lambda: standing_portfolios.supply(layout, desk, key, now))
        raise Reply(200, read)

    def _delete_reference(self, sid: str, query: str | None) -> None:
        if query is None:
            self._guarded(lambda: reference_portfolio.remove(self._layout, sid))
            raise Reply(200, {"removed": True})
        name = self._name(query)
        self._guarded(lambda: reference_portfolio.remove_file(self._layout, sid, name))
        raise Reply(200, {"name": name})

    def _delete(self, url: urllib.parse.SplitResult) -> None:
        if reference := _REFERENCE.fullmatch(url.path):
            self._delete_reference(reference[1], url.query if reference[2] else None)
        standing = _STANDING.fullmatch(url.path)
        if standing and standing[1] and standing[2] == "/files":
            key = standing[1]
            self._guarded(lambda: standing_portfolios.clear(self._layout, key))
            raise Reply(200, {"cleared": True})
        found = _SUBMISSION.fullmatch(url.path)
        if found and found[2] == "files":
            name = self._name(url.query)
            self._guarded(lambda: submissions.remove_file(self._layout, found[1], name))
            raise Reply(200, {"name": name})

    def _guarded(self, action: Any) -> Any:
        """The result of ``action``; a ``Refused`` becomes its 400 (404 for an unknown id or
        standing portfolio), a standing portfolio that is busy a 409."""
        try:
            return action()
        except standing_portfolios.Busy as busy:
            raise refuse(409, str(busy)) from None
        except submissions.Refused as refusal:
            missing = str(refusal) in (_UNKNOWN, _UNKNOWN_RUN, standing_portfolios.UNKNOWN)
            raise refuse(404 if missing else 400, str(refusal)) from None

    def _upload(self, sid: str, name: str) -> None:
        length = self.content_length()
        stored = self._guarded(
            lambda: submissions.add_file(
                self._layout, sid, name, cast(BinaryIO, Body(self.rfile)), length
            )
        )
        raise Reply(200, {"name": stored})

    def _carry(self, sid: str, body: Any) -> None:
        run = body.get("run") if isinstance(body, dict) else None
        if not isinstance(run, str) or not re.fullmatch(_RUN_ID, run):
            raise refuse(400, "the request needs the id of an earlier run")

        def copy() -> dict[str, list[str]]:
            _, folder = prior.source(self._layout, run)
            if folder is None:
                raise submissions.Refused(_NO_FILES)
            return submissions.carry(self._layout, sid, folder)

        raise Reply(200, self._guarded(copy))

    def _summary(self, sid: str, answers: Any) -> dict[str, Any]:
        result = submissions.summary(self._layout, sid, answers)
        if result.get("digest"):
            result["copilot_verified"] = self._service.scheduler.model_available(
                result["model"], result["effort"]
            )
        return result

    def _submit(self, sid: str, body: Any) -> None:
        if not isinstance(body, dict) or not isinstance(body.get("digest"), str):
            raise refuse(400, "the request needs the answers and the digest of the summary")
        record = self._guarded(
            lambda: self._service.scheduler.submit(
                sid,
                cast(Answers, body.get("answers")),
                body["digest"],  # checked by submit
            )
        )
        raise Reply(200, {"run": record.id, "status": record.status})

    def _run(self, run_id: str) -> dict[str, Any]:
        records, unreadable = runs.load_readable(self._layout)
        if f"{run_id}.json" in unreadable:  # fail closed: only this run's own bad file refuses it
            raise ValueError("that run's record cannot be read")
        record = next((r for r in records if r.id == run_id), None)
        if record is None:
            raise refuse(404, "unknown run")
        shown = activity.snapshot(self._layout, [record], now=datetime.now(UTC))["runs"][0]
        # A run with no folder yet has no events: every module waits.
        shown.setdefault("modules", activity.module_states(record.pathway, []))
        answer = {key: shown[key] for key in _RUN_FIELDS if key in shown}
        if record.status == "finished":
            answer["library_report"] = self._library_report(record.id)
        return answer

    def _library_report(self, run_id: str) -> str:
        """The connected report route for this finished run."""
        return f"/report/{urllib.parse.quote(run_id, safe='')}"

    def _file(self, base: Path, relative: str, *, direct: bool) -> Reply:
        """A library file's reply: its page may not call this API and is framed only by itself."""
        headers = {"Content-Security-Policy": _LIBRARY_POLICY, "X-Frame-Options": "SAMEORIGIN"}
        return http_base.contained_file(base, relative, direct=direct, headers=headers, logger=log)


def signal_link(url: str) -> str:
    """The normalised ``http://<host>:<port>/`` of a Signal address; ValueError otherwise."""
    if not url.isascii() or not url.isprintable() or any(c in " \"'<>[]" for c in url):
        raise ValueError("--signal-url: printable ASCII without spaces or quotes")
    parts = urllib.parse.urlsplit(url)
    host = parts.hostname or ""
    try:
        port = parts.port
    except ValueError:
        port = None
    if (
        not url.startswith("http://")
        or not _HOSTNAME.fullmatch(host)
        or port is None
        or not 1 <= port <= 65535
        or parts.path not in ("", "/")
        or parts.query
        or parts.fragment
        or "@" in parts.netloc
        or url.endswith(("?", "#"))
    ):
        raise ValueError("--signal-url: pass http://<host>:<port>/ (no path, query or login)")
    return f"http://{host}:{port}/"


def make_server(
    scheduler: Scheduler, host: str, port: int, signal_url: str = ""
) -> ThreadingHTTPServer:
    """A server bound to ``host:port`` (port 0 picks one); not yet serving.

    ``signal_url`` remains validated for callers that expose a Signal link in their own UI."""
    if signal_url:
        signal_link(signal_url)
    server = _Server((host, port), Handler)
    server.scheduler = scheduler
    server.standing = standing_portfolios.Desk()
    return server


def _parser() -> argparse.ArgumentParser:
    defaults = Settings(Path("."))
    parser = argparse.ArgumentParser(prog="python -m deploy_workflow.run_start")
    parser.add_argument("--root", type=Path, required=True, help="the shared folder")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--max-running", type=int, default=defaults.max_running)
    parser.add_argument("--max-per-day", type=int, default=defaults.max_per_day)
    parser.add_argument("--signal-url", help="http://<host>:<port>/ of Signal: adds a rail link")
    return parser


def _loop(scheduler: Scheduler) -> None:
    while True:
        scheduler.step()  # which also sweeps the stale uploads, keeping the queued ones
        time.sleep(scheduler.settings.poll_seconds)


def _refusal(args: argparse.Namespace) -> str | None:
    if not 0 <= args.port <= 65535:
        return "--port must be from 0 to 65535"
    if args.max_running < 1 or args.max_per_day < 1:
        return "--max-running and --max-per-day must be at least 1"
    if http_base.wildcard(args.host):
        return http_base.WILDCARD_MESSAGE
    return None


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    refusal = _refusal(args)
    if refusal:
        print(refusal, file=sys.stderr)
        return 2
    try:
        signal_url = "" if args.signal_url is None else signal_link(args.signal_url)
    except ValueError as error:
        print(error, file=sys.stderr)
        return 2
    try:
        settings = Settings(
            args.root,
            max_running=args.max_running,
            max_per_day=args.max_per_day,
            teams=teams.config_from_environment(teams.LIBRARY_PAGES),
        )
        scheduler = Scheduler(settings)
    except (ValueError, OSError) as error:  # StartupRefused, a long root
        print(error, file=sys.stderr)
        return 2
    try:
        server = make_server(scheduler, args.host, args.port, signal_url)
    except (OSError, OverflowError) as error:  # the address is taken or is not one
        scheduler.close()
        print(f"cannot listen on {args.host}:{args.port}: {error}", file=sys.stderr)
        return 2
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"serving http://{args.host}:{server.server_address[1]}/", file=sys.stderr)
    try:
        _loop(scheduler)
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()
        server.server_close()
        scheduler.close()
    return 0
