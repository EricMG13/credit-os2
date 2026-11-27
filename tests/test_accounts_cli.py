"""The accounts command line (answer key: .superpowers/sdd/sign-in/task-C-brief.md)."""

from __future__ import annotations

import getpass
import os
import sqlite3
import subprocess
import sys
import warnings
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.accounts import cli, store
from deploy_workflow.accounts.passcodes import set_passcode

AN = "Kestrel-Quarry-Mollusk"
NEEDS_TERMINAL = "error: a passcode is read only at a terminal prompt; nothing was set\n"
NO_ARGUMENT = (
    "error: a passcode is never taken as an argument; run the command without it and type the"
    " passcode at the prompt\n"
)
NO_FOLDER = "error: name the account store's folder with --accounts-dir or CREDIT_OS_ACCOUNTS_DIR\n"


class Tty:
    def __init__(self, tty: bool) -> None:
        self._tty = tty

    def isatty(self) -> bool:
        return self._tty


class Script:
    """Stands in for the terminal: records prompts, returns queued entries."""

    def __init__(
        self, entries: list[str | BaseException | type[BaseException]], warn: bool = False
    ) -> None:
        self.entries = list(entries)
        self.prompts: list[str] = []
        self.warn = warn

    def __call__(self, prompt: str = "", stream: object = None) -> str:
        self.prompts.append(prompt)
        if self.warn:
            warnings.warn("echoed", getpass.GetPassWarning, stacklevel=2)
        entry = self.entries.pop(0)
        if isinstance(entry, type | BaseException):
            raise entry
        return entry


@pytest.fixture
def d(tmp_path: Path) -> Path:
    return tmp_path / "accounts"


def terminal(monkeypatch: pytest.MonkeyPatch, script: Script, tty: bool = True) -> Script:
    monkeypatch.setattr(getpass, "getpass", script)
    monkeypatch.setattr(sys, "stdin", Tty(tty))
    return script


def passcode_rows(d: Path) -> int:
    db = store.open_db(d)
    try:
        return int(db.execute("SELECT COUNT(*) FROM passcodes").fetchone()[0])
    finally:
        db.close()


def run(d: Path, *args: str) -> int:
    return cli.main(["--accounts-dir", str(d), *args], environ={})


def seed(d: Path) -> None:
    db = store.open_db(d)
    now = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
    for oid, name, email in (
        ("o-1", "A. Kovac", "a.kovac@example.org"),
        ("o-2", "B. Novak", "b.novak@example.org"),
    ):
        store.register_reader(
            db,
            tenant_id="t-1",
            object_id=oid,
            name=name,
            email=email,
            given_name=None,
            family_name=None,
            now=now,
        )
    store.disable_account(db, 2)
    store.set_profile_type(db, 2, "admin")
    db.close()


def test_set_ok(d, monkeypatch, capsys):
    s = terminal(monkeypatch, Script([AN, AN]))
    assert run(d, "passcode", "set", "analyst") == 0
    out = capsys.readouterr()
    assert (out.out, out.err) == ("analyst passcode set\n", "")
    assert s.prompts == ["New analyst passcode: ", "Repeat the analyst passcode: "]
    assert passcode_rows(d) == 1


def test_set_differ(d, monkeypatch, capsys):
    terminal(monkeypatch, Script([AN, "Kestrel-Quarry-Mollusc"]))
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == "error: the two entries differ; nothing was set\n"
    assert passcode_rows(d) == 0


def test_set_short(d, monkeypatch, capsys):
    terminal(monkeypatch, Script(["Kestrel-Qua", "Kestrel-Qua"]))
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == "error: a passcode needs at least 12 characters\n"
    assert passcode_rows(d) == 0


def test_set_admin_same_as_analyst(d, monkeypatch, capsys):
    db = store.open_db(d)
    set_passcode(db, "analyst", passcode=AN, now=datetime(2026, 11, 26, 8, 0, tzinfo=UTC))
    db.close()
    terminal(monkeypatch, Script([AN, AN]))
    assert run(d, "passcode", "set", "admin") == 2
    assert capsys.readouterr().err == "error: the analyst and admin passcodes must differ\n"
    db = store.open_db(d)
    assert (
        db.execute("SELECT COUNT(*) FROM passcodes WHERE profile_type='admin'").fetchone()[0] == 0
    )
    db.close()


