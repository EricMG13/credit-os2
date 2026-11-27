"""Attach verified original issuer sources to an admitted React publication."""

from __future__ import annotations

import copy
import hashlib
import json
import logging
import re
import zlib
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import SplitResult, parse_qs, quote, unquote
from xml.etree.ElementTree import ParseError
from zipfile import BadZipFile

from pypdf.errors import PyPdfError

from deploy_workflow import credit_os_chips as native
from deploy_workflow import http_base
from deploy_workflow.library_index import Refused, read_inside
from deploy_workflow.model.handoff import _pages

_LOG = logging.getLogger(__name__)
PREFIX = "/connected/sources/"
ADDRESS = re.compile(r"/connected/sources/([^/]+)/([0-9a-f]{64})/([^/]+)")
DIGEST = re.compile(r"[0-9a-f]{64}")
GROUPS = ("sources", "unused", "unrecorded")


@dataclass(frozen=True)
class Source:
    name: str
    digest: str
    raw: bytes
    pages: dict[int, str]
    problem: str | None

    def href(self, folder: str) -> str:
        return f"{PREFIX}{quote(folder, safe='')}/{self.digest}/{quote(self.name, safe='')}"


def _folder(value: str) -> bool:
    return value not in {".", ".."} and re.fullmatch(r"[\w. -]+", value) is not None


def _published(record: dict[str, Any]) -> Iterator[dict[str, Any]]:
    for group in GROUPS:
        yield from record.get("evidence", {}).get(group, [])


def _pins(root: Path, folder: str) -> dict[str, Any]:
    if not _folder(folder):
        raise Refused("invalid report folder")
    workflow = json.loads(read_inside(root, f"{folder}/workflow.json"))
    if not isinstance(workflow, dict) or not isinstance(workflow.get("sources"), dict):
        raise Refused("workflow source pins unavailable")
    return dict(workflow["sources"])


class SourceMismatch(Refused):
    def __init__(self, actual: str) -> None:
        super().__init__("source bytes do not match recorded sha256")
        self.actual = actual


PageCache = dict[str, tuple[dict[int, str], str | None, str | None]]


@dataclass
class Checked:
    authority: bool = False
    available: dict[str, Source] = field(default_factory=dict)
    inventory: native.Inventory = field(default_factory=native.Inventory)
    cache: PageCache = field(default_factory=dict)


def _identity(item: dict[str, Any], pins: dict[str, Any]) -> tuple[str, str]:
    name, digest = item.get("name"), item.get("sha256")
    if not isinstance(name, str) or not native.is_file_name(name):
        raise Refused("invalid source filename")
    if not isinstance(digest, str) or not DIGEST.fullmatch(digest):
        raise Refused("published source hash unavailable")
    pin = pins.get(name)
    if not isinstance(pin, dict) or pin.get("sha256") != digest:
        raise Refused("published source does not match workflow pin")
    return name, digest


def _source(root: Path, folder: str, name: str, digest: str, *, pages: bool = True) -> Source:
    raw = read_inside(root, f"{folder}/inputs/{digest}")
    actual = hashlib.sha256(raw).hexdigest()
    if actual != digest:
        raise SourceMismatch(actual)
    page_map: dict[int, str] = {}
    problem = None
    if pages:
        try:
            page_map = dict(enumerate(_pages(name, raw), 1))
        except (
            ValueError,
            OSError,
            TypeError,
            KeyError,
            IndexError,
            BadZipFile,
            PyPdfError,
            ParseError,  # a workbook part that is not well-formed XML
            zlib.error,  # a corrupt compressed stream
            EOFError,  # truncated compressed data
            RuntimeError,  # zipfile: an encrypted member (NotImplementedError is a subclass)
        ) as error:
            problem = f"source pages unavailable: {type(error).__name__}"
            _LOG.warning(
                "source pages unavailable for %s: %s: %s", name, type(error).__name__, error
            )
    return Source(name, digest, raw, page_map, problem)


def verified_one(
    root: Path, record: dict[str, Any], name: str, digest: str, *, pages: bool = False
) -> Source | None:
    """Recheck the requested original against its publication and workflow pin only."""
    try:
        if not any(
            item.get("name") == name and item.get("sha256") == digest for item in _published(record)
        ):
            return None
        pins = _pins(root, record["folder"])
        identity = _identity({"name": name, "sha256": digest}, pins)
        return _source(root, record["folder"], *identity, pages=pages)
    except (OSError, ValueError):
        return None


