# Stage 2 section audit: C3, Report overview, changes, modules

Audited commit: working tree of `/home/user/credit-os2` (no code changed). Service: `PYTHONPATH=src uv run --locked python -m proof.serve --root /tmp/cs-C3/root --port 8733` (synthetic, canned handoffs, no paid call). Browser: Playwright Chromium headless shell build 1243, every host but loopback aborted (ruling R8). Result: **0 requests to another host, 0 console errors, 0 page errors, 0 failed requests in every script** (about 60 runs, 1440, 390, 320 and 1000 px).

## Result in one table

| Severity | Count |
| :--- | ---: |
| High | 0 |
| Medium | 12 |
| Low | 18 |
| Info | 2 |

No wrong figure, period, unit or source was found (17 figure checks against the handoffs, see `harmony.csv` FIG rows), no other-host request, no control that does nothing on an ordinary path. The Medium findings are: a trace control missing on the Overview fallback tiles (C3-001), module navigation that loses focus, keeps the scroll offset and navigates on arrow keys (C3-002 to C3-004), a mislabelled outline entry (C3-005), a module code in the drawer (C3-006), undesigned report error states (C3-007), the missing Earlier format and Earlier methods labels (C3-008), no key charts on Overview (C3-024), CP-8 content on Overview (C3-026), charts before Key findings (C3-028) and chart tables without their basis and limitation (C3-029).

## Setup note: the Changes tab

The brief asks for two completed runs so Changes has an earlier run. `proof/launcher.py:101` makes the synthetic engine fail a run that has a prior run ("synthetic proof requires a first Credit Snapshot run"): run 1 (`20261117-072511-01`, 14 modules, Finished) completed; run 2 (`20261117-072520-01`) failed in 1 second with that message. The Changes tab of the real run therefore shows the first-run state. The comparison states were reached by rewriting the `/connected/snapshot` response in the browser (a request intercepted in the browser; no application code edited): an added earlier run, a comparison pack and a CP-8 handoff. Those screens are labelled "injected" in findings and `harmony.csv`; they prove the page's behaviour on a pack of that shape, not the server's pack. The probes that need them (`p08`, `p11`, `p14`, `p16`) carry the same rewriting.

## Screens and states covered

| Screen | States reached | How |
| :--- | :--- | :--- |
| `/report/<run>#overview` | full; loading; error 500; network failure; null snapshot; no lead; blocked lead; reference in lead; two-paragraph lead; earlier format; long text and markup; missing figure; zero figure; GBP units; no catalogue; with ratings and business description; bad as-of date; late as-of date; CP-8 present | real run, delay and abort routes, snapshot rewriting |
| `#changes` | first run (real); injected pack (cards, table, maturity chart, module comparison, CP-8 ledger); not produced; not compared; unreadable; none recorded; mismatch with the listed run | real run and snapshot rewriting |
| `#modules` and `#modules/<id>` for all 14 modules | full at 1440 and 390; 320 and 1000 px overflow scan; unknown module; unknown output index; no modules; one module; two outputs; parse error; blocked module | real run and rewriting |
| `/report/no-such-run`, `/report/<failed run>` | error | real service |

Not reached: partial run (a run still running has no report), a real CP-8, a real blocked handoff, ratings and a business description from the service, an Earnings Update, a retained short-snapshot run, a Model entry.

## Controls covered against the inventory (1,286 lines of `clickables.jsonl`)

The inventory lists the same component many times (15 pages, with each revealed state). Each group was exercised by a scripted loop on every member present on my run, then mouse and keyboard on representatives.

