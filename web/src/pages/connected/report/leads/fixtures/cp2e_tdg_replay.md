# CP-2E

## Request
TransDigm Group Incorporated as of 2024-09-30.

## Sources

- TDG market quotes 2024-09-30.md fc1e0d6fe55bf91fa3ac3ef6f7791e5c04f8f9089d5cdf079177b9c7f88f7aea
- TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6
- TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2
- TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6
- TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f
- TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af
- d496141dex101.htm.jsonl f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3
- d739389dex101.htm.jsonl 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547
- d826058dex41.htm.jsonl 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4
- d833756dex101.htm.jsonl 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac
- d887611dex101.htm.jsonl e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8
- d887611dex41.htm.jsonl 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c
- context 62c37d80723b96ed14a1b54402b92ba662c7b4d30976d6266ec0e1857d64d0db
- CP-0 4148ec2ae29d3269cd1912423f3a35e708c7f07cd13c0d726e6d493c49e03d93
- CP-1 e587b905d8d8aba6ac6b40efd45f80d29c378375f6cbe22fe98f221d149b1b1b
- CP-1A 824a503671d272fc54993a79022bfa981e138a74fa41215693c3e1b6e5a3eb11
- CP-2 15a130ef62109e6e49a22fdafdfa7d1bbaa872672fc9bddfeeefb592c20232f8

## Findings

### Bottom line

Macro risk is moderate and concentrated in rates: USD 5,789 million of floating debt is unhedged and the swaps and cap fixing another USD 3,400 million expire by 2025-09-30, so creditors face rising, not falling, cash-interest sensitivity into FY2026.

A +100 bp move in Term SOFR on today's unhedged balance costs about USD 57.89 million a year, 3.08% of FY2024 free cash flow, which the business absorbs easily; the issuer's own figure is about USD 30 million and the gap is not reconciled. The credit point is the hedge cliff: after 2025-09-30 protection rests on USD 2,938 million of collars, and after 2027-09-30 on nothing, while the term loans run to 2032. FX and input-cost risk are second-order: the issuer says a 10% FX move would not materially affect net income, and margins widened through FY2024 inflation. No ESG or transition factor is credit-material today, and no sustainability-linked debt was found.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 73–74; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176; Financial foundation (CP-1); calculation R3; calculation R5; calculation R6; calculation R12; calculation R16

### Key findings

- Rate exposure is the largest unhedged macro exposure, and it is moderate in size. Floating debt is USD 9,189 million of principal (four term loan tranches and the securitization), 36.67% of gross principal; disclosed swaps and the cap cover USD 3,400 million, leaving USD 5,789 million unhedged, 23.27% of total debt at carrying value. The term loans have no floor, so cash interest moves one-for-one with Term SOFR above zero on that unhedged balance.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176; Financial foundation (CP-1); calculation R1; calculation R2; calculation R3; calculation R4; calculation R10

- Existing hedges are effective today but short-dated, which creates a dated cliff rather than durable protection. The swaps and cap have disclosed notional, fixed SOFR rate or strike, effective and maturity dates, and qualify as effective cash-flow hedges; 58.82% of that notional matures on 2025-03-31 and the rest on 2025-09-30. Their replacement is forward-starting collars of USD 2,938 million from 2025-09-30, falling to USD 2,888 million from 2026-09-30, with nothing disclosed beyond 2027-09-30, against term loans maturing from 2028 to 2032.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 176–177; Financial foundation (CP-1); calculation R11; calculation R12; calculation R13

- The cash-flow sensitivity is affordable but grows as hedges roll off. On the unhedged balance a +100 bp move costs USD 57.89 million, about 3.08% of FY2024 free cash flow of USD 1,880 million; if Term SOFR stays above the collar ceilings, the post-2025-09-30 figure is USD 62.51 million, and with no hedges after 2027-09-30 it is USD 91.89 million on unchanged balances. That lands on top of a scheduled interest step-up to USD 1,524 million, so rates add to, rather than create, the coverage pressure already identified.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2); calculation R5; calculation R14; calculation R15; calculation R16

- The issuer's own +1 pp sensitivity of about USD 30 million is about half the method figure, and the documents do not explain why. The issuer's 77% fixed-rate share ties to our build only if the USD 3,400 million of swaps and cap are counted as fixed, so the hedge treatment is consistent; the gap of USD 27.89 million may reflect an averaging or forward-hedge convention the filing does not state. We carry the higher figure as the conservative bound.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; calculation R6; calculation R8; calculation R9

- FX exposure is mainly translation and small transaction flows, not a debt-currency mismatch. All debt is in US dollars; foreign subsidiaries trade mainly in sterling and euro; sales to foreign customers were about USD 2.9 billion, but their invoicing currency is not stated. Forwards of USD 120 million cover up to twelve months, FX losses in cost of sales were USD 20 million, and the issuer states a 10% FX move would not have had a material effect on FY2024 net income.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 73–74; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 178; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46; calculation R17; calculation R18

