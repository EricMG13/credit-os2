"""Run records and the launcher child process: save, load, launch, liveness, outcome."""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import sys
import unicodedata
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass, fields
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Literal, cast, get_args

from deploy_vii.contracts import PATHWAY_CAP_USD, PathwayId
from deploy_workflow import platform_io
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.model.configs import CONFIGS
from deploy_workflow.owners.cpos_launch_methods import METHODS, PHASES
from deploy_workflow.run_events import EVENTS, progress, read_events
from deploy_workflow.run_expectations import Item

log = logging.getLogger(__name__)

Status = Literal["queued", "running", "finished", "failed", "capped", "rejected", "interrupted"]

_REGISTRY = "issuers.json"
DEFAULT_MAX_TURNS = 32
_TURNS = (1, 64)  # the range submissions.validated accepts
_PRIOR = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*")  # a run folder name, or `none`
FORECAST_CODE = "CP-MODEL"  # in a module list: publish the forecast (cpos_launch.py)
MODELS = ("gpt", "claude", "luna")
EFFORTS = ("fast", "balanced", "high", "xhigh")
# Service launch configurations. Every name is checked against the standing ruling at startup.
_LAUNCHES: dict[tuple[str, str], str] = {
    ("gpt", "fast"): "copilot-sol-medium",
    ("gpt", "balanced"): "copilot-sol-medium",
    ("gpt", "high"): "copilot-sol-high",
    ("claude", "fast"): "copilot-opus-medium",
    ("claude", "balanced"): "copilot-opus-medium",
    ("claude", "high"): "copilot-opus-high",
    ("luna", "xhigh"): "copilot-luna-xhigh",
}
LAUNCH_CONFIGS = tuple(dict.fromkeys(_LAUNCHES.values()))


@dataclass
class Record:
    id: str
    pathway: str
    folder: str
    status: Status
    claimed_at: str
    issuer_id: str = ""
    issuer_name: str = ""
    as_of: str = ""
    files: tuple[str, ...] = ()
    started_at: str = ""
    ended_at: str = ""
    pid: int = 0
    reason: str = ""
    report: str = ""  # posix path relative to the root
    name_differs: bool = False
    prepared: bool = False  # the offline check passed; only then may the run be started
    submission: str = ""  # the start page's submission ID; empty for a folder drop
    modules: tuple[str, ...] = ()  # () = the pathway's modules
    max_turns: int = DEFAULT_MAX_TURNS
    level: str = ""
    # Records written before the model and effort choice ran all-medium on GPT Sol.
    model: str = "gpt"
    effort: str = "fast"
    submitted_by: str = ""
    digest: str = ""  # the approved digest of the submitted files; the move is checked against it
    prior: str = ""  # the earlier run the approval named (a run folder name or `none`); "": search
    cap: str = ""  # USD the approved summary showed (`cap_of`); "": written before per-pathway caps
    # Exact decision items from the issued summary; None means a record predates this metadata.
    approved_summary_limits: list[Item] | None = None
    newest_document_date: str = ""  # Optional approved override for sealed-upload recovery.
    config: str = ""  # Copilot config shown when approved. Older records predate the cutover.


def approved_summary_limits(value: object) -> list[Item] | None:
    """Validate stored reader metadata without rebuilding or interpreting its limitations."""
    if value is None:
        return None
    fields = ("id", "scope", "outcome", "reason", "fix")
    if not isinstance(value, list) or any(
        not isinstance(item, dict)
        or not all(isinstance(item.get(key), str) for key in fields)
        or item["outcome"] not in ("will_refuse", "gap", "limited", "check")
        for item in value
    ):
        raise ValueError("approved summary limits could not be read")
    return cast(list[Item], value)


# The one cap of the standing ruling before per-pathway caps (ruling 2026-11-11-run-start-submit):
# what the summary a record without a cap was approved on showed.
LEGACY_CAP = Decimal(20)


