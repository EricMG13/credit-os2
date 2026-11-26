"""Task 0: the pinned MSAL public code flow against a local OIDC provider."""

from __future__ import annotations

import base64
import copy
import hashlib
import http.client
import logging
import socket
from typing import Any, cast
from urllib.parse import parse_qs, urlencode, urlsplit

import pytest
from auth_provider import (
    CLIENT_ID,
    TENANT_ID,
    LoopbackHttpClient,
    LoopbackIdentityProvider,
    ProviderRejected,
)
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

from deploy_workflow.accounts.entra import public_client

REDIRECT_URI_PATH = "/client/callback"
SCOPES = [f"api://{CLIENT_ID}/access_as_user"]
FIXED_STATE = "task-0-expected-state-123456789"
EXPECTED_SCOPES = (*SCOPES, "offline_access", "openid", "profile")


class NonLoopbackAttempt(AssertionError):
    pass


@pytest.fixture
def guarded_loopback(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Forbid external DNS and connects before delegating any allowed loopback work."""
    attempts: list[str] = []
    original_getaddrinfo = cast(Any, socket.getaddrinfo)
    original_connect = cast(Any, socket.socket.connect)
    loopback_hosts = {"127.0.0.1", "::1", "localhost"}

    def guarded_getaddrinfo(host: str | None, *args: Any, **kwargs: Any) -> Any:
        if host not in loopback_hosts:
            attempts.append(f"DNS {host!r}")
            raise NonLoopbackAttempt(attempts[-1])
        return original_getaddrinfo(host, *args, **kwargs)

    def guarded_connect(connection: socket.socket, address: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(address, tuple) and address and address[0] not in loopback_hosts:
            attempts.append(f"connect {address[0]!r}")
            raise NonLoopbackAttempt(attempts[-1])
        return original_connect(connection, address, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", guarded_getaddrinfo)
    monkeypatch.setattr(socket.socket, "connect", guarded_connect)
    return attempts


def _authorized_response(
    flow: dict[str, object], provider: LoopbackIdentityProvider
) -> tuple[dict[str, str], str]:
    auth_uri = str(flow["auth_uri"])
    parsed = urlsplit(auth_uri)
    assert parsed.hostname == "127.0.0.1"
    assert parsed.port == urlsplit(provider.base_url).port
    connection = http.client.HTTPConnection(parsed.hostname, parsed.port, timeout=5)
    try:
        connection.request("GET", f"{parsed.path}?{parsed.query}")
        authorization = connection.getresponse()
        assert authorization.status == 302
        location = authorization.getheader("Location")
    finally:
        connection.close()
    assert location is not None
    query = parse_qs(urlsplit(location).query, strict_parsing=True)
    response = {name: values[0] for name, values in query.items()}
    return response, auth_uri


def _request_authorization(provider: LoopbackIdentityProvider, query: dict[str, str]) -> int:
    connection = http.client.HTTPConnection(
        "127.0.0.1", urlsplit(provider.base_url).port, timeout=5
    )
    try:
        connection.request("GET", f"/authorize?{urlencode(query)}")
        response = connection.getresponse()
        response.read()
        return response.status
    finally:
        connection.close()


def _b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def test_provider_requires_declared_scopes_before_consuming_code(
    guarded_loopback: list[str],
) -> None:
    verifier = "v" * 43
    challenge = _b64url(hashlib.sha256(verifier.encode("ascii")).digest())
    with LoopbackIdentityProvider(
        signature_modes=["valid"],
        redirect_uri_path=REDIRECT_URI_PATH,
        expected_scopes=EXPECTED_SCOPES,
        expected_state=FIXED_STATE,
    ) as provider:
        redirect_uri = f"{provider.base_url}{REDIRECT_URI_PATH}"
        authorization = {
            "client_id": CLIENT_ID,
            "response_type": "code",
            "response_mode": "query",
            "redirect_uri": redirect_uri,
            "scope": " ".join(EXPECTED_SCOPES),
            "state": FIXED_STATE,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "nonce": "a" * 64,
            "client_info": "1",
        }
        callback = urlsplit(provider.authorize(authorization))
        code = parse_qs(callback.query, strict_parsing=True)["code"][0]
        form = {
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "code": code,
            "redirect_uri": redirect_uri,
            "code_verifier": verifier,
            "scope": " ".join(EXPECTED_SCOPES),
            "client_info": "1",
        }
        invalid_forms = [
            {key: value for key, value in form.items() if key != "scope"},
            {**form, "scope": ""},
            {**form, "scope": " ".join((*EXPECTED_SCOPES, EXPECTED_SCOPES[0]))},
            {**form, "scope": f"{SCOPES[0]} offline_access openid profile email"},
        ]
        for invalid_form in invalid_forms:
            with pytest.raises(ProviderRejected):
                provider.exchange(invalid_form)
            assert provider.used_codes == []
            assert provider.token_requests == []
            assert provider.issued_tokens == []

        valid = provider.exchange(
            {
                **form,
                "scope": " ".join(reversed(EXPECTED_SCOPES)),
            }
        )
        assert set(valid["scope"].split()) == set(EXPECTED_SCOPES)
        assert provider.used_codes == [code]
        assert len(provider.token_requests) == 1
        assert len(provider.issued_tokens) == 1
        with pytest.raises(ProviderRejected, match="unknown or used code"):
            provider.exchange({**form, "scope": " ".join(EXPECTED_SCOPES)})
    assert guarded_loopback == []


def _signature(token: str) -> bytes:
    encoded_signature = token.split(".")[2]
    return base64.urlsafe_b64decode(encoded_signature + "=" * (-len(encoded_signature) % 4))


def _assert_authorization_request(flow: dict[str, object], redirect_uri: str) -> str:
    request_query = parse_qs(urlsplit(str(flow["auth_uri"])).query)
    expected_nonce = hashlib.sha256(str(flow["nonce"]).encode("ascii")).hexdigest()
    assert request_query["client_id"] == [CLIENT_ID]
    assert request_query["redirect_uri"] == [redirect_uri]
    assert request_query["response_type"] == ["code"]
    assert request_query["state"] == [FIXED_STATE]
    assert request_query["code_challenge_method"] == ["S256"]
    assert request_query["nonce"] == [expected_nonce]
    assert len(str(flow["code_verifier"])) >= 43
    return expected_nonce


def _assert_expected_identity(claims: dict[str, object], nonce: str) -> None:
    assert claims["tid"] == TENANT_ID
    assert claims["oid"] == "00000000-0000-4000-8000-000000000102"
    assert claims["aud"] == CLIENT_ID
    assert claims["name"] == "A. Kovac"
    assert claims["preferred_username"] == "a.kovac@example.org"
    assert claims["nonce"] == nonce


def _assert_valid_signature(token: str, provider: LoopbackIdentityProvider) -> None:
    signed_header, signed_payload = token.split(".")[:2]
    provider.public_key().verify(
        _signature(token),
        f"{signed_header}.{signed_payload}".encode("ascii"),
        padding.PKCS1v15(),
        hashes.SHA256(),
    )


def _assert_altered_signature_accepted(
    altered_token: str,
    valid_token: str,
    valid_claims: dict[str, object],
    altered: dict[str, object],
) -> None:
    assert altered_token.split(".")[:2] == valid_token.split(".")[:2]
    assert _signature(altered_token) != _signature(valid_token)
    assert altered["id_token_claims"] == valid_claims


def _assert_secrets_not_logged(
    caplog: pytest.LogCaptureFixture, flow: dict[str, object], provider: LoopbackIdentityProvider
) -> None:
    secrets = [
        *provider.used_codes,
        *provider.issued_tokens,
        *provider.access_tokens,
        str(flow["code_verifier"]),
        FIXED_STATE,
        str(flow["nonce"]),
        "test-passcode-never-log",
        "test-session-token-never-log",
    ]
    assert all(secret not in caplog.text for secret in secrets)
    assert "provider GET /authorize" in caplog.text


def test_public_client_completes_pkce_flow_and_records_signature_behavior(
    guarded_loopback: list[str], caplog: pytest.LogCaptureFixture
) -> None:
    with LoopbackIdentityProvider(
        signature_modes=["valid", "altered"],
        redirect_uri_path=REDIRECT_URI_PATH,
        expected_scopes=EXPECTED_SCOPES,
        expected_state=FIXED_STATE,
    ) as provider:
        redirect_uri = f"{provider.base_url}{REDIRECT_URI_PATH}"
        http = LoopbackHttpClient(provider.base_url)
        app = public_client(
            CLIENT_ID,
            f"{provider.authority_url}/{TENANT_ID}",
            instance_discovery=False,
            http_client=http,
        )
        try:
            with caplog.at_level(logging.DEBUG):
                flow = app.initiate_auth_code_flow(
                    scopes=SCOPES,
                    redirect_uri=redirect_uri,
                    state=FIXED_STATE,
                    response_mode="query",
                )
                assert "error" not in flow
                expected_nonce = _assert_authorization_request(flow, redirect_uri)
                signed_response, auth_uri = _authorized_response(flow, provider)
                assert auth_uri == str(flow["auth_uri"])
                signed = app.acquire_token_by_auth_code_flow(copy.deepcopy(flow), signed_response)
                assert "error" not in signed
                claims = signed["id_token_claims"]
                _assert_expected_identity(claims, expected_nonce)
                signed_token = signed["id_token"]
                _assert_valid_signature(signed_token, provider)

                altered_response, _ = _authorized_response(flow, provider)
                altered = app.acquire_token_by_auth_code_flow(copy.deepcopy(flow), altered_response)
                _assert_altered_signature_accepted(
                    altered["id_token"], signed_token, claims, altered
                )
                _assert_provider_exchange(provider, flow, http, redirect_uri)
        finally:
            http.close()

    assert guarded_loopback == []
    assert {event[0] for event in provider.network_events} == {
        "discovery",
        "authorization",
        "token",
    }
    assert all(event[1] == "127.0.0.1" for event in provider.network_events)
    assert all(url.startswith(provider.authority_url) for url in http.mapped_requests)
    _assert_secrets_not_logged(caplog, flow, provider)
    assert app.token_cache._cache == {}


def _assert_provider_exchange(
    provider: LoopbackIdentityProvider,
    flow: dict[str, object],
    http: LoopbackHttpClient,
    redirect_uri: str,
) -> None:
    assert provider.authorize_requests[0]["code_challenge"]
    assert provider.token_requests[0]["code_verifier"] == flow["code_verifier"]
    assert provider.token_requests[0]["redirect_uri"] == redirect_uri
    assert provider.token_requests[0]["client_id"] == CLIENT_ID
    requested_scopes = provider.token_requests[0]["scope"].split()
    assert len(requested_scopes) == len(set(requested_scopes))
    assert set(requested_scopes) == set(EXPECTED_SCOPES)
    assert "client_secret" not in provider.token_requests[0]
    assert len(provider.used_codes) == 2
    assert len(set(provider.used_codes)) == 2
    replay = http.post(
        f"{provider.authority_url}/{TENANT_ID}/oauth2/v2.0/token",
        data=provider.last_token_request,
        timeout=5,
    )
    assert replay.status_code == 400
    assert replay.json() == {"error": "invalid_grant"}


def test_non_loopback_guard_stops_before_dns_or_connect(guarded_loopback: list[str]) -> None:
    with pytest.raises(NonLoopbackAttempt):
        socket.getaddrinfo("outside.example.test", 443)
    assert guarded_loopback == ["DNS 'outside.example.test'"]


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("redirect_uri", "http://outside.example.test/callback"),
        ("redirect_uri", ""),
        ("scope", f"{SCOPES[0]} offline_access openid profile email"),
        ("scope", ""),
        ("client_id", ""),
        ("response_type", ""),
        ("response_mode", ""),
        ("state", ""),
        ("state", "different-state"),
        ("nonce", ""),
        ("nonce", "invalid-nonce"),
        ("code_challenge", ""),
        ("code_challenge", "invalid-challenge"),
        ("code_challenge_method", ""),
        ("client_info", ""),
    ],
)
def test_provider_rejects_undeclared_authorization_before_creating_state(
    guarded_loopback: list[str], name: str, value: str
) -> None:
    with LoopbackIdentityProvider(
        signature_modes=["valid"],
        redirect_uri_path=REDIRECT_URI_PATH,
        expected_scopes=EXPECTED_SCOPES,
        expected_state=FIXED_STATE,
    ) as provider:
        query = {
            "client_id": CLIENT_ID,
            "response_type": "code",
            "response_mode": "query",
            "redirect_uri": f"{provider.base_url}{REDIRECT_URI_PATH}",
            "scope": f"{SCOPES[0]} offline_access openid profile",
            "state": FIXED_STATE,
            "code_challenge": "A" * 43,
            "code_challenge_method": "S256",
            "nonce": "a" * 64,
            "client_info": "1",
        }
        invalid_query = {**query, name: value}
        assert _request_authorization(provider, invalid_query) == 400
        assert provider.authorize_requests == []
        assert provider._codes == {}
    assert guarded_loopback == []


def test_provider_freezes_paired_claims_across_a_second(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    moments = iter([1_800_000_000, 1_800_000_001])
    clock = lambda: next(moments)
    monkeypatch.setattr("auth_provider.time.time", clock)
    provider = LoopbackIdentityProvider(
        signature_modes=["valid", "altered"],
        redirect_uri_path=REDIRECT_URI_PATH,
        expected_scopes=EXPECTED_SCOPES,
        expected_state=FIXED_STATE,
        clock=clock,
    )

    valid = provider._id_token("expected-nonce")
    altered = provider._id_token("expected-nonce")

    assert valid.split(".")[:2] == altered.split(".")[:2]
    assert next(moments) == 1_800_000_001
