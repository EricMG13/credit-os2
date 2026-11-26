## Request
TransDigm Group Incorporated (issuer ID tdg), legal and covenant interpretation as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers the credit agreement as amended through September 2024, the 2033 secured notes indenture and the 2027 subordinated notes indenture: covenant meaning and capacity, the restricted-group and guarantee map, and intercreditor control.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer summary of restrictive covenants, springing maintenance test, compliance statement, guarantor and ranking description, securitisation facility terms |
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, with the conformed second amended and restated credit agreement annexed | 2024-09-19 (agreement date; publication not stated) | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: definitions, EBITDA, debt, liens, restricted payments, investments, unrestricted subsidiaries, financial covenant, events of default, amendments, governing law |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 | 2024-09-19 (indenture date; publication not stated) | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note ratio debt, liens, restricted payments, amendments, collateral release, intercreditor references, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13 (indenture date recorded by Source readiness; publication not stated) | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, payment blockage, governing law |
| d739389dex101.htm.jsonl | Amendment and restatement agreement with the second amended and restated credit agreement (execution version) | 2014-06-04 (agreement date; publication not stated) | 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547 | Not reviewed; recorded in the controlling-document register as the base of the amendment chain |
| d833756dex101.htm.jsonl | Amendment No. 16, loan modification and refinancing facility agreement (execution version) | 2024-06-04 (agreement date; publication not stated) | 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac | Not reviewed; recorded in the controlling-document register as superseded by the September 2024 conformed text |
| d496141dex101.htm.jsonl | Amendment and restatement agreement involving TransDigm Inc. and TransDigm Group Incorporated | 2013-02-28 (agreement date; publication not stated) | f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3 | Not reviewed; historical amendment-chain document only |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Issuer, date, legal-document inventory, missing-document restrictions |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt principal and carrying values, cash, revolver availability, securitisation, contract liabilities, reported and pro forma leverage |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | September 2024 dividend recapitalisation facts and funding; parent and borrower identity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Challenge to issuer add-backs used to compare covenant EBITDA mechanics |

## Findings

### Bottom line
TransDigm's covenant package protects creditors through incurrence gates rather than maintenance tests, and those gates did not prevent a debt-funded distribution, so creditor risk rises through releveraging and secured dilution long before a covenant breach could signal it. The only maintenance test is a revolver-only net leverage limit of 7.50x that springs above 40% revolver usage; derived year-end usage was 7.36%.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation K02; Business & governance (CP-1A)

Distributions are unlimited while covenant net leverage stays at or below 6.75x under the credit agreement and fixed-charge cover exceeds 2.0x under the 2033 secured notes indenture, and pari secured debt can grow to 5.00x secured net leverage. Covenant EBITDA and tested ratios are not disclosed, so headroom is not established. For secured creditors the decisive weakness is control: the notes' liens follow the bank agent's partial releases, and the intercreditor agreement that governs enforcement is not in the source set.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, page 137; d887611dex41.htm.jsonl, page 30

### Key findings
- Maintenance protection is a revolver liquidity tripwire, not a creditor-wide early warning. The 7.50x net leverage limit (8.00x for the first four quarters after a material acquisition) benefits revolving lenders only, can be amended by the required revolving lenders alone, and applies only when revolver exposure exceeds 40% of commitments, currently USD 364 million. Commitments of USD 910 million less availability of USD 843 million imply USD 67 million of exposure, leaving USD 297 million before the test springs. Term lenders can act on a breach only after the revolving lenders accelerate or terminate, so default risk transmits through liquidity and payment default rather than a covenant trip.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 191–192; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation K01; calculation K04
- Ratio-gated distribution capacity is the main default-probability channel because it has already been used at scale. The credit agreement allows any restricted payment with no default and pro forma covenant net leverage at or below 6.75x; the 2033 indenture allows any restricted payment with fixed-charge cover above 2.0x, so the bank test binds while the term loans are outstanding. The September 2024 recapitalisation declared USD 4,348 million, funded with USD 3,000 million of new secured debt, including the USD 1,500 million incremental term loan, plus cash; the annual report does not say which basket was used. Reported net leverage was 4.88x at year-end and 6.02x pro forma after the October 2024 dividend payment, on reported EBITDA and carrying debt rather than covenant definitions.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75; d887611dex101.htm.jsonl, page 1; Business & governance (CP-1A); Financial foundation (CP-1)
- Secured dilution capacity is open-ended and grows with an elastic EBITDA definition. Incremental facilities need only covenant net leverage at or below 7.25x and secured net leverage at or below 5.00x, and the 2033 indenture permits liens on ratio debt up to 5.25x secured net leverage. Covenant EBITDA adds projected cost savings of up to 25% of EBITDA from actions within 24 months, uncapped acquisition, integration and restructuring charges, and dividend-equivalent payments; covenant debt nets all unrestricted cash and excludes securitisation debt. The earnings-quality review rejected USD 345 million of issuer add-backs as recurring costs, yet the covenant definition admits those categories, so every ratio gate is measured against a base above supportable earnings and new pari secured debt dilutes existing first-lien recovery directly.
Basis: d887611dex101.htm.jsonl, page 146; d887611dex101.htm.jsonl, pages 23–24; d887611dex101.htm.jsonl, page 28; d887611dex41.htm.jsonl, page 43; Earnings quality (CP-1D)
- Structural leakage routes are bounded but not sealed. Only newly acquired or newly formed subsidiaries can be designated unrestricted, and investment in unrestricted subsidiaries is capped at the greater of USD 250 million and 10% of covenant EBITDA. A general investment basket of the greater of USD 500 million and 25% of restricted-group total assets is far larger, about USD 6,396.50 million if group total assets are used as a reference. Foreign restricted subsidiaries do not guarantee, can incur the greater of USD 450 million and 18% of covenant EBITDA, and only 65% of their voting equity is pledged; the notes are structurally subordinated to non-guarantor liabilities whose value is not disclosed.
Basis: d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 60–62; d887611dex101.htm.jsonl, pages 173–174; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; calculation K10
- Collateral control favours the bank group, while the secured notes hold the stronger anti-subordination right. Bank sacred rights cover pro rata sharing, release of material guarantors and release of all or substantially all collateral; the amendment clause reviewed contains no explicit protection against subordinating the loans' payment or lien priority, so a majority-lender priming route is theoretical rather than excluded. The secured indenture requires each affected holder for adverse ranking changes and two-thirds of holders for releasing substantially all collateral, but partial collateral releases follow the bank agent even though the notes are 55.83% of funded first-lien principal. Subordinated noteholders face a 179-day payment blockage, once in any 360 days.
Basis: d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 117–118; d887611dex41.htm.jsonl, page 137; d826058dex41.htm.jsonl, pages 106–107; calculation K15

### Contrary evidence and what would change the view
The strongest counter-evidence is that the gates are real and have held: the issuer states it complied with every debt covenant at year-end, the 6.75x distribution gate and 7.25x incremental gate cap leverage on the covenant basis, unrestricted-subsidiary designation is confined to new subsidiaries, and the pro rata sharing and collateral-release sacred rights block the simplest non-pro-rata exchanges. The secured indenture's each-holder protection against adverse ranking changes also makes a priming transaction against the notes harder than against the loans. The view would soften if a compliance certificate showed covenant net leverage close to 6.75x after the October 2024 payment, which would shut the unlimited distribution route until earnings grew, or if the intercreditor agreement gave the secured notes, which hold the larger share of funded first-lien principal, an equal or controlling voice on enforcement and releases. It would harden if covenant EBITDA proved materially above issuer EBITDA As Defined, if later amendments loosened the sacred rights, or if a further distribution followed the receivables-facility refinancing.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, page 117; calculation K15

### Limitations
- The intercreditor agreement is referenced but not supplied, so who controls first-lien enforcement, how long any class must stand still and how proceeds are shared are not established; the release-follows-bank finding rests on the 2033 indenture alone and could be narrowed by the agreement's terms.
- The guarantee and collateral agreement, security schedules and guarantor exhibit are not supplied, so excluded assets and non-guarantor value cannot be quantified; structural subordination of the notes is named but not sized, which keeps the recovery-access view qualitative.
- No compliance certificate, covenant EBITDA figure or basket-usage record is supplied, so every ratio headroom and grower-basket capacity is not calculable; the distribution and dilution findings describe open mechanisms, not measured room.
- Indentures for the 2028 to 2032 secured notes and the two 2029 subordinated notes are not supplied; applying the 2033 and 2027 terms to them relies on the annual report's statement that their covenants are substantially similar, which could understate differences in release or ratio tests.
- No refinancing and liability-management assessment is supplied, so the priming and exchange routes are read from clause text only and are not tied to a maturity-driven trigger.
- No comparative market or covenant-review source is supplied, so the aggressiveness score is an absolute reading of the clauses, not a market-relative one.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 135; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; Source readiness (CP-0)

### Capital structure

| Instrument | Rank and security | Principal (USD m) | Maturity | Controlling document in this review | Source |
|---|---|---|---|---|---|
| Revolving credit facility | Senior secured first lien; commitment 910, availability 843 after letters of credit | 910 commitment | 2029-02-27 | Credit agreement as amended 2024-09-19 | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 188 |
| Term loans I, J, K, L | Senior secured first lien, pari with secured notes | 8702 | 2028-08-24 to 2032-01-19 | Credit agreement as amended 2024-09-19 | Financial foundation (CP-1); calculation K11 |
| Secured notes 2028 to 2033 (six series) | Senior secured first lien under First Lien Intercreditor Agreement | 11000 | 2028-08-15 to 2033-01-15 | 2033 indenture only; other series not supplied | Financial foundation (CP-1); calculation K12 |
| Subordinated notes 2027, January 2029, May 2029 | Unsecured senior subordinated; subordinated guarantees | 4600 | 2027-11-15 to 2029-05-01 | 2027 indenture only; 2029 indentures not supplied | Financial foundation (CP-1); calculation K13 |
| Trade receivable securitisation | Securitisation entity debt; outside covenant debt; drawn 487.5 at year-end, 650 after October 2024 draw | 487.5 drawn; 650 commitment | 2025-07-11 | Facility agreement not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Reference: carrying debt and leverage (not covenant measures) | Carrying debt 24880; reported net leverage 4.88x; 6.02x pro forma after October 2024 dividend payment of 4348 | 24880 carrying | Not applicable: aggregate | Financial statements only | Financial foundation (CP-1) |

### Covenant tests and headroom

