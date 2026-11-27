"""Parked sign-in batch, application gate: no store re-made per request, one session cookie
spelling, the start-up checks' order and the shared-folder identity check."""

from __future__ import annotations

import json
import os
from pathlib import Path
from types import SimpleNamespace
from typing import Any, cast

import pytest
from test_auth_gate import INSIDE, _refused, cookie, mint, send
from test_auth_routes import _begin_flow, _callback_request

import react_frontend
from deploy_workflow.accounts import store
from deploy_workflow.run_start import service
from react_frontend import Server, auth_gate

pytest_plugins = ("test_auth_routes", "test_auth_gate")


def _delete_store(accounts_dir: Path) -> None:
    for suffix in ("", "-wal", "-shm"):
        (accounts_dir / f"accounts.db{suffix}").unlink(missing_ok=True)
    assert not (accounts_dir / "accounts.db").exists()


# S2-4: a request never re-makes the account store ---------------------------------------------


def test_a_session_request_with_the_store_gone_is_a_500_and_makes_no_store(
    on: Server, accounts_dir: Path
) -> None:
    token = mint(accounts_dir)
    _delete_store(accounts_dir)
    for path in ("/connected/reports", "/"):
        status, body, _ = send(on, path, cookies=cookie(token))
        assert (status, json.loads(body)) == (500, {"error": "the service failed; see its log"})
        assert not (accounts_dir / "accounts.db").exists()


def test_a_request_with_no_cookie_and_the_store_gone_gets_the_usual_answer(
    on: Server, accounts_dir: Path
) -> None:
    mint(accounts_dir)
    _delete_store(accounts_dir)
    assert send(on, "/connected/reports")[0] == 401
    status, _, headers = send(on, "/")
    assert (status, headers["Location"]) == (303, "/sign-in")
    assert not (accounts_dir / "accounts.db").exists()


def test_the_callback_with_the_store_gone_is_a_500_and_makes_no_store(
    app: tuple[Any, ...],
) -> None:
    browser, provider, accounts_dir, _, _, _ = app
    flow, callback, _ = _begin_flow(browser, provider)
    _delete_store(accounts_dir)
    status, _, _ = _callback_request(browser, flow, callback)
    assert status == 500
    assert not (accounts_dir / "accounts.db").exists()


