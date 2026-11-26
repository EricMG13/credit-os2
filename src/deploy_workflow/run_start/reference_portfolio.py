"""A submission's comparison portfolio: a reference portfolio an analyst supplies for one run.

The report reads an issuer against three standing reference portfolios; an analyst may supply
another for a run (owner, 2026-11-25, R11). This is NOT the fund's portfolio workbook
(``attachments.portfolio_workbook``), which is a source document the modules read. A comparison
portfolio is never a source document: its files are kept in ``uploads/<id>/reference_portfolio``,
beside ``files`` and never in it, so the launcher, the reading, the run's ``drops`` folder and the
run context never hold them, and nothing here is sent to a model. It is optional in every pathway.

The files are hostile input under the uploads' own rules (``submissions``): one safe name part,
no link, a length judged before a byte is read, a temporary name renamed into place, the shared
lock and reservations, and the store-wide byte ceiling. They are few and small (``MAX_FILES``,
``MAX_FILE``): they are read whole into memory to be parsed.

The summary's digest covers the name, what it holds and each file's name and hash (``folded``),
so the portfolio the analyst approved is the one stored; a submission with no portfolio file has
the digest it always had. On Submit the parsed set is saved for the run under
``_engine/reference_portfolios/runs/<run id>`` (``run_store``), key ``custom``, stored at the
submit time. Carrying an earlier run's files (``submissions.carry``) does not carry its
comparison portfolio: it is supplied for one run.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import shutil
import uuid
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, BinaryIO

from deploy_workflow import reference_portfolios as portfolios
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.run_start import submissions
from deploy_workflow.run_start.submissions import REFERENCE_FOLDER, Refused

MAX_FILE = 20 * 1024 * 1024
MAX_FILES = 4  # holdings, constraints, mandate and one more
NAME_AT_MOST = 80
KEY = "custom"
HOLDS: Mapping[str, portfolios.AssetType | None] = {"": None, "loans": "loan", "bonds": "bond"}
_TYPES = (".csv", ".xlsx")
_META = "reference_portfolio.json"
_RUN_ID = re.compile(r"[0-9A-Za-z._-]{1,80}")  # the service's run id; "." and ".." are refused
_NAME_RULE = (
    f"Give the comparison portfolio a name of at most {NAME_AT_MOST} characters, "
    "on one line and without control characters."
)
_NO_NAME = "Give the comparison portfolio a name."
_UNREADABLE = "The files could not be read as a portfolio's holdings."
# What a reader is told a position's field is, in `reference_portfolios.FIELDS` order.
_FIELD_WORDS: Mapping[str, str] = {
    "borrower": "Borrower",
    "instrument": "Instrument",
    "figi": "FIGI",
    "ticker": "Ticker",
    "cusip": "CUSIP",
    "isin": "ISIN",
    "sedol": "SEDOL",
    "identifier": "Other identifier",
    "sector": "Sector",
    "rating": "Rating",
    "stated_bucket": "Rating bucket",
    "ranking": "Ranking",
    "lien": "Lien",
    "par": "Par",
    "market_value": "Market value",
    "currency": "Currency",
    "weight": "Weight",
    "margin": "Margin",
    "discount_margin": "Discount margin",
    "coupon": "Coupon",
    "ytm": "Yield",
    "maturity": "Maturity",
    "bid": "Bid",
    "ask": "Ask",
    "mid_price": "Mid price",
}

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Held:
    """What a submission holds as its comparison portfolio: the analyst's name for it, what it
    holds (a key of ``HOLDS``) and each stored file's bytes. There is one only when a file is."""

    name: str
    holds: str
    files: Mapping[str, bytes]


# --- Where things are -----------------------------------------------------------------------------


def standing_root(layout: Layout) -> Path:
    """The folder of the standing reference portfolios' store (``reference_portfolios.Store``)."""
    return layout.engine / "reference_portfolios"


def run_store(layout: Layout, run_id: str) -> portfolios.Store:
    """The store of the portfolio supplied for one run. ``Refused("unknown run")`` for an id that
    is not a run id's shape, so no path leaves the runs folder."""
    if not isinstance(run_id, str) or not _RUN_ID.fullmatch(run_id) or run_id in (".", ".."):
        raise Refused("unknown run")
    return portfolios.Store(standing_root(layout) / "runs" / run_id)


