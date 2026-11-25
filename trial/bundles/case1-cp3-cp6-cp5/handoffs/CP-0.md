---
issuer_id: tdg
module_id: CP-0
analysis_date: 2024-09-30
pathway: deep_credit_assessment
module_status: Complete
---

## Request

Source readiness for TransDigm Group Incorporated as of 2024-09-30, on the deep credit assessment pathway. Scope is limited to inventory, authority, period fit, gaps and the source-to-analysis map for the supplied filings; no credit, legal or investment conclusion is drawn.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the fiscal year ended 30 September 2024 (HTML text extraction) | 2024-11-07 (signature and auditor report date) | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Controlling period source: audited balance sheet and income statement, debt description, covenant summary, liquidity, subsequent October 2024 events, exhibit index, filing date |
| TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 29 June 2024 | 2024-08-06 (signature date) | ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2 | Interim period coverage (Q3 FY2024 and 9M YTD); filing date check |
| TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 30 March 2024 | 2024-05-07 (signature date) | fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6 | Interim period coverage (Q2 FY2024 and 6M YTD); filing date check |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly report on Form 10-Q for the quarter ended 28 December 2024 (after the as-of date) | 2025-02-04 (signature date) | ec98b47e6ebad9663286dc04b35dade04d11e7d12c3642ddaa6ef549a33d671f | Subsequent-event evidence only: debt note with 30 September 2024 comparative by instrument, October 2024 dividend payment and securitization draw; never blended into FY2024 figures |
| TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | Annual report to shareholders (PDF) reproducing the Form 10-K for the fiscal year ended 30 September 2024 | not stated (reproduces the 10-K signed 2024-11-07) | dc6a8ea6249e4e919d190a4bbb459d9bf4eded005b7d5680ae911b32d44d44af | Duplicate check against the 10-K (cover, contents, signatures, auditor report); excluded as contained duplicate |

No prior analyses were supplied for this run; source readiness is the entry point and relies on issuer documents only.

## Findings

### Bottom line

The supplied filings can support the deep credit assessment with limitations: audited FY2024 accounts, interim filings and the following quarter's filing cover financial, liquidity and capital-structure work, but no governing debt documents, credit ratings, market prices or peer filings are supplied.

For creditors the decisive period-fit point is that year-end cash of USD 6,261 million is pre-funded for a special dividend: USD 4,348 million was paid in October 2024, and the 2024 annual report itself states pro forma cash liquidity of USD 2,919 million against reported USD 7,267 million. Every later analysis must carry that October 2024 payment as a dated subsequent event, not as period cash. Covenant, priority and recovery work can rely only on the annual report's summaries of the credit agreement and indentures until the executed documents are obtained. Rating-trigger, market-implied and relative-value work lack any source at all.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; calculation C1; calculation C2

### What the effective source set supports

The effective source set is four filings: the 2024 annual report on Form 10-K as the controlling period source, the March and June 2024 quarterly reports for interim coverage, and the December 2024 quarterly report as evidence of what happened after the as-of date. The PDF annual report to shareholders reproduces the 10-K, with the same cover, contents, board signatures and auditor report dated 2024-11-07, so it is excluded as a contained duplicate rather than used as a second version of the same facts. Its containment was checked on those sampled pages only, which is a minor limitation.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 1–2; TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf, pages 1–3; TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf, page 100

Capital-structure evidence is unusually complete for a filing-only set. The annual report lists all four term loan tranches, totalling USD 8,702 million, and nine note issues, with maturity, rate and rank, and the December 2024 quarterly report gives gross amount, issuance costs, discount and net carrying value for each instrument at 30 September 2024. The instrument-level carrying values tie to the balance sheet at USD 24,880 million, including the securitization borrowing of USD 486 million. Financial foundation can therefore build debt on the carrying-value basis without inference, and Structural priority can take ranking and guarantor perimeter from the annual report's guarantor disclosure.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–60; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 19–20; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; calculation C3; calculation C4; calculation C5

### Where the year-end figures must be handled with care

The year-end balance sheet carries a USD 4,216 million dividend payable alongside USD 6,261 million of cash, because the USD 75.00 per share special dividend was declared on 2024-09-19, concurrently with USD 3,000 million of new senior secured debt, and paid in October 2024. Unless the October 2024 payment is shown as a subsequent event, cash-based measures such as net debt or the liquidity runway would overstate creditor protection at the as-of date. The remaining USD 162.5 million of the receivables securitization was also drawn in October 2024.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 21

