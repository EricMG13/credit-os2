# Fresh review: lead connected start and shell batches

Reviewer scope: production and test diffs `301c7ded..8e251fbf` (start; 592981af + 8e251fbf) and
`301c7ded..803cf846` (shell), their reports and relevant finding records, on the combined candidate
`/workspace/review-connected-integration`. Started at 10c00cf5, checked subsequent related changes
through d988f71a178b22879b33632adc81a0c23631d9d7 (README R1-R17 collection, static/report test scopes and
integration report only). No reviewed connected production function changed during verification.
No code/test change, commit, push, merge, real Submit, provider/seat or Teams call was made.

| Chunk | Verdict | High | Medium | Low | Info |
| --- | --- | ---: | ---: | ---: | ---: |
| Connected start | PASS | 0 | 0 | 0 | 0 |
| Connected shell | PASS for implemented scope; C1-028 is partial while a run is live | 0 | 0 | 1 | 0 |

## Finding SC-1: C1-028's blocked label is available only after report publication (Low)

`web/src/pages/connected/RunProgress.tsx:123-145` calls `getReport` and receives `not_assessable` only
inside the `next.status === "finished"` branch. A blocked module that has already delivered its
handoff while downstream modules are still running therefore retains the ordinary Finished badge;
`moduleSteps(run, true, [])` has no published assessment metadata yet. The final finished view is
correct, and completed-module counts/report-delivery state stay intact. The existing finding asks
for a blocked delivered module's assessment state on Run activity, not just after the whole run
publishes. Record this limitation rather than closing C1-028 without scope: either carry explicit
assessment metadata on the existing activity reply once its handoff exists, or leave the live portion
open with its reason. Do not infer assessment from a generic rejection/event or from module identity.
This is a remaining Low from the original finding, not a new regression in completed-run handling.

## Start: cause, callers and data preservation

- Duplicate filenames use one NFC/case-insensitive comparison and both picker/drop/folder inputs
  reach it. The suffix allowlist exactly matches `cpos_launch.SOURCE_SUFFIXES`; the 50 MiB limit
  matches the existing service limit. Refused rows name the actual selected file before any upload.
- Content comparisons retain only SHA-256 digests and original filenames. Files with different sizes
  need no hash; equal-size candidates are hashed sequentially. The shared promise queue serializes
  selection and immediate inspection; revision guards prevent obsolete-selection updates, and a
  rejected read does not poison later checks. Removal rechecks the remaining files. No MIME-prefix
  shortcut, content-string cache, limit-sized test payload, new dependency or provider call exists.
- A read error is delivered to its caller with the filename. The candidate's retained regression
  instruments three-byte files declared as 50 MiB; it bounds simultaneous readers without allocating
  those artificial sizes. My separate scratch checks also exercise stale cancellation, failed-read
  queue recovery and overlapping calls with real WebCrypto.
- Native empty-name validation and the existing analyst-name rule run before leaving Documents;
  browser Forward also checks the name. Existing final review validation remains. The new dirty
  conditions cover date, manual ID and classification alone, copied files after inspection and
  removed pending copies; an untouched route-reconstructed copy alone is not claimed as unsaved work.
- Every draft reset path clears the new copied-state marker with the existing uploaded/reading state.
  Pending files can be removed before copying; copied files retain that label after another selection.
- Portfolio workbook display uses the exact chosen stored name captured with the review. The actual
  `attachments.portfolio_workbook` remains its existing boolean and is still checked against the
  inspected file choices. Neither an attachment source identity nor a file role is guessed.
- Basic/Advanced normalization, pathway reset, market-view reset and new acceptance wording retain
  exact underlying levels, module IDs, accepted IDs and approval semantics. The edited tests still
  assert the full summary/Submit payload and digest. They tolerate only the asynchronous ordering of
  the new issuer-notice request and retain exact non-issuer endpoint ordering and cap headers.
- Caps come from the service; the synthetic warning explicitly limits the canned proof to a first
  Full run and its exact files. No cap was substituted and no live success is claimed. Shared
  PurposeCards changes remove a repeated decorative icon without changing value/onChange contracts.

## Shell: cause, callers and provenance

- The compact card lead uses the selected default that belongs to the module/output list and current
  run key. Its module priority agrees with the existing Overview, including CP-1B only for Earnings
  Update. The original paragraph including Basis, output identity, SHA and line is retained. The UI
  applies the existing readParagraph/containsReference/readerText rules, and its source link uses the
  exact current run/output/hash/line token. No alternate-source fallback or invented judgement exists.
