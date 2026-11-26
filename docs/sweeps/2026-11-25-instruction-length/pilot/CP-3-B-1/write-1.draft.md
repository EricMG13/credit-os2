---
issuer_id: tdg
module_id: CP-3
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
committee_status: Requires More Work
execution_mode: Capital-Structure RV
---

## Request

Relative value and security selection for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is capital-structure relative value across the receivables facility, term loans, secured notes and senior subordinated notes, instrument preference after structural position and recovery sensitivity, and generic portfolio fit without numeric sizing.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Carrying amounts and fair values of every debt instrument at 30 September 2024, with fair-value basis (quoted market prices for notes, agent information for term loans); lease maturities; instrument terms, ranking and incurrence tests as relied on through prior analyses |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate, absence of executed debt documents, dated October 2024 events |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Debt by instrument at principal and carrying value, reported and adjusted EBITDA, leverage, post-balance-sheet adjustment for the 2024-10-18 payment, definition conflict register |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Financial policy, debt-funded distributions, secured-for-subordinated refinancing, governance risk High |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Confirms no peer set and no implied enterprise value |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported EBITDA of USD 3,871 million and leverage on supported earnings |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Fundamental credit view, strengths and weaknesses, downside path |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Ranking, guarantor coverage, payment blockage, indicative secured incurrence capacity, priming and leakage routes |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Pro forma liquidity, securitization maturity, springing revolver threshold |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Base, upside and downside leverage and coverage paths, cumulative free cash flow against FY2028 maturities |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Facility rating indications not verified; no agency trigger established |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Transcribed loan observations, Ba and Ba/B loan index levels and aerospace loan comparables; its blocked status and facility identity conflicts |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Maturity wall, years to maturity, creditor-class exposure, secured layering as the demonstrated adverse mechanism |
| Recovery & fulcrum (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Distress gate not met; no enterprise value, fulcrum or class recovery |

## Findings

### Bottom line

Avoid TransDigm's 2029 senior subordinated notes and keep the senior secured loans and notes on watch: those subordinated notes yield no more than secured notes of the same year despite three layers of subordination, while secured relative value cannot yet be confirmed.

On the year-end fair values in the 2024 annual report, the January and May 2029 subordinated notes yield about 5.49% and 5.56% against about 5.58% for the March 2029 secured notes. They sit behind USD 20,020 million of securitization and secured claims, 5.25x FY2024 reported EBITDA, and indicative secured capacity of USD 3,244 million could lift that to 6.10x. Term loans are valued at 99.91% of principal and the Tranche J entry sits 4 bp inside the Ba loan index, but those loan entries are unauthenticated and no bond spreads or external comparables are supplied, so no secured instrument earns Preferred or Neutral. Net leverage is 6.02x pro forma for the 2024-10-18 dividend, against 4.88x at year end.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4); Market-implied risk (CP-3D); Financial foundation (CP-1); calculation V1; calculation V13; calculation V14; calculation V15; calculation V19; calculation V21

### Key findings

- The 2029 subordinated notes are not being paid for subordination, so they are the Avoid in the structure. Their approximate yields of 5.49% and 5.56% are 8.69 bp and 1.67 bp below the 2029 secured notes' 5.58%, while they rank behind all secured debt, can be blocked from debt service after a senior default and sit structurally behind non-guarantor subsidiaries. A creditor can hold the same issuer, currency and maturity year one rank higher for the same yield, which is the cleaner way to own this credit.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4); calculation V13; calculation V14; calculation V15; calculation V16; calculation V17

- Secured layering, not default, is the loss channel for subordinated holders, and it has already been used. The board funded the September 2024 dividend with USD 3,000 million of new secured debt and declared USD 6,368 million of special distributions in FY2024. Secured claims plus the securitization already equal 5.25x reported EBITDA, and the 5.00x secured incurrence test still leaves about USD 3,244 million of indicative room, which would push the subordinated attachment point to 6.10x.
Basis: Business & governance (CP-1A); Legal & covenants (CP-4); calculation V19; calculation V21

- The senior secured layer is the structurally favoured position but cannot be called Preferred. It ranks equally across the term loans, revolver and six secured note series, shares one guarantor group producing 79.27% of FY2024 net sales and benefits from collateral that includes cash. Term loans were valued at 99.91% of principal and the secured notes at 103.50% in aggregate, and the transcribed Tranche J entry of 247 bp three-year discount margin sits 4 bp inside the Ba loan index. Those loan entries are a module-test transcription that Market-implied risk could not authenticate, and no secured note spread or call schedule is supplied, so relative value is Unclear.
Basis: Legal & covenants (CP-4); Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; calculation V1; calculation V11

- The issuer is a strong franchise under an aggressive financial policy, which is why compensation, not default risk, decides selection. Nothing matures before November 2027, pro forma liquidity is USD 2,919 million and free cash flow stays positive in every forecast case, so near-term default probability is low. Against that, net leverage is 6.02x on reported EBITDA pro forma for the 2024-10-18 dividend, 5.93x on supported earnings, and downside cover falls to 2.16x in FY2025. No weighting framework is supplied, so the composite score is not scorable.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); Liquidity (CP-2D); Forward credit model (CP-2G)

- Portfolio implementation is generic only: senior secured paper is Watchlist, the 2029 subordinated notes are Avoid and the 2027 subordinated notes Require More Work. No mandate, holdings, concentration limits or trading depth were supplied, so no numeric size is given and exit risk is not assessable.

### Contrary evidence and what would change the view

The strongest case against avoiding the 2029 subordinated notes is that the yield comparison may flatter the secured notes. The secured notes trade at 103.13% of principal with a 2024 issue date, and their call schedule is not in the documents; if the issuer can redeem them early at a price near today's, their yield to worst sits below the 5.58% yield to maturity, and the subordinated notes, priced below par with low coupons, carry call protection that secured holders lack. A second argument is fundamental: the forward base case takes gross leverage to 5.17x by FY2027 and Recovery & fulcrum finds no distress trigger, so subordinated holders may simply be repaid at par before any secured layering matters. The Avoid would soften to Neutral if dated yield-to-worst levels showed the subordinated notes at least 75 bp to 100 bp wide of same-year secured notes, or if the issuer committed to retain cash rather than fund distributions with secured debt. It would harden if another secured issue accompanied a special dividend. For the secured layer, authenticated quotes from the maintained sector loan data with reconciled facility identities, together with dated secured note spreads, would allow a Fair or Cheap label and a Neutral or Preferred view.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Forward credit model (CP-2G); Recovery & fulcrum (CP-4C); calculation V5; calculation V14

### Limitations

