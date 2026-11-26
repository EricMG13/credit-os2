## Request
TransDigm Group Incorporated (borrower and note issuer TransDigm Inc.), as of 2024-09-30, under the deep_credit_assessment pathway. Scope: interpret the executed credit agreement as conformed through the September 2024 amendment, the 2033 secured notes indenture and the 2027 senior subordinated notes indenture for covenant protection, debt and leakage capacity, guarantee and collateral reach, structural priority and intercreditor control.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of the springing covenant, compliance statement, latest covenant-affecting amendment, guarantor structure and combined guarantor summary, facility and note terms |
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, with annexed conformed second amended and restated credit agreement | 2024-09-19 (agreement date stated; filing date not stated) | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling loan text: definitions, debt, lien, investment and dividend permissions, springing covenant, incremental and MFN terms, amendment and release mechanics, agency enforcement, guarantor joinder and pledge terms |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 | 2024-09-19 (indenture date stated; filing date not stated) | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants, intercreditor reference and control clause, holder enforcement limits, amendment and collateral-release thresholds |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13 (indenture date stated; filing date not stated) | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, payment blockage and governing law of the subordinated notes |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted issuer, date and source set; identification of earlier credit-agreement versions and missing legal documents |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying and principal debt, cash, EBITDA As Defined, interest, total assets, October 2024 pro forma net debt; inputs to covenant proxies |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Distribution and acquisition history used as demonstrated-capacity evidence; parent and borrower identity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Supported-only earnings comparator for the covenant EBITDA definition |

## Findings

### Bottom line
TransDigm's debt documents protect creditors through payment-priority and release consents rather than leverage limits: equity can still draw value through a 6.75x net-leverage dividend permission and 5.00x pari secured debt capacity, so financial-policy PD and first-lien dilution, not covenant default, drive creditor risk.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 59

On an issuer-earnings proxy after the October 2024 dividend, net leverage is 5.50x and secured net leverage 4.22x, leaving about 1.25x of dividend room and 0.78x of pari secured debt room; the only maintenance test springs for revolver lenders above USD 364 million of usage. Secured noteholders hold each-holder protection against adverse ranking changes, while the loan amendment clause contains no express subordination consent right. Subordinated noteholders carry the recovery risk through contractual subordination, payment blockage of up to 179 days and structural subordination to non-guarantor subsidiaries producing about 20.73% of sales. Exact capacity is not established: covenant earnings, compliance certificates, basket usage and the intercreditor agreement are not supplied.
Basis: calculation L05; calculation L07; calculation L10; calculation L12; calculation L02; calculation L15; d887611dex41.htm.jsonl, pages 117–118; d826058dex41.htm.jsonl, pages 106–107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Key findings
- **The binding limit on further distributions is the credit agreement's uncapped ratio dividend permission, not the bonds.** Any restricted payment is allowed with no default and pro forma net leverage at or below 6.75x. The 2033 secured notes allow unlimited payments while fixed charge coverage exceeds 2.00x, against a proxy of 3.35x, so the notes add little restraint while the term loans are outstanding. Using the Financial foundation's pro forma net debt of USD 22,967 million after the October 2024 dividend payment (year-end USD 18,619 million, unchanged by the October 2024 securitization draw), the proxy is 5.50x versus 4.46x at year-end: the USD 4,348 million payment used about 1.04x of leverage room and about 1.25x remains.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75; Financial foundation (CP-1); calculation L04; calculation L05; calculation L08; calculation L10; calculation L13; calculation L14
- **Maintenance protection does not exist for term lenders or noteholders.** The 7.50x net-leverage test (8.00x for four quarters after a material acquisition) applies only to revolver lenders, only when revolver exposure exceeds 40% of commitments, and can be amended by Required Revolving Lenders alone. With USD 67 million of letters of credit against USD 910 million of commitments, usage is 7.36% and USD 297 million can be drawn before the test springs; on the proxy, issuer earnings would need to fall about 26.62% before 7.50x is reached.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation L01; calculation L03; calculation L22
- **Debt capacity favours pari passu dilution, and it is the nearest pressure point.** Pari secured ratio debt is permitted to 5.00x secured net leverage and junior or unsecured debt to 7.25x; the proxy leaves 0.78x and 1.75x respectively, and a decline of about 15.55% in issuer earnings would close pari secured capacity. The 50 bp MFN switches off for acquisition debt, for debt maturing more than 18 months after the protected tranche, and for the Tranche L class once 18 months pass from the September 2024 amendment's effective date. The agent must, on borrower request, extend collateral documents to new pari or junior secured debt without lender consent.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 144–145; d887611dex101.htm.jsonl, page 205; calculation L07; calculation L11; calculation L12; calculation L23
- **Ranking protection is stronger for secured noteholders than for term lenders.** The 2033 indenture requires each affected holder's consent to change ranking adversely and two-thirds of holders to release all or substantially all collateral or adversely modify the intercreditor agreement. The loan agreement requires every lender for pro rata sharing changes, release of all or substantially all collateral and release of material guarantors, and permits non-pro-rata prepayment only through offers to all lenders of a class; it lists no express each-lender right against subordination of the loans or their liens.
Basis: d887611dex41.htm.jsonl, pages 117–118; d887611dex101.htm.jsonl, pages 204–206
- **Drop-down risk is bounded by designation design but not by basket size.** Only newly acquired or newly formed subsidiaries holding no shares of, or liens on, other group companies may be designated unrestricted, which shields existing operating subsidiaries. Investment capacity is wide: unrestricted-subsidiary investments up to the greater of USD 250 million and 10% of covenant EBITDA (about USD 417.30 million on the issuer-earnings proxy) and a general basket of the greater of USD 500 million and 25% of total assets (about USD 6,396.50 million on group total assets).
Basis: d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 61–62; calculation L17; calculation L18
- **Subordinated noteholders bear the recovery risk.** Their notes are subordinated to all senior debt, face payment blockage of up to 179 days in any 360 days, and are structurally subordinated to non-guarantor liabilities. Non-guarantor subsidiaries account for about USD 1,646 million of sales and about USD 2,233 million of goodwill outside the guarantor summary.
Basis: d826058dex41.htm.jsonl, pages 106–107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation L15; calculation L16
- **Covenant earnings are more generous than the issuer's adjusted measure, so proxies understate legal capacity.** Covenant EBITDA adds back uncapped integration and restructuring costs, transaction expenses and dividend-equivalent payments, excludes non-cash compensation, and allows projected cost savings up to 25% (loans) or 35% (2033 notes) of covenant EBITDA. The Earnings quality review supports only USD 3,813 million of the issuer's USD 4,173 million.
Basis: d887611dex101.htm.jsonl, pages 24–27; Earnings quality (CP-1D)

### Contrary evidence and what would change the view
The strongest counter-case is that every ratio test sits well inside its limit even after the record distribution, the issuer reports full covenant compliance, and the package retains real protections: domestic restricted subsidiaries must guarantee and grant liens within 20 business days, first-tier foreign voting equity is pledged at 65%, releasing material guarantors or substantially all collateral needs every lender, non-pro-rata loan prepayments require an offer to the whole class, and existing subsidiaries cannot be designated unrestricted. On that reading, risk is ordinary releveraging by a cash-generative issuer, not a trapdoor. The view would soften if the intercreditor agreement showed term-lender enforcement control with a short noteholder standstill and anti-priming terms, if a compliance certificate showed covenant headroom used for debt reduction, or if dividends paused while secured leverage fell. It would harden on a revolver draw above USD 364 million, another debt-funded dividend, an unrestricted-subsidiary designation or investment into a newly formed subsidiary, or a Required Lender amendment touching payment priority.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, pages 173–174; d887611dex101.htm.jsonl, pages 205–206; d887611dex101.htm.jsonl, page 81

### Limitations
- The First Lien Intercreditor Agreement dated 2019-02-13 and its joinders are not in the source set, so who directs enforcement of the shared collateral, any noteholder standstill and turnover terms are not established; the enforcement-control and release conclusions rest only on the loan agency clause and the 2033 indenture, and the uptier finding stays theoretical rather than demonstrated.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 135
- No compliance certificate or covenant EBITDA calculation is supplied, so every headroom figure is a proxy on issuer EBITDA As Defined and consolidated carrying debt; the direction of the conclusions holds, but the exact distance to each test and any dollar capacity remain unproven, and broader covenant add-backs mean the proxies probably understate room.
Basis: d887611dex101.htm.jsonl, pages 24–27; Financial foundation (CP-1)
- Basket usage history is not supplied, so remaining capacity of fixed and grower baskets is not established and leakage severity is scored on gross permissions, which could overstate leakage risk if baskets are already used.
Basis: Source readiness (CP-0)
- Indentures for the 2028, 2029, 2030, 2031 and 2032 secured notes and both 2029 subordinated notes, plus the current guarantee and collateral agreement, are not supplied; their terms are taken from the annual report description, so class-level amendment thresholds and release mechanics for those notes are not confirmed.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58; Source readiness (CP-0)

### Creditor implication
Overall the package scores 4 on the five-point aggressiveness scale: covenant-lite for term lenders and noteholders, ratio-based dividends without a dollar cap, generous earnings definitions and a weak MFN, offset by sound sacred rights, a restrictive designation rule and comprehensive domestic guarantees. The primary PD channel is financial policy: debt-funded distributions can lift leverage toward 6.75x while operating results remain sound, and no lender test fires until revolver usage passes 40%. The primary LGD channel is dilution of the first-lien pool by new pari secured debt and, for subordinated holders, blockage plus structural subordination. For security selection the decisive legal point is that secured classes share collateral pari passu under an unsupplied intercreditor agreement, while the subordinated notes sit behind both secured debt and non-guarantor creditors.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 181–188; d826058dex41.htm.jsonl, pages 106–107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58

