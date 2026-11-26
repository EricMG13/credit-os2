"""Shared analyst-name rules and the account store's v1 to v2 upgrade."""

from __future__ import annotations

import hashlib
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.accounts import analyst_names, cli, store

V1_MIGRATION_SQL_SHA256 = "835fd5acec94fd37d65f6a2eff509292250c2f4c8ad541281199e16d6d8f79c5"
V1_SCHEMA_HASH = "e7710db6952b270f1b2cc15206e55624421199ba74326c8b7281a50cd9546e3f"
NOW = datetime(2026, 11, 26, 9, tzinfo=UTC)


@pytest.mark.parametrize(
    ("given", "family", "expected"),
    [
        ("Eric", "Green", "Eric G"),
        ("Alice", "brown", "Alice B"),
        ("Élodie", "Ångström", "Élodie Å"),
        ("Jean-Luc", "Green", None),
        ("Eric", "de la Tour", None),
        ("Eric", "", None),
        ("Eric", None, None),
        ("Ada Marie", "Lovelace", None),
        ("Eric", "\ud800", None),
        ("Eric", "ß", None),
    ],
)
def test_automatic_name_uses_only_plain_registered_words(given, family, expected) -> None:
    assert analyst_names.derive_analyst_name(given, family) == expected


def test_shared_rule_preserves_legacy_manual_name_grammar() -> None:
    assert analyst_names.SUBMITTER_AT_MOST == 80
    assert analyst_names.ANALYST_NAME_RULE == (
        "Enter your name as your first name and initial, for example Eric G, "
        "or two initials, for example Eric MG."
    )
    for accepted in ("Eric G", "Eric MG", "Jean-Luc MG", "O'Neil G", "O’Neil AB"):
        assert analyst_names.is_analyst_name(accepted)
    for refused in ("", "Eric g", "Eric A B", " Eric G", "Eric "):
        assert not analyst_names.is_analyst_name(refused)


def test_effective_name_prefers_valid_override_and_ignores_display_name() -> None:
    account = store.Account(
        7,
        "tenant",
        "object",
        "Eric Green (example)",
        "unrelated@example.org",
        "Eric",
        "Green",
        "analyst",
        NOW,
        False,
    )
    assert store.effective_analyst_name(account) == "Eric G"
    assert (
        store.effective_analyst_name(
            store.Account(
                account.id,
                account.tenant_id,
                account.object_id,
                account.display_name,
                account.email,
                account.given_name,
                account.family_name,
                account.profile_type,
                account.created_at,
                account.disabled,
                "Eric MG",
            )
        )
        == "Eric MG"
    )


def _make_v1_store(folder: Path) -> None:
    folder.mkdir(mode=0o700)
    path = folder / "accounts.db"
    db = sqlite3.connect(path)
    try:
        db.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        db.commit()
        db.executescript(store._MIGRATION_1)
        db.execute(
            "INSERT INTO meta(key, value) VALUES ('schema_version', '1'), ('schema_hash', ?)",
            (V1_SCHEMA_HASH,),
        )
        db.execute(
            "INSERT INTO accounts(id,tenant_id,object_id,display_name,email,given_name,family_name,"
            "profile_type,created_at,disabled) VALUES (7,'t-1','o-7','Legacy Name',"
            "'legacy@example.org','Legacy','Person','admin','2026-11-26T09:00:00+00:00',0)"
        )
        db.execute("INSERT INTO passcodes VALUES ('admin', x'1122', x'3344', 'set-time')")
        db.execute("INSERT INTO sessions VALUES ('legacy-hash',7,'created','last-used','expires')")
        db.execute("INSERT INTO registration_attempts VALUES ('o-7',2,'first-failure',NULL)")
        db.commit()
    finally:
        db.close()
    path.chmod(0o600)


def test_v1_store_upgrade_preserves_rows_and_pinned_migration_one(tmp_path: Path) -> None:
    assert hashlib.sha256(store._MIGRATION_1.encode("utf-8")).hexdigest() == (
        V1_MIGRATION_SQL_SHA256
    )
    folder = tmp_path / "legacy-store"
    _make_v1_store(folder)

    db = store.open_db(folder)
    try:
        assert db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()[0] == "2"
        assert db.execute("SELECT value FROM meta WHERE key='schema_hash'").fetchone()[0] == (
            store.scripts_hash(2)
        )
        account = store.account_by_id(db, 7)
        assert account is not None
        assert (account.display_name, account.profile_type, account.id) == (
            "Legacy Name",
            "admin",
            7,
        )
        assert account.analyst_name_override is None
        assert tuple(db.execute("SELECT hash, salt, set_at FROM passcodes").fetchone()) == (
            b"\x11\x22",
            b"\x33\x44",
            "set-time",
        )
        assert tuple(db.execute("SELECT * FROM sessions").fetchone()) == (
            "legacy-hash",
            7,
            "created",
            "last-used",
            "expires",
        )
        assert tuple(db.execute("SELECT * FROM registration_attempts").fetchone()) == (
            "o-7",
            2,
            "first-failure",
            None,
        )
    finally:
        db.close()


def test_old_account_constructor_defaults_override_to_none() -> None:
    account = store.Account(
        1, "t", "o", "Name", "name@example.org", None, None, "reader", NOW, False
    )
    assert account.analyst_name_override is None


def _account(db: sqlite3.Connection, *, name: str = "Eric MG") -> store.Account:
    return store.register_reader(
        db,
        tenant_id="tenant",
        object_id="object",
        name="Eric Green",
        email="different@example.org",
        given_name="Eric",
        family_name="Green",
        now=NOW,
    )


def test_operator_cli_sets_valid_analyst_name_with_shared_rule(tmp_path: Path, capsys) -> None:
    folder = tmp_path / "cli-store"
    db = store.open_db(folder)
    try:
        account = _account(db)
    finally:
        db.close()
    assert (
        cli.main(
            [
                "--accounts-dir",
                str(folder),
                "accounts",
                "analyst-name",
                str(account.id),
                "Eric",
                "MG",
            ],
            environ={},
        )
        == 0
    )
    captured = capsys.readouterr()
    assert captured.out == f"account {account.id} analyst name is now Eric MG\n"
    assert captured.err == ""
    db = store.open_db(folder)
    try:
        updated = store.account_by_id(db, account.id)
        assert updated is not None and updated.analyst_name_override == "Eric MG"
        assert (updated.given_name, updated.family_name, updated.display_name) == (
            "Eric",
            "Green",
            "Eric Green",
        )
    finally:
        db.close()


@pytest.mark.parametrize("name", ["Eric Green", "x" * 81])
def test_operator_cli_refuses_invalid_analyst_name_without_write(
    tmp_path: Path, capsys, name: str
) -> None:
    folder = tmp_path / "cli-invalid"
    db = store.open_db(folder)
    try:
        account = _account(db)
    finally:
        db.close()
    assert (
        cli.main(
            ["--accounts-dir", str(folder), "accounts", "analyst-name", str(account.id), name],
            environ={},
        )
        == 2
    )
    captured = capsys.readouterr()
    assert analyst_names.ANALYST_NAME_RULE in captured.err
    assert name not in captured.err
    db = store.open_db(folder)
    try:
        unchanged = store.account_by_id(db, account.id)
        assert unchanged is not None and unchanged.analyst_name_override is None
    finally:
        db.close()
