import dataclasses
import json
import os
import re
import threading
from collections.abc import Iterator, Mapping
from decimal import Decimal
from http.client import HTTPConnection
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, get_args

import pytest
import update_library

from deploy_vii.contracts import PATHWAY_CAP_USD
from deploy_workflow.inbox import activity, runs, startup
from deploy_workflow.inbox.layout import Layout, ensure_layout
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.model.budget import Budget
from deploy_workflow.run_events import EVENTS, ModuleState, append_event
from deploy_workflow.run_start.service import _Server
from react_frontend import make_server, run_activity

PROJECT = Path(__file__).resolve().parents[1]


@pytest.fixture
def web(tmp_path: Path) -> Path:
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text(
        '<html><head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'">'
        '<script src="./assets/app.js"></script></head><body></body></html>',
        encoding="utf-8",
    )
    (tmp_path / "assets" / "app.js").write_text("void 0", encoding="utf-8")
    return tmp_path


@pytest.fixture
def root() -> Iterator[Path]:
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp") as name:
        yield Path(name)


@pytest.fixture
def hosted(root: Path, web: Path) -> Iterator[_Server]:
    with make_server(root, web=web, signal_url="http://localhost:8766") as server:
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            yield server
        finally:
            server.shutdown()
            thread.join()


def request(
    server: _Server,
    path: str,
    method: str = "GET",
    *,
    headers: Mapping[str, str] | None = None,
    body: str | None = None,
) -> tuple[int, bytes, dict[str, str]]:
    connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
    try:
        connection.request(method, path, headers=headers or {}, body=body)
        reply = connection.getresponse()
        return reply.status, reply.read(), dict(reply.getheaders())
    finally:
        connection.close()


def test_react_page_routes_serve_the_build(hosted: _Server, web: Path) -> None:
    status, page, headers = request(hosted, "/")
    assert status == 200
    assert b'credit-os-backend" content="legacy"' in page
    assert b'credit-os-mode" content="live"' in page
    assert b'credit-os-signal-url" content="http://localhost:8766/"' in page
    assert b"connect-src 'self'" in page
    assert b"connect-src 'none'" in (web / "index.html").read_bytes()
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["Cross-Origin-Resource-Policy"] == "same-origin"
    for path in ("/start", "/run/demo", "/report/demo/", "/report/Rapport%20%C3%89metteur"):
        assert request(hosted, path)[:2] == (200, page)
    assert b'src="/assets/app.js"' in page
    assert request(hosted, "/assets/app.js")[:2] == (200, b"void 0")
    assert request(hosted, "/run/demo/extra")[0] == 404
    for path in (
        "/report/%2e%2e",
        "/report/demo%2Fother",
        "/report/demo%5Cother",
        "/run/demo%20old",
    ):
        assert request(hosted, path)[0] == 404


def _form_template() -> dict[str, Any]:
    """The example case the start form opens from: its settings, but no issuer (J2-002)."""
    template = json.loads((PROJECT / "cases/context/research-minimal.json").read_bytes())
    template["identity"].update(issuer_name="", issuer_id="")
    return template


def test_start_form_template_names_no_issuer(hosted: _Server) -> None:
    sent = json.loads(request(hosted, "/connected/context")[1])
    assert sent["identity"]["issuer_name"] == ""
    assert sent["identity"]["issuer_id"] == ""
    assert "Northbridge" not in json.dumps(sent["identity"])
    example = json.loads((PROJECT / "cases/context/research-minimal.json").read_bytes())
    assert example["identity"]["issuer_name"] == "Northbridge Group"  # the file itself is unchanged
    assert {k: v for k, v in sent["identity"].items() if k not in ("issuer_name", "issuer_id")} == {
        k: v for k, v in example["identity"].items() if k not in ("issuer_name", "issuer_id")
    }


def test_same_origin_service_and_submit_gate(hosted: _Server) -> None:
    assert json.loads(request(hosted, "/connected/context")[1]) == {
        **_form_template(),
        "copilot_models": {},
        "submission_caps_usd": {pathway: str(cap) for pathway, cap in PATHWAY_CAP_USD.items()},
    }
    assert request(hosted, "/connected/context", headers={"Origin": "http://other.test"})[0] == 403
    assert request(hosted, "/connected/snapshot", headers={"Host": "other.test"})[0] == 403
    assert request(hosted, "/api/submissions", "POST")[0] == 403
    origin = f"http://127.0.0.1:{hosted.server_address[1]}"
    headers = {"Origin": origin}
    status, body, _ = request(hosted, "/api/submissions", "POST", headers=headers)
    assert status == 200
    sid = json.loads(body)["id"]
    assert (
        request(hosted, f"/api/submissions/{sid}/submit", "POST", headers=headers, body="{}")[0]
        == 400
    )


