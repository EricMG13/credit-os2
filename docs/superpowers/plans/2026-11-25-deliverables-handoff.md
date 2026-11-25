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

## Decisions waiting for the owner

1. PR 79: a Full run on Claude Opus is estimated at USD 31–41, above the new USD 30 cap (estimate, not measured).
2. PR 79: the Coverage page grows from 14 to 17 columns as a side effect; no test covers it.
3. Rubric gaps: Leverage 5–6x (read as level 4); Market share 10–30% outside the top three.
4. An add-back CP-1D marks as insufficient information is shown unclassified, not assumed realised.
5. Methodology readings added in PR 80 that the spec did not state: no Credit Score means no
   proposed recommendation; a limit breach leaves a 4 or 5 unchanged; wider than the bucket median
   is more attractive; the four assessment cells do not enter the Credit Score.
6. `PRODUCT.md` still says no workbook is a deliverable.

## Not verified

Any paid run of the new presets, caps or CP-2 scorecard; the SSGA holdings file columns; whether
the app's host can reach ssga.com; the alias findings (CP-1E, CP-4B, CP-4D not wired end to end)
beyond a read-only search.
