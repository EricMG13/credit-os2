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
Legal and covenant review of TransDigm Group Incorporated as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers the credit agreement as annexed to the September 2024 amendment, the 2033 secured notes indenture and the 2027 subordinated notes indenture, read for covenant meaning, capacity and headroom, restricted-group and guarantee structure, and intercreditor control.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date stated in the report | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Springing revolver covenant description, revolver usage, guarantor scope and obligor-group summary, facility terms, restrictive-covenant summary and compliance statement |
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement, with the annexed amended credit agreement of TransDigm Inc. | 2024-09-19, agreement date; filing date not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling loan text: definitions, EBITDA add-backs, debt, lien-condition, investment, restricted-payment, unrestricted-subsidiary, guarantor/collateral, MFN, financial covenant, events of default and amendment clauses |
| d887611dex41.htm.jsonl | Execution-version indenture for the 6.000% senior secured notes due 2033 | 2024-09-19, dated as of; filing date not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note restricted payments, ratio debt, asset sales, amendment thresholds, guarantor release, collateral agent and first-lien intercreditor references |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date; filing date not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, payment blockage and turnover mechanics |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source set, temporal boundary and legal-coverage gaps |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt, cash, EBITDA As Defined, net cash interest, debt stack and post-balance-sheet adjustments |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Entity identity and jurisdiction, distribution and financing history |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Challenge to issuer add-backs used to judge covenant EBITDA inflation |

The September 2024 annual report is used retrospectively; the legal exhibits are executed versions and rank highest for provision-level analysis. The First Lien Intercreditor Agreement, the Guarantee and Collateral Agreement, the other note indentures and any compliance certificate are not in the source set.

## Findings

### Bottom line
Covenant protection for TransDigm's term lenders and noteholders is thin: neither has a maintenance test, and both documents allow unlimited shareholder distributions inside ratio limits, so creditor protection rests on earnings growth and ratio headroom rather than covenant defaults. We score the package 4 out of 5, aggressive, on a provisional basis. The October 2024 distribution of USD 4,348 million already used much of the room: on an indicative basis using EBITDA As Defined, net leverage after the payment is 5.50x against the 6.75x distribution test, and secured net leverage is 4.22x against the 5.00x test for new pari secured debt. Lenders keep unanimous-consent protection over pro rata sharing and over releasing all or substantially all collateral or material guarantors, and new unrestricted subsidiaries are hard to create, which limits drop-down risk. Enforcement control among first-lien creditors and exact basket capacity are not established because the intercreditor agreement, covenant EBITDA and basket usage are not in the documents.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, pages 75–76; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, pages 204–205; Financial foundation (CP-1); calculation K04; calculation K07

### Key findings
- **Maintenance protection is revolver-only and dormant, so default arrives late.** The net leverage test of 7.50x, or 8.00x for four quarters after a material acquisition, applies only when revolving exposure exceeds 40% of the USD 910 million commitments, which is USD 364 million. At year-end exposure was USD 67 million of letters of credit, 7.36% utilisation and USD 297 million below the trigger, and only the revolving lenders can amend or waive the test. Term lenders and noteholders therefore have no covenant tripwire; the probability-of-default channel runs through payment capacity and refinancing, not early acceleration.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01; calculation K03
- **Distribution capacity is unlimited below the credit agreement's 6.75x net leverage test, and it has been used.** The credit agreement permits any restricted payment with no default and pro forma net leverage at or below 6.75x. The 2033 secured notes are looser still: any restricted payment is allowed while fixed charge coverage exceeds 2.0x, so the loan test is the binding constraint. On the indicative proxy, headroom after the October 2024 payment is 1.25x. Each turn of EBITDA growth or add-back recognition reopens room for another debt-funded distribution, which raises loss given default for every class without any covenant event.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 75–76; Business & governance (CP-1A); calculation K04; calculation K09
- **New debt is ratio-limited, not basket-limited, and pari secured room is the tightest ratio.** New debt secured equally with the loans needs secured net leverage at or below 5.00x; junior-lien, unsecured or subordinated debt needs net leverage at or below 7.25x. Grower baskets add a general basket of the greater of USD 250 million and 10% of EBITDA, foreign-subsidiary debt of the greater of USD 450 million and 18%, and securitization debt of the greater of USD 725 million and 20%. The indicative secured headroom of 0.78x after the October payment is the nearest ratio constraint. Term-loan MFN protection is 50 bp with an 18-month sunset and an acquisition carve-out, so price protection for existing term lenders is short-lived.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, page 144; calculation K07; calculation K10
- **The EBITDA definition expands every ratio and grower basket.** Covenant EBITDA adds back uncapped restructuring, integration, transaction, refinancing and non-cash compensation costs, and even dividend-equivalent payments, while projected cost savings within 24 months are capped at 25% of covenant EBITDA. On EBITDA As Defined of USD 4,173 million, that cap alone is USD 1,043.25 million. The earnings-quality analysis already rejects the recurring acquisition, compensation and refinancing add-backs, so covenant ratios will look stronger than credit-quality earnings support.
Basis: d887611dex101.htm.jsonl, pages 24–26; Earnings quality (CP-1D); calculation K13
- **The worst structural leakage route is value moving to non-guarantor restricted subsidiaries, not unrestricted-subsidiary drop-downs.** Only newly formed or acquired subsidiaries can be designated unrestricted, and investment in them is capped at the greater of USD 250 million and 10% of EBITDA. Investment in any restricted subsidiary, including foreign non-guarantors, is uncapped, only 65% of first-tier foreign voting stock is pledged, and the obligor group generated USD 6,294 million of USD 7,940 million consolidated sales, 79.27%. Value in the non-guarantor perimeter sits behind its own creditors, including up to USD 400 million of non-guarantor ratio debt under the 2033 notes.
Basis: d887611dex101.htm.jsonl, pages 61 and 81; d887611dex101.htm.jsonl, pages 173–174; d887611dex41.htm.jsonl, page 79; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K14
- **Lender-control protection is better in the loans than in the 2033 notes.** The credit agreement requires every lender to change pro rata sharing, voting thresholds, or to release material guarantors or all or substantially all collateral, and non-pro-rata prepayment is permitted only through offers to all lenders of a class. Holders of a majority of the 2033 notes can amend the security documents and the intercreditor agreement, and collateral release is not a unanimous-consent item, although a ranking change needs each affected holder. Lien or payment subordination is not on the credit agreement's unanimous-consent list in the clauses reviewed, so uptier exposure is not ruled out.
Basis: d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 115–117

### Contrary evidence and what would change the view
The strongest evidence against an aggressive reading is structural. Unrestricted-subsidiary designation is confined to newly formed or acquired subsidiaries that hold no stock in or liens on other group entities, which closes the classic intellectual-property drop-down. The credit agreement protects pro rata sharing, release of all or substantially all collateral and release of material guarantors with every lender's consent. The 2033 notes protect ranking with each affected holder's consent. Subordinated noteholders face a payment blockage capped at 179 days in any 360 days. Ratio headroom also exists only because EBITDA grew, and the issuer reports compliance with all covenants. The view would move toward market-standard if the First Lien Intercreditor Agreement shows pro rata enforcement-proceeds sharing and consent rights for each secured class, if a compliance certificate shows covenant EBITDA close to reported EBITDA, or if the issuer subordinates distributions to debt reduction. It would move toward highly creditor-adverse if the intercreditor agreement lets the loan agent alone release shared collateral, or if a further distribution takes net leverage close to 6.75x.
Basis: d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, page 117; d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- Covenant EBITDA, consolidated total indebtedness and unrestricted cash are not disclosed, so every ratio headroom in this review is an indicative proxy on EBITDA As Defined. Because covenant add-backs are broader than the issuer's adjusted measure, true distribution and debt capacity is probably larger, which strengthens rather than weakens the aggressive conclusion but leaves exact headroom not established.
Basis: d887611dex101.htm.jsonl, pages 24–27; Financial foundation (CP-1)
- The First Lien Intercreditor Agreement and its joinders are referenced but not supplied, so who controls enforcement, any standstill among first-lien classes, turnover and release authority over shared collateral are not established. The intercreditor conclusions are therefore limited to payment ranking and subordinated-note blockage, and the first-lien recovery-control severity cannot be scored.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 132
- No compliance certificate or basket-usage record is supplied, so remaining capacity in the fixed and grower baskets cannot be calculated and total incurrence and leakage capacity cannot be summed; the capacity register shows basket sizes, not availability.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62
- Only the 2033 secured and 2027 subordinated indentures were read. The annual report says the other indentures contain substantially similar covenants, but note-level conclusions on restricted payments, ratio debt and amendment thresholds are established only for those two series.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61
- No refinancing and liability-management analysis was supplied and no market-norm or third-party covenant review exists in the documents, so the uptier and non-pro-rata assessment is a reading of permissions only, and the aggressiveness score is absolute rather than relative to comparable packages.

### Creditor implication
Overall, TransDigm Group Incorporated presents an aggressive covenant package based on covenant-lite term loans and notes, ratio-unlimited distributions at 6.75x net leverage under the loans and at 2.0x fixed charge coverage under the 2033 notes, and broad EBITDA add-backs. The main creditor protections are unanimous-lender consent for pro rata sharing and for releasing material guarantors or all or substantially all collateral, the restriction of unrestricted-subsidiary designation to newly formed or acquired subsidiaries, and payment-rank protection in the 2033 notes. The main covenant weaknesses are the absence of any maintenance test for term lenders and noteholders, distribution capacity that grows with add-back-inflated EBITDA, uncapped investment into non-guarantor restricted subsidiaries and majority-holder control over the 2033 notes' security documents. The primary PD risk is a further debt-funded distribution taking leverage toward the 6.75x and 7.25x ratio limits while aftermarket earnings soften, and the primary LGD risk is dilution of first-lien recovery by additional pari secured debt up to 5.00x secured net leverage and by value held in non-guarantor subsidiaries. For security selection, the most important legal consideration is that the secured notes and loans share collateral pari passu while the subordinated notes sit behind all of it and can be blocked for up to 179 days. Further analysis would require the First Lien Intercreditor Agreement, the Guarantee and Collateral Agreement, a covenant compliance certificate and basket-usage records.
Basis: d887611dex101.htm.jsonl, pages 59, 81, 181 and 204–205; d887611dex41.htm.jsonl, pages 75–76 and 115–117; d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

Overall, TransDigm Group Incorporated has limited covenant-capacity visibility. The main capacity concern is the ratio-based distribution permission, because it lets cash or new debt leave the restricted group whenever pro forma net leverage is at or below 6.75x, and that weakens recovery for every class while adding refinancing pressure. Exact headroom is not supported; only proxies on EBITDA As Defined are available. Further analysis requires the covenant EBITDA bridge, unrestricted cash and basket usage. The most important documented headroom point is that the revolver test is not active, with USD 297 million of exposure room before it springs. The most important debt point is the 0.78x indicative room under the 5.00x pari secured test. The most important leakage point is the 1.25x indicative room under the 6.75x distribution test. The most important definition point is the uncapped add-backs plus a 25% cost-savings cap.
Basis: calculation K03; calculation K07; calculation K09; d887611dex101.htm.jsonl, pages 24–27