def test_activity_uses_the_pinned_cap_and_curates_native_events(hosted: _Server) -> None:
    layout = hosted.scheduler.layout
    runs.save(
        layout,
        runs.Record(
            id="activity",
            pathway="credit_snapshot",
            folder="activity",
            status="interrupted",
            claimed_at="2026-10-31T12:00:00Z",
        ),
    )
    directory = layout.runs / "activity"
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "workflow.json").write_text(
        '{"execution":"live-provider","provider_cap_usd":"50.00",'
        '"instructions":{"CP-0":{},"CP-1":{}}}',
        encoding="utf-8",
    )
    budget = Budget(Decimal(50), directory / "live")
    budget.reserve("call", Decimal(2), config_id="sol-medium")
    budget.settle("call", Decimal("1.25"))
    append_event(directory, "module_started", module="CP-0", reason="/local/file/path")
    append_event(directory, "module_accepted", module="CP-0")
    append_event(directory, "provider_call", body="private provider data")
    append_event(directory, "module_started", module="outside the prepared plan")
    status, raw, headers = request(hosted, "/connected/activity/activity")
    assert status == 200 and headers["Cache-Control"] == "no-store"
    record = json.loads(raw)
    assert record["cap"] == "50.00"
    assert record["execution"] == "live-provider"
    assert Decimal(record["spent"]) == Decimal("1.25")
    assert record["modules"] == [["CP-0", "done"], ["CP-1", "waiting"], ["Report", "waiting"]]
    assert [event["kind"] for event in record["events"]] == ["module_started", "module_accepted"]
    assert set(record["events"][0]) == {"kind", "at", "module"}
    assert record["held_reason"] == ""
    # A stop ends the module that was running. The service's hold reaches the page of a run that
    # waits on it: one kept "running" after its log ended; not an ended one, nor a running one.
    append_event(directory, "module_started", module="CP-1")
    append_event(directory, "stopped", reason="provider")
    held = f"the library could not be rebuilt ({layout.root.resolve()}/x: disk full)"
    activity.write(layout, {"updated": "", "held": held, "runs": []})
    record = json.loads(request(hosted, "/connected/activity/activity")[1])
    assert record["modules"] == [["CP-0", "done"], ["CP-1", "stopped"], ["Report", "waiting"]]
    assert record["held_reason"] == ""  # interrupted: ended, not held
    saved = runs.load_readable(layout)[0]
    runs.save(
        layout, dataclasses.replace(next(r for r in saved if r.id == "activity"), status="running")
    )
    reason = json.loads(request(hosted, "/connected/activity/activity")[1])["held_reason"]
    assert (
        reason.startswith("the library could not be rebuilt (") and str(layout.root) not in reason
    )
    append_event(directory, "module_started", module="CP-1")  # a later launch runs again
    assert json.loads(request(hosted, "/connected/activity/activity")[1])["held_reason"] == ""
    (directory / EVENTS).write_text("invalid event\n{}\n", encoding="utf-8")
    assert json.loads(request(hosted, "/connected/activity/activity")[1])["events"] is None
    assert request(hosted, "/connected/activity/unknown")[0] == 404


def test_the_react_pages_status_words_are_the_services() -> None:
    """The React pages copy the run statuses and module states the service sends (api.ts); a word
    missing there breaks a lookup table, one the service never sends is a dead branch."""
    api = (Path(__file__).parents[1] / "web/src/pages/connected/api.ts").read_text("utf-8")

    def union(pattern: str) -> list[str]:
        match = re.search(pattern, api)
        assert match is not None, pattern
        return re.findall(r'"(\w+)"', match[1])

    statuses = list(get_args(runs.Status))
    assert union(r"export type RunStatus =([^;]*);") == statuses
    ended = [s for s in statuses if s not in ("queued", "running", "finished")]
    assert union(r"export type EndedRun = [^&]*& \{\s*status:([^;]*);") == ended
    assert union(r"export type ConnectedModuleState =([^;]*);") == list(get_args(ModuleState))
    assert list(run_activity._ENDED) == ended


