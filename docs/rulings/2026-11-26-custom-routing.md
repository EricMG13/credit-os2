# Custom routing with whole modules; cap of the sum of estimates plus one hold, at most USD 50

by: user
date: 2026-11-26

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line; paid execution still needs its own explicit action. No custom run has been made, and the build
made no provider call.

Owner's words, 2026-11-26:

- "Yes, whole modules first": custom routing ships with whole modules; choosing alias phases inside
  a module is a later PR (spec `docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md`
  section 8).
- "Approve the cap", on the question "Approve the custom-run cap: measured spend plus one hold, at
  most USD 50?", asked after the risk was stated: about USD 1 of room above a two-run, one-issuer
  mean.
- "Use Opus meanwhile": while Fable is rate-limited (until 2026-12-02 07:00 Europe/London), the plan
  critique and the pre-merge review ran on Opus.

## The cap

- A custom run's cap = min(USD 50, the sum of its modules' estimates plus one call's hold, rounded
  up to the whole dollar). It launches at that cap, never at the table's 50; `custom` enters
  `PATHWAY_CAP_USD` and `RULED_CAPS_USD` at 50, the ceiling.
- Each module's estimate is the figure of "Estimated spend against the caps" in
  `2026-11-25-layer-1-in-all-assessment-pathways.md` (GPT Sol, medium or high as the module is
  sent), held as data in `contracts.MODULE_ESTIMATE_USD`. A module that ruling does not list takes
  its mean measured analyst module (0.51 medium, 0.67 high), marked not measured. CP-5 is scaled by
  the handoffs it reads (figure × n / 10), and CP-8, planned when an earlier run is listed, by
  n / 12.
- The hold is the launcher's own figure for the run's configuration: USD 7.17 on Copilot GPT Sol,
  with no web-search fee, since Copilot runs never search the web.
- Worked by hand (tests): Governance and ESG at fast effort, 0.29 + 0.42 + 0.55 + 0.66 = 1.92, plus
  7.17, gives USD 10; Covenant Capacity USD 9; Portfolio Fit USD 13 to 15 by effort.
## Coordinator's rulings (cost if wrong in brackets)

- Custom runs are offered on the GPT model only, since the figures are GPT Sol's (code comments
  cite the owner's cap ruling for this; the GPT-only rule itself is the coordinator's). [Other
  models stay unavailable for custom runs until they have figures.]

- One run type, `custom`, shown as "Custom selection". The analyst picks whole modules; the registry's
  dependencies complete the selection, each added module shown with its reason; CP-0 and CP-1 are in
  every custom run. CP-8, CP-L10, CP-MEMO and CP-OS cannot be chosen; CP-MODEL is not a module.
  [A selection rule to change.]
- The report uses the Deep assessment's block list; blocks whose module did not run are left out. A
  module that owns no block reads "No report section of its own". The Overview and Changes lead is
  CP-2 if it ran, else the last analytical module in planned order. [Lead and label text.]
- The summary, asked before a cap exists, shows the ceiling; the submit carries the computed cap.
- CP-8 compares a custom run only with an earlier custom run of the same issuer and the same
  completed modules, less CP-8 and CP-MODEL. A preset run is never its base, nor the reverse.
  [CP-8's base choice.]
- Advanced presets are starting selections of whole modules: Governance and ESG (CP-1A, CP-2E),
  Covenant Capacity (CP-4), Portfolio Fit (CP-6, with the portfolio workbook as in a preset). The
  owner approved the names; the contents are the coordinator's. [Three stored selections.]
- Every preset pathway's requests, caps and checks are unchanged (checked byte for byte against
  `main`).

## Left for later

- Choosing phases inside a module (CP-1E, CP-4B, CP-4D), and restoring a register cut for a phase
  the analyst ticks (`2026-11-13-appendix-and-routing-scope.md`): PR 7b.
- Found by PR 7a's reviews and predating it, for the owner: `--high-modules` writes the manifest
  before refusing; a non-numeric cap from a direct caller raises `InvalidOperation`;
  `cpos_reader_run` `prepare(cap="50")` refuses a custom context.

Not verified: any real custom run; whether a run completes within its cap; the 50 ceiling binding on
a real selection; a rendered browser page.
