# C4 section audit: Report, forecast and visuals

Audited tree: `/home/user/credit-os2` at the stage 2 start (2026-11-17). Service: `proof.serve` on port 8734, root `/tmp/cs-C4/root`, one synthetic run with the executed agreement (`northbridge-credit-agreement.txt` chosen), Chromium headless shell with every host but loopback aborted. No paid call, no `--live`. Nothing outside `output/2-sections/C4/` was written; no application code, service or git state changed. The service on 8734 was stopped at the end.

## Result

37 findings: 0 High, 10 Medium, 24 Low, 3 Info (`findings.jsonl`). Offline (R8): 0 requests to another host, 0 console errors or warnings, 0 failed requests across Forecast, Calendar and five module pages at 1440 and 390 px (`probes/c4-offline-check.cjs`); both font families (Geist, Schibsted Grotesk), every chart and every icon drew. No figure on any screen disagreed with its handoff (see Figures below), so there is no High.

Medium findings, in the order a reader meets them:
- C4-001 module codes, "Python", "handoff" and "Sent back by the build" in Forecast sentences and gap reasons; C4-002 a ten-line gap ledger on Forecast;
- C4-003 every model trace control opens one generic drawer titled "Forecast inputs (machine-readable)"; C4-025 all model trace controls vanish silently when the model matches no single handoff;
- C4-004 Debt stack segments carry no key; C4-005 chart Table forms omit the Basis and limitation column (owner decision: matrix and voice standard disagree);
- C4-007 one bad calendar date hides every event of that table under a false "No dated events" headline;
- C4-034 a module link at the foot of Forecast opens the module page scrolled part-way down with focus on the body;
- C4-026 one long unbroken word widens the whole report page; C4-028 "3,75" plotted as 375 (these two are unusual inputs, parked under R3).

## Method and what was checked

1. Service and run: during the audit `c4-setup-run.cjs` drove the Start form (Northbridge synthetic files, executed agreement) to a finished run. After the controller's rework request, every probe starts its own service and completes its own run through `c4-lib.cjs`; `c4-setup-run.cjs` is now a debug helper only.
2. Wiring: every control of the inventory groups below was operated with mouse and keyboard and its effect checked (address, content, request, focus). Address checks used direct open, Back and Forward and reload.
3. States: loading, error, empty, partial, missing-versus-zero, long text and narrow width, reached by rewriting the JSON the service returns for `/connected/snapshot` and `/connected/portfolio` inside the browser (`probes/c4-states.cjs`); the service and the application were not edited. Intercepted states are labelled as such in each finding.
4. Design: the rubric (`design-rubric.md`) was applied rule by rule at 1440 and 390 px; findings cite `D-nn`. The impeccable skill was not used (not available in this session, R7).
5. Harmony: all 77 content-matrix rows and 3 control-matrix rows with section C4, nine unaccounted items and seven retired-list checks are in `harmony.csv`.
6. Figures: against the handoffs in the run root (`deliveries/<model>/CP-*.md`, `forecast_exact.json`): 24 grid figures recomputed from the inputs (revenue, EBITDA, interest, cash proxy, closing cash and debt, net debt, leverage, coverage); 12 run-chart figures (CP-1 leverage 3.75/3.00/2.80/2.25, interest cover 3.20/4.00, liquidity 300/450/275/400, maturities 500/n.a./1,250, revenue/EBITDA, stack 1,200/800/n.a., bridge 410/30/-10/430; CP-2D 900/120/-450/570; CP-3C 500/300/1,250/n.a.; CP-4 5.0/4.2, 2.0/2.6, 100/n.a.; CP-6 2.37/2.50, 3.73/5.00); Downside 10.00/0.00/-5.1250, 3.10/2.00/1.40, 1.25/1.30; break points 0.10/0.15/0.32 and 0.20/0.12/n.a.; rate shocks 8.00/5.00, 16.00/n.a.; FX moves 0.00/800.00/2.00/4.00/3.05x/3.03x; Securities $93.80/$88.12, 7.0100%/8.9000%; 36 calendar events (date, precision, status, published). All matched; a mismatch would be High and none was found.

