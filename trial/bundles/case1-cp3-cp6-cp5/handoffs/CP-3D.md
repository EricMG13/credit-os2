---
issuer_id: tdg
module_id: CP-3D
analysis_date: 2024-09-30
pathway: deep_credit_assessment
owned_object: market_implied_risk_map
module_status: Blocked
committee_status: Blocked
artifact_name: tdg_CP-3D_20240930.md
---

## Request

Assess market-implied credit risk and trading technicals for TransDigm Group Incorporated as of 2024-09-30 on the deep_credit_assessment pathway. Scope includes supplied loan observations, identity reconciliation, curve and comparator differences, liquidity evidence and the boundary between descriptive pricing and investable market inference.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG market quotes 2024-09-30.md | Hand-transcribed aerospace leveraged-loan relative-value sheet attributed to Bloomberg, with a date assigned for testing | not stated | fc1e0d6fe55bf91fa3ac3ef6f7791e5c04f8f9089d5cdf079177b9c7f88f7aea | Source-reported bid, ask, YTM, three-year discount margin, changes, sizes, peer and index observations; not verified historical pricing |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Year-end loan terms, September issuance, financial policy and separately dated October distribution and pro forma liquidity |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source authority and scope; its absence-of-market-data statement is qualified by the additional transcription |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Secondary-rating and facility-identity limitations; conditional forecast pressure, not verified agency thresholds |

## Findings

### Bottom line

Not assessable: verified contemporaneous market observations are absent; the only quote sheet assigns its date for testing, so creditors cannot establish what TransDigm debt actually priced at the cutoff or whether a market dislocation existed. Several facility descriptions also conflict with year-end loan terms. The calculations below describe supplied entries, not validated historical market signals.
Basis: TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59

The strongest contrary indication is the sheet's near-par loan pricing, which would suggest limited immediate distress if authenticated. That does not resolve financial-policy risk: the annual report records secured financing alongside a special-dividend declaration. Dated original observations, reconciled facility identifiers and documented pricing conventions would permit a genuine comparison; until then neither complacency nor overpricing of credit risk is established.
Basis: TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56

### Market against fundamentals

| Market conclusion | Fundamental evidence | Comparison | Creditor consequence | Source |
|---|---|---|---|---|
| Not assessable: historical priced and unpriced risks cannot be distinguished from date-assigned entries | September 2024 secured debt issuance USD 3,000 million; October 2024 distribution approximately USD 4,348 million; issuer pro forma cash liquidity USD 2,919 million after that distribution | Not comparable: original observation time and several facility identities unverified | Do not interpret descriptive near-par entries as evidence that distribution, refinancing or recovery risk was adequately compensated | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56 |

### Chart data: yield against maturity

| Instrument | Maturity date | Yield | Spread | Quote date | Source class | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|---|
| TransDigm J / BL466719 Corp | 2031-02-28 | 6.2 | 247 bp three-year DM | 2024-09-30 | Hand-transcribed external-provider attribution; unverified | % | Source-reported mid YTM only; date assigned for testing, not verified historical observation. Identifier-to-legal-facility mapping and yield conventions not established. Source: TDG market quotes 2024-09-30.md, page 1. |
| TransDigm K / BL522943 Corp | 2030-03-22 | 5.9 | 224 bp three-year DM | 2024-09-30 | Hand-transcribed external-provider attribution; unverified | % | Source-reported mid YTM only; assigned date. Sheet margin and size conflict with year-end K terms; no curve inference. Source: TDG market quotes 2024-09-30.md, page 1. |
| TransDigm L / BL475283 Corp | 2032-01-20 | 6.2 | 250 bp three-year DM | 2024-09-30 | Hand-transcribed external-provider attribution; unverified | % | Source-reported mid YTM only; assigned date. Maturity reproduced from sheet, whereas annual report states 2032-01-19; no silent correction. Source: TDG market quotes 2024-09-30.md, page 1. |
| TransDigm M / BL520309 Corp | 2032-08-19 | 6.2 | 250 bp three-year DM | 2024-09-30 | Hand-transcribed external-provider attribution; unverified | % | Source-reported mid YTM only; assigned date. No matching year-end facility established. Source: TDG market quotes 2024-09-30.md, page 1. |
| TransDigm N / BL555762 Corp | 2033-02-10 | 6.2 | 248 bp three-year DM | 2024-09-30 | Hand-transcribed external-provider attribution; unverified | % | Source-reported mid YTM only; assigned date. No matching year-end facility established. Source: TDG market quotes 2024-09-30.md, page 1. |

