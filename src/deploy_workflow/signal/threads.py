"""Threads in groups: sharing a story or a note, comments with one level of replies, reactions,
read marks, and the archive rule. Every write is given its time (`at`): a time, or a clock that
is read once the write lock is held, so a write's time is never earlier than a write committed
before it (a comment stamped before someone's read mark but committed after it would never be
unread). The 15-minute edit window and the 90-day archive are decided from that time.

Decisions where spec 5.7 and the screens leave a choice:

* Sharing a story with a note: the note is the sharer's first comment (the Share dialog says
  "Members see it as your first comment"), so a story thread holds no note of its own. A thread
  started from a note alone holds the note. A second share of the same story to the same group
  joins the existing thread: its note, if any, becomes the second sharer's comment there. Joining a
  thread a topic posted makes it the sharer's (``_adopt``): it is then a person's thread, shown as
  shared by them and never taken for room, so a share is never lost with a quiet topic post. Joining
  does not mark the thread read for the sharer (they shared from the feed and have not read what
  others wrote there); their own comment never counts as unread for them.
* Bounds: a thread holds at most MAX_COMMENTS comment lines (replies and removed lines included)
  and a group at most ``groups.MAX_THREADS`` threads; a person's write beyond either is refused
  (409). A thread a person starts, and a story a group topic posts, in a group at its bound take
  the place of the group's oldest topic-posted thread that has no comment; with none, the person
  is refused and the topic's story is not posted there (the group's page says the group is full).
  A thread a person has shared into, or commented on, is never taken. The owner removes old topic
  posts with ``signal groups prune``.
* "A comment can be edited for 15 minutes and is then marked edited": its author may edit it for
  15 minutes after posting it (not later), and an edited comment is marked edited. The group's
  "comments-edited" rule switches editing off altogether.
* A deleted comment keeps its place as a removed line: its text is erased and its reactions are
  dropped; its replies stay. Only its author removes it, while the "authors-remove" rule is on.
* Replies nest one level: a reply answers a top-level comment that is not removed. A reply to a
  reply is refused (the thread screen offers Reply on top-level comments only).
* A thread is archived when its group's "archive-quiet" rule is on and it had no comment for 90
  days; archiving is decided at read time from `at`, so switching the rule off reopens it. An
  archived thread is listed and read but refuses comments, edits, removals and reactions.
* Readers read and mark read; they post nothing, reactions included.
"""

from __future__ import annotations

import sqlite3
import unicodedata
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from deploy_workflow.signal import groups
from deploy_workflow.signal.groups import Conflict, Forbidden, GroupError, NotFound
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import _utc_text, _write_transaction

MAX_TEXT = 4000
MAX_COMMENTS = 500
WORDS = ("Agree", "Disagree", "Seen")
EDIT_WINDOW = timedelta(minutes=groups.EDIT_MINUTES)
QUIET = timedelta(days=groups.QUIET_DAYS)
_KEPT_CONTROLS = {"\n", "\t"}
Moment = datetime | Callable[[], datetime]  # a write's time, or the clock read under its lock


def _when(at: Moment) -> datetime:
    """The write's time: call this inside the write transaction."""
    return at() if callable(at) else at


@dataclass(frozen=True)
class Item:
    """What is shared: a story (with an optional note), or a note alone (story_id None)."""

    story_id: int | None
    note: object = None


def clean_text(raw: object, what: str) -> str:
    """Plain text, kept as written: line ends made "\\n", other control characters dropped,
    the ends trimmed. Empty or longer than MAX_TEXT characters is refused."""
    if not isinstance(raw, str):
        raise GroupError(f"{what} must be text")
    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    text = "".join(
        ch for ch in text if ch in _KEPT_CONTROLS or unicodedata.category(ch) not in ("Cc", "Cs")
    )
    text = unicodedata.normalize("NFC", text).strip()
    if not text:
        raise GroupError(f"{what} must not be empty")
    if len(text) > MAX_TEXT:
        raise GroupError(f"{what} must be at most {MAX_TEXT} characters")
    return text


