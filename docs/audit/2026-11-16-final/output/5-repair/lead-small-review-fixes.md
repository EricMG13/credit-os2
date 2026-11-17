# Lead follow-ups: L16, C1-032 and S1-010

Base: `d4b3db28`, the combined report/chart review candidate. Branch:
`audit/lead-review-small-fixes`. These are three narrow repairs, with independent
regressions written before each production change. No push or merge was made.

## L16: an ambiguous written zero must not select a decimal convention

Source: [T19, Review 4 Low-1 and the binding L16 ruling](T19.md), the remaining
lead follow-up behind the shared chart amount reader. `0,000` means zero under
either convention, so it supplies no evidence for changing `2,800` to `2.8`.

New literal expectations first showed `["0,000", "2,800"]` reading `[0, 2.8]`
instead of `[0, 2800]`. Signed zero and a unit-confirmed `US$m` column failed
the same way. The new control with genuine `3,75` and `0,375` evidence already
passed on the baseline. See [the failing test output](small-review-evidence/tests-red.log).

`visualData.ts` now excludes only the ambiguous written zero from the existing
`onlyDecimalComma` predicate. Keeping `COMMA_GROUPS` unchanged preserves genuine
`0,375` evidence. All chart callers reuse this predicate; no caller, rounding,
unit conversion, calculation, source string or analytical value was changed.
The commit is `0160cdc8`.

## C1-032: keep the report loading skeleton static

Source: the original C1-032 finding and the static-skeleton requirement recorded
in [batch-report-followups.md](batch-report-followups.md). The new pending-request
design regression failed on `animate-pulse motion-reduce:animate-none`. Removing
those two classes preserves the loading sentence, five blocks, grid layout and
every resolved/error branch. The commit is `1c06c00c`.

The additive [native loading probe](probes/small-review-loading.mjs) serves the
built connected page on loopback with a deliberately pending snapshot response,
synthetic mode and the service's same-origin connection allowance. It uses no
provider or service implementation. With motion set to **no preference**, both
native Chrome 157.0.8103.78 and Edge 155.0.4283.62 show five blocks, zero active
animations, computed `animation-name: none` throughout and the same 380px loading
layout after 400ms. No external requests or page errors occurred. See
[native observations](small-review-evidence/loading-green.json).

## S1-010: native scroll anchoring must not add to history restoration

Source: S1-010 and the lead's remaining T27 round-2 history-restoration follow-up.
This still reproduced on the current base despite the chart measurement cleanup.
The independent [finite native probe](probes/small-review-history.mjs) saves a
700px position on Model Statements, opens Kit by hash and uses browser Back four
times. No departure DOM element is injected. Before changing App, Chrome returned
732, 764, 796 and 828px: [red measurements](small-review-evidence/history-red.json).
Every Kit arrival was zero and there were no external requests or page errors.

An isolated diagnostic on unchanged App set only `main.style.overflowAnchor` to
`none`. Both Chrome and Edge then restored 700px on all four loops:
[causal control](small-review-evidence/history-anchor-control.json). This identifies
native anchoring during late chart layout as the extra adjustment.

The repair sets that one property inside the existing static-app restoration
layout effect. The existing history-entry keys, offsets map, saved positions,
navigation and Shell remain in place. No restoration layer or pruning change was
added. The default probe, with no diagnostic override, now restores exactly 700px
in both native browsers; its additional manual-position check returns 910px on
Back and 310px on Forward. See [green measurements](small-review-evidence/history-green.json).
The four-loop regression was written and failed before the production edit; the
manual-position guards were added afterward without changing its expectations.

## Validation and direct review

All commands were bounded with `timeout 300`; Vitest used `--maxWorkers=1`.

| Check                                                      | Result                                            | Evidence                                                                                                                                       |
| :--------------------------------------------------------- | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| New parser/loading regressions on baseline                 | Expected exit 1: 4 failed, 87 passed              | [red](small-review-evidence/tests-red.log)                                                                                                     |
| Parser, report design and chart final-audit tests          | Exit 0: 105 tests, 3 files                        | [green](small-review-evidence/tests-green.log)                                                                                                 |
| App route/App tests and the complete Signal test directory | Exit 0: 703 tests, 36 files                       | [green](small-review-evidence/app-signal-green.log)                                                                                            |
| `npm --prefix web run build` after the App change          | Exit 0                                            | [build](small-review-evidence/build-green.log)                                                                                                 |
| Web lint, format and typecheck                             | Exit 0 each                                       | [lint](small-review-evidence/lint-green.log), [format](small-review-evidence/format-green.log), [types](small-review-evidence/types-green.log) |
| `uv run --no-sync python tools/quality_gate.py`            | Exit 0: zero findings, 35 inherited changed files | [quality](small-review-evidence/quality-green.log)                                                                                             |
| Native finite history probe and pending-loading probe      | Exit 0 each, Chrome and Edge                      | JSON observations linked above                                                                                                                 |

The Python gate used uv 0.12.5 from `/workspace/audit-tooling/bin/uv`, no sync and
explicit `PYTHONPATH` entries for this worktree's `src`, `apps/issuer-library` and
repository root. Existing linked dependencies were used; nothing was installed.
An initial formatting check correctly caught formatting in the new tests;
Prettier corrected it before the final passing gates. Two initial authoring
commands used redundant `web/` paths and exited before editing; their unchanged
baseline run is not counted as test-first evidence.

Direct confidence review checked genuine decimal evidence, signed and unit-tagged
zero, source-value preservation, loading/error branch scope, repeated history,
manual Back/Forward and Signal regression coverage. The simplest implementation
is retained: one predicate guard, one class removal and one browser-anchoring
property in the existing owner of scroll restoration. Changing grouping rules,
adding a global Shell style or adding another restoration system would broaden
the behavior without fixing another demonstrated cause. The named
confidence-review/rewrite-tournament tools are unavailable; this is the R7 direct
review fallback, not a claim that those tools ran.

No existing expected value was changed, test skipped, timeout increased or gate
weakened. No Signal file, analytical method, prompt, calculation, canned proof
handoff or module-written passage was edited. Fidelity scope is the unchanged
loading content/layout, exact literal chart amounts and saved browser offsets;
the lead should fold this record into the single `VERIFICATION.md` entry when
integrating, as that shared file was outside this worker's assigned write scope.

Not verified: final combined-branch gates, the full Python suite, all application
routes, Windows/work-PC behavior, real issuer/provider function, paid/live runs,
seat checks, real Submit or Teams; named confidence-review/rewrite-tournament
tools were unavailable. Native loading observations use a deliberately pending
local synthetic response, and static history observations use the existing
fixture; neither proves analytical output fidelity for a real run.
