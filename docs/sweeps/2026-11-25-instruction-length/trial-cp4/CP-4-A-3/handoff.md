---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-4
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-opus-high
pathway: deep_credit_assessment
module_status: Completed with Limitations
committee_status: Requires More Work
artifact_name: tdg_CP-4_20240930.md
---

## Request
Interpret the legal and covenant package of TransDigm Group Incorporated and its borrower TransDigm Inc. as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers controlling documents, definitions, debt and lien capacity, leakage, guarantees and collateral, structural priority, intercreditor control, defaults, amendment exposure and covenant headroom.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Covenant summary, springing revolver test, compliance statement, guarantor perimeter and issuer/guarantor summary, ranking, securitization and October events |
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement, with the annexed amended credit agreement | 2024-09-19, agreement date; publication date not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement definitions, financial covenant, permitted debt, investments, restricted payments, guarantee and collateral requirements, defaults, amendments and release |
| d887611dex41.htm.jsonl | Execution-version indenture for the senior secured notes due 2033 | 2024-09-19, indenture date; publication date not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note parties, intercreditor reference, secured ratio debt, amendments, collateral release and governing law |
| d826058dex41.htm.jsonl | Indenture for the senior subordinated notes due 2027 | 2019-11-13, indenture date; publication date not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordinated-note restricted payments, ratio debt, payment blockage and governing law |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted source set, document status and legal-coverage restrictions |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt by instrument, cash, EBITDA measures, net leverage and post-balance-sheet adjustments used as covenant proxies |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation facts, ownership of the borrower and distribution behaviour |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Supported-only earnings and recurrence of add-backs, compared with covenant EBITDA definitions |

## Findings

### Bottom line
TransDigm's legal package protects first-lien creditors through equal-rank shared collateral and each-lender consent over pro rata sharing and wholesale collateral release, but its ratio-based baskets let leverage and distributions rise well before any covenant default, weakening early warning and subordinated recovery.

Unlimited distributions are permitted while credit-agreement net leverage stays at or below 6.75x; on the conservative post-dividend proxy of 6.02x that cushion is only 0.73x, and the subordinated notes' 2.00x coverage test is looser still. The only maintenance test springs for revolving lenders above 40% usage, against 7.36% at year end, and a breach reaches term lenders only through revolver acceleration. Enforcement control between loan and note holders sits in an intercreditor agreement that was not supplied, so control-driven recovery outcomes are not established.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 188–191; d826058dex41.htm.jsonl, pages 63–64; d887611dex41.htm.jsonl, page 30; Financial foundation (CP-1); calculation K04; calculation K07

### Key findings
- **Distribution capacity is governed by a leverage ratio, not a builder basket, and the cushion is thin after October.** The credit agreement permits any restricted payment if pro forma net leverage does not exceed 6.75x, plus a general basket of the greater of USD 75 million and 3.0% of EBITDA. Using Financial foundation's post-dividend net leverage of 6.02x on reported EBITDA, a conservative proxy because covenant EBITDA adds back more, the cushion is 0.73x; on year-end issuer-adjusted earnings the proxy is 4.46x and the cushion 2.29x. The subordinated notes allow unlimited payments at fixed-charge coverage above 2.00x, against a 3.35x proxy, so the loan test is the binding constraint while the credit agreement is outstanding.
Basis: d887611dex101.htm.jsonl, pages 180–181; d826058dex41.htm.jsonl, pages 63–64; Financial foundation (CP-1); calculation K03; calculation K07
- **Secured releveraging is the nearest pressure point because it both dilutes existing first-lien holders and is the tightest incurrence gate.** Pari secured ratio debt and incremental loans require secured net leverage of at most 5.00x under the credit agreement and 5.25x under the 2033 secured notes. The year-end proxy is 3.22x, a cushion of 1.78x, but the October dividend removed netting cash equal to 1.04x of issuer-adjusted EBITDA, so the post-dividend cushion is materially thinner; a pro forma secured ratio is not established by Financial foundation. Free-and-clear baskets add at least USD 250 million of general debt, USD 450 million at foreign subsidiaries and USD 725 million of securitization debt.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, page 43; calculation K02; calculation K07; calculation K08
- **Covenant EBITDA is wider than any earnings measure a creditor can verify, which inflates every ratio gate.** The maintenance-test EBITDA adds back projected cost savings within 24 months with no cap, incentive-bonus costs, dividend equivalents and transaction costs, while the EBITDA used for incurrence and payments caps other cost savings at 25%. Earnings quality supports only USD 3,813 million against issuer-adjusted USD 4,173 million, so covenant headroom overstates the cushion on recurring earnings.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, pages 41–42; Earnings quality (CP-1D)
- **Default early warning is weak for term lenders and noteholders.** The 7.50x maintenance ratio, 8.00x for four quarters after a material acquisition, applies only when revolving exposure exceeds 40% of commitments, or USD 364 million; year-end exposure was USD 67 million of letters of credit, 7.36% usage, leaving USD 297 million of room before the test springs. A breach is an event of default for term lenders only once revolving lenders accelerate.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K04; calculation K05
- **First-lien sacred rights are solid on sharing and wholesale release but leave priming theoretically open.** Each affected lender must consent to changes in pro rata sharing, release of all or substantially all collateral or a material guarantor, yet required lenders may permit non-pro-rata prepayment offers made to a whole class, and the consent clauses read do not list lien subordination. Secured noteholders are protected against adverse ranking changes but a majority can amend security documents, and note liens fall away automatically when the loan collateral agent releases outside a full repayment.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 115–117; d887611dex41.htm.jsonl, pages 136–137
- **Structural reach covers roughly four-fifths of sales, and the remaining value sits ahead of every note class.** Issuer and guarantor net sales were USD 6,294 million of USD 7,940 million consolidated, leaving an indicative USD 1,646 million, 20.73%, at non-guarantors; foreign subsidiaries contribute only a 65% voting-stock pledge. The subordinated notes also face payment blockage of up to 179 days in any 360 days.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex101.htm.jsonl, pages 173–174; d826058dex41.htm.jsonl, page 107; calculation K09

### Contrary evidence and what would change the view
The strongest evidence against an aggressive reading is that the documents contain real hard limits. Unrestricted-subsidiary investment is capped at the greater of USD 250 million and 10% of EBITDA, only newly acquired or newly formed subsidiaries can be designated, the credit agreement requires each lender's consent to alter pro rata sharing or release substantially all collateral, and the subordinated notes cannot be primed by secured debt beyond the ratio gates without breaching the loan tests. The recapitalisation itself was incurred only after the borrower certified net leverage of at most 7.25x and secured net leverage of at most 5.00x, and the issuer states full covenant compliance at year end. The view would soften if the intercreditor agreement showed that secured noteholders share enforcement control and release consent, if compliance certificates showed tested ratios well inside the 6.75x payment gate, or if the omitted consent clauses add lien-subordination protection. It would harden if another distribution or secured incremental loan were incurred near the ratio limits, or if revolver usage approached USD 364 million.
Basis: d887611dex101.htm.jsonl, page 4; d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- Every headroom figure is a proxy on issuer-adjusted or reported EBITDA, not the covenant EBITDA, which adds uncapped projected savings and acquisition pro forma earnings; the distribution and secured-debt cushions are therefore indicative and probably understated, so the conclusion that the payment gate is near is directional, not a legal capacity figure.
- The first-lien intercreditor agreement and the guarantee and collateral agreement were not supplied, so the conclusion that loan lenders effectively control collateral release for noteholders rests on indenture release wording alone and could reverse if the intercreditor agreement grants noteholders shared control.
- Only the 2033 secured notes and 2027 subordinated notes indentures were reviewed; the conclusions on note-level payment tests, release and amendment thresholds are extended to the other note series by analogy and may differ for the 2028–2032 secured notes and the 2029 subordinated notes.
- The amendment clause was read only in part, so the theoretical-uptier conclusion could fall away if unread provisions add lien-subordination or non-pro-rata exchange protections.
- No compliance certificate or basket-usage record was supplied, so remaining capacity under each fixed and grower basket is not established and no basket is assumed unused.

### Nearest pressure point
The nearest pressure point is the secured net leverage gate for pari first-lien incurrence: at most 5.00x under the credit agreement and 5.25x under the 2033 secured notes, measured on secured debt less unrestricted cash over trailing EBITDA. Borrower action would use it to add pari secured incremental loans or notes, diluting existing first-lien recovery while netting cash that the October dividend has already spent. The year-end proxy cushion of 1.78x shrinks once the dividend's cash removal, equal to 1.04x of issuer-adjusted EBITDA, is reflected. Monitor quarterly secured debt, cash and any incremental joinder, and obtain the compliance certificate and covenant EBITDA calculation to tighten the view.
Basis: d887611dex101.htm.jsonl, pages 27; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, page 43; calculation K02; calculation K08