def test_activity_list_shows_runs_in_progress_without_spend_or_file_names(hosted: _Server) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    layout = scheduler.layout
    for record in (
        runs.Record(
            id="b-queued",
            pathway="credit_snapshot",
            folder="b-queued",
            status="queued",
            claimed_at="2026-10-31T12:00:00Z",
            issuer_name="Harbour Packaging",
            reason="3 runs are already running",
        ),
        runs.Record(
            id="a-running",
            pathway="credit_snapshot",
            folder="a-running",
            status="running",
            claimed_at="2026-10-31T12:00:00Z",
            issuer_name="Meridian Foods",
            started_at="2026-10-31T12:01:00Z",
            files=("annual-report.pdf", "notes.pdf"),
            submitted_by="Dana Reyes",
            name_differs=True,
        ),
        runs.Record(
            id="c-finished",
            pathway="credit_snapshot",
            folder="c-finished",
            status="finished",
            claimed_at="2026-10-31T11:00:00Z",
            ended_at="2026-10-31T11:30:00Z",
        ),
    ):
        runs.save(layout, record)
    directory = layout.runs / "a-running"
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "workflow.json").write_text(
        '{"instructions":{"CP-0":{},"CP-1":{}}}', encoding="utf-8"
    )
    append_event(directory, "module_started", module="CP-0")
    append_event(directory, "module_accepted", module="CP-0")
    held = "daily limit of 30 runs reached; waiting until tomorrow"
    assert json.loads(request(hosted, "/connected/activity")[1])["held"] == ""
    activity.write(layout, {"updated": "", "cap": "20", "held": held, "runs": []})

    status, raw, headers = request(hosted, "/connected/activity")

    assert status == 200 and headers["Cache-Control"] == "no-store"
    listing = json.loads(raw)
    assert set(listing) == {"updated", "held", "runs", "ended", "ended_total", "unreadable"}
    assert listing["held"] == held
    running, queued = listing["runs"]
    assert running == {
        "id": "a-running",
        "issuer_name": "Meridian Foods",
        "pathway": "credit_snapshot",
        "status": "running",
        "reason": "",
        "submitted_by": "Dana Reyes",
        "started_at": "2026-10-31T12:01:00Z",
        "name_differs": True,
        "stalled": False,
        "files": 2,
        "modules": [["CP-0", "done"], ["CP-1", "waiting"], ["Report", "waiting"]],
    }
    assert (queued["id"], queued["status"], queued["reason"], queued["files"]) == (
        "b-queued",
        "queued",
        "3 runs are already running",
        0,
    )
    assert set(queued) == set(running)
    page_status, _, page_headers = request(hosted, "/runs")
    assert page_status == 200 and page_headers["Content-Type"].startswith("text/html")


def _ended_record(run_id: str, status: runs.Status, minute: int, reason: str = "") -> runs.Record:
    return runs.Record(
        id=run_id,
        pathway="credit_snapshot",
        folder=run_id,
        status=status,
        claimed_at="2026-10-31T11:00:00Z",
        ended_at=f"2026-10-31T12:{minute:02d}:00Z",
        issuer_name="Harbour Packaging",
        reason=reason,
        submitted_by="analyst",
        files=("annual-report.pdf",),
    )


def test_activity_list_shows_ended_runs_without_spend_or_file_names(hosted: _Server) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    layout = scheduler.layout
    for record in (
        _ended_record("c-capped", "capped", 5, "Spending cap reached"),
        _ended_record("d-failed", "failed", 10, "Provider error"),
        _ended_record("e-finished", "finished", 20),
        runs.Record(
            id="a-running",
            pathway="credit_snapshot",
            folder="a-running",
            status="running",
            claimed_at="2026-10-31T12:00:00Z",
        ),
    ):
        runs.save(layout, record)

    status, raw, _ = request(hosted, "/connected/activity")

    assert status == 200
    listing = json.loads(raw)
    assert set(listing) == {"updated", "held", "runs", "ended", "ended_total", "unreadable"}
    assert [run["id"] for run in listing["ended"]] == ["d-failed", "c-capped"]
    assert set(listing["ended"][0]) == {
        "id",
        "issuer_name",
        "pathway",
        "status",
        "reason",
        "ended_at",
        "submitted_by",
    }
    assert listing["ended"][1]["reason"] == "Spending cap reached"
    assert [run["id"] for run in listing["runs"]] == ["a-running"]


