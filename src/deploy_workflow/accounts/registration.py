"""Validate verified identity claims and atomically apply account registration permissions."""

from __future__ import annotations

import re
import sqlite3
import unicodedata
from collections.abc import Mapping
from datetime import UTC, datetime

from deploy_workflow.accounts import passcodes, sessions, store
from deploy_workflow.accounts.passcodes import Attempt

DENIAL = "this account cannot sign in here"
_OID = re.compile(r"[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}", re.ASCII)
_EMAIL = re.compile(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+", re.ASCII)


class RegistrationDenied(ValueError):
    """The verified identity is not usable for this configured application."""

    def __init__(self) -> None:
        super().__init__(DENIAL)


type IdentityClaims = Mapping[str, object]


def _text_claim(claims: IdentityClaims, key: str, *, required: bool = True) -> str | None:
    value = claims.get(key)
    if value is None and not required:
        return None
    if (
        not isinstance(value, str)
        or not value.strip()
        or any(unicodedata.category(character) in {"Cc", "Cf", "Cs"} for character in value)
    ):
        raise RegistrationDenied()
    return value


def _required_text(claims: IdentityClaims, key: str) -> str:
    value = _text_claim(claims, key)
    assert value is not None
    return value


def _identity_fields(
    claims: IdentityClaims, *, tenant_id: str, issuer: str, audience: str
) -> tuple[str, str, str, str | None, str | None]:
    claim_tenant = _required_text(claims, "tid")
    object_id = _required_text(claims, "oid")
    claim_issuer = _required_text(claims, "iss")
    claim_audience = _required_text(claims, "aud")
    name = _required_text(claims, "name")
    email = _required_text(claims, "preferred_username")
    given_name = _text_claim(claims, "given_name", required=False)
    family_name = _text_claim(claims, "family_name", required=False)
    if (
        claim_tenant != tenant_id
        or claim_issuer != issuer
        or claim_audience != audience
        or _OID.fullmatch(object_id) is None
        or _EMAIL.fullmatch(email) is None
        or not store._clean(name)
    ):
        raise RegistrationDenied()
    return object_id, name, email, given_name, family_name


def register_identity(  # noqa: PLR0913
    db: sqlite3.Connection,
    claims: IdentityClaims,
    *,
    tenant_id: str,
    issuer: str,
    audience: str,
    now: datetime,
) -> store.Account:
    """Register an enabled Reader from already verified MSAL ID token claims."""
    if not isinstance(claims, Mapping):
        raise RegistrationDenied()
    object_id, name, email, given_name, family_name = _identity_fields(
        claims, tenant_id=tenant_id, issuer=issuer, audience=audience
    )
    account = store.register_reader(
        db,
        tenant_id=tenant_id,
        object_id=object_id,
        name=name,
        email=email,
        given_name=given_name,
        family_name=family_name,
        now=now,
    )
    if account.disabled:
        raise RegistrationDenied()
    return account


def redeem_passcode(
    db: sqlite3.Connection, session_token: str | None, *, passcode: str, now: datetime
) -> Attempt | None:
    """Count a passcode and raise profile only for a live session, under one write lock."""
    store.utc_text(now)
    current = now.astimezone(UTC)
    if not isinstance(session_token, str):
        return None
    with store.write_transaction(db):
        account = sessions.session_account(db, session_token, now=current)
        if account is None:
            return None
        result = passcodes._try_passcode_locked(
            db, account.object_id, passcode=passcode, now=current
        )
        if result in ("analyst", "admin"):
            prior_role = account.profile_type
            role = "admin" if result == "admin" or prior_role == "admin" else "analyst"
            if role != prior_role:
                db.execute(
                    "UPDATE accounts SET profile_type=? WHERE id=? AND disabled=0",
                    (role, account.id),
                )
        return result
