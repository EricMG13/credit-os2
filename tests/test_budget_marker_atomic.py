"""F5: a reservation marker appears whole or not at all; create-once is kept."""

import json
from decimal import Decimal
from pathlib import Path

import pytest

from deploy_workflow.model import budget
from deploy_workflow.model.budget import DuplicateCall


def test_the_final_name_is_never_visible_empty(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    final = tmp_path / "call-1"
    seen: list[bytes | None] = []
    real_link = budget.os.link

    def spy(src: object, dst: object, **kw: object) -> None:
        seen.append(final.read_bytes() if final.exists() else None)
        real_link(src, dst, **kw)  # type: ignore[arg-type]

    monkeypatch.setattr(budget.os, "link", spy)
    real_open = budget.os.open

    def open_spy(path: object, flags: int, mode: int = 0o777) -> int:
        if Path(str(path)) == final:  # the old way: the final name is created empty first
            seen.append(b"")
        return real_open(path, flags, mode)  # type: ignore[arg-type]

    monkeypatch.setattr(budget.os, "open", open_spy)
    budget._write_once(final, {"a": Decimal(1).__str__()})
    assert b"" not in seen
    assert json.loads(final.read_text()) == {"a": "1"}
    assert [p.name for p in tmp_path.iterdir()] == ["call-1"]  # no temp left behind


def test_a_second_write_is_a_duplicate_and_keeps_the_first(tmp_path: Path) -> None:
    final = tmp_path / "call-1"
    budget._write_once(final, {"a": "1"})
    with pytest.raises(DuplicateCall):
        budget._write_once(final, {"a": "2"})
    assert json.loads(final.read_text()) == {"a": "1"}
    assert [p.name for p in tmp_path.iterdir()] == ["call-1"]


def test_a_leftover_temp_file_is_skipped_by_readers(tmp_path: Path) -> None:
    directory = tmp_path / budget.AUDIT / budget.RESERVATIONS
    directory.mkdir(parents=True)
    budget._write_once(directory / "call-1", {"usd": "1", "config_id": "c", "retry_of": None})
    (directory / ".tmp-call-2.123.abcdef").write_text("{")  # a crash left it half written
    snapshot = budget.read_reservation_snapshot(tmp_path)
    assert [s.call_id for s in snapshot] == ["call-1"]
