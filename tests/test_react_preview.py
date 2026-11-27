"""Retained previews copy source inputs without changing their historical run."""

import hashlib
import json
import os
import sys
import threading
import zipfile
from collections.abc import Callable, Iterator
from http.client import HTTPConnection
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import pytest

from proof import DUMMY_KEY
from react_frontend import make_server, preview
from react_frontend.preview import _restore_snapshot_downloads, stage


@pytest.fixture
def short_root() -> Iterator[Path]:
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp", prefix="rp-") as name:
        yield Path(name)


@pytest.mark.parametrize("linked_publication", [False, True])
def test_preview_copies_source_authority_and_preserves_originals(
    tmp_path: Path, linked_publication: bool
) -> None:
    engine = tmp_path / "original"
    run = engine / "runs/case"
    for child in (run / "inputs", run / "deliveries", engine / "library"):
        child.mkdir(parents=True)
    raw = b"Retained source\x0csecond page"
    (run / "inputs/digest").write_bytes(raw)
    (run / "workflow.json").write_text('{"sources":{}}')
    (run / "deliveries/CP-1.md").write_text("Original handoff")
    publication = tmp_path / "historical-data.js"
    publication.write_text("Original publication")
    if linked_publication:
        (engine / "library/data.js").symlink_to(publication)
    else:
        (engine / "library/data.js").write_text("Original publication")
    snapshot = tmp_path / "snapshot.json"
    data = {"preview": {"reason": "Retained method check"}, "workspace": {"runs": {"case": {}}}}
    snapshot.write_text(json.dumps(data))
    destination = tmp_path / "preview"
    stage(engine, snapshot, "case", destination)
    assert (destination / "_engine/runs/case/inputs/digest").read_bytes() == raw
    assert (destination / "_engine/runs/case/workflow.json").read_bytes() == (
        run / "workflow.json"
    ).read_bytes()
    assert (engine / "library/data.js").read_text() == "Original publication"
    assert publication.read_text() == "Original publication"
    assert not (destination / "_engine/library/data.js").is_symlink()
    assert "Retained method check" in (destination / "_engine/library/data.js").read_text()
    with pytest.raises(ValueError, match="empty"):
        stage(engine, snapshot, "case", destination)
    with pytest.raises(ValueError, match="invalid run"):
        stage(engine, snapshot, "../case", tmp_path / "bad")
    data["preview"] = {}
    snapshot.write_text(json.dumps(data))
    with pytest.raises(ValueError, match="qualification"):
        stage(engine, snapshot, "case", tmp_path / "unqualified")


def test_preview_cli_sets_dummy_key_before_read_only_server_start(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    engine = tmp_path / "engine"
    run = engine / "runs/case"
    for child in (run / "inputs", run / "deliveries", engine / "library"):
        child.mkdir(parents=True)
    (run / "workflow.json").write_text('{"sources":{}}', encoding="utf-8")
    (engine / "library/data.js").write_text("original", encoding="utf-8")
    snapshot = tmp_path / "snapshot.json"
    snapshot.write_text(
        json.dumps(
            {
                "preview": {"reason": "retained test"},
                "workspace": {"runs": {"case": {}}},
            }
        ),
        encoding="utf-8",
    )
    for name in (
        "ANTHROPIC_API_KEY",
        "OPENROUTER_API_KEY",
        "COPILOT_GITHUB_TOKEN",
        "COPILOT_CLI_PATH",
        "COPILOT_USE_GH_LOGIN",
    ):
        monkeypatch.setenv(name, "must-be-removed")
    called = False

    def observe_start(root: Path, web: Path, port: int, snapshot_file: Path) -> None:
        nonlocal called
        assert os.environ["OPENAI_API_KEY"] == DUMMY_KEY
        assert all(
            name not in os.environ
            for name in (
                "ANTHROPIC_API_KEY",
                "OPENROUTER_API_KEY",
                "COPILOT_GITHUB_TOKEN",
                "COPILOT_CLI_PATH",
                "COPILOT_USE_GH_LOGIN",
            )
        )
        assert (root / "_engine/library/data.js").is_file()
        assert snapshot_file == snapshot
        called = True

    monkeypatch.setattr(preview, "serve_preview", observe_start)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "preview",
            "--engine",
            str(engine),
            "--snapshot",
            str(snapshot),
            "--run",
            "case",
            "--web",
            str(tmp_path / "web"),
        ],
    )
    preview.main()
    assert called


def _retained_run(
    engine: Path, folder: str, key: str, module: str, raw: bytes
) -> tuple[dict[str, Any], dict[str, Any]]:
    run_dir = engine / "runs" / folder
    run_dir.mkdir(parents=True)
    (run_dir / f"{module}.md").write_bytes(raw)
    (run_dir / "workflow.json").write_text('{"instructions":{}}', encoding="utf-8")
    output_id = f"{folder}/{module}.md"
    digest = hashlib.sha256(raw).hexdigest()
    output = {
        "id": output_id,
        "run": key,
        "module": module,
        "source": f"{module}.md",
        "sha256": digest,
    }
    run = {
        "folder": folder,
        "modules": {module: {"outputs": [output_id], "default": output_id}},
        "evidence": {
            "zip": f"downloads/{folder}/handoffs.zip",
            "handoffs": [
                {
                    "module": module,
                    "name": f"{module}.md",
                    "href": f"downloads/{folder}/{module}.md",
                }
            ],
            "record": {"instructions": []},
        },
    }
    return run, {output_id: output}


