"""Thread-safe, one-use storage for short-lived MSAL authorization flows."""

from __future__ import annotations

import secrets
import threading
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hmac import compare_digest
from typing import Any

_LIFETIME = timedelta(minutes=10)
_MAX_ACTIVE = 100


@dataclass(frozen=True)
class _Entry:
    flow: dict[str, Any]
    expires_at: datetime


class PendingFlows:
    """Keep MSAL flow parameters behind independent, opaque browser keys."""

    def __init__(self) -> None:
        self._entries: dict[str, _Entry] = {}
        self._lock = threading.Lock()

    def start(self, flow: dict[str, Any], *, now: datetime) -> str | None:
        """Store a real MSAL flow and return its opaque cookie key, or refuse at capacity."""
        self._require_utc(now)
        now_utc = now.astimezone(UTC)
        state = flow.get("state")
        if not isinstance(state, str) or not state or not state.isascii():
            raise ValueError("MSAL flow must contain a non-empty ASCII state")
        saved_flow = deepcopy(flow)
        with self._lock:
            self._remove_expired(now_utc)
            if len(self._entries) >= _MAX_ACTIVE:
                return None
            key = secrets.token_urlsafe(32)
            while key in self._entries or compare_digest(key, state):
                key = secrets.token_urlsafe(32)
            self._entries[key] = _Entry(saved_flow, now_utc + _LIFETIME)
            return key

    def take(self, key: str, state: str, *, now: datetime) -> dict[str, Any] | None:
        """Atomically validate and consume a live flow before any external token exchange."""
        self._require_utc(now)
        now_utc = now.astimezone(UTC)
        if not isinstance(state, str) or not state.isascii():
            return None
        with self._lock:
            self._remove_expired(now_utc)
            entry = self._entries.get(key)
            if entry is None:
                return None
            expected_state = entry.flow.get("state")
            if (
                not isinstance(expected_state, str)
                or not expected_state.isascii()
                or not compare_digest(expected_state, state)
            ):
                return None
            del self._entries[key]
            return entry.flow

    def _remove_expired(self, now: datetime) -> None:
        expired = [key for key, entry in self._entries.items() if now >= entry.expires_at]
        for key in expired:
            del self._entries[key]

    @staticmethod
    def _require_utc(now: datetime) -> None:
        if now.tzinfo is None or now.utcoffset() != UTC.utcoffset(now):
            raise ValueError("now must be timezone-aware UTC")
