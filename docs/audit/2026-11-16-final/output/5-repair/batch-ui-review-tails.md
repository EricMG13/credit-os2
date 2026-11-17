# Stage 5: small UI review tails

Base: `d4b3db28`, branch `audit/lead-ui-tail`. Scope: the five assigned ordinary tails from
`review-group-3.md` and the lead's closure ledger. No provider, service, paid run, Submit,
Teams, analytical method, prompt, calculation, handoff or Signal source was changed.

## Confirmed findings and repairs

| Source note                           | Confirmed cause                                                                                                    | Final behavior                                                                                                                                                                                                                                        | Commit                 |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| T39 round 1 Low 2                     | A filtered timing table retained the full record's “Six of thirteen shown” without identifying its scope.          | The delivered note remains verbatim after “Unfiltered timing record:”; a separate footnote states the filtered rows against all recorded timing rows, e.g. 1 of 6 for Capital structure.                                                              | `614aebe9`             |
| T39 round 1 Low 3                     | Call-row coverage and Brevane's separate timing sample used the same unqualified “shown” wording.                  | “Call rows cover 1 of 2 modules in the run” names its scope and retains the delivered run Total. Brevane's timing-record text, “One of one shown”, stays intact under Module timings. Filtered call notes explicitly name the unfiltered call record. | `614aebe9`             |
| T39 round 2 Low 1                     | `counts.slice(1, 2)` selected whichever tile occupied the middle position. The reader does not enforce that order. | An untraced run retains the delivered metric labeled Calculations regardless of its position, including its zero and its qualification. Traced runs keep their existing filtered Traced items count.                                                  | `614aebe9`             |
| T35 Low 1                             | Static ChangeCard suppressed TraceControl entirely for a null trace.                                               | An actual change claim with no trace uses the existing missing-source marker, with a gutter for the marker. No metadata-only group item was changed. Explicit caller source slots remain authoritative, including false, null and undefined.          | `2eb06ef3`, `82679086` |
| T38 no-forecast Low 2                 | ModelShell always drew Show sources, including the forecast sentence with no trace target.                         | The switch is omitted only when the current page is Forecast and its forecast is null. Other Model pages retain the switch. This applies the lead's explicit direction to use the accepted OQ-03 no-target principle (README R10).                    | `a83e0029`             |
| T40 Low 3                             | Unreadable-run copy promised all other financial models were unaffected, even with multiple unreadable runs.       | The sentence directs the reader to All financial models to see available records. Raw distinct diagnostics still go to the console. RunsIndexPage already preserves readable and unreadable records and needed no production change.                  | `a83e0029`             |
| T27 round 1 Low 1, visible-title part | Saved run steps and selected Trace items shared generic document titles.                                           | Existing route subjects use the saved step's existing Stepper label (the started form uses its delivered title), issuer, or selected Trace row's item. Unknown subjects keep the old area fallback. App and its scroll restoration were not edited.   | `5d366528`             |

All financial figures, source references, source identities, periods, units, hashes, limitations,
states and recorded totals are unchanged. Only display row counts are derived from existing
UI rows. The native probe mutates temporary fixture copies to exercise the edge states; no
fixture or handoff is edited in the repository.

## Failing tests first

Before production edits, the five affected test files produced **15 failures and 22 passing
controls**, exit 1, at 17:57 UTC. The failures cover the three T39 cases, the null ChangeCard
marker, no-forecast switch, multiple-unreadable copy, and nine saved-step/Trace-item titles.
The two unknown-subject title controls passed before and after. The new started-title case
was corrected to the actual delivered `Run started` title; running the final title test file
against an archived `d4b3db28` independently verifies the final expectations fail on that base
(9 failures, 2 passing fallback controls, exit 1).

The first affected connected-Changes run then exposed a caller regression: null or undefined
source overrides entered the static TraceControl without a RunFrame. Two new override cases
reproduced it, **2 failures, 3 controls passing**, exit 1. The final card distinguishes an
omitted source property from an explicit source slot; no connected caller was edited.

Regression files:

- `web/src/pages/library/Evidence.reviewTails.test.tsx`
- `web/src/pages/library/parts/ChangeCard.missingTrace.test.tsx`
- `web/src/pages/model/parts/ModelShell.noForecast.test.tsx`
- `web/src/pages/model/parts/RunPage.plainNotice.test.tsx`
- `web/src/App.reviewTailTitles.test.tsx`

## Existing expected-value changes

These are the only existing assertions changed for the assigned findings:

- `EvidenceRecord.moduleFilter.test.tsx`: the exact call-row coverage sentence now names the
  call-row/run scope. Its counts and the full timing note remain exact.
