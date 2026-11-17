"""Project RBOT-HTML's run records and recorded milestones for the React activity pages."""

from __future__ import annotations

import json
import os
import re
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from deploy_workflow import http_base
from deploy_workflow.inbox import activity, runs
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.library_index import Refused, read_inside
from deploy_workflow.model.budget import BudgetError, exact_sum, read_reservation_snapshot
from deploy_workflow.model.pricing import money_text
from deploy_workflow.owners.cpos_launch import METHODS
from deploy_workflow.run_events import EVENTS, progress, read_events

_MODULE_EVENTS = frozenset({"module_started", "module_accepted", "draft_rejected"})
_RUN_EVENTS = frozenset(
    {"delivery_started", "delivered", "stopped", "changes_not_produced", "model_not_published"}
)
_FEED_LIMIT = 80
_ENDED: tuple[runs.Status, ...] = ("failed", "capped", "rejected", "interrupted")
_ENDED_SHOWN = 20
_PUBLISHED = "window.RUN_ACTIVITY="  # how deploy_workflow.inbox.activity.write opens the file
_EXECUTIONS = frozenset({"host-session", "retained-response-replay", "synthetic", "live-provider"})


def _usage(directory: Path) -> dict[str, str | None]:
    """Break cap usage into settled charges and unresolved holds from the same journal."""
    live = directory / "live"
    try:
        if not live.exists() and not live.is_symlink():
            settled = held = Decimal(0)
        else:
            if not live.is_dir():
                raise BudgetError("live is not a folder")
            rows = read_reservation_snapshot(live)
            settled = exact_sum(
                row.settled_usd
                for row in rows
                if row.status in ("settled", "overrun") and row.settled_usd is not None
            )
            held = exact_sum(row.usd for row in rows if row.status in ("unknown", None))
        return {
            "spent": money_text(exact_sum((settled, held))),
            "settled_spent": money_text(settled),
            "held": money_text(held),
        }
    except (BudgetError, OSError, RecursionError):
        return {"spent": None, "settled_spent": None, "held": None}


def _milestone(raw: dict[str, Any], modules: set[str]) -> dict[str, str] | None:
    name, at = raw.get("event"), raw.get("at")
    if not isinstance(name, str) or not isinstance(at, str):
        return None
    try:
        datetime.strptime(at, "%Y-%m-%dT%H:%M:%SZ")
    except ValueError:
        return None
    if name in _RUN_EVENTS:
        return {"kind": name, "at": at}
    module = raw.get("module")
    if name in _MODULE_EVENTS and isinstance(module, str) and module in modules:
        return {"kind": name, "at": at, "module": module}
    return None


def _feed(directory: Path, modules: set[str]) -> list[dict[str, str]] | None:
    try:
        events = read_events(directory / EVENTS)
    except FileNotFoundError:
        return []
    except (OSError, ValueError):
        return None
    milestones = [
        item
        for raw in events
        if isinstance(raw, dict) and (item := _milestone(raw, modules)) is not None
    ]
    return milestones[-_FEED_LIMIT:]


def _log_ended(directory: Path) -> bool:
    """Whether the run's log shows its launch ended: delivered, or a stop no later start followed.
    Read from the log, not the process: probing a PID the scheduler's ``Popen`` tracks could reap
    it and take its exit status (``runs.alive``)."""
    try:
        state = progress(e for e in read_events(directory / EVENTS) if isinstance(e, dict))
    except (OSError, ValueError):
        return False  # display only: no readable log is no sign of an end
    return state.delivered or state.stop is not None


def _manifest(directory: Path) -> dict[str, Any]:
    try:
        manifest = json.loads(read_inside(directory, "workflow.json"))
    except (Refused, OSError, ValueError, RecursionError):
        return {}
    return manifest if isinstance(manifest, dict) else {}


def _planned(manifest: dict[str, Any], fallback: list[list[str]]) -> list[list[str]]:
    instructions = manifest.get("instructions")
    if not isinstance(instructions, dict):
        return fallback
    codes = [code for code in instructions if code in METHODS]
    if not codes:
        return fallback
    states = dict(fallback)
    return [[code, states.get(code, "waiting")] for code in (*codes, "Report")]


def _cap(manifest: dict[str, Any], recorded: str | None) -> str | None:
    amount = manifest.get("provider_cap_usd")
    if isinstance(amount, str):
        try:
            pinned = Decimal(amount)
            if pinned.is_finite() and pinned >= 0:
                return str(pinned)
        except InvalidOperation:
            pass
    return recorded


