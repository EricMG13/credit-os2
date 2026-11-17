# Batch inventory

All 159 canonical disposition=batch rows from origin/audit/final-coordination a26b9b5e; retained source and reports only, no runtime tests. Already-repaired means evidenced in a listed branch, not merged, reviewed anew or gated on final combined tree. Remaining is conservative and must be verified by the assigned worker before repair.

{'already_repaired': 34, 'remaining': 113, 'partial': 11, 'work_pc_only': 1}

All original records, merged records, probes and rule notes are embedded unchanged in `batch-inventory.json`. “Remaining” is conservative: absent an evidenced complete repair, a worker must verify the cause before changing code. No active batch ID is silently omitted.

## connected-calendar

C4-030, J3-011

- **C4-030** (remaining): An event whose name contains a file name is drawn as 'See Evidence', so the reader cannot tell which event it is. Strip only the file name ('Redemption notice') or draw the event with its trace control.
- **J3-011** (remaining): 'Dates to watch' and the Issuer calendar use unexplained words ('Wall', 'Cost', 'Rating', '· day', '· month') and show a 'Historical' event dated after the as-of date and a 'Scheduled' event on the as-of date. Spell out 'Maturity wall', drop the precision words or show them as a date format, and explain Historical against the as-of date.

## connected-charts

C4-020, C4-021, C4-027, R2-001, R2-002

- **C4-020** (remaining): Period series (leverage, interest cover, liquidity) are drawn as grouped columns; a line is used only when a value is negative. Choose the form from the descriptor's kind (trend) rather than from the sign of the values.
- **C4-021** (partial): An undrawable chart is drawn as 'Source table available...' plus the raw table, not the gap panel, and one covenant row with no threshold removes the bullet chart for every test. batch a gap panel fixed; bullet() all-or-nothing covenant threshold remains in visuals/charts.tsx.
- **C4-027** (remaining): A chart amount written with a typographic minus, parentheses, a space or no-break space as thousands separator, or a unit suffix removes the whole chart, while Downside reads the typographic minus. T13 numerical repair accepts decimal comma but readAmount still only ASCII-minus plain/grouped numbers, so typography forms remain unsupported.
- **R2-001** (partial): The predicate that holds source references back from table cells (visualData.ts containsReference) misses gap ids such as '(G12)', run codes such as '20261117-094923-01' and lower-case module codes. T13 expanded local predicate and T16 plain tables; global publishedReport.containsReference folding remains lead follow-up 7.
- **R2-002** (remaining): With the Basis and limitation column added (C3-029), a chart's Table form is still wider than its card (749 px against 604 at 1440, 316 at 390), so the reader scrolls sideways to reach the column. Covered by the batch's scroll cue for ChartTable (S3-021 with C4-015).

## connected-downside

J3-016

- **J3-016** (remaining): The Downside module formats the same quantity two ways ('EBITDA decline 0.1 (10%)' and 'FCF reaches zero 0.10 (10%)') and labels a drop-down 'Compare with Control (unstressed)' while it shows 'Cost shock'. Show 10% only, give the cash-interest increase a unit, and label the control 'Stress case to compare with the unstressed control'.

## connected-evidence

C5-013, C5-017, C5-018, C5-019, C5-022, C5-023, C5-024, C5-025, C5-033, C5-035, C5-037, C5-038, J3-012, J3-020, C5-028, C5-030, J5-010

