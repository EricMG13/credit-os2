"""The account store: `<folder>/accounts.db`, its migrations and the account functions.

Standard library only; it imports no other deploy_workflow module. Times are injected and UTC.
No passcode, hash, salt or token is ever put in a message here.
"""

from __future__ import annotations

import errno
import hashlib
import ntpath
import os
import sqlite3
import sys
import time
import unicodedata
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path, PurePath, PureWindowsPath

from deploy_workflow.accounts import analyst_names

PROFILE_TYPES = ("reader", "analyst", "admin")
_BUSY_SECONDS = 30
_OTHERS_ANY = 0o077
_REMEDY = (
    "it must belong to the account that runs the application and be open to no one else"
    " (chmod 700 for the folder, 600 for the file)"
)
_UNPRINTABLE = ("Cc", "Cf", "Cs")
_IS_WINDOWS = os.name == "nt"  # one switch, so tests can reach the Windows branch on any system
_ACL_ATTRIBUTES = ("system.posix_acl_access", "system.posix_acl_default")
MAX_DISPLAY_NAME = 60
_MAX_TAG = 40
# The placeholder slice 4 shows for comments made before accounts: never given to a person.
RESERVED_DISPLAY_NAMES = frozenset({"before accounts"})

RELATIVE_FOLDER = "the account store's folder must be an absolute path"
_JOINERS = "\u200c\u200d"  # needed to spell Persian and other scripts; kept in names


class StoreError(ValueError):
    """The store or a request to it is not usable."""


class Conflict(StoreError):
    """A display name cannot be made unique."""


class Missing(StoreError):
    """An unknown account id."""


class ActorDisabled(StoreError):
    """The acting Admin is no longer enabled."""


class NotAdmin(StoreError):
    """The acting account is no longer an Admin."""


class LastAdmin(StoreError):
    """A mutation would leave no enabled Admin."""


class InvalidAnalystName(StoreError):
    """An analyst-name override does not use the shared manual-name grammar."""


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

_MIGRATION_2 = "ALTER TABLE accounts ADD COLUMN analyst_name_override TEXT;"

# Ordered; later slices append. Index i holds the script that brings the schema to version i + 1.
MIGRATIONS = [_MIGRATION_1, _MIGRATION_2]


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
    analyst_name_override: str | None = None


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
    if not _IS_WINDOWS:
        folder.chmod(0o700)  # the umask may have cleared bits from the mkdir mode, never added


def _has_acl(target: Path) -> bool:
    """On Linux, whether `target` carries a POSIX ACL (an extended attribute)."""
    if not sys.platform.startswith("linux"):  # also lets mypy see listxattr, a Linux-only call
        return False
    try:
        names = os.listxattr(target)
    except OSError as exc:
        if exc.errno in (errno.ENOTSUP, errno.EOPNOTSUPP):
            # The filesystem has no extended attributes, so it cannot carry a POSIX ACL: this is
            # the answer "no ACL", not a hidden failure. Any other OSError propagates.
            return False
        raise
    return any(name in _ACL_ATTRIBUTES for name in names)


def _inside_local_appdata(folder: PurePath, local_appdata: str | None) -> bool:
    """Whether `folder` is `local_appdata` or inside it, by Windows rules (case-folded, `..`
    resolved); False for an unset, relative, drive-relative or UNC path on either side."""
    if not local_appdata:
        return False
    paths = (PureWindowsPath(local_appdata), PureWindowsPath(str(folder)))
    for path in paths:
        if not path.is_absolute() or path.drive.startswith("\\\\"):
            return False
    base, target = (
        [part.casefold() for part in PureWindowsPath(ntpath.normpath(str(path))).parts]
        for path in paths
    )
    return target[: len(base)] == base


def _check_windows_folder(folder: Path) -> None:
    local = os.environ.get("LOCALAPPDATA") or None
    real_local = os.path.realpath(local) if local else None
    if not _inside_local_appdata(PurePath(os.path.realpath(folder)), real_local):
        raise StoreError(
            "on Windows the account store's folder must be inside your own %LOCALAPPDATA%,"
            " which only you can open"
        )


