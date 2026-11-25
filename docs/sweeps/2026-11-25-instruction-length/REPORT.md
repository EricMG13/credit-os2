# Instruction and reference length: review and how to measure a change, 2026-11-25

Step: review only. No method text, launcher or prompt was changed and no provider was called.
Added: `tools/instruction_metrics.py` (offline measures) and two baseline files beside this report.

## Bottom line

- Whether the length of the instructions lowers the quality of what the modules write is still
  unmeasured. This review measures the instructions themselves and sets out the trial that would
  measure the effect; the trial needs paid runs, which is the owner's decision.
- The instructions are long by every published rule of thumb: the deep pathway sends 1,815,970
  characters, about 473,500 tokens (estimated), across 20 modules. All 20 are over Anthropic's
  5,000-token guide for a skill body and 17 are over its 500-line guide.
- No vendor publishes a length at which instructions start to hurt. Anthropic, OpenAI and the
  independent studies agree on the remedy: remove text the model does not need, one group at a
  time, and rerun the same cases. None supports summarising or machine-compressing rule text.
- Three removals were proposed as content-neutral. The deeper check (below) narrows that: the
  32,313 characters of paragraphs sent twice within one module can be removed mechanically; the
  104,482 characters of method paragraphs the head overrides (a keyword count) need a
  paragraph-by-paragraph edit, because some paragraphs mix live and withdrawn rules; and the
  73,540 characters of CP-4's 4A and 4B method can only be withheld in a run without legal
  documents, where CP-4 blocks whatever it is sent.
- Instructions are not the largest part of what a late module reads. The 2026-11-13 sweep recorded
  first prompts of 183,000 to 252,000 tokens for CP-5, of which its instructions are about 33,000.
  The upstream handoffs remain the larger lever for both cost and attention.

## Basis

| | |
| --- | --- |
| Tree | `main` at `0b18fdb` |
| Instructions measured | Each pathway prepared offline on the synthetic issuer of `tools/cp1_check_proof.py --instructions`; the totals equal that tool's (deep 1,815,970; lite 677,194) |
| Token figures | Estimates at 3.85 bytes per token (`BYTES_PER_TOKEN_ESTIMATE`, `model/copilot.py`), not a provider's count |
| Run figures | Quoted from `docs/sweeps/2026-11-13-optimisation-review/REPORT.md`; the run folders are not in this repository |
| Guidance | Read on 2026-11-25. Anthropic pages were opened. OpenAI's sites were blocked from this session: four cookbook guides were read from their GitHub source, the rest from search extracts. The independent papers were read from search extracts only |

## What is sent now

Deep credit assessment, one row per module (`baseline-deep_credit_assessment.json`; the lite
pathway is in `baseline-lite_credit_assessment.json`). CP-8 and CP-L10 are not in this preset.

| Module | Characters | Tokens (est.) | Lines | Requirement sentences | Repeated characters | Overridden characters |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CP-4 | 216,974 | 56,619 | 2,760 | 257 | 18,592 | 5,240 |
| CP-3 | 188,257 | 49,062 | 2,175 | 298 | 3,317 | 7,001 |
| CP-6 | 141,623 | 36,983 | 1,810 | 235 | 5,334 | 5,002 |
| CP-5 | 126,831 | 33,074 | 1,409 | 227 | 1,765 | 15,929 |
| CP-1A | 104,771 | 27,308 | 1,228 | 151 | 575 | 4,315 |
| CP-2A | 103,987 | 27,116 | 1,280 | 148 | 575 | 4,315 |
| CP-2E | 97,356 | 25,396 | 1,122 | 137 | 982 | 4,551 |
| CP-2 | 80,167 | 20,912 | 915 | 106 | 0 | 4,344 |
| CP-3C | 79,362 | 20,684 | 869 | 111 | 675 | 5,121 |
| CP-0 | 75,268 | 19,600 | 808 | 119 | 249 | 4,470 |
| CP-DR | 73,449 | 19,129 | 646 | 121 | 0 | 5,964 |
| CP-1C | 68,192 | 17,801 | 782 | 87 | 0 | 4,977 |
| CP-2D | 67,103 | 17,500 | 697 | 116 | 0 | 4,271 |
| CP-1B | 66,907 | 17,436 | 833 | 99 | 0 | 4,673 |
| CP-2G | 62,341 | 16,247 | 583 | 101 | 0 | 4,626 |
| CP-1 | 60,235 | 15,667 | 357 | 110 | 0 | 770 |
| CP-4C | 57,376 | 14,960 | 524 | 88 | 0 | 5,034 |
| CP-2H | 53,357 | 13,910 | 511 | 83 | 0 | 5,233 |
| CP-3D | 47,103 | 12,280 | 485 | 61 | 0 | 4,388 |
| CP-1D | 45,311 | 11,817 | 499 | 65 | 249 | 4,258 |
| Total | 1,815,970 | 473,501 | 20,293 | 2,720 | 32,313 | 104,482 |

