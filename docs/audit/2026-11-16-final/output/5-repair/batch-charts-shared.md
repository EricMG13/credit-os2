# Stage 5: charts and shared presentation

Base: `9d7fc4c1`, the local combined review candidate. This branch does not complete or take over
repair-2's unpublished T18/T22 work. It makes no analytical, prompt, calculation, module-written-text,
Signal or canned-handoff change, and makes no paid or application-network call.

## Outcomes

Ten assigned findings repaired; one already repaired. C4-013 has an additional display-only caller fix.

| Finding | Outcome |
| :--- | :--- |
| C4-020 | Repaired. Period series use the existing line-chart presentation for positive and negative data alike. Grouped comparisons and recovery charts retain their own forms. All published values remain exact in hover/Table views; the original source control stays inside the chart header. |
| C4-021 | Repaired. Each covenant row retains its identity when another threshold is missing. Valid rows still draw; an unplottable row states its missing threshold. Negative current values are positioned left of an explicit zero baseline. When every threshold is absent, the full hatched gap and source table are retained. |
| C4-027 | Repaired. The shared delivery parser handles U+2212, parenthesized negatives, and correctly grouped ordinary/NBSP/narrow-NBSP thousands spaces. A suffix is read only when the explicitly stated unit confirms its family and scale; `m` is never silently read as `bn`, and an unconfirmed suffix remains refused. Decimal-comma evidence is read after typography normalization. Source strings and all chart/table display digits are retained. |
| R2-001 | Repaired. The shared predicate recognizes parenthesized gap IDs and page locators. The chart-table-only gap/run predicate is removed. Module codes remain names through `readerText`, not withheld references. |
| R2-002 | Repaired. Chart tables show a visible horizontal-scroll sentence when their columns exceed available width, then remove it when the width fits. A resize observer covers the wrapper and its table; listeners/frames are cleaned up. |
| C4-011 | Already repaired by batch b2's `minmax(56px,max-content)` value column. Authored values such as `7.005000%` remain exact; no rounding or Securities text change is introduced here. |
| X1-001 | Repaired. Project-authored captions and SVG labels use at least 13px, across the approved 37 files. Imported Badge, Tooltip, file-upload and Table-head source defaults are deliberately unchanged. No global `text-xs` override is used. |
| X1-003 | Repaired. Library and Model metric tiles compose the existing MetricCard, with its 40/44 metric token, 12px radius, 24px padding and common shadow. Source controls, missing-trace markers, definition tooltips, exact values, missing/withheld qualifications and delivered delta lines remain in their original owning adapters. Missing values retain regular weight. |
| X1-004 | Repaired. Null, undefined and empty-string Table cells draw n.a.; zero stays present. Explicit React elements remain unchanged. |
| X1-020 | Repaired under the accepted OQ-09 lightness recommendation. Only chart slot 3 changes, from Reef D4 to the existing-family Reef D8 `#331911`; its waterfall-down alias follows it. The first three series' pairwise relative-luminance contrast ratios are 2.18, 2.01 and 4.39. Their white-background contrasts are 8.10, 3.71 and 16.31. Other palette slots and action/status colours are unchanged. The chosen shade is the implementer's, not an owner-selected hex. The prior palette's colour-blind/lightness measurements are explicitly labelled historical. |
| J6-017 | Repaired. The shared chart frame removes Recharts' body measurement span when its last chart leaves the page; it preserves the span while another Recharts wrapper remains. Chrome and Edge both verify no measurement span remains after leaving the kit. |
| L16 follow-up | Repaired. A source-bearing chart gap keeps its reason behind the exact trace address and draws its status plus “See Evidence.”; the fallback uses the standard missing status instead of printing page/file references. |
| C4-013 display caller | Repaired. LegacyForecast's displayed header and chart notes call the canonical unit helper, while calculation metadata/input units remain untouched. |

The already reviewed shared repairs remain present: X1-002 (heading face), X1-006 (valid Alert/Callout
content), X1-009 (unselected tab hover), X1-015 (select/file-label wrapping), X1-017 (unique hollow
square) and X1-026 (named waterfall tokens). They were inspected rather than reimplemented.

## Commit boundary

`0a918fa7` is an **exact dependency-only** copy of the report worker's money formatter and literal
answer key from `9ad50265`. The lead must skip it when the original report change is already present.
Own work follows it: `8843674e`, `170f205f`, `c46da409`, `d26a0bf7`, `3e6ea0d8`, `7c87b299`,
`54a8e198`, and `5963e081`; the report/probe/evidence commit follows those.
The font-only outside-component changes are isolated in `7c87b299` for later report/T18 conflict resolution.

## Tests first and independent expectations

