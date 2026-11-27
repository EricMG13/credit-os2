"""Serve the private Credit OS2 development ledger on loopback."""

from __future__ import annotations

import argparse
import json
import secrets
import sqlite3
import sys
from collections import deque
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
    APPROVAL_MISMATCH,
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
    "frame-ancestors 'none'; base-uri 'none'; form-action 'self'; connect-src 'self'"
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


def run_selector(path: str, runs: list[sqlite3.Row], selected: str, blocked: bool = False) -> str:
    options = "".join(
        f'<option value="{escape(row["id"])}"{" selected" if row["id"] == selected else ""}>'
        f"{escape(row['id'])} · {escape(row['state']).title()}</option>"
        for row in runs
    )
    progress = "Run progress · launch rejected" if blocked else "Run progress"
    return f"""<form method="get" action="{path}" class="selector">
<label for="run">Run</label>
<select name="run" id="run">{options}</select>
<button type="submit">View run</button>
<a class="button subtle" href="{address(path, run=selected)}">Refresh</a>
<a id="progress-link" class="button subtle" href="#progress-title">{progress}</a>
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


def stage(attempt: dict[str, Any], activity: dict[str, Any], revision: int) -> str:
    if attempt["state"] == "accepted":
        return "Verified"
    ident = attempt["id"]
    if activity["revalidated"].get(ident, attempt["revision"]) != revision:
        return "Superseded"
    result = activity["results"].get(ident, {})
    if result.get("timed_out"):
        return "Timed out"
    code = result.get("returncode")
    if code is not None and code != 0:
        return "Failed"
    finished = "claude-stop" in activity.get("timing", {}).get(ident, {})
    if code is None and attempt["state"] == "active" and not finished:
        return "Active"
    return "Awaiting verification"


def worker_elapsed(timing: dict[str, int]) -> str:
    started = timing.get("claude-start", timing.get("launch"))
    ended = timing.get("claude-stop", timing.get("worker-result", timing.get("settle")))
    if started is None:
        return ""
    if ended is None:
        return f"{'Started' if 'claude-start' in timing else 'Assigned'} {stamp(started)}"
    seconds = max(0, ended - started)
    minutes, seconds = divmod(seconds, 60)
    if "claude-stop" in timing:
        label = "Agent time"
    else:
        label = "Time to result" if "worker-result" in timing else "Time to settlement"
    return f"{label} · {minutes}m {seconds:02d}s" if minutes else f"{label} · {seconds}s"


def worker_row(attempt: dict[str, Any], activity: dict[str, Any], status: str) -> str:
    ident = attempt["id"]
    observed = activity["results"].get(ident, {})
    model, effort = observed.get("observed_model"), observed.get("observed_effort")
    timing = activity["timing"].get(ident, {})
    summary = activity["updates"].get(ident, "")
    route = f"{model} · {effort}" if model and effort else "Model unverified"
    age = worker_elapsed(timing)
    client = "Claude Code · " if "claude-start" in timing else ""
    settled = attempt["settled"]
    settlement = "Settlement unrecorded" if settled is None else f"{settled} settled"
    return f"""<li class="worker-lane">
<div class="lane-heading"><h4>{escape(ident)}</h4><b>{status}</b></div>
<p>{escape(summary)}</p>
<div class="lane-details"><span>{client}{escape(route)}</span><span>{age}</span>
<span>Revision {attempt["revision"]} · {attempt["reserved"]} reserved · {settlement}</span>
</div>
</li>"""


def workers(report: dict[str, Any], activity: dict[str, Any], stages: dict[str, str]) -> str:
    if not report["attempts"]:
        return '<p class="empty">No workers have started.</p>'
    rows = "".join(worker_row(a, activity, stages[a["id"]]) for a in report["attempts"])
    return f'<ul class="worker-lanes" aria-label="Workers">{rows}</ul>'


def unresolved_launch(activity: dict[str, Any], revision: int) -> str | None:
    return next(
        (
            attempt
            for attempt in reversed(activity["rejected"])
            if activity["rejected"][attempt] == revision
            and "launch" not in activity["timing"].get(attempt, {})
        ),
        None,
    )


def launch_notice(attempt: str | None) -> str:
    if attempt is None:
        return ""
    return f"""<div class="launch-notice">
<strong>{escape(attempt)} · Launch rejected before worker start</strong>
<p>The spec and plan did not match the approval. The coordinator can compare the approved
and current documents before retrying. Changed documents need a new approval.</p></div>"""


def timeline_item(row: sqlite3.Row, summary: str) -> str:
    timestamp = datetime.fromtimestamp(row["created"], UTC)
    label = timestamp.strftime("%d %b %Y, %H:%M:%S UTC")
    return (
        f'<li><time datetime="{timestamp.isoformat()}">{label}</time><p>{escape(summary)}</p></li>'
    )


def timeline(activity: dict[str, Any]) -> str:
    items = "".join(activity["timeline"])
    return (
        f'<ol class="model-list timeline">{items}</ol>'
        if items
        else '<p class="empty">Run activity appears here as it is recorded.</p>'
    )


def progress_panel(path: str, report: dict[str, Any], activity: dict[str, Any]) -> str:
    labels = ("Active", "Awaiting verification", "Verified", "Failed", "Superseded")
    stages = {
        attempt["id"]: stage(attempt, activity, report["revision"])
        for attempt in report["attempts"]
    }
    totals = dict.fromkeys(labels, 0)
    for label in stages.values():
        totals["Failed" if label == "Timed out" else label] += 1
    counts = "".join(f"<div><dt>{key}</dt><dd>{value}</dd></div>" for key, value in totals.items())
    source = address(path, run=report["run"])
    return f"""<section class="workers" aria-labelledby="progress-title">
