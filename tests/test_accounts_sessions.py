"""Answer key items 1-10 of slice 2 task T2 (session tokens)."""

from __future__ import annotations

import hashlib
import re
import sqlite3
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from deploy_workflow.accounts import store
from deploy_workflow.accounts.sessions import end_session, mint_session, session_account

T0 = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
URLSAFE = re.compile(r"[A-Za-z0-9_-]+")


@pytest.fixture
def db(tmp_path: Path) -> sqlite3.Connection:
    conn = store.open_db(tmp_path / "store")
    store.register_reader(
        conn,
        tenant_id="t-1",
        object_id="o-1",
        name="A. Kovac",
        email="a.kovac@example.org",
        given_name=None,
        family_name=None,
        now=T0,
    )
    return conn


def _rows(db: sqlite3.Connection) -> list[sqlite3.Row]:
    return list(db.execute("SELECT * FROM sessions"))


def test_token_shape(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    assert len(token) == 43
    assert URLSAFE.fullmatch(token)


def test_stored_row(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    (row,) = _rows(db)
    assert re.fullmatch(r"[0-9a-f]{64}", row["token_hash"])
    assert row["token_hash"] != token
    assert row["token_hash"] == hashlib.sha256(token.encode()).hexdigest()
    assert row["expires_at"] == "2026-11-26T21:00:00+00:00"
    assert row["created_at"] == row["last_used_at"] == "2026-11-26T09:00:00+00:00"


def test_valid_just_before_expiry(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    later = T0 + timedelta(hours=11, minutes=59, seconds=59)
    account = session_account(db, token, now=later)
    assert account is not None
    assert account.id == 1


def test_expired(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    assert session_account(db, token, now=T0 + timedelta(hours=12, seconds=1)) is None
    assert session_account(db, token, now=T0 + timedelta(hours=12)) is None


def test_lookup_writes_nothing(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    session_account(db, token, now=T0 + timedelta(hours=1))
    assert _rows(db)[0]["last_used_at"] == "2026-11-26T09:00:00+00:00"


def test_disabled_account(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    store.disable_account(db, 1)
    assert session_account(db, token, now=T0) is None
    with pytest.raises(store.StoreError) as sign_in:
        mint_session(db, 1, now=T0)
    assert str(sign_in.value) == "a disabled account cannot sign in"
    assert not isinstance(sign_in.value, store.Missing)
    with pytest.raises(store.Missing) as unknown:
        mint_session(db, 999, now=T0)
    assert str(unknown.value) == "no account 999"


def test_end_session(db: sqlite3.Connection) -> None:
    token = mint_session(db, 1, now=T0)
    end_session(db, token)
    assert session_account(db, token, now=T0) is None
    assert _rows(db) == []
    end_session(db, token)
    end_session(db, "not a token")


def test_two_sessions_independent(db: sqlite3.Connection) -> None:
    first = mint_session(db, 1, now=T0)
    second = mint_session(db, 1, now=T0)
    assert first != second
    assert len(_rows(db)) == 2
    end_session(db, first)
    assert session_account(db, first, now=T0) is None
    assert session_account(db, second, now=T0) is not None


@pytest.mark.parametrize("bad", ["", "x" * 42, "x" * 44, "!" * 43, "x" * 43])
def test_malformed_or_unknown_token(db: sqlite3.Connection, bad: str) -> None:
    mint_session(db, 1, now=T0)
    assert session_account(db, bad, now=T0) is None


def test_naive_time(db: sqlite3.Connection) -> None:
    naive = datetime(2026, 11, 26, 9, 0)
    with pytest.raises(store.StoreError, match="timezone-aware"):
        mint_session(db, 1, now=naive)
    token = mint_session(db, 1, now=T0)
    with pytest.raises(store.StoreError, match="timezone-aware"):
        session_account(db, token, now=naive)


@pytest.mark.parametrize(
    ("local", "created", "expires"),
    [
        (
            datetime(2026, 10, 24, 20, 0, tzinfo=ZoneInfo("Europe/London")),
            "2026-10-24T19:00:00+00:00",
            "2026-10-25T07:00:00+00:00",
        ),
        (
            datetime(2026, 3, 28, 20, 0, tzinfo=ZoneInfo("Europe/London")),
            "2026-03-28T20:00:00+00:00",
            "2026-03-29T08:00:00+00:00",
        ),
    ],
)
def test_twelve_real_hours_across_clock_change(
    db: sqlite3.Connection, local: datetime, created: str, expires: str
) -> None:
    mint_session(db, 1, now=local)
    (row,) = _rows(db)
    assert row["created_at"] == row["last_used_at"] == created
    assert row["expires_at"] == expires


@pytest.mark.parametrize("bad", ["", "x" * 42, "x" * 44, "!" * 43])
def test_malformed_token_never_touches_store(tmp_path: Path, bad: str) -> None:
    conn = store.open_db(tmp_path / "store")
    conn.close()  # any use of a closed connection raises sqlite3.ProgrammingError
    assert session_account(conn, bad, now=T0) is None
    end_session(conn, bad)


def test_zoned_now_in_another_offset_gives_the_same_answer(db: sqlite3.Connection) -> None:
    plus5 = timezone(timedelta(hours=5))
    token = mint_session(db, 1, now=T0)
    expiry = T0 + timedelta(hours=12)
    before = session_account(db, token, now=(expiry - timedelta(seconds=1)).astimezone(plus5))
    assert before is not None
    assert before == session_account(db, token, now=expiry - timedelta(seconds=1))
    assert session_account(db, token, now=(expiry + timedelta(seconds=1)).astimezone(plus5)) is None
