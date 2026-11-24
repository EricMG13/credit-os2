"""The group parts of the snapshot: groups, threads, the group channels, the story fields that
point at threads, and the Settings sections for groups, thread rules and notifications.

Only groups the viewer can see are delivered (Settings also lists every group to a writer, who
manages them, with names and members only); nothing about another group reaches a count, a story
field or a thread reference. A viewer with no display name gets no groups.

Bounds, so the snapshot stays small: per group the THREADS_SHOWN threads with the latest activity;
per thread the COMMENTS_SHOWN latest top-level comments, each with its REPLIES_SHOWN latest
replies. Counts (the comment count, the unread badge) are over everything, not the shown part.

Unread: a thread is unread for a viewer while someone else's activity (the thread itself, or a
comment that is not removed) is newer than the viewer's read mark; an archived thread is never
unread. The channel badge counts the unread threads that a switched-on "In Signal" event covers:
a new thread in a group the viewer is a member of ("threads"), and an unread reply to one of the
viewer's comments ("replies"). Other new comments mark the thread unread but raise no badge.

Every read here runs inside the caller's read transaction.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from deploy_workflow.signal import groups, notif, threadrank, threads
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import _utc_text
from deploy_workflow.signal.texts import ago, capital, clock, day, initials, monogram, plural

Json = dict[str, Any]

THREADS_SHOWN = 30
COMMENTS_SHOWN = 100
REPLIES_SHOWN = 20
MEMBERS_SHOWN = 4
_CHUNK = 500
_PAGE_VISIBILITY = {"everyone": "Open to everyone", "invited": "Invited only"}
SETTINGS_VISIBILITY = {"everyone": "Visible to everyone", "invited": "Members only"}


@dataclass
class Parts:
    groups: list[Json] = field(default_factory=list)
    threads: list[Json] = field(default_factory=list)
    channels: list[Json] = field(default_factory=list)
    settings_groups: list[Json] = field(default_factory=list)
    on_story: dict[int, Json] = field(default_factory=dict)  # sharedBy, commentCount, threadRef


@dataclass(frozen=True)
class _Viewer:
    user: User
    now: datetime
    members_of: frozenset[int]
    switches: dict[str, tuple[bool, bool]]


@dataclass
class _Shown:
    """A delivered thread, for the story fields."""

    group_id: int
    group_name: str
    row: sqlite3.Row
    comments: int


def build(db: sqlite3.Connection, user: User | None, now: datetime) -> Parts:
    if user is None:
        return Parts()
    viewer = _Viewer(
        user,
        now,
        frozenset(groups.member_group_ids(db, user.name)),
        notif.switches(db, user.name),
    )
    parts = Parts()
    shown: list[_Shown] = []
    for group in _ordered(db, groups.visible_group_ids(db, user.name)):
        _add_group(db, group, viewer, parts, shown)
    managed = (
        _all_group_ids(db) if groups.is_manager(user) else groups.visible_group_ids(db, user.name)
    )
    parts.settings_groups = [_settings_group(db, row) for row in _ordered(db, managed)]
    parts.on_story = _story_fields(shown, viewer)
    return parts


def story_ids(parts: Parts) -> list[int]:
    """Every story a delivered thread names."""
    return sorted({int(t["storyId"]) for t in parts.threads if t["storyId"] is not None})


def _all_group_ids(db: sqlite3.Connection) -> list[int]:
    return [int(row["id"]) for row in db.execute("SELECT id FROM groups").fetchall()]


def _ordered(db: sqlite3.Connection, ids: Sequence[int]) -> list[sqlite3.Row]:
    """The groups by name (A to Z, case folded), then id."""
    wanted = set(ids)
    rows = [row for row in db.execute("SELECT * FROM groups").fetchall() if row["id"] in wanted]
    return sorted(rows, key=lambda row: (row["name"].casefold(), row["id"]))


def _members(db: sqlite3.Connection, group_id: int) -> Json:
    names = groups.members(db, group_id)
    shown = names[:MEMBERS_SHOWN]
    summary = "No members yet" if not names else plural(len(names), "member", "members")
    return {
        "members": [{"initials": initials(name), "name": name} for name in shown],
        "moreMembers": f"+{len(names) - len(shown)}" if len(names) > len(shown) else None,
        "memberSummary": summary,
    }


def _settings_group(db: sqlite3.Connection, row: sqlite3.Row) -> Json:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        **_members(db, row["id"]),  # members, moreMembers, memberSummary: as the group page
        "visibility": SETTINGS_VISIBILITY[row["visibility"]],
        "visibilityOptions": list(SETTINGS_VISIBILITY.values()),
    }


def _add_group(
    db: sqlite3.Connection, group: sqlite3.Row, viewer: _Viewer, parts: Parts, shown: list[_Shown]
) -> None:
    gid, name = int(group["id"]), str(group["name"])
    held = _members(db, gid)
    archive_before = _archive_before(db, gid, viewer.now)
    rows = db.execute(
        "SELECT * FROM threads WHERE group_id=? ORDER BY last_activity_at DESC, id DESC LIMIT ?",
        (gid, THREADS_SHOWN),
    ).fetchall()
    summaries = []
    for row in rows:
        count = _comment_count(db, row["id"])
        summaries.append(_summary(db, row, viewer, count))
        parts.threads.append(_thread(db, (row, name, count), viewer))
        shown.append(_Shown(gid, name, row, count))
    parts.groups.append(
        {
            "id": str(gid),
            "name": name,
            "visibility": _PAGE_VISIBILITY[group["visibility"]],
            **{key: held[key] for key in ("memberSummary", "members", "moreMembers")},
            "threads": summaries,
        }
    )
    badge = _badge(db, gid, viewer, archive_before)
    parts.channels.append({"id": str(gid), "name": name, "unread": str(badge) if badge else None})


def _archive_before(db: sqlite3.Connection, group_id: int, now: datetime) -> str | None:
    """Threads whose last activity is at or before this stamp are archived; None: none is."""
    if not groups.rule_on(db, group_id, "archive-quiet"):
        return None
    return _utc_text(now - threads.QUIET)


# The unread tests of one thread `t` for viewer :u, read mark `r` (LEFT JOINed).
_OTHERS_NEWER = (
    "EXISTS(SELECT 1 FROM comments c WHERE c.thread_id = t.id AND c.author != :u"
    " AND c.removed_at IS NULL AND (r.read_at IS NULL OR c.created_at > r.read_at))"
)
_NEW_TO_ME = "(r.read_at IS NULL AND (t.created_by IS NULL OR t.created_by != :u))"
_REPLY_TO_ME = (
    "EXISTS(SELECT 1 FROM comments c JOIN comments p ON p.id = c.parent_id"
    " WHERE c.thread_id = t.id AND p.author = :u AND c.author != :u AND c.removed_at IS NULL"
    " AND (r.read_at IS NULL OR c.created_at > r.read_at))"
)
_OPEN = "(:cut IS NULL OR t.last_activity_at > :cut)"


def _badge(db: sqlite3.Connection, group_id: int, viewer: _Viewer, cut: str | None) -> int:
    threads_on = viewer.switches["threads"][0] and group_id in viewer.members_of
    replies_on = viewer.switches["replies"][0]
    row = db.execute(
        "SELECT COUNT(*) FROM threads t LEFT JOIN read_marks r"
        " ON r.thread_id = t.id AND r.user_name = :u"
        f" WHERE t.group_id = :g AND {_OPEN}"
        f" AND ((:threads AND {_NEW_TO_ME}) OR (:replies AND {_REPLY_TO_ME}))",
        {
            "u": viewer.user.name,
            "g": group_id,
            "cut": cut,
            "threads": int(threads_on),
            "replies": int(replies_on),
        },
    ).fetchone()
    return int(row[0])


def _unread(db: sqlite3.Connection, thread_id: int, user_name: str) -> bool:
    row = db.execute(
        "SELECT 1 FROM threads t LEFT JOIN read_marks r ON r.thread_id = t.id AND r.user_name = :u"
        f" WHERE t.id = :t AND ({_NEW_TO_ME} OR {_OTHERS_NEWER})",
        {"u": user_name, "t": thread_id},
    ).fetchone()
    return row is not None


def _comment_count(db: sqlite3.Connection, thread_id: int) -> int:
    """Every comment line of the thread, replies and removed lines included."""
    return int(
        db.execute("SELECT COUNT(*) FROM comments WHERE thread_id=?", (thread_id,)).fetchone()[0]
    )


def _comments_text(count: int) -> str | None:
    return plural(count, "comment", "comments") if count else None


def _who(name: str, viewer: _Viewer) -> str:
    return "you" if name == viewer.user.name else name


def _topic_name(db: sqlite3.Connection, topic_id: int) -> str:
    row = db.execute("SELECT name FROM topics WHERE id=?", (topic_id,)).fetchone()
    return str(row["name"]) if row else "a topic"


def _shared_by(db: sqlite3.Connection, row: sqlite3.Row, viewer: _Viewer) -> Json:
    when = ago(datetime.fromisoformat(row["created_at"]), viewer.now)
    if row["created_by"] is None:
        if row["topic_id"] is None:  # the topic that posted it was deleted
            return {"initials": "T", "label": f"Posted from a topic, {when}"}
        topic = _topic_name(db, row["topic_id"])
        return {
            "initials": monogram(topic),
            "label": f"Posted from the topic {topic}, {when}",
        }
    by = row["created_by"]
    if row["story_id"] is None:
        label = "You started a thread" if by == viewer.user.name else f"{by} started a thread"
    else:
        label = f"Shared by {_who(by, viewer)}, {when}"
    return {"initials": initials(by), "label": label}


def _archived(db: sqlite3.Connection, row: sqlite3.Row, now: datetime) -> datetime | None:
    return threads.archived_at(db, row, now)


def _summary(db: sqlite3.Connection, row: sqlite3.Row, viewer: _Viewer, count: int) -> Json:
    archived = _archived(db, row, viewer.now) is not None
    last = datetime.fromisoformat(row["last_activity_at"])
    return {
        "id": str(row["id"]),
        "storyId": None if row["story_id"] is None else str(row["story_id"]),
        "note": row["note"],
        "sharedBy": _shared_by(db, row, viewer),
        "commentCount": _comments_text(count),
        "archived": archived,
        "unread": not archived and _unread(db, row["id"], viewer.user.name),
        "lastActivity": capital(ago(last, viewer.now)),
    }


def _thread(db: sqlite3.Connection, held: tuple[sqlite3.Row, str, int], viewer: _Viewer) -> Json:
    row, group_name, count = held
    since = _archived(db, row, viewer.now)
    tops = _top_comments(db, row["id"])
    subline = f"{group_name}, {_comments_text(count) or 'no comments yet'}"
    if count > len(tops) + sum(len(t["replies"]) for t in tops):
        subline += ", the latest shown"
    return {
        "id": str(row["id"]),
        "groupId": str(row["group_id"]),
        "storyId": None if row["story_id"] is None else str(row["story_id"]),
        "note": row["note"],
        "archived": since is not None,
        "title": "Thread",
        "subline": subline,
        "archivedLine": None if since is None else f"Archived on {day(since, viewer.now)}",
        "comments": _comment_records(db, tops, viewer),
    }


def _top_comments(db: sqlite3.Connection, thread_id: int) -> list[Json]:
    """The latest COMMENTS_SHOWN top-level comments, oldest first, each with its latest replies."""
    tops = db.execute(
        "SELECT * FROM comments WHERE thread_id=? AND parent_id IS NULL"
        " ORDER BY created_at DESC, id DESC LIMIT ?",
        (thread_id, COMMENTS_SHOWN),
    ).fetchall()
    held = []
    for top in reversed(tops):
        replies = db.execute(
            "SELECT * FROM comments WHERE parent_id=? ORDER BY created_at DESC, id DESC LIMIT ?",
            (top["id"], REPLIES_SHOWN),
        ).fetchall()
        held.append({"row": top, "replies": list(reversed(replies))})
    return held


def _reactions(db: sqlite3.Connection, ids: list[int], user_name: str) -> dict[int, list[Json]]:
    found: dict[int, list[Json]] = {n: [] for n in ids}
    for start in range(0, len(ids), _CHUNK):
        part = ids[start : start + _CHUNK]
        rows = db.execute(
            "SELECT comment_id, word, COUNT(*) AS n, MAX(user_name = ?) AS mine FROM reactions"
            " WHERE comment_id IN (" + ", ".join("?" * len(part)) + ") GROUP BY comment_id, word",
            [user_name, *part],
        ).fetchall()
        for row in sorted(rows, key=lambda r: threads.WORDS.index(r["word"])):
            found[int(row["comment_id"])].append(
                {"word": row["word"], "count": str(row["n"]), "mine": bool(row["mine"])}
            )
    return found


def _comment_records(db: sqlite3.Connection, tops: list[Json], viewer: _Viewer) -> list[Json]:
    ids = [int(t["row"]["id"]) for t in tops] + [int(r["id"]) for t in tops for r in t["replies"]]
    held = _reactions(db, ids, viewer.user.name)

    def one(row: sqlite3.Row, replies: list[Json]) -> Json:
        removed = row["removed_at"] is not None
        return {
            "id": str(row["id"]),
            "author": {"initials": initials(row["author"]), "name": row["author"]},
            "own": row["author"] == viewer.user.name,
            "time": clock(datetime.fromisoformat(row["created_at"]), viewer.now),
            "text": None if removed else row["body"],
            "edited": not removed and row["edited_at"] is not None,
            "removed": removed,
            "reactions": [] if removed else held[int(row["id"])],
            "replies": replies,
        }

    return [one(t["row"], [one(r, []) for r in t["replies"]]) for t in tops]


def _colleague(held: list[_Shown], viewer: _Viewer) -> Json | None:
    """The latest share by a person (not a topic) among a story's delivered threads."""
    people = [s for s in held if s.row["created_by"] is not None]
    latest = max(people, key=lambda s: (s.row["created_at"], s.row["id"]), default=None)
    if latest is None:
        return None
    sharer = str(latest.row["created_by"])
    return {
        "initials": initials(sharer),
        "label": f"Shared to {latest.group_name} by {_who(sharer, viewer)}",
    }


