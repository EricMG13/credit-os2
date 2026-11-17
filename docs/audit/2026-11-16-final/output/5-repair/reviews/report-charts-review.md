# Independent Stage 5 review: Report and Charts/shared

Reviewed candidate `/workspace/review-connected-integration` at `cb5c0c9bf42c1b8953ed7732733e1b93b425fd06`, then the related-only advance to `d4b3db282f646e46c7ea2fb26a4390be50069bc2`. The advance removes one unused LibraryIndex import and adds the integration report; it changes none of the reviewed behavior. Final narrow rereview accepted `0160cdc8` and `1c06c00c` in `/workspace/audit-review-small-fixes`; its unrelated uncommitted S1-010 App work is outside this review.

Source boundaries:

- Report: `/workspace/audit-report-followups`, `2a5af229..153a3191`, all seven own commits.
- Charts/shared: `/workspace/audit-charts-shared`, `9d7fc4c1..7cc8cad0`, excluding duplicate formatter dependency `0a918fa7`.
- Read AGENTS, audit README R1–R17, Stage 5, BATCH-BRIEF, both source chunk reports, the batch inventory, current coordination register and relevant merged records/rulings.

No production or test file was changed by this reviewer. No install, push, merge, paid/provider action, real Submit, Teams call or application network request was made. Tests use mocked services; native-browser probes open local built files and abort external requests.

## Separate chunk verdicts and counts

| Chunk | Scoped outcomes reviewed | Ordinary High | Ordinary Medium | Ordinary Low remaining | Verdict |
| :--- | ---: | ---: | ---: | ---: | :--- |
| Report follow-ups | All 23 report-table rows accepted after C1-032 follow-up | 0 | 0 | 0 | Pass within scope |
| Charts/shared | 10 canonical repairs + 1 already-repaired finding + original L16/C4-013 caller follow-ups; L16 zero follow-up also accepted | 0 | 0 | 0 | Pass within scope |

One additional Charts Low unusual-input observation is **parked under R3** as R4-005. It is not an ordinary-data failure or a repair blocker.

T18/T22's original unpublished work remains outside these chunk verdicts. In particular, the Report chunk's score denominator is reviewed here; the separate confidence-drawer parsing and pending Forecast methods work are not counted as newly introduced blockers.

## Findings

### C1-032 initial residual — Low, ordinary; closed by `1c06c00c`

The initially reviewed `web/src/pages/connected/ReportLibrary.tsx:737` drew the new loading skeleton with `animate-pulse motion-reduce:animate-none`. The finding explicitly requires a static, nonanimated skeleton, and the worker report calls it static. Audit rubric D-31 requires a static shape outside live run pages; the rubric also flags `animate-pulse` on non-live elements. The reduced-motion override did not make the ordinary desktop state static.

The original new C1-032 test checked only the loading sentence and existence of an aria-hidden shape, so it passed without detecting the animation. This was a small presentation residual, with no value/source loss and no High/Medium impact. Commit `1c06c00c` removes only the animation classes and adds a pending-request DOM regression; the related rereview below accepts the repair.

Evidence/probe: `/workspace/scratch/report-charts-review-probe.mjs` and its JSON output include the exact animation-class observation. The original production addition is in Report commit `9ad50265`.

### R4-005 — Low, hostile-input; parked under R3

`web/src/pages/connected/visuals/visualData.ts:80` classifies the stated unit by suffix. Its `/m$/` alternative also classifies arbitrary words ending in `m` as millions. Actual calls `amount("10m", "minimum")` and `amount("10m", "term")` return `10`.

This requires an invalid or unusual reporting unit. **No valid scale conversion or normal-data failure was observed.** The ordinary `US$m` control returns 10, and a mismatched `USD billions` unit correctly refuses `10m`. Per R3 this is recorded and parked, with no production repair requested.

Ready portable files for parent registration/commit:

- `/workspace/scratch/R4-005-unusual-units.mjs`
- `/workspace/scratch/R4-005-unusual-units.actual.json`

Run the probe from the checkout root using existing `web/node_modules`. It performs read-only SSR imports with dependency discovery disabled and emits the small observed output. Parent will retain it under `output/5-repair/probes/R4-005-unusual-units.*` and register R4-005.

## Report review evidence

