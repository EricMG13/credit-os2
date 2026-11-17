# J1: analyst, first visit (record)

Person: a credit analyst who knows credit, not the tool, opening Credit OS 2 for the first time with no runs.
Rule: the person reads the screen to decide the next step; the code was read only afterwards, to classify a defect.
Date: 2026-11-17, 07:24 to about 08:05 UTC. Build under audit: branch `audit/out-journeys`, no change under `web/`, `src/`, `react_frontend/` or `proof/`.

## How it was run

- Service: `PYTHONPATH=src uv run --locked python -m proof.serve --root <root> --port 8761`, started and killed (own process group) by each Node driver; nothing of mine listened on 8761 between segments. Synthetic only (R4): the dialog read "spends USD 0.00"; no provider key, no `--live`, no real Submit.
- Browser: Playwright 1.62.1, Chromium headless shell build 1243, 1440 x 900 (2600 high for tall captures), all hosts but loopback blocked (R8). Across every segment, 0 requests were blocked and 0 failed to draw; the only console errors were the driver's own request to a route that does not exist (`/api/runs`, 404) and the 400 of the refused Submit in J1-001.
- Roots: exploration segments ran on fresh folders under `/tmp/jr/j1-scratch/root-*`; the journey itself ran on `/tmp/jr/j1`. `proof.serve` refuses a root that already holds files (J1-019), so a later segment could not reopen an earlier run as the brief assumed; each segment ran one whole service session instead.
- Drivers: exploration scripts are in scratch (not kept). `probes/j1-journey.cjs` is the consolidated driver (steps 1 to 17 below; prints `FACT:` lines, copied to `evidence/j1-journey-facts.txt`); `probes/j1-001` to `j1-004` are the probes for the High and Medium findings.
- The run takes 2 to 3 seconds in the synthetic engine, so "watching progress" is one or two screens.

## Step by step