| Test | Governing document | Threshold | Current position | Status | Source |
|---|---|---|---|---|---|
| Revolver usage trigger for maintenance test | Credit agreement | 40% of commitments (USD 364 million) | 7.36% derived (USD 67 million) | Not triggered; USD 297 million to trigger | d887611dex101.htm.jsonl, page 188; calculation K02; calculation K04 |
| Springing net leverage maintenance (revolver only) | Credit agreement | 7.50x (8.00x four quarters after material acquisition) | Not supplied: covenant ratio not disclosed | Not calculable; issuer states compliance | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Incremental and junior debt net leverage | Credit agreement | 7.25x | Not supplied: covenant ratio not disclosed | Not calculable | d887611dex101.htm.jsonl, page 146; d887611dex101.htm.jsonl, page 59 |
| Pari secured debt secured net leverage | Credit agreement | 5.00x | Not supplied: covenant ratio not disclosed | Not calculable | d887611dex101.htm.jsonl, page 146 |
| Unlimited restricted payments | Credit agreement | 6.75x net leverage, no default | Not supplied: covenant ratio not disclosed | Not calculable | d887611dex101.htm.jsonl, page 181 |
| Ratio debt and unlimited restricted payments | 2033 secured indenture | Fixed-charge cover above 2.0x | Not supplied: covenant ratio not disclosed | Not calculable | d887611dex41.htm.jsonl, pages 75–79 |
| Liens on ratio debt | 2033 secured indenture | 5.25x secured net leverage | Not supplied: covenant ratio not disclosed | Not calculable | d887611dex41.htm.jsonl, page 43 |
| Ratio investment baskets | Credit agreement | 5.75x unlimited; 7.00x joint ventures | Not supplied: covenant ratio not disclosed | Not calculable | d887611dex101.htm.jsonl, pages 62–63 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for springing maintenance test | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Credit agreement financial covenant; usage derived as commitment less availability after letters of credit; split between loans and cash-collateralised letters of credit not established |
| Springing consolidated net leverage (revolver only) | 7.50 | Not supplied: covenant ratio and financial-covenant EBITDA not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | 8.00x for four quarters after a material acquisition; tested only when usage trigger is exceeded; issuer states compliance |
| Incremental and junior or unsecured debt net leverage | 7.25 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test on pro forma basis; limited-condition acquisitions tested at signing |
| Pari secured debt secured net leverage | 5.00 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test for same-priority secured debt and incremental commitments |
| Unlimited restricted payments net leverage | 6.75 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Also requires no default; pro forma for the payment and its financing |
| Secured indenture fixed-charge cover for ratio debt and restricted payments | 2.0 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes above | x | 2033 indenture; non-guarantor ratio debt capped at USD 400 million |
| Secured indenture liens on ratio debt | 5.25 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | 2033 indenture permitted-lien clause |
| Unlimited investments net leverage | 5.75 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Also requires no revolving loans outstanding and unrestricted cash of at least USD 200 million |
| Joint-venture investment net leverage | 7.00 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Basket capped at the greater of USD 1,000 million and 40% of covenant EBITDA |

Only the revolver-usage trigger carries a current value; every ratio test lacks a disclosed covenant measurement, so its headroom is not established even though the issuer states it complied with all debt covenants at year-end.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement executed among the company, holdings, subsidiary guarantors, the credit agreement collateral agent and secured notes trustees and agents | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs first-lien enforcement and release; controls over the indenture in a conflict; not in the source set |
| 2024-03-22 | day | 2024-11-07 | Most recent credit-agreement amendment affecting restrictive covenants | Historical — The most recent amendment that impacted the restrictive covenants contained in the Credit Agreement is Amendment No. 15 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Fixes the covenant text reviewed through the September conformed copy; amendment itself not supplied |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17 and USD 1,500 million Tranche L incremental term loans under the incremental provision | Historical — Amendment No. 17 and Incremental Term Loan Assumption Agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Demonstrates use of incremental secured capacity to fund the distribution described by Business & governance |
| 2024-09-19 | day | 2024-09-19 | 2033 secured notes indenture executed and sixth joinder to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million pari first-lien notes to the shared collateral |
| 2027-09-15 | day | 2024-09-19 | First optional redemption date of the 2033 secured notes | Scheduled — “Initial Redemption Date” means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Point from which the notes can be refinanced at stated redemption prices |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all capital stock of the borrower | Ownership | TransDigm Inc. | Annual report 2024 business description via Business & governance; both Delaware corporations |
| TransDigm Group Incorporated | Guarantees bank obligations as holdings | Guarantee | Senior secured credit facility | Credit agreement events of default on holdings guarantee; New York law |
| TransDigm Group Incorporated | Guarantees on senior secured basis | Guarantee | Secured notes | Annual report 2024 guarantor information; 2033 indenture, New York law |
| TransDigm Group Incorporated | Guarantees on senior subordinated basis | Guarantee | Subordinated notes | Annual report 2024 guarantor information; 2027 indenture, New York law |
| TransDigm UK | Guarantees on senior subordinated basis | Guarantee | Subordinated notes | Annual report 2024 guarantor information; 2027 indenture, New York law; guarantor's own jurisdiction not stated |
| TransDigm UK | Guarantees 2028 secured notes on senior secured basis | Guarantee | Secured notes | Annual report 2024 guarantor information; 2028 indenture not supplied |
| Domestic restricted subsidiaries | Join as loan parties within twenty business days unless excluded | Guarantee | Senior secured credit facility | Credit agreement further-assurances covenant; New York law |
| Domestic restricted subsidiaries | Guarantee if they guarantee the bank facility or large capital-markets debt | Guarantee | Secured notes | Annual report 2024 guarantor information; 2033 indenture, New York law |
| Domestic restricted subsidiaries | Guarantee on senior subordinated basis | Guarantee | Subordinated notes | Annual report 2024 guarantor information; 2027 indenture, New York law |
| Loan-party collateral | First-priority liens shared under intercreditor agreement | Security | Senior secured credit facility | Credit agreement further-assurances covenant; collateral agreement not supplied; New York law |
| Loan-party collateral | First-priority liens subject to intercreditor agreement | Security | Secured notes | 2033 indenture collateral article; New York law |
| Foreign subsidiary equity | 65% of voting equity pledged | Security | Senior secured credit facility | Credit agreement further-assurances covenant; New York law |
| Non-guarantor subsidiaries | Their liabilities rank ahead on their own assets | Structural claim | Secured notes | Annual report 2024 states structural subordination to non-guarantor liabilities |
| Non-guarantor subsidiaries | Their liabilities rank ahead on their own assets | Structural claim | Subordinated notes | Annual report 2024 states structural subordination to non-guarantor liabilities |
| Securitisation entity | Receivables funding outside the loan parties | Structural claim | Senior secured credit facility | Credit agreement excludes securitisation entities from guarantor joinder; facility documents not supplied |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facility | Equal payment rank | Payment rank | Secured notes | Annual report 2024 ranking description; 2033 indenture, New York law |
| Senior secured credit facility | Shared first-priority lien | Security rank | Secured notes | 2033 indenture refers to First Lien Intercreditor Agreement; agreement not supplied |
| Senior secured credit facility | Senior debt paid in full in cash first | Payment rank | Subordinated notes | 2027 indenture subordination article, New York law |
| Secured notes | Senior debt paid in full in cash first | Payment rank | Subordinated notes | 2027 indenture subordination article; annual report ranking description |
| Senior secured credit facility | 179-day payment blockage after notice | Standstill | Subordinated notes | 2027 indenture payment-blockage clause, New York law |
| Credit agreement collateral agent | Its lien release releases the notes' lien | Release | Secured notes | 2033 indenture release clause, except on full non-enforcement discharge; New York law |
| Intercreditor authorised representative | Binds noteholders on collateral actions | Enforcement control | Secured notes | 2033 indenture collateral-agent clause; identity of representative not established |
| Required lenders | Direct acceleration and enforcement for loans | Enforcement control | Senior secured credit facility | Credit agreement remedies clause, New York law |
| Required revolving lenders | Term lenders wait for revolver acceleration | Standstill | Term loans | Credit agreement financial-covenant event of default, New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 9 |
| Calculated | 2 |
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
| MINOR | 2 |

### Definitions and ratio mechanics
Covenant leverage is measured on principal, net of all unrestricted cash, against an EBITDA wider than any reported measure. Covenant total indebtedness counts the principal of borrowed money, capital leases and notes but excludes undrawn ordinary-course letters of credit and securitisation-entity debt. A principal-basis reference of USD 24,581 million sits USD 299 million below carrying debt of USD 24,880 million, and the USD 486 million securitisation balance falls outside covenant debt altogether. Net ratios deduct unrestricted cash of holdings, the borrower and restricted subsidiaries with no cap in the text reviewed, so any test run before the October 2024 dividend payment benefited from the pre-payment cash balance.
Basis: d887611dex101.htm.jsonl, pages 26–28; d887611dex101.htm.jsonl, page 81; calculation K08; calculation K09; Financial foundation (CP-1)

The EBITDA definition adds back taxes, interest, non-cash charges, extraordinary or non-recurring items including acquisition, integration, restructuring and business-optimisation costs without a cap, costs of any acquisition, disposal, recapitalisation or debt incurrence, earn-outs, dividend-equivalent payments and projected cost savings from actions within 24 months, capped at 25% of EBITDA. The earnings-quality review treats acquisition, compensation and refinancing costs as recurring; the covenant definition admits them and more, so ratio gates and EBITDA-linked baskets grow faster than supportable earnings. The springing maintenance test uses a separate financial-covenant EBITDA that was not reviewed. Contract liabilities of USD 177 million are customer funding outside covenant debt, so a build in advances supports liquidity without consuming any ratio capacity.
Basis: d887611dex101.htm.jsonl, pages 23–24; d887611dex101.htm.jsonl, page 27; Earnings quality (CP-1D); Financial foundation (CP-1)

### Debt incurrence and incremental capacity
Debt capacity is ratio-led and so expands with covenant EBITDA rather than being fixed. Same-priority secured debt needs secured net leverage at or below 5.00x, and junior secured or unsecured debt needs net leverage at or below 7.25x, with maturity no earlier than the term loans, no shorter weighted life and no obligors outside the loan parties. Fixed-plus-grower baskets add the greater of USD 250 million and 10% of covenant EBITDA for general debt and the greater of USD 450 million and 18% for foreign restricted subsidiaries. The securitisation basket of the greater of USD 725 million and 20% of covenant EBITDA left at least USD 237.5 million on its fixed floor at year-end and at least USD 75 million after the October 2024 draw to USD 650 million. The borrower may reclassify debt among baskets, and acquisition financing is tested at signing. Protection against cheaper later tranches for existing lenders was not reviewed and is not established.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, page 146; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation K06; calculation K07

