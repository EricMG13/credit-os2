---
issuer_id: tdg
module_id: CP-3C
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
committee_status: Draft Only
artifact_name: tdg_CP-3C_20240930.md
---

## Request

Assess refinancing and liability-management risk for TransDigm Group Incorporated as of 2024-09-30 on the deep credit assessment pathway. Scope includes the maturity wall, funding gap, refinancing alternatives, coercive-transaction vulnerability and creditor-class exposure, with subsequent events shown separately.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Controlling maturity dates, principal and carrying debt, facilities, covenant summary, financing history, shareholder distributions, lease maturities and debt fair values |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 | 2025-02-04 | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Subsequent-event debt comparison and covenant-summary check; no later balance incorporated into the year-end wall |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source perimeter and authority; source and definition conflicts |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Debt reconciliation, cash, free cash flow, leverage, October pro forma adjustments |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Financial policy, ordinary refinancing history, distributions and ownership limits |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Summary-authority debt permissions, creditor ranking and unresolved coercive-transaction protections |
| Downside (CP-2A) | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | Static earnings/interest stress and refinancing transmission |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Twelve-month bridge, facility access and annual operating-cash assumptions |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Blocked historical quote inference; transcribed loan observations are not used to establish refinancing access |

## Findings

### Bottom line

TransDigm's near-term refinancing pressure is low and ordinary consensual refinancing is the most credible path, but repeated secured borrowing for shareholder distributions leaves subordinated creditors exposed to recovery dilution well before a maturity-driven crisis.

The first major term-debt maturity is in November 2027, within the FY2028 principal wall of USD 6,637 million; FY2028 and FY2029 together require USD 11,405 million. The short-term exception is receivables funding due in July 2025. The one-year carrying-value funding gap is USD 0 million, both at the balance-sheet date and separately after the October distribution and facility draw. That does not make distributions benign: issuer pro forma cash liquidity falls to USD 2,919 million after the payment. Overall near-term coercive-LME vulnerability is Low because ordinary funding remains plausible, not because creditor protections against an uptier or asset transfer have been established.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56–63; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 153; calculation C2; calculation C6; calculation C7; calculation C11

### Key findings

- Maturity concentration is deferred, not eliminated. The November 2027 subordinated maturity begins a refinancing sequence followed by secured notes and Tranche I in FY2028, then both secured and subordinated notes in FY2029. Earlier completion of substantial refinancings supports a consensual path; waiting until the wall approaches would expose the subordinated class first to any market closure.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53, 59–60; Financial foundation (CP-1)

- The receivables facility is a renewal concentration, not an immediate solvency gap. Its USD 487.5 million year-end draw increased to USD 650 million on 2024-10-16; renewal is conditional on no termination event. Cash repayment is a credible alternative, but would consume liquidity rather than solve the longer-dated debt wall.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–65; Liquidity (CP-2D)

- Ordinary secured layering is the demonstrated creditor-adverse mechanism. The September financing added USD 3,000 million of secured debt alongside a distribution, while an earlier secured refinancing retired subordinated paper. These transactions increase claims ahead of the remaining subordinated notes without demonstrating coercion, non-pro-rata treatment or any intention to undertake an LME.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53–54; Business & governance (CP-1A)

- Market evidence supports a bounded feasibility judgement, not an executable refinancing price. The annual report's note fair values are based on quoted market prices and do not indicate broad principal distress; its loan valuation uses agent information. These disclosures strengthen the ordinary-refinancing case independently of the unverified quote transcription, but establish neither new-issue yields nor committed market funding.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Market-implied risk (CP-3D)

### Contrary evidence and what would change the view

The strongest challenge to a low-pressure assessment is financial policy: strong free cash flow does not necessarily accumulate for debt repayment when distributions and acquisitions rank ahead of it. Downside shows that a 20% EBITDA decline can leave cash generation positive while pushing pro forma net leverage to 7.53x and interest coverage to 1.96x. A downturn could therefore close unsecured refinancing before liquidity is exhausted, making a secured takeout or maturity extension more attractive and increasing junior-creditor loss severity. A further debt-funded distribution during earnings deterioration, a failed receivables renewal, or an announced exchange with unequal priority would overturn the benign path assessment. Conversely, retained cash and early refinancing of the November 2027 notes would reduce dependence on a favourable market window.
Basis: Business & governance (CP-1A); Downside (CP-2A); Liquidity (CP-2D)

### Limitations

- The Low vulnerability conclusion addresses current funding pressure, not resistance to coercion: the evidence does not establish whether an uptier, selective exchange or asset transfer could legally be implemented, so those paths cannot be assigned executable capacity or transaction likelihood.
- The ranking of consensual refinancing as the most credible path rests on completed issuance and filed fair values rather than authenticated new-issue terms; it cannot establish the coupon, size or certainty of a future takeout.
- The one-year zero-gap result is a debt-funding test, not a cash-retention forecast: it excludes the declared dividend from the primary balance-sheet calculation and therefore must be read with the separate October pro forma test and the broader Liquidity bridge.
- Instrument-level financing costs are not allocated among the term-loan tranches or their annual instalments. This prevents a complete carrying-value ladder by individual tranche and year, but does not prevent the aggregate current-debt funding test or the contractual-principal maturity analysis.
- Recovery exposure is directional: without a valuation and enforceable transaction mechanics, the subordinated class can be identified as the most exposed but no recovery percentage, fulcrum or security recommendation is established.

### Liquidity view

The supported distinction is between low immediate refinancing need and persistent capital-allocation risk. Cash and the surviving revolver backstop cover current debt even without relying on refinancing the receivables facility. The October payment reduces the cushion but does not reverse that result. The subsequent quarterly debt comparison identifies a larger receivables draw, not replacement of the term-debt wall. Refinancing risk should therefore be monitored through cash retention, new secured issuance and progress on the earliest subordinated maturity, rather than inferred from the final maturity dates alone.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–65; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 19–20; calculation C1; calculation C7; calculation C11

### Refinancing paths