def test_activity_list_keeps_the_twenty_latest_ended_runs(hosted: _Server) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    for minute in range(25):
        runs.save(scheduler.layout, _ended_record(f"f-{minute:02d}", "failed", minute))

    listing = json.loads(request(hosted, "/connected/activity")[1])

    assert len(listing["ended"]) == 20
    assert listing["ended_total"] == 25
    assert listing["ended"][0]["ended_at"] == "2026-10-31T12:24:00Z"
    assert listing["ended"][-1]["ended_at"] == "2026-10-31T12:05:00Z"


def test_activity_sends_a_reason_without_the_service_root(hosted: _Server) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    layout = scheduler.layout
    root = layout.root
    path = root / "_engine" / "state" / "issuers.json"
    runs.save(layout, _ended_record("p-path", "failed", 1, f"could not be filed: {path} is bad"))
    runs.save(layout, _ended_record("q-plain", "failed", 2, "Provider error"))
    runs.save(
        layout,
        runs.Record(
            id="r-running",
            pathway="credit_snapshot",
            folder="r-running",
            status="running",
            claimed_at="2026-10-31T12:00:00Z",
            reason=f"waiting on {root.resolve() / 'inbox' / 'a.pdf'}",
        ),
    )

    listing = json.loads(request(hosted, "/connected/activity")[1])
    ended = {run["id"]: run["reason"] for run in listing["ended"]}
    single = json.loads(request(hosted, "/connected/activity/p-path")[1])["reason"]

    # A reason the scheduler wrote is sent as the reader's sentence, with no path in it; any other
    # reason (the running run's below) is sent as stored with the root removed.
    assert ended["p-path"] == (
        "The run finished, but the service could not file its report. Ask whoever runs the "
        "service to check the service's log before starting it again."
    )
    assert single == ended["p-path"]
    assert ended["q-plain"] == "Provider error"
    assert listing["runs"][0]["reason"] == f"waiting on {Path('inbox') / 'a.pdf'}"
    sent = [run["reason"] for run in (*listing["ended"], *listing["runs"])] + [single]
    assert len(sent) == 4
    assert all(str(root.resolve()) not in reason for reason in sent)


def test_activity_sends_ended_at_as_stored_and_lists_every_ended_status(hosted: _Server) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    layout = scheduler.layout
    runs.save(layout, _ended_record("a-rejected", "rejected", 5))
    runs.save(layout, _ended_record("b-interrupted", "interrupted", 5))
    runs.save(layout, _ended_record("c-same", "failed", 5))
    unended = _ended_record("d-none", "failed", 0)
    unended.ended_at = ""
    unended.claimed_at = "2026-10-31T12:30:00Z"
    runs.save(layout, unended)

    ended = json.loads(request(hosted, "/connected/activity")[1])["ended"]

    assert [run["id"] for run in ended] == ["d-none", "c-same", "b-interrupted", "a-rejected"]
    assert [run["status"] for run in ended][2:] == ["interrupted", "rejected"]
    assert ended[0]["ended_at"] == ""


_SHOWN = [
    # (root, sep, reason, sent)
    ("/data/app", "/", "filed: /data/app/_engine/x.json is bad", "filed: _engine/x.json is bad"),
    ("/data/app", "/", "/data/app/a and (/data/app/b)", "a and (b)"),
    ("/data/app", "/", "path='/data/app/x'", "path='x'"),
    ("/data/app", "/", "see /data/app-old/_engine/x", "see x"),
    ("/data/app", "/", "copy at /mnt/data/app/x failed", "copy at x failed"),
    ("/data/app", "/", "Provider error", "Provider error"),
    ("/", "/", "see https://example.test/a", "see https://example.test/a"),
    (
        "C:\\Shared\\CreditOS",
        "\\",
        "filed: C:\\Shared\\CreditOS\\_engine\\x.json bad",
        "filed: _engine\\x.json bad",
    ),
    (
        "C:\\Shared\\CreditOS",
        "\\",
        "denied: 'C:\\\\Shared\\\\CreditOS\\\\_engine\\\\r.log'",
        "denied: '_engine\\\\r.log'",
    ),
    (
        "C:\\Shared\\CreditOS",
        "\\",
        "see D:\\C:\\Shared\\CreditOS\\x and C:\\Shared\\CreditOS-old\\x",
        "see x and x",
    ),
]