## Screens and controls covered (against `clickables.jsonl`, 349 lines for C4)

The inventory repeats each control once per revealed state, so lines exceed distinct controls. "Distinct" is what was operated.

| Group | Inventory lines | Distinct controls | Operated | Result |
| :--- | ---: | ---: | :--- | :--- |
| Forecast: trace buttons ("Show sources for ...") | 53 | 26 + 27 table-row + 3 in closed details | all 56, keyboard Enter to open, Escape/Close to return | open and return focus; names repeat (C4-009); drawers generic (C4-003) |
| Forecast: Chart/Table radiogroups and radios | 45 | 15 groups, 30 radios | all, mouse, Space, Enter, ArrowLeft/Right | switch; arrows move focus only (C4-008) |
| Forecast: case radiogroup and radios | 3 | 1 group, 2 radios | mouse, Space, ArrowUp/Down | selects; charts and grid follow; draws focus ring |
| Forecast: "On this page" buttons | 4 | 4 (+ mobile select) | mouse, Enter, select at 390 px | move focus and scroll (C4-017) |
| Forecast: disclosure buttons (rows, columns, hide) | 4 | 4 | mouse, Space | work; aria-expanded set |
| Forecast: details and summaries | 4 | 2 + 2 | mouse, Enter, Space | work |
| Forecast: links | 15 | 15 | Enter, Back and Forward | all reach the address they name |
| Forecast and Calendar: Show sources switch | 2 | 2 | Space | toggles; not kept on reload (in memory by design) |
| Forecast and Calendar: SR-only "Dismiss" | 59 | 1 distinct role | script click | closes the drawer; not a visible control |
| Calendar: trace buttons | 72 | 36 | all 36, keyboard | open, Escape returns focus |
| Calendar: Details buttons | 36 | 36 | all, mouse and Enter | aria-expanded and panel follow |
| Calendar: year markers | 36 | 36 | hover and click all | row lit, focus moves to row (C4-014) |
| Calendar: legend filters, Show all details | 4 | 4 | mouse | filters hide rows and markers; empty state stated |
| Calendar: Chart/Table radiogroup | 3 | 1 group, 2 radios | mouse, keyboard | switch (C4-008) |
| Calendar: links | 9 | 9 | Enter | all work, incl. Back to Overview |

Totals: 349 inventory lines mapped to 15 groups; all groups operated. Controls missing from the inventory: none found on the two tabs. Controls on screens the inventory does not cover (module pages that draw C4 components): Downside select, break-point basis select, Macro select, five Chart/Table toggles, six details were operated as well (C4-023, harmony U-08).

Screens: Forecast full (1440 and 390), Calendar full (1440 and 390), Modules pages for CP-2A, CP-2E, CP-3 (1440; CP-3 at 390), and the intercepted states listed below.

| State | How reached | Result |
| :--- | :--- | :--- |
| Forecast, no model | models emptied | "No forecast model was published from this run's files."; run charts still drawn |
| Forecast, no charts | charts and gaps emptied | "No charts were published for this run." |
| Chart gap, withheld module | gap descriptors; CP-4 not established | "Not established for this run" panel with reason; a code in the reason is shown raw (C4-001) |
| Calendar, no events; bad date; year gap; 250 events; long name | table rows rewritten | no-events text; C4-007; "No events 2026 to 2030"; renders in 4 s; wraps |
| Case with a missing cash proxy; negative cash; duplicate and seven cases; two models; USD millions; Upside and second-grid cases | grid rewritten | C4-010; C4-018; C4-022; C4-029; C4-001 |
| Error (HTTP 500), loading (4 s delay) | snapshot route | "The published report could not be loaded." and "Loading report..." (shell, C1) |
| No portfolio basis; covenant without threshold or with a negative value | portfolio and snapshot routes | C4-021 |
| Model matching no handoff | model download rewritten | C4-025 |
| Long unbroken words; amount forms; event named with a file name; chart rejected by the build; loading portfolio basis | text, cells and routes rewritten | C4-026, C4-027, C4-028, C4-030, C4-001, C4-031 |

