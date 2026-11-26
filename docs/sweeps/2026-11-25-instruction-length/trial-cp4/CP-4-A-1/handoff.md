## Request
Interpret the legal and covenant package of TransDigm Group Incorporated as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers the controlling credit agreement and supplied indentures, covenant tests and capacity, leakage and priming routes, the guarantee and collateral perimeter, and intercreditor control, without legal advice.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement, with the annexed Second Amended and Restated Credit Agreement as amended | not stated (agreement dated as of 2024-09-19) | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: definitions, incremental and MFN, debt, restricted payments, investments, unrestricted subsidiaries, springing financial covenant, collateral and guarantor requirements, amendments, governing law, Tranche L use of proceeds |
| d887611dex41.htm.jsonl | Execution-version indenture for the 6.000% senior secured notes due 2033 | not stated (indenture dated as of 2024-09-19) | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants: restricted payments, ratio debt, secured lien ratio, amendments, intercreditor subordination, enforcement and collateral release, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | not stated (indenture date recorded by Source readiness as 2019-11-13) | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination and payment blockage, coverage-ratio definition and ratio restricted-payment clause |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Covenant summary and compliance statement, revolver usage and letters of credit, guarantor description and summarised guarantor financials, dividend restrictions, securitization facility |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted issuer, date, legal source inventory and missing-document restrictions |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt, cash, reported and adjusted EBITDA, interest, post-balance-sheet dividend and securitization adjustments |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Recapitalisation chronology, ownership of the borrower, extraction behaviour |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence challenge to issuer add-backs, used to frame covenant EBITDA elasticity |

## Findings

### Bottom line
TransDigm's covenant package protects lien priority better than it protects cash: ratio-based distribution baskets let the group relever through payouts, while maintenance protection is a dormant revolver-only test, so creditors' main defence is collateral and pari-debt ratio caps, not covenants.

The October 2024 payment of about USD 4,348 million, part-funded by term loans whose stated use was the special dividend, shows the distribution baskets are live rather than theoretical. Reported net leverage moves from 4.88x at year-end to 6.02x pro forma for that October 2024 payment, on reported earnings that are not the covenant measure. New pari first-lien debt is capped by a 5.00x secured net ratio and incremental loans by a 7.25x total net ratio, but the intercreditor agreement is not in the source set, so enforcement control for noteholders is not established.
Basis: Financial foundation (CP-1); d887611dex101.htm.jsonl, pages 1–2; d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, page 30

### Key findings
- **Distribution leakage is the dominant legal risk, and it is demonstrated rather than theoretical.** The credit agreement allows any restricted payment with no default and pro forma net leverage at or below 6.75x on its own definitions; the indentures allow any restricted payment with no default and fixed-charge coverage above 2.00x, and payments made that way do not use up the separate builder basket. On reported figures, coverage of about 3.24x leaves the indenture test far from binding, so the credit agreement ratio is the effective brake.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 75–76; d826058dex41.htm.jsonl, page 63; d887611dex101.htm.jsonl, pages 1–2; calculation K10
- **Maintenance protection gives creditors no early warning.** The only financial maintenance test caps net leverage at 7.50x (8.00x for four quarters after a material acquisition) and applies only when revolver exposure exceeds 40% of commitments, which is USD 364 million. At year-end only USD 67 million of letters of credit were outstanding against USD 910 million of commitments, or 7.36%, so the test was dormant; term loans and notes carry no maintenance covenant, and only the revolving lenders control waivers of it. The first covenant signal would therefore come only after the group has drawn heavily on the revolver.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01; calculation K02; calculation K03
- **Priming by new pari secured debt is capped by ratios, but the earnings definition is elastic.** New first-lien debt needs a 5.00x secured net ratio and incremental loans also a 7.25x total net ratio; the protection against cheaper new term loans is 50 bp with an 18 months sunset and acquisition carve-outs. Covenant EBITDA adds back uncapped unusual, transaction and integration costs, dividend-equivalent payments and projected cost savings up to 25% of EBITDA for actions within 24 months. On reported figures after the October payment, which are not covenant measures, secured net leverage is about 4.22x and total net leverage about 5.50x on issuer-adjusted EBITDA, indicating unused secured capacity whose exact size is not established.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 143–146; d887611dex101.htm.jsonl, pages 23–24; calculation K07; calculation K09; Financial foundation (CP-1)
- **Structural leakage is bounded by debt caps rather than by investment limits.** Guarantors generated USD 6,294 million of USD 7,940 million of sales, or 79.27%, leaving about USD 1,646 million at non-guarantors. Investments in any restricted subsidiary, including non-guarantors, are uncapped, but debt at non-guarantor restricted subsidiaries is capped (USD 400 million of ratio debt under the secured indenture; foreign subsidiaries the greater of USD 450 million and 18% of EBITDA under the credit agreement), and only newly acquired or newly formed subsidiaries can be designated unrestricted.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 60–61; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, page 79; calculation K05; calculation K06
- **Noteholders depend on the bank collateral agent for collateral control.** Secured noteholders cannot enforce security directly, their indenture is subject to the intercreditor agreement, and their liens fall away when the credit agreement agent releases its lien other than on a full discharge. Every lender must consent to releasing all or substantially all collateral, a material guarantor or to changing pro rata sharing, but in the amendment text reviewed subordination of the loans or liens is not on that list, and non-pro-rata open offers need only required lenders. Subordinated noteholders can be blocked from payment for up to 179 days.
Basis: d887611dex41.htm.jsonl, pages 127–128; d887611dex41.htm.jsonl, pages 135–137; d887611dex101.htm.jsonl, pages 204–206; d826058dex41.htm.jsonl, page 107

### Contrary evidence and what would change the view
The strongest counter-evidence is that every distribution route is conditioned on a pro forma leverage or coverage test, and the dividend recapitalisation was financed with term loans that could only be made if the borrower certified total net leverage at or below 7.25x and secured net leverage at or below 5.00x. The annual report also states the group was in compliance with all debt covenants and expected to remain so. Pro rata sharing, release of all collateral and release of material guarantors need every lender's consent, existing subsidiaries cannot be moved outside the restricted group, and the secured indenture needs two-thirds of holders to release substantially all collateral or adversely change the intercreditor agreement. On this reading the package is a ratio-governed, market-style structure in which the recapitalisation was a permitted use of headroom, not evidence of loose drafting. The view would soften if compliance certificates showed covenant net leverage close to 6.75x after the October payment, since further distributions would then be blocked until earnings grow; it would harden if covenant EBITDA, after its add-backs, sits well above issuer-adjusted EBITDA, or if the intercreditor agreement gives noteholders no say over enforcement or release.
Basis: d887611dex101.htm.jsonl, page 146; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, pages 204–205; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, page 118

### Limitations
- The intercreditor agreement and its six joinders are not in the source set, so who directs enforcement among the first-lien classes, any standstill, turnover or purchase option is not established; the conclusion that noteholders depend on the bank agent rests on the secured indenture alone and could be stronger or weaker once the agreement is read.
- No compliance certificate, covenant EBITDA or unrestricted-cash calculation is supplied, so headroom under the 6.75x distribution test, the 5.00x secured test and the 7.25x incremental test is not established; the proxy ratios on reported figures probably understate covenant capacity because covenant EBITDA adds back items the issuer's adjusted measure excludes.
- No basket-usage records are supplied, so remaining capacity in the fixed and grower baskets is not established; the leakage severity scores rest on formulas and one demonstrated use, not on measured remaining room.
- The guarantee and collateral agreement, security agreements and the indentures for the 2028 to 2032 secured notes and the 2029 subordinated notes were not reviewed, so excluded assets, perfection gaps and covenant differences across those series are not established; the perimeter map relies on the annual report's statement that all secured series share guarantors.
- The dormant status of the maintenance test is taken from the annual report's year-end letters of credit and compliance statement, published after the as-of date, so the dormancy conclusion is a retrospective reading of the 30 September 2024 position, not a contemporaneous one.

### Nearest pressure point
The nearest pressure point is the credit agreement's unlimited distribution basket at 6.75x net leverage, together with the indentures' coverage-based basket, because it has already been used to move about USD 4,348 million to shareholders and option holders and needs no lender consent. Maintenance headroom ranks behind it because the springing test is dormant. The mechanism is that any covenant EBITDA growth, including add-backs and projected savings, reopens room for another payout, which raises default risk by consuming liquidity and adding secured debt without adding earnings, while leaving recovery value unchanged for a larger first-lien claim pool. The signals to monitor are new term-loan or note issuance with a stated dividend use, revolver exposure rising toward USD 364 million, and any compliance certificate disclosing covenant net leverage. Tightening this view requires the quarterly compliance certificates and the covenant EBITDA reconciliation.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, pages 1–2; d887611dex101.htm.jsonl, page 188; Financial foundation (CP-1); calculation K01

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package, scored provisionally, based on ratio-only limits on distributions and investments, a springing revolver-only maintenance test and an EBITDA definition with uncapped one-off add-backs. The main creditor protections are the secured net ratio cap on pari first-lien debt, the restriction of unrestricted designation to new subsidiaries, and every-lender consent for collateral and guarantor releases and pro rata sharing. The main weaknesses are distribution capacity governed only by leverage and coverage tests, uncapped investments into non-guarantor restricted subsidiaries, and noteholder collateral that follows the bank agent's releases. The primary default-risk path is repeated debt-funded distributions that reduce liquidity without a covenant tripwire; the primary recovery-risk path is dilution of the first-lien pool by further pari debt and value sitting at non-guarantors. For security selection, the key legal point is that subordinated notes sit behind about USD 19,702 million of first-lien funded principal and can be payment-blocked. Further work needs the intercreditor agreement, compliance certificates, basket-usage records and the remaining indentures.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 136–137; d826058dex41.htm.jsonl, page 107; calculation K11

