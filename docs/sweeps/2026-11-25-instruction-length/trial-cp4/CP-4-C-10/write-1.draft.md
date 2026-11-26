## Request
TransDigm Group Incorporated, as of 2024-09-30; pathway: deep_credit_assessment. Scope: provision-level legal and covenant review, restricted-group and guarantee map, intercreditor control and covenant capacity, read from the supplied credit agreement, amendments and indentures.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, with annexed conformed text of the amended credit agreement | 2024-09-19, agreement date; publication not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Governing loan covenants: financial covenant, EBITDA definitions, debt, lien, investment and restricted-payment permissions, incremental and MFN terms, events of default, amendments, releases, guarantor and pledge requirements |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 | 2024-09-19, indenture date; publication not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants: restricted payments, ratio debt, lien ratio, amendments, guarantor release, intercreditor references, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date; publication not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, payment blockage, turnover and ratio restricted-payment permission |
| d833756dex101.htm.jsonl | Amendment No. 16, loan modification and refinancing facility agreement | 2024-06-04, agreement date; publication not stated | 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac | Amendment chain only; text not separately reviewed; its changes are read through the later conformed text |
| d739389dex101.htm.jsonl | Amendment and restatement agreement with the second restated credit agreement | 2014-06-04, agreement date; publication not stated | 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547 | Base agreement in the amendment chain; not separately reviewed |
| d496141dex101.htm.jsonl | Amendment and restatement agreement (earlier credit-agreement family) | 2013-02-28, agreement date; publication not stated | f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3 | Historical provenance only; superseded |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer summary of covenants, compliance statement, revolver usage, securitization facility, guarantor structure and obligor-group summary financials; retrospective evidence |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source inventory, amendment chain, temporal boundary and legal-coverage gaps |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt, net debt, cash, EBITDA As Defined, debt instruments and the October 2024 post-balance-sheet adjustments |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Ownership of TransDigm Inc., dividend recapitalisation facts and payment dates |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence of add-back categories, used only as context for covenant EBITDA inflation |

## Findings

### Bottom line
Covenant protection for TransDigm's term lenders and bondholders is thin and ratio-governed: no maintenance test reaches them, distributions are unlimited within a 6.75x loan leverage test or a 2.00x bond coverage test, and pari secured debt can grow to 5.00x.

The September 2024 recapitalisation shows the documents working as drafted: USD 3,000 million of new secured debt funded a USD 4,348 million distribution using existing permissions, not a covenant amendment. Guarantor and all-collateral releases need every lender, so the main creditor risk is pari secured dilution and value leakage rather than priming. The package scores four on the five-point aggressiveness scale, provisionally, because the intercreditor agreement and covenant ratio calculations are not available.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 75–76; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; Business & governance (CP-1A)

### Key findings
- **Maintenance protection effectively stops at the revolver, so term lenders and bondholders get no early warning.** The only financial covenant caps consolidated net leverage at 7.50x (8.00x for four quarters after an acquisition above USD 300 million) and is tested only when revolver exposure exceeds 40% of commitments, or USD 364 million. Year-end exposure was USD 67 million of letters of credit, or 7.36%, leaving 32.64 percentage points before the test springs. A breach is a default for revolving lenders only until they accelerate, and revolving lenders alone can amend it. PD signalling for the rest of the structure is therefore weak.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; d887611dex101.htm.jsonl, page 52; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L01; calculation L03; calculation L04
- **Distribution capacity is uncapped in amount and limited only by ratio tests, and the bonds are looser than the loans.** The credit agreement permits any restricted payment if pro forma consolidated net leverage is at or below 6.75x with no default; the 2033 secured and 2027 subordinated indentures permit any restricted payment while fixed charge coverage exceeds 2.00x, and a payment contracted while the test is met may be completed after it fails. The USD 4,348 million distribution paid in October 2024 is the demonstrated use. This is the main LGD leakage channel because cash leaves the group with no fixed ceiling.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 75–76; d826058dex41.htm.jsonl, page 64; Business & governance (CP-1A)
- **Pari secured ratio debt is the nearest pressure point for first-lien recovery.** New first-lien debt, including incremental term loans, is permitted up to a secured net debt ratio of 5.00x under the loans and 5.25x under the 2033 notes' lien basket, netting all unrestricted cash and measured on covenant EBITDA that admits uncapped projected cost savings. MFN protection is 50 bp, falls away after 18 months and excludes acquisition debt. On an issuer-measure proxy, year-end secured net debt was 3.18x EBITDA As Defined; the post-dividend figure on that basis is not established, although cash fell to USD 1,913 million pro forma after the October 2024 payment.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, pages 144–146; d887611dex101.htm.jsonl, pages 41–42; d887611dex41.htm.jsonl, page 43; calculation L06; Financial foundation (CP-1)
- **The guarantee and collateral release architecture protects against priming, but value can move to non-guarantors.** Releasing a material guarantor or all or substantially all collateral needs every lender; the 2033 notes need two-thirds of holders for a collateral release and every affected holder to change ranking. However, investments in any restricted subsidiary are unlimited, foreign subsidiaries guarantee nothing and only 65% of their voting equity is pledged, and non-guarantor subsidiaries generated USD 1,646 million, or 20.73%, of FY2024 sales.
Basis: d887611dex101.htm.jsonl, pages 205–207; d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, pages 173–174; d887611dex41.htm.jsonl, pages 117–118; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation L08
- **Uptier risk is theoretical rather than demonstrated, and cannot be closed without the intercreditor agreement.** The unanimous-consent list reviewed in the loan amendment clause covers pro rata sharing, collateral and guarantor releases, but does not expressly list subordination of liens or payment; Required Lenders can authorise non-pro-rata prepayment offers and loan modification offers if made to all lenders of a class. Loan-side unrestricted-subsidiary designation is limited to newly acquired or newly formed subsidiaries, which narrows the drop-down route.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, page 30

### Contrary evidence and what would change the view
The strongest counter-case is that every large permission is ratio-gated rather than a fixed free-and-clear basket: secured debt stops at 5.00x, total and junior debt at 7.25x, distributions at 6.75x, and the September financing had to be certified within the incremental ratios before funding. The general cost-savings add-back is capped at 25% of EBITDA outside the financial covenant, the issuer states full compliance at year-end, and the release protections make a non-consensual uptier or collateral strip harder than in many leveraged structures. On the issuer's own EBITDA As Defined, year-end net leverage of 4.46x sits 3.04x below the springing level, although Financial foundation's October 2024 pro forma net leverage on reported EBITDA is 6.02x, with pro forma net debt of USD 22,967 million against year-end USD 18,619 million. The view would soften if compliance certificates showed covenant ratios well inside the 6.75x and 5.00x tests after the distribution, or if the intercreditor agreement gives the bank agent no unilateral release or enforcement power over noteholders. It would harden if new secured issuance approached the 5.00x test, if another distribution were declared while coverage merely exceeded 2.00x, or if material assets moved to foreign or newly designated unrestricted subsidiaries.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, pages 3–4; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L05; Financial foundation (CP-1)

### Limitations
- The intercreditor agreement among first-lien creditors is not in the documents, so the conclusion that loans and secured notes share collateral equally is limited to the indenture's description; who directs enforcement, how releases bind noteholders and any turnover between first-lien classes are not established, which keeps the intercreditor severity provisional.
- No compliance certificate or covenant EBITDA figure is available, so every incurrence, distribution and investment headroom is formula-only; the proxy ratios on EBITDA As Defined probably overstate covenant leverage because covenant EBITDA admits uncapped projected savings, so the conclusion that ratio capacity is ample rests on a conservative proxy rather than a tested figure.
- Only the 2033 secured and 2027 subordinated indentures were reviewed; the conclusions on bond-level distribution and lien permissions are extended to the other five secured and two subordinated note issues only on the annual report's statement that their covenants are substantially similar.
- The guarantee and collateral agreement and other security documents are absent, so excluded assets, perfection limits and release mechanics come from the credit agreement and indenture text alone and the recovery-access view stays qualitative.
- No refinancing and liability-management analysis was supplied, so the uptier and non-pro-rata exchange assessment is a document-capacity reading, not an assessment of how likely such a transaction is.

### Capital structure

| Instrument | Principal or commitment | Rank and security | Maturity | Governing document reviewed | Source |
|---|---|---|---|---|---|
| Revolving credit facility | USD 910 million commitment; USD 67 million letters of credit; USD 843 million available | Senior secured first lien; springing net leverage covenant | 2029-02-27 | Credit agreement as amended through September 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K and L | USD 8,702 million in aggregate | Senior secured first lien; no maintenance covenant | 2028-08-24 to 2032-01-19 | Credit agreement as amended through September 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2028 secured notes | USD 2,100 million | Senior secured, pari with loans; guaranteed by TD Group, TransDigm UK and domestic restricted subsidiaries | 2028-08-15 | Not in sources | Financial foundation (CP-1) |
| 2029 secured notes | USD 2,750 million | Senior secured, pari with loans | 2029-03-01 | Not in sources | Financial foundation (CP-1) |
| 2030 secured notes | USD 1,450 million | Senior secured, pari with loans | 2030-12-15 | Not in sources | Financial foundation (CP-1) |
| 2031 secured notes | USD 1,000 million | Senior secured, pari with loans | 2031-12-01 | Not in sources | Financial foundation (CP-1) |
| 2032 secured notes | USD 2,200 million | Senior secured, pari with loans | 2032-03-01 | Not in sources | Financial foundation (CP-1) |
| 2033 secured notes (6.00%) | USD 1,500 million | Senior secured, pari with loans under the first-lien intercreditor agreement | 2033-01-15 | 2033 secured notes indenture | d887611dex41.htm.jsonl, page 30; Financial foundation (CP-1) |
| 2027 subordinated notes (5.50%) | USD 2,650 million | Senior subordinated unsecured; payment blockage and turnover in favour of senior debt | 2027-11-15 | 2027 subordinated notes indenture | d826058dex41.htm.jsonl, pages 106–107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| January 2029 subordinated notes | USD 1,200 million | Senior subordinated unsecured | 2029-01-15 | Not in sources | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| May 2029 subordinated notes | USD 750 million | Senior subordinated unsecured | 2029-05-01 | Not in sources | Financial foundation (CP-1) |
| Trade receivable securitization | USD 487.5 million drawn of USD 650 million; remaining USD 162.5 million drawn on 2024-10-16 | Non-recourse securitization entity outside the loan parties | 2025-07-11 | Not in sources | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Business & governance (CP-1A) |