def _download(server: Any, path: str) -> tuple[int, bytes]:
    connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
    try:
        connection.request("GET", path)
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def test_preview_rebuilds_admitted_handoff_downloads_and_zip_for_each_copied_run(
    tmp_path: Path, short_root: Path
) -> None:
    root = short_root / "preview"
    engine = root / "_engine"
    library = engine / "library"
    library.mkdir(parents=True)
    (library / "data.js").write_text("window.CREDIT_OS_DATA={};\n", encoding="utf-8")
    first, first_outputs = _retained_run(
        engine, "tdg-first-attempt", "historical-first", "CP-0", b"First retained handoff\n"
    )
    second, second_outputs = _retained_run(
        engine, "tdg-retry-attempt", "historical-retry", "CP-2G", b"Retry retained handoff\n"
    )
    snapshot = {
        "workspace": {
            "runs": {"historical-first": first, "historical-retry": second},
            "outputs": first_outputs | second_outputs,
        }
    }
    web = tmp_path / "web"
    web.mkdir()
    (web / "index.html").write_text(
        '<html><head><meta http-equiv="Content-Security-Policy" '
        "content=\"connect-src 'none'\"></head></html>",
        encoding="utf-8",
    )
    with make_server(root, web=web, read_only=True) as server:
        _restore_snapshot_downloads(root, snapshot)
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            for folder, module, expected in (
                ("tdg-first-attempt", "CP-0", b"First retained handoff\n"),
                ("tdg-retry-attempt", "CP-2G", b"Retry retained handoff\n"),
            ):
                status, body = _download(server, f"/library/downloads/{folder}/{module}.md")
                assert (status, body) == (200, expected)
                zip_status, zip_body = _download(
                    server, f"/library/downloads/{folder}/handoffs.zip"
                )
                assert zip_status == 200
                archive_path = tmp_path / f"{folder}.zip"
                archive_path.write_bytes(zip_body)
                with zipfile.ZipFile(archive_path) as archive:
                    assert archive.read(f"{module}.md") == expected
        finally:
            server.shutdown()
            thread.join()


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (
            lambda output, handoff: output.update(source="../other/CP-1.md"),
            "outside its run",
        ),
        (lambda output, handoff: output.update(run="another-run"), "another run or module"),
        (lambda output, handoff: output.update(sha256="0" * 64), "changed during the build"),
        (
            lambda output, handoff: handoff.update(href="downloads/another-run/CP-1.md"),
            "does not match",
        ),
    ],
)
def test_preview_refuses_mismatched_retained_handoff_download_pins(
    tmp_path: Path,
    mutate: Callable[[dict[str, Any], dict[str, Any]], None],
    message: str,
) -> None:
    root = tmp_path / "preview"
    engine = root / "_engine"
    library = engine / "library"
    library.mkdir(parents=True)
    run, outputs = _retained_run(engine, "run-a", "run-a", "CP-1", b"Accepted handoff\n")
    output = outputs["run-a/CP-1.md"]
    mutate(output, run["evidence"]["handoffs"][0])
    snapshot = {"workspace": {"runs": {"run-a": run}, "outputs": outputs}}

    with pytest.raises(ValueError, match=message):
        _restore_snapshot_downloads(root, snapshot)
    assert not (library / "downloads").exists()


def test_preview_refuses_a_symlinked_handoff_source(tmp_path: Path) -> None:
    root = tmp_path / "preview"
    engine = root / "_engine"
    library = engine / "library"
    library.mkdir(parents=True)
    run, outputs = _retained_run(engine, "run-a", "run-a", "CP-1", b"Accepted handoff\n")
    original = engine / "runs/run-a/CP-1.md"
    outside = tmp_path / "outside.md"
    original.unlink()
    outside.write_bytes(b"outside run")
    original.symlink_to(outside)
    snapshot = {"workspace": {"runs": {"run-a": run}, "outputs": outputs}}

    with pytest.raises(ValueError, match="link or junction"):
        _restore_snapshot_downloads(root, snapshot)
    assert outside.read_bytes() == b"outside run"
    assert not (library / "downloads").exists()


@pytest.mark.parametrize("link_path", ["downloads", "downloads/run-a"])
def test_preview_refuses_a_symlinked_download_destination(tmp_path: Path, link_path: str) -> None:
    root = tmp_path / "preview"
    engine = root / "_engine"
    library = engine / "library"
    library.mkdir(parents=True)
    run, outputs = _retained_run(engine, "run-a", "run-a", "CP-1", b"Accepted handoff\n")
    outside = tmp_path / "outside"
    outside.mkdir()
    linked = library / link_path
    linked.parent.mkdir(parents=True, exist_ok=True)
    linked.symlink_to(outside, target_is_directory=True)
    snapshot = {"workspace": {"runs": {"run-a": run}, "outputs": outputs}}

    with pytest.raises(ValueError, match="outside the preview library|link or junction"):
        _restore_snapshot_downloads(root, snapshot)
    assert list(outside.iterdir()) == []
