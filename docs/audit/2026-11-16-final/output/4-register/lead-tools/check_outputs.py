"""Check stage 2/3 outputs against FINDINGS-SCHEMA.md and the stage briefs.

Usage: python check_outputs.py <tree-root> <kind: sections|journeys> <id> [<id> ...]
<tree-root> holds docs/audit/2026-11-16-final/output (a checkout or a `git archive` extract).
"""

import csv
import json
import re
import sys
from pathlib import Path

FIELDS = {
    "id": str, "section": str, "surface": str, "screen": str, "check": str, "severity": str,
    "kind": str, "title": str, "expected": str, "actual": str, "evidence": list, "probe": str,
    "suggested_change": str, "owner_decision": bool,
}
ENUMS = {
    "surface": {"connected", "static", "both"},
    "check": {"wiring", "design", "state", "harmony", "journey", "accessibility", "code"},
    "severity": {"High", "Medium", "Low", "Info"},
    "kind": {"ordinary", "hostile-input"},
}
SECTIONS = {"C1", "C2", "C3", "C4", "C5", "S1", "S2", "S3", "S4", "S5", "S6", "X1"}


def check_findings(path: Path, unit: str, root: Path) -> list[str]:
    problems: list[str] = []
    seen: set[str] = set()
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            problems.append(f"{path}:{n}: does not parse: {exc}")
            continue
        missing = [k for k in FIELDS if k not in row]
        extra = [k for k in row if k not in FIELDS]
        if missing:
            problems.append(f"{path}:{n}: missing {missing}")
        if extra:
            problems.append(f"{path}:{n}: extra fields {extra}")
        for k, typ in FIELDS.items():
            if k in row and not isinstance(row[k], typ):
                problems.append(f"{path}:{n}: {k} is {type(row[k]).__name__}, not {typ.__name__}")
        for k, allowed in ENUMS.items():
            if row.get(k) not in allowed:
                problems.append(f"{path}:{n}: {k}={row.get(k)!r} not in {sorted(allowed)}")
        fid = row.get("id", "")
        if not re.fullmatch(rf"{re.escape(unit)}-\d{{3,}}", str(fid)):
            problems.append(f"{path}:{n}: id {fid!r} does not match {unit}-NNN")
        if fid in seen:
            problems.append(f"{path}:{n}: duplicate id {fid}")
        seen.add(fid)
        sec = row.get("section")
        if unit.startswith("J"):
            if sec != unit and sec not in SECTIONS:
                problems.append(f"{path}:{n}: section {sec!r}")
        elif sec != unit:
            problems.append(f"{path}:{n}: section {sec!r} is not {unit}")
        if row.get("severity") in {"High", "Medium"}:
            probe = str(row.get("probe", "")).strip()
            if not probe:
                problems.append(f"{path}:{n}: {fid} is {row['severity']} with no probe")
        if not row.get("evidence"):
            problems.append(f"{path}:{n}: {fid} has no evidence")
        else:
            for ev in row["evidence"]:
                ev_path = str(ev).split(":")[0].split("#")[0].strip()
                if ev_path.startswith("docs/audit/") and not (root / ev_path).exists():
                    problems.append(f"{path}:{n}: {fid} evidence path missing: {ev_path}")
        probe = str(row.get("probe", ""))
        if probe.startswith("docs/audit/") and " " not in probe and not (root / probe).exists():
            problems.append(f"{path}:{n}: {fid} probe path missing: {probe}")
    return problems


def main() -> int:
    root = Path(sys.argv[1])
    kind = sys.argv[2]
    units = sys.argv[3:]
    base = root / "docs/audit/2026-11-16-final/output"
    folder = base / ("2-sections" if kind == "sections" else "3-journeys")
    required = (
        ["findings.jsonl", "harmony.csv", "report.md"]
        if kind == "sections"
        else ["findings.jsonl", "journey.md", "report.md"]
    )
    total = 0
    counts: dict[str, int] = {}
    problems: list[str] = []
    for unit in units:
        d = folder / unit
        for name in required:
            if not (d / name).is_file():
                problems.append(f"{unit}: missing {name}")
        rep = d / "report.md"
        if rep.is_file():
            text = rep.read_text(encoding="utf-8").rstrip()
            last = text.splitlines()[-1] if text else ""
            if "Not verified:" not in last and not re.search(r"Not verified:[^\n]*\Z", text):
                tail = text[-400:]
                if "Not verified:" not in tail:
                    problems.append(f"{unit}: report.md does not end with Not verified:")
        f = d / "findings.jsonl"
        if f.is_file():
            problems += check_findings(f, unit, root)
            for line in f.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    total += 1
                    try:
                        sev = json.loads(line).get("severity", "?")
                    except json.JSONDecodeError:
                        sev = "unparsed"
                    counts[sev] = counts.get(sev, 0) + 1
        h = d / "harmony.csv"
        if kind == "sections" and h.is_file():
            try:
                with h.open(encoding="utf-8", newline="") as fh:
                    rows = list(csv.reader(fh))
                if len(rows) < 1:
                    problems.append(f"{unit}: harmony.csv is empty")
            except csv.Error as exc:
                problems.append(f"{unit}: harmony.csv does not parse: {exc}")
    print(f"findings: {total} {counts}")
    for p in problems:
        print("PROBLEM", p)
    print("OK" if not problems else f"{len(problems)} problems")
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