def _require_writer(actor: User) -> None:
    if not groups.is_manager(actor):
        raise Forbidden("readers read threads; only a writer can post")


def thread_row(db: sqlite3.Connection, user_name: str, thread_id: int) -> sqlite3.Row:
    """The thread, if the user can see its group; else NotFound (an unseen group's thread is
    answered as one that does not exist)."""
    row: sqlite3.Row | None = db.execute(
        "SELECT * FROM threads WHERE id=?", (thread_id,)
    ).fetchone()
    if row is None or not groups.can_see(db, user_name, row["group_id"]):
        raise NotFound(f"no thread with id {thread_id}")
    return row


def archived_at(db: sqlite3.Connection, thread: sqlite3.Row, at: datetime) -> datetime | None:
    """When the thread was archived, or None while it is open."""
    if not groups.rule_on(db, thread["group_id"], "archive-quiet"):
        return None
    since = datetime.fromisoformat(thread["last_activity_at"]) + QUIET
    return since if since <= at else None


def _require_open(db: sqlite3.Connection, thread: sqlite3.Row, at: datetime) -> None:
    if archived_at(db, thread, at) is not None:
        raise Conflict("this thread is archived: it can be read but not added to")


def _mark_read(db: sqlite3.Connection, user_name: str, thread_id: int, at: datetime) -> None:
    db.execute(
        "INSERT INTO read_marks(user_name, thread_id, read_at) VALUES(?, ?, ?)"
        " ON CONFLICT(user_name, thread_id) DO UPDATE SET read_at=max(read_at, excluded.read_at)",
        (user_name, thread_id, _utc_text(at)),
    )


def _require_room(db: sqlite3.Connection, thread_id: int) -> None:
    held = db.execute("SELECT COUNT(*) FROM comments WHERE thread_id=?", (thread_id,)).fetchone()
    if held[0] >= MAX_COMMENTS:
        raise Conflict(f"this thread holds {MAX_COMMENTS} comments, the most it can hold")


def _add_comment(
    db: sqlite3.Connection, thread_id: int, actor: User, text: str, at: datetime
) -> int:
    """Insert a top-level comment and move the thread's activity (no read mark: the caller's)."""
    _require_room(db, thread_id)
    cur = db.execute(
        "INSERT INTO comments(thread_id, author, body, created_at) VALUES(?, ?, ?, ?)",
        (thread_id, actor.name, text, _utc_text(at)),
    )
    _touch(db, thread_id, at)
    assert cur.lastrowid is not None
    return cur.lastrowid


def _touch(db: sqlite3.Connection, thread_id: int, at: datetime) -> None:
    db.execute(
        "UPDATE threads SET last_activity_at=max(last_activity_at, ?) WHERE id=?",
        (_utc_text(at), thread_id),
    )


def _require_story(db: sqlite3.Connection, story_id: int) -> None:
    if db.execute("SELECT 1 FROM stories WHERE id=?", (story_id,)).fetchone() is None:
        raise NotFound(f"no story with id {story_id}")


def _new_thread(
    db: sqlite3.Connection, group_id: int, actor: User, item: Item, at: datetime
) -> int:
    """Insert a thread (`item.note` already cleaned, or None) and mark it read for its sharer."""
    if not _make_room(db, group_id):
        raise Conflict(f"this group holds {groups.MAX_THREADS:,} threads, the most it can hold")
    stamp = _utc_text(at)
    cur = db.execute(
        "INSERT INTO threads(group_id, story_id, created_at, created_by, note, last_activity_at)"
        " VALUES(?, ?, ?, ?, ?, ?)",
        (group_id, item.story_id, stamp, actor.name, item.note, stamp),
    )
    assert cur.lastrowid is not None
    _mark_read(db, actor.name, cur.lastrowid, at)
    return cur.lastrowid


def _optional_note(raw: object) -> str | None:
    """A story share's note: absent, or blank (an empty note box), is no note."""
    if raw is None or (isinstance(raw, str) and not raw.strip()):
        return None
    return clean_text(raw, "a note")


