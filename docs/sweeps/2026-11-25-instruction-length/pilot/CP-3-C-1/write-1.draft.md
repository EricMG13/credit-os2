---
module_id: CP-3
module_name: RelativeValueSecuritySelection
schema_family: Nested
layer: L3
issuer_id: tdg
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
execution_mode: Capital-Structure RV
committee_status: Requires More Work
---

## Request

Relative value, instrument preference and portfolio fit for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is the full debt stack of TransDigm Inc. (securitization, revolver, four term loan tranches, six secured note series and three senior subordinated note series), using the audited year-end fair values and the loan quotes entered in the run settings as market evidence.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Fair value of each debt instrument at 2024-09-30 (Level 1 quoted prices for notes, agent information for term loans), fair-value method note, finance lease detail; check for disclosed redemption schedules (none found) |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 (after the as-of date) | 2025-02-04 | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Subsequent events only (October 2024 dividend payment split, first-quarter FY2025 share repurchases), relied on through Business & governance and Liquidity; never blended into year-end figures |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate (partial); absence of executed debt documents, ratings, peers; October 2024 subsequent events |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Debt by instrument at principal and carrying value, leverage, coverage, net debt with the 2024-10-18 post-balance-sheet adjustment, maturity ladder, definition conflict register |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Business mix, financial policy, distributions, secured-for-subordinated refinancing, governance risk level High |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Confirms no usable peer and no peer or transaction multiple, so no implied enterprise value |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported EBITDA and leverage on supported earnings |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Fundamental credit view, interest step-up, maturity concentration, primary downside path |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Ranking, guarantor perimeter, payment blockage, incurrence tests, indicative secured capacity, covenant aggressiveness score |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Liquidity risk level, pro forma liquidity, securitization renewal, springing revolver threshold |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Base and downside leverage, coverage and cumulative free cash flow against FY2028 maturities |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Facility rating indications (Ba3 / BB-) treated as secondary and unverified; no agency trigger established |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Blocked; loan-quote identity conflicts (Tranche K, L, M, N) and displayed bid/ask widths |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Low near-term vulnerability, creditor-class exposure, years to maturity on a 30/360 convention |
| Recovery & fulcrum (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Distress gate not met; no enterprise value, fulcrum or class recovery assigned |

## Findings

### Bottom line

Avoid the subordinated notes and keep the secured loans and notes at Requires More Work: year-end prices pay creditors nothing extra for subordination, while secured relative value cannot be judged without peer comparables or verified loan quotes.

On audited fair values at 30 September 2024, the January 2029 subordinated notes yield about 5.49% to maturity against 5.58% for the March 2029 secured notes, yet they rank behind USD 19,534 million of secured debt that could grow by an indicative USD 3,244 million under the 5.00x secured test.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4); calculation RV11; calculation RV13

The credit is stretched, not distressed: net leverage is 6.02x pro forma for the dividend paid on 2024-10-18 (4.88x at year end), liquidity is USD 2,919 million after it, and no term debt matures before November 2027. The subordinated verdict is provisional because secured call terms, and so yield to worst, are not disclosed.
Basis: Financial foundation (CP-1); Liquidity (CP-2D); Refinancing & LME (CP-3C)

### Key findings

- The subordinated notes are not paid for subordination, which makes them the weakest risk-adjusted holding in the stack. At almost identical 2029 maturities, the January 2029 subordinated notes yield about 5.49% and the May 2029 subordinated notes about 5.56% against about 5.58% on the March 2029 secured notes, gaps of 9 bp and 2 bp in the wrong direction; the 2027 subordinated notes yield about 5.67% against 5.93% on the 2028 secured notes, 26 bp lower with one year less to run. The mechanism that should command a premium is documented: the subordinated notes sit behind USD 19,534 million of secured claims (78.51% of debt), can have debt service blocked after a senior default, rank behind non-guarantor subsidiaries producing 20.73% of sales, and the issuer added USD 3,000 million of secured debt alongside a dividend in September 2024. Full use of the indicative secured capacity would lift claims ahead of them to USD 22,778 million.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4); Business & governance (CP-1A); calculation RV11; calculation RV12; calculation RV13; calculation RV14; calculation RV15; calculation RV16; calculation RV17; calculation RV18; calculation RV20; calculation RV21

- The secured loans and notes hold the protected layer, but their value against the market is not established, so they cannot be Preferred. Term loans were carried at an agent fair value of 99.91% of par and the secured notes at 101.40% to 105.80% of par; above-par notes with undisclosed call terms carry capped upside and a yield to worst that may sit below maturity yield. The loan quotes entered in the run settings show 3-year discount margins of 224 bp to 250 bp, but their date was assigned for testing and Tranche K's quoted margin of 225 bp conflicts with the 275 bp in the annual report, while Tranches M and N do not exist in the year-end stack. No peer or index comparison survives those limits.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Market-implied risk (CP-3D); Peer benchmark (CP-1C); calculation RV9; calculation RV7; calculation RV10

- Fundamentals support low near-term default risk but no deleveraging, which caps the upside to any instrument. Net leverage is 6.02x pro forma on reported EBITDA and 5.93x on supported earnings; cover of 3.29x in FY2024 falls to 2.50x against scheduled interest of USD 1,524 million and to 2.16x in the FY2025 downside. The board declared USD 6,368 million of special distributions in FY2024 and ranks debt prepayment last, and FY2028 to FY2029 maturities of USD 11,405 million must be refinanced, not repaid.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); Forward credit model (CP-2G); Business & governance (CP-1A); Fundamental credit (CP-2)

- Loss given default cannot be quantified, so the instrument preference rests on structural rank and price, not recovery numbers. No peer or transaction multiple exists and no restructuring case is active, so enterprise value, class recoveries and the fulcrum are not established; the direction is still clear, because the secured layer is 78.51% of debt and is the class that further secured issuance dilutes least.
Basis: Peer benchmark (CP-1C); Recovery & fulcrum (CP-4C); calculation RV20

- No position can be sized and no mandate fit can be tested, so the portfolio posture is generic: Watchlist for the secured loans and notes pending relative-value evidence, Avoid for the subordinated notes. No mandate, holdings, concentration or trading-depth data was supplied.
Basis: Liquidity (CP-2D); Market-implied risk (CP-3D)

### Contrary evidence and what would change the view

The strongest case against avoiding the subordinated notes is convexity. The secured notes trade above par and probably carry call options the annual report does not describe; if their call prices sit near current prices, their yield to worst is below their yield to maturity, and the subordinated notes, priced below par, would then earn a positive premium that this comparison cannot see. A second argument is issuer behaviour: in April 2024 the issuer redeemed USD 550 million of 2027 subordinated notes with secured debt, so discount-priced subordinated notes can be taken out at par well before any stress, and liquidity of USD 2,919 million with no term maturity before November 2027 makes a payment default on them unlikely in the near term. The Avoid view would change to Neutral if the call schedules show the March 2029 secured notes yielding materially less to worst than the 2029 subordinated notes, or if the issuer commits to retire subordinated debt before adding secured debt. The secured loans and notes would move from Requires More Work toward Neutral or Preferred if dated, verified loan quotes reconcile to the year-end tranches and like-for-like secured comparables show the margins of 250 bp to 275 bp are at or above peers; they would move toward Avoid if another debt-funded dividend is announced while EBITDA falls.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Business & governance (CP-1A); Liquidity (CP-2D)

### Limitations