def run_portfolios(layout: Layout, run_id: str) -> tuple[portfolios.Summary, ...]:
    """The portfolios a run can be read against: the standing references, then the run's own."""
    standing = portfolios.Store(standing_root(layout))
    return portfolios.list_portfolios(standing, run_store(layout, run_id))


def _root(folder: Path) -> Path:
    """The submission's portfolio folder, which may not exist yet; a link there is refused."""
    root = folder / REFERENCE_FOLDER
    if root.is_symlink():  # a link planted here would be followed by every reader
        raise Refused("unknown submission")
    return root


def _open_root(folder: Path) -> Path:
    """``_root`` of a submission still open to changes; call with the lock held."""
    submissions._usable_root(folder)  # refuses a sealed submission and a linked ``files``
    return _root(folder)


def _file_name(name: str) -> str:
    """The stored name of an uploaded portfolio file: one safe part, a .csv or .xlsx file."""
    parts = submissions._parts(name)
    if len(parts) != 1 or parts[0].startswith("."):
        raise Refused(f"{name!r} must be a file name, without a folder")
    if not parts[0].lower().endswith(_TYPES):
        raise Refused(f"{parts[0]!r} must be a .csv or .xlsx file")
    return parts[0]


def _pending(sid: str) -> list[tuple[str, int]]:
    """The portfolio uploads of this submission still being written: (file name, size)."""
    mark = REFERENCE_FOLDER + "/"
    held = submissions._PENDING.get(sid, {}).values()
    return [(stored.removeprefix(mark), size) for stored, size in held if stored.startswith(mark)]


# --- Uploads --------------------------------------------------------------------------------------


def _reserve(layout: Layout, folder: Path, name: str, length: int) -> str:
    """Check the count and the store's ceiling against what is stored and in flight, and record
    the reservation (in the uploads' own table, so a seal and the sweep wait for it)."""
    sid, tmp = folder.name, f".part-{uuid.uuid4().hex}"
    with submissions._LOCK:
        root = _open_root(folder)
        submissions._refuse_links(root, [name])
        existing = submissions._stored(root) if root.is_dir() else {}
        submissions._refuse_fold_clash(name, [*existing, *(held for held, _ in _pending(sid))])
        others = (set(existing) | {pending for pending, _ in _pending(sid)}) - {name}
        if len(others) + 1 > MAX_FILES:
            raise Refused(f"a comparison portfolio is at most {MAX_FILES} files")
        store = length - existing.get(name, 0)
        store += sum(size for held in submissions._PENDING.values() for _, size in held.values())
        for other in submissions._open_folders(layout):
            store += submissions._reference_bytes(other)
            if not (other / "files").is_symlink():
                store += sum(submissions._stored(other / "files").values())
        if store > submissions.MAX_STORE:
            raise Refused("the service's storage for uploads is full; try again later")
        submissions._PENDING.setdefault(sid, {})[tmp] = (f"{REFERENCE_FOLDER}/{name}", length)
    return tmp


def _place(folder: Path, name: str, temp_path: Path) -> None:
    with submissions._LOCK:
        root = _open_root(folder)
        root.mkdir(exist_ok=True)
        submissions._refuse_links(root, [name])
        if (root / name).is_dir():
            raise Refused(f"{name!r} is already a folder")
        os.replace(temp_path, root / name)


def add_file(layout: Layout, sid: str, name: str, body: BinaryIO, length: int) -> str:
    """Store ``length`` bytes from ``body`` as one of the comparison portfolio's files and return
    the stored name. A name already stored is replaced; a refusal leaves nothing behind."""
    folder = submissions._folder(layout, sid)
    if submissions._is_sealed(folder):
        raise Refused("this submission has been submitted")
    stored = _file_name(name)
    if not isinstance(length, int) or isinstance(length, bool) or length < 0:
        raise Refused("the upload has no valid length")
    if length > MAX_FILE:
        raise Refused(f"a comparison portfolio file is at most {MAX_FILE // (1024 * 1024)} MB")
    tmp = _reserve(layout, folder, stored, length)
    temp_path = folder / tmp
    try:
        submissions._write(body, temp_path, length)
        _place(folder, stored, temp_path)
    finally:
        with submissions._LOCK:  # released first, as ``submissions.add_file`` does
            held = submissions._PENDING.get(sid, {})
            held.pop(tmp, None)
            if not held:
                submissions._PENDING.pop(sid, None)
        submissions._unlink_temporary(temp_path)
    submissions._touch(folder)
    return stored


