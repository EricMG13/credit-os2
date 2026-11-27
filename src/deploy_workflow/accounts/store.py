"""The account store: `<folder>/accounts.db`, its migrations and the account functions.

Standard library only; it imports no other deploy_workflow module. Times are injected and UTC.
No passcode, hash, salt or token is ever put in a message here.
"""

from __future__ import annotations

import hashlib
import os
import sqlite3
import time
import unicodedata
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

PROFILE_TYPES = ("reader", "analyst", "admin")
_BUSY_SECONDS = 30
_OTHERS_ANY = 0o077
_REMEDY = (
    "it must belong to the account that runs the application and be open to no one else"
    " (chmod 700 for the folder, 600 for the file)"
)
_UNPRINTABLE = ("Cc", "Cf", "Cs")
_JOINERS = "\u200c\u200d"  # needed to spell Persian and other scripts; kept in names


class StoreError(ValueError):
    """The store or a request to it is not usable."""


class Conflict(StoreError):
    """A display name cannot be made unique."""


class Missing(StoreError):
    """An unknown account id."""


_MIGRATION_1 = """
CREATE TABLE accounts(
    id INTEGER PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    object_id TEXT NOT NULL,
    display_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    given_name TEXT,
    family_name TEXT,
    profile_type TEXT NOT NULL CHECK (profile_type IN ('reader', 'analyst', 'admin')),
    created_at TEXT NOT NULL,
    disabled INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0, 1)),
    UNIQUE (tenant_id, object_id)
);
CREATE TABLE sessions(
    token_hash TEXT PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    created_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE TABLE passcodes(
    profile_type TEXT PRIMARY KEY CHECK (profile_type IN ('analyst', 'admin')),
    hash BLOB NOT NULL,
    salt BLOB NOT NULL,
    set_at TEXT NOT NULL
);
CREATE TABLE registration_attempts(
    object_id TEXT PRIMARY KEY,
    failed_count INTEGER NOT NULL CHECK (failed_count >= 1),
    first_failure_at TEXT NOT NULL,
    locked_until TEXT
);
"""

# Ordered; later slices append. Index i holds the script that brings the schema to version i + 1.
MIGRATIONS = [_MIGRATION_1]


@dataclass(frozen=True)
class Account:
    id: int
    tenant_id: str
    object_id: str
    display_name: str
    email: str
    given_name: str | None
    family_name: str | None
    profile_type: str
    created_at: datetime
    disabled: bool


def scripts_hash(version: int) -> str:
    """The sha256 of the migration scripts that bring a store to `version`, as `meta` records it."""
    digest = hashlib.sha256()
    for script in MIGRATIONS[:version]:
        digest.update(hashlib.sha256(script.encode("utf-8")).digest())
    return digest.hexdigest()


def _schema_version(db: sqlite3.Connection) -> int:
    has_meta = db.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'"
    ).fetchone()
    if has_meta is None:
        return 0
    row = db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
    return int(row[0]) if row else 0


@contextmanager
def write_transaction(db: sqlite3.Connection) -> Iterator[None]:
    """Hold the write lock: commit when the block ends, roll back if it raises."""
    db.execute("BEGIN IMMEDIATE")
    try:
        yield
        db.execute("COMMIT")
    except BaseException:
        if db.in_transaction:
            db.execute("ROLLBACK")
        raise


def _apply_migration(db: sqlite3.Connection, version: int) -> None:
    """Apply one migration under the write lock; skip it if another opener already did."""
    with write_transaction(db):
        if _schema_version(db) >= version:
            return
        db.execute("CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        db.executescript(MIGRATIONS[version - 1])
        db.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_version', ?)",
            (str(version),),
        )
        db.execute(
            "INSERT OR REPLACE INTO meta(key, value) VALUES ('schema_hash', ?)",
            (scripts_hash(version),),
        )


def _made_by(db: sqlite3.Connection) -> tuple[int, str | None]:
    """The store's schema version and recorded scripts' hash, read in one statement."""
    if (
        db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='meta'").fetchone()
        is None
    ):
        return 0, None
    rows = db.execute(
        "SELECT key, value FROM meta WHERE key IN ('schema_version', 'schema_hash')"
    ).fetchall()
    held = {str(row["key"]): str(row["value"]) for row in rows}
    return int(held.get("schema_version", 0)), held.get("schema_hash")


