## Current checkpoint 2026-11-17T16:03Z

- Coordination: required inputs read; setup completed with pinned uv0.12.5 and locked dependencies.
  Native Linux Chrome157.0.8103.78 and Edge155.0.4283.62 extracted under `/workspace/audit-browsers/`
  after system browser installation required an unavailable root password. Chromium is also installed.
- Batch integration worktree `/workspace/audit-batch-integration`, branch `audit/batch-integration`:
  a,b,c merged in order; `f67a17f0` resolves test consequences (approved USD25 cap, extra record
  navigation headings, explicit no-report test scenarios). Gates/tests still finishing; not yet pushed
  to final-repairs. New implementation worktrees must preserve those test resolutions.
- `lead-review-group1-preliminary.md`: no production High/Medium blocker at `301c7ded`; quality
  gate0, Python415passed+1existing skip; frontend451passed+one async table race, unchanged file
  alone3passed. Await done/PR and green CI; do not takeover before two hours without push.
- `lead-review-group2-preliminary.md`: NEW Medium blocker at `f9453f27`, sourceFiles citedSourceNames
  drops an earlier cited range for the same file. Evidence batch worker has reproduced with a
  failing regression and is fixing it on a separate lead branch. Current Trace.sourceLinks now
  HAS a visible caller in TraceDrawer: the handover sweep suggestion to remove it is stale.
- Complete batch inventory retained in `output/5-repair/batch-inventory.json` and `.md`: all159
  canonical batch IDs, original/merged records and source evidence;34 already repaired,11partial,
 113conservatively remaining,1work-PC-only. These are planning classifications, not final closure.
- Lead implementation workers (each isolated, no push/merge authority):
  - `audit/lead-static-followups` `/workspace/audit-static-followups`: static model family,
    empty run route, desktop481–1000 ModuleNav and stale range comment.
  - `audit/lead-fixture-followups` `/workspace/audit-fixture-followups`: library/run/model fixture
    consistency plus library read.ts strict count/source checks, lead F1/F2/F3/F11.
  - `audit/lead-connected-start` `/workspace/audit-connected-start`:19 connected-start batch IDs
    and date-only dirty-state gap, based on repair1 tip; new commits only will be cherry-picked.
  - `audit/lead-connected-shell` `/workspace/audit-connected-shell`: shell/library/activity/run
    batch plus API contract and service-backed card summary, based on repair1 tip.
  - `audit/lead-connected-evidence` `/workspace/audit-connected-evidence`:17 Evidence IDs plus
    citation-range blocker, based on repair2 tip. ReportContent prop edit tightly limited.
- Every repair requires an observed failing test first. Any changed assertion must follow the
  finding's required behaviour and be named in its report. No gate/test skipped or loosened.
- Shared worktree .venv editable imports otherwise point at the last synced checkout: set
  explicit `PYTHONPATH=<own>/src:<own>/apps/issuer-library:<own>` and use `uv run --no-sync`.
  Root must `uv sync --locked` again before final root checks. npm packages symlinked; workers
  do not install. Bound vitest to1worker while six implementation workers are active.

Next: finish/gate batch integration, push final-repairs milestone; independent review of each
new batch; collect repair PRs when done; then remaining report/forecast/charts/static library/run/
shared components/docs families from inventory. Combined fidelity/gates precede sweep/send-off.

# Current takeover checkpoint (2026-11-17T15:53Z)

Read the "Lead takeover" section in STATUS.md first; the earlier handover below remains the
full task/decision source. Main has not been changed. Review/integration agents are temporary
workers in this lead session; their intermediate scratch files are not pushed evidence.

Repository `/workspace/credit-os2`, coordination branch `audit/final-coordination`. Environment
setup complete (uv0.12.5 at `/workspace/audit-tooling/bin/uv`, Chromium `/usr/bin/chromium`,
Node24.22.1). Three reviewed batch branches are being merged on `audit/batch-integration` in
`/workspace/audit-batch-integration`; do not redo those merges without inspecting that branch.
Two independent preliminary repair reviews and a complete batch inventory are in progress.
Groups1/2 are still active (<2h since push); do not take them over prematurely.

# Resume note for the lead (written 2026-11-17 12:35Z)

The lead session may stop because of the account's usage. A new lead session resumes from this
file, `STATUS.md` beside it, and the branches below. Everything is pushed.

## Where the audit stands

- Stages 0 to 4 are done (`output/0-baseline/` to `output/4-register/`). Rulings R1 to R17 and lead
  rulings L1 to L15a are recorded in `README.md` and `STATUS.md`. No owner question is open.
