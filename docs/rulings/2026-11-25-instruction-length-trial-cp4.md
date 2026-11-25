# Instruction-length trial, CP-4: thirteen single-module runs on the Anthropic API, Claude Opus at high effort

lifts: live-provider-pause
by: user
date: 2026-11-25
configs: opus-high

The pilot (`2026-11-25-instruction-length-trial-pilot.md`; results in
`docs/sweeps/2026-11-25-instruction-length/REPORT.md`) ran each group once and ended with six
things to settle before a full trial. The owner said "do the six fixes, then run the full trial"
and, asked which modules, how many repeats and under what limit, chose "CP-4 only (Recommended)",
"5 A, 3 B, 5 C (Recommended)" and "Estimate plus 30% (Recommended)".

Scope: thirteen runs of `tools/instruction_trial.py live` for CP-4 on the bundle
`trial/bundles/case2-cp4` (PR #87): five of group A (today's instructions), three of group B (A
less repeated and inapplicable paragraphs), five of group C (the restructured method in
`trial/arms/C/CP-4.md`). CP-4 alone, because on this route it is the only module whose first
request is mostly instructions (48% in group A; 13% to 24% for CP-3, CP-5 and CP-6).

Order: the five group A runs are started together and finish first, so that A's own spread is
known; then the three B and five C runs are started together. Each run has its own new folder
outside the repository and a limit of 64 model turns (the pilot showed 32 is too few for CP-4 on
this model in every group).

Configuration: `opus-high` (Claude Opus 5.5, `claude-opus-5-5`, high effort, the Anthropic API
directly; the key comes from `ANTHROPIC_API_KEY` in the launching environment). As in the pilot
this is an exception, for this trial only, to the 2026-11-18 amendment that routes live calls
through the Copilot CLI; it is made in `tools/instruction_trial.py` alone and the engine is
unchanged. No web search.

Changed since the pilot, the same for every group: the covenant headroom rule now names the four
Direction words the check accepts (every CP-4 first write in the pilot was refused on that cell);
group C's text no longer uses the word "canonical". The pilot's CP-4 handoffs are therefore not
pooled with this trial's.

Cap: USD 15 for each run folder and USD 101 for the thirteen runs together. The total is the
estimate plus 30%: the two accepted CP-4 runs of the pilot at 64 turns cost USD 6.35 and 5.13, so
USD 6 a run and USD 78 for thirteen. A watcher sums what the runs have settled and stops those
still in flight at USD 101; calls in flight at that moment are still charged. No run is repeated.

Reading: each accepted handoff is scored against `trial/reading/v2/CP-4.md` (the pilot's list with
its bundled items split, fixed before the first run) by readers who are not told the group, each
handoff by two readers independently (`trial/reading/README.md`).

What it is and is not: a test of one module's output under three instruction texts with
everything else fixed, on a historical case (TransDigm as of 2024-09-30). Not a delivery, not
listed in the library, and no handoff it produces is supplied to another module.