### Nearest pressure point
The nearest pressure point is pari secured ratio debt capacity, measured by secured net leverage against the 5.00x limit. It funded the September 2024 recapitalisation alongside cash, it is the tightest ratio on the proxy at 0.78x of room, and its use both raises PD through higher debt service and lowers first-lien recovery by enlarging the pari pool. Monitor new secured issuance, incremental term-loan requests and secured net leverage in quarterly reporting; a compliance certificate with covenant EBITDA and unrestricted cash would tighten the view.
Basis: d887611dex101.htm.jsonl, page 59; Business & governance (CP-1A); calculation L07; calculation L12

### Downside path
The initiating condition is a fall in aftermarket demand while distributions continue. Earnings decline first, shrinking ratio permissions before any default; the issuer could still draw the revolver up to USD 364 million without a test. Financial transmission comes when liquidity needs exceed that amount: the 7.50x test then applies, and on the proxy roughly 26.62% of earnings must be lost before breach. Breach gives revolver lenders alone an acceleration right; cross-default to other debt applies above USD 50 million of material indebtedness. Observable triggers are revolver draws approaching USD 364 million, secured net leverage above 5.00x on reported figures, and any blockage notice to subordinated noteholders.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L02; calculation L22

### Capital structure

| Instrument | Rank and security | Principal or commitment | Maturity | Governing document in source set | Source |
|---|---|---|---|---|---|
| Revolving credit facility | First-lien secured; pari with term loans and secured notes | USD 910 million commitment; USD 67 million letters of credit; USD 843 million available | 2029-02-27 | Credit agreement conformed through September 2024 amendment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K and L | First-lien secured; quarterly principal of USD 22 million in aggregate | USD 8,702 million | 2028-08-24 to 2032-01-19 | Credit agreement conformed through September 2024 amendment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Secured notes due 2028 to 2033 | First-lien secured; equal payment rank with credit facilities | USD 11,000 million | 2028-08-15 to 2033-01-15 | Only the 2033 indenture supplied | Financial foundation (CP-1); calculation L19 |
| Senior subordinated notes due 2027 and 2029 | Unsecured; contractually subordinated to senior debt | USD 4,600 million | 2027-11-15 to 2029-05-01 | Only the 2027 indenture supplied | Financial foundation (CP-1); calculation L19 |
| Trade receivable securitization facility | Securitization entity debt; legal rank not established | USD 487.5 million drawn of USD 650 million | 2025-07-11 | Facility agreement not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Finance leases and government advances | Legal rank not established | USD 262 million and USD 17 million carrying value | Various | Not supplied | Financial foundation (CP-1) |

### Covenant tests and headroom

| Test | Limit | Proxy level | Headroom | What it governs | Source |
|---|---|---|---|---|---|
| Springing revolver net leverage, year-end | 7.50x | 4.46x | 3.04x | Revolver lenders only; applies above 40% usage | d887611dex101.htm.jsonl, page 188; calculation L09 |
| Revolver usage trigger | 40.00% | 7.36% | 32.64% | Whether the 7.50x test applies | d887611dex101.htm.jsonl, page 188; calculation L01; calculation L24 |
| Ratio dividend permission, pro forma October 2024 | 6.75x | 5.50x | 1.25x | Uncapped restricted payments | d887611dex101.htm.jsonl, page 181; calculation L10 |
| Junior or unsecured ratio debt and incremental facilities | 7.25x | 5.50x | 1.75x | New junior, unsecured and incremental debt | d887611dex101.htm.jsonl, page 59; calculation L11 |
| Pari secured ratio debt | 5.00x | 4.22x | 0.78x | New first-lien debt and incremental facilities | d887611dex101.htm.jsonl, page 59; calculation L12 |
| 2033 notes ratio lien | 5.25x | 4.22x | 1.03x | Liens for ratio debt under the 2033 indenture | d887611dex41.htm.jsonl, page 43; calculation L12 |
| Indenture fixed charge coverage | 2.00x | 3.35x | 1.35x | Indenture ratio debt and unlimited restricted payments | d887611dex41.htm.jsonl, pages 75–79; calculation L13 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Springing revolver net leverage, year-end proxy | 7.50 | 4.46 | 3.04x | Passes at or below | x | Credit agreement revolver covenant; proxy is Financial foundation net debt over issuer EBITDA As Defined, not a certified covenant figure; test not currently sprung |
| Revolver usage trigger for the springing test | 40.00 | 7.36 | 32.64% | Passes at or below | % | Letters of credit over commitments; any cash-collateralised letters of credit would be excluded, which is not established |
| Ratio dividend permission, pro forma October 2024 | 6.75 | 5.50 | 1.25x | Passes at or below | x | Pro forma net debt after the October 2024 dividend over issuer EBITDA As Defined; covenant EBITDA and unrestricted cash not supplied |
| Junior or unsecured ratio debt and incremental facilities | 7.25 | 5.50 | 1.75x | Passes at or below | x | Same proxy; incremental facilities also need the 5.00x secured test |
| Pari secured ratio debt | 5.00 | 4.22 | 0.78x | Passes at or below | x | Carrying secured debt less all cash plus the dividend payment; principal basis gives 4.26x |
| 2033 notes ratio lien | 5.25 | 4.22 | 1.03x | Passes at or below | x | Indenture definition uses its own covenant EBITDA with 35% cost-savings cap; proxy only |
| Indenture fixed charge coverage | 2.00 | 3.35 | 1.35x | Passes above | x | Issuer EBITDA As Defined over interest expense excluding debt-cost amortisation; full-year interest on September 2024 debt not included |

All current values are this analysis's proxies on issuer earnings and consolidated balances, not covenant calculations or a compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement dated | Historical — "First Lien Intercreditor Agreement, dated as of February 13, 2019" | d887611dex41.htm.jsonl, page 30 | Controls the 2033 notes in any conflict; document itself not supplied |
| 2019-11-13 | day | 2019-11-13 | 2027 senior subordinated notes indenture executed | Historical — "INDENTURE Dated as of November 13, 2019" | d826058dex41.htm.jsonl, page 1 | Sets subordination and payment blockage for USD 2,650 million of notes |
| 2024-03-22 | day | 2024-11-07 | Most recent credit agreement amendment affecting restrictive covenants | Historical — "Amendment No. 15, executed on March 22, 2024" | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Covenant text reviewed through the conformed September 2024 annex; standalone amendment not supplied |
| 2024-09-19 | day | 2024-09-19 | Credit agreement amendment adding USD 1,500 million Tranche L term loans | Historical — "AMENDMENT NO. 17 AND INCREMENTAL TERM LOAN ASSUMPTION AGREEMENT dated as of September 19, 2024" | d887611dex101.htm.jsonl, page 1 | Used incremental capacity to fund the special dividend; starts the Tranche L MFN clock |
| 2024-09-19 | day | 2024-09-19 | 2033 senior secured notes indenture executed | Historical — "INDENTURE Dated as of September 19, 2024" | d887611dex41.htm.jsonl, page 1 | Added USD 1,500 million to the pari first-lien pool |
| 2024-09-19 | day | 2024-09-19 | Sixth joinder to the First Lien Intercreditor Agreement | Historical — "Joinder No. 6, dated September 19, 2024" | d887611dex41.htm.jsonl, page 30 | Brings the 2033 notes into the shared first-lien arrangement |
| 2025-07-11 | day | 2024-11-07 | Securitization facility maturity | Scheduled — "extend the maturity date to July 11, 2025" | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Earliest maturity; reduces the 2033 notes credit-facility basket while outstanding |
| 2027-09-15 | day | 2024-09-19 | First optional call date of the 2033 secured notes | Scheduled — "Initial Redemption Date means September 15, 2027" | d887611dex41.htm.jsonl, page 30 | Earliest non-make-whole refinancing of the 2033 notes |
| 2027-11-15 | day | 2024-11-07 | Maturity of the 2027 senior subordinated notes | Scheduled — "November 15, 2027" | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | First note maturity; subordinated holders exposed to blockage before it |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity | Scheduled — "The maturity date of the revolving credit facility is February 27, 2029" | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | Ends the only maintenance covenant unless extended |
| 2032-01-19 | day | 2024-11-07 | Tranche L term loan maturity | Scheduled — "January 19, 2032" | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | Defines the outer MFN carve-out window for Tranche L |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 7 |
| Calculated | 2 |
| Assumption-Based | 1 |
| Analyst Inference | 2 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 2 |
| Fields present | 32 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 2 |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Owns all capital stock | Ownership | TransDigm Inc. | Annual report; Delaware entities per Business & governance |
| TransDigm Group Incorporated | Guarantees loan obligations | Guarantee | Senior secured credit facilities | Sept 2024 amendment reaffirmation; New York law |
| Domestic Restricted Subsidiaries | Must join as guarantors | Guarantee | Senior secured credit facilities | Credit agreement joinder clause p.173; New York law |
| Domestic Restricted Subsidiaries | Grant liens on Collateral | Security | Senior secured credit facilities | Credit agreement p.173; New York law |
| Loan Parties | Pledge 65% voting foreign equity | Security | Senior secured credit facilities | Credit agreement p.174; New York law |
| TransDigm Group Incorporated | Guarantees on senior secured basis | Guarantee | Secured notes 2028 to 2033 | Annual report p.58; indenture New York law |
| Domestic Restricted Subsidiaries | Guarantee secured notes | Guarantee | Secured notes 2028 to 2033 | Annual report p.58; indenture New York law |
| TransDigm UK | Guarantees subordinated notes | Guarantee | Senior subordinated notes | Annual report p.57; UK entity, NY-law indenture |
| Non-guarantor subsidiaries | Their creditors rank first on their assets | Structural claim | Secured and subordinated notes | Annual report p.58; US filing |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facilities | Equal payment rank | Payment rank | Secured notes 2028 to 2033 | Annual report p.58; New York law documents |
| Secured notes 2028 to 2033 | Senior in right of payment | Payment rank | Senior subordinated notes | Annual report p.58; 2027 indenture p.106, NY law |
| Senior secured credit facilities | Share first lien under 2019 ICA | Security rank | 2033 secured notes | 2033 indenture p.30; ICA not supplied |
| Credit agreement collateral agent | Sole right to proceed on Collateral | Enforcement control | Credit agreement lenders | Credit agreement p.197; New York law |
| Notes collateral agents | Holders barred from direct enforcement | Enforcement control | 2033 secured noteholders | 2033 indenture p.128; New York law |
| Designated senior debt | Blocks payments up to 179 days | Standstill | Senior subordinated notes | 2027 indenture p.107; New York law |
| Each credit agreement lender | Consent to release all Collateral | Release | Credit agreement Collateral | Credit agreement p.205; New York law |
| Two-thirds of 2033 noteholders | Consent to release all Collateral | Release | 2033 notes Collateral | 2033 indenture p.118; New York law |

