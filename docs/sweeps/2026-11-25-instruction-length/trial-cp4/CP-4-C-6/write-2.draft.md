---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-4
module_name: LegalCovenantInterpreter
schema_family: Nested
layer: L4
analysis_date: 2024-09-30
reporting_period: FY2024 (year ended 2024-09-30)
run_id: tdg-2024-09-30-deep_credit_assessment-opus-high
pathway: deep_credit_assessment
module_status: Completed with Limitations
committee_status: Requires More Work
---

## Request
Legal and covenant review of TransDigm Group Incorporated as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers covenant meaning and document authority, the restricted-group and guarantee map, intercreditor control, and covenant capacity and headroom for the credit agreement and the supplied indentures.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Covenant summary, springing-test trigger, compliance statement, guarantee and structural-subordination disclosure, obligor-group summary, tranche terms |
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, execution version, with the annexed amended credit agreement | not stated (agreement dated 2024-09-19) | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: definitions, debt incurrence, restricted payments, investments, joinder, financial covenant, amendments, governing law, Tranche L |
| d833756dex101.htm.jsonl | Amendment No. 16, loan modification and refinancing facility agreement, execution version, with annexed credit agreement | not stated (agreement dated 2024-06-04) | 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac | Cross-check of the financial covenant and the financial-covenant event of default |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033, execution version | not stated (indenture dated 2024-09-19) | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Notes restricted payments, ratio debt, secured-debt liens, intercreditor definition, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | not stated (indenture dated 2019-11-13) | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordinated-notes restricted-payment architecture |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source selection, legal-document inventory and missing-document restrictions |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying and principal debt, cash, EBITDA measures, net leverage, post-balance-sheet adjustments, debt stack |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Ownership of the borrower, dividend recapitalisation facts and dates, acquisition activity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence of add-back categories relevant to covenant EBITDA inflation; dividend payable treatment |

## Findings

### Bottom line
TransDigm's covenant package is aggressive, scoring four out of five: term loans and notes carry no maintenance test, and leverage-gated permissions let the company add secured debt and pay it out to shareholders, as the USD 4,348 million October 2024 dividend showed.

The gate on shareholder payments is the credit agreement's 6.75x net leverage test; the 2033 secured notes allow unlimited payments while fixed-charge cover exceeds 2.0x. New pari secured debt is limited only by a 5.00x secured net leverage test under the loans and 5.25x under the 2033 notes. The single maintenance test protects revolving lenders only and was dormant at year-end, with USD 67 million of letters of credit against a USD 364 million trigger. All-lender consent protects collateral and material-guarantor releases and pro rata sharing, but covenant-defined ratios, compliance certificates and the intercreditor agreement are absent, so headroom and enforcement control are not established.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, pages 75–76; d887611dex41.htm.jsonl, page 43; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; Business & governance (CP-1A); calculation K01

### Key findings
- **Term lenders and noteholders have no early-warning tripwire, so default risk will surface through liquidity, not covenants.** The only maintenance test is a 7.50x net leverage ceiling, or 8.00x for four quarters after a material acquisition, that applies only when revolver exposure exceeds 40% of commitments. At year-end exposure was USD 67 million of letters of credit, 7.36% of commitments, leaving 32.64 percentage points or USD 297 million before the test springs. Even a breach is a revolver-only default: term lenders gain default rights only after revolving lenders terminate or accelerate.
Basis: d833756dex101.htm.jsonl, page 191; d833756dex101.htm.jsonl, page 194; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01; calculation K02; calculation K03; calculation K04
- **Leakage is gated by leverage, not by a capped basket, and the gate was demonstrably open.** The credit agreement permits any restricted payment at or below 6.75x net leverage with no default, and a dividend declared when permitted may be paid within 60 days. The 2033 secured-notes indenture adds unlimited payments while fixed-charge cover exceeds 2.0x and a builder basket of USD 400 million plus 50% of cumulative net income since October 2010. Financial foundation puts reported-EBITDA net leverage at 4.88x at year-end and 6.02x pro forma for the October 2024 dividend payment, with net debt of USD 18,619 million at year-end and USD 22,967 million pro forma; the October 2024 securitization draw leaves both unchanged. On EBITDA As Defined it shows 4.46x at year-end, and no post-dividend figure is established on that basis. The covenant-defined ratio is not disclosed, so remaining distribution capacity is not established.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 70–76; Financial foundation (CP-1); Business & governance (CP-1A)
- **First-lien recovery can be diluted by new pari debt sized off earnings, which is how the September 2024 recapitalisation was financed.** Pari secured ratio debt and incremental loans need only 5.00x secured net leverage, with 7.25x total net leverage for incremental loans and junior or unsecured debt, and the 2033 notes allow secured ratio debt up to 5.25x. New first-lien debt of USD 3,000 million funded the dividend: USD 1,500 million of Tranche L loans plus USD 1,500 million of 2033 notes. Subordinated noteholders, with USD 4,600 million of principal, already sit behind USD 19,702 million of first-lien principal.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 146; d887611dex101.htm.jsonl, pages 1–2; d887611dex41.htm.jsonl, page 43; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–61; calculation K09; calculation K10; calculation K12
- **About a fifth of sales sits outside the guarantee net, and the documents let more value move there.** The obligor group reported USD 6,294 million of USD 7,940 million consolidated sales, or 79.27%, leaving USD 1,646 million, or 20.73%, at non-guarantors, mostly foreign subsidiaries that need not join. Investments in any restricted subsidiary, including non-guarantors, are uncapped; investments in unrestricted subsidiaries are capped at the greater of USD 250 million and 10% of covenant EBITDA, but a general basket of the greater of USD 500 million and 25% of total assets and an unlimited basket at 5.75x net leverage, available with no revolver loans and at least USD 200 million of unrestricted cash, can add to it. Obligors hold a net USD 1,881 million intercompany receivable from non-guarantors, which ranks alongside those subsidiaries' own creditors.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 173; calculation K05; calculation K06
- **Lender-control protections are strongest against releases and weakest against offer-based restructurings.** Releasing all or substantially all collateral or any material guarantor, changing pro rata sharing or changing voting percentages needs every lender. Majority lenders can still permit non-pro rata prepayments and loan-modification offers made to all lenders of a class, and the agent can add pari or junior intercreditor arrangements for permitted debt without lender consent. The reviewed amendment text contains no explicit all-lender protection against lien subordination, so uptier protection is not established.
Basis: d887611dex101.htm.jsonl, pages 204–205

### Contrary evidence and what would change the view
The strongest counter-case is that the package is not as loose as a large-cap high-yield deal can be. The loans' payment test at 6.75x is tighter than the 7.25x debt test, so the company cannot borrow to the debt ceiling and distribute all of it. The secured test at 5.00x caps pari dilution, sacred rights block a release-based strip of collateral or guarantors, and non-pro rata transactions must be offered to every lender in a class. The issuer also reports compliance with all debt covenants, and earnings growth expands every leverage-based permission without new debt. That case would win if a compliance certificate showed the covenant-defined net leverage near 6.75x after the October payment, closing the open-ended payment route. It would also win if the intercreditor agreement and collateral agreement showed broad excluded-asset limits and tight release conditions, or if a future amendment added an all-lender lien-subordination right. Conversely, evidence of a second debt-funded distribution, an unrestricted-subsidiary designation or a majority-lender amendment touching lien priority would harden the view toward five out of five. Until then the conclusion bears on implementation: first-lien positions should be sized for pari dilution, and subordinated notes for payment-blockage and recovery dilution rather than covenant-driven early default.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, pages 204–205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- The first-lien intercreditor agreement and its six joinders are referenced but not supplied, so who directs enforcement between first-lien lenders and secured noteholders, any standstill and turnover are not established; the intercreditor conclusions stop at payment and lien rank, and first-lien recovery-control severity cannot be scored.
Basis: d887611dex41.htm.jsonl, page 30
- No compliance certificate or covenant-defined ratio is available, so headroom to the 6.75x, 7.25x, 5.00x, 5.25x and 2.0x tests is not calculated; the leakage and dilution conclusions describe what the documents permit, not how much capacity remains after the October 2024 payment.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Financial foundation (CP-1)
- The guarantee and collateral agreement and the guarantor list exhibit are not supplied, so excluded assets, equity-pledge limits and release triggers below the all-lender threshold are not established; the collateral-protection score is provisional and could move by one point either way.
Basis: d887611dex101.htm.jsonl, page 173; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58
- Only the opening body of the covenant EBITDA definition, the cost-savings language and the pro forma rules were not read; the add-back score rests on the uncapped net-income exclusions that were read and stays provisional.
Basis: d887611dex101.htm.jsonl, pages 25–27
- Indentures for the 2028–2032 secured notes and the two 2029 subordinated notes are not supplied, and the fixed-charge threshold in the 2027 subordinated indenture's open-ended payment permission was not read; the note-level leakage conclusion relies on the 2033 indenture and the annual report's statement that the notes share many credit-agreement covenants.
Basis: d826058dex41.htm.jsonl, page 63; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61

### Capital structure

| Instrument | Principal at 2024-09-30 | Rank and security | Obligors and guarantors | Governing gate on new debt or payments | Source |
|---|---|---|---|---|---|
| Revolving credit facility | USD 910 million commitment; USD 67 million letters of credit; USD 843 million available | Senior secured first lien | TransDigm Inc.; Holdings and domestic restricted subsidiaries as loan parties | Springing 7.50x net leverage above 40% usage | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d833756dex101.htm.jsonl, page 191 |
| Term loans I, J, K, L | USD 8,702 million (Tranche L USD 1,500 million added 2024-09-19); USD 88 million a year amortisation | Senior secured first lien, equal payment rank with secured notes | Same loan parties | Incremental: 7.25x net and 5.00x secured net leverage | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 146; calculation K08; calculation K11 |
| Secured notes 2028–2033 | USD 11,000 million | Senior secured, sharing collateral under the first-lien intercreditor agreement | TransDigm Inc.; Holdings, TransDigm UK (2028) and domestic restricted subsidiaries | 2033 indenture: payments unlimited above 2.0x fixed-charge cover; secured ratio debt to 5.25x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–61; d887611dex41.htm.jsonl, pages 30, 43, 75; calculation K09 |
| First-lien principal total | USD 19,702 million (carrying USD 19,534 million) | Pari first lien | As above | Pari capacity at 5.00x secured net leverage under loans | Financial foundation (CP-1); calculation K12 |
| Senior subordinated notes 2027, January 2029, May 2029 | USD 4,600 million | Unsecured, contractually subordinated to senior debt | TransDigm Inc.; Holdings, TransDigm UK, domestic restricted subsidiaries | 2027 indenture: builder basket plus open-ended ratio permission | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; d826058dex41.htm.jsonl, pages 59–63; calculation K10 |
| Receivables securitization | USD 487.5 million drawn of USD 650 million; remaining USD 162.5 million drawn October 2024 | Non-recourse securitization entity; excluded from covenant debt | Securitization entity | Basket greater of USD 725 million and 20% of covenant EBITDA | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, pages 28, 60 |