The initial 14 chart/source/scroll/cleanup regressions all failed on the base. After correcting new-test
harness setup (RunContext, the existing space in “from 1150”, React Aria cell roles and a file-system
path), four further metric/missing-cell/palette regressions failed on the unchanged relevant code,
with the qualification-preservation case passing as a control. All 37 authored-font policy checks
failed before the token changes. The Forecast unit regression failed before the caller fix. Confidence
review then added two failing cases for a fully absent threshold set and a parenthesized suffixed
amount; both pass after their minimal repairs. Concise red logs are retained in
`charts-shared-evidence/test-first-*.txt`.

Existing expectation changes are limited to the findings' required behaviour:

- `cards.test.tsx`: the metric radius class becomes `rounded-ds-sm`, replacing the defective 8px
  `rounded-lg`; border and 24px padding assertions remain exact.
- `Overview.test.tsx`: the missing metric's size class becomes `text-metric`, replacing 30/38;
  regular weight and the absence of semibold ancestors are still asserted.
- `LegacyVisuals.test.tsx`: the page-bearing gap reason becomes `Not established. See Evidence.`
  under L16. Its source address remains exact.
- Three existing `LegacyVisuals.values.test.tsx` cases retain every numeric/axis expectation;
  after asserting the plotted scale they choose Table to inspect exact source strings, because the
  accepted line-chart form exposes those figures through hover/Table rather than permanent bar labels.
- The money answer-key prefix changes belong solely to the copied, already authorized C4-013
  dependency. No input, case order, sign, decimal, digit, scale or non-money case changed.

No test was skipped, no expected number was derived from production code, and no gate or threshold changed.

## Checks

Long commands ran under `timeout 300`, with Vitest at one worker. uv is exactly 0.12.5. Python commands
use `--no-sync` and this worktree's explicit PYTHONPATH so shared editable installations cannot select
another checkout.

| Check | Exit/result |
| :--- | :--- |
| Initial chart/source/cue/cleanup red | 1; 14 failed |
| New metric/missing/palette valid red | 1; four failed, one preservation control passed |
| Authored font-floor red | 1; 37 failed |
| Initial affected chart regression pass | 0; 84 tests |
| Shared charts, visuals and styles diagnostic | 1; 590 passed and six presentation-consequence failures |
| Resolved presentation consequence rerun | 0; 60 tests, same numeric assertions retained |
| Final charts/visuals/shared styles | 0; 51 files, 597 tests |
| Signal and metric callers | 1; 692 passed and one old 30px style assertion; all 630 Signal tests passed |
| Corrected required metric-style caller plus chart regressions | 0; 53 tests |
| Forecast unit and literal money key | 0; 34 tests |
| Confidence-case targeted rerun | 0; 87 tests |
| `npm --prefix web run lint` | 0 |
| `npm --prefix web run format:check` | 0 |
| `npm --prefix web run typecheck` | 0 |
| `npm --prefix web run build` | 0; both bundles |
| `uv run --no-sync python tools/quality_gate.py` | 0; default origin/main base, 35 inherited Python files, 3,219 scoped lines |
| `git diff --check` | 0 |
| Native Chrome 157 / Edge 155 browser probe | 0; file-open, metric geometry/40px/regular missing weight, 481px desktop table cue, chart cleanup; zero external requests and page errors |

The two confidence fixes change only the connected chart parser/boundary; the relevant 87-test rerun
covers them. Unaffected Signal/component checks were not repeated after those isolated changes.

## Confidence and simplest design

The principal doubts were decimal-comma evidence after typography normalization, implicit unit conversion,
a missing threshold erasing unrelated rows, current net cash losing its sign, all-missing comparisons,
source/page references escaping into prose, missing versus zero, and stale Recharts body nodes.
Independent numeric literals, the missing/scaled-unit negative controls, the additional confidence cases
and the native browser probe exercise those causes. No conversion, new analytical computation, dependency
or competing renderer was introduced. The existing parser, chart frame, table and metric card were
extended directly; the local reference predicate and two duplicate metric-card frames were removed.

The reproducible probe is `probes/charts-shared-browser.mjs`; it copies the built files into a temporary
folder, writes the existing saved fixtures, blocks every external host and removes its temporary root.
`charts-shared-evidence/browser-after.json` records exact versions and geometry.
`charts-shared-evidence/metric-cards-after.png` illustrates X1-003's measured, regular-weight missing form.
The lead owns the final combined handoff fidelity capture and VERIFICATION entry.

Not verified: new-slot colour-blind simulations or a physical grayscale print (the retained grayscale check measures relative luminance independently); all connected partial/malformed chart variants in a native browser (their source/DOM regressions passed); final combined-tree gates, proof and fidelity capture; weekly/full Python/Windows jobs; real issuer/model execution and Teams (outside this scope). Historical requested models and named confidence-review/rewrite-tournament skills are unavailable here; direct confidence and simplest-design reviews are recorded above.
