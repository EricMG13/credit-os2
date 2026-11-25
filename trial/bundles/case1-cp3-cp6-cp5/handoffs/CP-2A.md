---
issuer_id: tdg
module_id: CP-2A
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
committee_status: Draft Only
---

## Request

Downside pathway and stress analysis for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is a static, single-period stress of the audited FY2024 base: what breaks first, how the shock transmits, the break points, and the dated events and monitoring triggers that would signal escalation; no rating, security recommendation or covenant headroom is concluded.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Risk factors (aerospace concentration, customer reliance, fixed-price contracts, no recovery of input-cost increases, acquisition and indebtedness risks, variable-rate exposure and 75% fixed-rate target) and market-risk disclosure (USD 30 million annual cost of a one percentage point rate rise; 6.5% weighted rate on floating debt), read directly |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate (partial), absence of debt documents, ratings and prices, dated FY2024 and October 2024 events |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Stress base operands: reported EBITDA, cash interest, free cash flow, debt, cash, pro forma net debt for the 2024-10-18 payment, scheduled next-year interest, maturity ladder, revolver and securitization terms, incurrence and springing test levels |
| Earnings changes (CP-1B) | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | Operating leverage, constructed fourth-quarter deceleration, add-back growth |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Business mix (proprietary and aftermarket shares, channel shares), financial policy, supported EBITDA, prior 2.00x cover stress on scheduled interest, primary downside path |

## Findings

### Bottom line

Leverage breaks first, not liquidity: a 19.69% fall in reported EBITDA takes pro forma net leverage to the 7.50x springing-test level, while free cash flow stays positive until EBITDA falls 38.92% at run-rate interest, so creditor risk turns acute at refinancing.

The base is FY2024 reported EBITDA of USD 3,813 million and pro forma net debt of USD 22,967 million after the 2024-10-18 dividend payment (year-end net debt USD 18,619 million before it). The scheduled interest step-up alone cuts free cash flow to USD 1,513.96 million and cover to 2.50x with no earnings loss. In a 20% EBITDA decline with run-rate interest plus 100 bp, free cash flow is still USD 721.36 million but pro forma net leverage is 7.53x and cover 1.96x. The pathway therefore runs through market access ahead of the FY2028 maturities of USD 6,637 million, not through a payment default.
Basis: Financial foundation (CP-1); calculation B4; calculation B6; calculation D6; calculation D7; calculation D12; calculation D14; calculation D15

### Key findings

- The first break is commercial demand meeting a fixed-cost capital structure, not cost inflation. The annual report says the business is almost entirely aerospace and defense, aftermarket customers have no long-term contracts, and most contracts do not allow recovery of raw-material or labour cost increases. With incremental margins near 57.42% on the way up, a volume loss removes EBITDA faster than sales, and interest does not move down with it.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 17–18; Earnings changes (CP-1B)

- Interest is a stress already locked in, before any operating shock. Scheduled next-year interest of USD 1,524 million is 31.61% above FY2024 cash interest of USD 1,158 million; that alone takes cover to 2.50x and free cash flow to USD 1,513.96 million. A further one percentage point rise in Term SOFR adds only USD 30 million a year because about 77% of gross debt is fixed rate, so rate risk is second-order next to EBITDA risk.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; calculation D1; calculation D4; calculation D6; calculation D7

- Leverage watch levels are the earliest breaks and sit close. On reported EBITDA, pro forma net leverage reaches the 7.25x incurrence level at a 16.92% decline and 7.50x at 19.69%. Cover of scheduled interest falls to 2.00x at a 20.06% decline. These are watch levels on reported EBITDA, not covenant tests, but they place the incurrence brake and refinancing optics within one moderate downturn.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2); calculation B4; calculation B5

- Cash-flow and solvency breaks are far away, which is why near-term default risk is low. Free cash flow reaches zero at a 49.31% decline at FY2024 interest, or 38.92% at run-rate interest plus 100 bp; EBITDA stops covering interest only at 59.24% to 69.63% declines. Even the severe case, a 35% decline, leaves free cash flow of USD 149.41 million before any cut to distributions, acquisitions or capex.
Basis: calculation B1; calculation B2; calculation B6; calculation B7; calculation D18

