"""Topics: a named keyword rule over stories, matched through the full-text index, and follows."""

from __future__ import annotations

import json
import sqlite3
import unicodedata
from collections.abc import Sequence
from datetime import UTC, datetime

from deploy_workflow.signal import threads
from deploy_workflow.signal.store import (
    KINDS,
    Conflict,
    Missing,
    StoreError,
    _utc_text,
    _write_transaction,
)

MAX_KEYWORD = 60
MAX_KEYWORDS = 12  # a topic's rule costs one index query per keyword for every story that arrives
MAX_NAME = 80
MAX_TOPICS = 50


def fts_phrase(text: str) -> str:
    """`text` as one quoted FTS5 phrase, so query syntax in it is plain text."""
    return '"' + text.replace("\x00", " ").replace('"', '""') + '"'


def _clean_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        raise StoreError("name must not be empty")
    if len(cleaned) > MAX_NAME or any(unicodedata.category(ch)[0] == "C" for ch in cleaned):
        raise StoreError(f"a topic name is 1 to {MAX_NAME} characters of plain text")
    return cleaned


def _clean_keywords(keywords: Sequence[str]) -> list[str]:
    cleaned = [keyword.strip() for keyword in keywords]
    if not cleaned:
        raise StoreError("a topic needs at least one keyword")
    if len(cleaned) > MAX_KEYWORDS:
        raise StoreError(f"a topic has at most {MAX_KEYWORDS} keywords")
    for keyword in cleaned:
        if not 1 <= len(keyword) <= MAX_KEYWORD:
            raise StoreError(
                f"a keyword must be 1 to {MAX_KEYWORD} characters, got {keyword[:60]!r}"
            )
        if any(unicodedata.category(ch)[0] == "C" for ch in keyword):
            raise StoreError("a keyword is plain text: it has no control or invisible character")
    return cleaned


def _clean_kinds(kinds: Sequence[str]) -> list[str]:
    for kind in kinds:
        if kind not in KINDS:
            raise StoreError(f"invalid kind {kind!r}; expected one of {', '.join(KINDS)}")
    return list(kinds)


def _matches(db: sqlite3.Connection, story_id: int, topic: sqlite3.Row) -> bool:
    """Whether the story meets the topic's rule; one phrase query per keyword."""
    kinds = json.loads(topic["kinds"])
    if kinds:
        kind = db.execute(
            "SELECT src.kind FROM stories s JOIN sources src ON src.id = s.source_id WHERE s.id=?",
            (story_id,),
        ).fetchone()
        if kind is None or kind["kind"] not in kinds:
            return False
    return any(
        db.execute(
            "SELECT 1 FROM stories_fts WHERE stories_fts MATCH ? AND rowid=?",
            (fts_phrase(keyword), story_id),
        ).fetchone()
        for keyword in json.loads(topic["keywords"])
    )


def _link(db: sqlite3.Connection, topic_id: int, story_id: int) -> None:
    db.execute(
        "INSERT OR IGNORE INTO topic_stories(topic_id, story_id) VALUES(?, ?)",
        (topic_id, story_id),
    )


def match_story(db: sqlite3.Connection, story_id: int) -> list[int]:
    """Topic ids whose rule the story meets; records them. Safe to repeat."""
    with _write_transaction(db):
        found = [
            topic["id"]
            for topic in db.execute("SELECT * FROM topics ORDER BY id").fetchall()
            if _matches(db, story_id, topic)
        ]
        for topic_id in found:
            _link(db, topic_id, story_id)
        threads.post_topic_story(db, story_id, found)  # a group topic's new story posts there
    return found


def _link_existing(
    db: sqlite3.Connection, topic_id: int, keywords: Sequence[str], kinds: Sequence[str]
) -> None:
    """Link every stored story that meets the rule: one index query per keyword, not per story."""
    kind_filter = " AND src.kind IN (" + ", ".join("?" * len(kinds)) + ")" if kinds else ""
    for keyword in keywords:
        db.execute(
            "INSERT OR IGNORE INTO topic_stories(topic_id, story_id)"
            " SELECT ?, s.id FROM stories_fts JOIN stories s ON s.id = stories_fts.rowid"
            " JOIN sources src ON src.id = s.source_id"
            " WHERE stories_fts MATCH ?" + kind_filter,
            [topic_id, fts_phrase(keyword), *kinds],
        )