### Covenant tests and headroom

| Test | Type | Threshold | Current | Status | Source |
|---|---|---|---|---|---|
| Revolver springing net leverage covenant | Maintenance, max-ratio | 7.50x (8.00x after a material acquisition) | Not supplied: covenant ratio not disclosed; test inactive at year-end | Not Calculable; trigger not met | d887611dex101.htm.jsonl, page 188 |
| Revolver exposure trigger for the covenant | Trigger, max-ratio | 40.00% of commitments (USD 364 million) | 7.36% (USD 67 million letters of credit) | Below trigger; 32.64 percentage points of room | calculation L03; calculation L04 |
| Pari secured and incremental debt | Incurrence, max-ratio | 5.00x secured net debt | Not supplied: covenant ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, pages 59 and 146 |
| Junior, unsecured, subordinated and incremental debt | Incurrence, max-ratio | 7.25x net leverage | Not supplied: covenant ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, pages 59–60 and 146 |
| Unlimited restricted payments (loans) | Incurrence, max-ratio | 6.75x net leverage | Not supplied: covenant ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 181 |
| Ratio debt and unlimited restricted payments (2033 notes) | Incurrence, min-ratio | Above 2.00x fixed charge coverage | Not supplied: covenant ratio not disclosed | Not Calculable | d887611dex41.htm.jsonl, pages 75 and 79 |
| Secured ratio debt lien basket (2033 notes) | Incurrence, max-ratio | 5.25x secured net debt | Not supplied: covenant ratio not disclosed | Not Calculable | d887611dex41.htm.jsonl, page 43 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver springing consolidated net leverage | 7.50 | Not supplied: covenant ratio and covenant EBITDA not disclosed; no compliance certificate | Not supplied: current tested ratio missing | Passes at or below | x | Credit agreement financial covenant; tested only when revolver exposure exceeds 40% of commitments; 8.00x for four quarters after a material acquisition; not a compliance opinion |
| Revolver exposure trigger | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Year-end letters of credit USD 67 million over USD 910 million commitments; assumes letters of credit are not cash-collateralised; annual report page 62 states the trigger as USD 364 million |
| Pari secured and incremental debt incurrence | 5.00 | Not supplied: covenant secured net debt ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Credit agreement permitted debt and incremental conditions; incurrence test only; netting of unrestricted cash permitted by definition |
| Junior, unsecured and subordinated debt incurrence | 7.25 | Not supplied: covenant net leverage not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Credit agreement permitted debt and incremental conditions; incurrence test only |
| Ratio restricted payments under the loans | 6.75 | Not supplied: covenant net leverage not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Credit agreement restricted-payment permission; unlimited amount when met with no default |
| Ratio debt and ratio restricted payments under the 2033 notes | 2.00 | Not supplied: covenant fixed charge coverage not disclosed | Not supplied: current tested ratio missing | Passes above | x | 2033 indenture; ratio must exceed 2.0 to 1.0; non-guarantor ratio debt capped at USD 400 million |
| Secured ratio debt lien basket under the 2033 notes | 5.25 | Not supplied: covenant secured net debt ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | 2033 indenture permitted liens; incurrence test only |

Only the revolver exposure trigger has a disclosed current value; every ratio row is formula-only because no covenant calculation is disclosed, and the issuer-measure proxies in the calculations are not covenant ratios.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement dated among the company, holdings, guarantors, credit agreement collateral agent and note trustees | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs collateral sharing and enforcement among loans and secured notes; agreement itself not in sources |
| 2019-11-13 | day | 2019-11-13 | Indenture executed for the 2027 senior subordinated notes | Historical — indenture dated November 13, 2019 | d826058dex41.htm.jsonl, page 1 | Sets subordination, payment blockage and the ratio distribution permission for the largest subordinated issue |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement, the latest amendment affecting restrictive covenants | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Fixes the covenant terms in force at year-end; starting point for the Tranche I and K MFN sunset |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17 and USD 1,500 million Tranche L incremental term loans, conditioned on net leverage at or below 7.25x and secured net debt at or below 5.00x | Historical — Amendment No. 17 and incremental term loan assumption agreement | d887611dex101.htm.jsonl, pages 3–4 | Demonstrated use of ratio-based pari secured incremental capacity to fund the distribution |
| 2024-09-19 | day | 2024-09-19 | Indenture for the 2033 secured notes and Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million of pari first-lien notes to the shared collateral |
| 2027-09-15 | day | 2024-09-19 | Initial Redemption Date of the 2033 secured notes | Scheduled — Initial Redemption Date | d887611dex41.htm.jsonl, page 30 | First date of optional call under the indenture; relevant to refinancing optionality |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity; springing covenant falls away with the commitments | Scheduled — maturity date of the revolving credit facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | Without extension, the only maintenance covenant ends |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 10 |
| Calculated | 3 |
| Assumption-Based | 0 |
| Analyst Inference | 3 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 3 |
| Fields present | 29 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 2 |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report p4 via Business & governance; Delaware |
| TransDigm Group Incorporated | Guarantees loans as holdings and Loan Party | Guarantee | Credit agreement obligations | Credit agreement Loan Parties definition; Delaware |
| TransDigm Group Incorporated | Guarantees on a senior secured basis | Guarantee | 2033 secured notes | 2033 indenture Article 10; New York law |
| Domestic restricted subsidiaries | Guarantee loans and all secured notes | Guarantee | TransDigm Inc. secured debt | Credit agreement and 2033 indenture; New York law |
| TransDigm UK | Guarantees 2028 secured and subordinated notes | Guarantee | 2028 secured and subordinated notes | Annual report p57–58; UK collateral agent named |
| Loan Parties | Grant first-priority liens incl. 65% foreign voting equity | Security | Credit agreement collateral agent | Credit agreement further assurances; New York indenture |
| Holdings, issuer and guarantors | Grant liens under security documents | Security | Notes collateral agents | 2033 indenture Article 12; New York law |
| Non-guarantor subsidiaries | Their creditors rank ahead structurally | Structural claim | Secured and subordinated notes | Annual report p58; indentures under New York law |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facility lenders | Rank equally in right of payment | Payment rank | Secured noteholders | Annual report p58; 2033 indenture, New York law |
| Credit facility lenders | Share first-lien collateral equally | Security rank | Secured noteholders | 2033 indenture ICA definition; New York law |
| Secured noteholders | Authorise ICA representative to bind them | Enforcement control | Applicable Authorized Representative | 2033 indenture Article 12; New York law |
| Senior debt holders | Paid in full before subordinated holders | Payment rank | 2027 subordinated noteholders | 2027 indenture Article 10; New York law assumed |
| Designated senior debt representative | May block payments for up to 179 days | Standstill | 2027 subordinated noteholders | 2027 indenture Article 10; governing law unverified |
| Credit facility guarantee release | Releases matching note guarantee | Release | 2033 secured notes guarantee | 2033 indenture guarantor release; New York law |
| Required Lenders | May approve lien releases short of all | Release | Shared first-lien collateral | Credit agreement amendments clause; law unverified |

### Overall legal credit view
Overall, TransDigm Group Incorporated presents an aggressive covenant package based on a revolver-only springing covenant, ratio-gated but uncapped distribution and investment permissions, pari secured ratio debt netting all unrestricted cash, and covenant EBITDA that admits uncapped projected savings. The main creditor protections are every-lender consent for releasing material guarantors or all collateral, a two-thirds noteholder vote for collateral release, each-holder protection of note ranking, and loan-side limits on designating existing subsidiaries unrestricted, while the main covenant weaknesses are the absence of maintenance tests for term lenders and bondholders, a 2.00x coverage gate for bond-side distributions and unlimited investments in non-guarantor restricted subsidiaries. The primary PD risk is releveraging through debt-funded distributions while ratios remain within tests, leaving a thinner cushion when aftermarket demand weakens; the primary LGD risk is dilution of first-lien collateral by additional pari secured debt and value migration to foreign non-guarantors. For security selection, the most important legal consideration is that secured notes and loans share collateral and payment rank, so dilution falls on both, while subordinated notes face payment blockage and turnover. Further analysis would require the First Lien Intercreditor Agreement, the guarantee and collateral agreement, the remaining indentures and covenant compliance calculations.

Legal & covenants completed with limitations; covenant aggressiveness is four on the five-point scale, provisional, with key gaps in the intercreditor agreement, compliance calculations, security documents and remaining indentures.
Basis: d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, pages 59–63; d887611dex101.htm.jsonl, pages 181 and 188; d887611dex101.htm.jsonl, pages 204–207; d887611dex41.htm.jsonl, pages 75–79; d887611dex41.htm.jsonl, pages 117–118; d826058dex41.htm.jsonl, pages 106–107

### Nearest pressure point
The nearest pressure point is pari passu secured ratio debt capacity. The loans allow new first-lien debt, including incremental term loans, while secured net debt stays at or below 5.00x, and the 2033 notes allow liens on ratio debt to 5.25x; both net all unrestricted cash and the loan test runs on EBITDA that can include projected savings. A borrower that issues secured debt into these tests, as in September 2024, raises first-lien claims on the same collateral without new earnings, so first-lien recovery dilutes and refinancing depends on a larger secured stack. The monitoring signal is any new first-lien issuance, incremental joinder or intercreditor joinder, together with the secured ratio certified at each incurrence. Tightening the view needs compliance certificates with covenant EBITDA and the secured net debt ratio, plus the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, pages 30 and 43; calculation L06

