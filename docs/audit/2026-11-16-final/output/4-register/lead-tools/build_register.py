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

OUT = Path("docs/audit/2026-11-16-final/output")
SEV = ["High", "Medium", "Low", "Info"]


def load_findings() -> dict[str, dict]:
    rows: dict[str, dict] = {}
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


def load_verdicts() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for f in sorted(glob.glob(str(OUT / "4-register/verify/*.jsonl"))):
        for line in Path(f).read_text(encoding="utf-8").splitlines():
            if line.strip():
                v = json.loads(line)
                v["batch"] = Path(f).stem
                out[v["id"]] = v
    return out


def main() -> None:
    sp = Path(sys.argv[1])
    rows = load_findings()
    verdicts = load_verdicts()
    clusters = json.loads((sp / "clusters.json").read_text())
    rulings = json.loads((sp / "rulings.json").read_text())
    tasks = json.loads((sp / "tasks.json").read_text())
    task_of = {f: t["id"] for t in tasks for f in t["findings"]}

    member_of: dict[str, str] = {}
    for c in clusters:
        for m in c["members"]:
            if m in member_of or m == c["primary"]:
                raise SystemExit(f"{m} in two clusters")
            member_of[m] = c["primary"]
    cluster_by_primary = {c["primary"]: c for c in clusters}
    for m in member_of:
        if m in cluster_by_primary:
            raise SystemExit(f"{m} is a member and a primary")
    for fid in list(member_of) + list(cluster_by_primary):
        if fid not in rows:
            raise SystemExit(f"cluster names unknown id {fid}")
    for fid in rulings:
        if fid not in rows:
            raise SystemExit(f"ruling names unknown id {fid}")

    register = []
    for fid, r in rows.items():
        v = verdicts.get(fid)
        rule = rulings.get(fid, {})
        e = {k: r[k] for k in r if k != "source_file"}
        e["original_severity"] = r["severity"]
        e["source"] = r["source_file"]
        if v:
            e["verified"] = v["verdict"]
            e["verify_note"] = v["reason"]
            e["verify_batch"] = v["batch"]
            e["probe_signal"] = v.get("probe_signal", "")
            if v.get("cause"):
                e["cause"] = v["cause"]
        elif r["severity"] in ("High", "Medium"):
            e["verified"] = "not verified"
        else:
            e["verified"] = "not required (Low or Info)"
        default_sev = r["severity"]
        if v and v["verdict"] in ("not reproduced", "not a defect") and v.get("suggested_severity") in SEV:
            default_sev = v["suggested_severity"]
        e["severity"] = rule.get("severity", default_sev)
        e["kind"] = rule.get("kind", r["kind"])
        e["owner_decision"] = rule.get("owner_decision", r["owner_decision"])
        if rule.get("section"):
            e["section"] = rule["section"]
        e["ruling_note"] = rule.get("note", "")
        e["owner_question"] = rule.get("owner_question", "")
        e["merged_into"] = member_of.get(fid, "")
        e["merged_ids"] = cluster_by_primary.get(fid, {}).get("members", [])
        e["cluster_cause"] = cluster_by_primary.get(fid, {}).get("cause", "")
        register.append(e)

    by_id = {e["id"]: e for e in register}
    # A cluster takes the highest severity of its members.
    for p, c in cluster_by_primary.items():
        sevs = [by_id[p]["severity"]] + [by_id[m]["severity"] for m in c["members"]]
        by_id[p]["severity"] = min(sevs, key=SEV.index)

    for e in register:
        rule = rulings.get(e["id"], {})
        if e["merged_into"]:
            e["disposition"] = "merged"
            continue
        if rule.get("disposition"):
            e["disposition"] = rule["disposition"]
        elif e["verified"] in ("not reproduced", "not a defect"):
            e["disposition"] = "rejected"
        elif e["kind"] == "hostile-input":
            e["disposition"] = "parked"
        elif e["owner_decision"]:
            e["disposition"] = "owner"
        elif e["severity"] in ("High", "Medium"):
            e["disposition"] = "repair"
        else:
            e["disposition"] = "batch"
        if e["disposition"] == "repair" and e["verified"] != "confirmed":
            e["disposition"] = "pending verification"
        e["task"] = task_of.get(e["id"], "")
        if e["task"] and e["disposition"] != "repair":
            print(f"WARNING {e['id']} in task {e['task']} but disposition {e['disposition']}")
    for e in register:
        if e["merged_into"]:
            p = by_id[e["merged_into"]]
            e["disposition_via"] = p["disposition"]
            e["task"] = p.get("task", "")

    order = {s: i for i, s in enumerate(SEV)}
    register.sort(key=lambda e: (order[e["severity"]], e["id"]))
    with (OUT / "4-register/register.jsonl").open("w", encoding="utf-8") as f:
        for e in register:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    heads = [e for e in register if not e["merged_into"]]
    print("findings:", len(register), "after merge:", len(heads))
    print("severity (after merge):", dict(Counter(e["severity"] for e in heads)))
    print("disposition:", dict(Counter(e["disposition"] for e in heads)))
    print("repair without task:", [e["id"] for e in heads if e["disposition"] == "repair" and not e["task"]])


if __name__ == "__main__":
    main()
