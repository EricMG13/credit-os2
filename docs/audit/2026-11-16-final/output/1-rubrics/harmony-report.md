# Stage 1-B: harmony matrix report

Agent 1-B. Brief: `docs/audit/2026-11-16-final/stages/1-rubrics.md`, "Agent B: harmony matrix". Outputs
in this folder: `content-matrix.csv` (332 rows, ids `CM-001` to `CM-332`), `control-matrix.csv`
(49 rows, ids `CT-001` to `CT-049`), `retired.md` (24 retired things) and this report. Nothing outside
this folder was changed. No row concerns Signal.

## What the matrices are

- `content-matrix.csv`: what a module's output contributes to a reader and where it must be drawn
  (page and component), or `not shown`. The 332 rows come from four sources:
  - 94 hand-written rows of rules that cross modules or belong to a report page (reader passages,
    trace control, module navigator, Overview, Changes, Forecast, Evidence, run start and activity,
    retired things);
  - 25 rows, one per registry entry, from the Module output map of `react-module-coverage.md`;
  - 91 rows, one per catalogue entry, from `react-visualisation-map.md` (every `-Vnn` row of the file);
  - 122 rows grouped from the 350 sections of `react-live-handoff-crosswalk.csv` (per module: findings
    groups by component, each drawing section, Evidence-bound sections, confidence inputs and hidden
    transport) plus 18 rows for blocks that later rulings added (CP-1 Net debt data and carrying-value
    basis, CP-6 Portfolio posture, CP-3 Recovery waterfall, CP-3C Funding gap, CP-8 registers and so on).
- `control-matrix.csv`: every decision in a run, who makes it, where, and what limits apply, including
  each of the eight pathways with its cap (Lite 15, Full 25, Deep 40, five purpose pathways 20) and the
  deactivated short snapshot, module selection, the portfolio workbook, approval, Submit, retry,
  resume, stop at cap, and the reader's own controls.

`section_id`: one id where a rule belongs to one surface; ids joined by `;` where the same expectation
applies to the connected report tab and its static library page (Overview and Changes: `C3;S2`;
Modules: `C3;S3`; Forecast: `C4;S5`; Evidence and the trace drawer: `C5;S4`; run start `C2;S6`; run
activity `C1;S6`; library home and history `C1;S2`). A `not shown` row names every section where stage 2
must check the item is absent. Rows about fields only the connected start page has (issuer name, case
kind, level, model, effort, turns, module selection, analyst name, workbook choice, ratings) carry
`C2` alone, because the static run start (`web/src/pages/run/start/`) draws only Documents, Purpose,
Confirm, a free-text "Anything the analysis should know" and Start. Cross-surface ownership follows
`sections.md`: a library part drawn in the connected report (for example `TraceControl`) is listed under
the page that draws it, with the owner's section named in the same cell.

## Precedence I applied where inputs disagree

1. The current user's instructions, then `AGENTS.md`.
2. Later dated rulings over earlier ones (amendments included), as the rulings themselves say.
3. Rulings over design documents where they differ on a point the ruling states; the design documents
   (`react-module-coverage.md`, `react-visualisation-map.md`, the crosswalk) over the 2026-11-12
   ruling where the design is newer and agrees with `AGENTS.md`. The coverage document says
   "Later owner rulings take precedence over differences recorded in the mock notes" and its date is
   15 November, so rulings dated 16 November outrank it.
4. Where I could not settle a conflict, the matrix carries the stricter reading (the less audit
   material on reading pages) and the conflict is below for the owner.

## Departures from the crosswalk, and why

The crosswalk covers 12 modules (350 sections) of the 15 November Caesars delivery at `fc010a7`.

- D-1. I did not copy its 350 rows. Sections that share a destination and component are one row per
  module, with the heading list in the `item` and `handoff_section` cells. Reason: one row per
  register table would give 125 rows saying the same thing; stage 2 checks the destination, not each
  heading.
- D-2. Rows for the 13 modules and entries the crosswalk does not hold (CP-1B, CP-1C, CP-1D, CP-2D,
  CP-2H, CP-3C, CP-3D, CP-4C, CP-8, CP-L10, CP-MODEL, CP-OS, Delivery) come from the coverage document,
  the visualisation map and the rulings. Reason: the crosswalk has none, but the Deep and purpose
  pathways run them.