- The subordinated Avoid rests on approximate yields to maturity built from fair values rounded to USD 1 million, without call schedules, accrued interest or yield to worst; if the secured 2029 notes' yield to worst is far below their yield to maturity, a real subordination premium could exist and the Avoid would weaken to Neutral.
- No loan or bond spread from the maintained sector loan data reached this analysis except a test transcription that Market-implied risk blocked, so every secured instrument is labelled Unclear and Requires More Work instead of Fair, Cheap or Rich; authenticated data would let the secured recommendation move either way.
- Tranche K, M and N loan entries conflict with or are absent from the year-end loan terms, so they are excluded from the term-loan relative value; the term-loan view rests on Tranche J alone, with Tranche L matching on size and margin but differing by one day on maturity.
- No enterprise value is supported, because Peer benchmark found no peers and Recovery & fulcrum found no distress case, so class recoveries and the fulcrum are not established; the attachment points in turns of EBITDA show structural order only, and any later recovery built on peer multiples would be indicative, not a valuation.
- Secured incurrence capacity of USD 3,244 million comes from the annual report's summary of the credit agreement, not the executed documents; a free-and-clear or lien basket outside the 5.00x test would raise subordinated dilution risk and strengthen the Avoid.
- No mandate, holdings, concentration limits or trading depth were supplied, so sizing stops at posture labels and exit risk for any position size is not assessable.

### Security selection conclusions

The Tranche J and Tranche L term loans Require More Work because the issuer combines a high-margin, cash-generative franchise with a policy that recycles growth into debt-funded distributions, while relative value is Unclear: the near-par loan entries and the filed term-loan fair value point to pricing in line with a Ba loan cohort, but the entries are unauthenticated. Structurally they sit in the pari secured layer with collateral that includes cash, though new secured debt up to the incurrence ceiling dilutes them. The main upside to debt is EBITDA growth that brings gross leverage toward 5.17x before the November 2027 refinancing window. The main downside risk is a further debt-funded distribution during an earnings slowdown. Monitoring should focus on new secured issuance alongside distributions and revolver usage above USD 364 million.
Basis: Forward credit model (CP-2G); Legal & covenants (CP-4); Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173

The six secured note series Require More Work because their fundamental and structural position matches the term loans, while relative value is Unclear: fair values from 101.40% to 105.80% of principal give prices but no spread, and call schedules are not supplied, so yield to worst cannot be set against any comparable. The main upside is fixed coupons on a pari secured claim through 2033. The main downside risk is secured dilution and a refinancing wall of USD 11,405 million across FY2028 and FY2029. Monitoring should focus on secured issuance and authenticated note spreads.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Refinancing & LME (CP-3C)

The January and May 2029 subordinated notes are Avoid because the issuer's fundamentals do not need a subordinated wrapper to be owned, while relative value is Rich at low confidence: they yield no more than the March 2029 secured notes, and their claim sits behind USD 20,020 million of securitization and secured debt with blockage rights. The main upside to debt is a pull to par if the issuer refinances them on schedule. The main downside risk is secured layering that lifts the attachment point from 5.25x toward 6.10x reported EBITDA. Monitoring should focus on the yield gap between the subordinated and secured 2029 notes and on secured issuance.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4); calculation V16; calculation V19; calculation V21

The November 2027 subordinated notes Require More Work because they share the subordinated structure but mature before the FY2028 wall, while relative value is Unclear: they are valued at 99.51% of principal and no secured note matures close enough to set a like-for-like yield comparison. The main upside is repayment at par within about three years. The main downside risk is a closed unsecured market in 2027 that forces a secured takeout. Monitoring should focus on refinancing progress within 24 months of maturity.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Refinancing & LME (CP-3C); calculation V2

### Final credit and relative-value view

Overall, TransDigm's senior secured debt Requires More Work and its 2029 senior subordinated notes are Avoid. Fundamentally, TransDigm presents a not scorable credit profile because no weighting framework is supplied; unweighted factor scores run from 2 for business position, cash flow and liquidity to 5 for financial policy. Relative value appears Unclear for secured paper because no authenticated spread or comparable reaches this analysis, and Rich at low confidence for the 2029 subordinated notes because they yield no more than same-year secured notes. The main upside to debt is EBITDA growth through FY2027. The main downside risk is debt-funded distributions layering secured claims ahead of junior holders. Further analysis would require authenticated loan and bond spreads with comparables, call schedules, the executed credit agreement and indentures, and a portfolio mandate. Relative value and security selection completed with limitations. Recommendation: Requires More Work for senior secured; Avoid for the 2029 subordinated notes. Relative value: Unclear for senior secured; Rich at low confidence for the 2029 subordinated notes. Key gaps: authenticated market spreads, call schedules, executed debt documents, portfolio constraints.

### Capital structure

| Instrument | Rank and security | Principal / carrying, USD million | Maturity and terms | Market level at 2024-09-30 | Source |
|---|---|---|---|---|---|
| Trade receivable securitization | Secured by domestic trade receivables; rank against credit agreement not stated | 487 / 486; drawn to 650 on 2024-10-16, a subsequent event | 2025-07-11; Term SOFR plus 1.45% | Fair value 486, equal to carrying amount; no quote | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172; Financial foundation (CP-1) |
| Revolving credit facility | Senior secured, credit agreement collateral | Undrawn; commitment 910, letters of credit 67, available 843 | 2029-02-27; Term SOFR plus 2.25% | No quote; springing 7.50x test above USD 364 million usage | Legal & covenants (CP-4) |
| Term loans Tranches I, J, K, L | Senior secured, equal with secured notes | 8,702 / 8,642 | 2028-08-24 to 2032-01-19; Term SOFR plus 2.50% to 2.75% | Fair value 99.91% of principal; Tranche J entry 247 bp three-year DM, 6.2% YTM, bid 100.00 and ask 100.13 points, against Ba loan index 251 bp, a 4 bp difference; entries unauthenticated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Market-implied risk (CP-3D) |
| Secured notes due 2028 to 2033, six series | Senior secured, equal with credit agreement | 11,000 / 10,892 | 2028-08-15 to 2033-01-15; fixed 6.00% to 7.125% | Fair values 101.40% to 105.80% of principal, 103.50% in aggregate; 2029 secured notes approximate YTM 5.58% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4) |
| Senior subordinated notes due 2027 and 2029, three series | Unsecured, contractually and structurally subordinated, subject to payment blockage | 4,600 / 4,581 | 2027-11-15, 2029-01-15, 2029-05-01; fixed 4.625% to 5.50% | Fair values 96.67% to 99.51% of principal, 98.39% in aggregate; 2029 notes approximate YTM 5.49% and 5.56% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4) |
| Finance leases and government refundable advances | Rank not stated | 279 / 279 | Leases to about 21 years; advances contingent on revenue growth | Fair value equal to carrying amount | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Total debt | All instruments | 25,068 / 24,880; secured 19,534 carrying | Net debt 18,619 at year end; 22,967 pro forma 2024-10-18 | Net leverage 4.88x at year end; 6.02x pro forma 2024-10-18 on reported EBITDA | Financial foundation (CP-1) |

### Relative value

