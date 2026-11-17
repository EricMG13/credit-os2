# Earnings Update runs CP-1A

by: user
date: 2026-11-16

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line; paid execution still needs its own explicit action. No run has been made with this change.

Owner's words, 2026-11-16, in the session that built the start page's Leave out: "Cp-1a should run
most of the time. It describes the issuer." Told that CP-1A already ran on every listed pathway but
Earnings Update, and asked whether Earnings Update should run it too, the owner chose "Add it to
Earnings Update", as its own pull request after the start page's (#42), reviewed as a pathway change.

Scope: offline only. No provider was called.

## What was true before

- CP-1A (Business & governance) was in the presets of `credit_snapshot`, `covenant_refinancing`,
  `distressed_restructuring`, `lite_credit_assessment` and `deep_credit_assessment`, and ran on
  `relative_value` and `portfolio_decision` because the planner adds it for CP-2. `earnings_update`
  had no CP-2, so CP-1A did not run there.
- Earnings Update's report already names CP-1A's `company-profile` section; with no CP-1A it had no
  route and was listed among the sections not produced.

## What changes

- `src/deploy_vii/contracts.py` `PATHWAY_MODULES["earnings_update"]` becomes
  `CP-0, CP-1, CP-MODEL, CP-1A, CP-1B, CP-1D, CP-DR, CP-2E, CP-5` (CP-1A right after CP-MODEL, as in
  the other presets that hold both). Every copy changes with it: the React start page's list
  (`web/src/pages/connected/api.ts`, pinned to the presets by `tests/test_start_forecast_pathways.py`)
  and the older start page's `PATHWAYS` and `RUN_ORDER` (`docs/templates/context-form.html`, pinned by
  `tests/test_context_form.py`).
- The run order, from `deploy_vii.registry.plan`: CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-2E, CP-1D, CP-5
  (CP-MODEL publishes the forecast and makes no model call). `company-profile` is now routed to CP-1A.
- The owner's preset answer key (`tests/test_cpos_launch.py` `PRESET_ANSWER_KEY`) changes for
  `earnings_update` only.
- Instruction size: the earnings_update instructions (CP-8 left out) measured 546,723 characters
  before and 651,532 after (+104,809: CP-1A's own 104,584 and 225 more in CP-5's). The prompt-size
  ceiling in `tests/test_cpos_launch.py` rises from 546,729 by that 104,809 to 651,538. No other
  ceiling moves.

## Cap

The cap stays USD 20 (`2026-11-15-pathway-tiers-and-caps.md`); the launcher stops a run at its cap.
No per-pathway cost estimate exists in code. Estimate from recorded runs: the last live Earnings
Update run, `tdg-earnings_update-003`, charged USD 3.51 with CP-8
(`2026-11-15-module-validation-live-test.md`); CP-1A alone measured USD 1.0643 at medium effort
before its 2026-11-13 prompt growth (`2026-11-13-full-and-lite-credit-assessments.md`). Scaling the
USD 3.51 run by the instruction size (651,532 / 546,723) gives about USD 4.18; adding twice CP-1A's
recorded cost gives about USD 5.64. Either is well under USD 20. This is an estimate, not a
measurement: no Earnings Update run with CP-1A has been made.

## What the reader sees

- An Earnings Update report gains its Company profile section, written by CP-1A.
- The next Earnings Update run of an issuer whose earlier run had no CP-1A shows CP-1A on its Changes
  page as run now and not in the earlier run. An earlier preset run stays a comparison base.

Read by: the launcher's presets, both start pages, the run-order tests, the instruction-size test.
