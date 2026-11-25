---
issuer_id: tdg
issuer: TransDigm Group Incorporated
module_id: CP-6
module_name: ICDebateChallenge
schema_family: Nested
layer: L6
reporting_period: FY2024
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-opus-high
pathway: deep_credit_assessment
module_status: Ready with Limitations
portfolio_phase_status: Ready with Limitations
committee_status: Requires More Work
final_action_bias: Watchlist
debate_winner: Neither
final_sizing_posture: Requires More Work
portfolio_debate_winner: Neither
limitation_flags: [MARKET_PRICING_UNAUTHENTICATED, MANDATE_AND_EXPOSURE_NOT_SUPPLIED, EXECUTED_DEBT_DOCUMENTS_NOT_SUPPLIED, COVENANT_CAPACITY_ANALYSIS_UNAVAILABLE, RECOVERY_VALUATION_UNAVAILABLE, RATINGS_NOT_VERIFIED, EVIDENCE_VALIDATION_LEGAL_CAPACITY_EXCEPTION]
validation_warnings: [EVIDENCE_VALIDATION_CLEARANCE_FAIL_ON_LEGAL_CAPACITY_LANGUAGE, OWNERSHIP_CONTROL_CHARACTERIZATION_UNVERIFIED, DIVIDEND_PAYMENT_FIGURES_UNRECONCILED, RATE_SENSITIVITY_FIGURES_UNRECONCILED, CHAIR_AND_CIO_SCORING_PROVISIONAL]
upstream_artifacts_used: [CP-0, CP-1, CP-1A, CP-1B, CP-1C, CP-2, CP-4, CP-2A, CP-2E, CP-2D, CP-3D, CP-3C, CP-3, CP-5]
downstream_consumers: not stated
---

## Request

Investment committee debate and portfolio challenge for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is the issuer debate ending in an action bias and the portfolio debate ending in a sizing posture and one exact portfolio constraint, using only the supplied filings and prior analyses of this run.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Direct check of the September 2024 secured issuance and special dividend, the stated order for using excess cash, the fixed-rate share, reported and pro forma cash liquidity, the November 2027 first term-debt maturity and management's stated willingness to borrow for special dividends |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate, absence of executed debt documents, ratings and peers; dated October 2024 events |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Debt, cash, net debt and pro forma adjustment for the 2024-10-18 payment, EBITDA, free cash flow, coverage, maturity ladder |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Business mix, FY2024 financing transactions, distributions, capital allocation, subsequent repurchases |
| Earnings changes (CP-1B) | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | Organic growth, constructed fourth-quarter deceleration, incremental margin |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Confirms no usable peer set or valuation multiple |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Integrated credit view, supported EBITDA, leverage on supported earnings, aftermarket slowdown signal |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Summary covenant tests, ranking, guarantor perimeter, payment blockage, illustrative capacity figures (used only as illustrations) |
| Downside (CP-2A) | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | Stress scenarios and break points |
| Rates, FX & hedging (CP-2E) | 07fc638c1461ff2144da31f25ac8824dc06bb001433c5122f5b06f1ba3bc8647 | Unhedged floating debt, rate sensitivity, hedge expiries |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Twelve-month liquidity bridge, runway, pinch points |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Blocked market inference; transcribed loan observations are descriptive only |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Refinancing paths, funding gap, filed debt fair values, creditor-class exposure |
| Security selection (CP-3) | c4f7926ca861f1605b74a442853b15d09a9fbb4e5fb49389e26ac32363f13683 | Relative value Unclear, all securities Requires More Work, no portfolio mandate or holdings |
| Evidence validation (CP-5) | 43a8fcda770e0fe69a5796390b9e0eba4fc3a8ecda404e7377c304aea40aef85 | Traceability of the financial chain; clearance withheld on legal-capacity language and the ownership-control statement |

## Findings

### Bottom line

Watchlist is the bias that survives challenge: TransDigm's cash generation and liquidity rebut a near-term default case, but debt-funded distributions, unsized leakage capacity and unauthenticated pricing leave creditors without a supported entry or sizing decision.

