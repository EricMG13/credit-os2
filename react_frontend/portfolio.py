"""Corroborate published portfolio limits against a run's frozen selected sources."""

from __future__ import annotations

import json
import logging
import re
from collections import Counter
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any, TypedDict

from deploy_vii.inputs import portfolio_export as exports
from deploy_vii.inputs.portfolio import read
from deploy_vii.inputs.rv_quotes import MEDIA_TYPE
from deploy_vii.preparation import SourceRequest, prepare_source
from deploy_workflow import portfolio_workbook
from deploy_workflow.context import load_context
from deploy_workflow.library_index import Refused, read_inside, read_pinned

_LOG = logging.getLogger(__name__)
PORTFOLIO = re.compile(r"/connected/portfolio/([0-9A-Za-z][0-9A-Za-z._-]{0,79})")
DIGEST = re.compile(r"[0-9a-f]{64}")
NUMBER = re.compile(r"\d+(?:\.\d+)?")
HEADERS = [
    "Limit",
    "Current exposure",
    "Proposed exposure",
    "Limit value",
    "Reporting unit",
    "Basis and limitation",
]


class Basis(TypedDict):
    folder: str
    asOf: str
    output: str
    sha256: str
    tableLines: list[int]


@dataclass(frozen=True)
class CheckedLimit:
    parameter: str
    current: Decimal
    maximum: Decimal


def _pin(folder: Path, spec: dict[str, Any]) -> bytes:
    digest = spec["sha256"]
    if not isinstance(digest, str) or not DIGEST.fullmatch(digest):
        raise ValueError("invalid source pin")
    return read_pinned(folder, f"inputs/{digest}", digest)


def _template_limits(name: str, data: bytes, when: date) -> list[CheckedLimit]:
    prepared = prepare_source(
        SourceRequest(source_id="portfolio", path=name, media_type=MEDIA_TYPE), data
    )
    _, facts = read(name, prepared, when)
    if facts is None or facts.mandate.as_of != when:
        return []
    counts = Counter(row.parameter for row in facts.compliance)
    return [
        CheckedLimit(row.parameter, row.current_value, row.limit)
        for row in facts.compliance
        if counts[row.parameter] == 1 and row.last_checked == when and row.limit_unit == "% NAV"
    ]


def _export_limit(
    row: exports.ConstraintRow, found: exports.Recomputed, shape: exports.Profile
) -> CheckedLimit | None:
    parameter = row.text("parameter")
    findings = exports.Findings()
    maximum = exports._read(row, "limit", findings)
    current = exports._read(row, "current", findings)
    if maximum is None or (maximum.unit, maximum.operator) != ("% NAV", "<="):
        return None
    if current is None or not current.percent or current.operator:
        return None
    goal = exports.target(parameter, found, shape)
    if goal is None or goal.unit != "%" or current.value.is_zero() != goal.value.is_zero():
        return None
    if not exports.within(current, goal.value, marked=True):
        return None
    return CheckedLimit(parameter, current.value, maximum.value)


def _export_limits(
    files: dict[str, bytes], report: exports.ExportReport, when: date
) -> list[CheckedLimit]:
    roles = Counter(role for _, role in report.files)
    if any(roles[role] != 1 for role in ("mandate", "exposure", "holdings")):
        return []
    export = exports.read_export({name: files[name] for name in report.sources})
    findings = exports.Findings()
    claims, _ = exports.summary_claims(export, findings)
    mandate = {stamp for _, stamp in exports.mandate_findings(export, claims, findings)}
    exposure = {stamp for _, stamp in exports.report_dates(export)}
    if mandate != {when} or exposure - {when}:
        return []
    nav = claims.get("nav")
    if nav is None or nav.value.operator or nav.value.value <= 0:
        return []
    exports.type_rows(export.holdings)
    found = exports.recompute(export.holdings)
    if found.unpriced or found.left_out or found.value <= 0:
        return []
    shape = exports.profile(export.holdings, when)
    rows = [
        row
        for row in exports.constraint_rows(export)
        if exports.text_date(row.text("checked")) == when
    ]
    counts = Counter(exports.folded(row.text("parameter")) for row in rows)
    return [
        checked
        for row in rows
        if counts[exports.folded(row.text("parameter"))] == 1
        and (checked := _export_limit(row, found, shape)) is not None
    ]


def _linked(name: str, sha256: str, run: dict[str, Any]) -> bool:
    return any(
        item.get("name") == name
        and item.get("sha256") == sha256
        and "CP-6" in (item.get("readBy") or ())
        for item in run["evidence"]["sources"]
    )