- `RunPage.plainNotice.test.tsx`: the exact sentence no longer claims other models are unaffected.
- `App.routeChange.test.tsx`: the selected T-0014 and saved Start-step titles include their
  actual existing item/step and issuer.

One additional integration-test consequence was authorized explicitly by the lead:
`Module.test.tsx` S3-017 counted every ResizeObserver constructor and expected zero. Its failure
also occurs on archived `d4b3db28` (**expected 0, received 1**, exit 1), because the reviewed
chart scroll cue legitimately observes its chart. The test now records actual `observe(target)`
calls and asserts **exactly no targets on the Limitations card or its descendants**, both
before and after Show sources toggles. No observer was removed and no arbitrary nonzero count
was accepted. The full Module file passes **103/103**, exit 0. Commit `10869661`.

No test was disabled, no timeout increased, and no gate loosened.

## Verification

Every command was bounded by `timeout 300`; Vitest used `--maxWorkers=1` with its normal test
timeouts. Python used uv 0.12.5, `--no-sync`, and explicit worktree PYTHONPATH.

| Check                                                                                                                                                                    | Result                                                                 |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| Final affected Vitest files: Evidence tails/held filter/record, ChangeCard, model no-forecast/notice, App titles/route changes, static Changes, connected Changes/colour | 13 files, 164 tests passed; exit 0                                     |
| Full Module test after the exact observer-target integration correction                                                                                                  | 103 tests passed; exit 0                                               |
| Signal compatibility                                                                                                                                                     | 34 files, 630 tests passed on final code; exit 0                       |
| `npm --prefix web run lint`                                                                                                                                              | exit 0                                                                 |
| `npm --prefix web run format:check`                                                                                                                                      | exit 0                                                                 |
| `npm --prefix web run typecheck`                                                                                                                                         | exit 0; final build also runs typecheck                                |
| `npm --prefix web run build`                                                                                                                                             | exit 0; existing chunk-size warnings retained                          |
| `uv run --no-sync python tools/quality_gate.py`                                                                                                                          | exit 0; 0 findings in 35 changed files, default origin/main comparison |
| `git diff --check`                                                                                                                                                       | exit 0                                                                 |
| `probes/ui-review-tails.mjs`, built app from file, native Chrome 157, 1440×1000, final rebuilt code                                                                      | exit 0: seven flow groups, zero page errors, zero external requests    |

An attempted broad combined library/model/run directory run reached the unchanged 300-second
bound, exit 124, after exposing the inherited observer assertion above. It is not reported as
a passed directory suite. The final bounded component/file checks cover the changed behavior
and its connected callers. Full repository/frontend acceptance remains the lead's combined gate.

The retained native probe is
`docs/audit/2026-11-16-final/output/5-repair/probes/ui-review-tails.mjs`.
It opens a temporary copy of the local build and fixture data, uses normal mouse selection,
checks filtered/full-record scope, reordered count tiles, the null marker, absent-forecast
switch, two unreadable model records plus the readable record, and distinct saved-step/item
titles. Run from the repository root with CHROME_PATH naming an installed Chrome/Edge binary.
Screenshots inspected from scratch show the timing scope sentence and missing marker without
overlap at desktop size; no screenshot is needed as new finding evidence.

## Confidence and simplest-design review

Direct fallback review used the available inherited model. The named confidence-review and
rewrite-tournament skills/models are absent from the advertised catalog; no Sonnet/Opus review
is claimed. Doubts checked: confusing sample/run counts; lost Calculations qualification under
reordering; empty caller source slots; multiple unreadable records; and unknown route subjects.
The explicit empty-source regression was found and repaired before handoff. Remaining controls
and source identities survive the affected tests and native probe.

The final implementations reuse TableCard footnotes, TraceControl's existing marker, ModelShell's
existing page/run state, the existing Stepper labels, and existing route subjects. A new title
layer, switch API, data schema, calculation, dependency or production abstraction was unnecessary.
The explicit supplied-slot check is smaller and more accurate than adding context-sensitive
behavior to TraceControl or changing connected callers.

Proposed VERIFICATION.md entry for the lead: “Stage 5 small UI review tails, saved-fixture scope:
native Chrome file-build verification compared unchanged timing/call financial cells, totals,
source identities and qualifications across filtered/all states; checked change-card missing
source marker, no-forecast source control, multiple unreadable records and actual route titles.
164 affected tests, 103 Module tests and Signal compatibility passed. No provider or retained
analytical handoff execution; final combined presentation check remains separate.”

Not verified: fresh independent review; final combined-branch gates and VERIFICATION.md entry;
the timed-out broad directory suite as a whole; full Python/frontend suites; Edge/work-PC
behavior; live/provider execution, real Submit or Teams (outside this task).
