"""Signal receives the account already authenticated by the application request gate."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from pathlib import Path

import pytest
from signal_app import Live

from deploy_workflow.accounts import sessions, store

PROTECTED_PAIRS = (
    ("GET", "/feed"),
    ("GET", "/feed/new"),
    ("GET", "/topics"),
    ("GET", "/logos/1"),
    ("POST", "/stories/1/save"),
    ("POST", "/topics/1/follow"),
    ("DELETE", "/stories/1/save"),
    ("DELETE", "/topics/1/follow"),
    ("POST", "/groups"),
    ("POST", "/groups/1/rename"),
    ("POST", "/groups/1/visibility"),
    ("POST", "/groups/1/members"),
    ("POST", "/groups/1/members/remove"),
    ("POST", "/groups/1/topics"),
    ("POST", "/groups/1/threads"),
    ("POST", "/groups/1/rules"),
    ("DELETE", "/groups/1"),
    ("POST", "/threads/1/comments"),
    ("POST", "/threads/1/read"),
    ("POST", "/comments/1/replies"),
    ("POST", "/comments/1/edit"),
    ("POST", "/comments/1/reactions/agree"),
    ("POST", "/notifications"),
    ("DELETE", "/comments/1"),
    ("DELETE", "/comments/1/reactions/agree"),
    ("POST", "/topics"),
    ("POST", "/topics/1/edit"),
    ("POST", "/sources"),
    ("POST", "/digests"),
    ("POST", "/digests/1/edit"),
    ("POST", "/digests/1/run"),
    ("POST", "/digests/1/read"),
    ("POST", "/digests/1/issues/1/read"),
    ("DELETE", "/topics/1"),
    ("DELETE", "/digests/1"),
    ("POST", "/issuers"),
    ("POST", "/issuers/1/edit"),
    ("POST", "/issuers/1/follow"),
    ("DELETE", "/issuers/1"),
    ("DELETE", "/issuers/1/follow"),
)


@pytest.mark.parametrize(
    ("profile_type", "display_name", "expected_role"),
    [
        ("reader", "Test Reader", "reader"),
        ("analyst", "Test Analyst", "writer"),
        ("admin", "Test Admin", "owner"),
    ],
)
def test_signal_me_uses_the_gated_real_account(
    tmp_path: Path,
    profile_type: str,
    display_name: str,
    expected_role: str,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.DEBUG)
    with Live(tmp_path / "signal", signed_in=True) as live:
        account, token = live.create_account_session(display_name, profile_type)
        assert account.profile_type == profile_type
        status, _, body = live.call(
            "GET",
            "/api/me",
            cookie=f"credit_os_session={token}; signal_name=Forged%20Name",
        )
        assert (status, body) == (
            200,
            {"name": display_name, "role": expected_role},
        )
        status, headers, body = live.call(
            "POST",
            "/api/me",
            cookie=f"credit_os_session={token}",
            body={"name": "Forged Name"},
        )
        assert (status, body) == (405, {"error": "method not allowed"})
        assert headers.get("Allow") == "GET"
        assert "Set-Cookie" not in headers
        assert '"GET /signal/api/me"' in caplog.text
        assert token not in caplog.text


def test_disabled_account_and_absent_session_carry_no_signal_identity(tmp_path: Path) -> None:
    accounts_dir = tmp_path / "private-accounts"
    with Live(tmp_path / "signal", accounts_dir=accounts_dir) as live:
        account, token = live.create_account_session("Disabled Reader", "reader")
        db = store.open_db(accounts_dir)
        try:
            store.disable_account(db, account.id)
        finally:
            db.close()
        db = store.open_db(accounts_dir)
        try:
            assert sessions.session_account(db, token, now=datetime.now(UTC)) is None
        finally:
            db.close()
        for cookie in (None, f"credit_os_session={token}"):
            status, _, body = live.call("GET", "/api/me", cookie=cookie)
            assert (status, body) == (401, {"error": "sign in first"})


def test_sign_in_off_ignores_legacy_typed_name_for_identity_and_protected_routes(
    tmp_path: Path,
) -> None:
    with Live(tmp_path / "signal") as live:
        status, _, body = live.call("GET", "/api/me", cookie="signal_name=Test%20Reader")
        assert (status, body) == (200, {"name": None})
        status, _, body = live.call("GET", "/api/topics", cookie="signal_name=Test%20Reader")
        assert (status, body) == (401, {"error": "sign in first"})

        status, _, _ = live.call("GET", "/api/status")
        assert status == 200
        status, _, _ = live.call("GET", "/api/snapshot")
        assert status == 200


def test_every_previously_named_method_path_refuses_when_sign_in_is_off(tmp_path: Path) -> None:
    assert len(PROTECTED_PAIRS) == 40
    with Live(tmp_path / "signal") as live:
        for method, path in PROTECTED_PAIRS:
            request: dict[str, object] = {"cookie": "signal_name=Test%20Reader"}
            if method == "POST":
                request["body"] = {}
            status, _, body = live.call(method, f"/api{path}", **request)
            assert (status, body) == (401, {"error": "sign in first"}), (method, path)

        status, headers, body = live.call(
            "POST", "/api/me", cookie="signal_name=Test%20Reader", body={"name": "Forged"}
        )
        assert (status, body) == (405, {"error": "method not allowed"})
        assert headers.get("Allow") == "GET"
        assert "Set-Cookie" not in headers
