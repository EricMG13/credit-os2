"""Check a Signal snapshot against the real React reader (``web/src/pages/signal/slice.ts``).

``react_refusal`` bundles the reader with the web folder's esbuild once per test session, then runs
``readSlice`` over the snapshot in node. It returns None when the reader accepts the snapshot and
its reason otherwise (a snapshot the reader refuses blanks the whole screen). Every Signal test
that needs the reader uses this module.

Without node or the web folder's dependencies (``npm --prefix web ci`` not run: a developer's
checkout, a fresh worktree) only the reader part of a test is skipped: ``react_refusal`` answers
None, the test's own assertions run and decide, and the ``reader_part`` fixture (autouse in every
module that imports it) then reports the test as skipped with the reason, so nobody mistakes it for
a checked snapshot. A test that needs the reader itself (one that asserts a refusal) calls
``bundle()`` first, which skips it whole. Under ``CI=true`` (GitHub Actions sets it) a missing
reader fails instead, so a runner that never installed the web dependencies cannot pass without
the check.

esbuild is not one of the web folder's own dependencies: it is installed as vite's (vite 6 builds
with it), so ``npm --prefix web ci`` puts it at ``web/node_modules/.bin/esbuild``. When the web
dependencies are installed and esbuild is not there (a vite that no longer brings it), the check
fails with a sentence saying so rather than skipping.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest

WEB = Path(__file__).resolve().parents[1] / "web"
NODE_MODULES = WEB / "node_modules"
ESBUILD = NODE_MODULES / ".bin/esbuild"  # vite's dependency, not web's own (see above)
SLICE = WEB / "src/pages/signal/slice.ts"
_RUNNER = """
import { readFileSync } from "node:fs";
import { readSlice } from "./slice.mjs";
const result = readSlice(JSON.parse(readFileSync(process.argv[2], "utf8")));
console.log(JSON.stringify(result.kind === "ok" ? { kind: "ok" } : result));
"""
NO_READER = "node or the web folder's dependencies are not installed (run `npm --prefix web ci`)"
NO_ESBUILD = (
    "web/node_modules holds no esbuild: it came in as vite's dependency and this vite no longer"
    " brings it; add esbuild to web/package.json's devDependencies"
)
_built: list[Path] = []
_armed: list[bool] = []  # a test running under ``reader_part``
_unchecked: list[str] = []  # why the running test's reader checks did not run


def missing() -> str | None:
    """Why the reader cannot run here (None: it can); fails when esbuild alone is missing."""
    if shutil.which("node") is None or not NODE_MODULES.is_dir():
        return NO_READER
    if not ESBUILD.exists():
        pytest.fail(NO_ESBUILD, pytrace=False)
    return None


def _not_here(reason: str) -> None:
    if os.environ.get("CI") == "true":
        pytest.fail(reason, pytrace=False)
    pytest.skip(reason)


def bundle() -> Path:
    """The bundled reader; a test that cannot run without it is skipped (failed under CI)."""
    if _built:
        return _built[0]
    reason = missing()
    if reason is not None:
        _not_here(reason)
    folder = Path(tempfile.mkdtemp(prefix="signal-reader-"))
    subprocess.run(
        [str(ESBUILD), str(SLICE), "--bundle", "--format=esm", f"--outfile={folder}/slice.mjs"],
        check=True,
        capture_output=True,
    )
    (folder / "check.mjs").write_text(_RUNNER, encoding="utf-8")
    _built.append(folder)
    return folder


def react_refusal(document: dict[str, Any]) -> str | None:
    """None when the React reader accepts the snapshot document, else the reason it gives.

    Without the reader (not under CI) a test running under ``reader_part`` gets None and is
    reported skipped once its own assertions have run; any other is skipped here."""
    reason = None if _built else missing()
    if reason is not None:
        if os.environ.get("CI") == "true" or not _armed:
            _not_here(reason)
        _unchecked.append(reason)
        return None
    folder = bundle()
    source = folder / "snapshot.json"
    source.write_text(json.dumps(document), encoding="utf-8")
    done = subprocess.run(
        ["node", str(folder / "check.mjs"), str(source)],
        check=True,
        capture_output=True,
        text=True,
        cwd=folder,
    )
    result = json.loads(done.stdout)
    return None if result["kind"] == "ok" else str(result.get("reason", result["kind"]))


def unchecked() -> list[str]:
    """Why the running test's reader checks did not run (empty: each one ran)."""
    return list(_unchecked)


@pytest.fixture(autouse=True)
def reader_part() -> Iterator[None]:
    """Report a test whose reader checks could not run as skipped, after its own assertions."""
    _armed.append(True)
    try:
        yield
    finally:
        _armed.pop()
        skipped, _unchecked[:] = list(_unchecked), []
    if skipped:
        pytest.skip(f"the React reader check did not run: {skipped[0]}")