<div class="progress-title">
<h2 id="progress-title">Run progress</h2><span id="refresh-status">Updates every 10 seconds</span>
</div>
<div id="run-progress" data-refresh="{source}">
{launch_notice(unresolved_launch(activity, report["revision"]))}
<dl class="progress-counts">{counts}</dl>
<h3>Workers</h3>
{workers(report, activity, stages)}
<h3>Recent activity</h3>
{timeline(activity)}
</div>
</section>"""


def show_run(path: str, report: dict[str, Any], chosen: str, activity: dict[str, Any]) -> str:
    selected = next((item for item in report["decisions"] if item["id"] == chosen), None)
    spend = report["project_spend"]
    return f"""<dl class="run-meta">
<div><dt>Status</dt><dd id="run-state">
{escape(report["state"]).title()} · Revision {report["revision"]}</dd></div>
<div><dt>Deadline</dt><dd>{stamp(report["deadline_unix"])}</dd></div>
<div><dt>Worker limit</dt><dd>{report["workers"]}</dd></div>
<div><dt>Project spend</dt><dd>{spend["spent"]} spent · {spend["reserved"]} reserved</dd></div>
</dl>
<div class="dashboard">
<section><h2>Decision queue</h2>{decision_queue(path, report, chosen)}</section>
{decision_details(path, report["run"], selected)}
</div>
{progress_panel(path, report, activity)}"""


EVENT_LABELS = {
    "run": "Spec and plan approved",
    "launch": "Worker assigned",
    "launch-rejected": "Launch rejected before worker start. " + APPROVAL_MISMATCH.capitalize(),
    "claude-start": "Claude agent started",
    "claude-stop": "Claude agent returned",
    "settle": "Worker reservation settled",
    "route-resolved": "Model route assigned",
    "worker-result": "Worker result recorded",
    "accept": "Worker result verified",
    "merged": "Merge verified",
}


def observe_worker(
    activity: dict[str, Any], row: sqlite3.Row, payload: dict[str, Any]
) -> tuple[str, str | None]:
    kind = row["kind"]
    ident = row["id"].partition(":")[2]
    summary = EVENT_LABELS.get(kind)
    if kind in {"launch", "worker-result", "settle", "claude-start", "claude-stop"}:
        activity["timing"].setdefault(ident, {})[kind] = row["created"]
    if kind == "launch-rejected":
        ident = payload.get("attempt", ident)
        activity["rejected"][ident] = payload.get("revision")
    elif kind == "launch" and ident in activity["rejected"]:
        summary = "Launch recovered · worker assigned"
    elif kind == "worker-result":
        activity["results"][ident] = payload
    elif kind == "decision":
        summary = "Run paused" if payload["action"] == "pause" else "Run resumed"
    if kind == "route-resolved" and isinstance(task := payload.get("task"), str) and task:
        activity["updates"][ident] = task
    if kind == "note":
        ident, summary = payload.get("attempt", ""), payload.get("summary")
        if ident and summary:
            activity["updates"][ident] = summary
    return ident, summary


def run_activity(db: sqlite3.Connection, run: str) -> dict[str, Any]:
    kinds = (*EVENT_LABELS, "note", "decision")
    markers = ",".join("?" for _ in kinds)
    rows = db.execute(
        f"""SELECT id,kind,result,created FROM events WHERE run=? AND kind IN ({markers})
            AND (kind NOT IN ('note','decision')
              OR (kind='note' AND json_extract(result,'$.kind')='progress')
              OR (kind='decision' AND json_extract(result,'$.action') IN ('pause','resume')))
            ORDER BY created,rowid""",
        (run, *kinds),
    )
    activity: dict[str, Any] = {
        "updates": {},
        "results": {},
        "timing": {},
        "rejected": {},
        "revalidated": {},
    }
    items: deque[tuple[sqlite3.Row, str]] = deque(maxlen=12)
    for row in rows:
        ident, summary = observe_worker(activity, row, json.loads(row["result"]))
        if summary:
            items.append((row, f"{ident} · {summary}" if ident else summary))
    if has_table(db, "revalidated_attempts"):
        activity["revalidated"] = dict(
            db.execute("SELECT attempt,revision FROM revalidated_attempts WHERE run=?", (run,))
        )
    activity["timeline"] = [timeline_item(row, summary) for row, summary in reversed(items)]
    return activity


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
            if run not in {row["id"] for row in runs}:
                return HTTPStatus.NOT_FOUND, page_html(
                    path, run_selector(path, runs, run) + '<p class="empty">Run not found.</p>'
                )
            report = run_status(db, run)
            activity = run_activity(db, run)
            model_log = model_decisions(db, run)
    except sqlite3.Error:
        message = '<p class="empty">The ledger could not be read. Check its path and refresh.</p>'
        return HTTPStatus.SERVICE_UNAVAILABLE, page_html(path, message)
    chosen = query.get("decision", [""])[0]
    blocked = unresolved_launch(activity, report["revision"]) is not None
    selector = run_selector(path, runs, run, blocked)
    return HTTPStatus.OK, page_html(
        path, selector + show_run(path, report, chosen, activity) + model_log
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
