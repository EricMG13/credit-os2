---
issuer_id: tdg
module_id: CP-3
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
committee_status: Requires More Work
execution_mode: Capital-Structure RV
artifact_name: tdg_CP-3_20240930.md
---

## Request

Assess relative value, security selection and portfolio fit for TransDigm Group Incorporated as of 2024-09-30 on the deep credit assessment pathway. Scope includes all identified term loans, secured and subordinated notes, comparative compensation, structural protection and recovery sensitivity; implementation is conditional on market and portfolio evidence.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG market quotes 2024-09-30.md | Hand-transcribed aerospace leveraged-loan relative-value sheet attributed to Bloomberg; observation date assigned for testing | not stated | fc1e0d6fe55bf91fa3ac3ef6f7791e5c04f8f9089d5cdf079177b9c7f88f7aea | Descriptive loan levels, separate facility observations, peers, index context and identity conflicts; not authenticated cutoff pricing |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Directly reviewed loan and note terms and debt fair values; financial and structural evidence also inherited from accepted analyses |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 | 2025-02-04 | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Inherited subsequent distribution evidence and retained definition conflicts only; not blended into year-end debt |

Every supplied analysis is identified below. Their accepted identity is TransDigm Group Incorporated, with an assessment date of 2024-09-30; later events retain their separate dates.

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source perimeter; earlier absence-of-prices statement qualified by the additional transcription |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Financial metrics, carrying debt, principal, instrument balances, pro forma adjustment and definition conflicts |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Franchise, distributions, secured substitution and policy incentives |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | No usable financial peer valuation or implied enterprise value; no recovery valuation imported |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported earnings and recurring-cost assessment; not contractual EBITDA |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Fundamental synthesis and earnings-to-interest downside transmission |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Summary-authority ranking, guarantees, payment blockage and enforcement limitations; indicative capacity not adopted as executable |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Adequate near-term liquidity; annual bridge and access conditions |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Conditional growth, coverage and distribution-retention sensitivities; not valuation |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Facility labels are secondary; no verified issuer rating or agency trigger |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Historical inference blocked; descriptive observations do not authenticate market compensation |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Ordinary refinancing most credible; junior dilution distinct from demonstrated coercion |
| Recovery & fulcrum (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Restructuring not applicable; no reorganised value, fulcrum or class recovery assigned |

## Findings

### Bottom line

TransDigm's securities require more work before investment selection: secured debt has the better documented priority, but available compensation evidence does not justify a preferred instrument, a cheapness label or capital deployment. Relative value is Unclear across the structure; the decision label is Requires More Work.
Basis: Legal & covenants (CP-4); Market-implied risk (CP-3D); TDG market quotes 2024-09-30.md, page 1

The distinction is protection versus price. Cash generation supports debt service, yet debt-funded distributions enlarge the senior claim pool rather than ensure deleveraging. Reported net leverage of 4.88x becomes 6.02x pro forma for the dividend paid on 2024-10-18; supported-earnings pro forma leverage is 5.93x. That makes junior protection particularly sensitive to future secured issuance, without proving that subordinated notes are unattractive at an unknown spread.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); Business & governance (CP-1A)

### Key findings

- **Priority supports investigating secured exposure first, not assigning it Preferred.** Term loans and secured notes share senior payment ranking, while subordinated notes sit below USD 19,534 million of secured carrying debt. Additional equal-ranking secured borrowing would dilute senior recoveries and consume junior residual value; it does not demonstrate a superpriority transaction. Enforcement control and recoverable collateral value remain unestablished.
Basis: Financial foundation (CP-1); Legal & covenants (CP-4); Refinancing & LME (CP-3C)

- **The apparent loan concession is descriptive, not an investment opportunity.** Tranche J's transcribed three-year discount margin is 247 bp, versus 193 bp and 196 bp for distinct StandardAero facilities. The differences of 54 bp and 51 bp cannot establish cheapness without matched legal protection, credit fundamentals, currency and authenticated observation provenance. Different facilities are not duplicate observations merely because the borrower and maturity agree.
Basis: TDG market quotes 2024-09-30.md, page 1; calculation RV1; calculation RV2

- **Fundamentals support a monitoring candidate rather than a distressed trade.** FY2024 free cash flow was USD 1,880 million, and Liquidity finds scheduled near-term uses covered. The first operational deterioration would be weaker aftermarket earnings as cash interest rises; forecast downside coverage falls to 2.16x in FY2025 despite positive free cash flow. Market access could weaken before cash exhaustion, exposing the earliest subordinated refinancing before the later secured maturities.
Basis: Financial foundation (CP-1); Liquidity (CP-2D); Forward credit model (CP-2G); Refinancing & LME (CP-3C)

- **Portfolio permission is separate from issuer quality.** No portfolio identity, holdings, mandate, concentration capacity, loss budget or executable exit depth is established. Neither a starter position nor core sizing follows from the business's cash generation; implementation posture remains Requires More Work.

### Contrary evidence and what would change the view

The strongest constructive evidence is the annual report's market-based debt fair values, supported by completed ordinary refinancing and positive cash generation. Its note valuations are based on quoted market prices and do not suggest broad principal distress. Those facts argue against Avoid merely because leverage is high. They do not establish yield to worst, call-adjusted compensation or a secured-versus-subordinated switch. Reconciled facility identity and comparable pricing could establish an attractive secured instrument; alternatively, sufficient junior spread compensation with supported recovery could overcome the structural disadvantage of subordinated notes. Retained cash and earnings growth would improve both cases, whereas another secured-funded distribution during earnings deterioration would weaken them.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174; Refinancing & LME (CP-3C); Forward credit model (CP-2G)