| Group | Inventory lines | Exercised | Effect checked | Keyboard |
| :--- | ---: | :--- | :--- | :--- |
| Trace controls "Show sources for ..." | 297 | 179 in default view (Overview 28, 14 modules 151) and 76 more in the Table forms; 227 opened in a second loop that also expanded every disclosure | drawer opens with title, statement, derivation; Escape closes; focus returns to the opener: 179 of 179 and 227 of 227 | Enter and Space open, Escape, Close, Open in Evidence, Back and Forward, Tab cycle (4 stops, no trap), overlay click |
| Drawer "Dismiss" (hidden) | 191 | 1 per drawer; clicked on a representative | closes, focus returns to the opener | tabindex -1 by design |
| Navigator module links | 210 | all 14 links on CP-1 and Overview by address; clicked on 4 pages | hash, heading, content; Back and Forward | Enter: works, focus lost (C3-002) |
| Frame and tab links | 143 | each tab by mouse and keyboard; Library, Run activity, Report by address | hash and heading; Tab order of 60 focusable controls on Overview | yes |
| Other links | 57 | 65 distinct addresses on the pages opened directly in a new page | all render the expected heading, 0 four-hundreds | yes |
| On-this-page section buttons | 85 | all 81 present on my run | focus moves to the section, active entry marked, Enter works: 81 of 81 | yes |
| Chart and Table radios, radiogroups | 78, 39 | 32 groups and the Changes Presentation group | table form appears for 32 of 32, returns to chart; Space selects | arrows move focus only (C3-013) |
| Event lane buttons | 156 | 9 lanes: 27 filters, 36 markers, 36 detail toggles, 9 show-all | all change state; markers only move focus to the row | Enter and Space on details and filters |
| Show sources switch | 17 | mouse, Space | `data-sources` flips, persists across tabs, resets on reload; Enter does not toggle (switch pattern) | yes |
| Details and summaries | 10 | 4 on Changes (injected), the Downside and Rates disclosures | mouse, Enter, Space | yes |
| Comboboxes | 3 | Module and Jump to section (390 px, all options); Downside "Compare with", "Cash-interest basis"; Rates "Compare with the 5% move" | content changes; the last has one option (C3-031) | ArrowDown navigates (C3-004) |
| Other buttons | (in the above) | Changes Presentation, Cards and Table, "Review comparison evidence" | table, cards, evidence address | yes |

A control missing from the inventory: none found. Items on screen that the inventory did not name because the baseline run had no such state: the Changes pack controls (Presentation switch, four details, Review comparison evidence, Earlier and Current source), the Saved outputs links ("Designated handoff", "Retained output 2", reached with a rewritten snapshot; they work and keep focus) and the Module select options.

## Harmony

`harmony.csv` holds every content-matrix row with section C3 (252), the six control-matrix rows (CT-028, CT-040, CT-041, CT-044, CT-047, CT-049), ten items the matrix does not account for (UA rows) and 17 figure checks (FIG rows).

Content rows: 122 shown as required, 24 correctly not shown, 15 shown but wrong place or form, 5 missing, 86 not exercised. The mark "not exercised" is mine and is outside the brief's four: the canned handoffs (`proof/handoffs`, 14 modules, 1,576 lines) hold a subset of each module's content and none of CP-1B, CP-1C, CP-1D, CP-2H, CP-3D, CP-4C, CP-L10, CP-MODEL, so those rows could be checked in code only; they are not marked "shown". Control rows: CT-044 and CT-047 are partly met (C3-002, C3-004, C3-025, C3-001).

Figures: 17 checks (Overview tiles 5, Overview dates 1, Changes 2 injected, CP-1 charts 4, CP-2A 2, CP-2E 2, CP-2D 1): all match the handoff in value, period and unit; a missing period is drawn n.a., a zero stays 0.

Retired list (`retired.md`): R-01, R-03, R-04, R-05, R-06, R-11, R-12, R-13, R-14, R-15, R-16, R-17, R-20, R-22 checked by a text scan of Overview, Changes and the 14 module pages (no `report.html`, memo, workbook, short snapshot, decision ledger, Reader summary, Event calendar tab, module code or inline source reference); none offered. R-13 is breached only in the trace drawer's own sentence (C3-006). R-18: no fixed "US$m" in C3 code; the charts read the unit from the handoff; tiles show "$" or "£" (C3-022, owner's answer key). R-20: Cash has no mark; the Undrawn card is absent from Overview.

## Design critique (rubric D-nn)

