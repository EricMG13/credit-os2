"""The group parts of the snapshot: groups, threads, the group channels, the story fields that
point at threads, and the Settings sections for groups, thread rules and notifications.

Only groups the viewer can see are delivered (Settings also lists every group to a writer, who
manages them, with names and members only); nothing about another group reaches a count, a story
field or a thread reference. A viewer with no display name gets no groups.

Size. The browser reaches the service through a forwarder that refuses a reply over 4 MiB, so what
the group part delivers is bounded in bytes (each record counted as its UTF-8 JSON encoding, the
text in it included), whatever the writers posted:

* Every visible group's page record, channel and Settings row are always delivered; their bytes
  are spent first from GROUP_BUDGET.
* Candidates are each group's THREADS_SHOWN threads with the latest activity, taken across all
  groups newest activity first. While GROUP_BUDGET lasts, a thread is delivered with its comments
  (its COMMENTS_SHOWN latest top-level comments, each with its REPLIES_SHOWN latest replies). From
  the first thread that does not fit on, threads are delivered as their summary: the group's item
  and a thread with no comments, whose subline says the comments are shown when the thread is
  opened. Summaries are paid from what is left of GROUP_BUDGET, then from SUMMARY_BUDGET; once
  neither holds the next one, no further thread is delivered.
* The story card a delivered thread names (`story_cost`, given by the snapshot) is paid with it.
* The focused thread (``GET /api/snapshot?thread=<id>``, one the viewer can see) is always
  delivered, with its newest comments within FOCUS_BUDGET (the bounds above still apply).
* Counts (comment counts) are over everything stored; the unread badge counts delivered threads
  only, so opening every thread the viewer is shown clears it.

Unread: a thread is unread for a viewer while someone else's activity (the thread itself, or a
comment that is not removed) is newer than the viewer's read mark; an archived thread is never
unread. The channel badge counts the unread threads that a switched-on "In Signal" event covers:
a new thread in a group the viewer is a member of ("threads"), and an unread reply to one of the
viewer's comments ("replies"). Other new comments mark the thread unread but raise no badge.

Every read here runs inside the caller's read transaction.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable, Mapping, Sequence
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
GROUP_BUDGET = 1 << 20  # bytes
SUMMARY_BUDGET = 128 << 10
FOCUS_BUDGET = 256 << 10
_CHUNK = 500
_PAGE_VISIBILITY = {"everyone": "Open to everyone", "invited": "Invited only"}
SETTINGS_VISIBILITY = {"everyone": "Visible to everyone", "invited": "Members only"}
_LATEST = ", the latest shown"
_ON_OPENING = ", shown when the thread is opened"


def encoded_size(value: object) -> int:
    """The bytes `value` takes in the reply (UTF-8 JSON, as the service writes it)."""
    return len(json.dumps(value, ensure_ascii=False).encode("utf-8"))


def _free(story_id: int) -> int:
    return 0


@dataclass
class Parts:
    groups: list[Json] = field(default_factory=list)
    threads: list[Json] = field(default_factory=list)
    channels: list[Json] = field(default_factory=list)
    settings_groups: list[Json] = field(default_factory=list)
    on_story: dict[int, Json] = field(default_factory=dict)  # sharedBy, commentCount, threadRef
    spent: int = 0  # bytes delivered, story cards of the delivered threads included


@dataclass
class _Budget:
    left: int

    def take(self, cost: int) -> bool:
        if cost > self.left:
            return False
        self.left -= cost
        return True


@dataclass(frozen=True)
class _Viewer:
    user: User
    now: datetime
    members_of: frozenset[int]
    switches: dict[str, tuple[bool, bool]]


@dataclass
class _Shown:
    """A delivered thread: its group, row and comment count, its item and its thread record."""

    group_id: int
    group_name: str
    row: sqlite3.Row
    comments: int
    item: Json = field(default_factory=dict)
    thread: Json = field(default_factory=dict)


@dataclass
class _Picking:
    """The state of choosing what to deliver: the budgets and the story cards already paid."""

    story_cost: Callable[[int], int]
    main: _Budget = field(default_factory=lambda: _Budget(GROUP_BUDGET))
    spare: _Budget = field(default_factory=lambda: _Budget(SUMMARY_BUDGET))
    paid: set[int] = field(default_factory=set)
    spent: int = 0
    full: bool = True  # threads are still delivered with their comments

    def story(self, row: sqlite3.Row) -> int:
        story = row["story_id"]
        return 0 if story is None or story in self.paid else self.story_cost(int(story))

    def paid_for(self, shown: _Shown, cost: int) -> None:
        if shown.row["story_id"] is not None:
            self.paid.add(int(shown.row["story_id"]))
        self.spent += cost


def build(
    db: sqlite3.Connection,
    user: User | None,
    now: datetime,
    *,
    focus: int | None = None,
    story_cost: Callable[[int], int] = _free,
) -> Parts:
    """The group parts for `user` as of `now`; `focus` names a thread to deliver whole (ignored
    when the viewer cannot see it); `story_cost` gives the bytes of a story's card."""
    if user is None:
        return Parts()
    viewer = _Viewer(
        user,
        now,
        frozenset(groups.member_group_ids(db, user.name)),
        notif.switches(db, user.name),
    )
    parts = Parts()
    managed = (
        _all_group_ids(db) if groups.is_manager(user) else groups.visible_group_ids(db, user.name)
    )
    parts.settings_groups = [_settings_group(db, row) for row in _ordered(db, managed)]
    seen = _ordered(db, groups.visible_group_ids(db, user.name))
    pages = [_page(db, group) for group in seen]
    picking = _Picking(story_cost)
    fixed = encoded_size(parts.settings_groups) + sum(_page_cost(page) for page in pages)
    picking.main.left = max(GROUP_BUDGET - fixed, 0)
    shown = _pick(db, seen, viewer, picking, focus)
    for group, page in zip(seen, pages, strict=True):
        _add_group(db, (group, page), viewer, parts, shown)
    parts.on_story = _story_fields(shown, viewer)
    parts.spent = fixed + picking.spent
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
        # The topics whose new stories post into the group, as settings.topics names them (by id).
        "topics": [str(n) for n in groups.group_topic_ids(db, row["id"])],
        "rules": rules(db, row["id"]),
    }