def _check_no_acl(target: Path, label: str) -> None:
    if target.exists() and _has_acl(target):
        raise StoreError(f"{label} {target} carries an access-control list; {_REMEDY}")


def open_db(folder: Path) -> sqlite3.Connection:
    """Open (creating if needed) `<folder>/accounts.db` and apply migrations; StoreError for a
    relative folder, a store others can open or that another user owns, or one this build's
    migrations did not make. On Windows the folder must be inside the user's %LOCALAPPDATA%; on
    Linux a POSIX ACL on the folder or file is refused. macOS ACLs are not checked."""
    if not folder.is_absolute():
        raise StoreError(RELATIVE_FOLDER)
    if _IS_WINDOWS:
        _check_windows_folder(folder)
    _create_folder(folder)
    path = folder / "accounts.db"
    if not _IS_WINDOWS:
        _check_private(folder, "the account store's folder")
        if sys.platform.startswith("linux"):
            _check_no_acl(folder, "the account store's folder")
        _create_file(path)
        _check_private(path, "the account store")
        if sys.platform.startswith("linux"):
            _check_no_acl(path, "the account store")
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
        analyst_name_override=row["analyst_name_override"],
    )


def effective_analyst_name(account: Account) -> str | None:
    """Use a valid explicit override, otherwise derive only from the registered name claims."""
    override = account.analyst_name_override
    if override is not None:
        if len(override) <= analyst_names.SUBMITTER_AT_MOST and analyst_names.is_analyst_name(
            override
        ):
            return override
        return None
    return analyst_names.derive_analyst_name(account.given_name, account.family_name)


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


def account_directory(db: sqlite3.Connection) -> list[dict[str, object]]:
    """Return the browser-safe account projection and latest sign-in time without writes."""
    rows = db.execute(
        "SELECT a.id, a.display_name, a.profile_type, a.disabled, "
        "MAX(s.created_at) AS signed_in_at "
        "FROM accounts AS a LEFT JOIN sessions AS s ON s.account_id=a.id "
        "GROUP BY a.id ORDER BY a.id"
    ).fetchall()
    return [_account_summary(row) for row in rows]


def _account_summary(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": int(row["id"]),
        "display_name": str(row["display_name"]),
        "profile_type": str(row["profile_type"]),
        "disabled": bool(row["disabled"]),
        "signed_in_at": row["signed_in_at"],
    }


def account_summary(db: sqlite3.Connection, account_id: int) -> dict[str, object] | None:
    """Return one safe browser projection without changing session state."""
    row = db.execute(
        "SELECT a.id, a.display_name, a.profile_type, a.disabled, "
        "MAX(s.created_at) AS signed_in_at "
        "FROM accounts AS a LEFT JOIN sessions AS s ON s.account_id=a.id "
        "WHERE a.id=? GROUP BY a.id",
        (account_id,),
    ).fetchone()
    if row is None:
        return None
    return _account_summary(row)


def _name_taken(db: sqlite3.Connection, name: str) -> bool:
    return db.execute("SELECT 1 FROM accounts WHERE display_name=?", (name,)).fetchone() is not None


def _tag_for_name(tag: str, *, keep_end: bool) -> str:
    if len(tag) <= _MAX_TAG:
        return tag
    return "…" + tag[-(_MAX_TAG - 1) :] if keep_end else tag[: _MAX_TAG - 1] + "…"


def _fitted(cleaned: str, tag: str | None) -> str:
    if tag is None:
        return cleaned[:MAX_DISPLAY_NAME].rstrip()
    suffix = f" ({tag})"
    return cleaned[: MAX_DISPLAY_NAME - len(suffix)].rstrip() + suffix


def _display_name(db: sqlite3.Connection, cleaned: str, email: str) -> str:
    """The first free of: the name; `name (local)`; `name (whole email)`, each fitted to 60."""
    stripped = _clean(email.strip())
    local = email.strip().rpartition("@")[0] if "@" in email.strip() else email.strip()
    tags = (
        None,
        _tag_for_name(_clean(local) or stripped, keep_end=False),
        _tag_for_name(stripped, keep_end=True),
    )
    for tag in tags:
        candidate = _fitted(cleaned, tag)
        if candidate not in RESERVED_DISPLAY_NAMES and not _name_taken(db, candidate):
            return candidate
    raise Conflict(f"the display name {cleaned!r} and its two bracketed forms are taken")


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