- Input-cost inflation is passed through by pricing power rather than contract, and FY2024 shows it working. Gross margin rose to 58.8% from 58.3% despite inflation in freight, labour and raw materials; no indexation or surcharge clause is disclosed, and the risk factors say margins suffer if increases cannot be passed on. Certification limits supplier substitution, so the residual risk is supply disruption more than cost.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 12–13; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 24; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46

- No ESG factor is credit-material today; the one Watch item is regulation that curbs air travel. Direct and purchased-energy emissions are low because plants do assembly and light manufacturing, carbon cost on operations is not expected to be material, and environmental compliance did not materially affect FY2024 capex or cash flow. Regulation that suppresses air travel would hit the commercial aftermarket, the highest-margin channel, ahead of the FY2028 refinancing.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 13; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 24–25; Business & governance (CP-1A)

### Contrary evidence and what would change the view

The strongest case for a lower rating of macro risk is that the issuer runs an explicit policy of at least 75% fixed-rate debt and has replaced hedges before they lapsed: it added collars in FY2023 and again in the third quarter of FY2024, and the hedges are expected to reduce interest expense by about USD 25 million over the next twelve months. On that reading the 2025 expiries will simply be rolled, as the collars already partly do, and the unhedged share will stay near 23.27%. Against that, the collar ceilings of 3.50% and 4.50% protect only above those levels and expire in 2027, and a debt-funded distribution policy that adds floating term loans, as Tranche L did in September 2024, mechanically raises floating exposure. The view would move to Low if new swaps or collars extending beyond 2027 were disclosed or the fixed share rose clearly above the target; it would move to High if the fixed share fell below 75%, if further floating-rate debt funded distributions without new hedges, or if the securitization were renewed at a wider margin while the revolver was drawn.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 175–178; Business & governance (CP-1A); calculation R4

### Limitations

- The +100 bp figure rests on the method's hedged-versus-unhedged arithmetic, which the issuer's own disclosure of about USD 30 million contradicts by USD 27.89 million; if the issuer's convention is right, the sensitivity conclusion halves and the rate risk would sit nearer Low than Moderate.
- The unhedged percentage divides floating principal by total debt at carrying value, so it mixes bases; on gross principal the share would be slightly lower, which does not change the Moderate level but means the 23.27% is an upper-side figure.
- Hedges are not linked to named tranches, and the swap all-in rates quoted in the derivatives note embed a legacy margin of 3.25% that is higher than current tranche margins; the conclusion that the swaps fix the base rate on USD 3,400 million of term loans therefore relies on the note's general linkage to Credit Agreement borrowings.
- The invoicing currency of the USD 2.9 billion of foreign-customer sales and the currency split of cash are not stated, so the conclusion that FX is second-order rests on the issuer's 10% sensitivity statement rather than a built mismatch; a large non-dollar cost base would weaken it.
- The environmental remediation accrual was not located in the pages read, so the ESG conclusion that remediation is immaterial rests on management's statement, not an amount.

### Macro and hedging view

Overall, TransDigm has moderate macro and hedging sensitivity. Unhedged floating-rate debt is USD 5,789 million, 23.27% of total debt, and a +100 bp move would raise cash interest by about USD 57.89 million on current balances, rising to USD 91.89 million once all disclosed hedges have expired. FX and raw-material risk appear manageable because all debt is dollar-denominated, the issuer reports no material FX effect on net income from a 10% move, and margins widened through FY2024 inflation. The main credit implication is free cash flow durability and refinancing cost: rate risk compounds the scheduled interest step-up and grows into the FY2028 refinancing window rather than shrinking. Further analysis requires the hedge-to-tranche mapping, the issuer's sensitivity method and the currency mix of sales and costs. Rates, FX & hedging completed with limitations. Macro risk level: Moderate. Key gaps: issuer sensitivity conflict, currency mix of sales and cash, remediation accrual.
Basis: calculation R4; calculation R5; calculation R15; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 73–74; Fundamental credit (CP-2)

The downside path runs as follows. The initiating condition is Term SOFR staying high while the swaps expire on 2025-03-31 and 2025-09-30. The first break is that USD 3,400 million of fixed base rate reverts to floating, protected only above the 3.50% and 4.50% collar ceilings. Financially, cash interest rises on top of the scheduled USD 1,524 million, compressing free cash flow at the same time as pro forma liquidity is USD 2,919 million after the 2024-10-18 dividend payment. The leverage and refinancing consequence is weaker coverage going into the FY2028 maturities. The observable triggers are the fixed-rate share in each quarterly filing falling below 75% and the absence of new hedges disclosed by the quarter ending around 2025-03-31.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176; Financial foundation (CP-1); Fundamental credit (CP-2)

