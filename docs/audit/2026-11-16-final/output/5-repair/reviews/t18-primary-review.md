# T18 recovery — final primary review

**Verdict: PASS for final fourth-round code `f7f1e01115c407e9ea99bc7736e9579bd5ba6045`.** No High or Medium remains from this primary review. Early `eaf0a879` was not a pass: the three source-context defects below were reproduced there, then independently checked on the final code. This completes the still-open round 4; it does not authorize a fifth implementation loop.

## Reviewed scope

Initial full review: `f9453f27..eaf0a879` in `/workspace/review-forecast`. Final review: complete related delta `eaf0a879..f7f1e011`, including `3791c5d6`, in separate detached `/workspace/review-forecast-final`. Read final committed `T18.md` and `batch-forecast.md` with `git show 82c331f4:…`. Reports-only commit 82c331f4 does not change the code pin. Original AGENTS, current R1–R17/L1–L18, stage5, task/findings/merged records, probes and relevant rubric/matrix were read. The detailed early review remains `/workspace/scratch/t18-primary-review-eaf0a879.md`.

No production/test, method, calculation, prompt, handoff, module-text or protected Signal file was edited by this reviewer. No provider/live/seat/real Submit/Teams/external application request, installation, push or merge occurred. T22 and the root's canonical-US$ / page-reference / zero-L16 / fonts / approval-field work are outside this T18 verdict. C4-019's old break-point-timing lead follow-up remains separate from the narrowed recorded drivers/shock/facilities repair.

## Early findings and final outcomes

| Record | Early eaf0a879 failure | Final f7f1e011 outcome |
| --- | --- | --- |
| R4-008 / primary M1, Medium merged into C4-003 | Other forecast table contained only Downside drivers but its Revenue drawer claimed the globally selected Base case. | Addressed. Each table passes its actual displayed groups and own case (or clears a single-case assertion for multiple groups). Native and portable SSR check the Other drawer is Revenue · Downside drivers, with exact Other values and no Base-case statement. |
| R4-009 / primary M2, Medium merged into C4-003 | Main Downside shock / no-shock Downside case omitted the retained own-downside override, instead showing base growth. | Addressed. Exact recorded case note selects own downside overrides with unaffected fields inherited; explicit historical base-stress still selects base. Missing own-case inputs produce a stated qualification rather than an invented base path. No arithmetic changed. Both supported modes and historical control pass. |
| R4-010 / primary M3, Medium merged into C4-003 | Closing debt drawer omitted the facility terms that supply the debt schedule. | Addressed. Financing/cash source contexts retain each exact facility name, balance, rate, amortisation and maturity field, without deriving a schedule. Native/source checks pass. |
| Adversarial source-binding/unit changes, reviewed for callers | Filename companion could bypass an explicit source identity; raw input amounts needed their own units. | Final code permits the exact legacy companion only with an empty retained source list. New regression covers conflicting hash and the legitimate legacy control. Raw amounts remain unconverted; captions retain original currency/scale and date spans. No conflict with root's model-display currency formatter. |
| Field-year metadata and invalid-grid link follow-ups | Dedicated inputPath drawers omitted years; unreadable grid could hide the direct Record link. | Addressed. Every field drawer retains exact years, currency and scale. The Record link is outside grid-drawing validation. Narrow tests and portable checks pass. |

Portable primary probe: `/workspace/scratch/t18-primary-portable.mjs`. It uses only existing Vite/React from the checkout's web/package.json, root-relative production imports and literal synthetic retained fields. Run from any checkout root: `timeout 300 node /path/to/t18-primary-portable.mjs --out /path/to/results.json`. No browser, engine or provider is needed.

The **same unchanged probe** exits **1 on eaf0a879: 4 passed / 7 failed**, and **0 on f7f1e011: 11 passed / 0 failed**. Outputs: `t18-primary-portable-before.json/.log`, `t18-primary-portable-after.json/.log`. Seven failing assertions cover Other case, both own-downside modes, facility terms and the three field-year scopes; positive controls preserve shock presence, historical base basis and exact selected period/value. Raw native early reproductions remain `t18-primary-other`, `t18-primary-downside-input`, `t18-primary-facility-input` scratch cjs/json/log artifacts. They are labeled intercepted source-selection evidence, not recalculated analytical correctness.

## Medium outcomes