- Loss severity rises faster than default probability. In the severe case pro forma net leverage is 9.27x and gross leverage 10.04x, with senior secured debt alone at 5.12x FY2024 reported EBITDA; because each debt-funded distribution has added secured debt, recovery deteriorates first for the subordinated notes. The liquidity mitigant is real but finite: pro forma cash liquidity of USD 2,919 million, with revolver usage above USD 364 million triggering the 7.50x test.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2); calculation D19; calculation D20

### Contrary evidence and what would change the view

The strongest evidence against this reading is that the contractual measure is EBITDA As Defined, not reported EBITDA. On that basis pro forma net leverage is 5.50x, so the 7.50x springing level would need a much larger decline than the 19.69% shown here. FY2024 also brought 21.12% reported EBITDA growth, organic and spread across defense, commercial OEM and aftermarket. Add about 77% fixed-rate debt, no maintenance covenants in the term loans or notes, and the board's ability to stop distributions and acquisitions, and the leverage breaks look like optics rather than triggers. That view would win if the agreements define consolidated EBITDA as the issuer reports it, and if quarterly results in FY2025 hold growth near the constructed fourth quarter's 18.03% sales growth while no further special dividend is declared. The cautious view would harden if a quarter shows a year-on-year EBITDA decline, if revolver usage passes USD 364 million, if the securitization is not renewed by 2025-07-11, or if another debt-funded distribution is declared, because each moves leverage toward the watch levels without a downturn.
Basis: Financial foundation (CP-1); Earnings changes (CP-1B); Fundamental credit (CP-2)

### Limitations

- The covenant agreements are not in the documents, so the leverage break points are measured on reported EBITDA. On EBITDA As Defined the 7.50x level would be reached later, so the conclusion that leverage breaks first at a 19.69% decline may overstate how close the contractual trigger is.
- Debt and cash are held at their base balances and no liquidity runway is computed. The conclusion that liquidity is not the first break rests on free cash flow staying positive, not on a month-by-month cash path against the July 2025 securitization maturity.
- No historical downturn size was read from the documents, so the 20% and 35% declines are labelled analyst assumptions. This changes the scenario results but not the break points, which hold for any shock.
- Working capital, capex and tax are held at FY2024 levels with no tax shield. In a real downturn working capital would likely release cash and cash taxes would fall, so the free cash flow break points are conservative and would move to larger declines.

### Downside stress

<!-- table-id: T2DS.4 -->
| Scenario | EBITDA decline (fraction) | Cash-interest increase (fraction) | Stressed EBITDA (USD million) | Cash interest (USD million) | Free cash flow (USD million) | Total debt / EBITDA (x) | Pro forma net debt / EBITDA (x) | EBITDA / cash interest (x) | FCF / total debt | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| S00 control (FY2024 reported) | 0.0000 | 0.0000 | 3813 | 1158 | 1880 | 6.53 | 6.02 (year-end net 4.88 before the 2024-10-18 payment) | 3.29 | 7.56% | Financial foundation (CP-1) |
| S01 scheduled interest step-up | 0.0000 | 0.3161 | 3813 | 1524.0438 | 1513.9562 | 6.53 | 6.02 | 2.5019 | 0.0609 (6.09%) | calculation D1; calculation D5; calculation D6; calculation D7; calculation D8 |
| S02 moderate commercial downturn | 0.2000 (20%) | 0.3420 | 3050.4 | 1554.036 | 721.364 | 8.1563 | 7.5292 (7.53x) | 1.9629 (1.96x) | 0.0290 (2.90%) | calculation D9; calculation D11; calculation D12; calculation D13; calculation D14; calculation D15; calculation D16 |
| S03 severe aerospace disruption | 0.3500 (35%) | 0.3420 | 2478.45 | 1554.036 | 149.414 | 10.0385 (10.04x) | 9.2667 (9.27x) | 1.5948 (1.59x) | 0.0060 (0.60%) | calculation D17; calculation D18; calculation D19; calculation D20; calculation D21; calculation D22 |

### Break points

