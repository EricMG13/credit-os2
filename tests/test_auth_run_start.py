"""Signed-in run preparation is limited to Analyst and Admin accounts."""

from __future__ import annotations

import json
from dataclasses import replace
from http.client import HTTPConnection
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import pytest
from auth_provider import LoopbackIdentityProvider
from test_auth_routes import (
    ADMIN_PASSCODE,
    ANALYST_PASSCODE,
    Browser,
    _assert_no_auth_material,
    _flow_key,
    _session_token,
)
from test_run_start_service import answers_for

from deploy_workflow.accounts import store
from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox.scheduler import Scheduler

pytest_plugins = ("test_auth_routes",)
from react_frontend.auth_gate import COOKIE

_APP_ROOTS: list[Path] = []


@pytest.fixture(autouse=True)
def _capture_app_root(monkeypatch):
    import tempfile

    original = tempfile.mkdtemp
    _APP_ROOTS.clear()

    def record_root(*args, **kwargs):
        result = original(*args, **kwargs)
        if kwargs.get("prefix") == "s3root-":
            _APP_ROOTS.append(Path(result))
        return result

    monkeypatch.setattr(tempfile, "mkdtemp", record_root)


@pytest.fixture(autouse=True)
def _local_gpt_seat(monkeypatch):
    original_init = Scheduler.__init__

    def initialize(self, settings, **kwargs):
        catalog = {"gpt-6.1-sol": frozenset({"medium", "high"})}
        original_init(self, replace(settings, copilot_models=catalog), **kwargs)

    monkeypatch.setattr(Scheduler, "__init__", initialize)


def _tree_snapshot(root: Path) -> dict[str, tuple[int, int, int, bytes | None]]:
    entries = [root, *root.rglob("*")]
    snapshot = {}
    for path in entries:
        state = path.stat()
        content = path.read_bytes() if path.is_file() else None
        snapshot[str(path.relative_to(root)) if path != root else "."] = (
            state.st_mode,
            state.st_size,
            state.st_mtime_ns,
            content,
        )
    return snapshot


def _reader_session(
    browser: Browser,
    provider: LoopbackIdentityProvider,
    accounts_dir: Path,
    *,
    name_parts: tuple[str, str] | None = None,
) -> str:
    status, _, headers = browser.request("GET", "/auth/start")
    assert status == 302
    auth_uri = urlsplit(headers["Location"])
    flow = _flow_key(headers)
    state = parse_qs(auth_uri.query, strict_parsing=True)["state"][0]
    provider.expect_flow(
        state=state,
        redirect_uri=f"http://localhost:{browser.port}/auth/callback",
        include_session_state=True,
        name_parts=name_parts if name_parts is not None else (None, None),
    )
    connection = HTTPConnection("127.0.0.1", auth_uri.port, timeout=10)
    try:
        connection.request("GET", f"{auth_uri.path}?{auth_uri.query}")
        response = connection.getresponse()
        assert response.status == 302
        callback = urlsplit(response.getheader("Location"))
    finally:
        connection.close()
    status, _, headers = browser.request(
        "GET",
        f"{callback.path}?{callback.query}",
        cookie=f"credit_os_signin_flow={flow}",
    )
    assert status == 303
    token = _session_token(headers)
    db = store.open_db(accounts_dir)
    try:
        account = store.account_by_id(db, 1)
        assert account is not None and account.profile_type == "reader"
    finally:
        db.close()
    return token


def _signed_json_request(
    browser: Browser, cookie: str, path: str, value: object
) -> tuple[int, dict[str, object]]:
    body = json.dumps(value).encode()
    connection = HTTPConnection("127.0.0.1", browser.port, timeout=10)
    try:
        connection.request(
            "POST",
            path,
            body=body,
            headers={
                "Host": f"localhost:{browser.port}",
                "Origin": f"http://localhost:{browser.port}",
                "Content-Length": str(len(body)),
                "Content-Type": "application/json",
                "X-Shown-Cap": "30",
                "Cookie": cookie,
            },
        )
        response = connection.getresponse()
        return response.status, json.loads(response.read())
    finally:
        connection.close()


