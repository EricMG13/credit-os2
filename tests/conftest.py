"""Shared setup for the tests under tests/.

``no_live_copilot_adapter`` (autouse, Signal tests only: modules named ``test_signal*``) keeps any
Signal test from reaching a provider. It wraps ``CopilotAdapter.__init__`` for the test: building
the live adapter without a fake client (``client_factory`` left out, or the SDK's own
``real_client``) fails the test at once with ``pytest.fail``. That raises ``Failed``, a
``BaseException``, so no ``except Exception`` in the service or its loop can swallow it, and the
adapter is never built, so nothing can start the Copilot runtime or send a request. A Signal test
that drives the real adapter class passes the adapter test rig's ``FakeClient`` through
``client_factory`` (``tests/test_signal_ai_adapter.py``). Tests outside Signal (the analytical
modules' live tests) are not touched.
"""

from __future__ import annotations

from typing import Any

import pytest


@pytest.fixture(autouse=True)
def no_live_copilot_adapter(
    request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch
) -> None:
    if not request.node.path.name.startswith("test_signal"):
        return
    from deploy_workflow.model import copilot_adapter

    built = copilot_adapter.CopilotAdapter.__init__

    def guarded(self: Any, *args: Any, **kwargs: Any) -> None:
        factory = kwargs.get("client_factory")
        if factory is None or factory is copilot_adapter.real_client:
            pytest.fail("a Signal test built the live Copilot adapter without a fake client")
        built(self, *args, **kwargs)

    monkeypatch.setattr(copilot_adapter.CopilotAdapter, "__init__", guarded)
