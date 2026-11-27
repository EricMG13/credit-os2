"""Serve the private Credit OS2 development ledger on loopback."""

from __future__ import annotations

import argparse
import secrets
import sqlite3
import sys
from contextlib import closing
from datetime import UTC, datetime
from html import escape
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urlsplit

if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.dev_ledger import (
    DECISION_LABELS,
    decision_kind,
    decision_summary,
    project_database,
    rank_decisions,
    run_status,
)

ASSETS = Path(__file__).with_suffix("")
CSP = (
    "default-src 'none'; style-src 'self'; script-src 'self'; "
    "frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
)


def address(path: str, **query: str) -> str:
    return escape(f"{path}?{urlencode(query)}", quote=True)


def stamp(value: int | None) -> str:
    return datetime.fromtimestamp(value, UTC).strftime("%d %b %Y, %H:%M UTC") if value else "—"


def page_html(path: str, contents: str) -> bytes:
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Development coordinator · Credit OS2</title>
<link rel="stylesheet" href="{path}dashboard.css">
<script src="{path}dashboard.js" defer></script>
</head>
<body>
<a href="#main" class="skip">Skip to dashboard</a>
<header class="shell"><div class="frame brand">Credit OS2 <span>Development</span></div></header>
<main id="main" class="frame">
<h1>Development coordinator</h1>
{contents}
</main>
</body>
</html>""".encode()


def run_selector(path: str, runs: list[sqlite3.Row], selected: str) -> str:
    options = "".join(
        f'<option value="{escape(row["id"])}"{" selected" if row["id"] == selected else ""}>'
        f"{escape(row['id'])} · {escape(row['state']).title()}</option>"
        for row in runs
    )
    return f"""<form method="get" action="{path}" class="selector">
<label for="run">Run</label>
<select name="run" id="run">{options}</select>
<button type="submit">View run</button>
<a class="button subtle" href="{address(path, run=selected)}">Refresh</a>
</form>"""


def decision_row(path: str, run: str, item: dict[str, Any], selected: str) -> str:
    ident = item["id"]
    status = ' aria-current="true"' if ident == selected else ""
    return f"""<li>
<a class="decision" href="{address(path, run=run, decision=ident)}#detail"{status}>
<span class="decision-id">{escape(ident)}</span>
<span>{escape(decision_summary(item["payload"]))}</span>
<span class="arrow" aria-hidden="true">›</span>
</a></li>"""


def decision_queue(path: str, report: dict[str, Any], selected: str) -> str:
    ranked = rank_decisions(report["decisions"])
    groups: dict[str, list[str]] = {kind: [] for kind in DECISION_LABELS}
    for item in ranked:
        groups[decision_kind(item["payload"])].append(
            decision_row(path, report["run"], item, selected)
        )
    sections = "".join(
        f'<section class="group {kind}"><h3>{label} <span>{len(rows)}</span></h3>'
        f"<ul>{''.join(rows)}</ul></section>"
        for kind, label in DECISION_LABELS.items()
        if (rows := groups[kind])
    )
    return sections or '<p class="empty">No decisions have been recorded for this run.</p>'


def decision_details(path: str, run: str, item: dict[str, Any] | None) -> str:
    if item is None:
        return (
            '<aside id="detail" class="panel"><h2>Decision details</h2>'
            "<p>Select a decision.</p></aside>"
        )
    ident = item["id"]
    payload = item["payload"]
    fields = (
        ("choice", "Choice"),
        ("consequence", "Consequence"),
        ("urgency", "Urgency"),
        ("reason", "Reason"),
        ("recommendation", "Recommendation"),
        ("alternative", "Alternative"),
        ("affected_work", "Affected work"),
        ("evidence", "Evidence"),
    )
    context = "".join(
        f"<dt>{label}</dt><dd>{escape(str(payload[key]))}</dd>"
        for key, label in fields
        if payload.get(key)
    )
    replaced_by = item.get("replaced_by")
    current = ""
    change_button = ""
    if replaced_by:
        href = address(path, run=run, decision=replaced_by)
        current = f'<p>Resolved by <a href="{href}#detail">{escape(replaced_by)}</a>.</p>'
    else:
        change = f"For Credit OS2 run {run}, decision {ident}, please change the choice to: "
        change_button = (
            f'<button type="button" data-prompt="{escape(change)}">Draft change request</button>'
        )
    prefix = f"For Credit OS2 run {run}, decision {ident}"
    explain = f"{prefix}, explain the choice and evidence."
    return f"""<aside id="detail" class="panel">