### Overall covenant capacity view
Overall, TransDigm Group Incorporated has limited covenant-capacity visibility. The main capacity concern is pari secured ratio debt, because ratio-gated first-lien issuance can fund distributions and dilute first-lien recovery without lender consent. Exact headroom is not supported, except for the revolver exposure trigger. Further analysis requires covenant EBITDA, covenant debt and unrestricted cash as tested, basket usage records and compliance certificates.
- The revolver covenant was dormant at year-end, with exposure at 7.36% of commitments against a 40% trigger.
- The securitization debt basket is the only basket with documented usage: at least USD 237.5 million of fixed-floor room at year-end, falling to at least USD 75 million after the October 2024 draw.
- Distribution capacity is unlimited in amount when the ratio tests are met, and the September recapitalisation demonstrates willingness to use it.
- Covenant EBITDA for the financial covenant admits projected savings without a cap, so every ratio-based permission can grow faster than reported earnings.
Basis: calculation L03; calculation L04; calculation L10; d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, page 181

### Overall structural view
The highest-severity open route is unlimited investment from loan parties into restricted subsidiaries that do not guarantee, mainly foreign subsidiaries, which can move value outside guarantor reach while remaining inside the restricted group. The most material structural gap is that non-guarantor subsidiaries, with USD 1,646 million of FY2024 sales, owe nothing to either loans or notes, and creditors of those subsidiaries, including up to the greater of USD 450 million and 18% of EBITDA of foreign-subsidiary debt, rank ahead of the group's debt in those entities. First-lien loans and secured notes share collateral and payment rank and sit above the subordinated notes, which are contractually subordinated and subject to payment blockage. Structural analysis is completed with limitations because security documents, the intercreditor agreement and entity-level asset and debt figures are absent.
Basis: d887611dex101.htm.jsonl, pages 60–62; d887611dex101.htm.jsonl, pages 173–174; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation L08

### Analytical appendix — complete canonical registers

#### Evidence index

| Evidence ID | Provision or fact | Source |
|---|---|---|
| EV-01 | Financial covenant: 7.50x (8.00x post material acquisition) springing at revolver exposure above 40%; amendable by Required Revolving Lenders | d887611dex101.htm.jsonl, page 188 |
| EV-02 | Events of default: payment, cross-default and cross-acceleration above USD 50 million, judgments above USD 50 million, financial covenant default limited to revolving lenders | d887611dex101.htm.jsonl, pages 52 and 189–192 |
| EV-03 | Consolidated EBITDA add-backs; projected cost savings within 24 months capped at 25%; net income exclusions | d887611dex101.htm.jsonl, pages 24–26 |
| EV-04 | Financial Covenant Consolidated EBITDA: same add-back families, dividend equivalents, incentive plans, projected savings with no cap | d887611dex101.htm.jsonl, pages 41–42 |
| EV-05 | Net leverage and secured net debt ratio definitions; Unrestricted Cash definition | d887611dex101.htm.jsonl, pages 26–27 and 81 |
| EV-06 | Permitted debt: pari secured at 5.00x, junior and unsecured at 7.25x, general basket, foreign debt basket, subordinated debt, securitization basket, reclassification | d887611dex101.htm.jsonl, pages 59–61 |
| EV-07 | Incremental facilities at 7.25x and 5.00x; MFN 50 bp with 18-month sunset and acquisition carve-out; more-favourable-terms incorporation | d887611dex101.htm.jsonl, pages 144–146 |
| EV-08 | Permitted Investments: restricted subsidiaries unlimited, unrestricted subsidiaries greater of USD 250 million and 10%, general greater of USD 500 million and 25% of Total Assets, joint ventures greater of USD 1,000 million and 40% at 7.00x, ratio investments at 5.75x, Permitted Acquisitions | d887611dex101.htm.jsonl, pages 61–63 |
| EV-09 | Restricted payments: general greater of USD 75 million and 3%; unlimited at 6.75x with no default | d887611dex101.htm.jsonl, pages 180–181 |
| EV-10 | Unrestricted subsidiary definition: only newly acquired or newly formed subsidiaries; designation must comply with restricted-payment and investment covenants | d887611dex101.htm.jsonl, page 81 |
| EV-11 | Amendments: Required Lenders; each-lender rights; release protections; non-pro-rata offers; automatic lien releases | d887611dex101.htm.jsonl, pages 204–207 |
| EV-12 | Guarantor joinder of domestic subsidiaries; 100% domestic and 65% foreign voting equity pledge; Mortgage Suspension Period | d887611dex101.htm.jsonl, pages 53 and 173–174 |
| EV-13 | Amendment No. 17 conditions: ratios at or below 7.25x and 5.00x; officer and solvency certificates | d887611dex101.htm.jsonl, pages 3–4 |
| EV-14 | 2033 indenture restricted payments: builder from USD 400 million plus 50% of net income since 2010-10-01; general USD 75 million basket; unlimited above 2.0x coverage with contract lock; designation as restricted payment | d887611dex41.htm.jsonl, pages 69–70 and 74–77 |
| EV-15 | 2033 indenture ratio debt above 2.0x coverage, non-guarantor cap USD 400 million; secured ratio debt lien basket at 5.25x | d887611dex41.htm.jsonl, pages 43 and 79 |
| EV-16 | 2033 indenture amendments: majority; each affected holder for money terms and ranking; two-thirds for collateral release and adverse intercreditor change | d887611dex41.htm.jsonl, pages 116–118 |
| EV-17 | 2033 indenture guarantee limitation and guarantor release triggers | d887611dex41.htm.jsonl, pages 121–122 |
| EV-18 | 2033 indenture: First Lien Intercreditor Agreement dated 2019-02-13 with six joinders; collateral agents bound through the intercreditor agreement; New York law | d887611dex41.htm.jsonl, pages 30, 126 and 130–132 |
| EV-19 | 2027 subordinated indenture: subordination, 179-day payment blockage, one blockage per 360 days; ratio restricted payments above 2.0x | d826058dex41.htm.jsonl, pages 64 and 106–107 |
| EV-20 | Annual report: Amendment No. 15 latest covenant amendment; incremental ratios; revolver-only maintenance covenant; USD 364 million trigger; compliance at year-end; securitization terms | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| EV-21 | Annual report: guarantor structure and obligor-group summary financials | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| EV-22 | Financial foundation: carrying debt, net debt, cash, EBITDA As Defined, instruments, October 2024 adjustments | Financial foundation (CP-1) |
| EV-23 | Business & governance: ownership, recapitalisation of USD 4,348 million, payment 2024-10-18, securitization draw 2024-10-16 | Business & governance (CP-1A) |

#### T4.1 Source gate

| Source | Status | Authority rank | Limitations | Gate effect |
|---|---|---|---|---|
| Credit agreement as amended through Amendment No. 17 (annexed conformed text) | Executed amendment; annex is a marked conformed copy | 1 | Schedules, exhibits other than those restated, and the guarantee and collateral agreement not reviewed | Satisfies the governing-document gate |
| 2033 secured notes indenture | Executed | 1 | Other secured indentures absent | Governs secured-note covenants for one of six issues |
| 2027 subordinated notes indenture | Executed | 1 | Other subordinated indentures absent; governing-law clause not read | Governs subordination for the largest subordinated issue |
| Amendment No. 16, 2014 and 2013 restatements | Executed, historical | 1 | Not separately reviewed | Amendment chain only |
| First Lien Intercreditor Agreement | Not in sources | 2 | Terms unknown | Intercreditor analysis restricted |
| Compliance certificates | Not in sources | 3 | No tested ratios | Headroom not calculable |
| Annual report covenant description | Issuer filing, published 2024-11-07 | 4 | Summary; postdates the as-of date | Corroborates usage and compliance statement |
| Module status | Completed with Limitations | Not applicable: status row | Restricted for financial headroom and for the refinancing and liability-management overlay | Work proceeds on all steps |

#### T4.2 Controlling Document Register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Amended and restated credit agreement as amended by Amendment No. 17 (d887611dex101.htm.jsonl) | Credit agreement and incremental assumption agreement | 2024-09-19 | Executed; annex conformed text | Controls loan covenants, financial covenant, releases and amendments | Defines secured incurrence, distribution, investment and release capacity for USD 8,702 million of term loans and USD 910 million revolver | EV-01 to EV-13 |
| 1 | Amendment No. 16 (d833756dex101.htm.jsonl) | Credit agreement amendment and refinancing facility agreement | 2024-06-04 | Executed; superseded by later conformed text | Historical step in the chain | No separate effect assessed; terms read through later conformed text | EV-20 |
| 1 | Second restated credit agreement (d739389dex101.htm.jsonl) and 2013 restatement (d496141dex101.htm.jsonl) | Base credit agreement family | 2014-06-04; 2013-02-28 | Executed; historical | Base text amended by later agreements | No standalone effect | EV-20 |
| 1 | 2033 secured notes indenture (d887611dex41.htm.jsonl) | Indenture | 2024-09-19 | Executed | Controls secured-note covenants, guarantees and amendment thresholds | Bond-side distribution and lien permissions looser than loans | EV-14 to EV-18 |
| 1 | 2027 subordinated notes indenture (d826058dex41.htm.jsonl) | Indenture | 2019-11-13 | Executed | Controls subordination, blockage and turnover | Subordinated recovery and payment-blockage risk | EV-19 |
| 2 | First Lien Intercreditor Agreement dated 2019-02-13 with six joinders | Intercreditor agreement | 2019-02-13; latest joinder 2024-09-19 | [Insufficient Information] — intercreditor agreement not in the source set | Would control first-lien enforcement and release among loans and secured notes | Enforcement control and release authority not established | EV-18 |
| 4 | Annual report covenant and debt description | Issuer filing summary | 2024-11-07 | Filed; retrospective | Summary only; corroborates usage and compliance statement | States compliance and the USD 364 million trigger | EV-20; EV-21 |

