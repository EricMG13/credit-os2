# Register (stage 4)

523 findings were merged: 376 from stage 2, 99 from stage 3 and 7 carried from stage 0. 115 were merged into another finding with the same cause, which leaves 408 findings. Counts below are of those 408, after re-grading.

Each finding's full record is in `register.jsonl` (fields of the schema, plus `verified`, `original_severity`, `disposition`, `task`, `merged_ids`, `merged_into`, `owner_question` and `ruling_note`).

## Counts

| Severity | repair | batch | sweep | owner | deferred | parked | rejected | Total |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| High | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 |
| Medium | 76 | 0 | 0 | 0 | 1 | 2 | 32 | 111 |
| Low | 0 | 146 | 0 | 0 | 2 | 19 | 39 | 206 |
| Info | 3 | 17 | 17 | 0 | 3 | 10 | 35 | 85 |
| Total | 85 | 163 | 17 | 0 | 6 | 31 | 106 | 408 |

| Section | High | Medium | Low | Info |
| :--- | ---: | ---: | ---: | ---: |
| C1 | 1 | 12 | 16 | 14 |
| C2 | 0 | 9 | 13 | 5 |
| C3 | 0 | 12 | 14 | 1 |
| C4 | 3 | 8 | 22 | 4 |
| C5 | 0 | 12 | 19 | 7 |
| J1 | 1 | 2 | 11 | 1 |
| J2 | 0 | 4 | 6 | 0 |
| J3 | 0 | 1 | 6 | 2 |
| J4 | 0 | 1 | 3 | 2 |
| J5 | 0 | 3 | 1 | 3 |
| J6 | 0 | 1 | 2 | 1 |
| S1 | 1 | 5 | 11 | 3 |
| S2 | 0 | 5 | 13 | 9 |
| S3 | 0 | 8 | 19 | 5 |
| S4 | 0 | 8 | 7 | 3 |
| S5 | 0 | 6 | 12 | 8 |
| S6 | 0 | 10 | 18 | 5 |
| X1 | 0 | 4 | 13 | 12 |

Verification of High and Medium findings: confirmed 130, not a defect 4, not verified 2.

## Findings

High first. `Merged` lists the ids with the same cause.