def _check_made_here(db: sqlite3.Connection, path: Path) -> None:
    """Refuse a store of a later version or whose recorded scripts' hash is not this build's."""
    version, recorded = _made_by(db)
    if version > len(MIGRATIONS):
        raise StoreError(
            f"the account store {path} is at schema version {version}, later than this build's"
            f" {len(MIGRATIONS)}: open it with the build that made it"
        )
    if version >= 1 and recorded != scripts_hash(version):
        raise StoreError(
            f"the account store {path} at schema version {version} was made by another build"
            " whose migrations differ from this one's: open it with the build that made it"
        )


def _migrate(db: sqlite3.Connection) -> None:
    # executescript leaves an explicit transaction alone only outside legacy transaction control.
    db.autocommit = True
    try:
        for version in range(1, len(MIGRATIONS) + 1):
            if _schema_version(db) < version:
                _apply_migration(db, version)
    finally:
        db.autocommit = sqlite3.LEGACY_TRANSACTION_CONTROL


def _retry_locked[T](action: Callable[[], T]) -> T:
    """Run `action`, retrying on "locked" (SQLite ignores the busy timeout for a pragma or read on
    a fresh file another opener is initialising) until the same 30 s deadline."""
    deadline = time.monotonic() + _BUSY_SECONDS
    while True:
        try:
            return action()
        except sqlite3.OperationalError as exc:
            if "locked" not in str(exc) or time.monotonic() >= deadline:
                raise
            time.sleep(0.02)


def _enable_wal(db: sqlite3.Connection) -> None:
    mode = _retry_locked(lambda: db.execute("PRAGMA journal_mode=WAL").fetchone()[0])
    if str(mode).lower() != "wal":
        raise StoreError(f"could not enable WAL mode; database reports {mode!r}")


def _check_private(target: Path, label: str) -> None:
    """On POSIX, refuse a folder or file that another user owns or can open (R16)."""
    info = target.stat()
    if info.st_mode & _OTHERS_ANY:
        raise StoreError(f"{label} {target} can be opened by other users; {_REMEDY}")
    if info.st_uid != os.geteuid():
        raise StoreError(f"{label} {target} belongs to another user; {_REMEDY}")


def _create_file(path: Path) -> None:
    """On POSIX, create the database file at 0o600 so SQLite's -wal and -shm copy that mode."""
    try:
        os.close(os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600))
    except FileExistsError:
        return  # another opener made it first; the mode check judges it


def _create_folder(folder: Path) -> None:
    if folder.exists():
        return
    folder.parent.mkdir(parents=True, exist_ok=True)
    try:
        folder.mkdir(mode=0o700)
    except FileExistsError:
        return  # another opener made it first; the mode check below judges it
    if os.name == "posix":
        folder.chmod(0o700)  # the umask may have cleared bits from the mkdir mode, never added


def open_db(folder: Path) -> sqlite3.Connection:
    """Open (creating if needed) `<folder>/accounts.db` and apply migrations; StoreError for a
    store others can open or that another user owns, or one this build's migrations did not make."""
    _create_folder(folder)
    path = folder / "accounts.db"
    if os.name == "posix":
        _check_private(folder, "the account store's folder")
        _create_file(path)
        _check_private(path, "the account store")
    db = sqlite3.connect(path, timeout=_BUSY_SECONDS)
    try:
        db.row_factory = sqlite3.Row
        # Before WAL, so a refused store keeps its journal mode.
        _retry_locked(lambda: _check_made_here(db, path))
        _enable_wal(db)
        db.execute("PRAGMA foreign_keys=ON")
        _migrate(db)
    except BaseException:
        db.close()
        raise
    return db


def utc_text(at: datetime) -> str:
    if at.tzinfo is None or at.utcoffset() is None:
        raise StoreError("time must be timezone-aware")
    return at.astimezone(UTC).isoformat()


def _clean(text: str) -> str:
    spaced = "".join(" " if ch in "\t\n\r" else ch for ch in text)
    kept = "".join(
        ch for ch in spaced if ch in _JOINERS or unicodedata.category(ch) not in _UNPRINTABLE
    )
    return " ".join(unicodedata.normalize("NFC", kept).split())


