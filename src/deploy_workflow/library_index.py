"""Which runs the Issuer Library lists, and what it shows for each. Reads files only.

A run folder under ``runs/`` is listed when CP-OS completed it and every module in it was answered
in this run:

- completed: a ``completed-<sha256>.json`` record named by its own hash, of the launcher's report
  kind, names a ``delivery-<sha256>.json`` manifest named by its own hash. One folder under
  ``deliveries/`` holds exactly the files its ``delivery.json`` lists, with those hashes, and its
  ``delivery.json`` has the ``delivery_sha256`` the completion record states. An earlier run
  states ``report_sha256`` instead, and its ``report.html`` has that hash. The handoffs the
  manifest names still have their hashes, and the manifest, the delivery's ``view.json`` and
  ``workflow.json`` name the same run. Nothing is rebuilt: a renderer change since the run does
  not unlist it.
- answered here: each module was answered in this run (not replayed from another run, not
  synthetic). The request record beside its accepted answer still has the fingerprint CP-OS named
  its folder by (``cpos.request_fingerprint``), so it holds the instructions actually sent.
- methods: the method block sent is compared with the one the launcher sends that module today
  (``cpos_launch.method_text``). A run whose block differs (a section changed, added or dropped)
  is still listed and marked: its record carries ``method_changes``, one ``"<module>: <detail>"``
  per module, empty for a run on today's methods (owner, 2026-11-11).

Every other run folder is left out with its reason. Nothing here runs analysis, calls a provider
or writes a file.
"""

from __future__ import annotations

import functools
import hashlib
import json
import os
import re
import stat
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import quote

from deploy_workflow.credit_os_chips import PATHWAY_MODULE_NAMES
from deploy_workflow.derived import derived
from deploy_workflow.reader_summary import TABLES, reader_tables

REPORT_KIND = "cpos-markdown-delivery/1"
MAX_FILE_BYTES = 64 << 20  # The library's one file limit, as in its discovery contract.
ANSWERED = frozenset({"live-provider", "host-session"})
EXECUTION_WORDS = {
    "live-provider": "Model provider",
    "host-session": "Host session",
    "retained-response-replay": "Reused from an earlier run",
    "synthetic": "Synthetic",
}
_COMPLETED = re.compile(r"^completed-([0-9a-f]{64})\.json$")
_RESPONSE = re.compile(r"^requests/([A-Z0-9-]+)/([0-9a-f]{64})/([1-9][0-9]*)\.response\.md$")
_HEADING = re.compile(r"^=== (\S+) sha256 [0-9a-f]{64} ===$", re.MULTILINE)
_SHA = re.compile(r"^[0-9a-f]{64}$")
_IDENTITY = ("run_id", "issuer_id", "issuer_name", "as_of", "pathway")

MethodText = Callable[[str], str | None]  # The current method block for a module, None if unknown.
MethodHeadings = Callable[[str], list[tuple[str, str]]]  # (section name, heading with its sha256)


class Refused(ValueError):
    """Why one run folder is not listed."""


@dataclass
class Library:
    runs: list[dict[str, Any]] = field(default_factory=list)
    excluded: list[tuple[str, str]] = field(default_factory=list)  # (run folder, reason)
    # Run id -> the delivery this build verified (folder, files, view fields). Per-build state,
    # shared read-only so later readers need not verify and parse the same delivery again; a
    # Library built by hand has none and its readers verify for themselves.
    deliveries: dict[str, dict[str, Any]] = field(default_factory=dict, repr=False)


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def read_inside(folder: Path, relative: str) -> bytes:
    """A regular file at ``relative`` below ``folder``; no absolute path, ``..``, link or hidden
    name on the way, and at most ``MAX_FILE_BYTES``."""
    # Split the text itself: PurePosixPath would drop "." and empty segments before they are seen.
    parts = relative.split("/")
    if "\\" in relative or any(not part or part.startswith(".") for part in parts):
        raise Refused(f"{relative!r} is not a path inside the run")
    path = folder
    for part in parts:
        path = path / part
        try:
            mode = os.lstat(path).st_mode
        except OSError as error:
            raise Refused(f"{relative} is missing") from error
        if stat.S_ISLNK(mode):
            raise Refused(f"{relative} is a link")
    if not stat.S_ISREG(mode):
        raise Refused(f"{relative} is not a file")
    if os.stat(path).st_size > MAX_FILE_BYTES:
        raise Refused(f"{relative} is larger than 64 MiB")
    return path.read_bytes()