The usable market evidence at the as-of date is the issuer's own audited fair-value disclosure, which prices every note on quoted market prices and the term loans on agent information. It supports one capital-structure conclusion and no external one. Inside the structure, the 2029 subordinated notes and the March 2029 secured notes share issuer, currency and maturity year, so their approximate yields can be set side by side with the method disclosed: the subordinated notes yield 8.69 bp and 1.67 bp less, which means the market is paying nothing visible for contractual subordination, payment blockage and structural subordination to non-guarantor subsidiaries. The caveat is metric basis: the secured notes trade above par and their call schedule is not supplied, so their yield to worst could be lower than the yield to maturity used here. Outside the structure, the only loan comparables are the transcribed Ba index, Ba/B index and aerospace loan entries carried in Market-implied risk; the Tranche J entry sits 4 bp inside the Ba index, which would read as Fair for a Ba-labelled first-lien loan if authenticated. Market-implied risk blocked those entries because their observation date was assigned for testing and Tranche K, M and N do not reconcile with year-end terms, and the maintained sector loan data itself did not reach this analysis, so secured relative value stays Unclear. No secured note spread exists, so secured loans and secured notes cannot be ranked against each other on compensation. The filed term-loan valuation of 99.91% of principal is consistent with the near-par loan entries, which raises confidence that loans were not distressed at year end but does not establish compensation.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Market-implied risk (CP-3D); calculation V1; calculation V16; calculation V17

On structure, the ranking is senior secured first, then subordinated, and the gap between them is widened by policy: subordinated holders attach at 5.25x reported EBITDA today and at 6.10x if indicative secured capacity is used, against total debt of 6.53x. Recovery sensitivity is Moderate for the secured layer, because recovery moves with enterprise value and pari secured dilution, and High for the subordinated notes. With no enterprise value, no recovery percentage is stated.
Basis: Legal & covenants (CP-4); Financial foundation (CP-1); calculation V19; calculation V21; calculation V23

### Portfolio Fit

Overall, TransDigm senior secured paper is Watchlist and the 2029 subordinated notes are Avoid for portfolio implementation. The posture is driven by unauthenticated secured spreads and an uncompensated subordinated layer, which matters because the demonstrated mechanism of loss is secured layering rather than default, and it implies that any exposure belongs in the senior secured layer once pricing is confirmed. The binding constraint is evidence rather than a mandate limit: no portfolio mandate, holdings, concentration limits, rating-bucket capacity or trading depth were supplied, so no numeric size is expressed, concentration and correlation cannot be measured, and exit risk is not assessable. The natural role for the secured layer, once priced, is defensive senior secured exposure, with downside driven by refinancing of USD 11,405 million across FY2028 and FY2029 and by dilution from further secured issuance. The top trigger to move from Watchlist toward a starter position is authenticated secured spreads at or wide of comparable Ba first-lien loans with no new debt-funded distribution. Portfolio fit completed with limitations. Sizing posture: Watchlist for senior secured; Avoid for the 2029 subordinated notes; Requires More Work for the 2027 subordinated notes. Missing inputs: mandate, holdings, concentration limits, trading depth, authenticated spreads.
Basis: Refinancing & LME (CP-3C); Legal & covenants (CP-4); calculation V21

### Events: Instruments

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: instrument maturities are already recorded by Legal & covenants and Business & governance | Not supplied: no additional instrument event in this analysis | Not supplied: no additional instrument event in this analysis | Not supplied: no call, put, coupon reset or offer date is stated in the documents read | Not supplied: no additional instrument event in this analysis | Not supplied: call schedules and offer terms not in the documents | Not supplied: no instrument event beyond those already recorded |

### Recovery waterfall

| Line | Amount | Low | Base | High | Currency | Scale |
|---|---|---|---|---|---|---|
| Enterprise value | Not supplied: Peer benchmark found no peer multiple and Recovery & fulcrum activated no valuation | Not supplied: no implied enterprise value | Not supplied: no implied enterprise value | Not supplied: no implied enterprise value | USD | million |
| EV multiple | Not supplied: no peer or transaction multiple in Peer benchmark | Not supplied: no peer multiple | Not supplied: no peer multiple | Not supplied: no peer multiple | — | x |
| EV metric | 3813 | — | — | — | USD | million |
| EV basis | CP-1C T4.10 EV/EBITDA: no peer multiple and no implied EV; metric is FY2024 reported EBITDA of USD 3,813 million from Financial foundation; no own case stated because no multiple is supported | CP-1C T4.10 EV/EBITDA Low: not supplied | CP-1C T4.10 EV/EBITDA Median: not supplied | CP-1C T4.10 EV/EBITDA High: not supplied | — | — |
| Cost: restructuring and administrative costs | Not supplied: no distress case or cost estimate | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: trade receivable securitization, domestic receivables pool | 486 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: senior secured term loans, revolver and secured notes due 2028 to 2033, equal ranking; revolver undrawn, letters of credit 67 excluded | 19534 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: finance leases and government refundable advances, rank not stated | 279 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: senior subordinated notes due 2027 and 2029 | 4581 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Fulcrum | Not supplied: no enterprise value, so no fulcrum identified | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | — | — |
| Residual to equity | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |

Claims are year-end carrying values that sum to total debt of USD 24,880 million; the October 2024 securitization draw is a subsequent event and is not included.

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 12 |
| Calculated | 10 |
| Assumption-Based | 1 |
| Analyst Inference | 6 |
| Weak Lineage | 1 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 4 |
| Fields present | 12 |
| Fields total | 15 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

Module status: Ready with Limitations. Execution mode: Capital-Structure RV, using the instrument stack, filed fair values by instrument and the legal summary with its limitation flag. Instrument preference status: Ready with Limitations. Portfolio-fit status: Completed with Limitations; output mode: Generic Portfolio-Fit Logic.

#### T3B.1 Source register and module status

| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use |
|---|---|---|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Form 10-K FY2024, audited | High; notes at Level 1 quoted market prices, term loans and securitization at Level 2 | FY2024; balance at 2024-09-30; filed 2024-11-07 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrower and issuer | Carrying amounts and fair values of each debt instrument; lease maturities | Fair values rounded to USD 1 million; no spreads, call schedules or yield to worst; executed debt documents incorporated by reference only | Used here for capital-structure pricing and approximate yields |
| Financial foundation (CP-1) | Financial foundation for this run | High | FY2024 and FY2023; pro forma 2024-10-18 | Consolidated | Debt by instrument, EBITDA, leverage, net debt, pro forma adjustment, definition conflicts | Covenant headroom not established | Used here for claims, leverage and the inherited conflict register |
| Business & governance (CP-1A) | Business and governance for this run | High | FY2024 with subsequent events | Consolidated; ownership chain | Distributions, debt-funded dividend, secured-for-subordinated refinancing | Proxy and debt documents not supplied | Used here for the financial-policy factor and dilution mechanism |
| Earnings quality (CP-1D) | Earnings quality for this run | Medium | FY2024 | Consolidated | Supported EBITDA 3,871 and leverage on it | Other items unresolved | Used here for supported-earnings leverage |
| Fundamental credit (CP-2) | Fundamental credit view for this run | High | FY2024 | Consolidated | Strengths, weaknesses, downside path | Peers and ratings absent | Used here for the fundamental view |
| Legal & covenants (CP-4) | Legal and covenant read for this run | Medium; annual report summary authority | As of 2024-09-30 | Issuer, guarantors, non-guarantors | Ranking, blockage, guarantor share, incurrence tests, indicative secured capacity 3,244 | Executed documents and intercreditor agreement not supplied | Used here for structural position and priming risk |
| Liquidity (CP-2D) | Liquidity bridge for this run | Medium | Twelve months to 2025-09-30 | Consolidated | Pro forma liquidity 2,919; securitization maturity; revolver threshold | Annual run-rate estimates | Used here for liquidity factor and triggers |
| Forward credit model (CP-2G) | Forward credit model for this run | Medium | FY2025 to FY2027 | Consolidated | Leverage and coverage paths by case; cumulative free cash flow | Analyst growth assumptions | Used here for downside and upside context |
| Ratings & triggers (CP-2H) | Ratings and triggers for this run | Low | As of 2024-09-30 | Facilities only | Facility indications Ba3 and BB-, unverified | No issuer rating, outlook or trigger | Used here for rating-bucket context only |
| Market-implied risk (CP-3D) | Market-implied risk for this run; module status Blocked | Low; module-test transcription with assigned date | Assigned 2024-09-30 | Term loan entries J, K, L, M, N; Ba and Ba/B loan indices; StandardAero, Ontic, Chromalloy loans | Bid, ask, YTM, three-year DM, size, comparator differences | Not authenticated; K, M, N identity conflicts; no bond quotes | Used here for indicative loan levels only; no RV label rests on it |
| Refinancing & LME (CP-3C) | Refinancing and liability-management view for this run | Medium | As of 2024-09-30 | Consolidated | Maturity wall, years to maturity, creditor-class exposure | Coercive capacity not established | Used here for refinancing and class exposure |
| Recovery & fulcrum (CP-4C) | Restructuring applicability for this run | Medium | As of 2024-09-30 | Consolidated | Distress gate not met | No enterprise value or class recovery | Used here to record that no recovery is established |
| Peer benchmark (CP-1C) | Peer benchmark for this run; blocked | Low | FY2024 | No peer identified | Borrower metrics only | No peer multiple or implied EV | Used here for the enterprise-value gap |
| Source readiness (CP-0) | Source readiness for this run | High | As of 2024-09-30 | Effective source set | Partial source gate; no legal documents or market data in filings | Summary only | Used here for the source gate |

Module status: Ready with Limitations. The preference gate is met for structure, since seniority and subordination are documented, and restricted for compensation, since only filed fair values and an unauthenticated loan transcription are available.

| Subsequent event | Date | Amount | Treatment | Source |
|---|---|---|---|---|
| Remaining securitization capacity drawn | 2024-10-16 | USD 162.5 million; facility fully drawn at USD 650 million | Not folded into the year-end stack; pre-event structure is the base case | Financial foundation (CP-1) |
| Special dividend and dividend equivalents paid | 2024-10-18 | USD 4,348 million | Pro forma net debt USD 22,967 million and net leverage 6.02x shown beside year-end figures | Financial foundation (CP-1) |

#### Inherited definition conflict register

Carried forward verbatim from Financial foundation; calculation references in this table are to that analysis.

| Metric Name | Canonical Definition | Issuer-Reported Definition | Source of Conflict | Periods Affected | Materiality | Modules Affected | Resolution / Recommendation |
|---|---|---|---|---|---|---|---|
| Total debt | Balance-sheet carrying value, current plus long-term, net of costs and discounts | Total debt 24880 includes issuance costs, discount and premium (carrying); gross amount 25068 | Carrying against principal | FY2024 (FY2023 carrying 19750) | USD 188 million (C31) | Leverage, recovery and priority work | Carrying value used; principal kept in Debt principal to carrying value |
| EBITDA | Reported EBITDA as primary denominator | EBITDA As Defined adds back acquisition costs 70, stock and deferred compensation 217, refinancing costs 58 and other 15; the springing revolver test uses consolidated EBITDA defined the same way | Issuer non-GAAP definition | FY2024, FY2023 | USD 360 million in FY2024 and USD 247 million in FY2023 (C78, C79) | Leverage, earnings quality, covenant work | Both shown, labelled; reported EBITDA used as primary |
| Covenant tests | Not inferred | Incurrence: net leverage 7.25x and secured net debt 5.00x; springing test 7.50x net debt to EBITDA As Defined when revolver usage exceeds 40% (USD 364 million) | Agreements not supplied; Source readiness summary cited 7.50x for incurrence | FY2024 | Headroom not established | Covenant and legal work | Annual report text figure 7.25x used; no headroom computed |
| Interest | Cash interest paid for cover | Interest expense—net 1286; excluding amortization 1246; cash paid 1158; next-year scheduled interest 1524 | Accrual, amortization and timing | FY2024 | USD 128 million between expense and cash (C73) | Coverage and forecast work | Cash paid used for cover; schedule shown separately as estimated; about 77% of gross debt fixed rate |
| Working capital change | Sum of cash-flow changes in assets and liabilities | Issuer EBITDA reconciliation adds back 272 for changes in assets and liabilities | Cash-flow lines sum to -302 | FY2024 | USD 30 million (C72) | FFO and earnings quality | Cash-flow lines used; difference left unreconciled |
| October 2024 dividend payment | One event, all figures shown | 4348 in the annual report (4216 dividend plus 132 equivalents); 4396 for the quarter in the December 2024 quarterly report | Different scope of period | Subsequent to FY2024 | USD 48 million (C74) | Liquidity and pro forma leverage | 4348 used for the pro forma; quarterly figure noted |
| Debt maturity ladder | Contractual principal of all debt | Issuer schedule 24319 excludes finance leases and the securitization borrowing | Scope of ladder | FY2024 | USD 749 million of debt outside the ladder (487 securitization plus 262 finance leases) | Refinancing and liquidity work | Ladder kept as stated; excluded debt in reconciling items |
| Free cash flow | Levered, after working capital | No issuer FCF stated | Analyst definition | FY2024, FY2023 | Not applicable | Cash-flow work | Operating cash flow less capex used |

#### T3.3 Issuer / security scorecard