- **C5-013** (remaining): Handoff, calculation and Model downloads are on Summary and Trace, and registers and confidence inputs are drawn per handoff on Trace, not on Record as the matrix places them. Original record suggests owner choice but no open OQ remains. Follow Evidence ruling; consider matrix alignment rather than moving controls.
- **C5-017** (remaining): The Summary count reads "1 designated handoffs" and gives only two counts. Pluralise correctly and add one line each for gaps, script checks and handoffs with an unlocated Basis.
- **C5-018** (remaining): Handoff names are links styled as plain semibold labels, so the reader cannot tell they open that handoff's evidence. Style them as the text links used elsewhere (underline or brand colour) and add a chevron.
- **C5-019** (remaining): In "Model and calculation files" the three download buttons stretch to the full card width. Lay the buttons out with `flex flex-wrap gap-3` (content width).
- **C5-022** (remaining): The Gaps table prints Markdown marks raw ("**bold**", backticks) and labels every row link "Open source" although it opens the handoff line, not a source. Draw the detail with richParts and call the link "Open handoff line".
- **C5-023** (partial): When the delivery has no zip, handoff links or model files, the page drops the buttons and the section without saying so. T23 ArtifactDownloads now states absent model/calculation files; absent ZIP/handoff-download explanations still missing.
- **C5-024** (remaining): Empty Gaps, Sources and Script checks are one plain sentence, and "Supplied but unnamed in handoffs" / "Use unrecorded" depart from the ruled wording. Use the kit empty state and rename the groups "Used by a module", "Supplied, not used" and "Not recorded as used".
- **C5-025** (remaining): Drawers and handoff views list "no page / the row cites no page or register" entries that are not tied to a row. Group chips by row and drop "cites no page" entries for tables that have no source column.
- **C5-033** (partial): Record does not show the delivery or library-admission state, or which outputs were retained rather than newly executed. batch a Record derives delivery event states; library admission/retained-vs-executed absent from API.
- **C5-035** (remaining): Record names a module with issues by its output label, which is the module code ("CP-2D · Handoff issues"). Print moduleName(output.module) and a plain format label ("earlier format").
- **C5-037** (remaining): A source with no document date or type is drawn without them and without a marker, so a missing date reads as nothing. Draw "Document date n.a." in the muted style and collapse the reader list when it names every module ("read by all 14 modules").
- **C5-038** (remaining): Evidence nests bordered boxes inside cards: a card per module holding a bordered card per check, a card holding bordered disclosures, a handoff card holding bordered Derivation and citation boxes. Use hairline dividers inside the card instead of boxes; keep one surface per card.
- **J3-012** (remaining): Evidence > Script checks shows a badge '215' and a list in which 205 items read 'not checked', with no sentence saying what a script check is or what 'not checked' means. Add a two-sentence explanation above the list and say what 'not checked' means (no script exists for the item, or the script was not run).
- **J3-020** (remaining): In Evidence > Summary > Handoffs, the name 'Forward credit model' is a link (to a trace entry) while every other module name in the list is plain text, with no visual difference. Make the row label plain text, or give every module row the same link.
- **C5-028** (remaining): Record: the run type comes from the service mode, the getRun error text is dropped, and an empty call cell reads "Empty in the handoff". Use run.execution first, show the error text, and pass an emptyLabel prop to PublishedTable.
- **C5-030** (remaining): "Annual model handoff" under "Model and calculation files" is byte-identical to the Financial foundation handoff. Original record asks whether duplicate annual.md asset wanted, not an established defect. Do not remove reachable download under R5; explain intentional duplicate or settle from existing ruling.
- **J5-010** (remaining): The limits the analyst accepted at Submit (no quotes, financials that are management claims) appear nowhere in the finished report, and Evidence > Gaps says 'This run lists no gaps.' none: whether the run record should list the limits accepted at Submit is the owner's, because delivery adds no analysis (AGENTS.md).

## connected-forecast

C4-006, C4-010, C4-012, C4-022, C4-024, C4-029, C4-035, C4-017

- **C4-006** (remaining): The 'base case basis' sentence prints two figures without a unit and the third as '$62.00m', and its trigger text is emitted by nothing in the repository. Either remove BasisNote and the zero-input regexes if no handoff produces them, or draw all three amounts with withUnit(...) and drop 'handoff'.
- **C4-010** (remaining): A case card whose cash proxy is missing reads 'Not available' with no reason, while the table beside it gives the reason and uses 'n.a.'. Show 'n.a.' and the cell's reason on the card.
- **C4-012** (remaining): A lone 'x' is drawn under the Leverage and Interest cover charts as their unit note. Label the unit 'x (times)' or show it in the axis title.
- **C4-022** (remaining): The 'Published model' selector names models 'Model 1 · candidate' using the builder's mode word. Name models by case and date.
- **C4-024** (remaining): The same stress case is named 'Downside shock' on the card, chart and comparison table and 'Downside case' in the grid header. Apply forecastCaseLabel to the grid's column group labels.
- **C4-029** (remaining): A case whose display name differs from its stored group name shows 'Case description not recorded.' although the model's note for it exists. Look the note up by the stored group name and show the display label separately.
- **C4-035** (remaining): The FY2027E cash proxy reads 172.46 on the case card, chart and Scenario comparison and 172 in the model grid directly below. Use the grid's published display on the card and comparison, or label the card 'to 2 decimals'.
- **C4-017** (remaining): The Forecast 'On this page' marker follows clicks only, so aria-current can name a section the reader has scrolled away from. Drop aria-current, or track the section in view.

## connected-report-shell

C1-014, C3-012, C3-015, C3-016, C3-021, C3-027, J1-009, J3-017, J3-019, J5-005

