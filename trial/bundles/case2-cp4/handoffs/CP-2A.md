---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-2A
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-copilot-sol-medium
pathway: deep_credit_assessment
artifact_name: tdg_CP-2A_20240930.md
module_status: Ready with Limitations
committee_status: Requires More Work
---

## Request
TransDigm Group Incorporated, as of 2024-09-30; pathway: deep_credit_assessment. Assess first operating breaks, static FY2024 downside, cash-flow and leverage break points, and dated credit catalysts, with subsequent events separated from the annual base.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended September 30, 2024 | 2024-11-07, signature and auditor-report date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Retrospective cost-absorption mechanism, hedged rate sensitivity and exact subsequent-event dates; annual financial inputs adopted from Financial foundation |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Identity, source selection and evidence boundaries |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Annual operands, reported ratios, debt definitions and isolated subsequent-event pro formas |
| Earnings changes | CP-1B | 1af1e57aa799c5d037f3be75ff5096331d4c858997317462b21965138174d55d | Organic demand, operating absorption, working-capital conversion and discretionary cash deployment |
| Fundamental credit | CP-2 | cbd6dddbb4c5df05c187da5cbb0148c60cd108997d4bcd232c4591aef04e1961 | Operating first-break hypotheses, business protections, financial-policy vulnerability and dated financing dependency |

## Findings

### Bottom line
TransDigm’s first stress failure is likely to be cash retention and leverage tolerance, not immediate inability to pay interest: weaker replacement shipments or certified-input delays would erode margins and collections while distributions leave less retained protection for creditors.
Basis: Fundamental credit (CP-2); Earnings changes (CP-1B); Financial foundation (CP-1)

The static annual test supports that distinction. An assumed 20% EBITDA decline with a modest increase in net cash interest lifts gross leverage to 8.16x, although operating free cash flow remains positive. At unchanged interest, free cash flow reaches zero after a 49.31% EBITDA decline, well before EBITDA equals net cash interest at a 69.63% decline. These are conditional operating break points, not default forecasts; distributions, funding renewal and working-capital timing can make creditor risk acute earlier.
Basis: calculation S01; calculation M01; calculation B01; calculation B02

### Key findings
- **Leverage becomes uncomfortable before operating cash turns negative.** The analyst’s 8x gross-leverage watch level is reached after an 18.44% EBITDA decline, ahead of the 2x net-cash-interest coverage watch at a 39.26% decline. Neither watch level is a covenant or an agency trigger.
Basis: calculation B03; calculation B04
- **The cash-generation cushion is meaningful but policy-dependent.** FY2024 free cash flow is USD 1,880 million before acquisitions, distributions and finance-lease principal. The subsequent dividend payment is USD 4,348 million on October 18, 2024; it is a separate cash use rather than an operating loss in the stress calculation.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63
- **The rate overlay is modest because the disclosed exposure is substantially hedged.** The annual report estimates approximately USD 30 million additional annual interest cost for a 100 bp rate rise. The scenario increases total net paid interest proportionately to approximate that disclosed cost, rather than charging the rate shock against every dollar of debt.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; calculation A01
- **The earliest dated funding concern is receivables financing.** Renewal or replacement by July 11, 2025 matters more immediately than the large FY2028 long-term principal wall. Falling collections and inventory accumulation would weaken operating cash while dependence on this facility increases; actual repayment feasibility is not established by this static test.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2)

### Contrary evidence and what would change the view
The strongest counterargument is actual improvement across organic demand, fixed-cost absorption and cash conversion, together with proprietary installed-product economics. The moderate stress still produces positive operating free cash flow and covers net cash interest comfortably; the filing also reports substantial fixed-rate protection. These facts argue against assuming imminent distress solely from leverage. Sustained replacement demand, timely receivables-facility renewal and observable retention of operating cash would make that counterargument stronger. Falling aftermarket shipments combined with collection delays and another discretionary payment would instead make the static earnings buffer less relevant to creditor protection.
Basis: Earnings changes (CP-1B); Fundamental credit (CP-2); calculation S01; calculation M01; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73

### Limitations
- The stress does not offset cash losses against cash or undrawn facilities. Consequently, its free-cash-flow break is not a liquidity-exhaustion point and cannot establish a survival period.
- Closing debt and cash are frozen in every case; stressed free cash flow does not change either balance. Consequently, stressed net leverage is an earnings sensitivity, not a projected post-distribution balance sheet.
- The watch levels are analyst risk tolerances, not legal tests. Their ordering cannot establish covenant breach, restricted-payment permission or remaining borrowing capacity.
- Maturities and refinancing costs are monitored separately, not stressed. The test therefore cannot establish whether a weaker operating case can refinance the receivables facility or the later principal wall.
- Working capital, capex and taxes remain at the annual base, with no tax shield or management cost response. Accordingly, the calculated free-cash-flow break can be too late if collections deteriorate, or too early if cash taxes and discretionary spending fall.
- The rate overlay scales historical net paid interest using a disclosed incremental-cost anchor; it does not model changing interest receipts, hedge expiry or loan-level resets. Its cash-interest result is a sensitivity, not the next contractual interest bill.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73
- No historical downturn loss or issuer-specific volume-to-profit elasticity is established for calibration. The assumed EBITDA shocks test distances to calculated breaks, not the probability or operating size of an aviation downturn.
Basis: Earnings changes (CP-1B); Fundamental credit (CP-2)

