"""The standing reference portfolios on the start page: their listing, the analyst's "fetch latest"
action, the first fetch of a set that is absent, and a set the analyst supplies by hand.

Owner rulings (2026-11-25): three standing references (``reference_portfolios.STANDING``: a CLO
portfolio, the loan index fund LVLN and the high yield fund JNK); the application fetches the two
fund files or an analyst provides a file; a fetch runs only on an analyst's action or when a set
is absent, never on every run; a failed or changed file is a reported error with the previous
good set kept and its as-of date shown.

* ``listing`` reads the standing store only; it never touches the network.
* ``refresh`` is the analyst's "fetch latest": one ``reference_fetch.refresh`` and its outcome.
* ``ensure_absent`` fetches each fetchable key with no stored set and no recorded failure, so the
  first time only: after a failure only the analyst's action fetches again, and a page load never
  fetches a set it has already tried.
* A supplied set is staged file by file under ``<standing root>/staging/<key>`` by the comparison
  portfolio's rules (``reference_portfolio``: one safe name part, a .csv or .xlsx file, no link,
  a length judged before a byte is read, ``MAX_FILE`` and ``MAX_FILES``, the uploads' store-wide
  ceiling, a temporary name renamed into place), then read with
  ``read_portfolio_files(files, reference=STANDING[key])`` and saved as the key's set. The staged
  files leave staging as they are read, whatever the outcome; a file that is not a portfolio, or
  that states no as-of date, is refused with a sentence for a reader and the stored set is kept.

``Desk`` holds one lock per key, taken for a fetch and for a supplied set's read and save. A second
request for a key that is busy is refused (``Busy``), never queued, so no request waits on another.

Ceiling: staged bytes count toward the store-wide ceiling when a file is staged, but a submission's
own upload does not count them; they are at most ``len(STANDING) * MAX_FILES * MAX_FILE`` and every
read or clear empties them. Two analysts staging files for one key at once would mix their files;
the reading they get back says what was stored.
"""

from __future__ import annotations

import logging
import os
import shutil
import threading
import uuid
from collections.abc import Iterator
from contextlib import contextmanager, suppress
from datetime import date, datetime
from pathlib import Path
from typing import Any, BinaryIO

from deploy_workflow import reference_fetch
from deploy_workflow import reference_portfolios as portfolios
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.run_start import reference_portfolio, submissions
from deploy_workflow.run_start.submissions import Refused

MAX_FILE = reference_portfolio.MAX_FILE
MAX_FILES = reference_portfolio.MAX_FILES
STAGING = "staging"
UNKNOWN = "unknown portfolio"
_NOTHING_STAGED = "Choose the file or files to store first."

log = logging.getLogger(__name__)


class Busy(Exception):
    """The key is being fetched or replaced; the message is worded for a reader."""


class Desk:
    """What the service holds for the standing references: one lock per key, and the wiring a
    fetch runs on (None: the production connection; tests give their own)."""

    def __init__(self, wiring: reference_fetch.Wiring | None = None) -> None:
        self.wiring = wiring
        self._locks = {key: threading.Lock() for key in portfolios.STANDING}

    @contextmanager
    def held(self, key: str) -> Iterator[None]:
        """Hold the key's lock for the body; ``Busy`` at once when another request holds it."""
        lock = self._locks[key]
        if not lock.acquire(blocking=False):
            reference = portfolios.STANDING[key]
            doing = "fetched or replaced" if reference.url else "replaced"
            raise Busy(
                f"{reference.name} is already being {doing}; try again when it has finished."
            )
        try:
            yield
        finally:
            lock.release()


def standing(key: str) -> portfolios.Reference:
    """The standing reference ``key``; ``Refused(UNKNOWN)`` for any other key."""
    found = portfolios.STANDING.get(key)
    if found is None:
        raise Refused(UNKNOWN)
    return found


def _store(layout: Layout) -> portfolios.Store:
    return portfolios.Store(reference_portfolio.standing_root(layout))


def _text(value: date | None) -> str | None:
    return None if value is None else value.isoformat()


# --- The listing ----------------------------------------------------------------------------------


def _shown_error(item: portfolios.Summary) -> str | None:
    """The store's sentence on a file it cannot read, without the key: the page shows it on the
    portfolio's own line, beside its name."""
    if item.error is None:
        return None
    quoted = f"'{item.key}'"
    return item.error.replace(f"The stored portfolio {quoted}", "The stored set").replace(
        quoted, "this portfolio"
    )