def _held(layout: Layout) -> str:
    """Why the scheduler holds the queue or the ended runs, from the activity file it writes."""
    try:
        text = (layout.engine / "activity.js").read_text(encoding="utf-8")
        if not text.startswith(_PUBLISHED):
            return ""
        held = json.JSONDecoder().raw_decode(text, len(_PUBLISHED))[0]["held"]
    except (OSError, ValueError, LookupError, TypeError):
        # Documented fail-open (display only): with no readable file (none is written before the
        # first poll) the note is left out; the runs themselves are read from their records.
        return ""
    return held if isinstance(held, str) else ""


_PATH_START = r"(?P<start>^|[\s'\"(\[:=,;])"  # beginning of text, whitespace, a quote or bracket
_PATH_BODY = r"[^\s'\"()\[\],;]"  # a path runs to whitespace, a quote, a bracket, `,` or `;`
_ABSOLUTE = re.compile(
    _PATH_START
    + "(?P<path>"
    + rf"/(?!/){_PATH_BODY}+"  # POSIX: one leading slash (`//` follows a URL scheme's colon)
    + rf"|[A-Za-z]:[\\/]{_PATH_BODY}*"  # Windows drive, X:\ or X:/ (a doubled backslash is a run)
    + rf"|\\{{2,4}}{_PATH_BODY}+"  # UNC \\host\share, single or doubled spelling
    + ")"
)
# A quoted absolute path runs to its closing quote, so a space in a folder name does not end it.
_QUOTED = re.compile(
    r"(?P<q>['\"])(?P<path>(?:/(?!/)|[A-Za-z]:[\\/]|\\{2,4})(?:(?!(?P=q)).)*)(?P=q)"
)
_SEPARATORS = re.compile(r"[\\/]+")


def _name(path: str) -> str | None:
    """The last named segment of ``path``; None when it names nothing."""
    named = [p for p in _SEPARATORS.split(path) if p and not re.fullmatch(r"[A-Za-z]:", p)]
    return named[-1] if named else None


def _quoted_last_segment(found: re.Match[str]) -> str:
    name = _name(found["path"])
    return found["q"] + name + found["q"] if name else found[0]


def _last_segment(found: re.Match[str]) -> str:
    name = _name(found["path"])
    return found["start"] + name if name else found[0]


def _plain_reason(root: str, sep: str, reason: str) -> str:
    """A reason with no absolute path: the service root is removed and any other path keeps its
    last segment.

    1. ``root`` plus a separator is removed where it starts a path, in plain and backslash-doubled
       form, leaving the path relative to the root.
    2. The bare root becomes ``the service folder``.
    3. Any absolute path left (POSIX, Windows drive, UNC) keeps only its last segment.

    A path starts at the beginning of the text or after whitespace, a quote, a bracket, ``:``,
    ``=``, ``,`` or ``;``. A URL, a fraction (``3/4``) and a relative path stay as stored.

    A quoted path runs to its closing quote, so a space in a folder name is handled there. An
    unquoted path stops at the first space: a folder name with a space in an unquoted path keeps
    its tail (a known limit; the text marks no end).
    """
    if root.rstrip(sep):
        prefix = root + sep
        for form in {prefix, prefix.replace("\\", "\\\\")}:
            reason = re.sub(rf"{_PATH_START}{re.escape(form)}", r"\g<start>", reason)
        for form in {root, root.replace("\\", "\\\\")}:
            # The bare root: at a path start, then the end, a delimiter, or a full stop that ends.
            bare = rf"{_PATH_START}{re.escape(form)}(?=$|[\s'\")\],;]|\.(?:$|\s))"
            reason = re.sub(bare, r"\g<start>the service folder", reason)
    return _ABSOLUTE.sub(_last_segment, _QUOTED.sub(_quoted_last_segment, reason))


def _shown(layout: Layout, reason: str) -> str:
    """A reason without absolute paths, from the service's own root folder."""
    return _plain_reason(str(layout.root.resolve()), os.sep, reason)


_TEXT_FIELDS = (
    "id",
    "issuer_name",
    "pathway",
    "status",
    "reason",
    "submitted_by",
    "claimed_at",
    "started_at",
    "ended_at",
)


def _texts_are_strings(record: runs.Record) -> bool:
    return all(isinstance(getattr(record, name), str) for name in _TEXT_FIELDS)


