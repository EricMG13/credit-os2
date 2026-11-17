# Stage 5 Low and Info batch: connected report follow-ups

Branch `audit/lead-report-followups`, inherited base `ca34e739`. This is separate lead work;
the original repair-2 branch was not changed. The lead granted the narrow exceptions for
`reportView.ts`, `BreakPoints.tsx`, the money display answer keys, the optional shared-part
props, card trace wiring, approved-summary rendering and the Forecast case-card unit label.
No protected Signal directory, module-written passage, stored quantity, period, limitation,
source identity, method, prompt, calculation, dependency, timeout or gate was changed. No paid,
real Submit or Teams call ran.

## Finding outcomes

| Finding                                     | Outcome in this branch                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1-014 (C3-030/C5-031/J1-010/J3-018 merged) | Report titles name the selected module or Evidence tab. A known issuer is retained when its report is unpublished. Other connected screen titles belong to the shell batch.                                                                                                                                                                                                                      |
| C3-012                                      | CP-8 remains available on Changes and Evidence, and leaves the module navigator/count. Old `#modules/CP-8` bookmarks open Changes.                                                                                                                                                                                                                                                               |
| C3-015                                      | The continued lead passage is labelled by the actual lead, including “Earnings view, continued” and “Credit view, continued”.                                                                                                                                                                                                                                                                    |
| C3-016                                      | A referenced lead retains its navy band, with its exact Evidence destination; financial tiles follow the band. The withheld raw passage stays withheld.                                                                                                                                                                                                                                          |
| C3-021                                      | Overview fallback figures no longer nest inside a Bottom line card. The Changes-wrapper half was already repaired by batch a and must survive integration.                                                                                                                                                                                                                                       |
| C3-027                                      | Overview uses the ruled Credit view/Earnings view kicker.                                                                                                                                                                                                                                                                                                                                        |
| J1-009 (J3-008/J4-014 merged)               | Modules and Evidence use the existing `moduleOrder` order, aligned to recorded run steps. Overview identifies its lead author with a module link; CP-8 is excluded from the prose-module count. Without recorded steps, the existing deterministic module-order fallback remains in force. No financial derivation changed.                                                                      |
| J3-017                                      | The tab says History and the breadcrumb names the issuer.                                                                                                                                                                                                                                                                                                                                        |
| J3-019                                      | The connected control says “Highlight source icons”, matching its existing ring behavior. The shared SourcesSwitch default remains “Show sources”, so static readers retain their existing label.                                                                                                                                                                                                |
| J5-005                                      | The ruled first-run sentence is exact. A separate sentence explains that it describes the library when this run was made and later listings do not revise its comparison.                                                                                                                                                                                                                        |
| C4-030                                      | Calendar event names retain their readable words while filename references remain in Evidence. A known recorded lane/status is retained on unplaced rows.                                                                                                                                                                                                                                        |
| J3-011                                      | Calendar expands Wall/Cost/Rating labels and explains recorded categories and date precision without reclassifying dates. Overview drops the unexplained precision suffix after the date.                                                                                                                                                                                                        |
| J3-016                                      | Downside shares and break points use one percentage form, cash-interest increase has a percentage unit, and the selector names the chosen stress case. Stored values and calculation data attributes are unchanged.                                                                                                                                                                              |
| C1-023 (J1-013 merged)                      | Report timing uses the shell's unchanged `asOfDate` helper, including an existing “As of YYYY-MM-DD” period. Other sibling-screen dates belong to the shell batch.                                                                                                                                                                                                                               |
| C3-011                                      | Comparison differences reuse `changeText`, including a positive sign. Values and comparison classifications are unchanged.                                                                                                                                                                                                                                                                       |
| C4-013                                      | Connected money display uses US$ for USD and ISO codes for other currencies; unit labels are US$m/GBPm/EURm/CHFm. The Forecast case-card label also uses `unitLabel`. LegacyForecast's two unit labels belong to the charts worker. Raw metadata is unchanged.                                                                                                                                   |
| C5-005 / OQ-03                              | Evidence hides the ineffective header highlight switch. Other report pages keep it with its truthful label.                                                                                                                                                                                                                                                                                      |
| C5-025                                      | The ReportContent drawer groups real table citations by their row, retains whole-table citations, and suppresses no-page boilerplate only for source-free tables. Actual file/hash/quote/excerpt/named-source details remain. The Evidence-table half is inherited from the Evidence batch.                                                                                                      |
| J3-015                                      | Confidence cards say “out of 100” beside the original score/band. The T22 confidence-drawer parsing repair is separate lead work.                                                                                                                                                                                                                                                                |
| C1-032                                      | The report's loading state has a static page-shaped skeleton and visible loading sentence. Other screen skeletons belong to the shell batch.                                                                                                                                                                                                                                                     |
| J1-012                                      | The report link to a single run says “Run progress”. Other navigation wording belongs to the shell batch.                                                                                                                                                                                                                                                                                        |
| J4-001                                      | Clicking a card figure loads only that run's scoped snapshot, resolves the original row through existing `headlineSources` semantics, and opens its exact trace/Evidence link. Initial card loads remain compact. Missing, stale or failed provenance produces an explicit message. Value, unit and period must match the displayed figure; same-valued figures in another currency are refused. |
| R4-004 (new review follow-up)               | Record renders approved-summary scope/reason/fix through the same `serviceText` mapping used on approval. Stored metadata remains exact; ordinary CP-1C/CP-DR wording now matches the approved wording.                                                                                                                                                                                          |