The 2033 indenture is looser than the bank agreement on both incurrence and liens: ratio debt needs only fixed-charge cover above 2.0x, with a USD 400 million cap on non-guarantor ratio debt, and liens on that debt are allowed up to 5.25x secured net leverage against the bank agreement's 5.00x. Once the term loans are repaid or refinanced, the notes alone would allow more secured debt than the bank agreement does today, which matters because the term loans mature between 2028 and 2032 while the notes run to 2033.
Basis: d887611dex41.htm.jsonl, page 43; d887611dex41.htm.jsonl, page 79; Financial foundation (CP-1)

### Leakage, restricted payments and investments
The restricted-payments covenant captures dividends, including dividend-equivalent payments, buybacks and early repayment of subordinated debt, but its exceptions are wide. Beyond small baskets (the greater of USD 75 million and 3% of covenant EBITDA, and an annually capped management and dividend-equivalent basket), any payment is allowed at 6.75x covenant net leverage with no default, and a dividend may be paid within 60 days of declaration if it was permitted when declared. The 2033 indenture adds an unlimited payment right at fixed-charge cover above 2.0x that survives a later ratio failure once the payment is contractually committed. The September 2024 distribution of USD 4,348 million shows these routes are used, not theoretical.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 75–76; Business & governance (CP-1A)

Investment capacity is the second leakage channel. Investments in restricted subsidiaries are uncapped, including foreign subsidiaries that do not guarantee, so value can move from guarantors to non-guarantors without using a basket. Unrestricted-subsidiary investments are capped at the greater of USD 250 million and 10% of covenant EBITDA, but a general basket of the greater of USD 500 million and 25% of restricted-group total assets, a joint-venture basket of the greater of USD 1,000 million and 40% of covenant EBITDA at 7.00x, and an unlimited basket at 5.75x with no revolving loans and at least USD 200 million of unrestricted cash are fungible routes. Acquisitions are permitted with only USD 100 million of available liquidity and no default.
Basis: d887611dex101.htm.jsonl, pages 61–63; calculation K10

### Collateral, guarantees and structural subordination
The guarantee perimeter is domestic. Domestic subsidiaries must join as loan parties within twenty business days unless immaterial, unrestricted or a securitisation entity; domestic equity is fully pledged but only 65% of the voting equity of directly held foreign subsidiaries is pledged. The later secured notes are guaranteed by subsidiaries that guarantee the bank facility or large capital-markets debt, so their guarantor set moves with the bank set. The notes and subordinated notes are structurally subordinated to non-guarantor liabilities, and holdings has no significant assets beyond its investment in the borrower. Non-guarantor asset and EBITDA shares are not established, so stranded value is named but not sized.
Basis: d887611dex101.htm.jsonl, pages 173–174; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58

The notes' liens are released automatically when a guarantor is released, on permitted disposals, on designation of a guarantor as unrestricted, when it becomes immaterial, as the intercreditor agreement provides, and whenever the credit agreement collateral agent releases its own lien other than on a full non-enforcement discharge. The bank agreement needs each lender's consent only to release material guarantors or all or substantially all collateral, so partial releases can be agreed by the bank group alone and pass automatically to the noteholders.
Basis: d887611dex41.htm.jsonl, pages 136–137; d887611dex101.htm.jsonl, page 205

### Events of default, remedies and amendment risk
Payment default on principal is immediate and interest has five business days of grace; breach of the negative covenants is an immediate event of default, while other covenants have 30 days after notice. Guarantee or collateral invalidity, loss of subordination of the subordinated notes and a change of control are events of default. Required lenders direct acceleration and enforcement for the loans; insolvency accelerates automatically. Amendments need required lenders except for listed sacred rights, and the agent may, without lender consent, enter intercreditor arrangements for pari or junior secured debt the covenants permit. The cross-default clause was not reviewed.
Basis: d887611dex101.htm.jsonl, pages 188–192; d887611dex101.htm.jsonl, pages 204–205

### Nearest pressure point
The nearest pressure point is pari secured incremental capacity under the 5.00x secured net leverage gate, because it is the debt route that funded the September 2024 distribution and it dilutes every first-lien creditor. The evidence is the incremental-commitment conditions requiring only 7.25x net and 5.00x secured net leverage, together with the USD 1,500 million incremental term loan of September 2024. The mechanism is that a recapitalisation combines this capacity with the 6.75x distribution gate, adding secured debt without adding earnings, so first-lien recovery falls and default risk rises through higher fixed charges. The monitoring signal is any new incremental assumption agreement, intercreditor joinder or special dividend declaration. Tightening the view needs a compliance certificate with covenant EBITDA, secured net leverage and the incremental most-favoured-nation terms.
Basis: d887611dex101.htm.jsonl, page 146; d887611dex101.htm.jsonl, page 1; d887611dex41.htm.jsonl, page 30; Business & governance (CP-1A)

### Intercreditor read-through
Enforcement control over the shared first-lien collateral cannot be assigned, because the agreement that allocates it is not in the source set; the 2033 indenture says that agreement prevails and lets its authorised representative bind noteholders. What the documents do show is release power with the bank agent and a bank class of USD 8,702 million of term loans plus USD 910 million of revolver commitments against USD 11,000 million of secured notes. For subordinated noteholders the mechanics are clear: senior debt is paid in full in cash first in insolvency, payment defaults on designated senior debt block payments until cured, and non-payment defaults allow one 179-day blockage in any 360 days, which can delay recovery but not strip the claim.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 132; d826058dex41.htm.jsonl, pages 106–107; calculation K11; calculation K12

### Overall legal, capacity and structural view
Overall, TransDigm presents an aggressive covenant package. Its main protections are the domestic guarantee and first-lien collateral, the confinement of unrestricted-subsidiary designation to new subsidiaries, the bank sacred rights on pro rata sharing and collateral release, and the noteholders' each-holder ranking protection. Its main weaknesses are covenant-light terms for term loans and notes, unlimited distributions behind ratio gates, open-ended pari secured capacity measured on an elastic EBITDA, and collateral releases led by the bank agent. The primary default-risk path is another debt-funded distribution; the primary recovery path is pari secured dilution plus non-guarantor leakage. Covenant-capacity visibility is insufficient: exact headroom is not supported and needs covenant EBITDA, compliance certificates and basket usage. The legal and covenant review is completed with limitations; its aggressiveness reading is provisional because the intercreditor agreement, collateral agreement and four note indentures are missing.
Basis: d887611dex101.htm.jsonl, pages 181–188; d887611dex41.htm.jsonl, pages 117–137; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–62

### Analytical appendix — complete canonical registers

### Evidence register

| Evidence ID | Provision or fact | Source |
|---|---|---|
| E01 | Springing financial covenant: 7.50x / 8.00x net leverage when revolver exposure exceeds 40% of commitments; amendable by Required Revolving Lenders only | d887611dex101.htm.jsonl, page 188 |
| E02 | Issuer summary of maintenance covenant (USD 364 million trigger), no maintenance covenants in term loans or indentures, year-end compliance | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| E03 | Permitted Indebtedness (12) ratio debt 5.00x secured / 7.25x junior and unsecured; (13) general basket greater of USD 250 million and 10% of Consolidated EBITDA | d887611dex101.htm.jsonl, page 59 |
| E04 | Permitted Indebtedness (14) foreign subsidiaries greater of USD 450 million and 18%; (17) subordinated debt at 7.25x; (18) securitisation greater of USD 725 million and 20% | d887611dex101.htm.jsonl, page 60 |
| E05 | Debt reclassification; limited-condition acquisition testing; Permitted Investments (1) restricted subsidiaries uncapped and unrestricted subsidiaries greater of USD 250 million and 10% | d887611dex101.htm.jsonl, page 61 |
| E06 | Permitted Investments (10) greater of USD 500 million and 25% of Total Assets; (11) joint ventures greater of USD 1,000 million and 40% at 7.00x | d887611dex101.htm.jsonl, page 62 |
| E07 | Permitted Investments (18) acquisitions with USD 100 million Available Liquidity; (20) unlimited at 5.75x, no revolving loans, unrestricted cash at least USD 200 million | d887611dex101.htm.jsonl, page 63 |
| E08 | Restricted payments definition and clauses (1) to (4), including 60-day declaration rule | d887611dex101.htm.jsonl, pages 177–179 |
| E09 | Restricted payments clauses (5) to (10) and unlimited payments at 6.75x net leverage with no default | d887611dex101.htm.jsonl, pages 179–181 |
| E10 | Incremental commitments require 7.25x net leverage and 5.00x secured net leverage pro forma | d887611dex101.htm.jsonl, page 146 |
| E11 | Amendments by Required Lenders; sacred rights (A) to (G); agent may enter pari or junior intercreditor arrangements without lender consent | d887611dex101.htm.jsonl, pages 204–205 |
| E12 | Consolidated EBITDA add-backs including 25% capped cost savings within 24 months | d887611dex101.htm.jsonl, pages 23–24 |
| E13 | Events of default (i) to (o); financial-covenant event of default limited to revolving lenders; remedies | d887611dex101.htm.jsonl, pages 191–192 |
| E14 | Unrestricted Subsidiary designation limited to newly acquired or newly formed subsidiaries; Unrestricted Cash definition | d887611dex101.htm.jsonl, page 81 |
| E15 | Additional guarantors within twenty business days; Excluded Subsidiaries; 100% domestic and 65% foreign voting equity pledge | d887611dex101.htm.jsonl, pages 173–174 |
| E16 | Consolidated Total Indebtedness on principal; excludes undrawn letters of credit and securitisation debt | d887611dex101.htm.jsonl, page 28 |
| E17 | Credit agreement and amendment governed by New York law | d887611dex101.htm.jsonl, page 8; d887611dex101.htm.jsonl, page 222 |
| E18 | First Lien Intercreditor Agreement dated 2019-02-13 with joinders 1 to 6; Initial Redemption Date 2027-09-15 | d887611dex41.htm.jsonl, page 30 |
| E19 | Permitted lien (xxxi) on ratio debt up to 5.25x secured net leverage | d887611dex41.htm.jsonl, page 43 |
| E20 | Ratio debt at fixed-charge cover above 2.0x; USD 400 million cap for non-guarantor restricted subsidiaries | d887611dex41.htm.jsonl, page 79 |
| E21 | Unlimited restricted payments at fixed-charge cover above 2.0x; unrestricted designation treated as restricted payment | d887611dex41.htm.jsonl, pages 75–77 |
| E22 | Indenture amendments: majority; each affected holder for ranking and payment terms; 66⅔% for collateral release or adverse intercreditor change | d887611dex41.htm.jsonl, pages 117–118 |
| E23 | Intercreditor agreement controls; further assurances; lien release triggers including bank agent release | d887611dex41.htm.jsonl, pages 135–137 |
| E24 | Holders bound through intercreditor Applicable Authorized Representative | d887611dex41.htm.jsonl, page 132 |
| E25 | 2033 indenture governed by New York law | d887611dex41.htm.jsonl, page 126 |
| E26 | Subordination to Senior Debt; payment default bar; 179-day blockage, one per 360 days | d826058dex41.htm.jsonl, pages 106–107 |
| E27 | 2027 indenture governed by New York law | d826058dex41.htm.jsonl, page 124 |
| E28 | Guarantor information; structural subordination to non-guarantors; holdings has no significant separate assets | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58 |
| E29 | Restrictive covenant summary; March 2024 amendment latest affecting covenants; incremental 7.25x and 5.00x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E30 | Amendment No. 17 Tranche L USD 1,500,000,000 requested under incremental provision | d887611dex101.htm.jsonl, page 1 |
| E31 | Debt principal, carrying debt, cash, revolver, securitisation, contract liabilities, reported and pro forma leverage | Financial foundation (CP-1) |
| E32 | September 2024 dividend recapitalisation: USD 4,348 million; USD 3,000 million new secured debt | Business & governance (CP-1A) |
| E33 | USD 345 million of issuer add-backs rejected as recurring for credit purposes | Earnings quality (CP-1D) |
| E34 | Legal-document coverage gaps in the source set | Source readiness (CP-0) |