def _page(db: sqlite3.Connection, group: sqlite3.Row) -> Json:
    """The group's page record; its `threads` are filled in once they are chosen."""
    held = _members(db, group["id"])
    return {
        "id": str(group["id"]),
        "name": str(group["name"]),
        "visibility": _PAGE_VISIBILITY[group["visibility"]],
        **{key: held[key] for key in ("memberSummary", "members", "moreMembers")},
        "threads": [],
    }


def _page_cost(page: Json) -> int:
    """The page record and its channel (with the longest badge a group can carry)."""
    channel = {"id": page["id"], "name": page["name"], "unread": str(THREADS_SHOWN + 1)}
    return encoded_size(page) + encoded_size(channel)


def _candidates(db: sqlite3.Connection, seen: list[sqlite3.Row]) -> list[tuple[str, sqlite3.Row]]:
    """Each group's THREADS_SHOWN threads with the latest activity, newest activity first."""
    found = []
    for group in seen:
        rows = db.execute(
            "SELECT * FROM threads WHERE group_id=? ORDER BY last_activity_at DESC, id DESC"
            " LIMIT ?",
            (group["id"], THREADS_SHOWN),
        ).fetchall()
        found += [(str(group["name"]), row) for row in rows]
    return sorted(found, key=lambda one: (one[1]["last_activity_at"], one[1]["id"]), reverse=True)


def _focused(
    db: sqlite3.Connection, seen: list[sqlite3.Row], focus: int | None
) -> tuple[str, sqlite3.Row] | None:
    """The focused thread with its group's name, if it is in a group the viewer sees."""
    if focus is None:
        return None
    row = db.execute("SELECT * FROM threads WHERE id=?", (focus,)).fetchone()
    names = {int(group["id"]): str(group["name"]) for group in seen}
    if row is None or int(row["group_id"]) not in names:
        return None
    return names[int(row["group_id"])], row


def _pick(
    db: sqlite3.Connection,
    seen: list[sqlite3.Row],
    viewer: _Viewer,
    picking: _Picking,
    focus: int | None,
) -> list[_Shown]:
    """The delivered threads, each with its item and thread record (see the module docstring)."""
    shown = []
    focused = _focused(db, seen, focus)
    if focused is not None:
        one = _held(db, focused, viewer)
        one.thread, _ = _thread(db, one, viewer, FOCUS_BUDGET)
        picking.paid_for(
            one, encoded_size(one.item) + encoded_size(one.thread) + picking.story(one.row)
        )
        shown.append(one)
    for candidate in _candidates(db, seen):
        if focused is not None and candidate[1]["id"] == focused[1]["id"]:
            continue
        one = _held(db, candidate, viewer)
        if not _deliver(db, one, viewer, picking):
            break
        shown.append(one)
    return shown


