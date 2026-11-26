---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-4
module_name: LegalCovenantInterpreter
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-opus-high
pathway: deep_credit_assessment
module_status: Completed with Limitations
committee_status: Requires More Work
---

## Request
Legal and covenant review of TransDigm Group Incorporated (holdings) and its borrower and note issuer TransDigm Inc., as of 2024-09-30, on the deep credit assessment pathway. Scope covers the covenant package, covenant capacity and headroom, the restricted-group and guarantee map, and intercreditor control, read from the executed documents supplied.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement, with the annexed amended credit agreement text | 2024-09-19, agreement date; publication not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement provisions: financial covenant, draw condition, EBITDA, debt and cash definitions, debt, investment and restricted-payment baskets, incremental and MFN terms, unrestricted subsidiaries, collateral further assurances, Events of Default, amendments, governing law |
| d887611dex41.htm.jsonl | Execution-version indenture for the 6.000% senior secured notes due 2033 | 2024-09-19, indenture date; publication not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note restricted payments, ratio debt, covenant suspension, first-lien intercreditor agreement identification and joinders, initial redemption date |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date per Source readiness; publication not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordinated-note payment blockage, ratio debt and restricted-payment ratio tests (search excerpts) |
| d833756dex101.htm.jsonl | Execution-version Amendment No. 16, loan modification and refinancing facility agreement | 2024-06-04, agreement date; publication not stated | 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac | Registered in the credit-agreement chain only; superseded on covenant text by the September 2024 annexed agreement; not read |
| d739389dex101.htm.jsonl | Execution-version amendment and restatement agreement with the second restated credit agreement | 2014-06-04, agreement date; publication not stated | 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547 | Registered as the base agreement in the chain only; not read |
| d496141dex101.htm.jsonl | Amendment and restatement agreement involving TransDigm Inc. and TransDigm Group Incorporated | 2013-02-28, agreement date; publication not stated | f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3 | Registered as historical chain only; not read |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer covenant summary, springing-covenant usage trigger, compliance statement, letters of credit, guarantor scope and obligor-group summary financials, term-loan tranches |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source inventory, document dates, retrospective boundary, legal-coverage gaps, market-sheet conflict |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying and principal debt, instrument terms, EBITDA measures, leverage and the post-balance-sheet dividend adjustment |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Ownership, September 2024 dividend recapitalisation and its financing, subsequent payment dates |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Supported-only versus issuer-adjusted EBITDA, used only to contrast with contractual add-backs |

## Findings

### Bottom line
Creditor protection rests on incurrence ratio gates rather than maintenance discipline: the credit agreement permits unlimited dividends at or below 6.75x pro forma net leverage and pari first-lien debt up to 5.00x secured net leverage, so a repeat debt-funded distribution needs no lender consent. The only maintenance test is a springing 7.50x net leverage covenant for revolving lenders, dormant at year-end because letters of credit of USD 67 million sat far below the USD 364 million usage trigger. Covenant earnings add back stock compensation, dividend equivalents and recapitalisation costs, and projected savings without a cap for the maintenance test, so capacity grows with adjusted rather than reported earnings.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 41–42; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K02

Recovery protections are real but incomplete. Secured lenders and secured noteholders share first-lien collateral, pro rata sharing and release of all or substantially all collateral are sacred rights, and USD 4,600 million of subordinated notes absorb losses first. Against that, non-guarantor subsidiaries generated 20.73% of FY2024 sales, and the first-lien intercreditor agreement itself is not in the documents reviewed, so enforcement control is not established.
Basis: d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, page 30; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K09; calculation K12

### Key findings
- **Shareholder leakage is the binding legal risk, and it has already been used.** Outside fixed baskets, the credit agreement allows any restricted payment with no default and pro forma net leverage at or below 6.75x; the 2033 secured notes and 2027 subordinated notes allow any restricted payment while fixed-charge cover exceeds 2.0x, so the credit agreement is the operative constraint. The USD 4,348 million special dividend paid on 18 October 2024 shows the capacity is used at scale. On the most conservative earnings base in Financial foundation, net leverage of 4.88x at year-end becomes 6.02x pro forma for that dividend, still 0.73x inside the gate; that figure is not the covenant ratio, which uses broader earnings and principal debt, so the true covenant headroom is not established.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex41.htm.jsonl, pages 74–75; Financial foundation (CP-1); Business & governance (CP-1A); calculation K14
- **Debt capacity can dilute existing first-lien lenders with weak economic protection.** Pari secured debt is permitted to 5.00x secured net leverage and junior or unsecured debt to 7.25x net leverage, cash netting is uncapped, and the agent may add new pari or junior secured debt to the collateral and intercreditor arrangements without any lender consent. The 50 bp yield protection applies only to incremental term loans under the credit agreement, falls away 18 months after each tranche's amendment and excludes acquisition debt and debt maturing well after the tranche, so pari secured notes carry no pricing protection for term lenders.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, pages 144–146; d887611dex101.htm.jsonl, page 205
- **The maintenance covenant protects only revolving lenders and only late.** The 7.50x test (8.00x for four quarters after a material acquisition) applies only when revolver exposure exceeds 40% of commitments; term lenders gain a default only after revolving lenders terminate or accelerate. The tighter practical constraint is the borrowing condition: a draw taking exposure above 35% of commitments, USD 318.5 million, requires the leverage ratio to be met, leaving USD 251.5 million of draw room before the test bites.
Basis: d887611dex101.htm.jsonl, page 165; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; calculation K03; calculation K05
- **Contractual earnings definitions accept the add-backs that the earnings-quality review rejected.** Covenant net income excludes non-cash and deferred compensation and acquisition integration costs, and covenant EBITDA adds back recapitalisation and debt-incurrence expenses, dividend equivalents and projected savings; savings are capped at 25% for incurrence and restricted-payment tests but uncapped for the maintenance covenant. Most grower baskets exceed their fixed floors once covenant EBITDA passes USD 2,500 million, so baskets expand with every add-back; issuer EBITDA As Defined was USD 4,173 million against a supported-only USD 3,813 million.
Basis: d887611dex101.htm.jsonl, pages 23–26; d887611dex101.htm.jsonl, pages 41–42; Earnings quality (CP-1D); calculation K13
- **Structural subordination is moderate but carries permitted senior debt.** Holdings, the borrower, TransDigm UK and domestic restricted subsidiaries guarantee; foreign subsidiaries outside TransDigm UK do not, and only 65% of first-tier foreign voting equity is pledged. Non-guarantors produced USD 1,646 million of FY2024 sales and may borrow at least USD 450 million ahead of group creditors, while the receivables securitization may reach at least USD 725 million.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 173–174; calculation K08
- **Amendment control is majority-led with gaps in anti-priming protection.** Sacred rights cover economics, pro rata sharing, voting thresholds, release of a material guarantor and release of substantially all collateral, but the text reviewed does not list subordination of the loans' lien or payment priority; majority lenders can also permit non-pro-rata prepayments offered to all lenders of a class. Uptier exposure is therefore a theoretical, contested capacity rather than a demonstrated one.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex101.htm.jsonl, page 147

### Ratio gates against analytical leverage
The table shows how far conservative analytical leverage sits from each ratio gate; it is context, not a covenant calculation, because covenant earnings and covenant debt are not disclosed.

| Gate | Threshold | Analytical reference | Gap | Reading | Source |
|---|---|---|---|---|---|
| Year-end reference before the October 2024 dividend | Not applicable: reference row | 4.88x | Not applicable: reference row | Pre-payment level; 6.02x pro forma after the 18 October 2024 dividend | Financial foundation (CP-1) |
| Indenture fixed-charge cover gate | 2.0x | 3.29x net cash interest cover, reported EBITDA | Not calculated: not the covenant fixed-charge ratio | Cover appears comfortably above the gate; covenant ratio not established | d887611dex41.htm.jsonl, page 75; Financial foundation (CP-1) |
| Unlimited restricted payments, credit agreement | 6.75x | 6.02x pro forma after 18 October 2024 dividend, reported EBITDA | 0.73x inside | Gate likely open; covenant ratio not established | d887611dex101.htm.jsonl, page 181; Financial foundation (CP-1); calculation K14 |
| Incremental, junior-lien and unsecured debt | 7.25x | 6.02x pro forma, reported EBITDA | 1.23x inside | Further junior or unsecured debt likely permitted | d887611dex101.htm.jsonl, pages 59–60; Financial foundation (CP-1); calculation K15 |
| Unlimited investments (also needs no revolver loans and USD 200 million cash) | 5.75x | 6.02x pro forma, reported EBITDA | 0.27x above | Gate may be closed on this basis; broader covenant earnings could reopen it | d887611dex101.htm.jsonl, page 63; Financial foundation (CP-1); calculation K16 |
| Pari secured debt and incremental | 5.00x secured net | Not supplied: secured net leverage not stated by Financial foundation | Not supplied: no reference ratio | Not established | d887611dex101.htm.jsonl, page 59 |

### Contrary evidence and what would change the view
The strongest case against an aggressive reading is that every material permission is gated by a ratio test that must be met at the time of use, the restricted-payment gate at 6.75x is tighter than the 7.25x debt gate, pro rata sharing changes need every lender, release of a material guarantor or substantially all collateral needs every lender, and cross-default to any USD 50 million debt plus a 30-day grace period limits creeping default. The secured debt is a single first-lien class with equal payment rank, so there is no existing priming layer, and Financial foundation's net cash interest cover of 3.29x sits well above the 2.0x indenture tests. The view would soften if a compliance certificate showed covenant net leverage close to 6.75x, which would shut the unlimited-dividend route, or if the intercreditor agreement and the full amendment clause showed lien-subordination protection. It would harden if a further dividend or pari secured issue followed the October 2024 payment, or if the issuer designated an unrestricted subsidiary or moved material assets to non-guarantors.
Basis: d887611dex101.htm.jsonl, pages 189–191; d887611dex101.htm.jsonl, pages 204–205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; Financial foundation (CP-1)

