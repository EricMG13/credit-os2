"""Strict, process-local OpenID provider used by slice 3 Task 0 tests."""

from __future__ import annotations

import base64
import hashlib
import json
import re
import threading
import time
from collections.abc import Callable
from contextlib import AbstractContextManager
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Self, cast
from urllib.parse import parse_qs, urlencode, urlsplit

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

TENANT_ID = "00000000-0000-4000-8000-000000000101"
OBJECT_ID = "00000000-0000-4000-8000-000000000102"
CLIENT_ID = "00000000-0000-4000-8000-000000000103"
DISPLAY_NAME = "A. Kovac"
EMAIL = "a.kovac@example.org"
_IDENTITY_NAME_FIELDS = ("given_name", "family_name")


def _name_claims(parts: tuple[str | None, str | None]) -> dict[str, str]:
    """Optional identity names, omitted from the default token fixture."""
    return {
        name: value
        for name, value in zip(_IDENTITY_NAME_FIELDS, parts, strict=True)
        if value is not None
    }


class ProviderRejected(Exception):
    """A protocol request does not match the declared provider scenario."""


class LoopbackHttpClient:
    """MSAL's injected transport for its HTTPS authority, backed only by this HTTP loopback."""

    def __init__(self, base_url: str) -> None:
        import requests

        self._session = requests.Session()
        self._session.trust_env = False
        self._base_url = base_url
        self.mapped_requests: list[str] = []

    def close(self) -> None:
        self._session.close()

    def get(self, url: str, **kwargs: Any) -> Any:
        allowed_paths = {
            f"/{TENANT_ID}/v2.0/.well-known/openid-configuration",
            "/keys",
        }
        return self._session.get(self._map_url(url, allowed_paths), **kwargs)

    def post(self, url: str, **kwargs: Any) -> Any:
        allowed_paths = {f"/{TENANT_ID}/oauth2/v2.0/token"}
        return self._session.post(self._map_url(url, allowed_paths), **kwargs)

    def _map_url(self, url: str, allowed_paths: set[str]) -> str:
        parsed = urlsplit(url)
        origin = f"https://{parsed.netloc}"
        expected_origin = f"https://127.0.0.1:{urlsplit(self._base_url).port}"
        if (
            parsed.scheme != "https"
            or origin != expected_origin
            or parsed.path not in allowed_paths
            or parsed.query
        ):
            raise ProviderRejected("MSAL attempted a non-declared provider URL")
        self.mapped_requests.append(url)
        return self._base_url + (parsed.path or "/") + (f"?{parsed.query}" if parsed.query else "")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _one(query: dict[str, list[str]], name: str) -> str:
    values = query.get(name, [])
    if len(values) != 1:
        raise ProviderRejected(f"expected one {name} value")
    return values[0]


def _query_values(encoded: str) -> dict[str, str]:
    query = parse_qs(encoded, keep_blank_values=True, strict_parsing=True)
    return {name: _one(query, name) for name in query}


