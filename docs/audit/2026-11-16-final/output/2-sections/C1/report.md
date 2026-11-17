# C1 section report: shell, library index, run activity and progress

Stage 2 audit of section C1 (connected surface). Audited commit `main` 2b881075 as checked out at 4d1c71b; built `web/dist` as prepared for all workers; `proof.serve` on port 8731 with run root `/tmp/cs-C1/root`; Playwright Chromium headless shell 1243 at 1440 and 390 px (320, 768, 1100 and 1280 px for reflow); every host but loopback aborted in every browser context. Nothing was changed outside `docs/audit/2026-11-16-final/output/2-sections/C1/`. No paid call, no `--live`, no Submit except the synthetic Start dialog of `proof.serve` (R4).

Files audited: `web/connected.html`, `web/src/connected-main.tsx`, `web/src/ConnectedLoadBoundary.tsx`, `web/src/pages/connected/{ConnectedApp,layout,LibraryIndex,ReportLibrary,RunActivity,RunProgress,api,useResource,runFigures}.ts(x)`; the shell, `TextLink`, `ModuleSteps`, `Feed`, `Summary`, `StatusBadge` and `HeadlineFigures` only as C1 uses them.

## Result in one table

| Severity | Count | Findings |
| :--- | ---: | :--- |
| High | 1 | C1-001 |
| Medium | 9 | C1-002, 003, 004, 005, 006, 007, 013, 024, 031 |
| Low | 17 | C1-008 to 012, 014 to 023, 030, 032 |
| Info | 5 | C1-025 to 029 |

Every High and Medium has a probe in `probes/` (run from the repository root; each uses the service at port 8731 if one answers, otherwise starts `proof.serve` there on a new root and stops it again; `probes/lib.cjs` holds the shared helpers). Low findings that share a probe point at it. `findings.jsonl` holds 32 lines in the schema's fields; all 13 probes were run and each reproduces its defect.

What matters most:

- **C1-001 (High).** `GET /connected/snapshot`, fetched by every report page, carries `catalogue.workspace`, the server's absolute workspace path (`/tmp/cs-C1/root/_engine`). Nothing draws it and no client code reads it; `/connected/library` already projects it away.
- **Run activity (C1-003, 006, 013, 031).** The Waiting and Ended tables clip their columns inside `overflow-hidden` panels (Pathway cut mid-word at 1280 to 1440 px; State, Ended and Reason unreachable at 390 px). Run state changes are not announced. One dropped poll replaces the whole list with a neutral empty-state panel. Run reasons are drawn verbatim (launcher exit code and log path and, from the library's refusals, module codes and delivery paths).
- **States (C1-002, 004, 005, 024).** The empty Library is a bare card. Error lines are plain red text with no action and wrong wording (unknown report, 'Failed to fetch'). A finished run without a published report waits and polls for ever. The run page re-inserts its alert every 2 s.
- **Harmony (C1-007, 008, 009).** Report history lacks modules run, status and the Earlier format / Earlier methods labels. The library card has no delivery state or bottom line and silently drops a figure that was not supplied.

## Screens and states reached

| Screen | States reached (how) | Widths |
| :--- | :--- | :--- |
| `/` and `/index.html` (library index) | empty (fresh service); full with 1 and 2 issuers (real runs); Cards and List; search, Sector and Pathway filters, no-match; loading (request delayed); error 500, network refusal, HTML body (intercepted); long names, unlinked entry, malformed entries (intercepted) | 1440, 390, 320 |
| `/runs` (Run activity) | empty (fresh service and intercepted); running (real run, caught for about 2 s); queued, stalled, held, unreadable, name-differs, ended list with 37 total (intercepted); read failure and malformed answers (intercepted); loading | 1440, 1280, 1100, 768, 390, 320 |
| `/run/<id>` (run progress) | loading; running with every module queued (real); finished (real); failed (real: launcher refusal); failed, capped over cap, queued with held reason, null spend, zero cap, no modules, unknown event kind (intercepted); unknown id; finished with report 404 for ever; report request failing with 500 | 1440, 390, 320 |
| `/report/<folder>` frame (breadcrumb, header, Show sources, six tabs, document title, errors) | real finished run; tabs Report, Overview, Changes, Modules, Forecast, Evidence and hashes `#calendar`, `#nonsense`, `#modules/CP-1`, `#evidence/zzz`, `#`; unknown folder; failed run's folder; trailing slash; service unreachable | 1440, 390, 320 |
| `ConnectedLoadBoundary` | entry chunk failure and inner chunk failure (route aborted): boundary page; Reload page by keyboard recovers | 1440 |

`proof.serve` runs finish in about 3 s, so queued, stalled, held and unreadable states, the Waiting group and the 37-run Ended list were reached with answers supplied in the browser; each probe says which.

## Controls: coverage against the inventory

`clickables.jsonl` has 29 C1 lines. All 29 were operated with the mouse and with the keyboard alone, with Back and Forward and, for links, by opening the address directly:

| Inventory lines | Result |
| :--- | :--- |
| Start a run (`/`, `/runs`, both states) | opens `/start`; Enter and click; Back returns |
| Sector, Pathway (empty and full) | native selects; keyboard ArrowDown changes and filters; combined filters and 'No issuers match these filters.' work |
| Layout radiogroup, Cards, List (empty and full) | click and Space work; ArrowRight moves focus without selecting (C1-016) |
| Search issuers | filters name, issuer key, title, sector, period and date of the newest run, case and trailing spaces ignored; Escape clears; both layouts respect it |
| Open report (card and List-layout link) | opens `/report/<folder>`; keyboard and Back work |
| `1 run` | opens `/report/<folder>#history` |
| Open the library (`/runs` empty, both states) | opens `/` (reached with an intercepted empty answer) |
| Run activity breadcrumb (`/run/<id>` loading, error, full) | opens `/runs`; works while loading |
| Open report, Start from this run (`/run/<id>`) | `/report/<id>`, `/start?from=<id>`; Start from this run is also offered for failed runs |
| Run card link (`/runs` full) | opens `/run/<id>`; Waiting and Ended row links the same |

C1 has no disabled control and no drawer or dialog (focus return not applicable). Loading and error states of every control's page were reached (C1-004, 012, 031, 032). Visible focus: every link, button, select, radio and the Show sources switch shows a 2 px ring. Skip to content moves focus to `main`; a thin browser outline surrounds the whole main region where the code asks for none (`focus:outline-none` has no effect), an S1 matter that is not written up.

Controls missing from the inventory (C1-029): the report frame's breadcrumb Library link, Run activity button, Show sources switch and six tab links (listed only under C3, C4 and C5) and the boundary's Reload page button. All were operated: tabs by mouse and keyboard with Back and Forward and per-tab document titles; Show sources by Space; Reload page by Tab and Enter (focus lands on it, and the reload recovers once the chunk loads).

## Design critique (rubric applied rule by rule; the impeccable skill was not available, R7)

Findings by rule: D-31 (C1-002, 004, 005, 031, 032), D-32 and D-42 (C1-003, 020, 021), D-43 (C1-006, 024), D-13 and D-31 (C1-013), D-14 (C1-009), D-36 (C1-015), D-35 (C1-016), D-30 (C1-017), D-29 and D-24 (C1-018), D-26 (C1-022, 023), D-20 (inside C1-031), CM-033 and D-01 (C1-008).

Passes worth recording: no console error other than the 404s of unknown ids and the aborted chunks; contrast of every text node on the four screens at both widths was at or above AA (measured, none below); animation is limited to the live Running halo, the Queued shimmer and the 200 ms feed rise, all inside `prefers-reduced-motion: no-preference`; the accessibility tree of the run page and Run activity names the progress bars, tables, groups and the single status region; no `dangerouslySetInnerHTML`, `innerHTML` or `eval` in the C1 files. Pointer targets: text links are 20 px high, below the 24 px floor, but are isolated or in table rows with room around them (spacing exception), so not written up. Judged at 1440 and 390 px.

## Harmony (`harmony.csv`)

Content rows with C1 in `section_id` (19): 8 shown as required, 4 shown but wrong place or form (CM-011, 013, 032, 033), 2 missing (CM-034, 060), 5 correctly not shown. Control rows (10): 5 shown as required, 2 wrong place or form (CT-021, 043), 1 missing (CT-040), 2 correctly not shown. Retired list: 11 rows checked on C1 screens, 10 correctly not shown, 1 still partly offered (R-13: module codes inside service-written run reasons, C1-013). Seven items on screen that no row accounts for are listed (reverse check).

Figures checked against their source (all matched):

- Library card (`/`): Net leverage 2.25x (FY2024; FY2023 3.00; change -0.75x), Gross leverage 2.80x (3.75; -0.95x), Interest coverage 4.00x (3.20; +0.80x), Revenue $2,250m (2,100; +$150m), Cash $275m (300; -$25m); periods FY2024 and FY2023; units x and US$m; against the chart tables of `proof/handoffs/CP-1.md` (lines 7 to 28 and 122 to 128). Better marks follow D-46 (none on Cash). Adjusted EBITDA is 'Not supplied' in the handoff and absent from the card (C1-009).
- Run page: pathway Full credit assessment and cap USD 25.00 (ruling: Full 25); '14 of 14' modules = the 15 pathway modules less CP-MODEL, with the Report as a separate step; Elapsed 3 s equals the recorded 07:57:45 to 07:57:48 stamps; As of 2025-03-31 equals the date entered; event times equal `events.jsonl`.
- Run activity: Running 2, Waiting 2, Ended 37 equal the supplied lists and `ended_total`; stamps print in UTC from the service's ISO times.
- Report header: As of 31 March 2025, Full credit assessment, Finished, equal the run record (the date is written a third way, C1-023).

## Code read

Dead or unreachable: trailing-slash `/start/` and `/runs/`, the Page-not-found page, 'No report was published for this run.', and three test-seam props (C1-026). Duplicate: the 'No reports yet' card appears twice in LibraryIndex with different surroundings (C1-002). Catch-alls: `useActivity` turns any failure into 'unreadable' and drops the last good list (C1-031); `errorText` passes the browser's message through (C1-004, 012); `useResource` never clears an error. Stale-state flicker: RunProgress clears and re-sets its error each poll (C1-024). Unused exports: none found in the C1 files (every export has a caller). Measured costs for stage 6: the library index payload (C1-025) and a 5 s poll that continues in a hidden tab (not written up). `moduleName` falls back to the raw id for an unknown code, so a code can still reach the screen (C1-013).

## Offline (R8)

0 requests to any host but 127.0.0.1 in every session (the blocked list was empty in every capture and every probe prints it); the Geist and Schibsted Grotesk woff2 files and `symbol.svg` came from `/fonts` and `/symbol.svg` with status 200, and the five font faces used report `loaded`; no WebSocket. No High finding under R8.

Not verified: a Report history with two or more runs, 'Earlier format' and 'Earlier methods' labels and the CP-8 comparison (proof.serve refuses a second run of an issuer: 'synthetic proof requires a first Credit Snapshot run'); a capped, rejected or interrupted run, a blocked module's 'Not assessable' on Run activity and a 'Module draft rejected' event (no such data in the synthetic proof, so C1-028 rests on the code); queued, stalled, held and unreadable Run activity states and the 37-run ended list with live data (reached only with answers supplied in the browser); live mode (`python -m react_frontend`), the read-only preview and real spend figures (the synthetic spend is USD 0.00); a library with sectors, many issuers or adjusted-EBITDA leverage (CM-034 judged from the code); whether a synthetic or replayed run is unlisted in the live library (CM-033: the proof's completion record says live-provider); screen-reader output (judged from the accessibility tree and DOM, no assistive technology was run); real phones, text zoom, dark or forced-colours modes and print; the 11 px sideways scroll of the library cards at 390 px with long names (scrollWidth 401, element not traced); `/start?from=<id>` prefill (C2); the Teams webhook and `--signal-url` server code (outside C1's files); the report body of every tab (C3 to C5); the shell beyond how C1 uses it (S1 and X1); the impeccable critique itself (skill absent, rubric applied by hand).