These are transcribed YTM entries, not an authenticated historical yield curve; the displayed discount margins are separate measures and are not used as yields.

### Confidence inputs

| Input | Value |
|---|---|
| Not assessable | Not supplied: verified observation timestamps, reconciled security identities and pricing conventions are absent; historical market evidence gate fails |

### Analytical appendix — complete canonical registers

#### Market evidence boundary and convention lock

| Test | Supplied evidence | Decision and consequence | Source |
|---|---|---|---|
| Identity and perimeter | Group identity matches requested issuer; sheet uses TransDigm shorthand and Bloomberg identifiers | Retain quoted identifiers, but no unique legal-obligor or guarantor mapping is verified. Quoted ranks cannot establish collateral recovery. | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Observation time and freshness | 2024-09-30 explicitly assigned for testing; no original timestamp, time zone or market-open status | Historical observation gate fails. No numerical staleness allowance can turn an assigned date into a market observation. Any decision requires newly authenticated contemporaneous evidence. | TDG market quotes 2024-09-30.md, page 1 |
| Quote provenance and permission | Bloomberg attribution through hand transcription; bid and ask columns present | Not established whether executable, indicative, composite or evaluated; contributor depth, transaction sizes and entitlement/redistribution rights not supplied. No claim of direct vendor access. | TDG market quotes 2024-09-30.md, page 1 |
| Price basis | Bid/ask and changes stated in points of par | Clean/dirty basis, settlement, accrued interest and FX conversion basis not supplied. No calculated midpoint is substituted for an observed mid. | TDG market quotes 2024-09-30.md, page 1 |
| Yield and spread lock | Mid YTM in percent; mid three-year DM in basis points | Preserve separately as source-reported. Day count, compounding, forward curve, discount curve, amortization, settlement and prepayment/call path not supplied. No YTW or OAS is inferred. | TDG market quotes 2024-09-30.md, page 1 |
| Floating rate basis | Annual-report J/L Term SOFR +250 bp; K +275 bp; adjusted Term SOFR not subject to a floor | Rate terms corroborate only part of sheet identities. No source forward/base-rate assumption is supplied, so cash-flow yields and interest-rate duration cannot be reproduced. | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Market engine and stress | No verified curve, duration, recovery or default horizon | Default, loss, break-even, spread decomposition and price stresses remain blocked. A three-year DM label is not a default-model horizon or an interest-rate duration. | TDG market quotes 2024-09-30.md, page 1 |

#### T3E.1 Security and observation register

| security_id | issuer | currency | coupon | maturity/call | seniority | Source | timestamp | quote_type | freshness |
|---|---|---|---|---|---|---|---|---|---|
| BL466719 Corp / J | TransDigm label; exact obligor mapping not verified | USD; sheet size denomination | Sheet margin 250 bp; annual-report J Term SOFR +2.50%; reset tenor not supplied | 2031-02-28; call/prepayment terms not supplied | Sheet: first-lien guaranteed senior secured | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | 2024-09-30 assigned; actual time not supplied | Bid/ask; source-reported mid YTM and DM; execution status not supplied | Not verifiable; testing date only |
| BL522943 Corp / K | TransDigm label; exact obligor mapping not verified | USD; sheet size denomination | Sheet margin 225 bp versus annual-report K Term SOFR +2.75% | 2030-03-22; call/prepayment terms not supplied | Sheet: first-lien guaranteed senior secured | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | 2024-09-30 assigned; actual time not supplied | Bid/ask; source-reported mid YTM and DM; execution status not supplied | Not verifiable; identity conflict |
| BL475283 Corp / L | TransDigm label; exact obligor mapping not verified | USD; sheet size denomination | Sheet margin 250 bp; annual-report L Term SOFR +2.50% | Sheet 2032-01-20 versus annual report 2032-01-19; call/prepayment terms not supplied | Sheet: first-lien guaranteed senior secured | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | 2024-09-30 assigned; actual time not supplied | Bid/ask; source-reported mid YTM and DM; execution status not supplied | Not verifiable; maturity conflict |
| BL520309 Corp / M | TransDigm label; no matching year-end facility established | USD; sheet size denomination | Sheet margin 250 bp; base/reset/floor not supplied | 2032-08-19; call/prepayment terms not supplied | Sheet: first-lien guaranteed senior secured | TDG market quotes 2024-09-30.md, page 1 | 2024-09-30 assigned; actual time not supplied | Bid/ask; source-reported mid YTM and DM; execution status not supplied | Not verifiable; period identity unresolved |
| BL555762 Corp / N | TransDigm label; no matching year-end facility established | USD; sheet size denomination | Sheet margin 250 bp; base/reset/floor not supplied | 2033-02-10; call/prepayment terms not supplied | Sheet: first-lien guaranteed senior secured | TDG market quotes 2024-09-30.md, page 1 | 2024-09-30 assigned; actual time not supplied | Bid/ask; source-reported mid YTM and DM; execution status not supplied | Not verifiable; period identity unresolved |