### Reference leverage inputs

Reference leverage inputs used in this review, all taken from Financial foundation and none of them covenant-defined:

| Metric | Year-end 2024-09-30 | Pro forma for October 2024 dividend payment | Pro forma for October 2024 securitization draw | Basis | Source |
|---|---|---|---|---|---|
| Net debt | USD 18,619 million | USD 22,967 million | USD 18,619 million | Carrying debt less reported cash | Financial foundation (CP-1) |
| Net debt / reported EBITDA | 4.88x | 6.02x | 4.88x | Reported EBITDA USD 3,813 million | Financial foundation (CP-1) |
| Net debt / EBITDA As Defined | 4.46x | Not established: Financial foundation states no pro forma on this basis | Not established: Financial foundation states no pro forma on this basis | EBITDA As Defined USD 4,173 million | Financial foundation (CP-1) |
| Cash | USD 6,261 million | USD 1,913 million | USD 6,423.5 million | Reported cash and equivalents | Financial foundation (CP-1) |
| October 2024 dividend and equivalents | Declared 2024-09-19: USD 4,348 million | Paid 2024-10-18 | Not applicable: separate event | Funded by USD 3,000 million new first-lien debt and cash | Business & governance (CP-1A) |

### Covenant tests and headroom

| Test | Document | Threshold | Current | Headroom | Status |
|---|---|---|---|---|---|
| Revolver exposure trigger for the maintenance test | Credit agreement | 40.00% of commitments (USD 364 million) | 7.36% (USD 67 million letters of credit) | 32.64 percentage points (USD 297 million) | Test dormant at year-end |
| Revolver maintenance net leverage | Credit agreement | 7.50x (8.00x after a material acquisition) | Not supplied: covenant ratio not disclosed | Not calculable: current ratio missing | Not tested: trigger not met; issuer reports compliance |
| Open-ended restricted payments | Credit agreement | 6.75x net leverage | Not supplied: covenant ratio not disclosed | Not calculable: current ratio missing | Demonstrably usable at declaration on 2024-09-19 |
| Incremental, junior-lien and unsecured ratio debt | Credit agreement | 7.25x net leverage | Not supplied: covenant ratio not disclosed | Not calculable: current ratio missing | Used for Tranche L |
| Pari secured incremental and ratio debt | Credit agreement | 5.00x secured net leverage | Not supplied: covenant ratio not disclosed | Not calculable: current ratio missing | Used for Tranche L |
| Open-ended restricted payments and ratio debt | 2033 secured-notes indenture | Above 2.0x fixed-charge cover | Not supplied: covenant ratio not disclosed | Not calculable: current ratio missing | Not established |
| Secured ratio debt liens | 2033 secured-notes indenture | 5.25x secured net leverage | Not supplied: covenant ratio not disclosed | Not calculable: current ratio missing | Not established |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Credit agreement revolver exposure trigger | 40 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Credit agreement financial covenant; annual report revolver usage. Assumes letters of credit are not cash-collateralised at 103%; a trigger, not a ratio covenant |
| Credit agreement revolver maintenance net leverage | 7.50 | Not supplied: covenant-defined ratio not disclosed and no compliance certificate | Not supplied: current ratio not disclosed | Passes at or below | x | Applies only above the exposure trigger; 8.00 for four quarters after a material acquisition |
| Credit agreement open-ended restricted payments | 6.75 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current ratio not disclosed | Passes at or below | x | Pro forma for the payment and its financing; no default; tested at declaration if paid within 60 days |
| Credit agreement incremental, junior and unsecured ratio debt | 7.25 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current ratio not disclosed | Passes at or below | x | Pro forma for the debt and use of proceeds |
| Credit agreement pari secured debt | 5.00 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current ratio not disclosed | Passes at or below | x | Secured net debt test; excludes refinancing debt |
| Credit agreement unlimited investments | 5.75 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current ratio not disclosed | Passes at or below | x | Also needs no revolver loans and at least USD 200 million unrestricted cash |
| 2033 notes open-ended restricted payments | 2.0 | Not supplied: fixed-charge cover not disclosed | Not supplied: current ratio not disclosed | Passes above | x | Indenture fixed-charge definition not read in full |
| 2033 notes ratio debt | 2.0 | Not supplied: fixed-charge cover not disclosed | Not supplied: current ratio not disclosed | Passes above | x | Non-guarantor ratio debt capped at USD 400 million |
| 2033 notes secured ratio debt liens | 5.25 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current ratio not disclosed | Passes at or below | x | Read from the permitted-liens clause excerpt; limited-condition acquisition timing applies |

Only the revolver exposure trigger is measurable from filed figures; every ratio test shows a threshold without a tested value, so the chart shows which side passes, not how close the company is.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the indenture states no filing date | First Lien Intercreditor Agreement dated | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs collateral sharing and enforcement between credit-agreement and secured-note creditors; not in the source set |
| 2019-11-13 | day | Not supplied: the indenture states no filing date | Indenture for the 2027 senior subordinated notes | Historical — indenture dated 2019-11-13 | d826058dex41.htm.jsonl, page 1 | Builder basket and open-ended ratio permission for payments; subordination to senior debt |
| 2024-02-27 | day | Not supplied: the indenture states no filing date | Joinder No. 5 to the intercreditor agreement | Historical — Joinder No. 5, dated February 27, 2024 | d887611dex41.htm.jsonl, page 30 | Added further secured debt to the shared first-lien collateral |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Last change to the restrictive covenants before the cutoff; text not supplied |
| 2024-06-04 | day | Not supplied: the agreement states no filing date | Amendment No. 16 executed | Historical — execution version dated 2024-06-04 | d833756dex101.htm.jsonl, page 1 | Loan modification and refinancing; contains the reviewed financial-covenant text |
| 2024-07-12 | day | 2024-11-07 | Securitization facility amended to USD 650 million, maturity 2025-07-11 | Historical — amended the Securitization Facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Receivables funding sits outside covenant debt within its basket |
| 2024-09-19 | day | Not supplied: the agreement states no filing date | Amendment No. 17: USD 1,500 million Tranche L incremental term loans | Historical — Incremental Term Loan Assumption Agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, pages 1–2 | Pari first-lien debt incurred under the 7.25x and 5.00x incremental tests to fund the dividend |
| 2024-09-19 | day | Not supplied: the indenture states no filing date | 2033 secured notes indenture and Joinder No. 6 to the intercreditor agreement | Historical — indenture dated 2024-09-19; Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, pages 1, 30 | USD 1,500 million pari first-lien notes with looser payment and lien tests than the loans |
| 2027-09-15 | day | Not supplied: the indenture states no filing date | First optional redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Earliest date for redeeming the 2033 notes at the indenture's call prices |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report as carried by Business & governance; both Delaware corporations |
| TransDigm Group Incorporated | Guarantees as Holdings and loan party | Guarantee | Credit facilities | Credit agreement, loan parties jointly and severally; New York law |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | Secured notes | Annual report guarantee description; New York-law indentures |
| TransDigm Group Incorporated | Senior subordinated unsecured guarantee | Guarantee | Subordinated notes | Annual report guarantee description; New York-law indentures |
| Domestic restricted subsidiaries | Must join as loan parties within 20 business days unless excluded | Guarantee | Credit facilities | Credit agreement joinder clause; New York law |
| Domestic restricted subsidiaries | Senior secured guarantee | Guarantee | Secured notes | Annual report; 2033 indenture; New York law |
| TransDigm UK | Senior secured guarantee of the 2028 notes and subordinated guarantee of the subordinated notes | Guarantee | Secured notes | Annual report guarantee description; New York-law indentures; UK entity jurisdiction not stated |
| TransDigm Inc. | Grants first-lien security, including available cash | Security | Credit facilities | Annual report collateral description; credit agreement collateral documents; New York law |
| TransDigm Inc. | Grants first-lien security shared under the intercreditor agreement | Security | Secured notes | 2033 indenture security and intercreditor definitions; New York law |
| Non-guarantor subsidiaries | Liabilities rank ahead on their own assets | Structural claim | Secured notes | Annual report: notes structurally subordinated to non-guarantor liabilities |
| Non-guarantor subsidiaries | Liabilities rank ahead on their own assets | Structural claim | Subordinated notes | Annual report: notes structurally subordinated to non-guarantor liabilities |
| Securitization entity | Holds receivables financing non-recourse to the group | Structural claim | Credit facilities | Credit agreement permitted securitization debt; New York law |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facilities | Equal right of payment | Payment rank | Secured notes | Annual report ranking statement; New York-law indentures and credit agreement |
| Secured notes | Senior in right of payment | Payment rank | Subordinated notes | Annual report ranking statement; subordinated indentures, New York law |
| Credit facilities | Share first-lien collateral under the 2019 intercreditor agreement | Security rank | Secured notes | 2033 indenture intercreditor definition; agreement itself not supplied |
| Required revolving lenders | Alone act on a financial-covenant default | Enforcement control | Term lenders | Credit agreement events of default; New York law |
| Each lender | Consent needed to release all or substantially all collateral | Release | Credit facilities | Credit agreement amendments clause; New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 12 |
| Calculated | 4 |
| Assumption-Based | 0 |
| Analyst Inference | 4 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 4 |
| Fields present | 30 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 3 |

