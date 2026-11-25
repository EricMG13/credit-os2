"""Coverage: what each published run's module handoffs hold, across issuers.

Read from the admitted publication only (docs/rulings/2026-11-24-coverage-page.md). Every text is
the module's own; nothing is averaged, differenced or scored. ``at`` only sorts and screens."""

from __future__ import annotations

import re
from functools import cache
from typing import Any

from credit_os.handoff_fields import (  # type: ignore[import-untyped, unused-ignore]
    PLAIN_AMOUNT,
    STATED_GAP,
)

from deploy_workflow.owners.cpos_cp1_check import ADJUSTED_TWIN
from react_frontend.library_cards import _blocked, _bottom_line, _designated_output

BASE_PATHWAY = "credit_snapshot"
NO_COLUMN = frozenset({"CP-MODEL"})  # The Model is a destination, not an analytical module.
SUMMARY_FIELDS = (
    ("bottomLine", "Bottom line", "text"),
    ("confidence", "Confidence", "choice"),
    ("limitation", "Limitation", "text"),
)
# A CP-1 chart table may be headed with the adjusted names; they are the same measures, so the
# adjusted heading joins its reported field and the fact keeps the heading the module wrote.
_REPORTED = {adjusted: reported for reported, adjusted in ADJUSTED_TWIN.items()}
_NO_GAP = re.compile(r"(?:none|no gaps?)\b", re.IGNORECASE)
_SLUG = re.compile(r"[^a-z0-9]+")


@cache
def _method() -> tuple[dict[str, tuple[str, ...]], dict[str, str], dict[str, str]]:
    """Each pathway's requested modules, each pathway's title and each module's title."""
    from deploy_vii.registry import modules
    from deploy_vii.report_view import pathways

    listed = list(pathways())
    return (
        {item.id: tuple(item.requested_modules) for item in listed},
        {item.id: item.title for item in listed},
        {module.module_id: module.title for module in modules()},
    )


def columns() -> list[dict[str, str]]:
    """The fixed columns: the Full credit assessment's analytical modules, in plan order."""
    requested, _, titles = _method()
    return [
        {"code": code, "title": titles.get(code, code)}
        for code in requested[BASE_PATHWAY]
        if code not in NO_COLUMN
    ]


def _stated_gaps(output: dict[str, Any], sections: list[dict[str, Any]]) -> int:
    """What the handoff itself states as missing: chart tables written as `Not supplied:`, single
    `Not supplied:` chart cells, and the entries of its `## Gaps` section."""
    count = len(output.get("chartGaps") or [])
    for chart in output.get("charts") or []:
        table = _table(sections, chart.get("table"))
        rows = table["rows"] if table is not None else []
        count += sum(
            bool(STATED_GAP.match(row["cells"][at])) for row in rows for at in chart["columns"]
        )
    inside = False
    for section in sections:
        if section["level"] <= 2:
            inside = section["level"] == 2 and section["heading"] == "Gaps"
        if not inside:
            continue
        for block in section["blocks"]:
            if block["type"] == "table":
                count += len(block["rows"])
            elif block["type"] == "text" and not _NO_GAP.match(block["text"].lstrip("-* ")):
                count += 1
    return count


