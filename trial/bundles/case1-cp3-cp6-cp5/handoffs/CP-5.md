---
issuer_id: tdg
module_id: CP-5
analysis_date: 2024-09-30
reporting_period: FY2024
pathway: deep_credit_assessment
run_id: tdg-2024-09-30-deep_credit_assessment-copilot-sol-medium
module_status: Ready with Limitations
committee_status: Blocked
traceability_scope: Top 5
artifact_name: tdg_CP-5_20240930.md
---

## Request

Evidence validation for TransDigm Group Incorporated as of 2024-09-30, under the deep_credit_assessment pathway. Scope comprises the five most material credit-driver provenance chains and an integrity review of the eighteen supplied analyses, without changing their substantive investment conclusions.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Direct verification of carrying debt, cash, distributions, cash flow, earnings adjustments, covenant summaries, debt instruments, interest sensitivity and beneficial-ownership disclosure boundary |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 | 2025-02-04 | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Subsequent-event verification only: October dividend components and quarterly cash-flow payment; no blending into FY2024 |
| TDG market quotes 2024-09-30.md | Hand-transcribed aerospace leveraged-loan and index observations attributed to Bloomberg | not stated | fc1e0d6fe55bf91fa3ac3ef6f7791e5c04f8f9089d5cdf079177b9c7f88f7aea | External-attributed observations; instrument-identity checks and verification that investment conclusions remain restricted; not independently retrieved Bloomberg data |

Every supplied analytical artifact is inventoried below. The common supplied run is tdg-2024-09-30-deep_credit_assessment-copilot-sol-medium, issuer tdg, assessment date 2024-09-30. Individual artifact run identifiers were not separately stated; the supplied accepted identities and hashes are preserved rather than replaced.

| Module | Analysis | Exact sha256 | Audit use |
|---|---|---|---|
| CP-0 | Source readiness | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source authority, period boundaries and original evidence limitations |
| CP-1 | Financial foundation | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Carrying-debt basis, October adjustments and financial definitions |
| CP-1A | Business & governance | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Capital allocation and ownership-control characterization |
| CP-1B | Earnings changes | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | Earnings-period and adjustment consistency |
| CP-DR | Research questions | f7ebcff4948d7c1303dbe93be2415859b4244722e9b3b4d14d0e2b18c8488d80 | Unresolved evidence boundaries and adoption discipline |
| CP-1C | Peer benchmark | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Preservation of blocked quantitative peer comparisons |
| CP-1D | Earnings quality | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Normalization provenance and isolated compensation sensitivity |
| CP-2 | Fundamental credit | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Driver materiality, denominator consistency and ownership characterization |
| CP-4 | Legal & covenants | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Capacity/compliance claims versus contractual support |
| CP-2A | Downside | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | Scenario assumptions distinguished from issuer facts |
| CP-2E | Rates, FX & hedging | 07fc638c1461ff2144da31f25ac8824dc06bb001433c5122f5b06f1ba3bc8647 | Hedge schedule and disclosed sensitivity discrepancy |
| CP-2D | Liquidity | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Bridge arithmetic, dated distributions and financing-use boundaries |
| CP-2G | Forward credit model | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Forecast assumptions versus observations; retained-cash interpretation boundary |
| CP-2H | Ratings & triggers | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Preservation of unverified agency-rating and trigger conclusions |
| CP-3D | Market-implied risk | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Preservation of restrictions on historical market inference |
| CP-3C | Refinancing & LME | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Fiscal maturity convention, liquidity arithmetic and legal-capacity boundaries |
| CP-4C | Recovery & fulcrum | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Distress-gate outcome; no recovery estimate inferred from non-applicability |
| CP-3 | Security selection | c4f7926ca861f1605b74a442853b15d09a9fbb4e5fb49389e26ac32363f13683 | Restricted relative-value conclusion, instrument matching and exclusion of isolated sensitivity |

## Findings

### Bottom line

TransDigm’s central financial conclusions are traceable, but committee approval should be withheld because Legal & covenants turns summary ratios into affirmative capacity and compliance conclusions without the contractual evidence needed to establish them. The arithmetic behind the illustrative headroom is reproducible; its legal availability is not. A general missing-document caveat does not establish that the secured test is the binding constraint on further extraction or borrowing.
Basis: Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; calculation A10

