"""The one sign-in check of the application's server, its switch and ``GET /auth/me``.

Each test starts the application's own server on a loopback port over a temporary shared folder
and an account store under pytest's own folder. Sessions are minted with the real ``sessions``
module. Expected statuses and bodies are written by hand, never computed from the code under test.
No network beyond the test's own localhost server; no Microsoft, no model.
"""

import json
import os
import re
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from http.client import HTTPConnection
from http.cookies import SimpleCookie
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest

import react_frontend
from deploy_workflow.accounts import sessions, store
from react_frontend import Server, make_server

FAILED_BODY = {"error": "the service failed; see its log"}
ME = {"account": {"id": 1, "display_name": "A. Kovac", "profile_type": "reader"}}


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


@pytest.fixture
def accounts_dir(tmp_path: Path) -> Path:
    return tmp_path / "accounts-store"


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


@pytest.fixture
def on(root: Path, web: Path, accounts_dir: Path) -> Iterator[Server]:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        yield server


def send(
    server: Server,
    path: str,
    method: str = "GET",
    *,
    cookies: list[str] | None = None,
    host: str | None = None,
) -> tuple[int, bytes, dict[str, str]]:
    own = f"127.0.0.1:{server.server_address[1]}"
    connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
    try:
        connection.putrequest(method, path, skip_host=True, skip_accept_encoding=True)
        connection.putheader("Host", host or own)
        if method != "GET":
            connection.putheader("Origin", f"http://{own}")
            connection.putheader("Content-Length", "0")
        for value in cookies or []:
            connection.putheader("Cookie", value)
        connection.endheaders()
        reply = connection.getresponse()
        return reply.status, reply.read(), dict(reply.getheaders())
    finally:
        connection.close()


def make_account(accounts_dir: Path) -> store.Account:
    db = store.open_db(accounts_dir)
    try:
        return store.register_reader(
            db,
            tenant_id="t-1",
            object_id="o-1",
            name="A. Kovac",
            email="a.kovac@example.org",
            given_name=None,
            family_name=None,
            now=datetime.now(UTC),
        )
    finally:
        db.close()


def mint(accounts_dir: Path, *, now: datetime | None = None) -> str:
    account = make_account(accounts_dir)
    db = store.open_db(accounts_dir)
    try:
        return sessions.mint_session(db, account.id, now=now or datetime.now(UTC))
    finally:
        db.close()


def cookie(token: str) -> list[str]:
    return [f"credit_os_session={token}"]


# 1. no session --------------------------------------------------------------------------------


def test_no_session_refuses_data_and_redirects_pages(on: Server) -> None:
    status, body, _ = send(on, "/connected/reports")
    assert status == 401
    assert json.loads(body) == {"error": "sign in first"}
    assert send(on, "/data.js")[0] == 401
    for path in ("/", "/coverage", "/library", "/library/", "/library/index.html", "/library.html"):
        status, _, headers = send(on, path)
        assert (status, headers["Location"], headers["Cache-Control"]) == (
            303,
            "/sign-in",
            "no-store",
        )
    status, body, _ = send(on, "/auth/me")
    assert (status, json.loads(body)) == (200, {"account": None})
    assert send(on, "/sign-in")[0] == 404
    assert send(on, "/connected/reports", "POST")[0] == 401
    assert send(on, "/connected/reports/x", "DELETE")[0] == 401
    assert send(on, "/auth/me", "POST")[0] == 401
    assert send(on, "/", "HEAD")[0] == 501


def test_no_session_on_the_signal_routes(on: Server) -> None:
    assert send(on, "/signal")[0] == 303
    assert send(on, "/signal/api/me")[0] == 401
    assert send(on, "/signal/api/status")[0] == 401
    assert send(on, "/signal/api/me", "OPTIONS")[0] == 401


# 2. a valid session ---------------------------------------------------------------------------


