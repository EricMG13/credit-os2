"""Offline coverage for preparation policy and persisted account lifecycle."""

from contextlib import closing
from datetime import UTC, datetime, timedelta

import pytest

from deploy_workflow.accounts import sessions, store
from deploy_workflow.run_start.service import requires_preparer

NOW = datetime(2026, 11, 27, 9, tzinfo=UTC)
LATEST = NOW + timedelta(minutes=2)


@pytest.mark.parametrize(
    ("method", "suffix", "required"),
    [
        ("GET", "", False),
        ("POST", "", False),
        ("POST", "/ensure", True),
        ("POST", "/credit_1/refresh", True),
        ("POST", "/credit_1/files", True),
        ("POST", "/credit_1", True),
        ("DELETE", "/credit_1/files", True),
        ("DELETE", "/credit_1", False),
        ("DELETE", "/credit_1/refresh", False),
        ("GET", "/credit_1/files", False),
        ("POST", "/credit_1/unknown", False),
        ("POST", "/credit_1/files/", False),
        ("POST", "/CREDIT_1/refresh", False),
        ("DELETE", "/credit.1/files", False),
    ],
)
def test_standing_portfolio_preparation_policy(method, suffix, required):
    assert requires_preparer(method, f"/api/reference-portfolios{suffix}") is required


def _register(db, name):
    return store.register_reader(
        db,
        tenant_id="tenant",
        object_id=name,
        name=name,
        email=f"{name}@example.org",
        given_name=None,
        family_name=None,
        now=NOW,
    )


def _session_lifetimes(db, account_id):
    return [
        tuple(row)
        for row in db.execute(
            "SELECT created_at, expires_at FROM sessions WHERE account_id=? ORDER BY created_at",
            (account_id,),
        )
    ]


@pytest.mark.parametrize("flow", ["operator", "admin", "legacy-disabled"])
def test_account_disablement_keeps_sign_in_history_and_revokes_old_sessions(tmp_path, flow):
    folder = tmp_path / "accounts"
    with closing(store.open_db(folder)) as db:
        target = _register(db, "Analyst")
        admin = _register(db, "Admin")
        store.set_profile_type(db, admin.id, "admin")
        sessions.mint_session(db, target.id, now=NOW)
        sessions.mint_session(db, target.id, now=LATEST)
        sessions.mint_session(db, admin.id, now=NOW)

        if flow == "operator":
            store.disable_account(db, target.id)
        elif flow == "admin":
            summary = store.disable_account_as_admin(db, admin.id, target.id)
            assert summary["signed_in_at"] == "2026-11-27T09:02:00+00:00"
        else:
            # Recreate the persisted state left by a disable on the older build.
            with store.write_transaction(db):
                db.execute("UPDATE accounts SET disabled=1 WHERE id=?", (target.id,))

        if flow != "legacy-disabled":
            assert _session_lifetimes(db, target.id) == [
                ("2026-11-27T09:00:00+00:00", "2026-11-27T09:00:00+00:00"),
                ("2026-11-27T09:02:00+00:00", "2026-11-27T09:02:00+00:00"),
            ]

    with closing(store.open_db(folder)) as db:
        summary = next(row for row in store.account_directory(db) if row["id"] == target.id)
        assert summary["disabled"] is True
        assert summary["signed_in_at"] == "2026-11-27T09:02:00+00:00"
        store.enable_account(db, target.id)
        sessions.mint_session(db, target.id, now=LATEST + timedelta(minutes=1))
        store.enable_account(db, target.id)
        assert _session_lifetimes(db, target.id) == [
            ("2026-11-27T09:00:00+00:00", "2026-11-27T09:00:00+00:00"),
            ("2026-11-27T09:02:00+00:00", "2026-11-27T09:02:00+00:00"),
            ("2026-11-27T09:03:00+00:00", "2026-11-27T21:03:00+00:00"),
        ]
        assert _session_lifetimes(db, admin.id) == [
            ("2026-11-27T09:00:00+00:00", "2026-11-27T21:00:00+00:00"),
        ]
