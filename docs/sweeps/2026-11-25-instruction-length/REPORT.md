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
- Three removals are content-neutral and can be measured offline today: 104,482 characters of
  method paragraphs that the head of the same instruction tells the model to disregard (a keyword
  count, so an upper bound), 32,313 characters of paragraphs sent twice within one module, and
  73,540 characters of CP-4's 4A and 4B method sent even when the run has no legal documents.
  Together about 12% of the deep pathway in a run without legal documents, if they do not
  overlap (not checked).
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

Changes 1 to 3 remove nothing the model is meant to act on. Changes 5 and 6 can lose method
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

## Not verified

- Any effect of length on output: no model was run.
- Token counts: estimates from bytes, not counted by a provider for the model in use.
- The overridden and requirement counts are keyword counts; no paragraph was read to confirm it
  is safe to remove. Whether the three content-neutral removals overlap was not checked.
- Whether the launcher can rerun one module against retained upstream handoffs without rerunning
  its producers.
- Whether the contradictions the 2026-11-13 sweep recorded have since been repaired.
- CP-8 and CP-L10; pathways other than deep and lite were prepared but not tabulated.
- Guidance read from search extracts (most OpenAI pages and every independent paper): check the
  wording and figures against the source before quoting them elsewhere.