#### T3E.2 Source-reported market levels

| security_id | bid/mid/ask or evaluated price | yield | spread/OAS/DM | duration | benchmark | observation ID | Source |
|---|---|---|---|---|---|---|---|
| BL466719 Corp | Bid 100.00; ask 100.13 points of par; mid price not supplied | Mid YTM 6.2% | Mid three-year DM 247 bp | Not supplied: no effective or spread duration | Not supplied: DM base/forward and discount curves unspecified | Q-J; assigned 2024-09-30, not verified | TDG market quotes 2024-09-30.md, page 1 |
| BL522943 Corp | Bid 99.94; ask 100.13 points of par; mid price not supplied | Mid YTM 5.9% | Mid three-year DM 224 bp | Not supplied: no effective or spread duration | Not supplied: DM curves unspecified | Q-K; assigned 2024-09-30, not verified | TDG market quotes 2024-09-30.md, page 1 |
| BL475283 Corp | Bid 99.88; ask 100.13 points of par; mid price not supplied | Mid YTM 6.2% | Mid three-year DM 250 bp | Not supplied: no effective or spread duration | Not supplied: DM curves unspecified | Q-L; assigned 2024-09-30, not verified | TDG market quotes 2024-09-30.md, page 1 |
| BL520309 Corp | Bid 99.88; ask 100.13 points of par; mid price not supplied | Mid YTM 6.2% | Mid three-year DM 250 bp | Not supplied: no effective or spread duration | Not supplied: DM curves unspecified | Q-M; assigned 2024-09-30, not verified | TDG market quotes 2024-09-30.md, page 1 |
| BL555762 Corp | Bid 99.88; ask 100.25 points of par; mid price not supplied | Mid YTM 6.2% | Mid three-year DM 248 bp | Not supplied: no effective or spread duration | Not supplied: DM curves unspecified | Q-N; assigned 2024-09-30, not verified | TDG market quotes 2024-09-30.md, page 1 |

#### T3E.3 Descriptive issuer curve and reconciliation

| security_id | maturity/call date | spread/yield | seniority | curve residual | explanation status | Source |
|---|---|---|---|---|---|---|
| BL466719 Corp / J | 2031-02-28; prepayment terms not supplied | 247 bp three-year DM; 6.2% YTM | Sheet first-lien guaranteed senior secured | Reference point only; fitted curve not calculable | Sheet size USD 3,641 million versus principal USD 3,632 million; difference USD 9 million. Timing or amortization explanation not established. | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation C13 |
| BL522943 Corp / K | 2030-03-22; prepayment terms not supplied | 224 bp three-year DM; 5.9% YTM | Sheet first-lien guaranteed senior secured | Versus J: -23 bp; not a fitted residual | Sheet size USD 3,544 million versus principal USD 1,699 million, difference USD 1,845 million; margin 225 bp versus 275 bp, difference -50 bp. Same maturity does not cure identity conflict; apparent tightness cannot be attributed to credit. | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculations C5, C14, C15 |
| BL475283 Corp / L | Sheet 2032-01-20; annual report 2032-01-19 | 250 bp three-year DM; 6.2% YTM | Sheet first-lien guaranteed senior secured | Versus J: +3 bp; not a fitted residual | Size USD 1,500 million and margin 250 bp agree, but maturity conflict remains. No interpolation across an unverified curve. | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation C6 |
| BL520309 Corp / M | 2032-08-19; prepayment terms not supplied | 250 bp three-year DM; 6.2% YTM | Sheet first-lien guaranteed senior secured | Versus J: +3 bp; not a fitted residual | Annual report lists only I/J/K/L at year-end; M cannot be accepted as a contemporaneous issuer curve point without identity and event evidence. | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation C6 |
| BL555762 Corp / N | 2033-02-10; prepayment terms not supplied | 248 bp three-year DM; 6.2% YTM | Sheet first-lien guaranteed senior secured | Versus J: +1 bp; not a fitted residual | No matching year-end N established. Apparent flatness cannot establish absence of term, event or recovery risk. | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation C7 |

