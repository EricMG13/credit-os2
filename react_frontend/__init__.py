"""Serve the React build through this checkout's run-start HTTP service."""

from __future__ import annotations

import json
import gzip
import re
import threading
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from pathlib import Path
from typing import Any
from urllib.parse import SplitResult, parse_qs, unquote

from deploy_workflow import http_base
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox import teams
from deploy_workflow.inbox.scheduler import Scheduler, Settings
from deploy_workflow.run_start import service
from deploy_vii.contracts import PATHWAY_CAP_USD, PathwayId

from . import admission, artifacts, portfolio, run_activity, sources
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
EXPORT_PREFIX = "window.CREDIT_OS_DATA="
EXPORT_KEYS = ("catalogue", "workspace", "activity", "chips")


def _valid_report_folder(folder: str) -> bool:
    return folder not in {".", ".."} and REPORT_FOLDER.fullmatch(folder) is not None


def _report_page(path: str) -> bool:
    """Match a retained library folder without extending the scheduler's run ID grammar."""
    found = REPORT_PAGE.fullmatch(path)
    folder = unquote(found[1]) if found else ""
    return _valid_report_folder(folder)


def _invalid_json(constant: str) -> None:
    raise ValueError(f"invalid JSON constant {constant}")


def _read_publication(path: Path) -> tuple[bytes, dict[str, Any] | None]:
    """Decode the published assignment as JSON and retain the original JSON bytes."""
    raw = http_base.read_regular(path)
    if raw is None:
        return b"null", None
    encoded, snapshot = _decode_publication(raw)
    if any(not isinstance(snapshot.get(key), dict) for key in EXPORT_KEYS):
        raise ValueError("invalid issuer library snapshot")
    return encoded, snapshot


def _decode_publication(raw: bytes) -> tuple[bytes, dict[str, Any]]:
    """The assignment's JSON object and its original bytes; anything else is refused."""
    assignment = raw.decode("utf-8").rstrip()
    if not assignment.startswith(EXPORT_PREFIX) or not assignment.endswith(";"):
        raise ValueError("invalid issuer library export")
    encoded = assignment[len(EXPORT_PREFIX) : -1]
    snapshot = json.loads(encoded, parse_constant=_invalid_json)
    if not isinstance(snapshot, dict):
        raise TypeError("invalid issuer library snapshot")
    return encoded.encode("utf-8"), snapshot


def _visible_publication(layout: Layout) -> tuple[bytes, dict[str, Any] | None]:
    return _visible_scope(layout, None)


def _visible_scope(layout: Layout, folder: str | None) -> tuple[bytes, dict[str, Any] | None]:
    admitted = _admitted_scope(layout, folder)
    if admitted is None:
        return b"null", None
    visible = sources.enrich(admitted, layout.runs)
    visible["catalogue"] = _without_workspace(visible["catalogue"])
    return json.dumps(visible, ensure_ascii=False).encode("utf-8"), visible


def _without_workspace(catalogue: dict[str, Any]) -> dict[str, Any]:
    """The catalogue without ``workspace``: an older build wrote the service's folder there, and
    nothing reads it. Every reply that sends the catalogue drops it here."""
    return {key: value for key, value in catalogue.items() if key != "workspace"}


def _library_data(reply: http_base.Reply) -> http_base.Reply:
    """The library page's data.js without the ``catalogue.workspace`` an older build wrote.

    Recognised by its assignment, not its path, so every spelling of the path is covered. A file
    without the key is answered as read; one that begins with the assignment and is not a JSON
    object is refused, as the snapshot refuses it."""
    body = reply.body
    if not (isinstance(body, bytes) and body.startswith(EXPORT_PREFIX.encode("ascii"))):
        return reply
    _, snapshot = _decode_publication(body)
    catalogue = snapshot.get("catalogue")
    if not (isinstance(catalogue, dict) and "workspace" in catalogue):
        return reply
    # The builder's own form (update_library.embedded_json): ASCII, and no "<" to open a tag.
    kept = {**snapshot, "catalogue": _without_workspace(catalogue)}
    text = json.dumps(kept, ensure_ascii=True, allow_nan=False).replace("<", "\\u003c")
    return http_base.Reply(reply.status, f"{EXPORT_PREFIX}{text};\n".encode("ascii"), reply.headers)


def _admitted_scope(layout: Layout, folder: str | None) -> dict[str, Any] | None:
    payload, snapshot = _read_publication(layout.engine / "library" / "data.js")
    del payload
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