| Id | Sev | Section | Finding | Disposition | Task | Merged | Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C1-001 | High | C1 | GET /connected/snapshot sends the server's absolute workspace path to the browser (catalogue.workspace). | repair | T01 | C5-001 | confirmed |
| C4-028 | High (was Medium) | C4 | A published value written with a decimal comma ('3,75') is read as 375 and its bar is drawn at 375 beside 2.80. | repair | T13 |  | confirmed |
| J1-001 | High | J1 | Leaving a module out, which the review sheet offers as the way past a Will refuse limit, ends with Submit refused as "unknown module CP-MODEL" and no run start… | repair | T02 |  | confirmed |
| R2-003 | High | C4 | The debt stack reads each cell on its own, so a column mixing '3,75' with '2,800' draws 3,75 as 375. | repair | T19 |  | confirmed |
| R4-006 | High | C4 | Forecast companion filename overrides a known conflicting retained source hash. | repair | T18 |  | confirmed |
| S1-001 | High | S1 | The library's "Start a run" button opens Run activity (a saved running example), not the run start page. | repair | T26 | J6-005 | confirmed |
| B0-003 | Medium | C2 | Following the documented manual synthetic run in docs/react-workflow.md ends Failed at Legal & covenants; the run completes only if the credit agreement is als… | repair | T12 | J1-014 | confirmed |
| C1-002 | Medium | C1 | The empty Library is a bare 'No reports yet' card with no icon, no explanation and no next step, drawn under filter and layout controls that have nothing to ac… | repair | T05 |  | confirmed |
| C1-003 | Medium | C1 | Run activity's Waiting and Ended tables are cut off inside overflow-hidden panels: the Pathway column is clipped at 1280 to 1440 px and Ended, State and Reason… | repair | T05 |  | confirmed |
| C1-004 | Medium | C1 | Run and report error states are one plain red line with no icon or action, and say the wrong thing: an unknown report reads 'could not be loaded' and an unknow… | repair | T04 |  | confirmed |
| C1-005 | Medium | C1 | A finished run with no published report polls every 2 seconds for ever and keeps saying 'Waiting for the report to become available…'. | repair | T04 |  | confirmed |
| C1-007 | Medium | C1 | Report history rows omit the modules run and each run's status, and no row can carry 'Earlier format' or 'Earlier methods'. | repair | T17 |  | confirmed |
| C1-013 | Medium | C1 | Run reasons are drawn exactly as the scheduler wrote them: launcher exit codes and log paths, and (from the library's refusals) module codes such as 'CP-1' and… | repair | T03 |  | confirmed |
| C1-024 | Medium | C1 | The run page removes and re-inserts its red error alert on every 2-second poll, so a screen reader announces the same error again every cycle and the line flic… | repair | T04 |  | confirmed |
| C1-031 | Medium | C1 | When one poll of Run activity fails, every run and the counts disappear behind a neutral empty-state panel with a magnifier icon, no alert role and no tone; th… | repair | T05 |  | confirmed |
| C2-002 | Medium | C2 | Moving between steps adds no browser history entry, so Back, Reload or the Library link silently discards every document, answer and approval typed so far. | repair | T07 | J2-001 | confirmed |
| C2-003 | Medium | C2 | Start from an earlier run says it copies the earlier answers but drops which documents are the agreement and the portfolio workbook, so the review opens with '… | repair | T07 |  | confirmed |
| C2-004 | Medium | C2 | When the run options cannot be loaded the page shows the raw service text in a plain box with no action beneath an intro that still invites the analyst to star… | repair | T08 |  | confirmed |
| C2-006 | Medium | C2 | A failed Submit or a refused request reaches the analyst as the browser's raw 'Failed to fetch' or a lowercase service fragment run into the next sentence. | repair | T08 |  | confirmed |
| C2-007 | Medium | C2 | The decisions that block Submit sit at the bottom of the review sheet, after about 2,700 px (3,600 px at 390 px) of echoed inputs and 20 'Not given' rows. | repair | T11 |  | confirmed |
| C2-008 | Medium | C2 | The page leaves a server-side draft behind whenever the form is abandoned, and after 50 drafts every new form fails with 'too many unfinished submissions; try… | repair | T10 |  | confirmed |
| C3-001 | Medium | C3 | The five headline figure tiles on Overview (Net leverage, Gross leverage, Interest coverage, Revenue, Cash) have no trace control, so a headline number cannot… | repair | T15 | J3-003, J4-001 | confirmed |
| C3-002 | Medium | C3 | After the reader chooses another module in the Modules navigator (link by keyboard, or the Module select at 390 px), keyboard focus drops to <body>. | repair | T14 | C3-003, C4-034, J3-001 | confirmed |
| C3-005 | Medium | C3 | 'On this page' lists 'Key findings' on Financial foundation, whose handoff wrote no Key findings (checked on all 14 modules: it is the only one); the entry scr… | repair | T14 |  | confirmed |
| C3-006 | Medium | C3 | The trace drawer prints a module code ('CP-0') in a sentence the service wrote: 'the Basis file is not in the CP-0 inventory'. | repair | T16 | C5-026 | confirmed |
| C3-007 | Medium | C3 | Report error states give the reader no cause and no next step: a failed or unknown run reads 'The published report could not be loaded.', a network failure pri… | repair | T17 | J2-016, J5-007 | confirmed |
| C3-008 | Medium | C3 | A run in the earlier format or with changed methods is not labelled 'Earlier format' or 'Earlier methods' on Overview or Changes; neither string exists in the… | repair | T17 |  | confirmed |
| C3-020 | Medium (was Low) | C3 | A headline figure the module could not supply (Adjusted EBITDA FY2024, 'Not supplied') gets no tile and no stated gap; the reader cannot tell that it is missin… | repair | T15 | C1-009, J4-007 | confirmed |
| C3-024 | Medium | C3 | Overview draws no key charts and no 'Chart index' link, although the run holds data for catalogue rows that name Overview (Source readiness map, Credit-risk tr… | repair | T17 |  | confirmed |
| C3-026 | Medium | C3 | When CP-8 delivered, Overview lists CP-8's Bottom line under 'Bottom line by module' and its limitations under 'Limitations', although CP-8's findings belong o… | repair | T17 |  | confirmed |
| C3-028 | Medium | C3 | On a module page the charts, event lanes and maps come between the Bottom line and Key findings, pushing Key findings, Contrary evidence and Limitations 1,200… | repair (OQ-02) | T14 |  | confirmed |
| C3-029 | Medium | C3 | A chart's Table form omits the 'Basis and limitation' column, so a row's limitation (for example 'gross debt includes finance leases') is visible only inside t… | repair | T13 | C4-005 | confirmed |
| C4-001 | Medium | C4 | The Forecast tab prints module codes, the words 'Python' and 'handoff', and a raw code-bearing gap reason in reader text. | repair | T16 | J3-005, J4-009 | confirmed |
| C4-002 | Medium | C4 | A gap ledger of ten near-identical limitation bullets is drawn on the Forecast findings page, and the same qualifications are drawn twice more. | repair | T18 |  | confirmed |
| C4-003 | Medium | C4 | Every trace control on the Forecast model opens the same drawer, titled 'Forecast inputs (machine-readable)', whose statement is generic. | repair | T18 | C5-004, R4-008, R4-009, R4-010 | confirmed |
| C4-004 | Medium | C4 | The Debt stack, drawn when one facility has no balance, is a bar of coloured segments with no key that ties a colour to a facility. | repair | T19 |  | confirmed |
| C4-007 | Medium | C4 | One malformed date in a module's event table hides every event of that table, and the page says 'No dated events were published for this run' above a card sayi… | repair | T20 |  | confirmed |
| C4-025 | Medium | C4 | When the published model cannot be matched to exactly one forward-credit handoff, every trace control on the Forecast model disappears and the page does not sa… | repair | T18 |  | confirmed |
| C4-026 | Medium | C4 | One long unbroken word in a model note, limitation, case description or scenario anchor widens the whole report page. | repair | T18 |  | confirmed |
| C5-003 | Medium | C5 | The trace drawer of the Confidence score lists 14 identical "no page" entries instead of the confidence inputs it is computed from. | repair | T22 | J4-005, J3-015, R4-013 | confirmed |
| C5-005 | Medium | C5 | The page-level "Show sources" switch changes state on every Evidence tab but there is nothing for it to reveal. | repair (OQ-03) | T38 | S4-019 | confirmed |
| C5-008 | Medium | C5 | Every handoff evidence view draws the handoff's title as a bare module-code heading ("CP-1" ... "CP-DR"), next to the module name in the card title. | repair | T16 |  | confirmed |
| C5-009 | Medium | C5 | The handoff evidence view looks like rendered Markdown: literal "- " bullets with 64-hex hashes in the body font, handoff section names as headings, and (on a… | repair | T21 | J3-013 | confirmed |
| C5-010 | Medium | C5 | The Gaps ledger is not grouped or ordered by severity. | repair | T21 |  | confirmed |
| C5-011 | Medium | C5 | Evidence > Sources opens the supplied source files (the workbook downloads), although ruling decision 9 says files are "listed only, not downloadable or viewab… | repair (OQ-04) | T21 |  | confirmed |
| C5-012 | Medium | C5 | "Model and calculation files" shows its heading and nothing else while the listing loads, and stays blank for good if the reply has no files array. | repair | T23 |  | confirmed |
| J1-002 | Medium | J1 | An analyst who accepts the review sheet's Will refuse limit gets a Failed run with the reason "stopped: checker", four of 14 modules finished and no report, no… | repair | T12 |  | confirmed |
| J1-004 | Medium | J1 | For Earnings Update, Current period and Prior period are required, but the step says "Optional", neither field is marked, and the only signal is the browser's… | repair | T08 |  | confirmed |
| J2-002 | Medium | J2 | Start a run opens with an example issuer already typed into the required Issuer name and Issuer ID fields, and today's date as the case date. | repair | T07 |  | confirmed |
| J2-003 | Medium | J2 | An unreadable document is reported as a raw Python decoder error for one file only, and no row is marked, so the analyst cannot tell which of several files is… | repair | T09 | C2-011, J2-007 | confirmed |
| J2-013 | Medium | J2 | When the Submit request fails, the dialog closes and the message is drawn 2,900 px above the Submit button, so the analyst sees nothing change and cannot tell… | repair | T08 |  | confirmed |
| J3-007 | Medium | J3 | Evidence > Trace with no item chosen shows the same 15 handoff download buttons as Summary and no line telling the reader how to pick something to trace. | repair | T21 | C5-036 | confirmed |
| J4-003 | Medium | J4 | The Forecast page's Forecast assumptions section shows 'Observed \| Not supplied: nothing to report', and the page never states the downside shock or the drive… | repair | T18 | C4-019, R4-007 | confirmed |
| J5-001 | Medium | J5 | On a failed run the refused module is labelled Interrupted while the run reads Failed, three 'Module draft rejected.' events give no reason, and nothing on the… | repair | T04 |  | confirmed |
| J5-004 | Medium | J5 | The Issuer ID built from the name is cut at 40 characters, so two different issuers with long names that share their first 40 characters get one ID; the Librar… | repair | T09 | C2-014 | confirmed |
| R1-003 | Medium | C1 | The Teams cards count CP-MODEL as a module, so a run that finished every requested module reads '13/14 modules'; T02 makes such runs reachable. | repair | T02 |  | confirmed |
| R4-001 | Medium | C5 | The trace drawer drops every earlier cited page range when one source file is cited more than once. | repair | T42 |  | confirmed |
| R4-011 | Medium | C1 | Runtime metadata compares the scheduler folder ID to the distinct analytical run ID and drops ordinary module metadata. | repair | T43 |  | confirmed |
| R4-012 | Medium | C4 | Shared reference detector withholds ordinary Forecast prose and parenthesized mathematical labels. | repair | T44 |  | confirmed |
| R4-015 | Medium | C5 | A synthetic run Record changes to Live provider after metadata loads. | repair | T45 |  | confirmed |
| R4-017 | Medium | X1 | Fidelity capture evaluates an old proof dependency before validating its guard API. | repair | T46 |  | confirmed |
| R4-018 | Medium | X1 | Fidelity Node/API snapshot reads can follow redirects outside the browser guard. | repair | T46 |  | confirmed |
| S1-002 | Medium | S1 | Every page has the title "Credit OS", and moving between pages through the rail moves no focus and announces nothing. | repair | T27 | S2-003, S2-013, S3-001, S4-004, S4-020, S5-017, J6-011, J6-002, J6-003 | confirmed |
| S1-004 | Medium | S1 | The component kit, a developer page with sample figures, buttons that do nothing and looping animations, is offered to readers as a rail item of the static app. | repair (OQ-05) | T25 | X1-018 | confirmed |
| S2-001 | Medium | S2 | An issuer's history page draws none of its runs when the issuer has no readable report, although its subtitle counts them and its home card describes a finishe… | repair | T32 | J6-006 | confirmed |
| S2-002 | Medium | S2 | On the shipped build every S2 page says only 'This data file holds no library pages': no designed empty state, no explanation a reader can use and no way forwa… | repair | T31 | S3-008, S4-013, J6-013 | confirmed |
| S2-006 | Medium | S2 | The Overview's 'Dates to watch' entries carry no trace control, although every other paragraph, row and figure on the page has one. | repair | T33 |  | confirmed |
| S2-007 | Medium | S2 | Switching the Changes page from Cards to Table drops each change's kind, direction words, cause and effect; only the measure and the two values remain. | repair | T34 |  | confirmed |
| S3-005 | Medium | S3 | Limitations is drawn last, after every record block, although the matrix and rubric put it straight after the contrary evidence and change-of-view passages. | repair | T37 |  | confirmed |
| S3-006 | Medium | S3 | The module navigator has no search at the top and no labelled picker on narrow screens: at 390 px a flat list of every module pushes the module's name 1,012 px… | repair | T37 | C3-025 | confirmed |
| S3-007 | Medium | S3 | Ten of the thirteen fixture modules draw their bottom line, key finding and limitation with no trace control, and Capital structure's statement table and four… | repair | T35 |  | confirmed |
| S3-011 | Medium | S3 | The reason the Forecast tab is unavailable ('No forecast for this run') is 12 px grey at 2.19:1, helper text in the disabled colour. | repair | T38 |  | confirmed |
| S4-006 | Medium | S4 | The module filter is drawn on three of the five Evidence tabs and resets to 'All' on every tab change. | repair (OQ-10) | T39 |  | confirmed |
| S4-008 | Medium | S4 | The Model calls table on Record shows a 'Code' column of module codes (CP-1A, CP-2C, CP-3B, CP-2E) beside each module's name. | repair (OQ-10) | T39 |  | confirmed |
| S4-009 | Medium | S4 | Record's Model calls table lists four of thirteen modules but its Total row (41 calls, 6 retries, USD 11.40) does not say so; Module timings lists six of thirt… | repair | T39 |  | confirmed |
| S5-001 | Medium | S5 | A run with no forecast cannot be shown at all: the reader rejects the whole run, so the Forecast page has no 'no forecast was published' state and the run's Fr… | repair | T38 |  | confirmed |
| S5-002 | Medium | S5 | An unreadable run is explained to the reader with the reader's raw field path ('runs[1].front.headline: missing') and listed by its raw issuer slug and run id. | repair | T40 |  | confirmed |
| S5-004 | Medium | S5 | A trace control on the Model pages is a plain link that leaves the Model for the Evidence page: it opens no drawer, and Back returns a reset page (case choice,… | repair (OQ-10) | T40 |  | confirmed |
| S6-003 | Medium | S6 | Only 7 of 17 populated static run pages say they are a saved example; the Start step offers a 'Start a paid run?' dialog and the next page says 'Run started' a… | repair (OQ-01) | T25 | J6-010 | confirmed |
| S6-007 | Medium | S6 | The 'Runs' breadcrumb opens #/run, which draws the one run the slice calls current (the running one), not a list of runs; no static page lists runs in progress… | repair | T41 |  | confirmed |
| X1-019 | Medium | X1 | In a group of three or more series, the value label of the middle series is cut off at the top of the drawing when its bar reaches the top tick. | repair | T19 |  | confirmed |
| X1-024 | Medium | X1 | One debt part with a zero balance makes every Model page of that run unreadable in the static app. | repair | T19 |  | confirmed |
| R1-012 | Medium | C1 | When the checker refuses a module's draft and the run stops, no page can say why (for example that no executed agreement was chosen): the engine records only '… | deferred (OQ-15) |  |  | not verified |
| J2-011 | Medium | J2 | Two runs of the same issuer, date and pathway started together are both accepted and finish, and the library then lists two identical history rows, each called… | parked |  |  | confirmed |
| S3-009 | Medium | S3 | One malformed record makes every library page unreadable and prints the reader's internal data path in the page body. | parked |  | S4-014 | confirmed |
| C1-006 | Medium | C1 | Run activity changes run state on screen every 5 seconds but exposes no live region, so a screen-reader user is never told that a run started, ended, failed or… | rejected |  |  | confirmed |
| C2-001 | Medium | C2 | At 390 px a file name or issuer name with no spaces widens the whole review sheet, clipping every Edit button, the file name and the Submit button. | rejected |  |  | confirmed |
| C2-005 | Medium | C2 | Pressing Carry over from latest run leaves keyboard focus on the page body and announces nothing, because the button is replaced by 'This is a different issuer… | rejected |  |  | confirmed |
| C3-004 | Medium | C3 | Below 1001 px the Module select navigates on every ArrowDown, so a keyboard user cannot browse the options without changing page each time. | rejected |  | C5-006 | confirmed |
| C5-002 | Medium | C5 | At 390 px the Gaps ledger and the Comparison measures table push every card on the tab past the window edge, and the report area scrolls sideways. | rejected |  |  | confirmed |
| C5-007 | Medium | C5 | Handoff tables with fewer than five columns scroll sideways at 390 px but cannot be reached or scrolled with the keyboard. | rejected |  | J5-002 | confirmed |
| C5-034 | Medium | C5 | After "Open in Evidence" is activated from a drawer, keyboard focus is on the document body, not on the Evidence content. | rejected |  |  | confirmed |
| J5-003 | Medium | J5 | With the keyboard only, every change of page (Start a run, Start synthetic run, Open report, Open in Evidence, Back) leaves focus on the page body, so the next… | rejected |  |  | confirmed |
| J6-009 | Medium | J6 | Following every link from the Library home reaches 79 screens, but no link on any of them leads to the Model Forecast page, any Run start page, ten of the elev… | rejected |  |  | confirmed |
| R3-002 | Medium | S5 | The static Model's trace drawer (S5-004's repair) shows only the item name, a fixed sentence and Open in Evidence, because the model slice carries only an addr… | rejected (OQ-01) |  |  | not verified |
| S1-003 | Medium | S1 | On a phone-width screen the visible label under each rail icon is not part of the link, so tapping it does nothing, and the label is read a second time as plai… | rejected |  |  | confirmed |
| S1-005 | Medium | S1 | A tooltip that keyboard focus opens is closed again by the scroll that the same focus causes, so the text of a trigger below the fold is not shown on first arr… | rejected |  |  | confirmed |
| S1-006 | Medium | S1 | Pressing "Clear filters" in the no-match state drops focus to the page body, and the control is absent from the stage 0 inventory. | rejected |  | S2-014 | confirmed |
| S2-005 | Medium | S2 | A point's qualifier longer than a short label leaves its tile and widens the page at narrow widths, pushing the point's sentence out of view. | rejected |  |  | confirmed |
| S3-002 | Medium | S3 | The trace control on the Navy bottom-line band takes the Ultramarine focus ring, 2.4:1 against Navy, so keyboard focus is nearly invisible there. | rejected |  |  | confirmed |
| S3-003 | Medium | S3 | At 480 px and below the Limitations header overflows its card, the page scrolls sideways, and reaching Collapse limitations by keyboard shifts the whole page 1… | rejected |  | S2-004 | confirmed |
| S3-004 | Medium | S3 | The six chart kinds are drawn as tables only: no chart, no Chart or Table toggle, and the code comment that justifies it ('the kit has no such chart') is out o… | rejected (OQ-01) |  |  | confirmed |
| S4-005 | Medium | S4 | Activating 'Show all items' or 'Show all files' in the empty state sends focus to the document body. | rejected |  |  | confirmed |
| S4-007 | Medium | S4 | At 390 px the Gaps, Trace and Registers tables scroll sideways inside their card with no cue: 'Effect on the view' and 'Shown as' are off screen, and 'Recovery… | rejected |  |  | confirmed |
| S4-010 | Medium | S4 | Sources lists name, type, size, state and readers but no document date, and does not separate files supplied but not used from files read. | rejected (OQ-01) |  |  | confirmed |
| S4-011 | Medium | S4 | Record draws no register tables, no confidence-inputs table, no delivery or publication state, no calculation JSON download and no per-module handoff download;… | rejected (OQ-01) |  |  | confirmed |
| S4-012 | Medium | S4 | Evidence shows nothing of the comparison with an earlier run: no reason for 'not compared', no regression or recheck register, no comparison measures, no CP-8… | rejected (OQ-01) |  |  | confirmed |
| S5-005 | Medium | S5 | At 390 px the Statements table cannot be read: the sticky label column takes 224 of the table's 260 px, leaving a 36 px window for the figures. | rejected |  |  | confirmed |
| S5-008 | Medium | S5 | Metric definitions and the reasons behind n.a. and Withheld cells appear only as hover or focus tooltips; a tap on a touch device shows nothing. | rejected |  |  | confirmed |
| S6-001 | Medium | S6 | The focused Purpose card is drawn exactly like the selected, unfocused one: the focus outline is declared but never painted. | rejected |  |  | confirmed |
| S6-002 | Medium | S6 | Confirming the Submit dialog removes the Submit button and leaves keyboard focus on the document body; the new 'Run started' panel is not announced or focused. | rejected |  |  | confirmed |
| S6-005 | Medium | S6 | The Purpose step offers four mock purposes, not the eight pathways: no Lite, Deep, Relative Value, Covenant & Refinancing, Distressed & Restructuring or Portfo… | rejected (OQ-01) |  |  | confirmed |
| S6-006 | Medium | S6 | Choosing another purpose changes nothing: Confirm and Start still say 'Full credit review, 13 modules', and the choice is lost on Previous or reload. | rejected (OQ-01) |  |  | confirmed |
| S6-009 | Medium | S6 | 'Try again' links to the page it is on: pressing it changes nothing and gives no feedback. | rejected (OQ-01) |  |  | confirmed |
| S6-010 | Medium | S6 | A run's label chip cannot wrap: the fixture's own long label ('Full credit review with every optional module and a late cut-off') is cut off at 390 px, and one… | rejected |  |  | confirmed |
| S6-011 | Medium | S6 | The Run start stepper's completed steps are not buttons on the static page, so a step cannot be revisited from the stepper. | rejected (OQ-01) |  |  | confirmed |
| S6-012 | Medium | S6 | The review step shows a count of modules and none of the rest of the review sheet: no module names, no left-out modules, no run limits or decisions, no 'Change… | rejected (OQ-01) |  |  | confirmed |
| B0-002 | Low | X1 | AGENTS.md names tests/nightly-known-failures.txt, which does not exist; the file is tests/known-failures.txt. | batch (OQ-12) |  |  | not required (Low or Info) |
| C1-008 | Low | C1 | The connected library card shows no delivery state and no bottom line, unlike the static IssuerCard it is meant to match, and shows the issuer's raw identifier… | batch |  |  | not required (Low or Info) |
| C1-014 | Low | C1 | Every connected page except the report is titled 'Credit OS', so tabs, history entries and screen-reader page announcements cannot tell Library, Run activity a… | batch |  | C3-030, C5-031, J1-010, J3-018 | not required (Low or Info) |
| C1-018 | Low | C1 | On a Running card each module is a status badge whose word is the module's name, so a sighted reader sees the state only as a small glyph and colour; the state… | batch |  |  | not required (Low or Info) |
| C1-019 | Low | C1 | The Library search text, Sector and Pathway filters and the Cards/List choice are lost when the reader opens a report and comes back. | batch |  |  | not required (Low or Info) |
| C1-022 | Low | C1 | The Library filter bar labels its three fields in two styles: 'Search issuers' is a medium-weight primary-colour label above a wide input; 'Sector' and 'Pathwa… | batch |  |  | not required (Low or Info) |
| C1-023 | Low | C1 | The same as-of date is written three ways on sibling screens: '2025-03-31' on the library card and run page, 'As of 31 March 2025' on the report header, and '1… | batch |  | J1-013 | not required (Low or Info) |
| C1-027 | Low (was Info) | C1 | Spend and cap are rounded through binary floating point, so an exact decimal ending in 5 can show one cent low ('3.105' draws USD 3.10). | batch |  |  | not required (Low or Info) |
| C1-032 | Low | C1 | Every C1 loading state is one line of grey text ('Loading reports…', 'Loading run activity…', 'Loading report…') under a header that already names a different… | batch |  |  | not required (Low or Info) |
| C2-009 | Low | C2 | Run form level offers Standard, which behaves exactly like Basic. | batch (OQ-08) |  |  | not required (Low or Info) |
| C2-010 | Low | C2 | Leave out and Put back on the review sheet discard the review and its approval and return to More context without saying so. | batch |  | J2-008 | not required (Low or Info) |
| C2-012 | Low | C2 | The 50 MB limit in the drop-zone hint is not checked when a file is chosen; a 52 MB file is uploaded in full and refused with a message that names no file. | batch |  |  | not required (Low or Info) |
| C2-013 | Low | C2 | Choosing the same file or folder twice lists it twice, and the problem is reported only at Continue without naming the row. | batch |  | J2-004 | not required (Low or Info) |
| C2-015 | Low | C2 | Your name is required but not marked, and its rule is checked only at Review run, after three steps. | batch |  | J1-005 | not required (Low or Info) |
| C2-018 | Low | C2 | 'I accept these 6 limits' counts every affected module, while the card shows one limit and an 'Also affects' list. | batch |  |  | not required (Low or Info) |
| C2-019 | Low | C2 | 'Add facility', 'Add quote', 'Add rating' and the other Add buttons disable at their maximum with no reason. | batch |  |  | not required (Low or Info) |
| C2-020 | Low | C2 | With documents waiting to be carried the list says 'No documents yet.' while Continue and Inspect are enabled. | batch |  |  | not required (Low or Info) |
| C2-022 | Low | C2 | Choosing a different pathway silently clears the Requested modules selection. | batch |  |  | not required (Low or Info) |
| C2-023 | Low | C2 | A service sentence reads 'This pathway does not produce the What changed since the last Report report section.' and the same part of the report has two names o… | batch |  |  | not required (Low or Info) |
| C3-011 | Low | C3 | A change card shows a positive difference without a sign ('0.80x') while the Overview tile for the same measure shows '+0.80x vs FY2023'. | batch |  |  | not required (Low or Info) |
| C3-012 | Low | C3 | When CP-8 delivered, the same handoff is drawn twice: on the Changes tab and again as a module 'Changes since the last run' in the Modules navigator, counted i… | batch (OQ-10) |  |  | not required (Low or Info) |
| C3-015 | Low | C3 | The disclosure that holds the lead's second Bottom line paragraph is always labelled 'Decision rationale', also when the lead is Fundamental credit or Earnings… | batch |  |  | not required (Low or Info) |
| C3-016 | Low | C3 | When the lead Bottom line holds a source reference, the navy band is lost: the heading 'Bottom line' is followed by the five figure tiles and then a link 'Read… | batch |  |  | not required (Low or Info) |
| C3-017 | Low | C3 | The three 'no comparison' sentences (not produced, not compared, no comparison recorded) and the unreadable-comparison sentence carry no link; only the first-r… | batch |  |  | not required (Low or Info) |
| C3-018 | Low | C3 | On Overview the trace control of each 'Bottom line by module' row sits alone on a third line under the paragraph, unlike every other paragraph where it sits at… | batch |  |  | not required (Low or Info) |
| C3-021 | Low | C3 | The change cards are cards inside the 'Changes since the last run' card. | batch |  |  | not required (Low or Info) |
| C3-027 | Low | C3 | The lead band on Overview is labelled 'Bottom line'; the ruling and the matrix name its kicker 'Credit view' ('Earnings view' on an Earnings Update). | batch |  |  | not required (Low or Info) |
| C3-031 | Low | C3 | 'Compare with the 5% move' on Rates, FX and hedging is a <select> with one option ('10%'), so the control offers no choice. | batch |  | C4-023 | not required (Low or Info) |
| C4-006 | Low | C4 | The 'base case basis' sentence prints two figures without a unit and the third as '$62.00m', and its trigger text is emitted by nothing in the repository. | batch |  |  | not required (Low or Info) |
| C4-010 | Low | C4 | A case card whose cash proxy is missing reads 'Not available' with no reason, while the table beside it gives the reason and uses 'n.a.'. | batch |  |  | not required (Low or Info) |
| C4-011 | Low | C4 | The yield value in the Securities comparison chart wraps its unit onto a second line and keeps four decimals. | batch |  |  | not required (Low or Info) |
| C4-012 | Low | C4 | A lone 'x' is drawn under the Leverage and Interest cover charts as their unit note. | batch |  |  | not required (Low or Info) |
| C4-013 | Low | C4 | The same money unit is written four ways across the C4 screens: 'USD millions', 'US$m', '$m' and '$62.00m'. | batch |  | C3-022 | not required (Low or Info) |
| C4-020 | Low | C4 | Period series (leverage, interest cover, liquidity) are drawn as grouped columns; a line is used only when a value is negative. | batch (OQ-09) |  |  | not required (Low or Info) |
| C4-021 | Low | C4 | An undrawable chart is drawn as 'Source table available...' plus the raw table, not the gap panel, and one covenant row with no threshold removes the bullet ch… | batch |  |  | not required (Low or Info) |
| C4-022 | Low | C4 | The 'Published model' selector names models 'Model 1 · candidate' using the builder's mode word. | batch |  |  | not required (Low or Info) |
| C4-024 | Low | C4 | The same stress case is named 'Downside shock' on the card, chart and comparison table and 'Downside case' in the grid header. | batch |  | J3-014 | not required (Low or Info) |
| C4-027 | Low | C4 | A chart amount written with a typographic minus, parentheses, a space or no-break space as thousands separator, or a unit suffix removes the whole chart, while… | batch |  |  | not required (Low or Info) |
| C4-029 | Low | C4 | A case whose display name differs from its stored group name shows 'Case description not recorded.' although the model's note for it exists. | batch |  |  | not required (Low or Info) |
| C4-030 | Low | C4 | An event whose name contains a file name is drawn as 'See Evidence', so the reader cannot tell which event it is. | batch |  |  | not required (Low or Info) |
| C4-031 | Low | C4 | While the portfolio basis is loading the Portfolio limits card states that the report records no validated basis. | batch |  |  | not required (Low or Info) |
| C4-035 | Low | C4 | The FY2027E cash proxy reads 172.46 on the case card, chart and Scenario comparison and 172 in the model grid directly below. | batch |  |  | not required (Low or Info) |
| C4-036 | Low | C4 | The break points are re-ordered by delivery (smallest required EBITDA decline first) and drawn as an ordered list, a ranking the module did not write for this… | batch |  |  | not required (Low or Info) |
| C5-013 | Low | C5 | Handoff, calculation and Model downloads are on Summary and Trace, and registers and confidence inputs are drawn per handoff on Trace, not on Record as the mat… | batch |  | R4-014 | not required (Low or Info) |
| C5-014 | Low | C5 | Script check cards are titled "columns", "rows", "all" or "Headroom: all", and draw the service's raw markup, snake_case register names and module codes. | batch |  |  | not required (Low or Info) |
| C5-017 | Low | C5 | The Summary count reads "1 designated handoffs" and gives only two counts. | batch |  |  | not required (Low or Info) |
| C5-018 | Low | C5 | Handoff names are links styled as plain semibold labels, so the reader cannot tell they open that handoff's evidence. | batch |  |  | not required (Low or Info) |
| C5-019 | Low | C5 | In "Model and calculation files" the three download buttons stretch to the full card width. | batch |  |  | not required (Low or Info) |
| C5-022 | Low | C5 | The Gaps table prints Markdown marks raw ("**bold**", backticks) and labels every row link "Open source" although it opens the handoff line, not a source. | batch |  |  | not required (Low or Info) |
| C5-023 | Low | C5 | When the delivery has no zip, handoff links or model files, the page drops the buttons and the section without saying so. | batch |  |  | not required (Low or Info) |
| C5-024 | Low | C5 | Empty Gaps, Sources and Script checks are one plain sentence, and "Supplied but unnamed in handoffs" / "Use unrecorded" depart from the ruled wording. | batch |  |  | not required (Low or Info) |
| C5-025 | Low | C5 | Drawers and handoff views list "no page / the row cites no page or register" entries that are not tied to a row. | batch |  |  | not required (Low or Info) |
| C5-033 | Low | C5 | Record does not show the delivery or library-admission state, or which outputs were retained rather than newly executed. | batch |  |  | not required (Low or Info) |
| C5-035 | Low | C5 | Record names a module with issues by its output label, which is the module code ("CP-2D · Handoff issues"). | batch |  |  | not required (Low or Info) |
| C5-037 | Low | C5 | A source with no document date or type is drawn without them and without a marker, so a missing date reads as nothing. | batch |  |  | not required (Low or Info) |
| C5-038 | Low | C5 | Evidence nests bordered boxes inside cards: a card per module holding a bordered card per check, a card holding bordered disclosures, a handoff card holding bo… | batch |  |  | not required (Low or Info) |
| J1-003 | Low (was Medium) | J1 | The synthetic test lets the analyst choose, review, approve and submit seven of eight pathways, every one of which ends Failed with "launcher exited 2; see log… | batch |  | J3-002, J2-014 | confirmed |
| J1-006 | Low | J1 | The review sheet calls the workbook 'unrecognised' under Documents read yet a Check on the same sheet recognises it as a portfolio workbook, and the Portfolio… | batch |  |  | not required (Low or Info) |
| J1-007 | Low | J1 | A Check tells the analyst to 'choose it as the portfolio workbook under Issuer and dates', but no section has that name; the field is on the More context step. | batch |  |  | not required (Low or Info) |
| J1-008 | Low | J1 | Run activity counts and lists only runs that ended without a report; the finished run appears nowhere on it and the 'Ended' tile reads 1 after two runs ended. | batch |  |  | not required (Low or Info) |
| J1-009 | Low | J1 | The same 14 modules appear in three orders (run page, Modules navigator and Evidence filter, Overview), and the Overview's 'Bottom line by module' lists 13 whi… | batch |  | J3-008, J4-014 | not required (Low or Info) |
| J1-011 | Low | J1 | The left rail holds two icon-only links with no visible text or tooltip; the play-circle icon reads as 'start' but opens Run activity. | batch |  | J3-009 | not required (Low or Info) |
| J1-012 | Low | J1 | 'Run activity' names two different screens (the list at /runs and one run's progress page at /run/<id>), and the rail calls the list 'Run'. | batch |  |  | not required (Low or Info) |
| J1-015 | Low | J1 | 'Start from this run' opens with today's date in As-of date and an empty Your name, although the page says to 'add dates' and the README says the analyst's own… | batch | T07 |  | not required (Low or Info) |
| J1-016 | Low | J1 | The word 'Purpose' names three things: the step (the pathway), the 'Run purpose' select (market view) and the review row 'Purpose', while 'Edit purpose and mod… | batch |  |  | not required (Low or Info) |
| J1-017 | Low | J1 | Two lines on the review sheet cannot be understood by the analyst: 'Fixed below the Advanced form level.' and, under a full 14-module list, 'Report sections om… | batch |  |  | not required (Low or Info) |
| J1-018 | Low | J1 | The README says the run's cap is shown 'beside each pathway and before Submit'; the pathway cards show no cap and the cap appears only in the Readiness card fo… | batch |  |  | not required (Low or Info) |
| J2-005 | Low | J2 | A second copy of the same document under another name (for example 'northbridge-filing (1).txt') is accepted as a separate document with no flag. | batch |  |  | not required (Low or Info) |
| J2-006 | Low | J2 | A wrong file type is accepted for upload and described two different ways, and neither says why or which types are read. | batch |  |  | not required (Low or Info) |
| J2-009 | Low (was Medium) | J2 | A run that stopped offers no retry or resume; its one control, 'Start from this run', opens a new submission and the page does not say so, and the README calls… | batch |  |  | confirmed |
| J2-010 | Low | J2 | A Failed run's Activity feed never records that the run stopped: its newest entry still reads 'Running, Run started.' | batch |  |  | not required (Low or Info) |
| J2-012 | Low | J2 | Typing an issuer that already has runs shows no notice on Start a run; the earlier runs are looked up only when the analyst presses 'Carry over from latest run… | batch |  |  | not required (Low or Info) |
| J2-015 | Low | J2 | A run that waits behind three running ones is listed under Waiting and shown as Queued with no reason, no limit and no position. | batch |  |  | not required (Low or Info) |
| J3-011 | Low | J3 | 'Dates to watch' and the Issuer calendar use unexplained words ('Wall', 'Cost', 'Rating', '· day', '· month') and show a 'Historical' event dated after the as-… | batch |  |  | not required (Low or Info) |
| J3-012 | Low | J3 | Evidence > Script checks shows a badge '215' and a list in which 205 items read 'not checked', with no sentence saying what a script check is or what 'not chec… | batch |  | J4-011 | not required (Low or Info) |
| J3-016 | Low | J3 | The Downside module formats the same quantity two ways ('EBITDA decline 0.1 (10%)' and 'FCF reaches zero 0.10 (10%)') and labels a drop-down 'Compare with Cont… | batch |  |  | not required (Low or Info) |
| J3-017 | Low | J3 | The tab named 'Report' opens a page titled 'Report history', the breadcrumb reads 'Library / Report' with 'Report' not a link, and the library card link '1 run… | batch |  |  | not required (Low or Info) |
| J3-019 | Low | J3 | The header switch 'Show sources' only draws a ring around the existing trace icons; it shows no source, which is what its name promises. | batch |  |  | not required (Low or Info) |
| J3-020 | Low | J3 | In Evidence > Summary > Handoffs, the name 'Forward credit model' is a link (to a trace entry) while every other module name in the list is plain text, with no… | batch |  |  | not required (Low or Info) |
| J5-005 | Low | J5 | Changes says 'This is the first listed run for this issuer on this pathway' while Report history on the same issuer lists an earlier-dated run of the same path… | batch |  |  | not required (Low or Info) |
| J6-007 | Low (was Medium) | J6 | The Forecast tab reads "No forecast for this run" on a page whose module list shows a Forecast module as Delivered with a base case. | batch |  |  | confirmed |
| J6-014 | Low | J6 | "Page not found" has no link or button; every other error page offers a way back. | batch |  |  | not required (Low or Info) |
| R2-001 | Low | C4 | The predicate that holds source references back from table cells (visualData.ts containsReference) misses gap ids such as '(G12)', run codes such as '20261117-… | batch |  |  | not required (Low or Info) |
| R2-002 | Low | C4 | With the Basis and limitation column added (C3-029), a chart's Table form is still wider than its card (749 px against 604 at 1440, 316 at 390), so the reader… | batch |  |  | not required (Low or Info) |
| R4-003 | Low | S4 | The fixture download repair replaced an existing confidentiality qualification with a generic missing-sample explanation. | batch |  |  | not required (Low or Info) |
| R4-004 | Low | C5 | The approved-limit Record draws raw module codes although the analyst approved the same reasons with plain module names. | batch |  |  | not required (Low or Info) |
| R4-016 | Low | X1 | The retained negative browser probe leaves local listeners open when browser launch fails. | batch |  |  | not required (Low or Info) |
| R4-019 | Low | X1 | The offline guard counts an Edge local file-icon image as an outside request. | batch |  |  | not required (Low or Info) |
| R4-020 | Low | C4 | Forecast's Record link uses the blue action color. | batch |  |  | not required (Low or Info) |
| S1-007 | Low (was Medium) | S1 | Every fixture run is a "Full credit review" drawn with a USD 20.00 spend cap; the Full tier's cap is USD 25. | batch |  | S6-004 | confirmed |
| S1-008 | Low | S1 | #/kit/ shows "Page not found" while every other address ignores one trailing slash. | batch |  |  | not required (Low or Info) |
| S1-010 | Low | S1 | Back and Forward do not restore the scroll position, because the page scrolls inside main and the browser only restores window scroll. | batch |  |  | not required (Low or Info) |
| S1-011 | Low | S1 | An address that is not a library page is drawn as Library: the rail marks Library current, and with the data missing every area shows the h1 "Library". | batch |  |  | not required (Low or Info) |
| S1-015 | Low | S1 | The kit's own Chart or Table group can be left with nothing selected; the chart frames' group cannot. | batch |  |  | not required (Low or Info) |
| S1-019 | Low | S1 | The rail marks the current area only by a faint tint and an icon hue change, with no line or shape. | batch |  |  | not required (Low or Info) |
| S2-008 | Low (was Medium) | S2 | The fixture the S2 pages are drawn from contradicts itself on the basis of net leverage (reported or adjusted), the period of the 4.9x comparison and the pathw… | batch |  | J6-008, J6-016 | confirmed |
| S2-012 | Low | S2 | The trace control is drawn at rest on pointer devices; the design system and CM-009 say it shows on hover and focus and is always shown only on touch. | batch (OQ-09) |  |  | not required (Low or Info) |
| S2-015 | Low | S2 | A run that is still loading draws a skeleton marked aria-busy with no name, no text and no live region, so a screen reader hears nothing. | batch |  | S3-019, S4-015 | not required (Low or Info) |
| S2-017 | Low | S2 | The search field has no visible label, only a placeholder (its accessible name comes from aria-label). | batch |  |  | not required (Low or Info) |
| S2-020 | Low | S2 | Search, filters and the Cards/List choice are lost when the reader opens an issuer and presses Back. | batch |  | J6-012 | not required (Low or Info) |
| S2-022 | Low | S2 | ChangeCard.tsx uses the ReactNode type on line 36 and imports it on the last line of the file (line 68). | batch |  |  | not required (Low or Info) |
| S2-023 | Low | S2 | A module item that stands for several modules ('9 modules unchanged') draws a chevron and does nothing when pressed, while the items that do open a module have… | batch (OQ-09) |  |  | not required (Low or Info) |
| S3-012 | Low | S3 | A module that could not be assessed or did not run shows its reason without a Bottom line. | batch |  |  | not required (Low or Info) |
| S3-014 | Low | S3 | The fixture's only data module (Source readiness) shows a bottom line and nothing after it. | batch |  |  | not required (Low or Info) |
| S3-017 | Low | S3 | Each limitation is clamped to three lines with an ellipsis behind a Show all control, although only the card is meant to collapse and nothing is to be cut. | batch (OQ-09) |  |  | not required (Low or Info) |
| S3-018 | Low | S3 | The Show all and Show less controls are 57 by 20 px, under the 24 px minimum target. | batch |  |  | not required (Low or Info) |
| S3-020 | Low | S3 | The statement table has no card and mixes surfaces: white header and label column, canvas-coloured figure cells. | batch |  |  | not required (Low or Info) |
| S3-025 | Low | S3 | The 'On this page' marker only changes when a section is chosen: after reading on or scrolling back it still names the old section. | batch |  |  | not required (Low or Info) |
| S3-026 | Low | S3 | The navigator entry for the typed record blocks is called 'Records', which tells a reader nothing. | batch |  |  | not required (Low or Info) |
| S3-027 | Low | S3 | A footnote prints the label 'Basis:' and another says 'Not plotted' beside a table that plots nothing. | batch |  |  | not required (Low or Info) |
| S3-028 | Low | S3 | The sticky navigator scrolls inside itself and does not bring the current module into view: at 1366x768 and 1280x720 the current entry can sit below the naviga… | batch |  |  | not required (Low or Info) |
| S3-036 | Low | S3 | The three facts of a facility share one trace, so the drawer for Margin, Maturity, Drawn or Commitment fee is headed and totalled with the facility's size. | batch |  |  | not required (Low or Info) |
| S3-037 | Low | S3 | Navigator entries show a module's state only as a small shape; the word (Delivered with gaps, Not assessable, Not run) is in the accessible name but not drawn. | batch |  |  | not required (Low or Info) |
| S4-001 | Low (was High) | S4 | The Summary tile 'Calculations 59 - Each one traceable to its inputs' counts traced items, not calculations: 58 of the 59 Trace rows open no derivation. | batch |  |  | confirmed |
| S4-002 | Low (was Medium) | S4 | 57 of the 58 trace drawers list no source, file, page or quoted passage, while the matching Evidence Trace row reports 'Sources 1' to '6'. | batch |  |  | confirmed |
| S4-003 | Low (was Medium) | S4 | 'Download handoffs', 'Download all' and every register 'Open' point at files that are not in the built app; clicking Download handoffs replaces the page with t… | batch |  | J6-001 | confirmed |
| S4-018 | Low | S4 | The jump search matches labels only, so an id the row itself shows (T-0014, G-03, C-0412) finds nothing; at 390 px ids break across lines and the Ctrl K hint i… | batch |  |  | not required (Low or Info) |
| S5-009 | Low (was Medium) | S5 | The Net debt walk table labels a row 'Free cash flow, FY26' with -2,540 while the Statements table shows free cash flow FY26E as +2,540: the same label carries… | batch |  |  | confirmed |
| S5-010 | Low | S5 | The case choice is private state of each page: choosing Downside on Statements leaves Forecast on Base, and leaving a page resets it. | batch |  |  | not required (Low or Info) |
| S5-011 | Low | S5 | The case-choice line says 'every chart below follows it', but on Statements only the two bridges change and on Forecast only the interest cover line, the walk… | batch |  |  | not required (Low or Info) |
| S5-012 | Low | S5 | Only 6 of the 15 chart tables carry a trace control per row; the Headroom, Segment margin, Exposure, Leverage and margin, holdings range, driver, Interest cove… | batch |  |  | not required (Low or Info) |
| S5-016 | Low | S5 | The empty Model index is one centred title: no icon, no explanatory sentence, no next action. | batch |  |  | not required (Low or Info) |
| S5-018 | Low | S5 | One USD unit is written three ways: '$8,580m' on the Front page, 'USD millions' on Statements and charts, 'US dollars, millions' in the covers list; the matrix… | batch |  |  | not required (Low or Info) |
| S5-019 | Low | S5 | In the Bars view a negative figure's bar differs from a positive one only by colour: both are right-aligned from the same edge. | batch |  |  | not required (Low or Info) |
| S5-020 | Low | S5 | The Forecast page's headings 'Two cases' and 'Cash flow in FY26' are written in the page, not taken from the data, so a walk for another year or a one-case run… | batch |  |  | not required (Low or Info) |
| S6-008 | Low (was Medium) | S6 | 'Open the library' and 'Open what finished' go to the Library home (#/), which does not hold the run's issuer, so the finished work cannot be reached. | batch |  | S2-024, S5-003, J6-004 | confirmed |
| S6-014 | Low | S6 | The run alerts offer 'Review and resume' and 'Review and start again', but the control matrix says no page control for resuming exists and that a resume is a l… | batch (OQ-06) |  |  | not required (Low or Info) |
| S6-016 | Low | S6 | The cap is not named on Run activity: the figure is captioned 'Spend' and the bar reads 'USD 7.40 of USD 20.00'. | batch |  |  | not required (Low or Info) |
| S6-017 | Low | S6 | Readiness lists 'Model service reachable' as Met on pages that say they are not connected to any service. | batch |  |  | not required (Low or Info) |
| S6-018 | Low | S6 | The module-code guard in the slice reader (/\bCP-\d/) lets CP-DR, CP-MODEL, CP-L10, CP-OS and lower-case codes through; they are drawn as labels on Run start a… | batch |  |  | not required (Low or Info) |
| S6-022 | Low | S6 | Spacing and sizes off the 4/8/12/16/20/24/32 ladder: gap-7 (28 px) between Confirm groups, 6 px and 2 px gaps, and fixed 38 px, 27 px, 18 px and 9 px values on… | batch |  |  | not required (Low or Info) |
| S6-023 | Low | S6 | The Readiness panel nests three bordered surfaces and its item boxes have the same radius as the panel around them. | batch |  |  | not required (Low or Info) |
| S6-024 | Low | S6 | The same FileCheck02 featured icon is drawn on every purpose card; it says nothing the title does not. | batch |  | C2-017 | not required (Low or Info) |
| S6-025 | Low | S6 | The upload hint lists PDF, DOCX, HTML or XLSX; the reader also accepts CSV, TXT, MD, JSON and JSONL, and the connected page names no types. | batch |  |  | not required (Low or Info) |
| S6-026 | Low | S6 | On the shipped build every run page is the single line 'No run data in this library': no sentence says why or what to do, and the link to start a run is absent. | batch |  |  | not required (Low or Info) |
| S6-027 | Low | S6 | The Documents step cannot be completed: Next says 'Replace or remove the unreadable file to continue', while Replace file, Remove and the drop zone (which stil… | batch |  |  | not required (Low or Info) |
| S6-029 | Low | S6 | An unreadable file row carries two Remove controls: the icon (named 'Remove <file>') and a text button named only 'Remove'. | batch |  |  | not required (Low or Info) |
| S6-031 | Low | S6 | The saved example contradicts itself: the More context textarea is empty but the Start recap says 'One note added'; 'a library appears under TransDigm Group' w… | batch |  |  | not required (Low or Info) |
| X1-001 | Low | X1 | Text that the project wrote itself is set at 12 px and 10 px, under the 13 px floor. | batch |  | C1-017, C2-016, C3-032, C4-016, S1-014, S2-019, S3-015, S4-016, S6-021 | not required (Low or Info) |
| X1-002 | Low | X1 | The empty-state title is set in Geist, not in the heading face. | batch |  |  | not required (Low or Info) |
| X1-003 | Low | X1 | Three different cards draw a headline figure: the kit MetricCard, the library MetricTile and the model MetricTile. | batch |  |  | not required (Low or Info) |
| X1-004 | Low | X1 | A table cell draws n.a. only for null; an undefined or empty-string cell is drawn blank. | batch |  | S6-020 | not required (Low or Info) |
| X1-009 | Low | X1 | A hovered, unselected tab is drawn exactly like the selected tab. | batch (OQ-09) |  |  | not required (Low or Info) |
| X1-016 | Low | X1 | The kit's paid-run sample dialog tells the reader the run 'stops at the cap of USD 20' with no pathway named. | batch |  |  | not required (Low or Info) |
| X1-020 | Low | X1 | Bar, stack and strip series are told apart by colour alone, and the first and third chart colours are almost the same grey. | batch (OQ-09) |  |  | not required (Low or Info) |
| X1-023 | Low | X1 | A range strip row with no range draws neither the strip nor the two case markers, and no n.a. in the track, although both case values are delivered. | batch |  |  | not required (Low or Info) |
| R1-009 | Low | C1 | With an earlier run listed, the Teams started card counts CP-8 only from its first event, so it reads 13 against the run page's 14, and a run stopped before CP… | deferred |  |  | not required (Low or Info) |
| R1-015 | Low | C2 | Runs of two different issuers already filed under one Issuer ID before T09's repair stay merged under that ID. | deferred |  |  | not required (Low or Info) |
| C1-010 | Low | C1 | One malformed catalogue entry takes down the whole Library page: the user sees only 'This page could not be loaded' and a Reload button that fails the same way. | parked |  |  | not required (Low or Info) |
| C1-011 | Low | C1 | A run status, module state or event kind the client does not know crashes the whole Run activity or run page into the load-failure screen. | parked |  |  | not required (Low or Info) |
| C1-012 | Low | C1 | getLibraryIndex and getSnapshot hand the browser's JSON parse error to the reader ('Unexpected token '<', "<html>oops</html>" is not valid JSON'). | parked |  |  | not required (Low or Info) |
| C2-021 | Low | C2 | An unknown or malformed from= run shows the service's raw words 'unknown run' or 'not found' in a quiet status line. | parked |  |  | not required (Low or Info) |
| C2-024 | Low | C2 | A Submit answered 200 without a run id navigates to /run/undefined. | parked |  |  | not required (Low or Info) |
| C3-009 | Low | C3 | One unbroken 336-character token in the lead Bottom line runs past the navy band and makes the main region scroll sideways. | parked |  |  | not required (Low or Info) |
| C5-020 | Low | C5 | An address naming a module that is not in the run filters the page to nothing while the Module select still reads "All modules". | parked |  |  | not required (Low or Info) |
| C5-021 | Low | C5 | ArtifactDownloads draws any href the listing returns, including a foreign https address. | parked |  |  | not required (Low or Info) |
| C5-027 | Low | C5 | A calculation id defined twice, or nested deeper than 8, silently disappears from a drawer's derivation. | parked |  |  | not required (Low or Info) |
| R4-005 | Low | C4 | Chart unit parser accepts an unrecognised unit ending in m as millions. | parked |  |  | not required (Low or Info) |
| S1-012 | Low | S1 | The no-data, unreadable-data and no-such-page states are one bare grey sentence; different causes read alike and the reader's internal reason is drawn raw. | parked |  |  | not required (Low or Info) |
| S1-013 | Low | S1 | Any schema other than credit-os-data/1 is reported as "written by a newer version", and the schema text is kept but never shown. | parked |  |  | not required (Low or Info) |
| S1-016 | Low | S1 | The top-level `issuers` list is read only by an unreachable branch of App.tsx, yet one malformed entry turns every page into "Library data is missing". | parked |  |  | not required (Low or Info) |
| S1-020 | Low | S1 | The skip link's href is "#main", so followed outside its click handler it opens the "Page not found" page. | parked |  |  | not required (Low or Info) |
| S2-028 | Low | S2 | The reader accepts a card href, a history report and a Changes link that name a run the issuer does not hold, so a card opens 'No such run'. | parked |  |  | not required (Low or Info) |
| S2-029 | Low | S2 | A single unbroken token of about 200 characters in an issuer name, a finding or a measure label widens <main> and scrolls the page sideways. | parked |  |  | not required (Low or Info) |
| S3-016 | Low | S3 | A long unbroken word overflows its row: an indicator threshold runs under the neighbouring column, a fact value and a key-finding lead run past the card. | parked |  |  | not required (Low or Info) |
| S5-021 | Low | S5 | A very long unbroken word in the issuer name makes the breadcrumb 735 px wide and the page scroll sideways at 390 px. | parked |  |  | not required (Low or Info) |
| S6-019 | Low | S6 | One invalid string makes every run page a bare message that prints the validator's path text, and no run page can be read. | parked |  |  | not required (Low or Info) |
| C1-015 | Low | C1 | Heading levels skip: the Library goes from the h1 straight to h3 issuer names, and the run page from h1 to h3 'Modules' and 'Activity'. | rejected |  | X1-012 | not required (Low or Info) |
| C1-020 | Low | C1 | On the Report history tab the report frame is wider than a phone screen: the page scrolls sideways (6 px at 390 px, 76 px at 320 px) because each history row's… | rejected |  | J5-008 | not required (Low or Info) |
| C1-021 | Low | C1 | Issuer names on Run activity are links that never wrap, so an 85-character name makes the page scroll sideways 737 px at 390 px; at 320 px the header's counts… | rejected |  |  | not required (Low or Info) |
| C1-030 | Low | C1 | At 390 px the navigation rail is drawn at the bottom of the screen but is first in the tab order, so keyboard focus starts at the bottom bar, jumps to the top… | rejected |  |  | not required (Low or Info) |
| C3-010 | Low | C3 | The heading outline does not follow the page structure: the whole Bottom line paragraph is the h2 (no 'Bottom line' heading text), module sections are h2 sibli… | rejected |  |  | not required (Low or Info) |
| C3-013 | Low | C3 | The Chart/Table and Cards/Table switches are role=radiogroup buttons whose arrow keys move focus without selecting and whose radios are both Tab stops. | rejected |  | C1-016, C4-008, S2-018 | not required (Low or Info) |
| C3-014 | Low | C3 | Controls repeat identical accessible names with no context: 'Show sources for this passage' (several per module page) and six links named 'Evidence' on Overvie… | rejected |  | C4-009, S2-016, S3-023, J4-010, J6-015 | not required (Low or Info) |
| C3-019 | Low | C3 | The Modules navigator's <aside> has no accessible name, so the page has two unnamed complementary landmarks (axe landmark-unique); the 'Modules 14' tab has a n… | rejected |  |  | not required (Low or Info) |
| C4-014 | Low | C4 | The calendar's year markers are 14 by 14 px, are not tab stops and cannot be pressed at 480 px or less. | rejected |  | J5-009 | not required (Low or Info) |
| C4-032 | Low | C4 | Each Recharts chart is an extra tab stop with role=application, named only by its title, with an empty description. | rejected |  | X1-007 | not required (Low or Info) |
| C4-037 | Low | C4 | At 390 px the EBITDA bridge's x-axis labels touch or overlap ('Restructuring add-back', 'Disposal', 'Issuer-adjusted EBITDA'). | rejected |  |  | not required (Low or Info) |
| C5-015 | Low | C5 | Script checks expose 215 region landmarks with duplicate names, and Record tables are all named "Table". | rejected |  |  | not required (Low or Info) |
| C5-016 | Low | C5 | Record jumps from h3 to h5 ("Synthetic adapter responses" / "Model calls", "Handoff issues"). | rejected |  |  | not required (Low or Info) |
| J4-002 | Low (was Medium) | J4 | The finished synthetic run shows different values for the same measure on different screens, and nothing states a definition, a period or a reason for the diff… | rejected |  | J3-006, J3-010, J4-013 | not a defect |
| J4-006 | Low (was Medium) | J4 | The issuer calendar counts one dated event once per module that repeats it, and the Overview's Dates to watch lists one event five times. | rejected |  |  | not a defect |
| J4-008 | Low | J4 | The rating's as-of date (2025-02-28) is only in a hover title on a non-focusable element, so it is not visible on a touch screen or by keyboard. | rejected |  |  | not required (Low or Info) |
| S1-009 | Low | S1 | Below 480 px the rail's content is 1 px taller than its box and the whole document scrolls by 1 px. | rejected |  |  | not required (Low or Info) |
| S2-009 | Low | S2 | The static Changes page draws a narrower vocabulary than CP-8 delivers: three change states, two no-comparison cases, no cause classes, limitations ledger, reg… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S2-010 | Low | S2 | The static Overview has no place for key charts, the entered-ratings band, an 'Earlier format' or 'Earlier methods' label, selected watch items or the year-on-… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S2-011 | Low | S2 | The Library home lists issuers whose latest run is Running, Failed or Capped, although CM-033 and CT-043 say only completed runs with all modules answered are… | rejected (OQ-07) |  |  | not required (Low or Info) |
| S2-021 | Low | S2 | At 320 px the run header's actions ('Show sources', 'Report history', 'New run') run past the viewport and the page scrolls sideways by 47 to 119 px. | rejected |  |  | not required (Low or Info) |
| S3-010 | Low | S3 | The static module vocabulary has eleven record kinds, so the matrix's dated lanes, case cards, for-and-against board, trend and path charts, comparisons, ranke… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S3-013 | Low | S3 | Modules that did not run (Not run, a capped run) are listed in the navigator and open pages, although CT-044 says only modules that ran are listed. | rejected (OQ-07) |  |  | not required (Low or Info) |
| S3-021 | Low | S3 | At 390 px wide tables are clipped at the card edge with no scroll cue: the risk matrix shows 'Imp' and 'Hi' and its per-risk trace controls are out of sight. | rejected |  | C4-015 | not required (Low or Info) |
| S3-022 | Low | S3 | Every scrollable table wrapper is an unnamed generic element that becomes a tab stop with the browser's default focus ring. | rejected |  |  | not required (Low or Info) |
| S3-024 | Low | S3 | The navigator sits before the content in tab order, so the first content control is about 20 Tab presses from the Evidence tab (6 section buttons and 13 module… | rejected |  |  | not required (Low or Info) |
| S3-029 | Low | S3 | At 320 px the New run button runs 47 px past the window edge. | rejected |  |  | not required (Low or Info) |
| S3-030 | Low | S3 | The Modules navigator has no Model entry although decision 3 says the delivered Model appears as an entry in Modules. | rejected (OQ-01) |  |  | not required (Low or Info) |
| S4-017 | Low | S4 | At 390 px the copy toast touches the left edge and covers the bottom navigation. | rejected |  |  | not required (Low or Info) |
| S4-021 | Low | S4 | The trace drawer has two buttons named 'Close' that do the same thing. | rejected |  |  | not required (Low or Info) |
| S5-006 | Low | S5 | At 390 px the Statements tab list is 445 px wide inside a 260 px card with overflow visible: 'Balance sheet' is cut by the card edge, 'Key measures' lies past… | rejected |  |  | not required (Low or Info) |
| S5-007 | Low | S5 | At 390 px the range strips shrink to a blob about 30 px wide between a wrapped label column and the value column, so range and marker positions cannot be read. | rejected |  |  | not required (Low or Info) |
| S5-025 | Low | S5 | Chart titles are h3 headings placed after an unrelated h2: Headroom and Segment margins follow 'Measures and what they mean', and the Forecast charts follow 'T… | rejected |  |  | not required (Low or Info) |
| S6-013 | Low | S6 | The Start step's Submit button is whitespace-nowrap and 307 px wide, so the card is wider than the viewport: 15 px past the right gutter at 390 px, and at 320… | rejected |  |  | not required (Low or Info) |
| S6-015 | Low | S6 | Run activity shows module states only: plan, delivery and library admission have no state of their own, so a run whose modules finished cannot be told from one… | rejected (OQ-10) |  |  | not required (Low or Info) |
| S6-028 | Low | S6 | Moving to another step keeps the previous scroll offset: at 390 px the new step opens with its heading 326 px above the viewport. | rejected |  |  | not required (Low or Info) |
| S6-030 | Low | S6 | Disabled controls are unfocusable, so the reason attached to them with aria-describedby is never reached by Tab. | rejected |  |  | not required (Low or Info) |
| X1-005 | Low | X1 | Every warning or error Alert is role=alert, including the permanent 'Contrary evidence' passage on each module page. | rejected |  |  | not required (Low or Info) |
| X1-021 | Low | X1 | Each path chart has a focusable 'scroll horizontally' region that does not scroll, in addition to the chart's own tab stop. | rejected |  |  | not required (Low or Info) |
| R1-001 | Info (was High) | C5 | When a pinned context or delivery file cannot be read, the catalogue issue text carries the error's message, which for an OSError holds the server's absolute p… | repair | T01 |  | confirmed |
| R1-007 | Info (was High) | C5 | An unreadable source file sets sourceWarning to the OSError's text, which holds the server's absolute path; /connected/snapshot sends it and the connected Evid… | repair | T01b |  | confirmed |
| R1-008 | Info (was High) | C1 | When the library rebuild fails on an unreadable file, the scheduler writes 'the library could not be rebuilt (<error text>)' into the held note, and /activity.… | repair | T01b |  | confirmed |
| C1-028 | Info | C1 | The connected Run activity has no 'Not assessable' state for a blocked module, and offers 'Start from this run' beside a capped or interrupted run where the ma… | batch (OQ-06) |  |  | not required (Low or Info) |
| C2-027 | Info | C2 | Two fail-open notes mislead: console.warn says a launcher flag is 'not shown' when its text is shown, and the FieldProblem for a blank issuer name is reachable… | batch |  |  | not required (Low or Info) |
| C5-028 | Info | C5 | Record: the run type comes from the service mode, the getRun error text is dropped, and an empty call cell reads "Empty in the handoff". | batch |  |  | not required (Low or Info) |
| C5-030 | Info | C5 | "Annual model handoff" under "Model and calculation files" is byte-identical to the Financial foundation handoff. | batch |  |  | not required (Low or Info) |
| J1-019 | Info | J1 | proof.serve refuses any root that already holds a file, so a restarted synthetic service cannot reopen earlier runs; the refusal is argparse usage text. | batch |  | J3-022 | not required (Low or Info) |
| J5-010 | Info | J5 | The limits the analyst accepted at Submit (no quotes, financials that are management claims) appear nowhere in the finished report, and Evidence > Gaps says 'T… | batch |  |  | not required (Low or Info) |
| J6-017 | Info | J6 | After the Kit page is opened, a text-measurement span holding "FY21" stays in <body> at top -20000, outside the app root, and is part of the page text on every… | batch |  |  | not required (Low or Info) |
| R3-001 | Info | S5 | A model run that delivers one case instead of two is refused whole by the Model reader ('expected two cases'), so none of its pages can be read. | batch (OQ-14) |  |  | not required (Low or Info) |
| R4-002 | Info | X1 | The four retained audit Python helpers fail the mandatory cumulative changed-code gate against main. | batch |  |  | not required (Low or Info) |
| S2-025 | Info | S2 | The Overview puts the headline figures and For and against between the bottom line and Key findings; D-11 fixes bottom line, key findings, then contrary eviden… | batch (OQ-02) |  |  | not required (Low or Info) |
| S3-032 | Info | S3 | StatementBlock shadows its row index with the cell index inside the row's map. | batch |  |  | not required (Low or Info) |
| S6-033 | Info | S6 | A 'Stop run' button is drawn (disabled) on every live run page, but no control-matrix row or ruling gives the analyst a Stop. | batch (OQ-06) |  |  | not required (Low or Info) |
| S6-037 | Info | C1 | The connected Run page says '14 of 14 modules' while the list under 'Modules' holds 15 rows, the last being 'Report'. | batch |  |  | not required (Low or Info) |
| X1-006 | Info | X1 | Alert wraps its children in a p element, so a block child is invalid HTML. | batch |  |  | not required (Low or Info) |
| X1-015 | Info | X1 | Select values and options, and file names in the file row, are cut with an ellipsis and carry no full-text fallback. | batch |  |  | not required (Low or Info) |
| X1-017 | Info | X1 | The design system says the slashed circle means 'Not assessable' and nothing else, and its own set table gives it to 'Not ready'. | batch (OQ-09) |  |  | not required (Low or Info) |
| X1-026 | Info | X1 | The waterfall colours are three local constants under a 'come later' comment, and 'up' uses a brand tint outside the chart palette. | batch (OQ-09) |  |  | not required (Low or Info) |
| B0-005 | Info | C1 | The service serves routes the connected client never calls: GET /connected/reports, GET /api/runs/<id>, GET /activity.js, /data.js, /assets/*, /THIRD-PARTY-NOT… | sweep |  |  | not required (Low or Info) |
| C1-025 | Info | C1 | The library index sends 43 KB for one run, almost all of it fields the page never reads (artifacts, files, gaps, summary, workflow, country, currency). | sweep |  |  | not required (Low or Info) |
| C1-026 | Info | C1 | Several client branches cannot be reached through the service: trailing-slash /start/ and /runs/, the 'Page not found' page, and 'No report was published for t… | sweep |  |  | not required (Low or Info) |
| C2-026 | Info | C2 | IntakeView carries capText and synthetic, which no step component reads. | sweep |  |  | not required (Low or Info) |
| C3-023 | Info | C3 | Dead and repeated work in the C3 files: `entryIndex` is threaded through ReportFindings, MetricGrid and ModuleConfidence into `traceForLine(_index)`, which ign… | sweep |  | C5-029 | not required (Low or Info) |
| C4-033 | Info | C4 | Three Forecast branches match limitation text that nothing in src/ writes: the zero-input basis note, the base-period and base-interest qualifications. | sweep |  |  | not required (Low or Info) |
| C5-039 | Info | C5 | hasRecordedGap is exported and tested but no page code calls it; the run folder for a source link is taken by splitting the output id. | sweep |  |  | not required (Low or Info) |
| S2-026 | Info | S2 | Static library parts import two components from the connected report (ToneMark and YearChange), so the static bundle depends on connected code. | sweep |  |  | not required (Low or Info) |
| S2-027 | Info | S2 | Four near-identical empty-state blocks (NoRuns, NoReport, Absent, OverviewPrompt) repeat the same EmptyState header, icon, title and footer markup. | sweep |  |  | not required (Low or Info) |
| S3-031 | Info | S3 | Props and branches in the S3 files are reachable only from the connected report; the static reader drops WatchRecord.detail. | sweep |  |  | not required (Low or Info) |
| S3-034 | Info | S3 | The 'No modules in this run' state is reachable only by a slice whose Overview names no module through an item with module null. | sweep |  |  | not required (Low or Info) |
| S4-023 | Info | S4 | The two register pages repeat the same block (landed ref and scroll-and-focus effect, 'No ... has this address' alert, filter empty state, sort state), and `co… | sweep |  |  | not required (Low or Info) |
| S5-023 | Info | S5 | Duplicated markup and unused parts in the Model folder, for the sweep. | sweep |  |  | not required (Low or Info) |
| S6-036 | Info | S6 | Dead branches, unread state and duplication in the run files: Readiness' capTitle prop and its 'Unavailable' branch are never used (the connected page has its… | sweep |  |  | not required (Low or Info) |
| X1-013 | Info | X1 | Several component variants and props have no caller outside the kit page or tests. | sweep (OQ-05) |  |  | not required (Low or Info) |
| X1-014 | Info | X1 | components/chart/ChartFrame.tsx imports a string constant from pages/library/parts/TraceControl. | sweep |  |  | not required (Low or Info) |
| X1-025 | Info | X1 | The chart files repeat the same blocks, and shared helpers live in individual chart files. | sweep |  |  | not required (Low or Info) |
| B0-006 | Info | C1 | The legacy issuer library and the legacy run-start form ship in the release ZIP and stay reachable at /library/*, outside the two audited surfaces. | deferred (OQ-05) |  |  | not required (Low or Info) |
| C2-025 | Info | C2 | The analyst-name help says the name is 'Shown on Run activity and in Teams', which no matrix row accounts for and which is not true in a synthetic or unconfigu… | deferred (OQ-11) |  |  | not required (Low or Info) |
| R2-004 | Info | C4 | When an event table's rows are not each identified by their own source line, its valid rows are withheld behind a whole-table card instead of being listed unde… | deferred |  |  | not required (Low or Info) |
| C4-018 | Info | C4 | Two columns with the same case name, or more than six cases, silently lose the cash proxy chart or the case cards. | parked |  |  | not required (Low or Info) |
| J5-006 | Info | J5 | At 390 px a 184-character issuer name fills 504 of the 844 px of the first screen on every report page, and the browser title is 207 characters; the name wraps… | parked |  |  | not required (Low or Info) |
| R1-002 | Info | C2 | A hand-built module list holding CP-8 passes the server's module check at Submit and is refused by the launcher at launch. | parked |  |  | not required (Low or Info) |
| R1-005 | Info | C1 | A data.js with no final ';' makes the service answer 500. | parked |  |  | not required (Low or Info) |
| R1-006 | Info | C1 | A data.js with two 'catalogue' keys, the first holding 'workspace', is served as read. | parked |  |  | not required (Low or Info) |
| R1-010 | Info | C1 | A hand-edited event log can make the Teams card count a left-out module. | parked |  |  | not required (Low or Info) |
| R1-011 | Info | C2 | A crafted Submit body can put CP-MODEL on a pathway that publishes no forecast; Submit accepts any known module on any pathway. | parked |  |  | not required (Low or Info) |
| X1-008 | Info | X1 | Five components throw on out-of-contract props, and only the connected app has an error boundary around them. | parked |  | S4-022 | not required (Low or Info) |
| X1-010 | Info | X1 | Timeline keys each item by date and title, so two items with the same date and title collide. | parked |  |  | not required (Low or Info) |
| X1-022 | Info | X1 | Only four of eleven chart kinds check that the table's figures equal the chart's figures. | parked |  |  | not required (Low or Info) |
| B0-001 | Info | S1 | The gate test:file:gates exits 1 in the cloud container because its default browser hangs on every page. | rejected |  |  | not required (Low or Info) |
| B0-004 | Info | C1 | The run root is limited to 80 characters; a longer path is refused at start. | rejected |  |  | not required (Low or Info) |
| B0-007 | Info | C1 | The scheduler posts run cards to a Teams webhook when CREDIT_OS_TEAMS_WEBHOOK and CREDIT_OS_TEAMS_LINK are set, a request to another host that README ruling R8… | rejected (OQ-11) |  |  | not a defect |
| C4-017 | Info | C4 | The Forecast 'On this page' marker follows clicks only, so aria-current can name a section the reader has scrolled away from. | rejected |  |  | not required (Low or Info) |
| C5-032 | Info | C5 | The stage 0 inventory misses controls on the Evidence screens: 15 trace controls inside closed disclosures, the 14 handoff evidence views, 13 of 14 line-level… | rejected |  | C1-029, C2-028, S3-038, S4-024 | not required (Low or Info) |
| J3-004 | Info (was Medium) | J3 | Evidence > Gaps says 'This run lists no gaps.' while the same run's pages state what was not supplied or not recorded ('Not supplied: balance not stated', 'Doc… | rejected |  |  | not a defect |
| J3-021 | Info | J3 | In the synthetic proof every trace ends 'not in inventory' or 'no page': the canned handoffs cite 'annual.txt, page 2', not the uploaded northbridge-filing.txt… | rejected |  |  | not required (Low or Info) |
| J4-004 | Info (was Medium) | J4 | Evidence Sources and Gaps do not surface citations that match no source file, and Sources says each uploaded file is named in a handoff by all 14 modules. | rejected |  |  | not a defect |
| J4-012 | Info | J4 | The model and calculation downloads give a committee member nothing to recompute the reported ratios. | rejected |  |  | not required (Low or Info) |
| J5-011 | Info | J5 | In the synthetic proof every issuer's report carries the same figures and text whatever name or date was typed, so two issuers in one session cannot show that… | rejected |  |  | not required (Low or Info) |
| R1-004 | Info (was High) | C5 | The issuer library's issue text keeps the first 80 characters of an OSError's message, which hold the server's absolute path, and those issues reach run activi… | rejected |  |  | confirmed |
| R1-013 | Info (was High) | C1 | The scheduler stores run reasons with an OSError's text ('could not be started: [Errno 13] Permission denied: <launcher path>'), and /activity.js and /api/runs… | rejected |  |  | confirmed |
| R1-014 | Info | C1 | Filing an earlier-format delivery against a hand-edited issuer registry stores 'could not be filed: <absolute path>/_engine/state/issuers.json is not a map'. | rejected |  |  | not required (Low or Info) |
| S1-017 | Info | S1 | The rails of both surfaces differ from the four items decision 12 names, and the owner has not said which wins (harmony H-08). | rejected (OQ-05) |  |  | not required (Low or Info) |
| S1-018 | Info | S1 | No matrix row accounts for the shell's skip link and brand mark, the not-found page, the data-state notices, the static Model rail item or the kit page. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S2-030 | Info | S2 | Control row CT-028 (the earlier run Changes compares with) lists S2, but S2 offers no such control and the Changes page names the earlier run only by its date. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S2-031 | Info | S2 | The page-level 'Show sources' switch in every run header has no row in either matrix. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S2-032 | Info | S2 | The navigation buttons and links on the S2 pages ('Start a run', 'New run', 'Open latest report', 'Report history', 'Library') have no control-matrix row. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S2-033 | Info | S2 | The run tab bar (Overview, Changes, Modules with count, Forecast disabled with the hint 'No forecast for this run', Evidence) has no row in either matrix. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S2-034 | Info | S2 | The List view's three range-band selects and its 'Hidden by <measure>' lists have no matrix row; CM-034 covers only the adjusted label, the sort and the count… | rejected (OQ-13) |  |  | not required (Low or Info) |
| S2-035 | Info | S2 | The List view's figure tooltips (basis and period of each leverage or coverage figure) have no matrix row. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S3-033 | Info | S3 | The static fixture holds none of the CP modules, so most per-module matrix rows cannot be marked from a screen. | rejected (OQ-13) |  |  | not required (Low or Info) |
| S3-035 | Info | S3 | Ten items on the module screens are named by no content-matrix row: the Show sources switch, the run-header actions, the module state badge, the gaps link, the… | rejected (OQ-13) |  |  | not required (Low or Info) |
| S4-025 | Info | S4 | Three control-matrix rows (CT-036, CT-041, CT-049) describe orchestration and delivery behaviour that no static Evidence screen draws or lets the user operate,… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S4-026 | Info | S4 | Four controls and marks on S4's screens have no content-matrix or control-matrix row: the sort buttons, the 'Show the other N files' disclosure, the 'Shown as'… | rejected (OQ-13) |  |  | not required (Low or Info) |
| S5-013 | Info | S5 | The static app draws the Model as its own rail area with its own tabs: the statements grid is on the 'Model' tab, not the Forecast page, and the Forecast page… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S5-014 | Info | S5 | Several chart and content rows the matrix assigns to S5 have no counterpart in the Model group, and its slice type has no field for them: break-point and delev… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S5-015 | Info | S5 | The Limitations page lists every 'Not established for this run' item as a counted set of gap panels, a gap ledger on a page that is not Evidence. | rejected (OQ-01) |  |  | not required (Low or Info) |
| S5-022 | Info | S5 | When a run carries a published model, the Statements page offers 'Open the original HTML' and a download as a relative path that the static app has no folder f… | rejected (OQ-01) |  |  | not required (Low or Info) |
| S5-024 | Info | S5 | Nothing in src/, react_frontend/, tools/ or proof/ writes the `model` member of data.js: only the hand-written fixture holds a Model run. | rejected (OQ-01) |  |  | not required (Low or Info) |
| S5-026 | Info | S5 | The matrices do not account for several things the Model pages show: the 'Show sources' switch, the Analysis 'On this page' index, the Figures or Bars choice,… | rejected (OQ-13) |  |  | not required (Low or Info) |
| S6-032 | Info | S6 | The review step shows 'Reporting currency USD' as a value read from the documents; CM-088 says neither start page asks for or shows it. | rejected (OQ-01) |  |  | not required (Low or Info) |
| S6-034 | Info | S6 | Parts of the static run screens that no matrix row accounts for: Readiness panel, the More context free-text step, run header chips (pathway, as-of) and status… | rejected (OQ-13) |  |  | not required (Low or Info) |
| S6-035 | Info | S6 | Rows for controls that exist only on the connected page or in the launching environment have no counterpart on the static run screens: the synthetic Submit (CT… | rejected (OQ-11) |  |  | not required (Low or Info) |
| X1-011 | Info | X1 | LoadingIndicator hides its visible label from assistive technology and leaves the status region with only a name. | rejected |  |  | not required (Low or Info) |