<!-- table-id: T2DS.6 -->
| Break ID | Break | Interest basis | EBITDA at break (USD million) | EBITDA decline to break (fraction) | Order | Source |
|---|---|---|---|---|---|---|
| B5 | Pro forma net leverage reaches 7.25x (incurrence level, watch only) | Not interest-dependent | 3167.8621 | 0.1692 (16.92%) | 1 | calculation B5 |
| B4 | Pro forma net leverage reaches 7.50x (springing-test level, watch only) | Not interest-dependent | 3062.2667 | 0.1969 (19.69%) | 2 | calculation B4 |
| K8 | Cover of scheduled interest reaches 2.00x | Scheduled USD 1,524 million | 3048 | 0.2006 (20.06%) | 3 | Fundamental credit (CP-2) |
| B6 | Free cash flow reaches zero | Run-rate plus 100 bp, USD 1,554.036 million | 2329.036 | 0.3892 (38.92%) | 4 | calculation B6 |
| B3 | Cover of FY2024 cash interest reaches 2.00x | FY2024 cash USD 1,158 million | 2316 | 0.3926 (39.26%) | 5 | calculation B3 |
| B1 | Free cash flow reaches zero | FY2024 cash USD 1,158 million | 1933 | 0.4931 (49.31%) | 6 | calculation B1 |
| B7 | EBITDA equals cash interest | Run-rate plus 100 bp, USD 1,554.036 million | 1554.036 | 0.5924 (59.24%) | 7 | calculation B7 |
| B2 | EBITDA equals cash interest | FY2024 cash USD 1,158 million | 1158 | 0.6963 (69.63%) | 8 | calculation B2 |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 8 |
| Calculated | 14 |
| Assumption-Based | 4 |
| Analyst Inference | 5 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 4 |
| Fields present | 14 |
| Fields total | 16 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 3 |

### Map: stress scenario

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Commercial aftermarket slowdown | Assumed to cut reported EBITDA 20% to 35% | Assumption | EBITDA decline | Scenarios S02 and S03; no contracts guarantee aftermarket sales |
| Scheduled interest step-up | Raises cash interest 31.61% with no EBITDA loss | Assumption | Cash interest | Issuer schedule USD 1,524m vs USD 1,158m paid |
| EBITDA decline | High operating leverage removes EBITDA faster than sales | Explanation | Free cash flow | Incremental margin near 57%; no input-cost recovery |
| Cash interest | Higher interest lowers free cash flow and cover | Explanation | Free cash flow | S01 free cash flow USD 1,513.96m, cover 2.50x |
| EBITDA decline | 19.69% decline reaches the 7.50x watch level | Test outcome | Pro forma net leverage | Break B4 on pro forma net debt USD 22,967m |
| Free cash flow | Stays positive until a 38.92% decline | Test outcome | Liquidity buffer | Break B6; S03 free cash flow USD 149.41m |
| Liquidity buffer | Shortfalls met by revolver drawings | Explanation | Revolver usage | Pro forma cash liquidity USD 2,919m |
| Revolver usage | Usage above USD 364m activates the test | Explanation | Springing leverage test | 7.50x test when usage exceeds 40% of commitments |
| Pro forma net leverage | High leverage raises dependence on markets | Explanation | FY2028 refinancing | USD 6,637m matures in FY2028 |

### Analytical appendix — complete canonical registers

#### T2B.1 Source register

<!-- table-id: T2B.1 -->
| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use | Source |
|---|---|---|---|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Form 10-K FY2024, audited | High | FY ended 2024-09-30 | TransDigm Group Incorporated consolidated | Risk factors on concentration, contracts, cost recovery, indebtedness and rates; market-risk sensitivity USD 30 million per percentage point; fixed share about 77% | Debt agreements incorporated by reference only; historical downturn magnitudes not read | Fragility evidence, rate shock anchor | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 17–20, 73 |
| Financial foundation | Financial foundation for this run | High | FY2024 and FY2023; pro forma 2024-10-18 | Consolidated | Base operands, pro forma net debt 22967, scheduled interest 1524, maturity ladder, facility terms | Covenant definitions absent; interim quarters not built | Stress base and control row | Financial foundation (CP-1) |
| Earnings changes | Earnings change analysis for this run | High | FY2024 vs FY2023; constructed Q4 | Consolidated | Incremental margin 57.42%, Q4 growth 18.03%, add-backs | Q4 constructed by difference | First-break evidence and monitoring levels | Earnings changes (CP-1B) |
| Fundamental credit | Fundamental credit synthesis for this run | Medium | FY2024 | Consolidated | Business mix, financial policy, supported EBITDA 3871, 2.00x cover stress | Draft only; no peers or ratings | Pathway framing and scheduled-interest break | Fundamental credit (CP-2) |
| Source readiness | Source readiness for this run | High | As of 2024-09-30 | Effective source set | Source gate partial; dated events | Summary only | Source gate and event dates | Source readiness (CP-0) |

