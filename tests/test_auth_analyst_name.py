"""Admin analyst-name overrides through the configured, loopback-only application."""

from __future__ import annotations

import json
import logging
import shutil
import tempfile
import threading
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest
from auth_provider import TENANT_ID
from test_auth_routes import (
    ADMIN_PASSCODE,
    ANALYST_PASSCODE,
    Browser,
    _assert_no_auth_material,
    _begin_flow,
    _callback_request,
    _session_token,
)

from deploy_workflow.accounts import sessions, store
from react_frontend import make_server
from react_frontend.auth_gate import COOKIE
from react_frontend.auth_routes import AuthRoutes

pytest_plugins = ("test_auth_routes",)
NOW = datetime.now(UTC)


@pytest.fixture
def signed_app(app):
    browser, provider, accounts_dir, _, _, attempts = app
    return browser, provider, accounts_dir, attempts


def create_account(
    accounts_dir: Path,
    name: str,
    profile_type: str,
    *,
    given_name: str | None = None,
    family_name: str | None = None,
) -> tuple[store.Account, str]:
    db = store.open_db(accounts_dir)
    try:
        account = store.register_reader(
            db,
            tenant_id=TENANT_ID,
            object_id=str(uuid4()),
            name=name,
            email=f"{uuid4().hex}@example.org",
            given_name=given_name,
            family_name=family_name,
            now=datetime.now(UTC),
        )
        if profile_type != "reader":
            store.set_profile_type(db, account.id, profile_type)
            account = store.account_by_id(db, account.id)
            assert account is not None
        token = sessions.mint_session(db, account.id, now=datetime.now(UTC))
        return account, token
    finally:
        db.close()


def test_real_loopback_admin_override_and_credential_log_proof(
    signed_app, caplog: pytest.LogCaptureFixture
) -> None:
    browser, provider, accounts_dir, attempts = signed_app
    caplog.set_level(logging.DEBUG)
    flow_cookie, callback, _ = _begin_flow(browser, provider)
    status, _, headers = _callback_request(browser, flow_cookie, callback)
    assert status == 303
    session = _session_token(headers)
    status, _, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=f"{COOKIE}={session}",
        body=json.dumps({"passcode": ADMIN_PASSCODE}).encode(),
    )
    assert status == 200
    target, _ = create_account(
        accounts_dir,
        "Eric Green (example)",
        "reader",
        given_name="Eric",
        family_name="Green",
    )
    db = store.open_db(accounts_dir)
    try:
        assert store.effective_analyst_name(target) == "Eric G"
    finally:
        db.close()

    status, _, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/analyst-name",
        cookie=f"{COOKIE}={session}",
        body=b'{"analyst_name":"Eric MG"}',
    )
    assert status == 200
    db = store.open_db(accounts_dir)
    try:
        updated = store.account_by_id(db, target.id)
        assert updated is not None
        assert updated.analyst_name_override == "Eric MG"
        assert store.effective_analyst_name(updated) == "Eric MG"
        assert (updated.display_name, updated.email, updated.given_name, updated.family_name) == (
            "Eric Green (example)",
            target.email,
            "Eric",
            "Green",
        )
    finally:
        db.close()
    status, body, _ = browser.request("GET", "/auth/accounts", cookie=f"{COOKIE}={session}")
    assert status == 200
    rows = json.loads(body)["accounts"]
    target_row = next(row for row in rows if row["id"] == target.id)
    assert set(target_row) == {
        "id",
        "display_name",
        "profile_type",
        "disabled",
        "signed_in_at",
    }
    assert attempts == []
    _assert_no_auth_material(
        caplog,
        provider,
        accounts_dir,
        (ADMIN_PASSCODE, ANALYST_PASSCODE, session),
    )