### Capital structure

| Class | Instruments | Principal | Rank and security | Governing document reviewed | Source |
|---|---|---|---|---|---|
| Revolving credit facility | Dollar and multicurrency revolving commitments, maturity 2029-02-27 | USD 910 million commitments; USD 67 million letters of credit; no drawn loans stated | Senior secured, first lien under the credit agreement | Credit agreement as amended in September 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans | Tranches I, J, K and L, maturities 2028 to 2032 | USD 8,702 million | Senior secured, first lien, equal payment rank with secured notes | Credit agreement as amended in September 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Secured notes | Six series due 2028, 2029, 2030, 2031, 2032 and 2033 | USD 11,000 million | Senior secured, first lien under the first lien intercreditor agreement | 2033 indenture only; other series not reviewed | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; calculation K11 |
| First-lien funded principal | Term loans plus secured notes | USD 19,702 million | Pari first lien | Credit agreement and 2033 indenture | calculation K11 |
| Senior subordinated notes | 2027, January 2029 and May 2029 notes | USD 4,600 million | Unsecured, contractually subordinated, subordinated guarantees | 2027 indenture only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K11 |
| Receivables securitization | Domestic trade receivables facility, maturity 2025-07-11 | USD 487.5 million drawn of USD 650 million | Collateralised by domestic trade receivables at a securitization entity outside the guarantor group | Facility agreement not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |

### Covenant tests and headroom

| Test | Threshold | Year-end position | Status | Creditor consequence | Source |
|---|---|---|---|---|---|
| Revolver usage that switches on the maintenance test | 40% of commitments, USD 364 million | USD 67 million letters of credit, 7.36% | Dormant; 32.64% of commitments below the trigger | No covenant tripwire before heavy revolver use | d887611dex101.htm.jsonl, page 188; calculation K03 |
| Maintenance net leverage, revolver only | 7.50x; 8.00x for four quarters after a material acquisition | Not supplied: covenant ratio not reported | Not tested at year-end; issuer states compliance | Breach is a term-loan default only after revolver acceleration | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Unlimited distribution test | 6.75x net leverage | Not supplied: covenant ratio not reported; reported 4.88x year-end, 6.02x pro forma for October 2024 | Not calculable on covenant basis | Main brake on further payouts | d887611dex101.htm.jsonl, page 181; Financial foundation (CP-1) |
| Pari secured debt test | 5.00x secured net | Not supplied; proxy 4.22x on reported figures | Not calculable on covenant basis | Caps first-lien dilution | d887611dex101.htm.jsonl, page 59; calculation K09 |
| Incremental loan total test | 7.25x net leverage | Not supplied; proxy 5.50x on reported figures | Not calculable on covenant basis | Caps total relevering through the facility | d887611dex101.htm.jsonl, page 146; calculation K07 |
| Indenture ratio debt and distribution test | Above 2.00x fixed-charge coverage | Not supplied; proxy 3.24x on reported figures | Not calculable on covenant basis | Not the binding constraint | d887611dex41.htm.jsonl, pages 75–79; calculation K10 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver exposure trigger for the maintenance test | 40.00 | 7.36 | 32.64% | Passes at or below | % of revolving commitments | Credit agreement Section 6.14; letters of credit USD 67 million over USD 910 million commitments at 2024-09-30 from the annual report; assumes no letter of credit is cash collateralised at 103%, which would lower exposure |
| Maintenance consolidated net leverage, revolver only | 7.50 | Not supplied: no compliance certificate or covenant EBITDA supplied | Not supplied: current covenant ratio not established | Passes at or below | x | Credit agreement Section 6.14; tested only when revolver exposure exceeds 40%; 8.00 for four quarters after a material acquisition; issuer states compliance |
| Ratio restricted-payment test | 6.75 | Not supplied: covenant net leverage not reported | Not supplied: current covenant ratio not established | Passes at or below | x | Credit agreement Section 6.02 final paragraph; pro forma for the payment and its financing; nets Unrestricted Cash |
| Incremental total net leverage | 7.25 | Not supplied: covenant net leverage not reported | Not supplied: current covenant ratio not established | Passes at or below | x | Credit agreement Section 2.24(c)(iii); incurrence test, not maintenance |
| Incremental and pari secured net leverage | 5.00 | Not supplied: covenant secured ratio not reported | Not supplied: current covenant ratio not established | Passes at or below | x | Credit agreement Section 2.24(c)(iv) and Permitted Indebtedness clause (12); incurrence test |
| Indenture fixed-charge coverage for ratio debt and restricted payments | 2.00 | Not supplied: covenant coverage not reported | Not supplied: current covenant ratio not established | Passes above | x | 2033 indenture Sections 4.07 and 4.09; strictly greater than 2.0 to 1.0 |
| Indenture secured ratio-debt lien test | 5.25 | Not supplied: covenant secured ratio not reported | Not supplied: current covenant ratio not established | Passes at or below | x | 2033 indenture Permitted Liens clause (xxxi); looser than the credit agreement's 5.00 test, which binds the same borrower |

Only the revolver trigger has a measured position; the ratio rows show thresholds without a covenant-basis current value, and none of this is a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2014-06-04 | day | Not supplied: the amendment exhibit states no publication date | Second Amended and Restated Credit Agreement dated | Historical — SECOND AMENDED AND RESTATED CREDIT AGREEMENT dated as of June 4, 2014 | d887611dex101.htm.jsonl, page 1 | Base agreement whose amended text controls all loan covenants |
| 2019-02-13 | day | Not supplied: the indenture exhibit states no publication date | First Lien Intercreditor Agreement dated | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Controls enforcement and release among first-lien classes; not in the source set |
| 2024-09-19 | day | Not supplied: the amendment exhibit states no publication date | Amendment No. 17 and Tranche L incremental term loans of USD 1,500 million, proceeds to fund the special dividend | Historical — AMENDMENT NO. 17 AND INCREMENTAL TERM LOAN ASSUMPTION AGREEMENT dated as of September 19, 2024 | d887611dex101.htm.jsonl, pages 1–2 | Documents debt-funded use of the distribution baskets; starts the Tranche L MFN period |
| 2024-09-19 | day | Not supplied: the indenture exhibit states no publication date | Indenture for the 2033 secured notes executed | Historical — INDENTURE Dated as of September 19, 2024 | d887611dex41.htm.jsonl, page 1 | Adds pari first-lien claims; dividend-funding notes |
| 2024-09-19 | day | Not supplied: the indenture exhibit states no publication date | Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | 2033 notes accede to the first-lien sharing arrangements |
| 2027-09-15 | day | Not supplied: the indenture exhibit states no publication date | Initial redemption date of the 2033 secured notes | Scheduled — "Initial Redemption Date" means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Earliest optional-call date under the indenture; refinancing flexibility for the issuer |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all capital stock of the borrower | Ownership | TransDigm Inc. | Annual report as recorded by Business & governance; both Delaware corporations; United States |
| TransDigm Group Incorporated | Guarantees as Holdings and Loan Party | Guarantee | Credit facility lenders | Credit agreement as amended 2024-09-19; New York law |
| TransDigm Group Incorporated | Guarantees on a senior secured basis | Guarantee | Secured noteholders | 2033 indenture, New York law; annual report guarantor description |
| TransDigm UK Holdings plc | Guarantees 2028 notes; same guarantors as later series | Guarantee | Secured noteholders | Annual report guarantor description; UK public limited company; New York-law indentures |
| Domestic restricted subsidiaries | Guarantee and grant liens as Loan Parties | Guarantee | Credit facility lenders | Credit agreement Section 5.11; New York law; non-immaterial US subsidiaries |
| Domestic restricted subsidiaries | Guarantee on a senior secured basis | Guarantee | Secured noteholders | 2033 indenture and annual report; New York law |
| Domestic restricted subsidiaries | Guarantee on a subordinated unsecured basis | Guarantee | Subordinated noteholders | Annual report; 2027 indenture; United States |
| TransDigm Inc. | Grants first-lien security as borrower and issuer | Security | Credit agreement collateral agent | Credit agreement Section 5.11; Goldman Sachs Bank USA as collateral agent; New York law |
| TransDigm Inc. | Grants first-lien security for the 2033 notes | Security | Notes collateral agents | 2033 indenture Article XII; Bank of New York Mellon entities; New York law |
| Domestic restricted subsidiaries | Pledge 65% of voting equity of foreign subsidiaries | Security | Credit agreement collateral agent | Credit agreement Section 5.11(b); New York law |
| Non-guarantor subsidiaries | Their creditors rank ahead of note claims on their assets | Structural claim | Secured noteholders | Annual report states notes are structurally subordinated to non-guarantor liabilities; United States filing |
| Securitization entity | Holds domestic trade receivables as collateral | Structural claim | Securitization lenders | Annual report securitization description; facility agreement not supplied; United States |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facility lenders | Rank equally in right of payment | Payment rank | Secured noteholders | Annual report ranking description; New York-law credit agreement and indentures |
| Secured noteholders | Senior in right of payment | Payment rank | Subordinated noteholders | Annual report; 2027 indenture subordination article; United States |
| Credit facility lenders | Share first-lien collateral on equal priority | Security rank | Secured noteholders | 2033 indenture defines the First Lien Intercreditor Agreement; agreement itself not supplied; New York law |
| Credit agreement collateral agent | Its lien release releases the notes liens | Release | Secured noteholders | 2033 indenture Section 12.07(e)(B), except on full discharge; New York law |
| First Lien Intercreditor Agreement | Indenture is subject to it and it controls conflicts | Enforcement control | Secured noteholders | 2033 indenture Sections 11.16 and 12.02; control terms not supplied; New York law |
| Notes collateral agents | Sole enforcers; holders cannot act directly | Enforcement control | Secured noteholders | 2033 indenture Section 12.01; New York law |
| Designated senior debt holders | May block payments for up to 179 days | Standstill | Subordinated noteholders | 2027 indenture Section 10.03; 2033 notes designated as Designated Senior Debt; United States |
| Required revolving lenders | Control waiver and acceleration on the maintenance test | Enforcement control | Term lenders | Credit agreement Sections 6.14 and Article VII; New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 9 |
| Calculated | 3 |
| Assumption-Based | 0 |
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

