"""Source logos: each approved source's small icon, fetched by the service and handed to the page
as JSON (docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md, "Source logos").

Why the service fetches it. The page may load images only from its own origin or ``data:``
addresses, it reaches the service only through a forwarder that passes JSON, and a page loading
icons from publishers would tell each publisher who opened Signal. So the service fetches each
approved source's icon and the page reads it from ``GET /api/logos/<source id>``.

When. In the background loop after the ingest job (``run_due``): approved sources only, never a
proposed or paused one, never on a page view; at most ``PER_PASS`` icon fetches a pass; each
source's icon refreshed at most every ``REFRESH`` and retried no sooner than ``RETRY`` after a
failure. A source whose icon the owner cleared is not fetched until the owner refreshes it. The
owner's switch (``set_enabled``; on unless switched off) stops every fetch and every delivery.

Where from (``address``): the image the source's feed declared, as the last ingest pass read it
(RSS ``<image><url>``, Atom ``<logo>`` or ``<icon>``; ``note_declared``), resolved against the
feed's address; otherwise ``https://<the feed's host>/favicon.ico``. A filing source's host is the
SEC's and the market source's FRED's, by the same rule. No HTML page is fetched or read.

How. Only through the fetch function the loop is given (``fetch.fetch`` and every rule of it:
https, a plain public host, the default port, checked redirects, 10 s, no proxy), with a body cap
of ``MAX_BYTES`` (a larger file is refused, never cut), the ordinary client (the SEC contact is
never sent for an icon) and no cookies.

What is accepted (``sniff``): PNG, JPEG, GIF, WebP and ICO, decided by the file's leading bytes,
never by the server's content type or the address; anything else (an SVG among them: it can carry
script) is refused, and so is a file whose header is cut short or whose declared size is over
``MAX_SIDE`` by ``MAX_SIDE`` pixels. The bytes are stored as fetched: nothing is decoded or
re-encoded. Standard library only.
"""

from __future__ import annotations

import base64
import logging
import sqlite3
import struct
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlsplit

from deploy_workflow.signal.fetch import Fetched, FetchRefused, check_form
from deploy_workflow.signal.store import (
    Missing,
    StoreError,
    _utc_text,
    _write_transaction,
    get_setting,
    set_setting,
)

log = logging.getLogger(__name__)

MAX_BYTES = 32 * 1024
MAX_SIDE = 512
PER_PASS = 5
REFRESH = timedelta(days=30)
RETRY = timedelta(days=1)
SWITCH_KEY = "logos"
ACCEPT = "image/png, image/x-icon, image/vnd.microsoft.icon, image/gif, image/jpeg, image/webp"
NOT_FOUND = "no logo for this source"

LogoFetch = Callable[[str], Fetched]


class LogoError(ValueError):
    """A file that is not an accepted icon, said in one sentence."""


# What a file is, by its leading bytes


def _sized(kind: str, width: int, height: int) -> str:
    if not (1 <= width <= MAX_SIDE and 1 <= height <= MAX_SIDE):
        raise LogoError(f"the image is {width} by {height}; at most {MAX_SIDE} by {MAX_SIDE}")
    return kind


def _png(data: bytes) -> str:
    if len(data) < 24 or data[12:16] != b"IHDR":
        raise LogoError("the PNG header is cut short")
    width, height = struct.unpack(">II", data[16:24])
    return _sized("image/png", width, height)


def _gif(data: bytes) -> str:
    if len(data) < 10:
        raise LogoError("the GIF header is cut short")
    width, height = struct.unpack("<HH", data[6:10])
    return _sized("image/gif", width, height)


