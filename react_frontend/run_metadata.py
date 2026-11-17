"""Read existing accepted-response identities for display; never execute or assess a module."""

from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from credit_os.source import regular_chunks

from deploy_vii.registry import dependencies, plan
from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.library_index import Refused, json_object, run_identity, same_identity
from deploy_workflow.owners.cpos import request_fingerprint
from deploy_workflow.run_events import EVENTS, progress

from . import admission
from .library_cards import response_assessment

_SHA = re.compile(r"[0-9a-f]{64}\Z")
_RESPONSE = re.compile(r"requests/(CP-[A-Z0-9]+)/([0-9a-f]{64})/([1-3])\.response\.md\Z")
_COMPLETED = re.compile(r"completed-([0-9a-f]{64})\.json\Z")
_FILE_BYTES = 4 * 1024 * 1024
_TOTAL_BYTES = 32 * 1024 * 1024
_PUBLICATION_BYTES = 64 * 1024 * 1024
_EXPORT = "window.CREDIT_OS_DATA="


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


@dataclass
class _Reads:
    root: Path
    remaining: int = _TOTAL_BYTES
    names_remaining: int = 1000

    def raw(self, relative: str, limit: int = _FILE_BYTES) -> bytes:
        parts = relative.split("/")
        if "\\" in relative or any(not part or part.startswith(".") for part in parts):
            raise Refused("metadata path is not inside the run")
        path = self.root
        if path.resolve() != path:
            raise Refused("metadata root is a link")
        for part in parts:
            path = path / part
            if path.is_symlink():
                raise Refused("metadata path is a link")
        raw = b"".join(regular_chunks(path, follow=False, limit=min(limit, self.remaining)))
        self.remaining -= len(raw)
        return raw

    def object(self, relative: str) -> dict[str, Any]:
        return json_object(self.raw(relative), relative)

    def names(self, relative: str) -> list[str]:
        path = self.root / relative
        if path.resolve() != path:
            raise Refused("run metadata directory is a link")
        if not path.exists():
            return []
        names = []
        with os.scandir(path) as entries:
            for entry in entries:
                self.names_remaining -= 1
                if self.names_remaining < 0:
                    raise Refused("too many run metadata entries")
                names.append(entry.name)
        return sorted(names)


def _workflow(reader: _Reads, record: runs.Record) -> dict[str, Any]:
    workflow = reader.object("workflow.json")
    if not isinstance(workflow.get("run"), dict):
        raise Refused("workflow run identity is not recorded")
    identity = run_identity(workflow.get("run", {}))
    config = runs.config_for(record.model, record.effort)
    expected = {
        "run_id": f"{record.issuer_id}-{record.as_of}-{record.pathway}-{config}",
        "issuer_id": record.issuer_id,
        "issuer_name": record.issuer_name,
        "as_of": record.as_of,
        "pathway": record.pathway,
    }
    same_identity(identity, expected, "workflow")
    if reader.object("identity.json").get("run") != workflow["run"]:
        raise Refused("workflow differs from the engine's run identity")
    if not isinstance(workflow.get("instructions"), dict):
        raise Refused("workflow instructions are not recorded")
    return workflow


def _selection(reader: _Reads, workflow: dict[str, Any]) -> dict[str, dict[str, Any]]:
    records = []
    for name in reader.names(""):
        match = _COMPLETED.fullmatch(name)
        if match is None:
            continue
        raw = reader.raw(name)
        if _sha(raw) != match[1]:
            raise Refused("completion record identity differs")
        value = json_object(raw, name)
        if value.get("kind") == "cpos-markdown-delivery/1":
            records.append(value)
    if not records:
        return {}
    if len(records) != 1:
        raise Refused("completion selection is ambiguous")
    completion = records[0]
    digest = completion.get("delivery_manifest_sha256")
    if not isinstance(digest, str) or _SHA.fullmatch(digest) is None:
        raise Refused("completion has no pinned delivery manifest")
    raw = reader.raw(f"delivery-{digest}.json")
    if _sha(raw) != digest:
        raise Refused("delivery manifest identity differs")
    manifest = json_object(raw, "delivery manifest")
    same_identity(manifest.get("run"), run_identity(workflow["run"]), "delivery manifest")
    selected, handoffs = completion.get("modules"), manifest.get("handoffs")
    if (
        not isinstance(selected, dict)
        or not isinstance(handoffs, dict)
        or set(selected) != set(handoffs)
    ):
        raise Refused("completion and delivery selection differ")
    if len(selected) > 1000 or set(selected) - set(workflow["instructions"]):
        raise Refused("completion names an unplanned module")
    return _selected_pins(selected, handoffs)


