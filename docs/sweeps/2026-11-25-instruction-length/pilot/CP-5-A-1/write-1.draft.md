---
issuer_id: tdg
module_id: CP-5
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
committee_status: Restricted
traceability_scope: Top 5
---

## Request

Evidence validation for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is the claim-to-source trace of the five most material credit drivers across every supplied analysis, reproduction of the calculations behind them, cross-analysis consistency, and the research-integrity grade and committee clearance that follow; no credit conclusion is changed.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 (auditor report date) | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Direct verification of top-driver figures: special dividends and capital-allocation order, cash liquidity and pro forma liquidity, covenant summary, dividend payment detail, contractual obligations, EBITDA reconciliation, balance sheet, cash interest, maturity ladder, guarantor sales, lease schedule |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 (after the as-of date) | 2025-02-04 (signature date, as recorded by Source readiness) | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Verification of the second October 2024 dividend figure and the quarter's share repurchases; subsequent-event evidence only |
| TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 29 June 2024 | 2024-08-06 (signature date, as recorded by Source readiness) | ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2 | Identity and hash check against the pinned list only; not reopened |
| TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 30 March 2024 | 2024-05-07 (signature date, as recorded by Source readiness) | fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6 | Identity and hash check against the pinned list only; not reopened |
| TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | Annual report to shareholders (PDF) reproducing the Form 10-K for fiscal 2024 | not stated | dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af | Identity and hash check only; excluded duplicate per Source readiness |

| Handoff | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate, effective source set and gap statements audited |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Leverage anchor, debt and EBITDA build, post-balance-sheet adjustment traced and recalculated |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Distribution-policy driver traced; interest-cover definition checked |
| Earnings changes (CP-1B) | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | Earnings-delta lineage sampled; constructed-quarter limitation noted |
| Research questions (CP-DR) | f7ebcff4948d7c1303dbe93be2415859b4244722e9b3b4d14d0e2b18c8488d80 | Issuer-only sector evidence and peer-table gaps checked |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Blocked status and absence of peer valuation confirmed |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported-EBITDA driver traced; stock-compensation sensitivity recalculated |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Driver ranking and forward free cash flow illustration checked |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Covenant thresholds verified; headroom lineage classified |
| Downside (CP-2A) | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | Stress inputs and break points sampled; source-gate statement checked |
| Rates, FX & hedging (CP-2E) | 07fc638c1461ff2144da31f25ac8824dc06bb001433c5122f5b06f1ba3bc8647 | Rate-sensitivity conflict and hedge lineage checked |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Liquidity driver traced; amortisation conflict checked |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Forward free cash flow definition compared across analyses |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Rating-label lineage checked against pinned sources and run settings |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Quote lineage checked; blocked status confirmed |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Maturity wall and funding-gap lineage traced |
| Recovery & fulcrum (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Not-applicable distress gate traced to covenant compliance and liquidity statements |
| Security selection (CP-3) | c4f7926ca861f1605b74a442853b15d09a9fbb4e5fb49389e26ac32363f13683 | Relative-value lineage checked; quote-file dependence identified |

## Findings

### Bottom line

Evidence behind the five decisive TransDigm credit drivers traces to the audited 2024 annual report and the headline figures reproduce, so the credit view can be used, but committee use stays restricted until four material provenance defects are disclosed or fixed.

Net debt of USD 18,619 million at year end becomes USD 22,967 million pro forma for the 2024-10-18 dividend payment, taking net leverage from 4.88x to 6.02x; that anchor, the distribution policy, the 7.25x and 5.00x incurrence tests and USD 2,919 million of pro forma liquidity all match the filing. The most important provenance gap is the absence of the executed credit agreement, indentures and intercreditor agreement, which leaves covenant headroom, priming capacity and recovery indicative. Rating and loan-market evidence in three later analyses partly rests on a quote file outside this run's pinned sources, and the earnings-quality stock-compensation sensitivity is overstated at 0.39x against a reproduced 0.31x.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; Financial foundation (CP-1); Earnings quality (CP-1D); calculation V2; calculation V3; calculation V4; calculation V8; calculation V11

### Key findings

- The leverage anchor is fully traceable and can carry every later leverage figure. Debt of USD 24,880 million, net debt of USD 18,619 million (USD 22,967 million pro forma for the 2024-10-18 payment), reported EBITDA of USD 3,813 million and EBITDA As Defined of USD 4,173 million reproduce from the audited balance sheet, the dividend note and the EBITDA reconciliation, giving 6.02x on reported EBITDA and 5.50x on EBITDA As Defined.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; Financial foundation (CP-1); calculation V1; calculation V2; calculation V3; calculation V4; calculation V5; calculation V10

- The distribution-policy driver is directly sourced, and its reading as repeatable policy is correctly labelled as interpretation. The annual report records USD 3,000 million of senior secured debt issued on 2024-09-19 concurrently with the USD 75.00 special dividend, payments of about USD 4,348 million, and an excess-cash order that puts debt prepayment fourth of four.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; Business & governance (CP-1A)

- The covenant driver is the weakest link in the top five because its headroom rests on assumed definitions. The 7.25x net, 5.00x secured net and 7.50x springing thresholds, and the USD 364 million revolver trigger, match the filing, but the 0.78x secured headroom and about USD 3,244 million of indicative secured capacity depend on assumed cash netting and securitization treatment. The affected decisions are security selection, priming exposure and recovery; Legal & covenants owns the fix once the executed agreements are obtained.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4); calculation V14

