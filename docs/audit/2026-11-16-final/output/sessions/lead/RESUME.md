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
12. Teams items (R1-009 and the Teams card checks) go to the work-PC prompt, not to a cloud change
    (R15).

## Register tools

`output/4-register/lead-tools/` holds the lead's register builder and its inputs. From the
repository root:

    python3 -I docs/audit/2026-11-16-final/output/4-register/lead-tools/build_register.py docs/audit/2026-11-16-final/output/4-register/lead-tools
    python3 -I docs/audit/2026-11-16-final/output/4-register/lead-tools/write_docs.py docs/audit/2026-11-16-final/output/4-register/lead-tools

`clusters.json` holds the merged findings, `rulings.json` each ruling, and `tasks.json` the repair
tasks. A new finding from a repair session goes in `output/4-register/repair-findings.jsonl`, with a
verify line in `verify/R.jsonl` when it is repaired.