def test_valid_session_is_served(root: Path, web: Path, accounts_dir: Path) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)
        status, body, _ = send(server, "/auth/me", cookies=cookie(token))
        assert (status, json.loads(body)) == (200, ME)
        with_session = send(server, "/connected/reports", cookies=cookie(token))
        status, page, _ = send(server, "/", cookies=cookie(token))
        assert status == 200
        assert b'<meta name="credit-os-sign-in" content="on">' in page
        status, body, headers = send(server, "/auth/me", "POST", cookies=cookie(token))
        assert (status, headers["Allow"], json.loads(body)) == (
            405,
            "GET",
            {"error": "method not allowed"},
        )
        assert send(server, "/auth/me", "DELETE", cookies=cookie(token))[0] == 405
        status, _, headers = send(server, "/library", cookies=cookie(token))
        assert (status, headers["Location"]) == (308, "/")
    with serving(root, web) as off:  # the same request to a sign-in-off server on the same root
        without_gate = send(off, "/connected/reports")
    assert with_session[:2] == without_gate[:2]
    assert with_session[0] == 200


# 3. each of these is no session ---------------------------------------------------------------


def _assert_signed_out(server: Server, cookies: list[str]) -> None:
    assert send(server, "/connected/reports", cookies=cookies)[0] == 401
    status, body, _ = send(server, "/auth/me", cookies=cookies)
    assert (status, json.loads(body)) == (200, {"account": None})


def test_expired_session_is_no_session(root: Path, web: Path, accounts_dir: Path) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        old = datetime.now(UTC) - timedelta(hours=12, seconds=1)
        _assert_signed_out(server, cookie(mint(accounts_dir, now=old)))


def test_ended_session_is_no_session(root: Path, web: Path, accounts_dir: Path) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)
        db = store.open_db(accounts_dir)
        try:
            sessions.end_session(db, token)
        finally:
            db.close()
        _assert_signed_out(server, cookie(token))


def test_disabled_account_is_no_session(root: Path, web: Path, accounts_dir: Path) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)
        db = store.open_db(accounts_dir)
        try:
            store.disable_account(db, 1)
        finally:
            db.close()
        _assert_signed_out(server, cookie(token))


def test_bad_cookies_are_no_session(root: Path, web: Path, accounts_dir: Path) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)
        assert send(server, "/auth/me", cookies=cookie(token))[0] == 200  # the token is good
        _assert_signed_out(server, ['credit_os_session="unterminated'])
        _assert_signed_out(server, [f"a=1; credit_os_session={token}; credit_os_session={token}"])
        _assert_signed_out(server, [*cookie(token), *cookie(token)])
        _assert_signed_out(server, cookie(token[:42]))
        _assert_signed_out(server, cookie(token + "x"))


# 4. the existing checks run first --------------------------------------------------------------


def test_bad_host_is_refused_before_the_gate(on: Server) -> None:
    assert send(on, "/connected/reports", host="other.test")[0] == 403


# 5. a store failure is a failure, not "no session" ---------------------------------------------


def test_store_failure_is_a_500(
    root: Path, web: Path, accounts_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)

        def boom(*_: object, **__: object) -> None:
            raise store.StoreError("boom")

        monkeypatch.setattr(sessions, "session_account", boom)
        status, body, _ = send(server, "/connected/reports", cookies=cookie(token))
        assert (status, json.loads(body)) == (500, FAILED_BODY)


# 6. switch off ---------------------------------------------------------------------------------


def test_sign_in_off_changes_nothing(root: Path, web: Path) -> None:
    with serving(root, web) as server:
        assert send(server, "/auth/me")[0] == 404
        assert send(server, "/sign-in")[0] == 404
        assert b"credit-os-sign-in" not in send(server, "/")[1]
        assert send(server, "/connected/reports")[0] == 200


def test_sign_in_off_ignores_the_folder(root: Path, web: Path, tmp_path: Path) -> None:
    folder = tmp_path / "never-made"
    with serving(root, web, sign_in=False, accounts_dir=folder) as server:
        assert send(server, "/auth/me")[0] == 404
    assert not folder.exists()


# 7. the switch's refusals ----------------------------------------------------------------------


@pytest.fixture
def no_scheduler(monkeypatch: pytest.MonkeyPatch) -> None:
    def built(*_: object, **__: object) -> None:
        raise AssertionError("a Scheduler was built")

    monkeypatch.setattr(react_frontend, "Scheduler", built)


def _refused(
    root: Path, web: Path, error: type[Exception], text: str | None, **options: object
) -> None:
    with (
        pytest.raises(error) as caught,
        make_server(root, web=web, environ={}, **options),  # type: ignore[arg-type]
    ):
        pass
    if text is not None:
        assert str(caught.value) == text
    assert not (root / "accounts.db").exists()


