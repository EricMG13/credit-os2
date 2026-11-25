---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-1D
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-copilot-sol-medium
pathway: deep_credit_assessment
artifact_name: tdg_CP-1D_20240930.md
committee_status: Requires More Work
---

## Request
TransDigm Group Incorporated, as of 2024-09-30; pathway: deep_credit_assessment. Challenge the inherited FY2024 adjusted-EBITDA bridge, test recurrence and cash conversion, and build an evidence-led analytical debt adjustment with leverage sensitivities.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended September 30, 2024 | 2024-11-07, signature and auditor-report date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Retrospective adjustment descriptions, additional recurrence history, cash reconciliation, pension, lease, preferred-stock and distribution obligations |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted issuer, date, sources and retrospective scope |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Inherited earnings bridge, debt, pension and lease amounts, cash flows, ratios and event boundaries; no replacement extraction |
| Earnings changes | CP-1B | 1af1e57aa799c5d037f3be75ff5096331d4c858997317462b21965138174d55d | Numeric and issuer-label checks, adjustment growth, cash-flow grouping and multi-role conflicts |

## Findings

### Bottom line
TransDigm's adjusted EBITDA overstates the earnings base appropriate for recurring-credit analysis: repeated acquisition, compensation and refinancing costs warrant exclusion from analytical add-backs, raising gross leverage and reducing the apparent creditor cushion. The supported-only FY2024 denominator is USD 3,813 million, versus issuer EBITDA As Defined of USD 4,173 million.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164; calculation Q01

This rejects USD 345 million of adjustments for recurring-credit purposes and leaves USD 15 million unresolved, rather than assuming it is worthless. On inherited carrying debt, leverage is 6.53x on supported-only earnings versus 5.96x on the issuer-adjusted measure. Adding operating leases, pension deficits and the declared common dividend payable raises analytical obligations to USD 29,164 million and leverage to 7.65x; that last measure includes committed shareholder cash use, not merely financing debt.
Basis: calculation Q01; calculation Q04; calculation Q05; Financial foundation (CP-1)

### Key findings
- **Recurrence, not failed synergy execution, drives the challenge.** Acquisition/integration, combined compensation and refinancing adjustments appear in FY2022 and FY2023 as well as FY2024. The documents identify incurred costs, not a separately quantified future synergy claim. Treating them as permanently absent would understate the ongoing cost of TransDigm's acquisition and financing model.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164
- **Conversion improves, but adjusted EBITDA is not spendable cash.** Operating cash conversion of issuer-adjusted EBITDA rises to 49.01% from 40.50%. The FY2024 USD 2,128 million gap reconciles through interest, current taxes, operating-balance changes, loss-contract amortization and remaining adjustments; it is not evidence that the entire gap represents fictitious earnings.
Basis: calculation Q02; calculation Q03; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71
- **Committed distributions matter much more than omitted conventional financing obligations.** Operating leases and net pension deficits lift financing-style adjusted debt only to USD 24,948 million. The separately identified USD 4,216 million declared common dividend payable is the dominant additional near-term claim on resources. Including it as a committed cash obligation prevents the pre-payment balance sheet from overstating creditor protection.
Basis: calculation Q04; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170; Financial foundation (CP-1)

### Contrary evidence and what would change the view
The strongest counterargument is that compensation expense is described as noncash, acquisition charges relate to completed transactions, and refinancing can reduce future funding costs. Improved cash conversion also corroborates real earnings generation. Those facts support measuring pre-compensation or transaction-adjusted performance for specific purposes, but do not establish that recurrent costs disappear from a continuing acquisition-led business. Disaggregated completed-project evidence showing costs cease, together with sustained conversion after interest, taxes and working capital, could justify specific additions rather than wholesale acceptance of the issuer's categories.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164; calculation Q02

A narrower financing-debt convention would exclude the dividend payable and is a valid comparator, not a contradiction. It produces 6.54x on supported-only earnings, showing that the large numerator adjustment is a committed-cash-use judgement rather than concealed borrowing. Payment of the dividend would require removing its payable from this analytical numerator; retaining it while also reducing cash for payment would double count the same obligation.
Basis: calculation Q04; calculation Q05; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170