- Requirement sentences: sentences holding must, never, do not, shall, always, required and the
  like. A count of how much is demanded, not of distinct rules.
- Repeated characters: what removing the second and later copies of a paragraph of 200 characters
  or more would save within that module.
- Overridden characters: method paragraphs that name something `TRANSPORT_RULES` in the head tells
  the model to leave out or not wait for (`qa_status`, the helper scripts, acceptance receipts,
  invocation digests, confidence bands, the Audit Summary). The model is sent both the instruction
  and its withdrawal.
- The head (the transport, routing, voice and selector rules written for this workflow) is 387,886
  characters, 21% of the total; the method text is 79%.
- Emphasis in capitals is rare (121 words in total, 19 of them in CP-5), so the vendors' advice to
  soften shouted wording has little to act on here.
- Each module is one session of up to 32 turns, and the whole instruction is re-sent and read from
  cache on each turn. Caching lowers the price of those tokens; they still occupy the context.
- Order within a session: head rules, then the method, then the handoff format rules, then (in the
  user message) every producer's handoff in full, then source pages as the model reads them. The
  voice and selector rules therefore sit before 30,000 to 197,000 characters of method.

## What the guidance says

| Source | Claim | Number given |
| --- | --- | --- |
| Anthropic, context windows | Accuracy and recall fall as token count grows; cached text still fills the window | None |
| Anthropic, skills best practices | Keep a skill body under 500 lines and about 5,000 tokens; references one level deep; a table of contents in any reference over 100 lines | Rules of thumb, no data |
| Anthropic, Fable 5 prompting guide | Skills written for earlier models are often too prescriptive and can lower output quality; remove older instructions where the default is better | None |
| Anthropic, prompting best practices | Long documents first, the question and instructions after them | "Up to 30%" better, method unpublished |
| Anthropic, context engineering | Aim for the smallest set of information that fully states the behaviour; add instructions from observed failures | None |
| Anthropic, evaluation guides | Compare against the earlier version on fixed cases; prefer checks done by code, then a model grader with a rubric, then people | None |
| OpenAI, GPT-4.1 guide | With long context put instructions at both the start and the end; if once, before the context | None |
| OpenAI, GPT-5 guide | Contradictory or vague instructions cost reasoning effort and are more damaging than before | None |
| OpenAI, newest prompt guidance (search extract) | Leaner system prompts in a sample of coding-agent tests: scores up about 10 to 15%, tokens down 41 to 66%. Remove one group of instructions at a time and rerun the same tests | Directional, coding agents only |
| OpenAI, Codex | Project instructions are cut off at 32 KiB by default; a skill's body loads only when chosen | A hard limit, not a quality claim |
| IFScale (2025, 20 models) | Compliance falls as the number of simultaneous instructions rises; the best model followed 68% at 500; earlier instructions are favoured | Keyword instructions only |
| Chroma (2025, 18 models) | Reliability falls with input length even on simple tasks; a focused prompt beat the full one | Vendor study |
| NoLiMa (2025) | At 32,000 tokens 11 models fell below half their short-context score | Synthetic task |
| ETH, AGENTS.md study (2026) | Context files did not raise coding-agent success and raised cost by over 20%; unnecessary requirements were followed and made tasks harder | Coding only |
| LLMLingua-2 (2024) | Machine compression of 2 to 5 times with small loss on context and examples | Not tested on rule text |

Most of the measured degradation comes from 2023 to mid-2025 models on synthetic tasks, and
2026 re-runs put the thresholds higher. The figures say what to test here, not what to expect.

## What this project's own record says

- The owner has approved each rise in the per-pathway size ceiling (`INSTRUCTION_BUDGET` in
  `tests/test_cpos_launch.py`, eight rises since 2026-11-13). The ceiling guards growth; nothing
  measures what the size does to output.
- The 2026-11-13 sweep ruled trimming "not worth doing" on cost: about USD 0.035 a run. It did not
  test quality.
- A module has followed the wrong one of two disagreeing texts: CP-2A followed its SKILL over the
  stress design and gave no shock (comment above `STRESS_BLOCK`, `cpos_launch_prompts.py:248`).
  The same sweep recorded method paragraphs contradicting the head in nine modules.
- Copilot summarised a module's context at about 218,000 tokens and an accepted CP-8 handoff was
  written from the summary (sweep, defect 1). Total context size has already cost quality once.

## Candidate changes, each with its measure

In order of risk, lowest first. Offline measures come from `tools/instruction_metrics.py`.

