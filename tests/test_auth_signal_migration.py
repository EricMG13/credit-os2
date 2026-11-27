"""Version 9 removes typed Signal state only after an exact version-8 backup."""

from __future__ import annotations

import hashlib
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path
from threading import Event, current_thread

import pytest

from deploy_workflow.signal import logos, store


def _version_eight_store(root: Path) -> None:
    folder = root / "signal"
    folder.mkdir(parents=True)
    database = folder / "signal.db"
    with closing(sqlite3.connect(database)) as db:
        db.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        for migration in store.MIGRATIONS[:8]:
            db.executescript(migration)
        db.execute("INSERT INTO meta(key, value) VALUES ('schema_version', '8')")
        db.execute(
            "INSERT INTO meta(key, value) VALUES ('schema_hash', ?)", (store.scripts_hash(8),)
        )
        db.execute("INSERT INTO users(name, role) VALUES (?, 'owner')", ("Test Owner",))
        db.commit()


def _seed_issuers_digests_and_runtime(db: sqlite3.Connection) -> None:
    db.executemany(
        "INSERT INTO issuers(id,name,aliases,cik,library_key,source_id,created_by,created_at)"
        " VALUES (?,?,?,?,?,?,?,?)",
        [
            (
                1,
                "Issuer One",
                "[]",
                "0000000001",
                "issuer-one",
                21,
                "Typed Issuer One",
                "2026-11-01T00:00:00+00:00",
            ),
            (
                2,
                "Issuer Two",
                "[]",
                "0000000002",
                "issuer-two",
                22,
                "Typed Issuer Two",
                "2026-11-02T00:00:00+00:00",
            ),
        ],
    )
    db.executemany("INSERT INTO issuer_stories VALUES (?,?)", [(1, 1), (2, 2)])
    db.executemany(
        "INSERT INTO issuer_follows VALUES (?,?)", [("Test Owner", 1), ("Test Reader", 2)]
    )
    db.execute(
        "INSERT INTO digests(id,owner,name,cadence,minute,weekday,month_day,covers_all,subject,"
        "length,points,upcoming,look_ahead_days,period_from,next_run_at,created_at,story_mark)"
        " VALUES (1,'Test Owner','Daily','daily',420,NULL,NULL,1,'Subject','short',2,'soon',7,"
        "'2026-11-01T00:00:00+00:00','2026-11-02T00:00:00+00:00','2026-11-01T00:00:00+00:00',3)"
    )
    db.executemany("INSERT INTO digest_topics VALUES (?,?)", [(1, 1)])
    db.executemany("INSERT INTO digest_groups VALUES (?,?)", [(1, 1)])
    db.execute("INSERT INTO digest_issuers VALUES (1,1)")
    db.execute(
        "INSERT INTO digest_issues VALUES "
        "(1,1,'written','2026-11-01','2026-11-02','2026-11-02',NULL)"
    )
    db.execute(
        "INSERT INTO digest_runs VALUES "
        "(1,1,'manual','2026-11-02','2026-11-01','2026-11-02','written','complete',3,1)"
    )
    db.executemany(
        "INSERT INTO digest_points VALUES (1,?,?,?,?)",
        [(1, "Point one", "Body one", "[1]"), (2, "Point two", "Body two", "[2]")],
    )
    db.execute("INSERT INTO digest_issue_ai VALUES (1,3,'config-one','covers-one')")
    db.execute(
        "INSERT INTO story_ai VALUES "
        "(1,'written','Why',2,'tags','news','opened','moves','config','2026-11-01','2026-11')"
    )
    db.execute("INSERT INTO story_ai_tries VALUES (2,1,2,NULL)")
    db.executemany(
        "INSERT INTO ai_usage(purpose,owner,config_id,month,reserved_usd,settled_usd,status,"
        "outcome,reserved_at,settled_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
            (
                "stories",
                None,
                "story-config",
                "2026-11",
                "1.25",
                "0.75",
                "settled",
                "ok",
                "2026-11-01",
                "2026-11-01",
            ),
            (
                "digest",
                "Test Owner",
                "digest-config",
                "2026-11",
                "0.50",
                None,
                "open",
                "pending",
                "2026-11-02",
                None,
            ),
        ],
    )
    db.executemany(
        "INSERT INTO settings VALUES (?,?,?)",
        [("ai_cap_usd", "15", "2026-11-01"), ("ai_switched_off", "1", "2026-11-01")],
    )
    db.executemany(
        "INSERT INTO service_settings VALUES (?,?,?)",
        [
            ("filings_contact", "ops@example.test", "2026-11-01"),
            ("market_hour", "16", "2026-11-01"),
        ],
    )
    db.execute(
        "INSERT INTO market_series VALUES "
        "('SERIES','Title','Short','USD','FRED',1,'2026-11-01',NULL,NULL,NULL)"
    )
    db.execute("INSERT INTO market_posts VALUES (3,'2026-11-01','[]')")