### Limitations
- The rejection applies to recurring aggregate cost categories, not to an assertion that every individual acquisition or refinancing charge repeats. This limits the conclusion to a sustainable-credit earnings convention; it does not invalidate management's transaction-specific presentation.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164
- The mixed other adjustment cannot be settled component by component. Consequently, supported-only earnings are an evidence-bounded case, not a fully adjudicated estimate of recurring earnings, and the remaining amount stays unresolved rather than rejected.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72
- The obligation-inclusive numerator is a quantified minimum under the stated convention. Unseparated deferred compensation, conditional dividend equivalents and potential undisclosed financing arrangements prevent a claim that every debt-like obligation has been valued; no agency-equivalent or covenant debt measure is established.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–144; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170; Source readiness (CP-0)

### Earnings quality

| Measure | FY2023 / comparator | FY2024 / analytical case | Change or sensitivity | Creditor consequence | Source |
|---|---|---|---|---|---|
| Issuer EBITDA As Defined | USD 3,395 million | USD 4,173 million | Includes USD 360 million FY2024 adjustments | Not the recurring-credit denominator | Financial foundation (CP-1) |
| Supported-only analytical EBITDA | Not calculated: prior-year quality restatement outside selected current bridge | USD 3,813 million | USD 345 million rejected; USD 15 million unresolved | No accepted incremental add-backs | Q01; Financial foundation (CP-1) |
| CFO / issuer-adjusted EBITDA | 40.50% | 49.01% | +8.51 percentage points | Better conversion, still after substantial cash obligations | Q02; Q03 |
| Carrying debt / EBITDA | 5.96x on issuer-adjusted earnings | 6.53x on supported-only earnings | +0.57x using displayed ratios | Recurring costs materially reduce earnings cushion | Q05; Financial foundation (CP-1) |
| Financing-style adjusted debt | USD 24,880 million carrying debt | USD 24,948 million | Adds USD 62 million operating leases and USD 6 million pension deficit | 6.54x supported-only leverage | Q04; Q05; Financial foundation (CP-1) |
| Committed-obligation-inclusive debt | USD 24,880 million carrying debt | USD 29,164 million | Adds USD 4,216 million common dividend payable as well as leases and pensions | 7.65x supported-only leverage; not borrowing-only leverage | Q04; Q05; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170 |

### Earnings quality read-through
The recurring-cost test is deliberately different from a cash test. Noncash compensation is supported as an accounting adjustment to cash flow, but remains consideration for employees in the sustainable earnings assessment. Acquisition and refinancing expenses are supported as incurred actions; their repeated occurrence undermines their exclusion from the earnings base of an acquisitive, actively financed group. No unclaimed synergy or arbitrary percentage haircut is introduced. The unresolved mixed category is treated separately from rejected categories so that lack of detail cannot masquerade as either acceptance or proven overstatement.
Basis: Financial foundation (CP-1); Earnings changes (CP-1B); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164

### Adjusted debt read-through
The debt build starts from inherited carrying debt, retaining finance leases, receivables financing and refundable government advances already included. Operating-lease liabilities are already on the balance sheet under the US GAAP ASC 842 convention but outside financial debt, so they are added once at present value. Net pension underfunding is added without a cash-tax offset. The common dividend payable is a separate committed shareholder payment, included because it is an identified claim on near-term resources. Operating rent remains deducted from earnings; this is a conservative obligation-to-earnings comparison, not lease-adjusted EBITDAR. The numerator is neither reported debt nor covenant debt.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 155; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 170–172

### Downside and monitoring
The first break would be acquisition and integration spending continuing while acquired operations fail to improve collections or absorb overhead. With recurring compensation and financing costs still payable economically, weaker operating conversion would reduce funds available for debt service before adjusted EBITDA necessarily reveals the pressure. After committed shareholder payments, incremental borrowing could replace the missing cash, worsening leverage ahead of the receivables-facility refinancing. Monitor continuing acquisition adjustments after integration, renewed receivable and inventory cash absorption, deferred-compensation cash payments and additional distributions. No numerical tolerance for an acceptable leverage delta was supplied, so none is invented.
Basis: Financial foundation (CP-1); Earnings changes (CP-1B); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72

### Analytical appendix — complete canonical registers