### Limitations

- A displayed loan advantage cannot become a trade conclusion while its facility mapping and market-evidence basis remain unresolved; the restriction applies to selection and curve ranking, not to the underlying fundamental assessment.
- No valuation case supports numerical loss protection for the secured layer, so its better payment priority cannot be translated into a recovery percentage or sufficient downside compensation.
- Summary ranking alone cannot discriminate recovery control between term lenders and secured noteholders; the instrument preference remains conditional rather than treating nominally equal payment rank as identical enforcement rights.
- Absent portfolio capacity and exit evidence prevents choosing between initiation, maintaining an existing holding or reduction; generic monitoring logic is not an executable allocation.
- No governing factor weights are specified, so qualitative factor scores cannot produce a composite or credit tier. This does not independently prevent descriptive comparisons.
- Later-filed accounts support a retrospective credit assessment, not a reconstruction of what every investor knew at the cutoff; no historical trading recommendation is asserted.

### Relative value

Relative value is Unclear for every year-end loan and note. Tranche J is the closest descriptive loan anchor because its stated margin and maturity agree with the annual report, but its identifier mapping and size discrepancy still require resolution. Tranche K's conflicting economics, Tranche L's conflicting maturity day, and the absence of year-end matches for the quoted M and N facilities prevent an issuer-curve ranking. A missing Tranche I quote is not evidence that it is illiquid or expensive. Note fair values inform the absence of broad distress but cannot replace comparable yield or spread observations. No hard-risk score override is used to manufacture a ranking.
Basis: TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 172–174

### Portfolio Fit

TransDigm is a monitoring candidate for a strategy able to bear aerospace earnings risk and repeat releveraging. Secured exposure could serve a defensive-priority role only if compensation, collateral access and exit feasibility are established; subordinated exposure would require an explicit loss budget for residual-value sensitivity. Neither role is assigned as a mandate fit. All securities remain Requires More Work for implementation, with no numerical size, assumed existing holding, automatic hold instruction or scaling assumption. Review should respond to a new debt-funded distribution, earnings deterioration, a priority-changing amendment or verified changes in executable liquidity.
Basis: Fundamental credit (CP-2); Legal & covenants (CP-4); Refinancing & LME (CP-3C)

### Events: Instruments

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: no additional unique instrument event | Not supplied: no additional unique instrument event | Not supplied: no additional unique instrument event | Not supplied: financing history and contractual maturities are already recorded in Business & governance, Liquidity and Legal & covenants | Not supplied: no additional unique instrument event | Not supplied: no additional unique instrument event | Not supplied: no additional unique instrument event to duplicate |

### Recovery waterfall

| Line | Amount | Low | Base | High | Currency | Scale |
|---|---|---|---|---|---|---|
| Enterprise value | Not supplied: no supported enterprise valuation | Not supplied: no supported enterprise valuation | Not supplied: no supported enterprise valuation | Not supplied: no supported enterprise valuation | Not supplied: no supported enterprise valuation | Not supplied: no supported enterprise valuation |
| EV multiple | — | Not supplied: peer multiple absent | Not supplied: peer multiple absent | Not supplied: peer multiple absent | — | x |
| EV metric | 3813 | — | — | — | USD | million |
| EV basis | FY2024 reported EBITDA from Financial foundation; CP-1C T4.10 EV/EBITDA supplies no Low, Median or High implied EV; no alternative supported multiple adopted | Not supplied: no implied EV | Not supplied: no implied EV | Not supplied: no implied EV | — | — |
| Cost: enforcement and administration | Not supplied: no supported cost estimate | Not calculable: EV and cost absent | Not calculable: EV and cost absent | Not calculable: EV and cost absent | USD | million |
| Claim: term loans I/J/K/L and secured notes due 2028/2029/2030/2031/2032/2033, shared senior payment rank | 19534 | Not calculable: EV and enforceable collateral allocation absent | Not calculable: EV and enforceable collateral allocation absent | Not calculable: EV and enforceable collateral allocation absent | USD | million |
| Claim: senior subordinated notes due November 2027, January 2029 and May 2029 | 4581 | Not calculable: senior allocation and EV absent | Not calculable: senior allocation and EV absent | Not calculable: senior allocation and EV absent | USD | million |
| Claim: securitization, separate receivables pool; not ordered in shared-pool allocation | 486 | Not calculable: receivables allocation absent | Not calculable: receivables allocation absent | Not calculable: receivables allocation absent | USD | million |
| Claim: finance leases and government advances, relative priority unestablished | 279 | Not calculable: priority and asset allocation absent | Not calculable: priority and asset allocation absent | Not calculable: priority and asset allocation absent | USD | million |
| Fulcrum | Not supplied: no value allocation | Not supplied: no value allocation | Not supplied: no value allocation | Not supplied: no value allocation | — | — |
| Residual to equity | Not calculable: EV absent | Not calculable: EV absent | Not calculable: EV absent | Not calculable: EV absent | USD | million |

The table preserves carrying-value debt, not allowed insolvency claims. Equal payment rank is grouped without asserting equal lien enforcement rights. Receivables and unclassified obligations are disclosed separately rather than silently placed above or below the common secured pool. No numerical recovery ranking, equity residual or default probability is produced. The absence of an activated restructuring case does not imply full recovery in an ordinary credit downside.
Basis: Financial foundation (CP-1); Legal & covenants (CP-4); Peer benchmark (CP-1C); Recovery & fulcrum (CP-4C)

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 8 |
| Calculated | 6 |
| Assumption-Based | 0 |
| Analyst Inference | 7 |
| Weak Lineage | 1 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 5 |
| Fields present | 87 |
| Fields total | 87 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 2 |