def _selected_pins(selected: dict[str, Any], handoffs: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result = {}
    for code, path in selected.items():
        pin = handoffs[code]
        if not isinstance(pin, dict) or pin.get("path") != path:
            raise Refused("completion handoff path differs")
        result[code] = pin
    return result


def _events(reader: _Reads) -> list[dict[str, Any]] | None:
    if not (reader.root / EVENTS).exists():
        return None
    raw = reader.raw(EVENTS)
    lines = raw.decode("utf-8").splitlines()
    if len(lines) > 1000:
        raise Refused("too many metadata events")
    events = []
    for index, line in enumerate(lines):
        try:
            event = json.loads(line)
        except ValueError:
            if index == len(lines) - 1:
                break  # The engine's reader also leaves a torn final append for the next poll.
            raise
        if not isinstance(event, dict):
            raise Refused("run event is not an object")
        events.append(event)
    return events


def _source_hashes(workflow: dict[str, Any], code: str) -> dict[str, str]:
    pins = workflow.get("sources")
    if not isinstance(pins, dict):
        raise Refused("workflow source identities unavailable")
    result = {}
    for name, pin in pins.items():
        if code != "CP-8" and name.startswith("prior/"):
            continue
        digest = pin.get("sha256") if isinstance(pin, dict) else None
        if not isinstance(digest, str) or _SHA.fullmatch(digest) is None:
            raise Refused("workflow source identity invalid")
        result[name] = digest
    return result


def _inputs_match(
    request: dict[str, Any], workflow: dict[str, Any], code: str, upstream: dict[str, str]
) -> None:
    if request.get("module_id") != code or request.get("run") != workflow["run"]:
        raise Refused("request names another run or module")
    instructions = request.get("instructions")
    pin = workflow["instructions"].get(code)
    if not isinstance(instructions, str) or not isinstance(pin, dict):
        raise Refused("request instructions unavailable")
    if _sha(instructions.encode()) != pin.get("sha256"):
        raise Refused("request instructions differ from workflow")
    sources = _source_hashes(workflow, code)
    if code == "CP-8" and isinstance(request.get("sources"), dict):
        extra = request["sources"].get("changes.json")
        if isinstance(extra, str) and _SHA.fullmatch(extra):
            sources["changes.json"] = extra
    if request.get("sources") != sources or request.get("handoffs") != upstream:
        raise Refused("request source or upstream identities differ")


def _origin(request: dict[str, Any], workflow: dict[str, Any], code: str, digest: str) -> str:
    if "retained_response_sha256" not in request:
        raise Refused("response provenance not recorded")
    retained = workflow.get("retained_handoffs", {})
    if not isinstance(retained, dict):
        raise Refused("retained response pins invalid")
    pin = retained.get(code)
    recorded = request["retained_response_sha256"]
    if pin is None and recorded is None:
        return "new-response"
    if not isinstance(pin, dict) or recorded != digest or pin.get("sha256") != digest:
        raise Refused("retained response identity differs")
    if pin.get("upstream") != request["handoffs"]:
        raise Refused("retained upstream identities differ")
    if pin.get("source_hashes") != _source_hashes(workflow, "CP-8"):
        raise Refused("retained source identities differ")
    return "retained-response"


def _checked_response(
    reader: _Reads, path: str, workflow: dict[str, Any], upstream: dict[str, str]
) -> dict[str, str | None]:
    match = _RESPONSE.fullmatch(path)
    if match is None:
        raise Refused("response is not in a module request folder")
    code, fingerprint, attempt = match.groups()
    stem = path.removesuffix(".response.md")
    request = reader.object(f"{stem}.request.json")
    inputs = {key: value for key, value in request.items() if key not in {"attempt", "feedback"}}
    if type(request.get("attempt")) is not int or request["attempt"] != int(attempt):
        raise Refused("request attempt differs")
    if request_fingerprint(inputs) != fingerprint:
        raise Refused("request fingerprint differs")
    _inputs_match(request, workflow, code, upstream)
    raw = reader.raw(path)
    digest = _sha(raw)
    review = reader.object(f"{stem}.review.json")
    if review.get("response_sha256") != digest or review.get("issues") != []:
        raise Refused("response was not accepted by its recorded review")
    return {
        "module": code,
        "assessment": response_assessment(raw),
        "provenance": _origin(request, workflow, code, digest),
        "response_sha256": digest,
    }


def _paths(reader: _Reads, code: str) -> list[str]:
    paths = []
    for fingerprint in reader.names(f"requests/{code}"):
        if _SHA.fullmatch(fingerprint) is None:
            continue
        relative = f"requests/{code}/{fingerprint}"
        for name in reader.names(relative):
            path = f"{relative}/{name}"
            if _RESPONSE.fullmatch(path):
                paths.append(path)
    return paths


def _one_output(
    reader: _Reads, workflow: dict[str, Any], code: str, context: dict[str, Any]
) -> dict[str, str | None]:
    unknown = {"module": code, "assessment": None, "provenance": None, "response_sha256": None}
    try:
        if context["latest"].get(code) in {"module_started", "draft_rejected"}:
            return unknown
        upstream = {module: context["hashes"][module] for module in context["producers"][code]}
        pin = context["selected"].get(code)
        paths = [pin["path"]] if pin else _paths(reader, code)
        checked = []
        for path in paths:
            try:
                value = _checked_response(reader, path, workflow, upstream)
            except (Refused, OSError, ValueError, RecursionError):
                continue
            if value["module"] == code and (
                not pin or value["response_sha256"] == pin.get("sha256")
            ):
                checked.append(value)
        return checked[0] if len(checked) == 1 else unknown
    except (Refused, OSError, ValueError, KeyError, TypeError, RecursionError):
        return unknown  # Optional display metadata: unavailable is explicit, not a module verdict.


def module_outputs(directory: Path, record: runs.Record) -> list[dict[str, str | None]] | None:
    """Only accepted event states or a pinned final selection can identify a response."""
    reader = _Reads(directory)
    try:
        workflow = _workflow(reader, record)
        selected = _selection(reader, workflow)
        events = _events(reader)
        if events is None and not selected:
            return None
        states = progress(events or []).modules
        accepted = {code for code, state in states.items() if state == "done"}
        accepted.update(code for code in selected if code not in states)
        ordered = tuple(code for code in plan(workflow["instructions"]) if code in accepted)
        context: dict[str, Any] = {
            "selected": selected,
            "hashes": {},
            "producers": dependencies(tuple(workflow["instructions"])),
            "latest": {
                event["module"]: event["event"]
                for event in events or []
                if event.get("event") in {"module_started", "module_accepted", "draft_rejected"}
                and isinstance(event.get("module"), str)
            },
        }
        result = []
        for code in ordered:
            value = _one_output(reader, workflow, code, context)
            result.append(value)
            if value["response_sha256"] is not None:
                context["hashes"][code] = value["response_sha256"]
        return result
    except (Refused, OSError, ValueError, KeyError, TypeError, RecursionError):
        return None  # Historical/corrupt metadata must not become a recorded empty result.


def library_admission(layout: Layout, record: runs.Record) -> str | None:
    """Current scoped publication membership; no claim about an admission timestamp."""
    try:
        raw = _Reads(layout.engine, _PUBLICATION_BYTES).raw("library/data.js", _PUBLICATION_BYTES)
        assignment = raw.decode("utf-8").rstrip()
        if not assignment.startswith(_EXPORT) or not assignment.endswith(";"):
            return None
        snapshot = json_object(assignment[len(_EXPORT) : -1].encode(), "library publication")
        visible = admission.admitted(snapshot, layout)
        scoped = [
            run for run in visible["workspace"]["runs"].values() if run["folder"] == record.id
        ]
        listed = [run for run in visible["catalogue"]["real"] if run["id"] == record.id]
        if len(scoped) > 1 or len(listed) > 1:
            return None
        if not scoped or not listed:
            return "not-listed"
        if (scoped[0].get("pathway"), listed[0].get("name"), listed[0].get("date")) != (
            record.pathway,
            record.issuer_name,
            record.as_of,
        ):
            return None
        return "listed"
    except (Refused, OSError, ValueError, KeyError, TypeError, AttributeError, RecursionError):
        # A malformed optional publication is an explicit unknown, not a missing run record.
        return None
