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

Evidence validation for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is the claim-to-source lineage, locator spot-checks, re-performance of key calculations, conflict logging and the research-integrity clearance of every analysis supplied for this run, with the top five credit drivers traced in full; no upstream credit conclusion is altered.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Locator spot-checks of the incurrence and springing tests, securitization draw, October 2024 dividend and equivalents, November 2023 dividend split, pro forma liquidity, rate sensitivity and fixed-rate share, contractual interest schedule, EBITDA reconciliation, guarantor sales, debt fair values and foreign sales |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 (after the as-of date) | 2025-02-04 | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Verification of the quarterly dividend and dividend-equivalent payment figure used in the October 2024 conflict |
| TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 29 June 2024 | 2024-08-06 | ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2 | Inventory and lineage check only: confirmed as the nine-month base cited by Earnings changes, Research questions and Earnings quality; not re-read |
| TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 30 March 2024 | 2024-05-07 | fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6 | Inventory check only: no analysis in the run relies on it beyond source readiness |
| TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | Annual report to shareholders (PDF) reproducing the Form 10-K for fiscal 2024 | not stated | dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af | Inventory check only: excluded duplicate of the 10-K; no claim in the run rests on it |

| Module | sha256 | Use |
|---|---|---|
| Source readiness (CP-0) | 262ee9b6359f01ad87862a2aaca55dacd91a2a1ecad55ecaacfe906f6aa300b4 | Source gate, inventory and evidence trace audited; run-settings statement tested |
| Financial foundation (CP-1) | 0ddfc6deafdac91bcd221fd126e48b48528caf7259b66a6346b94dc5e5b579d2 | Anchor figures, debt bridge, pro forma adjustment and definition conflicts audited and re-performed |
| Business & governance (CP-1A) | 2f3c90f18106b61950e930aa90e2300a5c58add4d206077bca3ca4a743f8f0ae | Financial-policy driver, transaction register and conflict log audited |
| Earnings changes (CP-1B) | e3175edcf65b268e228c0502ff93387b0d5a591e6162923e4ad094828b232f33 | Earnings delta and constructed fourth quarter audited for lineage |
| Research questions (CP-DR) | f7ebcff4948d7c1303dbe93be2415859b4244722e9b3b4d14d0e2b18c8488d80 | Sector evidence register and refused external lookups audited |
| Peer benchmark (CP-1C) | d73a84ee1c7705d5acae8b7cf0aff748c3c5e1597ebe5f84f541883adc03b025 | Blocked status and inherited borrower figures audited |
| Earnings quality (CP-1D) | 78f414859ee0217f72a3ea4473c475ed0d26ca45c90c724f36f58ba7e66c8e9d | Supported-earnings driver and sensitivity arithmetic re-performed |
| Fundamental credit (CP-2) | dc6a0459731eea84ec87f7b8b2d09415c03e11a24bebb7dca2fda0edbe63dccf | Synthesis claims traced to their originating analyses |
| Legal & covenants (CP-4) | 5b0d7ce182c769f94a96740891ab58a71ac56ecbc2782b8b259b883d84868795 | Covenant thresholds, headroom and guarantor-share arithmetic audited |
| Downside (CP-2A) | bfaaee27ecb51c2614443c05eb3fa473177b9a85721d3cd82da81274258c1ff6 | Stress break points re-performed |
| Rates, FX & hedging (CP-2E) | 07fc638c1461ff2144da31f25ac8824dc06bb001433c5122f5b06f1ba3bc8647 | Rate-sensitivity conflict and unhedged share audited |
| Liquidity (CP-2D) | 36b7097ae8d40b105d0c925a48d734ce4879a1198d801ec33c5f422638f21230 | Liquidity bridge re-performed |
| Forward credit model (CP-2G) | cb978ebb8e85145a4838f0c57d3b3b36c7b65ec77bcde4d94284486e870846d6 | Forecast leverage path spot-checked |
| Ratings & triggers (CP-2H) | b29ed4847771db5d782bbd51e0fcda83589cb49875ee4ccbf3b5a61f036b1719 | Rating-evidence lineage audited |
| Market-implied risk (CP-3D) | 2ed704ce4c9b8fca19a5f153d80425a4eeebaa348a6e168c9d1140a51554c1cd | Blocked market evidence and quote lineage audited |
| Refinancing & LME (CP-3C) | fd37ef12ef5bd46beea7235e1b19ebd0d388138cb4f63a44d208b4a6fff5ae1e | Funding-gap arithmetic re-performed |
| Recovery & fulcrum (CP-4C) | 0331377e7e40d65553dce01efc9adc916d37190dd7878559606c9e9c1eed47f8 | Not-applicable gate audited |
| Security selection (CP-3) | c4f7926ca861f1605b74a442853b15d09a9fbb4e5fb49389e26ac32363f13683 | Relative-value and recovery claims audited for lineage |

