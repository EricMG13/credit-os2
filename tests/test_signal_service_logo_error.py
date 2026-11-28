"""A failing logos job shows in /api/status as the loop's error."""

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, cast

from test_signal_feedview import build_feed_db

from deploy_workflow.signal import ai_gate, service
from deploy_workflow.signal.routing import Incoming


class _Off:
    state = "off"
    last_problem = None


class _LogoFailingLoop:
    last_error: str | None = None
    logo_error: str | None = "the logos job failed"
    ai_error: str | None = None
    digest_error: str | None = None
    market_error: str | None = None

    def ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status:
        raise AssertionError("/api/status shows the held status")

    def shown_ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status:
        return cast(ai_gate.Status, _Off())


def test_a_logos_job_failure_is_the_status_loop_error(tmp_path: Path) -> None:
    build_feed_db(tmp_path).close()

    def no_body() -> dict[str, Any]:
        return {}

    request = Incoming("GET", "/api/status", "", None, body=no_body, optional_body=no_body)
    reply = service.answer(tmp_path, _LogoFailingLoop(), request)
    assert reply.status == 200
    assert reply.body["loop_error"] == "the logos job failed"
