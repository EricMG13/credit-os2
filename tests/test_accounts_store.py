"""Answer key items 1-22 of slice 1 task A (account store and accounts)."""

from __future__ import annotations

import errno
import os
import sqlite3
import sys
import threading
from datetime import UTC, datetime
from pathlib import Path, PurePath, PureWindowsPath
from typing import Any

import pytest

from deploy_workflow.accounts import store as store_module
from deploy_workflow.accounts.store import (
    Account,
    Conflict,
    Missing,
    StoreError,
    _inside_local_appdata,
    account_by_id,
    account_by_identity,
    disable_account,
    enable_account,
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
    assert _meta(db, "schema_version") == "2"
    h = _meta(db, "schema_hash")
    assert len(h) == 64 and h == h.lower() and all(c in "0123456789abcdef" for c in h)
    db.close()


def test_reopen(tmp_path: Path) -> None:
    open_db(tmp_path).close()
    db = open_db(tmp_path)
    assert _meta(db, "schema_version") == "2"
    assert _tables(db) == ["accounts", "meta", "passcodes", "registration_attempts", "sessions"]
    db.close()


def test_later_version_refused(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    db.execute("UPDATE meta SET value='3' WHERE key='schema_version'")
    db.commit()
    db.close()
    with pytest.raises(StoreError) as err:
        open_db(tmp_path)
    assert "accounts.db" in str(err.value)
    assert "later than this build's 2" in str(err.value)


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
        assert results == ["2"] * 4


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
    third = _reg(db, object_id="o-3", email="a.kovac2@example.net")
    assert third.display_name == "A. Kovac (a.kovac2@example.net)"
    with pytest.raises(Conflict):
        _reg(db, object_id="o-4", email="a.kovac2@example.net")
    assert _count(db) == 3
    again = _reg(
        db, name="Ana Kovac", email="ana@example.org", given_name="Ana", family_name="Kovac"
    )
    assert again.id == 1 and again.display_name == "A. Kovac"
    assert again.email == "a.kovac@example.org"
    assert _count(db) == 3
    c = _reg(db, tenant_id="t-2", name="B. Novak", email="b.novak@example.org")
    assert c.id == 4 and c.display_name == "B. Novak"
    row = db.execute("SELECT given_name, family_name FROM accounts WHERE id=4").fetchone()
    assert row[0] is None and row[1] is None
    assert [x.id for x in list_accounts(db)] == [1, 2, 3, 4]


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


# ---- slice 2, T1: folder rules in open_db ----

LOCAL = r"C:\Users\ana\AppData\Local"
_SAME = PureWindowsPath(r"C:\Users\ana\AppData\Local\x")
_ACL_ACCESS = "system.posix_acl_access"
_ACL_DEFAULT = "system.posix_acl_default"
_REMEDY_TEXT = (
    "it must belong to the account that runs the application and be open to no one else "
    "(chmod 700 for the folder, 600 for the file)"
)


def test_relative_folder_refused_by_open_db(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.chdir(tmp_path)
    with pytest.raises(StoreError) as err:
        open_db(Path("relative/dir"))
    assert str(err.value) == "the account store's folder must be an absolute path"
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize(
    ("folder", "local_appdata", "expected"),
    [
        (PureWindowsPath(r"C:\Users\ana\AppData\Local\credit-os\accounts"), LOCAL, True),
        (
            PureWindowsPath(r"C:\Users\ana\AppData\Local\credit-os\accounts"),
            r"c:\users\ANA\appdata\local",
            True,
        ),
        (PureWindowsPath(LOCAL), LOCAL, True),
        (PureWindowsPath(r"C:\Users\ana\AppData\LocalLow\x"), LOCAL, False),
        (PureWindowsPath(r"D:\shared\accounts"), LOCAL, False),
        (PureWindowsPath(r"\\server\share\accounts"), LOCAL, False),
        (PureWindowsPath(r"C:\Users\ana\AppData\Local\..\..\bob\x"), LOCAL, False),
        (_SAME, None, False),
        (_SAME, "", False),
        (_SAME, r"AppData\Local", False),
        (_SAME, r"C:Users\ana\AppData\Local", False),
        (_SAME, r"\\server\share\Local", False),
        (PureWindowsPath(r"\\server\share\Local\x"), r"\\server\share\Local", False),
    ],
)
def test_inside_local_appdata(folder: PurePath, local_appdata: str | None, expected: bool) -> None:
    assert _inside_local_appdata(folder, local_appdata) is expected


def test_windows_branch_asks_the_decision_with_real_paths(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    folder = tmp_path / "store"
    local = tmp_path / "local"
    monkeypatch.setattr(store_module, "_IS_WINDOWS", True)
    monkeypatch.setenv("LOCALAPPDATA", str(local))
    seen: list[tuple[PurePath, str | None]] = []

    def refuse(where: PurePath, base: str | None) -> bool:
        seen.append((where, base))
        return False

    monkeypatch.setattr(store_module, "_inside_local_appdata", refuse)
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        "on Windows the account store's folder must be inside your own %LOCALAPPDATA%, "
        "which only you can open"
    )
    assert not folder.exists()
    assert len(seen) == 1
    assert str(seen[0][0]) == os.path.realpath(folder)
    assert seen[0][1] == os.path.realpath(local)

    monkeypatch.setattr(store_module, "_inside_local_appdata", lambda where, base: True)
    open_db(folder).close()
    assert (folder / "accounts.db").is_file()


def test_windows_branch_without_localappdata(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(store_module, "_IS_WINDOWS", True)
    monkeypatch.delenv("LOCALAPPDATA", raising=False)
    seen: list[str | None] = []

    def refuse(where: PurePath, base: str | None) -> bool:
        seen.append(base)
        return False

    monkeypatch.setattr(store_module, "_inside_local_appdata", refuse)
    with pytest.raises(StoreError, match="inside your own %LOCALAPPDATA%"):
        open_db(tmp_path / "store")
    assert seen == [None]
    assert not (tmp_path / "store").exists()


def _fake_listxattr(
    monkeypatch: pytest.MonkeyPatch, answers: dict[str, list[str] | OSError]
) -> None:
    """Simulate extended attributes by path (no real ACL is set); unnamed paths have none."""

    def listxattr(path: Any = None, *, follow_symlinks: bool = True) -> list[str]:
        answer = answers.get(str(path), [])
        if isinstance(answer, OSError):
            raise answer
        return answer

    monkeypatch.setattr(sys, "platform", "linux")
    monkeypatch.setattr(os, "listxattr", listxattr, raising=False)


@posix_only
@pytest.mark.parametrize("attribute", [_ACL_ACCESS, _ACL_DEFAULT])
def test_linux_folder_acl_refused(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, attribute: str
) -> None:
    folder = tmp_path / "store"
    _fake_listxattr(monkeypatch, {str(folder): [attribute]})
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        f"the account store's folder {folder} carries an access-control list; {_REMEDY_TEXT}"
    )


@posix_only
@pytest.mark.parametrize("attribute", [_ACL_ACCESS, _ACL_DEFAULT])
def test_linux_file_acl_refused(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, attribute: str
) -> None:
    folder = tmp_path / "store"
    path = folder / "accounts.db"
    _fake_listxattr(monkeypatch, {str(path): [attribute]})
    with pytest.raises(StoreError) as err:
        open_db(folder)
    assert str(err.value) == (
        f"the account store {path} carries an access-control list; {_REMEDY_TEXT}"
    )


@posix_only
@pytest.mark.parametrize("code", [errno.ENOTSUP, errno.EOPNOTSUPP])
def test_linux_no_extended_attributes_means_no_acl(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, code: int
) -> None:
    folder = tmp_path / "store"
    error = OSError(code, "")
    _fake_listxattr(monkeypatch, {str(folder): error, str(folder / "accounts.db"): error})
    open_db(folder).close()


@posix_only
def test_linux_other_listxattr_error_propagates(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    folder = tmp_path / "store"
    boom = OSError(errno.EACCES, "")
    _fake_listxattr(monkeypatch, {str(folder): boom})
    with pytest.raises(OSError) as err:
        open_db(folder)
    assert err.value is boom
    assert err.value.errno == errno.EACCES


@posix_only
def test_linux_unrelated_attributes_open(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    folder = tmp_path / "store"
    _fake_listxattr(monkeypatch, {str(folder): ["user.note"]})
    open_db(folder).close()


# ---- slice 2, T1: display names ----


def _name(db: sqlite3.Connection, n: int, name: str, email: str) -> str:
    return _reg(db, object_id=f"n-{n}", name=name, email=email).display_name


def test_name_three_candidates(db: sqlite3.Connection) -> None:
    assert _reg(db).display_name == "A. Kovac"
    assert _name(db, 2, "A. Kovac", "a.kovac2@example.org") == "A. Kovac (a.kovac2)"
    assert _name(db, 3, "A. Kovac", "a.kovac2@example.net") == "A. Kovac (a.kovac2@example.net)"
    with pytest.raises(Conflict) as err:
        _name(db, 4, "A. Kovac", "a.kovac2@example.net")
    assert str(err.value) == ("the display name 'A. Kovac' and its two bracketed forms are taken")
    assert _count(db) == 3


def test_name_squatter_of_the_bracketed_form(db: sqlite3.Connection) -> None:
    assert _name(db, 1, "A. Kovac (a.kovac2)", "squat@example.org") == "A. Kovac (a.kovac2)"
    assert _name(db, 2, "A. Kovac", "a.kovac@example.org") == "A. Kovac"
    assert _name(db, 3, "A. Kovac", "a.kovac2@example.org") == "A. Kovac (a.kovac2@example.org)"


def test_name_same_local_part_different_brands(db: sqlite3.Connection) -> None:
    got = [_name(db, i, "John Smith", f"john.smith@brand-{b}.example") for i, b in enumerate("abc")]
    assert got == [
        "John Smith",
        "John Smith (john.smith)",
        "John Smith (john.smith@brand-c.example)",
    ]


def test_name_reserved_is_never_free(db: sqlite3.Connection) -> None:
    assert _name(db, 1, "before accounts", "b@example.org") == "before accounts (b)"


def test_name_is_cut_to_sixty(db: sqlite3.Connection) -> None:
    assert _name(db, 1, "x" * 70, "x@example.org") == "x" * 60


def test_name_bracket_fits_sixty(db: sqlite3.Connection) -> None:
    assert _name(db, 1, "N" * 70, "n@example.org") == "N" * 60
    got = _name(db, 2, "N" * 70, "nn@example.org")
    assert got == "N" * 55 + " (nn)" and len(got) == 60


def test_name_long_local_part_is_marked(db: sqlite3.Connection) -> None:
    email = "l" * 50 + "@x.org"
    assert _name(db, 1, "Ana Kovac", "ak@x.org") == "Ana Kovac"
    second = _name(db, 2, "Ana Kovac", email)
    assert second == "Ana Kovac (" + "l" * 39 + "…)" and len(second) == 52
    third = _name(db, 3, "Ana Kovac", email)
    assert third == "Ana Kovac (…" + "l" * 33 + "@x.org)" and len(third) == 52


def test_name_cut_name_with_bracket(db: sqlite3.Connection) -> None:
    long_name = "Ana " + "K" * 60
    assert _name(db, 1, long_name, "a@x.org") == "Ana " + "K" * 56
    assert _name(db, 2, long_name, "ak@x.org") == "Ana " + "K" * 51 + " (ak)"


def test_name_long_double_barrelled(db: sqlite3.Connection) -> None:
    long_name = "Konstantinopoulou-Papadimitriou, Alexandra (Credit Research, London)"
    assert len(long_name) == 68
    mail = "alexandra.konstantinopoulou-papadimitriou@example."
    got = [
        _name(db, 1, long_name, "k@example.org"),
        _name(db, 2, long_name, mail + "org"),
        _name(db, 3, long_name, mail + "org"),
        _name(db, 4, long_name, mail + "net"),
    ]
    assert got == [
        "Konstantinopoulou-Papadimitriou, Alexandra (Credit Research,",
        "Konstantinopoulou (alexandra.konstantinopoulou-papadimitri…)",
        "Konstantinopoulou (…tantinopoulou-papadimitriou@example.org)",
        "Konstantinopoulou (…tantinopoulou-papadimitriou@example.net)",
    ]
    assert all(len(x) <= 60 for x in got)


# ---- review fixes, 2026-11-27 ----


def _delete_mode_store(folder: Path, edit: str) -> Path:
    folder.mkdir(mode=0o700)
    path = folder / "accounts.db"
    raw = sqlite3.connect(path)
    raw.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    raw.execute(edit)
    raw.commit()
    raw.close()
    path.chmod(0o600)
    return path


@pytest.mark.parametrize(
    "edit",
    [
        "INSERT INTO meta VALUES ('schema_version', '99')",
        "INSERT INTO meta VALUES ('schema_version', '1'), ('schema_hash', 'not-this-build')",
    ],
)
def test_refused_store_keeps_its_journal_mode(tmp_path: Path, edit: str) -> None:
    path = _delete_mode_store(tmp_path / "s", edit)
    with pytest.raises(StoreError):
        open_db(path.parent)
    raw = sqlite3.connect(path)
    try:
        assert raw.execute("PRAGMA journal_mode").fetchone()[0] == "delete"
    finally:
        raw.close()
    assert not Path(f"{path}-wal").exists() and not Path(f"{path}-shm").exists()


def test_valid_store_ends_in_wal(tmp_path: Path) -> None:
    db = open_db(tmp_path / "s")
    try:
        assert db.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
    finally:
        db.close()


def test_enable_account(db: sqlite3.Connection) -> None:
    account = _reg(db)
    disable_account(db, account.id)
    enable_account(db, account.id)
    reread = account_by_id(db, account.id)
    assert reread is not None and reread.disabled is False
    with pytest.raises(Missing):
        enable_account(db, 999)


def test_name_keeps_zero_width_joiners_only(db: sqlite3.Connection) -> None:
    zwnj, zwj, bidi_override, zwsp = (chr(0x200C), chr(0x200D), chr(0x202E), chr(0x200B))
    persian = "\u0646\u0627\u0645" + zwnj + "\u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc"
    kept = _reg(db, object_id="o-p", email="p@example.org", name=persian)
    assert kept.display_name == persian
    joined = _reg(db, object_id="o-j", email="j@example.org", name="A" + zwj + "B")
    assert joined.display_name == "A" + zwj + "B"
    bidi = _reg(db, object_id="o-b", email="b@example.org", name="A" + bidi_override + "B")
    assert bidi.display_name == "AB"
    space = _reg(db, object_id="o-z", email="z@example.org", name="C" + zwsp + "D")
    assert space.display_name == "CD"


# --- parked batch 2026-11-27 -------------------------------------------------------------------


def _register(db: sqlite3.Connection, name: str, email: str = "x@example.org") -> Account:
    return register_reader(
        db,
        tenant_id="t-1",
        object_id=email,
        name=name,
        email=email,
        given_name=None,
        family_name=None,
        now=T0,
    )


@pytest.mark.parametrize("name", ["\u200d", "\u200c\u200d", " \u200d "])
def test_joiner_only_name_is_refused_and_writes_nothing(tmp_path: Path, name: str) -> None:
    db = open_db(tmp_path / "store")
    with pytest.raises(StoreError, match="the account has no name"):
        _register(db, name)
    assert db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 0


def test_joiner_inside_a_name_is_kept(tmp_path: Path) -> None:
    db = open_db(tmp_path / "store")
    assert _register(db, "A\u200dB").display_name == "A\u200dB"


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("BEFORE ACCOUNTS", "BEFORE ACCOUNTS (ba)"),
        ("Before Accounts", "Before Accounts (ba)"),
        ("before accounts", "before accounts (ba)"),
        ("Before\u200d Accounts", "Before\u200d Accounts (ba)"),
        ("be\u200cfore accounts", "be\u200cfore accounts (ba)"),
    ],
)
def test_reserved_name_matches_in_any_case(tmp_path: Path, name: str, expected: str) -> None:
    db = open_db(tmp_path / "store")
    assert _register(db, name, "ba@example.org").display_name == expected


def test_open_db_without_create_makes_nothing(tmp_path: Path) -> None:
    folder = tmp_path / "store"
    with pytest.raises(StoreError, match=f"^there is no account store in {folder}$"):
        open_db(folder, create=False)
    assert not folder.exists()
    folder.mkdir(mode=0o700)
    with pytest.raises(StoreError, match="there is no account store"):
        open_db(folder, create=False)
    assert list(folder.iterdir()) == []


def test_open_db_without_create_opens_existing_store(tmp_path: Path) -> None:
    folder = tmp_path / "store"
    open_db(folder).close()
    db = open_db(folder, create=False)
    assert db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 0
    db.close()


def test_open_db_without_create_never_recreates_a_file_deleted_before_connect(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    folder = tmp_path / "store"
    open_db(folder).close()
    real_connect = sqlite3.connect

    def delete_then_connect(*args: Any, **kwargs: Any) -> sqlite3.Connection:
        # The last step every platform runs before the connect, so the connect itself meets
        # the missing file (the ACL and privacy checks have all passed by now).
        (folder / "accounts.db").unlink()
        return real_connect(*args, **kwargs)

    monkeypatch.setattr(store_module.sqlite3, "connect", delete_then_connect)
    with pytest.raises(sqlite3.OperationalError):
        open_db(folder, create=False)
    assert not (folder / "accounts.db").exists()
