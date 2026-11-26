# Deliverables page, Credit Snapshot workbook and proposed portfolio recommendations

by: user
date: 2026-11-25

This is a decision record. It does not lift the paid-run pause and carries no `lifts:` or `configs:`
line; paid execution still needs its own explicit action. No provider was called in making it, and
nothing it describes is built yet: this record, the `AGENTS.md` amendments and
`docs/methodology/portfolio-recommendation.md` are documentation only (PR 0 of the plan).

Source: `docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md`, with its mock-up
`docs/superpowers/specs/2026-11-25-credit-snapshot-mockup.html`. The owner approved that spec on
2026-11-25: "Approve, start". The rulings below are the spec's section 1 as the owner approved it.
The owner's own words are quoted in three places only: "Approve, start" above, "look like an app
but Excel canvas" in R2, and the three quotations in the next section. Every other quoted string
in this record is a label or a phrase of the spec, and the rest is the spec's record of the ruling.

## Rulings (spec section 1)

| # | Ruling |
| --- | --- |
| R1 | The Export PDF button is replaced by a Deliverables page inside an issuer's report. It lists files to download and does not display their contents (as Evidence does for handoffs). |
| R2 | First deliverable: Credit Snapshot, a one-page credit summary for portfolio managers, as an XLSX file. Same information as the owner's reference screenshots; layout and design are new ("look like an app but Excel canvas"). Investment Thesis is left blank for the analyst. |
| R3 | The five purpose reports move into Deliverables as tiles that open the browser print dialog. The Credit Snapshot PDF is dropped in favour of the workbook. |
| R4 | Bloomberg-fed cells keep Bloomberg formulas and yellow FIGI input cells in the XLSX. Where the run supplies the value, the cell holds the value instead. |
| R5 | The app proposes recommendations; the analyst confirms, in the workbook. |
| R6 | Credit Score and Valuation combine through an owner-approved 5×5 table (below). |
| R7 | Valuation is computed when prices are supplied, otherwise blank for the analyst. |
| R8 | Portfolios differ by instrument, reference and limits; a limit breach caps that portfolio's recommendation at 3 (MW). |
| R9 | CP-2 writes a scorecard table using the owner's Risk Rubric: 17 factors (Probability of default dropped), each scored 1 to 5 with a one-line basis. Code averages them. |
| R9a | Structuring EBITDA is reported EBITDA plus all add-backs. House EBITDA is Structuring EBITDA less unrealised add-backs. |
| R9b | The loan and bond relative value sections appear only when the issuer has loans, bonds or both. FIGI / Bloomberg IDs are extracted from the RV book and drive the other fields. |
| R10 | App styling, no third-party logo, neutral labels ("House EBITDA", "House multiple"). |
| R11 | Reference portfolios: the app fetches the SSGA daily holdings files or the analyst provides files. Analysis is not limited to the three named portfolios; a different portfolio can be supplied at the launcher. |
| R12 | New pathway Credit Screening: CP-0, CP-1, CP-L10 run with its original five screens (L10, L20, L23, L30, L40), plus CP-DR. |
| R13 | Custom routing: the analyst picks modules from the full list within handoff rules, and for a module with aliases chooses the full module or an alias phase, each with an explanation. Specialised presets are also built but appear only under Advanced. |

## Three further rulings (2026-11-25)

In each, only the quoted words are the owner's; the rest is the spec's account.

- Forecast cells in the workbook's Model sheet are values, matching the app's model exactly:
  "Values". Historic cells are values copied exactly (spec section 7).
- Whether an add-back is realised or unrealised comes from CP-1D: "add back are covered in cp-1d".
  The amounts come from CP-1's EBITDA bridge (T4.17); the split comes from CP-1D's add-back
  register (T1D.1) and achievability table (T1D.2), joined on Add-Back ID. An add-back CP-1D marks
  Insufficient Information is shown unclassified, not assumed realised (spec section 2).
- An alias phase chosen in custom routing reads its parent module's core results from the same run
  only; no handoff of an earlier run is reused: "Same run only" (spec section 8).