| Finding | Final outcome |
| --- | --- |
| C4-002 | Addressed: full exact qualification ledger once per model on Evidence Record, all collected field/case/period scopes retained, including raw cells when drawing fails. Direct Record link remains available. Default LegacyForecast/ForecastTable callers retain prior qualification behavior. |
| C4-003 / C5-004 | Addressed: per-figure metric, actual stored case/period/exact values and relevant raw input context; R4-008/009/010 now pass. Original source output/hash/line token and optional default provider behavior survive. No calculation is recomputed. |
| C4-025 | Addressed: explicit source gap for missing/ambiguous/unreadable input evidence. Final strict source-identity binding prevents borrowing a conflicting filename companion. Published figures remain. |
| C4-026 | Addressed: desktop long tokens wrap locally; final delta preserves the initial unchanged probe's four 1372/1372 main-width outcomes. |
| J4-003 / C4-019 narrowed scope | Addressed: recorded drivers/category/rationale/limitations, shock and separate facilities/absence are visible. Final amount captions and exact start/end spans preserve the original input scale and planning periods. |

## Low/Info outcomes

C4-006 addressed with withUnit on all three existing bridge amounts; independent zero/source-line/currency/rejection assertions remain. C4-010 addressed with n.a. and exact missing reason. C4-012 caption x (times) leaves stored x unchanged. C4-017 closes under R16, with no new scroll behavior. C4-022 uses case/date model names. C4-024/J3-014 uses the same reader case label across cards/charts/grid while preserving authored notes and stored groups. C4-029 uses the stored group for description lookup. C4-035 labels two-decimal presentation and preserves original grid display/exact trace digits. Final related delta leaves these fixes intact; the final six-file run includes relevant basis/recovery/ratio/reader/default-table tests.

## Independent final checks

All execs bounded by timeout300; Vitest maxWorkers1; linked existing dependencies. The detached worktree is pinned to f7f1e011, with only .venv/node_modules links untracked.

| Check | Observed result |
| --- | --- |
| Portable source probe, same source before/after | eaf exit1 (4/7); final exit0 (11/0), exact revisions retained in JSON. |
| Final changed/relevant component tests | Exit0, six files / 64 tests: Forecast.recovery, Forecast.basis, Forecast, LegacyForecast, LegacyForecast.reader-text and ForecastTable. `t18-primary-final-tests.log`. No expected values changed by reviewer. |
| Final changed-file ESLint, Prettier, full typecheck | All exit0. `t18-primary-final-lint.log`, `t18-primary-final-format.log`, `t18-primary-final-typecheck.log`. |
| Final build and diff whitespace | Both exit0; existing large-chunk advisory only. `t18-primary-final-build.log`. |
| Final native source-context checks | All three exit0 on independently rebuilt f7, native Chrome with own loopback synthetic services. Other drawer now names Downside drivers; both main downside modes retain the exact own-driver array/rationale; Closing debt retains exact facility fields. Logs: `t18-primary-other-final.log`, `t18-primary-downside-final.log`, `t18-primary-facility-final.log`; JSON: corresponding `*-green.json`. Synthetic run IDs 20261117-183307-01 / 20261117-183308-01. Original positive defect expectations/logs are retained separately. |

Initial eaf verification remains valid only at its named scope: 287 affected tests, 630 caller/Signal tests; lint/format/typecheck/build; Python default gate zero findings in ten changed files/335 scoped lines; Chrome file gate; unchanged C4-002/003/025/026 probes; C5 output loop visiting58 controls; native Chrome157 and Edge155 exact figure/token/ledger/source-gap checks. Those broad checks are not falsely claimed as rerun on f7. The final delta changes no Python, Signal, provider or default PublishedTrace API; it only changes the reviewed source-context/input presentation paths.

Implementation reports at82c331f4 additionally retain 333 affected tests, final40, 743 caller/Signal checks, script checks and Chrome/Edge file gates. These are implementation evidence, distinct from the independent final checks above. The historical J4 helper was not independently exercised here; its hardcoded uv/browser paths require local adaptation and its T18 shock regex omits 20.00%. No unchanged successful J4 run is claimed. All intercepted fixtures are labeled source/component visibility scope.

Not verified: final combined-branch coverage/dependency gates and fidelity, live/paid/provider/seat/real Submit/Teams execution, Windows browsers, analytical recalculation of intercepted cases, a fifth repair round, or independent final full suites/Signal/knip/duplication/Python/file-gates reruns beyond the explicit scopes above. No pending or obsolete probe is treated as passing.