#### T4.3 Covenant Feature Register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x (8.00x for four quarters after an acquisition above USD 300 million) only when revolver exposure exceeds 40%; revolving lenders only | Credit agreement Section 6.14; Article VII (l) | No early covenant trigger for term lenders or noteholders; revolving lenders alone can amend | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV-01; EV-02 |
| Pari secured debt | Secured debt with same lien priority permitted if secured net debt ratio at or below 5.00x; maturity and life tests; Loan Party obligors only | Credit agreement permitted debt clause (12) | Secured claims can grow on the same collateral | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV-06 |
| Junior, unsecured and subordinated debt | Permitted at net leverage at or below 7.25x | Credit agreement permitted debt clauses (12) and (17) | Total leverage can rise to 7.25x before incurrence stops | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV-06 |
| Fixed debt baskets | General greater of USD 250 million and 10% of EBITDA; foreign subsidiaries greater of USD 450 million and 18%; securitization greater of USD 725 million and 20% | Credit agreement permitted debt clauses (13), (14) and (18) | Grower baskets expand with covenant EBITDA; foreign debt is structurally senior | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV-06 |
| Incremental and MFN | Incremental term or revolving commitments subject to 7.25x and 5.00x; MFN 50 bp, not applying to acquisition debt, after 18 months or to later-maturing debt | Credit agreement Section 2.24 | Pari incremental dilutes existing first-lien lenders; pricing protection lapses | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV-07 |
| Restricted payments (loans) | General greater of USD 75 million and 3%; unlimited at net leverage at or below 6.75x and no default | Credit agreement Section 6.02 | Cash leaves the group without a fixed ceiling | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV-09 |
| Restricted payments (notes) | Builder from USD 400 million plus 50% of net income since 2010-10-01; unlimited above 2.0x fixed charge coverage; contract lock | 2033 indenture Section 4.07; 2027 indenture restricted payments | Coverage test is easier to meet than the loan leverage test | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV-14; EV-19 |
| Investments | Unlimited in restricted subsidiaries; unrestricted subsidiaries greater of USD 250 million and 10%; general greater of USD 500 million and 25% of Total Assets; joint ventures greater of USD 1,000 million and 40% at 7.00x; ratio investments at 5.75x with no revolver drawn and USD 200 million cash | Credit agreement Permitted Investments; Section 6.16 | Value can move to non-guarantors and joint ventures | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV-08 |
| Unrestricted subsidiaries | Loans: only newly acquired or formed subsidiaries designable; notes: any restricted subsidiary if restricted-payment capacity covers the investment | Credit agreement definition; 2033 indenture Section 4.07 | Loan limit narrows drop-down of existing assets; note-side route wider | Neutral — Stable | Not assessed: no comparative source supplied | EV-10; EV-14 |
| EBITDA add-backs | Covenant EBITDA admits projected savings within 24 months with no cap; general EBITDA caps savings at 25% | Credit agreement definitions | Inflates the denominator of every ratio test | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV-03; EV-04 |
| Guarantor coverage | Holdings, borrower and domestic subsidiaries other than immaterial, unrestricted and securitization subsidiaries; foreign subsidiaries excluded | Credit agreement Loan Parties definition; Section 5.11 | Foreign value outside guarantees | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV-12 |
| Collateral | 100% domestic equity, 65% voting foreign equity; mortgages fall away when no other debt requires them | Credit agreement Section 5.11; Mortgage Suspension Period | Real estate and foreign assets can sit outside collateral | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV-12 |
| Events of default | Five business days interest grace; cross-default and judgment thresholds USD 50 million; financial covenant default limited to revolving lenders | Credit agreement Article VII | Term lenders cannot accelerate on covenant breach until revolving lenders do | Neutral — Stable | Not assessed: no comparative source supplied | EV-02 |
| Amendments and releases | Required Lenders generally; each lender for money terms, pro rata sharing, voting, material guarantor and all-collateral release; non-pro-rata offers by Required Lenders if offered to a whole class | Credit agreement Section 9.02 | Subordination is not expressly an each-lender item in the clause reviewed | Neutral — Stable | Not assessed: no comparative source supplied | EV-11 |

#### Definition conflicts

| Item | Governing legal definition | Financial foundation basis | Divergence | Treatment | Source |
|---|---|---|---|---|---|
| Debt measure | Consolidated Total Indebtedness of the borrower and restricted subsidiaries; definition not reviewed in full | Carrying debt USD 24,880 million; gross USD 25,068 million | Basis and figure for covenant debt not established | Covenant ratios left not calculable; carrying debt used only for proxies | Financial foundation (CP-1); d887611dex101.htm.jsonl, pages 26–27 |
| Cash netting | Unrestricted Cash of holdings, borrower and restricted subsidiaries, free of liens other than loan-document liens; no cap | All reported cash USD 6,261 million; pro forma USD 1,913 million after the October 2024 distribution | Netting is uncapped in the legal text; restricted portion not disclosed | Proxies net all reported cash | d887611dex101.htm.jsonl, page 81; Financial foundation (CP-1) |
| Securitization debt | Indenture counts face or notional of receivables interests | Carrying USD 486 million; gross USD 487 million; drawn USD 487.5 million | Precision and role differ | Basket usage uses USD 487.5 million drawn | d887611dex41.htm.jsonl, page 30; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| EBITDA | Covenant EBITDA with uncapped projected savings | Reported USD 3,813 million; EBITDA As Defined USD 4,173 million | Covenant figure not disclosed and may exceed both | Proxies use EBITDA As Defined and are labelled as such | d887611dex101.htm.jsonl, pages 41–42; Financial foundation (CP-1) |
| Contract liabilities and dividend payable | Inclusion in Indebtedness not established in reviewed text | Contract liabilities USD 177 million; dividend payable USD 4,216 million outside debt | Float and declared distribution sit outside carrying debt | Treated as outside covenant debt pending full definition review | Financial foundation (CP-1) |

#### T4.9 PD vs LGD Translation Table

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio distributions | Unlimited restricted payments at 6.75x (loans) or above 2.0x coverage (notes) | Debt-funded payouts raise leverage within tests | High: cushion consumed before stress | Moderate: cash leaves the collateral pool | Track declarations and certified ratios | EV-09; EV-14 |
| Pari secured debt | First-lien debt to 5.00x (loans) and 5.25x (notes) net of cash | Additional claims on the same collateral | Moderate: adds interest burden | High: dilutes first-lien recovery | Track incremental joinders and intercreditor joinders | EV-06; EV-07; EV-15 |
| Springing covenant | Revolver-only 7.50x above 40% usage | Late or absent default trigger | Moderate: fewer early negotiation points | Low: no direct collateral effect | Track revolver usage against USD 364 million | EV-01; EV-20 |
| Covenant EBITDA | Projected savings uncapped in the covenant definition | Denominator inflation | Moderate: delays covenant pressure | Moderate: enables more debt before tests bind | Compare certified EBITDA with EBITDA As Defined | EV-04 |
| Non-guarantor transfers | Unlimited investments in restricted subsidiaries; foreign subsidiaries non-guarantors | Value moves beyond guarantee reach | Low | High: structural subordination to foreign creditors | Track non-guarantor share of sales and assets | EV-08; EV-12; EV-21 |
| Release protections | Every-lender consent for material guarantor and all-collateral release; two-thirds of noteholders | Hinders non-consensual collateral strip | Low | Supportive: protects recovery access | Watch amendments touching release clauses | EV-11; EV-16 |
| Subordinated notes | Subordination, 179-day blockage, turnover | Senior creditors can stop subordinated payments | High for subordinated holders under stress | High for subordinated holders | Track senior defaults and blockage notices | EV-19 |

#### T4.10 Market Norm Comparison Table

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions as recorded in the covenant feature register | No supported comparative source or covenant-review report was supplied | Not performed: comparison limited because no supported comparative source was provided | No third-party view to agree or disagree with | Neutral — Stable | EV-01 to EV-19 |

#### T4.11 Aggressiveness Score Table

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only 7.50x springing above 40% usage; 8.00x after material acquisitions; revolving-lender amendment and default | No covenant warning for term lenders and bondholders | Negative — Covenant Erosion | High | EV-01; EV-02 |
| Debt / lien incurrence capacity | 4 | Pari secured to 5.00x and 5.25x net of uncapped cash; total to 7.25x; bond ratio debt above 2.0x coverage; MFN 50 bp with sunset | Secured and total leverage can rise within tests | Negative — Leverage Increase | Provisional | EV-06; EV-07; EV-15 |
| RP / investment / leakage capacity | 4 | Unlimited distributions at 6.75x or above 2.0x coverage; unlimited restricted-subsidiary investments; large general and joint-venture baskets; USD 4,348 million demonstrated payout | Cash and assets can leave guarantor reach | Negative — Leverage Increase | Provisional | EV-08; EV-09; EV-14; EV-23 |
| EBITDA definitions and add-back flexibility | 4 | Covenant EBITDA admits uncapped projected savings, dividend equivalents and incentive-plan costs; general EBITDA capped at 25% | Ratio capacity grows faster than earnings | Negative — Covenant Erosion | High | EV-03; EV-04 |
| Collateral / guarantor protection | 3 | Domestic guarantors and liens; foreign subsidiaries excluded with 65% voting pledge; mortgage suspension; every-lender release of material guarantors | Coverage typical for the structure; foreign and real estate gaps | Neutral — Stable | Provisional | EV-11; EV-12; EV-17 |
| Amendment / control mechanics | 3 | Required Lenders generally; every-lender items for money terms, sharing and releases; notes two-thirds for collateral; subordination not expressly protected on the loan side | Uptier route theoretical, not demonstrated | Neutral — Stable | Provisional | EV-11; EV-16 |
| Overall | 4 | Weighted to ratio-gated, uncapped distribution and secured-debt capacity with demonstrated use | Releveraging and pari dilution are the material creditor risks | Negative — Leverage Increase | Provisional | EV-01 to EV-23 |

#### T4.12 Red Flags Table

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Debt-funded distribution capacity | Loan restricted payments unlimited at 6.75x; notes above 2.0x coverage | Repeatable recapitalisations | PD up; LGD up; relative value negative for longer-dated notes | Track board declarations and ratio certificates | EV-09; EV-14; EV-23 |
| Pari secured issuance | Secured net debt 5.00x loans; 5.25x note lien basket | First-lien dilution | LGD up for loans and secured notes | Track intercreditor joinders and incremental joinders | EV-06; EV-18 |
| Revolver usage above USD 364 million | Exposure above 40% of commitments activates 7.50x test | Only maintenance trigger in the structure | PD signal | Quarterly revolver exposure | EV-01; EV-20 |
| Covenant EBITDA inflation | Uncapped projected savings | Ratios understate leverage | PD and LGD up | Reconcile certified EBITDA to EBITDA As Defined | EV-04 |
| Non-guarantor value migration | Unlimited restricted-subsidiary investments; foreign non-guarantors | Structural subordination | LGD up | Non-guarantor share of sales in the annual guarantor summary | EV-08; EV-21 |
| Non-pro-rata offers | Required Lenders may permit non-pro-rata prepayment and loan modification offers to a whole class | Path to class-level liability management | LGD up for non-participants | Watch amendment filings | EV-11 |
| MFN expiry | 50 bp protection lapses after 18 months; acquisition carve-out | Repricing risk for existing lenders | Relative value negative for loans | Track incremental pricing after the sunset | EV-07 |