- The Avoid on the subordinated notes rests on yield to maturity, because the annual report discloses no redemption schedule for any note; if the secured notes' yield to worst is materially lower, the subordinated notes may be fairly or even generously paid and the Avoid would become Neutral.
- The yields are an approximation from audited fair values rounded to USD 1 million, not bid, ask or yield-to-worst quotes; the gaps of 9 bp and 2 bp are inside that error, so the conclusion is that subordination earns no meaningful premium, not that it earns a negative one.
- The maintained sector loan relative-value workbook was not available and no peer survived Peer benchmark, so absolute relative value for every instrument is Unclear and none can be Preferred.
- The loan quotes in the run settings carry a date assigned for testing and conflict with the year-end loan terms for Tranches K, L, M and N, so no term-loan spread or price conclusion uses them; only the agent fair value of the term loans is relied on.
- No enterprise value can be supported, so recovery percentages, the fulcrum and any recovery-based ranking are withheld; had an implied enterprise value from peer multiples existed it would have been indicative, not a valuation, and recoveries would have carried that limitation.
- Ranking, guarantees and incurrence capacity come from the annual report's summary of the debt documents, not the executed agreements, so the indicative secured capacity of USD 3,244 million that drives the subordinated-note dilution argument could be larger or smaller.
- No mandate, holdings or trading data was supplied, so the sizing posture is generic and no numeric size, exit cost or concentration test is given.

### Recommendation

| Security | Year-end market level | Structural position | Relative value | Recommendation | Source |
|---|---|---|---|---|---|
| Term loans, Tranches I, J, K, L (USD 8,702 million principal) | 99.91% of par, agent fair value | Senior secured, pari with secured notes | Unclear | Requires More Work | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| Secured notes due 2028 to 2033 (USD 11,000 million principal) | 101.40% to 105.80% of par, Level 1 fair value | Senior secured, pari with term loans | Unclear | Requires More Work | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Senior subordinated notes due 2027 and 2029 (USD 4,600 million principal) | 96.67% to 99.51% of par, Level 1 fair value | Contractually and structurally subordinated | Rich against own secured notes | Avoid | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Trade receivable securitization (USD 487 million drawn) | Carried at fair value equal to carrying value | Dedicated domestic receivables | Not a traded security | Not in selection scope | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| Issuer, all debt | Not applicable: issuer level | Secured layer 78.51% of debt | Unclear | Requires More Work | calculation RV20 |

The key credit inputs that drive these calls are below; the pro forma figures are the decision figures.

| Measure | Value | Comparator | Creditor consequence | Source |
|---|---|---|---|---|
| Net leverage, reported EBITDA | 6.02x pro forma 2024-10-18 (net debt USD 22,967 million) | 4.88x at year end (net debt USD 18,619 million) | Leverage held near 6x | Financial foundation (CP-1) |
| Net leverage, supported earnings | 5.93x pro forma 2024-10-18 | 5.50x on EBITDA As Defined | Contractual measure flatters capacity | Earnings quality (CP-1D) |
| Interest cover | 3.29x FY2024 | 2.50x on scheduled USD 1,524 million; 2.16x downside FY2025 | Cover moves first in stress | Financial foundation (CP-1); Forward credit model (CP-2G) |
| Liquidity | USD 2,919 million pro forma 2024-10-18 | USD 7,267 million at year end | Low near-term default risk | Liquidity (CP-2D) |
| Secured debt ahead of subordinated notes | USD 19,534 million (78.51% of debt) | Subordinated notes USD 4,581 million | Thin junior cushion | Financial foundation (CP-1); calculation RV20 |
| Secured incurrence test | 4.22x pro forma | 5.00x ceiling; indicative capacity USD 3,244 million; claims ahead up to USD 22,778 million | Further dilution of juniors permitted | Legal & covenants (CP-4); calculation RV21 |
| Maturity wall | FY2028 to FY2029 USD 11,405 million | No term debt before November 2027 | Refinancing, not repayment | Fundamental credit (CP-2) |
| Distributions | USD 6,368 million declared FY2024 | USD 3,000 million secured debt alongside the September dividend | Policy, not cash flow, sets leverage | Business & governance (CP-1A) |

The loan quotes entered in the run settings are shown for completeness; their identity conflicts keep them out of every conclusion.

| Facility | Bid / ask (points of par) | Mid YTM and 3-year DM | Check against year-end terms | Use here | Source |
|---|---|---|---|---|---|
| Term loan J | 100.00 / 100.13 | 6.2%; 247 bp | Margin 250 bp matches; size within USD 9 million | Context only; date assigned for testing | Market-implied risk (CP-3D) |
| Term loan K | 99.94 / 100.13 | 5.9%; 224 bp | Quoted margin 225 bp against 275 bp; size USD 3,544 million against USD 1,699 million | Excluded: identity conflict | Market-implied risk (CP-3D) |
| Term loan L | 99.88 / 100.13 | 6.2%; 250 bp | Maturity 2032-01-20 against 2032-01-19 | Context only | Market-implied risk (CP-3D) |
| Term loan M | 99.88 / 100.13 | 6.2%; 250 bp | No matching year-end tranche | Excluded | Market-implied risk (CP-3D) |
| Term loan N | 99.88 / 100.25 | 6.2%; 248 bp | No matching year-end tranche | Excluded | Market-implied risk (CP-3D) |

### Fundamental credit summary

TransDigm presents a stretched credit profile in which business quality and financial policy pull in opposite directions. About 90% of sales are proprietary and about 55% aftermarket, which sustains an EBITDA As Defined margin of 52.56% and free cash flow of USD 1,880 million, so the operating business services its debt with room to spare and near-term default probability is low. Financial policy absorbs that cushion: the board declared USD 6,368 million of special distributions in FY2024, funded the September payment largely with USD 3,000 million of new secured debt and ranks debt prepayment last, so EBITDA growth becomes distribution capacity rather than deleveraging. Net leverage is 6.02x pro forma for the dividend paid on 2024-10-18 (4.88x at year end) and 5.93x on supported earnings. For instrument selection this means default risk is a later, refinancing-driven event, while loss severity for junior creditors rises with each round of secured borrowing. The most important missing datapoints are the executed debt documents, peer data and an enterprise value; none blocks the fundamental view, but all three bound what it can say about recovery and relative value.
Basis: Fundamental credit (CP-2); Business & governance (CP-1A); Financial foundation (CP-1); Earnings quality (CP-1D)

The downside path is time-ordered. A slowdown in commercial aftermarket demand stalls EBITDA growth while interest steps up to the scheduled USD 1,524 million; cover falls toward 2.16x in the FY2025 downside while free cash flow stays positive; shortfalls or further distributions move funding onto the revolver, where usage above USD 364 million springs a 7.50x net leverage test; and the issuer then meets the FY2028 to FY2029 wall of USD 11,405 million at higher leverage than FY2024. The observable triggers are a new debt-funded distribution, revolver usage above that threshold, the securitization renewal due 2025-07-11 and quarterly year-on-year EBITDA decline. The subordinated notes feel this path first, because the unsecured market is the one most likely to close and the November 2027 subordinated maturity is the first term-debt bullet.
Basis: Forward credit model (CP-2G); Liquidity (CP-2D); Refinancing & LME (CP-3C); Fundamental credit (CP-2)

### Security selection conclusions

The term loans are Requires More Work because the issuer's fundamentals are stretched but not distressed, while relative value is Unclear: the agent fair value of 99.91% of par says nothing about value against peers and the quotes in the run settings do not reconcile to the year-end tranches. Their senior secured, pari position with a collateral pool that includes cash is the best-protected claim in the stack. The main upside to debt is margin and cash-flow stability carrying leverage down toward 5.17x gross in the FY2027 base case; the main downside risk is dilution by further pari secured debt under the 5.00x test. Monitoring should focus on new incremental term loans and on verified, dated quotes for Tranches I to L.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 173–174; Market-implied risk (CP-3D); Forward credit model (CP-2G); Legal & covenants (CP-4)