## Approved with the spec

These were the coordinating session's proposals. The owner approved them as written when approving
the spec; they are not the owner's own words. The spec had listed the table, the bands, the two
caps and the presets as open items for the owner (its section 6).

- The 5×5 table (spec 4.3). Rows are the Credit Score, columns the Valuation, cells the
  recommendation (1 Strong OW, 2 Modest OW, 3 MW, 4 Modest UW, 5 Strong UW). Its rule: the average
  of the two scores, a half rounded toward the weaker score; a 5 on either axis can be no better
  than 3.

  | Credit ↓ / Valuation → | 1 | 2 | 3 | 4 | 5 |
  | --- | ---: | ---: | ---: | ---: | ---: |
  | 1 Strong | 1 | 2 | 2 | 3 | 3 |
  | 2 Good | 2 | 2 | 3 | 3 | 4 |
  | 3 Fair | 2 | 3 | 3 | 4 | 4 |
  | 4 Weak | 3 | 3 | 4 | 4 | 5 |
  | 5 Stressed | 3 | 4 | 4 | 5 | 5 |

- The valuation bands (spec 4.4). Per instrument, against the same-rating bucket of that
  portfolio's reference: loans by discount margin (CLO book, loan index holdings), bonds by
  spread (HY index holdings). Difference from the bucket
  median: ≥ +100 bp → 1; +40 to +100 → 2; within ±40 → 3; −40 to −100 → 4; ≤ −100 → 5. A
  portfolio's Valuation is that of its best eligible instrument. No price, or no bucket of at
  least five names, leaves Valuation blank for the analyst.
- No Credit Score when fewer than 12 of the 17 factors are scored (spec 4.2). The same section's
  roll-up was approved with it: equal-weight mean of the scored factors, a half rounded toward the
  weaker score, and a result no better than 4 when Liquidity or Maturity profile is scored 5. A
  factor with no evidence is left unscored and listed as a gap.
- Credit Screening cap: USD 10 per run.
- Advanced presets: Governance and ESG; Covenant Capacity; Portfolio Fit.
- Custom routing cap: the sum of the chosen modules' estimates, with a ceiling of USD 50 per run.
- The Model sheet's layout (spec section 7) and the full-module or alias-phase choice of custom
  routing (spec section 8), both headed "proposal" in the spec. Section 8 carries two changes to
  existing rules, listed under Amends.

The methodology an analyst can audit, with the rubric's level text, is
`docs/methodology/portfolio-recommendation.md`.

## Owner's answers on the open items (2026-11-25)

Owner's words: "1. later 2. is fine 3. fix 4. fine 5. fine 6. update it". The numbering and the
description of each item are the coordinating session's.

1. A Claude Opus Full run is estimated above Full's USD 30 cap
   (`2026-11-25-layer-1-in-all-assessment-pathways.md`): "later". Open and deferred; nothing
   changes.
2. The Coverage page at seventeen columns (same ruling): "is fine". Accepted as built.
3. The two rubric gaps: "fix". Leverage level 4 now reads "High leverage (5–6x), limited covenant
   cushion"; Market share level 2 "Top 3 competitor, or 10–30% share" and level 3 "Mid-tier, 5–10%
   share". The wording is the coordinating session's, not the owner's. Changed identically in the
   spec's section 9 and the methodology's section 3.
4. An add-back CP-1D marks Insufficient Information is shown unclassified, not assumed realised:
   "fine". Accepted.
5. The methodology's four readings (the four items outside the 17 do not enter the Credit Score; no
   Credit Score means no proposed recommendation; wider than the bucket median is more attractive;
   a limit breach leaves a 4 or 5 unchanged): "fine". Confirmed.
6. `PRODUCT.md`: "update it". Its Excel line now matches `AGENTS.md`.

## Four rulings before PR 2 (2026-11-25)

The owner chose each from options the PR 2 coordinating session put; the wording is that
session's. They close three items of "Left open" below (the band edge, the per-instrument rule,
and, with the coordinator's ruling that follows, the exception's wording).