The sources state two figures for the October 2024 payment, and they are not reconciled here. The annual report states about USD 4,348 million for the special dividend and dividend equivalents. The December 2024 quarterly cash-flow statement shows USD 4,396 million of special dividend and dividend equivalent payments for the quarter, USD 48 million higher. The gap may reflect other dividend-equivalent payments in the quarter, but the documents read here do not establish that. Liquidity and Financial foundation should cite both figures with their roles.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54; TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4; calculation C6

### What remains blocked or limited

The credit agreement, its Amendment No. 15 dated 2024-03-22, and the note indentures appear only as exhibits incorporated by reference in the annual report; none is in the set, and the run settings record no legal documents attached. The annual report summarises the key tests: incremental debt is allowed up to 7.50x consolidated net leverage and 5.00x secured net debt; a maximum net leverage ratio of 7.50x applies only when revolver usage exceeds 40% of commitments; and there are no maintenance covenants in the term loans or indentures. This summary cannot show basket sizes, the full definition of EBITDA as used in the agreements, restricted-payment capacity or collateral terms. Given that FY2024 included two debt-funded special dividends, those definitions are exactly what decides how much more value can leave the creditor group.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 112

The strongest counterargument is that this summary is specific enough for covenant work to proceed. It names the incurrence ratios, the springing revolver test and covenant compliance at 30 September 2024. That view would win if the committee needs only headline debt capacity and the springing-test threshold. It loses once the question is restricted-payment or investment capacity, or the amount of priming debt that could be added, because those turn on baskets and definitions the summary omits. Legal & covenants and Covenant capacity are therefore conditional on the executed documents, not blocked outright. Their outputs must be marked as resting on summary evidence.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62

No credit ratings, bond or loan prices, or peer financials are in the documents, and the run settings leave all of these blank. Ratings & triggers, Market-implied risk, Security selection and the quantitative part of Peer benchmark therefore have no evidence base. These are source gaps, not parsing failures. Downside, Rates, FX & hedging, Liquidity and Forward credit model can run on the filings, but the run settings supply no scenario assumptions, so any stress or forecast assumption will be the analyst's own and must be labelled as such.

### Downside path for evidence quality

The readiness risk follows a specific chain. If later analyses take year-end cash at face value, the first break is a net-debt figure that ignores the October 2024 payment. That flows into overstated liquidity headroom and an understated leverage ratio against the 7.50x springing test. The early warning is any later analysis quoting USD 6,261 million of cash without the pro forma figure. A second chain runs through the missing legal documents: covenant capacity inferred from the summary could understate dividend or debt capacity. That would surface as a disagreement between Covenant capacity and Refinancing & LME on how much secured debt can be added.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Events: Sources

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2023-11-27 | day | 2024-11-07 | Special cash dividend of USD 35.00 per share paid, about USD 2,020 million including dividend equivalents, from cash on hand | Historical — paid a special cash dividend | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | First of two FY2024 shareholder distributions; sets the period's cash outflow basis |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement executed (repricing and refinancing of term loans) | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Governing covenant terms changed; the amendment text is not in the set |
| 2024-06-06 | day | 2024-11-07 | Acquisition of CPI's Electron Device Business for about USD 1,385 million | Historical — completed the acquisition | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | Largest FY2024 acquisition; partial-year contribution affects LTM comparability |
| 2024-07-12 | day | 2024-11-07 | Securitization facility amended: capacity raised from USD 450 million to USD 650 million, maturity extended to 2025-07-11 | Historical — amended the Securitization Facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Short-dated secured funding source within the liquidity base |
| 2024-07-31 | day | 2024-11-07 | Acquisition of Raptor Scientific for about USD 647 million | Historical — completed the acquisition | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | Late-year acquisition; little of its earnings is in FY2024 |
| 2024-09-19 | day | 2024-11-07 | USD 3,000 million senior secured debt issued and USD 75.00 per share special dividend declared | Historical — issuance of new senior secured debt; Board authorized and declared a special cash dividend | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | Debt-funded distribution two weeks before year-end; creates the dividend payable at the as-of date |
| 2024-10 | month | 2024-11-07 | Special dividend and dividend equivalents of about USD 4,348 million paid | Historical — payments were made in October 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | Subsequent event; reduces cash liquidity to USD 2,919 million pro forma |
| 2024-10 | month | 2024-11-07 | Remaining USD 162.5 million of the securitization facility drawn | Historical — subsequently drew the remaining amount | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | Subsequent event; securitization fully drawn at USD 650 million |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 11 |
| Calculated | 4 |
| Assumption-Based | 0 |
| Analyst Inference | 2 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 3 |
| Fields present | 6 |
| Fields total | 6 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 2 |
| MINOR | 2 |

