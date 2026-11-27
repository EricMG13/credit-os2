from __future__ import annotations

import multiprocessing as mp
import sqlite3
from datetime import UTC, datetime
from multiprocessing.connection import Connection
from multiprocessing.synchronize import Barrier
from pathlib import Path

import pytest
from hypothesis import given
from hypothesis import strategies as st

from deploy_workflow.signal.store import (
    Check,
    Conflict,
    StoreError,
    canonical_url,
    last_check,
    open_db,
    propose_source,
    record_check,
    set_source_state,
    sources,
)


def test_open_db_creates_file_in_wal_mode(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    assert (tmp_path / "signal" / "signal.db").is_file()
    assert db.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
    assert db.execute("PRAGMA foreign_keys").fetchone()[0] == 1


def test_open_db_twice_keeps_data(tmp_path: Path) -> None:
    first = open_db(tmp_path)
    propose_source(first, "Authority", "regulator", "https://example.org/feed", "A")
    first.close()
    db = open_db(tmp_path)
    try:
        assert [row["name"] for row in sources(db, "proposed")] == ["Authority"]
    finally:
        db.close()


def test_historical_users_table_is_empty_and_unused(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    try:
        assert db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
    finally:
        db.close()


def test_proposed_source_is_not_approved(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    sid = propose_source(db, "Authority", "regulator", "https://example.org/feed", "A. Kovac")
    assert [r["id"] for r in sources(db, "proposed")] == [sid]
    assert sources(db, "approved") == []
    set_source_state(db, sid, "approved")
    assert [r["id"] for r in sources(db, "approved")] == [sid]


def test_same_url_cannot_be_proposed_twice(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    propose_source(db, "A", "news", "https://example.org/feed", "x")
    with pytest.raises(StoreError):
        propose_source(db, "B", "news", "https://example.org/feed", "y")


def test_fts_finds_a_story_by_title_word(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    sid = propose_source(db, "A", "news", "https://example.org/feed", "x")
    db.execute(
        "INSERT INTO stories(source_id,title,link,link_key,title_key,published_at,fetched_at,"
        "summary) VALUES(?,?,?,?,?,?,?,?)",
        (
            sid,
            "Wholesale access remedy",
            "https://e.org/1",
            "e.org/1",
            "wholesale access remedy",
            "2026-11-13T09:00:00+00:00",
            "2026-11-13T09:05:00+00:00",
            "",
        ),
    )
    hits = db.execute("SELECT rowid FROM stories_fts WHERE stories_fts MATCH 'remedy'").fetchall()
    assert len(hits) == 1


def test_invalid_kind_state_and_empty_name_are_refused(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    with pytest.raises(StoreError):
        propose_source(db, "A", "blog", "https://e.org/f", "x")
    with pytest.raises(StoreError):
        propose_source(db, " ", "news", "https://e.org/f", "x")
    sid = propose_source(db, "A", "news", "https://e.org/f", "x")
    with pytest.raises(StoreError):
        set_source_state(db, sid, "deleted")
    with pytest.raises(StoreError):
        sources(db, "deleted")
    with pytest.raises(StoreError):
        set_source_state(db, sid + 99, "approved")


def test_last_check_returns_latest_in_utc(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    sid = propose_source(db, "A", "news", "https://e.org/f", "x")
    assert last_check(db, sid) is None
    t1 = datetime(2026, 11, 13, 9, 0, tzinfo=UTC)
    t2 = datetime(2026, 11, 13, 10, 0, tzinfo=UTC)
    record_check(db, sid, Check(t1, False, "timeout", None, None, 0))
    record_check(db, sid, Check(t2, True, "", "etag1", "Mon", 3))
    row = last_check(db, sid)
    assert row is not None
    assert row["at"] == "2026-11-13T10:00:00+00:00"
    assert (row["ok"], row["etag"], row["modified"], row["new_stories"]) == (1, "etag1", "Mon", 3)


def test_naive_check_time_is_refused(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    sid = propose_source(db, "A", "news", "https://e.org/f", "x")
    with pytest.raises(StoreError):
        record_check(db, sid, Check(datetime(2026, 11, 13, 9, 0), True, "", None, None, 0))


def _open_when_ready(root: str, barrier: Barrier, result: Connection) -> None:
    barrier.wait(timeout=20)
    try:
        db = open_db(Path(root))
        version = db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()[0]
        db.close()
        result.send(f"ok {version}")
    except (sqlite3.Error, StoreError) as exc:  # reported to the parent, which asserts on it
        result.send(f"{type(exc).__name__}: {exc}")
    finally:
        result.close()


def test_concurrent_first_open_all_succeed(tmp_path: Path) -> None:
    for trial in range(8):
        root = tmp_path / str(trial)
        barrier = mp.Barrier(4)
        endpoints = [mp.Pipe(duplex=False) for _ in range(4)]
        procs = [
            mp.Process(target=_open_when_ready, args=(str(root), barrier, child))
            for _, child in endpoints
        ]
        for p in procs:
            p.start()
        for _, child in endpoints:
            child.close()
        got = [parent.recv() for parent, _ in endpoints]
        for parent, _ in endpoints:
            parent.close()
        for p in procs:
            p.join(30)
        assert got == ["ok 9"] * 4  # every migration, 1 to 9


def test_fts_follows_title_update_and_delete(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    sid = propose_source(db, "A", "news", "https://e.org/f", "x")
    sql = (
        "INSERT INTO stories(source_id,title,link,link_key,title_key,published_at,fetched_at,"
        "summary) VALUES(?,?,?,?,?,?,?,?)"
    )
    for n, title in enumerate(["alpha remedy", "beta ruling"]):
        db.execute(
            sql,
            (
                sid,
                title,
                f"l{n}",
                f"k{n}",
                title,
                "2026-11-13T09:00:00+00:00",
                "2026-11-13T09:00:00+00:00",
                "",
            ),
        )

    def hits(word: str) -> int:
        q = "SELECT rowid FROM stories_fts WHERE stories_fts MATCH ?"
        return len(db.execute(q, (word,)).fetchall())

    db.execute("UPDATE stories SET title='gamma access' WHERE link_key='k0'")
    assert (hits("alpha"), hits("gamma")) == (0, 1)
    db.execute("DELETE FROM stories WHERE link_key='k1'")
    assert hits("beta") == 0


def test_feed_indexes_exist_after_open(tmp_path):
    db = open_db(tmp_path)
    try:
        names = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='index'")}
    finally:
        db.close()
    assert {
        "idx_story_duplicates_story_id",
        "idx_stories_published_at_id",
        "idx_topic_stories_story_id",
        "idx_stories_link_key",
        "idx_stories_title_key",
    } <= names


def test_link_first_seen_as_a_folded_duplicate_folds_again(tmp_path: Path) -> None:
    from datetime import timedelta

    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story

    db = open_db(tmp_path)
    for n in (1, 2, 3):
        sid = propose_source(db, f"S{n}", "news", f"https://s{n}.example/feed", "tester")
        set_source_state(db, sid, "approved")
    t = datetime(2026, 11, 13, 9, tzinfo=UTC)
    title = "Authority opens in depth review of Northwave"
    assert add_story(db, 1, Entry(title, "https://e.org/l1", t, ""), t) == "new"
    later = t + timedelta(hours=2)
    assert add_story(db, 2, Entry(title, "https://e.org/l2", later, ""), later) == "duplicate"
    other = Entry("Completely different words appear now", "https://e.org/l2", later, "")
    assert add_story(db, 3, other, later) == "duplicate"
    assert db.execute("SELECT count(*) FROM stories").fetchone()[0] == 1
    rows = db.execute("SELECT story_id FROM story_duplicates").fetchall()
    assert [r["story_id"] for r in rows] == [1, 1]


def test_story_duplicates_link_key_has_an_index(tmp_path: Path) -> None:
    db = open_db(tmp_path)
    plan = db.execute(
        "EXPLAIN QUERY PLAN SELECT story_id FROM story_duplicates WHERE link_key = ?", ("k",)
    ).fetchall()
    assert any("idx_story_duplicates_link_key" in row["detail"] for row in plan)


def test_a_storys_own_source_is_never_recorded_as_its_duplicate(tmp_path: Path) -> None:
    from datetime import timedelta

    from deploy_workflow.signal.feeds import Entry
    from deploy_workflow.signal.store import add_story

    db = open_db(tmp_path)
    for n in (1, 2):
        sid = propose_source(db, f"S{n}", "news", f"https://s{n}.example/feed", "tester")
        set_source_state(db, sid, "approved")
    t = datetime(2026, 11, 13, 9, tzinfo=UTC)
    later = t + timedelta(hours=2)
    title = "Authority opens in depth review of Northwave"
    assert add_story(db, 1, Entry(title, "https://e.org/l1", t, ""), t) == "new"
    assert add_story(db, 2, Entry(title, "https://e.org/l2", later, ""), later) == "duplicate"
    again = Entry("Completely different words appear now", "https://e.org/l2", later, "")
    assert add_story(db, 1, again, later) == "new"
    assert db.execute("SELECT count(*) FROM stories").fetchone()[0] == 2
    assert db.execute("SELECT count(*) FROM story_duplicates").fetchone()[0] == 1
    own = db.execute(
        "SELECT count(*) FROM story_duplicates d JOIN stories s ON s.id = d.story_id"
        " WHERE d.duplicate_source_id = s.source_id"
    ).fetchone()[0]
    assert own == 0


@pytest.mark.parametrize(
    ("given", "stored"),
    [
        ("https://Feeds.Example/rss", "https://feeds.example/rss"),
        ("https://feeds.example:443/rss", "https://feeds.example/rss"),
        ("https://feeds.example/rss#top", "https://feeds.example/rss"),
        ("HTTPS://FEEDS.EXAMPLE:443", "https://feeds.example/"),
        ("https://feeds.example/rss?", "https://feeds.example/rss"),
        ("https://feeds.example/rss?a=1&B=2", "https://feeds.example/rss?a=1&B=2"),
        ("https://feeds.example:8443/Rss", "https://feeds.example:8443/Rss"),
        ("http://feeds.example:80/rss", "http://feeds.example/rss"),
        ("  https://feeds.example/rss  ", "https://feeds.example/rss"),
        ("not an address", "not an address"),
    ],
)
def test_a_source_address_is_stored_in_one_spelling_and_proposed_once(tmp_path, given, stored):
    db = open_db(tmp_path)
    first = propose_source(db, "Feeds", "news", given, "x")
    assert db.execute("SELECT url FROM sources WHERE id=?", (first,)).fetchone()[0] == stored
    with pytest.raises(Conflict, match="already exists"):
        propose_source(db, "Again", "news", stored, "y")
    db.close()


@given(
    st.sampled_from(["https", "HTTP", "ftp", ""]),
    st.text(alphabet="abcXYZ.-:[]@%0123456789", max_size=20),
    st.text(alphabet="/abc?=&#% ", max_size=15),
)
def test_canonical_form_never_fails_and_is_its_own_canonical_form(scheme, authority, rest):
    once = canonical_url(f"{scheme}://{authority}{rest}")
    assert canonical_url(once) == once


# Which build made a store (review finding N6)


def test_the_released_migrations_are_never_edited():
    """Stores at version 2 exist (the released build made them) and record no hash; they are
    accepted because these two scripts are unchanged. These literals are their sha256 on main."""
    import hashlib

    from deploy_workflow.signal import store

    assert [hashlib.sha256(m.encode("utf-8")).hexdigest() for m in store.MIGRATIONS[:2]] == [
        "5ec24ec87588cbcf7db5fac5fdec353455d2a78a5b4edc1d995f481cd8588331",
        "30d2f48e01ca1287e46008d9d8ec1792fa121e81d197a91f4a11c089f49abb7e",
    ]
    assert store.RELEASED == 2


def _meta(root: Path) -> dict[str, str]:
    db = sqlite3.connect(root / "signal" / "signal.db")
    try:
        return dict(db.execute("SELECT key, value FROM meta").fetchall())
    finally:
        db.close()


def _set_meta(root: Path, **values: str | None) -> None:
    db = sqlite3.connect(root / "signal" / "signal.db")
    with db:
        for key, value in values.items():
            if value is None:
                db.execute("DELETE FROM meta WHERE key=?", (key,))
            else:
                db.execute("INSERT OR REPLACE INTO meta VALUES(?, ?)", (key, value))
    db.close()


def test_a_released_version_two_store_is_upgraded_and_records_its_hash(tmp_path):
    from deploy_workflow.signal import store

    (tmp_path / "signal").mkdir()
    db = sqlite3.connect(tmp_path / "signal" / "signal.db")
    db.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    db.executescript(store.MIGRATIONS[0] + store.MIGRATIONS[1])
    db.execute("INSERT INTO meta VALUES('schema_version', '2')")
    db.execute("INSERT INTO users(name, role) VALUES('Mara L', 'writer')")
    db.commit()
    db.close()
    open_db(tmp_path).close()
    held = _meta(tmp_path)
    assert held["schema_version"] == "9"
    assert held["schema_hash"] == store.scripts_hash(9)
    backup = sqlite3.connect(tmp_path / "signal" / "signal.db.before-accounts")
    try:
        assert backup.execute("SELECT name FROM users").fetchall() == [("Mara L",)]
        assert backup.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
    finally:
        backup.close()
    reopened = open_db(tmp_path)  # and it opens again as this build's own
    assert reopened.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
    reopened.close()


_OTHER = "was made by another build of Signal whose migrations differ from this one's"


@pytest.mark.parametrize(
    ("version", "recorded", "says"),
    [
        ("4", None, f"the store at schema version 4 {_OTHER}"),  # an earlier commit, no hash
        ("5", "0" * 64, f"the store at schema version 5 {_OTHER}"),
        ("3", "made-elsewhere", f"the store at schema version 3 {_OTHER}"),
        ("10", None, "the store is at schema version 10, later than this build's 9"),
    ],
)
def test_a_store_another_build_made_is_refused_with_its_remedy(tmp_path, version, recorded, says):
    open_db(tmp_path).close()
    _set_meta(tmp_path, schema_version=version, schema_hash=recorded)
    with pytest.raises(StoreError) as refused:
        open_db(tmp_path)
    assert str(refused.value) == (
        f"{says}: delete the development store {tmp_path / 'signal' / 'signal.db'} (with its"
        " -wal and -shm files) or open it with the build that made it; deleting it also erases"
        " this store's record of the month's AI spend, so its cap starts the month again from"
        " nothing"
    )
    assert _meta(tmp_path)["schema_version"] == version  # nothing was migrated


def test_the_service_names_the_remedy_when_it_cannot_open_the_store(tmp_path):
    from react_frontend import signal_host

    open_db(tmp_path).close()
    _set_meta(tmp_path, schema_version="5", schema_hash=None)
    with pytest.raises(OSError) as refused:  # what stops the application's start-up
        signal_host.SignalHost(tmp_path, environ={}).recover()
    said = str(refused.value)
    assert said.startswith(f"cannot open the store under {tmp_path}: the store at schema version 5")
    assert "delete the development store" in said
