"""Check a Signal snapshot against the real React reader (``web/src/pages/signal/slice.ts``).

``react_refusal`` bundles the reader with the web folder's esbuild once per test session, then runs
``readSlice`` over the snapshot in node. It returns None when the reader accepts the snapshot and
its reason otherwise (a snapshot the reader refuses blanks the whole screen). Without node or
esbuild the calling test is skipped on a developer's machine, where the reader is not available to
check against; under ``CI=true`` (GitHub Actions sets it) it fails instead, so a runner that never
installed the web dependencies cannot pass without the check. Every Signal test that needs the
reader uses this module's ``react_refusal``.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import pytest

WEB = Path(__file__).resolve().parents[1] / "web"
ESBUILD = WEB / "node_modules/.bin/esbuild"
SLICE = WEB / "src/pages/signal/slice.ts"
_RUNNER = """
import { readFileSync } from "node:fs";
import { readSlice } from "./slice.mjs";
const result = readSlice(JSON.parse(readFileSync(process.argv[2], "utf8")));
console.log(JSON.stringify(result.kind === "ok" ? { kind: "ok" } : result));
"""
_built: list[Path] = []


def bundle() -> Path:
    if _built:
        return _built[0]
    node = shutil.which("node")
    if node is None or not ESBUILD.exists():
        reason = "node or the web folder's esbuild is not available (run `npm --prefix web ci`)"
        if os.environ.get("CI") == "true":
            pytest.fail(reason, pytrace=False)
        pytest.skip(reason)
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
    """None when the React reader accepts the snapshot document, else the reason it gives."""
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