The secured notes are Requires More Work because the fundamental view is the same, while relative value is Unclear: they trade at 101.40% to 105.80% of par with no disclosed call schedule, so neither yield to worst nor upside can be measured. They share collateral and ranking with the term loans, but the guarantees of the 2029 to 2033 series follow credit agreement guarantor status, a release route the loans do not face in the same way. The main upside to debt is low near-term default risk; the main downside risk is call-capped upside combined with dilution from further secured issuance. Monitoring should focus on the redemption terms of each series and any supplemental indenture changing guarantors.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4)

The senior subordinated notes are Avoid because the fundamental view leaves recovery to the junior class exposed to further secured layering, while relative value is Rich against the issuer's own secured notes: on maturity yields the January and May 2029 subordinated notes pay 9 bp and 2 bp less than the March 2029 secured notes, and the 2027 subordinated notes 26 bp less than the 2028 secured notes. They are contractually, payment-blockage and structurally subordinated. The main upside to debt is an early par takeout, as happened to the 2027 subordinated notes redeemed in April 2024; the main downside risk is loss severity if secured claims grow toward USD 22,778 million before a stress. Monitoring should focus on secured issuance, any special dividend and the secured notes' call terms.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4); Business & governance (CP-1A); calculation RV16; calculation RV17; calculation RV18; calculation RV21

### Capital structure

| Instrument | Rank and security | Principal (USD million) | Carrying value (USD million) | Coupon or margin | Maturity | Year-end fair value (% of par) | Source |
|---|---|---|---|---|---|---|---|
| Trade receivable securitization | Domestic trade receivables; rank against credit agreement not stated | 487 | 486 | Term SOFR + 1.45% | 2025-07-11 | Fair value equals carrying value (Level 2) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| Revolving credit facility (commitment 910; letters of credit 67; available 843) | Senior secured | Not supplied: undrawn apart from letters of credit | Not supplied: no drawn balance | Term SOFR + 2.25% | 2029-02-27 | Not supplied: undrawn | Legal & covenants (CP-4) |
| Term loan Tranche I | Senior secured | 1871 | Not supplied: aggregate only | Term SOFR + 2.75% | 2028-08-24 | Not supplied: aggregate only | Financial foundation (CP-1) |
| Term loan Tranche K | Senior secured | 1699 | Not supplied: aggregate only | Term SOFR + 2.75% | 2030-03-22 | Not supplied: aggregate only | Financial foundation (CP-1) |
| Term loan Tranche J | Senior secured | 3632 | Not supplied: aggregate only | Term SOFR + 2.50% | 2031-02-28 | Not supplied: aggregate only | Financial foundation (CP-1) |
| Term loan Tranche L | Senior secured | 1500 | Not supplied: aggregate only | Term SOFR + 2.50% | 2032-01-19 | Not supplied: aggregate only | Financial foundation (CP-1) |
| Term loans, all tranches | Senior secured | 8702 | 8642 | As above | 2028 to 2032 | 99.91 (agent information, Level 2) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| 6.75% secured notes | Senior secured | 2100 | 2077 | 6.75% fixed | 2028-08-15 | 102.86 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| 6.375% secured notes | Senior secured | 2750 | 2727 | 6.375% fixed | 2029-03-01 | 103.13 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 6.875% secured notes | Senior secured | 1450 | 1438 | 6.875% fixed | 2030-12-15 | 104.76 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 7.125% secured notes | Senior secured | 1000 | 984 | 7.125% fixed | 2031-12-01 | 105.80 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 6.625% secured notes | Senior secured | 2200 | 2180 | 6.625% fixed | 2032-03-01 | 104.14 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 6.00% secured notes | Senior secured | 1500 | 1486 | 6.00% fixed | 2033-01-15 | 101.40 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 5.50% senior subordinated notes | Unsecured, subordinated | 2650 | 2641 | 5.50% fixed | 2027-11-15 | 99.51 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| 4.625% senior subordinated notes | Unsecured, subordinated | 1200 | 1194 | 4.625% fixed | 2029-01-15 | 96.67 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| 4.875% senior subordinated notes | Unsecured, subordinated | 750 | 746 | 4.875% fixed | 2029-05-01 | 97.20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| Finance leases and government refundable advances | Rank not stated | 279 | 279 | Finance leases 7.0% weighted discount rate | Multiple | 100.00 (fair value equals carrying) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Total debt | All instruments | 25068 | 24880 | Not applicable: mixed | Not applicable: mixed | Not supplied: no aggregate fair value computed | Financial foundation (CP-1) |

### Relative value

Absolute relative value is Unclear for every TransDigm instrument because no comparable survives: Peer benchmark found no usable peer, the maintained sector loan workbook was not available, and the loan quotes in the run settings carry a date assigned for testing with identity conflicts against the year-end tranches. The one supportable comparison is inside the capital structure, using the audited year-end fair values: same issuer, same currency (USD), fixed-rate notes, matched or near-matched maturity, metric basis approximate yield to maturity from Level 1 quoted prices, with the limitation that these are fair values rounded to USD 1 million rather than bid or ask, and not yield to worst. On that basis the subordinated notes earn no premium for ranking behind USD 19,534 million of secured debt: the January 2029 subordinated notes at about 5.49% and the May 2029 subordinated notes at about 5.56% against about 5.58% for the March 2029 secured notes, and the 2027 subordinated notes at about 5.67% against about 5.93% for the 2028 secured notes. The difference is not compensation but its absence, so the subordinated notes are Rich against the issuer's own secured paper. The secured notes' premium prices (101.40% to 105.80% of par) mean their economic yield may be lower than shown if they are callable, which is the main reason this view is provisional. Term loans at 99.91% of par on agent information are consistent with near-par trading but cannot be set against peers.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Peer benchmark (CP-1C); Market-implied risk (CP-3D); calculation RV11; calculation RV12; calculation RV13; calculation RV14; calculation RV15

### Instrument preference view

The stack has 17 debt lines at carrying value of USD 24,880 million in three structural layers: a dedicated receivables securitization, a single pari senior secured layer of USD 19,534 million (term loans, revolver and six secured note series) and USD 4,581 million of senior subordinated notes, plus finance leases and government advances whose rank is not stated. No instrument is Preferred, because absolute compensation cannot be measured against peers. The term loans and secured notes are Requires More Work with a structural lean in their favour: they lose only by dilution if more pari secured debt is issued, while the subordinated notes lose by priority. Between the two secured instruments, the trade-off is floating-rate near-par loans with no call premium at risk against fixed-rate notes trading above par with undisclosed call terms and guarantees tied to credit agreement guarantor status. The subordinated notes are Avoid: high recovery sensitivity from contractual, blockage and structural subordination, priming by ordinary secured layering already demonstrated, and no yield premium for it. To make the secured instruments decision-useful requires dated, verified quotes reconciled to Tranches I to L, like-for-like secured comparables, and the redemption schedules of the secured notes. The top monitoring trigger across the structure is any new secured issue or incremental term loan, especially alongside a dividend. The structure-wide risk is recovery dilution of junior creditors through secured issuance permitted by the 5.00x test, not a near-term liability-management exercise, which Refinancing & LME rates Low. Recovery percentages are not assigned because no enterprise value can be supported, so the preference is not case-dependent on a fulcrum that cannot be located.

Instrument preference completed with limitations. Preferred: none. Requires More Work: term loans, secured notes. Avoid: senior subordinated notes. Key gaps: peer comparables, verified loan quotes, note call schedules, enterprise value.
Basis: Financial foundation (CP-1); Legal & covenants (CP-4); Refinancing & LME (CP-3C); Recovery & fulcrum (CP-4C); calculation RV19; calculation RV20

### Portfolio Fit

