# Stage 6 candidate register

| ID | Class | Evidence and status |
| --- | --- | --- |
| S01 | Duplicate | Pinned jscpd reported a 21-line clone in Changes `model.ts`. Accepted after reuse of the existing block reader and independent review. |
| S02 | Structural cost | Fallow reported two cycles in the report reader. Both return through the money-unit cell drawer owned by `moduleRecordsModel`. Moved the formatter to the existing money-unit module. Fallow confirms zero cycles. Accepted. |
| S03 | Dead export | Fallow flagged React `leadModules`. The only React reference is in its own file; same-name legacy exports have their own consumers. Removed only the unused export modifier. Accepted. |
| S04 | Not acted on | Fallow calls `FieldProblem.without` unused. `StartRun.tsx:578` calls it through optional chaining to clear edited errors. |
| S05 | Not acted on | Fallow's same-name `FILE_SIZE_LIMIT` exports enforce distinct 50 MB document and 20 MB comparison portfolio limits. |
| S06 | Not acted on | Ruff F401 found no unused Python imports in the sweep scope. Historical aliases and documented import exceptions need their dynamic or compatibility callers preserved. |
| S07 | Not acted on | Public catalogue/snapshot routes still have tests and legacy callers. Keep the response contract even where the React client uses a projection. |
| S08 | Not acted on | The static kit and legacy library remain reachable through their explicit entry points. |
| S09 | Not acted on | The EventLane's measured duplicate hover/focus handlers are short and state-sensitive. Original SW-D03 remains a low-benefit candidate unless exact pointer/focus parity and less code can both be shown. |
| S10 | Not acted on | Python jscpd's largest overlaps are between distinct analytical methods, prompt roles and date/reconciliation contexts. Preserve those contracts; postpone cross-method extractions until a common semantic owner and interchangeability are established. |
| S11 | Not acted on | Historical live efficiency hypotheses have different input and model provenance. This run has offline synthetic scope. |
| S12 | Duplicate | Python jscpd reported the same 21-line inline HTML comment scanner in `credit_os.cashflow` and `model_handoff_delivery`. Luna extracted it with both callable names and separate caller EOF policies preserved. Independent review accepted. |
| S13 | Existing gate failure | Both macOS native browsers reproduce the desktop proof's `US$m` expectation for Downside on untouched main. The page draws `$m` under the 2026-11-26 ruling. Keep the original assertion and record the discrepancy. |
| S14 | Existing gate failure | Both browsers fail the default proof at its 375px overflow check on untouched main. Current PRODUCT.md sets supported widths at 1024px and up. Keep the default check and report the desktop-only run separately. |
| S15 | Existing gate failure | Baseline file-open gate on native Chrome timed out after 60 seconds in one static route visit. The unchanged gate passed all 148 checks in headless Chromium on both builds. Native Edge reached 92 checks before the overall cap. |
| S16 | Performance hypothesis | `buildReportView` rescans the bounded published entry list for each module. One grouping pass reduces predicates in theory. Scope and observed report costs do not establish a gain that pays for an additional index and behavior proof. Deferred. |
| S17 | Test environment | One baseline Python case used macOS's long default pytest temp path and hit the project's 80-character path limit. The same shard passed all 196 tests with a short `--basetemp` on both trees. |

The [previous sweep register](../../../2026-11-16-final/output/6-sweep/register.md)
was used as historical discovery input. Its removals of the unread intake
cap, static readiness fallback and unused Python import remain resolved.
The chart wrappers and History implementation have evolved on main. The
pinned scans and current callers were used to select fresh items.
The remaining prior rows protect reachable Kit/legacy/public surfaces,
test seams, source identities, legacy handoff formats, separate controls
and scroll restoration, or require evidence outside the local fixture scope.