| Preferred path / alternative | Feasibility and direction | Why it works | Main constraint | Exposed class | Source |
|---|---|---|---|---|---|
| Consensual refinancing; renew receivables funding or repay it, then refinance term debt ahead of November 2027 | Medium; Stable; most credible | Completed FY2024 note issuance, extensions and repricings establish demonstrated access | No future financing commitment or authenticated new-issue economics | Subordinated notes if refinanced with secured debt | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53–56 |
| Amend and extend | Medium; Stable | A term-loan extension was completed in FY2024 | Future lender consent and economics not established | Extending lenders bear longer exposure; holdouts depend on voting protections | Business & governance (CP-1A); Legal & covenants (CP-4) |
| Secured takeout / additional pari secured debt | Medium; Stable | Summary permits incremental facilities subject to tests and willing lenders; secured-for-subordinated refinancing demonstrated | Exact remaining debt/lien capacity not established | Subordinated notes first; existing secured creditors through dilution | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53, 61–62 |
| Coercive exchange, uptier or asset-transfer financing | Insufficient Information; no intent established | Potential stress alternatives only | Required voting, sacred-right, investment and release provisions not established | Non-participants and creditors losing collateral reach | Legal & covenants (CP-4) |

### Chart data: refinancing need

| Period | Debt maturing | Committed resources | Reporting unit | Basis and limitation |
|---|---|---|---|---|
| FY2025 | 580 | 7104 | US$m | Principal ladder 93 plus rounded securitization principal 487; excludes lease cash payments. Resources are balance-sheet cash 6261 plus revolver availability 843, allocated only here; expiring securitization availability excluded. Annual report pages 55, 59, 62, 153; calculations C1 and C4. |
| FY2026 | 92 | Not supplied: no separate future resource pool | US$m | Issuer principal ladder; no reuse of FY2025 resources or assumption of cash retention. Annual report page 153. |
| FY2027 | 92 | Not supplied: no separate future resource pool | US$m | Issuer principal ladder; no term-debt bullet before November 2027, which falls in FY2028. Annual report pages 59, 153. |
| FY2028 | 6637 | Not supplied: future issuance not committed | US$m | Issuer principal ladder includes November 2027 subordinated notes and August 2028 secured maturities; no assumed refinancing counted. Annual report pages 59, 153. |
| FY2029 | 4768 | Not supplied: future issuance not committed | US$m | Issuer principal ladder; revolver expires during this fiscal year and is not assumed renewed. Annual report pages 59–60, 153. |
| FY2030 onward | 12637 | Not supplied: future resources not established | US$m | Issuer residual principal ladder; excludes finance leases and securitization; no annual split invented. Annual report page 153. |

The chart uses contractual principal, whereas the funding-gap test uses current carrying debt; the resources are not a forecast of cash retained after distributions.

### Funding gap

| Line | Amount | Drawn | Years | Committed | Currency | Scale |
|---|---|---|---|---|---|---|
| Horizon | — | — | 1 | — | USD | million |
| Cash | 6261 | — | — | — | USD | million |
| Facility: revolving credit facility | 910 | 67 | 4.4083333333333333333333333333333333333 | Yes | USD | million |
| Facility: trade receivable securitization | 650 | 487.5 | 0.78055555555555555555555555555555555556 | Yes | USD | million |
| Facility: Tranche I term loan | 1871 | 1871 | 3.9 | Yes | USD | million |
| Facility: Tranche J term loan | 3632 | 3632 | 6.4111111111111111111111111111111111111 | Yes | USD | million |
| Facility: Tranche K term loan | 1699 | 1699 | 5.4777777777777777777777777777777777778 | Yes | USD | million |
| Facility: Tranche L term loan | 1500 | 1500 | 7.3027777777777777777777777777777777778 | Yes | USD | million |
| Forecast free cash flow | 1401.1 | — | 1 | — | USD | million |
| Maturities due | 584 | — | 1 | — | USD | million |
| Available liquidity | 7104 | — | 1 | — | USD | million |
| Funding gap | 0 | — | 1 | — | USD | million |

The revolver's used amount represents letters of credit reserving commitment, not cash borrowing; this prevents treating that reserved commitment as available liquidity. Fully drawn term facilities contribute no liquidity. The securitization expires inside the horizon and contributes no undrawn funding. Forecast free cash flow is an analyst estimate reconstructed from Liquidity's operating assumptions, before debt principal, distributions, acquisitions and additional pension or lease uses. The current long-term portion is counted once for the horizon; it is not added again to the full instrument balances.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 62–65; Liquidity (CP-2D); calculation C1; calculation C2; calculation C3; calculation C7

### Events: Refinancing

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: no additional unique dated event | Not supplied: no additional unique dated event | Not supplied: no additional unique dated event | Not supplied: financing history, October events and contractual maturities are already recorded in Business & governance, Liquidity and Legal & covenants | Not supplied: no additional unique dated event | Not supplied: no additional unique dated event | Not supplied: no additional unique dated event to duplicate |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 14 |
| Calculated | 8 |
| Assumption-Based | 2 |
| Analyst Inference | 8 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 2 |
| Insufficient Information | 5 |
| Fields present | 66 |
| Fields total | 84 |
| Source gate | pass |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 2 |

### Analytical appendix — complete canonical registers

#### T3D.1 Source gate and evidence categories

| source_document_id | source_document_name | source_quality | period / date | entity_covered | data_supplied | limitation | Source |
|---|---|---|---|---|---|---|---|
| S1 | FY2024 annual report | Audited financials; issuer summary for legal terms | 2024-09-30; published 2024-11-07 | TransDigm Group consolidated; TransDigm Inc. borrower/issuer | Debt schedule, liquidity, financing history, fair values, financial policy | Executed debt documents absent; no clause-level legal authority | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53–65, 144–145, 152–153, 172–174 |
| S2 | December quarterly report | Unaudited primary filing | 2024-12-28; published 2025-02-04 | Same consolidated issuer | Comparative debt by instrument and post-year-end debt movement | Later evidence only; not a new as-of-date wall | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 19–20, 51 |
| A1 | Financial foundation and Liquidity | Accepted financial analysis | FY2024 and one-year bridge | Same issuer, USD millions | Current debt, cash, annual bridge, pro forma adjustments | Annual operating assumptions are estimates; no cash-retention commitment | Financial foundation (CP-1); Liquidity (CP-2D) |
| A2 | Business & governance and Legal & covenants | Accepted analysis; legal conclusions limited to filed summaries | As of 2024-09-30 | Same issuer | Behaviour, ranking, fourteen legal-capacity indicators | No exact baskets or coercive permissions established | Business & governance (CP-1A); Legal & covenants (CP-4) |
| A3 | Downside and Market-implied risk | Accepted static stress; historical market inference blocked | As of 2024-09-30 | Same issuer | Stress pathway and market-evidence boundary | No verified executable curve, new-issue terms or calibrated recovery | Downside (CP-2A); Market-implied risk (CP-3D) |

