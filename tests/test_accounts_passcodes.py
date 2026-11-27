"""Passcodes and the lockout (answer key: .superpowers/sdd/sign-in/task-B-brief.md)."""

from __future__ import annotations

import hashlib
import sqlite3
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, cast
from zoneinfo import ZoneInfo

import pytest

from deploy_workflow.accounts.passcodes import set_passcode, try_passcode
from deploy_workflow.accounts.store import StoreError, open_db, write_transaction

AN = "Kestrel-Quarry-Mollusk"
AD = "Heron-Basalt-Juniper-7"
W = "Wrong-Passcode-000"
LOCKED_UNTIL = "2026-11-26T10:04:00+00:00"


def T(h: int, m: int, s: int = 0) -> datetime:
    return datetime(2026, 11, 26, h, m, s, tzinfo=UTC)


@pytest.fixture
def db(tmp_path: Path):
    conn = open_db(tmp_path / "store")
    yield conn
    conn.close()


@pytest.fixture
def db_an(db: sqlite3.Connection) -> sqlite3.Connection:
    set_passcode(db, "analyst", passcode=AN, now=T(8, 0))
    return db


def _rows(db: sqlite3.Connection) -> list[sqlite3.Row]:
    return db.execute("SELECT * FROM passcodes ORDER BY profile_type").fetchall()


def _count(db: sqlite3.Connection) -> int:
    return int(db.execute("SELECT COUNT(*) FROM passcodes").fetchone()[0])


def _five_failures(db: sqlite3.Connection, object_id: str = "o-1") -> None:
    for minute in range(5):
        assert try_passcode(db, object_id, passcode=W, now=T(9, minute)) == "wrong passcode"


def _attempt_row(db: sqlite3.Connection, object_id: str = "o-1") -> sqlite3.Row | None:
    return db.execute(
        "SELECT * FROM registration_attempts WHERE object_id=?", (object_id,)
    ).fetchone()


# --- Setting ---------------------------------------------------------------------------------


def test_01_too_short(db: sqlite3.Connection) -> None:
    with pytest.raises(StoreError) as err:
        set_passcode(db, "analyst", passcode="Kestrel-Qua", now=T(9, 0))
    assert str(err.value) == "a passcode needs at least 12 characters"
    assert _count(db) == 0


def test_02_twelve_accepted(db: sqlite3.Connection) -> None:
    set_passcode(db, "analyst", passcode="Kestrel-Quar", now=T(9, 0))
    rows = _rows(db)
    assert len(rows) == 1
    assert rows[0]["profile_type"] == "analyst"
    assert len(rows[0]["salt"]) == 16
    assert len(rows[0]["hash"]) == 64
    assert rows[0]["set_at"] == "2026-11-26T09:00:00+00:00"


def test_03_max_length(db: sqlite3.Connection) -> None:
    set_passcode(db, "analyst", passcode="K" * 1024, now=T(9, 0))
    before = tuple(_rows(db)[0])
    with pytest.raises(StoreError) as err:
        set_passcode(db, "analyst", passcode="K" * 1025, now=T(9, 1))
    assert str(err.value) == "a passcode may have at most 1024 characters"
    after = _rows(db)[0]
    assert (after["salt"], after["hash"]) == (before[2], before[1])
    assert tuple(after) == before


@pytest.mark.parametrize("kind", ["reader", "owner"])
def test_04_bad_type(db: sqlite3.Connection, kind: str) -> None:
    with pytest.raises(StoreError) as err:
        set_passcode(db, kind, passcode=AN, now=T(9, 0))
    assert str(err.value) == "invalid passcode type; expected one of analyst, admin"
    assert _count(db) == 0


def test_keyword_only_arguments(db: sqlite3.Connection) -> None:
    with pytest.raises(TypeError):
        cast(Any, set_passcode)(db, "admin", AD, T(9, 0))
    with pytest.raises(TypeError):
        cast(Any, try_passcode)(db, "o-1", AD, T(9, 0))
    assert _count(db) == 0
    assert db.execute("SELECT COUNT(*) FROM registration_attempts").fetchone()[0] == 0


