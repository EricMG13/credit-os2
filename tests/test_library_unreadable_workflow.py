"""Publication from synthetic run records with unrelated non-finite values."""

import json
import zipfile
from pathlib import Path

import pytest
import update_library
from library_fixtures import make_run, method, put


def test_unreadable_workflow_still_publishes_delivered_handoffs(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("deploy_workflow.library_index.current_method", lambda: method())
    run_dir = make_run(tmp_path, "run-a")
    workflow_path = run_dir / "workflow.json"
    workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    workflow["unrelated"] = float("nan")
    workflow_path.write_text(json.dumps(workflow), encoding="utf-8")

    library = update_library.update_library(tmp_path)

    assert [run["id"] for run in library.runs] == ["run-a"]
    published = tmp_path / "library"
    script = (published / "data.js").read_text(encoding="utf-8")
    data = json.loads(script.removeprefix("window.CREDIT_OS_DATA=").removesuffix(";\n"))
    assert (
        "run-a: workflow.json could not be read (ValueError: non-finite number NaN is not accepted)"
        in data["activity"]["issues"]
    )
    (run,) = data["workspace"]["runs"].values()
    evidence = run["evidence"]
    assert evidence["record"]["instructions"] == []
    assert not (published / "downloads/run-a/instructions").exists()
    assert {row["href"] for row in evidence["handoffs"]} == {
        "downloads/run-a/CP-0.md",
        "downloads/run-a/CP-1.md",
    }
    (delivery,) = (run_dir / "deliveries").iterdir()
    with zipfile.ZipFile(published / evidence["zip"]) as archive:
        assert set(archive.namelist()) == {"CP-0.md", "CP-1.md"}
        for name in archive.namelist():
            assert archive.read(name) == (delivery / name).read_bytes()
            assert (published / "downloads/run-a" / name).read_bytes() == archive.read(name)


def test_pinned_committee_hold_survives_an_unrelated_non_finite_value(tmp_path: Path) -> None:
    path = tmp_path / "deliveries/result/report-view.json"
    raw = b'{"schema_version":"report-view/1","call_withheld":"blocked","unrelated":NaN}'
    files = {"report-view.json": put(path, raw)}
    receipt_digest = put(path.with_name("delivery.json"), json.dumps({"files": files}).encode())
    delivered = {
        "delivery_sha256": receipt_digest,
        "folder": "deliveries/result",
        "files": files,
    }

    assert update_library.committee_hold(tmp_path, delivered) == (
        "The committee decision was withheld because its assessment was blocked."
    )
    path.write_bytes(raw.replace(b'"blocked"', b'"outside_pathway"'))
    assert update_library.committee_hold(tmp_path, delivered) is None