All register monetary amounts are consolidated USD millions unless explicitly stated. FY2024 and FY2023 bridge amounts, reported debt and previously established obligations are inherited unchanged. FY2022 recurrence observations supplement that history; they do not replace the inherited bridge. Local add-back identifiers below organize exact issuer labels and do not claim to be pre-existing identifiers.

### Evidence references

| Evidence ID | Evidence and analytical role | Source |
|---|---|---|
| E1 | Exact inherited acquisition/integration label and FY2024/FY2023 amounts; issuer description of costs incurred and FY2022 recurrence | Financial foundation (CP-1); Earnings changes (CP-1B); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164 |
| E2 | Combined noncash compensation label, recognized plan expense and three-year recurrence | Financial foundation (CP-1); Earnings changes (CP-1B); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164 |
| E3 | Refinancing expense is not cash paid; issuer identifies issuances, extinguishments and amendments; three-year recurrence | Financial foundation (CP-1); Earnings changes (CP-1B); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164 |
| E4 | Other net combines FX, payroll withholding, pension, deferred-compensation payments and miscellaneous income/expense | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164 |
| E5 | Inherited cash, EBITDA, debt and cash-bridge definitions; separate complete issuer cash bridge | Financial foundation (CP-1); Earnings changes (CP-1B); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| E6 | Operating leases outside financial debt, finance leases within financial debt; present values and expense treatment | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 171–172 |
| E7 | Inherited USD 6 million net pension deficit; US and non-US funded status corroborate the amount | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 155 |
| E8 | Declared common dividend payable and separate future dividend-equivalent accruals; subsequent October payment is not September cash flow | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170 |
| E9 | No preferred stock outstanding; no contingent-consideration or supplier-finance quantum established by targeted search | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 161; Source readiness (CP-0) |

### T1D.1 Add-Back Register

| Add-Back ID | Description | Amount | Period | Category | Source / Locator | Management Rationale | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| A1 | Acquisition transaction and integration-related expenses | 70 | FY2024; FY2023 comparator 18 | Incurred acquisition, integration, relocation, transaction and inventory-step-up costs | Inherited issuer bridge; no revised transcription | Excludes described acquisition-related costs from performance measure; no separate synergy target | E1 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72 |
| A2 | Non-cash stock and deferred compensation expense | 217 | FY2024; FY2023 comparator 157 | Combined compensation; not stock-only expense | Inherited issuer bridge; no revised transcription | Recognized expense under stock incentive and deferred-compensation plans | E2 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72 |
| A3 | Refinancing costs | 58 | FY2024; FY2023 comparator 56 | Financing expense | Inherited issuer bridge; no revised transcription | Excludes costs expensed on debt-financing transactions | E3 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72 |
| A4 | Other, net | 15 | FY2024; FY2023 comparator 16 | Mixed income and expense | Inherited issuer bridge; no revised transcription | Excludes heterogeneous FX, payroll, pension, compensation and miscellaneous items | E4 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72 |

### T1D.2 Achievability Assessment

| Add-Back ID | Achievability Basis | Actions Taken To Date | Run-Rate Claimed | Realized To Date | Time To Realize | Evidence Quality | Countervailing Evidence | Assessment | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Costs actually incurred; no claimed prospective synergy amount | Acquisitions and integration activity occurred; cost expense and purchase accounting recorded | Not supplied: no savings target | Not supplied: realized cash savings not quantified | Not supplied: project completion dates | High for incurred costs; insufficient for lasting savings | Same category in both prior years; costs mix cash and noncash roles | Rejected as a sustainable recurring-credit add-back, not disputed as an incurred cost | E1 |
| A2 | Compensation already recognized, rather than intended action | Stock and deferred-compensation plans generated recorded expense | Not supplied: no savings target | Noncash expense recognition supported; permanent cash savings not established | Not supplied: future payment or replacement schedule | High for expense recognition | Compensation recurs; deferred-compensation payments also appear in other net | Rejected for recurring-credit earnings; noncash cash-flow treatment remains supported | E2; E4 |
| A3 | Debt-financing transactions executed and expense recognized | Issuances, refinancings and amendments occurred | Not supplied: no quantified saving linked to this adjustment | Expense incurred; total cash cost and attributable future savings not established | Not supplied: expense-to-saving payback | High for expense; insufficient for cash-saving attribution | Recurs in FY2022 and FY2023; P&L cost is not financing cash-paid line | Rejected as recurring financing-model cost | E3 |
| A4 | Mixed incurred items, not a discrete operational action | FX and compensation-related transactions described only in aggregate | Not supplied: no target | Not supplied: component realization amounts | Not supplied: component timing | Insufficient for component judgement | Net category includes both gains and expenses and possible cash payments | Challenged; [Insufficient Information]; unresolved 15, neither accepted nor rejected | E4 |