1. Band edge: a difference of exactly +40 bp or −40 bp from the bucket median is a 3.
2. Per-instrument proposal: the 5×5 table on the issuer's Credit Score and that instrument's own
   Valuation against the index for its type (loan index for a loan, high-yield index for a bond);
   no limit cap; blank with no Valuation.
3. Eligibility: by asset type alone. Loans for the CLO and loan index, bonds for the high-yield
   index; a custom portfolio takes its declared asset type, or both when none is declared.
4. Limit breach: a limit that applies to the issuer (its sector, its rating bucket, CCC if it is
   rated CCC) is breached when the file shows zero or negative headroom or a breached status; the
   price floor when the instrument's price is below it. No position size is assumed.

Coordinator's ruling (not the owner's): the `AGENTS.md` exception is read to cover the Valuation
score and the limit caps, which are ruled arithmetic of the approved spec (4.4, 4.5) on supplied
prices and reference files; its wording is left as it is.

## Two rulings after PR 2 (2026-11-25)

The owner approved both ("approved") as the PR 2 coordinating session put them; the wording is
that session's. They amend the methodology's sections 1, 5 and 7, which change with the code.

1. More than one eligible instrument. A portfolio's recommendation is the best result across every
   eligible instrument: for each, the 5×5 table on the Credit Score and that instrument's
   Valuation, held to 3 if that instrument breaches a limit. The reading names the instrument it
   rests on and shows that instrument's Valuation. This replaces "a portfolio's Valuation is that
   of its best eligible instrument" (spec 4.4), under which a more attractive instrument that
   breached a limit could lower the recommendation, and the result could turn on the order the
   instruments were listed in.
2. An Unrated instrument against a rating limit worded for a bucket "and below" (or lower, or
   worse) that does not name Unrated: the limit is "not read", so the analyst sees it. It is not
   treated as below CCC and not as "does not apply". A limit worded "and above" is unchanged.

Coordinator's ruling (not the owner's), the tie key when two instruments give the same result:
one that is not capped before one that is; then the better (lower) Valuation; then the
instrument's name in alphabetical order. The order instruments are listed in never decides.

## Credit Screening pathway (PR 6, 2026-11-25 and 2026-11-26)

Owner's words are quoted; the rest is the coordinating session's or the PR's controller's.

- The pathway id is `credit_screening`, shown as "Credit screening": CP-0, CP-1, CP-DR, then CP-L10
  with its five screens, cap USD 10 (R12; coordinator). `short_snapshot` stays deactivated and
  unchanged, with its one-page method.
- Both methods of CP-L10 are kept, chosen by pathway: the one-page method everywhere it was, the
  archived five-screen method in `credit_screening` only, with its 20 registers required and
  checked (coordinator; the owner was asked and did not choose, and this option changed nothing
  that existed).
- In a Credit Screening run the module reads "Credit screening" (owner: "Credit screening").
- CP-L10 is sent CP-DR's handoff as an optional input in this pathway, so the research is consumed
  (coordinator).
- `web/src/pages/connected/api.test.ts`: "no pathway holds CP-L10" became "exactly
  `credit_screening` holds CP-L10" (owner: "Yes, change it").
- The trimming of every module's method as sent, ruled on `main` ("apply to all modules"), applies
  to the five-screen method too (owner, 2026-11-26: "Yes, trim it"): three sections that cannot
  apply in this transport and eight exact repeats are cut; no register is lost.
- The PR's controller: a credit screening is not an issuer assessment; the pathway is listed last
  on the run start page; the five screens are shown in the Modules lead and not repeated below it.
- Not amended: the cap sentence of `AGENTS.md` (it does not list USD 10), as this record already
  said of the two new caps.

## Amends

- `AGENTS.md`, the Excel bullet: Excel stays an input format for analysis; exactly one generated
  workbook is permitted, the Credit Snapshot deliverable with its Model sheet (R2, R4). No other
  workbook is generated, and the portfolio workbook stays an input.