### Overall legal credit view
Overall, TransDigm Group Incorporated presents an aggressive covenant package based on revolver-only springing maintenance, ratio-gated debt and payment permissions without a fixed cap, and a demonstrated debt-funded distribution in September and October 2024. The main creditor protections are all-lender consent for releasing all or substantially all collateral or any material guarantor, all-lender consent for changes to pro rata sharing and voting thresholds, the requirement that non-pro rata transactions be offered to every lender of a class, and the 5.00x secured net leverage ceiling on new pari debt under the loans. The main covenant weaknesses are the 6.75x open-ended payment test, the indenture's fixed-charge-based payment permission, uncapped investments in non-guarantor restricted subsidiaries, uncapped exclusions from covenant net income, and the exclusion of receivables financing from covenant debt. The primary default-risk path is releveraging through permitted debt-funded distributions followed by an operating downturn, with no maintenance tripwire for term lenders or noteholders. The primary recovery risk path is dilution of first-lien recovery by new pari secured debt and value sitting at, or moved to, non-guarantor subsidiaries. For security selection, the most important legal consideration is that first-lien claims can be diluted up to the secured ratio limit while subordinated notes sit behind USD 19,702 million of first-lien principal and any future pari debt. Further analysis would require the intercreditor agreement, the guarantee and collateral agreement, compliance certificates with covenant ratios, and the other note indentures. The covenant aggressiveness score is four out of five, provisional.

Legal & covenants completed with limitations. Covenant aggressiveness: four out of five, provisional. Key gaps: intercreditor agreement, guarantee and collateral agreement, compliance certificates and covenant ratios, remaining note indentures.
Basis: d887611dex101.htm.jsonl, pages 59–63; d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 70–76; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–62; calculation K12

### Overall structural view
The highest-severity open leakage route is a transfer of value from TransDigm Inc. or its domestic guarantors into foreign restricted subsidiaries that do not guarantee: investments in restricted subsidiaries are uncapped, and those subsidiaries can then incur their own debt within the foreign-subsidiary basket, which ranks ahead of every group creditor on their assets. The capacity exists in the documents, but no transfer of this kind is evidenced, so it is theoretical. The most material structural gap is the non-guarantor perimeter, which generated USD 1,646 million of sales, or 20.73%, in the year; group creditors reach that value only through equity and a net USD 1,881 million intercompany receivable. By class, the revolver, term loans and secured notes rank pari at the same obligors on shared collateral; subordinated notes are contractually subordinated and are also structurally subordinated to non-guarantor creditors; receivables financing and foreign-subsidiary debt are structurally senior on their own assets. These findings give the structural priority input for the recovery analysis and the main structural point for the committee debate. They also give a perimeter constraint for capacity work: covenant ratios exclude unrestricted subsidiaries and securitization debt. The structural map is completed with limitations because the guarantor exhibit, the collateral agreement and entity-level debt and earnings are not supplied.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 60–62; d887611dex101.htm.jsonl, page 173; calculation K05; calculation K06

### Intercreditor view
Enforcement control between first-lien lenders and secured noteholders is not established because the first-lien intercreditor agreement is not supplied; an unexamined agreement is not treated as benign. What the supplied documents do establish is narrower. Revolving lenders alone control remedies for the springing financial covenant, and term lenders gain default rights only once revolving lenders terminate or accelerate. Each lender must consent to release all or substantially all collateral. The agent may, at the borrower's request and without lender consent, enter pari or junior intercreditor arrangements for permitted secured debt. Subordinated notes are contractually subordinated, so any payment-blockage or turnover mechanics sit in their indentures, which were not read for those terms. No recovery value is attached to any control weakness.
Basis: d887611dex41.htm.jsonl, page 30; d833756dex101.htm.jsonl, page 194; d887611dex101.htm.jsonl, pages 204–205

### Covenant capacity view
Overall, TransDigm Group Incorporated has limited covenant-capacity visibility. The main capacity concern is the open-ended restricted-payment permission at 6.75x net leverage, because it allows debt raised under the 7.25x and 5.00x incurrence tests to be distributed, diluting first-lien recovery and weakening the creditor cushion, a Negative — Leverage Increase implication. Exact headroom is not supported for any ratio test; only the revolver exposure trigger is measurable, at 32.64 percentage points below its 40% threshold. Further analysis requires the covenant-defined net leverage, secured net leverage and fixed-charge ratios, basket-usage records and the covenant EBITDA bridge.

- The maintenance test is dormant: USD 67 million of letters of credit against a USD 364 million trigger.
- Pari secured capacity is ratio-based at 5.00x under the loans and 5.25x under the 2033 notes, with no fixed free-and-clear incremental amount found in the incremental conditions reviewed.
- The leakage route was used: a USD 4,348 million dividend was declared on 2024-09-19 and paid within the 60-day window.
- Covenant net income excludes uncapped unusual, non-recurring and integration charges and non-cash compensation, so every ratio permission and every EBITDA-linked basket expands with these exclusions.
- For the committee debate and position sizing, the binding legal risk is permitted releveraging rather than covenant default.

Covenant capacity completed with limitations. Key gaps: covenant ratios, compliance certificates, basket-usage records, covenant EBITDA bridge.
Basis: d887611dex101.htm.jsonl, pages 25–27; d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, page 43; Business & governance (CP-1A); calculation K01; calculation K04

### Nearest pressure point
The nearest pressure point is the credit agreement's open-ended restricted-payment permission at 6.75x net leverage. The provision allows any dividend if no default exists and pro forma net leverage, including the financing for the payment, does not exceed 6.75x; a dividend permitted at declaration may be paid within 60 days. When earnings rise or the company borrows under the 7.25x and 5.00x tests, the borrower can recycle new debt to shareholders, as it did in the September 2024 declaration funded by USD 3,000 million of first-lien debt. Default risk rises because leverage is reset upward without a maintenance tripwire, and recovery falls because new pari debt shares the same collateral. Watch for a new dividend declaration, an incremental joinder or a new secured-notes indenture, and the quarterly net leverage disclosed in filings. Tightening the view needs a compliance certificate with the covenant-defined net leverage after the October payment, and the unrestricted-cash definition.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, page 146; Business & governance (CP-1A)

### Standard-format findings

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Credit agreement Section 6.02, final paragraph; clause (1) | Amended credit agreement annexed to Amendment No. 17, 2024-09-19, Rank 1 | Any restricted payment allowed with no default and pro forma net leverage at or below 6.75x including its financing; payment within 60 days of a permitted declaration | Debt raised under incurrence tests can be distributed in one step | High: leverage reset without maintenance protection | High: cash leaves the collateral pool and pari debt is added | Dividend declarations, quarterly net leverage, incremental joinders | Negative — Leverage Increase | High | EV03 |
| Credit agreement Permitted Indebtedness clause (12) and Section 2.24(c) | Same, Rank 1 | Pari secured debt to 5.00x secured net leverage; incremental loans also at or below 7.25x net leverage; junior or unsecured debt to 7.25x | Grower-type ratio capacity rises with covenant EBITDA | Moderate | High: dilutes existing first-lien recovery | Secured debt issuance, intercreditor joinders | Negative — Leverage Increase | High | EV04; EV05 |
| Credit agreement Section 6.14 and Article VII(l) | Same and Amendment No. 16, Rank 1 | 7.50x net leverage, 8.00x after a material acquisition, only above 40% revolver exposure; revolver-only default | No maintenance protection for term lenders or noteholders | Low near-term: test dormant; default signals arrive late | Neutral | Revolver usage at quarter-end | Neutral — Stable | High | EV01; EV02 |
| 2033 indenture Section 4.07 | 2033 secured notes indenture, 2024-09-19, Rank 1 | Builder of USD 400 million plus 50% of cumulative net income since October 2010; unlimited payments above 2.0x fixed-charge cover | Notes add little restraint beyond the loans; loans' 6.75x test binds while the loans are outstanding | Moderate | Moderate: if the loans are repaid, the notes' looser test governs | Loan refinancing into notes; covenant fall-away | Negative — Covenant Erosion | Medium | EV11 |
| Permitted Investments clauses (1), (10), (20) | Credit agreement, Rank 1 | Uncapped investments in restricted subsidiaries; general basket greater of USD 500 million and 25% of total assets; unlimited at 5.75x | Value can move to non-guarantors or unrestricted subsidiaries | Low | High: strands value outside guarantee reach | Subsidiary designations, foreign-subsidiary debt | Negative — Covenant Erosion | Medium | EV07; EV08 |
| Section 9.02(b) | Credit agreement, Rank 1 | All-lender consent for pricing, maturity, pro rata sharing, voting thresholds, material guarantor and substantially-all collateral releases; majority may permit open-offer non-pro rata prepayments | Strong release protection; lien-subordination protection not established in reviewed text | Low | Moderate | Amendments filed as exhibits | Neutral — Stable | Medium | EV10 |

### Analytical appendix — complete canonical registers

### Evidence references

| Evidence ID | Provision or datapoint | Source |
|---|---|---|
| EV01 | Financial covenant: 7.50x net leverage, 8.00x after material acquisition, springing above 40% revolver exposure; amendable only by required revolving lenders | d887611dex101.htm.jsonl, page 188; d833756dex101.htm.jsonl, page 191 |
| EV02 | Financial covenant default is revolver-only until revolving lenders terminate or accelerate; change of control is an event of default | d833756dex101.htm.jsonl, page 194 |
| EV03 | Restricted payments covenant, baskets (1)–(10) and the 6.75x open-ended permission | d887611dex101.htm.jsonl, pages 177–181 |
| EV04 | Permitted Indebtedness clauses (12)–(18), classification flexibility, limited-condition acquisition timing | d887611dex101.htm.jsonl, pages 59–61 |
| EV05 | Incremental facility conditions: 7.25x net and 5.00x secured net leverage | d887611dex101.htm.jsonl, page 146 |
| EV06 | Consolidated Net Income exclusions, net leverage, secured net debt and total indebtedness definitions | d887611dex101.htm.jsonl, pages 25–28 |
| EV07 | Permitted Investments including unrestricted-subsidiary, general, joint-venture, acquisition and unlimited baskets | d887611dex101.htm.jsonl, pages 61–63 |
| EV08 | Unrestricted Subsidiary definition and designation conditions | d887611dex101.htm.jsonl, page 81 |
| EV09 | Joinder of domestic subsidiaries; excluded subsidiaries | d887611dex101.htm.jsonl, page 173 |
| EV10 | Waivers and amendments: required lenders, sacred rights, open-offer exceptions, agent intercreditor authority | d887611dex101.htm.jsonl, pages 204–205 |
| EV11 | 2033 indenture restricted payments: builder and 2.0x fixed-charge permission | d887611dex41.htm.jsonl, pages 70, 75–76 |
| EV12 | 2033 indenture ratio debt above 2.0x, USD 400 million non-guarantor cap, secured ratio liens to 5.25x | d887611dex41.htm.jsonl, pages 43, 79 |
| EV13 | First Lien Intercreditor Agreement dated 2019-02-13 and joinders | d887611dex41.htm.jsonl, page 30 |
| EV14 | Annual report covenant summary, revolver trigger USD 364 million, compliance statement, collateral includes available cash | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| EV15 | Guarantees, ranking, structural subordination, obligor-group summary, tranche table | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59 |
| EV16 | 2027 subordinated indenture restricted payments | d826058dex41.htm.jsonl, pages 59, 62–63 |
| EV17 | Governing law New York for credit agreement and 2033 indenture | d887611dex101.htm.jsonl, page 222; d887611dex41.htm.jsonl, page 126 |
| EV18 | Tranche L USD 1,500 million incremental term loans | d887611dex101.htm.jsonl, pages 1–2 |
| EV19 | Debt, cash, EBITDA and pro forma figures | Financial foundation (CP-1) |
| EV20 | Dividend declaration, funding and payment dates | Business & governance (CP-1A) |