### Capital structure
Every funded class sits at TransDigm Inc.; the controlling documents for only two note series are in the source set.

| Instrument | Principal | Rank and security | Controlling document in source set | Key legal protection or gap | Source |
|---|---|---|---|---|---|
| Revolving credit facility | USD 910 million commitment; USD 67 million letters of credit | Senior secured first lien | Yes, credit agreement as amended | Only springing maintenance test, 7.50x above 40% usage | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I–L | USD 8,702 million | Senior secured first lien | Yes, credit agreement as amended | No maintenance test; each-lender consent for sharing and wholesale release | d887611dex101.htm.jsonl, pages 204–205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Secured notes 2028–2032 | USD 9,500 million | Senior secured, equal payment rank with loans | No, indentures not supplied | Terms assumed similar to 2033 notes; not verified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–61; calculation K10 |
| 2033 secured notes | USD 1,500 million | Senior secured, equal payment rank with loans | Yes, 2033 indenture | Ranking change needs each holder; release follows loan agent | d887611dex41.htm.jsonl, pages 116–117; d887611dex41.htm.jsonl, pages 136–137 |
| 2027 subordinated notes | USD 2,650 million | Senior subordinated, unsecured | Yes, 2027 indenture | Payment blockage up to 179 days; payments test at 2.00x coverage | d826058dex41.htm.jsonl, pages 63–64; d826058dex41.htm.jsonl, page 107 |
| 2029 subordinated notes | USD 1,950 million | Senior subordinated, unsecured | No, indentures not supplied | Terms not verified | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–61; calculation K10 |
| Receivables securitization | USD 487.5 million drawn of USD 650 million | Secured by domestic receivables of a securitization entity | No, facility agreement not supplied | Permitted up to greater of USD 725 million and 20% of EBITDA | d887611dex101.htm.jsonl, page 60; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |
| Finance leases and government advances | USD 262 million and USD 17 million carrying | Legal rank not established | No | Outside the ranked stack | Financial foundation (CP-1) |

### Covenant tests and headroom
Every ratio gate passes on the proxies, but the distribution gate has the thinnest cushion once the October dividend is reflected.

| Test | Limit | Proxy current | Cushion | What it governs | Source |
|---|---|---|---|---|---|
| Springing net leverage, year end | 7.50x | 4.46x | 3.04x | Revolver maintenance, only above 40% usage | d887611dex101.htm.jsonl, page 188; calculation K07 |
| Springing net leverage, post-dividend | 7.50x | 6.02x | 1.48x | Same test on conservative reported-EBITDA proxy | d887611dex101.htm.jsonl, page 188; calculation K07 |
| Revolver usage trigger | 40.00% | 7.36% | 32.64% | Whether the maintenance test applies | d887611dex101.htm.jsonl, page 188; calculation K04 |
| Distribution ratio gate | 6.75x | 6.02x | 0.73x | Unlimited restricted payments | d887611dex101.htm.jsonl, page 181; calculation K07 |
| Total net leverage incurrence | 7.25x | 6.02x | 1.23x | Incremental, junior secured and unsecured ratio debt | d887611dex101.htm.jsonl, pages 59–60; calculation K07 |
| Secured net leverage, loans | 5.00x | 3.22x | 1.78x | Pari secured ratio debt and incremental loans | d887611dex101.htm.jsonl, page 146; calculation K02 |
| Secured net leverage, 2033 notes | 5.25x | 3.22x | 2.03x | Liens for secured ratio debt under the notes | d887611dex41.htm.jsonl, page 43; calculation K02 |
| Fixed-charge coverage, 2027 notes | 2.00x | 3.35x | 1.35x | Unlimited payments and ratio debt under the subordinated notes | d826058dex41.htm.jsonl, pages 63–64; calculation K03 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver springing net leverage, year-end proxy | 7.50 | 4.46 | 3.04x | Passes at or below | x | Credit agreement financial covenant; current is Financial foundation net debt over issuer EBITDA As Defined, not covenant EBITDA; tested only above 40% usage |
| Revolver springing net leverage, post-dividend proxy | 7.50 | 6.02 | 1.48x | Passes at or below | x | Current is Financial foundation pro forma net leverage after the 2024-10-18 dividend on reported EBITDA; conservative because covenant EBITDA is wider |
| Revolver usage trigger | 40.00 | 7.36 | 32.64% | Passes at or below | % | Letters of credit of USD 67 million over USD 910 million commitments; whether any letter is cash collateralised is not stated |
| Revolver draw condition | 35.00 | 7.36 | 27.64% | Passes at or below | % | Above 35% usage a new draw requires the ratio to meet the financial-covenant level; same usage basis |
| Distribution ratio gate | 6.75 | 6.02 | 0.73x | Passes at or below | x | Incurrence-style test at the time of payment; conservative post-dividend proxy |
| Total net leverage incurrence | 7.25 | 6.02 | 1.23x | Passes at or below | x | Incremental, junior and unsecured ratio debt; conservative post-dividend proxy |
| Secured net leverage, loans | 5.00 | 3.22 | 1.78x | Passes at or below | x | Year-end principal of secured loans and notes less reported cash over EBITDA As Defined; post-dividend figure not established |
| Secured net leverage, 2033 notes | 5.25 | 3.22 | 2.03x | Passes at or below | x | Same proxy; indenture lien test for secured ratio debt |
| Fixed-charge coverage, 2027 notes | 2.00 | 3.35 | 1.35x | Passes above | x | EBITDA As Defined over net interest expense excluding debt-cost amortization; excludes pro forma interest on the September financings |

All current values are analytical proxies built from issuer-reported measures, not tested covenant ratios, and none is a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the indenture states its own agreement date but no publication date | First Lien Intercreditor Agreement dated, later joined by six joinders | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement and release among all first-lien classes; not in the source set |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 executed, latest amendment changing restrictive covenants | Historical — Amendment No. 15, executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets the covenant terms in force at year end |
| 2024-09-19 | day | Not supplied: the amendment states its agreement date but no publication date | Amendment No. 17 effective; Tranche L of USD 1,500 million incurred subject to certified ratio limits | Historical — conditions to the Amendment No. 17 Effective Date | d887611dex101.htm.jsonl, page 4 | Recap debt incurred within the 7.25x and 5.00x gates by certificate; the dividend payment itself is recorded by Business & governance |
| 2024-09-19 | day | Not supplied: the indenture states its agreement date but no publication date | 2033 secured notes indenture executed and joined to the first-lien intercreditor agreement | Historical — indenture dated as of September 19, 2024 | d887611dex41.htm.jsonl, pages 3 and 30 | Adds a further pari first-lien class sharing the same collateral |
| 2024-09-30 | day | 2024-11-07 | Quarter-end covenant date; issuer states compliance with all debt covenants | Historical — in compliance with all of its debt covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Compliance is asserted but the tested ratio is not disclosed |
| 2027-09-15 | day | Not supplied: the indenture states its agreement date but no publication date | Initial redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Call protection ends, widening refinancing options |
| 2029-02-27 | day | 2024-11-07 | Revolver maturity | Scheduled — maturity date of the revolving credit facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance covenant lapses with the revolver unless replaced |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all capital stock | Ownership | TransDigm Inc. | Annual report 2024; Delaware corporations |
| TransDigm Group Incorporated | Guarantees loans as Holdings | Guarantee | Senior secured credit facilities | Credit agreement as amended; New York law |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | Secured notes | 2033 indenture; New York law |
| Domestic Restricted Subsidiaries | Senior secured guarantee | Guarantee | Secured notes | 2033 indenture and annual report; New York law |
| TransDigm UK Holdings plc | Senior subordinated guarantee | Guarantee | Senior subordinated notes | 2027 indenture and annual report; New York law |
| Domestic Restricted Subsidiaries | Senior subordinated guarantee | Guarantee | Senior subordinated notes | 2027 indenture and annual report; New York law |
| Loan Parties | Pledge 100% domestic, 65% foreign voting stock | Security | Senior secured credit facilities | Credit agreement further-assurance clause; New York law |
| Non-guarantor subsidiaries | Liabilities rank ahead of note claims | Structural claim | Secured notes | Annual report 2024; New York-law indentures |
| Non-guarantor subsidiaries | Liabilities rank ahead of note claims | Structural claim | Senior subordinated notes | Annual report 2024; New York-law indentures |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facilities | Equal right of payment | Payment rank | Secured notes | Annual report 2024; New York-law indentures |
| Secured notes | Senior in right of payment | Payment rank | Senior subordinated notes | Annual report 2024; New York-law indentures |
| Senior secured credit facilities | Share first-priority liens | Security rank | Secured notes | First Lien ICA 2019, not supplied; NY-law indenture |
| Credit agreement collateral agent | Loan lien release releases note liens | Release | Secured notes | 2033 indenture release clause; New York law |
| Designated Senior Debt representative | Payment blockage up to 179 days | Standstill | Senior subordinated notes | 2027 indenture subordination; New York law |
| Required Revolving Lenders | Control financial-covenant remedies | Enforcement control | Term lenders | Credit agreement defaults; New York law |
| Required Lenders | Direct agent remedies on default | Enforcement control | Senior secured credit facilities | Credit agreement defaults; New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 14 |
| Calculated | 5 |
| Assumption-Based | 0 |
| Analyst Inference | 4 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 4 |
| Fields present | 32 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