| # | The analyst wanted | The screen offered | They did | What happened | Time to find the next step |
| ---: | :--- | :--- | :--- | :--- | :--- |
| 1 | To see what is here | Library, empty: filters Sector and Pathway, Cards/List, "No reports yet", blue "Start a run" top right, two icon-only rail links | Looked | Page drew in 0.9 s, no request left the machine. The empty text says nothing about how to start; the button does. | Under 5 s (one primary button) |
| 2 | To start | "Start a run" button; rail play-circle icon (no label) | Clicked the button | `/start`, "Synthetic test" badge, four-step stepper, Readiness card (4 items "Not met", "Configured cap USD 0.00 of USD 25.00") | Immediate |
| 3 | To enter the issuer, date, documents (docs/react-workflow.md) | Drop zone, "Choose files", "Choose a folder", "Inspect documents" (disabled), Issuer name, Issuer ID, As-of date (pre-filled with today, 2026-11-17), Issue classification, Your name, "Carry over from latest run" | Typed `Northbridge Synthetic Group` and `2025-03-31` (Issuer ID filled itself), set the two files on the file input (a native dialog cannot be driven) | Files listed as "Selected". "Carry over from latest run" with no runs says "No earlier run was found for this issuer." | Under 10 s |
| 4 | To continue as the document says | "Continue to purpose" | Clicked, with no name (the document never mentions one) | Went to step 2; Documents ticked Complete; both files "Inspected · unrecognised" (J1-006) | Immediate |
| 5 | To choose Full credit assessment | Eight pathway cards (name, one line, "N base modules": 5, 14, 20, 8, 11, 12, 13, 8), "Run purpose", "Case kind" (Synthetic test case), "Run form level" (Basic) | Left Full selected, "Continue to context" | The card is pre-selected yet Readiness says "Purpose chosen: Not met" until Continue. Cap reads 15, 25, 40 or 20 in Readiness as the card changes; no cap on the cards (J1-018). Step title "Purpose" and the select "Run purpose" mean different things (J1-016). | Immediate |
| 6 | To pick the workbook (document: "In More context, select ... under Portfolio workbook") | "More context, Optional. You can continue if the documents provide all the context.": note, newest-file date, research cutoff (2025-03-31), periods (faded examples), Legal documents (No agreement), Portfolio workbook (None, filing, workbook), collapsed Issuer details, rows to add | Chose `northbridge-portfolio.xlsx` (the list also offers the `.txt` filing), "Review run" | Review run with no name sent the analyst back to step 1: "1 problem to fix: Enter your name as your first name and initial, for example Eric G". Stepper reset to steps 2 to 4 "Not started"; the answers were kept (J1-005). | Error is focused at once; 3 more clicks to get back |
| 7 | To enter the name and go on | Your name field in error | Typed `Ana L`, three Continue clicks | Purpose, agreement and workbook choices were still set | About 15 s |
| 8 | To read the summary | "Review and start": Issuer and documents, Purpose and modules (14 listed), Context, Issuer details, Context details, Valuation and peers, Scenario assumptions, Advanced choices, then "Limits to decide: 0 of 4 decided" | Read it | Will refuse (Legal & covenants: no agreement chosen, stops with "No executed governing document", also affects four modules), Gap (Security selection: no quotes), Check x2 (no filed financial report recognised). The sheet says what to do: add the agreement and choose it, "or leave out Legal & covenants". The analyst has no agreement file (the document lists two). Odd wording: "Report sections omitted · What changed since the last Report", "Fixed below the Advanced form level." (J1-017). Portfolio workbook row says "Among the documents" (J1-006). | Limits are the first thing below the sheet |
| 9 | To get the run going | Four accept boxes ("I accept these 5 limits", "I accept this limit", "I have checked this" x2), then "Approve: ..." (disabled until all decided), "Submit run" (disabled) | Accepted all four, approved | Readiness: Decisions made 4 of 4, Summary approved Met; Submit enabled | Immediate |
| 10 | To cancel at the confirmation, then confirm | "Submit run" opens "Start a synthetic test? This test runs the workflow with the supplied documents and spends USD 0.00." with Cancel and "Start synthetic run" | Cancelled, then pressed Submit again; also tried Escape in a later segment | Cancel closed the dialog, focus returned to "Submit run", approval stayed ticked, no run existed. Escape also closed it. The paid dialog ("Start a paid run?") does not exist under proof.serve (not verified). | Immediate; works well |
| 11 | To watch the run | Run page `/run/<id>`: Running, Cap usage USD 0.00, Modules finished 0 of 14, per-module Queued/Running/Finished list, Activity feed | Waited | After 2 s: **Failed**, "stopped: checker", 4 of 14 finished, Legal & covenants "Interrupted", nine modules and Report "Not run", three "Module draft rejected" events. No report. The sheet had named five affected modules, not ten (J1-002). | The failure line is the only text; "Start from this run" is the only button |
| 12 | To recover | "Start from this run" | Clicked | `/start?from=<id>`: "Review the copied answers, add dates, and inspect its available documents." Documents list "No documents yet", As-of date today, Your name empty (J1-015). "Inspect documents" listed the two carried files. | About 10 s |
| 13 | To fix the legal gap | Legal documents, "The agreement" select appears after choosing Executed | Re-entered date and name, added `northbridge-credit-agreement.txt`, chose Executed agreement and that file | Agreement read as "credit agreement · executed · found 'Credit Agreement' on page 1". The portfolio workbook was not carried; the sheet raised a Check naming it and pointing to "Issuer and dates" (J1-007). | The sheet's own text led here (the document did not) |
| 14 | To submit | Review (Will refuse gone; 3 decisions) | Accepted, approved, confirmed | Run page: Running, 14 of 14 in 3 s, Report delivery, **Finished** with "Open report" | Immediate |
| 15 | To open the report | "Open report" | Clicked | `/report/<id>`: header (issuer, "As of 31 March 2025", pathway, Finished, Synthetic test), Overview with Bottom line, five figure tiles, Key findings, Contrary evidence and what would change the view, Bottom line by module (13 rows), Limitations, Dates to watch; tabs Report, Overview, Changes (first run: "No earlier run to compare"), Modules 14, Forecast, Evidence. Opened within 3 s. | Immediate |
| 16 | To find the run again | Library card: figures, "Open report", "1 run"; Run activity | Opened both | Library lists the run once. Run activity showed only the failed run ("Ended 1", "Ended without a report") (J1-008). | One click each |
| 17 | To start another run | "Start a run" | Pressed Back from the run page, then Start a run | A clean form each time; no stale approval, no double submit. The name is not remembered. | Immediate |