### T4.1 Source gate

| Source | Document status | Authority rank | Governing law | Limitation | Source |
|---|---|---|---|---|---|
| Credit agreement as annexed to Amendment No. 17 | Executed amendment, conformed annexed agreement | 1 | New York | Schedules, exhibits and collateral documents not supplied | d887611dex101.htm.jsonl, pages 1, 222 |
| Amendment No. 16 | Executed | 1 | New York | Superseded text used only for cross-check | d833756dex101.htm.jsonl, page 191 |
| 2033 secured notes indenture | Executed | 1 | New York | Security documents and intercreditor agreement not supplied | d887611dex41.htm.jsonl, page 126 |
| 2027 subordinated notes indenture | Executed | 1 | Not read: governing-law clause not reviewed | Fixed-charge threshold of open-ended permission not read | d826058dex41.htm.jsonl, page 63 |
| Annual report | Filed | 4 for covenant summaries; primary for financial inputs | Not applicable | Published after the cutoff; summary only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–62 |
| First lien intercreditor agreement | Referenced only, not in source set | 2 | Not supplied: document absent | Enforcement, standstill and turnover not established | d887611dex41.htm.jsonl, page 30 |
| Compliance certificates | Not in source set | 3 | Not applicable | Headroom not calculable | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

The gate is passed: executed governing documents exist, but missing supplements make the status Completed with Limitations. Financial foundation is available, so the financial restriction does not apply; the refinancing and liability-management overlay is not available, so the LME capacity overlay is incomplete; no market comparator exists, so market-norm commentary is restricted to an intra-capital-structure comparison.

### T4.2 Controlling Document Register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as amended through Amendment No. 17 | Credit agreement | Annexed to Amendment No. 17, 2024-09-19 | Executed amendment; conformed annex | Controls loan covenants, incurrence, payments, investments, financial covenant, amendments | Primary for leverage, leakage and lender-control analysis | EV01; EV03–EV10; EV17; EV18 |
| 1 | Amendment No. 16 and annexed agreement | Credit agreement amendment | 2024-06-04 | Executed | Cross-check only; superseded by Amendment No. 17 annex | Confirms financial covenant and default text | EV01; EV02 |
| 1 | Indenture for the 2033 secured notes | Indenture | 2024-09-19 | Executed | Controls 2033 notes covenants; proxy for the other secured indentures only to the extent stated by the annual report | Looser payment and lien tests than loans | EV11–EV13; EV17 |
| 1 | Indenture for the 2027 senior subordinated notes | Indenture | 2019-11-13 | Executed | Controls 2027 notes covenants | Builder and open-ended payment architecture | EV16 |
| 2 | First Lien Intercreditor Agreement and Joinders No. 1–6 | Intercreditor agreement | 2019-02-13; joinders to 2024-09-19 | Not in source set | Would control enforcement and collateral-sharing mechanics | Gap: enforcement control not established | EV13 |
| 3 | Compliance certificates | Covenant certificate | Not supplied: none in source set | Not in source set | Would control tested ratios and basket usage | Gap: headroom not calculable | EV14 |
| 4 | Annual report on Form 10-K, debt and covenant sections | Filed summary | 2024-11-07 | Filed | Summary of covenants; verify against executed documents | Supplies revolver usage, compliance statement and guarantor summary | EV14; EV15 |

The executed credit agreement controls loan provisions and the executed indentures control note provisions. Where the annual report describes the covenant test as net debt to EBITDA As Defined, the credit agreement's own definitions govern, and the divergence is logged below.

### T4.3 Covenant Feature Register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | 7.50x net leverage (8.00x for four quarters after a material acquisition) only when revolver exposure exceeds 40% of commitments | Credit agreement Section 6.14 | No tripwire for term lenders or noteholders | Neutral — Stable | Not assessed: no market comparator supplied | EV01 |
| Financial covenant default | Revolver-only until revolving lenders terminate or accelerate | Credit agreement Article VII(l) | Delays term-lender remedies | Neutral — Stable | Not assessed: no market comparator supplied | EV02 |
| Debt incurrence | Ratio debt: pari secured to 5.00x secured net leverage; junior lien or unsecured to 7.25x net leverage; general basket greater of USD 250 million and 10% of covenant EBITDA; foreign subsidiaries greater of USD 450 million and 18%; securitization greater of USD 725 million and 20% | Credit agreement Permitted Indebtedness (12)–(18) | Capacity scales with covenant EBITDA; borrower may classify and divide debt | Negative — Leverage Increase | Not assessed: no market comparator supplied | EV04 |
| Incremental facilities | Conditional on 7.25x net and 5.00x secured net leverage, pro forma; limited-condition acquisition testing at signing | Credit agreement Section 2.24(c) | Pari first-lien dilution sized off earnings | Negative — Leverage Increase | Not assessed: no market comparator supplied | EV05 |
| MFN | No most-favoured-nation pricing protection found in the incremental conditions reviewed | Credit agreement Section 2.24(c) | Incremental pricing protection for existing lenders not established | Insufficient Information | Not assessed: no market comparator supplied | EV05 |
| Restricted payments | Open-ended at 6.75x net leverage with no default; USD 75 million or 3% general basket; management and tax payments | Credit agreement Section 6.02 | Debt-funded distributions permitted | Negative — Leverage Increase | Not assessed: no market comparator supplied | EV03 |
| Notes restricted payments | Builder USD 400 million plus 50% of cumulative net income since October 2010; unlimited above 2.0x fixed-charge cover | 2033 indenture Section 4.07 | Notes add little restraint beyond the loans | Negative — Covenant Erosion | Not assessed: no market comparator supplied | EV11 |
| Investments | Uncapped in restricted subsidiaries; unrestricted subsidiaries greater of USD 250 million and 10%; general greater of USD 500 million and 25% of total assets; joint ventures greater of USD 1,000 million and 40% at or below 7.00x; unlimited at or below 5.75x with conditions | Credit agreement Permitted Investments | Value transfer to non-guarantors | Negative — Covenant Erosion | Not assessed: no market comparator supplied | EV07 |
| Unrestricted subsidiaries | Board may designate new or existing subsidiaries subject to certification and investment treatment; equity of unrestricted subsidiaries excluded from collateral | Credit agreement Unrestricted Subsidiary definition; Section 5.11 | Drop-down route outside guarantee and collateral | Negative — Covenant Erosion | Not assessed: no market comparator supplied | EV08; EV09 |
| EBITDA definition | Net income excludes uncapped extraordinary, unusual or non-recurring charges, integration costs, non-cash compensation and purchase-accounting charges | Credit agreement Consolidated Net Income (3), (11), (12) | Inflates covenant EBITDA and every grower basket | Negative — Covenant Erosion | Not assessed: no market comparator supplied | EV06 |
| Guarantor coverage | Domestic subsidiaries must join within 20 business days unless immaterial, unrestricted or securitization entities | Credit agreement Section 5.11(a) | Foreign subsidiaries remain outside the guarantee net | Insufficient Information | Not assessed: no market comparator supplied | EV09; EV15 |
| Amendments | Required lenders generally; each lender for economics, sharing, voting, material guarantor and substantially-all collateral release; open-offer non-pro rata prepayments by required lenders | Credit agreement Section 9.02(b) | Release-based strip blocked; lien subordination not shown as an all-lender right | Neutral — Stable | Not assessed: no market comparator supplied | EV10 |
| Events of default | Payment default; interest default after five business days; subordination failure; change of control | Credit agreement Article VII | Standard triggers; change of control is a default | Neutral — Stable | Not assessed: no market comparator supplied | EV02 |

### T4.9 PD vs LGD Translation Table

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Open-ended restricted payments | 6.75x net leverage test with financing included; used for USD 4,348 million declaration | Releveraging to fund distributions | High: leverage reset without maintenance test | High: cash leaves creditors' reach | Dividend declarations; quarterly leverage | EV03; EV20 |
| Pari secured ratio debt | 5.00x secured net leverage under loans; 5.25x under 2033 notes | New first-lien debt shares collateral | Moderate | High for existing first lien | Secured issuance and intercreditor joinders | EV04; EV12 |
| Springing maintenance covenant | Revolver-only, dormant at year-end | Late default signal | Moderate: no early warning | Neutral | Revolver usage at quarter-ends | EV01; EV14 |
| Non-guarantor investments and debt | Uncapped investments in restricted subsidiaries; foreign subsidiary debt basket | Structural priming of group creditors | Low | High | Foreign subsidiary debt and asset transfers | EV04; EV07 |
| Add-back exclusions | Uncapped non-recurring and non-cash compensation exclusions | Inflates covenant EBITDA | Moderate: overstates headroom | Moderate: larger baskets | Gap between EBITDA As Defined and reported EBITDA | EV06 |
| Amendment control | All-lender rights for releases and sharing | Limits non-consensual strip | Low | Positive for recovery | Amendment filings | EV10 |
| Subordination | Subordinated notes junior to senior debt and structurally junior to non-guarantors | Double subordination | Low | High for subordinated notes | Senior debt growth | EV15 |