### T1D.3 Recurrence Test

| Add-Back ID | Claimed Non-Recurring | Prior Occurrences (periods) | Recurrence Pattern | Verdict | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| A1 | Not explicitly claimed; exclusion tested for sustainable earnings | FY2022 18; FY2023 18 | FY2024 70; same category in two prior years | Recurring aggregate category | Serial acquisition costs accompany the strategy even when individual deals differ. | Excluding the entire category understates ongoing economic cost. | E1 |
| A2 | Not explicitly claimed; described as noncash | FY2022 184; FY2023 157 | FY2024 217; repeated compensation | Recurring | Noncash recognition does not mean employee consideration ceases. | Retain expense in recurring-credit earnings; do not confuse it with near-term cash outflow. | E2 |
| A3 | Not explicitly claimed; financing exclusion | FY2022 1; FY2023 56 | FY2024 58; repeated debt activity | Recurring aggregate category | Frequent refinancing creates repeated costs, even if maturities extend. | Financing-model costs reduce sustainable earnings capacity. | E3 |
| A4 | Not explicitly claimed; mixed exclusion | FY2022 -13; FY2023 16 | FY2024 15; category recurs but changes sign and composition | Recurring category; individual components unresolved | Netting obscures cash obligations and potentially legitimate unusual items. | Do not accept or reject the aggregate without component evidence. | E4 |

### T1D.4 Quality-Adjusted EBITDA Bridge

| Step | Amount | Basis | Supported / Challenged / Rejected | Cumulative EBITDA | Evidence ID |
|---|---|---|---|---|---|
| Issuer EBITDA As Defined starting point | 4173 | Inherited, unchanged; issuer measure | Starting reference, not analytical endorsement | 4173 | E5 |
| Remove acquisition/integration add-back | -70 | Recurrent category in both prior years | Rejected for recurring-credit earnings | 4103 | E1; Q01 |
| Remove compensation add-back | -217 | Recurrent remuneration | Rejected for recurring-credit earnings | 3886 | E2; Q01 |
| Remove refinancing add-back | -58 | Recurrent financing-model expense | Rejected for recurring-credit earnings | 3828 | E3; Q01 |
| Segregate unresolved other net | -15 | Excluded only from supported-only case; not a rejection | Challenged; unresolved 15 | 3813 | E4; Q01 |
| Supported-only analytical EBITDA | 3813 | Equals inherited reported EBITDA because no incremental category is accepted | Supported-only case, not reported under a new definition or covenant EBITDA | 3813 | E5; Q01 |
| Conditional full acceptance of unresolved net amount | +15 | Sensitivity only, not the selected supported-only case | Challenged; not evidence-supported acceptance | 3828 | E4; Q01 |

### T1D.5 Cash Conversion Test

| Period | Adjusted EBITDA | CFO | Conversion % | Gap | Explanation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| FY2024 | 4173 | 2045 | 49.01% | 2128 | Issuer grouping: 272 operating-balance changes +1246 interest excluding debt-cost amortization +490 current taxes +35 loss-contract amortization +70 acquisition costs +15 other =2128. Compensation and refinancing cancel algebraically between the two issuer bridge stages. | Cash conversion is burdened by financing and taxes as well as operating balances; cancellation does not establish zero economic cost. | Improved conversion corroborates cash generation, not all add-backs. | E5; Q02; Q03 |
| FY2023 | 3395 | 1375 | 40.50% | 2020 | Same grouping: 415 +1123 +414 +34 +18 +16 =2020. Do not substitute the cash-flow statement's differently grouped 431 operating-balance use. | Lower prior conversion partly reflects greater balance absorption. | Improvement is not proof that the new level persists without continued cash discipline. | E5; Q02; Q03 |

### T1D.6 Leverage Sensitivity

