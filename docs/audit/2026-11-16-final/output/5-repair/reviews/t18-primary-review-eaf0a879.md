# T18 recovery primary review — pinned eaf0a879

**Verdict: CHANGES NEEDED for C4-003 / C5-004.** Three Medium source-context defects remain on the reviewed candidate. No High finding. Other narrowed Medium repairs and the forecast Low/Info batch are supported by the checks below. This is review of the recovered unfinished round 4, not a fifth implementation round; disposition under R12 belongs to the lead.

## Scope and inputs

Reviewed `/workspace/review-forecast` at `eaf0a879be4c216675b9c2c25bc626b14b58798f`, against `f9453f27`. Read the complete diff (production, tests and status), AGENTS.md, current origin/audit/final-coordination README R1–R17, lead STATUS/report and L1–L18, stage 5, quality gate, T18 task, original/merged finding records and their probes, relevant design/content matrix rows, and recovered T18.md / batch-forecast.md from `/workspace/repair-2` as then present. Those reports were initially uncommitted; no claim is made to have reviewed a later report commit or source change. The review worktree and production/tests were not edited. Only scratch evidence/build outputs were written.

T22, methods, providers, prompts, calculations, module text/handoffs and Signal changes are outside this review. The old branch's `$` basis formatter versus root's canonical `US$`, page-citation policy work, zero/L16, fonts and approval fields are known separate integration work and are not new T18 blockers. C4-019's old break-point timing follow-up remains separately owned; the narrowed recovery here is retained drivers/shock/facilities.

## Medium findings

### M1 — Other-case row drawers claim the globally selected case

- Affected finding: C4-003 / C5-004; supported ordinary `cashflow.other` state.
- Cause: `web/src/pages/connected/visuals/LegacyForecast.tsx:114–118` sends a table's `groups` but does not override `case`; `report/Forecast.tsx:466–468` consequently injects the global selected case. `report/ForecastRecord.tsx:152–153` prints that inherited case in the drawer heading and statement, although selectedValues correctly reads the table's own groups.
- Reproduction: with Base case selected, add the same valid Other-grid shape used by the retained C4 state probe, whose columns are `Downside (CP-2G drivers)`. Open that table's Revenue source control. Its table header is `Downside drivers`, but the drawer heading is `Revenue · Base case`, and its statement begins `Revenue · Base case · Downside drivers · FY2025E: 1050 …`. The retained output's case has been misidentified.
- Production relevance: `apps/issuer-library/credit_os/cashflow.py:1595,1635` writes other cases to this supported separate grid. No unusual label, malformed value or narrow viewport is needed.
- Evidence: `/workspace/scratch/t18-primary-other.cjs`, `.json`, `.log`, `.png` (native Chrome, 1440 desktop). The scratch probe exits 0 only after positively asserting the incorrect inherited Base case together with the actual Downside drivers table/values. This is a defect reproduction, not a passing acceptance check.
- Required behavior: a table's source context names its displayed case(s), independent of another selected case. This needs no calculation or data change.

### M2 — Main downside drawers omit the recorded downside driver basis

- Affected finding: C4-003 / C5-004; supported own-downside-driver states with and without shock.
- Cause: `report/ForecastRecord.tsx:136–147` adds `downside_drivers` only when the reader case is exactly `Downside drivers`. The main grid uses `Downside shock` when a shock is present, or `Downside case` for own downside drivers without a shock. Both paths therefore expose base_drivers as derivation evidence and omit the changed downside driver.
- Expected basis is explicit existing behavior: `src/deploy_workflow/owners/cpos_forecast.py:882–896` sets stress_basis to `downside_drivers.over(base)` when present and uses that basis for both DOWNSIDE_DRIVERS and DOWNSIDE, under `docs/rulings/2026-11-13-downside-follows-forward-model.md`. No methodological change is proposed.
- Reproduction: snapshot-intercept a retained input block with `downside_drivers.revenue_growth.values = ["0.01","0.01","0.01"]` and rationale `Retained downside revenue growth`, then use each supported model note: shock applied to the model's own downside drivers, and own downside drivers with no shock. Select the corresponding main Downside case and open Revenue. Both drawers show `base_drivers.revenue_growth` with `["0.05","0.04","0.03"]`; neither includes `downside_drivers.revenue_growth` or its rationale. Exact model figures and original evidence token still survive; the selected derivation evidence is incomplete/misleading.
- Evidence: `/workspace/scratch/t18-primary-downside-input.cjs`, `.json`, `.log`, native Chrome. Positive defect assertions cover both states. This is source-selection/visibility proof using intercepted state, not a claim that the synthetic figures were analytically recalculated from the altered inputs.
- Required behavior: include the retained downside driver overrides wherever the model's own downside basis is actually consumed, with inherited base fields still available. No new analysis is needed.