The nearest pressure point is the credit agreement's 5.00x secured net leverage condition for new pari secured debt. It sits at an indicative 4.22x after the October 2024 payment, assuming covenant EBITDA equals EBITDA As Defined and all cash is unrestricted. Any further secured recapitalisation or secured acquisition financing would consume it first, after which new money must be junior or unsecured and tested at 7.25x, which raises funding cost and shifts new claims below the existing first lien. The monitoring signal is secured debt issuance or incremental term-loan joinders relative to trailing EBITDA As Defined. Tightening the view needs the compliance certificate's secured net debt ratio and the definition of consolidated total indebtedness.
Basis: d887611dex101.htm.jsonl, pages 27 and 59; calculation K06; calculation K07

The structural view is weighted to the open route into non-guarantor restricted subsidiaries. The credit agreement lets the borrower and restricted subsidiaries invest without cap in any restricted subsidiary, and the 2033 notes allow up to USD 400 million of non-guarantor ratio debt plus a foreign-subsidiary debt basket in the loans. Obligor-group sales are USD 6,294 million against USD 7,940 million consolidated, so non-guarantor sales are USD 1,646 million, and the annual report states both note classes are structurally subordinated to non-guarantor liabilities. Entity-level assets, EBITDA and debt outside the obligor group are not disclosed, so stranded value cannot be sized.
Basis: d887611dex101.htm.jsonl, pages 60–61; d887611dex41.htm.jsonl, page 79; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K14

The intercreditor view is incomplete by construction. The secured notes, term loans and revolver rank equally in payment and share collateral through a first-lien intercreditor agreement under which an applicable authorized representative binds all first-lien holders, but the identity of that representative and its release powers are not in the documents. The subordinated notes are contractually subordinated, must turn over distributions received in breach of subordination, and can be blocked from payment for up to 179 days in any 360 days at the request of designated senior debt. An unexamined intercreditor agreement is not treated as a benign one.
Basis: d887611dex41.htm.jsonl, pages 30 and 132; d826058dex41.htm.jsonl, pages 106–108; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58

The downside path starts with a further distribution or secured acquisition financing while commercial aftermarket demand slows. The first break is that covenant EBITDA stops growing while debt has been reset close to the 6.75x and 5.00x incurrence limits, closing access to new pari secured money. Liquidity then leans on the revolver; once revolving exposure exceeds USD 364 million the 7.50x test springs, but only revolving lenders can act on it. Term lenders and noteholders have no covenant trigger and see stress only through refinancing of the receivables facility and the term-loan and note maturities. Observable triggers are revolver drawings above USD 364 million, new secured issuance, further special dividends and any amendment to the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, pages 59, 181 and 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Financial foundation (CP-1)

Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided.

Legal and covenant review completed with limitations. Covenant aggressiveness: 4 out of 5, provisional. Key gaps: the First Lien Intercreditor Agreement, the Guarantee and Collateral Agreement, a compliance certificate with covenant EBITDA, basket usage and the other note indentures. Covenant capacity completed with limitations; the same gaps apply. The restricted-group and guarantee map and the intercreditor analysis are completed with limitations, chiefly the missing intercreditor and security documents.

### Capital structure
The table shows how the year-end carrying debt of USD 24,880 million divides between the shared first lien, the subordinated notes and unranked obligations, and which documents in the review govern each layer.

| Layer | Carrying value, USD million | Rank and security | Governing document reviewed | Covenant relevance | Source |
|---|---|---|---|---|---|
| Revolving credit facility, USD 910 million commitment | Not supplied: no drawn loans; USD 67 million letters of credit; USD 843 million available | Senior secured, first lien, maturity 2029-02-27 | Credit agreement as annexed to Amendment No. 17 | Only maintenance test: 7.50x net leverage when exposure exceeds 40% of commitments | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 188 |
| Term loans I, J, K and L, principal USD 8,702 million | 8642 | Senior secured, first lien, pari passu with secured notes | Credit agreement as annexed to Amendment No. 17 | No maintenance test; MFN 50 bp with 18-month sunset | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| Secured notes due 2028 to 2033, principal USD 11,000 million | 10892 | Senior secured, equal payment rank with loans; shared collateral under First Lien Intercreditor Agreement | 2033 secured notes indenture only | Restricted payments unlimited while fixed charge coverage exceeds 2.0x | d887611dex41.htm.jsonl, pages 30 and 75–76; Financial foundation (CP-1) |
| Senior subordinated notes due 2027 and 2029, principal USD 4,600 million | 4581 | Unsecured, contractually subordinated to senior debt | 2027 subordinated notes indenture only | Payment blockage up to 179 days in any 360 days | d826058dex41.htm.jsonl, pages 106–107; Financial foundation (CP-1) |
| Trade receivable securitization | 486 | Securitization entity debt; legal rank not established | Not in the source set | Permitted up to greater of USD 725 million and 20% of EBITDA | d887611dex101.htm.jsonl, page 60; Financial foundation (CP-1) |
| Finance leases and government refundable advances | 279 | Legal rank not established | Not in the source set | Inside carrying debt; covenant treatment not established | Financial foundation (CP-1) |
| Total carrying debt at 2024-09-30 | 24880 | Pro forma net debt after the October 2024 dividend payment is USD 22,967 million against year-end USD 18,619 million | Not applicable: aggregate | Covenant indebtedness definition not reviewed | Financial foundation (CP-1); calculation K15 |

### Covenant tests and headroom
Only the revolver trigger can be settled from disclosed figures; every ratio test is shown on an indicative proxy after the October 2024 payment, using EBITDA As Defined in place of undisclosed covenant EBITDA.

| Test | Threshold | Position | Indicative headroom | Creditor consequence | Source |
|---|---|---|---|---|---|
| Revolver springing trigger: exposure to commitments | 40% | 7.36% at 2024-09-30 | 32.64 percentage points, USD 297 million | Net leverage test inactive | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01 |
| Revolver net leverage test | 7.50x | Not supplied: tested ratio not disclosed; proxy 5.50x | 2.00x on proxy | Only revolving lenders protected | d887611dex101.htm.jsonl, page 188; calculation K08 |
| Ratio-unlimited restricted payments, credit agreement | 6.75x net leverage | Proxy 5.50x | 1.25x | Further distributions remain permitted | d887611dex101.htm.jsonl, page 181; calculation K09 |
| Pari secured debt condition | 5.00x secured net leverage | Proxy 4.22x | 0.78x | Nearest pressure point | d887611dex101.htm.jsonl, page 59; calculation K10 |
| Junior, unsecured and subordinated debt condition | 7.25x net leverage | Proxy 5.50x | 1.75x | Junior layering room remains | d887611dex101.htm.jsonl, pages 59–60; calculation K11 |
| 2033 notes ratio debt and restricted payments | Fixed charge coverage above 2.0x | Not supplied: covenant ratio not disclosed; proxy 3.60x | 1.60x on proxy | Notes covenant not binding before the loan test | d887611dex41.htm.jsonl, pages 75–79; calculation K12 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver springing trigger: aggregate revolving exposure to commitments | 40 | 7.36 | 32.64 percentage points | Passes at or below | % | Credit agreement financial covenant applies only if exposure exceeds 40%; exposure taken as USD 67 million letters of credit, cash collateralisation not stated; annual report page 62 |
| Revolver consolidated net leverage ratio | 7.50 | Not supplied: covenant ratio and its inputs not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | 8.00x for four quarters after a material acquisition; test inactive at year-end because trigger not met; indicative proxy only in the headroom register |
| Ratio-unlimited restricted payments, credit agreement | 6.75 | Not supplied: covenant ratio and its inputs not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Pro forma incurrence-style condition, not a maintenance test; proxy 5.50x after the October 2024 payment |
| Pari secured debt condition | 5.00 | Not supplied: covenant ratio and its inputs not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Consolidated secured net debt ratio at incurrence; proxy 4.22x after the October 2024 payment |
| Junior, unsecured and subordinated debt condition | 7.25 | Not supplied: covenant ratio and its inputs not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Consolidated net leverage ratio at incurrence; proxy 5.50x |
| 2033 notes ratio debt and restricted payments | 2.00 | Not supplied: covenant ratio and its inputs not disclosed | Not supplied: tested ratio not disclosed | Passes above | x | Fixed charge coverage must be greater than 2.0x; proxy 3.60x on EBITDA As Defined and net cash interest |

Only the revolver trigger is a settled test; the ratio rows show thresholds without disclosed tested values, and none of the rows is a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement dated | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement, proceeds sharing and release among first-lien classes; not in the source set |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement executed | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets the covenant text now in force; also starts the MFN sunset clock for Tranches I and K from its effective date |
| 2024-09-19 | day | 2024-09-19 | Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Brings the 2033 secured notes into the shared first-lien collateral; dividend financing itself is recorded under business and governance |
| 2024-09-19 | day | 2024-09-19 | 2033 secured notes indenture executed | Historical — Indenture dated as of September 19, 2024 | d887611dex41.htm.jsonl, page 1 | Adds a pari secured class with majority-holder amendment of security documents and fixed-charge-coverage restricted-payment test |
| 2027-09-15 | day | 2024-09-19 | 2033 secured notes Initial Redemption Date | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Call flexibility for refinancing or liability management begins |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity | Scheduled — maturity date of the revolving credit facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance covenant falls away with the revolver unless replaced |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report as summarised in business and governance; both Delaware corporations per the September 2024 amendment |
| TransDigm Group Incorporated | Guarantees as Holdings on a senior secured basis | Guarantee | Secured notes and credit facilities | 2033 secured notes indenture and annual report guarantor information; United States issuers; governing law not reviewed |
| TransDigm Group Incorporated | Guarantees on a senior subordinated unsecured basis | Guarantee | Senior subordinated notes | Annual report guarantor information; 2027 subordinated notes indenture; governing law not reviewed |
| TransDigm UK | Guarantees on a senior secured basis | Guarantee | Secured notes and credit facilities | Annual report states 2029 to 2033 secured note guarantors are the same as 2028 notes, which include TransDigm UK; UK collateral agent appointed in the 2033 indenture; entity jurisdiction not stated in pages read |
| Domestic Restricted Subsidiaries | Guarantee on a senior secured basis | Guarantee | Secured notes and credit facilities | Annual report guarantor information; credit agreement joinder duty for domestic non-excluded subsidiaries; United States |
| Domestic Restricted Subsidiaries | Guarantee on a senior subordinated unsecured basis | Guarantee | Senior subordinated notes | Annual report guarantor information; United States |
| Loan Parties | Pledge 100% of domestic subsidiary equity and 65% of first-tier foreign voting stock plus other Collateral | Security | Credit Agreement Collateral Agent | Credit agreement further-assurances clause; collateral shared with secured notes through the First Lien Intercreditor Agreement; security agreement not reviewed |
| Non-guarantor subsidiaries | Liabilities rank ahead of note claims on their assets | Structural claim | Secured notes and credit facilities | Annual report states the secured notes are structurally subordinated to non-guarantor liabilities |
| Non-guarantor subsidiaries | Liabilities rank ahead of note claims on their assets | Structural claim | Senior subordinated notes | Annual report states the subordinated notes are structurally subordinated to non-guarantor liabilities |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facilities | Rank equally in right of payment | Payment rank | Secured notes | Annual report guarantor information; 2033 indenture; New York law not confirmed in pages read |
| Secured notes | Senior in right of payment | Payment rank | Senior subordinated notes | Annual report guarantor information and 2027 subordinated indenture subordination article |
| Credit facilities | Secured by shared first-lien collateral, subordinated notes unsecured | Security rank | Senior subordinated notes | Annual report describes subordinated notes as unsecured and secured notes as senior secured |
| Applicable Authorized Representative | Binds all first-lien holders under security documents | Enforcement control | Secured notes | 2033 indenture collateral article referring to the First Lien Intercreditor Agreement dated 2019-02-13; identity of the representative not established |
| Designated Senior Debt | May block payments up to 179 days in any 360 days | Standstill | Senior subordinated notes | 2027 subordinated indenture default-on-senior-debt clause |
| Credit facilities | Release of a guarantor there releases its 2033 note guarantee | Release | Secured notes | 2033 indenture guarantor release clause, subject to the capital-markets debt condition |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 9 |
| Calculated | 2 |
| Assumption-Based | 1 |
| Analyst Inference | 1 |
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