def read_pinned(folder: Path, relative: str, digest: object) -> bytes:
    raw = read_inside(folder, relative)
    if not isinstance(digest, str) or sha256(raw) != digest:
        raise Refused(f"{relative} no longer has its recorded sha256")
    return raw


def json_object(raw: bytes, name: str) -> dict[str, Any]:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise Refused(f"{name} is not valid JSON") from error
    if not isinstance(value, dict):
        raise Refused(f"{name} is not a JSON object")
    return value


def completion_records(folder: Path) -> list[tuple[str, dict[str, Any]]]:
    """Each ``completed-<sha256>.json`` whose content has the hash its name states."""
    records = []
    for entry in sorted(os.listdir(folder)):
        match = _COMPLETED.match(entry)
        if not match:
            continue
        raw = read_inside(folder, entry)
        if sha256(raw) != match[1]:
            raise Refused(f"{entry} does not have the sha256 its name states")
        records.append((entry, json_object(raw, entry)))
    return records


def report_completion(folder: Path) -> dict[str, Any]:
    """The one completion record of the launcher's report kind."""
    records = completion_records(folder)
    if not records:
        raise Refused("not completed: no completion record")
    reports = [record for _, record in records if record.get("kind") == REPORT_KIND]
    if not reports:
        kinds = sorted({str(record.get("kind")) for _, record in records})
        raise Refused(f"not a report run of the current launcher (completion kind {kinds})")
    if len(reports) > 1:
        raise Refused("more than one report completion record; the current one is ambiguous")
    return reports[0]


def delivery_folder(
    folder: Path,
    stated: str,
    view: dict[str, bytes] | None = None,
    *,
    receipt_hash: bool = False,
) -> tuple[str, Mapping[str, str]]:
    """The folder under ``deliveries/`` holding exactly its listed files and the stated hash.

    The hash is that of the folder's ``delivery.json`` when ``receipt_hash`` (a run that states
    ``delivery_sha256``), otherwise that of its ``report.html`` (an earlier run).

    When ``view`` is given, the verified bytes of ``view.json`` are put in it, so the caller need
    not read that file a second time."""
    deliveries = folder / "deliveries"
    names = sorted(os.listdir(deliveries)) if deliveries.is_dir() else []
    for name in names:
        relative = f"deliveries/{name}"
        if name.startswith(".") or not os.path.lexists(folder / relative / "delivery.json"):
            continue  # Not a delivery: it has no receipt.
        raw_receipt = read_inside(folder, f"{relative}/delivery.json")
        receipt = json_object(raw_receipt, "delivery.json")
        files = receipt.get("files")
        if not isinstance(files, dict):
            continue
        found = sha256(raw_receipt) if receipt_hash else files.get("report.html")
        if found != stated:
            continue
        # Exactly, as CP-OS checks a publication: hidden entries count too.
        if set(os.listdir(folder / relative)) != set(files) | {"delivery.json"}:
            raise Refused(f"{relative} does not hold exactly the files its delivery.json lists")
        for entry, digest in files.items():
            raw = read_pinned(folder, f"{relative}/{entry}", digest)
            if view is not None and entry == "view.json":
                view[entry] = raw
        return relative, files
    raise Refused("no delivery folder holds the delivery the completion record names")


# What a reader of a verified delivery takes from its view.json. The file is megabytes of report
# data; these fields are the run it names and how the report qualifies itself.
VIEW_FIELDS = ("run", "mode", "analytical_qualification")


def view_fields(view: dict[str, Any]) -> dict[str, Any]:
    """The ``VIEW_FIELDS`` a parsed view.json states."""
    return {key: view[key] for key in VIEW_FIELDS if key in view}


