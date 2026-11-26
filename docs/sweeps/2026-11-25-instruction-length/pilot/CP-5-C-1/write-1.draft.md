---
issuer_id: tdg
module_id: CP-5
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Ready with Limitations
traceability_scope: Top 5
qa_phase_status: Ready with Limitations
committee_status: Restricted
---

## Request

Evidence validation for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is the claim-to-source trace of the five most material credit drivers across the eighteen analyses supplied for this run, followed by a research-integrity grading of what the trace found; no credit conclusion is changed.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Spot verification of the cited figures behind the five drivers: capital allocation order and October 2024 payment, pro forma cash liquidity, guarantor sales, incurrence and springing tests, scheduled interest, interest-rate sensitivity, dividends payable, maturity ladder |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 (after the as-of date) | 2025-02-04 | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Subsequent-event check of the October 2024 payment figures: cash-flow line and dividend-equivalent note used to test the run-wide unreconciled difference |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source inventory and gate; tested against the run settings and later analyses |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Leverage, net debt, pro forma adjustment, debt basis and conflict register traced |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Financial-policy driver and October payment conflict log traced |
| Earnings changes (CP-1B) | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | Earnings deltas and constructed fourth quarter checked for definition consistency |
| Research questions (CP-DR) | f7ebcff4948d7c1303dbe93be2415859b4244722e9b3b4d14d0e2b18c8488d80 | Issuer-only sector evidence and peer-table gaps recorded |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Blocked status recorded; peer-relative claims restricted |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported-earnings driver traced; arithmetic recomputed |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Synthesis claims traced to their originating analyses |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Secured-capacity driver traced; legal-support level graded |
| Downside (CP-2A) | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | Stress interest basis compared with the hedging analysis |
| Rates, FX & hedging (CP-2E) | 07fc638c1461ff2144da31f25ac8824dc06bb001433c5122f5b06f1ba3bc8647 | Rate-sensitivity conflict traced to the annual report |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Liquidity driver and bridge traced; payment conflict tested |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Downside interest basis compared; assumption register read |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Rating-evidence lineage tested against the run settings |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Blocked status and quote-sheet lineage tested against the run settings |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Refinancing driver and funding-gap arithmetic traced |
| Recovery & fulcrum (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Not-applicable gate recorded; no recovery figures to trace |
| Security selection (CP-3) | c4f7926ca861f1605b74a442853b15d09a9fbb4e5fb49389e26ac32363f13683 | Relative-value lineage tested; peer and index rows traced to their cited sheet |

## Findings

### Bottom line

Traceability supports committee use with restrictions: the five decisive credit drivers trace to the audited 2024 annual report or reproducible arithmetic, but five material defects, led by covenant and capacity conclusions resting on summaries rather than executed debt documents, must be disclosed.

No defect changes the credit view. Pro forma net leverage of 6.02x after the 2024-10-18 dividend payment recomputes exactly on net debt of USD 22,967 million, against USD 18,619 million at year end, and the distribution policy, the FY2028 maturities of USD 6,637 million and scheduled interest of USD 1,524 million tie to the annual report. The restriction attaches to the secured-capacity and recovery conclusions, to market and peer rows that cannot be traced to the files supplied, and to two figures that disagree between analyses: a stock-compensation leverage effect stated as 0.39x against 0.31x recomputed, and a rate shock of USD 30 million in the stress cases against USD 57.89 million in the hedging work.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–64; Financial foundation (CP-1); calculation V4; calculation V5; calculation V8; calculation V13

### Key findings

- The financial-policy driver is the best-evidenced conclusion in the run and can go to committee as stated. The annual report itself ranks debt prepayment last in the use of excess cash and records the September 2024 issuance of USD 3,000 million of secured debt alongside the special dividend paid in October 2024; the USD 6,368 million of FY2024 special distributions is the sum of two disclosed payments.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; Business & governance (CP-1A)

- The leverage anchor is reproducible, but the preferred underwriting figure rests on judgement rather than on the filing. Pro forma net leverage of 6.02x on reported EBITDA and 5.50x on EBITDA As Defined recompute exactly; the 5.93x on supported earnings is arithmetically correct but depends on the analyst's decision to reject acquisition costs and challenge stock compensation, so it is an analyst inference, clearly labelled as such.
Basis: Financial foundation (CP-1); Earnings quality (CP-1D); calculation V5; calculation V6; calculation V9

- The secured-capacity conclusion is the weakest link between evidence and committee consequence. The 7.25x, 5.00x and 7.50x tests are confirmed in the annual report, and the indicative pro forma secured ratio of 4.22x recomputes, but the conclusion that the secured test is the binding brake, and the roughly USD 3,244 million of capacity behind it, depend on definitions, baskets and intercreditor terms that no supplied document contains.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4); calculation V11