def _webp(data: bytes) -> str:
    chunk = data[12:16]
    if chunk == b"VP8X" and len(data) >= 30:
        width = int.from_bytes(data[24:27], "little") + 1
        height = int.from_bytes(data[27:30], "little") + 1
    elif chunk == b"VP8L" and len(data) >= 25 and data[20] == 0x2F:
        bits = int.from_bytes(data[21:25], "little")
        width, height = (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    elif chunk == b"VP8 " and len(data) >= 30 and data[23:26] == b"\x9d\x01\x2a":
        width = int.from_bytes(data[26:28], "little") & 0x3FFF
        height = int.from_bytes(data[28:30], "little") & 0x3FFF
    else:
        raise LogoError("the WebP header is cut short or not one this build reads")
    return _sized("image/webp", width, height)


def _ico(data: bytes) -> str:
    count = int.from_bytes(data[4:6], "little") if len(data) >= 6 else 0
    if count == 0 or len(data) < 6 + 16 * count:
        raise LogoError("the ICO directory is cut short")
    for index in range(count):
        entry = data[6 + 16 * index : 22 + 16 * index]
        size, offset = struct.unpack("<II", entry[8:16])
        if offset + size > len(data):
            raise LogoError("an ICO image runs past the end of the file")
        _sized("image/x-icon", entry[0] or 256, entry[1] or 256)
    return "image/x-icon"


_FRAMES = frozenset(
    {*range(0xC0, 0xC4), *range(0xC5, 0xC8), *range(0xC9, 0xCC), *range(0xCD, 0xD0)}
)
_STANDALONE = frozenset({0x01, 0xD8, *range(0xD0, 0xD8)})


def _jpeg(data: bytes) -> str:
    """The frame header's size: the markers are walked from the start to the first SOF."""
    at = 2
    while at + 4 <= len(data):
        if data[at] != 0xFF:
            raise LogoError("the JPEG markers are not well formed")
        marker = data[at + 1]
        if marker == 0xFF:
            at += 1
        elif marker in _STANDALONE:
            at += 2
        elif marker in (0xD9, 0xDA):
            break
        else:
            length = int.from_bytes(data[at + 2 : at + 4], "big")
            if marker in _FRAMES and length >= 7 and at + 9 <= len(data):
                height, width = struct.unpack(">HH", data[at + 5 : at + 9])
                return _sized("image/jpeg", width, height)
            if length < 2:
                raise LogoError("the JPEG markers are not well formed")
            at += 2 + length
    raise LogoError("the JPEG frame header is missing or cut short")


_SIGNATURES: tuple[tuple[bytes, Callable[[bytes], str]], ...] = (
    (b"\x89PNG\r\n\x1a\n", _png),
    (b"GIF87a", _gif),
    (b"GIF89a", _gif),
    (b"\xff\xd8\xff", _jpeg),
    (b"\x00\x00\x01\x00", _ico),
)


def sniff(data: bytes) -> str:
    """The media type of an accepted icon, from its leading bytes; LogoError otherwise."""
    if len(data) > MAX_BYTES:
        raise LogoError(f"the file is larger than {MAX_BYTES // 1024} KiB")
    for signature, read in _SIGNATURES:
        if data.startswith(signature):
            return read(data)
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return _webp(data)
    raise LogoError("the file is not a PNG, JPEG, GIF, WebP or ICO image")


# The switch and the declared image


def enabled(db: sqlite3.Connection) -> bool:
    return get_setting(db, SWITCH_KEY) != "off"


def set_enabled(db: sqlite3.Connection, on: bool, now: datetime) -> None:
    """The owner's switch: off delivers no logo and fetches none (on is the default)."""
    set_setting(db, SWITCH_KEY, None if on else "off", now)


def note_declared(db: sqlite3.Connection, source_id: int, image: str | None) -> None:
    """Keep the image address the source's feed declared (None: it declares none), inside or
    outside a transaction; written only when it changed."""
    row = db.execute("SELECT declared FROM source_logos WHERE source_id=?", (source_id,))
    held = row.fetchone()
    if (held["declared"] if held is not None else None) == image:
        return
    with _write_transaction(db):
        db.execute(
            "INSERT INTO source_logos(source_id, declared) VALUES(?, ?)"
            " ON CONFLICT(source_id) DO UPDATE SET declared=excluded.declared",
            (source_id, image),
        )


def address(source_url: str, declared: str | None) -> str:
    """Where a source's icon is fetched from (see the module docstring)."""
    if declared:
        return urljoin(source_url, declared)
    host = urlsplit(source_url).hostname or ""
    return f"https://{host}/favicon.ico"


# Fetching


@dataclass(frozen=True)
class Outcome:
    source_id: int
    ok: bool
    note: str  # what was stored ("image/png, 1,234 bytes") or why not


def _due(db: sqlite3.Connection, now: datetime, limit: int) -> list[sqlite3.Row]:
    """The approved sources whose icon is due: none tried yet first, then the longest waiting."""
    return db.execute(
        "SELECT s.id, s.url, l.declared FROM sources s"
        " LEFT JOIN source_logos l ON l.source_id = s.id"
        " WHERE s.state='approved' AND COALESCE(l.cleared, 0) = 0 AND (l.fetched_at IS NULL"
        "  OR (l.note IS NULL AND l.fetched_at <= ?) OR (l.note IS NOT NULL AND l.fetched_at <= ?))"
        " ORDER BY l.fetched_at IS NOT NULL, l.fetched_at, s.id LIMIT ?",
        (_utc_text(now - REFRESH), _utc_text(now - RETRY), limit),
    ).fetchall()


@dataclass(frozen=True)
class _Got:
    """One attempt: where from, and the icon (its media type and bytes) or why there is none."""

    url: str
    note: str | None = None
    kind: str | None = None
    data: bytes | None = None


def _store(db: sqlite3.Connection, source_id: int, now: datetime, got: _Got) -> None:
    """Record one attempt; a failure keeps any icon already stored (it is still delivered)."""
    stamp = _utc_text(now)
    with _write_transaction(db):
        if got.data is None:
            db.execute(
                "INSERT INTO source_logos(source_id, url, fetched_at, note) VALUES(?, ?, ?, ?)"
                " ON CONFLICT(source_id) DO UPDATE SET fetched_at=excluded.fetched_at,"
                " note=excluded.note",
                (source_id, got.url, stamp, got.note),
            )
            return
        db.execute(
            "INSERT INTO source_logos(source_id, data, media_type, url, fetched_at, note)"
            " VALUES(?, ?, ?, ?, ?, NULL) ON CONFLICT(source_id) DO UPDATE SET"
            " data=excluded.data, media_type=excluded.media_type, url=excluded.url,"
            " fetched_at=excluded.fetched_at, note=NULL, cleared=0",
            (source_id, got.data, got.kind, got.url, stamp),
        )


def fetch_one(
    db: sqlite3.Connection, source: sqlite3.Row, now: datetime, fetch_fn: LogoFetch
) -> Outcome:
    """Fetch and record one source's icon; whatever the fetch or the file raises is the note."""
    url = address(str(source["url"]), source["declared"])
    try:
        check_form(url)
        body = fetch_fn(url).body or b""
        kind = sniff(body)
    except (FetchRefused, LogoError) as error:
        _store(db, source["id"], now, _Got(url, note=str(error)))
        return Outcome(source["id"], False, str(error))
    except Exception as error:  # one source's fault never stops the others; logged
        log.exception("fetching the logo of source %s failed", source["id"])
        note = f"unexpected error ({type(error).__name__}); see the log"
        _store(db, source["id"], now, _Got(url, note=note))
        return Outcome(source["id"], False, note)
    _store(db, source["id"], now, _Got(url, kind=kind, data=body))
    return Outcome(source["id"], True, f"{kind}, {len(body):,} bytes")


def run_due(db: sqlite3.Connection, now: datetime, fetch_fn: LogoFetch | None) -> list[Outcome]:
    """The loop's logo job: at most PER_PASS due icons (none while switched off or with no fetch
    function)."""
    if fetch_fn is None or not enabled(db):
        return []
    return [fetch_one(db, source, now, fetch_fn) for source in _due(db, now, PER_PASS)]


def _approved(db: sqlite3.Connection, source_id: int) -> sqlite3.Row:
    row: sqlite3.Row | None = db.execute(
        "SELECT s.id, s.url, s.state, l.declared FROM sources s"
        " LEFT JOIN source_logos l ON l.source_id = s.id WHERE s.id=?",
        (source_id,),
    ).fetchone()
    if row is None:
        raise Missing(f"no source with id {source_id}")
    if row["state"] != "approved":
        raise StoreError(f"source {source_id} is not approved, so its logo is not fetched")
    return row


def refresh(db: sqlite3.Connection, source_id: int, now: datetime, fetch_fn: LogoFetch) -> Outcome:
    """``signal logos refresh``: fetch an approved source's icon now (a cleared one again too)."""
    if not enabled(db):
        raise StoreError("logos are switched off; switch them on with: signal logos on")
    source = _approved(db, source_id)
    with _write_transaction(db):
        db.execute("UPDATE source_logos SET cleared=0 WHERE source_id=?", (source_id,))
    return fetch_one(db, source, now, fetch_fn)


def clear(db: sqlite3.Connection, source_id: int) -> None:
    """``signal logos clear``: remove a source's icon and fetch none for it until refreshed."""
    with _write_transaction(db):
        if db.execute("SELECT 1 FROM sources WHERE id=?", (source_id,)).fetchone() is None:
            raise Missing(f"no source with id {source_id}")
        db.execute(
            "INSERT INTO source_logos(source_id, cleared) VALUES(?, 1) ON CONFLICT(source_id)"
            " DO UPDATE SET data=NULL, media_type=NULL, cleared=1",
            (source_id,),
        )


# Reading


def logo_ids(db: sqlite3.Connection) -> frozenset[int]:
    """The approved sources with an icon delivered (none while switched off)."""
    if not enabled(db):
        return frozenset()
    rows = db.execute(
        "SELECT l.source_id FROM source_logos l JOIN sources s ON s.id = l.source_id"
        " WHERE s.state='approved' AND l.data IS NOT NULL"
    )
    return frozenset(int(row[0]) for row in rows.fetchall())


def delivered(db: sqlite3.Connection, source_id: int) -> dict[str, str] | None:
    """``{"type", "data"}`` (base64) of an approved source's icon; None for an unknown,
    unapproved or logo-less source, or while switched off (one answer for each)."""
    if not enabled(db):
        return None
    row = db.execute(
        "SELECT l.data, l.media_type FROM source_logos l JOIN sources s ON s.id = l.source_id"
        " WHERE l.source_id=? AND s.state='approved' AND l.data IS NOT NULL",
        (source_id,),
    ).fetchone()
    if row is None:
        return None
    return {"type": str(row["media_type"]), "data": base64.b64encode(row["data"]).decode()}


def status(db: sqlite3.Connection) -> list[str]:
    """One line per source for ``signal logos status``."""
    lines = [] if enabled(db) else ["logos are switched off: none is fetched or delivered"]
    rows = db.execute(
        "SELECT s.id, s.name, s.state, l.data IS NOT NULL AS held, l.media_type, l.fetched_at,"
        " l.note, l.url, COALESCE(l.cleared, 0) AS cleared FROM sources s"
        " LEFT JOIN source_logos l ON l.source_id = s.id ORDER BY s.id"
    ).fetchall()
    for row in rows:
        lines.append(f"{row['id']}  {row['name']}  {_said(row)}")
    return lines


def _said(row: sqlite3.Row) -> str:
    when = "" if row["fetched_at"] is None else f", tried {row['fetched_at']} UTC"
    if row["cleared"]:
        return "cleared by the owner; not fetched until refreshed"
    if row["held"]:
        failed = "" if row["note"] is None else f"; the last refresh failed: {row['note']}"
        return f"has one ({row['media_type']}, from {row['url']}{when}){failed}"
    if row["state"] != "approved":
        return f"none: the source is {row['state']}, so none is fetched"
    if row["note"] is not None:
        return f"none: {row['note']}{when}"
    return "none yet: due at the next pass"
