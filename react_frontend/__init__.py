"""Serve the React build through this checkout's run-start HTTP service."""

from __future__ import annotations

import json
import gzip
import os
import re
import threading
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from functools import partialmethod
from pathlib import Path
from typing import Any
from urllib.parse import SplitResult, parse_qs, unquote

from deploy_workflow import http_base
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox import teams
from deploy_workflow.inbox.scheduler import Scheduler, Settings
from deploy_workflow import reference_fetch
from deploy_workflow.run_start import service, standing_portfolios
from deploy_workflow.accounts import store as account_store
from deploy_workflow.signal import fetch as signal_fetch
from deploy_vii.contracts import PATHWAY_CAP_USD, PathwayId

from . import (
    admission,
    artifacts,
    auth_gate,
    coverage,
    portfolio,
    run_activity,
    signal_host,
    sources,
)
from .library_cards import lead_summary, not_assessable_modules

PROJECT = Path(__file__).resolve().parent.parent
RUN_ID = re.compile(r"[0-9A-Za-z][0-9A-Za-z._-]{0,79}")
RUN_PAGE = re.compile(rf"/run/{RUN_ID.pattern}/?")
RUN_ACTIVITY = re.compile(rf"/connected/activity(?:/({RUN_ID.pattern}))?")
REPORT_PAGE = re.compile(r"/report/([^/]+)/?")
REPORT_FOLDER = re.compile(r"[\w. -]+")
REPORT_PREFIX = "/connected/report/"
STATIC_FILES = {"/data.js", "/symbol.svg", "/THIRD-PARTY-NOTICES.md"}
STATIC_DIRS = ("/assets/", "/connected-assets/", "/fonts/")
STABLE_NAME_CACHE = "public, max-age=86400"


def _valid_report_folder(folder: str) -> bool:
    return folder not in {".", ".."} and REPORT_FOLDER.fullmatch(folder) is not None


def _report_page(path: str) -> bool:
    """Match a retained library folder without extending the scheduler's run ID grammar."""
    found = REPORT_PAGE.fullmatch(path)
    folder = unquote(found[1]) if found else ""
    return _valid_report_folder(folder)


def _visible_publication(layout: Layout) -> tuple[bytes, dict[str, Any] | None]:
    return _visible_scope(layout, None)


def _visible_scope(layout: Layout, folder: str | None) -> tuple[bytes, dict[str, Any] | None]:
    admitted = _admitted_scope(layout, folder)
    if admitted is None:
        return b"null", None
    visible = sources.enrich(admitted, layout.runs)
    # This identity belongs to the HTTP projection, not the stored publication.
    visible.pop("reportFolder", None)
    if folder is not None:
        visible["reportFolder"] = folder
    workspace = visible["workspace"]
    for key, record in workspace["runs"].items():
        record.update(_report_metadata(workspace, record, key))
        if not record["publicationVerified"]:
            record.pop("actionTreatment", None)
    visible["catalogue"] = _without_workspace(visible["catalogue"])
    return json.dumps(visible, ensure_ascii=False).encode("utf-8"), visible


def _without_workspace(catalogue: dict[str, Any]) -> dict[str, Any]:
    """The catalogue without ``workspace``: an older build wrote the service's folder there, and
    nothing reads it. Every reply that sends the catalogue drops it here."""
    return {key: value for key, value in catalogue.items() if key != "workspace"}


def _admitted_scope(layout: Layout, folder: str | None) -> dict[str, Any] | None:
    snapshot = admission.published(layout)
    if snapshot is None:
        if folder is not None:
            raise http_base.refuse(404, "unknown report")
        return None
    admitted = admission.admitted(snapshot, layout)
    if folder is not None:
        scoped = sources.scoped(admitted, folder)
        if scoped is None:
            raise http_base.refuse(404, "unknown report")
        admitted = scoped
    return admitted


def _report_metadata(workspace: dict[str, Any], record: dict[str, Any], key: str) -> dict[str, Any]:
    verified = record.get("publicationVerified") is True
    return {
        "publicationVerified": verified,
        "lead": lead_summary(workspace, record, key) if verified else None,
        "assessmentScope": (record.get("assessmentScope") or "unverified")
        if verified
        else "unverified",
        "publishedAt": record.get("publishedAt") if verified else None,
    }