### Limitations
- No compliance certificate or covenant EBITDA figure was supplied, so every ratio-test headroom except the revolver usage trigger is not established; the leakage conclusion rests on thresholds and conservative analytical leverage, and actual covenant capacity is probably larger than the analytical gaps shown.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, pages 41–42
- The first-lien intercreditor agreement is identified but not supplied, so who controls enforcement between credit-agreement lenders and secured noteholders, any standstill and turnover are not established; the intercreditor conclusions are limited to equal payment rank and shared collateral.
Basis: d887611dex41.htm.jsonl, page 30
- The guarantee and collateral agreement and the security documents are not supplied, so the collateral package, excluded assets and guarantor release triggers come only from credit-agreement covenants; the collateral and structural maps are partial and recovery access is qualitative only.
Basis: d887611dex101.htm.jsonl, pages 173–174; d887611dex101.htm.jsonl, page 206
- No basket-usage record exists, so remaining capacity in every fixed and grower basket is not calculable; capacity is stated as formulas and fixed floors, which understates neither nor proves unused room.
Basis: d887611dex101.htm.jsonl, pages 59–63
- Indentures for the 2028 to 2032 secured notes and the 2029 subordinated notes are not supplied, so their covenants are inferred only from the annual report's statement that they resemble the credit agreement; any looser terms in those notes would widen the leakage conclusion.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–61
- The definition of required lenders and the remainder of the amendment clause were not read, so the uptier view stays theoretical; a lien-subordination sacred right elsewhere in the agreement would remove it.
Basis: d887611dex101.htm.jsonl, pages 204–206

### Nearest pressure point
The nearest pressure point is restricted-payment capacity under the 6.75x net leverage gate, ranked above maintenance headroom because the maintenance covenant is dormant. Evidence: the gate permits unlimited distributions with no default, covenant earnings carry broad add-backs, and the issuer paid USD 4,348 million in October 2024 after borrowing USD 3,000 million of new secured debt. A further distribution funded by pari secured debt within the 5.00x secured gate would raise leverage without adding earnings, raising default probability and diluting first-lien recovery. Monitor quarterly covenant-ratio disclosure, dividend declarations, new secured note or incremental term loan issuance and the size of add-backs. Tightening the view needs the latest compliance certificate with covenant EBITDA and net debt.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 59; Business & governance (CP-1A)

### Overall legal credit view
Overall, TransDigm Group Incorporated presents an aggressive covenant package, scored 4/5 on a provisional basis, because maintenance protection is springing and revolver-only, leakage and pari debt are ratio-gated without fixed caps, and covenant earnings carry broad add-backs. The main creditor protections are the 6.75x restricted-payment gate, the 5.00x secured gate, sacred rights over pro rata sharing and collateral release, a single first-lien class and contractual subordination of the subordinated notes. The primary default-risk path is releveraging through distributions and pari debt while earnings are flat; the primary recovery path is dilution of first-lien collateral by additional pari debt and value held at non-guarantors. For security selection the most important legal consideration is that secured notes and loans rank equally while term lenders carry the MFN only on incremental loans. Further analysis requires the intercreditor agreement, collateral documents, the other indentures and a compliance certificate. Legal and covenant review completed with limitations; covenant aggressiveness 4/5, provisional; key gaps are the intercreditor agreement, security documents, compliance certificate and other indentures.
Basis: d887611dex101.htm.jsonl, pages 59–63; d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, page 30

### Overall covenant capacity view
Overall, TransDigm has limited covenant-capacity visibility. The main capacity concern is unlimited restricted payments at or below 6.75x, because broad add-backs and uncapped cash netting widen the room and a used dividend route converts it into higher leverage. Exact headroom is supported only for the revolver usage trigger, at USD 297 million below the 40% level. Further analysis requires covenant EBITDA, covenant net debt and basket usage.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, pages 26–28; calculation K04

### Overall structural view
The worst open route is restricted-payment and investment leakage from the restricted group: general investments of at least USD 500 million or 25% of total assets, unrestricted-subsidiary investments of at least USD 250 million and unlimited investments below 5.75x can move value outside guarantor reach. The main structural gap is the non-guarantor foreign perimeter, which produced 20.73% of sales and can borrow ahead of group creditors. Secured loans and secured notes rank first against guarantor value; subordinated notes rank behind them and behind non-guarantor creditors. The structural map is completed with limitations because security documents and subsidiary schedules are missing.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K09

### Intercreditor view
Enforcement control between secured lenders and secured noteholders is not established because the first-lien intercreditor agreement is not supplied; an unexamined intercreditor agreement is not a benign one. Subordinated noteholders face a payment blockage of up to 179 days in any 360 days at the election of designated senior debt, which delays their recovery path in a default without changing secured priority.
Basis: d887611dex41.htm.jsonl, page 30; d826058dex41.htm.jsonl, page 107

### Capital structure

| Instrument | Principal | Rank and security | Obligors and guarantors | Maturity | Governing document reviewed | Source |
|---|---|---|---|---|---|---|
| Revolving credit facility | USD 910 million commitments; USD 67 million letters of credit; USD 843 million available | Senior secured first lien | TransDigm Inc. borrower; Holdings and subsidiary Loan Parties | 2029-02-27 | Credit agreement as amended September 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K, L | USD 8,702 million | Senior secured first lien; pari with secured notes | TransDigm Inc. borrower; Holdings and subsidiary Loan Parties | 2028-08-24 to 2032-01-19 | Credit agreement as amended September 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Secured notes 2028, 2029, 2030, 2031, 2032 | USD 9,500 million | Senior secured first lien; equal payment rank | TransDigm Inc. issuer; TD Group, TransDigm UK (2028 notes) and domestic restricted subsidiaries | 2028-08-15 to 2032-03-01 | Not supplied: indentures not in documents | Financial foundation (CP-1) |
| 2033 secured notes | USD 1,500 million | Senior secured first lien; equal payment rank | TransDigm Inc. issuer; TD Group and restricted subsidiaries that borrow or guarantee under the credit facilities or USD 200 million of capital markets debt | 2033-01-15 | 2033 secured notes indenture | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| 2027 subordinated notes | USD 2,650 million | Senior subordinated unsecured | TransDigm Inc. issuer; TD Group, TransDigm UK and domestic restricted subsidiaries, subordinated | 2027-11-15 | 2027 subordinated notes indenture | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 57 |
| January 2029 and May 2029 subordinated notes | USD 1,950 million | Senior subordinated unsecured | Same subordinated guarantor scope | 2029-01-15; 2029-05-01 | Not supplied: indentures not in documents | Financial foundation (CP-1) |
| Receivables securitization | USD 487.5 million drawn of USD 650 million | Non-recourse securitization entity; outside covenant total debt | Securitization entity, a non-guarantor | 2025-07-11 | Not supplied: facility agreement not in documents | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Finance leases | USD 262 million | Not established | Not established | Various | Not supplied | Financial foundation (CP-1) |

The secured-note principal for the 2028 to 2032 series sums the instrument amounts in Financial foundation of USD 2,100 million, USD 2,750 million, USD 1,450 million, USD 1,000 million and USD 2,200 million; total secured principal including the 2033 notes and term loans is USD 19,702 million.
Basis: Financial foundation (CP-1); calculation K11

### Covenant tests and headroom

| Test | Type | Threshold | Current | Headroom | Status | Source |
|---|---|---|---|---|---|---|
| Revolver usage trigger for the springing covenant | max-ratio | 40.00% of commitments (USD 364 million) | 7.36% (USD 67 million letters of credit) | 32.64% (USD 297 million) | Compliant; covenant not in force | d887611dex101.htm.jsonl, page 188; calculation K06 |
| Revolver draw condition | max-ratio | 35.00% of commitments (USD 318.5 million) | 7.36% | 27.64% (USD 251.5 million) | Compliant; leverage condition not engaged | d887611dex101.htm.jsonl, page 165; calculation K07 |
| Springing maximum net leverage | max-ratio | 7.50x (8.00x for four quarters after a material acquisition) | Not supplied: no compliance certificate | Not supplied: tested ratio not disclosed | Not Calculable; not in force | d887611dex101.htm.jsonl, page 188 |
| Unlimited restricted payments | max-ratio, incurrence | 6.75x | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 181 |
| Incremental facilities, junior and unsecured debt | max-ratio, incurrence | 7.25x | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, pages 59–60 and 146 |
| Pari secured debt and incremental facilities | max-ratio, incurrence | 5.00x secured net | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, pages 59 and 146 |
| Unlimited investments | max-ratio, incurrence | 5.75x | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 63 |
| Joint-venture investments | max-ratio, incurrence | 7.00x | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 62 |
| Indenture unlimited restricted payments and ratio debt | min-ratio, incurrence | 2.0x fixed-charge cover | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex41.htm.jsonl, page 75; d826058dex41.htm.jsonl, page 67 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for springing covenant | 40 | 7.36 | 32.64% of commitments | Passes at or below | % of aggregate revolving commitments | Credit agreement financial covenant applies only if exposure exceeds 40%; current uses USD 67 million letters of credit on USD 910 million commitments, assuming none is cash collateralized at 103% |
| Revolver draw condition | 35 | 7.36 | 27.64% of commitments | Passes at or below | % of aggregate revolving commitments | A draw above 35% requires the 7.50x ratio to be met for the latest quarter; same usage input and assumption |
| Springing maximum net leverage | 7.50 | Not supplied: no compliance certificate or covenant EBITDA disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Revolver-only covenant, dormant at year-end; issuer states compliance with all covenants at 30 September 2024 |
| Unlimited restricted payments gate | 6.75 | Not supplied: covenant net leverage not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence gate, not a maintenance test; analytical pro forma 6.02x on reported EBITDA is not the covenant ratio |
| Incremental, junior and unsecured debt gate | 7.25 | Not supplied: covenant net leverage not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence gate tested on each incurrence |
| Pari secured debt gate | 5.00 | Not supplied: covenant secured net leverage not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence gate tested on each incurrence |
| Unlimited investments gate | 5.75 | Not supplied: covenant net leverage not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Also needs no revolving loans and at least USD 200 million unrestricted cash |
| Indenture fixed-charge cover gate | 2.0 | Not supplied: covenant fixed-charge cover not disclosed | Not supplied: tested ratio not disclosed | Passes above | x | Restricted payments and ratio debt under the 2033 and 2027 indentures need cover above 2.0x |

