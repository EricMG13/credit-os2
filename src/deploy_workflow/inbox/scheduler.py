"""The scheduler: the one long-running part that turns submitted runs into filed reports.

Each poll it reaps ended runs, starts queued runs within the limits, files finished reports and
publishes run activity. A record is saved before every step that an interruption could cut short,
so a restart always finds what to do next: a run is marked running (and counted) before its
process starts, and is shown as finished only when the library lists it.

``submit`` takes an approved submission from the start page: under ``lock`` (also held by every
poll) it saves the run's record, then renames the sealed files folder to ``drops/<id>``. A record
whose folder is still missing is finished by the next poll or restart; one submission is never
two records. Records written by the earlier folder watcher still load and show in Run activity;
every run it left queued (one with no submission) is marked failed at start-up, and none of them
is ever started: only Submit on an approved summary starts a run.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import threading
import time
from collections.abc import Callable, Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from pathlib import Path
from typing import IO, Any, cast

from deploy_vii.contracts import PATHWAY_CAP_USD, PathwayId
from deploy_workflow.context import load_context
from deploy_workflow.credit_os_catalogue import summary_fields
from deploy_workflow.inbox import activity, filing, layout, runs, startup
from deploy_workflow.inbox.runs import Record
from deploy_workflow.inbox.startup import StartupRefused
from deploy_workflow.inbox.teams import Config as TeamsConfig
from deploy_workflow.inbox.teams import Notifier
from deploy_workflow.owners import cpos_custom, cpos_launch
from deploy_workflow.run_start import reference_portfolio, submissions
from deploy_workflow.run_start.submissions import Answers

__all__ = ["MAX_QUEUED", "Scheduler", "Settings", "StartupRefused"]

_TIME = "%Y-%m-%dT%H:%M:%SZ"
_REBUILD_FAILED = "the library could not be rebuilt ({}); ended runs wait for it"
_CUT_SHORT = (
    "the service stopped while starting this run; its process may still be running"
    " \N{EM DASH} check before submitting it again"
)
_OLD_WATCHER = (
    "queued by the folder watcher before the run start page replaced it;"
    " submit it again from the run start page"
)
_NO_CONTEXT = "no context.json in _engine/drops/{}; submit it again from the run page"
# ponytail: a run whose launcher writes its PID file after 60 s is cut short; a reused process ID
# after a reboot reads as alive. Both are known ceilings, not handled.
_PID_GRACE_SECONDS = 60
_SID = re.compile(r"[0-9a-f]{32}")
_CHANGED = "the submitted documents changed before the run could start"
# Ceiling on submissions waiting for a slot: their files sit outside the uploads store limit.
MAX_QUEUED = 30


@dataclass(frozen=True)
class Settings:
    root: Path
    max_running: int = 3
    max_per_day: int = 30
    poll_seconds: float = 10
    ruling: Path = startup.STANDING_RULING
    teams: TeamsConfig | None = None  # Teams cards are posted only when the service sets this
    copilot_models: Mapping[str, frozenset[str]] | None = field(default_factory=dict)
    launcher: tuple[str, ...] = (
        sys.executable,
        "-X",
        "utf8",
        "-m",
        "deploy_workflow.owners.cpos_launch",
    )


def _local_now() -> datetime:
    return datetime.now().astimezone()


def _stop(child: subprocess.Popen[bytes]) -> None:
    child.terminate()
    try:
        child.wait(timeout=10)
    except subprocess.TimeoutExpired:
        child.kill()
        child.wait()


def _lead(library: Any, run_id: str) -> str:
    """The bottom line the library's Overview leads with for this run, exactly as its module
    wrote it; ``""`` when the library holds none."""
    try:
        run = next(run for run in library.runs if run["id"] == run_id)
        return str(summary_fields(run)[0])
    except (StopIteration, LookupError, TypeError):
        return ""  # fail-open, display only: the card goes out without the line


def _unreadable_note(count: int) -> str:
    """The activity note for ``count`` unreadable run records; it names no file."""
    if count == 0:
        return ""
    if count == 1:
        return (
            "1 run record could not be read. Its run is not started, tracked or shown, and it "
            "takes one running slot and one of each day's starts until the file is repaired and "
            "the service restarted."
        )
    return (
        f"{count} run records could not be read. Their runs are not started, tracked or shown, "
        f"and they take {count} running slots and {count} of each day's starts until the files "
        "are repaired and the service restarted."
    )


_MAX_PID_DIGITS = 10  # a longer number is no process ID (and int() refuses thousands of digits)


class Scheduler:
    def __init__(
        self,
        settings: Settings,
        *,
        clock: Callable[[], float] = time.time,
        now: Callable[[], datetime] = _local_now,
    ) -> None:
        self.settings, self.clock, self.now = settings, clock, now
        self.model_choices = runs.available_choices(settings.copilot_models)
        self.layout = layout.ensure_layout(settings.root)
        startup.check_launchable(settings.ruling)
        self._lock: IO[str] | None = startup.take_lock(self.layout)
        self._logger = startup.open_log(self.layout, __name__)  # only the lock holder logs
        self.lock = threading.Lock()  # held by step() and submit(): a submit never splits a poll
        readable, self._unreadable = runs.load_readable(self.layout)
        # A readable record carrying the run ID of an unreadable file (a backup copy made before a
        # hand edit) is not tracked: saving or starting it would overwrite or double the run of the
        # bad file. It is counted with that file's run, once.
        stems = {runs.name_key(Path(name).stem) for name in self._unreadable}
        shadows = [r.id for r in readable if runs.name_key(r.id) in stems]
        self._records = {r.id: r for r in readable if r.id not in shadows}
        if self._unreadable:
            # Documented fail-open for display and tracking only: a bad record file is skipped, and
            # the operator is told here and in the activity note. It is never written, its stem is
            # never minted as a run ID, and it keeps one running slot and one start each day.
            self._logger.warning(
                "unreadable run record file(s) %s%s: their runs are not started, tracked or shown "
                "until the file is repaired and the service restarted",
                ", ".join(self._unreadable),
                f" (and the readable copies of runs {', '.join(shadows)})" if shadows else "",
            )
        self._children: dict[str, subprocess.Popen[bytes]] = {}
        self._rebuild_error = ""
        self._logged_rebuild_error = ""  # the last rebuild error written to the log
        self._stopped: dict[str, str] = {}  # run ID -> why the scheduler stopped its process
        self._kept_activity: dict[str, tuple[runs.Record, dict[str, Any]]] = {}
        self._bad_pid_files: set[str] = set()  # run IDs whose unusable PID file is logged
        self._limit_held = ""
        self._unreadable_held = _unreadable_note(len(self._unreadable))
        # Run ID -> the report's lead bottom line, for its Teams card. Kept in memory only: a
        # run that ends just before a restart gets its card without the line.
        self._leads: dict[str, str] = {}
        self._teams = (
            Notifier(self.layout, settings.teams, self._logger) if settings.teams else None
        )
        self._recover()
        self._rebuild()

    def close(self) -> None:
        """Release the folder lock and the log file. Safe to call twice."""
        handle, self._lock = self._lock, None
        if handle is not None:
            startup.release_lock(handle)
        startup.close_log(self.layout)

    def _recover(self) -> None:
        """Decide what an earlier stop left: runs cut short while starting, half-finished moves,
        and runs the earlier folder watcher queued without ever checking."""
        self._track_untracked()
        self._finish_moves()
        self._fail_unchecked()

    def _fail_unchecked(self) -> None:
        """A queued record with no ``submission`` was queued by the old folder watcher. Only a run
        started by Submit on an approved summary may start (ruling 2026-11-11): fail it, with the
        reason, rather than leave it waiting (and counted against the queue limit) for ever."""
        for record in self._with_status("queued"):
            if not record.submission:
                with self._guard(f"run {record.id}"):
                    self._fail(record, _OLD_WATCHER)

    def _fail(self, record: Record, reason: str) -> None:
        self._put(replace(record, status="failed", reason=reason, ended_at=self._utc(self.now())))

    def _track_untracked(self) -> None:
        """A running record with no PID and no child of this scheduler was cut short between the
        child's start and the PID save: take the PID from the file the launcher wrote, or wait out
        the grace, then mark it interrupted (never restarted)."""
        for record in self._with_status("running"):
            if record.pid != 0 or record.id in self._children:
                continue
            with self._guard(f"run {record.id}"):
                pid = self._pid_from_file(record)
                if pid:
                    self._put(replace(record, pid=pid))
                elif self._past_grace(record):
                    self._put(
                        replace(
                            record,
                            status="interrupted",
                            reason=_CUT_SHORT,
                            ended_at=self._utc(self.now()),
                        )
                    )

    def _pid_from_file(self, record: Record) -> int:
        """The positive process ID in the run's PID file, else 0 (bad content: logged once)."""
        try:
            raw = runs.pid_file(self.layout, record.id).read_bytes()
        except FileNotFoundError:
            return 0
        text = raw.decode("ascii", "replace").strip()
        if text.isascii() and text.isdigit() and len(text) <= _MAX_PID_DIGITS and int(text) > 0:
            return int(text)
        if record.id not in self._bad_pid_files:
            self._bad_pid_files.add(record.id)
            self._logger.warning(
                "run %s: PID file holds %r, not a process ID", record.id, text[:40]
            )
        return 0

    def _past_grace(self, record: Record) -> bool:
        try:
            started = datetime.strptime(record.started_at, _TIME).replace(tzinfo=UTC)
        except ValueError:
            return True  # an unreadable time is treated as past the grace
        return (self.now().astimezone(UTC) - started).total_seconds() >= _PID_GRACE_SECONDS

    def _finish_moves(self) -> None:
        """A queued submission whose folder is still in ``uploads`` was cut short between its
        record and the rename: finish the rename, once the files are shown to be the approved ones.

        A record is failed only when that check fails; a rename that fails is retried."""
        for record in self._with_status("queued"):
            if record.submission and not os.path.lexists(self.layout.drops / record.id):
                with self._guard(f"submission {record.submission}"):
                    self._move_files(record)

    def _sealed(self, record: Record) -> Path:
        return self.layout.uploads / record.submission / "sealed"

    def _move_files(self, record: Record) -> None:
        sealed = self._sealed(record)
        if not sealed.is_dir() or sealed.is_symlink():
            return
        if not record.digest or self._approval_digest(record, sealed) != record.digest:
            self._put(
                replace(
                    record,
                    status="failed",
                    reason=_CHANGED,
                    ended_at=self._utc(self.now()),
                )
            )
            return
        os.rename(sealed, self.layout.drops / record.id)
        submissions.release(self.layout, record.submission)

    @staticmethod
    def _cap_is_approved(record: Record) -> bool:
        """Whether the record's cap is one its pathway allows. A custom run's cap is the one its
        summary issued (the digest binds it, so an edited cap fails the comparison); every other
        pathway's is the table's."""
        if record.pathway == submissions.CUSTOM:
            return submissions.custom_cap_ok(record.cap)
        return record.cap == str(PATHWAY_CAP_USD[cast(PathwayId, record.pathway)])

    def _approval_digest(self, record: Record, folder: Path) -> str:
        """Recreate the approved digest from the queued settings and current sources."""
        try:
            context = folder / "context.json"
            if folder.is_symlink() or context.is_symlink():
                return ""
            saved = {
                "context": json.loads(context.read_bytes()),
                "modules": list(record.modules),
                "max_turns": record.max_turns,
                "level": record.level,
                "model": record.model,
                "effort": record.effort,
                "submitted_by": record.submitted_by,
            }
            if record.newest_document_date:
                saved["newest_document_date"] = record.newest_document_date
            answers = submissions.validated(saved)
            if record.config:
                pathway = load_context(submissions.context_bytes(answers)).run.pathway
                if pathway != record.pathway or not self._cap_is_approved(record):
                    return ""
            submissions.refuse_filed_elsewhere(self.layout, answers)
            value = submissions.bound(submissions.folder_digest(folder, answers), record.prior)
            if record.pathway == submissions.CUSTOM:
                return submissions.bound_cap(value, record.cap)
            return value
        except (OSError, ValueError, TypeError):
            return ""

    def model_available(self, model: str, effort: str) -> bool:
        """Whether the verified launch seat offers this intake model and effort."""
        return effort in self.model_choices.get(model, ())

    def record_of_submission(self, sid: str) -> Record | None:
        """The run already taken for this submission, or None."""
        with self.lock:
            return next((r for r in self._records.values() if r.submission == sid), None)

    def _accepted_submission(self, sid: str, actor: submissions.RunActor | None) -> Record | None:
        """Return the one prior run unless this signed account is not its owner."""
        record = next((item for item in self._records.values() if item.submission == sid), None)
        if (
            record is not None
            and actor is not None
            and record.account_id is not None
            and record.account_id != actor.account_id
        ):
            raise submissions.Refused("this submission was already accepted by another account")
        return record

    def issue_summary(
        self,
        sid: str,
        answers: Answers,
        actor: submissions.RunActor | None = None,
    ) -> dict[str, Any]:
        """Issue an approved summary; acceptance synchronizes against sealing the draft."""
        return submissions.summary(self.layout, sid, answers, actor)

    def submit(
        self,
        sid: str,
        answers: object,
        approved_digest: str,
        *,
        actor: submissions.RunActor | None = None,
    ) -> Record:
        """Start one run for an approved submission. Repeating a submission returns its record.

        ``Refused`` if the answers are not valid, the pathway is deactivated (the short credit
        snapshot), a module is unknown, or the approval is not the
        digest this service issued for exactly the files and answers now held. The files are
        sealed first (no upload or removal lands after that), checked, then the record is saved
        and only then is the sealed folder renamed, so an interruption between them is finished
        by the next poll against the digest the record keeps."""
        with self.lock:
            answers = submissions.validated(submissions.authorized_answers(answers, actor))
            if not isinstance(sid, str) or not _SID.fullmatch(sid):
                raise submissions.Refused("unknown submission")
            if record := self._accepted_submission(sid, actor):
                return record
            if not self.model_available(answers["model"], answers["effort"]):
                raise submissions.Refused(
                    "This model and effort are unavailable on the Copilot seat."
                )
            try:  # a context the launcher would refuse, or a deactivated pathway, is a 400
                run = load_context(submissions.context_bytes(answers)).run
                cpos_launch.refuse_deactivated(run.pathway)
            except ValueError as refusal:
                raise submissions.Refused(str(refusal)) from refusal
            for name in answers["modules"]:
                if not runs.known_module(name, run.pathway):
                    raise submissions.Refused(f"unknown module {name}")
            if run.pathway == submissions.CUSTOM:
                # The launcher's own completion text, as the summary showed it: a list it refuses
                # was never issued a digest, so the approval check below would only say "changed".
                try:
                    cpos_custom.complete(
                        answers["modules"], owned=cpos_launch.custom_owned_modules()
                    )
                except cpos_custom.CustomRefused as refused:
                    raise submissions.Refused(str(refused)) from refused
            if len(self._with_status("queued")) >= MAX_QUEUED:
                raise submissions.Refused("too many runs are waiting; try again later")
            sealed = submissions.seal(self.layout, sid, actor)
            try:
                record = self._record_for(sid, answers, approved_digest, sealed, actor)
            except BaseException:
                submissions.unseal(self.layout, sid)
                raise
            os.rename(sealed, self.layout.drops / record.id)
            submissions.release(self.layout, sid)
            return record

    def _record_for(
        self,
        sid: str,
        answers: Answers,
        approved_digest: str,
        sealed: Path,
        actor: submissions.RunActor | None = None,
    ) -> Record:
        """Check the sealed files against the issued approval, write ``context.json`` into them
        and save the queued record. Nothing has moved when this raises."""
        approval = submissions.issued_approval(self.layout, sid)
        if actor is not None:
            if (approval.actor_id, approval.actor_name) != (actor.account_id, actor.analyst_name):
                raise submissions.Refused(
                    "this summary was approved by another account or name; review the summary again"
                )
        elif approval.actor_id is not None:
            raise submissions.Refused(
                "this summary was approved by another account; review the summary again"
            )
        # context.json is made here from the answers; a left-over one (an earlier cut-short
        # attempt) is ours, since an upload may not carry that name. Verify actor consent first.
        (sealed / "context.json").unlink(missing_ok=True)
        current = submissions.bound(submissions.digest(self.layout, sid, answers), approval.prior)
        context = answers["context"]
        custom = context["run"]["pathway"] == submissions.CUSTOM
        if custom:
            # The cap the launcher computed and the summary issued: bound into the approval.
            if not submissions.custom_cap_ok(approval.cap):
                raise submissions.Refused(
                    "the run's cap is not the one the summary showed; review the summary again"
                )
            current = submissions.bound_cap(current, approval.cap)
        # The approval also covers the comparison portfolio, when one was supplied. The record
        # keeps the documents' digest (``current``), which the launch re-checks against the drop;
        # the portfolio never goes to the drop.
        compared = reference_portfolio.held(self.layout, sid)
        approved = reference_portfolio.folded(current, compared)
        if not approved_digest or not (approved_digest == approval.digest == approved):
            raise submissions.Refused(
                "the documents or answers changed after approval; review the summary again"
            )
        # The cap the approved summary showed is the run's; a table changed since (or a summary
        # made before per-pathway caps, which records none) needs a new summary.
        cap = approval.cap if custom else str(PATHWAY_CAP_USD[context["run"]["pathway"]])
        if approval.cap != cap:
            raise submissions.Refused(
                f"the run's cap is now USD {cap}, not the one the summary showed; review the "
                "summary again"
            )
        (sealed / "context.json").write_bytes(submissions.context_bytes(answers))
        record = Record(
            self._new_id(),
            context["run"]["pathway"],
            context["identity"]["issuer_name"],
            "queued",
            self._utc(self.now()),
            issuer_id=context["identity"]["issuer_id"],
            issuer_name=context["identity"]["issuer_name"],
            as_of=context["run"]["as_of"],
            prepared=True,  # a submission arrives already checked
            submission=sid,
            modules=tuple(answers["modules"]),
            max_turns=answers["max_turns"],
            level=answers["level"],
            model=answers["model"],
            effort=answers["effort"],
            config=runs.config_for(answers["model"], answers["effort"]),
            submitted_by=answers["submitted_by"],
            account_id=actor.account_id if actor is not None else None,
            digest=current,
            prior=approval.prior,
            cap=cap,
            approved_summary_limits=approval.limits(),
            newest_document_date=answers.get("newest_document_date", ""),
        )
        submitted = self.now().astimezone(UTC)
        with reference_portfolio.kept_for_run(self.layout, record.id, compared, submitted):
            self._put(record)
        return record

    # -- shared helpers ---------------------------------------------------------------------

    @contextmanager
    def _guard(self, what: str) -> Iterator[None]:
        """Log an OSError with its traceback and carry on; the next poll retries."""
        try:
            yield
        except OSError:
            self._logger.exception("%s", what)

    def _utc(self, moment: datetime) -> str:
        return moment.astimezone(UTC).strftime(_TIME)

    def _put(self, record: Record) -> None:
        runs.save(self.layout, record)  # the in-memory copy changes only once the file has
        self._records[record.id] = record
        if record.status not in ("queued", "running"):
            self._remove_pid_file(record.id)

    def _remove_pid_file(self, run_id: str) -> None:
        try:
            runs.pid_file(self.layout, run_id).unlink(missing_ok=True)
        except OSError:
            self._logger.exception("run %s: its PID file could not be removed", run_id)

    def _with_status(self, status: str) -> list[Record]:
        return sorted((r for r in self._records.values() if r.status == status), key=lambda r: r.id)

    def _rebuild(self) -> Any:
        try:
            library = cpos_launch.update_library_at(self.layout.engine)
        except Exception as error:  # noqa: BLE001
            # Documented fail-open: the rebuild is display. Ended runs wait unfiled and the next
            # poll retries; the traceback is logged and the page says why. KeyboardInterrupt and
            # SystemExit (BaseException) still stop the scheduler.
            self._rebuild_failed(f"library rebuild failed: {error}", type(error).__name__, exc=True)
            return None
        if library is None:
            self._rebuild_failed(
                "library rebuild skipped: update_library.py not found",
                "update_library.py not found",
            )
            return None
        self._rebuild_error = ""
        if self._logged_rebuild_error:
            self._logged_rebuild_error = ""
            self._logger.info("library rebuild works again")
        return library

    def _rebuild_failed(self, log_text: str, error: str, *, exc: bool = False) -> None:
        """Keep the page notice (``error`` is its kind only: the page serves it as written, and the
        operating system's text names the server's paths); write the log line, which keeps the
        full error, only when it differs from the last."""
        self._rebuild_error = _REBUILD_FAILED.format(error)
        if log_text != self._logged_rebuild_error:
            self._logged_rebuild_error = log_text
            if exc:
                self._logger.exception("library rebuild failed")
            else:
                self._logger.error("%s", log_text)

    # -- one poll ---------------------------------------------------------------------------

    def step(self) -> None:
        with self.lock:
            self._step()
            records, leads = list(self._records.values()), dict(self._leads)
        if self._teams is not None:  # outside the lock: a slow webhook never holds up a Submit
            self._teams.tick(records, self.now(), leads)
            for run_id in [i for i in self._leads if self._teams.settled(i)]:
                del self._leads[run_id]  # only this thread writes _leads (here and in _reap)

    def _step(self) -> None:
        self._track_untracked()
        self._finish_moves()
        with self._guard("sweep of the uploads"):
            queued = frozenset(r.submission for r in self._with_status("queued") if r.submission)
            if self._unreadable:
                # Fail closed: an unreadable record may be a waiting run, so no sealed upload goes.
                queued |= {p.parent.name for p in self.layout.uploads.glob("*/sealed")}
            submissions.sweep(self.layout, self.clock(), queued)
        self._reap()
        self._start_queued()
        with self._guard("activity"):
            snapshot = activity.snapshot(
                self.layout,
                list(self._records.values()),
                now=self.now(),
                kept=self._kept_activity,
                held="; ".join(
                    t for t in (self._rebuild_error, self._limit_held, self._unreadable_held) if t
                ),
            )
            activity.write(self.layout, snapshot)

    # -- reap and finish --------------------------------------------------------------------

    def _exit_of(self, record: Record) -> tuple[bool, int | None]:
        child = self._children.get(record.id)
        if child is not None:  # poll() only: alive() would reap it and hide the exit code
            code = child.poll()
            return code is not None, code
        return not runs.alive(record.pid), None  # adopted after a restart

    def _reap(self) -> None:
        ended: list[tuple[Record, int | None]] = []
        for record in self._with_status("running"):
            if record.pid == 0 and record.id not in self._children:
                continue  # inside the PID grace: _track_untracked decides it
            with self._guard(f"run {record.id}"):
                done, code = self._exit_of(record)
                if done:
                    ended.append((record, code))
        library = self._rebuild() if ended or self._rebuild_error else None
        if library is None:
            return  # nothing is decided without a rebuild; the next poll tries again
        for record, code in ended:
            with self._guard(f"run {record.id}"):
                decided = self._decide(record, code, library)
                self._put(decided)
                if self._teams is not None and decided.status == "finished":
                    self._leads[record.id] = _lead(library, record.id)
                self._children.pop(record.id, None)
                self._stopped.pop(record.id, None)

    def _decide(self, record: Record, code: int | None, library: Any) -> Record:
        if record.id in self._stopped:  # its process was stopped because its record failed to save
            reason = self._stopped[record.id]
            return replace(record, status="failed", reason=reason, ended_at=self._utc(self.now()))
        state, reason = runs.outcome(self.layout, record, code)
        ended = replace(record, status=state, reason=reason, ended_at=self._utc(self.now()))
        if state != "finished":
            return ended
        if record.id not in {run["id"] for run in library.runs}:
            why = dict(library.excluded).get(record.id, "the library did not list it")
            return replace(ended, status="failed", reason=f"not listed: {why}")
        deliveries = sorted((self.layout.runs / record.id / "deliveries").glob("*/delivery.json"))
        if len(deliveries) != 1:
            reason = f"expected one deliveries/*/delivery.json, found {len(deliveries)}"
            return replace(ended, status="failed", reason=reason)
        # A delivery has no report page: the library shows the run itself, so nothing is filed.
        # An earlier-format delivery that still holds one is filed as before.
        page = deliveries[0].with_name("report.html")
        if page.is_file() and not (record.report and (self.layout.root / record.report).is_file()):
            try:
                filed = filing.file_report(
                    self.layout,
                    page,
                    issuer_id=record.issuer_id,
                    issuer_name=record.issuer_name,
                    as_of=record.as_of,
                    pathway=record.pathway,
                    claimed=frozenset(
                        self.layout.root / r.report
                        for r in self._records.values()
                        if r.report and r.id != record.id
                    ),
                )
                _, differs = filing.issuer_folder(self.layout, record.issuer_id, record.issuer_name)
            except ValueError as error:  # a corrupt issuer registry; the report stays in its run
                self._logger.exception("run %s could not be filed", record.id)
                return replace(ended, status="failed", reason=f"could not be filed: {error}")
            # Kept in memory at once: if the save below fails, the retry must not file it again.
            record.report = filed.relative_to(self.layout.root).as_posix()
            record.name_differs = differs
        return replace(ended, report=record.report, name_differs=record.name_differs)

    # -- ids --------------------------------------------------------------------------------

    def _new_id(self) -> str:
        stamp = datetime.now(UTC) if self.now().tzinfo is None else self.now().astimezone(UTC)
        number = 1
        while True:
            name = f"{stamp:%Y%m%d-%H%M%S}-{number:02d}"
            taken = (
                self.layout.drops / name,
                self.layout.runs / name,
                self.layout.logs / f"{name}.log",
                self.layout.state / f"{name}.json",  # taken whether or not the record is readable
            )
            if name not in self._records and not any(os.path.lexists(p) for p in taken):
                return name
            number += 1

    # -- start ------------------------------------------------------------------------------

    def _started_today(self) -> int:
        # Each moment's own local date, by the machine's time-zone rules: on a clock-change day
        # the offset of "now" would put the day's first hour on the day before.
        today = self.now().astimezone().date()
        count = len(self._unreadable)  # fail closed: each bad file counts as one start today
        for record in self._records.values():
            if not record.started_at:
                continue
            try:
                started = datetime.strptime(record.started_at, _TIME).replace(tzinfo=UTC)
            except ValueError:
                # Fail closed: an unreadable time counts toward today's limit.
                self._logger.warning(
                    "run %s: started_at %r unreadable", record.id, record.started_at
                )
                count += 1
                continue
            count += started.astimezone().date() == today
        return count

    def _start_queued(self) -> None:
        today = self._started_today()
        self._limit_held = ""
        for record in self._with_status("queued"):
            if today >= self.settings.max_per_day:  # first: shown even while every slot is busy
                limit = self.settings.max_per_day
                self._limit_held = f"daily limit of {limit} runs reached; waiting until tomorrow"
                break
            # Fail closed: each unreadable record file takes one running slot.
            if (
                len(self._with_status("running")) + len(self._unreadable)
                >= self.settings.max_running
            ):
                break
            if record.config and not self.model_available(record.model, record.effort):
                self._limit_held = "Waiting for a Copilot seat that supports this model and effort."
                continue
            with self._guard(f"run {record.id}"):
                today += self._launch(record)

    def _launch_approval_problem(self, record: Record) -> str:
        if not record.submission or not record.digest:
            return _OLD_WATCHER
        if not record.config and self.settings.copilot_models is not None:
            return "This approval predates Copilot routing. Open a new draft and review it."
        return ""

    def _drop_approval_problem(self, record: Record, drop: Path, context: Path) -> str:
        if context.is_symlink() or not context.is_file():
            return _NO_CONTEXT.format(record.id)
        if record.config and self._approval_digest(record, drop) != record.digest:
            return _CHANGED
        return ""

    def _launch(self, record: Record) -> bool:
        """Start one run. True once it is recorded as started (and so counted for the day)."""
        if refusal := self._launch_approval_problem(record):
            self._fail(record, refusal)
            return False
        drop = self.layout.drops / record.id
        if not os.path.lexists(drop) and self._sealed(record).is_dir():
            return False  # its move is not finished yet (a failed rename): _finish_moves retries
        context = drop / "context.json"
        if refusal := self._drop_approval_problem(record, drop, context):
            self._fail(record, refusal)
            return False
        try:
            runs.command(  # a record that cannot become a command fails here, before it is counted
                self.layout,
                record,
                context,
                launcher=self.settings.launcher,
                ruling=startup.STANDING_RULING,
            )
        except (ValueError, TypeError) as error:
            # Documented fail-open: a hand-edited or wrongly typed field must not stop the poll for
            # every other run. Logged with the run's ID; the record is failed and uses no slot.
            self._logger.exception("run %s cannot be built into a command", record.id)
            reason = f"could not be started: {error}"
            self._put(
                replace(record, status="failed", reason=reason, ended_at=self._utc(self.now()))
            )
            return False
        running = replace(record, status="running", started_at=self._utc(self.now()), pid=0)
        self._put(running)  # first: whatever happens next, this run is counted and never repeated
        try:
            child = runs.start(
                self.layout,
                running,
                context,
                launcher=self.settings.launcher,
                ruling=startup.STANDING_RULING,  # start-up proved settings.ruling is this file
            )
        except (OSError, ValueError, TypeError) as error:
            # Documented fail-open: one record that cannot be turned into a command or started (a
            # hand-edited or wrongly typed field raises ValueError or TypeError, not only OSError)
            # must not stop the poll for every other run. The traceback is logged with the run's
            # ID and the record is marked failed with the error text; nothing else is hidden.
            self._logger.exception("run %s could not be started", record.id)
            reason = f"could not be started: {error}"
            self._put(
                replace(running, status="failed", reason=reason, ended_at=self._utc(self.now()))
            )
            return True
        self._children[record.id] = child
        try:
            self._put(replace(running, pid=child.pid))
        except BaseException as error:
            _stop(child)  # a run nobody can track must not keep spending
            if not isinstance(error, OSError):
                self._children.pop(record.id, None)
                raise
            # The process has ended; the next poll reaps it through the Popen kept in _children.
            self._stopped[record.id] = (
                f"stopped by the scheduler: its record could not be saved ({error})"
            )
            self._logger.exception("run %s: its process ID could not be saved", record.id)
        return True