def share(
    db: sqlite3.Connection, actor: User, group_id: int, item: Item, at: Moment
) -> tuple[int, bool]:
    """Share a story (its note becomes the sharer's comment) or start a note thread.

    Returns the thread id and whether the share joined a thread the story already had there."""
    _require_writer(actor)
    if item.story_id is not None:
        return _share_story(db, actor, group_id, item, at)
    note = Item(None, clean_text(item.note, "a note"))
    with _write_transaction(db):
        groups.require_visible(db, actor.name, group_id)
        return _new_thread(db, group_id, actor, note, _when(at)), False


def _share_story(
    db: sqlite3.Connection, actor: User, group_id: int, item: Item, clock: Moment
) -> tuple[int, bool]:
    assert item.story_id is not None
    note = _optional_note(item.note)
    with _write_transaction(db):
        at = _when(clock)
        groups.require_visible(db, actor.name, group_id)
        _require_story(db, item.story_id)
        held = db.execute(
            "SELECT * FROM threads WHERE group_id=? AND story_id=?", (group_id, item.story_id)
        ).fetchone()
        if held is None:
            thread_id = _new_thread(db, group_id, actor, Item(item.story_id), at)
        else:
            thread_id = held["id"]
            if note is not None:
                _require_open(db, held, at)
            if held["created_by"] is None:
                _adopt(db, held, actor, at)
        if note is not None:
            _add_comment(db, thread_id, actor, note, at)
        return thread_id, held is not None


def _adopt(db: sqlite3.Connection, thread: sqlite3.Row, actor: User, at: datetime) -> None:
    """Record a person's share of a story a topic posted: the thread becomes the sharer's
    (``created_by``, shown as "Shared by", and no longer a topic post, so never taken for room),
    dated from the share and moved up by it unless it is archived (a share does not reopen an
    archived thread)."""
    moved = archived_at(db, thread, at) is None
    db.execute(
        "UPDATE threads SET created_by=?, topic_id=NULL, created_at=max(created_at, ?),"
        " last_activity_at=CASE WHEN ? THEN max(last_activity_at, ?) ELSE last_activity_at END"
        " WHERE id=?",
        (actor.name, _utc_text(at), moved, _utc_text(at), thread["id"]),
    )


def comment(db: sqlite3.Connection, actor: User, thread_id: int, text: object, at: Moment) -> int:
    """A top-level comment on an open thread; the thread is then read for its author."""
    _require_writer(actor)
    body = clean_text(text, "a comment")
    with _write_transaction(db):
        when = _when(at)
        thread = thread_row(db, actor.name, thread_id)
        _require_open(db, thread, when)
        made = _add_comment(db, thread_id, actor, body, when)
        _mark_read(db, actor.name, thread_id, when)
        return made


def _comment_row(db: sqlite3.Connection, user_name: str, comment_id: int) -> sqlite3.Row:
    row: sqlite3.Row | None = db.execute(
        "SELECT * FROM comments WHERE id=?", (comment_id,)
    ).fetchone()
    thread = (
        None
        if row is None
        else db.execute("SELECT group_id FROM threads WHERE id=?", (row["thread_id"],)).fetchone()
    )
    if row is None or thread is None or not groups.can_see(db, user_name, thread["group_id"]):
        raise NotFound(f"no comment with id {comment_id}")  # an unseen group's: as no comment
    return row


def _open_comment(
    db: sqlite3.Connection, user_name: str, comment_id: int, at: datetime
) -> sqlite3.Row:
    """The comment, on a thread the user sees that is open, not removed."""
    row = _comment_row(db, user_name, comment_id)
    _require_open(db, thread_row(db, user_name, row["thread_id"]), at)
    if row["removed_at"] is not None:
        raise Conflict("this comment was removed")
    return row


