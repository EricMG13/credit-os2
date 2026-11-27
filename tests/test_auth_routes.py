"""Configured sign-in routes driven through MSAL and the strict local identity provider."""

from __future__ import annotations

import json
import logging
import shutil
import socket
import tempfile
import threading
from datetime import UTC, datetime
from http.client import HTTPConnection
from http.cookies import SimpleCookie
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urlsplit

import pytest
from auth_provider import (
    CLIENT_ID,
    TENANT_ID,
    LoopbackHttpClient,
    LoopbackIdentityProvider,
)

from deploy_workflow.accounts import passcodes, store
from deploy_workflow.accounts.entra import EntraProvider, public_client
from deploy_workflow.accounts.pending_flows import PendingFlows
from react_frontend import make_server
from react_frontend.auth_gate import loopback_ip_host

DENIAL = "this account cannot sign in here"
ADMIN_PASSCODE = "admin-route-passcode-12"
ANALYST_PASSCODE = "analyst-route-passcode"
SCOPES = ("offline_access", "openid", "profile")


class Browser:
    """One HTTP connection per call; keep Host and Origin explicit as a browser would."""

    def __init__(self, port: int) -> None:
        self.port = port

    def request(
        self,
        method: str,
        path: str,
        *,
        host: str = "localhost",
        cookie: str | None = None,
        body: bytes = b"",
    ) -> tuple[int, bytes, dict[str, str]]:
        connection = HTTPConnection("127.0.0.1", self.port, timeout=10)
        headers = {"Host": f"{host}:{self.port}"}
        if method != "GET":
            headers["Origin"] = f"http://{host}:{self.port}"
            headers["Content-Length"] = str(len(body))
        if cookie:
            headers["Cookie"] = cookie
        try:
            connection.request(method, path, body=body, headers=headers)
            response = connection.getresponse()
            return response.status, response.read(), dict(response.getheaders())
        finally:
            connection.close()


def _seed_passcodes(accounts_dir: Path) -> None:
    db = store.open_db(accounts_dir)
    try:
        passcodes.set_passcode(db, "analyst", passcode=ANALYST_PASSCODE, now=datetime.now(UTC))
        passcodes.set_passcode(db, "admin", passcode=ADMIN_PASSCODE, now=datetime.now(UTC))
    finally:
        db.close()