The main financial evidence does not require the investment thesis to be rewritten. Carrying debt, the October dividend adjustment, the earnings reconciliation and historical free cash flow tie to the filings. The review also identifies an unsupported ownership-control characterization and a non-core sensitivity inconsistency. Existing restrictions on peer comparisons, agency triggers, recovery estimates and security selection must remain in force.
Basis: Financial foundation (CP-1); Business & governance (CP-1A); Earnings quality (CP-1D); Peer benchmark (CP-1C); Ratings & triggers (CP-2H); Recovery & fulcrum (CP-4C); Security selection (CP-3)

### Key findings

- **The October cash adjustment is supported and decision-critical.** Reported cash of USD 6,261 million accompanies dividend-only pro forma cash of USD 1,913 million for the October 18, 2024 payment. Treating the former as freely retained liquidity would overstate creditor protection; the financial analysis correctly separates the subsequent distribution from period-end balances.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; calculation A02

- **Legal headroom is an illustration, not established borrowing capacity.** The USD 3,244 million secured-capacity figure follows the selected financial inputs, but the executed definitions, conditions and competing baskets are not established. Calling the test a binding brake or the calculation compliant gives the illustration a contractual meaning the evidence does not support.
Basis: Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; calculation A10

- **Earnings normalization is transparent, but the isolated compensation explanation needs correction.** The issuer reconciliation and the principal quality-adjusted denominator reproduce. The separate assertion of an approximately 0.39x compensation-only leverage effect does not match the stated calculation; Security selection excludes that isolated sensitivity, so the defect does not invalidate its already-restricted conclusion.
Basis: Earnings quality (CP-1D); Security selection (CP-3); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71; calculation A09

- **The rate-sensitivity discrepancy is disclosed rather than silently reconciled.** The analytical USD 57.89 million annual sensitivity per 100 bp reproduces from its stated hedge treatment, while the issuer reports approximately USD 30 million. Neither figure should displace the other as an established equivalent measure until the exposure bridge is explained.
Basis: Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176; calculation A11

- **A dispersed-control conclusion is not established by shareholder counts.** The annual report directs beneficial-ownership information to a separate proxy statement. The affirmative no-controller characterization should therefore not be treated as a verified governance fact or as evidence against concentrated decision-making over distributions.
Basis: Business & governance (CP-1A); Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 39; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 79

### Contrary evidence and what would change the view

The strongest evidence against withholding approval is that the legal analysis discloses its missing-document limitation, the annual report supplies specific ratio thresholds and management reports covenant compliance at year-end. Other analyses already decline to treat the illustrative headroom as executable capacity. Those safeguards substantially contain propagation, but they do not cure affirmative legal conclusions within the originating analysis. Clearance could be reconsidered after those conclusions are withdrawn or supported by the executed agreements, the applicable calculation definitions and current usage evidence; actual legal availability would still require legal review.
Basis: Legal & covenants (CP-4); Refinancing & LME (CP-3C); Security selection (CP-3); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62

The financial counterweight is tangible rather than promotional: FY2024 free cash flow of USD 1,880 million reproduces from operating cash flow less capital expenditure. The market analyses also avoid converting unmatched loan observations into an actionable preferred security. Correcting the identified integrity defects would permit reconsideration of descriptive committee use; it would not itself establish a rating, recovery value or investment recommendation.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 123; Security selection (CP-3); calculation A07

### Limitations

- The legal exception prevents an unrestricted committee clearance, rather than invalidating the reproduced financial statements. This review cannot authorize reliance on the challenged capacity or compliance language merely because other analyses avoid using it.
Basis: Legal & covenants (CP-4); Security selection (CP-3)
- The provenance conclusion covers the selected material-driver chains and the explicit checks below, not an exhaustive independent reconstruction of every forecast or stress cell. It therefore does not certify forecasts as observed outcomes or independently establish refinancing necessity from a cumulative-free-cash-flow comparison alone.
Basis: Forward credit model (CP-2G); Downside (CP-2A)

### Traceability conclusion

