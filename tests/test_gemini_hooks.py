"""Verify the Antigravity PostToolUse lint hook parses camelCase events and stays fail-closed."""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess  # nosec B404
import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
HOOK_PATH = ROOT / ".agents/hooks/lint_edited.py"
HOOKS_JSON = ROOT / ".agents/hooks.json"


def _load_hook() -> Any:
    spec = importlib.util.spec_from_file_location("gemini_lint_edited", HOOK_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _run_hook(
    payload: str | dict[str, Any],
    *,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    raw = payload if isinstance(payload, str) else json.dumps(payload)
    return subprocess.run(  # nosec B603
        [sys.executable, str(HOOK_PATH)],
        input=raw,
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )


def _init_mini_repo(repo: Path) -> Path:
    repo.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "init", "-q"], cwd=repo, check=True)  # nosec B603 B607
    (repo / "AGENTS.md").write_text("Credit OS2 development coordinator\n", encoding="utf-8")
    return repo


def test_hooks_json_registers_antigravity_post_tool_use_lint() -> None:
    config = json.loads(HOOKS_JSON.read_text(encoding="utf-8"))
    entries = config["credit-os2-lint-edited"]["PostToolUse"]
    assert len(entries) == 1
    assert entries[0]["matcher"] == (
        "write_file|edit_file|write_to_file|replace_file_content|multi_replace_file_content"
    )
    assert entries[0]["hooks"][0]["command"] == "python3 ./hooks/lint_edited.py"


def test_hook_skips_non_code_and_error_events_with_empty_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    res = _run_hook(
        {
            "hookEventName": "PostToolUse",
            "cwd": str(ROOT),
            "toolCall": {"name": "edit_file", "args": {"Path": str(ROOT / "README.md")}},
        }
    )
    assert res.returncode == 0
    assert json.loads(res.stdout) == {}

    err_res = _run_hook(
        {
            "hookEventName": "PostToolUse",
            "cwd": str(ROOT),
            "error": "edit failed",
            "toolCall": {"name": "edit_file", "args": {"Path": str(ROOT / "tools/dev_ledger.py")}},
        }
    )
    assert err_res.returncode == 0
    assert json.loads(err_res.stdout) == {}

    hook = _load_hook()
    called: list[str] = []
    monkeypatch.setattr(hook, "_lint_python", lambda _r: called.append("py") or 0)
    monkeypatch.setattr(hook, "_lint_web", lambda _r, _rel: called.append("web") or 0)
    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT),
                "error": "tool failed",
                "toolCall": {"args": {"Path": str(ROOT / "tools/dev_ledger.py")}},
            }
        )
        == 0
    )
    assert called == []


def test_hook_routes_python_and_web_paths_and_rejects_escape(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    hook = _load_hook()
    seen: list[tuple[str, str]] = []
    monkeypatch.setattr(hook, "_lint_python", lambda root: seen.append(("py", str(root))) or 0)
    monkeypatch.setattr(hook, "_lint_web", lambda _r, rel: seen.append(("web", rel)) or 0)

    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT),
                "toolCall": {"args": {"Path": str(ROOT / "tools/dev_ledger.py")}},
            }
        )
        == 0
    )
    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT),
                "toolCall": {"args": {"Path": str(ROOT / "web/src/main.tsx")}},
            }
        )
        == 0
    )
    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT / "web"),
                "toolCall": {"args": {"Path": "src/connected-main.tsx"}},
            }
        )
        == 0
    )
    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT),
                "toolCall": {"args": {"TargetFile": str(ROOT / "tools/dev_ledger.py")}},
            }
        )
        == 0
    )
    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT),
                "toolCall": {"args": {"TargetFile": str(ROOT / "web/src/connected-main.tsx")}},
            }
        )
        == 0
    )
    assert (
        hook.handle_event(
            {
                "cwd": str(ROOT),
                "toolCall": {"args": {"Path": "/etc/passwd"}},
            }
        )
        == 0
    )
    assert seen == [
        ("py", str(ROOT.resolve())),
        ("web", "web/src/main.tsx"),
        ("web", "web/src/connected-main.tsx"),
        ("py", str(ROOT.resolve())),
        ("web", "web/src/connected-main.tsx"),
    ]


@pytest.mark.parametrize(
    "payload",
    [
        "{not json",
        "[]",
        {"cwd": "/nonexistent_dir_xyz", "toolCall": {"args": {"Path": "tools/dev_ledger.py"}}},
        {"cwd": "", "toolCall": {"args": {"Path": "tools/dev_ledger.py"}}},
        {"toolCall": {"args": {"Path": "tools/dev_ledger.py"}}},
        {"cwd": 123, "toolCall": {"args": {"Path": "tools/dev_ledger.py"}}},
        {"cwd": str(ROOT)},
        {"cwd": str(ROOT), "toolCall": {"args": "not-a-dict"}},
        {"cwd": str(ROOT), "toolCall": {"args": {}}},
        {"cwd": str(ROOT), "toolCall": {"args": {"Path": "../outside.py"}}},
    ],
)
def test_hook_fails_closed_on_malformed_or_missing_inputs(payload: str | dict[str, Any]) -> None:
    res = _run_hook(payload)
    assert res.returncode == 2
    assert res.stdout == "{}\n"
    assert "lint-edited:" in res.stderr


def test_hook_fails_closed_when_uv_or_git_or_eslint_oserror(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env = {**os.environ, "PATH": "/usr/bin:/bin"}
    res = _run_hook(
        {
            "cwd": str(ROOT),
            "toolCall": {"args": {"Path": str(ROOT / "tools/dev_ledger.py")}},
        },
        env=env,
    )
    assert res.returncode == 2
    assert res.stdout == "{}\n"
    assert "lint-edited:" in res.stderr

    hook = _load_hook()

    def _boom(*_args: Any, **_kwargs: Any) -> Any:
        raise OSError("synthetic spawn failure")

    monkeypatch.setattr(hook.subprocess, "run", _boom)
    assert hook._lint_python(ROOT) == 2
    assert hook._lint_web(ROOT, "web/src/main.tsx") == 2


def test_hook_ignores_eslint_ignored_web_file() -> None:
    res = _run_hook(
        {
            "cwd": str(ROOT),
            "toolCall": {"args": {"Path": str(ROOT / "web/public/data.js")}},
        }
    )
    assert res.returncode == 0
    assert res.stdout == "{}\n"


def test_hook_rejects_symlink_inside_repo_and_handles_symlinked_worktree_prefix(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    real_repo = _init_mini_repo(tmp_path / "real_repo")
    target = real_repo / "mod.py"
    target.write_text("x = 1\n", encoding="utf-8")
    sym = real_repo / "sym.py"
    sym.symlink_to(target)

    res = _run_hook({"cwd": str(real_repo), "toolCall": {"args": {"Path": str(sym)}}})
    assert res.returncode == 2
    assert res.stdout == "{}\n"
    assert "lint-edited:" in res.stderr

    link_prefix = tmp_path / "wt_alias"
    link_prefix.symlink_to(real_repo)
    hook = _load_hook()
    seen: list[str] = []
    monkeypatch.setattr(hook, "_lint_python", lambda root: seen.append(str(root)) or 0)
    assert (
        hook.handle_event(
            {
                "cwd": str(link_prefix),
                "toolCall": {"args": {"Path": str(link_prefix / "mod.py")}},
            }
        )
        == 0
    )
    assert seen == [str(real_repo.resolve())]