Module status: Ready with Limitations. Base period FY2024 (twelve months to 2024-09-30, audited), USD millions.

#### T2DS.1 Scenarios

<!-- table-id: T2DS.1 -->
| Scenario | EBITDA decline | Cash-interest increase | Anchor | What the assumption leaves out | Category | Confidence | Source |
|---|---|---|---|---|---|---|---|
| S00 | 0.0000 | 0.0000 | Unstressed FY2024 control | Not applicable | Documentary Fact | High | Financial foundation (CP-1) |
| S01 | 0.0000 | 0.3161 | Issuer schedule of next-year interest USD 1,524 million against USD 1,158 million paid | Any EBITDA growth from FY2024 acquisitions; issuer schedule assumes Term SOFR 5.6% to 6.5% | Analyst Interpretation | Medium | Financial foundation (CP-1); calculation D1 |
| S02 | 0.2000 | 0.3420 | Decline anchored to the 20.06% fall that takes scheduled-interest cover to 2.00x; interest anchored to schedule plus the disclosed USD 30 million per percentage point | Working capital release, tax shield, distribution cuts | Analyst Interpretation | Medium | Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; calculation D3 |
| S03 | 0.3500 | 0.3420 | Decline anchored to the issuer's stated disproportionate exposure to aerospace disruption such as the pandemic, with commercial OEM and aftermarket about 58% of sales; interest as S02 | Actual historical pandemic decline not read; defense resilience; management cost actions | Analyst Interpretation | Low | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 17; Fundamental credit (CP-2) |

#### T2DS.2 Base operands

<!-- table-id: T2DS.2 -->
| Operand | Value | Unit | Period | Source |
|---|---|---|---|---|
| Reported EBITDA (E) | 3813 | USD millions | FY2024 | Financial foundation (CP-1) |
| Cash interest paid (I) | 1158 | USD millions | FY2024 | Financial foundation (CP-1) |
| Free cash flow (F) | 1880 | USD millions | FY2024 | Financial foundation (CP-1) |
| Total debt, carrying value | 24880 | USD millions | 2024-09-30 | Financial foundation (CP-1) |
| Cash | 6261 (1913 after the 2024-10-18 payment) | USD millions | 2024-09-30 | Financial foundation (CP-1) |
| Net debt | 18619 (22967 pro forma 2024-10-18) | USD millions | 2024-09-30 | Financial foundation (CP-1) |
| Scheduled next-year interest | 1524 | USD millions | FY2025 schedule | Financial foundation (CP-1) |
| Rate sensitivity, one percentage point | 30 | USD millions a year | 2024-09-30 balances | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| Pro forma cash liquidity | 2919 | USD millions | 2024-09-30 pro forma | Financial foundation (CP-1) |

#### T2DS.8 Scenario against break

<!-- table-id: T2DS.8 -->
| Scenario | 7.25x net watch (B5) | 7.50x net watch (B4) | 2.00x scheduled cover (K8) | FCF zero (B1 or B6) | EBITDA equals interest (B2 or B7) | Source |
|---|---|---|---|---|---|---|
| S00 | Not reached | Not reached | Not reached | Not reached | Not reached | Financial foundation (CP-1) |
| S01 | Not reached | Not reached | Not reached (2.50x) | Not reached | Not reached | calculation D7 |
| S02 | Crossed | Crossed (7.53x) | Crossed (1.96x) | Not reached | Not reached | calculation D14; calculation D15 |
| S03 | Crossed | Crossed (9.27x) | Crossed (1.59x) | Not reached (USD 149.41 million) | Not reached | calculation D18; calculation D20; calculation D21 |