### M3 — Debt figure drawers omit their recorded facility schedule basis

- Affected finding: C4-003 / C5-004, same retained-input completeness family as M2.
- Cause: `report/ForecastRecord.tsx:120–148` adds only base/case driver fields, shock and years for figures; facilities are considered only for the dedicated facilities-region source control. Thus Closing debt still offers base.debt and base_drivers.debt_repayment without facility terms when recorded facilities drive the result.
- Existing production behavior: `cpos_forecast.py:897–913` uses schedule(facilities) and passes that schedule into the model; facility annual_amortisation is necessary to understand Closing debt. No recalculation or new analytical policy is requested.
- Reproduction: snapshot-intercept a valid fixed facility (600 balance, 6.00 fixed_rate_pct, 50 annual_amortisation, 2028-03-31 maturity). The separate Recorded facilities region visibly contains `Recorded fixed facility`. The Closing debt Base case drawer still shows base.debt and debt_repayment but contains neither this facility nor annual_amortisation.
- Evidence: `/workspace/scratch/t18-primary-facility-input.cjs`, `.json`, `.log`. Positive defect assertions on native Chrome, synthetic intercepted visibility/source-selection scope. No claim of recalculated analytical correctness.
- Required behavior: retain the relevant recorded facility terms in the figure's source context when those terms supply its debt/interest/cash calculations.

## Medium repair outcomes

| Record | Outcome on eaf0a879 |
| --- | --- |
| C4-002 | Addressed in reviewed scope. Forecast no longer repeats the line-gap bullets, and Evidence Record deduplicates each exact note/limitation/reason while retaining applicability and model/source identities. Raw malformed-grid cell reasons are collected independently of drawing validation. Default LegacyForecast callers retain their prior qualification behavior. |
| C4-003 / C5-004 | Partly addressed, remains open for M1/M2/M3. Base/no-own-downside drawers now identify metric, actual selected case, periods, exact values and input fields; original output/hash/line token remains exact. Existing provider default path remains optional-context compatible. |
| C4-025 | Addressed. Unmatched source and duplicate-section, duplicate-block, malformed JSON and array JSON states show the source gap while preserving model figures; no guessed fallback is introduced. |
| C4-026 | Addressed at desktop width. Unchanged probe reports all four targeted locations at main scrollWidth/clientWidth 1372/1372. |
| J4-003 / C4-019 (narrowed retained-input scope) | Addressed for visibility. Recorded driver arrays/category/rationale/limitations, shock and separate facilities region or absence are visible. Original placeholder is suppressed. Native evidence covers the canned run with no facilities; no live or method claim. |

## Forecast Low/Info outcomes

| Record | Outcome and independent evidence |
| --- | --- |
| C4-006 | Addressed. All three existing bridge amounts use withUnit. Existing independent bridge/zero/source-line/currency/rejection tests pass; no authored amount or arithmetic changed. Branch currency rendering is a known root integration item. |
| C4-010 | Addressed. `n.a.` and the exact last-cell reason are asserted on the case card by the recovery regression. |
| C4-012 | Addressed. Exact stored x remains x; only the caption reads x (times). New regression and native Leverage caption check pass. |
| C4-017 | Closed by R16. Read-only code check confirms active state only feeds aria-current; no new scroll tracking was introduced. |
| C4-022 | Addressed. Cases/date replace candidate/alternate builder words; exact 31 March 2025 regression passes. |
| C4-024 / J3-014 | Addressed. Grid group labels share forecastCaseLabel with cards/charts; unchanged stored group/note identities still drive selection. Authored notes and distinct Downside-module scenario names survive. |
| C4-029 | Addressed. Stored group drives description lookup; Upside description regression passes. |
| C4-035 | Addressed. The two-decimal display is labeled; authored grid display and exact trace digits remain separate and unchanged. |

## Independent checks

All checks used linked existing dependencies, maxWorkers=1 for Vitest, timeout 300, and own checkout PYTHONPATH for Python. No installation, paid/live provider/seat/real Submit/Teams/external application request was used. The browser adapter changes only Playwright's executable path; retained probes were not edited.