def _library_index(layout: Layout) -> http_base.Reply:
    snapshot = admission.published(layout)
    if snapshot is None:
        return http_base.Reply(200, None)
    visible = admission.admitted(snapshot, layout)
    runs = {}
    for key, record in visible["workspace"].get("runs", {}).items():
        kept = {
            field: record[field] for field in ("folder", "issuerKey", "pathway") if field in record
        }
        kept.update(_report_metadata(visible["workspace"], record, key))
        runs[key] = kept
    # Without each run's ``files``: every file of its run folder (about 40 kB a run, 95% of this
    # reply), which no page of the library reads.
    listed = [
        {field: value for field, value in run.items() if field != "files"}
        for run in visible["catalogue"].get("real", [])
    ]
    return http_base.Reply(
        200,
        {
            "catalogue": {"real": listed},
            "workspace": {"runs": runs},
            "preview": visible.get("preview"),
        },
        {"Cache-Control": "no-store"},
    )


def _scope_query(query: str) -> str | None:
    if not query:
        return None
    if re.search(r"%(?![0-9A-Fa-f]{2})", query):
        raise http_base.refuse(400, "invalid report query")
    try:
        values = parse_qs(
            query, keep_blank_values=True, strict_parsing=True, encoding="utf-8", errors="strict"
        )
    except (UnicodeDecodeError, ValueError) as error:
        raise http_base.refuse(400, "invalid report query") from error
    if set(values) != {"run"} or len(values["run"]) != 1:
        raise http_base.refuse(400, "invalid report query")
    folder = values["run"][0]
    if not folder:
        raise http_base.refuse(400, "invalid report query")
    if not _valid_report_folder(folder):
        raise http_base.refuse(404, "unknown report")
    return folder


def _vary(headers: dict[str, str]) -> None:
    name = next((key for key in headers if key.lower() == "vary"), "Vary")
    values = {value.strip().lower() for value in headers.get(name, "").split(",") if value.strip()}
    if "*" not in values and "accept-encoding" not in values:
        headers[name] = ", ".join((*headers.get(name, "").split(", "), "Accept-Encoding")).lstrip(
            ", "
        )


def _gzip_quality(header: str) -> float:
    """Read gzip's quality value; malformed or duplicated gzip directives fail closed."""
    direct: list[float] = []
    wildcard: list[float] = []
    for item in header.split(","):
        pieces = [piece.strip() for piece in item.split(";")]
        encoding = pieces[0].lower()
        q = 1.0
        malformed = False
        seen_q = False
        for parameter in pieces[1:]:
            if parameter.lower().startswith("q="):
                if seen_q:
                    malformed = True
                    continue
                seen_q = True
                text = parameter[2:].strip()
                if re.fullmatch(r"(?:0(?:\.[0-9]{0,3})?|1(?:\.0{0,3})?)", text) is None:
                    malformed = True
                else:
                    q = float(text)
        if malformed:
            q = 0.0
        if encoding == "gzip":
            direct.append(q)
        elif encoding == "*":
            wildcard.append(q)
    if direct:
        return direct[0] if len(direct) == 1 else 0.0
    return wildcard[0] if len(wildcard) == 1 else 0.0


def _compressible(reply: http_base.Reply, path: str) -> bool:
    if path.startswith(sources.PREFIX) or not isinstance(reply.body, (bytes, bytearray)):
        return False
    media = next(
        (value.lower() for key, value in reply.headers.items() if key.lower() == "content-type"), ""
    )
    media = media.partition(";")[0].strip()
    return media.startswith("text/") or media in {
        "application/json",
        "application/javascript",
        "application/xml",
        "image/svg+xml",
    }