### Credit implication

The highest-priority ESG or transition factor is regulation that would curb air travel, and it is a Watch item, not a current credit driver. It would act through commercial aftermarket volumes, about 31% of sales and the highest-margin channel, so it is an operating and refinancing-access channel, not a liquidity or recovery channel today. Direct carbon cost is immaterial to credit because emissions are low and the issuer expects no material impact from carbon regulation on its plants. Physical climate risk to facilities is acknowledged but not sized. No sustainability-linked or green debt was found, so no margin ratchet or spread effect applies. The decisive uncertainty is the absence of any quantified remediation accrual or emissions data in the pages read. The monitoring condition is any adopted rule restricting flight activity before the FY2028 maturities. The single driver for committee debate is aviation-demand regulation acting through aftermarket EBITDA.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 24–25; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13; Business & governance (CP-1A)

### Macro-exposure summary

Rates dominate; the other exposures are small or offset.

| Exposure | Size | Hedge or offset | Status | Creditor consequence | Source |
|---|---|---|---|---|---|
| Unhedged floating-rate debt | USD 5,789m (23.27% of total debt) | None | Calculated | +100 bp costs USD 57.89m | calculation R3 |
| Hedged floating-rate debt | USD 3,400m | Swaps and cap to 2025-09-30 | Effective where supported | Cliff in 2025 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Forward collars | USD 2,938m from 2025-09-30 | Ceilings 3.50% and 4.50% | Partial | Protection only above ceiling | calculation R12 |
| FX transaction | USD 120m forwards; FX losses USD 20m | Forwards up to twelve months | Partial | Not material to net income per issuer | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 178 |
| Input-cost inflation | Raw materials and components inventory USD 1,314m | Pricing power, no indexation | Lagged recovery | Margin rose in FY2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |

### Events: Hedges

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2023-03-31 | day | 2024-11-07 | Interest rate swaps (USD 2,700m notional) and cap (USD 700m) became effective | Historical — effective date of the swap and cap agreements | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 | Source of the USD 3,400m hedged floating debt at the as-of date |
| 2025-03-31 | day | 2024-11-07 | USD 2,000m of swaps mature; USD 1,100m collar (2.00% floor, 3.50% ceiling) starts | Scheduled — maturity date and effective date per the swap and collar tables | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 | First hedge cliff; fixed protection replaced by narrower collar |
| 2025-09-30 | day | 2024-11-07 | USD 700m swap and USD 700m cap mature; USD 500m collar (2.00%/3.50%) and USD 1,338m collar (2.50%/4.50%) start | Scheduled — maturity date and effective date per the swap, cap and collar tables | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 | All fixing hedges gone; only collars protect, USD 2,938m |
| 2026-09-30 | day | 2024-11-07 | USD 1,100m and USD 500m collars mature; USD 1,550m collar (2.50%/4.50%) starts | Scheduled — maturity date and effective date per the collar table | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 | Protection shifts to the higher 4.50% ceiling, USD 2,888m |
| 2027-09-30 | day | 2024-11-07 | USD 1,338m and USD 1,550m collars mature; no later hedge disclosed | Scheduled — maturity date per the collar table | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 | Floating debt fully exposed ahead of FY2028 maturities |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 14 |
| Calculated | 9 |
| Assumption-Based | 2 |
| Analyst Inference | 3 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 4 |
| Fields present | 13 |
| Fields total | 15 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 1 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

Register scope: the debt and rate exposure register, the macro sensitivity summary and the macro gaps ledger are not written; their content is carried in the hedging, unhedged-exposure and sensitivity registers, in Calculations and in Gaps. Module status: Ready with Limitations (rates and hedges fully supported; FX currency mix and remediation amounts partial).

#### Evidence trace

<!-- table-id: evidence_trace -->
| Evidence ID | Fact | Lineage | Source |
|---|---|---|---|
| EV1 | Term loans USD 8,702m and securitization USD 487m exposed to Term SOFR; fixed-rate target at least 75%; about 77% of gross debt fixed; +1 pp raises annual interest about USD 30m; weighted average rate 6.5% | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| EV2 | Swap, cap and collar terms by notional, effective date, maturity and rate | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| EV3 | Hedges qualify as effective cash-flow hedges; derivative assets USD 57m and liabilities USD 10m net; about USD 25m net gain to be reclassified into interest expense in twelve months | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 177–178 |
| EV4 | Swap counterparties may accelerate settlement on a Credit Agreement default | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 175 |
| EV5 | FX: sterling and euro subsidiaries; USD 120m forwards selling dollars for Canadian dollar and euro, maximum twelve months; 10% move not material to net income | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 73–74, 178 |
| EV6 | Foreign customer sales about USD 2.9bn; repatriation restrictions listed as a risk | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 26 |
| EV7 | Raw materials from multiple suppliers; FY2024 cost increases stabilised; certification limits substitution; pass-through risk | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 12–13, 24 |
| EV8 | Gross margin 58.8% against 58.3% despite inflation; FX losses USD 20m against USD 14m | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 46 |
| EV9 | Environmental laws, superfund sites under remediation, no material FY2024 impact; about 16,600 employees, 17% unionised, agreements to January 2029 | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| EV10 | Climate regulation risk, low direct emissions, 50% reduction target by 2031 against FY2019, air-travel regulation risk, physical climate risk to sites | Directly Sourced (self-reported) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 24–25 |
| EV11 | Debt instruments, currency, margins, maturities; free cash flow USD 1,880m; scheduled interest USD 1,524m; pro forma liquidity USD 2,919m after 2024-10-18 | Directly Sourced via prior analysis | Financial foundation (CP-1) |

