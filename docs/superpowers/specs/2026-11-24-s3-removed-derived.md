# S3 removed derived figures

Figures the leads no longer print because the module did not write them (ruling i, 2026-11-24). Each is a candidate for the module to write in its own handoff (methodology plan).


## CP-1B

Removed from `earningsDelta.tsx` / `earningsDeltaData.ts`. Each is something the module could write.

- Title "<measure> moved most: up/down N" and "Largest moves are tied at N (derived)": a ranking by computed |current - prior|. The module should state which movers matter, in its own order and words.
- The "ranked movers, largest change first" order and the cap of ten: the page now lists every pair in the handoff's own order.
- KPI title "<measure> up 0.5 percentage points; ... ; N more" and its "(derived)" suffix: computed readings in a title.
- Bridge title "From <opening> N to <closing> N, in K steps": the step count and the opening-to-closing reading.
- Bridge running total per step (aria-label "running total N" and the table-view column "Running total (derived)"): the module should write a running total column if the reader needs it.
- The "+22, derived" tag for a change the handoff writes as "22 reported": now printed as stated ("+22 reported"), never derived.
- A computed change for a pair whose two periods are different kinds (FY2024 to LTM Dec-2024): not made (one basis only).
- A computed change next to a stated YoY column when the table states more than two annual periods (the stated column cannot be tied to one pair): the exact prior to current difference of the latest two is shown, marked derived.

Kept, as the one allowed computed figure: the exact prior to current change of one stated measure on one basis and unit, only where the handoff states no change of its own (chart tables carry no change column), labelled "derived" in the row, the table view and the aria-label.

## CP-1C / CP-1D / CP-L10 / CP-MODEL

Removed under ruling (i) (delivery adds no analysis). Each is something the module should write if the
page is to show it; none is a number or sentence the handoff states today.

| Lead | Removed | What the module would have to write |
|---|---|---|
| CP-1C | "Issuer is above / below / at the peer median", its aria-label clause and its table column | A stated position of the issuer against the peer median (a sentence or a Position column in the range tables). |
| CP-1D | "Add-backs total X" (exact sum of the steps) | A stated add-back total in the bridge or the share table (T1D.3 "Proposed add-backs"). |
| CP-1D | "Supported Y / Partly supported / Not supported Z" exact sums by the stated support word | A stated amount per support class (T1D.3 "Accepted add-backs" and "Add-backs not accepted" cover two of them). |
| CP-1D | "+1.3x derived" and "Restated is higher by 1.3x, worse" between leverage on the statements and on supported earnings | A stated difference or direction between the two bases in T1D.6 or T1D.4. |
| CP-1D | The wording "add-backs" for every middle step of the bridge, including a negative one | A step type column (add-back, deduction) in the bridge. The page now says "step". |
| CP-L10 | "up 1,355 (derived)" / "down 4 (derived)" words and the derived label | Kept: the signed exact change of ONE measure between two stated periods on one unit (ruling i allows it), now shown as "+0.5x" or "-4" with no "up/down" word and no "derived" label; "worse"/"better" only where `signal.ts` knows the measure. |
| CP-L10 | The note "Changes are the exact difference of the two stated figures." | None: the signed change is the only computed figure. |
| CP-MODEL | "Base case peaks at X in FY…" title, "peak X" and "high X" labels on the chart, the note "the highest stated value is …" | A stated peak or maximum per case in the model's own text (the page now singles out no value). |
| CP-MODEL | The hatched full-height "no figure" column across all cases | Nothing: replaced by a hatched slot on the lacking case's own line. |

## CP-1 data layer (`foundation/foundationData.ts`, `kit/tables.ts`, `kit/numbers.ts`)

### For the methodology plan: the module should write it

Removed from the data layer's outputs under ruling (i); each is a figure the module would have to state in its handoff for a page to show it.

| Removed | Was computed from (handoff table) | What the module would write |
|---|---|---|
| Growth % per measure (net sales, reported EBITDA, EBITDA As Defined, gross debt), and the growth axis it fed | `Chart data: revenue and EBITDA` (Revenue, Adjusted EBITDA), `T4.4 Income statement` (EBITDA (Reported)), `Net debt data` (Gross debt) | A growth or change column per measure, on its stated basis. |
| `percentOf` itself (kit): no ratio or share is computed anywhere in the kit | — | — |
| The "Other items, not itemised here" plug (EBITDA As Defined less cash interest, cash taxes and cash from operations) | `T4.4 Income statement` (EBITDA (Adjusted)), `T4.5 Cash flow statement` (Cash Interest Paid, Cash taxes paid, Net Cash from Operating Activities) | A stated EBITDA-to-operating-cash bridge row (working capital and other items), as the issuer's management bridge does. |
| The "Acquisitions and distributions" outflow sum | `T4.5 Cash flow statement` (Acquisition of businesses, net of cash acquired; Dividends and dividend equivalent payments) | Nothing: the two outflows are drawn as stated steps. |
| The invented end level "Free cash flow after acquisitions and distributions" (−2,505 / 436) | `T4.5 Cash flow statement` (Levered free cash flow less the sum above) | A stated after-acquisitions cash measure, if the reader needs one; the ladder now ends at the module's own "Discretionary cash flow after distributions" level and the stated acquisitions outflow. |
| The bridge's `addBacks` total (+360) | `Chart data: EBITDA bridge` (the change rows) | A stated total of the adjustments. The exact reconciliation check stays internal (it decides whether the bridge is drawn); its sum is never returned. |
| Segment `salesTotal` and `ebitdaTotal`, and the segment-to-group reconciliation built on them | `Segment schedule` (Net sales, EBITDA As Defined), `Chart data: revenue and EBITDA` | A stated segment total and a stated reconciliation to the group (the handoff's corporate and eliminations rows). |
| Segment group figures (`groupSales`, `groupEbitda`) dropped from the segment view | `Chart data: revenue and EBITDA` | None: the group figures stay in the earnings figure; they were only in the segment view to feed the sums. |
| The choice of "the largest adjustment" as the pro forma bar (a ranking by computed absolute amount) | `Post-balance-sheet adjustments` (Amount) | Which adjustment is the headline pro forma, if one is. The data layer now lists every row in handoff order. |
| A liquidity sum (cash plus undrawn facilities) | `Chart data: liquidity` (Cash, Undrawn committed facilities) | Already written where it exists: `Financials and credit metrics` "Cash plus available revolver" is read as stated (`liquidityTotal`); with no such row, no total. |

Kept, as the one allowed computed figure: `change`, the exact difference of one stated measure between the two comparison periods (the latest two of one kind, annual first), on one unit, only when both cells are stated numbers; leverage tone from `signal.ts`. Never computed across measures (debt against EBITDA) or across kinds of period (FY against LTM).

### CP-1B, round 3

- The word "derived" is gone from the page, the aria-labels and the table view (the "Change is" column is removed).
- A computed change is made only by the kit's `changeBetween`: the same kind of period exactly one year apart, on one unit. "FY2022 to FY2024 +3.02 percentage points", FY2024 to LTM, and Q1 to FY changes are no longer printed; each figure is drawn with its period and no change, and no better or worse word.
- The "stated change disagreed in direction" correction is removed: a stated change cell is printed as written.
- The method notes "Pairs that state words instead of a figure are in the table view only." and "A pair whose two periods are different kinds of period has no change figure..." are removed.