def cap_of(record: Record) -> Decimal:
    """The USD cap the record's run launches with (ruling 2026-11-15-pathway-tiers-and-caps).

    A record keeps the cap its approved summary showed, which may not pass its pathway's cap in
    ``PATHWAY_CAP_USD``. A record written before per-pathway caps holds none: its summary showed
    ``LEGACY_CAP``, so it runs at the lower of that and its pathway's cap, never at more than was
    approved or than the table now allows. ``ValueError`` for an unknown pathway or a cap that is
    not an amount within those bounds (a hand-edited record)."""
    ceiling = PATHWAY_CAP_USD.get(cast(PathwayId, record.pathway))
    if ceiling is None:
        raise ValueError(f"run {record.id}: pathway {record.pathway!r} has no cap")
    if record.cap == "":
        return min(LEGACY_CAP, ceiling)
    try:
        value = Decimal(record.cap) if isinstance(record.cap, str) else Decimal("NaN")
    except InvalidOperation:
        value = Decimal("NaN")
    if not (value.is_finite() and 0 < value <= ceiling):
        raise ValueError(
            f"run {record.id}: cap {record.cap!r} is not an amount above zero and at most the "
            f"{record.pathway} cap USD {ceiling}"
        )
    return value


TEAMS_WEBHOOK_VARIABLE = "CREDIT_OS_TEAMS_WEBHOOK"  # read by deploy_workflow.inbox.teams
PID_FILE_VARIABLE = "DEPLOY_WORKFLOW_PID_FILE"  # the launcher reads the same name


def pid_file(layout: Layout, run_id: str) -> Path:
    """Where a run's launcher writes its own process ID: beside the run's record file."""
    return layout.state / f"{run_id}.pid"


_SRC = Path(__file__).resolve().parents[2]


def child_environment() -> dict[str, str]:
    """The environment for a launcher child: this process's, plus the engine's ``src`` folder
    first on ``PYTHONPATH`` (so a child started outside the project's environment still finds it)
    and UTF-8 output. The provider key
    passes through untouched; the Teams webhook, a secret no run needs, is left out."""
    env = dict(os.environ)
    env.pop(TEAMS_WEBHOOK_VARIABLE, None)
    existing = env.get("PYTHONPATH")
    env["PYTHONPATH"] = os.pathsep.join([str(_SRC), existing] if existing else [str(_SRC)])
    env["PYTHONUTF8"] = "1"
    return env


def save(layout: Layout, record: Record) -> None:
    """Write state/<id>.json through a temporary file, then ``os.replace`` it into place."""
    if not record.id or Path(record.id).name != record.id or record.id.startswith("."):
        raise ValueError(f"run ID {record.id!r} is not a plain file name")
    target = layout.state / f"{record.id}.json"
    platform_io.write_atomic(target, json.dumps(asdict(record), indent=2), sync=True)


def _typed(record: Record) -> None:
    """``ValueError`` naming the first field whose value is not its declared type.

    A hand-edited record must not reach ``alive`` or the clock code as a wrong type, which would
    stop the poll loop; it lands in the unreadable path instead. ``approved_summary_limits`` is
    checked by its own validator."""
    kinds = {"int": int, "bool": bool, "str": str, "Status": str}
    for field in fields(Record):
        value, kind = getattr(record, field.name), str(field.type)
        if kind in ("int", "bool"):  # bool is an int: neither may stand in for the other
            good = type(value) is kinds[kind]
        elif kind in kinds:
            good = isinstance(value, str)
        elif kind == "tuple[str, ...]":
            good = isinstance(value, tuple) and all(isinstance(v, str) for v in value)
        else:
            continue
        if not good:
            raise ValueError(f"{field.name} is not a valid {kind}")


def _names(value: object) -> tuple[object, ...]:
    if not isinstance(value, list):
        raise TypeError("a name list is not a list")
    return tuple(value)


def _load(path: Path) -> Record:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        data["files"] = _names(data.get("files", []))
        data["modules"] = _names(data.get("modules", []))
        data["approved_summary_limits"] = approved_summary_limits(
            data.get("approved_summary_limits")
        )
        record = Record(**data)
        _typed(record)
        if record.status not in get_args(Status):
            raise ValueError(f"unknown status {record.status!r}")
        return record
    except (OSError, ValueError, TypeError, AttributeError) as error:
        raise ValueError(f"{path.name}: unreadable run record ({error})") from error


def _record_files(layout: Layout) -> list[Path]:
    return [
        p for p in layout.state.glob("*.json") if p.name != _REGISTRY and not p.name.startswith(".")
    ]


def load_all(layout: Layout) -> list[Record]:
    """Every run record, sorted by id. The issuer registry, temporary files and dot files (such as
    a Mac ``._x.json`` sidecar) are not records."""
    return sorted((_load(p) for p in _record_files(layout)), key=lambda r: r.id)