#### T2F.1 Source register

<!-- table-id: T2F.1 -->
| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use | Source |
|---|---|---|---|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Form 10-K FY2024, audited | High | FY ended 2024-09-30; filed 2024-11-07 | TransDigm Group Incorporated consolidated | Floating debt, fixed-rate target, hedge terms, FX forwards, FX and rate sensitivity statements, raw materials, inflation, environmental, climate, labour | Hedges not mapped to tranches; currency mix of sales not stated; remediation accrual not read | All registers in this analysis | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 73–74 |
| Financial foundation | Financial foundation for this run | High | FY2024; pro forma 2024-10-18 | Consolidated | Instrument principal, rate type, margins, currency, total debt carrying value 24,880, free cash flow, scheduled interest | Covenant definitions not established | Debt base and cash-flow denominators | Financial foundation (CP-1) |
| Business & governance | Business and governance analysis for this run | High | FY2024 | Consolidated | End-market mix, union share, fixed-rate policy | Proxy not supplied | Transmission channels and governance reference | Business & governance (CP-1A) |
| Fundamental credit | Fundamental credit synthesis for this run | Medium | FY2024 with FY2025 schedule | Consolidated | Interest step-up USD 366m, free cash flow after step-up | Analyst illustrations | Downside linkage | Fundamental credit (CP-2) |
| Source readiness | Source readiness for this run | High | As of 2024-09-30 | Effective source set | Gate partial; no executed debt documents, ratings or prices | Summary only | Source gate | Source readiness (CP-0) |

#### T2F.3 Hedging register

<!-- table-id: T2F.3 -->
| Hedge Type | Notional | Instrument Covered | Rate / Strike | Maturity | Coverage Status | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| Interest-rate swap | USD 500m | Term SOFR borrowings under the Credit Agreement (term loans) | Fixes Term SOFR at 3.00% (stated all-in 6.25% with legacy 3.25% margin) | 2025-03-31 | Effective where supported | EV2; EV3 | Tranche not named; stated margin above current 2.50% to 2.75% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Interest-rate swap | USD 1,500m | Term SOFR borrowings under the Credit Agreement | Fixes Term SOFR at 3.10% (stated all-in 6.35%) | 2025-03-31 | Effective where supported | EV2; EV3 | Tranche not named | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Interest-rate swap | USD 700m | Term SOFR borrowings under the Credit Agreement | Fixes Term SOFR at 1.30% (stated all-in 4.55%) | 2025-09-30 | Effective where supported | EV2; EV3 | Tranche not named | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Interest-rate cap | USD 700m | Term SOFR borrowings under the Credit Agreement | Three-month Term SOFR strike 1.25% | 2025-09-30 | Effective where supported | EV2; EV3 | Counted as fixed in the issuer's 77% share (calculation R9); overlap with the USD 700m swap not ruled out by the text | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Collar | USD 1,100m | Term SOFR borrowings under the Credit Agreement | Floor 2.00%, ceiling 3.50%; effective 2025-03-31 | 2026-09-30 | Partial | EV2 | Forward-starting; no protection between floor and ceiling | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Collar | USD 500m | Term SOFR borrowings under the Credit Agreement | Floor 2.00%, ceiling 3.50%; effective 2025-09-30 | 2026-09-30 | Partial | EV2 | Forward-starting | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Collar | USD 1,338m | Term SOFR borrowings under the Credit Agreement | Floor 2.50%, ceiling 4.50%; effective 2025-09-30 | 2027-09-30 | Partial | EV2 | Forward-starting; ends before any term loan maturity | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Collar | USD 1,550m | Term SOFR borrowings under the Credit Agreement | Floor 2.50%, ceiling 4.50%; effective 2026-09-30 | 2027-09-30 | Maturity mismatch | EV2 | Hedge ends 2027 while Tranches J, K and L run to 2030–2032 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| FX forward | USD 120m | Forecast Canadian dollar and euro transactions (sell US dollars) | Not supplied: forward rates not stated | Up to twelve months from 2024-09-30 | Notional disclosed only | EV5 | Rates and exposure covered not disclosed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 178 |
| Fixed-rate debt | USD 15,600m principal of nine note issues | Secured and subordinated notes 2027–2033 | Fixed coupons 4.625% to 7.125% | 2027 to 2033 | Effective where supported | EV11 | Refinancing at market coupons from 2027 | Financial foundation (CP-1) |
| Natural hedge (sales currency) | Not supplied: currency split of sales not stated | Sterling and euro subsidiary sales against local costs | Not applicable: operational offset | Ongoing | Terms insufficient | EV5; EV6 | Not quantifiable from the documents | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |

Notional is not effectiveness: swap and cap effectiveness rests on their accounting designation and disclosed terms; derivative fair values (assets USD 57m, liabilities USD 10m) are not cash protection.

#### T2F.4 Unhedged floating-rate exposure

<!-- table-id: T2F.4 -->
| Metric | Amount | Formula / Source | Status | Credit Implication | Source Trace | Source |
|---|---|---|---|---|---|---|
| Total debt | USD 24,880m | Carrying value: current portion 98 + securitization 486 + long-term debt 24,296 | Reported | Denominator for the unhedged share; principal is USD 25,068m | EV11 | Financial foundation (CP-1) |
| Gross floating-rate debt | USD 9,189m | Term loans 8,702 + securitization 487 (principal); revolver undrawn | Calculated | 36.67% of gross principal is Term SOFR-linked, no floor | EV1; calculation R1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| Hedged floating-rate debt | USD 3,400m | Swaps 500 + 1,500 + 700 + cap 700 in force at 2024-09-30; forward collars excluded | Calculated | Protection ends by 2025-09-30 | EV2; calculation R2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| Unhedged floating-rate debt | USD 5,789m | Gross floating-rate debt − Hedged floating-rate debt | Calculated | Direct cash-interest exposure to Term SOFR; rises after the 2024-10-16 securitization draw of USD 162.5m (subsequent event) | calculation R3 | calculation R3 |
| Unhedged debt percentage | 23.27% | Unhedged floating-rate debt / Total debt | Calculated | Within the issuer's 25% floating allowance today; rises as hedges expire | calculation R4 | calculation R4 |

#### T2F.5 Rate sensitivity

<!-- table-id: T2F.5 -->
| Sensitivity | Formula | Source Inputs | Estimated Cash Impact | FCF / Liquidity Implication | Status | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| +100 bps cash-interest impact | Unhedged floating-rate debt × 1.00% | USD 5,789m unhedged at 2024-09-30 | USD 57.89m | 3.08% of FY2024 free cash flow of USD 1,880m; adds to the scheduled interest of USD 1,524m; small against pro forma liquidity of USD 2,919m after 2024-10-18 | Calculated | calculation R5; calculation R16 | calculation R5 |
| Issuer-stated +1 pp sensitivity | Issuer: one percentage point on term loan and securitization borrowings | Outstanding borrowings at 2024-09-30 | USD 30m (approximate) | Half the method figure; method not disclosed | Reported; conflicts with method figure by USD 27.89m | EV1; calculation R6 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| +100 bps after swap and cap expiry (from 2025-09-30) | (Gross floating − collars in force) × 1.00%, assuming Term SOFR above collar ceilings and unchanged balances | USD 9,189m less USD 2,938m collars | USD 62.51m | Free cash flow sensitivity rises as protection narrows | Assumption-Based | calculation R12; calculation R14 | calculation R14 |
| +100 bps after all disclosed hedges expire (from 2027-09-30) | Gross floating × 1.00%, unchanged balances | USD 9,189m | USD 91.89m | Exposure peaks just before the FY2028 maturities of USD 6,637m | Assumption-Based | calculation R15 | calculation R15 |
| Hedge reclassification benefit, next twelve months | Issuer estimate of net gains reclassified into interest expense | Fair values at 2024-09-30 | USD 25m reduction in interest expense (approximate) | Benefit ends with the 2025 expiries | Reported | EV3 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 178 |

#### T2F.6 FX exposure register