def listing(layout: Layout) -> http_base.Reply:
    """The runs that are running or waiting, and the latest that ended without a report.

    Spend, run folders and absolute paths are not sent. A reason is sent as stored with the root
    prefix removed and any other absolute path cut to its last segment, so a file name can appear in
    it: it tells the operator which file to look at.
    """
    # Documented fail-open (display only): a record file that cannot be read, or whose text fields
    # are not strings, is left out of the list and counted in ``unreadable``. The scheduler skips a
    # file it cannot read (one slot, one daily start, a ``held`` note); a record whose text fields
    # are not strings it tracks like any other.
    readable, bad_files = runs.load_readable(layout)
    saved = [item for item in readable if _texts_are_strings(item)]
    unreadable = len(bad_files) + len(readable) - len(saved)
    records = [item for item in saved if item.status in ("running", "queued")]
    every_ended = [item for item in saved if item.status in _ENDED]
    ended = sorted(
        every_ended, key=lambda item: (item.ended_at or item.claimed_at, item.id), reverse=True
    )[:_ENDED_SHOWN]
    snapshot = activity.snapshot(layout, records, now=datetime.now(UTC), held=_held(layout))
    root = layout.runs.resolve()
    return http_base.Reply(
        200,
        {
            "updated": snapshot["updated"],
            "held": snapshot["held"],
            "runs": [
                {
                    "id": shown["id"],
                    "issuer_name": shown["issuer_name"],
                    "pathway": shown["pathway"],
                    "status": shown["status"],
                    "reason": _shown(layout, shown["reason"]),
                    "submitted_by": shown["submitted_by"],
                    "started_at": shown["started_at"],
                    "name_differs": shown["name_differs"],
                    "stalled": shown.get("stalled", False),
                    "files": len(shown["files"]),
                    "modules": _planned(
                        _manifest(root / shown["id"]),
                        shown.get("modules", activity.module_states(shown["pathway"], [])),
                    ),
                }
                for shown in snapshot["runs"]
            ],
            "ended": [
                {
                    "id": item.id,
                    "issuer_name": item.issuer_name,
                    "pathway": item.pathway,
                    "status": item.status,
                    "reason": _shown(layout, item.reason),
                    "ended_at": item.ended_at,
                    "submitted_by": item.submitted_by,
                }
                for item in ended
            ],
            "ended_total": len(every_ended),
            "unreadable": unreadable,
        },
        {"Cache-Control": "no-store"},
    )


def reply(layout: Layout, run_id: str) -> http_base.Reply:
    readable, bad_files = runs.load_readable(layout)
    if f"{run_id}.json" in bad_files:
        # As before: a run whose own record cannot be read is an error, not an answer.
        raise ValueError(f"{run_id}.json: unreadable run record")
    record = next((item for item in readable if item.id == run_id), None)
    if record is None:
        raise http_base.refuse(404, "unknown run")
    directory = layout.runs.resolve() / run_id
    if directory.resolve() != directory or (directory / EVENTS).is_symlink():
        raise http_base.refuse(404, "run activity is unavailable")
    snapshot = activity.snapshot(layout, [record], now=datetime.now(UTC))
    [shown] = snapshot["runs"]
    usage = _usage(directory)
    states = shown.get("modules", activity.module_states(record.pathway, []))
    manifest = _manifest(directory)
    modules = _planned(manifest, states)
    execution = manifest.get("execution")
    return http_base.Reply(
        200,
        {
            "id": record.id,
            "issuer_name": record.issuer_name,
            "as_of": record.as_of,
            "pathway": record.pathway,
            "status": record.status,
            "reason": _shown(layout, record.reason),
            "claimed_at": record.claimed_at,
            "started_at": record.started_at,
            "ended_at": record.ended_at,
            "submitted_by": record.submitted_by,
            "observed_at": snapshot["updated"],
            "approved_summary_limits": record.approved_summary_limits,
            "execution": execution
            if isinstance(execution, str) and execution in _EXECUTIONS
            else None,
            "cap": _cap(manifest, shown.get("cap")),
            **usage,
            "stalled": shown.get("stalled", False),
            # The listing's `held` (`held` here is the reserved amount, from `_usage`), for a run
            # that waits on the service: queued, or kept "running" after its log ended (a
            # library that could not be rebuilt); none for a run that is running.
            "held_reason": _shown(layout, _held(layout))
            if record.status == "queued" or (record.status == "running" and _log_ended(directory))
            else "",
            "modules": modules,
            "events": _feed(directory, {code for code, _ in modules}),
        },
        {"Cache-Control": "no-store"},
    )