The registers below are complete for this run. Raw locators sit in the evidence register; other registers cite evidence identifiers.

### Evidence register

| Evidence ID | Content | Source |
|---|---|---|
| L01 | Subordination, guarantor scope, structural subordination to non-guarantors | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58 |
| L02 | Issuer/guarantor combined summary; term loans, revolver, letters of credit, notes table | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| L03 | Covenant summary, Amendment No. 15, incremental ratios, springing 7.50x test at 40% usage, compliance, cash collateral reach | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| L04 | Securitization terms, October draw, dividend paid 2024-10-18 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |
| L05 | Amendment No. 17 conditions: net leverage at most 7.25x, secured at most 5.00x, certificate, solvency | d887611dex101.htm.jsonl, page 4 |
| L06 | Consolidated EBITDA cost-savings cap of 25% | d887611dex101.htm.jsonl, page 24 |
| L07 | Consolidated Net Leverage Ratio and Consolidated Secured Net Debt Ratio definitions | d887611dex101.htm.jsonl, pages 26–27 |
| L08 | Financial Covenant Consolidated EBITDA definition | d887611dex101.htm.jsonl, pages 41–42 |
| L09 | Permitted Indebtedness clauses 12–18 | d887611dex101.htm.jsonl, pages 59–60 |
| L10 | Permitted Investments clauses 1–20 | d887611dex101.htm.jsonl, pages 61–63 |
| L11 | Unrestricted Cash and Unrestricted Subsidiary designation | d887611dex101.htm.jsonl, page 81 |
| L12 | Incremental facility conditions | d887611dex101.htm.jsonl, page 146 |
| L13 | Revolver draw condition at 35% usage | d887611dex101.htm.jsonl, page 165 |
| L14 | Guarantor joinder, excluded subsidiaries, equity pledge 100% domestic and 65% foreign voting | d887611dex101.htm.jsonl, pages 173–174 |
| L15 | Negative covenants: debt, restricted payments, asset sales, payment restrictions | d887611dex101.htm.jsonl, pages 177–182 |
| L16 | Financial covenant and events of default | d887611dex101.htm.jsonl, pages 188–189 |
| L17 | Financial Covenant Event of Default and remedies control | d887611dex101.htm.jsonl, pages 191–193 |
| L18 | Amendments, sacred rights, non-pro-rata offers, lien release | d887611dex101.htm.jsonl, pages 204–206 |
| L19 | Credit agreement governing law New York | d887611dex101.htm.jsonl, page 222 |
| L20 | 2033 indenture parties and date | d887611dex41.htm.jsonl, page 3 |
| L21 | First Lien Intercreditor Agreement and joinders; initial redemption date | d887611dex41.htm.jsonl, page 30 |
| L22 | Secured ratio debt lien test 5.25x | d887611dex41.htm.jsonl, page 43 |
| L23 | Covenant suspension and impairment of security interest | d887611dex41.htm.jsonl, pages 91–92 |
| L24 | 2033 indenture amendments and each-holder rights | d887611dex41.htm.jsonl, pages 115–117 |
| L25 | 2033 indenture collateral release | d887611dex41.htm.jsonl, pages 136–137 |
| L26 | 2033 indenture governing law New York | d887611dex41.htm.jsonl, page 126 |
| L27 | 2027 indenture restricted payments with 2.0x coverage test | d826058dex41.htm.jsonl, pages 63–64 |
| L28 | 2027 indenture ratio debt with 2.0x coverage test | d826058dex41.htm.jsonl, page 67 |
| L29 | 2027 indenture payment blockage | d826058dex41.htm.jsonl, page 107 |
| L30 | 2027 indenture governing law New York | d826058dex41.htm.jsonl, page 124 |
| L31 | Debt, cash, EBITDA measures, post-balance-sheet adjustments | Financial foundation (CP-1) |
| L32 | Supported-only EBITDA and add-back recurrence | Earnings quality (CP-1D) |
| L33 | Dividend recapitalisation, ownership of borrower | Business & governance (CP-1A) |
| L34 | Legal-coverage restrictions of the source set | Source readiness (CP-0) |

### T4D.1 Source gate and module status

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement as amended by Amendment No. 17 | Executed, execution version with annexed conformed text | 1 | Schedules, exhibits and Guarantee and Collateral Agreement not supplied | Completed with Limitations |
| 2033 secured notes indenture | Executed, execution version | 1 | Security documents and intercreditor agreement not supplied | Completed with Limitations |
| 2027 subordinated notes indenture | Executed | 1 | Supplemental indentures not supplied | Completed with Limitations |
| First Lien Intercreditor Agreement dated 2019-02-13 | Referenced only; not in source set | 2 | Enforcement, turnover and release mechanics not established | Completed with Limitations |
| Compliance certificates and basket trackers | Not in source set | 3 | Tested ratios and usage not established | Completed with Limitations |
| Annual report 2024 | Filed; published after the cutoff | 4 | Summary of covenants; not controlling over executed text | Completed with Limitations |
| Other indentures for 2028–2032 secured notes and 2029 subordinated notes | Not in source set | 1 | Note-level terms not verified | Completed with Limitations |