Only the two usage rows are measured; every ratio row is a threshold without a disclosed covenant-basis current value, and none is a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | First Lien Intercreditor Agreement entered among the company, Holdings, subsidiary guarantors, credit agreement and notes collateral agents | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement and collateral sharing between secured lenders and secured noteholders; not supplied |
| 2020-04-08 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Joinder No. 1 to the First Lien Intercreditor Agreement | Historical — Joinder No. 1, dated as of April 8, 2020 | d887611dex41.htm.jsonl, page 30 | Adds a secured-debt party to the shared first-lien arrangement |
| 2023-02-24 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Joinder No. 2 to the First Lien Intercreditor Agreement | Historical — Joinder No. 2, dated as of February 24, 2023 | d887611dex41.htm.jsonl, page 30 | Further pari first-lien accession |
| 2023-08-18 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Joinder No. 3 to the First Lien Intercreditor Agreement | Historical — Joinder No. 3, dated as of August 18, 2023 | d887611dex41.htm.jsonl, page 30 | Further pari first-lien accession |
| 2023-11-28 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Joinder No. 4 to the First Lien Intercreditor Agreement | Historical — Joinder No. 4, dated as of November 28, 2023 | d887611dex41.htm.jsonl, page 30 | Further pari first-lien accession |
| 2024-02-27 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Joinder No. 5 to the First Lien Intercreditor Agreement | Historical — Joinder No. 5, dated February 27, 2024 | d887611dex41.htm.jsonl, page 30 | Further pari first-lien accession |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement, described as the most recent amendment affecting restrictive covenants | Historical — Amendment No. 15, executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets the covenant text in force at year-end; amendment itself not supplied |
| 2024-09-19 | day | Not supplied: the agreement exhibit states its execution date, not a publication date | Amendment No. 17 and incremental Tranche L term loan assumption agreement | Historical — execution version dated 2024-09-19 | d887611dex101.htm.jsonl, page 1; Source readiness (CP-0) | Incremental pari first-lien term loans under the 7.25x and 5.00x gates; starts the Tranche L 18-month MFN period; recap financing event is recorded by Business & governance |
| 2024-09-19 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Joinder No. 6 to the First Lien Intercreditor Agreement and 2033 secured notes indenture | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Admits the 2033 secured notes to the shared first-lien collateral |
| 2027-09-15 | day | Not supplied: the indenture exhibit states its execution date, not a publication date | Initial optional redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Earliest standard call on the 2033 secured notes; affects refinancing optionality |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 8 |
| Calculated | 3 |
| Assumption-Based | 0 |
| Analyst Inference | 3 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 2 |
| Fields present | 32 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 3 |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report page 4 as recorded by Business & governance; both Delaware corporations |
| TransDigm Group Incorporated | Guarantees the secured notes on a senior secured basis and the credit agreement as Holdings | Guarantee | TransDigm Inc. secured debt | Annual report page 58; credit agreement Article VII guarantee default; credit agreement governed by New York law (section 9.09) |
| TransDigm UK | Guarantees the 2028 secured notes and the subordinated notes | Guarantee | TransDigm Inc. secured debt | Annual report pages 57–58; UK entity per name; indenture governing law not verified in pages read |
| Domestic Restricted Subsidiaries | Guarantee secured notes senior secured and subordinated notes on a subordinated basis | Guarantee | TransDigm Inc. secured debt | Annual report pages 57–58; Exhibit 22.1 list of guarantors not supplied; New York law for credit agreement |
| Domestic Restricted Subsidiaries | Guarantee subordinated notes, subordinated to senior debt | Guarantee | TransDigm Inc. subordinated notes | Annual report pages 57–58; 2027 subordinated notes indenture payment blockage section |
| TransDigm Group Incorporated | Pledges 100% of domestic subsidiary equity and 65% of first-tier foreign voting equity, with other loan parties | Security | Credit agreement collateral agent | Credit agreement section 5.11(b), New York law; guarantee and collateral agreement not supplied |
| Non-guarantor subsidiaries | Liabilities rank structurally ahead of secured and subordinated notes | Structural claim | TransDigm Inc. secured debt | Annual report page 58 states structural subordination; jurisdictions of non-guarantors not supplied |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Secured notes | Rank equally in right of payment | Payment rank | Credit agreement obligations | Annual report page 58; credit agreement New York law |
| Subordinated notes | Subordinated in right of payment to senior secured debt | Payment rank | Credit agreement obligations | Annual report page 57; 2027 subordinated notes indenture |
| Secured notes | Share first-lien collateral under the First Lien Intercreditor Agreement | Security rank | Credit agreement obligations | 2033 indenture definition, page 30; intercreditor agreement and its governing law not supplied |
| Designated senior debt representative | May impose one payment blockage of up to 179 days in any 360 days | Standstill | Subordinated notes | 2027 subordinated notes indenture page 107; governing law not verified in pages read |
| Credit agreement collateral agent | Liens released automatically on permitted sale to a non-loan party | Release | Credit agreement obligations | Credit agreement section 9.02(c), New York law |

### Analytical appendix — complete canonical registers

All amounts are USD millions unless stated. Evidence IDs resolve in the evidence register below.

#### Evidence register

| Evidence ID | Provision or fact | Authority rank | Source |
|---|---|---|---|
| EV01 | Section 6.14 financial covenant: 7.50x, 8.00x for four quarters after a Material Acquisition; tested if exposure exceeds 40% of revolving commitments; amendable by Required Revolving Lenders only | 1 | d887611dex101.htm.jsonl, page 188 |
| EV02 | Section 4.01(d) credit-event condition at 35% exposure; refers to first two quarters after a Material Acquisition | 1 | d887611dex101.htm.jsonl, page 165 |
| EV03 | Consolidated EBITDA add-backs (a)–(m); savings capped at 25.0% of Consolidated EBITDA, 24-month window | 1 | d887611dex101.htm.jsonl, pages 23–24 |
| EV04 | Financial Covenant Consolidated EBITDA add-backs (a)–(n), incentive bonus add-back, savings without cap | 1 | d887611dex101.htm.jsonl, pages 41–42 |
| EV05 | Consolidated Net Income exclusions incl. non-recurring, integration, non-cash and deferred compensation, purchase accounting | 1 | d887611dex101.htm.jsonl, pages 25–26 |
| EV06 | Consolidated Net Leverage Ratio and Consolidated Secured Net Debt Ratio; pro forma for acquisitions and asset sales | 1 | d887611dex101.htm.jsonl, pages 26–27 |
| EV07 | Consolidated Total Indebtedness: principal amount; excludes undrawn ordinary-course letters of credit and securitization debt | 1 | d887611dex101.htm.jsonl, pages 28–29 |
| EV08 | Unrestricted Cash definition; Unrestricted Subsidiary designation mechanics | 1 | d887611dex101.htm.jsonl, page 81 |
| EV09 | Permitted Indebtedness clauses (12)–(18) and classification rule | 1 | d887611dex101.htm.jsonl, pages 59–61 |
| EV10 | Permitted Investments clauses (1)–(20) | 1 | d887611dex101.htm.jsonl, pages 61–63 |
| EV11 | Section 2.24 incremental conditions and 50 bp yield protection with 18-month sunset and carve-outs | 1 | d887611dex101.htm.jsonl, pages 144–146 |
| EV12 | Section 6.02 restricted payments incl. clauses (4), (7), (10) and 6.75x general permission | 1 | d887611dex101.htm.jsonl, pages 178–181 |
| EV13 | Article VII Events of Default incl. cross-default, Financial Covenant Event of Default, change of control | 1 | d887611dex101.htm.jsonl, pages 188–191 |
| EV14 | Section 9.02 amendments, sacred rights, agent-only intercreditor additions, non-pro-rata offers, lien releases | 1 | d887611dex101.htm.jsonl, pages 204–206 |
| EV15 | Section 5.11 additional guarantors and pledges; Excluded Subsidiaries; 65% foreign voting equity | 1 | d887611dex101.htm.jsonl, pages 173–174 |
| EV16 | Section 9.09 New York governing law | 1 | d887611dex101.htm.jsonl, page 222 |
| EV17 | 2033 indenture: Intercreditor Agreement definition, joinders, Initial Redemption Date | 1 | d887611dex41.htm.jsonl, page 30 |
| EV18 | 2033 indenture restricted payments clauses (5)–(14) and fixed-charge cover above 2.0x general permission | 1 | d887611dex41.htm.jsonl, pages 74–75 |
| EV19 | 2033 indenture covenant suspension on investment grade from both agencies | 1 | d887611dex41.htm.jsonl, page 90 |
| EV20 | 2033 indenture ratio debt at fixed-charge cover above 2.0x (search excerpt) | 1 | d887611dex41.htm.jsonl, page 79 |
| EV21 | 2027 subordinated indenture: payment blockage 179 days, once per 360 days; ratio debt and restricted payments at 2.0x (search excerpts) | 1 | d826058dex41.htm.jsonl, pages 64, 67 and 107 |
| EV22 | Annual report covenant summary, incremental conditions, springing trigger, compliance statement | 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| EV23 | Annual report guarantor scope, obligor-group summary, term loans, letters of credit | 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| EV24 | Carrying and principal debt, leverage, post-balance-sheet dividend adjustment | Analysis | Financial foundation (CP-1) |
| EV25 | September 2024 dividend recapitalisation and 18 October 2024 payment | Analysis | Business & governance (CP-1A) |
| EV26 | Supported-only versus issuer-adjusted EBITDA | Analysis | Earnings quality (CP-1D) |
| EV27 | Section 2.25 loan modification offers to all lenders of a class | 1 | d887611dex101.htm.jsonl, page 147 |

