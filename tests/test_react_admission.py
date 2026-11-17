"""Publication precedes scheduler acceptance; every connected reader must agree."""

import copy
import json
import unicodedata
from urllib.parse import quote

from deploy_workflow.inbox import runs
from react_frontend.admission import admitted
from tests import test_react_frontend as fixtures

hosted = fixtures.hosted
root = fixtures.root
web = fixtures.web
request = fixtures.request


def publication():
    return {
        "catalogue": {
            "real": [
                {"id": folder, "name": folder, "date": "2026-10-31"}
                for folder in ("managed", "Rapport Émetteur")
            ]
        },
        "workspace": {
            "runs": {
                "managed-key": {
                    "folder": "managed",
                    "pathway": "credit_snapshot",
                    "modules": {
                        "CP-1": {"outputs": ["managed/output"], "default": "managed/output"}
                    },
                },
                "retained-key": {
                    "folder": "Rapport Émetteur",
                    "pathway": "credit_snapshot",
                    "modules": {
                        "CP-1": {"outputs": ["retained/output"], "default": "retained/output"}
                    },
                },
            },
            "outputs": {
                "managed/output": {"run": "managed-key", "sha256": "managed-hash"},
                "retained/output": {"run": "retained-key", "sha256": "retained-hash"},
            },
            "handoffs": {"managed-hash": ["unfinished"], "retained-hash": ["retained"]},
            "models": [
                {"runId": "managed"},
                {"runFolder": "managed"},
                {"runFolder": "Rapport Émetteur"},
            ],
        },
        "chips": {"managed/output:4": ["unfinished"], "retained/output:4": ["retained"]},
        "activity": {},
        "preview": {"reason": "Retained test publication"},
    }


def test_admission_preserves_retained_identity_and_excludes_unaccepted_outputs(hosted):
    layout = hosted.scheduler.layout
    runs.save(
        layout,
        runs.Record(
            id="managed",
            pathway="credit_snapshot",
            folder="managed",
            status="running",
            claimed_at="",
        ),
    )
    source = publication()
    original = copy.deepcopy(source)
    visible = admitted(source, layout)
    assert source == original
    assert set(visible["workspace"]["runs"]) == {"retained-key"}
    assert set(visible["workspace"]["outputs"]) == {"retained/output"}
    assert visible["workspace"]["handoffs"] == {"retained-hash": ["retained"]}
    assert visible["workspace"]["models"] == [{"runFolder": "Rapport Émetteur"}]
    assert visible["chips"] == {"retained/output:4": ["retained"]}
    assert visible["preview"] == original["preview"]


def test_retained_unicode_folder_and_snapshot_share_admission(hosted):
    layout = hosted.scheduler.layout
    directory = layout.engine / "library"
    directory.mkdir(exist_ok=True)
    source = publication()
    (directory / "data.js").write_text(
        f"window.CREDIT_OS_DATA={json.dumps(source)};", encoding="utf-8"
    )
    runs.save(
        layout,
        runs.Record(
            id="managed",
            pathway="credit_snapshot",
            folder="managed",
            status="failed",
            claimed_at="",
        ),
    )
    visible = json.loads(request(hosted, "/connected/snapshot")[1])
    assert [run["id"] for run in visible["catalogue"]["real"]] == ["Rapport Émetteur"]
    status, body, _ = request(hosted, "/connected/report/" + quote("Rapport Émetteur", safe=""))
    assert status == 200
    assert json.loads(body)["id"] == "Rapport Émetteur"
    assert json.loads(request(hosted, "/connected/reports")[1])["reports"] == [json.loads(body)]
    assert request(hosted, "/connected/report/managed")[0] == 404
    for folder in ("..", "../managed", "managed/other"):
        assert request(hosted, "/connected/report/" + quote(folder, safe=""))[0] == 404


def _run_of(folder):
    return {"folder": folder, "modules": {"CP-1": {"outputs": [f"{folder}/o"]}}}


def test_an_unreadable_record_hides_its_own_run_and_nothing_else(hosted):
    layout = hosted.scheduler.layout
    for run_id, status in (("a-finished", "finished"), ("b-running", "running")):
        runs.save(layout, runs.Record(run_id, "credit_snapshot", run_id, status, ""))
    bad = layout.state / "x-bad.json"
    bad.write_text("{not json", encoding="utf-8")
    before, stamp = bad.read_bytes(), bad.stat().st_mtime_ns
    folders = ("a-finished", "b-running", "x-bad")
    source = {
        "catalogue": {"real": [{"id": f} for f in folders]},
        "workspace": {
            "runs": {f: _run_of(f) for f in folders},
            "outputs": {f"{f}/o": {"run": f, "sha256": f"h-{f}"} for f in folders},
            "handoffs": {},
            "models": [],
        },
        "chips": {},
    }
    visible = admitted(source, layout)
    assert set(visible["workspace"]["runs"]) == {"a-finished"}
    assert [r["id"] for r in visible["catalogue"]["real"]] == ["a-finished"]
    assert set(visible["workspace"]["outputs"]) == {"a-finished/o"}
    assert (bad.read_bytes(), bad.stat().st_mtime_ns) == (before, stamp)


def test_an_unreadable_record_hides_a_folder_whose_name_differs_only_in_case(hosted):
    layout = hosted.scheduler.layout
    (layout.state / "A-Run.json").write_text("{not json", encoding="utf-8")
    folders = ("a-run", "other")
    source = {
        "catalogue": {"real": [{"id": f} for f in folders]},
        "workspace": {
            "runs": {f: _run_of(f) for f in folders},
            "outputs": {f"{f}/o": {"run": f, "sha256": f"h-{f}"} for f in folders},
            "handoffs": {},
            "models": [],
        },
        "chips": {},
    }
    visible = admitted(source, layout)
    assert set(visible["workspace"]["runs"]) == {"other"}
    assert [r["id"] for r in visible["catalogue"]["real"]] == ["other"]


def _hidden_by(bad_stem: str, folder: str, hosted) -> set[str]:
    layout = hosted.scheduler.layout
    (layout.state / f"{bad_stem}.json").write_text("{not json", encoding="utf-8")
    source = {
        "catalogue": {"real": [{"id": folder}, {"id": "other"}]},
        "workspace": {
            "runs": {f: _run_of(f) for f in (folder, "other")},
            "outputs": {},
            "handoffs": {},
            "models": [],
        },
        "chips": {},
    }
    return set(admitted(source, layout)["workspace"]["runs"])


def test_a_decomposed_bad_stem_hides_a_composed_folder_name(hosted):
    composed = unicodedata.normalize("NFC", "café-1")
    decomposed = unicodedata.normalize("NFD", "café-1")
    assert composed != decomposed
    assert _hidden_by(decomposed, composed, hosted) == {"other"}


def test_a_lower_case_bad_stem_hides_an_upper_case_folder_name(hosted):
    assert _hidden_by("abc-3", "ABC-3", hosted) == {"other"}