The minimum debt-schedule gate is met. Analysis proceeds with legal, market-execution and recovery restrictions. Filed debt fair values supplement the earlier statement that market evidence was absent; they do not authenticate the transcribed quote sheet. No separate sponsor-support assessment is supplied, so no equity backstop is inferred; observable issuer conduct remains usable.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Source readiness (CP-0); Business & governance (CP-1A); Market-implied risk (CP-3D)

#### T3D.2 Maturity wall and refinancing register

Amounts are carrying values, except that no tranche allocation is invented for the term loans. The current-portion memo row is the aggregate horizon input and overlaps the instrument balances; it must not be added to them. The aggregate debt balance excludes that memo row. Years use a stated thirty-day-month, three-hundred-sixty-day-year analytical convention, not a legal interest convention. Final maturities do not replace intervening amortisation.

| Instrument | Amount | Currency | Scale | Maturity Date | Years to Maturity | Seniority / Lien | Coupon / Margin | Fixed / Floating | Call Date | Refinancing Pressure | Credit Implication | Source Trace | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Receivables securitization | 486 | USD | million | 2025-07-11 | 0.78055555555555555555555555555555555556 | Domestic receivables security; relative priority not established | Term SOFR +1.45% | Floating | Not supplied: not a callable note | Low; nearest renewal | Repay or renew; do not treat own expiring capacity as funding | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63, 144 |
| Current long-term debt portion, memo only | 98 | USD | million | Within FY2025 | 1 | Mixed term, advances and finance leases | Mixed | Mixed | Not supplied: aggregate instalments | Low; fully counted in horizon | Count once for maturity funding, not in addition to full balances | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 145 |
| 2027 senior subordinated notes | 2641 | USD | million | 2027-11-15 | 3.125 | Unsecured senior subordinated | 5.50% | Fixed | Not supplied: redemption schedule absent | First material term-debt bullet | First exposed to unsecured-market closure | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| 2028 secured notes | 2077 | USD | million | 2028-08-15 | 3.875 | Senior secured | 6.75% | Fixed | Not supplied: redemption schedule absent | FY2028 cluster | Shared collateral does not remove rollover need | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| Tranche I | Not supplied: aggregate carrying amount only | USD | million | 2028-08-24 | 3.9 | Senior secured | Term SOFR +2.75% | Floating | Not supplied: prepayment protection absent | FY2028 cluster; principal 1871 | Extension or market takeout required beyond amortisation | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| January 2029 senior subordinated notes | 1194 | USD | million | 2029-01-15 | 4.2916666666666666666666666666666666667 | Unsecured senior subordinated | 4.625% | Fixed | Not supplied: redemption schedule absent | FY2029 cluster | Secured substitution could dilute remaining junior creditors | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| Revolving credit facility | Not supplied: no cash borrowing; LC usage 67 | USD | million | 2029-02-27 | 4.4083333333333333333333333333333333333 | Senior secured | Term SOFR +2.25%; unused fee 0.5% | Floating | Not supplied: not a callable note | Backstop expires amid FY2029 wall | No assumption of permanent availability | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2029 secured notes | 2727 | USD | million | 2029-03-01 | 4.4194444444444444444444444444444444444 | Senior secured | 6.375% | Fixed | Not supplied: redemption schedule absent | FY2029 cluster | Larger secured market requirement | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| May 2029 senior subordinated notes | 746 | USD | million | 2029-05-01 | 4.5861111111111111111111111111111111111 | Unsecured senior subordinated | 4.875% | Fixed | Not supplied: redemption schedule absent | FY2029 cluster | Follows revolver expiry and secured refinancing | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 60, 145 |
| Tranche K | Not supplied: aggregate carrying amount only | USD | million | 2030-03-22 | 5.4777777777777777777777777777777777778 | Senior secured | Term SOFR +2.75% | Floating | Not supplied: prepayment protection absent | Deferred; principal 1699 | Monitor after earlier wall is addressed | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| 2030 secured notes | 1438 | USD | million | 2030-12-15 | 6.2083333333333333333333333333333333333 | Senior secured | 6.875% | Fixed | Not supplied: redemption schedule absent | Deferred | No immediate maturity pressure | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 60, 145 |
| Tranche J | Not supplied: aggregate carrying amount only | USD | million | 2031-02-28 | 6.4111111111111111111111111111111111111 | Senior secured | Term SOFR +2.50% | Floating | Not supplied: prepayment protection absent | Deferred; principal 3632 | Largest loan tranche; amortisation reduces final bullet | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| 2031 secured notes | 984 | USD | million | 2031-12-01 | 7.1694444444444444444444444444444444444 | Senior secured | 7.125% | Fixed | Not supplied: redemption schedule absent | Deferred | No immediate maturity pressure | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 60, 145 |
| Tranche L | Not supplied: aggregate carrying amount only | USD | million | 2032-01-19 | 7.3027777777777777777777777777777777778 | Senior secured | Term SOFR +2.50% | Floating | Not supplied: prepayment protection absent | Deferred; principal 1500 | Distribution financing persists through long tenor | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| 2032 secured notes | 2180 | USD | million | 2032-03-01 | 7.4194444444444444444444444444444444444 | Senior secured | 6.625% | Fixed | Not supplied: redemption schedule absent | Deferred | No immediate maturity pressure | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 60, 145 |
| 2033 secured notes | 1486 | USD | million | 2033-01-15 | 8.2916666666666666666666666666666666667 | Senior secured | 6.00% | Fixed | Not supplied: redemption schedule absent | Deferred | No immediate maturity pressure | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 60, 145 |
| Term loans aggregate; includes instalments | 8642 | USD | million | 2028-08-24 to 2032-01-19 | Not calculable: multiple final maturities | Senior secured | As tranche rows | Floating | Not supplied: prepayment protection absent | Quarterly principal payments 22 | Aggregate carrying value preserved, no pro-rata cost allocation | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 145 |
| Government refundable advances | 17 | USD | million | Revenue-growth contingent | Not calculable: contingent repayments | Not supplied: rank/security absent | Not supplied: rate absent | Not supplied: rate type absent | Not supplied: not a callable note | Small contingent obligation | Current element already captured in memo portion | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 145, 152 |
| Finance leases | 262 | USD | million | Annual payments through thereafter | Not calculable: multiple leases | Buildings/equipment leases; lien priority not established | Weighted discount rate 7.0% | Not supplied: individual lease rate types absent | Not supplied: lease termination terms absent | Small annual service | FY2025 payment 20 includes interest; current principal 6 already in memo portion | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 145, 172 |

