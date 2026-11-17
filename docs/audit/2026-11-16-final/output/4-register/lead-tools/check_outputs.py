"""Check stage 2/3 outputs against FINDINGS-SCHEMA.md and the stage briefs.

Usage: python check_outputs.py <tree-root> <kind: sections|journeys> <id> [<id> ...]
<tree-root> holds docs/audit/2026-11-16-final/output (a checkout or a `git archive` extract).
"""

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any

FIELDS = {
    "id": str,
    "section": str,
    "surface": str,
    "screen": str,
    "check": str,
    "severity": str,
    "kind": str,
    "title": str,
    "expected": str,
    "actual": str,
    "evidence": list,
    "probe": str,
    "suggested_change": str,
    "owner_decision": bool,
}
ENUMS = {
    "surface": {"connected", "static", "both"},
    "check": {"wiring", "design", "state", "harmony", "journey", "accessibility", "code"},
    "severity": {"High", "Medium", "Low", "Info"},
    "kind": {"ordinary", "hostile-input"},
}
SECTIONS = {"C1", "C2", "C3", "C4", "C5", "S1", "S2", "S3", "S4", "S5", "S6", "X1"}

type Row = dict[str, Any]


def schema_problems(row: Row, location: str) -> list[str]:
    problems = []
    missing = [key for key in FIELDS if key not in row]
    extra = [key for key in row if key not in FIELDS]
    if missing:
        problems.append(f"{location}: missing {missing}")
    if extra:
        problems.append(f"{location}: extra fields {extra}")
    for key, expected in FIELDS.items():
        if key in row and not isinstance(row[key], expected):
            found = type(row[key]).__name__
            problems.append(f"{location}: {key} is {found}, not {expected.__name__}")
    for key, allowed in ENUMS.items():
        if row.get(key) not in allowed:
            problems.append(f"{location}: {key}={row.get(key)!r} not in {sorted(allowed)}")
    return problems


def identity_problems(row: Row, unit: str, location: str, seen: set[str]) -> list[str]:
    problems = []
    finding = row.get("id", "")
    if not re.fullmatch(rf"{re.escape(unit)}-\d{{3,}}", str(finding)):
        problems.append(f"{location}: id {finding!r} does not match {unit}-NNN")
    if finding in seen:
        problems.append(f"{location}: duplicate id {finding}")
    seen.add(finding)
    section = row.get("section")
    if unit.startswith("J"):
        if section != unit and section not in SECTIONS:
            problems.append(f"{location}: section {section!r}")
    elif section != unit:
        problems.append(f"{location}: section {section!r} is not {unit}")
    return problems


def artifact_problems(row: Row, location: str, root: Path) -> list[str]:
    problems = []
    finding = row.get("id", "")
    if row.get("severity") in {"High", "Medium"}:
        probe = str(row.get("probe", "")).strip()
        if not probe:
            problems.append(f"{location}: {finding} is {row['severity']} with no probe")
    if not row.get("evidence"):
        problems.append(f"{location}: {finding} has no evidence")
    else:
        for evidence in row["evidence"]:
            path = str(evidence).split(":")[0].split("#")[0].strip()
            if path.startswith("docs/audit/") and not (root / path).exists():
                problems.append(f"{location}: {finding} evidence path missing: {path}")
    probe = str(row.get("probe", ""))
    if probe.startswith("docs/audit/") and " " not in probe and not (root / probe).exists():
        problems.append(f"{location}: {finding} probe path missing: {probe}")
    return problems


def check_findings(path: Path, unit: str, root: Path) -> list[str]:
    problems: list[str] = []
    seen: set[str] = set()
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            problems.append(f"{path}:{number}: does not parse: {exc}")
            continue
        location = f"{path}:{number}"
        problems += schema_problems(row, location)
        problems += identity_problems(row, unit, location, seen)
        problems += artifact_problems(row, location, root)
    return problems


def finding_counts(path: Path) -> tuple[int, dict[str, int]]:
    total = 0
    counts: dict[str, int] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            total += 1
            try:
                severity = json.loads(line).get("severity", "?")
            except json.JSONDecodeError:
                severity = "unparsed"
            counts[severity] = counts.get(severity, 0) + 1
    return total, counts


def report_problems(path: Path, unit: str) -> list[str]:
    problems = []
    if path.is_file():
        text = path.read_text(encoding="utf-8").rstrip()
        last = text.splitlines()[-1] if text else ""
        if "Not verified:" not in last and not re.search(r"Not verified:[^\n]*\Z", text):
            tail = text[-400:]
            if "Not verified:" not in tail:
                problems.append(f"{unit}: report.md does not end with Not verified:")
    return problems


def harmony_problems(path: Path, unit: str) -> list[str]:
    problems = []
    if path.is_file():
        try:
            with path.open(encoding="utf-8", newline="") as source:
                rows = list(csv.reader(source))
            if len(rows) < 1:
                problems.append(f"{unit}: harmony.csv is empty")
        except csv.Error as exc:
            problems.append(f"{unit}: harmony.csv does not parse: {exc}")
    return problems


def check_unit(
    folder: Path, unit: str, kind: str, root: Path
) -> tuple[int, dict[str, int], list[str]]:
    directory = folder / unit
    required = (
        ["findings.jsonl", "harmony.csv", "report.md"]
        if kind == "sections"
        else ["findings.jsonl", "journey.md", "report.md"]
    )
    problems = [f"{unit}: missing {name}" for name in required if not (directory / name).is_file()]
    problems += report_problems(directory / "report.md", unit)
    findings = directory / "findings.jsonl"
    total = 0
    counts: dict[str, int] = {}
    if findings.is_file():
        problems += check_findings(findings, unit, root)
        total, counts = finding_counts(findings)
    if kind == "sections":
        problems += harmony_problems(directory / "harmony.csv", unit)
    return total, counts, problems


def main() -> int:
    root = Path(sys.argv[1])
    kind = sys.argv[2]
    units = sys.argv[3:]
    base = root / "docs/audit/2026-11-16-final/output"
    folder = base / ("2-sections" if kind == "sections" else "3-journeys")
    total = 0
    counts: dict[str, int] = {}
    problems: list[str] = []
    for unit in units:
        unit_total, unit_counts, unit_problems = check_unit(folder, unit, kind, root)
        total += unit_total
        for severity, count in unit_counts.items():
            counts[severity] = counts.get(severity, 0) + count
        problems += unit_problems
    print(f"findings: {total} {counts}")
    for problem in problems:
        print("PROBLEM", problem)
    print("OK" if not problems else f"{len(problems)} problems")
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