def _entry(item: portfolios.Summary) -> dict[str, Any]:
    failure = item.failure
    return {
        "key": item.key,
        "name": item.name,
        "kind": item.kind,
        "as_of": _text(item.as_of),
        "stored_at": _text(item.stored_at),
        "positions": item.positions,
        "failure": None
        if failure is None
        else {"message": failure.message, "at": failure.at.isoformat()},
        "error": _shown_error(item),
        "fetchable": portfolios.STANDING[item.key].url is not None,
    }


def listing(layout: Layout) -> dict[str, Any]:
    """``{"portfolios": [...]}``: each standing reference, in ``STANDING`` order, as the store holds
    it. Read from the store alone: nothing is fetched."""
    listed = portfolios.list_portfolios(_store(layout))
    return {"portfolios": [_entry(item) for item in listed if item.key in portfolios.STANDING]}


# --- Fetching -------------------------------------------------------------------------------------


def _words(fields: tuple[str, ...]) -> list[str]:
    """Fields as a reader is told them (``reference_portfolio``'s words)."""
    said = reference_portfolio._FIELD_WORDS
    return [said.get(name, name.replace("_", " ")) for name in fields]


def refresh(layout: Layout, desk: Desk, key: str, now: datetime) -> dict[str, Any]:
    """The analyst's "fetch latest" for ``key``: one fetch, what it left in the store, and the
    listing after it. ``Refused`` for a key with no file to fetch (nothing is fetched), ``Busy``
    while the key is being fetched or replaced."""
    reference = standing(key)
    if reference.url is None:
        raise Refused(f"{reference.name} has no holdings file to fetch; replace it with a file.")
    with desk.held(key):
        done = reference_fetch.refresh(_store(layout), key, now=now, wiring=desk.wiring)
    return {
        "key": key,
        "name": reference.name,
        "outcome": done.outcome,
        "as_of": _text(done.as_of),
        "stored_at": _text(done.stored_at),
        "file_as_of": _text(done.file_as_of),
        "message": done.message,
        "columns_gained": _words(done.columns_gained),
        "columns_lost": _words(done.columns_lost),
        **listing(layout),
    }


def ensure_absent(layout: Layout, desk: Desk, now: datetime) -> dict[str, Any]:
    """Fetch each fetchable standing key that has neither a stored set nor a recorded failure,
    skipping one that is busy, and return the listing. The check is made under the key's lock,
    so two pages loaded together fetch a key once."""
    store = _store(layout)
    for key, reference in portfolios.STANDING.items():
        if reference.url is None:
            continue
        with suppress(Busy), desk.held(key):
            tried = store.keys()  # each key with a `<key>.json` or a `<key>.failure.json`
            if key not in tried:
                reference_fetch.ensure(store, key, now=now, wiring=desk.wiring)
    return listing(layout)


# --- A set the analyst supplies -------------------------------------------------------------------


def _tag(key: str) -> str:
    """The key's entry in the uploads' table of reservations (never a submission id)."""
    return f"standing/{key}"


def _staging(layout: Layout, key: str) -> Path:
    """The key's staging folder, which may not exist yet; a link on the way to it is refused."""
    root = reference_portfolio.standing_root(layout)
    folder = root / STAGING / key
    if any(step.is_symlink() for step in (root, root / STAGING, folder)):
        raise Refused("the standing portfolios' folder is a link; nothing is written there")
    return folder


def _staged_bytes(layout: Layout) -> int:
    """The bytes staged for every standing key."""
    total = 0
    for key in portfolios.STANDING:
        folder = _staging(layout, key)
        total += sum(submissions._stored(folder).values()) if folder.is_dir() else 0
    return total


def _held_bytes(layout: Layout) -> int:
    """Every byte the uploads' ceiling covers: in flight, submitted for review and staged here."""
    total = sum(size for held in submissions._PENDING.values() for _, size in held.values())
    for other in submissions._open_folders(layout):
        total += submissions._reference_bytes(other)
        if not (other / "files").is_symlink():
            total += sum(submissions._stored(other / "files").values())
    return total + _staged_bytes(layout)


def _reserve(layout: Layout, key: str, name: str, length: int) -> str:
    """Check the count and the ceiling against what is staged and in flight, and record the
    reservation; call without the uploads' lock."""
    tag, tmp = _tag(key), f".part-{uuid.uuid4().hex}"
    with submissions._LOCK:
        folder = _staging(layout, key)
        submissions._refuse_links(folder, [name])
        existing = submissions._stored(folder) if folder.is_dir() else {}
        flying = {stored for stored, _ in submissions._PENDING.get(tag, {}).values()}
        if len((set(existing) | flying) - {name}) + 1 > MAX_FILES:
            raise Refused(f"a standing portfolio is at most {MAX_FILES} files")
        if _held_bytes(layout) - existing.get(name, 0) + length > submissions.MAX_STORE:
            raise Refused("the service's storage for uploads is full; try again later")
        submissions._PENDING.setdefault(tag, {})[tmp] = (name, length)
    return tmp