| Metric | On Reported EBITDA | On Adjusted EBITDA | On Quality-Adjusted EBITDA | Delta (turns) | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| FY2024 inherited carrying debt 24880 / annual EBITDA | 6.53x; denominator 3813 | 5.96x; denominator 4173 | 6.53x supported-only; denominator 3813 | +0.57x supported-only versus issuer-adjusted, using displayed ratios | Recurring costs remove the apparent earnings cushion. | E5; Q05 |
| Same debt if unresolved other is accepted | 6.53x reference | 5.96x reference | 6.50x; denominator 3828; conditional only | Not selected: unresolved adjustment remains challenged | Residual uncertainty does not overturn the recurring-cost conclusion. | E4; Q05 |

### T1D.7 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| G1 | Component amounts and cash/noncash split of other net | Mixture prevents evidence-led acceptance or rejection | 15 remains unresolved; supported-only case excludes it without a rejection | Component ledger with nature, cash date and reason for exclusion |
| G2 | Project-level cessation and realized savings for acquisition costs; cash timing for combined compensation and financing costs | Incurred actions do not prove lasting savings | Rejection is category-level recurring-credit judgement, not a finding every transaction expense repeats | Completed-project evidence and compensation/refinancing cash schedules |
| G3 | Agency methodology and issuer adjustments | Agency equivalence cannot be inferred from issuer non-GAAP labels | No agency-adjusted or covenant denominator asserted | Dated issuer-specific agency treatment before comparing definitions |

### T1E.1 Obligation Inventory

| Item | Category | Reported Amount | Period | Source / Locator | Disclosure Quality | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| Carrying financial debt | Inherited starting debt | 24880 | 2024-09-30 | Inherited financial debt aggregation | High | E5 | Financial foundation (CP-1) |
| Operating leases | Recognized lease liabilities outside financial debt | 62 | 2024-09-30 | Lease note; already on balance sheet | High | E6 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 171–172 |
| Finance leases | Lease debt already included | 262 | 2024-09-30 | Detailed current and long-term debt classification | High; narrative classification conflict resolved by Financial foundation | E6 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 171–172 |
| Net pension deficit | Underfunded defined benefit plans | 6 | 2024-09-30 | Net recognized US and non-US deficits | High for net amount; plan-level gross deficits not fully assessed | E7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 155 |
| Receivables securitization | Funded debt already included | 486 carrying; 487 printed gross; 487.5 narrative draw | 2024-09-30 | Preserve different precision and roles | High; no precision repair | E5 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 144 |
| Government refundable advances | Conditional funding already included | 17 | 2024-09-30 | Inherited debt register | High for carrying amount | E5 | Financial foundation (CP-1) |
| Declared common dividend payable | Committed shareholder cash obligation | 4216 | 2024-09-30; paid October 2024 | Declaration, payable and later payment are separate roles | High | E8 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170 |
| Future dividend equivalents | Compensation-related distribution accrual | Current 180; non-current 47; total 227 | 2024-09-30 | October payment 132 is a separate disclosed event amount | High for accrual; insufficient for vesting and overlap reconciliation | E8; Q04 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170 |
| Other deferred compensation | Potential future compensation cash claim | Not supplied: liability not separately quantified | 2024-09-30 | Expense and general compensation liabilities do not establish separate debt-like stock | Insufficient | E2; E4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 144 |
| Preferred shares | Potential hybrid funding | None outstanding, explicitly stated | 2024-09-30 and 2023-09-30 | Equity note | High | E9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 161 |
| Factoring, reverse factoring, other securitization, hybrids, earn-outs and put liabilities | Potential additional obligations | Not supplied: no separately supported quantum identified | 2024-09-30 | Targeted searches and supplied inventory do not prove absence | Insufficient | E9 | Source readiness (CP-0) |

### T1E.2 Debt-Like Assessment