def _deliver(db: sqlite3.Connection, one: _Shown, viewer: _Viewer, picking: _Picking) -> bool:
    """Fill in the thread record within the budgets: with its comments while they last, else as
    its summary; False when not even the summary is paid for."""
    fixed = encoded_size(one.item) + picking.story(one.row)
    if picking.full:
        one.thread, whole = _thread(db, one, viewer, picking.main.left - fixed)
        cost = fixed + encoded_size(one.thread)
        if whole and picking.main.take(cost):
            picking.paid_for(one, cost)
            return True
        picking.full = False
    one.thread = _summary_thread(one, viewer)
    cost = fixed + encoded_size(one.thread)
    if picking.main.take(cost) or picking.spare.take(cost):
        picking.paid_for(one, cost)
        return True
    return False


def _held(db: sqlite3.Connection, candidate: tuple[str, sqlite3.Row], viewer: _Viewer) -> _Shown:
    name, row = candidate
    count = _comment_count(db, row["id"])
    one = _Shown(int(row["group_id"]), name, row, count)
    one.item = _summary(db, row, viewer, count)
    return one


def _add_group(
    db: sqlite3.Connection,
    held: tuple[sqlite3.Row, Json],
    viewer: _Viewer,
    parts: Parts,
    shown: list[_Shown],
) -> None:
    group, page = held
    gid = int(group["id"])
    mine = sorted(
        (one for one in shown if one.group_id == gid),
        key=lambda one: (one.row["last_activity_at"], one.row["id"]),
        reverse=True,
    )
    page["threads"] = [one.item for one in mine]
    parts.threads += [one.thread for one in mine]
    parts.groups.append(page)
    cut = _archive_before(db, gid, viewer.now)
    badge = _badge(db, (gid, [int(one.row["id"]) for one in mine]), viewer, cut)
    parts.channels.append(
        {"id": page["id"], "name": page["name"], "unread": str(badge) if badge else None}
    )


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