### Analytical appendix — complete canonical registers

#### P3 Input inventory

<!-- table-id: P3 -->
| Source | Document family | Entity | Period / version | Authority tier | Decision | Readiness input | Note |
|---|---|---|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual filing (Form 10-K), HTML text extraction, 181 pages | TransDigm Group Incorporated (Delaware); TransDigm Inc. as borrower and note issuer | FY ended 2024-09-30; audited; signed 2024-11-07 | 1 — controlling primary filing | PASS_THROUGH | ORIGINAL | Extraction preserves tables as text rows with page locators; financial statements and notes present |
| TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Quarterly filing (Form 10-Q), 77 pages | TransDigm Group Incorporated | Q3 FY2024 and 9M YTD to 2024-06-29; signed 2024-08-06 | 1 — primary filing | PASS_THROUGH | ORIGINAL | Unaudited interim |
| TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | Quarterly filing (Form 10-Q), 72 pages | TransDigm Group Incorporated | Q2 FY2024 and 6M YTD to 2024-03-30; signed 2024-05-07 | 1 — primary filing | PASS_THROUGH | ORIGINAL | Unaudited interim |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | Quarterly filing (Form 10-Q), 58 pages | TransDigm Group Incorporated | Q1 FY2025 to 2024-12-28 with 2024-09-30 comparatives; signed 2025-02-04 | 1 — primary filing, after the as-of date | PASS_THROUGH | ORIGINAL | Subsequent-event evidence and Q1 FY2024 comparative only |
| TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | Annual report to shareholders (PDF), 160 pages | TransDigm Group Incorporated | FY ended 2024-09-30; reproduces the 10-K signed 2024-11-07; final pages blank | 1 — same filing content | SKIP_DUPLICATE | NONE | Replacement source: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl; containment checked on cover, contents, signatures and auditor report pages |

#### T1 Input gate

<!-- table-id: T1 -->
| Gate item | Value | Result | Source |
|---|---|---|---|
| Objective | Deep credit assessment (pathway use case; no separate objective stated) | Recorded | Run settings |
| Issuer identity | TransDigm Group Incorporated, Delaware; holds all capital stock of TransDigm Inc. | Confirmed from document content | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 1 |
| As-of date and cutoff | 2024-09-30 | Matches 10-K fiscal year end | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 1 |
| Current and prior period | Left blank in run settings; taken as FY2024 and FY2023 from the as-of date | Defaulted, not zero | Run settings |
| Reporting currency | USD, amounts in millions | Confirmed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| Primary period source | Audited 10-K for FY2024 | PASS | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| Interim coverage | Q2 and Q3 FY2024 10-Qs; Q1 FY2024 only as comparative in later filings | PASS with limitation | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| Governing legal documents | Not supplied; run settings record legal documents as none | GAP — material | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 112 |
| Ratings, quotes, peers, scenario assumptions | Not supplied; run settings blank | GAP — material | Run settings |
| Overall source gate | Partial: core financial evidence present; legal, rating and market evidence absent | partial | Run settings |

#### T2 Source register

<!-- table-id: T2 -->
| Source | Authority tier | Quality | Entity and period fit | Freshness against as-of | Active representation | Limitation |
|---|---|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | 1 | High — audited, unqualified opinion | Exact: consolidated group, FY2024 | Period-end document, filed 38 days after as-of | Original (pass-through) | Text extraction: table layout flattened; exhibits incorporated by reference not included |
| TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | 1 | Medium-high — unaudited | Consolidated group, Q3 FY2024 | Before as-of | Original (pass-through) | Unaudited |
| TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | 1 | Medium-high — unaudited | Consolidated group, Q2 FY2024 | Before as-of | Original (pass-through) | Unaudited |
| TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl | 1 | Medium-high — unaudited | Consolidated group, Q1 FY2025 | After as-of (subsequent) | Original (pass-through) | Use only for dated subsequent events and 2024-09-30 comparatives |
| TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf | 1 | Same content as the 10-K | Same as 10-K | Same as 10-K | None (excluded duplicate) | Containment checked on sampled pages only |

#### T4 Content-to-module map

