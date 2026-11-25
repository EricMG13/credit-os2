"""Command line for Signal users, sources, ingest passes and stories, the owner's moderation and
clean-up of groups, threads and comments (which have no browser route), of sources and digests
(``cli_clean``), the owner's AI commands (``cli_ai``), the issuers, filings and market post
(``cli_issuers``) and the sources' logos (``cli_logos``)."""

from __future__ import annotations

import argparse
import sqlite3
import sys
import time
from collections.abc import Callable, Sequence
from datetime import UTC, datetime, timedelta
from pathlib import Path

from deploy_workflow.signal import (
    ai_run,
    cli_ai,
    cli_clean,
    cli_issuers,
    cli_logos,
    groups,
    threads,
)
from deploy_workflow.signal.fetch import FetchRefused, check_address
from deploy_workflow.signal.groups import GroupError
from deploy_workflow.signal.identity import IdentityError, clean_name
from deploy_workflow.signal.ingest import health, run_due
from deploy_workflow.signal.store import (
    KINDS,
    ROLES,
    StoreError,
    add_user,
    open_db,
    propose_source,
    set_source_state,
    sources,
)
from deploy_workflow.signal.texts import plural
from deploy_workflow.signal.topics import add_topic, list_topics

LOOP_SECONDS = 60
MAX_DAYS = 36500  # the longest age `groups prune` takes (a hundred years)
_positive_int = cli_clean.bounded_int()
_STORIES_SQL = """
SELECT s.id, s.title, s.published_at, src.name AS source_name,
       (SELECT COUNT(DISTINCT d.duplicate_source_id) FROM story_duplicates d
        WHERE d.story_id = s.id) AS folded
FROM stories s JOIN sources src ON src.id = s.source_id
ORDER BY s.published_at DESC, s.id DESC
LIMIT ?
"""


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m deploy_workflow.signal")
    parser.add_argument("--root", type=Path, required=True, help="folder holding signal/")
    commands = parser.add_subparsers(dest="command", required=True)

    users = commands.add_parser("users").add_subparsers(dest="action", required=True)
    add = users.add_parser("add")
    add.add_argument("name")
    add.add_argument("--role", choices=ROLES, required=True)

    srcs = commands.add_parser("sources").add_subparsers(dest="action", required=True)
    propose = srcs.add_parser("propose")
    propose.add_argument("name")
    propose.add_argument("--kind", choices=KINDS, required=True)
    propose.add_argument("--url", required=True)
    propose.add_argument("--by", required=True)
    for action in ("approve", "pause"):
        srcs.add_parser(action).add_argument("id", type=_positive_int)
    srcs.add_parser("list")
    cli_clean.add_source_remove(srcs)

    topics = commands.add_parser("topics").add_subparsers(dest="action", required=True)
    new_topic = topics.add_parser("add")
    new_topic.add_argument("name")
    new_topic.add_argument("--keywords", required=True, help="comma-separated phrases")
    new_topic.add_argument("--kinds", default="", help="comma-separated; empty means every kind")
    new_topic.add_argument("--by", required=True)
    topics.add_parser("list")

    ingest = commands.add_parser("ingest")
    ingest.add_argument("--loop", action="store_true", help="a pass every 60 seconds")

    stories = commands.add_parser("stories")
    stories.add_argument("--limit", type=_positive_int, default=20)
    _moderation(commands)
    cli_clean.add_digests(commands)
    cli_ai.add_parser(commands)
    cli_issuers.add_parsers(commands)
    cli_logos.add_parsers(commands)
    return parser