def _cell(
    workspace: dict[str, Any], record: dict[str, Any], key: str, code: str
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """The module's state in this run and its designated output when one can be read."""
    output = _designated_output(workspace, record, key, code)
    if output is None:
        # The run's own plan, as its manifest records it; without one nothing is said of the plan.
        asked = record.get("requested")
        if not isinstance(asked, list):
            return {"state": "plan-unknown"}, None
        return {"state": "no-handoff" if code in asked else "not-in-pathway"}, None
    sections = workspace.get("handoffs", {}).get(output["sha256"], [])
    if output.get("parseError"):
        return {"state": "unreadable"}, None
    if _blocked(output, sections):
        return {"state": "not-assessable"}, output
    cell = {"state": "assessed", "gaps": _stated_gaps(output, sections)}
    if output.get("issue"):
        cell["issue"] = True  # A fixed table was not in its shape, so its figures are not read.
    return cell, output


def _number(text: str) -> float | None:
    return float(text.replace(",", "")) if PLAIN_AMOUNT.fullmatch(text) else None


def _slug(*parts: str) -> str:
    return "/".join(_SLUG.sub("-", part.casefold()).strip("-") for part in parts)


def _table(sections: list[dict[str, Any]], line: object) -> dict[str, Any] | None:
    for section in sections:
        for block in section["blocks"]:
            if block["type"] == "table" and block["line"] == line:
                return block  # type: ignore[no-any-return]
    return None


def _row_label(chart: dict[str, Any], cells: list[str]) -> str | None:
    """The row's own name in a row chart; a period table has none."""
    label = chart.get("label")
    if label is None:
        return None
    return " · ".join(cells[at] for at in ([label] if isinstance(label, int) else label))


def _chart_facts(
    code: str, chart: dict[str, Any], table: dict[str, Any]
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """One (field, fact) per stated cell of a typed chart table's numeric columns."""
    headers = table["headers"]
    periods = headers[0] == "Period"
    found = []
    for row in table["rows"]:
        cells = row["cells"]
        for at in chart["columns"]:
            text = cells[at]
            if not text:
                continue
            measure = _REPORTED.get(headers[at], headers[at])
            field = {
                "id": _slug(code, chart["title"], measure),
                "module": code,
                "group": chart["title"],
                "label": measure,
                "kind": "number",
                # A row table's rows are each issuer's own names, so they are not ranked together.
                "series": "period" if periods else "row",
            }
            fact = {
                "period": cells[0] if periods else None,
                "row": _row_label(chart, cells),
                "text": text,
                "at": _number(text),
                "gap": bool(STATED_GAP.match(text)),
                "unit": cells[-2],
                "basis": cells[-1],
                "line": row["line"],
            }
            if measure != headers[at]:
                fact["heading"] = headers[at]
            found.append((field, fact))
    return found


def _summary_facts(
    code: str, summary: dict[str, Any]
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """The Reader summary's call and findings, as the module wrote them."""

    def field(name: str, label: str, kind: str) -> dict[str, Any]:
        return {
            "id": _slug(code, "reader summary", name),
            "module": code,
            "group": "Reader summary",
            "label": label,
            "kind": kind,
        }

    def fact(text: str, line: int, **more: Any) -> dict[str, Any]:
        return {"period": None, "row": None, "text": text, "at": None, "line": line, **more}

    found = [
        (field(name, label, kind), fact(str(summary[name]), summary["line"]))
        for name, label, kind in SUMMARY_FIELDS
    ]
    finding = field("finding", "Finding", "text")
    found.extend(
        (
            finding,
            fact(
                str(item["finding"]),
                item["line"],
                impact=str(item["impact"]),
                confidence=str(item["confidence"]),
            ),
        )
        for item in summary["findings"]
    )
    return found


def _passage(block: dict[str, Any]) -> dict[str, Any]:
    """A paragraph or list item without its marker, its `Basis:` line kept apart."""
    lines = block["text"].split("\n")
    basis = lines.pop()[7:] if lines[-1].startswith("Basis: ") else None
    text = re.sub(r"^[-*] ", "", " ".join(lines).strip())
    fact = {"period": None, "row": None, "text": text, "at": None, "line": block["line"]}
    return fact if basis is None else {**fact, "basis": basis}


def _section_facts(
    code: str, output: dict[str, Any], sections: list[dict[str, Any]]
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """The current handoff's Findings: bottom line, key findings, limitations and confidence."""

    def field(name: str, label: str, kind: str) -> dict[str, Any]:
        return {
            "id": _slug(code, "reader summary", name),
            "module": code,
            "group": "Findings",
            "label": label,
            "kind": kind,
        }

    found = []
    lead = _bottom_line(sections)
    if lead is not None:
        found.append((field("bottomLine", "Bottom line", "text"), _passage(lead)))
    parent, line = "", None
    for section in sections:
        if section["level"] <= 2:
            parent = section["heading"] if section["level"] == 2 else ""
        if section["heading"] == "Confidence inputs":
            line = section["line"]
        if parent != "Findings" or section["level"] != 3:
            continue
        named = {
            "Key findings": ("finding", "Finding"),
            "Limitations": ("limitation", "Limitation"),
        }
        if section["heading"] in named:
            name, label = named[section["heading"]]
            found.extend(
                (field(name, label, "text"), _passage(block))
                for block in section["blocks"]
                if block["type"] == "text"
            )
    confidence = output.get("confidence")
    band = confidence.get("band") if isinstance(confidence, dict) else None
    if isinstance(band, str) and line is not None:
        fact = {"period": None, "row": None, "text": band, "at": None, "line": line}
        found.append((field("confidence", "Confidence", "choice"), fact))
    return found


def _output_facts(
    code: str, output: dict[str, Any], sections: list[dict[str, Any]]
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    # An earlier-format handoff states its call in the Reader summary tables.
    if output.get("summary"):
        found = _summary_facts(code, output["summary"])
    else:
        found = _section_facts(code, output, sections)
    for chart in output.get("charts") or []:
        table = _table(sections, chart.get("table"))
        # A bridge's steps are the module's own names, not a measure shared across issuers.
        if table is not None and chart.get("kind") != "waterfall":
            found.extend(_chart_facts(code, chart, table))
    # Where the fact is read, for the link to its run's Evidence page; the page draws neither.
    where = {"output": output["id"], "sha256": output["sha256"]}
    return [(field, {**fact, **where}) for field, fact in found]


def _run_entry(
    workspace: dict[str, Any], key: str, record: dict[str, Any], listed: dict[str, Any]
) -> tuple[dict[str, Any], list[tuple[dict[str, Any], dict[str, Any]]]]:
    _, pathway_titles, module_titles = _method()
    fixed = [column["code"] for column in columns()]
    cells, facts, other = {}, [], []
    for code in dict.fromkeys([*fixed, *record.get("modules", {})]):
        cell, output = _cell(workspace, record, key, code)
        if code in fixed:
            cells[code] = cell
        elif code not in NO_COLUMN and output is not None:
            other.append({"code": code, "title": module_titles.get(code, code), **cell})
        if output is not None and cell["state"] == "assessed":
            sections = workspace.get("handoffs", {}).get(output["sha256"], [])
            facts.extend(_output_facts(code, output, sections))
    pathway = record.get("pathway") or None
    entry = {
        "key": key,
        "folder": record["folder"],
        "asOf": listed.get("date") or record.get("asOf") or None,
        "pathway": pathway,
        "pathwayTitle": pathway_titles.get(pathway or "", pathway),
        "cells": cells,
        "other": other,
    }
    return entry, facts


def _order(issuer: dict[str, Any]) -> None:
    """Newest as-of date first; runs sharing a date keep the catalogue's order, as the Library's
    cards do, and each says how many others share its date."""
    runs = issuer["runs"]
    runs.sort(key=lambda run: run["asOf"] or "", reverse=True)  # Stable: equals keep their order.
    for run in runs:
        run["sharedWith"] = sum(
            other is not run and bool(run["asOf"]) and other["asOf"] == run["asOf"]
            for other in runs
        )


def coverage(snapshot: dict[str, Any] | None) -> dict[str, Any] | None:
    """The page's whole reply for an admitted publication; None when nothing is published."""
    if snapshot is None:
        return None
    workspace = snapshot["workspace"]
    by_folder = {
        record.get("folder"): (key, record) for key, record in workspace.get("runs", {}).items()
    }
    issuers: dict[str, dict[str, Any]] = {}
    found: dict[str, list[tuple[dict[str, Any], dict[str, Any]]]] = {}
    for catalogued in snapshot["catalogue"].get("real", []):  # The catalogue's order.
        if catalogued["id"] not in by_folder:
            continue
        key, record = by_folder[catalogued["id"]]
        entry, found[key] = _run_entry(workspace, key, record, catalogued)
        issuer_key = str(record.get("issuerKey") or record["folder"])
        issuer = issuers.setdefault(
            issuer_key,
            {
                "key": issuer_key,
                "name": catalogued.get("name") or record.get("issuer") or issuer_key,
                "sector": record.get("sector") or None,
                "runs": [],
            },
        )
        issuer["runs"].append(entry)
    fields: dict[str, dict[str, Any]] = {}
    facts = []
    for issuer in issuers.values():
        _order(issuer)
        newest = issuer["runs"][0]["key"]  # The page reads facts of each issuer's newest run only.
        for field, fact in found[newest]:
            fields.setdefault(field["id"], field)
            facts.append({"field": field["id"], "issuer": issuer["key"], "run": newest, **fact})
    return {
        "columns": columns(),
        "issuers": sorted(issuers.values(), key=lambda item: str(item["name"]).casefold()),
        "fields": list(fields.values()),
        "facts": facts,
        "preview": snapshot.get("preview"),
    }