def reply(db: sqlite3.Connection, actor: User, comment_id: int, text: object, at: Moment) -> int:
    """A reply to a top-level comment; replies nest one level only. The thread is then read for
    its author."""
    _require_writer(actor)
    body = clean_text(text, "a reply")
    with _write_transaction(db):
        when = _when(at)
        parent = _open_comment(db, actor.name, comment_id, when)
        if parent["parent_id"] is not None:
            raise GroupError("replies nest one level: reply to the comment this reply answers")
        _require_room(db, parent["thread_id"])
        cur = db.execute(
            "INSERT INTO comments(thread_id, parent_id, author, body, created_at)"
            " VALUES(?, ?, ?, ?, ?)",
            (parent["thread_id"], comment_id, actor.name, body, _utc_text(when)),
        )
        _touch(db, parent["thread_id"], when)
        _mark_read(db, actor.name, parent["thread_id"], when)
    assert cur.lastrowid is not None
    return cur.lastrowid


def _own(row: sqlite3.Row, actor: User, what: str) -> None:
    if row["author"] != actor.name:
        raise Forbidden(f"only its author can {what} a comment")


@dataclass(frozen=True)
class ThreadState:
    """What the edit and remove checks read about a thread at one time."""

    archived: bool
    editing: bool  # the "comments-edited" rule
    removing: bool  # the "authors-remove" rule


def thread_state(db: sqlite3.Connection, thread: sqlite3.Row, at: datetime) -> ThreadState:
    group = thread["group_id"]
    return ThreadState(
        archived_at(db, thread, at) is not None,
        groups.rule_on(db, group, "comments-edited"),
        groups.rule_on(db, group, "authors-remove"),
    )


def _check_change(actor: User, comment: sqlite3.Row, state: ThreadState, what: str) -> None:
    """The checks an edit and a removal share, in the order the routes answer them."""
    _require_writer(actor)
    if state.archived:
        raise Conflict("this thread is archived: it can be read but not added to")
    if comment["removed_at"] is not None:
        raise Conflict("this comment was removed")
    _own(comment, actor, what)


def check_edit(actor: User, comment: sqlite3.Row, state: ThreadState, at: datetime) -> None:
    """Raise the refusal `edit` answers for this comment at `at`; None when it would pass."""
    _check_change(actor, comment, state, "edit")
    if not state.editing:
        raise Forbidden("comments cannot be edited in this group")
    if at - datetime.fromisoformat(comment["created_at"]) > EDIT_WINDOW:
        raise Conflict(f"a comment can be edited for {groups.EDIT_MINUTES} minutes only")


def check_remove(actor: User, comment: sqlite3.Row, state: ThreadState) -> None:
    """Raise the refusal `remove` answers for this comment; None when it would pass."""
    _check_change(actor, comment, state, "remove")
    if not state.removing:
        raise Forbidden("comments cannot be removed in this group")


def can_edit(actor: User, comment: sqlite3.Row, state: ThreadState, at: datetime) -> bool:
    try:
        check_edit(actor, comment, state, at)
    except GroupError:
        return False
    return True


def can_remove(actor: User, comment: sqlite3.Row, state: ThreadState) -> bool:
    try:
        check_remove(actor, comment, state)
    except GroupError:
        return False
    return True


def _changing(
    db: sqlite3.Connection, actor: User, comment_id: int, at: datetime
) -> tuple[sqlite3.Row, ThreadState]:
    row = _comment_row(db, actor.name, comment_id)
    return row, thread_state(db, thread_row(db, actor.name, row["thread_id"]), at)


def edit(db: sqlite3.Connection, actor: User, comment_id: int, text: object, clock: Moment) -> None:
    """The author edits within EDIT_WINDOW of posting; the comment is then marked edited."""
    _require_writer(actor)
    body = clean_text(text, "a comment")
    with _write_transaction(db):
        at = _when(clock)
        row, state = _changing(db, actor, comment_id, at)
        check_edit(actor, row, state, at)
        db.execute(
            "UPDATE comments SET body=?, edited_at=? WHERE id=?",
            (body, _utc_text(at), comment_id),
        )


