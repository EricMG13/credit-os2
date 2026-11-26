import hashlib
import json
import shutil
import sys
import tempfile
import time
from collections.abc import Iterator
from contextlib import contextmanager
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from typing import Any

import pytest

from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox.runs import Record, cap_of, load_all
from deploy_workflow.inbox.scheduler import Scheduler, Settings
from deploy_workflow.model.adapter import KEY_VARIABLES
from deploy_workflow.run_start import submissions
from proof import DUMMY_KEY, launcher, launcher_command
from proof.launcher import AGREEMENT, FILING, HANDOFFS, canned_handoff, verify_upload

PROJECT = Path(__file__).resolve().parents[1]
# The full credit assessment's modules. Owner, 2026-11-25: with CP-1B, CP-1C and CP-1D
# (docs/rulings/2026-11-25-layer-1-in-all-assessment-pathways.md).
MODULES = (
    *("CP-0", "CP-1", "CP-1A", "CP-1B", "CP-1C", "CP-1D", "CP-2", "CP-2A", "CP-2D", "CP-2E"),
    *("CP-2G", "CP-3", "CP-3C", "CP-4", "CP-5", "CP-6", "CP-DR"),
)


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


@contextmanager
def open_offline_scheduler() -> Iterator[Scheduler]:
    short_temp = None if sys.platform == "win32" else "/tmp"
    with (
        pytest.MonkeyPatch.context() as patch,
        tempfile.TemporaryDirectory(prefix="cos-proof-", dir=short_temp) as root,
    ):
        patch.setattr(sys, "dont_write_bytecode", True)
        patch.setenv("COPILOT_GITHUB_TOKEN", DUMMY_KEY)
        patch.setenv("COPILOT_CLI_PATH", str(Path(__file__)))
        for key in KEY_VARIABLES.values():
            if key != "COPILOT_GITHUB_TOKEN":
                patch.delenv(key, raising=False)
        scheduler = Scheduler(
            Settings(Path(root), launcher=launcher_command(), copilot_models=None)
        )
        try:
            yield scheduler
        finally:
            for child in scheduler._children.values():
                if child.poll() is None:
                    child.kill()
                    child.wait(timeout=10)
            scheduler.close()


@pytest.fixture
def offline_scheduler() -> Iterator[Scheduler]:
    with open_offline_scheduler() as scheduler:
        yield scheduler


def upload_case(scheduler: Scheduler, *files: Path) -> str:
    sid = submissions.new(scheduler.layout)
    for path in files:
        raw = path.read_bytes()
        assert submissions.add_file(scheduler.layout, sid, path.name, BytesIO(raw), len(raw)) == (
            path.name
        )
    return sid


def finished_run(scheduler: Scheduler, submitted: Record) -> Record:
    deadline = time.monotonic() + 20
    for _ in range(400):
        scheduler.step()
        [record] = load_all(scheduler.layout)
        if record.status not in {"queued", "running"} or time.monotonic() >= deadline:
            break
        time.sleep(0.05)
    log = (scheduler.layout.logs / f"{submitted.id}.log").read_text()
    reviews = scheduler.layout.runs / submitted.id / "live" / "modules"
    assert record.status == "finished", (
        record.reason,
        log,
        [p.read_text() for p in reviews.glob("*/1.tools.json")],
    )
    assert "Charged:  USD 0" in log.splitlines()
    return record


def run_full_assessment(scheduler: Scheduler, legal: str, model: str, effort: str) -> Record:
    """Submit and finish the offline Example Synthetic Group case dated 2025-04-30."""
    sid = upload_case(scheduler, FILING)
    data = json.loads((PROJECT / "cases/context/research-minimal.json").read_text())
    data["run"].update(
        pathway="credit_snapshot", as_of="2025-04-30", cutoff="", case_kind="synthetic"
    )
    data["identity"].update(issuer_name="Example Synthetic Group", issuer_id="example")
    data["attachments"]["legal_documents"] = legal
    answers = submissions.validated(
        {
            "context": data,
            "modules": [],
            "max_turns": 32,
            "level": "advanced",
            "model": model,
            "effort": effort,
            "submitted_by": "Proof T",
        }
    )
    summary = submissions.summary(scheduler.layout, sid, answers)
    assert not summary["error"], summary["error"]
    submitted = scheduler.submit(sid, answers, summary["digest"])
    return finished_run(scheduler, submitted)


