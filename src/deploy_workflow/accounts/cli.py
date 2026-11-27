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
from typing import NoReturn

from deploy_workflow.accounts import passcodes, store

_ENV_FOLDER = "CREDIT_OS_ACCOUNTS_DIR"
_NO_FOLDER = f"error: name the account store's folder with --accounts-dir or {_ENV_FOLDER}"
_NO_ARGUMENT = (
    "error: a passcode is never taken as an argument; run the command without it and type the"
    " passcode at the prompt"
)
_NEEDS_TERMINAL = "error: a passcode is read only at a terminal prompt; nothing was set"
_NO_ENTRY = "error: no passcode was entered; nothing was set"
_NOT_UNDERSTOOD = (
    "error: the command was not understood; see python -m deploy_workflow.accounts --help"
)
_NO_STORE = "error: there is no account store in {folder}; check --accounts-dir"
_NOT_TEXT = "error: the passcode could not be read as text; nothing was set"
_RELATIVE = "error: the account store's folder must be an absolute path"
_DIFFER = "error: the two entries differ; nothing was set"


class _Parser(argparse.ArgumentParser):
    """Sub-parsers use this class too. argparse's own messages quote what was typed, which could
    be a passcode, so a usage error prints the usage line and one fixed sentence instead."""

    def error(self, message: str) -> NoReturn:
        self.print_usage(sys.stderr)
        print(_NOT_UNDERSTOOD, file=sys.stderr)
        raise SystemExit(2)


def _account_id(text: str) -> int:
    try:
        value = int(text)
    except ValueError:
        raise argparse.ArgumentTypeError("expected a positive whole number") from None
    if value < 1:
        raise argparse.ArgumentTypeError("expected a positive whole number")
    return value


def _parser() -> argparse.ArgumentParser:
    parser = _Parser(prog="python -m deploy_workflow.accounts", allow_abbrev=False)
    parser.add_argument("--accounts-dir", default=None)  # text: Path("") would become "."

    def leaf(commands: argparse._SubParsersAction[_Parser], name: str) -> _Parser:
        """A command that also takes --accounts-dir; SUPPRESS keeps the leading value unless the
        later one is given, in which case the later one wins."""
        command = commands.add_parser(name, allow_abbrev=False)
        command.add_argument("--accounts-dir", default=argparse.SUPPRESS)
        return command

    groups = parser.add_subparsers(dest="group", required=True)
    passcode = groups.add_parser("passcode", allow_abbrev=False).add_subparsers(
        dest="action", required=True
    )
    set_cmd = leaf(passcode, "set")
    set_cmd.add_argument("type", choices=passcodes.PASSCODE_TYPES)
    accounts = groups.add_parser("accounts", allow_abbrev=False).add_subparsers(
        dest="action", required=True
    )
    leaf(accounts, "list")
    leaf(accounts, "disable").add_argument("id", type=_account_id)
    leaf(accounts, "enable").add_argument("id", type=_account_id)
    change = leaf(accounts, "type")
    change.add_argument("id", type=_account_id)
    change.add_argument("type", choices=store.PROFILE_TYPES)
    return parser


def _read_passcode(profile_type: str) -> str | None:
    """Prompt twice at the terminal; print the error and return None if it cannot be done."""
    if sys.stdin is None or not sys.stdin.isatty():
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
    except UnicodeDecodeError:  # the message would carry the typed byte, so print a fixed one
        print(_NOT_TEXT, file=sys.stderr)
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
        passcodes.set_passcode(db, args.type, passcode=value, now=datetime.now(UTC))
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
    elif args.action == "enable":
        store.enable_account(db, args.id)
        print(f"account {args.id} enabled")
    else:
        store.set_profile_type(db, args.id, args.type)
        print(f"account {args.id} is now {args.type}")
    return 0


def _folder(given: str | None, environ: Mapping[str, str]) -> Path | None:
    """The folder from the flag, else the environment; None when neither names one."""
    text = given if given is not None else environ.get(_ENV_FOLDER)
    return Path(text) if text else None


def _absent(path: Path) -> bool:
    """True only when the file is plainly missing; any other stat failure is left for open_db to
    report as an unusable store."""
    try:
        path.stat()
    except FileNotFoundError:
        return True
    except OSError:
        return False
    return False


def _usage_error(parser: argparse.ArgumentParser) -> int:
    try:
        parser.error("")
    except SystemExit as exit_:
        return int(exit_.code) if isinstance(exit_.code, int) else 2
    return 2


def _serve(folder: Path, args: argparse.Namespace) -> int:
    database = folder / "accounts.db"
    new_store = _absent(database)
    if args.group == "accounts" and new_store:
        print(_NO_STORE.format(folder=folder), file=sys.stderr)
        return 2
    try:
        db = store.open_db(folder)
        try:
            code = _run(db, args)
        finally:
            db.close()
        return code
    except store.StoreError as error:
        print(f"error: {error}", file=sys.stderr)
    except (sqlite3.Error, OSError) as error:
        print(
            f"error: the account store {folder / 'accounts.db'} cannot be used: {error}",
            file=sys.stderr,
        )
    return 2


def main(argv: Sequence[str] | None = None, environ: Mapping[str, str] | None = None) -> int:
    env = os.environ if environ is None else environ
    try:
        parser = _parser()
        args, extra = parser.parse_known_args(argv)
        if any(item.startswith("-") for item in extra):  # an unknown or abbreviated option
            parser.error("")
    except SystemExit as exit_:
        return int(exit_.code) if isinstance(exit_.code, int) else 2
    if extra:
        if args.group != "passcode":
            return _usage_error(parser)
        print(_NO_ARGUMENT, file=sys.stderr)
        return 2
    folder = _folder(args.accounts_dir, env)
    if folder is None:
        print(_NO_FOLDER, file=sys.stderr)
        return 2
    if not folder.is_absolute():
        print(_RELATIVE, file=sys.stderr)
        return 2
    return _serve(folder, args)