## Findings

### Bottom line

The run's credit conclusions are traceable enough for restricted committee use: every top credit driver rests on verified filing figures or re-performed arithmetic, but five material defects, led by missing executed debt documents and unpinned market evidence, must be disclosed first.

Re-performance confirmed the anchors: pro forma net leverage of 6.02x on net debt of USD 22,967 million after the 2024-10-18 dividend payment, against 4.88x on USD 18,619 million at year end, and 5.93x on supported earnings. The most important provenance gap is the absence of the credit agreement and indentures, because secured capacity and junior dilution rest on the annual report's summary. No finding changes an upstream credit conclusion, but three statements need restating: an overstated stock-compensation sensitivity, an unreconciled rate sensitivity and the claim that no ratings or prices were supplied.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63; Financial foundation (CP-1); Earnings quality (CP-1D); calculation V1; calculation V3

### Key findings

- The top five credit drivers trace to verified figures. The annual report confirms the 7.25x net and 5.00x secured incurrence tests, the 7.50x springing test above USD 364 million of revolver usage, the USD 4,348 million October payment and pro forma cash liquidity of USD 2,919 million. Every anchor ratio re-performed exactly, including 6.02x pro forma net leverage, the 19.69% EBITDA fall to the 7.50x watch level and ending liquidity of USD 3,550.1 million.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56, 62–63; Financial foundation (CP-1); Downside (CP-2A); Liquidity (CP-2D); calculation V1; calculation V15; calculation V16; calculation V17

- Market and rating lineage is weak, and the descriptive spread comparisons should not reach a committee. Three analyses cite a quote file that is not among the pinned sources. The run settings hold only five subject loan quotes and two facility ratings, labelled as a test transcription with an assigned date. Peer and index spreads, facility sizes, margins and maturities, and the spread differences built on them (such as 54 bp over a comparable loan), cannot be traced in this run. The conclusions are already withheld, so the credit view does not move.
Basis: Security selection (CP-3); Market-implied risk (CP-3D); Ratings & triggers (CP-2H)

- The source-readiness gate misstated the run settings, and the error spread. It recorded ratings and prices as blank when the settings carry those five quotes and two facility ratings. Peer benchmark, Fundamental credit, Downside and Legal & covenants repeat that no ratings or prices exist. The ratings and market analyses later qualified the statement, so the inconsistency is logged rather than hidden. It still has to be restated so that readers do not take a source gap for an absence of inputs.
Basis: Source readiness (CP-0); Ratings & triggers (CP-2H); Market-implied risk (CP-3D)

- Earnings quality's leverage anchor holds, but its stock-compensation sensitivity is overstated. Pro forma net leverage on supported earnings is 5.93x, and the 0.43x gap to the issuer basis reproduces. Accepting the compensation add-back gives 5.62x, a 0.31x effect. The analysis instead states about 0.39x and calls the result near 5.50x. The underwriting anchor is unaffected, and Security selection had already declined to adopt the figure.
Basis: Earnings quality (CP-1D); calculation V3; calculation V4; calculation V5; calculation V6

- The rate sensitivity is a logged but unreconciled conflict that leaves the size of rate risk uncertain. On the unhedged floating balance, which is 23.27% of debt, the analysis computes USD 57.89 million per 100 bp. The annual report states about USD 30 million on the same balances and confirms about 77% fixed-rate debt. The USD 27.89 million gap does not change the moderate rating of rate risk, but it doubles or halves the cash effect.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73; Rates, FX & hedging (CP-2E); calculation V9; calculation V10; calculation V21

- The October payment conflict is close to resolution but stays open. The December 2024 quarterly cash-flow statement shows USD 4,396 million against the annual report's USD 4,348 million, a USD 48 million gap. The annual report says dividend equivalents are paid each first fiscal quarter, which fits Earnings quality's inference that the gap is the USD 48 million of accrued equivalents left after the USD 132 million October payment. Every analysis uses the annual-report figure for pro forma debt, consistently.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; Earnings quality (CP-1D); calculation V11; calculation V12