Portfolio fit is generic logic only because no mandate, holdings, concentration limits, rating-bucket capacity or trading-depth evidence was supplied, so no numeric size and no Core Hold is supportable. The secured term loans and secured notes are Watchlist: analytically the defensive senior secured layer of a high-margin aerospace credit, but not implementable until relative value is established, and any position would sit in a single-name, aerospace and defense exposure correlated with commercial air traffic and US defense outlays. The subordinated notes are Avoid for implementation, because the junior layer carries the highest loss sensitivity in the structure with no yield premium over the issuer's own secured notes, so they consume more downside budget per unit of yield. Exit risk is not assessable: the only bid and ask evidence is the loan quotes in the run settings, whose displayed widths of 0.13 to 0.37 points of par are not executable depth, and nothing shows that any instrument can be scaled without price impact. The binding constraints are, in order, missing mandate and exposure data, unestablished relative value for the secured layer, and the event risk of a further debt-funded distribution. The top trigger is a new secured issue or special dividend declaration; the critical gaps are mandate limits, current exposure and verified market depth.

Portfolio fit completed with limitations. Sizing posture: Watchlist for the secured term loans and secured notes; Avoid for the senior subordinated notes. Missing inputs: mandate limits, current and pro forma exposure, concentration data, trading depth.
Basis: Market-implied risk (CP-3D); Business & governance (CP-1A); Fundamental credit (CP-2)

### Final credit and relative-value view

Overall, TransDigm's debt is Requires More Work, with the senior subordinated notes Avoid. Fundamentally, TransDigm presents a stretched credit profile because a 52.56% EBITDA As Defined margin and USD 2,919 million of post-dividend liquidity sit against net leverage of 6.02x pro forma, held there by debt-funded distributions. Relative value appears Unclear for the secured layer because no peer or verified loan comparison exists, and Rich for the subordinated notes because they yield no more than the issuer's secured notes of similar maturity. The final security-selection conclusion is Requires More Work for the term loans and secured notes because fundamentals and structure are acceptable but compensation cannot be judged, and Avoid for the subordinated notes because their structural disadvantage is unpaid. The main upside to debt is growth carrying gross leverage toward 5.17x by FY2027 if cash is retained. The main downside risk is another secured-debt-funded dividend that adds claims ahead of the juniors while earnings slow. Further analysis would require verified loan quotes, secured comparables, note redemption schedules, an enterprise value and the executed debt documents.

Relative value and security selection completed with limitations. Recommendation: Requires More Work (senior subordinated notes: Avoid). RV: Unclear (senior subordinated notes: Rich against own secured notes). Key gaps: peer comparables, verified loan quotes, call schedules, enterprise value, mandate data.
Basis: Fundamental credit (CP-2); Liquidity (CP-2D); Forward credit model (CP-2G); calculation RV16

### Recovery waterfall

| Line | Amount | Low | Base | High | Currency | Scale |
|---|---|---|---|---|---|---|
| Enterprise value | Not supplied: no peer or transaction multiple, no market capitalisation and no restructuring valuation in the evidence | Not supplied: no peer or transaction multiple | Not supplied: no peer or transaction multiple | Not supplied: no peer or transaction multiple | USD | million |
| EV multiple | Not supplied: Peer benchmark found no usable peer and its implied enterprise value table holds no multiple | Not supplied: no multiple | Not supplied: no multiple | Not supplied: no multiple | — | x |
| EV metric | 3813 | — | — | — | USD | million |
| EV basis | Reported EBITDA FY2024 of USD 3,813 million from Financial foundation; no EV/EBITDA multiple from Peer benchmark; Recovery & fulcrum found the distress gate not met and built no valuation | — | — | — | — | — |
| Cost: administrative and restructuring costs | Not supplied: no restructuring scenario | Not supplied: no restructuring scenario | Not supplied: no restructuring scenario | Not supplied: no restructuring scenario | USD | million |
| Claim: Trade receivable securitization (dedicated domestic receivables) | 486 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: Term loans Tranches I, J, K, L, revolving credit facility (undrawn; letters of credit 67 contingent) and six secured note series, ranking equally | 19534 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: Senior subordinated notes due 2027, January 2029 and May 2029 | 4581 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Claim: Finance leases and government refundable advances (rank not stated) | 279 | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |
| Fulcrum | Not supplied: fulcrum not determinable without enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | — | — |
| Residual to equity | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | Not supplied: no enterprise value | USD | million |

Claims are at carrying value and sum to total debt of USD 24,880 million; principal is USD 25,068 million. The order shown is the documented ranking, with the leases and advances last only because their rank is not stated.

### Events: Instruments

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: every sourced maturity, the securitization renewal and the first term-debt maturity are already recorded by Legal & covenants, Business & governance and Liquidity | Not supplied: no additional instrument event | Not supplied: no additional instrument event | Not supplied: the annual report discloses no call, put, coupon reset or offer deadline for any note or loan | Not supplied: no additional instrument event | Not supplied: no additional instrument event | Not supplied: the missing call schedules are the gap that keeps the subordinated-note view provisional |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 12 |
| Calculated | 10 |
| Assumption-Based | 0 |
| Analyst Inference | 6 |
| Weak Lineage | 1 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 5 |
| Fields present | 13 |
| Fields total | 15 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

Module status: Ready with Limitations. Execution mode: Capital-Structure RV. Instrument preference status: Ready with Limitations. Portfolio fit status: Completed with Limitations; output mode: Generic Portfolio-Fit Logic. No hard-risk override triggered; the composite is not scored, so there is nothing to override.

#### Inherited definition conflict register

<!-- table-id: definition_conflict_register -->
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

This register is carried forward unchanged from Financial foundation, with its original calculation references; it applies to the relative-value and portfolio-fit stages alike.

#### T3.3 Issuer / Security Scorecard

