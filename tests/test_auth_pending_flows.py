"""Offline contract tests for one-use Entra authorization flows."""

from __future__ import annotations

import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from deploy_workflow.accounts.pending_flows import PendingFlows


def _flow(state: str, verifier: str = "real-pkce-verifier") -> dict[str, str]:
    return {"state": state, "code_verifier": verifier, "auth_uri": "http://127.0.0.1/authorize"}


def test_cookie_key_is_opaque_and_does_not_expose_flow_values() -> None:
    now = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
    flows = PendingFlows()
    flow = _flow("oauth-state-secret", "pkce-verifier-secret")

    key = flows.start(flow, now=now)

    assert key is not None
    assert key not in {flow["state"], flow["code_verifier"], flow["auth_uri"]}
    assert "credit_os_session" not in key


def test_active_capacity_refuses_101st_without_overwriting_and_reclaims_expired() -> None:
    now = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
    flows = PendingFlows()
    keys = [flows.start(_flow(f"state-{i}"), now=now) for i in range(100)]

    assert all(key is not None for key in keys)
    first_key = keys[0]
    assert first_key is not None
    assert flows.start(_flow("state-over-capacity"), now=now) is None
    assert flows.start(_flow("state-after-expiry"), now=now + timedelta(minutes=10)) is not None
    assert flows.take(first_key, "state-0", now=now + timedelta(minutes=10)) is None


def test_flow_is_valid_through_959_and_expired_at_1000() -> None:
    issued = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
    flows = PendingFlows()
    key = flows.start(_flow("expiry-state"), now=issued)
    assert key is not None

    assert (
        flows.take(key, "expiry-state", now=issued + timedelta(minutes=9, seconds=59)) is not None
    )
    assert flows.take(key, "expiry-state", now=issued + timedelta(minutes=10)) is None


def test_zero_offset_dst_fold_uses_elapsed_utc_lifetime() -> None:
    london = ZoneInfo("Europe/London")
    issued = datetime(2026, 10, 25, 1, 15, tzinfo=london, fold=1)
    flows = PendingFlows()
    valid_key = flows.start(_flow("fold-valid-state"), now=issued)
    expired_key = flows.start(_flow("fold-expired-state"), now=issued)
    assert valid_key is not None
    assert expired_key is not None

    assert (
        flows.take(
            valid_key,
            "fold-valid-state",
            now=datetime(2026, 10, 25, 1, 24, 59, tzinfo=UTC),
        )
        is not None
    )
    assert (
        flows.take(
            expired_key,
            "fold-expired-state",
            now=datetime(2026, 10, 25, 1, 25, tzinfo=UTC),
        )
        is None
    )


def test_unknown_wrong_state_expired_and_replayed_flows_are_refused() -> None:
    now = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
    flows = PendingFlows()
    key = flows.start(_flow("expected-state"), now=now)
    assert key is not None

    assert flows.take("unknown-cookie-key", "expected-state", now=now) is None
    assert flows.take(key, "wrong-state", now=now) is None
    assert flows.take(key, "wrong-state-☃", now=now) is None
    assert flows.take(key, "expected-state", now=now) == _flow("expected-state")
    assert flows.take(key, "expected-state", now=now) is None

    expired_key = flows.start(_flow("expired-state"), now=now)
    assert expired_key is not None
    assert flows.take(expired_key, "expired-state", now=now + timedelta(minutes=10)) is None


def test_two_synchronized_takers_have_exactly_one_winner() -> None:
    now = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
    flows = PendingFlows()
    key = flows.start(_flow("racing-state"), now=now)
    assert key is not None
    barrier = threading.Barrier(2)

    def take() -> dict[str, str] | None:
        barrier.wait()
        return flows.take(key, "racing-state", now=now)

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(lambda _: take(), range(2)))

    assert sum(outcome is not None for outcome in outcomes) == 1
    assert sum(outcome is None for outcome in outcomes) == 1


def test_pending_flow_operations_do_not_log_secrets(
    caplog: pytest.LogCaptureFixture,
) -> None:
    # A named safe event is the positive control that the log capture is active.
    logger = logging.getLogger("tests.auth.pending_flows")
    now = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
    flows = PendingFlows()
    state, verifier = "oauth-state-never-log", "pkce-verifier-never-log"

    with caplog.at_level(logging.DEBUG):
        key = flows.start(_flow(state, verifier), now=now)
        assert key is not None
        assert flows.take(key, state, now=now) is not None
        logger.info("pending flow consumed")

    assert "pending flow consumed" in caplog.text
    assert state not in caplog.text
    assert verifier not in caplog.text
    assert key not in caplog.text
