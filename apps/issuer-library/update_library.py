"""Publish a checked CP-OS snapshot for the connected issuer library.

    uv run python apps/issuer-library/update_library.py [--workspace FOLDER]

Reads ``FOLDER/runs`` and atomically replaces only ``FOLDER/library/`` with ``data.js`` and
``downloads/<run>/`` files copied byte for byte after their recorded hashes are verified. The
React frontend serves this publication over localhost; no static page or delivered report is
written here. Runs are never changed, no analysis is run, and no provider is called.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlsplit

HERE = Path(__file__).resolve().parent
PACKAGED = (HERE / "src").is_dir()  # The Windows package keeps the engine's src beside this file.
ROOT = HERE if PACKAGED else HERE.parents[1]

from credit_os.store import UnreadableFile, regular_chunks, workspace_store

from deploy_vii.registry import plan
from deploy_workflow.changes import PACK_SCHEMAS, lead_module
from deploy_workflow.changes_check import page_verdicts
from deploy_workflow.credit_os_catalogue import catalogue
from deploy_workflow.credit_os_chips import chips
from deploy_workflow.derived import reuse
from deploy_workflow.library_index import (
    Library,
    Refused,
    build_library,
    read_pinned,
)
from deploy_workflow.run_events import read_events

FILES = "/files/"


def relative_href(href: str) -> str:
    """A server ``/files/...`` href as a path relative to the published workspace."""
    path = unquote(urlsplit(href).path)[len(FILES) :]
    return "../" + quote(path, safe="/")


def relocate(value: Any) -> Any:
    """``value`` with every ``/files/...`` string rewritten by ``relative_href``."""
    if isinstance(value, str):
        return relative_href(value) if value.startswith(FILES) else value
    if isinstance(value, list):
        return [relocate(item) for item in value]
    if isinstance(value, dict):
        return {key: relocate(item) for key, item in value.items()}
    return value


def embedded_json(value: object) -> str:
    """JSON that cannot end its ``<script>`` element or open a comment inside it."""
    return json.dumps(value, ensure_ascii=True, allow_nan=False).replace("<", "\\u003c")


def run_events(
    run_dir: Path, folder: str, issues: list[str]
) -> tuple[list[dict[str, Any]], str | None]:
    """Read events or return a named failure; a missing log has no events and no failure."""
    path = run_dir / "events.jsonl"
    if not path.is_symlink() and not path.exists():
        return [], None  # A replay or a run that never started: normal.
    try:
        if path.is_symlink() or not path.is_file():
            raise ValueError("not a regular file")
        events = read_events(path)
        if any(not isinstance(event, dict) for event in events):
            raise ValueError("event is not an object")
        return events, None
    except (OSError, ValueError) as error:
        issues.append(f"{folder}: events.jsonl could not be read ({type(error).__name__})")
        return [], type(error).__name__


def run_record(run_dir: Path, folder: str, issues: list[str]) -> dict[str, Any] | None:
    """The run's requested modules in recorded order (deploy_vii.registry plan order for those
    never started) with the times its event log states. Nothing is written, and no time is made
    up: a module with no event has none."""
    try:
        raw = json.loads(b"".join(regular_chunks(run_dir / "workflow.json", follow=False)))
        requested = tuple(raw["run"]["requested_modules"])
        order = plan(requested)
    except FileNotFoundError:
        return None
    except (OSError, ValueError, KeyError, TypeError, RecursionError) as error:
        issues.append(f"{folder}: run record could not be read ({type(error).__name__})")
        return None
    events, events_issue = run_events(run_dir, folder, issues)
    seen: dict[str, dict[str, str | None]] = {}
    for event in events:
        module, at = event.get("module"), event.get("at")
        name = event.get("event")
        kind = {"module_started": "started", "module_accepted": "accepted"}.get(str(name))
        if kind and isinstance(module, str) and isinstance(at, str):
            seen.setdefault(module, {"started": None, "accepted": None})
            seen[module][kind] = seen[module][kind] or at
    started = [m for m, t in seen.items() if t["started"]]
    steps = [{"module": m, **seen[m]} for m in started]
    steps += [{"module": m, "started": None, "accepted": None} for m in order if m not in started]
    record = {"steps": steps, "timed": bool(started)}
    if events_issue:
        record["eventsIssue"] = events_issue
    return record


def run_records(workspace: Path, store: dict[str, Any]) -> None:
    """Add each shown run's `record` (see run_record) to the store, reading the run folder only."""
    for run in store["runs"].values():
        record = run_record(workspace / "runs" / run["folder"], run["folder"], store["issues"])
        if record:
            run["record"] = record


