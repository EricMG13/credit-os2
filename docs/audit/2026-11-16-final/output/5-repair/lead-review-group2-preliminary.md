# Group 2 preliminary independent review

Reviewed tip: `origin/audit/repair-2` = `f9453f27d0503b8036acd7437fa884d465a16234`.
Merge base with `origin/audit/final-repairs`: `ca0db16ae5bdbd744dcb0f9b10a5f3096a72073b`.
Review worktree: `/workspace/review-group2` (detached). No tracked file edited, no remote mutation.

Verdict: CHANGES NEEDED before eventual group-2 approval: one newly confirmed Medium fidelity defect. The branch is also explicitly unfinished (T18 and T22 are absent from its tip). This is a preliminary review, not approval to merge an unfinished branch.

## New Medium blocker: a trace citing two pages in one source loses all but the last range

`web/src/pages/connected/sourceFiles.ts:28-38`, especially line 34: `citedSourceNames()` keys its Map by the source path and overwrites the stored `pages` for each new cited-page address. `ReportContent.tsx:200-205` correctly retains distinct page URLs from multiple chips belonging to the same paragraph/row. The new `TraceDrawer.tsx:10-20,84` calls this helper and now shows only the last cited range. This is ordinary, valid source data and loses the original source-page evidence required by AGENTS.md. OQ-04 removes opening source files; it does not permit dropping cited pages.

Concrete reproduction, run successfully on this tip with Node 24 native TypeScript stripping:

```js
import { citedSourceNames, sourceFileLinks } from './web/src/pages/connected/sourceFiles.ts';
const sha256 = 'a'.repeat(64);
const href = `/connected/sources/run/${sha256}/filing.txt`;
const links = [2, 7].flatMap(page => sourceFileLinks('run', {
  name: 'filing.txt', sha256, href, pageHref: `${href}?page=${page}`,
}));
console.log(citedSourceNames(links));
```

Actual: one entry `{path: href, text: 'filing.txt, cited page 7'}`. Page 2 is lost. The old `SourceFileLinks` displayed both cited page controls. The new round-2 test covers one cited range and one file-only URL, so it passes while this case fails.

Required test first: add a surface regression beside `Evidence.t21-fix1.test.tsx` with `TraceDrawer` containing `sourceLinks` for the same file at pages 2–3 and page 7, plus repeated base and cited addresses. Assert both exact cited ranges remain visible as plain text and no `/connected/sources/` anchor exists. Include two different files with the same display name/different digests as a source-identity control. No existing expected value needs changing. A helper regression can also assert that distinct ranges survive and duplicates do not repeat; do not derive expected strings from production helpers. Preserve source ordering without inventing a combined continuous range.

Smallest repair: retain all distinct cited ranges per file (or one plain text row per distinct source/range with a unique React key), retaining file-only deduplication. Do not restore open/download links.

Saved reproducible probe: `/workspace/scratch/group2-source-pages-probe.mjs`, run exit 1 with `AssertionError: the earlier citation must remain visible`; output in `/workspace/scratch/group2-source-pages-probe.log`.

## Stale sweep instruction that now needs a caller check

RESUME follow-up 14 says `Trace.sourceLinks` is undrawn. That was true before T21 round 2, but is false at this reviewed tip: `TraceDrawer` now renders file names and cited pages via `citedSourceNames(trace.sourceLinks)`. The source-serving HTTP route may be dead, but removing the trace data/helper without preserving the displayed citation details would create another fidelity defect. Keep or migrate the visible citation metadata while deleting only the unused opening/download path.

## Reviewed scope and test changes

Read AGENTS.md, the audit's decided rulings and lead handover, group-2 STATUS, final review sections and gate records of T13/T14/T15/T16/T17/T19/T20/T21/T23/T24, all changed production code, and changed-existing-test diffs. T18/T22 reports and code are not present at this tip; their status claims cannot be reviewed here.