def remove_file(layout: Layout, sid: str, name: str) -> None:
    """Remove one of the portfolio's files; the name and what it holds stay."""
    folder = submissions._folder(layout, sid)
    stored = _file_name(name)
    with submissions._LOCK:
        root = _open_root(folder)
        submissions._refuse_links(root, [stored])
        if not (root / stored).is_file():
            raise Refused(f"{stored!r} is not stored")
        (root / stored).unlink()
    submissions._touch(folder)


def remove(layout: Layout, sid: str) -> None:
    """Remove the comparison portfolio: its files, its name and what it holds. The submission is
    then one with no portfolio; removing none is not an error."""
    folder = submissions._folder(layout, sid)
    with submissions._LOCK:
        root = _open_root(folder)
        if _pending(sid):
            raise Refused("an upload is still in progress")
        if root.is_dir():
            shutil.rmtree(root)
        (folder / _META).unlink(missing_ok=True)
    submissions._touch(folder)


# --- The name, and what is held -------------------------------------------------------------------


def _named(name: object, holds: object) -> dict[str, str]:
    if not isinstance(holds, str) or holds not in HOLDS:
        raise Refused("what the comparison portfolio holds is loans, bonds or left unstated")
    trimmed = name.strip() if isinstance(name, str) else ""
    if not trimmed or len(trimmed) > NAME_AT_MOST or not trimmed.isprintable():
        raise Refused(_NAME_RULE)
    return {"name": trimmed, "holds": holds}


def _meta(folder: Path) -> dict[str, str]:
    """The stored name and what it holds; both empty when none was given or it cannot be read."""
    path = folder / _META
    try:
        if path.is_symlink():
            raise ValueError("a link")
        stored = json.loads(path.read_bytes())
        return _named(stored["name"], stored["holds"])
    except FileNotFoundError:
        pass
    except (OSError, ValueError, TypeError, KeyError) as error:  # Refused is a ValueError
        # Not fail-open: with files stored the reading then asks for the name again.
        log.warning("the comparison portfolio's name at %s cannot be read (%s)", path, error)
    return {"name": "", "holds": ""}


def _snapshot(layout: Layout, sid: str) -> tuple[dict[str, str], dict[str, bytes]]:
    """The name and every stored file's bytes, read as one step under the uploads' lock.

    Ceiling: at most ``MAX_FILES`` files of ``MAX_FILE`` bytes are read while the lock is held,
    which keeps other uploads waiting for that read; in exchange the name, the digest and the
    parsed portfolio are always of the same bytes."""
    folder = submissions._folder(layout, sid)
    with submissions._LOCK:
        root = _root(folder)
        files: dict[str, bytes] = {}
        if root.is_dir():
            for name, size in sorted(submissions._stored(root, strict=True).items()):
                with submissions.open_regular(root / name, size) as handle:
                    files[name] = handle.read()
        return _meta(folder), files


def held(layout: Layout, sid: str) -> Held | None:
    """The submission's comparison portfolio, or None when it has no portfolio file."""
    meta, files = _snapshot(layout, sid)
    return Held(meta["name"], meta["holds"], files) if files else None


def folded(value: str, portfolio: Held | None) -> str:
    """``value`` (a digest) with the comparison portfolio folded in: its name, what it holds and
    each file's name and hash. Unchanged when there is none."""
    if portfolio is None:
        return value
    hashes = [[n, hashlib.sha256(raw).hexdigest()] for n, raw in sorted(portfolio.files.items())]
    covered = {"name": portfolio.name, "holds": portfolio.holds, "files": hashes}
    text = json.dumps(covered, sort_keys=True, ensure_ascii=True, separators=(",", ":"))
    return hashlib.sha256(f"{value}\nreference_portfolio={text}".encode("ascii")).hexdigest()