def _seed_answer_key_store(root: Path) -> None:
    folder = root / "signal"
    folder.mkdir(parents=True)
    with closing(sqlite3.connect(folder / "signal.db")) as db:
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        for migration in store.MIGRATIONS[:8]:
            db.executescript(migration)
        db.execute("INSERT INTO meta VALUES ('schema_version', '8')")
        db.execute("INSERT INTO meta VALUES ('schema_hash', ?)", (store.scripts_hash(8),))
        db.execute("UPDATE meta SET value='independent-test-store' WHERE key='store_id'")

        db.executemany(
            "INSERT INTO users(name, role) VALUES (?, ?)",
            [("Test Owner", "owner"), ("Test Writer", "writer"), ("Test Reader", "reader")],
        )
        sources = [
            (10, "Regulator", "regulator", "approved"),
            (11, "News", "news", "paused"),
            (12, "Ratings", "ratings", "proposed"),
            (13, "Research", "research", "proposed"),
            (20, "Proposed Filing", "filing", "proposed"),
            (21, "Approved Filing", "filing", "approved"),
            (22, "Paused Filing", "filing", "paused"),
            (30, "Proposed Market", "market", "proposed"),
            (31, "Approved Market", "market", "approved"),
            (32, "Paused Market", "market", "paused"),
        ]
        db.executemany(
            "INSERT INTO sources(id,name,kind,url,state,proposed_by,created_at)"
            " VALUES (?,?,?,?,?,?,?)",
            [
                (
                    ident,
                    name,
                    kind,
                    f"https://fixture.example.test/{ident}",
                    state,
                    f"creator-{ident}",
                    f"2026-11-{ident % 20 + 1:02d}T00:00:00+00:00",
                )
                for ident, name, kind, state in sources
            ],
        )
        db.executemany(
            "INSERT INTO source_checks(source_id,at,ok,reason,etag,modified,new_stories)"
            " VALUES (?,?,?,?,?,?,?)",
            [
                (10, "2026-11-01T00:00:00+00:00", 1, "", "e10", None, 1),
                (10, "2026-11-02T00:00:00+00:00", 0, "timeout", None, None, 0),
            ],
        )
        for ident, source_id in ((1, 10), (2, 11), (3, 31)):
            db.execute(
                "INSERT INTO stories(id,source_id,title,link,link_key,title_key,published_at,"
                "fetched_at,summary,category) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (
                    ident,
                    source_id,
                    f"Story {ident}",
                    f"https://story.test/{ident}",
                    f"story-link-{ident}",
                    f"story-title-{ident}",
                    "2026-11-01T00:00:00+00:00",
                    f"2026-11-01T00:00:0{ident}+00:00",
                    f"Summary {ident}",
                    "release",
                ),
            )
        db.executemany(
            "INSERT INTO story_duplicates(story_id,duplicate_source_id,link,link_key,"
            "published_at,seen_at) VALUES (?,?,?,?,?,?)",
            [
                (
                    1,
                    11,
                    "https://dup.test/a",
                    "duplicate-a",
                    "2026-11-01T00:00:00+00:00",
                    "2026-11-01T00:01:00+00:00",
                ),
                (
                    2,
                    10,
                    "https://dup.test/b",
                    "duplicate-b",
                    "2026-11-02T00:00:00+00:00",
                    "2026-11-02T00:01:00+00:00",
                ),
            ],
        )
        db.executemany(
            "INSERT INTO topics(id,name,keywords,kinds,created_by,created_at) VALUES (?,?,?,?,?,?)",
            [
                (1, "Rates", "rates", "news", "Typed Topic One", "2026-11-01T00:00:00+00:00"),
                (2, "Banks", "banks", "research", "Typed Topic Two", "2026-11-02T00:00:00+00:00"),
            ],
        )
        db.executemany("INSERT INTO topic_stories VALUES (?,?)", [(1, 1), (2, 2)])
        db.executemany(
            "INSERT INTO topic_follows VALUES (?,?)", [("Test Owner", 1), ("Test Reader", 2)]
        )
        db.executemany(
            "INSERT INTO source_logos(source_id,data,media_type,url,fetched_at,note,"
            "declared,cleared)"
            " VALUES (?,?,?,?,?,?,?,?)",
            [
                (
                    10,
                    b"logo-ten",
                    "image/png",
                    "https://logo.test/10",
                    "2026-11-01T00:00:00+00:00",
                    None,
                    None,
                    0,
                ),
                (
                    11,
                    b"logo-eleven",
                    "image/png",
                    "https://logo.test/11",
                    "2026-11-02T00:00:00+00:00",
                    None,
                    None,
                    0,
                ),
                (20, None, None, None, None, None, "https://logo.test/20", 0),
                (
                    31,
                    b"logo-thirty-one",
                    "image/jpeg",
                    "https://logo.test/31",
                    "2026-11-03T00:00:00+00:00",
                    None,
                    None,
                    0,
                ),
            ],
        )
        db.executemany(
            "INSERT INTO saves VALUES (?,?,?)",
            [
                ("Test Owner", 1, "2026-11-01T00:00:00+00:00"),
                ("Test Reader", 2, "2026-11-02T00:00:00+00:00"),
            ],
        )
        db.executemany(
            "INSERT INTO groups(id,name,visibility,created_by,created_at) VALUES (?,?,?,?,?)",
            [
                (1, "Desk", "everyone", "Typed Group One", "2026-11-01T00:00:00+00:00"),
                (2, "Closed", "invited", "Typed Group Two", "2026-11-02T00:00:00+00:00"),
            ],
        )
        db.executemany(
            "INSERT INTO group_members VALUES (?,?)",
            [(1, "Test Owner"), (1, "Test Reader"), (2, "Test Writer")],
        )
        db.executemany("INSERT INTO group_topics VALUES (?,?)", [(1, 1), (2, 2)])
        db.execute("INSERT INTO thread_rules VALUES (1,'authors-remove',1)")
        db.executemany(
            "INSERT INTO threads(id,group_id,story_id,created_at,created_by,topic_id,note,"
            "last_activity_at) VALUES (?,?,?,?,?,?,?,?)",
            [
                (
                    1,
                    1,
                    1,
                    "2026-11-01T00:00:00+00:00",
                    "Test Owner",
                    None,
                    None,
                    "2026-11-01T00:00:00+00:00",
                ),
                (
                    2,
                    2,
                    2,
                    "2026-11-02T00:00:00+00:00",
                    "Test Writer",
                    None,
                    None,
                    "2026-11-02T00:00:00+00:00",
                ),
            ],
        )
        db.executemany(
            "INSERT INTO comments(id,thread_id,parent_id,author,body,created_at,"
            "edited_at,removed_at)"
            " VALUES (?,?,?,?,?,?,?,?)",
            [
                (1, 1, None, "Test Owner", "Parent", "2026-11-01T00:00:00+00:00", None, None),
                (2, 1, 1, "Test Reader", "Child", "2026-11-01T00:01:00+00:00", None, None),
            ],
        )
        db.executemany(
            "INSERT INTO reactions VALUES (?,?,?)",
            [(1, "Test Reader", "Agree"), (2, "Test Owner", "Seen")],
        )
        db.executemany(
            "INSERT INTO read_marks VALUES (?,?,?)",
            [
                ("Test Owner", 1, "2026-11-01T00:00:00+00:00"),
                ("Test Reader", 2, "2026-11-02T00:00:00+00:00"),
            ],
        )
        db.executemany(
            "INSERT INTO notification_settings VALUES (?,?,?,?)",
            [("Test Owner", "replies", 1, 0), ("Test Reader", "threads", 0, 1)],
        )
        _seed_issuers_digests_and_runtime(db)
        db.commit()
        logos.clear(db, 12)
        assert db.execute("PRAGMA foreign_key_check").fetchall() == []
        db.commit()


