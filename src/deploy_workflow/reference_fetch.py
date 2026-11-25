"""Fetch a standing reference portfolio's holdings workbook and store it; the only place
reference portfolios use the network.

Only a standing reference that has an address is fetched (`reference_portfolios.STANDING`: the
loan-index fund and the high-yield fund). The address is that constant's and nothing else's: no
function here takes an address, and a key that has none is refused (`NotFetchable`).

The fetch is Signal's (`signal.fetch.fetch_document`, on `research.webfetch`): https only, a
plain host name resolving only to public addresses, the connection pinned to the checked
address, redirects re-checked hop by hop, 10 seconds per socket operation, no content encoding,
a body no shorter than its declared length. This module sets:

- A redirect stays on the standing address's host (the same name, exactly): one to any other
  host is refused before that host is looked up or connected to.
- `TOTAL_SECONDS` (60) for the whole fetch, every hop included. A feed has 10; a workbook of
  megabytes on a slow line needs more, and one fetch per analyst action can afford it.
- `MAX_BYTES` (8 MB) for the body. A daily holdings workbook of some thousand rows and a dozen
  columns is well under 1 MB; 8 MB leaves room for a larger fund without accepting an arbitrary
  download. Signal's own 2 MB cap is unchanged.
- The address that answers (after any redirect) must still end `.xlsx`.
- The content type must be the XLSX type or `application/octet-stream` (a common answer for a
  file download). Anything else is refused, `text/html` (an error or consent page) included,
  and so is an answer with no content type. The fund's real header was NOT verified when this
  was written (its site could not be reached): if it sends another type, the refusal names it.
- The body must start with the ZIP signature and, before it is read as a workbook, its archive
  must declare at most `MAX_MEMBERS` members and `MAX_EXPANDED_BYTES` (64 MB) unpacked. The
  workbook reader has its own limit (`deploy_vii.preparation.MAX_EXPANDED_BYTES`, 200 MB,
  checked in `xlsx_content`); this one is tighter because the file is from the network. The
  standard library's reader never gives more of a member than its declared size, so the
  declared total bounds what is unpacked.

Then the file is read by `reference_portfolios.read_ssga_holdings`. A file that states no as-of
date is a failure here, not a set: a fetched set is only ever offered with its date, and an
undated one could not be told from an older one. So is a file dated more than a day after the
fetch, a file that names another fund's ticker, and, against the stored set, a file that lacks a
field the stored set has (columns lost; columns gained are stored and reported) or holds fewer
than half its positions: a changed or wrong file does not replace a good set. A file whose as-of
date is older than the stored set's does not replace it (outcome `kept`, not a failure). A file
with the same or a later date replaces it, stored with the fetch time; one more than
`STALE_DAYS` older than the fetch is stored (no newer set being there) with a finding that it is
stale.

Whatever fails (the address, the connection, the answer, the file), `refresh` records it in the
store, leaves the stored set as it was and returns the failure with that set's as-of date. It
raises only for a caller's mistake (a key that is not fetched, a time not in UTC) or a store
that cannot be written. One fetch per call: no retry, no schedule, and nothing at import.

One refresh of a key (in a store) at a time, in this process: from the fetch to the save it holds
the key's lock, and a second refresh of the key meanwhile is turned away at once (outcome `kept`,
`busy`), without a fetch and without recording a failure. The stored set is read once the file
has been fetched and read, under the lock, so a set stored meanwhile by other means is the one the
file is compared with.
"""

from __future__ import annotations

import io
import posixpath
import socket
import threading
import time
from collections.abc import Callable, Iterable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass, replace
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit
from zipfile import BadZipFile, ZipFile

from deploy_workflow import reference_portfolios as rp
from deploy_workflow.research.webfetch import ConnectionLike, ConnectionTarget
from deploy_workflow.signal import fetch as signal_fetch

TOTAL_SECONDS = 60
MAX_BYTES = 8 * 1024 * 1024
MAX_EXPANDED_BYTES = 64 * 1024 * 1024
MAX_MEMBERS = 2000
XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
CONTENT_TYPES = frozenset({XLSX_TYPE, "application/octet-stream"})
ACCEPT = f"{XLSX_TYPE}, application/octet-stream;q=0.9"
USER_AGENT = "Mozilla/5.0 (compatible; reference-portfolios/1.0)"
STALE_DAYS = 31  # a file older than this when fetched is stale
AHEAD_DAYS = 1  # a file may be dated at most this long after the fetch (time zones)
_ZIP_MAGIC = b"PK\x03\x04"
_MESSAGE_LIMIT = 300
_ECHO_LIMIT = 80

Outcome = Literal["stored", "kept", "failed"]