- Rating and loan-market evidence has a lineage break, although no credit conclusion depends on it. The run settings carry five loan quotes and Moody's and S&P facility labels, but the peer loans, index levels, facility sizes, maturities and margins that Ratings & triggers, Market-implied risk and Security selection cite come from a quote file whose hash matches none of the pinned sources. Because no relative-value label, rating trigger or market inference was assigned from those rows, they are not orphan conclusions, but they cannot be presented to committee as evidence; Security selection owns the fix.
Basis: Ratings & triggers (CP-2H); Market-implied risk (CP-3D); Security selection (CP-3)

- Source readiness mis-states the run settings, and the error was repeated. It says the run settings leave ratings and prices blank, whereas they hold five loan quotes and two facility ratings; Fundamental credit and Downside repeat the absence. The inherited source gate is therefore wrong in one respect, though the quotes are labelled module-test transcriptions and change no credit conclusion.
Basis: Source readiness (CP-0); Fundamental credit (CP-2); Downside (CP-2A)

- The earnings-quality underwriting anchor stands, but one sensitivity is miscalculated. Supported EBITDA of USD 3,871 million and pro forma net leverage of 5.93x reproduce; the claim that accepting stock compensation moves leverage by about 0.39x does not, because 5.93x less 5.62x is 0.31x. Security selection already declined to adopt that sensitivity.
Basis: Earnings quality (CP-1D); Security selection (CP-3); calculation V6; calculation V7; calculation V8; calculation V9

- The October payment conflict is preserved, not smoothed, in every analysis, and the filing points to its likely cause. The annual report states that dividend equivalents are paid in the first fiscal quarter each year, which is consistent with Earnings quality's inference that the USD 48 million gap equals accrued equivalents of USD 180 million less USD 132 million paid in October; the quarterly dividend note was not read, so the conflict remains open.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; Earnings quality (CP-1D); calculation V12; calculation V13

### Contrary evidence and what would change the view