def _assert_retained_fixture_rows(db: sqlite3.Connection, *, original_creators: bool) -> None:
    def rows(query: str) -> list[tuple[object, ...]]:
        return [tuple(row) for row in db.execute(query).fetchall()]

    assert rows(
        "SELECT id,source_id,title,link,link_key,title_key,published_at,fetched_at,"
        "summary,category "
        "FROM stories ORDER BY id"
    ) == [
        (
            1,
            10,
            "Story 1",
            "https://story.test/1",
            "story-link-1",
            "story-title-1",
            "2026-11-01T00:00:00+00:00",
            "2026-11-01T00:00:01+00:00",
            "Summary 1",
            "release",
        ),
        (
            2,
            11,
            "Story 2",
            "https://story.test/2",
            "story-link-2",
            "story-title-2",
            "2026-11-01T00:00:00+00:00",
            "2026-11-01T00:00:02+00:00",
            "Summary 2",
            "release",
        ),
        (
            3,
            31,
            "Story 3",
            "https://story.test/3",
            "story-link-3",
            "story-title-3",
            "2026-11-01T00:00:00+00:00",
            "2026-11-01T00:00:03+00:00",
            "Summary 3",
            "release",
        ),
    ]
    assert rows(
        "SELECT story_id,duplicate_source_id,link,link_key,published_at,seen_at "
        "FROM story_duplicates ORDER BY story_id"
    ) == [
        (
            1,
            11,
            "https://dup.test/a",
            "duplicate-a",
            "2026-11-01T00:00:00+00:00",
            "2026-11-01T00:01:00+00:00",
        ),
        (
            2,
            10,
            "https://dup.test/b",
            "duplicate-b",
            "2026-11-02T00:00:00+00:00",
            "2026-11-02T00:01:00+00:00",
        ),
    ]
    assert rows(
        "SELECT source_id,at,ok,reason,etag,modified,new_stories FROM source_checks ORDER BY id"
    ) == [
        (10, "2026-11-01T00:00:00+00:00", 1, "", "e10", None, 1),
        (10, "2026-11-02T00:00:00+00:00", 0, "timeout", None, None, 0),
    ]
    assert rows("SELECT rowid FROM stories_fts WHERE stories_fts MATCH 'Story' ORDER BY rowid") == [
        (1,),
        (2,),
        (3,),
    ]
    assert rows(
        "SELECT id,name,aliases,cik,library_key,source_id,created_by,created_at "
        "FROM issuers ORDER BY id"
    ) == [
        (
            1,
            "Issuer One",
            "[]",
            "0000000001",
            "issuer-one",
            21,
            "Typed Issuer One" if original_creators else "before accounts",
            "2026-11-01T00:00:00+00:00",
        ),
        (
            2,
            "Issuer Two",
            "[]",
            "0000000002",
            "issuer-two",
            22,
            "Typed Issuer Two" if original_creators else "before accounts",
            "2026-11-02T00:00:00+00:00",
        ),
    ]
    assert rows("SELECT issuer_id,story_id FROM issuer_stories ORDER BY issuer_id") == [
        (1, 1),
        (2, 2),
    ]
    assert rows("SELECT * FROM story_ai") == [
        (
            1,
            "written",
            "Why",
            2,
            "tags",
            "news",
            "opened",
            "moves",
            "config",
            "2026-11-01",
            "2026-11",
        )
    ]
    assert rows("SELECT * FROM story_ai_tries") == [(2, 1, 2, None)]
    assert rows("SELECT * FROM ai_usage ORDER BY id") == [
        (
            1,
            "stories",
            None,
            "story-config",
            "2026-11",
            "1.25",
            "0.75",
            "settled",
            "ok",
            "2026-11-01",
            "2026-11-01",
        ),
        (
            2,
            "digest",
            "Test Owner",
            "digest-config",
            "2026-11",
            "0.50",
            None,
            "open",
            "pending",
            "2026-11-02",
            None,
        ),
    ]
    assert rows("SELECT * FROM settings ORDER BY key") == [
        ("ai_cap_usd", "15", "2026-11-01"),
        ("ai_switched_off", "1", "2026-11-01"),
    ]
    assert rows("SELECT * FROM service_settings ORDER BY key") == [
        ("filings_contact", "ops@example.test", "2026-11-01"),
        ("market_hour", "16", "2026-11-01"),
    ]
    assert rows("SELECT * FROM market_series") == [
        ("SERIES", "Title", "Short", "USD", "FRED", 1, "2026-11-01", None, None, None)
    ]
    assert rows("SELECT * FROM market_posts") == [(3, "2026-11-01", "[]")]


