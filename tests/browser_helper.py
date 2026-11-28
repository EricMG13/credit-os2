"""Shared headless Chrome helper for browser tests of standalone HTML artifacts and React pages."""

from __future__ import annotations

import re
import shutil
import subprocess  # nosec B404
from pathlib import Path

import pytest

CANDIDATES = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
)


def chrome() -> str:
    """Path to an installed Google Chrome or Chromium binary, or skip the browser test."""
    found = next((c for c in CANDIDATES if Path(c).is_file()), None)
    found = found or shutil.which("google-chrome") or shutil.which("chromium")
    if found is None:
        pytest.skip("Chrome or Chromium is not installed")
    return found


def visit(page: Path, route: str = "", width: int = 1280) -> tuple[str, list[str]]:
    """Open a local HTML file in headless Chrome and return its settled DOM and console lines."""
    done = subprocess.run(  # nosec B603
        [
            chrome(),
            "--headless=new",
            "--disable-gpu",
            f"--window-size={width},900",
            "--enable-logging=stderr",
            "--v=0",
            "--virtual-time-budget=10000",
            "--dump-dom",
            page.as_uri() + route,
        ],
        capture_output=True,
        text=True,
        timeout=120,
        check=True,
    )
    return done.stdout, re.findall(r"CONSOLE[^\n]*", done.stderr)