def method_changes(store: dict[str, Any], library: Library) -> None:
    """Carry each listed run's ``method_changes`` (methods that changed since it ran) to its store
    run, as ``methodChanges``; empty when none."""
    changed = {run["id"]: run["method_changes"] for run in library.runs}
    for run in store["runs"].values():
        run["methodChanges"] = list(changed[run["folder"]])


_COMMITTEE_HOLD = {
    "blocked": "The committee decision was withheld because its assessment was blocked.",
    "outside_pathway": "The committee decision is outside the published pathway.",
    "not_requested": "The committee decision was outside the requested assessment scope.",
}
_OWNER_HOLD = {
    "blocked": "The owner marked this output blocked.",
    "draft only": "The owner limited this output to draft use.",
    "insufficient information": "The owner reported insufficient information for a decision.",
    "prohibited": "The owner prohibited decision use of this output.",
    "requires more work": "The owner recorded that more work is required for a decision.",
    "restricted": "The owner restricted this output and field-specific clearance is unavailable.",
}


def committee_hold(directory: Path, delivered: dict[str, Any]) -> str | None:
    """Read the explicit committee hold from the receipt-bound ReportView."""
    if not delivered["delivery_sha256"]:
        return None
    try:
        raw = read_pinned(
            directory,
            f"{delivered['folder']}/report-view.json",
            delivered["files"].get("report-view.json"),
        )
        report = json.loads(raw)
    except (OSError, ValueError, RecursionError):
        return None
    if not isinstance(report, dict) or report.get("schema_version") != "report-view/1":
        return None
    withheld = report.get("call_withheld")
    if not isinstance(withheld, str) or withheld not in _COMMITTEE_HOLD:
        return None
    return _COMMITTEE_HOLD[withheld]


def _designated_action(
    store: dict[str, Any], key: str, run: dict[str, Any], code: str, digest: str
) -> dict[str, Any] | None:
    module = run["modules"].get(code, {})
    selected = module.get("default")
    if selected not in module.get("outputs", []):
        return None
    output = store["outputs"].get(selected)
    if output and (output["id"], output["run"], output["module"], output["sha256"]) == (
        selected,
        key,
        code,
        digest,
    ):
        return dict(output)
    return None


def action_treatment(
    directory: Path, store: dict[str, Any], key: str, delivered: dict[str, Any]
) -> dict[str, dict[str, Any]]:
    """Bind published whole-output holds to the corresponding designated handoff."""
    result = {}
    for code, scope in (("CP-6", "committee"), ("CP-3", "instrument")):
        pin = delivered["handoffs"].get(code)
        if pin is None:
            continue
        output = _designated_action(store, key, store["runs"][key], code, pin["sha256"])
        if output is None:
            continue
        declared = output.get("state", {}).get("declared")
        reason = committee_hold(directory, delivered) if code == "CP-6" else None
        if reason is None and isinstance(declared, str):
            reason = _OWNER_HOLD.get(declared.strip().casefold())
        if reason is not None:
            result[code] = {
                "output": output["id"],
                "sha256": output["sha256"],
                "state": "withheld",
                "scope": scope,
                "reason": reason,
            }
    return result


