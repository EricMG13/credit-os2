"""The cumulative audit helpers keep their outputs while meeting the unchanged quality gate."""

import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from zipfile import ZipFile

import pytest

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path("docs/audit/2026-11-16-final/output")
REGISTER = OUTPUT / "4-register"
HELPERS = REGISTER / "lead-tools"
REGISTER_BASELINE = ROOT / "tests/fixtures/final-audit-register-baseline.zip"


def _run(script: str, tree: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-I", str(ROOT / HELPERS / script), *args],
        cwd=tree,
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )


def _register_tree(tree: Path) -> Path:
    # The expected bytes describe this retained input snapshot, not the growing live audit.
    with ZipFile(REGISTER_BASELINE) as baseline:
        baseline.extractall(tree)
    return tree / HELPERS


def _requirements_tree(tree: Path) -> Path:
    for name in (
        "pyproject.toml",
        "uv.lock",
        ".python-version",
        "web/package.json",
        "web/package-lock.json",
    ):
        target = tree / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    imports = {
        "src/one.py": "from pydantic import BaseModel\n",
        "tests/one.py": "import pytest\nfrom hypothesis import given\n",
        "web/src/one.tsx": (
            'import React from "react";\n'
            'import { Button } from "react-aria-components";\n'
            'import { ArrowRight } from "@untitledui/icons";\n'
            'import { Line } from "recharts";\n'
        ),
    }
    for name, text in imports.items():
        target = tree / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")
    return tree / "requirements.md"