<!-- table-id: T4 -->
| Analysis | Evidence demand | Content basis | Source | Mapping status | Limitation |
|---|---|---|---|---|---|
| Business & governance | Business, segments, acquisitions, capital allocation policy, governance | 10-K business, MD&A, capital allocation order | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 | READY_WITH_LIMITATIONS | Proxy statement (Part III: related parties, compensation) not supplied |
| Financial foundation | Statements, debt at carrying value, cash, EBITDA As Defined reconciliation | Audited statements; instrument-level debt table | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 | READY_WITH_LIMITATIONS | Q1 FY2024 only as comparative; October 2024 events must stay outside period figures |
| Earnings changes | FY2024 vs FY2023 and quarterly deltas | Income statement three years; segment EBITDA As Defined | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 50 | READY | None material |
| Earnings quality | Add-back detail and cash reconciliation | Non-GAAP reconciliation in 10-K | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 44 | READY_WITH_LIMITATIONS | No management bridge; agreement EBITDA definition not supplied |
| Peer benchmark | Peer financials | None in set | Run settings | CONDITIONAL | Peer filings not supplied; peer source set to public research |
| Liquidity | Cash, facilities, pro forma liquidity, near-term uses | Liquidity table and pro forma note | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 55–56 | READY_WITH_LIMITATIONS | Two figures for the October payment |
| Refinancing & LME | Maturity ladder, pricing, incremental capacity | Term loan and note tables | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 | READY_WITH_LIMITATIONS | No market pricing; covenant detail summary only |
| Fundamental credit | Synthesis inputs | All filings | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 | READY_WITH_LIMITATIONS | Inherits legal and market gaps |
| Downside | Operating drivers and sensitivities | Risk factors, MD&A | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 19 | READY_WITH_LIMITATIONS | No scenario assumptions in run settings |
| Forward credit model | Capex guide, history | Capex guide 2.5% to 3.5% of net sales for FY2025 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 | READY_WITH_LIMITATIONS | No revenue or EBITDA guidance in set |
| Rates, FX & hedging | Fixed/floating mix, hedges | About 77% of gross debt fixed rate; hedging note | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 55 | READY_WITH_LIMITATIONS | No hedge assumptions supplied |
| Ratings & triggers | Agency ratings and outlooks | None in set | Run settings | CONDITIONAL | Ratings not supplied |
| Legal & covenants | Executed credit agreement, amendments, indentures | 10-K summaries only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 | CONDITIONAL | Governing documents not in set |
| Covenant capacity | Definitions, baskets, ratios | 10-K summaries only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | CONDITIONAL | Basket sizes and definitions not established |
| Structural priority | Ranking, guarantors, non-guarantor perimeter | Guarantor information and summarised combined financials | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 | READY_WITH_LIMITATIONS | Collateral terms and guarantor exhibit not supplied |
| Intercreditor control | Intercreditor terms | None in set | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 112 | CONDITIONAL | Intercreditor documents not supplied |
| Recovery & fulcrum | Claims by rank, asset base | Debt by instrument and rank; balance sheet | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 19–20 | READY_WITH_LIMITATIONS | No valuation inputs; collateral terms not established |
| Market-implied risk | Bond and loan prices, spreads | None in set | Run settings | CONDITIONAL | Quotes not supplied |
| Security selection | Prices across the structure | None in set | Run settings | CONDITIONAL | Quotes not supplied |
| Research questions | Peers, ratings, prices, executed documents from public filings | Gaps listed above | Run settings | READY_WITH_LIMITATIONS | Research scope not stated in run settings |
| Evidence validation | Source locators for every claim | All active sources | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 1 | READY | None |
| Committee decision | Synthesised analyses | All active sources | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 1 | READY_WITH_LIMITATIONS | Inherits legal and market gaps |

#### T6 Evidence trace

