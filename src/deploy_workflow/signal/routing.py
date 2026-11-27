"""What a Signal route handler is given, how a route is declared, and what a transport gives
``service.answer`` (``Incoming``); shared by the service and the modules that hold its handlers
(``api_groups``, ``api_settings``, ``api_issuers``, ``api_logos``), which the service imports."""

from __future__ import annotations

import re
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol

from deploy_workflow.accounts.store import Account
from deploy_workflow.http_base import Reply, refuse
from deploy_workflow.signal import ai_gate, identity

NEEDS_NAME = "sign in first"
ID = "([0-9]{1,18})"  # ASCII digits only (a str pattern's \d also matches other scripts)


class LoopState(Protocol):
    """The part of the background loop a handler may read."""

    last_error: str | None
    ai_error: str | None
    digest_error: str | None
    market_error: str | None

    def ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status: ...

    def shown_ai_status(self, db: sqlite3.Connection, now: datetime) -> ai_gate.Status: ...


@dataclass
class Req:
    """What a route handler may use: its own connection, who asked, and the request's parts."""

    db: sqlite3.Connection
    user: identity.User | None
    groups: tuple[str, ...]
    params: dict[str, str]
    body: Callable[[], dict[str, Any]]
    loop: LoopState | None
    # The body when the request carries one, else {} (a route whose body is optional).
    optional_body: Callable[[], dict[str, Any]] = dict

    @property
    def person(self) -> identity.User:
        if self.user is None:
            raise refuse(401, NEEDS_NAME)
        return self.user

    def param(self, name: str) -> str:
        if name not in self.params:
            raise refuse(400, f"the request needs {name}")
        return self.params[name]


@dataclass(frozen=True)
class Incoming:
    """One request as ``service.answer`` takes it from whatever transport received it."""

    method: str
    path: str  # the ``/signal`` prefix already removed; a path not under ``/api/`` is a 404
    query: str  # raw, as it came after the ``?``
    account: Account | None  # the account already checked by the application's request gate
    body: Callable[[], dict[str, Any]]  # the required JSON object, or the transport's refusal
    optional_body: Callable[[], dict[str, Any]]  # the same, {} when the request carries none


@dataclass(frozen=True)
class Route:
    method: str
    pattern: re.Pattern[str]
    handler: Callable[[Req], Reply]
    open_to_all: bool = False  # only /api/me, /api/status and /api/snapshot need no account