No springing maturity or cross-maturity acceleration was identified in the filed summaries. This is not a finding that none exists: default acceleration is expressly disclosed, while debt-document cross-default definitions and early-redemption provisions are not established.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; Legal & covenants (CP-4)

#### Definition conflicts and subsequent-event separation

| Item | As-of / first basis | Alternative / subsequent basis | Treatment and consequence | Source |
|---|---|---|---|---|
| Debt basis | Carrying debt USD 24880 million; current 98, securitization 486, non-current 24296 | Principal USD 25068 million; difference USD 188 million | Carrying debt governs funding register; principal governs contractual maturity wall. Neither is silently substituted. | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–145 |
| Principal schedule scope | USD 24319 million long-term principal schedule | Excludes securitization USD 487 million and finance leases USD 262 million | FY2025 chart adds securitization; lease cash schedule remains separate. Current carrying debt totals USD 584 million, not principal-chart USD 580 million. | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–145, 153, 172 |
| Annual instalments | Contractual obligations term payments USD 88 million | Debt maturity schedule FY2025 USD 93 million | The broader ladder can include government advances; the precise explanation of the USD 5 million difference and allocation of current costs are not established. Do not treat 93 as term-loan amortisation alone. | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 64, 145, 152–153 |
| Securitization precision | Detailed draw USD 487.5 million; undrawn USD 162.5 million | Rounded debt-table principal USD 487 million; carrying USD 486 million | Keep detailed utilization for facility availability; preserve reported whole-million debt basis for the wall. | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62, 144 |
| October distribution: one event, all disclosed roles | Annual report declaration-linked payment USD 4348 million: dividend 4216 plus equivalents 132 | Quarterly declaration-linked components USD 4347 million: 4216 plus 131; whole-quarter payments USD 4396 million | Annual report amount controls pro forma. Quarterly line exceeds it by USD 48 million; quarter scope and one-million component difference remain unreconciled. | Financial foundation (CP-1); Business & governance (CP-1A); Liquidity (CP-2D) |
| Incremental test | Annual report 7.25x total net leverage; 5.00x secured net debt | Source readiness prose says 7.50x; that is the springing maintenance test | Annual report controls; no exact legal capacity adopted. | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; Source readiness (CP-0) |
| Post-year-end refinancing scan | Year-end term-loan and note structure | December debt comparison retains same term-loan and note principal; receivables funding increases | No subsequent replacement of the term-debt wall identified in reviewed debt sections; do not use December carrying values as September amounts. | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 19–20 |

| Basis | Cash and eligible liquidity | Maturities within one year | Forecast FCF | Gap | Source |
|---|---|---|---|---|---|
| Balance-sheet date, carrying-value test | Cash USD 6261 million; cash after 2024-10-18 dividend alone USD 1913 million. Eligible opening liquidity USD 7104 million | USD 584 million | USD 1401.1 million | USD 0 million | Financial foundation (CP-1); calculations C1–C3, C7 |
| Pro forma for 2024-10-18 dividend only | Eligible liquidity USD 2756 million; issuer cash liquidity USD 2919 million also includes receivables availability | USD 584 million; no new draw included in this view | USD 1401.1 million | USD 0 million; liquidity alone exceeds maturities | calculation C8; Liquidity (CP-2D) |
| Pro forma for both 2024-10-16 draw and 2024-10-18 dividend | Cash USD 2075.5 million and revolver USD 843 million; eligible liquidity USD 2918.5 million | USD 748 million: current long-term 98 plus gross receivables draw 650 | USD 1401.1 million | USD 0 million | calculations C9–C12 |
| Issuer leverage comparison, not a covenant test | Year-end net debt USD 18619 million; pro forma 2024-10-18 USD 22967 million | Net leverage 4.88x year end; pro forma 6.02x on reported EBITDA, or 5.50x on EBITDA As Defined | FY2024 historical FCF USD 1880 million | Not applicable: leverage context | Financial foundation (CP-1) |

The combined October view uses full drawn receivables principal conservatively, because post-draw carrying costs are not separately established; it is not a purported pro forma balance sheet. The annual report's rounded pro forma liquidity remains the issuer-reported comparator.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56, 62–65; calculation C9; calculation C10; calculation C11

#### T3D.3 Liquidity, cash flow and market access

| Factor | Evidence | Current Level / Status | Direction | Risk Mechanic | Credit Implication | Confidence | Source Trace | Source |
|---|---|---|---|---|---|---|---|---|
| Current debt funding | Eligible liquidity 7104; current debt 584, USD million | Covered; no expiring-line recycling | Stable | Cash plus surviving revolver covers due amounts | Low near-term rollover pressure | High | C1, C2 | Financial foundation (CP-1); calculations C1–C2 |
| October cash reduction | Issuer cash liquidity 7267 to 2919, USD million, pro forma 2024-10-18 | Lower but positive | Stable | Declared distribution uses prefunded cash | Evaluate both dates, not year-end cash alone | High | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56, 63 |
| Historical and projected FCF | FY2024 FCF 1880; estimated FY2025 FCF 1401.1, USD million | Positive; projection assumption-based | Stable | Higher scheduled interest and guided capex reduce recurring cushion | Still supports debt service; no retention assumed beyond horizon | Medium | A1; C3 | Financial foundation (CP-1); Liquidity (CP-2D); calculation C3 |
| Interest burden | FY2024 cash interest 1158; next-year schedule 1524, USD million | Rising; schedule is not actual cash paid | Increasing | Debt carries full-year interest after issuance | Operating deterioration could impair access before cash burn | Medium | A1 | Financial foundation (CP-1); Downside (CP-2A) |
| Filed market indication | Term-loan fair value 8694 versus principal 8702; 2027 sub note fair value 2637 versus principal 2650, USD million | No broad distressed indication in filed valuations | Stable | Near-principal valuations corroborate feasible ordinary funding | Does not establish executable price, size or future funding | Medium | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 145, 172–174 |
| Authenticated market curve / ratings | Transcription date and identities unresolved; primary issuer rating state not supplied here | [Market Data Not Provided] for executable terms; no rating-derived access conclusion | Insufficient Information | Cannot calibrate issue concession or rating headroom | No price-based access guarantee or distressed-exchange classification | Low | A3 | Market-implied risk (CP-3D) |
| Revolver constraint | 910 commitment, 67 letters of credit, 843 available; test above 364, USD million | Cash-undrawn; springing 7.50x test | Stable | Draws can activate leverage testing | Backstop becomes conditional in stress | Medium | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 62 |
| Non-debt funding float | No material float relied upon in Financial foundation; current contract liabilities 168 versus 79, USD million | Contract liabilities increased; no liquidity credit granted | Stable | Advance customer funding can reverse with delivery or weaker orders | Do not treat it as committed debt refinancing | Medium | S1; A1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 144; Financial foundation (CP-1) |

