"""No passcode, hash or salt reaches a log, an output or an exception message (item 16)."""

from __future__ import annotations

import getpass
import logging
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import pytest

from deploy_workflow.accounts import cli, store
from deploy_workflow.accounts.passcodes import set_passcode, try_passcode
from deploy_workflow.accounts.store import StoreError

AN = "Kestrel-Quarry-Mollusk"
AD = "Heron-Basalt-Juniper-7"
WRONG = "Zebra-Quokka-Fjord-000"
DIFFERING = "Kestrel-Quarry-Mollusc"
MIN_SPAN = 5


class Tty:
    def isatty(self) -> bool:
        return True


def _spans(secret: str) -> set[str]:
    return {
        secret[i : i + n]
        for n in range(MIN_SPAN, len(secret) + 1)
        for i in range(len(secret) - n + 1)
    }


def test_no_secret_reaches_any_output(tmp_path, caplog, capsys, monkeypatch):
    caplog.set_level(logging.DEBUG)
    now = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
    raised: list[str] = []
    store_dir = tmp_path / "store"
    db = store.open_db(store_dir)

    for kind, value in (
        ("analyst", AN),
        ("analyst", "Kestrel-Qua"),
        ("analyst", "K" * 1025),
        ("admin", AN),
        ("admin", AD),
    ):
        try:
            set_passcode(db, kind, value, now)
        except StoreError as error:
            raised.append(str(error))
    outcomes = [try_passcode(db, "o-1", WRONG, now) for _ in range(5)]
    assert outcomes == ["wrong passcode"] * 5
    assert try_passcode(db, "o-1", AN, now) == "locked"
    assert try_passcode(db, "o-2", AD, now) == "admin"
    hashes = [bytes(r["hash"]).hex() for r in db.execute("SELECT hash FROM passcodes")]
    salts = [bytes(r["salt"]).hex() for r in db.execute("SELECT salt FROM passcodes")]
    db.close()
    assert len(hashes) == 2

    cli_dir = tmp_path / "cli"
    scripts = [[AN, AN], [AN, DIFFERING]]
    codes: list[int] = []
    monkeypatch.setattr(sys, "stdin", Tty())
    for entries in scripts:
        queue = list(entries)
        monkeypatch.setattr(getpass, "getpass", lambda prompt="", stream=None, q=queue: q.pop(0))
        codes.append(
            cli.main(["--accounts-dir", str(cli_dir), "passcode", "set", "analyst"], environ={})
        )
    monkeypatch.setattr(getpass, "getpass", lambda *a, **k: pytest.fail("prompted"))
    codes.append(
        cli.main(["--accounts-dir", str(cli_dir), "passcode", "set", "analyst", AN], environ={})
    )
    assert codes == [0, 2, 2]
    db = store.open_db(cli_dir)
    hashes += [bytes(r["hash"]).hex() for r in db.execute("SELECT hash FROM passcodes")]
    salts += [bytes(r["salt"]).hex() for r in db.execute("SELECT salt FROM passcodes")]
    db.close()

    sub = subprocess.run(
        [sys.executable, "-m", "deploy_workflow.accounts", "passcode", "set", "analyst"],
        input=f"{AN}\n{AN}\n".encode(),
        capture_output=True,
        env={**os.environ, "CREDIT_OS_ACCOUNTS_DIR": str(Path(tmp_path / "sub"))},
        start_new_session=True,
        timeout=60,
        check=False,
    )
    captured = capsys.readouterr()
    haystack = "\n".join(
        [
            *(r.getMessage() + (r.exc_text or "") for r in caplog.records),
            caplog.text,
            captured.out,
            captured.err,
            *raised,
            sub.stdout.decode(errors="replace"),
            sub.stderr.decode(errors="replace"),
        ]
    )
    assert haystack.strip()
    for secret in (AN, AD, WRONG, DIFFERING):
        for piece in _spans(secret):
            assert piece not in haystack, piece
    for hidden in hashes + salts:
        assert hidden not in haystack