| # | Change | Offline measure, now to target | What the trial must show |
| --- | --- | --- | --- |
| 1 | Remove repeated paragraphs within a module | Repeated characters 32,313 to 0 (CP-4 18,592) | Nothing changes: same check issues, same registers |
| 2 | Stop sending method paragraphs the head overrides, in place of sending both | Overridden characters 104,482 to near 0, after a paragraph-by-paragraph read | No module blocks for a missing script or receipt; no handoff names a script or a QA status |
| 3 | Send CP-4's 4A and 4B method only when the run has legal documents | CP-4 216,974 to about 143,400 in a run without them | CP-4 still blocks correctly under the source gate |
| 4 | Move the output rules (voice, passages, selectors) after the method, or restate them briefly there | Size unchanged; position only | Fewer check issues on the first write |
| 5 | Rewrite one module's method to what the model needs, starting with CP-4 or CP-3 | Characters, lines and requirement sentences for that module | Every measure in the next section holds or improves |
| 6 | Let a module read large reference bundles on request in place of receiving them all | Characters sent at the start | Required registers still present; the turns and reads it adds |

Changes 1 and 3 remove nothing the model is meant to act on; change 2 needs the paragraph edit
described in the deeper check. Changes 5 and 6 can lose method
content and belong to the one-module-at-a-time rule in `AGENTS.md`.

Not recommended: machine compression or summarising of method text (the rules carry exact
amounts, table identifiers and register names; the evidence is for context and examples), and
adding emphasis words to make rules stick.

## How to compare a new approach with the current one

Offline, free, available now:

```bash
uv run python tools/cp1_check_proof.py --instructions SCRATCH_DIR
```

```bash
uv run python tools/instruction_metrics.py SCRATCH_DIR/deep_credit_assessment/out/instructions --against docs/sweeps/2026-11-25-instruction-length/baseline-deep_credit_assessment.json
```

The second command prints each measure's change from the baseline, per module and in total.

Outcome, needs paid runs:

- Design: one module at a time; the same issuer, date, sources, model and effort; the same
  accepted upstream handoffs supplied to both arms, so the instruction is the only difference.
- Repeats: at least five runs per arm. Run the current arm first to learn the run-to-run range,
  which is unknown today; a difference inside that range is not a result.
- Measures, all from records a run already writes (`live/calls.jsonl`, each attempt's
  `review.json`, the method-check record):
  - check issues on the first write, by kind, and writes used out of three;
  - modules blocked or stopped;
  - method-script check failures and missing required registers;
  - figures against independently held expected values, exact on amount, period and unit;
  - input, cached and output tokens, turns, cost and wall time; the first prompt against the
    272,000-token limit.
- A reading by a different model against the reader standard, blind to the arm and with the pair
  order shuffled, is optional and should be checked against a person's reading on a sample.
- Pass rule: no measure worse than the current arm's range, and the size measure lower.

## What is sent, checked deeper (second pass)

One module session, in the order the model receives it:

| Part | Size | Note |
| --- | --- | --- |
| Tool definitions | 5,071 characters, 7 tools | Same for every module; CP-DR adds lookup tools |
| System: head rules | 15,000 to 30,000 characters | Written for this workflow |
| System: method files | 30,000 to 197,000 characters | Deploy V skill files, verbatim |
| System: closing format rules | about 800 characters | The six H2 headings and three attempts; web rules add 1,332 to 3,086 |
| User: run, module roles, source hashes | about 3,000 characters | The 24 module purposes are sent to every module |
| User: upstream handoffs | Every producer's handoff in full | Each as one JSON string, so line breaks arrive as `\n` (1.8% larger on a 95,333-character handoff) |
| Later turns | Tool results | Source pages of 3,000 characters, at most 8 per read |

- Handoffs received in the deep pathway: CP-4 4, CP-3 13, CP-6 14, CP-5 18. Correction (offline
  stage): on the Copilot route CP-3, CP-5 and CP-6 are now sent an index of their handoffs and
  read the text on request, so their first request is about 80% instructions (table below). CP-4
  is sent its four handoffs in full and its instructions are just under half of the first request.
  The sweep's larger first prompts predate the index.
- The handoffs are the largest text most late modules read and they are sent inside JSON. OpenAI's
  GPT-4.1 guide reports JSON performing poorly for long documents and Anthropic advises one tagged
  block per document. Not measured here.
- The method files are sent as written for another packaging, and the head corrects them by
  override: `## Analysis` is `## Findings` here, no score, band or QA status is written, the
  helper scripts cannot run. Correction (offline stage): the YAML front matter is not withdrawn.
  The engine reads `module_status` and the issuer fields from it and 23 of the 30 retained
  handoffs carry one; only the score, the band and `qa_status` are refused in it. The file name
  rule and export formats are still sent and have no use here (7,000 to 13,000 and 6,000 to
  15,000 characters of paragraphs in each of the four largest; keyword counts that overlap).
- One example of a mixed paragraph: CP-4's "Canon Core" (1,919 characters) holds the live rule on
  conclusion-first analysis and the withdrawn rules on file name, front matter and `qa_status` in
  the same numbered list.