- Legal-capacity figures are arithmetically correct, but their evidence rests on assumptions. Secured net leverage of 4.22x and indicative secured capacity of USD 3,244 million reproduce. They depend on cash netting and on excluding the securitization, neither of which can be checked against the agreements, so the driver is classed as assumption-based rather than sourced.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Legal & covenants (CP-4); calculation V7; calculation V8

### Contrary evidence and what would change the view

The strongest case for a stricter verdict is that two decision areas lack evidence. No analysis holds the executed debt documents, and the only market data is a test transcription, partly from a file this run cannot open. Security selection and market-implied risk therefore have no authenticated compensation evidence, and covenant capacity has no contractual definitions. On that reading a committee should treat the package as failing, not restricted. The answer is that every affected analysis withholds the dependent conclusion: relative value is unclear, no instrument is preferred, market inference is blocked and headroom is labelled indicative. Missing evidence therefore produces gaps, not unsupported claims. The case for a cleaner pass is that most defects are already disclosed by the analyses that own them. The verdict would move to failing if any committee-facing conclusion were found to treat the transcribed spreads as authenticated, or if a re-read locator showed an anchor figure misread. It would move to passing once the debt documents and pinned market observations are supplied and the three statements above are restated.
Basis: Security selection (CP-3); Market-implied risk (CP-3D); Legal & covenants (CP-4)

### Limitations

- Locators were re-read for a sample of anchor claims only. The verdict that hedge terms, lease, pension and fair-value figures are traceable rests on cross-analysis consistency, not direct reading. A locator error there would move those claims from directly sourced to weak lineage and could add a material finding.
- The quote file cited by the ratings, market and security-selection analyses cannot be opened in this run. The tranche identity conflicts those analyses report can therefore be neither confirmed nor refuted, and the market lineage stays weak whatever the file contains.
- Lineage was classified at the level of the top five drivers and the audited conclusions, not every upstream claim. The confidence inputs in this validation therefore describe the decision-relevant subset, and an untraced minor claim elsewhere could add a minor finding without changing the clearance.
- The run's analyses were checked against each other in their supplied state. No analysis was re-run, so the clearance applies to these versions only and would need re-validation if any is revised.

### Overall traceability view

Overall, evidence traceability is Ready with Remediation. Of the top five material credit drivers, 1 is directly sourced, 2 are calculated, 1 is assumption-based, 1 is an analyst inference, and none is a weak-lineage, untraced, conflicting or insufficient-information item. The most important provenance gap is the absence of the executed credit agreement and indentures. It matters because secured incurrence capacity, restricted-payment capacity and the subordination mechanics behind subordinated-note loss severity are measured on the annual report's summary and on assumed definitions, and it means any committee use must carry the explicit limitation that covenant capacity is indicative. Module status is Ready with Limitations, and the scope is the top five drivers.
Basis: Legal & covenants (CP-4); Financial foundation (CP-1)

### Remediation priority map

Must fix before committee: disclose that covenant and secured-capacity figures rest on the annual report's summary, not the executed agreements, and that the market and rating inputs are a test transcription with an assigned date. Remove or relabel the peer, index, size and margin figures traced to the quote file that is not pinned, unless that file is added to the source set.

Must fix before the analysis is relied on further: restate the source-readiness record so the run settings show five loan quotes and two facility ratings marked as unverified. Correct Earnings quality's stock-compensation sensitivity to the recomputed effect. Reconcile, or explicitly bound, the rate-sensitivity gap with the issuer's own figure.

Monitoring follow-up: confirm from the December 2024 quarterly dividend note whether the USD 48 million gap is the residual accrued equivalents. Re-validate once the executed agreements are obtained.

Formatting and hygiene: label interest cover by its denominator wherever cash interest and interest expense are both used. Note the USD 28 million of sales to non-guarantors beside the guarantor-sales share. Label the share of the September payment funded by new debt as an analyst ratio, and keep the basis note on the unhedged share.

### Clearance decision

CLEARANCE DECISION: Pass with Remediation. Critical Issues: 0. Material Issues: 5. Minor Issues: 6. Committee Use: Restricted.

No finding changes a credit conclusion, so nothing blocks committee use. Use is restricted because the legal-capacity and market evidence gaps, the unpinned quote source, the run-settings misstatement and two unreconciled or misstated sensitivities affect traceability and must be disclosed alongside any committee material.

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 5 |
| Calculated | 4 |
| Assumption-Based | 1 |
| Analyst Inference | 2 |
| Weak Lineage | 1 |
| Untraced | 0 |
| Conflicting | 2 |
| Insufficient Information | 1 |
| Fields present | 6 |
| Fields total | 6 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 5 |
| MINOR | 6 |