def test_correct_passcode_on_full_store_raises(db: sqlite3.Connection) -> None:
    """The failure is recorded before the passcode is compared, so a store that cannot grow
    cannot be used to try guesses uncounted (simulated with max_page_count; no disk is filled)."""
    set_passcode(db, "admin", passcode=AD, now=T(8, 0))
    pages = db.execute("PRAGMA page_count").fetchone()[0]
    db.execute(f"PRAGMA max_page_count={pages}")
    filled = 0
    while filled < 1000:
        try:
            with write_transaction(db):
                db.execute(
                    "INSERT INTO registration_attempts VALUES (?, 1, ?, NULL)",
                    (f"filler-{filled:04d}-" + "x" * 40, T(9, 0).isoformat()),
                )
            filled += 1
        except sqlite3.OperationalError:
            break
    assert filled < 1000
    longer_than_any_filler = "attacker-" + "y" * 100  # its row cannot fit in the page's free space
    with pytest.raises(sqlite3.OperationalError):
        assert try_passcode(db, longer_than_any_filler, passcode=AD, now=T(9, 0)) is None


def test_05_parameters_pinned(db_an: sqlite3.Connection) -> None:
    row = _rows(db_an)[0]
    expected = hashlib.scrypt(
        AN.encode(), salt=row["salt"], n=16384, r=8, p=5, dklen=64, maxmem=67108864
    )
    assert row["hash"] == expected


def test_06_passcode_not_stored(db_an: sqlite3.Connection, tmp_path: Path) -> None:
    row = _rows(db_an)[0]
    haystacks: list[bytes] = [str(v).encode() for v in tuple(row)]
    haystacks += [bytes(row["hash"]), bytes(row["salt"]), bytes(row["hash"]).hex().encode()]
    haystacks.append(bytes(row["salt"]).hex().encode())
    for name in ("accounts.db", "accounts.db-wal"):
        path = tmp_path / "store" / name
        if path.exists():
            haystacks.append(path.read_bytes())
    for start in range(len(AN) - 4):
        for end in range(start + 5, len(AN) + 1):
            piece = AN[start:end].encode()
            for hay in haystacks:
                assert piece not in hay


def test_07_fresh_salt_each_time(db_an: sqlite3.Connection) -> None:
    first = _rows(db_an)[0]
    set_passcode(db_an, "analyst", passcode=AN, now=T(9, 0))
    rows = _rows(db_an)
    assert len(rows) == 1
    assert rows[0]["salt"] != first["salt"]
    assert rows[0]["hash"] != first["hash"]


def test_08_must_differ(db: sqlite3.Connection) -> None:
    set_passcode(db, "analyst", passcode=AN, now=T(9, 0))
    with pytest.raises(StoreError) as err:
        set_passcode(db, "admin", passcode=AN, now=T(9, 1))
    assert str(err.value) == "the analyst and admin passcodes must differ"
    assert [r["profile_type"] for r in _rows(db)] == ["analyst"]


def test_08b_must_differ_other_way(db: sqlite3.Connection) -> None:
    set_passcode(db, "admin", passcode=AD, now=T(9, 0))
    set_passcode(db, "analyst", passcode=AN, now=T(9, 0))
    before = tuple(db.execute("SELECT * FROM passcodes WHERE profile_type='analyst'").fetchone())
    with pytest.raises(StoreError) as err:
        set_passcode(db, "analyst", passcode=AD, now=T(9, 1))
    assert str(err.value) == "the analyst and admin passcodes must differ"
    after = db.execute("SELECT * FROM passcodes WHERE profile_type='analyst'").fetchone()
    assert tuple(after) == before


def test_09_replacing(db_an: sqlite3.Connection) -> None:
    set_passcode(db_an, "analyst", passcode="Kestrel-Quarry-Walrus9", now=T(9, 0))
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 0)) == "wrong passcode"
    assert try_passcode(db_an, "o-2", passcode="Kestrel-Quarry-Walrus9", now=T(9, 0)) == "analyst"


def test_10_matching(db_an: sqlite3.Connection) -> None:
    set_passcode(db_an, "admin", passcode=AD, now=T(9, 0))
    assert (
        try_passcode(db_an, "a", passcode="Kestrel-Quarry-Mollusc", now=T(9, 0)) == "wrong passcode"
    )
    assert (
        try_passcode(db_an, "b", passcode="kestrel-Quarry-Mollusk", now=T(9, 0)) == "wrong passcode"
    )
    assert try_passcode(db_an, "c", passcode=AN, now=T(9, 0)) == "analyst"
    assert try_passcode(db_an, "d", passcode=AD, now=T(9, 0)) == "admin"


def test_11_none_set(db: sqlite3.Connection) -> None:
    assert try_passcode(db, "o-1", passcode=AN, now=T(9, 0)) == "wrong passcode"


# --- Lockout ---------------------------------------------------------------------------------