- CP-8 remains in Evidence/Changes entries and is absent from Modules/count; an old Modules/CP-8 bookmark opens Changes. Recorded-step ordering is used for Modules and Evidence; the existing deterministic fallback remains. The lead's explicit module link explains its absence from the per-module list.
- Titles identify the selected module or Evidence tab; History and issuer breadcrumbs agree. The approved first-run sentence is exact and has the separate decision-time explanation. Source highlighting keeps the static default label and uses the truthful connected label; Evidence hides the ineffective switch.
- The referenced lead retains its navy band with the exact Evidence address, and financial tiles follow the band. Its source-bearing raw prose stays withheld. Lead attribution, Credit/Earnings kicker and continuation labels retain the correct owning module. The generic fallback no longer nests figures within its Bottom line card.
- C5-025 preserves whole-table citations and groups row citations under the original row identity. The independent probe retains file, hash, quote, excerpt and named source details, and removes only no-page boilerplate in a source-free table. Existing exact trace source assertions remain.
- Calendar preserves recorded status lanes, date-placement behavior, row Evidence addresses and gap identity. It strips the cited filename from the event label, expands the three category names and explains category/date-precision semantics without reclassifying events. Unplaced-event messages do not falsely blame only the date.
- Downside and BreakPoints use one percent form without changing calculation positions or source data. Independent literal checks cover 0, 1.000, a stated percentage, trailing-zero precision and a small exact share. Candidate BreakPoints retains batch A's conditional ranking and `ul` for an unranked table, alongside `scenarioShareLabel`.
- The money key changes are exactly 20 required display expectations in `moneyUnits.cases.json` plus four in connected `signal.cases.json`. Every input, case order and non-money case is unchanged; expected changes are limited to the authorized currency prefixes/unit labels. All signs, digits, decimals and quantity families remain. No protected Signal directory was changed.
- Lazy card provenance is requested only on the specific figure click, through `/connected/snapshot?run=<id>`. It checks current display value, unit and period; resolves the selected original CP-1 row through the existing headline-source semantics; and opens its hash-pinned exact Evidence location. Missing/failed/stale lookups show an explicit message, without a wrong drawer or an initial full fetch per card. The test refuses same-valued data in another currency. Combined LibraryIndex retains shell layout, lead provenance, dates and address-backed filters.
- Record renders scope/reason/fix through the same `serviceText` function used by approval. No stored approval metadata is mutated, and the exact approved module-name wording is asserted.

## Charts/shared review evidence

- Positive and negative period series both reach actual TrendChart line rendering. The exact authored figures remain in hover/Table and the source control stays in the chart header. Existing numeric/axis expectations are unchanged; the three consequence tests select Table to inspect the same authored strings.
- The parser's U+2212, parentheses, ordinary/NBSP/narrow-NBSP grouping, matched suffixes and decimal-comma scope are exercised with independent numeric literals. Unit mismatches and unconfirmed suffixes remain refused; no scale conversion is added. R4-005 is the separately parked invalid-unit case above.
- A missing covenant threshold retains its row/current value and the other valid rows. Negative current values lie left of the explicit zero baseline. Fully absent thresholds retain the full gap and exact source table. The source table also preserves unknown and negative authored strings.
- The local chart predicate is removed; parenthesized gap IDs and page locators use the shared reference predicate. Module codes remain reader names. L16's source-bearing gap treatment preserves its status and exact source address; the related zero/convention follow-up is also accepted in the narrow rereview below.
- ChartTable's cue follows actual overflow and disappears when width fits, with observer/listener/frame cleanup. Native Chrome and Edge confirmed desktop overflow at 481px (449px client width, 506px source table width).
- The only palette mutation is chart slot 3, Reef D8 `#331911`; the existing waterfall-down alias follows it. First-three luminance ratios are independently checked at 2.18, 2.01 and 4.39, with white contrast at least 3:1. No action/status colors change. Documentation labels the earlier simulations as historical.
- The isolated 37-file font commit contains 36 runtime files and one policy test. Its authored-font changes are 13px/token substitutions; source-widget size defaults remain unchanged. Existing broad caller assertions are preserved.
- Library/Model adapters compose MetricCard and retain source/missing-trace controls, definition tooltips, missing versus zero, withheld/gap qualifications and exact delta/period notes. Native checks across 24 route/width/browser cases measured 120 metric figures at 40px with zero card overflow. Missing regular-weight behavior is covered by the caller tests and worker geometry evidence.
- TableCell distinguishes null/undefined/empty-string missing values from numeric/text zero and preserves explicit React elements. Recharts' body measurement element is removed after the last chart leaves, including fresh native Chrome/Edge navigation checks.

## Independent checks

Each long command used `timeout 300`; Vitest used `--maxWorkers=1`. No dependency install or gate change was used.

