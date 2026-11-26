"""Answer key items 1-22 of slice 1 task A (account store and accounts)."""

from __future__ import annotations

import os
import sqlite3
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from deploy_workflow.accounts.store import (
    Account,
    Conflict,
    Missing,
    StoreError,
    account_by_id,
    account_by_identity,
    disable_account,
    list_accounts,
    open_db,
    register_reader,
    set_profile_type,
)

T0 = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
posix_only = pytest.mark.skipif(os.name != "posix", reason="POSIX modes")


def _tables(db: sqlite3.Connection) -> list[str]:
    rows = db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    return [r[0] for r in rows]


def _meta(db: sqlite3.Connection, key: str) -> str:
    return str(db.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()[0])


def _count(db: sqlite3.Connection) -> int:
    return int(db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0])


def _reg(db: sqlite3.Connection, **over: Any) -> Account:
    """register_reader with the answer key's first identity; `over` replaces any field."""
    fields: dict[str, Any] = {
        "tenant_id": "t-1",
        "object_id": "o-1",
        "name": "A. Kovac",
        "email": "a.kovac@example.org",
        "given_name": None,
        "family_name": None,
        "now": T0,
    }
    fields.update(over)
    return register_reader(db, **fields)


# ---- store ----


def test_open_creates_folder_and_file(tmp_path: Path) -> None:
    db = open_db(tmp_path / "store")
    assert (tmp_path / "store" / "accounts.db").is_file()
    assert db.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
    assert db.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    db.close()


