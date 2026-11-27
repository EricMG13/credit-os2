"""The exact browser-facing Entra and passcode routes for a configured live server.

The router is constructed per server. It holds only the short-lived, one-use MSAL flows; account
and session state live in the private account store. No identity-provider credential, MSAL error
text, callback query or request body is logged or reflected to a browser.
"""

from __future__ import annotations

import hashlib
import html
import logging
import re
import ssl
import urllib.parse
from collections.abc import Mapping
from datetime import UTC, datetime
from http.cookies import CookieError, SimpleCookie
from pathlib import Path
from typing import Any

from deploy_workflow import http_base
from deploy_workflow.accounts import registration, sessions, store
from deploy_workflow.accounts.entra import EntraRuntimeConfig
from deploy_workflow.accounts.pending_flows import PendingFlows

from . import auth_gate

log = logging.getLogger(__name__)

FLOW_COOKIE = "credit_os_signin_flow"
FLOW_COOKIE_PATH = "/auth/callback"
FLOW_LIFETIME = 600
_FLOW_KEY = re.compile(r"[A-Za-z0-9_-]{43}", re.ASCII)
_FIXED_SIGN_IN_ERROR = "sign in could not be completed"
_MAX_CALLBACK_CODE = 4096
_MAX_CALLBACK_STATE = 512
_MAX_PASSCODE_BODY = 16384
_ACCOUNT_MUTATION = re.compile(
    r"/auth/accounts/([1-9][0-9]{0,17})/(disable|profile-type)", re.ASCII
)
_MAX_ACCOUNT_BODY = 4096


def _account_payload(account: store.Account) -> dict[str, object]:
    return {
        "id": account.id,
        "display_name": account.display_name,
        "profile_type": account.profile_type,
    }


def _account_reply(account: store.Account) -> http_base.Reply:
    return http_base.Reply(200, {"account": _account_payload(account)})


def _cookie_value(headers: list[str], name: str, pattern: re.Pattern[str]) -> str | None:
    """Return exactly one well-formed opaque cookie, refusing duplicate or malformed headers."""
    if sum(header.count(name) for header in headers) != 1:
        return None
    header = next((item for item in headers if name in item), None)
    if header is None:
        return None
    jar: SimpleCookie = SimpleCookie()
    try:
        jar.load(header)
    except CookieError:
        return None
    if name not in jar:
        return None
    value = jar[name].value
    return value if pattern.fullmatch(value) else None


def _security_headers() -> dict[str, str]:
    return {"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"}


def _plain(
    status: int, message: str, *, headers: Mapping[str, str] | None = None
) -> http_base.Reply:
    return http_base.Reply(
        status,
        message.encode("utf-8"),
        {"Content-Type": "text/plain; charset=utf-8", **_security_headers(), **(headers or {})},
    )


def _cookie(*, name: str, value: str, path: str, max_age: int, secure: bool) -> str:
    attributes = [
        f"{name}={value}",
        f"Path={path}",
        f"Max-Age={max_age}",
        "HttpOnly",
        "SameSite=Lax",
    ]
    if secure:
        attributes.append("Secure")
    return "; ".join(attributes)


def _is_secure(handler: http_base.Handler) -> bool:
    return isinstance(handler.connection, ssl.SSLSocket)


def _callback_uri(handler: http_base.Handler) -> str:
    server = handler.server
    port = getattr(server, "advertised_port", None)
    if not isinstance(port, int) or not 1 <= port <= 65535:
        raise ValueError("the application listener has no usable port")
    return f"http://localhost:{port}/auth/callback"


def _canonical_localhost(
    handler: http_base.Handler, url: urllib.parse.SplitResult
) -> http_base.Reply | None:
    """Move loopback-IP browser navigation onto the cookie's canonical localhost host."""
    server = handler.server
    port = getattr(server, "advertised_port", None)
    hosts = handler.headers.get_all("Host") or []
    if (
        len(hosts) == 1
        and port is not None
        and auth_gate.loopback_ip_host(hosts[0], port)
        and handler.command == "GET"
        and not url.query
        and url.path in {"/sign-in", "/auth/start"}
    ):
        location = f"http://localhost:{port}{url.path}"
        return http_base.Reply(302, b"", {"Location": location, **_security_headers()})
    return None


def _query_pair(
    query: str,
    *,
    names: frozenset[str],
    optional: frozenset[str] = frozenset(),
) -> dict[str, str] | None:
    if not query or re.search(r"%(?![0-9A-Fa-f]{2})", query):
        return None
    try:
        values = urllib.parse.parse_qs(
            query,
            keep_blank_values=True,
            strict_parsing=True,
            encoding="utf-8",
            errors="strict",
            max_num_fields=len(names | optional),
        )
    except (UnicodeDecodeError, ValueError):
        return None
    if not names <= set(values) or not set(values) <= names | optional:
        return None
    if any(len(items) != 1 for items in values.values()):
        return None
    result = {name: items[0] for name, items in values.items()}
    if any(not item or not item.isascii() or not item.isprintable() for item in result.values()):
        return None
    return result


