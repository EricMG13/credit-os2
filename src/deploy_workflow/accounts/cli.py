"""The accounts command line: set a passcode, list accounts, disable one, change its type.

A passcode is read only with `getpass.getpass` at a terminal, never from an argument, an
environment variable or a pipe. Nothing here logs, and no message carries a passcode.
"""

from __future__ import annotations

import argparse
import getpass
import os
import sqlite3
import sys
import warnings
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from pathlib import Path

from deploy_workflow.accounts import passcodes, store

_ENV_FOLDER = "CREDIT_OS_ACCOUNTS_DIR"
_NO_FOLDER = f"error: name the account store's folder with --accounts-dir or {_ENV_FOLDER}"
_NO_ARGUMENT = (
    "error: a passcode is never taken as an argument; run the command without it and type the"
    " passcode at the prompt"
)
_NEEDS_TERMINAL = "error: a passcode is read only at a terminal prompt; nothing was set"
_NO_ENTRY = "error: no passcode was entered; nothing was set"
_DIFFER = "error: the two entries differ; nothing was set"


def _choice(allowed: tuple[str, ...]) -> object:
    # A custom type keeps argparse from echoing a rejected value, which could be a passcode.
    def parse(text: str) -> str:
        if text not in allowed:
            raise argparse.ArgumentTypeError(f"expected one of {', '.join(allowed)}")
        return text

    return parse


def _account_id(text: str) -> int:
    try:
        value = int(text)
    except ValueError:
        raise argparse.ArgumentTypeError("expected a positive whole number") from None
    if value < 1:
        raise argparse.ArgumentTypeError("expected a positive whole number")
    return value


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m deploy_workflow.accounts")
    parser.add_argument("--accounts-dir", type=Path, default=None)
    groups = parser.add_subparsers(dest="group", required=True)
    passcode = groups.add_parser("passcode").add_subparsers(dest="action", required=True)
    set_cmd = passcode.add_parser("set")
    set_cmd.add_argument("type", type=_choice(passcodes.PASSCODE_TYPES))  # type: ignore[arg-type]
    accounts = groups.add_parser("accounts").add_subparsers(dest="action", required=True)
    accounts.add_parser("list")
    accounts.add_parser("disable").add_argument("id", type=_account_id)
    change = accounts.add_parser("type")
    change.add_argument("id", type=_account_id)
    change.add_argument("type", type=_choice(store.PROFILE_TYPES))  # type: ignore[arg-type]
    return parser


def _read_passcode(profile_type: str) -> str | None:
    """Prompt twice at the terminal; print the error and return None if it cannot be done."""
    if not sys.stdin.isatty():
        print(_NEEDS_TERMINAL, file=sys.stderr)
        return None
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", getpass.GetPassWarning)
            first = getpass.getpass(f"New {profile_type} passcode: ")
            second = getpass.getpass(f"Repeat the {profile_type} passcode: ")
    except getpass.GetPassWarning:
        print(_NEEDS_TERMINAL, file=sys.stderr)
        return None
    except EOFError:
        print(_NO_ENTRY, file=sys.stderr)
        return None
    if first != second:
        print(_DIFFER, file=sys.stderr)
        return None
    return first


def _run(db: sqlite3.Connection, args: argparse.Namespace) -> int:
    if args.group == "passcode":
        value = _read_passcode(args.type)
        if value is None:
            return 2
        passcodes.set_passcode(db, args.type, value, datetime.now(UTC))
        print(f"{args.type} passcode set")
    elif args.action == "list":
        accounts = store.list_accounts(db)
        for a in accounts:
            state = "disabled" if a.disabled else "active"
            print(f"{a.id}\t{a.display_name}\t{a.email}\t{a.profile_type}\t{state}")
        if not accounts:
            print("no accounts")
    elif args.action == "disable":
        store.disable_account(db, args.id)
        print(f"account {args.id} disabled")
    else:
        store.set_profile_type(db, args.id, args.type)
        print(f"account {args.id} is now {args.type}")
    return 0


def _folder(given: Path | None, environ: Mapping[str, str]) -> Path | None:
    if given is not None:
        return given
    from_env = environ.get(_ENV_FOLDER)
    return Path(from_env) if from_env else None


def main(argv: Sequence[str] | None = None, environ: Mapping[str, str] | None = None) -> int:
    env = os.environ if environ is None else environ
    try:
        args, extra = _parser().parse_known_args(argv)
    except SystemExit as exit_:
        return int(exit_.code) if isinstance(exit_.code, int) else 2
    if extra:
        print(_NO_ARGUMENT, file=sys.stderr)
        return 2
    folder = _folder(args.accounts_dir, env)
    if folder is None:
        print(_NO_FOLDER, file=sys.stderr)
        return 2
    try:
        db = store.open_db(folder)
        try:
            return _run(db, args)
        finally:
            db.close()
    except store.StoreError as error:
        print(f"error: {error}", file=sys.stderr)
    except (sqlite3.Error, OSError) as error:
        print(
            f"error: the account store {folder / 'accounts.db'} cannot be used: {error}",
            file=sys.stderr,
        )
    return 2