T20's two residuals are covered by the calendar cases: an unplaced event keeps its recorded
status lane, and failure wording covers event name/status/date/precision rather than blaming
a valid date. T17's known-issuer unpublished-report title is also covered.

## Test-first evidence

All new repair cases were run against the relevant old behavior before their production fix.
Raw local logs are retained in `/workspace/scratch/report-followups-*.log`.

| Red run (exit 1)                    | Observed result before repair                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `red-all`                           | 18 failing cases across report, Calendar and Downside: order/count, specific titles, History, lead name/attribution/band, toggle label, drawer groups, confidence denominator, first-run timing, long date, money labels, signed delta, stress labels and calendar vocabulary/status/reason. Five existing cases passed. |
| `red-shell`                         | Loading skeleton and known-issuer unpublished title failed, alongside still-unrepaired report cases.                                                                                                                                                                                                                     |
| `red-citations`                     | Two focused cases failed: a source-free score table produced only “no page”, and real row citations had no row group.                                                                                                                                                                                                    |
| `red-breakpoints`                   | The new exact `10%` assertion failed while the old `0.10 (10%)` display remained.                                                                                                                                                                                                                                        |
| `red-adversarial`                   | Two further cases failed: the old CP-8 module bookmark fell back to another module, and a pre-prefixed ISO as-of date remained ISO.                                                                                                                                                                                      |
| `red-approved-labels-exact`         | Record lacked the exact approved “Peer benchmark … Research questions …” wording. The new test was first authored with “Peer benchmarking”; inspection of the approval mapper corrected that new literal to the actual approved “Peer benchmark”, then the corrected case was rerun red before the production fix.       |
| `red-card-trace`                    | Three cases failed because card figures had no source control: exact row, same-value wrong currency, and source-load failure. A fourth stale-result guard passed after implementation; it is not claimed as a red-first case.                                                                                            |
| `red-forecast-unit-correct-fixture` | Case-card content contained `USD millions`, not independently expected `US$m`. The first draft fixture had only one case and failed to find the conditional radiogroup; it was corrected to two cases and rerun red before the one-line display fix.                                                                     |

Final green cases include exact numeric strings, zero, decimal precision, grouping, signs,
source row/hash identities, whole-table versus row citations, real source details, unpublished
issuer identity, failed/missing provenance and a pending lookup whose displayed metric changes.
The async lookup's controller lives in the same state as its result, and result identity checks
discard late responses. This replaced an equivalent ref implementation after hooks lint rejected
the callback capture; no lint suppression or test weakening was used.

## Finding-required expectation changes

No input/case/order/numeric/sign/precision/quantity-family/tone expectation was weakened.
The lead expressly granted the following display-only answer-key changes for C4-013, overriding
the key's historic coordinator note. Every expected value remains a literal independent of
production formatting.

- `moneyUnits.cases.json` amount outputs: `$2,222m` (two cases) → `US$2,222m`;
  `$2,222.5m` (two) → `US$2,222.5m`; `$0m` → `US$0m`; `$999m` → `US$999m`;
  `$1,234,567.80m` → `US$1,234,567.80m`; `-$150m` → `-US$150m`;
  `-$1,500m` → `-US$1,500m`; `£1,250m` (three) → `GBP 1,250m`;
  `€90m` (two) → `EUR 90m`. CHF amount outputs were already canonical and remain exact.