<!-- table-id: T6 -->
| Claim ID | Claim | Value | Lineage | Source |
|---|---|---|---|---|
| E1 | Cash and cash equivalents at 2024-09-30 | USD 6,261 million | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| E2 | Dividends payable at 2024-09-30 | USD 4,216 million | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| E3 | Cash liquidity at 2024-09-30 (cash, revolver USD 843 million, securitization USD 163 million) | USD 7,267 million | Directly Sourced; tied in C1 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 55 |
| E4 | Pro forma cash liquidity after October 2024 payment | USD 2,919 million | Directly Sourced; tied in C2 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 56 |
| E5 | Special dividend and equivalents paid October 2024 (annual report figure) | USD 4,348 million | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 |
| E6 | Special dividend and equivalent payments in Q1 FY2025 (cash-flow figure) | USD 4,396 million | Conflicting with E5 by USD 48 million; not reconciled | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |
| E7 | Senior secured debt issued 2024-09-19 | USD 3,000 million | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 54 |
| E8 | Term loans principal, four tranches | USD 8,702 million | Directly Sourced; tied in C3 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| E9 | Total debt carrying value at 2024-09-30 (current USD 98 million, securitization USD 486 million, long-term USD 24,296 million) | USD 24,880 million | Calculated (C4, C5) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| E10 | Incurrence tests for incremental facilities | 7.25x net leverage; 5.00x secured net debt | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E11 | Springing revolver covenant | 7.50x when usage exceeds 40% (USD 364 million) of commitments | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| E12 | Securitization drawn and remaining draw in October 2024 | USD 487.5 million drawn; USD 162.5 million drawn October 2024 | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54, 62 |
| E13 | Governing credit agreement, Amendment No. 15 and indentures incorporated by reference only | Not supplied | Insufficient Information | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 112 |
| E14 | Credit ratings | Not supplied: none in set or run settings | Insufficient Information | Run settings |
| E15 | Market prices and peer data | Not supplied: none in set or run settings | Insufficient Information | Run settings |
| E16 | Annual report PDF is a contained duplicate of the 10-K | Same signatures and auditor date 2024-11-07 | Analyst Inference | TDG_FY2024_annual-report_SEC-PDF_0001260221-25-000008_a841225transd-9b8b215f.pdf, page 100 |
| E17 | Fixed-rate share of gross debt at 2024-09-30 | About 77% | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 55 |

## Calculations

| ID | Calculation | Inputs | Result | Period and unit | Source |
|---|---|---|---|---|---|
| C1 | Cash liquidity tie-out: cash plus revolver availability plus securitization availability | 6,261 + 843 + 163 | 7,267 (equals reported) | 2024-09-30, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 55 |
| C2 | Pro forma liquidity tie-out: cash liquidity less October 2024 dividend payment | 7,267 − 4,348 | 2,919 (equals reported pro forma) | 2024-09-30 pro forma, USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 54–56 |
| C3 | Term loan tranche tie-out: Tranches I, J, K, L | 1,871 + 3,632 + 1,699 + 1,500 | 8,702 (equals reported) | 2024-09-30, USD million principal | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| C4 | Instrument-level net carrying values summed (securitization, term loans, nine notes, government advances, finance leases) | 486 + 8,642 + 2,641 + 2,077 + 1,194 + 2,727 + 746 + 1,438 + 984 + 2,180 + 1,486 + 17 + 262 | 24,880 | 2024-09-30, USD million carrying value | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, pages 19–20 |
| C5 | Balance-sheet debt: current portion plus securitization plus long-term debt | 98 + 486 + 24,296 | 24,880 (ties to C4) | 2024-09-30, USD million carrying value | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 120 |
| C6 | Difference between the two October 2024 payment figures | 4,396 − 4,348 | 48 (left unreconciled) | Q1 FY2025 vs FY2024 disclosure, USD million | TDG_2024-12-28_10-Q_0001260221-25-000014_tdg-20241228.htm.jsonl, page 4 |

The calculations only test whether the documents agree with each other; none of them produces a new credit metric. The instrument-level table in the December 2024 quarterly report shows a subtotal of USD 24,394 million that leaves out the securitization row. The row items still sum to the balance-sheet total of USD 24,880 million, so later work should take the row items rather than that subtotal.

## Gaps

- The executed credit agreement, its amendments including the March 2024 amendment, the note indentures, the guarantor listing and any intercreditor or collateral documents are not supplied. Covenant baskets, the agreements' EBITDA definition, restricted-payment capacity and collateral scope are therefore not established. This matters because FY2024 included two special dividends, one funded by new secured debt. Severity: material.
- No credit ratings, bond or loan prices or peer financials are supplied, and the run settings leave them blank. Rating triggers, market-implied risk, relative value and quantitative peer comparison have no evidence base. Severity: material.
- The run settings supply no stress, liquidity, rates, refinancing or recovery assumptions. Any assumption used in those analyses will be the analyst's own and must be labelled. Severity: minor.
- The quarterly report for the December 2023 quarter is not supplied. That quarter is available only as a comparative in the December 2024 quarterly report and by difference from year-to-date figures. Severity: minor.
- The proxy statement is not supplied, so related-party, compensation and board detail beyond the annual report is not established. Severity: minor.
- The October 2024 payment appears as USD 4,348 million in the 2024 annual report and USD 4,396 million in the next quarter's cash-flow statement. The documents read do not reconcile the two figures. Severity: minor.
- Containment of the PDF annual report within the 10-K was checked on sampled pages only. Any content unique to the PDF would not be in the effective source set. Severity: minor.
- These results may be used only for source readiness. They do not state a credit, legal or investment view.

## Next module

The orchestrator selects the next module.