### T4.1 Source gate and module status

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Executed amendment with conformed credit agreement annexed | 1 | Guarantee and collateral agreement, schedules and later amendments not supplied | Completed with Limitations |
| d887611dex41.htm.jsonl | Executed indenture | 1 | Covers 2033 secured notes only | Completed with Limitations |
| d826058dex41.htm.jsonl | Executed indenture | 1 | Covers 2027 subordinated notes only | Completed with Limitations |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Filed annual report | 4 (issuer covenant summary; verify against executed text) | Summary only; published after the analysis date | Completed with Limitations |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | d887611dex101.htm.jsonl | Credit agreement amendment with conformed agreement | 2024-09-19 | Executed | Controls loan covenants, incremental, restricted payments, amendments | Primary source for bank covenants and collateral release consent | E01; E03–E17; E30 |
| 1 | d887611dex41.htm.jsonl | Indenture, 2033 secured notes | 2024-09-19 | Executed | Controls 2033 notes covenants, collateral, release | Shows notes' looser ratio tests and bank-led release | E18–E25 |
| 1 | d826058dex41.htm.jsonl | Indenture, 2027 subordinated notes | 2019-11-13 per Source readiness | Executed | Controls subordination and blockage | Junior class standstill and turnover | E26; E27 |
| 1 | d833756dex101.htm.jsonl | Credit agreement amendment No. 16 | 2024-06-04 | Executed; not reviewed | Superseded in operative text by the September 2024 conformed copy | No separate finding | E34 |
| 1 | d739389dex101.htm.jsonl | Second amended and restated credit agreement | 2014-06-04 | Executed; not reviewed | Base of amendment chain | No separate finding | E34 |
| 1 | d496141dex101.htm.jsonl | Earlier amendment and restatement | 2013-02-28 | Executed; not reviewed | Historical | No separate finding | E34 |
| 2 | First Lien Intercreditor Agreement | Intercreditor agreement | 2019-02-13 with joinders to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Controls first-lien enforcement and release over the indenture | Enforcement control cannot be assigned | E18; E23 |
| 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report covenant summary | 2024-11-07 | Filed | Summary and compliance statement | Confirms trigger amount and compliance; summary only | E02; E28; E29 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at most 7.50x (8.00x four quarters after material acquisition) only if revolver exposure exceeds 40%; revolver lenders only | Credit agreement Section 6.14 | No tripwire for term loans or notes; amendable by revolving lenders alone | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the source set | E01; E02 |
| Ratio debt | Pari secured at 5.00x secured net; junior or unsecured at 7.25x net; maturity and weighted-life limits | Permitted Indebtedness (12) | Uncapped dollar capacity tied to covenant EBITDA | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the source set | E03 |
| Incremental facilities | Commitments allowed at 7.25x net and 5.00x secured net | Section 2.24(c) | Pari secured dilution; used for USD 1,500 million in 2024 | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the source set | E10; E30 |
| General debt basket | Greater of USD 250 million and 10% of Consolidated EBITDA | Permitted Indebtedness (13) | Free-and-clear debt beside ratio debt | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the source set | E03 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% of Consolidated EBITDA | Permitted Indebtedness (14) | Structurally senior debt at non-guarantors | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the source set | E04 |
| Securitisation | Greater of USD 725 million and 20% of Consolidated EBITDA, non-recourse | Permitted Indebtedness (18) | Receivables move outside collateral; excluded from covenant debt | Neutral — Stable | [Insufficient Information] — no comparative source in the source set | E04; E16 |
| Restricted payments | Unlimited at 6.75x net leverage and no default; general basket greater of USD 75 million and 3%; 60-day declaration rule | Section 6.02 | Debt-funded distributions permitted behind a ratio gate | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the source set | E08; E09 |
| Investments | Restricted subsidiaries uncapped; general greater of USD 500 million and 25% Total Assets; unlimited at 5.75x | Permitted Investments (1), (10), (20) | Value can move to non-guarantors | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the source set | E05–E07 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries; no recourse debt | Definition of Unrestricted Subsidiary | Limits drop-down of existing operating subsidiaries | Neutral — Stable | [Insufficient Information] — no comparative source in the source set | E14 |
| EBITDA definition | Uncapped non-recurring and transaction add-backs; cost savings capped at 25% within 24 months; dividend equivalents added | Definition of Consolidated EBITDA | Inflates all ratio and grower capacity | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the source set | E12 |
| Guarantor coverage | Domestic subsidiaries join within twenty business days; foreign excluded; 65% foreign voting equity pledged | Section 5.11 | Non-guarantor value structurally senior to loans and notes | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the source set | E15; E28 |
| Collateral release (notes) | Notes liens released when bank agent releases, on disposals, designation, immateriality | 2033 indenture Section 12.07 | Bank group drives partial releases | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the source set | E23 |
| Amendments (loans) | Required Lenders; sacred rights on payment terms, pro rata sharing, material guarantor and all-collateral release | Section 9.02 | No explicit anti-subordination sacred right in clause reviewed | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the source set | E11 |
| Amendments (notes) | Majority; each affected holder for ranking; 66⅔% for collateral release | 2033 indenture Section 9.02 | Stronger anti-priming protection for notes | Neutral — Stable | [Insufficient Information] — no comparative source in the source set | E22 |
| Events of default | Immediate default for negative covenants; financial covenant default revolver-only until revolver acceleration | Article VII | Term lenders stand still on maintenance breach | Negative — Refinancing Risk | [Insufficient Information] — no comparative source in the source set | E13 |
| Notes ratio debt and payments | Fixed-charge cover above 2.0x for ratio debt and unlimited payments; liens to 5.25x | 2033 indenture Sections 4.07, 4.09, lien (xxxi) | Notes alone permit more leverage than bank agreement | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the source set | E19–E21 |
| Subordination | Senior debt paid in full first; 179-day blockage | 2027 indenture Article 10 | Junior class standstill | Neutral — Stable | [Insufficient Information] — no comparative source in the source set | E26 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Springing maintenance covenant | 7.50x revolver-only test, inactive at 7.36% usage | No early covenant trigger before liquidity stress | Higher: default arrives via payment or liquidity | Neutral directly; late intervention erodes value | Track revolver drawings against USD 364 million trigger | E01; E02 |
| Ratio restricted payments | Unlimited at 6.75x; indenture at above 2.0x | Debt-funded distributions | Higher: fixed charges rise without earnings | Higher: cash leaves the group | Track declarations and compliance certificates | E09; E21; E32 |
| Pari secured incremental | 5.00x secured net gate | Adds same-rank claims | Higher | Higher: first-lien dilution | Track incremental agreements and intercreditor joinders | E10; E30 |
| EBITDA definition | 25% cost savings cap, uncapped one-offs | Inflates covenant capacity | Higher | Higher via larger permitted debt | Compare covenant EBITDA to issuer EBITDA As Defined | E12; E33 |
| Non-guarantor perimeter | Foreign subsidiaries excluded; 65% voting pledge | Structural subordination | Neutral | Higher: stranded foreign value | Obtain guarantor share of assets and EBITDA | E15; E28 |
| Bank-led collateral release | Notes liens follow bank agent | Partial releases without noteholder consent | Neutral | Higher for notes | Track release notices and asset disposals | E23 |
| Amendment control | No explicit anti-subordination sacred right in loan clause reviewed | Majority-lender priming theoretically possible | Neutral | Higher for non-consenting lenders | Track amendment filings | E11 |
| Subordination and blockage | 179-day blockage; payment-default bar | Delays junior recovery | Neutral | Higher for subordinated notes | Track senior default notices | E26 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions in the covenant feature register | [Insufficient Information] — no comparative market-norm or covenant-review source in the source set | Not performed: comparison requires a comparative source | Not performed: no third-party view to compare | Insufficient Information | E34 |

Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided.

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x at above 40% usage; none for term loans or notes | No creditor-wide tripwire | Negative — Covenant Erosion | Provisional | E01; E02 |
| Debt / lien incurrence capacity | 4 | Ratio debt at 7.25x and 5.00x; notes liens to 5.25x; fixed-plus-grower baskets | Open-ended pari secured dilution | Negative — Leverage Increase | Provisional | E03; E04; E10; E19 |
| RP / investment / leakage capacity | 4 | Unlimited payments at 6.75x and above 2.0x cover; demonstrated USD 4,348 million recap; large investment baskets; narrow unrestricted designation | Distribution and transfer to non-guarantors | Negative — Leverage Increase | Provisional | E05–E09; E14; E21; E32 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped one-offs; cost savings to 25% over 24 months; dividend equivalents | Inflates all ratio capacity | Negative — Covenant Erosion | Provisional | E12 |
| Collateral / guarantor protection | 3 | Domestic guarantees; foreign excluded; bank-led partial release; each-lender for all collateral | Structural subordination and release flexibility | Negative — Covenant Erosion | Provisional | E15; E23; E28 |
| Amendment / control mechanics | 3 | Required Lenders with sacred rights on sharing and releases; notes ranking each-holder right | Theoretical majority priming of loans | Negative — Covenant Erosion | Provisional | E11; E22 |
| Overall | 4 | Weighted to demonstrated ratio-gated distribution and secured dilution | Releveraging and pari dilution | Negative — Leverage Increase | Provisional | E09; E10; E32 |

