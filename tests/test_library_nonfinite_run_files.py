"""Non-finite numbers in run files: the record is unreadable and named, the library still publishes.

Python writers emit ``NaN``/``Infinity`` with ``json.dumps`` defaults; the library page data cannot
carry them, and no stand-in value (None, 0, a string) may replace one.
"""

import json
from pathlib import Path

import pytest
import update_library
from credit_os import evidence
from library_fixtures import make_run

from deploy_workflow.library_index import Refused


@pytest.fixture(autouse=True)
def stand_in_method(monkeypatch):
    from library_fixtures import method

    monkeypatch.setattr("deploy_workflow.library_index.current_method", lambda: method())


@pytest.mark.parametrize("constant", ["NaN", "Infinity", "-Infinity"])
def test_run_json_names_a_file_holding_a_non_finite_number(tmp_path: Path, constant: str) -> None:
    path = tmp_path / "check.json"
    path.write_text('{"checks": [{"recomputed": ' + constant + "}]}", encoding="utf-8")
    issues: list[str] = []
    assert evidence.run_json(path, issues, "r1: check.json") is None
    assert len(issues) == 1
    assert issues[0].startswith("r1: check.json could not be read (")
    assert constant in issues[0]


def test_run_json_still_reads_finite_json(tmp_path: Path) -> None:
    path = tmp_path / "ok.json"
    path.write_text('{"a": 1.5}', encoding="utf-8")
    issues: list[str] = []
    assert evidence.run_json(path, issues, "x") == {"a": 1.5}
    assert issues == []


def test_a_call_line_with_a_non_finite_number_is_not_a_call_record(tmp_path: Path) -> None:
    (tmp_path / "live").mkdir()
    good = json.dumps({"module_id": "CP-0", "attempt": 1, "settled_usd": 0.5})
    bad = '{"module_id": "CP-1", "attempt": 1, "settled_usd": NaN}'
    (tmp_path / "live/calls.jsonl").write_text(good + "\n" + bad + "\n", encoding="utf-8")
    issues: list[str] = []
    calls = evidence.run_calls(tmp_path, "r1", issues)
    assert [c["module"] for c in calls] == ["CP-0"]
    assert issues == ["r1: live/calls.jsonl line 2 is not a call record"]


def test_a_non_finite_value_reaching_the_page_data_is_a_named_refusal() -> None:
    with pytest.raises(Refused, match="Not written: .*not a finite number"):
        update_library.embedded_json({"x": [float("inf")]})


def test_the_command_refuses_by_name_and_keeps_the_previous_library(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    make_run(tmp_path, "run1")
    update_library.update_library(tmp_path)
    before = (tmp_path / "library/data.js").read_bytes()
    monkeypatch.setattr(update_library, "chips", lambda workspace, store: {"x": float("nan")})
    with pytest.raises(SystemExit, match="Not written: .*not a finite number"):
        update_library.main(["--workspace", str(tmp_path)])
    assert (tmp_path / "library/data.js").read_bytes() == before