def run_identity(run: Mapping[str, Any]) -> dict[str, str]:
    """The run's identity from ``workflow.json``: each part a non-empty string."""
    for key in _IDENTITY:
        if not isinstance(run.get(key), str) or not run[key].strip():
            raise Refused(f"workflow.json does not state the run's {key}")
    return {key: run[key] for key in _IDENTITY}


def same_identity(other: object, identity: Mapping[str, str], what: str) -> None:
    if not isinstance(other, dict):
        raise Refused(f"{what} does not name its run")
    for key, value in identity.items():
        if other.get(key) != value:
            raise Refused(f"{what} names a different run ({key})")


def verified_delivery(folder: Path, completion: Mapping[str, Any]) -> dict[str, Any]:
    """The checked delivery: its manifest, folder, receipt or report hash, handoffs and the
    ``VIEW_FIELDS`` of its view.json."""
    manifest_sha = completion.get("delivery_manifest_sha256")
    delivery_sha = completion.get("delivery_sha256")
    report_sha = completion.get("report_sha256")
    if not isinstance(manifest_sha, str) or not _SHA.match(manifest_sha):
        raise Refused("the completion record names no delivery manifest")
    by_receipt = isinstance(delivery_sha, str) and _SHA.match(delivery_sha) is not None
    stated = delivery_sha if by_receipt else report_sha
    if not isinstance(stated, str) or not _SHA.match(stated):
        raise Refused("the completion record names no delivery receipt or report")
    name = f"delivery-{manifest_sha}.json"
    manifest = json_object(read_pinned(folder, name, manifest_sha), name)
    checked: dict[str, bytes] = {}
    relative, files = delivery_folder(folder, stated, checked, receipt_hash=by_receipt)
    if "view.json" not in checked:  # The folder holds exactly its listed files, so it is missing.
        raise Refused(f"{relative}/view.json is missing")
    # The bytes have the hash the delivery lists (delivery_folder), so their fields are that hash's.
    view = derived(
        ("delivery-view", files["view.json"]),
        lambda: view_fields(json_object(checked["view.json"], "view.json")),
    )
    handoffs, modules = manifest.get("handoffs"), completion.get("modules")
    execution = completion.get("module_execution")
    if not isinstance(handoffs, dict) or not isinstance(modules, dict) or not modules:
        raise Refused("the delivery records no handoffs")
    if (
        not isinstance(execution, dict)
        or set(handoffs) != set(modules)
        or set(modules) != set(execution)
    ):
        raise Refused("the completion record and the delivery manifest name different modules")
    for module, path in modules.items():
        pin = handoffs[module]
        if not isinstance(pin, dict) or pin.get("path") != path:
            raise Refused(f"the delivery does not record {module}'s handoff")
        read_pinned(folder, str(path), pin.get("sha256"))
        if files.get(f"{module}.md") != pin["sha256"]:
            raise Refused(f"the delivery's copy of {module}'s handoff is not the one it names")
    return {
        "manifest": manifest,
        "view": view,
        "folder": relative,
        "files": files,
        "delivery_sha256": stated if by_receipt else None,
        "report_sha256": None if by_receipt else stated,
        "handoffs": {m: handoffs[m] for m in modules},
    }


def sent_instructions(folder: Path, module: str, response: str, identity: Mapping[str, str]) -> str:
    """The instructions a module's accepted answer was given, from the request record beside it.

    CP-OS named the request folder by the fingerprint of the request's inputs, and the completion
    record names the answer in that folder, so a record that still has that fingerprint is the
    request actually sent.
    """
    from deploy_workflow.owners.cpos import request_fingerprint

    match = _RESPONSE.match(response)
    if not match or match[1] != module:
        raise Refused(f"{module}: its answer is not in a CP-OS request folder")
    relative = f"requests/{module}/{match[2]}/{match[3]}.request.json"
    request = json_object(read_inside(folder, relative), relative)
    inputs = {key: value for key, value in request.items() if key not in {"attempt", "feedback"}}
    if request.get("attempt") != int(match[3]) or request_fingerprint(inputs) != match[2]:
        raise Refused(f"{relative} is not the request its folder was named for")
    if request.get("module_id") != module or request.get("retained_response_sha256") is not None:
        raise Refused(f"{relative} is not a request answered in this run")
    same_identity(request.get("run"), identity, f"the {module} request")
    instructions = request.get("instructions")
    if not isinstance(instructions, str):
        raise Refused(f"{relative} records no instructions")
    return instructions


