"""Build the stage 4 register from findings, verifier verdicts, clusters and the lead's rulings.

Usage (from the repository root):
  python3 -I build_register.py <scratchpad dir>
Reads  docs/audit/2026-11-16-final/output/{2-sections,3-journeys}/*/findings.jsonl,
       output/4-register/baseline-findings.jsonl, output/4-register/verify/*.jsonl,
       <scratchpad>/clusters.json, <scratchpad>/rulings.json.
Writes output/4-register/register.jsonl and prints counts.
"""

import glob
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any, cast

OUT = Path("docs/audit/2026-11-16-final/output")
SEV = ["High", "Medium", "Low", "Info"]

type Row = dict[str, Any]
type Rows = dict[str, Row]


def load_findings() -> Rows:
    rows: Rows = {}
    files = sorted(glob.glob(str(OUT / "2-sections/*/findings.jsonl")))
    files += sorted(glob.glob(str(OUT / "3-journeys/*/findings.jsonl")))
    files.append(str(OUT / "4-register/baseline-findings.jsonl"))
    if (OUT / "4-register/repair-findings.jsonl").exists():
        files.append(str(OUT / "4-register/repair-findings.jsonl"))
    for f in files:
        for line in Path(f).read_text(encoding="utf-8").splitlines():
            if line.strip():
                r = json.loads(line)
                if r["id"] in rows:
                    raise SystemExit(f"duplicate id {r['id']} in {f}")
                r["source_file"] = f
                rows[r["id"]] = r
    return rows


def load_verdicts() -> Rows:
    out: Rows = {}
    for f in sorted(glob.glob(str(OUT / "4-register/verify/*.jsonl"))):
        for line in Path(f).read_text(encoding="utf-8").splitlines():
            if line.strip():
                v = json.loads(line)
                v["batch"] = Path(f).stem
                out[v["id"]] = v
    return out


def cluster_maps(clusters: list[Row], rows: Rows) -> tuple[dict[str, str], Rows]:
    member_of: dict[str, str] = {}
    for cluster in clusters:
        for member in cluster["members"]:
            if member in member_of or member == cluster["primary"]:
                raise SystemExit(f"{member} in two clusters")
            member_of[member] = cluster["primary"]
    by_primary = {cluster["primary"]: cluster for cluster in clusters}
    for member in member_of:
        if member in by_primary:
            raise SystemExit(f"{member} is a member and a primary")
    for finding in list(member_of) + list(by_primary):
        if finding not in rows:
            raise SystemExit(f"cluster names unknown id {finding}")
    return member_of, by_primary


def apply_verdict(entry: Row, row: Row, verdict: Row | None) -> None:
    if verdict:
        entry["verified"] = verdict["verdict"]
        entry["verify_note"] = verdict["reason"]
        entry["verify_batch"] = verdict["batch"]
        entry["probe_signal"] = verdict.get("probe_signal", "")
        if verdict.get("cause"):
            entry["cause"] = verdict["cause"]
    elif row["severity"] in ("High", "Medium"):
        entry["verified"] = "not verified"
    else:
        entry["verified"] = "not required (Low or Info)"


def finding_entry(
    row: Row, verdict: Row | None, rule: Row, member_of: dict[str, str], clusters: Rows
) -> Row:
    entry = {key: row[key] for key in row if key != "source_file"}
    entry["original_severity"] = row["severity"]
    entry["source"] = row["source_file"]
    apply_verdict(entry, row, verdict)
    default_severity = row["severity"]
    if (
        verdict
        and verdict["verdict"] in ("not reproduced", "not a defect")
        and verdict.get("suggested_severity") in SEV
    ):
        default_severity = verdict["suggested_severity"]
    entry["severity"] = rule.get("severity", default_severity)
    entry["kind"] = rule.get("kind", row["kind"])
    entry["owner_decision"] = rule.get("owner_decision", row["owner_decision"])
    if rule.get("section"):
        entry["section"] = rule["section"]
    entry["ruling_note"] = rule.get("note", "")
    entry["owner_question"] = rule.get("owner_question", "")
    entry["merged_into"] = member_of.get(row["id"], "")
    entry["merged_ids"] = clusters.get(row["id"], {}).get("members", [])
    entry["cluster_cause"] = clusters.get(row["id"], {}).get("cause", "")
    return entry


def disposition(entry: Row, rule: Row) -> str:
    if rule.get("disposition"):
        result = cast(str, rule["disposition"])
    elif entry["verified"] in ("not reproduced", "not a defect"):
        result = "rejected"
    elif entry["kind"] == "hostile-input":
        result = "parked"
    elif entry["owner_decision"]:
        result = "owner"
    elif entry["severity"] in ("High", "Medium"):
        result = "repair"
    else:
        result = "batch"
    if result == "repair" and entry["verified"] != "confirmed":
        result = "pending verification"
    return result


def apply_dispositions(register: list[Row], rulings: Rows, task_of: dict[str, str]) -> None:
    by_id = {entry["id"]: entry for entry in register}
    for entry in register:
        if entry["merged_into"]:
            entry["disposition"] = "merged"
            continue
        entry["disposition"] = disposition(entry, rulings.get(entry["id"], {}))
        entry["task"] = task_of.get(entry["id"], "")
        if entry["task"] and entry["disposition"] != "repair":
            print(
                f"WARNING {entry['id']} in task {entry['task']} "
                f"but disposition {entry['disposition']}"
            )
    for entry in register:
        if entry["merged_into"]:
            primary = by_id[entry["merged_into"]]
            entry["disposition_via"] = primary["disposition"]
            entry["task"] = primary.get("task", "")


def write_register(register: list[Row]) -> None:
    order = {severity: index for index, severity in enumerate(SEV)}
    register.sort(key=lambda entry: (order[entry["severity"]], entry["id"]))
    with (OUT / "4-register/register.jsonl").open("w", encoding="utf-8") as output:
        for entry in register:
            output.write(json.dumps(entry, ensure_ascii=False) + "\n")
    heads = [entry for entry in register if not entry["merged_into"]]
    print("findings:", len(register), "after merge:", len(heads))
    print("severity (after merge):", dict(Counter(entry["severity"] for entry in heads)))
    print("disposition:", dict(Counter(entry["disposition"] for entry in heads)))
    print(
        "repair without task:",
        [entry["id"] for entry in heads if entry["disposition"] == "repair" and not entry["task"]],
    )


def main() -> None:
    scratch = Path(sys.argv[1])
    rows = load_findings()
    verdicts = load_verdicts()
    clusters = json.loads((scratch / "clusters.json").read_text())
    rulings = json.loads((scratch / "rulings.json").read_text())
    tasks = json.loads((scratch / "tasks.json").read_text())
    task_of = {finding: task["id"] for task in tasks for finding in task["findings"]}
    member_of, by_primary = cluster_maps(clusters, rows)
    for finding in rulings:
        if finding not in rows:
            raise SystemExit(f"ruling names unknown id {finding}")
    register = [
        finding_entry(row, verdicts.get(finding), rulings.get(finding, {}), member_of, by_primary)
        for finding, row in rows.items()
    ]
    by_id = {entry["id"]: entry for entry in register}
    # A cluster takes the highest severity of its members.
    for primary, cluster in by_primary.items():
        severities = [by_id[primary]["severity"]] + [
            by_id[member]["severity"] for member in cluster["members"]
        ]
        by_id[primary]["severity"] = min(severities, key=SEV.index)
    apply_dispositions(register, rulings, task_of)
    write_register(register)


if __name__ == "__main__":
    main()