| Item | Debt-Like? | Basis for Treatment | Adjustment Amount | Convention Applied | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Operating leases | Yes | Contractual discounted payments are financing-like obligations. | +62 | ASC 842 US GAAP; recognized on balance sheet outside financial debt; present value added once; no rent uplift to EBITDA | Operating expenses already include rent; measure is conservative, not EBITDAR-based | E6 |
| Net pension deficit | Yes | Recognized benefit obligations exceed plan assets. | +6 | Net funded deficit; no tax discount; not gross benefit obligation | Contribution timing differs from immediate debt maturity; netting across plans limits precision | E7 |
| Finance leases, receivables funding, government advances | Already included | Inherited debt already carries these obligations. | No incremental addition; not a missing or zero-valued obligation | Carrying-value starting convention retained | Principal and carrying amounts differ; detailed finance-lease total governs over narrative | E5; E6 |
| Common dividend payable | Yes under committed-cash-obligation convention | Declared liability with subsequently documented payment. | +4216 | Separate shareholder-payment obligation, not reclassified reported borrowing | Financing-only convention excludes it; payment must remove payable to avoid double counting | E8 |
| Future dividend equivalents | Conditional | Accrued amount is known, but vesting, timing and relationship to October payment are not sufficiently reconciled. | Not supplied: no supported incremental debt adjustment | Keep 227 accrual visible; no automatic addition of all compensation liabilities | Could be a genuine cash claim beyond the common dividend; not treated as zero | E8 |
| Other deferred compensation | Potentially | Cash payments are named but separate liability and funding are not established. | Not supplied: unquantified | No expense multiple or blanket capitalization | Noncash current expense is not proof of no future cash obligation | E2; E4 |
| Preferred shares | No outstanding instrument identified | Explicit statement of no preferred outstanding. | No addition required | Authorized capacity is not funded debt | Does not establish absence of every possible hybrid | E9 |
| Other potential arrangements | Unresolved | No quantum or recourse terms established. | Not supplied: unquantified | No default capitalization or absence assumption | Targeted search is not an exhaustive financing audit | E9 |

### T1E.3 Adjusted Debt Bridge

| Step | Amount | Basis | Cumulative Adjusted Debt | Evidence ID |
|---|---|---|---|---|
| Inherited carrying financial debt | 24880 | Finance leases, securitization and government advances already included; do not restore principal discounts in this carrying-value convention | 24880 | E5 |
| Add operating-lease present value | +62 | On balance sheet but outside financial debt | 24942 | E6; Q04 |
| Add net pension deficit | +6 | Quantified financing-style adjustment | 24948 | E7; Q04 |
| Financing-style adjusted-debt subtotal | 24948 | Alternative narrow convention, not a further addition | 24948 | Q04 |
| Add declared common dividend payable | +4216 | Committed near-term shareholder payment; September obligation, not October cash-flow adjustment | 29164 | E8; Q04 |
| Quantified obligation-inclusive analytical debt | 29164 | Selected broad convention; excludes unquantified and conditional items without treating them as zero | 29164 | Q04 |

### T1E.4 Leverage Restatement

| Metric | On Reported Debt | On Adjusted Debt | Delta (turns) | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| FY2024 debt / supported-only analytical EBITDA 3813 | 6.53x on 24880 | 7.65x on 29164 | +1.12x; exact increment 4284 /3813 rounded | Committed distribution dominates added obligations. | Creditor protection is weaker than borrowing-only leverage implies. | Q04; Q05 |
| Financing-style debt / supported-only analytical EBITDA 3813 | 6.53x | 6.54x on 24948 | Direction only: modest increase | Leases and pensions add only limited disclosed obligations. | Conventional omitted financing obligations do not drive the main risk judgement. | Q04; Q05 |
| Obligation-inclusive debt / issuer EBITDA As Defined 4173 | 5.96x | 6.99x on 29164 | Direction only: material increase | Both numerator and earnings-definition choices matter. | Neither issuer-adjusted earnings nor financing-only debt captures committed cash-use pressure alone. | Q05; E5 |

### T1E.5 Convention Reconciliation