#### T3D.4 Legal-capacity indicators

| Legal-Capacity Indicator | Available / Not Available / Unclear | Evidence | Risk Mechanic | LME Paths Enabled | Confidence | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Incremental debt capacity | Available conditionally; amount Unclear | Summary tests 7.25x net and 5.00x secured net; willing lenders required | Permits additional pari secured claims; exact definitions absent | Consensual refinancing; pari secured issuance, not established superpriority | Medium | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| Lien capacity | Unclear | Liens restricted; exceptions unsized | Additional liens could dilute recovery | Priming only if actual permission shown | Low | A2 | Legal & covenants (CP-4) |
| Unrestricted subsidiary capacity | Unclear | Designation restricted subject to exceptions | Could move value outside creditor group | Drop-down; not established feasible | Low | A2 | Legal & covenants (CP-4) |
| Investment capacity | Unclear | Restrictions summarised, baskets absent | Investments can transfer value to non-guarantors | Drop-down / J.Crew-style transfer, conditional only | Low | A2 | Legal & covenants (CP-4) |
| RP/junior debt payment capacity | Unclear | Prior dividends and redemptions demonstrate historical use, not remaining capacity | Cash distributions reduce creditor cushion | Cash-funded takeout; future distribution capacity unquantified | Low | A2 | Business & governance (CP-1A); Legal & covenants (CP-4) |
| Collateral release | Unclear | Governing release terms absent | Release could remove security from holdouts | Uptier or asset transfer only conditionally | Low | A2 | Legal & covenants (CP-4) |
| Guarantor release | Unclear | Newer note guarantee scope follows credit-facility guarantees; release text absent | Perimeter change could reduce recourse | Guarantee leakage; not executable conclusion | Low | A2 | Legal & covenants (CP-4) |
| Amendment thresholds | Unclear | Amendment history, no voting percentages | Cannot establish majority route around dissenters | Amend and extend; selective exchange not established | Low | A2 | Legal & covenants (CP-4) |
| Sacred rights | Unclear | Protection text absent | Priority or pro-rata amendments may require protected consent | Uptier feasibility not established | Low | A2 | Legal & covenants (CP-4) |
| Open-market purchase provisions | Unclear | Purchase carve-out text absent | Cannot establish selective purchase exemption | Open-market repurchase / non-pro-rata exchange | Low | A2 | Legal & covenants (CP-4) |
| MFN protection | Unclear | Not described | Incremental repricing protection cannot be tested | Incremental financing economics unquantified | Low | A2 | Legal & covenants (CP-4) |
| Intercreditor terms | Unclear | Agreement referenced but not supplied | Enforcement and priority changes cannot be mapped precisely | Priming, standstill and recovery control not established | Low | A2 | Legal & covenants (CP-4) |
| Class voting | Unclear | Class-consent provisions absent | Holdout treatment depends on class formation and consent | Exchange / uptier not established | Low | A2 | Legal & covenants (CP-4) |
| Pro rata sharing provisions | Unclear | Sharing and exceptions absent | Selective consideration may or may not be permitted | Serta-style non-pro-rata exchange not established | Low | A2 | Legal & covenants (CP-4) |

Indicative ratio room in Legal & covenants is not adopted as executable LME capacity. Equal-ranking secured issuance is analytically different from creating debt senior to existing secured creditors; evidence for the former does not prove the latter.
Basis: Legal & covenants (CP-4)

#### T3D.5 Governance and willingness

| Factor | Evidence | Assessment | Risk Mechanic | Credit Implication | Source Trace | Source |
|---|---|---|---|---|---|---|
| Historical refinancing / LME behaviour | Completed issuance, refinancing, repricing and extension; secured debt replaced subordinated paper | Medium for ordinary liability management; coercive intent not established | Demonstrated market execution and priority migration | Ordinary refinancing more credible than distress transaction | A2 | Business & governance (CP-1A) |
| Current support signals | No sponsor injection or subordinated support commitment established | Insufficient Information | No external loss-absorbing capital can be assumed | Funding must rest on own cash generation and lenders | A2 | Business & governance (CP-1A) |
| Economic incentive | Excess cash order puts debt repayment last; September distribution financed alongside USD 3,000 million of new secured debt | High distribution incentive; coercive willingness unestablished | Equity extraction competes with debt retirement | Higher long-term refinancing dependence, not automatic LME intent | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54, 56 |
| Governance / control | Listed issuer; controlling-holder and board-right detail incomplete | Insufficient Information for sponsor or control-based intent | No defensible sponsor exit horizon or support motive | Do not infer sponsor willingness from identity | A2 | Business & governance (CP-1A) |

#### T3D.6 Detailed path assessment