def _earlier_handoff_format(sections: list[dict[str, Any]]) -> bool:
    """Match the report frame's label for a held, structured handoff."""
    if not sections or (
        len(sections) == 1
        and sections[0].get("level") == 1
        and sections[0].get("heading") == "Unstructured handoff"
    ):
        return False
    findings = False
    for section in sections:
        level, heading = section.get("level"), section.get("heading")
        if findings:
            if level == 3:
                return heading != "Bottom line"
            if level in (1, 2):
                break
        elif level == 2 and heading == "Findings":
            findings = True
    return True


def _call_start(receipt: object) -> tuple[datetime, int | None] | None:
    if not isinstance(receipt, dict) or not isinstance(receipt.get("started"), str):
        return None
    try:
        started = datetime.fromisoformat(receipt["started"])
        if started.tzinfo is None:
            return None
        attempt = receipt.get("attempt")
        return started.astimezone(UTC), attempt if type(attempt) is int else None
    except (OverflowError, ValueError):
        return None


def _first_model_call(run: dict[str, Any]) -> dict[str, str | int | None] | None:
    """An issuer history summary carries only the first receipt's time and attempt."""
    evidence = run.get("evidence")
    record = evidence.get("record") if isinstance(evidence, dict) else None
    calls = record.get("calls") if isinstance(record, dict) else None
    if not isinstance(calls, list):
        return None
    earliest = min(
        (start for raw in calls if (start := _call_start(raw)) is not None),
        key=lambda start: start[0],
        default=None,
    )
    if earliest is None:
        return None
    started, attempt = earliest
    return {"started": started.isoformat(), "attempt": attempt}


def _history_details(
    workspace: dict[str, Any], run_key: str, run: dict[str, Any]
) -> dict[str, Any]:
    modules = run.get("modules", {})
    steps = (run.get("record") or {}).get("steps") or []
    order = dict.fromkeys([step.get("module") for step in steps] + list(modules))
    outputs, handoffs = workspace.get("outputs", {}), workspace.get("handoffs", {})
    earlier_format = any(
        _earlier_handoff_format(handoffs.get(output.get("sha256"), []))
        for code, module in modules.items()
        for output_id in module.get("outputs", [])
        if (output := outputs.get(output_id))
        and output.get("module") == code
        and (not output.get("run") or output["run"] == run_key)
    )
    first_call = _first_model_call(run)
    return {
        "modules": [code for code in order if modules.get(code, {}).get("outputs")],
        "earlierFormat": earlier_format,
        "earlierMethods": bool(run.get("methodChanges")),
        **({"firstModelCall": first_call} if first_call is not None else {}),
    }


def scoped(snapshot: dict[str, Any], folder: str) -> dict[str, Any] | None:
    """Keep report history metadata and the selected run's validated Changes dependency."""
    workspace = snapshot["workspace"]
    records = workspace.get("runs", {})
    selected = [(key, run) for key, run in records.items() if run.get("folder") == folder]
    if len(selected) != 1:
        return None
    key, current = selected[0]
    issuer = current.get("issuerKey")
    related = {
        run_key: run
        for run_key, run in records.items()
        if run_key == key or (issuer and run.get("issuerKey") == issuer)
    }
    full_keys = {key}
    change = current.get("changes")
    pack = change.get("pack") if isinstance(change, dict) else None
    prior = pack.get("prior") if isinstance(pack, dict) else None
    if isinstance(prior, dict) and isinstance(prior.get("run"), str):
        matches = [
            (run_key, run) for run_key, run in records.items() if run.get("folder") == prior["run"]
        ]
        if len(matches) != 1:
            # Keep duplicate-folder metadata so the React comparison retains its ambiguity guard.
            related.update((run_key, run) for run_key, run in matches)
        else:
            prior_key, earlier = matches[0]
            current_ref = pack.get("current") if isinstance(pack, dict) else None
            if (
                issuer
                and earlier.get("issuerKey") == issuer
                and earlier.get("folder") != folder
                and earlier.get("asOf") == prior.get("as_of")
                and earlier.get("pathway") == prior.get("pathway") == current.get("pathway")
                and isinstance(current_ref, dict)
                and current.get("asOf") == current_ref.get("as_of")
                and current.get("pathway") == current_ref.get("pathway")
            ):
                related[prior_key] = earlier
                full_keys.add(prior_key)

    def summary(run_key: str, run: dict[str, Any]) -> dict[str, Any]:
        metadata: dict[str, Any] = {
            field: run[field]
            for field in (
                "folder",
                "issuerKey",
                "pathway",
                "asOf",
                "period",
                "publicationVerified",
                "assessmentScope",
                "publishedAt",
            )
            if field in run
        }
        if issuer and run.get("issuerKey") == issuer:
            metadata["history"] = _history_details(workspace, run_key, run)
        return metadata

    output_ids = {
        output_id
        for run_key in full_keys
        for module in related[run_key].get("modules", {}).values()
        for output_id in module.get("outputs", [])
    }
    outputs = {
        output_id: output
        for output_id, output in workspace.get("outputs", {}).items()
        if output_id in output_ids and (not output.get("run") or output["run"] in full_keys)
    }
    hashes = {output["sha256"] for output in outputs.values()}
    catalogue = [
        entry
        for entry in snapshot["catalogue"].get("real", [])
        if entry.get("id") in {run.get("folder") for run in related.values()}
    ]
    return {
        **snapshot,
        "catalogue": {**snapshot["catalogue"], "real": catalogue},
        "workspace": {
            **workspace,
            "runs": {
                run_key: run if run_key in full_keys else summary(run_key, run)
                for run_key, run in related.items()
            },
            "outputs": outputs,
            "handoffs": {
                digest: value
                for digest, value in workspace.get("handoffs", {}).items()
                if digest in hashes
            },
            "models": [
                model
                for model in workspace.get("models", [])
                if model.get("runId") in {related[run_key].get("folder") for run_key in full_keys}
                or model.get("runFolder")
                in {related[run_key].get("folder") for run_key in full_keys}
                or any(source.get("run") in full_keys for source in model.get("sources", []))
            ],
        },
        "activity": {},
        "chips": {
            chip_key: value
            for chip_key, value in snapshot.get("chips", {}).items()
            if chip_key.rpartition(":")[0] in outputs
        },
    }


