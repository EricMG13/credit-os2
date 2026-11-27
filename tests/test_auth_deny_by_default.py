"""With sign-in on, no route runs without a session: proved over a path set built from the code.

The path set is read from the sources (every string literal that starts with ``/`` in
``react_frontend`` and the run start service, every module-level route pattern, Signal's route
table), so a route added later is covered without editing this file. Each request is one real HTTP
connection to the application's own localhost server, sent one after another (never more than 1,000
in a test function, no pool). Spies wrap the generated handler's route methods and Signal's
``divert`` and call the originals; without a session none may fire, except for ``GET`` of an open
path. With a valid session the same rows reach their routes. Expected statuses are written by hand,
never computed with ``_app_page``. No network beyond the test's own localhost server.
"""

import ast
import importlib
import json
import os
import pkgutil
import random
import re
import shutil
import socket
import threading
import urllib.parse
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from http.client import HTTPConnection
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, NamedTuple

import pytest
from auth_provider import (
    CLIENT_ID,
    TENANT_ID,
    LoopbackHttpClient,
    LoopbackIdentityProvider,
)
from hypothesis import HealthCheck, Phase, given, settings
from hypothesis import strategies as st

import react_frontend
from deploy_workflow.accounts import sessions, store
from deploy_workflow.accounts.entra import EntraProvider, public_client
from deploy_workflow.run_start import service as run_start_service
from deploy_workflow.signal import service as signal_service
from react_frontend import Server, make_server, signal_host

REPO = Path(__file__).resolve().parent.parent
METHODS = ("GET", "POST", "DELETE", "PUT", "PATCH", "HEAD", "OPTIONS")
DO_METHODS = {
    "do_GET",
    "do_POST",
    "do_DELETE",
    "do_PUT",
    "do_PATCH",
    "do_HEAD",
    "do_OPTIONS",
}
OTHER_METHODS = ("PUT", "PATCH", "HEAD", "OPTIONS")
OPEN_GETS = {"/sign-in", "/auth/me"}  # the answer key: slice 3 adds assets here, on purpose
CONFIGURED_OPEN_ANSWER = frozenset(
    {
        ("GET", "/sign-in"),
        ("GET", "/auth/me"),
        ("GET", "/auth/start"),
        ("GET", "/auth/callback"),
        ("GET", "/symbol.svg"),
        ("GET", "/fonts/Geist-Regular.woff2"),
        ("GET", "/fonts/Geist-SemiBold.woff2"),
        ("POST", "/auth/passcode"),
        ("POST", "/auth/sign-out"),
    }
)
CONFIGURED_DIRECT_STATUSES = {
    ("GET", "/sign-in"): 200,
    ("GET", "/auth/me"): 200,
    ("GET", "/auth/start"): 302,
    ("GET", "/auth/callback"): 400,
    ("GET", "/symbol.svg"): 200,
    ("GET", "/fonts/Geist-Regular.woff2"): 200,
    ("GET", "/fonts/Geist-SemiBold.woff2"): 200,
    ("POST", "/auth/passcode"): 401,
    ("POST", "/auth/sign-out"): 204,
}
CAP = 1000
GATE_BODY = b'{"error": "sign in first"}'
FLOOR = 300
PCHAR_SAFE = "/:@!$&'()*+,;=-._~"
PER_PATTERN = 5
SEED = 20261126
GENERATED = 200

# Hand-written rows (no session): GET of a page is 303, GET of data is 401, each by the key.
PAGES_303 = (
    "/",
    "/index.html",
    "/start",
    "/runs",
    "/coverage",
    "/run/R1",
    "/report/x",
    # the library's redirect paths, written out (not read from the gate): 303 without a session
    "/library",
    "/library/",
    "/library/index.html",
    "/library.html",
)
SIGNAL_PAGES = ("/signal", "/signal/")
DATA_401 = (
    "/connected/reports",
    "/data.js",
    "/symbol.svg",
    "/api/runs/R1",
    "/signal/api/me",
    "/signal/api/status",
    "/assets/x.js",
    "/report/..",
)
FIXED_ODD = (
    "/auth/../x",
    "/sign-in/../connected/reports",
    "/%2e%2e/",
    "//connected/reports",
    "/AUTH/ME",
    "/Sign-In",
    "/auth/me/",
    "/auth/me.json",
    "/sign-in?x=1",
    "/auth%2Fme",
    "/connected%2Freports",
    "/sign-in/",
)