Covenant aggressiveness score: 4 of 5 (Aggressive), status Provisional, because the intercreditor agreement, collateral agreement and four indentures are missing; the overall score is weighted to the demonstrated distribution and secured-dilution routes rather than averaged.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further special dividend | Restricted payments at 6.75x; indenture at above 2.0x | Repeats debt-funded extraction | PD up; LGD up; secured paper widens | Track declarations and financing announcements | E09; E21; E32 |
| New pari secured debt | Incremental at 5.00x secured net; joinder to intercreditor agreement | Dilutes first-lien recovery | LGD up for first lien | Track incremental agreements and joinders | E10; E18 |
| Revolver drawings above USD 364 million | Springing covenant trigger | Activates 7.50x test | PD signal of liquidity stress | Track quarterly revolver usage | E01; E02 |
| Partial collateral release by bank agent | Notes release clause | Notes lose collateral without vote | LGD up for notes | Track release notices and disposals | E23 |
| Majority-lender amendment to debt or lien covenants | Loan amendment clause | Potential priming route | LGD up for non-consenting lenders | Track amendment filings and consent solicitations | E11 |
| Growth in foreign non-guarantor debt | Foreign basket greater of USD 450 million and 18% | Structurally senior claims | LGD up for loans and notes | Track subsidiary debt disclosures | E04 |
| Covenant EBITDA divergence | Cost savings and uncapped add-backs | Capacity outruns earnings | PD and LGD up | Request covenant EBITDA reconciliation | E12; E33 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and joinders | Enforcement control, standstill and sharing | Intercreditor registers carry missing-document entries | Obtain executed agreement and all six joinders |
| Collateral and guarantee documents | Guarantee and Collateral Agreement, security schedules, guarantor exhibit | Excluded assets and perimeter | Collateral matrix qualitative; stranded value unsized | Obtain agreement, schedules and guarantor list |
| Compliance inputs | Compliance certificate, covenant EBITDA, financial-covenant EBITDA, basket usage | Headroom and capacity | All ratio headroom not calculable | Obtain latest certificate and usage tracker |
| Other indentures | 2028–2032 secured and 2029 subordinated indentures | Term differences | Findings extended by issuer statement only | Obtain each indenture |
| Most-favoured-nation and cross-default text | Incremental pricing protection and cross-default clause | Repricing and acceleration contagion | Not assessed | Review remaining credit agreement clauses |
| Refinancing and liability-management assessment | Maturity-driven exchange analysis | Ties priming routes to triggers | Exchange routes theoretical only | Obtain refinancing assessment |
| Comparative source | Market-norm or covenant-review report | Relative assessment | Score absolute only | Obtain covenant-review report |

### T4D.1 Source gate and entity evidence

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Executed; guarantor joinder and pledge provisions | 1 | Guarantor schedule and collateral agreement not supplied | Completed with Limitations |
| d887611dex41.htm.jsonl | Executed; guarantee and release provisions | 1 | Other secured indentures not supplied | Completed with Limitations |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Filed; guarantor description | 4 | Guarantor exhibit and non-guarantor figures not extracted | Completed with Limitations |
| Subsequent perimeter events | No guarantee release, designation or collateral release after 2024-09-30 identified in the documents reviewed | Not applicable: scan result | Scan limited to supplied documents | Completed with Limitations |

### T4D.2 Restricted and unrestricted entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware | Not applicable: listed parent | Not a subsidiary; cannot be designated | No significant assets beyond investment in borrower | Yes | E28; E17 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Borrower | [Insufficient Information] — borrower stand-alone assets not separately disclosed | Yes | E28; E30 |
| TransDigm UK | Guarantor of 2028 secured notes and subordinated notes | [Insufficient Information] — jurisdiction not stated in documents reviewed | [Insufficient Information] — parent not stated | Restricted; designation capacity limited to new subsidiaries | [Insufficient Information] — value not disclosed | Yes for named notes; bank guarantee not established | E28 |
| Domestic restricted subsidiaries | Guarantors and grantors | United States | TransDigm Inc. or other subsidiaries | Restricted; existing ones cannot be designated unrestricted | [Insufficient Information] — guarantor share of assets and EBITDA not extracted | Yes | E15; E28 |
| Foreign restricted subsidiaries | Non-guarantors; 65% voting equity pledged | Various non-US | Loan parties | Restricted | [Insufficient Information] — value not disclosed | Restricted group yes; guarantee group no | E15; E28 |
| Immaterial domestic subsidiaries | Excluded non-guarantors | United States | Loan parties | Restricted; capped by 5% individual and 7.5% aggregate thresholds | [Insufficient Information] — value not disclosed | Restricted group yes; guarantee group no | E15 |
| Securitisation entity | Receivables funding vehicle | [Insufficient Information] — facility documents not supplied | [Insufficient Information] — not stated | Excluded subsidiary | Drawn USD 487.5 million at year-end | No | E04; E02 |
| Unrestricted subsidiaries | None identified | Not applicable: none identified | Not applicable: none identified | Unrestricted | [Insufficient Information] — existence not established | No | E14 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facility | Senior secured guarantee | Upstream | Termination or release under agreement; [Insufficient Information] — collateral agreement not supplied | E13 |
| TransDigm Group Incorporated × secured notes | Senior secured guarantee | Upstream | Indenture release provisions | E28; E23 |
| TransDigm Group Incorporated × subordinated notes | Senior subordinated guarantee | Upstream | [Insufficient Information] — 2027 release clause not reviewed | E28 |
| Domestic restricted subsidiaries × credit facility | Senior secured guarantee | Upstream and cross-stream | Material guarantor release needs each lender; others per collateral agreement | E11; E15 |
| Domestic restricted subsidiaries × 2029–2033 secured notes | Senior secured guarantee | Upstream and cross-stream | Released if guarantor becomes immaterial, unrestricted, sold or ceases bank guarantee | E23; E28 |
| Domestic restricted subsidiaries × subordinated notes | Senior subordinated guarantee | Upstream and cross-stream | [Insufficient Information] — 2027 release clause not reviewed | E28 |
| TransDigm UK × 2028 secured notes and subordinated notes | Secured and subordinated guarantees | Cross-stream | [Insufficient Information] — 2028 indenture not supplied | E28 |
| Foreign restricted subsidiaries × all tranches | No guarantee | Not applicable: non-guarantors | Not applicable: no guarantee | E15; E28 |

### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × first lien | [Insufficient Information] — collateral agreement not supplied | Bank agent release flows to notes | 90-day post-closing perfection for notes | E23 |
| TransDigm Group Incorporated × junior lien | No junior lien outstanding; capacity at 7.25x | Not applicable: none outstanding | Not applicable: none outstanding | E03 |
| TransDigm Inc. × first lien | Unrestricted subsidiary equity; equity whose pledge would require separate SEC financial statements | Disposal, bank agent release, intercreditor agreement | Equity pledge carve-out for separate-statement rules | E15; E23 |
| TransDigm Inc. × junior lien | No junior lien outstanding | Not applicable: none outstanding | Not applicable: none outstanding | E03 |
| Domestic restricted subsidiaries × first lien | Immaterial and securitisation subsidiaries excluded | Guarantor release releases liens | Joinder within twenty business days | E15; E23 |
| Domestic restricted subsidiaries × junior lien | No junior lien outstanding | Not applicable: none outstanding | Not applicable: none outstanding | E03 |
| Foreign restricted subsidiaries × first lien | Assets not pledged; 35% of voting equity unpledged | Not applicable: assets not collateral | Only 65% voting equity of directly held foreign subsidiaries | E15 |
| Foreign restricted subsidiaries × junior lien | Not pledged | Not applicable: not collateral | Not applicable: not collateral | E15 |
| Securitisation entity × first lien | Receivables sold to entity outside collateral | Not applicable: excluded subsidiary | [Insufficient Information] — facility documents not supplied | E04 |
| Securitisation entity × junior lien | Outside collateral | Not applicable: excluded subsidiary | [Insufficient Information] — facility documents not supplied | E04 |
| TransDigm UK × first lien | [Insufficient Information] — collateral position not stated | [Insufficient Information] — 2028 indenture not supplied | [Insufficient Information] — local-law limits not stated | E28 |
| TransDigm UK × junior lien | No junior lien outstanding | Not applicable: none outstanding | Not applicable: none outstanding | E28 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans I–L | TransDigm Inc. with holdings and domestic guarantors | Guarantor assets and pledged equity | Pari (same entity, same lien) | Foreign subsidiary assets; 35% of foreign voting equity; securitised receivables | First-lien access to domestic value; residual only from foreign subsidiaries | Medium | E15; E28 |
| Secured notes 2028–2033 | TransDigm Inc. with same guarantors | Same collateral as loans | Pari (same entity, same lien) | Same as loans, plus releases led by bank agent | Same access, weaker release control | Medium | E23; E28 |
| Subordinated notes | TransDigm Inc. with subordinated guarantees | Guarantor value after senior debt | Contractually Subordinated | Non-guarantor value and all senior-secured claims ahead | Junior recovery after senior debt is paid in full | High | E26; E28 |
| Foreign subsidiary debt (capacity) | Foreign restricted subsidiaries | Foreign assets first | Structurally Senior | Not applicable: claim sits at value | Ranks ahead of loans and notes on foreign assets | Medium | E04 |
| Securitisation facility | Securitisation entity | Transferred receivables | Structurally Senior | Not applicable: claim sits at value | Ahead of first lien on receivables | Medium | E04 |
| Loans (amendment route) | TransDigm Inc. | Same collateral | Priming-Exposed (uptier capable) | Theoretical: depends on majority amendment | Non-consenting lenders could be primed | Low | E11 |