### Evidence index

| Evidence ID | Provision or fact | Source |
|---|---|---|
| EV01 | Financial covenant: net leverage not above 7.50 to 1.00, or 8.00 to 1.00 for the first four fiscal quarters after a Material Acquisition, if Aggregate Revolving Credit Exposure exceeds 40% of revolving commitments; amendable only with Required Revolving Lenders; Events of Default (a) principal, (b) interest after five Business Days and other amounts after 30 days | d887611dex101.htm.jsonl, page 188 |
| EV02 | Springing test described as net debt to trailing EBITDA As Defined; trigger currently USD 364 million; no maintenance covenants in term loans and indentures; compliance at 2024-09-30; securitization capacity USD 650 million, drawn USD 487.5 million, maturity 2025-07-11 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| EV03 | Consolidated EBITDA add-backs (d) to (m), cost savings capped at 25.0% over 24 months; Consolidated Net Income exclusions incl. non-cash and deferred compensation; Consolidated Net Leverage Ratio and Consolidated Secured Net Debt Ratio definitions | d887611dex101.htm.jsonl, pages 24–27 |
| EV04 | Unrestricted Cash definition; Unrestricted Subsidiary designation limited to newly acquired or formed subsidiaries | d887611dex101.htm.jsonl, page 81 |
| EV05 | Permitted Indebtedness clause (12): pari secured at 5.00x secured net, junior or unsecured at 7.25x net, LC basket greater of USD 35 million and 1.5%; clause (13) general basket greater of USD 250 million and 10.0% | d887611dex101.htm.jsonl, page 59 |
| EV06 | Clause (14) foreign restricted subsidiary debt greater of USD 450 million and 18.0%; clause (17) subordinated debt at 7.25x; clause (18) securitization greater of USD 725 million and 20.0% | d887611dex101.htm.jsonl, page 60 |
| EV07 | Reclassification of debt across categories; limited-condition-acquisition test date; Permitted Investments (1) uncapped in restricted subsidiaries, greater of USD 250 million and 10.0% in Unrestricted Subsidiaries | d887611dex101.htm.jsonl, page 61 |
| EV08 | Restricted payments clause (7) greater of USD 75 million and 3.0%; clause (10) historic USD 1,500 million basket; any restricted payment with no default and pro forma net leverage not above 6.75x | d887611dex101.htm.jsonl, pages 180–181 |
| EV09 | Waivers and amendments: Required Lenders; each affected lender for economics; each lender for pro rata sharing, voting thresholds, release of material Guarantor or all or substantially all Collateral; agent enters pari or junior intercreditor arrangements on borrower request; non-pro-rata prepayment via offers to all lenders of a Class | d887611dex101.htm.jsonl, pages 204–205 |
| EV10 | Additional collateral: domestic non-excluded subsidiaries join within 20 Business Days; Excluded Subsidiary covers Immaterial, Unrestricted and Securitization Entities; 100% domestic and 65% foreign voting equity pledge; carve-out where pledge would require separate SEC financial statements | d887611dex101.htm.jsonl, pages 173–174 |
| EV11 | MFN: Yield Differential above 50 basis points; not applicable to acquisition debt, debt after 18 months from each amendment effective date, or debt maturing more than 18 months after the tranche | d887611dex101.htm.jsonl, page 144 |
| EV12 | 2033 indenture parties: TransDigm Inc., TransDigm Group Incorporated, guarantors, trustee and US and UK collateral agents, dated 2024-09-19 | d887611dex41.htm.jsonl, page 1 |
| EV13 | Intercreditor Agreement means First Lien Intercreditor Agreement dated 2019-02-13 with Joinders 1 to 6; Initial Redemption Date 2027-09-15; securitization debt measured at face of receivable interests | d887611dex41.htm.jsonl, page 30 |
| EV14 | 2033 notes restricted payments builder: USD 400.0 million plus 50% of cumulative Consolidated Net Income from 2010-10-01 plus equity proceeds | d887611dex41.htm.jsonl, pages 69–70 |
| EV15 | 2033 notes: any restricted payment if no default and Consolidated Fixed Charge Coverage Ratio exceeds 2.0 to 1.0; classification and split across exceptions | d887611dex41.htm.jsonl, pages 75–76 |
| EV16 | 2033 notes ratio debt at fixed charge coverage above 2.0 to 1.0; non-guarantor ratio debt capped at USD 400.0 million | d887611dex41.htm.jsonl, page 79 |
| EV17 | 2033 notes: release of Collateral as permitted and intercreditor arrangements without holder consent; majority amends indenture, security documents and Intercreditor Agreement; each affected holder for payment terms and ranking | d887611dex41.htm.jsonl, pages 115–117 |
| EV18 | Holders bound through the Intercreditor Agreement by Applicable Authorized Representative and Applicable Collateral Agent | d887611dex41.htm.jsonl, page 132 |
| EV19 | 2033 notes guarantor release on sale, unrestricted designation, immateriality, release under Credit Facilities and capital-markets debt, defeasance | d887611dex41.htm.jsonl, page 122 |
| EV20 | 2027 subordinated notes: subordination to Senior Debt, payment default bar, 179-day blockage once per 360 days, turnover of distributions held in trust | d826058dex41.htm.jsonl, pages 106–108 |
| EV21 | Guarantor scope by note class; structural subordination to non-guarantor liabilities; obligor-group net sales USD 6,294 million, current assets USD 7,813 million, non-current liabilities USD 25,155 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| EV22 | Restrictive-covenant summary; Amendment No. 15 dated 2024-03-22 latest covenant amendment; incremental conditions 7.25x and 5.00x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| EV23 | Term loans USD 8,702 million; revolver USD 910 million; letters of credit USD 67 million; USD 843 million available; quarterly amortisation USD 22 million; revolver maturity 2029-02-27 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| EV24 | 2033 notes asset sales: 75% productive assets or cash alternative; collateral proceeds remain Collateral or go to a net proceeds offer | d887611dex41.htm.jsonl, page 84 |
| EV25 | Carrying debt USD 24,880 million; cash USD 6,261 million; EBITDA As Defined USD 4,173 million; net cash interest USD 1,158 million; pro forma net debt USD 22,967 million and cash USD 1,913 million after October 2024 dividend | Financial foundation (CP-1) |
| EV26 | Delaware borrower and holdings; dividend USD 4,348 million paid October 2024 with USD 3,000 million new secured debt | Business & governance (CP-1A) |
| EV27 | Rejection of recurring acquisition, compensation and refinancing add-backs | Earnings quality (CP-1D) |

### T4.1 Source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement annexed to Amendment No. 17 | Executed version | 1 | Schedules, exhibits, Guarantee and Collateral Agreement and Required Lenders definition not reviewed | Completed with Limitations |
| 2033 secured notes indenture | Executed version | 1 | Other secured-note indentures not supplied | Completed with Limitations |
| 2027 subordinated notes indenture | Executed per supplied exhibit | 1 | 2029 subordinated indentures not supplied | Completed with Limitations |
| First Lien Intercreditor Agreement | Not in source set | 2 | Referenced only; enforcement control not established | Completed with Limitations |
| Annual report 2024 | Filed, retrospective | 4 | Summary of covenants; no compliance certificate | Completed with Limitations |

### T4.2 Controlling Document Register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as annexed to Amendment No. 17 | Credit agreement | Amended text as of 2024-09-19 | Executed | Controls loan covenants, financial covenant, EBITDA, baskets, guarantor and collateral duties, amendments | All loan capacity, priming and amendment conclusions | EV01; EV03 to EV11 |
| 1 | 6.000% senior secured notes due 2033 indenture | Indenture | 2024-09-19 | Executed | Controls 2033 notes covenants, amendments, guarantor release, collateral agency | Secured-note leakage, ratio debt and holder control | EV12 to EV19; EV24 |
| 1 | 5.500% senior subordinated notes due 2027 indenture | Indenture | 2019-11-13 | Executed per supplied exhibit | Controls subordination and payment blockage | Subordinated-note recovery and standstill | EV20 |
| 2 | First Lien Intercreditor Agreement with Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — referenced in the 2033 indenture but not in the source set | Would control lien sharing, enforcement and release among first-lien classes | First-lien recovery control | EV13; EV18 |
| 3 | Compliance certificate | Covenant certificate | Not supplied | [Insufficient Information] — no certificate in the source set | Would control tested ratios and basket usage | Exact headroom and remaining capacity | EV02 |
| 4 | Annual report 2024 covenant summary | Filed report | Signed 2024-11-07 | Filed, retrospective | Summary only; verified against executed text where possible | Revolver trigger amount, compliance statement, guarantor scope | EV02; EV21 to EV23 |