The impeccable skill was not available in this session; I applied the rubric rule by rule to the screenshots at 1440 and 390 px, to the DOM and to the code (R7). Rules with findings: D-13 (C3-006), D-14 (C3-020), D-16 and D-36 (C3-010, C3-005), D-21 (C3-021), D-26 (C3-011, C3-018), D-30 (C3-032), D-31 (C3-007, C3-017), D-32 (C3-009, C3-029), D-35 and D-38 (C3-002, C3-004, C3-013), D-37 (C3-014, C3-019), D-43 (C3-030). Rules checked with no finding: D-10 (offline), D-12 (no inline source references on any findings page), D-15 (figures real and exact), D-25 (one accent; better and worse carry a word and a shape: filled circle and diamond), axe `color-contrast` (nothing on 7 pages at two widths), D-34 (focus ring on trace, tab and switch), D-39, D-41 (links are 20 px high but spaced, spacing exemption), D-45 and D-46 (exact decimal, mark only for table keys; cash unjudged), D-47, D-48 (one link "Ratings & triggers shows a different rating for S&P" and the label "Entered at run start"). axe-core on Overview, Changes and five module pages at 1440 and 390 px: two violation types, both reported (C3-019).

## Code read (`check: code`)

Files: `ReportContent.tsx`, `HeadlineFigures.tsx`, `publishedReport.ts`, `reportView.ts`, `signal.ts`, `report/Changes.tsx`, `Modules.tsx`, `ModuleTable.tsx`, `Confidence.tsx`, `MetricGrid.tsx`, `IdentityBand.tsx`, `OverviewModules.tsx`, `ToneMark.tsx`, `YearChange.tsx`. Findings: C3-023 (unused `_index` threaded through three components, per-render trace rebuild, constants passed to ChangeCard). Also read, no defect: `exactDifference` (BigInt decimal, null for any non-decimal text, never a wrong figure), hook order in `Changes` and `Navigator` (hooks before the early return), `containsReference` fallbacks, `RunLimitations` de-duplication. Observations for stage 6: `findingsTraces` builds every row's Trace on each render; `HeadlineFigures` trusts the server's `change` string while `MetricGrid` recomputes with `exactDifference` (two sources for one kind of figure).

## Findings

