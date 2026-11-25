"""The command line for issuers, company filings and the market post (the owner's powers stay on
the command line, spec 5.2).

    signal issuers list
    signal issuers add "<name>" [--aliases "a, b"] [--cik <10 digits>] [--library-key <key>]
                       --by <who>
    signal issuers edit <id> [--name ...] [--aliases ...] [--cik ...] [--library-key ...]
                                     (an option given replaces that field; "" takes it off)
    signal issuers remove <id>
    signal filings contact "<organisation> <email>"    the User-Agent the SEC asks for
    signal filings contact --clear
    signal filings status
    signal market propose [--by <who>]                 the market source, with the default series
    signal market hour <0-23>                          the UTC hour the daily post is made from
    signal market post                                 today's post now (an approved source only)
    signal market series list
    signal market series add <FRED id> --title ... --unit ... [--short ...] [--source ...]
    signal market series remove <FRED id>

A refused value raises StoreError, which the caller prints as one sentence with exit code 2.
"""

from __future__ import annotations

import argparse
import sqlite3
from datetime import UTC, datetime

from deploy_workflow.signal import cli_clean, fetch, filings, ingest, issuers, market
from deploy_workflow.signal.store import FILING, sources

FETCH: market.Fetch = fetch.fetch  # the market post's fetch function (tests replace it)


_id = cli_clean.bounded_int()