#### T4.1 Source Gate

| Source | Status | Authority rank | Quality and limitation | Gate effect |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Executed, execution version with annexed amended credit agreement | 1 | Covenant text read at clause level; schedules, exhibits and the guarantee and collateral agreement not supplied | Satisfies the governing-document gate |
| d887611dex41.htm.jsonl | Executed indenture | 1 | Selected clauses read; amendment and release articles not read | Supports secured-note analysis |
| d826058dex41.htm.jsonl | Executed indenture | 1 | Search excerpts only | Supports subordination mechanics with medium confidence |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Filed annual report, signed after cutoff | 4 | Issuer summary; retrospective | Usage, guarantor and compliance facts |
| First Lien Intercreditor Agreement | Not supplied | 2 | Identified only | Intercreditor control not established |
| Compliance certificate | Not supplied | 3 | None | Ratio headroom not calculable |

Module status: Completed with Limitations. Governing law of the credit agreement is New York; governing law of the indentures was not verified in pages read. No covenant-review report was supplied.

#### T4.2 Controlling Document Register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Amendment No. 17 with annexed amended credit agreement | Credit agreement and incremental assumption agreement | 2024-09-19 | Executed, execution version | Controls revolver and term-loan covenants, definitions, amendments | Sets every credit-agreement gate used in this review | EV01–EV16 |
| 1 | 2033 senior secured notes indenture | Indenture | 2024-09-19 | Executed | Controls 2033 notes covenants and collateral accession | Fixed-charge-based leakage gate; covenant suspension | EV17–EV20 |
| 1 | 2027 senior subordinated notes indenture | Indenture | 2019-11-13 | Executed | Controls 2027 notes subordination and covenants | Payment blockage and junior-claim mechanics | EV21 |
| 1 | Amendment No. 16 | Credit agreement amendment | 2024-06-04 | Executed, not read | Superseded on covenant text by the annexed September 2024 agreement | Chain completeness only | EV24 |
| 1 | Second amendment and restatement | Base credit agreement | 2014-06-04 | Executed, not read | Base of current chain | Chain completeness only | EV24 |
| 1 | 2013 amendment and restatement | Historical credit agreement | 2013-02-28 | Executed, not read | Historical | None for current terms | EV24 |
| 2 | First Lien Intercreditor Agreement with six joinders | Intercreditor agreement | 2019-02-13; latest joinder 2024-09-19 | Not supplied | Would control enforcement and collateral sharing | Enforcement control not established | EV17 |
| 4 | Annual report covenant and guarantor summary | Issuer filing | Signed 2024-11-07 | Filed | Summary; verified against executed credit agreement where read | Usage, compliance, guarantor scope | EV22; EV23 |

The annexed September 2024 credit agreement controls; the annual report's 40% trigger and USD 364 million figure agree with it. Indentures for the 2028–2032 secured notes and 2029 subordinated notes, the guarantee and collateral agreement, the securitization agreement and compliance certificates are missing.

#### T4.3 Covenant Feature Register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Max net leverage 7.50x (8.00x for four quarters after Material Acquisition) only if revolver exposure exceeds 40% of commitments; revolving lenders only | Credit agreement s.6.14 | Dormant while usage is low; no test for term lenders | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV01 |
| Draw condition | Credit event taking exposure above 35% requires latest-quarter net leverage within s.6.14 level | Credit agreement s.4.01(d) | Limits revolver access when leverage is high | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | EV02 |
| Covenant EBITDA | Broad add-backs: non-recurring, integration, recapitalisation and debt costs, dividend equivalents, savings capped at 25% | Consolidated EBITDA definition | Inflates ratio denominators and grower bases | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV03; EV05 |
| Maintenance EBITDA | Same add-backs plus incentive bonus; projected savings with no cap | Financial Covenant Consolidated EBITDA definition | Maintenance ratio can be managed with projected savings | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV04 |
| Covenant debt and cash | Principal of borrowed money, leases and notes; excludes securitization debt and undrawn ordinary-course letters of credit; nets all Unrestricted Cash | Consolidated Total Indebtedness; Unrestricted Cash | Uncapped netting lowers ratios while cash is held | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV07; EV08 |
| Pari secured ratio debt | Same-priority secured debt permitted to 5.00x secured net; junior-lien or unsecured to 7.25x net | Permitted Indebtedness (12) | Pari dilution of collateral | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV09 |
| Incremental facilities and MFN | Incremental at 7.25x net and 5.00x secured net; 50 bp yield protection with 18-month sunset, acquisition and long-maturity carve-outs | Credit agreement s.2.24 | Repricing protection weak and temporary | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV11 |
| General and subsidiary debt baskets | General greater of USD 250 million and 10%; foreign subsidiaries greater of USD 450 million and 18%; securitization greater of USD 725 million and 20%; subordinated at 7.25x | Permitted Indebtedness (13), (14), (17), (18) | Structurally senior debt at non-guarantors | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV09 |
| Restricted payments | Unlimited at 6.75x pro forma with no default; general greater of USD 75 million and 3%; management and dividend-equivalent basket | Credit agreement s.6.02 | Ratio-gated distributions without fixed cap | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV12 |
| Indenture restricted payments | Unlimited while fixed-charge cover exceeds 2.0x with no default | 2033 indenture s.4.07 final paragraph; 2027 indenture | Looser than credit agreement; credit agreement binds while outstanding | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV18; EV21 |
| Investments | Unrestricted subsidiaries greater of USD 250 million and 10%; general greater of USD 500 million and 25% of Total Assets; joint ventures greater of USD 1,000 million and 40% at 7.00x; unlimited at 5.75x with no revolver loans and USD 200 million cash | Permitted Investments (1), (10), (11), (20) | Value can leave guarantor reach | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV10 |
| Unrestricted subsidiaries | Board may designate new or acquired subsidiaries subject to restricted-payment and investment compliance; no recourse debt to the restricted group | Unrestricted Subsidiary definition | Designation feeds leakage capacity | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV08 |
| Guarantors and collateral | Domestic non-excluded subsidiaries join; 100% domestic and 65% foreign voting equity pledged; immaterial, unrestricted and securitization subsidiaries excluded | Credit agreement s.5.11 | Foreign value and excluded subsidiaries outside reach | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV15 |
| Events of Default | Payment, 30-day covenant cure, cross-default to USD 50 million Material Indebtedness, judgments over USD 50 million, change of control; maintenance default reaches term lenders only after revolver acceleration | Credit agreement Article VII | Early default trigger for debt, late for maintenance | Neutral — Stable | Not assessed: no comparative source supplied | EV13 |
| Amendments | Required Lenders generally; each affected lender for economics; each lender for pro rata sharing, voting, material guarantor and substantially-all collateral release; agent may add pari or junior secured debt to collateral without consent; non-pro-rata offers with Required Lenders | Credit agreement s.9.02 | Majority can reshape most covenants; subordination not listed | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV14; EV27 |
| Covenant suspension | Most 2033 notes covenants suspended if investment grade from both agencies | 2033 indenture s.4.20 area | Loss of protection on upgrade | Neutral — Stable | Not assessed: no comparative source supplied | EV19 |
| Subordination | Senior debt may impose payment blockage up to 179 days once per 360 days | 2027 indenture | Delays junior recovery | Negative — Refinancing Risk | Not assessed: no comparative source supplied | EV21 |

#### Provision-level findings (steps 4 to 8)

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Restricted payments at 6.75x | Credit agreement as amended 2024-09-19, executed, rank 1 | Unlimited distributions with no default and pro forma net leverage within 6.75x | Debt-funded recap repeatable inside gate | High: releveraging without earnings | Moderate: cash leaves before default | Dividend declarations; covenant ratio disclosure | Negative — Leverage Increase | High | EV12 |
| Pari secured debt at 5.00x | Same, rank 1 | Same-priority secured debt to 5.00x secured net | Dilutes first-lien collateral; agent adds to intercreditor without consent | Moderate | High: pari dilution | New secured issuance; intercreditor joinders | Negative — Leverage Increase | High | EV09; EV14 |
| MFN | Same, rank 1 | 50 bp protection, 18-month sunset, carve-outs, credit-agreement loans only | Repricing risk for existing term lenders | Low | Low | Sunset dates; incremental pricing | Negative — Refinancing Risk | High | EV11 |
| Maintenance EBITDA savings | Same, rank 1 | Projected savings uncapped in maintenance EBITDA | Maintenance ratio can be supported by projections | Moderate | Low | Size of savings add-back in certificates | Negative — Covenant Erosion | High | EV04 |
| Investment routes | Same, rank 1 | Multiple investment baskets incl. unlimited at 5.75x | Assets move to unrestricted or non-guarantor entities | Low | High | Designations, joint ventures, large investments | Negative — Covenant Erosion | High | EV10 |
| Collateral and guarantor perimeter | Same, rank 1; annual report rank 4 | 65% foreign voting pledge; foreign non-guarantors | Value outside collateral reach | Low | Moderate | Non-guarantor share of sales | Negative — Covenant Erosion | Medium | EV15; EV23 |
| Amendment and sacred rights | Same, rank 1 | Subordination not enumerated in text read | Uptier theoretically possible with majority | Low | High if used | Amendment filings; consent solicitations | Negative — Covenant Erosion | Medium | EV14 |