Subsequent events after 2024-09-30: the remaining USD 162.5 million securitization availability was drawn on 2024-10-16 and the declared dividend and equivalents of USD 4,348 million were paid on 2024-10-18. Neither changed the guarantor or collateral perimeter; both are treated as capacity usage after the balance-sheet date, not as period facts.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; Financial foundation (CP-1)

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as amended by Amendment No. 17 | Credit agreement | 2024-09-19 amendment; restatement 2014 | Executed | Controls loan covenants, financial covenant, permitted debt, investments, payments, amendments | Governs USD 8,702 million term loans and USD 910 million revolver | L05; L15; L18 |
| 1 | Indenture for senior secured notes due 2033 | Indenture | 2024-09-19 | Executed | Controls 2033 note covenants, release and amendments | USD 1,500 million first-lien notes; template evidence for other secured notes | L20; L24; L25 |
| 1 | Indenture for senior subordinated notes due 2027 | Indenture | 2019-11-13 | Executed | Controls subordination, payment blockage, note payment tests | USD 2,650 million subordinated notes | L27; L29 |
| 2 | First Lien Intercreditor Agreement | Intercreditor agreement | 2019-02-13 with joinders to 2024-09-19 | [Insufficient Information] — intercreditor agreement not in the source set | Would control first-lien enforcement and release | Determines whether noteholders share control | L21 |
| 4 | Annual report 2024 covenant summary | Filing summary | 2024-11-07 | Filed | Summary only; executed text governs | Compliance statement and springing-test description | L03 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at most 7.50x, 8.00x for four quarters after a Material Acquisition, only if revolving exposure exceeds 40% of commitments; amendable by Required Revolving Lenders | Credit agreement s.6.14 | Test can be avoided by keeping revolver usage low | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L16 |
| Draw condition | Draw lifting usage above 35% requires actual ratio within financial-covenant level | Credit agreement s.4.01(d) | Liquidity access tightens before the covenant springs | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L13 |
| Restricted payments | Unlimited if pro forma net leverage at most 6.75x and no default; general basket greater of USD 75 million and 3.0% EBITDA; 60-day declaration safe harbour | Credit agreement s.6.02 | Distributions scale with EBITDA and debt capacity | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L15 |
| Restricted payments, notes | Unlimited if fixed-charge coverage above 2.0x and no default | 2027 indenture s.4.07 | Looser than loan test once loans repaid | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L27 |
| Debt incurrence | Pari secured ratio debt at secured net leverage at most 5.00x; junior secured or unsecured at net leverage at most 7.25x; general basket greater of USD 250 million and 10% EBITDA | Credit agreement Permitted Indebtedness clauses 12, 13, 17 | Ratio and grower capacity | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L09 |
| Incremental facilities | Subject to net leverage at most 7.25x and secured net leverage at most 5.00x | Credit agreement s.2.24(c) | Pari secured dilution | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L12 |
| EBITDA add-backs | Covenant EBITDA adds uncapped projected savings within 24 months, incentive costs, dividend equivalents, transaction costs | Financial Covenant Consolidated EBITDA | Inflates denominator | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L08; L06 |
| Investments | Unrestricted subsidiaries greater of USD 250 million and 10% EBITDA; general greater of USD 500 million and 25% Total Assets; unlimited at 5.75x with no revolver loans and USD 200 million cash; joint ventures greater of USD 1,000 million and 40% EBITDA at 7.00x | Permitted Investments clauses 1, 10, 11, 20 | Value can move to non-guarantors | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L10 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries designable, subject to payment and investment covenants | Unrestricted Subsidiary definition | Limits designation of existing operating subsidiaries | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L11 |
| Asset sales | Fair value; 75% cash for sales above USD 50 million; Designated Non-Cash Consideration up to USD 300 million; proceeds under prepayment section | Credit agreement s.6.03 | Bounded disposal leakage | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L15 |
| Guarantors and collateral | Domestic subsidiaries join except immaterial, unrestricted and securitization entities; 100% domestic, 65% foreign voting stock pledged | Credit agreement s.5.11 | Foreign value only partly reachable | Negative — Refinancing Risk | [Insufficient Information] — no comparative source supplied | L14 |
| Events of default | Payment, 5-business-day interest grace, 30-day cure for other covenants, cross-default to Material Indebtedness | Credit agreement Article VII | Cross-default links note and loan defaults | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L16 |
| Amendments | Required Lenders generally; each lender for sharing, voting thresholds, material guarantor and substantially all collateral release; non-pro-rata class-wide offers by Required Lenders | Credit agreement s.9.02 | Lien subordination not listed in clauses read | Insufficient Information | [Insufficient Information] — no comparative source supplied | L18 |
| Note amendments and release | Majority amends indenture, security documents and intercreditor agreement; each holder for adverse ranking change; liens released when loan agent releases outside full repayment | 2033 indenture s.9.02, s.12.07 | Noteholder collateral follows loan decisions | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L24; L25 |
| Covenant suspension | Covenants suspend on investment-grade ratings | 2033 indenture s.4.19 | Protection falls away on upgrade | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L23 |

### Step findings: definitions, debt, leakage, collateral and defaults

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions, executed, rank 1 | Total indebtedness less Unrestricted Cash over LTM EBITDA, pro forma for acquisitions and sales | Full cash netting; pro forma acquisitions widen denominator | Moderate: tests pass while gross debt rises | Moderate: netting cash can be spent after incurrence | Track cash and acquisition pro forma claims | Negative — Covenant Erosion | High | L07 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions, executed, rank 1 | Uncapped projected cost savings within 24 months, bonus and dividend-equivalent add-backs | Maintenance denominator exceeds verifiable earnings | Moderate: delays default signal | Low | Compare certificate EBITDA with supported-only USD 3,813 million | Negative — Covenant Erosion | High | L08; L32 |
| Pari secured ratio debt and incremental | Credit agreement, rank 1; 2033 indenture | Secured net leverage at most 5.00x loans, 5.25x notes | Pari dilution of existing first lien | Moderate | High: dilutes first-lien recovery | Watch joinders and incremental agreements | Negative — Leverage Increase | High | L09; L12; L22 |
| Restricted payments ratio basket | Credit agreement, rank 1 | Unlimited at net leverage at most 6.75x | Demonstrated October dividend of USD 4,348 million | High: recap capacity recurs as EBITDA grows | Moderate: cash leaves the group | Watch declarations and pro forma ratio | Negative — Leverage Increase | High | L15; L33 |
| Investments and non-guarantor transfers | Credit agreement, rank 1 | Multiple grower and ratio investment baskets | Value can move to foreign non-guarantors | Low | High: strands value behind structural claims | Watch non-guarantor share of sales | Negative — Covenant Erosion | Medium | L10 |
| Guarantor and collateral coverage | Credit agreement and annual report | Domestic restricted subsidiaries and UK guarantee; foreign excluded | 20.73% of sales indicatively outside guarantors | Low | Moderate | Monitor issuer/guarantor summary annually | Negative — Refinancing Risk | Medium | L01; L02; L14 |
| Defaults and remedies | Credit agreement, rank 1 | Term-lender default on covenant breach only after revolver acceleration | Delayed acceleration | Moderate: later default, more erosion | Moderate | Monitor revolver usage against USD 364 million | Negative — Covenant Erosion | High | L17 |
| Amendment control | Credit agreement and 2033 indenture | Sacred rights on sharing and release; majority note amendments | Priming not expressly barred in clauses read | Low | High if exercised | Watch amendment filings | Insufficient Information | Medium | L18; L24 |

Covenant debt in all ratios is Consolidated Total Indebtedness, whose full text was not read; it may be measured on principal rather than the carrying basis used by Financial foundation. The secured proxy uses principal of USD 19,702 million against carrying USD 19,534 million, logged below. Customer advances of USD 177 million are not established as inside or outside covenant Indebtedness, and the September dividend payable is not treated as Indebtedness.
Basis: d887611dex101.htm.jsonl, pages 26–27; Financial foundation (CP-1); calculation K02

### Definition conflict register

| Item | Covenant definition | Canonical basis | Figures | Treatment | Evidence ID |
|---|---|---|---|---|---|
| Secured debt numerator | Consolidated Secured Debt within Consolidated Total Indebtedness, definition text not fully read | Carrying value | Principal USD 19,702 million; carrying USD 19,534 million | Principal used for proxy; securitization and leases excluded; not reconciled | L07; L31 |
| EBITDA denominator | Financial Covenant Consolidated EBITDA and Consolidated EBITDA | Reported EBITDA USD 3,813 million; EBITDA As Defined USD 4,173 million | Covenant figure not supplied | Proxies on both issuer measures; covenant figure not inferred | L08; L31; L32 |
| Material-acquisition step-up | 8.00x for first four quarters in s.6.14 | Draw condition refers to first two quarters | Four versus two quarters | Conflicting internal text; both retained | L13; L16 |
| Springing trigger versus draw condition | 40% usage for the covenant | 35% usage for the draw condition | USD 364 million versus USD 318.50 million | Different provisions; both apply | L13; L16; L03 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Distribution capacity | Unlimited payments at net leverage at most 6.75x; dividend of USD 4,348 million paid 2024-10-18 | Repeated debt-funded recaps | Raises PD through higher leverage and less cash | Reduces recovery via cash leakage | Watch declarations and pro forma leverage | L15; L04 |
| Pari secured incurrence | Secured net leverage at most 5.00x and 5.25x | Dilutes first-lien pool | Modest PD effect | Higher first-lien LGD | Watch incremental joinders | L09; L12; L22 |
| Springing maintenance | Tested only above 40% usage | No early default trigger for term loans and notes | Defers default to liquidity event | Lower recovery at default | Revolver usage quarterly | L16; L17 |
| Covenant EBITDA | Uncapped projected savings | Overstates ratio cushion | Delays covenant signal | Indirect | Certificate EBITDA bridge | L08 |
| Structural subordination | Non-guarantor liabilities rank ahead | Value stranded at foreign subsidiaries | Low | Raises LGD for all notes | Issuer/guarantor summary | L01; L02 |
| Subordination and blockage | 179-day blockage | Junior payment interruption | Raises subordinated PD in stress | High subordinated LGD | Blockage notices | L29 |
| Release mechanics | Note liens follow loan agent release | Collateral loss without noteholder vote | Low | Raises secured-note LGD | Release notices | L25 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | As recorded in the covenant feature register | [Insufficient Information] — no covenant-review report or market-norm source supplied | Market-norm comparison is limited because no supported comparative source was provided | Not assessable without a comparator; no market-norm conclusion drawn | Insufficient Information | L34 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Springing revolver-only test at 7.50x above 40% usage | No maintenance protection for term loans or notes | Negative — Covenant Erosion | Provisional | L16; L17 |
| Debt / lien incurrence capacity | 4 | Ratio debt to 5.00x secured and 7.25x total; grower general, foreign and securitization baskets | Pari dilution and leverage growth | Negative — Leverage Increase | Provisional | L09; L12 |
| RP / investment / leakage capacity | 4 | Unlimited payments at 6.75x; investments up to greater of USD 500 million and 25% Total Assets; unlimited at 5.75x | Recap and transfer capacity | Negative — Leverage Increase | Provisional | L10; L15 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped projected savings for maintenance EBITDA; 25% cap for incurrence EBITDA | Ratio inflation | Negative — Covenant Erosion | Provisional | L06; L08 |
| Collateral / guarantor protection | 3 | Domestic guarantors, 65% foreign pledge, drag-along release for notes | Partial reach and release dependence | Negative — Refinancing Risk | Provisional | L14; L25 |
| Amendment / control mechanics | 3 | Each-lender sharing and release rights; class-wide non-pro-rata offers; lien subordination not listed | Theoretical priming | Insufficient Information | Provisional | L18; L24 |
| Overall | 4 | Weighted to payment and incurrence capacity | Leverage can rise without default | Negative — Leverage Increase | Provisional | L09; L15 |

