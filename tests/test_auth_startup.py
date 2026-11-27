"""Startup refuses unsafe Entra configuration and exposes only explicit offline injection."""

from __future__ import annotations

import os
import socket
import sys
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import pytest

import react_frontend
from deploy_workflow.accounts import sessions, store
from deploy_workflow.accounts.entra import EntraProvider
from deploy_workflow.run_start import service
from react_frontend import Server, make_server
from react_frontend import __main__ as cli

TENANT = "00000000-0000-4000-8000-000000000101"
CLIENT = "00000000-0000-4000-8000-000000000103"
TENANT_KEY = "CREDIT_OS_ENTRA_TENANT"
CLIENT_KEY = "CREDIT_OS_ENTRA_CLIENT"
STORE_KEY = "CREDIT_OS_ACCOUNTS_DIR"
TLS_REFUSAL = "Entra sign-in needs a dedicated HTTPS application hostname"
PAIR_REFUSAL = "set both Entra tenant and client IDs"


@pytest.fixture
def web(tmp_path: Path) -> Path:
    folder = tmp_path / "web"
    folder.mkdir()
    (folder / "index.html").write_text(
        '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" '
        "content=\"connect-src 'none'\"></head><body>fixture</body></html>",
        encoding="utf-8",
    )
    return folder


@pytest.fixture
def root() -> Iterator[Path]:
    with TemporaryDirectory(dir=None if os.name == "nt" else "/tmp") as name:
        folder = Path(name) / "shared"
        folder.mkdir()
        yield folder


@contextmanager
def serving(root: Path, web: Path, **options: object) -> Iterator[Server]:
    with make_server(root, web=web, **options) as server:  # type: ignore[arg-type]
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            yield server
        finally:
            server.shutdown()
            thread.join()


def send(server: Server, path: str, *, cookie: str | None = None) -> tuple[int, bytes]:
    from http.client import HTTPConnection

    connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
    try:
        headers = {"Host": f"127.0.0.1:{server.server_address[1]}"}
        if cookie is not None:
            headers["Cookie"] = f"credit_os_session={cookie}"
        connection.request("GET", path, headers=headers)
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def _no_scheduler(monkeypatch: pytest.MonkeyPatch) -> None:
    def fail(*_: object, **__: object) -> None:
        raise AssertionError("Scheduler construction crossed a startup refusal")

    monkeypatch.setattr(react_frontend, "Scheduler", fail)


def _environment(store: Path | None = None) -> dict[str, str]:
    values = {TENANT_KEY: TENANT, CLIENT_KEY: CLIENT}
    if store is not None:
        values[STORE_KEY] = str(store)
    return values


def _forbidden_factory(*_: str) -> EntraProvider:
    raise AssertionError("provider factory was invoked during startup")