def name_key(text: str) -> str:
    """Compare names by this key: file systems may ignore case and Unicode form (NFC or NFD)."""
    return unicodedata.normalize("NFC", text).casefold()


def load_readable(layout: Layout) -> tuple[list[Record], list[str]]:
    """The readable run records sorted by id, and the sorted file names of those ``_load`` refuses.

    For callers that must keep working beside a bad file; ``load_all`` still raises on one. Each
    caller decides what a skipped file means (the scheduler holds a slot for it, admission hides
    its run, the run lookups refuse that run) and says so. Nothing is logged here, as this runs on
    every poll of the activity page.
    """
    records: list[Record] = []
    unreadable: list[str] = []
    for path in _record_files(layout):
        try:
            record = _load(path)
        except ValueError:
            unreadable.append(path.name)
            continue
        if isinstance(record.id, str):  # a hand-edited id of another type cannot be sorted
            records.append(record)
        else:
            unreadable.append(path.name)
    return sorted(records, key=lambda r: r.id), sorted(unreadable)


def alive(pid: int) -> bool:
    """Whether process ``pid`` is running. For adopted PIDs (a record read after a restart).

    On a PID a live ``Popen`` tracks, use ``Popen.poll()`` instead: on POSIX this reaps the
    process with ``waitpid``, which would take the exit status away from the ``Popen``.
    """
    if pid <= 0:
        return False
    # ponytail: a reused process ID reads as alive; add the creation time if that ever bites.
    if sys.platform == "win32":
        # os.kill(pid, 0) terminates a process on Windows; wait on a handle instead.
        import ctypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        handle = kernel32.OpenProcess(0x00100000, False, pid)  # SYNCHRONIZE
        running = ctypes.get_last_error() == 5  # no handle: access denied means it exists
        if handle:
            try:
                running = bool(kernel32.WaitForSingleObject(handle, 0) == 0x102)  # still running
            finally:
                kernel32.CloseHandle(handle)
        return running
    try:
        try:
            reaped, _status = os.waitpid(pid, os.WNOHANG)
        except ChildProcessError:
            os.kill(pid, 0)  # not our child
        else:
            return reaped == 0  # 0: our child, still running; else it had exited and is reaped
    except (ProcessLookupError, OverflowError):
        return False
    except PermissionError:
        return True
    return True


def launch_options(model: str, effort: str) -> tuple[str, bool]:
    """The launcher ``--config`` and whether ``--balanced`` follows it, for a model and effort."""
    try:
        return _LAUNCHES[model, effort], effort == "balanced"
    except (KeyError, TypeError):
        raise ValueError(f"no launch for model {model!r} at effort {effort!r}") from None


def available_choices(
    models: Mapping[str, frozenset[str]] | None,
) -> dict[str, list[str]]:
    """Map a verified seat catalogue to intake choices. None is reserved for synthetic runs."""
    choices: dict[str, list[str]] = {}
    for (model, effort), config in _LAUNCHES.items():
        selected = CONFIGS[config]
        required = {selected.effort, "high"} if effort == "balanced" else {selected.effort}
        if models is None or required <= models.get(selected.model, frozenset()):
            choices.setdefault(model, []).append(effort)
    return choices


def config_for(model: str, effort: str) -> str:
    """The configuration a run of this model and effort launches with."""
    return launch_options(model, effort)[0]


def known_module(name: object, pathway: str = "") -> bool:
    """Whether ``name`` may stand in the launcher's ``--modules``: a method, or the forecast code.

    The launcher takes CP-MODEL there to mean "publish the forecast" (it makes no model call and
    has no method of its own; cpos_launch.py, owner 2026-11-11). Custom selections
    may also pass known phase names. The planner checks that their parents were chosen."""
    return isinstance(name, str) and (
        name in METHODS or name == FORECAST_CODE or (pathway == "custom" and name in PHASES)
    )


