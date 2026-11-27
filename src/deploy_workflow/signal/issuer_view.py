"""The issuer parts of the snapshot's format 2 (``GET /api/snapshot?format=2``): the issuer
channels, Settings' issuer list and filing line, and each story's issuers.

    channels.issuers   [{id, name, count, followed}]      by name, A to Z
    settings.issuers   [{id, name, aliases, cik, libraryKey, source: {id, state, note} | null}]
    settings.filings   {contactSet, note}

`count` is the issuer's story count as text (null for a viewer with no account, and null beside a
view the size bound left empty, as a topic's). `source` is the issuer's filing source while it has a
CIK: its state word and one sentence on what Signal does with it. The owner's contact string is
never delivered: `contactSet` says only whether one is set. Every read runs in the caller's read
transaction.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Mapping
from datetime import datetime
from typing import Any

from deploy_workflow.signal import filings, ingest, issuers
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.texts import ago

Json = dict[str, Any]

_STATE = {"approved": "Approved", "paused": "Paused", "proposed": "Proposed"}
PROPOSED = "Proposed. Nothing is fetched until the owner approves it on the command line."
PAUSED = "Paused. Nothing is fetched until the owner approves it again on the command line."
NO_CONTACT = "Approved, but not fetched: the owner has not set the contact the SEC asks for."


def _rows(db: sqlite3.Connection, user_name: str) -> list[sqlite3.Row]:
    rows = db.execute(
        "SELECT i.id, i.name,"
        " EXISTS(SELECT 1 FROM issuer_follows f WHERE f.issuer_id = i.id AND f.user_name = ?)"
        "  AS following,"
        " (SELECT COUNT(*) FROM issuer_stories l WHERE l.issuer_id = i.id) AS stories"
        " FROM issuers i",
        (user_name,),
    ).fetchall()
    return sorted(rows, key=lambda row: (str(row["name"]).casefold(), int(row["id"])))


def channels(db: sqlite3.Connection, user: User | None) -> list[Json]:
    """``channels.issuers`` for `user` (None: no authenticated account)."""
    named = user is not None
    return [
        {
            "id": str(row["id"]),
            "name": row["name"],
            "count": str(row["stories"]) if named else None,
            "followed": named and bool(row["following"]),
        }
        for row in _rows(db, user.name if user is not None else "")
    ]


def _note(row: sqlite3.Row, health: ingest.Health, contact: bool, now: datetime) -> str:
    if row["state"] == "proposed":
        return PROPOSED
    if row["state"] == "paused":
        return PAUSED
    if not contact:
        return NO_CONTACT
    if health.state == "failing":
        return f"Approved. The last check failed: {health.reason}"
    if health.last_check is None:
        return "Approved. Not checked yet."
    return f"Approved. Checked {ago(health.last_check, now)}."


def settings(
    db: sqlite3.Connection,
    checked: Mapping[int, tuple[sqlite3.Row, ingest.Health]],
    now: datetime,
) -> list[Json]:
    """``settings.issuers``: every issuer by name; `checked` holds each source with its health."""
    contact = filings.contact(db) is not None
    listed = []
    for one in issuers.every(db):
        source = None
        if one.source_id is not None and one.source_id in checked:
            row, health = checked[one.source_id]
            source = {
                "id": str(one.source_id),
                "state": _STATE[row["state"]],
                "note": _note(row, health, contact, now),
            }
        listed.append(
            {
                "id": str(one.id),
                "name": one.name,
                "aliases": list(one.aliases),
                "cik": one.cik,
                "libraryKey": one.library_key,
                "source": source,
            }
        )
    return listed


def filings_line(db: sqlite3.Connection) -> Json:
    """``settings.filings``: whether the owner's contact is set, and what that means."""
    held = filings.contact(db) is not None
    return {"contactSet": held, "note": filings.WITH_CONTACT if held else filings.NO_CONTACT}