| Path Type | Feasibility | Likelihood Direction | Evidence Supporting | Evidence Against | Legal Capacity Required | Creditor Impact | Source Trace | Source |
|---|---|---|---|---|---|---|---|---|
| Consensual refinancing | Medium | Stable | FY2024 completed transactions and non-distressed filed fair values | No future funding commitment; distribution policy weakens retention | New issuance and repayment permissions; no exact capacity asserted | Preserves terms if like-for-like; junior dilution if secured takeout | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53–56, 172–174 |
| Amend & Extend | Medium | Stable | Completed loan extension into Tranche J | Current pressure low; future consent not established | Amendment/class consent; thresholds unclear | Extenders receive economics, retain credit exposure | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 53 |
| Open-market repurchase | Insufficient Information | Insufficient Information | Management contemplates debt repurchases in cash-allocation order | No authenticated discount or purchase carve-out | Purchase permissions and pro-rata exceptions | Could reduce claims; no discount capture assumed | S1; A2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; Legal & covenants (CP-4) |
| Exchange offer | Insufficient Information | Low | Could extend earliest notes under a consented transaction | No offer or intent supplied | Exchange and junior-payment permissions; consent protections | Economics and participation determine treatment | A2 | Legal & covenants (CP-4) |
| Distressed exchange | Insufficient Information | Low | Stress could impair access before liquidity failure | Current cash coverage and fair values oppose necessity | Exchange permissions plus transaction-specific rating treatment | Potential concession/default-like outcome; not current state | A2; A3 | Downside (CP-2A); Legal & covenants (CP-4) |
| Uptier | Insufficient Information | Insufficient Information | Conceptual source of senior funding under stress | No sacred-right or voting permission established | Lien/debt capacity, priority amendment and release authority | Non-participating secured claims could become junior | A2 | Legal & covenants (CP-4) |
| Drop-down | Insufficient Information | Insufficient Information | Non-guarantor perimeter exists | No investment/designation capacity sized | Investment, unrestricted subsidiary, collateral release | Removes value from existing collateral reach | A2 | Legal & covenants (CP-4) |
| J.Crew-style transfer | Insufficient Information | Insufficient Information | Asset transfer is a possible stress mechanism only | No specific transferable asset or permissive basket established | Investment and asset-transfer baskets, IP and guarantee release | Impairs asset recourse; no quantified value at risk | A2 | Legal & covenants (CP-4) |
| Serta-style non-pro-rata exchange | Insufficient Information | Insufficient Information | Selective financing could benefit participants in a hypothetical stress | No purchase exception, sharing terms or issuer precedent supplied | Amendment thresholds, sacred rights, open-market carve-out, pro rata sharing | Holdouts could be subordinated without equal economics | A2 | Legal & covenants (CP-4) |
| Priming debt | Medium for pari secured layering; superpriority Insufficient Information | Stable for ordinary secured issuance | Incremental tests and historical secured substitution | Exact remaining baskets and superpriority permission absent | Debt/lien tests; superpriority requires additional authority not established | Juniors diluted first; pari secured holders share value more widely | S1; A2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53–54, 61–62; Legal & covenants (CP-4) |
| Asset sale / partial paydown | Insufficient Information | Low | Theoretically reduces gross maturities | No committed material sale or dedicated proceeds supplied | Asset-sale, reinvestment and mandatory-prepayment terms | Could reduce debt but may remove EBITDA and collateral | A2 | Legal & covenants (CP-4) |
| Sponsor equity injection | Insufficient Information | Insufficient Information | None supplied | No identified sponsor or binding support | Equity/subordinated-capital and support terms | Would absorb losses if provided; no credit given | A2 | Business & governance (CP-1A) |

No path is rated High because future pressure, capacity and incentive are not jointly demonstrated. The most credible path is ordinary refinancing; the most adverse hypothetical path is a selective superpriority exchange combined with collateral or guarantee release, but its feasibility is not established.
Basis: Business & governance (CP-1A); Legal & covenants (CP-4); calculation C7

#### T3D.7 Prime / LME vulnerability

| Dimension | Score | Evidence | Risk Mechanic | Credit Implication | Source Trace | Source |
|---|---|---|---|---|---|---|
| Refinancing pressure | Low near term; concentrated later | Current funding gap zero; FY2028 principal 6637 and FY2029 4768, USD million | Rollover dependence increases after runway expires | Monitor earliest junior maturity ahead of wall | S1; C7 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 153; calculation C7 |
| Legal capacity | Insufficient Information | Pari incremental financing summarised; coercive protections absent | Cannot establish priority stripping | No executable coercive-path conclusion | A2 | Legal & covenants (CP-4) |
| Sponsor willingness | Insufficient Information | No sponsor support or coercive precedent established | Distribution incentive is not coercive willingness | Do not infer intent | A2 | Business & governance (CP-1A) |
| Market access risk | Low on filed historical evidence; future terms unestablished | Completed issuance and filed market-based note values | Ordinary funding plausible while performance holds | No guarantee against closure before maturity | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 53–54, 172–174 |
| Recovery impact | High directional risk for subordinated claims | Secured carrying debt 19534 versus subordinated 4581, USD million | Senior claim accumulation consumes junior cushion | More loss exposure than near-term default pressure suggests | A1; A2 | Financial foundation (CP-1); Legal & covenants (CP-4) |
| Overall near-term vulnerability | Low; conditional | Ordinary refinancing appears feasible; coercive capacity and intent unestablished | No immediate necessity for a coercive solution | Retain separate structural dilution concern | A1–A3 | Financial foundation (CP-1); Business & governance (CP-1A); Legal & covenants (CP-4) |

The overall Low assessment uses the ordinary-course-feasibility branch of the rubric. It is not a conclusion that missing legal protections are benign. The claim-level evidence label for a specific coercive route is Insufficient Information; the legal-capacity dimension remains unscored rather than being assigned Low by default.
Basis: Legal & covenants (CP-4); Market-implied risk (CP-3D)

#### T3D.8 Creditor-class exposure

| Creditor Class | Exposure: Base Case | Exposure: Stress Case | Exposure: LME Case | Recovery Implication | Priming / Subordination Risk | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Term loans / revolver | Ordinary rollover or extension; secured claim retained | Greater cash draws and possible extension economics; springing test can activate | Non-participants could lose priority only if unestablished permissions permit | Pari claim dilution demonstrated; no recovery percentage calculated | Superpriority / selective treatment not established | A1; A2 | Financial foundation (CP-1); Legal & covenants (CP-4) |
| Secured notes | Like-for-like takeout; equal senior payment ranking described | Wider new-money economics and more competing secured claims | Guarantee release or senior debt could weaken position if legally permitted | Shared collateral and guarantor reach matter more than nominal maturity alone | Intercreditor control, release and superpriority terms unestablished | A2 | Legal & covenants (CP-4) |
| Senior subordinated notes | First major maturity; possible secured takeout benefits repaid issue but dilutes remaining juniors | Unsecured market may close first; senior default can block debt service | Further senior issuance, collateral leakage or coercive exchange | Most exposed class: contractual, collateral and structural subordination | Already junior to secured claims; exact additional layering capacity unknown | A1; A2 | Financial foundation (CP-1); Legal & covenants (CP-4) |
| Receivables facility | Renewal or cash repayment | Receivables weakening or termination event could withdraw funding | Dedicated receivables pool not treated as free collateral for others | Borrower liquidity pressure can rise independently of note maturities | Relative lien and termination terms not fully established | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |
| Finance lessors / government advances | Contractual payments; government repayments contingent on revenue growth | Asset and product-line-specific exposure | No class-specific LME mechanism established | No recovery hierarchy inferred for unexamined claims | Rank versus secured group unestablished | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 152, 172 |