| Category | Factor | Weight | Raw Score 1–5 | Weighted Score | Confidence | Evidence | Risk Mechanic | Credit Implication |
|---|---|---|---|---|---|---|---|---|
| Business risk | S1 Business and competitive position | Not supplied: no mandate or sector weighting framework | 2 | Not Scorable: no governing weights | Medium | About 90% proprietary and 55% aftermarket sales; EBITDA As Defined margin 52.56%; no peer comparison | Certified sole-source parts sustain pricing through volume swings | Supports debt service and enterprise value; standing against peers not established |
| Financial risk | S2 Earnings quality | Not supplied: no mandate or sector weighting framework | 3 | Not Scorable: no governing weights | High | Supported EBITDA USD 3,871 million against USD 4,173 million As Defined; reported USD 3,813 million | Recurring costs removed from the issuer measure inflate capacity | Underwrite near reported EBITDA |
| Financial risk | S3 Leverage | Not supplied: no mandate or sector weighting framework | 4 | Not Scorable: no governing weights | High | Gross 6.53x; net 4.88x at year end and 6.02x pro forma 2024-10-18; 5.93x on supported earnings | Distribution-funded debt holds leverage high | Little deleveraging cushion before refinancing |
| Financial risk | S4 Interest coverage | Not supplied: no mandate or sector weighting framework | 3 | Not Scorable: no governing weights | Medium | Reported EBITDA / cash interest 3.29x FY2024; base FY2025 2.75x; downside FY2025 2.16x | Interest steps up before earnings catch up | Coverage is the first metric to break in stress |
| Financial risk | S5 Free cash flow durability | Not supplied: no mandate or sector weighting framework | 2 | Not Scorable: no governing weights | High | Free cash flow USD 1,880 million; capex 2.08% of revenue; positive in every forecast case | Light capital intensity leaves cash for interest | Debt service internally funded |
| Liquidity | S6 Liquidity | Not supplied: no mandate or sector weighting framework | 2 | Not Scorable: no governing weights | Medium | Pro forma cash liquidity USD 2,919 million after 2024-10-18; securitization matures 2025-07-11 | Distribution policy, not burn, can erode the buffer | Low near-term default probability |
| Refinancing | S7 Refinancing and maturity profile | Not supplied: no mandate or sector weighting framework | 3 | Not Scorable: no governing weights | Medium | First term-debt maturity November 2027; FY2028 USD 6,637 million; FY2028 and FY2029 USD 11,405 million | Concentrated rollover after repeated releveraging | Market-window dependence from FY2027 |
| Governance | S8 Financial policy and governance | Not supplied: no mandate or sector weighting framework | 5 | Not Scorable: no governing weights | High | USD 6,368 million of special distributions declared FY2024; USD 3,000 million secured debt funded the September dividend; debt prepayment ranked last | Growth converted into distributions and secured claims | Recovery dilution for juniors; no deleveraging underwritten |
| Legal | S9 Covenant and legal protection | Not supplied: no mandate or sector weighting framework | 4 | Not Scorable: no governing weights | Low | No maintenance covenant; incurrence 7.25x net and 5.00x secured net; indicative secured headroom 0.78x | Lender control arrives late; secured layering permitted | Weak protection against value leakage |
| Structure | S10 Structural position, senior secured layer | Not supplied: no mandate or sector weighting framework | 2 | Not Scorable: no governing weights | Medium | Pari secured term loans, revolver and six note series; guarantor group 79.27% of net sales; collateral includes cash | Pari dilution by further secured debt; non-guarantor value structurally ahead | Strongest claim in the stack |
| Structure | S11 Structural position, senior subordinated notes | Not supplied: no mandate or sector weighting framework | 5 | Not Scorable: no governing weights | Medium | Contractual, payment-blockage and structural subordination; attachment 5.25x reported EBITDA | Each secured issue raises the attachment point | Highest loss severity in the stack |
| Market compensation | S12 Market compensation, senior secured | Not supplied: no mandate or sector weighting framework | Not Scorable: no authenticated spread or comparable | Not Scorable: no governing weights | Low | Term-loan fair value 99.91% of principal; secured notes 103.50% in aggregate; transcribed J entry 247 bp three-year DM | Price without spread or call schedule cannot be set against risk | Relative value Unclear |
| Market compensation | S13 Market compensation, 2029 subordinated notes | Not supplied: no mandate or sector weighting framework | 4 | Not Scorable: no governing weights | Low | Approximate YTM 5.49% and 5.56% against 5.58% for 2029 secured notes | No visible premium for subordination | Rich at low confidence; better alternative in the same structure |
| Recovery | S14 Recovery evidence | Not supplied: no mandate or sector weighting framework | Not Scorable: no enterprise value | Not Scorable: no governing weights | Not Assessable | No peer multiple and no restructuring valuation | Class recovery cannot be quantified | Recovery sensitivity stated by label only |

Composite score: Not Scorable, because no mandate or sector weights are supplied and two factors cannot be scored. Unweighted factor scores range from 2 to 5. Credit tier: Not Scorable. No hard-risk override is applied.

#### T3.6 Fundamental value matrix

| Security / Issuer | Fundamental View | Relative-Value View | Structural / Recovery View | Final Matrix Bucket | Rationale | Evidence ID |
|---|---|---|---|---|---|---|
| TransDigm Group Incorporated, issuer level | Not Scorable composite; strong franchise, aggressive policy | Unclear for secured; Rich at low confidence for 2029 subordinated | Secured favoured; subordinated most exposed | Requires More Work | Compensation, not default risk, decides selection, and only within-structure pricing is usable | S1; S3; S8; S12; S13 |
| Term loans Tranche J and Tranche L | As issuer | Unclear: J entry 247 bp three-year DM against Ba index 251 bp, unauthenticated; filed fair value 99.91% of principal | Senior secured, pari; Moderate recovery sensitivity; dilution by secured capacity | Requires More Work | Structure supportive; compensation not established on authenticated data | S10; S12; S9 |
| Term loans Tranche I and Tranche K; loan entries M and N | As issuer | Unclear: no entry for I; K entry conflicts with year-end size and margin; M and N not in the year-end structure | Senior secured, pari | Requires More Work: identity conflict | Identity must be reconciled before any market comparison | S10; S12 |
| Secured notes due 2028 to 2033 | As issuer | Unclear: fair values 101.40% to 105.80% of principal, no spread or call schedule | Senior secured, pari with loans; Moderate recovery sensitivity | Requires More Work | Price without yield to worst cannot be judged against comparables | S10; S12; S7 |
| Senior subordinated notes due January and May 2029 | As issuer | Rich at low confidence: approximate YTM 5.49% and 5.56% against 5.58% for March 2029 secured notes | Contractually, payment and structurally subordinated; High recovery sensitivity; attachment 5.25x rising to 6.10x | Avoid | Same yield is available one rank higher in the same structure and year | S11; S13; S8; S9 |
| Senior subordinated notes due November 2027 | As issuer | Unclear: fair value 99.51% of principal; no same-year secured comparator | Subordinated, but matures before the FY2028 wall | Requires More Work | Short maturity offsets some structural risk; no like-for-like comparison | S11; S7 |
| Revolver and receivables securitization | As issuer | Unclear: bank facilities, no quotes | Revolver pari secured; securitization ring-fenced on receivables | Requires More Work | Not traded instruments in the supplied data | S6; S10 |

#### T3C.1 Portfolio input gate