class NotFetchable(ValueError):
    """The key is not a standing reference with an address: nothing is fetched for it."""


@dataclass(frozen=True)
class Wiring:
    """What a fetch runs on; the defaults are the production values. Tests give a connector, a
    resolver and a clock, and a small `max_bytes` to reach the ceiling without a large body."""

    connect: Callable[[ConnectionTarget], ConnectionLike] | None = None  # None: the pinned one
    resolve: Callable[[str], Iterable[str]] | None = None  # None: the system's
    clock: Callable[[], float] = time.monotonic
    max_bytes: int = MAX_BYTES
    max_expanded_bytes: int = MAX_EXPANDED_BYTES


@dataclass(frozen=True)
class Refreshed:
    """What a refresh did. `stored`: the fetched file is now the key's set. `kept`: the stored
    set stays, because the file read is older than it or (`busy`) because another refresh of
    the key was under way and nothing was fetched. `failed`: nothing was stored and the failure
    is recorded in the store.

    `as_of` and `stored_at` are those of the set in the store after the call: on `kept` and
    `failed` the previous set's, None when there is none. `message` is a sentence for a reader on
    `kept` and `failed`, and on `stored` when the file is stale (it says so); else None.
    `file_as_of` is the date the fetched file states, None when no file was read.
    `columns_gained` and `columns_lost` are the fields the file's header has and the previous
    set's had not, and the reverse; both empty with no previous set or no file read."""

    key: str
    outcome: Outcome
    as_of: date | None = None
    stored_at: datetime | None = None
    message: str | None = None
    file_as_of: date | None = None
    columns_gained: tuple[str, ...] = ()
    columns_lost: tuple[str, ...] = ()
    busy: bool = False

    @property
    def changed_file(self) -> bool:
        """The file's header supplies other fields than the previous set's did."""
        return bool(self.columns_gained or self.columns_lost)


@dataclass(frozen=True)
class Ensured:
    """The key's set for a run. `portfolio` is the stored set, None when there is none; then
    `message` says why, for a reader. `refreshed` is the fetch `ensure` made, None when it made
    none (a set was stored, or the key is not fetched)."""

    key: str
    portfolio: rp.Portfolio | None
    message: str | None = None
    refreshed: Refreshed | None = None


class _Failed(Exception):
    """The fetched file is not stored; the text is the reader's sentence, without the name."""


def _printable(text: object, limit: int) -> str:
    """Untrusted text on one line: ASCII letters, digits and punctuation only, cut at `limit`."""
    flat = " ".join(str(text).split())
    return "".join(char if " " <= char <= "~" else "?" for char in flat)[:limit]


def _fetchable(key: str) -> tuple[rp.Reference, str]:
    reference = rp.STANDING.get(key)
    if reference is None or reference.url is None:
        raise NotFetchable(f"No holdings file is fetched for '{_printable(key, _ECHO_LIMIT)}'.")
    return reference, reference.url


def _system_resolve(host: str) -> Iterable[str]:
    """The system's addresses for `host`, as Signal's own default resolver gives them."""
    return [str(info[4][0]) for info in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)]


def _on_host(
    host: str, resolve: Callable[[str], Iterable[str]] | None
) -> Callable[[str], Iterable[str]]:
    """`resolve` for `host` alone. Each hop's host is looked up before it is connected to, so a
    redirect to another host is refused here, before it is looked up or connected to."""
    looked_up = resolve or _system_resolve

    def only(asked: str) -> Iterable[str]:
        if asked != host:
            shown = _printable(asked, _ECHO_LIMIT)
            raise signal_fetch.FetchRefused(f"a redirect to another host, {shown}, is not followed")
        return looked_up(asked)

    return only


def _document(url: str, wiring: Wiring) -> bytes:
    """The workbook's bytes from `url`, or `_Failed`."""
    rules = signal_fetch.Rules(
        what="holdings file",
        accept=ACCEPT,
        user_agent=USER_AGENT,
        total_seconds=TOTAL_SECONDS,
        max_bytes=wiring.max_bytes,
    )
    host = (urlsplit(url).hostname or "").lower()
    try:
        got = signal_fetch.fetch_document(
            url,
            rules,
            resolve=_on_host(host, wiring.resolve),
            wiring=signal_fetch.Wiring(wiring.connect, wiring.clock),
        )
    except signal_fetch.FetchRefused as error:
        raise _Failed(f"the holdings file could not be fetched ({error})") from error
    if not urlsplit(got.url).path.lower().endswith(".xlsx"):
        raise _Failed("the address led to a page that is not an .xlsx file")
    sent = (got.content_type or "").split(";", 1)[0].strip().lower()
    if sent not in CONTENT_TYPES:
        named = f"'{_printable(sent, _ECHO_LIMIT)}'" if sent else "no content type"
        raise _Failed(f"the server sent {named}, not an Excel workbook")
    return got.body