@pytest.mark.parametrize(
    ("legal", "model", "effort", "config"),
    [
        ("executed", "luna", "xhigh", "copilot-luna-xhigh"),
        ("none", "gpt", "balanced", "copilot-sol-medium"),
    ],
)
def test_real_scheduler_exports_the_submitted_run(
    offline_scheduler: Scheduler, legal: str, model: str, effort: str, config: str
) -> None:
    record = run_full_assessment(offline_scheduler, legal, model, effort)
    assert record.cap == "30"  # Full's cap (owner, 2026-11-25)
    assert (record.config, record.effort) == (config, effort)
    layout = offline_scheduler.layout
    loop_record = layout.runs / record.id / "live" / "loop.json"
    assert json.loads(loop_record.read_text())["config"] == config
    assert cap_of(record) == Decimal(30)
    assert_exported_report(layout, record.id, legal)


def test_real_scheduler_exports_only_the_approved_structural_phase(
    offline_scheduler: Scheduler,
) -> None:
    """Synthetic Northbridge Synthetic Group, 2025-03-31. CP-4B with its parent core."""
    layout = offline_scheduler.layout
    sid = upload_case(offline_scheduler, FILING, AGREEMENT)
    data = json.loads((PROJECT / "cases/context/research-minimal.json").read_text())
    data["run"].update(pathway="custom", as_of="2025-03-31", case_kind="synthetic")
    data["identity"].update(
        issuer_name="Northbridge Synthetic Group", issuer_id="northbridge-synthetic-group"
    )
    answers = submissions.validated(
        {
            "context": data,
            "modules": ["CP-4", "CP-4B"],
            "max_turns": 32,
            "level": "advanced",
            "model": "gpt",
            "effort": "fast",
            "submitted_by": "Proof T",
        }
    )
    summary = submissions.summary(layout, sid, answers)
    assert not summary["error"], summary["error"]
    assert summary["estimate"]["rows"][-1]["phases"] == [
        {"name": "Structural priority", "added": None}
    ]
    submitted = offline_scheduler.submit(sid, answers, summary["digest"])
    record = finished_run(offline_scheduler, submitted)
    assert record.modules == ("CP-4", "CP-4B")
    assert record.config == "copilot-sol-medium"
    assert cap_of(record) == Decimal(9)
    assert_scoped_invocation(layout.runs / record.id)
    assert_scoped_report(layout, record.id)


def assert_scoped_invocation(output: Path) -> None:
    requests = [
        json.loads(path.read_text())["messages"]
        for path in (output / "live" / "modules").glob("*/invocation.json")
    ]
    [messages] = [m for m in requests if json.loads(m[1]["text"])["module_id"] == "CP-4"]
    assert json.loads(messages[1]["text"])["run"]["phase_selection"] == {"CP-4": ["CP-4B"]}
    assert "Custom method scope: CP-4B with the parent core." in messages[0]["text"]
    assert "**T4D.2**:" in messages[0]["text"]
    assert "**T4F.2**:" not in messages[0]["text"]
    assert "**T4C.4**:" not in messages[0]["text"]


def assert_scoped_report(layout: Layout, run_id: str) -> None:
    output = layout.runs / run_id
    requests = output / "requests"
    assert {path.name for path in requests.iterdir()} == {"CP-0", "CP-1", "CP-4"}
    [request_path] = requests.glob("CP-4/*/*.request.json")
    request = json.loads(request_path.read_text())
    assert request["run"]["phase_selection"] == {"CP-4": ["CP-4B"]}
    assert request["run"]["case_kind"] == "synthetic"
    assert request["sources"][AGREEMENT.name] == hashlib.sha256(AGREEMENT.read_bytes()).hexdigest()
    assert set(request["handoffs"]) == {"CP-0", "CP-1"}
    assert "**T4D.2**:" in request["instructions"]
    assert "**T4F.2**:" not in request["instructions"]
    assert "**T4C.4**:" not in request["instructions"]
    response = request_path.with_name("1.response.md").read_text()
    assert "Analysis scope: Core analysis and Structural priority." in response
    assert "### T4D.2 Legal entity perimeter" in response
    assert "### T4F." not in response and "### T4C." not in response
    exported = (layout.engine / "library/data.js").read_text()
    export = json.loads(exported.removeprefix("window.CREDIT_OS_DATA=").removesuffix(";\n"))
    [report] = export["catalogue"]["real"]
    assert (report["id"], report["name"], report["date"]) == (
        run_id,
        "Northbridge Synthetic Group",
        "2025-03-31",
    )
    [reader] = export["workspace"]["runs"].values()
    assert reader["folder"] == run_id
    assert {row["module"] for row in reader["evidence"]["handoffs"]} == {"CP-0", "CP-1", "CP-4"}
    [legal] = [row for row in reader["evidence"]["handoffs"] if row["module"] == "CP-4"]
    assert (layout.engine / "library" / legal["href"]).read_text() == response


def assert_exported_report(layout: Layout, run_id: str, legal: str) -> None:
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
    assert_legal_handoffs(layout, reader, legal)