| Input | Available / Missing | Source | Limitation | Portfolio Impact |
|---|---|---|---|---|
| Security-selection and preference conclusions | Available | This analysis, scorecard and matrix above | Secured relative value Unclear | Posture labels only |
| Issuer and security identifiers | Available for filed instruments; Bloomberg loan identifiers for entries J to N via Market-implied risk | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Market-implied risk (CP-3D) | No CUSIP, ISIN or FIGI for notes; K, M, N identity conflicts | Implementation identification incomplete |
| Mandate constraints | Missing | Not supplied: run settings record no portfolio workbook | No eligibility, rating or sector limits | No mandate fit; no numeric size |
| Current holdings and exposure | Missing | Not supplied: no holdings data | No current or pro forma exposure | Concentration not measurable |
| Concentration data | Missing | Not supplied: no concentration report | Issuer, sector, rating and layer limits absent | Correlation not assessable |
| Liquidity and trading constraints | Partly available: transcribed bid and ask only | Market-implied risk (CP-3D) | No depth, trade sizes or dealer count; entries unauthenticated | Exit risk not assessable |
| Downside, recovery, legal and refinancing inputs | Available with limitations | Forward credit model (CP-2G); Legal & covenants (CP-4); Refinancing & LME (CP-3C); Recovery & fulcrum (CP-4C) | No enterprise value; legal capacity indicative | Directional downside only |
| Portfolio constraint reference matching this portfolio | Missing | Not supplied: no constraint table matched a portfolio identity for this run | No limit, headroom or compliance status | No constraint test |

Module status: Completed with Limitations. Output mode: Generic Portfolio-Fit Logic.

#### T3C.2 Portfolio fit register

| Name / Instrument | Fit Category | Evidence | Risk Mechanic | Why It Fits / Does Not Fit | Constraints / Notes | Source Trace |
|---|---|---|---|---|---|---|
| Senior secured term loans Tranche J and L | Not assessable | Pari secured; filed fair value 99.91% of principal; J entry near Ba index | Defensive senior secured exposure diluted by further pari secured debt | Structural fit for a defensive senior secured role once spreads are confirmed | No mandate data; quotes unauthenticated | Legal & covenants (CP-4); Market-implied risk (CP-3D); calculation V1 |
| Senior secured notes 2028 to 2033 | Not assessable | Fair values 101.40% to 105.80%; no call schedule | Premium prices carry call risk; secured dilution | Possible defensive role; compensation not established | No spread, call schedule or mandate | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Senior subordinated notes January and May 2029 | Not fit | Approximate YTM 5.49% and 5.56% against secured 5.58% | Triple subordination and secured layering with no yield premium | Risk budget consumed without compensation | Low confidence on yield basis | calculation V16; calculation V17 |
| Senior subordinated notes November 2027 | Not assessable | Fair value 99.51%; matures before FY2028 wall | Short-dated subordinated claim exposed to unsecured market in 2027 | Carry role possible but compensation not measured | No comparable | calculation V2; Refinancing & LME (CP-3C) |

#### T3C.3 Position sizing posture

| Name / Instrument | Sizing Posture | Evidence | Reason | Key Risk | Implementation Note | Confidence | Source Trace |
|---|---|---|---|---|---|---|---|
| Senior secured term loans Tranche J and L | Watchlist | Structural position supportive; spreads unauthenticated | Starter conditions not met: relative value not favourable or conditional on confirmed data | Further debt-funded secured issuance | No numeric size without mandate and constraints | Low | T3.6; Market-implied risk (CP-3D) |
| Senior secured notes 2028 to 2033 | Watchlist | Fair values above par; no spreads | Compensation not established | Call risk on premium notes; secured dilution | Obtain call schedules and dated spreads first | Low | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Senior subordinated notes January and May 2029 | Avoid | No subordination premium against same-year secured notes | Structural and policy risk not compensated | Attachment rising from 5.25x toward 6.10x | Hold no new exposure; existing exposure not assessed | Low | calculation V16; calculation V21 |
| Senior subordinated notes November 2027 | Requires More Work | Matures before the wall; no like-for-like comparator | Compensation not measurable | Secured takeout if unsecured market closes | Revisit with dated spreads | Low | Refinancing & LME (CP-3C) |

Core Hold is not assigned to any instrument because mandate eligibility, exposure capacity, liquidity, downside budget and concentration evidence are all missing.

#### T3C.4 Risk budget flags

| Flag | Evidence | Risk Mechanic | Why It Matters | Caution Level | Portfolio Impact | Source Trace |
|---|---|---|---|---|---|---|
| Capital-structure layer exposure | Subordinated attachment 5.25x reported EBITDA; indicative secured capacity USD 3,244 million | Secured layering raises junior loss severity without default | Subordinated recovery can fall while the issuer performs | High | Keep exposure in the secured layer | Legal & covenants (CP-4); calculation V19; calculation V21 |
| Financial policy and leakage | USD 6,368 million distributions declared FY2024; debt prepayment last | Distributions absorb growth and add claims | Deleveraging cannot be underwritten | High | Event risk for all layers, most for juniors | Business & governance (CP-1A) |
| Maturity wall | FY2028 and FY2029 USD 11,405 million; base cumulative free cash flow covers 76.50% of FY2028 | Rollover dependence on market windows | Refinancing terms drive price risk from FY2027 | Medium | Prefer instruments that mature after the wall resolves or are senior in it | Refinancing & LME (CP-3C); Forward credit model (CP-2G) |
| Legal and covenant | No maintenance covenant; summary-only documents | Late lender control | Value can erode before any covenant event | Medium | Monitor issuance and releases rather than covenants | Legal & covenants (CP-4) |
| Recovery and LGD | No enterprise value | Recovery not quantified | Loss budget cannot be sized | Not Assessable | No numeric loss budget | Recovery & fulcrum (CP-4C) |
| Rating bucket | Facility indications Ba3 and BB-, unverified | Rating-bucket eligibility not confirmed | Mandate rating limits cannot be tested | Not Assessable | No rating-bucket placement | Ratings & triggers (CP-2H) |
| Concentration, correlation and liquidity | No holdings, limits or depth | Not measurable | Sizing and exit cost unknown | Not Assessable | No numeric size | T3C.1 |
| Sector exposure | Defense about 40%, commercial aftermarket about 31%, commercial OEM about 27% of sales | Correlated with aerospace and defense holdings | Common-factor risk with sector peers | Medium | Count against aerospace exposure once holdings are known | Fundamental credit (CP-2) |

#### T3C.5 Concentration and correlation register