The strongest case that the work is already committee-ready is that every analysis discloses its own limitations, no material conclusion is left without a source or a limitation flag, and each defect found here sits away from the credit thesis: the market and rating rows were never used to assign a value label, the miscalculated sensitivity was not adopted by security selection, and the conflicting October figures differ by USD 48 million against USD 22,967 million of pro forma net debt. On that reading the four material findings are disclosure items, and a committee deciding only on the fundamental view could proceed. That view would win once Earnings quality restates the sensitivity, Source readiness corrects its description of the run settings and the quote-dependent rows are either sourced into the pinned set or removed. It would lose, and restriction would harden toward a block, if the executed agreements showed definitions that move the 5.00x secured test materially, because the subordinated-note exposure that drives security selection rests on that test, or if the off-set quote rows were later used to label any instrument cheap or rich.
Basis: Earnings quality (CP-1D); Legal & covenants (CP-4); Security selection (CP-3); calculation V3; calculation V12

### Limitations

- The trace covers the five most material drivers; secondary claims such as sector frameworks, hedge mechanics and the constructed fourth quarter were sampled, not traced line by line, so the clearance applies to the decision-driving figures and a defect in an untraced secondary claim could add findings without changing the top-five classification.
- The March and June 2024 quarterly reports and the PDF annual report were not reopened, so lineage that rests only on them, chiefly the nine-month figures behind the constructed quarter, is classified on the stated inputs rather than re-read; a transcription error there would move those claims from calculated to weak lineage.
- The quote file cited by three analyses could not be opened, so whether it is the maintained sector loan source is not established; if it is, its loan rows would be treated as current and sourced, which would downgrade the market-lineage finding from material to minor.
- Page locators cited by later analyses were checked where they carry a top-five figure; other locators were accepted when the figure was internally consistent, so the traceable classification of non-driver claims is a consistency judgement, not a page-by-page confirmation.

### Overall traceability view

Overall, evidence traceability is Ready with Remediation. Of the five material credit drivers, two are directly sourced, one is calculated, one is assumption-based and one is an analyst inference, and none is a weak-lineage, untraced, conflicting or insufficient-information item. The most important provenance gap is the absence of the executed credit agreement, indentures and intercreditor agreement, which matters because covenant headroom, the amount of equal-ranking secured debt that can be layered ahead of the subordinated notes and the enforcement split within the secured class all rest on the issuer's summary, and implies that security selection and any recovery-based sizing can go to committee only as conditional, while the fundamental view can go with disclosed limitations.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4); Financial foundation (CP-1)

### Remediation priority map

- Must fix before committee: disclose, beside every covenant headroom and secured-capacity figure, that it rests on assumed definitions until the executed agreements are read; restate the earnings-quality stock-compensation sensitivity at 0.31x or define the basis that gives 0.39x; and either bring the quote file into the pinned source set or strip its peer, index, size, maturity and margin rows from committee material.
- Must fix before later analyses rely on these outputs: correct Source readiness so that it records the five loan quotes and two facility ratings in the run settings as module-test transcriptions, and carry that correction into the source statements of Fundamental credit and Downside.
- Monitoring follow-up: reconcile the October payment from the December 2024 quarterly dividend note; reconcile the issuer's rate sensitivity with the rates analysis; explain the term amortisation difference between the contractual-obligations table and the maturity ladder.
- Formatting and hygiene: align the dividend-equivalent figure across analyses, label the interest denominator in every cover ratio, give the three forward free cash flow illustrations a common definition note, and remove the incurrence ratio slip in Source readiness prose.

### Clearance decision

CLEARANCE DECISION: Pass with Remediation. Critical Issues: 0. Material Issues: 4. Minor Issues: 6. Committee Use: Restricted.

No finding changes a credit conclusion, an economic figure in the thesis or a recovery ranking, so nothing is critical. Committee use is permitted only with explicit disclosure of the four material issues: the covenant headroom resting on assumed definitions, the market and rating rows sourced outside the pinned set, the incorrect description of the run settings in the source gate, and the miscalculated stock-compensation sensitivity.

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 5 |
| Calculated | 5 |
| Assumption-Based | 1 |
| Analyst Inference | 2 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 2 |
| Fields present | 8 |
| Fields total | 8 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 4 |
| MINOR | 6 |