def test_12_lock_and_release(db_an: sqlite3.Connection) -> None:
    _five_failures(db_an)
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 5)) == "locked"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(10, 3, 59)) == "locked"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(10, 4, 1)) == "analyst"
    row = _attempt_row(db_an)
    assert row is not None
    assert row["failed_count"] == 5
    assert row["locked_until"] == LOCKED_UNTIL


def test_13_lock_ends_exactly(db_an: sqlite3.Connection) -> None:
    _five_failures(db_an)
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(10, 4, 0)) == "analyst"


def test_14_stored_row(db_an: sqlite3.Connection) -> None:
    _five_failures(db_an)
    row = _attempt_row(db_an)
    assert row is not None
    assert row["failed_count"] == 5
    assert row["first_failure_at"] == "2026-11-26T09:00:00+00:00"
    assert row["locked_until"] == LOCKED_UNTIL


def test_15_locked_attempts_not_counted(db_an: sqlite3.Connection) -> None:
    _five_failures(db_an)
    assert try_passcode(db_an, "o-1", passcode=W, now=T(9, 30)) == "locked"
    row = _attempt_row(db_an)
    assert row is not None
    assert row["failed_count"] == 5
    assert row["locked_until"] == LOCKED_UNTIL
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(10, 4, 1)) == "analyst"


def test_16_other_identity_unaffected(db_an: sqlite3.Connection) -> None:
    _five_failures(db_an)
    assert try_passcode(db_an, "o-2", passcode=AN, now=T(9, 5)) == "analyst"


def test_17_success_neither_counts_nor_clears(db_an: sqlite3.Connection) -> None:
    for minute in range(4):
        assert try_passcode(db_an, "o-1", passcode=W, now=T(9, minute)) == "wrong passcode"
    before = tuple(_attempt_row(db_an) or ())
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 4)) == "analyst"
    row = _attempt_row(db_an)
    assert row is not None and tuple(row) == before
    assert row["failed_count"] == 4
    assert row["first_failure_at"] == T(9, 0).isoformat()
    assert row["locked_until"] is None
    assert try_passcode(db_an, "o-1", passcode=W, now=T(9, 5)) == "wrong passcode"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 6)) == "locked"


def test_17b_success_without_failures_leaves_no_row(db_an: sqlite3.Connection) -> None:
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 0)) == "analyst"
    assert _attempt_row(db_an) is None


def test_17c_wrong_after_window_restarts_at_one(db_an: sqlite3.Connection) -> None:
    for minute in range(4):
        assert try_passcode(db_an, "o-1", passcode=W, now=T(9, minute)) == "wrong passcode"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 30)) == "analyst"
    assert try_passcode(db_an, "o-1", passcode=W, now=T(10, 0)) == "wrong passcode"
    row = _attempt_row(db_an)
    assert row is not None and row["failed_count"] == 1
    assert row["first_failure_at"] == T(10, 0).isoformat()


def test_18_window_restarts(db_an: sqlite3.Connection) -> None:
    for h, m in ((9, 0), (9, 15), (9, 30), (9, 45), (10, 0)):
        assert try_passcode(db_an, "o-1", passcode=W, now=T(h, m)) == "wrong passcode"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(10, 1)) == "analyst"


def test_19_survives_reopen(db_an: sqlite3.Connection, tmp_path: Path) -> None:
    for minute in range(5):
        try_passcode(db_an, "o-1", passcode=W, now=T(9, minute))
    db_an.close()
    again = open_db(tmp_path / "store")
    try:
        assert try_passcode(again, "o-1", passcode=AN, now=T(9, 6)) == "locked"
    finally:
        again.close()


@pytest.mark.parametrize("bad", ["short", "K" * 1025])
def test_20_out_of_range_counts(db_an: sqlite3.Connection, bad: str) -> None:
    for minute in range(5):
        assert try_passcode(db_an, "o-1", passcode=bad, now=T(9, minute)) == "wrong passcode"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 5)) == "locked"


def test_21_validation(db_an: sqlite3.Connection) -> None:
    with pytest.raises(StoreError, match="timezone-aware"):
        try_passcode(db_an, "o-1", passcode=AN, now=datetime(2026, 11, 26, 9, 0))
    with pytest.raises(StoreError, match="timezone-aware"):
        set_passcode(db_an, "analyst", passcode=AN, now=datetime(2026, 11, 26, 9, 0))
    for bad in ("", "  "):
        with pytest.raises(StoreError):
            try_passcode(db_an, bad, passcode=AN, now=T(9, 0))