| Exposure Dimension | Current Exposure | Proposed / Pro Forma Exposure | Limit / Capacity | Evidence Status | Risk Mechanic | Portfolio Implication | Source Trace |
|---|---|---|---|---|---|---|---|
| Issuer / group | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | Single-issuer policy event hits all layers | Issuer limit must be tested before any add | T3C.1 |
| Sector / subsector | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | Aerospace and defense demand drives EBITDA | Count against aerospace exposure | Fundamental credit (CP-2) |
| Sponsor / ownership | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | Widely held; board sets distribution policy; no sponsor | No sponsor concentration; policy risk is issuer-specific | Business & governance (CP-1A) |
| Rating bucket | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | Facility indications unverified | Bucket placement not confirmed | Ratings & triggers (CP-2H) |
| Maturity year / wall | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | FY2028 and FY2029 concentration of USD 11,405 million | Check overlap with other 2028 and 2029 maturities held | Refinancing & LME (CP-3C) |
| Capital-structure layer | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | Subordinated layer most exposed to dilution | Limit exposure to the secured layer | Legal & covenants (CP-4) |
| Correlated holdings / common factor | Not supplied: no holdings data | Not supplied: no proposed size | Not supplied: no mandate limits | Not Provided | Shared factor with aerospace loans in the comparable set | Correlation not measurable | Market-implied risk (CP-3D) |

#### T3C.6 Liquidity and implementation assessment