## Side checks (the screen offered them, so the analyst tried them)

| Check | Result |
| :--- | :--- |
| "Leave out Legal & covenants" (the sheet's other route) | Returned to More context with no message; sheet then read "Modules (13)", "Left out: Legal & covenants", "Put back". Approve and confirm worked; Submit refused with "unknown module CP-MODEL" (J1-001). Advanced > Requested modules, one module unticked: same refusal. |
| Other pathways, all with the agreement | Lite, Deep, Earnings Update, Relative Value, Covenant & Refinancing, Distressed & Restructuring, Portfolio Decision: each reviewed, approved, confirmed, then Failed with "launcher exited 2; see logs/<id>.log" (J1-003). Earnings Update first stops at Review run: Current period and Prior period are required while the step says Optional (J1-004). |
| Every optional answer filled (note, issue classification, newest-file date, periods, a facility, a quote, a rating, a research question) | A missing quote Provider gave an in-page alert; once filled the sheet echoed every answer (blank fields "Not given", not zero), the run finished and the report header showed "S&P Facility, B+, Positive, Entered at run start". The note was added as Question 2. Works. |
| Report tabs Changes, Modules, Forecast, Evidence, Report | All drew; "Show sources" only outlines the trace icons; the trace drawer opened on the Bottom line, Escape closed it and focus returned to its opener. Module order differs from the run page (J1-009). |
| Document titles | Library, Start, Run activity and run page all read "Credit OS" (J1-010). |

## What the analyst was able to decide, against the control matrix

| Matrix row | Seen on screen? |
| :--- | :--- |
| CT-001 issuer name, CT-002 issuer id, CT-003 as-of date, CT-009 analyst name | Yes, step 1. As-of date defaults to today (J1-015 for the from-run page); name format error is in-page but the field is unmarked (J1-005). |
| CT-004 case kind, CT-005 form level | Yes, step 2 (Synthetic test case and Basic by default). Web lookup shown "Off, because this is a synthetic case" (CT-027). |
| CT-006 documents | Added and removed (Remove button); folder upload and drag-and-drop not driven. |
| CT-007, CT-008 agreement, workbook, bridge | Yes, step 3; bridge only for Earnings Update; workbook list offers the `.txt` filing. |
| CT-010 ratings and context rows | Yes; rating shown "Entered at run start". |
| CT-011 currency | Not asked, as ruled. |
| CT-012 to CT-019 pathways | Eight cards; seven cannot run in the synthetic test (J1-003). CT-020 (short snapshot) not offered, as ruled. |
| CT-021 cap | Shown only in Readiness for the chosen pathway (J1-018); no estimate shown. |
| CT-022 module selection | Leave out and Requested modules exist; Submit refuses (J1-001). |
| CT-028 earlier run | Review row "Changes: first run of this pathway". |
| CT-029 to CT-033 summary, limits, approval, Submit | Worked as specified; paid dialog not reachable. |
| CT-035 queueing | Run page shows Queued, Running, Finished or Failed. |
| CT-037 retry, CT-038 resume | No retry or resume control other than "Start from this run" on a failed run. |
| CT-041 delivery | Report pages populated; contents are canned and were not checked against handoffs (J3 and J4). |

## Outcome

The journey was completed only with a change to the documented steps: the credit agreement had to be added and chosen, which the screen told the analyst (step 8) and the document does not. The documented route as written ends Failed (step 11), as stage 0 found. Findings: 1 High, 3 Medium, 14 Low, 1 Info (`findings.jsonl`).