# -- the path set, built from the code ---------------------------------------------------------


def _source_files() -> list[Path]:
    return sorted((REPO / "react_frontend").glob("*.py")) + [
        REPO / "src" / "deploy_workflow" / "run_start" / "service.py"
    ]


def _literal_paths() -> set[str]:
    found: set[str] = set()
    for file in _source_files():
        for node in ast.walk(ast.parse(file.read_text(encoding="utf-8"))):
            if (
                isinstance(node, ast.Constant)
                and isinstance(node.value, str)
                and node.value.startswith("/")
                and node.value.isprintable()
            ):
                found.add(node.value)
    return found


def _modules() -> list[Any]:
    names = [
        info.name
        for info in pkgutil.iter_modules(react_frontend.__path__)
        if info.name != "__main__"
    ]
    mods = [importlib.import_module("react_frontend")]
    mods += [importlib.import_module(f"react_frontend.{name}") for name in names]
    mods.append(run_start_service)
    return mods


def _patterns() -> list[re.Pattern[str]]:
    found: dict[str, re.Pattern[str]] = {}
    for module in _modules():
        for value in vars(module).values():
            if isinstance(value, re.Pattern) and str(value.pattern).startswith("/"):
                found[str(value.pattern)] = value
    for route in signal_service._ROUTES:
        prefixed = re.compile("/signal" + route.pattern.pattern)
        found[prefixed.pattern] = prefixed
    return list(found.values())


def _encode(path: str) -> str:
    return urllib.parse.quote(path, safe=PCHAR_SAFE)


def _drawn(pattern: re.Pattern[str]) -> set[str]:
    """PER_PATTERN paths that fully match `pattern`, drawn deterministically."""
    seen: list[str] = []

    @settings(
        derandomize=True,
        database=None,
        max_examples=PER_PATTERN,
        phases=[Phase.generate],
        suppress_health_check=list(HealthCheck),
        deadline=None,
    )
    @given(st.from_regex(pattern, fullmatch=True))
    def draw(value: str) -> None:
        seen.append(value)

    draw()
    return {_encode(value) for value in seen if value.startswith("/")}


def _generated() -> set[str]:
    rng = random.Random(SEED)
    bases = [
        *OPEN_GETS,
        *PAGES_303,
        *DATA_401,
        *SIGNAL_PAGES,
        "/connected/reports/x",
        "/connected/snapshot",
        "/signal/api/feed",
        "/signal/api/me",
        "/library/downloads/x",
    ]
    mutations: list[Callable[[str], str]] = [
        str.upper,
        str.title,
        lambda p: p + "/",
        lambda p: p + ".json",
        lambda p: p + "%00",
        lambda p: "/" + p,
        lambda p: p[:1] + p[1:].replace("/", "%2f"),
        lambda p: p[:1] + p[1:].replace("/", "%2F", 1),
        lambda p: "/%2e%2e" + p,
        lambda p: "/x/.." + p,
        lambda p: p + "/..",
        lambda p: p.replace("/", "//"),
        lambda p: p + "?x=1",
        lambda p: p + "/%2e%2e/auth/me",
        lambda p: p + "%20",
        lambda p: p.replace("-", "%2d"),
    ]
    made: set[str] = set()
    while len(made) < GENERATED:
        path = rng.choice(bases)
        for _ in range(rng.randint(1, 2)):
            path = rng.choice(mutations)(path)
        if path.startswith("/"):  # a target that is not a path is the server's own 400
            made.add(path)
    return made