- That key's unit outputs: `$m` (two) → `US$m`; `£m` (two) → `GBPm`;
  `€m` → `EURm`; `CHF m` → `CHFm`.
- Connected `signal.cases.json` has exactly four display changes: `+$25m` → `+US$25m`,
  `-$25m` → `-US$25m`, `+£1,250m` → `+GBP 1,250m`, `$0m` → `US$0m`.
  The protected Signal directories were not edited.
- Existing currency assertions in `HeadlineFigures.signal.test.tsx`, `publishedReport.test.ts`,
  `reportView.test.ts`, `ReportLibrary.design.test.tsx`, `Forecast.basis.test.tsx`,
  `Modules.test.tsx` and `Securities.test.tsx` changed only those prefixes/unit labels.
- `publishedReport.test.ts` changed the as-of display `2025-03-31` to `31 March 2025` (C1-023).
  `ReportLibrary.design.test.tsx` drops only ` · day` from the existing calendar date (J3-011).
- `ReportLibrary.wayfinding.test.tsx` expects History instead of Report (J3-017).
  `ReportContent.findings.test.tsx` expects “Earnings view, continued” instead of
  “Decision rationale” (C3-015).
- Calendar tests expect the broader event-gap wording and
  “The recorded event name, status, date or precision could not be plotted.” (T20 residual).
  `BreakPoints.test.tsx` table cells expect `12.5%` and `0%` in place of `0.125000` and `0`
  (J3-016); the original exact values/data attributes remain guarded.
- `reportView.test.ts` expects row groups FY2027/FY2028 in place of one flat filing-source
  child (C5-025); both original source records and their qualifications remain exact.

## Checks and review

All long commands used `timeout 300`; Vitest used `--maxWorkers=1`. Python used uv 0.12.5,
`--no-sync` and this worktree's explicit PYTHONPATH. No install or gate change ran.

| Check                                                       | Exit/result                                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Full affected Vitest                                        | 0; 44 files, 549 tests passed.                                                                                    |
| Final changed async-handler/Forecast/report regression run  | 0; 4 files, 45 tests passed, including the new Forecast case.                                                     |
| Signal Vitest after shared BottomLine/SourcesSwitch changes | 0; 34 files, 630 tests passed.                                                                                    |
| `npm run lint`                                              | 0 after the state-based request cleanup and removing two unnecessary new-test null fallbacks.                     |
| `npm run format:check`                                      | 0.                                                                                                                |
| `npm run typecheck`                                         | 0.                                                                                                                |
| Default `uv run --no-sync python tools/quality_gate.py`     | 0; no findings in the inherited 15 changed Python files/643 scoped lines. No Python production code changed here. |
| `git diff --check`                                          | 0.                                                                                                                |

Direct confidence review checked missing versus zero, exact precision/grouping/signs, same
value with another currency, row versus table provenance, missing/failed/stale source requests,
unplaced events, invalid status with a valid date, prefixed as-of dates and old CP-8 bookmarks.
Confirmed issues received the additional red cases above. Direct simplest-design review retained
the existing module-order helper, `changeText`, `headlineSources`, trace resolver and shared
as-of formatter rather than introducing new stores, abstractions or dependencies. Card trace
fetches are on demand, and no initial per-card full snapshot is fetched. No owned report text-xs
font replacements were needed.

## Integration

Own implementation commits start at `9ad50265`, followed by `0af85674`, `ed76e94f`,
`b8bb7319`, `54d36d85` and `a752a690`. The lead must preserve shell `803cf846` changes
when applying the small LibraryIndex imports/helper/card wiring, charts changes to
`publishedReport.containsReference` and LegacyForecast, runtime Record provenance sections,
the Changes-wrapper repair and the Evidence half of C5-025.

Exclude dependency commits `fe2d381a` (exact copied shell `asOfDate`) and `2a5af229`
(Evidence final `7ebb6476`) after integrating their originals. Do not cherry-pick them twice.

Not verified: this worker did not rerun original browser probes or capture after pixels; the lead owns the combined fidelity check and VERIFICATION.md entry. No full weekly suite, live/model execution, real Submit, Teams call, Windows/release-package check or paid issuer proof ran. Other shell titles/skeletons/dates, Changes-wrapper repair, Evidence half of C5-025, T22 confidence-drawer parsing and LegacyForecast unit labels require their separate worker integration. Requested historical models/skills were unavailable; direct confidence and simplest-design review used the R7 fallback.