### Map: support and contradiction

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Annual report covenant summary | States 7.25x net and 5.00x secured tests | Supports | Incurrence tests 7.25x and 5.00x | Text read directly on the covenant page |
| Source readiness summary prose | Cites 7.50x as the incurrence test | Contradicts | Incurrence tests 7.25x and 5.00x | 7.50x is the springing revolver test |
| Annual report October payment | USD 4,216m dividend plus USD 132m equivalents | Supports | Pro forma net debt USD 22,967m | Re-performed 18,619 plus 4,348 basis |
| December 2024 quarterly cash flow | Shows USD 4,396m paid in the quarter | Contradicts | October payment USD 4,348m | Gap USD 48m |
| Accrued equivalents 180 less 132 | Residual equals the USD 48m gap | Unresolved | October payment USD 4,348m | Annual report: equivalents paid each first quarter |
| Annual report market risk text | States about USD 30m per one point | Contradicts | Rate cost USD 57.89m per 100 bp | Same balances; method not disclosed |
| Recomputed 5.62x leverage | Implies 0.31x stock-comp effect | Contradicts | Stated stock-comp effect 0.39x | 22,967 over 4,088 |
| Recomputed 5.93x leverage | Matches supported-earnings anchor | Supports | Underwrite near 5.93x | 22,967 over 3,871 |
| Run-settings quotes and ratings | Five loan quotes, two facility ratings | Contradicts | No ratings or prices supplied | Settings mark them as test transcription |
| Run-settings quotes and ratings | Carry J to N levels and Ba3 and BB- | Supports | Tranche J spread 247 bp | Same values as the cited quote file |
| Unpinned quote file | Only source for peer and index spreads | Unresolved | Peer spread differences | File not in pinned source set |
| Annual report liquidity text | States USD 2,919m pro forma liquidity | Supports | Liquidity adequate to Sept 2025 | Bridge re-performed to USD 3,550.1m |
| Executed debt documents absent | Definitions and baskets unseen | Unresolved | Secured capacity USD 3,244m | Arithmetic reproduces; inputs assumed |

### Analytical appendix — complete canonical registers

#### T5B.1 Source register and module status

<!-- table-id: T5B.1 -->
| Source Document ID | Source Document Name | Source Quality | Period | Entity Covered | Data Supplied | Limitation | Downstream Use | Source |
|---|---|---|---|---|---|---|---|---|
| S1 | Form 10-K for fiscal 2024 (TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl) | High: audited, unqualified opinion | FY ended 2024-09-30; signed 2024-11-07 | TransDigm Group Incorporated consolidated; TransDigm Inc. borrower and note issuer | Statements, debt note, covenant summary, liquidity, subsequent events, market risk, guarantor information, fair values | Debt agreements incorporated by reference only; published after the as-of date | Controlling evidence for all five top drivers; locators re-read on sampled pages | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56, 62–63, 73 |
| S2 | Form 10-Q for the quarter ended 2024-12-28 (TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl) | Medium-high: unaudited | Quarter to 2024-12-28, after the as-of date | Consolidated group | Quarterly dividend payments USD 4,396 million, repurchases USD 316 million, comparative debt | Subsequent period; never blended into year-end figures | Conflict evidence for the October payment; subsequent events only | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| S3 | Form 10-Q for the quarter ended 2024-06-29 (TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl) | Medium-high: unaudited | Nine months to 2024-06-29 | Consolidated group | Nine-month sales, EBITDA, add-backs, channel growth | Not re-read in this validation | Base for the constructed fourth quarter and recurrence tests | Earnings changes (CP-1B) |
| S4 | Form 10-Q for the quarter ended 2024-03-30 (TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl) | Medium-high: unaudited | Six months to 2024-03-30 | Consolidated group | Interim statements | Not relied on by any analysis beyond inventory | None beyond source readiness | Source readiness (CP-0) |
| S5 | Annual report to shareholders PDF (TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf) | High: same content as the 10-K | FY2024 | Consolidated group | Duplicate of the 10-K | Containment checked on sampled pages only | Excluded duplicate | Source readiness (CP-0) |
| S6 | Run settings: five loan quotes (Tranches J to N) and Moody's Ba3 and S&P BB- facility ratings | Low: not issuer evidence; labelled a test transcription with figures assigned 2024-09-30 | Assigned 2024-09-30 | TransDigm facilities named only by tranche letter | Bid, ask, yield and spread for five facilities; two facility ratings; no outlook | No provenance, timestamp or facility mapping; contradicts the source-readiness statement that settings were blank | Descriptive levels in the ratings, market and security-selection analyses | Ratings & triggers (CP-2H) |
| S7 | Quote file named TDG market quotes 2024-09-30.md, cited with its own hash | Not traceable in this run: file not in the pinned source set | Assigned 2024-09-30 | TransDigm facilities, sector peers and loan indices | Peer and index spreads, facility sizes, margins, maturities and price changes as cited | Cannot be opened or verified here; weak lineage | Descriptive peer comparisons and identity conflicts in the market and security-selection analyses | Market-implied risk (CP-3D) |