- Every module is sent the confidence-score formula (2,175 characters) and told by the head not to
  state a score, because Python computes it. The lineage classes in that section are still used.
- Where the repeats are: CP-4's 18,592 are mostly its runbook and its steps bundle repeating each
  other (11,534). CP-6's 5,334 are mostly inside one steps bundle (3,679).
- What the three removals come to for the four largest: CP-4 11%, CP-5 14%, CP-6 7%, CP-3 5%
  (repeats plus the overridden keyword count; CP-4's 4A and 4B not counted, see above).

## Review of the proposed three-group trial

Proposal (owner, 2026-11-25): reuse existing handoffs with temporary adaptations to the engine;
run offline, then live, on the largest instructions with the same handoffs and issuer; group A the
current text, B the three content-neutral removals, C a deeper restructuring.

The design is sound: fixing the upstream handoffs makes the instruction the only difference, and
three groups show whether more removal gives more effect. Eight points to settle first.

1. **CP-4 needs a different case.** In both retained TDG runs CP-4 was correctly blocked for want
   of an executed governing document (1,714 and 1,396 words). The largest instruction is not
   exercised by those handoffs; it needs a case with the agreements in the sources.
2. **Group B is a small dose.** 5% to 14% of each instruction. No effect is the likely result, so
   B is a check that nothing is lost, not a test of length. It can take fewer repeats than A and C.
3. **Run A against itself first.** One run per setting exists today. Without the spread of A, no
   difference between groups can be read.
4. **The check must stay the same for all groups.** The acceptance check takes its required
   registers from the canonical method text. Group C's text must be swapped into the instruction
   only, or C would be graded by its own rules.
5. **The existing measures have little range.** The retained runs had 9 rejected drafts across 13
   modules; CP-3 and CP-6 had 0 or 1 each. Five repeats cannot separate groups on that. The
   earlier effort comparison found its differences by reading the handoffs. The trial needs a
   reading against a list of facts and conclusions fixed before the first run, done blind to group.
6. **Define C before running.** Proposed: the method rewritten for this transport (packaging rules
   and overridden text removed, runbook and steps merged where they repeat, output rules after the
   method) with every register id and table id kept, which can be checked offline.
7. **CP-5 says little about instruction length.** It receives 18 handoffs. A result there is mostly
   about the handoffs. CP-4 (4 handoffs) is the cleanest test, then CP-3 and CP-6.
8. **Group order.** Interleave the groups run by run so that provider-side drift is not read as a
   group effect.

What the engine allows:

- No command reruns one module on retained handoffs. The plan's `retained_handoffs` field and
  `run_live_handoffs` do it, as the launcher tests do. The temporary adaptation is a script that
  prepares a run, replaces the text after the method mark in the target's instruction file,
  writes the plan with the retained handoffs and the new instruction hash, and calls that
  function. No method file, pin or check changes.
- Each repeat needs its own run folder; a second launch in one folder replays the stored answer.
- A retained handoff is refused if today's check finds an issue in it, if its source hashes are
  not exactly this run's, or if its upstream set differs. The first offline step is to find out
  whether the existing handoffs still pass.
- Offline proves assembly, sizes, the refusals above and that C keeps every required register.
  It proves nothing about what a model writes.
- Live needs a new ruling file naming the configuration. The gate does not check which modules
  run, so a single-module run is allowed by it.
- The repository holds no complete set of real handoffs. `VERIFICATION.md` names run folders on
  the owner's machine (`~/cos-live/tdg-deep-20261116b`, `~/cos-live/tdg-agreements`).

Cost, estimated from one retained run per setting (Copilot gpt-6.1-sol, medium to high): CP-3 USD
0.80 to 0.97, CP-6 0.73 to 0.99, CP-5 2.26 to 2.80 per run. Three groups of five repeats on those
three modules is about USD 57 to 71. An unblocked CP-4 has no retained cost.

## Offline stage of the trial (third pass, 2026-11-25)

Built: `tools/instruction_trial.py`, a temporary adaptation, with `tests/test_instruction_trial.py`.
No provider was called. Case material: the two bundles of PR #87 (`trial/bundles/`, not merged
here), both TransDigm as of 2024-09-30, deep credit assessment, Copilot gpt-6.1-sol medium.
Outdated evidence, used to prove function, not a current credit view.

How it works: the run is prepared afresh from the bundle's context and issuer files, so the
instructions are today's. The module's task is built as CP-OS builds it, with the bundle's
handoffs standing for its producers'. The engine's own per-module runner, executor and acceptance
check are used unchanged; the check is built from the canonical method for every group. Offline, a
stand-in for the provider submits the bundle's own handoff for the module.

The three groups as built:

- **A**: the prepared instructions, unchanged.
- **B**: A less (1) every second and later copy of a paragraph body of 200 characters or more,
  including a copy under a renamed heading ("relocated from", "continued"), and (2) four kinds of
  paragraph that only tell the model to run a helper script or show a score Python computes.
  Nothing is reworded. Narrower than first proposed: a paragraph that mixes a live rule with
  withdrawn text stays, and CP-4's 4A and 4B method stays because the case has legal documents.
- **C**: A's head, then a restructured method (`trial/arms/C/<module>.md`), then the shared
  sections unchanged. Each text was written by a separate agent from the module's own skill
  files under one brief: keep every id, column, value set, threshold, gate and prohibition as
  written; remove script runs, receipts, file naming, export and chat text; state a repeated rule
  once; add nothing. Not reviewed by a person.

| Module (case) | Group | Characters | Lines | Requirement sentences | First request, tokens (est.) | Ids dropped | Replay of retained handoff |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| CP-4 (case 2, agreements) | A | 216,976 | 2,760 | 257 | 118,614 | 0 | accepted |
| | B | 194,240 | 2,453 | 240 | 112,671 | 0 | accepted |
| | C | 118,050 | 1,001 | 174 | 92,762 | 0 | accepted |
| CP-3 (case 1) | A | 188,333 | 2,176 | 298 | 59,143 | 0 | rejected, 1 issue |
| | B | 175,406 | 2,045 | 262 | 55,765 | 0 | rejected, same issue |
| | C | 112,196 | 742 | 192 | 39,273 | 0 | rejected, same issue |
| CP-6 (case 1) | A | 141,625 | 1,810 | 235 | 47,753 | 0 | accepted |
| | B | 129,540 | 1,668 | 215 | 44,577 | 0 | accepted |
| | C | 90,491 | 932 | 170 | 34,323 | 0 | accepted |
| CP-5 (case 1) | A | 126,833 | 1,409 | 227 | 45,776 | 0 | accepted |
| | B | 115,576 | 1,319 | 206 | 42,839 | 0 | accepted |
| | C | 84,750 | 823 | 149 | 34,772 | 0 | accepted |

Per-module files are in `offline/`. What the table shows:

- B is 7% to 10% shorter than A; C is 33% to 46% shorter. No group drops a register or table
  id, and every required register is still named.
- The preparation, task, executor, check and records work end to end for all twelve combinations.
- The replay verdict is the same across groups by construction: it shows the retained handoff
  against today's check, not what a model would write from the text.
- CP-3's retained handoff fails today's check in every group ("expected one CP-3/Capital
  structure"): today's layout asks CP-3 for a section the 2026-11-16 run was not asked for. It
  stays usable as a fixed input to CP-5 and CP-6; it is not a baseline answer for CP-3.
- The bundle's Bloomberg quote sheet is absent and the run still prepares; `context.json`
  carries the quote values.

The retained runs give one observation of the current text each (older instructions, handoffs
sent in full, so not like for like with group A today): CP-3 6 calls and USD 0.82, CP-5 11 calls
and USD 1.07, CP-6 5 calls and USD 0.84, CP-4 (with agreements) 13 calls and USD 1.00. Each was
accepted on its first write, so "issues on the first write" was zero for all four: that measure
will not separate the groups, and the blind reading against a fixed list remains necessary.

Reported by the authors of the C texts, not checked independently:

- Places where the source method disagrees with itself are kept and marked "Conflict in the
  source method:" (CP-4 2, CP-3 3, CP-5 5, CP-6 3). They exist in A and B too, unmarked.
- CP-3: the recovery waterfall has no formula in the method, only a description of what the
  helper script works out. No group gives the model a formula for it.
- CP-3's first draft had changed four rules (a ban extended to a phase without it, a formula
  written out, one rewording, one more ban); all were restored to the source wording.
- CP-5's author checked the result against reading notes, not line by line.
- Dropped as already said by the head or the shared sections: the opening heading and word
  range, routing and research-request text, and (CP-4) two readiness sub-steps.

Before a live run:

1. A person should read at least one C text against its source; the id check cannot see a
   dropped rule that has no id.
2. The fixed lists for the blind reading (written in the fourth pass) should be read by a person.
3. `live` mode is written and has not been run; the ruling is in the fourth pass.
4. Each run reserves about USD 7.17 per call against its cap before settling at well under USD 1.

## Reading lists and the pilot ruling (fourth pass, 2026-11-25)

- `trial/reading/`: one fixed list per module and the procedure (`README.md`). Each list was
  written by a separate agent from the issuer files and the module's fixed inputs only; the
  module's own retained handoff, later handoffs, the method and the group texts were not opened.

  | Module | Items | Facts | Conclusions | Discipline | Source passages, all matched exactly |
  | --- | ---: | ---: | ---: | ---: | ---: |
  | CP-3 | 18 | 10 | 4 | 4 | 51 |
  | CP-4 | 18 | 11 | 4 | 3 | 62 |
  | CP-5 | 20 | 13 | 4 | 3 | 64 |
  | CP-6 | 19 | 10 | 5 | 4 | 62 |

