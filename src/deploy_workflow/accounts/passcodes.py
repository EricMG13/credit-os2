"""The analyst and admin passcodes and the lockout on wrong ones.

Standard library only. The only way to check a passcode is `try_passcode`, which counts failures
in the store; there is deliberately no check without the lockout. No passcode, hash or salt is
ever put in a message here.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import sqlite3
from datetime import UTC, datetime, timedelta
from typing import Literal

from deploy_workflow.accounts.store import StoreError, utc_text, write_transaction

PASSCODE_TYPES = ("analyst", "admin")
MIN_LENGTH = 12
MAX_LENGTH = 1024
LOCK_AFTER = 5
WINDOW = timedelta(hours=1)
LOCK_FOR = timedelta(hours=1)

Attempt = Literal["analyst", "admin", "wrong passcode", "locked"]

_SALT_BYTES = 16
_SCRYPT = {"n": 2**14, "r": 8, "p": 5, "dklen": 64, "maxmem": 64 * 1024 * 1024}


def _hash(passcode: str, salt: bytes) -> bytes:
    return hashlib.scrypt(passcode.encode("utf-8"), salt=salt, **_SCRYPT)


def _is_text(passcode: str) -> bool:
    """False for a str that cannot be encoded as UTF-8 (a lone surrogate)."""
    try:
        passcode.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return True


def _matches(passcode: str, row: sqlite3.Row) -> bool:
    return hmac.compare_digest(_hash(passcode, bytes(row["salt"])), bytes(row["hash"]))


def set_passcode(db: sqlite3.Connection, profile_type: str, passcode: str, now: datetime) -> None:
    """Set (replace) the passcode for `profile_type`; it must differ from the other type's."""
    if profile_type not in PASSCODE_TYPES:
        raise StoreError(
            f"invalid passcode type {profile_type!r}; expected one of {', '.join(PASSCODE_TYPES)}"
        )
    if len(passcode) < MIN_LENGTH:
        raise StoreError(f"a passcode needs at least {MIN_LENGTH} characters")
    if len(passcode) > MAX_LENGTH:
        raise StoreError(f"a passcode may have at most {MAX_LENGTH} characters")
    if not _is_text(passcode):
        raise StoreError("a passcode must be valid text")
    set_at = utc_text(now)
    with write_transaction(db):
        other = db.execute(
            "SELECT hash, salt FROM passcodes WHERE profile_type != ?", (profile_type,)
        ).fetchone()
        if other is not None and _matches(passcode, other):
            raise StoreError("the analyst and admin passcodes must differ")
        salt = secrets.token_bytes(_SALT_BYTES)
        db.execute(
            "INSERT OR REPLACE INTO passcodes(profile_type, hash, salt, set_at)"
            " VALUES (?, ?, ?, ?)",
            (profile_type, _hash(passcode, salt), salt, set_at),
        )


def _record_failure(db: sqlite3.Connection, object_id: str, now: datetime) -> None:
    row = db.execute(
        "SELECT failed_count, first_failure_at FROM registration_attempts WHERE object_id=?",
        (object_id,),
    ).fetchone()
    if row is None or now >= datetime.fromisoformat(row["first_failure_at"]) + WINDOW:
        db.execute(
            "INSERT OR REPLACE INTO registration_attempts"
            "(object_id, failed_count, first_failure_at, locked_until) VALUES (?, 1, ?, NULL)",
            (object_id, utc_text(now)),
        )
        return
    count = int(row["failed_count"]) + 1
    locked = utc_text(now + LOCK_FOR) if count >= LOCK_AFTER else None
    db.execute(
        "UPDATE registration_attempts SET failed_count=?, locked_until=? WHERE object_id=?",
        (count, locked, object_id),
    )


def try_passcode(db: sqlite3.Connection, object_id: str, passcode: str, now: datetime) -> Attempt:
    """Check a passcode for an identity, counting failures; locked identities are not checked."""
    utc_text(now)
    now = now.astimezone(UTC)
    if not object_id.strip():
        raise StoreError("the identity has no object id")
    with write_transaction(db):
        state = db.execute(
            "SELECT locked_until FROM registration_attempts WHERE object_id=?", (object_id,)
        ).fetchone()
        if (
            state is not None
            and state["locked_until"] is not None
            and now < datetime.fromisoformat(state["locked_until"])
        ):
            return "locked"
        if MIN_LENGTH <= len(passcode) <= MAX_LENGTH and _is_text(passcode):
            for row in db.execute("SELECT profile_type, hash, salt FROM passcodes"):
                if _matches(passcode, row):
                    db.execute("DELETE FROM registration_attempts WHERE object_id=?", (object_id,))
                    return "analyst" if row["profile_type"] == "analyst" else "admin"
        _record_failure(db, object_id, now)
        return "wrong passcode"
