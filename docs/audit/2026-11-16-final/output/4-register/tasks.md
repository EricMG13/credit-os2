# Repair tasks (stage 4)

One task per cause or per tightly related set in the same files. Tasks in different groups share no file (`groups.md`); tasks in one group that share a file run in the order below. A probe is the task's answer key: the implementer does not edit it. A probe whose signal is `output` prints the defect and exits 0 whether or not the defect is present, so the implementer reads its output before and after the repair; a probe whose signal is `exit` exits non-zero while the defect is present. A probe that starts `proof.serve` must run on a port no other worker uses.

## T01 (group 1). Stop sending the server's absolute workspace path to the browser

Findings:

- C1-001 (with C5-001), High: GET /connected/snapshot sends the server's absolute workspace path to the browser (catalogue.workspace).
- R1-001, High: When a pinned context or delivery file cannot be read, the catalogue issue text carries the error's message, which for an OSError holds the server's absolute path, and /connected/snapshot sends it to the browser.
- R1-004, High: The issuer library's issue text keeps the first 80 characters of an OSError's message, which hold the server's absolute path, and those issues reach run activity and /connected/snapshot.

Files: `react_frontend/__init__.py`, `src/deploy_workflow/credit_os_catalogue.py`, `apps/issuer-library/credit_os/source.py`

Probes:

- C1-001 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-001-snapshot-leaks-workspace-path.cjs`
- C1-001 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C5/probes/snapshot-path-leak.cjs`
- R1-001 (none): `found by repair-1's T01/T02 review (2026-11-17); the T01 follow-up test is the probe`
- R1-004 (none): `found by repair-1's T01 review (2026-11-17), shown by a direct call on a PermissionError; the T01 follow-up test is the probe`

Touches money, ordering or security code: security (a leaked path).

## T01b (group 1). No absolute path in source warnings or the library-rebuild note

Findings:

- R1-007, High: An unreadable source file sets sourceWarning to the OSError's text, which holds the server's absolute path; /connected/snapshot sends it and the connected Evidence page draws it.
- R1-008, High: When the library rebuild fails on an unreadable file, the scheduler writes 'the library could not be rebuilt (<error text>)' into the held note, and /activity.js serves it with the absolute path.

Files: `react_frontend/sources.py`, `src/deploy_workflow/inbox/scheduler.py`

Probes:

- R1-007 (none): `found by repair-1's T01 adversarial review (2026-11-17): chmod 000 on an inputs/<digest> source of a copied synthetic root; the T01b test is the probe`
- R1-008 (none): `found by repair-1's T01 adversarial review (2026-11-17) for an unreadable pinned context; the T01b test is the probe`

Touches money, ordering or security code: security (a leaked path).

Note: Added during stage 5 (ruling L10); found by T01's adversarial review.

## T01c (group 1). No absolute path in stored run reasons

Findings:

- R1-013, High: The scheduler stores run reasons with an OSError's text ('could not be started: [Errno 13] Permission denied: <launcher path>'), and /activity.js and /api/runs/<id> serve them with the absolute path.

Files: `src/deploy_workflow/inbox/scheduler.py`

Probes:

- R1-013 (none): `found by repair-1's T01b reviews (2026-11-17), reproduced with a missing and an unreadable launcher and a directory in place of a log; the T01c tests are the probe`

Touches money, ordering or security code: security (a leaked path).

Note: Added during stage 5 (ruling L13); found by T01b's reviews.

## T02 (group 1). Leaving a module out must not make Submit refuse 'unknown module CP-MODEL'

Findings:

- J1-001, High: Leaving a module out, which the review sheet offers as the way past a Will refuse limit, ends with Submit refused as "unknown module CP-MODEL" and no run starts.
- R1-003, Medium: The Teams cards count CP-MODEL as a module, so a run that finished every requested module reads '13/14 modules'; T02 makes such runs reachable.

Files: `web/src/pages/connected/api.ts`, `src/deploy_workflow/inbox/scheduler.py`, `web/src/pages/connected/StartRun.tsx`, `src/deploy_workflow/inbox/runs.py`, `src/deploy_workflow/inbox/teams.py`

Probes:

- J1-001 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-001-leave-out-refused-at-submit.cjs`
- R1-003 (none): `found by repair-1's T02 review (2026-11-17); the T02 test is the probe`

Touches money, ordering or security code: run ordering and module selection (scheduler).

## T03 (group 1). Run reasons in the reader's words, not launcher codes, log paths or module codes

Findings:

- C1-013, Medium: Run reasons are drawn exactly as the scheduler wrote them: launcher exit codes and log paths, and (from the library's refusals) module codes such as 'CP-1' and delivery file paths.

Files: `web/src/pages/connected/RunActivity.tsx`, `web/src/pages/connected/RunProgress.tsx`, `react_frontend/run_activity.py`

Probes:

- C1-013 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-013-raw-run-reasons.cjs`

Touches money, ordering or security code: no.

## T04 (group 1). Run page states: errors, a finished run without a report, the re-announced alert, the failed-run module state

Findings:

- C1-004, Medium: Run and report error states are one plain red line with no icon or action, and say the wrong thing: an unknown report reads 'could not be loaded' and an unknown run reads 'unknown run'.
- C1-005, Medium: A finished run with no published report polls every 2 seconds for ever and keeps saying 'Waiting for the report to become available…'.
- C1-024, Medium: The run page removes and re-inserts its red error alert on every 2-second poll, so a screen reader announces the same error again every cycle and the line flickers.
- J5-001, Medium: On a failed run the refused module is labelled Interrupted while the run reads Failed, three 'Module draft rejected.' events give no reason, and nothing on the page says why the run stopped or what to change.

Files: `web/src/pages/connected/RunProgress.tsx`, `web/src/pages/connected/layout.tsx`, `web/src/pages/connected/useResource.ts`, `web/src/pages/connected/runFigures.ts`, `react_frontend/run_activity.py`

Probes:

- C1-004 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-004-error-states.cjs`
- C1-005 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-005-finished-run-waits-forever.cjs`
- C1-024 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-024-alert-reannounced-every-poll.cjs`
- J5-001 (output): `docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-001-failed-run-explanation.cjs`

Touches money, ordering or security code: no.

Note: C1-004 covers the run pages; its report half is T17 (C3-007).

## T05 (group 1). Library and Run activity states: empty library, clipped tables, live region, failed poll

Findings:

- C1-002, Medium: The empty Library is a bare 'No reports yet' card with no icon, no explanation and no next step, drawn under filter and layout controls that have nothing to act on.
- C1-003, Medium: Run activity's Waiting and Ended tables are cut off inside overflow-hidden panels: the Pathway column is clipped at 1280 to 1440 px and Ended, State and Reason cannot be seen or scrolled to on a phone.
- C1-006, Medium: Run activity changes run state on screen every 5 seconds but exposes no live region, so a screen-reader user is never told that a run started, ended, failed or was capped.
- C1-031, Medium: When one poll of Run activity fails, every run and the counts disappear behind a neutral empty-state panel with a magnifier icon, no alert role and no tone; the same icon is used for 'No run in progress'.

Files: `web/src/pages/connected/LibraryIndex.tsx`, `web/src/pages/connected/RunActivity.tsx`, `web/src/pages/connected/RunProgress.tsx`

Probes:

- C1-002 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-002-library-empty-state.cjs`
- C1-003 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-003-run-activity-table-clipping.cjs`
- C1-006 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-006-run-activity-no-live-region.cjs`
- C1-031 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-031-run-activity-read-failure.cjs`

Touches money, ordering or security code: no.

Note: Use web/src/components/application/empty-state/empty-state.tsx as it is; do not change it.

## T06 (group 1). Connected page changes move focus to the new page

Findings:

- J5-003, Medium: With the keyboard only, every change of page (Start a run, Start synthetic run, Open report, Open in Evidence, Back) leaves focus on the page body, so the next Tab begins again at 'Skip to content' and the reader pays 4 to 14 Tab stops to get back to the content.

Files: `web/src/pages/connected/ConnectedApp.tsx`, `web/src/pages/connected/layout.tsx`

Probes:

- J5-003 (output): `docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-003-focus-lost-on-navigation.cjs`

Touches money, ordering or security code: no.

Note: Route changes between connected pages only; hash changes inside the report are T14 and the drawer's Open in Evidence is T24.

## T07 (group 1). Start a run: no example issuer typed in; history per step; keep the form on leaving; carry-over keeps documents; focus after Carry over

Findings:

- J2-002, Medium: Start a run opens with an example issuer already typed into the required Issuer name and Issuer ID fields, and today's date as the case date.
- C2-002 (with J2-001), Medium: Moving between steps adds no browser history entry, so Back, Reload or the Library link silently discards every document, answer and approval typed so far.
- C2-003, Medium: Start from an earlier run says it copies the earlier answers but drops which documents are the agreement and the portfolio workbook, so the review opens with 'Will refuse: Legal & covenants'.
- C2-005, Medium: Pressing Carry over from latest run leaves keyboard focus on the page body and announces nothing, because the button is replaced by 'This is a different issuer'.

Files: `react_frontend/__init__.py`, `web/src/pages/connected/StartRun.tsx`

Probes:

- J2-002 (output): `docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-002-prefilled-example-issuer.cjs`
- C2-002 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p10-navigation.cjs`
- C2-002 (output): `docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-001-leave-mid-form.cjs`
- C2-003 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p13-from-run.cjs`
- C2-005 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p06-carry-over.cjs`

Touches money, ordering or security code: no.

## T08 (group 1). Start a run: option-load failure, raw Submit errors, Submit failure shown beside Submit, required periods marked

Findings:

- C2-004, Medium: When the run options cannot be loaded the page shows the raw service text in a plain box with no action beneath an intro that still invites the analyst to start, and loading is a text line.
- C2-006, Medium: A failed Submit or a refused request reaches the analyst as the browser's raw 'Failed to fetch' or a lowercase service fragment run into the next sentence.
- J2-013, Medium: When the Submit request fails, the dialog closes and the message is drawn 2,900 px above the Submit button, so the analyst sees nothing change and cannot tell whether the run started.
- J1-004, Medium: For Earnings Update, Current period and Prior period are required, but the step says "Optional", neither field is marked, and the only signal is the browser's own tooltip.

Files: `web/src/pages/connected/StartRun.tsx`, `web/src/pages/connected/api.ts`, `web/src/pages/connected/useResource.ts`

Probes:

- C2-004 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p12-states.cjs`
- C2-006 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p12-states.cjs`
- J2-013 (output): `docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-013-failed-submit-message-offscreen.cjs`
- J1-004 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-004-earnings-update-required-periods.cjs`

Touches money, ordering or security code: no.

## T09 (group 1). Start a run: document refusals name the file and mark its row; Issuer ID never merges two issuers

Findings:

- J2-003 (with C2-011, J2-007), Medium: An unreadable document is reported as a raw Python decoder error for one file only, and no row is marked, so the analyst cannot tell which of several files is the problem.
- J5-004 (with C2-014), Medium: The Issuer ID built from the name is cut at 40 characters, so two different issuers with long names that share their first 40 characters get one ID; the Library shows one card under the later run's name and the other issuer cannot be found by name. Ruling: two issuers merged under one ID is corrupted data, always repaired (R3); long legal names sharing 40 characters are ordinary

Files: `web/src/pages/connected/StartRun.tsx`, `web/src/pages/connected/start/plain.ts`

Probes:

- J2-003 (output): `docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-003-unreadable-document-message.cjs`
- J2-003 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p04-document-types.cjs`
- J2-003 (output): `docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-documents-step-mistakes.cjs`
- J5-004 (output): `docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-004-long-names-share-issuer-id.cjs`
- J5-004 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p05-identity.cjs`

Touches money, ordering or security code: data identity (two issuers under one ID).

## T10 (group 1). Abandoned forms must not use up the 50 unfinished drafts

Findings:

- C2-008, Medium: The page leaves a server-side draft behind whenever the form is abandoned, and after 50 drafts every new form fails with 'too many unfinished submissions; try again later' for up to 24 hours.

Files: `web/src/pages/connected/StartRun.tsx`, `src/deploy_workflow/run_start/submissions.py`

Probes:

- C2-008 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p22-submit-no-run-and-drafts.cjs`

Touches money, ordering or security code: service state (drafts).

## T11 (group 1). Review sheet: long names at 390 px; decisions that block Submit first

Findings:

- C2-001, Medium: At 390 px a file name or issuer name with no spaces widens the whole review sheet, clipping every Edit button, the file name and the Submit button.
- C2-007, Medium: The decisions that block Submit sit at the bottom of the review sheet, after about 2,700 px (3,600 px at 390 px) of echoed inputs and 20 'Not given' rows.

Files: `web/src/pages/connected/start/ReviewSheet.tsx`

Probes:

- C2-001 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p20-narrow-review-overflow.cjs`
- C2-007 (output): `node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p23-review-order.cjs`

Touches money, ordering or security code: no.

## T12 (group 1). Synthetic proof: documented steps complete a run; a refused module is reported as such

Findings:

- B0-003 (with J1-014), Medium: Following the documented manual synthetic run in docs/react-workflow.md ends Failed at Legal & covenants; the run completes only if the credit agreement is also uploaded and chosen as the executed agreement, which the document does not say.
- J1-002, Medium: An analyst who accepts the review sheet's Will refuse limit gets a Failed run with the reason "stopped: checker", four of 14 modules finished and no report, not the five limited modules the sheet described.

Files: `docs/react-workflow.md`, `proof/launcher.py`

Probes:

- B0-003 (none): `npm --prefix web run proof:connected (passes with the agreement); the failing path is the text of docs/react-workflow.md:110-118 followed by hand`
- B0-003 (none): `docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-journey.cjs`
- J1-002 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-002-accepted-limit-fails-run.cjs`

Touches money, ordering or security code: no.

Note: Do not change proof/handoffs/ (canned module output).

## T13 (group 2). Chart values: read a decimal comma correctly; keep the Basis and limitation column in the Table form

Findings:

- C4-028, High: A published value written with a decimal comma ('3,75') is read as 375 and its bar is drawn at 375 beside 2.80. Ruling: a wrong figure (3,75 drawn as 375) is High and always repaired (R3); a decimal comma in model-written text is an ordinary input
- C3-029 (with C4-005), Medium: A chart's Table form omits the 'Basis and limitation' column, so a row's limitation (for example 'gross debt includes finance leases') is visible only inside the trace drawer, while the same column is drawn in plain tables on the same page.

Files: `web/src/pages/connected/visuals/visualData.ts`, `web/src/components/chart/ChartTable.tsx`, `web/src/components/chart/TrendChart.tsx`

Probes:

- C4-028 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-027-amount-forms.cjs`
- C3-029 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p18-chart-table-basis.cjs`
- C3-029 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-005-table-form-basis.cjs`

Touches money, ordering or security code: figures (a wrong value on a chart).

Note: R2-001 (Low) is repaired here by ruling L11; it does not need a verify verdict to be in a task.

## T14 (group 2). Modules page: scroll, focus and Back after a module change; the Module select; On this page; figures after the prose

Findings:

- C3-002 (with C3-003, C4-034, J3-001), Medium: After the reader chooses another module in the Modules navigator (link by keyboard, or the Module select at 390 px), keyboard focus drops to <body>.
- C3-004 (with C5-006), Medium: Below 1001 px the Module select navigates on every ArrowDown, so a keyboard user cannot browse the options without changing page each time.
- C3-005, Medium: 'On this page' lists 'Key findings' on Financial foundation, whose handoff wrote no Key findings (checked on all 14 modules: it is the only one); the entry scrolls to a table section.
- C3-028, Medium: On a module page the charts, event lanes and maps come between the Bottom line and Key findings, pushing Key findings, Contrary evidence and Limitations 1,200 to 1,600 px down. Ruling: OQ-02 decided (R10): move the figures block after the prose passages, before Limitations

Files: `web/src/pages/connected/report/Modules.tsx`, `web/src/pages/connected/ReportLibrary.tsx`, `web/src/pages/connected/report/Evidence.tsx`, `web/src/pages/connected/report/RunCharts.tsx`

Probes:

- C3-002 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p02-focus-after-module-switch.cjs`
- C3-002 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p03-scroll-after-module-switch.cjs`
- C3-002 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-034-scroll-after-link.cjs`
- C3-002 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J3/probes/j3-001-back-loses-place.cjs`
- C3-004 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p04-select-navigates-on-arrow.cjs`
- C3-004 (exit): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/select-arrow.cjs`
- C3-005 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p05-key-findings-label-cp1.cjs`
- C3-028 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p19-module-reading-order.cjs`

Touches money, ordering or security code: no.

## T15 (group 2). Headline figures: a trace control on each tile; a stated gap for a figure not supplied

Findings:

- C3-001 (with J3-003, J4-001), Medium: The five headline figure tiles on Overview (Net leverage, Gross leverage, Interest coverage, Revenue, Cash) have no trace control, so a headline number cannot be traced to its source.
- C3-020 (with C1-009, J4-007), Medium: A headline figure the module could not supply (Adjusted EBITDA FY2024, 'Not supplied') gets no tile and no stated gap; the reader cannot tell that it is missing. Ruling: a missing figure silently dropped breaks D-14 and AGENTS.md missing-versus-zero; adding a stated gap removes nothing (R5 not engaged)

Files: `web/src/pages/connected/HeadlineFigures.tsx`, `web/src/pages/connected/ReportLibrary.tsx`, `web/src/pages/connected/reportView.ts`

Probes:

- C3-001 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p01-headline-figures-no-trace.cjs`
- C3-001 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J3/probes/j3-003-headline-figures-untraceable.cjs`
- C3-001 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-001-overview-tiles-no-trace.mjs`
- C3-020 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p14-injection-states.cjs`
- C3-020 (exit): `none`
- C3-020 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-007-missing-tile-dropped.mjs`

Touches money, ordering or security code: figures.

## T16 (group 2). No module codes, tool names or unexplained shorthand in reader text

Findings:

- C3-006 (with C5-026), Medium: The trace drawer prints a module code ('CP-0') in a sentence the service wrote: 'the Basis file is not in the CP-0 inventory'.
- C4-001 (with J3-005, J4-009), Medium: The Forecast tab prints module codes, the words 'Python' and 'handoff', and a raw code-bearing gap reason in reader text.
- C5-008, Medium: Every handoff evidence view draws the handoff's title as a bare module-code heading ("CP-1" ... "CP-DR"), next to the module name in the card title.

Files: `src/deploy_workflow/credit_os_chips.py`, `src/deploy_workflow/owners/cpos_forecast.py`, `web/src/pages/connected/report/Forecast.tsx`, `web/src/pages/connected/report/Calendar.tsx`, `web/src/pages/connected/report/RunCharts.tsx`, `web/src/pages/connected/visuals/ForecastTable.tsx`, `web/src/pages/connected/visuals/LegacyForecast.tsx`, `web/src/pages/connected/publishedReport.ts`, `web/src/pages/connected/report/Evidence.tsx`, `web/src/pages/connected/ReportContent.tsx`, `web/src/pages/connected/sourceFiles.ts`

Probes:

- C3-006 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p06-drawer-module-code.cjs`
- C3-006 (exit): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/codes-on-evidence.cjs`
- C4-001 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-001-codes-in-text.cjs`
- C4-001 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J3/probes/j3-005-forecast-module-codes.cjs`
- C4-001 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-low-checks.mjs`
- C5-008 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/codes-on-evidence.cjs`

Touches money, ordering or security code: delivery text (src/deploy_workflow/owners): change only delivery's own wording, never a module-written passage, value or qualification.

## T17 (group 2). Report frame: error states, Earlier format and Earlier methods labels, key charts on Overview, report history rows, CP-8 kept off Overview

Findings:

- C3-007 (with J2-016, J5-007), Medium: Report error states give the reader no cause and no next step: a failed or unknown run reads 'The published report could not be loaded.', a network failure prints the browser's own 'Failed to fetch', and neither offers retry, Run activity or the Library.
- C3-008, Medium: A run in the earlier format or with changed methods is not labelled 'Earlier format' or 'Earlier methods' on Overview or Changes; neither string exists in the connected app.
- C3-024, Medium: Overview draws no key charts and no 'Chart index' link, although the run holds data for catalogue rows that name Overview (Source readiness map, Credit-risk transmission, Monitoring triggers, issuer events).
- C1-007, Medium: Report history rows omit the modules run and each run's status, and no row can carry 'Earlier format' or 'Earlier methods'.
- C3-026, Medium: When CP-8 delivered, Overview lists CP-8's Bottom line under 'Bottom line by module' and its limitations under 'Limitations', although CP-8's findings belong only on the Changes tab.

Files: `web/src/pages/connected/ReportLibrary.tsx`, `web/src/pages/connected/publishedReport.ts`, `web/src/pages/connected/reportView.ts`

Probes:

- C3-007 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p07-report-error-states.cjs`
- C3-007 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-016-report-address-while-running.cjs`
- C3-007 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-low-checks.cjs`
- C3-008 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p08-earlier-format-label.cjs`
- C3-024 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p15-overview-key-charts-and-module-search.cjs`
- C1-007 (exit): `docs/audit/2026-11-16-final/output/2-sections/C1/probes/c1-007-report-history-lacks-labels.cjs`
- C3-026 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p16-cp8-on-overview.cjs`

Touches money, ordering or security code: no.

## T18 (group 2). Forecast tab: one gap ledger, a drawer per figure, stated trace loss, long words wrap, shock and drivers stated

Findings:

- C4-002, Medium: A gap ledger of ten near-identical limitation bullets is drawn on the Forecast findings page, and the same qualifications are drawn twice more.
- C4-003 (with C5-004), Medium: Every trace control on the Forecast model opens the same drawer, titled 'Forecast inputs (machine-readable)', whose statement is generic.
- C4-025, Medium: When the published model cannot be matched to exactly one forward-credit handoff, every trace control on the Forecast model disappears and the page does not say so.
- C4-026, Medium: One long unbroken word in a model note, limitation, case description or scenario anchor widens the whole report page. Ruling: long unbroken tokens (64-hex hashes, URLs, file names) are ordinary in handoff text
- J4-003 (with C4-019), Medium: The Forecast page's Forecast assumptions section shows 'Observed \| Not supplied: nothing to report', and the page never states the downside shock or the drivers the numbers rest on.

Files: `web/src/pages/connected/visuals/LegacyForecast.tsx`, `web/src/pages/connected/report/Forecast.tsx`, `web/src/pages/connected/report/Downside.tsx`, `src/deploy_workflow/owners/cpos_periods.py`, `web/src/pages/connected/ReportContent.tsx`

Probes:

- C4-002 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-002-gap-ledger.cjs`
- C4-003 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-003-generic-drawer.cjs`
- C4-003 (exit): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/forecast-drawer.cjs`
- C4-025 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-025-silent-no-trace.cjs`
- C4-026 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-026-long-word.cjs`
- J4-003 (output): `docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-003-forecast-assumptions.mjs`
- J4-003 (output): `C4_STATE=units-usd C4_CHARS=3000 node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-states.cjs`

Touches money, ordering or security code: delivery text (src/deploy_workflow/owners).

## T19 (group 2). Charts: debt stack key, zero balance, cut-off value labels

Findings:

- C4-004, Medium: The Debt stack, drawn when one facility has no balance, is a bar of coloured segments with no key that ties a colour to a facility.
- X1-024, Medium: One debt part with a zero balance makes every Model page of that run unreadable in the static app.
- X1-019, Medium: In a group of three or more series, the value label of the middle series is cut off at the top of the drawing when its bar reaches the top tick.
- R2-003, High: The debt stack reads each cell on its own, so a column mixing '3,75' with '2,800' draws 3,75 as 375.

Files: `web/src/pages/connected/visuals/charts.tsx`, `web/src/components/chart/StackChart.tsx`, `web/src/pages/model/slice/read-sections.ts`, `web/src/components/chart/BarCanvas.tsx`, `web/src/components/chart/ColumnsChart.tsx`

Probes:

- C4-004 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-004-debt-stack-key.cjs`
- X1-024 (output): `docs/audit/2026-11-16-final/output/2-sections/X1/probes/stack-zero-static.mjs`
- X1-019 (output): `docs/audit/2026-11-16-final/output/2-sections/X1/probes/charts.mjs`
- R2-003 (none): `found by repair-2 (2026-11-17); the T19 follow-up test is the probe`

Touches money, ordering or security code: figures.

## T20 (group 2). Issuer calendar: one bad date hides no event

Findings:

- C4-007, Medium: One malformed date in a module's event table hides every event of that table, and the page says 'No dated events were published for this run' above a card saying the dates could not be plotted. Ruling: lost data: one bad date hides every event; model-written dates are ordinary inputs (R3)

Files: `web/src/pages/connected/report/Calendar.tsx`

Probes:

- C4-007 (exit): `node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-007-calendar-bad-date.cjs`

Touches money, ordering or security code: lost data.

## T21 (group 2). Evidence tab: narrow widths, handoff view, gaps ordered by severity, sources listed only, Trace start state

Findings:

- C5-002, Medium: At 390 px the Gaps ledger and the Comparison measures table push every card on the tab past the window edge, and the report area scrolls sideways.
- C5-009 (with J3-013), Medium: The handoff evidence view looks like rendered Markdown: literal "- " bullets with 64-hex hashes in the body font, handoff section names as headings, and (on a forecast line) a literal ```json fence.
- C5-010, Medium: The Gaps ledger is not grouped or ordered by severity.
- C5-011, Medium: Evidence > Sources opens the supplied source files (the workbook downloads), although ruling decision 9 says files are "listed only, not downloadable or viewable". Ruling: OQ-04 decided (R10): list supplied source files only, with no link to open them (decision 9)
- J3-007 (with C5-036), Medium: Evidence > Trace with no item chosen shows the same 15 handoff download buttons as Summary and no line telling the reader how to pick something to trace.

Files: `web/src/pages/connected/report/Evidence.tsx`, `web/src/pages/connected/sourceFiles.ts`, `web/src/pages/library/parts/TraceDrawer.tsx`, `web/src/pages/library/parts/SourceFileLinks.tsx`

Probes:

- C5-002 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/gaps-390.cjs`
- C5-009 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/handoff-markdown-look.cjs`
- C5-009 (output): `journey.md step 5 (observed; a probe is required only from Medium)`
- C5-010 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/gaps-order.cjs`
- C5-011 (none): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/downloads-browser.cjs`
- J3-007 (output): `docs/audit/2026-11-16-final/output/3-journeys/J3/probes/j3-007-trace-tab-no-selection.cjs`
- J3-007 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/evidence-tabs-filter.cjs`

Touches money, ordering or security code: no.

Note: C5-011 follows OQ-04: list supplied files only, with no link to open them.

## T22 (group 2). Report content: confidence method and inputs; keyboard reach of scrolling tables

Findings:

- C5-003 (with J4-005, J3-015), Medium: The trace drawer of the Confidence score lists 14 identical "no page" entries instead of the confidence inputs it is computed from.
- C5-007 (with J5-002), Medium: Handoff tables with fewer than five columns scroll sideways at 390 px but cannot be reached or scrolled with the keyboard.

Files: `web/src/pages/connected/ReportContent.tsx`, `src/deploy_workflow/confidence.py`

Probes:

- C5-003 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/confidence-drawer.cjs`
- C5-003 (output): `docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-005-confidence-method.mjs`
- C5-003 (output): `journey.md step 3 (observed; a probe is required only from Medium)`
- C5-007 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/scroll-regions-390.cjs`
- C5-007 (output): `docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-002-narrow-tables-cut-off.cjs`

Touches money, ordering or security code: figures (confidence score).

## T23 (group 2). Model and calculation files: state while loading and when empty

Findings:

- C5-012, Medium: "Model and calculation files" shows its heading and nothing else while the listing loads, and stays blank for good if the reply has no files array.

Files: `web/src/pages/connected/report/ArtifactDownloads.tsx`

Probes:

- C5-012 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/loading-states.cjs`

Touches money, ordering or security code: no.

## T24 (group 2). Open in Evidence from a drawer moves focus to the Evidence content

Findings:

- C5-034, Medium: After "Open in Evidence" is activated from a drawer, keyboard focus is on the document body, not on the Evidence content.

Files: `web/src/pages/library/parts/TraceDrawer.tsx`

Probes:

- C5-034 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/focus-after-open-in-evidence.cjs`

Touches money, ordering or security code: no.

## T25 (group 3). Static app says it is a design reference; the kit leaves the rail

Findings:

- S6-003 (with J6-010), Medium: Only 7 of 17 populated static run pages say they are a saved example; the Start step offers a 'Start a paid run?' dialog and the next page says 'Run started' although nothing is started or spent. Ruling: OQ-01 decided (R10): say on the static pages that they are a design reference with sample data; name the saved example in the Submit dialog and on Run started
- S1-004 (with X1-018), Medium: The component kit, a developer page with sample figures, buttons that do nothing and looping animations, is offered to readers as a rail item of the static app. Ruling: OQ-05 decided (R10): remove the kit from the rail; #/kit stays reachable by address

Files: `web/src/shell/Shell.tsx`, `web/src/App.tsx`, `web/src/pages/run/start/Start.tsx`, `web/src/pages/run/start/Started.tsx`

Probes:

- S6-003 (exit): `docs/audit/2026-11-16-final/output/2-sections/S6/probes/s6-saved-example-label.mjs`
- S6-003 (exit): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-static-submit-claims-run-started.cjs`
- S1-004 (output): `docs/audit/2026-11-16-final/output/2-sections/S1/probes/kit-in-rail.mjs`
- S1-004 (output): `grep -c 'kit' docs/audit/2026-11-16-final/output/1-rubrics/content-matrix.csv docs/audit/2026-11-16-final/output/1-rubrics/control-matrix.csv`

Touches money, ordering or security code: no.

Note: OQ-01 and OQ-05: label every static page as a design reference with sample data; name the saved example in the Submit dialog and on Run started; #/kit stays reachable by address.

## T26 (group 3). Static Start a run and New run open the run start

Findings:

- S1-001 (with J6-005), High: The library's "Start a run" button opens Run activity (a saved running example), not the run start page.

Files: `web/src/pages/library/Home.tsx`, `web/src/pages/library/parts/links.ts`, `web/src/pages/library/History.tsx`, `web/src/pages/run/routes.tsx`

Probes:

- S1-001 (output): `docs/audit/2026-11-16-final/output/2-sections/S1/probes/start-a-run-link.mjs`
- S1-001 (output): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-start-run-buttons-lead-to-example.cjs`

Touches money, ordering or security code: no.

## T27 (group 3). Static route change: title, focus and scroll

Findings:

- S1-002 (with S2-003, S2-013, S3-001, S4-004, S4-020, S5-017, J6-011, J6-002, J6-003), Medium: Every page has the title "Credit OS", and moving between pages through the rail moves no focus and announces nothing.

Files: `web/src/App.tsx`, `web/src/shell/Shell.tsx`, `web/src/pages/route-table.ts`, `web/src/pages/library/routes.tsx`, `web/src/pages/model/routes.tsx`, `web/src/pages/library/Evidence.tsx`, `web/src/pages/library/parts/EvidenceFrame.tsx`, `web/src/pages/library/Module.tsx`, `web/src/pages/library/parts/ModuleNav.tsx`

Probes:

- S1-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S1/probes/title-and-route-change.mjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/scroll-after-navigation.mjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/offline-fonts-title.mjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-001.mjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs focus-after-tab`
- S1-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs title`
- S1-002 (output): `node docs/audit/2026-11-16-final/output/2-sections/S5/probes/p-misc.mjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-low-checks.cjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-scroll-carried-across-pages.cjs`
- S1-002 (output): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-focus-lost-after-tab-activation.cjs`

Touches money, ordering or security code: no.

## T28 (group 3). Rail label is part of its link on narrow screens

Findings:

- S1-003, Medium: On a phone-width screen the visible label under each rail icon is not part of the link, so tapping it does nothing, and the label is read a second time as plain text.

Files: `web/src/components/application/app-navigation/base-components/nav-button.tsx`, `web/src/shell/Shell.tsx`

Probes:

- S1-003 (output): `docs/audit/2026-11-16-final/output/2-sections/S1/probes/rail-label-tap.mjs`

Touches money, ordering or security code: no.

## T29 (group 3). A focus-opened tooltip stays open

Findings:

- S1-005, Medium: A tooltip that keyboard focus opens is closed again by the scroll that the same focus causes, so the text of a trigger below the fold is not shown on first arrival.

Files: `web/src/components/base/tooltip/tooltip.tsx`, `web/src/components/metric/MetricCard.tsx`

Probes:

- S1-005 (output): `docs/audit/2026-11-16-final/output/2-sections/S1/probes/tooltip-scroll-close.mjs`

Touches money, ordering or security code: no.

## T30 (group 3). Focus after Clear filters and Show all

Findings:

- S1-006 (with S2-014), Medium: Pressing "Clear filters" in the no-match state drops focus to the page body, and the control is absent from the stage 0 inventory.
- S4-005, Medium: Activating 'Show all items' or 'Show all files' in the empty state sends focus to the document body.

Files: `web/src/pages/library/Home.tsx`, `web/src/pages/library/EvidenceSources.tsx`, `web/src/pages/library/EvidenceTrace.tsx`, `web/src/pages/library/parts/ModuleFilter.tsx`

Probes:

- S1-006 (output): `docs/audit/2026-11-16-final/output/2-sections/S1/probes/clear-filters-focus.mjs`
- S1-006 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/clear-filters-focus.mjs`
- S4-005 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs focus-after-clear`

Touches money, ordering or security code: no.

## T31 (group 3). Designed empty states on the shipped build

Findings:

- S2-002 (with S3-008, S4-013, J6-013), Medium: On the shipped build every S2 page says only 'This data file holds no library pages': no designed empty state, no explanation a reader can use and no way forward.

Files: `web/src/pages/library/parts/LibraryPage.tsx`, `web/src/pages/library/Home.tsx`

Probes:

- S2-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/shipped-empty-state.mjs`
- S2-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-008.mjs`
- S2-002 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs shipped-empty`
- S2-002 (output): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-low-checks.cjs`

Touches money, ordering or security code: no.

## T32 (group 3). Issuer history draws its runs

Findings:

- S2-001 (with J6-006), Medium: An issuer's history page draws none of its runs when the issuer has no readable report, although its subtitle counts them and its home card describes a finished run.

Files: `web/src/pages/library/History.tsx`, `web/src/pages/library/parts/RunFeed.tsx`

Probes:

- S2-001 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/history-hides-runs.mjs`
- S2-001 (output): `docs/audit/2026-11-16-final/output/3-journeys/J6/probes/j6-home-cards-vs-history.cjs`

Touches money, ordering or security code: no.

## T33 (group 3). Static Overview: qualifiers stay in their tile; Dates to watch traced

Findings:

- S2-005, Medium: A point's qualifier longer than a short label leaves its tile and widens the page at narrow widths, pushing the point's sentence out of view.
- S2-006, Medium: The Overview's 'Dates to watch' entries carry no trace control, although every other paragraph, row and figure on the page has one.

Files: `web/src/pages/library/Overview.tsx`, `web/src/pages/library/read.ts`, `web/src/pages/library/slice.ts`

Probes:

- S2-005 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/long-qualifier.mjs`
- S2-006 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/dates-no-trace.mjs`

Touches money, ordering or security code: no.

Note: slice.ts is imported by Signal; Signal's tests must pass.

## T34 (group 3). Changes table keeps kind, direction, cause and effect

Findings:

- S2-007, Medium: Switching the Changes page from Cards to Table drops each change's kind, direction words, cause and effect; only the measure and the two values remain.

Files: `web/src/pages/library/parts/ChangesTable.tsx`

Probes:

- S2-007 (output): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/changes-table-columns.mjs`

Touches money, ordering or security code: no.

## T35 (group 3). Trace control: visible focus on navy; a marker where a trace is missing

Findings:

- S3-002, Medium: The trace control on the Navy bottom-line band takes the Ultramarine focus ring, 2.4:1 against Navy, so keyboard focus is nearly invisible there.
- S3-007, Medium: Ten of the thirteen fixture modules draw their bottom line, key finding and limitation with no trace control, and Capital structure's statement table and four tests have none: a null trace silently draws nothing.

Files: `web/src/pages/library/parts/TraceControl.tsx`, `web/src/styles/theme.css`, `web/src/pages/library/slice.ts`

Probes:

- S3-002 (exit): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-002.mjs`
- S3-007 (exit): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-007.mjs`

Touches money, ordering or security code: no.

Note: theme.css and slice.ts are shared with Signal; Signal's tests must pass.

## T36 (group 3). Limitations header at narrow widths

Findings:

- S3-003 (with S2-004), Medium: At 480 px and below the Limitations header overflows its card, the page scrolls sideways, and reaching Collapse limitations by keyboard shifts the whole page 104 px left.

Files: `web/src/pages/library/parts/Limitations.tsx`

Probes:

- S3-003 (exit): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-003.mjs`
- S3-003 (exit): `docs/audit/2026-11-16-final/output/2-sections/S2/probes/reflow.mjs`

Touches money, ordering or security code: no.

## T37 (group 3). Module page: Limitations after the prose; navigator search and a narrow picker

Findings:

- S3-005, Medium: Limitations is drawn last, after every record block, although the matrix and rubric put it straight after the contrary evidence and change-of-view passages.
- S3-006 (with C3-025), Medium: The module navigator has no search at the top and no labelled picker on narrow screens: at 390 px a flat list of every module pushes the module's name 1,012 px down.

Files: `web/src/pages/library/Module.tsx`, `web/src/pages/library/parts/ModuleNav.tsx`

Probes:

- S3-005 (exit): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-005.mjs`
- S3-006 (exit): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-006.mjs`
- S3-006 (exit): `docs/audit/2026-11-16-final/output/2-sections/C3/probes/p15-overview-key-charts-and-module-search.cjs`

Touches money, ordering or security code: no.

## T38 (group 3). Run frame: readable Forecast reason; a run without a forecast still shows; no Show sources switch on Evidence

Findings:

- S3-011, Medium: The reason the Forecast tab is unavailable ('No forecast for this run') is 12 px grey at 2.19:1, helper text in the disabled colour.
- S5-001, Medium: A run with no forecast cannot be shown at all: the reader rejects the whole run, so the Forecast page has no 'no forecast was published' state and the run's Front page, Analysis, Model, Portfolio fit and Limitations vanish with it.
- C5-005 (with S4-019), Medium: The page-level "Show sources" switch changes state on every Evidence tab but there is nothing for it to reveal. Ruling: OQ-03 decided (R10): hide the Show sources switch on Evidence

Files: `web/src/pages/library/parts/RunFrame.tsx`, `web/src/pages/model/ForecastPage.tsx`, `web/src/pages/model/slice/read.ts`

Probes:

- S3-011 (exit): `docs/audit/2026-11-16-final/output/2-sections/S3/probes/S3-011.mjs`
- S5-001 (output): `node docs/audit/2026-11-16-final/output/2-sections/S5/probes/p-noforecast.mjs`
- C5-005 (output): `docs/audit/2026-11-16-final/output/2-sections/C5/probes/switch-inert-on-evidence.cjs`
- C5-005 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs inert-switch`

Touches money, ordering or security code: no.

Note: C5-005 follows OQ-03: hide the switch on Evidence (RunFrame is drawn by both surfaces).

## T39 (group 3). Static Evidence: module filter held across tabs; tables at 390 px; Record without module codes and with partial totals stated

Findings:

- S4-006, Medium: The module filter is drawn on three of the five Evidence tabs and resets to 'All' on every tab change. Ruling: OQ-10 decided (R10): hold the chosen module above the five Evidence tabs and apply it on each
- S4-007, Medium: At 390 px the Gaps, Trace and Registers tables scroll sideways inside their card with no cue: 'Effect on the view' and 'Shown as' are off screen, and 'Recovery', 'Peer comparison' and 'Financial performance' break mid-word.
- S4-008, Medium: The Model calls table on Record shows a 'Code' column of module codes (CP-1A, CP-2C, CP-3B, CP-2E) beside each module's name. Ruling: OQ-10 decided (R10): remove the Code column from Record's Model calls table
- S4-009, Medium: Record's Model calls table lists four of thirteen modules but its Total row (41 calls, 6 retries, USD 11.40) does not say so; Module timings lists six of thirteen with no way to see the rest.

Files: `web/src/pages/library/Evidence.tsx`, `web/src/pages/library/parts/ModuleFilter.tsx`, `web/src/pages/library/parts/RegisterTable.tsx`, `web/src/pages/library/EvidenceRecord.tsx`

Probes:

- S4-006 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs filter-scope`
- S4-007 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs narrow-table`
- S4-008 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs module-codes`
- S4-009 (output): `docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs record-partial`

Touches money, ordering or security code: no.

## T40 (group 3). Model pages: unreadable run message, trace drawer in place, statements at 390 px, tap-reachable definitions

Findings:

- S5-002, Medium: An unreadable run is explained to the reader with the reader's raw field path ('runs[1].front.headline: missing') and listed by its raw issuer slug and run id.
- S5-004, Medium: A trace control on the Model pages is a plain link that leaves the Model for the Evidence page: it opens no drawer, and Back returns a reset page (case choice, scroll position and focus lost). Ruling: OQ-10 decided (R10): open the trace drawer in place from the Model's trace controls
- S5-005, Medium: At 390 px the Statements table cannot be read: the sticky label column takes 224 of the table's 260 px, leaving a 36 px window for the figures.
- S5-008, Medium: Metric definitions and the reasons behind n.a. and Withheld cells appear only as hover or focus tooltips; a tap on a touch device shows nothing.

Files: `web/src/pages/model/RunsIndexPage.tsx`, `web/src/pages/model/parts/RunPage.tsx`, `web/src/pages/model/parts/TraceControl.tsx`, `web/src/pages/model/parts/StatementTable.tsx`, `web/src/pages/model/parts/MetricTile.tsx`

Probes:

- S5-002 (output): `node docs/audit/2026-11-16-final/output/2-sections/S5/probes/p-noforecast.mjs`
- S5-004 (output): `node docs/audit/2026-11-16-final/output/2-sections/S5/probes/p-trace-nav.mjs`
- S5-005 (output): `node docs/audit/2026-11-16-final/output/2-sections/S5/probes/p-narrow-390.mjs`
- S5-008 (output): `node docs/audit/2026-11-16-final/output/2-sections/S5/probes/p-touch-tooltips.mjs`

Touches money, ordering or security code: no.

Note: S5-004 follows OQ-10: open the library's TraceDrawer in place; use TraceDrawer as it is (group 2 owns it).

## T41 (group 3). Static run pages: focus ring, focus after Submit, Runs breadcrumb, wrapping label chip

Findings:

- S6-001, Medium: The focused Purpose card is drawn exactly like the selected, unfocused one: the focus outline is declared but never painted.
- S6-002, Medium: Confirming the Submit dialog removes the Submit button and leaves keyboard focus on the document body; the new 'Run started' panel is not announced or focused.
- S6-007, Medium: The 'Runs' breadcrumb opens #/run, which draws the one run the slice calls current (the running one), not a list of runs; no static page lists runs in progress, the queue or ended runs.
- S6-010, Medium: A run's label chip cannot wrap: the fixture's own long label ('Full credit review with every optional module and a late cut-off') is cut off at 390 px, and one unbroken label pushes Stop run off the page at 1440 px.

Files: `web/src/pages/run/start/Purpose.tsx`, `web/src/pages/run/start/Start.tsx`, `web/src/pages/run/activity/ActivityPage.tsx`, `web/src/components/base/badges/badges.tsx`

Probes:

- S6-001 (exit): `docs/audit/2026-11-16-final/output/2-sections/S6/probes/s6-radio-focus.mjs`
- S6-002 (exit): `docs/audit/2026-11-16-final/output/2-sections/S6/probes/s6-submit-focus.mjs`
- S6-007 (exit): `docs/audit/2026-11-16-final/output/2-sections/S6/probes/s6-runs-link.mjs`
- S6-010 (exit): `docs/audit/2026-11-16-final/output/2-sections/S6/probes/s6-long-label.mjs`

Touches money, ordering or security code: no.