- A conflict carried as unreconciled by seven analyses is resolved by the December 2024 quarterly report. Its dividend note shows about USD 180 million of dividend equivalents paid in the quarter, USD 131 million of them tied to the September declaration, so the USD 4,396 million cash-flow line is the USD 4,216 million dividend plus all equivalents; the USD 49 million remainder is routine annual equivalents, not part of the special dividend. The pro forma figures stand, while the liquidity bridge omits that cash use and would end at USD 3,501.1 million instead of USD 3,550.1 million, which does not change its adequate rating.
Basis: TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 52; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; Liquidity (CP-2D); calculation V1; calculation V2; calculation V3; calculation V17

- Market and rating evidence is less traceable than the later analyses imply, in two opposite directions. The run settings do carry five TransDigm loan quote rows and two facility ratings, so Source readiness's statement that prices and ratings were blank is wrong and was repeated as a limitation in Fundamental credit. Conversely, the peer, index, facility-size and maturity rows cited by Ratings & triggers, Market-implied risk and Security selection come from a quote sheet that is not among the files supplied for this run, so they cannot be traced here; their conclusions are already restricted, which is why this is material rather than critical.
Basis: Source readiness (CP-0); Fundamental credit (CP-2); Ratings & triggers (CP-2H); Market-implied risk (CP-3D); Security selection (CP-3)

- Two numerical inconsistencies need correction before later work relies on them, though neither moves a conclusion. Earnings quality states that accepting stock compensation moves pro forma net leverage by about 0.39x, while its own inputs give 0.31x. The stress cases add the issuer's USD 30 million rate sensitivity to scheduled interest, giving USD 1,554 million, while the hedging analysis carries USD 57.89 million as its conservative bound, which would give USD 1,581.89 million, USD 27.89 million higher.
Basis: Earnings quality (CP-1D); Downside (CP-2A); Forward credit model (CP-2G); Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; calculation V7; calculation V8; calculation V13; calculation V15; calculation V16

### Contrary evidence and what would change the view

The strongest case for a clean pass is that every analysis that relies on summary legal evidence or unverified quotes says so in its own limitations, labels its capacity figures as indicative and withholds rankings, recoveries and sizing; on that reading the legal and market gaps are disclosed limitations, not defects, and the remaining findings are small internal inconsistencies. That view would win if committee materials carried those limitations verbatim, if the quote sheet were added to the pinned source set and matched the rows cited, and if the two arithmetic corrections were made. The strongest case for a harsher grade is that the secured-capacity conclusion is the mechanism through which the best-evidenced driver, debt-funded distributions, turns into loss for subordinated creditors, and it rests entirely on a filing summary; if the executed credit agreement shows a free-and-clear incremental basket or lien baskets that sit outside the secured ratio, that conclusion would be wrong in a way that changes security selection, and the finding would become critical. The executed documents would settle the question either way.
Basis: Legal & covenants (CP-4); Refinancing & LME (CP-3C); Security selection (CP-3)

### Limitations

- Figures were verified on a sample of annual-report and quarterly-report pages behind the five drivers, not on every cited locator in the eighteen analyses; the clearance therefore certifies the drivers and the defects found, and a full page-level check could add findings and lower the clearance.
- The quote sheet cited for peer, index and facility rows is not among the files supplied, so those rows are graded as not traceable here rather than as wrong; if the sheet is pinned and matches, the related material finding falls away and the material count drops by one.
- Without the executed debt documents the secured-capacity driver cannot be upgraded above analyst inference, so the committee-use restriction holds even if every other finding is corrected.
- This validation grades traceability only; it neither endorses nor alters any credit, legal or relative-value conclusion, so its clearance cannot be read as agreement with the underlying views.