def build_paths() -> list[str]:
    paths: set[str] = set()
    paths |= {_encode(literal) for literal in _literal_paths()}
    for pattern in _patterns():
        paths |= _drawn(pattern)
    paths |= _generated() | set(FIXED_ODD)
    paths |= OPEN_GETS | set(PAGES_303) | set(SIGNAL_PAGES) | set(DATA_401)
    return sorted(paths)


def _shards(paths: list[str]) -> list[list[str]]:
    per_shard = CAP // len(METHODS)
    count = -(-len(paths) // per_shard)
    return [paths[i::count] for i in range(count)]


ALL_PATHS = build_paths()
SHARDS = _shards(ALL_PATHS)
CONFIGURED_PATHS = sorted(set(ALL_PATHS) | {path for _, path in CONFIGURED_OPEN_ANSWER})
CONFIGURED_SHARDS = _shards(CONFIGURED_PATHS)


# -- servers -----------------------------------------------------------------------------------


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


def _mint(accounts_dir: Path) -> str:
    db = store.open_db(accounts_dir)
    try:
        account = store.register_reader(
            db,
            tenant_id="t-1",
            object_id="o-1",
            name="A. Kovac",
            email="a.kovac@example.org",
            given_name=None,
            family_name=None,
            now=datetime.now(UTC),
        )
        return sessions.mint_session(db, account.id, now=datetime.now(UTC))
    finally:
        db.close()


class Spies:
    """Records which routes ran; each wrapper calls the original."""

    def __init__(self) -> None:
        self.calls: list[str] = []

    def install(self, server: Server, monkeypatch: pytest.MonkeyPatch) -> None:
        handler = server.RequestHandlerClass
        for name in ("_get", "_post", "_delete"):
            monkeypatch.setattr(handler, name, self._wrap(name, getattr(handler, name)))
        monkeypatch.setattr(signal_host, "divert", self._wrap("divert", signal_host.divert))

    def _wrap(self, name: str, original: Callable[..., Any]) -> Any:
        calls = self.calls

        def spy(*args: Any, **kwargs: Any) -> Any:
            calls.append(name)
            return original(*args, **kwargs)

        return spy


class Client:
    def __init__(self, server: Server, token: str | None, *, host_name: str = "127.0.0.1") -> None:
        self.port = server.server_address[1]
        self.host = f"{host_name}:{self.port}"
        self.token = token
        self.sent = 0

    def send(self, path: str, method: str) -> tuple[int, bytes, dict[str, str]]:
        self.sent += 1
        assert self.sent <= CAP, "more than 1,000 connections in one test function"
        connection = HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            connection.putrequest(method, path, skip_host=True, skip_accept_encoding=True)
            connection.putheader("Host", self.host)
            connection.putheader("Origin", f"http://{self.host}")
            if method != "GET":
                connection.putheader("Content-Length", "0")
            if self.token is not None:
                connection.putheader("Cookie", f"credit_os_session={self.token}")
            connection.endheaders()
            reply = connection.getresponse()
            return reply.status, reply.read(), dict(reply.getheaders())
        finally:
            connection.close()


def _own_path(path: str) -> str:
    """The path the server routes on: the query dropped, and leading slashes collapsed to one
    as ``http.server`` does before routing."""
    target = "/" + path.lstrip("/") if path.startswith("//") else path
    return urllib.parse.urlsplit(target).path


def _under_signal_api(path: str) -> bool:
    own = _own_path(path)
    return own.startswith("/signal/api/") or own == "/signal/api"


# -- the answer key's rows (hand-written) ----------------------------------------------------------


def expected_without_session(path: str, method: str, *, hosted: bool) -> int | None:
    """The status the key fixes for a named row, else None (the row is checked against the set)."""
    if method == "GET":
        if path in PAGES_303:
            return 303
        if path in SIGNAL_PAGES:
            return 303 if hosted else 401
        if path in DATA_401:
            return 401
        return None
    if method in ("POST", "DELETE"):
        return 401
    # PUT, PATCH, HEAD, OPTIONS: the 501 is sent before the gate unless Signal's route table
    # answers them, which only a hosted Signal under /signal/api/ does (the gate comes first there)
    return 401 if hosted and _under_signal_api(path) else 501


def _exercise(
    server: Server,
    token: str | None,
    spies: Spies,
    paths: list[str],
    *,
    hosted: bool,
) -> tuple[Client, list[tuple[str, str, int, list[str], dict[str, str], bytes]]]:
    client = Client(server, token)
    rows = []
    for path in paths:
        for method in METHODS:
            spies.calls.clear()
            status, body, headers = client.send(path, method)
            rows.append((path, method, status, list(spies.calls), headers, body))
    return client, rows


class Places(NamedTuple):
    root: Path
    web: Path
    accounts: Path


@pytest.fixture
def places(root: Path, web: Path, tmp_path: Path) -> Places:
    return Places(root, web, tmp_path / "accounts")


@contextmanager
def application(
    where: Places, *, hosted: bool, monkeypatch: pytest.MonkeyPatch
) -> Iterator[Server]:
    """The live server with sign-in on. `hosted` False is the topology the key also names, Signal
    not hosted (the real application with sign-in always hosts it): ``SignalHost`` builds none, so
    ``make_server`` runs its own code with ``hosted`` None. Nothing else is replaced."""
    if not hosted:
        monkeypatch.setattr(signal_host, "SignalHost", lambda *_args, **_kwargs: None)
    with serving(where.root, where.web, sign_in=True, accounts_dir=where.accounts) as server:
        assert (server.signal is not None) is hosted
        yield server


@contextmanager
def configured_application(
    where: Places, monkeypatch: pytest.MonkeyPatch
) -> Iterator[
    tuple[Server, LoopbackIdentityProvider, LoopbackHttpClient, list[str], list[tuple[str, str]]]
]:
    """Configured live routes with real MSAL and only the strict loopback provider transport."""
    public = REPO / "web" / "public"
    shutil.copyfile(public / "sign-in.html", where.web / "sign-in.html")
    shutil.copyfile(public / "symbol.svg", where.web / "symbol.svg")
    (where.web / "fonts").mkdir()
    for name in ("Geist-Regular.woff2", "Geist-SemiBold.woff2"):
        shutil.copyfile(public / "fonts" / name, where.web / "fonts" / name)

    attempts: list[str] = []
    original_getaddrinfo = socket.getaddrinfo
    original_connect = socket.socket.connect
    permitted = {"127.0.0.1", "::1", "localhost"}

    def guarded_getaddrinfo(host: str | None, *args: Any, **kwargs: Any) -> Any:
        if host not in permitted:
            attempts.append(f"DNS {host!r}")
            raise AssertionError(attempts[-1])
        return original_getaddrinfo(host, *args, **kwargs)

    def guarded_connect(connection: socket.socket, address: Any, *args: Any, **kwargs: Any) -> Any:
        if isinstance(address, tuple) and address and address[0] not in permitted:
            attempts.append(f"connect {address[0]!r}")
            raise AssertionError(attempts[-1])
        return original_connect(connection, address, *args, **kwargs)

    monkeypatch.setattr(socket, "getaddrinfo", guarded_getaddrinfo)
    monkeypatch.setattr(socket.socket, "connect", guarded_connect)

    with LoopbackIdentityProvider(
        signature_modes=["valid"],
        redirect_uri_path="/auth/callback",
        expected_scopes=("offline_access", "openid", "profile"),
        expected_state=None,
    ) as provider:
        transport = LoopbackHttpClient(provider.base_url)
        factory_calls: list[tuple[str, str]] = []

        def provider_factory(client_id: str, authority: str) -> EntraProvider:
            factory_calls.append((client_id, authority))
            test_authority = f"{provider.authority_url}/{TENANT_ID}"
            application = public_client(
                client_id,
                test_authority,
                instance_discovery=False,
                http_client=transport,
            )
            return EntraProvider(application, f"{test_authority}/v2.0")

        try:
            with make_server(
                where.root,
                web=where.web,
                environ={
                    "CREDIT_OS_ENTRA_TENANT": TENANT_ID,
                    "CREDIT_OS_ENTRA_CLIENT": CLIENT_ID,
                },
                accounts_dir=where.accounts,
                provider_factory=provider_factory,
            ) as server:
                thread = threading.Thread(target=server.serve_forever)
                thread.start()
                try:
                    yield server, provider, transport, attempts, factory_calls
                finally:
                    server.shutdown()
                    thread.join()
        finally:
            transport.close()


def test_the_set_of_do_methods_is_the_one_the_key_names(
    root: Path, web: Path, tmp_path: Path
) -> None:
    with serving(root, web, sign_in=True, accounts_dir=tmp_path / "a") as server:
        found = {name for name in dir(server.RequestHandlerClass) if name.startswith("do_")}
    assert found == DO_METHODS
    assert set(METHODS) == {name.removeprefix("do_") for name in DO_METHODS}


def test_the_path_set_is_built_from_the_code() -> None:
    assert len(ALL_PATHS) == len(set(ALL_PATHS))
    for key in ("/auth/me", "/sign-in", "/connected/reports", "/signal/api/me", "/", "/data.js"):
        assert key in ALL_PATHS
    # a literal, a module pattern and a Signal pattern each contribute
    assert any(path.startswith("/api/submissions/") for path in ALL_PATHS)
    assert any(path.startswith("/signal/api/stories/") for path in ALL_PATHS)
    assert any(path.startswith("/run/") for path in ALL_PATHS)
    total = sum(len(shard) * len(METHODS) for shard in SHARDS)
    assert total == len(ALL_PATHS) * len(METHODS)
    for shard in SHARDS:
        assert FLOOR < len(shard) * len(METHODS) <= CAP


@pytest.mark.parametrize("hosted", [True, False], ids=["signal", "no-signal"])
@pytest.mark.parametrize("index", range(len(SHARDS)))
def test_no_route_runs_without_a_session(
    places: Places, monkeypatch: pytest.MonkeyPatch, hosted: bool, index: int
) -> None:
    paths = SHARDS[index]
    with application(places, hosted=hosted, monkeypatch=monkeypatch) as server:
        spies = Spies()
        spies.install(server, monkeypatch)
        client, rows = _exercise(server, None, spies, paths, hosted=hosted)
    assert FLOOR < client.sent <= CAP
    assert client.sent == len(paths) * len(METHODS)
    for path, method, status, calls, headers, _body in rows:
        row = f"{method} {path} -> {status}"
        assert status not in (400, 403), f"never reached the gate: {row}"
        if method == "GET" and _own_path(path) in OPEN_GETS:
            assert calls[:1] == ["_get"], row
            assert status == (200 if _own_path(path) == "/auth/me" else 404), row
            continue
        assert calls == [], f"a route ran without a session: {row} {calls}"
        assert status in {401, 303, 501}, row
        if status == 303:
            assert method == "GET" and headers["Location"] == "/sign-in", row
        wanted = expected_without_session(path, method, hosted=hosted)
        if wanted is not None:
            assert status == wanted, row
    # the named rows were all met (the hand-written key was exercised, not skipped)
    named = [row for row in rows if expected_without_session(row[0], row[1], hosted=hosted)]
    assert len(named) > 0


def _configured_status(method: str, path: str) -> int:
    pair = (method, _own_path(path))
    status = CONFIGURED_DIRECT_STATUSES[pair]
    query = urllib.parse.urlsplit(path).query
    if query and pair in {
        ("GET", "/sign-in"),
        ("GET", "/auth/start"),
        ("POST", "/auth/sign-out"),
    }:
        return 400
    return status


def _configured_open_calls(pair: tuple[str, str]) -> list[str]:
    if pair == ("POST", "/auth/passcode"):
        return []
    if pair[0] == "POST":
        return ["_post"]
    if pair in {
        ("GET", "/auth/me"),
        ("GET", "/symbol.svg"),
        ("GET", "/fonts/Geist-Regular.woff2"),
        ("GET", "/fonts/Geist-SemiBold.woff2"),
    }:
        return ["_get", "divert"]
    return ["_get"]


def _assert_configured_open_row(
    path: str,
    method: str,
    status: int,
    calls: list[str],
    headers: dict[str, str],
) -> bool:
    pair = (method, _own_path(path))
    if pair not in CONFIGURED_OPEN_ANSWER:
        return False
    row = f"{method} {path} -> {status}"
    assert calls == _configured_open_calls(pair), (row, calls)
    expected_status = (
        CONFIGURED_DIRECT_STATUSES[pair] if path == pair[1] else _configured_status(method, path)
    )
    assert status == expected_status, row
    if pair == ("GET", "/auth/start"):
        location = headers.get("Location", "")
        assert location.startswith("https://127.0.0.1:"), (
            "MSAL start did not redirect to its authority"
        )
    return True


def _assert_configured_closed_row(
    path: str,
    method: str,
    status: int,
    calls: list[str],
    headers: dict[str, str],
) -> None:
    row = f"{method} {path} -> {status}"
    assert calls == [], f"a configured route ran for a closed pair: {row} {calls}"
    assert status not in (400, 403), f"request did not reach the auth gate: {row}"
    assert status in {401, 303, 501}, row
    if status == 303:
        assert method == "GET" and headers["Location"] == "/sign-in", row


def _configured_session_pairs(paths: list[str]) -> list[tuple[str, str]]:
    sign_out = [
        (path, "POST")
        for path in paths
        if _own_path(path) == "/auth/sign-out" and not urllib.parse.urlsplit(path).query
    ]
    ordinary = [
        (path, method)
        for path in paths
        for method in METHODS
        if (method != "POST" or _own_path(path) != "/auth/sign-out")
        or urllib.parse.urlsplit(path).query
    ]
    return ordinary + sign_out


def _assert_configured_session_row(
    row_values: tuple[str, str, int, list[str], dict[str, str], bytes],
) -> None:
    path, method, status, calls, headers, body = row_values
    row = f"{method} {path} -> {status} {calls}"
    assert not (status == 303 and headers.get("Location") == "/sign-in"), row
    assert not (status == 401 and body == GATE_BODY), row
    if method == "GET":
        assert calls[:1] == ["_get"], row
    elif method == "POST":
        assert calls[:1] == ["_post"], row
    elif method == "DELETE":
        assert calls[:1] == ["_delete"], row
    elif _under_signal_api(path):
        assert calls == ["divert"], row
    else:
        assert calls == [] and status == 501, row


@pytest.mark.parametrize("index", range(len(CONFIGURED_SHARDS)))
def test_configured_routes_stay_closed_outside_the_literal_pairs(
    places: Places, monkeypatch: pytest.MonkeyPatch, index: int
) -> None:
    paths = CONFIGURED_SHARDS[index]
    assert FLOOR < len(paths) * len(METHODS) <= CAP
    with configured_application(places, monkeypatch) as (
        server,
        provider,
        transport,
        network_attempts,
        factory_calls,
    ):
        spies = Spies()
        spies.install(server, monkeypatch)
        client = Client(server, None, host_name="localhost")
        rows = []
        for path in paths:
            for method in METHODS:
                spies.calls.clear()
                status, body, headers = client.send(path, method)
                rows.append((path, method, status, list(spies.calls), headers, body))

    assert FLOOR < client.sent <= CAP
    assert client.sent == len(paths) * len(METHODS)
    for path, method, status, calls, headers, body in rows:
        is_open = _assert_configured_open_row(path, method, status, calls, headers)
        if not is_open:
            _assert_configured_closed_row(path, method, status, calls, headers)

    if "/auth/start" in paths:
        assert factory_calls == [(CLIENT_ID, f"https://login.microsoftonline.com/{TENANT_ID}")]
    assert len(transport.mapped_requests) == len(factory_calls)
    assert all(url.startswith(provider.authority_url) for url in transport.mapped_requests)
    assert all(
        url.endswith(f"/{TENANT_ID}/v2.0/.well-known/openid-configuration")
        for url in transport.mapped_requests
    )
    assert {event[0] for event in provider.network_events} <= {"discovery"}
    assert all(event[1] == "127.0.0.1" for event in provider.network_events)
    assert network_attempts == []


@pytest.mark.parametrize("index", range(len(CONFIGURED_SHARDS)))
def test_configured_routes_reach_their_handlers_with_a_session(
    places: Places, monkeypatch: pytest.MonkeyPatch, index: int
) -> None:
    paths = CONFIGURED_SHARDS[index]
    pairs = _configured_session_pairs(paths)
    assert FLOOR < len(pairs) <= CAP
    with configured_application(places, monkeypatch) as (
        server,
        provider,
        transport,
        network_attempts,
        factory_calls,
    ):
        token = _mint(places.accounts)
        spies = Spies()
        spies.install(server, monkeypatch)
        client = Client(server, token, host_name="localhost")
        rows = []
        for path, method in pairs:
            spies.calls.clear()
            status, body, headers = client.send(path, method)
            rows.append((path, method, status, list(spies.calls), headers, body))

    assert FLOOR < client.sent <= CAP
    assert client.sent == len(paths) * len(METHODS)
    for path, method, status, calls, headers, body in rows:
        _assert_configured_session_row((path, method, status, calls, headers, body))
    assert len(transport.mapped_requests) == len(factory_calls)
    assert all(url.startswith(provider.authority_url) for url in transport.mapped_requests)
    assert all(event[1] == "127.0.0.1" for event in provider.network_events)
    assert network_attempts == []


@pytest.mark.parametrize("hosted", [True, False], ids=["signal", "no-signal"])
@pytest.mark.parametrize("index", range(len(SHARDS)))
def test_the_same_rows_reach_their_routes_with_a_session(
    places: Places, monkeypatch: pytest.MonkeyPatch, hosted: bool, index: int
) -> None:
    paths = SHARDS[index]
    with application(places, hosted=hosted, monkeypatch=monkeypatch) as server:
        token = _mint(places.accounts)
        spies = Spies()
        spies.install(server, monkeypatch)
        client, rows = _exercise(server, token, spies, paths, hosted=hosted)
    assert FLOOR < client.sent <= CAP
    assert client.sent == len(paths) * len(METHODS)
    fired = 0
    refused = 0
    for path, method, status, calls, headers, body in rows:
        row = f"{method} {path} -> {status} {calls}"
        assert not (status == 303 and headers.get("Location") == "/sign-in"), row
        # 401 with the gate's own body is the gate; Signal's own 401 (a route that needs a name)
        # has another body
        assert not (status == 401 and body == GATE_BODY), row
        if method == "GET":
            assert calls[:1] == ["_get"], row
        elif method == "POST":
            assert calls[:1] == ["_post"], row
        elif method == "DELETE":
            assert calls[:1] == ["_delete"], row
        elif hosted and _under_signal_api(path):
            assert calls == ["divert"], row
        else:
            assert calls == [] and status == 501, row
        fired += bool(calls)
        refused += status == 501
    assert fired == client.sent - refused
    assert refused > 0


def test_every_response_without_a_session_for_a_named_get_is_json_or_a_redirect(
    places: Places, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The refusal's body is the fixed one, so a client can tell the gate from a route's own 401."""
    with application(places, hosted=True, monkeypatch=monkeypatch) as server:
        client = Client(server, None)
        status, body, _ = client.send("/connected/reports", "GET")
        assert (status, json.loads(body)) == (401, {"error": "sign in first"})
        assert body == GATE_BODY  # the exact bytes the with-session rows are checked against
        status, body, _ = client.send("/auth/me", "GET")
        assert (status, json.loads(body)) == (200, {"account": None})
        assert client.send("/sign-in", "GET")[0] == 404