def pathway_method(module: str, pathway: str) -> tuple[str, list[tuple[str, str]]] | None:
    """The method block and the section headings a pathway selects for a module in place of the
    injected one-argument lookups (plan C2: credit screening's CP-L10); None when it has none."""
    from deploy_workflow.owners.cpos_launch import (
        method_heading,
        method_sections,
        method_text,
    )
    from deploy_workflow.owners.cpos_launch import pathway_method as selected

    if selected(module, pathway) is None:
        return None
    sections = method_sections(module, pathway)
    return method_text(module, pathway), [(n, method_heading(n, body)) for n, body in sections]


def method_difference(
    block: str, module: str, headings: MethodHeadings, pathway: str | None = None
) -> str:
    """Which method sections differ between what was sent and what is selected today (for
    ``pathway``, when it selects a method of its own for the module)."""
    sent = set(_HEADING.findall(block))
    own = None if pathway is None else pathway_method(module, pathway)
    current = headings(module) if own is None else own[1]
    changed = [name for name, heading in current if heading not in block]
    dropped = sorted(sent - {name for name, _ in current})
    parts = [f"{', '.join(changed)} changed"] if changed else []
    parts += [f"{', '.join(dropped)} no longer selected"] if dropped else []
    return "; ".join(parts) or "method text changed"


def check_methodology(
    folder: Path,
    delivered: Mapping[str, Any],
    execution: Mapping[str, Any],
    identity: Mapping[str, str],
    method: tuple[MethodText, MethodHeadings],
) -> list[str]:
    """Refuse unless every module was answered here and has a current method. Returns what changed
    in the method block of a module since it was sent ("<module>: <detail>"); empty when none."""
    from deploy_workflow.owners.cpos_launch import METHOD_MARK, without_notes

    method_text, method_headings = method
    changes: list[str] = []
    for module, pin in delivered["handoffs"].items():
        how = execution.get(module)
        if how not in ANSWERED:
            word = EXECUTION_WORDS.get(str(how), f"recorded as {how!r}")
            raise Refused(f"{module}: {word.lower()}; its methodology is not this run's")
        own = pathway_method(module, identity["pathway"])
        current = method_text(module) if own is None else own[0]
        if current is None:
            raise Refused(f"{module}: no current method is selected for this module")
        text = sent_instructions(folder, module, pin["path"], identity).replace("\r\n", "\n")
        _, mark, block = text.partition(METHOD_MARK)
        block = without_notes(block)  # first-pass reading notes follow the method, not part of it
        if not mark or block != current + "\n":
            detail = method_difference(block, module, method_headings, identity["pathway"])
            changes.append(f"{module}: {detail}")
    return changes


def reader_summary(text: str) -> dict[str, Any] | None:
    """The handoff's own reader tables, verbatim; None when they are not in the expected form."""
    tables = reader_tables(text)
    if len(tables) < 2 or tuple(tables[0][0]) != TABLES[0] or tuple(tables[1][0]) != TABLES[1]:
        return None
    if len(tables[0]) != 2 or any(len(row) != 3 for row in tables[0] + tables[1]):
        return None
    bottom, confidence, limitation = tables[0][1]
    findings = [{"finding": f, "impact": i, "confidence": c} for f, i, c in tables[1][1:]]
    return {
        "bottom_line": bottom,
        "confidence": confidence,
        "limitation": limitation,
        "findings": findings,
    }


def decimal_text(value: object) -> Decimal | None:
    if not isinstance(value, str):
        return None
    try:
        amount = Decimal(value)
    except InvalidOperation:
        return None
    return amount if amount.is_finite() else None