### T4D.6 Drop-down and transfer capacity register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distribution to shareholders | Restricted group to holdings to shareholders | Restricted payments at 6.75x; indenture at above 2.0x | USD 4,348 million paid October 2024; further amount not calculable | 4 | Cash leaves all creditors | Demonstrated | E09; E21; E32 |
| Investment in foreign non-guarantors | Guarantors to foreign restricted subsidiaries | Uncapped restricted-subsidiary investments | [Insufficient Information] — non-guarantor value not disclosed | 4 | Value moves behind structural creditors | Theoretical | E05 |
| General investment basket | Guarantors to any person | Greater of USD 500 million and 25% of Total Assets | Reference USD 6,396.50 million on group assets | 3 | Fungible leakage capacity | Theoretical | E06 |
| Unrestricted subsidiary drop-down | Guarantors to new unrestricted subsidiary | Designation limited to new subsidiaries; cap greater of USD 250 million and 10% | Within caps plus fungible baskets | 3 | Limited by designation rule | Theoretical | E05; E14 |
| Asset sale or disposal | Guarantors to third parties | Asset sale covenant; automatic lien release | [Insufficient Information] — asset sale reinvestment terms not reviewed | 3 | Collateral released on permitted disposals | Theoretical | E23 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by majority amendment | Loan amendment clause lacks explicit anti-subordination sacred right in text reviewed | Non-consenting term and revolving lenders | Theoretical | Could subordinate lien or payment priority; pro rata sharing right is a partial block | Low | E11 |
| Release-led trapdoor | Notes liens follow bank agent partial releases | Secured noteholders | Theoretical | Collateral can leave notes' reach without holder vote | Medium | E23 |
| Structurally senior foreign debt | Foreign debt basket greater of USD 450 million and 18% | Loans and all notes | Theoretical | Debt placed ahead on non-guarantor assets | Medium | E04 |
| Notes anti-subordination | Each affected holder for adverse ranking change; 66⅔% for collateral release | Secured noteholders (protection) | Theoretical | Reduces uptier risk for notes relative to loans | High | E22 |

### T4D.8 Gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Guarantor exhibit and schedules | Names every guarantor | Entity register uses classes, not names | Obtain guarantor exhibit |
| Collateral agreement | Guarantee and Collateral Agreement | Excluded assets and releases | Collateral matrix partial | Obtain executed agreement |
| Non-guarantor value | Non-guarantor assets, EBITDA, debt | Sizes stranded value | Structural labels without amounts | Obtain guarantor and non-guarantor financial split |
| Securitisation documents | Receivables purchase and loan agreements | Transferred-asset scope | Securitisation row qualitative | Obtain facility documents |
| TransDigm UK | Jurisdiction and collateral status | Guarantee limitation analysis | Row incomplete | Obtain 2028 indenture and guarantor details |

### T4F.1 Controlling documents for intercreditor analysis

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement | Company, holdings, subsidiary guarantors, credit agreement collateral agent, secured notes trustees and collateral agents | 2019-02-13; joinders to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced only; not in source set | d887611dex41.htm.jsonl, page 30 | E18 |
| Credit agreement as amended | TransDigm Inc., holdings, subsidiary loan parties, agent and lenders | 2024-09-19 conformed | New York | Executed | d887611dex101.htm.jsonl, pages 1–8 and 222 | E17; E30 |
| 2033 secured notes indenture | TransDigm Inc., guarantors, trustee, notes collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, page 126 | E25 |
| 2027 subordinated notes indenture | TransDigm Inc., guarantors, trustee | 2019-11-13 per Source readiness | New York | Executed | d826058dex41.htm.jsonl, page 124 | E27 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Shared first-priority lien | Required Revolving Lenders control financial-covenant remedies; general enforcement per intercreditor agreement not established | USD 910 million commitments | E01; E13 |
| Term lenders I–L | First lien, pari | Shared first-priority lien | Required Lenders direct agent; intercreditor role [Insufficient Information] — ICA not in the source set | USD 8,702 million principal | E13; E11 |
| Secured noteholders | First lien, pari | Shared first-priority lien, subject to intercreditor agreement | Bound by intercreditor authorised representative; [Insufficient Information] — ICA not in the source set | USD 11,000 million principal; majority, 66⅔% or each holder by topic | E22; E24 |
| Subordinated noteholders | Contractually subordinated | Unsecured | Blocked during senior payment default and blockage periods | USD 4,600 million principal | E26 |
| Securitisation lenders | Structurally senior on receivables | Receivables of securitisation entity | [Insufficient Information] — facility documents not supplied | USD 650 million commitment | E04 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement under intercreditor agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Revolving lenders, term lenders, secured noteholders | [Insufficient Information] — ICA not in the source set | Insufficient Information | E18 |
| Subordinated notes payment blockage | 179 days; once per 360 days; 181 days free of blockage | Non-payment default on designated senior debt and blockage notice | Representative of designated senior debt | Subordinated noteholders | Junior payments stop while senior creditors act | Negative — Refinancing Risk | E26 |
| Subordinated notes payment-default bar | Until cured, waived or senior debt paid in full | Payment default or acceleration of designated senior debt | Senior creditors | Subordinated noteholders | No junior payment during senior payment default | Negative — Liquidity Deterioration | E26 |
| Term lenders on financial-covenant breach | Until revolving lenders terminate commitments or accelerate | Breach of springing 7.50x test | Required Revolving Lenders | Term lenders | Term lenders cannot accelerate on maintenance breach alone | Negative — Covenant Erosion | E13 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes insolvency distribution | Payments to holders go to senior debt until paid in full in cash | Not applicable: unsecured | [Insufficient Information] — no purchase option in clauses reviewed | Holders may keep subordinated securities | Notes may receive equity and equally subordinated debt | E26 |
| Secured notes lien release | [Insufficient Information] — ICA not in the source set | Credit agreement collateral agent's release passes to notes, except on full non-enforcement discharge | [Insufficient Information] — ICA not in the source set | Permitted disposals, guarantor release, designation, immateriality | 66⅔% of holders needed for release of substantially all collateral by amendment | E22; E23 |
| Loan collateral release | [Insufficient Information] — collateral agreement not supplied | Each lender for all or substantially all collateral and material guarantors; otherwise Required Lenders or permitted transactions | [Insufficient Information] — ICA not in the source set | Covenant-permitted dispositions | Sacred rights protect against wholesale release | E11 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Secured noteholders | Share first-lien collateral pari with loans | Partial releases follow bank agent; enforcement control not established | High | Collateral can shrink without noteholder vote | Negative — Covenant Erosion | E23; E24 |
| Term lenders | Share first-lien collateral | Majority amendment without explicit anti-subordination right | Moderate | Non-consenting lenders exposed to priming | Negative — Covenant Erosion | E11 |
| Revolving lenders | Share first-lien collateral; own maintenance test | Test only above 40% usage | Moderate | Late trigger | Negative — Liquidity Deterioration | E01 |
| Subordinated noteholders | Recover after senior debt paid in full | Blockage and turnover | High | Junior payments stop in stress | Negative — Refinancing Risk | E26 |

### T4F.6 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Executed agreement and six joinders | Enforcement, standstill, turnover, sharing | First-lien control rows carry missing-document entries | Obtain the agreement |
| Purchase options | Any junior purchase option | Exit route for junior classes | Not assessed | Review intercreditor and subordination terms |
| Other secured indentures | 2028–2032 indentures | Release and voting differences | Assumed similar per annual report | Obtain indentures |

### Verification of intercreditor registers

| Register | Present | Columns complete | Minimum rows met | Figures traced or gap logged | Conclusions within evidence |
|---|---|---|---|---|---|
| T4F.1 | PASS | PASS | PASS | PASS | PASS |
| T4F.2 | PASS | PASS | PASS | PASS | PASS |
| T4F.3 | PASS | PASS | PASS | PASS | PASS |
| T4F.4 | PASS | PASS | PASS | PASS | PASS |
| T4F.5 | PASS | PASS | PASS | PASS | PASS |
| T4F.6 | PASS | PASS | PASS | PASS | PASS |

### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | d887611dex101.htm.jsonl | Credit agreement | 2024-09-19 | Executed | Legal formula | Governs ratio gates and baskets | E01–E17 |
| 1 | d887611dex41.htm.jsonl | Secured indenture | 2024-09-19 | Executed | Legal formula | Governs notes ratio tests | E18–E25 |
| 3 | Compliance certificate | Covenant schedule | Not supplied | [Insufficient Information] — compliance certificate not in the source set | Financial input and usage | Needed for tested ratios | E34 |
| 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report | 2024-11-07 | Filed | Usage (trigger amount, securitisation drawings) | Trigger and drawn amounts | E02 |
| 4 | Financial foundation (CP-1) | Accepted financial analysis | As of 2024-09-30 | Accepted | Financial input (non-covenant reference) | Debt, cash, revolver availability | E31 |