| Item | Agency / Convention | Their Treatment | This Analysis | Divergence Rationale | Evidence ID |
|---|---|---|---|---|---|
| Operating leases | US GAAP ASC 842 versus analytical debt | GAAP liability already recognized outside financial debt; issuer-specific agency convention not supplied | Add 62 to financial debt without rent add-back | Recognizes contractual obligations once; not a claim of agency comparability | E6 |
| Pensions | Net-deficit analytical convention | Issuer-specific agency grossing and tax treatment not supplied | Add inherited net deficit 6 | No unsupported gross-up, tax haircut or contribution multiple | E7 |
| Declared dividend payable | Committed-resource convention versus financial-debt convention | Financial foundation excludes payable from borrowing debt and separately models subsequent payment; agency treatment not supplied | Add 4216 to broad September obligations; also show narrow financing subtotal | Same cash claim viewed at declaration, not both a payable addition and a post-payment cash reduction | E8 |
| Carrying versus principal debt | Inherited balance-sheet convention | Principal exceeds carrying amounts; no issuer-specific agency treatment supplied | Retain carrying start; no restoration of debt costs or discounts | Isolates quality and omitted-obligation effects without changing inherited debt identity | E5 |
| All adjustments | Agency equivalence | Not supplied: dated issuer agency methodology | No agency-adjusted leverage claimed | Reasoned analytical conventions are not evidence of agency methodology | E9 |

### T1E.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| G4 | Dividend-equivalent vesting/payment schedule and linkage of 227 accrued to October 132 payment; separate other deferred-compensation liability | Avoids adding contingent employee claims or overlapping paid amounts incorrectly | Broad debt is a quantified minimum, not a complete valuation of compensation-linked obligations | Liability and vesting reconciliation with cash timing and funding |
| G5 | Recourse and quantum for potential factoring, reverse factoring, earn-outs, put liabilities and other hybrids | Absence cannot be inferred from no located amount | No invented zero or default multiple; completeness of debt-like exposure remains conditional | Specific arrangement disclosures and recourse terms |
| G6 | Issuer-specific agency adjustments and acceptable leverage-delta tolerance | No basis for declaring agency equivalence or exceeding an agreed tolerance | Analytical ratios only; no agency trigger or covenant capacity | Dated methodology and an explicit analytical tolerance if required |
| G7 | Individual-plan gross pension deficits and restricted surplus access | Net deficit may offset plans whose resources cannot be shared | Net 6 is a limited quantified convention, not gross pension debt | Plan-level deficits and transferability before gross pension restatement |

### Verification

| Check | Result | Explanation |
|---|---|---|
| Inherited bridge and debt identity | PASS | Exact labels and amounts retained; no replacement extraction of established values. |
| Complete add-back coverage | PASS | Every disclosed FY2024 category assessed; FY2023 comparators retained and FY2022 recurrence added only where needed. |
| Evidence of action rather than intention | PASS | Incurred transactions and expense recognition distinguished from unsupported future savings. |
| Named-prior-period recurrence | PASS | FY2022 and FY2023 tested for every category, including signed other net. |
| Analytical bridge arithmetic | PASS | Q01 reconciles rejected amounts, unresolved amount and supported-only case. |
| Cash reconciliation | PASS | Q02 and Q03 use issuer grouping, separately from the statement's operating-balance aggregation. |
| Leverage on three earnings bases | PASS | Reported, issuer-adjusted and supported-only cases shown; identical reported/supported-only figures are explained. |
| Unresolved adjustments and obligations preserved | PASS | Unresolved net adjustment and unquantified obligations remain visible, not accepted or assigned zero. |
| Adjusted-debt registers | PASS | Inventory, treatment, bridge, ratios, conventions and gaps present; agency and contingent-item limits remain explicit. |

### Material claim lineage

| Claim | Material conclusion | Strongest lineage |
|---|---|---|
| M1 | Acquisition, compensation and refinancing categories recur in both prior years | Directly Sourced |
| M2 | Other net combines heterogeneous cash and noncash items | Directly Sourced |
| M3 | Finance leases and receivables financing are already included in inherited debt | Directly Sourced |
| M4 | Declared common dividend is a payable with later payment documented | Directly Sourced |
| M5 | Supported-only denominator is 3813 after rejecting 345 and segregating 15 | Calculated |
| M6 | Cash conversion improves to 49.01% with a fully reconciled 2128 gap | Calculated |
| M7 | Financing-style debt is 24948 and obligation-inclusive debt is 29164 | Calculated |
| M8 | Obligation-inclusive supported-only leverage is 7.65x | Calculated |
| M9 | Recurring-credit convention should retain repeated acquisition, financing and compensation costs | Analyst Inference |
| M10 | Full other-net acceptance and complete conditional/deferred obligation valuation cannot be established | Insufficient Information |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 4 |
| Calculated | 4 |
| Assumption-Based | 0 |
| Analyst Inference | 1 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 1 |
| Fields present | 94 |
| Fields total | 94 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 3 |