#### T3D.9 Monitoring triggers

| Trigger | Indicator | Threshold / Qualitative Signal | Leading / Lagging | Why It Matters | Linked Path(s) | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Earliest major maturity enters preparation window | Refinancing progress for November 2027 subordinated notes | Analyst milestone: review within 24 months of contractual maturity; not a contractual deadline | Leading | Absence of refinancing when runway shortens increases dependence on secured takeout | Consensual refinancing; A&E; exchange | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Receivables renewal failure | Extension or repayment announcement | No extension or funded repayment plan ahead of 2025-07-11 | Leading | Removes short-term funding and consumes cash/revolver | Renewal; cash paydown | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |
| Revolver dependence | Usage and covenant disclosure | Usage above USD 364 million; definitions not fully established | Leading | Activates 7.50x test; acquisition holiday 8.00x for four quarters | A&E; refinancing; cash conservation | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Financial-policy relapse during weaker earnings | New secured issue with special dividend; cash retention | Observable declaration/issuance while EBITDA falls; no calibrated numerical trigger | Leading | Raises claims while operating funding shrinks | Pari secured issuance; junior takeout | A2 | Business & governance (CP-1A) |
| Market closure signal | Authenticated failed launch, materially worse terms or distressed exchange announcement | Transaction evidence, not the unverified transcription; no calibrated spread threshold | Leading | Would weaken ordinary refinancing feasibility | A&E; exchange; distressed exchange | A3 | Market-implied risk (CP-3D) |
| Capacity usage / priority change | New liens, guarantor releases, asset transfers and selective offers | Published amendment, release or unequal-priority term sheet | Leading | Could convert theoretical coercive paths into demonstrated risks | Uptier; drop-down; non-pro-rata exchange | A2 | Legal & covenants (CP-4) |
| Cash-generation deterioration | Quarterly EBITDA, interest and free cash flow | Declining earnings plus rising cash interest or negative recurring FCF; static stress is not a covenant threshold | Lagging | Cash retention weakens before term wall, increasing market dependence | Refinancing; cash conservation | A3 | Downside (CP-2A) |

#### T3D.10 Scenario map

| Scenario | Key Assumptions | Refinancing Path | Timeline | Creditor Impact | Recovery Implication | Probability Direction | Confidence | Source Trace | Source |
|---|---|---|---|---|---|---|---|---|---|
| Base | Operating cash broadly follows Liquidity's annual assumptions; no further distribution included in funding test; markets remain usable | Renew or cash-repay receivables, then consensual term-debt refinancing | One-year cash test; prepare ahead of November 2027 and FY2028–FY2029 wall | No current funding shortfall; secured substitution can dilute remaining junior claims | No forced impairment inferred | Stable | Medium for near-term funding; Low for future execution terms | A1–A3 | Liquidity (CP-2D); Financial foundation (CP-1); Business & governance (CP-1A) |
| Stress | Analyst scenario imports Downside: EBITDA -20%, interest at run-rate plus 100 bp; debt initially unchanged | Preserve cash; pursue early consensual takeout or lender extension; secured substitution if permitted | Earnings shock first, weaker access before November 2027, then maturity wall | Positive FCF may coexist with 7.53x pro forma net leverage and 1.96x cover | Junior residual value erodes before a payment default; no recovery percentage | Increasing if earnings and access deteriorate | Medium for static stress; Low for actual market response | A3 | Downside (CP-2A) |
| LME | Hypothetical failed ordinary financing plus demonstrated issuer incentive AND future documentary proof of selective priority/release permissions | Participating creditors exchange into senior debt; non-participants remain behind, potentially alongside collateral transfer | Conditional after market access fails and before affected maturity; no dated transaction alleged | Non-participating secured creditors could be subordinated; existing junior notes face larger senior pool | Potential severe recovery dilution, but legal feasibility and valuation unestablished | Insufficient Information | Insufficient Information for executable path | A2 | Legal & covenants (CP-4); Business & governance (CP-1A) |

The stress sequence is demand weakness, margin and EBITDA loss, lower interest cover and retained cash, greater reliance on financing, and then weaker refinancing choices. The first observable break is declining earnings or a failed financing, not the arrival of the contractual final maturity. The LME scenario requires additional facts and is not a forecast of issuer conduct.
Basis: Downside (CP-2A); Business & governance (CP-1A); Legal & covenants (CP-4)

### Overall refinancing and liability-management view

Refinancing analysis is completed with limitations. Prime/LME vulnerability is Low on current funding and demonstrated ordinary refinancing feasibility; the most likely path is consensual refinancing, with receivables renewal or cash repayment as the nearest decision. The subordinated notes are the most exposed class because ordinary secured issuance can weaken their position even without coercion. Legal feasibility of an uptier or asset-transfer transaction, executable future issuance economics and quantitative recovery remain unestablished.
Basis: Financial foundation (CP-1); Business & governance (CP-1A); Legal & covenants (CP-4); Liquidity (CP-2D); calculation C7; calculation C11

## Calculations

All monetary calculations use consolidated USD millions. No FX conversion is applied. Forecast free cash flow uses Liquidity's stated annual operating assumptions and is not management earnings guidance. The primary horizon starts at the balance-sheet date; October adjustments are separate.