## Code read (check 5)

Read in full: `Forecast.tsx`, `Calendar.tsx`, `RunCharts.tsx`, `PortfolioBasis.tsx`, `LegacyForecast.tsx`, `ForecastTable.tsx`, `EventLane.tsx`, `visualData.ts`, `drawnQualifications.ts`, `ChartQualifications.tsx`, `visuals/index.tsx`, the routing half of `charts.tsx`, and the view and render halves of `Downside.tsx`, `BreakPoints.tsx` (first 60 lines), `MacroSensitivity.tsx` (lines 113 to 355) and `Securities.tsx`. Findings: C4-017 (state never reconciled), C4-023 (one-option select), C4-033 (branches no repository producer reaches), C4-036 (delivery re-ranks break points), C4-001/-002/-005 (render paths). No handler that does nothing and no unused prop was found in these files; the one catch-all is the shared boundary below. `ConnectedLoadBoundary` (C1) replaces the whole page on any thrown chart contract error (about 100 `throw new Error` sites in `components/chart/`), which none of the states above triggered. Not read: `EdgeMap.tsx`, `PortfolioLimits.tsx`, `LegacyForecast.axes` tests and the unit tests of these files.

## Probes

All under `probes/`, run from the repository root; each probe starts its own `proof.serve` on `C4_PORT` (default 8734) with a fresh root, completes its own synthetic run, and stops the service when done (it refuses, exit 2, if the port is already in use): `c4-lib.cjs` (shared), `c4-states.cjs` (intercepted states), `c4-offline-check.cjs`, `c4-probe-001` to `c4-probe-007`, `c4-probe-021`, `c4-probe-023-024`, `c4-probe-025`, `c4-probe-026`, `c4-probe-027`, `c4-probe-031`, `c4-probe-032`, `c4-probe-034`, `c4-probe-036`, `c4-probe-037`, `c4-probe-lows.cjs`. Findings with no named script cite the exact command (`c4-states.cjs` with `C4_STATE=<name>` or a `grep`). Every Medium probe was re-run at the end and exits 1 with `DEFECT PRESENT` while its defect exists (C4-028 shares `c4-probe-027`). Evidence screenshots are under `evidence/`; the rest of the screenshots stayed in the untracked scratch folder.

Not verified: a second run of the same issuer, so Forecast and Calendar with an earlier run (CP-8 comparison, cross-run isolation of models and events) were not exercised, because proof.serve refuses it ('synthetic proof requires a first Credit Snapshot run'); live-run content (real driver registers, real Basis and limitation text, a non-USD issuer, an Upside or second-grid case, T2H.7 and T2H.8 timing tables, the 'machine input is set to zero' basis note) since the canned handoffs carry none of it, so those paths were reached only by rewriting the JSON the service returns, never from a producer; the Lite pathway and a no-forecast run beyond the intercepted no-model state; the CP-1C, CP-2H, CP-3D and CP-4C visuals (no output in the canned run; ten harmony rows marked not exercised); EdgeMap.tsx, PortfolioLimits.tsx and the unit tests were not read; the dark theme, print and forced-colours (the app has none declared); screen-reader announcement (no assistive technology was run: names, roles and tab order were read from the DOM); contrast beyond a computed text check on five pages (one false positive, none real); whether the build already normalises U+2212 minus signs before the chart tables reach the page (C4-027); whether CP-2G handoffs in a live run write the base-period, base-interest and zero-input limitations the UI branches match (C4-033); the impeccable critique (skill not available, R7); no real Windows or Edge run.