### Traceability conclusion

Overall, evidence traceability is Ready with Remediation. Of the Top 5 material credit drivers, 2 are directly sourced, 1 is calculated, 0 are assumption-based, 2 are analyst inferences, and 0 are weak-lineage, untraced, conflicting, or insufficient-information items. The most important provenance gap is the absence of the executed credit agreement, note indentures, guarantee and collateral agreement and intercreditor agreement, which matters because secured incurrence capacity, guarantee release and payment blockage decide how much debt can rank ahead of the subordinated notes and how recovery is shared, and implies that the secured-capacity and recovery conclusions may reach committee only as disclosed, summary-based views. The policy, leverage and liquidity drivers can be relied on as stated.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4)

### Remediation priority

Must fix before committee: committee materials must state that covenant, capacity, guarantee and recovery conclusions rest on the annual report's summary of the debt documents, and the executed credit agreement, indentures, guarantee and collateral agreement and intercreditor agreement should be obtained so the legal analysis can be restated on clause-level evidence. The quote sheet behind the peer, index, size and maturity rows should be added to the pinned sources or those rows removed from committee material. Source readiness's statement that the run settings carried no prices or ratings should be corrected, together with the limitation repeated in Fundamental credit.

Must fix before later work relies on the analysis: Earnings quality should restate the stock-compensation leverage effect as 0.31x or show the formula behind 0.39x. The stress cases in Downside and Forward credit model should either adopt the hedging analysis's rate-shock basis or show both the USD 30 million and USD 57.89 million cases.

Monitoring follow-up: the October 2024 payment conflict rows should record the reconciliation from the December 2024 quarterly report, and the liquidity bridge should show the USD 49 million of routine first-quarter dividend equivalents as a separate cash use.

Formatting and hygiene: Source readiness's prose figure of 7.50x for the incurrence test should read 7.25x, and Earnings quality's agency-convention rows should be marked as unsourced analyst understanding of agency practice.
Basis: Source readiness (CP-0); Earnings quality (CP-1D); Downside (CP-2A); Liquidity (CP-2D); calculation V2; calculation V8; calculation V13

### Clearance decision

CLEARANCE DECISION: Pass with Remediation. Critical Issues: 0. Material Issues: 5. Minor Issues: 3. Committee Use: Restricted.

No finding is thesis-changing, because each affected conclusion is already restricted or the error is small, but the summary-only legal evidence and the untraceable market rows affect conclusions a committee would use for security selection. For committee use, the five material issues must be disclosed: the absence of executed debt documents, the untraced quote-sheet rows, the incorrect statement that the run settings held no prices or ratings, the stock-compensation sensitivity error and the inconsistent rate-shock basis.

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 5 |
| Calculated | 3 |
| Assumption-Based | 0 |
| Analyst Inference | 2 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 1 |
| Fields present | 8 |
| Fields total | 8 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 5 |
| MINOR | 3 |

### Map: support and contradiction

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Annual report capital allocation order | States debt prepayment ranks last after distributions | Supports | Debt-funded distribution policy | Excess cash order and October 2024 payment on the same page |
| Recomputed pro forma net debt USD 22,967m | Reproduces the year-end figure plus the October payment | Supports | Pro forma net leverage 6.02x | Net debt 18,619 plus 4,348 over EBITDA 3,813 |
| Annual report covenant summary | Confirms the 7.25x, 5.00x and 7.50x thresholds only | Unresolved | Secured test is the binding brake | Baskets and definitions absent from all documents |
| December 2024 quarterly dividend note | Splits the quarter's payments into dividend and equivalents | Contradicts | October payment gap left unreconciled | 4,216 plus 180 equals 4,396; 131 tied to the special dividend |
| Recomputed stock-compensation effect 0.31x | Gives a smaller effect than the stated figure | Contradicts | Stock compensation lifts leverage about 0.39x | 5.93x less 5.62x from the analysis's own inputs |
| Issuer rate sensitivity USD 30m | Disagrees with the hedging analysis's bound | Contradicts | Hedging +100 bp cost USD 57.89m | Annual report market-risk section versus unhedged-balance arithmetic |
| Run settings quote and rating rows | Show five loan quotes and two facility ratings | Contradicts | No prices or ratings supplied | Source readiness statement repeated in Fundamental credit |
| Quote sheet outside pinned sources | Cannot be opened in this validation | Unresolved | Peer, index and facility-size rows | Cited by Ratings & triggers, Market-implied risk, Security selection |
| Annual report maturity ladder | States FY2028 and FY2029 principal due | Supports | Refinancing wall drives default timing | FY2028 6,637 and FY2029 4,768 in the issuer schedule |