def test_tables_and_meta(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    assert _tables(db) == ["accounts", "meta", "passcodes", "registration_attempts", "sessions"]
    assert _meta(db, "schema_version") == "1"
    h = _meta(db, "schema_hash")
    assert len(h) == 64 and h == h.lower() and all(c in "0123456789abcdef" for c in h)
    db.close()


def test_reopen(tmp_path: Path) -> None:
    open_db(tmp_path).close()
    db = open_db(tmp_path)
    assert _meta(db, "schema_version") == "1"
    assert _tables(db) == ["accounts", "meta", "passcodes", "registration_attempts", "sessions"]
    db.close()


def test_later_version_refused(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    db.execute("UPDATE meta SET value='2' WHERE key='schema_version'")
    db.commit()
    db.close()
    with pytest.raises(StoreError) as err:
        open_db(tmp_path)
    assert "accounts.db" in str(err.value)
    assert "later than this build's 1" in str(err.value)


def test_other_build_refused(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    db.execute("UPDATE meta SET value=? WHERE key='schema_hash'", ("0" * 64,))
    db.commit()
    db.close()
    with pytest.raises(StoreError) as err:
        open_db(tmp_path)
    assert "made by another build" in str(err.value)
    assert "accounts.db" in str(err.value)


def test_raw_constraints(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    ins = (
        "INSERT INTO accounts(tenant_id, object_id, display_name, email, profile_type,"
        " created_at) VALUES (?, ?, ?, 'e', ?, 'x')"
    )
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(ins, ("t", "o", "n", "owner"))
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO passcodes VALUES ('reader', x'00', x'00', 'x')")
    db.execute(ins, ("t", "o", "n", "reader"))
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(ins, ("t", "o", "n2", "reader"))
    with pytest.raises(sqlite3.IntegrityError):
        db.execute(ins, ("t", "o2", "n", "reader"))
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO sessions VALUES ('h', 999, 'x', 'x', 'x')")
    db.close()


_REMEDY = (
    "it must belong to the account that runs the application and be open to no one else"
    " (chmod 700 for the folder, 600 for the file)"
)


@posix_only
def test_posix_modes(tmp_path: Path) -> None:
    folder = tmp_path / "store"
    open_db(folder).close()
    assert folder.stat().st_mode & 0o777 == 0o700
    folder.chmod(0o777)
    with pytest.raises(StoreError, match="can be opened by other users"):
        open_db(folder)
    folder.chmod(0o700)
    (folder / "accounts.db").chmod(0o666)
    with pytest.raises(StoreError, match="can be opened by other users"):
        open_db(folder)


@posix_only
@pytest.mark.parametrize("mode", [0o755, 0o777])
def test_folder_open_to_others_refused(tmp_path: Path, mode: int) -> None:
    folder = tmp_path / "store"
    folder.mkdir()
    folder.chmod(mode)
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        f"the account store's folder {folder} can be opened by other users; {_REMEDY}"
    )


@posix_only
@pytest.mark.parametrize("mode", [0o644, 0o666])
def test_file_open_to_others_refused(tmp_path: Path, mode: int) -> None:
    folder = tmp_path / "store"
    open_db(folder).close()
    (folder / "accounts.db").chmod(mode)
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        f"the account store {folder / 'accounts.db'} can be opened by other users; {_REMEDY}"
    )


@posix_only
def test_fresh_store_files_are_private_even_with_open_umask(tmp_path: Path) -> None:
    folder = tmp_path / "store"
    old = os.umask(0o022)
    try:
        db = open_db(folder)
        db.execute("INSERT INTO meta(key, value) VALUES ('probe', 'x')")
        db.commit()
        modes = {p.name: p.stat().st_mode & 0o777 for p in folder.iterdir()}
        db.close()
    finally:
        os.umask(old)
    assert modes["accounts.db"] == 0o600
    assert modes["accounts.db-wal"] == 0o600
    assert modes["accounts.db-shm"] == 0o600


@posix_only
def test_foreign_owner_refused(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    folder = tmp_path / "store"
    open_db(folder).close()
    monkeypatch.setattr(os, "geteuid", lambda: os.stat(folder).st_uid + 1)
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        f"the account store's folder {folder} belongs to another user; {_REMEDY}"
    )


def test_concurrent_first_open(tmp_path: Path) -> None:
    for trial in range(8):
        folder = tmp_path / f"s{trial}"
        barrier = threading.Barrier(4)
        results: list[str] = []
        errors: list[BaseException] = []

        def work(
            folder: Path = folder,
            barrier: threading.Barrier = barrier,
            results: list[str] = results,
            errors: list[BaseException] = errors,
        ) -> None:
            try:
                barrier.wait(timeout=60)
                db = open_db(folder)
                results.append(_meta(db, "schema_version"))
                db.close()
            except BaseException as exc:  # noqa: BLE001 - collected and asserted empty below
                errors.append(exc)

        threads = [threading.Thread(target=work) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert errors == []
        assert results == ["1"] * 4


# ---- accounts ----


@pytest.fixture
def db(tmp_path: Path):
    conn = open_db(tmp_path / "s")
    yield conn
    conn.close()


def test_accounts_flow(db: sqlite3.Connection) -> None:
    a = _reg(db, given_name="Ana", family_name="Kovac")
    assert a == Account(
        id=1,
        tenant_id="t-1",
        object_id="o-1",
        display_name="A. Kovac",
        email="a.kovac@example.org",
        given_name="Ana",
        family_name="Kovac",
        profile_type="reader",
        created_at=T0,
        disabled=False,
    )
    b = _reg(
        db, object_id="o-2", email="a.kovac2@example.org", given_name="Anton", family_name="Kovac"
    )
    assert b.display_name == "A. Kovac (a.kovac2)" and b.profile_type == "reader"
    with pytest.raises(Conflict):
        _reg(db, object_id="o-3", email="a.kovac2@example.net")
    assert _count(db) == 2
    again = _reg(
        db, name="Ana Kovac", email="ana@example.org", given_name="Ana", family_name="Kovac"
    )
    assert again.id == 1 and again.display_name == "A. Kovac"
    assert again.email == "a.kovac@example.org"
    assert _count(db) == 2
    c = _reg(db, tenant_id="t-2", name="B. Novak", email="b.novak@example.org")
    assert c.id == 3 and c.display_name == "B. Novak"
    row = db.execute("SELECT given_name, family_name FROM accounts WHERE id=3").fetchone()
    assert row[0] is None and row[1] is None
    assert [x.id for x in list_accounts(db)] == [1, 2, 3]


def test_empty_local_part_bracket_holds_the_email(db: sqlite3.Connection) -> None:
    _reg(db)
    b = _reg(db, object_id="o-2", email="@x.org")
    assert b.display_name == "A. Kovac (@x.org)"


def test_unprintable_email_refused(db: sqlite3.Connection) -> None:
    with pytest.raises(StoreError) as err:
        _reg(db, email="b\x1b[31m@x.org")
    assert str(err.value) == "the account's email holds characters that cannot be printed"
    assert _count(db) == 0


def test_name_cleaning(db: sqlite3.Connection) -> None:
    d = _reg(db, name="  Ana\tKovac\u200b \n", email="ana.k@example.org")
    assert d.display_name == "Ana Kovac"
    with pytest.raises(StoreError):
        _reg(db, object_id="o-9", name="\u200b \t", email="z@example.org")
    assert _count(db) == 1
    assert db.in_transaction is False
    other = open_db(Path(db.execute("PRAGMA database_list").fetchone()[2]).parent)
    try:
        other.execute("PRAGMA busy_timeout=0")
        other.execute("BEGIN IMMEDIATE")
        other.execute("ROLLBACK")
    finally:
        other.close()


def test_validation(db: sqlite3.Connection) -> None:
    with pytest.raises(StoreError, match="timezone-aware"):
        _reg(db, now=datetime(2026, 11, 26, 9, 0))
    with pytest.raises(StoreError):
        _reg(db, tenant_id="")
    with pytest.raises(StoreError):
        _reg(db, object_id="  ")
    with pytest.raises(StoreError):
        _reg(db, email="")
    assert _count(db) == 0


def test_lookups(db: sqlite3.Connection) -> None:
    _reg(db)
    found = account_by_identity(db, "t-1", "o-1")
    assert found is not None and found.id == 1
    assert account_by_identity(db, "t-1", "nope") is None
    assert account_by_id(db, 999) is None
    by_id = account_by_id(db, 1)
    assert by_id is not None and by_id.display_name == "A. Kovac"


def test_disable(db: sqlite3.Connection) -> None:
    _reg(db)
    disable_account(db, 1)
    disable_account(db, 1)
    acc = account_by_id(db, 1)
    assert acc is not None and acc.disabled is True
    with pytest.raises(Missing, match="no account 999"):
        disable_account(db, 999)


def test_set_profile_type(db: sqlite3.Connection) -> None:
    _reg(db)
    for kind in ("admin", "reader"):
        set_profile_type(db, 1, kind)
        acc = account_by_id(db, 1)
        assert acc is not None and acc.profile_type == kind
    with pytest.raises(StoreError) as err:
        set_profile_type(db, 1, "owner")
    assert str(err.value) == "invalid profile type 'owner'; expected one of reader, analyst, admin"
    acc = account_by_id(db, 1)
    assert acc is not None and acc.profile_type == "reader"
    with pytest.raises(Missing, match="no account 999"):
        set_profile_type(db, 999, "analyst")


def _race(tmp_path: Path, trial: int, calls: list[dict[str, str]]):
    folder = tmp_path / f"r{trial}"
    open_db(folder).close()
    barrier = threading.Barrier(len(calls))
    out: list[Account] = []
    errors: list[BaseException] = []

    def work(kw: dict[str, str]) -> None:
        conn = None
        try:
            conn = open_db(folder)
            barrier.wait(timeout=60)
            out.append(register_reader(conn, given_name=None, family_name=None, now=T0, **kw))
        except BaseException as exc:  # noqa: BLE001 - collected and asserted empty by the caller
            errors.append(exc)
            barrier.abort()  # release the other waiter now instead of after the timeout
        finally:
            if conn is not None:
                conn.close()

    threads = [threading.Thread(target=work, args=(kw,)) for kw in calls]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    check = open_db(folder)
    rows = check.execute("SELECT object_id, display_name FROM accounts").fetchall()
    check.close()
    return out, errors, {(r[0], r[1]) for r in rows}, len(rows)


def test_race_one_identity(tmp_path: Path) -> None:
    kw = {
        "tenant_id": "t-1",
        "object_id": "o-1",
        "name": "A. Kovac",
        "email": "a.kovac@example.org",
    }
    for trial in range(20):
        out, errors, _, count = _race(tmp_path, trial, [kw, kw])
        assert errors == []
        assert len({a.id for a in out}) == 1 and len(out) == 2
        assert count == 1


def test_race_one_name(tmp_path: Path) -> None:
    one = {
        "tenant_id": "t-1",
        "object_id": "o-1",
        "name": "A. Kovac",
        "email": "a.kovac@example.org",
    }
    two = {
        "tenant_id": "t-1",
        "object_id": "o-2",
        "name": "A. Kovac",
        "email": "a.kovac2@example.org",
    }
    for trial in range(20):
        _, errors, names, count = _race(tmp_path, trial, [one, two])
        assert errors == []
        assert count == 2
        assert names in (
            {("o-1", "A. Kovac"), ("o-2", "A. Kovac (a.kovac2)")},
            {("o-1", "A. Kovac (a.kovac)"), ("o-2", "A. Kovac")},
        )


@posix_only
def test_foreign_owned_file_is_refused_with_message_four(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    folder = tmp_path / "store"
    open_db(folder).close()
    real = os.geteuid()
    calls: list[int] = []

    def fake_geteuid() -> int:
        calls.append(1)
        return real if len(calls) == 1 else real + 1

    monkeypatch.setattr(os, "geteuid", fake_geteuid)
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        f"the account store {folder / 'accounts.db'} belongs to another user; "
        "it must belong to the account that runs the application and be open to no one else "
        "(chmod 700 for the folder, 600 for the file)"
    )
