# Layer 1 modules in the Lite, Full and Deep credit assessments; caps of USD 20, 30 and 50

by: user
date: 2026-11-25

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line; paid execution still needs its own explicit action. No run has been made with this change, and
the build made no provider call.

Owner's words, 2026-11-25, three rulings:

- "all credit assessment pathways (lite, full and deep) should include all layer 1 modules".
- "lite runs cp-dr too, user only provides comps if they want to at launcher."
- "raise cap to 20/30/50". Asked in the building session to confirm, the owner answered: "Yes, raise
  to 20/30/50".

Provenance: the second and third quotes were relayed to the build by the coordinating session; the
confirmation of the cap raise was given by the owner directly in that session. The reading that
"20/30/50" is Lite, Full and Deep, and that the five purpose pathways and the deactivated short
snapshot keep USD 20, is the coordinating session's, not the owner's words.

The second and third rulings replace two coordinator's rulings made earlier the same day for this
build (Lite without CP-DR, with CP-1C on the analyst's comparables only; caps left at 15, 25 and
40). Neither was built into a run and neither stands.

## What layer 1 is

The modules whose selected method is marked layer L1 in `docs/reuse/selected-methods/skills/`:

| Module | Marked in |
| --- | --- |
| CP-1, financial foundation | `cp-1-canonical-data-foundation/references/CP-1_SYSTEM_REFERENCE.md`, line 10 (`layer`, `L1`) |
| CP-1A, business and transaction fact pack | `cp-1a-business-transaction-fact-pack/SKILL.md`, line 284 (`Layer L1`) |
| CP-1B, earnings changes | `cp-1b-earnings-delta/SKILL.md`, line 194 (`Layer L1`) |
| CP-1C, peer benchmark | `cp-1c-peer-benchmark/SKILL.md`, line 177 (`Layer L1`) |
| CP-1D, earnings quality | `cp-1d-earnings-quality/SKILL.md`, line 147 (`Layer L1`) |

Layer 1 as ruled on here is CP-1, CP-1A, CP-1B, CP-1C and CP-1D. CP-1 and CP-1A were in all three
presets already.

- CP-L10 is marked `Layer L1` too (`cp-l10-financial-change-screen/SKILL.md`, line 230). It is the
  deactivated short credit snapshot's module (`2026-11-13-full-and-lite-credit-assessments.md`) and
  is excluded: it stays wired and off.
- The cash flow model (CP-MODEL) is not a module. It makes no model call, and is never offered or
  counted as one.
- CP-DR is not a layer 1 module. Lite gains it by the owner's second ruling, not by the first.

## Amends

- `2026-11-13-full-and-lite-credit-assessments.md`: Lite's preset (CP-0, CP-1, CP-1A, CP-2, CP-2A)
  and its nine report blocks; the statement that Full's modules and report blocks are unchanged;
  and, for CP-DR, the controller ruling there that Lite has neither CP-DR nor CP-2E (Lite now has
  CP-DR and still has no CP-2E).
- `2026-11-15-pathway-tiers-and-caps.md`: the owner's "Lite/Full as now" for the module lists; the
  "Decisions" bullet that neither Lite's nor Full's module list or section list changed; Deep's
  description as "Full plus CP-1B, CP-1C, CP-1D, CP-2H, CP-3D and CP-4C"; the Lite, Full and Deep
  rows of its Caps table (15, 25, 40); the owner's 2026-11-15 answer "Leave caps; measure first
  (Recommended)"; and "Estimated spend against the caps", replaced by the table below.
- `AGENTS.md`: the cap sentence now reads Lite USD 20, Full 30, Deep 50, the five purpose pathways
  20 (edited by the controller of this build).
- Not amended: the three pathway ids and titles; Deep's modules, order and sections; the USD 20 of
  the five purpose pathways and the deactivated short snapshot; the deactivation itself; the
  standing Submit ruling (`2026-11-11-run-start-submit.md`); and every cap rule of the 2026-11-15
  ruling other than the three figures (see Caps). No older record is edited.

## Decisions

- Lite, `lite_credit_assessment`: CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-1C, CP-1D, CP-2, CP-2A. Nine
  entries, nine model calls without CP-8 (five before). Still no CP-MODEL, so no forecast, and no
  CP-2E.
- Full, `credit_snapshot`: CP-0, CP-1, CP-MODEL, CP-1A, CP-1B, CP-DR, CP-1C, CP-1D, CP-2, CP-2A,
  CP-2D, CP-2E, CP-2G, CP-4, CP-3C, CP-3, CP-5, CP-6. Eighteen entries with CP-MODEL, seventeen model
  calls without CP-8 (fourteen before).