<!-- table-id: T3.3 -->
| Category | Factor | Weight | Raw Score 1–5 | Weighted Score | Confidence | Evidence | Risk Mechanic | Credit Implication | Source |
|---|---|---|---|---|---|---|---|---|---|
| Business risk | Competitive position and margin | Not supplied: no mandate or framework weights | 2 | Not Scorable: weights absent | Medium | About 90% proprietary and about 55% aftermarket sales; EBITDA As Defined margin 52.56%; no peer data | Certified sole-source parts sustain pricing through volume swings | Supports debt service and franchise value; low near-term PD | Fundamental credit (CP-2); Business & governance (CP-1A) |
| Business risk | End-market cyclicality | Not supplied: no mandate or framework weights | 3 | Not Scorable: weights absent | Medium | Commercial aftermarket about 31%, commercial OEM about 27%, defense about 40% of sales | Air traffic, OEM build rates and defense pricing reviews move volume and margin | Moderate EBITDA volatility in a downturn | Fundamental credit (CP-2) |
| Financial risk | Leverage | Not supplied: no mandate or framework weights | 4 | Not Scorable: weights absent | High | Net debt / reported EBITDA 6.02x pro forma 2024-10-18 (4.88x year end); 5.93x on supported earnings; gross 6.53x | Debt held flat while growth funds distributions | Thin leverage tolerance; refinancing near 6x | Financial foundation (CP-1); Earnings quality (CP-1D) |
| Financial risk | Coverage and FCF durability | Not supplied: no mandate or framework weights | 3 | Not Scorable: weights absent | High | Cover 3.29x FY2024; 2.50x on scheduled interest USD 1,524 million; FCF USD 1,880 million; downside FY2025 cover 2.16x | Interest steps up USD 366 million before full-year EBITDA catches up | Debt service self-funded; cover is first metric to weaken | Financial foundation (CP-1); Forward credit model (CP-2G) |
| Financial risk | Earnings quality | Not supplied: no mandate or framework weights | 3 | Not Scorable: weights absent | Medium | Supported EBITDA USD 3,871 million against USD 4,173 million As Defined | Recurring costs removed from the contractual denominator | Contractual capacity overstated by about 0.43x of leverage | Earnings quality (CP-1D) |
| Liquidity | Near-term liquidity | Not supplied: no mandate or framework weights | 2 | Not Scorable: weights absent | High | Pro forma liquidity USD 2,919 million; liquidity risk Adequate; securitization USD 650 million due 2025-07-11 | Buffer covers scheduled uses; revolver usage above USD 364 million springs a 7.50x test | Low near-term PD | Liquidity (CP-2D) |
| Refinancing | Maturity wall | Not supplied: no mandate or framework weights | 3 | Not Scorable: weights absent | Medium | No term debt before November 2027; FY2028 to FY2029 USD 11,405 million, 46.90% of the ladder | Market access needed at near 6x leverage | Refinancing dependence; subordinated notes first exposed | Fundamental credit (CP-2); Refinancing & LME (CP-3C) |
| Governance / financial policy | Financial policy | Not supplied: no mandate or framework weights | 5 | Not Scorable: weights absent | High | USD 6,368 million special distributions declared FY2024; USD 3,000 million secured debt alongside the September dividend; debt prepayment ranked last | EBITDA growth converted into distributions; secured claims added without EBITDA | Leverage held not reduced; junior recovery diluted | Business & governance (CP-1A) |
| Legal / covenant | Covenant protection | Not supplied: no mandate or framework weights | 4 | Not Scorable: weights absent | Low | Aggressiveness 4 of 5 (provisional); no maintenance covenant; incurrence 7.25x net and 5.00x secured net | Lender control arrives late; secured layering permitted | Weak protection against leakage and dilution | Legal & covenants (CP-4) |
| Security-level structure | Structural position: term loans and secured notes | Not supplied: no mandate or framework weights | 2 | Not Scorable: weights absent | Medium | Senior secured, pari, shared collateral including cash, one guarantor group; non-guarantors about 20.73% of sales | Dilution by further pari secured debt, indicative USD 3,244 million | Best-protected layer; dilution not priming | Legal & covenants (CP-4) |
| Security-level structure | Structural position: senior subordinated notes | Not supplied: no mandate or framework weights | 5 | Not Scorable: weights absent | Medium | Contractual, payment-blockage and structural subordination; USD 19,534 million secured ahead (78.51% of debt) | Each secured issue raises junior LGD | High recovery sensitivity | Legal & covenants (CP-4); Refinancing & LME (CP-3C); calculation RV20 |
| Recovery | Recovery and LGD | Not supplied: no mandate or framework weights | Not Scorable | Not Scorable: weights absent | Not Assessable | No peer multiple and distress gate not met, so no enterprise value | Recovery cannot be sized | Recovery percentages withheld; ranking by structure only | Peer benchmark (CP-1C); Recovery & fulcrum (CP-4C) |
| Market compensation | Term loans and secured notes | Not supplied: no mandate or framework weights | Not Scorable | Not Scorable: weights absent | Not Assessable | Term loans 99.91% of par (agent); secured notes 101.40% to 105.80% of par (Level 1); no peers; no call schedules | Compensation cannot be benchmarked | RV Unclear; cannot be Preferred | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174 |
| Market compensation | Senior subordinated notes | Not supplied: no mandate or framework weights | 5 | Not Scorable: weights absent | Low | Approximate maturity yields 5.49% to 5.67% against 5.58% to 5.93% on secured notes of similar maturity | No yield premium for subordination | Rich against own secured notes; Avoid | calculation RV11; calculation RV12; calculation RV13; calculation RV14; calculation RV15 |

Composite Score: Not Scorable, because no mandate, sector framework or user weights were supplied and none is invented. Credit Tier: Not Scorable. The unweighted factor pattern reads as a stretched profile: strong business and liquidity factors offset by aggressive financial policy, leverage and covenant protection.

#### T3.6 Fundamental Value Matrix

<!-- table-id: T3.6 -->
| Security / Issuer | Fundamental View | Relative-Value View | Structural / Recovery View | Final Matrix Bucket | Rationale | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated, all debt | Stretched: low near-term PD, leverage held near 6x by policy | Unclear: no peer or verified loan comparison | Secured layer 78.51% of debt; recovery not quantified | Requires More Work | Fundamentals acceptable for secured risk but compensation unmeasurable | T3.3 rows Leverage; Financial policy; Market compensation (term loans and secured notes) | Financial foundation (CP-1); Business & governance (CP-1A); Peer benchmark (CP-1C) |
| Term loans Tranches I, J, K, L | Stretched issuer; secured claim | Unclear: agent fair value 99.91% of par; run-settings quotes conflict with tranche terms | Senior secured pari; dilution risk under 5.00x test | Requires More Work | Best-protected claim, but no comparable market value or reconciled identity | T3.3 rows Structural position (term loans and secured notes); Market compensation (term loans and secured notes) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 173–174; Market-implied risk (CP-3D) |
| Secured notes due 2028 to 2033 | Stretched issuer; secured claim | Unclear: 101.40% to 105.80% of par, call terms undisclosed | Senior secured pari; newer series' guarantees follow credit agreement | Requires More Work | Yield to worst and upside cannot be measured | T3.3 rows Structural position (term loans and secured notes); Market compensation (term loans and secured notes) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173; Legal & covenants (CP-4) |
| Senior subordinated notes due 2027 and 2029 | Stretched issuer; junior claim exposed to secured layering | Rich against own secured notes: maturity-yield gaps of -9 bp, -2 bp and -26 bp | Triple subordination; high recovery sensitivity | Avoid | Structural disadvantage unpaid; better alternative exists in same issuer | T3.3 rows Structural position (senior subordinated notes); Market compensation (senior subordinated notes) | Legal & covenants (CP-4); calculation RV16; calculation RV17; calculation RV18 |

#### T3B.1 Source Register

<!-- table-id: T3B.1 -->
| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | Form 10-K FY2024, audited | High | FY ended 2024-09-30; signed 2024-11-07 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrower and issuer | Carrying value and fair value of each debt instrument; fair-value levels and methods | Fair values rounded to USD 1 million; no bid/ask; no redemption schedules; executed debt documents not included | Used here for market levels and the intra-structure yield comparison | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174 |
| S2 | Form 10-Q Q1 FY2025, unaudited | Medium | Quarter to 2024-12-28 (after as-of) | Consolidated | October 2024 dividend split; share repurchases USD 316 million | Subsequent period; not blended into year-end figures | Used here for subsequent events only, through prior analyses | Business & governance (CP-1A); Liquidity (CP-2D) |
| A1 | Financial foundation | High | FY2024 and FY2023; pro forma 2024-10-18 | Consolidated | Debt by instrument, leverage, net debt, maturity ladder, definition conflicts | Covenant headroom not established | Used here for the debt stack and credit metrics | Financial foundation (CP-1) |
| A2 | Legal & covenants | Medium (issuer summary authority) | As of 2024-09-30 | TransDigm Inc. and guarantors | Ranking, guarantees, blockage, incurrence tests, indicative secured capacity | Executed agreements and intercreditor not supplied | Used here for structural position and dilution capacity | Legal & covenants (CP-4) |
| A3 | Refinancing & LME | Medium | As of 2024-09-30 | Same issuer | Low near-term vulnerability; creditor-class exposure; years to maturity | No executable coercive-path capacity | Used here for LME overlay and yield-calculation tenors | Refinancing & LME (CP-3C) |
| A4 | Market-implied risk | Low (module blocked) | Assigned 2024-09-30 | Quoted TransDigm loan facilities | Identity conflicts and displayed bid/ask widths | Historical market inference blocked | Used here only to exclude conflicted quotes | Market-implied risk (CP-3D) |
| A5 | Recovery & fulcrum | Medium | As of 2024-09-30 | Same issuer | Distress gate not met | No enterprise value or class recovery | Used here to withhold recovery percentages | Recovery & fulcrum (CP-4C) |
| A6 | Loan quotes and facility ratings in the run settings | Low (user-entered test transcription, assigned date) | Assigned 2024-09-30 | Term loans J, K, L, M, N | Bid/ask, mid YTM, 3-year DM; facility Ba3 / BB- | Not authenticated; K, L, M, N identity conflicts | Used here as context only; excluded from conclusions | Market-implied risk (CP-3D); Ratings & triggers (CP-2H) |
| SE1 | Subsequent event: securitization drawn in full | High | 2024-10-16 | Securitization facility | Remaining USD 162.5 million drawn; facility USD 650 million drawn | After balance-sheet date; net-debt neutral | Used here as a dated subsequent event; pre-event stack is the base case | Financial foundation (CP-1) |
| SE2 | Subsequent event: special dividend paid | High | 2024-10-18 | TransDigm Group Incorporated | USD 4,348 million paid (4,216 dividend plus 132 equivalents); quarterly figure 4,396 unreconciled | After balance-sheet date; changes cash, not the debt stack | Used here for pro forma net leverage 6.02x and liquidity USD 2,919 million | Financial foundation (CP-1); Liquidity (CP-2D) |
| SE3 | Subsequent event: share repurchases | Medium | Quarter ended 2024-12-28 | TransDigm Group Incorporated | USD 316 million repurchased | After balance-sheet date; no debt-stack change | Used here as financial-policy evidence only | Business & governance (CP-1A) |