### Analytical appendix — complete canonical registers

Module status is completed with limitations: executed governing documents are available, but the intercreditor agreement, security documents, compliance certificates, basket usage and five of the six secured-note indentures are missing.

### Evidence references

| Evidence ID | Provision or fact | Source |
|---|---|---|
| L01 | Section 6.14 springing financial covenant, revolver lenders only; Required Revolving Lenders amend | d887611dex101.htm.jsonl, page 188 |
| L02 | Covenant summary, 40% trigger equal to USD 364 million, compliance statement, incremental 7.25x and 5.00x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L03 | Revolver USD 910 million, letters of credit USD 67 million, availability USD 843 million, term loans USD 8,702 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L04 | Section 2.24(c) incremental conditions 7.25x total net and 5.00x secured net | d887611dex101.htm.jsonl, page 146 |
| L05 | Section 2.24(b) maturity and life limits and 50 bp yield protection with 18-month sunsets and carve-outs | d887611dex101.htm.jsonl, pages 143–144 |
| L06 | Permitted Indebtedness clauses (12) to (18) and classification flexibility | d887611dex101.htm.jsonl, pages 59–61 |
| L07 | Section 6.02 restricted payments, fixed baskets and unlimited 6.75x ratio basket | d887611dex101.htm.jsonl, pages 177–181 |
| L08 | Permitted Investments clauses (1) to (20) | d887611dex101.htm.jsonl, pages 61–63 |
| L09 | Unrestricted Subsidiary definition and Unrestricted Cash | d887611dex101.htm.jsonl, page 81 |
| L10 | Consolidated EBITDA add-backs, net income exclusions, net leverage and secured net ratio definitions | d887611dex101.htm.jsonl, pages 23–27 |
| L11 | Section 9.02 amendments, every-lender matters, pari or junior lien amendments, non-pro-rata offers, collateral release | d887611dex101.htm.jsonl, pages 204–206 |
| L12 | Section 5.11 guarantor joinder, excluded subsidiaries, 65% foreign voting equity pledge | d887611dex101.htm.jsonl, pages 173–174 |
| L13 | Credit agreement governing law New York | d887611dex101.htm.jsonl, page 222 |
| L14 | Tranche L USD 1,500 million, proceeds with 2033 notes and cash to fund special dividend | d887611dex101.htm.jsonl, pages 1–2 |
| L15 | 2033 indenture Section 4.07 builder basket, coverage-ratio basket and reset | d887611dex41.htm.jsonl, pages 69–76 |
| L16 | 2033 indenture Section 4.09 ratio debt above 2.0x, non-guarantor cap USD 400 million; secured ratio-debt liens 5.25x | d887611dex41.htm.jsonl, pages 43–79 |
| L17 | 2033 indenture Section 9.02 majority amendments, every-holder matters, two-thirds for collateral and intercreditor changes | d887611dex41.htm.jsonl, pages 116–118 |
| L18 | Intercreditor Agreement definition and joinders, Section 11.16, Section 12.01 no direct enforcement, Section 12.02 intercreditor controls | d887611dex41.htm.jsonl, pages 30–135 |
| L19 | 2033 indenture Section 12.07 lien release triggers | d887611dex41.htm.jsonl, pages 136–137 |
| L20 | 2027 indenture coverage-ratio definition, ratio restricted payments and payment blockage | d826058dex41.htm.jsonl, pages 14–107 |
| L21 | Guarantor description, structural subordination statement and summarised guarantor financials | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| L22 | October 2024 dividend payment and contractual restrictions; securitization collateral and October draw | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |
| L23 | 2033 indenture New York governing law and jurisdiction | d887611dex41.htm.jsonl, pages 126–127 |
| L24 | Carrying debt, cash, EBITDA, interest and post-balance-sheet adjustments | Financial foundation (CP-1) |

### T4.1 Source gate

| Source | Document status | Authority rank | Limitation | Gate effect |
|---|---|---|---|---|
| Credit agreement as amended by Amendment No. 17 | Execution version with annexed conformed agreement | 1 | Schedules and exhibits not reviewed; Amendment No. 17 Effective Date not located | Satisfies the executed-document gate |
| 2033 secured notes indenture | Execution version | 1 | Other secured-note indentures not supplied | Secured-note covenants for one series only |
| 2027 subordinated notes indenture | Indenture text supplied | 1 | Other subordinated indentures not supplied; governing-law text not read | Subordination mechanics for one series |
| First Lien Intercreditor Agreement | Not supplied | 2 | Identified only by definition | Enforcement-control analysis restricted |
| Compliance certificates | Not supplied | 3 | No tested ratios | Headroom restricted |
| Annual report covenant description | Issuer filing summary | 4 | Summary only; published after the as-of date | Used for usage, compliance statement and guarantor facts |

Module status: completed with limitations.

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Second Amended and Restated Credit Agreement as amended by Amendment No. 17 | Executed credit agreement amendment with conformed annex | Base 2014-06-04; amendment dated as of 2024-09-19 | Executed | Controls revolver and term-loan covenants, collateral, amendments | Sets the binding distribution, secured-debt and incremental ratios | L01; L04; L07; L11 | d887611dex101.htm.jsonl, pages 1–2 |
| 1 | Indenture for the 2033 secured notes | Executed indenture | Dated as of 2024-09-19 | Executed | Controls 2033 notes covenants and collateral release | Looser ratio tests than the credit agreement; release follows bank agent | L15; L16; L17; L19 | d887611dex41.htm.jsonl, page 1 |
| 1 | Indenture for the 2027 subordinated notes | Executed indenture | 2019-11-13 as recorded by Source readiness | Executed text supplied | Controls subordination, blockage and 2027 covenants | Payment blockage and turnover exposure for subordinated holders | L20 | d826058dex41.htm.jsonl, page 107 |
| 1 | Indentures for 2028, 2029, 2030, 2031 and 2032 secured notes and January and May 2029 subordinated notes | Executed indentures | [Insufficient Information] — not in the source set | Not supplied | Would control those series | Covenant differences across series not established | L21 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| 2 | First Lien Intercreditor Agreement with Joinders No. 1 to 6 | Intercreditor agreement | 2019-02-13; joinders to 2024-09-19 | Not supplied | Controls first-lien enforcement and release | Prevails over the 2033 indenture in a conflict | L18 | d887611dex41.htm.jsonl, page 30 |
| 3 | Compliance certificates | Covenant schedules | [Insufficient Information] — none supplied | Not supplied | Would control tested ratios | No exact headroom | L02 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| 4 | Annual report debt and guarantor description | Issuer summary in a filing | Signed 2024-11-07 | Published after as-of date | Secondary; verify against executed text | Usage, compliance statement, guarantor perimeter | L02; L03; L21 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–62 |