Overall, evidence traceability is Not Committee-Ready. Of the five selected material credit drivers, none is classified as Directly Sourced, two are Calculated, none is Assumption-Based, two are Analyst Inference, and one is Insufficient Information. These classifications concern the conclusions, not the underlying financial inputs, many of which are directly reported. The most important provenance gap is the conversion of a summary covenant test into usable legal capacity: omitted definitions and conditions can change what creditors actually permit, so numerical reproducibility alone cannot support clearance.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); Legal & covenants (CP-4); Security selection (CP-3)

Source coverage and citation completeness support the selected historical financial conclusions. Calculation traceability supports the central carrying-debt, distribution and earnings bridges, with the isolated sensitivity exception recorded below. Assumption transparency is adequate only when normalization, stress cases and hedge sensitivities retain their analytical labels. Artifact integrity relies on the supplied accepted identities and preserves explicit gaps rather than treating missing inputs as zero. The legal-definition failure determines the overall auditability conclusion; it is not a finding that the issuer has breached a covenant.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); Downside (CP-2A); Rates, FX & hedging (CP-2E); Legal & covenants (CP-4)

### Integrity review boundaries and resolved matters

The supplied analyses were reviewed across factual support, calculations, legal meaning, market identity, shared definitions, materiality, evidence trace and document identity. Period-end debt remains on the balance-sheet carrying basis; principal-based maturity and hedge calculations are separately identified. The earlier incurrence-threshold inconsistency is resolved by the annual report’s distinction between the incremental-facility test and the springing revolver test, not by choosing one number for both. November 2027 is fiscal 2028, so that calendar date does not contradict the fiscal maturity description.
Basis: Source readiness (CP-0); Financial foundation (CP-1); Refinancing & LME (CP-3C); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62

The external-attributed loan transcription supplies observations but does not cure instrument mismatches. The filed tranche schedule and the transcription disagree on economically relevant identity fields, especially Tranche K. No freshness objection is raised merely because of a displayed date, and no separate workbook is required to preserve the maintained-source basis. The restriction concerns matching the actual observation to the assessed obligation, not the age of a maintained source. Security selection’s refusal to produce an actionable preference is therefore preserved.
Basis: TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Security selection (CP-3)

The quantitative peer comparison remains blocked, unverified agency triggers remain unverified, and a non-applicable restructuring analysis is not evidence of full recovery. No new exception is created merely because these decisions were properly restricted. No visual verification of the original filing layout is claimed.
Basis: Peer benchmark (CP-1C); Ratings & triggers (CP-2H); Market-implied risk (CP-3D); Recovery & fulcrum (CP-4C)

### Analytical appendix — complete canonical registers

#### T5B.1 Source register

| Source Document ID | Source Document Name | Source Quality | Period | Entity Covered | Data Supplied | Limitation | Downstream Use | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | FY2024 annual report on Form 10-K | Audited primary financial evidence; management summaries for contracts | FY2024; published 2024-11-07 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrowing descriptions | Financial statements, distributions, instrument schedule, covenant summary and derivatives | Executed debt documents and proxy ownership schedules are incorporated by reference, not supplied | Historical financial verification; no executable basket or legal-capacity certification | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–62; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 79; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 120–123; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 175–176 |
| S2 | December 2024 quarterly report | Primary unaudited subsequent-period evidence | Q1 FY2025 | TransDigm Group Incorporated consolidated | October payment components and full-quarter cash payments | Later than assessment date; narrative payment and quarter-total payment have different roles | Dated subsequent-event corroboration and preservation of payment differences | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 44 |
| S3 | Aerospace loan transcription | External-attributed hand transcription, not independently authenticated provider retrieval | Labelled 2024-09-30; document says date assigned for testing | Named issuer and peer loans; loan indices | Loan fields and index observations | Actual obligation identity conflicts; attribution is not independently verified | Check values and preserve restrictions on actionable relative value; no freshness finding | TDG market quotes 2024-09-30.md, page 1 |
| S4 | Supplied accepted analytical artifacts | Accepted analytical evidence, not substitute executed legal or agency evidence | Common assessment date 2024-09-30; FY2024 financial base | TransDigm Group Incorporated | Eighteen scoped analyses, assumptions, calculations and explicit restrictions | Acceptance establishes identity and lineage, not truth of every analytical assertion | Claim tracing, cross-analysis checks and scoped committee-use determination | Source readiness (CP-0); Financial foundation (CP-1); Business & governance (CP-1A); Earnings changes (CP-1B); Research questions (CP-DR); Peer benchmark (CP-1C); Earnings quality (CP-1D); Fundamental credit (CP-2); Legal & covenants (CP-4); Downside (CP-2A); Rates, FX & hedging (CP-2E); Liquidity (CP-2D); Forward credit model (CP-2G); Ratings & triggers (CP-2H); Market-implied risk (CP-3D); Refinancing & LME (CP-3C); Recovery & fulcrum (CP-4C); Security selection (CP-3) |

