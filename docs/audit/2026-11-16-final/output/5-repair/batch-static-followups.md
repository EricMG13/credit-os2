# Stage 5: static Model and navigator follow-ups

Base: `cb60ba18` (group 3 plus reviewed batches a, b and c). This worker changed no Signal,
analytical method, prompt, calculation, canned handoff or module-written analysis. No paid,
real Submit, Teams or external application call was made. All long commands used `timeout 300`.
Requested historical models and confidence-review/rewrite-tournament tools were unavailable;
the available inherited model and the stage brief's direct review/simplification checks were used.

## Outcomes and commits

| Finding | Outcome |
| :--- | :--- |
| R3-001, OQ-14 | Repaired: one or two cases read, with existing case-alignment checks preserved. All six Model pages remain readable for a consistent one-case payload. Forecast states the missing second case. The binary comparison is an explicit gap; a one-case run may omit it or supply null, without inventing another case. Zero cases and three cases still fail. |
| S5-010 | Repaired: one in-memory choice per run and loaded library, shared by Model and Forecast and retained through intervening pages. A different run starts on its own first case. |
| S5-011 | Repaired: captions name the views the choice actually changes; they no longer promise every chart changes. |
| S5-012 | Repaired schema and rendering: optional source addresses on headroom, segment, limits, scatter, strip/driver and path rows. Every affected table row carries its supplied source control, or `Source not recorded` when the data supplies none. Forecast walk's existing nullable trace uses the same marker. No row source is inferred or fabricated. All supplied addresses retain the existing library-address check. No shared chart edit was needed. |
| S5-016 | Repaired: empty Model index has a featured icon, explanatory sentence and Library link. |
| S5-019 | Repaired: negative statement bars have a pattern in addition to their unchanged minus-signed amount and colour. Missing, withheld and zero cells keep their existing branches. |
| S5-020 | Repaired: the cash-flow section uses the delivered walk subtitle, including its actual period; one-case sections say `Published case`. |
| S6-026 | Repaired for assigned `#/run/start`: sentence and Library link. This worker did not own the other StartPage/activity empty states; the lead must reconcile those paths before closing the whole original finding. |
| S3-028 | Repaired: the current entry scrolls within its own navigator, bounded by both the navigator and visible window; the alignment is repeated on a desktop-window resize. |
| S3-037 | Repaired: non-Delivered navigator entries draw their state words beside the shape and module name. |
| T37 review residual, lead follow-up 13 | Repaired: at 481–1,000px, module and page-section selectors replace the long lists; wider desktops retain the lists. Search still precedes both forms. Scope at 480px and below is unchanged. |
| X1-023 stale type comment | Repaired wording: null range hides the strip while supplied markers still draw. |
| S5-009, S5-018 | Fixture dependency, implemented by the separate fixture worker: original `b9b2f5d4`, identical cherry-pick `2e8a878d` here. This worker updated affected Model test assertions to the required fixture labels, sign-convention note and unit spellings. The lead should integrate the original fixture commit once, then the implementation commits below. |

Implementation commits: `d518ab0a` (empty states), `7f648782` (Model family),
`1f2026b9` (navigator and one lint-only NewRun simplification), `b878df93` (viewport bound),
plus the final resize/evidence/report commit containing this file. Do not cherry-pick the dependency
a second time if `b9b2f5d4` is already integrated.

## Test-first evidence

- New `one-case.test.tsx`: initial 10 tests failed on the old reader; the two missing/null binary
  comparison cases later failed before that support, then passed. Tests read both forecast and
  no-forecast variants, preserve the source object and draw all six pages.
- New empty-index test and the run-empty assertions failed before their repairs.
- New `case-choice.test.tsx` and `StatementTable.negativePattern.test.tsx`: four failures before
  state/caption/period/pattern changes, then pass.
- New `chart-row-traces.test.tsx`: five failures before optional row sources and markers, then pass;
  it exercises all nine table forms and an unsafe supplied address.
- New `ModuleNav.compact.test.tsx`: absent picker first failed; visible state word and scroll
  alignment then failed; viewport/header and resize adversarial cases each failed before their
  respective repairs.
- Browser measurements exposed the resize residual beyond the first unit test: the selected entry
  was at 1,112–1,170px in a 900px window after resizing from compact to wide. The regression pins
  those measured bounds rather than computing an answer from production code.

The new test queries were corrected to scope case radios to their Case group (chart/table toggles
are also radios), and to locate the existing statement column header rather than invent a table
caption. The finding-required expectations themselves were retained.

## Existing expected values changed for required behaviour

- `routes.firstDraft.test.tsx` now pins the full approved saved-example sentence appended by the
  earlier batch, per the lead's explicit integration authorization; the expected amount is unchanged.