| Id | Severity | Check | Title |
| :--- | :--- | :--- | :--- |
| C3-001 | Medium | wiring | The five headline figure tiles on Overview (Net leverage, Gross leverage, Interest coverage, Revenue, Cash) have no trace control, so a headline numbe |
| C3-002 | Medium | accessibility | After the reader chooses another module in the Modules navigator (link by keyboard, or the Module select at 390 px), keyboard focus drops to <body>. |
| C3-003 | Medium | state | Switching module keeps the previous module's scroll offset, so the new module opens part-way down its page instead of at its Bottom line. |
| C3-004 | Medium | accessibility | Below 1001 px the Module select navigates on every ArrowDown, so a keyboard user cannot browse the options without changing page each time. |
| C3-005 | Medium | harmony | 'On this page' lists 'Key findings' on modules that wrote no Key findings (Financial foundation and other data modules); the entry scrolls to a table  |
| C3-006 | Medium | design | The trace drawer prints a module code ('CP-0') in a sentence the service wrote: 'the Basis file is not in the CP-0 inventory'. |
| C3-007 | Medium | state | Report error states give the reader no cause and no next step: a failed or unknown run reads 'The published report could not be loaded.', a network fa |
| C3-008 | Medium | harmony | A run in the earlier format or with changed methods is not labelled 'Earlier format' or 'Earlier methods' on Overview or Changes; neither string exist |
| C3-009 | Low | state | One unbroken 336-character token in the lead Bottom line runs past the navy band and makes the main region scroll sideways. |
| C3-010 | Low | accessibility | The heading outline does not follow the page structure: the whole Bottom line paragraph is the h2 (no 'Bottom line' heading text), module sections are |
| C3-011 | Low | design | A change card shows a positive difference without a sign ('0.80x') while the Overview tile for the same measure shows '+0.80x vs FY2023'. |
| C3-012 | Low | harmony | When CP-8 delivered, the same handoff is drawn twice: on the Changes tab and again as a module 'Changes since the last run' in the Modules navigator,  |
| C3-013 | Low | accessibility | The Chart/Table and Cards/Table switches are role=radiogroup buttons whose arrow keys move focus without selecting and whose radios are both Tab stops |
| C3-014 | Low | accessibility | Controls repeat identical accessible names with no context: 'Show sources for this passage' (several per module page) and six links named 'Evidence' o |
| C3-015 | Low | design | The disclosure that holds the lead's second Bottom line paragraph is always labelled 'Decision rationale', also when the lead is Fundamental credit or |
| C3-016 | Low | design | When the lead Bottom line holds a source reference, the navy band is lost: the heading 'Bottom line' is followed by the five figure tiles and then a l |
| C3-017 | Low | state | The three 'no comparison' sentences (not produced, not compared, no comparison recorded) and the unreadable-comparison sentence carry no link; only th |
| C3-018 | Low | design | On Overview the trace control of each 'Bottom line by module' row sits alone on a third line under the paragraph, unlike every other paragraph where i |
| C3-019 | Low | accessibility | The Modules navigator's <aside> has no accessible name, so the page has two unnamed complementary landmarks (axe landmark-unique); the 'Modules 14' ta |
| C3-020 | Low | state | A headline figure the module could not supply (Adjusted EBITDA FY2024, 'Not supplied') gets no tile and no stated gap; the reader cannot tell that it  |
| C3-021 | Low | design | The change cards are cards inside the 'Changes since the last run' card. |
| C3-022 | Info | design | Money is shown as 'US$m' on chart axes and 'USD millions' in tables but as '$2,250m' on tiles and change cards for the same figure; for GBP the tile r |
| C3-023 | Info | code | Dead and repeated work in the C3 files: `entryIndex` is threaded through ReportFindings, MetricGrid and ModuleConfidence into `traceForLine(_index)`,  |
| C3-024 | Medium | harmony | Overview draws no key charts and no 'Chart index' link, although the run holds data for catalogue rows that name Overview (Source readiness map, Credi |
| C3-025 | Low | harmony | The Modules navigator has no search at its top. |
| C3-026 | Medium | harmony | When CP-8 delivered, Overview lists CP-8's Bottom line under 'Bottom line by module' and its limitations under 'Limitations', although CP-8's findings |
| C3-027 | Low | harmony | The lead band on Overview is labelled 'Bottom line'; the ruling and the matrix name its kicker 'Credit view' ('Earnings view' on an Earnings Update). |
| C3-028 | Medium | harmony | On a module page the charts, event lanes and maps come between the Bottom line and Key findings, pushing Key findings, Contrary evidence and Limitatio |
| C3-029 | Medium | harmony | A chart's Table form omits the 'Basis and limitation' column, so a row's limitation (for example 'gross debt includes finance leases') is visible only |
| C3-030 | Low | accessibility | The document title is 'Modules — <issuer> — Credit OS' for every module, and a module change is neither focused nor announced. |
| C3-031 | Low | design | 'Compare with the 5% move' on Rates, FX and hedging is a <select> with one option ('10%'), so the control offers no choice. |
| C3-032 | Low | design | Text is set at 12 px on report pages: the Source readiness 'key limitation' reasons, the navigator's group captions, chart labels (70 SVG text nodes o |

Probes: `probes/lib.cjs` is the shared helper; each probe starts its own `proof.serve` on port 8733 (or reuses a service with `C3_BASE` and `C3_RUN`), completes one synthetic run, runs its check and stops the service. Run from the repository root, for example `node docs/audit/2026-11-16-final/output/2-sections/C3/probes/p03-scroll-after-module-switch.cjs`. Exit code 1 means the defect reproduced.

Not verified: a real CP-8 comparison pack and the server's pack builder (the synthetic launcher refuses a run with a prior run; the Changes page was driven by rewritten snapshots); a real Earnings Update, short-snapshot, Model or blocked-module run; the Overview and module pages for any issuer other than the synthetic Northbridge case (so whether the real CP-1 table always reaches the MetricGrid path is read from code, not from a real run); the Report history (`#history`), Forecast, Evidence and Issuer calendar tabs (C1, C4, C5); screen-reader output (no assistive technology was run; names and landmarks come from the accessibility tree and axe-core); Chrome and Edge (only the Playwright Chromium headless shell); keyboard use of the trace controls in the Table forms (mouse only for those 76); 86 content-matrix rows whose content the canned handoffs lack (marked "not exercised" in `harmony.csv`); dark theme and forced colours; the impeccable critique (skill absent).
