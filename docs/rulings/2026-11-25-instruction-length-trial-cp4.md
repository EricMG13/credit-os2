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

Amendment by the owner on 2026-11-25, during the trial: the five group A runs were accepted; the
three B and five C runs were all refused by the provider for lack of credit on the account
behind the key in use (two after 7 and 6 calls, six on their first call), with no handoff. Asked
for credit or leave to use another of the keys supplied, and for leave to run those eight again
although "no run is repeated", the owner said "approved for both". The eight are run once more in
new folders (B-4 to B-6, C-6 to C-10) with another supplied key; what the refused runs settled
(USD 2.23) counts toward the USD 101 total.

Amendment by the owner on 2026-11-25, after groups A, B and C had run: shown how a published
framework (Harness², arXiv 2610.14224) moves bulky reading out of the main agent, and the
recommendation to test that for CP-4, the owner said "apply the recommendations and re-test as
group D and compare with prior runs". Group D: five runs of CP-4, each as group A with one
addition. Before the module runs, a separate reader on `claude-haiku-5-5` (Anthropic API, same
key) is given each legal document whole, one document a call in a clean context, and writes
page-referenced notes on the topics named by CP-4's own method step titles; the notes and one
rule (they are a finding aid, the page governs, cite the document) are placed after the module's
instructions. The reader's cost (USD 0.50 per million prompt tokens above 100,000 and 2.50 of
output; about USD 1 a run estimated) counts toward the run's USD 15 and the trial's USD 101.
The reader is a second model beside `opus-high` and is called from `tools/instruction_trial.py`
alone. No run is repeated.