The executed credit agreement text governs wherever the annual report summarises it; no conflict was found between the two on the springing covenant or incremental ratios.

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at most 7.50x (8.00x four quarters after a Material Acquisition) when revolver exposure exceeds 40% of commitments | Credit agreement Section 6.14 | Dormant until heavy revolver use; revolver-only benefit | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L01 |
| Financial covenant default | Breach is an Event of Default for term loans only once revolver obligations are accelerated and not rescinded, per Article VII text located | Credit agreement Article VII | Term lenders cannot act on a covenant breach alone | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L01 |
| Incremental facilities | Uncapped amount subject to 7.25x total net and 5.00x secured net pro forma | Credit agreement Section 2.24(c) | Capacity grows with covenant EBITDA | Negative — Leverage Increase | Not assessed: no comparative source supplied | L04 |
| MFN | 50 bp yield protection; off after 18 months from the relevant amendment, for acquisition debt and for loans maturing 18 months after the tranche | Credit agreement Section 2.24(b) | Repricing protection expires | Negative — Refinancing Risk | Not assessed: no comparative source supplied | L05 |
| Ratio and pari secured debt | Pari secured debt at 5.00x secured net; junior or unsecured at 7.25x net; maturity and life protections | Credit agreement Permitted Indebtedness (12) | Pari first-lien dilution capped by ratio | Negative — Leverage Increase | Not assessed: no comparative source supplied | L06 |
| General and foreign debt | Greater of USD 250 million and 10% EBITDA general; foreign subsidiaries greater of USD 450 million and 18% EBITDA; securitization greater of USD 725 million and 20% EBITDA | Credit agreement Permitted Indebtedness (13), (14), (18) | Grower baskets add non-ratio debt, part at non-guarantors | Negative — Leverage Increase | Not assessed: no comparative source supplied | L06 |
| Restricted payments, credit agreement | Fixed baskets plus unlimited payments if no default and pro forma net leverage at most 6.75x | Credit agreement Section 6.02 | Distributions limited only by ratio | Negative — Leverage Increase | Not assessed: no comparative source supplied | L07 |
| Restricted payments, indentures | Builder from 2010 of USD 400 million plus 50% of net income plus equity; unlimited if coverage above 2.0x; ratio payments do not reduce builder | 2033 indenture Section 4.07; 2027 indenture Section 4.07 | Two independent payout routes | Negative — Leverage Increase | Not assessed: no comparative source supplied | L15; L20 |
| Investments | Uncapped in restricted subsidiaries; general greater of USD 500 million and 25% Total Assets; JV greater of USD 1,000 million and 40% EBITDA at 7.00x; unlimited at 5.75x with no revolver loans and USD 200 million cash | Credit agreement Permitted Investments | Value can move to non-guarantors and outside the group | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L08 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries designable; investment greater of USD 250 million and 10% EBITDA | Credit agreement definitions | Existing collateral-rich subsidiaries cannot be designated | Neutral — Stable | Not assessed: no comparative source supplied | L09; L08 |
| EBITDA definition | Uncapped unusual, transaction, integration add-backs; dividend-equivalent payments; cost savings capped at 25% within 24 months | Credit agreement Consolidated EBITDA | Inflates every ratio basket | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L10 |
| Guarantor coverage | Domestic subsidiaries other than immaterial, unrestricted and securitization entities must join within 20 business days | Credit agreement Section 5.11(a) | Foreign value outside guarantees | Neutral — Stable | Not assessed: no comparative source supplied | L12 |
| Collateral flexibility | Automatic release on permitted disposal; notes liens follow bank release | Credit agreement Section 9.02(c); 2033 indenture Section 12.07 | Collateral can leave with one agent decision | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L11; L19 |
| Amendments | Required Lenders generally; every lender for economics, pro rata sharing, voting, material guarantor and all collateral release; subordination not listed in reviewed text | Credit agreement Section 9.02(b) | Lien or payment subordination possibly by majority | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L11 |
| Note amendments | Majority; every holder for economics and ranking; two-thirds for substantially all collateral and adverse intercreditor changes | 2033 indenture Section 9.02 | Higher hurdle for collateral release | Neutral — Stable | Not assessed: no comparative source supplied | L17 |

### EBITDA, definitions and ratio mechanics

Covenant EBITDA starts from net income and adds back taxes, interest, non-cash charges, uncapped unusual, nonrecurring, transaction, integration, restructuring and refinancing costs, earn-outs, dividend-equivalent payments and projected cost savings from actions within 24 months, capped at 25% of EBITDA. Because every distribution, investment and debt ratio uses this measure, each add-back enlarges payout and debt room together, and the dividend-equivalent add-back means part of a distribution itself raises covenant earnings. The net ratios deduct only Unrestricted Cash, so cash paid out in October 2024 reduces the netting credit. The issuer's own adjusted measure of USD 4,173 million already exceeds reported EBITDA of USD 3,813 million, and the earnings-quality review treats most of that difference as recurring; covenant EBITDA can be higher still. This raises default risk through relevering capacity rather than through covenant pressure.
Basis: d887611dex101.htm.jsonl, pages 23–27; d887611dex101.htm.jsonl, page 81; Financial foundation (CP-1); Earnings quality (CP-1D)

### Debt incurrence, incremental facilities and MFN

Incremental loans are uncapped in amount and limited only by 7.25x total net and 5.00x secured net leverage after the borrowing, and the same 5.00x test governs other pari secured debt outside refinancing. The secured indenture's own lien test of 5.25x is looser, but the credit agreement binds the same borrower and therefore governs. The yield protection for existing lenders lapses 18 months after each relevant amendment and never applies to acquisition financing, so existing term lenders can be undercut on price. The September 2024 recapitalisation borrowed USD 1,500 million of term loans under this mechanism alongside the 2033 notes, which shows the capacity is used for distributions, not only acquisitions.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 143–146; d887611dex41.htm.jsonl, page 43; d887611dex101.htm.jsonl, pages 1–2

### Leakage, restricted payments, investments and asset transfers

Distribution capacity is governed by ratios rather than amounts: 6.75x net leverage under the credit agreement, and above 2.00x coverage under the indentures with the builder basket preserved. Investment capacity into restricted subsidiaries is uncapped, which allows value to move to non-guarantor subsidiaries while staying inside the restricted group; investment outside the group is limited by fixed and grower baskets and an unlimited basket at 5.75x that also requires no revolver loans and at least USD 200 million of unrestricted cash. The unrestricted-subsidiary route is narrower than usual because existing subsidiaries cannot be designated. Recovery risk comes mainly from value moving to non-guarantors, where their own creditors rank first.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, pages 75–76

### Collateral, guarantees and structural subordination

Domestic subsidiaries other than immaterial, unrestricted and securitization entities must guarantee and grant liens, and foreign subsidiaries contribute only 65% of voting equity through pledges. The guarantor group produced 79.27% of sales, so creditors of non-guarantors rank ahead on the remainder, partly offset by a net intercompany claim of the guarantor group on non-guarantors stated in the annual report. Subordinated noteholders are contractually behind all first-lien debt, can be payment-blocked and have only subordinated guarantees.
Basis: d887611dex101.htm.jsonl, pages 173–174; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K05

### Events of default, remedies and amendment risk

Only the revolving lenders benefit from the maintenance test and they alone can waive it; term lenders can act only once the revolver has been accelerated. Most amendments need required lenders; every lender must agree to economic changes, pro rata sharing, voting thresholds and release of a material guarantor or all collateral. In the text reviewed, subordination of the loans or their liens is not among the every-lender matters, and required lenders can allow non-pro-rata prepayment offers made to a whole class. The agent must, at the borrower's request, document pari or junior liens for permitted secured debt without lender consent.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 204–206

### Post-balance-sheet capacity events

| Event | Date | Capacity effect | Treatment | Source |
|---|---|---|---|---|
| Special dividend USD 4,216 million and dividend equivalents USD 132 million paid, USD 4,348 million in total | 2024-10-18 | Uses restricted-payment capacity and reduces Unrestricted Cash for netting | Subsequent event; pro forma reported net leverage 6.02x against 4.88x at year-end per Financial foundation | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; Financial foundation (CP-1) |
| Securitization draw of the remaining USD 162.5 million | 2024-10-16 | Uses the securitization debt basket; facility USD 650 million is below the USD 725 million fixed limit | Subsequent event; reported net leverage unchanged at 4.88x per Financial foundation | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63; Financial foundation (CP-1) |

### Definition conflict register