def _check_archive(raw: bytes, limit: int) -> None:
    """`_Failed` unless `raw` is a ZIP archive declaring no more than the limits unpacked."""
    not_workbook = _Failed("the file received is not an Excel workbook")
    if not raw.startswith(_ZIP_MAGIC):
        raise not_workbook
    try:
        with ZipFile(io.BytesIO(raw)) as archive:
            members = archive.infolist()
    except (BadZipFile, ValueError, OSError, EOFError, NotImplementedError) as error:
        raise not_workbook from error
    if len(members) > MAX_MEMBERS or sum(member.file_size for member in members) > limit:
        raise _Failed("the workbook received is too large to read once unpacked")


def _read(raw: bytes, reference: rp.Reference, url: str, now: datetime) -> rp.Portfolio:
    """The fetched bytes as a dated portfolio with positions, or `_Failed`."""
    name = posixpath.basename(urlsplit(url).path)
    try:
        found = rp.read_ssga_holdings(raw, reference, file_name=name, stored_at=now)
    except rp.PortfolioFileError as error:
        raise _Failed(str(error)) from error
    except Exception as error:  # any reader failure: an untrusted file must not end the run
        raise _Failed("the file received could not be read as a holdings workbook") from error
    if not found.positions:
        raise _Failed("the file received has no holdings")
    if found.as_of is None:
        why = next((line for line in found.findings if line.startswith("The as-of date ")), None)
        raise _Failed("the file states no as-of date" if why is None else why[0].lower() + why[1:])
    return found


def _previous(store: rp.Store, key: str) -> rp.Portfolio | None:
    """The stored set; None when there is none or its file cannot be read (a good file then
    replaces it)."""
    try:
        return store.load(key)
    except rp.StoreError:
        return None


def _fields(portfolio: rp.Portfolio) -> set[str]:
    return {name for name, _ in portfolio.columns_found}


_SAID = {"ytm": "yield", "stated_bucket": "rating bucket", "figi": "FIGI", "cusip": "CUSIP"}
_SAID |= {"isin": "ISIN", "sedol": "SEDOL"}


def _named(fields: Iterable[str]) -> str:
    """Fields as a reader names them, `a, b and c`."""
    words = [_SAID.get(name, name.replace("_", " ")) for name in fields]
    return words[0] if len(words) == 1 else f"{', '.join(words[:-1])} and {words[-1]}"


def _older(found: rp.Portfolio, before: rp.Portfolio | None) -> tuple[date, date] | None:
    """The file's as-of date and the stored set's, when the file's is the earlier."""
    then = None if before is None else before.as_of
    if found.as_of is not None and then is not None and found.as_of < then:
        return found.as_of, then
    return None


def _refused(
    found: rp.Portfolio, before: rp.Portfolio | None, reference: rp.Reference, now: datetime
) -> str | None:
    """Why the file read may not replace the stored set, or None."""
    when = found.as_of
    if when is not None and when > (now + timedelta(days=AHEAD_DAYS)).date():
        return (
            f"the file fetched is dated {rp.long_date(when)}, more than a day after it was "
            f"fetched on {rp.long_date(now.date())}; the stored set is kept"
        )
    stated, expected = (found.stated_ticker or "").strip(), reference.ticker or ""
    if stated and expected and stated.upper() != expected.upper():
        shown = _printable(stated, _ECHO_LIMIT)
        return f"the file fetched is for {shown}, not {expected}; the stored set is kept"
    if before is None or _older(found, before) is not None:
        return None  # nothing to compare with, or an older file, which is kept out anyway
    if lost := sorted(_fields(before) - _fields(found)):
        return (
            f"the file fetched has no column for {_named(lost)}, which the stored set has; the "
            "stored set is kept"
        )
    if 2 * len(found.positions) < len(before.positions):
        return (
            f"the file fetched has {len(found.positions)} positions, fewer than half the stored "
            f"set's {len(before.positions)}; the stored set is kept"
        )
    return None


def _staleness(found: rp.Portfolio, now: datetime) -> str | None:
    """`is as of ..., N days before it was fetched on ...: it is stale` when the file is more
    than `STALE_DAYS` older than its fetch; else None."""
    if found.as_of is None or (days := (now.date() - found.as_of).days) <= STALE_DAYS:
        return None
    return (
        f"is as of {rp.long_date(found.as_of)}, {days} days before it was fetched on "
        f"{rp.long_date(now.date())}: it is stale"
    )