### QA checklist results

| Check | Result | Evidence | Source |
|---|---|---|---|
| Carrying-value debt basis | Applied | Total debt USD 24,880 million at carrying value; principal USD 25,068 million and the USD 188 million difference logged, not substituted | Financial foundation (CP-1) |
| Missing values kept as missing | Applied in sampled tables | Missing items shown as Not supplied with the row retained; no false zero found in the registers read | Financial foundation (CP-1); Liquidity (CP-2D) |
| Multi-figure event logged once with all figures | Partly applied | October payment logged as one conflict row with USD 4,348 million and USD 4,396 million; the USD 4,347 million component split appears only in Business & governance | Financial foundation (CP-1); Business & governance (CP-1A) |
| Subsequent events kept outside period figures | Applied | 2024-10-16 securitization draw and 2024-10-18 payment shown separately with dates | Financial foundation (CP-1) |
| Pro forma beside year-end net debt | Applied | USD 18,619 million year end shown with USD 22,967 million pro forma in every analysis sampled | Financial foundation (CP-1); Security selection (CP-3) |
| Covenant capacity not inferred as contractual | Applied with disclosure | Headroom labelled indicative and not a compliance calculation | Legal & covenants (CP-4) |

### Analytical appendix — complete canonical registers

#### T5B.1 Source Register