| Item | Covenant definition | Financial foundation basis | Divergence | Treatment | Source |
|---|---|---|---|---|---|
| Debt numerator | Consolidated Total Indebtedness of the borrower less Unrestricted Cash; securitization counted at face in the indenture definition | Carrying debt USD 24,880 million less reported cash USD 6,261 million | Definition text for Consolidated Total Indebtedness not read; principal versus carrying basis not established | Covenant definition governs; no reconciliation made | d887611dex101.htm.jsonl, page 26; d887611dex41.htm.jsonl, page 30; Financial foundation (CP-1) |
| EBITDA denominator | Consolidated EBITDA with uncapped one-off add-backs and capped cost savings | Reported EBITDA USD 3,813 million; issuer EBITDA As Defined USD 4,173 million | Covenant amount not reported | Proxy ratios labelled as not covenant measures | d887611dex101.htm.jsonl, pages 23–24; Financial foundation (CP-1) |
| Non-debt funding liabilities | Treatment of contract liabilities USD 177 million and the dividend payable USD 4,216 million within Indebtedness not established | Excluded from carrying debt | Not established | Flagged as a gap; no capacity effect assumed | Financial foundation (CP-1) |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio distribution baskets | Unlimited payments at 6.75x net leverage or above 2.0x coverage; recap funded by Tranche L | Debt-funded payouts | Higher: liquidity and leverage worsen without earnings gain | Moderate: larger first-lien pool against same value | Track new debt with dividend use and leverage disclosures | L07; L14; L15 |
| Springing maintenance test | Tested only above 40% revolver use | No early covenant signal | Higher: default arrives late and abruptly | Higher: value erodes before creditors can act | Track revolver exposure against USD 364 million | L01; L02 |
| Pari secured capacity | 5.00x secured net cap | Dilution of first-lien collateral | Moderate | Higher for first-lien holders | Track secured issuance and ratio certificates | L04; L06 |
| Non-guarantor transfers | Uncapped investments in restricted subsidiaries; non-guarantor debt capped | Value moves behind non-guarantor creditors | Low | Moderate for all guaranteed classes | Track guarantor share of sales | L08; L16; L21 |
| Collateral release mechanics | Notes liens follow bank release; disposals release automatically | Collateral can shrink through bank decisions | Low | Higher for noteholders | Track asset sales and release notices | L11; L19 |
| Subordination and blockage | 179-day blockage; subordinated guarantees | Payment interruption in stress | Higher for subordinated notes | Higher for subordinated notes | Track any blockage notice | L20 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions in the covenant feature register | No covenant-review report or market-norm source supplied | Not assessed: comparative source absent | Not assessable without a comparator | Insufficient Information | L01 to L20 |

Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided.

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Springing revolver-only 7.50x test, 8.00x after acquisitions, term loans and notes without maintenance | No early warning for most creditors | Negative — Covenant Erosion | Completed | L01; L02 |
| Debt / lien incurrence capacity | 3 | Ratio-only incremental at 7.25x and 5.00x; grower general baskets; MFN 50 bp with 18-month sunset | Capacity grows with covenant EBITDA | Negative — Leverage Increase | Provisional | L04; L05; L06 |
| RP / investment / leakage capacity | 4 | Unlimited ratio payments, builder reset, uncapped investments in restricted subsidiaries; designation limited to new subsidiaries | Demonstrated debt-funded distributions | Negative — Leverage Increase | Provisional | L07; L08; L09; L15 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped one-off add-backs, dividend-equivalent add-back, 25% cost-savings cap over 24 months | Inflates every ratio basket | Negative — Covenant Erosion | Completed | L10 |
| Collateral / guarantor protection | 3 | Domestic guarantees and liens, 65% foreign pledge, about 21% of sales at non-guarantors, every-lender consent for all-collateral release | Partial value outside guarantees; releases follow disposals | Neutral — Stable | Provisional | L12; L19; L21 |
| Amendment / control mechanics | 3 | Every-lender pro rata and release protections; subordination not listed; non-pro-rata class offers with required lenders | Uptier not blocked by an explicit term in reviewed text | Negative — Covenant Erosion | Provisional | L11; L17 |
| Overall | 4 | Weighted to leakage and maintenance areas | Relevering through payouts without covenant tripwire | Negative — Leverage Increase | Provisional | L01; L07; L10 |

The composite is Aggressive and provisional: six areas are scorable, but missing compliance certificates and the intercreditor agreement limit confidence.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further debt-funded distribution | 6.75x ratio basket; Tranche L use of proceeds | Repeats the September recapitalisation | PD up; first-lien LGD up; subordinated notes weaker relative value | Watch issuance with dividend use; request compliance certificates | L07; L14 |
| Revolver exposure nearing USD 364 million | Section 6.14 trigger | Switches on the only maintenance test | PD signal | Track quarterly revolver and letters of credit | L01; L02 |
| Subordination amendment by required lenders | Section 9.02(b) list without subordination | Possible uptier | LGD up for non-participating lenders | Watch amendment filings and lender groups | L11 |
| Collateral release by bank agent | 2033 indenture Section 12.07(e)(B) | Notes lose liens without their vote | LGD up for noteholders | Watch release notices and asset sales | L19 |
| Value shift to non-guarantors | Permitted Investments clause (1)(a) | Structural subordination grows | LGD up | Track guarantor share of sales each year | L08; L21 |
| Payment blockage notice | 2027 indenture Section 10.03 | Interrupts subordinated coupons | PD and LGD up for subordinated notes | Watch trustee notices | L20 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and joinders | Enforcement control, release and turnover among first-lien classes | Intercreditor registers partly insufficient | Obtain the executed agreement and joinders |
| Compliance certificates | Quarterly certificates with covenant EBITDA and ratios | Exact headroom | Ratio tests not calculable | Obtain latest certificates |
| Basket usage | Usage records for fixed, grower and builder baskets | Remaining capacity | Capacity register formula-only | Obtain usage tracker |
| Other indentures | 2028 to 2032 secured and 2029 subordinated indentures | Covenant differences by series | Findings limited to 2033 and 2027 series | Obtain executed indentures |
| Security documents | Guarantee and collateral agreement, excluded assets | Collateral perimeter | Collateral map partial | Obtain security documents |
| Credit agreement remaining text | Consolidated Total Indebtedness, Financial Covenant EBITDA, Article VII full text, Section 1.07 | Ratio mechanics and cross-default | Some definitions summarised from partial text | Read the remaining clauses |

### T4C.2 Capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended September 2024 | Executed credit agreement | Dated as of 2024-09-19 | Executed | Legal formula | Binding ratios for distributions, debt and investments | L04; L06; L07; L08 |
| 1 | 2033 secured notes indenture | Executed indenture | Dated as of 2024-09-19 | Executed | Legal formula | Coverage and secured lien tests | L15; L16 |
| 1 | 2027 subordinated notes indenture | Executed indenture | 2019-11-13 | Executed text | Legal formula | Coverage definition and ratio distributions | L20 |
| 3 | Compliance certificates | Covenant schedule | [Insufficient Information] — not supplied | Not supplied | Financial input and usage | Exact headroom | L02 |
| Financial input | Financial foundation | Consolidated financial analysis | FY2024 | Accepted | Financial input, proxy only | Proxy ratios, not covenant measures | L24 |
| 4 | Annual report | Issuer summary | Signed 2024-11-07 | Published after as-of date | Usage for revolver; compliance statement | Dormant maintenance test | L02; L03 |