#### T3E.4 Peer and index comparison worksheet

| comparator | alignment basis | spread/yield/price | period | difference | comparability limitation | Source |
|---|---|---|---|---|---|---|
| Bloomberg US Leveraged Loan Index Ba / I38940US | USD loan cohort; closer rating-label cohort than blended Ba/B; no duration alignment | Three-year DM 251 bp; YTM 6.3%; average price 99.44 points | Assigned 2024-09-30 | J DM minus index: -4 bp | Unverified shared date; index methodology, constituent mix and duration not supplied. Cannot call J fairly priced against this cohort. | TDG market quotes 2024-09-30.md, page 1; calculation C8 |
| Bloomberg US Leveraged Loan Index Ba/B / I38935US | USD loan index; broader credit mix | Three-year DM 416 bp; YTM 7.8%; average price 97.17 points | Assigned 2024-09-30 | J DM minus index: -169 bp | Credit mix and methodology differ; this is not issuer-specific excess return or a credit premium estimate. | TDG market quotes 2024-09-30.md, page 1; calculation C12 |
| StandardAero B1 / BL4793859 | USD first-lien senior secured; sheet Ba3 / BB-; maturity 2031-10-31 versus J 2031-02-28 | Three-year DM 193 bp; YTM 5.6%; bid 99.88 / ask 100.50 points | Assigned 2024-09-30 | J DM minus comparator: +54 bp | Guarantee status, duration, financial policy, covenants and call economics not aligned; matching rating labels do not establish matched credit risk. | TDG market quotes 2024-09-30.md, page 1; calculation C9 |
| Ontic B / BL5177714 | USD first-lien guaranteed senior secured; maturity 2030-10-17; sheet B2 / B | Three-year DM 234 bp; YTM 6.1%; bid 100.25 / ask 100.63 points | Assigned 2024-09-30 | J DM minus comparator: +13 bp | Different rating indications and maturity; no operating or legal risk reconciliation available. Difference is not an issuer residual. | TDG market quotes 2024-09-30.md, page 1; calculation C10 |
| Chromalloy B / BL5174752 | USD first-lien guaranteed senior secured; maturity 2031-03-27; sheet B2 / B- | Three-year DM 320 bp; YTM 6.9%; bid 99.88 / ask 100.38 points | Assigned 2024-09-30 | J DM minus comparator: -73 bp | Close maturity but weaker indicated rating; size, credit, collateral and trading differences unadjusted. No relative-value ranking follows. | TDG market quotes 2024-09-30.md, page 1; calculation C11 |

#### T3E.5 Implied loss and default model boundary

| security_id | model | horizon | recovery | discount/benchmark | implied default/loss/break-even | formula ID | limitation |
|---|---|---|---|---|---|---|---|
| All quoted J/K/L/M/N entries | No model applied; spread contains credit, liquidity, optionality and technical effects that cannot be separated | Not supplied: no approved default/loss horizon; three-year DM is a source measure only | Not supplied: no supported recovery assumption or sensitivity bounds | Not supplied: no verified benchmark, discount curve or default timing convention | Not calculable: authenticated spread and model assumptions absent | Not applied: neither spread/LGD approximation nor discounted cash-flow model is justified | No factual default probability, zero-default conclusion or invented sensitivity range. Recovery and horizon are missing, not zero. |

#### T3E.6 Liquidity, technicals and observed history