Free cash flow of USD 1,880 million and pro forma cash liquidity of USD 2,919 million after the 2024-10-18 dividend payment, with no term debt due before November 2027, keep near-term default probability low. Against that, the board declared USD 6,368 million of special distributions in FY2024, 3.39x free cash flow, and funded the September payment with USD 3,000 million of new secured debt. Net leverage is 6.02x pro forma for the 2024-10-18 payment, against 4.88x at year end, and 5.93x on supported earnings. Loss severity, not liquidity, is where the Bear wins. The portfolio posture is Requires More Work because no fund mandate, exposure data or authenticated price exists.
Basis: Financial foundation (CP-1); Fundamental credit (CP-2); Business & governance (CP-1A); Liquidity (CP-2D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; calculation X3

### Key findings

- Cash-flow durability is the Bull's strongest ground and survives cross-examination. A 52.56% EBITDA As Defined margin converts into free cash flow of USD 1,880 million, and the Downside stress keeps free cash flow positive until EBITDA falls 38.92% at run-rate interest. The Bear's attack only lands on where the cash goes, not on whether it is generated.
Basis: Financial foundation (CP-1); Downside (CP-2A)

- Liquidity is adequate for twelve months but is distributable, so it cannot be counted as creditor protection beyond that horizon. The bridge ends at USD 3,550.1 million after all scheduled uses, a 23.46 months runway on a bridge distorted by the one-off dividend. One further special dividend of the September size would consume it, and buybacks of USD 316 million followed within the first quarter after year end.
Basis: Liquidity (CP-2D); Business & governance (CP-1A)

- The Bear completes the downside chain to a refinancing and loss-severity outcome, not to a payment default. A 20% EBITDA decline lifts pro forma net leverage to 7.53x and cuts cover to 1.96x while cash flow stays positive, and the FY2028 and FY2029 maturities of USD 11,405 million are 3.91x pro forma liquidity. Weaker access would push refinancing toward secured takeouts, which load the subordinated notes first.
Basis: Downside (CP-2A); Financial foundation (CP-1); calculation X4

- Legal control is the Bear's decisive ground, but only on demonstrated behaviour. Secured debt is 78.51% of carrying debt, the September dividend used the secured route, and restricted-payment, lien and unrestricted-subsidiary baskets are not sized. The indicative secured capacity of USD 3,244 million is an illustration that evidence validation refused to treat as legal capacity, so the Chair gives it no weight either way.
Basis: Legal & covenants (CP-4); Evidence validation (CP-5); Financial foundation (CP-1); calculation X2

- Relative value is not established and caps the bias at Watchlist. The only loan quotes carry an observation date assigned for testing and conflict with filed tranche terms; the Tranche J discount margin of 247 bp against 193 bp for a StandardAero facility is descriptive. Filed note fair values near principal argue against distress but do not price compensation.
Basis: Market-implied risk (CP-3D); Security selection (CP-3); Refinancing & LME (CP-3C)

- The portfolio posture is Requires More Work, and the binding constraint is the data-quality limitation that prevents decision-useful sizing. No mandate, holdings, concentration limits, rating buckets or executable depth were supplied, so the exact mandate constraint is not established and no size can be tested against fund limits.
Basis: Security selection (CP-3); Market-implied risk (CP-3D)

### Contrary evidence and what would change the view

The strongest case against Watchlist is that a Starter Position is already justified. Cash generation is audited and growing, reported EBITDA rose 21.12% in FY2024 on mostly organic volume, nothing in the term debt matures before November 2027, about 77% of gross debt is fixed rate, and the term loans and notes carry no maintenance covenants. Filed fair values put the term loans at USD 8,694 million against USD 8,702 million of principal, which does not suggest market stress. On this reading the distributions are leverage-neutral recycling of growth, and the guardrail for missing market data with sound credit permits a Starter Position. The Chair rejects it for now because two things are missing at once: an authenticated entry price, and any bound on how much more secured debt and distribution capacity the executed agreements allow. The view would move to Starter Position, with sizing constrained, if the executed credit agreement and indentures showed restricted-payment and free-and-clear secured baskets that cap further layering, and if dated, facility-matched quotes showed compensation at least in line with the rating cohort. It would move to Avoid if another debt-funded special dividend were declared while quarterly EBITDA fell, if the July 2025 securitization were not extended while the revolver was drawn above USD 364 million, or if a selective-priority or guarantor-release transaction appeared.
Basis: Earnings changes (CP-1B); Refinancing & LME (CP-3C); Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56

### Limitations

- Because the executed debt agreements are absent and evidence validation withheld clearance on the legal-capacity reading, the debate cannot decide whether the legal leakage it finds is bounded or open-ended; if the agreements prove tight, the legal dimension would swing toward the Bull and the bias would move from Watchlist to Starter Position.
Basis: Evidence validation (CP-5); Legal & covenants (CP-4)
- With no authenticated price for any TransDigm loan or note, the relative-value and portfolio-fit dimensions are left unscored, so the Chair's scoring is provisional and no average is computed; this alone prevents any bias above Starter Position even if every other gap closed.
Basis: Market-implied risk (CP-3D); Security selection (CP-3)
- No recovery valuation, covenant capacity analysis or verified agency rating was available to the debate, so the Bear's loss-severity win for the subordinated notes is directional only and cannot support an instrument preference or a downgrade-basket argument in the portfolio debate.
Basis: Security selection (CP-3)
- The ownership-control statement used elsewhere in the run was challenged by evidence validation, so the governance dimension here rests only on documented distribution conduct; if a controlling holder were identified, the extraction risk would be stronger, not weaker.
Basis: Evidence validation (CP-5); Business & governance (CP-1A)

### Portfolio posture

Final Sizing Posture: Requires More Work. The decision is driven by the absence of authenticated market pricing and of any fund mandate or exposure report, because without them neither spread compensation nor risk-budget consumption can be set against TransDigm's debt-funded distributions and growing secured layer, which implies that no portfolio yield, concentration, downgrade-basket, liquidity or recovery implication can be underwritten. The main factor preventing a higher-conviction recommendation is that the only market evidence is a transcription with an assigned date and unresolved facility identities. Requires More Work maps to the canonical Requires More Work. Neither persona won: the relative-value trader could not show cheapness, and the compliance officer could not show a breach, because both lacked the data their case needs.
Basis: Market-implied risk (CP-3D); Security selection (CP-3)

Exact Portfolio Constraint: the data-quality limitation preventing decision-useful sizing, the last item in the priority order of portfolio constraints, is the binding constraint for this run. The fund's mandate and limits were not supplied, and no portfolio workbook or exposure report exists, so the exact mandate constraint is not established and sizing within the fund's limits is not tested. The mechanism is that, without issuer, sector, rating-bucket and capital-structure-layer limits and current exposures, any position size would be an unsupported number, and an aerospace exposure could already sit near a sector or issuer cap. If a size were taken regardless, a breach could only be found after the fact. The evidence that would resolve it is the fund's mandate and compliance monitor at a matching date and measurement basis, current holdings and NAV, verified issue ratings, and dated executable quotes with size.
Basis: Security selection (CP-3)

The memo below sets out the CIO's nine required elements. The residual risks behind the binding constraint are, in order, legal and recovery tolerance for subordinated exposure, downgrade-basket capacity once ratings are verified, and exit liquidity, none of which can be measured on the evidence supplied.
Basis: Legal & covenants (CP-4); Security selection (CP-3)

| Element | CIO memo | Source |
|---|---|---|
| Decision | Final Sizing Posture: Requires More Work; canonical translation Requires More Work | Security selection (CP-3) |
| Winner | Neither wins: the RV pitch lacked authenticated prices and peers; the compliance attack lacked mandate and exposure data | Market-implied risk (CP-3D); Security selection (CP-3) |
| Most important RV evidence | Documented senior priority of USD 19,534 million secured debt over USD 4,581 million subordinated notes, with filed fair values near principal | Financial foundation (CP-1); Refinancing & LME (CP-3C) |
| Most important compliance evidence | No mandate, holdings, limits or executable depth; quotes carry an assigned date and conflict with filed Tranche K and L terms | Security selection (CP-3); Market-implied risk (CP-3D) |
| Legal / recovery view | Subordinated notes contractually, structurally and payment-blockage subordinated; no recovery percentage; capacity figures illustrative only | Legal & covenants (CP-4); Evidence validation (CP-5) |
| Liquidity / refinancing view | Adequate twelve-month liquidity; ordinary refinancing most credible; FY2028 and FY2029 wall USD 11,405 million | Liquidity (CP-2D); Refinancing & LME (CP-3C) |
| Relative-value / portfolio view | [Insufficient Information]: relative value Unclear; no portfolio fit or sizing output | Security selection (CP-3) |
| Sizing constraint | Data-quality limitation preventing decision-useful sizing; the mandate constraint itself is not established | Security selection (CP-3) |
| Follow-up before more conviction | Fund mandate and exposures; dated, facility-matched quotes; executed debt agreements; verified ratings; recovery valuation | Source readiness (CP-0); Security selection (CP-3) |

### Decision

The summary shows why the bias stops at Watchlist: the Bull wins the cash and liquidity rows, the Bear wins the policy and legal rows, and the price row is empty.

| Dispute | Strongest figure | Winner | Creditor consequence | Source |
|---|---|---|---|---|
| Cash-flow durability | Free cash flow USD 1,880 million | Bull | Debt service is self-funded | Financial foundation (CP-1) |
| Twelve-month liquidity | Pro forma cash liquidity USD 2,919 million | Bull | Low near-term default probability | Liquidity (CP-2D) |
| Downside path | 7.53x pro forma net leverage at a 20% EBITDA fall | Partially mitigated | Refinancing terms weaken before cash runs out | Downside (CP-2A) |
| Financial policy | USD 6,368 million declared distributions | Bear | Growth funds equity, not deleveraging | Business & governance (CP-1A) |
| Legal control and recovery | Secured share of debt 78.51% | Bear | Subordinated loss severity rises | Financial foundation (CP-1); calculation X2 |
| Relative value | No authenticated price | Neither | No entry or sizing decision | Market-implied risk (CP-3D) |

Final Action Bias: Watchlist. The decision is driven by audited free cash flow of USD 1,880 million and adequate post-dividend liquidity set against USD 6,368 million of declared distributions partly funded with secured debt, because cash generation is real but is recycled to shareholders while each secured issue enlarges the claim ahead of the subordinated notes, which implies low near-term PD but rising LGD for juniors and an unpriced relative-value case. The main factor preventing a higher-conviction recommendation is the combination of unsized leakage capacity under the executed agreements and the absence of authenticated market pricing. Neither persona won the debate: the Bull carried cash flow and liquidity and the Bear carried policy and legal control, but the decisive relative-value and legal-capacity questions rest on missing evidence rather than on superior evidence for either side.
Basis: Financial foundation (CP-1); Business & governance (CP-1A); Liquidity (CP-2D); Legal & covenants (CP-4); Market-implied risk (CP-3D)

The single greatest uncertainty is how much further secured debt and distribution capacity the executed credit agreement and indentures permit beyond the summarised 7.25x total and 5.00x secured incurrence tests. It matters because the board has shown it will borrow on a secured basis to pay dividends, so the size of the remaining baskets sets how far subordinated recovery can be diluted without any default. Resolving it requires the executed agreements, their definitions of consolidated EBITDA and net debt, and current basket usage, reviewed by counsel. If the baskets prove tight, the bias would rise to Starter Position with constrained sizing, conditional on authenticated pricing; if they prove loose or include free-and-clear secured capacity outside the ratio, the bias for subordinated exposure would fall to Avoid while secured exposure stays at Watchlist.
Basis: Legal & covenants (CP-4); Evidence validation (CP-5); Business & governance (CP-1A)

### IC Chair final memo

The memo synthesises the debate without new evidence.

| Element | Chair memo | Source |
|---|---|---|
| Decision | Final Action Bias: Watchlist | Financial foundation (CP-1); Liquidity (CP-2D) |
| Who won | Neither: Bull won cash flow and liquidity; Bear won policy and legal; relative value and legal capacity unresolved | Legal & covenants (CP-4); Market-implied risk (CP-3D) |
| Most important Bull evidence | Free cash flow USD 1,880 million, positive until a 38.92% EBITDA fall at run-rate interest | Financial foundation (CP-1); Downside (CP-2A) |
| Most important Bear evidence | USD 3,000 million secured debt issued alongside the September special dividend; debt prepayment ranked last | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 |
| Legal / recovery view | Covenant-light; 5.00x secured test the nearest summarised brake; baskets unsized; subordinated notes most exposed; no recovery percentage | Legal & covenants (CP-4); Evidence validation (CP-5) |
| Liquidity / refinancing view | Adequate to 2025-09-30; pinch points October 2024 and 2025-07-11; FY2028 wall USD 6,637 million | Liquidity (CP-2D); Refinancing & LME (CP-3C) |
| Relative-value / portfolio view | [Insufficient Information]: no authenticated pricing, no peer valuation, no mandate | Market-implied risk (CP-3D); Peer benchmark (CP-1C); Security selection (CP-3) |
| Follow-up | Executed agreements and basket usage; dated facility-matched quotes; verified ratings; recovery valuation; FY2025 quarterly EBITDA and distribution decisions | Source readiness (CP-0) |

### Committee challenge

A committee member will ask why a credit with audited free cash flow of USD 1,880 million, no term debt due before November 2027 and covenant-light documents is not already a Starter Position. The answer is that the debate found nothing wrong with the ability to pay and a great deal unresolved about the willingness to keep value inside the creditor group. The board ranks debt prepayment last, borrowed USD 3,000 million of secured debt two weeks before year end to fund a dividend, and resumed buybacks within weeks. A creditor buying today is therefore underwriting the size of the next distribution, and that size is set by baskets nobody in this run has read. The second challenge is price: every spread in the file is a transcription with an assigned date, so a Starter Position would be an allocation without an entry level. The Chair's answer is to hold Watchlist with two explicit upgrade conditions rather than to split the difference.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; Business & governance (CP-1A); Market-implied risk (CP-3D)

### Chart data: portfolio limits

| Limit | Current exposure | Proposed exposure | Limit value | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|
| Not supplied: no fund mandate or compliance limits were supplied for this run | Not supplied: no holdings or exposure report supplied | Not supplied: no proposal evaluated because posture is Requires More Work | Not supplied: no mandate limit supplied | % of NAV | Run settings declare no portfolio workbook and no source is a mandate, exposure or compliance report; the NAV denominator is not established, so no limit, exposure or headroom is stated |

No portfolio limit or exposure is established for this run, so the table records absence rather than headroom.

### Events: Decision and watch

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: no committee decision or review date is assigned in the documents or run settings | Not supplied: no dated decision event | Not supplied: no publication carries a decision date | Not supplied: watch conditions are undated; dated issuer events are recorded by the analyses that own them | Not supplied: no dated decision or user reminder | Not supplied: no source states a decision date | Not supplied: the securitization maturity on 2025-07-11 and the November 2027 maturity are held in the liquidity and refinancing lanes |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 10 |
| Calculated | 9 |
| Assumption-Based | 2 |
| Analyst Inference | 8 |
| Weak Lineage | 1 |
| Untraced | 0 |
| Conflicting | 2 |
| Insufficient Information | 6 |
| Fields present | 18 |
| Fields total | 19 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 2 |

### Analytical appendix — complete canonical registers

#### Source gate and readiness

<!-- table-id: source_gate -->
| Phase | Available inputs | Missing inputs | Gate status | Limitation carried forward | Source |
|---|---|---|---|---|---|
| Issuer debate | Financial foundation, Business & governance, Earnings changes, Fundamental credit, Downside, Liquidity, Rates FX & hedging, Legal & covenants, Refinancing & LME, Security selection, Market-implied risk (blocked), Peer benchmark (blocked), Evidence validation | Covenant capacity; recovery and instrument-preference analysis; authenticated market data; verified ratings; executed debt documents | Ready with Limitations | Chair must not claim attractive relative value, basket headroom or covenant capacity, or a definitive instrument preference or recovery conclusion | Source readiness (CP-0); Market-implied risk (CP-3D); Security selection (CP-3) |
| Portfolio debate | Security selection, Downside, the issuer debate above | Portfolio fit and sizing output; mandate; exposure report; current pricing; ratings trajectory | Ready with Limitations | CIO must not claim sizing within limits, spread attractiveness, safe concentration or controlled downside | Security selection (CP-3) |
| Evidence validation | Financial chain traceable; clearance Fail with 1 critical, 1 material and 1 minor finding | Corrected legal-capacity and ownership statements | Limitation, not a block on this debate | Illustrative legal capacity and the no-controller statement carry no weight here | Evidence validation (CP-5) |

#### Evidence inventory

<!-- table-id: evidence_trace -->
| ID | Figure | Value | Lineage | Source |
|---|---|---|---|---|
| E01 | Free cash flow FY2024 | USD 1,880 million (49.31% of reported EBITDA) | Calculated | Financial foundation (CP-1) |
| E02 | EBITDA As Defined margin | 52.56% | Calculated | Financial foundation (CP-1) |
| E03 | Reported EBITDA; EBITDA As Defined; supported EBITDA; add-backs | USD 3,813 million; USD 4,173 million; USD 3,871 million; USD 360 million | Directly Sourced; supported figure Analyst Inference | Financial foundation (CP-1); Fundamental credit (CP-2) |
| E04 | Net debt | USD 18,619 million at 2024-09-30; USD 22,967 million pro forma 2024-10-18 | Calculated | Financial foundation (CP-1) |
| E05 | Net leverage | 4.88x year end; 6.02x pro forma 2024-10-18; 5.50x on EBITDA As Defined pro forma; 5.93x on supported EBITDA pro forma; gross 6.53x | Calculated | Financial foundation (CP-1); Fundamental credit (CP-2) |
| E06 | Cash | USD 6,261 million at 2024-09-30; USD 1,913 million pro forma 2024-10-18 | Directly Sourced; Calculated | Financial foundation (CP-1) |
| E07 | Cash liquidity | USD 7,267 million at 2024-09-30; USD 2,919 million pro forma 2024-10-18 | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56 |
| E08 | Interest | Scheduled next-year USD 1,524 million; FY2024 cash paid USD 1,158 million; cover 2.50x and 3.29x | Directly Sourced; Calculated | Financial foundation (CP-1) |
| E09 | Maturities | FY2028 USD 6,637 million; FY2028 and FY2029 USD 11,405 million; no term loan or note maturity before November 2027 | Directly Sourced | Financial foundation (CP-1); Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |
| E10 | Distributions and September financing | USD 6,368 million declared FY2024; USD 3,000 million secured debt issued 2024-09-19; 69% of the USD 4,348 million payment | Directly Sourced; Calculated | Business & governance (CP-1A); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 |
| E11 | Use of excess cash | Debt prepayment ranked fourth after capex, acquisitions and special dividends or buybacks; management may borrow for special dividends | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54, 56 |
| E12 | Debt by rank | Secured USD 19,534 million; subordinated USD 4,581 million; total USD 24,880 million | Calculated | Financial foundation (CP-1) |
| E13 | Summary covenant tests | Incurrence 7.25x net and 5.00x secured net; springing 7.50x when revolver usage exceeds USD 364 million | Directly Sourced (summary authority) | Legal & covenants (CP-4) |
| E14 | Illustrative capacity | Secured USD 3,244 million; total USD 7,287.25 million; secured net 4.22x pro forma | Insufficient Information (illustration, legal meaning not established) | Legal & covenants (CP-4); Evidence validation (CP-5) |
| E15 | Non-guarantor share of FY2024 net sales | 20.73% | Calculated | Legal & covenants (CP-4) |
| E16 | Downside stress | 20% EBITDA fall: 7.53x pro forma net leverage, 1.96x cover, free cash flow 721.364 USD million; 7.25x reached at 16.92%; 7.50x at 19.69%; free cash flow zero at 38.92%; EBITDA 3,050.4 USD million; shocked interest USD 1,554 million | Assumption-Based | Downside (CP-2A) |
| E17 | Liquidity bridge | Ending USD 3,550.1 million; ex-dividend USD 7,898.1 million; runway 23.46 months; after illustrative USD 765 million EBITDA fall USD 2,785.1 million | Assumption-Based | Liquidity (CP-2D) |
| E18 | Rates | Unhedged floating USD 5,789 million; +100 bp USD 57.89 million against issuer about USD 30 million; swaps and cap expire by 2025-09-30; collars USD 2,938 million from 2025-09-30; about 77% fixed | Conflicting (sensitivity) | Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 55 |
| E19 | Securitization | USD 650 million fully drawn after 2024-10-16; matures 2025-07-11 | Directly Sourced | Liquidity (CP-2D) |
| E20 | Subsequent repurchases and liquidity | USD 316 million in quarter ended 2024-12-28; cash liquidity USD 3,308 million at 2024-12-28 | Directly Sourced (subsequent event) | Business & governance (CP-1A); Liquidity (CP-2D) |
| E21 | Transcribed loan quotes | Tranche J 3Y DM 247 bp; StandardAero B1 193 bp; difference 54 bp; Ba loan index 251 bp; J bid-ask 0.13 points | Weak Lineage (assigned date, identity conflicts) | Market-implied risk (CP-3D); Security selection (CP-3) |
| E22 | Filed fair values | Term loans USD 8,694 million against principal USD 8,702 million; 2027 subordinated notes USD 2,637 million against USD 2,650 million | Directly Sourced | Refinancing & LME (CP-3C) |
| E23 | FY2024 financing activity and growth | About USD 21,000 million of financing transactions; reported EBITDA growth 21.12%; organic sales growth 16.2%; constructed Q4 sales growth 18.03% against nine-month 21.57%; nine-month EBITDA As Defined growth 24.30% | Directly Sourced; Calculated | Business & governance (CP-1A); Earnings changes (CP-1B) |
| E24 | Aftermarket signal | Q4 organic aftermarket increase USD 49 million against nine-month quarterly average USD 68 million | Analyst Inference | Fundamental credit (CP-2) |
| E25 | Evidence validation | Clearance Fail: 1 critical, 1 material, 1 minor finding | Directly Sourced | Evidence validation (CP-5) |
| E26 | Business mix | About 90% proprietary; about 55% aftermarket; incremental EBITDA As Defined margin 57.42% | Directly Sourced; Calculated | Business & governance (CP-1A); Earnings changes (CP-1B) |

#### Pre-debate thesis map

<!-- table-id: thesis_map -->
| Dimension | Available evidence | Evidence quality | Source |
|---|---|---|---|
| Cash-flow durability, margin resilience, FCF conversion | Free cash flow USD 1,880 million; margin 52.56%; organic growth 16.2%; Q4 deceleration | Strong | Financial foundation (CP-1); Earnings changes (CP-1B) |
| Liquidity runway | Pro forma USD 2,919 million; bridge ending USD 3,550.1 million; runway 23.46 months | Moderate | Liquidity (CP-2D) |
| Leverage / deleveraging trajectory | 6.02x pro forma 2024-10-18 (4.88x year end); 5.93x supported; debt prepayment last | Strong | Financial foundation (CP-1); Fundamental credit (CP-2) |
| Refinancing risk / maturity profile | Nothing before November 2027; FY2028 and FY2029 USD 11,405 million | Strong | Financial foundation (CP-1); Refinancing & LME (CP-3C) |
| Legal / covenant protection | Summary tests only; baskets unsized; evidence validation exception | Weak | Legal & covenants (CP-4); Evidence validation (CP-5) |
| Recovery / LGD | Ranking known; no valuation or recovery percentage | Weak | Security selection (CP-3) |
| Relative value | Transcribed quotes with assigned date; no peer valuation | [Insufficient Information] — no authenticated pricing | Market-implied risk (CP-3D); Peer benchmark (CP-1C) |
| Portfolio fit | No mandate, holdings or limits | [Insufficient Information] — no portfolio inputs | Security selection (CP-3) |
| Sponsor / governance | Documented debt-funded distributions; ownership-control statement challenged | Moderate | Business & governance (CP-1A); Evidence validation (CP-5) |
| Catalyst visibility | FY2025 quarterly results, securitization renewal 2025-07-11, any distribution declaration | Moderate | Liquidity (CP-2D); Downside (CP-2A) |

The central investment controversy is whether audited, growing free cash flow and a long maturity runway protect creditors adequately when the board recycles that cash into debt-funded distributions under covenant capacity that cannot be measured.
Basis: Financial foundation (CP-1); Business & governance (CP-1A); Legal & covenants (CP-4)

#### Bull opening claims

<!-- table-id: bull_claims -->
| Claim | Evidence | How it supports durability | Credit implication | What would invalidate it | Source |
|---|---|---|---|---|---|
| 1 Cash-flow conversion and revenue durability | Free cash flow USD 1,880 million, 49.31% of reported EBITDA; margin 52.56%; about 90% proprietary and about 55% aftermarket; organic growth 16.2% | Certified sole-source parts sustain pricing; light capex turns EBITDA into cash that covers interest internally | Positive — Margin Expansion | Quarterly organic growth below the constructed Q4 18.03%, or a year-on-year EBITDA decline | Financial foundation (CP-1); Business & governance (CP-1A); Earnings changes (CP-1B) |
| 2 Liquidity runway | Pro forma cash liquidity USD 2,919 million; bridge ending USD 3,550.1 million after all scheduled uses; free cash flow zero only at a 38.92% EBITDA fall | Operations fund interest, tax, capex and the securitization repayment without refinancing | Neutral — Stable | Cash liquidity below USD 2,919 million or securitization not extended by 2025-07-11 | Liquidity (CP-2D); Downside (CP-2A) |
| 3 Refinancing pathway | About USD 21,000 million of FY2024 financing transactions completed; filed term-loan fair value USD 8,694 million against USD 8,702 million principal; no term maturity before November 2027 | Demonstrated market access and non-distressed valuations support consensual rollover | Neutral — Stable | Failed or materially repriced financing, or no progress on the November 2027 notes within 24 months of maturity | Business & governance (CP-1A); Refinancing & LME (CP-3C) |

#### T6A.4 Bear cross-examination

<!-- table-id: T6A.4 -->
| Bull Claim Attacked | Bear Counter-Evidence | Fragility Vector | Legal / Covenant Exploit | Risk Mechanic | Credit Implication | What Would Prove Bear Wrong |
|---|---|---|---|---|---|---|
| Claim 1: cash-flow conversion and revenue durability (Financial foundation (CP-1)) | Scheduled interest USD 1,524 million against USD 1,158 million paid cuts free cash flow to 1,513.9562 USD million before any EBITDA loss; Q4 sales growth slowed to 18.03% from 21.57%; add-backs USD 360 million; acquisitions plus dividends USD 4,385 million exceeded free cash flow (Downside (CP-2A); Earnings changes (CP-1B); Financial foundation (CP-1)) | Incremental margin of 57.42% reverses in a volume decline while interest is fixed | Ratio baskets scale with EBITDA As Defined, which exceeds supported EBITDA by USD 302 million; the springing test loosens to 8.00x after a material acquisition (Legal & covenants (CP-4)) | Cash is generated but recycled to distributions and acquisitions, so durability does not translate into deleveraging, and add-backs enlarge permitted debt | Negative — Leverage Increase | FY2025 quarters with EBITDA As Defined growth near the nine-month 24.30% pace, cash retained and no special dividend |
| Claim 2: liquidity runway (Liquidity (CP-2D)) | USD 316 million buybacks within weeks of the USD 4,348 million payment; a repeat September-size dividend would consume the USD 3,550.1 million ending liquidity; USD 650 million securitization due 2025-07-11; swaps and cap expire by 2025-09-30 (Business & governance (CP-1A); Liquidity (CP-2D); Rates, FX & hedging (CP-2E)) | Discretionary distribution drains the buffer and pushes funding onto the revolver | Restricted-payment baskets unsized; revolver usage above USD 364 million springs the 7.50x test, whose definitions are not supplied (Legal & covenants (CP-4)) | Liquidity is adequate only while the board refrains; the backstop becomes conditional exactly when it is needed | Negative — Liquidity Deterioration | Cash liquidity held above USD 2,919 million through FY2025 and the securitization extended at 2025-07-11 |
| Claim 3: refinancing pathway (Refinancing & LME (CP-3C)) | FY2028 and FY2029 maturities USD 11,405 million are 3.91x pro forma liquidity; secured share of debt 78.51%; 20% EBITDA fall gives 7.53x pro forma net leverage and 1.96x cover; quotes carry an assigned date (Downside (CP-2A); Market-implied risk (CP-3D); calculations X2, X4) | Unsecured access closes before cash runs out, steering takeouts to secured debt | Pari secured incremental debt allowed up to the summarised 5.00x secured test; 2029 to 2033 secured note guarantees follow credit-agreement guarantor status; voting thresholds and sacred rights not established (Legal & covenants (CP-4)) | Refinancing succeeds by layering secured claims ahead of the subordinated notes, raising their LGD without a default | Negative — Refinancing Risk | November 2027 notes refinanced like-for-like or unsecured before FY2027 with no further secured-funded distribution |

#### Bear Zero-Bound path, legal-control attack and conclusion

The Bear's chain starts with a commercial aftermarket slowdown, already hinted at by a fourth-quarter organic aftermarket increase of USD 49 million against a nine-month quarterly average of USD 68 million. In the Downside stress a 20% fall takes reported EBITDA to USD 3,050.4 million while cash interest rises to USD 1,554 million. Pro forma net leverage then reaches 7.53x and cover 1.96x, with the 7.25x incurrence level crossed at a 16.92% decline, although free cash flow stays positive. The legal and refinancing consequence arrives with the FY2028 maturities of USD 6,637 million, which would have to be rolled at weaker terms, most plausibly through secured debt. The credit outcome is higher loss severity for the subordinated notes and refinancing risk for the whole structure, not a payment default within twelve months. The chain is complete to that outcome; its weakest link is that the leverage breaks are measured on reported EBITDA, and on the contractual EBITDA As Defined the 7.50x level would be reached later.
Basis: Fundamental credit (CP-2); Downside (CP-2A); Financial foundation (CP-1)

The legal-control attack runs through each route. Add-backs of USD 360 million lift every ratio basket above supported earnings. Ratio debt and incremental facilities are allowed up to 7.25x total and 5.00x secured net leverage, and the September issue shows the secured route in use. Restricted payments are limited only subject to exceptions, and USD 6,368 million was declared in FY2024 without any waiver disclosed. Unrestricted-subsidiary and investment capacity are not sized, and 20.73% of net sales already sits in non-guarantor subsidiaries. Guarantees of the newer secured notes follow credit-agreement guarantor status, so a release could pass through without a noteholder vote. Pari secured priming is demonstrated, but superpriority, uptier and amendment thresholds are not established. The Bear cannot size any basket, and the indicative capacity figures were refused as legal capacity by evidence validation.
Basis: Legal & covenants (CP-4); Evidence validation (CP-5); Business & governance (CP-1A)

The Bear case is strong on policy and loss severity and weak on near-term default. It proves that creditor value leaks by design and that the subordinated notes bear it first, but it cannot show a liquidity break inside the horizon.
Basis: Downside (CP-2A); Liquidity (CP-2D); Legal & covenants (CP-4)

#### Bull defence

<!-- table-id: bull_defence -->
| Bear attack | Rebuttal evidence | Why it mitigates the fragility vector | Rebuttal status | Source |
|---|---|---|---|---|
| 1 Interest step-up and recycling of cash | Free cash flow stays positive even with a 20% EBITDA fall and run-rate interest plus 100 bp; scheduled-interest cover 2.50x; distributions are discretionary and can be stopped | The step-up and a moderate downturn are absorbed internally, so the fragility is in allocation, not generation | Partially Rebutted | Downside (CP-2A); Financial foundation (CP-1) |
| 2 Distributable liquidity | Ex-dividend bridge ends at USD 7,898.1 million; actual cash liquidity USD 3,308 million at 2024-12-28; an illustrative USD 765 million EBITDA fall still leaves USD 2,785.1 million | Recurring operations rebuild liquidity; the October payment was a trough, not a drain | Partially Rebutted | Liquidity (CP-2D) |
| 3 Secured layering at refinancing | No term maturity before November 2027; demonstrated access; filed fair values near principal | Addresses access, but not dilution of the subordinated notes or the cost of access | Failed | Refinancing & LME (CP-3C) |

The Bull acknowledges it cannot rebut the dilution vector: no evidence limits further secured issuance ahead of the subordinated notes, and no authenticated price shows that the risk is paid for.
Basis: Refinancing & LME (CP-3C); Market-implied risk (CP-3D)

#### T6A.7 Resolution matrix

<!-- table-id: T6A.7 -->
| Disputed Risk | Bull Position | Bear Position | Resolution | Evidence Basis | Credit Implication |
|---|---|---|---|---|---|
| Cash-flow durability | Free cash flow USD 1,880 million; margin 52.56% | Interest step-up and recycling to equity | Bull Sustained | Chair score 2 of 5; audited cash flow outweighs allocation concern on generation (Financial foundation (CP-1)) | Neutral — Stable |
| Twelve-month liquidity | Pro forma USD 2,919 million; bridge ending USD 3,550.1 million | Distributable buffer; 2025-07-11 securitization | Bull Sustained | Chair score 2 of 5; scheduled uses covered without refinancing (Liquidity (CP-2D)) | Neutral — Stable |
| Downside pathway severity | Free cash flow positive to a 38.92% fall | 7.53x and 1.96x at a 20% fall | Partially Mitigated | Chair score 3 of 5; stress breaks leverage, not liquidity (Downside (CP-2A)) | Negative — Leverage Increase |
| Refinancing and maturity wall | Access demonstrated; nothing before November 2027 | USD 11,405 million in FY2028 and FY2029; secured takeouts | Partially Mitigated | Chair score 3 of 5; access real, terms unpriced (Refinancing & LME (CP-3C)) | Negative — Refinancing Risk |
| Financial policy and extraction | Distributions discretionary; growth absorbed them | USD 6,368 million declared; USD 3,000 million secured-funded; debt prepayment last | Bear Sustained | Chair score 5 of 5 on documented conduct only (TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54) | Negative — Leverage Increase |
| Legal / covenant control and leakage | 5.00x secured test well below 7.25x | Baskets unsized; guarantee linkage; covenant-light | Bear Sustained | Chair score 4 of 5; capacity figures given no weight (Legal & covenants (CP-4); Evidence validation (CP-5)) | Negative — Covenant Erosion |
| Recovery / LGD for subordinated notes | Senior pool equal-ranking; no superpriority shown | Secured share 78.51%; payment blockage; non-guarantor priority | Bear Sustained | Chair score 4 of 5; directional, no valuation (Financial foundation (CP-1); Legal & covenants (CP-4)) | Negative — Covenant Erosion |
| Rate hedge cliff | About 77% fixed; +100 bp USD 57.89 million affordable | Swaps and cap expire by 2025-09-30 | Partially Mitigated | Sensitivity second-order next to EBITDA risk (Rates, FX & hedging (CP-2E)) | Negative — Margin Compression |
| Relative value compensation | Tranche J 247 bp against StandardAero 193 bp | Assigned date; facility identity conflicts | Insufficient Information | Not scored; neither side has authenticated pricing (Market-implied risk (CP-3D)) | Insufficient Information |
| Portfolio fit and sizing | Cash generation supports a monitoring role | No mandate, holdings or limits | Insufficient Information | Not scored; no portfolio inputs (Security selection (CP-3)) | Insufficient Information |

#### Portfolio debate source gate and thesis map

<!-- table-id: portfolio_thesis_map -->
| Dimension | Available evidence | Evidence quality | Source |
|---|---|---|---|
| Spread / YTW / DM compensation | Transcribed Tranche J 3Y DM 247 bp; no YTW; assigned date | [Insufficient Information] — unauthenticated | Market-implied risk (CP-3D) |
| Peer relative value | No peer valuation; descriptive loan comparisons only | [Insufficient Information] — no usable peer | Peer benchmark (CP-1C); Security selection (CP-3) |
| Downside pathway | Static stress to 7.53x at a 20% fall | Moderate | Downside (CP-2A) |
| Liquidity / refinancing | Adequate twelve-month liquidity; FY2028 wall | Moderate | Liquidity (CP-2D); Refinancing & LME (CP-3C) |
| Legal / recovery | Ranking known; baskets and recovery unquantified | Weak | Legal & covenants (CP-4) |
| CCC-basket / downgrade | No verified issuer rating | [Insufficient Information] — ratings not verified | Security selection (CP-3) |
| Concentration / correlation | No exposure data | [Insufficient Information] — no holdings | Security selection (CP-3) |
| Mandate fit | No mandate | [Insufficient Information] — no mandate | Security selection (CP-3) |
| Implementation liquidity | Displayed J bid-ask 0.13 points; no executable depth | Weak | Market-implied risk (CP-3D) |

The issuer debate's Watchlist bias enters as context, not as a binding constraint. Pre-debate, the central portfolio controversy is whether the descriptive loan-spread and senior-priority evidence is sufficient to compensate for distribution-driven releveraging, unmeasured legal leakage and unknown mandate and concentration capacity.
Basis: Market-implied risk (CP-3D); Security selection (CP-3); Legal & covenants (CP-4)

#### Relative-value trader pitch

<!-- table-id: rv_pitch -->
| Bullet | Evidence | How compensation supports allocation | Credit and portfolio implication | What would invalidate it | Source |
|---|---|---|---|---|---|
| 1 Spread versus peers or cohort | Tranche J 3Y DM 247 bp against StandardAero B1 193 bp (54 bp) and the Ba loan index 251 bp (minus 4 bp) | Would indicate in-line to modestly wide compensation for a senior secured loan | [Insufficient Information] — observation date assigned for testing; yield contribution not calculable | Authenticated quotes showing J tighter than the Ba cohort | Market-implied risk (CP-3D); Security selection (CP-3) |
| 2 Instrument-level mispricing by seniority | Secured USD 19,534 million ahead of subordinated USD 4,581 million; filed term-loan fair value USD 8,694 million against USD 8,702 million | Senior priority with near-par valuation suggests secured exposure carries the least dilution risk | Neutral — Stable; risk-budget impact lower for secured than subordinated, not quantified | Further secured issuance diluting the senior pool, or quotes below par | Financial foundation (CP-1); Refinancing & LME (CP-3C) |
| 3 Implementation despite risk-budget use | Free cash flow USD 1,880 million; adequate liquidity; nothing due before November 2027; J bid-ask 0.13 points | Low near-term default budget consumption and a two-sided market | Neutral — Stable; size [Insufficient Information] | Withdrawal of two-sided size or a mandate limit near capacity | Liquidity (CP-2D); Market-implied risk (CP-3D) |

#### T6E.4 Compliance cross-examination

<!-- table-id: T6E.4 -->
| RV Bullet Attacked | Compliance Counter-Evidence | Constraint Vector | Risk Mechanic | Credit Implication | What Would Prove Compliance Wrong |
|---|---|---|---|---|---|
| Bullet 1: spread versus peers or cohort | Quote sheet assigns 2024-09-30 for testing; Tranche K sheet size USD 3,544 million and 225 bp conflict with filed USD 1,699 million and 275 bp; no YTW or peer valuation (Market-implied risk (CP-3D); Peer benchmark (CP-1C)) | Data quality | An unauthenticated spread cannot evidence compensation, so any yield contribution is unsupported | Insufficient Information — yield contribution and spread attractiveness not established | Dated, facility-matched executable quotes and a matched peer set |
| Bullet 2: instrument mispricing by seniority | Secured share 78.51%; September secured issue funded a dividend; baskets unsized; no recovery valuation; evidence validation refused the capacity figures (Legal & covenants (CP-4); Evidence validation (CP-5); calculation X2) | Legal / Recovery | Senior priority is diluted by further pari secured debt; subordinated residual falls first; no recovery figure to set against price | Negative — Covenant Erosion | Executed agreements showing tight secured and restricted-payment baskets, plus a supported recovery valuation |
| Bullet 3: implementation despite risk-budget use | No mandate, holdings, concentration limits, rating buckets, correlation budget or executable depth (Security selection (CP-3)) | Mandate | Without limits and exposures, risk-budget consumption and exit cost cannot be measured; an aerospace position could already sit near a cap | Insufficient Information — mandate and concentration capacity not established | Mandate, exposure report and compliance monitor showing headroom at a matching date |

The compliance attack is strong on data quality and legal recovery but cannot claim a breach, because no mandate or exposure report exists; its case wins by showing that the trader's pitch cannot be tested, not that the position would violate a limit.
Basis: Security selection (CP-3); Market-implied risk (CP-3D); Legal & covenants (CP-4)

#### Relative-value trader defence

<!-- table-id: rv_defence -->
| Compliance attack | Rebuttal evidence | Why it mitigates the constraint vector | Rebuttal status | Source |
|---|---|---|---|---|
| 1 Data quality of spreads | Tranche J stated margin and maturity agree with the filing; note fair values are based on quoted market prices | Partly anchors one quote and shows no broad distress | Partially Rebutted | Security selection (CP-3); Refinancing & LME (CP-3C) |
| 2 Legal / recovery | Secured classes rank equally; superpriority not demonstrated | Limits the attack to dilution, not priming of the senior pool | Partially Rebutted | Legal & covenants (CP-4) |
| 3 Mandate and implementation | None available | No mandate or exposure evidence exists to show headroom | Insufficient Information | Security selection (CP-3) |

No position-sizing constraint is proposed because no mandate input or portfolio-fit output exists; the provisional posture is Requires More Work and the exact size is not established.
Basis: Security selection (CP-3)

#### T6E.6 CIO scoring table

<!-- table-id: T6E.6 -->
| Dimension | Score (1-5) | RV Evidence | Compliance Evidence | CIO Assessment |
|---|---|---|---|---|
| Spread/YTW Benefit | [Insufficient Information] — not scored | Transcribed J 3Y DM 247 bp | Assigned date; no YTW | Neither side has supportable market evidence; not scored |
| Peer Relative Value | [Insufficient Information] — not scored | Descriptive loan comparisons | No usable peer or valuation | Not scored; no matched peer set |
| Downside Pathway Severity | 3 | Free cash flow positive to a 38.92% fall | 7.53x pro forma net leverage at a 20% fall | Balanced: liquidity holds, leverage and refinancing terms do not |
| Liquidity/Refinancing Risk | 2 | Pro forma USD 2,919 million; nothing before November 2027 | FY2028 and FY2029 wall USD 11,405 million | RV somewhat stronger within the horizon; wall remains a residual risk |
| Legal/Recovery Protection | 4 | Senior priority; no superpriority shown | Secured share 78.51%; baskets unsized; no recovery valuation | Compliance somewhat stronger; dilution demonstrated, protection unproven |
| CCC-Basket/Downgrade Risk | [Insufficient Information] — not scored | None | No verified rating | Not scored; ratings not verified |
| Concentration/Correlation Risk | [Insufficient Information] — not scored | None | No exposure data | Not scored; no holdings |
| Mandate Compliance | [Insufficient Information] — not scored | None | No mandate | Not scored; no mandate |
| Implementation Liquidity | [Insufficient Information] — not scored | J bid-ask 0.13 points | No executable depth or trades | Not scored; displayed width is not executable size |

Scoring is Provisional: six of nine dimensions lack supportable evidence, so no average is calculated.

#### T6E.7 Decision matrix

<!-- table-id: T6E.7 -->
| Disputed Risk | RV Position | Compliance Position | Resolution | Evidence Basis | Credit / Portfolio Implication |
|---|---|---|---|---|---|
| Spread compensation | J 3Y DM 247 bp, near the Ba index | Unauthenticated, identity conflicts | Insufficient Information (no authenticated pricing) | Market-implied risk (CP-3D) | No yield contribution or spread claim can be made |
| Secured versus subordinated selection | Secured layer best protected | Secured dilution and no recovery valuation | Unresolved | Legal & covenants (CP-4); Security selection (CP-3) | Secured exposure preferred for investigation only; no instrument preference |
| Downside budget | Liquidity holds under stress | Leverage reaches 7.53x at a 20% fall | Unresolved | Downside (CP-2A) | Downside budget consumption not measurable without a fund loss budget |
| Liquidity and refinancing | Adequate to 2025-09-30; access demonstrated | FY2028 wall; secured takeouts | Partially Mitigated | Liquidity (CP-2D); Refinancing & LME (CP-3C) | Low near-term default budget use; refinancing risk later |
| Legal and recovery | No superpriority shown | Baskets unsized; subordinated notes triple-subordinated | Compliance Sustained | Legal & covenants (CP-4); Evidence validation (CP-5) | Subordinated exposure would need an explicit loss budget |
| Mandate and concentration | Not argued | No mandate or exposure data | Insufficient Information (no mandate or exposure data) | Security selection (CP-3) | Sizing within limits not tested |
| Downgrade and rating bucket | Not argued | No verified rating | Insufficient Information (ratings not verified) | Security selection (CP-3) | Rating-bucket capacity not established |
| Implementation liquidity | Displayed two-sided market | No executable depth | Insufficient Information (no executable size) | Market-implied risk (CP-3D) | Exit cost not measurable |

#### T6E.11 Gaps ledger

<!-- table-id: T6E.11 -->
| Gap ID | Gap | Why It Matters | Impact on Debate | Required Follow-Up |
|---|---|---|---|---|
| CP-6A-GAP-001 | Authenticated, dated, facility-matched market pricing | Spread compensation cannot be measured, so yield contribution and value against risk are unknown | Blocked the trader's first bullet and the spread and peer scores | Dated executable quotes with time, size and quote basis, tied to filed tranche terms |
| CP-6A-GAP-002 | Fund mandate and compliance limits | Eligibility and the exact binding limit cannot be identified | Exact portfolio constraint not established; sizing within limits not tested | Mandate and compliance monitor at a matching date and measurement basis |
| CP-6A-GAP-003 | Holdings, NAV and exposure report | Concentration, correlation and pro forma exposure cannot be measured | Concentration and correlation dimension not scored | Current holdings, NAV and sector, issuer and layer exposures |
| CP-6A-GAP-004 | Verified issuer and issue ratings | Downgrade-basket and rating-bucket capacity cannot be tested | Downgrade dimension not scored | Dated agency publications |
| CP-6A-GAP-005 | Executable depth, trades and settlement terms | Exit cost and implementation feasibility unknown | Implementation liquidity not scored | Dealer size, trade history and settlement eligibility |
| CP-6A-GAP-006 | Portfolio fit and sizing analysis | No initial sizing to challenge | Trader could not propose a sizing constraint | Portfolio fit analysis on supplied mandate inputs |
| CP-6A-GAP-007 | Recovery valuation and executed debt agreements | Loss budget for subordinated exposure and secured dilution cannot be bounded | Legal and recovery scored on direction only | Executed agreements, basket usage and supported enterprise valuation |

#### Conflicts log

<!-- table-id: conflicts_log -->
| Conflict | Figures and roles | Treatment | Source |
|---|---|---|---|
| October 2024 dividend payment | USD 4,348 million declaration-linked (annual report); USD 4,396 million quarter-total cash flow | Annual report figure used for pro forma; difference unreconciled and immaterial to the bias | Financial foundation (CP-1); Liquidity (CP-2D) |
| Rate sensitivity per 100 bp | USD 57.89 million analytical against about USD 30 million issuer-stated | Both retained; rate risk second-order either way | Rates, FX & hedging (CP-2E) |
| Incurrence versus springing test | 7.25x incurrence against 7.50x springing | Annual report distinction governs | Legal & covenants (CP-4) |
| Legal capacity figures | USD 3,244 million secured illustration against no contractual support | No weight given; recorded as Insufficient Information | Evidence validation (CP-5) |
| Ownership control | No-controller statement against proxy referral | Governance view rests on documented conduct only | Evidence validation (CP-5) |
| Loan quote identities | Tranche K and L sheet terms against filed terms | Quotes descriptive only | Market-implied risk (CP-3D) |

## Calculations

Four new ratios were calculated; every other figure is taken unchanged from the analyses named in the evidence inventory.

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| X1 | Pro forma cash liquidity / FY2028 maturities | 2919 / 6637 | 0.4398 (43.98%) | 2024-09-30 pro forma for 2024-10-18 against FY2028 ladder, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56; Financial foundation (CP-1) |
| X2 | Secured carrying debt / total carrying debt | 19534 / 24880 | 0.7851 (78.51%) | 2024-09-30, ratio | Financial foundation (CP-1) |
| X3 | Special distributions declared / FY2024 free cash flow | 6368 / 1880 | 3.3872 (3.39x) | FY2024, x | Business & governance (CP-1A); Financial foundation (CP-1) |
| X4 | FY2028 and FY2029 maturities / pro forma cash liquidity | 11405 / 2919 | 3.9072 (3.91x) | FY2028–FY2029 ladder against 2024-09-30 pro forma for 2024-10-18, x | Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |

The ratios compare stocks with flows or different dates and are context for the debate, not forecasts or covenant measures.

## Gaps

| Gap ID | Gap | Why It Matters | Impact on Debate | Required Follow-Up |
|---|---|---|---|---|
| CP-6-GAP-001 | Executed credit agreement, indentures, guarantee and collateral agreement and intercreditor agreement not supplied | Basket size decides how much more secured debt and distribution capacity exists, which sets subordinated loss severity | Bear legal attack could not size any route; Bull could not prove a cap; bias held at Watchlist | Obtain the executed documents, definitions and basket usage and have counsel review them |
| CP-6-GAP-002 | Evidence validation withheld clearance on the legal-capacity language and the ownership-control statement | Illustrative capacity could be mistaken for permitted capacity; control could change the extraction view | Capacity figures and the control statement given no weight | Corrected legal and governance statements or supporting documents |
| CP-6-GAP-003 | No authenticated market pricing | Compensation against risk cannot be judged | Relative value not scored; caps the bias at Watchlist | Dated, facility-matched executable quotes for loans and notes |
| CP-6-GAP-004 | Covenant capacity, recovery valuation and instrument-preference analyses were not available to the debate | No headroom, recovery percentage or preferred instrument can be claimed | Recovery dimension directional only | Supported valuation cases and capacity analysis from executed documents |
| CP-6-GAP-005 | Verified agency ratings and peer financials absent | Rating-trigger and sector-relative arguments cannot be made | Neither persona argued rating or peer standing | Agency publications and peer filings |
| CP-6-GAP-006 | Chair scoring provisional: relative value and portfolio fit unscored; other scores 2, 3, 2, 3, 4, 4 and 5 on the cash-flow, downside, liquidity, refinancing, legal, recovery and governance dimensions | No average may be computed, so the scoring guide cannot set the bias | Bias set by guardrails and decision rules instead | Close the pricing and portfolio gaps |
| CP-6-GAP-007 | No FY2025 guidance or management base case | Whether growth keeps absorbing distributions is untested | Bull growth argument rests on FY2024 trend | FY2025 quarterly results |
| CP-6-GAP-008 | October 2024 dividend figures and rate-sensitivity figures unreconciled | Small differences in pro forma cash and interest sensitivity | No effect on the bias | Payment-level reconciliation and issuer sensitivity method |
| CP-6-GAP-009 | Use restriction | These results are a debate outcome, not a trade recommendation, position size, legal opinion, rating or recovery estimate | Limits how the bias may be used | Decision-specific evidence before any implementation |

## Next module

The orchestrator selects the next module.