@pytest.mark.parametrize(("root", "sep", "reason", "sent"), _SHOWN)
def test_shown_removes_the_root_only_where_it_starts_a_path(
    root: str, sep: str, reason: str, sent: str
) -> None:
    assert run_activity._plain_reason(root, sep, reason) == sent


def test_reports_admission_and_reader_snapshot(hosted: _Server, root: Path) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    library = root / "_engine" / "library"
    publication = library / "data.js"
    publication.unlink(missing_ok=True)
    assert request(hosted, "/connected/snapshot")[:2] == (200, b"null")
    assert request(hosted, "/connected/report/demo")[0] == 404
    library.mkdir(exist_ok=True)
    export = {
        "catalogue": {"real": [{"id": "demo", "name": "Émetteur", "date": "2026-10-31"}]},
        "workspace": {"runs": {"run-key": {"folder": "demo", "pathway": "credit_snapshot"}}},
        "activity": {"excluded": [], "issues": []},
        "chips": {"output:1": [{"text": "<script>test</script>"}]},
    }
    publication.write_text(f"window.CREDIT_OS_DATA={json.dumps(export)};\n", encoding="utf-8")
    record = runs.Record(
        id="demo", pathway="credit_snapshot", folder="demo", status="running", claimed_at=""
    )
    runs.save(scheduler.layout, record)
    hidden = json.loads(request(hosted, "/connected/snapshot")[1])
    assert hidden["workspace"]["runs"] == {}
    assert hidden["catalogue"]["real"] == []
    assert hidden["chips"] == {}
    assert request(hosted, "/connected/artifacts/demo")[0] == 404
    assert request(hosted, "/connected/report/demo")[0] == 404
    assert json.loads(request(hosted, "/connected/reports")[1]) == {"reports": []}
    for state in ("failed", "capped", "interrupted", "rejected", "queued"):
        record.status = state
        runs.save(scheduler.layout, record)
        assert json.loads(request(hosted, "/connected/snapshot")[1])["workspace"]["runs"] == {}
        assert request(hosted, "/connected/report/demo")[0] == 404
    record.status = "finished"
    runs.save(scheduler.layout, record)
    export["workspace"]["runs"]["run-key"].update(
        publicationVerified=False, lead=None, assessmentScope="unverified", publishedAt=None
    )
    assert json.loads(request(hosted, "/connected/snapshot")[1]) == export
    status, result, _ = request(hosted, "/connected/report/demo")
    assert status == 200
    assert json.loads(result) == {
        "id": "demo",
        "issuer": "Émetteur",
        "asOf": "2026-10-31",
        "pathway": "credit_snapshot",
    }
    assert json.loads(request(hosted, "/connected/reports")[1]) == {"reports": [json.loads(result)]}
    publication.write_text("window.CREDIT_OS_DATA={};console.log(0);", encoding="utf-8")
    assert request(hosted, "/connected/snapshot")[0] == 500


@pytest.mark.parametrize("query", ["", "?run=demo"])
def test_snapshot_sends_no_server_path_even_from_an_older_publication(
    hosted: _Server, root: Path, query: str
) -> None:
    """An older data.js names the engine folder in catalogue.workspace; the snapshot drops it."""
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    library = root / "_engine" / "library"
    library.mkdir(exist_ok=True)
    export = {
        "reportFolder": "forged-stored-scope",
        "catalogue": {
            "real": [{"id": "demo", "name": "Émetteur", "date": "2026-10-31"}],
            "workspace": str(root / "_engine"),
            "built_at": "01 Nov 2026, 09:00:00 UTC",
        },
        "workspace": {"runs": {"run-key": {"folder": "demo", "pathway": "credit_snapshot"}}},
        "activity": {"excluded": [], "issues": []},
        "chips": {},
    }
    (library / "data.js").write_text(
        f"window.CREDIT_OS_DATA={json.dumps(export)};\n", encoding="utf-8"
    )
    runs.save(
        scheduler.layout,
        runs.Record(
            id="demo", pathway="credit_snapshot", folder="demo", status="finished", claimed_at=""
        ),
    )
    status, body, _ = request(hosted, f"/connected/snapshot{query}")
    assert status == 200
    sent = json.loads(body)
    assert sent.get("reportFolder") == ("demo" if query else None)
    assert "workspace" not in sent["catalogue"]
    assert sent["catalogue"] == {
        "real": export["catalogue"]["real"],
        "built_at": export["catalogue"]["built_at"],
    }
    assert str(root) not in body.decode("utf-8")
    assert sent["workspace"]["runs"] == {
        "run-key": {
            **export["workspace"]["runs"]["run-key"],
            "publicationVerified": False,
            "lead": None,
            "assessmentScope": "unverified",
            "publishedAt": None,
        }
    }