def test_passcode_argument_refused(d, monkeypatch, capsys):
    s = terminal(monkeypatch, Script([AN, AN]))
    assert run(d, "passcode", "set", "analyst", AN) == 2
    out = capsys.readouterr()
    assert out.err == NO_ARGUMENT
    assert "Kestrel" not in out.out + out.err
    assert s.prompts == []
    assert passcode_rows(d) == 0


def test_not_a_terminal(d, monkeypatch, capsys):
    s = terminal(monkeypatch, Script([AN, AN]), tty=False)
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == NEEDS_TERMINAL
    assert s.prompts == []
    assert passcode_rows(d) == 0


def test_pipe_subprocess(d):
    result = subprocess.run(
        [sys.executable, "-m", "deploy_workflow.accounts", "passcode", "set", "analyst"],
        input=f"{AN}\n{AN}\n".encode(),
        capture_output=True,
        env={**os.environ, "CREDIT_OS_ACCOUNTS_DIR": str(d)},
        start_new_session=True,
        timeout=60,
        check=False,
    )
    assert result.returncode == 2
    assert b"a passcode is read only at a terminal prompt" in result.stderr
    assert b"Kestrel" not in result.stdout + result.stderr
    assert passcode_rows(d) == 0


def test_getpass_warning(d, monkeypatch, capsys):
    terminal(monkeypatch, Script([AN], warn=True))
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == NEEDS_TERMINAL
    assert passcode_rows(d) == 0


def test_eof(d, monkeypatch, capsys):
    terminal(monkeypatch, Script([EOFError]))
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == "error: no passcode was entered; nothing was set\n"
    assert passcode_rows(d) == 0


def test_folder_resolution(tmp_path, capsys):
    assert cli.main(["accounts", "list"], environ={}) == 2
    assert capsys.readouterr().err == NO_FOLDER
    assert cli.main(["accounts", "list"], environ={"CREDIT_OS_ACCOUNTS_DIR": ""}) == 2
    assert capsys.readouterr().err == NO_FOLDER
    env = {"CREDIT_OS_ACCOUNTS_DIR": str(tmp_path / "e")}
    store.open_db(tmp_path / "e").close()
    assert cli.main(["accounts", "list"], environ=env) == 0
    assert capsys.readouterr().out == "no accounts\n"
    d1, d2 = tmp_path / "d1", tmp_path / "d2"
    store.open_db(d1).close()
    code = cli.main(
        ["--accounts-dir", str(d1), "accounts", "list"],
        environ={"CREDIT_OS_ACCOUNTS_DIR": str(d2)},
    )
    assert code == 0
    assert (d1 / "accounts.db").exists()
    assert not d2.exists()


def test_list(d, capsys):
    seed(d)
    assert run(d, "accounts", "list") == 0
    assert capsys.readouterr().out == (
        "1\tA. Kovac\ta.kovac@example.org\treader\tactive\n"
        "2\tB. Novak\tb.novak@example.org\tadmin\tdisabled\n"
    )


def test_disable(d, capsys):
    seed(d)
    assert run(d, "accounts", "disable", "1") == 0
    assert capsys.readouterr().out == "account 1 disabled\n"
    db = store.open_db(d)
    account = store.account_by_id(db, 1)
    db.close()
    assert account is not None and account.disabled
    assert run(d, "accounts", "disable", "9") == 2
    assert capsys.readouterr().err == "error: no account 9\n"


def test_type(d, capsys):
    seed(d)
    assert run(d, "accounts", "type", "1", "analyst") == 0
    assert capsys.readouterr().out == "account 1 is now analyst\n"
    assert run(d, "accounts", "type", "1", "owner") == 2
    capsys.readouterr()
    assert run(d, "accounts", "type", "9", "admin") == 2
    assert capsys.readouterr().err == "error: no account 9\n"


@pytest.mark.parametrize("bad", ["0", "-1"])
def test_id_must_be_positive(d, bad):
    assert run(d, "accounts", "disable", bad) == 2