def _place(layout: Layout, key: str, name: str, temp_path: Path) -> None:
    with submissions._LOCK:
        folder = _staging(layout, key)
        folder.mkdir(parents=True, exist_ok=True)
        submissions._refuse_links(folder, [name])
        if (folder / name).is_dir():
            raise Refused(f"{name!r} is already a folder")
        os.replace(temp_path, folder / name)


def add_file(layout: Layout, key: str, name: str, body: BinaryIO, length: int) -> str:
    """Stage ``length`` bytes from ``body`` as one of ``key``'s files and return the stored name.
    A name already staged is replaced; a refusal leaves nothing behind."""
    standing(key)
    stored = reference_portfolio._file_name(name)
    if not isinstance(length, int) or isinstance(length, bool) or length < 0:
        raise Refused("the upload has no valid length")
    if length > MAX_FILE:
        raise Refused(f"a standing portfolio file is at most {MAX_FILE // (1024 * 1024)} MB")
    tmp = _reserve(layout, key, stored, length)
    temp_path = _staging(layout, key).parent / tmp
    try:
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        submissions._write(body, temp_path, length)
        _place(layout, key, stored, temp_path)
    finally:
        with submissions._LOCK:  # released first, as ``submissions.add_file`` does
            held = submissions._PENDING.get(_tag(key), {})
            held.pop(tmp, None)
            if not held:
                submissions._PENDING.pop(_tag(key), None)
        submissions._unlink_temporary(temp_path)
    return stored


def clear(layout: Layout, key: str) -> None:
    """Remove every file staged for ``key``; none is not an error."""
    standing(key)
    with submissions._LOCK:
        if submissions._PENDING.get(_tag(key)):
            raise Refused("an upload is still in progress")
        folder = _staging(layout, key)
        if folder.is_dir():
            shutil.rmtree(folder)


def _take(layout: Layout, key: str) -> dict[str, bytes]:
    """The staged files' bytes, read and taken out of staging as one step under the uploads' lock.

    Ceiling: at most ``MAX_FILES`` files of ``MAX_FILE`` bytes are read while the lock is held, as
    ``reference_portfolio`` reads a comparison portfolio."""
    with submissions._LOCK:
        if submissions._PENDING.get(_tag(key)):
            raise Refused("an upload is still in progress")
        folder = _staging(layout, key)
        if not folder.is_dir():
            return {}
        files: dict[str, bytes] = {}
        for name, size in sorted(submissions._stored(folder, strict=True).items()):
            with submissions.open_regular(folder / name, size) as handle:
                files[name] = handle.read()
        shutil.rmtree(folder)
    return files


def _read(
    reference: portfolios.Reference, files: dict[str, bytes], now: datetime
) -> portfolios.Portfolio:
    """The files as the reference's dated portfolio; ``Refused`` with a reader's sentence."""
    try:
        found = portfolios.read_portfolio_files(files, reference=reference, stored_at=now)
    except portfolios.PortfolioFileError as error:
        raise Refused(str(error)) from error
    except Exception as error:  # hostile bytes: any parser failure is a refusal
        log.warning("a standing portfolio's files could not be parsed", exc_info=True)
        raise Refused(reference_portfolio._UNREADABLE) from error
    if found.as_of is None:
        raise Refused(
            f"{reference.name}: the files state no as-of date, so they were not stored. A "
            "standing portfolio is kept only with its date; a CLO pack states it in its mandate "
            "file."
        )
    return found


def supply(layout: Layout, desk: Desk, key: str, now: datetime) -> dict[str, Any]:
    """Read the files staged for ``key`` and store them as its set, stored at ``now`` (UTC).
    Returns ``{"portfolio": <reference_portfolio.shown>, "portfolios": <the listing>}``.
    ``Refused`` (the stored set kept) when nothing is staged or the files are not a dated
    portfolio; ``Busy`` while the key is being fetched or replaced."""
    reference = standing(key)
    with desk.held(key):
        files = _take(layout, key)
        if not files:
            raise Refused(_NOTHING_STAGED)
        found = _read(reference, files, now)
        _store(layout).save(found)
    return {"portfolio": reference_portfolio.shown(found), **listing(layout)}