#### T4.13 Gaps Ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and six joinders | Controls first-lien enforcement, release and turnover | Intercreditor registers partly insufficient; amendment score provisional | Obtain executed agreement and joinders |
| Compliance calculations | Compliance certificates with covenant EBITDA, net leverage, secured net debt and coverage | All ratio headroom | Headroom and capacity not calculable | Obtain latest certificates |
| Security documents | Guarantee and collateral agreement; mortgages; UK security | Excluded assets and release mechanics | Collateral matrix qualitative | Obtain security package |
| Other indentures | 2028 to 2032 secured and 2029 subordinated indentures | Bond terms may differ | Bond conclusions extended by issuer statement only | Obtain executed indentures |
| Required Lenders and Total Assets definitions | Definitions not reviewed | Voting threshold and investment basket base | Amendment and investment capacity partly qualitative | Review full definitions |
| Basket usage | Usage of general, investment, joint-venture and builder baskets | Remaining capacity | Only securitization usage known | Obtain usage tracker |
| Market comparison | Covenant-review or comparable-deal source | Market-norm commentary | Comparison skipped | Obtain a dated covenant-review report |
| Refinancing and liability-management analysis | Not supplied | Overlay for non-pro-rata and exchange capacity | Uptier view theoretical | Review alongside refinancing analysis when available |

#### T4D.1 Source Gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement as amended through Amendment No. 17 | Executed; conformed annex | Executed credit agreement | Guarantor schedule and guarantee and collateral agreement not reviewed | Completed with Limitations |
| 2033 secured notes indenture | Executed | Executed indenture | Guarantor list not stated in reviewed pages | Completed with Limitations |
| Annual report guarantor information | Filed issuer disclosure | Filing summary | Obligor-group figures combined; entity-level assets, EBITDA and debt not disclosed | Completed with Limitations |
| Subsidiary list and organisation chart | Not in sources | [Insufficient Information] — subsidiary list not supplied | Entity perimeter aggregated by class | Completed with Limitations |
| Subsequent events scan | No guarantor release, collateral release or designation found after 2024-09-30 in reviewed text; securitization draw and distribution are capacity events, not perimeter changes | Executed documents and annual report | Scan limited to reviewed pages | Completed with Limitations |

#### T4D.2 Restricted / Unrestricted Entity Register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of loans and notes | Delaware | Public shareholders | Restricted (holdings); cannot be designated | No significant operations or assets beyond its investment in TransDigm Inc. | Yes | EV-21; EV-23 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated (100%) | Restricted; cannot be designated | Obligor group with guarantors: net sales USD 6,294 million; entity-only value not disclosed | Yes | EV-21; EV-23 |
| TransDigm UK | Guarantor of 2028 secured and subordinated notes; secured-notes guarantor | United Kingdom per name; incorporation not stated | Not stated in reviewed pages | Restricted | Not disclosed separately; included in obligor group | Yes | EV-18; EV-21 |
| Domestic restricted subsidiaries (other than immaterial and securitization subsidiaries) | Guarantors of loans and notes | United States | TransDigm Inc. directly or indirectly | Restricted; loans allow designation only if newly acquired or formed; notes allow designation within restricted-payment capacity | Included in obligor group; entity values not disclosed | Yes | EV-10; EV-12; EV-14 |
| Foreign restricted subsidiaries (other than TransDigm UK) | Non-guarantors; 65% voting equity pledged | Various, not listed | Loan parties | Restricted | Non-guarantor subsidiaries: net sales USD 1,646 million (20.73% of consolidated) | Restricted group but outside guarantees | EV-12; EV-21 |
| Securitization entity | Excluded subsidiary; receivables borrower | Not stated | Not stated | Excluded subsidiary | USD 487.5 million drawn at year-end; USD 650 million after October 2024 | Outside loan parties | EV-06; EV-20 |
| Unrestricted subsidiaries | None identified in reviewed text | Not established | Not established | Unrestricted | [Insufficient Information] — no designation record in sources | No | EV-10 |
| Immaterial domestic subsidiaries | Excluded from guarantees subject to joinder rules | United States | Loan parties | Restricted | Not disclosed | Restricted group but outside guarantees | EV-12 |

#### T4D.3 Guarantor Coverage Matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TD Group × loans | Senior secured (holdings) | Upstream | Every lender for material guarantor release unless permitted by the documents | EV-11 |
| TD Group × secured notes | Senior secured | Upstream | Defeasance or discharge | EV-17; EV-21 |
| TD Group × subordinated notes | Senior subordinated unsecured | Upstream | Not reviewed for the subordinated indenture | EV-21 |
| Domestic restricted subsidiaries × loans | Senior secured | Cross-stream and upstream | Sale to a non-loan party; Required Lenders for non-material guarantors; every lender for material guarantors | EV-11; EV-12 |
| Domestic restricted subsidiaries × 2029 to 2033 secured notes | Senior secured; capped at the fraudulent-transfer maximum | Cross-stream and upstream | Sale; designation as unrestricted; immaterial status; release from loans and other capital markets debt | EV-17 |
| Domestic restricted subsidiaries × subordinated notes | Senior subordinated unsecured | Cross-stream and upstream | Not reviewed | EV-21 |
| TransDigm UK × 2028 secured and subordinated notes | Senior secured; subordinated respectively | Cross-stream | Not reviewed | EV-21 |
| Other foreign subsidiaries × all tranches | No guarantee | Not applicable: non-guarantor | Not applicable: no guarantee given | EV-12; EV-21 |

#### T4D.4 Collateral-by-Entity Matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TD Group × first lien | Equity of unrestricted subsidiaries; pledges requiring separate SEC financials | Payment in full; Required Lenders short of all collateral | Security documents not reviewed | EV-11; EV-12 |
| TD Group × second lien | — (no second-lien debt identified) | Not applicable: no second-lien class | Not applicable: no second-lien class | EV-22 |
| TD Group × unsecured | — (subordinated guarantee only) | Not applicable: unsecured | Not applicable: unsecured | EV-21 |
| TransDigm Inc. × first lien | Owned real property during a Mortgage Suspension Period; 35% of foreign voting equity | Sale to non-loan party; Required Lenders; mortgages released when no other debt requires them | Security documents not reviewed | EV-11; EV-12 |
| TransDigm Inc. × second lien | — (no second-lien debt identified) | Not applicable: no second-lien class | Not applicable: no second-lien class | EV-22 |
| TransDigm Inc. × unsecured | — (subordinated notes unsecured) | Not applicable: unsecured | Not applicable: unsecured | EV-21 |
| Domestic guarantors × first lien | Same exclusions; excluded subsidiaries | Release with guarantor release or permitted sale | Security documents not reviewed | EV-11; EV-12 |
| Domestic guarantors × second lien | — (no second-lien debt identified) | Not applicable: no second-lien class | Not applicable: no second-lien class | EV-22 |
| Domestic guarantors × unsecured | — (subordinated guarantees unsecured) | Not applicable: unsecured | Not applicable: unsecured | EV-21 |
| TransDigm UK × first lien | — (scope not established; UK collateral agent named) | Not established | [Insufficient Information] — UK security documents not supplied | EV-18 |
| TransDigm UK × second lien | — (no second-lien debt identified) | Not applicable: no second-lien class | Not applicable: no second-lien class | EV-22 |
| TransDigm UK × unsecured | — (subordinated guarantee) | Not applicable: unsecured | Not applicable: unsecured | EV-21 |
| Foreign subsidiaries × first lien | All assets; only 65% of voting equity of directly owned foreign subsidiaries pledged | Not applicable: assets not pledged | Pledge limited by tax-driven 65% rule | EV-12 |
| Foreign subsidiaries × second lien | — (no second-lien debt identified) | Not applicable: no second-lien class | Not applicable: no second-lien class | EV-22 |
| Foreign subsidiaries × unsecured | — (no guarantee) | Not applicable: non-guarantor | Not applicable: non-guarantor | EV-21 |
| Securitization entity × first lien | Receivables sold into the securitization | Not applicable: excluded subsidiary | Not applicable: outside collateral | EV-06; EV-12 |
| Securitization entity × second lien | — (no second-lien debt identified) | Not applicable: no second-lien class | Not applicable: no second-lien class | EV-22 |
| Securitization entity × unsecured | — (non-recourse facility) | Not applicable: excluded subsidiary | Not applicable: excluded subsidiary | EV-06 |

#### T4D.5 Structural Priority Table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc.; holdings and domestic guarantors | Obligor group (net sales USD 6,294 million) plus 65% of foreign voting equity | Pari (same entity, same lien) | Foreign non-guarantor value behind foreign creditors (net sales USD 1,646 million) | Shares collateral with secured notes; dilution by new pari debt | Medium | EV-06; EV-12; EV-21 |
| 2029 to 2033 secured notes | TransDigm Inc.; holdings and loan guarantors | Same as loans | Pari (same entity, same lien) | Same foreign non-guarantor value | Equal rank with loans; release follows loan guarantees | Medium | EV-17; EV-18 |
| 2028 secured notes | TransDigm Inc.; holdings, TransDigm UK, domestic guarantors | Same as loans plus TransDigm UK guarantee | Pari (same entity, same lien) | Same foreign non-guarantor value | Equal rank; terms not reviewed | Low | EV-21 |
| Subordinated notes | TransDigm Inc.; holdings, TransDigm UK, domestic guarantors | Residual after senior debt | Contractually Subordinated | Senior secured claims of USD 19,702 million principal ahead | Payment blockage and turnover reduce access | Medium | EV-19; EV-21 |
| Securitization facility | Securitization entity | Sold receivables | Structurally Senior | Receivables removed from loan-party collateral | Prior claim on the receivables pool | Medium | EV-06; EV-20 |
| Foreign subsidiary creditors | Foreign restricted subsidiaries | Foreign assets | Structurally Senior | Foreign assets unreachable by group creditors except through pledged equity | Group creditors rank behind at those entities | Medium | EV-06; EV-12 |
| All group debt | Restricted group | Value moved to restricted non-guarantors | Leakage-Exposed (drop-down capable) | Assets invested into non-guarantor restricted subsidiaries | Unlimited investment route | Medium | EV-08 |
| First-lien classes | Loan parties | Shared collateral | Priming-Exposed (uptier capable) | Not demonstrated; theoretical via amendment | Depends on intercreditor terms not supplied | Low | EV-11; EV-18 |