Module status: Ready with Limitations. Traceability scope: Top 5. Entity key tdg is consistent across every supplied analysis, and all analyses use the 2024-09-30 assessment date, with the 2024-10-16 draw and 2024-10-18 payment kept as dated subsequent events.

#### T5B.2 Top five material credit drivers

<!-- table-id: T5B.2 -->
| Rank | Credit Driver | Originating Module | Source-Supported Basis | Why Material | Committee Relevance | Source Trace | Limitation | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Debt-funded distributions hold pro forma net leverage at 6.02x (year end 4.88x on net debt USD 18,619 million; USD 22,967 million pro forma 2024-10-18) | Financial foundation; Business & governance | USD 4,216 million dividend plus USD 132 million equivalents paid 2024-10-18, accrued at year end; net debt and leverage re-performed | Converts EBITDA growth into distributions and secured claims; no deleveraging path | Governs leverage tolerance, PD over the refinancing horizon and recovery for subordinated notes | Financial foundation (CP-1); Business & governance (CP-1A); calculation V1 | Dividend amount conflicts with the quarterly figure by USD 48 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| 2 | Supported EBITDA of USD 3,871 million puts pro forma net leverage at 5.93x, not 5.50x | Earnings quality | Issuer reconciliation of USD 3,813 million to USD 4,173 million; add-back verdicts on recurrence | Recurring costs removed from the issuer measure overstate capacity by 0.43x | Sets the underwriting leverage anchor | Earnings quality (CP-1D); calculation V3; calculation V6 | Stock-compensation sensitivity misstated; USD 15 million of other items unresolved | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 44 |
| 3 | 5.00x secured incurrence test is the binding brake; indicative secured capacity USD 3,244 million ahead of subordinated notes | Legal & covenants | Thresholds stated in the annual report; current ratio 4.22x computed on assumed definitions | Equal-ranking secured layering is the main LGD channel for subordinated holders | Drives security selection between secured and subordinated paper | Legal & covenants (CP-4); calculation V7; calculation V8 | Executed agreements absent; cash netting and securitization treatment assumed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| 4 | Liquidity adequate to September 2025: pro forma cash liquidity USD 2,919 million; no term loan or note maturity before November 2027 | Liquidity; Refinancing & LME | Issuer pro forma liquidity statement; one-year funding gap nil | Low near-term default probability from liquidity | Supports the low near-term PD view | Liquidity (CP-2D); Refinancing & LME (CP-3C); calculation V17; calculation V18 | Annual bridge on FY2024 run-rate; intra-year trough not located | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |
| 5 | Scheduled interest of USD 1,524 million and a 19.69% EBITDA fall to the 7.50x watch level put leverage, not liquidity, first in the downside | Downside; Forward credit model | Issuer contractual interest schedule; break points and forecast leverage re-performed | Coverage and leverage weaken before cash runs out, ahead of the FY2028 wall | Shapes downside monitoring and refinancing risk | Downside (CP-2A); Forward credit model (CP-2G); calculation V15; calculation V16; calculation V20 | Break points on reported EBITDA, not the contractual measure; scenario sizes are assumptions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 64 |

#### T5B.3 Traceability map

