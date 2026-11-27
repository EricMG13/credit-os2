"""Offline publication regressions using synthetic, hash-pinned run folders."""

import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from pathlib import Path
from threading import Event

import pytest
import update_library
from credit_os.source import strict_loads
from library_fixtures import make_run, method, with_changes
from test_changes import REGISTERS
from test_update_library import (
    SEAM_PACK,
    changes_of,
    current_run,
    data_of,
    outcome,
    write_record,
)


@pytest.fixture(autouse=True)
def stand_in_method(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("deploy_workflow.library_index.current_method", lambda: method())


def test_concurrent_publications_retain_the_run_seen_by_the_newer_scan(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    make_run(tmp_path, "earlier")
    older_built = Event()
    release_older = Event()
    newer_started = Event()
    build_into = update_library.build_into

    def pause_older(folder: Path, workspace: Path, library: update_library.Library) -> None:
        build_into(folder, workspace, library)
        if [run["id"] for run in library.runs] == ["earlier"]:
            older_built.set()
            assert release_older.wait(10), "older publisher was never released"

    def publish_newer() -> update_library.Library:
        newer_started.set()
        return update_library.update_library(tmp_path)

    monkeypatch.setattr(update_library, "build_into", pause_older)
    with ThreadPoolExecutor(max_workers=2) as pool:
        older = pool.submit(update_library.update_library, tmp_path)
        try:
            assert older_built.wait(5)
            make_run(tmp_path, "later", as_of="2025-06-30")
            newer = pool.submit(publish_newer)
            assert newer_started.wait(5)
            try:
                newer.result(timeout=1)
            except TimeoutError:
                pass  # A serialized publisher must wait for the first publication.
        finally:
            release_older.set()
        assert {run["id"] for run in older.result(timeout=5).runs} == {"earlier"}
        assert {run["id"] for run in newer.result(timeout=5).runs} == {"earlier", "later"}

    assert {row["id"] for row in data_of(tmp_path)["catalogue"]["real"]} == {
        "earlier",
        "later",
    }
    assert sorted(path.name for path in tmp_path.iterdir()) == ["library", "runs"]


@pytest.mark.parametrize("measures", [{}, {"measures": None}, {"measures": {}}])
def test_a_pinned_pack_without_a_measures_list_is_a_local_changes_problem(
    tmp_path: Path, measures: dict[str, object]
) -> None:
    make_run(tmp_path, "earlier", as_of="2024-09-30")
    later = current_run(tmp_path, "later", modules=("CP-0", "CP-1", "CP-8"), cp8=REGISTERS)
    pack = {key: value for key, value in SEAM_PACK.items() if key != "measures"} | measures
    with_changes(later, pack=json.dumps(pack).encode())

    update_library.update_library(tmp_path)

    got = changes_of(tmp_path, "later")
    assert got["pack"] is None
    assert got["verdicts"] is None
    assert got["first_run"] is False
    assert "changes.json" in got["problem"] and "measures" in got["problem"]
    data = data_of(tmp_path)
    assert set(data["workspace"]["runs"]) == {"earlier", "later"}
    assert f"later: {got['problem']}" in data["workspace"]["issues"]


@pytest.mark.parametrize("exponent", ["1e309", "-1e309"])
def test_an_overflowed_json_number_names_the_bad_record_and_keeps_other_data(
    tmp_path: Path, exponent: str
) -> None:
    write_record(
        make_run(tmp_path, "bad"),
        "CP-1",
        "f" * 64,
        1,
        [outcome("agreed", recomputed="overflow-token")],
    )
    record = tmp_path / "runs/bad/requests/CP-1" / ("f" * 64) / "1.method-checks.json"
    record.write_text(
        record.read_text(encoding="utf-8").replace('"overflow-token"', exponent),
        encoding="utf-8",
    )
    write_record(
        make_run(tmp_path, "good", as_of="2025-06-30"),
        "CP-1",
        "e" * 64,
        1,
        [outcome("agreed", recomputed=1e8)],
    )

    update_library.update_library(tmp_path)

    data = data_of(tmp_path)["workspace"]
    assert data["runs"]["bad"]["evidence"]["scriptChecks"] == []
    assert any(
        issue.startswith("bad: requests/CP-1/")
        and "1.method-checks.json could not be read" in issue
        and exponent in issue
        for issue in data["issues"]
    )
    (good,) = data["runs"]["good"]["evidence"]["scriptChecks"]
    assert good["outcomes"][0]["recomputed"] == 100_000_000.0


def test_strict_json_keeps_finite_floats_integers_and_numeric_text() -> None:
    assert strict_loads(b'[1e308, -1e308, 9007199254740993, "1e309"]') == [
        1e308,
        -1e308,
        9007199254740993,
        "1e309",
    ]