def parsed(portfolio: Held, stored_at: datetime) -> portfolios.Portfolio:
    """The held files as a typed portfolio under the key ``custom``. ``Refused`` with a sentence
    for a reader when it has no name or the files are not a portfolio's."""
    if not portfolio.name:
        raise Refused(_NO_NAME)
    reference = portfolios.custom(portfolio.name, key=KEY, asset_type=HOLDS[portfolio.holds])
    try:
        return portfolios.read_portfolio_files(
            portfolio.files, reference=reference, stored_at=stored_at
        )
    except portfolios.PortfolioFileError as error:
        raise Refused(str(error)) from error
    except Exception as error:  # hostile bytes: any parser failure is a refusal
        log.warning("a comparison portfolio could not be parsed", exc_info=True)
        raise Refused(_UNREADABLE) from error


def shown(portfolio: portfolios.Portfolio) -> dict[str, Any]:
    """What the page is told of a parsed portfolio: no file hash and no stored time."""
    return {
        "name": portfolio.name,
        "kind": portfolio.kind,
        "as_of": None if portfolio.as_of is None else portfolio.as_of.isoformat(),
        "positions": len(portfolio.positions),
        "unpriced": sum(portfolios.UNPRICED in item.flags for item in portfolio.positions),
        "limits": len(portfolio.limits),
        "found": [_FIELD_WORDS[name] for name, _ in portfolio.columns_found],
        "not_found": [_FIELD_WORDS[name] for name in portfolio.columns_missing],
        "findings": list(portfolio.findings),
    }


def _reading(meta: Mapping[str, str], files: Mapping[str, bytes]) -> dict[str, Any]:
    answer: dict[str, Any] = {**meta, "files": sorted(files), "portfolio": None, "error": ""}
    if files:
        try:
            read = parsed(Held(meta["name"], meta["holds"], files), datetime.now(UTC))
            answer["portfolio"] = shown(read)
        except Refused as refusal:
            answer["error"] = str(refusal)
    return answer


def reading(layout: Layout, sid: str) -> dict[str, Any]:
    """The submission's comparison portfolio as the page shows it: ``name``, ``holds``, ``files``
    and, when the files are a portfolio's, ``portfolio`` (``shown``); otherwise ``error`` says
    why in a sentence for a reader, and the rest of the submission is untouched."""
    return _reading(*_snapshot(layout, sid))


def name_it(layout: Layout, sid: str, name: object, holds: object) -> dict[str, Any]:
    """Record the analyst's name for the portfolio and what it holds, and return ``reading``."""
    meta = _named(name, holds)
    folder = submissions._folder(layout, sid)
    with submissions._LOCK:
        _open_root(folder)
        temp = folder / f".reference-{uuid.uuid4().hex}"
        try:
            temp.write_text(json.dumps(meta, ensure_ascii=True), encoding="ascii")
            os.replace(temp, folder / _META)
        finally:
            temp.unlink(missing_ok=True)
    submissions._touch(folder)
    return reading(layout, sid)


# --- The summary and Submit -----------------------------------------------------------------------


def bind(layout: Layout, sid: str, result: dict[str, Any]) -> dict[str, Any]:
    """A summary ``result`` with the submission's comparison portfolio bound in: the parsed
    portfolio under ``reference_portfolio`` and the digest folded over it. A result with no
    digest, or a submission with no portfolio file, is returned as it is. A portfolio that cannot
    be read replaces the result with an ``error`` and no digest, until it is fixed or removed."""
    if not result.get("digest"):
        return result
    portfolio = held(layout, sid)
    if portfolio is None:
        return result
    try:
        read = parsed(portfolio, datetime.now(UTC))
    except Refused as refusal:
        return {
            "error": f"The comparison portfolio cannot be read. {refusal} Replace its files or "
            "remove the comparison portfolio, then review the run again."
        }
    return {
        **result,
        "digest": folded(result["digest"], portfolio),
        "reference_portfolio": shown(read),
    }


@contextmanager
def kept_for_run(
    layout: Layout, run_id: str, portfolio: Held | None, stored_at: datetime
) -> Iterator[None]:
    """Save the approved comparison portfolio for a new run, then run the body (which saves the
    run's record); if the body fails the run's set is removed again. Nothing is written when
    there is no portfolio. ``Refused`` when the files cannot be parsed."""
    if portfolio is None:
        yield
        return
    store = run_store(layout, run_id)
    store.save(parsed(portfolio, stored_at))
    try:
        yield
    except BaseException:
        shutil.rmtree(store.root, ignore_errors=True)
        raise