def test_existing_version_eight_store_is_backed_up_before_typed_users_are_deleted(
    tmp_path: Path,
) -> None:
    _version_eight_store(tmp_path)

    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"
        assert current.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
        assert current.execute("PRAGMA foreign_key_check").fetchall() == []

    snapshot_path = tmp_path / "signal" / "signal.db.before-accounts"
    with closing(sqlite3.connect(f"file:{snapshot_path}?mode=ro", uri=True)) as snapshot:
        assert snapshot.execute("SELECT name, role FROM users").fetchall() == [
            ("Test Owner", "owner")
        ]
        assert snapshot.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert snapshot.execute("PRAGMA foreign_key_check").fetchall() == []

    assert sorted(path.name for path in (tmp_path / "signal").iterdir()) == [
        "signal.db",
        "signal.db.before-accounts",
    ]


def test_snapshot_digest_classifies_actual_composite_without_rowid_tables(
    tmp_path: Path,
) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    with closing(sqlite3.connect(live_path)) as db:
        db.execute("CREATE TABLE retained_default(value TEXT DEFAULT 'WITHOUT ROWID')")
        db.execute("INSERT INTO retained_default DEFAULT VALUES")
        db.execute("INSERT INTO retained_default(value) VALUES ('kept')")
        db.execute(
            "CREATE TABLE retained_composite(left_key TEXT, right_key INTEGER, value BLOB, "
            "PRIMARY KEY(left_key,right_key)) WITHOUT ROWID"
        )
        db.executemany(
            "INSERT INTO retained_composite VALUES (?,?,?)",
            [("alpha", 1, b"one"), ("beta", 2, b"two")],
        )
        db.commit()

    with closing(store.open_db(tmp_path)) as active:
        assert store.get_meta(active, "schema_version") == "9"
        assert [tuple(row) for row in active.execute("SELECT value FROM retained_default")] == [
            ("WITHOUT ROWID",),
            ("kept",),
        ]
        assert [
            tuple(row)
            for row in active.execute(
                "SELECT left_key,right_key,value FROM retained_composite "
                "ORDER BY left_key,right_key"
            )
        ] == [("alpha", 1, b"one"), ("beta", 2, b"two")]

    backup_path = live_path.with_name("signal.db.before-accounts")
    with closing(sqlite3.connect(f"file:{backup_path}?mode=ro", uri=True)) as backup:
        assert backup.execute("SELECT value FROM retained_default ORDER BY rowid").fetchall() == [
            ("WITHOUT ROWID",),
            ("kept",),
        ]
        assert backup.execute(
            "SELECT left_key,right_key,value FROM retained_composite ORDER BY left_key,right_key"
        ).fetchall() == [("alpha", 1, b"one"), ("beta", 2, b"two")]


def test_fresh_store_reaches_version_nine_without_a_typed_state_backup(tmp_path: Path) -> None:
    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"
        assert current.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0

    assert sorted(path.name for path in (tmp_path / "signal").iterdir()) == ["signal.db"]


