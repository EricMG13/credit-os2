"""Account registration and passcode promotion for slice 3."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.accounts import store
from deploy_workflow.accounts.passcodes import set_passcode
from deploy_workflow.accounts.registration import (
    RegistrationDenied,
    redeem_passcode,
    register_identity,
)
from deploy_workflow.accounts.sessions import mint_session

NOW = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
TENANT = "11111111-1111-4111-8111-111111111111"
OID = "22222222-2222-4222-8222-222222222222"
CLIENT = "33333333-3333-4333-8333-333333333333"
ISSUER = f"https://login.microsoftonline.com/{TENANT}/v2.0"
ANALYST = "Kestrel-Quarry-Walrus9"
ADMIN = "Kestrel-Quarry-Mollusc9"


@pytest.fixture
def db(tmp_path: Path) -> sqlite3.Connection:
    return store.open_db(tmp_path / "account-store")


def _claims(**changes: object) -> dict[str, object]:
    claims: dict[str, object] = {
        "tid": TENANT,
        "oid": OID,
        "iss": ISSUER,
        "aud": CLIENT,
        "name": "Rae Example",
        "preferred_username": "rae@example.org",
        "given_name": "Rae",
        "family_name": "Example",
    }
    claims.update(changes)
    return claims


def _register(db: sqlite3.Connection, **changes: object) -> store.Account:
    return register_identity(
        db,
        _claims(**changes),
        tenant_id=TENANT,
        issuer=ISSUER,
        audience=CLIENT,
        now=NOW,
    )


def test_exact_claims_create_stable_reader_account(db: sqlite3.Connection) -> None:
    first = _register(db)
    second = _register(db)

    assert first.id == second.id
    assert first.tenant_id == TENANT
    assert first.object_id == OID
    assert first.given_name == "Rae"
    assert first.family_name == "Example"
    assert first.profile_type == "reader"
    assert db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 1


@pytest.mark.parametrize(
    "changes",
    [
        {"tid": "wrong"},
        {"oid": "not-an-object-id"},
        {"iss": "https://issuer.invalid"},
        {"aud": "wrong-client"},
        {"tid": None},
        {"oid": None},
        {"iss": None},
        {"aud": None},
        {"name": " "},
        {"name": "\u200b"},
        {"name": None},
        {"preferred_username": "not an email"},
        {"preferred_username": "rae\x00@example.org"},
        {"preferred_username": None},
        {"given_name": 4},
        {"family_name": []},
    ],
)
def test_invalid_or_unusable_claims_are_fixed_denial(
    db: sqlite3.Connection, changes: dict[str, object]
) -> None:
    with pytest.raises(RegistrationDenied, match="^this account cannot sign in here$"):
        _register(db, **changes)

    assert db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 0


def test_disabled_identity_is_denied_and_cannot_get_a_session(db: sqlite3.Connection) -> None:
    account = _register(db)
    store.disable_account(db, account.id)

    with pytest.raises(RegistrationDenied, match="^this account cannot sign in here$"):
        _register(db)
    with pytest.raises(store.StoreError, match="disabled account"):
        mint_session(db, account.id, now=NOW)
    assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 0


def test_admin_passcode_promotes_reader(db: sqlite3.Connection) -> None:
    account = _register(db)
    set_passcode(db, "admin", passcode=ADMIN, now=NOW)
    token = mint_session(db, account.id, now=NOW)

    assert redeem_passcode(db, token, passcode=ADMIN, now=NOW) == "admin"
    assert store.account_by_id(db, account.id).profile_type == "admin"


def test_analyst_promotes_reader_but_never_lowers_admin(db: sqlite3.Connection) -> None:
    account = _register(db)
    set_passcode(db, "analyst", passcode=ANALYST, now=NOW)
    set_passcode(db, "admin", passcode=ADMIN, now=NOW)
    token = mint_session(db, account.id, now=NOW)

    assert redeem_passcode(db, token, passcode=ANALYST, now=NOW) == "analyst"
    assert store.account_by_id(db, account.id).profile_type == "analyst"
    assert redeem_passcode(db, token, passcode=ADMIN, now=NOW) == "admin"
    assert redeem_passcode(db, token, passcode=ANALYST, now=NOW) == "analyst"
    assert store.account_by_id(db, account.id).profile_type == "admin"


def test_invalid_session_counts_no_attempt(db: sqlite3.Connection) -> None:
    account = _register(db)
    set_passcode(db, "admin", passcode=ADMIN, now=NOW)

    assert redeem_passcode(db, None, passcode=ADMIN, now=NOW) is None
    assert redeem_passcode(db, "x" * 43, passcode=ADMIN, now=NOW) is None
    assert db.execute("SELECT COUNT(*) FROM registration_attempts").fetchone()[0] == 0
    assert store.account_by_id(db, account.id).profile_type == "reader"


def test_disabled_session_counts_no_attempt(db: sqlite3.Connection) -> None:
    account = _register(db)
    set_passcode(db, "admin", passcode=ADMIN, now=NOW)
    token = mint_session(db, account.id, now=NOW)
    store.disable_account(db, account.id)

    assert redeem_passcode(db, token, passcode=ADMIN, now=NOW) is None
    assert db.execute("SELECT COUNT(*) FROM registration_attempts").fetchone()[0] == 0


def test_second_connection_disable_invalidates_session_before_attempt(tmp_path: Path) -> None:
    folder = tmp_path / "account-store"
    db = store.open_db(folder)
    account = store.register_reader(
        db,
        tenant_id=TENANT,
        object_id=OID,
        name="Rae Example",
        email="rae@example.org",
        given_name="Rae",
        family_name="Example",
        now=NOW,
    )
    set_passcode(db, "admin", passcode=ADMIN, now=NOW)
    token = mint_session(db, account.id, now=NOW)
    other = store.open_db(folder)
    try:
        store.disable_account(other, account.id)

        assert redeem_passcode(db, token, passcode=ADMIN, now=NOW) is None
        assert db.execute("SELECT COUNT(*) FROM registration_attempts").fetchone()[0] == 0
    finally:
        other.close()
        db.close()


def test_wrong_then_locked_passcodes_retain_admin_role(db: sqlite3.Connection) -> None:
    account = _register(db)
    set_passcode(db, "admin", passcode=ADMIN, now=NOW)
    set_passcode(db, "analyst", passcode=ANALYST, now=NOW)
    token = mint_session(db, account.id, now=NOW)
    assert redeem_passcode(db, token, passcode=ADMIN, now=NOW) == "admin"

    for _ in range(5):
        result = redeem_passcode(db, token, passcode="DefinitelyWrongPasscode9", now=NOW)
    assert result == "wrong passcode"
    assert redeem_passcode(db, token, passcode=ANALYST, now=NOW) == "locked"
    assert store.account_by_id(db, account.id).profile_type == "admin"