### T4.3 Covenant Feature Register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage not above 7.50x, or 8.00x for four quarters after a Material Acquisition, tested only if revolving exposure exceeds 40% of commitments; Required Revolving Lenders control amendments | Credit agreement Section 6.14 | No early-warning default for term lenders or noteholders; revolving lenders alone can waive | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV01; EV02 |
| Ratio restricted payments, loans | Any restricted payment if no default and pro forma net leverage not above 6.75x | Credit agreement Section 6.02 final paragraph | Uncapped distributions below the ratio; recap capacity grows with EBITDA | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV08 |
| General restricted payments basket | Greater of USD 75 million and 3.0% of Consolidated EBITDA, no default | Credit agreement Section 6.02 clause (7) | Small grower leakage independent of ratio | Neutral — Stable | Not assessed: no comparative source supplied | EV08 |
| Restricted payments, 2033 notes | Builder USD 400.0 million plus 50% of cumulative net income plus equity proceeds; any restricted payment while fixed charge coverage exceeds 2.0x | 2033 indenture Section 4.07 | Notes test looser than loans; distributions bounded by loan test only | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV14; EV15 |
| Pari secured incremental and incremental-equivalent debt | Same-priority secured debt if secured net leverage not above 5.00x after use of proceeds, refinancing debt excepted | Credit agreement Permitted Indebtedness clause (12); annual report incremental description | Dilutes first-lien recovery up to the ratio | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV05; EV22 |
| Junior, unsecured and subordinated debt | Junior-lien or unsecured debt and Permitted Subordinated Indebtedness if net leverage not above 7.25x | Credit agreement clauses (12) and (17) | Layering below first lien raises total claims and PD | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV05; EV06 |
| General and foreign debt baskets | General greater of USD 250 million and 10.0%; foreign restricted subsidiaries greater of USD 450 million and 18.0% | Credit agreement clauses (13) and (14) | Free-standing capacity; foreign debt ranks structurally ahead of note claims | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV05; EV06 |
| Securitization debt | Non-recourse securitization up to greater of USD 725 million and 20.0% | Credit agreement clause (18) | Receivables leave the collateral pool into a securitization entity | Neutral — Stable | Not assessed: no comparative source supplied | EV06; EV10 |
| 2033 notes ratio debt | Debt if fixed charge coverage above 2.0x; non-guarantor ratio debt capped at USD 400.0 million | 2033 indenture Section 4.09 | Loose notes debt test; non-guarantor debt primes structurally | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV16 |
| MFN | 50 bp Yield Differential protection for Tranches I, J, K and L; excludes acquisition debt, debt after 18 months from the amendment effective date and debt maturing over 18 months later | Credit agreement incremental clause, page 144 | Price protection lapses quickly and can be avoided by structure | Negative — Refinancing Risk | Not assessed: no comparative source supplied | EV11 |
| EBITDA add-backs | Uncapped restructuring, integration, transaction, refinancing, non-cash charge, earn-out, dividend-equivalent and customer start-up add-backs; cost savings capped at 25.0% within 24 months | Credit agreement Consolidated EBITDA clauses (d) to (m) | Inflates ratio and grower capacity | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV03 |
| Net leverage definition and cash netting | Consolidated Total Indebtedness minus Unrestricted Cash over trailing four-quarter Consolidated EBITDA, pro forma for acquisitions and asset sales | Credit agreement definitions | Full cash netting lowers tested leverage before cash leaves | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV03; EV04 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries holding no stock or liens of other subsidiaries; investment cap greater of USD 250 million and 10.0% | Credit agreement Unrestricted Subsidiary definition and Permitted Investments (1)(c) | Limits drop-down of existing operating subsidiaries | Neutral — Stable | Not assessed: no comparative source supplied | EV04; EV07 |
| Investments in restricted subsidiaries | Uncapped investments by borrower or any restricted subsidiary in any restricted subsidiary | Credit agreement Permitted Investments (1)(a) | Value can move to non-guarantor restricted subsidiaries | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV07 |
| Guarantor and collateral coverage | Domestic non-excluded subsidiaries join within 20 Business Days; 100% domestic and 65% foreign voting equity pledged; SEC separate-financials carve-out | Credit agreement Section 5.11 | Foreign value and some equity outside the lien | Neutral — Stable | Not assessed: no comparative source supplied | EV10 |
| Notes guarantor release | Automatic release on sale, unrestricted designation, immateriality or release under credit facilities and capital-markets debt | 2033 indenture Section 10.07 | Notes guarantees follow the loan guarantor set | Neutral — Stable | Not assessed: no comparative source supplied | EV19 |
| Asset sales, 2033 notes | 75% productive assets, cash or marketable securities at fair value; collateral proceeds stay Collateral or go to an offer | 2033 indenture Section 4.10 | Proceeds can be reinvested rather than repay debt | Neutral — Stable | Not assessed: no comparative source supplied | EV24 |
| Events of default, loans | Principal default immediate; interest after five Business Days; other amounts after 30 days | Credit agreement Article VII (a) and (b) | Short payment cures; covenant defaults for term lenders limited to negative covenants | Neutral — Stable | Not assessed: no comparative source supplied | EV01 |
| Amendments, loans | Required Lenders generally; unanimous for pro rata sharing, thresholds, release of material Guarantor or all or substantially all Collateral; non-pro-rata only via offers to all lenders of a Class | Credit agreement Section 9.02 | Strong anti-non-pro-rata protection; lien subordination not listed | Neutral — Stable | Not assessed: no comparative source supplied | EV09 |
| Amendments, 2033 notes | Majority amends indenture, security documents and Intercreditor Agreement; collateral release as permitted without consent; ranking change needs each affected holder | 2033 indenture Sections 9.01 and 9.02 | Collateral package can be weakened by majority | Negative — Covenant Erosion | Not assessed: no comparative source supplied | EV17 |
| Subordination, 2027 notes | Senior Debt paid in full first; payment bar on Designated Senior Debt payment default; 179-day blockage once per 360 days; turnover | 2027 indenture Article 10 | Subordinated holders can be stopped and must turn over | Negative — Refinancing Risk | Not assessed: no comparative source supplied | EV20 |
| Reclassification and acquisition test date | Debt can be classified and reclassified across categories; acquisition ratio tests at signing of definitive documents | Credit agreement Section 6.01 final paragraph | Baskets reusable once ratios improve; signing-date tests | Negative — Leverage Increase | Not assessed: no comparative source supplied | EV07 |

### Step findings: EBITDA, debt, leakage, collateral and control

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Consolidated EBITDA clauses (d) to (m) | Credit agreement annexed to Amendment No. 17, 2024-09-19, Rank 1 | Broad uncapped add-backs plus 25% cost-savings cap | Higher denominator widens every ratio test and grower basket | Moderate: more room to releverage before ratio limits bind | Moderate: more pari and junior debt possible | Compare covenant EBITDA in certificates with EBITDA As Defined | Negative — Covenant Erosion | High | EV03 |
| Permitted Indebtedness clause (12) | Credit agreement, Rank 1 | Pari secured debt to 5.00x secured net; junior and unsecured to 7.25x net | Ratio debt open while EBITDA grows | Moderate | High: pari secured debt dilutes first-lien recovery | Track secured issuance and incremental joinders | Negative — Leverage Increase | High | EV05 |
| Section 6.02 ratio restricted payments | Credit agreement, Rank 1 | Unlimited distributions at or below 6.75x | Debt-funded recap without covenant event | High: demonstrated use | High: value leaves the group | Track declarations and pro forma leverage at each | Negative — Leverage Increase | High | EV08; EV26 |
| Permitted Investments (1)(a) and Section 5.11 | Credit agreement, Rank 1 | Uncapped investment in restricted subsidiaries; foreign 65% voting pledge | Transfers into non-guarantor perimeter | Low | High: value outside guarantor reach | Track non-guarantor share of sales and assets | Negative — Covenant Erosion | Medium | EV07; EV10 |
| Section 9.02 | Credit agreement, Rank 1 | Unanimous consent for sharing and releases; open-offer non-pro-rata only | Limits coercive non-pro-rata exchanges | Low | Moderate protective: limits uptier, but subordination not listed | Track amendment filings and Required Lender actions | Neutral — Stable | Medium | EV09 |
| Sections 9.01 and 9.02, 2033 indenture | 2033 indenture, 2024-09-19, Rank 1 | Majority controls security documents and intercreditor amendments | Collateral can be weakened by majority | Low | Moderate | Track consent solicitations | Negative — Covenant Erosion | High | EV17 |

### Definition conflict register

| Metric | Legal definition | Financial foundation basis | Figures | Divergence | Evidence ID |
|---|---|---|---|---|---|
| Covenant debt | Consolidated Total Indebtedness minus Unrestricted Cash; Consolidated Total Indebtedness definition not reviewed | Carrying debt current plus long-term plus securitization, net of issuance costs | Carrying USD 24,880 million; covenant amount not disclosed | Principal versus carrying basis and lease treatment not established; no reconciliation made | EV03; EV25 |
| Securitization debt | Face or notional amount of receivable interests counts as Indebtedness | Carrying value | Carrying USD 486 million; narrative drawn USD 487.5 million | Covenant uses face; carrying is net of costs | EV13; EV02; EV25 |
| Covenant EBITDA | Consolidated EBITDA with add-backs (d) to (m); Financial Covenant Consolidated EBITDA for the revolver test | EBITDA As Defined USD 4,173 million; reported EBITDA USD 3,813 million | Covenant figure not disclosed | Annual report equates the revolver test denominator with EBITDA As Defined; other ratio tests unbridged | EV02; EV03; EV25 |
| Non-debt float | Dividends payable and contract liabilities not shown within Indebtedness in clauses read | Dividends payable USD 4,216 million and contract liabilities USD 177 million outside debt | Outside every ratio test until paid in cash | Declared dividend did not count as debt at year-end; capacity effect only on payment | EV25 |

### Subsequent events

| Event | Date | Amount | Capacity effect | Evidence ID |
|---|---|---|---|---|
| Special dividend and dividend equivalents paid | October 2024; Business & governance records 2024-10-18 | USD 4,348 million | Restricted-payment usage, pro forma only; proxy net leverage moves to 5.50x; never booked into year-end figures | EV25; EV26 |
| Remaining securitization availability drawn | October 2024; Business & governance records 2024-10-16 | USD 162.5 million | Uses securitization basket; net debt unchanged per Financial foundation | EV02; EV25 |

### T4.9 PD vs LGD Translation Table

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio restricted payments | Unlimited at or below 6.75x loans; fixed charge coverage above 2.0x notes | Debt-funded distributions | Raises leverage and refinancing need | Removes value from all classes | Each declaration and pro forma ratio | EV08; EV15 |
| Pari secured debt capacity | 5.00x secured net condition | Additional pari claims | Higher interest burden | Dilutes first-lien recovery | Secured issuance | EV05 |
| Springing maintenance test | 7.50x only above 40% revolver exposure | Late default trigger | Delays acceleration; distress surfaces at maturity | Lower recovery when default arrives later | Revolver drawings above USD 364 million | EV01; EV02 |
| Non-guarantor perimeter | Uncapped investment in restricted subsidiaries; USD 400 million notes non-guarantor ratio debt | Structural subordination | Limited | Note and loan claims behind non-guarantor creditors | Obligor-group share of sales | EV07; EV16; EV21 |
| Subordination and blockage | 179-day blockage, turnover | Payment stop for subordinated notes | Raises subordinated default risk in stress | Subordinated recovery after all senior debt | Blockage notices | EV20 |
| Amendment thresholds | Unanimous sharing and release protections in loans; majority control of notes security documents | Lender control | Neutral | Loans protected; notes collateral weaker | Consent solicitations | EV09; EV17 |

### T4.10 Market Norm Comparison Table

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions as recorded in the covenant feature register | No supported comparative source or third-party covenant review supplied | Not assessed: comparison limited because no supported comparative source was provided | Not assessed: no third-party view to agree or disagree with | Insufficient Information | EV01 to EV20 |

### T4.11 Aggressiveness Score Table

Covenant Aggressiveness Score: 4/5, Provisional.

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x test at above 40% exposure; none for term loans or notes | No early default trigger for most debt | Negative — Covenant Erosion | High | EV01; EV02 |
| Debt / lien incurrence capacity | 4 | Pari secured to 5.00x; junior to 7.25x; grower baskets; notes ratio debt above 2.0x coverage; 50 bp MFN with 18-month sunset | Releveraging and pari dilution | Negative — Leverage Increase | Medium | EV05; EV06; EV11; EV16 |
| RP / investment / leakage capacity | 4 | Unlimited distributions at 6.75x and above 2.0x notes coverage, demonstrated USD 4,348 million; uncapped restricted-subsidiary investment; restricted USub designation | Value leaves group or reaches non-guarantors | Negative — Leverage Increase | High | EV07; EV08; EV15; EV26 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped integration, transaction, non-cash and dividend-equivalent add-backs; 25% cost-savings cap over 24 months | Inflated denominators | Negative — Covenant Erosion | Medium | EV03 |
| Collateral / guarantor protection | 3 | Domestic guarantees and pledges; 65% foreign pledge; unanimous consent for material releases in loans; majority control of notes security documents | Some value outside lien; release risk on notes | Neutral — Stable | Provisional | EV09; EV10; EV17; EV19 |
| Amendment / control mechanics | 3 | Required Lenders generally; unanimous sharing protection; open-offer non-pro-rata only; ranking protected in notes; lien subordination not listed | Uptier not ruled out but constrained | Neutral — Stable | Medium | EV09; EV17 |
| Overall | 4 | Weighted to demonstrated ratio-based leakage and absent maintenance protection | Distributions and pari debt are the live risks | Negative — Leverage Increase | Provisional | EV01 to EV20 |