<!-- table-id: T5B.1 -->
| Source Document ID | Source Document Name | Source Quality | Period | Entity Covered | Data Supplied | Limitation | Downstream Use | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | Form 10-K FY2024, audited | High: audited, unqualified opinion | FY ended 2024-09-30; signed 2024-11-07 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrower and issuer | Pages 54, 56, 59, 62, 64, 73, 120, 153 read or searched to verify driver figures | Debt agreements incorporated by reference only; published after the as-of date | Verification of drivers 1, 2, 4 and 5 and of the rate-sensitivity conflict | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–73 |
| S2 | Form 10-Q Q1 FY2025, unaudited | Medium-high: unaudited | Quarter to 2024-12-28; signed 2025-02-04 | Consolidated | Cash-flow line USD 4,396 million; dividend-equivalent note USD 180 million and USD 131 million | Subsequent period; not blended into FY2024 | Reconciliation of the October 2024 payment conflict | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 4, 52 |
| S3 | Form 10-Q Q3 FY2024 | Medium-high: unaudited | Nine months to 2024-06-29 | Consolidated | Not read in this validation | Lineage of constructed fourth quarter taken as stated by Earnings changes | None beyond lineage record | Earnings changes (CP-1B) |
| S4 | Form 10-Q Q2 FY2024 | Medium-high: unaudited | Six months to 2024-03-30 | Consolidated | Not read in this validation; not relied on by any traced driver | None | None | Source readiness (CP-0) |
| S5 | Annual report to shareholders PDF | Same content as S1 | FY2024 | Consolidated | Not read; excluded as a duplicate by Source readiness | Containment checked on sampled pages only | None | Source readiness (CP-0) |
| A1 | Source readiness analysis | Medium: inventory misstates run-settings prices and ratings | As of 2024-09-30 | Effective source set | Source gate partial; event dates | Run settings do carry five quote rows and two facility ratings | Gate and gap baseline | Source readiness (CP-0) |
| A2 | Financial foundation analysis | High | FY2024, FY2023; pro forma 2024-10-18 | Consolidated | Leverage, net debt, debt basis, conflict register | Covenant definitions absent | Driver 2 | Financial foundation (CP-1) |
| A3 | Business & governance analysis | High | FY2024 with subsequent events | Consolidated; ownership chain | Distribution policy, transactions, payment conflict log | Proxy not supplied | Driver 1 | Business & governance (CP-1A) |
| A4 | Earnings changes analysis | High | FY2024 vs FY2023; constructed fourth quarter | Consolidated | Earnings deltas | Fourth quarter by difference | Context only | Earnings changes (CP-1B) |
| A5 | Research questions analysis | Medium: issuer-only evidence | FY2024 | Issuer and sector | Competition, demand, regulation | No independent source; peer tables empty | Context only | Research questions (CP-DR) |
| A6 | Peer benchmark analysis | Low: blocked | FY2024 | No peer | Borrower metrics only | No usable peer | Restricts peer-relative claims | Peer benchmark (CP-1C) |
| A7 | Earnings quality analysis | Medium | FY2024 | Consolidated | Supported EBITDA, add-back verdicts, adjusted debt | Stock-compensation sensitivity misstated; agency rows unsourced | Driver 3 | Earnings quality (CP-1D) |
| A8 | Fundamental credit analysis | High | FY2024 | Consolidated | Synthesis, materiality ranking | Repeats the no-prices-or-ratings limitation | Driver ranking input | Fundamental credit (CP-2) |
| A9 | Legal & covenants analysis | Medium: summary legal authority | As of 2024-09-30 | Issuer, guarantors, non-guarantors | Thresholds, indicative headroom, ranking | Executed documents and intercreditor absent | Driver 5 | Legal & covenants (CP-4) |
| A10 | Downside analysis | Medium | FY2024 static stress | Consolidated | Scenarios and break points | Rate shock uses issuer USD 30 million | Contrary evidence | Downside (CP-2A) |
| A11 | Rates, FX & hedging analysis | Medium | 2024-09-30 | Consolidated | Hedge register, +100 bp sensitivity | Own figure conflicts with issuer figure | Rate-shock conflict | Rates, FX & hedging (CP-2E) |
| A12 | Liquidity analysis | High | Twelve months to 2025-09-30 | Consolidated | Bridge, runway, mitigants | Omits USD 49 million routine equivalents | Driver 4 | Liquidity (CP-2D) |
| A13 | Forward credit model analysis | Medium: assumption-based | FY2025 to FY2027 | Consolidated | Base, upside, downside cases | Downside interest uses issuer rate shock | Context only | Forward credit model (CP-2G) |
| A14 | Ratings & triggers analysis | Low | As of 2024-09-30 | Facilities only | Secondary facility labels | Cites a quote sheet outside the pinned sources | Restricts rating claims | Ratings & triggers (CP-2H) |
| A15 | Market-implied risk analysis | Low: blocked | Assigned 2024-09-30 | Five loan facilities | Descriptive quote arithmetic | Peer, index and size rows untraceable here | Restricts market claims | Market-implied risk (CP-3D) |
| A16 | Refinancing & LME analysis | High for funding; low for legal capacity | As of 2024-09-30 | Consolidated | Maturity wall, funding gap, path assessment | Legal capacity unestablished | Driver 4 | Refinancing & LME (CP-3C) |
| A17 | Recovery & fulcrum analysis | Not applicable gate | As of 2024-09-30 | Consolidated | Distress gate not met | No recovery figures | Context only | Recovery & fulcrum (CP-4C) |
| A18 | Security selection analysis | Medium | As of 2024-09-30 | All loans and notes | RV Unclear; Requires More Work | Peer and index rows untraceable here | Context only | Security selection (CP-3) |

Module status: Ready with Limitations, because the legal documents are absent and one cited market source is not pinned. Traceability scope: Top 5. Entity key: issuer_id tdg available and consistent across all eighteen analyses; reporting period FY2024 to 2024-09-30.

#### T5B.2 Credit Driver Ranking Table

