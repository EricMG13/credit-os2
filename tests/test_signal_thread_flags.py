"""`canEdit` and `canRemove` on every delivered comment: true exactly when the edit and the remove
routes would accept the viewer's request at the snapshot's time.

Each condition the routes check is flipped on its own and turns the flag off; for each state the
flags are compared with what `threads.edit` and `threads.remove` then do at the same time.
Every snapshot is read by the React reader.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)

from deploy_workflow.signal import groups, snapshot, threads
from deploy_workflow.signal.groups import GroupError
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import add_user, open_db

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")
INES = User("Ines K", "writer")


def _store(root: Path, posted: datetime = NOW - timedelta(minutes=5)) -> sqlite3.Connection:
    """Desk (everyone): Mara L's note thread with her comment 1, posted at `posted`."""
    db = open_db(root)
    add_user(db, "Mara L", "writer")
    add_user(db, "Ines K", "writer")
    desk = groups.create_group(db, MARA, "Desk", "everyone")
    thread, _ = threads.share(db, MARA, desk, threads.Item(None, "Note"), posted)
    assert threads.comment(db, MARA, thread, "Mine", posted) == 1
    return db


def _flags(db: sqlite3.Connection, viewer: User | None) -> tuple[bool, bool] | None:
    built = snapshot.build(db, viewer, NOW)
    assert react_refusal(built) is None
    held: list[Any] = built["scenes"][0]["snapshot"]["threads"]
    found = [c for t in held for c in t["comments"] if c["id"] == "1"]
    return (found[0]["canEdit"], found[0]["canRemove"]) if found else None


def _passes(call: Callable[[], None]) -> bool:
    try:
        call()
    except GroupError:
        return False
    return True


def _routes(db: sqlite3.Connection, viewer: User) -> tuple[bool, bool]:
    edited = _passes(lambda: threads.edit(db, viewer, 1, "Edited", NOW))
    return edited, _passes(lambda: threads.remove(db, viewer, 1, NOW))


def _no_edit_rule(db: sqlite3.Connection) -> None:
    groups.set_rule(db, MARA, 1, "comments-edited", False)


def _no_remove_rule(db: sqlite3.Connection) -> None:
    groups.set_rule(db, MARA, 1, "authors-remove", False)


def _removed(db: sqlite3.Connection) -> None:
    threads.remove(db, MARA, 1, NOW - timedelta(minutes=1))


def _nothing(db: sqlite3.Connection) -> None:
    return None


CASES = [
    # (what changes, the viewer, comment posted minutes ago, expected (canEdit, canRemove))
    (_nothing, MARA, 5, (True, True)),
    (_nothing, MARA, 15, (True, True)),  # the window's last moment
    (_nothing, MARA, 16, (False, True)),  # past the window
    (_nothing, INES, 5, (False, False)),  # not her comment
    (_nothing, User("Mara L", "reader"), 5, (False, False)),  # the author, now a reader
    (_nothing, User("Mara L", "owner"), 5, (True, True)),
    (_no_edit_rule, MARA, 5, (False, True)),
    (_no_remove_rule, MARA, 5, (True, False)),
    (_removed, MARA, 5, (False, False)),
]


@pytest.mark.parametrize(("change", "viewer", "minutes", "expected"), CASES)
def test_each_condition_turns_its_flag_and_the_flags_match_the_routes(
    tmp_path, change, viewer, minutes, expected
):
    db = _store(tmp_path, NOW - timedelta(minutes=minutes))
    change(db)
    assert _flags(db, viewer) == expected
    assert _routes(db, viewer) == expected
    db.close()


def test_an_archived_thread_offers_neither(tmp_path):
    db = _store(tmp_path, NOW - timedelta(days=91))
    assert _flags(db, MARA) == (False, True)  # quiet for 91 days, but archiving is off
    groups.set_rule(db, MARA, 1, "archive-quiet", True)
    assert _flags(db, MARA) == (False, False)
    assert _routes(db, MARA) == (False, False)
    db.close()


def test_a_viewer_with_no_name_is_delivered_no_comment(tmp_path):
    db = _store(tmp_path)
    assert _flags(db, None) is None
    db.close()


def test_a_reply_carries_its_own_flags(tmp_path):
    db = _store(tmp_path)
    threads.reply(db, INES, 1, "Hers", NOW - timedelta(minutes=2))
    built = snapshot.build(db, INES, NOW)
    assert react_refusal(built) is None
    (thread,) = built["scenes"][0]["snapshot"]["threads"]
    (top,) = thread["comments"]
    assert (top["canEdit"], top["canRemove"]) == (False, False)
    (answer,) = top["replies"]
    assert (answer["canEdit"], answer["canRemove"]) == (True, True)
    db.close()