class LoopbackIdentityProvider(AbstractContextManager["LoopbackIdentityProvider"]):
    """A fail-closed OIDC code provider bound only to IPv4 loopback."""

    def __init__(
        self,
        *,
        signature_modes: list[str],
        redirect_uri_path: str,
        expected_scopes: tuple[str, ...],
        expected_state: str | None,
        clock: Callable[[], float] = time.time,
    ) -> None:
        if not signature_modes or any(mode not in {"valid", "altered"} for mode in signature_modes):
            raise ValueError("declare one valid or altered signature per authorization")
        if not redirect_uri_path.startswith("/") or "?" in redirect_uri_path:
            raise ValueError("declare an absolute callback path without a query")
        if not expected_scopes or any(not scope for scope in expected_scopes):
            raise ValueError("declare every expected nonempty scope")
        if expected_state is not None and not expected_state:
            raise ValueError("declare a nonempty expected state")
        self._signature_modes = list(signature_modes)
        self._redirect_uri_path = redirect_uri_path
        self._expected_scopes = expected_scopes
        self._expected_state = expected_state
        self._expected_redirect_uri: str | None = None
        self._include_session_state = False
        self._next_identity_names: tuple[str | None, str | None] = (None, None)
        self._next_identity_mode = "valid"
        self._issued_at = int(clock())
        self._private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self._server: HTTPServer | None = None
        self._thread: threading.Thread | None = None
        self.base_url = ""
        self._code_number = 0
        self._codes: dict[str, dict[str, str]] = {}
        self.authorize_requests: list[dict[str, str]] = []
        self.token_requests: list[dict[str, str]] = []
        self.used_codes: list[str] = []
        self.issued_tokens: list[str] = []
        self.access_tokens: list[str] = []
        self.refresh_tokens: list[str] = []
        self.network_events: list[tuple[str, str]] = []
        self.last_token_request: dict[str, str] = {}

    @property
    def credential_material(self) -> tuple[str, ...]:
        """Return every credential value issued or submitted by this provider."""
        submitted = tuple(
            value
            for request in self.token_requests
            for field in ("code", "code_verifier")
            if (value := request.get(field)) is not None
        )
        return (
            *self._codes,
            *submitted,
            *self.issued_tokens,
            *self.access_tokens,
            *self.refresh_tokens,
        )

    @property
    def authority_url(self) -> str:
        return self.base_url.replace("http://", "https://", 1)

    @property
    def expected_redirect_uri(self) -> str:
        return self._expected_redirect_uri or f"{self.base_url}{self._redirect_uri_path}"

    def expect_flow(
        self,
        *,
        state: str,
        redirect_uri: str,
        identity_mode: str = "valid",
        include_session_state: bool = False,
        name_parts: tuple[str | None, str | None] = (None, None),
    ) -> None:
        """Declare the route's concrete browser state and listener URI for one test flow."""
        parsed = urlsplit(redirect_uri)
        if (
            not state
            or not state.isascii()
            or parsed.scheme != "http"
            or parsed.hostname != "localhost"
            or parsed.port is None
            or parsed.path != self._redirect_uri_path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("declare a localhost callback URI and nonempty ASCII state")
        if identity_mode not in {
            "valid",
            "wrong_issuer",
            "wrong_tenant",
            "wrong_audience",
            "wrong_nonce",
        }:
            raise ValueError("declare one supported identity-claim response")
        if not isinstance(name_parts, tuple) or len(name_parts) != 2:
            raise ValueError("declare given_name and family_name as a pair")
        given_name, family_name = name_parts
        for label, value in (("given name", given_name), ("family name", family_name)):
            if value is not None and (not isinstance(value, str) or not value):
                raise ValueError(f"declare a nonempty {label} or omit it")
        self._expected_state = state
        self._expected_redirect_uri = redirect_uri
        self._next_identity_mode = identity_mode
        self._include_session_state = include_session_state
        self._next_identity_names = (given_name, family_name)

    def declare_signature(self, mode: str) -> None:
        """Permit one additional, explicitly declared signature response in a test flow."""
        if mode not in {"valid", "altered"}:
            raise ValueError("declare a valid or altered signature response")
        self._signature_modes.append(mode)

    def __enter__(self) -> Self:
        provider = self

        class RequestHandler(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.1"

            def log_message(self, format: str, *args: Any) -> None:
                # http.server's default logs the request target. Keep only the route path.
                path = urlsplit(self.path).path
                provider_log.info("provider %s %s", self.command, path)

            def send_json(self, status: int, payload: dict[str, Any]) -> None:
                data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Connection", "close")
                self.end_headers()
                self.wfile.write(data)
                self.close_connection = True

            def do_GET(self) -> None:
                path = urlsplit(self.path).path
                provider.network_events.append(("GET", self.client_address[0]))
                if path == f"/{TENANT_ID}/v2.0/.well-known/openid-configuration":
                    provider.network_events[-1] = ("discovery", self.client_address[0])
                    self.send_json(200, provider.discovery_document())
                    return
                if path == "/authorize":
                    try:
                        query = _query_values(urlsplit(self.path).query)
                        location = provider.authorize(query)
                    except ProviderRejected:
                        self.send_json(400, {"error": "invalid_request"})
                        return
                    provider.network_events[-1] = ("authorization", self.client_address[0])
                    self.send_response(302)
                    self.send_header("Location", location)
                    self.send_header("Content-Length", "0")
                    self.send_header("Connection", "close")
                    self.end_headers()
                    self.close_connection = True
                    return
                if path == "/keys":
                    self.send_json(200, provider.jwks())
                    return
                self.send_json(404, {"error": "not_found"})

            def do_POST(self) -> None:
                path = urlsplit(self.path).path
                provider.network_events.append(("POST", self.client_address[0]))
                if path != f"/{TENANT_ID}/oauth2/v2.0/token":
                    self.send_json(404, {"error": "not_found"})
                    return
                provider.network_events[-1] = ("token", self.client_address[0])
                try:
                    length = int(self.headers.get("Content-Length", ""))
                    body = self.rfile.read(length).decode("ascii")
                    form = _query_values(body)
                    token_response = provider.exchange(form)
                except (UnicodeDecodeError, ValueError, ProviderRejected):
                    self.send_json(400, {"error": "invalid_grant"})
                    return
                self.send_json(200, token_response)

        import logging

        provider_log = logging.getLogger("tests.auth_provider")
        self._server = HTTPServer(("127.0.0.1", 0), RequestHandler)
        self._server.timeout = 0.2
        host, port = cast(tuple[str, int], self._server.server_address)
        self.base_url = f"http://{host}:{port}"
        self._thread = threading.Thread(
            target=self._server.serve_forever, args=(0.02,), name="loopback-oidc", daemon=True
        )
        self._thread.start()
        return self

    def __exit__(self, exc_type: object, exc_value: object, traceback: object) -> None:
        if self._server is not None:
            self._server.shutdown()
            self._server.server_close()
        if self._thread is not None:
            self._thread.join(timeout=5)
            if self._thread.is_alive():
                raise RuntimeError("the loopback provider did not stop")

    def public_key(self) -> Any:
        return self._private_key.public_key()

    def discovery_document(self) -> dict[str, Any]:
        root = f"{self.authority_url}/{TENANT_ID}"
        return {
            "issuer": f"{root}/v2.0",
            "authorization_endpoint": f"{self.authority_url}/authorize",
            "token_endpoint": f"{root}/oauth2/v2.0/token",
            "jwks_uri": f"{self.authority_url}/keys",
            "response_types_supported": ["code"],
            "response_modes_supported": ["query"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": ["RS256"],
            "scopes_supported": ["openid", "profile"],
            "token_endpoint_auth_methods_supported": ["none"],
            "code_challenge_methods_supported": ["S256"],
        }

    def _validate_authorization(self, query: dict[str, str]) -> None:
        expected = {
            "client_id",
            "response_type",
            "response_mode",
            "redirect_uri",
            "scope",
            "state",
            "code_challenge",
            "code_challenge_method",
            "nonce",
            "client_info",
        }
        if set(query) != expected:
            raise ProviderRejected("unexpected authorization parameters")
        if any(not query[name] for name in expected):
            raise ProviderRejected("required authorization parameter is empty")
        if (
            query["client_id"] != CLIENT_ID
            or query["response_type"] != "code"
            or query["response_mode"] != "query"
        ):
            raise ProviderRejected("unexpected client or response type")
        if query["redirect_uri"] != self.expected_redirect_uri:
            raise ProviderRejected("redirect URI was not declared")
        scopes = query["scope"].split()
        if len(scopes) != len(self._expected_scopes) or set(scopes) != set(self._expected_scopes):
            raise ProviderRejected("scope set was not declared")
        if self._expected_state is not None and query["state"] != self._expected_state:
            raise ProviderRejected("state was not declared")
        if query["client_info"] != "1":
            raise ProviderRejected("client metadata request was not declared")
        if (
            query["code_challenge_method"] != "S256"
            or re.fullmatch(r"[A-Za-z0-9_-]{43}", query["code_challenge"]) is None
        ):
            raise ProviderRejected("S256 PKCE is required")
        if re.fullmatch(r"[0-9a-f]{64}", query["nonce"]) is None:
            raise ProviderRejected("nonce does not match the declared digest form")

    def authorize(self, query: dict[str, str]) -> str:
        self._validate_authorization(query)
        signature_mode = self._signature_modes.pop(0) if self._signature_modes else None
        if signature_mode is None:
            raise ProviderRejected("this authorization was not declared")
        identity_mode = self._next_identity_mode
        self._next_identity_mode = "valid"
        given_name, family_name = self._next_identity_names
        self._next_identity_names = (None, None)
        self.authorize_requests.append(dict(query))
        self._code_number += 1
        code = f"test-code-{self._code_number}-7dba"
        self._codes[code] = {
            "challenge": query["code_challenge"],
            "redirect_uri": query["redirect_uri"],
            "nonce": query["nonce"],
            "scope": query["scope"],
            "signature_mode": signature_mode,
            "identity_mode": identity_mode,
        }
        if given_name is not None:
            self._codes[code]["given_name"] = given_name
        if family_name is not None:
            self._codes[code]["family_name"] = family_name
        response = {"code": code, "state": query["state"]}
        if self._include_session_state:
            response["session_state"] = f"opaque-session-{self._code_number}"
        return f"{query['redirect_uri']}?{urlencode(response)}"

    def exchange(self, form: dict[str, str]) -> dict[str, Any]:
        expected = {
            "grant_type",
            "client_id",
            "code",
            "redirect_uri",
            "code_verifier",
            "scope",
            "client_info",
        }
        if set(form) != expected or "client_secret" in form:
            raise ProviderRejected("unexpected token request parameters")
        if (
            form["grant_type"] != "authorization_code"
            or form["client_id"] != CLIENT_ID
            or form["client_info"] != "1"
        ):
            raise ProviderRejected("unexpected token request client")
        requested_scopes = form["scope"].split()
        if (
            not requested_scopes
            or len(requested_scopes) != len(set(requested_scopes))
            or set(requested_scopes) != set(self._expected_scopes)
        ):
            raise ProviderRejected("token request scope was not declared")
        code = form["code"]
        details = self._codes.get(code)
        if details is None or code in self.used_codes:
            raise ProviderRejected("unknown or used code")
        if details["redirect_uri"] != form["redirect_uri"]:
            raise ProviderRejected("redirect URI changed")
        challenge = _b64url(hashlib.sha256(form["code_verifier"].encode("ascii")).digest())
        if challenge != details["challenge"]:
            raise ProviderRejected("PKCE verifier did not match")
        self.used_codes.append(code)
        self.last_token_request = dict(form)
        self.token_requests.append(dict(form))
        id_token = self._id_token(
            details["nonce"],
            details["identity_mode"],
            given_name=details.get("given_name"),
            family_name=details.get("family_name"),
        )
        if details["signature_mode"] == "altered":
            id_token = self._alter_signature(id_token)
        self.issued_tokens.append(id_token)
        access_token = f"opaque-test-access-{len(self.access_tokens) + 1}"
        self.access_tokens.append(access_token)
        refresh_token = f"opaque-test-refresh-{len(self.refresh_tokens) + 1}"
        self.refresh_tokens.append(refresh_token)
        return {
            "token_type": "Bearer",
            "expires_in": 3600,
            "scope": details["scope"],
            "access_token": access_token,
            "refresh_token": refresh_token,
            "id_token": id_token,
        }

    def _id_token(
        self,
        nonce: str,
        identity_mode: str = "valid",
        *,
        given_name: str | None = None,
        family_name: str | None = None,
    ) -> str:
        now = self._issued_at
        claims = {
            "iss": f"{self.authority_url}/{TENANT_ID}/v2.0",
            "aud": CLIENT_ID,
            "sub": OBJECT_ID,
            "tid": TENANT_ID,
            "oid": OBJECT_ID,
            "name": DISPLAY_NAME,
            "preferred_username": EMAIL,
            # MSAL already hashes the raw nonce stored in its flow for the authorization
            # request; Entra returns that request nonce unchanged in the ID token.
            "nonce": nonce,
            "iat": now,
            "exp": now + 3600,
            "ver": "2.0",
        }
        claims.update(_name_claims((given_name, family_name)))
        if identity_mode == "wrong_issuer":
            claims["iss"] = f"{claims['iss']}/unexpected"
        elif identity_mode == "wrong_tenant":
            claims["tid"] = "00000000-0000-4000-8000-000000000199"
        elif identity_mode == "wrong_audience":
            claims["aud"] = "00000000-0000-4000-8000-000000000199"
        elif identity_mode == "wrong_nonce":
            claims["nonce"] = hashlib.sha256(b"wrong declared nonce").hexdigest()
        header = {"alg": "RS256", "typ": "JWT", "kid": "loopback-key-1"}
        encoded_header = _b64url(json.dumps(header, separators=(",", ":")).encode())
        encoded_claims = _b64url(json.dumps(claims, separators=(",", ":")).encode())
        signing_input = f"{encoded_header}.{encoded_claims}".encode("ascii")
        signature = self._private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
        return f"{encoded_header}.{encoded_claims}.{_b64url(signature)}"

    @staticmethod
    def _alter_signature(token: str) -> str:
        encoded_header, encoded_claims, encoded_signature = token.split(".")
        padding_size = -len(encoded_signature) % 4
        signature = bytearray(base64.urlsafe_b64decode(encoded_signature + "=" * padding_size))
        signature[0] ^= 1
        return f"{encoded_header}.{encoded_claims}.{_b64url(bytes(signature))}"

    def jwks(self) -> dict[str, list[dict[str, str]]]:
        public_numbers = self._private_key.public_key().public_numbers()
        n = public_numbers.n.to_bytes((public_numbers.n.bit_length() + 7) // 8, "big")
        e = public_numbers.e.to_bytes((public_numbers.e.bit_length() + 7) // 8, "big")
        return {
            "keys": [
                {
                    "kty": "RSA",
                    "use": "sig",
                    "alg": "RS256",
                    "kid": "loopback-key-1",
                    "n": _b64url(n),
                    "e": _b64url(e),
                }
            ]
        }