def test_name_override_refusals_leave_store_unchanged(signed_app) -> None:
    browser, _, accounts_dir, _ = signed_app
    admin, admin_token = create_account(accounts_dir, "Trusted Admin", "admin")
    _, reader_token = create_account(accounts_dir, "Read Only", "reader")
    _, analyst_token = create_account(accounts_dir, "Analyst Actor", "analyst")
    disabled, disabled_token = create_account(accounts_dir, "Disabled Actor", "admin")
    db = store.open_db(accounts_dir)
    try:
        store.disable_account(db, disabled.id)
    finally:
        db.close()
    target, _ = create_account(
        accounts_dir,
        "Target Person",
        "reader",
        given_name="Target",
        family_name="Person",
    )
    endpoint = f"/auth/accounts/{target.id}/analyst-name"

    status, body, _ = browser.request("POST", endpoint, body=b'{"analyst_name":"Eric MG"}')
    assert (status, json.loads(body)) == (401, {"error": "sign in first"})
    status, body, _ = browser.request(
        "POST",
        endpoint,
        cookie=f"{COOKIE}={disabled_token}",
        body=b'{"analyst_name":"Eric MG"}',
    )
    assert (status, json.loads(body)) == (401, {"error": "sign in first"})
    for token in (reader_token, analyst_token):
        status, body, _ = browser.request(
            "POST",
            endpoint,
            cookie=f"{COOKIE}={token}",
            body=b'{"analyst_name":"Eric MG"}',
        )
        assert (status, json.loads(body)) == (403, {"error": "only an Admin can do this"})
    for body in (
        b"{",
        b'{"analyst_name":"not-a-first-name"}',
        b'{"analyst_name":"' + b"x" * 81 + b' G"}',
        b'{"analyst_name":"Eric MG","extra":"ignored"}',
    ):
        status, response, _ = browser.request(
            "POST", endpoint, cookie=f"{COOKIE}={admin_token}", body=body
        )
        assert (status, json.loads(response)) == (400, {"error": "invalid analyst name"})

    status, body, _ = browser.request(
        "POST",
        "/auth/accounts/999999999999999999/analyst-name",
        cookie=f"{COOKIE}={admin_token}",
        body=b'{"analyst_name":"Eric MG"}',
    )
    assert (status, json.loads(body)) == (404, {"error": "account not found"})
    for method, path in (
        ("GET", endpoint),
        ("POST", endpoint + "/"),
        ("POST", f"/auth/accounts/{target.id}/analyst-name/extra"),
        ("POST", "/auth/accounts/0/analyst-name"),
        ("POST", f"/auth/accounts/{'9' * 19}/analyst-name"),
    ):
        status, _, _ = browser.request(
            method,
            path,
            cookie=f"{COOKIE}={admin_token}",
            body=b"" if method == "POST" else None,
        )
        assert status == 404, (method, path)

    db = store.open_db(accounts_dir)
    try:
        persisted = store.account_by_id(db, target.id)
        assert persisted is not None and persisted.analyst_name_override is None
        assert store.account_by_id(db, admin.id) is not None
    finally:
        db.close()


def test_override_rechecks_admin_after_gate_before_write(
    signed_app, monkeypatch: pytest.MonkeyPatch
) -> None:
    browser, _, accounts_dir, _ = signed_app
    admin, token = create_account(accounts_dir, "Demoted Actor", "admin")
    target, _ = create_account(
        accounts_dir,
        "Unchanged Target",
        "reader",
        given_name="Una",
        family_name="Changed",
    )
    original_post = AuthRoutes.post

    def demote_after_gate(self, handler, url, account):
        if url.path == f"/auth/accounts/{target.id}/analyst-name":
            db = store.open_db(accounts_dir)
            try:
                store.set_profile_type(db, admin.id, "reader")
            finally:
                db.close()
        return original_post(self, handler, url, account)

    monkeypatch.setattr(AuthRoutes, "post", demote_after_gate)
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/analyst-name",
        cookie=f"{COOKIE}={token}",
        body=b'{"analyst_name":"Una C"}',
    )
    assert (status, json.loads(body)) == (403, {"error": "only an Admin can do this"})
    db = store.open_db(accounts_dir)
    try:
        persisted_actor = store.account_by_id(db, admin.id)
        persisted_target = store.account_by_id(db, target.id)
        assert persisted_actor is not None and persisted_actor.profile_type == "reader"
        assert persisted_target is not None and persisted_target.analyst_name_override is None
    finally:
        db.close()


def test_name_override_route_is_absent_when_sign_in_is_off(tmp_path: Path) -> None:
    root = Path(tempfile.mkdtemp(prefix="s6off-", dir="/tmp"))
    web = tmp_path / "off-web"
    web.mkdir()
    (web / "index.html").write_text(
        "<!doctype html><html><head><meta content=\"connect-src 'none'\"></head>"
        "<body>offline</body></html>",
        encoding="utf-8",
    )
    try:
        with make_server(root, web=web, synthetic=True, launcher=("name-test",)) as server:
            thread = threading.Thread(target=server.serve_forever)
            thread.start()
            browser = Browser(server.server_address[1])
            try:
                assert server.auth_config is None
                assert (
                    browser.request(
                        "POST", "/auth/accounts/1/analyst-name", body=b'{"analyst_name":"Eric MG"}'
                    )[0]
                    == 404
                )
            finally:
                server.shutdown()
                thread.join()
    finally:
        shutil.rmtree(root)