### Downside stress

| Case | EBITDA decline | Net cash-interest increase | EBITDA, USD million | FCF, USD million | Credit result |
|---|---|---|---|---|---|
| s00 control | 0% | 0% | 3813 | 1880 | Gross 6.53x; net 4.88x; net cover 3.29x; October 18, 2024 dividend-only net leverage 6.02x is separate |
| s01 shipment/mix stress | 20% | 2.59% | 3050.4 | 1087.4078 | Gross 8.16x; net cover 2.57x; leverage watch exceeded, FCF positive |
| s02 deep operating stress | 50% | 5.18% | 1906.5 | -86.4844 | Gross 13.05x; net cover 1.57x; FCF negative despite EBITDA covering net interest |

### Break points

| Order | Condition | EBITDA decline, fraction | EBITDA decline, % | EBITDA, USD million | Interpretation |
|---|---|---|---|---|---|
| 1 | Gross leverage reaches analyst 8x watch | 0.18436926304746918436926304746918436926 | 18.44% | 3110 | Leverage tolerance deteriorates first; not a covenant |
| 2 | Net cash-interest cover reaches analyst 2x watch | 0.39260424862313139260424862313139260425 | 39.26% | 2316 | Servicing buffer narrows before FCF reaches zero |
| 3 | FCF reaches zero | 0.49305009179124049305009179124049305009 | 49.31% | 1933 | Loss of internally generated cash after total capex, before discretionary uses |
| 4 | EBITDA equals net cash interest | 0.69630212431156569630212431156569630212 | 69.63% | 1158 | Earnings no longer exceed net paid interest; not an all-in debt-service test |

### Map: stress scenario

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Replacement shipment weakness | Lower aftermarket mix weakens earnings | Explanation | Margin and absorption pressure | Fundamental credit identifies replacement margins and fixed costs |
| Certified-input delays | Completed shipments and receipts can be deferred | Explanation | Cash conversion pressure | Fundamental credit identifies certification and supply delays |
| Margin and absorption pressure | Tested through assumed EBITDA declines | Assumption | Static EBITDA reduction | Scenarios are anchored to calculated cash-flow breaks |
| Static EBITDA reduction | Lower earnings raise frozen-debt leverage | Test outcome | Leverage watch exceeded | Moderate case exceeds the analyst leverage watch |
| Static EBITDA reduction | Larger loss exhausts annual operating FCF | Test outcome | Negative operating FCF | Deep case produces negative FCF with the rate overlay |
| Cash conversion pressure | Could consume cash beyond this static test | Explanation | Funding dependence | Annual receivable and inventory movements affect operating cash |
| Dividend payment | Removes cash independently of operating losses | Explanation | Reduced retained protection | Separate subsequent distribution is documented |
| Funding dependence | Makes timely renewal more important | Explanation | Receivables renewal sensitivity | Facility maturity precedes the large long-term principal wall |

### Catalyst view
The catalyst bias is adverse for retained cash, rather than evidence of an operating collapse. The subsequent receivables draw and dividend payment are known events disclosed after the assessment date; the facility maturity is the principal scheduled funding catalyst within the default monitoring horizon. Later principal concentrations remain explicit extended-horizon monitors. No refinancing announcement date, earnings-release date, rating review or new acquisition completion date is inferred.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63

### Analytical appendix — complete canonical registers

### T2B.1 Source gate and baseline

| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use | Source |
|---|---|---|---|---|---|---|---|---|
| Annual filing | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Primary issuer filing; management sensitivity distinguished from audited statements | FY2024; subsequent October 2024 events separate | TransDigm Group Incorporated consolidated | Cost absorption, hedged interest exposure, event dates | Retrospective annual evidence; operating narrative does not quantify stress elasticity | First-break mechanism and rate anchor | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| Financial baseline | Financial foundation | Accepted matching annual financial analysis | FY2024; USD millions; twelve-month flows and September closing stocks | Consolidated group, not guarantor-only | E 3813; I 1158; F 1880; D 24880; cash 6261; gross/net leverage 6.53x/4.88x; cover 3.29x; FCF/debt 0.07556270 | Net cash-interest convention; no forward balances | Quantitative static stress | Financial foundation (CP-1) |
| Operating baseline | Fundamental credit; Earnings changes | Accepted issuer-specific analyses | FY2024 and FY2023 comparison; assessment 2024-09-30 | Same consolidated issuer | Replacement economics, certified-input delays, absorption, cash conversion, financial policy | No quantified downturn elasticity or covenant test | Operating first break and contrary evidence | Fundamental credit (CP-2); Earnings changes (CP-1B) |
| Entry evidence | Source readiness | Accepted same issuer/date/run | 2024-09-30 | tdg | Identity, scope, source authority | Does not itself validate a credit scenario | Gate passes for retrospective stress with limitations | Source readiness (CP-0) |

Identity, period and currency match throughout the supplied analyses. The quantitative gate is satisfied by the annual financial baseline, and the business-risk gate is satisfied by Fundamental credit. No quarterly annualization, borrower-only substitution or alternative add-back denominator is used.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2)

