"""Antigravity PostToolUse hook: lint the Python or web file edited by the current tool call."""

from __future__ import annotations

import json
import os
import subprocess  # nosec B404
import sys
from pathlib import Path
from typing import Any

WEB_SUFFIXES = frozenset({".js", ".jsx", ".mjs", ".ts", ".tsx"})
ROOT_MSG = "Fix the gate findings above at their root cause; do not add suppressions."


class HookError(Exception):
    """The hook event could not be safely validated or mapped to the repository."""


def _git_root(cwd: Path) -> Path:
    try:
        res = subprocess.run(  # nosec B603 B607
            ["git", "rev-parse", "--show-toplevel"],
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as error:
        raise HookError(f"failed to run git: {error}") from error
    if res.returncode != 0:
        detail = res.stderr.strip() or f"exit {res.returncode}"
        raise HookError(f"git rev-parse failed: {detail}")
    root = Path(res.stdout.strip())
    agents = root / "AGENTS.md"
    try:
        agents_text = agents.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as error:
        raise HookError(f"cannot read AGENTS.md: {error}") from error
    if "Credit OS2 development coordinator" not in agents_text:
        raise HookError("hook event did not resolve to the Credit OS2 project")
    return root.resolve()


def _strip_repo_prefix(root_resolved: Path, target: Path) -> Path | None:
    try:
        return target.relative_to(root_resolved)
    except ValueError:
        pass
    # Walk shallowest to deepest so symlinked worktree prefixes (e.g. /tmp -> /private/tmp)
    # match at the repo boundary without dereferencing symlinks inside the repo.
    for ancestor in [*reversed(target.parents), target]:
        try:
            resolved = ancestor.resolve()
        except OSError:
            continue
        if resolved == root_resolved:
            return target.relative_to(ancestor)
    return None


def _reject_symlinks(root_resolved: Path, rel: Path) -> None:
    current = root_resolved / rel
    while current != root_resolved:
        if current.is_symlink():
            raise HookError(f"edited path contains a symlink: {rel.as_posix()}")
        current = current.parent


def _resolve_cwd_rel(root_resolved: Path, cwd_path: Path) -> Path:
    cwd_abs = Path(os.path.abspath(cwd_path))
    cwd_rel = _strip_repo_prefix(root_resolved, cwd_abs)
    if cwd_rel is not None:
        _reject_symlinks(root_resolved, cwd_rel)
        return cwd_rel
    try:
        return cwd_path.resolve().relative_to(root_resolved)
    except ValueError as error:
        raise HookError(f"hook cwd is outside the repository: {cwd_path}") from error


def _relative_target(root_resolved: Path, cwd_rel: Path, raw_path: str) -> str | None:
    if not raw_path or "\n" in raw_path or "\r" in raw_path or "\0" in raw_path:
        raise HookError("edited path is empty or contains invalid characters")
    path = Path(raw_path)
    if ".." in path.parts:
        raise HookError(f"path traversal '..' is not allowed: {raw_path}")
    if path.is_absolute():
        rel = _strip_repo_prefix(root_resolved, path)
        if rel is None:
            if path.resolve().is_relative_to(root_resolved):
                raise HookError(f"edited path reaches repository via external symlink: {raw_path}")
            return None
    else:
        rel = cwd_rel / path
    _reject_symlinks(root_resolved, rel)
    return rel.as_posix()


def _lint_python(root: Path) -> int:
    try:
        has_base = subprocess.run(  # nosec B603 B607
            ["git", "rev-parse", "--verify", "-q", "origin/main"],
            cwd=root,
            capture_output=True,
            check=False,
        )
    except OSError as error:
        print(f"lint-edited: failed to run git: {error}", file=sys.stderr)
        return 2
    if has_base.returncode != 0:
        print(
            "lint-edited: origin/main is required to run the Python quality gate",
            file=sys.stderr,
        )
        return 2
    cmd = [
        "uv",
        "run",
        "python",
        "tools/quality_gate.py",
        "--base",
        "origin/main",
        "--checks",
        "code",
    ]
    try:
        res = subprocess.run(  # nosec B603 B607
            cmd,
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as error:
        print(f"lint-edited: failed to run uv: {error}", file=sys.stderr)
        return 2
    if res.returncode != 0:
        print(f"{res.stdout}{res.stderr}\n{ROOT_MSG}", file=sys.stderr)
        return 2
    return 0


def _lint_web(root: Path, rel: str) -> int:
    eslint = root / "web/node_modules/.bin/eslint"
    if not eslint.is_file():
        print(
            "lint-edited: web/node_modules/.bin/eslint missing; install web dependencies",
            file=sys.stderr,
        )
        return 2
    web_rel = rel.removeprefix("web/")
    try:
        res = subprocess.run(  # nosec B603
            [str(eslint), "--max-warnings=0", "--no-warn-ignored", "--", web_rel],
            cwd=root / "web",
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as error:
        print(f"lint-edited: failed to run eslint: {error}", file=sys.stderr)
        return 2
    if res.returncode != 0:
        print(f"{res.stdout}{res.stderr}\n{ROOT_MSG}", file=sys.stderr)
        return 2
    return 0


def _extract_path_arg(event: dict[str, Any]) -> str:
    tool_call = event.get("toolCall")
    if not isinstance(tool_call, dict):
        raise HookError("hook event is missing toolCall object")
    args = tool_call.get("args")
    if not isinstance(args, dict):
        raise HookError("hook event toolCall.args must be an object")
    raw_path = args.get("Path") or args.get("TargetFile")
    if not isinstance(raw_path, str) or not raw_path:
        raise HookError("hook event toolCall.args is missing Path or TargetFile")
    return raw_path


def _extract_target(event: dict[str, Any]) -> tuple[Path, str] | None:
    if event.get("error"):
        return None
    cwd_raw = event.get("cwd")
    if not isinstance(cwd_raw, str) or not cwd_raw or "\0" in cwd_raw:
        raise HookError("hook event has missing or invalid cwd")
    cwd_path = Path(cwd_raw)
    if not cwd_path.is_dir():
        raise HookError(f"hook cwd does not exist: {cwd_raw}")
    root_resolved = _git_root(cwd_path.resolve())
    cwd_rel = _resolve_cwd_rel(root_resolved, cwd_path)
    raw_path = _extract_path_arg(event)
    rel = _relative_target(root_resolved, cwd_rel, raw_path)
    if rel is None or not (root_resolved / rel).is_file():
        return None
    return root_resolved, rel


def handle_event(event: dict[str, Any]) -> int:
    """Return 0 on pass/skip, 2 on lint failure; raises HookError on malformed input."""
    target = _extract_target(event)
    if target is None:
        return 0
    root, rel = target
    suffix = Path(rel).suffix
    if suffix == ".py":
        return _lint_python(root)
    if rel.startswith("web/") and suffix in WEB_SUFFIXES:
        return _lint_web(root, rel)
    return 0


def main() -> int:
    """Parse stdin hook payload, run lint when eligible, and emit `{}` on stdout."""
    code = 0
    try:
        event = json.load(sys.stdin)
        if not isinstance(event, dict):
            print("lint-edited: hook event must be a JSON object", file=sys.stderr)
            code = 2
        else:
            code = handle_event(event)
    except (json.JSONDecodeError, UnicodeDecodeError, HookError, OSError) as error:
        print(f"lint-edited: {error}", file=sys.stderr)
        code = 2
    print("{}")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
