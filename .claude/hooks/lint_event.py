"""Identify only source files changed by the current native edit event."""

from __future__ import annotations

import hashlib
import json
import math
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

MAX_FILES = 200
MAX_FILE_BYTES = 2_000_000
MAX_TOTAL_BYTES = 20_000_000
MAX_SNAPSHOT_AGE_SECONDS = 21_600
LINTABLE_SUFFIXES = {".js", ".jsx", ".mjs", ".py", ".ts", ".tsx"}
LINTABLE_PATHS = (
    "*.py",
    "web/*.js",
    "web/*.jsx",
    "web/*.mjs",
    "web/*.ts",
    "web/*.tsx",
)


class HookError(Exception):
    """The event could not be safely associated with changed source files."""


def git(root: Path, *arguments: str) -> bytes:
    result = subprocess.run(["git", *arguments], cwd=root, capture_output=True, check=False)
    if result.returncode:
        message = result.stderr.decode(errors="replace").strip()
        raise HookError(f"git {' '.join(arguments[:2])} failed: {message}")
    return result.stdout


def project_root(event: dict[str, Any]) -> Path:
    cwd = event.get("cwd")
    if not isinstance(cwd, str) or not cwd:
        raise HookError("hook event has no working directory")
    root = Path(os.fsdecode(git(Path(cwd), "rev-parse", "--show-toplevel").strip()))
    instructions = root / "AGENTS.md"
    if (
        not instructions.is_file()
        or "Credit OS2 development coordinator" not in instructions.read_text()
    ):
        raise HookError("hook event did not resolve to the Credit OS2 project")
    return root


def eligible_path(path: str) -> bool:
    return Path(path).suffix in LINTABLE_SUFFIXES and (
        Path(path).suffix == ".py" or path.startswith("web/")
    )


def normalize_path(root: Path, value: str) -> str:
    if "\n" in value or "\r" in value:
        raise HookError("multiline source paths are unsupported")
    path = Path(value)
    if path.is_absolute():
        try:
            path = path.relative_to(root)
        except ValueError as error:
            raise HookError("edited path is outside the Credit OS2 worktree") from error
    if ".." in path.parts:
        raise HookError("edited path is outside the Credit OS2 worktree")
    return path.as_posix()


def reject_symlink_path(root: Path, relative: str) -> None:
    current = root / relative
    while current != root:
        if current.is_symlink():
            raise HookError(f"edited path contains a symlink: {relative}")
        current = current.parent


def patch_paths(root: Path, patch: str) -> list[str]:
    paths: list[str] = []
    for line in patch.splitlines():
        for prefix in ("*** Add File: ", "*** Update File: ", "*** Delete File: ", "*** Move to: "):
            if line.startswith(prefix):
                paths.append(normalize_path(root, line.removeprefix(prefix)))
    return paths


def session_key(event: dict[str, Any]) -> str:
    session_id = event.get("session_id")
    tool_use_id = event.get("tool_use_id")
    if (
        not isinstance(session_id, str)
        or not session_id
        or not isinstance(tool_use_id, str)
        or not tool_use_id
    ):
        raise HookError("Bash hook event lacks a session or tool-use identifier")
    return hashlib.sha256(f"{session_id}:{tool_use_id}".encode()).hexdigest()


def snapshot_path(root: Path, event: dict[str, Any]) -> Path:
    # Distinct tool-use ids isolate concurrent Bash calls. A later post-hook can
    # observe another call's finished edits and lint them again, which is safe.
    superpowers_dir = root / ".superpowers"
    if superpowers_dir.is_symlink():
        raise HookError("lint hook state must stay inside the current worktree")
    state_dir = superpowers_dir / "lint-hook-state"
    if state_dir.is_symlink():
        raise HookError("lint hook state must stay inside the current worktree")
    state_dir.mkdir(parents=True, exist_ok=True)
    if not state_dir.resolve().is_relative_to(root.resolve()):
        raise HookError("lint hook state must stay inside the current worktree")
    return state_dir / f"{session_key(event)}.json"