### Analytical appendix — complete canonical registers

### T3.3 Issuer and security scorecard

Scores are unweighted analyst assessments, with lower scores indicating less creditor risk. They are not ratings. Composite and credit tier are Not Scorable because no weighting framework is supplied; there is no revised composite and no hard-risk override is applied.

| Category | Factor | Weight | Raw Score 1–5 | Weighted Score | Confidence | Evidence | Risk Mechanic | Credit Implication | Source |
|---|---|---|---|---|---|---|---|---|---|
| Fundamental | F1 Business durability | Not supplied: no governing weights | 2 | Not Scorable: weights absent | Medium | Proprietary products about 90% and aftermarket about 55% of FY2024 sales; reported EBITDA margin 48.02% | Certification and repeat replacement demand support pricing; channel cyclicality remains | Supports debt service through moderate weakness, not a sector-relative ranking | Business & governance (CP-1A); Fundamental credit (CP-2) |
| Fundamental | F2 Leverage and earnings definition | Not supplied: no governing weights | 4 | Not Scorable: weights absent | Medium | Gross reported leverage 6.53x; year-end net 4.88x and pro forma 6.02x after 2024-10-18; supported-earnings pro forma 5.93x | Distribution cash removes apparent net-debt protection; recurring costs constrain earnings denominator | Underwrite without automatic deleveraging or inferred covenant headroom | Financial foundation (CP-1); Earnings quality (CP-1D) |
| Fundamental | F3 Cash conversion | Not supplied: no governing weights | 2 | Not Scorable: weights absent | Medium | FY2024 FCF USD 1,880 million; cash interest cover 3.29x | Light capex converts earnings into debt-service cash; interest step-up reduces surplus | Cash generation argues against distress but not for junior compensation adequacy | Financial foundation (CP-1); Fundamental credit (CP-2) |
| Fundamental | F4 Financial policy | Not supplied: no governing weights | 5 | Not Scorable: weights absent | High | USD 6,368 million declared distributions; USD 3,000 million September secured borrowing; debt prepayment last in cash allocation | New claims can grow without additional operating value | Higher dilution exposure, especially for subordinated claims | Business & governance (CP-1A) |
| Fundamental | F5 Liquidity and refinancing | Not supplied: no governing weights | 3 | Not Scorable: weights absent | Medium | Issuer pro forma liquidity USD 2,919 million; ordinary refinancing most credible; FY2028 principal wall USD 6,637 million | Immediate cash support coexists with later market dependence | Monitor cash retention and early takeout, not merely final maturity | Liquidity (CP-2D); Refinancing & LME (CP-3C) |
| Legal / recovery | F6 Structural protection | Not supplied: no governing weights | Not Scorable: enforceable control and recovery valuation incomplete | Not Scorable: weights and factor evidence absent | Structural Only | Secured carrying debt USD 19,534 million; subordinated USD 4,581 million; junior payment blockage; non-guarantor value outside direct recourse | Larger senior pool reduces junior residual access; releases and control matter within senior layer | Qualitative secured-first investigation; no loss percentages or within-senior preference | Financial foundation (CP-1); Legal & covenants (CP-4) |
| Market / technicals | F7 Compensation and exit | Not supplied: no governing weights | Not Scorable: investment-quality comparison absent | Not Scorable: weights and market basis absent | Low | Loan transcription, incomplete identity match, no verified execution depth or bond spreads | An apparent DM concession may reflect identity, optionality, legal or liquidity differences | RV Unclear; Requires More Work, not Preferred or Avoid | TDG market quotes 2024-09-30.md, page 1; Market-implied risk (CP-3D) |

### T3.6 Fundamental value matrix

All note amounts are carrying values; loan principal is a separately labelled identity check, never substituted for allocated carrying debt. All securities have Requires More Work selection status. Secured and subordinated classes are not pooled for spread comparison.

