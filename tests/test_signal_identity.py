"""Signal maps authenticated accounts to its existing user/role vocabulary."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from deploy_workflow.accounts.store import Account
from deploy_workflow.signal.identity import IdentityError, User, clean_name, current_user


def account(profile_type: str, name: str = "Test Reader", *, disabled: bool = False) -> Account:
    return Account(
        id=1,
        tenant_id="00000000-0000-4000-8000-000000000001",
        object_id="00000000-0000-4000-8000-000000000002",
        display_name=name,
        email="reader@example.org",
        given_name=None,
        family_name=None,
        profile_type=profile_type,
        created_at=datetime(2026, 11, 26, tzinfo=UTC),
        disabled=disabled,
    )


@pytest.mark.parametrize(
    ("profile_type", "name", "role"),
    [
        ("reader", "Test Reader", "reader"),
        ("analyst", "Test Analyst", "writer"),
        ("admin", "Test Admin", "owner"),
        ("reader", "Élodie Brontë (elodie)", "reader"),
    ],
)
def test_authenticated_account_maps_to_signal_user(profile_type: str, name: str, role: str) -> None:
    assert current_user(account(profile_type, name)) == User(name, role)


def test_absent_or_disabled_account_has_no_identity() -> None:
    assert current_user(None) is None
    assert current_user(account("reader", disabled=True)) is None


@pytest.mark.parametrize(
    "raw,want",
    [
        ("  A.  Kovac ", "A. Kovac"),
        ("A\tK\n", "A K"),
        ("x\u200by\x00z", "xyz"),
        ("<b>Eve</b>", "<b>Eve</b>"),
        ("é" * 500, "é" * 60),
        ("é", "é"),
    ],
)
def test_clean_name(raw: str, want: str) -> None:
    assert clean_name(raw) == want


@pytest.mark.parametrize("raw", ["", "   ", "\x00\u200b", "\n\t"])
def test_empty_names_are_refused(raw: str) -> None:
    with pytest.raises(IdentityError):
        clean_name(raw)


def test_clean_name_drops_invisible_characters_before_composing() -> None:
    raw = "e\u200b\u0301"
    assert clean_name(raw) == "é"
    assert clean_name(clean_name(raw)) == clean_name(raw)


def test_lone_surrogate_is_dropped() -> None:
    assert clean_name("Eve\ud800") == "Eve"


@settings(deadline=None, max_examples=100)
@given(st.text(max_size=200))
def test_clean_name_is_stable(raw: str) -> None:
    try:
        name = clean_name(raw)
    except IdentityError:
        return
    assert clean_name(name) == name