### T4C.3 Definition and ratio mechanics register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | Credit agreement definitions | Net income plus taxes, interest, non-cash charges, uncapped one-off and transaction costs, dividend equivalents, cost savings capped at 25% | Covenant EBITDA reconciliation | Raises every ratio and grower basket | Add-backs inflate capacity | Negative — Covenant Erosion | L10 |
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over four-quarter EBITDA; pro forma for acquisitions | Covenant debt, Unrestricted Cash, EBITDA | Governs distributions, incremental and maintenance | Cash netting and add-backs widen room | Negative — Leverage Increase | L10 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Consolidated Total Indebtedness less Unrestricted Cash over EBITDA | Secured covenant debt, cash, EBITDA | Governs pari secured debt | Caps first-lien dilution | Neutral — Stable | L10 |
| Unrestricted Cash | Credit agreement definitions | Cash of Holdings, borrower and restricted subsidiaries free of liens except loan liens | Cash by entity and encumbrance | Netting credit | October payment cut the credit | Negative — Liquidity Deterioration | L09 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Separate EBITDA for the maintenance test; full text not read | Full definition | Governs maintenance test only | Not established | Insufficient Information | L01 |
| Consolidated Fixed Charge Coverage Ratio | 2027 and 2033 indentures | Four-quarter EBITDA over fixed charges, pro forma for debt and acquisitions | Covenant EBITDA and fixed charges | Governs indenture ratio debt and distributions | 2.0x is a low bar | Negative — Leverage Increase | L16; L20 |
| Total Assets | Credit agreement investment clause (10) | 25% of the borrower's Total Assets | Borrower Total Assets definition | Sizes general investment basket | Large asset-based basket | Insufficient Information | L08 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver exposure trigger for maintenance test | max-ratio | 40.00% | 7.36% | Revolving credit exposure divided by revolving commitments at quarter-end | 32.64% | Compliant | Uses USD 67 million letters of credit over USD 910 million; cash-collateralised letters of credit not identified | Test stays dormant until heavy revolver use | Neutral — Stable | L01; L03 |
| Maintenance consolidated net leverage | max-ratio | 7.50x | [Insufficient Information] — missing: current tested ratio | Covenant net debt over Financial Covenant EBITDA | [Insufficient Information] — missing: current tested ratio | Not Calculable | Not tested at year-end because trigger not met; issuer states compliance | Breach would only bind revolver lenders first | Insufficient Information | L01; L02 |
| Ratio restricted-payment test | max-ratio | 6.75x | [Insufficient Information] — missing: current tested ratio | Pro forma covenant net leverage after payment and financing | [Insufficient Information] — missing: current tested ratio | Not Calculable | Reported net leverage 4.88x year-end and 6.02x pro forma for October 2024 are not covenant measures | Governs further distributions | Insufficient Information | L07; L24 |
| Incremental total net leverage | max-ratio | 7.25x | [Insufficient Information] — missing: current tested ratio | Pro forma covenant net leverage after incremental loans | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 5.50x on reported figures, not covenant | Governs incremental loans and junior debt | Insufficient Information | L04; L24 |
| Pari secured net leverage | max-ratio | 5.00x | [Insufficient Information] — missing: current tested ratio | Pro forma covenant secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 4.22x on reported figures, not covenant | Caps first-lien dilution | Insufficient Information | L04; L06; L24 |
| Indenture fixed-charge coverage | min-ratio | 2.00x | [Insufficient Information] — missing: current tested ratio | Covenant EBITDA over fixed charges, pro forma | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 3.24x on reported figures, not covenant | Governs indenture ratio debt and distributions | Insufficient Information | L15; L16 |
| Indenture secured ratio-debt liens | max-ratio | 5.25x | [Insufficient Information] — missing: current tested ratio | Pro forma covenant secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Credit agreement 5.00x binds the same borrower | Looser note-level lien test | Insufficient Information | L16 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Incremental facility capacity | Section 2.24 | Ratio Basket: unlimited subject to 7.25x and 5.00x | No default; maturity and life limits for Other Term Loans | [Insufficient Information] — covenant ratios not supplied | USD 1,500 million Tranche L in September 2024 | [Insufficient Information] — covenant ratios not supplied | [Insufficient Information] — covenant ratios not supplied | Formula Extracted Only | High | Pari incremental dilutes first lien | Negative — Leverage Increase | L04; L14 |
| Lien capacity | Permitted Indebtedness (12) | Ratio Basket: pari secured at 5.00x secured net; junior or unsecured at 7.25x | Maturity after term loans; Loan Party obligors only | [Insufficient Information] — covenant ratios not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — covenant ratios not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | High | Pari secured dilution | Negative — Leverage Increase | L06 |
| Debt incurrence capacity | Permitted Indebtedness (13) | Grower Basket: greater of USD 250 million and 10% EBITDA | Borrower and guarantors | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Free-and-clear debt | Negative — Leverage Increase | L06 |
| Debt incurrence capacity | Permitted Indebtedness (14) | Grower Basket: greater of USD 450 million and 18% EBITDA at foreign subsidiaries | Includes subsidiary preferred stock | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Structurally senior debt at non-guarantors | Negative — Leverage Increase | L06 |
| Debt incurrence capacity | Permitted Indebtedness (18) | Grower Basket: greater of USD 725 million and 20% EBITDA securitization | Non-recourse | USD 650 million facility | USD 487.5 million at year-end; full after 2024-10-16 draw | Fixed component USD 725 million | [Insufficient Information] — covenant EBITDA not supplied | Ready with Limitations | Low | Receivables leave collateral | Neutral — Stable | L06; L22 |
| Restricted payment capacity | Section 6.02 final paragraph | Ratio Basket: unlimited at 6.75x net leverage | No default | [Insufficient Information] — covenant ratio not supplied | USD 4,348 million paid 2024-10-18 under unspecified baskets | [Insufficient Information] — covenant ratio not supplied | [Insufficient Information] — covenant ratio not supplied | Formula Extracted Only | Critical | Debt-funded payouts | Negative — Leverage Increase | L07; L22 |
| Restricted payment capacity | Section 6.02(7) | General Basket: greater of USD 75 million and 3% EBITDA | No default | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | Low | Small payouts | Neutral — Stable | L07 |
| Builder / available amount capacity | Indenture Section 4.07(ii) | Builder Basket: USD 400 million plus 50% cumulative net income since 2010-10-01 plus equity proceeds | No default; ratio payments excluded from usage | [Insufficient Information] — cumulative net income not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — inputs not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | High | Reset preserves builder | Negative — Leverage Increase | L15 |
| Restricted payment capacity | Indenture Section 4.07 ratio paragraph | Ratio Basket: unlimited above 2.0x coverage | No default | [Insufficient Information] — covenant coverage not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — covenant coverage not supplied | [Insufficient Information] — covenant coverage not supplied | Formula Extracted Only | High | Weak note-level restraint | Negative — Leverage Increase | L15; L20 |
| Investment capacity | Permitted Investments (1)(a) | Uncapped investments in restricted subsidiaries | None stated | Not applicable: uncapped | [Insufficient Information] — usage not supplied | Uncapped | Uncapped | Ready with Limitations | High | Transfer to non-guarantors | Negative — Covenant Erosion | L08 |
| Investment capacity | Permitted Investments (10) | General Basket: greater of USD 500 million and 25% Total Assets | Outstanding amount | [Insufficient Information] — borrower Total Assets not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — Total Assets not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | High | Large asset-based leakage | Negative — Covenant Erosion | L08 |
| Investment capacity | Permitted Investments (20) | Ratio Basket: unlimited at 5.75x | No default; no revolver loans; Unrestricted Cash at least USD 200 million | [Insufficient Information] — covenant ratio not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — covenant ratio not supplied | [Insufficient Information] — covenant ratio not supplied | Formula Extracted Only | High | Unlimited investment below 5.75x | Negative — Covenant Erosion | L08 |
| Unrestricted subsidiary capacity | Permitted Investments (1)(c) and designation | Grower Basket: greater of USD 250 million and 10% EBITDA; new subsidiaries only | Certification of compliance with Sections 6.02 and 6.16 | [Insufficient Information] — covenant EBITDA not supplied | No unrestricted subsidiary identified | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Bounded drop-down | Neutral — Stable | L08; L09 |
| Guarantor / collateral release capacity | Section 9.02(c); indenture Section 12.07 | Automatic release on permitted disposal; notes follow bank release | Disposal permitted under Section 6.03 | Not applicable: event-driven | [Insufficient Information] — release history not supplied | Not applicable: event-driven | Not applicable: event-driven | Ready with Limitations | High | Collateral shrinks without noteholder vote | Negative — Covenant Erosion | L11; L19 |

Baskets are not summed: the debt baskets may be divided and reclassified at the borrower's discretion, and the indenture allows one payment to be split across clauses, so capacities overlap.

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari incremental term loans | Unlimited within 7.25x and 5.00x | Formula Extracted Only; proxy 4.22x secured | Equal-priority claims added to collateral | Moderate | High dilution for first lien | First-lien loans and notes exposed equally | L04 |
| Pari secured notes or loans outside the facility | 5.00x secured net under credit agreement; 5.25x under indenture | Formula Extracted Only | Agent must document pari liens on request | Moderate | High dilution for first lien | Notes and loans equally exposed | L06; L11; L16 |
| Junior and unsecured debt | 7.25x net under credit agreement; above 2.0x coverage under indenture | Formula Extracted Only | Layering ahead of equity, pari or ahead of subordinated notes | Moderate | Moderate for subordinated notes | Subordinated notes most exposed | L06; L16 |
| Non-guarantor debt | Foreign greater of USD 450 million and 18% EBITDA; indenture USD 400 million ratio-debt cap | Formula Extracted Only | Structurally senior claims at non-guarantors | Low | Moderate | All guaranteed classes | L06; L16 |
| Uptier through amendment | Required lenders may amend terms not on the every-lender list | Not calculable: depends on lender votes | Possible subordination of non-consenting lenders | Low | High for excluded lenders | Larger holdings protect | L11 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Shareholder distributions | USD 4,348 million paid 2024-10-18, funded partly by Tranche L and 2033 notes | Credit agreement 6.75x ratio; indenture 2.0x coverage | Used; remaining not established | Cash leaves restricted group | Critical | Negative — Leverage Increase | L07; L14; L15; L22 |
| Investments in non-guarantor restricted subsidiaries | Uncapped | Permitted Investments (1)(a) | Not established | Value leaves guarantees and collateral, stays in restricted group | High | Negative — Covenant Erosion | L08 |
| Investments outside the group | General USD 500 million or 25% Total Assets; JV USD 1,000 million or 40% EBITDA at 7.00x; unlimited at 5.75x | Permitted Investments (10), (11), (20) | Not established | Value leaves restricted group | High | Negative — Covenant Erosion | L08 |
| Unrestricted subsidiary designation | New subsidiaries only | Designation conditions plus investment baskets | No designation identified | Bounded; existing collateral not designable | Moderate | Neutral — Stable | L09 |
| Asset sales | Automatic lien release on permitted disposal | Section 6.03 and Section 9.02(c) | Not established | Collateral released with proceeds rules | Moderate | Negative — Covenant Erosion | L11; L19 |

### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Unusual, nonrecurring, acquisition, integration, restructuring costs | Consolidated EBITDA (2)(d) | Uncapped | Not calculable: covenant reconciliation not supplied | Recurring acquisition costs boost every ratio | PD up through relevering capacity | L10 |
| Transaction and refinancing expenses | Consolidated EBITDA (2)(e) | Uncapped, successful or not | Not calculable | Financing costs raise capacity for more financing | PD up | L10 |
| Dividend-equivalent payments | Consolidated EBITDA (2)(k) | Uncapped | Not calculable; October payment USD 132 million | Distributions to option holders raise covenant EBITDA | PD up; circular payout effect | L10; L22 |
| Projected cost savings | Consolidated EBITDA (2)(m) | 25% of EBITDA; actions within 24 months | Not calculable | Unrealised savings raise capacity | PD and LGD up if savings fail | L10 |
| Earn-outs and deferred purchase price | Consolidated EBITDA (2)(i) | Uncapped | Not calculable | Acquisition consideration excluded | PD up | L10 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Demonstrated debt-funded distribution | Tranche L proceeds fund the special dividend | Repeat relevering | Critical | High | Committee decision; Downside | L14 |
| Builder reset after ratio payments | Indenture final paragraph of Section 4.07 | Two stacked payout routes | High | High | Committee decision | L15 |
| Reclassification and splitting | Debt divisible across clauses; payments split across clauses | Capacity hard to track | Moderate | High | Recovery & fulcrum | L06; L15 |
| Uncapped transfers to non-guarantors | Permitted Investments (1)(a) | Structural subordination grows | High | High | Structural priority; Recovery & fulcrum | L08 |
| Notes release follows bank | 2033 indenture Section 12.07(e)(B) | Noteholder collateral loss without vote | High | High | Intercreditor control; Security selection | L19 |
| Subordination not every-lender | Section 9.02(b) list as reviewed | Uptier exposure | High | Moderate | Refinancing & LME; Security selection | L11 |