### T4C.3 Definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | Credit agreement definitions | Net income plus taxes, interest, non-cash charges, uncapped one-offs and transaction costs, earn-outs, dividend equivalents, cost savings up to 25% | Covenant EBITDA by component | Raises every ratio and grower capacity | Add-back inflation | Negative — Covenant Erosion | E12 |
| Consolidated Total Indebtedness | Credit agreement definitions | Principal of borrowed money, capital leases, notes; excludes undrawn letters of credit and securitisation debt | Principal by instrument | Principal reference USD 24,581 million versus carrying USD 24,880 million | Securitisation outside debt test | Neutral — Stable | E16; E31 |
| Consolidated Net Leverage Ratio | Credit agreement definitions | Total indebtedness less Unrestricted Cash over Consolidated EBITDA (financial-covenant EBITDA for the springing test) | Unrestricted cash; covenant EBITDA | Uncapped cash netting | Pre-payment cash flatters tests | Negative — Leverage Increase | E14; E16 |
| Consolidated Secured Net Debt Ratio | Credit agreement and 2033 indenture | Secured debt less Unrestricted Cash over Consolidated EBITDA | Secured principal; cash; EBITDA | Gates pari secured debt at 5.00x (bank) and 5.25x (notes) | Secured dilution | Negative — Leverage Increase | E10; E19 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture | Consolidated EBITDA over fixed charges | Indenture EBITDA and fixed charges | Gates notes ratio debt and payments at above 2.0x | Loose test | Negative — Leverage Increase | E20; E21 |
| Total Assets | Credit agreement definitions | Total consolidated assets of borrower and restricted subsidiaries | Restricted-group balance sheet | Sizes general investment basket | Large fungible basket | Negative — Covenant Erosion | E06 |
| Unrestricted Subsidiary | Credit agreement definitions | Only newly acquired or formed subsidiaries; no recourse debt | Designation certificate | Limits drop-down | Protective | Neutral — Stable | E14 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger | max-ratio | 40.00% | 7.36% | Revolver exposure / revolving commitments | 32.64% | Compliant | Exposure derived from commitment less availability after letters of credit | Maintenance test inactive below trigger | Neutral — Stable | E01; E02; E31 |
| Springing consolidated net leverage | max-ratio | 7.50x | Not supplied: financial-covenant EBITDA and tested ratio not disclosed | (Total indebtedness − unrestricted cash) / financial-covenant EBITDA | [Insufficient Information] — missing: current tested ratio and financial-covenant EBITDA | Not Calculable | 8.00x for four quarters after a material acquisition; tested only above trigger | Late tripwire | Insufficient Information | E01 |
| Incremental and junior debt net leverage | max-ratio | 7.25x | Not supplied: covenant ratio not disclosed | Pro forma net leverage | [Insufficient Information] — missing: current tested ratio and covenant EBITDA | Not Calculable | Incurrence only | Debt capacity | Insufficient Information | E03; E10 |
| Pari secured secured net leverage | max-ratio | 5.00x | Not supplied: covenant ratio not disclosed | Pro forma secured net leverage | [Insufficient Information] — missing: current tested ratio and covenant EBITDA | Not Calculable | Incurrence only | Pari dilution | Insufficient Information | E03; E10 |
| Unlimited restricted payments | max-ratio | 6.75x | Not supplied: covenant ratio not disclosed | Pro forma net leverage | [Insufficient Information] — missing: current tested ratio after October 2024 payment | Not Calculable | Also no default | Distribution capacity | Insufficient Information | E09 |
| Indenture ratio debt and payments | min-ratio | 2.0x | Not supplied: covenant ratio not disclosed | Indenture EBITDA / fixed charges | [Insufficient Information] — missing: current tested fixed-charge cover | Not Calculable | 2033 indenture only | Loose gate | Insufficient Information | E20; E21 |
| Indenture secured lien basket | max-ratio | 5.25x | Not supplied: covenant ratio not disclosed | Pro forma secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | 2033 indenture only | Secured dilution | Insufficient Information | E19 |
| Unlimited investments | max-ratio | 5.75x | Not supplied: covenant ratio not disclosed | Pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Also no revolving loans and cash at least USD 200 million | Leakage | Insufficient Information | E07 |
| Joint-venture investments | max-ratio | 7.00x | Not supplied: covenant ratio not disclosed | Pro forma net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Basket cap also applies | Leakage | Insufficient Information | E06 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Maintenance covenant headroom | Revolver usage trigger | 40% of commitments | Quarter-end exposure | Commitments USD 910 million; availability USD 843 million | USD 67 million derived | USD 364 million trigger | USD 297 million | Ready with Limitations | Low | Test springs only on heavy drawing | Neutral — Stable | E01; E02; E31 |
| Incremental facility capacity | Incremental commitments | Ratio Basket: 7.25x net and 5.00x secured net | No default; lender willingness | [Insufficient Information] — covenant EBITDA not supplied | USD 1,500 million Tranche L in 2024 | [Insufficient Information] — tested ratios not supplied | [Insufficient Information] — tested ratios not supplied | Formula Extracted Only | High | Pari secured dilution | Negative — Leverage Increase | E10; E30 |
| Debt incurrence capacity | Ratio debt (12) | Ratio Basket: same ratios; maturity and weighted-life limits | Loan-party obligors only | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — tested ratios not supplied | [Insufficient Information] — tested ratios not supplied | Formula Extracted Only | High | Uncapped by dollar amount | Negative — Leverage Increase | E03 |
| Debt incurrence capacity | General basket (13) | Grower Basket: greater of USD 250 million and 10% of covenant EBITDA | None stated | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | At least USD 250 million fixed floor | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Free-and-clear debt | Negative — Leverage Increase | E03 |
| Debt incurrence capacity | Foreign subsidiaries (14) | Grower Basket: greater of USD 450 million and 18% | Combined with subsidiary preferred stock | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | At least USD 450 million fixed floor | [Insufficient Information] — usage not supplied | Formula Extracted Only | High | Structurally senior debt | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Securitisation (18) | Grower Basket: greater of USD 725 million and 20% | Non-recourse | Facility commitment USD 650 million | USD 487.5 million at year-end; USD 650 million after October 2024 draw | At least USD 725 million fixed floor | At least USD 237.5 million at year-end; at least USD 75 million after October 2024 draw | Ready with Limitations | Low | Receivables leave collateral | Neutral — Stable | E04; E02 |
| Lien capacity | Notes lien (xxxi) | Ratio Basket: 5.25x secured net | Ratio debt only | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — tested ratio not supplied | [Insufficient Information] — tested ratio not supplied | Formula Extracted Only | High | Secured dilution beyond bank gate | Negative — Leverage Increase | E19 |
| Restricted payment capacity | Unlimited ratio basket | Ratio Basket: 6.75x net leverage | No default | [Insufficient Information] — covenant EBITDA not supplied | USD 4,348 million distribution September 2024; basket used not disclosed | [Insufficient Information] — tested ratio not supplied | [Insufficient Information] — tested ratio not supplied | Formula Extracted Only | High | Debt-funded distributions | Negative — Leverage Increase | E09; E32 |
| Restricted payment capacity | General RP basket (7) | General Basket: greater of USD 75 million and 3% | No default | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | At least USD 75 million fixed floor | [Insufficient Information] — usage not supplied | Formula Extracted Only | Low | Small leakage | Neutral — Stable | E09 |
| Restricted payment capacity | Indenture unlimited | Ratio Basket: fixed-charge cover above 2.0x | No default | [Insufficient Information] — indenture EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — tested ratio not supplied | [Insufficient Information] — tested ratio not supplied | Formula Extracted Only | High | Loose notes gate | Negative — Leverage Increase | E21 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries (1)(c) | Grower Basket: greater of USD 250 million and 10% | New subsidiaries only | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | At least USD 250 million fixed floor | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Bounded drop-down | Neutral — Stable | E05; E14 |
| Investment capacity | General investments (10) | Grower Basket: greater of USD 500 million and 25% of Total Assets | None stated | Reference group total assets USD 25,586 million | [Insufficient Information] — usage not supplied | Reference USD 6,396.50 million (group assets; provisional) | [Insufficient Information] — usage not supplied | Provisional | High | Large fungible leakage | Negative — Covenant Erosion | E06; E31 |
| Investment capacity | Joint ventures (11) | Grower Basket: greater of USD 1,000 million and 40%, at 7.00x | No default | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | At least USD 1,000 million fixed floor if ratio met | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Value outside guarantors | Negative — Covenant Erosion | E06 |
| Investment capacity | Unlimited investments (20) | Ratio Basket: 5.75x | No revolving loans; cash at least USD 200 million | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — tested ratio not supplied | [Insufficient Information] — tested ratio not supplied | Formula Extracted Only | High | Uncapped leakage at lower leverage | Negative — Covenant Erosion | E07 |
| EBITDA add-back capacity | Cost savings | 25% of covenant EBITDA | Actions within 24 months | [Insufficient Information] — covenant EBITDA not supplied | [Insufficient Information] — usage not supplied | [Insufficient Information] — base not supplied | [Insufficient Information] — base not supplied | Formula Extracted Only | High | Ratio inflation | Negative — Covenant Erosion | E12 |
| Guarantor / collateral release capacity | Bank-led release | Each lender for all collateral; otherwise permitted transactions | Permitted dispositions | Not applicable: no amount test | [Insufficient Information] — release history not supplied | [Insufficient Information] — collateral value not supplied | [Insufficient Information] — collateral value not supplied | Formula Extracted Only | Moderate | Notes collateral shrinks with bank releases | Negative — Covenant Erosion | E11; E23 |

Baskets are not summed: they overlap, can be reclassified and depend on covenant EBITDA that is not disclosed.

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental | 5.00x secured net and 7.25x net | Formula Extracted Only | Same-rank claims added to shared collateral | Higher fixed charges | Dilutes first lien | First-lien paper exposed to new supply | E10 |
| Notes lien basket | 5.25x secured net | Formula Extracted Only | Wider than bank gate once loans repaid | Higher | Dilutes first lien | Notes protections weaker than bank gate | E19 |
| Junior or unsecured ratio debt | 7.25x net | Formula Extracted Only | Layers debt below first lien | Higher | Dilutes subordinated notes; first lien neutral | Pressure on subordinated notes | E03 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% | Formula Extracted Only | Structurally senior | Neutral to higher | Primes loans and notes on foreign assets | All guaranteed paper | E04 |
| Majority-amendment priming | No explicit anti-subordination sacred right in clause reviewed | Theoretical | Possible uptier of consenting lenders | Neutral | Non-consenting lenders could be primed | Favours notes over loans | E11 |
| Securitisation | Greater of USD 725 million and 20% | Ready with Limitations | Receivables outside collateral | Neutral | Reduces first-lien collateral | Minor | E04 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Shareholder distributions | Unlimited at 6.75x; indenture at above 2.0x | Ratio Basket | USD 4,348 million used September 2024; remaining [Insufficient Information] — tested ratio not supplied | Cash leaves restricted group | High | Negative — Leverage Increase | E09; E21; E32 |
| Dividend within 60 days of declaration | Payment allowed if permitted at declaration | Timing exception | [Insufficient Information] — declaration-date test not disclosed | Payment can follow a later deterioration | Moderate | Negative — Liquidity Deterioration | E08 |
| Investments in foreign non-guarantors | Restricted-subsidiary investments uncapped | Uncapped | [Insufficient Information] — usage not supplied | Value moves outside guarantees | High | Negative — Covenant Erosion | E05 |
| General investments | Greater of USD 500 million and 25% of Total Assets | Grower Basket | Reference USD 6,396.50 million; usage not supplied | Fungible route | High | Negative — Covenant Erosion | E06 |
| Unrestricted subsidiaries | New subsidiaries only; cap greater of USD 250 million and 10% | Grower Basket | [Insufficient Information] — usage not supplied | Bounded | Moderate | Neutral — Stable | E05; E14 |
| Asset sales | Fair-value condition; automatic notes lien release | Asset sale covenant | [Insufficient Information] — reinvestment terms not reviewed | Collateral released on sale | Moderate | Negative — Covenant Erosion | E23 |

