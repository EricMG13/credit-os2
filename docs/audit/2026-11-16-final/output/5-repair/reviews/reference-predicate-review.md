# R4-012 independent review

Reviewed 2026-11-17 at exact stable code pin `a30247ebea898f4787fabf3142d6a6e069e4b74e`, branch `audit/lead-reference-predicate`, repository `/workspace/audit-reference-predicate`, against `d309b859`. The only committed changes are `web/src/pages/connected/publishedReport.ts` and a new regression test file. Existing test assertions are unchanged. Read AGENTS, relevant reader-source authority, all changed code/tests and real predicate callers. No product edits, paid/live calls, Signal edits, pushes or merges were made.

## Verdict: changes needed — 0 High / 2 Medium / 0 Low

The patch repairs the 26 supplied baseline failures, and the supplied new examples pass. Its semantic exceptions still hide ordinary analytical qualifications and introduce false negatives for genuine citations. The two findings below are grouped by their distinct visible consequences; their exact examples are independently reproduced through the real `containsReference` and `chartTable` functions, not a copied regular expression.

### RP-1 — Medium: ordinary qualifications still disappear through broad gap context and a limited number-word list

`web/src/pages/connected/publishedReport.ts:598-605`:

- `A gap remains between the Group of Seven (G7) economies.` returns **true** because any earlier word `gap` in the same clause captures the later parenthesized group name. It is ordinary economic qualification, not a module gap locator. The new test only separates the two with a sentence boundary, which does not cover this natural same-sentence case.
- `The margin rose eleven pp. 3 quarters running.` returns **true** because the percentage-point exclusion enumerates only one through ten. The exact analytical magnitude and duration are replaced with `Qualification recorded in Evidence.` in the real chart table. Digits and the first ten number words passing does not justify dropping an ordinary eleven-percentage-point statement.

The actual callers make this a reader-content defect: `visuals/visualData.ts:223-228` replaces the Basis/limitation cell; `ReportContent.tsx:338-347` replaces a plain-table cell; `ReportContent.tsx:477-487` replaces an entire finding paragraph; `visuals/LegacyForecast.tsx:313-330` suppresses case descriptions or scope sentences. A shared predicate must distinguish a real identifier's local use from unrelated gap/see prose without depending on a small quantity vocabulary. Preserve the exact ordinary qualification and the existing trace control; do not rewrite the module's amount or wording.

### RP-2 — Medium: genuine gap/page citations bypass the Evidence gate

At the same lines:

- `Lease detail not available (G12).` returns **false**. The finite gap-context list includes `unavailable` and selected `not ...` phrases, but excludes the ordinary equivalent `not available`.
- `Threshold unknown (G12).` returns **false** for the same finite-context limitation.
- `(G12).` returns **false**, although the supplied bare `(G12)` is classified as a reference; adding terminal punctuation must not turn the same standalone citation into findings text.
- `See p. 1000 for the covenant.` and `See pages 1024–1026 for the covenant.` return **false**, because page numbers are limited to three digits to avoid four-digit years. The explicit locator context makes these genuine page references, independently of their length.

All five are emitted verbatim in the actual chart-table Basis cell instead of `Qualification recorded in Evidence.`. Previously the unconditional parenthesized-gap regex and unrestricted page digits detected these examples. The primary reader rule confines source references/gap IDs to Evidence and the trace drawer; allowing them in a findings table is a regression. The fix must preserve genuine citation detection while retaining the existing ordinary `(G7)`/`(G1)` financial and group-name cases; replacing one overbroad regex with an incomplete synonym list is insufficient.

## Portable reproduction and verification

Probe script: `/workspace/scratch/reference-predicate-review-probe.mjs`. It accepts a repository root, loads that root's actual modules through local Vite SSR with dependency discovery disabled, calls `containsReference` and `chartTable`, and compares exact caller cells with independent literal expectations. It starts no listening app server and makes no application or provider request.

```sh
timeout 30 node /workspace/scratch/reference-predicate-review-probe.mjs /workspace/audit-reference-predicate
```

At `a30247eb`, the probe exits 1: **7 failed / 1 control passed**. Exact structured output is `/workspace/scratch/reference-predicate-review-probe.log`. The control `No series is available for the Group of Seven (G7) economies.` remains visible; this prevents treating every nearby adjective as a gap context in the reproduction.

Independent existing focused command, without assertion changes or longer timeouts:

```sh
timeout 300 npx vitest run src/pages/connected/publishedReport.reference-regression.test.ts src/pages/connected/publishedReport.reference.test.tsx src/pages/connected/visuals/LegacyForecast.finalAuditUnits.test.tsx src/pages/connected/visuals/visualData.chartTable.test.ts --maxWorkers=1
```

**151 tests passed in 4 files**, 5.50 seconds; `/workspace/scratch/reference-predicate-review-focused.log`. This confirms the supplied fixes but does not cover the independently failing nearby cases. `git diff --check d309b859..a30247eb` passed. The worker's broader 191-test and Signal runs are retained implementer evidence, not additional independent runs in this review. The Python quality gate has no changed Python scope for this chunk; its zero count is not validation of the TypeScript classifier.

No protected method or Signal source changed. Filename, hash, register-ID, empty-set gap and run-code branches remain unchanged; no issue was found in their diff. No speculative security or malformed-input finding is added here.

Not verified: repaired follow-up code, native-browser/Windows behavior, broad suite, live/provider execution, and all possible natural-language citation forms. This is a bounded semantic review, not analytical module acceptance.