<!-- table-id: T5B.2 -->
| Rank | Credit Driver | Originating Module | Source-Supported Basis | Why Material | Committee Relevance | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Debt-funded distribution policy sets the leverage path | Business & governance; Fundamental credit | Excess cash ranked capex, acquisitions, special dividends or repurchases, then debt prepayment; USD 6,368 million special distributions declared in FY2024; USD 3,000 million senior secured debt issued 2024-09-19 alongside the USD 75.00 per share dividend; USD 4,348 million paid October 2024 | EBITDA growth converts into distributions and secured claims rather than deleveraging, raising loss given default for subordinated notes | Decides whether deleveraging can be underwritten; anchors monitoring of further special dividends | 10-K page 54 verified; distributions sum 2,020 + 4,348 in Business & governance | Size of the next distribution not bounded: restricted-payment baskets not established | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; Business & governance (CP-1A) |
| 2 | Pro forma net leverage 6.02x after the 2024-10-18 payment | Financial foundation | Year-end net debt USD 18,619 million plus USD 4,348 million gives USD 22,967 million over reported EBITDA USD 3,813 million; 5.50x on EBITDA As Defined; year-end 4.88x before the payment | Year-end net leverage is flattered by cash pre-committed to the dividend | Leverage anchor quoted by every later analysis | 10-K pages 54, 56, 120 verified; recomputed in V4, V5, V9 | Contractual net debt definition not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; Financial foundation (CP-1) |
| 3 | Supported EBITDA USD 3,871 million and pro forma net leverage 5.93x | Earnings quality | Reported EBITDA USD 3,813 million plus refinancing costs USD 58 million; acquisition costs USD 70 million rejected; stock compensation USD 217 million challenged | The 0.43x gap against the issuer basis is headroom a lender could wrongly assume | Underwriting denominator for leverage and capacity stress | 10-K page 71 as cited; recomputed in V6 and V10 | Add-back verdicts are analyst judgement; stock-compensation sensitivity stated as 0.39x against 0.31x recomputed | Earnings quality (CP-1D) |
| 4 | Near-term liquidity adequate; refinancing concentrated in FY2028 and FY2029 | Liquidity; Refinancing & LME; Financial foundation | Pro forma cash liquidity USD 2,919 million; scheduled interest USD 1,524 million; FY2028 principal USD 6,637 million and FY2029 USD 4,768 million; no term loan or note maturity before November 2027 | Low near-term default probability; refinancing terms rather than cash exhaustion are the break | Frames default risk as refinancing-driven and sets monitoring of the 2025-07-11 securitization renewal | 10-K pages 56, 64, 153 verified | Bridge holds FY2024 run-rate flat and omits USD 49 million of routine dividend equivalents (ending USD 3,550.1 million would be USD 3,501.1 million) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56–64; Liquidity (CP-2D) |
| 5 | The 5.00x secured net debt test is the binding brake on secured layering ahead of subordinated notes | Legal & covenants; Refinancing & LME | Thresholds 7.25x net, 5.00x secured net and 7.50x springing above USD 364 million revolver usage verified; indicative pro forma secured ratio 4.22x; capacity about USD 3,244 million | Secured layering dilutes recovery for subordinated notes without any covenant default | Choice between secured and subordinated exposure | 10-K page 62 verified; ratio recomputed in V11 | Executed agreements, baskets and intercreditor terms not supplied; legal review required | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4) |

#### T5B.3 Traceability Map Table

<!-- table-id: T5B.3 -->
| Credit Driver / Conclusion | Originating Module | Source Evidence | Citation Present? | Source Quality | Classification | Claim Status | Confidence Level | Traceability Status | Source |
|---|---|---|---|---|---|---|---|---|---|
| Debt-funded distribution policy | Business & governance | Capital allocation order and October 2024 payment text in the annual report | Yes | High: audited filing | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 |
| Pro forma net leverage 6.02x | Financial foundation | Net debt 22,967 over EBITDA 3,813; recomputed exactly | Yes | High: audited inputs | Calculated | Supported | High | Committee-Ready | Financial foundation (CP-1); calculation V5 |
| Supported EBITDA and 5.93x | Earnings quality | Issuer reconciliation lines; analyst add-back verdicts | Yes | Medium: judgement on audited lines | Analyst Inference | Partially Supported | Medium | Remediation Needed | Earnings quality (CP-1D); calculation V6 |
| Liquidity adequate; FY2028 to FY2029 wall | Liquidity; Refinancing & LME | Pro forma liquidity, scheduled interest and maturity ladder in the annual report | Yes | High: audited filing | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56–64 |
| Secured test is the binding brake | Legal & covenants | Annual report covenant summary; indicative ratio from issuer measures | Partial | Medium: issuer summary of executed documents | Analyst Inference | Partially Supported | Low | Remediation Needed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4) |

