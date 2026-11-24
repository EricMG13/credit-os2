"""Threads in groups: sharing a story or a note, comments with one level of replies, reactions,
read marks, and the archive rule. Every write takes the time it happens at (`at`), so the
15-minute edit window and the 90-day archive are decided from a given time, never the wall clock.

Decisions where spec 5.7 and the screens leave a choice:

* Sharing a story with a note: the note is the sharer's first comment (the Share dialog says
  "Members see it as your first comment"), so a story thread holds no note of its own. A thread
  started from a note alone holds the note. A second share of the same story to the same group
  joins the existing thread: its note, if any, becomes the second sharer's comment there.
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
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta

from deploy_workflow.signal import groups
from deploy_workflow.signal.groups import Conflict, Forbidden, GroupError, NotFound
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import _utc_text, _write_transaction

MAX_TEXT = 4000
WORDS = ("Agree", "Disagree", "Seen")
EDIT_WINDOW = timedelta(minutes=groups.EDIT_MINUTES)
QUIET = timedelta(days=groups.QUIET_DAYS)
_KEPT_CONTROLS = {"\n", "\t"}


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


def _add_comment(
    db: sqlite3.Connection, thread_id: int, actor: User, text: str, at: datetime
) -> int:
    """Insert a top-level comment, move the thread's activity and mark it read for the author."""
    stamp = _utc_text(at)
    cur = db.execute(
        "INSERT INTO comments(thread_id, author, body, created_at) VALUES(?, ?, ?, ?)",
        (thread_id, actor.name, text, stamp),
    )
    _touch(db, thread_id, actor.name, at)
    assert cur.lastrowid is not None
    return cur.lastrowid


def _touch(db: sqlite3.Connection, thread_id: int, user_name: str, at: datetime) -> None:
    db.execute(
        "UPDATE threads SET last_activity_at=max(last_activity_at, ?) WHERE id=?",
        (_utc_text(at), thread_id),
    )
    _mark_read(db, user_name, thread_id, at)


def _require_story(db: sqlite3.Connection, story_id: int) -> None:
    if db.execute("SELECT 1 FROM stories WHERE id=?", (story_id,)).fetchone() is None:
        raise NotFound(f"no story with id {story_id}")


def _new_thread(
    db: sqlite3.Connection, group_id: int, actor: User, item: Item, at: datetime
) -> int:
    """Insert a thread (`item.note` already cleaned, or None) and mark it read for its sharer."""
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
    db: sqlite3.Connection, actor: User, group_id: int, item: Item, at: datetime
) -> tuple[int, bool]:
    """Share a story (its note becomes the sharer's comment) or start a note thread.

    Returns the thread id and whether the share joined a thread the story already had there."""
    _require_writer(actor)
    if item.story_id is not None:
        return _share_story(db, actor, group_id, item, at)
    note = Item(None, clean_text(item.note, "a note"))
    with _write_transaction(db):
        groups.require_visible(db, actor.name, group_id)
        return _new_thread(db, group_id, actor, note, at), False


def _share_story(
    db: sqlite3.Connection, actor: User, group_id: int, item: Item, at: datetime
) -> tuple[int, bool]:
    assert item.story_id is not None
    note = _optional_note(item.note)
    with _write_transaction(db):
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
        if note is not None:
            _add_comment(db, thread_id, actor, note, at)
        return thread_id, held is not None


def comment(db: sqlite3.Connection, actor: User, thread_id: int, text: object, at: datetime) -> int:
    """A top-level comment on an open thread."""
    _require_writer(actor)
    body = clean_text(text, "a comment")
    with _write_transaction(db):
        thread = thread_row(db, actor.name, thread_id)
        _require_open(db, thread, at)
        return _add_comment(db, thread_id, actor, body, at)


def _comment_row(db: sqlite3.Connection, user_name: str, comment_id: int) -> sqlite3.Row:
    row: sqlite3.Row | None = db.execute(
        "SELECT * FROM comments WHERE id=?", (comment_id,)
    ).fetchone()
    if row is None:
        raise NotFound(f"no comment with id {comment_id}")
    thread_row(db, user_name, row["thread_id"])  # an unseen group's comment does not exist
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