### T4C.11 Capacity risk prioritisation matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Ratio distribution baskets | Critical | Moderate | Debt-funded payouts | Higher | Moderate | Compliance certificates; issuance use of proceeds | L07; L15 |
| 2 | Pari secured and incremental capacity | High | Formula Only | First-lien dilution | Moderate | Higher | Secured ratio disclosures | L04; L06 |
| 3 | Transfers to non-guarantors | High | Formula Only | Value behind non-guarantor creditors | Low | Moderate | Guarantor share of sales | L08; L21 |
| 4 | EBITDA add-backs | High | Formula Only | Ratio inflation | Higher | Moderate | Covenant EBITDA reconciliation | L10 |
| 5 | Amendment and release mechanics | High | Moderate | Uptier and release | Low | Higher | Amendment filings | L11; L19 |

### T4C.12 Capacity gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificates | Covenant ratios and EBITDA | Exact headroom | All ratio headroom not calculable | Obtain certificates |
| Basket usage | Usage tracker | Remaining capacity | Remaining capacity not established | Obtain tracker |
| Covenant EBITDA bridge | Reconciliation to reported EBITDA | Add-back inflation size | Inflation not quantified | Obtain bridge |
| Borrower Total Assets | Definition and amount | General investment basket size | Basket not sized | Obtain borrower figures |
| Cumulative net income since 2010 | Indenture builder inputs | Builder size | Builder not sized | Obtain historical figures |
| Amendment No. 17 Effective Date | Defined term location | MFN sunset date | Sunset date not fixed | Read amendment conditions |

### T4D.1 Entity source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement Section 5.11 | Executed | 1 | Guarantor schedule and collateral agreement not supplied | Completed with Limitations |
| 2033 indenture Articles X and XII | Executed | 1 | Security documents not supplied | Completed with Limitations |
| Annual report guarantor note and summarised financials | Issuer filing | 4 | Combined figures; exhibit list of guarantors not supplied | Completed with Limitations |
| Subsidiary list and organisation chart | Not supplied | Not ranked | Entity-level perimeter not established | Completed with Limitations |

### T4D.2 Entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware, United States | None stated | Not a subsidiary; Loan Party | No significant operations or assets apart from its investment in the borrower | Yes | L21 |
| TransDigm Inc. | Borrower and note issuer | Delaware, United States | TransDigm Group Incorporated | Borrower | Operating holding company; value — not separately disclosed | Yes | L21; L14 |
| TransDigm UK Holdings plc | Guarantor | United Kingdom | [Insufficient Information] — parent not stated in reviewed text | Restricted; guarantor | — not separately disclosed | Yes | L21 |
| Domestic restricted subsidiaries | Guarantors | United States | TransDigm Inc. | Restricted; existing ones not designable as unrestricted | Guarantor group sales USD 6,294 million combined with parent and borrower | Yes | L12; L21 |
| Foreign subsidiaries | Non-guarantors | Various non-US | Domestic Loan Parties | Restricted; 65% voting equity pledged | Non-guarantor sales about USD 1,646 million by difference | No for guarantees | L12; L21 |
| Immaterial domestic subsidiaries | Excluded subsidiaries | United States | Domestic Loan Parties | Excluded while immaterial | — not disclosed | No | L12 |
| Securitization entity | Excluded subsidiary | United States | [Insufficient Information] — not stated | Excluded | Domestic trade receivables collateral | No | L12; L22 |
| Unrestricted subsidiaries | Unrestricted | Not applicable | Not applicable | None identified | — none identified | No | L09 |

### T4D.3 Guarantee coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facility | Senior secured | Upstream | Every-lender consent for material guarantor release except as permitted | L11 |
| TransDigm Group Incorporated × secured notes | Senior secured | Upstream | Per indenture terms; Article X text not reviewed | L21 |
| TransDigm Group Incorporated × subordinated notes | Senior subordinated unsecured | Upstream | Per indenture; not reviewed | L21 |
| TransDigm UK Holdings plc × 2028 and later secured notes | Senior secured | Cross-stream | Not established | L21 |
| Domestic restricted subsidiaries × credit facility | Senior secured | Cross-stream | Disposal, immateriality, unrestricted designation of new subsidiaries | L11; L12 |
| Domestic restricted subsidiaries × secured notes | Senior secured | Cross-stream | Liens released when guarantee released; unrestricted designation; immaterial status | L19 |
| Domestic restricted subsidiaries × subordinated notes | Subordinated | Cross-stream | Not established | L21 |
| Foreign subsidiaries × all tranches | None | Not applicable | Not applicable | L12; L21 |

### T4D.4 Collateral matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × first lien | Equity of unrestricted subsidiaries; other exclusions — not supplied | Every-lender for all collateral; disposal release | Post-closing perfection within 90 days for 2033 notes | L11; L12 |
| TransDigm Inc. × first lien | Equity requiring separate SEC financial statements; unrestricted subsidiary equity | Bank agent release carries notes release | Collateral agreement not supplied | L12; L19 |
| TransDigm UK Holdings plc × first lien | — not established | Follows Intercreditor Agreement | UK collateral agent appointed; local-law limits not established | L18 |
| Domestic restricted subsidiaries × first lien | Immaterial and securitization entities excluded | Disposal; immateriality; unrestricted designation | — not established | L12; L19 |
| Foreign subsidiaries × first lien | Assets unpledged; only 65% of voting equity pledged | Not applicable | Tax-driven pledge limit | L12 |
| Securitization entity × receivables lien | Not first-lien collateral | Facility terms not supplied | — not established | L22 |
| All entities × subordinated notes | No lien | Not applicable | Not applicable | L21 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc. with Holdings and domestic guarantors | Guarantor group assets and 65% of foreign voting equity | Pari (same entity, same lien) | Foreign subsidiary assets, about USD 1,646 million of sales, reachable only through equity | Strong access, diluted by pari debt | Medium | L12; L21 |
| Secured notes | Same obligors | Same collateral under the Intercreditor Agreement | Pari (same entity, same lien) | Same non-guarantor value | Same as loans but release and enforcement controlled through agents | Medium | L18; L19 |
| Subordinated notes | Same obligors, subordinated guarantees | Residual after first lien | Contractually Subordinated | Non-guarantor value and all collateral value until first lien paid | Weakest access; blockage risk | High | L20; L21 |
| Securitization | Securitization entity | Domestic trade receivables | Structurally Senior | Receivables unavailable to first-lien holders to the extent sold | Senior on receivables | Medium | L22 |
| Non-guarantor creditors | Foreign subsidiaries | Foreign subsidiary assets | Structurally Senior | Guarantor creditors reach only residual equity value | Senior to all guaranteed classes on those assets | Medium | L21 |

### T4D.6 Leakage route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distribution | TransDigm Inc. to Holdings to shareholders | Credit agreement Section 6.02 ratio clause; indenture Section 4.07 | Cash; USD 4,348 million paid | 4 | Cash leaves all creditors | Demonstrated | L07; L15 |
| Transfer to non-guarantor | Guarantors to foreign restricted subsidiaries | Permitted Investments (1)(a) | Uncapped | 3 | Moves value behind non-guarantor creditors, bounded by their debt caps | Theoretical | L08; L16 |
| Unrestricted designation | New subsidiary outside restricted group | Unrestricted Subsidiary definition; Permitted Investments (1)(c), (10), (20) | Investment basket amounts | 3 | Value leaves restricted group | Theoretical | L08; L09 |
| Asset sale | Guarantor to third party | Section 6.03; Section 9.02(c) | Sold collateral | 3 | Liens released; proceeds rules apply | Theoretical | L11; L19 |
| Receivables transfer | Domestic operations to securitization entity | Permitted Indebtedness (18) | Receivables up to greater of USD 725 million and 20% EBITDA | 2 | Receivables outside first lien | Demonstrated | L06; L22 |

### T4D.7 Priming exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by required-lender amendment | Section 9.02(b) every-lender list omits subordination in reviewed text | Non-consenting term and revolving lenders | Theoretical | Possible priming of excluded lenders | Medium | L11 |
| Non-pro-rata class offers | Section 9.02(b) proviso | Lenders declining offers | Theoretical | Selective repayment or extension | Medium | L11 |
| Notes collateral release by bank action | 2033 indenture Section 12.07(e)(B) | Secured noteholders | Theoretical | Notes could lose liens the bank releases | High | L19 |
| Intercreditor amendment | 2033 indenture Section 9.02 two-thirds hurdle | Secured noteholders | Theoretical | Adverse change needs two-thirds | High | L17 |
| Drop-down to non-guarantor | Permitted Investments (1)(a) | All guaranteed classes | Theoretical | Value placed behind structurally senior debt | Medium | L08 |

### T4D.8 Structural gaps

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit list of obligors and guarantors | Entity perimeter | Entity rows are classes, not named subsidiaries | Obtain guarantor exhibit |
| Collateral agreement | Guarantee and collateral agreement | Excluded assets and perfection | Collateral rows partial | Obtain executed agreement |
| Entity-level value | Assets and EBITDA by entity | Stranded value sizing | Only sales split available | Obtain entity financials |
| Securitization documents | Receivables purchase and loan agreements | Recourse and priority | Securitization treated qualitatively | Obtain facility documents |
| Indenture guarantee releases | Article X of each indenture | Release triggers | Note guarantee releases partly established | Read Article X |