#### T2DS.9 Stress gaps

<!-- table-id: T2DS.9 -->
| Gap | Effect on stress | Severity |
|---|---|---|
| Agreement definition of consolidated EBITDA and net debt not supplied | Leverage breaks shown on reported EBITDA are watch levels, not covenant tests | Material |
| No liquidity runway or forward debt path | Stressed free cash flow is not set against cash or facilities | Material |
| Working capital, capex, tax held at FY2024 | Free cash flow breaks conservative | Minor |
| Historical downturn magnitude not read | Severe scenario size is an assumption | Minor |

#### T2B.2 Business model snapshot

<!-- table-id: T2B.2 -->
| Dimension | Source-Supported Fact | Risk Mechanic | Credit Implication | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|
| Revenue model | Proprietary aerospace components, about 90% proprietary | Certified sole-source parts sustain pricing | Supports EBITDA under moderate volume stress | Fundamental credit business mix | Issuer description only | Fundamental credit (CP-2) |
| Product/service criticality | Parts certified to platforms | Second-source qualification is slow | Revenue loss comes from volume, not substitution | Fundamental credit frameworks | No independent data | Fundamental credit (CP-2) |
| Customer/end-market exposure | Almost exclusively aerospace and defense; top ten customers about 42% of sales | Sector disruption hits disproportionately versus diversified peers | Single-sector demand beta drives first break | 10-K risk factors | No peer data | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 17 |
| Price/mix | Aftermarket about 55% of sales; acquired businesses at about 33.68% margin | Aftermarket slowdown shifts mix to lower-margin OEM | Margin falls with volume | Earnings changes; Fundamental credit | Channel margins not disclosed | Earnings changes (CP-1B) |
| Volume drivers | Flight hours, OEM build rates, defense outlays | Air-traffic or build-rate shock cuts volume | First break is commercial volume | Fundamental credit channel mix | No guidance | Fundamental credit (CP-2) |
| Contract duration/churn/retention | No long-term contracts with most aftermarket customers; OEM contracts terminable at short notice, no minimum quantities | Orders can fall without notice | No contractual floor under revenue | 10-K risk factors | Not quantified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 17–18 |
| Cost structure | Incremental EBITDA As Defined margin 57.42% | Operating leverage works in reverse | EBITDA falls faster than sales | Earnings changes | Fixed and variable split not disclosed | Earnings changes (CP-1B) |
| Input-cost exposure | Most contracts do not permit recovery of raw material, tax or labour cost increases; fixed-price multi-year contracts | Inflation compresses margin | Secondary margin break | 10-K risk factors | Not quantified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 18 |
| Working-capital needs | Working-capital outflow USD 302 million FY2024 | Growth absorbs cash; downturn would release it | Cushion in stress, not modelled | Financial foundation cash flow | Held constant in stress | Financial foundation (CP-1) |
| Capex intensity | Capex 2.08% of revenue; FY2025 guide 2.5% to 3.5% | Low fixed cash need | Capex is not the transmission channel | Financial foundation | No maintenance split | Financial foundation (CP-1) |
| Liquidity dependency | Pro forma cash liquidity USD 2,919 million; securitization USD 650 million due 2025-07-11 | Shortfall moves to revolver | Revolver usage above USD 364 million triggers 7.50x test | Financial foundation liquidity | Runway not computed | Financial foundation (CP-1) |
| Debt service/refinancing dependency | Scheduled interest USD 1,524 million; FY2028 maturities USD 6,637 million; about 77% fixed; senior secured debt 5.12x FY2024 reported EBITDA | Interest fixed against falling EBITDA; wall in FY2028 | Refinancing is where risk becomes acute | Financial foundation; 10-K market risk | No prices or ratings | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |

#### T2B.6 Downside sensitivity matrix

