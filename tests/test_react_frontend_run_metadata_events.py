"""A long, well-formed events log is read; the byte limit stays the bound."""

import json
from pathlib import Path

import pytest

from deploy_workflow.library_index import Refused
from react_frontend import run_metadata


def _write(directory: Path, lines: list[str]) -> None:
    (directory / "events.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")


def _line(number: int) -> str:
    return json.dumps({"event": "module_started", "module": f"CP-{number}"})


def test_a_log_of_fifteen_hundred_lines_is_read_whole(tmp_path: Path) -> None:
    _write(tmp_path, [_line(number) for number in range(1500)])
    events = run_metadata._events(run_metadata._Reads(tmp_path))
    assert events is not None
    assert len(events) == 1500
    assert events[1499] == {"event": "module_started", "module": "CP-1499"}


def test_a_torn_final_line_is_still_left_for_the_next_poll(tmp_path: Path) -> None:
    (tmp_path / "events.jsonl").write_text(
        "\n".join(_line(number) for number in range(1200)) + '\n{"event": "mod',
        encoding="utf-8",
    )
    events = run_metadata._events(run_metadata._Reads(tmp_path))
    assert events is not None and len(events) == 1200


def test_a_log_over_the_file_byte_limit_is_still_refused(tmp_path: Path) -> None:
    (tmp_path / "events.jsonl").write_bytes(b"{}\n" * (4 * 1024 * 1024 // 3 + 1))
    with pytest.raises((Refused, OSError, ValueError)):
        run_metadata._events(run_metadata._Reads(tmp_path))