### cp1_references

| Reference | Adopted financial fact | Period | Unit / definition | Source |
|---|---|---|---|---|
| E | 3813 | FY2024 | USD millions; reported unadjusted EBITDA | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| I | 1158 | FY2024 | USD millions; cash interest paid net of receipts | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 123 |
| F | 1880 | FY2024 | USD millions; CFO 2045 less total capex 165; before acquisitions, distributions and finance-lease principal | Financial foundation (CP-1) |
| D | 24880 | 2024-09-30 | USD millions; carrying financial debt, including finance leases and securitization | Financial foundation (CP-1) |
| Cash | 6261; dividend-only pro forma 1913 on 2024-10-18; combined October events 2075.5 | Year-end and separate subsequent events | USD millions; no operating flows added to isolated event calculations | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| Net debt | 18619; dividend-only pro forma 22967 on 2024-10-18 | Year-end and subsequent event | USD millions; standalone remaining-capacity draw leaves net debt unchanged | Financial foundation (CP-1) |
| Net leverage | 4.88x; dividend-only pro forma 6.02x on 2024-10-18 | Year-end and subsequent event | Unchanged annual EBITDA | Financial foundation (CP-1) |
| Gross leverage / cover | 6.53x / 3.29x | FY2024 | Carrying debt / EBITDA; EBITDA / net cash interest | Financial foundation (CP-1) |
| FCF / debt | 0.07556270 | FY2024 | Fraction, annual flow / closing carrying debt | Financial foundation (CP-1) |
| Debt reconciliation | Gross principal 25068; carrying less gross -188 | 2024-09-30 | USD millions; no principal substitution in leverage | Financial foundation (CP-1) |
| Non-debt funding float | Contract liabilities 177 / 87; contract assets 301 / 192 | FY2024 / FY2023 | USD millions; customer advances and unbilled performance, not supplier finance | Financial foundation (CP-1) |

### T2DS.1 Scenario assumptions

| Case | EBITDA decline fraction s | Cash-interest increase fraction k | Classification / confidence | Anchor and selection rationale | Exclusions |
|---|---|---|---|---|---|
| s00 control | 0 | 0 | Control, not a forecast | Reproduce the annual financial baseline | No event adjustment |
| s01 shipment/mix stress | 0.2 | 0.0259 | Analyst Interpretation; Medium | A 20% EBITDA decline lies just beyond the calculated 18.44% gross-leverage watch break and below half the 49.31% FCF break. Interest uplift approximates disclosed USD 30 million sensitivity divided by USD 1158 million base interest | No source-implied likelihood; no price/volume-to-EBITDA conversion or hedge roll-forward |
| s02 deep operating stress | 0.5 | 0.0518 | Analyst Interpretation; Low | A 50% EBITDA decline deliberately crosses the calculated 49.31% FCF break. Interest uplift is twice the moderate overlay to test adverse funding alongside operating weakness | Doubling is an analyst assumption, not a disclosed nonlinear rate response; no assumed refinancing coupon |

The annual period is selected because it supplies twelve-month cash flows and matching closing debt. The assumed earnings declines represent fewer high-margin replacement shipments, adverse mix and overhead deleverage; they are not claims that a given sales decline mechanically causes the chosen EBITDA loss. The interest-increase fractions multiply the total historical net paid-interest amount, not the floating-rate reference rate.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2); calculation A01; calculation B01; calculation B03

### T2DS.2 Base operands

| Operand | Value | Currency / scale | Period / perimeter | Source |
|---|---|---|---|---|
| EBITDA E | 3813 | USD millions | FY2024 consolidated | Financial foundation (CP-1) |
| Net cash interest I | 1158 | USD millions | FY2024 consolidated | Financial foundation (CP-1) |
| Levered FCF F | 1880 | USD millions | FY2024 consolidated, including working capital | Financial foundation (CP-1) |
| Carrying debt D | 24880 | USD millions | Closing 2024-09-30 | Financial foundation (CP-1) |
| Cash C | 6261; separate 2024-10-18 dividend-only pro forma 1913 | USD millions | Closing base frozen; pro forma not used in stress | Financial foundation (CP-1) |
| Net debt N | 18619; separate 2024-10-18 dividend-only pro forma 22967 | USD millions | Closing base frozen; pro forma not used in stress | Financial foundation (CP-1) |
| Reported gross leverage | 6.53x | Ratio | FY2024 | Financial foundation (CP-1) |
| Reported net leverage | 4.88x; separate 2024-10-18 dividend-only pro forma 6.02x | Ratio | FY2024 earnings | Financial foundation (CP-1) |
| Reported net cash-interest cover | 3.29x | Ratio | FY2024 | Financial foundation (CP-1) |
| Reported FCF / debt | 0.07556270 | Fraction | FY2024 flow / closing debt | Financial foundation (CP-1) |

### T2DS.4 Stressed metrics and control comparison