Field coverage counts the required register-column definitions plus the source gate; explicit reasoned missing-value entries count as present structure, not as evidence of the missing quantity. Material restrictions group unresolved earnings components and contingent/deferred obligations; minor restrictions cover agency comparison, project granularity and gross pension detail.

## Calculations

All monetary quantities are USD millions for consolidated TransDigm Group Incorporated. Ratios divide matching currency and scale; displayed multiples and percentages are rounded to two decimals. Inherited ratios remain inherited, not newly extracted. No reported cash, net debt or net leverage is quoted or recomputed here, and no subsequent-event pro forma is substituted for September obligations.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| Q01 | FY2024 analytical earnings bridge | Rejected =70+217+58; 4173-70; 4103-217; 3886-58; 3828-15 | Rejected 345; cumulative 4103, 3886, 3828, 3813; unresolved 15; conditional other-accepted case 3828 | USD millions | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164 |
| Q02 | FY2024 and FY2023 cash conversion | 2045/4173; 1375/3395; fraction ×100; displayed 49.01-40.50 | Fractions 0.49005511622334052240594296669063024203 and 0.40500736377025036818851251840942562592; 49.01% and 40.50%; displayed increase 8.51 percentage points | Fractions; %; percentage points | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| Q03 | FY2024 and FY2023 adjusted EBITDA less CFO | 4173-2045; 3395-1375; cross-check 272+1246+490+35+70+15; 415+1123+414+34+18+16 | Gaps 2128 and 2020; component sums 2128 and 2020 | USD millions | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| Q04 | 2024-09-30 adjusted obligations | 24880+62=24942; +6=24948; +4216=29164; increment 62+6+4216=4284; separate equivalent accrual 180+47 | Lease subtotal 24942; financing-style 24948; broad 29164; increment 4284; equivalent accrual 227, not added | USD millions | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 155; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 170–172 |
| Q05 | FY2024 leverage sensitivities | 24880/3828; 29164/3813; 29164/4173; 24948/3813; 4284/3813; inherited displayed 6.53-5.96 | Conditional 6.4994775339602925809822361546499477534, displayed 6.50x; broad supported-only 7.6485706792551796485706792551796485707, displayed 7.65x; broad issuer-adjusted 6.9887371195782410735681763719146896717, displayed 6.99x; financing-style 6.5428796223446105428796223446105428796, displayed 6.54x; broad increment 1.1235247836349331235247836349331235248, displayed 1.12x; denominator delta using inherited displayed ratios 0.57x | x | Q01; Q04; Financial foundation (CP-1) |

## Gaps

The open items restrict final adjustment adjudication and completeness of the analytical numerator, not the inherited annual results. The accepted label-and-amount comparisons suffice for this assessment; lack of pre-existing adjustment identifiers does not prevent the economic challenge.
Basis: Financial foundation (CP-1); Earnings changes (CP-1B)

| Gap | Severity | What remains unresolved | Effect on conclusion | Source |
|---|---|---|---|---|
| G1 | MATERIAL | Other net amount 15 lacks component amounts and cash mapping | Final recurring EBITDA not settled; supported-only case and conditional sensitivity remain separate | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 71–72 |
| G2 | MINOR | Completed-project cessation and realized savings not separately evidenced | Aggregate recurring-cost rejection cannot be generalized to every individual charge | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 164 |
| G4–G5 | MATERIAL | Dividend-equivalent conditions, separate deferred-compensation liabilities and potential additional arrangement quantum | Quantified broad obligations are not a complete maximum or agency debt figure | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–144; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 170 |
| G3; G6 | MINOR | Agency-specific conventions and an agreed leverage-delta tolerance | No agency reconciliation amount or tolerance breach asserted | Source readiness (CP-0) |
| G7 | MINOR | Plan-level deficit grossing and surplus portability | Pension addition uses only supported net deficit | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 155 |
| Temporal boundary | Scope boundary | Annual evidence was published after the assessment date | All conclusions are retrospective fiscal-year analysis, not a cutoff-public trading judgement | Source readiness (CP-0) |

## Next module
The orchestrator selects the next module.