- Wave 5 is running in three cloud sessions. They are not visible to every account, so read their
  state from their branches (`output/sessions/repair-<n>/STATUS.md` on each):
  - `repair-1` (session_01U8sRnDBYgeaqnSLANu8JUo), `audit/repair-1`, group 1: T01 to T12, plus T01b.
    T01c and T06 are withdrawn.
  - `repair-2` (session_01U8sRnDZAgwg382BciYVBmK), `audit/repair-2`, group 2: T13 to T23. T24 is
    withdrawn. The owner told it to use Opus at medium for every worker; the other sessions keep
    R11 and R12 (owner, 12:30Z: "no" to extending it).
  - `repair-3` (session_01U8sRnCzG2X2CUKoPyAYFTu), `audit/repair-3`, group 3: T25 to T41. T28 is
    withdrawn.
  Each opens a pull request into `audit/final-repairs` when done. If a session has stopped without
  finishing, start a new one with `output/4-register/lead-tools/prompt-repair-1.md` (change the
  group number in it); it resumes from its branch.
- Step 7 early batch: three chunks of the Low and Info batch, on files no group owns, are reviewed
  PASS and pushed: `audit/lead-batch-a`, `audit/lead-batch-b`, `audit/lead-batch-c` (reports and
  reviews in `output/5-repair/batch-<x>.md` and `batch-<x>-review.md` on each branch).
- Step 9 before-capture is done: `output/5-repair/fidelity/` (script, `before/`, README).

## Next steps, in order

1. For each repair pull request: read its diff and its `output/5-repair/<task>.md` reports, check
   the gates' exit codes, then merge it into `audit/final-repairs` (ruling R9).
2. Merge `audit/lead-batch-a`, `-b` and `-c` into `audit/final-repairs`. Expect small test-file
   conflicts with repair-3 in chunk b (Overview, Module, slice, Start, ActivityPage tests).
3. Finish step 7: the rest of the Low and Info batch (register disposition `batch`, those the chunks
   did not do), plus the lead follow-up list below. Use `output/5-repair/BATCH-BRIEF.md`, Sonnet at
   xhigh with one reviewer per chunk; rounds 3 and later on Opus at medium (R12).
4. Steps 8 to 11 of `stages/5-repair.md`: self-review of the combined diff; the fidelity "after"
   capture with `output/5-repair/fidelity/capture.mjs` after `npm --prefix web run build`, compared
   with `before/` and with the handoffs; draft the VERIFICATION.md entry; `npm --prefix web run gates`
   and `npm --prefix web run proof:connected`; push.
5. Wave 7: start the `sweep` session (`sessions/sweep.md`) from `audit/final-repairs`; merge its
   pull request after reading it. Then stage 7 (`stages/7-send-off.md`), the summary and the final
   pull request into `main`, which is not merged without the owner's word.

## Started at 12:45Z (each pushes as it goes; check before redoing)

- A. Fidelity handoff side: done. `output/5-repair/fidelity/compare.mjs` (with `--diff`), `compare-selftest.mjs` (28 planted changes, all caught), `compare-before.json` and `.md`. Baseline on main: 5,818 items on 118 screens, 0 "source has it, screen differs", 0 "not found in source", 396 source items not on screen (11 chart Basis cells not drawn or in a drawer: CP-2D liquidity bridge, CP-3C refinancing need, CP-4 covenant headroom, CP-6 portfolio limits; 196 confidence-input rows; registers and other tables). After the merges: rebuild, capture to after/, run compare, then `--diff` against compare-before.json (exit 1 on any new difference or omission).
- B. Stage 7 prep: done. `output/7-send-off/requirements-draft.md` (54 rows) and `unverified-draft.md` (K1 to K35) on branch `audit/lead-sendoff` (7085234); the generator is `output/4-register/lead-tools/requirements_table.py`. To settle in stage 7: (1) the prompt must say which download it is for: the release ZIP from tools/package_react_windows.py holds none of AGENTS.md, tests/, tools/ or docs/; (2) the draft's "If Playwright cannot download its browsers" is wrong: npm ci downloads none, the proof uses installed Chrome and Edge by channel; (3) give the prompt a rule for the Teams items (R15: implemented on the work PC; K26 the owner sets both variables, never the agent; K30 and K31 are code and text changes); (4) re-check K2 (ZIP contents), K30 (T02 in the final commit), K31 (StartRun.tsx help text) and K23-K24 after the sweep. Also: hatchling and four build-time packages are outside uv.lock; .python-version pins 3.13.15 while pyproject accepts 3.13.x.
- C. Chunk b2 on `audit/lead-batch-b` (done, pushed, eec66a3; NOT yet reviewed). Open: changing the Full cap to 25 breaks two assertions in web/src/pages/library/readRecord.test.ts (lines 92-94 and 174), a file outside the chunk; the agent's edit was refused by the permission check, the owner approved the edit (2026-11-17: "update to $25"), made in 01398c5. Chunk b2 reviewed PASS (72ac503; 0 High, 0 Medium). Merge audit/lead-batch-b together with audit/lead-batch-c (component-map says eleven shapes only once c is in). Fixture Lows left for the batch: F1 Tessaly says 'since the last run' while Changes says first run (library.json ~6341, 6441); F2 Lumora's model-call row costs 5.10 against a 24.60 total for the same calls (~7852); F3 Lumora lists no not-run modules; F11 Halden 2026-03-31 Capped run says 'finished inside its cap'. Tessaly's 'Monitoring update' run was given the USD 20 purpose cap. Items: component-map.md eleven shapes, C4-011 (ComparisonChart wrap), the fixture's Finished cards with no report, RV-4 (Full-run cap bars USD 25) and the slice-start.ts comment. It needs a review before the merge.