| security_id | bid-ask | trade frequency/volume | issue size | ownership/flow/supply evidence | direction | confidence | Source |
|---|---|---|---|---|---|---|---|
| BL466719 Corp / J | 0.13 points of par | Not supplied: no trades, depth or executable size | Sheet USD 3,641 million; annual-report principal USD 3,632 million | Sheet one-month change 0.00 points; YTD -0.38 points. Ownership, flows and dealers not supplied. | Narrower displayed width than other quoted TransDigm rows; not proof of superior execution | Low for executable liquidity; arithmetic exact on transcribed inputs | TDG market quotes 2024-09-30.md, page 1; calculation C1 |
| BL522943 Corp / K | 0.19 points of par | Not supplied: no trades or depth | Sheet USD 3,544 million; annual-report principal USD 1,699 million | Sheet one-month +0.13 points; YTD -0.25 points; no flow evidence | Identity conflict dominates any apparent spread advantage | Low; identity and observation unresolved | TDG market quotes 2024-09-30.md, page 1; calculation C2 |
| BL475283 Corp / L | 0.25 points of par | Not supplied: no trades or depth | USD 1,500 million in sheet and annual report | Sheet one-month +0.13 points; YTD -0.38 points; September 2024 issuance corroborated by annual report | Recent supply is documented; actual price impact or absorption not established | Low for technical causation | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; calculation C3 |
| BL520309 Corp / M | 0.25 points of par | Not supplied: no trades or depth | Sheet USD 2,500 million; year-end facility not established | Sheet one-month -0.06 points; YTD -0.50 points; no ownership evidence | No supported supply/flow explanation | Low; period identity unresolved | TDG market quotes 2024-09-30.md, page 1; calculation C3 |
| BL555762 Corp / N | 0.37 points of par | Not supplied: no trades or depth | Sheet USD 800 million; year-end facility not established | Sheet one-month -0.19 points; YTD not supplied by provider | Widest displayed TransDigm width; smaller sheet size alone cannot establish illiquidity | Low; execution and period identity unresolved | TDG market quotes 2024-09-30.md, page 1; calculation C4 |

Historical changes above retain the source's labels. The sheet does not identify whether changes refer to bid, mid or another price, and it supplies no underlying dated series, so no return, volatility or event-window inference is calculated.
Basis: TDG market quotes 2024-09-30.md, page 1

#### T3E.7 Fundamental comparison and disagreements

| market implication | CP-2/2H/2R evidence | aligned/divergent | possible basis | unresolved question | Source |
|---|---|---|---|---|---|
| If authenticated, near-par entries would suggest little immediate principal stress; no actual market conclusion is established | Issuer states no term-loan or note maturity before November 2027 and pro forma cash liquidity USD 2,919 million after October 2024 dividend | not_comparable | Maturity runway could support non-distressed pricing, but short-term receivables funding and financial policy remain separate risks | Were executable cutoff quotes actually near these entries, and did they reflect announced distributions? | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |
| Nearly flat displayed J/L/M/N discount margins do not establish that financial-policy risk is priced | September issuance USD 3,000 million alongside dividend declaration; October payment approximately USD 4,348 million; distributions prioritized before debt prepayment | not_comparable | Earnings strength could coexist with repeated creditor re-leveraging. Without before/after observations the event premium cannot be isolated. | What changed in verified loan and subordinated-note spreads around the September announcement? | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56 |
| Sheet Ba3 / BB- labels are not evidence of an issuer-level market/rating disagreement | Ratings & triggers cannot verify agency issuer state or thresholds; its FY2025 downside coverage 2.16x versus base 2.75x is an investor forecast, not an agency test | not_comparable | Cash-flow and refinancing risk can deteriorate before any demonstrated rating action; secondary ratings cannot validate the quote date | What is the dated agency state and the matched, authenticated issuer curve? | Ratings & triggers (CP-2H); TDG market quotes 2024-09-30.md, page 1 |
| Earlier statement that no market observations exist requires qualification | Source readiness did not include this additional transcription | not_comparable | Inventory difference is resolved: entries now exist, but authenticated historical observations still do not | Original provider evidence and legal-facility mapping remain necessary | Source readiness (CP-0); TDG market quotes 2024-09-30.md, page 1 |

#### T3E.8 Conditional downside and price-stress boundary