| Case | Total leverage | Net leverage | EBITDA / net cash interest | FCF / debt, fraction | Source |
|---|---|---|---|---|---|
| s00 | 6.53x | 4.88x; separate 2024-10-18 dividend-only pro forma 6.02x | 3.29x | 0.075562700964630225080385852090032154341 | Financial foundation (CP-1); calculation M00 |
| s01 | 8.16x | 6.10x | 2.57x | 0.043706101286173633440514469453376205788 | calculation M01; calculation R01 |
| s02 | 13.05x | 9.77x | 1.57x | -0.0034760610932475884244372990353697749196 | calculation M02; calculation R02 |

The unstressed control agrees with Financial foundation’s reported gross leverage, net leverage and net-interest coverage at its displayed precision; FCF to debt agrees at eight decimals. None of the stress rows includes the October distribution or converts positive free cash flow into debt repayment.
Basis: Financial foundation (CP-1); calculation M00; calculation M01; calculation M02

### T2DS.6 Break-point definitions

| Break | Formula for EBITDA decline s | Input basis | Result, fraction | Gate / ordering | Source |
|---|---|---|---|---|---|
| Gross leverage watch 8x | 1 - D / (8E) = (E - D/8)/E | D 24880; E 3813; D/8 3110 | 0.18436926304746918436926304746918436926 | First; analyst assumption, Medium; anchored above base 6.53x, not a covenant | calculation B03; Financial foundation (CP-1) |
| Net coverage watch 2x | 1 - 2I/E = (E-2I)/E | E 3813; I 1158; 2I 2316 | 0.39260424862313139260424862313139260425 | Second; analyst assumption, Medium; anchored below base 3.29x, not agency headroom | calculation B04; Financial foundation (CP-1) |
| FCF zero | F/E | F 1880; E 3813; break EBITDA 1933 | 0.49305009179124049305009179124049305009 | Third; holds interest at base | calculation B01; Financial foundation (CP-1) |
| EBITDA equals net interest | 1-I/E = (E-I)/E | E 3813; I 1158 | 0.69630212431156569630212431156569630212 | Fourth; positive annual interest denominator; holds interest at base | calculation B02; Financial foundation (CP-1) |

### T2DS.8 Scenarios against unchanged-interest breaks

| Case | Gross leverage 8x break | Net coverage 2x break | FCF-zero break | EBITDA-equals-interest break |
|---|---|---|---|---|
| s00 | Below | Below | Below | Below |
| s01 | Exceeded | Below | Below | Below |
| s02 | Exceeded | Exceeded | Exceeded | Below |

These comparisons use the unchanged-interest break points as required. With each case’s interest overlay, the free-cash-flow decline threshold is lower: the moderate overlay and the deep overlay both reduce the earnings loss needed to exhaust free cash flow. Neither case’s net cash-interest denominator becomes nonpositive.
Basis: calculation B05; calculation B06; calculation S01; calculation S02

### T2B.2 Business model snapshot

| Dimension | Source-Supported Fact | Risk Mechanic | Credit Implication | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|
| Revenue model | Engineered aircraft components; replacement sales follow installed products | Fewer flight-related replacements reduce transactional receipts | Primary operating first break is shipments, not an abstract EBITDA shock | Fundamental credit | No disclosed subscription-like revenue guarantee adopted | Fundamental credit (CP-2) |
| Product/service criticality | Certified proprietary installed components support replacement economics | Requalification delays substitution but delivery failure interrupts cash | Business protects demand better than it guarantees timing | Fundamental credit | No product-level substitution-loss estimate | Fundamental credit (CP-2) |
| Customer/end-market exposure | Defense and commercial channels both contributed to annual organic improvement | Weaker commercial use can be partly offset by defense, but cash timing differs | Partial diversification mitigates one-channel stress | Earnings changes | No quantified channel downturn correlation | Earnings changes (CP-1B) |
| Price/mix | Aftermarket economics support profitability | Lower replacement mix can reduce profit faster than aggregate sales | Monitor channel mix before consolidated revenue alone | Fundamental credit | Separate price and volume contributions not established | Fundamental credit (CP-2) |
| Volume drivers | Flying activity and OEM production affect shipments | Fewer shipments reverse absorption of fixed overhead | Lower cash generation with costs slower to adjust | Annual filing cost discussion | Management attribution does not estimate downside elasticity | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |
| Contract duration/churn/retention | Installed-product repeat economics are not a contractual annuity | Customer destocking can delay repeat purchases without formal contract loss | Retention economics do not eliminate cyclical cash gaps | Fundamental credit | Complete renewal schedule not established | Fundamental credit (CP-2) |
| Cost structure | Higher production spread fixed overhead in FY2024 | Reduced throughput reverses a reported margin support | Margin compression can accelerate the shipment shock | Annual filing | Fixed/variable cost split not established | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |
| Input-cost exposure | Inflation persisted; certified suppliers are not instantly replaceable | Supply delay traps work and raises cost before delivery | Margin and cash conversion may weaken simultaneously | Fundamental credit; annual filing | No quantified wage, commodity or FX pass-through | Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |
| Working-capital needs | Annual statement balance changes consumed USD 302 million versus USD 431 million previously | Renewed inventory or receivable absorption could reverse part of conversion improvement | Static FCF can overstate stress protection | Financial foundation; Earnings changes | Supplier-finance trend not established; customer advances are not payables | Financial foundation (CP-1); Earnings changes (CP-1B) |
| Capex intensity | FY2024 total capex USD 165 million | Physical reinvestment is modest but not wholly deferrable | Positive FCF provides mitigation without assuming a maintenance cut | Financial foundation | No maintenance floor or growth split | Financial foundation (CP-1) |
| Liquidity dependency | Receivables funding matures 2025-07-11 | Poor collections can coincide with a repayment or renewal need | Funding risk may escalate before the operating FCF-zero break | Financial foundation | No liquidity offset or runway computed | Financial foundation (CP-1) |
| Debt service/refinancing dependency | Carrying debt USD 24880 million; paid interest net USD 1158 million | Earnings losses raise leverage while debt remains fixed | Market access can weaken before interest coverage falls below unity | Financial foundation | Not a covenant calculation or refinancing quote | Financial foundation (CP-1) |