<h2>Decision details</h2>
<div class="detail-id"><b>{escape(ident)}</b> <span>Revision {item["revision"]}</span></div>
<p>{escape(decision_summary(payload))}</p>
<dl class="context">{context}</dl>
{current}
<h3>Reply to the coordinator</h3>
<div class="actions">
<button type="button" data-prompt="{escape(explain)}">Draft explanation request</button>
{change_button}
</div>
<label for="reply">Prompt</label>
<textarea id="reply" rows="4">{escape(explain)}</textarea>
<div class="actions"><button class="primary" type="button" id="copy">Copy prompt</button>
<span role="status" id="copy-status"></span></div>
<p class="hint">Paste the prompt into your coordinator chat when ready.</p>
</aside>"""


def attempts_table(attempts: list[dict[str, Any]], observed: dict[str, str]) -> str:
    if not attempts:
        return '<p class="empty">No workers have started.</p>'
    rows = "".join(
        f'<tr><th scope="row">{escape(row["id"])}</th><td>{escape(row["state"]).title()}</td>'
        f"<td>{row['revision']}</td><td>{escape(observed.get(row['id'], '—'))}</td>"
        f"<td>{row['reserved']}</td>"
        f"<td>{row['settled'] if row['settled'] is not None else '—'}</td></tr>"
        for row in attempts
    )
    return f"""<div class="table-wrap" role="region" aria-label="Workers" tabindex="0"><table>
<thead><tr><th>Attempt</th><th>Status</th><th>Revision</th><th>Observed model</th>
<th>Reserved</th><th>Settled</th></tr></thead>
<tbody>{rows}</tbody></table></div>"""


def show_run(path: str, report: dict[str, Any], chosen: str, observed: dict[str, str]) -> str:
    selected = next((item for item in report["decisions"] if item["id"] == chosen), None)
    spend = report["project_spend"]
    return f"""<dl class="run-meta">