#### T5B.2 Material credit-driver ranking

| Rank | Credit Driver | Originating Module | Source-Supported Basis | Why Material | Committee Relevance | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Distributions change retained creditor liquidity | Financial foundation; Liquidity; Fundamental credit | Cash USD 6,261 million; dividend-only pro forma cash USD 1,913 million on 2024-10-18; issuer liquidity USD 7,267 million and October pro forma USD 2,919 million | Cash supporting period-end net debt partly funds a declared shareholder payment | Preserve dated period and pro forma measures together; no unadjusted cash protection conclusion | A01–A05; payment-role reconciliation A13 | Pro forma is not actual subsequent-quarter closing cash | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; Financial foundation (CP-1) |
| 2 | Earnings denominator affects leverage interpretation | Earnings quality; Financial foundation | EBITDA USD 3,813 million; issuer EBITDA As Defined USD 4,173 million; analyst quality-adjusted USD 3,871 million | Recurring compensation and acquisition activity alter how much of the adjustment bridge represents sustainable debt-service earnings | Keep issuer measure distinct from analyst normalization and contractual EBITDA | A06, A08–A09 | Normalization is analyst judgement, not a contractual definition; isolated sensitivity needs correction | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71; Earnings quality (CP-1D) |
| 3 | Cash generation supports service but not automatic deleveraging | Financial foundation; Liquidity; Refinancing & LME | FY2024 CFO USD 2,045 million less capex USD 165 million gives FCF USD 1,880 million; next-year scheduled interest USD 1,524 million | Cash generation is real, but distributions, acquisitions and interest absorb resources | Historical FCF is traceable; extrapolation requires explicit assumptions and uses | A07, A12 | Scheduled interest is forward-looking and includes hedge assumptions; FCF is not cash after acquisitions or distributions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 64–65; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 123 |
| 4 | Binding legal-capacity conclusion lacks contractual support | Legal & covenants | Summary incremental tests 7.25x total net leverage and 5.00x secured net debt; illustrative capacities USD 7,287.25 million and USD 3,244 million | A numerically smaller illustration does not establish which contractual restriction governs a transaction | Do not use binding-brake or independently established compliance labels for the illustrations | A10; CP5-001 | Full definitions, conditions, baskets and usage are not established; management’s historical compliance statement is a separate sourced fact | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; Legal & covenants (CP-4) |
| 5 | Security-selection restraint is supported | Security selection; Market-implied risk | Tranche K quote: USD 3,544 million, 225 bp margin; filing: USD 1,699 million, 275 bp margin. Tranche L maturity: quote 2032-01-20, filing 2032-01-19 | Wrong obligation matching can invalidate discount-margin comparisons before valuation begins | Preserve Requires More Work and RV Unclear; no preferred security or sizing is cleared | Quote rows K and L versus filed term-loan schedule | No new recommendation or ranking is created by this review | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Security selection (CP-3) |

#### T5B.3 Traceability map

