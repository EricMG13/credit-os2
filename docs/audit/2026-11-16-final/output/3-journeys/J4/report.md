# J4 report: credit committee member, challenging a finished synthetic run

## Could the journey be completed?

Yes. A finished synthetic run was produced in my own root through the screen (issuer `Northbridge
Synthetic Group`, as of 2025-03-31, Full credit assessment, the filing, the workbook and the agreement
uploaded and the agreement chosen as executed; 14 of 14 modules, USD 0.00 of USD 25.00). On it the
person picked three figures and three claims, tried to verify each from the screen alone, downloaded
the original handoffs and compared them, and looked for contrary evidence. Nothing blocked the
journey and nothing failed to draw. In every segment the browser blocked 0 requests (all hosts but
loopback refused, R8), had 0 failed requests, 0 console errors or warnings and 0 page errors.

## Verdict per pick

| Pick | Value | Source | Period | Unit | Calculation | Limitation |
| --- | --- | --- | --- | --- | --- | --- |
| F1 Net leverage 2.25x | Right (1125 / 500) | `annual.txt`, not a file the run holds (J4-004) | FY2024 shown; dates only in the full handoff view | `x`, shown | Only in the full handoff view (T4.9), 5 to 6 clicks away; no trace on the tile (J4-001) | `Synthetic.` |
| F2 Exposure 2.37% NAV, limit 2.50% | Right, matches the workbook | Sheet `Compliance_Monitor`, file on Sources | 2025-03-31, shown | `% NAV`, shown | Not derived, read from the sheet | `Proposal is illustrative.` |
| F3 Cash proxy FY2027E 172.46 / Downside 97.47 | Right, recomputed from the handoff JSON | Handoff line 93 | FY2027E, no dates | `Units not recorded` | Assumptions on no page, raw JSON only (J4-003) | `not analytical review`, stated |
| C1 "cover is thin at 3.1x" | Not reproducible: tile 4.00x, covenant 2.6x, Downside 3.10x (J4-002) | `annual.txt p.2`, drawer says not in inventory | none | `x` | none | none |
| C2 "a USD 1,250 million refinancing would" | Amount found; FY2027 in one module, FY2028 in another (J4-002) | `Basis was not recorded` | conflicting | US$m | none | none |
| C3 Covenant 4.2x against 5.0x, 2.6x against 2.0x | Thresholds match the agreement; 4.2x disagrees with 2.25x; Minimum liquidity 100 is not in the agreement (J4-002) | `Synthetic.` | none | `x`, `US$m` | Headroom 0.8x and 0.6x right | `Synthetic.` |

What held up: every trace drawer's `Handoff line N` matches the downloaded file (92 drawers, 0
mismatches); all 14 downloads equal the zip entries and equal `proof/handoffs/` from `## Findings` on;
every module page carries every numeric cell of its handoff's chart and table sections; the three
source hashes equal the files'; the Confidence score 89 recomputes; the forecast arithmetic recomputes;
missing values are shown as reasons, never as zero. The Evidence handoff view drops only the Request and Next module sections, the Escalation Consequence column of the Downside monitoring table (by the rule that text written for another module is drawn nowhere; not registered) and, in the full view, the Forward credit model's JSON block (in J4-003).

## Findings

14 findings in `findings.jsonl`: 0 High, 7 Medium, 6 Low, 1 Info. Medium: J4-001 (tiles have no trace),
J4-002 (screens disagree on cover, leverage, the 1,250 maturity and source readiness; caused by the
canned handoffs), J4-003 (forecast assumptions and downside shock not stated), J4-004 (Sources and Gaps
hide unmatched citations), J4-005 (Confidence method not shown), J4-006 (calendar counts one event
many times), J4-007 (Adjusted EBITDA tile silently dropped). Each has a probe in `probes/`; all
start their own service on port 8764 with a fresh root and finish with 0 blocked requests.

Several Medium findings (J4-002, J4-004 in part, J4-006) are driven by the synthetic proof's canned
handoffs, which contradict one another and repeat one set of events and one Confidence block in all 14
modules; they are registered because the screens show the contradictions unflagged, and stage 4 may
decide the fix belongs in `proof/handoffs/` and not in the library.

## Files

- `journey.md`, `findings.jsonl`, `report.md`
- `probes/_lib.mjs` (shared helper) and one script per Medium finding: `j4-001-...` to `j4-007-...`,
  `j4-low-checks.mjs` (J4-008 to J4-011, J4-013, J4-014), `j4-012-model-downloads.mjs`
- `evidence/`: the screenshots and probe outputs the findings cite

Not verified: a second run for the same issuer, so Changes with data was not read (J5 and J3 cover it); a live or non-synthetic run, so how the library treats a real model's contradictions, missing sources or varying key findings is unknown (R4); the Model (it is unavailable on this run) and Excel exports; narrow windows, touch and a screen reader (hover and focus were tested only with Chromium on desktop width); Chrome and Edge on Windows; the work-PC clean-machine journey (`Run-React-Proof.cmd`, stage 7); the static app from disk (J6).