def _authorized_submission(browser: Browser, accounts_dir: Path, cookie: str) -> str:
    promoted, body, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=cookie,
        body=json.dumps({"passcode": ANALYST_PASSCODE}).encode(),
    )
    assert promoted == 200 and json.loads(body)["account"]["profile_type"] == "analyst"
    status, body, _ = browser.request("GET", "/connected/context", cookie=cookie)
    assert status == 200
    assert json.loads(body)["run_access"] == {"can_prepare": True, "analyst_name": "Eric G"}
    status, body, _ = browser.request("POST", "/api/submissions", cookie=cookie)
    assert status == 200
    sid = json.loads(body)["id"]
    status, _, _ = browser.request(
        "POST",
        f"/api/submissions/{sid}/files?name=source.txt",
        cookie=cookie,
        body=b"Revenue was 100.",
    )
    assert status == 200
    status, summary = _signed_json_request(
        browser,
        cookie,
        f"/api/submissions/{sid}/summary",
        answers_for(submitted_by="Forged X"),
    )
    assert status == 200 and summary["error"] == ""
    assert summary["submitted_by"] == "Eric G"
    assert summary["copilot_verified"] is True
    status, submitted = _signed_json_request(
        browser,
        cookie,
        f"/api/submissions/{sid}/submit",
        {"answers": answers_for(submitted_by="Forged X"), "digest": summary["digest"]},
    )
    assert status == 200 and submitted["status"] == "queued"
    records = runs.load_all(Layout(_APP_ROOTS[-1]))
    assert len(records) == 1
    assert records[0].account_id == 1 and records[0].submitted_by == "Eric G"
    return sid


def _reader_denials(browser: Browser, cookie: str, sid: str) -> None:
    pairs = (
        ("POST", "/api/submissions"),
        ("POST", f"/api/submissions/{sid}/files?name=source.txt"),
        ("DELETE", f"/api/submissions/{sid}/files?name=source.txt"),
        ("GET", f"/api/submissions/{sid}/reading"),
        ("POST", f"/api/submissions/{sid}/summary"),
        ("POST", f"/api/submissions/{sid}/submit"),
        ("POST", f"/api/submissions/{sid}/carry"),
        ("GET", f"/api/submissions/{sid}/reference-portfolio"),
        ("POST", f"/api/submissions/{sid}/reference-portfolio"),
        ("POST", f"/api/submissions/{sid}/reference-portfolio/files?name=one.csv"),
        ("DELETE", f"/api/submissions/{sid}/reference-portfolio"),
        ("DELETE", f"/api/submissions/{sid}/reference-portfolio/files?name=one.csv"),
    )
    for method, path in pairs:
        status, body, _ = browser.request(method, path, cookie=cookie, body=b"not JSON")
        assert (status, json.loads(body)) == (
            403,
            {"error": "only an Analyst or Admin can prepare or submit a run"},
        ), (method, path)


def test_reader_can_open_start_context_but_all_exact_preparation_pairs_are_denied(
    app, caplog
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level("DEBUG")
    token = _reader_session(browser, provider, accounts_dir, name_parts=("Eric", "Green"))
    cookie = f"{COOKIE}={token}"
    assert browser.request("GET", "/start", cookie=cookie)[0] == 200
    status, body, _ = browser.request("GET", "/connected/context", cookie=cookie)
    assert status == 200
    assert json.loads(body)["run_access"] == {"can_prepare": False, "analyst_name": None}

    _authorized_submission(browser, accounts_dir, cookie)
    status, body, _ = browser.request("POST", "/api/submissions", cookie=cookie)
    assert status == 200
    sid = json.loads(body)["id"]
    assert (
        browser.request(
            "POST",
            f"/api/submissions/{sid}/files?name=source.txt",
            cookie=cookie,
            body=b"Current draft.",
        )[0]
        == 200
    )
    status, summary = _signed_json_request(
        browser, cookie, f"/api/submissions/{sid}/summary", answers_for(submitted_by="Forged X")
    )
    assert status == 200 and summary["submitted_by"] == "Eric G"
    db = store.open_db(accounts_dir)
    try:
        db.execute("UPDATE accounts SET profile_type='reader' WHERE id=1")
        db.commit()
    finally:
        db.close()
    status, body, _ = browser.request("GET", "/connected/context", cookie=cookie)
    assert status == 200
    assert json.loads(body)["run_access"] == {"can_prepare": False, "analyst_name": None}

    root = _APP_ROOTS[-1]
    before = _tree_snapshot(root)
    _reader_denials(browser, cookie, sid)
    assert _tree_snapshot(root) == before
    assert (root / "_engine" / "uploads" / sid / "issued").is_file()
    assert browser.request("GET", f"/api/submissions/{sid}/reading/", cookie=cookie)[0] == 404
    assert browser.request("GET", "/api/reference-portfolios", cookie=cookie)[0] == 200
    _assert_no_auth_material(caplog, provider, accounts_dir, (token, ANALYST_PASSCODE))


def test_underivable_analyst_name_requires_admin_override(app, caplog) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    caplog.set_level("DEBUG")
    token = _reader_session(browser, provider, accounts_dir)
    cookie = f"{COOKIE}={token}"
    status, body, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=cookie,
        body=json.dumps({"passcode": ANALYST_PASSCODE}).encode(),
    )
    assert status == 200 and json.loads(body)["account"]["profile_type"] == "analyst"
    status, body, _ = browser.request("GET", "/connected/context", cookie=cookie)
    assert status == 200
    assert json.loads(body)["run_access"] == {"can_prepare": True, "analyst_name": None}
    status, body, _ = browser.request("POST", "/api/submissions", cookie=cookie)
    assert status == 200
    sid = json.loads(body)["id"]
    assert (
        browser.request(
            "POST",
            f"/api/submissions/{sid}/files?name=source.txt",
            cookie=cookie,
            body=b"Revenue 100.",
        )[0]
        == 200
    )
    answers = answers_for(submitted_by="Fake Z")
    status, result = _signed_json_request(
        browser, cookie, f"/api/submissions/{sid}/summary", answers
    )
    assert status == 400 and result == {"error": "an Admin must set your analyst name"}
    status, result = _signed_json_request(
        browser,
        cookie,
        f"/api/submissions/{sid}/submit",
        {"answers": answers, "digest": "a" * 64},
    )
    assert status == 400 and result == {"error": "an Admin must set your analyst name"}

    status, body, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=cookie,
        body=json.dumps({"passcode": ADMIN_PASSCODE}).encode(),
    )
    assert status == 200 and json.loads(body)["account"]["profile_type"] == "admin"
    status, body, _ = browser.request(
        "POST",
        "/auth/accounts/1/analyst-name",
        cookie=cookie,
        body=json.dumps({"analyst_name": "Eric MG"}).encode(),
    )
    assert status == 200
    status, body, _ = browser.request("GET", "/connected/context", cookie=cookie)
    assert status == 200
    assert json.loads(body)["run_access"] == {"can_prepare": True, "analyst_name": "Eric MG"}
    status, summary = _signed_json_request(
        browser, cookie, f"/api/submissions/{sid}/summary", answers
    )
    assert status == 200 and summary["submitted_by"] == "Eric MG"
    assert summary["copilot_verified"] is True
    status, submitted = _signed_json_request(
        browser,
        cookie,
        f"/api/submissions/{sid}/submit",
        {"answers": answers, "digest": summary["digest"]},
    )
    assert status == 200 and submitted["status"] == "queued"
    record = runs.load_all(Layout(_APP_ROOTS[-1]))[0]
    assert record.account_id == 1 and record.submitted_by == "Eric MG"
    _assert_no_auth_material(
        caplog,
        provider,
        accounts_dir,
        (token, ANALYST_PASSCODE, ADMIN_PASSCODE),
    )