- Numeric chart parsing now treats comma decimals under a same-measure/unit scope. English grouping, mixed-measure covenant rows and genuine zero versus missing are separately covered. No analytical calculation/method or module-written text is changed by the production diff. L16's already-known `0,000` ambiguity is still present and remains a required lead batch item: a zero has no decimal evidence to apply to other cells.
- Stack zero/missing support retains legend rows, facility rank and exact source labels; negative/NaN values still fail. Existing assertions changed from refusing a zero to refusing a negative as X1-024 requires; new tests cover the zero. The nonzero bar-label margin fix is narrow.
- Changed Python golden hashes are expressly explained in T16 and comments as consequences of the delivery-written limitation sentence only. Every changed numerical assertion in those existing Python tests retains its original value; production Python changes contain reader wording only. The main quality gate passes.
- Existing Evidence link expectations change to plain cited-page text/no links as OQ-04 requires. Existing error-message expectations change from raw service text to the fixed D-31 notice. Missing headline slots and module prose ordering changes match their finding requirements. No `.skip`, `.only`, `.todo`, coverage threshold or persisted gate timeout is introduced in the diff.
- Historical T13/T15/T16/T20 review failures are repaired in the current code; the historical reports clearly supersede earlier sections. Do not read an early CHANGES NEEDED heading as a current blocker.
- T17's report ends with command rows rather than a final `Not verified:` line, a report-format cleanup for the lead.

## Additional already-documented lead follow-ups

These are residuals recorded by previous task reviewers, not new merge blockers inferred by this review:

- T20 final review Low R6-1: an unplaced calendar row whose Status contains a reference loses its Historical/Scheduled lane; `placeEvents()` maps the whole referencing cell to See Evidence instead of keeping the lane, unlike plotted rows. Low R6-2: generic unplaceable-event wording blames dates even for a valid date paired with an unsupported status or blank event name.
- T17: Report history performs one full snapshot fetch per other run (measured structural cost suitable for sweep), Earlier-methods does not separately consider a prior run’s older methods (needs service metadata/decision scope), and an unpublished report’s page title remains generic despite a known issuer.
- T16 final Low edge cases: invalid producer summary.line drops a withheld figure (producer always writes valid positive integers; unusual-input scope), and the page-citation regex has documented false positives/false negatives. Keep scope rulings R3/R13/R14/R16; do not reopen missing keyboard/mobile/screen-reader work.
- T15: the library-card half of J4-001 needs group1 service/source metadata; all-six-headlines-missing displays no tiles.
- T23: null/non-JSON artifact replies are already parked as unusual inputs, not new work; stale useResource on prop changes is pre-existing.

## Current verification

All commands use `timeout 300`. Node is v24.22.1; uv is 0.12.5. Test logs live in `/workspace/scratch/group2-*.log`.

| Command | Exit/result |
| --- | --- |
| `git diff ca0db16...HEAD --check` | 0 |
| Native Node source-page reproduction above | 0, confirmed dropped earlier cited page |
| `npm --prefix web exec -- vitest run --root web src/components/chart src/pages/connected/visuals src/pages/connected/reportView.headline.test.ts src/pages/connected/HeadlineFigures.trace.test.tsx src/pages/connected/publishedReport.reference.test.tsx src/pages/connected/readerText.lowercase.test.ts --maxWorkers=2` | 0; 45 files, 611 tests, default timeouts; 75.26s |
| `uv run python tools/quality_gate.py` with this worktree's explicit PYTHONPATH | 0; 0 findings in 10 changed files/335 lines |
| `uv run --no-sync pytest tests/test_delivery_reader_wording.py tests/test_credit_os_chips.py tests/test_credit_os_store.py tests/test_cpos_facilities.py tests/test_cpos_periods.py tests/test_downside_follows_forward_model.py -q` | 0; 698 passed in 20.24s |
| Connected report/ReportLibrary/source/reader targeted tests, maxWorkers=2, default timeouts | 1; 37 files pass, 1 file fails; 477 tests pass, one known `ReportLibrary.design` filters-by-sector-and-pathway async lookup of `Synthetic test` times out; unchanged file alone then passes 21/21 in 5.64s |

Environment detail: this worktree used the root .venv via a symlink. `uv run` auto-synced its editable package paths to this worktree; root was notified to restore its own paths with root `uv sync --locked`. Subsequent Python checks use `uv run --no-sync` and explicit `PYTHONPATH=/workspace/review-group2/src:/workspace/review-group2/apps/issuer-library:/workspace/review-group2`. No manifests or lockfiles changed.

Not verified: T18 round 4 and T22 are not pushed into this branch tip; no browser screenshots/probes or final combined-tree fidelity capture in this review; no frontend full gates or connected proof; no live/model/paid run, real Submit, Teams, work PC or Windows runtime; weekly full suite/Windows CI. Historical reports retain their own narrower limitations. The concrete new source-page loss is reproduced directly, not repaired or unit-tested by this read-only review.