### T4.12 Red Flags Table

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further debt-funded special dividend | Section 6.02 ratio restricted payments at 6.75x | Already used for USD 4,348 million | PD up, LGD up, spread widening risk | Track board declarations and new debt | EV08; EV26 |
| Pari secured issuance near 5.00x | Permitted Indebtedness clause (12) | Dilutes existing first lien | LGD up for loans and secured notes | Track secured notes and incremental joinders | EV05 |
| Revolver exposure above USD 364 million | Section 6.14 trigger | Activates the only maintenance test | PD signal for revolving lenders only | Quarterly revolver usage and letters of credit | EV01; EV02 |
| Value shift to non-guarantors | Permitted Investments (1)(a); foreign debt basket | Structural subordination of all notes and loans | LGD up | Obligor-group sales and assets in annual reports | EV06; EV07; EV21 |
| Notes collateral amendment by majority | 2033 indenture Section 9.02 | Collateral can be weakened without each holder | LGD up for 2033 notes | Consent solicitations | EV17 |
| Intercreditor amendment or new joinder | First Lien Intercreditor Agreement joinders | Changes sharing and enforcement | LGD redistribution among first-lien classes | Track joinders and amendments | EV13 |
| Unrestricted subsidiary designation | Unrestricted Subsidiary definition | Starts drop-down route | LGD up | Officers' certificates and filings | EV04 |
| Payment blockage notice | 2027 indenture Section 10.03 | Stops subordinated payments | PD up for subordinated notes | Trustee notices | EV20 |

### T4.13 Gaps Ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor control | First Lien Intercreditor Agreement dated 2019-02-13 and Joinders 1 to 6 | Enforcement control, standstill, release and proceeds sharing | Intercreditor registers carry insufficient-information rows | Obtain executed agreement and joinders |
| Security package | Guarantee and Collateral Agreement and schedules | Excluded assets, perfection and release mechanics | Collateral matrix partly qualitative | Obtain security documents |
| Covenant EBITDA and cash | Compliance certificate with covenant EBITDA, Consolidated Total Indebtedness and Unrestricted Cash | Exact ratio headroom | Headroom rows are proxies | Obtain certificate |
| Basket usage | Usage records for general, foreign, securitization, investment and restricted-payment baskets | Remaining capacity | Capacity register shows sizes only | Obtain usage records |
| Other indentures | 2028 to 2032 secured notes and 2029 subordinated notes indentures | Note-level terms | Conclusions limited to 2033 and 2027 notes | Obtain indentures |
| Definitions not reviewed | Required Lenders, Consolidated Total Indebtedness, Material Acquisition, Consolidated Fixed Charge Coverage Ratio, Permitted Liens | Voting share and test mechanics | Amendment and ratio analysis partial | Read definitions in executed text |
| Governing law | Governing-law clauses of all documents | Enforcement and guarantee limitation | Jurisdiction cells partial | Read governing-law clauses |
| Market norms | Comparative covenant reviews | Relative scoring | Market-norm table not assessed | Obtain third-party covenant review |
| Refinancing and liability-management context | Refinancing and LME analysis | LME legal-capacity overlay | Priming view permission-based only | Not available in this run |

### T4D.1 Source Gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement Section 5.11 and definitions | Executed | 1 | Guarantor schedule and security agreement not reviewed | Completed with Limitations |
| 2033 indenture guarantee and collateral articles | Executed | 1 | Security documents referenced, not supplied | Completed with Limitations |
| Annual report guarantor information and obligor summary | Filed, retrospective | 2 | Exhibit 22.1 guarantor list not supplied; no entity-level debt | Completed with Limitations |
| Business & governance ownership facts | Supplied analysis | 3 | No organisation chart or subsidiary list | Completed with Limitations |
| First Lien Intercreditor Agreement | Not supplied | 2 | Enforcement and release mechanics not established | Completed with Limitations |

No perimeter-changing event after the balance-sheet date was found in the sources read; the October 2024 distribution and securitization draw do not change the guarantor or collateral perimeter.

### T4D.2 Restricted / Unrestricted Entity Register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; parent guarantor | Delaware | Public shareholders | Not a subsidiary; Holdings under loans and notes | No significant operations or assets other than investment in TransDigm Inc. | Yes, guarantor | EV21; EV26 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated, 100% | Borrower; cannot be designated unrestricted | Obligor group combined net sales USD 6,294 million | Yes, primary obligor | EV21; EV26 |
| TransDigm UK | Guarantor of secured and subordinated notes | [Insufficient Information] — jurisdiction not stated in pages read; UK collateral agent appointed | [Insufficient Information] — parent not established | Restricted | Included in obligor group summary | Yes, guarantor | EV12; EV21 |
| Domestic Restricted Subsidiaries | Guarantors of loans and notes | United States | TransDigm Inc. directly or indirectly | Restricted; existing subsidiaries cannot be designated unrestricted | Included in obligor group summary | Yes, guarantors | EV04; EV10; EV21 |
| Foreign Restricted Subsidiaries | Non-guarantors | Non-US, entities not identified | TransDigm Inc. or loan parties | Restricted | Non-obligor external sales approx. USD 1,646 million, analyst difference | Restricted group but outside guarantees | EV10; EV21 |
| Immaterial Domestic Subsidiaries | Excluded subsidiaries | United States | Loan parties | Restricted; must join if they cease to be immaterial | [Insufficient Information] — values not disclosed | Restricted group, not guarantors | EV10 |
| Securitization Entity | Excluded subsidiary holding receivables | [Insufficient Information] — entity and jurisdiction not identified | [Insufficient Information] — parent not identified | Excluded Subsidiary | Securitization debt carrying USD 486 million | Outside guarantees | EV06; EV10; EV25 |
| Unrestricted Subsidiaries | None identified | [Insufficient Information] — no designation in sources read | Borrower or restricted subsidiaries | Only newly formed or acquired subsidiaries can be designated | [Insufficient Information] — none disclosed | No | EV04 |

### T4D.3 Guarantor Coverage Matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities | Senior secured | Upstream from parent to subsidiary borrower, i.e. downstream guarantee | Not established: loan guarantee release terms not reviewed | EV09; EV21 |
| TransDigm Group Incorporated × secured notes | Senior secured | Downstream | Defeasance or discharge | EV19; EV21 |
| TransDigm Group Incorporated × subordinated notes | Senior subordinated unsecured | Downstream | Not established: 2027 release clause not reviewed | EV21 |
| TransDigm UK × secured notes | Senior secured | Cross-stream or upstream, structure not established | Release under credit facilities and capital-markets debt; sale; designation | EV19; EV21 |
| TransDigm UK × subordinated notes | Senior subordinated unsecured | Cross-stream or upstream, structure not established | Not established: 2027 release clause not reviewed | EV21 |
| Domestic Restricted Subsidiaries × credit facilities | Senior secured | Upstream | Release of a material Guarantor needs every lender unless otherwise permitted | EV09; EV10 |
| Domestic Restricted Subsidiaries × secured notes | Senior secured | Upstream | Sale, unrestricted designation, immateriality, release under credit facilities and capital-markets debt | EV19 |
| Domestic Restricted Subsidiaries × subordinated notes | Senior subordinated unsecured | Upstream | Not established: 2027 release clause not reviewed | EV21 |
| Foreign Restricted Subsidiaries × all tranches | No guarantee | Not applicable: non-guarantors | Not applicable: no guarantee given | EV10; EV21 |
| Securitization Entity × all tranches | No guarantee | Not applicable: excluded | Not applicable: no guarantee given | EV10 |

### T4D.4 Collateral-by-Entity Matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × First lien | Equity where pledge would require separate SEC financials; pledged value — | Loans: all or substantially all collateral needs every lender; notes: release as permitted without holder consent | Security agreement not reviewed | EV09; EV10; EV17 |
| TransDigm Group Incorporated × Second lien | No second lien outstanding identified; junior lien capacity at 7.25x; value — | Not applicable: no junior lien identified | Not applicable: no junior lien identified | EV05 |
| TransDigm Group Incorporated × Unsecured | Subordinated guarantee unsecured; value — | Not applicable: unsecured | Not applicable: unsecured | EV21 |
| TransDigm Inc. × First lien | Foreign voting equity above 65%; SEC separate-financials carve-out; pledged value — | As above | Security agreement not reviewed | EV10 |
| TransDigm Inc. × Second lien | No second lien identified; value — | Not applicable: no junior lien identified | Not applicable: no junior lien identified | EV05 |
| TransDigm Inc. × Unsecured | Subordinated notes unsecured; value — | Not applicable: unsecured | Not applicable: unsecured | EV20 |
| TransDigm UK × First lien | UK collateral scope not reviewed; value — | Release under credit facilities flows to notes guarantee | UK collateral agent appointed; local-law perfection not reviewed | EV12; EV19 |
| TransDigm UK × Second lien | No second lien identified; value — | Not applicable: no junior lien identified | Not applicable: no junior lien identified | EV05 |
| TransDigm UK × Unsecured | Subordinated guarantee; value — | Not applicable: unsecured | Not applicable: unsecured | EV21 |
| Domestic Restricted Subsidiaries × First lien | Assets per Guarantee and Collateral Agreement not reviewed; value — | Sale releases; material releases need every lender under loans | Joinder within 20 Business Days for new subsidiaries | EV10; EV19 |
| Domestic Restricted Subsidiaries × Second lien | No second lien identified; value — | Not applicable: no junior lien identified | Not applicable: no junior lien identified | EV05 |
| Domestic Restricted Subsidiaries × Unsecured | Subordinated guarantees; value — | Not applicable: unsecured | Not applicable: unsecured | EV21 |
| Foreign Restricted Subsidiaries × First lien | Own assets not pledged; only 65% of first-tier voting equity pledged; value — | Not applicable: no direct lien | Foreign law not reviewed | EV10 |
| Foreign Restricted Subsidiaries × Second lien | Not pledged; value — | Not applicable: no lien | Not applicable: no lien | EV10 |
| Foreign Restricted Subsidiaries × Unsecured | No guarantee; creditors rank first on these assets; value — | Not applicable: no claim | Not applicable: no claim | EV21 |
| Immaterial Domestic Subsidiaries × First lien | Excluded subsidiary assets; value — | Join if no longer immaterial | Not applicable: excluded | EV10 |
| Immaterial Domestic Subsidiaries × Second lien | Excluded; value — | Not applicable: excluded | Not applicable: excluded | EV10 |
| Immaterial Domestic Subsidiaries × Unsecured | No guarantee; value — | Not applicable: excluded | Not applicable: excluded | EV10 |
| Securitization Entity × First lien | Receivables sold to securitization; value — | Not applicable: excluded | Not applicable: excluded | EV06; EV10 |
| Securitization Entity × Second lien | Excluded; value — | Not applicable: excluded | Not applicable: excluded | EV10 |
| Securitization Entity × Unsecured | Securitization creditors only; value — | Not applicable: excluded | Not applicable: excluded | EV06 |

A dash in this matrix means the pledged or unpledged value is not disclosed, never zero.

