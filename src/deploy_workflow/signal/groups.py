"""Groups: a name, who can see it, its members, its topics and the thread rules.

A group's visibility is 'everyone' or 'invited' (members only). Writers and the owner create and
manage groups, their members, topics and visibility, and the thread rules; a reader manages
nothing. Seeing a group (its threads, comments and counts) follows its visibility for everyone,
writers included; a writer still lists every group in Settings, because managing a group needs it.

Thread rules are per group (spec 5.7: "per-group settings with the defaults above"): each group
has its own three switches; a new group starts at the defaults, and a group's rules go with it.
"""

from __future__ import annotations

import sqlite3
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime

from deploy_workflow.signal import identity
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import _utc_text, _write_transaction

VISIBILITIES = ("everyone", "invited")
MAX_GROUP_NAME = 60
MAX_GROUPS = 100
MAX_MEMBERS = 200
MAX_GROUP_TOPICS = 20
MAX_THREADS = 1000  # per group (threads.py refuses a new one beyond it)
_MAX_ID = 2**63 - 1


class GroupError(ValueError):
    """A request that is not valid: 400. Subclasses carry the other refusals."""

    status = 400


class Forbidden(GroupError):
    status = 403


class NotFound(GroupError):
    status = 404


class Conflict(GroupError):
    status = 409


@dataclass(frozen=True)
class Rule:
    label: str
    hint: str
    default: bool


EDIT_MINUTES = 15
QUIET_DAYS = 90
# Spec 5.7: editing for 15 minutes (marked edited), a removed comment leaves a line, and archiving
# after 90 quiet days, off by default. The ids are those of each delivered settings.groups[].rules.
RULES: dict[str, Rule] = {
    "comments-edited": Rule(
        f"Comments can be edited for {EDIT_MINUTES} minutes",
        'An edited comment is marked "edited".',
        True,
    ),
    "authors-remove": Rule(
        "Authors can remove their own comments",
        "The thread keeps a line saying a comment was removed.",
        True,
    ),
    "archive-quiet": Rule(
        f"Archive a thread after {QUIET_DAYS} days without a comment",
        "An archived thread can be read but not added to.",
        False,
    ),
}


def _now() -> datetime:
    return datetime.now(UTC)


def is_manager(user: User) -> bool:
    return user.role in ("writer", "owner")


def require_manager(user: User) -> None:
    if not is_manager(user):
        raise Forbidden("only a writer can manage groups")


def visible_group_ids(db: sqlite3.Connection, user_name: str) -> list[int]:
    """Ids of the groups `user_name` can see: visibility 'everyone', or a member. Ascending."""
    rows = db.execute(
        "SELECT g.id FROM groups g WHERE g.visibility = 'everyone'"
        " OR EXISTS(SELECT 1 FROM group_members m WHERE m.group_id = g.id AND m.user_name = ?)"
        " ORDER BY g.id",
        (user_name,),
    ).fetchall()
    return [int(row["id"]) for row in rows]


def member_group_ids(db: sqlite3.Connection, user_name: str) -> list[int]:
    """Ids of the groups `user_name` is a member of ("the user's groups", spec 5.4). Ascending."""
    rows = db.execute(
        "SELECT group_id FROM group_members WHERE user_name=? ORDER BY group_id", (user_name,)
    ).fetchall()
    return [int(row["group_id"]) for row in rows]


def can_see(db: sqlite3.Connection, user_name: str, group_id: int) -> bool:
    row = db.execute(
        "SELECT 1 FROM groups g WHERE g.id=? AND (g.visibility = 'everyone'"
        " OR EXISTS(SELECT 1 FROM group_members m WHERE m.group_id = g.id AND m.user_name = ?))",
        (group_id, user_name),
    ).fetchone()
    return row is not None


def require_group(db: sqlite3.Connection, group_id: int) -> None:
    if db.execute("SELECT 1 FROM groups WHERE id=?", (group_id,)).fetchone() is None:
        raise NotFound(f"no group with id {group_id}")