def _problem(error: OSError | ValueError, relative: str) -> str:
    """Why ``relative`` could not be used. A refusal's own words name only the name inside the
    run; an OSError's text names the server's absolute path, so only its kind is kept."""
    if isinstance(error, OSError):
        return f"{relative} could not be read ({type(error).__name__})"
    return str(error)


def _load_source(root: Path, folder: str, identity: tuple[str, str], checked: Checked) -> None:
    name, digest = identity
    checked.inventory[name] = (name, digest)
    try:
        source = _source(root, folder, name, digest)
    except (OSError, ValueError) as error:
        actual = error.actual if isinstance(error, SourceMismatch) else None
        checked.cache[name] = ({}, actual, _problem(error, f"{folder}/inputs/{digest}"))
        return
    checked.available[name] = source
    checked.cache[name] = (source.pages, source.digest, source.problem)


def verified(root: Path, record: dict[str, Any]) -> Checked:
    """Keep pinned identity even when the original cannot be read; link verified bytes only."""
    result = Checked()
    folder = record["folder"]
    try:
        pins = _pins(root, folder)
        result.authority = True
        pin_problem = None
    except (OSError, ValueError) as error:
        pins, pin_problem = {}, _problem(error, f"{folder}/workflow.json")
    for item in _published(record):
        item.pop("href", None)
        item.pop("sourceWarning", None)
        try:
            if pin_problem:
                raise Refused(pin_problem)
            identity = _identity(item, pins)
        except ValueError as error:
            item["sourceWarning"] = str(error)
            continue
        name, _ = identity
        _load_source(root, folder, identity, result)
        if source := result.available.get(name):
            item["href"] = source.href(folder)
        if problem := result.cache[name][2]:
            item["sourceWarning"] = problem
    return result


def _inventory(sections: list[dict[str, Any]], canonical: native.Inventory) -> native.Inventory:
    result = native.Inventory(canonical)
    try:
        aliases = native.inventory(sections, set(canonical))
    except (IndexError, KeyError, TypeError):
        aliases = native.Inventory()
    for alias, (name, digest) in aliases.items():
        if canonical.get(name) == (name, digest) and alias not in result:
            result[alias] = (name, digest)
    result.alternates = frozenset(alias for alias in aliases.alternates if alias in result)
    return result


def _rows(sections: list[dict[str, Any]]) -> Iterator[native.Row]:
    findings = False
    for section in sections:
        if section["level"] == 2:
            findings = section["heading"].strip().lower().startswith("findings")
        for block in section["blocks"]:
            if block["type"] == "table":
                head = block["headers"]
                claim = native.is_claim_table(findings, section["heading"], head)
                for row in block["rows"]:
                    yield native.Row(row["line"], row["cells"], head, claim)
            else:
                yield native.Row(block["line"], [block["text"]], [], False)