### T4D.5 Structural Priority Table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with Holdings, TransDigm UK and domestic guarantors | Obligor group assets plus 65% foreign voting equity | Pari (same entity, same lien) | Foreign non-guarantor assets, non-obligor sales approx. USD 1,646 million, reachable only through equity pledge | Strongest access; diluted by pari secured debt up to 5.00x | Medium | EV10; EV21 |
| Secured notes | TransDigm Inc. with same guarantors | Same shared collateral | Pari (same entity, same lien) | Same foreign non-guarantor value | Same as loans, but notes collateral amendable by majority | Medium | EV17; EV21 |
| Subordinated notes | TransDigm Inc. with Holdings, TransDigm UK and domestic guarantors | Residual after all Senior Debt | Contractually Subordinated | Foreign non-guarantor value and all collateral value until senior paid | Weakest access; turnover and blockage | High | EV20; EV21 |
| Non-guarantor creditors including foreign debt and securitization | Foreign restricted subsidiaries; Securitization Entity | Their own assets first | Structurally Senior | Not applicable: these creditors are senior on that value | Rank ahead of all note and loan claims on non-guarantor assets | Medium | EV06; EV21 |
| Finance leases and government advances | [Insufficient Information] — obligor entity not established | [Insufficient Information] — legal rank not established | Insufficient Information | [Insufficient Information] — entity and rank not disclosed | Not established | Low | EV25 |

### T4D.6 Drop-down / Transfer Capacity Register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distributions to shareholders | Restricted group to TransDigm Group Incorporated to shareholders | Ratio restricted payments at 6.75x; notes coverage above 2.0x | USD 4,348 million paid October 2024; further amount not calculable | 4 | Value leaves all creditors | Demonstrated | EV08; EV15; EV26 |
| Investment into non-guarantor restricted subsidiaries | Loan parties to foreign restricted subsidiaries | Permitted Investments (1)(a), uncapped | Not calculable: no transfer or asset data | 4 | Shifts value behind non-guarantor creditors | Theoretical | EV07 |
| Designation of unrestricted subsidiary | Newly formed or acquired subsidiary out of restricted group | Unrestricted Subsidiary definition; investment cap greater of USD 250 million and 10% | Proxy cap USD 417.30 million plus restricted-payment capacity | 3 | Value released from guarantees and collateral | Theoretical | EV04; EV07 |
| Asset sale out of group | Guarantor assets to third party | 2033 indenture Section 4.10; credit agreement Section 6.03 | Not calculable: no asset-sale pipeline | 3 | Proceeds can be reinvested; collateral proceeds stay collateral | Theoretical | EV24 |
| Guarantor release following loans | Guarantor released under credit facilities | 2033 indenture Section 10.07(e) | Not calculable: entity values not disclosed | 3 | Notes lose guarantee when loans release, subject to capital-markets debt condition | Theoretical | EV19 |

### T4D.7 Priming-Exposure Findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier | Credit agreement Section 9.02 lists no lien or payment subordination among unanimous items read; non-pro-rata prepayment only via offers to all lenders of a Class | Term lenders and secured notes | Theoretical and contested | Required Lenders could not exclude minority lenders from an offer, but subordination by amendment is not expressly barred | Medium | EV09 |
| Uptier | Agent enters pari or junior intercreditor arrangements on request; 2033 notes Section 9.01(m) intercreditor arrangements without consent | Existing first-lien classes | Theoretical | Pari dilution up to 5.00x secured net without holder vote | High | EV09; EV17 |
| Trapdoor | Uncapped investment into restricted non-guarantors plus foreign debt basket and USD 400 million notes non-guarantor ratio debt | All notes and loans | Theoretical | New debt at non-guarantors ranks structurally ahead | Medium | EV06; EV07; EV16 |

### T4D.8 Gaps Ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit 22.1 and loan guarantor schedule | Named guarantors and jurisdictions | Entity register uses classes | Obtain schedules |
| Security documents | Guarantee and Collateral Agreement | Excluded assets and releases | Collateral matrix values shown as dashes | Obtain documents |
| Entity-level financials | Non-guarantor assets, EBITDA and debt | Size of stranded value | Structural priority qualitative only | Obtain entity-level data |
| Intercreditor agreement | First Lien Intercreditor Agreement | Release and enforcement among first-lien classes | Release routes partly unscored | Obtain agreement |
| 2027 notes release clause | Guarantor release section of 2027 indenture | Subordinated guarantee releases | Release trigger not established for subordinated notes | Read clause |

### T4F.1 Controlling Documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement annexed to Amendment No. 17 | TransDigm Inc. as Borrower, TransDigm Group Incorporated as Holdings, subsidiary loan parties, lenders and agent | 2024-09-19 | Not established: clause not reviewed | Executed | d887611dex101.htm.jsonl, pages 188 and 204–205 | EV01; EV09 |
| 2033 secured notes indenture | TransDigm Inc., TransDigm Group Incorporated, guarantors, BNY Mellon Trust as trustee and US collateral agent, BNY Mellon as UK collateral agent | 2024-09-19 | Not established: clause not reviewed | Executed | d887611dex41.htm.jsonl, pages 1 and 132 | EV12; EV18 |
| 2027 subordinated notes indenture | TransDigm Inc. and trustee; guarantors | 2019-11-13 | Not established: clause not reviewed | Executed per supplied exhibit | d826058dex41.htm.jsonl, pages 106–108 | EV20 |
| First Lien Intercreditor Agreement | Company, Holdings, subsidiary guarantors, Credit Agreement Collateral Agent, secured notes trustees and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | d887611dex41.htm.jsonl, page 30 | EV13 |

### T4F.2 Creditor Class Map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | Senior secured, first lien | Shared first-lien collateral | Sole right to enforce and amend the springing test | Required Revolving Lenders for the financial covenant | EV01 |
| Term lenders | Senior secured, first lien | Shared first-lien collateral | Acceleration on events of default; collateral enforcement through intercreditor agreement | Required Lenders; unanimous for sacred rights | EV09 |
| Secured noteholders | Senior secured, equal payment rank | Shared first-lien collateral | Bound through Applicable Authorized Representative | Majority of notes for indenture, security documents and intercreditor amendments | EV17; EV18 |
| Subordinated noteholders | Senior subordinated | Unsecured | Remedies subject to senior debt's rights to distributions | Not established: 2027 amendment clause not reviewed | EV20 |
| Non-guarantor creditors | Structurally senior on non-guarantor assets | Own entity assets | Direct against non-guarantors | Not applicable: outside documents | EV21 |

### T4F.3 Enforcement Control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement enforcement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set; Applicable Authorized Representative identity not established | Term lenders, revolving lenders, secured noteholders | Non-controlling first-lien class may not direct enforcement | Insufficient Information | EV13; EV18 |
| 2027 notes payment blockage | 179 days per Blockage Notice; no more than 179 days in any 360-day period; 181 days free | Non-payment default on Designated Senior Debt permitting acceleration | Representative of Designated Senior Debt | Subordinated noteholders | Payment stop while senior lenders negotiate | Negative — Refinancing Risk | EV20 |
| 2027 notes payment default bar | Until cure, waiver or payment in full of Designated Senior Debt | Designated Senior Debt payment default or acceleration | Designated Senior Debt holders | Subordinated noteholders | No payment while senior payment default continues | Negative — Refinancing Risk | EV20 |

### T4F.4 Turnover and Release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| 2027 notes Article 10 | Distributions received in breach held in trust and paid to senior debt | Not applicable: unsecured | [Insufficient Information] — no purchase option in pages read | Applies while senior debt unpaid | Holders keep remedies subject to senior rights | EV20 |
| Credit agreement Section 9.02 | Not applicable: no turnover clause in pages read | Release of all or substantially all Collateral or material Guarantor needs every lender, except as otherwise permitted | Not applicable: none in pages read | Collateral document and permitted-transaction exceptions | Strong protection against majority release | EV09 |
| 2033 indenture Sections 9.01 and 10.07 | [Insufficient Information] — ICA not in the source set | Release of Collateral as permitted without holder consent; guarantor release when released under credit facilities | [Insufficient Information] — ICA not in the source set | Capital-markets debt condition for guarantor release | Ranking change requires each affected holder | EV17; EV19 |
| First Lien Intercreditor Agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Annual report says secured notes and loans rank equally | EV13; EV21 |

### T4F.5 Recovery Control Assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Shared collateral proceeds; sacred-right release protection | Pari dilution by new secured debt at 5.00x; intercreditor control unknown | Moderate | More claimants on same collateral | Negative — Leverage Increase | EV05; EV09 |
| Secured noteholders | Shared collateral through intercreditor agreement | Majority can amend security documents; likely non-controlling class, not established | [Insufficient Information] — ICA not in the source set | Enforcement may follow another class's instructions | Insufficient Information | EV17; EV18 |
| Revolving lenders | Shared collateral plus sole maintenance test | Test dormant at low usage | Low | Earliest default trigger available only to them | Neutral — Stable | EV01 |
| Subordinated noteholders | Residual after senior debt; turnover; blockage | Payment blockage and turnover | High | Paid only after all senior debt in insolvency | Negative — Refinancing Risk | EV20 |

### T4F.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Enforcement control | First Lien Intercreditor Agreement | Identifies controlling representative and instructions | Enforcement rows not established | Obtain agreement and joinders |
| Proceeds waterfall among first-lien classes | Intercreditor sharing clause | Pro rata or priority among loans and notes | Recovery mechanic qualitative | Obtain agreement |
| Release authority over shared collateral | Intercreditor release clause | Whether loan agent release binds notes | Release severity unscored | Obtain agreement |
| Subordinated notes amendment threshold | 2027 indenture amendment article | Holder control | Voting weight not established | Read clause |
| Governing law | Governing-law clauses | Enforcement forum and guarantee limits | Governing law column not established | Read clauses |

Verification: T4F.1 PASS; T4F.2 PASS; T4F.3 PASS with insufficient-information rows; T4F.4 PASS with insufficient-information rows; T4F.5 PASS with insufficient-information rows; T4F.6 PASS. No recovery value is stated.

### T4C.1 Capacity source gate

| Input | Availability | Quality | Limitation |
|---|---|---|---|
| Legal formulas | Credit agreement and 2033 and 2027 indentures | Executed, Rank 1 | Some definitions not reviewed |
| Financial inputs | Financial foundation figures | Audited annual, retrospective | Not covenant definitions |
| Usage data | Revolver usage only | Annual report | No basket usage tracker or certificate |
| Post-balance-sheet capacity events | October 2024 dividend and securitization draw | Financial foundation and business and governance | Pro forma only |

### T4C.2 Source Map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement annexed to Amendment No. 17 | Credit agreement | 2024-09-19 | Executed | Legal Formula | Ratio, basket and covenant formulas | EV01 to EV11 |
| 1 | 2033 secured notes indenture | Indenture | 2024-09-19 | Executed | Legal Formula | Notes restricted payments and ratio debt | EV14 to EV16 |
| 1 | 2027 subordinated notes indenture | Indenture | 2019-11-13 | Executed per supplied exhibit | Legal Formula | Subordination mechanics | EV20 |
| 3 | Financial foundation | Supplied financial analysis | FY2024 | Accepted | Financial Input | Debt, cash, EBITDA As Defined, interest | EV25 |
| 4 | Annual report 2024 | Filed report | Signed 2024-11-07 | Filed | Usage | Revolver letters of credit and availability; compliance statement | EV02; EV23 |
| 5 | Business & governance | Supplied analysis | As of 2024-09-30 | Accepted | Usage | Distribution history as restricted-payment usage | EV26 |

