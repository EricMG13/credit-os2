# Stage 5 batch: saved fixture consistency

Base: `cb60ba18` (group 3 and reviewed batches a/b/c). Model-label dependency: `b9b2f5d4`.
Integration test correction `f67a17f0` was cherry-picked as `22c302de`; it is an upstream dependency,
not another fixture repair. No push or merge by this worker. Models and the named confidence-review /
rewrite-tournament skills requested by the historical brief are unavailable here; direct confidence
and simplest-design reviews were performed with the available worker model (R7).

## Outcomes

| Item | Outcome and resulting behaviour |
| :--- | :--- |
| J6-007 | Repaired. Fixture module labels say **Forward credit view**, distinct from the separate cash flow model Forecast tab. Their IDs and authored sample figures stay the same. Module-name references in the fixture remain consistent. |
| S2-008 | Repaired. Halden's 4.6x net leverage is company-adjusted; the 4.9x comparison is since 30 June 2026. History names that earlier pathway Full review, matching the compared run. Margin, leverage, interest cover and liquidity tiles state their own period and basis. No quantity changed. |
| S3-036 | Repaired. Each of seven facility facts has its own trace heading and exact Result, including zero, missing and withheld. Original group traces are retained. Seven new Trace rows make the full run's total **66**, formerly 59. |
| S4-001 | Repaired. The Calculations tile counts the **one** retained calculation derivation rather than 59 traced items. Other runs retain zero calculation derivations. Its note describes that scope. The reader rejects a count inconsistent with actual `calc` rows. The calculation register's separate 148-row file count is retained. |
| S4-002 | Repaired. Where the fixture counts sources but retains neither a source-bearing derivation nor an excerpt source, the drawer explicitly says those source details were not recorded. Existing details and source identities remain. The reader rejects a positive source count with no details and no stated gap. Empty Source nodes and empty excerpts cannot satisfy that gate. No source citations were invented. |
| S4-003, J6-001 | Repaired. Missing handoff ZIPs, register ZIPs and individual register bytes now have `href: null` and the explicit saved-example unavailability reason. They render disabled instead of navigating to nonexistent files. Available-download component behaviour is still tested using explicit available offers in unit-test data. |
| S6-008, S5-003, J6-004 | Repaired. Finished/failed/capped/interrupted activity links open their respective `transdigm/activity-…` library runs. A matching TransDigm 2025-06-30 library report also receives the Model's existing report links. Each activity target records its actual saved state and module completions and explicitly states that original analytical passages are absent. No invented issuer analysis, call counts, timings or financial values fill those gaps. The Model report reuses its fixture's exact bottom line and headline values. Its Forecast links to its own existing Model page. |
| F1 | Repaired. Tessaly refers to what moved in supplied results rather than to an earlier run, consistent with Changes saying no earlier run. |
| F2 | Repaired. Lumora's single row covers the same 31 calls as its total and now carries the same USD 24.60 cost; the original total is unchanged. |
| F3 | Repaired. Lumora lists its six Not run modules individually alongside the seven delivered ones; navigator/filter count is 13 and the completion total remains seven of 13. |
| F11 | Repaired. Capped examples no longer claim to have finished inside the cap. The note says they were capped before all work finished, preserving actual USD 9.80 / 24.60 spend against USD 25 caps. |
| S6-031, fixture half | Repaired in this scope. The empty More context field is recapped **No note added**, and TransDigm library targets exist. Hiding the obsolete intro on the already-started page is the separate static run worker's production change. |
| S5-009, RV-1 | Repaired in `b9b2f5d4`. Both chart cases' negative cash-flow steps are labelled **Effect of free cash flow on net debt, FY26/FY27**, matching the table. The note states that free cash flow reduces net debt. All values are retained. |
| S5-018 | Repaired in `b9b2f5d4`. Model tiles, tables, chart subtitles and the covers list use **US$m** for dollars in millions. Narrative billion amounts are preserved without conversion. |

The new TransDigm entries are explicit saved design examples, not new real-issuer analytical proof.
Their Evidence records identify the actual input fixture files and matching SHA-256 digests. Missing
call/timing data is null and says not recorded; the design-only Model record states that no execution
was performed. No new Home card changes the existing six-card design example.

## Tests first and checks

