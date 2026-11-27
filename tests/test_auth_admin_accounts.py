"""Real configured account directory and Admin mutation routes."""

from __future__ import annotations

import json
import logging
import shutil
import sqlite3
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from http.client import HTTPConnection
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

FIRST = datetime(2026, 11, 26, 9, tzinfo=UTC)
SECOND = datetime(2026, 11, 26, 10, tzinfo=UTC)
pytest_plugins = ("test_auth_routes",)


@pytest.fixture
def signed_app(app):
    browser, provider, accounts_dir, _, _, attempts = app
    return browser, provider, accounts_dir, attempts


def create_account(
    accounts_dir: Path,
    name: str,
    profile_type: str,
    *,
    at: datetime | None = None,
    mint: bool = True,
) -> tuple[store.Account, str]:
    created = at or datetime.now(UTC)
    db = store.open_db(accounts_dir)
    try:
        account = store.register_reader(
            db,
            tenant_id=TENANT_ID,
            object_id=str(uuid4()),
            name=name,
            email=f"{name.lower().replace(' ', '.')}@example.org",
            given_name=None,
            family_name=None,
            now=created,
        )
        if profile_type != "reader":
            store.set_profile_type(db, account.id, profile_type)
            account = store.account_by_id(db, account.id)
            assert account is not None
        token = sessions.mint_session(db, account.id, now=created) if mint else ""
        return account, token
    finally:
        db.close()


def test_accounts_directory_safe_projection_and_read_only_latest_sign_in(signed_app) -> None:
    browser, _, accounts_dir, attempts = signed_app
    first, first_token = create_account(accounts_dir, "Test Admin", "admin")
    second, second_token = create_account(accounts_dir, "Test Analyst", "analyst")
    target, target_token = create_account(accounts_dir, "Test Reader", "reader")
    no_session, _ = create_account(accounts_dir, "Never Signed In", "reader", mint=False)
    db = store.open_db(accounts_dir)
    try:
        newer = sessions.mint_session(db, second.id, now=datetime.now(UTC))
        db.execute(
            "UPDATE sessions SET created_at=? WHERE account_id=?", (FIRST.isoformat(), first.id)
        )
        db.execute(
            "UPDATE sessions SET created_at=? WHERE account_id=? AND token_hash != ("
            "SELECT token_hash FROM sessions WHERE account_id=? ORDER BY created_at DESC LIMIT 1)",
            (FIRST.isoformat(), second.id, second.id),
        )
        db.execute(
            "UPDATE sessions SET created_at=? WHERE account_id=? AND token_hash=("
            "SELECT token_hash FROM sessions WHERE account_id=? ORDER BY created_at DESC LIMIT 1)",
            (SECOND.isoformat(), second.id, second.id),
        )
        db.execute(
            "UPDATE sessions SET created_at=? WHERE account_id=?", (SECOND.isoformat(), target.id)
        )
        db.commit()
        before = db.execute(
            "SELECT account_id, token_hash, created_at, last_used_at "
            "FROM sessions ORDER BY created_at"
        ).fetchall()
    finally:
        db.close()

    status, body, _ = browser.request("GET", "/auth/accounts", cookie=f"{COOKIE}={first_token}")
    assert status == 200
    value = json.loads(body)
    assert set(value) == {"accounts"}
    assert value["accounts"] == [
        {
            "id": first.id,
            "display_name": "Test Admin",
            "profile_type": "admin",
            "disabled": False,
            "signed_in_at": FIRST.isoformat(),
        },
        {
            "id": second.id,
            "display_name": "Test Analyst",
            "profile_type": "analyst",
            "disabled": False,
            "signed_in_at": SECOND.isoformat(),
        },
        {
            "id": target.id,
            "display_name": "Test Reader",
            "profile_type": "reader",
            "disabled": False,
            "signed_in_at": SECOND.isoformat(),
        },
        {
            "id": no_session.id,
            "display_name": "Never Signed In",
            "profile_type": "reader",
            "disabled": False,
            "signed_in_at": None,
        },
    ]
    assert all(
        set(row) == {"id", "display_name", "profile_type", "disabled", "signed_in_at"}
        for row in value["accounts"]
    )
    for token in (second_token, target_token):
        readable_status, readable_body, _ = browser.request(
            "GET", "/auth/accounts", cookie=f"{COOKIE}={token}"
        )
        assert (readable_status, readable_body) == (200, body)
    status_again, body_again, _ = browser.request(
        "GET", "/auth/accounts", cookie=f"{COOKIE}={first_token}"
    )
    assert (status_again, body_again) == (200, body)
    db = store.open_db(accounts_dir)
    try:
        after = db.execute(
            "SELECT account_id, token_hash, created_at, last_used_at "
            "FROM sessions ORDER BY created_at"
        ).fetchall()
        assert [tuple(row) for row in after] == [tuple(row) for row in before]
        assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 4
    finally:
        db.close()
    assert attempts == []
    assert second_token != newer