- Deep, `deep_credit_assessment`: unchanged, 21 entries with CP-MODEL and 20 model calls without
  CP-8. It already ran all five. What Deep adds beyond Full is now CP-2H, CP-3D and CP-4C.
- Order is the registry's plan (`deploy_vii.registry.plan`), not an appended list. Lite: CP-0, CP-1,
  CP-1A, CP-1B, CP-DR, CP-1C, CP-1D, CP-2, CP-2A. Full: CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-1C,
  CP-1D, CP-2, CP-4, CP-2A, CP-2E, CP-2D, CP-2G, CP-3C, CP-3, CP-5, CP-6. CP-8 is last in each when
  an earlier run of the same issuer and pathway is listed. CP-1D follows CP-1B, CP-1C follows
  CP-DR, and CP-2 follows all of them, so CP-2 is sent their handoffs. In Full, CP-3 is sent CP-1C's
  handoff, as in Deep.
- Peers: CP-DR runs in all three pathways. CP-1C receives CP-DR's peer pack only when the peer
  source is CP-DR's public peers, the launcher's default (`valuation.peer_source` is
  `cp_dr_public`). With the analyst's own peer list or comparables, or with no peers, CP-DR still
  runs and is paid for, but no peer pack is requested from it: CP-1C works from what the analyst
  gave, or states that it has no peer set. The analyst's comparables are optional in every pathway
  and never required; the analyst gives them at the launcher only if they want to.
- Report sections: Lite and Full each gain three lead sections, as Deep has them: headline results
  (CP-1B), earnings quality (CP-1D) and peer positioning (CP-1C), each owned and placed as in Deep,
  after credit metrics. Lite's nine sections become twelve and Full's twelve become fifteen. CP-DR
  keeps no section in Lite, as in Full and Deep. This is a presentation choice made in this build,
  not by the owner.
- Coverage page: its fixed columns follow Full's preset less CP-MODEL, so it gains three columns
  (CP-1B, CP-1C and CP-1D; seventeen, fourteen before). A Full run made before this change shows
  those three cells as not in the pathway. This is a presentation effect of this build, a
  consequence of the columns following Full's preset, not an owner choice.
- CP-8 compares a run only with an earlier run of the same pathway, as before. The first Lite or
  Full run of an issuer after this change, compared with an earlier Lite or Full run of it, shows
  the added modules as new (CP-1B, CP-1C and CP-1D; in Lite also CP-DR), with the cause Method
  change. That is true and is not an error. An earlier preset run stays a comparison base.

## Caps

USD per run folder, in `PATHWAY_CAP_USD` (`src/deploy_vii/contracts.py`) and, a second time, in
`RULED_CAPS_USD` (`inbox/startup.py`). Both tables change with this ruling.

| Pathway | Cap before, USD | Cap now, USD |
| --- | ---: | ---: |
| Lite credit assessment (`lite_credit_assessment`) | 15 | 20 |
| Full credit assessment (`credit_snapshot`) | 25 | 30 |
| Deep credit assessment (`deep_credit_assessment`) | 40 | 50 |
| Earnings Update, Relative Value, Covenant & Refinancing, Distressed & Restructuring, Portfolio Decision | 20 | 20 |
| Short credit snapshot (deactivated) | 20 | 20 |

The standing rules of `2026-11-15-pathway-tiers-and-caps.md` are kept; only the three figures move.

- The launcher refuses a `--cap` above the cap of the context's pathway, whoever asks; a lower cap
  is allowed.
- A folder's cap never rises. A run folder started at USD 15, 25 or 40 resumes only at that cap; the
  launcher refuses the pathway's new default with the folder's cap named.