def _library_index(layout: Layout) -> http_base.Reply:
    _, snapshot = _read_publication(layout.engine / "library" / "data.js")
    if snapshot is None:
        return http_base.Reply(200, None)
    visible = admission.admitted(snapshot, layout)
    runs = {}
    for key, record in visible["workspace"].get("runs", {}).items():
        kept = {
            field: record[field] for field in ("folder", "issuerKey", "pathway") if field in record
        }
        lead = lead_summary(visible["workspace"], record, key)
        if lead is not None:
            kept["lead"] = lead
        runs[key] = kept
    return http_base.Reply(
        200,
        {
            "catalogue": {"real": visible["catalogue"].get("real", [])},
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


def _read_page(dist: Path, *, synthetic: bool, signal_url: str) -> bytes:
    connected = dist / "connected.html"
    page = (connected if connected.is_file() else dist / "index.html").read_bytes()
    if b"<head>" not in page or page.count(b"connect-src 'none'") != 1:
        raise ValueError("the React build must include its offline index policy")
    mode = "synthetic" if synthetic else "live"
    metadata = (
        '<meta name="credit-os-backend" content="legacy">'
        f'<meta name="credit-os-mode" content="{mode}">'
    )
    if signal_url:
        metadata += f'<meta name="credit-os-signal-url" content="{signal_url}">'
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


def _app_page(path: str) -> bool:
    return bool(
        path in {"/", "/index.html", "/start", "/runs"}
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
        return http_base.Reply(200, {**context, "submission_caps_usd": caps})
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
    if match := artifacts.GRAPH.fullmatch(path):
        snapshot = _admitted_scope(layout, None)
        return artifacts.reply(match, layout.engine / "runs", REPORT_FOLDER, snapshot)
    if match := portfolio.PORTFOLIO.fullmatch(path):
        snapshot = _admitted_scope(layout, None)
        basis = portfolio.attested(layout.runs, match[1], snapshot)
        return http_base.Reply(200, {"basis": basis}, {"Cache-Control": "no-store"})
    if path == "/connected/reports" or path.startswith(REPORT_PREFIX):
        listing, run_id = _report_request(path)
        _, snapshot = _read_publication(layout.engine / "library" / "data.js")
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


def _handler(
    dist: Path, page: bytes, context: dict[str, Any], *, read_only: bool = False
) -> type[service.Handler]:
    caps = {pathway: str(amount) for pathway, amount in PATHWAY_CAP_USD.items()}

    class Handler(service.Handler):
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
            _require_writable(read_only)
            super()._post(url)

        def _delete(self, url: SplitResult) -> None:
            _require_writable(read_only)
            super()._delete(url)

        def _get(self, url: SplitResult) -> None:
            path = url.path
            if _app_page(path):
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
            reply = _connected_reply(self._layout, url, context, caps)
            if reply is not None:
                raise reply
            if asset := _asset_path(dist, path):
                base, relative, direct = asset
                response = self._file(base, relative, direct=direct)
                if path.startswith(("/assets/", "/connected-assets/")) and re.search(
                    r"-[A-Za-z0-9_-]{8,}\.", relative
                ):
                    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
                raise response
            super()._get(url)

        def _file(self, base: Path, relative: str, *, direct: bool) -> http_base.Reply:
            reply = super()._file(base, relative, direct=direct)
            return _library_data(reply) if base == self._layout.engine / "library" else reply

        def _publication(self, folder: str | None = None) -> tuple[bytes, dict[str, Any] | None]:
            return _visible_scope(self._layout, folder)

    return Handler


@contextmanager
def make_server(  # noqa: PLR0913 - explicit launcher, mode and server options
    root: Path,
    *,
    web: Path | None = None,
    port: int = 0,
    launcher: tuple[str, ...] | None = None,
    synthetic: bool = False,
    signal_url: str = "",
    read_only: bool = False,
) -> Iterator[service._Server]:
    """Hold the upstream scheduler for the lifetime of the React HTTP server."""
    if (synthetic and not launcher) or (not synthetic and launcher is not None):
        raise ValueError("an explicit launcher is required in synthetic mode only")
    if not 0 <= port <= 65535:
        raise ValueError("--port must be from 0 to 65535")
    dist = (web or PROJECT / "web" / "dist").resolve()
    signal_link = service.signal_link(signal_url) if signal_url else ""
    page = _read_page(dist, synthetic=synthetic, signal_url=signal_link)
    context = _form_template(synthetic=synthetic)
    settings = (  # Teams cards are for real runs only: a synthetic service never posts
        Settings(root, teams=teams.config_from_environment(teams.CONNECTED_PAGES))
        if launcher is None
        else Settings(root, launcher=launcher, poll_seconds=0.2)
    )
    scheduler = Scheduler(settings)
    try:
        with service.make_server(scheduler, "127.0.0.1", port, signal_link) as server:
            server.RequestHandlerClass = _handler(dist, page, context, read_only=read_only)
            assert isinstance(server, service._Server)
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
    signal_url: str = "",
) -> None:
    with make_server(
        root, web=web, port=port, launcher=launcher, synthetic=synthetic, signal_url=signal_url
    ) as server:
        worker = threading.Thread(target=server.serve_forever)
        worker.start()
        try:
            print(f"http://127.0.0.1:{server.server_address[1]}/", flush=True)
            service._loop(server.scheduler)
        finally:
            server.shutdown()
            worker.join()
