"""Admin Signal moderation over the authenticated local application server."""

from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from signal_app import Live

from deploy_workflow.accounts import store as accounts_store
from deploy_workflow.signal import groups, store, threads
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User

ADMIN_PATHS = (
    ("POST", "/api/admin/sources/1/approve", None),
    ("POST", "/api/admin/sources/1/pause", None),
    ("DELETE", "/api/admin/threads/1", None),
    ("DELETE", "/api/admin/comments/2", None),
    ("POST", "/api/admin/groups/1/remove", {"with_threads": True}),
)


def _rows(root: Path, sql: str) -> list[tuple[Any, ...]]:
    db = store.open_db(root)
    try:
        return [tuple(row) for row in db.execute(sql).fetchall()]
    finally:
        db.close()


def _signal_state(root: Path) -> dict[str, list[tuple[Any, ...]]]:
    return {
        table: _rows(root, f"SELECT * FROM {table} ORDER BY 1")
        for table in ("sources", "groups", "threads", "comments", "reactions", "read_marks")
    }


def _admin_account_id(live: Live) -> int:
    assert live.accounts_dir is not None
    db = accounts_store.open_db(live.accounts_dir)
    try:
        row = db.execute("SELECT id FROM accounts WHERE display_name='Admin'").fetchone()
        assert row is not None
        return int(row[0])
    finally:
        db.close()


def _account_state(live: Live, account_id: int) -> list[tuple[Any, ...]]:
    assert live.accounts_dir is not None
    db = accounts_store.open_db(live.accounts_dir)
    try:
        return [
            tuple(row)
            for row in db.execute(
                "SELECT profile_type, disabled FROM accounts WHERE id=?", (account_id,)
            ).fetchall()
        ]
    finally:
        db.close()


def _change_admin_profile(live: Live, *, disabled: bool = False) -> None:
    assert live.accounts_dir is not None
    account_id = _admin_account_id(live)
    db = accounts_store.open_db(live.accounts_dir)
    try:
        if disabled:
            accounts_store.disable_account(db, account_id)
        else:
            accounts_store.set_profile_type(db, account_id, "analyst")
    finally:
        db.close()


def _seed(root: Path) -> None:
    db = store.open_db(root)
    source = store.propose_source(db, "Wire", "news", "https://wire.example/feed", "Admin")
    store.set_source_state(db, source, "proposed")
    now = datetime.now(UTC)
    store.add_story(db, source, Entry("Story about plants", "https://wire.example/1", now, ""), now)
    analyst = User("Analyst", "writer")
    group = groups.create_group(db, analyst, "Desk", "invited")
    groups.add_member(db, analyst, group, "Analyst")
    thread_id, _ = threads.share(db, analyst, group, threads.Item(1, "Private note"), now)
    comment_id = threads.comment(db, analyst, thread_id, "Moderated text", now)
    reply_id = threads.reply(db, analyst, comment_id, "A surviving reply", now)
    threads.react(db, analyst, threads.Reaction(comment_id, "Agree", True), now)
    threads.react(db, analyst, threads.Reaction(reply_id, "Seen", True), now)
    threads.mark_read(db, analyst, thread_id, now)
    db.close()


@pytest.fixture
def app(tmp_path: Path) -> Iterator[tuple[Live, Path, dict[str, str]]]:
    _seed(tmp_path)
    live = Live(tmp_path, signed_in=True)
    cookies = {
        profile: f"credit_os_session={live.create_account_session(profile.title(), profile)[1]}"
        for profile in ("reader", "analyst", "admin")
    }
    try:
        yield live, tmp_path, cookies
    finally:
        live.close()


@pytest.mark.parametrize(("method", "path", "body"), ADMIN_PATHS)
def test_reader_and_analyst_are_refused_every_admin_route_without_mutation(
    app, method: str, path: str, body: dict[str, Any] | None
) -> None:
    live, root, cookies = app
    before = {
        table: _rows(root, f"SELECT * FROM {table} ORDER BY 1")
        for table in ("sources", "groups", "threads", "comments", "reactions", "read_marks")
    }
    for profile in ("reader", "analyst"):
        status, _, reply = live.call(method, path, body=body, cookie=cookies[profile])
        assert (status, reply) == (403, {"error": "only an Admin can do this"})
    assert before == {table: _rows(root, f"SELECT * FROM {table} ORDER BY 1") for table in before}


def test_admin_moderation_reuses_the_existing_domain_operations(app) -> None:
    live, root, cookies = app
    cookie = cookies["admin"]
    status, _, body = live.call("POST", "/api/admin/sources/1/approve", cookie=cookie)
    assert (status, body) == (200, {"id": "1", "state": "approved"})
    assert _rows(root, "SELECT state FROM sources WHERE id=1") == [("approved",)]
    status, _, body = live.call("POST", "/api/admin/sources/1/pause", cookie=cookie)
    assert (status, body) == (200, {"id": "1", "state": "paused"})
    assert _rows(root, "SELECT state FROM sources WHERE id=1") == [("paused",)]

    status, _, body = live.call("DELETE", "/api/admin/comments/2", cookie=cookie)
    assert (status, body) == (200, {"removed": True})
    held_comment = _rows(root, "SELECT body, removed_at FROM comments WHERE id=2")
    assert held_comment[0][0] == "" and held_comment[0][1]
    assert _rows(root, "SELECT body FROM comments WHERE id=3") == [("A surviving reply",)]
    assert _rows(root, "SELECT comment_id, word FROM reactions") == [(3, "Seen")]

    status, _, body = live.call("DELETE", "/api/admin/threads/1", cookie=cookie)
    assert (status, body) == (200, {"removed": True})
    assert _rows(root, "SELECT id FROM threads") == []
    assert _rows(root, "SELECT id FROM comments") == []
    assert _rows(root, "SELECT comment_id FROM reactions") == []
    assert _rows(root, "SELECT thread_id FROM read_marks") == []