- **C1-014** (remaining): Every connected page except the report is titled 'Credit OS', so tabs, history entries and screen-reader page announcements cannot tell Library, Run activity and a run apart. Set the title per screen in the same way (Library — Credit OS, Run activity — Credit OS, <issuer> run — Credit OS).
- **C3-012** (remaining): When CP-8 delivered, the same handoff is drawn twice: on the Changes tab and again as a module 'Changes since the last run' in the Modules navigator, counted in the Modules tab badge. none: the owner decides whether CP-8 stays listed as a module; if not, filter it out of buildReportView.modules.
- **C3-015** (remaining): The disclosure that holds the lead's second Bottom line paragraph is always labelled 'Decision rationale', also when the lead is Fundamental credit or Earnings update. Label it by the lead ('Credit view, continued') or show the second paragraph; the wording and the default state are the owner's.
- **C3-016** (remaining): When the lead Bottom line holds a source reference, the navy band is lost: the heading 'Bottom line' is followed by the five figure tiles and then a link 'Read this passage in Evidence'. Draw `afterBottomLine` after the paragraph in the fallback card, and keep the band with a 'Read in Evidence' link as its text.
- **C3-021** (partial): The change cards are cards inside the 'Changes since the last run' card. Changes wrapper fixed by batch a; Overview fallback still nests figure tiles in Bottom line card (ReportContent.tsx).
- **C3-027** (remaining): The lead band on Overview is labelled 'Bottom line'; the ruling and the matrix name its kicker 'Credit view' ('Earnings view' on an Earnings Update). Pass overviewLabel='Credit view' for CP-6, CP-2 and CP-L10 leads (a wording choice the owner may confirm).
- **J1-009** (partial): The same 14 modules appear in three orders (run page, Modules navigator and Evidence filter, Overview), and the Overview's 'Bottom line by module' lists 13 while the navigation says Modules 14. T17 Overview moduleOrder follows run steps and excludes CP-8; navigator/evidence still Object.keys order and lead attribution/count need finish.
- **J3-017** (remaining): The tab named 'Report' opens a page titled 'Report history', the breadcrumb reads 'Library / Report' with 'Report' not a link, and the library card link '1 run' goes to the same page; a reader has to guess that 'Report' means the run history. Name the tab 'History' (or 'Runs') and make the breadcrumb 'Library / <issuer>'.
- **J3-019** (remaining): The header switch 'Show sources' only draws a ring around the existing trace icons; it shows no source, which is what its name promises. Rename to 'Highlight source icons' or make it show each item's basis line.
- **J5-005** (remaining): Changes says 'This is the first listed run for this issuer on this pathway' while Report history on the same issuer lists an earlier-dated run of the same pathway. First-run sentence is ruled text; retain exact text. Add surrounding timing explanation, if needed, rather than edit ruled sentence.

## connected-shell

C1-008, C1-018, C1-019, C1-022, C1-027, J1-008, J1-011, J1-012, J2-009, J2-010, J2-015, C1-028