- D-3. The crosswalk sends `Findings → Confidence inputs` to Evidence → Record. I kept that, and added a
  separate row (CM "Confidence score and band") for the score and band the 2026-11-12 ruling says the
  module page shows. See H-06.
- D-4. The crosswalk marks "Modules and selected Overview lead" for every Bottom line, Key findings,
  Contrary evidence and Limitations section. Ruling H5 is narrower: the Overview carries the lead
  module's Bottom line and Key findings, every other module's Bottom line, and every Limitations item
  once per run. The Overview rows follow H5. See H-22.
- D-5. The crosswalk lists registers in Evidence → Record for ten modules (CP-0, CP-1A, CP-DR, CP-2,
  CP-2A, CP-2E, CP-2G, CP-3, CP-5, CP-6) that `2026-11-13-appendix-and-routing-scope.md` later told those
  modules not to write. The grouped rows say so: absence of a cut register in a new-format run is not a
  defect. The same ruling's later restorations (CP-3 portfolio fit, CP-6A, T2G ESG tables) are rows.
- D-6. The crosswalk's `Next module`, `Request`, `Front matter` rows (Hidden transport) are kept as
  `not shown` on reading pages. I added a paired positive row for the governed download on Evidence.
- D-7. Static-app section ids are added to every row; the crosswalk and both design documents name
  only the connected report.
- D-8. The crosswalk's "Modules and Forecast run charts" is mapped to `C3;C4;S3;S5` (Modules page, and
  the Forecast tab's run charts), since `visuals/` is in C4 and the Modules page that draws them is in C3.

## Gaps and contradictions in the inputs

Each item names the inputs and what the matrix does about it. The owner may overrule any reading.

- H-01. Request, Next module and front matter. `2026-11-12-module-output-review-changes.md` decision 2
  moves them into an "Evidence & audit" fold at the end of the module page and keeps `## Sources`,
  `## Calculations` and `## Gaps` on the page. `AGENTS.md` (audit material only on Evidence and the trace
  drawer), the crosswalk (Hidden transport; Sources, Calculations, Gaps routed to Evidence) and the
  coverage document ("keep out of the reading path") say the opposite, and `2026-11-13-appendix-and-routing-scope.md`
  cuts the routing body. Matrix: `not shown` on Modules; download on Evidence.
- H-02. Source files. `2026-11-11-reader-and-issuer-report.md` decision 9: files are "listed only, not
  downloadable or viewable". The connected service serves `/connected/sources/<folder>/<sha256>/<name>`
  with a page query (`api-map.md`), `SourceFileLinks` is drawn in Evidence and the report, and decision 7
  says the inspector shows the "source file, page, quoted passage". Matrix: Evidence > Sources lists name,
  type, date and reading modules; a link that opens the cited page in the drawer is accepted; a plain
  download of a source file is not asserted either way. Owner to say whether a source file may be opened.
- H-03. Run activity. Decision 10 says it "shows only runs in progress and the queue"; the design and
  `screen-inventory.md` list run states finished, failed, capped, rejected, interrupted, and the API sends
  an `ended` list. Matrix: in-progress and queued runs, plus ended runs without a report; a finished run's
  internals are on Evidence > Record.