### T4C.3 Definition Register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness minus Unrestricted Cash over trailing four-quarter Consolidated EBITDA, pro forma | Covenant debt, unrestricted cash, covenant EBITDA | Drives restricted payments, junior debt and the revolver test | Cash netting and add-backs lower the ratio | Negative — Covenant Erosion | EV03 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Consolidated Total Indebtedness minus Unrestricted Cash over Consolidated EBITDA | Secured covenant debt, cash, EBITDA | Gates pari secured debt at 5.00x | Same netting and add-backs | Negative — Leverage Increase | EV03; EV05 |
| Consolidated EBITDA | Credit agreement clauses (d) to (m) | Net income plus uncapped and capped add-backs; cost savings up to 25% within 24 months | Covenant EBITDA bridge | Expands ratios and grower baskets | Add-back inflation | Negative — Covenant Erosion | EV03 |
| Financial Covenant Consolidated EBITDA | Credit agreement Section 6.14 reference | Separate denominator for the revolver test; annual report calls it EBITDA As Defined | Definition text not reviewed | Revolver headroom | Definition may differ from other tests | Insufficient Information | EV01; EV02 |
| Unrestricted Cash | Credit agreement definitions | Unrestricted cash not subject to creditor liens other than loan documents | Cash by restriction | Full cash netting | Cash can be netted then distributed | Negative — Covenant Erosion | EV04 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture Sections 4.07 and 4.09 | Must exceed 2.0x; definition not reviewed | Covenant EBITDA and fixed charges | Unlimited notes restricted payments and ratio debt | Loose test | Negative — Leverage Increase | EV15; EV16 |

### T4C.4 Headroom Table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver springing trigger, revolving exposure to commitments, 2024-09-30 | max-ratio | 40.00% | 7.36% | Threshold minus current | 32.64% | Compliant | Exposure taken as USD 67 million letters of credit; cash collateralisation not stated; headroom is in percentage points, USD 297 million | Test springs only above the trigger | Neutral — Stable | EV01; EV02; EV23 |
| Revolver net leverage test, tested ratio | max-ratio | 7.50x | Not supplied: Financial Covenant Consolidated EBITDA, Consolidated Total Indebtedness and Unrestricted Cash not disclosed | Threshold minus tested ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Test inactive at year-end; 8.00x for four quarters after a Material Acquisition | Late default trigger | Insufficient Information | EV01; EV02 |
| Revolver net leverage test, indicative proxy after October 2024 dividend | max-ratio | 7.50x | 5.50x | Threshold minus proxy | 2.00x | Compliant | Proxy: Financial foundation pro forma net debt over EBITDA As Defined; all cash treated as unrestricted | EBITDA decline needed before test bites | Neutral — Stable | EV01; EV25 |
| Ratio restricted payments, credit agreement, indicative proxy after October 2024 dividend | max-ratio | 6.75x | 5.50x | Threshold minus proxy | 1.25x | Compliant | Proxy; year-end proxy 4.46x with headroom 2.29x before the payment; covenant EBITDA likely higher | Room for further distributions | Negative — Leverage Increase | EV08; EV25 |
| Pari secured debt condition, indicative proxy after October 2024 dividend | max-ratio | 5.00x | 4.22x | Threshold minus proxy | 0.78x | Compliant | Proxy uses term loans and secured notes only; year-end proxy 3.18x before the payment | Nearest pressure point for new pari secured debt | Negative — Leverage Increase | EV05; EV25 |
| Junior, unsecured and subordinated debt condition, indicative proxy after October 2024 dividend | max-ratio | 7.25x | 5.50x | Threshold minus proxy | 1.75x | Compliant | Proxy; year-end proxy 4.46x with headroom 2.79x | Junior layering capacity | Negative — Leverage Increase | EV05; EV06; EV25 |
| 2033 notes fixed charge coverage, tested ratio | min-ratio | 2.00x | Not supplied: Consolidated Fixed Charge Coverage Ratio inputs not disclosed | Tested ratio minus threshold | [Insufficient Information] — missing: current tested ratio | Not Calculable | Definition not reviewed | Loose incurrence and restricted-payment gate | Insufficient Information | EV15; EV16 |
| 2033 notes fixed charge coverage, indicative proxy FY2024 | min-ratio | 2.00x | 3.60x | Proxy minus threshold | 1.60x | Compliant | Proxy: EBITDA As Defined over net cash interest FY2024; excludes interest on September 2024 debt | Notes test not binding before the loan test | Neutral — Stable | EV15; EV25 |

### T4C.5 Capacity Register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Maintenance covenant headroom | Revolver net leverage 7.50x | Threshold minus tested ratio | Exposure above 40% of USD 910 million | Exposure USD 67 million | Not applicable: test, not basket | Test inactive; USD 297 million exposure room | Not calculable: tested ratio not disclosed | Ready with Limitations | Moderate | Late trigger | Neutral — Stable | EV01; EV02 |
| Restricted payment capacity | Ratio restricted payments, Ratio Basket | Unlimited while pro forma net leverage not above 6.75x | No default | Proxy 5.50x after October 2024 | USD 4,348 million paid October 2024 | Not calculable: covenant EBITDA and cash not disclosed | Not calculable: covenant inputs absent | Provisional | Critical | Debt-funded distributions | Negative — Leverage Increase | EV08; EV26 |
| Restricted payment capacity | General basket clause (7), Grower Basket | Greater of USD 75 million and 3.0% of Consolidated EBITDA | No default | Proxy 3.0% of EBITDA As Defined USD 125.19 million | Not supplied: no usage record | Proxy USD 125.19 million | Not calculable: usage absent | Provisional | Low | Small leakage | Neutral — Stable | EV08 |
| Incremental facility capacity | Pari secured debt, Incremental Ratio Amount | Secured net leverage not above 5.00x | Same-priority secured; refinancing excepted | Proxy 4.22x | Not supplied: no usage record | Not calculable: covenant inputs absent | Not calculable: covenant inputs absent | Provisional | High | Pari dilution | Negative — Leverage Increase | EV05 |
| Debt incurrence capacity | Junior, unsecured, subordinated, Ratio Basket | Net leverage not above 7.25x | No default for subordinated debt | Proxy 5.50x | Not supplied: no usage record | Not calculable: covenant inputs absent | Not calculable: covenant inputs absent | Provisional | High | Layering | Negative — Leverage Increase | EV05; EV06 |
| Debt incurrence capacity | General basket clause (13), Grower Basket | Greater of USD 250 million and 10.0% | Borrower and guarantors | Proxy USD 417.30 million | Not supplied: no usage record | Proxy USD 417.30 million | Not calculable: usage absent | Provisional | Moderate | Free-standing debt | Negative — Leverage Increase | EV05 |
| Debt incurrence capacity | Foreign restricted subsidiary basket clause (14), Grower Basket | Greater of USD 450 million and 18.0% | Combined with preferred stock | Proxy USD 751.14 million | Not supplied: no usage record | Proxy USD 751.14 million | Not calculable: usage absent | Provisional | High | Structurally senior debt | Negative — Leverage Increase | EV06 |
| Debt incurrence capacity | Securitization basket clause (18), Grower Basket | Greater of USD 725 million and 20.0% | Non-recourse | Proxy USD 834.60 million | Facility USD 650 million fully drawn after October 2024 draw | Proxy USD 834.60 million | Not calculable: face-amount basis not reconciled | Provisional | Moderate | Receivables leave collateral | Neutral — Stable | EV02; EV06 |
| Unrestricted subsidiary capacity | Investment in Unrestricted Subsidiaries, Grower Basket | Greater of USD 250 million and 10.0% | Only newly formed or acquired subsidiaries designable | Proxy USD 417.30 million | Not supplied: no usage record | Proxy USD 417.30 million plus restricted-payment routes | Not calculable: usage absent | Provisional | Moderate | Drop-down of new businesses | Negative — Covenant Erosion | EV04; EV07 |
| Investment capacity | Investment in restricted subsidiaries | Uncapped | None in clause read | Not applicable: uncapped | Not supplied: no usage record | Uncapped | Uncapped | Formula Extracted Only | High | Transfers to non-guarantors | Negative — Covenant Erosion | EV07 |
| EBITDA add-back capacity | Cost savings clause (m) | Up to 25.0% of Consolidated EBITDA | Actions within 24 months | Proxy USD 1,043.25 million | Not supplied: no certificate | Proxy USD 1,043.25 million | Not calculable: realized savings absent | Provisional | High | Inflates all ratios | Negative — Covenant Erosion | EV03 |
| MFN protection | Yield Differential | 50 bp above existing margin | 18-month sunset; acquisition and long-dated carve-outs | Not applicable: protection term | Not applicable: protection term | Not applicable: protection term | Sunset dates depend on amendment effective dates not established | Ready with Limitations | Moderate | Repricing exposure | Negative — Refinancing Risk | EV11 |
| Guarantor / collateral release capacity | Notes guarantor release on loan release | Automatic | Capital-markets debt condition | Not applicable: trigger | Not applicable: trigger | Not calculable: entity values absent | Not calculable: entity values absent | Formula Extracted Only | Moderate | Notes follow loans | Neutral — Stable | EV19 |

Baskets are not summed: debt can be classified and reclassified across categories and restricted payments can be split across exceptions, so the same capacity can appear in more than one route.

### T4C.6 Debt/Lien/Priming Table

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental and incremental-equivalent | Up to 5.00x secured net | Provisional proxy 4.22x | Pari dilution of shared collateral | Higher leverage | Lower first-lien recovery | Secured notes and loans share dilution | EV05 |
| Junior lien, unsecured and subordinated | Up to 7.25x net | Provisional proxy 5.50x | Layering below first lien | Higher PD | First lien protected; existing subordinated notes diluted pari | Subordinated notes weaken most | EV05; EV06 |
| General and foreign debt baskets | Greater of USD 250 million and 10%; greater of USD 450 million and 18% | Proxy sizes only | Foreign debt structurally senior | Moderate | Non-guarantor creditors ahead | Favours secured over subordinated | EV05; EV06 |
| 2033 notes ratio debt | Fixed charge coverage above 2.0x; USD 400 million non-guarantor cap | Proxy 3.60x | Non-guarantor debt structurally senior | Moderate | Structural subordination | Notes test not binding | EV16 |
| MFN weakness | 50 bp, 18-month sunset, carve-outs | Formula only | Repricing of existing tranches | Refinancing cost | Not applicable: pricing only | Existing term-loan spread protection short | EV11 |

### T4C.7 Leakage Analysis Table

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio restricted payments | Unlimited at 6.75x | Ratio Basket | USD 4,348 million used October 2024; remaining not calculable | Cash leaves restricted group | Critical | Negative — Leverage Increase | EV08; EV26 |
| Notes restricted payments | Unlimited above 2.0x coverage; builder USD 400.0 million plus 50% net income | Ratio Basket and Builder Basket | Builder usage not supplied | Not binding before loan test | High | Negative — Leverage Increase | EV14; EV15 |
| Investment in restricted non-guarantors | Uncapped | General Basket | Not supplied: no usage record | Value outside guarantees | High | Negative — Covenant Erosion | EV07 |
| Investment in unrestricted subsidiaries | Greater of USD 250 million and 10% | Grower Basket | Not supplied: no usage record | Value outside restricted group | Moderate | Negative — Covenant Erosion | EV04; EV07 |
| Asset sale reinvestment | 75% productive assets or cash; reinvestment allowed | Prepayment / Reinvestment Capacity | Not supplied: no asset-sale data | Collateral proceeds stay collateral | Moderate | Neutral — Stable | EV24 |