Customer liabilities increased to USD 177 million from USD 87 million while contract assets increased to USD 301 million from USD 192 million. This is customer financing alongside unbilled work, not permanent financing capacity: fulfilling prepaid work can require costs without new cash receipts. The static test retains the annual operating-balance effect rather than extrapolating the advance increase as a recurring cash benefit.
Basis: Financial foundation (CP-1)

### T2B.6 Sensitivity and fragility coverage

| Sensitivity | Input Basis | Formula / Method | Result | Credit Interpretation | Status | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Revenue: replacement shipment decline | Installed aftermarket economics; organic demand improved | Fewer replacements → adverse mix and lower absorption → lower EBITDA → reduced FCF | s01 and s02 are earnings equivalents, not revenue elasticities | Leverage watch is crossed before cash generation fails | Calculated; analyst scenario | S01/S02; B03 | Fundamental credit (CP-2); Earnings changes (CP-1B) |
| Margin: fixed-cost absorption and inflation | Filing attributes improvement to higher production despite inflation | Lower throughput with sticky costs → margin loss → FCF decline | No independent margin-to-volume estimate | Do not assume cash costs fall in proportion to sales | Directional Only | Operating first break | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |
| Cash Conversion: collections and inventory | Annual seven-line cash absorption USD 302 million; prior USD 431 million | Renewed cash absorption → lower FCF independently of earnings → greater funding reliance | Not added numerically to static scenarios | This can move practical funding stress ahead of calculated FCF zero | Directional Only | MON-02 | Financial foundation (CP-1); Earnings changes (CP-1B) |
| Liquidity: receivables maturity | Maturity 2025-07-11; year-end narrative draw USD 487.5 million | Nonrenewal → repayment requirement, while weaker collections reduce cash → funding pinch | No cash runway or facility-availability stress computed | Earlier funding event than major term-debt wall | Directional Only | E03 | Financial foundation (CP-1) |
| Capital Structure: elevated debt | Carrying debt USD 24880 million; annual E USD 3813 million | Fixed D / lower E | Gross leverage 8.16x / 13.05x in s01/s02 | Refinancing flexibility can weaken despite positive EBITDA | Calculated | M01/M02 | Financial foundation (CP-1) |
| Legal: leakage/priority interaction | Consolidated earnings do not establish obligor-level protection | Permitted leakage or priming could reduce recoverable value without equal earnings loss | Not calculable: capacity and priority evidence not established for this analysis | No numerical LGD, recovery or legal-breach claim | Not Calculable | G3 | Source readiness (CP-0); Fundamental credit (CP-2) |
| Governance: further distributions or acquisitions | Observed annual selected-use deficit USD -2505 million; October dividend USD 4348 million | Cash deployment → less retention → greater reliance on financing under operating stress | Not deducted again from base FCF | Discretionary cash use can dominate the operating cushion | Directional Only | MON-04; E02 | Earnings changes (CP-1B); Financial foundation (CP-1) |
| Macro: rates, FX and demand beta | Filing rate sensitivity USD 30 million for 100 bp; FX exposure to sterling/euro | Higher interest reduces FCF directly; FX and flight activity affect earnings and receipts | Interest increment 29.9922 / 59.9844, USD million, s01/s02; FX directional | Fixed-rate protection mitigates immediate rate shock, not demand or conversion risk | Calculated for rates; Directional Only for FX | A01; S01/S02 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |

### T2B.7 Monitoring sensitivity flags