def add_parsers(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    held = commands.add_parser("issuers", help="the issuer watchlist")
    verbs = held.add_subparsers(dest="action", required=True)
    verbs.add_parser("list")
    add = verbs.add_parser("add")
    add.add_argument("name")
    add.add_argument("--by", required=True)
    edit = verbs.add_parser("edit")
    edit.add_argument("id", type=_id)
    edit.add_argument("--name")
    for one in (add, edit):
        one.add_argument("--aliases", help="comma-separated other names and tickers")
        one.add_argument("--cik", help="the SEC CIK, 10 digits")
        one.add_argument("--library-key", help="the issuer library's key for this issuer")
    verbs.add_parser("remove").add_argument("id", type=_id)
    kept = commands.add_parser("filings", help="company filings from the SEC")
    filing = kept.add_subparsers(dest="action", required=True)
    contact = filing.add_parser("contact")
    contact.add_argument("contact", nargs="?")
    contact.add_argument("--clear", action="store_true")
    filing.add_parser("status")
    _market_parsers(commands)


def _market_parsers(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    verbs = commands.add_parser("market", help="the daily market post").add_subparsers(
        dest="action", required=True
    )
    verbs.add_parser("propose").add_argument("--by", default="owner (command line)")
    verbs.add_parser("hour").add_argument("hour", type=int)
    verbs.add_parser("post")
    series = verbs.add_parser("series").add_subparsers(dest="series_action", required=True)
    series.add_parser("list")
    add = series.add_parser("add")
    add.add_argument("id")
    add.add_argument("--title", required=True)
    add.add_argument("--unit", required=True)
    add.add_argument("--short")
    add.add_argument("--source", default="FRED")
    series.add_parser("remove").add_argument("id")


def _split(text: str | None) -> list[str] | None:
    return None if text is None else [part.strip() for part in text.split(",") if part.strip()]


def _line(one: issuers.Issuer, db: sqlite3.Connection) -> str:
    parts = [str(one.id), one.name]
    if one.cik:
        parts.append(f"CIK {one.cik}")
    if one.library_key:
        parts.append(f"key {one.library_key}")
    if one.aliases:
        parts.append("aliases: " + ", ".join(one.aliases))
    if one.source_id is not None:
        state = db.execute("SELECT state FROM sources WHERE id=?", (one.source_id,)).fetchone()
        parts.append(f"filings: source {one.source_id}, {state['state']}")
    return "  ".join(parts)


def _add(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    form = issuers.Form(args.name, _split(args.aliases) or (), args.cik, args.library_key)
    made = issuers.get(db, issuers.add_issuer(db, form, args.by))
    print(f"issuer {made.id} added: {made.name}")
    if made.source_id is not None:
        print(
            f"its filing source {made.source_id} waits for the owner:"
            f" signal sources approve {made.source_id}"
        )


def _edit(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    old = issuers.get(db, args.id)
    aliases = _split(args.aliases)
    form = issuers.Form(
        old.name if args.name is None else args.name,
        old.aliases if aliases is None else aliases,
        old.cik if args.cik is None else args.cik,
        old.library_key if args.library_key is None else args.library_key,
    )
    issuers.edit_issuer(db, args.id, form, "owner (command line)")
    new = issuers.get(db, args.id)
    said = f"issuer {new.id} changed: {new.name}"
    if old.source_id is not None and old.source_id != new.source_id:
        said += f"; its filing source {old.source_id} is paused"
    if new.source_id is not None and new.source_id != old.source_id:
        said += f"; its filing source {new.source_id} waits for the owner"
    print(said)


def _remove(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    old = issuers.get(db, args.id)
    issuers.remove_issuer(db, args.id)
    paused = "" if old.source_id is None else f"; its filing source {old.source_id} is paused"
    print(f"issuer {args.id} removed{paused}")


def _issuers(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.action == "list":
        for one in issuers.every(db):
            print(_line(one, db))
    elif args.action == "add":
        _add(db, args)
    elif args.action == "edit":
        _edit(db, args)
    else:
        _remove(db, args)


def _status(db: sqlite3.Connection) -> None:
    held = filings.contact(db)
    if held is None:
        print("contact: not set, so no filing source is fetched")
    else:
        print(f"contact: {held} (sent to {filings.SEC_HOST} only)")
    print(
        f"spacing: one filing fetch a second at most, {filings.PER_PASS} a pass,"
        " each source every 10 minutes"
    )
    now = datetime.now(UTC)
    for row in sources(db):
        if row["kind"] != FILING:
            continue
        owner = issuers.of_source(db, row["id"])
        whose = "no issuer" if owner is None else f"issuer {owner.id}, {owner.name}"
        health = ingest.health(db, row["id"], now)
        print(f"{row['id']}  {row['state']}  {health.state}  {row['name']}  ({whose})")


def _filings(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.action == "status":
        _status(db)
        return
    if args.clear:
        filings.set_contact(db, None, datetime.now(UTC))
        print("contact cleared; no filing source is fetched until one is set")
        return
    filings.set_contact(db, args.contact or "", datetime.now(UTC))
    print(f"contact set; it is sent as the User-Agent of filing fetches to {filings.SEC_HOST} only")


def _series(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    now = datetime.now(UTC)
    if args.series_action == "list":
        for one in market.series(db):
            print(f"{one.id}  {one.short}  {one.unit}  {one.title}  ({one.source})")
        return
    if args.series_action == "add":
        short = args.short or args.id.upper()
        market.add_series(
            db, market.Series(args.id, args.title, short, args.unit, args.source), now
        )
        said = f"series {args.id.strip().upper()} added"
    else:
        market.remove_series(db, args.id)
        said = f"series {args.id.strip().upper()} removed"
    print(f"{said}; the market post reads {len(market.series(db))} series")


def _post(db: sqlite3.Connection) -> None:
    outcome = market.post_now(db, datetime.now(UTC), FETCH)
    if outcome.story_id is None:
        print(f"no post: {outcome.reason}")
        return
    title = db.execute("SELECT title FROM stories WHERE id=?", (outcome.story_id,)).fetchone()
    print(f"posted story {outcome.story_id}: {title['title']}")
    missing = [row.series.short for row in market.post_rows(db, outcome.story_id) if row.problem]
    if missing:
        print("series not read: " + ", ".join(missing))


def _market(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.action == "propose":
        made = market.propose(db, args.by)
        count = len(market.series(db))
        print(
            f"market source {made} proposed with {count} series;"
            f" approve it with: signal sources approve {made}"
        )
    elif args.action == "hour":
        market.set_hour(db, args.hour, datetime.now(UTC))
        print(f"the market post is made from {args.hour:02d}:00 UTC")
    elif args.action == "post":
        _post(db)
    else:
        _series(db, args)


def run(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    """One `issuers`, `filings` or `market` command."""
    if args.command == "issuers":
        _issuers(db, args)
    elif args.command == "filings":
        _filings(db, args)
    else:
        _market(db, args)