def test_every_request_opener_passes_create_false(
    on: Server, accounts_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    token = mint(accounts_dir)
    seen: list[dict[str, object]] = []
    original = store.open_db

    def recording(folder: Path, **kwargs: object) -> object:
        seen.append(kwargs)
        return original(folder, **kwargs)  # type: ignore[arg-type]

    monkeypatch.setattr("react_frontend.auth_gate.store.open_db", recording)
    assert send(on, "/auth/me", cookies=cookie(token))[0] == 200
    assert seen == [{"create": False}]


# S2-7: a quoted or escaped cookie is no session ------------------------------------------------


def _escaped(token: str) -> str:
    return f'"\\{ord(token[0]):03o}{token[1:]}"'


def test_a_quoted_or_escaped_session_cookie_is_no_session(on: Server, accounts_dir: Path) -> None:
    token = mint(accounts_dir)
    assert auth_gate.session_token([f"credit_os_session={token}"]) == token
    for spelling in (f'"{token}"', _escaped(token)):
        header = f"credit_os_session={spelling}"
        assert auth_gate.session_token([header]) is None, header
        assert send(on, "/connected/reports", cookies=[header])[0] == 401, header
    assert send(on, "/connected/reports", cookies=cookie(token))[0] == 200


# S2-8, S2-2: the shared-folder identity check ----------------------------------------------------


def test_an_ancestor_that_vanishes_during_the_check_is_skipped(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "shared"
    root.mkdir()
    folder = root / "a" / "b"
    vanished = root / "a"
    vanished.mkdir()
    real = os.path.samefile

    def samefile(first: Any, second: Any) -> bool:
        # A simulation of a concurrent delete: this one ancestor is gone when it is compared.
        if Path(first) == vanished:
            raise FileNotFoundError(str(first))
        return real(first, second)

    monkeypatch.setattr(os.path, "samefile", samefile)
    assert react_frontend._is_inside(folder, root) is True  # root itself is still compared
    assert react_frontend._is_inside(tmp_path / "other" / "x", root) is False


def test_a_missing_shared_folder_stops_the_identity_check(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="sign-in needs the shared folder to exist"):
        react_frontend._is_inside(tmp_path / "gone" / "store", tmp_path / "gone")


@pytest.mark.usefixtures("no_scheduler")
def test_a_case_variant_of_the_shared_folder_is_inside_it_in_simulation(
    web: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # A simulation, so it runs on a case-sensitive filesystem too: the two spellings compare
    # equal as they would on a case-insensitive one, and no path of the variant "exists".
    shared = tmp_path / "CaseRoot"
    shared.mkdir()
    variant = tmp_path / "caseroot"
    real = os.path.samefile
    real_exists = Path.exists

    def samefile(first: Any, second: Any) -> bool:
        if str(first).lower() == str(second).lower():
            return True
        return real(first, second)

    def exists(self: Path, **kwargs: Any) -> bool:
        if str(self).lower().startswith(str(variant).lower()) and self != shared:
            return False
        return real_exists(self, **kwargs)

    monkeypatch.setattr(os.path, "samefile", samefile)
    monkeypatch.setattr(Path, "exists", exists)
    _refused(shared, web, ValueError, INSIDE, sign_in=True, accounts_dir=variant / "acc")


@pytest.mark.usefixtures("no_scheduler")
@pytest.mark.skipif(os.name == "nt", reason="symlinks need a privilege on Windows")
def test_a_folder_spelled_through_a_link_that_leaves_the_shared_folder_is_inside_it(
    web: Path, tmp_path: Path
) -> None:
    shared = tmp_path / "shared"
    shared.mkdir()
    outside = tmp_path / "outside"
    outside.mkdir()
    (shared / "link").symlink_to(outside, target_is_directory=True)
    _refused(shared, web, ValueError, INSIDE, sign_in=True, accounts_dir=shared / "link" / "store")
    assert not (outside / "store").exists()


# S2-1: the start-up checks run in one order ------------------------------------------------------


@pytest.mark.parametrize(
    ("kwargs", "error", "text"),
    [
        (
            {"preview": True, "accounts_dir": None, "root_missing": False},
            ValueError,
            "sign-in is for the live application only",
        ),
        (
            {"preview": False, "accounts_dir": None, "root_missing": True},
            ValueError,
            "sign-in needs the account store's folder",
        ),
        (
            {"preview": False, "accounts_dir": Path("rel"), "root_missing": True},
            store.StoreError,
            store.RELATIVE_FOLDER,
        ),
        (
            {"preview": False, "accounts_dir": "under", "root_missing": True},
            ValueError,
            "sign-in needs the shared folder to exist",
        ),
    ],
)
def test_each_pair_of_failing_start_up_checks_reports_the_first(
    tmp_path: Path, kwargs: dict[str, Any], error: type[Exception], text: str
) -> None:
    root = tmp_path / ("gone" if kwargs["root_missing"] else "here")
    if not kwargs["root_missing"]:
        root.mkdir()
    folder = root / "store" if kwargs["accounts_dir"] == "under" else kwargs["accounts_dir"]
    with pytest.raises(error) as caught:
        react_frontend._accounts_folder(
            root, sign_in=True, accounts_dir=folder, preview=kwargs["preview"]
        )
    assert str(caught.value) == text


# S6-10: one public denial text and role set ------------------------------------------------------


def test_the_denial_and_the_role_set_are_the_services(monkeypatch: pytest.MonkeyPatch) -> None:
    assert service.PREPARATION_DENIAL == "only an Analyst or Admin can prepare or submit a run"
    assert service.PREPARERS == frozenset({"analyst", "admin"})
    monkeypatch.setattr(service, "PREPARERS", frozenset({"admin"}))
    analyst = cast("store.Account", SimpleNamespace(profile_type="analyst"))
    access = react_frontend._run_access(Path("/accounts"), analyst)
    assert access == {"can_prepare": False, "analyst_name": None}
    source = Path(react_frontend.__file__).read_text(encoding="utf-8")
    assert "_PREPARATION_DENIAL" not in source
    assert '{"analyst", "admin"}' not in source