| Credit Driver / Conclusion | Originating Module | Source Evidence | Citation Present? | Source Quality | Classification | Claim Status | Confidence Level | Traceability Status | Source |
|---|---|---|---|---|---|---|---|---|---|
| Distribution-adjusted cash and net debt reproduce | Financial foundation; Liquidity | Carrying debt USD 24,880 million; cash USD 6,261 million; net debt USD 18,619 million. Dividend-only pro forma on 2024-10-18: cash USD 1,913 million; net debt USD 22,967 million | Yes | Primary audited accounts and explicit subsequent-event disclosure | Calculated | Supported within stated pro forma scope | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; Financial foundation (CP-1) |
| Quality-adjusted earnings require a different denominator from issuer adjustments | Earnings quality | USD 3,813 million EBITDA plus USD 58 million refinancing adjustment gives analyst USD 3,871 million; issuer measure USD 4,173 million | Yes | Reported inputs; analyst normalization | Analyst Inference | Principal bridge supported; isolated sensitivity exception does not replace it | Medium | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71; Earnings quality (CP-1D) |
| Historical FCF supports the service analysis | Financial foundation; Liquidity | USD 2,045 million CFO less USD 165 million capex equals USD 1,880 million FY2024 FCF | Yes | Primary audited cash-flow statement | Calculated | Supported; not a forecast or extraction-adjusted measure | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 123 |
| Secured headroom is the binding legal brake and illustrations are compliant | Legal & covenants | Financial illustration and annual-report summary only; no executed calculation definitions or complete conditions | Partial | Primary summary, inadequate for affirmative contractual conclusion | Insufficient Information | Unsupported legal extension of a reproducible illustration | Insufficient Information | Not Traceable | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; Legal & covenants (CP-4) |
| No actionable preferred security is established | Security selection | Specific filed-versus-transcribed obligation differences; ratings, legal and recovery restrictions retained | Yes | Filed debt schedule plus external-attributed observations | Analyst Inference | Supported restriction; not a positive valuation opinion | High | Committee-Ready | TDG market quotes 2024-09-30.md, page 1; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Security selection (CP-3) |

#### T5.3 Math, logic and definition audit

| Severity | Module | Metric / Logic Issue | Formula / Definition Issue | Source Conflict | Required Fix | Clearance Impact | Source |
|---|---|---|---|---|---|---|---|
| CRITICAL | Legal & covenants | CP5-001: illustrative secured and total headroom are presented with binding/compliant language | Arithmetic reproduces, but public EBITDA and carrying-debt proxies are not established as the governing definitions; alternative baskets and transaction conditions are not tested | Summary thresholds do not establish executable capacity; issuer-reported historical compliance does not validate these illustrations | Withdraw affirmative binding-capacity and independent compliance conclusions, or obtain executed documents, definitions and usage and subject the resulting calculation to legal review | Blocks Committee Use; Requires Legal Review | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| MINOR | Earnings quality | CP5-003: approximately 0.39x compensation-only effect conflicts with its specified sensitivity | USD 22,967 million / USD 3,871 million minus USD 22,967 million / USD 4,088 million equals 0.3149415392999578884787832247516658822x, not approximately 0.39x | Internal prose-versus-formula mismatch; principal quality-adjusted EBITDA and leverage are unaffected | Align isolated prose with the stated formula and retain its exclusion from investment reliance until corrected | Formatting / Hygiene Only; non-core explanatory sensitivity only | Earnings quality (CP-1D); Security selection (CP-3); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |

### Remediation priorities

**Must-fix before committee:** Withdraw the unsupported binding-capacity and independent compliance language or substantiate it through executed-document analysis and legal review. Also remove the unsupported no-controller fact characterization or support it with beneficial-ownership evidence. Financial ratios must remain illustrative until their contractual meaning is established.
Basis: Legal & covenants (CP-4); Business & governance (CP-1A); Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 79

**Must-fix before analytical reliance:** None beyond the preceding legal and governance corrections. Retain the existing restrictions rather than substituting missing agency, peer, market-identity or recovery evidence with an assumption.
Basis: Peer benchmark (CP-1C); Ratings & triggers (CP-2H); Recovery & fulcrum (CP-4C); Security selection (CP-3)

**Monitoring follow-up:** Explain the issuer-versus-analyst hedge-sensitivity difference and reconcile the separately defined dividend-payment figures before using either as a single definitive basis for an updated sensitivity or cash bridge. For forecast refinancing statements, distinguish cumulative internally generated cash from total available cash and the assumed operating minimum.
Basis: Rates, FX & hedging (CP-2E); Liquidity (CP-2D); Forward credit model (CP-2G); calculation A11; calculation A13