- H-04. Event calendar. Decision 12 removes it as a tab ("timeline appears in the modules that own the
  dates, nearest dates on Overview"). The visualisation map (DELIVERY-V02) says "Connected through Overview
  to the report's Calendar", and `Calendar.tsx` sits in C4. Matrix: no Calendar tab expected; if a routed
  Calendar exists it must be reached from Overview and keep each event's original output and row trace.
- H-05. Where the Model lives. Decision 3: "The delivered Model appears as an entry in Modules"; the
  coverage document puts CP-MODEL on Forecast and Evidence Trace; the static app has a separate
  `#/model/*` section (S5). The coverage document also says the original model download is unavailable
  and must be proven before exposing a download, while `ArtifactDownloads` offers `model.html`
  (`api-map.md`). Matrix: an entry in Modules and the grid on Forecast; the download only if served.
- H-06. Confidence. 2026-11-12 decision 9 says Python computes the score and band and "the module page
  shows it"; the crosswalk sends Confidence inputs to Evidence → Record. Matrix: score and band on the
  module page, inputs table on Evidence. `Confidence.tsx` is in C3, which supports that reading.
- H-07. "Delivery adds no analysis". `AGENTS.md` and the coverage document ("React never derives a new
  delta, total, ratio, FX conversion, ranking or eligibility result") against reader ruling Amendment
  2026-11-16 (a) to (d), which lets delivery draw an exact-decimal year-on-year difference and a
  better/worse mark from a fixed table. Matrix: the amendment is an allowed, bounded exception; nothing
  else is computed or judged (CM "Year-on-year difference and mark", "Unjudged figures").
- H-08. Navigation rail. Decision 12: the rail holds Start a run, Issuer library, Run activity and Search.
  The connected rail shows Library and Run only (`sections.md`), and the static app has Library, Model
  and Run groups. Not turned into a row; stage 2 should compare the rail against decision 12 and say
  which wins.
- H-09. Module codes on Evidence and the drawer. Amendment 2026-11-12 says no module code is shown in the
  library "Evidence, module pages ... the inspector and its Basis items"; Amendment 2026-11-16 says "the
  Evidence page and the trace drawer draw text as they did". Read together: chrome and labels use names;
  module-written text on Evidence and the drawer stays as stored. Rows follow that reading.
- H-10. CP-3 portfolio fit. T3C.1 to T3C.3 and T3C.5 to T3C.9 were restored (`2026-11-15-method-script-checks.md`)
  but no document says where they are drawn; the crosswalk row is "R2 portfolio facts or S3 input gap".
  Matrix row says Modules and flags the destination as inferred.
- H-11. Script checks. `ScriptChecks.tsx` (C5) and the module-validation ruling ("Script checks tab") exist,
  but the design and sections table describe five Evidence tabs (Summary, Trace, Sources, Gaps, Record).
  Row placed on Evidence; whether it is a sixth tab or part of Record is for stage 2 to report.
- H-12. Library listing. Amendment 2026-11-11 says replayed, synthetic and unverified runs stay unlisted;
  the synthetic proof server (`proof.serve`, R4 in the README) must list canned runs to be reviewable.
  Matrix states the live rule; stage 2 should expect synthetic runs only in synthetic mode.
- H-13. Adjusted-EBITDA leverage screening. The 2026-11-13/14 ruling describes the legacy library
  (`credit_os_chips`, "run card", "list view"). Whether the React library has the same filters is not
  stated. Row kept, marked as describing the legacy library.
- H-14. Overview key charts. H5.4 selects the charts "whose row in `docs/visualisations/catalogue.csv`
  names Overview in its `placement`". That file is not among my inputs, and the visualisation map names
  Overview only for CP-1A-V01 (watch items), CP-2-V01, CP-6-V02, CP-6-V04 and DELIVERY-V02. The matrix row
  for key charts therefore has no list of charts; stage 2 should take it from the catalogue.
- H-15. Retry and resume controls. The brief wants both in the control matrix. The page has no resume
  control: the Submit-failure message says "Retrying Submit run is safe", and resume is a launcher relaunch
  into the same folder (cap never rises; never-resend guard). Matrix says so; the owner may want a visible
  resume or retry action for a stopped run (this is a gap in the inputs, not a finding on the screens).
- H-16. The old "Over time" page (legacy library, M8 part 5) lists runs of the same pathway. The reader
  ruling makes the Report history the successor; nothing says Over time is retired in the React app.
  Not a row.
- H-17. Reader check. `2026-11-13-appendix-and-routing-scope.md` ("Not accepted") and
  `2026-11-13-full-and-lite-credit-assessments.md` ("Status") still require a reader check against the
  VMO2 reference; the 2026-11-13 amendment of the reader ruling and `AGENTS.md` retire it. Treated as
  retired (R-02).
- H-18. Evidence structure. Decision 9 and 10 describe four lists (sources, handoffs, calculation and Model
  downloads, Run record); the design documents and `screen-inventory.md` describe five tabs "by decision
  0003, ruling 8". Decision 0003 is not in the inputs; the five-tab structure is taken from the design
  documents and the baseline.
- H-19. Pathway count. The coverage document and DELIVERY-V01 say "the current seven active pathways",
  and CP-L10 "closed to new runs"; the rulings and `AGENTS.md` list eight (Lite, Full, Deep, five purpose),
  with the short snapshot deactivated. The matrix uses eight. The run-start ruling's body still says
  USD 20; its own amendment sets the per-pathway caps.
- H-20. Run start steps. `screen-inventory.md` and the static stepper have five steps (Documents, Purpose,
  Confirm, More context, Start); the connected stepper has four (Documents, Purpose, More context, Review
  and start). The static run start has no issuer, case kind, level, model or effort fields. Rows say which
  surface each belongs to.
- H-21. Crosswalk age. It describes the October Caesars delivery and the pre-11-11 headings. Section
  headings it records have since changed: reader passages replaced `### Reader summary`; `Net debt data`,
  `Post-balance-sheet adjustments`, `Portfolio posture` and the CP-3 recovery waterfall are newer; CP-3C and
  CP-2D are in the Full pathway only from 2026-11-15. Added as rows from the rulings.
- H-22. Overview. See D-4: the crosswalk and the coverage document would put more on Overview than H5
  allows. Matrix follows H5 plus the 2026-11-16 amendments.
- H-23. Method revision. `METHODOLOGY-REVIEW.md` records each module's method source and revision (Appendix
  table, 98 further files registered), and `AGENTS.md` says "Record the selected source revision". No input
  says the revision is shown to a reader. The only rule found is that a run whose methods have changed is
  labelled "Earlier methods". The matrix has no row asking for the revision on a page; the control matrix
  records it as fixed by ruling.
- H-24. Superseded text remains in older rulings (for example the run-start ruling's USD 20, decision 5's
  "code second", decision 11's VMO2 reading, decision 9's "listed only"). Matrix follows the latest ruling
  in each chain; `retired.md` lists the replaced wording.
- H-25. Static fixture. The static app reads `web/public/data.js`; no input says which of the 332 rows the
  fixture is expected to exercise. Stage 2 should check what the fixture holds, not require every row.
- H-26. Teams cards (`2026-11-16-teams-run-cards.md`) are a service behaviour. The audit's offline rule
  R8 reads them as a recorded exception; no screen rule follows, so the matrix carries them only as a
  control row and a `not shown` row for secrets.

## Checks made

`scratchpad/1-B/check.py` parses both CSVs with Python's `csv` module and tests: headers exactly as the
brief gives them, the field count of every row, unique row ids, no empty cell, and each `section_id`
component is one of C1 to C5, S1 to S6, X1. The result is recorded in the agent's return message.
The matrix text was generated by `scratchpad/1-B/build.py` from the module files beside it; the visualisation
map rows and the module output rows are parsed from the design files, so a row's wording is the document's.

Not verified: no screen was opened, and no page or component was compared with any row (that is stage 2).
Component names in rows are those the crosswalk, coverage document and sections table give; whether each
file draws what the row says was not read, apart from locating the run-start step of each control in
`StartRun.tsx` and the static `run/start/` files. The five rulings with large bodies were read in full
except `2026-11-13-cpdr-web-lookup.md` (read to line 140 and by search) and `2026-11-15-method-script-checks.md`
(read by headings and search; per-module check detail was not mapped to a screen); `METHODOLOGY-REVIEW.md`
was read for its selection sections and appendix table, not line by line. The live-test rulings
(`2026-11-11-cpdr-web-search-live-test`, `reader-format-live-test`, the 11-12 proof-run records,
`2026-11-13-tdg-*`, `2026-11-16-tdg-subset-copilot-sol`) were read and produce no screen rule.
`docs/visualisations/catalogue.csv`, `docs/design/component-map.md` and decision 0003 were not loaded
(not declared inputs), so the Overview key-chart list and some component names are unconfirmed. Module
lists of Relative Value, Covenant & Refinancing, Distressed & Restructuring and Portfolio Decision come from
`web/src/pages/connected/api.ts`, not from a ruling. Whether the static app's data fixture or the connected
service shows each `not shown` item absent was not tested. The rows for items 25 to 120 of the visualisation
map were taken from the file as written, including its gating words, without checking them against
`docs/visualisations/catalogue.csv`.