| Trigger ID | Indicator | Leading / Lagging | Threshold or Qualitative Signal | Linked Pathway Row | Escalation Consequence | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| MON-01 | Replacement shipments and certified supply | Leading | Disclosed aftermarket organic decline, shipment delay, or worsening channel mix; review with each report, analyst cadence | Operating first break: shipments → margins → FCF | Challenge the assumed earnings cases before headline cash erosion | Fundamental credit | No source-supported quantitative shipment cutoff | Fundamental credit (CP-2) |
| MON-02 | Receivable/inventory cash use | Leading for funding; lagging operating cash | Renewed cash absorption alongside lower CFO after total capex; quarterly review, analyst cadence | Cash-conversion amplifier | Practical cash pressure may emerge before static FCF-zero point | Financial foundation | No additional working-capital shock is included in scenarios | Financial foundation (CP-1); Earnings changes (CP-1B) |
| MON-03 | Gross leverage / net interest cover | Lagging | Analyst watch 8x gross leverage or 2x cover; compare on the same annual definitions | Leverage and servicing deterioration | Escalate cash-preservation scrutiny, not a covenant-breach declaration | B03/B04 | Watch levels are Analyst Interpretation, Medium; not contractual | Financial foundation (CP-1); calculation B03; calculation B04 |
| MON-04 | New distribution or debt-funded acquisition | Leading | Announced cash use before durable retained-cash growth; event-driven monitoring | Policy accelerator | Reassess retained protection separately from operating earnings | Observed dividend and selected-use deficit | Future action and timing are not predicted | Financial foundation (CP-1); Earnings changes (CP-1B) |
| MON-05 | Facility renewal or repayment | Leading | Executed replacement, reduction or nonrenewal at contractual maturity 2025-07-11; monthly review, event-driven escalation, analyst cadence | Funding pinch | Nonrenewal makes cash repayment necessary even if EBITDA covers interest | E03 | No assumed pre-maturity refinancing date or price | Financial foundation (CP-1) |
| MON-06 | FCF below zero | Lagging | Negative CFO less total capex on matching annual basis | Operating FCF failure | Internally generated funds no longer cover the held-base operating/capex burden | B01; S02 | Not equivalent to inability to pay all obligations | Financial foundation (CP-1); calculation B01; calculation S02 |

### T5.5 Dated event monitoring priorities

| Event ID | Description | Priority | Monitoring Frequency | Trigger Condition | Responsible Module | Source |
|---|---|---|---|---|---|---|
| E01 | Remaining receivables capacity drawn 2024-10-16, USD 162.5 million; Debt & Capital Structure | High | Event-driven; analyst monitoring cadence | Subsequent disclosed draw removes undrawn capacity; distinguish initial equal debt/cash effect from operating cash generation | Downside | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| E02 | Special dividend/equivalents paid 2024-10-18, USD 4348 million; Corporate | Critical | Event-driven; analyst monitoring cadence | Disclosed payment reduces retained protection; isolated pro formas stay separate from FY2024 | Downside | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; Financial foundation (CP-1) |
| E03 | Receivables facility maturity 2025-07-11; Debt & Capital Structure | Critical | Monthly and event-driven; analyst monitoring cadence | No executed replacement or repayment by disclosed maturity | Downside | Financial foundation (CP-1) |
| E04 | FY2028 long-term principal USD 6637 million; Debt & Capital Structure | High | Quarterly; analyst monitoring cadence | Earnings or market access deteriorates while principal concentration persists | Downside | Financial foundation (CP-1) |
| E05 | FY2029 long-term principal USD 4768 million; Debt & Capital Structure | High | Quarterly; analyst monitoring cadence | Concentration remains after earlier funding needs, without retained cash improvement | Downside | Financial foundation (CP-1) |

### Dated-event assessment

| Event ID | Timing / evidence treatment | Probability class | Impact class / direction | Risk channels and affected measures | Reliability / source date | Source |
|---|---|---|---|---|---|---|
| E01 | Known subsequent event, not forecast at cutoff | High | Medium / Uncertain | Draw adds debt and cash equally initially; conditional liquidity becomes funded borrowing | Primary issuer disclosure; 2024-11-07 annual report | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| E02 | Known subsequent event; declaration already accrued at year-end | High | High / Negative; High/High priority class | Liquidity and net leverage worsen through cash payment; net leverage 4.88x becomes 6.02x on 2024-10-18 | Primary issuer disclosure plus accepted event arithmetic | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; Financial foundation (CP-1) |
| E03 | Scheduled contractual maturity within 2024-09-30 to 2025-09-30 default horizon | High for scheduled maturity; Unknown for renewal failure | High / Uncertain; High/High priority class for scheduled funding need | Refinancing/liquidity; repayment risk if no replacement; no default probability assigned | Primary debt terms carried in annual financial analysis | Financial foundation (CP-1) |
| E04 | Extended horizon, disclosed fiscal period preserved | High for scheduled principal; Unknown for refinancing outcome | High / Uncertain | Refinancing capacity and leverage; ladder excludes short-term securitization and finance leases | Primary filed principal schedule | Financial foundation (CP-1) |
| E05 | Extended horizon, disclosed fiscal period preserved | High for scheduled principal; Unknown for refinancing outcome | High / Uncertain | Refinancing capacity and cash retention across successive principal concentrations | Primary filed principal schedule | Financial foundation (CP-1) |

### T2B.9 Downside gaps ledger

| Gap ID | Missing Data | Why It Matters | Affected Pathway / Calculation / Trigger | Consequence for Confidence | Required Follow-Up Source |
|---|---|---|---|---|---|
| G1 | Issuer downturn elasticity, mix sensitivity and fixed/variable cost response | Cannot translate a shipment shock into a source-estimated earnings loss or scenario likelihood | s01/s02; operating first break | High impact; assumed shock magnitudes remain Medium/Low | Product/channel downturn history and cost-response evidence |
| G2 | Intra-period collection, inventory, cash-tax and reinvestment responses | Static FCF omits joint timing effects and possible mitigation | Cash-conversion amplifier; FCF-zero break | High impact for survival interpretation, not arithmetic | Monthly operating cash bridge and response plan |
| G3 | Complete covenant and recovery inputs | Watch levels cannot locate legal default or value impairment by claim | MON-03; legal/structural fragility | High impact for covenant/LGD conclusions only | Operative instrument terms, compliance calculations, collateral and entity claims |
| G4 | Future interest receipts, hedge expiries and resetting principal within the stress period | Historical net cash interest may not track the next bill | Rate overlay; coverage | Medium impact | Instrument and hedge cash schedules; gross interest receipts/payments |
| G5 | Commitment to retain cash and refrain from new discretionary outflows | Positive static FCF does not guarantee deleveraging | Policy accelerator; MON-04 | Medium impact | Dated capital-allocation decisions and actual cash deployment |

