"""Signal as a reader reaches it, for the tests of its API: the application's own server.

There is one process and one port (``react_frontend``): ``Live`` starts that server in live mode
on a loopback port, with an empty launching environment, and talks to Signal's routes through it
under ``/signal``. Its Signal loop is over the store the test seeded; no thread runs the loop, so
nothing is fetched unless the test calls ``run_once`` on a loop whose fetch it replaced.
"""

from __future__ import annotations

import http.client
import json
import os
import threading
from contextlib import ExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from deploy_workflow.signal.service import Loop
from react_frontend import make_server, signal_host

PREFIX = "/signal"  # where the application serves Signal's own paths (/api/...)
SAME = object()  # "the page's own origin", the default for a request that is not a GET
PAGE = (
    '<html><head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'">'
    "</head><body></body></html>"
)


class Live:
    """The application on a thread, hosting Signal over the store under `root`, and the helper
    that talks to it. `loop` is the test's own loop over that store; left out, the one the
    application builds for it. The application's own folders (its run store, a one-page build)
    are in a short temporary folder: the store's folder holds Signal's files only."""

    def __init__(self, root: Path, *, loop: Loop | None = None) -> None:
        with ExitStack() as opening:
            folder = Path(opening.enter_context(_short_folder()))
            (folder / "web").mkdir()
            (folder / "web" / "index.html").write_text(PAGE, encoding="utf-8")
            self.server = opening.enter_context(
                make_server(folder / "app", web=folder / "web", environ={})
            )
            self._open = opening.pop_all()  # held until close(); undone here if a step failed
        host = self.server.signal
        assert host is not None  # live mode hosts Signal
        host.loop = loop or signal_host.SignalHost(root, environ={}).loop
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(
            target=self.server.serve_forever, kwargs={"poll_interval": 0.02}, daemon=True
        )
        self.thread.start()

    def close(self) -> None:
        self.server.shutdown()
        self.thread.join(timeout=10)
        self._open.close()

    def call(self, method: str, path: str, **request: Any) -> tuple[int, Any, Any]:
        """`path` is Signal's own (``/api/...``), asked for under ``/signal``. Keywords: body
        (JSON object), raw (bytes), origin (default: the page's own; None for none; ``{port}``
        is filled in), cookie, host, headers."""
        sent = {"Host": request.get("host") or f"127.0.0.1:{self.port}"}
        origin = request.get("origin", SAME)
        if origin is SAME:
            origin = f"http://127.0.0.1:{self.port}"
        if origin is not None and method != "GET":
            sent["Origin"] = str(origin).replace("{port}", str(self.port))
        if request.get("cookie"):
            sent["Cookie"] = request["cookie"]
        sent.update(request.get("headers") or {})
        body, raw = request.get("body"), request.get("raw")
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=20)
        try:
            connection.request(method, PREFIX + path, body=data, headers=sent)
            response = connection.getresponse()
            text = response.read().decode("utf-8", errors="replace")
            kind = response.getheader("Content-Type") or ""
            return response.status, response.headers, json.loads(text) if "json" in kind else text
        finally:
            connection.close()


def _short_folder() -> TemporaryDirectory[str]:
    """A temporary folder whose path the run store accepts (it refuses a long root)."""
    return TemporaryDirectory(dir=None if os.name == "nt" else "/tmp")
