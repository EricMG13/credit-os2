"""Open a retained test preview from an isolated copy, without scheduling or provider access."""

from __future__ import annotations

import argparse
import importlib
import json
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory
from typing import Any, Protocol, cast

from proof import DUMMY_KEY
from react_frontend import RUN_ID, make_server


def _write_snapshot(library: Path, snapshot: str) -> None:
    # Replace the copied directory entry; never follow a link back into the original library.
    if any(not _plain_path(path) for path in (library.parent.parent, library.parent, library)):
        raise ValueError("preview library path contains a link or junction")
    target = library / "data.js"
    target.unlink(missing_ok=True)
    with target.open("x", encoding="utf-8") as stream:
        stream.write("window.CREDIT_OS_DATA=" + snapshot + ";\n")


def _plain_path(path: Path) -> bool:
    """Whether this existing path component is not a link or a junction."""
    return not path.is_symlink() and not path.is_junction()


def _plain_descendants(root: Path, target: Path) -> bool:
    """Whether target stays under root without crossing a linked component."""
    if not _plain_path(root):
        return False
    try:
        parts = target.relative_to(root).parts
    except ValueError:
        return False
    current = root
    for part in parts:
        current = current / part
        if not _plain_path(current):
            return False
    return True


def _safe_source(source: Any, module: str) -> str:
    """Only accept a module's retained root handoff or its normal delivery location."""
    if not isinstance(source, str):
        raise TypeError("retained handoff source is missing")
    if source == f"{module}.md":
        return source
    if re.fullmatch(rf"deliveries/[0-9a-f]{{64}}/{re.escape(module)}\.md", source):
        return source
    raise ValueError("retained handoff source is outside its run or module")


class _LibraryPublisher(Protocol):
    """The typed surface of the installed issuer-library publisher used by a preview."""

    def checked_bytes(self, path: Path, digest: str, label: str) -> bytes: ...

    def handoff_zip(
        self, folder: Path, workspace: Path, run: dict[str, Any], store: dict[str, Any]
    ) -> None: ...


@dataclass
class _DownloadContext:
    folder: str
    key: str
    run_dir: Path
    modules: dict[str, Any]
    outputs: dict[str, Any]
    publisher: _LibraryPublisher
    names: set[str]


def _safe_download_target(downloads: Path, relative: str) -> Path:
    """Refuse links, junctions and paths that leave this preview's downloads folder."""
    path = PurePosixPath(relative)
    if path.is_absolute() or not path.parts or any(part in {".", ".."} for part in path.parts):
        raise ValueError("retained download path is invalid")
    target = downloads.joinpath(*path.parts)
    if downloads.resolve() not in target.resolve().parents:
        raise ValueError("retained download path is outside the preview library")
    current = downloads
    for index, part in enumerate(path.parts):
        current = current / part
        if not _plain_path(current):
            raise ValueError("retained download path contains a link or junction")
        if current.exists() and index < len(path.parts) - 1 and not current.is_dir():
            raise ValueError("retained download parent is not a directory")
        if current.exists() and index == len(path.parts) - 1 and not current.is_file():
            raise ValueError("retained download target is not a regular file")
    return target


def _handoff_module(handoff: Any, context: _DownloadContext) -> str:
    if not isinstance(handoff, dict):
        raise TypeError("retained handoff pin is invalid")
    module = handoff.get("module")
    if not isinstance(module, str):
        raise TypeError("retained handoff module is invalid")
    if re.fullmatch(r"CP-[A-Z0-9]+", module) is None:
        raise ValueError("retained handoff module is invalid")
    name = f"{module}.md"
    if handoff.get("name") != name or handoff.get("href") != f"downloads/{context.folder}/{name}":
        raise ValueError("retained handoff link does not match its run and module")
    if module in context.names:
        raise ValueError("retained handoff module is duplicated")
    context.names.add(module)
    return module


