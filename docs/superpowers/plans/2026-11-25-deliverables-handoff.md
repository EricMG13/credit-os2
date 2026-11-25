# Handoff: deliverables, recommendations and pathway work (2026-11-25)

Written by the coordinating session when it stopped for usage. Delete once the work below is merged.
Branch: `claude/credit-assessment-deliverables-1efc5e` (pushed). Approved spec:
`docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md` (rulings in section 1, plan in
section 5, rubric text in section 9). Nothing is merged; merges need the owner's word.

## Open pull requests (EricMG13/credit-os2)

| PR | What | State when this was written |
|---|---|---|
| 79 | Layer 1 modules in Lite and Full; CP-DR in Lite; caps 20/30/50 | **Merged** by the owner as `f6cebbd0` (reviewed head `996bb1c3`); both xhigh reviews passed. Low findings parked: a pre-merge Lite/Full run folder cannot be resumed and its refusal suggests a command that also fails; a queued record refused for a cap change shows the wrong reason; Teams cards and `/api/runs/<id>` count an old run against the new preset; a run started from an earlier run with a hand-picked subset leaves the new modules out. |
| 80 | PR 0: rulings, `AGENTS.md` amendments, methodology document | Review fixes confirmed at head `7ab949fc` (Medium fixed, mock-up shows 3 MW, both probes exit 0). Conflicts with main after 79 merged; its cloud session was asked to merge main in, keep main's cap sentence and trim `VERIFICATION.md`; delivery unconfirmed. After the rebase: check the conflict resolution, then it needs the owner's word to merge. |
| 68 | Design passes over every web screen | Draft from 18 November; not part of this work. |

PR 6 (Credit Screening) and PR 7 (custom routing) were waiting on 79 and are now unblocked.

Reviewer probes for 80 (must still exit 0 after its fix) were saved in the session scratchpad and
are not in the repo: a rubric comparison (spec section 9 against methodology section 3, 17 factors,
85 cells) and a 5×5 table comparison across spec, ruling and methodology. Rewrite if needed.

## Cloud sessions started, no PR seen yet

- Chart periods: all periods, oldest → LTM → PF, periods on the X axis.
- PR 1: CP-2 scorecard table (told to load rubric level text from spec section 9).
- PR 3: reference portfolios intake (CLO pack CSV, SSGA LVLN/JNK holdings fetch, custom portfolio at the launcher).

## Not started (order from the spec's plan)

PR 2 recommendation code (after 0 and 1) · PR 4 workbook writer and PR 4b Model sheet (after 1–3
and chart periods) · PR 5 Deliverables page · PR 6 Credit Screening pathway and PR 7 custom routing
with alias phases (after PR 79 merges).

## Owner decisions (2026-11-25: "1. later 2. is fine 3. fix 4. fine 5. fine 6. update it")

1. Opus Full run above the USD 30 cap: deferred.
2. Coverage page at 17 columns: accepted.
3. Rubric gaps: fixed by the coordinating session's wording, sent to PR 80: Leverage level 4 "High
   leverage (5–6x), limited covenant cushion"; Market share level 2 "Top 3 competitor, or 10–30%
   share", level 3 "Mid-tier, 5–10% share". PR 1 (CP-2 scorecard) was told the two cells change.
4. Insufficient-information add-backs shown unclassified: accepted.
5. The four methodology readings in PR 80: confirmed.
6. `PRODUCT.md`: to be updated in PR 80 after it merges main.

All six were sent to PR 80's cloud session (delivery unconfirmed): check PR 80 carries them, that
the rubric probes were updated by hand and still exit 0, and how its merge of main was resolved.

## Not verified

Any paid run of the new presets, caps or CP-2 scorecard; the SSGA holdings file columns; whether
the app's host can reach ssga.com; the alias findings (CP-1E, CP-4B, CP-4D not wired end to end)
beyond a read-only search.

## Latest state (end of session, 2026-11-25)

- PR 80: all six owner decisions folded in; main merged in cleanly (caps 20/30/50 kept). Its only
  failing check was two run-start web tests (K5, K6 in `web/src/pages/connected/ConnectedApp.test.tsx`)
  timing out just over 5 s because each ran two start flows. Split into four tests, assertions
  unchanged, pushed as `f175b97d`; CI on that commit had NOT finished: check it. If green, PR 80
  needs the owner's word to merge. Its last changes (six decisions) had no reviewer pass.
- PR 81 (CP-2 scorecard) and PR 82 (chart periods, +8,321/−1,602) conflict with main after 79
  merged; their cloud sessions were asked to merge main in. Neither is reviewed.
- PR 3 (reference portfolios) had no PR yet.

## Merged after the note above

- PR 80 merged by the owner as `9e6c5867` (rulings, `AGENTS.md` amendments, methodology, rubric fix,
  `PRODUCT.md`, and the K5/K6 test split that fixed the CI timeout).
- PR 81 (CP-2 scorecard) merged by the owner as `0b18fdbe` after a task review passed (no High or
  Medium). Still for the owner to confirm: the Scale-in-reporting-currency rule quoting the owner,
  and the unruled fourth value "Not assessed" on the four assessment cells (lets Credit Direction go
  without a value with no repair asked).
