# R4-012 — mandatory fresh final review

**PASS at exact final code `78a6baab12e273f7794329e527f216e4e1ba6479`: 0 High / 0 Medium / 0 Low findings in the bounded reviewed scope. The previously reproduced R4-012 causes are resolved.**

Reviewed `/workspace/audit-reference-last`, branch `audit/lead-reference-last`, based on report tip `05da92cfac3c59f1c1e2eedb32c11ccc7eab2064` / prior code `02fefa3447f662460493088d76ab0f0aceb90257`. This is the final authorized return, after two prior High/Medium returns. No further repair loop is requested or implied. This reviewer did not implement the change, edit product/tests or existing expected values, push, merge, or invoke paid/live/providers, seat checks, real Submit or Teams.

Read the full related diff and all 27 new literal regressions, prior independent reviews, unchanged eight-case and nine-case probes, retained last-return red/green and gate log, and the actual predicate/chart/ReportContent/LegacyForecast callers already traced in the preceding review. Applicable AGENTS, audit R1–R17, stage 5 and lead checkpoints were read in this continuous review assignment.

## Cause and preservation

The last production diff changes only `pageCitation()`'s percentage-point continuation. Its duration phrase no longer imposes a modifier count or enumerates quantity/modifier words: repeated letter/hyphenated-word tokens can precede the duration noun, while punctuation interrupts that phrase. Adjacent preceding word context is required for this spelled-quantity path. Bare, comma-separated and parenthesized page locators therefore do not acquire the duration exception merely from text following the page number. Existing numeric-quantity behavior and explicit `see`/`at`/`on`/`as` locator precedence remain unchanged.

Both previously lost statements—`The margin rose eleven pp. 3 consecutive fiscal quarters running.` and its `twenty-one` variant—now survive exactly in the real chart Basis cell, plain table, finding paragraph and ForecastScope, with existing trace/Evidence controls intact. The new tests additionally cover longer and hyphenated modifier phrases, bare and punctuated locators, explicit locator cues, and a real file/gap/run reference elsewhere in the same statement. Evidence-mode table content remains exact and complete.

The prior same-clause ordinary G7 repair and genuine G12/standalone-punctuation/high-page-number repairs remain green. The final diff does not change those detectors or caller policies. It changes no analytical content, source identity, method, prompt, calculation, handoff, dependency, gate or Signal source. Existing tests are untouched; a new test file supplies independent literal classifications and exact visible strings rather than deriving expectations from the production pattern.

## Independently observed bounded checks

| Check at the final code pin | Result / artifact |
| --- | --- |
| Unchanged original eight-case portable predicate/chart probe | Exit 0, eight cases passed; `/workspace/scratch/reference-last-review-original.log` |
| Unchanged nine-case actual-boundary probe | Exit 0, nine cases / all 45 predicate, chart-cell, FindingParagraph, PublishedTable and ForecastScope assertions passed; `/workspace/scratch/reference-last-review-boundary.json` and `.log` |
| Eight focused Vitest files including the new 27-case full-caller regressions | Exit 0, 280 tests passed; `/workspace/scratch/reference-last-review-focused.log` |
| `git diff --check 02fefa34..78a6baab` | Exit 0 |
| Protected source/test/ruling diff | Empty; only the predicate production file and new last-return regression file changed |
| Saved last-return boundary probe versus original scratch probe | Byte-identical, `cmp` exit 0 |

The focused command used `timeout 300`, existing linked dependencies and `--maxWorkers=1` for `publishedReport.reference-last`, `publishedReport.reference-round2`, `publishedReport.reference-regression`, `publishedReport.reference`, `Forecast.reader-text`, `visuals/finalAudit`, `LegacyForecast.finalAuditUnits` and `visualData.chartTable`. Portable probes used timeout 30/60 and actual modules through local Vite SSR; React boundaries were rendered with the real components and `renderToStaticMarkup`.

The nine-case log includes an informational local Vite WebSocket-port collision while the separate original probe was active; the completed structured output has no exception, all 45 checks pass and the process exits 0. It is not a browser/runtime acceptance claim. The worker's retained log independently preserves the unchanged prior-code nine-case RED (two ordinary failures) and final GREEN, plus the new test's RED (seven failures) and GREEN. Its 123 additional caller tests and frontend lint/format/types gates pass; these were read as implementer evidence and were not redundantly rerun. Its zero-Python-scope quality-gate result is not counted as validation of TypeScript semantics.

This review establishes the reported ordinary quantity/duration and genuine locator boundaries through actual callers. It does not claim that a text-only classifier exhausts every ambiguous natural-language use of `pp` or a parenthesized identifier. No remaining ordinary High/Medium was confirmed in this bounded final review, so nothing is left open here under the last-return rule.

Not verified: combined-tree acceptance/gates/proof, native-browser and Windows/work-PC fidelity at this final pin, broad/weekly suite, every possible natural-language citation form, analytical module correctness, live/paid/provider execution, seat checks, real Submit or Teams.