### T4.10 Market Norm Comparison Table

Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided. The table instead compares the loans with the supplied indentures, which is an intra-capital-structure comparison, not a market norm.

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Open-ended restricted payments | Loans: 6.75x net leverage | 2033 notes: fixed-charge cover above 2.0x (intra-structure reference, not market norm) | Notes looser than loans | Discrepancy: loans bind while outstanding | Negative — Covenant Erosion | EV03; EV11 |
| Secured ratio debt | Loans: 5.00x secured net leverage | 2033 notes: 5.25x secured net leverage for ratio-debt liens (intra-structure reference) | Notes looser than loans | Discrepancy | Negative — Leverage Increase | EV04; EV12 |
| General restricted-payment basket | Loans: greater of USD 75 million and 3% of covenant EBITDA | 2027 subordinated notes: USD 75.0 million fixed (intra-structure reference) | Loans grow with EBITDA; 2027 notes fixed | Discrepancy | Neutral — Stable | EV03; EV16 |
| Third-party review | No covenant-review report supplied | Not supplied: no third-party covenant review in source set | Not assessed: comparator absent | Not assessed: comparator absent | Insufficient Information | EV14 |

### T4.11 Aggressiveness Score Table

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x test above 40% usage; dormant at year-end | No tripwire for term lenders and noteholders | Neutral — Stable | High | EV01; EV02; EV14 |
| Debt / lien incurrence capacity | 4 | Ratio pari secured to 5.00x (5.25x notes); 7.25x for incremental and junior debt; EBITDA-linked fixed baskets; classification flexibility; MFN not found | Large ratio-based capacity, pari dilution | Negative — Leverage Increase | Medium | EV04; EV05; EV12 |
| RP / investment / leakage capacity | 4 | Open-ended 6.75x payment test used for USD 4,348 million; uncapped restricted-subsidiary investments; total-assets general basket | Demonstrated extraction; non-guarantor transfer route | Negative — Leverage Increase | High | EV03; EV07; EV20 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped non-recurring, integration, non-cash compensation and purchase-accounting exclusions; cost-savings language not read | Inflated denominator expands all ratio capacity | Negative — Covenant Erosion | Provisional | EV06 |
| Collateral / guarantor protection | 3 | Domestic joinder; foreign subsidiaries excluded; all-lender release protections; collateral agreement not supplied | Non-guarantor value outside reach; release strip blocked | Insufficient Information | Provisional | EV09; EV10; EV15 |
| Amendment / control mechanics | 3 | Required lenders generally; sacred rights for sharing, releases, voting; open-offer exceptions; lien subordination not shown as sacred | Uptier risk not excluded; open-offer requirement limits coercion | Neutral — Stable | Medium | EV10 |
| Overall | 4 | Weighted to demonstrated debt-funded distribution and ratio-based pari capacity | Releveraging and first-lien dilution | Negative — Leverage Increase | Provisional | EV03; EV04; EV05 |

Covenant Aggressiveness Score: four out of five, provisional. The overall score is weighted to the restricted-payment and incurrence areas, where capacity is both provision-supported and demonstrated, not averaged. Six areas are scorable, but missing collateral documents, the intercreditor agreement and compliance certificates keep the score provisional.

### T4.12 Red Flags Table

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Debt-funded distribution capacity | 6.75x open-ended payment test with financing included | Repeats the September 2024 recapitalisation | PD up; LGD up; first-lien and subordinated spreads should price recurrence | Track declarations and quarterly net leverage | EV03; EV20 |
| Pari secured dilution | 5.00x and 5.25x secured ratio tests | Existing first lien shares collateral with new debt | LGD up for first lien | Track new secured notes, incremental joinders, intercreditor joinders | EV04; EV12; EV13 |
| Non-guarantor transfer | Uncapped investments in restricted subsidiaries; foreign subsidiary debt basket greater of USD 450 million and 18% | Value can move beyond guarantees and be primed locally | LGD up | Track foreign-subsidiary debt and intercompany balances in the obligor summary | EV04; EV07; EV15 |
| Unrestricted subsidiary designation | Designation permitted with investment treatment | Drop-down route outside collateral | LGD up | Track designations in filings | EV08 |
| Lien subordination not shown as all-lender | Amendment clause lists no lien-subordination sacred right in reviewed text | Uptier by required lenders not excluded | LGD up for non-participating lenders | Track amendments and lender-group activity | EV10 |
| Securitization outside covenant debt | Basket greater of USD 725 million and 20%; excluded from total indebtedness | Receivables funding not tested and sits ahead on receivables | LGD up modestly | Track facility size and renewal by 2025-07-11 | EV04; EV06; EV14 |

### T4.13 Gaps Ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement dated 2019-02-13 and Joinders No. 1–6 | Controls enforcement, standstill, turnover and release between first-lien classes | Intercreditor registers carry insufficient-information cells; recovery-control severity not scored | Obtain the executed agreement and joinders |
| Collateral and guarantee documents | Guarantee and collateral agreement; guarantor list exhibit | Excluded assets, pledge limits and release triggers | Collateral score provisional; collateral matrix partly blank | Obtain collateral documents and the guarantor exhibit |
| Compliance certificates | Quarterly certificates with covenant ratios | Tested ratios and basket usage | No headroom for any ratio test | Obtain certificates or lender reporting |
| Covenant EBITDA definition body and pro forma rules | Opening of Consolidated EBITDA definition and Section 1.07 | Cost-savings and synergy add-back caps | Add-back score provisional | Read the full definitions |
| Other indentures | 2028–2032 secured notes and January and May 2029 subordinated notes indentures | Note-specific tests may differ | Note leakage conclusions rely on the 2033 and 2027 indentures | Obtain the indentures |
| 2027 subordinated indenture ratio threshold | Continuation of the open-ended payment permission | Subordinated-notes leakage gate | Not stated for 2027 notes | Read the continuation page |
| Refinancing and liability-management overlay | Refinancing and LME assessment not supplied | LME legal-capacity overlay | Uptier and exchange analysis is provision-only | Combine with refinancing analysis when available |

### T4D.1 Source Gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement as annexed to Amendment No. 17 | Executed | 1 | Defines restricted and unrestricted subsidiaries and joinder; no guarantor schedule supplied | Completed with Limitations |
| 2033 secured notes indenture | Executed | 1 | Guarantee and collateral articles not read in full | Completed with Limitations |
| Annual report guarantee note and obligor summary | Filed | Org-chart equivalent from a filing | Guarantor list exhibit referenced but not supplied; entity-level debt and EBITDA not disclosed | Completed with Limitations |
| Guarantee and collateral agreement | Not in source set | Not ranked: absent | Collateral by entity not established | Completed with Limitations |
| Subsequent events scan | Annual report and supplied agreements | Not applicable | No guarantor release, collateral release or unrestricted designation identified after 2024-09-30; October 2024 dividend and securitization draw do not change the perimeter | Completed with Limitations |

### T4D.2 Restricted / Unrestricted Entity Register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; parent guarantor; listed issuer | Delaware, United States | None: listed parent | Holdings loan party; not a restricted subsidiary; designation not applicable | No significant operations or assets apart from its investment in TransDigm Inc. | Yes | EV15; EV20 |
| TransDigm Inc. | Borrower and notes issuer | Delaware, United States | TransDigm Group Incorporated, 100% | Borrower; cannot be designated | Part of obligor group with USD 6,294 million sales; entity-only figures — | Yes | EV15; EV18 |
| TransDigm UK | Guarantor of 2028 secured notes and subordinated notes | — | — | Restricted; can-be-designated status not established | — | Yes for named notes; credit-facility status not established | EV15 |
| Domestic restricted subsidiaries, including signatories Bruce Aerospace Inc., Calspan, LLC, King Nutronics, LLC, Kirkhill Inc. and Korry Electronics | Subsidiary guarantors and loan parties | United States | TransDigm Inc., direct or indirect | Restricted; may be designated unrestricted only within the definition's conditions | Within obligor group; entity figures — | Yes | EV09; EV15 |
| Foreign restricted subsidiaries other than TransDigm UK | Non-guarantors | Outside the United States | TransDigm Inc. group | Restricted; not required to join | Non-guarantor sales USD 1,646 million in aggregate, including any excluded domestic subsidiaries | No: restricted group yes, guarantee group no | EV09; EV15 |
| Immaterial domestic subsidiaries | Excluded subsidiaries | United States | TransDigm Inc. group | Restricted; excluded from joinder until they cease to be immaterial | — | No | EV09 |
| Securitization entity | Receivables financing vehicle | — | TransDigm Inc. group | Excluded subsidiary; non-recourse | USD 487.5 million drawn at year-end | No | EV04; EV14 |
| Unrestricted subsidiaries | None identified | — | — | Designation permitted within conditions | — | No | EV08 |

### T4D.3 Guarantor Coverage Matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities | Senior secured, joint and several as loan party | Upstream | Not established: collateral agreement not supplied | EV09; EV15 |
| TransDigm Group Incorporated × secured notes | Senior secured | Upstream | Not established: indenture release article not read | EV15 |
| TransDigm Group Incorporated × subordinated notes | Senior subordinated unsecured | Upstream | Not established: indenture release article not read | EV15 |
| Domestic restricted subsidiaries × credit facilities | Senior secured, joint and several | Upstream and cross-stream | Material guarantor release needs each lender except as otherwise permitted, for example permitted disposals | EV09; EV10 |
| Domestic restricted subsidiaries × 2029–2033 secured notes | Senior secured; required for credit-facility obligors and for issuers or guarantors of capital-markets debt of at least USD 200 million | Upstream and cross-stream | Not established beyond the scope test: indenture release article not read | EV15 |
| Domestic restricted subsidiaries × 2028 secured notes | Senior secured | Upstream and cross-stream | Not established: 2028 indenture not supplied | EV15 |
| Domestic restricted subsidiaries × subordinated notes | Senior subordinated unsecured | Upstream and cross-stream | Not established: indenture release article not read | EV15 |
| TransDigm UK × 2028 secured notes and subordinated notes | Senior secured; senior subordinated | Cross-stream | Not established: indentures not supplied or not read | EV15 |
| Foreign restricted subsidiaries × all tranches | No guarantee | Not applicable: no guarantee | Not applicable: no guarantee given | EV09; EV15 |