### Map: support and contradiction

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Annual report capital-allocation text | Ranks debt prepayment last; records debt-funded dividend | Supports | Distribution-policy driver | Sept 2024 USD 3,000m issue with USD 75.00 dividend |
| Audited balance sheet and EBITDA bridge | Inputs reproduce 6.02x pro forma | Supports | Pro forma net leverage driver | 22,967 over 3,813 recalculated |
| Annual report covenant summary | States 7.25x, 5.00x and 7.50x tests | Supports | Covenant protection driver | Thresholds match the filing |
| Executed debt documents absent | Headroom rests on assumed definitions | Unresolved | Covenant protection driver | Secured headroom indicative only |
| Annual report liquidity note | States USD 2,919m pro forma liquidity | Supports | Liquidity driver | Figure matches Liquidity analysis |
| Recalculated stock-comp sensitivity | Gives 0.31x, not 0.39x | Contradicts | Supported earnings driver | 5.93x less 5.62x |
| Run settings loan quotes and ratings | Show quotes and facility ratings exist | Contradicts | Source readiness no-prices statement | Five quotes and two facility ratings |
| Quote file outside pinned sources | Supplies peer, index and size rows | Unresolved | Rating and relative-value analyses | Hash matches no pinned source |
| Quarterly cash-flow dividend line | Shows USD 4,396m in the quarter | Unresolved | October dividend of USD 4,348m | USD 48m gap not reconciled |
| First-quarter dividend equivalent practice | Consistent with the USD 48m gap | Supports | Accrued-equivalents inference | Accrued 180 less 132 paid |

### Analytical appendix — complete canonical registers

#### T5B.1 Source register and module status

| Source Document ID | Source Document Name | Source Quality | Period | Entity Covered | Data Supplied | Limitation | Downstream Use | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | High: audited, unqualified opinion dated 2024-11-07 | Fiscal year ended 2024-09-30 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrower and note issuer | Balance sheet, EBITDA reconciliation, special dividends, capital-allocation order, liquidity and pro forma liquidity, covenant summary, contractual obligations, maturity ladder, guarantor sales, cash interest, leases | Executed credit agreement, indentures and intercreditor agreement incorporated by reference only; published after the as-of date | Direct verification of all five top drivers | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56 |
| S2 | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Medium-high: unaudited primary filing | Quarter ended 2024-12-28, after the as-of date | Same consolidated group | Dividends and dividend equivalent payments USD 4,396 million; repurchases USD 316 million | Subsequent period; never blended into FY2024 | Verification of the second October figure | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| S3 | TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Medium-high: unaudited | Nine months to 2024-06-29 | Same consolidated group | Nine-month figures used by earnings and research analyses | Not reopened in this trace | Identity and hash confirmed only | TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl |
| S4 | TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | Medium-high: unaudited | Six months to 2024-03-30 | Same consolidated group | Interim coverage | Not used by any top driver; not reopened | Identity and hash confirmed only | TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl |
| S5 | TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | Same content as S1 | Fiscal 2024 | Same consolidated group | Duplicate of S1 | Containment checked by Source readiness on sampled pages only | Excluded duplicate; identity and hash confirmed | TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf |
| X1 | TDG market quotes 2024-09-30.md (hash fc1e0d6fe55bf91fa3ac3ef6f7791e5c04f8f9089d5cdf079177b9c7f88f7aea) | Not in the pinned source set; hand transcription with an assigned date | Assigned 2024-09-30 | TransDigm facilities, aerospace peers and loan indices | Facility labels, loan quotes, peer and index spreads, facility sizes, maturities and margins | Only the five TransDigm quotes and two facility ratings are reproduced in the run settings; the remaining rows cannot be traced in this run | Flagged; not admissible as committee evidence until pinned | Not supplied: not a pinned source |

Module status: Ready with Limitations. Traceability scope: Top 5. Entity key: issuer identifier tdg available and consistent across all eighteen analyses; as-of date 2024-09-30 consistent; subsequent events carry their own dates in every analysis reviewed.