def publication_fields(workspace: Path, store: dict[str, Any], library: Library) -> None:
    """Put verified publication facts on the existing run record used by both React endpoints."""
    records = {record["id"]: record for record in library.runs}
    for key, run in store["runs"].items():
        folder = run["folder"]
        record = records[folder]
        run.update(
            assessmentScope=record.get("assessmentScope"), publishedAt=record.get("publishedAt")
        )
        delivered = library.deliveries.get(folder)
        if delivered is not None and (
            holds := action_treatment(workspace / "runs" / folder, store, key, delivered)
        ):
            run["actionTreatment"] = holds


def pack_of(workspace: Path, run: dict[str, Any]) -> tuple[dict[str, Any] | None, str | None]:
    """CP-8's comparison pack as the delivery publishes it, or why it cannot be read. A pack that
    is listed and unreadable is a problem the run states, never a first run."""
    pin = run["changes"]["pack"]
    if pin is None:
        return None, None
    path = pin["path"]
    try:
        value = json.loads(read_pinned(workspace / "runs" / run["id"], path, pin["sha256"]))
    except Refused as error:
        return None, f"{path} could not be read ({error})"
    except ValueError:
        return None, f"{path} is not valid JSON"
    if not isinstance(value, dict):
        return None, f"{path} is not a JSON object"
    if value.get("schema") not in PACK_SCHEMAS:
        return None, f"{path} has schema {value.get('schema')!r}, not one of {PACK_SCHEMAS!r}"
    return value, None


def cp8_verdicts(
    workspace: Path, store: dict[str, Any], run: dict[str, Any], pack: dict[str, Any]
) -> tuple[dict[str, Any] | None, str | None]:
    """(verdicts, problem) of a run whose pack is readable: what the Changes tab shows of CP-8's
    handoff, read here by the checker's own rules (`page_verdicts`); the page reads no register for
    a verdict. None when the run holds no CP-8 output; an output that cannot be read (changed since
    the build read it, not a plain file, not UTF-8) is a problem the run states."""
    default = run["modules"].get("CP-8", {}).get("default")
    if default is None:
        return None, None
    output = store["outputs"][default]
    label = f"{run['folder']}/{output['source']}"
    try:
        raw = checked_bytes(
            workspace / "runs" / run["folder"] / output["source"], output["sha256"], label
        )
        return page_verdicts(raw.decode("utf-8"), pack), None
    except Refused as error:
        return None, f"CP-8's handoff {output['source']} could not be read ({error})"
    except UnicodeDecodeError:
        return None, f"CP-8's handoff {output['source']} is not valid UTF-8"


def _usable(store: dict[str, Any], run: dict[str, Any], code: str) -> bool:
    """Whether the module's designated output can lead, as the Overview's lead selector
    judges it (`web/src/pages/connected/reportView.ts`): it has a `### Bottom line` under
    `## Findings` (`readerPassages` takes
    any, not only the first) and is not blocked. `blocked` reads a new-format handoff (its first
    `###` under Findings is the Bottom line) by whether the Bottom line begins `Not assessable:`,
    and any other by the store's own `state.established === false`."""
    output = store["outputs"].get(run["modules"].get(code, {}).get("default"))
    if output is None:
        return False
    h3: list[dict[str, Any]] = []
    in_findings = False
    for section in store["handoffs"].get(output["sha256"], []):
        if section["level"] == 2:
            if in_findings:
                break
            in_findings = section["heading"] == "Findings"
        elif section["level"] == 3 and in_findings:
            h3.append(section)
    bottom = next((s for s in h3 if s["heading"] == "Bottom line"), None)
    if bottom is None:
        return False
    if h3[0] is not bottom:
        return output.get("state", {}).get("established") is not False
    text = next((b for b in bottom["blocks"] if b["type"] == "text"), None)
    return text is None or not text["text"].startswith("Not assessable:")