@pytest.mark.usefixtures("no_scheduler")
def test_switch_refusals(root: Path, web: Path, accounts_dir: Path) -> None:
    live = "sign-in is for the live application only"
    _refused(root, web, ValueError, live, sign_in=True, read_only=True, accounts_dir=accounts_dir)
    _refused(
        root,
        web,
        ValueError,
        live,
        sign_in=True,
        synthetic=True,
        launcher=("x",),
        accounts_dir=accounts_dir,
    )
    _refused(root, web, ValueError, "sign-in needs the account store's folder", sign_in=True)
    inside = "the account store's folder must not be inside the shared folder"
    _refused(root, web, ValueError, inside, sign_in=True, accounts_dir=root / "accounts")
    _refused(root, web, ValueError, inside, sign_in=True, accounts_dir=root)
    assert not (root / "accounts").exists()
    assert not accounts_dir.exists()


@pytest.mark.usefixtures("no_scheduler")
@pytest.mark.skipif(os.name == "nt", reason="POSIX permission bits")
def test_a_group_writable_folder_fails_at_start_up(root: Path, web: Path, tmp_path: Path) -> None:
    folder = tmp_path / "loose"
    folder.mkdir()
    folder.chmod(0o770)
    _refused(root, web, store.StoreError, None, sign_in=True, accounts_dir=folder)
    assert not (folder / "accounts.db").exists()


def test_serve_passes_the_switch_through(
    root: Path, web: Path, accounts_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: dict[str, object] = {}

    @contextmanager
    def fake(*_: object, **options: object) -> Iterator[None]:
        seen.update(options)
        raise ValueError("stop here")
        yield

    monkeypatch.setattr(react_frontend, "make_server", fake)
    with pytest.raises(ValueError, match=re.escape("stop here")):
        react_frontend.serve(root, web=web, sign_in=True, accounts_dir=accounts_dir)
    assert seen["sign_in"] is True
    assert seen["accounts_dir"] == accounts_dir


# fix round 1 -----------------------------------------------------------------------------------


def _two_tokens(accounts_dir: Path) -> tuple[str, str]:
    first = mint(accounts_dir)
    db = store.open_db(accounts_dir)
    try:
        return first, sessions.mint_session(db, 1, now=datetime.now(UTC))
    finally:
        db.close()


def test_every_repeat_of_the_cookie_name_is_no_session(
    root: Path, web: Path, accounts_dir: Path
) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        a, b = _two_tokens(accounts_dir)
        assert a != b
        for header in (
            f"credit_os_session={a} credit_os_session={b}",
            f"credit_os_session={a}\tcredit_os_session={b}",
            f"x=1 credit_os_session={a}; credit_os_session={b}",
            f"foo=credit_os_session; credit_os_session={a}",  # fails closed by design
        ):
            _assert_signed_out(server, [header])
        status, body, _ = send(server, "/auth/me", cookies=[f"a=1; credit_os_session={a}"])
        assert (status, json.loads(body)) == (200, ME)


def test_a_relative_folder_is_refused_first(
    root: Path, web: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, no_scheduler: None
) -> None:
    monkeypatch.chdir(tmp_path)
    _refused(
        root,
        web,
        store.StoreError,
        "the account store's folder must be an absolute path",
        sign_in=True,
        accounts_dir=Path("rel-accounts"),
    )
    assert not (tmp_path / "rel-accounts").exists()


def test_the_sign_in_meta_follows_the_mode_meta(root: Path, web: Path, accounts_dir: Path) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)
        page = send(server, "/", cookies=cookie(token))[1]
    mode = page.index(b'<meta name="credit-os-mode" content="live">')
    sign_in = page.index(b'<meta name="credit-os-sign-in" content="on">')
    assert mode < sign_in


# fix batch F -----------------------------------------------------------------------------------

INSIDE = "the account store's folder must not be inside the shared folder"


def _case_insensitive(folder: Path) -> bool:
    """Probe the filesystem: a file made as ``X`` is visible as ``x``."""
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "CaseProbeX").write_text("", encoding="utf-8")
    return (folder / "caseprobex").exists()