<!-- table-id: T2F.6 -->
| Exposure Type | Revenue Currency / Region | Cost Currency / Region | Debt / EBITDA / Cash / Covenant Currency | Natural Hedge? | Evidence | Risk Mechanic | Credit Implication | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| Translation exposure | Foreign subsidiaries, mainly sterling and euro | Same subsidiaries, local currencies | Debt all USD; EBITDA reported in USD; covenant currency USD | Partial | Issuer states dollar moves can affect net sales, net income and carrying values of non-US assets | Stronger dollar lowers reported EBITDA from foreign subsidiaries while debt is unchanged | Small leverage drift; issuer says a 10% move would not have been material to FY2024 net income | EV5 | Share of EBITDA from foreign subsidiaries not stated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 73–74 |
| Transaction exposure | Purchases and sales with third parties in Canadian dollar and euro | Not supplied: cost currency split not stated | USD | Partial | Forwards of USD 120m, up to twelve months; FX losses in cost of sales USD 20m against USD 14m | Unhedged flows beyond twelve months move gross margin | Immaterial to cash flow at current size | EV5; EV8 | Exposure base for the forwards not stated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 178 |
| Foreign customer sales | About USD 2.9bn to foreign customers (36.52% of net sales) | Not supplied: not stated | USD | Insufficient Information: invoicing currency not stated | Risk factor lists currency fluctuations | Not inferred from geography; may be dollar-invoiced | No conclusion drawn | EV6; calculation R17 | Currency of invoicing not disclosed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 26 |
| Cash repatriation constraint | Non-US operations | Non-US operations | Cash currency split not stated | Insufficient Information: cash by jurisdiction not stated | Restrictions on repatriation listed as a risk | Trapped cash would reduce usable liquidity | Watch only; no amount disclosed | EV6 | No cash-by-jurisdiction data | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 26 |
| Covenant currency mismatch | Not applicable: covenant tests in USD | Not applicable: covenant tests in USD | All debt and covenant tests in USD | Yes | Every instrument is dollar-denominated | No mismatch between debt and reporting currency | No covenant FX risk | EV11 | Executed agreements not supplied | Financial foundation (CP-1) |

#### T2F.7 Commodity and inflation register

<!-- table-id: T2F.7 -->
| Input / Commodity / Inflation Driver | Cost Exposure | Pass-Through Mechanism | Evidence | Risk Mechanic | Credit Implication | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| Raw-material exposure | Raw materials and purchased components inventory USD 1,314m; cost of sales USD 3,268m (41.2% of sales) | Lagged recovery through value-based pricing; no indexation disclosed | Multiple suppliers; costs stabilised during FY2024; margin rose to 58.8% | Unrecovered increases would squeeze gross margin | Low FCF risk while pricing power holds | EV7; EV8 | Commodity mix and spend not stated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 12, 46 |
| Procurement exposure (supply availability) | Lean inventories of components | None: certification limits supplier substitution | Disruptions affected the business, though not materially; could continue in FY2025 | Shortage stops shipments rather than raising cost | Volume and working-capital timing risk | EV7 | Supplier concentration not quantified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 12–13 |
| Labour / wage inflation | About 16,600 employees; 17% unionised; agreements expire up to January 2029 | Lagged recovery through pricing and productivity | Selling and administrative costs excluding specific items fell to 9.3% of sales despite inflation | Wage settlements lift fixed cost | Absorbed in FY2024 | EV9; EV8 | Labour cost amount not stated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| Freight exposure | Inflation in freight cited in Airframe results | Lagged recovery | Airframe EBITDA As Defined rose despite freight, labour and raw-material inflation | Freight spikes compress margin | Not material in FY2024 | EV7 | Freight spend not stated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 51 |
| Energy exposure | Assembly and light manufacturing; low direct emissions | Insufficient Information: energy cost and contracts not stated | Issuer describes low energy-intensive operations | Energy shocks touch margin lightly | Immaterial on present evidence | EV10 | No energy spend disclosed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Tariffs and trade policy | Imported raw materials | None disclosed | Risk factor: tariff and import-export changes may affect availability and pricing | Cost or availability shock | Watch | EV7 | Not quantified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 24 |

#### T2G.1 ESG disclosure inventory

<!-- table-id: T2G.1 -->
| Source | Reliability (audited/assured vs self-reported) | Greenwashing Flag | Module Status | Source |
|---|---|---|---|---|
| 2024 annual report, environmental matters and climate risk factors | Self-reported narrative in an audited filing; emissions data not assured in pages read | Low: emissions target stated without interim data, no claim used as creditor protection | Completed with Limitations | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 13, 24–25 |
| 2024 annual report, human capital and safety reporting | Self-reported | None identified | Completed with Limitations | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| Debt descriptions in Financial foundation | Audited debt note | No green or sustainability-linked label found | Not applicable for sustainability-linked mechanics | Financial foundation (CP-1) |

#### T2G.2 Transition risk register