No driver is an orphan claim: each conclusion with partial support carries its own limitation in the originating analysis.

#### T5.3 Math Audit Table

<!-- table-id: T5.3 -->
| Severity | Module | Metric / Logic Issue | Formula / Definition Issue | Source Conflict | Required Fix | Clearance Impact | Source |
|---|---|---|---|---|---|---|---|
| MATERIAL | Earnings quality | Stock-compensation effect on pro forma net leverage stated as about 0.39x in a key finding and calculation note | 22,967 / 4,088 = 5.62x; 5.93x less 5.62x = 0.31x; no formula yields 0.39x from the stated inputs | None: internal to the analysis; Security selection already declined to adopt the figure | Restate as 0.31x or show the formula behind 0.39x | Requires Calculation Rebuild | Earnings quality (CP-1D); calculation V7; calculation V8 |
| MATERIAL | Downside; Forward credit model; Rates, FX & hedging | Rate shock in stress cases | Stress interest 1,524 + 30 = 1,554; hedging bound 1,524 + 57.89 = 1,581.89; difference USD 27.89 million | Issuer states about USD 30 million per percentage point, implying about USD 3,000 million effective floating exposure, against USD 5,789 million unhedged in the hedging analysis | Adopt one basis across the stress cases or show both cases | Requires Source Reconciliation | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; Rates, FX & hedging (CP-2E); calculation V15; calculation V16 |
| MINOR | Financial foundation; Business & governance; Earnings quality; Liquidity; Forward credit model; Refinancing & LME; Security selection | October payment difference of USD 48 million carried as unreconciled | Quarter line 4,396 = dividend 4,216 + equivalents 180; 131 of the 180 tied to the special dividend; 49 routine | Annual report 132 against quarterly 131 for the special-dividend equivalents (rounding) | Record the reconciliation; show USD 49 million as a separate first-quarter FY2025 cash use in the liquidity bridge | Monitoring Follow-Up | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 52; calculation V1; calculation V2 |
| MINOR | Source readiness | Incremental net leverage test given as 7.50x in prose | Annual report states 7.25x; 7.50x is the springing revolver test | Already resolved by Financial foundation and Business & governance | Correct the prose figure | Formatting / Hygiene Only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

## Calculations

These calculations only test whether the analyses agree with their own inputs and with the filings; none produces a new credit metric.

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| V1 | Quarter dividend line rebuilt from the dividend note | 4,216 + 180 | 4,396 (equals cash-flow line) | Q1 FY2025, USD million | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 4, 52 |
| V2 | Routine dividend equivalents not tied to the special dividend | 180 − 131 | 49 | Q1 FY2025, USD million | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 52 |
| V3 | Quarter line less annual-report payment | 4,396 − 4,348 | 48 | Q1 FY2025 against FY2024 disclosure, USD million | Financial foundation (CP-1) |
| V4 | Pro forma net debt | 18,619 + 4,348 | 22,967 (equals stated) | 2024-09-30 pro forma for 2024-10-18, USD million | Financial foundation (CP-1) |
| V5 | Pro forma net debt / reported EBITDA | 22,967 / 3,813 | 6.0233 (6.02x, equals stated) | FY2024 pro forma, x | Financial foundation (CP-1) |
| V6 | Pro forma net debt / supported EBITDA | 22,967 / 3,871 | 5.9331 (5.93x, equals stated) | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V7 | Pro forma net debt / supported EBITDA accepting stock compensation | 22,967 / 4,088 | 5.6182 (5.62x) | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V8 | Stock-compensation effect on pro forma net leverage | 5.9331 − 5.6182 | 0.3149 (0.31x; stated as 0.39x) | FY2024 pro forma, x | calculation V6; calculation V7 |
| V9 | Pro forma net debt / EBITDA As Defined | 22,967 / 4,173 | 5.5037 (5.50x, equals stated) | FY2024 pro forma, x | Financial foundation (CP-1) |
| V10 | Supported less issuer-basis pro forma leverage | 5.9331 − 5.5037 | 0.4294 (0.43x, equals stated) | FY2024 pro forma, x | calculation V6; calculation V9 |
| V11 | Pro forma secured net debt / EBITDA As Defined | 17,621 / 4,173 | 4.2226 (4.22x, equals stated) | FY2024 pro forma, x | Legal & covenants (CP-4) |
| V12 | One percentage point on all floating principal | 9,189 × 0.01 | 91.89 (equals stated post-hedge figure) | Annual, USD million | Rates, FX & hedging (CP-2E) |
| V13 | Hedging bound less issuer sensitivity | 57.89 − 30 | 27.89 (equals stated) | Annual, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; Rates, FX & hedging (CP-2E) |
| V14 | Floating exposure implied by the issuer sensitivity | 30 / 0.01 | 3,000 | 2024-09-30, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| V15 | Scheduled interest plus the hedging analysis's shock | 1,524 + 57.89 | 1,581.89 | FY2025 schedule, USD million | Rates, FX & hedging (CP-2E); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 64 |
| V16 | Difference from the stress-case interest | 1,581.89 − 1,554 | 27.89 | FY2025, USD million | Downside (CP-2A); calculation V15 |
| V17 | Liquidity bridge ending after routine dividend equivalents | 3,550.1 − 49 | 3,501.1 | 2025-09-30 estimate, USD million | Liquidity (CP-2D); calculation V2 |