### Analytical appendix — complete canonical registers

All monetary amounts are USD millions unless stated. Covenant proxies use issuer EBITDA As Defined and consolidated balances; they are not covenant calculations.

#### Evidence references

| Evidence ID | Evidence | Source |
|---|---|---|
| E01 | Springing 7.50x covenant above 40% usage (USD 364 million); compliance at 2024-09-30; incremental conditions 7.25x and 5.00x; acceleration and collateral rights including over cash; right to block note payments | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| E02 | Restrictive covenant summary; Amendment No. 15 of 2024-03-22 is latest covenant-affecting amendment; compliance with note covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| E03 | Guarantor and ranking description; structural subordination of notes to non-guarantor liabilities; TD Group has no significant separate assets | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58 |
| E04 | Combined guarantor summary (sales USD 6,294 million; goodwill USD 8,186 million); term loans USD 8,702 million; revolver USD 910 million, letters of credit USD 67 million, availability USD 843 million; no SOFR floor | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| E05 | Financial covenant 7.50x (8.00x after Material Acquisition) above 40% revolver exposure; amendable only by Required Revolving Lenders; payment default grace periods | d887611dex101.htm.jsonl, page 188 |
| E06 | Restricted payments: basket (7) greater of USD 75 million and 3.0% of Consolidated EBITDA; historical clause (10); uncapped payments at 6.75x net leverage with no default | d887611dex101.htm.jsonl, pages 180–181 |
| E07 | Permitted Indebtedness (12) pari secured at 5.00x and junior or unsecured at 7.25x with maturity, life, obligor and collateral conditions; (13) greater of USD 250 million and 10.0%; (14) foreign greater of USD 450 million and 18.0%; (17) subordinated at 7.25x; (18) securitization greater of USD 725 million and 20.0% | d887611dex101.htm.jsonl, pages 59–60 |
| E08 | MFN 50 bp yield test with OID over lesser of average life and four years; carve-outs by tranche including Tranche L (acquisition debt, after 18 months from effective date, maturity beyond 18 months after Tranche L maturity); more-favourable incremental terms incorporated for existing lenders | d887611dex101.htm.jsonl, pages 144–145 |
| E09 | Amendments by Required Lenders; each-lender items for principal, rate, maturity, pro rata sharing, voting thresholds, material guarantor release, release of all or substantially all Collateral; agent extends collateral to pari or junior Specified Secured Indebtedness on borrower request; non-pro-rata prepayment only via class-wide offers; automatic lien release on permitted sale to non-Loan Party | d887611dex101.htm.jsonl, pages 204–206 |
| E10 | Agent sole right to proceed against Collateral; credit bid; lenders bound by Collateral Documents and intercreditor agreements | d887611dex101.htm.jsonl, page 197 |
| E11 | Permitted Investments: (1)(c) unrestricted subsidiaries greater of USD 250 million and 10.0%; (10) greater of USD 500 million and 25.0% of Total Assets; (11) joint ventures greater of USD 1,000 million and 40.0% at 7.00x; unlimited investments among Restricted Subsidiaries; reclassification of debt and Limited Condition Acquisition test date | d887611dex101.htm.jsonl, pages 61–62 |
| E12 | Unrestricted Subsidiary designation limited to newly acquired or newly formed subsidiaries holding no stock of or liens on other subsidiaries; certification against restricted-payment and investment covenants; no recourse debt; Unrestricted Cash definition | d887611dex101.htm.jsonl, page 81 |
| E13 | Joinder of Domestic Subsidiaries (excluding Immaterial, Unrestricted and Securitization Entities) within 20 Business Days; 100% domestic and 65% voting foreign equity pledge; Unrestricted Subsidiary equity excluded | d887611dex101.htm.jsonl, pages 173–174 |
| E14 | Consolidated EBITDA add-backs including uncapped restructuring and integration, transaction costs, dividend equivalent payments, cost savings capped at 25.0%; Consolidated Net Income excludes non-cash and deferred compensation; Consolidated Net Leverage and Secured Net Debt Ratio net all Unrestricted Cash | d887611dex101.htm.jsonl, pages 24–27 |
| E15 | Material Indebtedness threshold above USD 50 million; judgment default above USD 50 million | d887611dex101.htm.jsonl, page 52; d887611dex101.htm.jsonl, page 190 |
| E16 | Credit agreement and amendment governed by New York law; September 2024 amendment date | d887611dex101.htm.jsonl, page 1; d887611dex101.htm.jsonl, page 8; d887611dex101.htm.jsonl, page 222 |
| E17 | First Lien Intercreditor Agreement dated 2019-02-13 with joinders to 2024-09-19; 2033 notes Initial Redemption Date 2027-09-15 | d887611dex41.htm.jsonl, page 30 |
| E18 | 2033 indenture Credit Facilities basket USD 3,100.0 million less securitization debt and asset-sale paydowns | d887611dex41.htm.jsonl, page 33 |
| E19 | 2033 indenture ratio-debt liens at 5.25x Consolidated Secured Net Debt Ratio | d887611dex41.htm.jsonl, page 43 |
| E20 | 2033 indenture unlimited restricted payments above 2.0x fixed charge coverage with no default | d887611dex41.htm.jsonl, page 75 |
| E21 | 2033 indenture ratio debt above 2.0x fixed charge coverage; non-guarantor ratio debt capped at USD 400.0 million | d887611dex41.htm.jsonl, page 79 |
| E22 | 2033 indenture: majority amendments; each-holder items including adverse ranking or subordination changes; 66⅔% for release of all or substantially all Collateral or adverse intercreditor modification | d887611dex41.htm.jsonl, pages 117–118 |
| E23 | Holders may not directly enforce Security Documents; Intercreditor Agreement controls in conflict | d887611dex41.htm.jsonl, page 128; d887611dex41.htm.jsonl, page 135 |
| E24 | 2033 indenture date and New York governing law | d887611dex41.htm.jsonl, page 1; d887611dex41.htm.jsonl, page 126 |
| E25 | 2027 notes subordinated to all Senior Debt; pari with Senior Subordinated Debt; payment default bar; blockage up to 179 days, one per 360 days, 181 days free | d826058dex41.htm.jsonl, pages 106–107 |
| E26 | 2027 indenture date and New York governing law | d826058dex41.htm.jsonl, page 1; d826058dex41.htm.jsonl, page 124 |
| E27 | Carrying and principal debt, cash, EBITDA As Defined, interest, total assets and pro forma net debt | Financial foundation (CP-1) |
| E28 | September 2024 debt-funded dividend and FY2024 distributions and acquisitions | Business & governance (CP-1A) |
| E29 | Supported-only EBITDA USD 3,813 million versus issuer USD 4,173 million | Earnings quality (CP-1D) |
| E30 | Source inventory; missing note indentures, collateral, intercreditor and compliance documents | Source readiness (CP-0) |

#### T4.1 Source gate and module status

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement conformed through the September 2024 amendment | Executed; conformed annex with marked changes | 1 | Collateral Documents, schedules and standalone earlier amendments not reviewed | Completed with Limitations |
| 2033 secured notes indenture | Executed | 1 | Other five secured indentures not supplied | Completed with Limitations |
| 2027 subordinated notes indenture | Executed | 1 | Two 2029 subordinated indentures not supplied | Completed with Limitations |
| First Lien Intercreditor Agreement | Not supplied | 2 | Referenced only | Completed with Limitations |
| Compliance certificate | Not supplied | 3 | No covenant EBITDA or basket usage | Completed with Limitations |
| Annual report | Filed after assessment date | Supporting financial input | Retrospective issuer description | Completed with Limitations |

#### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as conformed in Annex I of Amendment No. 17 | Credit agreement | 2014-06-04 base, conformed to 2024-09-19 | Executed amendment; annex marks changes | Controls all loan covenants, capacity and agency | Binding constraint on distributions and secured debt while term loans are outstanding | E05; E16 |
| 1 | Amendment No. 17 and incremental term loan assumption agreement | Credit agreement amendment | 2024-09-19 | Executed | Adds USD 1,500 million Tranche L; reaffirms guarantees and liens | Demonstrates incremental capacity used for the dividend | E16 |
| 1 | Indenture, 2033 senior secured notes | Indenture | 2024-09-19 | Executed | Controls 2033 note covenants, enforcement limits and voting | Ranking and release protections for one secured class | E24 |
| 1 | Indenture, 2027 senior subordinated notes | Indenture | 2019-11-13 | Executed | Controls subordination and blockage | Recovery mechanics for the largest subordinated class | E26 |
| 1 | Earlier credit agreement versions (2013, 2014 restatements; June 2024 amendment) | Superseded credit agreement text | 2013-02-28; 2014-06-04; 2024-06-04 | Executed; superseded by conformed annex | Provenance only | No provision relied on where the conformed annex governs | E30 |
| 2 | First Lien Intercreditor Agreement and joinders | Intercreditor agreement | 2019-02-13; joinder 2024-09-19 | Not in source set | Controls lien priority and enforcement among first-lien classes | [Insufficient Information] — ICA not in the source set; enforcement direction and standstill not established | E17 |
| Supporting | Annual report on Form 10-K | Issuer financial filing | 2024-11-07 | Filed after assessment date | Compliance statement and guarantor description | Corroborates structure; not a legal instrument | E01; E03 |

#### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | 7.50x net leverage (8.00x for four quarters after Material Acquisition), only if revolver exposure exceeds 40% of commitments; revolver lenders only | Credit agreement 6.14 | No early warning for term lenders or noteholders; revolver lenders alone can amend | Negative — Covenant Erosion | No comparative source; not assessed | E05 |
| Restricted payments | Uncapped at 6.75x pro forma net leverage and no default; general basket greater of USD 75 million and 3.0% of Consolidated EBITDA | Credit agreement 6.02 | Debt-funded dividends permitted while leverage below threshold | Negative — Leverage Increase | No comparative source; not assessed | E06 |
| Ratio debt | Pari secured at 5.00x secured net; junior or unsecured at 7.25x net; maturity and life no earlier than term loans; Loan Parties only | Credit agreement Permitted Indebtedness (12) | Dilutes first-lien pool; layering behind secured debt | Negative — Leverage Increase | No comparative source; not assessed | E07 |
| Fixed and grower debt baskets | General greater of USD 250 million and 10.0%; foreign greater of USD 450 million and 18.0%; securitization greater of USD 725 million and 20.0% | Credit agreement Permitted Indebtedness (13), (14), (18) | Grower baskets rise with add-back-inflated EBITDA; foreign debt structurally senior to Loan Parties | Negative — Leverage Increase | No comparative source; not assessed | E07 |
| Incremental and MFN | Incremental at 7.25x net and 5.00x secured; MFN 50 bp, off for acquisition debt, long-dated debt and after 18 months for Tranche L | Credit agreement 2.24 | Repricing protection lapses; incremental pari debt | Negative — Leverage Increase | No comparative source; not assessed | E01; E08 |
| EBITDA definition | Uncapped restructuring and integration, transaction costs, dividend equivalents; cost savings 25.0% | Credit agreement Consolidated EBITDA (d)–(m); Consolidated Net Income (11) | Inflates every ratio and grower basket | Negative — Covenant Erosion | No comparative source; not assessed | E14 |
| Investments and unrestricted subsidiaries | USub investments greater of USD 250 million and 10.0%; general greater of USD 500 million and 25.0% of Total Assets; designation only of new subsidiaries | Credit agreement Permitted Investments; Unrestricted Subsidiary definition | Value transfer outside guarantors possible; existing subsidiaries protected | Negative — Covenant Erosion | No comparative source; not assessed | E11; E12 |
| Guarantees and collateral | Domestic subsidiaries join within 20 Business Days; 65% voting foreign pledge; automatic release on permitted sale | Credit agreement 5.11; 9.02(c) | Foreign value only partly reachable; releases follow permitted disposals | Neutral — Stable | No comparative source; not assessed | E13; E09 |
| Amendments | Required Lenders generally; each lender for money terms, pro rata sharing, voting, material guarantors, substantially all collateral | Credit agreement 9.02(b) | No express each-lender subordination right | Negative — Covenant Erosion | No comparative source; not assessed | E09 |
| Events of default | Interest grace 5 Business Days; cross-default and judgments above USD 50 million; financial covenant default for revolver lenders | Credit agreement Article VII | Term lenders cannot accelerate for leverage alone | Neutral — Stable | No comparative source; not assessed | E05; E15 |
| 2033 notes covenants | Ratio debt and unlimited RP above 2.0x coverage; ratio liens to 5.25x; 35.0% cost-savings cap | 2033 indenture 4.07, 4.09, Permitted Liens | Looser than loan covenants; govern if loans are repaid | Negative — Covenant Erosion | No comparative source; not assessed | E19; E20; E21 |
| 2033 notes voting | Each holder for adverse ranking change; 66⅔% for release of substantially all collateral or adverse intercreditor change | 2033 indenture 9.02 | Strong anti-subordination protection | Neutral — Stable | No comparative source; not assessed | E22 |
| Subordinated notes | Subordination to all Senior Debt; 179-day blockage once per 360 days | 2027 indenture 10.01–10.03 | Payment stops on senior default | Negative — Refinancing Risk | No comparative source; not assessed | E25 |

#### Definition conflict register

| Definition | Covenant basis | Financial foundation basis | Figures | Treatment | Evidence ID |
|---|---|---|---|---|---|
| Debt in leverage ratios | Consolidated Total Indebtedness and Consolidated Secured Debt of the Borrower less Unrestricted Cash | Carrying value of balance-sheet debt less all reported cash | Pro forma net leverage proxy 5.50x on carrying debt 22,967 versus 5.55x on principal 23,155; secured proxy 4.22x on carrying 17,621 versus 4.26x on principal 17,789 | Carrying proxy shown in headroom tables; principal shown as conflict; neither is the legal figure | E14; E27; L05; L20; L21 |
| EBITDA | Consolidated EBITDA with uncapped integration and transaction add-backs and 25.0% cost savings | Issuer EBITDA As Defined 4,173; supported-only 3,813 | Covenant figure not disclosed | Issuer measure used as proxy because the annual report describes the covenant on that basis | E01; E14; E29 |
| Cash netting | Unrestricted Cash of Holdings, Borrower and Restricted Subsidiaries, uncapped | All reported cash 6,261 | Restricted amounts not separately disclosed | All cash netted in proxy; may overstate netting | E12; E27 |
| Non-debt funding | Contract liabilities and dividend payable are not Indebtedness in the reviewed definitions | Contract liabilities 177; dividend payable 4,216 at year-end | Outside covenant debt | Float outside every ratio; dividend payment raises net debt instead | E27 |

#### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio dividend permission | Uncapped at 6.75x with no default | Debt-funded distributions without lender consent | Higher: leverage can rise while operations are sound | Indirect: cash leaves before any distress | Dividend declarations and pro forma leverage | E06 |
| Pari secured debt | Permitted to 5.00x secured net | Enlarges first-lien pool | Higher debt service | Lower first-lien recovery per dollar | Secured issuance and incremental requests | E07 |
| Springing covenant | 7.50x only above 40% usage | No test until liquidity stress | No early default trigger for term lenders | Later intervention lowers recoveries | Revolver draws versus USD 364 million | E05 |
| MFN carve-outs | 50 bp, lapsing after 18 months for Tranche L | Repricing protection weakens | Neutral to lower: cheaper incremental debt | Neutral | Incremental pricing after the lapse | E08 |
| Amendment rights | No express each-lender subordination right in loans | Required Lenders could support priming if ICA permits | Low near term | Potentially severe for non-participating lenders | Amendment filings | E09 |
| Subordination and blockage | 179-day blockage; subordination to Senior Debt | Junior payments stop on senior default | Junior default sooner than senior | Junior recovery after senior and non-guarantor claims | Blockage notices | E25 |
| Non-guarantor value | About USD 1,646 million of sales outside guarantors | Creditors of those subsidiaries rank first on their assets | Neutral | Lower recoveries for all notes | Guarantor summary each year | E03; E04 |

#### T4.10 Market norm and covenant review comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Market comparison | All reviewed provisions | [Insufficient Information] — no covenant-review report or market-norm source in the set | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed against market | Insufficient Information | E30 |
| Internal cross-document: restricted payments | Loans: uncapped at 6.75x net leverage | 2033 indenture: uncapped above 2.0x fixed charge coverage | Indenture much looser on the proxy | Loans bind while outstanding | Negative — Covenant Erosion | E06; E20 |
| Internal cross-document: secured debt | Loans: pari secured at 5.00x | 2033 indenture: ratio liens at 5.25x plus USD 3,100.0 million facilities basket | Indenture looser | Loans bind while outstanding | Negative — Leverage Increase | E07; E18; E19 |
| Internal cross-document: cost savings cap | Loans: 25.0% | 2033 indenture: 35.0% | Indenture looser | Different EBITDA in each document | Negative — Covenant Erosion | E14; E19 |

#### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x at 40% usage; Required Revolving Lenders amend | No term-lender trigger | Negative — Covenant Erosion | Provisional | E05 |
| Debt / lien incurrence capacity | 4 | 5.00x pari secured, 7.25x total, grower baskets, MFN with lapses | Dilution and layering without consent | Negative — Leverage Increase | Provisional | E07; E08 |
| RP / investment / leakage capacity | 4 | Uncapped RP at 6.75x; investments greater of USD 500 million and 25.0% of Total Assets; designation limited to new subsidiaries | Large extraction capacity, used in 2024 | Negative — Leverage Increase | Provisional | E06; E11; E12 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped integration and transaction add-backs; dividend equivalents; 25.0% and 35.0% savings caps | Inflates all ratio capacity | Negative — Covenant Erosion | Provisional | E14; E19 |
| Collateral / guarantor protection | 3 | Domestic joinder; 65% foreign pledge; each-lender for material guarantor and substantially all collateral | Foreign value partly outside reach | Neutral — Stable | Provisional | E09; E13 |
| Amendment / control mechanics | 3 | Each-lender sharing and voting rights; class-wide offer requirement; no express loan subordination right; notes protect ranking | Uptier not excluded in loans | Negative — Covenant Erosion | Provisional | E09; E22 |
| Overall | 4 | Weighted to extraction and debt capacity actually used in 2024 | Financial policy drives PD | Negative — Leverage Increase | Provisional | E06; E07; E28 |

#### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further debt-funded dividend | Uncapped RP at 6.75x | Proxy leaves about 1.25x | PD up; RV weaker for all classes | Track declarations and pro forma leverage | E06 |
| New pari secured issuance | 5.00x secured net test | Proxy leaves about 0.78x | LGD up for first-lien holders | Track secured issuance and incremental agreements | E07 |
| Revolver usage above USD 364 million | Springing test | Activates the only maintenance covenant | PD signal | Quarterly revolver exposure | E05 |
| MFN lapse for Tranche L | 18 months after effective date | Cheaper incremental debt without repricing | RV negative for Tranche L | Confirm effective date; monitor pricing | E08 |
| Investment into a new unrestricted subsidiary | Permitted Investments (1)(c), (10) | Value leaves guarantee and collateral net | LGD up | Board designations and officers' certificates | E11; E12 |
| Required Lender amendment on priority or sharing | 9.02(b) | No express subordination sacred right | LGD up for non-participants | Amendment filings | E09 |
| Blockage notice | 2027 indenture 10.03 | Junior payments halt up to 179 days | Junior PD up | Trustee notices | E25 |

#### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and six joinders | Determines enforcement direction, standstill and turnover | Intercreditor registers provisional | Obtain executed ICA and joinders |
| Collateral documents | Current Guarantee and Collateral Agreement and schedules | Excluded assets and release terms | Collateral map partial | Obtain current agreement and perfection schedules |
| Compliance certificate | Covenant EBITDA, Unrestricted Cash, tested ratios | Exact headroom | All headroom provisional | Obtain latest certificate |
| Basket usage | Usage of RP, investment and debt baskets | Remaining capacity | Capacity register gross only | Obtain basket tracker |
| Other indentures | 2028–2032 secured and two 2029 subordinated indentures | Class-specific voting and covenants | Class terms assumed from annual report | Obtain indentures |
| Amendment No. 15 standalone | Latest covenant-affecting amendment | Confirms conformed text | Low; conformed annex used | Obtain amendment |
| Market comparison | Covenant-review report | Norm assessment | Market column not assessed | Obtain third-party review |

#### T4D.1 Entity source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement guarantor, joinder and pledge clauses | Executed | 1 | Guarantor schedules and Collateral Documents not reviewed | Completed with Limitations |
| 2033 indenture collateral article | Executed | 1 | Security agreement and UK debenture not supplied | Completed with Limitations |
| Annual report guarantor description and combined summary | Filed | Supporting | Exhibit listing guarantors not supplied | Completed with Limitations |
| Organisation chart and subsidiary list | Not supplied | Not ranked | Entity-level debt and value missing | Completed with Limitations |
| Subsequent perimeter events | None found in reviewed pages | Not ranked | Search limited to supplied documents | Completed with Limitations |

#### T4D.2 Entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of all classes | Delaware, United States | Listed parent | Holdings, not a Restricted Subsidiary | No significant separate operations or assets | Yes, guarantor | E03; E28 |
| TransDigm Inc. | Borrower and note issuer | Delaware, United States | TransDigm Group Incorporated | Borrower | Combined with guarantors: sales USD 6,294 million; goodwill USD 8,186 million | Yes, obligor | E04 |
| Domestic Restricted Subsidiaries | Guarantors and grantors | United States | TransDigm Inc. | Restricted; newly acquired or formed ones may be designated unrestricted | Included in combined guarantor summary | Yes | E03; E12; E13 |
| TransDigm UK | Guarantor of subordinated and 2028 secured notes | United Kingdom | [Insufficient Information] — parent chain not in reviewed pages | Restricted | — not separately disclosed | Yes for notes; credit-facility status not established | E03 |
| Immaterial Subsidiaries | Excluded from joinder | United States | TransDigm Inc. group | Restricted, excluded | — not quantified; joinder required once thresholds exceeded | No | E13 |
| Foreign Subsidiaries | Non-guarantors; 65% voting equity pledged by first-tier holders | Various non-US | Loan Parties | Restricted | Part of USD 1,646 million non-guarantor sales and USD 2,233 million goodwill outside guarantor summary | No | E04; E13; L15; L16 |
| Securitization Entities | Receivables financing vehicle | United States | TransDigm Inc. group | Excluded Subsidiary | Facility drawn USD 487.5 million | No | E01; E13 |
| Unrestricted Subsidiaries | None established at review date | Not applicable: none identified | Not applicable: none identified | Designation capacity for new subsidiaries only | None established | No | E12 |

#### T4D.3 Guarantor coverage

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × credit facilities | Senior secured | Upstream | Payment in full; Holdings release needs each lender if material | E09; E16 |
| Domestic Restricted Subsidiaries × credit facilities | Senior secured via joinder | Upstream and cross-stream | Permitted sale to non-Loan Party; material guarantor release otherwise needs each lender | E09; E13 |
| Holdings × secured notes | Senior secured | Upstream | [Insufficient Information] — guarantee release clause of indentures not reviewed | E03 |
| Domestic Restricted Subsidiaries × 2029–2033 secured notes | Senior secured, while guarantor of credit facilities or USD 200 million capital markets debt | Upstream and cross-stream | Falls away if the guarantor ceases to guarantee the credit facilities and qualifying debt | E03 |
| TransDigm UK × 2028 secured notes and subordinated notes | Senior secured; senior subordinated | Cross-stream | [Insufficient Information] — release terms not reviewed | E03 |
| Holdings, TransDigm UK, Domestic Restricted Subsidiaries × subordinated notes | Senior subordinated unsecured | Upstream and cross-stream | [Insufficient Information] — 2027 indenture release clause not reviewed | E03; E25 |
| Foreign Subsidiaries × all tranches | None | Not applicable: non-guarantors | Not applicable: no guarantee | E03; E13 |

#### T4D.4 Collateral by entity

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Holdings × first lien | Unrestricted Subsidiary equity | Payment in full; all collateral needs each lender | — pledged value not disclosed | E09; E13 |
| Holdings × subordinated | Not applicable: subordinated notes unsecured | Not applicable: unsecured | Not applicable: unsecured | E03 |
| TransDigm Inc. × first lien | Unrestricted Subsidiary equity; foreign voting equity above 65% | Automatic on permitted sale to non-Loan Party | — pledged value not disclosed | E09; E13 |
| TransDigm Inc. × subordinated | Not applicable: unsecured | Not applicable: unsecured | Not applicable: unsecured | E03 |
| Domestic Restricted Subsidiaries × first lien | [Insufficient Information] — Excluded Collateral list in Guarantee and Collateral Agreement not supplied | Automatic on permitted sale; joinder within 20 Business Days | — pledged value not disclosed | E09; E13 |
| Domestic Restricted Subsidiaries × subordinated | Not applicable: unsecured guarantee | Not applicable: unsecured | Not applicable: unsecured | E03 |
| TransDigm UK × first lien | [Insufficient Information] — UK security document not supplied | [Insufficient Information] — UK security document not supplied | — pledged value not disclosed | E03 |
| TransDigm UK × subordinated | Not applicable: unsecured | Not applicable: unsecured | Not applicable: unsecured | E03 |
| Foreign Subsidiaries × first lien | Assets not pledged; 35% of voting equity unpledged | Not applicable: no asset lien | Only first-tier equity pledge | E13 |
| Foreign Subsidiaries × subordinated | Not applicable: no guarantee | Not applicable: no guarantee | Not applicable: no guarantee | E03 |
| Securitization Entities × first lien | Receivables sold to securitization outside Loan Party collateral | Not applicable: excluded subsidiary | — value not disclosed | E13 |
| Unrestricted Subsidiaries × first lien | All assets and equity excluded | Designation removes from perimeter | — none established | E12; E13 |

#### T4D.5 Structural priority

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc.; Holdings and domestic guarantors | Guarantor assets plus 65% of first-tier foreign voting equity | Pari (same entity, same lien) | Non-guarantor sales USD 1,646 million and goodwill USD 2,233 million reachable only through equity pledge after local creditors | First-lien recovery shared with USD 11,000 million of secured notes | Medium | E03; E13; L15; L16 |
| Secured notes 2028–2033 | TransDigm Inc.; same guarantors | Same pool under the intercreditor agreement | Pari (same entity, same lien) | Same non-guarantor value | Same pool; enforcement through agents only | Medium | E17; E23 |
| Senior subordinated notes | TransDigm Inc.; Holdings, TransDigm UK and domestic guarantors | Residual value after secured claims | Contractually Subordinated | Non-guarantor value plus all collateral value | Recover only after senior debt; blockage risk | Medium | E25; E03 |
| Non-guarantor creditors | Foreign and excluded subsidiaries | Their own assets | Structurally Senior | Not applicable: they hold the value | Paid before any note claim on those assets | Medium | E03 |
| Securitization investors | Securitization Entities | Sold receivables | Structurally Senior | Receivables outside collateral | Prior claim on receivables pool | Low | E13 |
| Future pari secured debt | TransDigm Inc. | First-lien pool | Leakage-Exposed (drop-down capable) | Dilutes existing first-lien share | Permitted to 5.00x secured net | Medium | E07 |

#### T4D.6 Leakage routes

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Dividend to shareholders | Restricted group to Holdings to equity | Credit agreement 6.02 ratio permission | Uncapped at 6.75x; USD 4,348 million paid October 2024 | 4 | Cash leaves all creditors | Demonstrated | E06; E28 |
| Investment in new unrestricted subsidiary | Loan Party to newly formed USub | Permitted Investments (1)(c) and (10) | Greater of USD 250 million and 10.0% of EBITDA, plus general basket greater of USD 500 million and 25.0% of Total Assets | 3 | Assets leave collateral and guarantees | Theoretical | E11; E12 |
| Designation of existing subsidiary | Existing Restricted Subsidiary to USub | Unrestricted Subsidiary definition | Not permitted: only new subsidiaries | 2 | Existing operating subsidiaries protected | Theoretical | E12 |
| Transfer to non-guarantor Restricted Subsidiary | Loan Party to foreign subsidiary | Permitted Investments (1)(a) unlimited among Restricted Subsidiaries | — not quantified | 3 | Moves value behind non-guarantor creditors | Theoretical | E11 |
| Asset sale out of group | Loan Party to third party | 6.03 and automatic release 9.02(c) | — not quantified; 75% cash test above USD 50 million | 3 | Collateral released; proceeds sweep rules apply | Theoretical | E09 |