Definitions collectively widen every ratio gate because covenant earnings exclude compensation, integration and financing costs and cash netting is uncapped. Total incurrence capacity is the sum of ratio debt to the gates plus fixed and grower baskets, not calculable without covenant earnings and usage; priming risk is pari dilution rather than a senior layer. Leakage capacity combines unlimited restricted payments at 6.75x with investment baskets; recovery positions are first-lien loans and secured notes pari, subordinated notes junior and contractually blocked. Lender control rests on majority lenders, with each-lender protection over pro rata sharing and collateral release.
Basis: d887611dex101.htm.jsonl, pages 23–29; d887611dex101.htm.jsonl, pages 59–63; d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, pages 204–206

#### T4.9 PD vs LGD Translation Table

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Restricted payments | Unlimited at 6.75x net leverage | Repeat recap raises leverage | High | Moderate | Dividend declarations | EV12 |
| Pari secured incurrence | Permitted to 5.00x secured net | More claims on same collateral | Moderate | High | Secured issuance, joinders | EV09 |
| Maintenance covenant | Springing at 40% usage, revolver only | Late warning for term lenders | Moderate | Low | Revolver usage | EV01 |
| Draw condition | Leverage condition above 35% usage | Liquidity access cut when leverage high | Moderate | Low | Revolver draws, letters of credit | EV02 |
| Investments and unrestricted subsidiaries | Multiple baskets incl. 5.75x unlimited | Value leaves guarantor reach | Low | High | Designations, investments | EV10; EV08 |
| Non-guarantor debt | Foreign subsidiaries at least USD 450 million; securitization at least USD 725 million | Structurally senior claims | Low | Moderate | Foreign borrowing, securitization size | EV09 |
| Amendment control | Subordination not sacred in text read | Uptier with majority | Low | High | Amendments | EV14 |
| Subordination | 179-day payment blockage | Junior recovery delayed | Moderate for subordinated notes | High for subordinated notes | Senior defaults | EV21 |

#### T4.10 Market Norm Comparison Table

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | As set out in the covenant feature register | None supplied: no covenant-review report or market-norm dataset in the documents | Not assessed: market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed: no comparative source | Insufficient Information | EV22 |

#### T4.11 Aggressiveness Score Table

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Springing 7.50x at above 40% usage, revolver only; uncapped savings | No early warning for term lenders | Negative — Covenant Erosion | Provisional | EV01; EV04 |
| Debt / lien incurrence capacity | 4 | Pari to 5.00x, total to 7.25x, weak MFN, non-guarantor baskets | Pari dilution and structurally senior debt | Negative — Leverage Increase | Provisional | EV09; EV11 |
| RP / investment / leakage capacity | 4 | Unlimited RP at 6.75x; indentures at 2.0x cover; broad investments; used for USD 4,348 million dividend | Value transfer to equity and outside group | Negative — Leverage Increase | Provisional | EV10; EV12; EV25 |
| EBITDA definitions and add-back flexibility | 4 | Broad add-backs; savings capped 25% for incurrence, uncapped for maintenance | Inflated denominators and grower bases | Negative — Covenant Erosion | Provisional | EV03; EV04 |
| Collateral / guarantor protection | 3 | Domestic guarantors, 65% foreign pledge, excluded subsidiaries; release sacred | Foreign value outside reach | Negative — Covenant Erosion | Provisional | EV15; EV23 |
| Amendment / control mechanics | 3 | Majority lenders; pro rata sharing and collateral release sacred; subordination not listed | Theoretical uptier | Negative — Covenant Erosion | Provisional | EV14 |
| Overall | 4 | Weighted to leakage and incurrence | Releveraging and pari dilution | Negative — Leverage Increase | Provisional | EV09; EV12 |

Covenant Aggressiveness Score: 4/5, Provisional, because the intercreditor agreement, security documents and compliance certificate are missing.

#### T4.12 Red Flags Table

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Ratio-gated unlimited dividends | Restricted payments at 6.75x | Repeat recap needs no consent | PD up; RV negative for all classes | Track declarations and covenant ratio | EV12 |
| Agent-only pari accession | s.9.02 agent may add pari or junior secured debt | First lien diluted without vote | LGD up for first lien | Track intercreditor joinders | EV14; EV17 |
| Uncapped maintenance savings | Financial Covenant Consolidated EBITDA (n) | Maintenance test softened | PD warning delayed | Track savings in certificates | EV04 |
| MFN sunset and carve-outs | s.2.24 yield protection | Repricing without compensation | RV negative for term loans | Track 18-month dates | EV11 |
| Subordination not sacred | s.9.02(b) list | Uptier capacity | LGD up for non-participants | Track consent solicitations | EV14 |
| Unrestricted subsidiary and investment capacity | Permitted Investments; designation | Asset leakage | LGD up | Track designations, joint ventures | EV08; EV10 |
| Non-guarantor senior debt | Foreign and securitization baskets | Structural subordination | LGD up for notes | Track foreign borrowing | EV09 |

#### T4.13 Gaps Ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| G01 | First Lien Intercreditor Agreement and joinders | Controls enforcement and release between secured classes | Intercreditor registers limited; score provisional | Obtain executed agreement and joinders |
| G02 | Compliance certificate and covenant EBITDA | Needed for ratio headroom | Headroom not calculable for ratio tests | Obtain latest certificate |
| G03 | Guarantee and collateral agreement, security schedules | Collateral scope and release | Collateral map partial | Obtain security documents |
| G04 | Indentures for 2028–2032 secured and 2029 subordinated notes | Terms may differ | Leakage view for those notes inferred | Obtain indentures |
| G05 | Required Lenders definition and full s.9.02 | Voting threshold and further sacred rights | Uptier view theoretical | Read full clause |
| G06 | Exhibit 22.1 guarantor list and subsidiary list | Entity perimeter | Entity register at class level | Obtain exhibits |
| G07 | Basket usage history | Remaining capacity | Capacity formulas only | Obtain usage tracker |
| G08 | Market-norm comparator or covenant review | Relative assessment | Market-norm table not assessed | Obtain covenant review |
| G09 | Refinancing and liability-management assessment | Legal-capacity overlay for exchanges | Overlay incomplete | Not supplied in this run |

#### T4D.1 Source Gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| d887611dex101.htm.jsonl, pages 173–174 | Executed | 1 | Guarantor and pledge covenants only; schedules not supplied | Completed with Limitations |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 | Filed | 4 | Guarantor scope and combined obligor summary; Exhibit 22.1 not supplied | Completed with Limitations |
| d887611dex41.htm.jsonl, page 30 | Executed | 1 | Identifies intercreditor agreement; security documents not supplied | Completed with Limitations |

Subsequent events, held outside the as-of perimeter: the remaining USD 162.5 million securitization availability was drawn on 16 October 2024 and the USD 4,348 million dividend was paid on 18 October 2024, per Business & governance; neither changed the guarantor or collateral perimeter, and the dividend is a restricted-payment usage signal.
Basis: Business & governance (CP-1A)

#### T4D.2 Restricted / Unrestricted Entity Register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware | Listed parent | Holdings; not a subsidiary | No significant operations or assets other than investment in TransDigm Inc. | Yes | EV23 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Restricted group parent | Combined obligor group sales USD 6,294 million | Yes | EV23 |
| TransDigm UK | Guarantor of 2028 secured and subordinated notes | United Kingdom per name; not verified | — Insufficient Information: parent not stated | Restricted; designation capacity applies to new or acquired subsidiaries only | — Insufficient Information: not separately disclosed | Yes | EV23 |
| Domestic Restricted Subsidiaries | Guarantors | United States | TransDigm Inc. | Restricted | Included in obligor group | Yes | EV15; EV23 |
| Foreign Restricted Subsidiaries other than TransDigm UK | Non-guarantors | Various, not supplied | TransDigm Inc. group | Restricted | Non-guarantor sales USD 1,646 million with other non-guarantors | No | EV23; K08 |
| Securitization Entity | Receivables financing vehicle | Not supplied | Not supplied | Excluded Subsidiary | Receivables backing USD 487.5 million drawn | No | EV09; EV15 |
| Immaterial Domestic Subsidiaries | Excluded Subsidiaries | United States | Not supplied | Restricted, excluded | — Insufficient Information: not disclosed | No | EV15 |
| Unrestricted Subsidiaries | None identified | Not applicable | Not applicable | Capacity: new or acquired subsidiaries may be designated | — Insufficient Information: none identified | No | EV08 |

#### T4D.3 Guarantor Coverage Matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities | Senior secured | Upstream from parent to borrower debt (downstream guarantee) | Release of material guarantor needs each lender unless otherwise permitted | EV13; EV14 |
| TransDigm Group Incorporated × secured notes | Senior secured | Downstream | Not read in indenture | EV23 |
| TransDigm Group Incorporated × subordinated notes | Senior subordinated | Downstream | Not read in indenture | EV23 |
| Domestic Restricted Subsidiaries × credit facilities | Senior secured | Upstream | Disposal to non-loan party; designation as unrestricted | EV14; EV15 |
| Domestic Restricted Subsidiaries × secured notes | Senior secured; 2029–2033 notes tied to credit facility or USD 200 million capital markets guarantees | Upstream | Release follows credit facility guarantee for 2029–2033 notes per scope | EV23 |
| Domestic Restricted Subsidiaries × subordinated notes | Senior subordinated | Upstream | Not read in indenture | EV23 |
| TransDigm UK × 2028 secured notes and subordinated notes | Senior secured; subordinated | Cross-stream | Not read | EV23 |
| Foreign non-guarantors × all tranches | None | Not applicable | Not applicable | EV23 |