def changes_data(workspace: Path, store: dict[str, Any], library: Library) -> None:
    """Carry each listed run's comparison to its store run, as ``changes``: the lead module of its
    pathway, the pack CP-8 was given (unchanged), the recorded reason CP-8 was not produced, the
    problem when the published pack or CP-8's handoff cannot be read (also named in the build's
    issues) and ``verdicts``, what the Changes tab shows of CP-8's registers (`cp8_verdicts`;
    null without a pack, or with a note or a problem)."""
    listed = {run["id"]: run for run in library.runs}
    for run in store["runs"].values():
        record = listed[run["folder"]]
        pack, problem = pack_of(workspace, record)
        verdicts = None
        if pack is not None and not record["changes"]["note"]:
            verdicts, problem = cp8_verdicts(workspace, store, run, pack)
        if problem:
            store["issues"].append(f"{record['id']}: {problem}")
        run["changes"] = {
            "lead": lead_module(
                record["pathway"],
                record["requested_modules"],
                [m["id"] for m in record["modules"] if _usable(store, run, m["id"])],
            ),
            "first_run": record["changes"]["first_run"],
            "pack": pack,
            "note": record["changes"]["note"],
            "problem": problem,
            "verdicts": verdicts,
        }


def checked_bytes(path: Path, digest: str, label: str) -> bytes:
    """The bytes of a run file, refused when they no longer have the hash the store holds."""
    try:
        raw = b"".join(regular_chunks(path, follow=False))
    except UnreadableFile as error:  # a link, a FIFO or an oversize file is not a delivered handoff
        raise Refused(f"Not written: {label} is not a plain file ({error})") from error
    except OSError as error:  # a deleted or unreadable file ends the build with a named refusal
        raise Refused(f"Not written: {label} could not be read ({type(error).__name__})") from error
    if hashlib.sha256(raw).hexdigest() != digest:
        raise Refused(f"Not written: {label} changed during the build")
    return raw