| Security / Issuer | Fundamental View | Relative-Value View | Structural / Recovery View | Final Matrix Bucket | Rationale | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| TransDigm Inc. Tranche I, USD, 2028-08-24 | Cash generation supportive; leverage/policy constrain | Unclear; quote not supplied | Senior secured; recovery unquantified | Requires More Work | Principal USD 1,871 million; SOFR +275 bp; do not infer missing price from J | F1–F7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| TransDigm Inc. Tranche J, USD, 2031-02-28; provisional sheet BL466719 Corp | Same issuer view | Unclear; bid/ask 100.00/100.13 points; YTM 6.2%; 3Y DM 247 bp; assigned 2024-09-30 | Senior secured; not ranked above secured notes by enforcement | Requires More Work | SOFR +250 bp and maturity agree; principal USD 3,632 million versus sheet size USD 3,641 million; exact identifier mapping not established | F1–F7; RV1–RV6 | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| TransDigm Inc. Tranche K, USD, 2030-03-22; disputed sheet BL522943 Corp | Same issuer view | Unclear; sheet 99.94/100.13 points, YTM 5.9%, 3Y DM 224 bp; assigned date only | Senior secured; quote-to-claim attribution restricted | Requires More Work | Annual principal USD 1,699 million and SOFR +275 bp versus sheet size USD 3,544 million and 225 bp; no apparent-tightness ranking | F1–F7 | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| TransDigm Inc. Tranche L, USD, 2032-01-19; disputed sheet BL475283 Corp | Same issuer view | Unclear; sheet 99.88/100.13 points, YTM 6.2%, 3Y DM 250 bp; assigned date only | Senior secured; no quantified protection | Requires More Work | Principal USD 1,500 million and SOFR +250 bp agree; sheet maturity 2032-01-20 does not; prepayment terms not established | F1–F7 | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Quoted M / BL520309 Corp and N / BL555762 Corp | No year-end facility attribution | Unclear; M DM 250 bp, N DM 248 bp; assigned date only | Sheet first-lien guaranteed senior secured labels not legal mapping | Excluded from year-end selectable universe pending identity resolution | Sheet maturities 2032-08-19 / 2033-02-10; sizes USD 2,500 million / USD 800 million; no matching year-end debt established | F7 | TDG market quotes 2024-09-30.md, page 1; Financial foundation (CP-1) |
| 2028 secured notes, USD; carrying USD 2,077 million | Same issuer view | Unclear; filed fair value USD 2,160 million, not yield/spread | Senior secured; shared senior payment rank | Requires More Work | No call-adjusted or execution-quality comparison | F1–F7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| 2029 secured notes, USD; carrying USD 2,727 million | Same issuer view | Unclear; filed fair value USD 2,836 million | Senior secured; release and enforcement terms incomplete | Requires More Work | Fair value does not measure spread premium for structure or maturity | F1–F7 | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 2030 secured notes, USD; carrying USD 1,438 million | Same issuer view | Unclear; filed fair value USD 1,519 million | Senior secured; recovery unquantified | Requires More Work | Longer interest exposure cannot be priced without comparable cash-flow/yield basis | F1–F7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 2031 secured notes, USD; carrying USD 984 million | Same issuer view | Unclear; filed fair value USD 1,058 million | Senior secured; no relative control conclusion | Requires More Work | Higher nominal coupon does not establish superior total return or compensation | F1–F7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 2032 secured notes, USD; carrying USD 2,180 million | Same issuer view | Unclear; filed fair value USD 2,291 million | Senior secured; recovery unquantified | Requires More Work | Call schedule and matched-duration alternative absent | F1–F7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| 2033 secured notes, USD; carrying USD 1,486 million | Same issuer view; distribution financing persists | Unclear; filed fair value USD 1,521 million | Senior secured; long policy exposure | Requires More Work | Long maturity adds time for releverage; no observed term premium supports selection | F1–F7 | Business & governance (CP-1A); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| November 2027 subordinated notes, USD; carrying USD 2,641 million | Same issuer view; earliest term bullet | Unclear; filed fair value USD 2,637 million | Contractually junior, unsecured and exposed to non-guarantor priority; high directional EV sensitivity | Requires More Work | Earlier maturity may shorten exposure or invite secured takeout; neither compensating spread nor recovery established | F1–F7 | Refinancing & LME (CP-3C); Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| January 2029 subordinated notes, USD; carrying USD 1,194 million | Same issuer view | Unclear; filed fair value USD 1,160 million | Same junior position; residual-value sensitivity | Requires More Work | Discount to principal is not evidence of adequate LGD compensation | F1–F7 | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 172 |
| May 2029 subordinated notes, USD; carrying USD 746 million | Same issuer view | Unclear; filed fair value USD 729 million | Same junior position; residual-value sensitivity | Requires More Work | Same maturity year does not remove coupon, call and refinancing sequence differences | F1–F7 | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 173 |
| Revolver; securitization; finance leases; government advances | Relevant funding and competing claims, not quoted investment candidates | Unclear; investment market values not supplied | Separate receivables collateral; other relative priorities incomplete | No trade ranking | Facilities and asset-specific claims cannot be assumed freely purchasable; claim amounts remain in recovery table | F5–F7 | Financial foundation (CP-1); Legal & covenants (CP-4) |

### Descriptive peer and benchmark evidence

The comparisons retain the source's three-year discount-margin basis, not contractual margin or yield to worst. No loan-level average is calculated, and index observations are not individual peers. StandardAero is the nearest indicated-rating comparison, Ontic provides a guaranteed-priority comparison, and Chromalloy provides a nearby-maturity contrast. Neither common sector nor rating symbol establishes matched borrower risk.
Basis: TDG market quotes 2024-09-30.md, page 1

| Comparator and exact row identity | Terms and metric | Observation basis | J minus comparator | Interpretation and limitation | Source |
|---|---|---|---|---|---|
| StandardAero B1 / BL4793859 | 1L senior secured; Ba3/BB-; maturity 2031-10-31; YTM 5.6%; 3Y DM 193 bp | Assigned 2024-09-30; size USD 1,630 million | +54 bp | Closest indicated ratings; guarantee, covenants, reset/call basis and currency denomination not independently established | TDG market quotes 2024-09-30.md, page 1 |
| StandardAero B2 / BL4793875 | Distinct 1L facility; Ba3/BB-; maturity 2031-10-31; YTM 5.6%; 3Y DM 196 bp | Assigned 2024-09-30; size USD 620 million | +51 bp | Retain separately, not duplicate B1; no pooled average or cheapness conclusion | TDG market quotes 2024-09-30.md, page 1 |
| Ontic B / BL5177714 | 1L guaranteed senior secured; B2/B; maturity 2030-10-17; YTM 6.1%; 3Y DM 234 bp | Assigned 2024-09-30; size USD 1,558 million | +13 bp | Guaranteed rank resembles sheet J, but ratings, maturity and borrower quality differ | TDG market quotes 2024-09-30.md, page 1 |
| Chromalloy B / BL5174752 | 1L guaranteed senior secured; B2/B-; maturity 2031-03-27; YTM 6.9%; 3Y DM 320 bp | Assigned 2024-09-30; size USD 891 million | -73 bp | Close maturity but weaker indicated rating; no quality-adjusted residual | TDG market quotes 2024-09-30.md, page 1 |
| US Leveraged Loan Index Ba / I38940US | USD index; YTM 6.3%; 3Y DM 251 bp | Assigned 2024-09-30; aggregate, not a peer loan | -4 bp | Rating context only; index weighting, duration and collateral mix differ | TDG market quotes 2024-09-30.md, page 1 |
| US Leveraged Loan Index Ba/B / I38935US | USD index; YTM 7.8%; 3Y DM 416 bp | Assigned 2024-09-30; aggregate, not a peer loan | -169 bp | Mixed quality explains an unknown part of the gap; not an issuer concession | TDG market quotes 2024-09-30.md, page 1 |
| Sector Ratings Average | Not supplied: no such block in the transcription | No observation | Not calculable: aggregate absent | No substitute aggregate or additional peer count invented | TDG market quotes 2024-09-30.md, page 1 |