<!-- table-id: T5B.3 -->
| Credit Driver / Conclusion | Originating Module | Source Evidence | Citation Present? | Source Quality | Classification | Claim Status | Confidence Level | Traceability Status | Source |
|---|---|---|---|---|---|---|---|---|---|
| Pro forma net leverage 6.02x after the 2024-10-18 payment | Financial foundation | Net debt 18,619 plus payment 4,348 over reported EBITDA 3,813; payment amount verified | Yes | High | Calculated | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| Supported-earnings leverage 5.93x | Earnings quality | Reconciliation items verified; add-back verdicts on recurrence | Yes | High for inputs; analytical for verdicts | Analyst Inference | Supported, with misstated stock-compensation sensitivity | Medium | Remediation Needed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 71 |
| Secured capacity about USD 3,244 million under the 5.00x test | Legal & covenants | Thresholds verified; definitions assumed | Partial | Medium: issuer summary of unseen agreements | Assumption-Based | Partially Supported | Medium | Remediation Needed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Pro forma cash liquidity USD 2,919 million; no term maturity before November 2027 | Liquidity | Issuer statement verified | Yes | High | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |
| Leverage breaks first at a 19.69% EBITDA fall | Downside | Pro forma net debt over 7.50x, against reported EBITDA; re-performed | Yes | High for inputs | Calculated | Supported | High | Committee-Ready | Downside (CP-2A) |
| Rate cost per 100 bp USD 57.89 million | Rates, FX & hedging | Issuer states about USD 30 million on same balances | Yes | High | Conflicting | Conflicting | Low | Remediation Needed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| October payment USD 4,348 million versus USD 4,396 million | Source readiness; Financial foundation | Both figures verified; difference unreconciled | Yes | High | Conflicting | Conflicting | Medium | Remediation Needed | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| Descriptive peer spread differences, such as 54 bp versus a comparable loan | Security selection; Market-implied risk | Quote file not in the pinned source set; peer rows absent from run settings | Partial | Low | Weak Lineage | Unsupported in this run; mitigated by withheld conclusions | Low | Remediation Needed | Security selection (CP-3) |
| No ratings or prices supplied in run settings | Source readiness | Run settings hold five loan quotes and two facility ratings | Yes | Low: statement contradicted | Conflicting | Conflicting | Low | Remediation Needed | Source readiness (CP-0) |
| Covenant baskets, contractual EBITDA and intercreditor terms | Legal & covenants | Agreements incorporated by reference only | No | Not supplied | Insufficient Information | Insufficient Information; limitation applied | Low | Not Traceable | Legal & covenants (CP-4) |
| Restructuring not applicable; no fulcrum assigned | Recovery & fulcrum | Covenant compliance and funding statements verified on the same pages | Yes | High | Directly Sourced | Supported | High | Committee-Ready | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 56, 62 |
| No usable peer; relative value unclear | Peer benchmark; Security selection | Research peer tables empty; registrant lookups refused | Yes | Not supplied | Insufficient Information | Insufficient Information; limitation applied | Low | Not Traceable | Research questions (CP-DR) |

No orphan claim was found: every weak-lineage or insufficient-information conclusion carries an explicit limitation in its originating analysis, and none is presented as a supported recommendation.

#### T5.3 Math, logic and definition audit

<!-- table-id: T5.3 -->
| Severity | Module | Metric / Logic Issue | Formula / Definition Issue | Source Conflict | Required Fix | Clearance Impact | Source |
|---|---|---|---|---|---|---|---|
| MATERIAL | Earnings quality | Stock-compensation sensitivity stated as about 0.39x, with the result described as near 5.50x | 22,967 / 4,088 = 5.62x; 5.93x less 5.62x = 0.31x; the 0.39x mixes the issuer basis with other items | Internal: its own calculation shows 0.3150 beside the 0.39x text | Restate the key finding and contrary evidence at 0.31x and 5.62x | Restricts Committee Use | Earnings quality (CP-1D) |
| MATERIAL | Rates, FX & hedging | Cost per 100 bp USD 57.89 million against the issuer's about USD 30 million | Unhedged principal times one point versus issuer method not disclosed | Issuer market-risk text against the analysis method; gap USD 27.89 million | Reconcile to the issuer method or state both as a range | Requires Calculation Rebuild | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| MINOR | Business & governance; Financial foundation | Interest cover 3.24x on interest expense versus 3.29x on cash interest | Different denominators: interest expense net USD 1,286 million versus cash paid USD 1,158 million | Definition drift, both labelled | Label the denominator wherever cover is quoted | Formatting / Hygiene Only | Business & governance (CP-1A) |
| MINOR | Legal & covenants | Guarantor share of net sales 79.27% | Net sales 6,294 shown beside USD 28 million of sales to non-guarantors; treatment not stated | None external | Note the intercompany line beside the share | Formatting / Hygiene Only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| MINOR | Rates, FX & hedging | Unhedged share 23.27% | Principal numerator over carrying-value denominator | Disclosed by the analysis | Keep the basis note; optionally show the principal-basis share | Formatting / Hygiene Only | Rates, FX & hedging (CP-2E) |
| MINOR | Source readiness; Financial foundation; Business & governance | October payment shown as 4,348, 4,347 and 4,396 | One event, three figures with different scopes; logged once per analysis | Annual report against December 2024 quarter; equivalents 132 against 131 | Confirm the USD 48 million residual from the quarterly dividend note | Monitoring Follow-Up | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| MINOR | Earnings changes | Constructed fourth-quarter refinancing cost of minus USD 1 million | Nine-month figure exceeds full-year figure | Unaudited interim against audited annual | Keep flagged; check later filings for reclassification | Monitoring Follow-Up | Earnings changes (CP-1B) |