def test_admin_disable_updates_safe_summary_and_blocks_old_session(signed_app) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, admin_token = create_account(accounts_dir, "Disabling Admin", "admin")
    target, target_token = create_account(accounts_dir, "Disabled Reader", "reader")
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/disable",
        cookie=f"{COOKIE}={admin_token}",
        body=b"",
    )
    assert status == 200
    summary = json.loads(body)["account"]
    assert summary["disabled"] is True
    assert summary["id"] == target.id
    db = store.open_db(accounts_dir)
    try:
        persisted = store.account_by_id(db, target.id)
        assert persisted is not None and persisted.disabled
    finally:
        db.close()
    status, body, _ = browser.request("GET", "/auth/accounts", cookie=f"{COOKIE}={target_token}")
    assert (status, json.loads(body)) == (401, {"error": "sign in first"})


def test_mutation_missing_target_and_out_of_range_id_do_not_echo_input(signed_app) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, "Missing Target Admin", "admin")
    missing = 999_999_999_999_999_999
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{missing}/disable",
        cookie=f"{COOKIE}={token}",
        body=b"",
    )
    assert (status, json.loads(body)) == (404, {"error": "account not found"})
    out_of_range = "9" * 19
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{out_of_range}/disable",
        cookie=f"{COOKIE}={token}",
        body=b"",
    )
    assert status == 404
    assert out_of_range.encode() not in body


def test_account_mutations_are_exact_post_routes(signed_app) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, "Exact Route Admin", "admin")
    target, _ = create_account(accounts_dir, "Exact Route Target", "reader")
    requests = (
        ("GET", f"/auth/accounts/{target.id}/disable"),
        ("POST", f"/auth/accounts/{target.id}/disable/"),
        ("POST", f"/auth/accounts/{target.id}/disabled"),
        ("POST", "/auth/accounts"),
    )
    for method, path in requests:
        status, _, _ = browser.request(
            method,
            path,
            cookie=f"{COOKIE}={token}",
            body=b"" if method == "POST" else None,
        )
        assert status == 404, (method, path)


@pytest.mark.parametrize("body", [b"{", b'{"profile_type":"not-a-profile"}'])
def test_admin_invalid_profile_mutation_is_400_and_unchanged(signed_app, body: bytes) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, "Invalid Profile Admin", "admin")
    target, _ = create_account(accounts_dir, "Invalid Profile Target", "reader")
    status, response, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/profile-type",
        cookie=f"{COOKIE}={token}",
        body=body,
    )
    assert (status, json.loads(response)) == (400, {"error": "invalid account request"})
    db = store.open_db(accounts_dir)
    try:
        persisted = store.account_by_id(db, target.id)
        assert persisted is not None and persisted.profile_type == "reader"
    finally:
        db.close()


def test_summary_read_failure_after_update_returns_500_and_rolls_back(
    signed_app, monkeypatch: pytest.MonkeyPatch
) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, "Trigger Admin", "admin")
    target, _ = create_account(accounts_dir, "Trigger Target", "reader")

    def fail_summary(_db: sqlite3.Connection, _account_id: int) -> None:
        raise sqlite3.OperationalError("injected summary read failure")

    monkeypatch.setattr(store, "account_summary", fail_summary)
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/profile-type",
        cookie=f"{COOKIE}={token}",
        body=b'{"profile_type":"analyst"}',
    )
    assert (status, json.loads(body)) == (
        500,
        {"error": "the service failed; see its log"},
    )
    db = store.open_db(accounts_dir)
    try:
        persisted = store.account_by_id(db, target.id)
        assert persisted is not None and persisted.profile_type == "reader"
    finally:
        db.close()


def test_account_routes_are_absent_when_sign_in_is_off(tmp_path: Path) -> None:
    root = Path(tempfile.mkdtemp(prefix="s5off-", dir="/tmp"))
    web = tmp_path / "off-web"
    web.mkdir()
    (web / "index.html").write_text(
        "<!doctype html><html><head><meta content=\"connect-src 'none'\"></head>"
        "<body>offline</body></html>",
        encoding="utf-8",
    )
    try:
        with make_server(root, web=web, synthetic=True, launcher=("accounts-test",)) as server:
            thread = threading.Thread(target=server.serve_forever)
            thread.start()
            browser = Browser(server.server_address[1])
            try:
                assert server.auth_config is None
                assert browser.request("GET", "/auth/accounts")[0] == 404
                assert browser.request("POST", "/auth/accounts/1/disable", body=b"")[0] == 404
            finally:
                server.shutdown()
                thread.join()
    finally:
        shutil.rmtree(root)


