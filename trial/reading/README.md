# Blind reading of the instruction-length trial

What this is for: the trial gives one module three instruction texts (groups A, B, C) with the
issuer, date, sources and upstream handoffs fixed. The acceptance check cannot tell the groups
apart on quality: in the retained runs all four modules passed it on the first write. The reading
scores what each handoff says against a list fixed before the first run.

The lists: `CP-3.md`, `CP-4.md`, `CP-5.md`, `CP-6.md`, each with its `.evidence.json` (the source
passage behind every item). Case: TransDigm Group Incorporated as of 2024-09-30, a historical
test case. The lists were written from the issuer files and the module's fixed inputs only; no
earlier answer of the module and no group's instruction text was read to write them.

The lists are frozen once the first live run starts. A wrong item found later is struck for every
group and noted here with the date; it is not reworded.

## Running the pilot

Ruling: `docs/rulings/2026-11-25-instruction-length-trial-pilot.md`. One run per module and group,
interleaved, every run folder under one parent outside the repository, with `ANTHROPIC_API_KEY` set
in the launching environment:

```bash
uv run python tools/instruction_trial.py live --bundle trial/bundles/case2-cp4 --module CP-4 --arm A --out ~/cos-live/instruction-trial/CP-4-A-1 --ruling docs/rulings/2026-11-25-instruction-length-trial-pilot.md --config opus-high --cap 10 --trial-cap 54
```

Then `--arm B` and `--arm C` with `CP-4-B-1` and `CP-4-C-1`, then CP-3, CP-6 and CP-5 on
`trial/bundles/case1-cp3-cp6-cp5`. Each run writes `trial-summary.json` (calls, tokens, cost,
writes, check issues) and its handoff under `requests/<module>/<fingerprint>/1.response.md`.

## Blinding

1. Someone other than the reader copies each accepted handoff to `blind/<module>/<code>.md`, where
   the code is random, and keeps the code-to-group table in a file the reader does not open.
2. The reader is given the module's list, its evidence file and the coded handoffs. Nothing else:
   not the run folders, not `trial-summary.json`, not the instruction texts.
3. A handoff states neither its group nor its instruction size, so no text is removed from it.
4. A run that produced no accepted handoff is not read. It is counted for its group as a run
   without a handoff.

A model may be the reader if it is not the model that wrote the handoffs and is given the same
three things. Its scores are then checked by a person on at least one module.

## Scoring one handoff

For every item, one of:

| Score | Fact | Conclusion | Discipline |
| --- | --- | --- | --- |
| Right | Stated with the expected value, unit, period and document | Meets what the item's "Expected" requires | Handled as the item requires |
| Wrong | Stated with a different value, or as the item's "Scored wrong if" describes | Takes a position the item rules out | Does what the item rules out |
| Absent | Not stated | Not addressed | Not applicable in this handoff, or not addressed |

- Right needs the reader to quote the handoff passage. Wrong needs the passage and what differs.
- A value given to a different precision than the source is Wrong unless the handoff says it is
  rounded and the rounding is correct.
- "Not supplied" is Right only where the item expects it; a zero in place of a missing input is
  Wrong.
- The reader also notes, outside the score, any statement that contradicts the sources and is not
  covered by an item, with the passage. These are counted per handoff as "other errors".

## What is compared

Per module and group: items Right, Wrong and Absent out of the list's total, by kind; other
errors; and from `trial-summary.json`, writes used, check issues on the first write, calls, input
and output tokens, cost and elapsed time.

One run per group, as in the pilot, shows whether the procedure works and what one observation
looks like. It does not show a difference between groups: that needs the repeats of the full
trial, and group A's own spread first.

## Version 2 (full trial of CP-4, 2026-11-25)

- Lists: `v2/<module>.md`, the first lists with every bundled item split into one item a value.
  The pilot was scored on version 1 with a rule for bundled items that produced most of its
  Absent scores; that rule is gone, and pilot scores are not comparable with version 2 scores.
- Each handoff is scored by two readers independently. Each reader is given a random mix of
  the coded handoffs. Where the two disagree on an item, both scores are kept and the item is
  counted as disagreed; nothing is averaged or settled by a third reading.
- Ruling and command: `docs/rulings/2026-11-25-instruction-length-trial-cp4.md`; as the pilot's
  command with `--max-turns 64 --cap 15 --trial-cap 101` and run folders `CP-4-<group>-<n>`.