#### T3C.1 Portfolio Input Gate

<!-- table-id: T3C.1 -->
| Input | Available / Missing | Source | Limitation | Portfolio Impact |
|---|---|---|---|---|
| Security-selection and instrument-preference conclusions | Available | Findings above; calculation RV16 | Secured layer Requires More Work; subordinated notes Avoid | Supports a generic posture only |
| Issuer and security identifiers | Partially available | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 | No CUSIP or ISIN for notes; loan identifiers in the run settings conflict with year-end tranches | Instrument-level implementation not possible |
| Mandate constraints | Missing | Not supplied: no mandate in the run settings | No eligibility, rating-bucket or concentration limits | No mandate-specific fit; no numeric size |
| Portfolio constraints workbook | Missing | Not supplied: run settings record no portfolio workbook | No limit, headroom or status rows | Constraint testing not possible |
| Current holdings and exposure | Missing | Not supplied: no holdings data | Current and pro forma exposure unknown | Add or trim cannot be judged |
| Concentration data | Missing | Not supplied: no concentration report | Sector, sponsor, rating and maturity exposure unknown | Concentration register holds no values |
| Liquidity and trading constraints | Missing | Market-implied risk (CP-3D) | Only displayed widths from unverified quotes; no depth, trades or minimum size | Exit risk not assessable |
| Downside, recovery, legal and LME inputs | Available with limitations | Forward credit model (CP-2G); Legal & covenants (CP-4); Refinancing & LME (CP-3C); Recovery & fulcrum (CP-4C) | No enterprise value; legal terms from summaries | Downside budget directional only |

Module status: Completed with Limitations. Output mode: Generic Portfolio-Fit Logic. Sources flagged: run-settings quotes are a test transcription with an assigned date; legal evidence is the issuer's summary; the December 2024 quarterly report is used only for subsequent events.

#### T3C.2 Portfolio Fit Register

<!-- table-id: T3C.2 -->
| Name / Instrument | Fit Category | Evidence | Risk Mechanic | Why It Fits / Does Not Fit | Constraints / Notes | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Term loans Tranches I, J, K, L | Not assessable | Senior secured pari; agent fair value 99.91% of par; low near-term PD | Dilution by further secured debt; floating-rate exposure to Term SOFR | Candidate role defensive senior secured exposure, but RV and mandate unknown | No mandate or loan-market evidence | S1; A2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173; Legal & covenants (CP-4) |
| Secured notes due 2028 to 2033 | Not assessable | Senior secured; 101.40% to 105.80% of par | Call-capped upside; dilution | Candidate role defensive senior secured exposure; yield to worst unknown | Call schedules not disclosed | S1; A2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Senior subordinated notes due 2027 and 2029 | Not fit | Maturity yields at or below secured notes of similar maturity; triple subordination | Highest LGD sensitivity with no premium | Fails RV fit: junior risk unpaid within the same issuer | Provisional on secured call terms | S1; A2; A3 | calculation RV16; Legal & covenants (CP-4) |
| TransDigm issuer exposure | Not assessable | Stretched fundamentals; financial policy High risk | Event risk of debt-funded distributions | Fit depends on mandate tolerance for single-name aerospace event risk | No mandate data | A1 | Business & governance (CP-1A); Fundamental credit (CP-2) |

#### T3C.3 Position Sizing Posture Table

<!-- table-id: T3C.3 -->
| Name / Instrument | Sizing Posture | Evidence | Reason | Key Risk | Implementation Note | Confidence | Source Trace | Source |
|---|---|---|---|---|---|---|---|---|
| Term loans Tranches I, J, K, L | Watchlist | Senior secured; fundamentals acceptable; RV Unclear; no mandate data | Analytically relevant but not implementable before RV and mandate fit are shown | Dilution by further secured issuance | No numeric size; require verified quotes reconciled to tranches first | Low | S1; A2; A4 | Legal & covenants (CP-4); Market-implied risk (CP-3D) |
| Secured notes due 2028 to 2033 | Watchlist | Senior secured; above-par prices; call terms undisclosed | Yield to worst and upside unknown | Call-capped upside with dilution risk | No numeric size; obtain redemption schedules | Low | S1; A2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Senior subordinated notes due 2027 and 2029 | Avoid | No yield premium over secured notes; triple subordination | Downside budget consumed without compensation | Loss severity if secured claims grow toward USD 22,778 million | Revisit only if secured yield to worst proves materially lower | Low | S1; A2; A3 | calculation RV16; calculation RV21 |

Core Hold is not assigned to any instrument: none of mandate eligibility, exposure capacity, liquidity and exit feasibility, or concentration evidence is available. Starter is not assigned because the relative-value conclusion for the secured layer is not favourable or conditional but unestablished.

#### T3C.4 Risk Budget Flags

<!-- table-id: T3C.4 -->
| Flag | Evidence | Risk Mechanic | Why It Matters | Caution Level | Portfolio Impact | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Financial-policy event risk | USD 6,368 million distributions declared FY2024; USD 3,000 million secured debt with the September dividend | Distributions re-lever without notice | Gap risk for any holding, largest for juniors | High | Cap any future exposure pending policy evidence | A1 | Business & governance (CP-1A) |
| Capital-structure layer | Subordinated notes behind USD 19,534 million secured | Secured issuance raises junior LGD | Junior layer consumes most downside budget | High | Avoid junior layer | A2 | Legal & covenants (CP-4) |
| Maturity wall | FY2028 to FY2029 USD 11,405 million | Refinancing at market terms near 6x leverage | Concentrated rollover risk inside many hold periods | Medium | Prefer instruments not first in the rollover queue | A1 | Fundamental credit (CP-2) |
| Refinancing / LME | Near-term vulnerability Low; coercive capacity not established | Ordinary secured layering, not coercion, is the demonstrated channel | LME tail cannot be excluded without documents | Medium | Monitor amendments and releases | A3 | Refinancing & LME (CP-3C) |
| Legal / covenant | Aggressiveness 4 of 5 provisional; no maintenance covenant | Late lender control | Deterioration reaches holders through price before covenants | Medium | Rely on price and policy triggers, not covenants | A2 | Legal & covenants (CP-4) |
| Recovery / LGD | No enterprise value | Loss severity unquantified | Downside budget cannot be sized | Not Assessable | No loss-at-size figure | A5 | Recovery & fulcrum (CP-4C) |
| Liquidity / exit | Only displayed widths of 0.13 to 0.37 points from unverified quotes | Exit cost unknown | Scaling without price impact cannot be assumed | Not Assessable | No size until depth evidence exists | A4 | Market-implied risk (CP-3D) |
| Rating bucket | Facility indications Ba3 / BB- unverified | Rating-bucket eligibility uncertain | Mandate eligibility may depend on it | Not Assessable | Verify agency ratings before eligibility test | A6 | Ratings & triggers (CP-2H) |
| Sector / correlation | Aerospace and defense; commercial aftermarket about 31%, defense about 40% of sales | Common factor with air traffic and defense budgets | Correlates with other aerospace holdings | Not Assessable | Requires holdings data | A1 | Fundamental credit (CP-2) |

