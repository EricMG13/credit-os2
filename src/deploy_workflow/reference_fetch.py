"""Fetch a standing reference portfolio's holdings workbook and store it; the only place
reference portfolios use the network.

Only a standing reference that has an address is fetched (`reference_portfolios.STANDING`: the
loan-index fund and the high-yield fund). The address is that constant's and nothing else's: no
function here takes an address, and a key that has none is refused (`NotFetchable`).

The fetch is Signal's (`signal.fetch.fetch_document`, on `research.webfetch`): https only, a
plain host name resolving only to public addresses, the connection pinned to the checked
address, redirects re-checked hop by hop, 10 seconds per socket operation, no content encoding,
a body no shorter than its declared length. This module sets:

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
undated one could not be told from an older one. A file whose as-of date is older than the
stored set's does not replace it (outcome `kept`, not a failure). A file with the same or a
later date replaces it, stored with the fetch time.

Whatever fails (the address, the connection, the answer, the file), `refresh` records it in the
store, leaves the stored set as it was and returns the failure with that set's as-of date. It
raises only for a caller's mistake (a key that is not fetched, a time not in UTC) or a store
that cannot be written. One fetch per call: no retry, no schedule, no thread, and nothing at
import.
"""

from __future__ import annotations

import io
import posixpath
import time
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import date, datetime, timedelta
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
_ZIP_MAGIC = b"PK\x03\x04"
_MESSAGE_LIMIT = 300
_ECHO_LIMIT = 80
_MONTHS = (
    *("January", "February", "March", "April", "May", "June", "July"),
    *("August", "September", "October", "November", "December"),
)

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
    """What a refresh did. `stored`: the fetched file is now the key's set. `kept`: the file was
    read and is older than the stored set, which stays. `failed`: nothing was stored and the
    failure is recorded in the store.

    `as_of` and `stored_at` are those of the set in the store after the call: on `kept` and
    `failed` the previous set's, None when there is none. `message` is a sentence for a reader on
    `kept` and `failed`, None on `stored`. `file_as_of` is the date the fetched file states, None
    on `failed`. `columns_gained` and `columns_lost` are the fields the file's header has and the
    previous set's had not, and the reverse; both empty with no previous set or an unread file."""

    key: str
    outcome: Outcome
    as_of: date | None = None
    stored_at: datetime | None = None
    message: str | None = None
    file_as_of: date | None = None
    columns_gained: tuple[str, ...] = ()
    columns_lost: tuple[str, ...] = ()

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


def _document(url: str, wiring: Wiring) -> bytes:
    """The workbook's bytes from `url`, or `_Failed`."""
    rules = signal_fetch.Rules(
        what="holdings file",
        accept=ACCEPT,
        user_agent=USER_AGENT,
        total_seconds=TOTAL_SECONDS,
        max_bytes=wiring.max_bytes,
    )
    try:
        got = signal_fetch.fetch_document(
            url,
            rules,
            resolve=wiring.resolve,
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
        raise _Failed("the file states no as-of date")
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


def _long_date(when: date) -> str:
    return f"{when.day} {_MONTHS[when.month - 1]} {when.year}"


def refresh(store: rp.Store, key: str, *, now: datetime, wiring: Wiring | None = None) -> Refreshed:
    """Fetch the standing reference `key`'s holdings workbook once and store it with `now` (UTC,
    the fetch time) as its stored time. See the module's note for what is refused and what a
    failure leaves in place. Raises `NotFetchable` for a key with no address and ValueError for a
    `now` not in UTC, both before anything is fetched or written."""
    reference, url = _fetchable(key)
    if now.tzinfo is None or now.utcoffset() != timedelta(0):
        raise ValueError("the fetch time must be a datetime in UTC")
    wiring = wiring or Wiring()
    before = _previous(store, key)
    kept_as_of = None if before is None else before.as_of
    kept_at = None if before is None else before.stored_at
    try:
        raw = _document(url, wiring)
        _check_archive(raw, wiring.max_expanded_bytes)
        found = _read(raw, reference, url, now)
    except _Failed as error:
        text = _printable(f"{reference.name}: {error}", _MESSAGE_LIMIT).rstrip(".") + "."
        store.record_failure(key, text, now)
        return Refreshed(key, "failed", kept_as_of, kept_at, text)
    gained = () if before is None else tuple(sorted(_fields(found) - _fields(before)))
    lost = () if before is None else tuple(sorted(_fields(before) - _fields(found)))
    file_as_of = found.as_of
    if file_as_of is not None and kept_as_of is not None and file_as_of < kept_as_of:
        text = (
            f"{reference.name}: the file fetched is as of {_long_date(file_as_of)}, older than "
            f"the stored set of {_long_date(kept_as_of)}, which is kept."
        )
        return Refreshed(key, "kept", kept_as_of, kept_at, text, file_as_of, gained, lost)
    store.save(found)
    return Refreshed(key, "stored", file_as_of, found.stored_at, None, file_as_of, gained, lost)


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