#### T4D.4 Collateral-by-Entity Matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × first lien | Unrestricted subsidiary equity; equity requiring separate SEC financials | Automatic on permitted sale to non-loan party; all collateral needs each lender | — Insufficient Information: security agreement not supplied | EV14; EV15 |
| TransDigm Group Incorporated × junior lien | — No junior-lien debt outstanding | — Insufficient Information: no junior-lien document | — Insufficient Information | EV09 |
| TransDigm Inc. × first lien | Same exclusions; 65% foreign voting equity cap | Same | — Insufficient Information: security agreement not supplied | EV15 |
| TransDigm Inc. × junior lien | — No junior-lien debt outstanding | — Insufficient Information | — Insufficient Information | EV09 |
| Domestic subsidiary loan parties × first lien | Same exclusions | Same | — Insufficient Information: security agreement not supplied | EV15 |
| Domestic subsidiary loan parties × junior lien | — No junior-lien debt outstanding | — Insufficient Information | — Insufficient Information | EV09 |
| TransDigm UK × first lien | — Insufficient Information: UK security not supplied | — Insufficient Information | UK collateral agent exists; terms not supplied | EV17 |
| TransDigm UK × junior lien | — No junior-lien debt outstanding | — Insufficient Information | — Insufficient Information | EV09 |
| Foreign non-guarantors × first lien | Assets unpledged; only 65% voting equity of first-tier subsidiaries pledged | Not applicable | Foreign-law limits not supplied | EV15 |
| Foreign non-guarantors × junior lien | — Not applicable | Not applicable | Not applicable | EV15 |
| Securitization Entity × first lien | Receivables sold to vehicle outside collateral | Not applicable | Not applicable | EV09; EV15 |
| Securitization Entity × junior lien | — Not applicable | Not applicable | Not applicable | EV09 |

#### T4D.5 Structural Priority Table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc. with guarantors | Obligor-group value and pledged equity | Pari (same entity, same lien) | Foreign non-guarantor value beyond 65% voting pledge | First-lien access shared with secured notes | Medium | EV15; EV23 |
| Secured notes 2028–2033 | TransDigm Inc. with guarantors | Same collateral | Pari (same entity, same lien) | Same foreign non-guarantor value | Equal to loans; enforcement control not established | Medium | EV17; EV23 |
| Subordinated notes | TransDigm Inc. with subordinated guarantors | Residual after senior debt | Contractually Subordinated | Non-guarantor value behind their creditors | Junior; payment blockage delays recovery | Medium | EV21; EV23 |
| Foreign subsidiary debt | Foreign Restricted Subsidiaries | Foreign subsidiary assets first | Structurally Senior | Not applicable | Ahead of group creditors on foreign value | Medium | EV09 |
| Securitization | Securitization Entity | Sold receivables | Structurally Senior | Not applicable | Receivables outside collateral | Medium | EV09 |
| All group debt versus pari incremental | TransDigm Inc. | Same collateral | Priming-Exposed (uptier capable) | Collateral shared with new pari debt | Theoretical uptier if subordination amendable by majority | Low | EV14 |

#### T4D.6 Drop-down / Transfer Capacity Register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Investment into unrestricted subsidiary | Restricted group to unrestricted subsidiary | Permitted Investments (1)(c): greater of USD 250 million and 10% | At least USD 250 million | 3 | Value leaves collateral | Theoretical | EV10 |
| General investment basket | Restricted group to any person | Permitted Investments (10): greater of USD 500 million and 25% of Total Assets | At least USD 500 million | 4 | Material value can leave | Theoretical | EV10 |
| Unlimited investments | Restricted group to any person | Permitted Investments (20) at 5.75x, no revolver loans, USD 200 million cash | Uncapped when gate met | 4 | Open route when leverage low | Theoretical | EV10 |
| Joint ventures | Restricted group to joint ventures | Permitted Investments (11) at 7.00x | At least USD 1,000 million | 4 | Value moved outside guarantor reach | Theoretical | EV10 |
| Restricted payments to equity | Borrower to Holdings to shareholders | s.6.02 at 6.75x | Uncapped when gate met | 4 | Cash leaves all creditors | Demonstrated by USD 4,348 million October 2024 payment | EV12; EV25 |
| Transfer to foreign non-guarantor | Loan party to Foreign Restricted Subsidiary | Permitted Investments (1)(a) investments in restricted subsidiaries | — Insufficient Information: not capped in text read | 3 | Value moves outside guarantees | Theoretical | EV10 |

#### T4D.7 Priming-Exposure Findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier | s.9.02(b) sacred rights do not list subordination; non-pro-rata offers with Required Lenders | Non-participating first-lien lenders | Theoretical, contested; intercreditor terms unknown | Majority could subordinate a minority if no other protection exists | Low | EV14; EV27 |
| Trapdoor | Unrestricted subsidiary designation plus investment baskets | All group creditors | Theoretical | Assets could support debt outside the group | Low | EV08; EV10 |

#### T4D.8 Gaps Ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| S01 | Exhibit 22.1 guarantor list and subsidiary list | Names and jurisdictions | Entity register at class level | Obtain exhibits |
| S02 | Guarantee and collateral agreement, UK security | Collateral by entity | Collateral matrix partial | Obtain documents |
| S03 | Entity-level debt and EBITDA | Value location | Reachable value qualitative | Obtain entity financials |
| S04 | Indenture guarantee release clauses | Release triggers | Matrix partial | Read indentures |
| S05 | Intercreditor agreement | Release authority | Release cells partial | Obtain agreement |

#### T4F.1 Controlling Documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement | Company, Holdings, subsidiary guarantors, credit agreement collateral agent, existing secured notes trustees and collateral agents, 2033 trustee and notes collateral agents | 2019-02-13; joinders to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Identified, not supplied | Evidence EV17, 2033 indenture definitions | EV17 |
| Credit agreement as amended | TransDigm Inc., Holdings, lenders, agent | 2024-09-19 | New York | Executed | Evidence EV14 and EV16 | EV14; EV16 |
| 2027 subordinated notes indenture | TransDigm Inc., guarantors, trustee | 2019-11-13 | Not verified in pages read | Executed | Evidence EV21 | EV21 |

#### T4F.2 Creditor Class Map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Shared first-lien collateral | Maintenance-covenant acceleration rights; other rights [Insufficient Information] — ICA not in the source set | Required Revolving Lenders for s.6.14 | EV01; EV13 |
| Term lenders | First lien, pari | Shared first-lien collateral | [Insufficient Information] — ICA not in the source set | Required Lenders under s.9.02 | EV14 |
| Secured noteholders | First lien, pari | Shared first-lien collateral | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | EV17 |
| Subordinated noteholders | Junior in payment | Unsecured | Subject to 179-day payment blockage | Not applicable to senior votes | EV21 |

#### T4F.3 Enforcement Control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Term lenders and secured noteholders | Control could sit with the larger class | Insufficient Information | EV17 |
| Subordinated payment blockage | 179 days, once per 360 days | Non-payment default on Designated Senior Debt and notice by its representative | Representative of Designated Senior Debt | Subordinated noteholders | Junior payments stop while seniors negotiate | Negative — Refinancing Risk | EV21 |

#### T4F.4 Turnover and Release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement lien release | [Insufficient Information] — ICA not in the source set | Automatic on permitted sale to a non-loan party; all or substantially all needs each lender | [Insufficient Information] — ICA not in the source set | Sale must comply with agreement | Each-lender consent for wholesale release | EV14 |
| Subordination turnover | [Insufficient Information] — 2027 indenture turnover clause not read | Not applicable | Not applicable | Senior default | Blockage capped at 179 days | EV21 |

#### T4F.5 Recovery Control Assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Share collateral with secured notes | Enforcement control not established | Insufficient Information | Noteholders may direct enforcement | Insufficient Information | EV17 |
| Secured noteholders | Share collateral with loans | Same | Insufficient Information | Lenders may direct enforcement | Insufficient Information | EV17 |
| Subordinated noteholders | Paid after senior debt | Payment blockage; no security | High | Recovery delayed and residual | Negative — Refinancing Risk | EV21 |

#### T4F.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| I01 | Intercreditor agreement text | Enforcement, standstill, turnover | Intercreditor registers limited | Obtain agreement |
| I02 | Indenture amendment and release articles | Release authority | Release register partial | Read indentures |
| I03 | 2027 indenture turnover clause | Junior turnover | Turnover partial | Read clause |

#### T4C.2 Source Map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Annexed amended credit agreement | Credit agreement | 2024-09-19 | Executed | Legal Formula | All gates and baskets | EV01–EV16 |
| 1 | 2033 and 2027 indentures | Indentures | 2024-09-19; 2019-11-13 | Executed | Legal Formula | Indenture gates | EV18–EV21 |
| 4 | Annual report | Issuer filing | Signed 2024-11-07 | Filed | Usage: letters of credit and revolver availability | Usage trigger calculation | EV22; EV23 |
| Analysis | Financial foundation | Financial data | As of 2024-09-30 | Accepted | Financial Input (non-covenant reference only) | Analytical leverage | EV24 |

#### T4C.3 Definition Register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | Definitions | Net income plus taxes, interest, non-cash charges, unusual, integration, recapitalisation and debt costs, dividend equivalents, savings capped at 25% | Covenant income and add-backs | Raises grower bases and lowers ratios | Add-back inflation | Negative — Leverage Increase | EV03 |
| Financial Covenant Consolidated EBITDA | Definitions | Same plus incentive bonus; savings uncapped | Same | Softens maintenance test | Projection-based compliance | Negative — Covenant Erosion | EV04 |
| Consolidated Total Indebtedness | Definitions | Principal of borrowed money, leases, notes; excludes securitization and undrawn ordinary-course letters of credit | Principal debt | Lower than carrying debt plus securitization | Excluded receivables funding | Neutral — Stable | EV07 |
| Unrestricted Cash | Definitions | Unpledged cash of Holdings, Borrower, restricted subsidiaries; loan-document liens allowed | Cash by entity | Uncapped netting | Ratios fall while cash is held | Negative — Leverage Increase | EV08 |
| Consolidated Net Leverage Ratio | Definitions | Total Indebtedness less Unrestricted Cash over four-quarter EBITDA, pro forma | Debt, cash, EBITDA | Gates at 5.75x, 6.75x, 7.00x, 7.25x, 7.50x | Single ratio governs most capacity | Negative — Leverage Increase | EV06 |
| Consolidated Secured Net Debt Ratio | Definitions | Secured debt less Unrestricted Cash over EBITDA | Secured debt | Pari gate at 5.00x | Netting lifts pari capacity | Negative — Leverage Increase | EV06 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | EBITDA over fixed charges | EBITDA, fixed charges | Gate above 2.0x | Loose indenture gate | Negative — Covenant Erosion | EV18; EV20 |
| Non-debt float | Total Indebtedness definition | Contract liabilities USD 177 million and dividend payable are not borrowed money | Balance sheet | Outside every debt test | Float not captured by ratios | Neutral — Stable | EV07; EV24 |