| Check | Result | Retained evidence |
| :--- | :--- | :--- |
| Focused Report + Charts + shared regressions | 21 files, 204 tests passed | `/workspace/scratch/report-charts-review-targeted.log` |
| Signal + actual Report/library/card/visual callers | 43 files, 808 tests passed, including all 34 Signal files/630 tests | `/workspace/scratch/report-charts-review-callers.log` |
| Total distinct Vitest scope | 64 files, 1,012 tests passed | Two logs above |
| Independent parser/money/share/citation probe | 15 parser literals, 33 money literals, 6 percentage literals and citation preservation passed | `/workspace/scratch/report-charts-review-probe.mjs`, `.json`, `.log` |
| Literal-key identity comparison | 20 money + 4 connected signal display-prefix changes only; inputs/order unchanged | Source diff and reviewer command |
| Candidate static build | Exit 0 | `/workspace/scratch/report-charts-review-build.log` |
| Chrome 157.0.8103.78 + Edge 155.0.4283.62 | 24 route/width cases, 120 figures, zero overflow; scroll cue and measurement cleanup passed; zero external requests/page errors | `/workspace/scratch/report-charts-review-browser.mjs`, `.json`, `.log` |
| R4-005 portable read-only reproducer | Exit 0; two ordinary controls and two unusual-unit observations retained | Portable files above |

The native routes were library Halden Overview and Model TransDigm Front/Portfolio fit, at 481, 768, 1000 and 1440px. The width floor honors R14; no keyboard-only, touch, screen-reader-only or <=480px behavior was used as a defect.

No High/Medium issue was found in the two own ranges or their combined caller interactions. The only initially identified ordinary residual, C1-032 animation, is closed by the accepted isolated follow-up. The independent expectation read found no numeric answer-key substitution, skipped test, relaxed gate or unrequested analytical/source mutation.

## Narrow rereview: `0160cdc8` and `1c06c00c`

Reviewed only the two committed diffs on base `d4b3db28` in `/workspace/audit-review-small-fixes`. No production/test changes were made by this reviewer, and the separate S1-010 App change was neither reviewed nor counted in these chunk verdicts.

- **L16 zero convention, `0160cdc8`: accepted.** Read the exact binding rule in `output/5-repair/T19.md` and the current lead STATUS/RESUME history: literal `0,000` is not decimal-comma evidence because it reads the same either way. The production change is confined to `onlyDecimalComma`, excluding the normalized `0,000`/`-0,000` evidence forms; the value parser itself is unchanged. New independent expected values require `["0,000", "2,800"]` to read `[0, 2800]`, include signed and confirmed-unit zero controls, and retain actual nonzero decimal-comma controls. No existing expectation was altered.
- **C1-032, `1c06c00c`: accepted.** The sole production difference removes `animate-pulse motion-reduce:animate-none`; loading sentence, role, aria-hidden wrapper, all skeleton shapes and subsequent report content are exact. The new pending-fetch DOM regression verifies visible loading text, the status, multiple skeleton blocks and absence of any animation class. This closes the Low residual above.
- **Related checks: 5 files / 131 tests passed**, covering `visualData.amount`, chart final audit, LegacyVisuals authored values, ReportLibrary design and Report follow-ups. Evidence: `/workspace/scratch/report-charts-rereview-targeted.log`.
- **Independent L16 probe: 9 scopes passed**, including ASCII/typographic/parenthesized negative zero, matching suffixed zero, genuine nonzero decimal-comma evidence and the English-grouping guard. Evidence: `/workspace/scratch/report-charts-rereview-probe.mjs`, `.json`, `.log`.

Final separate verdicts: **Report PASS** (23 accepted scoped report outcomes; zero ordinary High/Medium/Low residuals). **Charts/shared PASS** (all original scoped outcomes plus the L16 zero follow-up accepted; zero ordinary High/Medium/Low residuals). **R4-005 remains Low/hostile-input/parked**, requires an invalid or unusual reporting unit, and is not a normal-data failure or blocker. No full 1,012-test repetition was needed for these isolated changes.

Not verified: parent integration of the two reviewed small-fix commits; final combined full gates/proof and before/after handoff fidelity capture; all connected chart variants in a native browser; new-slot color-blind simulations/physical grayscale print; T18/T22 original-group completion; unrelated S1-010 App work; full Python/weekly/Windows/release jobs; live models, paid runs, real Submit and Teams. Parent/source commits reviewed are Report `2a5af229..153a3191` and Charts/shared `9d7fc4c1..7cc8cad0` excluding `0a918fa7`; candidate advance `cb5c0c9b..d4b3db28` was checked only for its related diff; isolated follow-ups `0160cdc8ee9043d91c57505744d928b34c545673` and `1c06c00cd514dbe3163889332a18e473c91be52d` were reviewed and tested on their `d4b3db28` source base.