<!-- table-id: T2B.6 -->
| Sensitivity | Input Basis | Formula / Method | Result | Credit Interpretation | Status | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Cash-interest increase to schedule | 1524 vs 1158 | F − I×k | FCF 1513.9562; cover 2.5019 | Coverage falls without any EBITDA loss | Calculated | D1, D5–D8 | calculation D6 |
| Rate shock one percentage point | 30 / 1158 | Ratio | 0.0259 of cash interest | Rate risk second-order | Calculated | D4 | calculation D4 |
| EBITDA decline 20% with interest +0.3420 | E(1−s), I(1+k) | F − E s − I k | FCF 721.364; pro forma net 7.5292x; cover 1.9629x | Leverage watch crossed; cash positive | Calculated | D9–D16 | calculation D12 |
| EBITDA decline 35% with interest +0.3420 | As above | As above | FCF 149.414; pro forma net 9.2667x; cover 1.5948x | Refinancing and LGD stress, not payment default | Calculated | D17–D22 | calculation D18 |
| Leverage watch 7.50x | 22967 / 7.5 | 1 − E*/E | 0.1969 | Earliest contractual-type marker | Calculated | B4 | calculation B4 |
| Free cash flow zero | F/E; (F − I k)/E | Break | 0.4931; 0.3892 | Liquidity break is distant | Calculated | B1, B6 | calculation B1 |
| Working-capital outflow | FY2024 −302 | Held | Directional: likely release in downturn | Cushion | Directional Only | Financial foundation | Financial foundation (CP-1) |
| Covenant headroom | Agreement definitions | Not computed | Not Calculable: agreements not supplied | Contract trigger distance unknown | Not Calculable | Source readiness gap | Source readiness (CP-0) |

#### T2B.7 Monitoring sensitivity flags

<!-- table-id: T2B.7 -->
| Trigger ID | Indicator | Leading / Lagging | Threshold or Qualitative Signal | Linked Pathway Row | Escalation Consequence | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| CP-2A-MON-001 | Quarterly organic sales growth | Leading | Below the 18.03% of the constructed fourth quarter, or any year-on-year decline | First break, scenario S02 | Move toward leverage watch levels | Earnings changes | Constructed quarter | Earnings changes (CP-1B) |
| CP-2A-MON-002 | Trailing reported EBITDA | Lagging | Below USD 3,167.86 million (7.25x) and USD 3,062.27 million (7.50x) on pro forma net debt | Breaks B5 and B4 | Incurrence brake and refinancing optics | B4, B5 | Reported, not agreement, EBITDA | calculation B4 |
| CP-2A-MON-003 | Revolver usage | Leading | Above USD 364 million | Liquidity pinch, map edge | 7.50x springing test applies | Financial foundation | Agreement text absent | Financial foundation (CP-1) |
| CP-2A-MON-004 | Cash interest run-rate | Leading | Quarterly interest annualising above USD 1,554 million | Scenario S02 interest | Free cash flow break moves closer | D2 | Issuer schedule is an estimate | calculation D2 |
| CP-2A-MON-005 | Special dividend or debt-funded distribution | Leading | Any declaration | Leverage path | Pro forma leverage rises without downturn | Fundamental credit policy | Basket sizes not established | Fundamental credit (CP-2) |
| CP-2A-MON-006 | Securitization renewal | Leading | Not renewed by 2025-07-11 | Liquidity pinch | USD 650 million refinanced from cash or revolver | Financial foundation | Renewal terms not supplied | Financial foundation (CP-1) |
| CP-2A-MON-007 | Trailing free cash flow | Lagging | Below USD 1,513.96 million | Scenario S01 | Debt service no longer covers distributions | D6 | Other flows held constant | calculation D6 |

#### T2B.9 Gaps ledger