- `Module.search.test.tsx` preserves integration commit `f67a17f0`'s exact nine section labels
  instead of its stale count of six, and locates the name independently of the newly drawn state word.
- `StatementsPage.test.tsx` and `ForecastPage.test.tsx`: exact captions now match S5-011; Forecast's
  section heading uses the fixture's delivered period/subtitle (S5-020).
- Analysis, Portfolio fit and Forecast table assertions retain every old figure, period and missing
  value, adding only the required source column/`Source not recorded` marker (S5-012).
- `read-sections.test.ts` keeps the three-case refusal, now named `expected at most two cases`.
  `read.noForecast.test.ts` keeps rejecting an inconsistent payload that merely removes a case but
  leaves two-case statement notes; the reason is now that existing alignment check. A fully consistent
  one-case/no-forecast payload is separately accepted.
- Fixture-dependent assertions in Front, Model/Statements, StatementsSections, Forecast and
  read-sections use `US$m` in place of the fixture's former USD spellings, and the three unchanged
  headline amounts are prefixed `US$m`. Net-debt step labels name their free-cash-flow effect; the
  exact note adds the fixture worker's stated subtraction convention. No numeric answer was changed.

## Checks

| Command / scope | Exit and result |
| :--- | :--- |
| Initial targeted six files | 0, 20 tests after repair |
| Row-source surface/parser file | 0, 5 tests |
| Full Model attempt before final fixture-note assertion alignment | 1, 778 passed and one exact fixture-note mismatch; no code failure. The assertion was then updated only to S5-009's new complete sign-convention note. |
| One-case, read-sections, StatementsSections after that alignment | 0, 3 files / 119 tests |
| Final Model + Signal + navigator + first-draft combined attempt, `--maxWorkers=1` | 124 at the fixed 300-second cap; no complete counts retained. This is not claimed as a pass. No timeout, test or gate was loosened or skipped. |
| Final navigator/search after viewport/resize repair | 0, two files / nine tests, including viewport and resize |
| `npm --prefix web run lint` | 0; targeted ESLint of final resize callback/test also 0 |
| `npm --prefix web run format:check` | 0 |
| `npm --prefix web run typecheck` | 0 |
| `CREDIT_OS_OUT_DIR=<scratch> npm --prefix web run build` | 0, both static and connected bundles; static-only rebuild after the final navigation repair also 0 |
| Default `uv run --no-sync python tools/quality_gate.py` with uv0.12.5 and own PYTHONPATH | 0, two inherited changed Python files / 28 lines, zero findings. No Python changed by this worker. |
| Quality gate against `origin/audit/final-repairs` | 0, zero changed Python files; recorded as vacuous, not stronger evidence. |

## Browser evidence (S3-028, S3-037 and desktop compact residual)

Final file-open check: **0**, Google Chrome **157.0.8103.78**, reduced motion,
all non-local page requests blocked, no external request observed. At widths 481, 768 and 1,000
pixels the compact controls are visible; at 1,440 the full navigator is visible. Resizing from
compact to wide brings the current entry to 842–900px in the 900px window, with the navigator's
own scrollTop 270. The earlier entry was at 1,112–1,170px. No outer-page scroll is used by this fix.
The 768px and 1,440px final screenshots were inspected visually.

Evidence under `static-followups-evidence/`:
- `module-nav-wide-before.png`: the pre-viewport-bound layout, local HTTP, system Chromium;
- `module-nav-wide-after.png`: final native Chrome file-open layout;
- `module-nav-768-after.png`: final native Chrome compact layout;
- `browser-after.json`: four viewport measurements and zero external requests.

System `/usr/bin/chromium` itself refused `file:` with `ERR_BLOCKED_BY_ADMINISTRATOR`; this
was an environment policy issue. The official native Chrome file-open check above passes.
The before/after images use different browser binaries and are visual layout evidence, not a
pixel-diff fidelity claim. Combined handoff fidelity remains the lead's separate check.

## Confidence and simplification review

Checked the least certain boundaries: a one-case run with no binary comparison, a run with no
forecast, unchanged invalid alignment data, per-run choice isolation, absent versus unsafe row
sources, source absence versus a fabricated link, current navigation below the window, and resizing
from compact to wide. The shared choice follows the existing in-memory external-store pattern;
its WeakMap is scoped to the loaded library, avoiding stale choices leaking between data files.
The row-source change reuses existing ChartTable end cells and the existing `cellRows`/`rowTrace`
helpers rather than adding another chart wrapper. The navigator scrolls only its own container.

Not verified: final combined Model/Signal test completion after the fixed 300-second attempt was
capped; final repository-wide gates and handoff fidelity comparison (the lead runs these on the
combined tree); real Windows/Edge use; a live model run; per-row source identities absent from the
saved fixture (displayed explicitly as not recorded); S6-026 paths outside the assigned new-run route.