def write_download(root: Path, path: Path, raw: bytes) -> None:
    """Write a download, refused when its target does not resolve inside the library folder."""
    if root.resolve() not in path.resolve().parents:
        raise Refused(f"Not written: {path} is outside the library folder {root}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw)


def handoff_zip(folder: Path, workspace: Path, run: dict[str, Any], store: dict[str, Any]) -> None:
    """Write the run's delivered handoffs, byte for byte, as ``downloads/<run folder>/<CODE>.md``
    (the Evidence links) and ``handoffs.zip`` (``<CODE>.md`` each), and its instruction files as
    ``downloads/<run folder>/instructions/<CODE>.md``: everything the Evidence page links to lies
    inside the library folder, so it opens from disk and when the library is served. A file that no
    longer has the bytes the store hashed is refused, not written."""
    run_dir = workspace / "runs" / run["folder"]
    if run["evidence"]["zip"]:
        target = folder / unquote(run["evidence"]["zip"])
        if folder.resolve() not in target.resolve().parents:
            raise Refused(f"Not written: {target} is outside the library folder {folder}")
        target.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
            for handoff in run["evidence"]["handoffs"]:
                output = store["outputs"][run["modules"][handoff["module"]]["default"]]
                raw = checked_bytes(
                    run_dir / output["source"],
                    output["sha256"],
                    f"{run['folder']}/{output['source']}",
                )
                write_download(folder, folder / unquote(handoff["href"]), raw)
                # A fixed date makes the same handoffs give the same zip.
                archive.writestr(zipfile.ZipInfo(handoff["name"], (1980, 1, 1, 0, 0, 0)), raw)
    recorded = json.loads(b"".join(regular_chunks(run_dir / "workflow.json", follow=False)))
    for row in run["evidence"]["record"]["instructions"]:
        if row["href"]:
            path = recorded["instructions"][row["module"]]["path"]
            raw = checked_bytes(run_dir / path, row["sha256"], f"{run['folder']}/{path}")
            write_download(folder, folder / unquote(row["href"]), raw)


def handoff_zips(folder: Path, workspace: Path, store: dict[str, Any]) -> None:
    for run in store["runs"].values():
        handoff_zip(folder, workspace, run, store)


def build_into(folder: Path, workspace: Path, library: Library) -> None:
    cat = catalogue(workspace, library)
    published = {
        run: {module: pin["sha256"] for module, pin in delivery["handoffs"].items()}
        for run, delivery in library.deliveries.items()
    }
    store = workspace_store(workspace, cat, published=published)
    run_records(workspace, store)
    method_changes(store, library)
    publication_fields(workspace, store, library)
    changes_data(workspace, store, library)
    handoff_zips(folder, workspace, store)
    # Run activity, as data: the folders left out and why, and every issue the build recorded
    # (the store's list already holds the catalogue's; each is kept once, in order).
    activity = {
        "excluded": [[name, reason] for name, reason in library.excluded],
        "issues": list(dict.fromkeys([*cat["issues"], *store["issues"]])),
    }
    data = relocate(
        {
            "catalogue": cat,
            "workspace": store,
            "activity": activity,
            "chips": chips(workspace, store),
        }
    )
    (folder / "data.js").write_text(
        "window.CREDIT_OS_DATA=" + embedded_json(data) + ";\n", encoding="utf-8", newline="\n"
    )


def remove_folder(folder: Path) -> None:
    """Remove a leftover build folder; a failure is reported on stderr, not hidden."""

    def report(function: Any, path: str, error: BaseException) -> None:
        print(f"Could not remove {path}: {error}", file=sys.stderr)

    if folder.exists():
        shutil.rmtree(folder, onexc=report)


def update_library(workspace: Path) -> Library:
    """Rebuild ``workspace/library`` whole: built beside it, then swapped in.

    Every file is read and every recorded hash checked at each call. What was parsed from bytes
    with a given sha256 is kept for the process's later calls (``deploy_workflow.derived``), so a
    run that has not changed is read and checked again, not parsed again.

    Raises ``library_index.Refused`` (a ValueError) when the workspace or ``library`` cannot be
    used; only ``main`` turns that into an exit."""
    with reuse():
        return publish(workspace)


def publish(workspace: Path) -> Library:
    workspace = workspace.resolve()
    if not workspace.is_dir():
        raise Refused(f"Workspace not found: {workspace}")
    target = workspace / "library"
    if target.is_symlink() or (target.exists() and not target.is_dir()):
        raise Refused(f"Not written: {target} is a link or a file, not the library folder")
    old = workspace / ".library-old"
    # A process can exit after moving the current publication aside but before installing its
    # replacement. Restore the last publication before attempting another build.
    if not target.exists() and old.is_dir() and not old.is_symlink() and not old.is_junction():
        old.rename(target)
    library = build_library(workspace, target)
    staging = Path(tempfile.mkdtemp(dir=workspace, prefix=".library-new-"))
    try:
        build_into(staging, workspace, library)
        staging.chmod(0o755)  # mkdtemp makes it owner-only; the publication is shared.
        remove_folder(old)
        had_library = target.exists()
        if had_library:
            target.rename(old)
        try:
            staging.rename(target)
        except OSError:
            if had_library:
                old.rename(target)  # The previous library stays if the new one cannot be placed.
            raise
        remove_folder(old)
    finally:
        remove_folder(staging)
    return library


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--workspace", type=Path, default=None if PACKAGED else ROOT, help="folder holding runs/"
    )
    args = parser.parse_args(argv)
    if args.workspace is None:
        parser.error("give --workspace: the folder holding runs/")
    try:
        library = update_library(args.workspace)
    except Refused as error:
        raise SystemExit(str(error)) from error
    print(f"Listed {len(library.runs)} run(s).")
    for run in library.runs:
        earlier = " (earlier methods)" if run["method_changes"] else ""
        print(f"  {run['id']}: {run['issuer_name']}, as of {run['as_of']}{earlier}")
    if library.excluded:
        print(f"Not shown: {len(library.excluded)} run folder(s).")
        for name, reason in library.excluded:
            print(f"  {name}: {reason}")
    print(f"Published {args.workspace.resolve() / 'library' / 'data.js'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
