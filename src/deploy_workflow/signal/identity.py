"""Signal's route-facing identity, derived from the application's gated account."""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass

from deploy_workflow.accounts.store import Account

MAX_NAME = 60
_WHITESPACE_CONTROLS = {"\t": " ", "\n": " ", "\r": " "}


class IdentityError(ValueError):
    """The display name is empty once cleaned."""


@dataclass(frozen=True)
class User:
    name: str
    role: str


def _printable(ch: str) -> str:
    if ch in _WHITESPACE_CONTROLS:
        return " "
    return "" if unicodedata.category(ch) in ("Cc", "Cf", "Cs") else ch


def _clean(raw: str) -> str:
    text = unicodedata.normalize("NFC", "".join(_printable(ch) for ch in raw))
    return " ".join(text.split())[:MAX_NAME].strip()


def clean_name(raw: str) -> str:
    """Return the cleaned display name; IdentityError when nothing is left."""
    name = _clean(raw)
    if not name:
        raise IdentityError("display name is empty")
    return name


def current_user(account: Account | None) -> User | None:
    """Map the already-authenticated account to Signal's reader/writer/owner vocabulary."""
    if account is None or account.disabled:
        return None
    roles = {"reader": "reader", "analyst": "writer", "admin": "owner"}
    try:
        role = roles[account.profile_type]
    except KeyError as error:
        raise ValueError("the authenticated account has an unsupported profile type") from error
    return User(account.display_name, role)