class AuthRoutes:
    """A per-server router backed by one configured MSAL factory and private account folder."""

    def __init__(self, config: EntraRuntimeConfig, web_dist: Path) -> None:
        self._config = config
        self._web_dist = web_dist.resolve()
        self._pending = PendingFlows()

    def get(
        self,
        handler: http_base.Handler,
        url: urllib.parse.SplitResult,
        account: store.Account | None = None,
    ) -> http_base.Reply | None:
        """Answer only the named GET routes; callers preserve their normal route fallback."""
        if url.path == "/sign-in":
            return self._get_sign_in(handler, url)
        if url.path == "/auth/start":
            return self._get_start(handler, url)
        if url.path == "/auth/callback":
            return self._get_callback(handler, url)
        if url.path == "/auth/accounts":
            return self._get_accounts(url, account)
        return None

    def _get_accounts(
        self, url: urllib.parse.SplitResult, account: store.Account | None
    ) -> http_base.Reply:
        if url.query or url.fragment:
            return http_base.refuse(400, "invalid accounts request")
        if account is None:
            return http_base.refuse(401, "sign in first")
        return self._accounts_directory()

    def _get_sign_in(
        self, handler: http_base.Handler, url: urllib.parse.SplitResult
    ) -> http_base.Reply:
        if url.query or url.fragment:
            return _plain(400, _FIXED_SIGN_IN_ERROR)
        if redirect := _canonical_localhost(handler, url):
            return redirect
        return self._sign_in_page(200)

    def _get_start(
        self, handler: http_base.Handler, url: urllib.parse.SplitResult
    ) -> http_base.Reply:
        if url.query or url.fragment:
            return _plain(400, _FIXED_SIGN_IN_ERROR)
        return self._start(handler)

    def _get_callback(
        self, handler: http_base.Handler, url: urllib.parse.SplitResult
    ) -> http_base.Reply:
        hosts = handler.headers.get_all("Host") or []
        port = getattr(handler.server, "advertised_port", None)
        if len(hosts) == 1 and port is not None and auth_gate.loopback_ip_host(hosts[0], port):
            return self._sign_in_page(400, "the sign-in request could not be verified")
        return self._callback(handler, url.query)

    def post(
        self,
        handler: http_base.Handler,
        url: urllib.parse.SplitResult,
        account: store.Account | None,
    ) -> http_base.Reply | None:
        """Answer only configured passcode, sign-out and account mutation POSTs."""
        if url.path == "/auth/passcode":
            return self._post_passcode(handler, url, account)
        if url.path == "/auth/sign-out":
            if url.query or url.fragment:
                return _plain(400, "invalid sign-out request")
            return self._sign_out(handler)
        match = _ACCOUNT_MUTATION.fullmatch(url.path)
        if match is not None:
            return self._post_account_mutation(handler, url, account, match)
        return None

    def _post_passcode(
        self,
        handler: http_base.Handler,
        url: urllib.parse.SplitResult,
        account: store.Account | None,
    ) -> http_base.Reply:
        if account is None:
            return http_base.refuse(401, "sign in first")
        if url.query or url.fragment:
            return _plain(400, "invalid passcode request")
        return self._passcode(handler, account)

    def _post_account_mutation(
        self,
        handler: http_base.Handler,
        url: urllib.parse.SplitResult,
        account: store.Account | None,
        match: re.Match[str],
    ) -> http_base.Reply:
        if account is None or account.disabled:
            return http_base.refuse(401, "sign in first")
        if account.profile_type != "admin":
            return http_base.refuse(403, "only an Admin can do this")
        if url.query or url.fragment:
            return http_base.refuse(400, "invalid account request")
        return self._mutate_account(handler, account, int(match[1]), match[2])

    def _accounts_directory(self) -> http_base.Reply:
        db = store.open_db(self._config.accounts_dir)
        try:
            return http_base.Reply(200, {"accounts": store.account_directory(db)})
        finally:
            db.close()

    def _mutate_account(
        self,
        handler: http_base.Handler,
        actor: store.Account,
        account_id: int,
        action: str,
    ) -> http_base.Reply:
        profile_type: str | None = None
        if action == "profile-type":
            try:
                value = handler.json_body(_MAX_ACCOUNT_BODY)
            except http_base.Reply:
                return http_base.refuse(400, "invalid account request")
            if (
                not isinstance(value, dict)
                or set(value) != {"profile_type"}
                or not isinstance(value["profile_type"], str)
                or value["profile_type"] not in store.PROFILE_TYPES
            ):
                return http_base.refuse(400, "invalid account request")
            profile_type = value["profile_type"]
        else:
            length_headers = handler.headers.get_all("Content-Length") or []
            if length_headers or handler.headers.get("Transfer-Encoding") is not None:
                try:
                    length = handler.content_length()
                except http_base.Reply:
                    return http_base.refuse(400, "invalid account request")
                if length != 0:
                    return http_base.refuse(400, "invalid account request")

        db = store.open_db(self._config.accounts_dir)
        try:
            try:
                if action == "disable":
                    summary = store.disable_account_as_admin(db, actor.id, account_id)
                else:
                    assert profile_type is not None
                    summary = store.set_profile_type_as_admin(
                        db, actor.id, account_id, profile_type
                    )
            except (store.ActorDisabled, store.NotAdmin, store.LastAdmin, store.Missing) as error:
                return self._mutation_refusal(error)
            return http_base.Reply(200, {"account": summary})
        finally:
            db.close()

    @staticmethod
    def _mutation_refusal(error: store.StoreError) -> http_base.Reply:
        if isinstance(error, store.ActorDisabled):
            return http_base.refuse(401, "sign in first")
        if isinstance(error, store.NotAdmin):
            return http_base.refuse(403, "only an Admin can do this")
        if isinstance(error, store.LastAdmin):
            return http_base.refuse(409, "keep at least one enabled Admin")
        if isinstance(error, store.Missing):
            return http_base.refuse(404, "account not found")
        raise AssertionError("unexpected account refusal")

    def _sign_in_page(self, status: int, reason: str | None = None) -> http_base.Reply:
        reply = http_base.contained_file(
            self._web_dist,
            "sign-in.html",
            direct=True,
            headers={"Content-Type": "text/html; charset=utf-8", **_security_headers()},
        )
        if not isinstance(reply.body, bytes):
            raise TypeError("the sign-in page did not resolve to bytes")
        page = reply.body
        marker = b"<!-- sign-in-error -->"
        if page.count(marker) != 1:
            raise RuntimeError("the sign-in page must contain its one error marker")
        if reason is not None:
            page = page.replace(marker, html.escape(reason, quote=True).encode("utf-8"), 1)
        return http_base.Reply(status, page, reply.headers)

    def _start(self, handler: http_base.Handler) -> http_base.Reply:
        if redirect := _canonical_localhost(handler, urllib.parse.urlsplit(handler.path)):
            return redirect
        redirect_uri = _callback_uri(handler)
        authority = f"https://login.microsoftonline.com/{self._config.tenant_id}"
        try:
            provider = self._config.provider_factory(self._config.client_id, authority)
            flow = provider.application.initiate_auth_code_flow(
                scopes=[],
                redirect_uri=redirect_uri,
                response_mode="query",
            )
        except Exception as error:  # noqa: BLE001 - MSAL errors can carry token response material
            # MSAL and its transport can expose callback and token material in exception text.
            # Convert this specific external-flow failure to a fixed response and log only its
            # class, never the exception message or traceback.
            log.warning("MSAL authorization start failed (%s)", type(error).__name__)
            return _plain(503, _FIXED_SIGN_IN_ERROR)
        if not isinstance(flow, dict):
            log.warning("MSAL authorization start returned an incomplete flow")
            return _plain(503, _FIXED_SIGN_IN_ERROR)
        auth_uri = flow.get("auth_uri")
        if (
            not isinstance(auth_uri, str)
            or urllib.parse.urlsplit(auth_uri).scheme != "https"
            or not isinstance(flow.get("state"), str)
        ):
            log.warning("MSAL authorization start returned an incomplete flow")
            return _plain(503, _FIXED_SIGN_IN_ERROR)
        key = self._pending.start(flow, now=datetime.now(UTC))
        if key is None:
            return _plain(503, "too many sign-in attempts are pending")
        return http_base.Reply(
            302,
            b"",
            {
                "Location": auth_uri,
                "Set-Cookie": _cookie(
                    name=FLOW_COOKIE,
                    value=key,
                    path=FLOW_COOKIE_PATH,
                    max_age=FLOW_LIFETIME,
                    secure=_is_secure(handler),
                ),
                **_security_headers(),
            },
        )

    def _callback(self, handler: http_base.Handler, query: str) -> http_base.Reply:
        pending = self._callback_flow(handler, query)
        if pending is None:
            return self._sign_in_page(400, "the sign-in request could not be verified")
        values, flow = pending
        try:
            provider = self._config.provider_factory(
                self._config.client_id,
                f"https://login.microsoftonline.com/{self._config.tenant_id}",
            )
            result = provider.application.acquire_token_by_auth_code_flow(
                flow, {name: values[name] for name in ("code", "state")}
            )
        except Exception as error:  # noqa: BLE001 - MSAL errors can carry token response material
            # MSAL and its HTTP transport may include authorization values in exception text.
            # Keep the failure visible as a warning without writing the exception text.
            log.warning("MSAL authorization callback failed (%s)", type(error).__name__)
            reason = (
                registration.DENIAL
                if isinstance(error, (ValueError, RuntimeError))
                else _FIXED_SIGN_IN_ERROR
            )
            return self._sign_in_page(400, reason)
        if not isinstance(result, Mapping) or result.get("error"):
            log.warning("MSAL authorization callback returned no identity claims")
            return self._sign_in_page(400, _FIXED_SIGN_IN_ERROR)
        claims = result.get("id_token_claims")
        nonce = flow.get("nonce")
        if (
            not isinstance(claims, Mapping)
            or not isinstance(nonce, str)
            or not nonce
            or not nonce.isascii()
            or claims.get("nonce") != hashlib.sha256(nonce.encode("ascii")).hexdigest()
        ):
            return self._sign_in_page(400, registration.DENIAL)
        now = datetime.now(UTC)
        db = store.open_db(self._config.accounts_dir)
        try:
            try:
                account = registration.register_identity(
                    db,
                    claims,
                    tenant_id=self._config.tenant_id,
                    issuer=provider.issuer,
                    audience=self._config.client_id,
                    now=now,
                )
            except registration.RegistrationDenied:
                return self._sign_in_page(400, registration.DENIAL)
            token = sessions.mint_session(db, account.id, now=now)
        finally:
            db.close()
        return http_base.Reply(
            303,
            b"",
            {
                "Location": "/",
                "Set-Cookie": _cookie(
                    name=auth_gate.COOKIE,
                    value=token,
                    path="/",
                    max_age=int(sessions.SESSION_LENGTH.total_seconds()),
                    secure=_is_secure(handler),
                ),
                **_security_headers(),
            },
        )

    def _callback_flow(
        self, handler: http_base.Handler, query: str
    ) -> tuple[dict[str, str], dict[str, Any]] | None:
        values = _query_pair(
            query,
            names=frozenset({"code", "state"}),
            optional=frozenset({"session_state"}),
        )
        if (
            values is None
            or len(values["code"]) > _MAX_CALLBACK_CODE
            or len(values["state"]) > _MAX_CALLBACK_STATE
            or ("session_state" in values and len(values["session_state"]) > _MAX_CALLBACK_STATE)
        ):
            return None
        cookie_headers = handler.headers.get_all("Cookie") or []
        flow_key = _cookie_value(cookie_headers, FLOW_COOKIE, _FLOW_KEY)
        if flow_key is None:
            return None
        flow = self._pending.take(flow_key, values["state"], now=datetime.now(UTC))
        if flow is None:
            return None
        return values, flow

    def _passcode(
        self, handler: http_base.Handler, account: store.Account | None
    ) -> http_base.Reply:
        token = auth_gate.session_token(handler.headers.get_all("Cookie") or [])
        if account is None or token is None:
            return http_base.refuse(401, "sign in first")
        passcode = self._passcode_value(handler)
        db = store.open_db(self._config.accounts_dir)
        try:
            attempt = registration.redeem_passcode(
                db, token, passcode=passcode, now=datetime.now(UTC)
            )
            refreshed = store.account_by_id(db, account.id)
            if attempt is None or refreshed is None or refreshed.disabled:
                return http_base.refuse(401, "sign in first")
            if attempt == "wrong passcode":
                return http_base.refuse(403, "wrong passcode")
            if attempt == "locked":
                return http_base.refuse(429, "locked")
            return _account_reply(refreshed)
        finally:
            db.close()

    @staticmethod
    def _passcode_value(handler: http_base.Handler) -> str:
        value = handler.json_body(_MAX_PASSCODE_BODY)
        if (
            not isinstance(value, dict)
            or set(value) != {"passcode"}
            or not isinstance(value["passcode"], str)
            or not value["passcode"]
        ):
            raise http_base.refuse(400, "invalid passcode request")
        passcode = value["passcode"]
        try:
            passcode.encode("utf-8")
        except UnicodeEncodeError:
            raise http_base.refuse(400, "invalid passcode request") from None
        return passcode

    def _sign_out(self, handler: http_base.Handler) -> http_base.Reply:
        token = auth_gate.session_token(handler.headers.get_all("Cookie") or [])
        if token is not None:
            db = store.open_db(self._config.accounts_dir)
            try:
                sessions.end_session(db, token)
            finally:
                db.close()
        return http_base.Reply(
            204,
            b"",
            {
                "Set-Cookie": _cookie(
                    name=auth_gate.COOKIE,
                    value="",
                    path="/",
                    max_age=0,
                    secure=_is_secure(handler),
                ),
                **_security_headers(),
            },
        )