def _limits(folder: Path, run: dict[str, Any], workflow: dict[str, Any]) -> list[CheckedLimit]:
    sources = workflow["sources"]
    context = load_context(_pin(folder, sources["context"]))
    when = date.fromisoformat(run["asOf"])
    if (
        not context.attachments.portfolio_workbook
        or context.run.as_of != when.isoformat()
        or context.run.pathway != run["pathway"]
    ):
        return []
    files = {
        name: _pin(folder, spec)
        for name, spec in sources.items()
        if name.lower().endswith((".xlsx", ".csv"))
    }
    pool = portfolio_workbook.check(
        files, pathway=context.run.pathway, declared=True, run_date=when
    ).workbooks
    if len(pool) != 1 or not pool[0].report.ok:
        return []
    book = pool[0]
    if isinstance(book.report, exports.ExportReport):
        if all(_linked(name, sources[name]["sha256"], run) for name in book.report.sources):
            return _export_limits(files, book.report, when)
        return []
    if _linked(book.source, sources[book.source]["sha256"], run):
        return _template_limits(book.source, files[book.source], when)
    return []


def _agrees(cells: list[str], rules: list[CheckedLimit]) -> bool:
    if len(cells) != len(HEADERS):
        return False
    label, current, _, limit, unit, basis = cells
    if (
        unit != "% NAV"
        or not basis.strip()
        or not all(NUMBER.fullmatch(text) for text in (current, limit))
    ):
        return False
    return CheckedLimit(label, Decimal(current), Decimal(limit)) in rules


def _table_lines(
    output: dict[str, Any],
    sections: list[dict[str, Any]],
    rules: list[CheckedLimit],
) -> list[int]:
    gaps = {gap["table"] for gap in output.get("chartGaps", [])}
    candidates = {
        plot["table"]
        for plot in output.get("charts", [])
        if plot.get("kind") == "limits" and plot["table"] not in gaps
    }
    matches: dict[int, list[dict[str, Any]]] = {line: [] for line in candidates}
    for section in sections:
        for block in section.get("blocks", []):
            if block.get("type") == "table" and block["line"] in candidates:
                matches[block["line"]].append(block)
    approved: list[int] = []
    for line, tables in matches.items():
        if len(tables) != 1 or tables[0].get("headers") != HEADERS:
            continue
        rows = tables[0]["rows"]
        if rows and all(_agrees(row["cells"], rules) for row in rows):
            approved.append(line)
    return sorted(approved)


def _for_run(root: Path, folder: str, snapshot: dict[str, Any]) -> Basis | None:
    workspace = snapshot["workspace"]
    matches = [run for run in workspace["runs"].values() if run["folder"] == folder]
    if len(matches) != 1:
        return None
    run = matches[0]
    module = run["modules"].get("CP-6", {})
    selected = module.get("default")
    if not selected or selected not in module.get("outputs", []):
        return None
    output = workspace["outputs"][selected]
    if (
        output.get("module") != "CP-6"
        or output.get("run") != folder
        or output.get("parseError")
        or (output.get("state") or {}).get("established") is False
    ):
        return None
    directory = root / folder
    workflow = json.loads(read_inside(directory, "workflow.json"))
    if workflow["run"]["as_of"] != run["asOf"] or workflow["run"]["pathway"] != run["pathway"]:
        return None
    if not (rules := _limits(directory, run, workflow)):
        return None
    digest = output["sha256"]
    lines = _table_lines(output, workspace["handoffs"][digest], rules)
    return (
        {
            "folder": folder,
            "asOf": run["asOf"],
            "output": selected,
            "sha256": digest,
            "tableLines": lines,
        }
        if lines
        else None
    )


def attested(root: Path, folder: str, snapshot: dict[str, Any] | None) -> Basis | None:
    """Issue a run/output-specific plotting receipt. Missing evidence leaves the source table."""
    if not snapshot or not any(item["id"] == folder for item in snapshot["catalogue"]["real"]):
        return None
    if folder in {".", ".."} or (root / folder).resolve() != root.resolve() / folder:
        return None
    try:
        return _for_run(root, folder, snapshot)
    except (Refused, OSError, ValueError, TypeError, KeyError, AttributeError) as error:
        _LOG.warning(
            "run %s plotting receipt unavailable: %s: %s", folder, type(error).__name__, error
        )
        return None