## Repair pull requests

- #56 (repair-3, group 3): read by the lead at 12:50Z. All 126 changed files are group 3's own, their tests, or files a lead ruling cleared (L5, L7, L8, L9, L9b). Each task has a report and every review verdict is PASS; T34.md and T40.md lack a closing "Not verified:" line (minor). CI green; merged into audit/final-repairs at 12:50Z as 3010c9c.

## Lead follow-up list (step 7 extras)

1. Hide the "Show sources" switch on the connected Evidence tab: ReaderHeader in
   `web/src/pages/connected/ReportLibrary.tsx` (about line 392). OQ-03, L8.
2. Check `ReportLibrary.design.test.tsx` "filters by sector and pathway…" on the merged tree; it
   times out under load, also on the base.
3. Fixture: the library home cards say Finished but every entry has `report: null` (L2).
4. S6-026: the `#/run/start` empty state needs a sentence and a link back (T31's reviewer kept
   Home's "Start a run" on this condition). S5-016: the empty Model index state.
5. R2-002: a scroll cue for ChartTable at desktop width (S3-021 was closed by R14).
6. C4-006: figures with no unit in the base-case sentence (its probe now passes falsely).
7. Step 8: fold the local reference pattern in `web/src/pages/connected/visuals/visualData.ts` into
   `containsReference` in `publishedReport.ts`, dropping its module-code part (L14).
8. R3-001 (OQ-14): show a one-case model run with a stated gap (`web/src/pages/model/slice/read.ts:302`).
9. Chunk a leftovers: C4-021 (covenant rows in `visuals/charts.tsx`), J1-007's go-to-step button
   (ReviewSheet or StartRun), C4-011 (ComparisonChart value column); C5-033's rest needs service data.
10. Chunk b leftovers: J6-007, S3-036, S4-003 with J6-001 (Evidence test edits allowed), S5-018,
    S6-022's rest (icon literals in Documents.tsx, gaps in Context.tsx and Start.tsx), S6-023
    (shared readiness component, or close), RV-1 (S5-009 chart steps), RV-4 (library.json Evidence
    cap bars "of USD 20.00" for Full runs, about lines 1901, 4637, 5575 and 6148;
    EvidenceRecord.test.tsx lines 132 and 134), the USD 20 comment in `slice-start.ts:39`.
11. Chunk c leftovers: the stale comment in `web/src/pages/model/slice/types.ts:392`;
    `docs/design/component-map.md:353` says "ten shapes" (now eleven).
12. Align chunk a's `visuals/index.tsx` chart-gap reasons with ruling L16 (hold back a reason that cites a page; draw the gap's status word or the standard missing form beside "See Evidence.").
13. At 481 to 1,000 px (a desktop window at half a screen) the module navigator comes first with no picker (T37's review): Low, outside R14's 480 px line.
14. For the sweep (OQ-04 after T21): react_frontend/sources.py still serves /connected/sources/<run>/<sha>/<name>, which nothing links any more (decision 9: listed only, not viewable); ReportContent.tsx still fills Trace.sourceLinks through sourceFileLinks, which nothing draws (reportView.test.ts:369 asserts it). Remove both in stage 6 as dead code, with the route's tests.
15. Teams items (R1-009 and the Teams card checks) go to the work-PC prompt, not to a cloud change
    (R15).

## Register tools

`output/4-register/lead-tools/` holds the lead's register builder and its inputs. From the
repository root:

    python3 -I docs/audit/2026-11-16-final/output/4-register/lead-tools/build_register.py docs/audit/2026-11-16-final/output/4-register/lead-tools
    python3 -I docs/audit/2026-11-16-final/output/4-register/lead-tools/write_docs.py docs/audit/2026-11-16-final/output/4-register/lead-tools

`clusters.json` holds the merged findings, `rulings.json` each ruling, and `tasks.json` the repair
tasks. A new finding from a repair session goes in `output/4-register/repair-findings.jsonl`, with a
verify line in `verify/R.jsonl` when it is repaired.
