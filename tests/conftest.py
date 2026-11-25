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

``no_real_network`` (autouse, the same modules) keeps them off the network the same way: the real
legs of ``fetch.fetch`` (its system lookup ``fetch._resolve`` and the pinned connection's
``webfetch.PinnedHTTPSConnection.connect``), any ``socket.getaddrinfo`` of a name that is not the
loopback or wildcard address, and any socket connection to an address that is not the loopback one
are each recorded in ``NETWORK_ATTEMPTS`` and fail the test at once with ``pytest.fail`` (a test
that replaces ``fetch.fetch``'s resolver or connector, or the fetch function itself, never reaches
them); an attempt on another thread fails the test at its teardown. A test may still replace
``fetch._resolve`` with its own answer (``monkeypatch.setattr`` after this fixture).
"""

from __future__ import annotations

import ast
import threading
from functools import cache
from pathlib import Path
from typing import Any

import pytest

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


def _guarded_test(request: pytest.FixtureRequest) -> bool:
    path = Path(str(request.node.path))
    return path.name.startswith("test_signal") or imports_guarded(path)


@pytest.fixture(autouse=True)
def no_real_network(request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch) -> Any:
    if not _guarded_test(request):
        yield
        return
    import socket

    from deploy_workflow.research import webfetch
    from deploy_workflow.signal import fetch

    NETWORK_ATTEMPTS.clear()
    real_lookup, real_connect = socket.getaddrinfo, socket.socket.connect

    def attempt(what: str) -> None:
        NETWORK_ATTEMPTS.append((request.node.nodeid, threading.current_thread().name, what))
        pytest.fail(f"a Signal test reached the network: {what}")

    def lookup(host: Any, *args: Any, **kwargs: Any) -> Any:
        if host not in _LOOPBACK:
            attempt(f"a lookup of {host!r}")
        return real_lookup(host, *args, **kwargs)

    def connect(self: socket.socket, address: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(address, tuple) and address[0] not in _LOOPBACK:
            attempt(f"a connection to {address[0]!r}")
        return real_connect(self, address, *args, **kwargs)

    monkeypatch.setattr(fetch, "_resolve", lambda host: attempt(f"fetch's lookup of {host!r}"))
    monkeypatch.setattr(
        webfetch.PinnedHTTPSConnection,
        "connect",
        lambda self: attempt(f"fetch's pinned connection to {self.host!r}"),
    )
    monkeypatch.setattr(socket, "getaddrinfo", lookup)
    monkeypatch.setattr(socket.socket, "connect", connect)
    yield
    attempts, NETWORK_ATTEMPTS[:] = list(NETWORK_ATTEMPTS), []
    if attempts:
        pytest.fail(f"a Signal test reached the network {len(attempts)} time(s): {attempts[:3]}")