@pytest.fixture
def app(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    root = Path(tempfile.mkdtemp(prefix="s3root-", dir="/tmp"))
    accounts_dir = tmp_path / "private-accounts"
    web = tmp_path / "web"
    web.mkdir()
    (web / "index.html").write_text(
        '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" '
        "content=\"connect-src 'none'\"></head><body>fixture</body></html>",
        encoding="utf-8",
    )
    public = Path(__file__).resolve().parents[1] / "web" / "public"
    shutil.copyfile(public / "sign-in.html", web / "sign-in.html")
    shutil.copyfile(public / "symbol.svg", web / "symbol.svg")
    (web / "fonts").mkdir()
    for name in ("Geist-Regular.woff2", "Geist-SemiBold.woff2"):
        shutil.copyfile(public / "fonts" / name, web / "fonts" / name)
    _seed_passcodes(accounts_dir)

    with LoopbackIdentityProvider(
        signature_modes=["valid"],
        redirect_uri_path="/auth/callback",
        expected_scopes=SCOPES,
        expected_state=None,
    ) as provider:
        attempts: list[str] = []
        original_getaddrinfo = socket.getaddrinfo
        original_connect = socket.socket.connect
        permitted = {"127.0.0.1", "::1", "localhost"}

        def guarded_getaddrinfo(host: str | None, *args: Any, **kwargs: Any) -> Any:
            if host not in permitted:
                attempts.append(f"DNS {host!r}")
                raise AssertionError(attempts[-1])
            return original_getaddrinfo(host, *args, **kwargs)

        def guarded_connect(
            connection: socket.socket, address: Any, *args: Any, **kwargs: Any
        ) -> Any:
            if isinstance(address, tuple) and address and address[0] not in permitted:
                attempts.append(f"connect {address[0]!r}")
                raise AssertionError(attempts[-1])
            return original_connect(connection, address, *args, **kwargs)

        monkeypatch.setattr(socket, "getaddrinfo", guarded_getaddrinfo)
        monkeypatch.setattr(socket.socket, "connect", guarded_connect)
        # The expected redirect includes the application's ephemeral listener port. The provider
        # is configured below after make_server binds, and never opens a connection off loopback.
        transport = LoopbackHttpClient(provider.base_url)
        factory_calls: list[tuple[str, str]] = []

        def provider_factory(client_id: str, authority: str) -> EntraProvider:
            factory_calls.append((client_id, authority))
            application = public_client(
                client_id,
                f"{provider.authority_url}/{TENANT_ID}",
                instance_discovery=False,
                http_client=transport,
            )
            return EntraProvider(application, f"{provider.authority_url}/{TENANT_ID}/v2.0")

        try:
            with make_server(
                root,
                web=web,
                environ={
                    "CREDIT_OS_ENTRA_TENANT": TENANT_ID,
                    "CREDIT_OS_ENTRA_CLIENT": CLIENT_ID,
                },
                accounts_dir=accounts_dir,
                provider_factory=provider_factory,
            ) as server:
                thread = threading.Thread(target=server.serve_forever)
                thread.start()
                try:
                    yield (
                        Browser(server.server_address[1]),
                        provider,
                        accounts_dir,
                        transport,
                        factory_calls,
                        attempts,
                    )
                finally:
                    server.shutdown()
                    thread.join()
                    transport.close()
        finally:
            shutil.rmtree(root)


def _flow_key(headers: dict[str, str]) -> str:
    raw = headers["Set-Cookie"]
    cookie = SimpleCookie(raw)["credit_os_signin_flow"]
    assert cookie["httponly"]
    assert cookie["samesite"] == "Lax"
    assert cookie["path"] == "/auth/callback"
    assert cookie["max-age"] == "600"
    assert not cookie["secure"]
    assert "Domain" not in raw
    assert "credit_os_session" not in cookie.value
    return cookie.value


def _session_token(headers: dict[str, str]) -> str:
    raw = headers["Set-Cookie"]
    cookie = SimpleCookie(raw)["credit_os_session"]
    assert cookie["httponly"]
    assert cookie["samesite"] == "Lax"
    assert cookie["path"] == "/"
    assert cookie["max-age"] == "43200"
    assert not cookie["secure"]
    assert "Domain" not in raw
    return cookie.value


def _assert_reader_store(accounts_dir: Path, session_count: int) -> None:
    db = store.open_db(accounts_dir)
    try:
        rows = db.execute("SELECT profile_type, display_name FROM accounts").fetchall()
        assert [(row["profile_type"], row["display_name"]) for row in rows] == [
            ("reader", "A. Kovac")
        ]
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == session_count
    finally:
        db.close()


def _assert_no_auth_material(
    caplog: pytest.LogCaptureFixture,
    provider: LoopbackIdentityProvider,
    accounts_dir: Path,
    extra: tuple[str, ...],
) -> None:
    values = [*provider.credential_material, *extra]
    assert '"GET /auth/callback"' in caplog.text
    assert all(value not in caplog.text for value in values)
    stored_text = _stored_text(accounts_dir)
    assert all(value not in stored_text for value in values)


def test_sign_in_entry_canonicalizes_and_limits_the_flow_cookie(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
) -> None:
    browser, provider, _, _, factory_calls, _ = app
    status, _, headers = browser.request("GET", "/sign-in", host="127.0.0.1")
    assert status == 302
    assert headers["Location"] == f"http://localhost:{browser.port}/sign-in"
    status, page, _ = browser.request("GET", "/sign-in")
    assert status == 200
    assert b"Sign in with your work account" in page
    assert b"<!-- sign-in-error -->" in page
    status, _, headers = browser.request("GET", "/auth/start", host="127.0.0.1")
    assert status == 302
    assert headers["Location"] == f"http://localhost:{browser.port}/auth/start"
    status, _, headers = browser.request("GET", "/auth/start")
    assert status == 302
    auth_uri = urlsplit(headers["Location"])
    assert auth_uri.hostname == "127.0.0.1"
    assert auth_uri.port == urlsplit(provider.base_url).port
    _flow_key(headers)
    for asset in (
        "/symbol.svg",
        "/fonts/Geist-Regular.woff2",
        "/fonts/Geist-SemiBold.woff2",
    ):
        assert browser.request("GET", asset)[0] == 200
    assert browser.request("GET", "/fonts/")[0] == 401
    assert factory_calls == [(CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}")]


def test_canonical_loopback_host_uses_only_the_validated_listener_host_form() -> None:
    assert loopback_ip_host("127.0.0.1", 80)
    assert loopback_ip_host("127.0.0.1:43123", 43123)
    assert not loopback_ip_host("127.0.0.1", 43123)
    assert not loopback_ip_host("127.0.0.1:80", 8080)


def test_callback_registers_reader_and_returns_only_opaque_host_scoped_cookies(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, transport, factory_calls, network_attempts = app
    caplog.set_level(logging.DEBUG)
    status, body, _ = browser.request("GET", "/signal/api/topics")
    assert (status, json.loads(body)) == (401, {"error": "sign in first"})
    flow_key, callback_url, _ = _begin_flow(browser, provider)
    callback_cookie = f"credit_os_signin_flow={flow_key}"
    refused_status, refused_page, refused_headers = browser.request(
        "GET",
        f"{callback_url.path}?{callback_url.query}",
        host="127.0.0.1",
        cookie=callback_cookie,
    )
    assert refused_status == 400
    assert "Location" not in refused_headers
    assert b"the sign-in request could not be verified" in refused_page
    assert parse_qs(callback_url.query)["code"][0].encode() not in refused_page
    status, _, callback_headers = browser.request(
        "GET", f"{callback_url.path}?{callback_url.query}", cookie=callback_cookie
    )
    assert status == 303
    assert callback_headers["Location"] == "/"
    assert callback_headers["Cache-Control"] == "no-store"
    assert callback_headers["Referrer-Policy"] == "no-referrer"
    session = _session_token(callback_headers)
    _assert_reader_store(accounts_dir, session_count=1)

    status, body, _ = browser.request("GET", "/auth/me", cookie=f"credit_os_session={session}")
    assert (status, json.loads(body)) == (
        200,
        {"account": {"id": 1, "display_name": "A. Kovac", "profile_type": "reader"}},
    )
    assert browser.request("GET", "/connected/reports")[0] == 401
    assert (
        browser.request("GET", "/connected/reports", cookie=f"credit_os_session={session}")[0]
        == 200
    )

    # A new callback always mints a fresh session, even when the browser presents its old one.
    provider.declare_signature("valid")
    second_flow, second_callback, _ = _begin_flow(browser, provider)
    status, _, second_headers = browser.request(
        "GET",
        f"{second_callback.path}?{second_callback.query}",
        cookie=f"credit_os_signin_flow={second_flow}; credit_os_session={session}",
    )
    assert status == 303
    replacement = _session_token(second_headers)
    assert replacement != session
    _assert_reader_store(accounts_dir, session_count=2)
    assert (
        provider.token_requests[0]["redirect_uri"]
        == f"http://localhost:{browser.port}/auth/callback"
    )
    assert provider.network_events
    assert all(host == "127.0.0.1" for _, host in provider.network_events)
    assert transport.mapped_requests
    assert all(url.startswith(provider.authority_url) for url in transport.mapped_requests)
    assert factory_calls == [
        (CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}"),
        (CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}"),
        (CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}"),
        (CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}"),
    ]
    _assert_no_auth_material(caplog, provider, accounts_dir, (session, replacement))
    assert network_attempts == []


def test_unknown_auth_pair_and_hostile_method_are_not_open(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
) -> None:
    browser, _, _, _, _, _ = app
    for method, path in (
        ("GET", "/auth/start/"),
        ("GET", "/AUTH/START"),
        ("POST", "/auth/start"),
        ("DELETE", "/auth/start"),
        ("POST", "/auth/callback"),
        ("POST", "/auth/passcode?unexpected=credential"),
        ("DELETE", "/auth/passcode"),
        ("POST", "/auth/set-passcode"),
        ("GET", "/auth/passcode"),
        ("GET", "/auth/sign-out"),
        ("POST", "/auth/sign-out/"),
    ):
        status, body, _ = browser.request(method, path)
        assert status == 401, (method, path, status, body)


def _begin_flow(browser: Browser, provider: LoopbackIdentityProvider) -> tuple[str, Any, str]:
    status, _, headers = browser.request("GET", "/auth/start")
    assert status == 302
    auth_uri = urlsplit(headers["Location"])
    cookie = _flow_key(headers)
    state = parse_qs(auth_uri.query, strict_parsing=True)["state"][0]
    provider.expect_flow(
        state=state,
        redirect_uri=f"http://localhost:{browser.port}/auth/callback",
        include_session_state=True,
    )
    connection = HTTPConnection("127.0.0.1", auth_uri.port, timeout=10)
    try:
        connection.request("GET", f"{auth_uri.path}?{auth_uri.query}")
        response = connection.getresponse()
        assert response.status == 302
        callback = urlsplit(response.getheader("Location"))
    finally:
        connection.close()
    assert callback.hostname == "localhost"
    assert callback.port == browser.port
    return cookie, callback, state


def _callback_request(
    browser: Browser, cookie: str, callback: Any
) -> tuple[int, bytes, dict[str, str]]:
    return browser.request(
        "GET",
        f"{callback.path}?{callback.query}",
        cookie=f"credit_os_signin_flow={cookie}",
    )


def _stored_text(accounts_dir: Path) -> str:
    db = store.open_db(accounts_dir)
    try:
        values: list[str] = []
        tables = db.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        for (table,) in tables:
            rows = db.execute(f'SELECT * FROM "{table}"').fetchall()
            values.extend(str(value) for row in rows for value in row if value is not None)
        return " ".join(values)
    finally:
        db.close()


def test_wrong_state_and_replay_never_create_a_second_identity_or_session(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, _, factory_calls, _ = app
    caplog.set_level(logging.DEBUG)
    cookie, callback, state = _begin_flow(browser, provider)
    query = parse_qs(callback.query, keep_blank_values=True, strict_parsing=True)
    wrong = urlencode({"code": query["code"][0], "state": "wrong-state"})
    status, body, _ = browser.request(
        "GET", f"{callback.path}?{wrong}", cookie=f"credit_os_signin_flow={cookie}"
    )
    assert status == 400
    assert b"the sign-in request could not be verified" in body
    assert len(provider.token_requests) == 0
    assert factory_calls == [(CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}")]
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM accounts").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 0
    finally:
        db.close()

    status, _, response_headers = _callback_request(browser, cookie, callback)
    assert status == 303
    session_token = SimpleCookie(response_headers["Set-Cookie"])["credit_os_session"].value
    status, body, _ = _callback_request(browser, cookie, callback)
    assert status == 400
    assert b"the sign-in request could not be verified" in body
    assert len(provider.token_requests) == 1
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM accounts").fetchone()[0] == 1
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 1
    finally:
        db.close()
    _assert_no_auth_material(caplog, provider, accounts_dir, (session_token, state))


def test_simultaneous_callback_consumes_one_flow_and_mints_one_session(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level(logging.DEBUG)
    cookie, callback, _ = _begin_flow(browser, provider)
    original_take = PendingFlows.take
    both_callbacks = threading.Barrier(2)

    def overlap_take(
        self: PendingFlows, key: str, state: str, *, now: datetime
    ) -> dict[str, Any] | None:
        result = original_take(self, key, state, now=now)
        both_callbacks.wait(timeout=5)
        return result

    monkeypatch.setattr(PendingFlows, "take", overlap_take)
    headers = {
        "Host": f"localhost:{browser.port}",
        "Cookie": f"credit_os_signin_flow={cookie}",
    }
    path = f"{callback.path}?{callback.query}"
    connections = [
        HTTPConnection("127.0.0.1", browser.port, timeout=10),
        HTTPConnection("127.0.0.1", browser.port, timeout=10),
    ]
    try:
        for connection in connections:
            connection.request("GET", path, headers=headers)
        responses = [connection.getresponse() for connection in connections]
        statuses = [response.status for response in responses]
        response_headers = [dict(response.getheaders()) for response in responses]
        for response in responses:
            response.read()
    finally:
        for connection in connections:
            connection.close()
    assert sorted(statuses) == [303, 400]
    minted = [
        SimpleCookie(headers["Set-Cookie"])["credit_os_session"].value
        for headers, status in zip(response_headers, statuses, strict=True)
        if status == 303
    ]
    assert len(minted) == 1
    assert len(provider.token_requests) == 1
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM accounts").fetchone()[0] == 1
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 1
    finally:
        db.close()
    _assert_no_auth_material(caplog, provider, accounts_dir, tuple(minted))


def test_disabled_identity_does_not_get_a_new_session(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level(logging.DEBUG)
    db = store.open_db(accounts_dir)
    try:
        account = store.register_reader(
            db,
            tenant_id=TENANT_ID,
            object_id="00000000-0000-4000-8000-000000000102",
            name="A. Kovac",
            email="a.kovac@example.org",
            given_name=None,
            family_name=None,
            now=datetime.now(UTC),
        )
        store.disable_account(db, account.id)
    finally:
        db.close()
    cookie, callback, _ = _begin_flow(browser, provider)
    status, body, headers = _callback_request(browser, cookie, callback)
    assert status == 400
    assert DENIAL.encode() in body
    assert "Set-Cookie" not in headers
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM accounts").fetchone()[0] == 1
        assert db.execute("SELECT disabled FROM accounts").fetchone()[0] == 1
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 0
    finally:
        db.close()
    _assert_no_auth_material(caplog, provider, accounts_dir, ())


@pytest.mark.parametrize(
    "identity_mode", ["wrong_issuer", "wrong_tenant", "wrong_audience", "wrong_nonce"]
)
def test_wrong_verified_identity_claims_are_denied_without_registration(
    identity_mode: str,
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level(logging.DEBUG)
    status, _, headers = browser.request("GET", "/auth/start")
    assert status == 302
    auth_uri = urlsplit(headers["Location"])
    cookie = SimpleCookie(headers["Set-Cookie"])["credit_os_signin_flow"].value
    state = parse_qs(auth_uri.query, strict_parsing=True)["state"][0]
    provider.expect_flow(
        state=state,
        redirect_uri=f"http://localhost:{browser.port}/auth/callback",
        identity_mode=identity_mode,
    )
    connection = HTTPConnection("127.0.0.1", auth_uri.port, timeout=10)
    try:
        connection.request("GET", f"{auth_uri.path}?{auth_uri.query}")
        authorization = connection.getresponse()
        assert authorization.status == 302
        callback = urlsplit(authorization.getheader("Location"))
    finally:
        connection.close()
    status, body, headers = _callback_request(browser, cookie, callback)
    assert status == 400
    assert DENIAL.encode() in body
    assert "Set-Cookie" not in headers
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM accounts").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 0
    finally:
        db.close()
    _assert_no_auth_material(caplog, provider, accounts_dir, ())


def test_unauthenticated_passcode_does_not_count_then_admin_promotion_and_signout(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level(logging.DEBUG)
    unauthenticated = json.dumps({"passcode": ADMIN_PASSCODE}).encode()
    status, body, _ = browser.request("POST", "/auth/passcode", body=unauthenticated)
    assert (status, json.loads(body)) == (401, {"error": "sign in first"})
    status, body, _ = browser.request(
        "POST",
        "/auth/passcode?unexpected=credential",
        body=unauthenticated,
    )
    assert (status, json.loads(body)) == (401, {"error": "sign in first"})
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM registration_attempts").fetchone()[0] == 0
    finally:
        db.close()

    cookie, callback, _ = _begin_flow(browser, provider)
    status, _, headers = _callback_request(browser, cookie, callback)
    assert status == 303
    session_token = SimpleCookie(headers["Set-Cookie"])["credit_os_session"].value
    session_cookie = f"credit_os_session={session_token}"
    status, body, _ = browser.request("GET", "/signal/api/me", cookie=session_cookie)
    assert (status, json.loads(body)) == (200, {"name": "A. Kovac", "role": "reader"})
    status, body, _ = browser.request(
        "POST",
        "/signal/api/sources",
        cookie=session_cookie,
        body=json.dumps(
            {"name": "Reader proposal", "kind": "news", "url": "https://example.org/feed"}
        ).encode(),
    )
    assert (status, json.loads(body)) == (
        403,
        {"error": "only a writer can propose a source"},
    )
    for passcode in (ADMIN_PASSCODE, ANALYST_PASSCODE):
        status, body, _ = browser.request(
            "POST",
            "/auth/passcode",
            cookie=session_cookie,
            body=json.dumps({"passcode": passcode}).encode(),
        )
        assert status == 200
        assert json.loads(body)["account"]["profile_type"] == "admin"
    status, body, _ = browser.request("GET", "/signal/api/me", cookie=session_cookie)
    assert (status, json.loads(body)) == (200, {"name": "A. Kovac", "role": "owner"})

    wrong_passcode = "definitely-wrong-route-passcode"
    for expected in (403, 403, 403, 403, 403, 429):
        status, body, _ = browser.request(
            "POST",
            "/auth/passcode",
            cookie=session_cookie,
            body=json.dumps({"passcode": wrong_passcode}).encode(),
        )
        assert status == expected
        assert json.loads(body)["error"] == ("locked" if expected == 429 else "wrong passcode")

    status, body, headers = browser.request("POST", "/auth/sign-out", cookie=session_cookie)
    assert status == 204
    assert body == b""
    cleared = SimpleCookie(headers["Set-Cookie"])["credit_os_session"]
    assert cleared.value == ""
    assert cleared["max-age"] == "0"
    status, body, _ = browser.request("GET", "/auth/me", cookie=session_cookie)
    assert (status, json.loads(body)) == (200, {"account": None})
    db = store.open_db(accounts_dir)
    try:
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 0
        row = db.execute("SELECT profile_type FROM accounts").fetchone()
        assert row["profile_type"] == "admin"
        assert db.execute("SELECT failed_count FROM registration_attempts").fetchone()[0] == 5
    finally:
        db.close()
    _assert_no_auth_material(
        caplog,
        provider,
        accounts_dir,
        (ADMIN_PASSCODE, ANALYST_PASSCODE, wrong_passcode, session_token),
    )


def test_maximum_length_unicode_admin_passcode_fits_escaped_json_request(
    app: tuple[
        Browser,
        LoopbackIdentityProvider,
        Path,
        LoopbackHttpClient,
        list[tuple[str, str]],
        list[str],
    ],
    caplog: pytest.LogCaptureFixture,
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level(logging.DEBUG)
    maximum_passcode = "é" * passcodes.MAX_LENGTH
    db = store.open_db(accounts_dir)
    try:
        passcodes.set_passcode(db, "admin", passcode=maximum_passcode, now=datetime.now(UTC))
    finally:
        db.close()
    flow_cookie, callback, _ = _begin_flow(browser, provider)
    status, _, headers = _callback_request(browser, flow_cookie, callback)
    assert status == 303
    session = _session_token(headers)
    body = json.dumps({"passcode": maximum_passcode}).encode("utf-8")
    assert len(body) <= 16 * 1024
    status, response_body, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=f"credit_os_session={session}",
        body=body,
    )
    assert status == 200
    assert json.loads(response_body)["account"]["profile_type"] == "admin"
    _assert_no_auth_material(caplog, provider, accounts_dir, (maximum_passcode, session))