#### T3C.5 Concentration and Correlation Register

<!-- table-id: T3C.5 -->
| Exposure Dimension | Current Exposure | Proposed / Pro Forma Exposure | Limit / Capacity | Evidence Status | Risk Mechanic | Portfolio Implication | Source Trace | Source |
|---|---|---|---|---|---|---|---|---|
| Issuer / group | Not provided: no holdings data | Not provided: no proposed size | Not provided: no mandate limit | Not Provided | Single-name event risk from distributions | Cannot test issuer limit | T3C.1 | Not supplied: no portfolio data in the run settings |
| Sector / subsector | Not provided: no holdings data | Not provided: no proposed size | Not provided: no sector limit | Not Provided | Aerospace and defense common factor | Cannot test sector limit | T3C.1 | Fundamental credit (CP-2) |
| Sponsor / ownership | Not provided: no holdings data | Not provided: no proposed size | Not provided: no limit | Not Provided | Widely held, no sponsor; policy set by board | No sponsor overlap to test; board-driven event risk | A1 | Business & governance (CP-1A) |
| Rating bucket | Not provided: no holdings data | Not provided: no proposed size | Not provided: no rating limit | Not Provided | Facility indications unverified | Eligibility untestable | A6 | Ratings & triggers (CP-2H) |
| Maturity year / wall | Not provided: no holdings data | Not provided: no proposed size | Not provided: no limit | Not Provided | Issuer wall FY2028 to FY2029 USD 11,405 million | Cannot test portfolio maturity overlap | A1 | Fundamental credit (CP-2) |
| Capital-structure layer | Not provided: no holdings data | Not provided: no proposed size | Not provided: no limit | Not Provided | Junior layer most exposed to secured layering | Junior exposure to be avoided regardless of limit | A2 | Legal & covenants (CP-4) |
| Correlated holdings / common factor | Not provided: no holdings data | Not provided: no proposed size | Not provided: no limit | Not Provided | Air traffic, OEM build rates, defense outlays | Correlation with other aerospace names untestable | A1 | Fundamental credit (CP-2) |

#### T3C.6 Liquidity and Implementation Assessment

<!-- table-id: T3C.6 -->
| Liquidity / Implementation Factor | Evidence | Risk Mechanic | Implementation Consequence | Constraint / Action | Source Trace | Source |
|---|---|---|---|---|---|---|
| Trading depth, bid-ask and dealer colour | Run-settings loan quotes show widths of 0.13 to 0.37 points of par; no depth, trades or dealer count; notes have fair values only | Displayed width is not executable size | Exit risk not assessable | Obtain dated two-sided quotes with size before any entry | A4; S1 | Market-implied risk (CP-3D) |
| Settlement, minimum size and operational constraints | Not provided: no settlement or minimum-denomination data | Operational frictions unknown | Implementation feasibility not established | Confirm settlement conventions and denominations | T3C.1 | Not supplied: no trading data in the run settings |
| Exit route under stress | Not provided: no stress liquidity evidence; event risk from distributions documented | Stress could widen junior prices first | Exit risk not assessable | Treat any future junior exposure as illiquid in stress | A1; A4 | Business & governance (CP-1A); Market-implied risk (CP-3D) |
| Ability to add or trim | Issue sizes are large (for example Tranche J USD 3,632 million principal) but size alone is not liquidity | No trading evidence for scaling | No assumption of scaling without price impact | Require trade history before sizing | S1; A4 | Financial foundation (CP-1) |

#### T3C.7 Downside Budget and Recovery Sensitivity

<!-- table-id: T3C.7 -->
| Downside Scenario / Driver | Input Basis | Formula / Method | Result / Directional View | Portfolio Loss / Risk-Budget Implication | Status | Source Trace | Source |
|---|---|---|---|---|---|---|---|
| Price downside | Year-end fair values; no duration, spread duration or yield to worst | Price change = duration × spread change, inputs missing | No price stress computed | Loss at size cannot be stated | Not Calculable | S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 |
| Recovery / LGD sensitivity | Claims by layer; no enterprise value | Waterfall by priority, value input missing | Subordinated notes most sensitive; secured layer 78.51% of debt | Junior exposure consumes most loss budget | Directional Only | A1; A5 | Recovery & fulcrum (CP-4C); calculation RV20 |
| Refinancing / maturity-wall downside | FY2028 maturities USD 6,637 million; cumulative base FCF USD 5,077.1 million (76.50%); downside FY2027 gross leverage 6.47x | Cumulative FCF against wall | Refinancing required in every case | Holdings maturing FY2028 to FY2029 carry rollover risk | Directional Only | A1 | Forward credit model (CP-2G) |
| Legal / priming / leakage downside | Secured 19,534 plus indicative capacity 3,244, USD million | Sum of claims ahead of subordinated notes | Up to USD 22,778 million ahead of juniors | Junior recovery dilution without default | Directional Only | A2 | Legal & covenants (CP-4); calculation RV21 |

#### T3C.8 Monitoring Triggers

<!-- table-id: T3C.8 -->
| Trigger ID | Indicator | Leading / Lagging | Threshold or Qualitative Signal | Linked Risk Flag | Portfolio Action | Source Trace | Limitation |
|---|---|---|---|---|---|---|---|
| CP-3B-MON-001 | New secured issue or incremental term loan | Leading | Any announcement, especially alongside a special dividend | Financial-policy event risk; Capital-structure layer | Escalate | Legal & covenants (CP-4); Business & governance (CP-1A) | Remaining capacity indicative only |
| CP-3B-MON-002 | Secured note redemption schedules | Leading | Receipt of call terms showing secured yield to worst well below subordinated yields | Capital-structure layer | Escalate | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–173 | No calibrated numerical level in the evidence |
| CP-3B-MON-003 | Verified dated loan quotes and secured comparables | Leading | Quotes reconciled to Tranches I to L with comparables at like seniority and maturity | Liquidity / exit | Add | Market-implied risk (CP-3D) | Add only if RV then supports it and a mandate exists |
| CP-3B-MON-004 | Revolver usage | Leading | Usage above USD 364 million activates the 7.50x test | Legal / covenant | Escalate | Liquidity (CP-2D) | Contractual definitions not supplied |
| CP-3B-MON-005 | Securitization renewal | Leading | No extension or funded repayment plan ahead of 2025-07-11 | Refinancing / LME | Escalate | Liquidity (CP-2D) | Renewal terms not supplied |
| CP-3B-MON-006 | Quarterly EBITDA and interest cover | Lagging | Year-on-year EBITDA decline or cover moving toward the 2.16x downside level | Maturity wall | Avoid | Forward credit model (CP-2G) | Downside is an analyst scenario |
| CP-3B-MON-007 | Special dividend or repurchase declaration | Leading | Any declaration while EBITDA falls | Financial-policy event risk | Avoid | Business & governance (CP-1A) | Restricted-payment capacity not established |

#### T3C.9 Gaps Ledger