Total leakage capacity is not calculable because ratio inputs and usage are missing, and the routes overlap through reclassification.

### T4C.8 Add-Back Inflation Table

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Restructuring, integration and optimisation costs | Consolidated EBITDA clause (d) | Uncapped | Not calculable: covenant bridge absent | Raises denominator for all ratios | More debt and distributions before limits | EV03 |
| Transaction and refinancing costs | Clause (e) | Uncapped, successful or not | Not calculable: covenant bridge absent | Same; recurring per earnings-quality analysis | Ratio headroom overstated | EV03; EV27 |
| Dividend Equivalent Payments | Clause (k) | Uncapped | Not calculable: covenant bridge absent | Distribution-linked payments raise covenant EBITDA | Distribution capacity partly self-funding in ratio terms | EV03 |
| Projected cost savings | Clause (m) | 25.0% of Consolidated EBITDA; 24 months | Proxy cap USD 1,043.25 million | Unrealised savings counted | Material ratio inflation | EV03 |
| Non-cash and deferred compensation | Consolidated Net Income clause (11) | Uncapped | Not calculable: covenant bridge absent | Excluded from earnings | Earnings quality rejects as recurring | EV03; EV27 |

### T4C.9 Flags Table

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio-unlimited distributions | 6.75x loans; above 2.0x notes | Repeat recapitalisation | Critical | Moderate | Relevant to fundamental credit, recovery and committee analysis | EV08; EV15 |
| Pari secured dilution | 5.00x secured net condition | First-lien recovery dilution | High | Moderate | Relevant to recovery and security-selection analysis | EV05 |
| Reclassification and fungibility | Debt and restricted payments reclassifiable | Double use of capacity | High | Formula Only | Relevant to capacity and recovery analysis | EV07; EV15 |
| Non-guarantor transfers | Uncapped restricted-subsidiary investment | Structural subordination | High | Formula Only | Relevant to structural priority and recovery analysis | EV07 |
| Notes collateral amendments by majority | 2033 indenture Section 9.02 | Collateral weakening | Moderate | High | Relevant to security-selection analysis | EV17 |
| Add-back inflation | Uncapped add-backs and 25% cost-savings cap | Overstated headroom | High | Formula Only | Relevant to earnings-quality and leverage analysis | EV03 |

### T4C.11 Priority Matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Ratio restricted payments at 6.75x | Critical | Moderate | Debt-funded distributions | Up | Up for all classes | Declarations and pro forma ratios | EV08 |
| 2 | Pari secured debt at 5.00x | High | Moderate | Collateral dilution | Up | Up for first lien | Secured issuance | EV05 |
| 3 | Add-back inflation of covenant EBITDA | High | Formula Only | Ratio headroom overstated | Up | Up | Certificate EBITDA versus EBITDA As Defined | EV03 |
| 4 | Uncapped investment into non-guarantors | High | Formula Only | Structural leakage | Neutral | Up | Obligor-group share | EV07 |
| 5 | Revolver springing test | Moderate | Moderate | Late trigger | Up when triggered | Neutral | Revolver usage above USD 364 million | EV01 |

### T4C.12 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Tested ratios | Maintenance and incurrence headroom unconfirmable | Headroom rows are proxies | Obtain certificate |
| Covenant EBITDA bridge | Consolidated EBITDA and Financial Covenant Consolidated EBITDA | Ratio capacity unreliable | All ratio capacity Provisional | Obtain bridge |
| Basket usage tracker | Usage of each basket | Remaining capacity undetermined | Remaining capacity not calculable | Obtain tracker |
| Covenant debt definition | Consolidated Total Indebtedness text | Numerator basis | Proxy numerators use carrying debt | Read definition |
| Guarantor and collateral schedules | Schedules and security agreement | Leakage and recovery incomplete | Structural routes unsized | Obtain schedules |
| MFN effective dates | Amendment Nos. 15, 16 and 17 effective dates | Sunset timing | No dated MFN event | Read amendment effectiveness provisions |

### Material claim lineage

| Claim | Material claim | Strongest lineage | Source |
|---|---|---|---|
| L1 | Revolver-only springing test at 7.50x above 40% exposure | Directly Sourced | d887611dex101.htm.jsonl, page 188 |
| L2 | No maintenance covenant in term loans and indentures | Directly Sourced | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L3 | Trigger not met; utilisation 7.36% | Calculated | calculation K01 |
| L4 | Unlimited restricted payments at 6.75x under loans | Directly Sourced | d887611dex101.htm.jsonl, page 181 |
| L5 | Unlimited restricted payments above 2.0x coverage under 2033 notes | Directly Sourced | d887611dex41.htm.jsonl, pages 75–76 |
| L6 | Pari secured at 5.00x and junior at 7.25x | Directly Sourced | d887611dex101.htm.jsonl, page 59 |
| L7 | Indicative post-dividend headroom 1.25x and 0.78x | Assumption-Based | calculation K09; calculation K10 |
| L8 | Add-back structure and 25% cost-savings cap | Directly Sourced | d887611dex101.htm.jsonl, pages 24–26 |
| L9 | Unrestricted designation limited; investment cap | Directly Sourced | d887611dex101.htm.jsonl, pages 61 and 81 |
| L10 | Loan sacred rights and open-offer non-pro-rata | Directly Sourced | d887611dex101.htm.jsonl, pages 204–205 |
| L11 | Notes majority control of security documents; ranking protected | Directly Sourced | d887611dex41.htm.jsonl, pages 115–117 |
| L12 | Obligor group 79.27% of sales | Calculated | calculation K14 |
| L13 | Package aggressive at 4 out of 5 | Analyst Inference | Covenant feature register |
| L14 | First-lien enforcement control | Insufficient Information | d887611dex41.htm.jsonl, page 30 |
| L15 | Remaining basket capacity | Insufficient Information | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

Field coverage counts the source gate plus the 31 required registers, all present; rows that record missing evidence count as present structure, not as evidence.

## Calculations

All money amounts are consolidated USD millions; ratios are times unless stated. Proxy ratios substitute EBITDA As Defined and total reported cash for undisclosed covenant EBITDA and unrestricted cash, so they are indicative and not covenant calculations. Year-end figures from the financial foundation are shown with the pro forma figure after the October 2024 dividend payment; the October 2024 securitization draw leaves net debt unchanged at USD 18,619 million and net leverage at 4.88x on reported EBITDA, and after the dividend Financial foundation states net debt of USD 22,967 million and net leverage of 6.02x on reported EBITDA.

| ID | Period / units | Formula and inputs | Result | Source |
|---|---|---|---|---|
| K01 | 2024-09-30; fraction and % | Revolving exposure 67 / commitments 910 | 0.073626373626373626373626373626373626374, 7.36% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K02 | 2024-09-30; USD million | Trigger 910 × 0.40; check 364 / 910 | 364.00, matching the stated USD 364 million; 0.4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K03 | 2024-09-30; USD million | 364 − 67 | 297 of exposure before the test springs | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| K04 | After October 2024 dividend; x | Pro forma net debt 22967 / EBITDA As Defined 4173 | 5.5037143541816439012700694943685597891, displayed 5.50x | Financial foundation (CP-1) |
| K05 | 2024-09-30; USD million and x | Identified secured carrying debt 19534 − cash 6261 = 13273; 13273 / 4173 | 13273; 3.1806853582554517133956386292834890966, displayed 3.18x; pro forma after the October 2024 dividend in K06 and K07 | Financial foundation (CP-1) |
| K06 | After October 2024 dividend; USD million | 19534 − pro forma cash 1913 | 17621 | Financial foundation (CP-1) |
| K07 | After October 2024 dividend; x | 17621 / 4173 | 4.2226216151449796309609393721543254254, displayed 4.22x | Financial foundation (CP-1) |
| K08 | After October 2024 dividend; x | 7.50 − 5.50 | 2.00x revolver test proxy headroom | d887611dex101.htm.jsonl, page 188 |
| K09 | x | 6.75 − 5.50 after the dividend; 6.75 − 4.46 at year-end, where 4.46x is Financial foundation's net debt to EBITDA As Defined | 1.25x; 2.29x | d887611dex101.htm.jsonl, page 181; Financial foundation (CP-1) |
| K10 | x | 5.00 − 4.22 after the dividend; 5.00 − 3.18 at year-end | 0.78x; 1.82x | d887611dex101.htm.jsonl, page 59 |
| K11 | x | 7.25 − 5.50 after the dividend; 7.25 − 4.46 at year-end; 7.50 − 4.46 at year-end | 1.75x; 2.79x; 3.04x | d887611dex101.htm.jsonl, pages 59–60 and 188 |
| K12 | FY2024; x and percentage points | 3.60 − 2.00, where 3.60x is Financial foundation's EBITDA As Defined to net cash interest; 40 − 7.36 | 1.60x; 32.64 percentage points | d887611dex41.htm.jsonl, page 79; Financial foundation (CP-1) |
| K13 | FY2024 proxy; USD million | 4173 × 0.10; × 0.18; × 0.20; × 0.03; × 0.25 | 417.30; 751.14; 834.60; 125.19; 1043.25 | d887611dex101.htm.jsonl, pages 24, 59–61 and 180 |
| K14 | FY2024; fraction and USD million | Obligor-group net sales 6294 / consolidated 7940; 7940 − 6294 | 0.79269521410579345088161209068010075567, 79.27%; 1646 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K15 | 2024-09-30; USD million | Secured notes 2077 + 2727 + 1438 + 984 + 2180 + 1486; total 8642 + 10892 + 4581 + 486 + 262 + 17 | 10892; 24880, matching carrying debt | Financial foundation (CP-1) |

## Gaps

The gaps below restrict exact headroom, remaining capacity and first-lien enforcement conclusions; they do not change the provision-level reading of the executed documents.

| Gap | Severity | What is missing | Effect on conclusion | Source |
|---|---|---|---|---|
| First Lien Intercreditor Agreement | MATERIAL | Agreement dated 2019-02-13 and Joinders 1 to 6 | Enforcement control, standstill, proceeds sharing and release among first-lien classes not established | d887611dex41.htm.jsonl, page 30 |
| Covenant inputs | MATERIAL | Compliance certificate, covenant EBITDA, Consolidated Total Indebtedness, Unrestricted Cash, fixed charge coverage | All ratio headroom shown as proxies; exact headroom not established | d887611dex101.htm.jsonl, pages 24–27 |
| Security and other debt documents | MATERIAL | Guarantee and Collateral Agreement, guarantor schedule, other note indentures | Collateral values and note-level terms beyond the 2033 and 2027 notes not established | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–61 |
| Definitions and governing law | MINOR | Required Lenders, Material Acquisition, Permitted Liens and governing-law clauses not reviewed | Voting share and jurisdiction cells partial | d887611dex101.htm.jsonl, pages 204–205 |
| MFN sunset timing | MINOR | Effective dates of Amendments 15, 16 and 17 | MFN protection for each tranche ends 18 months after its amendment effective date; no dated event recorded because effective dates are not established | d887611dex101.htm.jsonl, page 144 |
| Basket usage | MATERIAL | Usage records | Remaining capacity not calculable | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

## Next module
The orchestrator selects the next module.