_LOCKS: dict[tuple[Path, str], threading.Lock] = {}
_LOCKS_GUARD = threading.Lock()


@contextmanager
def _held(store: rp.Store, key: str) -> Iterator[bool]:
    """The key's lock for the block when no other refresh holds it (True), else False at once."""
    with _LOCKS_GUARD:
        lock = _LOCKS.setdefault((store.root.absolute(), key), threading.Lock())
    if not lock.acquire(blocking=False):
        yield False
        return
    try:
        yield True
    finally:
        lock.release()


def refresh(store: rp.Store, key: str, *, now: datetime, wiring: Wiring | None = None) -> Refreshed:
    """Fetch the standing reference `key`'s holdings workbook once and store it with `now` (UTC,
    the fetch time) as its stored time. See the module's note for what is refused, what a
    failure leaves in place and what a second refresh of the key meanwhile gets. Raises
    `NotFetchable` for a key with no address and ValueError for a `now` not in UTC, both before
    anything is fetched or written."""
    reference, url = _fetchable(key)
    if now.tzinfo is None or now.utcoffset() != timedelta(0):
        raise ValueError("the fetch time must be a datetime in UTC")
    with _held(store, key) as mine:
        if mine:
            return _refresh(store, reference, url, now, wiring or Wiring())
    before = _previous(store, key)
    return Refreshed(
        key,
        "kept",
        None if before is None else before.as_of,
        None if before is None else before.stored_at,
        f"{reference.name}: the holdings file is already being fetched; the stored set is kept.",
        busy=True,
    )


def _refresh(
    store: rp.Store, reference: rp.Reference, url: str, now: datetime, wiring: Wiring
) -> Refreshed:
    """`refresh`, holding the key's lock."""
    key = reference.key
    found: rp.Portfolio | None = None
    why: str | None = None
    try:
        raw = _document(url, wiring)
        _check_archive(raw, wiring.max_expanded_bytes)
        found = _read(raw, reference, url, now)
    except _Failed as error:
        why = str(error)
    before = _previous(store, key)  # read now: a set stored meanwhile is the one compared with
    kept_as_of = None if before is None else before.as_of
    kept_at = None if before is None else before.stored_at
    file_as_of, gained, lost = _compared(found, before)
    if found is None or (why := _refused(found, before, reference, now)) is not None:
        text = _printable(f"{reference.name}: {why}", _MESSAGE_LIMIT).rstrip(".") + "."
        store.record_failure(key, text, now)
        return Refreshed(key, "failed", kept_as_of, kept_at, text, file_as_of, gained, lost)
    if (older := _older(found, before)) is not None:
        text = (
            f"{reference.name}: the file fetched is as of {rp.long_date(older[0])}, older than "
            f"the stored set of {rp.long_date(older[1])}, which is kept."
        )
        return Refreshed(key, "kept", kept_as_of, kept_at, text, file_as_of, gained, lost)
    stale = _staleness(found, now)
    if stale is not None:
        found = replace(found, findings=(*found.findings, f"The file {stale}."))
    store.save(found)
    message = None if stale is None else f"{reference.name}: the file fetched {stale}."
    return Refreshed(key, "stored", file_as_of, found.stored_at, message, file_as_of, gained, lost)


def _compared(
    found: rp.Portfolio | None, before: rp.Portfolio | None
) -> tuple[date | None, tuple[str, ...], tuple[str, ...]]:
    """The file's as-of date and the fields it gained and lost against the stored set."""
    if found is None:
        return None, (), ()
    if before is None:
        return found.as_of, (), ()
    gained = tuple(sorted(_fields(found) - _fields(before)))
    return found.as_of, gained, tuple(sorted(_fields(before) - _fields(found)))


def ensure(store: rp.Store, key: str, *, now: datetime, wiring: Wiring | None = None) -> Ensured:
    """The key's stored set, fetched only when none is stored and the key has an address. A
    stored set is returned as it is, however old and whatever failure is recorded beside it: a
    newer file is fetched by `refresh`, on an analyst's action. A key with no address and no set
    (the CLO portfolio, a run's own) is reported as not supplied; a stored file that cannot be
    read is reported and not fetched over."""
    try:
        return Ensured(key, store.load(key))
    except rp.NotStored:
        pass
    except rp.StoreError as error:
        return Ensured(key, None, str(error))
    known = rp.STANDING.get(key)
    if known is None or known.url is None:
        name = key if known is None else known.name
        return Ensured(key, None, f"{_printable(name, _ECHO_LIMIT)}: not supplied.")
    done = refresh(store, key, now=now, wiring=wiring)
    if done.outcome != "stored":
        return Ensured(key, None, done.message, done)
    return Ensured(key, store.load(key), None, done)