#### T4D.6 Drop-down / Transfer Capacity Register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Investment into non-guarantor restricted subsidiaries | Loan parties to foreign or immaterial restricted subsidiaries | Permitted Investments clause (1)(a), unlimited | Not capped; non-guarantor net sales USD 1,646 million today | 4 | Assets leave guarantee and collateral reach | Theoretical capacity | EV-08 |
| Investment into unrestricted subsidiaries | Loan parties to newly formed unrestricted subsidiary | Permitted Investments clause (1)(c) plus general and ratio baskets | At least greater of USD 250 million and 10% of EBITDA; general basket greater of USD 500 million and 25% of Total Assets | 3 | Value outside restricted group | Theoretical capacity | EV-08; EV-10 |
| Designation as unrestricted | Restricted subsidiary to unrestricted | Loans: newly acquired or formed only; notes: within restricted-payment capacity | Not calculable: covenant inputs absent | 3 | Loan limit blocks designation of existing operating subsidiaries | Theoretical capacity | EV-10; EV-14 |
| Asset sale out of the group | Loan party to third party | Asset sale covenant; automatic lien release on permitted sale | Not calculable: reinvestment terms not reviewed | 3 | Collateral released on permitted sale | Theoretical capacity | EV-11 |
| Joint-venture contribution | Loan parties to joint ventures | Joint-venture basket greater of USD 1,000 million and 40% at 7.00x | Not calculable: covenant EBITDA absent | 3 | Assets move outside collateral | Theoretical capacity | EV-08 |

#### T4D.7 Priming-Exposure Findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier | Loan amendment clause lists no express each-lender right over lien or payment subordination in the reviewed text | Term lenders and, through shared collateral, secured noteholders | Theoretical; intercreditor terms not supplied | A Required Lenders amendment could be argued to subordinate; contested | Low | EV-11; EV-18 |
| Uptier | Non-pro-rata prepayment and loan modification offers to all lenders of a class by Required Lenders | Non-participating lenders | Theoretical | Class-level exchange with different terms | Medium | EV-11 |
| Trapdoor | Unlimited investment in non-guarantor restricted subsidiaries, then debt there up to foreign basket | All group creditors | Theoretical | Value and new debt at non-guarantors rank ahead | Medium | EV-06; EV-08 |
| Uptier | 2033 notes: ranking change needs each affected holder; collateral release and adverse intercreditor change need two-thirds | Secured noteholders | Protective provision | Limits note-side priming | High | EV-16 |

#### T4D.8 Gaps Ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Subsidiary perimeter | Subsidiary list and organisation chart | Entities aggregated by class | Entity register approximate | Obtain subsidiary list |
| Guarantor schedule | Guarantee and collateral agreement schedules | Exact guarantor names | Guarantee matrix by class only | Obtain schedules |
| Security package | Guarantee and collateral agreement, mortgages, UK security | Excluded assets and perfection | Collateral matrix partly insufficient | Obtain security documents |
| Intercreditor agreement | First Lien Intercreditor Agreement | Enforcement and release among first-lien classes | Priming findings low confidence | Obtain agreement |
| Entity-level value | Assets, EBITDA and debt by entity | Stranded value sizing | Structural gaps named by sales only | Obtain entity data |

#### T4F.1 Controlling Documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement | Company, holdings, subsidiary guarantors, credit agreement collateral agent, existing secured notes trustees and collateral agents, 2033 trustee and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | d887611dex41.htm.jsonl, page 30 | EV-18 |
| 2033 secured notes indenture | TransDigm Inc., holdings, guarantors, trustee, notes collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 30, 126 and 130–132 | EV-18 |
| Credit agreement as amended | TransDigm Inc., holdings, subsidiaries, agent, lenders | 2024-09-19 | Not established in reviewed pages | Executed | d887611dex101.htm.jsonl, pages 204–207 | EV-11 |
| 2027 subordinated notes indenture | TransDigm Inc., holdings, guarantors, trustee | 2019-11-13 | Not established in reviewed pages | Executed | d826058dex41.htm.jsonl, pages 106–107 | EV-19 |

#### T4F.2 Creditor Class Map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | Senior secured first lien | Shared first-lien collateral | Own financial covenant default and acceleration | Required Revolving Lenders for the financial covenant; part of Required Lenders | EV-01; EV-02 |
| Term lenders | Senior secured first lien | Shared first-lien collateral | Acceleration by Required Lenders; financial covenant only after revolver acceleration | Part of Required Lenders | EV-02; EV-11 |
| Secured noteholders | Senior secured first lien, pari with loans | Shared first-lien collateral through notes collateral agents | Through Applicable Authorized Representative under the intercreditor agreement | Majority; two-thirds for collateral release | EV-16; EV-18 |
| Subordinated noteholders | Senior subordinated unsecured | None | Subject to payment blockage and turnover | Not reviewed | EV-19 |
| Securitization investors | Structurally senior on receivables | Receivables of securitization entity | Not reviewed | Not reviewed | EV-06; EV-20 |

#### T4F.3 Enforcement Control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement among loans and secured notes | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set; indenture refers to an Applicable Authorized Representative | Secured noteholders and term lenders | [Insufficient Information] — ICA not in the source set | Insufficient Information | EV-18 |
| Subordinated payment blockage | 179 days; one per 360 days; 181 clear days required | Non-payment default on designated senior debt with blockage notice | Representative of designated senior debt | 2027 subordinated noteholders | Senior creditors can halt subordinated payments | Negative — Liquidity Deterioration | EV-19 |
| Financial covenant default | No standstill for revolving lenders; term lenders wait until revolver acceleration | Revolver exposure above 40% and net leverage above 7.50x | Required Revolving Lenders | Term lenders | Term lenders cannot act first | Negative — Covenant Erosion | EV-01; EV-02 |

#### T4F.4 Turnover and Release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes Article 10 | Distributions in insolvency paid to senior debt until paid in full, except subordinated securities | Not applicable: unsecured | Not established | Senior debt paid in full in cash first | Holders may receive equally subordinated securities | EV-19 |
| Loan collateral releases | Not applicable: release provision | Automatic on permitted sale or guarantor release; Required Lenders short of all collateral; every lender for all or substantially all | Not established | Compliance certificate on sale | Every-lender protection for all collateral | EV-11 |
| Secured note guarantee release | Not applicable: release provision | Automatic on loan guarantee release, sale, designation or immaterial status | Not established | Release under credit facilities not by payment | Two-thirds of holders for collateral release outside indenture terms | EV-16; EV-17 |
| First-lien intercreditor turnover | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | EV-18 |

#### T4F.5 Recovery Control Assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders and secured noteholders | Shared first-lien collateral; dilution by new pari debt | [Insufficient Information] — ICA not in the source set | Insufficient Information | [Insufficient Information] — ICA not in the source set | Insufficient Information | EV-18 |
| Secured noteholders | Guarantees fall away when loan guarantees are released | Release follows lender decisions | Moderate | Noteholders depend on lender release protections | Negative — Covenant Erosion | EV-17 |
| Subordinated noteholders | Paid after senior debt; blockage up to 179 days | Contractual subordination | High | Turnover and blockage | Negative — Liquidity Deterioration | EV-19 |
| All group creditors at foreign subsidiaries | Behind foreign creditors | Structural | High | Non-guarantor value reaches group only through equity | Negative — Refinancing Risk | EV-12; EV-21 |

#### T4F.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor terms | First Lien Intercreditor Agreement | Controlling party, standstill, turnover and release among first-lien classes | Enforcement and recovery-control rows insufficient | Obtain agreement and joinders |
| Subordinated governing law and amendment terms | Remaining clauses of subordinated indenture | Class voting and governing law | Partial class map | Review full indenture |
| Other subordinated and secured indentures | Executed indentures | Class-specific terms | Class map extended by issuer statement | Obtain indentures |

#### T4C.2 Source Map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended | Executed credit agreement | 2024-09-19 | Executed | Legal Formula | Loan tests and baskets | EV-01 to EV-13 |
| 1 | 2033 secured notes indenture | Executed indenture | 2024-09-19 | Executed | Legal Formula | Bond tests and baskets | EV-14 to EV-18 |
| 1 | 2027 subordinated notes indenture | Executed indenture | 2019-11-13 | Executed | Legal Formula | Subordinated tests | EV-19 |
| 3 | Compliance certificates | Not in sources | Not supplied | Missing | Usage | Would control tested ratios | EV-20 |
| Financial input | Financial foundation | Supplied analysis | As of 2024-09-30 | Accepted | Financial Input | Proxy inputs only | EV-22 |
| 4 | Annual report | Issuer filing | 2024-11-07 | Filed | Usage | Revolver and securitization usage | EV-20; EV-21 |