def _report_entries(snapshot: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    if snapshot is None:
        return {}
    workspace = snapshot["workspace"]
    workspace_runs = {run["folder"]: (key, run) for key, run in workspace["runs"].items()}
    entries = {}
    for run in snapshot["catalogue"]["real"]:
        run_id = run["id"]
        if not _valid_report_folder(run_id) or run_id not in workspace_runs:
            continue
        key, record = workspace_runs[run_id]
        entry: dict[str, Any] = {
            "id": run_id,
            "issuer": run["name"],
            "asOf": run["date"] or "",
            "pathway": record["pathway"] or "",
        }
        blocked = not_assessable_modules(workspace, record, key)
        if blocked:
            entry["not_assessable"] = blocked
        entries[run_id] = entry
    return entries


def _read_page(
    dist: Path, *, synthetic: bool, signal: bool, read_only: bool = False, sign_in: bool = False
) -> bytes:
    connected = dist / "connected.html"
    page = (connected if connected.is_file() else dist / "index.html").read_bytes()
    if b"<head>" not in page or page.count(b"connect-src 'none'") != 1:
        raise ValueError("the React build must include its offline index policy")
    mode = "preview" if read_only else "synthetic" if synthetic else "live"
    metadata = (
        '<meta name="credit-os-backend" content="legacy">'
        f'<meta name="credit-os-mode" content="{mode}">'
    )
    if signal:  # exactly where Signal is hosted: the page shows its screens
        metadata += '<meta name="credit-os-signal" content="on">'
    if sign_in:  # exactly where the live application asks for a session
        metadata += '<meta name="credit-os-sign-in" content="on">'
    page = page.replace(b"connect-src 'none'", b"connect-src 'self'", 1)
    page = page.replace(b"<head>", b"<head>" + metadata.encode("ascii"), 1)
    return page.replace(b'src="./', b'src="/').replace(b'href="./', b'href="/')


def _asset_path(dist: Path, path: str) -> tuple[Path, str, bool] | None:
    if path in STATIC_FILES:
        return dist, path, True
    for prefix in STATIC_DIRS:
        if path.startswith(prefix):
            return dist / prefix.strip("/"), path.removeprefix(prefix), False
    return None


def _static_cache(path: str, relative: str) -> str | None:
    """The Cache-Control of a static file: a hash-named build file never changes; a font or the
    symbol keeps its name across releases, so it is fresh for a day only; any other gets none."""
    if path.startswith(("/assets/", "/connected-assets/")) and re.search(
        r"-[A-Za-z0-9_-]{8,}\.", relative
    ):
        return "public, max-age=31536000, immutable"
    if path == "/symbol.svg" or (path.startswith("/fonts/") and relative.endswith(".woff2")):
        return STABLE_NAME_CACHE
    return None


def _app_page(path: str, *, signal: bool = False) -> bool:
    """Whether ``path`` is a page of the app; ``/signal`` only where Signal is hosted."""
    return bool(
        path in {"/", "/index.html", "/start", "/runs", "/coverage"}
        or (signal and path in signal_host.PAGE_PATHS)
        or RUN_PAGE.fullmatch(path)
        or _report_page(path)
    )


def _report_request(path: str) -> tuple[bool, str]:
    listing = path == "/connected/reports"
    run_id = unquote(path.removeprefix(REPORT_PREFIX))
    if not listing and not _valid_report_folder(run_id):
        raise http_base.refuse(404, "unknown report")
    return listing, run_id


def _report_response(
    entries: dict[str, dict[str, str]], listing: bool, run_id: str
) -> http_base.Reply:
    if listing:
        return http_base.Reply(200, {"reports": list(entries.values())})
    if run_id not in entries:
        return http_base.refuse(404, "unknown report")
    return http_base.Reply(200, entries[run_id])


def _require_writable(read_only: bool) -> None:
    if read_only:
        raise http_base.refuse(405, "read-only retained preview")


def _connected_reply(
    layout: Layout, url: SplitResult, context: dict[str, Any], caps: Mapping[PathwayId, str]
) -> http_base.Reply | None:
    path = url.path
    if path == "/connected/context":
        return http_base.Reply(200, {"copilot_models": {}, **context, "submission_caps_usd": caps})
    if match := RUN_ACTIVITY.fullmatch(path):  # one run by its ID, or the runs in progress
        return run_activity.reply(layout, match[1]) if match[1] else run_activity.listing(layout)
    if path == "/connected/library":
        return _library_index(layout)
    if path == "/connected/snapshot":
        folder = _scope_query(url.query)
        payload, _ = _visible_scope(layout, folder)
        return http_base.Reply(
            200, payload, {"Content-Type": http_base.JSON, "Cache-Control": "no-store"}
        )
    if path.startswith(sources.PREFIX):
        return sources.reply(url, layout.runs, _admitted_scope(layout, None))
    return _connected_report_reply(layout, path, url)


def _connected_report_reply(layout: Layout, path: str, url: SplitResult) -> http_base.Reply | None:
    if path == "/connected/coverage":
        body = coverage.coverage(_admitted_scope(layout, None))
        return http_base.Reply(200, body, {"Cache-Control": "no-store"})
    if match := artifacts.GRAPH.fullmatch(path):
        snapshot = _admitted_scope(layout, None)
        return artifacts.reply(match, layout.engine / "runs", REPORT_FOLDER, snapshot)
    if match := portfolio.PORTFOLIO.fullmatch(path):
        snapshot = _admitted_scope(layout, None)
        basis = portfolio.attested(layout.runs, match[1], snapshot)
        return http_base.Reply(200, {"basis": basis}, {"Cache-Control": "no-store"})
    if path == "/connected/reports" or path.startswith(REPORT_PREFIX):
        listing, run_id = _report_request(path)
        snapshot = admission.published(layout)
        if snapshot is not None:
            snapshot = admission.admitted(snapshot, layout)
        return _report_response(_report_entries(snapshot), listing, run_id)
    return None


def _form_template(*, synthetic: bool) -> dict[str, Any]:
    """The context the start form opens from: the example case's settings, without its issuer.

    The issuer is the analyst's to name, so its name and ID reach the form empty and the form
    shows an example only as a placeholder (audit J2-002)."""
    template: dict[str, Any] = json.loads(
        (PROJECT / "cases/context/research-minimal.json").read_bytes()
    )
    template["identity"].update(issuer_name="", issuer_id="")
    if synthetic:
        template["run"]["case_kind"] = "synthetic"
    return template


class _SignalReplies(service.Handler):
    """The run start handler whose replies under ``/signal/api/`` carry Signal's headers where
    `hosted` is a host (``signal_host.reply_headers``)."""

    hosted: signal_host.SignalHost | None = None
    raw_requestline: bytes  # set by http.server before any reply; its stubs do not list it
    accounts: Path | None = None  # the resolved account store folder where sign-in is on
    account: account_store.Account | None = None  # who the gate found (None without a session)

    def check_origin(self) -> None:
        super().check_origin()
        if self.accounts is not None:
            self.account = auth_gate.check(
                self, self.accounts, lambda path: _app_page(path, signal=self.hosted is not None)
            )

    def end_headers(self) -> None:
        # Here, as the base's own: every reply passes, those http.server writes itself included.
        for name, value in signal_host.reply_headers(self.hosted, self.raw_requestline).items():
            self.send_header(name, value)
        super().end_headers()


def _auth_me(accounts: Path | None, path: str, account: account_store.Account | None) -> None:
    """Where sign-in is on, answer ``GET /auth/me``: the signed-in account, or none."""
    if accounts is None or path != "/auth/me":
        return
    shown = None
    if account is not None:
        shown = {
            "id": account.id,
            "display_name": account.display_name,
            "profile_type": account.profile_type,
        }
    raise http_base.Reply(200, {"account": shown})


def _only_get(accounts: Path | None, path: str) -> None:
    """``/auth/me`` answers GET only (reached with a session; the gate refused the rest)."""
    if accounts is not None and path == "/auth/me":
        raise http_base.Reply(405, {"error": "method not allowed"}, {"Allow": "GET"})


def _handler(
    dist: Path,
    page: bytes,
    context: dict[str, Any],
    *,
    read_only: bool = False,
    signal: signal_host.SignalHost | None = None,
) -> type[_SignalReplies]:
    caps = {pathway: str(amount) for pathway, amount in PATHWAY_CAP_USD.items()}

    class Handler(_SignalReplies):
        hosted = signal

        def send_reply(self, reply: http_base.Reply) -> None:
            if isinstance(reply.body, bytes):
                body, headers = reply.body, dict(reply.headers)
            else:
                body = json.dumps(reply.body, ensure_ascii=False).encode("utf-8")
                headers = {
                    "Content-Type": http_base.JSON,
                    "Cache-Control": "no-store",
                    **reply.headers,
                }
            response = http_base.Reply(reply.status, body, headers)
            if _compressible(response, self.path):
                _vary(headers)
                quality = _gzip_quality(self.headers.get("Accept-Encoding", ""))
                if quality > 0:
                    compressed = gzip.compress(body, mtime=0)
                    if len(body) >= 256 and len(compressed) < len(body):
                        headers["Content-Encoding"] = "gzip"
                        response = http_base.Reply(reply.status, compressed, headers)
                    else:
                        response = http_base.Reply(reply.status, body, headers)
                else:
                    response = http_base.Reply(reply.status, body, headers)
            super().send_reply(response)

        def _post(self, url: SplitResult) -> None:
            _only_get(self.accounts, url.path)
            signal_host.divert(signal, self, url)
            _require_writable(read_only)
            super()._post(url)

        def _delete(self, url: SplitResult) -> None:
            _only_get(self.accounts, url.path)
            signal_host.divert(signal, self, url)
            _require_writable(read_only)
            super()._delete(url)

        do_PUT = do_PATCH = do_HEAD = do_OPTIONS = partialmethod(signal_host.other_method, signal)

        def _get(self, url: SplitResult) -> None:
            path = url.path
            if path in auth_gate.LIBRARY_PATHS:
                raise http_base.Reply(308, b"", {"Location": "/"})
            if _app_page(path, signal=signal is not None):
                raise http_base.Reply(
                    200,
                    page,
                    {
                        "Content-Type": "text/html; charset=utf-8",
                        "Content-Security-Policy": "frame-ancestors 'none'",
                        "X-Frame-Options": "DENY",
                        "Cache-Control": "no-store",
                    },
                )
            signal_host.divert(signal, self, url)
            _auth_me(self.accounts, path, self.account)
            reply = _connected_reply(self._layout, url, context, caps)
            if reply is not None:
                raise reply
            if asset := _asset_path(dist, path):
                base, relative, direct = asset
                response = self._file(base, relative, direct=direct)
                if cache := _static_cache(path, relative):
                    response.headers["Cache-Control"] = cache
                raise response
            super()._get(url)

        def _publication(self, folder: str | None = None) -> tuple[bytes, dict[str, Any] | None]:
            return _visible_scope(self._layout, folder)

    return Handler


class Server(service._Server):
    """The application's server: the run start service's, and the Signal it hosts (None in the
    read-only preview and in synthetic mode)."""

    signal: signal_host.SignalHost | None = None


def _is_inside(folder: Path, root: Path) -> bool:
    """Whether ``folder`` is ``root`` or under it by file identity (a case variant or an alias of
    the volume names the same folder): ``folder`` itself or any ancestor that exists is the same
    file as ``root``. Creates nothing."""
    if not root.exists():
        return False
    return any(p.exists() and os.path.samefile(p, root) for p in (folder, *folder.parents))


def _accounts_folder(
    root: Path, *, sign_in: bool, accounts_dir: Path | None, preview: bool
) -> Path | None:
    """The resolved account store folder where sign-in is on, else None (``accounts_dir`` is then
    ignored). The folder is opened once here, so a bad one fails at start-up with the store's own
    ``StoreError``."""
    if not sign_in:
        return None
    if preview:
        raise ValueError("sign-in is for the live application only")
    if accounts_dir is None:
        raise ValueError("sign-in needs the account store's folder")
    if not accounts_dir.is_absolute():  # before resolving: the store's own refusal, first
        raise account_store.StoreError(account_store.RELATIVE_FOLDER)
    folder = accounts_dir.resolve()
    if folder.is_relative_to(root.resolve()) or _is_inside(accounts_dir, root):
        raise ValueError("the account store's folder must not be inside the shared folder")
    account_store.open_db(folder).close()
    return folder


def _offline_resolve(host: str) -> Iterator[str]:
    """The ruled synthetic-mode behaviour (not a stand-in): a synthetic run fetches nothing, so no
    lookup or connection is made. Each fetchable standing key records this refusal as its failure
    in the run root, which stops later automatic fetches there, so the root must be throwaway
    (``proof/serve.py`` enforces an empty one)."""
    raise signal_fetch.FetchRefused("a synthetic run fetches nothing")


@contextmanager
def make_server(  # noqa: PLR0913 - explicit launcher, mode and server options
    root: Path,
    *,
    web: Path | None = None,
    port: int = 0,
    launcher: tuple[str, ...] | None = None,
    synthetic: bool = False,
    read_only: bool = False,
    copilot_models: Mapping[str, frozenset[str]] | None = None,
    environ: Mapping[str, str] | None = None,
    sign_in: bool = False,
    accounts_dir: Path | None = None,
) -> Iterator[Server]:
    """Hold the upstream scheduler for the lifetime of the React HTTP server.

    Signal is hosted in live mode only: its routes are answered here, and ``server.signal`` is its
    host. No thread is started for it (``serve`` runs its loop). `environ` is the launching
    environment (the process's own when left out), read only for whether Signal's AI gate may see
    it (``signal_host.ai_environ``)."""
    if (synthetic and not launcher) or (not synthetic and launcher is not None):
        raise ValueError("an explicit launcher is required in synthetic mode only")
    if not 0 <= port <= 65535:
        raise ValueError("--port must be from 0 to 65535")
    accounts = _accounts_folder(
        root, sign_in=sign_in, accounts_dir=accounts_dir, preview=read_only or synthetic
    )
    dist = (web or PROJECT / "web" / "dist").resolve()
    # A proof run and the read-only preview open no feed store and run no background loop.
    hosted = None
    if not (read_only or synthetic):
        hosted = signal_host.SignalHost(root, environ=os.environ if environ is None else environ)
    page = _read_page(
        dist,
        synthetic=synthetic,
        signal=hosted is not None,
        read_only=read_only,
        sign_in=accounts is not None,
    )
    context = _form_template(synthetic=synthetic)
    settings = (  # Teams cards are for real runs only: a synthetic service never posts
        Settings(
            root,
            teams=teams.config_from_environment(teams.CONNECTED_PAGES),
            copilot_models=copilot_models or {},
        )
        if launcher is None
        else Settings(root, launcher=launcher, poll_seconds=0.2, copilot_models=None)
    )
    scheduler = Scheduler(settings)
    context["copilot_models"] = scheduler.model_choices
    handler = _handler(dist, page, context, read_only=read_only, signal=hosted)
    handler.accounts = accounts
    try:
        with Server(("127.0.0.1", port), handler) as server:
            server.scheduler, server.signal = scheduler, hosted
            server.standing = standing_portfolios.Desk(
                reference_fetch.Wiring(resolve=_offline_resolve) if synthetic else None
            )
            yield server
    finally:
        scheduler.close()


def serve(  # noqa: PLR0913 - match the server options
    root: Path,
    *,
    web: Path | None = None,
    port: int = 0,
    launcher: tuple[str, ...] | None = None,
    synthetic: bool = False,
    copilot_models: Mapping[str, frozenset[str]] | None = None,
    environ: Mapping[str, str] | None = None,
    sign_in: bool = False,
    accounts_dir: Path | None = None,
) -> None:
    """Serve until interrupted: the HTTP server, the scheduler loop and, where Signal is hosted,
    its loop (started once the server is bound, stopped and joined on the way out). OSError
    when Signal's store cannot be opened."""
    with (
        make_server(
            root,
            web=web,
            port=port,
            launcher=launcher,
            synthetic=synthetic,
            copilot_models=copilot_models,
            environ=environ,
            sign_in=sign_in,
            accounts_dir=accounts_dir,
        ) as server,
        signal_host.running(server.signal),
    ):
        worker = threading.Thread(target=server.serve_forever)
        worker.start()
        try:
            print(f"http://127.0.0.1:{server.server_address[1]}/", flush=True)
            service._loop(server.scheduler)
        finally:
            server.shutdown()
            worker.join()