def test_real_sign_in_admin_mutations_and_log_secrecy(
    signed_app, caplog: pytest.LogCaptureFixture
) -> None:
    browser, provider, accounts_dir, attempts = signed_app
    caplog.set_level(logging.DEBUG)
    cookie, callback, _ = _begin_flow(browser, provider)
    status, _, headers = _callback_request(browser, cookie, callback)
    assert status == 303
    session = _session_token(headers)
    status, body, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=f"{COOKIE}={session}",
        body=json.dumps({"passcode": ADMIN_PASSCODE}).encode(),
    )
    assert status == 200
    assert json.loads(body)["account"]["profile_type"] == "admin"
    target, _ = create_account(accounts_dir, "Mutation Target", "reader", mint=False)
    status, identity_body, _ = browser.request("GET", "/auth/me", cookie=f"{COOKIE}={session}")
    assert status == 200
    actor_id = json.loads(identity_body)["account"]["id"]
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/profile-type",
        cookie=f"{COOKIE}={session}",
        body=b'{"profile_type":"analyst"}',
    )
    assert status == 200
    assert json.loads(body) == {
        "account": {
            "id": target.id,
            "display_name": "Mutation Target",
            "profile_type": "analyst",
            "disabled": False,
            "signed_in_at": None,
        }
    }
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{actor_id}/profile-type",
        cookie=f"{COOKIE}={session}",
        body=b'{"profile_type":"reader"}',
    )
    assert status == 409
    assert json.loads(body) == {"error": "keep at least one enabled Admin"}
    assert attempts == []
    _assert_no_auth_material(
        caplog,
        provider,
        accounts_dir,
        (ADMIN_PASSCODE, ANALYST_PASSCODE, session),
    )


@pytest.mark.parametrize("role", ["reader", "analyst"])
@pytest.mark.parametrize("action", ["disable", "profile-type"])
def test_non_admin_cannot_mutate_accounts(signed_app, role: str, action: str) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, f"Test {role.title()}", role)
    target, _ = create_account(accounts_dir, "Target Account", "reader")
    payload = b"" if action == "disable" else b'{"profile_type":"analyst"}'
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/{action}",
        cookie=f"{COOKIE}={token}",
        body=payload,
    )
    assert (status, json.loads(body)) == (403, {"error": "only an Admin can do this"})
    db = store.open_db(accounts_dir)
    try:
        unchanged = store.account_by_id(db, target.id)
        assert unchanged is not None
        assert unchanged.profile_type == "reader" and not unchanged.disabled
    finally:
        db.close()


@pytest.mark.parametrize("role", ["reader", "analyst"])
def test_non_admin_refusal_precedes_malformed_mutation_body(signed_app, role: str) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, f"Malformed {role.title()}", role)
    target, _ = create_account(accounts_dir, "Malformed Target", "reader")
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{target.id}/profile-type",
        cookie=f"{COOKIE}={token}",
        body=b"{",
    )
    assert (status, json.loads(body)) == (403, {"error": "only an Admin can do this"})


def test_disable_rejects_duplicate_content_length(signed_app) -> None:
    browser, _, accounts_dir, _ = signed_app
    _, token = create_account(accounts_dir, "Framing Admin", "admin")
    target, _ = create_account(accounts_dir, "Framing Target", "reader")
    connection = HTTPConnection("127.0.0.1", browser.port, timeout=10)
    try:
        connection.putrequest("POST", f"/auth/accounts/{target.id}/disable", skip_host=True)
        connection.putheader("Host", f"localhost:{browser.port}")
        connection.putheader("Origin", f"http://localhost:{browser.port}")
        connection.putheader("Cookie", f"{COOKIE}={token}")
        connection.putheader("Content-Length", "0")
        connection.putheader("Content-Length", "1")
        connection.endheaders()
        response = connection.getresponse()
        body = response.read()
        assert (response.status, json.loads(body)) == (
            400,
            {"error": "invalid account request"},
        )
    finally:
        connection.close()
    db = store.open_db(accounts_dir)
    try:
        unchanged = store.account_by_id(db, target.id)
        assert unchanged is not None and not unchanged.disabled
    finally:
        db.close()


