"""The owner's clean-up of sources and digests, on the command line only (spec 5.2: the owner's
powers are not in the browser).

    signal sources remove <id> [--with-stories]    delete a source; its stories only with the flag
    signal digests list                            every digest: id, owner, schedule, name
    signal digests remove <id>                     delete one digest with its issues and runs
    signal digests remove --owner "<name>"         delete every digest of one person

Also the bounded integer the other commands' arguments use, so no number reaches the store that
SQLite or the clock cannot hold.
"""

from __future__ import annotations

import argparse
import sqlite3
from collections.abc import Callable
from datetime import datetime

from deploy_workflow.signal import digests
from deploy_workflow.signal.identity import clean_name
from deploy_workflow.signal.store import StoreError, remove_source
from deploy_workflow.signal.texts import plural

MAX_ID = 2**63 - 1  # the largest integer SQLite holds


def bounded_int(highest: int = MAX_ID) -> Callable[[str], int]:
    """An argument type: an integer from 1 to `highest`."""

    def parse(text: str) -> int:
        try:
            value = int(text)
        except ValueError:
            value = 0
        if value < 1:
            raise argparse.ArgumentTypeError("must be an integer >= 1")
        if value > highest:
            raise argparse.ArgumentTypeError(f"must be an integer from 1 to {highest:,}")
        return value

    return parse


def add_source_remove(srcs: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    remove = srcs.add_parser("remove", help="delete a source (and, with a flag, its stories)")
    remove.add_argument("id", type=bounded_int())
    remove.add_argument(
        "--with-stories", action="store_true", help="delete its stories and what hangs on them too"
    )


def add_digests(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    verbs = commands.add_parser("digests", help="list or remove digests").add_subparsers(
        dest="action", required=True
    )
    verbs.add_parser("list")
    remove = verbs.add_parser("remove", help="one digest by id, or all of one person's")
    remove.add_argument("id", nargs="?", type=bounded_int())
    remove.add_argument("--owner", help="remove every digest of this person")


def run_source_remove(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    count = remove_source(db, args.id, with_stories=args.with_stories)
    note = f" with {plural(count, 'story', 'stories')}" if args.with_stories else ""
    print(f"source {args.id} removed{note}")


def _list(db: sqlite3.Connection) -> None:
    for row in db.execute("SELECT id, owner, cadence, next_run_at, name FROM digests ORDER BY id"):
        due = datetime.fromisoformat(row["next_run_at"]).strftime("%Y-%m-%d %H:%M")
        print(f"{row['id']}  {row['owner']}  {row['cadence']}  next {due} UTC  {row['name']}")


def _owner_of(db: sqlite3.Connection, digest_id: int) -> str:
    row = db.execute("SELECT owner FROM digests WHERE id=?", (digest_id,)).fetchone()
    if row is None:
        raise StoreError(f"no digest with id {digest_id}")
    return str(row["owner"])


def _remove(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if (args.id is None) == (args.owner is None):
        raise StoreError(
            "name one digest by its id, or one person with --owner, not both or neither"
        )
    if args.id is not None:
        owner = _owner_of(db, args.id)
        digests.delete(db, owner, args.id)
        print(f"digest {args.id} removed (it was {owner}'s)")
        return
    owner = clean_name(args.owner)
    held = digests.list_digests(db, owner)
    if not held:
        raise StoreError(f"{owner} has no digests")
    for one in held:
        digests.delete(db, owner, one.id)
    print(f"{plural(len(held), 'digest', 'digests')} of {owner} removed")


def run_digests(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.action == "list":
        _list(db)
    else:
        _remove(db, args)