- Checked: every quoted passage is on the stated page or in the stated handoff (exact match
  after collapsing whitespace), and no evidence comes from a barred file. Not checked: that each
  expected value is the right reading of its passage, and that the items are the ones that
  matter. A person should read the lists before the first run; they are frozen after it.
- CP-5's list is an audit done in advance: seven defects confirmed in the fixed upstream handoffs
  that a correct audit must flag, four sound claims it must not flag, two module states. CP-6's
  holds four real disagreements between upstream handoffs.
- Thin: recovery, pricing and sizing for CP-3 and headroom in dollars for CP-4 have no figure in
  the evidence, so those items test how the gap is handled.
- Correction: in case 1 the legal module was not blocked; it ran on the 10-K's summaries because
  no executed agreement was supplied.
- Found in the fixed inputs, the same for every group: the context quotes term loans M and N
  while the 10-K lists tranches I to L at 2024-09-30; three upstream handoffs cite the quote
  sheet that is not in the bundle; the source-readiness handoff says no ratings or prices were
  supplied while the context carries both.
- `docs/rulings/2026-11-25-instruction-length-trial-pilot.md`: twelve runs, one per module and
  group, USD 10 a run. `tools/instruction_trial.py live` takes `--trial-cap` and refuses a run
  once the runs beside it have settled that total. Nothing was run.
- Model (owner, 2026-11-25: "model is anthropic api opus high"; "Lift the guard yourself for this
  trial"): `opus-high`, Claude Opus 5.5 on the Anthropic API directly, total USD 54 (an estimate
  of USD 36 plus 50%). Direct provider calls were retired on 2026-11-18 and the engine refuses
  them; the exception is made in the trial script alone and recorded in the ruling. The engine
  is unchanged.
- What the direct route does to the trial: every module is sent its handoffs in full, so the
  instruction text is a small part of what CP-3, CP-5 and CP-6 read.

  | Module | First request, bytes: A | C | C against A | Instructions' share in A |
  | --- | ---: | ---: | ---: | ---: |
  | CP-4 | 456,652 | 357,123 | -22% | 48% |
  | CP-3 | 794,425 | 717,924 | -10% | 24% |
  | CP-6 | 850,291 | 798,586 | -6% | 17% |
  | CP-5 | 958,015 | 915,651 | -4% | 13% |

  On this route CP-4 is the only module where the groups differ much in what the model is sent.
  A null result for CP-3, CP-5 and CP-6 here would say little about the Copilot route, where
  their first request is about 80% instructions.
- Dry run of the live path with the network call replaced: the request is built for
  `https://api.anthropic.com/v1/messages`, model `claude-opus-5-5`, effort high, adaptive
  thinking, output limit 64,000, and the run records and summary are written. The key is sent as
  the engine has always sent it (`Authorization: Bearer`); not sent anywhere in this check.

## Pilot: live runs and blind reading (fifth pass, 2026-11-25)

Ruling: `docs/rulings/2026-11-25-instruction-length-trial-pilot.md`, as amended that day.
Fourteen single-module runs on `opus-high` (Claude Opus 5.5, Anthropic API directly), started
together. Records of every run are in `pilot/`; the blind scores and the code table in
`pilot/reading/`. TransDigm as of 2024-09-30: outdated evidence, used to test module output.

Bottom line: the live path, the caps and the reading procedure work. One run per group shows no
difference between the groups that this pilot can support, in either direction.

| Module | Group | Outcome | Turns | First request, tokens | USD | Check issues per write | Blind reading: right / wrong / absent |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| CP-3 | A | accepted | 4 | 333,564 | 3.15 | 0 | 15 / 1 / 2 of 18 |
| | B | accepted | 15 | 328,564 | 4.10 | 0 | 13 / 2 / 3 |
| | C | accepted | 16 | 300,986 | 4.02 | 1, 0 | 15 / 2 / 1 |
| CP-4 | A | no handoff at 32 turns | 32 | 191,035 | 3.46 | none written | not read |
| | A, 64 turns | accepted | 46 | 191,035 | 6.35 | 8, 0 | 10 / 1 / 7 of 18 |
| | B | rejected at turn 32 | 32 | 182,028 | 3.82 | 6 | not read |
| | C | no handoff at 32 turns | 32 | 148,131 | 2.49 | none written | not read |
| | C, 64 turns | accepted | 44 | 148,131 | 5.13 | 11, 0 | 9 / 2 / 7 |
| CP-5 | A | accepted | 11 | 406,964 | 3.86 | 0 | 12 / 1 / 7 of 20 |
| | B | stopped by its USD 10 cap | 16 | 402,384 | 4.27 | 3 | not read |
| | C | accepted | 19 | 388,498 | 4.51 | 1, 0 | 13 / 0 / 7 |
| CP-6 | A | accepted | 6 | 360,151 | 3.26 | 0 | 11 / 0 / 8 of 19 |
| | B | accepted | 6 | 355,239 | 3.28 | 0 | 12 / 2 / 5 |
| | C | accepted | 6 | 336,823 | 3.13 | 1, 0 | 13 / 2 / 4 |