New tests: `fixtureFinalAudit.test.tsx`, `read.finalAudit.test.ts`, and the Model
`fixtureFinalAudit.test.ts`. The first fixture/reader run exited **1** (11 failed, one baseline reader
check passed); Model labels/units exited **1** (two failed). The confidence review then planted empty
Source-node and empty-excerpt cases: both new cases failed before tightening the guard. Existing
test values were not used as the expected values of production calculations.

| Check | Exit / result |
| :--- | :--- |
| Initial broader library/run diagnostic | 1; 64 files, 1,232 passed and 58 failed; failures included stale integration assertions and required fixture changes; not an acceptance result |
| After fixture assertions, 17 affected files | 1; 783 passed, three remaining expected fixture consequences (per-module new Trace rows, unchanged module metric note, activity URL) |
| Corrected consequences plus Record filter, six files | 0; 161 passed |
| Final source guard plus reader/fixture tests, five files | 0; 362 passed |
| Final three new regression files | 0; 16 passed, including the two empty-source adversarial cases |
| Model fixture-specific regression tests | 0; two passed (also supplied to the Model worker as an integration dependency) |
| `npm --prefix web run lint` | 0 |
| `npm --prefix web run format:check` | 0 |
| `npm --prefix web run typecheck` | 0 |
| `node --test web/scripts/fixture-data.test.mjs` | 0; 12 passed |
| `uv run --no-sync python tools/quality_gate.py --base cb60ba18` | 0; no changed Python files, zero findings; whole-tree import check included |
| Model numeric preservation check | 0; 28 string leaves changed; every numeric leaf and every changed string's digit groups are unchanged |
| New saved-example input-file hashes | 0; match the exact fixture bytes |

All long commands used `timeout 300`; Vitest used `--maxWorkers 2`. uv is 0.12.5 with the worker's
explicit `PYTHONPATH` and `--no-sync` so the shared editable installation cannot select another
worktree. No provider, real Submit, Teams, Signal, prompt, analytical method, calculation code or
canned handoff was changed.

## Existing test changes required by these findings

- S2-008: Overview's exact notes, adjusted qualifier and comparison-quarter prose expectations.
- J6-007: exact module-name expectations in Changes, Module, Overview, Evidence filter, read and
  Record tests; Forecast route/tab behaviour is preserved.
- S3-036: the first fact drawer's exact title; Trace total 59 → 66 and Capital structure's filtered
  traced-item total 26 → 33. Original independent financial and state assertions remain.
- S4-001: the exact Calculations tile 59 → 1 and its note; the fixture-agreement test now distinguishes
  actual `calc` derivations from trace rows. No calculation output was changed.
- S4-002: the Trace description no longer promises a derivation for every paragraph.
- S4-003: actual fixture offers are unavailable, so exact default download expectations become
  disabled offers/reasons. Explicit available offers preserve link/style branch tests. Path-validation
  tests clear the unavailable reason when installing an address, and decode-failure tests explicitly
  supply a valid address; these setups still exercise their original conditions.
- S6-008: exact finished/failed/capped/interrupted activity URLs in slice and activity rendering tests.
- S6-031: Start recap's exact note becomes No note added.
- The Model worker owns existing Model-page expectations for the US$m labels and debt-walk note;
  that worker received the isolated fixture commit. This worker added independent fixture assertions.

## Confidence and simplest-design review

The chief doubts were invented source details, confused missing/zero values, scope of a calculation
count, a generic facility Result, and links to reports of a different saved state. Source gaps are
explicit, all missing forms remain separate, calculation counts are checked against retained rows,
each fact has an independent Result, and each activity target has its own state. The Model's numeric
leaves and digit groups were compared against the base, independently of renderers. The additional
empty-source adversarial cases caught and repaired the only confirmed new guard defect.

Reader validation uses two small checks beside existing consistency checks. It introduces no new
schema, compatibility layer, dependency or rendering abstraction. Fixture source references remain
on Evidence or in drawers. Reformatting was constrained to changed JSON subtrees; unchanged original
formatting was retained where practical.

Not verified: browser rendering/clicks of the new saved TransDigm targets and unavailable downloads; the original audit probes (several assert removed fixture wording); the combined final-tree frontend/Signal gates and fidelity after-capture, which belong to the lead; the full Python/weekly/Windows suite; a real issuer or paid run; the started-page intro half of S6-031 (owned by the static run worker). The new target pages were checked as fixture/reader data, not as real-issuer analytical reports.