#### T5B.2 Credit driver ranking

| Rank | Credit Driver | Originating Module | Source-Supported Basis | Why Material | Committee Relevance | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Debt-funded distribution policy | Business & governance (CP-1A); Fundamental credit (CP-2) | USD 110.00 of special dividends declared in FY2024; USD 3,000 million secured debt issued 2024-09-19 with the USD 75.00 dividend; debt prepayment fourth in excess-cash order | Converts EBITDA growth into distributions and adds secured claims without EBITDA | Sets the leverage path and subordinated-note loss severity | Pages 54 and 56 read directly | Restricted-payment basket size not established | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56 |
| 2 | Pro forma net leverage 6.02x on reported EBITDA (4.88x at year end) | Financial foundation (CP-1) | Debt USD 24,880 million, cash USD 6,261 million, payment USD 4,348 million, reported EBITDA USD 3,813 million | The leverage anchor every later analysis uses | Decides how much growth is needed before refinancing | Pages 63, 71 and 120 read; recalculated | Contractual net debt definition not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| 3 | Supported EBITDA USD 3,871 million and 5.93x pro forma net leverage | Earnings quality (CP-1D) | Add-backs of USD 70 million, USD 217 million, USD 58 million and USD 15 million in the issuer reconciliation | Removes 0.43x of apparent headroom from the issuer measure | Underwriting base for leverage tolerance | Page 71 read; arithmetic reproduced | Add-back verdicts are analyst judgement; one sensitivity miscalculated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| 4 | Incurrence ratios as the binding brake on secured layering | Legal & covenants (CP-4) | Incurrence 7.25x net and 5.00x secured net; springing 7.50x above USD 364 million revolver usage | Limits equal-ranking secured debt ahead of subordinated notes | Security selection and recovery | Page 62 read; headroom recalculated | Executed agreements absent; headroom indicative | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| 5 | Adequate near-term liquidity with a later maturity wall | Liquidity (CP-2D); Refinancing & LME (CP-3C) | Pro forma cash liquidity USD 2,919 million; no term loan or note maturity before November 2027; FY2028 and FY2029 maturities USD 11,405 million | Separates low near-term default risk from refinancing dependence | Default probability and refinancing posture | Pages 56, 64 and 153 read | Forward free cash flow is an analyst estimate | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |

#### T5B.3 Traceability map