<!-- table-id: T2G.2 -->
| Exposure | Source/Date | Transmission Mechanic | Affected Driver | Evidence ID | Source |
|---|---|---|---|---|---|
| Carbon regulation of own operations | Annual report 2024-11-07 | Compliance cost on plants; issuer expects no material impact given low direct emissions | Margin (negligible) | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Regulation curbing air travel | Annual report 2024-11-07 | Fewer flight hours reduce commercial aftermarket demand | Revenue and EBITDA in the highest-margin channel | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Physical climate risk to facilities | Annual report 2024-11-07 | Storms, fires, sea-level and water stress disrupt production; insurance may not cover all costs | Volume, capex and repair cost | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 25–26 |
| Environmental remediation (superfund sites) | Annual report 2024-11-07 | Remediation spend; FY2024 compliance not material to capex or cash flow | Cash outflow (not quantified) | EV9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| Emissions reduction target (50% by 2031 against FY2019) | Annual report 2024-11-07 | Efficiency and green-power spend | Capex (not quantified) | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |

#### T2G.3 Social event-risk register

<!-- table-id: T2G.3 -->
| Exposure | Source/Date | Transmission Mechanic | Event-Risk vs Ongoing | Evidence ID | Source |
|---|---|---|---|---|---|
| Labour relations (17% unionised, agreements to January 2029) | Annual report 2024-11-07 | Strike halts shipments at affected plants | Event-risk | EV9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| Health and safety (monthly EHS reporting to executives) | Annual report 2024-11-07 | Incidents bring penalties or shutdowns | Event-risk | EV9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 13, 16 |
| Supplier disruption and quality failures | Annual report 2024-11-07 | Certification delays replacement, stopping sales | Ongoing | EV7 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 24 |
| Governance and distribution conduct | Business & governance analysis | Covered there (risk level High); not repeated here | Ongoing | EV11 | Business & governance (CP-1A) |

#### T2G.4 Materiality table

<!-- table-id: T2G.4 -->
| Factor | Materiality Class | Transmission Basis | Catalyst (if Watch) | Evidence ID | Source |
|---|---|---|---|---|---|
| Regulation curbing air travel | Watch | Aftermarket volume, about 31% of sales | Adopted rule restricting flight activity before FY2028 | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Physical climate risk to facilities | Watch | Production disruption, uninsured cost | Severe-weather loss at a major plant | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Carbon cost on own operations | Immaterial to Credit | Low direct emissions; issuer expects no material impact | Not applicable: immaterial | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Environmental remediation | Insufficient Information: accrual amount not read | Cash outflow; management says not material | Accrual disclosure showing a material increase | EV9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| Labour relations | Immaterial to Credit | Minority unionised; no dispute disclosed | Not applicable: immaterial | EV9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 13 |
| Emissions target spend | Immaterial to Credit | Spend not sized; light-manufacturing footprint | Not applicable: immaterial | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |

#### T2G.5 KPI / SPT / ratchet table

<!-- table-id: T2G.5 -->
| Instrument | KPI | SPT + Test Date | Ratchet (direction; bps) | Symmetry | Credit-Meaningful? | Expected Spread Effect | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| No sustainability-linked or green instrument found among the term loans, notes, revolver or securitization | Not applicable: no sustainability-linked instrument | Not applicable: no sustainability-linked instrument | Not applicable: no ratchet | Not applicable: no ratchet | No: no ratchet exists | None: no margin mechanism | EV11 | Financial foundation (CP-1) |

#### T2G.6 Demand and access implications

<!-- table-id: T2G.6 -->
| Effect | Direction | Quantified vs Directional | Linked Maturity/Funding Need | Evidence ID | Source |
|---|---|---|---|---|---|
| ESG investor exclusion or greenium on TransDigm debt | Neutral: no evidence of either in the documents | Directional | FY2028 maturities of USD 6,637m | EV11 | Financial foundation (CP-1) |
| Air-travel regulation weakening aftermarket earnings before refinancing | Negative if triggered | Directional | FY2028 maturities of USD 6,637m; securitization renewal 2025-07-11 | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |

#### T2G.7 ESG credit implication table

<!-- table-id: T2G.7 -->
| Material Factor | Risk Mechanic | Credit Implication | Confidence | Evidence ID | Source |
|---|---|---|---|---|---|
| Regulation curbing air travel (Watch) | Lower flight hours cut the highest-margin aftermarket sales | Would weaken coverage and refinancing terms into FY2028; no current effect on PD or LGD | Medium | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Physical climate risk (Watch) | Plant disruption and uninsured repair cost | Event risk to quarterly EBITDA; no liquidity effect evidenced | Low | EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 25 |
| Carbon, labour and emissions-target spend (Immaterial) | No sized transmission | No credit effect | High | EV9; EV10 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 13, 25 |

#### T2G.8 ESG gaps ledger