def _badge(
    db: sqlite3.Connection, delivered: tuple[int, list[int]], viewer: _Viewer, cut: str | None
) -> int:
    """How many of the group's delivered threads raise its badge."""
    group_id, ids = delivered
    if not ids:
        return 0
    threads_on = viewer.switches["threads"][0] and group_id in viewer.members_of
    replies_on = viewer.switches["replies"][0]
    marks = ", ".join(f":t{n}" for n in range(len(ids)))
    row = db.execute(
        "SELECT COUNT(*) FROM threads t LEFT JOIN read_marks r"
        " ON r.thread_id = t.id AND r.user_name = :u"
        f" WHERE t.group_id = :g AND t.id IN ({marks}) AND {_OPEN}"
        f" AND ((:threads AND {_NEW_TO_ME}) OR (:replies AND {_REPLY_TO_ME}))",
        {
            "u": viewer.user.name,
            "g": group_id,
            "cut": cut,
            "threads": int(threads_on),
            "replies": int(replies_on),
            **{f"t{n}": thread_id for n, thread_id in enumerate(ids)},
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


def _topic_name(db: sqlite3.Connection, topic_id: int | None) -> str | None:
    if topic_id is None:
        return None
    row = db.execute("SELECT name FROM topics WHERE id=?", (topic_id,)).fetchone()
    return str(row["name"]) if row else None


def _shared_by(db: sqlite3.Connection, row: sqlite3.Row, viewer: _Viewer) -> Json:
    when = ago(datetime.fromisoformat(row["created_at"]), viewer.now)
    if row["created_by"] is None:
        topic = _topic_name(db, row["topic_id"])
        if topic is None:  # the topic was deleted since
            return {"initials": "?", "label": f"Posted from a topic, {when}"}
        return {"initials": monogram(topic), "label": f"Posted from the topic {topic}, {when}"}
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


def _thread_record(one: _Shown, viewer: _Viewer, comments: list[Json], subline: str) -> Json:
    row = one.row
    since = None
    if one.item["archived"]:
        since = datetime.fromisoformat(row["last_activity_at"]) + threads.QUIET
    return {
        "id": str(row["id"]),
        "groupId": str(row["group_id"]),
        "storyId": None if row["story_id"] is None else str(row["story_id"]),
        "note": row["note"],
        "archived": since is not None,
        "title": "Thread",
        "subline": subline,
        "archivedLine": None if since is None else f"Archived on {day(since, viewer.now)}",
        "comments": comments,
    }


def _thread(db: sqlite3.Connection, one: _Shown, viewer: _Viewer, limit: int) -> tuple[Json, bool]:
    """The thread with its newest comments within `limit` bytes; True when every comment the
    bounds admit fits."""
    tops = _top_comments(db, one.row["id"])
    state = threads.thread_state(db, one.row, viewer.now)
    comments, shown, whole = _comment_records(db, tops, viewer, limit, state)
    subline = f"{one.group_name}, {_comments_text(one.comments) or 'no comments yet'}"
    if one.comments > shown:
        subline += _LATEST
    return _thread_record(one, viewer, comments, subline), whole


def _summary_thread(one: _Shown, viewer: _Viewer) -> Json:
    """The thread without its comments, which the focused snapshot delivers."""
    count = _comments_text(one.comments)
    subline = (
        f"{one.group_name}, {count}{_ON_OPENING}" if count else f"{one.group_name}, no comments yet"
    )
    return _thread_record(one, viewer, [], subline)


def _top_comments(db: sqlite3.Connection, thread_id: int) -> list[Json]:
    """The latest COMMENTS_SHOWN top-level comments, newest first, each with its latest replies
    (newest first)."""
    tops = db.execute(
        "SELECT * FROM comments WHERE thread_id=? AND parent_id IS NULL"
        " ORDER BY created_at DESC, id DESC LIMIT ?",
        (thread_id, COMMENTS_SHOWN),
    ).fetchall()
    held = []
    for top in tops:
        replies = db.execute(
            "SELECT * FROM comments WHERE parent_id=? ORDER BY created_at DESC, id DESC LIMIT ?",
            (top["id"], REPLIES_SHOWN),
        ).fetchall()
        held.append({"row": top, "replies": replies})
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


def _comment_records(
    db: sqlite3.Connection,
    tops: list[Json],
    viewer: _Viewer,
    limit: int,
    state: threads.ThreadState,
) -> tuple[list[Json], int, bool]:
    """The records of `tops` (newest first) spent newest first within `limit` bytes, returned
    oldest first; how many comments they hold; and whether all of them fit. `canEdit` and
    `canRemove` say whether the edit and remove routes would accept the viewer's request now
    (the routes' own checks, `threads.check_edit` and `threads.check_remove`)."""
    ids = [int(t["row"]["id"]) for t in tops] + [int(r["id"]) for t in tops for r in t["replies"]]
    held = _reactions(db, ids, viewer.user.name)
    budget = _Budget(limit)

    def one(row: sqlite3.Row) -> Json:
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
            "replies": [],
            "canEdit": threads.can_edit(viewer.user, row, state, viewer.now),
            "canRemove": threads.can_remove(viewer.user, row, state),
        }

    kept: list[Json] = []
    shown = 0
    for top in tops:
        record = one(top["row"])
        if not budget.take(encoded_size(record) + 1):  # one more byte: the comma between them
            return kept[::-1], shown, False
        kept.append(record)
        shown += 1
        for reply in top["replies"]:
            answer = one(reply)
            if not budget.take(encoded_size(answer) + 1):
                return kept[::-1], shown, False
            record["replies"].insert(0, answer)
            shown += 1
    return kept[::-1], shown, True


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


def rules(db: sqlite3.Connection, group_id: int) -> list[Json]:
    """The group's thread rules, in the order Settings lists them."""
    return [
        {"id": key, "label": rule.label, "hint": rule.hint, "on": groups.rule_on(db, group_id, key)}
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


class Ranker:
    """The Top order of a list of story ids for one viewer (call it), and each story's place in
    it (`key`: its ``threadrank.score`` and published time), so other entries rank beside them."""

    def __init__(
        self,
        held: Mapping[int, tuple[int, int]],
        published: Mapping[int, str],
        strengths: Mapping[int, int],
        now: datetime,
    ) -> None:
        self.held, self.published, self.strengths, self.now = held, published, strengths, now

    def _standing(self, n: int) -> threadrank.Standing:
        at = datetime.fromisoformat(self.published[n])
        return threadrank.Standing(n, at, *self.held.get(n, (0, 0)), self.strengths.get(n))

    def __call__(self, ids: list[int]) -> list[int]:
        return threadrank.top_order([self._standing(n) for n in ids], self.now)

    def key(self, n: int) -> tuple[float, datetime]:
        standing = self._standing(n)
        return threadrank.score(standing, self.now), standing.published_at


def ranker(
    db: sqlite3.Connection,
    user_name: str,
    published: dict[int, str],
    now: datetime,
    strengths: Mapping[int, int] | None = None,
) -> Ranker:
    """The Top order of a list of story ids (their published times given), for this viewer;
    `strengths` holds the AI pass's signal strength of the stories that have one."""
    return Ranker(engagement(db, user_name, list(published)), published, strengths or {}, now)