| Credit Driver / Conclusion | Originating Module | Source Evidence | Citation Present? | Source Quality | Classification | Claim Status | Confidence Level | Traceability Status | Source |
|---|---|---|---|---|---|---|---|---|---|
| Debt-funded distribution policy | Business & governance (CP-1A) | USD 3,000 million secured debt issued 2024-09-19 concurrently with the USD 75.00 special dividend; payments about USD 4,348 million; excess-cash order puts debt prepayment fourth | Yes | High: audited filing | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56 |
| Pro forma net leverage 6.02x; year-end 4.88x; net debt USD 18,619 million, pro forma USD 22,967 million; 5.50x on EBITDA As Defined | Financial foundation (CP-1) | Balance-sheet debt and cash, EBITDA reconciliation, October payment of USD 4,216 million plus USD 132 million | Yes | High | Calculated | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 63, 71, 120 |
| Supported EBITDA USD 3,871 million; pro forma net leverage 5.93x | Earnings quality (CP-1D) | Issuer add-backs read directly; exclusion verdicts are judgement; stock-compensation sensitivity stated as about 0.39x | Yes | High inputs; analyst judgement on verdicts | Analyst Inference | Partially Supported | Medium | Remediation Needed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| Incurrence 7.25x and 5.00x; springing 7.50x above USD 364 million; secured headroom 0.78x, about USD 3,244 million | Legal & covenants (CP-4) | Thresholds read directly; headroom assumes cash netting and excludes the securitization | Partial | Medium: issuer summary of unseen agreements | Assumption-Based | Partially Supported | Low | Remediation Needed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Pro forma cash liquidity USD 2,919 million; no term maturity before November 2027; FY2028 and FY2029 maturities USD 11,405 million | Liquidity (CP-2D); Refinancing & LME (CP-3C) | Liquidity note, contractual obligations table and maturity ladder | Yes | High | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56, 64, 153 |
| Restructuring not applicable | Recovery & fulcrum (CP-4C) | Covenant compliance at 2024-09-30 and management funding statement | Yes | High | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56, 62 |
| Facility labels Ba3 and BB- | Ratings & triggers (CP-2H) | Run settings carry the two labels; the cited quote file is not pinned | Partial | Low: secondary, undated action | Weak Lineage | Partially Supported | Low | Remediation Needed; limitation flagged by the originating analysis, so not an orphan claim | Ratings & triggers (CP-2H) |
| Peer, index, size, maturity and margin rows behind loan spread comparisons | Market-implied risk (CP-3D); Security selection (CP-3) | Present only in a file outside the pinned set; not in run settings | No | Not assessable in this run | Untraced | Unsupported | Low | Not Traceable; limitation flagged and no value label assigned, so not an orphan claim | Security selection (CP-3) |
| Run settings leave ratings and prices blank | Source readiness (CP-0) | Run settings hold five loan quotes and two facility ratings | Yes | High for the contrary record | Conflicting | Conflicting | Low | Remediation Needed | Source readiness (CP-0) |
| October payment USD 4,348 million against USD 4,396 million | Financial foundation (CP-1); Liquidity (CP-2D) | Annual report figure and December 2024 quarterly cash-flow line | Yes | High | Conflicting | Conflicting | Medium | Remediation Needed; logged as one conflict in each analysis | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| FY2025 free cash flow illustrations USD 1,514 million, USD 1,482.1 million and USD 1,401.1 million | Fundamental credit (CP-2); Forward credit model (CP-2G); Refinancing & LME (CP-3C) | Each built on a stated, different definition | Yes | Medium: analyst estimates | Calculated | Supported | Medium | Committee-Ready with definitions disclosed | Forward credit model (CP-2G) |

#### T5.3 Math, logic and definition audit

| Severity | Module | Metric / Logic Issue | Formula / Definition Issue | Source Conflict | Required Fix | Clearance Impact | Source |
|---|---|---|---|---|---|---|---|
| MATERIAL | Earnings quality (CP-1D) | Stock-compensation effect on pro forma net leverage stated as about 0.39x | 22,967 / 4,088 gives 5.62x; 5.93x less 5.62x is 0.31x; the stated basis for 0.39x is undefined and its own calculation shows 0.3150 | None: internal arithmetic | Restate at 0.31x or define the comparison that gives 0.39x | Restricts Committee Use | Earnings quality (CP-1D) |
| MATERIAL | Legal & covenants (CP-4) | Secured headroom 0.78x and indicative capacity about USD 3,244 million | Numerator assumes cash of USD 1,913 million is nettable and the securitization is not secured debt; denominator is EBITDA As Defined, not the contractual measure | Annual report summary only; executed definitions absent | Recompute from the executed credit agreement definitions | Requires Legal Review | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| MINOR | Financial foundation (CP-1); Business & governance (CP-1A); Liquidity (CP-2D) | October payment one event, several figures | USD 4,348 million (annual report: USD 4,216 million plus USD 132 million); USD 4,347 million with USD 131 million of equivalents; USD 4,396 million for the whole quarter | Annual report against December 2024 quarterly report | Reconcile from the quarterly dividend note; test the first-quarter dividend-equivalent explanation | Requires Source Reconciliation | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| MINOR | Fundamental credit (CP-2); Forward credit model (CP-2G); Refinancing & LME (CP-3C) | FY2025 free cash flow at USD 1,514 million, USD 1,482.1 million and USD 1,401.1 million | Different definitions: constant-flow illustration, model definition after stock compensation, and operating inflow before pension and lease uses | None; each labelled | Add a common definition note | Monitoring Follow-Up | Forward credit model (CP-2G) |
| MINOR | Rates, FX & hedging (CP-2E) | Plus 100 bp cash-interest sensitivity USD 57.89 million against issuer USD 30 million | Method uses unhedged floating balance; issuer method not disclosed | Issuer market-risk disclosure | Reconcile the issuer's convention | Monitoring Follow-Up | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| MINOR | Business & governance (CP-1A) | Interest cover 3.24x | Uses interest expense USD 1,286 million; Financial foundation uses cash interest USD 1,158 million (3.29x reported, 3.60x As Defined) | None; definitional | Label the denominator in every cover ratio | Formatting / Hygiene Only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 123 |
| MINOR | Liquidity (CP-2D) | FY2025 term amortisation USD 88 million against ladder USD 93 million | Contractual-obligations table versus maturity ladder scope | Two tables in the annual report | Explain the USD 5 million difference | Monitoring Follow-Up | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 64, 153 |
| MINOR | Source readiness (CP-0) | Incremental test stated as 7.50x in prose | Annual report states 7.25x; 7.50x is the springing test | Corrected by later analyses | Correct the prose | Formatting / Hygiene Only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