#### Definition conflicts

| Item | Figure one | Figure two | Explanation | Treatment | Source |
|---|---|---|---|---|---|
| Covenant debt versus carrying debt | Carrying debt USD 24,880 million | Principal excluding securitization USD 24,581 million | Covenant uses principal and excludes securitization; government advances inclusion not established | Covenant definition governs; difference USD 299 million logged | Financial foundation (CP-1); d887611dex101.htm.jsonl, pages 28–29; calculation K10 |
| Covenant EBITDA | Reported EBITDA USD 3,813 million; EBITDA As Defined USD 4,173 million | Covenant figure not disclosed | Covenant add-backs broader than earnings-quality supported case | No substitution; headroom not calculable | Earnings quality (CP-1D); d887611dex101.htm.jsonl, pages 23–26 |
| Material acquisition step-up period | Four quarters in financial covenant | Two quarters in draw condition | Internal drafting difference | Each clause applied as written | d887611dex101.htm.jsonl, pages 165 and 188 |
| Term-loan tranches | Credit agreement commitments list Tranches I, J, K, L | Market sheet lists tranches M and N | Executed agreement corroborates filed debt table | Sheet tranches not treated as outstanding | d887611dex101.htm.jsonl, page 23; Source readiness (CP-0) |

#### T4C.4 Headroom Table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger for springing covenant | max-ratio | 40.00% | 7.36% | Threshold less letters of credit over commitments | 32.64% | Compliant | Assumes no letter of credit is cash collateralized at 103% | Covenant dormant | Neutral — Stable | EV01; EV23 |
| Revolver draw condition | max-ratio | 35.00% | 7.36% | Threshold less letters of credit over commitments | 27.64% | Compliant | Same assumption | Draws above 35% need ratio compliance | Neutral — Stable | EV02; EV23 |
| Springing maximum net leverage | max-ratio | 7.50x | [Insufficient Information] — missing: current tested ratio | Threshold less covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | No compliance certificate | Revolver-only test | Insufficient Information | EV01 |
| Unlimited restricted payments | max-ratio | 6.75x | [Insufficient Information] — missing: current tested ratio | Threshold less pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Covenant EBITDA not disclosed | Distribution capacity | Negative — Leverage Increase | EV12 |
| Incremental and junior or unsecured debt | max-ratio | 7.25x | [Insufficient Information] — missing: current tested ratio | Threshold less pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Same | Debt capacity | Negative — Leverage Increase | EV09; EV11 |
| Pari secured debt and incremental | max-ratio | 5.00x | [Insufficient Information] — missing: current tested ratio | Threshold less pro forma secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Same | Pari dilution | Negative — Leverage Increase | EV09; EV11 |
| Unlimited investments | max-ratio | 5.75x | [Insufficient Information] — missing: current tested ratio | Threshold less pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Same | Leakage | Negative — Covenant Erosion | EV10 |
| Joint-venture investments | max-ratio | 7.00x | [Insufficient Information] — missing: current tested ratio | Threshold less pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Same | Leakage | Negative — Covenant Erosion | EV10 |
| Indenture restricted payments and ratio debt | min-ratio | 2.00x | [Insufficient Information] — missing: current tested ratio | Covenant fixed-charge cover less threshold | [Insufficient Information] — missing: current tested ratio | Not Calculable | Fixed charges not disclosed on covenant basis | Loose indenture gate | Negative — Covenant Erosion | EV18; EV20; EV21 |

#### T4C.5 Capacity Register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Debt incurrence capacity | General debt (13) | Greater of USD 250 million and 10% of Consolidated EBITDA | Borrower and guarantors | Covenant EBITDA not disclosed | Not Available: no usage tracker | At least USD 250 million | [Insufficient Information] — missing: basket usage | Formula Extracted Only | Moderate | Fixed-and-grower debt | Negative — Leverage Increase | EV09 |
| Debt incurrence capacity | Foreign subsidiaries (14) | Greater of USD 450 million and 18% | Non-guarantor borrowers | Same | Not Available | At least USD 450 million | [Insufficient Information] — missing: basket usage | Formula Extracted Only | High | Structurally senior debt | Negative — Leverage Increase | EV09 |
| Debt incurrence capacity | Securitization (18) | Greater of USD 725 million and 20% | Non-recourse vehicle | Facility USD 650 million, drawn USD 487.5 million | Facility only | At least USD 725 million | [Insufficient Information] — missing: other securitization usage | Ready with Limitations | Moderate | Receivables outside collateral | Negative — Leverage Increase | EV09; EV23 |
| Lien capacity | Pari secured (12) | Ratio basket to 5.00x secured net | No default; maturity and life tests | Not disclosed | Not Applicable: ratio basket | Not Calculable | [Insufficient Information] — missing: covenant secured net leverage | Formula Extracted Only | Critical | Pari dilution | Negative — Leverage Increase | EV09 |
| Incremental facility capacity | s.2.24 | 7.25x net and 5.00x secured net | Certificate; LCA test date | Not disclosed | Not Applicable: ratio basket | Not Calculable | [Insufficient Information] — missing: covenant ratios | Formula Extracted Only | High | Pari loans | Negative — Leverage Increase | EV11 |
| Restricted payment capacity | s.6.02 general | Unlimited at 6.75x | No default | Not disclosed | October 2024 dividend USD 4,348 million | Uncapped when gate met | [Insufficient Information] — missing: covenant net leverage | Formula Extracted Only | Critical | Recap capacity | Negative — Leverage Increase | EV12; EV25 |
| Restricted payment capacity | s.6.02 (7) | Greater of USD 75 million and 3% | No default | Not disclosed | Not Available | At least USD 75 million | [Insufficient Information] — missing: basket usage | Formula Extracted Only | Low | Small leakage | Neutral — Stable | EV12 |
| Investment capacity | Permitted Investments (10) | Greater of USD 500 million and 25% of Total Assets | None stated | Total Assets on covenant basis not read | Not Available | At least USD 500 million | [Insufficient Information] — missing: basket usage | Formula Extracted Only | High | Value leakage | Negative — Covenant Erosion | EV10 |
| Unrestricted subsidiary capacity | Permitted Investments (1)(c) | Greater of USD 250 million and 10% | Designation certificate | Not disclosed | Not Available | At least USD 250 million | [Insufficient Information] — missing: basket usage | Formula Extracted Only | High | Value outside group | Negative — Covenant Erosion | EV08; EV10 |
| Investment capacity | Permitted Investments (20) | Unlimited at 5.75x | No revolver loans; USD 200 million cash | Not disclosed | Not Available | Uncapped when gate met | [Insufficient Information] — missing: covenant net leverage | Formula Extracted Only | High | Leakage | Negative — Covenant Erosion | EV10 |
| Maintenance covenant headroom | Revolver usage | 40% of USD 910 million less exposure | Exposure excludes cash-collateralized letters of credit | USD 67 million | USD 67 million | USD 364 million | USD 297 million | Completed | Low | Trigger distant | Neutral — Stable | EV01; EV23 |
| Guarantor / collateral release capacity | s.9.02(c) | Automatic on permitted sale | Compliance with agreement | Not applicable | Not applicable | Not Calculable | [Insufficient Information] — missing: asset sale usage | Formula Extracted Only | Moderate | Collateral leaves with sale | Negative — Covenant Erosion | EV14 |

Baskets are not totalled: ratio baskets are fungible with fixed baskets through the classification rule, and capacity is not independent across routes.

#### T4C.6 Debt/Lien/Priming Table

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured notes | To 5.00x secured net | Formula Extracted Only | Same collateral, no MFN | Moderate | High | Negative for loans and secured notes | EV09 |
| Incremental term loans | 7.25x and 5.00x | Formula Extracted Only | MFN 50 bp, 18-month sunset | Moderate | High | Negative for loans | EV11 |
| Junior and unsecured | To 7.25x | Formula Extracted Only | Adds claims behind first lien | Moderate | Low for first lien; high for subordinated notes | Negative for subordinated notes | EV09 |
| Non-guarantor debt | At least USD 450 million plus securitization at least USD 725 million | Formula Extracted Only | Structurally senior | Low | Moderate | Negative for notes | EV09 |
| Uptier by amendment | Subordination not sacred in text read | Insufficient Information | Majority could subordinate minority | Low | High | Negative for holdouts | EV14 |

#### T4C.7 Leakage Analysis Table

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Dividends | Unlimited at 6.75x | s.6.02 | USD 4,348 million paid 18 October 2024; remaining not calculable | Cash leaves group | Critical | Negative — Leverage Increase | EV12; EV25 |
| Unrestricted subsidiaries | Greater of USD 250 million and 10% | Permitted Investments (1)(c) | Not calculable | Assets leave collateral | High | Negative — Covenant Erosion | EV10 |
| General investments | Greater of USD 500 million and 25% of Total Assets | Permitted Investments (10) | Not calculable | Assets leave group | High | Negative — Covenant Erosion | EV10 |
| Joint ventures | Greater of USD 1,000 million and 40% at 7.00x | Permitted Investments (11) | Not calculable | Assets leave guarantor reach | High | Negative — Covenant Erosion | EV10 |
| Asset sales | Lien release on permitted sale | s.9.02(c) | Not calculable | Collateral released | Moderate | Negative — Covenant Erosion | EV14 |