### T3B.1 Instrument evidence register

| source_document_id | source_document_name | source_quality | period | entity_covered | data_supplied | limitation | downstream_use | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | FY2024 annual report | Audited financials; summary legal authority | 2024-09-30; filed 2024-11-07 | Group consolidated; TransDigm Inc. borrower/issuer | All year-end loan/note terms; principal versus carrying debt; market-based debt fair values | No executed intercreditor, collateral or note documents; fair values are not executable quotes | Used here for instrument identity, protection and market-boundary assessment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60, 172–174 |
| S2 | Aerospace loan transcription | Secondary external-provider attribution, unverified | Date assigned 2024-09-30 | TransDigm shorthand and sector borrowers | Five subject observations, peers and rating-index statistics | Exact legal mapping, denomination conventions and execution status incomplete | Used here for descriptive compensation contrasts only | TDG market quotes 2024-09-30.md, page 1 |
| A1 | Financial foundation, Fundamental credit and Earnings quality | Accepted financial analysis | FY2024 and dated October pro forma | Consolidated group | Cash flow, leverage, supported earnings, debt basis | No contractual or agency denominator inferred | Used here for unweighted assessment and repayment capacity | Financial foundation (CP-1); Fundamental credit (CP-2); Earnings quality (CP-1D) |
| A2 | Legal & covenants and Refinancing & LME | Summary-authority legal and creditor-class analysis | As of 2024-09-30 | Issuer, guarantors and non-guarantor perimeter | Shared senior payment ranking, junior blockage and ordinary refinancing path | No enforceable priority-change capacity adopted | Used here for directional structural preference, not recovery percentages | Legal & covenants (CP-4); Refinancing & LME (CP-3C) |
| A3 | Peer benchmark and Recovery & fulcrum | No valuation furnished | FY2024 | No peer EV and no activated restructuring | Explicit missing EV / recovery | Neither supplies numerical loss support | Used here to withhold waterfall allocation and fulcrum | Peer benchmark (CP-1C); Recovery & fulcrum (CP-4C) |
| SE1 | Subsequent-event separation | Accepted dated financial evidence | Draw 2024-10-16; distribution 2024-10-18 | Consolidated group | USD 162.5 million securitization draw; USD 4,348 million declaration-linked payment | No new term-note replacement identified in reviewed subsequent debt comparison; October events not inserted into year-end stack | Pre-event capital structure remains analytical base; pro forma leverage separately shown | Financial foundation (CP-1); Refinancing & LME (CP-3C) |

### Inherited definition conflict register

The following register is retained unchanged from Financial foundation. Its original calculation references remain references to that analysis, not new calculations here. Indicative legal ratio capacity and any implication of contractual equivalence are not adopted as executable capacity.

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

### T3C.1 Portfolio input gate

| Input | Available / Missing | Source | Limitation | Portfolio Impact |
|---|---|---|---|---|
| Security-selection conclusion | Available: Requires More Work; RV Unclear | T3.6; T3.3 | Descriptive market comparison does not permit selection | No executable allocation |
| Issuer and security identities | Issuer available; I/J/K/L identified in filing; quoted matches partial | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; TDG market quotes 2024-09-30.md, page 1 | K/L conflict; M/N period identity absent | No unambiguous quoted target |
| Portfolio identity and mandate | Missing: no matching mandate or constraint reference supplied | Run settings | Eligibility, permitted strategy and limits not established | Generic fit only |
| Holdings and exposure | Missing: no holdings report | Run settings | No existing-position assumption | Cannot prescribe hold, trim or pro forma capacity |
| Concentration and correlation | Missing: no portfolio exposures or limits | Run settings | No common-factor capacity test | No numerical size |
| Trading and implementation | Missing: executable size, settlement constraints and depth not supplied | TDG market quotes 2024-09-30.md, page 1 | Displayed width is not liquidation capacity | No starter or core posture |
| Downside and legal inputs | Available directionally | Forward credit model (CP-2G); Legal & covenants (CP-4); Refinancing & LME (CP-3C) | Recovery and legal control unquantified | No monetary loss budget test |

### T3C.2 Portfolio fit register