@pytest.mark.parametrize(
    ("action", "payload"),
    [
        ("disable", b""),
        ("profile-type", b'{"profile_type":"analyst"}'),
        ("profile-type", b'{"profile_type":"reader"}'),
    ],
)
def test_sole_admin_cannot_disable_or_demote_self(signed_app, action: str, payload: bytes) -> None:
    browser, _, accounts_dir, _ = signed_app
    admin, token = create_account(accounts_dir, "Only Admin", "admin")
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{admin.id}/{action}",
        cookie=f"{COOKIE}={token}",
        body=payload,
    )
    assert (status, json.loads(body)) == (409, {"error": "keep at least one enabled Admin"})
    db = store.open_db(accounts_dir)
    try:
        unchanged = store.account_by_id(db, admin.id)
        assert unchanged is not None
        assert unchanged.profile_type == "admin" and not unchanged.disabled
    finally:
        db.close()


@pytest.mark.parametrize(
    ("action", "payload"),
    [("disable", b""), ("profile-type", b'{"profile_type":"analyst"}')],
)
def test_self_mutation_allowed_when_another_enabled_admin_remains(
    signed_app, action: str, payload: bytes
) -> None:
    browser, _, accounts_dir, _ = signed_app
    admin, token = create_account(accounts_dir, "Self Mutating Admin", "admin")
    other, _ = create_account(accounts_dir, "Remaining Admin", "admin")
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{admin.id}/{action}",
        cookie=f"{COOKIE}={token}",
        body=payload,
    )
    assert status == 200
    summary = json.loads(body)["account"]
    assert summary["id"] == admin.id
    assert summary["disabled"] is (action == "disable")
    assert summary["profile_type"] == ("analyst" if action == "profile-type" else "admin")
    db = store.open_db(accounts_dir)
    try:
        remaining = store.account_by_id(db, other.id)
        assert (
            remaining is not None and remaining.profile_type == "admin" and not remaining.disabled
        )
    finally:
        db.close()


def test_previously_disabled_admin_does_not_satisfy_last_admin_guard(signed_app) -> None:
    browser, _, accounts_dir, _ = signed_app
    remaining, token = create_account(accounts_dir, "Guarded Admin", "admin")
    disabled_admin, _ = create_account(accounts_dir, "Disabled Admin", "admin")
    db = store.open_db(accounts_dir)
    try:
        store.disable_account(db, disabled_admin.id)
    finally:
        db.close()
    status, body, _ = browser.request(
        "POST",
        f"/auth/accounts/{remaining.id}/profile-type",
        cookie=f"{COOKIE}={token}",
        body=b'{"profile_type":"reader"}',
    )
    assert (status, json.loads(body)) == (409, {"error": "keep at least one enabled Admin"})


@pytest.mark.parametrize(
    ("action", "expected_refusal"),
    [("disable", (401, "sign in first")), ("profile-type", (403, "only an Admin can do this"))],
)
def test_cross_admin_mutation_race_rechecks_actor_under_write_lock(
    signed_app,
    monkeypatch: pytest.MonkeyPatch,
    action: str,
    expected_refusal: tuple[int, str],
) -> None:
    browser, _, accounts_dir, _ = signed_app
    first, first_token = create_account(accounts_dir, "First Admin", "admin")
    second, second_token = create_account(accounts_dir, "Second Admin", "admin")
    router = AuthRoutes
    original_post = router.post
    both_gated = threading.Barrier(2)

    def synchronized_post(self, handler, url, account):
        if url.path.endswith(f"/{action}"):
            both_gated.wait(timeout=5)
        return original_post(self, handler, url, account)

    monkeypatch.setattr(router, "post", synchronized_post)

    def request(token: str, target_id: int) -> tuple[int, bytes, dict[str, str]]:
        payload = b"" if action == "disable" else b'{"profile_type":"analyst"}'
        return browser.request(
            "POST",
            f"/auth/accounts/{target_id}/{action}",
            cookie=f"{COOKIE}={token}",
            body=payload,
        )

    with ThreadPoolExecutor(max_workers=1) as worker:
        second_call = worker.submit(request, second_token, first.id)
        first_response = request(first_token, second.id)
        second_response = second_call.result(timeout=10)
    assert sorted([first_response[0], second_response[0]]) == sorted([200, expected_refusal[0]])
    refused = first_response if first_response[0] != 200 else second_response
    assert json.loads(refused[1]) == {"error": expected_refusal[1]}
    db = store.open_db(accounts_dir)
    try:
        enabled_admins = db.execute(
            "SELECT COUNT(*) FROM accounts WHERE profile_type='admin' AND disabled=0"
        ).fetchone()[0]
        assert enabled_admins == 1
    finally:
        db.close()