#### T4C.3 Definition Register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over last four quarters' Consolidated EBITDA (covenant EBITDA for the financial covenant), pro forma | Covenant debt; unrestricted cash; covenant EBITDA | Drives 7.50x, 7.25x, 7.00x, 6.75x and 5.75x tests | Uncapped cash netting expands capacity | Negative — Covenant Erosion | EV-05 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured debt less Unrestricted Cash over Consolidated EBITDA, pro forma | Secured debt; unrestricted cash; EBITDA | Drives 5.00x secured test | Cash raised then held can be netted | Negative — Leverage Increase | EV-05 |
| Consolidated EBITDA | Credit agreement definitions | Net income plus add-backs including integration, transaction, non-service pension, earn-outs, dividend equivalents, projected savings capped at 25% | Component add-backs | Grower baskets and incurrence ratios | Add-backs expand capacity | Negative — Covenant Erosion | EV-03 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Similar add-backs plus incentive plans and projected savings without cap | Component add-backs | Financial covenant only | Covenant harder to breach | Negative — Covenant Erosion | EV-04 |
| Unrestricted Cash | Credit agreement definitions | Unencumbered cash of holdings, borrower and restricted subsidiaries, loan-document liens allowed | Cash by entity and encumbrance | All net tests | No cap on netting | Negative — Covenant Erosion | EV-05 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | EBITDA over fixed charges, pro forma | Covenant EBITDA; fixed charges | Bond ratio debt and unlimited distributions above 2.0x | Low bar relative to current earnings | Negative — Covenant Erosion | EV-15 |
| Indenture Indebtedness (securitization) | 2033 indenture definitions | Face or notional of receivables interests counted as debt | Securitization drawn amount | Securitization basket usage | Precision differences with carrying value | Neutral — Stable | EV-15 |

#### T4C.4 Headroom Table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver springing net leverage | max-ratio | 7.50x | Not supplied: covenant ratio not disclosed | Threshold minus covenant net leverage | [Insufficient Information] — missing: current tested ratio (covenant EBITDA and covenant debt not disclosed; no compliance certificate) | Not Calculable | Test inactive at year-end because exposure was below the 40% trigger | Breach would allow revolving lenders to accelerate, then term lenders | Neutral — Stable | EV-01 |
| Revolver exposure trigger | max-ratio | 40.00% | 7.36% | Threshold minus exposure as a share of commitments | 32.64% | Compliant | Assumes the USD 67 million letters of credit are not cash-collateralised | Usage above the trigger activates the covenant | Neutral — Stable | EV-01; EV-20 |
| Pari secured and incremental debt | max-ratio | 5.00x | Not supplied: covenant secured net debt ratio not disclosed | Threshold minus pro forma secured net debt ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Issuer-measure proxy 3.18x at year-end is not a covenant figure | New pari debt dilutes first lien | Negative — Leverage Increase | EV-06; EV-07 |
| Junior, unsecured and subordinated debt | max-ratio | 7.25x | Not supplied: covenant net leverage not disclosed | Threshold minus pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Issuer-measure proxy 4.46x at year-end is not a covenant figure | Total leverage can rise | Negative — Leverage Increase | EV-06 |
| Ratio restricted payments (loans) | max-ratio | 6.75x | Not supplied: covenant net leverage not disclosed | Threshold minus pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Post-distribution covenant ratio not disclosed | Unlimited distributions when met | Negative — Leverage Increase | EV-09 |
| Ratio investments (loans) | max-ratio | 5.75x | Not supplied: covenant net leverage not disclosed | Threshold minus pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Also needs no revolver loans and USD 200 million unrestricted cash | Unlimited investments when met | Negative — Covenant Erosion | EV-08 |
| Ratio debt and restricted payments (2033 notes) | min-ratio | 2.00x | Not supplied: covenant coverage not disclosed | Pro forma fixed charge coverage minus threshold | [Insufficient Information] — missing: current tested ratio | Not Calculable | Test is strictly above 2.0 to 1.0 | Unlimited bond-side debt and distributions | Negative — Covenant Erosion | EV-14; EV-15 |
| Secured ratio debt lien basket (2033 notes) | max-ratio | 5.25x | Not supplied: covenant secured net debt ratio not disclosed | Threshold minus pro forma secured net debt ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Indenture test is looser than the loan test | Pari secured debt permitted under notes | Negative — Leverage Increase | EV-15 |

#### T4C.5 Capacity Register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Maintenance covenant headroom | Revolver net leverage 7.50x | Ratio Basket | Exposure above 40% of commitments | Not supplied: covenant ratio | USD 67 million letters of credit | Not calculable: covenant ratio missing | Not calculable: covenant ratio missing | Formula Extracted Only | Moderate | Late default trigger | Negative — Covenant Erosion | EV-01 |
| Debt incurrence capacity | Pari secured ratio debt | Incremental Ratio Amount | Secured net debt at or below 5.00x; maturity and life tests | Not supplied: covenant ratio | Not supplied: no usage tracker | Not calculable: covenant inputs missing | Not calculable: covenant inputs missing | Formula Extracted Only | High | First-lien dilution | Negative — Leverage Increase | EV-06 |
| Incremental facility capacity | Incremental commitments | Incremental Ratio Amount | 7.25x and 5.00x after giving effect | Not supplied: covenant ratio | USD 1,500 million Tranche L used 2024-09-19 | Not calculable: covenant inputs missing | Not calculable: covenant inputs missing | Formula Extracted Only | High | Pari incremental with lapsing MFN | Negative — Leverage Increase | EV-07; EV-13 |
| Debt incurrence capacity | General debt basket | Grower Basket | Greater of USD 250 million and 10% of EBITDA; borrower and guarantors | Not supplied: covenant EBITDA | Not supplied: no usage tracker | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Adds debt outside ratio tests | Negative — Leverage Increase | EV-06 |
| Debt incurrence capacity | Foreign subsidiary debt | Grower Basket | Greater of USD 450 million and 18% of EBITDA | Not supplied: covenant EBITDA | Not supplied: no usage tracker | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | EV-06 |
| Debt incurrence capacity | Securitization basket | Grower Basket | Greater of USD 725 million and 20% of EBITDA; non-recourse | USD 487.5 million drawn at year-end | USD 650 million after 2024-10-16 draw | At least USD 725 million (fixed floor) | At least USD 237.5 million at year-end; at least USD 75 million after the draw | Ready with Limitations | Low | Receivables leave collateral | Neutral — Stable | EV-06; EV-20 |
| Restricted payment capacity | Ratio restricted payments (loans) | Ratio Basket | Net leverage at or below 6.75x; no default | Not supplied: covenant ratio | USD 4,348 million paid in October 2024 | Unlimited amount while test met | Not calculable: covenant ratio missing | Formula Extracted Only | High | Debt-funded payouts | Negative — Leverage Increase | EV-09; EV-23 |
| Restricted payment capacity | General restricted payments (loans) | Grower Basket | Greater of USD 75 million and 3% of EBITDA; no default | Not supplied: covenant EBITDA | Not supplied: no usage tracker | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Low | Small leakage | Neutral — Stable | EV-09 |
| Restricted payment capacity | Ratio restricted payments (notes) | Ratio Basket | Coverage above 2.0x; no default; contract lock | Not supplied: covenant coverage | USD 4,348 million paid in October 2024 | Unlimited amount while test met | Not calculable: covenant coverage missing | Formula Extracted Only | High | Bond side looser than loans | Negative — Covenant Erosion | EV-14 |
| Builder / available amount capacity | Notes builder | Builder Basket | USD 400 million plus 50% of net income since 2010-10-01 plus equity proceeds | Not supplied: cumulative net income | Not supplied: cumulative payments | Not calculable: build-up inputs missing | Not calculable: usage missing | Insufficient Information | Insufficient Information | Cumulative capacity unknown | Insufficient Information | EV-14 |
| Investment capacity | Unrestricted subsidiary investments | Grower Basket | Greater of USD 250 million and 10% of EBITDA | Not supplied: covenant EBITDA | Not supplied: no usage tracker | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Value outside restricted group | Negative — Covenant Erosion | EV-08 |
| Investment capacity | General investments | General Basket | Greater of USD 500 million and 25% of Total Assets | Not supplied: Total Assets as defined | Not supplied: no usage tracker | Not calculable: definition not reviewed | Not calculable: usage missing | Formula Extracted Only | High | Large asset-based basket | Negative — Covenant Erosion | EV-08 |
| Investment capacity | Joint-venture investments | Grower Basket | Greater of USD 1,000 million and 40% of EBITDA; net leverage at or below 7.00x | Not supplied: covenant EBITDA | Not supplied: no usage tracker | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | High | Assets leave collateral | Negative — Covenant Erosion | EV-08 |
| Investment capacity | Ratio investments | Ratio Basket | Net leverage at or below 5.75x; no revolver loans; USD 200 million unrestricted cash | Not supplied: covenant ratio | Not supplied: no usage tracker | Unlimited amount while test met | Not calculable: covenant ratio missing | Formula Extracted Only | High | Unlimited leakage when met | Negative — Covenant Erosion | EV-08 |
| Asset transfer capacity | Investments in restricted subsidiaries | General Basket | Unlimited, including non-guarantors | Not applicable: no limit | Not supplied: no transfer record | Unlimited | Unlimited | Completed | High | Non-guarantor migration | Negative — Covenant Erosion | EV-08 |
| Unrestricted subsidiary capacity | Designation | Reclassification Feature | Loans: newly acquired or formed only; notes: within restricted payments | Not supplied: covenant inputs | No designation identified | Not calculable: covenant inputs missing | Not calculable: covenant inputs missing | Provisional | Moderate | Loan limit constrains | Neutral — Stable | EV-10; EV-14 |
| EBITDA add-back capacity | Projected savings | General Basket | 24 months; 25% cap except covenant EBITDA uncapped | Not supplied: projected savings claimed | Not supplied | Not calculable: add-back amounts missing | Not calculable: add-back amounts missing | Formula Extracted Only | High | Ratio inflation | Negative — Covenant Erosion | EV-03; EV-04 |
| MFN protection | Yield protection | Incremental Ratio Amount | 50 bp; 18-month sunset; acquisition and later-maturity carve-outs | Not applicable: pricing protection | Tranche L MFN period running | Not applicable: pricing protection | Not applicable: pricing protection | Completed | Moderate | Repricing for existing lenders | Negative — Refinancing Risk | EV-07 |
| Guarantor / collateral release capacity | Release consents | General Basket | Every lender for material guarantor and all collateral; Required Lenders otherwise | Not applicable: consent mechanic | None identified | Not applicable: consent mechanic | Not applicable: consent mechanic | Completed | Moderate | Partial releases by majority | Neutral — Stable | EV-11 |

