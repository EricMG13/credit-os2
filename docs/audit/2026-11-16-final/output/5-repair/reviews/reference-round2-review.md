# R4-012 — fresh independent round-2 review

**CHANGES NEEDED at code `02fefa3447f662460493088d76ab0f0aceb90257`: 0 High / 1 Medium / 0 Low.** The genuine-reference regressions from the first review are resolved; the same ordinary-qualification omission cause remains at a nearby structural boundary.

Reviewed branch `audit/lead-reference-round2`, `/workspace/audit-reference-round2`, against `a30247ebea898f4787fabf3142d6a6e069e4b74e`. Later report-only tip `05da92cfac3c59f1c1e2eedb32c11ccc7eab2064` does not change this code verdict. Read AGENTS, final-audit rulings/stage 5 and lead checkpoints, the initial review and unchanged portable probe, both changed files, the repair report/log and the actual shared-predicate callers. This reviewer did not author product/test changes, change existing expected values, push or merge, or invoke live/providers, seat checks, real Submit or Teams.

## Medium — the percentage-point continuation still drops an ordinary qualification

At `web/src/pages/connected/publishedReport.ts:628`, `pageCitation()` allows zero or one intervening word before the duration noun. The ordinary statement

> The margin rose eleven pp. 3 consecutive fiscal quarters running.

returns **true**. The same statement with `twenty-one` also returns true. These are ordinary percentage-point magnitude/duration statements, with no source, page locator, gap ID or run code. A second ordinary duration modifier changes neither their analytical meaning nor their status as module-written qualification. The numeric `11` version passes because a different branch exempts numeric magnitudes; the defect remains specific to the ordinary spelled-quantity route.

The actual product boundaries confirm the reader consequence, not just a regex result:

- `chartTable()` replaces the exact Basis/limitation cell with `Qualification recorded in Evidence.`
- `PublishedTable()` replaces the original plain-table cell with `In Evidence`.
- `FindingParagraph()` replaces the full passage with `Read this passage in Evidence`, while its trace control remains.
- `ForecastScope()` omits the entire recorded scope sentence.

This is the same R4-012 / original RP-1 lost-qualification cause, with a structural optional-one-word restriction replacing the first patch's finite number-word restriction. The second modifier is a bounded ordinary-input check, not a requirement to exhaust natural language. Repair the local percentage-point/duration boundary without expanding a finite list of number words or selected modifier phrases, and keep explicit page-locator cues authoritative. No caller policy or expected literal should be changed to make the probe pass.

Portable saved reproduction:

```sh
timeout 60 node /workspace/scratch/reference-round2-boundary-probe.mjs /workspace/audit-reference-round2 /workspace/scratch/reference-round2-boundary.json
```

Observed exit **1**: two failed ordinary examples, seven passing controls. Every example checks the real `containsReference`, exact `chartTable` cell and real React `FindingParagraph`, `PublishedTable` and `ForecastScope` rendering through Vite SSR and `renderToStaticMarkup`. No listening app/server, browser navigation, provider or external request is needed. JSON retains exact original strings and rendered outputs; text log is `/workspace/scratch/reference-round2-boundary-final.log`.

Controls pass for `eleven pp. 3 quarters`, `eleven pp. 3 fiscal quarters`, numeric `11 pp. 3 consecutive fiscal quarters`, genuine `See pp. 3` and an explicit `See pp. 3 consecutive fiscal quarters...` locator, `Threshold unknown (G12).`, and the ordinary same-clause Group of Seven example. These establish the narrow structural failure and ensure that merely accepting all `pp` tokens is not the answer.

## What the follow-up resolves and independently passed

The unchanged initial eight-case portable probe now passes all eight through the actual predicate and chart-table cells (`/workspace/scratch/reference-round2-review-portable.log`). Ordinary same-clause G7 and eleven-pp text survive; genuine `not available`/`unknown` G12 annotations, standalone `(G12).`, page 1000 and page-range 1024–1026 references remain gated. The retained implementer baseline still shows the original seven failures; the copied probe is byte-identical to the original scratch source. Primary authority was not replaced by the build's output.

The new parenthesized-gap path no longer relies on a finite missing-status vocabulary or a distant clause-wide `gap` word. It considers each local annotation, so an ordinary group label does not exempt a later actual G12 citation. The page-number length restriction is removed while existing file/hash/register/run-code detectors and caller replacement policies stay unchanged. No separate reproducible High/Medium finding was added for speculative ambiguous language.

Independent focused command at the final code pin, using linked dependencies and one worker:

```sh
timeout 300 node_modules/.bin/vitest run src/pages/connected/publishedReport.reference-round2.test.tsx src/pages/connected/publishedReport.reference-regression.test.ts src/pages/connected/publishedReport.reference.test.tsx src/pages/connected/report/Forecast.reader-text.test.tsx src/pages/connected/visuals/finalAudit.test.tsx src/pages/connected/visuals/LegacyForecast.finalAuditUnits.test.tsx src/pages/connected/visuals/visualData.chartTable.test.ts --maxWorkers=1
```

Result: **7 files / 253 tests passed**, `/workspace/scratch/reference-round2-review-focused.log`. This supports the supplied cases but does not supersede the actual-caller failure above. `git diff --check a30247eb..02fefa34` passed. Only the predicate production file and a new regression file change; existing test assertions and protected methods/prompts/proof handoffs/Signal sources are unchanged. Implementer broader caller/Signal/gate results were read for scope, not repeated or represented as independent runs. No changed Python scope exists.

The boundary probe's initial scaffold attempts used a nonexistent `.tsx` suffix for the existing `RunContext.ts` and then omitted its required `t` trace entry. Those attempts failed before classifying any example and are not product evidence. Only the completed final JSON/log above supplies the verdict; scratch scaffold fixes changed no production or existing test expectations.

This is the second High/Medium return after the original implementation. The lead owns the bounded fresh last-return assignment and final pin; this review does not authorize an unlimited repair/review loop.

Not verified: a subsequent repaired pin, combined-tree gates/proof and native-browser fidelity, Windows/work-PC behavior, weekly/full suite, all possible natural-language citation forms, analytical module correctness, live/paid/provider execution, seat checks, real Submit or Teams.