<div><dt>Status</dt><dd>{escape(report["state"]).title()} · Revision {report["revision"]}</dd></div>
<div><dt>Deadline</dt><dd>{stamp(report["deadline_unix"])}</dd></div>
<div><dt>Worker limit</dt><dd>{report["workers"]}</dd></div>
<div><dt>Project spend</dt><dd>{spend["spent"]} spent · {spend["reserved"]} reserved</dd></div>
</dl>
<div class="dashboard">
<section><h2>Decision queue</h2>{decision_queue(path, report, chosen)}</section>
{decision_details(path, report["run"], selected)}
</div>
<section class="workers"><h2>Workers</h2>{attempts_table(report["attempts"], observed)}</section>"""


def observed_routes(db: sqlite3.Connection, run: str) -> dict[str, str]:
    rows = db.execute(
        """SELECT id, json_extract(result, '$.observed_model') AS model,
                  json_extract(result, '$.observed_effort') AS effort
           FROM events WHERE run=? AND kind='worker-result' AND id LIKE 'observed:%'""",
        (run,),
    )
    return {
        row["id"].removeprefix("observed:"): f"{row['model']} · {row['effort']}"
        for row in rows
        if isinstance(row["model"], str) and isinstance(row["effort"], str)
    }


def has_table(db: sqlite3.Connection, table: str) -> bool:
    return (
        db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
        is not None
    )


def model_decisions(db: sqlite3.Connection, run: str) -> str:
    if not has_table(db, "dev_route_notifications"):
        return ""
    if has_table(db, "dev_route_notification_runs"):
        rows = db.execute(
            """SELECT n.decision_id,n.message,r.run_id
               FROM dev_route_notifications n LEFT JOIN dev_route_notification_runs r
               ON n.decision_id=r.decision_id
               WHERE r.run_id=? OR r.run_id IS NULL ORDER BY n.rowid DESC LIMIT 20""",
            (run,),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT decision_id,message,NULL AS run_id FROM dev_route_notifications "
            "ORDER BY rowid DESC LIMIT 20"
        ).fetchall()
    if not rows:
        return ""
    items = "".join(
        f"<li><b>{escape(row['decision_id'])}</b>"
        f"{' <small>Project notice</small>' if row['run_id'] is None else ''}"
        f"<p>{escape(row['message'])}</p></li>"
        for row in rows
    )
    return (
        '<section class="workers"><h2>Model decisions</h2>'
        f'<ul class="model-list">{items}</ul></section>'
    )


def dashboard(db_path: Path, path: str, query: dict[str, list[str]]) -> tuple[HTTPStatus, bytes]:
    if not db_path.is_file():
        return HTTPStatus.OK, page_html(
            path, '<p class="empty">No ledger yet. Start a run with /dev.</p>'
        )
    try:
        with closing(sqlite3.connect(f"{db_path.as_uri()}?mode=ro", uri=True)) as db:
            db.row_factory = sqlite3.Row
            db.execute("BEGIN")
            runs = db.execute("SELECT id,state FROM runs ORDER BY created DESC,id DESC").fetchall()
            if not runs:
                return HTTPStatus.OK, page_html(
                    path, '<p class="empty">No runs yet. Start one with /dev.</p>'
                )
            run = query.get("run", [runs[0]["id"]])[0]
            selector = run_selector(path, runs, run)
            if run not in {row["id"] for row in runs}:
                return HTTPStatus.NOT_FOUND, page_html(
                    path, selector + '<p class="empty">Run not found.</p>'
                )
            report = run_status(db, run)
            observed = observed_routes(db, run)
            model_log = model_decisions(db, run)
    except sqlite3.Error:
        message = '<p class="empty">The ledger could not be read. Check its path and refresh.</p>'
        return HTTPStatus.SERVICE_UNAVAILABLE, page_html(path, message)
    chosen = query.get("decision", [""])[0]
    return HTTPStatus.OK, page_html(
        path, selector + show_run(path, report, chosen, observed) + model_log
    )


class DashboardServer(ThreadingHTTPServer):
    def __init__(self, db_path: Path, port: int) -> None:
        self.db_path = db_path.resolve()
        self.path = f"/{secrets.token_urlsafe(24)}/"
        super().__init__(("127.0.0.1", port), DashboardHandler)

    @property
    def host(self) -> str:
        return f"127.0.0.1:{self.server_port}"


class DashboardHandler(BaseHTTPRequestHandler):
    server: DashboardServer

    def log_message(self, _format: str, *_args: object) -> None:
        return

    def reply(self, status: HTTPStatus, content_type: str, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        url = urlsplit(self.path)
        prefix = self.server.path
        if self.headers.get_all("Host") != [self.server.host] or not url.path.startswith(prefix):
            self.reply(HTTPStatus.NOT_FOUND, "text/plain; charset=utf-8", b"Not found")
            return
        asset = url.path.removeprefix(prefix)
        if asset in {"dashboard.css", "dashboard.js"}:
            content_type = "text/css" if asset.endswith(".css") else "text/javascript"
            self.reply(HTTPStatus.OK, content_type, (ASSETS / asset).read_bytes())
        elif not asset:
            status, page = dashboard(self.server.db_path, prefix, parse_qs(url.query))
            self.reply(status, "text/html; charset=utf-8", page)
        else:
            self.reply(HTTPStatus.NOT_FOUND, "text/plain; charset=utf-8", b"Not found")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path)
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args()
    with DashboardServer(args.db or project_database(), args.port) as server:
        print(f"http://{server.host}{server.path}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