### T4F.1 Controlling intercreditor documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders No. 1 to 6 | Company, Holdings, subsidiary guarantors, credit agreement collateral agent, secured-note trustees and collateral agents | 2019-02-13; joinders 2020-04-08 to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Not supplied | d887611dex41.htm.jsonl, page 30 | L18 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, guarantors, Bank of New York Mellon entities | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 126–127 | L18; L23 |
| Credit agreement as amended | TransDigm Inc., Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2014-06-04 base; amended 2024-09-19 | New York | Executed | d887611dex101.htm.jsonl, page 222 | L13 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, trustee | 2019-11-13 | [Insufficient Information] — governing-law text not read | Executed text supplied | d826058dex41.htm.jsonl, page 107 | L20 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | First-lien collateral | Control maintenance-test waivers and acceleration | USD 910 million commitments | L01; L03 |
| Term lenders | First lien, pari | First-lien collateral | Required lenders control facility amendments | USD 8,702 million, 44.17% of first-lien funded principal | L11; K12 |
| Secured noteholders | First lien, pari | First-lien collateral via notes collateral agents | No direct enforcement; through agents and the ICA | USD 11,000 million, 55.83% of first-lien funded principal | L18; K12 |
| Subordinated noteholders | Contractually subordinated | None | Subject to payment blockage | USD 4,600 million | L20 |
| Securitization lenders | Structurally senior on receivables | Domestic trade receivables | [Insufficient Information] — facility documents not supplied | USD 487.5 million drawn at year-end | L22 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement under ICA | [Insufficient Information] — intercreditor agreement not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Secured noteholders and lenders | Controlling representative not established | Insufficient Information | L18 |
| No direct noteholder action | Not a time-limited standstill | Always | Notes collateral agents | Secured noteholders | Holders depend on agent and ICA | Negative — Covenant Erosion | L18 |
| Subordinated payment blockage | Up to 179 days; one period per 360 days; 181 days free | Non-payment default on designated senior debt with blockage notice | Representative of designated senior debt | Subordinated noteholders | Coupons stop during stress | Negative — Liquidity Deterioration | L20 |
| Maintenance covenant default | Not applicable | Breach of 7.50x when trigger met | Required revolving lenders | Term lenders | Term lenders cannot act until revolver acceleration | Negative — Covenant Erosion | L01 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes | Section 10.05 "When Distribution Must Be Paid Over" exists; terms not read | Not applicable | Not applicable | Subordination article | Turnover detail not established | L20 |
| Notes lien release | Not applicable | Credit agreement collateral agent's release releases notes liens | [Insufficient Information] — ICA not in the source set | Except release on full discharge not tied to enforcement | Two-thirds hurdle for releasing substantially all collateral by amendment | L17; L19 |
| Credit agreement release | Not applicable | Automatic on permitted disposal; every lender for all collateral | Not applicable | Disposal compliant with agreement | Every-lender protection for all collateral | L11 |
| First-lien sharing | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Indenture says the ICA controls conflicts | L18 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Share collateral pari with notes | Subordination not every-lender in reviewed text | High | Majority-led restructuring could prime holdouts | Negative — Covenant Erosion | L11 |
| Revolving lenders | Share collateral pari; control maintenance test | Test dormant until 40% use | Moderate | Late intervention | Negative — Covenant Erosion | L01 |
| Secured noteholders | Recover through agents under ICA | Release and enforcement follow bank-side decisions | High | Value released or realised without noteholder vote | Negative — Covenant Erosion | L18; L19 |
| Subordinated noteholders | Residual after first lien; blockage | Payment blockage and subordination | High | Paid last; coupons can stop | Negative — Refinancing Risk | L20 |

### T4F.6 Intercreditor gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Executed agreement and joinders | Enforcement control, standstill, turnover, purchase rights | Enforcement rows insufficient | Obtain agreement |
| Subordinated turnover terms | 2027 indenture Section 10.05 full text | Turnover mechanics | Turnover partly established | Read clause |
| Other secured indentures | Release and amendment provisions | Series differences | Analysis based on 2033 notes | Obtain indentures |
| Securitization intercreditor terms | Facility documents | Receivables priority | Securitization rights not established | Obtain documents |

### Verification

| Register set | Result | Note |
|---|---|---|
| Legal covenant registers | PASS | Present with required columns; gaps logged |
| Capacity registers | PASS | Formula-level only where usage and ratios missing |
| Structural registers | PASS | Entity classes used; undisclosed values shown as a dash |
| Intercreditor registers | PASS | ICA-dependent cells marked with the missing document |

### Material claim lineage

| Claim | Material claim | Strongest lineage |
|---|---|---|
| 1 | Springing revolver-only 7.50x covenant at 40% usage | Directly Sourced |
| 2 | Maintenance test dormant at year-end, 7.36% usage | Calculated |
| 3 | Unlimited distributions at 6.75x and above 2.0x coverage | Directly Sourced |
| 4 | Indenture builder basket preserved after ratio payments | Directly Sourced |
| 5 | Tranche L proceeds funded the special dividend | Directly Sourced |
| 6 | Incremental and pari secured tests at 7.25x and 5.00x | Directly Sourced |
| 7 | MFN 50 bp with 18-month sunset | Directly Sourced |
| 8 | Covenant EBITDA add-backs incl. dividend equivalents and 25% cost-savings cap | Directly Sourced |
| 9 | Subordination absent from every-lender list in reviewed text | Analyst Inference |
| 10 | Notes liens follow bank release; no direct enforcement | Directly Sourced |
| 11 | 179-day payment blockage | Directly Sourced |
| 12 | Guarantor share of sales 79.27% | Calculated |
| 13 | Proxy ratios 5.50x, 4.22x and 3.24x | Calculated |
| 14 | Overall aggressiveness Aggressive | Analyst Inference |
| 15 | First-lien enforcement control | Insufficient Information |
| 16 | Covenant-basis headroom and basket usage | Insufficient Information |

Legal & covenants completed with limitations; the key gaps are the intercreditor agreement, compliance certificates, basket usage and the remaining indentures.

## Calculations

All amounts are USD millions at 30 September 2024 unless stated; ratios use the same currency and scale. Proxy ratios use reported or issuer-adjusted figures from the financial foundation and are not covenant calculations.

| ID | Quantity | Formula and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | Revolver exposure trigger | 910 × 0.40 | 364.00; matches the USD 364 million stated by the issuer | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| K02 | Exposure room below trigger | 364 − 67 | 297 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K03 | Revolver exposure share | 67 / 910 = 0.073626…; headroom 40.00 − 7.36 | 7.36%; headroom 32.64% | % of commitments | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K05 | Guarantor share of net sales | 6294 / 7940 = 0.792695… | 79.27% | % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K06 | Non-guarantor sales by difference | 7940 − 6294 | 1646; ignores intercompany sales of 28 shown separately | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K07 | Proxy total net leverage after October 2024 dividend | 22967 / 4173 = 5.503714… | 5.50x | x | Financial foundation (CP-1) |
| K08 | Proxy secured net debt after October 2024 dividend | 19534 − 1913 | 17621 | USD million | Financial foundation (CP-1) |
| K09 | Proxy secured net leverage | 17621 / 4173 = 4.222621… | 4.22x | x | Financial foundation (CP-1) |
| K10 | Proxy fixed-charge coverage | 4173 / 1286 = 3.244945…; uses FY2024 net interest expense before the September debt | 3.24x | x | Financial foundation (CP-1) |
| K11 | Principal totals | Secured notes 2100 + 2750 + 1450 + 1000 + 2200 + 1500; subordinated 2650 + 1200 + 750; first-lien funded 8702 + 11000 | 11000; 4600; 19702 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K12 | First-lien funded shares | 8702 / 19702 = 0.441681…; 11000 / 19702 = 0.558318… | 44.17% term loans; 55.83% secured notes | % | calculation K11 |

Inherited figures used without change: dividend payment USD 4,348 million, year-end reported net leverage 4.88x and pro forma 6.02x for the October 2024 payment, pro forma cash USD 1,913 million, identified secured carrying debt USD 19,534 million, reported EBITDA USD 3,813 million and EBITDA As Defined USD 4,173 million, all from the financial foundation.

## Gaps

| Gap | Missing or unresolved | Effect on conclusions | Required follow-up |
|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and six joinders | Enforcement control, standstill, turnover and purchase options among first-lien holders not established | Obtain executed agreement |
| Covenant-basis ratios | Compliance certificates, covenant EBITDA, Unrestricted Cash, Consolidated Total Indebtedness | No exact headroom for the 6.75x, 7.25x, 5.00x, 7.50x and 2.0x tests | Obtain certificates and definitions |
| Basket usage | Usage records | Remaining capacity not established | Obtain tracker |
| Remaining indentures and security documents | Five secured-note and two subordinated-note indentures; collateral agreement | Series differences and excluded assets not established | Obtain documents |
| Tranche L MFN sunset | Amendment No. 17 Effective Date not located; protection lapses 18 months after that date | No dated sunset event recorded | Locate the defined effective date |
| 2033 notes perfection deadline | Issue Date not confirmed; perfection due within 90 days after it | No dated deadline recorded | Confirm Issue Date |
| Market-norm comparison | No covenant-review or comparative source | Market-norm judgements not made | Obtain a comparative source |

## Next module
The orchestrator selects the next module.