The overall score of four on the scale is Aggressive and Provisional because the intercreditor agreement, collateral agreement and other indentures were not supplied.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further special dividend | Payment ratio gate 6.75x | Recap capacity recurs | PD up; LGD up | Track declarations and pro forma net leverage | L15 |
| Secured incremental joinder | Incremental and ratio debt at 5.00x secured | Dilutes first lien | LGD up for first lien | Track joinders and Amendment filings | L12 |
| Revolver usage above USD 364 million | Springing covenant | Test becomes live | PD signal | Quarterly revolver exposure | L16 |
| Collateral release by loan agent | 2033 note release clause | Note liens fall away | LGD up for notes | Release notices | L25 |
| Non-pro-rata class offers | Credit agreement amendment proviso | Liability management | RV dispersion | Amendment filings | L18 |
| Investment into foreign non-guarantors | Investment baskets | Value stranding | LGD up | Issuer/guarantor sales share | L10; L02 |
| Blockage notice | 2027 indenture subordination | Junior payment stop | Subordinated PD up | Trustee notices | L29 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor control | First Lien Intercreditor Agreement and joinders | Enforcement, turnover and release among first-lien classes | Intercreditor registers carry insufficient-information cells | Obtain executed agreement and joinders |
| Collateral documents | Guarantee and Collateral Agreement, security schedules | Excluded assets and perfection | Collateral matrix qualitative only | Obtain collateral agreement and schedules |
| Other indentures | 2028–2032 secured and 2029 subordinated note indentures | Note-level terms may differ | Extrapolated conclusions | Obtain indentures |
| Covenant inputs | Compliance certificates, covenant EBITDA, Consolidated Total Indebtedness | Exact headroom | Proxies only | Obtain certificates |
| Basket usage | Usage trackers | Remaining capacity | Not calculable | Obtain trackers |
| Amendment clause | Full consent provisions | Uptier protection | Theoretical label | Read full clause |
| Market norm | Covenant-review report | Comparison | Market-norm step skipped | Obtain report |

### T4D.2 Restricted / unrestricted entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings, guarantor | Delaware | Public shareholders | Not a subsidiary; guarantor | No significant operations or assets apart from TransDigm Inc. | Yes | L01; L33 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Borrower | Combined issuer and guarantors: net sales USD 6,294 million; current assets USD 7,813 million; goodwill USD 8,186 million | Yes | L02 |
| TransDigm UK Holdings plc | Guarantor of subordinated notes and 2028 secured notes | United Kingdom, plc | Not established in pages read | Restricted | — not disclosed separately | Yes | L01 |
| Domestic Restricted Subsidiaries | Guarantors | United States | TransDigm Inc. | Restricted; newly acquired or formed may be designated unrestricted | Included in combined summary | Yes | L01; L11; L14 |
| Foreign Restricted Subsidiaries | Non-guarantors | Various, not established | Loan Parties | Restricted | Indicative net sales outside guarantors USD 1,646 million | No; 65% voting stock pledged | L02; L14; K09 |
| Securitization Entity | Receivables financing vehicle | Not established | Not established | Excluded subsidiary | Domestic trade receivables collateral | No | L04; L14 |
| Unrestricted Subsidiaries | None identified | Not established | Not established | Current designations not established | — not disclosed | No | L11 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × credit facilities | Senior secured | Downstream | Material guarantor release needs each lender except as otherwise permitted | L18; L33 |
| Domestic restricted subsidiaries × credit facilities | Senior secured | Upstream and cross-stream | Designation as unrestricted; permitted disposal | L14; L18 |
| Holdings, UK and domestic restricted subsidiaries × 2028 secured notes | Senior secured | Downstream and upstream | Indenture not supplied | L01 |
| Holdings and restricted subsidiaries guaranteeing loans or at least USD 200 million capital-markets debt × 2029–2033 secured notes | Senior secured | Downstream and upstream | Designation as unrestricted; becoming immaterial; ceasing to be a subsidiary | L01; L25 |
| Holdings, UK and domestic restricted subsidiaries × subordinated notes | Senior subordinated unsecured | Downstream and upstream | Subordinated guarantee release terms not read | L01 |

### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Holdings × first lien | Equity of unrestricted subsidiaries | Full repayment; permitted disposal; each lender for substantially all | Collateral agreement not supplied | L14; L18 |
| TransDigm Inc. × first lien | Equity requiring separate SEC financial statements | Same | Collateral agreement not supplied | L14 |
| Domestic restricted subsidiaries × first lien | Immaterial and securitization entities excluded | Same; automatic on unrestricted designation for notes | Post-closing perfection within 90 days for 2033 notes | L14; L25 |
| TransDigm UK Holdings plc × first lien | — not disclosed | UK collateral agent named; mechanics not read | Local-law limits not established | L20 |
| Foreign restricted subsidiaries × first lien | Assets excluded; 65% voting stock only | Not applicable to assets | Foreign perfection not established | L14 |
| Securitization entity × receivables lien | Not part of first-lien pool | Facility terms not supplied | Not established | L04 |
| All entities × second lien | — no second-lien debt identified | Not applicable | Not applicable | L02 |
| All entities × unsecured | Subordinated notes hold no collateral | Not applicable | Not applicable | L01 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc. with guarantors | First-lien collateral plus guarantor value | Pari | Foreign non-guarantor assets beyond 65% voting stock; indicative USD 1,646 million of sales | Strongest access, shared with secured notes | Medium | L01; L14 |
| Secured notes | TransDigm Inc. with guarantors | Same pool | Pari | Same; plus collateral released by loan agent | Equal access but release-dependent | Medium | L25 |
| Subordinated notes | TransDigm Inc. with guarantors | Residual guarantor value | Contractually Subordinated | All first-lien claims and non-guarantor liabilities | Weakest access | Medium | L01; L29 |
| Securitization lenders | Securitization entity | Domestic receivables | Structurally Senior | Receivables removed from first-lien pool | Senior on receivables | Low | L04 |
| Non-guarantor creditors | Foreign subsidiaries | Foreign assets | Structurally Senior | Not applicable to these creditors | Ahead of all note classes on foreign value | Medium | L01 |

### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distribution to shareholders | TransDigm Inc. to Holdings to shareholders | Restricted payments ratio basket at 6.75x | USD 4,348 million paid in October; further amount not established | 4 | Cash leaves all creditor reach | Demonstrated | L15; L04 |
| Investment in unrestricted subsidiaries | Loan Parties to newly designated subsidiary | Permitted Investments clause 1 | Greater of USD 250 million and 10% EBITDA | 2 | Value outside guarantees | Theoretical | L10; L11 |
| Transfer to non-guarantor restricted subsidiaries | Guarantors to foreign subsidiaries | Intra-group and general investments; unlimited at 5.75x | Not capped for restricted subsidiaries; general basket greater of USD 500 million and 25% Total Assets | 4 | Structural subordination grows | Theoretical | L10 |
| Joint venture contribution | Loan Parties to joint ventures | Permitted Investments clause 11 | Greater of USD 1,000 million and 40% EBITDA at 7.00x | 3 | Assets leave collateral | Theoretical | L10 |
| Asset sale | Loan Parties to third parties | Asset sales covenant and automatic lien release | Bounded by fair value and 75% cash | 3 | Collateral released; proceeds under prepayment rules | Theoretical | L15; L18 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier via lien subordination | Credit agreement amendment clause; subordination not listed among each-lender rights read | Non-consenting term lenders | Theoretical | Priming-Exposed (uptier capable) | Low | L18 |
| Non-pro-rata prepayment offers | Required Lenders may permit class-wide offers | Term lenders | Theoretical | Open to all lenders of a class; selective exchange not shown | Medium | L18 |
| Note collateral release | Note liens released when loan agent releases outside full repayment; majority amends security documents | Secured noteholders | Theoretical | Leakage-Exposed (drop-down capable) | Medium | L24; L25 |
| Drop-down to non-guarantors | Investment baskets | All note classes | Theoretical | Structurally Subordinated — Non-Guarantor Value | Medium | L10 |