#### T4C.6 Debt/Lien/Priming Table

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured ratio debt and incremental | 5.00x secured net (loans); 5.25x lien basket (notes) | Formula Extracted Only | Dilution of shared first-lien collateral | Moderate | High | Negative for loans and secured notes alike | EV-06; EV-07; EV-15 |
| Junior and unsecured ratio debt | 7.25x net leverage | Formula Extracted Only | Layering ahead of equity, behind first lien | Moderate | Low for first lien; adverse for subordinated notes | Negative for subordinated notes | EV-06 |
| Bond ratio debt | Coverage above 2.0x; non-guarantor cap USD 400 million | Formula Extracted Only | Debt permitted under notes even when loans bind | Moderate | Moderate | Notes rely on loan tests for discipline | EV-15 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% | Formula Extracted Only | Structurally senior claims | Low | Moderate | Negative for all group debt | EV-06 |
| Non-pro-rata amendments | Required Lenders may permit class-wide offers | Insufficient Information | Exchange or extension at different terms | Low | Moderate for non-participants | Favours participants | EV-11 |

#### T4C.7 Leakage Analysis Table

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio distributions | Unlimited at 6.75x (loans) or above 2.0x coverage (notes) | Ratio Basket | USD 4,348 million paid October 2024; remaining not calculable | Cash leaves the group | High | Negative — Leverage Increase | EV-09; EV-14; EV-23 |
| Non-guarantor investment | Unlimited investment in restricted subsidiaries | General Basket | Unlimited; usage not reported | Leaves guarantees and collateral | High | Negative — Covenant Erosion | EV-08 |
| Unrestricted subsidiary investment | Greater of USD 250 million and 10% plus general and ratio baskets | Grower Basket | Not calculable: usage missing | Leaves restricted group | Moderate | Negative — Covenant Erosion | EV-08 |
| Joint ventures | Greater of USD 1,000 million and 40% at 7.00x | Grower Basket | Not calculable: usage missing | Leaves collateral | High | Negative — Covenant Erosion | EV-08 |
| Asset sales | Permitted sales release liens automatically | Prepayment / Reinvestment Capacity | Not calculable: reinvestment terms not reviewed | Collateral released | Moderate | Negative — Covenant Erosion | EV-11 |

The routes overlap through the same restricted-payment and investment covenants and are not summed.

#### T4C.8 Add-Back Inflation Table

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Consolidated EBITDA clause (m) | 24 months; 25% of EBITDA | Insufficient Information | Expands grower baskets and incurrence ratios | Higher debt capacity; LGD up | EV-03 |
| Projected cost savings for the financial covenant | Financial Covenant Consolidated EBITDA clause (n) | 24 months; no cap | Insufficient Information | Delays the springing covenant | PD signal weakened | EV-04 |
| Dividend equivalent payments | Both EBITDA definitions | No cap | Insufficient Information | Recap-related payments added back | Recapitalisations do not reduce covenant EBITDA | EV-03; EV-04 |
| Incentive bonus and plan costs | Financial Covenant Consolidated EBITDA clause (m) | No cap | Insufficient Information | Ordinary compensation added back | Covenant EBITDA above EBITDA As Defined possible | EV-04 |
| Transaction, refinancing and integration costs | Both EBITDA definitions | No cap; whether or not completed | Insufficient Information | Recurring costs excluded | Recurrence shown by Earnings quality | EV-03; EV-04 |

#### T4C.9 Flags Table

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Uncapped ratio distributions | 6.75x loans; above 2.0x notes | Releveraging | High | Moderate | Recovery and relative-value questions | EV-09; EV-14 |
| Pari secured capacity | 5.00x and 5.25x net of uncapped cash | First-lien dilution | High | Formula Only | Recovery and security-selection questions | EV-06; EV-15 |
| Non-guarantor fungibility | Unlimited restricted-subsidiary investments | Structural subordination | High | Formula Only | Recovery questions | EV-08 |
| Reclassification | Borrower may divide and reclassify debt and payments among baskets | Capacity re-use | Moderate | Formula Only | Covenant capacity questions | EV-06; EV-14 |
| Amendment flexibility | Required Lenders for non-pro-rata class offers | Class-level liability management | Moderate | Low | Refinancing questions | EV-11 |
| Covenant EBITDA inflation | Uncapped projected savings | Late covenant trigger | High | Formula Only | Downside questions | EV-04 |

#### T4C.11 Priority Matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured ratio debt and incremental | High | Formula Only | First-lien dilution | Moderate | High | Track joinders and certified secured ratio | EV-06; EV-07 |
| 2 | Ratio distributions | High | Moderate | Debt-funded payouts | High | Moderate | Track declarations and certified ratios | EV-09; EV-14 |
| 3 | Non-guarantor investment | High | Formula Only | Structural migration | Low | High | Track non-guarantor share of sales | EV-08; EV-21 |
| 4 | Covenant EBITDA add-backs | High | Formula Only | Ratio inflation | Moderate | Moderate | Reconcile certified EBITDA | EV-04 |
| 5 | Revolver springing covenant | Moderate | Moderate | Late trigger | Moderate | Low | Quarterly revolver exposure | EV-01 |

#### T4C.12 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Tested net leverage, secured net debt and coverage | Maintenance and incurrence headroom unconfirmable | All ratio rows not calculable | Obtain certificates |
| Covenant EBITDA bridge | Covenant EBITDA versus EBITDA As Defined | Ratio capacity unreliable | Proxies only | Obtain bridge |
| Basket usage tracker | Usage of general, investment, joint-venture and builder baskets | Remaining capacity undetermined | Formula-only rows | Obtain tracker |
| Builder inputs | Cumulative net income since 2010-10-01 and payments | Builder capacity | Not calculable | Obtain build-up schedule |
| Total Assets definition | Legal definition | General investment basket size | Not calculable | Review definition |
| MFN sunset date | Amendment No. 17 Effective Date | Exact repricing window | Relative condition only | Confirm effective date |

## Calculations

All amounts are USD millions unless stated. Ratios on EBITDA As Defined are issuer-measure proxies, not covenant ratios.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | 2024-09-30 revolver covenant trigger | 910 × 0.40 | 364 | USD millions | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59 and 62 |
| L02 | 2024-09-30 revolver availability check | 910 − 67 | 843, matching the disclosed availability | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L03 | 2024-09-30 revolver exposure share | 67 / 910 | 0.073626373626373626373626373626373626374, displayed 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L04 | 2024-09-30 room to trigger | 40.00 − 7.36; 364 − 67 | 32.64 percentage points; USD 297 million | percentage points; USD millions | calculation L01; calculation L03 |
| L05 | 2024-09-30 proxy net leverage on EBITDA As Defined | 18619 / 4173; 7.50 − 4.4617780972921159837047687514977234603 | 4.4617780972921159837047687514977234603, displayed 4.46x; room to 7.50x 3.0382219027078840162952312485022765397, displayed 3.04x. Year-end net debt 18619 becomes 22967 pro forma after the October 2024 distribution, with pro forma net leverage 6.02x on reported EBITDA per Financial foundation; the pro forma figure on EBITDA As Defined is not established | x | Financial foundation (CP-1) |
| L06 | 2024-09-30 proxy secured net debt on EBITDA As Defined | 19534 − 6261 = 13273; 13273 / 4173 | 3.1806853582554517133956386292834890966, displayed 3.18x. Year-end cash 6261 becomes 1913 pro forma after the October 2024 distribution per Financial foundation; the pro forma secured figure is not established | USD millions; x | Financial foundation (CP-1) |
| L07 | 2024-09-30 first-lien principal | 2100 + 2750 + 1450 + 1000 + 2200 + 1500 = 11000; 8702 + 11000 | Secured notes 11000; first-lien funded principal 19702, before revolver commitments of 910 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L08 | FY2024 non-guarantor sales | 7940 − 6294; 1646 / 7940; 6294 / 7940 | 1646; 0.20730478589420654911838790931989924433, displayed 20.73%; obligor group 0.79269521410579345088161209068010075567, displayed 79.27% | USD millions; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L09 | 2024-09-30 obligor-group assets, indicative | 7813 + 8186 + 3889; 25586 − 19888 | 19888; 5698, before intercompany eliminations and therefore not a non-guarantor asset figure | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L10 | Securitization basket fixed floor | 487.5 + 162.5 = 650.0; 725 − 487.5; 725 − 650 | Drawn 650.0 after 2024-10-16; room at least 237.5 at year-end and at least 75 after the draw | USD millions | d887611dex101.htm.jsonl, page 60; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

## Gaps

The open items below limit headroom, intercreditor and structural conclusions; none prevents the provision-level reading.

| Gap | What is missing | Effect on conclusions | Resolution | Source |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement dated 2019-02-13 and six joinders | Enforcement control, turnover and release among first-lien classes not established | Obtain executed agreement | d887611dex41.htm.jsonl, page 30 |
| Covenant calculations | Compliance certificates, covenant EBITDA, covenant debt and unrestricted cash | All ratio headroom not calculable; proxies only | Obtain latest certificates and bridge | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Remaining indentures | 2028 to 2032 secured and two 2029 subordinated indentures | Bond terms extended by issuer statement only | Obtain executed indentures | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 153 |
| Security documents | Guarantee and collateral agreement, mortgages, UK security, guarantor schedules | Collateral and guarantor maps by class only | Obtain security package | d887611dex101.htm.jsonl, pages 173–174 |
| MFN sunset | Exact Amendment No. 17 Effective Date | The Tranche L MFN ends 18 months after that date; no dated row is written until it is confirmed | Confirm effective date | d887611dex101.htm.jsonl, pages 3–4 and 144 |
| Bond covenant suspension | Investment-grade suspension terms in the 2033 indenture located but not reviewed | Covenant fall-away scenario not assessed | Review suspension clause | d887611dex41.htm.jsonl, page 90 |
| Market comparison | Covenant-review or comparable-deal source | Market-norm commentary skipped | Obtain dated comparative source | Source readiness (CP-0) |
| Refinancing and liability-management analysis | Not supplied for this assessment | Non-pro-rata and exchange capacity read as document capacity only | Assess alongside refinancing analysis | Source readiness (CP-0) |

## Next module
The orchestrator selects the next module.