def reply(db: sqlite3.Connection, actor: User, comment_id: int, text: object, at: datetime) -> int:
    """A reply to a top-level comment; replies nest one level only."""
    _require_writer(actor)
    body = clean_text(text, "a reply")
    with _write_transaction(db):
        parent = _open_comment(db, actor.name, comment_id, at)
        if parent["parent_id"] is not None:
            raise GroupError("replies nest one level: reply to the comment this reply answers")
        cur = db.execute(
            "INSERT INTO comments(thread_id, parent_id, author, body, created_at)"
            " VALUES(?, ?, ?, ?, ?)",
            (parent["thread_id"], comment_id, actor.name, body, _utc_text(at)),
        )
        _touch(db, parent["thread_id"], actor.name, at)
    assert cur.lastrowid is not None
    return cur.lastrowid


def _own(row: sqlite3.Row, actor: User, what: str) -> None:
    if row["author"] != actor.name:
        raise Forbidden(f"only its author can {what} a comment")


def edit(db: sqlite3.Connection, actor: User, comment_id: int, text: object, at: datetime) -> None:
    """The author edits within EDIT_WINDOW of posting; the comment is then marked edited."""
    _require_writer(actor)
    body = clean_text(text, "a comment")
    with _write_transaction(db):
        row = _open_comment(db, actor.name, comment_id, at)
        _own(row, actor, "edit")
        thread = thread_row(db, actor.name, row["thread_id"])
        if not groups.rule_on(db, thread["group_id"], "comments-edited"):
            raise Forbidden("comments cannot be edited in this group")
        if at - datetime.fromisoformat(row["created_at"]) > EDIT_WINDOW:
            raise Conflict(f"a comment can be edited for {groups.EDIT_MINUTES} minutes only")
        db.execute(
            "UPDATE comments SET body=?, edited_at=? WHERE id=?",
            (body, _utc_text(at), comment_id),
        )


def remove(db: sqlite3.Connection, actor: User, comment_id: int, at: datetime) -> None:
    """The author removes a comment: a removed line stays, with no text, no reactions; its
    replies stay."""
    _require_writer(actor)
    with _write_transaction(db):
        row = _open_comment(db, actor.name, comment_id, at)
        _own(row, actor, "remove")
        thread = thread_row(db, actor.name, row["thread_id"])
        if not groups.rule_on(db, thread["group_id"], "authors-remove"):
            raise Forbidden("comments cannot be removed in this group")
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


def react(db: sqlite3.Connection, actor: User, reaction: Reaction, at: datetime) -> None:
    """Set or clear a word on a comment. One of each word per user per comment; setting twice or
    clearing an unset word changes nothing."""
    _require_writer(actor)
    if not isinstance(reaction.word, str) or reaction.word not in WORDS:
        raise GroupError("a reaction is Agree, Disagree or Seen")
    key = (reaction.comment_id, actor.name, reaction.word)
    with _write_transaction(db):
        _open_comment(db, actor.name, reaction.comment_id, at)
        if reaction.on:
            db.execute(
                "INSERT OR IGNORE INTO reactions(comment_id, user_name, word) VALUES(?, ?, ?)", key
            )
        else:
            db.execute("DELETE FROM reactions WHERE comment_id=? AND user_name=? AND word=?", key)


def mark_read(db: sqlite3.Connection, user: User, thread_id: int, at: datetime) -> None:
    """Anyone who sees the thread, readers included, marks it read up to `at`."""
    with _write_transaction(db):
        thread_row(db, user.name, thread_id)
        _mark_read(db, user.name, thread_id, at)


def post_topic_story(db: sqlite3.Connection, story_id: int, topic_ids: Sequence[int]) -> None:
    """Post a story that just matched `topic_ids` into every group following one of them: one
    thread per story per group, at the story's fetch time. Runs inside the caller's write
    transaction (where the topic matches are recorded)."""
    if not topic_ids:
        return
    marks = ", ".join("?" * len(topic_ids))
    db.execute(
        "INSERT OR IGNORE INTO threads(group_id, story_id, created_at, topic_id, last_activity_at)"
        " SELECT gt.group_id, s.id, s.fetched_at, MIN(gt.topic_id), s.fetched_at"
        " FROM group_topics gt JOIN stories s ON s.id = ?"
        " WHERE gt.topic_id IN (" + marks + ") GROUP BY gt.group_id",
        [story_id, *topic_ids],
    )