### T4D.4 Collateral-by-Entity Matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × first lien | — not established: collateral agreement not supplied | All or substantially all collateral needs each lender; other releases per collateral documents not reviewed | — not established | EV10; EV13 |
| TransDigm Inc. × first lien | Collateral includes available cash; other exclusions — | Same | — not established | EV10; EV14 |
| Domestic restricted subsidiaries × first lien | Equity of unrestricted subsidiaries excluded; equity-pledge limits in the joinder clause not fully read | Same | — not established | EV09; EV10 |
| TransDigm UK × first lien | — not established | — | UK perfection terms not supplied | EV15 |
| Foreign restricted subsidiaries × first lien | Not loan parties: no collateral | Not applicable: no collateral granted | Not applicable: no collateral granted | EV09 |
| Securitization entity × first lien | Securitized receivables and related assets subject to securitization liens | Not applicable: outside collateral pool | Not applicable: outside collateral pool | EV04 |
| All obligors × second lien | No second-lien debt identified; junior-lien capacity at 7.25x net leverage | — | — | EV04 |
| All obligors × unsecured subordinated | Not applicable: unsecured | Not applicable: unsecured | Not applicable: unsecured | EV15 |

### T4D.5 Structural Priority Table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc.; Holdings; domestic guarantors | First-lien collateral of obligors; equity and intercompany claims on non-guarantors | Pari (same entity, same lien) | Non-guarantor value behind USD 1,646 million of sales reachable only via equity and USD 1,881 million net intercompany claim | Strongest access, diluted by any new pari debt | Medium | EV15; K06 |
| Secured notes 2028–2033 | TransDigm Inc.; Holdings; domestic guarantors; TransDigm UK for 2028 | Same shared collateral | Pari (same entity, same lien) | Same non-guarantor value | Same as loans; enforcement control not established | Medium | EV13; EV15 |
| Subordinated notes | TransDigm Inc.; Holdings; TransDigm UK; domestic guarantors | Residual obligor value after senior debt | Contractually Subordinated | Same non-guarantor value plus all collateral value consumed by USD 19,702 million first-lien principal and any new pari debt | Weakest access | Medium | EV15; K12 |
| Foreign-subsidiary and securitization creditors | Non-guarantors; securitization entity | Their own assets and receivables | Structurally Senior | Not applicable: these claims are senior on stranded value | Ahead of all group creditors on those assets | Medium | EV04; EV15 |
| All obligor-level classes | Obligor group | Assets that can be invested out | Leakage-Exposed (drop-down capable) | Assets transferable under uncapped restricted-subsidiary investments and capped unrestricted-subsidiary baskets | Access can fall without lender consent | Medium | EV07; EV08 |

### T4D.6 Drop-down / Transfer Capacity Register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| (a) Investment into unrestricted subsidiary | Obligors to a newly designated unrestricted subsidiary | Permitted Investments (1)(c), (10), (20); T4.3 investments row | Greater of USD 250 million and 10% of covenant EBITDA, plus general and unlimited baskets; amount not established | 4 | Assets leave guarantee and collateral | Theoretical | EV07; EV08 |
| (b) Asset sale out of group | Obligors to third parties | Section 6.03 fair-value requirement; reinvestment terms not read | Not established: asset-sale terms not fully read | Not Scorable | Proceeds may be reinvested or distributed under payment tests | Theoretical | EV03 |
| (c) Designation as unrestricted | Restricted subsidiary to unrestricted status | Unrestricted Subsidiary definition | Value of designated subsidiary; not established | 3 | Removes guarantor and collateral | Theoretical | EV08 |
| (d) Transfer to non-guarantor | Obligors to foreign restricted subsidiaries | Permitted Investments (1)(a); foreign-subsidiary debt basket | Uncapped by the investment covenant | 4 | Non-guarantor creditors gain priority on transferred value | Theoretical | EV04; EV07 |
| (e) Restricted payment to shareholders | TransDigm Inc. to Holdings to shareholders | Section 6.02 open-ended 6.75x permission | USD 4,348 million declared 2024-09-19 | 4 | Cash leaves all creditor classes | Demonstrated | EV03; EV20 |

### T4D.7 Priming-Exposure Findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier | Section 9.02(b): no lien-subordination all-lender right in reviewed text; open-offer non-pro rata prepayments by required lenders | Non-participating first-lien lenders | Theoretical and contested: sharing changes need each lender | Majority-led priority change not excluded | Low | EV10 |
| Trapdoor | Uncapped investments in restricted subsidiaries plus foreign-subsidiary debt basket and USD 400 million non-guarantor ratio debt under notes | All group creditors | Theoretical | Value could be moved and primed at non-guarantors | Medium | EV04; EV07; EV12 |

### T4D.8 Gaps Ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit 22.1 guarantor table | Names every guarantor | Entity register uses class rows | Obtain the exhibit |
| Collateral documents | Guarantee and collateral agreement | Excluded assets and releases | Collateral matrix cells shown as — | Obtain the agreement |
| Entity-level value | Entity debt, assets and EBITDA | Ranks claims by reachable value | Only aggregate non-guarantor sales quantified | Obtain consolidating schedules |
| TransDigm UK | Jurisdiction and parent | Perfection and guarantee limits | Row partly — | Obtain entity details |
| Release terms in indentures | Guarantee and collateral release articles | Release without holder consent | Note release triggers not established | Read release articles |

### T4F.1 Controlling Documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders No. 1–6 | TransDigm Inc., Holdings, subsidiary guarantors, credit-agreement collateral agent, secured-notes trustees and collateral agents | 2019-02-13; joinders 2020-04-08 to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced; not in source set | d887611dex41.htm.jsonl, page 30 | EV13 |
| Credit agreement as annexed to Amendment No. 17 | TransDigm Inc. as borrower, Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2024-09-19 | New York | Executed | d887611dex101.htm.jsonl, pages 1, 222 | EV17 |
| 2033 secured notes indenture | TransDigm Inc., guarantors, trustee and notes collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 30, 126 | EV17 |

### T4F.2 Creditor Class Map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | Senior, equal payment rank | First lien shared | Sole remedies on the financial covenant; other rights [Insufficient Information] — ICA not in the source set | Required revolving lenders for the financial covenant; required lenders otherwise | EV01; EV02 |
| Term lenders | Senior, equal payment rank | First lien shared | Act on financial covenant only after revolver acceleration; collateral enforcement [Insufficient Information] — ICA not in the source set | Required lenders; each lender for sacred rights | EV02; EV10 |
| Secured noteholders | Senior, equal payment rank | First lien shared under the intercreditor agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | EV13; EV15 |
| Subordinated noteholders | Senior subordinated | Unsecured | Subject to subordination provisions of their indentures; terms not read | Indenture majority; not reviewed | EV15 |

### T4F.3 Enforcement Control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Credit agreement financial-covenant default | No standstill: term-lender rights arise only on revolver termination or acceleration | Breach of the springing 7.50x test | Required revolving lenders | Term lenders | Term lenders cannot accelerate on the covenant alone | Neutral — Stable | EV02 |
| First-lien collateral enforcement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Revolving lenders, term lenders, secured noteholders | [Insufficient Information] — ICA not in the source set | Insufficient Information | EV13 |

### T4F.4 Turnover and Release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement amendments clause | Not applicable: not a turnover provision | Each lender for all or substantially all collateral and any material guarantor | Not applicable: no purchase option in clause | Except as permitted by the agreement or collateral documents | Agent may add pari or junior intercreditor arrangements without lender consent | EV10 |
| First-lien intercreditor agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | EV13 |

### T4F.5 Recovery Control Assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Share collateral pari with secured notes; control vs notes not established | Cannot act on financial covenant independently | Moderate | Late remedies | Neutral — Stable | EV02 |
| Secured noteholders | Share collateral pari with loans | [Insufficient Information] — ICA not in the source set | Insufficient Information | [Insufficient Information] — ICA not in the source set | Insufficient Information | EV13 |
| Subordinated noteholders | Recover after senior debt | Payment blockage and turnover terms not read | High | Contractual and structural subordination | Negative — Refinancing Risk | EV15 |

### T4F.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Agreement dated 2019-02-13 and six joinders | Controls enforcement, standstill, turnover and release | Most intercreditor cells not established | Obtain executed agreement |
| Subordination terms | Payment blockage and turnover clauses of subordinated indentures | Subordinated recovery control | Subordinated control weakness not quantified in time | Read subordination articles |

### T4C.1 Source gate

| Input | Availability | Quality | Limitation | Source |
|---|---|---|---|---|
| Legal formulas | Available | Executed credit agreement and indentures | Some definitions not read in full | d887611dex101.htm.jsonl, pages 25–28; d887611dex41.htm.jsonl, pages 70–79 |
| Financial inputs | Available | Financial foundation figures, not covenant-defined | No covenant EBITDA bridge | Financial foundation (CP-1) |
| Usage data | Partial | Revolver letters of credit and securitization drawn amounts only | No basket tracker or certificate | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 62 |
| Post-balance-sheet capacity events | Identified | October 2024 dividend payment and securitization draw | Payment tested at declaration on 2024-09-19; draw uses securitization basket outside covenant debt | Business & governance (CP-1A); Financial foundation (CP-1) |

Status: Completed with Limitations. Restricted for usage, definitions and pressure-point precision.

### T4C.2 Source Map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as annexed to Amendment No. 17 | Credit agreement | 2024-09-19 | Executed | Legal Formula | Loan tests and baskets | EV01; EV03–EV10 |
| 1 | 2033 secured notes indenture | Indenture | 2024-09-19 | Executed | Legal Formula | Notes tests and baskets | EV11; EV12 |
| 1 | 2027 subordinated notes indenture | Indenture | 2019-11-13 | Executed | Legal Formula | Subordinated payment tests | EV16 |
| 2 | Compliance certificates | Certificate | Not supplied: absent from source set | Not in source set | Usage | Would set tested ratios | EV14 |
| 3 | Financial foundation | Financial analysis | As of 2024-09-30 | Supplied | Financial Input | Debt, cash, EBITDA references | EV19 |
| 4 | Annual report | Filed summary | 2024-11-07 | Filed | Usage | Revolver letters of credit, securitization draw, compliance statement | EV14 |

The executed documents control formulas; Financial foundation supplies non-covenant reference inputs; the annual report supplies the only usage facts. Where the annual report summarises the covenant test on EBITDA As Defined, the credit agreement's Financial Covenant Consolidated EBITDA governs.

