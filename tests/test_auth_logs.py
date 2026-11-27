"""No session secret reaches a log, an output, an exception text or a reply.

One run drives the application's own localhost server through signed-in requests, a malformed
cookie, two cookies, an expired, a disabled-account and an ended session, and a store failure during
the lookup. Every logger is captured at DEBUG, with stdout and stderr and every exception's text.
Neither any 8-character piece of a minted token nor the stored ``token_hash`` may appear anywhere,
and no reply body or header carries a token. No network beyond the test's own localhost server.
"""

import logging
import os
import sqlite3
import threading
import traceback
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from http.client import HTTPConnection
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import NamedTuple

import pytest

from deploy_workflow.accounts import sessions, store
from react_frontend import Server, make_server

PIECE = 8


@pytest.fixture
def web(tmp_path: Path) -> Path:
    folder = tmp_path / "web"
    (folder / "assets").mkdir(parents=True)
    (folder / "index.html").write_text(
        '<html><head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'">'
        '<script src="./assets/app.js"></script></head><body></body></html>',
        encoding="utf-8",
    )
    (folder / "assets" / "app.js").write_text("void 0", encoding="utf-8")
    return folder


@pytest.fixture
def root() -> Iterator[Path]:
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp") as name:  # a short path
        yield Path(name)


@contextmanager
def serving(root: Path, web: Path, **options: object) -> Iterator[Server]:
    with make_server(root, web=web, environ={}, **options) as server:  # type: ignore[arg-type]
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            yield server
        finally:
            server.shutdown()
            thread.join()


def send(
    server: Server, path: str, cookies: list[str], method: str = "GET"
) -> tuple[int, bytes, dict[str, str]]:
    own = f"127.0.0.1:{server.server_address[1]}"
    connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=10)
    try:
        connection.putrequest(method, path, skip_host=True, skip_accept_encoding=True)
        connection.putheader("Host", own)
        connection.putheader("Origin", f"http://{own}")
        for value in cookies:
            connection.putheader("Cookie", value)
        connection.endheaders()
        reply = connection.getresponse()
        return reply.status, reply.read(), dict(reply.getheaders())
    finally:
        connection.close()


class Places(NamedTuple):
    root: Path
    web: Path
    accounts: Path


@pytest.fixture
def places(root: Path, web: Path, tmp_path: Path) -> Places:
    return Places(root, web, tmp_path / "accounts")


def _pieces(token: str) -> set[str]:
    return {token[i : i + PIECE] for i in range(len(token) - PIECE + 1)}


def _reader(db: sqlite3.Connection, number: int, name: str) -> store.Account:
    return store.register_reader(
        db,
        tenant_id="t-1",
        object_id=f"o-{number}",
        name=name,
        email=f"reader{number}@example.org",
        given_name=None,
        family_name=None,
        now=datetime.now(UTC),
    )


def _seed(accounts: Path) -> tuple[dict[str, str], list[str]]:
    """Five sessions (good, a second good, expired, ended, a disabled account's), the stored hash of
    each, with the last two states applied after the hashes are read."""
    now = datetime.now(UTC)
    db = store.open_db(accounts)
    try:
        first, second = _reader(db, 1, "A. Kovac"), _reader(db, 2, "B. Novak")
        tokens = {
            "good": sessions.mint_session(db, first.id, now=now),
            "other": sessions.mint_session(db, first.id, now=now),
            "expired": sessions.mint_session(db, first.id, now=now - timedelta(hours=13)),
            "ended": sessions.mint_session(db, first.id, now=now),
            "disabled": sessions.mint_session(db, second.id, now=now),
        }
        hashes = [str(row["token_hash"]) for row in db.execute("SELECT token_hash FROM sessions")]
        sessions.end_session(db, tokens["ended"])
        store.disable_account(db, second.id)
    finally:
        db.close()
    assert len(hashes) == 5
    return tokens, hashes


Go = Callable[[str, list[str], str], int]


def _drive(go: Go, tokens: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    def one(token: str) -> list[str]:
        return [f"credit_os_session={token}"]

    good = tokens["good"]
    for path in ("/", "/auth/me", "/connected/reports", "/signal/api/me", "/signal/api/status"):
        assert go(path, one(good), f"signed in {path}") != 401, path
    assert go("/auth/me", one(good + "x"), "malformed") == 200
    assert go("/connected/reports", one(good + "x"), "malformed") == 401
    assert go("/connected/reports", ['credit_os_session="' + good], "unterminated") == 401
    two = [*one(good), *one(tokens["other"])]
    assert go("/connected/reports", two, "two cookies") == 401
    joined = [f"credit_os_session={good}; credit_os_session={tokens['other']}"]
    assert go("/connected/reports", joined, "two in one header") == 401
    for state in ("expired", "disabled", "ended"):
        assert go("/connected/reports", one(tokens[state]), state) == 401

    def boom(*_: object, **__: object) -> None:
        raise store.StoreError("boom")

    with monkeypatch.context() as patch:
        patch.setattr(sessions, "session_account", boom)
        assert go("/connected/reports", one(good), "store failure") == 500


def test_no_session_secret_reaches_any_output(
    places: Places,
    caplog: pytest.LogCaptureFixture,
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    caplog.set_level(logging.DEBUG)
    seen: list[tuple[str, int, bytes, dict[str, str]]] = []
    raised: list[str] = []

    def go(path: str, cookies: list[str], label: str) -> int:
        try:
            status, body, headers = send(server, path, cookies)
        except OSError as error:  # a refused connection is a failure; its text is checked too
            raised.append("".join(traceback.format_exception(error)))
            raise
        seen.append((label, status, body, headers))
        return status

    with serving(places.root, places.web, sign_in=True, accounts_dir=places.accounts) as server:
        tokens, hashes = _seed(places.accounts)
        _drive(go, tokens, monkeypatch)
    captured = capsys.readouterr()
    failures = [
        record
        for record in caplog.records
        if record.levelno >= logging.ERROR and record.exc_info and record.exc_info[1] is not None
    ]
    # the capture works: the store failure was logged with its exception, once
    assert len(failures) == 1
    assert "GET /connected/reports" in failures[0].getMessage()
    assert isinstance(failures[0].exc_info[1], store.StoreError)  # type: ignore[index]
    assert "boom" in caplog.text
    haystack = "\n".join(
        [
            *(record.getMessage() + (record.exc_text or "") for record in caplog.records),
            *(
                "".join(traceback.format_exception(*record.exc_info))
                for record in caplog.records
                if record.exc_info
            ),
            caplog.text,
            captured.out,
            captured.err,
            *raised,
        ]
    )
    assert haystack.strip()
    replies = "\n".join(
        body.decode("utf-8", "replace") + "\n".join(f"{k}: {v}" for k, v in headers.items())
        for _, _, body, headers in seen
    )
    for token in tokens.values():
        for piece in _pieces(token):
            assert piece not in haystack, "a token piece reached a log or output"
            assert piece not in replies, "a token piece reached a reply"
    for hidden in hashes:
        assert hidden not in haystack
        assert hidden not in replies
    assert len(seen) == 14