Every recomputed figure behind the five drivers equals the value the originating analysis states; the only arithmetic departure found is the stock-compensation sensitivity.

## Gaps

| Gap or finding | Why it matters | Conclusion affected | Severity | Required follow-up |
|---|---|---|---|---|
| Executed credit agreement, amendments, note indentures, guarantee and collateral agreement and intercreditor agreement are not supplied | Secured capacity, baskets, guarantee release and payment blockage decide how much debt can rank ahead of the subordinated notes | Secured-capacity driver, refinancing paths, structural priority and any recovery view stay summary-based and need legal review | MATERIAL | Obtain the executed documents and restate the legal analysis on clause-level evidence |
| The quote sheet cited for peer, index, facility-size and maturity rows is not among the files supplied; only five TransDigm quote rows and two facility ratings are in the run settings | Peer and index comparisons and facility-identity conflicts cannot be traced in this validation | Descriptive relative-value and rating rows in Ratings & triggers, Market-implied risk and Security selection | MATERIAL | Pin the sheet as a source or remove the untraceable rows from committee material |
| Source readiness states the run settings left prices and ratings blank, but they carry five loan quote rows and two facility ratings | Source inventory misstated; the limitation was repeated in Fundamental credit | Source gate description and the no-prices-or-ratings limitation | MATERIAL | Correct the inventory statement and the repeated limitation |
| Stock-compensation leverage effect stated as about 0.39x against 0.31x recomputed | A stated sensitivity does not follow from its inputs | Contrary-evidence sizing in Earnings quality | MATERIAL | Restate or show the formula |
| Stress cases use the issuer rate sensitivity of USD 30 million while the hedging analysis carries USD 57.89 million | Stress interest could be USD 27.89 million higher | Downside and Forward credit model downside interest | MATERIAL | Adopt one basis or show both |
| October payment difference of USD 48 million carried as unreconciled although the quarterly dividend note explains it | Liquidity bridge omits USD 49 million of routine equivalents | Liquidity ending figure only; adequate rating unchanged | MINOR | Record the reconciliation and the separate cash use |
| Incremental test given as 7.50x in Source readiness prose | Already corrected by later analyses | None | MINOR | Correct the prose |
| Earnings quality's agency-convention rows rest on analyst understanding of agency practice with no source | Unsourced characterisation of third-party practice | Convention reconciliation only; labelled indicative | MINOR | Mark as unsourced analyst understanding |
| Peer benchmark and Market-implied risk are blocked, and Recovery & fulcrum is not applicable | No peer-relative, market-implied or recovery figure exists to trace | Any sector-relative, pricing or recovery claim elsewhere in the run lacks a traceable basis | Limitation | None within this validation |
| Use restriction | This validation grades traceability and integrity only | It must not be read as endorsing or changing any credit, legal or relative-value conclusion | Limitation | None |

## Next module

The orchestrator selects the next module.