def test_no_root_option(d):
    code = cli.main(
        ["--root", str(d), "accounts", "list"], environ={"CREDIT_OS_ACCOUNTS_DIR": str(d)}
    )
    assert code == 2


def test_unusable_store_reported(tmp_path, capsys):
    blocker = tmp_path / "file"
    blocker.write_text("x")
    assert run(blocker / "sub", "accounts", "list") == 2
    err = capsys.readouterr().err
    assert err.startswith(f"error: the account store {blocker / 'sub' / 'accounts.db'} cannot")


def test_sqlite_error_is_reported(d, monkeypatch, capsys):
    def boom(folder: Path) -> sqlite3.Connection:
        raise sqlite3.OperationalError("disk I/O error")

    store.open_db(d).close()
    monkeypatch.setattr(store, "open_db", boom)
    assert run(d, "accounts", "list") == 2
    assert capsys.readouterr().err == (
        f"error: the account store {d / 'accounts.db'} cannot be used: disk I/O error\n"
    )


NOT_UNDERSTOOD = (
    "error: the command was not understood; see python -m deploy_workflow.accounts --help"
)


@pytest.mark.parametrize(
    "tail",
    [
        ["passcode", AN],
        [AN],
        ["accounts", AN],
        ["passcode", "set", AN],
        ["accounts", "type", "1", AN],
        ["accounts", "disable", AN],
        ["accounts", "type", AN, "admin"],
    ],
)
def test_usage_error_never_repeats_input(d, capsys, tail):
    assert run(d, *tail) == 2
    out = capsys.readouterr()
    assert "Kestrel" not in out.out + out.err
    assert out.err.splitlines()[-1] == NOT_UNDERSTOOD


def test_closed_stdin(d, monkeypatch, capsys):
    s = Script([AN, AN])
    monkeypatch.setattr(getpass, "getpass", s)
    monkeypatch.setattr(sys, "stdin", None)
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == NEEDS_TERMINAL
    assert s.prompts == []


def test_empty_flag_refused(tmp_path, monkeypatch, capsys):
    monkeypatch.chdir(tmp_path)
    assert cli.main(["--accounts-dir", "", "accounts", "list"], environ={}) == 2
    assert capsys.readouterr().err == NO_FOLDER
    assert list(tmp_path.iterdir()) == []


RELATIVE = "error: the account store's folder must be an absolute path\n"


def test_relative_folder_refused(tmp_path, monkeypatch, capsys):
    monkeypatch.chdir(tmp_path)
    assert cli.main(["--accounts-dir", "rel", "accounts", "list"], environ={}) == 2
    assert capsys.readouterr().err == RELATIVE
    assert cli.main(["accounts", "list"], environ={"CREDIT_OS_ACCOUNTS_DIR": "rel"}) == 2
    assert capsys.readouterr().err == RELATIVE
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize("where", [0, 1])
def test_undecodable_input(d, monkeypatch, capsys, where):
    bad = UnicodeDecodeError("utf-8", b"\xe9", 0, 1, "invalid continuation byte")
    entries: list = [AN, bad] if where else [bad]
    s = terminal(monkeypatch, Script(entries))
    assert run(d, "passcode", "set", "analyst") == 2
    assert capsys.readouterr().err == (
        "error: the passcode could not be read as text; nothing was set\n"
    )
    assert len(s.prompts) == where + 1
    assert passcode_rows(d) == 0


@pytest.mark.parametrize("flag", ["--acc", "--acc={d}"])
def test_no_abbreviated_options(tmp_path, capsys, flag):
    d = tmp_path / "abbr"
    argv = [flag.format(d=d)] if "=" in flag else [flag, str(d)]
    assert cli.main([*argv, "accounts", "list"], environ={}) == 2
    assert capsys.readouterr().err.splitlines()[-1] == NOT_UNDERSTOOD
    assert not d.exists()


# --- review fixes, 2026-11-27 ------------------------------------------------------------------


def _no_store(folder: Path) -> str:
    return (
        f"error: there is no account store in {folder};"
        " check --accounts-dir or CREDIT_OS_ACCOUNTS_DIR\n"
    )