| Check | Actual result / scratch log |
| --- | --- |
| Affected Forecast/basis/recovery/Downside/Evidence and visuals | Exit 0, 22 files / 287 tests. `t18-primary-vitest-final.log`; command from `/workspace/review-forecast/web`: `timeout 300 ./node_modules/.bin/vitest run src/pages/connected/report/Forecast.test.tsx src/pages/connected/report/Forecast.basis.test.tsx src/pages/connected/report/Forecast.recovery.test.tsx src/pages/connected/report/Downside.test.tsx src/pages/connected/report/Evidence.test.tsx src/pages/connected/visuals --maxWorkers=1`. |
| Callers and protected Signal | Exit 0, 34 files / 630 tests. `t18-primary-callers-signal.log`; same Vitest invocation for `ReportContent.test.tsx ReportLibrary.test.tsx src/pages/signal`. |
| lint, format:check, typecheck | All exit 0. `t18-primary-lint.log`, `t18-primary-format.log`, `t18-primary-typecheck.log`. |
| Python quality gate | Exit 0, zero findings, 10 changed files / 335 scoped lines against existing default base. T18 changes no Python. `t18-primary-quality.log`; `env PYTHONPATH=/workspace/review-forecast/src /workspace/audit-tooling/bin/uv run --no-sync python tools/quality_gate.py`. |
| Build | Exit 0. Existing large-chunk advisory only. `t18-primary-build.log`. |
| Native Chrome file gate | Exit 0, required CI mode, explicit `/workspace/audit-browsers/chrome/opt/google/chrome/chrome`. Includes Signal routes. `t18-primary-file-chrome.log`. |
| Unchanged C4-002 probe | Exit 0, no defect seen; fresh synthetic run, own port 8796. `t18-primary-probe002.log`. |
| Unchanged C4-003 probe | Exit 0, eight distinct drawers; own port 8798. `t18-primary-probe003.log`. This probe does not cover M1/M2/M3. |
| Unchanged C4-025 probe | Exit 0, 58 to 13 controls and page explains loss; port 8801. `t18-primary-probe025.log`. |
| Unchanged C4-026 probe | Exit 0, all four locations wrap; port 8802. `t18-primary-probe026.log`. |
| Unchanged C5 forecast-drawer output probe | Sequenced rerun exit 0 and all 58 controls visited; its old `Forecast inputs` heading filter matches zero of them. This is completed output coverage, not an acceptance assertion. Own port 8805. `t18-primary-c5-final.log`. |
| Independent native fidelity/source-loss proof | Exit 0, Chrome 157.0.8103.78 and Edge 155.0.4283.62, synthetic run 20261117-181037-01. Actual Base and Downside Revenue/Closing cash/Closing debt drawers preserve every plotted period/exact value and original output/hash/line href; original model ledger text once; drivers/shock/separate facilities notice/ratio visible. Four intercepted source states per browser (duplicate section/block, invalid JSON, array JSON) preserve figures and announce source gap. Zero external hosts and page errors. `t18-primary-native.cjs`, `.json`, `.log`. |

Initial Vitest invocation from repository cwd missed the web @ alias (17 import failures, five tests files passed); it is a harness error, retained as `t18-primary-vitest.log`, and is superseded by the correctly rooted successful run above. No test expectations, skips or gate settings were changed by this reviewer. Existing changed expectations in the implementation are limited to requested unit wording, case display label and accurate module-only gap wording, not business values/source identities.

The original C5 forecast-drawer probe is an output probe, not an acceptance assertion; its first attempt printed 0 of 0 controls during a concurrent rebuild and is not evidence of closure. The sequenced rerun visited all 58 controls and correctly matched none to the former generic heading; its log is retained separately. The old J4 harness uses a removed run-start flow and its shock regex does not recognize 20.00%; no successful unchanged J4 execution is claimed. Native/table checks above positively exercise the replacement visibility scope instead. C4 Low probes spanning unrelated controls are not claimed as passing from their exit status; requested Low behavior is checked directly by the scoped tests/native evidence.

Not verified: any live model, paid/provider/seat/real Submit or Teams behavior; Windows Chrome/Edge; final combined-branch gates/fidelity; independent reruns of knip/duplication/test:scripts/npm audit, Edge's full file gate, or the obsolete unchanged J4 harness; nonempty facility schedule analytical correctness (visibility/source omission was exercised); later source commits or uncommitted fixes after pinned eaf0a879; any fifth repair round. Source-selection reproductions use explicitly intercepted synthetic states and do not establish recalculated analytical correctness.