| scenario | driver | spread/yield/price assumption | calculated move | convexity/call limitation |
|---|---|---|---|---|
| Earnings disappointment followed by restricted cash retention | Initiating earnings shortfall reduces fixed-charge protection; further distributions or acquisition financing impede deleveraging; refinancing terms become more sensitive before the term-debt maturity window | Not supplied: no verified starting spread, calibrated shock or matched duration | Not calculable: no defensible monetary or price impact. Monitor earnings, interest burden and financing announcements before assuming a market repricing. | Loan resets limit simple rate-duration interpretation; spread duration, amortization and prepayment path not supplied |
| New secured supply to finance shareholder extraction | September 2024 debt/dividend transaction demonstrates the channel: additional debt raises claims and interest while the distribution removes cash; another transaction could weaken unsecured protection | Not supplied: no authenticated event-window quote series or supported supply shock | Not calculable: issuance is observed, market concession and causal spread impact are not | No quoted subordinated debt, collateral valuation or matched seniority curve; structural-risk premium cannot be isolated |
| Forced selling or degraded dealer depth | A verified widening of executable bid/ask or disappearance of depth would raise exit costs independently of borrower cash generation | Not supplied: no sourced fund flows, ownership concentration, executable depth or stress size | Not calculable: do not convert displayed width into assumed liquidation cost | No trade sizes, transaction prices, convexity or discount-margin sensitivities |

#### T3E.9 Monitoring observables

| observable | threshold | cadence/event | evidence source |
|---|---|---|---|
| Original observation provenance | Hard evidence condition: dated original quote with time zone, security ID, quotation basis and execution/evaluation status; no numerical stale-day threshold substitutes for this | Before any historical market or dislocation conclusion | Original vendor or transaction evidence not supplied; current transcription explicitly uses an assigned date |
| Facility identity | Exact legal-facility identifier, terms and event history reconciled; K economics, L maturity and M/N period identity unresolved | On receipt of facility documentation or new quote extract | Annual-report loan table; transcribed identifiers |
| Executable liquidity | No numerical width/volume trigger calibrated; require verified two-sided size and transaction/depth history before defining one | Each decision time and after financing or earnings events | Trade, dealer-depth and quote-history evidence not supplied |
| Financial-policy and earnings channel | New debt-funded distribution, acquisition financing or earnings disappointment is a review event, not an automatic spread or agency trigger | Financing announcement and quarterly results | Annual-report financial policy; Ratings & triggers conditional coverage discussion |

#### T3E.10 Missing and conflicting evidence

| missing/stale/conflicting item | affected calculation/security | impact | required evidence |
|---|---|---|---|
| Assigned testing date instead of actual observation timestamp | All market signals, histories and comparator differences | Blocks historical priced/unpriced-risk and dislocation conclusions | Dated original observations with source and quotation status |
| J size discrepancy; K size/margin conflict; L maturity conflict; M/N not in year-end loan table | Issuer curve and security-specific attribution | Prevents reliable curve fitting and outlier interpretation; supplied figures retained without choosing a preferred identity | Facility identifiers tied to legal terms and contemporaneous transactions/amortization |
| Settlement, clean/dirty basis, accrual, day count, compounding, forward curve and prepayment assumptions | Recomputed YTM, YTW and DM | Source-reported metrics cannot be independently reproduced or compared on a fully locked basis | Vendor definitions and dated cash-flow schedule |
| Duration, benchmark, recovery, horizon and default timing | Price stresses and implied default/loss | No model outputs or invented sensitivities | Supported model inputs and assumptions |
| Actual trades, depth, ownership and fund/dealer flows | Executable liquidity and technical decomposition | Displayed width and issue size do not prove capacity to exit or explain spread movements | Dated transactions, quote sizes and sourced positioning evidence |
| Bond and subordinated-note observations absent | Structural-risk premium and secured/subordinated curve comparison | Cannot establish pricing of extraction, priority or recovery risk across the capital structure | Matched-time debt quotes and legal/recovery evidence by rank |

## Calculations

All arithmetic below uses transcribed observations as supplied, not verified historical prices. Source-reported yields and discount margins remain separate from calculated differences; no yield, default probability, model price or executable midpoint is calculated.