- Python `_blocked` follows the reader's first-nonempty-H3 and legacy established-status fallback.
  Metadata marks designated blocked/unreadable outputs explicitly; older replies without that field
  remain readable. It changes assessment labels without changing accepted-module counts or Report.
  SC-1 above limits the closure claim while a run is live.
- The public Run type now owns stopped_by and optional approved-summary limits; latest-issuer replies
  expose the optional filed name. Their absence on older records remains valid. The surrounding
  evidence chunk owns persistence/rendering of approved limits; this batch adds no reinterpretation.
- Exact-cent display uses the original decimal string, BigInt and half-up rounding. Number remains
  confined to finite-value acceptance and approximate bar geometry. Half-cent/carry/exponent forms,
  zero, underflow and unavailable spend keep distinct meanings; no analytical number is recalculated.
- Queue text is drawn only without a more specific stored/held reason. The ended tally names its
  actual scope, terminal feed text uses the recorded state/reason/time, and Start from this run is
  described as a separate run with its own cap rather than a resume.
- URL filter persistence retains unrelated parameters/hash/history state; copied URLs and a fresh
  mount restore query/sector/pathway/layout. Labels share the existing form-label style. Case dates
  use UTC long-date display and invalid source strings are preserved. Loading blocks are static.
- Shell's optional section label reaches the existing NavButton tooltip; current=null gives no
  current item, and the marker follows the same current area. Signal code is unchanged; its shared
  caller compatibility is supported by the worker's recorded Signal run, not independently rerun here.

## Independent checks on the combined candidate

All long commands used timeout 300. Vitest used maxWorkers=1. Python used uv 0.12.5 with --no-sync
and explicit `/workspace/review-connected-integration/src:.../apps/issuer-library:...` PYTHONPATH,
so the shared editable installation could not silently select a different tree.

| Check | Exit | Result/log |
| --- | ---: | --- |
| Affected Vitest: all three start finalAudit files; runFigures finalAudit and existing tests; shellFinalAudit; API finalAudit; ConnectedApp loading and existing ConnectedApp; Shell finalAudit | 0 | 10 files, 291 tests, 94.99 s; `/workspace/scratch/lead-start-shell-vitest.log` |
| Python library cards, performance, run-reason sentences, run activity and react frontend | 0 | 149 passed, 26.81 s; `/workspace/scratch/lead-start-shell-python.log` |
| npm --prefix web run lint | 0 | `/workspace/scratch/lead-start-shell-lint.log` |
| npm --prefix web run format:check | 0 | All matched files formatted; `/workspace/scratch/lead-start-shell-format.log` |
| npm --prefix web run typecheck | 0 | `/workspace/scratch/lead-start-shell-types.log` |
| uv run --no-sync python tools/quality_gate.py | 0 | 0 findings in 35 changed files, 3,219 lines in scope; `/workspace/scratch/lead-start-shell-quality.log` |
| git diff --check | 0 | No whitespace error |
| Scratch hash adversarial checks using the candidate functions, TypeScript-transpiled outside the repository | 0 | Same bytes/different MIME, equal-size different bytes, obsolete-check cancellation, failed-read queue recovery, serialized overlap; `/workspace/scratch/lead-start-shell-hash-adversarial.mjs` |

The first scratch adversarial script independently checked nine exact-money literals successfully,
then stopped on my incorrect assumption that unavailable spend returns the literal "n.a.". The
actual Figure contract returns value:null and its existing unavailable-budget note, identically in
301c7ded and the candidate; the UI owns its missing-value display. That assertion was not a production
regression and was not changed to manufacture a pass. The original failed scratch script remains
`/workspace/scratch/lead-start-shell-adversarial.mjs`; hashing was checked separately. No repository
expected value, gate, timeout or test was weakened or skipped.

Existing assertion edits were read individually. They are the requested new labels/meaning (Market
view, exact causes/consequences wording, ended-without-report, Modules and report delivery), required
valid analyst-name setup in unrelated flows, the new issuer lookup's asynchronous request ordering,
and waiting for the same exact async collection/copied-state content. Report-action absence checks
now stay within main because the correctly named rail has its own Run activity link; their target
absence remains exact. No amount, module count, hash, date, source identity or approval assertion was
loosened. Red-before evidence was read from the workers' reports; I did not repeat the old-base red runs.

Not verified: SC-1's live blocked label remains open; native branded-browser layout/hover/folder-picker/Back-Forward, pixel screenshots and browser memory allocation were not independently exercised; extracted hash checks exercise logic rather than the mounted page, whose retained regressions passed; the complete frontend/Signal suite, original probes, combined screen/source/figure/limitation fidelity, release package and Windows/work PC are the lead's remaining gates; no real issuer/model/provider, paid execution, seat check, real Submit or Teams was exercised; final commits after d988f71a require a related-diff check.