def _pinned_output(context: _DownloadContext, module: str) -> tuple[str, dict[str, Any]]:
    module_pin = context.modules.get(module)
    if not isinstance(module_pin, dict):
        raise TypeError("retained handoff module pin is invalid")
    output_id = module_pin.get("default")
    output_ids = module_pin.get("outputs")
    if not isinstance(output_ids, list) or not isinstance(output_id, str):
        raise TypeError("retained handoff output pin is invalid")
    if output_id not in output_ids:
        raise ValueError("retained handoff is not the module's accepted output")
    output = context.outputs.get(output_id)
    if not isinstance(output, dict):
        raise TypeError("retained handoff output record is invalid")
    if (
        output.get("id") != output_id
        or output.get("run") != context.key
        or output.get("module") != module
    ):
        raise ValueError("retained handoff output belongs to another run or module")
    source = _safe_source(output.get("source"), module)
    if output_id != f"{context.folder}/{source}":
        raise ValueError("retained handoff output ID does not match its source")
    digest = output.get("sha256")
    if not isinstance(digest, str):
        raise TypeError("retained handoff hash is invalid")
    if re.fullmatch(r"[0-9a-f]{64}", digest) is None:
        raise ValueError("retained handoff hash is invalid")
    source_path = context.run_dir / source
    if not _plain_descendants(context.run_dir, source_path):
        raise ValueError("retained handoff source contains a link or junction")
    context.publisher.checked_bytes(source_path, digest, f"{context.folder}/{source}")
    return output_id, output


def _download_context(
    engine: Path,
    key: str,
    run: dict[str, Any],
    outputs: Any,
    publisher: _LibraryPublisher,
) -> tuple[_DownloadContext, dict[str, Any], list[Any]]:
    folder = run.get("folder")
    if not isinstance(key, str) or not isinstance(folder, str):
        raise TypeError("retained run identity is invalid")
    if RUN_ID.fullmatch(key) is None or folder in {".", ".."} or RUN_ID.fullmatch(folder) is None:
        raise ValueError("retained run identity is invalid")
    run_dir = engine / "runs" / folder
    if not _plain_descendants(engine / "runs", run_dir) or not run_dir.is_dir():
        raise ValueError("retained run is missing or linked")
    evidence, modules = run.get("evidence"), run.get("modules")
    if not isinstance(evidence, dict) or not isinstance(modules, dict):
        raise TypeError("retained run Evidence pins are missing")
    handoffs = evidence.get("handoffs")
    if not isinstance(handoffs, list):
        raise TypeError("retained handoff pins are invalid")
    if not isinstance(outputs, dict):
        raise TypeError("retained output pins are missing")
    context = _DownloadContext(folder, key, run_dir, modules, outputs, publisher, set())
    return context, evidence, handoffs


def _run_downloads(engine: Path, key: str, run: dict[str, Any], outputs: Any) -> None:
    """Validate one admitted run's handoff pins, then use the library's normal writer."""
    publisher = cast(_LibraryPublisher, importlib.import_module("update_library"))
    context, evidence, handoffs = _download_context(engine, key, run, outputs, publisher)
    if not handoffs:
        return
    if evidence.get("zip") != f"downloads/{context.folder}/handoffs.zip":
        raise ValueError("retained handoff ZIP points outside its run")

    selected: dict[str, Any] = {}
    targets = [f"{context.folder}/handoffs.zip"]
    for handoff in handoffs:
        module = _handoff_module(handoff, context)
        output_id, output = _pinned_output(context, module)
        selected[output_id] = output
        targets.append(f"{context.folder}/{module}.md")

    workflow_path = context.run_dir / "workflow.json"
    if not _plain_descendants(context.run_dir, workflow_path) or not workflow_path.is_file():
        raise ValueError("retained workflow is missing or linked")
    record = evidence.get("record")
    safe_record = dict(record) if isinstance(record, dict) else {}
    safe_record["instructions"] = []
    safe_run = {**run, "evidence": {**evidence, "record": safe_record}}
    library = engine / "library"
    downloads = library / "downloads"
    for directory in (engine, library, downloads):
        if not _plain_path(directory):
            raise ValueError("preview download directory contains a link or junction")
    if not library.is_dir():
        raise ValueError("preview library folder is missing")
    downloads.mkdir(parents=True, exist_ok=True)
    for target in targets:
        _safe_download_target(downloads, target)
    publisher.handoff_zip(library, engine, safe_run, {"outputs": selected})