### T2DS.9 Static-test gaps

| Gap | Held or excluded item | Restricted conclusion | Resolution |
|---|---|---|---|
| Liquidity offset | No cash/facility offset against stressed FCF | No runway or exhaustion date | Time-specific available-liquidity bridge |
| Stock-flow dynamics | Closing debt/cash frozen | No forward net-debt path | Linked cash/debt forecast |
| Covenant mapping | Analyst watches are not tests | No legal headroom estimate | Instrument-specific covenant inputs |
| Maturity/refinancing stress | Dated events not charged to scenario FCF | No refinancing-success or repayment test | Funding bridge with contractual obligations |
| Operating responses | Base working capital, taxes and capex held | No joint operating cash stress or tax shield | Explicit cash-conversion and response assumptions |

### T5.7 Event gaps and coverage

| Gap Description | Affected Section | Downstream Impact | Severity | Recommended Action |
|---|---|---|---|---|
| No disclosed future date for another distribution, acquisition or refinancing announcement | Catalyst timing | Undated risks cannot be placed on a dated calendar | MATERIAL for event timing | Retain qualitative triggers without inventing transaction dates |
| No scheduled rating review, earnings release or legal milestone established in inspected evidence | Calendar coverage | No dated event is assigned for those categories | MINOR | Add only publication-supported dates when established |
| FY2028 and FY2029 principal walls extend beyond the default annual horizon | Calendar scope | Later funding concentrations are monitored, not treated as next-year cash calls | MINOR | Preserve fiscal-period precision and extended-horizon designation |
| October actions disclosed after the assessment date | Event temporal treatment | Known subsequent events are not cutoff-public forecasts | Scope restriction | Preserve event-only financial effects separately from the annual stress |

### Material claim lineage

| Claim | Material conclusion | Strongest lineage | Source |
|---|---|---|---|
| C1 | Higher production supported fixed-overhead absorption | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |
| C2 | Hedged interest sensitivity is approximately USD 30 million for 100 bp | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| C3 | October draw/payment are dated subsequent events | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| C4 | Moderate stress crosses the gross leverage watch while FCF stays positive | Calculated | S01; M01; B03 |
| C5 | Deep stress turns FCF negative despite EBITDA covering net interest | Calculated | S02; M02 |
| C6 | Leverage watch precedes coverage watch, FCF zero and interest equality | Calculated | B01–B04 |
| C7 | Control ratios reconcile to annual financial baseline | Calculated | M00; Financial foundation (CP-1) |
| C8 | Moderate and deep paired shocks are useful break-distance tests | Assumption-Based | T2DS.1; A01; B01/B03 |
| C9 | Gross leverage 8x and net cover 2x are monitoring tolerances | Assumption-Based | T2DS.6; B03/B04 |
| C10 | Shipments and cash conversion are plausible earliest operating breaks | Analyst Inference | Fundamental credit (CP-2); Earnings changes (CP-1B) |
| C11 | Cash policy and nearer facility renewal can matter before static operating failure | Analyst Inference | Financial foundation (CP-1); Fundamental credit (CP-2) |
| C12 | Static earnings stress cannot establish survival, legal breach or recovery | Insufficient Information | T2DS.9; G2/G3 |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 3 |
| Calculated | 4 |
| Assumption-Based | 2 |
| Analyst Inference | 2 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 1 |
| Fields present | 86 |
| Fields total | 88 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 2 |

## Calculations

All money operands and results use consolidated USD millions and the FY2024 annual base unless stated otherwise. The calculations hold cash and debt at September closing balances; quoted event-only pro formas are adopted rather than recomputed. Credit multiples and percentage presentations are rounded to two decimals, while exact monetary stress outputs retain all resulting decimals.