@pytest.mark.parametrize(
    "path",
    ["/library", "/library/", "/library/index.html", "/library.html"],
)
def test_legacy_library_entry_urls_redirect_to_the_connected_app(
    hosted: _Server, path: str
) -> None:
    status, body, headers = request(hosted, path)
    assert status == 308 and body == b"" and headers["Location"] == "/"


def test_legacy_library_assets_are_not_served_but_checked_downloads_are(
    hosted: _Server, root: Path
) -> None:
    library = root / "_engine" / "library"
    library.mkdir(parents=True, exist_ok=True)
    (library / "views.js").write_text("legacy UI", encoding="utf-8")
    download = library / "downloads" / "run-a" / "CP-1.md"
    download.parent.mkdir(parents=True, exist_ok=True)
    download.write_bytes(b"checked handoff")
    assert request(hosted, "/library/views.js")[0] == 404
    assert request(hosted, "/library/downloads/run-a/CP-1.md")[:2] == (
        200,
        b"checked handoff",
    )


def test_inherits_startup_checks_and_workspace_lock(
    hosted: _Server, root: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    with (
        pytest.raises(startup.StartupRefused, match="another run page service"),
        make_server(root, web=web),
    ):
        pytest.fail("two schedulers held the same lock")
    for name in ("COPILOT_GITHUB_TOKEN", "COPILOT_CLI_PATH", "COPILOT_USE_GH_LOGIN"):
        monkeypatch.delenv(name, raising=False)
    with make_server(root / "offline", web=web) as offline:
        assert offline.scheduler.model_choices == {}
    with (
        pytest.raises(ValueError, match="synthetic mode"),
        make_server(root, web=web, launcher=("unspecified",)),
    ):
        pytest.fail("accepted a launcher outside synthetic mode")


def test_synthetic_mode_uses_the_explicit_launcher(root: Path, web: Path) -> None:
    launcher = ("unused-by-test",)
    with make_server(root, web=web, launcher=launcher, synthetic=True) as server:
        assert server.scheduler.settings.launcher == launcher
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            page = request(server, "/")[1]
            assert b'credit-os-mode" content="synthetic"' in page
            assert b'credit-os-signal-url"' not in page
            expected = _form_template()
            expected["run"]["case_kind"] = "synthetic"
            expected["copilot_models"] = {
                "gpt": ["fast", "balanced", "high"],
                "claude": ["fast", "balanced", "high"],
                "luna": ["xhigh"],
            }
            expected["submission_caps_usd"] = {
                pathway: str(cap) for pathway, cap in PATHWAY_CAP_USD.items()
            }
            assert json.loads(request(server, "/connected/context")[1]) == expected
        finally:
            server.shutdown()
            thread.join()


def test_empty_launcher_refused_in_both_modes(root: Path, web: Path) -> None:
    for synthetic in (False, True):
        with (
            pytest.raises(ValueError, match="synthetic mode"),
            make_server(root, web=web, launcher=(), synthetic=synthetic),
        ):
            pytest.fail("accepted an empty launcher")


def test_only_same_run_published_forecast_artifacts_are_downloadable(
    hosted: _Server, root: Path
) -> None:
    engine = root / "_engine"
    digest = "b" * 64
    delivery = engine / "runs" / "one" / "deliveries" / digest
    delivery.mkdir(parents=True)
    (delivery / "calculation.json").write_bytes(b'{"exact":"1.25"}\r\n')
    (delivery / "forecast_exact.json").write_bytes(b"{}")
    published = {
        "catalogue": {"real": []},
        "workspace": {
            "runs": {
                "one": {
                    "folder": "one",
                    "evidence": {
                        "downloads": [
                            {"href": f"../runs/one/deliveries/{digest}/calculation.json"},
                            {"href": f"../runs/two/deliveries/{digest}/forecast_exact.json"},
                        ]
                    },
                }
            }
        },
        "activity": {},
        "chips": {},
    }
    library = engine / "library"
    library.mkdir(exist_ok=True)
    (library / "data.js").write_text(f"window.CREDIT_OS_DATA={json.dumps(published)};")
    endpoint = "/connected/artifacts/one"
    files = json.loads(request(hosted, endpoint)[1])["files"]
    path = f"{endpoint}/{digest}/calculation.json"
    assert files == [{"label": "Calculation JSON", "href": path}]
    assert request(hosted, path)[:2] == (200, b'{"exact":"1.25"}\r\n')
    assert request(hosted, f"{endpoint}/{digest}/forecast_exact.json")[0] == 404
    assert request(hosted, f"/connected/artifacts/two/{digest}/calculation.json")[0] == 404


POSIX_ROOT = "/srv/credit"


@pytest.mark.parametrize(
    ("reason", "expected"),
    [
        (
            "could not be filed: /srv/credit/_engine/state/issuers.json is not a map",
            "could not be filed: _engine/state/issuers.json is not a map",
        ),
        (
            "could not be started: [Errno 2] No such file or directory: '/usr/local/bin/launcher'",
            "could not be started: [Errno 2] No such file or directory: 'launcher'",
        ),
        (
            "could not be started: [Errno 13] Permission denied: '/srv/credit'",
            "could not be started: [Errno 13] Permission denied: 'the service folder'",
        ),
        ("copied /mnt/data/in/a.pdf to /srv/credit/inbox/a.pdf", "copied a.pdf to inbox/a.pdf"),
        ("no folder at /var/tmp/run-7/", "no folder at run-7"),
        (
            "see https://example.test/docs/errors/429 for limits",
            "see https://example.test/docs/errors/429 for limits",
        ),
        (
            "3/4 modules finished; cover n/a and/or missing",
            "3/4 modules finished; cover n/a and/or missing",
        ),
        (
            "expected one deliveries/*/delivery.json, found 2",
            "expected one deliveries/*/delivery.json, found 2",
        ),
        ("period 2026/11/16 see logs/r1.log", "period 2026/11/16 see logs/r1.log"),
        ("Provider error", "Provider error"),
        ("no file: '/Users/Jane Doe/runs/a.pdf'", "no file: 'a.pdf'"),
        ("no folder at /var/tmp/run-7. Retry", "no folder at run-7. Retry"),
        ("see /var/log/app/r1.log.", "see r1.log."),
    ],
)
def test_plain_reason_posix(reason: str, expected: str) -> None:
    assert run_activity._plain_reason(POSIX_ROOT, "/", reason) == expected


WINDOWS_ROOT = r"C:\Shared\CreditOS"


@pytest.mark.parametrize(
    ("reason", "expected"),
    [
        (
            r"could not be filed: C:\Shared\CreditOS\_engine\state\issuers.json is not a map",
            r"could not be filed: _engine\state\issuers.json is not a map",
        ),
        (
            "[Errno 13] Permission denied: 'C:\\\\Shared\\\\CreditOS\\\\_engine\\\\logs\\\\r.log'",
            "[Errno 13] Permission denied: '_engine\\\\logs\\\\r.log'",
        ),
        (
            r"[Errno 13] Permission denied: 'c:\shared\creditos\_engine\logs\r.log'",
            r"[Errno 13] Permission denied: 'r.log'",
        ),
        (
            "[WinError 2] The system cannot find the file specified: 'D:\\\\Tools\\\\launcher.exe'",
            "[WinError 2] The system cannot find the file specified: 'launcher.exe'",
        ),
        (r"cannot reach \\fileserver\credit\inbox\a.pdf", "cannot reach a.pdf"),
        (r"Permission denied: 'C:\Shared\CreditOS'", "Permission denied: 'the service folder'"),
        (
            "[WinError 2] cannot find: 'C:\\\\Program Files\\\\Python312\\\\python.exe'",
            "[WinError 2] cannot find: 'python.exe'",
        ),
        (r"cannot find: 'C:\Program Files\Python312\python.exe'", "cannot find: 'python.exe'"),
    ],
)
def test_plain_reason_windows(reason: str, expected: str) -> None:
    assert run_activity._plain_reason(WINDOWS_ROOT, "\\", reason) == expected


def _two_unreadable_records(layout: Layout) -> None:
    runs.save(layout, _ended_record("d-failed", "failed", 10, "Provider error"))
    runs.save(
        layout,
        runs.Record(
            id="a-running",
            pathway="credit_snapshot",
            folder="a-running",
            status="running",
            claimed_at="2026-10-31T12:00:00Z",
        ),
    )
    (layout.state / "broken.json").write_text("{not json", encoding="utf-8")
    runs.save(layout, _ended_record("n-null", "failed", 11))
    target = layout.state / "n-null.json"
    data = json.loads(target.read_text(encoding="utf-8"))
    data["reason"] = None
    target.write_text(json.dumps(data), encoding="utf-8")


def test_activity_list_survives_an_unreadable_record(hosted: _Server) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    _two_unreadable_records(scheduler.layout)

    status, raw = request(hosted, "/connected/activity")[:2]
    listing = json.loads(raw)

    assert status == 200
    assert [run["id"] for run in listing["runs"]] == ["a-running"]
    assert [run["id"] for run in listing["ended"]] == ["d-failed"]
    assert listing["ended_total"] == 1
    assert listing["unreadable"] == 2
    assert b"broken.json" not in raw
    # The single-run page of a good run still answers.
    assert request(hosted, "/connected/activity/d-failed")[0] == 200


def test_load_all_still_refuses_an_unreadable_record(root: Path) -> None:
    layout = ensure_layout(root)
    runs.save(layout, _ended_record("d-failed", "failed", 10))
    (layout.state / "broken.json").write_text("{not json", encoding="utf-8")

    with pytest.raises(ValueError, match="broken.json"):
        runs.load_all(layout)
    good, bad = runs.load_readable(layout)
    assert [record.id for record in good] == ["d-failed"]
    assert bad == ["broken.json"]


def test_activity_of_a_run_whose_own_record_is_unreadable_is_still_an_error(root: Path) -> None:
    layout = ensure_layout(root)
    (layout.state / "broken.json").write_text("{not json", encoding="utf-8")

    with pytest.raises(ValueError, match="broken.json"):
        run_activity.reply(layout, "broken")


@pytest.mark.parametrize("bad_id", [None, 7, ["x"]])
def test_activity_list_survives_a_record_whose_id_is_not_a_string(
    hosted: _Server, bad_id: object
) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    layout = scheduler.layout
    runs.save(layout, _ended_record("d-failed", "failed", 10))
    runs.save(layout, _ended_record("n-bad", "failed", 11))
    target = layout.state / "n-bad.json"
    data = json.loads(target.read_text(encoding="utf-8"))
    data["id"] = bad_id
    target.write_text(json.dumps(data), encoding="utf-8")

    status, raw = request(hosted, "/connected/activity")[:2]
    listing = json.loads(raw)

    assert status == 200
    assert [run["id"] for run in listing["ended"]] == ["d-failed"]
    assert listing["unreadable"] == 1


@pytest.mark.parametrize(
    "field",
    [
        "id",
        "issuer_name",
        "pathway",
        "status",
        "reason",
        "submitted_by",
        "claimed_at",
        "started_at",
        "ended_at",
    ],
)
def test_activity_list_counts_a_record_with_a_non_string_field(hosted: _Server, field: str) -> None:
    scheduler = hosted.scheduler
    assert isinstance(scheduler, Scheduler)
    layout = scheduler.layout
    runs.save(layout, _ended_record("d-failed", "failed", 10))
    runs.save(layout, _ended_record("n-bad", "failed", 11))
    target = layout.state / "n-bad.json"
    data = json.loads(target.read_text(encoding="utf-8"))
    data[field] = 5
    target.write_text(json.dumps(data), encoding="utf-8")

    status, raw = request(hosted, "/connected/activity")[:2]
    listing = json.loads(raw)

    assert status == 200
    assert listing["unreadable"] == 1
    assert [run["id"] for run in listing["ended"]] == ["d-failed"]


def test_copilot_preflight_rpc_failure_still_launches_offline(
    root: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    import sys

    from copilot._jsonrpc import JsonRpcError

    from react_frontend import __main__ as main

    async def rejected(_adapter):
        raise JsonRpcError(-32000, "private diagnostic")

    launches = []
    monkeypatch.setattr(main.CopilotAdapter, "seat_models", rejected)
    monkeypatch.setattr(main, "serve", lambda path, **options: launches.append((path, options)))
    monkeypatch.setattr(sys, "argv", ["react_frontend", "--root", str(root), "--copilot-preflight"])
    main.main()
    ((opened, options),) = launches
    assert opened == root and options["copilot_models"] == {}
    diagnostic = capsys.readouterr().err
    assert "Copilot seat could not be verified" in diagnostic
    assert "private diagnostic" not in diagnostic
