"""The application's one sign-in check, run by its handler's ``check_origin`` after the checks every
request passes (target, ``Host``, ``Sec-Fetch-Site``, ``Origin``) and before ``Transfer-Encoding``
and the route.

Only ``GET`` of a path in ``OPEN_GETS`` passes without a session; the match is exact on method and
path. Nothing here logs, prints or replies with a cookie, a token or a hash.
"""

from __future__ import annotations

import urllib.parse
from collections.abc import Callable
from datetime import UTC, datetime
from http.cookies import CookieError, SimpleCookie
from pathlib import Path

from deploy_workflow import http_base
from deploy_workflow.accounts import sessions, store

__all__ = [
    "COOKIE",
    "LIBRARY_PATHS",
    "OPEN_GETS",
    "SIGN_IN_ASSETS",
    "check",
    "session_account",
    "session_token",
]

COOKIE = "credit_os_session"
# Slice 3 names the sign-in page's files here, and /auth/start and /auth/callback.
SIGN_IN_ASSETS: frozenset[str] = frozenset()
OPEN_GETS = frozenset({"/sign-in", "/auth/me"}) | SIGN_IN_ASSETS
LIBRARY_PATHS = frozenset({"/library", "/library/", "/library/index.html", "/library.html"})


def session_token(headers: list[str]) -> str | None:
    """The one well-formed session value among the ``Cookie`` headers, else None.

    A header that does not parse, or has no such cookie, counts as absent; the name twice (in one
    header or across headers) is no session. Never raises."""
    # Every occurrence of the text, wherever it sits (SimpleCookie starts a pair after a space
    # alone, and keeps only the last of a repeated name). More than one is no session, and the
    # parser is not consulted. By design this fails closed: a cookie whose name or value merely
    # contains the text also blocks sign-in.
    if sum(header.count(COOKIE) for header in headers) != 1:
        return None
    # The count rule leaves exactly one occurrence, so one header holds the name: parse it alone.
    header = next(h for h in headers if COOKIE in h)
    jar: SimpleCookie = SimpleCookie()
    try:
        jar.load(header)
    except CookieError:
        return None  # an unparseable header holds no session cookie
    if COOKIE not in jar or not sessions.TOKEN.fullmatch(jar[COOKIE].value):
        return None
    return jar[COOKIE].value


def session_account(headers: list[str], folder: Path) -> store.Account | None:
    """The account the request's cookie names. A store error propagates (it is not 'no session')."""
    token = session_token(headers)
    if token is None:
        return None
    db = store.open_db(folder)
    try:
        return sessions.session_account(db, token, now=datetime.now(UTC))
    finally:
        db.close()


def check(
    handler: http_base.Handler, folder: Path, is_page: Callable[[str], bool]
) -> store.Account | None:
    """Let the request through (returning its account, or None where none is needed) or raise the
    reply that refuses it: 303 to ``/sign-in`` for a page, 401 for anything else."""
    path = urllib.parse.urlsplit(handler.path).path
    account = session_account(handler.headers.get_all("Cookie") or [], folder)
    if account is not None or (handler.command == "GET" and path in OPEN_GETS):
        return account
    if handler.command == "GET" and (is_page(path) or path in LIBRARY_PATHS):
        raise http_base.Reply(303, b"", {"Location": "/sign-in", "Cache-Control": "no-store"})
    raise http_base.refuse(401, "sign in first")