def call_records(folder: Path) -> list[dict[str, Any]]:
    """The run's model-call records; an unreadable line is kept as an empty record."""
    try:
        raw = read_inside(folder, "live/calls.jsonl")
    except Refused:
        return []
    calls = []
    for line in raw.decode("utf-8", errors="replace").splitlines():
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            value = {}
        calls.append(value if isinstance(value, dict) else {})
    return calls


def execution_record(folder: Path) -> dict[str, Any]:
    """Model, effort, spend and start time, as the run's own call records state them."""
    calls = call_records(folder)
    try:
        loop = json_object(read_inside(folder, "live/loop.json"), "loop.json")
    except Refused:
        loop = {}
    settled = [decimal_text(call.get("settled_usd")) for call in calls]
    known = [amount for amount in settled if amount is not None]
    models = sorted(
        {
            f"{call.get('reported_model') or call.get('requested_model')}"
            f" · {call.get('requested_effort')}"
            for call in calls
            if call.get("reported_model") or call.get("requested_model")
        }
    )
    started = sorted(str(c["started_at"]) for c in calls if isinstance(c.get("started_at"), str))
    return {
        "config": loop.get("config") if isinstance(loop.get("config"), str) else None,
        "models": models,
        "calls": len(calls),
        "spend_usd": format(sum(known, Decimal(0)), "f") if calls else None,
        "unknown_charges": len(settled) - len(known),
        "started_at": started[0] if started else None,
    }


def text_or_none(value: object) -> str | None:
    return value if isinstance(value, str) else None


def link(page_dir: Path, target: Path) -> str:
    return quote(PurePosixPath(Path(os.path.relpath(target, page_dir))).as_posix(), safe="/")


def module_titles(pathway: str | None = None) -> dict[str, str]:
    """The registry's module titles, with the reader names a pathway varies (ruling R12: CP-L10 in
    a credit screening reads "Credit screening"); for any other pathway the registry's titles."""
    from deploy_vii.registry import modules

    names = PATHWAY_MODULE_NAMES.get(pathway or "", {})
    return {m.module_id: names.get(m.module_id, m.title) for m in modules()}


def module_entries(
    folder: Path,
    page_dir: Path,
    delivered: Mapping[str, Any],
    execution: Mapping[str, Any],
    pathway: str | None = None,
) -> list[dict[str, Any]]:
    titles = module_titles(pathway)
    entries = []
    for module, pin in delivered["handoffs"].items():
        raw = read_inside(folder, pin["path"])
        entries.append(
            {
                "id": module,
                "title": titles.get(module, module),
                "execution": EXECUTION_WORDS.get(str(execution.get(module)), "Not recorded"),
                "href": link(page_dir, folder / pin["path"]),
                "sha256": pin["sha256"],
                "summary": reader_summary(raw.decode("utf-8", errors="replace")),
            }
        )
    return entries


CHANGES_PACK = "changes.json"  # `deploy_workflow.changes.PACK_NAME`, which imports this module
FIRST_RUN_LINE = "changes: first run of this pathway"  # `changes.describe(None)`


def changes_record(delivered: Mapping[str, Any], completion: Mapping[str, Any]) -> dict[str, Any]:
    """What the verified delivery says about CP-8's comparison: the pack it publishes (path inside
    the run folder and hash; None when it holds none) and the reason there is no explanation
    (`note`: the manifest's `changes_note` when CP-8 was planned and not produced, else the run's
    own recorded line when it says why no comparison was made; None otherwise). A first run of the
    pathway is the run whose record is the bare first-run line; one that records nothing is not."""
    digest = delivered["files"].get(CHANGES_PACK)
    note = delivered["manifest"].get("changes_note")
    line = completion.get("changes")  # `deploy_workflow.changes.describe` and the launcher's lines
    if not isinstance(note, str) and isinstance(line, str):
        compares = line.startswith("changes: CP-8 compares with ")
        note = None if line == FIRST_RUN_LINE or compares else line
    return {
        "first_run": line == FIRST_RUN_LINE,
        "pack": {"path": f"{delivered['folder']}/{CHANGES_PACK}", "sha256": digest}
        if isinstance(digest, str)
        else None,
        "note": note if isinstance(note, str) else None,
    }