def remove(db: sqlite3.Connection, actor: User, comment_id: int, clock: Moment) -> None:
    """The author removes a comment: a removed line stays, with no text, no reactions; its
    replies stay."""
    _require_writer(actor)
    with _write_transaction(db):
        at = _when(clock)
        row, state = _changing(db, actor, comment_id, at)
        check_remove(actor, row, state)
        db.execute(
            "UPDATE comments SET body='', removed_at=? WHERE id=?", (_utc_text(at), comment_id)
        )
        db.execute("DELETE FROM reactions WHERE comment_id=?", (comment_id,))


@dataclass(frozen=True)
class Reaction:
    """One of the fixed words on a comment, to set (`on`) or clear."""

    comment_id: int
    word: object
    on: bool


def react(db: sqlite3.Connection, actor: User, reaction: Reaction, at: Moment) -> None:
    """Set or clear a word on a comment. One of each word per user per comment; setting twice or
    clearing an unset word changes nothing."""
    _require_writer(actor)
    if not isinstance(reaction.word, str) or reaction.word not in WORDS:
        raise GroupError("a reaction is Agree, Disagree or Seen")
    key = (reaction.comment_id, actor.name, reaction.word)
    with _write_transaction(db):
        _open_comment(db, actor.name, reaction.comment_id, _when(at))
        if reaction.on:
            db.execute(
                "INSERT OR IGNORE INTO reactions(comment_id, user_name, word) VALUES(?, ?, ?)", key
            )
        else:
            db.execute("DELETE FROM reactions WHERE comment_id=? AND user_name=? AND word=?", key)


def mark_read(
    db: sqlite3.Connection,
    user: User,
    thread_id: int,
    at: Moment,
    *,
    seen: datetime | None = None,
) -> None:
    """Anyone who sees the thread, readers included, marks it read up to `at`, or up to `seen`
    (the time of the snapshot the page showed) when that is earlier: a comment that arrived after
    the page was drawn stays unread. A mark never moves back."""
    with _write_transaction(db):
        when = _when(at)
        if seen is not None:
            when = min(when, seen)
        thread_row(db, user.name, thread_id)
        _mark_read(db, user.name, thread_id, when)


def seen_time(raw: object) -> datetime | None:
    """The `seen` of a read mark: absent, or the snapshot's `asOf` (a zoned ISO 8601 time)."""
    if raw is None:
        return None
    try:
        parsed = datetime.fromisoformat(raw) if isinstance(raw, str) and len(raw) <= 64 else None
        if parsed is not None and parsed.utcoffset() is not None:
            return parsed.astimezone(UTC)
    except (ValueError, OverflowError):  # not a time, or one outside the UTC range
        pass
    raise GroupError("seen must be the asOf time of the snapshot the page showed")


def post_topic_story(db: sqlite3.Connection, story_id: int, topic_ids: Sequence[int]) -> None:
    """Post a story that just matched `topic_ids` into every group following one of them: one
    thread per story per group, at the story's fetch time. A group already holding
    ``groups.MAX_THREADS`` threads makes room by dropping its oldest topic-posted thread that has
    no comment; one with no such thread is skipped (``topics_blocked``). Runs inside the caller's
    write transaction (where the topic matches are recorded)."""
    if not topic_ids:
        return
    marks = ", ".join("?" * len(topic_ids))
    rows = db.execute(
        "SELECT gt.group_id, MIN(gt.topic_id) AS topic_id FROM group_topics gt"
        " WHERE gt.topic_id IN (" + marks + ") AND NOT EXISTS(SELECT 1 FROM threads x"
        " WHERE x.group_id = gt.group_id AND x.story_id = ?) GROUP BY gt.group_id",
        [*topic_ids, story_id],
    ).fetchall()
    for row in rows:
        if not _make_room(db, row["group_id"]):
            continue
        db.execute(
            "INSERT INTO threads(group_id, story_id, created_at, topic_id, last_activity_at)"
            " SELECT ?, s.id, s.fetched_at, ?, s.fetched_at FROM stories s WHERE s.id = ?",
            (row["group_id"], row["topic_id"], story_id),
        )