def _check_options(record: Record) -> None:
    """``ValueError`` unless the record's modules are method names or the forecast code, its
    turns a whole number in range and its model and effort known: a hand-edited record must not
    put an option of its own into the launcher's argv."""
    for field, allowed in (("model", MODELS), ("effort", EFFORTS)):
        value = getattr(record, field)
        if not isinstance(value, str) or value not in allowed:
            raise ValueError(
                f"run {record.id}: {field} {value!r} is not one of {', '.join(allowed)}"
            )
    config, _ = launch_options(record.model, record.effort)
    if record.config and record.config != config:
        raise ValueError("the recorded model configuration changed; review the run again")
    for name in record.modules:
        if not known_module(name, record.pathway):
            raise ValueError(f"run {record.id}: {name!r} is not a module")
    if not isinstance(record.prior, str) or (record.prior and not _PRIOR.fullmatch(record.prior)):
        raise ValueError(f"run {record.id}: prior {record.prior!r} is not a run folder name")
    turns = record.max_turns
    if not isinstance(turns, int) or isinstance(turns, bool) or not _TURNS[0] <= turns <= _TURNS[1]:
        raise ValueError(f"run {record.id}: max_turns {turns!r} is not a whole number 1 to 64")


def command(
    layout: Layout,
    record: Record,
    context: Path,
    *,
    launcher: Sequence[str],
    ruling: Path | None,
) -> list[str]:
    """The launcher's argv for the record; its cap is ``cap_of(record)``."""
    _check_options(record)
    cap = cap_of(record)
    config, balanced = launch_options(record.model, record.effort)
    argv = [
        *launcher,
        "--context", str(context),
        "--sources", str(layout.drops / record.id),
        "--config", config,
        *(["--balanced"] if balanced else []),
        "--cap", str(cap),
        "--out", str(layout.runs / record.id),
        "--no-library",
    ]  # fmt: skip
    if record.modules:
        argv += ["--modules", *record.modules]
    if record.prior:  # what the approval named: the launcher uses exactly that run
        argv += ["--prior", record.prior]
    if record.max_turns != DEFAULT_MAX_TURNS:
        argv += ["--max-turns", str(record.max_turns)]
    if ruling is not None:
        argv += ["--live", "--ruling", str(ruling)]
    return argv


def start(
    layout: Layout,
    record: Record,
    context: Path,
    *,
    launcher: Sequence[str],
    ruling: Path,
) -> subprocess.Popen[bytes]:
    """Start the paid run as a child; stdout and stderr append to logs/<id>.log."""
    argv = command(layout, record, context, launcher=launcher, ruling=ruling)
    env = child_environment()
    env[PID_FILE_VARIABLE] = str(pid_file(layout, record.id))
    child: subprocess.Popen[bytes] | None = None
    try:
        with (layout.logs / f"{record.id}.log").open("ab") as log_file:
            if sys.platform == "win32":  # a Ctrl-C to the service must not stop its runs
                child = subprocess.Popen(
                    argv,
                    stdout=log_file,
                    stderr=log_file,
                    env=env,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                )
            else:  # a new session keeps a terminal Ctrl-C (SIGINT to the service group) off it
                child = subprocess.Popen(
                    argv, stdout=log_file, stderr=log_file, env=env, start_new_session=True
                )
    except OSError:
        if child is None:
            raise
        # Documented fail-open: the launcher has started and holds its own copy of the handle, so
        # an error closing this one is logged; raising would leave a paid run nobody tracks.
        log.exception("run %s: closing the log handle failed after the launcher started", record.id)
    return child


def outcome(layout: Layout, record: Record, exit_code: int | None) -> tuple[Status, str]:
    """Decide a run's end from its event log and the launcher's exit code. A delivery, or exit 0
    (a live launch returns 0 only once it delivered; the log is advisory and may have lost that
    line), is finished: the scheduler then checks the library lists the run. Otherwise the stop
    the log ends on, else how the launcher ended."""
    try:
        events = read_events(layout.runs / record.id / EVENTS)
    except FileNotFoundError:
        events = []  # no log yet: nothing to report
    except (OSError, ValueError) as error:
        # Documented fail-open: an unreadable log counts as no events; the exit code decides.
        log.warning("run %s: event log unreadable (%s); treated as no events", record.id, error)
        events = []
    # a valid JSON line need not be an event
    state = progress(e for e in events if isinstance(e, dict))
    if state.delivered or exit_code == 0:
        return "finished", ""
    if state.stop == "budget":
        return "capped", "stopped at the cap"
    if state.stop is not None:
        return "failed", f"stopped: {state.stop}"
    if exit_code is None:
        return "interrupted", "the run's process ended without a result"
    return "failed", f"launcher exited {exit_code}; see logs/{record.id}.log"