#### T4D.7 Priming and uptier exposure

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by Required Lenders | 9.02(b) lacks express each-lender subordination item; pro rata sharing is protected | Non-participating term lenders | Theoretical | Priority change would depend on the unsupplied ICA and collateral agreement | Low | E09 |
| Non-pro-rata exchange | Class-wide offer requirement for non-pro-rata prepayment | Term lenders | Theoretical | Selective exchanges constrained | Medium | E09 |
| Secured note subordination | 2033 indenture 9.02(h) each-holder protection | 2033 noteholders | Theoretical | Adverse ranking change needs every affected holder | High | E22 |
| Drop-down trapdoor | Permitted Investments (10) into newly formed USub | All secured classes | Theoretical | Capacity exists; designation limited to new subsidiaries | Medium | E11; E12 |
| Pari dilution | Permitted Indebtedness (12) and incremental 2.24 | First-lien classes | Demonstrated | USD 3,000 million added September 2024 | High | E07; E28 |

#### T4D.8 Structural gaps

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit listing obligors and guarantors | Confirms perimeter | Entity rows aggregated | Obtain exhibit |
| Entity-level value | Debt and EBITDA by entity | Stranded value sizing | Non-guarantor value from sales and goodwill only | Obtain entity financials |
| UK security | UK debenture and TransDigm UK credit-facility role | UK value reach | UK rows insufficient | Obtain UK documents |
| Excluded collateral | Guarantee and Collateral Agreement | Excluded assets | Collateral rows partial | Obtain agreement |
| Indenture guarantee releases | Release clauses of indentures | Guarantee fall-away | Release triggers partial | Read release clauses |

#### T4F.1 Controlling intercreditor documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement as conformed | TransDigm Inc.; Holdings; subsidiary guarantors; lenders; Goldman Sachs Bank USA as agent | 2014-06-04, conformed to 2024-09-19 | New York | Executed | d887611dex101.htm.jsonl, pages 1, 197 and 222 | E10; E16 |
| 2033 secured notes indenture | TransDigm Inc.; Holdings; guarantors; Bank of New York Mellon Trust Company as trustee and collateral agent | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 1, 126 and 128 | E23; E24 |
| 2027 subordinated notes indenture | TransDigm Inc.; Holdings; guarantors; trustee | 2019-11-13 | New York | Executed | d826058dex41.htm.jsonl, pages 1 and 124 | E26 |
| First Lien Intercreditor Agreement | Company, Holdings, guarantors, credit agreement collateral agent, secured notes trustees and agents | 2019-02-13; joinders to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Not supplied | d887611dex41.htm.jsonl, page 30 | E17 |

#### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolver lenders | Senior secured first lien | Pari first lien | Through agent; own financial covenant default | Required Revolving Lenders for the covenant; Required Lenders otherwise | E05; E10 |
| Term lenders | Senior secured first lien | Pari first lien | Through agent only | Required Lenders; each lender for sacred rights | E09; E10 |
| Secured noteholders | Senior secured first lien | Pari first lien under ICA | Through notes collateral agents; no direct action | Majority; 66⅔% for collateral release; each holder for ranking | E22; E23 |
| Subordinated noteholders | Senior subordinated | Unsecured | Subject to blockage up to 179 days | Majority under indenture | E25 |
| Non-guarantor and securitization creditors | Structurally senior on their assets | Own assets or receivables | Direct against their obligors | Outside the credit group | E03; E13 |

#### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Agent sole right over Collateral | Not applicable: no standstill in loan agreement | Event of Default and Required Lenders' direction | Credit agreement agent | Lenders | Individual lenders cannot foreclose | Coordinated enforcement; minority lenders lose initiative | E10 |
| Noteholders barred from direct enforcement | [Insufficient Information] — ICA not in the source set | Per Security Documents and ICA | Notes collateral agents subject to ICA | Secured noteholders | Control between agents set by unsupplied ICA | Enforcement leadership among first-lien classes not established | E23 |
| ICA controls in conflict | [Insufficient Information] — ICA not in the source set | Any conflict with indenture | Per ICA | All first-lien classes | Indenture rights yield to ICA | Recovery mechanics unverified | E23 |
| Subordinated payment blockage | 179 days; one per 360 days; 181 days free | Notice of non-payment default on Designated Senior Debt | Representative of Designated Senior Debt | Subordinated noteholders | Junior payments halt during senior default | Junior PD rises before senior default resolves | E25 |

#### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes distributions | Payments otherwise due to holders go to Senior Debt until paid in full, except permitted junior securities | Not applicable: unsecured | [Insufficient Information] — no purchase option in reviewed clauses | Liquidation or insolvency | Holders may receive equally subordinated securities | E25 |
| Loan collateral release | [Insufficient Information] — ICA turnover terms not supplied | Automatic on permitted sale; each lender for all collateral | Credit bid by agent | Sale to non-Loan Party in compliance | Each-lender protection for substantially all collateral | E09; E10 |
| 2033 notes collateral release | [Insufficient Information] — ICA turnover terms not supplied | 66⅔% of holders for substantially all collateral | [Insufficient Information] — no purchase option in reviewed clauses | Release outside indenture terms | Releases under indenture terms need no vote | E22 |
| Non-consenting lender | Not applicable: no turnover | Required Lenders amendments | Replacement of non-consenting lenders referenced in amendment clause | Borrower request | Class-wide offer requirement | E09 |

#### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term and revolver lenders | Agent-led enforcement over shared first-lien pool | Pool can be enlarged by pari debt without consent | High | Dilution of collateral share | Lower first-lien recovery per dollar | E07; E10 |
| Secured noteholders | Agent-led under ICA | Direction of enforcement not established | Insufficient Information | Unknown control under ICA | Recovery control unverified | E23 |
| Subordinated noteholders | Residual after senior and non-guarantor claims | Blockage and turnover to senior | High | Payments diverted to senior | Lowest recovery class | E25 |
| Non-guarantor creditors | Direct claims on their obligors | None for them | Low | Structural seniority | Reduce value for all notes | E03 |

#### T4F.6 Intercreditor gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| ICA terms | First Lien Intercreditor Agreement and joinders | Enforcement direction, standstill, turnover | T4F.3 to T4F.5 provisional | Obtain executed ICA |
| Security documents | Guarantee and Collateral Agreement; security agreement; UK debenture | Collateral scope and release | Release analysis partial | Obtain documents |
| Other secured indentures | 2028–2032 indentures | Voting and release thresholds by class | Assumed similar to 2033 | Obtain indentures |

#### T4C.2 Capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as conformed | Executed credit agreement | 2024-09-19 | Executed | Legal formula | Binding constraint on debt and distributions | E05; E06; E07 |
| 1 | 2033 secured notes indenture | Executed indenture | 2024-09-19 | Executed | Legal formula | Looser secondary constraint | E18; E19; E20; E21 |
| 1 | 2027 subordinated notes indenture | Executed indenture | 2019-11-13 | Executed | Legal formula for subordination | Junior payment mechanics | E25 |
| 3 | Compliance certificate | Covenant certificate | Not supplied | Not supplied | Usage and tested ratios | [Insufficient Information] — no certificate; usage and covenant EBITDA unknown | E30 |
| Financial input | Financial foundation | Accepted financial analysis | FY2024 | Accepted | Financial input | Proxy debt, cash and EBITDA | E27 |
| Financial input | Annual report | Filing | 2024-11-07 | Filed | Financial input and compliance statement | Revolver usage and guarantor summary | E01; E04 |

#### T4C.3 Definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over LTM Consolidated EBITDA, pro forma for acquisitions and sales | Indebtedness, Unrestricted Cash, Consolidated EBITDA | Governs RP, junior debt, incremental, covenant | Uncapped cash netting raises capacity | Negative — Covenant Erosion | E14 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA | Secured debt, Unrestricted Cash, EBITDA | Governs pari secured debt | Cash netting against secured debt | Negative — Leverage Increase | E14 |
| Consolidated EBITDA | Credit agreement definitions | Adds uncapped integration, transaction costs, dividend equivalents; cost savings up to 25.0% | Add-back detail | Inflates every ratio and grower | Earnings above issuer measure | Negative — Covenant Erosion | E14 |
| Consolidated Net Income | Credit agreement definitions | Excludes non-cash and deferred compensation and purchase-accounting charges | Charge detail | Raises EBITDA | Recurring costs excluded | Negative — Covenant Erosion | E14 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Separate EBITDA for the revolver test | [Insufficient Information] — definition text not reviewed | Governs revolver test only | Not established | Insufficient Information | E14 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture | EBITDA over fixed charges, pro forma | Indenture EBITDA and fixed charges | Governs indenture ratio debt and RP | 2.0x floor loose | Negative — Covenant Erosion | E20; E21 |
| Indenture Consolidated EBITDA | 2033 indenture | Cost savings capped at 35.0% | Add-back detail | Inflates indenture ratios | Looser than loans | Negative — Covenant Erosion | E19 |
| Unrestricted Cash | Credit agreement definitions | Unencumbered cash of Holdings, Borrower and Restricted Subsidiaries | Cash by entity and encumbrance | Netted in full | Overstates net capacity if cash trapped | Insufficient Information | E12 |

#### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Springing revolver net leverage, year-end proxy | max-ratio | 7.50x | 4.46x | Net debt 18,619 over EBITDA As Defined 4,173 | 3.04x | Compliant | Not sprung; proxy not covenant EBITDA | Test inactive below 40% usage | Neutral — Stable | E05; E27; L04; L09 |
| Springing revolver net leverage, pro forma October 2024 dividend | max-ratio | 7.50x | 5.50x | Pro forma net debt 22,967 over 4,173 | 2.00x | Compliant | Proxy; event-only pro forma | Room shrank by about 1.04x | Negative — Covenant Erosion | E05; E27; L05; L09 |
| Revolver usage trigger | max-ratio | 40.00% | 7.36% | Letters of credit 67 over commitments 910 | 32.64% | Compliant | Cash-collateralised letters of credit not identified | Draws up to 297 do not spring the test | Neutral — Stable | E04; E05; L01; L24 |
| Ratio restricted payments | max-ratio | 6.75x | 5.50x | Pro forma net debt over EBITDA As Defined | 1.25x | Compliant | Proxy; covenant EBITDA not supplied | Further uncapped dividends allowed | Negative — Leverage Increase | E06; L05; L10 |
| Junior or unsecured ratio debt and incremental net leverage | max-ratio | 7.25x | 5.50x | Same proxy | 1.75x | Compliant | Proxy | Layering capacity | Negative — Leverage Increase | E07; L11 |
| Pari secured ratio debt | max-ratio | 5.00x | 4.22x | Secured carrying debt 19,534 less cash 6,261 plus 4,348, over 4,173 | 0.78x | Compliant | Principal basis 4.26x | Tightest ratio; dilution capacity | Negative — Leverage Increase | E07; L07; L12 |
| 2033 notes ratio liens | max-ratio | 5.25x | 4.22x | Same secured proxy | 1.03x | Compliant | Indenture EBITDA differs | Lien capacity under notes | Negative — Leverage Increase | E19; L12 |
| Indenture fixed charge coverage | min-ratio | 2.00x | 3.35x | EBITDA As Defined 4,173 over interest expense excluding amortisation 1,246 | 1.35x | Compliant | Full-year interest on September 2024 debt not included | Unlimited indenture RP while above floor | Negative — Covenant Erosion | E20; E21; L08; L13 |

#### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Restricted payment capacity | Ratio RP | Uncapped if net leverage at or below 6.75x | No default | Proxy 5.50x | USD 4,348 million paid October 2024 | Not calculable: covenant EBITDA not supplied | Not calculable: proxy room 1.25x only | Provisional | Critical | Debt-funded extraction | Negative — Leverage Increase | E06; E28 |
| Restricted payment capacity | General RP basket (7) | Greater of USD 75 million and 3.0% of Consolidated EBITDA | No default | Proxy 3.0% = USD 125.19 million | Not supplied: no tracker | Greater of USD 75 million and USD 125.19 million on proxy | Not calculable: usage not supplied | Provisional | Low | Small fixed leakage | Neutral — Stable | E06; L18 |
| Debt incurrence capacity | Pari secured ratio debt (12)(x) | Secured net leverage at or below 5.00x | Maturity and life no earlier than term loans; Loan Party obligors | Proxy 4.22x | Tranche L and 2033 notes used in September 2024 | Not calculable: covenant EBITDA not supplied | Not calculable: proxy room 0.78x | Provisional | High | Dilutes first lien | Negative — Leverage Increase | E07; L07 |
| Debt incurrence capacity | Junior or unsecured ratio debt (12)(y) and (17) | Net leverage at or below 7.25x | Same maturity conditions | Proxy 5.50x | Not supplied: no tracker | Not calculable: covenant EBITDA not supplied | Not calculable: proxy room 1.75x | Provisional | High | Layering | Negative — Leverage Increase | E07; L11 |
| Incremental facility capacity | Incremental 2.24 | 7.25x net and 5.00x secured | Lender willingness; MFN | Proxies 5.50x and 4.22x | Tranche L USD 1,500 million | Not calculable: covenant EBITDA not supplied | Not calculable: bounded by secured test | Provisional | High | Pari dilution | Negative — Leverage Increase | E01; E08 |
| Debt incurrence capacity | General basket (13) | Greater of USD 250 million and 10.0% of Consolidated EBITDA | Borrower and Guarantors | Proxy USD 417.30 million | Not supplied: no tracker | Greater of USD 250 million and USD 417.30 million on proxy | Not calculable: usage not supplied | Provisional | Moderate | Free-and-clear debt | Negative — Leverage Increase | E07; L18 |
| Debt incurrence capacity | Foreign subsidiaries (14) | Greater of USD 450 million and 18.0% of Consolidated EBITDA | Foreign Restricted Subsidiaries | Not calculated | Not supplied: no tracker | Fixed floor USD 450 million | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E07 |
| Debt incurrence capacity | Securitization (18) | Greater of USD 725 million and 20.0% of Consolidated EBITDA | Non-recourse | Facility USD 650 million | USD 487.5 million drawn at year-end | Fixed floor USD 725 million | Not calculable: covenant EBITDA not supplied | Ready with Limitations | Moderate | Receivables outside collateral | Neutral — Stable | E07; E01 |
| Unrestricted subsidiary capacity | Investments (1)(c) | Greater of USD 250 million and 10.0% of Consolidated EBITDA | Designation limits | Proxy USD 417.30 million | Not supplied: no tracker | Greater of USD 250 million and USD 417.30 million on proxy | Not calculable: usage not supplied | Provisional | Moderate | Value outside guarantees | Negative — Covenant Erosion | E11; L18 |
| Investment capacity | General investments (10) | Greater of USD 500 million and 25.0% of Total Assets | None stated beyond basket | Group total assets USD 25,586 million; proxy USD 6,396.50 million | Not supplied: no tracker | About USD 6,396.50 million on group total assets | Not calculable: usage not supplied | Provisional | High | Large transfer capacity | Negative — Covenant Erosion | E11; L17 |
| Investment capacity | Joint ventures (11) | Greater of USD 1,000 million and 40.0% of Consolidated EBITDA | Net leverage at or below 7.00x; no default | Not calculated | Not supplied: no tracker | Fixed floor USD 1,000 million | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Value into joint ventures | Negative — Covenant Erosion | E11 |
| Debt incurrence capacity | 2033 indenture facilities basket | USD 3,100.0 million less securitization debt and asset-sale paydowns | Credit Facilities | Facilities outstanding exceed basket; ratio debt relied on | Not supplied: classification not disclosed | Not calculable: classification not supplied | Not calculable: classification not supplied | Formula Extracted Only | Moderate | Indenture ratio debt is the main route | Neutral — Stable | E18 |
| Debt incurrence capacity | 2033 indenture non-guarantor ratio debt | Capped at USD 400.0 million | Coverage above 2.0x | Not supplied: non-guarantor debt not disclosed | Not supplied: no tracker | USD 400.0 million cap | Not calculable: usage not supplied | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E21 |
| Guarantor / collateral release capacity | Automatic release on permitted sale | Release to non-Loan Party in compliance | Asset sale covenant | Not applicable: event-driven | Not supplied: release history | Not calculable: event-driven | Not calculable: event-driven | Formula Extracted Only | Moderate | Collateral shrinks with disposals | Negative — Covenant Erosion | E09 |

#### T4C.6 Debt, lien and priming routes

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured ratio debt | To 5.00x secured net | Provisional proxy room 0.78x | Pari dilution of first-lien pool | Higher interest burden | Lower first-lien recovery | First-lien loans and notes equally exposed | E07 |
| Incremental term loans | 7.25x net and 5.00x secured; weak MFN | Provisional | Pari dilution; repricing protection lapses | Higher burden | Lower first-lien recovery | Tranche L loses MFN after 18 months | E08 |
| Junior or unsecured debt | To 7.25x net | Provisional proxy room 1.75x | Layering ahead of nothing but dilutive to subordinated claims | Higher burden | Lower subordinated recovery | Subordinated notes most exposed | E07 |
| Foreign subsidiary debt | Greater of USD 450 million and 18.0% | Formula extracted | Structurally senior to all Loan Party creditors | Moderate | Lower recovery on foreign value | All notes behind | E07 |
| Uptier via amendment | No express each-lender subordination right in loans | Theoretical | Priority change by Required Lenders, subject to ICA | Low | Severe for non-participants | Notes protected by each-holder ranking right | E09; E22 |

#### T4C.7 Leakage routes

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividends | Uncapped at 6.75x | Credit agreement 6.02 | USD 4,348 million used October 2024; proxy room 1.25x | Cash leaves group | Critical | Negative — Leverage Increase | E06; E28 |
| Unrestricted subsidiary investment | Greater of USD 250 million and 10.0% | Permitted Investments (1)(c) | Usage not supplied | Assets leave guarantees and collateral | Moderate | Negative — Covenant Erosion | E11 |
| General investments | Greater of USD 500 million and 25.0% of Total Assets | Permitted Investments (10) | Usage not supplied; proxy about USD 6,396.50 million | Can fund transfers to non-guarantors or new USubs | High | Negative — Covenant Erosion | E11; L17 |
| Non-guarantor transfers | Unlimited among Restricted Subsidiaries | Permitted Investments (1)(a) | Not capped | Value moves behind non-guarantor creditors | Moderate | Negative — Covenant Erosion | E11 |
| Indenture RP if loans repaid | Unlimited above 2.0x coverage | 2033 indenture 4.07 | Proxy room 1.35x | Weak bond-only protection | High | Negative — Covenant Erosion | E20 |

#### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Restructuring, integration, relocation, retention | Consolidated EBITDA (d) | Uncapped | Not calculable: amounts not supplied | Raises EBITDA for every ratio | PD: masks leverage | E14 |
| Transaction and financing costs | Consolidated EBITDA (e) | Uncapped | Not calculable: amounts not supplied | Recurring costs excluded | PD: ratio room overstated | E14 |
| Dividend equivalent payments | Consolidated EBITDA (k) | Uncapped | Not calculable: amounts not supplied | Cash paid to optionholders added back | PD: extraction inflates capacity | E14 |
| Projected cost savings | Consolidated EBITDA (m) | 25.0% of Consolidated EBITDA; 24 months | Not calculable: projections not supplied | Up to one quarter more EBITDA | PD and LGD: grower baskets swell | E14 |
| Indenture cost savings | 2033 indenture Consolidated EBITDA (M) | 35.0% | Not calculable: projections not supplied | Looser bond EBITDA | RV: notes weaker than loans | E19 |
| Non-cash and deferred compensation | Consolidated Net Income (11) | Uncapped | Issuer add-back USD 217 million in FY2024 per Earnings quality | Recurring compensation excluded | Covenant EBITDA above supported-only USD 3,813 million | E14; E29 |

#### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Uncapped ratio dividends used | USD 4,348 million paid after 6.75x permission | Repeat extraction | Critical | High | Committee decision; Refinancing & LME | E06; E28 |
| Pari secured capacity nearest limit | Proxy room 0.78x | First-lien dilution | High | Moderate | Recovery & fulcrum; Security selection | E07 |
| Weak MFN | Lapses for Tranche L after 18 months | Repricing risk | Moderate | High | Security selection | E08 |
| Large general investment basket | Greater of USD 500 million and 25.0% of Total Assets | Drop-down funding | High | Moderate | Recovery & fulcrum | E11 |
| Basket reclassification | Debt classification at borrower discretion | Capacity refresh | Moderate | High | Covenant capacity | E11 |
| No express loan subordination sacred right | 9.02(b) list | Uptier risk | Moderate | Low | Refinancing & LME | E09 |

#### T4C.11 Capacity risk priority matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured ratio debt at 5.00x | High | Moderate | Dilution of first-lien pool | Higher | Lower first-lien recovery | Secured issuance; quarterly secured leverage | E07 |
| 2 | Ratio dividends at 6.75x | Critical | Moderate | Debt-funded extraction | Higher | Cash leaves before distress | Declarations | E06 |
| 3 | General investment basket | High | Low | Transfer to non-guarantors or new USubs | Neutral | Lower | Designations and investments | E11 |
| 4 | EBITDA add-backs | High | Moderate | Inflates every ratio | Higher | Lower | Compliance certificate | E14 |
| 5 | Amendment mechanics | Moderate | Low | Required Lender priority change | Neutral | Severe for non-participants | Amendment filings | E09 |

#### T4C.12 Capacity gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Covenant EBITDA | Compliance certificate | Exact ratios | Headroom proxy only | Obtain certificate |
| Unrestricted Cash | Cash by entity and encumbrance | Netting | Proxy nets all cash | Obtain cash detail |
| Basket usage | Tracker | Remaining capacity | Not calculable | Obtain tracker |
| Borrower Total Assets | Borrower-level total assets | Investment basket size | Group total assets proxy | Obtain borrower figure |
| Pro forma interest | Full-year interest on September 2024 debt | Fixed charge coverage | Coverage proxy overstated | Obtain pro forma fixed charges |
| MFN effective date | Amendment No. 17 Effective Date | MFN lapse date | No dated lapse event | Obtain effectiveness notice |

#### Material claim lineage

| Claim | Material claim | Strongest lineage | Evidence ID |
|---|---|---|---|
| M1 | Springing revolver covenant only above 40% usage | Directly Sourced | E05 |
| M2 | Uncapped ratio dividends at 6.75x | Directly Sourced | E06 |
| M3 | Pari secured 5.00x and junior 7.25x ratio debt | Directly Sourced | E07 |
| M4 | MFN with tranche carve-outs | Directly Sourced | E08 |
| M5 | Loan sacred rights omit express subordination; notes protect ranking | Directly Sourced | E09; E22 |
| M6 | Agent-only enforcement and ICA primacy | Directly Sourced | E10; E23 |
| M7 | Subordination and 179-day blockage | Directly Sourced | E25 |
| M8 | Non-guarantor share of sales 20.73% | Calculated | L15 |
| M9 | Covenant proxies and headroom | Calculated | L04 to L13 |
| M10 | Investment basket about USD 6,396.50 million | Assumption-Based | L17 |
| M11 | Designation rule limits drop-down of existing subsidiaries | Analyst Inference | E12 |
| M12 | Overall aggressiveness 4 | Analyst Inference | T4.11 |
| M13 | ICA control and standstill | Insufficient Information | E17 |
| M14 | Exact covenant capacity and usage | Insufficient Information | E30 |

The legal and covenant review is completed with limitations; the main gaps are the intercreditor agreement, collateral documents, compliance certificate, basket usage and the other note indentures.

## Calculations

All figures are USD millions for consolidated TransDigm Group Incorporated at or for FY2024 unless stated; ratios are proxies on issuer EBITDA As Defined and are not covenant calculations.

| ID | Operation | Inputs | Output | Unit | Source |
|---|---|---|---|---|---|
| L01 | Ratio | Letters of credit 67 / revolver commitments 910 | 0.073626373626373626373626373626373626374; 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L02 | Product | 910 × 0.40 | 364.00; USD 364 million | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L03 | Difference | 364 − 67 | 297; USD 297 million | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L04 | Ratio | Year-end net debt 18,619 / EBITDA As Defined 4,173 | 4.4617780972921159837047687514977234603; 4.46x | x | Financial foundation (CP-1) |
| L05 | Ratio | Pro forma net debt after October 2024 dividend 22,967 / 4,173 | 5.5037143541816439012700694943685597891; 5.50x | x | Financial foundation (CP-1) |
| L06 | Difference; ratio | Secured carrying debt 19,534 − cash 6,261 = 13,273; 13,273 / 4,173 | 13,273; 3.1806853582554517133956386292834890966; 3.18x | USD million; x | Financial foundation (CP-1) |
| L07 | Sum; ratio | 13,273 + dividend payment 4,348 = 17,621; 17,621 / 4,173 | 17,621; 4.2226216151449796309609393721543254254; 4.22x | USD million; x | Financial foundation (CP-1) |
| L08 | Ratio | EBITDA As Defined 4,173 / interest expense excluding debt-cost amortisation 1,246 | 3.3491171749598715890850722311396468700; 3.35x | x | Financial foundation (CP-1) |
| L09 | Difference | 7.50 − 4.46; 7.50 − 5.50 | 3.04x; 2.00x | x | d887611dex101.htm.jsonl, page 188 |
| L10 | Difference | 6.75 − 5.50 | 1.25x | x | d887611dex101.htm.jsonl, page 181 |
| L11 | Difference | 7.25 − 5.50 | 1.75x | x | d887611dex101.htm.jsonl, page 59 |
| L12 | Difference | 5.00 − 4.22; 5.25 − 4.22 | 0.78x; 1.03x | x | d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 43 |
| L13 | Difference | 3.35 − 2.0 | 1.35x | x | d887611dex41.htm.jsonl, page 75 |
| L14 | Difference | 5.50 − 4.46 | 1.04x | x | Financial foundation (CP-1) |
| L15 | Difference; ratio | Sales 7,940 − guarantor sales 6,294 = 1,646; 1,646 / 7,940 | USD 1,646 million; 0.20730478589420654911838790931989924433; 20.73% | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L16 | Difference | Guarantor goodwill 8,186 − consolidated goodwill 10,419 | −2,233; USD 2,233 million outside guarantor summary | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L17 | Product | Group total assets 25,586 × 0.25 | 6,396.50; USD 6,396.50 million | USD million | d887611dex101.htm.jsonl, page 62; Financial foundation (CP-1) |
| L18 | Product | 4,173 × 0.10; 4,173 × 0.03 | 417.30; 125.19; USD 417.30 million; USD 125.19 million | USD million | d887611dex101.htm.jsonl, pages 61 and 180 |
| L19 | Sum | Secured notes 2,100 + 2,750 + 1,450 + 1,000 + 2,200 + 1,500; subordinated 2,650 + 1,200 + 750; term loans 1,871 + 3,632 + 1,699 + 1,500; secured principal 8,702 + 11,000 | 11,000; 4,600; 8,702; 19,702 | USD million | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L20 | Sum; ratio | 19,702 − 6,261 + 4,348 = 17,789; 17,789 / 4,173 | 17,789; 4.2628804217589264318236280853103283010; 4.26x | USD million; x | Financial foundation (CP-1) |
| L21 | Sum; ratio | Gross debt 25,068 − 6,261 + 4,348 = 23,155; 23,155 / 4,173 | 23,155; 5.5487658758686796069973640067098011023; 5.55x | USD million; x | Financial foundation (CP-1) |
| L22 | Ratio; difference | 22,967 / 7.50 = 3,062.27; 3,062.27 / 4,173 = 0.7338; 1 − 0.7338 | 0.2662; 26.62% earnings decline to reach 7.50x | USD million; fraction; % | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 188 |
| L23 | Ratio; difference | 17,621 / 5.00 = 3,524.2; 3,524.2 / 4,173 = 0.8445; 1 − 0.8445 | 0.1555; 15.55% earnings decline to reach 5.00x | USD million; fraction; % | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 59 |
| L24 | Difference | 40 − 7.36 | 32.64% | Percentage points | d887611dex101.htm.jsonl, page 188 |

## Gaps

These gaps limit exact capacity and intercreditor control; they do not change the direction of the covenant conclusions.

| Gap | Severity | What is missing | Effect on conclusion | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement and six joinders | Enforcement direction, standstill and turnover among first-lien classes not established | d887611dex41.htm.jsonl, page 30 |
| Compliance certificate and covenant EBITDA | MATERIAL | Tested ratios, covenant EBITDA, Unrestricted Cash | All headroom is proxy; dollar capacity not calculable | Source readiness (CP-0) |
| Basket usage and collateral documents | MATERIAL | Basket tracker; current Guarantee and Collateral Agreement; UK security | Remaining capacity and excluded assets not established | Source readiness (CP-0) |
| Other indentures | MINOR | 2028–2032 secured and two 2029 subordinated indentures | Class voting and releases assumed similar | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| MFN lapse date | MINOR | Effective date of the September 2024 amendment | The Tranche L MFN ends 18 months after an effective date not established, so no dated event is recorded | d887611dex101.htm.jsonl, page 144 |

## Next module
The orchestrator selects the next module.
