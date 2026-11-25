# Instruction-length trial, pilot: twelve single-module runs through GitHub Copilot on Claude Opus, high effort

lifts: live-provider-pause
by: user
date: 2026-11-25
configs: copilot-opus-high

The owner asked for a review of module instruction length ("certain modules instructions +
references may be too long, and could impact performance (unmeasured)... findings must be
measurable to compare new approach vs current") and then set the trial: "using existing handoff
and temporary adaptations to the engine. run offline then live tests of the largest instructions
and compare results (same handoffs and issuer). groupe: A) current no changes groups B) do the
three content-neutral removals. c) deeper restructuring". The offline stage is recorded in
`docs/sweeps/2026-11-25-instruction-length/REPORT.md`. Asked on 2026-11-25 how many live runs, on
which model and under what limit, the owner chose "Pilot: 1 of each first", "anthropic opus high"
and "Estimate plus 50% (Recommended)".

Configuration: `copilot-opus-high` (Claude Opus 5.5 at high effort through GitHub Copilot; gh CLI
login, `COPILOT_USE_GH_LOGIN=1`; the gh CLI's active account pays). The engine refuses a live run
on any configuration that is not a Copilot one (`cpos._require_live_route`), so the direct
Anthropic `opus-high` cannot be used and is not listed. No web search.

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

Cap: USD 10 for each run folder (a single call holds USD 4 to 6.25 on this configuration before it
settles) and USD 50 for the twelve runs together. The total is the estimate plus 50%: the retained
`copilot-sol-medium` runs of these four modules cost USD 3.73 together (CP-3 0.82, CP-5 1.07, CP-6
0.84, CP-4 1.00); the earlier Opus medium run cost 2.26 times the Sol medium run (USD 19.45 against
8.62) and high effort cost 1.32 times medium on Sol, giving about USD 11.1 for one group of four and
USD 33 for three. No Opus high run of these modules exists, so the estimate may be wrong in either
direction; the pilot stops when the settled total reaches USD 50, whatever remains unrun.

Reading: each accepted handoff is scored against `trial/reading/<module>.md`, a list fixed before
the first run, by a reader who is not told the group (`trial/reading/README.md`).

After the pilot: its purpose is to prove the live path and the reading procedure and to see one
observation per combination. One run per group cannot show a difference between groups. The full
trial (repeats of each group) needs its own ruling.