def add_topic(
    db: sqlite3.Connection,
    name: str,
    keywords: Sequence[str],
    kinds: Sequence[str],
    created_by: str,
) -> int:
    """Create a topic and match every existing story against it before returning."""
    title = _clean_name(name)
    cleaned = _clean_keywords(keywords)
    allowed = _clean_kinds(kinds)
    with _write_transaction(db):
        if db.execute("SELECT COUNT(*) FROM topics").fetchone()[0] >= MAX_TOPICS:
            raise Conflict(f"there are already {MAX_TOPICS} topics; delete one first")
        try:
            cur = db.execute(
                "INSERT INTO topics(name, keywords, kinds, created_by, created_at)"
                " VALUES(?, ?, ?, ?, ?)",
                (title, json.dumps(cleaned), json.dumps(allowed), created_by, _utc_text(_now())),
            )
        except sqlite3.IntegrityError as exc:
            raise Conflict(f"topic {title!r} already exists") from exc
        assert cur.lastrowid is not None
        _link_existing(db, cur.lastrowid, cleaned, allowed)
    return cur.lastrowid


def edit_topic(
    db: sqlite3.Connection,
    topic_id: int,
    name: str,
    keywords: Sequence[str],
    kinds: Sequence[str],
) -> None:
    """Change a topic's name and rule. A changed rule re-matches every stored story in the same
    write transaction (one index query per keyword, as `add_topic` does), so the topic holds
    exactly the stories a new topic with that rule would; follows are kept."""
    title = _clean_name(name)
    cleaned = _clean_keywords(keywords)
    allowed = _clean_kinds(kinds)
    with _write_transaction(db):
        old = db.execute("SELECT keywords, kinds FROM topics WHERE id=?", (topic_id,)).fetchone()
        if old is None:
            raise Missing(f"no topic with id {topic_id}")
        try:
            db.execute(
                "UPDATE topics SET name=?, keywords=?, kinds=? WHERE id=?",
                (title, json.dumps(cleaned), json.dumps(allowed), topic_id),
            )
        except sqlite3.IntegrityError as exc:
            raise Conflict(f"topic {title!r} already exists") from exc
        if (json.loads(old["keywords"]), json.loads(old["kinds"])) != (cleaned, allowed):
            db.execute("DELETE FROM topic_stories WHERE topic_id=?", (topic_id,))
            _link_existing(db, topic_id, cleaned, allowed)


def delete_topic(db: sqlite3.Connection, topic_id: int) -> None:
    """Delete a topic with its matches and follows. A digest's cover on it is removed with it and
    a thread it posted stays, no longer naming a topic. Conflict while a group's topic list names
    it."""
    with _write_transaction(db):
        _require_topic(db, topic_id)
        if db.execute("SELECT 1 FROM group_topics WHERE topic_id=?", (topic_id,)).fetchone():
            raise Conflict("a group still follows this topic; take it off the group's topics first")
        db.execute("DELETE FROM topic_stories WHERE topic_id=?", (topic_id,))
        db.execute("DELETE FROM topic_follows WHERE topic_id=?", (topic_id,))
        db.execute("DELETE FROM topics WHERE id=?", (topic_id,))


def _now() -> datetime:
    return datetime.now(UTC)


def _require_topic(db: sqlite3.Connection, topic_id: int) -> None:
    if db.execute("SELECT 1 FROM topics WHERE id=?", (topic_id,)).fetchone() is None:
        raise Missing(f"no topic with id {topic_id}")


def follow(db: sqlite3.Connection, user_name: str, topic_id: int) -> None:
    _require_topic(db, topic_id)
    with db:
        db.execute(
            "INSERT OR IGNORE INTO topic_follows(user_name, topic_id) VALUES(?, ?)",
            (user_name, topic_id),
        )


def unfollow(db: sqlite3.Connection, user_name: str, topic_id: int) -> None:
    _require_topic(db, topic_id)
    with db:
        db.execute(
            "DELETE FROM topic_follows WHERE user_name=? AND topic_id=?", (user_name, topic_id)
        )


def list_topics(db: sqlite3.Connection, user_name: str) -> list[sqlite3.Row]:
    """Every topic with its rule (keywords and kinds, JSON lists), whether `user_name` follows it
    and how many stories it holds."""
    return db.execute(
        "SELECT t.id, t.name, t.keywords, t.kinds,"
        " EXISTS(SELECT 1 FROM topic_follows f WHERE f.topic_id = t.id AND f.user_name = ?)"
        "  AS following,"
        " (SELECT COUNT(*) FROM topic_stories ts WHERE ts.topic_id = t.id) AS stories"
        " FROM topics t ORDER BY t.id",
        (user_name,),
    ).fetchall()


def counts_since(db: sqlite3.Connection, since: datetime) -> dict[int, int]:
    """Stories published after `since`, per topic id; a topic with none is left out."""
    rows = db.execute(
        "SELECT ts.topic_id, COUNT(*) AS n FROM topic_stories ts"
        " JOIN stories s ON s.id = ts.story_id WHERE s.published_at > ? GROUP BY ts.topic_id",
        (_utc_text(since),),
    ).fetchall()
    return {int(row["topic_id"]): int(row["n"]) for row in rows}
