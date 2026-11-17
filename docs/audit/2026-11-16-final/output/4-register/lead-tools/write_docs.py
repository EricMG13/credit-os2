"""Write register.md, tasks.md, groups.md, parked.md and harmony.md from register.jsonl.

Usage (from the repository root): python3 -I write_docs.py <scratchpad dir>
"""

import csv
import glob
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

OUT = Path("docs/audit/2026-11-16-final/output")
REG = OUT / "4-register"
SEV = ["High", "Medium", "Low", "Info"]
DISP = ["repair", "batch", "sweep", "owner", "deferred", "parked", "rejected", "merged"]


def esc(text: str) -> str:
    return str(text).replace("|", "\\|").replace("\n", " ")


def short(text: str, n: int = 160) -> str:
    text = esc(text)
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def main() -> None:
    sp = Path(sys.argv[1])
    reg = [json.loads(line) for line in (REG / "register.jsonl").read_text().splitlines() if line]
    by_id = {e["id"]: e for e in reg}
    heads = [e for e in reg if not e["merged_into"]]
    tasks = json.loads((sp / "tasks.json").read_text())

    # register.md
    lines = ["# Register (stage 4)", ""]
    lines += [
        f"{len(reg)} findings were merged: {sum(1 for e in reg if e['source'].startswith(str(OUT / '2-sections')))} from stage 2, "
        f"{sum(1 for e in reg if e['source'].startswith(str(OUT / '3-journeys')))} from stage 3 and "
        f"{sum(1 for e in reg if 'baseline' in e['source'])} carried from stage 0. "
        f"{len(reg) - len(heads)} were merged into another finding with the same cause, which leaves "
        f"{len(heads)} findings. Counts below are of those {len(heads)}, after re-grading.",
        "",
        "Each finding's full record is in `register.jsonl` (fields of the schema, plus `verified`, "
        "`original_severity`, `disposition`, `task`, `merged_ids`, `merged_into`, `owner_question` "
        "and `ruling_note`).",
        "",
        "## Counts",
        "",
        "| Severity | " + " | ".join(DISP[:-1]) + " | Total |",
        "| :--- | " + " | ".join("---:" for _ in DISP[:-1]) + " | ---: |",
    ]
    for s in SEV:
        row = [sum(1 for e in heads if e["severity"] == s and e["disposition"] == d) for d in DISP[:-1]]
        lines.append(f"| {s} | " + " | ".join(str(x) for x in row) + f" | {sum(row)} |")
    tot = [sum(1 for e in heads if e["disposition"] == d) for d in DISP[:-1]]
    lines.append("| Total | " + " | ".join(str(x) for x in tot) + f" | {sum(tot)} |")
    lines += ["", "| Section | High | Medium | Low | Info |", "| :--- | ---: | ---: | ---: | ---: |"]
    secs = sorted({e["section"] for e in heads})
    for sec in secs:
        c = Counter(e["severity"] for e in heads if e["section"] == sec)
        lines.append(f"| {sec} | " + " | ".join(str(c.get(s, 0)) for s in SEV) + " |")
    vc = Counter(e["verified"] for e in heads if e["original_severity"] in ("High", "Medium") or e["severity"] in ("High", "Medium"))
    lines += ["", "Verification of High and Medium findings: " + ", ".join(f"{k} {v}" for k, v in sorted(vc.items())) + "."]
    lines += ["", "## Findings", "", "High first. `Merged` lists the ids with the same cause.", ""]
    lines += ["| Id | Sev | Section | Finding | Disposition | Task | Merged | Verified |", "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"]
    order = {s: i for i, s in enumerate(SEV)}
    for e in sorted(heads, key=lambda x: (order[x["severity"]], DISP.index(x["disposition"]) if x["disposition"] in DISP else 9, x["id"])):
        disp = e["disposition"] + (f" ({e['owner_question']})" if e.get("owner_question") else "")
        sev = e["severity"] + ("" if e["severity"] == e["original_severity"] else f" (was {e['original_severity']})")
        lines.append(
            f"| {e['id']} | {sev} | {e['section']} | {short(e['title'])} | {disp} | {e.get('task','')} | "
            f"{', '.join(e['merged_ids'])} | {e['verified']} |"
        )
    (REG / "register.md").write_text("\n".join(lines) + "\n")

    # tasks.md and groups.md
    def probes_for(fid: str) -> list[str]:
        ids = [fid] + by_id[fid]["merged_ids"]
        out = []
        for i in ids:
            p = by_id[i]["probe"].strip()
            if p and p not in out:
                out.append(p)
        return out

    tl = [
        "# Repair tasks (stage 4)",
        "",
        "One task per cause or per tightly related set in the same files. Tasks in different groups "
        "share no file (`groups.md`); tasks in one group that share a file run in the order below. "
        "A probe is the task's answer key: the implementer does not edit it. A probe whose signal is "
        "`output` prints the defect and exits 0 whether or not the defect is present, so the "
        "implementer reads its output before and after the repair; a probe whose signal is `exit` "
        "exits non-zero while the defect is present. A probe that starts `proof.serve` must run on a "
        "port no other worker uses.",
        "",
    ]
    for t in tasks:
        tl += [f"## {t['id']} (group {t['group']}). {t['title']}", ""]
        tl.append("Findings:")
        tl.append("")
        for fid in t["findings"]:
            e = by_id[fid]
            merged = f" (with {', '.join(e['merged_ids'])})" if e["merged_ids"] else ""
            note = f" Ruling: {esc(e['ruling_note'])}" if e.get("ruling_note") else ""
            tl.append(f"- {fid}{merged}, {e['severity']}: {esc(e['title'])}{note}")
        tl += ["", "Files: " + ", ".join(f"`{f}`" for f in t["files"]), ""]
        tl.append("Probes:")
        tl.append("")
        for fid in t["findings"]:
            sig = by_id[fid].get("probe_signal", "") or "see the probe header"
            for p in probes_for(fid):
                tl.append(f"- {fid} ({sig}): `{esc(p)}`")
        tl += ["", f"Touches money, ordering or security code: {t['sensitive'] or 'no'}."]
        if t.get("note"):
            tl += ["", "Note: " + t["note"]]
        tl.append("")
    (REG / "tasks.md").write_text("\n".join(tl))

    gl = ["# Repair groups (stage 4)", "", "Each group is one `repair-<n>` session (`sessions/repair.md`). No file is in two groups.", ""]
    names = {1: "Connected shell, run activity, Start a run, the service and the synthetic proof", 2: "Connected report", 3: "Static app and the library parts both surfaces draw"}
    for g in (1, 2, 3):
        ts = [t for t in tasks if t["group"] == g]
        files = sorted({f for t in ts for f in t["files"]})
        gl += [f"## Group {g}: {names[g]}", "", "Tasks, in order: " + ", ".join(t["id"] for t in ts) + ".", "",
               f"Findings: {sum(len(t['findings']) for t in ts)} (plus their merged ids).", "", "Files:", ""]
        gl += [f"- `{f}`" for f in files] + [""]
    (REG / "groups.md").write_text("\n".join(gl))

    # parked.md
    pk = ["# Parked findings (stage 4)", "", "Hostile or unusual inputs no roadmap line names (ruling R3). Registered, not repaired.", "",
          "| Id | Sev | Section | Finding | Merged |", "| :--- | :--- | :--- | :--- | :--- |"]
    for e in sorted((e for e in heads if e["disposition"] == "parked"), key=lambda x: (order[x["severity"]], x["id"])):
        pk.append(f"| {e['id']} | {e['severity']} | {e['section']} | {short(e['title'], 220)} | {', '.join(e['merged_ids'])} |")
    (REG / "parked.md").write_text("\n".join(pk) + "\n")

    # harmony.md
    disp_of = {}
    for e in reg:
        head = by_id[e["merged_into"]] if e["merged_into"] else e
        disp_of[e["id"]] = head["disposition"] + (f" ({head['id']})" if e["merged_into"] else "")
    rows = []
    for f in sorted(glob.glob(str(OUT / "2-sections/*/harmony.csv"))):
        sec = Path(f).parent.name
        with open(f, encoding="utf-8", newline="") as fh:
            for r in csv.DictReader(fh):
                rid = (r.get("row_id") or "").strip()
                mark = (r.get("mark") or "").strip() or "(no mark)"
                ref = " ".join(filter(None, [r.get("finding", ""), r.get("findings", ""), r.get("evidence", "") if "-" in r.get("evidence", "")[:4] else ""]))
                fids = sorted({tok.strip(",;()") for tok in ref.replace(",", " ").split() if tok.strip(",;()") in by_id})
                rows.append((rid, sec, mark, fids))
    hm = ["# Harmony summary (stage 4)", "",
          "Every content-matrix (CM) and control-matrix (CT) row as each section marked it, the findings the row cites and their disposition. "
          "Rows a section added for items no matrix row covers have no CM or CT id.", ""]
    mc = Counter(m for _, _, m, _ in rows)
    hm += ["| Mark | Rows |", "| :--- | ---: |"] + [f"| {esc(k)} | {v} |" for k, v in mc.most_common()] + [""]
    hm += ["## Matrix amendments from the owner's ruling (R10)", "",
           "- OQ-01: the static app is a design reference; the CM and CT rows marked `missing` on S sections because the static slices hold a reduced vocabulary are amended to name the connected app only.",
           "- OQ-07: CM-033, CT-043 and CT-044 are amended: runs and modules that did not complete stay listed, with their state drawn.",
           "- OQ-10: the run-level delivery and admission states (S6-015) are removed from the matrix rows that ask for them.",
           "- OQ-13: rows are added for the skip link, brand mark, not-found page, data notices, run tab bar, run-header actions, Show sources switch, sort buttons, disclosures, List-view range filters and tooltips, and the Readiness panel; CT-028's section is corrected.",
           "- OQ-09 (S2-012): the design-system text is amended: the trace control is drawn at rest.",
           "", "## Rows", "", "| Row | Section | Mark | Findings and disposition |", "| :--- | :--- | :--- | :--- |"]
    for rid, sec, mark, fids in sorted(rows, key=lambda x: (x[0] or "~", x[1])):
        hm.append(f"| {esc(rid) or '(unaccounted)'} | {sec} | {esc(mark)} | {'; '.join(f'{i}: {disp_of[i]}' for i in fids)} |")
    (REG / "harmony.md").write_text("\n".join(hm) + "\n")
    print("written; harmony rows", len(rows))


if __name__ == "__main__":
    main()