### T4C.3 Definition Register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | (Consolidated Total Indebtedness less Unrestricted Cash) ÷ last four quarters Consolidated EBITDA, or Financial Covenant Consolidated EBITDA for the maintenance test; pro forma for acquisitions and sales | Covenant debt, unrestricted cash, covenant EBITDA | Governs payments (6.75x), debt (7.25x), investments (5.75x, 7.00x), maintenance (7.50x) | Cash netting and add-backs lower the ratio | Negative — Covenant Erosion | EV06 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | (Secured covenant debt less Unrestricted Cash) ÷ covenant EBITDA | Secured debt, unrestricted cash, covenant EBITDA | Governs pari secured debt at 5.00x | Cash netting expands secured capacity | Negative — Leverage Increase | EV06 |
| Consolidated Total Indebtedness | Credit agreement definitions | Principal of borrowed money, capital leases, sale-leaseback debt, notes, drawn letters of credit, disqualified stock and guarantees; excludes securitization debt | Principal by instrument | Principal basis differs from carrying value; securitization excluded | Receivables funding sits outside all ratio tests | Negative — Covenant Erosion | EV06 |
| Consolidated Net Income exclusions | Credit agreement definitions (1)–(12) | Excludes asset-sale and FX gains and losses, uncapped extraordinary, unusual or non-recurring charges including integration costs, impairments, non-cash and deferred compensation, purchase-accounting adjustments | Charge detail by category | Every EBITDA-linked basket expands | Recurring costs treated as add-backs | Negative — Covenant Erosion | EV06 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Separate maintenance EBITDA; body not read | Full definition | Maintenance headroom basis | Not established | Insufficient Information | EV06 |
| Unrestricted Cash | Credit agreement definitions | Not read | Definition | Net cash deduction | Not established | Insufficient Information | EV06 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | Not read in full; above 2.0x unlocks unlimited payments and ratio debt | EBITDA and fixed charges as defined | Notes payment and debt capacity | Coverage tests are looser than leverage tests in a high-margin business | Negative — Covenant Erosion | EV11; EV12 |
| Non-debt funding float | Credit agreement total-indebtedness definition | Customer advances and declared dividends payable are not listed debt categories | Contract liabilities; dividends payable | Outside every debt test | Float and payables do not consume debt capacity | Neutral — Stable | EV06; EV19 |

### Definition conflict register

| Item | Covenant definition | Financial foundation basis | Figures and roles | Treatment | Source |
|---|---|---|---|---|---|
| Debt basis | Principal amount; securitization excluded | Carrying value including securitization | Carrying debt USD 24,880 million; contractual gross excluding securitization USD 24,581 million; full gross USD 25,068 million; securitization gross USD 487 million | Covenant analysis uses the principal definition; no covenant total computed because guarantees, disqualified stock and drawn letters of credit are not established | d887611dex101.htm.jsonl, page 28; Financial foundation (CP-1) |
| EBITDA basis | Consolidated EBITDA built from adjusted net income; separate maintenance EBITDA | Reported EBITDA USD 3,813 million; EBITDA As Defined USD 4,173 million | Annual report describes the maintenance test on EBITDA As Defined | Credit agreement governs; neither reported measure substituted for covenant EBITDA | d887611dex101.htm.jsonl, pages 25–27; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Financial foundation (CP-1) |
| Cash netting | Unrestricted Cash | Reported cash USD 6,261 million at year-end; USD 1,913 million pro forma after October dividend | Unrestricted Cash definition not read | No netting assumed beyond the definition | Financial foundation (CP-1) |
| Funding float | Not within listed indebtedness categories | Contract liabilities USD 177 million; dividends payable USD 4,216 million | Earnings quality adds the payable to a broad analytical debt | Outside covenant debt; capacity unaffected | Financial foundation (CP-1); Earnings quality (CP-1D) |

### T4C.4 Headroom Table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver exposure trigger | max-ratio | 40.00% | 7.36% | Aggregate revolving exposure ÷ commitments: 67 ÷ 910 | 32.64% | Compliant | Trigger, not a ratio covenant; assumes letters of credit not cash-collateralised at 103%; year-end, not a certified test | Maintenance test springs only above the trigger | Neutral — Stable | EV01; EV14; K02; K04 |
| Revolver maintenance net leverage | max-ratio | 7.50x | Not supplied: covenant-defined ratio not disclosed | (Total indebtedness − Unrestricted Cash) ÷ Financial Covenant Consolidated EBITDA | [Insufficient Information] — missing: current tested ratio | Not Calculable | Not tested at year-end because the trigger was not met; 8.00x for four quarters after a material acquisition | Late tripwire, revolver only | Neutral — Stable | EV01 |
| Open-ended restricted payments | max-ratio | 6.75x | Not supplied: covenant-defined ratio not disclosed | Pro forma net leverage including payment financing | [Insufficient Information] — missing: current tested ratio | Not Calculable | Declaration on 2024-09-19 implies compliance at that date | Debt-funded distributions | Negative — Leverage Increase | EV03 |
| Incremental, junior-lien and unsecured ratio debt | max-ratio | 7.25x | Not supplied: covenant-defined ratio not disclosed | Pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Used for Tranche L on 2024-09-19 | Releveraging | Negative — Leverage Increase | EV04; EV05 |
| Pari secured incremental and ratio debt | max-ratio | 5.00x | Not supplied: covenant-defined ratio not disclosed | Pro forma secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Refinancing debt exempt | First-lien dilution | Negative — Leverage Increase | EV04; EV05 |
| Unlimited investments | max-ratio | 5.75x | Not supplied: covenant-defined ratio not disclosed | Pro forma net leverage plus no revolver loans and USD 200 million unrestricted cash | [Insufficient Information] — missing: current tested ratio | Not Calculable | Unrestricted cash test also unmeasured | Value transfer | Negative — Covenant Erosion | EV07 |
| Joint-venture investments | max-ratio | 7.00x | Not supplied: covenant-defined ratio not disclosed | Pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Capped at greater of USD 1,000 million and 40% of covenant EBITDA | Value transfer | Negative — Covenant Erosion | EV07 |
| 2033 notes open-ended restricted payments | min-ratio | 2.00x | Not supplied: fixed-charge cover not disclosed | Pro forma Consolidated Fixed Charge Coverage Ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Definition not read in full | Notes add little restraint | Negative — Covenant Erosion | EV11 |
| 2033 notes ratio debt | min-ratio | 2.00x | Not supplied: fixed-charge cover not disclosed | Pro forma Consolidated Fixed Charge Coverage Ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Non-guarantor ratio debt capped at USD 400 million | Releveraging | Negative — Leverage Increase | EV12 |
| 2033 notes secured ratio-debt liens | max-ratio | 5.25x | Not supplied: covenant-defined ratio not disclosed | Pro forma secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Read from clause excerpt | First-lien dilution | Negative — Leverage Increase | EV12 |

### T4C.5 Capacity Register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Maintenance covenant headroom | Section 6.14 | Ratio Basket: 7.50x | Revolver exposure above 40% | Exposure USD 67 million | Not tested | Not calculable: ratio missing | Not calculable: ratio missing | Formula Extracted Only | Low | Dormant tripwire | Neutral — Stable | EV01; K02 |
| Incremental facility capacity | Section 2.24(c) | Incremental Ratio Amount: 7.25x net and 5.00x secured net | No default; officer certificate | Covenant ratios not supplied | USD 1,500 million Tranche L | Not calculable: ratios missing | Not calculable: ratios missing | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | EV05; EV18 |
| Lien capacity | Permitted Indebtedness (12) | Ratio Basket: 5.00x secured net | Maturity and life tests; loan-party obligors only | Not supplied | Not supplied: no tracker | Not calculable | Not calculable | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | EV04 |
| Debt incurrence capacity | Permitted Indebtedness (13) | Grower Basket: greater of USD 250 million and 10% of covenant EBITDA | Borrower and guarantors | Covenant EBITDA not supplied | Not supplied | At least USD 250 million gross | Not calculable: usage missing | Provisional | Moderate | Extra debt | Negative — Leverage Increase | EV04 |
| Debt incurrence capacity | Permitted Indebtedness (14) | Grower Basket: greater of USD 450 million and 18% | Foreign restricted subsidiaries | Not supplied | Not supplied | At least USD 450 million gross | Not calculable: usage missing | Provisional | High | Structurally senior debt | Negative — Leverage Increase | EV04 |
| Debt incurrence capacity | Permitted Indebtedness (18) | Grower Basket: greater of USD 725 million and 20% | Non-recourse securitization | Facility USD 650 million | USD 487.5 million at year-end; fully drawn October 2024 | At least USD 725 million gross | Not calculable: other securitizations not established | Provisional | Moderate | Outside covenant debt | Negative — Liquidity Deterioration | EV04; EV14 |
| Restricted payment capacity | Section 6.02 final paragraph | Ratio Basket: 6.75x | No default; pro forma for financing | Not supplied | USD 4,348 million declared 2024-09-19 | Not calculable | Not calculable | Formula Extracted Only | Critical | Debt-funded distribution | Negative — Leverage Increase | EV03; EV20 |
| Restricted payment capacity | Section 6.02 (7) | General Basket: greater of USD 75 million and 3% | No default | Not supplied | Not supplied | At least USD 75 million | Not calculable | Provisional | Low | Small leakage | Neutral — Stable | EV03 |
| Restricted payment capacity | 2033 indenture Section 4.07 | Builder Basket: USD 400 million plus 50% of cumulative net income since October 2010; Ratio Basket above 2.0x | No default | Not supplied | Not supplied | Not calculable | Not calculable | Formula Extracted Only | High | Looser notes gate | Negative — Covenant Erosion | EV11 |
| Investment capacity | Permitted Investments (10) | Grower Basket: greater of USD 500 million and 25% of Total Assets | None stated | Borrower Total Assets not supplied | Not supplied | At least USD 500 million | Not calculable | Provisional | High | Value transfer | Negative — Covenant Erosion | EV07 |
| Investment capacity | Permitted Investments (20) | Ratio Basket: 5.75x | No revolver loans; USD 200 million unrestricted cash | Not supplied | Not supplied | Not calculable | Not calculable | Formula Extracted Only | High | Unlimited transfer | Negative — Covenant Erosion | EV07 |
| Unrestricted subsidiary capacity | Permitted Investments (1)(c) | Grower Basket: greater of USD 250 million and 10% | Designation conditions | Not supplied | None identified | At least USD 250 million | Not calculable | Provisional | High | Drop-down | Negative — Covenant Erosion | EV07; EV08 |
| Asset transfer capacity | Permitted Investments (1)(a) | Uncapped investment in restricted subsidiaries | None stated | Not applicable: uncapped | Not supplied | Uncapped | Uncapped | Ready with Limitations | High | Transfer to non-guarantors | Negative — Covenant Erosion | EV07 |
| Guarantor / collateral release capacity | Section 9.02(b) | Each-lender consent for material guarantor and substantially-all collateral | Except as otherwise permitted | Not applicable | Not applicable | Not applicable: consent right | Not applicable: consent right | Ready with Limitations | Low | Release strip blocked | Neutral — Stable | EV10 |