@pytest.mark.parametrize("trial", [1, 2, 3])
def test_22_concurrent_failures(tmp_path: Path, trial: int) -> None:
    folder = tmp_path / f"store{trial}"
    first = open_db(folder)
    set_passcode(first, "analyst", passcode=AN, now=T(8, 0))
    first.close()
    barrier = threading.Barrier(6)

    def worker() -> str:
        conn = open_db(folder)
        try:
            barrier.wait(timeout=60)
            return try_passcode(conn, "o-1", passcode=W, now=T(9, 0))
        finally:
            conn.close()

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(worker) for _ in range(5)]
        results = [worker(), *(f.result() for f in futures)]  # re-raises any worker's error
    assert sorted(results) == ["locked"] + ["wrong passcode"] * 5
    check = open_db(folder)
    try:
        row = _attempt_row(check)
        assert row is not None
        assert row["failed_count"] == 5
        assert row["locked_until"] == "2026-11-26T10:00:00+00:00"
    finally:
        check.close()


def test_m1_concurrent_sets_cannot_match(tmp_path: Path) -> None:
    for trial in range(3):
        folder = tmp_path / f"m1-{trial}"
        open_db(folder).close()
        barrier = threading.Barrier(2)

        def worker(kind: str, folder: Path = folder, barrier: threading.Barrier = barrier) -> str:
            conn = open_db(folder)
            try:
                barrier.wait(timeout=60)
                set_passcode(conn, kind, passcode=AN, now=T(9, 0))
                return "ok"
            except StoreError as exc:
                return str(exc)
            finally:
                conn.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = [f.result() for f in [pool.submit(worker, k) for k in ("analyst", "admin")]]
        assert sorted(outcomes) == sorted(["ok", "the analyst and admin passcodes must differ"])
        check = open_db(folder)
        try:
            assert _count(check) == 1
        finally:
            check.close()


LONDON = ZoneInfo("Europe/London")


def test_lock_is_real_hour_across_fall_back(db_an: sqlite3.Connection) -> None:
    start = datetime(2026, 10, 25, 1, 30, tzinfo=LONDON, fold=0)
    for _ in range(5):
        assert try_passcode(db_an, "o-1", passcode=W, now=start) == "wrong passcode"
    row = _attempt_row(db_an)
    assert row is not None
    assert row["locked_until"] == "2026-10-25T01:30:00+00:00"
    # wall-clock `+` on a zoned datetime would skip the repeated hour; add to the UTC instant
    late = start.astimezone(UTC) + timedelta(minutes=59, seconds=59)
    assert try_passcode(db_an, "o-1", passcode=AN, now=late) == "locked"


def test_lock_is_real_hour_across_spring_gap(db_an: sqlite3.Connection) -> None:
    start = datetime(2026, 3, 29, 1, 30, tzinfo=LONDON)
    for _ in range(5):
        assert try_passcode(db_an, "o-1", passcode=W, now=start) == "wrong passcode"
    row = _attempt_row(db_an)
    assert row is not None
    assert row["locked_until"] == "2026-03-29T02:30:00+00:00"
    assert try_passcode(db_an, "o-1", passcode=AN, now=start) == "locked"


def test_nothing_hashed_while_locked(
    db_an: sqlite3.Connection, monkeypatch: pytest.MonkeyPatch
) -> None:
    _five_failures(db_an)

    def refuse(*_args: object, **_kw: object) -> bytes:
        raise AssertionError("hashed while locked")

    monkeypatch.setattr("deploy_workflow.accounts.passcodes._hash", refuse)
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 5)) == "locked"


BAD_TEXT = "Kestrel\udcffQuarry-X"


def test_invalid_text_is_a_counted_wrong_attempt(db_an: sqlite3.Connection) -> None:
    assert try_passcode(db_an, "o-1", passcode=BAD_TEXT, now=T(9, 0)) == "wrong passcode"
    row = _attempt_row(db_an)
    assert row is not None
    assert row["failed_count"] == 1


def test_invalid_text_locks(db_an: sqlite3.Connection) -> None:
    for minute in range(5):
        assert try_passcode(db_an, "o-1", passcode=BAD_TEXT, now=T(9, minute)) == "wrong passcode"
    assert try_passcode(db_an, "o-1", passcode=AN, now=T(9, 5)) == "locked"


def test_invalid_text_cannot_be_set(db: sqlite3.Connection) -> None:
    with pytest.raises(StoreError) as err:
        set_passcode(db, "analyst", passcode=BAD_TEXT, now=T(9, 0))
    assert str(err.value) == "a passcode must be valid text"
    assert _count(db) == 0