### T4D.8 Gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Entity list | Subsidiary guarantor exhibit and org chart | Perimeter by name | Entity register uses classes | Obtain guarantor exhibit |
| Entity values | Debt, assets and EBITDA by entity | Stranded value sizing | Indicative sales residual only | Obtain entity data |
| Collateral | Guarantee and Collateral Agreement | Excluded assets | Matrix qualitative | Obtain agreement |
| Designations | Unrestricted subsidiary list | Current leakage | None identified | Obtain officer certificates |
| UK guarantor | UK security documents | Local-law limits | UK row incomplete | Obtain documents |

### T4F.1 Controlling documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement as amended | TransDigm Inc., Holdings, subsidiary Loan Parties, lenders, agent | 2024-09-19 amendment | New York | Executed | d887611dex101.htm.jsonl, page 222 | L19 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, Guarantors, Bank of New York Mellon Trust Company as trustee and US collateral agent, Bank of New York Mellon as UK collateral agent | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 3 and 126 | L20; L26 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, trustee | 2019-11-13 | New York | Executed | d826058dex41.htm.jsonl, page 124 | L30 |
| First Lien Intercreditor Agreement | Company, Holdings, subsidiary guarantors, credit agreement collateral agent, secured notes trustees and collateral agents | 2019-02-13 | [Insufficient Information] — intercreditor agreement not in the source set | Referenced only | d887611dex41.htm.jsonl, page 30 | L21 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Shared first-lien collateral | Control financial-covenant remedies | Required Revolving Lenders for the financial covenant | L16; L17 |
| Term lenders | First lien, pari | Shared first-lien collateral | Required Lenders direct agent remedies | Required Lenders under the credit agreement; percentage not read | L17; L18 |
| Secured noteholders | First lien, pari | Shared collateral through notes collateral agents | Indenture remedies subject to intercreditor agreement | Majority of each series | L24; L21 |
| Subordinated noteholders | Junior in payment | None | Subject to payment blockage | Majority provisions not read | L29 |
| Securitization lenders | Structurally senior on receivables | Domestic receivables | Facility terms not supplied | Not established | L04 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Subordinated payment blockage | Up to 179 days; one period per 360 days; at least 181 days without blockage | Non-payment default on Designated Senior Debt and blockage notice | Representative of Designated Senior Debt | Subordinated noteholders | Junior cash stops while seniors decide | Negative — Liquidity Deterioration | L29 |
| Financial covenant default | No fixed period: term-lender default arises only after revolver acceleration | Net leverage above 7.50x with usage above 40% | Required Revolving Lenders | Term lenders | Term lenders wait on revolving lenders | Negative — Covenant Erosion | L17 |
| First-lien enforcement between loans and notes | [Insufficient Information] — intercreditor agreement not in the source set | [Insufficient Information] — intercreditor agreement not in the source set | [Insufficient Information] — intercreditor agreement not in the source set | Secured noteholders and lenders | Control split unknown | Insufficient Information | L21 |
| Cash collateral and junior payment stop | Not stated | Credit agreement event of default | Lenders and secured noteholders | Subordinated noteholders | Seniors may proceed against cash and stop note debt service | Negative — Liquidity Deterioration | L03 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| 2033 note collateral release | [Insufficient Information] — intercreditor agreement not in the source set | Loan collateral agent release drags note liens; majority of holders | [Insufficient Information] — intercreditor agreement not in the source set | Not on discharge in full in cash outside enforcement | Each holder must consent to adverse ranking change | L25; L24 |
| Credit agreement release | [Insufficient Information] — intercreditor agreement not in the source set | Automatic on permitted disposal; each lender for substantially all collateral | [Insufficient Information] — intercreditor agreement not in the source set | Disposal permitted by the agreement | Material guarantor release needs each lender | L18 |
| Subordinated turnover | [Insufficient Information] — subordination turnover clause not read | Not applicable: unsecured | Not established | Not established | Blockage capped at 179 days | L29 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Lenders | Direct enforcement through agent | Pari incremental dilution | Moderate | Shared pool grows | Negative — Leverage Increase | L12; L17 |
| Secured noteholders | Share pool through intercreditor agreement | Release follows loan agent | High | Collateral lost without note vote | Negative — Covenant Erosion | L25 |
| Subordinated noteholders | Residual after all senior | Blockage and structural subordination | High | Payment stop and value behind seniors | Negative — Liquidity Deterioration | L29; L01 |

### T4F.6 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Executed agreement and six joinders | Controlling party, standstill, turnover, purchase options | Enforcement and release cells unresolved | Obtain agreement |
| Subordination article | Full turnover and acceleration clauses | Junior recovery mechanics | Turnover not established | Read full article |
| Voting thresholds | Required Lenders percentage | Control weight | Voting weight partly established | Read definition |

### T4C.2 Source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended | Credit agreement | 2024-09-19 | Executed | Legal Formula | Ratio and basket formulas | L07; L15 |
| 1 | 2033 and 2027 indentures | Indentures | 2024-09-19; 2019-11-13 | Executed | Legal Formula | Note ratio gates | L22; L27 |
| 3 | Compliance certificates | Certificate | Not supplied | [Insufficient Information] — compliance certificates not in the source set | Usage | Tested ratios | L34 |
| 4 | Financial foundation | Financial analysis | As of 2024-09-30 | Accepted | Financial Input | Debt, cash, EBITDA proxies | L31 |
| 4 | Annual report 2024 | Filing | 2024-11-07 | Filed | Financial Input | Revolver usage, compliance | L02; L03 |