def _page_range(pages: dict[int, str], first: int, last: int) -> bool:
    return 1 <= first <= last <= len(pages) and all(n in pages for n in range(first, last + 1))


def _links(chip: dict[str, Any], sources: dict[str, Source], folder: str) -> None:
    source = sources.get(chip.get("file", ""))
    if source is None or chip.get("sha256") != source.digest:
        return
    chip["href"] = source.href(folder)
    first, last = chip.get("page"), chip.get("page_end")
    if isinstance(first, int) and _page_range(source.pages, first, last or first):
        chip["pageHref"] = f"{chip['href']}?page={first}" + (f"&end={last}" if last else "")


def _outputs(snapshot: dict[str, Any], key: str, record: dict[str, Any]) -> dict[str, Any]:
    workspace = snapshot["workspace"]
    ids = {oid for module in record.get("modules", {}).values() for oid in module["outputs"]}
    return {
        oid: output
        for oid, output in workspace.get("outputs", {}).items()
        if oid in ids and (not output.get("run") or output["run"] == key)
    }


def _refresh(snapshot: dict[str, Any], key: str, record: dict[str, Any], root: Path) -> None:
    checked = verified(root, record)
    if not checked.authority:
        return
    outputs = _outputs(snapshot, key, record)
    parsed = snapshot["workspace"].get("handoffs", {})
    cp0 = [
        s for o in outputs.values() if o["module"] == "CP-0" for s in parsed.get(o["sha256"], [])
    ]
    pages = native.Pages(root / record["folder"], _inventory(cp0, checked.inventory))
    pages.cache = checked.cache
    chips = snapshot.setdefault("chips", {})
    for old in list(chips):
        if old.rpartition(":")[0] in outputs:
            del chips[old]
    for oid, output in outputs.items():
        sections = parsed.get(output["sha256"], [])
        confidence_section = output.get("confidenceTrace", {}).get("section")
        if confidence_section and not any(
            section["heading"] == confidence_section["heading"] for section in sections
        ):
            sections = [*sections, confidence_section]
        for row in _rows(sections):
            if not row.cells:
                continue
            found = native.chips_for_cells(row, output["module"], pages)
            for chip in found:
                _links(chip, checked.available, record["folder"])
            if found:
                chips[f"{oid}:{row.line}"] = found


def enrich(snapshot: dict[str, Any], root: Path) -> dict[str, Any]:
    """Rebuild native citation chips against originals, without editing retained artifacts."""
    result = copy.deepcopy(snapshot)
    for chips in result.get("chips", {}).values():
        for chip in chips:
            if isinstance(chip, dict):
                chip.pop("href", None)
                chip.pop("pageHref", None)
    for key, record in result["workspace"]["runs"].items():
        _refresh(result, key, record, root)
    return result


def _requested_pages(query: str, source: Source) -> bytes:
    values = parse_qs(query, keep_blank_values=True)
    if set(values) - {"page", "end"} or "page" not in values:
        raise http_base.refuse(400, "invalid source page request")
    if any(len(v) != 1 or re.fullmatch(r"[1-9][0-9]{0,8}", v[0]) is None for v in values.values()):
        raise http_base.refuse(400, "invalid source page request")
    first = int(values["page"][0])
    last = int(values.get("end", values["page"])[0])
    if not _page_range(source.pages, first, last):
        raise http_base.refuse(404, "source page unavailable")
    return "\n\f\n".join(source.pages[n] for n in range(first, last + 1)).encode("utf-8")


def reply(url: SplitResult, root: Path, snapshot: dict[str, Any] | None) -> http_base.Reply:
    match = ADDRESS.fullmatch(url.path)
    if match is None or snapshot is None:
        raise http_base.refuse(404, "source unavailable")
    folder, digest, name = unquote(match[1]), match[2], unquote(match[3])
    records = [r for r in snapshot["workspace"]["runs"].values() if r["folder"] == folder]
    if len(records) != 1:
        raise http_base.refuse(404, "source unavailable")
    source = verified_one(root, records[0], name, digest, pages=bool(url.query))
    if source is None:
        raise http_base.refuse(404, "source unavailable")
    raw = source.raw
    if url.query:
        raw = _requested_pages(url.query, source)
    media = (
        "text/plain; charset=utf-8"
        if url.query or name.endswith(".txt")
        else "application/octet-stream"
    )
    return http_base.Reply(
        200,
        raw,
        {
            "Content-Type": media,
            "Content-Security-Policy": "default-src 'none'; sandbox; frame-ancestors 'none'",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store",
        },
    )