| ID | Calculation | Exact inputs | Result | Period / unit / limitation | Source |
|---|---|---|---|---|---|
| C1 | Available liquidity excluding expiring securitization | 6261 + 843; revolver 910 - 67 = 843 | 7104 | 2024-09-30, USD million; LC reservations deducted; no term-loan availability | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55, 59 |
| C2 | Current carrying debt | 486 + 98 | 584 | One-year horizon, USD million; memo current portion counted once | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–145 |
| C3 | Reconstructed forecast levered FCF before debt principal | 4044 - 302 - 1524 - 539 - 277.9 | 1401.1 | FY2025, USD million; operating inflow, working capital and taxes from Liquidity; excludes extra pension/lease uses and discretionary flows | Liquidity (CP-2D) |
| C4 | FY2025 principal chart need | 93 + 487 | 580 | USD million; principal ladder plus rounded securitization, excluding finance leases | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144, 153 |
| C5 | Principal / carrying difference | 25068 - 24880 | 188 | 2024-09-30, USD million; preserve different bases | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–145 |
| C6 | FY2028 plus FY2029 maturity concentration | 6637 + 4768 | 11405 | USD million; issuer principal ladder, not full debt including leases/securitization | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 153 |
| C7 | Primary raw funding balance and floored gap | 584 - 7104 - 1401.1; max(0, result) | -7921.1 raw; 0 funding gap | One year from 2024-09-30, USD million; raw excess is not freely distributable cash | calculations C1–C3 |
| C8 | Dividend-only pro forma eligible liquidity | 7104 - 4348 | 2756 | USD million; pro forma 2024-10-18; excludes expiring undrawn receivables facility | calculation C1; Financial foundation (CP-1) |
| C9 | Combined October pro forma eligible liquidity | 2756 + 162.5 | 2918.5 | USD million; includes cash from 2024-10-16 draw and 2024-10-18 dividend; issuer rounded liquidity 2919 | calculation C8; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |
| C10 | Combined pro forma one-year debt due | 98 + 650 | 748 | USD million; full drawn receivables principal used conservatively, not an invented carrying value | calculation C2; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–65 |
| C11 | Combined pro forma raw balance and floored gap | 748 - 2918.5 - 1401.1; max(0, result) | -3571.6 raw; 0 funding gap | USD million; separate from balance-sheet-date test | calculations C3, C9–C10 |
| C12 | Combined pro forma cash | 1913 + 162.5 | 2075.5 | USD million; dividend-only cash 1913 from Financial foundation, plus October draw | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| C13 | Dividend scope difference | 4396 - 4348 | 48 | USD million; whole quarter versus declaration-linked payment; not reconciled | Liquidity (CP-2D); Financial foundation (CP-1) |
| C14 | Instrument carrying-value tie | 8642 + 2641 + 2077 + 1194 + 2727 + 746 + 1438 + 984 + 2180 + 1486 + 17 + 262 + 486 | 24880 | 2024-09-30, USD million; excludes memo current portion from sum | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 144–145 |
| C15 | Long-term carrying subtotal less current portion | 24394 - 98 | 24296 | 2024-09-30, USD million; securitization separately presented | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 145 |

| ID | Maturity / facility | Thirty/360 day numerator from 2024-09-30 | Operation | Years result used | Source |
|---|---|---|---|---|---|
| Y1 | Securitization 2025-07-11 | 281 | 281 / 360 | 0.78055555555555555555555555555555555556 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Y2 | Subordinated notes 2027-11-15 | 1125 | 1125 / 360 | 3.125 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y3 | Secured notes 2028-08-15 | 1395 | 1395 / 360 | 3.875 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y4 | Tranche I 2028-08-24 | 1404 | 1404 / 360 | 3.9 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y5 | Subordinated notes 2029-01-15 | 1545 | 1545 / 360 | 4.2916666666666666666666666666666666667 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y6 | Revolver 2029-02-27 | 1587 | 1587 / 360 | 4.4083333333333333333333333333333333333 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y7 | Secured notes 2029-03-01 | 1591 | 1591 / 360 | 4.4194444444444444444444444444444444444 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y8 | Subordinated notes 2029-05-01 | 1651 | 1651 / 360 | 4.5861111111111111111111111111111111111 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| Y9 | Tranche K 2030-03-22 | 1972 | 1972 / 360 | 5.4777777777777777777777777777777777778 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y10 | Secured notes 2030-12-15 | 2235 | 2235 / 360 | 6.2083333333333333333333333333333333333 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| Y11 | Tranche J 2031-02-28 | 2308 | 2308 / 360 | 6.4111111111111111111111111111111111111 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y12 | Secured notes 2031-12-01 | 2581 | 2581 / 360 | 7.1694444444444444444444444444444444444 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| Y13 | Tranche L 2032-01-19 | 2629 | 2629 / 360 | 7.3027777777777777777777777777777777778 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Y14 | Secured notes 2032-03-01 | 2671 | 2671 / 360 | 7.4194444444444444444444444444444444444 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| Y15 | Secured notes 2033-01-15 | 2985 | 2985 / 360 | 8.2916666666666666666666666666666666667 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |

## Gaps

### T3D.11 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Coercive transaction capacity | Executed priority, voting, sacred-right, sharing, purchase, investment and release terms | Determines whether non-participants can be subordinated or lose collateral | Blocks executable uptier/drop-down/selective-exchange conclusions, not maturity analysis | Establish controlling provisions and current usage before assigning capacity |
| Future market execution | Authenticated new-issue indications, available size and price by rank | Historical issuance and filed fair value do not guarantee future access | No future coupon, issue size or market-implied probability | Obtain dated transaction-quality financing terms |
| Tranche-level carrying allocation | Costs and discounts by tranche and annual instalment | Carrying values cannot be allocated across the loan wall without assumptions | Exact individual carrying-value ladder incomplete; aggregate debt and current horizon remain supported | Preserve aggregate values until an allocation schedule is available |
| Redemption and acceleration detail | Call protection, springing maturities, cross-default and early-redemption schedules | Could change optimal timing or accelerate repayment | No call-window optimisation or assertion that no springing maturity exists | Establish contractual early-payment and acceleration provisions |
| Support willingness | Binding equity/support commitments and sponsor-specific evidence | No external rescue capital can be credited | Equity injection remains unestablished rather than a forecast funding source | Require an identified provider and documented terms |
| Recovery / enforcement | Valuation, collateral distribution and enforceable control mechanics | Determines loss amount rather than exposure direction | No recovery percentage or priced secured-versus-junior preference | Establish valuation and transaction-specific priority before quantifying losses |
| Forecast scope | Annual operating assumptions, not cash-retention promises | Positive operating FCF can be spent on acquisitions or distributions | Zero gap is a bounded one-year debt-funding result, not a forecast through the later wall | Reassess after earnings, acquisitions or distributions |
| Small distribution scope conflict | Annual declaration-linked amount versus quarterly payment totals | Changes cash arithmetic marginally, not the preferred refinancing path | Unreconciled USD 48 million difference retained; no change in near-term classification | Obtain payment-level reconciliation |
| Use restriction | No legal opinion or investment-price assessment | Feasible funding does not establish enforceable coercive capacity or attractive debt pricing | Use for refinancing pressure and class exposure only | Do not infer a trade recommendation or legal permission |

## Next module

The orchestrator selects the next module.