def test_group_cascade_requires_explicit_boolean_consent(app) -> None:
    live, root, cookies = app
    for body in ({}, {"with_threads": 1}, {"with_threads": "true"}):
        status, _, reply = live.call(
            "POST", "/api/admin/groups/1/remove", body=body, cookie=cookies["admin"]
        )
        assert status == 400, reply
        assert _rows(root, "SELECT id FROM groups WHERE id=1") == [(1,)]
        assert _rows(root, "SELECT id FROM threads WHERE group_id=1") == [(1,)]
    status, _, reply = live.call(
        "POST",
        "/api/admin/groups/1/remove",
        body={"with_threads": False},
        cookie=cookies["admin"],
    )
    assert status == 409 and "cannot be deleted" in reply["error"]
    assert _rows(root, "SELECT id FROM groups WHERE id=1") == [(1,)]
    assert _rows(root, "SELECT comment_id FROM reactions") == [(2,), (3,)]
    assert _rows(root, "SELECT thread_id FROM read_marks") == [(1,)]
    status, _, body = live.call(
        "POST",
        "/api/admin/groups/1/remove",
        body={"with_threads": True},
        cookie=cookies["admin"],
    )
    assert (status, body) == (200, {"removed": True})
    assert _rows(root, "SELECT id FROM groups WHERE id=1") == []
    assert _rows(root, "SELECT id FROM threads WHERE group_id=1") == []
    assert _rows(root, "SELECT id FROM comments") == []
    assert _rows(root, "SELECT comment_id FROM reactions") == []
    assert _rows(root, "SELECT thread_id FROM read_marks") == []


def test_authenticated_viewer_has_additive_profile_type(app) -> None:
    live, _, cookies = app
    for profile, legacy_role in (("reader", "reader"), ("analyst", "writer"), ("admin", "writer")):
        status, _, body = live.call("GET", "/api/snapshot", cookie=cookies[profile])
        assert status == 200
        viewer = body["scenes"][0]["snapshot"]["viewer"]
        assert viewer["profileType"] == profile
        assert viewer["role"] == legacy_role


def test_admin_route_requires_a_session_and_exact_path(app) -> None:
    live, _, cookies = app
    assert live.call("DELETE", "/api/admin/threads/1")[0] == 401
    assert live.call("DELETE", "/api/admin/threads/1/extra", cookie=cookies["admin"])[0] == 404
    assert live.call("PUT", "/api/admin/threads/1", cookie=cookies["admin"])[0] == 405


@pytest.mark.parametrize(("method", "path", "body"), ADMIN_PATHS)
def test_every_admin_route_requires_a_session_without_changing_signal(
    app, method: str, path: str, body: dict[str, Any] | None
) -> None:
    live, root, _ = app
    before = _signal_state(root)
    status, _, reply = live.call(method, path, body=body)
    assert (status, reply) == (401, {"error": "sign in first"})
    assert _signal_state(root) == before


@pytest.mark.parametrize(("method", "path", "body"), ADMIN_PATHS)
def test_every_admin_route_rechecks_the_same_cookie_after_demotion_and_disable(
    app, method: str, path: str, body: dict[str, Any] | None
) -> None:
    live, root, cookies = app
    cookie = cookies["admin"]
    account_id = _admin_account_id(live)
    assert _account_state(live, account_id) == [("admin", 0)]

    assert live.call(method, path, body=body, cookie=cookie)[0] == 200
    before_demotion = _signal_state(root)
    _change_admin_profile(live)
    status, _, reply = live.call(method, path, body=body, cookie=cookie)
    assert (status, reply) == (403, {"error": "only an Admin can do this"})
    assert _signal_state(root) == before_demotion

    _change_admin_profile(live, disabled=True)
    before_disabled_request = _signal_state(root)
    status, _, reply = live.call(method, path, body=body, cookie=cookie)
    assert (status, reply) == (401, {"error": "sign in first"})
    assert _signal_state(root) == before_disabled_request


def test_admin_can_moderate_known_private_thread_without_receiving_its_content(app) -> None:
    live, _, cookies = app
    status, _, before = live.call("GET", "/api/snapshot", cookie=cookies["admin"])
    assert status == 200 and "Private note" not in repr(before)
    status, _, reply = live.call("DELETE", "/api/admin/threads/1", cookie=cookies["admin"])
    assert (status, reply) == (200, {"removed": True})
    status, _, after = live.call("GET", "/api/snapshot", cookie=cookies["admin"])
    assert status == 200 and "Private note" not in repr(after)