- A summary records the cap it showed. A summary issued at an old cap is refused at Submit ("review
  the summary again"); the analyst makes a new one, which shows the new cap.
- The page sends the cap it displays (`X-Shown-Cap`); a tab opened before this change shows the old
  figure and is refused ("this page is out of date ... Reload the page").
- The service refuses to start when a table entry is above its ruled figure, so the two tables
  move together.

## What each added module can be missing

Each added module gets its required producers (CP-0 and CP-1) within the run; none needs a
prior-period handoff. What can be missing is the sources, and then the module runs, pays its first
prompt and says so under its own method gate. Nothing is skipped.

- CP-1B reads CP-1's periods; it compares periods found in the filings (year on year, sequential),
  not an earlier run. With one period in the files it reports the comparisons as not comparable.
- CP-1D needs the management EBITDA bridge; without it every bridge cell is not applicable and the
  module comes back restricted.
- CP-1C needs peers: CP-DR's public peers (all three pathways have CP-DR) or the analyst's
  comparables. When CP-DR finds none and the analyst gave none, its handoff states that.
- CP-DR in Lite is as in Full: where its web lookup returns nothing it states the open questions.

## Estimated spend against the caps

An estimate, not a measurement. No Lite run has ever been made, and no Full run with these modules.
It uses the basis of `2026-11-15-pathway-tiers-and-caps.md`, on GPT Sol, USD:

- Measured, per module, in the two retained 13 November Full runs on gpt-6.1-sol
  (`runs/tdg-copilot-sol-medium-vs-high.md`), medium / high: CP-0 0.29 / 0.43, CP-1 0.42 / 0.63,
  CP-1A 0.55 / 0.66, CP-DR 0.28 / 0.44, CP-4 0.37 / 0.37, CP-2 0.44 / 0.61, CP-2A 0.62 / 0.80,
  CP-2E 0.66 / 0.80, CP-2G 0.41 / 0.77, CP-3 0.80 / 0.97, CP-5 2.26 / 2.80, CP-6 0.73 / 0.99,
  CP-8 0.79 / 1.08. CP-DR's figure was measured with web search off.
- CP-1B, CP-1C and CP-1D, from the 10 November all-module run at medium, on older and shorter
  method texts (`runs/tdg-mixed-effort-comparison.md`, column "Medium A"): 0.52, 0.35 and 0.53,
  together 1.40. At high: CP-1B and CP-1C at 1.32 times (0.69 and 0.46); CP-1D at 0.94, the one
  high-effort CP-1D draft measured (12 November, not accepted). Together 2.09.
- CP-2D and CP-3C, in Full since 2026-11-15 and not yet run on current texts: 0.51 each at medium,
  the mean measured analyst module; 0.67 at high.
- CP-5 scaled by the analyst handoffs it reads, ten in the measured runs: Full had 12 (2.26 x 1.2 =
  2.71) and now has 15 (2.26 x 1.5 = 3.39; high 2.80 x 1.5 = 4.20). Lite has no CP-5.
- CP-8 scaled by the handoffs it reads, twelve in the measured runs, at medium: Lite 0.79 x 9 / 12 =
  0.59 (was 0.33); Full 0.79 x 17 / 12 = 1.12 (was 0.92).
- Balanced is high effort on the effort map's modules in the run (`BALANCED_HIGH_MODULES`): CP-1A,
  CP-1D, CP-2 and CP-2A in Lite; those and CP-3, CP-3C, CP-4 and CP-6 in Full. CP-DR is at medium.
- One GPT Sol call holds USD 5.73 whatever its size (5.89 for CP-DR with web search), so a run in
  order needs its spend plus the hold of its last call: 5.73, CP-8's or CP-2A's or CP-6's. CP-DR's
  5.89 is held early in the run, when little is spent.

The same arithmetic gives the 2026-11-15 ruling's Lite and Full rows exactly and its Deep row to
within 0.1.

Lite, nine calls:

- Medium: the five before, 0.29 + 0.42 + 0.55 + 0.44 + 0.62 = 2.32; CP-1B, CP-1C, CP-1D 1.40;
  CP-DR 0.28. Total 4.00.
- Balanced: 4.00 plus the uplifts on CP-1A 0.11, CP-2 0.17, CP-2A 0.18 and CP-1D 0.41 = 4.87.
- High: 0.43 + 0.63 + 0.66 + 0.61 + 0.80 = 3.13, plus 2.09, plus CP-DR 0.44 = 5.66.
- Balanced with CP-8, plus one hold: 4.87 + 0.59 + 5.73 = 11.19.

Full, seventeen calls:

- Medium: the eleven measured modules other than CP-5 and CP-8, 5.57; CP-2D and CP-3C 1.02; the
  three added 1.40; CP-5 3.39. Total 11.38.
- Balanced: 11.38 plus the uplifts on CP-1A 0.11, CP-2 0.17, CP-2A 0.18, CP-3 0.17, CP-3C 0.16,
  CP-4 0.00, CP-6 0.26 and CP-1D 0.41 = 12.84.
- High: the same eleven 7.47; CP-2D and CP-3C 1.34; the three added 2.09; CP-5 4.20. Total 15.10.
- Balanced with CP-8, plus one hold: 12.84 + 1.12 + 5.73 = 19.69.

| Pathway | Cap | Medium | Balanced | High | Balanced with CP-8, plus one hold |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lite, before (five calls, cap 15) | 15 | 2.3 | 2.8 | 3.1 | 8.8 |
| Lite, now | 20 | 4.0 | 4.9 | 5.7 | 11.2 |
| Full, before (fourteen calls, cap 25) | 25 | 9.3 | 10.4 | 12.2 | 17.0 |
| Full, now | 30 | 11.4 | 12.8 | 15.1 | 19.7 |
| Deep, modules unchanged (cap was 40) | 50 | 13.6 | 15.2 | 17.9 | 22.2 |

On GPT Sol, at the page's default and with CP-8 and one hold counted:

- Lite is estimated at USD 11.2 against its USD 20 cap: under by about USD 8.8.
- Full is estimated at USD 19.7 against its USD 30 cap: under by about USD 10.3.
- Deep is estimated at USD 22.2 against its USD 50 cap: under by about USD 27.8.
- At High with CP-8 at high and one hold, Lite is about 12.2, Full about 22.4 and Deep about 25.5:
  under their caps.
- The old ruling's "right to within about a third" still applies. With the spend a third higher
  and the hold counted, Lite is about 13.0, Full about 24.4 and Deep about 27.8: under their caps
  by about 7.0, 5.6 and 22.2.

Not in the estimate:

- What the modules already in each pathway pay to read the added handoffs, each an optional
  input in `src/deploy_vii/methodology.json`. In Full: CP-2 (CP-1B, CP-1C, CP-1D), CP-2A (CP-1B),
  CP-2G (CP-1D), CP-4 (CP-1D), CP-3 (CP-1C, CP-1D) and CP-6 (CP-1B, CP-1C). In Lite: CP-2 (CP-1B,
  CP-1C, CP-1D, CP-DR) and CP-2A (CP-1B). Only CP-5 and CP-8 are scaled, as the old ruling did.
- CP-1B, CP-1C and CP-1D on their current method texts. Their figures are from 10 November, before
  the reader-voice change of 11 November made the instruction files 15% to 112% larger.
- CP-DR with web search on: the measured 0.28 and 0.44 are from runs with it off.
- The size of Full's largest first requests. CP-5 is now sent fifteen handoffs and CP-8 seventeen;
  no run has measured them.
- Repeated attempts beyond those in the measured runs.

On Claude Opus the one measured full run cost 2.26 times the same modules on GPT Sol
(`2026-11-15-pathway-tiers-and-caps.md`), and an Opus call holds about USD 3. At that ratio, with
CP-8, as spend and then with one hold:

| Pathway on Opus | Cap | Medium | Balanced | High |
| --- | ---: | ---: | ---: | ---: |
| Lite, spend / with one hold | 20 | 10.4 / 13.4 | 12.3 / 15.3 | 14.6 / 17.6 |
| Full, spend / with one hold | 30 | 28.2 / 31.2 | 31.5 / 34.5 | 37.6 / 40.6 |
| Deep, spend / with one hold | 50 | 33.7 / 36.7 | 37.4 / 40.4 | 44.7 / 47.7 |

- Lite on Opus fits USD 20 at every effort setting.
- Full on Opus still does not fit USD 30. With CP-8 it is past the cap at every setting once the
  hold is counted, and past it on spend alone at Balanced and High. A first Full run, without CP-8,
  is about 25.7 at medium (28.7 with the hold: fits, with about 1.3 of room), 29.0 at Balanced (32.0:
  does not fit) and 34.1 at High (does not fit). An Opus Full run can stop at its cap before CP-6
  or CP-8.
- Deep on Opus fits USD 50 at medium and Balanced. At High it fits by about USD 2.3, which is
  inside the estimate's error: it may not.

The owner's 2026-11-15 answer "Leave caps; measure first" is replaced by the raise above. The first
Full and Deep runs are still expected on GPT Sol; Opus against Full's cap stays open.

## Instruction size

Head plus method, CP-8 left out, on `tests/test_cpos_launch.py`'s synthetic input, measured at
`main` (`4aaec9d`) and after this change. Lite: 416,093 to 669,952 characters (+253,859: CP-1B
66,907, CP-DR 73,449, CP-1C 68,192, CP-1D 45,311). Full: 1,468,993 to 1,650,316 (+181,323: CP-1B
66,900, CP-1C 68,185, CP-1D 45,304, and 934 on CP-DR for the peer pack). Each ceiling rises by its
pathway's measured increase, as for earlier additions to an existing pathway: Lite 421,292 to
675,151, Full 1,485,996 to 1,667,319. The seven other pathways' instructions are byte-identical
before and after; no other ceiling moved.

## Left open

- A paid run: none made. No model has produced a Lite run of any kind, or a Full run with CP-1B,
  CP-1C and CP-1D. The owner starts it.
- Claude Opus against the Full cap of USD 30, and Deep at High on Opus: for the owner, after a
  measured run.
- The three lead sections in Lite and Full: no real run with them has been read.