- **C1-008** (remaining): The connected library card shows no delivery state and no bottom line, unlike the static IssuerCard it is meant to match, and shows the issuer's raw identifier as its subtitle. Show the run's delivery state badge and its lead bottom line on the card and replace the raw issuer key by the sector or country when the name already identifies the issuer.
- **C1-018** (remaining): On a Running card each module is a status badge whose word is the module's name, so a sighted reader sees the state only as a small glyph and colour; the state word exists for screen readers only. Show the module name as text and the state as the badge word (as ModuleSteps does), or put the state word in a visible title attribute-free label beside the glyph.
- **C1-019** (remaining): The Library search text, Sector and Pathway filters and the Cards/List choice are lost when the reader opens a report and comes back. Keep the query, filters and layout in the address (search params) so Back and a copied link restore them.
- **C1-022** (remaining): The Library filter bar labels its three fields in two styles: 'Search issuers' is a medium-weight primary-colour label above a wide input; 'Sector' and 'Pathway' are lighter secondary-colour labels above small selects. Use the one label style for all three fields.
- **C1-027** (remaining): Spend and cap are rounded through binary floating point, so an exact decimal ending in 5 can show one cent low ('3.105' draws USD 3.10). Round the decimal text itself (string arithmetic or a decimal helper) instead of a float.
- **J1-008** (remaining): Run activity counts and lists only runs that ended without a report; the finished run appears nowhere on it and the 'Ended' tile reads 1 after two runs ended. Label the tile 'Ended without a report' and show the library pointer whenever the page is shown.
- **J1-011** (remaining): The left rail holds two icon-only links with no visible text or tooltip; the play-circle icon reads as 'start' but opens Run activity. Show a label beside or under each icon, or a tooltip; name the second link 'Run activity'.
- **J1-012** (remaining): 'Run activity' names two different screens (the list at /runs and one run's progress page at /run/<id>), and the rail calls the list 'Run'. Name the report button 'Run progress' or 'This run's activity' and the rail link 'Run activity'.
- **J2-009** (remaining): A run that stopped offers no retry or resume; its one control, 'Start from this run', opens a new submission and the page does not say so, and the README calls the control something else. Label the control as the README does ('Start again from this run') and add one line saying it begins a new run with its own cap; whether to add a retry or resume control is the owner's decision.
- **J2-010** (remaining): A Failed run's Activity feed never records that the run stopped: its newest entry still reads 'Running, Run started.' Add a closing feed entry such as 'Run failed' with the reason.
- **J2-015** (remaining): A run that waits behind three running ones is listed under Waiting and shown as Queued with no reason, no limit and no position. Add one reason line to the Waiting row and the run page: 'Waiting: 3 runs are going (the limit). It starts when one ends.'
- **C1-028** (partial): The connected Run activity has no 'Not assessable' state for a blocked module, and offers 'Start from this run' beside a capped or interrupted run where the matrix records no resume control. T04 adds Not assessable for failed checker-stop module; done Blocked output may still read Finished. Keep Start from this run (OQ-06).

## connected-shell-loading

C1-032

- **C1-032** (remaining): Every C1 loading state is one line of grey text ('Loading reports…', 'Loading run activity…', 'Loading report…') under a header that already names a different page; none is a static skeleton in the shape of what arrives. Draw the LoadingCard / Skeleton shapes for the Library and run page and keep the page title stable while loading.

## connected-start

C2-009, C2-010, C2-012, C2-013, C2-015, C2-018, C2-020, C2-022, C2-023, J1-003, J1-006, J1-007, J1-016, J1-017, J1-018, J2-005, J2-006, J2-012, C2-027

- **C2-009** (remaining): Run form level offers Standard, which behaves exactly like Basic. Remove Standard from the select, or state what it adds.
- **C2-010** (remaining): Leave out and Put back on the review sheet discard the review and its approval and return to More context without saying so. Keep the sheet and recompute it in place, or add 'You will review again' under the buttons.
- **C2-012** (remaining): The 50 MB limit in the drop-zone hint is not checked when a file is chosen; a 52 MB file is uploaded in full and refused with a message that names no file. Pass maxSize (50 * 1024 * 1024) and an onSizeLimitExceed handler that names the file.
- **C2-013** (remaining): Choosing the same file or folder twice lists it twice, and the problem is reported only at Continue without naming the row. Skip a file already in the list (same name, size and modified time) and mark duplicates by name.
- **C2-015** (remaining): Your name is required but not marked, and its rule is checked only at Review run, after three steps. Check the name when leaving Documents and mark the field required.
- **C2-018** (remaining): 'I accept these 6 limits' counts every affected module, while the card shows one limit and an 'Also affects' list. Word it 'I accept this limit and its 5 consequences'.
- **C2-020** (remaining): With documents waiting to be carried the list says 'No documents yet.' while Continue and Inspect are enabled. Show the carried file names (from prior.files) as 'Will be copied' rows.
- **C2-022** (remaining): Choosing a different pathway silently clears the Requested modules selection. Say 'Module choice reset for the new pathway' (role=status).
- **C2-023** (remaining): A service sentence reads 'This pathway does not produce the What changed since the last Report report section.' and the same part of the report has two names on the sheet. Write 'This pathway does not produce the "What changed since the last Report" section.' or use one name.
- **J1-003** (remaining): The synthetic test lets the analyst choose, review, approve and submit seven of eight pathways, every one of which ends Failed with "launcher exited 2; see logs/<run>.log". State on the Purpose step and the review sheet that the synthetic test runs only the Full credit assessment (do not remove the cards, R5), and put the launcher's own sentence in the run's failure line instead of an exit code and a log path.
- **J1-006** (remaining): The review sheet calls the workbook 'unrecognised' under Documents read yet a Check on the same sheet recognises it as a portfolio workbook, and the Portfolio workbook row says 'Among the documents' instead of naming the chosen file. Show one status per file, name the chosen workbook in the Portfolio workbook row, and give the sample files a recognised kind or a note that they are test files.
- **J1-007** (remaining): A Check tells the analyst to 'choose it as the portfolio workbook under Issuer and dates', but no section has that name; the field is on the More context step. Say 'under Portfolio workbook on the More context step' and add a go-to-step button.
- **J1-016** (remaining): The word 'Purpose' names three things: the step (the pathway), the 'Run purpose' select (market view) and the review row 'Purpose', while 'Edit purpose and modules' edits the pathway. Rename the step 'Pathway' (or the select 'Market view').
- **J1-017** (remaining): Two lines on the review sheet cannot be understood by the analyst: 'Fixed below the Advanced form level.' and, under a full 14-module list, 'Report sections omitted · What changed since the last Report'. Say 'Changes: not compared (first run of this pathway)' in that place and 'Model and effort are set at the Advanced form level' for the other.
- **J1-018** (remaining): The README says the run's cap is shown 'beside each pathway and before Submit'; the pathway cards show no cap and the cap appears only in the Readiness card for the chosen pathway. Show each pathway's cap on its card, or correct the README to say the cap follows the choice in Readiness.
- **J2-005** (remaining): A second copy of the same document under another name (for example 'northbridge-filing (1).txt') is accepted as a separate document with no flag. Compare content hashes when files are added and mark a repeat 'Same content as <name>'.
- **J2-006** (remaining): A wrong file type is accepted for upload and described two different ways, and neither says why or which types are read. Name the readable types beside the drop zone and give each ignored row a reason ('Not a document type the run reads').
- **J2-012** (remaining): Typing an issuer that already has runs shows no notice on Start a run; the earlier runs are looked up only when the analyst presses 'Carry over from latest run'. Look the issuer up when the ID changes and show 'This issuer has N runs, the latest as of <date>' under the field.
- **C2-027** (remaining): Two fail-open notes mislead: console.warn says a launcher flag is 'not shown' when its text is shown, and the FieldProblem for a blank issuer name is reachable only for whitespace. Reword the warning; decide whether native or custom validation owns the issuer fields.

## design-docs

S2-012

- **S2-012** (remaining): The trace control is drawn at rest on pointer devices; the design system and CM-009 say it shows on hover and focus and is always shown only on touch. none (owner: amend the design system to match the build, or hide the icon at rest).

## proof-docs

J1-019

- **J1-019** (remaining): proof.serve refuses any root that already holds a file, so a restarted synthetic service cannot reopen earlier runs; the refusal is argparse usage text. Documented empty separate root is intentional safety contract. No approval to weaken it; record fresh-root requirement in prompt and close audit-assumption mismatch with evidence.

## shared-components

C4-011, X1-001, X1-003, X1-004, X1-020, J6-017

- **C4-011** (partial): The yield value in the Securities comparison chart wraps its unit onto a second line and keeps four decimals. b2 ComparisonChart wrap fixed; four-decimal/authored-digit complaint intentionally retained to preserve module text; inspect source/ruling before any rounding.
- **X1-001** (remaining): Text that the project wrote itself is set at 12 px and 10 px, under the 13 px floor. Very broad merged cluster; T33 changed only Timeline timing to text-small. Existing code still contains project-written text-xs across connected/static/chart components. Do not touch protected Signal.
- **X1-003** (remaining): Three different cards draw a headline figure: the kit MetricCard, the library MetricTile and the model MetricTile. Three cards remain. A shared-card refactor overlaps model/library/shared; can defer measured dedup to sweep only after visually aligning figure requirements.
- **X1-004** (remaining): A table cell draws n.a. only for null; an undefined or empty-string cell is drawn blank. Treat undefined like null in TableCell (or narrow the children type so undefined and '' fail the type check); keep a blank cell only where a column means 'no value' and say so.
- **X1-020** (remaining): Bar, stack and strip series are told apart by colour alone, and the first and third chart colours are almost the same grey. Give the legend and the bars a second cue (a pattern, or the series name drawn once over the first group), or separate the lightness of the first three chart tokens; the palette is the design system's, so the owner chooses.
- **J6-017** (remaining): After the Kit page is opened, a text-measurement span holding "FY21" stays in <body> at top -20000, outside the app root, and is part of the page text on every later page. Remove the measurement element when its chart unmounts, or render it inside the app root.

## shared-connected-format

C1-023, C3-011, C4-013

- **C1-023** (remaining): The same as-of date is written three ways on sibling screens: '2025-03-31' on the library card and run page, 'As of 31 March 2025' on the report header, and '17 Nov 2026, 07:57 UTC' stamps on Run activity. Use one long form for an as-of date everywhere a reader meets it.
- **C3-011** (remaining): A change card shows a positive difference without a sign ('0.80x') while the Overview tile for the same measure shows '+0.80x vs FY2023'. Use changeText for the card's difference.
- **C4-013** (remaining): The same money unit is written four ways across the C4 screens: 'USD millions', 'US$m', '$m' and '$62.00m'. Choose one rendering (the issuer's code plus 'm') and apply it through unitLabel/withUnit everywhere.

## static-library

S2-020, S3-012, S3-017, S3-018, S3-020, S3-025, S3-028, S3-037, S2-025, S3-032

- **S2-020** (remaining): Search, filters and the Cards/List choice are lost when the reader opens an issuer and presses Back. Keep the choices in a module-level store like Show sources, or in the hash query.
- **S3-012** (remaining): A module that could not be assessed or did not run shows its reason without a Bottom line. Draw the reason as the Bottom line band (the slice already holds the reason text).
- **S3-017** (remaining): Each limitation is clamped to three lines with an ellipsis behind a Show all control, although only the card is meant to collapse and nothing is to be cut. none
- **S3-018** (remaining): The Show all and Show less controls are 57 by 20 px, under the 24 px minimum target. Will disappear with S3-017 removal of per-item Show all; keep card-level disclosure.
- **S3-020** (remaining): The statement table has no card and mixes surfaces: white header and label column, canvas-coloured figure cells. Draw the statement in a TableCard-style card or drop the white fills.
- **S3-025** (remaining): The 'On this page' marker only changes when a section is chosen: after reading on or scrolling back it still names the old section. Update active from an IntersectionObserver, or drop aria-current.
- **S3-028** (remaining): The sticky navigator scrolls inside itself and does not bring the current module into view: at 1366x768 and 1280x720 the current entry can sit below the navigator's edge, and with 53 modules it is about 2,260 px down the list. On mount call scrollIntoView({block:'nearest'}) on the current entry inside the navigator.
- **S3-037** (remaining): Navigator entries show a module's state only as a small shape; the word (Delivered with gaps, Not assessable, Not run) is in the accessible name but not drawn. Draw the state word on entries whose state is not Delivered, or add a legend.
- **S2-025** (remaining): The Overview puts the headline figures and For and against between the bottom line and Key findings; D-11 fixes bottom line, key findings, then contrary evidence. none (owner: confirm the mock's order or the rubric's).
- **S3-032** (remaining): StatementBlock shadows its row index with the cell index inside the row's map. Rename the inner index.

## static-library-fixtures

J6-007, S2-008, S3-036, S4-001, S4-002, S4-003, S6-008

- **J6-007** (remaining): The Forecast tab reads "No forecast for this run" on a page whose module list shows a Forecast module as Delivered with a base case. Say which forecast the tab means (the cash flow model) and why it is absent, or rename the module so a delivered Forecast module and a missing Forecast tab are not both on screen.
- **S2-008** (remaining): The fixture the S2 pages are drawn from contradicts itself on the basis of net leverage (reported or adjusted), the period of the 4.9x comparison and the pathway of the run Changes compares with. Correct the fixture (qualifier 'Company-adjusted', 'since 30 June 2026', pathway of the earlier run, period and basis in each tile note).
- **S3-036** (remaining): The three facts of a facility share one trace, so the drawer for Margin, Maturity, Drawn or Commitment fee is headed and totalled with the facility's size. Give each fact its own trace (or name the row in the drawer heading) in delivery and the fixture.
- **S4-001** (remaining): The Summary tile 'Calculations 59 - Each one traceable to its inputs' counts traced items, not calculations: 58 of the 59 Trace rows open no derivation. Count the rows that carry a derivation for the tile (or relabel it 'Traced items') and drop 'Each one traceable to its inputs' unless every row opens a derivation; have read.ts refuse a tile that disagrees with the rows.
- **S4-002** (remaining): 57 of the 58 trace drawers list no source, file, page or quoted passage, while the matching Evidence Trace row reports 'Sources 1' to '6'. Deliver each trace's sources (files, pages, excerpts) in the derivation, or draw a stated gap in the drawer when a row's Sources count is above zero and none is delivered; have the reader refuse the disagreement.
- **S4-003** (remaining): 'Download handoffs', 'Download all' and every register 'Open' point at files that are not in the built app; clicking Download handoffs replaces the page with the browser's file-not-found page. Ship the sample downloads with the fixture build, or have the fixture deliver href null with the reason sentence so the disabled form is drawn; a missing file must not replace the app.
- **S6-008** (remaining): 'Open the library' and 'Open what finished' go to the Library home (#/), which does not hold the run's issuer, so the finished work cannot be reached. Point the links at the run's own library address (#/library/<issuer>/<run>/overview) and add that issuer to the library fixture, or check in the slice reader that the target exists.

## static-library-loading

S2-015

- **S2-015** (remaining): A run that is still loading draws a skeleton marked aria-busy with no name, no text and no live region, so a screen reader hears nothing. R16 drops announcements but expressly retains merged S3-019/S4-015 visual skeleton shapes.

## static-model

S5-009, S5-010, S5-011, S5-012, S5-016, S5-018, S5-019, S5-020, R3-001

- **S5-009** (partial): The Net debt walk table labels a row 'Free cash flow, FY26' with -2,540 while the Statements table shows free cash flow FY26E as +2,540: the same label carries opposite signs. table row labels fixed by b; chart steps/note still generic Cash flow FY26/FY27 (review RV-1).
- **S5-010** (remaining): The case choice is private state of each page: choosing Downside on Statements leaves Forecast on Base, and leaving a page resets it. Hold the chosen case in the run page group (a context beside ShowSources) so both pages and the return from a trace share it.
- **S5-011** (remaining): The case-choice line says 'every chart below follows it', but on Statements only the two bridges change and on Forecast only the interest cover line, the walk and a marker emphasis change. Say 'the forecast columns, the bridges and the cash flow walk follow the case; charts that show both cases or the balance sheet date do not' or mark the charts that follow.
- **S5-012** (remaining): Only 6 of the 15 chart tables carry a trace control per row; the Headroom, Segment margin, Exposure, Leverage and margin, holdings range, driver, Interest cover, EBITDA by case and cash flow walk tables carry none. Add an optional `trace` to the headroom, segment, limits, scatter, strip and path rows and draw it as the other tables do.
- **S5-016** (remaining): The empty Model index is one centred title: no icon, no explanatory sentence, no next action. Add the featured icon and one sentence to the empty state, as the library's empty states do.
- **S5-018** (remaining): One USD unit is written three ways: '$8,580m' on the Front page, 'USD millions' on Statements and charts, 'US dollars, millions' in the covers list; the matrix asks for 'US$m' for USD. Fix one form in delivery (US$m for USD, code plus m otherwise) and keep it across the tiles, headers and chart subtitles.
- **S5-019** (remaining): In the Bars view a negative figure's bar differs from a positive one only by colour: both are right-aligned from the same edge. Draw negative bars from a centre line or add a pattern.
- **S5-020** (remaining): The Forecast page's headings 'Two cases' and 'Cash flow in FY26' are written in the page, not taken from the data, so a walk for another year or a one-case run would carry a wrong heading. Draw the walk's subtitle period in the section heading.
- **R3-001** (remaining): A model run that delivers one case instead of two is refused whole by the Model reader ('expected two cases'), so none of its pages can be read. none: the owner decides whether a one-case model is shown with a stated gap or stays refused

## static-run

S6-022, S6-023, S6-024, S6-026, S6-031, S6-033, S6-037

- **S6-022** (partial): Spacing and sizes off the 4/8/12/16/20/24/32 ladder: gap-7 (28 px) between Confirm groups, 6 px and 2 px gaps, and fixed 38 px, 27 px, 18 px and 9 px values on the file icon and alert rings. b fixed Confirm/ModuleSteps/alert ring; Documents pictogram literals, Context gap-1.5, Start gap-0.5 remain.
- **S6-023** (partial): The Readiness panel nests three bordered surfaces and its item boxes have the same radius as the panel around them. visible nested boxes fixed by b; shared readiness extraction not done. Close visual finding after inspection or move measured duplication to sweep.
- **S6-024** (remaining): The same FileCheck02 featured icon is drawn on every purpose card; it says nothing the title does not. Drop the repeated icon, or use it only on the selected card.
- **S6-026** (remaining): On the shipped build every run page is the single line 'No run data in this library': no sentence says why or what to do, and the link to start a run is absent. Add one sentence ('This library holds no run records') and a link to the Library.
- **S6-031** (remaining): The saved example contradicts itself: the More context textarea is empty but the Start recap says 'One note added'; 'a library appears under TransDigm Group' when the library holds no such issuer; the intro line says 'Nothing is spent before the last step' on the page that follows it. Make the fixture consistent and hide the intro line once the run has started.
- **S6-033** (remaining): A 'Stop run' button is drawn (disabled) on every live run page, but no control-matrix row or ruling gives the analyst a Stop. Remove disabled Stop under accepted OQ-06; R5 already decided.
- **S6-037** (remaining): The connected Run page says '14 of 14 modules' while the list under 'Modules' holds 15 rows, the last being 'Report'. finishedFigure excludes Report for module tally but moduleSteps maps Report too; label delivery separately or name section accordingly.

## static-shell

J6-014, S1-008, S1-011, S1-019

- **J6-014** (remaining): "Page not found" has no link or button; every other error page offers a way back. Add "Back to the library" to the page.
- **S1-008** (remaining): #/kit/ shows "Page not found" while every other address ignores one trailing slash. Strip one trailing slash before the kit comparison (reuse the matcher's normalisation).
- **S1-011** (remaining): An address that is not a library page is drawn as Library: the rail marks Library current, and with the data missing every area shows the h1 "Library". Pass current={area} and the route's title in the missing-data branch; give the not-found page no current item.
- **S1-019** (remaining): The rail marks the current area only by a faint tint and an icon hue change, with no line or shape. Add a 2px bar or border to the current item, or use a tint of at least 3:1 against the rail.

## work-pc-teams

C2-025

- **C2-025** (work_pc_only): The analyst-name help says the name is 'Shown on Run activity and in Teams', which no matrix row accounts for and which is not true in a synthetic or unconfigured service. R15: no cloud edit, even help text; carry into work-PC prompt.

## Already repaired in branch code (must merge and gate together)

- **B0-002**: {'branch': 'origin/audit/lead-batch-a', 'file': 'AGENTS.md', 'observation': 'tests/known-failures.txt'}
- **C2-019**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/start/RowEditor.tsx', 'observation': 'At most maximum sentence'}
- **C3-017**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/report/Changes.tsx', 'observation': 'Overview/Evidence actions'}
- **C3-018**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/report/OverviewModules.tsx', 'observation': 'paragraph and trace flex row'}
- **C3-031**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/report/MacroSensitivity.tsx', 'observation': 'plain sentence for one alternative'}
- **C4-031**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/report/PortfolioBasis.tsx', 'observation': 'loading distinct from absent basis'}
- **C4-036**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/report/BreakPoints.tsx', 'observation': 'authored non-ranking order retained'}
- **C5-014**: {'branch': 'origin/audit/lead-batch-a', 'file': 'web/src/pages/connected/report/ScriptChecks.tsx', 'observation': 'register plus measure title and markup stripped'}
- **J1-015**: {'branch': 'origin/audit/repair-1', 'file': 'web/src/pages/connected/StartRun.tsx', 'observation': 'closed by binding L15/L15a: every startingContext as_of empty; other old complaints captured by C2-020/name policy'}
- **S1-007**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/fixtures/run.json', 'observation': 'Full cap 25; library Evidence caps fixed in b2'}
- **S1-010**: {'branch': 'origin/audit/repair-3', 'file': 'web/src/App.tsx', 'observation': 'useRouteChange restores main scroll by history entry'}
- **S1-015**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/Kit.tsx', 'observation': 'disallowEmptySelection'}
- **S2-017**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/library/parts/FilterBar.tsx', 'observation': 'visible search label'}
- **S2-022**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/library/parts/ChangeCard.tsx', 'observation': 'ReactNode import at top'}
- **S2-023**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/library/parts/ModuleItems.tsx', 'observation': 'chevrons only for linked rows'}
- **S3-014**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/fixtures/library.json', 'observation': 'data-module readiness checks and coverage'}
- **S3-026**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/library/parts/recordNav.ts', 'observation': 'block heading supplies missing nav label'}
- **S3-027**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/fixtures/library.json', 'observation': 'Basis prefix removed; Not plotted remains separately S3-004'}
- **S4-018**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/library/parts/JumpMenu.tsx', 'observation': 'textValue includes label and detail'}
- **S6-014**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/fixtures/run.json', 'observation': 'resume/start-again removed; Stop has separate S6-033'}
- **S6-016**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/run/activity/Summary.tsx', 'observation': 'Spend and cap caption'}
- **S6-017**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/fixtures/run.json', 'observation': 'false service/cap readiness items removed'}
- **S6-018**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/run/slice-read.ts', 'observation': 'CP guard includes alphabetic and lowercase'}
- **S6-025**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/run/start/Documents.tsx', 'observation': 'Up to 50 MB per file'}
- **S6-027**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/fixtures/run.json', 'observation': 'saved example explains inert editing'}
- **S6-029**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/run/start/Documents.tsx', 'observation': 'Remove file name; lead explicitly retained under R16'}
- **X1-002**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/application/empty-state/empty-state.tsx', 'observation': 'font-display'}
- **X1-009**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/application/tabs/tabs.tsx', 'observation': 'unselected hover text only'}
- **X1-016**: {'branch': 'origin/audit/lead-batch-b', 'file': 'web/src/pages/Kit7e.tsx', 'observation': 'Full cap USD 25'}
- **X1-023**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/chart/RangeStripChart.tsx', 'observation': 'case markers retained without range; Missing if none'}
- **X1-006**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/alert/Alert.tsx', 'observation': 'ReactNode children wrapped in div'}
- **X1-015**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/base/select/select.tsx', 'observation': 'wrap rather than truncate select/file labels'}
- **X1-017**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/status/sets.ts', 'observation': 'Not ready uses unique hollow square neutral'}
- **X1-026**: {'branch': 'origin/audit/lead-batch-c', 'file': 'web/src/components/chart/WaterfallChart.tsx', 'observation': 'three theme aliases replace local constants'}

Not verified: browser layout, command gates, final combined merge, and any newer remote pushes after this inventory; all classifications use retained source/report evidence only.

## Snapshot and limitations

- No browser, probe, unit-test or gate command was run by this read-only inventory worker; evidence is static source inspection and retained reports.
- All branch refs are local snapshots with exact hashes recorded; a later remote push can close or alter a listed item.
- 34 already_repaired rows have branch code/report evidence. Their expected values and visual layouts were not independently re-executed here; run combined gates after merge.
- 113 remaining rows are deliberately conservative. Some may close through existing ruled contracts, matrix/documentation amendments or another repair. No absence of a report mention is treated as conclusive runtime proof.
- 11 partial rows retain their unresolved scope. C4-011 authored decimal digits must stay exact; do not round module-authored text merely to close a style complaint.
- C2-025 is work-PC-only under R15. No cloud Teams code, help-text, card or webhook check is authorized by this inventory.
- No entire batch row is rejected under R14/R16: these dispositions already absorbed most exclusions. S2-015 retains merged visual skeleton issues; C1-014 retains page titles; their assistive-only parts are excluded.
- Some file evidence paths contain historical line numbers. Needed_files preserves the record evidence, not a precise final edit authorization. Missing needed_files means the worker must locate the live caller.
- Families are file neighborhoods, not guaranteed simultaneous safe edit sets. shared-connected-format and connected-charts share publishedReport.ts; shell-loading and report-shell share ReportLibrary.tsx; static-library-fixtures and model/run tasks share fixture JSON. X1-001 typography and X1-003 card refactoring cross multiple families and should run last or have explicit file partitioning.
- build_register.py discards closed_by because it rebuilds from finding sources and rulings. Apply final closure annotations after rebuilding or add an explicit closure input; do not lose evidence inadvertently.

- final-coordination: 0198f36660c0049ea5bd0891b42ae3033978e35d
- final-repairs: 3010c9c8f21a317cdbb299b6453a0b73d74209c3
- repair-1: 301c7ded8e891f4fb935e197b52c0a093b1a3c34
- repair-2: f9453f27d0503b8036acd7437fa884d465a16234
- repair-3: 733407aa105e7f1ab854aa454952ab3aa3b41ffd
- lead-batch-a: efd45ff00499777744688629eedbb8979c0c88de
- lead-batch-b: 72ac503f7e8880c48a232bcfe1910c0ba79ab39c
- lead-batch-c: f1409335411041c80c1c0f12ae24cf0bd05e6b9d

Not verified: runtime behavior, layout, tests and gates; only the retained source/report evidence above was inspected.