**Formatting / hygiene:** Correct the isolated compensation-sensitivity explanation without changing the principal earnings normalization or implying that the review has endorsed a different investment conclusion.
Basis: Earnings quality (CP-1D); calculation A09

### Clearance decision

CLEARANCE DECISION: Fail. Critical Issues: 1. Material Issues: 1. Minor Issues: 1. Committee Use: Blocked.

The legal-capacity exception prevents overall approval; it does not establish an issuer covenant breach. Reconsideration requires correction and re-review of the affirmative legal statements and the ownership characterization. Correct historical financial calculations may remain descriptive reference material, but they do not independently clear a security recommendation.
Basis: Legal & covenants (CP-4); Business & governance (CP-1A); Fundamental credit (CP-2); Security selection (CP-3)

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 0 |
| Calculated | 2 |
| Assumption-Based | 0 |
| Analyst Inference | 2 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 1 |
| Fields present | 37 |
| Fields total | 37 |
| Source gate | partial |
| CRITICAL | 1 |
| MATERIAL | 1 |
| MINOR | 1 |

### Map: support and contradiction

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Audited balance sheet | Supplies carrying debt and period cash | Supports | Distribution-adjusted balances | Annual report balance sheet and dated distribution disclosure; calculations A01–A04 |
| October distribution disclosure | Identifies cash committed to shareholders after year-end | Supports | Distribution-adjusted balances | Annual report USD 4,348 million payment; October 2024 subsequent event |
| Issuer earnings bridge | Supplies reported adjustments, not analyst endorsement | Supports | Quality-adjusted denominator | Annual report EBITDA USD 3,813 million and refinancing costs USD 58 million; A08 |
| Contract summary | Does not establish definitions or complete conditions | Unresolved | Binding legal-capacity claim | Annual report ratio summaries versus Legal & covenants affirmative illustration |
| Ownership disclosure referral | Refers beneficial-ownership facts to separate proxy | Contradicts | Verified no-controller characterization | Annual report shareholder counts do not supply a control analysis |
| Compensation sensitivity formula | Gives a different isolated effect from explanatory prose | Contradicts | Compensation-only prose effect | A09 reproduces the specified alternative denominator |
| Filed loan schedule | Identifies material mismatches in observed loan fields | Supports | Restricted security selection | Tranche K size and margin differ from the transcription |
| Issuer rate sensitivity | Remains unreconciled with the explicit analytical exposure | Unresolved | Analytical rate sensitivity | Issuer approximately USD 30 million versus analytical USD 57.89 million per 100 bp |

## Calculations

All issuer monetary operands below are USD million unless otherwise specified. Debt is positive outstanding carrying value for financial leverage; cash and payments are positive amounts subtracted where shown. None of the legal illustrations establishes contractual capacity. Ratios preserve their specified denominator; pro forma balances are dividend-only illustrations for the dated October event, not later quarter-end cash.