def require_visible(db: sqlite3.Connection, user_name: str, group_id: int) -> None:
    """A group the user cannot see is answered as one that does not exist."""
    if not can_see(db, user_name, group_id):
        raise NotFound(f"no group with id {group_id}")


def _group_name(raw: object) -> str:
    if not isinstance(raw, str):
        raise GroupError("a group name must be text")
    kept = "".join(" " if unicodedata.category(ch)[0] in "CZ" else ch for ch in raw)
    name = " ".join(unicodedata.normalize("NFC", kept).split())
    if not 1 <= len(name) <= MAX_GROUP_NAME:
        raise GroupError(f"a group name must be 1 to {MAX_GROUP_NAME} characters")
    return name


def _visibility(raw: object) -> str:
    if raw not in VISIBILITIES:
        raise GroupError("visibility must be 'everyone' or 'invited'")
    return str(raw)


def create_group(db: sqlite3.Connection, actor: User, name: object, visibility: object) -> int:
    """A new group with no members; the creator is not added (they add members, themselves too)."""
    require_manager(actor)
    cleaned, seen_by = _group_name(name), _visibility(visibility)
    with _write_transaction(db):
        if db.execute("SELECT COUNT(*) FROM groups").fetchone()[0] >= MAX_GROUPS:
            raise Conflict(f"Signal holds at most {MAX_GROUPS} groups")
        try:
            cur = db.execute(
                "INSERT INTO groups(name, visibility, created_by, created_at) VALUES(?, ?, ?, ?)",
                (cleaned, seen_by, actor.name, _utc_text(_now())),
            )
        except sqlite3.IntegrityError:
            raise Conflict(f"a group named {cleaned!r} already exists") from None
    assert cur.lastrowid is not None
    return cur.lastrowid


def rename_group(db: sqlite3.Connection, actor: User, group_id: int, name: object) -> None:
    require_manager(actor)
    cleaned = _group_name(name)
    with _write_transaction(db):
        require_group(db, group_id)
        try:
            db.execute("UPDATE groups SET name=? WHERE id=?", (cleaned, group_id))
        except sqlite3.IntegrityError:
            raise Conflict(f"a group named {cleaned!r} already exists") from None


def delete_group(db: sqlite3.Connection, actor: User, group_id: int) -> None:
    """Delete a group that holds no thread; one with threads is kept (its talk is not lost)."""
    require_manager(actor)
    remove_group(db, group_id, with_threads=False)


def remove_group(db: sqlite3.Connection, group_id: int, *, with_threads: bool) -> None:
    """Delete a group; `with_threads` (the owner, on the command line) deletes its threads, their
    comments, reactions and read marks with it, else a group that holds threads is refused."""
    with _write_transaction(db):
        require_group(db, group_id)
        if with_threads:
            db.execute("DELETE FROM threads WHERE group_id=?", (group_id,))
        elif db.execute("SELECT 1 FROM threads WHERE group_id=?", (group_id,)).fetchone():
            raise Conflict("a group that holds threads cannot be deleted")
        db.execute("DELETE FROM groups WHERE id=?", (group_id,))  # digest covers go with it


def set_visibility(db: sqlite3.Connection, actor: User, group_id: int, visibility: object) -> None:
    require_manager(actor)
    seen_by = _visibility(visibility)
    with _write_transaction(db):
        require_group(db, group_id)
        db.execute("UPDATE groups SET visibility=? WHERE id=?", (seen_by, group_id))


def _member_name(raw: object) -> str:
    if not isinstance(raw, str):
        raise GroupError("a member name must be text")
    try:
        return identity.clean_name(raw)  # the same name the person's own cookie would hold
    except identity.IdentityError:
        raise GroupError("a member name must not be empty") from None