def _held_threads(db: sqlite3.Connection, group_id: int) -> int:
    held = db.execute("SELECT COUNT(*) FROM threads WHERE group_id=?", (group_id,)).fetchone()
    return int(held[0])


def _make_room(db: sqlite3.Connection, group_id: int) -> bool:
    """Whether the group has room for one more thread: it does while it holds fewer than
    ``groups.MAX_THREADS``; a full group makes room by dropping its oldest topic-posted thread
    that has no comment (the caller's write transaction), and has none to give if it holds no such
    thread. A person's new thread and a topic's post are made room for the same way."""
    if _held_threads(db, group_id) < groups.MAX_THREADS:
        return True
    oldest = _oldest_topic_post(db, group_id)
    if oldest is None:
        return False
    db.execute("DELETE FROM threads WHERE id=?", (oldest,))
    return True


# A thread a topic posted (no person started it) that holds no comment line.
_TOPIC_POST = (
    "t.group_id = ? AND t.created_by IS NULL"
    " AND NOT EXISTS(SELECT 1 FROM comments c WHERE c.thread_id = t.id)"
)


def _oldest_topic_post(db: sqlite3.Connection, group_id: int) -> int | None:
    row = db.execute(
        f"SELECT t.id FROM threads t WHERE {_TOPIC_POST} ORDER BY t.last_activity_at, t.id LIMIT 1",
        (group_id,),
    ).fetchone()
    return None if row is None else int(row["id"])


def topics_blocked(db: sqlite3.Connection, group_id: int) -> bool:
    """Whether new stories of the group's topics are not posted there: it follows a topic, holds
    ``groups.MAX_THREADS`` threads and none of them is a topic post without comments."""
    return (
        _held_threads(db, group_id) >= groups.MAX_THREADS
        and bool(groups.group_topic_ids(db, group_id))
        and _oldest_topic_post(db, group_id) is None
    )


def prune_topic_posts(db: sqlite3.Connection, group_id: int, before: datetime) -> int:
    """Remove the group's topic-posted threads with no comment whose last activity is before
    `before` (the owner, on the command line), ``groups.BATCH`` at a time, each batch its own
    transaction so the write lock is let go between them; returns how many went."""
    gone = 0
    while True:
        with _write_transaction(db):
            groups.require_group(db, group_id)
            cur = db.execute(
                "DELETE FROM threads WHERE id IN (SELECT t.id FROM threads t"
                f" WHERE {_TOPIC_POST} AND t.last_activity_at < ? LIMIT ?)",
                (group_id, _utc_text(before), groups.BATCH),
            )
        gone += cur.rowcount
        if cur.rowcount < groups.BATCH:
            return gone


# The owner's moderation and clean-up, on the command line only (no browser route).


def remove_thread(db: sqlite3.Connection, thread_id: int) -> int:
    """Delete a thread with its comments, reactions and read marks; returns how many comment
    lines went with it."""
    with _write_transaction(db):
        if db.execute("SELECT 1 FROM threads WHERE id=?", (thread_id,)).fetchone() is None:
            raise NotFound(f"no thread with id {thread_id}")
        held = db.execute("SELECT COUNT(*) FROM comments WHERE thread_id=?", (thread_id,))
        count = int(held.fetchone()[0])
        db.execute("DELETE FROM threads WHERE id=?", (thread_id,))
    return count


def moderate_comment(db: sqlite3.Connection, comment_id: int, at: Moment) -> None:
    """Remove any comment, whatever the rules, its author or its thread's state: as an author's
    removal, a removed line stays, with no text and no reactions; its replies stay."""
    with _write_transaction(db):
        when = _when(at)
        if db.execute("SELECT 1 FROM comments WHERE id=?", (comment_id,)).fetchone() is None:
            raise NotFound(f"no comment with id {comment_id}")
        db.execute(
            "UPDATE comments SET body='', removed_at=coalesce(removed_at, ?) WHERE id=?",
            (_utc_text(when), comment_id),
        )
        db.execute("DELETE FROM reactions WHERE comment_id=?", (comment_id,))