def test_signed_submit_with_no_summary_is_a_400_that_moves_nothing(app) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    token = _reader_session(browser, provider, accounts_dir, name_parts=("Eric", "Green"))
    cookie = f"{COOKIE}={token}"
    status, body, _ = browser.request(
        "POST",
        "/auth/passcode",
        cookie=cookie,
        body=json.dumps({"passcode": ANALYST_PASSCODE}).encode(),
    )
    assert status == 200
    status, body, _ = browser.request("POST", "/api/submissions", cookie=cookie)
    sid = json.loads(body)["id"]
    status, _, _ = browser.request(
        "POST", f"/api/submissions/{sid}/files?name=source.txt", cookie=cookie, body=b"Revenue."
    )
    assert status == 200
    root = _APP_ROOTS[-1]
    before = _tree_snapshot(root)

    status, refused = _signed_json_request(
        browser,
        cookie,
        f"/api/submissions/{sid}/submit",
        {"answers": answers_for(submitted_by="Forged X"), "digest": "none"},
    )
    assert (status, refused) == (
        400,
        {"error": "review the summary again; no summary was issued for this run"},
    )
    assert (root / "_engine" / "uploads" / sid / "files" / "source.txt").is_file()
    assert _tree_snapshot(root) == before
    assert runs.load_all(Layout(root)) == []


def test_a_refused_reader_post_that_declares_a_body_closes_the_connection(app) -> None:
    """Characterisation test, no code change: the server speaks HTTP/1.0 and closes after every
    reply, so a 403 sent before any declared body is read leaves nothing to desynchronise."""
    import socket

    browser, provider, accounts_dir, _, _, _ = app
    token = _reader_session(browser, provider, accounts_dir)
    root = _APP_ROOTS[-1]
    before = _tree_snapshot(root)
    request = (
        "POST /api/submissions HTTP/1.1\r\n"
        f"Host: localhost:{browser.port}\r\n"
        f"Origin: http://localhost:{browser.port}\r\n"
        f"Cookie: {COOKIE}={token}\r\n"
        "Content-Length: 1048576\r\n"
        "\r\n"
    )
    with socket.create_connection(("127.0.0.1", browser.port), timeout=10) as sock:
        sock.sendall(request.encode("ascii"))  # the declared body is never sent
        received = b""
        for _ in range(100):  # bounded; EOF ends it long before
            chunk = sock.recv(65536)
            if not chunk:
                break
            received += chunk
        else:
            pytest.fail("the server did not close the connection")
        assert sock.recv(1) == b""  # still EOF
    head, _, body = received.partition(b"\r\n\r\n")
    assert head.split(b"\r\n")[0].split()[1] == b"403"
    assert json.loads(body) == {"error": "only an Analyst or Admin can prepare or submit a run"}
    assert _tree_snapshot(root) == before
