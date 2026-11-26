"""Session tokens: minted at sign-in, stored only as a SHA-256 hash, valid for 12 hours."""

from __future__ import annotations

import hashlib
import re
import secrets
import sqlite3
from datetime import datetime, timedelta

from deploy_workflow.accounts.store import (
    Account,
    Missing,
    StoreError,
    account_by_id,
    utc_text,
    write_transaction,
)

SESSION_LENGTH = timedelta(hours=12)
_TOKEN = re.compile(r"[A-Za-z0-9_-]{43}", re.ASCII)  # 32 random bytes, URL-safe base64


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def mint_session(db: sqlite3.Connection, account_id: int, *, now: datetime) -> str:
    """Start a session for an enabled account and return its token (never stored as is)."""
    created = utc_text(now)
    expires = utc_text(now + SESSION_LENGTH)
    token = secrets.token_urlsafe(32)
    with write_transaction(db):
        account = account_by_id(db, account_id)
        if account is None:
            raise Missing(f"no account {account_id}")
        if account.disabled:
            raise StoreError("a disabled account cannot sign in")
        db.execute(
            "INSERT INTO sessions(token_hash, account_id, created_at, last_used_at, expires_at)"
            " VALUES (?, ?, ?, ?, ?)",
            (_hash(token), account_id, created, created, expires),
        )
    return token


def session_account(db: sqlite3.Connection, token: str, *, now: datetime) -> Account | None:
    """The enabled account a live token belongs to, else None. Writes nothing."""
    utc_text(now)  # rejects a naive time
    if not _TOKEN.fullmatch(token):
        return None
    row = db.execute(
        "SELECT account_id, expires_at FROM sessions WHERE token_hash=?", (_hash(token),)
    ).fetchone()
    if row is None or now >= datetime.fromisoformat(str(row["expires_at"])):
        return None
    account = account_by_id(db, int(row["account_id"]))
    if account is None or account.disabled:
        return None
    return account


def end_session(db: sqlite3.Connection, token: str) -> None:
    """Delete the token's session, if there is one."""
    if not _TOKEN.fullmatch(token):
        return
    with write_transaction(db):
        db.execute("DELETE FROM sessions WHERE token_hash=?", (_hash(token),))
