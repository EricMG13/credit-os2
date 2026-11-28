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
from deploy_workflow.inbox.plain_reason import plain_reason as _plain_reason
from deploy_workflow.library_index import Refused, read_inside
from deploy_workflow.model.budget import BudgetError, exact_sum, read_reservation_snapshot
from deploy_workflow.model.pricing import money_text
from deploy_workflow.owners.cpos_launch import METHODS
from deploy_workflow.run_events import EVENTS, progress, read_events

from .run_metadata import execution, library_admission, module_outputs

_MODULE_EVENTS = frozenset({"module_started", "module_accepted", "draft_rejected"})
_RUN_EVENTS = frozenset(
    {"delivery_started", "delivered", "stopped", "changes_not_produced", "model_not_published"}
)
_FEED_LIMIT = 80
_ENDED: tuple[runs.Status, ...] = ("failed", "capped", "rejected", "interrupted")
_ENDED_SHOWN = 20
_PUBLISHED = "window.RUN_ACTIVITY="  # how deploy_workflow.inbox.activity.write opens the file


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


_TRY_AGAIN = "To try again, choose Use this run’s inputs on the run's page."
_REPEATS = "If it ends the same way again, ask whoever runs the service to check the run's"
_ASK_LOG = f"{_REPEATS} log."
_ASK_RECORD = f"{_REPEATS} record."
# The scheduler writes the details of a failure of its own (a start, a filing, a save, a rebuild)
# to the service's log, not to the run's log (``logs/<run>.log`` holds only the launcher's output).
_SERVICE_LOG_THEN_TRY_AGAIN = (
    "Ask whoever runs the service to check the service's log, then choose Use this run’s inputs on "
    "the run's page."
)
_NO_REASON = (
    f"The run ended before it finished, and the service recorded no reason. {_TRY_AGAIN} {_ASK_LOG}"
)
_UNCLASSIFIED = (
    f"The run stopped for a reason the service did not classify. {_TRY_AGAIN} {_ASK_LOG}"
)
_NOT_LISTED = (
    "The run finished, but the library would not list it, so it has no report. "
    f"{_TRY_AGAIN} {_ASK_RECORD}"
)
_DELIVERIES = (
    "The run finished, but the service did not find exactly one delivery for it, so it has no "
    f"report. {_TRY_AGAIN} {_ASK_RECORD}"
)
_NOT_FILED = (
    "The run finished, but the service could not file its report. Ask whoever runs the service "
    "to check the service's log before starting it again."
)
_NOT_STARTED = f"The run could not be started, so it did not run. {_SERVICE_LOG_THEN_TRY_AGAIN}"
_NOT_SAVED = (
    "The service stopped this run because it could not save the run's record. "
    f"{_SERVICE_LOG_THEN_TRY_AGAIN}"
)
_NO_CONTEXT = f"The run's submission record was missing, so it was not started. {_TRY_AGAIN}"
_NOT_REBUILT = (
    "The library could not be rebuilt, so runs that have ended wait to be filed. The service "
    "tries again on each check; if this stays, ask whoever runs the service to check the "
    "service's log."
)
_STOPPED = re.compile(r"stopped: (?P<kind>.*)", re.DOTALL)  # ``outcome``: the log's stop kind
_STOPS = {  # the kinds ``run_events.stop_reason`` writes (budget ends as "capped", not here)
    "provider": (
        "The run stopped because of a problem with a model provider call, not because it "
        f"reached the spending cap. {_TRY_AGAIN}"
    ),
    "checker": f"The run stopped because a module's answer did not pass the checks. {_TRY_AGAIN}",
    "interrupted": f"The run was interrupted before it finished. {_TRY_AGAIN}",
    "ruling": (  # ``LivePauseInForce``: the recorded approval of paid model calls is not in place
        "The run stopped because the approval that lets the service make paid model calls was not "
        "in place for this setup. Starting it again will stop the same way until whoever runs the "
        "service puts it in place."
    ),
}
# The scheduler's other failure reasons (``runs.outcome``, ``Scheduler``), each with the
# reader's sentence. The stored text, with its exit code, log path, file and module codes, stays
# in the run record.
_REASONS = (
    (re.compile(r"launcher exited -?\d+; see logs/\S+\.log"), _NO_REASON),  # -N: signal N
    (re.compile(r"not listed: .*", re.DOTALL), _NOT_LISTED),
    (re.compile(r"expected one deliveries/\*/delivery\.json, found \d+"), _DELIVERIES),
    (re.compile(r"could not be filed: .*", re.DOTALL), _NOT_FILED),
    (re.compile(r"could not be started: .*", re.DOTALL), _NOT_STARTED),
    (
        re.compile(r"stopped by the scheduler: its record could not be saved .*", re.DOTALL),
        _NOT_SAVED,
    ),
    (
        re.compile(r"no context\.json in _engine/drops/\S+; submit it again from the run page"),
        _NO_CONTEXT,
    ),
)


