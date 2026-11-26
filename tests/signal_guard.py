"""The state the test guards in ``tests/conftest.py`` share with the tests that check them.

It lives here, not in ``conftest.py``: ``tests/model/conftest.py`` is also a module named
``conftest``, so ``import conftest`` reaches whichever of the two was imported first in a
whole-suite run. Import this module as ``signal_guard``.
"""

from __future__ import annotations

import ast
from functools import cache
from pathlib import Path

GUARDED = ("deploy_workflow.signal",)
_LOOPBACK = frozenset({"127.0.0.1", "::1", "localhost", "0.0.0.0", "::", "", None})
# Every attempt to reach the network from a guarded test: (test id, thread name, what).
NETWORK_ATTEMPTS: list[tuple[str, str, str]] = []
# Every attempt to build the live adapter without a fake client: (test id, thread name).
LIVE_ATTEMPTS: list[tuple[str, str]] = []


def _guarded_name(name: str | None) -> bool:
    return name is not None and any(name == p or name.startswith(p + ".") for p in GUARDED)


@cache
def imports_guarded(path: Path) -> bool:
    """Whether the test module at `path` imports the Signal package anywhere
    (at module level or inside a function)."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, SyntaxError, ValueError):
        return True  # unreadable: guard it rather than not
    for node in ast.walk(tree):
        if isinstance(node, ast.Import) and any(_guarded_name(a.name) for a in node.names):
            return True
        if isinstance(node, ast.ImportFrom) and node.level == 0:
            if _guarded_name(node.module):
                return True
            if node.module == "deploy_workflow" and any(a.name == "signal" for a in node.names):
                return True
    return False
