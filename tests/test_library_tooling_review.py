"""Synthetic handoffs and selected-commit packaging regressions for the library tooling."""

import subprocess
import sys
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import pytest

from tools import package_react_windows
from tools.cp1_check_proof import ladder_diagnostic
from tools.package_react_windows import PROJECT, SOURCE_PATHS, git

ANSWER_KEY = "tests/fixtures/cp1-instruction-pr/answer-key.json"
HANDOFF = """## Findings

### Chart data: debt maturities

| Period | Debt maturing |
| --- | --- |
| FY2025 | 30 |
| FY2026 | 20 |

### Net debt data

| Period | Gross debt |
| --- | --- |
| FY2024 | 90 |
| FY2025 | 100 |
"""
COMPARISON = (
    "debt maturities sum to 50; Net debt data Gross debt for FY2025 is 100; the ladder is 50 short"
)


def test_windows_source_archive_carries_only_the_build_time_answer_key() -> None:
    archive_bytes = git(PROJECT, "archive", "--format=zip", "HEAD", "--", *SOURCE_PATHS)
    with ZipFile(BytesIO(archive_bytes)) as archive:
        fixture_files = {
            entry.filename
            for entry in archive.infolist()
            if entry.filename.startswith("tests/") and not entry.is_dir()
        }
        assert fixture_files == {ANSWER_KEY}
        assert archive.read(ANSWER_KEY) == git(PROJECT, "show", f"HEAD:{ANSWER_KEY}")


def test_windows_package_extracts_the_selected_tree(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project = tmp_path / "project"
    project.mkdir()
    git(project, "init", "--quiet", "--template=")
    for name in SOURCE_PATHS:
        if name == ANSWER_KEY:
            continue
        path = project / ("web/package.json" if name == "web" else name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"{}\n")

    def revision(message: str) -> str:
        git(project, "add", "--force", ".")
        tree = git(project, "write-tree").decode("ascii").strip()
        return (
            git(
                project,
                "-c",
                "user.name=Archive Test",
                "-c",
                "user.email=archive@example.invalid",
                "commit-tree",
                tree,
                "-m",
                message,
            )
            .decode("ascii")
            .strip()
        )

    older = revision("Synthetic candidate without the answer key")
    fixture = project / ANSWER_KEY
    fixture.parent.mkdir(parents=True)
    fixture.write_bytes(b'{"selected": true}\n')
    newer = revision("Synthetic candidate with the answer key")
    fixture.write_bytes(b'{"worktree": true}\n')

    class ArchiveExtracted(Exception):
        """Stop after extracting the real archive, before running npm."""

    def check_staged_sources(source: Path) -> Path:
        files = {
            path.relative_to(source).as_posix()
            for path in (source / "tests").rglob("*")
            if path.is_file()
        }
        assert files == expected_paths
        if expected_paths:
            assert (source / ANSWER_KEY).read_bytes() == b'{"selected": true}\n'
        assert (source / "web/package.json").read_bytes() == b"{}\n"
        raise ArchiveExtracted

    monkeypatch.setattr(package_react_windows, "build_web", check_staged_sources)
    cases = [(older, set()), (newer, {ANSWER_KEY})]
    for selected, expected_paths in cases:
        with pytest.raises(ArchiveExtracted):
            package_react_windows.package(project, selected, tmp_path / "candidate.zip")


@pytest.mark.parametrize("bad_period", ["As reported", ""])
def test_ladder_keeps_latest_readable_comparison_alongside_bad_period(bad_period: str) -> None:
    mixed = (
        HANDOFF.replace("| FY2025 | 30 |", "| FY2025 | 1,000.20 |")
        .replace("| FY2025 | 100 |", "| FY2025 | 2,001.45 |")
        .replace("| FY2024 | 90 |", f"| {bad_period} | 90 |")
    )
    assert ladder_diagnostic(mixed) == [
        "`Net debt data` `Period` has no readable value in a row",
        (
            "debt maturities sum to 1,020.20; Net debt data Gross debt for FY2025 is 2,001.45; "
            "the ladder is 981.25 short"
        ),
    ]


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        ("Debt maturing", "Debt maturities", "`Chart data: debt maturities` missing column"),
        ("| FY2025 | 30 |", "| FY2025 | |", "`Debt maturing` has no stated number"),
        ("| FY2025 | 30 |", "| FY2025 |", "row has the wrong number of cells"),
        ("Period | Gross debt", "Date | Gross debt", "`Net debt data` missing column `Period`"),
        (
            "| FY2024 | 90 |\n| FY2025 | 100 |",
            "| As reported | 90 |\n| | 100 |",
            "`Period` has no readable value",
        ),
        ("Gross debt", "Gross Debt", "`Net debt data` missing column `Gross debt`"),
        ("| FY2025 | 100 |", "| FY2025 | |", "`Gross debt` has no stated number for FY2025"),
    ],
)
def test_malformed_ladder_diagnostic_does_not_interrupt_the_batch(
    tmp_path: Path, old: str, new: str, message: str
) -> None:
    malformed = tmp_path / "malformed.md"
    malformed.write_text(HANDOFF.replace(old, new), encoding="utf-8")
    later = tmp_path / "later.md"
    later.write_text(HANDOFF, encoding="utf-8")

    checked = subprocess.run(
        [sys.executable, str(PROJECT / "tools/cp1_check_proof.py"), str(malformed), str(later)],
        cwd=PROJECT,
        capture_output=True,
        check=False,
        text=True,
        timeout=15,
    )

    assert checked.returncode == 1, checked.stderr
    assert not checked.stderr
    first, second = checked.stdout.split(f"{later}:")
    assert f"{malformed}:" in first
    assert message in first
    assert "debt maturities sum to" not in first
    assert f"diagnostic (not a check issue): {COMPARISON}" in second