def _story_fields(shown: list[_Shown], viewer: _Viewer) -> dict[int, Json]:
    """Per story a delivered thread names: the thread its Comment opens (a group the viewer is a
    member of first, then the latest activity), that thread's comment count, and the latest
    colleague's share."""
    by_story: dict[int, list[_Shown]] = {}
    for one in shown:
        if one.row["story_id"] is not None:
            by_story.setdefault(int(one.row["story_id"]), []).append(one)
    fields = {}
    for story_id, held in by_story.items():
        ref = max(
            held,
            key=lambda s: (s.group_id in viewer.members_of, s.row["last_activity_at"], s.row["id"]),
        )
        fields[story_id] = {
            "sharedBy": _colleague(held, viewer),
            "commentCount": str(ref.comments) if ref.comments else None,
            "threadRef": {"groupId": str(ref.group_id), "threadId": str(ref.row["id"])},
        }
    return fields


def engagement(
    db: sqlite3.Connection, user_name: str, ids: Sequence[int]
) -> dict[int, tuple[int, int]]:
    """Per story: its threads in the user's groups and their comments (removed ones left out)."""
    found: dict[int, tuple[int, int]] = {}
    unique = sorted(set(ids))
    for start in range(0, len(unique), _CHUNK):
        part = unique[start : start + _CHUNK]
        rows = db.execute(
            "SELECT t.story_id, COUNT(DISTINCT t.id) AS shares, COUNT(c.id) AS comments"
            " FROM threads t JOIN group_members m ON m.group_id = t.group_id AND m.user_name = ?"
            " LEFT JOIN comments c ON c.thread_id = t.id AND c.removed_at IS NULL"
            " WHERE t.story_id IN (" + ", ".join("?" * len(part)) + ") GROUP BY t.story_id",
            [user_name, *part],
        ).fetchall()
        found.update((int(r["story_id"]), (int(r["shares"]), int(r["comments"]))) for r in rows)
    return found


def rules(db: sqlite3.Connection) -> list[Json]:
    """The thread rules as they apply to every group."""
    return [
        {"id": key, "label": rule.label, "hint": rule.hint, "on": groups.rule_on(db, None, key)}
        for key, rule in groups.RULES.items()
    ]


def notifications(db: sqlite3.Connection, user: User | None) -> Json:
    """The viewer's switches; none for a viewer with no display name (they cannot set any)."""
    if user is None:
        return {"events": []}
    held = notif.switches(db, user.name)
    return {
        "events": [
            {"id": key, "label": event.label, "inSignal": held[key][0], "onDesktop": held[key][1]}
            for key, event in notif.EVENTS.items()
        ]
    }


def ranker(
    db: sqlite3.Connection, user_name: str, published: dict[int, str], now: datetime
) -> Callable[[list[int]], list[int]]:
    """The Top order of a list of story ids (their published times given), for this viewer."""
    held = engagement(db, user_name, list(published))

    def rank(ids: list[int]) -> list[int]:
        standings = [
            threadrank.Standing(n, datetime.fromisoformat(published[n]), *held.get(n, (0, 0)))
            for n in ids
        ]
        return threadrank.top_order(standings, now)

    return rank
