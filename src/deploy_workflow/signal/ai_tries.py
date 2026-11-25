"""The story pass's bookkeeping between its calls (``story_ai_tries``): which stories a pass has
claimed for its call in flight, how many paid attempts a story has had, and the largest batch it
may be sent in next.

* A batch is claimed, in one write transaction, just before its call: a story another pass has
  claimed within ``ai_ledger.CALL_BOUND`` (the adapter's own bound on a call), or answered, is left
  out, so two passes at once never pay twice for one story. A claim older than that bound is no
  longer in flight anywhere and is taken over.
* A reply that cannot be read halves the batch its stories may be sent in next; a story alone in
  such a reply, or any story whose paid attempts reach ``MAX_ATTEMPTS``, is stored as invalid (no
  AI field, counted in Settings) and never sent again. A call whose cost or outcome is not known
  counts as a paid attempt but halves nothing (the story is not to blame). A call refused or not
  sent costs nothing and counts nothing: its claim is released.
* A story answered (written or invalid) leaves the table.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Sequence
from datetime import datetime

from deploy_workflow.signal import ai_ledger
from deploy_workflow.signal.store import _utc_text, _write_transaction

MAX_ATTEMPTS = 3  # paid attempts before a story is stored as invalid
FULL_BATCH = 20


def _marks(ids: Sequence[int]) -> str:
    return ", ".join("?" * len(ids))


def claim(db: sqlite3.Connection, ids: Sequence[int], at: datetime) -> list[int]:
    """Claim the stories of a batch for one call at `at`; the ids claimed, in order (those
    answered or claimed by a call still in flight are left out)."""
    live = _utc_text(at - ai_ledger.CALL_BOUND)
    kept: list[int] = []
    with _write_transaction(db):
        for story_id in ids:
            answered = db.execute("SELECT 1 FROM story_ai WHERE story_id=?", (story_id,))
            held = db.execute(
                "SELECT 1 FROM story_ai_tries WHERE story_id=? AND claimed_at >= ?",
                (story_id, live),
            )
            if answered.fetchone() is not None or held.fetchone() is not None:
                continue
            db.execute(
                "INSERT INTO story_ai_tries(story_id, attempts, batch, claimed_at)"
                " VALUES(?, 0, ?, ?) ON CONFLICT(story_id) DO UPDATE SET claimed_at=excluded.claimed_at",
                (story_id, FULL_BATCH, _utc_text(at)),
            )
            kept.append(story_id)
    return kept


def release(db: sqlite3.Connection, ids: Sequence[int]) -> None:
    """Release a batch's claim: its call was refused or not sent (nothing paid, nothing counted)."""
    if not ids:
        return
    with _write_transaction(db):
        db.execute(
            f"UPDATE story_ai_tries SET claimed_at=NULL WHERE story_id IN ({_marks(ids)})", ids
        )


def failed(
    db: sqlite3.Connection,
    ids: Sequence[int],
    config_id: str,
    now: datetime,
    *,
    unreadable: bool,
) -> list[int]:
    """Count a paid attempt for every story of a batch whose call gave no answer; with
    `unreadable` halve the batch they may go in next. The ids now stored as invalid."""
    halved = max(1, len(ids) // 2) if unreadable else FULL_BATCH
    lone = unreadable and len(ids) == 1
    marks = _marks(ids)
    with _write_transaction(db):
        db.execute(
            "UPDATE story_ai_tries SET attempts=attempts+1, batch=min(batch, ?), claimed_at=NULL"
            f" WHERE story_id IN ({marks})",
            (halved, *ids),
        )
        spent = [
            int(row[0])
            for row in db.execute(
                f"SELECT story_id FROM story_ai_tries WHERE story_id IN ({marks})"
                " AND (attempts >= ? OR ?) ORDER BY story_id",
                (*ids, MAX_ATTEMPTS, int(lone)),
            )
        ]
        for story_id in spent:
            db.execute(
                "INSERT OR IGNORE INTO story_ai(story_id, outcome, config_id, written_at, month)"
                " VALUES(?, 'invalid', ?, ?, ?)",
                (story_id, config_id, _utc_text(now), ai_ledger.month_of(now)),
            )
        done(db, spent)
    return spent


def done(db: sqlite3.Connection, ids: Sequence[int]) -> None:
    """Inside the caller's write transaction: these stories are answered."""
    if ids:
        db.execute(f"DELETE FROM story_ai_tries WHERE story_id IN ({_marks(ids)})", ids)