def _restore_snapshot_downloads(root: Path, snapshot: dict[str, Any]) -> None:
    """Rebuild only the copied runs' normal Evidence downloads from admitted snapshot pins."""
    engine = root / "_engine"
    workspace = snapshot.get("workspace")
    runs = workspace.get("runs") if isinstance(workspace, dict) else None
    outputs = workspace.get("outputs") if isinstance(workspace, dict) else None
    if not isinstance(runs, dict) or not isinstance(outputs, dict):
        raise TypeError("retained preview run and output pins are missing")
    for key, run in runs.items():
        if not isinstance(key, str) or not isinstance(run, dict):
            continue
        folder = run.get("folder")
        if not isinstance(folder, str) or folder in {".", ".."} or RUN_ID.fullmatch(folder) is None:
            continue
        run_dir = engine / "runs" / folder
        if run_dir.exists() or run_dir.is_symlink() or run_dir.is_junction():
            _run_downloads(engine, key, run, outputs)


def stage(engine: Path, snapshot_file: Path, run: str, root: Path) -> None:
    """Copy the original publication, source pins and retained input bytes; never edit the run."""
    if RUN_ID.fullmatch(run) is None or run in {".", ".."}:
        raise ValueError("invalid run folder")
    snapshot = json.loads(snapshot_file.read_bytes())
    if not snapshot.get("preview", {}).get("reason"):
        raise ValueError("a retained preview must keep its explicit preview qualification")
    if run not in snapshot["workspace"]["runs"]:
        raise ValueError("the selected run is absent from the retained snapshot")
    if root.exists() and any(root.iterdir()):
        raise ValueError("preview destination must be empty")
    original = engine / "runs" / run
    copied = root / "_engine" / "runs" / run
    copied.mkdir(parents=True)
    shutil.copy2(original / "workflow.json", copied / "workflow.json", follow_symlinks=False)
    for name in ("inputs", "deliveries"):
        shutil.copytree(original / name, copied / name, symlinks=True)
    library = root / "_engine" / "library"
    shutil.copytree(engine / "library", library, symlinks=True)
    # The supplied snapshot preserves the retained preview's admission notice and exact handoffs.
    _write_snapshot(library, json.dumps(snapshot, ensure_ascii=False))


def serve_preview(root: Path, web: Path, port: int, snapshot: Path) -> None:
    """Use the existing connected HTTP service with every write endpoint refused."""
    retained = json.loads(snapshot.read_bytes())
    with make_server(root, web=web, port=port, read_only=True) as server:
        # Server startup may refresh library data; restore the qualified retained snapshot only.
        _write_snapshot(root / "_engine/library", json.dumps(retained, ensure_ascii=False))
        _restore_snapshot_downloads(root, retained)

        print(f"http://127.0.0.1:{server.server_address[1]}/", flush=True)
        server.serve_forever()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--engine", type=Path, required=True)
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--run", required=True)
    parser.add_argument("--web", type=Path, required=True)
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args()
    # No worker is started; the sentinel satisfies native startup without using a provider key.
    os.environ["OPENAI_API_KEY"] = DUMMY_KEY
    for key in (
        "ANTHROPIC_API_KEY",
        "OPENROUTER_API_KEY",
        "COPILOT_GITHUB_TOKEN",
        "COPILOT_CLI_PATH",
        "COPILOT_USE_GH_LOGIN",
    ):
        os.environ.pop(key, None)
    with TemporaryDirectory(prefix="cr-") as temporary:
        root = Path(temporary)
        stage(args.engine, args.snapshot, args.run, root)
        serve_preview(root, args.web, args.port, args.snapshot)


if __name__ == "__main__":
    main()