@pytest.mark.parametrize("key", [TENANT_KEY, CLIENT_KEY])
def test_partial_live_pair_refuses_before_scheduler_or_store(
    key: str,
    root: Path,
    web: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _no_scheduler(monkeypatch)
    store_dir = tmp_path / "must-not-exist"
    environment = {key: TENANT if key == TENANT_KEY else CLIENT, STORE_KEY: str(store_dir)}
    with (
        pytest.raises(ValueError, match=PAIR_REFUSAL),
        make_server(root, web=web, environ=environment, provider_factory=_forbidden_factory),
    ):
        pass
    assert not store_dir.exists()
    assert not (root / "accounts.db").exists()


def test_configured_cli_refuses_before_preflight_scheduler_store_or_network(
    root: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    store_dir = tmp_path / "must-not-exist"
    monkeypatch.setenv(TENANT_KEY, TENANT)
    monkeypatch.setenv(CLIENT_KEY, CLIENT)
    monkeypatch.setenv(STORE_KEY, str(store_dir))
    monkeypatch.setenv("CREDIT_OS_ENTRA_PROVIDER_FACTORY", "unexpected:factory")
    monkeypatch.setattr(sys, "argv", ["react_frontend", "--root", str(root), "--copilot-preflight"])
    _no_scheduler(monkeypatch)

    def no_preflight() -> dict[str, frozenset[str]]:
        raise AssertionError("preflight ran before configured Entra refusal")

    monkeypatch.setattr(cli, "_seat_models", no_preflight)
    attempts: list[str] = []

    def forbidden_dns(host: object, *_: object, **__: object) -> object:
        attempts.append(f"DNS {host!r}")
        raise AssertionError(attempts[-1])

    def forbidden_connect(
        connection: socket.socket, address: object, *args: object, **kwargs: object
    ) -> None:
        del connection, args, kwargs
        attempts.append(f"connect {address!r}")
        raise AssertionError(attempts[-1])

    monkeypatch.setattr(socket, "getaddrinfo", forbidden_dns)
    monkeypatch.setattr(socket.socket, "connect", forbidden_connect)
    with pytest.raises(SystemExit) as caught:
        cli.main()
    assert caught.value.code == 2
    assert capsys.readouterr().err == f"{TLS_REFUSAL}\n"
    assert attempts == []
    assert not store_dir.exists()
    assert not (root / "accounts.db").exists()


@pytest.mark.parametrize("key", [TENANT_KEY, CLIENT_KEY])
def test_cli_rejects_either_partial_id_before_scheduler_or_store(
    key: str,
    root: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    store_dir = tmp_path / "must-not-exist"
    other_key = CLIENT_KEY if key == TENANT_KEY else TENANT_KEY
    monkeypatch.setenv(key, TENANT if key == TENANT_KEY else CLIENT)
    monkeypatch.delenv(other_key, raising=False)
    monkeypatch.setenv(STORE_KEY, str(store_dir))
    monkeypatch.setattr(sys, "argv", ["react_frontend", "--root", str(root)])
    _no_scheduler(monkeypatch)

    with pytest.raises(SystemExit) as caught:
        cli.main()

    assert caught.value.code == 2
    assert capsys.readouterr().err == f"{PAIR_REFUSAL}\n"
    assert not store_dir.exists()
    assert not (root / "accounts.db").exists()


def test_ordinary_live_make_server_refuses_pair_without_offline_injection(
    root: Path,
    web: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _no_scheduler(monkeypatch)
    store_dir = tmp_path / "must-not-exist"
    with (
        pytest.raises(ValueError, match=TLS_REFUSAL),
        make_server(root, web=web, environ=_environment(store_dir)),
    ):
        pass
    assert not store_dir.exists()
    assert not (root / "accounts.db").exists()


def test_sign_in_off_preserves_routes_and_has_no_store(
    root: Path, web: Path, tmp_path: Path
) -> None:
    store_dir = tmp_path / "ignored-store"
    with serving(root, web, environ={STORE_KEY: str(store_dir)}) as server:
        assert server.auth_config is None
        assert send(server, "/auth/me")[0] == 404
        status, page = send(server, "/")
        assert status == 200
        assert b"credit-os-sign-in" not in page
    assert not store_dir.exists()
    assert not (root / "accounts.db").exists()


def test_normal_live_serve_prints_one_sign_in_off_line(
    root: Path, web: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    def stop_after_start(_scheduler: object) -> None:
        raise KeyboardInterrupt

    monkeypatch.setattr(service, "_loop", stop_after_start)
    with pytest.raises(KeyboardInterrupt):
        react_frontend.serve(root, web=web, environ={})
    captured = capsys.readouterr()
    assert captured.err.splitlines() == ["sign-in is off"]
    assert len(captured.out.splitlines()) == 1
    assert captured.out.startswith("http://127.0.0.1:")


def test_injected_provider_requires_both_ids(
    root: Path, web: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    _no_scheduler(monkeypatch)
    with (
        pytest.raises(ValueError, match=PAIR_REFUSAL),
        make_server(root, web=web, environ={}, provider_factory=_forbidden_factory),
    ):
        pass


def test_explicit_offline_runtime_handoff_uses_env_store_and_does_not_call_factory(
    root: Path, web: Path, tmp_path: Path
) -> None:
    store_dir = tmp_path / "private-store"
    calls: list[tuple[str, str]] = []

    def factory(client_id: str, authority: str) -> EntraProvider:
        calls.append((client_id, authority))
        raise AssertionError("provider factory was invoked during startup")

    with serving(
        root,
        web,
        environ=_environment(store_dir),
        provider_factory=factory,
    ) as server:
        assert server.auth_config is not None
        assert server.auth_config.tenant_id == TENANT
        assert server.auth_config.client_id == CLIENT
        assert server.auth_config.accounts_dir == store_dir.resolve()
        assert server.auth_config.provider_factory is factory
        status, body = send(server, "/auth/me")
        assert (status, body) == (200, b'{"account": null}')
        assert send(server, "/")[0] == 303
        db = store.open_db(store_dir)
        try:
            account = store.register_reader(
                db,
                tenant_id=TENANT,
                object_id="00000000-0000-4000-8000-000000000102",
                name="A. Kovac",
                email="a.kovac@example.org",
                given_name="A.",
                family_name="Kovac",
                now=datetime.now(UTC),
            )
            session = sessions.mint_session(db, account.id, now=datetime.now(UTC))
        finally:
            db.close()
        page_status, page = send(server, "/", cookie=session)
        assert page_status == 200
        assert b'<meta name="credit-os-sign-in" content="on">' in page
        assert calls == []
    assert (store_dir / "accounts.db").is_file()


@pytest.mark.parametrize(
    ("folder", "message"),
    [
        (None, "sign-in needs the account store's folder"),
        (Path("relative-accounts"), "the account store's folder must be an absolute path"),
        ("inside", "the account store's folder must not be inside the shared folder"),
    ],
)
def test_paired_offline_runtime_keeps_existing_account_path_refusals(
    folder: Path | str | None,
    message: str,
    root: Path,
    web: Path,
    tmp_path: Path,
) -> None:
    environment = _environment()
    accounts_dir: Path | None
    if folder == "inside":
        accounts_dir = root / "accounts"
    elif isinstance(folder, Path):
        accounts_dir = folder
    else:
        accounts_dir = None
    with (
        patch.object(
            react_frontend,
            "Scheduler",
            side_effect=AssertionError("Scheduler construction crossed a startup refusal"),
        ),
        pytest.raises(ValueError, match=message),
        make_server(
            root,
            web=web,
            environ=environment,
            accounts_dir=accounts_dir,
            provider_factory=_forbidden_factory,
        ),
    ):
        pass
    assert not (root / "accounts.db").exists()
    assert not (root / "accounts").exists()
    assert not (tmp_path / "accounts.db").exists()


@pytest.mark.parametrize("mode", ["preview", "synthetic"])
def test_non_live_modes_ignore_configured_entra_and_remain_account_free(
    mode: str, root: Path, web: Path, tmp_path: Path
) -> None:
    store_dir = tmp_path / "must-not-exist"
    environment = {TENANT_KEY: TENANT, CLIENT_KEY: CLIENT, STORE_KEY: str(store_dir)}
    options: dict[str, object] = {"environ": environment}
    if mode == "preview":
        options["read_only"] = True
    else:
        options.update(synthetic=True, launcher=("offline-proof",))
    with serving(root, web, **options) as server:
        status, _ = send(server, "/auth/me")
        assert status == 404
        _, page = send(server, "/")
        assert b"credit-os-sign-in" not in page
    assert not store_dir.exists()


def test_cli_has_no_provider_factory_switch(
    root: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.delenv(TENANT_KEY, raising=False)
    monkeypatch.delenv(CLIENT_KEY, raising=False)
    monkeypatch.setattr(
        sys, "argv", ["react_frontend", "--root", str(root), "--provider-factory", "x"]
    )
    with pytest.raises(SystemExit) as caught:
        cli.main()
    assert caught.value.code == 2
    assert "unrecognized arguments: --provider-factory x" in capsys.readouterr().err