def add_member(db: sqlite3.Connection, actor: User, group_id: int, name: object) -> str:
    """Add a member by display name (any name: an unknown one is a reader); returns it cleaned."""
    require_manager(actor)
    member = _member_name(name)
    with _write_transaction(db):
        require_group(db, group_id)
        held = db.execute(
            "SELECT COUNT(*) FROM group_members WHERE group_id=?", (group_id,)
        ).fetchone()[0]
        if held >= MAX_MEMBERS:
            raise Conflict(f"a group holds at most {MAX_MEMBERS} members")
        db.execute(
            "INSERT OR IGNORE INTO group_members(group_id, user_name) VALUES(?, ?)",
            (group_id, member),
        )
    return member


def remove_member(db: sqlite3.Connection, actor: User, group_id: int, name: object) -> None:
    require_manager(actor)
    member = _member_name(name)
    with _write_transaction(db):
        require_group(db, group_id)
        db.execute("DELETE FROM group_members WHERE group_id=? AND user_name=?", (group_id, member))


def as_id(value: object, what: str) -> int:
    """An id given as a number or as the snapshot's decimal text."""
    if isinstance(value, str) and value.isascii() and value.isdecimal() and len(value) <= 18:
        value = int(value)
    if isinstance(value, bool) or not isinstance(value, int) or not 0 < value <= _MAX_ID:
        raise GroupError(f"{what} must be an id")
    return value


def _topic_ids(raw: object) -> list[int]:
    if not isinstance(raw, list):
        raise GroupError("topics must be a list of topic ids")
    ids = sorted({as_id(n, "a topic") for n in raw})
    if len(ids) > MAX_GROUP_TOPICS:
        raise GroupError(f"a group follows at most {MAX_GROUP_TOPICS} topics")
    return ids


def set_topics(db: sqlite3.Connection, actor: User, group_id: int, topic_ids: object) -> list[int]:
    """Replace the group's topics; from now on each new story of one posts into the group."""
    require_manager(actor)
    ids = _topic_ids(topic_ids)
    with _write_transaction(db):
        require_group(db, group_id)
        for topic_id in ids:
            if db.execute("SELECT 1 FROM topics WHERE id=?", (topic_id,)).fetchone() is None:
                raise NotFound(f"no topic with id {topic_id}")
        db.execute("DELETE FROM group_topics WHERE group_id=?", (group_id,))
        db.executemany(
            "INSERT INTO group_topics(group_id, topic_id) VALUES(?, ?)",
            [(group_id, topic_id) for topic_id in ids],
        )
    return ids


def group_topic_ids(db: sqlite3.Connection, group_id: int) -> list[int]:
    rows = db.execute(
        "SELECT topic_id FROM group_topics WHERE group_id=? ORDER BY topic_id", (group_id,)
    ).fetchall()
    return [int(row["topic_id"]) for row in rows]


def rule_on(db: sqlite3.Connection, group_id: int, rule: str) -> bool:
    """The group's rule: its own setting, else the rule's default."""
    row = db.execute(
        "SELECT is_on FROM thread_rules WHERE group_id=? AND rule=?", (group_id, rule)
    ).fetchone()
    return RULES[rule].default if row is None else bool(row["is_on"])


def set_rule(db: sqlite3.Connection, actor: User, group_id: int, rule: object, on: object) -> None:
    """Set one of a group's thread rules; the other groups keep theirs."""
    require_manager(actor)
    if not isinstance(rule, str) or rule not in RULES:
        raise NotFound(f"no thread rule {rule!r}")
    if not isinstance(on, bool):
        raise GroupError("on must be true or false")
    with _write_transaction(db):
        require_group(db, group_id)
        db.execute(
            "INSERT INTO thread_rules(group_id, rule, is_on) VALUES(?, ?, ?)"
            " ON CONFLICT(group_id, rule) DO UPDATE SET is_on=excluded.is_on",
            (group_id, rule, int(on)),
        )


def members(db: sqlite3.Connection, group_id: int) -> list[str]:
    """Member names in the order they were added."""
    rows = db.execute(
        "SELECT user_name FROM group_members WHERE group_id=? ORDER BY rowid", (group_id,)
    ).fetchall()
    return [str(row["user_name"]) for row in rows]
