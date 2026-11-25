"""Shared setup for the tests under tests/.

``no_live_copilot_adapter`` (autouse) keeps every test module that imports the Signal package
(``deploy_workflow.signal``) from reaching a provider (the run start tests in
``test_react_frontend.py`` build the adapter on purpose over a stand-in SDK module and are not
covered). For such a test it wraps ``CopilotAdapter.__init__``: building the live adapter without a
fake client (``client_factory`` left out, or the SDK's own ``real_client``) is recorded in
``LIVE_ATTEMPTS`` and fails at once with ``pytest.fail``. That raises ``Failed``, a
``BaseException``, so no ``except Exception`` in the service or its loop can swallow it, and the
adapter is never built, so nothing can start the Copilot runtime or send a request. Because an
attempt made on another thread (the service's loop, a server's handler) only ends that thread, the
fixture also fails the test at its teardown whenever ``LIVE_ATTEMPTS`` is not empty, whichever
thread made the attempt. A test that drives the real adapter class passes the adapter test rig's
``FakeClient`` through ``client_factory`` (``tests/test_signal_ai_adapter.py``). Test modules that
import neither (the analytical modules' live tests) are not touched.
"""

from __future__ import annotations

import ast
import threading
from functools import cache
from pathlib import Path
from typing import Any

import pytest

GUARDED = ("deploy_workflow.signal",)
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


@pytest.fixture
def live_adapter_attempts() -> list[tuple[str, str]]:
    """The guard's record, for a test that provokes the guard on purpose and then empties it."""
    return LIVE_ATTEMPTS


@pytest.fixture(autouse=True)
def no_live_copilot_adapter(request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch) -> Any:
    path = Path(str(request.node.path))
    if not (path.name.startswith("test_signal") or imports_guarded(path)):
        yield
        return
    from deploy_workflow.model import copilot_adapter

    built = copilot_adapter.CopilotAdapter.__init__
    LIVE_ATTEMPTS.clear()

    def guarded(self: Any, *args: Any, **kwargs: Any) -> None:
        factory = kwargs.get("client_factory")
        if factory is None or factory is copilot_adapter.real_client:
            LIVE_ATTEMPTS.append((request.node.nodeid, threading.current_thread().name))
            pytest.fail("a Signal test built the live Copilot adapter without a fake client")
        built(self, *args, **kwargs)

    monkeypatch.setattr(copilot_adapter.CopilotAdapter, "__init__", guarded)
    yield
    attempts, LIVE_ATTEMPTS[:] = list(LIVE_ATTEMPTS), []
    if attempts:
        threads = ", ".join(sorted({name for _, name in attempts}))
        pytest.fail(
            f"the live Copilot adapter was built without a fake client {len(attempts)} time(s),"
            f" on thread(s) {threads}"
        )