### T4C.3 Definition register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Total indebtedness less Unrestricted Cash over LTM EBITDA, pro forma | Covenant debt, Unrestricted Cash, Consolidated EBITDA | Gates payments at 6.75x, debt at 7.25x | Cash netting and pro forma inflate | Negative — Covenant Erosion | L07 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured indebtedness less Unrestricted Cash over LTM EBITDA | Secured debt, cash, EBITDA | Gates pari secured debt at 5.00x | Same | Negative — Leverage Increase | L07 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Net income plus tax, interest, non-cash, unusual, transaction, incentive, dividend-equivalent costs and uncapped projected savings | Certificate bridge | Maintenance denominator | Uncapped savings | Negative — Covenant Erosion | L08 |
| Consolidated EBITDA | Credit agreement definitions | Similar with other cost savings capped at 25% | Certificate bridge | Grower baskets and incurrence | Capped savings | Negative — Covenant Erosion | L06 |
| Unrestricted Cash | Credit agreement definitions | Unencumbered cash of Holdings, borrower and restricted subsidiaries | Cash by entity | Full netting | Cash spent after test | Negative — Liquidity Deterioration | L11 |
| Consolidated Fixed Charge Coverage Ratio | 2027 indenture | EBITDA over fixed charges, pro forma | Fixed charges | Payments and ratio debt at 2.0x | Loose gate | Negative — Covenant Erosion | L27; L28 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver springing net leverage, year-end proxy | max-ratio | 7.50x | 4.46x | Net debt over EBITDA As Defined | 3.04x | Compliant | Proxy; covenant EBITDA not supplied; applies only above 40% usage | Breach would stop revolver access | Neutral — Stable | L16; L31 |
| Revolver springing net leverage, post-dividend proxy | max-ratio | 7.50x | 6.02x | Pro forma net debt over reported EBITDA | 1.48x | Compliant | Conservative proxy after 2024-10-18 dividend | Cushion halves after recap | Negative — Leverage Increase | L16; L31 |
| Revolver usage trigger | max-ratio | 40.00% | 7.36% | Revolving exposure over commitments | 32.64% | Compliant | Cash collateralisation of letters not stated | Usage controls whether test applies | Neutral — Stable | L16; L02 |
| Revolver draw condition | max-ratio | 35.00% | 7.36% | Revolving exposure over commitments | 27.64% | Compliant | Same | Draws above this need ratio compliance | Neutral — Stable | L13; L02 |
| Restricted payments ratio gate | max-ratio | 6.75x | 6.02x | Pro forma net debt over reported EBITDA | 0.73x | Compliant | Conservative proxy | Remaining recap room | Negative — Leverage Increase | L15; L31 |
| Net leverage incurrence | max-ratio | 7.25x | 6.02x | Pro forma net debt over reported EBITDA | 1.23x | Compliant | Conservative proxy | Junior and unsecured debt room | Negative — Leverage Increase | L09; L12 |
| Secured net leverage, credit agreement | max-ratio | 5.00x | 3.22x | Secured principal less year-end cash over EBITDA As Defined | 1.78x | Compliant | Year-end only; dividend removed netting cash equal to 1.04x | Pari secured dilution room | Negative — Leverage Increase | L09; L12; L31 |
| Secured net leverage, 2033 notes | max-ratio | 5.25x | 3.22x | Same proxy | 2.03x | Compliant | Same | Note lien room | Negative — Leverage Increase | L22 |
| Fixed-charge coverage, 2027 notes | min-ratio | 2.00x | 3.35x | EBITDA As Defined over net interest excluding cost amortization | 1.35x | Compliant | Not pro forma for September financings | Payment gate under notes | Negative — Covenant Erosion | L27; L31 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Restricted payment capacity | Ratio basket | Unlimited if net leverage at most 6.75x | No default | Proxy 6.02x | October dividend of USD 4,348 million; classification not disclosed | Ratio-limited, unlimited in amount | Not calculable: covenant EBITDA and indebtedness not supplied | Formula Extracted Only | High | Recap capacity | Negative — Leverage Increase | L15 |
| Restricted payment capacity | General basket | Greater of USD 75 million and 3.0% Consolidated EBITDA | No default | Covenant EBITDA not supplied | Not supplied: no tracker | At least USD 75 million | Not calculable: usage not supplied | Formula Extracted Only | Low | Small leakage | Neutral — Stable | L15 |
| Incremental facility capacity | Incremental loans | Net leverage at most 7.25x and secured at most 5.00x | Lender commitment, no default | Proxies 6.02x and 3.22x | Tranche L USD 1,500 million used | Ratio-limited | Not calculable: covenant inputs not supplied | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | L12; L05 |
| Debt incurrence capacity | General debt | Greater of USD 250 million and 10% Consolidated EBITDA | None | Covenant EBITDA not supplied | Not supplied: no tracker | At least USD 250 million | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Free-and-clear debt | Negative — Leverage Increase | L09 |
| Debt incurrence capacity | Foreign subsidiary debt | Greater of USD 450 million and 18% Consolidated EBITDA | None | Covenant EBITDA not supplied | Not supplied: no tracker | At least USD 450 million | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | L09 |
| Debt incurrence capacity | Securitization | Greater of USD 725 million and 20% Consolidated EBITDA | Non-recourse | USD 650 million facility | USD 487.5 million at year end; USD 650 million after 2024-10-16 | At least USD 725 million | At least USD 75 million after October draw | Ready with Limitations | Moderate | Receivables removed from pool | Negative — Liquidity Deterioration | L09; L04 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries | Greater of USD 250 million and 10% Consolidated EBITDA | Only new subsidiaries designable | None identified | Not supplied: no tracker | At least USD 250 million | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Value outside guarantees | Negative — Covenant Erosion | L10; L11 |
| Investment capacity | General investments | Greater of USD 500 million and 25% Total Assets | None | Total Assets definition not read | Not supplied: no tracker | At least USD 500 million | Not calculable: usage not supplied | Formula Extracted Only | High | Transfer to non-guarantors | Negative — Covenant Erosion | L10 |
| Investment capacity | Ratio investments | Unlimited at net leverage at most 5.75x | No revolver loans; USD 200 million Unrestricted Cash | Proxy availability not established | Not supplied: no tracker | Ratio-limited | Not calculable: covenant inputs not supplied | Formula Extracted Only | High | Unlimited transfer when deleveraged | Negative — Covenant Erosion | L10 |
| Investment capacity | Joint ventures | Greater of USD 1,000 million and 40% Consolidated EBITDA | Net leverage at most 7.00x | Covenant inputs not supplied | Not supplied: no tracker | At least USD 1,000 million | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Assets leave collateral | Negative — Covenant Erosion | L10 |
| Asset transfer capacity | Asset sales | Fair value; 75% cash above USD 50 million; non-cash up to USD 300 million | Proceeds under prepayment section | Not supplied: no disposals tracked | Not supplied: no tracker | Bounded | Not calculable: usage not supplied | Formula Extracted Only | Low | Bounded leakage | Neutral — Stable | L15 |
| Guarantor / collateral release capacity | Release mechanics | Automatic on permitted disposal; each lender for substantially all | Agreement compliance | Not applicable: provision-based | Not supplied: no release history | Provision-based | Not calculable: no release record | Formula Extracted Only | Moderate | Notes follow loan release | Negative — Covenant Erosion | L18; L25 |

Baskets are recorded separately and not summed: the credit agreement lets the borrower divide and reclassify an item of debt across categories, so capacity routes overlap.
Basis: d887611dex101.htm.jsonl, page 61

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental and ratio debt | Secured net leverage at most 5.00x loans, 5.25x notes | Proxy cushion 1.78x and 2.03x at year end | Dilutes shared first-lien pool | Moderate | High for first lien | First-lien instruments lose relative protection | L09; L12; L22 |
| Junior and unsecured ratio debt | Net leverage at most 7.25x | Proxy cushion 1.23x after dividend | Layers claims ahead of equity, behind first lien | Moderate | Moderate for subordinated notes | Subordinated notes diluted by pari junior debt | L09 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% EBITDA | Usage not established | Structurally senior on foreign value | Low | Moderate | All notes | L09 |
| Securitization | Greater of USD 725 million and 20% EBITDA | Facility fully drawn after 2024-10-16 | Removes receivables from pool | Low | Moderate | First lien | L09; L04 |
| Lien subordination by amendment | Not expressly barred in clauses read | Theoretical | Uptier | Low | High if used | Term loans | L18 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Special dividends | USD 4,348 million paid 2024-10-18 | Ratio basket 6.75x or 60-day declaration safe harbour | Remaining not calculable; proxy cushion 0.73x | Cash leaves group | High | Negative — Leverage Increase | L15; L04 |
| Dividend equivalents and management repurchases | Annual basket with carry-forward | Lesser of greater of USD 50 million and 2.0% EBITDA plus carry-forward, and greater of USD 100 million and 4.0% EBITDA | Not calculable: usage not supplied | Cash to option holders | Moderate | Negative — Liquidity Deterioration | L15 |
| Investments in non-guarantors | Multiple baskets | General, ratio and joint-venture baskets | Not calculable: usage not supplied | Value outside guarantees | High | Negative — Covenant Erosion | L10 |
| Unrestricted subsidiaries | Only new subsidiaries | Greater of USD 250 million and 10% EBITDA | Not calculable: usage not supplied | Outside restricted group | Moderate | Negative — Covenant Erosion | L10; L11 |

### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings, maintenance EBITDA | Financial Covenant Consolidated EBITDA clause n | No cap; 24 months | Not calculable: certificate not supplied | Raises denominator of maintenance test | Delays default; PD signal weaker | L08 |
| Projected cost savings, incurrence EBITDA | Consolidated EBITDA clause m | 25% of Consolidated EBITDA | Not calculable: certificate not supplied | Raises debt and payment capacity | More leverage; higher LGD | L06 |
| Incentive bonus and dividend equivalents | Financial Covenant Consolidated EBITDA clauses j and m | None stated | Not calculable: certificate not supplied | Recurring compensation excluded | Overstates cushion versus supported-only USD 3,813 million | L08; L32 |
| Transaction and refinancing costs | Clause e | None stated | Not calculable: certificate not supplied | Recurring costs added back | Earnings quality finds these recurring | L08; L32 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio-based unlimited payments | 6.75x gate; demonstrated recap | Repeat recaps | High | High | Not addressed: routing is set by the orchestrator | L15 |
| Basket reclassification | Borrower may divide and classify debt | Capacity overlaps | Moderate | High | Not addressed: routing is set by the orchestrator | L09 |
| Note release follows loans | Automatic release clause | Collateral loss | High | Medium | Not addressed: routing is set by the orchestrator | L25 |
| Uncapped savings in maintenance EBITDA | Clause n | Ratio inflation | Moderate | High | Not addressed: routing is set by the orchestrator | L08 |
| Non-pro-rata class offers | Amendment proviso | Liability management | Moderate | Medium | Not addressed: routing is set by the orchestrator | L18 |

### T4C.11 Capacity risk prioritization matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured ratio and incremental debt | High | Moderate | First-lien dilution | Moderate | High | Track joinders and secured net leverage | L09; L12 |
| 2 | Restricted payments ratio basket | High | Moderate | Debt-funded recap | High | Moderate | Track declarations | L15 |
| 3 | Investments in non-guarantors | High | Low | Structural stranding | Low | High | Track guarantor sales share | L10 |
| 4 | Covenant EBITDA add-backs | Moderate | Formula Only | Ratio inflation | Moderate | Low | Obtain certificate bridge | L08 |
| 5 | Amendment and release mechanics | Moderate | Low | Lender-control loss | Low | High | Track amendment filings | L18; L25 |