def _module_set(value: object) -> set[str] | None:
    if not isinstance(value, list) or not value:
        return None
    if any(not isinstance(code, str) or not code.strip() for code in value):
        return None
    selected = set(value)
    return selected if len(selected) == len(value) else None


def _custom_scope(
    workflow: Mapping[str, Any], required: set[str], modules: set[str], planned: set[str]
) -> str:
    """A custom run's scope (PR 7a, ruling C10): the analyst chose the modules, so an explicit
    selection that is not the preset is what a custom run is. It is `standard` when every planned
    module less CP-8 delivered and `partial` when one did not (or a test adaptation ran); a
    selection the launcher does not write is `unverified`, as for any run."""
    if workflow.get("selection") not in ("preset", "explicit"):
        return "unverified"
    if workflow.get("test_adaptations") or not (required <= modules <= planned):
        return "partial"
    return "standard"


def _preset_scope(workflow: Mapping[str, Any], asked: set[str]) -> str:
    """A preset pathway's run that delivered what it planned: `standard` when what it asked for is
    the pathway's own modules, `partial` when not; `unverified` without the recorded preset."""
    preset = _module_set(workflow.get("preset_requested_modules"))
    if workflow.get("selection") != "preset" or preset is None:
        return "unverified"
    return "standard" if asked == preset else "partial"


def assessment_scope(workflow: Mapping[str, Any], delivered: Mapping[str, Any]) -> str:
    """Compare the frozen submission plan and the receipts' verified handoff pins."""
    requested = _module_set(workflow["run"].get("requested_modules"))
    published = _module_set(delivered["manifest"]["run"].get("requested_modules"))
    if requested is None or requested != published or delivered["delivery_sha256"] is None:
        return "unverified"
    comparison = {"CP-8"}
    modules = set(delivered["handoffs"])
    if requested == comparison or modules == comparison:
        return "partial"
    instructions = workflow.get("instructions")
    if not isinstance(instructions, dict) or not requested <= instructions.keys():
        return "unverified"
    selection = workflow.get("selection")
    planned = set(instructions)
    required = planned - comparison
    if workflow["run"].get("pathway") == "custom":
        return _custom_scope(workflow, required, modules, planned)
    if (
        selection == "explicit"
        or workflow.get("test_adaptations")
        or not (required <= modules <= planned)
    ):  # a run with a test-only adaptation is never the standard scope
        return "partial"
    return _preset_scope(workflow, requested - comparison)


def publication_time(completion: Mapping[str, Any]) -> str | None:
    """The time CP-OS recorded in the digest-addressed completion, when available."""
    value = completion.get("published_at")
    if not isinstance(value, str) or "T" not in value:
        return None
    try:
        published = datetime.fromisoformat(value)
        return published.astimezone(UTC).isoformat() if published.tzinfo is not None else None
    except (ValueError, OverflowError):
        return None