Baskets are not totalled: the borrower may classify and reclassify debt across categories, payment and investment routes overlap, and the minimum gross amounts shown are fixed floors of greater-of baskets, not remaining capacity.

### T4C.6 Debt/Lien/Priming Table

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental and ratio debt | 5.00x secured net leverage; 7.25x net for incremental | Formula Extracted Only; reference year-end identified secured carrying debt net of all cash 3.18x EBITDA As Defined, not covenant-defined and before the October dividend; post-dividend figure not established | Shares first-lien collateral | Moderate | High for first lien | First-lien spreads should price dilution | EV04; EV05; K07 |
| 2033 notes secured ratio debt | 5.25x secured net leverage | Formula Extracted Only | Looser than loans | Moderate | High | Notes covenants weaker than loans | EV12 |
| Junior lien and unsecured debt | 7.25x net leverage | Formula Extracted Only | Layers debt ahead of equity, behind first lien | Moderate | Moderate for subordinated notes if pari with them | Subordinated notes diluted | EV04 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% | Provisional | Structurally senior at non-guarantors | Low | High for all group creditors | Favors structurally senior claims | EV04 |
| MFN | Not found in incremental conditions reviewed | Insufficient Information | Incremental pricing unprotected if absent | Low | Low | Not established | EV05 |

### T4C.7 Leakage Analysis Table

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Dividends to shareholders | Open-ended at 6.75x; dividend payable within 60 days of permitted declaration | Ratio Basket | USD 4,348 million declared 2024-09-19, paid 2024-10-18; remaining not calculable | Cash leaves group and collateral | Critical | Negative — Leverage Increase | EV03; EV20 |
| Notes payment permission | Builder plus 2.0x fixed-charge route | Builder Basket; Ratio Basket | Not calculable: usage and ratio missing | Binds only if loans are repaid | High | Negative — Covenant Erosion | EV11 |
| Investments in non-guarantors | Uncapped in restricted subsidiaries | Uncapped | Not calculable | Moves value outside guarantees | High | Negative — Covenant Erosion | EV07 |
| Unrestricted subsidiary designation | Capped direct basket plus general and unlimited baskets | Grower Basket; Ratio Basket | None identified | Removes collateral and guarantees | High | Negative — Covenant Erosion | EV07; EV08 |
| Management and tax payments | Greater-of management caps; tax and overhead payments to Holdings | General Basket | Dividend equivalents USD 132 million paid October 2024 alongside the dividend | Small leakage | Low | Neutral — Stable | EV03; EV20 |

Leakage routes overlap, so they are not added together; the demonstrated route is the dividend permission.

### T4C.8 Add-Back Inflation Table

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Extraordinary, unusual or non-recurring charges, including integration costs and acquisition severance | Consolidated Net Income (3) | No cap in clause read | Not calculable: covenant EBITDA bridge missing | Lifts covenant EBITDA and every grower basket | PD understated by covenant ratios; LGD up via larger baskets | EV06 |
| Non-cash and deferred compensation | Consolidated Net Income (11) | No cap | Issuer category of USD 217 million in FY2024 is a reference only | Same | Earnings quality judges the category recurring | EV06; EV19 |
| Purchase-accounting adjustments | Consolidated Net Income (12) | No cap | Not calculable | Same | Acquisitive model inflates base | EV06 |
| Pro forma acquisitions and asset sales | Section 1.07 via ratio definitions | Not read | Not calculable | Acquired earnings counted for a full period | Same | EV06 |
| Cost savings and synergies | Opening of Consolidated EBITDA definition | Not read | Not calculable | Not established | Not established | EV06 |

The issuer's EBITDA As Defined exceeds reported EBITDA by USD 360 million in FY2024, all from categories of the same kind as the uncapped exclusions; whether covenant EBITDA equals EBITDA As Defined is not established.

### T4C.9 Flags Table

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Debt-funded distribution route | 6.75x payment test; September 2024 use | Releveraging | Critical | Moderate | Committee decision; Refinancing & LME; Security selection | EV03; EV20 |
| Basket reclassification | Borrower may divide and classify debt across categories | Capacity understated by any single basket | High | High | Covenant capacity; Security selection | EV04 |
| Non-guarantor transfer | Uncapped restricted-subsidiary investments | Recovery leakage | High | Moderate | Recovery & fulcrum; Structural priority | EV07 |
| Unrestricted subsidiary designation | Designation permitted within conditions | Drop-down | High | Moderate | Recovery & fulcrum; Committee decision | EV08 |
| Release protection | Each-lender consent for releases | Protective | Low | High | Recovery & fulcrum | EV10 |
| Amendment flexibility | Lien subordination not shown as each-lender right | Uptier risk | Moderate | Low | Refinancing & LME; Committee decision | EV10 |

### T4C.11 Priority Matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Open-ended restricted payments at 6.75x | Critical | Moderate | Debt-funded distribution | Higher leverage | Cash leaves creditors | Dividend declarations; leverage disclosures | EV03 |
| 2 | Pari secured debt at 5.00x and 5.25x | High | Moderate | First-lien dilution | Higher interest burden | Lower first-lien recovery | Secured issuance; intercreditor joinders | EV04; EV12 |
| 3 | Uncapped investments in non-guarantor restricted subsidiaries | High | Formula Only | Value transfer | Neutral | Stranded value | Obligor-group summary trends | EV07 |
| 4 | Uncapped covenant net-income exclusions | High | Formula Only | Ratio inflation | Masked deterioration | Larger baskets | Gap between EBITDA measures | EV06 |
| 5 | Lien-subordination amendment risk | Moderate | Insufficient | Uptier | Neutral | Non-participant subordination | Amendment filings | EV10 |

### T4C.12 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Covenant net leverage, secured net leverage, fixed-charge cover | Maintenance and incurrence headroom unconfirmable | Every ratio test Not Calculable | Obtain certificates |
| Covenant EBITDA bridge | Bridge from reported to covenant EBITDA | Ratio capacity unreliable | Grower baskets shown only at fixed floors | Obtain bridge |
| Basket usage tracker | Usage by basket | Remaining capacity undetermined | Remaining capacity Not Calculable | Obtain tracker |
| Unrestricted Cash and Total Assets definitions | Definitions and borrower figures | Net tests and investment basket size | Not calculable | Read definitions; obtain figures |
| MFN details | Incremental pricing protection | Incremental economics | MFN status Insufficient Information | Read full incremental section |
| Collateral and guarantor schedules | Collateral agreement and guarantor exhibit | Recovery and leakage | Release capacity limited to credit-agreement consent rules | Obtain documents |

## Calculations

All amounts are USD millions at 2024-09-30 unless stated; ratios use matching units. Inputs come from the annual report or Financial foundation as shown. No covenant-defined ratio is calculated.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | 2024-09-30 revolver trigger | Product 910 × 0.40 | 364.00 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 62; d833756dex101.htm.jsonl, page 191 |
| K02 | 2024-09-30 revolver exposure | Ratio 67 ÷ 910 | 0.073626373626373626373626373626373626374, shown as 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K03 | 2024-09-30 room to trigger | Difference 364 − 67 | 297 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59, 62 |
| K04 | 2024-09-30 trigger headroom | Difference 40.00 − 7.36 | 32.64 | Percentage points | calculation K02 |
| K05 | FY2024 obligor-group share of sales | Ratio 6294 ÷ 7940 | 0.79269521410579345088161209068010075567, shown as 79.27% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K06 | FY2024 non-guarantor sales | Difference 7940 − 6294; ratio 1646 ÷ 7940 | 1646; 0.20730478589420654911838790931989924433, shown as 20.73%; includes consolidation eliminations | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K07 | 2024-09-30 reference secured net leverage, not covenant | Difference 19534 − 6261; ratio 13273 ÷ 4173 | 13273; 3.1806853582554517133956386292834890966, shown as 3.18x; before the October dividend, post-dividend not established | USD million; x | Financial foundation (CP-1) |
| K08 | Term-loan amortisation per year | Product 22 × 4 | 88 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K09 | Secured notes principal | Sum 2100 + 2750 + 1450 + 1000 + 2200 + 1500 | 11000 | USD million | Financial foundation (CP-1) |
| K10 | Subordinated notes principal | Sum 2650 + 1200 + 750 | 4600 | USD million | Financial foundation (CP-1) |
| K11 | Term loan principal | Sum 1871 + 3632 + 1699 + 1500 | 8702 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K12 | First-lien principal | Sum 8702 + 11000 | 19702 | USD million | calculation K09; calculation K11 |

## Gaps

The open items below restrict capacity and enforcement conclusions; the provision-level meaning of the supplied documents stands.

| Gap | Severity | What is missing | Effect on conclusions | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement of 2019-02-13 and six joinders | Enforcement control, standstill, turnover and release between first-lien classes not established | d887611dex41.htm.jsonl, page 30 |
| Covenant ratios and certificates | MATERIAL | Covenant net leverage, secured net leverage, fixed-charge cover, basket usage | No headroom for any ratio test; remaining distribution and debt capacity not quantified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Collateral and guarantor documents | MATERIAL | Guarantee and collateral agreement; guarantor exhibit; entity-level debt and earnings | Collateral scope and release triggers below all-lender level not established; collateral score provisional | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Definitions not read | MINOR | Opening of covenant EBITDA definition, cost-savings terms, Unrestricted Cash, Total Assets, fixed-charge ratio, full incremental section for MFN | Add-back and MFN conclusions provisional | d887611dex101.htm.jsonl, pages 25–28 |
| Other indentures | MINOR | 2028–2032 secured and 2029 subordinated indentures; 2027 open-ended payment threshold | Note-level tests inferred only from the 2033 and 2027 indentures | d826058dex41.htm.jsonl, page 63 |
| Refinancing and LME overlay | MINOR | Refinancing and liability-management assessment not supplied | Uptier and exchange risk assessed on provisions only | Source readiness (CP-0) |

## Next module
The orchestrator selects the next module.