def dirty_source_paths(root: Path) -> set[str]:
    records = git(
        root,
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--",
        *LINTABLE_PATHS,
    ).split(b"\0")
    candidates: set[str] = set()
    index = 0
    while index < len(records):
        record = records[index]
        index += 1
        if not record:
            continue
        status = record[:2]
        value = os.fsdecode(record[3:])
        if eligible_path(value):
            candidates.add(normalize_path(root, value))
        if b"R" in status or b"C" in status:
            index += 1
    return candidates


def changed_source_files(root: Path) -> dict[str, str]:
    candidates = dirty_source_paths(root)
    if len(candidates) > MAX_FILES:
        raise HookError(f"more than {MAX_FILES} dirty source files exceed the hook limit")
    hashes: dict[str, str] = {}
    total_size = 0
    for relative in sorted(candidates):
        reject_symlink_path(root, relative)
        source = root / relative
        if not source.is_file():
            continue
        if source.stat().st_size > MAX_FILE_BYTES:
            raise HookError("dirty source files exceed the hook byte limit")
        with source.open("rb") as source_file:
            contents = source_file.read(MAX_FILE_BYTES + 1)
        total_size += len(contents)
        if len(contents) > MAX_FILE_BYTES or total_size > MAX_TOTAL_BYTES:
            raise HookError("dirty source files exceed the hook byte limit")
        hashes[relative] = hashlib.sha256(contents).hexdigest()
    return hashes


def save_snapshot(root: Path, event: dict[str, Any]) -> None:
    state = snapshot_path(root, event)
    contents = {"created": time.time(), "files": changed_source_files(root)}
    with tempfile.NamedTemporaryFile(dir=state.parent, delete=False) as temporary:
        temporary.write(json.dumps(contents, sort_keys=True).encode())
        temporary.flush()
        os.fchmod(temporary.fileno(), 0o600)
        temporary_path = Path(temporary.name)
    temporary_path.replace(state)


def paths_after_bash(root: Path, event: dict[str, Any]) -> list[str]:
    state = snapshot_path(root, event)
    if state.is_symlink():
        raise HookError("Bash pre-edit snapshot must be a regular worktree file")
    try:
        payload = json.loads(state.read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise HookError("Bash pre-edit snapshot is missing or unreadable") from error
    finally:
        state.unlink(missing_ok=True)
    if not isinstance(payload, dict):
        raise HookError("Bash pre-edit snapshot is invalid")
    created = payload.get("created")
    if not isinstance(created, (int, float)) or not math.isfinite(created):
        raise HookError("Bash pre-edit snapshot is invalid")
    if time.time() - created > MAX_SNAPSHOT_AGE_SECONDS:
        raise HookError("Bash pre-edit snapshot expired; repeat the edit")
    before = payload.get("files")
    if not isinstance(before, dict):
        raise HookError("Bash pre-edit snapshot is invalid")
    after = changed_source_files(root)
    return [path for path, digest in after.items() if before.get(path) != digest]


def source_paths(event: dict[str, Any]) -> list[str]:
    root = project_root(event)
    tool_name = event.get("tool_name")
    event_name = event.get("hook_event_name")
    if event_name == "PreToolUse" and tool_name == "Bash":
        save_snapshot(root, event)
        return []
    if event_name == "PostToolUse" and tool_name == "Bash":
        return paths_after_bash(root, event)
    tool_input = event.get("tool_input")
    if not isinstance(tool_input, dict):
        raise HookError("edit hook event has no tool input")
    file_path = tool_input.get("file_path")
    if isinstance(file_path, str) and file_path:
        path = normalize_path(root, file_path)
        if eligible_path(path):
            reject_symlink_path(root, path)
            return [path]
        return []
    patch = tool_input.get("patch") or tool_input.get("input") or tool_input.get("command")
    if isinstance(patch, str) and patch.startswith("*** Begin Patch\n"):
        return patch_paths(root, patch)
    raise HookError("edit hook event has no recognized file path or patch")


def main() -> int:
    try:
        event = json.load(sys.stdin)
        if not isinstance(event, dict):
            raise HookError("hook event must be an object")
        for path in source_paths(event):
            print(path)
    except (json.JSONDecodeError, UnicodeDecodeError, HookError, OSError) as error:
        print(f"lint-edited: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