| Liquidity / Implementation Factor | Evidence | Risk Mechanic | Implementation Consequence | Constraint / Action | Source Trace |
|---|---|---|---|---|---|
| Trading depth, bid-ask and dealer colour | Transcribed loan widths 0.13 to 0.37 points of par; no depth or dealer count; notes priced at Level 1 quoted prices | Displayed width does not prove executable size | Exit cost not measurable | Obtain dated two-sided quotes with size | Market-implied risk (CP-3D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 174 |
| Settlement, minimum size and operational constraint | Not supplied: no settlement, minimum denomination or assignment terms | Loan assignment and note settlement terms unknown | Operational feasibility not established | Confirm minimums and assignment consents | T3C.1 |
| Exit route under stress | Issue sizes USD 750 million to USD 3,632 million principal; no stressed trading evidence | Smaller subordinated issues may gap in stress | Exit risk not assessable | No scaling assumption without trading evidence | Financial foundation (CP-1) |
| Ability to add or trim | No holdings or trading history | Price impact unknown | Add or trim cost not measurable | Watchlist until depth is evidenced | T3C.1 |

#### T3C.7 Downside budget and recovery sensitivity

| Downside Scenario / Driver | Input Basis | Formula / Method | Result / Directional View | Portfolio Loss / Risk-Budget Implication | Status | Source Trace |
|---|---|---|---|---|---|---|
| Price downside | No duration, spread history or calibrated shock | Price change equals spread duration times spread move; inputs absent | No price loss computed | Loss at any size not calculable | Not Calculable | Market-implied risk (CP-3D) |
| Recovery and LGD sensitivity | Claims ahead of subordinated notes USD 20,020 million; total debt 6.53x reported EBITDA | Attachment and detachment in turns of reported EBITDA | Subordinated notes attach at 5.25x and detach at 6.53x; secured layer detaches at 5.25x | Subordinated loss severity high once enterprise value falls below about 6.53x EBITDA | Directional Only | calculation V19; calculation V23 |
| Refinancing and maturity-wall downside | FY2028 USD 6,637 million; base cumulative free cash flow USD 5,077.1 million, 76.50% of FY2028; downside USD 2,285.6 million | Cumulative free cash flow against maturities | Refinancing required in every case; downside enters it at 6.47x gross | Price risk concentrated from FY2027 | Directional Only | Forward credit model (CP-2G) |
| Legal, priming and leakage downside | Indicative secured capacity USD 3,244 million under the 5.00x test | Claims ahead of subordinated notes plus capacity, over reported EBITDA | Subordinated attachment rises from 5.25x to 6.10x | Junior recovery falls without default | Directional Only | Legal & covenants (CP-4); calculation V21 |

#### T3C.8 Monitoring and add or trim triggers

| Trigger ID | Indicator | Leading / Lagging | Threshold or Qualitative Signal | Linked Risk Flag | Portfolio Action | Source Trace | Limitation |
|---|---|---|---|---|---|---|---|
| CP-3B-MON-001 | New secured issue or incremental term loan alongside a distribution | Leading | Any such announcement | Capital-structure layer exposure; financial policy | Avoid subordinated; Escalate secured | Business & governance (CP-1A); Legal & covenants (CP-4) | Basket wording not supplied |
| CP-3B-MON-002 | Yield gap between 2029 subordinated and 2029 secured notes on a yield-to-worst basis | Leading | Subordinated at least 75 bp wide of secured would reopen the Avoid; no calibrated threshold in the documents | Capital-structure layer exposure | Hold Avoid until met, then reassess | calculation V16; calculation V17 | Analyst threshold; call schedules not supplied |
| CP-3B-MON-003 | Authenticated secured loan spreads against Ba first-lien comparables with reconciled facility identities | Leading | Dated observation at or wide of the Ba loan index | Concentration, correlation and liquidity | Add from Watchlist to starter only with mandate data | Market-implied risk (CP-3D) | Current entries unauthenticated |
| CP-3B-MON-004 | Revolver usage | Leading | Above USD 364 million activates the 7.50x springing test | Legal and covenant | Escalate | Liquidity (CP-2D) | Contractual definitions not supplied |
| CP-3B-MON-005 | Securitization renewal | Leading | No extension or funded repayment plan ahead of 2025-07-11 | Maturity wall | Escalate | Liquidity (CP-2D) | Renewal terms not supplied |
| CP-3B-MON-006 | Quarterly EBITDA and interest cover | Lagging | Year-on-year EBITDA decline or cover toward the 2.16x downside level | Maturity wall | Trim or Avoid adds | Forward credit model (CP-2G) | Forecast cases are analyst assumptions |
| CP-3B-MON-007 | Refinancing progress for the November 2027 subordinated notes | Leading | No refinancing within 24 months of maturity | Maturity wall | Escalate the 2027 notes | Refinancing & LME (CP-3C) | Analyst milestone, not contractual |
| CP-3B-MON-008 | Guarantor release, unrestricted designation or asset transfer | Leading | Any supplemental indenture or release notice | Legal and covenant | Escalate all layers | Legal & covenants (CP-4) | Release terms not supplied |

#### T3C.9 Gaps ledger

| Gap ID | Missing Data | Why It Matters | Affected Sizing / Risk Budget / Trigger | Consequence for Confidence | Required Follow-Up Source |
|---|---|---|---|---|---|
| CP-3B-GAP-001 | Authenticated loan and bond spreads, yields to worst and external comparables | Decides Cheap, Fair or Rich for every instrument | Secured Watchlist; MON-002 and MON-003 | High impact | Maintained sector loan data rows with reconciled identifiers; dated note quotes |
| CP-3B-GAP-002 | Note call schedules and loan repricing protection | Yield to worst and call risk on premium notes | Subordinated Avoid confidence; secured notes posture | High impact | Indentures and credit agreement |
| CP-3B-GAP-003 | Portfolio mandate, holdings, concentration limits and constraint table | Required for mandate fit and any numeric size | All sizing postures; T3C.5 | High impact | Portfolio constraint reference matching this portfolio and as-of date |
| CP-3B-GAP-004 | Trading depth, trade sizes and dealer coverage | Exit cost and scalability | T3C.6; any add or trim | Medium impact | Dated quote and trade history |
| CP-3B-GAP-005 | Enterprise value and class recovery | Loss budget and fulcrum | T3C.7; recovery waterfall | Medium impact | Peer multiples or valuation case |
| CP-3B-GAP-006 | Executed credit agreement, indentures and intercreditor agreement | Exact secured capacity, release and blockage terms | Capital-structure layer flag; MON-001 and MON-008 | Medium impact | Executed documents |
| CP-3B-GAP-007 | Verified issuer and issue ratings | Rating-bucket eligibility | Rating bucket flag | Low impact | Dated agency publications |
| CP-3B-GAP-008 | Reconciliation of Tranche K, M and N entries with year-end facilities | Loan relative value rests on J and L only | Term-loan Watchlist | Low impact | Facility identifiers tied to legal terms |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| V1 | Term loans fair value / principal | 8694 / 8702 | 0.9991 (99.91%) | 2024-09-30, % of principal; agent-information fair value | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172; Financial foundation (CP-1) |
| V2 | 2027 subordinated notes fair value / principal | 2637 / 2650 | 0.9951 (99.51%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| V3 | 2028 secured notes fair value / principal | 2160 / 2100 | 1.0286 (102.86%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| V4 | January 2029 subordinated notes fair value / principal | 1160 / 1200 | 0.9667 (96.67%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| V5 | March 2029 secured notes fair value / principal | 2836 / 2750 | 1.0313 (103.13%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| V6 | May 2029 subordinated notes fair value / principal | 729 / 750 | 0.972 (97.20%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| V7 | 2030 secured notes fair value / principal | 1519 / 1450 | 1.0476 (104.76%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| V8 | 2031 secured notes fair value / principal | 1058 / 1000 | 1.058 (105.80%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| V9 | 2032 secured notes fair value / principal | 2291 / 2200 | 1.0414 (104.14%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| V10 | 2033 secured notes fair value / principal | 1521 / 1500 | 1.014 (101.40%) | 2024-09-30, % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| V11 | Secured notes aggregate fair value and ratio to principal | 2160 + 2836 + 1519 + 1058 + 2291 + 1521; 11385 / 11000 | USD 11,385 million; 1.035 (103.50%) | 2024-09-30, USD million and % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| V12 | Subordinated notes aggregate fair value and ratio to principal | 2637 + 1160 + 729; 4526 / 4600 | USD 4,526 million; 0.9839 (98.39%) | 2024-09-30, USD million and % of principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| V13 | Approximate YTM, January 2029 subordinated notes: (coupon + (100 − price) / years) / ((100 + price) / 2) | Coupon 4.625; price 96.6667; years 4.2917 on a thirty-day-month basis from Refinancing & LME | 0.0549 (5.49%) | 2024-09-30, % a year; approximation, not yield to worst | calculation V4; Refinancing & LME (CP-3C) |
| V14 | Approximate YTM, March 2029 secured notes, same formula | Coupon 6.375; price 103.1273; years 4.4194 | 0.0558 (5.58%) | 2024-09-30, % a year; call schedule not supplied | calculation V5; Refinancing & LME (CP-3C) |
| V15 | Approximate YTM, May 2029 subordinated notes, same formula | Coupon 4.875; price 97.2; years 4.5861 | 0.0556 (5.56%) | 2024-09-30, % a year | calculation V6; Refinancing & LME (CP-3C) |
| V16 | January 2029 subordinated less March 2029 secured approximate YTM | 0.054933 − 0.055801 | −0.000869 (−8.69 bp) | 2024-09-30, bp | calculation V13; calculation V14 |
| V17 | May 2029 subordinated less March 2029 secured approximate YTM | 0.055634 − 0.055801 | −0.000167 (−1.67 bp) | 2024-09-30, bp | calculation V14; calculation V15 |
| V18 | Recovery claims tie to total debt | 486 + 19534 + 279 + 4581 | USD 24,880 million, equal to total debt | 2024-09-30, USD million carrying value | Financial foundation (CP-1) |
| V19 | Securitization plus senior secured claims, ratio to reported and supported EBITDA and share of debt | 486 + 19534; 20020 / 3813; 20020 / 3871; 20020 / 24880 | USD 20,020 million; 5.2505 (5.25x); 5.1718 (5.17x); 0.8047 (80.47%) | 2024-09-30, USD million and x | Financial foundation (CP-1); Earnings quality (CP-1D) |
| V20 | Claims ahead of subordinated notes if leases and advances rank ahead | 20020 + 279; 20299 / 3813; 20299 / 3871 | USD 20,299 million; 5.3236 (5.32x); 5.2439 (5.24x) | 2024-09-30, USD million and x | calculation V19 |
| V21 | Subordinated attachment if indicative secured capacity is used | 20020 + 3244; 23264 / 3813 | USD 23,264 million; 6.1012 (6.10x) | 2024-09-30 indicative, USD million and x | Legal & covenants (CP-4); calculation V19 |
| V22 | Same, with leases and advances ahead | 20299 + 3244; 23543 / 3813; 23543 / 3871 | USD 23,543 million; 6.1744 (6.17x); 6.0819 (6.08x) | 2024-09-30 indicative, USD million and x | calculation V20 |
| V23 | Subordinated detachment: total debt over EBITDA | 24880 / 3813; 24880 / 3871 | 6.5250 (6.53x); 6.4273 (6.43x) | FY2024, x | Financial foundation (CP-1); Earnings quality (CP-1D) |

Fair values are rounded to USD 1 million in the annual report, so implied prices carry small rounding error. The approximate yields use the standard bond-yield approximation on fair value treated as a clean price; they are not yields to worst, and the secured notes' call schedule is not in the documents. Year-end net debt of USD 18,619 million becomes USD 22,967 million pro forma for the 2024-10-18 payment, as stated by Financial foundation.

## Gaps

| Gap | Why it matters | Severity |
|---|---|---|
| No authenticated loan or bond spreads with external comparables; the only loan entries are a test transcription that Market-implied risk blocked | Secured relative value stays Unclear and no instrument can be Preferred or Neutral | Material |
| No portfolio mandate, holdings, concentration limits, constraint table or trading depth | Sizing stops at posture labels; exit risk and concentration are not assessable | Material |
| Call schedules and yield to worst for the notes are not in the documents | The subordinated Avoid rests on yield-to-maturity approximations | Minor |
| No enterprise value from peers or a restructuring case | Class recoveries and fulcrum are not established | Minor |
| Executed credit agreement, indentures and intercreditor agreement not supplied | Secured capacity and release mechanics are indicative | Minor |
| Tranche K, M and N entries do not reconcile with year-end facilities | Loan relative value rests on Tranche J and L only | Minor |
| Use restriction | These results support instrument preference and portfolio posture only; they are not a valuation, a recovery estimate, a rating or a numeric position size | Minor |

## Next module

The orchestrator selects the next module.