def _require_enabled_admin(db: sqlite3.Connection, actor_id: int) -> None:
    actor = db.execute(
        "SELECT profile_type, disabled FROM accounts WHERE id=?", (actor_id,)
    ).fetchone()
    if actor is None or bool(actor["disabled"]):
        raise ActorDisabled("the acting account is not enabled")
    if actor["profile_type"] != "admin":
        raise NotAdmin("the acting account is not an Admin")


def _require_admin_remains(db: sqlite3.Connection, account_id: int, *, removes_admin: bool) -> None:
    target = db.execute(
        "SELECT profile_type, disabled FROM accounts WHERE id=?", (account_id,)
    ).fetchone()
    if target is None:
        raise Missing(f"no account {account_id}")
    loses_enabled_admin = (
        removes_admin and target["profile_type"] == "admin" and not bool(target["disabled"])
    )
    if not loses_enabled_admin:
        return
    enabled_admins = db.execute(
        "SELECT COUNT(*) FROM accounts WHERE profile_type='admin' AND disabled=0"
    ).fetchone()[0]
    if enabled_admins == 1:
        raise LastAdmin("keep at least one enabled Admin")


def disable_account_as_admin(
    db: sqlite3.Connection, actor_id: int, account_id: int
) -> dict[str, object]:
    """Disable an account after rechecking actor authority under the same write lock."""
    with write_transaction(db):
        _require_enabled_admin(db, actor_id)
        _require_admin_remains(db, account_id, removes_admin=True)
        db.execute("UPDATE accounts SET disabled=1 WHERE id=?", (account_id,))
        summary = account_summary(db, account_id)
        if summary is None:
            raise Missing(f"no account {account_id}")
        return summary


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


def set_profile_type_as_admin(
    db: sqlite3.Connection, actor_id: int, account_id: int, profile_type: str
) -> dict[str, object]:
    """Change a profile after rechecking actor authority under the same write lock."""
    if profile_type not in PROFILE_TYPES:
        raise StoreError(
            f"invalid profile type {profile_type!r}; expected one of {', '.join(PROFILE_TYPES)}"
        )
    with write_transaction(db):
        _require_enabled_admin(db, actor_id)
        _require_admin_remains(db, account_id, removes_admin=profile_type != "admin")
        db.execute("UPDATE accounts SET profile_type=? WHERE id=?", (profile_type, account_id))
        summary = account_summary(db, account_id)
        if summary is None:
            raise Missing(f"no account {account_id}")
        return summary


def _validate_analyst_name(value: object) -> str:
    if (
        not isinstance(value, str)
        or len(value) > analyst_names.SUBMITTER_AT_MOST
        or not analyst_names.is_analyst_name(value)
    ):
        raise InvalidAnalystName(analyst_names.ANALYST_NAME_RULE)
    return value


def _set_analyst_name_locked(db: sqlite3.Connection, account_id: int, analyst_name: str) -> None:
    cursor = db.execute(
        "UPDATE accounts SET analyst_name_override=? WHERE id=?", (analyst_name, account_id)
    )
    if cursor.rowcount == 0:
        raise Missing(f"no account {account_id}")


def set_analyst_name_override(db: sqlite3.Connection, account_id: int, analyst_name: str) -> None:
    """Set an operator-approved override using the shared manual-name rule."""
    value = _validate_analyst_name(analyst_name)
    with write_transaction(db):
        _set_analyst_name_locked(db, account_id, value)


def set_analyst_name_override_as_admin(
    db: sqlite3.Connection, actor_id: int, account_id: int, analyst_name: str
) -> None:
    """Set an override after checking the actor's enabled Admin role under the write lock."""
    with write_transaction(db):
        _require_enabled_admin(db, actor_id)
        value = _validate_analyst_name(analyst_name)
        _set_analyst_name_locked(db, account_id, value)
