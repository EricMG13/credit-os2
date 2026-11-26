---
issuer_id: tdg
module_id: CP-3
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
committee_status: Draft Only
execution_mode: Capital-Structure RV
---

## Request

Relative value and security selection for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is the issuer scorecard, market compensation by instrument, the fundamental value matrix, instrument preference across the capital structure and generic portfolio fit, without numeric sizing.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Term loan tranche principal, maturities and margins, absence of a Term SOFR floor, revolver terms, quarterly amortisation, note principal, coupons and maturities, used to test the identity of each quoted loan |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate (partial), absence of executed debt documents, dated October 2024 events |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Debt by instrument at carrying value and principal, leverage, coverage, free cash flow, post-balance-sheet adjustment for the 2024-10-18 payment, definition conflict register |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Financial policy, FY2024 distributions and secured refinancing, Tranche J repricing history |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Confirms no peer multiple and no implied enterprise value |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported EBITDA and leverage on supported earnings |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Fundamental credit view, strengths, weaknesses and primary downside path |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Ranking, guarantor coverage, incurrence tests, indicative secured capacity, subordination and covenant aggressiveness |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Pro forma liquidity, securitization maturity, liquidity risk level |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Base and downside leverage, coverage and EBITDA paths |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Facility rating labels and their unverified status; facility identity conflicts |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Loan quote observations, Bloomberg identifiers, loan index and aerospace loan comparables, quote-basis limitations; its blocked status is reconciled in this analysis |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Maturity wall, refinancing paths, creditor-class exposure |
| Restructuring scenario (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Confirms no restructuring valuation, fulcrum or class recovery |

## Findings

### Bottom line

Neutral on first-lien Tranches J and L, which price in line with the Ba loan cohort but carry no visible premium for TransDigm's debt-funded distribution policy; every other TransDigm instrument Requires More Work, and no position size is supportable.

Tranche J's three-year discount margin of 247 bp is −4 bp against the Ba leveraged-loan index and 54 bp wide of a same-rated aerospace loan; Tranche L is 3 bp wider than J. Those levels price TransDigm as an ordinary Ba loan: fair for a first-lien claim on a franchise with a 52.56% EBITDA As Defined margin, but with no premium for a board that paid a USD 4,348 million dividend partly with new secured debt, holding net leverage at 6.02x pro forma for the 2024-10-18 payment (4.88x at year end). The quotes come from a hand transcription dated for this run, and the Tranche K, M and N quotes do not match year-end facilities. No note is priced and no enterprise value is supported, so subordinated recovery cannot be tested against compensation.
Basis: Market-implied risk (CP-3D); Financial foundation (CP-1); Business & governance (CP-1A); calculation V15; calculation V16; calculation V19

### Key findings

- Market compensation on Tranches J and L is Fair, not Cheap. Tranche J is quoted at 100.00% to 100.13% of par with a three-year discount margin of 247 bp, which is −3 bp against its contractual margin of Term SOFR plus 2.50%, so the loan trades at par with no discount cushion. Against labelled benchmarks it is −4 bp versus the Ba loan index, 54 bp wide of a same-rated aerospace first-lien loan, 13 bp wide of a lower-rated aerospace loan and 73 bp tighter than a weaker-rated one. The issuer repriced Tranche J from Term SOFR plus 3.25% in June 2024, which shows it captures tighter markets through repricing; the upside on a par loan is therefore capped while the downside is open.
Basis: Market-implied risk (CP-3D); Business & governance (CP-1A); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation V15; calculation V16; calculation V17; calculation V18; calculation V20

- Fundamentals support the secured layer but not a premium credit view, and the weighted composite is not scorable because no mandate or sector weights were supplied. The franchise scores well on pricing power, free cash flow of USD 1,880 million and liquidity of USD 2,919 million pro forma for the 2024-10-18 payment, but financial policy scores at the aggressive end: leverage on supported earnings is 5.93x pro forma and deleveraging to 5.17x gross by FY2027 in the base forecast depends entirely on EBITDA growth.
Basis: Fundamental credit (CP-2); Earnings quality (CP-1D); Forward credit model (CP-2G); Liquidity (CP-2D)

- Structure, not price, separates the classes. Secured claims of USD 19,534 million at carrying value, with the USD 486 million securitization ahead on receivables, are covered at an enterprise value of 5.25x reported EBITDA; the senior subordinated notes of USD 4,581 million sit between 5.25x and 6.45x. In the downside forecast those points move to 5.97x and 7.33x, and if the indicative USD 3,244 million of secured capacity under the 5.00x secured test were used, the subordinated notes would attach at 6.10x and detach at 7.30x. The subordinated class therefore needs a materially higher valuation multiple to be whole than the secured class, and every further secured issue raises that hurdle.
Basis: Legal & covenants (CP-4); Financial foundation (CP-1); Forward credit model (CP-2G); calculation V3; calculation V4; calculation V7; calculation V8; calculation V11; calculation V12

- Security selection is blocked for Tranche K and the quoted M and N facilities because their identity is conflicted. The Tranche K quote shows USD 3,544 million and a 224 bp discount margin against year-end principal of USD 1,699 million and a contractual margin of 275 bp, a −51 bp gap that cannot be credit; M and N have no matching facility at year end. Their apparent tightness or flatness is not a usable signal.
Basis: Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation V22

- No note is priced, so the six secured note series and the three senior subordinated note series Require More Work. Structurally the secured notes rank with the loans, while the subordinated notes carry contractual, payment-blockage and structural subordination; on structure alone the secured layer is preferred, but no compensation exists to test whether the subordinated notes are adequately paid for that.
Basis: Legal & covenants (CP-4); Refinancing & LME (CP-3C)

- Portfolio implementation is limited to Watchlist on Tranches J and L. No mandate, holdings, concentration limits or constraints workbook were supplied, and liquidity evidence is limited to displayed widths of 0.13% of par on Tranche J and 0.25% of par on Tranche L, so exit cost under stress and any numeric size are not established.
Basis: Market-implied risk (CP-3D); calculation V13; calculation V14

### Contrary evidence and what would change the view

The strongest case for a more constructive call is the peer gap: Tranche J pays 54 bp more than a same-rated aerospace first-lien loan and 13 bp more than a lower-rated one, for a borrower with a 52.56% EBITDA As Defined margin, positive free cash flow in every forecast case and no term-debt maturity before November 2027. If authenticated, dated quotes on aligned terms confirmed that gap, Tranches J and L would read Cheap against aerospace peers and could move to Preferred within a mandate that has room for the name. The strongest case for a more cautious call is that the loans price at the Ba index level despite net leverage of 6.02x pro forma for the 2024-10-18 payment (4.88x at year end) and a board that ranks debt prepayment last; on that reading compensation is Rich, because each new debt-funded distribution dilutes the secured pool pari passu while the par loan has no price cushion. A further secured issue alongside a special dividend, verified agency ratings below the sheet labels, or revolver usage above USD 364 million would push the call to Avoid-leaning for new money. The market-implied analysis rejected these quotes as historical evidence because their date was assigned rather than observed; if that view governs, relative value is Unclear and the Neutral call on Tranches J and L falls to Requires More Work.
Basis: Market-implied risk (CP-3D); Ratings & triggers (CP-2H); Business & governance (CP-1A); Financial foundation (CP-1); calculation V16; calculation V18

### Limitations

- The Fair label and Neutral call on Tranches J and L rest on accepting the run's quote transcription as the maintained relative-value basis; its quote quality and executability are not stated, and if it is rejected as current evidence both loans fall to Requires More Work.
- Loan comparables reach this analysis only through the market-implied analysis, without aligned duration, index methodology or call terms, so the 54 bp gap to a same-rated aerospace loan could reflect terms rather than credit; this keeps the Tranche J label at Fair rather than Cheap.
- No enterprise value is supported because no peer or transaction multiple and no restructuring valuation exist; the recovery waterfall therefore carries no recovery percentage or fulcrum, the attachment multiples are coverage thresholds rather than recoveries, and any later enterprise value built from peer multiples would be indicative only, as would recoveries derived from it.
- No portfolio mandate, holdings, limits or constraints workbook was supplied, so the sizing posture stops at Watchlist and cannot become a starter position or carry a numeric size.
- No governing scorecard weights were supplied, so the composite score and credit tier are not scorable and the ranking is ordinal within TransDigm's own structure only.
- The secured preference over the subordinated notes rests on the annual report's summary of the debt documents; a free-and-clear or permitted-lien basket outside the 5.00x secured test would make the secured layer more dilutable than the attachment multiples show.
- The facility rating labels used to choose the Ba index as benchmark are unverified; if the issuer's actual rating sits lower, the right benchmark is wider and Tranche J would screen tighter than its cohort.

### Fundamental credit summary

TransDigm's business is the support and its financial policy is the constraint. Proprietary, certified parts sold largely into the aftermarket produce a 52.56% EBITDA As Defined margin and USD 1,880 million of free cash flow, so debt service is internally funded and liquidity of USD 2,919 million pro forma for the 2024-10-18 payment covers the twelve months to September 2025. Against that, the board declared USD 6,368 million of special distributions in FY2024, funded the September payment partly with USD 3,000 million of new secured debt, and ranks debt prepayment last; net leverage is 6.02x on reported EBITDA pro forma for that payment (4.88x at year end) and 5.93x on supported earnings. For security selection this means default risk over the loan life is driven by refinancing the FY2028 and FY2029 wall of USD 11,405 million and by further releveraging, while loss severity is driven by how much secured debt is layered ahead of junior claims.
Basis: Fundamental credit (CP-2); Financial foundation (CP-1); Earnings quality (CP-1D); Liquidity (CP-2D); Business & governance (CP-1A)

### Security selection conclusions

Security decision summary: only the two identity-matched loans have a decision-useful market level.

| Security | Market level | Relative value | Recommendation | Sizing posture | Source |
|---|---|---|---|---|---|
| Tranche J term loan, first lien, 2031-02-28 | 247 bp three-year DM; 100.00% to 100.13% of par | Fair | Neutral | Watchlist | Market-implied risk (CP-3D) |
| Tranche L term loan, first lien, 2032-01-19 | 250 bp three-year DM; 99.88% to 100.13% of par | Fair | Neutral | Watchlist | Market-implied risk (CP-3D) |
| Tranche K term loan, first lien, 2030-03-22 | 224 bp quoted against 275 bp contractual margin | Unclear | Requires More Work | Requires More Work | Market-implied risk (CP-3D) |
| Tranche I term loan and quoted M and N | No quote for I; no year-end facility for M and N | Unclear | Requires More Work | Requires More Work | Market-implied risk (CP-3D) |
| Six secured note series, 2028 to 2033 | No price | Unclear | Requires More Work | Requires More Work | Legal & covenants (CP-4) |
| Three senior subordinated note series, 2027 and 2029 | No price | Unclear | Requires More Work | Requires More Work | Legal & covenants (CP-4) |

Tranche J is Neutral because TransDigm's franchise funds debt service with positive free cash flow, while relative value is Fair at a three-year discount margin of 247 bp, −4 bp against the Ba loan index, and its first-lien claim ranks equally with USD 19,534 million of secured debt that can grow by about USD 3,244 million under the 5.00x secured test. The main upside to debt is EBITDA growth taking gross leverage toward 5.17x by FY2027 before the November 2027 refinancing sequence begins. The main downside risk is a further debt-funded distribution that dilutes the secured pool with no price cushion on a par loan. Monitoring should focus on new secured issuance, special dividend declarations and any repricing request.
Basis: Market-implied risk (CP-3D); Legal & covenants (CP-4); Forward credit model (CP-2G); calculation V15

Tranche L is Neutral because it shares Tranche J's claim and guarantor group, while relative value is Fair at 250 bp, 3 bp wider than J for a maturity almost a year longer, and it is the loan raised alongside the September 2024 special dividend, which makes it the cleanest marker of how the market prices the distribution policy. The main upside to debt and the main downside risk are the same as for Tranche J. Monitoring should focus on the same signals and on whether its quoted maturity, which differs by one day from the annual report, is confirmed.
Basis: Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation V19

Tranche K, Tranche I and the quoted M and N facilities Require More Work because the fundamental view is the same first-lien credit, while relative value is Unclear: the K quote conflicts with its year-end size and margin, no quote exists for I, and M and N have no year-end facility. The main upside to debt and the main downside risk follow the other loans. Monitoring should focus on facility identifiers tied to legal terms.
Basis: Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59

The secured notes Require More Work because they share the loans' rank and collateral, while relative value is Unclear for want of any price, and their guarantees after 2029 follow credit-agreement guarantor status, which a release could change. The senior subordinated notes Require More Work because the issuer can service them, while relative value is Unclear, and their claim attaches only above 5.25x reported EBITDA, behind secured debt that the issuer has shown it will grow to fund distributions. The main upside to the subordinated notes is early refinancing of the November 2027 maturity; the main downside risk is further secured layering ahead of them. Monitoring should focus on refinancing progress for the 2027 notes and on secured issuance.
Basis: Legal & covenants (CP-4); Refinancing & LME (CP-3C); calculation V3

### Instrument preference and trade-offs

The structure has three layers: the securitization of USD 486 million against receivables, USD 19,534 million of equal-ranking senior secured debt across four term loan tranches, an undrawn revolver and six secured note series, and USD 4,581 million of senior subordinated notes, all at carrying value. Within that structure Tranches J and L are preferred, because they combine a supported first-lien position, compensation in line with the Ba cohort and maturities after the FY2028 wall, with no overriding legal weakness on the summary evidence. The trade-off against the secured notes is not structural but evidential: the notes rank equally and may pay more, but they are unpriced. The subordinated notes are not avoided on evidence, because no price exists, but they carry the capital structure's main recovery risk: the indicative secured capacity would lift their attachment point from 5.25x to 6.10x reported EBITDA. A dated price for the subordinated notes that clears the extra loss severity, and the executed indentures' blockage and release terms, would turn that Requires More Work into a decision. The top trigger across the structure is any new secured issue alongside a special dividend. Instrument preference completed with limitations: preferred Tranches J and L; key gaps are note prices, an enterprise value and the executed debt documents.
Basis: Legal & covenants (CP-4); Financial foundation (CP-1); calculation V3; calculation V11

### Downside and invalidation

The initiating condition is a commercial aftermarket slowdown alongside continued OEM production problems. The first operational break is EBITDA growth stalling while cash interest steps up, which in the downside forecast takes FY2025 cover to 2.16x and gross leverage to 7.39x. The financial transmission for these loans is that the secured layer's coverage threshold rises from 5.25x to 5.97x of a lower EBITDA, while revolver drawings above USD 364 million activate the 7.50x springing test. The refinancing consequence arrives with USD 6,637 million of FY2028 maturities. The Neutral call is invalidated by a debt-funded special dividend or secured issue, by revolver usage above USD 364 million, or by an authenticated quote widening on Tranche J; no quantitative spread threshold is supported by the evidence.
Basis: Forward credit model (CP-2G); Legal & covenants (CP-4); Financial foundation (CP-1); calculation V7

### Capital structure

| Instrument | Rank and security | Principal (USD millions) | Carrying value (USD millions) | Coupon or margin | Maturity | Market level | Source |
|---|---|---|---|---|---|---|---|
| Trade receivable securitization (capacity 650) | Secured by domestic trade receivables; structurally senior on that pool | 487 | 486 | Term SOFR plus 1.45% | 2025-07-11 | No quote | Financial foundation (CP-1) |
| Revolving credit facility (commitment 910; letters of credit 67; available 843) | Senior secured, credit agreement collateral | Not supplied: undrawn apart from letters of credit | Not supplied: no drawn balance | Term SOFR plus 2.25% | 2029-02-27 | No quote | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loan Tranche I | Senior secured | 1871 | Not supplied: tranche carrying value not disclosed | Term SOFR plus 2.75%, no floor | 2028-08-24 | No quote | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loan Tranche J | Senior secured | 3632 | Not supplied: tranche carrying value not disclosed | Term SOFR plus 2.50%, no floor | 2031-02-28 | 247 bp three-year DM; 100.00% to 100.13% of par | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Market-implied risk (CP-3D) |
| Term loan Tranche K | Senior secured | 1699 | Not supplied: tranche carrying value not disclosed | Term SOFR plus 2.75%, no floor | 2030-03-22 | Quote conflicts with terms (224 bp; size 3544) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Market-implied risk (CP-3D) |
| Term loan Tranche L | Senior secured | 1500 | Not supplied: tranche carrying value not disclosed | Term SOFR plus 2.50%, no floor | 2032-01-19 | 250 bp three-year DM; 99.88% to 100.13% of par | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Market-implied risk (CP-3D) |
| Term loans, all tranches | Senior secured | 8702 | 8642 | As tranches | 2028-08-24 to 2032-01-19 | As tranches | Financial foundation (CP-1) |
| 2028 secured notes | Senior secured, equal with credit agreement | 2100 | 2077 | 6.75% | 2028-08-15 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2029 secured notes | Senior secured | 2750 | 2727 | 6.375% | 2029-03-01 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2030 secured notes | Senior secured | 1450 | 1438 | 6.875% | 2030-12-15 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| 2031 secured notes | Senior secured | 1000 | 984 | 7.125% | 2031-12-01 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| 2032 secured notes | Senior secured | 2200 | 2180 | 6.625% | 2032-03-01 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| 2033 secured notes | Senior secured | 1500 | 1486 | 6.00% | 2033-01-15 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| Senior secured total (term loans and secured notes) | Senior secured | 19702 | 19534 | Not applicable: mixed | Not applicable: mixed | Not applicable: mixed | Financial foundation (CP-1); calculation V21 |
| 2027 senior subordinated notes | Unsecured, subordinated to senior secured debt | 2650 | 2641 | 5.50% | 2027-11-15 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| January 2029 senior subordinated notes | Unsecured, subordinated | 1200 | 1194 | 4.625% | 2029-01-15 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| May 2029 senior subordinated notes | Unsecured, subordinated | 750 | 746 | 4.875% | 2029-05-01 | No price | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 60 |
| Finance leases and government advances | Rank not stated | 279 | 279 | Not supplied: rate not stated by instrument | Not supplied: schedule not read | No quote | Financial foundation (CP-1) |
| Total debt | All instruments | 25068 | 24880 | Not applicable: mixed | Not applicable: mixed | Not applicable: mixed | Financial foundation (CP-1) |

### Relative value

Overall, TransDigm's first-lien Tranches J and L are Neutral and every other instrument Requires More Work. Fundamentally, TransDigm presents a credit profile that is not scorable on a weighted basis, because no governing weights were supplied; unweighted, it pairs a strong franchise and adequate liquidity with an aggressive financial policy and leverage of 5.93x on supported earnings pro forma for the 2024-10-18 payment. Relative value appears Fair on Tranches J and L because their discount margins of 247 bp and 250 bp sit at the Ba loan index and inside weaker-rated aerospace loans while wider than a same-rated one, which is compensation aligned with the cohort but not with the issuer's releveraging record; it is Unclear elsewhere because quotes conflict with year-end terms or do not exist. The final security-selection conclusion is Neutral on J and L because a supported first-lien position and fair compensation are offset by pari dilution risk and a par price with no cushion. The main upside to debt is EBITDA-led deleveraging toward 5.17x gross by FY2027. The main downside risk is another debt-funded distribution. Further analysis would require authenticated dated quotes for every instrument including the notes, reconciled facility identifiers, an enterprise value and the executed debt documents. Security selection completed with limitations: recommendation Neutral on Tranches J and L and Requires More Work elsewhere; relative value Fair on J and L and Unclear elsewhere; key gaps are note prices, quote authentication and an enterprise value.
Basis: Market-implied risk (CP-3D); Earnings quality (CP-1D); Forward credit model (CP-2G); calculation V15; calculation V19

### Portfolio Fit

Overall, Tranches J and L are Watchlist for portfolio implementation and every other TransDigm instrument Requires More Work. The sizing posture is driven by a Neutral security call on fair compensation, which matters because a par first-lien loan with no price cushion and pari dilution risk offers carry rather than convexity, and implies a defensive senior secured role only if a mandate has room for an issuer whose net leverage is 6.02x pro forma for the 2024-10-18 payment (4.88x at year end). The binding constraint is missing portfolio data: no mandate, holdings, concentration limits, rating-bucket capacity or constraints workbook was supplied, so concentration, correlation and risk budget cannot be tested and no numeric size is expressed. Liquidity evidence is limited to displayed widths of 0.13% of par and 0.25% of par, so exit cost under stress is not assessable. The top trigger is a new secured issue alongside a special dividend, which would move the loans from Watchlist toward Avoid for new money. Portfolio fit completed with limitations: sizing posture Watchlist on Tranches J and L and Requires More Work elsewhere; missing inputs are the mandate, holdings, limits and trading depth.
Basis: Market-implied risk (CP-3D); Financial foundation (CP-1); calculation V13; calculation V14

### Events: Instruments

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: every dated instrument maturity, issuance and repricing is already recorded by Legal & covenants, Business & governance, Liquidity and Source readiness; no call date, put date or offer deadline is stated in the documents | Not supplied: no additional dated instrument event | Not supplied: no additional dated instrument event | Not supplied: no additional dated instrument event | Not supplied: no additional dated instrument event | Not supplied: the annual report states no note redemption schedule in the pages searched | Not supplied: the November 2027 subordinated maturity and the 2031-02-28 and 2032-01-19 maturities of Tranches J and L, recorded elsewhere, set the horizon of this security call |

### Recovery waterfall

| Line | Amount | Low | Base | High | Currency | Scale |
|---|---|---|---|---|---|---|
| Enterprise value | Not supplied: no peer or transaction multiple and no restructuring valuation exist | Not supplied: no peer or transaction multiple and no restructuring valuation exist | Not supplied: no peer or transaction multiple and no restructuring valuation exist | Not supplied: no peer or transaction multiple and no restructuring valuation exist | USD | million |
| EV multiple | Not supplied: CP-1C T4.10 states no peer multiple | Not supplied: no peer multiple | Not supplied: no peer multiple | Not supplied: no peer multiple | — | x |
| EV metric | 3813 | 3813 | 3813 | 3813 | USD | million |
| EV basis | CP-1C T4.10 EV/EBITDA: no peer or transaction multiple supplied (Low, Median and High all not supplied); metric is FY2024 reported EBITDA USD 3,813 million from Financial foundation (CP-1); Restructuring scenario (CP-4C) activated no valuation | — | — | — | USD | million |
| Cost: administrative and restructuring costs | Not supplied: no restructuring case activated | Not supplied: no restructuring case activated | Not supplied: no restructuring case activated | Not supplied: no restructuring case activated | USD | million |
| Claim: Trade receivable securitization (domestic receivables pool) | 486 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: Term loans Tranches I, J, K, L, revolver and six secured note series (rank equally) | 19534 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: Senior subordinated notes due 2027, January 2029 and May 2029 | 4581 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Fulcrum | Not supplied: no enterprise value supported | Not supplied: no enterprise value supported | Not supplied: no enterprise value supported | Not supplied: no enterprise value supported | — | — |
| Residual to equity | Not supplied: no enterprise value supported | Not supplied: no enterprise value supported | Not supplied: no enterprise value supported | Not supplied: no enterprise value supported | USD | million |

Claims are carrying values at 2024-09-30; principal is USD 19,702 million for the secured layer and USD 4,600 million for the subordinated notes. Finance leases and government advances of USD 279 million are left out because their rank is not stated, and the revolver's USD 67 million of letters of credit are contingent. The coverage thresholds in the appendix show the reported-EBITDA multiple at which each class would be whole; they are not recoveries.

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 9 |
| Calculated | 10 |
| Assumption-Based | 1 |
| Analyst Inference | 6 |
| Weak Lineage | 2 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 4 |
| Fields present | 13 |
| Fields total | 15 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

Module status: Ready with Limitations. Execution mode: Capital-Structure RV. Instrument preference status: completed with limitations. Portfolio fit status: completed with limitations; output mode is generic portfolio-fit logic.

#### Reconciliation with the market-implied analysis

| Issue | Market-implied analysis position | This analysis | Consequence | Source |
|---|---|---|---|---|
| Quote date assigned for the run | Blocks historical market inference, default probability and dislocation conclusions | Accepted as the maintained relative-value basis for an instrument comparison only; no market-implied default or dislocation is inferred | Fair label on J and L carries Weak Lineage; if rejected, J and L fall to Requires More Work | Market-implied risk (CP-3D) |
| Facility identity | K, M and N unresolved; J size differs by USD 9 million; L maturity differs by one day | J and L accepted as unique borrower, facility, currency, maturity and seniority matches with logged differences; K, M and N blocked | Security selection withheld on K, M and N | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Comparables | Descriptive only, terms unaligned | Used as labelled benchmark context; index rows kept out of the peer sample | Comparison supports Fair, not Cheap or Rich | Market-implied risk (CP-3D) |

#### Loan market observations

| Facility | Bloomberg ID | Bid | Ask | Mid YTM | Three-year DM | Contractual terms at year end | Identity status | Source |
|---|---|---|---|---|---|---|---|---|
| Tranche J | BL466719 Corp | 100.00% of par | 100.13% of par | 6.2% | 247 bp (−3 bp versus 250 bp margin) | USD 3,632 million; Term SOFR plus 2.50%, no floor; 2031-02-28; repriced from Term SOFR plus 3.25% on 2024-06-04 | Accepted; sheet size 3641 versus 3632 | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Business & governance (CP-1A) |
| Tranche K | BL522943 Corp | 99.94% of par | 100.13% of par | 5.9% | 224 bp (−51 bp versus 275 bp margin) | USD 1,699 million; Term SOFR plus 2.75%; 2030-03-22 | Conflicted: sheet USD 3,544 million and 225 bp margin | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Tranche L | BL475283 Corp | 99.88% of par | 100.13% of par | 6.2% | 250 bp (3 bp wider than J) | USD 1,500 million; Term SOFR plus 2.50%, no floor; 2032-01-19 | Accepted; sheet maturity 2032-01-20 | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Quoted M | BL520309 Corp | 99.88% of par | 100.13% of par | 6.2% | 250 bp | No matching year-end facility | Blocked | Market-implied risk (CP-3D) |
| Quoted N | BL555762 Corp | 99.88% of par | 100.25% of par | 6.2% | 248 bp | No matching year-end facility | Blocked | Market-implied risk (CP-3D) |

Market date basis: 2024-09-30 as stated in the run settings and the relative-value sheet; quote type indicative, execution status not stated; facility labels Ba3 / BB- per the sheet, unverified.

#### Comparable context

| Comparator | Type | Rating label (sheet) | Maturity | Three-year DM | Tranche J difference | Comparability limitation | Source |
|---|---|---|---|---|---|---|---|
| Bloomberg US Leveraged Loan Index Ba (I38940US) | Index benchmark, not a peer | Ba cohort | Index | 251 bp | −4 bp (4 bp inside the index) | Methodology, constituents and duration not aligned | Market-implied risk (CP-3D); calculation V15 |
| Bloomberg US Leveraged Loan Index Ba/B (I38935US) | Index benchmark, not a peer | Ba/B cohort | Index | 416 bp | −169 bp | Mixed credit cohort | Market-implied risk (CP-3D) |
| StandardAero B1 (BL4793859) | USD first-lien loan peer | Ba3 / BB- | 2031-10-31 | 193 bp | 54 bp wide | Guarantee, covenants, call terms and financial policy not aligned | Market-implied risk (CP-3D); calculation V16 |
| Ontic B (BL5177714) | USD first-lien loan peer | B2 / B | 2030-10-17 | 234 bp | 13 bp wide | Weaker rating label and shorter maturity | Market-implied risk (CP-3D); calculation V18 |
| Chromalloy B (BL5174752) | USD first-lien loan peer | B2 / B- | 2031-03-27 | 320 bp | 73 bp tighter (−73 bp) | Weaker rating label; credit and size not aligned | Market-implied risk (CP-3D); calculation V17 |

#### Claim coverage thresholds

| Layer | Cumulative claim (USD millions) | On reported EBITDA 3813 | On EBITDA As Defined 4173 | On downside FY2025 EBITDA 3355.3 | With indicative secured capacity 3244 used | Source |
|---|---|---|---|---|---|---|
| Securitization plus senior secured | 20020 | 5.25x | 4.80x | 5.97x | 23264 claim; 6.10x | calculation V1; calculation V3; calculation V5; calculation V7; calculation V9; calculation V11 |
| Plus senior subordinated notes | 24601 | 6.45x | 5.90x | 7.33x | 27845 claim; 7.30x | calculation V2; calculation V4; calculation V6; calculation V8; calculation V10; calculation V12 |
| Senior secured alone (memo) | 19534 | 5.12x | Not supplied: not computed | Not supplied: not computed | Not applicable: memo | Financial foundation (CP-1) |

#### T3.3 Issuer / security scorecard

<!-- table-id: T3.3 -->
| Category | Factor | Weight | Raw Score 1–5 | Weighted Score | Confidence | Evidence | Risk Mechanic | Credit Implication | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| Business risk | Franchise, pricing power and end-market mix | Not supplied: no mandate, sector or user weights | 2 | Not Scorable: weights absent | High | About 90% proprietary and about 55% aftermarket sales; EBITDA As Defined margin 52.56% | Certified sole-source parts sustain pricing through moderate volume swings | Supports debt service and going-concern value behind every class | S1 | Fundamental credit (CP-2); Business & governance (CP-1A) |
| Financial risk | Leverage | Not supplied: no mandate, sector or user weights | 4 | Not Scorable: weights absent | High | Gross 6.53x reported EBITDA; net 4.88x at year end and 6.02x pro forma for the 2024-10-18 dividend; 5.93x on supported EBITDA of USD 3,871 million; base forecast gross 5.17x by FY2027; downside FY2025 gross 7.39x | Distribution-funded debt holds leverage high; deleveraging depends on EBITDA growth | High leverage for every class; secured claims alone 5.12x | S2 | Financial foundation (CP-1); Earnings quality (CP-1D); Forward credit model (CP-2G) |
| Financial risk | Free cash flow and coverage | Not supplied: no mandate, sector or user weights | 2 | Not Scorable: weights absent | Medium | Free cash flow USD 1,880 million (49.31% of reported EBITDA); scheduled interest USD 1,524 million gives 2.50x cover against 3.29x on cash paid; downside FY2025 cover 2.16x | Interest step-up absorbs part of free cash flow but leaves it positive | Debt service internally funded; coverage moves before liquidity | S3 | Financial foundation (CP-1); Forward credit model (CP-2G) |
| Liquidity | Near-term liquidity | Not supplied: no mandate, sector or user weights | 2 | Not Scorable: weights absent | High | Cash liquidity USD 7,267 million at year end and USD 2,919 million pro forma after the 2024-10-18 payment; securitization USD 650 million due 2025-07-11 | October payment more than halves the buffer; recurring operations still fund scheduled uses | Low near-term default probability from liquidity | S4 | Liquidity (CP-2D) |
| Refinancing | Maturity wall | Not supplied: no mandate, sector or user weights | 3 | Not Scorable: weights absent | Medium | No term loan or note matures before November 2027; FY2028 USD 6,637 million and FY2029 USD 4,768 million, together USD 11,405 million (46.90% of the ladder) | Wall refinanced at market coupons after repeated releveraging | Deferred but concentrated refinancing risk; J and L mature after it | S5 | Refinancing & LME (CP-3C); Fundamental credit (CP-2) |
| Governance | Financial policy | Not supplied: no mandate, sector or user weights | 5 | Not Scorable: weights absent | High | USD 6,368 million special distributions declared in FY2024; USD 3,000 million secured debt funded 69% of the USD 4,348 million September payment; debt prepayment ranked last | Growth converted into distributions and pari secured claims | Leverage held, not reduced; recovery dilution for all classes, worst for subordinated | S6 | Business & governance (CP-1A) |
| Financial risk | Earnings quality | Not supplied: no mandate, sector or user weights | 3 | Not Scorable: weights absent | Medium | Supported EBITDA USD 3,871 million against USD 4,173 million As Defined; gap USD 302 million of recurring costs | Ratio-based capacity measured on the wider figure | Contractual headroom overstated by about 0.43x | S7 | Earnings quality (CP-1D) |
| Legal | Covenant protection | Not supplied: no mandate, sector or user weights | 4 | Not Scorable: weights absent | Low | No maintenance covenant; springing 7.50x revolver test above USD 364 million usage; incurrence 7.25x net and 5.00x secured net; aggressiveness 4 of 5, provisional | Lender control arrives late; secured layering permitted | Protection rests on incurrence ratios, not maintenance tests | S8 | Legal & covenants (CP-4) |
| Structure | Senior secured position (term loans, revolver, six secured note series) | Not supplied: no mandate, sector or user weights | 2 | Not Scorable: weights absent | Medium | Pari senior secured; guarantor group 79.27% of FY2024 net sales; collateral includes cash; USD 19,534 million carrying; covered at 5.25x reported EBITDA including the securitization ahead | Pari dilution up to indicative USD 3,244 million under the 5.00x secured test | Supported structural position; recovery moves with enterprise value and further secured issuance | S9 | Legal & covenants (CP-4); calculation V3 |
| Structure | Senior subordinated position (three note series) | Not supplied: no mandate, sector or user weights | 4 | Not Scorable: weights absent | Medium | USD 4,581 million behind secured claims; attaches at 5.25x and detaches at 6.45x reported EBITDA; payment blockage after senior default; structurally junior to non-guarantor liabilities | Each secured issue raises the attachment point | High recovery sensitivity | S10 | Legal & covenants (CP-4); calculation V4 |
| Technicals | Trading liquidity | Not supplied: no mandate, sector or user weights | Not Assessable | Not Scorable: weights absent | Not Assessable | Displayed width 0.13% of par on J and 0.25% of par on L; no depth, trade or dealer evidence | Displayed width is not executable capacity | Exit cost under stress not established | S11 | Market-implied risk (CP-3D); calculation V13; calculation V14 |
| Composite | Weighted composite and credit tier | Not supplied: no governing weights in the run settings | Not Scorable | Not Scorable | Not Assessable | Ten factors scored unweighted from 2 to 5; equal weighting not substituted | A precise composite would need weights the evidence does not supply | Credit tier Not Scorable; financial policy is the weakest factor | S0 | Fundamental credit (CP-2) |

Composite score: Not Scorable. Credit tier: Not Scorable. No hard-risk override is applied, because there is no composite to cap.

#### T3.6 Fundamental value matrix

<!-- table-id: T3.6 -->
| Security / Issuer | Fundamental View | Relative-Value View | Structural / Recovery View | Final Matrix Bucket | Rationale | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated (issuer) | Strong franchise, adequate liquidity, aggressive financial policy; composite Not Scorable | Fair on J and L; Unclear elsewhere | Secured layer whole at 5.25x, subordinated at 6.45x reported EBITDA; no enterprise value | Neutral on identity-matched first-lien loans; Requires More Work elsewhere | Business quality and liquidity offset by releveraging; only two instruments have usable prices | S1; S2; S4; S6; S9; S10 | Fundamental credit (CP-2); Legal & covenants (CP-4) |
| Tranche J term loan | First-lien claim on the same credit | Fair: 247 bp, −4 bp versus Ba index, 54 bp wide of a same-rated aerospace loan | Pari senior secured; recovery not quantified | Neutral | Fair cohort pricing; par price, no cushion against pari dilution | S2; S6; S9; S11 | Market-implied risk (CP-3D) |
| Tranche L term loan | First-lien claim on the same credit | Fair: 250 bp, 3 bp wider than J | Pari senior secured; raised with the September 2024 dividend | Neutral | As Tranche J; maturity one day different from the annual report | S2; S6; S9; S11 | Market-implied risk (CP-3D) |
| Tranche K term loan | First-lien claim on the same credit | Unclear: quote size and margin conflict with year-end terms | Pari senior secured | Requires More Work | Identity conflicted; no comparison allowed | S9 | Market-implied risk (CP-3D) |
| Tranche I term loan and quoted M and N | First-lien claim on the same credit | Unclear: no quote for I; M and N have no year-end facility | Pari senior secured | Requires More Work | No usable market value | S9 | Market-implied risk (CP-3D) |
| Six secured note series, 2028 to 2033 | First-lien claim; 2028 and 2029 series inside the refinancing wall | Unclear: no price | Pari with the loans; later-series guarantees follow credit-agreement guarantors | Requires More Work | Structure supported, compensation unknown | S5; S8; S9 | Legal & covenants (CP-4) |
| Three senior subordinated note series, 2027 and 2029 | Serviceable today; first in the refinancing sequence | Unclear: no price | Triple subordination; attaches above 5.25x, 6.10x with secured capacity used | Requires More Work, with structural caution | Highest loss severity; no compensation to test | S5; S6; S10 | Legal & covenants (CP-4); Refinancing & LME (CP-3C) |

#### T3B.1 Source register

<!-- table-id: T3B.1 -->
| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use | Source |
|---|---|---|---|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Form 10-K FY2024, audited | High | FY ended 2024-09-30; filed 2024-11-07 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrower and issuer | Tranche principal, margins, maturities, no floor, revolver terms, note coupons and maturities | No redemption schedule or call terms found; executed documents incorporated by reference only | Used here for instrument identity and the capital structure | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| Run settings | Loan quotes for Tranches J, K, L, M, N and facility rating labels | Low: hand transcription, date assigned for the run | 2024-09-30 assigned | TransDigm term loan facilities | Bid, ask, YTM and three-year DM per facility; facility labels Ba3 / BB- | Quote type, executability and observation time not stated | Used here as the maintained relative-value basis for J and L | Market-implied risk (CP-3D) |
| Market-implied risk | Market-implied risk analysis for this run (status blocked) | Low | 2024-09-30 assigned | TransDigm loans; index and aerospace loan comparables | Bloomberg identifiers, identical quote figures, index and peer discount margins, identity conflicts | Blocked for historical market inference | Used here for comparables and identity tests | Market-implied risk (CP-3D) |
| Financial foundation | Financial foundation for this run | High | FY2024 and FY2023; pro forma 2024-10-18 | Consolidated | Debt by instrument, leverage, coverage, free cash flow, definition conflicts | Covenant headroom not established | Used here for claims and credit metrics | Financial foundation (CP-1) |
| Legal & covenants | Legal and covenant read for this run | Medium | As of 2024-09-30 | Credit group and guarantors | Ranking, guarantees, incurrence tests, indicative capacity, subordination | Summary authority only | Used here for structural position | Legal & covenants (CP-4) |
| Fundamental credit; Earnings quality; Liquidity; Forward credit model | Fundamental analyses for this run | Medium to High | FY2024; FY2025 to FY2027 forecasts | Consolidated | Credit view, supported EBITDA, liquidity, forecast cases | Forecasts are analyst assumptions | Used here for scorecard and downside | Fundamental credit (CP-2); Earnings quality (CP-1D); Liquidity (CP-2D); Forward credit model (CP-2G) |
| Refinancing & LME; Restructuring scenario; Peer benchmark; Ratings & triggers | Supporting analyses for this run | Medium | As of 2024-09-30 | Consolidated | Maturity wall and class exposure; no restructuring valuation; no peer multiple; unverified facility ratings | No enterprise value or verified rating | Used here for refinancing, recovery and benchmark limits | Refinancing & LME (CP-3C); Restructuring scenario (CP-4C); Peer benchmark (CP-1C); Ratings & triggers (CP-2H) |

Subsequent capital-structure events scanned: the 2024-10-16 securitization draw and the 2024-10-18 dividend payment are kept out of the period-end stack; the quoted M and N facilities, if they are later financings, are likewise not folded into the 2024-09-30 structure.

#### Inherited definition conflict register

Carried unchanged from Financial foundation; a Source column is added.

| Metric Name | Canonical Definition | Issuer-Reported Definition | Source of Conflict | Periods Affected | Materiality | Modules Affected | Resolution / Recommendation | Source |
|---|---|---|---|---|---|---|---|---|
| Total debt | Balance-sheet carrying value, current plus long-term, net of costs and discounts | Total debt 24880 includes issuance costs, discount and premium (carrying); gross amount 25068 | Carrying against principal | FY2024 (FY2023 carrying 19750) | USD 188 million (C31) | Leverage, recovery and priority work | Carrying value used; principal kept in Debt principal to carrying value | Financial foundation (CP-1) |
| EBITDA | Reported EBITDA as primary denominator | EBITDA As Defined adds back acquisition costs 70, stock and deferred compensation 217, refinancing costs 58 and other 15; the springing revolver test uses consolidated EBITDA defined the same way | Issuer non-GAAP definition | FY2024, FY2023 | USD 360 million in FY2024 and USD 247 million in FY2023 (C78, C79) | Leverage, earnings quality, covenant work | Both shown, labelled; reported EBITDA used as primary | Financial foundation (CP-1) |
| Covenant tests | Not inferred | Incurrence: net leverage 7.25x and secured net debt 5.00x; springing test 7.50x net debt to EBITDA As Defined when revolver usage exceeds 40% (USD 364 million) | Agreements not supplied; Source readiness summary cited 7.50x for incurrence | FY2024 | Headroom not established | Covenant and legal work | Annual report text figure 7.25x used; no headroom computed | Financial foundation (CP-1) |
| Interest | Cash interest paid for cover | Interest expense—net 1286; excluding amortization 1246; cash paid 1158; next-year scheduled interest 1524 | Accrual, amortization and timing | FY2024 | USD 128 million between expense and cash (C73) | Coverage and forecast work | Cash paid used for cover; schedule shown separately as estimated; about 77% of gross debt fixed rate | Financial foundation (CP-1) |
| Working capital change | Sum of cash-flow changes in assets and liabilities | Issuer EBITDA reconciliation adds back 272 for changes in assets and liabilities | Cash-flow lines sum to -302 | FY2024 | USD 30 million (C72) | FFO and earnings quality | Cash-flow lines used; difference left unreconciled | Financial foundation (CP-1) |
| October 2024 dividend payment | One event, all figures shown | 4348 in the annual report (4216 dividend plus 132 equivalents); 4396 for the quarter in the December 2024 quarterly report | Different scope of period | Subsequent to FY2024 | USD 48 million (C74) | Liquidity and pro forma leverage | 4348 used for the pro forma; quarterly figure noted | Financial foundation (CP-1) |
| Debt maturity ladder | Contractual principal of all debt | Issuer schedule 24319 excludes finance leases and the securitization borrowing | Scope of ladder | FY2024 | USD 749 million of debt outside the ladder (487 securitization plus 262 finance leases) | Refinancing and liquidity work | Ladder kept as stated; excluded debt in reconciling items | Financial foundation (CP-1) |
| Free cash flow | Levered, after working capital | No issuer FCF stated | Analyst definition | FY2024, FY2023 | Not applicable | Cash-flow work | Operating cash flow less capex used | Financial foundation (CP-1) |

Additional conflict logged here: the quoted Tranche K size of USD 3,544 million and margin of 225 bp differ from year-end principal of USD 1,699 million and Term SOFR plus 2.75%; both figure sets are kept and the facility is excluded from selection.

#### T3C.1 Portfolio input gate

<!-- table-id: T3C.1 -->
| Input | Available / Missing | Source | Limitation | Portfolio Impact |
|---|---|---|---|---|
| Security-selection conclusions | Available | This analysis, security decision summary | Neutral only on J and L | Defines the only implementable candidates |
| Issuer and security identifiers | Partly available: Bloomberg IDs for quoted loans; none for notes | Market-implied risk (CP-3D) | K, M, N identity conflicted; notes unidentified | Implementation limited to J and L |
| Mandate constraints | Missing | Run settings: no portfolio attachment | No eligibility, rating or leverage limits | No mandate-specific fit; generic logic only |
| Current holdings and exposure | Missing | Run settings: no portfolio attachment | No existing position known | Pro forma exposure not calculable |
| Concentration data | Missing | Run settings: no portfolio attachment | No issuer, sector, rating or maturity limits | Concentration and correlation not testable |
| Portfolio constraints workbook | Missing | Run settings: portfolio workbook not attached | No matching portfolio identity, basis or as-of | No limit, headroom or status usable |
| Liquidity and trading constraints | Partly available: displayed bid-ask only | Market-implied risk (CP-3D) | No depth, trades, dealer count or minimum size | Exit cost not assessable; no scaling assumed |
| Downside, recovery, legal and refinancing inputs | Available, qualitative | Forward credit model (CP-2G); Legal & covenants (CP-4); Refinancing & LME (CP-3C) | No enterprise value or recovery percentage | Downside budget directional only |

#### T3C.2 Portfolio fit register

<!-- table-id: T3C.2 -->
| Name / Instrument | Fit Category | Evidence | Risk Mechanic | Why It Fits / Does Not Fit | Constraints / Notes | Source Trace |
|---|---|---|---|---|---|---|
| Tranche J term loan | RV fit | Fair at 247 bp; first lien; matures 2031-02-28 after the FY2028 wall | Floating-rate carry at par; pari dilution by further secured debt | Fits a defensive senior secured or yield-carry role at cohort pricing | Mandate eligibility not established; no numeric size | Market-implied risk (CP-3D); Legal & covenants (CP-4) |
| Tranche L term loan | RV fit | Fair at 250 bp; first lien; matures 2032-01-19 | As Tranche J; raised with the September 2024 dividend | Same role as J with a slightly longer tenor | Quoted maturity differs by one day; no numeric size | Market-implied risk (CP-3D) |
| Tranche K, Tranche I, quoted M and N | Not assessable | Identity conflicted or no quote | Cannot price the position | No decision-useful fit | Resolve identifiers first | Market-implied risk (CP-3D) |
| Six secured note series | Not assessable | No price | Fixed-rate secured claim pari with loans | Role cannot be tested without compensation | Notes inside the FY2028 and FY2029 wall carry refinancing timing | Legal & covenants (CP-4) |
| Three senior subordinated note series | Not assessable | No price; triple subordination; attaches above 5.25x reported EBITDA | Recovery-sensitive; first exposed to secured layering | Would need clear excess compensation to fit any role | Risk-budget caution even when priced | Legal & covenants (CP-4); calculation V3 |

#### T3C.3 Position sizing posture

<!-- table-id: T3C.3 -->
| Name / Instrument | Sizing Posture | Evidence | Reason | Key Risk | Implementation Note | Confidence | Source Trace |
|---|---|---|---|---|---|---|---|
| Tranche J term loan | Watchlist | Neutral security call; Fair compensation; displayed width 0.13% of par | Starter conditions not met: exit capacity and mandate fit unproven | Debt-funded distribution diluting the secured pool | No numeric size; confirm dated quote and depth before any position | Low | Market-implied risk (CP-3D); calculation V13 |
| Tranche L term loan | Watchlist | Neutral security call; Fair compensation; displayed width 0.25% of par | As Tranche J | As Tranche J | No numeric size; confirm maturity and quote | Low | Market-implied risk (CP-3D); calculation V14 |
| Tranche K, Tranche I, quoted M and N | Requires More Work | Identity conflicted or no quote | Posture cannot be set | Mispriced position on a wrong facility | Reconcile identifiers | Low | Market-implied risk (CP-3D) |
| Six secured note series | Requires More Work | No price | Compensation unknown | Pari dilution and refinancing timing | Obtain dated prices | Low | Legal & covenants (CP-4) |
| Three senior subordinated note series | Requires More Work | No price; highest loss severity | Compensation unknown; structural caution | Secured layering ahead | Obtain dated prices and indentures | Low | Legal & covenants (CP-4) |

#### T3C.4 Risk budget flags

<!-- table-id: T3C.4 -->
| Flag | Evidence | Risk Mechanic | Why It Matters | Caution Level | Portfolio Impact | Source Trace |
|---|---|---|---|---|---|---|
| Distribution-funded releveraging | USD 3,000 million secured debt with the September 2024 dividend; USD 6,368 million declared in FY2024 | Pari secured claims added without EBITDA | Dilutes secured recovery and lifts subordinated attachment | High | Caps conviction; no Core posture | Business & governance (CP-1A) |
| Secured capacity under the 5.00x test | Indicative USD 3,244 million | Subordinated attachment rises from 5.25x to 6.10x | Loss severity rises without default | High | Subordinated notes outside risk budget until priced | Legal & covenants (CP-4); calculation V11 |
| Maturity wall | FY2028 USD 6,637 million; FY2029 USD 4,768 million | Refinancing at market coupons | Affects 2027 to 2029 notes most | Medium | Loans maturing after the wall preferred | Refinancing & LME (CP-3C) |
| Liquidity and exit | Displayed widths only | Width is not depth | Exit cost under stress unknown | Not Assessable | No scaling assumed | Market-implied risk (CP-3D) |
| Rating bucket | Facility labels Ba3 / BB- unverified | Benchmark choice depends on rating | Wrong bucket would misstate fair value | Medium | Rating-bucket capacity not testable | Ratings & triggers (CP-2H) |
| Concentration and correlation | No holdings or limits | Cannot test | Single-name and aerospace sector exposure unknown | Not Assessable | No numeric size | Run settings: no portfolio attachment |
| Covenant-light documents | No maintenance covenant; springing test above USD 364 million | Late lender control | Deterioration shows in price before covenants | Medium | Price monitoring is the early warning | Legal & covenants (CP-4) |

#### T3C.5 Concentration and correlation register

<!-- table-id: T3C.5 -->
| Exposure Dimension | Current Exposure | Proposed / Pro Forma Exposure | Limit / Capacity | Evidence Status | Risk Mechanic | Portfolio Implication | Source Trace |
|---|---|---|---|---|---|---|---|
| Issuer / group | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Not Provided | Single-name loss from releveraging | Issuer limit binds once supplied | Run settings: no portfolio attachment |
| Sector / subsector | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Not Provided | Aerospace exposure correlates with commercial air traffic and defense outlays | Check aerospace concentration | Fundamental credit (CP-2) |
| Sponsor / ownership | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Source Fact: widely held, no sponsor | No sponsor support or exit | No sponsor-level aggregation needed | Business & governance (CP-1A) |
| Rating bucket | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Source Fact: facility labels Ba3 / BB-, unverified | Bucket choice drives eligibility | Confirm agency rating before allocation | Ratings & triggers (CP-2H) |
| Maturity year / wall | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Source Fact: J 2031, L 2032; issuer wall FY2028 USD 6,637 million | Loans mature after the issuer wall | Lower refinancing-timing overlap for J and L | Refinancing & LME (CP-3C) |
| Capital-structure layer | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Calculation: secured USD 19,534 million; subordinated USD 4,581 million | Secured layering shifts loss to juniors | Holding both layers doubles exposure to one policy risk | Financial foundation (CP-1) |
| Correlated holdings / common factor | Not provided: no holdings supplied | Not provided: no proposed size | Not provided: no mandate | Not Provided | Floating-rate loan beta and aerospace cycle | Test against existing aerospace and Ba loan holdings | Market-implied risk (CP-3D) |

#### T3C.6 Liquidity and implementation assessment

<!-- table-id: T3C.6 -->
| Liquidity / Implementation Factor | Evidence | Risk Mechanic | Implementation Consequence | Constraint / Action | Source Trace |
|---|---|---|---|---|---|
| Trading depth, bid-ask and dealer colour | Displayed width 0.13% of par on J and 0.25% of par on L; facility sizes USD 3,632 million and USD 1,500 million | Width without size is not execution evidence | Cost of entry and exit not established | Obtain executable two-sided size and dealer count | Market-implied risk (CP-3D); calculation V13; calculation V14 |
| Settlement, minimum size and operational constraint | Not provided: no settlement or minimum-assignment terms | Loan settlement can delay exit | Not assessable | Confirm assignment minimums and consent rights | Market-implied risk (CP-3D) |
| Exit route under stress | Not provided: no trade or depth history | Loan liquidity can vanish in stress | Exit risk not assessable | Hold posture at Watchlist | Market-implied risk (CP-3D) |
| Ability to add or trim | Par price; issuer repriced J in June 2024 | Repricing risk caps price upside on adds | Adds at par carry repricing risk; trims depend on depth | Monitor repricing notices | Business & governance (CP-1A) |

#### T3C.7 Downside budget and recovery sensitivity

<!-- table-id: T3C.7 -->
| Downside Scenario / Driver | Input Basis | Formula / Method | Result / Directional View | Portfolio Loss / Risk-Budget Implication | Status | Source Trace |
|---|---|---|---|---|---|---|
| Price downside | Quotes at par; no duration, spread duration or stress spread | Price change = spread duration × spread move; inputs absent | No price stress calculated | Loss at size not calculable; no size supplied | Not Calculable | Market-implied risk (CP-3D) |
| Recovery / LGD sensitivity | Claims at carrying value; reported, As Defined and downside EBITDA | Cumulative claim ÷ EBITDA = enterprise value multiple at which each class is whole | Secured layer whole at 5.25x reported (5.97x on downside EBITDA); subordinated at 6.45x (7.33x) | Subordinated loss severity materially higher; secured exposed only below about 5.25x | Directional Only | calculation V3; calculation V4; calculation V7; calculation V8 |
| Refinancing / maturity-wall downside | FY2028 USD 6,637 million; downside FY2025 cover 2.16x and gross leverage 7.39x | Forecast cases | Refinancing at weaker terms if earnings fall; J and L mature after the wall | Price risk for 2027 to 2029 notes greater than for J and L | Directional Only | Forward credit model (CP-2G); Refinancing & LME (CP-3C) |
| Legal / priming / leakage downside | Indicative secured capacity USD 3,244 million under the 5.00x test | Add capacity to secured layer | Subordinated attachment 6.10x and detachment 7.30x reported EBITDA | Subordinated notes bear dilution first; secured holders diluted pari passu | Calculated | Legal & covenants (CP-4); calculation V11; calculation V12 |

#### T3C.8 Monitoring and add / trim triggers

<!-- table-id: T3C.8 -->
| Trigger ID | Indicator | Leading / Lagging | Threshold or Qualitative Signal | Linked Risk Flag | Portfolio Action | Source Trace | Limitation |
|---|---|---|---|---|---|---|---|
| MON-001 | New secured issue or special dividend declaration | Leading | Any secured issuance alongside a distribution | Distribution-funded releveraging | Avoid new money; escalate | Business & governance (CP-1A) | Basket sizes not established |
| MON-002 | Authenticated dated quote and depth on Tranches J and L | Leading | Dated executable two-sided size confirming about 247 bp to 250 bp | Liquidity and exit | Add-eligible review from Watchlist to Starter | Market-implied risk (CP-3D) | Quantitative threshold not available in provided materials |
| MON-003 | Tranche J discount margin versus Ba loan index | Leading | Persistent widening versus the index without a market move | Rating bucket | Escalate; reassess Fair label | Market-implied risk (CP-3D) | Quantitative threshold not available in provided materials |
| MON-004 | Revolver usage | Leading | Above USD 364 million activates the 7.50x springing test | Covenant-light documents | Escalate | Legal & covenants (CP-4) | Contractual definitions not supplied |
| MON-005 | Securitization renewal | Leading | No extension or funded repayment before 2025-07-11 | Maturity wall | Monitor; hold posture | Liquidity (CP-2D) | Renewal terms not supplied |
| MON-006 | Refinancing of the November 2027 subordinated notes | Leading | Takeout with secured debt raises subordinated attachment | Secured capacity under the 5.00x test | Avoid subordinated notes on secured takeout | Refinancing & LME (CP-3C) | Future terms not established |
| MON-007 | Quarterly EBITDA and interest cover | Lagging | Year-on-year EBITDA decline toward the downside path (FY2025 cover 2.16x) | Maturity wall | Trim or avoid adds | Forward credit model (CP-2G) | Annual cases only |
| MON-008 | Repricing request on J or L | Leading | Issuer repricing notice | Liquidity and exit | Hold; reassess carry | Business & governance (CP-1A) | No call protection terms read |

#### T3C.9 Gaps ledger

<!-- table-id: T3C.9 -->
| Gap ID | Missing Data | Why It Matters | Affected Sizing / Risk Budget / Trigger | Consequence for Confidence | Required Follow-Up Source |
|---|---|---|---|---|---|
| GAP-001 | Mandate, holdings, limits and constraints workbook | Fit and size cannot be tested | All sizing postures; concentration register | High | Portfolio mandate and constraints workbook matching this portfolio and date |
| GAP-002 | Authenticated dated quotes with execution status | Fair label rests on a transcription dated for the run | J and L posture; MON-002 | High | Maintained sector relative-value workbook or dealer runs |
| GAP-003 | Note prices for all nine series | No compensation test for notes | Notes postures; subordinated risk budget | High | Dated note prices |
| GAP-004 | Reconciled identifiers for K, M and N | Selection blocked | K, M, N postures | Medium | Facility identifiers tied to legal terms |
| GAP-005 | Enterprise value | No recovery percentage or fulcrum | Recovery downside budget | Medium | Peer or transaction multiples, or a restructuring valuation |
| GAP-006 | Trading depth, settlement and minimum size | Exit cost not assessable | Liquidity factors; MON-002 | Medium | Trade and depth history |
| GAP-007 | Executed debt documents | Secured capacity and release terms indicative | Legal downside; MON-006 | Medium | Credit agreement, indentures, intercreditor agreement |
| GAP-008 | Verified agency ratings | Benchmark cohort and eligibility | Rating-bucket flag; MON-003 | Low | Dated agency publications |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| V1 | Securitization plus senior secured claims | 486 + 19534 | 20020 | 2024-09-30, USD millions carrying value | Financial foundation (CP-1) |
| V2 | Plus senior subordinated notes | 486 + 19534 + 4581 | 24601 | 2024-09-30, USD millions carrying value | Financial foundation (CP-1) |
| V3 | Secured layer coverage threshold on reported EBITDA | 20020 / 3813 | 5.2505 (5.25x) | FY2024, x | calculation V1; Financial foundation (CP-1) |
| V4 | Subordinated detachment on reported EBITDA | 24601 / 3813 | 6.4519 (6.45x) | FY2024, x | calculation V2 |
| V5 | Secured layer threshold on EBITDA As Defined | 20020 / 4173 | 4.7975 (4.80x) | FY2024, x | calculation V1; Financial foundation (CP-1) |
| V6 | Subordinated detachment on EBITDA As Defined | 24601 / 4173 | 5.8953 (5.90x) | FY2024, x | calculation V2 |
| V7 | Secured layer threshold on downside EBITDA | 20020 / 3355.3 | 5.9667 (5.97x) | FY2025 downside forecast EBITDA, x | calculation V1; Forward credit model (CP-2G) |
| V8 | Subordinated detachment on downside EBITDA | 24601 / 3355.3 | 7.3320 (7.33x) | FY2025 downside forecast EBITDA, x | calculation V2; Forward credit model (CP-2G) |
| V9 | Secured layer with indicative secured capacity used | 20020 + 3244 | 23264 | 2024-09-30 pro forma, USD millions | calculation V1; Legal & covenants (CP-4) |
| V10 | Plus subordinated notes | 23264 + 4581 | 27845 | 2024-09-30 pro forma, USD millions | calculation V9 |
| V11 | Subordinated attachment with capacity used | 23264 / 3813 | 6.1012 (6.10x) | FY2024, x | calculation V9 |
| V12 | Subordinated detachment with capacity used | 27845 / 3813 | 7.3026 (7.30x) | FY2024, x | calculation V10 |
| V13 | Tranche J displayed ask less bid | 100.13 − 100.00 (run settings quote) | 0.13% of par | Quote dated 2024-09-30 as assigned, % of par | Market-implied risk (CP-3D) |
| V14 | Tranche L displayed ask less bid | 100.13 − 99.88 (run settings quote) | 0.25% of par | Quote dated 2024-09-30 as assigned, % of par | Market-implied risk (CP-3D) |
| V15 | Tranche J DM less Ba loan index DM | 247 − 251 | −4 bp | 2024-09-30 as assigned, bp | Market-implied risk (CP-3D) |
| V16 | Tranche J DM less same-rated aerospace loan DM | 247 − 193 | 54 bp | 2024-09-30 as assigned, bp | Market-implied risk (CP-3D) |
| V17 | Tranche J DM less weaker-rated aerospace loan DM | 247 − 320 | −73 bp | 2024-09-30 as assigned, bp | Market-implied risk (CP-3D) |
| V18 | Tranche J DM less lower-rated aerospace loan DM | 247 − 234 | 13 bp | 2024-09-30 as assigned, bp | Market-implied risk (CP-3D) |
| V19 | Tranche L DM less Tranche J DM | 250 − 247 | 3 bp | 2024-09-30 as assigned, bp | Market-implied risk (CP-3D) |
| V20 | Tranche J DM less contractual margin | 247 − 250 | −3 bp | 2024-09-30, bp | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| V21 | Senior secured principal | 8702 + 11000 | 19702 | 2024-09-30, USD millions principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| V22 | Tranche K quoted DM less contractual margin | 224 − 275 | −51 bp | 2024-09-30, bp | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |

The coverage thresholds use carrying-value claims and gross EBITDA multiples; they show where each class would be whole, not what it would recover. Quote figures come from the run settings and match the market-implied analysis exactly. Year-end net debt is USD 18,619 million and USD 22,967 million pro forma for the 2024-10-18 dividend payment, as stated by Financial foundation; no new net-debt figure is calculated here.

## Gaps

| Gap | Why it matters | Severity |
|---|---|---|
| The maintained sector relative-value workbook was not supplied; the only quotes are a hand transcription whose date was assigned for the run, with execution status not stated | The Fair label on Tranches J and L carries weak lineage; if rejected, both fall to Requires More Work | Material |
| No enterprise value from peer multiples, transaction multiples or a restructuring valuation | No recovery percentage, fulcrum or residual can be stated; recovery views are coverage thresholds only | Material |
| No note prices for any of the nine series | Secured and subordinated notes cannot be labelled for relative value | Minor |
| Tranche K quote conflicts with year-end terms; quoted M and N have no year-end facility | Selection withheld on those facilities | Minor |
| No mandate, holdings, limits or constraints workbook | Sizing stops at a posture; no numeric size | Minor |
| No scorecard weights | Composite score and credit tier not scorable | Minor |
| No call protection or redemption schedule found in the annual report | Repricing and call risk on loans and notes cannot be quantified | Minor |
| Use restriction | These conclusions are relative-value and instrument-preference views on the stated evidence; they are not a rating, a valuation, a recovery estimate, a trade instruction or a position size | Minor |

## Next module

The orchestrator selects the next module.