| ID | Calculation | Exact inputs | Result | Period, currency and quantity | Source |
|---|---|---|---|---|---|
| C1 | J displayed ask less bid | 100.13 - 100.00 | 0.13 points of par | Assigned 2024-09-30; USD loan quotation | TDG market quotes 2024-09-30.md, page 1 |
| C2 | K displayed ask less bid | 100.13 - 99.94 | 0.19 points of par | Assigned 2024-09-30; USD loan quotation | TDG market quotes 2024-09-30.md, page 1 |
| C3 | L and M displayed ask less bid, identical inputs | 100.13 - 99.88 | 0.25 points of par each | Assigned 2024-09-30; USD loan quotations | TDG market quotes 2024-09-30.md, page 1 |
| C4 | N displayed ask less bid | 100.25 - 99.88 | 0.37 points of par | Assigned 2024-09-30; USD loan quotation | TDG market quotes 2024-09-30.md, page 1 |
| C5 | K DM less J DM | 224 - 247 | -23 bp | Assigned 2024-09-30; USD three-year DM | TDG market quotes 2024-09-30.md, page 1 |
| C6 | L and M DM less J DM, identical inputs | 250 - 247 | +3 bp each | Assigned 2024-09-30; USD three-year DM | TDG market quotes 2024-09-30.md, page 1 |
| C7 | N DM less J DM | 248 - 247 | +1 bp | Assigned 2024-09-30; USD three-year DM | TDG market quotes 2024-09-30.md, page 1 |
| C8 | J DM less Ba index DM | 247 - 251 | -4 bp | Assigned 2024-09-30; USD three-year DM; unmatched duration/methodology | TDG market quotes 2024-09-30.md, page 1 |
| C9 | J DM less StandardAero B1 DM | 247 - 193 | +54 bp | Assigned 2024-09-30; USD three-year DM; unmatched legal/credit terms | TDG market quotes 2024-09-30.md, page 1 |
| C10 | J DM less Ontic DM | 247 - 234 | +13 bp | Assigned 2024-09-30; USD three-year DM; unmatched rating/maturity | TDG market quotes 2024-09-30.md, page 1 |
| C11 | J DM less Chromalloy DM | 247 - 320 | -73 bp | Assigned 2024-09-30; USD three-year DM; unmatched credit risk | TDG market quotes 2024-09-30.md, page 1 |
| C12 | J DM less Ba/B index DM | 247 - 416 | -169 bp | Assigned 2024-09-30; USD three-year DM; mixed credit cohort | TDG market quotes 2024-09-30.md, page 1 |
| C13 | Sheet J size less year-end principal | 3,641 - 3,632 | USD 9 million | Assigned sheet date versus 2024-09-30 principal; source size definition not established | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| C14 | Sheet K size less year-end principal | 3,544 - 1,699 | USD 1,845 million | Assigned sheet date versus 2024-09-30 principal; unresolved identity | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| C15 | Sheet K margin less annual-report K margin | 225 - 275 | -50 bp | Assigned sheet date versus 2024-09-30 terms; unresolved identity | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |

## Gaps

| Gap or restriction | Effect on this assessment | Severity |
|---|---|---|
| No authenticated contemporaneous observation or quote convention | Historical market inference is blocked, even where descriptive arithmetic is possible. No conclusion that risks are priced, unpriced or mispriced is authorized. | Critical |
| Facility identity conflicts and missing legal mapping | Apparent K tightness, curve flatness and M/N term points cannot be treated as issuer credit signals | Material |
| Missing model and liquidity inputs | Default/loss, price sensitivities, liquidity capacity and spread decomposition remain uncalculated rather than assumed | Material |
| Financial foundation, Fundamental credit, Forward credit model and recovery assessments were not directly supplied | Independent forecast, balance-sheet and recovery reconciliation cannot be established; only the supplied Ratings & triggers discussion and directly read annual-report facts are compared | Material |
| Annual report published after the cutoff | Financial-policy discussion is retrospective; it does not establish precisely what the market knew at each quote time | Scope limitation |
| Original vendor permissions not evidenced | External-provider attribution is retained, but entitlement and redistribution rights cannot be affirmed | Use limitation |
| Output boundary | Descriptive calculations are not authenticated market evidence, security rankings, trading recommendations, position sizes or factual default probabilities | Use limitation |

## Next module

The orchestrator selects the next module.