# The held note's rebuild failure, with the library's error in parentheses (``Scheduler``). The
# scheduler joins its held notes with "; ", so another note may follow it.
_REBUILD_NOTE = re.compile(
    r"the library could not be rebuilt \(.*?\); ended runs wait for it(?P<more>; (?P<next>.?))?",
    re.DOTALL,
)


def _in_readers_words(reason: str) -> str:
    """A failure reason or held note the scheduler wrote, as what happened and what to do; any
    other text as stored."""
    if stopped := _STOPPED.fullmatch(reason):
        return _STOPS.get(stopped["kind"], _UNCLASSIFIED)
    for pattern, text in _REASONS:
        if pattern.fullmatch(reason):
            return text
    return _REBUILD_NOTE.sub(
        lambda note: _NOT_REBUILT + (" " + note["next"].upper() if note["more"] else ""), reason
    )


def _stopped_by(reason: str) -> str:
    """The kind of stop the run's log ended on, when the scheduler stored one the page has a
    sentence for (``_STOPS``); else empty. The page words a module's stop by it: a checker stop is
    the module the checks refused."""
    stopped = _STOPPED.fullmatch(reason)
    return stopped["kind"] if stopped and stopped["kind"] in _STOPS else ""


def _shown(layout: Layout, reason: str) -> str:
    """A reason in the reader's words, and without absolute paths, from the service's own root
    folder."""
    return _plain_reason(str(layout.root.resolve()), os.sep, _in_readers_words(reason))


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

    Spend, run folders and absolute paths are not sent. A failure reason or held note the
    scheduler wrote (an exit code and log path, a library refusal, a failed library rebuild) is
    sent as a sentence for the reader; any other
    reason is sent as stored with the root prefix removed and any other absolute path cut to its
    last segment, so a file name can appear in it. The stored reason stays in the run record.
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
    by_id = {item.id: item for item in records}
    return http_base.Reply(
        200,
        {
            "updated": snapshot["updated"],
            "held": _shown(layout, snapshot["held"]),
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
                        shown.get(
                            "modules",
                            activity.module_states(
                                shown["pathway"], [], by_id[shown["id"]].modules
                            ),
                        ),
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
    states = shown.get("modules", activity.module_states(record.pathway, [], record.modules))
    manifest = _manifest(directory)
    modules = _planned(manifest, states)
    return http_base.Reply(
        200,
        {
            "id": record.id,
            "issuer_name": record.issuer_name,
            "as_of": record.as_of,
            "pathway": record.pathway,
            "status": record.status,
            "reason": _shown(layout, record.reason),
            "stopped_by": _stopped_by(record.reason),
            "claimed_at": record.claimed_at,
            "started_at": record.started_at,
            "ended_at": record.ended_at,
            "submitted_by": record.submitted_by,
            "observed_at": snapshot["updated"],
            "approved_summary_limits": record.approved_summary_limits,
            "module_outputs": module_outputs(directory, record),
            "library_admission": library_admission(layout, record),
            "execution": execution(directory, record, manifest),
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
