# Instruction-length trial, pilot: twelve single-module runs on the Anthropic API, Claude Opus at high effort

lifts: live-provider-pause
by: user
date: 2026-11-25
configs: opus-high

The owner asked for a review of module instruction length ("certain modules instructions +
references may be too long, and could impact performance (unmeasured)... findings must be
measurable to compare new approach vs current") and then set the trial: "using existing handoff
and temporary adaptations to the engine. run offline then live tests of the largest instructions
and compare results (same handoffs and issuer). groupe: A) current no changes groups B) do the
three content-neutral removals. c) deeper restructuring". The offline stage is recorded in
`docs/sweeps/2026-11-25-instruction-length/REPORT.md`. Asked on 2026-11-25 how many live runs, on
which model and under what limit, the owner chose "Pilot: 1 of each first", "anthropic opus high"
and "Estimate plus 50% (Recommended)".

Configuration: `opus-high` (Claude Opus 5.5, `claude-opus-5-5`, at high effort, called on the
Anthropic API directly; the key comes from `ANTHROPIC_API_KEY` in the launching environment and
that account pays). No web search.

Exception to an earlier ruling, for this trial only: the amendment of 2026-11-18 to
`2026-11-11-run-start-submit.md` ("all routing should be through co-pilot CLI") retired direct
provider calls, and the engine refuses them. The first draft of this ruling therefore named the
Copilot configuration. The owner then said "model is anthropic api opus high" and, told that the
engine's guard stood in the way, "Lift the guard yourself for this trial". The guard is lifted in
`tools/instruction_trial.py` alone (`direct_transport`), which makes the engine's own HTTPS call
for a non-Copilot configuration. The engine, its launcher and the run start page are unchanged
and still refuse a direct configuration.

What the direct route changes: every module is sent its upstream handoffs in full (only the
Copilot route sends CP-3, CP-5 and CP-6 an index), so their first requests are about 720,000 to
960,000 bytes, of which the instructions are 9% to 24%. CP-4's is 357,000 to 457,000 bytes, about
a third to a half instructions.

Scope: twelve runs of `tools/instruction_trial.py live`, one module each, one per combination of

- module: CP-3, CP-5 and CP-6 on the bundle `trial/bundles/case1-cp3-cp6-cp5`; CP-4 on the bundle
  `trial/bundles/case2-cp4` (both from PR #87);
- group: A (today's instructions), B (A less repeated and inapplicable paragraphs), C (the
  restructured method in `trial/arms/C/`).

Each run goes into its own new folder outside the repository. The groups are run interleaved,
module by module (A, B, C of one module, then the next), on the same day. No run is repeated under
this ruling: a failed or stopped run is recorded as that, and the pilot goes on to the next.

What it is and is not: a test of module output under three instruction texts with everything else
fixed. TransDigm as of 2024-09-30 is a historical case; the term-loan quotes in the context are
test input assigned to that date. It is not a delivery, is not listed in the library, and no
handoff it produces is supplied to another module. The acceptance check is the launcher's own,
from the canonical method, for every group.

Cap: USD 10 for each run folder (a single call holds USD 2.74 to 5.15 on this configuration
before it settles) and USD 54 for the twelve runs together. The total is the estimate plus 50%.
The estimate, USD 36, is worked from the first-request sizes of the offline stage at about 2.5
bytes per token for this model (the earlier pilot measured 2.39 to 2.55), list prices of USD 5
per million tokens written to the cache, 0.20 read from it and 20 of output, the call counts of
the retained runs (5 to 13 a module) and 30,000 to 60,000 output tokens a module at high effort:
about USD 3 for each of CP-3, CP-4 and CP-6 and USD 4 for CP-5, for each group. No run of these
modules on this configuration exists, so the estimate may be wrong in either direction; the pilot
stops when the settled total reaches USD 54, whatever remains unrun.

Reading: each accepted handoff is scored against `trial/reading/<module>.md`, a list fixed before
the first run, by a reader who is not told the group (`trial/reading/README.md`).

After the pilot: its purpose is to prove the live path and the reading procedure and to see one
observation per combination. One run per group cannot show a difference between groups. The full
trial (repeats of each group) needs its own ruling.