| ID | Period and quantity | Inputs and formula | Reproduced result | Definition and limitation | Source |
|---|---|---|---|---|---|
| A01 | 2024-09-30 debt | 98 + 486 + 24,296 | USD 24,880 million | Current long-term debt plus securitization plus noncurrent debt; carrying basis, not principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| A02 | 2024-10-18 dividend-only pro forma cash | 6,261 − 4,348 | USD 1,913 million | Matches Financial foundation; excludes the separate securitization draw and subsequent operating cash movements | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 44 |
| A03 | 2024-09-30 net debt | 24,880 − 6,261 | USD 18,619 million | Financial carrying debt less cash; no legal netting certification | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| A04 | 2024-10-18 dividend-only pro forma net debt | 24,880 − 1,913 | USD 22,967 million | Matches Financial foundation; distribution changes cash, not period-end debt | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 |
| A05 | October 2024 pro forma liquidity | 7,267 − 4,348 | USD 2,919 million | Directly agrees with issuer pro forma; year-end liquidity includes USD 843 million revolver and rounded USD 163 million securitization availability | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56 |
| A06 | FY2024 issuer earnings bridge | 3,813 + 70 + 217 + 58 + 15 | USD 4,173 million | Issuer EBITDA As Defined, not independently established contractual EBITDA | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| A07 | FY2024 FCF | CFO 2,045 − capex 165 | USD 1,880 million | After reported cash interest and taxes through CFO; before acquisitions, dividends and financing | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 123 |
| A08 | FY2024 quality-adjusted earnings | 3,813 + 58 | USD 3,871 million | Analyst normalization from Earnings quality; rejecting other add-backs is judgement, not an accounting correction | Earnings quality (CP-1D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| A09a | October dividend-only pro forma quality-adjusted leverage | 22,967 / 3,871 | 5.9330922242314647377938517179023508137x | Same numerator and period basis throughout isolated sensitivity | Earnings quality (CP-1D); Financial foundation (CP-1) |
| A09b | Alternative denominator retaining compensation adjustment | 3,871 + 217; then 22,967 / 4,088 | USD 4,088 million; 5.6181506849315068493150684931506849315x | Compensation-only alternative to the quality-adjusted denominator; no legal interpretation | Earnings quality (CP-1D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| A09 | Compensation-only effect | A09a − A09b leverage | 0.3149415392999578884787832247516658822x; challenged prose approximately 0.39x | The reproduced formula does not match the isolated explanatory value; principal denominator unchanged | Earnings quality (CP-1D); Security selection (CP-3) |
| A10a | Illustrative secured net debt after dividend | 19,534 − 1,913 | USD 17,621 million | Secured carrying-debt selection and financial cash proxy taken from the legal illustration; not certified contractual definitions | Legal & covenants (CP-4); Financial foundation (CP-1) |
| A10 | Illustrative secured headroom | 4,173 × 5.00 = 20,865; then 20,865 − 17,621 | USD 3,244 million | Arithmetic supported; actual capacity Not calculable because full definitions, conditions, baskets and usage are not established | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| A10b | Illustrative total headroom | 4,173 × 7.25 = 30,254.25; then 30,254.25 − 22,967 | USD 7,287.25 million | Same contractual limitation as A10; smaller illustration does not establish a binding restriction across all routes | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| A11a | 2024-09-30 stated analytical floating exposure | Term loans 8,702 + rounded securitization 487 = 9,189; swaps 500 + 1,500 + 700 plus cap 700 = 3,400; 9,189 − 3,400 | USD 5,789 million | Reproduces stated treatment of separately listed hedges, not an independent reconciliation to issuer risk methodology; collars are forward-starting | Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| A11 | Annual sensitivity to +100 bp | 5,789 × 0.01 | USD 57.89 million per 100 bp; issuer approximately USD 30 million per 100 bp | Disclosed methodological discrepancy, not silently repaired or treated as identical measures; future hedge states differ | Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| A12 | Liquidity analytical bridge | 7,267 + 4,044 − 302 − 1,524 − 539 − 277.9 − 738 − 4,380 | USD 3,550.1 million | Reproduces Liquidity’s closing bridge amount; scenario operating inflow, adjustments and selected uses remain analytical assumptions, not an issuer forecast | Liquidity (CP-2D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 64–65 |
| A13 | October 2024 distribution: one event, distinct reported roles | Annual report event estimate 4,348; later event components 4,216 + 131 = 4,347; quarter-total cash-flow payments 4,396; 4,396 − 4,348 = 48; 4,396 − 4,347 = 49; 4,348 − 4,347 = 1 | USD 4,348 million annual estimate; USD 4,347 million event components; USD 4,396 million quarter cash flow; differences USD 48 million, USD 49 million and USD 1 million | One preserved payment-role reconciliation. Quarterly total is not established as the identical event amount; no unexplained difference is allocated to a fabricated cause | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 44 |
| A14 | Required-field coverage definition | Eight source-register fields + eight driver-register fields + nine traceability fields + seven math-audit fields + five gate fields | 37 fields present / 37 fields total | Counts required field types, not assurance that missing contractual evidence exists. Gate fields: identity, assessment date, reporting period, auditable-input availability and traceability scope | Retained registers and supplied accepted analytical identities |

## Gaps

The open integrity exceptions below are distinct from properly disclosed issuer-evidence limitations. Only the numbered integrity exceptions enter the severity counts; the remaining rows preserve bounded decisions and unresolved source differences without alleging additional analytical errors.

| ID | Severity or disposition | Affected conclusion or decision | What remains unresolved and why it matters | Required correction or evidence | Responsible discipline | Use before correction | Source |
|---|---|---|---|---|---|---|---|
| CP5-001 | CRITICAL; Open | Binding legal capacity and independently established compliance | Summary-based arithmetic is presented with contractual force. Applicable definitions, conditions and other baskets can change the binding constraint, affecting creditor rights and refinancing/extraction conclusions | Withdraw binding/compliant labels for the illustrations, or substantiate through executed agreements, definitions, usage and legal review; distinguish issuer-reported historical compliance | Legal analysis and legal counsel | No reliance on affirmative capacity conclusions; overall committee clearance withheld pending correction and re-review | Legal & covenants (CP-4); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| CP5-002 | MATERIAL; Open | Verified absence of a controlling shareholder | Holder counts and absence of ownership detail do not establish dispersed control. The affirmative characterization in Business & governance and Fundamental credit exceeds the supplied evidence; no separate support or sponsor benefit is assumed | Replace the fact characterization with an explicitly unestablished control conclusion or provide dated beneficial-ownership and voting-control evidence | Governance analysis | No reliance on the no-controller statement; observed distribution behavior remains separately supported | Business & governance (CP-1A); Fundamental credit (CP-2); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 39; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 79 |
| CP5-003 | MINOR; Open | Isolated compensation-only sensitivity explanation | Approximately 0.39x does not match the specified formula. The main normalization remains unchanged and Security selection excludes this isolated sensitivity, so no investment consequence is attributed to the mismatch | Align the prose and calculation; do not silently substitute a different denominator | Earnings analysis | Principal normalization may remain descriptive; do not reuse the isolated explanatory value | Earnings quality (CP-1D); Security selection (CP-3); calculation A09 |
| G1 | Preserved disclosed discrepancy; not an additional integrity exception | Interest sensitivity and future hedge states | Analytical USD 57.89 million and issuer approximately USD 30 million per 100 bp are not reconciled; both remain visible. Hedge maturities and forward starts prevent assuming an unchanged exposure through forecast years | Issuer-methodology bridge or position-level exposure explanation, with effective dates and no unsupported offset | Rates and hedging analysis | Sensitivities remain separately labelled; no unique reconciled value is certified | Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 176 |
| G2 | Preserved payment-role difference; not an additional integrity exception | October event and quarterly cash use | Annual estimate USD 4,348 million, later components USD 4,347 million and quarterly cash outflow USD 4,396 million are retained as one event reconciliation with distinct roles; exact causes of the differences are not established | Event-to-quarter dividend-equivalent roll-forward or issuer explanation | Financial and liquidity analysis | Preserve each figure with its role and date; do not replace the event estimate with the quarter total without reconciliation | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 44 |
| G3 | Existing decision restrictions preserved | Actionable valuation, agency triggers, peer comparison and recovery | Loan identities do not uniformly match filed obligations; agency actions and comparable financial evidence are not established; the restructuring gate supplies no recovery valuation | Matched security observations, applicable agency publications, peer filings and valuation/legal evidence appropriate to each decision | Market, ratings, peer and restructuring analysis | No new preferred security, sizing, verified agency trigger or recovery percentage is cleared | Peer benchmark (CP-1C); Ratings & triggers (CP-2H); Market-implied risk (CP-3D); Recovery & fulcrum (CP-4C); Security selection (CP-3) |
| G4 | Review boundary; no additional exception assigned | Forecast funding interpretation | A cumulative-FCF shortfall against a maturity wall does not alone establish a financing necessity when opening cash and operating minimums are separate inputs. No independent exhaustive forecast reconstruction is claimed | Explicit total available-cash bridge, dated funding events and operating-cash minimum before relying on an absolute financing-necessity statement | Forecast and refinancing analysis | Treat scenarios as assumptions and distinguish FCF-only comparisons from cash available to meet maturities | Forward credit model (CP-2G); Refinancing & LME (CP-3C) |

## Next module

The orchestrator selects the next module.