- `AGENTS.md`, the delivery bullet: "Delivery adds no analysis" stands, with one exception: a
  proposed recommendation derived by ruled arithmetic from module-written scores through the
  approved table, always labelled proposed until the analyst confirms (R5, R6).
- `AGENTS.md`, the reader bullet and the completion bullet: the issuer report gains a Deliverables
  page of download tiles that shows no contents (R1). It joins the completion condition when it
  is built (PR 5), not before. `AGENTS.md` did not name Export PDF, so no wording was dropped.
- The Export PDF control and the Credit Snapshot PDF (built 2026-11-24 and restyled 2026-11-25,
  `VERIFICATION.md`): replaced by the Deliverables page and the workbook (R1, R3) when PR 5 lands.
  The five purpose reports become Deliverables tiles that open the browser print dialog.
- When custom routing is built (PR 7, spec section 8), and not before:
  `2026-11-13-appendix-and-routing-scope.md` is amended so that a register it cut is restored for
  a phase the analyst ticks; and the CP-8 bullet of `AGENTS.md` is refined so that a custom run is
  compared only with an earlier custom run of the same module and phase selection. Neither text
  is edited in PR 0.
- Not amended: the cap sentence of `AGENTS.md` and the cap tables of
  `2026-11-15-pathway-tiers-and-caps.md` and `2026-11-25-layer-1-in-all-assessment-pathways.md`
  (Lite USD 20, Full 30, Deep 50). The two caps above are recorded here only. By those rulings a
  cap enters `PATHWAY_CAP_USD` and `RULED_CAPS_USD` by deliberate edits, which belong to the
  pathway PRs (6 and 7).
- `PRODUCT.md`, its Excel line: brought into step with the `AGENTS.md` Excel bullet (owner,
  2026-11-25: "update it").
- Not amended: the deactivation of the short credit snapshot (`short_snapshot`). Credit Screening
  (R12) is a new pathway; how it relates to that id is PR 6's to settle.

## Boundaries that stay

- Module handoff values are copied exactly into the workbook; a missing value is written as an
  explicit gap ("not in handoff"), never as zero (spec section 2).
- The workbook is written from the run's existing handoffs, model outputs and calculation JSON; no
  second analytical execution (spec section 7).
- Source references stay off the Snapshot sheet and live on the workbook's Sources sheet, per
  `2026-11-11-reader-and-issuer-report.md`.
- Reader-facing text shows no module ids (spec section 8: "Reader words, no module IDs").
- A paid proof run of CP-2's scorecard is a separate owner action (spec section 5).

## Left open

- Nothing here is built. The plan is one PR each (spec section 5): 1 scorecard, 2 recommendation
  code, 3 reference portfolios, 4 and 4b workbook and Model sheet, 5 Deliverables page, 6 Credit
  Screening, 7 custom routing.
- The valuation bands do not say which band a difference of exactly +40 bp or −40 bp falls in
  ("within ±40" against "+40 to +100"). PR 2 needs this settled before it codes the bands.
- The spec names only the ends of the Valuation scale (1 Very attractive, 5 Very unattractive).
- The `AGENTS.md` exception names a recommendation derived "from module-written scores". The
  Valuation score and the limit caps are not module-written: code computes them from supplied
  prices and reference files (spec 4.4, 4.5). Whether the exception's wording should name them is
  for the owner or coordinator before PR 2.
- The spec has a proposed recommendation per instrument as well as per portfolio (section 2) and
  gives no rule for the per-instrument one.
- How this five-point recommendation sits beside the related ones is not stated in the spec:
  CP-3's 1–5 issuer scorecard and CP-6's Overweight / Neutral / Underweight, which modules write,
  and the CP-2 method's T2.7 financial profile scorecard, which CP-2 does not write in this
  transport (`docs/reuse/selected-methods/CPOS_REGISTER_SCOPE.md`).
- Whether the app records the analyst's confirmation; the spec says only "in the workbook" (R5).
- Not verified (spec section 6): the SSGA holdings files' columns; whether the app's host can reach
  ssga.com; the cost of the longer CP-2 instruction; that Excel renders the conditional formats
  identically on Windows and Mac.