Carrying-value debt is applied consistently across all analyses (USD 24,880 million, principal USD 25,068 million logged as the gross basis). Null values are shown as not supplied, never as zero, and multi-figure events are logged rather than silently reconciled.

## Calculations

| ID | Check | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| V1 | Pro forma net debt / reported EBITDA | 22,967 / 3,813 | 6.0233 (6.02x); matches Financial foundation | 2024-09-30 pro forma for 2024-10-18, x | Financial foundation (CP-1) |
| V2 | Total debt / reported EBITDA | 24,880 / 3,813 | 6.5250 (6.53x); matches | FY2024, x | Financial foundation (CP-1) |
| V3 | Pro forma net debt / supported EBITDA | 22,967 / 3,871 | 5.9331 (5.93x); matches | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V4 | Pro forma net debt / supported EBITDA plus stock compensation | 22,967 / 4,088 | 5.6182 (5.62x) | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V5 | Stock-compensation effect | 5.9331 − 5.6182 | 0.3149 (0.31x); stated 0.39x does not reproduce | FY2024 pro forma, x | calculation V3; calculation V4 |
| V6 | Supported less issuer-basis pro forma leverage | 5.9331 − 5.5037 | 0.4294 (0.43x); matches | FY2024 pro forma, x | Earnings quality (CP-1D) |
| V7 | Pro forma secured net debt / EBITDA As Defined | 17,621 / 4,173 | 4.2226 (4.22x); matches | 2024-09-30 pro forma, x | Legal & covenants (CP-4) |
| V8 | Indicative secured capacity | 20,865 − 17,621 | 3,244; matches | 2024-09-30 pro forma, USD million | Legal & covenants (CP-4) |
| V9 | Unhedged floating debt share | 5,789 / 24,880 | 0.2327 (23.27%); matches | 2024-09-30, ratio | Rates, FX & hedging (CP-2E) |
| V10 | Cost per 100 bp / FY2024 free cash flow | 57.89 / 1,880 | 0.0308 (3.08%); matches | FY2024, ratio | Rates, FX & hedging (CP-2E) |
| V11 | Quarterly payment less annual-report payment | 4,396 − 4,348 | 48 | October 2024 event, USD million | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| V12 | Accrued current equivalents less October equivalents | 180 − 132 | 48; equals V11 | 2024-09-30, USD million | Earnings quality (CP-1D); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| V13 | November 2023 dividend plus associated equivalents | 1,937 + 83 | 2,020; matches the stated total | FY2024, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| V14 | Guarantor group share of net sales | 6,294 / 7,940 | 0.7927 (79.27%); matches | FY2024, ratio | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| V15 | EBITDA at the 7.50x watch level and its share of FY2024 EBITDA | 22,967 / 7.5; 3,062.2667 / 3,813 | 3,062.2667; 0.8031 | FY2024 pro forma, USD million and ratio | Downside (CP-2A) |
| V16 | EBITDA decline to the 7.50x watch level | 1 − 0.8031 | 0.1969 (19.69%); matches | FY2024 pro forma, ratio | calculation V15 |
| V17 | Ending accessible liquidity | 7,267 + 4,044 − 302 − 1,524 − 539 − 277.9 − 738 − 4,380 | 3,550.1; matches | 2025-09-30 estimate, USD million | Liquidity (CP-2D) |
| V18 | One-year raw funding balance | 584 − 7,104 − 1,401.1 | −7,921.1 (funding gap nil); matches | One year from 2024-09-30, USD million | Refinancing & LME (CP-3C) |
| V19 | Ladder-to-carrying reconciling items | −1 − 136 − 51 + 487 + 262 | 561; matches | 2024-09-30, USD million | Financial foundation (CP-1) |
| V20 | Base FY2027 gross leverage | 24,603 / 4,756.9 | 5.1721 (5.17x); matches | FY2027 forecast, x | Forward credit model (CP-2G) |
| V21 | Analysis rate cost less issuer figure | 57.89 − 30 | 27.89 | Annual, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 73 |
| V22 | EBITDA As Defined / interest expense net | 4,173 / 1,286 | 3.2449 (3.24x); matches Business & governance | FY2024, x | Business & governance (CP-1A) |