| ID | Period / quantity | Formula and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| A01 | FY2024 interest shock calibration | 30 / 1158 | 0.025906735751295336787564766839378238342; selected assumption k 0.0259, doubled assumption 0.0518 | Fraction; not a reference-rate change | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; Financial foundation (CP-1) |
| S01 | s01 annual flows | E'=3813×0.8; E loss=3813×0.2; I'=1158×1.0259; I increment=1158×0.0259; F'=1880-762.6-29.9922 | E' 3050.4; E loss 762.6; I' 1187.9922; I increment 29.9922; F' 1087.4078 | USD millions | Financial foundation (CP-1); analyst assumptions T2DS.1 |
| S02 | s02 annual flows | E'=3813×0.5; I'=1158×1.0518; I increment=1158×0.0518; F'=1880-1906.5-59.9844 | E' 1906.5; I' 1217.9844; I increment 59.9844; F' -86.4844 | USD millions | Financial foundation (CP-1); analyst assumptions T2DS.1 |
| M00 | s00 control ratios | 24880/3813; 18619/3813; 3813/1158; 1880/24880 | Gross 6.5250458956202465250458956202465250459, displayed 6.53x; net 4.8830317335431418830317335431418830317, displayed 4.88x; cover 3.2927461139896373056994818652849740933, displayed 3.29x; FCF/debt 0.075562700964630225080385852090032154341 | x for first three; fraction for last | Financial foundation (CP-1); separate adopted 2024-10-18 dividend-only net leverage 6.02x |
| M01 | s01 credit multiples | 24880/3050.4; 18619/3050.4; 3050.4/1187.9922 | Gross 8.1563073695253081563073695253081563074, displayed 8.16x; net 6.1037896669289273537896669289273537897, displayed 6.10x; cover 2.5676936262712835993367633221834284771, displayed 2.57x | x | Financial foundation (CP-1); S01 |
| M02 | s02 credit multiples | 24880/1906.5; 18619/1906.5; 1906.5/1217.9844 | Gross 13.050091791240493050091791240493050092, displayed 13.05x; net 9.7660634670862837660634670862837660635, displayed 9.77x; cover 1.5652909840224554600206702154805923623, displayed 1.57x | x | Financial foundation (CP-1); S02 |
| R01 | s01 FCF / debt | 1087.4078/24880 | 0.043706101286173633440514469453376205788 | Fraction | Financial foundation (CP-1); S01 |
| R02 | s02 FCF / debt | -86.4844/24880 | -0.0034760610932475884244372990353697749196 | Fraction | Financial foundation (CP-1); S02 |
| B01 | FCF-zero break, unchanged I | 1880/3813; E at break=3813-1880 | Decline 0.49305009179124049305009179124049305009, displayed 49.31%; E 1933 | Fraction / %; USD millions | Financial foundation (CP-1) |
| B02 | EBITDA equals net interest, unchanged I | E-I=3813-1158=2655; 2655/3813 | Decline 0.69630212431156569630212431156569630212, displayed 69.63%; E 1158 | Fraction / %; USD millions | Financial foundation (CP-1) |
| B03 | Gross-leverage watch break | D/8=24880/8=3110; E-3110=703; 703/3813 | Decline 0.18436926304746918436926304746918436926, displayed 18.44%; E 3110 | Fraction / %; USD millions | Financial foundation (CP-1); analyst watch 8x |
| B04 | Net-interest coverage watch break | 2I=1158×2=2316; E-2316=1497; 1497/3813 | Decline 0.39260424862313139260424862313139260425, displayed 39.26%; E 2316 | Fraction / %; USD millions | Financial foundation (CP-1); analyst watch 2x |
| B05 | FCF-zero break with s01 interest overlay | 1880-29.9922=1850.0078; 1850.0078/3813 | 0.48518431681091004458431681091004458432 | Decline fraction | Financial foundation (CP-1); S01 |
| B06 | FCF-zero break with s02 interest overlay | 1880-59.9844=1820.0156; 1820.0156/3813 | 0.47731854183057959611854183057959611854 | Decline fraction | Financial foundation (CP-1); S02 |

## Gaps

| Issue | Effect on downside conclusion | Severity | Evidence boundary / resolution | Source |
|---|---|---|---|---|
| Static rather than timed stress | A favorable operating break distance is not proof of avoiding a cash or refinancing failure | MATERIAL | Debt/cash fixed; no cash offset, working-capital shock or maturity repayment in scenario FCF; obtain timing-specific cash and funding data | Financial foundation (CP-1); T2DS.9 |
| Empirical shock calibration | Cannot assign likelihood, default probability or an operating-volume equivalent to the chosen earnings shocks | MATERIAL | Source-derived break anchors support testing, not historical-cycle calibration | Earnings changes (CP-1B); Fundamental credit (CP-2) |
| Interest proxy | Cash interest sensitivity is not a forecast contractual payment schedule | MINOR | Net paid base and disclosed incremental-cost sensitivity; no modeled receipts or hedge roll-off | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| Unscheduled catalysts | New extraction, acquisition, rating or refinancing announcement dates are not established | MINOR | Qualitative event monitoring only until dated disclosure exists | Source readiness (CP-0); Fundamental credit (CP-2) |
| Retrospective evidence | Findings cannot be represented as a contemporaneously executable September investment view | Scope restriction | Annual report published after the cutoff; later quarterly operations and disputed quotes are not used | Source readiness (CP-0) |
| Legal and security decisions | No covenant breach threshold, capacity, LGD/recovery amount, final relative value or security recommendation | Scope restriction | Analyst watches do not substitute for operative tests or claim-level priority evidence | Source readiness (CP-0); Fundamental credit (CP-2) |
| Indirect analytical context | Detailed external demand research, recurring-cost challenge and legal conclusions were not independently supplied to this analysis | Scope restriction | Use Fundamental credit’s bounded synthesis only; no external peer stress or legal calibration is inferred | Fundamental credit (CP-2) |

## Next module
The orchestrator selects the next module.