<!-- table-id: T3C.9 -->
| Gap ID | Missing Data | Why It Matters | Affected Sizing / Risk Budget / Trigger | Consequence for Confidence | Required Follow-Up Source |
|---|---|---|---|---|---|
| CP-3B-GAP-001 | Mandate eligibility and limits | Decides fit and size | All postures; T3C.2 | High impact | Mandate guidelines |
| CP-3B-GAP-002 | Current and pro forma exposure | Decides add or trim | T3C.3; T3C.5 | High impact | Holdings report |
| CP-3B-GAP-003 | Concentration capacity by issuer, sector, rating and maturity | Tests correlation and limits | T3C.5 | High impact | Concentration report or constraints workbook |
| CP-3B-GAP-004 | Verified dated market levels for loans | Market date and RV for secured layer | T3C.3; CP-3B-MON-003 | High impact | Dated provider quotes reconciled to tranche identifiers |
| CP-3B-GAP-005 | Note redemption schedules | Yield to worst; subordinated Avoid | T3C.3; CP-3B-MON-002 | Medium impact | Indentures |
| CP-3B-GAP-006 | Trading depth, minimum size, settlement | Exit and scaling | T3C.6 | High impact | Trade history and dealer quotes with size |
| CP-3B-GAP-007 | Enterprise value and recovery | Loss budget at size | T3C.7 | Medium impact | Peer or transaction multiples; valuation |
| CP-3B-GAP-008 | Executed debt documents and intercreditor | Priming, release and RP capacity | T3C.4; T3C.7 | Medium impact | Credit agreement, indentures, intercreditor agreement |
| CP-3B-GAP-009 | Verified agency ratings | Rating-bucket eligibility | T3C.4; T3C.5 | Medium impact | Dated agency publications |
| CP-3B-GAP-010 | Future refinancing terms | Wall cost and feasibility | T3C.7 | Low impact | New-issue indications nearer FY2027 |

## Calculations

All prices are year-end fair value divided by principal, shown as a ratio and as % of par (ratio × 100). Approximate yield to maturity uses the standard approximation (coupon + (100 − price) / years) / ((100 + price) / 2), with years from Refinancing & LME on a 30/360 convention; it is an analyst approximation, not a quoted yield or yield to worst.

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| RV1 | 2027 subordinated notes price | 2637 / 2650 | 0.9951 (99.51% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| RV2 | 2028 secured notes price | 2160 / 2100 | 1.0286 (102.86% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| RV3 | January 2029 subordinated notes price | 1160 / 1200 | 0.9667 (96.67% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| RV4 | March 2029 secured notes price | 2836 / 2750 | 1.0313 (103.13% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| RV5 | May 2029 subordinated notes price | 729 / 750 | 0.972 (97.20% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| RV6 | 2030 secured notes price | 1519 / 1450 | 1.0476 (104.76% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| RV7 | 2031 secured notes price | 1058 / 1000 | 1.058 (105.80% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| RV8 | 2032 secured notes price | 2291 / 2200 | 1.0414 (104.14% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| RV9 | 2033 secured notes price | 1521 / 1500 | 1.014 (101.40% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| RV10 | Term loans aggregate price (agent information) | 8694 / 8702 | 0.9991 (99.91% of par) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172, 174 |
| RV11 | January 2029 subordinated notes approximate yield | (4.625 + 3.3333 / 4.2917) / ((100 + 96.6667) / 2) = 5.4017 / 98.33335 | 0.0549 (5.49%) | 2024-09-30, ratio | calculation RV3; Refinancing & LME (CP-3C) |
| RV12 | May 2029 subordinated notes approximate yield | (4.875 + 2.8 / 4.5861) / ((100 + 97.2) / 2) = 5.4855 / 98.6 | 0.0556 (5.56%) | 2024-09-30, ratio | calculation RV5; Refinancing & LME (CP-3C) |
| RV13 | March 2029 secured notes approximate yield | (6.375 − 3.1273 / 4.4194) / ((100 + 103.1273) / 2) = 5.6674 / 101.56365 | 0.0558 (5.58%) | 2024-09-30, ratio; yield to maturity, not yield to worst | calculation RV4; Refinancing & LME (CP-3C) |
| RV14 | 2027 subordinated notes approximate yield | (5.50 + 0.4906 / 3.125) / ((100 + 99.5094) / 2) = 5.657 / 99.7547 | 0.0567 (5.67%) | 2024-09-30, ratio | calculation RV1; Refinancing & LME (CP-3C) |
| RV15 | 2028 secured notes approximate yield | (6.75 − 2.8571 / 3.875) / ((100 + 102.8571) / 2) = 6.0127 / 101.42855 | 0.0593 (5.93%) | 2024-09-30, ratio; yield to maturity, not yield to worst | calculation RV2; Refinancing & LME (CP-3C) |
| RV16 | January 2029 subordinated less March 2029 secured yield | 0.054933 − 0.055801 | -0.000868 (-9 bp; subordinated yield 9 bp below secured) | 2024-09-30, ratio | calculation RV11; calculation RV13 |
| RV17 | May 2029 subordinated less March 2029 secured yield | 0.055634 − 0.055801 | -0.000167 (-2 bp; subordinated yield 2 bp below secured) | 2024-09-30, ratio | calculation RV12; calculation RV13 |
| RV18 | 2027 subordinated less 2028 secured yield | 0.056709 − 0.059280 | -0.002571 (-26 bp; subordinated yield 26 bp below secured, one year shorter maturity) | 2024-09-30, ratio | calculation RV14; calculation RV15 |
| RV19 | Claims in the recovery waterfall | 486 + 19534 + 4581 + 279 | 24880 (equals total debt at carrying value) | 2024-09-30, USD million | Financial foundation (CP-1) |
| RV20 | Secured layer share of debt | 19534 / 24880 | 0.7851 (78.51%) | 2024-09-30, ratio | Financial foundation (CP-1) |
| RV21 | Secured claims ahead of subordinated notes if indicative capacity is used | 19534 + 3244 | 22778 | 2024-09-30 pro forma, USD million | Financial foundation (CP-1); Legal & covenants (CP-4) |

Figures taken unchanged from earlier analyses (for example net leverage 6.02x pro forma for the 2024-10-18 dividend payment and 4.88x at year end, net debt USD 22,967 million pro forma and USD 18,619 million at year end, liquidity USD 2,919 million, secured capacity USD 3,244 million, displayed quote widths of 0.13 to 0.37 points of par) are cited in the tables to their source analysis and are not recalculated here. Fair values are rounded to USD 1 million in the annual report, which limits the yield approximation to roughly one basis point of input precision before the approximation error itself.

## Gaps

| Gap | Why it matters | Conclusion affected | Severity |
|---|---|---|---|
| Redemption schedules for all notes are not disclosed in the annual report | Yield to worst on the above-par secured notes is unknown | Subordinated-note Avoid is provisional; secured-note upside unmeasured | Material |
| No usable peer, no maintained sector loan workbook and no verified loan quotes | Absolute compensation cannot be benchmarked | Relative value Unclear for every instrument; nothing can be Preferred | Material |
| Loan quotes in the run settings carry an assigned date and conflict with Tranche K, L, M and N terms | Term-loan market levels cannot be used | Term-loan RV relies on agent fair value only | Minor |
| No enterprise value or restructuring scenario | Recovery percentages and fulcrum cannot be computed | Preference rests on rank and price, not recovery | Minor |
| Executed credit agreement, indentures and intercreditor agreement not supplied | Secured capacity, release and priming terms are indicative | Dilution argument against the subordinated notes is sized on summaries | Minor |
| No mandate, holdings, concentration or trading-depth data | Sizing and exit cannot be tested | Generic posture only; no numeric size | Minor |
| Agency ratings unverified | Rating-bucket eligibility untestable | Portfolio eligibility only | Minor |
| Use restriction | These results compare instruments within TransDigm's own structure and state a generic portfolio posture; they are not a trade instruction, a valuation or a numeric position size | All conclusions | Minor |

## Next module

The orchestrator selects the next module.
