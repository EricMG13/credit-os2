"""Optional empty claims count as absent; control and format characters stay refused."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.accounts import store
from deploy_workflow.accounts.registration import RegistrationDenied, register_identity

NOW = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
TENANT = "11111111-1111-4111-8111-111111111111"
OID = "22222222-2222-4222-8222-222222222222"
CLIENT = "33333333-3333-4333-8333-333333333333"
ISSUER = f"https://login.microsoftonline.com/{TENANT}/v2.0"


@pytest.fixture
def db(tmp_path: Path) -> sqlite3.Connection:
    return store.open_db(tmp_path / "account-store")


def _register(db: sqlite3.Connection, **changes: object) -> store.Account:
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
    return register_identity(db, claims, tenant_id=TENANT, issuer=ISSUER, audience=CLIENT, now=NOW)


@pytest.mark.parametrize("empty", ["", "   ", "\t\n"])
@pytest.mark.parametrize("claim", ["given_name", "family_name"])
def test_optional_empty_claim_is_absent(db: sqlite3.Connection, claim: str, empty: str) -> None:
    account = _register(db, **{claim: empty})
    assert getattr(account, claim) is None


@pytest.mark.parametrize("claim", ["name", "preferred_username", "tid", "oid", "iss", "aud"])
def test_required_empty_claim_refused(db: sqlite3.Connection, claim: str) -> None:
    with pytest.raises(RegistrationDenied):
        _register(db, **{claim: ""})


@pytest.mark.parametrize("claim", ["given_name", "family_name"])
@pytest.mark.parametrize("value", [5, ["Rae"], {"a": 1}, True])
def test_non_string_optional_value_refused(
    db: sqlite3.Connection, claim: str, value: object
) -> None:
    with pytest.raises(RegistrationDenied):
        _register(db, **{claim: value})


@pytest.mark.parametrize("claim", ["name", "given_name", "family_name"])
def test_nul_character_refused(db: sqlite3.Connection, claim: str) -> None:
    with pytest.raises(RegistrationDenied):
        _register(db, **{claim: "Ab" + chr(0) + "cd"})


@pytest.mark.parametrize("joiner", [chr(0x200C), chr(0x200D)])
def test_joiner_in_name_still_refused(db: sqlite3.Connection, joiner: str) -> None:
    with pytest.raises(RegistrationDenied):
        _register(db, name="می" + joiner + "خواهم")