| Name / Instrument | Fit Category | Evidence | Risk Mechanic | Why It Fits / Does Not Fit | Constraints / Notes | Source Trace |
|---|---|---|---|---|---|---|
| TransDigm Inc. I/J/K/L and secured notes | Not assessable | Cash generation supports debt service; senior payment ranking documented; no portfolio mandate | Better nominal priority does not remove dilution, price or exit risk | Monitoring candidate; defensive-priority role conditional, not assigned | RV, mandate, recovery and execution gates unresolved | F1–F7; T3.6; T3C.1 |
| November 2027 and January/May 2029 subordinated notes | Not assessable | Junior payment rank, unsecured claims and earliest refinancing exposure | Losses can arise from senior layering before borrower cash exhaustion | Recovery-sensitive role would need explicit loss capacity and compensating spread | No cheapness or Avoid label inferred from rank alone | F2/F4/F6/F7; T3.6; Legal & covenants (CP-4) |
| Quoted M and N | Not assessable | No year-end legal-facility match established | Wrong-period attribution could create an ineligible or nonexistent target | Not selectable in the year-end universe pending identity reconciliation | Not a judgement on actual later facilities | TDG market quotes 2024-09-30.md, page 1; Financial foundation (CP-1) |

### T3C.3 Position sizing posture

| Name / Instrument | Sizing Posture | Evidence | Reason | Key Risk | Implementation Note | Confidence | Source Trace |
|---|---|---|---|---|---|---|---|
| All identified year-end loans and notes | Requires More Work | No mandate, holdings, capacity, loss budget or executable depth | A credit-quality assessment is not permission to allocate | Unmeasured portfolio loss and exit cost | No numerical size; no starter/core or existing-holding instruction | Not supplied: no sizing conclusion supported | T3C.1; T3C.5; T3C.6 |

### T3C.4 Risk budget flags

| Flag | Evidence | Risk Mechanic | Why It Matters | Caution Level | Portfolio Impact | Source Trace |
|---|---|---|---|---|---|---|
| RB1 Releveraging / aerospace common factor | Distribution financing and commercial-demand sensitivity | Demand shock and policy borrowing can coincide | Correlated aerospace holdings could lose together | High | Aggregate group and sector exposure before allocation; capacity unestablished | Business & governance (CP-1A); Fundamental credit (CP-2) |
| RB2 Priority and recovery | Shared senior claims; unsecured subordinated residual | More senior debt reduces junior value; collateral leakage can affect all | Yield alone cannot establish acceptable loss | High | Distinct senior and junior risk budgets required; neither quantified | Legal & covenants (CP-4) |
| RB3 Exit feasibility | No trades, executable size or dealer depth | Stress selling can add loss independently of default | Displayed bids do not establish scalable exit | Not Assessable | No starter/core posture or liquidity-capacity claim | TDG market quotes 2024-09-30.md, page 1 |
| RB4 Mandate / concentration | No holdings, eligibility or limits | A suitable security can still breach a mandate | Cannot distinguish available capacity from an existing breach | Not Assessable | No numerical size or compliance conclusion | T3C.1 |
| RB5 Refinancing and coverage | FY2025 forecast downside cover 2.16x; FY2028 wall USD 6,637 million | Coverage weakens before refinancing concentration arrives | Price impairment can precede a cash shortfall | Medium | Retain separate earnings, maturity and refinancing monitoring | Forward credit model (CP-2G); Financial foundation (CP-1) |

### T3C.5 Concentration and correlation

| Exposure Dimension | Current Exposure | Proposed / Pro Forma Exposure | Limit / Capacity | Evidence Status | Risk Mechanic | Portfolio Implication | Source Trace |
|---|---|---|---|---|---|---|---|
| Issuer / group | Not supplied: holdings absent | Not calculable: proposed size absent | Not supplied: issuer cap absent | Not Provided | Loans and notes share a borrower risk | Aggregate issuer exposure before allocation | T3C.1 |
| Sector / subsector | Not supplied: sector holdings absent | Not calculable: proposed size absent | Not supplied: sector cap absent | Not Provided | Aerospace demand affects multiple borrowers | No diversification credit | Fundamental credit (CP-2); T3C.1 |
| Sponsor / ownership | Not supplied: ownership-factor holdings absent | Not calculable: exposures absent | Not supplied: limit absent | Not Provided | Common control or policy may correlate losses; no sponsor backstop assumed | No sponsor diversification or support credit | Business & governance (CP-1A); T3C.1 |
| Rating bucket | Not supplied: bucket holdings absent | Not calculable: holdings and verified issue ratings absent | Not supplied: rating limits absent | Not Provided | Rating migration can force sales | No eligibility or bucket-capacity conclusion | Ratings & triggers (CP-2H); T3C.1 |
| Maturity year / wall | Not supplied: portfolio maturity profile absent | Not calculable: proposed size absent | Not supplied: maturity cap absent | Not Provided | Refinancing windows may cluster | No portfolio maturity capacity inferred from issuer runway | Refinancing & LME (CP-3C); T3C.1 |
| Capital-structure layer | Not supplied: senior/junior holdings absent | Not calculable: proposed allocation absent | Not supplied: layer limits absent | Not Provided | Secured and subordinated holdings are correlated, not independent diversification | No double counting of risk capacity | Legal & covenants (CP-4); T3C.1 |
| Correlated holdings / common factor | Not supplied: holdings and factor data absent | Not calculable: portfolio absent | Not supplied: correlation budget absent | Not Provided | Demand, rates and risk appetite may jointly affect peers | No correlation adjustment or numerical diversification benefit | Fundamental credit (CP-2); T3C.1 |

### T3C.6 Liquidity and implementation