Total settled USD 54.83 against the USD 54 limit: the last rerun's calls were in flight when the
total passed it. The estimate was USD 36.

What the pilot established:

- The direct route works end to end: 285 calls, none failed, caching held, every run wrote its
  records. First requests were 148,000 to 407,000 tokens (the provider's count), within about 6%
  of the offline estimate at 2.5 bytes per token.
- 32 turns is too few for CP-4 on this model in every group: it reads the agreements a few pages
  a turn. With 64 turns groups A and C were accepted at 46 and 44 turns.
- The reading procedure works: ten handoffs scored against 75 items by readers who were not told
  the group, each score with its quoted passage.

What it suggests and cannot show (one run per cell):

- Group C needed a second write in all four modules; group A needed one only in CP-4. Two of C's
  first-write issues were words from the restructured text reaching the reader passage
  ("issuer_id", "canonical"). Worth checking in the C texts before any further run.
- CP-4's first write failed the same chart rule in all three groups (the Direction cell wants
  "Passes at or below", and each group wrote a sentence). That is a gap in the instructions all
  groups share, not a group effect.
- Blind scores do not separate the groups: right answers differ by at most two items within a
  module, and the direction is not consistent (C highest in CP-5 and CP-6, A and C equal in CP-3,
  A higher in CP-4).
- Cost did not fall with shorter instructions on this route. The handoffs dominate the request,
  and C's smaller first request was offset by a second write or more turns.

Weaknesses of the measure, found by running it:

- The rule for an item that bundles several values scores Absent when one listed value is
  missing. It produced most of the Absent scores in CP-4, CP-5 and CP-6 (four fact items Absent
  for every CP-6 handoff). The lists should split those items before a full trial.
- Several scores were close calls the readers flagged (a figure given to one more decimal than
  the source; a qualified verdict that names blocked modules only in its sources table). At
  differences of one or two items, such calls decide the order.
- The readers were agents; no person has checked a sample of their scores.
- Two modules' handoffs call the dividend paid on 2024-10-18 "the September payment", in groups
  A and C alike. It is outside the lists and probably comes from a fixed upstream handoff.

Missing: CP-4 group B and CP-5 group B have no accepted handoff. Rerunning them would have taken
the total past the limit.

For a full trial, in this order: fix the chart Direction wording that failed every CP-4 first
write; split the bundled items; read the C texts for the leaked words; set the turn limit to 64
for CP-4; decide the route, since on the direct route only CP-4's request is mostly
instructions; then repeats of each group, group A first for its own spread.

## Full trial of CP-4, four groups (sixth pass, 2026-11-25)

Ruling: `docs/rulings/2026-11-25-instruction-length-trial-cp4.md` with its amendments. Records and
blind scores: `trial-cp4/`. Case: TransDigm as of 2024-09-30 with the executed agreements;
outdated evidence, used to test module output. Model: Claude Opus 5.5, high effort, Anthropic API.

Bottom line: on this module, model and case, none of the three changes made runs cheaper or
shorter. Removing repeated and inapplicable text (B) and adding first-pass reading notes (D)
each scored about four items higher than the current instructions, with every run above the
current instructions' middle; the full rewrite (C) scored higher on average but was the least
steady. The samples are three to five runs a group on one case, so these are leads, not findings.

| Group | Runs | Items right of 61, each run | Mean | Wrong, mean | Accepted on first write | Turns | Source calls | USD a run |
| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: |
| A, current | 5 | 32, 32.5, 35.5, 36, 36.5 | 34.5 | 1.5 | 5 of 5 | 39 | 57 | 3.94 |
| B, removals | 3 | 37, 39, 40.5 | 38.8 | 1.5 | 2 of 3 | 38 | 59 | 4.87 |
| C, restructured | 5 | 31, 35, 37, 41, 42 | 37.2 | 1.2 | 1 of 5 | 36 | 59 | 4.76 |
| D, A plus reading notes | 5 | 35.5, 36.5, 37, 42, 42 | 38.6 | 0.8 | 4 of 5 | 38 | 62 | 6.56 |

A run's score is the mean of its two readers. Settled in all: USD 98.53 of the USD 101 limit,
including USD 2.23 for the eight runs the provider refused for lack of credit and USD 5.25 for
D-1.

What the trial supports:

- Shorter instructions did not reduce cost, turns or reading. First requests fell from 191,085
  tokens (A) to 182,078 (B) and 148,183 (C); cost rose by about USD 0.90 a run in both, from
  longer handoffs and second writes.
- B is the only change that removes text and nothing else, and all three of its runs scored
  above all five of A's. By chance that ordering has a probability of 1 in 56.
- C's range (31 to 42) is twice A's (32 to 36.5), and four of its five first writes were
  refused, mostly for a figure stated in prose and absent from the tables. A rewrite changes
  more than length.
- D did not replace reading: the module searched and read as much as in A. The rule that
  every term be confirmed on its page makes the notes an addition. D cost USD 2.62 more a run
  (USD 0.92 for the reader, the rest for carrying about 52,000 tokens of notes through every
  turn). Its scores were the steadiest of the three changes and it had the fewest wrong items.
- The Direction wording fix (in every group) took CP-4's first-write acceptance from 0 of 3 in
  the pilot to 12 of 18 here, and 5 of 5 in group A.

Limits of the measure:

- Readers: six agents of one model, two a handoff; they agreed on 1,202 of 1,220 scores (98.5%).
  Two group A handoffs re-read under new codes by the last pair scored 31.5 and 37 against 32
  and 36.5 before. That is consistency between like readers, not a check of correctness; no
  person has checked a sample.
- The list's 61 items came from the agreements in detail. 29 were right in every group A run
  and 18 in none, so about a quarter of the list separates runs.
- One case, one module, one model and effort, one route. On the Copilot route, where the first
  request of late modules is mostly instructions, the result may differ.
- D-1 was run with a reader that wrote notes for four of six documents; it is kept and left out,
  decided before it was read. It has not been scored.
- Group B has three runs to the others' five.

What follows, each to be probed the same way before it is adopted:

1. Group B's removals are the candidate to take into the method files: mechanical, no rule
   reworded, and the only change that scored above A in every run. Five more runs of B would
   bring it level with the other groups.
2. Do not adopt C as written. If a restructured method is wanted, change it in steps that can
   each be probed, starting from B.
3. D's notes help content at a cost. A cheaper form to test: notes for the two or three longest
   documents only, or notes held outside the instructions and read on request.
4. The recurring error in every group is the revolver's maturity given without its springing
   condition. That is a candidate for one exact sentence backed by a check, as with Direction.

## Applied after the trial (seventh pass, 2026-11-25)

Owner: "apply recommendations. can these be applied to all modules?"

- Applied: CP-4 is sent its method without the block's repeats (`TRIMMED_METHODS` and
  `trim_method` in `owners/cpos_launch_methods.py`). The text CP-4 is sent is byte for byte what
  group B tested. The method files, their hashes and the registers the check requires are
  unchanged; each file's heading in the block still names the file's sha256.
- Consequences: CP-4 is no longer sent its method word for word (two launcher tests said so and
  now say which block it carries); the library marks CP-4 in every earlier run as answered under
  an earlier method, since its block changed.
- Not applied: group D's reader notes (USD 2.62 dearer a run and no less reading; a cheaper form
  has to be probed first); the restructured texts (C); a sentence on springing maturities (no
  check can back it, and it would go in unprobed). The five further group B runs were not made:
  the trial's limit is spent.
- All modules: the same trimming drops no register or table id in any of the 20 modules of the
  deep pathway and leaves every required register named. It removes 22,736 characters from CP-4
  (10.5%), 11,257 from CP-5 (8.9%), 12,085 from CP-6 (8.5%), 12,927 from CP-3 (6.9%) and 382 to
  2,448 from each of the other sixteen (0.6% to 3.8%, almost all of it the paragraphs that tell
  the model to run a helper script).
- Then applied to every module (owner: "add now apply to all modules"): `TRIMMED_METHODS` is
  every module with a method. 82,875 characters leave the 22 method blocks (5.7%); CP-8 and
  CP-L10 are unchanged. Only CP-4 has runs behind the change; the other nineteen changed modules
  rest on the offline check and the owner's instruction. The library marks those twenty modules
  in every earlier run as answered under an earlier method.

## Not verified

- Any effect of length on output: the pilot ran each group once, which cannot show one.
- Token counts: estimates from bytes, not counted by a provider for the model in use.
- The overridden and requirement counts are keyword counts; no paragraph was read to confirm it
  is safe to remove. Whether the three content-neutral removals overlap was not checked.
- A person's check of the blind readers' scores, and of the reading lists.
- The C texts against their sources, rule by rule (see the offline stage).
- Whether the contradictions the 2026-11-13 sweep recorded have since been repaired.
- CP-8 and CP-L10; pathways other than deep and lite were prepared but not tabulated.
- Guidance read from search extracts (most OpenAI pages and every independent paper): check the
  wording and figures against the source before quoting them elsewhere.