@pytest.mark.parametrize(
    "tail", [["accounts", "list"], ["accounts", "disable", "1"], ["accounts", "enable", "1"]]
)
def test_account_commands_do_not_create_a_store(tmp_path, capsys, tail):
    folder = tmp_path / "nothing"
    assert run(folder, *tail) == 2
    captured = capsys.readouterr()
    assert captured.err == _no_store(folder)
    assert captured.out == ""
    assert not folder.exists()
    assert run(folder, "accounts", "type", "1", "admin") == 2
    assert capsys.readouterr().err == _no_store(folder)
    assert not folder.exists()


def test_account_command_in_folder_without_db_creates_nothing(d, capsys):
    d.mkdir(mode=0o700)
    assert run(d, "accounts", "list") == 2
    assert capsys.readouterr().err == _no_store(d)
    assert list(d.iterdir()) == []


def test_extra_word_after_accounts_command_is_not_called_a_passcode(d, capsys):
    seed(d)
    assert run(d, "accounts", "disable", "3", "4") == 2
    err = capsys.readouterr().err
    assert "the command was not understood" in err
    assert "never taken as an argument" not in err
    assert err.splitlines()[-1] == NOT_UNDERSTOOD


def test_extra_word_after_passcode_command_still_says_so(d, capsys):
    assert run(d, "passcode", "set", "analyst", "x") == 2
    assert capsys.readouterr().err == NO_ARGUMENT


def test_accounts_dir_after_the_subcommand(d, capsys, monkeypatch):
    seed(d)
    assert cli.main(["accounts", "list", "--accounts-dir", str(d)], environ={}) == 0
    assert capsys.readouterr().out.startswith("1\tA. Kovac")
    terminal(monkeypatch, Script([AN, AN]))
    assert cli.main(["passcode", "set", "analyst", "--accounts-dir", str(d)], environ={}) == 0
    assert passcode_rows(d) == 1


def test_accounts_dir_later_one_wins(tmp_path, capsys):
    good, other = tmp_path / "good", tmp_path / "other"
    seed(good)
    argv = ["--accounts-dir", str(other), "accounts", "list", "--accounts-dir", str(good)]
    assert cli.main(argv, environ={}) == 0
    assert capsys.readouterr().out.startswith("1\tA. Kovac")
    assert not other.exists()
    argv = ["--accounts-dir", str(good), "accounts", "list"]
    assert cli.main(argv, environ={"CREDIT_OS_ACCOUNTS_DIR": str(other)}) == 0
    assert capsys.readouterr().out.startswith("1\tA. Kovac")


def test_enable(d, capsys):
    seed(d)
    assert run(d, "accounts", "enable", "2") == 0
    assert capsys.readouterr().out == "account 2 enabled\n"
    db = store.open_db(d)
    account = store.account_by_id(db, 2)
    db.close()
    assert account is not None and account.disabled is False
    assert run(d, "accounts", "enable", "9") == 2
    assert capsys.readouterr().err == "error: no account 9\n"


# --- parked batch 2026-11-27 -------------------------------------------------------------------


def test_cli_docstring_names_every_command():
    doc = cli.__doc__ or ""
    for command in ("passcode set", "accounts list", "disable", "enable", "type", "analyst-name"):
        assert command in doc


def test_accounts_dir_between_group_and_action(d, capsys):
    seed(d)
    assert cli.main(["accounts", "--accounts-dir", str(d), "list"], environ={}) == 0
    assert "a.kovac@example.org" in capsys.readouterr().out


def test_accounts_dir_between_group_and_action_rightmost_wins(d, tmp_path, capsys):
    seed(d)
    other = tmp_path / "other"
    argv = ["--accounts-dir", str(other), "accounts", "--accounts-dir", str(d), "list"]
    assert cli.main(argv, environ={}) == 0
    assert "a.kovac@example.org" in capsys.readouterr().out
    assert not other.exists()
    argv = ["accounts", "--accounts-dir", str(other), "--accounts-dir", str(d), "list"]
    assert cli.main(argv, environ={}) == 0


def test_passcode_accounts_dir_between_group_and_action(d, capsys):
    assert cli.main(["passcode", "--accounts-dir", str(d), "set", "analyst"], environ={}) == 2
    assert capsys.readouterr().err.strip() == cli._NEEDS_TERMINAL