#### Provenance triggers

| Unsupported claim | Critical provenance gap | Affected decision | Remediation owner | Source |
|---|---|---|---|---|
| Secured headroom 0.78x and about USD 3,244 million of secured capacity | Executed credit agreement, indentures and intercreditor agreement | Security selection; subordinated-note recovery; priming exposure | Legal & covenants | Legal & covenants (CP-4) |
| Peer and index spread differences and facility identities | Quote file outside the pinned source set | Relative value and implementation | Security selection | Security selection (CP-3) |
| Absence of ratings and prices in the source gate | Run settings misdescribed | Ratings and market-evidence scope | Source readiness | Source readiness (CP-0) |
| Stock-compensation sensitivity of about 0.39x | Arithmetic not reproducible | Leverage tolerance sensitivity | Earnings quality | Earnings quality (CP-1D) |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| V1 | Total debt at carrying value | 98 + 486 + 24296 | 24880 | 2024-09-30, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| V2 | Net debt at year end | 24880 − 6261 | 18619 (USD 18,619 million) | 2024-09-30, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| V3 | Pro forma net debt after the 2024-10-18 payment | 18619 + 4348 | 22967 (USD 22,967 million) | 2024-09-30 pro forma, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| V4 | Pro forma net debt / reported EBITDA | 22967 / 3813 | 6.0233 (6.02x) | FY2024 pro forma, x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| V5 | Pro forma net debt / EBITDA As Defined | 22967 / 4173 | 5.5037 (5.50x) | FY2024 pro forma, x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| V6 | Pro forma net debt / supported EBITDA (USD 3,871 million) | 22967 / 3871 | 5.9331 (5.93x) | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V7 | Pro forma net debt / supported EBITDA plus stock compensation (USD 4,088 million) | 22967 / 4088 | 5.6182 (5.62x) | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V8 | Stock-compensation effect on pro forma net leverage | 5.9331 − 5.6182 | 0.3149 (0.31x) | FY2024 pro forma, x | calculation V6; calculation V7 |
| V9 | Overstatement of the stated 0.39x sensitivity | 0.39 − 0.3149 | 0.0751 (0.08x) | FY2024 pro forma, x | calculation V8 |
| V10 | EBITDA bridge to EBITDA As Defined | 3813 + 70 + 217 + 58 + 15 | 4173 (USD 4,173 million; equals filing) | FY2024, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| V11 | Pro forma cash liquidity tie-out | 7267 − 4348 | 2919 (USD 2,919 million; equals filing) | 2024-09-30 pro forma, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56 |
| V12 | Gap between the two October payment figures | 4396 − 4348 | 48 (USD 48 million) | Q1 FY2025 against annual report, USD million | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| V13 | Accrued current dividend equivalents less October equivalents paid | 180 − 132 | 48 (USD 48 million) | 2024-09-30, USD million | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| V14 | Pro forma secured net debt / EBITDA As Defined | 17621 / 4173 | 4.2226 (4.22x; 0.78x below 5.00x) | FY2024 pro forma, x | Legal & covenants (CP-4) |
| V15 | Reported EBITDA / next-year scheduled interest | 3813 / 1524 | 2.5020 (2.50x) | FY2024 against FY2025 schedule, x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 64 |
| V16 | Maturity ladder total | 93 + 92 + 92 + 6637 + 4768 + 12637 | 24319 (equals filing) | 2024-09-30, USD million principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 153 |
| V17 | FY2028 and FY2029 share of the ladder | 11405 / 24319 | 0.4690 (46.90%) | 2024-09-30, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 153 |
| V18 | Guarantor group share of net sales | 6294 / 7940 | 0.7927 (79.27%) | FY2024, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| V19 | Forward free cash flow, model definition less funding-test definition | 1482.1 − 1401.1 | 81.0 (USD 81 million) | FY2025 estimates, USD million | Forward credit model (CP-2G); Refinancing & LME (CP-3C) |
| V20 | Forward free cash flow, constant-flow illustration less funding-test definition | 1514 − 1401.1 | 112.9 (USD 112.9 million) | FY2025 estimates, USD million | Fundamental credit (CP-2); Refinancing & LME (CP-3C) |
| V21 | Rate sensitivity, method less issuer figure | 57.89 − 30 | 27.89 (USD 27.89 million) | Annual, USD million | Rates, FX & hedging (CP-2E) |
| V22 | Stock compensation share of EBITDA As Defined | 217 / 4173 | 0.0520 (5.20%) | FY2024, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |

These calculations test whether the stated figures reproduce from the filing; none creates a new credit metric. Every top-driver figure reproduced exactly except the stock-compensation sensitivity. The secured-headroom ratio reproduces arithmetically, but its inputs rest on assumed contractual definitions.

## Gaps

| Gap | Why it matters | Conclusion affected | Severity | Remediation owner |
|---|---|---|---|---|
| Executed credit agreement, amendments, guarantee and collateral agreement, indentures and intercreditor agreement not in the source set | Covenant headroom, secured capacity, priming routes and enforcement control cannot be traced to clauses | The covenant driver stays assumption-based and security selection stays conditional | MATERIAL | Legal & covenants |
| Quote file cited by three analyses is not a pinned source | Peer, index, facility size, maturity and margin rows cannot be traced in this run | Market and rating rows are excluded from committee evidence | MATERIAL | Security selection |
| Source readiness describes the run settings as blank for ratings and prices | The inherited source gate is wrong in one respect and was repeated by two analyses | Source-gate statements in Fundamental credit and Downside need correction | MATERIAL | Source readiness |
| Stock-compensation sensitivity in Earnings quality does not reproduce | A committee-facing leverage sensitivity is overstated by 0.08x | Earnings quality sensitivity only; the 5.93x anchor stands | MATERIAL | Earnings quality |
| December 2024 quarterly dividend note not read | The USD 48 million October gap remains unreconciled | No conclusion changes; pro forma figures use the annual report amount | MINOR | Liquidity |
| March and June 2024 quarterly reports and the PDF annual report not reopened | Constructed-quarter inputs are classified on stated figures | Earnings-trajectory claims stay calculated on stated inputs | MINOR | Earnings changes |
| Whether the quote file is the maintained sector loan source is not established | If it is, its loan rows would count as current and sourced | Severity of the market-lineage finding | MINOR | Security selection |
| Use restriction | This grade covers evidence lineage only; it is not a credit opinion, rating, legal opinion or trade recommendation, and committee use must carry the four material disclosures | All uses | MINOR | Committee decision |

## Next module

The orchestrator selects the next module.