def _account(row: sqlite3.Row) -> Account:
    return Account(
        id=int(row["id"]),
        tenant_id=str(row["tenant_id"]),
        object_id=str(row["object_id"]),
        display_name=str(row["display_name"]),
        email=str(row["email"]),
        given_name=row["given_name"],
        family_name=row["family_name"],
        profile_type=str(row["profile_type"]),
        created_at=datetime.fromisoformat(str(row["created_at"])),
        disabled=bool(row["disabled"]),
    )


def account_by_identity(db: sqlite3.Connection, tenant_id: str, object_id: str) -> Account | None:
    row = db.execute(
        "SELECT * FROM accounts WHERE tenant_id=? AND object_id=?", (tenant_id, object_id)
    ).fetchone()
    return _account(row) if row else None


def account_by_id(db: sqlite3.Connection, account_id: int) -> Account | None:
    row = db.execute("SELECT * FROM accounts WHERE id=?", (account_id,)).fetchone()
    return _account(row) if row else None


def list_accounts(db: sqlite3.Connection) -> list[Account]:
    return [_account(row) for row in db.execute("SELECT * FROM accounts ORDER BY id")]


def _name_taken(db: sqlite3.Connection, name: str) -> bool:
    return db.execute("SELECT 1 FROM accounts WHERE display_name=?", (name,)).fetchone() is not None


def _display_name(db: sqlite3.Connection, cleaned: str, email: str) -> str:
    if not _name_taken(db, cleaned):
        return cleaned
    stripped = email.strip()
    local = stripped.rpartition("@")[0] if "@" in stripped else stripped
    bracketed = f"{cleaned} ({_clean(local) or _clean(stripped)})"
    if _name_taken(db, bracketed):
        raise Conflict(f"the display name {cleaned!r} is taken and so is {bracketed!r}")
    return bracketed


def register_reader(  # noqa: PLR0913 - the interface is fixed: one keyword per account field
    db: sqlite3.Connection,
    *,
    tenant_id: str,
    object_id: str,
    name: str,
    email: str,
    given_name: str | None,
    family_name: str | None,
    now: datetime,
) -> Account:
    """Get or create the reader account for an identity, in one write transaction."""
    created = utc_text(now)
    for label, value in (("tenant id", tenant_id), ("object id", object_id), ("email", email)):
        if not value.strip():
            raise StoreError(f"the account has no {label}")
    if any(unicodedata.category(ch) in _UNPRINTABLE for ch in email):
        raise StoreError("the account's email holds characters that cannot be printed")
    with write_transaction(db):
        existing = account_by_identity(db, tenant_id, object_id)
        if existing is not None:
            return existing
        cleaned = _clean(name)
        if not cleaned:
            raise StoreError("the account has no name")
        display = _display_name(db, cleaned, email)
        cursor = db.execute(
            "INSERT INTO accounts(tenant_id, object_id, display_name, email, given_name,"
            " family_name, profile_type, created_at, disabled)"
            " VALUES (?, ?, ?, ?, ?, ?, 'reader', ?, 0)",
            (tenant_id, object_id, display, email, given_name, family_name, created),
        )
        if cursor.lastrowid is None:
            raise StoreError("the new account has no row id")
        account = account_by_id(db, cursor.lastrowid)
        if account is None:  # raised inside the transaction, so nothing stays committed
            raise StoreError("the new account could not be read back")
    return account


def disable_account(db: sqlite3.Connection, account_id: int) -> None:
    with write_transaction(db):
        cursor = db.execute("UPDATE accounts SET disabled=1 WHERE id=?", (account_id,))
        if cursor.rowcount == 0:
            raise Missing(f"no account {account_id}")


def enable_account(db: sqlite3.Connection, account_id: int) -> None:
    with write_transaction(db):
        cursor = db.execute("UPDATE accounts SET disabled=0 WHERE id=?", (account_id,))
        if cursor.rowcount == 0:
            raise Missing(f"no account {account_id}")


def set_profile_type(db: sqlite3.Connection, account_id: int, profile_type: str) -> None:
    if profile_type not in PROFILE_TYPES:
        raise StoreError(
            f"invalid profile type {profile_type!r}; expected one of {', '.join(PROFILE_TYPES)}"
        )
    with write_transaction(db):
        cursor = db.execute(
            "UPDATE accounts SET profile_type=? WHERE id=?", (profile_type, account_id)
        )
        if cursor.rowcount == 0:
            raise Missing(f"no account {account_id}")