| Liquidity / Implementation Factor | Evidence | Risk Mechanic | Implementation Consequence | Constraint / Action | Source Trace |
|---|---|---|---|---|---|
| Trading depth / bid-ask / dealer colour | Transcribed two-sided prices; no executable size or transactions | Displayed width need not survive size or stress | Exit risk not established | Obtain execution-quality evidence before allocating | TDG market quotes 2024-09-30.md, page 1 |
| Settlement / minimum size / operations | Not supplied: assignments, minimum denominations and settlement terms | Operational restrictions can prevent intended entry or exit | Investability not established | Confirm legal identity and settlement eligibility | T3C.1 |
| Exit route in stress | Not supplied: stress bids, dealer capacity and ownership concentration | Forced selling may deepen mark-to-market loss | No calibrated liquidation horizon | Do not assume rapid cash conversion or no price impact | Market-implied risk (CP-3D) |
| Ability to add / trim | No authenticated price, size, mandate or current holding | A paper comparison cannot determine executable turnover | Add/trim quantities withheld | Monitor; no automatic action before evidence supports it | T3C.1; T3.6 |

### T3C.7 Downside budget and recovery sensitivity

| Downside Scenario / Driver | Input Basis | Formula / Method | Result / Directional View | Portfolio Loss / Risk-Budget Implication | Status | Source Trace |
|---|---|---|---|---|---|---|
| Price downside | No matched duration, authenticated starting spread or calibrated shock | Monetary loss would require position value and validated price change | Not calculable: no defensible price shock | No position-level loss, stop or price target | Not Calculable | Market-implied risk (CP-3D); T3C.1 |
| Recovery / LGD | Senior and junior balances known; no supported EV, costs or asset allocation | Priority waterfall only after value and reachable pools established | Junior residual more EV-sensitive; numerical recovery absent | No expected loss or recovery-based risk budget | Directional Only | Recovery waterfall; Legal & covenants (CP-4) |
| Refinancing / maturity-wall downside | Annual forecast downside retains positive cash flow but coverage weakens | Earnings shortfall reduces cash protection; impaired access raises takeout cost | Coverage pressure first, market dependence later | Maturity concentration can correlate with forced selling; monetary budget not calculable | Directional Only | Forward credit model (CP-2G); Refinancing & LME (CP-3C) |
| Legal / priming / leakage | Ordinary secured layering demonstrated; selective-priority permissions unestablished | Added senior claims or lost collateral reduce value per existing claim | Junior exposure increases; senior dilution also possible | Cannot assign probability or loss size to a hypothetical uptier | Directional Only | Legal & covenants (CP-4); Refinancing & LME (CP-3C) |

### T3C.8 Monitoring and implementation triggers

| Trigger ID | Indicator | Leading / Lagging | Threshold or Qualitative Signal | Linked Risk Flag | Portfolio Action | Source Trace | Limitation |
|---|---|---|---|---|---|---|---|
| MON1 | Distribution plus borrowing | Leading | New secured-funded special dividend while earnings weaken | RB1; RB2 | Escalate protection and compensation review; no automatic trim without holdings | Business & governance (CP-1A); Legal & covenants (CP-4) | No calibrated spread or size threshold |
| MON2 | Earnings and interest | Lagging | Declining EBITDA with rising cash interest or negative recurring FCF | RB5 | Escalate; reassess ability to refinance before assuming liquidity exhaustion | Fundamental credit (CP-2); Forward credit model (CP-2G) | Forecast stress is not a covenant or agency trigger |
| MON3 | Priority / guarantee change | Leading | Published selective-priority offer, guarantor release or asset-transfer amendment | RB2 | Escalate claim-specific legal and loss assessment before adding | Legal & covenants (CP-4); Refinancing & LME (CP-3C) | No transaction likelihood inferred |
| MON4 | Executable liquidity | Leading | Verified withdrawal of two-sided size or deteriorating exit terms | RB3 | Escalate implementation review; any reduction conditional on actual holdings | Market-implied risk (CP-3D) | No numerical liquidity trigger calibrated |
| MON5 | Completed selection evidence | Leading | Exact facility match, comparable market basis, supported recovery sensitivity and mandate capacity | RB3; RB4 | Review whether initiation can be supported; not an automatic Add | T3.6; T3C.1 | A single improved quote cannot clear all investment conditions |

### T3C.9 Portfolio gaps ledger

| Gap ID | Missing Data | Why It Matters | Affected Sizing / Risk Budget / Trigger | Consequence for Confidence | Required Follow-Up Source |
|---|---|---|---|---|---|
| PG1 | Matching portfolio identity, mandate and limits | Defines eligible instruments and strategy | All sizing and fit | High impact; no allocation conclusion | Portfolio-specific mandate and constraint table at matching date and basis |
| PG2 | Holdings and proposed allocation | Determines current and pro forma exposure | Group, sector, rating, maturity and layer capacity | High impact; no hold/trim or numerical size | Holdings, NAV, proposed amount and concentration report |
| PG3 | Executable liquidity and settlement terms | Determines feasible entry and stressed exit | Starter/core and turnover | High impact; no scalable implementation | Dealer size, trades, settlement and denomination evidence |
| PG4 | Loss budget, correlation and recovery inputs | Converts downside into acceptable portfolio loss | Monetary downside budget | High impact; no expected loss or position stress | Portfolio risk report, supported EV/cost/pool inputs and position exposure |

### Final security-selection synthesis