def _moderation(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    """`threads remove <id>`, `comments remove <id>`, `groups delete <id> [--with-threads]`,
    `groups prune <id> --older-than <days>`."""
    for noun in ("threads", "comments"):
        verbs = commands.add_parser(noun).add_subparsers(dest="action", required=True)
        verbs.add_parser("remove").add_argument("id", type=_positive_int)
    held = commands.add_parser("groups").add_subparsers(dest="action", required=True)
    delete = held.add_parser("delete")
    delete.add_argument("id", type=_positive_int)
    delete.add_argument(
        "--with-threads", action="store_true", help="delete its threads and comments too"
    )
    prune = held.add_parser("prune", help="remove old topic posts that hold no comment")
    prune.add_argument("id", type=_positive_int)
    prune.add_argument(
        "--older-than", type=cli_clean.bounded_int(MAX_DAYS), required=True, metavar="DAYS"
    )


def _moderate(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.command == "threads":
        count = threads.remove_thread(db, args.id)
        print(f"thread {args.id} removed with {plural(count, 'comment line', 'comment lines')}")
    elif args.command == "comments":
        threads.moderate_comment(db, args.id, lambda: datetime.now(UTC))
        print(f"comment {args.id} removed; a removed line stays in its thread")
    elif args.action == "prune":
        before = datetime.now(UTC) - timedelta(days=args.older_than)
        count = threads.prune_topic_posts(db, args.id, before)
        print(f"group {args.id}: {plural(count, 'topic post', 'topic posts')} removed")
    else:
        groups.remove_group(db, args.id, with_threads=args.with_threads)
        print(f"group {args.id} deleted")


def _stamp(value: datetime | None, missing: str = "") -> str:
    return missing if value is None else value.astimezone(UTC).strftime("%Y-%m-%d %H:%M")


def _list_sources(db: sqlite3.Connection) -> None:
    now = datetime.now(UTC)
    for row in sources(db):
        status = health(db, row["id"], now)
        why = f"  ({status.reason})" if status.state == "failing" else ""
        print(
            f"{row['id']}  {row['state']}  {status.state}  "
            f"{_stamp(status.last_item, 'no items')}  {row['name']}{why}"
        )


def _ingest_pass(db: sqlite3.Connection) -> None:
    names = {row["id"]: row["name"] for row in sources(db)}
    for source_id, ok, reason in run_due(db, datetime.now(UTC)):
        print(f"{names[source_id]}: {'ok' if ok else 'failed'}: {reason}")


def _ingest(db: sqlite3.Connection, loop: bool) -> None:
    _ingest_pass(db)
    try:
        while loop:
            time.sleep(LOOP_SECONDS)
            _ingest_pass(db)
    except KeyboardInterrupt:
        print("stopped")


def _stories(db: sqlite3.Connection, limit: int) -> None:
    for row in db.execute(_STORIES_SQL, (limit,)):
        when = _stamp(datetime.fromisoformat(row["published_at"]))
        folded = f" (+{row['folded']})" if row["folded"] else ""
        print(f"{when}  {row['source_name']}  {row['title']}{folded}")


def _split(text: str) -> list[str]:
    return [part.strip() for part in text.split(",") if part.strip()]


def _topics(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.action == "add":
        add_topic(db, args.name, _split(args.keywords), _split(args.kinds), args.by)
    else:
        for row in list_topics(db, ""):
            print(f"{row['id']}  {row['stories']}  {row['name']}")


def _sources(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    if args.action == "propose":
        check_address(args.url)
        propose_source(db, args.name, args.kind, args.url, args.by)
    elif args.action == "list":
        _list_sources(db)
    elif args.action == "remove":
        cli_clean.run_source_remove(db, args)
    else:
        state = "approved" if args.action == "approve" else "paused"
        set_source_state(db, args.id, state)


def _users(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    add_user(db, clean_name(args.name), args.role)


def _ingest_command(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    _ingest(db, args.loop)


def _stories_command(db: sqlite3.Connection, args: argparse.Namespace) -> None:
    _stories(db, args.limit)


Handler = Callable[[sqlite3.Connection, argparse.Namespace], None]
_HANDLERS: dict[str, Handler] = {
    "users": _users,
    "sources": _sources,
    "topics": _topics,
    "ingest": _ingest_command,
    "digests": cli_clean.run_digests,
    "threads": _moderate,
    "comments": _moderate,
    "groups": _moderate,
    "issuers": cli_issuers.run,
    "filings": cli_issuers.run,
    "market": cli_issuers.run,
    "logos": cli_logos.run,
    "stories": _stories_command,
}


def _dispatch(args: argparse.Namespace) -> None:
    db = open_db(args.root)
    try:
        _HANDLERS[args.command](db, args)
    finally:
        db.close()


def _ai(args: argparse.Namespace, setup: ai_run.Setup) -> int:
    db = open_db(args.root)
    try:
        return cli_ai.run(db, args, setup)
    finally:
        db.close()


def _db_file(root: Path) -> Path:
    return root / "signal" / "signal.db"


def main(argv: Sequence[str] | None = None, ai: ai_run.Setup | None = None) -> int:
    """Run one command; 2 on a usage error, a store that cannot be used or a refused address.

    `ai` is what the AI commands read (the launching environment and the project's rulings by
    default)."""
    try:
        args = _parser().parse_args(argv)
    except SystemExit as exit_:
        return exit_.code if isinstance(exit_.code, int) else 2
    try:
        if args.command == "ai":
            return _ai(args, ai_run.Setup() if ai is None else ai)
        _dispatch(args)
    except (StoreError, FetchRefused, IdentityError, GroupError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    except (sqlite3.Error, OverflowError, OSError) as error:  # a store that cannot be used
        print(f"error: the store {_db_file(args.root)} cannot be used: {error}", file=sys.stderr)
        return 2
    return 0
