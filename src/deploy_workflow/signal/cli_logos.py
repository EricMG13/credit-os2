"""The owner's command line for source logos (``logos``).

    signal logos status              per source: has one (from where, when), or why not
    signal logos refresh <source id> fetch that approved source's logo now (a cleared one too)
    signal logos clear <source id>   remove it, and fetch none for it until refreshed
    signal logos off                 deliver none and fetch none, for every source
    signal logos on                  the default

A refused value raises StoreError, which the caller prints as one sentence with exit code 2.
"""

from __future__ import annotations

import argparse
import sqlite3
from datetime import UTC, datetime

from deploy_workflow.signal import cli_clean, fetch, logos


def _fetch(url: str) -> fetch.Fetched:
    return fetch.fetch(url, None, None, limit=logos.MAX_BYTES, accept=logos.ACCEPT)


FETCH: logos.LogoFetch = _fetch  # the refresh's fetch function (tests replace it)
_id = cli_clean.bounded_int()


def add_parsers(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    verbs = commands.add_parser("logos", help="the sources' logos").add_subparsers(
        dest="action", required=True
    )
    verbs.add_parser("status")
    verbs.add_parser("refresh").add_argument("source", type=_id)
    verbs.add_parser("clear").add_argument("source", type=_id)
    verbs.add_parser("off")
    verbs.add_parser("on")


def run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    """One `logos` command."""
    now = datetime.now(UTC)
    if args.action == "status":
        for line in logos.status(db):
            print(line)
    elif args.action == "refresh":
        outcome = logos.refresh(db, args.source, now, FETCH)
        said = "stored" if outcome.ok else "not stored"
        print(f"source {args.source}: logo {said}: {outcome.note}")
    elif args.action == "clear":
        logos.clear(db, args.source)
        print(f"source {args.source}: logo cleared; none is fetched until: signal logos refresh")
    else:
        logos.set_enabled(db, args.action == "on", now)
        print("logos are on" if args.action == "on" else "logos are off: none is fetched or shown")