def assert_legal_handoffs(layout: Layout, reader: dict[str, Any], legal: str) -> None:
    """A run that declares no legal documents stops CP-4 at its source gate (a blocked handoff the
    checker accepts at once) and CP-3 delivers the report's Capital structure; a run that supplies
    an agreement keeps CP-4's own findings and its Capital structure."""
    delivered = {
        row["module"]: (layout.engine / "library" / row["href"]).read_text()
        for row in reader["evidence"]["handoffs"]
    }
    assert len(delivered) == len(MODULES) == 17
    gated = legal == "none"
    assert ("module_status: Blocked" in delivered["CP-4"]) == gated
    assert ("Not assessable: no executed governing document was supplied" in delivered["CP-4"]) == (
        gated
    )
    assert ("### Capital structure" in delivered["CP-3"]) == gated
    assert ("### Capital structure" in delivered["CP-4"]) == (not gated)


def request_context(module):
    """What a CP-OS request carries that the launcher reads: the module, sources and handoffs."""
    return {
        "module_id": module,
        "sources": {FILING.name: "a" * 64},
        "handoffs": {"CP-0": {"sha256": "b" * 64}},
    }


def canned(module):
    """The canned handoff in the wrapper every reply has, written out apart from the launcher."""
    text = (HANDOFFS / f"{module}.md").read_text(encoding="utf-8")
    sources = f"- {FILING.name} {'a' * 64}\n- CP-0 {'b' * 64}"
    return f"# {module}\n\n## Request\nCase.\n\n## Sources\n\n{sources}\n\n{text}"


def test_synthetic_earnings_quality_copies_the_bridge_ids():
    """Synthetic Example Synthetic Group, 2025-04-30."""
    from deploy_workflow.method_scripts import register_table

    reply = canned_handoff(request_context("CP-1D"), "Case.")
    for register in ("T1D.1", "T1D.2"):
        table = register_table(reply, register)
        assert not isinstance(table, str), table
        headings, rows = table
        column = headings.index("Add-Back ID")
        assert [row[column] for row in rows] == ["AB-1", "AB-2"]


def capital_structure_of_cp4(handoffs=HANDOFFS):
    """CP-4's `### Capital structure` section, cut out by its neighbouring headings."""
    text = (handoffs / "CP-4.md").read_text(encoding="utf-8")
    body = text.split("### Capital structure\n", 1)[1].split("### Chart data", 1)[0]
    return "### Capital structure\n" + body.rstrip() + "\n"


@pytest.mark.parametrize(
    ("legal", "gated"), [("executed", False), ("draft", False), ("none", True)]
)
def test_replies_differ_from_the_canned_handoffs_only_when_no_legal_documents(legal, gated):
    """With an agreement (or a draft one) every reply is the canned handoff; with none, CP-3 and
    CP-4 differ and no other module does."""
    from deploy_workflow.context import load_context
    from deploy_workflow.run_expectations import no_legal_documents

    data = json.loads((PROJECT / "cases/context/research-minimal.json").read_text())
    data["attachments"]["legal_documents"] = legal
    assert no_legal_documents(load_context(json.dumps(data).encode())) is gated
    replies = {m: canned_handoff(request_context(m), "Case.", gated=gated) for m in MODULES}
    assert {m for m in MODULES if replies[m] != canned(m)} == ({"CP-3", "CP-4"} if gated else set())
    if not gated:
        return
    section = "### Capital structure\n\n| Item | Value |\n| --- | --- |\n| Observed | 1 |\n"
    assert section in canned("CP-4")
    assert capital_structure_of_cp4() == section
    assert replies["CP-3"] == canned("CP-3").replace(
        "\n## Calculations", f"\n{section}\n## Calculations", 1
    )
    blocked = replies["CP-4"]
    assert blocked.startswith("---\nmodule_id: CP-4\nmodule_status: Blocked\n---\n# CP-4\n")
    assert "### Bottom line\n\nNot assessable: no executed governing document was" in blocked
    assert "### Capital structure" not in blocked


def test_the_gated_cp3_section_is_read_from_the_canned_cp4(tmp_path, monkeypatch):
    """One source: changing the canned CP-4 section changes what CP-3 delivers."""
    handoffs = tmp_path / "handoffs"
    shutil.copytree(HANDOFFS, handoffs)
    cp4 = handoffs / "CP-4.md"
    text = cp4.read_text(encoding="utf-8")
    assert "| Observed | 1 |" in text
    cp4.write_text(text.replace("| Observed | 1 |", "| Observed | 7 |"), encoding="utf-8")
    monkeypatch.setattr(launcher, "HANDOFFS", handoffs)
    reply = canned_handoff(request_context("CP-3"), "Case.", gated=True)
    assert capital_structure_of_cp4(handoffs) in reply
    assert "| Observed | 7 |" in reply
    assert "| Observed | 1 |" not in reply


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