These checks re-perform figures the run already states, apart from V4, V5, V11, V12 and V21, which test conflicts. All but V5 reproduce the stated values at the stated precision. Year-end net debt of USD 18,619 million becomes USD 22,967 million pro forma for the 2024-10-18 payment, as recorded by Financial foundation.

## Gaps

| ID | Severity | Analysis | Finding | Required fix | Effect on use | Source |
|---|---|---|---|---|---|---|
| Q-01 | MATERIAL | Legal & covenants; Covenant-dependent conclusions across the run | Executed credit agreement, indentures, guarantee and collateral agreement and intercreditor agreement not in the source set; capacity, baskets and blockage terms rest on summary | Obtain the executed documents; until then label all capacity as indicative | Restricts committee use of secured-capacity and subordinated-loss conclusions | Legal & covenants (CP-4) |
| Q-02 | MATERIAL | Ratings & triggers; Market-implied risk; Security selection | Cited quote file not pinned; peer, index, size, margin and maturity rows untraceable in this run | Pin the file with provenance or remove the dependent rows | Descriptive spread differences must not be presented to committee | Market-implied risk (CP-3D) |
| Q-03 | MATERIAL | Source readiness, repeated by Peer benchmark, Fundamental credit, Downside and Legal & covenants | States ratings and prices blank; run settings hold five loan quotes and two facility ratings | Restate as unverified test-transcription inputs | Readers could misread a provenance gap as absence of inputs | Source readiness (CP-0) |
| Q-04 | MATERIAL | Earnings quality | Stock-compensation sensitivity overstated (0.39x stated; 0.31x recomputed) | Restate | Leverage anchor 5.93x unaffected | Earnings quality (CP-1D) |
| Q-05 | MATERIAL | Rates, FX & hedging | Rate cost per 100 bp unreconciled with issuer figure | Reconcile or present as a range | Size of rate risk uncertain; level unchanged | Rates, FX & hedging (CP-2E) |
| Q-06 | MINOR | Source readiness; Financial foundation; Business & governance | October payment has three figures | Confirm residual equivalents from the quarterly dividend note | Up to USD 48 million on pro forma cash; no conclusion changes | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| Q-07 | MINOR | Business & governance | Interest cover denominator differs from other analyses | Label denominators | Presentation only | Business & governance (CP-1A) |
| Q-08 | MINOR | Business & governance | Share of the September payment funded by new debt (69%) presumes all new debt funded the dividend | Label as an analyst ratio | Presentation only | Business & governance (CP-1A) |
| Q-09 | MINOR | Legal & covenants | Guarantor sales share omits note of USD 28 million sales to non-guarantors | Add note | Presentation only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Q-10 | MINOR | Rates, FX & hedging | Unhedged share mixes principal and carrying bases | Keep basis note | Presentation only | Rates, FX & hedging (CP-2E) |
| Q-11 | MINOR | Earnings changes | Constructed fourth-quarter refinancing cost of minus USD 1 million | Check later filings | Fourth-quarter margins slightly uncertain | Earnings changes (CP-1B) |

| Gap | Why it matters | Severity |
|---|---|---|
| Locators re-read on sampled pages only; hedge, lease, pension and swap pages not re-read | Those figures are traced by consistency across analyses, not direct reading | Minor |
| No authenticated market observations or verified agency ratings at the cutoff | Market-implied, rating-migration and relative-value conclusions stay withheld; this is a source gap, not a validation defect | Material |
| No peer filings or peer EBITDA definitions | Sector-relative claims have no evidence base anywhere in the run | Material |
| Use restriction | This validation grades evidence and traceability only; it does not alter or endorse any credit, legal or investment conclusion, and its clearance applies to the supplied versions of the analyses | Minor |

## Next module

The orchestrator selects the next module.