def admit_run(
    folder: Path,
    page_dir: Path,
    method: tuple[MethodText, MethodHeadings],
    deliveries: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """The run's library record, or ``Refused`` with the reason it is not listed.

    When ``deliveries`` is given, the verified delivery of an admitted run is kept in it."""
    if not os.path.lexists(folder / "workflow.json"):
        raise Refused("not a CP-OS launcher run (no workflow.json)")
    workflow_raw = read_inside(folder, "workflow.json")
    workflow = json_object(workflow_raw, "workflow.json")
    run = workflow.get("run")
    if not isinstance(run, dict):
        raise Refused("workflow.json names no run")
    identity = run_identity(run)
    completion = report_completion(folder)
    workflow_pin = completion.get("workflow_sha256")
    delivered = verified_delivery(folder, completion)
    same_identity(delivered["manifest"].get("run"), identity, "the delivery manifest")
    same_identity(delivered["view"].get("run"), identity, "the delivered report")
    execution = completion["module_execution"]
    method_changes = check_methodology(folder, delivered, execution, identity, method)
    requested = run.get("requested_modules")
    cap = completion.get("provider_cap_usd")
    record = {
        "id": folder.name,
        **identity,
        **{key: text_or_none(run.get(key)) for key in ("case_kind", "method_version")},
        "requested_modules": [m for m in requested if isinstance(m, str)]
        if isinstance(requested, list)
        else [],
        "modules": module_entries(folder, page_dir, delivered, execution, identity["pathway"]),
        "scope": text_or_none(completion.get("scope")) or "",
        "cap_usd": cap if decimal_text(cap) is not None else None,
        # Only an earlier run has a rendered report page; a later run's report is the library's.
        "report": {
            "href": link(page_dir, folder / delivered["folder"] / "report.html"),
            "sha256": delivered["report_sha256"],
        }
        if delivered["report_sha256"] is not None
        else None,
        "delivery_sha256": delivered["delivery_sha256"],
        "assessmentScope": assessment_scope(workflow, delivered)
        if workflow_pin == sha256(workflow_raw)
        else "unverified",
        "publishedAt": publication_time(completion) if delivered["delivery_sha256"] else None,
        "execution": execution_record(folder),
        "method_changes": method_changes,
        "changes": changes_record(delivered, completion),
    }
    if deliveries is not None:  # Only a run that is listed is kept.
        deliveries[folder.name] = delivered
    return record


def mark_latest(runs: list[dict[str, Any]]) -> None:
    """Flag each issuer's latest evidence date; runs sharing that date are all flagged and counted.
    A run with no as-of date is never the latest."""
    latest: dict[str, str] = {}
    for run in runs:
        as_of = run.get("as_of")
        if isinstance(as_of, str) and as_of > latest.get(run["issuer_id"], ""):
            latest[run["issuer_id"]] = as_of
    for run in runs:
        flagged = isinstance(run.get("as_of"), str) and latest.get(run["issuer_id"]) == run["as_of"]
        run["latest"] = flagged
        run["latest_shared_with"] = (
            sum(
                1
                for other in runs
                if other is not run
                and other["issuer_id"] == run["issuer_id"]
                and other.get("as_of") == run["as_of"]
            )
            if flagged
            else 0
        )


def current_method() -> tuple[MethodText, MethodHeadings]:
    """The launcher's own definition of each module's current method."""
    from deploy_workflow.owners.cpos_launch import (
        METHODS,
        method_heading,
        method_sections,
        method_text,
    )

    def text(module: str) -> str | None:
        return method_text(module) if module in METHODS else None

    def headings(module: str) -> list[tuple[str, str]]:
        sections = method_sections(module) if module in METHODS else []
        return [(name, method_heading(name, body)) for name, body in sections]

    return text, headings


def build_library(
    workspace: Path, page_dir: Path, method: tuple[MethodText, MethodHeadings] | None = None
) -> Library:
    """Every run folder in ``workspace/runs``, listed or left out with its reason."""
    # Each run is compared with the same method texts, read once for the build.
    text, headings = method or current_method()
    method = functools.cache(text), functools.cache(headings)
    library = Library()
    runs_dir = workspace / "runs"
    names = sorted(os.listdir(runs_dir)) if runs_dir.is_dir() else []
    for name in names:
        folder = runs_dir / name
        # A name the file system could not decode is shown with replacement characters.
        shown = name.encode("utf-8", "surrogateescape").decode("utf-8", "replace")
        if name.startswith(".") or not (folder.is_symlink() or folder.is_dir()):
            continue  # Hidden entries and plain files are not run folders.
        if folder.is_symlink():
            library.excluded.append((shown, "a link to another folder; not followed"))
            continue
        try:
            library.runs.append(admit_run(folder, page_dir, method, library.deliveries))
        except Refused as error:
            library.excluded.append((shown, str(error)))
        except (OSError, ValueError, TypeError, KeyError, RecursionError) as error:
            # One unreadable folder must not stop the others from being listed.
            library.excluded.append((shown, f"unreadable run record ({type(error).__name__})"))
    mark_latest(library.runs)
    # Issuer A to Z; within an issuer the latest evidence date first, then the run folder.
    library.runs.sort(key=lambda r: r["id"])
    library.runs.sort(key=lambda r: str(r.get("as_of") or ""), reverse=True)
    library.runs.sort(key=lambda r: str(r.get("issuer_name") or ""))
    return library