### T4C.8 EBITDA add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Consolidated EBITDA clause (m) | 25% of EBITDA; actions within 24 months; net of realised benefits | Formula Extracted Only | Adds unrealised savings to every ratio | PD and LGD up through larger permitted debt | E12 |
| Extraordinary, integration, restructuring costs | Clause (d) | Uncapped | Formula Extracted Only | Recurring acquisition costs excluded; earnings-quality review rejected USD 345 million of similar issuer add-backs | Capacity above supportable earnings | E12; E33 |
| Transaction and financing costs | Clause (e) | Uncapped; successful or not | Formula Extracted Only | Refinancing and recap costs excluded | Same | E12 |
| Dividend-equivalent payments | Clause (k) | Uncapped | Formula Extracted Only | Distribution-linked compensation added back | Recap costs raise capacity for the next recap | E12 |
| Earn-outs and deferred purchase price | Clause (i) | Uncapped | Formula Extracted Only | Acquisition costs excluded | Capacity for acquisitive growth | E12 |
| Financial-covenant EBITDA | Separate definition | [Insufficient Information] — definition not reviewed | Insufficient Information | Unknown divergence for springing test | Monitoring of maintenance test impaired | E01 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Demonstrated debt-funded distribution | USD 4,348 million recap with USD 3,000 million secured debt | Repeat extraction | High | High | Not routed: relevance stated in Creditor Risk | E32; E30 |
| Basket reclassification | Debt and payments may be divided among categories | Capacity stacking | Moderate | High | Not routed: relevance stated in Creditor Risk | E05; E21 |
| Bank-led collateral release | Notes liens follow bank agent | Notes collateral leakage | High | Medium | Not routed: relevance stated in Creditor Risk | E23 |
| Uncapped restricted-subsidiary investments | Includes foreign non-guarantors | Structural leakage | High | Medium | Not routed: relevance stated in Creditor Risk | E05 |
| Narrow unrestricted designation | New subsidiaries only | Protective | Low | High | Not routed: relevance stated in Creditor Risk | E14 |
| Cost-savings add-back | Up to 25% of EBITDA | Ratio inflation | High | High | Not routed: relevance stated in Creditor Risk | E12 |

### T4C.11 Capacity risk prioritisation matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured incremental at 5.00x | High | Formula Only | Secured dilution funding distributions | Higher | Higher for first lien | Track incremental agreements and joinders | E10; E30 |
| 2 | Unlimited distributions at 6.75x and above 2.0x | High | Formula Only | Cash extraction | Higher | Higher | Track declarations and certificates | E09; E21 |
| 3 | Cost-savings and uncapped add-backs | High | Formula Only | Ratio inflation | Higher | Higher | Request covenant EBITDA bridge | E12 |
| 4 | Uncapped investment in foreign non-guarantors | High | Formula Only | Structural leakage | Neutral | Higher | Track guarantor share | E05 |
| 5 | Bank-led collateral release | Moderate | Formula Only | Notes collateral leakage | Neutral | Higher for notes | Track release notices | E23 |
| 6 | Springing maintenance trigger | Low | Moderate | Late tripwire | Higher in stress | Neutral | Track revolver usage | E01; E02 |

### T4C.12 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Covenant EBITDA | Consolidated EBITDA and financial-covenant EBITDA by component | Every ratio and grower basket | All ratio headroom not calculable | Obtain compliance certificate with bridge |
| Tested ratios | Net, secured net and fixed-charge ratios after October 2024 payment | Distribution and incremental room | Nearest pressure point unquantified | Obtain quarterly compliance certificates |
| Basket usage | Usage tracker for debt, payments and investments | Remaining capacity | Remaining capacity not calculable | Obtain usage tracker |
| Revolver exposure split | Loans versus cash-collateralised letters of credit | Trigger measurement | Usage derived, not tested | Obtain revolver utilisation detail |
| Total Assets | Restricted-group total assets | General investment basket | Reference uses group assets | Obtain restricted-group balance sheet |
| Most-favoured-nation terms | Incremental pricing protection | Repricing risk | Not assessed | Review incremental clause in full |

### Definition conflict register

| Item | Covenant definition | Analytical figure | Covenant-basis reference | Difference | Treatment | Evidence ID |
|---|---|---|---|---|---|---|
| Debt | Principal; excludes securitisation and undrawn letters of credit | Carrying debt USD 24,880 million | Principal reference USD 24,581 million | USD −299 million | Covenant tests use principal; carrying debt retained for analysis; government advances classification not established | E16; E31 |
| Securitisation | Excluded from Consolidated Total Indebtedness | Carrying USD 486 million in debt | Excluded | Full balance | Outside covenant debt; inside analytical debt | E16; E31 |
| EBITDA | Consolidated EBITDA with cost savings and uncapped add-backs | Reported EBITDA USD 3,813 million; EBITDA As Defined USD 4,173 million | Not supplied: covenant EBITDA not disclosed | Not calculable: covenant figure missing | No substitution of issuer EBITDA for covenant EBITDA | E12; E31; E33 |
| Customer advances | Outside covenant debt | Contract liabilities USD 177 million | Excluded | Full balance | Non-debt funding float; no capacity consumed | E16; E31 |

### Material claim lineage

| Claim | Material conclusion | Strongest lineage | Evidence ID |
|---|---|---|---|
| L1 | Maintenance covenant is revolver-only, springing above 40% usage at 7.50x | Directly Sourced | E01; E02 |
| L2 | Derived revolver usage is 7.36% and trigger headroom USD 297 million | Calculated | E31 |
| L3 | Unlimited payments at 6.75x under the credit agreement | Directly Sourced | E09 |
| L4 | Unlimited payments and ratio debt at above 2.0x under the 2033 indenture | Directly Sourced | E20; E21 |
| L5 | Incremental requires 7.25x net and 5.00x secured net | Directly Sourced | E10 |
| L6 | Notes lien basket to 5.25x | Directly Sourced | E19 |
| L7 | EBITDA definition includes 25% cost savings and uncapped add-backs | Directly Sourced | E12 |
| L8 | Unrestricted designation limited to new subsidiaries | Directly Sourced | E14 |
| L9 | Notes liens follow bank agent releases | Directly Sourced | E23 |
| L10 | Subordinated notes 179-day blockage | Directly Sourced | E26 |
| L11 | Loan amendment clause lacks explicit anti-subordination right | Analyst Inference | E11 |
| L12 | September 2024 recap demonstrates the ratio routes | Analyst Inference | E32; E30 |
| L13 | Covenant principal reference differs from carrying debt by USD −299 million | Calculated | E16; E31 |
| L14 | Overall aggressiveness 4 of 5 | Analyst Inference | E09; E10; E12 |
| L15 | Covenant headroom and capacity | Insufficient Information | E34 |
| L16 | First-lien enforcement control | Insufficient Information | E18 |

## Calculations

All amounts are USD millions at 2024-09-30 unless stated; inputs come from the accepted financial analysis and the documents shown. No covenant ratio is calculated because covenant EBITDA is not disclosed.

| ID | Operation | Inputs and period | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | Difference | Revolver commitment 910 less availability after letters of credit 843, 2024-09-30 | 67 | USD m | Financial foundation (CP-1) |
| K02 | Ratio | 67 / 910 | 0.073626373626373626373626373626373626374; displayed 7.36% | Fraction; % | Financial foundation (CP-1) |
| K03 | Product | 910 × 0.40 trigger | 364.00; agrees with the USD 364 million stated in the annual report | USD m | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K04 | Difference | 364 − 67 | 297 | USD m | Calculation K01; calculation K03 |
| K05 | Difference | 40.00 − 7.36 displayed percentages | 32.64 | Percentage points | Calculation K02 |
| K06 | Difference | Securitisation basket fixed floor 725 less drawn 487.5 at year-end | 237.5 | USD m | d887611dex101.htm.jsonl, page 60; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K07 | Difference | 725 less 650 drawn after the October 2024 draw (subsequent event) | 75 | USD m | d887611dex101.htm.jsonl, page 60; Financial foundation (CP-1) |
| K08 | Sum | Long-term principal ladder 24319 plus finance-lease present value 262 (covenant principal reference, securitisation excluded) | 24581 | USD m | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 28 |
| K09 | Difference | 24581 − carrying debt 24880 | −299 | USD m | Financial foundation (CP-1) |
| K10 | Product | 0.25 × group total assets 25586 (reference for restricted-group Total Assets; provisional) | 6396.50 | USD m | d887611dex101.htm.jsonl, page 62; Financial foundation (CP-1) |
| K11 | Sum | Term loans I 1871 + J 3632 + K 1699 + L 1500 | 8702 | USD m | Financial foundation (CP-1) |
| K12 | Sum | Secured notes 2100 + 2750 + 1450 + 1000 + 2200 + 1500 | 11000 | USD m | Financial foundation (CP-1) |
| K13 | Sum | Subordinated notes 2650 + 1200 + 750 | 4600 | USD m | Financial foundation (CP-1) |
| K14 | Sum | Funded first-lien principal 8702 + 11000 (undrawn revolver excluded) | 19702 | USD m | Calculation K11; calculation K12 |
| K15 | Ratio | 11000 / 19702 | 0.55831895239062024159983757994112272866; displayed 55.83% | Fraction; % | Calculation K12; calculation K14 |

The trigger usage treats all commitment not available after letters of credit as exposure; if some letters of credit are cash-collateralised at 103% or more they fall outside the test and usage would be lower.

## Gaps

| Gap | What is missing | Why it matters | Conclusion restricted | Source |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and its six joinders | Allocates enforcement, standstill, turnover and sharing among loans and notes | Enforcement-control and standstill conclusions for first-lien classes | d887611dex41.htm.jsonl, page 30 |
| Collateral and guarantor documents | Guarantee and collateral agreement, security schedules, guarantor exhibit | Defines excluded assets and the guarantor list | Collateral matrix and stranded-value sizing | d887611dex41.htm.jsonl, page 135; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Covenant measurements | Compliance certificate, covenant EBITDA, financial-covenant EBITDA, basket usage | Needed for any headroom or capacity figure | All ratio headroom and grower-basket capacity | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Other indentures | 2028 to 2032 secured and 2029 subordinated indentures | Release and ratio terms may differ | Extension of 2033 and 2027 findings to other series | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Unreviewed credit-agreement clauses | Incremental pricing protection, cross-default, asset-sale reinvestment, financial-covenant EBITDA | Repricing, contagion and reinvestment leakage | Debt-capacity and default findings | d887611dex101.htm.jsonl, page 146 |
| Refinancing and liability-management assessment | Maturity-driven exchange analysis | Links priming routes to a trigger date | Priming routes remain theoretical | Source readiness (CP-0) |
| Comparative source | Market-norm or covenant-review report | Relative assessment | Aggressiveness score is absolute | Source readiness (CP-0) |

A dividend declared while the distribution ratio is met may be paid within 60 days of declaration; no fixed deadline is recorded because the declaration-date test result is not disclosed.

## Next module
The orchestrator selects the next module.