### T4C.12 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Tested ratios | Exact headroom | Proxies only | Obtain quarterly certificate |
| Covenant EBITDA bridge | Covenant EBITDA | Ratio capacity reliability | Proxies on issuer measures | Obtain bridge |
| Basket usage tracker | Usage by basket | Remaining capacity | Not calculable | Obtain tracker |
| Covenant debt definition | Consolidated Total Indebtedness text | Numerator basis | Principal proxy | Read definition |
| Total Assets definition | Total Assets | General investment basket | Floor only | Read definition |

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package based on unlimited ratio-based distributions, ratio-based pari secured incurrence and maintenance EBITDA with uncapped projected savings. The main creditor protections are each-lender consent over pro rata sharing and wholesale collateral release, restrictions on designating existing subsidiaries unrestricted and contractual subordination of the junior notes; the main weaknesses are the revolver-only springing test, note collateral release that follows the loan agent and broad investment capacity into non-guarantors. The primary default-risk path is releveraging through recaps up to the payment gate with no early covenant trigger; the primary recovery path is first-lien dilution and value transfer outside the guarantor group. For security selection the key legal consideration is the gap between loan and note control over collateral release. Further analysis requires the intercreditor agreement, collateral agreement, other indentures and compliance certificates. Legal & covenants completed with limitations; covenant aggressiveness four on the scale, provisional.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 136–137; d826058dex41.htm.jsonl, page 107

Overall, TransDigm has limited covenant-capacity visibility. The main capacity concern is pari secured ratio debt, because it dilutes the shared first-lien pool and is the tightest gate once netting cash leaves; exact headroom is not supported without the compliance certificate and covenant EBITDA.
Basis: d887611dex101.htm.jsonl, page 146; calculation K02; calculation K08

### Verification

| Register | Present | Columns complete | Minimum rows met | Figures traced |
|---|---|---|---|---|
| T4F.1 to T4F.6 | PASS | PASS | PASS | PASS, missing intercreditor terms marked |
| T4D.1 to T4D.8 | PASS | PASS | PASS | PASS, undisclosed values marked |
| T4C.2 to T4C.12 | PASS | PASS | PASS | PASS, proxies labelled |
| T4.2 to T4.13 | PASS | PASS | PASS | PASS |

### Material claim lineage

| Claim | Material claim | Strongest lineage |
|---|---|---|
| 1 | Unlimited payments at 6.75x | Directly Sourced |
| 2 | Notes payments at 2.0x coverage | Directly Sourced |
| 3 | Springing 7.50x test above 40% usage | Directly Sourced |
| 4 | Term-lender default only after revolver acceleration | Directly Sourced |
| 5 | Secured ratio debt at 5.00x and 5.25x | Directly Sourced |
| 6 | Incremental at 7.25x and 5.00x | Directly Sourced |
| 7 | Uncapped projected savings in maintenance EBITDA | Directly Sourced |
| 8 | 25% cap in incurrence EBITDA | Directly Sourced |
| 9 | Each-lender sacred rights | Directly Sourced |
| 10 | Note release follows loan agent | Directly Sourced |
| 11 | 179-day blockage | Directly Sourced |
| 12 | Only new subsidiaries designable | Directly Sourced |
| 13 | New York governing law | Directly Sourced |
| 14 | Recap debt certified within ratios | Directly Sourced |
| 15 | Ratio proxies | Calculated |
| 16 | Revolver usage 7.36% | Calculated |
| 17 | Non-guarantor sales share | Calculated |
| 18 | Dividend cash relative to EBITDA | Calculated |
| 19 | Fixed-charge proxy | Calculated |
| 20 | Secured releveraging is nearest pressure point | Analyst Inference |
| 21 | Overall aggressive score | Analyst Inference |
| 22 | Priming theoretical | Analyst Inference |
| 23 | Loan test binding over note test | Analyst Inference |
| 24 | Two-quarter versus four-quarter step-up wording | Conflicting |
| 25 | Intercreditor control | Insufficient Information |
| 26 | Remaining basket capacity | Insufficient Information |
| 27 | Other note series terms | Insufficient Information |
| 28 | Tested covenant ratios | Insufficient Information |

## Calculations

All amounts are USD millions for the consolidated group unless stated; ratios are times or percent as shown. Proxies use issuer-reported measures, not covenant definitions.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | 2024-09-30 secured principal | 8702 + 2100 + 2750 + 1450 + 1000 + 2200 + 1500 | 19702 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| K02 | 2024-09-30 secured net leverage proxy | 19702 − 6261 = 13441; 13441 / 4173 | 3.2209441648693985142583273424394919722, shown 3.22x | x | Financial foundation (CP-1); calculation K01 |
| K03 | FY2024 fixed-charge proxy | 4173 / 1246 | 3.3491171749598715890850722311396468700, shown 3.35x | x | Financial foundation (CP-1) |
| K04 | 2024-09-30 revolver usage | 67 / 910 | 0.073626373626373626373626373626373626374, shown 7.36% | fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K05 | Springing trigger | 0.40 × 910 = 364.00; 364 − 67 | 364.00; room 297 | USD millions | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K06 | Draw condition | 0.35 × 910 = 318.50; 318.50 − 67 | 318.50; room 251.50 | USD millions | d887611dex101.htm.jsonl, page 165 |
| K07 | Headroom on proxies | 7.50 − 4.46 = 3.04; 7.50 − 6.02 = 1.48; 7.25 − 6.02 = 1.23; 6.75 − 6.02 = 0.73; 6.75 − 4.46 = 2.29; 7.25 − 4.46 = 2.79; 5.00 − 3.22 = 1.78; 5.25 − 3.22 = 2.03; 3.35 − 2.00 = 1.35; 40.00 − 7.36 = 32.64; 35.00 − 7.36 = 27.64 | As listed | x; % | Financial foundation (CP-1); calculation K02; calculation K03; calculation K04 |
| K08 | October dividend cash relative to EBITDA As Defined | 4348 / 4173 | 1.0419362568895279175653007428708363288, shown 1.04x | x | Financial foundation (CP-1) |
| K09 | FY2024 guarantor-group sales share | 7940 − 6294 = 1646; 1646 / 7940; 6294 / 7940 | 1646; 0.20730478589420654911838790931989924433, shown 20.73%; 0.79269521410579345088161209068010075567, shown 79.27% | USD millions; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K10 | Note aggregates | 2100 + 2750 + 1450 + 1000 + 2200; 1200 + 750 | 9500; 1950 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |

Inherited figures used without recalculation: net debt over EBITDA As Defined of 4.46x at year end, and the post-dividend pro forma net leverage of 6.02x on reported EBITDA with pro forma net debt of USD 22,967 million against year-end net debt of USD 18,619 million, both after the 18 October 2024 dividend. The 16 October 2024 securitization draw leaves pro forma net debt at USD 18,619 million and net leverage at 4.88x. A pro forma net leverage on EBITDA As Defined is not established by Financial foundation and is not worked out here.
Basis: Financial foundation (CP-1)

## Gaps

| Gap | Severity | What is missing | Effect on conclusions | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement dated 2019-02-13 and joinders | Enforcement control, turnover and purchase options between loans and notes not established | d887611dex41.htm.jsonl, page 30 |
| Compliance and covenant EBITDA | MATERIAL | Quarterly certificates, covenant EBITDA bridge, covenant debt | All headroom is proxy; exact capacity not calculable | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Other indentures and collateral agreement | MATERIAL | Indentures for 2028–2032 secured notes and 2029 subordinated notes; Guarantee and Collateral Agreement | Note-level terms and excluded assets extrapolated | Source readiness (CP-0) |
| Basket usage | MINOR | Usage trackers | Remaining fixed and grower capacity not established | Source readiness (CP-0) |
| Full amendment and subordination clauses | MINOR | Unread consent and turnover wording | Priming and turnover remain theoretical or unresolved | d887611dex101.htm.jsonl, pages 204–206; d826058dex41.htm.jsonl, page 107 |
| Market-norm comparator | MINOR | Covenant-review report | No market-norm conclusion | Source readiness (CP-0) |

A fixed post-default deadline under the payment blockage depends on the date a blockage notice is received, which no source establishes; it runs at most 179 days from receipt.

## Next module
The orchestrator selects the next module.
