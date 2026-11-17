# J3 journey record: portfolio manager, reading a finished run

Started 2026-11-17 07:24 UTC. Service: `proof.serve` on port 8763, run root `/tmp/jr/j3`. Browser: Chromium headless shell build 1243, every host but loopback blocked (R8).

## Setup: produce a finished synthetic run (not part of the reader's journey)

- 07:25 Segment 1 (`/tmp/jr/j3-scratch/seg1.cjs`, helper `probes/_j3lib.cjs`): drove the analyst steps from `web/scripts/connected-proof.mjs` (Northbridge Synthetic Group, as of 2025-03-31, Full credit assessment, filing + portfolio workbook + credit agreement uploaded, agreement chosen as executed, Moody's B1 Negative rating entered, limits accepted, summary approved, Submit run, Start synthetic run). Run `20261117-072501-01` was published in about 3 s. Blocked requests 0, console errors 0, HTTP errors 0. The service was stopped and port 8763 answers nothing.
- 07:26 Note for the brief: `proof.serve` refuses a root that already holds files ("the synthetic proof requires an empty, separate run root", `proof/serve.py:17-18`), so a finished run cannot be reopened after the service stops. Every segment therefore empties `/tmp/jr/j3` (my own folder), starts the service and completes the analyst run again first (about 3 s) before the reader steps. The journey record below is of the reader steps; each segment's run id is named where it matters.

## The reader's steps (portfolio manager, has not read the sources)

All steps below were driven in the browser by Playwright on run `<id>` of a fresh service each time (the id changes per segment because the root is emptied; the content is the same canned handoffs). Screens quoted are what the person saw at 1440 x 900. Times are wall-clock from the script (page ready to next step).

### Step 1. Open the library and find the finished run (07:25)
- Wanted: find the issuer's latest report.
- Screen offered: Library home. One issuer card, "Northbridge Synthetic Group", "Full credit assessment · 2025-03-31", five headline figures, button "Open report", link "1 run", a prominent "Start a run" button. Left rail: two icon-only links (book, play-in-circle) with no visible words (their accessible names are "Library" and "Run").
- Did: clicked "Open report". Took under 2 s. The next step was obvious.
- Guess points: the left rail icons have no visible label (a book and a play button); "Cash $275m -$25m vs FY2023" carries no better/worse word while every other card does; "1 run" reads as a link but is not obviously "history".

### Step 2. Read Overview for the verdict (07:26)
- Screen offered: header with issuer, "As of 31 March 2025", "Full credit assessment", "Finished", "Synthetic test", a switch "Show sources", button "Run activity", "Business description not in this run", a Moody's B1 Negative box labelled "Entered at run start", then tabs Report / Overview / Changes / Modules 14 / Forecast / Evidence. Overview: dark "Bottom line" band, five figure cards, "Key findings", "Contrary evidence and what would change the view", "Bottom line by module" (13 modules, each "Delivered"), "Limitations" (one sentence per module, module name under it), "Dates to watch".
- Read: the bottom line is "The synthetic issuer shows one observed item." The key finding is "The synthetic issuer's cover is thin at 3.1x." The figure card beside it says "Interest coverage 4.00x +0.80x vs FY2023 better". Contrary evidence: "Nothing supplied contradicts the view; a USD 1,250 million refinancing would."
- Guess points (see findings): which "cover" is 3.1x when the card says interest coverage 4.00x and "better"; "Bottom line by module" lists 13 modules while the Modules tab counts 14 (Committee decision is absent from the list but present in Limitations); the limitations read "in the cp one a case" (module codes spelled out as words); "Dates to watch" rows are all "Synthetic note", with "Wall" and "· day" unexplained; the verdict a manager wants ("Final Sizing Posture: Requires More Work") is only on the Committee decision module page.
- "Show sources" switch: turning it on only draws a ring around each existing trace icon. It did not reveal any source text. The five figure cards have no trace icon with it on or off (clicking a card does nothing).

### Step 3. Follow one finding to its module (07:27)
- Wanted: see which module wrote "cover is thin at 3.1x" and read the context.
- Did: opened the trace drawer on the key finding. It reads "Key findings · Committee decision · Handoff line 32", "The statement", "How it was derived", "Basis annual.txt, page 2", "annual.txt p.2 · not in inventory", "the Basis file is not in the CP-0 inventory", buttons Close (twice) and "Open in Evidence". There is no link to the Committee decision module from the drawer or from the key-findings card; the person has to know to go to Modules and pick "Committee decision".
- Did instead: used "Bottom line by module", clicked "Financial foundation" (arrow link), landed on `#modules/CP-1`. Charts, a "Confidence score 89 High" with no scale, tables.

### Step 4. Trace one figure to Evidence and return (07:29, repeated 07:46)
- Did: scrolled to the "Leverage" chart (scroll position 854 px inside the main region), opened its trace icon. Drawer: "Chart data: leverage / Financial foundation · Handoff line 22 / The statement: Chart data: leverage / Basis Synthetic. / no page, the row cites no page or register" (twice). Clicked "Open in Evidence": Evidence opened on the Trace tab filtered to Financial foundation line 22, showing the table (FY2023 3.75 / 3.00, FY2024 2.80 / 2.25, unit x). 1.6 s.
- Returned with the browser's Back button (the Evidence page offers no "back to Financial foundation" link). A first measurement, taken after I had enlarged the window for a full-page screenshot, showed the module page back at the top; that reading was my own artefact and is not used. Repeated at the real 1440 x 900 size (07:46, three trials each): on Financial foundation the Leverage chart came back about 50 px from where it was (scroll 586 to 532, chart still in view); on Forecast the Revenue chart was at scroll 1,101 and after Back the page was at 257, so the chart was 1,148 px from the top of a 900 px window and out of sight. Evidence itself opens part-way down (scroll 257 of its 1,157 px) because the reading position of the previous page carries over. On Overview, a trace from a Limitations row came back near the row; a link in "Dates to watch" and a module link came back exactly.
- Time: opening the drawer, reading it and arriving on Evidence took about 4 s of waiting; finding the way back took no thought (Back button) but the position was not restored reliably (finding J3-001).

### Step 5. Read Forecast and the downside cases (07:30 to 07:31)
- Wanted: the forward view and what a downside does.
- Screen offered: page title "Forecast", a link "Forecast evidence and artifacts", an in-page list (Cases, Cash flow model, Assumptions, Run charts), "Model scope and basis" (three qualifications), two radio cards "Base case 172.46" and "Downside shock 97.47", each "Cash proxy · FY2027E · Units not recorded", a Cash proxy chart, a Scenario comparison table, Revenue / Closing cash / Closing debt charts, a long table, then limitation bullets, a collapsed "Forecast assumptions", then "Run charts" repeating the module charts.
- Did: chose "Downside shock". The cash proxy chart emphasised it, the case table highlighted its row and the cash flow table switched to the downside column, headed "Downside case". The switch worked and took under a second.
- Read the figures: Base case FY2025E revenue 1,050, opening debt 600, net leverage 1.23x. Financial foundation showed FY2024 revenue 2,250 and gross debt 1,400; Overview showed net leverage 2.25x; the Downside module's control net leverage is 1.25x "LTM to 2025-03-31 as reported". Nothing next to the case values says the forecast starts from other numbers.
- Guess points: "Units not recorded" on the headline numbers; "cash proxy"; "PYTD", "PF LTM", "n.m."; module codes and "Python's arithmetic" in the notes ("CP-1", "CP-2G"); ten near-identical lines "the forecast inputs do not name the row and period of this line"; "Show 7 columns with no values". The downside cases themselves (Cost shock, Cost and rate shock, EBITDA decline 0.1 (10%)) are on the Downside module page, not on Forecast, and Forecast does not link there; the Downside module page does not link to Forecast either.
- Traced the Revenue chart: it opens Evidence at "Forward credit model · Line 93 · Recorded forecast inputs", which prints a literal "```json" fence and a machine-readable JSON block (revenue 1000, ebitda 300, debt 600).

### Step 6. Read Changes (07:32 and 07:36 to 07:41)
- Wanted: what moved since the last run.
- Screen offered: "No earlier run to compare. This is the first listed run for this issuer on this pathway." and a link "Open the Overview". Clear and honest; nothing else.
- Tried to get an earlier run so Changes would have content: started a second run for the same issuer and as-of date through the Start a run page. The review sheet said "Compared with the Full credit assessment run as of 2025-03-31" and listed "Changes since the last run" among the modules. After Submit the run page said "Failed" with "launcher exited 2; see logs/<id>.log". The log is not served (404). The launcher's own log says "synthetic proof requires a first Credit Snapshot run". So a real comparison cannot be produced in the proof. I could not read a real Changes page.
- To see the layout only, I rewrote the snapshot in the browser the way `web/scripts/connected-proof.mjs` does (a fabricated earlier run and a fabricated comparison). That is a labelled fixture, not a product result: Changes then showed "Changes since the last run", Cards/Table, a "Comparable -$50m Net debt $550m from $600m" card and a debt maturity chart, then "This handoff has no findings in this report format." Nothing from it is used as a finding.

### Step 7. Evidence, sources, downloads (07:31 and 07:41)
- Evidence tabs: Summary, Trace, Sources, Gaps, Script checks (badge 215), Record. A "Module" filter applies to all. Summary: "14 designated handoffs · 3 source files", a Handoffs list with a Download button per module, "Download all handoffs", "Model and calculation files" (Annual model handoff, Calculation JSON, Exact forecast JSON) and "The original HTML Model is unavailable for this run." Trace without an item chosen shows the same list of downloads. Sources lists the three uploaded files with SHA-256 hashes and "Open source file" links; all three open (200). Gaps: "Gaps 0 ... This run lists no gaps." Script checks: 215 items, 205 "not checked", 9 "agreed", 1 "noted", no explanation. Record: run code, "Synthetic test", "3 s", "USD 0.00 of USD 25.00".
- All downloads answered 200 (zip, 14 .md files, three model files). Nothing blocked.

### Step 8. Other places the person looked (07:43 to 07:49)
- Run activity link in the header: opens the run page ("Finished", 14 of 14 modules, "Open report", "Start from this run"). Clear.
- "Report" tab: opens "Report history" with one row and links "Open overview" and "What changed". The word "Report" does not say history.
- Browser tab titles: every module and every Evidence tab has the same title; Library, Run activity, Start and Run progress are all just "Credit OS".
- Hover on the left rail icons: no tooltip; no title attribute.
- Network: 0 blocked requests, 0 failed requests, 0 console errors, 0 HTTP errors on every segment of the reader journey (ruling R8 met on all screens visited).

## Compared with the control matrix
- The reader decides: which issuer and run to open (CT-043), which module and section (CT-044), which forecast case (CT-045: the card choice worked and the table, chart and comparison followed it), the Evidence module filter and tab (CT-046: one filter applied to all tabs, including after switching tab), whether to open a trace drawer (CT-047: one control per paragraph and figure on module pages and Forecast, but none on the five Overview figure cards; focus returned to the control on close), and downloads (CT-048: all links answered 200).
- Not the reader's to decide and not offered: the earlier run Changes compares with (CT-028, chosen at run start); which methods ran (CT-049). The reader cannot see which earlier run Changes would use when it is empty.

## Every place the reader had to guess what something meant

| Where | What the reader met | Finding |
| :--- | :--- | :--- |
| Left rail | Two icons, no words, no tooltip | J3-009 |
| Library card | "Cash $275m -$25m vs FY2023" has no better or worse word where the other four tiles do; "1 run" is a link to history | (this table only); J3-017 |
| Header | Switch "Show sources" that only rings the existing icons | J3-019 |
| Header | "Business description not in this run" in the prime spot of every page, for every tab | (this table only) |
| Overview | "Interest coverage 4.00x better" beside "cover is thin at 3.1x" | J3-010 |
| Overview | Headline band and findings with no named author; 13 modules listed, tab says 14 | J3-008 |
| Overview | Five figure cards cannot be traced | J3-003 |
| Overview and Calendar | "Wall", "Cost", "Rating", "· day", "Historical" after the as-of date | J3-011 |
| Overview limitations | "in the cp one a case", module codes spelled as words (canned proof text) | (this table only) |
| Module pages | "Confidence score 89 High", no scale | J3-015 |
| Downside | "0.1 (10%)" next to "0.10 (10%)"; "Compare with Control (unstressed)" over "Cost shock" | J3-016 |
| Forecast | "Units not recorded" on the headline numbers; "cash proxy"; PYTD, PF LTM, n.m.; CP-1 / CP-2G; "Python's arithmetic" | J3-005, J3-006 |
| Forecast | "Downside shock" card, "Downside case" table | J3-014 |
| Forecast then Back | Place not restored | J3-001 |
| Evidence | "Trace" shows downloads; "Gaps 0"; "Script checks 215" with 205 "not checked"; a raw "```json" fence | J3-007, J3-004, J3-012, J3-013 |
| Evidence and drawers | Every basis ends "not in inventory" or "no page" in the proof | J3-021 |
| Report tab | "Report" means history | J3-017 |
| Changes | Only the empty state; a second run to fill it fails with an exit code | J3-002 |
| Browser tab | Same title for every module and Evidence tab | J3-018 |

## What worked (so the next reader of this record does not re-check it)

- Library to Overview in one click; Overview to module in one click; the trace drawer opens on Enter or click, closes on Escape and returns focus to its control.
- Forecast case choice (Base case, Downside shock) updates the cards, charts, comparison table and the cash flow table together.
- Every download on Evidence (zip, 14 handoffs, three model files) and every "Open source file" answered 200.
- Missing values are shown as "n.a." or "Not supplied: <reason>", never as zero (Debt maturities FY2027, Revenue and EBITDA FY2024, Subordinated notes).
- No request left the machine on any screen read: 0 blocked requests, 0 failed requests, 0 console errors, 0 HTTP errors (ruling R8).

## Time to find the next step

Each step on the reader's path took one click and under 2 s of load. The two places where the next step was not obvious were: following a finding to its module (the drawer names the module but gives no link; about three actions: read the name, open Modules, pick the module) and getting back to the traced figure (J3-001).
