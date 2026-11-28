"""Intake refuses an evidence item that holds no readable text, as prepare does."""

from datetime import date
from pathlib import Path

from deploy_workflow.research.intake import intake, parse_rows

_AS_OF = date(2026, 6, 30)
_REASON = "holds no readable text"


def _rows() -> tuple:
    return parse_rows(
        [
            {"tag": "research", "path": "a.txt", "family": "news", "locator": "empty-file"},
            {"tag": "research", "path": "b.txt", "family": "news", "locator": "blank-file"},
            {"tag": "research", "path": "c.html", "family": "news", "locator": "script-only"},
            {"tag": "research", "path": "d.txt", "family": "news", "locator": "good"},
        ]
    )


def _write(base: Path) -> None:
    (base / "a.txt").write_bytes(b"")
    (base / "b.txt").write_bytes(b" \n\t\r\n  \n")
    (base / "c.html").write_bytes(b"<html><body><script>var x = 1;</script></body></html>")
    (base / "d.txt").write_bytes(b"Revenue grew 4 percent.")


def _run(base: Path):
    _write(base)
    return intake(_rows(), base_dir=base, dest_dir=None, as_of=_AS_OF, cutoff=_AS_OF, today=_AS_OF)


def test_empty_items_are_refused_with_locator_and_reason(tmp_path: Path) -> None:
    result = _run(tmp_path)
    assert [(r.locator, r.reason) for r in result.refused] == [
        ("empty-file", f"evidence item empty-file {_REASON}"),
        ("blank-file", f"evidence item blank-file {_REASON}"),
        ("script-only", f"evidence item script-only {_REASON}"),
    ]


def test_good_item_is_still_accepted(tmp_path: Path) -> None:
    result = _run(tmp_path)
    assert [(i.item_id, i.locator, i.text) for i in result.accepted] == [
        ("ev-1", "good", "Revenue grew 4 percent.")
    ]


def test_staging_does_not_abort_run_start(tmp_path: Path) -> None:
    from deploy_workflow.run_inputs import ResearchStaging, _research_files

    result = _run(tmp_path)
    staging = ResearchStaging("0" * 64, "x", result.accepted, result.refused, (), None, {})
    files, requests = _research_files(staging)
    assert [r.source_id for r in requests] == ["ev-1"]
    assert len(files) == 1