Every identified year-end loan and note is Requires More Work because cash generation and maturity runway support debt service, while relative value remains Unclear and legal control, recovery protection and execution are incompletely evidenced. The main upside to debt is cash retention and earnings growth improving refinancing flexibility. The main downside is weaker earnings followed by continued distributions and additional secured borrowing, leaving less protection when refinancing must be executed. Monitoring should focus on that combination rather than a standalone leverage number. No security is Preferred, Secondary or Avoid on the supplied compensation evidence; no forced rank or precise composite is assigned. Security selection and portfolio fit are completed with limitations, with investment implementation withheld.
Basis: Fundamental credit (CP-2); Financial foundation (CP-1); Legal & covenants (CP-4); Forward credit model (CP-2G); Refinancing & LME (CP-3C); TDG market quotes 2024-09-30.md, page 1

## Calculations

Only the descriptive spread differences below are newly calculated. They compare transcribed source observations on a common reported three-year discount-margin label, not a validated common currency, legal or execution basis. All other financial figures are retained unchanged from the named analyses; no pro forma figure is independently rebuilt.

| ID | Calculation | Exact inputs | Result | Period, currency and quantity | Source |
|---|---|---|---|---|---|
| RV1 | J less StandardAero B1 three-year DM | 247 - 193 | +54 bp | Assigned 2024-09-30; sheet USD reporting sizes, loan denominations independently unverified | TDG market quotes 2024-09-30.md, page 1 |
| RV2 | J less StandardAero B2 three-year DM | 247 - 196 | +51 bp | Same assigned observation basis; separate B2 facility | TDG market quotes 2024-09-30.md, page 1 |
| RV3 | J less Ontic three-year DM | 247 - 234 | +13 bp | Same assigned basis; different indicated credit quality and maturity | TDG market quotes 2024-09-30.md, page 1 |
| RV4 | J less Chromalloy three-year DM | 247 - 320 | -73 bp | Same assigned basis; different indicated credit quality | TDG market quotes 2024-09-30.md, page 1 |
| RV5 | J less Ba loan-index three-year DM | 247 - 251 | -4 bp | Same assigned basis; USD index aggregate, not loan peer | TDG market quotes 2024-09-30.md, page 1 |
| RV6 | J less Ba/B loan-index three-year DM | 247 - 416 | -169 bp | Same assigned basis; mixed-quality USD index aggregate | TDG market quotes 2024-09-30.md, page 1 |
| CV1 | Required field count including source gate | 9 + 7 + 8 + 5 + 7 + 8 + 7 + 8 + 6 + 7 + 8 + 6 + 1 | 87 fields | Retained register schemas plus source gate; additional explanatory columns excluded | Selected method and retained registers |

Field presence counts documented fields, including explicitly missing evidence, not proof that investment conditions are satisfied. Material unresolved issues are market comparability and identity, legal/recovery loss protection, and portfolio implementation inputs; the missing weighting framework and retrospective disclosure chronology are additional restrictions. No composite, normalized score, recovery or sizing arithmetic is performed.

## Gaps

| Gap or restriction | Effect on security selection | Severity | Evidence needed |
|---|---|---|---|
| Maintained Sector RV workbook is not among the readable sources; only a hand transcription is supplied, with no Sector Ratings Average block | Its maintained-current loan basis cannot be established here; descriptive rows and indices are used without substituting them for the required workbook | Material | Readable maintained enterprise workbook with facility rows and benchmark regions |
| Assigned quote date, incomplete identity mapping, K economics, L maturity and unmatched M/N period identity | Prevents turning descriptive differences into cheap/fair/rich labels, selectable curve points or a historical trade | Material | Facility identifiers tied to legal terms and source observations applicable to the investment date |
| No bond yields/spreads, call schedules, matched loan denominations, quote status or execution depth | No loan-versus-bond, term-premium, yield-to-worst or executable compensation ranking | Material | Comparable instrument observations, quotation conventions, calls and executable size |
| No supported EV or multiple, costs, entity/pool valuation or enforceable control allocation | Recovery percentages, fulcrum and loss-based compensation cannot be calculated; better nominal priority is not proof of full repayment | Material | Supported valuation cases and collateral/claim allocation with costs and legal priorities |
| No portfolio mandate, positions, concentration, correlation, loss budget or settlement evidence | No numerical size, starter/core posture, compliance finding or existing-holding action | Material | Portfolio-specific inputs on matching identity, basis and date |
| No governing factor weights | Composite and credit tier remain Not Scorable; descriptive RV work is independent | Minor | Explicit mandate or scoring framework if a numerical composite is required |
| Earnings quality includes an ambiguous isolated stock-compensation sensitivity | That isolated sensitivity is not adopted; only its supported EBITDA level and labelled leverage measures are retained | Minor | Consistent component-level leverage sensitivity if needed for a future decision |
| Forecast retention and funding assumptions differ from the annual liquidity bridge | Annual growth/retention cases are conditional; no single projected cash balance is treated as guaranteed security protection | Use restriction | Actual cash retention, new distribution decisions and refinancing terms |
| Financial foundation's dividend conflict and carrying/principal divergence are retained verbatim | Cash pro forma uses the declaration-linked annual-report amount; no silent claim uplift from carrying to principal | Minor | Payment-level reconciliation and claim-specific principal/cost allocation if a loss calculation is undertaken |
| Separate ordinary recovery and detailed control assessments were not supplied | Summary priority is usable, but no independent recovery model or within-secured control advantage is assumed | Use restriction | Entity valuation and enforceable intercreditor control evidence |
| Conclusion boundary | This is a retrospective, conditional selection assessment, not a rating, legal opinion, default probability, executable trade, recovery estimate or mandate-specific allocation | Scope boundary | Decision-specific evidence before implementation |

## Next module

The orchestrator selects the next module.