def test_cumulative_audit_helpers_pass_the_default_quality_gate() -> None:
    env = os.environ.copy()
    env["PATH"] = str(Path(sys.executable).parent) + os.pathsep + env.get("PATH", "")
    result = subprocess.run(
        [sys.executable, str(ROOT / "tools/quality_gate.py"), "--json"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=240,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_frozen_register_inputs_ignore_new_live_findings(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    live_root = tmp_path / "live-audit-without-git"
    live_findings = live_root / REGISTER / "repair-findings.jsonl"
    live_findings.parent.mkdir(parents=True)
    live_findings.write_text('{"id":"NEW-LIVE-FINDING"}\n', encoding="utf-8")
    baseline = tmp_path / "baseline"
    with monkeypatch.context() as changed:
        changed.setattr(sys.modules[__name__], "ROOT", live_root)
        _register_tree(baseline)
    assert _sha256(baseline / REGISTER / "repair-findings.jsonl") == (
        "548c9978293802037324b0a12d25e7c0a301c8db9b20d06c77f79349457123a2"
    )


# Captured from the unchanged helpers at e3759109 after this test file was added.
REGISTER_HASHES = {
    "register.jsonl": "41fc3c374328bdeeab7c1547ed99555ae8aa0ac3fb705ed8e935ebd83cf1e74e",
    "register.md": "cbaa016ea11398f3c3629862b91965d01936152a7fce3f8bf6e73e341dc269aa",
    "tasks.md": "d672f80900d1edfbfa2f8cd5009ce5d3bd704a44a76c38b0cf9f84962d7a7c5d",
    "groups.md": "760e8db9f571038c83127ff524d923aa7edcdc99e8f63033225d5edbc8883dce",
    "parked.md": "08f34a58d2d606c21377d6b697c9453afe29a8bc42d7621b55f94b46716e5da4",
    "harmony.md": "a72e7ec8e3cec79966f1d7ef61949ab6046273cafc34a9ff5510b2faad1122b5",
}


def test_register_builders_preserve_the_frozen_baseline_bytes(tmp_path: Path) -> None:
    scratch = _register_tree(tmp_path)
    result = _run("build_register.py", tmp_path, str(scratch))
    assert result.returncode == 0, result.stderr
    assert result.stdout == (
        "WARNING J1-015 in task T07 but disposition batch\n"
        "findings: 505 after merge: 396\n"
        "severity (after merge): {'High': 5, 'Medium': 106, 'Low': 200, 'Info': 85}\n"
        "disposition: {'repair': 79, 'rejected': 105, 'parked': 30, 'deferred': 6, "
        "'batch': 159, 'sweep': 17}\n"
        "repair without task: []\n"
    )
    result = _run("write_docs.py", tmp_path, str(scratch))
    assert result.returncode == 0, result.stderr
    assert result.stdout == "written; harmony rows 1283\n"
    assert {
        name: _sha256(tmp_path / REGISTER / name) for name in REGISTER_HASHES
    } == REGISTER_HASHES


def test_requirements_table_preserves_all_rows_and_their_bytes(tmp_path: Path) -> None:
    output = _requirements_tree(tmp_path)
    result = _run("requirements_table.py", tmp_path, str(tmp_path), str(output))
    assert result.returncode == 0, result.stderr
    assert result.stdout == (
        "rows: 54 {'tool': 5, 'pdirect': 5, 'pdev': 5, 'pbuild': 2, 'npmd': 10, "
        "'npmdev': 20, 'browsers': 3, 'optional': 4}\n"
    )
    assert _sha256(output) == "38cc6298c019cce9a71227d30cb76f946dd42575a8fb8792e777733b78e2183d"


@pytest.mark.parametrize("manifest", ["uv.lock", "web/package-lock.json"])
def test_requirements_refuses_a_manifest_lock_mismatch(tmp_path: Path, manifest: str) -> None:
    output = _requirements_tree(tmp_path)
    target = tmp_path / manifest
    text = target.read_text(encoding="utf-8")
    version = "2.14.1" if manifest == "uv.lock" else "19.3.0"
    assert version in text
    target.write_text(text.replace(version, "0.0.0"), encoding="utf-8")
    result = _run("requirements_table.py", tmp_path, str(tmp_path), str(output))
    assert result.returncode == 1
    assert "AssertionError" in result.stderr
    assert not output.exists()


@pytest.mark.parametrize("filename", ["clusters.json", "rulings.json"])
def test_register_refuses_unknown_ruling_and_cluster_ids(tmp_path: Path, filename: str) -> None:
    scratch = _register_tree(tmp_path)
    value = (
        [{"primary": "UNKNOWN", "members": []}] if filename == "clusters.json" else {"UNKNOWN": {}}
    )
    (scratch / filename).write_text(json.dumps(value), encoding="utf-8")
    result = _run("build_register.py", tmp_path, str(scratch))
    assert result.returncode == 1
    kind = "cluster" if filename == "clusters.json" else "ruling"
    assert result.stderr.strip() == f"{kind} names unknown id UNKNOWN"
    assert not (tmp_path / REGISTER / "register.jsonl").exists()


def test_register_refuses_duplicate_findings(tmp_path: Path) -> None:
    scratch = _register_tree(tmp_path)
    findings = tmp_path / OUTPUT / "2-sections/C1/findings.jsonl"
    text = findings.read_text(encoding="utf-8")
    first = next(line for line in text.splitlines() if line.strip())
    findings.write_text(text + first + "\n", encoding="utf-8")
    result = _run("build_register.py", tmp_path, str(scratch))
    assert result.returncode == 1
    assert result.stderr.strip() == f"duplicate id C1-001 in {OUTPUT}/2-sections/C1/findings.jsonl"


def test_output_checker_reports_invalid_fields_and_missing_artifacts(tmp_path: Path) -> None:
    unit = tmp_path / OUTPUT / "2-sections/C1"
    unit.mkdir(parents=True)
    (unit / "findings.jsonl").write_text(
        '{"id":"C1-001","evidence":["retained.txt"]}\nnot-json\n', encoding="utf-8"
    )
    (unit / "report.md").write_text("An unfinished report.\n", encoding="utf-8")
    result = _run("check_outputs.py", tmp_path, str(tmp_path), "sections", "C1")
    assert result.returncode == 1
    assert "findings: 2 {'?': 1, 'unparsed': 1}" in result.stdout
    assert "PROBLEM C1: missing harmony.csv" in result.stdout
    assert "PROBLEM C1: report.md does not end with Not verified:" in result.stdout
    assert (
        "missing ['section', 'surface', 'screen', 'check', 'severity', 'kind', 'title', "
        in result.stdout
    )
    assert "does not parse:" in result.stdout
    assert result.stdout.endswith("9 problems\n")


def test_output_checker_accepts_a_complete_unit(tmp_path: Path) -> None:
    unit = tmp_path / OUTPUT / "3-journeys/J1"
    unit.mkdir(parents=True)
    row = {
        "id": "J1-001",
        "section": "C1",
        "surface": "connected",
        "screen": "Report",
        "check": "journey",
        "severity": "Medium",
        "kind": "ordinary",
        "title": "A retained finding",
        "expected": "The intended result",
        "actual": "The observed result",
        "evidence": ["retained.txt:1"],
        "probe": "python probe.py",
        "suggested_change": "The smallest repair",
        "owner_decision": False,
    }
    (unit / "findings.jsonl").write_text(json.dumps(row) + "\n", encoding="utf-8")
    (unit / "journey.md").write_text("A retained walk.\n", encoding="utf-8")
    (unit / "report.md").write_text("Not verified: live runs.\n", encoding="utf-8")
    result = _run("check_outputs.py", tmp_path, str(tmp_path), "journeys", "J1")
    assert result.returncode == 0, result.stderr
    assert result.stdout == "findings: 1 {'Medium': 1}\nOK\n"
