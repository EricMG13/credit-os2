"""Repo rules AGENTS.md states in prose, checked on the tracked files.

Answer keys are literal. Every check reads what git tracks, never a disk walk.
"""

from __future__ import annotations

import ast
import shutil
import subprocess  # nosec B404
from pathlib import Path, PurePosixPath

import pytest

REPO = Path(__file__).resolve().parents[1]

# Modules allowed to write a workbook: the Credit Snapshot deliverable only
# (docs/rulings/2026-11-25-deliverables-and-recommendations.md). The coordinator
# adds its path in the brief of the PR that builds it.
WORKBOOK_WRITERS_ALLOWED: frozenset[str] = frozenset()

_WRITE_MODES = frozenset({"w", "a", "x"})
_CREDENTIAL_SUFFIXES = (".pem", ".key", ".p12")
_CREDENTIAL_DIRS = frozenset({"private", ".copilot-home"})


def tracked(*pathspecs: str, cwd: Path = REPO) -> list[str]:
    """Paths git tracks under `cwd` matching `pathspecs`; `RuntimeError` when git
    is missing or cannot list them (never a silent empty result)."""
    git = shutil.which("git")
    if git is None:
        message = "git is not on PATH; the rules cannot be checked"
        raise RuntimeError(message)
    listed = subprocess.run(  # nosec B603
        [git, "ls-files", "-z", "--", *pathspecs],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if listed.returncode != 0:
        message = "git could not list the tracked files"
        raise RuntimeError(message)
    return [name for name in listed.stdout.split("\0") if name]


def within_cap(text: str, cap: int) -> bool:
    """True when `text` has fewer than `cap` lines (999 passes a 1000 cap)."""
    return len(text.splitlines()) < cap


def is_credential_file(path: str) -> bool:
    """Credential paths: `.gitignore:13-20` (`private/`, `.env`, `.env.*` except
    `.env.example`, `*.pem`, `*.key`, `.copilot-home/`) plus `*.p12`, `id_rsa*`
    and `credentials*.json` from the plan."""
    parts = PurePosixPath(path).parts
    name = parts[-1]
    if _CREDENTIAL_DIRS & set(parts[:-1]):
        return True
    if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
        return True
    if name.endswith(_CREDENTIAL_SUFFIXES) or name == "id_rsa":
        return True
    return name.startswith("credentials") and name.endswith(".json")


def _dotted(node: ast.expr) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return f"{_dotted(node.value)}.{node.attr}"
    return ""


def _zip_write_mode(call: ast.Call) -> bool:
    mode = call.args[1] if len(call.args) > 1 else None
    for keyword in call.keywords:
        if keyword.arg == "mode":
            mode = keyword.value
    return (
        isinstance(mode, ast.Constant)
        and isinstance(mode.value, str)
        and mode.value.rstrip("+b") in _WRITE_MODES
    )


def _is_openpyxl(module: str) -> bool:
    return module == "openpyxl" or module.startswith("openpyxl.")


def _imports(tree: ast.AST) -> tuple[set[str], set[str], bool, set[int]]:
    """Local names bound to `Workbook` (including `import openpyxl as x` roots,
    stored as "x."), names bound to `ZipFile`, whether `load_workbook` is used,
    and the lines importing xlsxwriter."""
    workbook_names: set[str] = set()
    zip_names: set[str] = set()
    loads_workbook = False
    xlsxwriter_lines: set[int] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            module = node.module or ""
            for alias in node.names:
                bound = alias.asname or alias.name
                if _is_openpyxl(module) and alias.name == "Workbook":
                    workbook_names.add(bound)
                elif _is_openpyxl(module) and alias.name == "load_workbook":
                    loads_workbook = True
                elif module == "zipfile" and alias.name == "ZipFile":
                    zip_names.add(bound)
            if module.split(".")[0] == "xlsxwriter":
                xlsxwriter_lines.add(node.lineno)
        elif isinstance(node, ast.Import):
            if any(a.name.split(".")[0] == "xlsxwriter" for a in node.names):
                xlsxwriter_lines.add(node.lineno)
            for alias in node.names:
                if _is_openpyxl(alias.name):
                    workbook_names.add(f"{alias.asname or alias.name.split('.')[0]}.")
        elif isinstance(node, ast.Attribute) and node.attr == "load_workbook":
            loads_workbook = True
    return workbook_names, zip_names, loads_workbook, xlsxwriter_lines


def workbook_writers(source: str) -> list[int]:
    """Line numbers where `source` writes a workbook: an openpyxl `Workbook`
    call (any import form), `.save(` in a file using `load_workbook`, an
    `xlsxwriter` import, `.to_excel(`, or a write-mode `ZipFile(...)` in a
    file holding the literal "xl/workbook.xml"."""
    tree = ast.parse(source)
    workbook_names, zip_names, loads_workbook, lines = _imports(tree)
    zip_ok = "xl/workbook.xml" in source
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        name = _dotted(node.func)
        creates = name in workbook_names or (
            name.endswith(".Workbook") and f"{name.split('.')[0]}." in workbook_names
        )
        exports = name.endswith(".to_excel") or (loads_workbook and name.endswith(".save"))
        zips = zip_ok and (name in zip_names or name == "zipfile.ZipFile")
        if creates or exports or (zips and _zip_write_mode(node)):
            lines.add(node.lineno)
    return sorted(lines)


def test_cap_boundaries():
    assert within_cap("x\n" * 999, 1000) and not within_cap("x\n" * 1000, 1000)
    assert within_cap("x\n" * 200, 201) and not within_cap("x\n" * 201, 201)


def test_verification_record_under_cap():
    assert within_cap((REPO / "VERIFICATION.md").read_text(), 1000)


def test_instruction_files_thin():
    for name in ("AGENTS.md", "CLAUDE.md"):
        assert within_cap((REPO / name).read_text(), 201), name


def test_credential_patterns():
    for bad in (
        ".env", "web/.env", ".env.local", "x.key", "x.pem", "x.p12", "keys/id_rsa",
        "a/credentials.prod.json", "private/a.txt", ".copilot-home/t",
    ):  # fmt: skip
        assert is_credential_file(bad), bad
    for ok in (".env.example", "docs/env.md", "src/keyboard.py"):
        assert not is_credential_file(ok), ok


def test_no_tracked_credential_files():
    assert [p for p in tracked() if is_credential_file(p)] == []


def test_superpowers_never_tracked():
    assert tracked(".superpowers") == []


def test_workflows_hold_no_provider_secrets():  # AGENTS.md: the build runs no providers
    for p in tracked(".github/workflows"):
        text = (REPO / p).read_text()
        assert "secrets." not in text and "API_KEY" not in text, p


def test_tracked_workbooks_are_the_two_inputs():
    assert sorted(p for p in tracked() if p.endswith(".xlsx")) == [
        "docs/templates/portfolio.template.xlsx",
        "proof/northbridge-portfolio.xlsx",
    ]


def test_workbook_writer_detection():
    assert workbook_writers("from openpyxl import Workbook\nb = Workbook()\n") == [2]
    assert workbook_writers("from openpyxl import Workbook as W\nb = W()\n") == [2]
    assert workbook_writers("import openpyxl\nb = openpyxl.Workbook()\n") == [2]
    assert workbook_writers(
        "from openpyxl import load_workbook\nb = load_workbook(p)\nb.save(q)\n"
    ) == [3]
    assert workbook_writers("from openpyxl import load_workbook\nload_workbook(p)\n") == []
    assert workbook_writers("import xlsxwriter\n") == [1]
    assert workbook_writers("df.to_excel('x.xlsx')\n") == [1]
    assert workbook_writers(
        'import zipfile\nz = zipfile.ZipFile(p, "w")\nz.writestr("xl/workbook.xml", b)\n'
    ) == [2]
    assert (
        workbook_writers('import zipfile\nz = zipfile.ZipFile(p)\nz.read("xl/workbook.xml")\n')
        == []
    )


def test_workbook_writer_import_forms():
    assert workbook_writers("import openpyxl as xl\nb = xl.Workbook()\n") == [2]
    assert workbook_writers("from openpyxl.workbook import Workbook\nb = Workbook()\n") == [2]
    assert workbook_writers(
        "from openpyxl.workbook.workbook import Workbook\nb = Workbook()\n"
    ) == [2]
    assert workbook_writers("import openpyxl\nb = openpyxl.workbook.Workbook()\n") == [2]
    assert workbook_writers(
        "from openpyxl.reader.excel import load_workbook\nb = load_workbook(p)\nb.save(q)\n"
    ) == [3]


def test_only_allowed_modules_write_workbooks():
    assert len(WORKBOOK_WRITERS_ALLOWED) <= 1
    found = {
        p: workbook_writers((REPO / p).read_text())
        for p in tracked("src", "apps")
        if p.endswith(".py")
    }
    assert {p: n for p, n in found.items() if n and p not in WORKBOOK_WRITERS_ALLOWED} == {}


def test_tracked_raises_without_git(monkeypatch):
    monkeypatch.setattr(shutil, "which", lambda _n: None)
    with pytest.raises(RuntimeError):
        tracked()


def test_tracked_raises_outside_a_checkout(tmp_path):
    with pytest.raises(RuntimeError):
        tracked(cwd=tmp_path)