def test_reopen_preserves_the_exclusive_backup_bytes_and_identity(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    with closing(store.open_db(tmp_path)):
        pass
    backup = tmp_path / "signal" / "signal.db.before-accounts"
    original_bytes = backup.read_bytes()
    original_stat = backup.stat()

    with closing(store.open_db(tmp_path)):
        pass

    assert backup.read_bytes() == original_bytes
    assert backup.stat().st_ino == original_stat.st_ino
    assert backup.stat().st_dev == original_stat.st_dev


def test_orphan_stage_never_substitutes_for_the_final_backup(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    folder = tmp_path / "signal"
    orphan = folder / ".signal.db.before-accounts-orphan.tmp"
    orphan.write_bytes(b"partial database from an interrupted attempt")

    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"

    backup = folder / "signal.db.before-accounts"
    assert backup.is_file() and backup.read_bytes() != orphan.read_bytes()
    assert orphan.read_bytes() == b"partial database from an interrupted attempt"
    with closing(sqlite3.connect(f"file:{backup}?mode=ro", uri=True)) as snapshot:
        assert snapshot.execute("SELECT name,role FROM users").fetchall() == [
            ("Test Owner", "owner")
        ]


def test_upgrade_snapshot_includes_committed_rows_still_in_wal(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    with closing(sqlite3.connect(live_path)) as writer:
        assert writer.execute("PRAGMA journal_mode=WAL").fetchone()[0] == "wal"
        writer.execute("PRAGMA wal_autocheckpoint=0")
        writer.execute("INSERT INTO users(name,role) VALUES ('WAL Writer','writer')")
        writer.commit()
        wal_path = live_path.with_name("signal.db-wal")
        assert wal_path.is_file() and wal_path.stat().st_size > 0

        with closing(store.open_db(tmp_path)) as current:
            assert store.get_meta(current, "schema_version") == "9"

        backup = live_path.with_name("signal.db.before-accounts")
        with closing(sqlite3.connect(f"file:{backup}?mode=ro", uri=True)) as snapshot:
            assert snapshot.execute("SELECT name,role FROM users ORDER BY name").fetchall() == [
                ("Test Owner", "owner"),
                ("WAL Writer", "writer"),
            ]


def test_simultaneous_fresh_public_openers_finish_v9_without_a_backup(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    creator_paused = Event()
    release_creator = Event()
    competing_entered = Event()
    original_record = store._record_migration
    original_initialize = store._apply_fresh_migrations
    creator_name: list[str] = []

    def pause_after_version_eight(db: sqlite3.Connection, version: int) -> None:
        original_record(db, version)
        if version == 8 and not creator_name:
            creator_name.append(current_thread().name)
            creator_paused.set()
            assert release_creator.wait(10)

    def identify_competing_initializer(db: sqlite3.Connection) -> None:
        if creator_name and current_thread().name != creator_name[0]:
            competing_entered.set()
        original_initialize(db)

    monkeypatch.setattr(store, "_record_migration", pause_after_version_eight)
    monkeypatch.setattr(store, "_apply_fresh_migrations", identify_competing_initializer)

    def open_and_report() -> str:
        with closing(store.open_db(tmp_path)) as db:
            return str(store.get_meta(db, "schema_version"))

    with ThreadPoolExecutor(max_workers=2) as pool:
        creator = pool.submit(open_and_report)
        assert creator_paused.wait(10)
        competing = pool.submit(open_and_report)
        try:
            assert competing_entered.wait(10)
        finally:
            release_creator.set()
        assert competing.result(timeout=20) == "9"
        assert creator.result(timeout=20) == "9"

    assert not (tmp_path / "signal" / "signal.db.before-accounts").exists()


def test_simultaneous_v8_public_openers_share_one_backup_after_locked_migration(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _version_eight_store(tmp_path)
    backup_published = Event()
    release_migrator = Event()
    competing_entered_v9 = Event()
    backup_identity: list[tuple[bytes, int, int]] = []
    original_backup = store._backup_before_accounts
    original_apply = store._apply_migration
    migrator_name: list[str] = []

    def hold_after_verified_backup(db: sqlite3.Connection) -> None:
        original_backup(db)
        migrator_name.append(current_thread().name)
        backup = tmp_path / "signal" / "signal.db.before-accounts"
        backup_identity.append((backup.read_bytes(), backup.stat().st_dev, backup.stat().st_ino))
        backup_published.set()
        assert release_migrator.wait(10)

    def mark_competing_migration(db: sqlite3.Connection, version: int) -> None:
        if version == 9 and migrator_name and current_thread().name != migrator_name[0]:
            competing_entered_v9.set()
        original_apply(db, version)

    monkeypatch.setattr(store, "_backup_before_accounts", hold_after_verified_backup)
    monkeypatch.setattr(store, "_apply_migration", mark_competing_migration)

    def open_and_report() -> str:
        with closing(store.open_db(tmp_path)) as db:
            return str(store.get_meta(db, "schema_version"))

    with ThreadPoolExecutor(max_workers=2) as pool:
        migrator = pool.submit(open_and_report)
        assert backup_published.wait(10)
        competing = pool.submit(open_and_report)
        try:
            assert competing_entered_v9.wait(10)
        finally:
            release_migrator.set()
        assert migrator.result(timeout=20) == "9"
        assert competing.result(timeout=20) == "9"

    backup = tmp_path / "signal" / "signal.db.before-accounts"
    assert (backup.read_bytes(), backup.stat().st_dev, backup.stat().st_ino) == backup_identity[0]
    with closing(sqlite3.connect(f"file:{backup}?mode=ro", uri=True)) as snapshot:
        assert snapshot.execute("SELECT name,role FROM users").fetchall() == [
            ("Test Owner", "owner")
        ]


def test_same_count_backup_with_different_text_after_nul_is_refused_without_mutation(
    tmp_path: Path,
) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    with (
        closing(sqlite3.connect(live_path)) as live,
        closing(sqlite3.connect(backup_path)) as backup,
    ):
        live.backup(backup)
    with closing(sqlite3.connect(live_path)) as live:
        live.execute("UPDATE users SET name=?", ("Test Owner\x00changed",))
        live.commit()
    preserved_backup = hashlib.sha256(backup_path.read_bytes()).digest()

    with pytest.raises(store.StoreError, match="does not match the current Signal store"):
        store.open_db(tmp_path)

    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert live.execute("SELECT hex(name) FROM users").fetchall() == [
            ("54657374204F776E6572006368616E676564",)
        ]
    assert hashlib.sha256(backup_path.read_bytes()).digest() == preserved_backup


def test_backup_comparison_includes_retired_autoincrement_history(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    with closing(sqlite3.connect(live_path)) as live:
        live.execute(
            "INSERT INTO groups(name,visibility,created_by,created_at) "
            "VALUES ('Retired','everyone','Test Owner','2026-11-01')"
        )
        live.commit()
        with closing(sqlite3.connect(backup_path)) as backup:
            live.backup(backup)
        live.execute("DELETE FROM groups")
        live.execute("UPDATE sqlite_sequence SET seq=2 WHERE name='groups'")
        live.commit()
    preserved = backup_path.read_bytes()

    with pytest.raises(store.StoreError, match="does not match the current Signal store"):
        store.open_db(tmp_path)

    assert backup_path.read_bytes() == preserved
    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT COUNT(*) FROM groups").fetchone() == (0,)
        assert live.execute("SELECT seq FROM sqlite_sequence WHERE name='groups'").fetchone() == (
            2,
        )
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )


def test_backup_comparison_includes_implicit_rowid_without_changing_row_values(
    tmp_path: Path,
) -> None:
    _seed_answer_key_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    with (
        closing(sqlite3.connect(live_path)) as live,
        closing(sqlite3.connect(backup_path)) as backup,
    ):
        live.execute("DELETE FROM story_duplicates WHERE story_id=2")
        live.commit()
        live.backup(backup)
        assert live.execute(
            "SELECT rowid,story_id,duplicate_source_id,link,link_key,published_at,seen_at "
            "FROM story_duplicates WHERE story_id=1"
        ).fetchone() == (
            1,
            1,
            11,
            "https://dup.test/a",
            "duplicate-a",
            "2026-11-01T00:00:00+00:00",
            "2026-11-01T00:01:00+00:00",
        )
        live.execute("UPDATE story_duplicates SET rowid=21 WHERE story_id=1")
        live.commit()
    backup_bytes = backup_path.read_bytes()

    with pytest.raises(store.StoreError, match="does not match the current Signal store"):
        store.open_db(tmp_path)

    assert backup_path.read_bytes() == backup_bytes
    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute(
            "SELECT rowid,story_id,duplicate_source_id,link,link_key,published_at,seen_at "
            "FROM story_duplicates WHERE story_id=1"
        ).fetchone() == (
            21,
            1,
            11,
            "https://dup.test/a",
            "duplicate-a",
            "2026-11-01T00:00:00+00:00",
            "2026-11-01T00:01:00+00:00",
        )
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )


def test_admitted_version_two_failure_leaves_a_resumable_version_eight_checkpoint(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    folder = tmp_path / "signal"
    folder.mkdir(parents=True)
    database = folder / "signal.db"
    with closing(sqlite3.connect(database)) as db:
        db.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        db.executescript("".join(store.MIGRATIONS[:2]))
        db.execute("INSERT INTO meta VALUES ('schema_version','2')")
        db.execute("INSERT INTO users(name,role) VALUES ('Mara L','writer')")
        db.commit()

    original_backup = store._backup_before_accounts
    published: list[tuple[bytes, int, int]] = []

    def fail_at_v9(db: sqlite3.Connection) -> None:
        original_backup(db)
        backup = database.with_name("signal.db.before-accounts")
        published.append((backup.read_bytes(), backup.stat().st_dev, backup.stat().st_ino))
        raise OSError("injected v9 backup failure after verified publication")

    monkeypatch.setattr(store, "_backup_before_accounts", fail_at_v9)
    with pytest.raises(OSError, match="injected v9 backup failure after verified publication"):
        store.open_db(tmp_path)

    with closing(sqlite3.connect(database)) as checkpoint:
        version = checkpoint.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
        assert version == ("8",)
        assert checkpoint.execute("SELECT name,role FROM users").fetchall() == [
            ("Mara L", "writer")
        ]
    backup = database.with_name("signal.db.before-accounts")
    assert (backup.read_bytes(), backup.stat().st_dev, backup.stat().st_ino) == published[0]

    monkeypatch.setattr(store, "_backup_before_accounts", original_backup)
    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"
        assert current.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
    assert (backup.read_bytes(), backup.stat().st_dev, backup.stat().st_ino) == published[0]
    with closing(sqlite3.connect(f"file:{backup}?mode=ro", uri=True)) as snapshot:
        assert snapshot.execute("SELECT name,role FROM users").fetchall() == [("Mara L", "writer")]


def test_mismatched_backup_is_preserved_and_v8_store_is_untouched(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    with (
        closing(sqlite3.connect(live_path)) as live,
        closing(sqlite3.connect(backup_path)) as backup,
    ):
        live.backup(backup)
        backup.execute("UPDATE users SET role='writer'")
        backup.commit()
    original = backup_path.read_bytes()

    with pytest.raises(store.StoreError, match="does not match the current Signal store"):
        store.open_db(tmp_path)

    assert backup_path.read_bytes() == original
    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert live.execute("SELECT name,role FROM users").fetchall() == [("Test Owner", "owner")]


def test_wal_mode_backup_is_refused_without_creating_sidecars(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    with (
        closing(sqlite3.connect(live_path)) as live,
        closing(sqlite3.connect(backup_path)) as backup,
    ):
        live.backup(backup)
        assert backup.execute("PRAGMA journal_mode=WAL").fetchone()[0] == "wal"
        assert backup.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()[0] == 0
    for suffix in ("-wal", "-shm"):
        backup_path.with_name(backup_path.name + suffix).unlink(missing_ok=True)
    assert backup_path.read_bytes()[18:20] == b"\x02\x02"

    with pytest.raises(store.StoreError, match="standalone SQLite file"):
        store.open_db(tmp_path)

    assert not backup_path.with_name(backup_path.name + "-wal").exists()
    assert not backup_path.with_name(backup_path.name + "-shm").exists()
    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )


def test_live_database_alias_cannot_serve_as_before_accounts_copy(tmp_path: Path) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    backup_path.hardlink_to(live_path)
    original_identity = (live_path.stat().st_dev, live_path.stat().st_ino)

    with pytest.raises(store.StoreError, match="separate regular file"):
        store.open_db(tmp_path)

    assert (live_path.stat().st_dev, live_path.stat().st_ino) == original_identity
    assert (backup_path.stat().st_dev, backup_path.stat().st_ino) == original_identity
    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )


def test_failed_staged_copy_verification_leaves_v8_and_no_published_backup(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    real_verify = store._verified_snapshot

    def fail_staged(path: Path, live: Path, current: sqlite3.Connection) -> None:
        if path.name.endswith(".tmp"):
            raise store.StoreError("injected staged-copy verification failure")
        real_verify(path, live, current)

    monkeypatch.setattr(store, "_verified_snapshot", fail_staged)
    with pytest.raises(store.StoreError, match="injected staged-copy verification failure"):
        store.open_db(tmp_path)

    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert live.execute("SELECT name,role FROM users").fetchall() == [("Test Owner", "owner")]
    assert not live_path.with_name("signal.db.before-accounts").exists()
    assert list(live_path.parent.glob(".signal.db.before-accounts-*.tmp")) == []


def test_failed_partial_sqlite_backup_copy_leaves_v8_and_no_publication(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    original_copy = store._copy_snapshot

    def fail_after_first_page(source: sqlite3.Connection, destination: sqlite3.Connection) -> None:
        def fail_after_partial(status: int, remaining: int, total: int) -> None:
            assert status == 0
            assert 0 < remaining < total
            raise sqlite3.OperationalError("injected partial backup I/O failure")

        source.backup(destination, pages=1, progress=fail_after_partial)

    monkeypatch.setattr(store, "_copy_snapshot", fail_after_first_page)
    with pytest.raises(sqlite3.OperationalError, match="injected partial backup I/O failure"):
        store.open_db(tmp_path)

    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert live.execute("SELECT name,role FROM users").fetchall() == [("Test Owner", "owner")]
    assert not live_path.with_name("signal.db.before-accounts").exists()
    assert list(live_path.parent.glob(".signal.db.before-accounts-*.tmp")) == []

    monkeypatch.setattr(store, "_copy_snapshot", original_copy)
    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"


def test_unexpected_retained_foreign_key_refuses_user_deletion_without_data_loss(
    tmp_path: Path,
) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    with closing(sqlite3.connect(live_path)) as live:
        live.execute("PRAGMA foreign_keys=ON")
        live.execute("CREATE TABLE retained_user_ref(user_name TEXT REFERENCES users(name))")
        live.execute("INSERT INTO retained_user_ref VALUES ('Test Owner')")
        live.commit()

    with pytest.raises(sqlite3.IntegrityError, match="FOREIGN KEY constraint failed"):
        store.open_db(tmp_path)

    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert live.execute("SELECT name,role FROM users").fetchall() == [("Test Owner", "owner")]
        assert live.execute("SELECT user_name FROM retained_user_ref").fetchall() == [
            ("Test Owner",)
        ]
    backup = live_path.with_name("signal.db.before-accounts")
    with closing(sqlite3.connect(f"file:{backup}?mode=ro", uri=True)) as snapshot:
        assert snapshot.execute("PRAGMA foreign_key_check").fetchall() == []
        assert snapshot.execute("SELECT user_name FROM retained_user_ref").fetchall() == [
            ("Test Owner",)
        ]


def test_directory_sync_failure_keeps_v8_and_verified_copy_for_retry(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _version_eight_store(tmp_path)
    live_path = tmp_path / "signal" / "signal.db"
    backup_path = live_path.with_name("signal.db.before-accounts")
    real_sync = store.platform_io.fsync_directory

    def fail_once(path: Path) -> None:
        monkeypatch.setattr(store.platform_io, "fsync_directory", real_sync)
        raise OSError("injected directory sync failure")

    monkeypatch.setattr(store.platform_io, "fsync_directory", fail_once)
    with pytest.raises(OSError, match="injected directory sync failure"):
        store.open_db(tmp_path)

    with closing(sqlite3.connect(live_path)) as live:
        assert live.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert live.execute("SELECT name,role FROM users").fetchall() == [("Test Owner", "owner")]
    assert backup_path.is_file()
    with closing(sqlite3.connect(f"file:{backup_path}?mode=ro", uri=True)) as backup:
        assert backup.execute("SELECT name,role FROM users").fetchall() == [("Test Owner", "owner")]

    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"
    assert backup_path.is_file()


def test_migration_matches_hand_written_before_and_after_row_counts(tmp_path: Path) -> None:
    _seed_answer_key_store(tmp_path)

    def counts(db: sqlite3.Connection, tables: tuple[str, ...]) -> dict[str, int]:
        return {
            table: int(db.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0])
            for table in tables
        }

    before = {
        "digest_runs": 1,
        "digest_points": 2,
        "digest_issue_ai": 1,
        "digest_issues": 1,
        "digest_topics": 1,
        "digest_groups": 1,
        "digest_issuers": 1,
        "digests": 1,
        "saves": 2,
        "topic_follows": 2,
        "issuer_follows": 2,
        "read_marks": 2,
        "reactions": 2,
        "comments": 2,
        "threads": 2,
        "thread_rules": 1,
        "group_topics": 2,
        "group_members": 3,
        "groups": 2,
        "notification_settings": 2,
        "users": 3,
        "source_checks": 2,
        "story_duplicates": 2,
        "stories": 3,
        "topic_stories": 2,
        "topics": 2,
        "issuers": 2,
        "issuer_stories": 2,
        "story_ai": 1,
        "story_ai_tries": 1,
        "ai_usage": 2,
        "settings": 2,
        "service_settings": 2,
        "market_series": 1,
        "market_posts": 1,
        "sources": 10,
        "source_logos": 5,
    }
    after = {
        **{
            table: 0
            for table in (
                "digest_runs",
                "digest_points",
                "digest_issue_ai",
                "digest_issues",
                "digest_topics",
                "digest_groups",
                "digest_issuers",
                "digests",
                "saves",
                "topic_follows",
                "issuer_follows",
                "read_marks",
                "reactions",
                "comments",
                "threads",
                "thread_rules",
                "group_topics",
                "group_members",
                "groups",
                "notification_settings",
                "users",
            )
        },
        "source_checks": 2,
        "story_duplicates": 2,
        "stories": 3,
        "topic_stories": 2,
        "topics": 2,
        "issuers": 2,
        "issuer_stories": 2,
        "story_ai": 1,
        "story_ai_tries": 1,
        "ai_usage": 2,
        "settings": 2,
        "service_settings": 2,
        "market_series": 1,
        "market_posts": 1,
        "sources": 8,
        "source_logos": 4,
    }

    with closing(store.open_db(tmp_path)) as current:
        assert store.get_meta(current, "schema_version") == "9"
        assert counts(current, tuple(before)) == after
        _assert_retained_fixture_rows(current, original_creators=False)
        assert list(
            map(
                tuple,
                current.execute(
                    "SELECT id,kind,state,proposed_by FROM sources ORDER BY id"
                ).fetchall(),
            )
        ) == [
            (10, "regulator", "approved", "before accounts"),
            (11, "news", "paused", "before accounts"),
            (20, "filing", "proposed", "before accounts"),
            (21, "filing", "approved", "before accounts"),
            (22, "filing", "paused", "before accounts"),
            (30, "market", "proposed", "before accounts"),
            (31, "market", "approved", "before accounts"),
            (32, "market", "paused", "before accounts"),
        ]
        assert list(
            map(
                tuple,
                current.execute(
                    "SELECT source_id, data, media_type, url, fetched_at, note, declared, cleared "
                    "FROM source_logos ORDER BY source_id"
                ).fetchall(),
            )
        ) == [
            (
                10,
                b"logo-ten",
                "image/png",
                "https://logo.test/10",
                "2026-11-01T00:00:00+00:00",
                None,
                None,
                0,
            ),
            (
                11,
                b"logo-eleven",
                "image/png",
                "https://logo.test/11",
                "2026-11-02T00:00:00+00:00",
                None,
                None,
                0,
            ),
            (20, None, None, None, None, None, "https://logo.test/20", 0),
            (
                31,
                b"logo-thirty-one",
                "image/jpeg",
                "https://logo.test/31",
                "2026-11-03T00:00:00+00:00",
                None,
                None,
                0,
            ),
        ]
        assert list(map(tuple, current.execute("SELECT created_by FROM topics ORDER BY id"))) == [
            ("before accounts",),
            ("before accounts",),
        ]
        assert list(map(tuple, current.execute("SELECT created_by FROM issuers ORDER BY id"))) == [
            ("before accounts",),
            ("before accounts",),
        ]
        assert list(
            map(
                tuple,
                current.execute(
                    "SELECT owner,reserved_usd,settled_usd,status FROM ai_usage ORDER BY id"
                ),
            )
        ) == [
            (None, "1.25", "0.75", "settled"),
            ("Test Owner", "0.50", None, "open"),
        ]
        assert current.execute("PRAGMA foreign_key_check").fetchall() == []

    backup = tmp_path / "signal" / "signal.db.before-accounts"
    with closing(sqlite3.connect(f"file:{backup}?mode=ro", uri=True)) as snapshot:
        assert counts(snapshot, tuple(before)) == before
        _assert_retained_fixture_rows(snapshot, original_creators=True)
        assert snapshot.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone() == (
            "8",
        )
        assert snapshot.execute("SELECT name,role FROM users ORDER BY name").fetchall() == [
            ("Test Owner", "owner"),
            ("Test Reader", "reader"),
            ("Test Writer", "writer"),
        ]
        assert snapshot.execute("SELECT created_by FROM topics ORDER BY id").fetchall() == [
            ("Typed Topic One",),
            ("Typed Topic Two",),
        ]
        assert snapshot.execute("SELECT created_by FROM issuers ORDER BY id").fetchall() == [
            ("Typed Issuer One",),
            ("Typed Issuer Two",),
        ]
        assert snapshot.execute("SELECT id,proposed_by FROM sources ORDER BY id").fetchall() == [
            (ident, f"creator-{ident}") for ident in (10, 11, 12, 13, 20, 21, 22, 30, 31, 32)
        ]
        assert snapshot.execute(
            "SELECT source_id,cleared FROM source_logos ORDER BY source_id"
        ).fetchall() == [(10, 0), (11, 0), (12, 1), (20, 0), (31, 0)]
        assert snapshot.execute("PRAGMA foreign_key_check").fetchall() == []