@pytest.mark.usefixtures("no_scheduler")
def test_a_case_variant_of_the_shared_folder_is_inside_it(web: Path, tmp_path: Path) -> None:
    if not _case_insensitive(tmp_path / "probe"):
        pytest.skip("the filesystem is case-sensitive, so a case variant is another folder")
    shared = tmp_path / "CaseRoot"
    shared.mkdir()
    _refused(
        shared, web, ValueError, INSIDE, sign_in=True, accounts_dir=tmp_path / "caseroot" / "acc"
    )
    assert not (tmp_path / "caseroot" / "acc").exists()


@pytest.mark.usefixtures("no_scheduler")
@pytest.mark.skipif(os.name == "nt", reason="symlinks need a privilege on Windows")
def test_a_folder_reached_through_a_link_to_the_shared_folder_is_inside_it(
    web: Path, tmp_path: Path
) -> None:
    shared = tmp_path / "shared"
    shared.mkdir()
    link = tmp_path / "link"
    link.symlink_to(shared, target_is_directory=True)
    _refused(shared, web, ValueError, INSIDE, sign_in=True, accounts_dir=link / "acc")
    assert not (shared / "acc").exists()


@pytest.fixture
def opened(monkeypatch: pytest.MonkeyPatch) -> list[Path]:
    """Every call the gate makes to the store's opener; each wrapper call runs the original."""
    calls: list[Path] = []
    original = store.open_db

    def recording(folder: Path) -> object:
        calls.append(folder)
        return original(folder)

    monkeypatch.setattr("react_frontend.auth_gate.store.open_db", recording)
    return calls


def test_the_store_is_opened_only_for_a_well_formed_value(on: Server, opened: list[Path]) -> None:
    for cookies in (
        None,
        ["credit_os_session=" + "A" * 42],
        ["credit_os_session=" + "A" * 44],
        ["credit_os_session=" + "!" * 43],
        ["credit_os_session=" + "A" * 43, "credit_os_session=" + "B" * 43],
    ):
        assert send(on, "/connected/reports", cookies=cookies)[0] == 401
        assert opened == []
    assert send(on, "/connected/reports", cookies=["credit_os_session=" + "A" * 43])[0] == 401
    assert len(opened) == 1


def test_an_unparseable_cookie_header_is_no_session(
    root: Path, web: Path, accounts_dir: Path
) -> None:
    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        header = f"a=1; $foo=1; credit_os_session={mint(accounts_dir)}"
        status, body, _ = send(server, "/auth/me", cookies=[header])
        assert (status, json.loads(body)) == (200, {"account": None})
        status, body, _ = send(server, "/connected/reports", cookies=[header])
        assert status == 401
        assert json.loads(body) == {"error": "sign in first"}


def test_only_the_header_that_holds_the_name_is_parsed(
    root: Path, web: Path, accounts_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    loads: list[int] = []

    class Recording(SimpleCookie):
        def load(self, rawdata: str) -> None:
            loads.append(1)
            super().load(rawdata)

    with serving(root, web, sign_in=True, accounts_dir=accounts_dir) as server:
        token = mint(accounts_dir)
        monkeypatch.setattr("react_frontend.auth_gate.SimpleCookie", Recording)
        headers = ["x=1"] * 50 + [f"credit_os_session={token}"]
        status, body, _ = send(server, "/auth/me", cookies=headers)
    assert (status, json.loads(body)) == (200, ME)
    assert len(loads) == 1


# fix round 2 (F1) ----------------------------------------------------------------------------


@pytest.mark.usefixtures("no_scheduler")
def test_a_dot_dot_spelling_that_resolves_into_the_shared_folder_is_inside_it(
    web: Path, tmp_path: Path
) -> None:
    if not _case_insensitive(tmp_path / "probe"):
        pytest.skip("the filesystem is case-sensitive, so a case variant is another folder")
    shared = tmp_path / "Shared"
    shared.mkdir()
    _refused(
        shared,
        web,
        ValueError,
        INSIDE,
        sign_in=True,
        accounts_dir=tmp_path / "missing" / ".." / "SHARED" / "acc",
    )
    assert not (shared / "acc").exists()


@pytest.mark.usefixtures("no_scheduler")
def test_a_missing_shared_folder_is_refused_and_nothing_is_created(
    web: Path, tmp_path: Path
) -> None:
    absent = tmp_path / "Absent"
    _refused(
        absent,
        web,
        ValueError,
        "sign-in needs the shared folder to exist",
        sign_in=True,
        accounts_dir=tmp_path / "store",
    )
    assert not absent.exists()
    assert not (tmp_path / "store").exists()