Total leakage capacity is not aggregated because routes overlap and usage is unknown.

#### T4C.8 Add-Back Inflation Table

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings, incurrence | Consolidated EBITDA (m) | 25% of Consolidated EBITDA; 24 months | Not Calculable | Raises grower bases and lowers gates | PD up through releveraging | EV03 |
| Projected cost savings, maintenance | Financial Covenant Consolidated EBITDA (n) | No cap; 24 months | Not Calculable | Softens maintenance test | PD warning delayed | EV04 |
| Non-cash and deferred compensation | Consolidated Net Income (11) | None | Not Calculable | Excludes recurring compensation | Capacity overstated versus supported earnings | EV05; EV26 |
| Recapitalisation and debt costs | Consolidated EBITDA (e) | None | Not Calculable | Recap costs added back | Recaps self-financing in ratio terms | EV03 |
| Dividend equivalents | Consolidated EBITDA (k) | None | Not Calculable | Shareholder payments added back | Distribution-linked costs ignored | EV03 |
| Grower crossover | Debt and investment baskets | Grower exceeds floor above USD 2,500 million covenant EBITDA; securitization above USD 3,625 million | Calculated | Baskets float with add-backs | Larger structurally senior and leakage room | EV09; EV10; K13 |

#### T4C.9 Flags Table

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio-gated dividends | Unlimited at 6.75x | Releveraging | Critical | Moderate | Analysis affected: committee debate and position sizing | EV12 |
| Agent-only pari accession | s.9.02 | Collateral dilution | High | High | Analysis affected: recovery and security selection | EV14 |
| Uncapped maintenance savings | Definition (n) | Delayed warning | Moderate | High | Analysis affected: downside and liquidity | EV04 |
| Subordination not sacred | s.9.02(b) | Uptier | High | Low | Analysis affected: refinancing and liability management | EV14 |
| Basket fungibility | Classification rule | Double use | Moderate | Moderate | Analysis affected: capacity sizing | EV09 |

#### T4C.11 Priority Matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Restricted payments at 6.75x | Critical | Moderate | Debt-funded distributions | High | Moderate | Dividend declarations | EV12 |
| 2 | Pari secured debt at 5.00x | Critical | Moderate | Collateral dilution | Moderate | High | Secured issuance | EV09 |
| 3 | Investment and unrestricted routes | High | Formula Only | Asset leakage | Low | High | Designations | EV10 |
| 4 | Uncapped maintenance add-backs | Moderate | Formula Only | Softer maintenance test | Moderate | Low | Certificates | EV04 |
| 5 | Amendment and uptier | High | Formula Only | Subordination by majority | Low | High | Amendments | EV14 |

#### T4C.12 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| C01 | Compliance certificate | Maintenance and incurrence headroom unconfirmable | Ratio rows not calculable | Obtain certificate |
| C02 | Covenant EBITDA bridge | Ratio capacity unreliable | Grower bases not calculable | Obtain bridge |
| C03 | Basket usage tracker | Remaining capacity undetermined | Capacity at floors only | Obtain tracker |
| C04 | Covenant Total Assets | Investment basket size | Floor only | Obtain figure |
| C05 | MFN sunset dates | Repricing exposure timing | No dated sunset row | Obtain effective dates |

#### Material claim lineage

| Claim | Material claim | Strongest lineage | Source |
|---|---|---|---|
| L01 | Springing 7.50x covenant, revolver only, 40% trigger | Directly Sourced | d887611dex101.htm.jsonl, page 188 |
| L02 | Unlimited restricted payments at 6.75x | Directly Sourced | d887611dex101.htm.jsonl, page 181 |
| L03 | Pari secured to 5.00x, junior to 7.25x | Directly Sourced | d887611dex101.htm.jsonl, page 59 |
| L04 | MFN 50 bp with 18-month sunset and carve-outs | Directly Sourced | d887611dex101.htm.jsonl, page 144 |
| L05 | Savings capped 25% for incurrence, uncapped for maintenance | Directly Sourced | d887611dex101.htm.jsonl, pages 24 and 42 |
| L06 | Sacred-right list excludes subordination in text read | Directly Sourced | d887611dex101.htm.jsonl, pages 204–205 |
| L07 | Indenture restricted payments above 2.0x cover | Directly Sourced | d887611dex41.htm.jsonl, page 75 |
| L08 | 179-day payment blockage | Directly Sourced | d826058dex41.htm.jsonl, page 107 |
| L09 | Usage 7.36% against 40% trigger | Calculated | calculation K01 |
| L10 | Non-guarantor share of sales 20.73% | Calculated | calculation K09 |
| L11 | Grower crossover at USD 2,500 million | Calculated | calculation K13 |
| L12 | Analytical leverage inside the 6.75x gate | Analyst Inference | calculation K14 |
| L13 | Aggressiveness 4/5 provisional | Analyst Inference | d887611dex101.htm.jsonl, pages 59–63 |
| L14 | Uptier theoretical | Analyst Inference | d887611dex101.htm.jsonl, pages 204–206 |
| L15 | Enforcement control | Insufficient Information | d887611dex41.htm.jsonl, page 30 |
| L16 | Remaining basket capacity | Insufficient Information | d887611dex101.htm.jsonl, pages 59–63 |

#### Verification

| Register | Present | Columns complete | Minimum rows | Locator or gap | Result |
|---|---|---|---|---|---|
| T4.2–T4.13 | Yes | Yes | Yes | Yes | PASS |
| T4D.1–T4D.8 | Yes | Yes | Yes | Yes | PASS |
| T4F.1–T4F.6 | Yes | Yes | Yes | Yes | PASS |
| T4C.2–T4C.12 | Yes | Yes | Yes | Yes | PASS |

## Calculations

All calculations use USD millions or ratios from the stated sources; analytical leverage gaps compare a non-covenant figure from Financial foundation with contractual thresholds and are not covenant headroom.

| ID | Operation | Inputs and period | Result | Source |
|---|---|---|---|---|
| K01 | Ratio | Letters of credit USD 67 million over revolving commitments USD 910 million, 2024-09-30 | 0.0736263736 fraction; 7.36% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K02 | Product | 40% × USD 910 million | USD 364 million | d887611dex101.htm.jsonl, page 188 |
| K03 | Product | 35% × USD 910 million | USD 318.5 million | d887611dex101.htm.jsonl, page 165 |
| K04 | Difference | USD 364 million less USD 67 million | USD 297 million | calculation K02 |
| K05 | Difference | USD 318.5 million less USD 67 million | USD 251.5 million | calculation K03 |
| K06 | Difference | 40.00% less 7.36% | 32.64% | calculation K01 |
| K07 | Difference | 35.00% less 7.36% | 27.64% | calculation K01 |
| K08 | Difference | Consolidated sales USD 7,940 million less obligor-group sales USD 6,294 million, FY2024 | USD 1,646 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K09 | Ratio | USD 1,646 million over USD 7,940 million | 0.2073047859 fraction; 20.73% | calculation K08 |
| K10 | Difference | Carrying debt USD 24,880 million less principal excluding securitization USD 24,581 million, 2024-09-30 | USD 299 million | Financial foundation (CP-1) |
| K11 | Sum | Term loans 8,702 + secured notes 2,100 + 2,750 + 1,450 + 1,000 + 2,200 + 1,500, principal | USD 19,702 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K12 | Sum | Subordinated notes 2,650 + 1,200 + 750, principal | USD 4,600 million | Financial foundation (CP-1) |
| K13 | Ratio | Fixed floor over grower percentage: 250 / 0.10; 450 / 0.18; 75 / 0.03; 1,000 / 0.40; 725 / 0.20 | USD 2,500 million for the first four; USD 3,625 million for securitization | d887611dex101.htm.jsonl, pages 59–62 and 180 |
| K14 | Difference | 6.75x gate less 6.02x pro forma net leverage after the 18 October 2024 dividend (reported EBITDA) | 0.73x | d887611dex101.htm.jsonl, page 181; Financial foundation (CP-1) |
| K15 | Difference | 7.25x gate less 6.02x | 1.23x | d887611dex101.htm.jsonl, page 60; Financial foundation (CP-1) |
| K16 | Difference | 6.02x less 5.75x gate | 0.27x | d887611dex101.htm.jsonl, page 63; Financial foundation (CP-1) |

## Gaps

| Gap | Severity | What is missing | Effect on conclusion | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement and six joinders | Enforcement control, standstill and turnover between secured classes not established | d887611dex41.htm.jsonl, page 30 |
| Compliance evidence | MATERIAL | Compliance certificate, covenant EBITDA, covenant net debt, basket usage | Ratio headroom and remaining basket capacity not calculable | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Security and other debt documents | MATERIAL | Guarantee and collateral agreement, security schedules, 2028–2032 secured and 2029 subordinated indentures, securitization agreement, guarantor list | Collateral map partial; note-level covenants inferred | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–61 |
| Amendment clause and voting | MINOR | Required Lenders definition and remainder of the amendment clause | Uptier view theoretical | d887611dex101.htm.jsonl, pages 204–206 |
| MFN sunset dates | MINOR | Effective dates of the amendments that start each 18-month MFN period | No dated sunset event; sunset is 18 months after each amendment's effective date | d887611dex101.htm.jsonl, page 144 |
| Indenture governing law and amendment thresholds | MINOR | Governing-law and amendment articles of the two indentures | Noteholder control mechanics not established | d887611dex41.htm.jsonl, page 2 |
| Refinancing and liability-management overlay | Scope | No refinancing and liability-management assessment was supplied to this review | Exchange-offer capacity read only from the amendment clause | Source readiness (CP-0) |
| Market-norm comparison | Scope | No covenant-review report or comparable covenant dataset | Market-relative judgements not made | Source readiness (CP-0) |

## Next module
The orchestrator selects the next module.
