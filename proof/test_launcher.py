import json
import sys
import tempfile
import time
from decimal import Decimal
from io import BytesIO
from pathlib import Path

import pytest

from proof import DUMMY_KEY, launcher_command
from proof.launcher import AGREEMENT, FILING, verify_upload

PROJECT = Path(__file__).resolve().parents[1]


def test_rejects_a_changed_or_additional_upload(tmp_path):
    context = tmp_path / "context.json"
    context.write_text("{}")
    source = tmp_path / FILING.name
    source.write_bytes(b"This is a different filing.\n")
    with pytest.raises(ValueError, match="differs"):
        verify_upload(tmp_path, context)

    source.write_bytes(FILING.read_bytes())
    (tmp_path / "additional.txt").write_text("another file")
    with pytest.raises(ValueError, match="exactly one"):
        verify_upload(tmp_path, context)


def test_accepts_the_synthetic_agreement_only_byte_identical(tmp_path):
    context = tmp_path / "context.json"
    context.write_text("{}")
    (tmp_path / FILING.name).write_bytes(FILING.read_bytes())
    (tmp_path / AGREEMENT.name).write_bytes(AGREEMENT.read_bytes())
    assert verify_upload(tmp_path, context)
    (tmp_path / AGREEMENT.name).write_text("Credit Agreement\nEXECUTION VERSION\nother\n")
    with pytest.raises(ValueError, match="differs"):
        verify_upload(tmp_path, context)


def test_real_scheduler_exports_the_submitted_run(monkeypatch):
    monkeypatch.setattr(sys, "dont_write_bytecode", True)
    monkeypatch.setenv("OPENAI_API_KEY", DUMMY_KEY)
    from deploy_workflow.inbox.runs import cap_of, load_all
    from deploy_workflow.inbox.scheduler import Scheduler, Settings
    from deploy_workflow.model.adapter import KEY_VARIABLES
    from deploy_workflow.run_start import submissions

    for key in KEY_VARIABLES.values():
        if key != "OPENAI_API_KEY":
            monkeypatch.delenv(key, raising=False)
    launcher = launcher_command()
    data = json.loads((PROJECT / "cases/context/research-minimal.json").read_text())
    data["run"].update(
        pathway="credit_snapshot", as_of="2025-04-30", cutoff="", case_kind="synthetic"
    )
    data["identity"].update(issuer_name="Example Synthetic Group", issuer_id="example")
    short_temp = None if sys.platform == "win32" else "/tmp"
    with tempfile.TemporaryDirectory(prefix="cos-proof-", dir=short_temp) as root:
        scheduler = Scheduler(Settings(Path(root), launcher=launcher))
        try:
            layout = scheduler.layout
            sid = submissions.new(layout)
            raw = FILING.read_bytes()
            assert (
                submissions.add_file(layout, sid, FILING.name, BytesIO(raw), len(raw))
                == FILING.name
            )
            answers = submissions.validated(
                {
                    "context": data,
                    "modules": [],
                    "max_turns": 32,
                    "level": "basic",
                    "model": "gpt",
                    "effort": "balanced",
                    "submitted_by": "Proof T",
                }
            )
            summary = submissions.summary(layout, sid, answers)
            assert not summary["error"], summary["error"]
            submitted = scheduler.submit(sid, answers, summary["digest"])
            deadline = time.monotonic() + 20
            while time.monotonic() < deadline:
                scheduler.step()
                [record] = load_all(layout)
                if record.status not in {"queued", "running"}:
                    break
                time.sleep(0.05)
            log = (layout.logs / f"{submitted.id}.log").read_text()
            assert record.status == "finished", (record.reason, log)
            assert record.cap == "25"
            assert cap_of(record) == Decimal(25)
            assert "Charged:  USD 0" in log
            assert_exported_report(layout, submitted.id)
        finally:
            for child in scheduler._children.values():
                if child.poll() is None:
                    child.kill()
                    child.wait(timeout=10)
            scheduler.close()


def assert_exported_report(layout, run_id):
    output = layout.runs / run_id
    request = json.loads(next((output / "requests").glob("CP-0/*/1.request.json")).read_text())
    assert request["run"]["as_of"] == "2025-04-30"
    drop = layout.drops / run_id
    assert request["sources"][FILING.name] == verify_upload(drop, drop / "context.json")
    exported = (layout.engine / "library/data.js").read_text()
    export = json.loads(exported.removeprefix("window.CREDIT_OS_DATA=").removesuffix(";\n"))
    [report] = export["catalogue"]["real"]
    assert report["id"] == run_id
    assert report["name"] == "Example Synthetic Group"
    assert report["date"] == "2025-04-30"
    [reader] = export["workspace"]["runs"].values()
    assert reader["folder"] == run_id
    [evidence] = [row for row in reader["evidence"]["handoffs"] if row["module"] == "CP-2"]
    delivered = (layout.engine / "library" / evidence["href"]).read_text()
    assert "The synthetic issuer shows one observed item." in delivered
    [financials] = [
        value for value in export["workspace"]["outputs"].values() if value["module"] == "CP-1"
    ]
    assert "Debt maturities" in [chart["title"] for chart in financials["charts"]]
    [model] = [model for model in export["workspace"]["models"] if model["cashflow"]]
    [revenue] = [row for row in model["cashflow"]["rows"] if row["label"] == "Revenue"]
    assert "1050" in [cell["exact"] for cell in revenue["cells"]]


def test_browser_proof_refuses_an_existing_workspace(tmp_path, monkeypatch):
    from proof.serve import main

    (tmp_path / "keep.txt").write_text("existing workspace", encoding="utf-8")
    monkeypatch.setattr(sys, "argv", ["proof.serve", "--root", str(tmp_path)])
    monkeypatch.setattr(
        "react_frontend.serve", lambda *args, **kwargs: pytest.fail("service started")
    )
    with pytest.raises(SystemExit) as error:
        main()
    assert error.value.code == 2
    assert (tmp_path / "keep.txt").read_text(encoding="utf-8") == "existing workspace"