<!-- table-id: T2B.9 -->
| Gap ID | Missing Data | Why It Matters | Affected Pathway / Calculation / Trigger | Consequence for Confidence | Required Follow-Up Source |
|---|---|---|---|---|---|
| CP-2A-GAP-001 | Credit agreement and indentures | Defines consolidated EBITDA, net debt and baskets | B4, B5, MON-002, MON-003 | High | Executed agreements |
| CP-2A-GAP-002 | Historical downturn decline (pandemic years) | Calibrates severe scenario | S03 | Medium | FY2020 and FY2021 annual reports |
| CP-2A-GAP-003 | Liquidity runway and forward debt path | Converts stressed cash flow into months of cover | All scenarios | Medium | Liquidity and forward model analyses |
| CP-2A-GAP-004 | Ratings and market prices | Market-access break cannot be dated or priced | FY2028 refinancing | Medium | Agency reports, quotes |
| CP-2A-GAP-005 | Maintenance capex split; working-capital seasonality | Free cash flow floor in stress | B1, B6 | Low | Issuer disclosure |
| CP-2A-GAP-006 | October 2024 payment shown at USD 4,348 million and USD 4,396 million | Pro forma net debt basis | Pro forma leverage | Low | December 2024 quarterly dividend note |

#### T5.5 Monitoring priority table

<!-- table-id: T5.5 -->
| Event ID | Description | Priority | Monitoring Frequency | Trigger Condition | Responsible Module |
|---|---|---|---|---|---|
| EV-01 | Securitization facility maturity, 2025-07-11, USD 650 million fully drawn | High | Monthly | No renewal announced by 2025-07-11 | Liquidity |
| EV-02 | Quarterly filings in FY2025 | High | Quarterly | Year-on-year EBITDA decline or organic growth below 18.03% | Earnings changes |
| EV-03 | Revolver usage | High | Quarterly | Usage above USD 364 million | Covenant capacity |
| EV-04 | Special dividend or repurchase declaration (none dated) | High | Event-driven | Any declaration funded with debt | Business & governance |
| EV-05 | FY2028 maturities, USD 6,637 million beginning with the 2027 subordinated notes | Medium | Quarterly | No refinancing by end FY2027 | Refinancing & LME |
| EV-06 | Term SOFR movement | Low | Monthly | Rise of one percentage point (USD 30 million a year) | Rates, FX & hedging |

#### T5.7 Gaps and limitations ledger