<!-- table-id: T2G.8 -->
| Gap | Missing Item | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Remediation accrual | Environmental accrual amount and site count in the commitments note | Would size a cash outflow | Remediation left unclassified | Read the commitments and contingencies note |
| Emissions data | Absolute emissions and progress against the FY2019 baseline | Tests the self-reported low-emissions claim | Greenwashing flag kept at Low on narrative only | Obtain the issuer sustainability report |
| Physical-risk sizing | Share of plants or EBITDA in exposed regions; insurance limits | Would move the factor from Watch to Directional | Kept at Watch | Obtain insurance and site data |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| R1 | Gross floating-rate debt | 8,702 term loans + 487 securitization | 9,189 | 2024-09-30, USD million principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| R2 | Hedged floating-rate debt (swaps and cap in force) | 500 + 1,500 + 700 + 700 | 3,400 | 2024-09-30, USD million notional | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| R3 | Unhedged floating-rate debt | 9,189 − 3,400 | 5,789 | 2024-09-30, USD million | calculation R1; calculation R2 |
| R4 | Unhedged debt percentage | 5,789 / 24,880 | 0.2327 (23.27%) | 2024-09-30, ratio | calculation R3; Financial foundation (CP-1) |
| R5 | +100 bps cash-interest impact | 5,789 × 0.01 | 57.89 | Annual, USD million | calculation R3 |
| R6 | Method figure less issuer-stated sensitivity | 57.89 − 30 | 27.89 (not reconciled) | Annual, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| R7 | Principal of nine fixed-rate note issues | 2,650 + 2,100 + 1,200 + 2,750 + 750 + 1,450 + 1,000 + 2,200 + 1,500 | 15,600 | 2024-09-30, USD million | Financial foundation (CP-1) |
| R8 | Fixed or fixed-equivalent debt | 15,600 notes + 262 finance leases + 17 government advances + 3,400 hedged | 19,279 | 2024-09-30, USD million principal | calculation R7; calculation R2 |
| R9 | Fixed share of gross principal | 19,279 / 25,068 | 0.7691 (76.91%; ties to issuer's about 77%) | 2024-09-30, ratio | calculation R8; Financial foundation (CP-1) |
| R10 | Floating share of gross principal | 9,189 / 25,068 | 0.3666 (36.67%) | 2024-09-30, ratio | calculation R1 |
| R11 | Share of hedge notional maturing 2025-03-31 | 2,000 / 3,400 | 0.5882 (58.82%) | Ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| R12 | Collar notional in force from 2025-09-30 | 1,100 + 500 + 1,338 | 2,938 | From 2025-09-30, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| R13 | Collar notional in force from 2026-09-30 | 1,338 + 1,550 | 2,888 | From 2026-09-30, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| R14 | Floating debt outside collars and its +100 bps cost (assumes Term SOFR above ceilings, balances unchanged) | (9,189 − 2,938) × 0.01 | 6,251; 62.51 | From 2025-09-30, USD million | calculation R12 |
| R15 | +100 bps on all floating debt after last hedge expiry (balances unchanged) | 9,189 × 0.01 | 91.89 | From 2027-09-30, USD million | calculation R1 |
| R16 | +100 bps impact / FY2024 free cash flow | 57.89 / 1,880 | 0.0308 (3.08%) | FY2024, ratio | calculation R5; Financial foundation (CP-1) |
| R17 | Foreign customer sales / net sales | 2,900 / 7,940 | 0.3652 (36.52%) | FY2024, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 26 |
| R18 | FX forward notional / foreign customer sales | 120 / 2,900 | 0.0414 (4.14%) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 178 |

The unhedged share divides principal by carrying value because the method fixes total debt at carrying value. The post-expiry figures assume balances stay as at 2024-09-30 and that Term SOFR stays above the collar ceilings; they show how sensitivity changes, not a forecast.

## Gaps

| Gap | Why it matters | Conclusion affected | Severity |
|---|---|---|---|
| Issuer's +1 pp sensitivity of about USD 30 million against the method figure of USD 57.89 million, not reconciled | Doubles or halves the rate sensitivity | Rate sensitivity size; Moderate level holds either way | Material |
| Hedges not mapped to named term loan tranches; swap all-in rates use a legacy 3.25% margin | Linkage of hedge to debt rests on general wording | Hedged amount of USD 3,400 million | Minor |
| Invoicing currency of foreign-customer sales, cost currency split and cash by jurisdiction not stated | FX mismatch cannot be built | FX view relies on the issuer's 10% statement | Minor |
| Environmental remediation accrual amount not read | Remediation cash outflow unsized | Remediation left unclassified | Minor |
| No hedges disclosed beyond 2027-09-30 and no statement of plans to replace the 2025 expiries | Future protection unknown | Post-expiry sensitivity uses unchanged balances | Minor |
| Hedge terms at later dates were not checked against the December 2024 quarterly report | A new hedge after the as-of date would reduce the cliff | Hedge cliff timing | Minor |
| Use restriction | These results describe rate, FX, input-cost and ESG sensitivity only; they are not a forecast of rates, a hedge recommendation or a covenant measure | All conclusions | Minor |

## Next module

The orchestrator selects the next module.