<!-- table-id: T5.7 -->
| Gap Description | Affected Section | Downstream Impact | Severity | Recommended Action |
|---|---|---|---|---|
| Undated: next special dividend or acquisition | Monitoring priority | Event-driven monitoring only | Material | Track board declarations |
| Securitization renewal terms not disclosed | Monitoring priority | Liquidity pinch cannot be sized | Material | Read later filings |
| No rating review dates or ratings | Event coverage | Rating triggers unknown | Material | Obtain agency reports |
| FY2028 refinancing timing not disclosed | Monitoring priority | Only maturity is dated | Minor | Watch issuance announcements |
| Covenant test dates not supplied | Event coverage | Springing test timing unknown | Minor | Obtain credit agreement |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| D1 | Scheduled interest over FY2024 cash interest | 1524 / 1158 | 1.3160621762; k = 0.3161 (31.61%) | FY2025 schedule vs FY2024, ratio | Financial foundation (CP-1) |
| D2 | Run-rate interest plus one percentage point | 1524 + 30 | 1554 | USD millions | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| D3 | Shocked interest over FY2024 cash interest | 1554 / 1158 | 1.3419689119; k = 0.3420 | ratio | calculation D2 |
| D4 | Rate shock alone as share of cash interest | 30 / 1158 | 0.0259 | ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| D5 | S01 cash interest | 1158 × 1.3161 | 1524.0438 | USD millions | calculation D1 |
| D6 | S01 free cash flow | 1880 − 1158 × 0.3161 (366.0438) | 1513.9562 (USD 1,513.96 million) | USD millions | calculation D5 |
| D7 | S01 cover | 3813 / 1524.0438 | 2.5019 (2.50x) | x | calculation D5 |
| D8 | S01 FCF / total debt | 1513.9562 / 24880 | 0.0609 | ratio | calculation D6 |
| D9 | S02 EBITDA | 3813 × 0.8 | 3050.4 | USD millions | Financial foundation (CP-1) |
| D10 | S02 EBITDA loss | 3813 × 0.2 | 762.6 | USD millions | Financial foundation (CP-1) |
| D11 | S02 and S03 cash interest; increase | 1158 × 1.342; 1158 × 0.342 | 1554.036; 396.036 | USD millions | calculation D3 |
| D12 | S02 free cash flow | 1880 − 762.6 − 396.036 | 721.364 (USD 721.36 million) | USD millions | calculation D10; calculation D11 |
| D13 | S02 total debt / EBITDA | 24880 / 3050.4 | 8.1563 | x | calculation D9 |
| D14 | S02 pro forma net debt / EBITDA | 22967 / 3050.4 | 7.5292 (7.53x) | x | calculation D9 |
| D15 | S02 cover | 3050.4 / 1554.036 | 1.9629 (1.96x) | x | calculation D11 |
| D16 | S02 FCF / total debt | 721.364 / 24880 | 0.0290 | ratio | calculation D12 |
| D17 | S03 EBITDA; loss | 3813 × 0.65; 3813 × 0.35 | 2478.45; 1334.55 | USD millions | Financial foundation (CP-1) |
| D18 | S03 free cash flow | 1880 − 1334.55 − 396.036 | 149.414 (USD 149.41 million) | USD millions | calculation D17 |
| D19 | S03 total debt / EBITDA | 24880 / 2478.45 | 10.0385 (10.04x) | x | calculation D17 |
| D20 | S03 pro forma net debt / EBITDA | 22967 / 2478.45 | 9.2667 (9.27x) | x | calculation D17 |
| D21 | S03 cover | 2478.45 / 1554.036 | 1.5948 (1.59x) | x | calculation D17 |
| D22 | S03 FCF / total debt | 149.414 / 24880 | 0.0060 | ratio | calculation D18 |
| B1 | FCF zero at FY2024 interest | 1880 / 3813 | 0.4931 (49.31%); EBITDA 1933 | ratio | Financial foundation (CP-1) |
| B2 | EBITDA equals FY2024 interest | 1 − 1158 / 3813 | 0.6963 (69.63%) | ratio | Financial foundation (CP-1) |
| B3 | 2.00x cover of FY2024 interest | 1 − 2316 / 3813 | 0.3926 (39.26%) | ratio | Financial foundation (CP-1) |
| B4 | Pro forma net leverage 7.50x | 22967 / 7.5 = 3062.2667; 1 − 3062.2667 / 3813 | 0.1969 (19.69%) | ratio | Financial foundation (CP-1) |
| B5 | Pro forma net leverage 7.25x | 22967 / 7.25 = 3167.8621; 1 − 3167.8621 / 3813 | 0.1692 (16.92%) | ratio | Financial foundation (CP-1) |
| B6 | FCF zero at shocked interest | (1880 − 396.036) / 3813 = 1483.964 / 3813 | 0.3892 (38.92%); EBITDA 2329.036 | ratio | calculation D11 |
| B7 | EBITDA equals shocked interest | 1 − 1554.036 / 3813 | 0.5924 (59.24%) | ratio | calculation D11 |

Other figures in the tables (cover of scheduled interest at a 20.06% decline, incremental margin 57.42%, pro forma liquidity USD 2,919 million, revolver trigger USD 364 million, FY2028 maturities USD 6,637 million, 18.03% fourth-quarter growth, 21.12% EBITDA growth, 5.50x issuer-basis leverage) are taken unchanged from the analyses named in their Source column. Break points hold cash interest at the stated basis, and debt and cash at base balances; scenario shock sizes are the analyst's labelled assumptions.

## Gaps

| Gap | Why it matters | Severity |
|---|---|---|
| Credit agreement and indentures not supplied | Leverage breaks are watch levels on reported EBITDA, not covenant tests; headroom not established | Material |
| No liquidity runway, forward debt path or maturity stress in this analysis | Stressed cash flow is not set against cash, facilities or the July 2025 securitization maturity | Material |
| Historical downturn magnitude not read | Severe scenario size rests on an assumption | Minor |
| No ratings or market prices | Point at which refinancing access closes cannot be priced or dated | Minor |
| Working capital, capex and tax held at FY2024 | Free cash flow break points are conservative | Minor |
| Use restriction | These results are a static stress of FY2024; they are not a forecast, covenant test, recovery estimate or security recommendation | Minor |

## Next module

The orchestrator selects the next module.
