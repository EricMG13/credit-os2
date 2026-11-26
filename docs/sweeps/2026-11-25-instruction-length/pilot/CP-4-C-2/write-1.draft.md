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
reporting_period: FY2024 (year ended 2024-09-30)
---

## Request
TransDigm Group Incorporated (issuer tdg), as of 2024-09-30, under the deep_credit_assessment pathway. Scope is the legal and covenant review, restricted-group and guarantee map, intercreditor analysis and covenant-capacity assessment of the supplied credit agreement and indentures, read against the supplied financial and business analyses.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement (agreement dated 2024-09-19) with the annexed conformed Second Amended and Restated Credit Agreement of TransDigm Inc. (borrower) and TransDigm Group Incorporated (holdings) | not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Rank 1 controlling document: EBITDA and ratio definitions, debt, lien, investment and restricted-payment baskets, incremental and MFN terms, springing financial covenant, events of default, amendment and release mechanics, guarantor joinder and equity pledge |
| d887611dex41.htm.jsonl | Execution-version indenture for the 6.000% senior secured notes due 2033 (dated 2024-09-19) | not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Rank 1 for the 2033 secured notes: restricted payments, ratio debt, permitted liens, guarantee and lien release, amendment thresholds, intercreditor reference |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 (dated 2019-11-13) | not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Rank 1 for the 2027 subordinated notes: payment blockage and turnover |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 (signature date) | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Covenant summary, maintenance-covenant description, compliance statement, revolver usage, guarantor structure and obligor-group summary financials |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source set, temporal boundary and legal-coverage gaps |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying and principal debt, EBITDA and EBITDA As Defined, net leverage and the October 2024 post-balance-sheet adjustment |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation facts, ownership edge and distribution behaviour |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Rejected and unresolved add-backs used to judge covenant EBITDA inflation |

## Findings

### Bottom line
TransDigm's debt documents give creditors almost no maintenance protection and leave further debt-funded distributions governed mainly by incurrence ratios, so legal terms will not stop releveraging before stress; protection rests on ratio tests whose covenant values are undisclosed.

The bank agreement allows unlimited restricted payments at pro forma covenant net leverage up to 6.75x, and the 2033 secured notes allow them at fixed-charge cover above 2.00x; pari secured debt can be added up to 5.00x secured net leverage and total debt up to 7.25x. The only maintenance test is a springing 7.50x revolver covenant, inactive at year-end because revolver exposure was at most 7.36% against a 40% trigger. We score the package aggressive, the fourth of five rubric levels, on a provisional basis: the intercreditor agreement, the security documents and seven of the nine note indentures are not in the source set.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 58–60; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, pages 75–76; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01

### Key findings
- **Covenant protection gives no early warning of stress.** Term loans and notes carry no maintenance test; the revolver test applies only above 40% usage, leaving USD 297 million of further drawings before it bites, and a breach becomes a term-loan default only after revolving lenders terminate commitments or accelerate. Default is therefore likely to surface as a liquidity or payment event rather than a covenant trip, which raises loss given default because value erodes before creditors gain leverage.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01; calculation K06
- **Distribution capacity is uncapped in amount and limited only by ratio.** The bank's general restricted-payment permission requires only no default and pro forma covenant net leverage at or below 6.75x; the notes test fixed-charge cover above 2.00x and carry a separate builder basket, and a dividend permitted at declaration may be paid within 60 days. On the financial-foundation measure, net leverage on reported EBITDA was 4.88x at year-end and 6.02x pro forma for the October 2024 dividend payment, with pro forma net debt of USD 22,967 million; the covenant figure, which nets only unrestricted cash and uses the wider covenant EBITDA, is not established.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 70–76; Financial foundation (CP-1)
- **Lien dilution is the main loss-given-default channel for first-lien holders.** Pari secured debt may be added up to 5.00x covenant secured net leverage, incremental facilities also within 7.25x total net leverage, and the agent must extend the collateral to new pari or junior secured debt on the borrower's request without lender consent. Yield protection on incremental term loans is 50 bp with an 18 months sunset and an acquisition carve-out, and none was found for the separate ratio-debt basket. The September 2024 recapitalisation shows the route in use: USD 3,000 million of new secured debt funded a distribution.
Basis: d887611dex101.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 144–146; d887611dex101.htm.jsonl, page 205; Business & governance (CP-1A)
- **Covenant earnings are wider than the earnings the evidence supports.** Covenant EBITDA adds back acquisition, refinancing and non-cash compensation costs, dividend-equivalent payments and projected cost savings up to 25% of EBITDA within 24 months. The annual report ties the revolver ratio to EBITDA As Defined of USD 4,173 million, while the earnings-quality analysis rejected USD 345 million of comparable add-backs and supports only USD 3,813 million, so every ratio test and EBITDA-linked basket is measured on the inflated base.
Basis: d887611dex101.htm.jsonl, pages 23–26; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Earnings quality (CP-1D)
- **Value can leave the guarantor group through investments more easily than through designation.** Investments in any restricted subsidiary, including non-guarantors, are uncapped; a general basket of the greater of USD 500 million and 25% of total assets (about USD 6,396.5 million using consolidated assets as a proxy) and unlimited investments at 5.75x net leverage add further room. Only newly formed or acquired subsidiaries can be designated unrestricted. Non-guarantor subsidiaries already account for about 20.73% of sales and 22.27% of assets, and all notes are structurally subordinated to their liabilities.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; calculation K10; calculation K13; calculation K19
- **Lender control is majority-based and the uptier defence is incomplete in the text reviewed.** Required Lenders are more than 50%; every-lender consent protects pro rata sharing and the release of all or substantially all collateral or of material guarantors, but the listed every-lender rights do not include subordination of liens or payment, and a majority can permit non-pro-rata prepayments through offers made to a whole class. Secured noteholders need a two-thirds vote to release collateral or adversely change the intercreditor agreement, and their guarantees fall away when the bank guarantees are released.
Basis: d887611dex101.htm.jsonl, page 71; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, page 118; d887611dex41.htm.jsonl, page 122

### Contrary evidence and what would change the view
The strongest counter-case is that the ratio tests are real constraints, not formalities. The 6.75x distribution test, the 5.00x secured test and the 7.25x total test all apply after pro forma effect for the transaction and its financing; the revolver covenant and its definitions can be amended only by revolving lenders; existing subsidiaries cannot be designated unrestricted; every-lender consent protects collateral and guarantor release and pro rata sharing; and the issuer states it complied with all debt covenants at year-end, with no liability-management transaction in the record. That case would win if a compliance certificate showed covenant net leverage close to 6.75x after the October 2024 payment, which would make the distribution test binding and lower leakage severity, or if the full amendment section and the intercreditor agreement contained anti-subordination and enforcement protections absent from the text reviewed, which would move amendment mechanics to market-standard. The view would harden to highly creditor-adverse if a further debt-funded distribution were declared or an amendment added non-pro-rata exchange or subordination permissions. For implementation, the challenge argues for sizing first-lien exposure on the dilution route rather than on the absence of a covenant breach, and for monitoring incurrence certificates rather than maintenance tests.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–206; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Business & governance (CP-1A)

### Limitations
- The first-lien intercreditor agreement is referenced but not supplied, so who controls enforcement and collateral release between bank lenders and secured noteholders is not established; intercreditor conclusions cover only payment rank, guarantee-release mechanics and the subordinated-note blockage, and first-lien recovery control is left unscored.
Basis: d887611dex41.htm.jsonl, page 30
- Covenant-defined ratios, a compliance certificate and basket usage are not disclosed, so every test except the revolver-usage trigger remains a formula; the distance to the 6.75x distribution and 5.00x secured tests is unknown, which keeps leakage and priming severity as capacity judgements rather than measured headroom.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62
- Seven of the nine note indentures are not supplied; conclusions on the 2028 to 2032 secured notes and the 2029 subordinated notes rest on the annual report's statement that their covenants are substantially similar, so a looser or tighter term in any of them would change the tranche-level comparison.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61
- The guarantee and collateral agreement, security schedules and subsidiary lists are not supplied, so excluded assets, perfection limits and named guarantors are not established; the collateral map is qualitative and the non-guarantor share rests on a filed obligor-group summary, not entity values.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59
- Total assets, consolidated total indebtedness and the notes' bank-indebtedness lien definitions were not read, so basket sizes computed on EBITDA As Defined and consolidated assets are provisional proxies; they indicate scale but do not establish covenant capacity.
Basis: calculation K14; calculation K19

### Capital structure
The supplied documents govern only the bank facility, the 2033 secured notes and the 2027 subordinated notes; the rest of the structure is read through the annual report.

| Instrument | Rank and security | Principal (USD m) | Carrying value (USD m) | Governing document in source set | Source |
|---|---|---|---|---|---|
| Revolving credit facility (USD 910 commitment; 67 letters of credit; 843 available) | Senior secured first lien; matures 2029-02-27 | Not supplied: undrawn | Not supplied: undrawn | Credit agreement (supplied) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K, L | Senior secured first lien; Term SOFR plus 250 bp to 275 bp | 8702 | 8642 | Credit agreement (supplied) | Financial foundation (CP-1) |
| Secured notes 2028, 2029, 2030, 2031, 2032, 2033 | Senior secured, equal payment rank with bank debt | 11000 | 10892 | 2033 indenture only (supplied); five not supplied | Financial foundation (CP-1) |
| Senior subordinated notes 2027, January 2029, May 2029 | Unsecured, subordinated to senior debt | 4600 | 4581 | 2027 indenture only (supplied); two not supplied | Financial foundation (CP-1) |
| Trade receivable securitization | Securitization entity, non-recourse basket; legal rank not established | 487 | 486 | Not supplied | Financial foundation (CP-1) |
| Finance leases and government refundable advances | Legal rank not established | Not supplied: no principal for leases | 279 | Not supplied | Financial foundation (CP-1) |
| Total carrying debt at 2024-09-30 | Year-end; excludes October 2024 securitization draw of USD 162.5 million | Not supplied: mixed bases | 24880 | Not applicable | Financial foundation (CP-1) |

### Covenant tests and headroom
Only the revolver-usage trigger and the borrowing condition can be measured; every ratio test lacks a disclosed covenant-defined value.

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger for the springing covenant (credit agreement §6.14) | max-ratio | 40.00% | 7.36% | Aggregate revolving exposure ÷ revolving commitments; exposure taken as USD 67 million letters of credit ÷ USD 910 million (K01) | 32.64% | Compliant — trigger not reached, covenant not tested | Upper bound: letters of credit cash-collateralised at 103% are excluded and their status is not stated | Covenant applies only once usage exceeds USD 364 million, leaving USD 297 million of draws before testing | Neutral — Stable | E01; E16 |
| Revolver borrowing condition (credit agreement §4.01(d)) | max-ratio | 35.00% | 7.36% | Same exposure measure after the proposed draw (K01) | 27.64% | Compliant — condition not engaged | Above USD 318.5 million exposure each draw requires the last-quarter ratio to be within the §6.14 level | Liquidity access tightens earlier than the covenant test | Neutral — Stable | E03; E16 |
| Springing consolidated net leverage covenant (credit agreement §6.14) | max-ratio | 7.50x | Not supplied: covenant-defined ratio not disclosed | (Consolidated Total Indebtedness − Unrestricted Cash) ÷ Financial Covenant Consolidated EBITDA, last four quarters | [Insufficient Information] — missing: current tested ratio | Not Calculable | 8.00x applies for the first four quarters after a Material Acquisition; test inactive at year-end | Revolver-only test; term lenders act only after revolver acceleration | Insufficient Information | E01; E02 |
| General restricted payments ratio permission (credit agreement §6.02, final paragraph) | max-ratio | 6.75x | Not supplied: covenant-defined ratio not disclosed | Pro forma Consolidated Net Leverage Ratio after the payment and its financing | [Insufficient Information] — missing: current tested ratio | Not Calculable | October 2024 dividend was declared on 2024-09-19; declaration-date ratio not disclosed | Unlimited distributions while at or below threshold | Insufficient Information | E04 |
| Incremental facility and junior or unsecured ratio debt (credit agreement §2.24(c)(iii); Permitted Indebtedness (12)(y), (17)) | max-ratio | 7.25x | Not supplied: covenant-defined ratio not disclosed | Pro forma Consolidated Net Leverage Ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Basket usage and pro forma inputs not disclosed | Ratio debt has no fixed cap | Insufficient Information | E07; E09 |
| Pari secured incremental and ratio debt (credit agreement §2.24(c)(iv); Permitted Indebtedness (12)(x)) | max-ratio | 5.00x | Not supplied: covenant-defined ratio not disclosed | (Consolidated Secured Debt − Unrestricted Cash) ÷ Consolidated EBITDA | [Insufficient Information] — missing: current tested ratio | Not Calculable | Analytical gross secured leverage of 5.12x on reported EBITDA is a different quantity | Pari first-lien dilution capacity | Insufficient Information | E07; E09 |
| Joint-venture investment basket (Permitted Investments (11)) | max-ratio | 7.00x | Not supplied: covenant-defined ratio not disclosed | Pro forma Consolidated Net Leverage Ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Also capped at greater of USD 1,000 million and 40% of EBITDA | Value transfer to joint ventures | Insufficient Information | E08 |
| Unlimited general investments (Permitted Investments (20)) | max-ratio | 5.75x | Not supplied: covenant-defined ratio not disclosed | Pro forma Consolidated Net Leverage Ratio; also no revolver loans and at least USD 200 million unrestricted cash | [Insufficient Information] — missing: current tested ratio | Not Calculable | Revolver condition met at year-end (undrawn); ratio unknown | Unlimited investment leakage when met | Insufficient Information | E08 |
| 2033 notes ratio debt (indenture §4.09) | min-ratio | 2.00x | Not supplied: covenant-defined coverage not disclosed | Consolidated EBITDA ÷ consolidated fixed charges, pro forma; strictly greater than threshold | [Insufficient Information] — missing: current tested ratio | Not Calculable | Non-guarantor ratio debt capped at USD 400 million | Bond debt capacity looser than bank tests | Insufficient Information | E15 |
| 2033 notes ratio restricted payments (indenture §4.07) | min-ratio | 2.00x | Not supplied: covenant-defined coverage not disclosed | Pro forma Consolidated Fixed Charge Coverage Ratio; strictly greater than threshold | [Insufficient Information] — missing: current tested ratio | Not Calculable | Bank 6.75x test is the tighter constraint while bank debt is outstanding | Bond holders rely on bank covenant for distribution discipline | Insufficient Information | E14 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for springing covenant | 40.00 | 7.36 | 32.64 percentage points | At or below 40.00 means covenant not tested | % of revolving commitments | Credit agreement §6.14 and annual report; exposure is an upper bound using letters of credit of USD 67 million |
| Revolver borrowing condition | 35.00 | 7.36 | 27.64 percentage points | At or below 35.00 means no ratio condition on new draws | % of revolving commitments | Credit agreement §4.01(d); same exposure basis |
| Springing net leverage covenant | 7.50 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current tested ratio not disclosed | At or below 7.50 passes | x | Credit agreement §6.14; 8.00 after a Material Acquisition; inactive at year-end |
| Restricted payments ratio permission | 6.75 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current tested ratio not disclosed | At or below 6.75 permits payment | x | Credit agreement §6.02 final paragraph; pro forma incurrence test |
| Total net leverage incurrence test | 7.25 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current tested ratio not disclosed | At or below 7.25 permits debt | x | Credit agreement §2.24(c) and Permitted Indebtedness (12), (17) |
| Secured net debt incurrence test | 5.00 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current tested ratio not disclosed | At or below 5.00 permits pari secured debt | x | Credit agreement §2.24(c) and Permitted Indebtedness (12) |
| Joint-venture investment test | 7.00 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current tested ratio not disclosed | At or below 7.00 permits investment | x | Credit agreement Permitted Investments (11) |
| Unlimited investment test | 5.75 | Not supplied: covenant-defined ratio not disclosed | Not supplied: current tested ratio not disclosed | At or below 5.75 permits investment | x | Credit agreement Permitted Investments (20) |
| Notes ratio debt coverage test | 2.00 | Not supplied: covenant-defined coverage not disclosed | Not supplied: current tested ratio not disclosed | Strictly above 2.00 permits debt | x | 2033 indenture §4.09 |
| Notes restricted payments coverage test | 2.00 | Not supplied: covenant-defined coverage not disclosed | Not supplied: current tested ratio not disclosed | Strictly above 2.00 permits payment | x | 2033 indenture §4.07 |

Most rows are incurrence permissions rather than maintenance tests, and only the two usage rows carry measured values; this is not a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement among bank collateral agent, secured-note trustees and collateral agents | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs first-lien enforcement and release; agreement not in source set |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement | Historical — most recent amendment that impacted the restrictive covenants, executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets current covenant baseline; Tranche I and K MFN sunsets run from its effective date |
| 2024-07-12 | day | 2024-11-07 | Securitization facility amended: capacity USD 450 million to USD 650 million, maturity 2025-07-11 | Historical — amended the Securitization Facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Uses the securitization debt basket (greater of USD 725 million and 20% of EBITDA) |
| 2024-09-19 | day | 2024-09-19 | Joinder No. 6 to the First Lien Intercreditor Agreement for the 2033 secured notes | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million of pari first-lien notes to shared collateral |
| 2027-09-15 | day | 2024-09-19 | 2033 secured notes Initial Redemption Date | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Opens issuer call optionality on the 2033 notes; relevant to refinancing and relative value |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report 2024 as used by Business & governance; both Delaware corporations, United States |
| TransDigm Group Incorporated | Holdings guarantee, senior secured basis | Guarantee | Secured notes | Annual report 2024 guarantor information; US issuer; governing-law clause not read |
| TransDigm Group Incorporated | Holdings guarantee, senior subordinated unsecured basis | Guarantee | Senior subordinated notes | Annual report 2024 guarantor information; US issuer; governing-law clause not read |
| Domestic Restricted Subsidiaries | Subsidiary guarantees, senior secured basis | Guarantee | Secured notes | Annual report 2024; 2029–2033 notes guarantors are bank borrowers or guarantors; United States |
| Domestic Restricted Subsidiaries | Subsidiary guarantees, senior subordinated basis | Guarantee | Senior subordinated notes | Annual report 2024 guarantor information; United States |
| TransDigm UK | Guarantee of 2028 secured notes and subordinated notes | Guarantee | Secured notes | Annual report 2024 names TransDigm UK for 2028 secured notes; United Kingdom entity; bank status not established |
| TransDigm Inc. | Grants first-priority liens on Collateral | Security | Senior secured credit facility | Credit agreement §5.11 and Guarantee and Collateral Agreement reference; United States; collateral documents not supplied |
| Loan Parties | Pledge 65% voting and 100% non-voting stock of first-tier foreign subsidiaries | Security | Foreign Restricted Subsidiaries | Credit agreement §5.11(b); US loan parties; foreign assets not pledged by this clause |
| Secured notes | Structurally subordinated to liabilities of non-guarantor subsidiaries | Structural claim | Non-guarantor subsidiaries | Annual report 2024 guarantor information; consolidated US group |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facility | Equal right of payment | Payment rank | Secured notes | Annual report 2024 guarantor information and 2033 indenture; US documents |
| Secured notes | Senior in right of payment | Payment rank | Senior subordinated notes | Annual report 2024; 2027 subordinated indenture; US documents |
| Senior secured credit facility | Shares first-priority Collateral under First Lien Intercreditor Agreement | Security rank | Secured notes | 2033 indenture definition of Intercreditor Agreement; agreement itself not supplied; jurisdiction not established |
| Bank Indebtedness representative | May block payments for up to 179 days in any 360 days | Standstill | Senior subordinated notes | 2027 subordinated indenture §10.03; US indenture |
| Senior secured credit facility | Guarantor release under bank documents releases notes guarantee and its liens | Release | Secured notes | 2033 indenture §10.07(e) and §12.07; US indenture |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 11 |
| Calculated | 4 |
| Assumption-Based | 0 |
| Analyst Inference | 4 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 1 |
| Insufficient Information | 3 |
| Fields present | 32 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 2 |

### Analytical appendix — complete canonical registers

The headroom table sits under Covenant tests and headroom above; every other register follows. Evidence identifiers in the registers resolve to the evidence table below.

### Evidence references

| Evidence ID | Provision or fact | Authority rank | Source |
|---|---|---|---|
| E01 | Credit agreement §6.14: revolver-only covenant, net leverage at most 7.50x (8.00x for four quarters after a Material Acquisition) if revolving exposure exceeds 40% of commitments; amendable only by Required Revolving Lenders | 1 | d887611dex101.htm.jsonl, page 188 |
| E02 | Article VII(k) and (l): Article VI breach (other than §6.14) is an immediate event of default; §6.14 breach is a default for term lenders only after revolver termination or acceleration | 1 | d887611dex101.htm.jsonl, page 191 |
| E03 | §4.01(d): draws taking exposure above 35% require last-quarter net leverage within the §6.14 level | 1 | d887611dex101.htm.jsonl, page 165 |
| E04 | §6.02: restricted payments definition; 60-day declaration rule; management equity basket (greater of USD 50 million and 2% of EBITDA, capped by greater of USD 100 million and 4%); general basket greater of USD 75 million and 3% of EBITDA; unlimited at pro forma net leverage at or below 6.75x and no default | 1 | d887611dex101.htm.jsonl, pages 177–181 |
| E05 | Consolidated EBITDA add-backs: taxes, interest, non-cash charges, unusual and restructuring costs, transaction and refinancing costs, dividend-equivalent payments, cost savings within 24 months capped at 25% of EBITDA | 1 | d887611dex101.htm.jsonl, pages 23–24 |
| E06 | Consolidated Net Income exclusions (non-cash compensation, purchase accounting, unusual items); Consolidated Net Leverage Ratio and Consolidated Secured Net Debt Ratio net Unrestricted Cash; pro forma for acquisitions | 1 | d887611dex101.htm.jsonl, pages 25–27 |
| E07 | Permitted Indebtedness (6) to (18): capex debt greater of USD 250 million and 10%; acquired debt greater of USD 150 million and 6%; ratio senior secured at 5.00x and junior or unsecured at 7.25x with maturity and life conditions; general basket greater of USD 250 million and 10%; foreign subsidiary debt greater of USD 450 million and 18%; subordinated debt at 7.25x; securitization greater of USD 725 million and 20%; borrower may classify and divide | 1 | d887611dex101.htm.jsonl, pages 57–61 |
| E08 | Permitted Investments: uncapped in restricted subsidiaries; unrestricted subsidiaries greater of USD 250 million and 10%; general greater of USD 500 million and 25% of Total Assets; joint ventures greater of USD 1,000 million and 40% at 7.00x; acquisitions with USD 100 million liquidity; unlimited at 5.75x, no revolver loans and at least USD 200 million unrestricted cash | 1 | d887611dex101.htm.jsonl, pages 61–63 |
| E09 | §2.24: incremental conditions net leverage at most 7.25x and secured net debt at most 5.00x; MFN 50 bp yield differential with 18 months sunset and acquisition and late-maturity carve-outs; more favourable terms extend to existing lenders | 1 | d887611dex101.htm.jsonl, pages 144–146 |
| E10 | §9.02: Required Lenders more than 50%; every-lender rights listed in (A) to (G); agent adds pari or junior secured debt to collateral on request; majority may permit non-pro-rata class offers and loan modification offers; automatic lien release on permitted dispositions | 1 | d887611dex101.htm.jsonl, pages 71 and 204–206 |
| E11 | Unrestricted Subsidiary: only newly acquired or formed subsidiaries may be designated, subject to §6.02 and §6.16 and no recourse debt; Unrestricted Cash excludes cash subject to non-loan liens | 1 | d887611dex101.htm.jsonl, page 81 |
| E12 | §5.11: domestic subsidiaries other than immaterial, unrestricted and securitization entities must join within 20 business days; 100% domestic and 65% voting first-tier foreign equity pledged | 1 | d887611dex101.htm.jsonl, pages 173–174 |
| E13 | Article VII(e): cross-payment default and cross-acceleration to Material Indebtedness | 1 | d887611dex101.htm.jsonl, page 189 |
| E14 | 2033 indenture §4.07: builder of USD 400 million plus 50% cumulative net income since 1 October 2010 plus equity proceeds; unlimited at fixed-charge cover above 2.0x; reclassification permitted | 1 | d887611dex41.htm.jsonl, pages 70 and 75–76 |
| E15 | 2033 indenture §4.09: ratio debt at fixed-charge cover above 2.0x; non-guarantor ratio debt at most USD 400 million | 1 | d887611dex41.htm.jsonl, page 79 |
| E16 | Annual report: revolver USD 910 million, letters of credit USD 67 million, USD 843 million available; maintenance covenant description at 40% (USD 364 million); compliance with all covenants; no maintenance covenants in term loans and indentures | 3 for compliance statement; 4 for covenant summary | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| E17 | Annual report guarantor structure and obligor-group summary: net sales USD 6,294 million; current assets 7,813, goodwill 8,186, other non-current 3,889 (USD millions) | 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| E18 | 2033 indenture: Intercreditor Agreement definition and joinders; guarantee release §10.07; lien release §12.07; two-thirds vote for collateral release and adverse intercreditor change §9.02; Permitted Liens include liens securing Bank Indebtedness | 1 | d887611dex41.htm.jsonl, pages 30, 39–40, 118, 122 and 136 |
| E19 | 2027 subordinated indenture §10.03 payment blockage up to 179 days, one per 360 days for non-bank senior debt; §10.05 paid-over provision heading | 1 | d826058dex41.htm.jsonl, page 107 |
| E20 | Financial foundation, Business & governance and Earnings quality inputs as listed in Sources | Supplied analysis | Financial foundation (CP-1); Business & governance (CP-1A); Earnings quality (CP-1D) |

### T4.1 and T4C.1 Source gate

| Source | Status | Authority rank | Use | Limitation |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Executed amendment with annexed conformed credit agreement | 1 | Controls bank covenants and capacity formulas | Schedules, Guarantee and Collateral Agreement and Amendment No. 16 text not reviewed; some defined terms not read |
| d887611dex41.htm.jsonl | Executed indenture | 1 | Controls 2033 secured notes | Other five secured-note indentures not supplied |
| d826058dex41.htm.jsonl | Executed indenture | 1 | Controls 2027 subordinated notes subordination | Two other subordinated indentures not supplied |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Filed annual report | 3 (compliance statement), 4 (summary) | Usage, compliance and guarantor summary | Published after the as-of date; no covenant ratio disclosed |
| Financial foundation (CP-1) | Supplied analysis | Financial input | Debt, EBITDA, leverage, subsequent events | Not covenant-defined |

Gate result: an executed governing credit agreement and indentures are available, with missing supplements, so the status is Completed with Limitations; capacity calculations are restricted because covenant inputs and usage are not disclosed, and the liability-management overlay is incomplete because no refinancing and liability-management analysis was supplied.

### Subsequent events

| Event date | Event | Capacity or perimeter effect | Treatment | Source |
|---|---|---|---|---|
| 2024-10-16 | Remaining securitization availability of USD 162.5 million drawn | Uses securitization debt basket; facility fully drawn at USD 650 million; no perimeter change | Pro forma only; not in year-end figures | Business & governance (CP-1A) |
| 2024-10-18 | Special dividend USD 4,216 million and equivalents USD 132 million paid (USD 4,348 million) | Restricted-payment usage declared 2024-09-19 and paid within the 60-day window; pro forma reported-EBITDA net leverage 6.02x, net debt USD 22,967 million | Pro forma RP usage signal; never booked into period figures | Financial foundation (CP-1); Business & governance (CP-1A) |

### Conflicts and definition log

| Conflict | Figures or terms and roles | Resolution | Source |
|---|---|---|---|
| Revolver usage threshold | §6.14 covenant trigger 40%; §4.01(d) borrowing condition 35%; annual report 40% (USD 364 million) | Two different tests, both retained; 35% governs draw access earlier | d887611dex101.htm.jsonl, pages 165 and 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Material Acquisition step-up period | §6.14 says first four fiscal quarters; §4.01(d) refers to first two fiscal quarters | Drafting inconsistency preserved; §6.14 governs the covenant, §4.01(d) the draw condition | d887611dex101.htm.jsonl, pages 165 and 188 |
| Covenant debt versus carrying debt | Covenant: Consolidated Total Indebtedness of the borrower less Unrestricted Cash (definition not read); analysis: carrying debt USD 24,880 million, principal-plus-reconciliation basis USD 25,068 million | Governing definition applies; covenant debt figure not established; no reconciliation | d887611dex101.htm.jsonl, pages 26–27; Financial foundation (CP-1) |
| Covenant EBITDA versus reported EBITDA | Covenant Consolidated EBITDA with add-backs and cost savings; annual report says revolver ratio uses EBITDA As Defined USD 4,173 million; reported EBITDA USD 3,813 million; supported-only USD 3,813 million | Covenant tests use the legal definition; Financial Covenant Consolidated EBITDA definition not located | d887611dex101.htm.jsonl, pages 23–27; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Earnings quality (CP-1D) |
| Securitization amount | Notes indenture counts face amount of receivable interests as Indebtedness; balance sheet carrying USD 486 million, gross USD 487 million, drawn USD 487.5 million | All retained by role | d887611dex41.htm.jsonl, page 30; Financial foundation (CP-1) |
| Secured leverage measures | Covenant secured net debt test 5.00x (net of unrestricted cash, covenant EBITDA); analytical identified secured carrying debt ÷ reported EBITDA 5.12x | Different quantities; analytical figure is not a covenant reading | d887611dex101.htm.jsonl, page 27; Financial foundation (CP-1) |
| Non-debt float | Contract liabilities USD 177 million and dividend payable USD 4,216 million at year-end sit outside debt baskets as reported debt; Indebtedness definition in credit agreement not fully read | Treated as outside covenant debt pending definition; capacity-relevant gap | Financial foundation (CP-1) |

### T4.2 Controlling Document Register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second Amended and Restated Credit Agreement as annexed to Amendment No. 17 | Credit agreement (conformed annex) | Amendment No. 17, 2024-09-19 | Executed amendment; annex conformed | Controls bank covenants, baskets, EBITDA, amendments, releases | Primary constraint on distributions and debt; covenant tighter than notes | E01–E13 |
| 1 | Indenture for 6.000% senior secured notes due 2033 | Indenture | 2024-09-19 | Executed | Controls 2033 notes covenants, guarantees, liens, amendments | Looser coverage-based tests; guarantee follows bank | E14; E15; E18 |
| 1 | Indenture for 5.500% senior subordinated notes due 2027 | Indenture | 2019-11-13 | Executed | Controls subordination and blockage | Junior recovery and payment blockage | E19 |
| 2 | First Lien Intercreditor Agreement with joinders 1–6 | Intercreditor agreement | 2019-02-13; Joinder No. 6 2024-09-19 | Referenced only; not supplied | Would control first-lien enforcement and release | Enforcement control not established | E18 |
| 3 | Annual report compliance statement and covenant description | Filed report | 2024-11-07 | Filed | Usage and compliance only | No tested ratio disclosed | E16 |
| 4 | Annual report guarantor information | Filed summary | 2024-11-07 | Filed | Guarantor structure and obligor-group summary | Structural subordination evidence | E17 |

### T4.3 Covenant Feature Register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at most 7.50x (8.00x for four quarters after Material Acquisition), tested only when revolving exposure exceeds 40% | Credit agreement §6.14 | No test for term loans or notes; early warning absent | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E01 |
| Financial covenant default | §6.14 breach is a revolver default; term lenders gain a default only after revolver termination or acceleration | Credit agreement Article VII(l) | Term lenders stand still behind revolver decision | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E02 |
| Revolver draw condition | Above 35% exposure, draws need last-quarter ratio within §6.14 level | Credit agreement §4.01(d) | Liquidity access tightens before covenant applies | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | E03 |
| Ratio restricted payments | Unlimited restricted payments if no default and pro forma net leverage at or below 6.75x | Credit agreement §6.02 final paragraph | Uncapped distributions; debt-funded payouts permitted while within ratio | Negative — Leverage Increase | Not assessed: no comparative source supplied | E04 |
| Fixed restricted payment baskets | 60-day payment after permitted declaration; management equity greater of USD 50 million and 2% of EBITDA per year with carry-forward capped at greater of USD 100 million and 4%; general greater of USD 75 million and 3% | Credit agreement §6.02(1), (4), (7) | Grower baskets rise with covenant EBITDA | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E04 |
| Notes restricted payments | Builder USD 400 million plus 50% of cumulative net income since October 2010 plus equity; unlimited at fixed-charge cover above 2.0x | 2033 indenture §4.07 | Bond test materially looser than bank test | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E14 |
| Incremental facilities | Ratio-based: total net leverage at most 7.25x and secured net debt at most 5.00x; no fixed amount identified in clauses read | Credit agreement §2.24(c) | Pari first-lien dilution capacity grows with EBITDA | Negative — Leverage Increase | Not assessed: no comparative source supplied | E09 |
| Incremental equivalent ratio debt | Pari secured at 5.00x, junior secured or unsecured at 7.25x, maturity and life no shorter than term loans, collateral only | Permitted Indebtedness (12) | Pari secured notes outside the incremental MFN | Negative — Leverage Increase | Not assessed: no comparative source supplied | E07 |
| Fixed and grower debt baskets | Capex, acquired, general, foreign subsidiary, securitization baskets; borrower may divide and reclassify | Permitted Indebtedness (7), (11), (13), (14), (18) | Stacked baskets; foreign subsidiary debt structurally senior | Negative — Leverage Increase | Not assessed: no comparative source supplied | E07 |
| Notes ratio debt | Debt at fixed-charge cover above 2.0x; non-guarantor ratio debt at most USD 400 million | 2033 indenture §4.09 | Coverage tests permit more debt than bank leverage tests | Negative — Leverage Increase | Not assessed: no comparative source supplied | E15 |
| MFN | 50 bp yield differential; 18 months sunset per tranche; carve-outs for acquisition debt and later maturities | Credit agreement §2.24 | Repricing protection narrow and temporary | Negative — Refinancing Risk | Not assessed: no comparative source supplied | E09 |
| Investments | Uncapped in restricted subsidiaries; unrestricted greater of USD 250 million and 10%; general greater of USD 500 million and 25% of Total Assets; joint ventures at 7.00x; unlimited at 5.75x | Permitted Investments (1), (10), (11), (20) | Value transfer to non-guarantors and unrestricted vehicles | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E08 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries may be designated; no recourse debt | Unrestricted Subsidiary definition | Blocks designation of existing operating subsidiaries; drop-down still possible into a new subsidiary | Neutral — Stable | Not assessed: no comparative source supplied | E11 |
| EBITDA add-backs | Transaction, refinancing, restructuring, non-cash compensation, dividend-equivalent and cost-savings add-backs, savings capped at 25% within 24 months | Consolidated EBITDA definition | Inflates denominator of all ratio tests and grower baskets | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E05; E06 |
| Guarantor coverage | Domestic subsidiaries join within 20 business days; excludes immaterial, unrestricted and securitization entities; foreign equity pledge 65% voting | Credit agreement §5.11 | Foreign subsidiaries outside guarantee and asset security | Neutral — Stable | Not assessed: no comparative source supplied | E12 |
| Collateral release | Automatic release on permitted disposition to non-loan party; release of all or substantially all needs every lender | Credit agreement §9.02(b)(G), (c) | Asset sales can shrink collateral without consent | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E10 |
| Amendments and voting | Required Lenders more than 50%; every-lender rights for economics, pro rata sharing, voting thresholds, material guarantor and collateral release; majority may permit non-pro-rata class offers | Credit agreement §9.02(b) | Subordination not listed among every-lender rights read | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E10 |
| Notes amendments | Majority generally; two-thirds for collateral release and adverse intercreditor changes | 2033 indenture §9.02 | Noteholder protection stronger than bank majority for collateral | Neutral — Stable | Not assessed: no comparative source supplied | E18 |
| Notes guarantee release | Guarantee and liens release when released under credit facilities and capital markets debt | 2033 indenture §10.07(e), §12.07 | Noteholder guarantee depends on bank decisions | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E18 |
| Subordinated payment blockage | Designated senior debt may block up to 179 days per 360 days | 2027 indenture §10.03 | Junior cash interruption in stress | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | E19 |
| Cross-default | Payment default at maturity or acceleration of Material Indebtedness | Credit agreement Article VII(e) | Default spreads across the structure | Negative — Refinancing Risk | Not assessed: no comparative source supplied | E13 |

### Step 4 to 8 provision findings
Definitions collectively widen permissions: the covenant EBITDA carries every category the earnings-quality analysis rejected plus a cost-savings add-back of up to 25% of EBITDA, the net leverage tests subtract all unrestricted cash, and acquisitions are included pro forma. Because baskets scale with that EBITDA, any add-back expands debt, restricted-payment and investment room at the same time; the covenant debt basis is the borrower's consolidated total indebtedness, whose text was not read, so its divergence from carrying debt is logged rather than reconciled.
Basis: d887611dex101.htm.jsonl, pages 23–27; Earnings quality (CP-1D)

Total incurrence capacity has no fixed ceiling: pari secured debt is bounded only by the 5.00x secured test and total debt by the 7.25x test, with fixed baskets stacking beside them and reclassification at the borrower's option. Priming inside the restricted group is available through foreign subsidiary debt and the securitization basket, which sit ahead of noteholders on those assets. The incremental MFN is 50 bp with an 18 months sunset and does not reach ratio debt issued as notes. Customer advances and the declared dividend payable are not in the reported debt totals; whether they fall within the covenant definition of Indebtedness is not established.
Basis: d887611dex101.htm.jsonl, pages 57–61; d887611dex101.htm.jsonl, pages 144–146; Financial foundation (CP-1)

Leakage capacity combines an uncapped ratio restricted-payment permission, uncapped investments in restricted non-guarantors and large general investment baskets. The designation limit restricts the classic transfer of an existing subsidiary but does not prevent a newly formed unrestricted subsidiary receiving assets through investment baskets. Collateral is released automatically on a permitted disposal, and the noteholders' guarantees follow the bank guarantees. Recovery by class therefore ranks first-lien bank and note claims together on guarantor collateral, behind non-guarantor creditors on about 22.27% of assets, with subordinated notes behind both and subject to blockage.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, page 122; d826058dex41.htm.jsonl, page 107; calculation K13

Lender control rests with a simple majority: Required Lenders can waive most covenants and events of default, can allow non-pro-rata prepayments through class-wide offers and loan-modification offers, and are not shown in the text reviewed to need every-lender consent to subordinate liens or payment. Only revolving lenders control the financial covenant. No equity cure was found in the sections read.
Basis: d887611dex101.htm.jsonl, pages 188 and 191; d887611dex101.htm.jsonl, pages 204–206

### T4.9 PD vs LGD Translation Table

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio restricted payments | Unlimited at 6.75x net leverage; notes at fixed-charge cover above 2.0x | Debt-funded distributions remove cash without earnings | High: releveraging capacity while performing | Moderate: lower asset cover for all classes | Distribution declarations and incurrence certificates | E04; E14 |
| Pari secured incurrence | Up to 5.00x secured net leverage; agent extends collateral on request | Shared collateral pool grows | Moderate | High: dilutes first-lien recovery | Secured issuance and collateral joinders | E07; E09; E10 |
| Springing covenant | Revolver-only test above 40% usage | No early creditor intervention | Moderate: defaults appear late as payment events | High: value erodes before control shifts | Revolver usage each quarter | E01; E02 |
| Add-back definitions | Cost savings to 25%; transaction and compensation add-backs | Denominator inflation expands every basket | Moderate | Moderate: more claims ahead of or beside existing debt | Gap between EBITDA As Defined and reported EBITDA | E05 |
| Non-guarantor value | About 20.73% of sales and 22.27% of assets outside obligor group; uncapped investments into restricted non-guarantors | Structural priority for subsidiary creditors | Low | High for notes and subordinated debt | Obligor-group share in annual report | E08; E17 |
| Amendment control | Majority lenders; subordination not in every-lender list reviewed | Uptier or non-pro-rata exchange possible by majority | Low while performing | High for non-participating lenders in stress | Amendment filings and lender group formation | E10 |
| Subordinated blockage | Up to 179 days blockage | Junior interest can be stopped | Moderate for subordinated notes | Moderate: subordination to all senior debt | Senior payment defaults and blockage notices | E19 |

### T4.10 Market Norm Comparison Table
Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided.

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | As recorded in the covenant feature register | No market-norm or covenant-review source supplied | No relative assessment made | No comparison performed; scoring rests on provision text only | Insufficient Information | E01–E19 |

### T4.11 Aggressiveness Score Table

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x test above 40% usage; none for term loans or notes | No early warning; term lenders wait for revolver | Negative — Covenant Erosion | High | E01; E02; E16 |
| Debt / lien incurrence capacity | 4 | Ratio-based pari secured to 5.00x, total to 7.25x; stacked baskets; notes coverage above 2.0x; MFN 50 bp, 18 months | Uncapped ratio debt and dilution | Negative — Leverage Increase | Provisional | E07; E09; E15 |
| RP / investment / leakage capacity | 4 | Unlimited RP at 6.75x; uncapped restricted-subsidiary investments; general investments greater of USD 500 million and 25% of assets; designation limited to new subsidiaries | Distributions and transfers outside guarantor reach | Negative — Covenant Erosion | Provisional | E04; E08; E11 |
| EBITDA definitions and add-back flexibility | 4 | Broad add-backs; cost savings to 25% within 24 months; dividend-equivalent add-back | Inflated denominator expands all capacity | Negative — Covenant Erosion | High | E05; E06 |
| Collateral / guarantor protection | 3 | Domestic guarantees and pledges; 65% foreign equity; automatic release on permitted disposal; every-lender for substantially all release | Release flexibility and non-guarantor value | Neutral — Stable | Provisional | E10; E12; E17; E18 |
| Amendment / control mechanics | 4 | Majority lenders; subordination absent from every-lender rights read; non-pro-rata class offers by majority | Uptier exposure for minority lenders | Negative — Covenant Erosion | Provisional | E10 |
| Overall | 4 | Weighted to leakage and dilution routes, which are uncapped by amount | Aggressive package: legal terms do not stop releveraging | Negative — Leverage Increase | Provisional | E01–E19 |

Covenant Aggressiveness Score: four of five, provisional. The score rests on executed text for all six areas, but the intercreditor agreement, collateral documents and most indentures are absent.

### T4.12 Red Flags Table

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further debt-funded distribution | Ratio RP permission at 6.75x | Repeats the September 2024 pattern | PD up; LGD up; widens spreads across structure | Board declarations; RP certificates | E04 |
| Pari secured issuance | Secured ratio debt at 5.00x; agent joinder without consent | Dilutes first-lien collateral | LGD up for first lien; secured tranches lose relative value | New secured notes; intercreditor joinders | E07; E10 |
| Revolver usage above 35% | §4.01(d) and §6.14 | Signals liquidity reliance and springing test | PD up | Quarterly revolver exposure | E01; E03 |
| Majority-lender amendment | §9.02 without subordination as every-lender right | Uptier or non-pro-rata exchange risk | LGD up for non-participants | Amendment filings; lender group activity | E10 |
| Transfers to non-guarantors or new unrestricted subsidiaries | Uncapped restricted-subsidiary investments; general baskets | Structural leakage | LGD up for notes | Obligor-group share; designation notices | E08; E11 |
| Guarantor release at bank level | Notes §10.07(e) | Notes lose guarantees and liens automatically | LGD up for secured notes | Bank guarantor releases | E18 |
| Subordinated blockage notice | 179 days per 360 days | Junior coupon stop | PD up for subordinated notes | Senior defaults; blockage notices | E19 |

### T4.13 Gaps Ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor terms | First Lien Intercreditor Agreement and joinders | Enforcement, standstill and release among first-lien classes | Enforcement and recovery-control registers limited; amendment score provisional | Obtain executed agreement from filings |
| Collateral documents | Guarantee and Collateral Agreement, security schedules | Excluded assets and perfection | Collateral matrix qualitative | Obtain collateral agreement and schedules |
| Other indentures | 2028 to 2032 secured and 2029 subordinated indentures | Tranche-specific terms | Tranche comparison relies on annual-report summary | Obtain each indenture and supplements |
| Covenant ratios and usage | Compliance certificate, basket tracker | Headroom and remaining capacity | Headroom and capacity not calculable | Obtain compliance and basket records |
| Defined terms | Consolidated Total Indebtedness, Total Assets, Financial Covenant Consolidated EBITDA, notes Bank Indebtedness | Basket sizes and test inputs | Capacity proxies provisional | Read full definitions |
| Full amendment provisions | Remainder of §9.02 and any anti-subordination clause | Uptier protection | Amendment score provisional | Read complete section and Amendment No. 16 |
| Subsidiary perimeter | Exhibit 22.1 obligor list, subsidiary list | Named guarantors and non-guarantors | Entity register partly generic | Obtain exhibits |
| Refinancing and liability-management analysis | Not supplied for this run | Liability-management overlay | Overlay incomplete | Read with the refinancing analysis when available |
| Market comparison | Covenant-review or market-norm source | Relative assessment | Market-norm register limited | Obtain third-party covenant review |

### T4D.1 Source Gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement §5.11 and Unrestricted Subsidiary definition (E11, E12) | Executed | 1 | Guarantor schedules not supplied | Completed with Limitations |
| 2033 indenture guarantee and release articles (E18) | Executed | 1 | Other indentures not supplied | Completed with Limitations |
| Annual report guarantor information and obligor summary (E17) | Filed | Org-chart-level filing | No entity-level values; exhibit list not supplied | Completed with Limitations |
| Financial foundation debt register (E20) | Supplied analysis | Financial input | Debt by entity not established beyond issuer level | Completed with Limitations |

Subsequent-events scan: no guarantor release, collateral release, designation or entity sale after 2024-09-30 was found in the documents read; the October 2024 securitization draw and dividend do not change the perimeter. The pre-event perimeter is the base case.

### T4D.2 Restricted / Unrestricted Entity Register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of bank debt and all notes | Delaware, United States | Public shareholders | Not a subsidiary; outside designation mechanics | No significant operations or assets separate from TransDigm Inc. | Yes, guarantor | E17; E20 |
| TransDigm Inc. | Borrower and note issuer | Delaware, United States | TransDigm Group Incorporated | Borrower; cannot be designated | Obligor group with guarantors: net sales USD 6,294 million; assets USD 19,888 million (combined) | Yes, primary obligor | E17 |
| TransDigm UK | Guarantor of 2028 secured notes and subordinated notes | United Kingdom | Not established | Restricted; designation capacity not established | — (not disclosed separately) | Yes for named notes; bank status not established | E17 |
| Domestic Restricted Subsidiaries | Guarantors and grantors | United States | TransDigm Inc. | Restricted; existing subsidiaries cannot be designated unrestricted | — (included in obligor group totals) | Yes | E11; E12; E17 |
| Foreign Restricted Subsidiaries | Non-guarantors; 65% voting equity of first-tier entities pledged | Various, outside United States | Loan parties | Restricted; existing ones cannot be designated | Part of non-guarantor share of about USD 1,646 million sales and USD 5,698 million assets | No | E12; E17 |
| Securitization Entity | Receivables purchaser and borrower | Not established | Not established | Excluded Subsidiary | Facility USD 650 million; carrying debt USD 486 million at year-end | No | E07; E12; E20 |
| Unrestricted Subsidiaries | None identified in documents read | Not applicable | Not applicable | Only newly formed or acquired subsidiaries may be designated | — (none identified) | No | E11 |

### T4D.3 Guarantor Coverage Matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group × bank facility | Senior secured holdings guarantee | Upstream | Termination or release under loan documents | E10; E17 |
| TransDigm Group × secured notes | Senior secured | Upstream | Defeasance or discharge | E17; E18 |
| TransDigm Group × subordinated notes | Senior subordinated unsecured | Upstream | Not read in subordinated indenture | E17 |
| Domestic Restricted Subsidiaries × bank facility | Senior secured | Cross-stream | Permitted sale; becoming immaterial; material guarantor release needs every lender | E10; E12 |
| Domestic Restricted Subsidiaries × 2029 to 2033 secured notes | Senior secured | Cross-stream | Sale; designation; immaterial; release under credit facilities and capital markets debt | E18 |
| Domestic Restricted Subsidiaries × subordinated notes | Senior subordinated | Cross-stream | Not read in subordinated indenture | E17 |
| TransDigm UK × 2028 secured notes and subordinated notes | Senior secured and senior subordinated respectively | Cross-stream | Not read; indentures not supplied for 2028 notes | E17 |
| Foreign Restricted Subsidiaries × all tranches | None | Not applicable | Not applicable; no guarantee | E12; E17 |
| Securitization Entity × all tranches | None | Not applicable | Not applicable; excluded | E12 |

### T4D.4 Collateral-by-Entity Matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group × first lien | — (collateral agreement not supplied) | Automatic on permitted disposal; substantially all needs every bank lender or two-thirds of noteholders | — (not established) | E10; E18 |
| TransDigm Group × second lien | — (no second-lien debt identified; junior lien capacity at 7.25x) | Not applicable | — (not established) | E07 |
| TransDigm Group × unsecured | Subordinated guarantee unsecured | Not applicable | Not applicable | E17 |
| TransDigm Inc. × first lien | — (excluded assets not established) | Same as above | Rule 3-10 and 3-16 equity exclusion; unrestricted subsidiary equity excluded | E10; E12 |
| TransDigm Inc. × second lien | — (none identified) | Not applicable | — (not established) | E07 |
| TransDigm Inc. × unsecured | Subordinated notes unsecured | Not applicable | Not applicable | E17 |
| TransDigm UK × first lien | — (collateral status not established) | — (not established) | — (UK perfection not established) | E17 |
| TransDigm UK × second lien | — (none identified) | Not applicable | — (not established) | E17 |
| TransDigm UK × unsecured | Subordinated guarantee unsecured | Not applicable | Not applicable | E17 |
| Domestic Restricted Subsidiaries × first lien | — (excluded assets not established) | Automatic on permitted disposal or guarantor release | Joinder within 20 business days | E10; E12 |
| Domestic Restricted Subsidiaries × second lien | — (none identified) | Not applicable | — (not established) | E07 |
| Domestic Restricted Subsidiaries × unsecured | Subordinated guarantees unsecured | Not applicable | Not applicable | E17 |
| Foreign Restricted Subsidiaries × first lien | Own assets not pledged; only 65% voting and 100% non-voting first-tier equity pledged by parents | Equity pledge release on permitted disposal | Tax-driven 65% cap | E12 |
| Foreign Restricted Subsidiaries × second lien | — (none identified) | Not applicable | Not applicable | E12 |
| Foreign Restricted Subsidiaries × unsecured | No guarantee | Not applicable | Not applicable | E12 |
| Securitization Entity × first lien | Receivables outside collateral; securitization liens permitted | Not applicable | Not applicable | E07 |
| Securitization Entity × second lien | Not applicable | Not applicable | Not applicable | E07 |
| Securitization Entity × unsecured | No guarantee | Not applicable | Not applicable | E12 |
| Unrestricted Subsidiaries × all tiers | Equity excluded from pledge | Not applicable | Not applicable | E12 |

### T4D.5 Structural Priority Table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Bank term loans and revolver | TransDigm Inc. with holdings and domestic guarantors | Guarantor collateral and 65% foreign equity | Pari (same entity, same lien) | Non-guarantor assets about USD 5,698 million reached only through pledged equity after subsidiary creditors | Strongest access but diluted by any pari issuance | Medium | E12; E17 |
| 2029 to 2033 secured notes | TransDigm Inc. with same guarantors as bank | Same pool as bank, shared under intercreditor agreement | Pari (same entity, same lien) | Same non-guarantor value; guarantee falls with bank release | Equal access subject to unread intercreditor control | Medium | E17; E18 |
| 2028 secured notes | TransDigm Inc. with TransDigm UK and domestic guarantors | Same pool plus TransDigm UK guarantee | Pari (same entity, same lien) | Same non-guarantor value | Equal access; indenture not supplied | Low | E17 |
| Senior subordinated notes | TransDigm Inc. with holdings, TransDigm UK and domestic guarantors | Residual after senior secured debt | Contractually Subordinated | All guarantor value until senior debt paid; non-guarantor value | Last among funded debt; blockage | Medium | E17; E19 |
| Non-guarantor subsidiary creditors (foreign debt basket, trade) | Foreign Restricted Subsidiaries | Their own assets first | Structurally Senior | Not applicable | Ahead of all notes on about 22.27% of assets | Medium | E07; E17 |
| Securitization facility | Securitization Entity | Sold receivables | Structurally Senior | Domestic receivables removed from collateral | Ahead of first lien on receivables | Medium | E07 |
| All classes | Group | Group value | Leakage-Exposed (drop-down capable) | Assets movable via uncapped restricted-subsidiary investments and general baskets | Capacity, not demonstrated use | Medium | E08; E11 |

### T4D.6 Drop-down / Transfer Capacity Register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| (a) Investment into unrestricted subsidiary | Loan party to newly formed unrestricted subsidiary | Permitted Investments (1)(c), (10), (20); designation definition | Greater of USD 250 million and 10% directly, plus general baskets (proxy about USD 6,396.5 million) and unlimited at 5.75x | 4 | Assets leave all creditor reach | Theoretical | E08; E11 |
| (b) Asset sale or contribution out of group | Guarantor to third party | §6.03; automatic lien release §9.02(c)(ii) | Not quantified: asset-sale conditions only partly read | Not Scorable | Collateral shrinks without consent | Theoretical | E10 |
| (c) Designation of existing subsidiary | Restricted subsidiary to unrestricted | Unrestricted Subsidiary definition | Existing subsidiaries cannot be designated | 2 | Blocks transfer of current operating subsidiaries | Theoretical | E11 |
| (d) Transfer to non-guarantor restricted subsidiary | Loan party to foreign restricted subsidiary | Permitted Investments (1)(a) uncapped | Uncapped; existing non-guarantor share about 22.27% of assets | 4 | Value becomes structurally subordinated for notes; only pledged equity remains | Theoretical | E08; E17 |

### T4D.7 Priming-Exposure Findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier | §9.02(b): majority lenders; lien and payment subordination not in every-lender list read | Non-participating term lenders and, through intercreditor effects, secured noteholders | Theoretical; full section and intercreditor agreement not read | Majority could permit new super-senior debt | Low | E10 |
| Uptier | §9.02(b) final paragraph: majority may permit non-pro-rata prepayments via class offers and loan modifications | Lenders not participating in an exchange | Theoretical | Open-offer requirement limits but does not remove non-pro-rata exchange risk | Medium | E10 |
| Trapdoor | Permitted Investments (1)(a), (1)(c), (10), (20) with designation of new subsidiaries | All secured and unsecured classes | Theoretical; no transfer observed | Assets could support debt outside the guarantor group | Medium | E08; E11 |

### Step 9 overall structural view
The highest-severity open routes are uncapped investment into non-guarantor restricted subsidiaries and funded transfers into newly formed unrestricted subsidiaries; both are capacity, not observed behaviour. The most material existing gap is non-guarantor value of about USD 5,698 million of assets, reached by first-lien creditors only through a 65% voting equity pledge after subsidiary creditors. Structural risk is weighted to those routes. By class, bank and secured-note claims share guarantor collateral, subordinated notes rank behind them and are subject to blockage, and all notes are structurally subordinated to foreign subsidiary and securitization creditors. The map supplies reachable value by entity class for recovery analysis and identifies investment leakage as the main structural vulnerability for committee debate; the restricted-group perimeter limits capacity only through the designation restriction. Status: completed with limitations owing to missing collateral documents, guarantor lists and the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, pages 81 and 173–174; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K12

### T4D.8 Gaps Ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit 22.1 and guarantor schedules | Named guarantor coverage | Entity register uses classes | Obtain exhibit and schedules |
| Collateral schedules | Guarantee and Collateral Agreement | Excluded assets, release terms | Collateral matrix shows dashes | Obtain agreement |
| Entity-level values | Debt, EBITDA and assets by entity | Stranded value sizing | Only obligor-group summary used | Obtain entity financials |
| Intercreditor agreement | First Lien Intercreditor Agreement | Control and release among first-lien classes | Uptier finding low confidence | Obtain agreement |
| Asset-sale covenant | Full §6.03 and asset-sale definitions | Route (b) severity | Route (b) not scorable | Read §6.03 |
| TransDigm UK status | Bank guarantor status and collateral | UK value reach | UK rows incomplete | Obtain loan party list |

### T4F.1 Controlling Documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with joinders 1 to 6 | Company, holdings, subsidiary guarantors, bank collateral agent, secured-note trustees and collateral agents | 2019-02-13; latest joinder 2024-09-19 | Not established: agreement not supplied | [Insufficient Information] — ICA not in the source set | 2033 indenture definition of Intercreditor Agreement | E18 |
| Credit agreement as annexed to Amendment No. 17 | TransDigm Inc., TransDigm Group, lenders, agent | 2024-09-19 | Not verified: governing-law clause not read | Executed | Credit agreement §6.14, §9.02, Article VII | E01; E02; E10 |
| 2033 secured notes indenture | TransDigm Inc., guarantors, trustee, notes collateral agents | 2024-09-19 | Not verified: governing-law clause not read | Executed | 2033 indenture §9.02, §10.07, §12.07 | E18 |
| 2027 subordinated notes indenture | TransDigm Inc., guarantors, trustee | 2019-11-13 | Not verified: governing-law clause not read | Executed | 2027 indenture §10.03, §10.05 | E19 |

### T4F.2 Creditor Class Map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Shared first-priority collateral | Sole control of financial covenant and its default | Required Revolving Lenders for §6.14; part of Required Lenders | E01; E02 |
| Term lenders | First lien, pari | Shared first-priority collateral | Acceleration by Required Lenders; financial covenant default only after revolver acts | Majority with revolver under Required Lenders | E02; E10 |
| Secured noteholders | First lien, pari in payment | Shared collateral under intercreditor agreement | [Insufficient Information] — ICA not in the source set | Majority; two-thirds for collateral release and adverse intercreditor change | E18 |
| Subordinated noteholders | Contractually subordinated | Unsecured | Subject to 179-day payment blockage | Majority under own indenture (not read) | E19 |
| Securitization lenders | Structurally senior on receivables | Receivables of securitization entity | Not established | Not established | E07 |

### T4F.3 Enforcement Control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement under intercreditor agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Bank lenders and secured noteholders | [Insufficient Information] — ICA not in the source set | Insufficient Information | E18 |
| Financial covenant default for term lenders | Until revolving lenders terminate commitments or accelerate | Breach of §6.14 | Revolving lenders | Term lenders | Term lenders cannot act on a covenant breach alone | Negative — Covenant Erosion | E02 |
| Subordinated payment blockage | Up to 179 days; one per 360 days for non-bank senior debt; 181 clear days required | Blockage notice on non-payment default of designated senior debt | Representative of designated senior debt, including bank indebtedness | Subordinated noteholders | Junior payments stop during senior workout | Negative — Liquidity Deterioration | E19 |

### T4F.4 Turnover and Release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| 2027 subordinated indenture §10.05 | Distributions must be paid over to senior debt; operative text not read beyond the heading | Not applicable | Not established | Not read | Heading confirms a paid-over clause exists | E19 |
| 2033 indenture §10.07(e) and §12.07 | Not applicable | Release under credit facilities releases notes guarantee and liens | Not established | Release not caused by payment of the guarantee | Two-thirds vote for release of substantially all collateral | E18 |
| Credit agreement §9.02(c) | Not applicable | Automatic lien release on permitted disposals | Not established | Disposal compliant with the agreement | Every-lender consent for substantially all collateral | E10 |
| First Lien Intercreditor Agreement release and purchase terms | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | E18 |

### T4F.5 Recovery Control Assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Revolving and term lenders | Share guarantor collateral with pari debt | Majority amendments; pari secured dilution | High | New pari or priming debt reduces collateral share | Negative — Leverage Increase | E07; E10 |
| Secured noteholders | Share collateral; guarantee depends on bank | Enforcement control not established; release follows bank | High | Bank decisions can release note guarantees and liens | Negative — Covenant Erosion | E18 |
| Subordinated noteholders | Residual after senior debt; turnover | Blockage and subordination | High | Junior recovery depends on senior claims size | Negative — Covenant Erosion | E19 |
| First-lien classes inter se | Governed by intercreditor agreement | [Insufficient Information] — ICA not in the source set | Insufficient Information | [Insufficient Information] — ICA not in the source set | Insufficient Information | E18 |

### T4F.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Executed First Lien Intercreditor Agreement and joinders | Control, standstill, turnover and release among first-lien classes | Enforcement and recovery-control rows marked insufficient | Obtain from filings |
| Subordinated turnover text | Full §10.05 and §10.01 of the 2027 indenture | Scope of turnover | Turnover row partial | Read sections |
| Governing law | Governing-law clauses in all documents | Enforcement forum | Governing law not verified | Read clauses |

### T4C.2 Source Map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement annex | Executed credit agreement | 2024-09-19 | Executed | Legal formula | Binding bank tests and baskets | E01–E13 |
| 1 | 2033 indenture | Executed indenture | 2024-09-19 | Executed | Legal formula | Bond tests | E14; E15; E18 |
| 2 | Annual report revolver disclosure | Filed report | 2024-11-07 | Filed | Usage (revolver only) | Only measured usage input | E16 |
| 3 | Financial foundation | Supplied analysis | As of 2024-09-30 | Supplied | Financial input | Non-covenant reference metrics | E20 |
| 4 | Earnings quality | Supplied analysis | As of 2024-09-30 | Supplied | Financial input (add-back challenge) | Inflation of covenant EBITDA | E20 |

### T4C.3 Definition Register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | Credit agreement definitions | Net income plus taxes, interest, non-cash charges, unusual, transaction, refinancing, pension, earn-out, dividend-equivalent and start-up costs, plus cost savings capped at 25% | Covenant EBITDA bridge | Expands every grower basket and ratio | Denominator inflation | Negative — Covenant Erosion | E05 |
| Consolidated Net Income | Credit agreement definitions | Excludes asset-sale gains, FX, extinguishment, unusual charges, impairment, intangible amortization, non-cash compensation, purchase accounting | Restricted-group net income | Raises EBITDA and notes builder | Earnings base wider than GAAP | Negative — Covenant Erosion | E06 |
| Consolidated Net Leverage Ratio | Credit agreement definitions | (Consolidated Total Indebtedness − Unrestricted Cash) ÷ last four quarters Consolidated EBITDA, pro forma | Covenant debt, unrestricted cash, EBITDA | Governs RP, incremental, investments, covenant | Cash netting lowers ratio | Insufficient Information | E06 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | (Consolidated Secured Debt − Unrestricted Cash) ÷ Consolidated EBITDA | Secured debt, cash, EBITDA | Governs pari secured capacity | Cash build before payout raises secured room | Insufficient Information | E06 |
| Unrestricted Cash | Credit agreement definitions | Cash of holdings, borrower and restricted subsidiaries not subject to non-loan liens | Cash by entity | Netting in all ratios | Includes foreign cash of restricted subsidiaries | Insufficient Information | E11 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | Consolidated EBITDA ÷ fixed charges, pro forma | Fixed charges | Governs notes ratio debt and RP | Coverage looser than leverage | Negative — Covenant Erosion | E14; E15 |
| Covenant debt basis | Credit agreement Consolidated Total Indebtedness (not read) versus carrying debt USD 24,880 million | Basis not established | Definition text | Unknown divergence | Non-debt float (contract liabilities, dividend payable) treatment unknown | Insufficient Information | E06; E20 |

### T4C.5 Capacity Register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Incremental facility capacity | §2.24 ratio incremental | Debt to 7.25x total and 5.00x secured net leverage | No default; certificate | Covenant ratios not disclosed | Not documented | Not calculable: covenant ratios not disclosed | Not calculable: usage not documented | Formula Extracted Only | Critical | Pari first-lien dilution | Negative — Leverage Increase | E09 |
| Debt incurrence capacity | General basket, Permitted Indebtedness (13) | Greater of USD 250 million and 10% of EBITDA | Borrower and guarantors | EBITDA As Defined USD 4,173 million as proxy | Not documented | About USD 417.3 million (K14) | Not calculable: usage not documented | Provisional | Moderate | Fixed layer beside ratio debt | Negative — Leverage Increase | E07 |
| Debt incurrence capacity | Foreign subsidiary basket, (14) | Greater of USD 450 million and 18% | Foreign restricted subsidiaries | Same proxy | Not documented | About USD 751.14 million (K15) | Not calculable: usage not documented | Provisional | High | Structurally senior to notes | Negative — Leverage Increase | E07 |
| Debt incurrence capacity | Securitization basket, (18) | Greater of USD 725 million and 20% | Non-recourse | Same proxy; facility USD 650 million fully drawn after 2024-10-16 | USD 487.5 million at year-end; USD 650 million after October draw | About USD 834.6 million (K16) | Not calculable: basket measured on face amount and exact covenant EBITDA unknown | Provisional | Moderate | Receivables removed from collateral | Negative — Liquidity Deterioration | E07; E20 |
| Restricted payment capacity | Ratio RP, §6.02 | Unlimited if pro forma net leverage at or below 6.75x | No default | Covenant ratio not disclosed; October 2024 payment USD 4,348 million | Ratio basket, no amount cap | Unlimited within ratio | Not calculable: covenant ratio not disclosed | Formula Extracted Only | Critical | Debt-funded distributions | Negative — Leverage Increase | E04; E20 |
| Restricted payment capacity | General RP, §6.02(7) | Greater of USD 75 million and 3% of EBITDA | No default | Same proxy | Not documented | About USD 125.19 million (K18) | Not calculable: usage not documented | Provisional | Low | Small fixed leakage | Neutral — Stable | E04 |
| Investment capacity | General investments, PI (10) | Greater of USD 500 million and 25% of Total Assets | None stated | Consolidated assets USD 25,586 million as proxy | Not documented | About USD 6,396.5 million (K19) | Not calculable: usage not documented | Provisional | High | Transfers to non-guarantors or unrestricted vehicles | Negative — Covenant Erosion | E08 |
| Investment capacity | Joint ventures, PI (11) | Greater of USD 1,000 million and 40% | 7.00x and no default | Same EBITDA proxy | Not documented | About USD 1,669.2 million (K17) | Not calculable: usage not documented | Provisional | Moderate | Value moved to joint ventures | Negative — Covenant Erosion | E08 |
| Unrestricted subsidiary capacity | PI (1)(c) | Greater of USD 250 million and 10% | New subsidiaries only | Same proxy | Not documented | About USD 417.3 million (K14) | Not calculable: usage not documented | Provisional | Moderate | Direct unrestricted transfer | Negative — Covenant Erosion | E08; E11 |
| EBITDA add-back capacity | Cost savings, Consolidated EBITDA (m) | Up to 25% of EBITDA after adjustment | 24 months | Same proxy | Not documented | About USD 1,043.25 million (K20) | Not calculable: amount used not disclosed | Provisional | High | Inflates all ratio capacity | Negative — Covenant Erosion | E05 |
| Guarantor / collateral release capacity | §9.02(c), notes §10.07 | Automatic release on permitted disposal or bank release | Compliance with agreement | Not applicable | Not documented | Not quantified: disposal capacity not read | Not calculable: §6.03 not fully read | Insufficient Information | High | Collateral shrinkage without vote | Negative — Covenant Erosion | E10; E18 |
| Maintenance covenant headroom | Revolver usage trigger | Exposure ÷ commitments at or below 40% | Quarter end | USD 67 million of USD 910 million | Letters of credit only | USD 297 million further usage before test (K06) | USD 297 million | Ready with Limitations | Low | Liquidity draw activates test | Neutral — Stable | E01; E16 |

Baskets are not totalled: the borrower may divide and reclassify debt, investment and payment items, so the same capacity can be reached by several routes and summing would double count.

### T4C.6 Debt/Lien/Priming Table

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental and ratio debt | 5.00x secured net leverage | Formula only | Shares first-lien collateral | Moderate | High dilution | Weakens secured tranches relative to subordinated spread pickup | E07; E09 |
| Junior secured or unsecured ratio debt | 7.25x total net leverage | Formula only | Layering below first lien | Moderate | Low for first lien; high for subordinated notes | Subordinated notes most exposed | E07 |
| Foreign subsidiary and securitization debt | Greater of USD 450 million and 18%; greater of USD 725 million and 20% | Provisional proxies | Structurally senior on subsidiary assets and receivables | Low | Moderate for all notes | Favours bank over notes only marginally; both exposed | E07 |
| MFN weakness | 50 bp, 18 months sunset, acquisition carve-out; not applicable to note-form ratio debt | Formula only | Repricing without protection | Low | Low | Lower yield protection for term loans | E09 |
| Majority-lender subordination | Not excluded by every-lender list read | Theoretical | Uptier priming | Low | High for non-participants | Larger holdings carry control value | E10 |
| Drop-down into new unrestricted subsidiary | Investment baskets with designation of new subsidiaries | Theoretical | Debt raised outside group on transferred assets | Low | High | Notes and loans equally exposed | E08; E11 |

### T4C.7 Leakage Analysis Table

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio distributions | October 2024 payment USD 4,348 million declared 2024-09-19 | 6.75x net leverage | Used; remaining not calculable without covenant ratio | Cash leaves group | Critical | Negative — Leverage Increase | E04; E20 |
| Notes builder and coverage RP | Builder from October 2010 plus 2.0x coverage | §4.07 | Not documented | Bank test constrains first | Moderate | Negative — Covenant Erosion | E14 |
| Investments in non-guarantor restricted subsidiaries | Uncapped | PI (1)(a) | Not documented | Moves value outside guarantees | High | Negative — Covenant Erosion | E08 |
| Unrestricted subsidiary investments | Newly formed subsidiaries only | PI (1)(c) plus general baskets | Not documented | Removes value from all covenants | High | Negative — Covenant Erosion | E08; E11 |
| Asset sales | Automatic lien release on permitted disposal | §6.03; §9.02(c) | Not documented | Collateral reduction | Insufficient Information | Insufficient Information | E10 |

Leakage is not aggregated because the routes share the same capacity and can be reclassified.

### T4C.8 Add-Back Inflation Table

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Consolidated EBITDA (m) | 25% of EBITDA; actions within 24 months | Formula only; amount used not disclosed | Each USD of savings raises every grower basket and ratio room | Higher leakage and dilution capacity | E05 |
| Transaction, refinancing and restructuring costs | Consolidated EBITDA (d), (e) | Uncapped | Earnings quality rejected USD 345 million of comparable items | Recurring costs treated as non-recurring | Ratio tests overstate cushion | E05; E20 |
| Non-cash and deferred compensation | Consolidated Net Income (11) | Uncapped | Issuer add-back USD 217 million in FY2024 | Removes recurring employee cost | Same | E06; E20 |
| Dividend-equivalent payments | Consolidated EBITDA (k) | Uncapped | Amount expensed not established | Distribution-linked cash payments added back | Distributions can raise EBITDA | E05 |
| Pro forma acquisitions | Ratio definitions, §1.07 | Not read | Not quantified | Acquired EBITDA counted for full period | Acquisitions expand capacity at closing | E06 |

### T4C.9 Flags Table

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Uncapped ratio distributions | 6.75x test, used in October 2024 | Further debt-funded payouts | Critical | Moderate | Committee decision; Recovery & fulcrum | E04 |
| Pari secured dilution | 5.00x secured capacity | First-lien recovery erosion | Critical | Moderate | Recovery & fulcrum; Security selection | E07; E09 |
| Reclassification and fungibility | Borrower may divide and classify debt and payments | Capacity reached by multiple routes | High | High | Covenant capacity; Security selection | E07; E14 |
| Majority amendment control | Required Lenders more than 50% | Uptier and non-pro-rata exchange | High | Low | Refinancing & LME; Committee decision | E10 |
| Release follows bank | Notes guarantee release on bank release | Noteholder security depends on bank | High | High | Security selection; Recovery & fulcrum | E18 |
| Investment leakage to non-guarantors | Uncapped restricted-subsidiary investments | Structural subordination grows | High | Moderate | Recovery & fulcrum | E08 |

### Step 10 nearest pressure point
The nearest pressure point is the ratio restricted-payment permission in the credit agreement, because maintenance headroom is not near-term relevant while the revolver is undrawn. The permission allows unlimited distributions while pro forma covenant net leverage stays at or below 6.75x, and the issuer used that route to declare the October 2024 payment of USD 4,348 million funded partly by USD 3,000 million of new secured debt. Further borrower action would add secured or unsecured debt within the 5.00x and 7.25x tests and distribute the proceeds, raising default probability through higher interest burden and lowering recovery through dilution. The observable signal is a board dividend declaration or a new secured issuance not tied to an acquisition. Tightening the view needs the covenant net leverage ratio at the declaration date and after payment, from a compliance certificate.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 58–59; Financial foundation (CP-1); Business & governance (CP-1A)

### T4C.11 Priority Matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Ratio restricted payments at 6.75x | Critical | Moderate | Debt-funded distributions | High | Moderate | Track declarations and certificates | E04 |
| 2 | Pari secured incurrence at 5.00x | Critical | Moderate | First-lien dilution | Moderate | High | Track secured issuance and joinders | E07; E09 |
| 3 | Uncapped investments into non-guarantors | High | Moderate | Structural leakage | Low | High | Track obligor-group share | E08 |
| 4 | Cost-savings and other add-backs | High | High | Denominator inflation | Moderate | Moderate | Track EBITDA As Defined versus reported | E05 |
| 5 | Majority amendment mechanics | High | Low | Uptier risk | Low | High | Track amendments | E10 |

### T4C.12 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Covenant-defined ratios at quarter end and at the 2024-09-19 declaration | Headroom on every ratio test | Headroom not calculable | Obtain certificates |
| Covenant EBITDA bridge | Financial Covenant Consolidated EBITDA and Consolidated EBITDA reconciliation | Ratio and basket sizes | Basket figures provisional | Obtain bridge |
| Basket usage | Tracker of debt, lien, investment and payment basket use | Remaining capacity | Remaining capacity not calculable | Obtain tracker |
| Debt definition | Consolidated Total Indebtedness text and treatment of float | Numerator of ratios | Covenant debt not established | Read definition |
| Total Assets definition | Borrower Total Assets | General investment basket | Proxy only | Read definition |
| MFN dates | Effective dates of Amendments No. 15, 16 and 17 | MFN sunset dates | No dated sunset rows | Confirm effective dates |
| Collateral and guarantor schedules | Collateral agreement and exhibits | Release capacity | Release capacity not quantified | Obtain documents |

### Step 13 overall covenant capacity view
Overall, TransDigm has limited covenant-capacity visibility. The main capacity concern is the ratio restricted-payment permission, because distributions are uncapped while covenant net leverage stays at or below 6.75x and pari secured debt can fund them up to 5.00x secured net leverage, which raises default probability and dilutes first-lien recovery. Exact headroom is not supported except for the revolver-usage trigger. Further analysis requires compliance certificates, the covenant EBITDA bridge and basket usage.
- The only measured headroom is revolver usage: exposure of at most 7.36% against the 40% trigger.
- The most important debt point is ratio-based pari secured capacity with no fixed ceiling and a narrow, temporary MFN.
- The most important leakage point is uncapped investment into non-guarantor restricted subsidiaries beside the ratio payment permission.
- The most important definition point is cost savings of up to 25% of EBITDA on top of the add-backs the earnings-quality analysis rejected.
- For committee sizing, legal capacity offers no brake on releveraging; position limits should assume the ratio routes are usable.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 23–24; d887611dex101.htm.jsonl, pages 61–63; calculation K01

Covenant capacity completed with limitations. Key gaps: compliance certificates, covenant EBITDA bridge, basket usage, collateral schedules.

### Step 14 overall legal credit view
Overall, TransDigm Group Incorporated presents an aggressive covenant package based on a revolver-only springing covenant, unlimited ratio-based distributions and ratio-based pari secured capacity. The main creditor protections are every-lender consent for pro rata sharing and for release of all or substantially all collateral or material guarantors, the bar on designating existing subsidiaries unrestricted, and a two-thirds noteholder vote for collateral release, while the main covenant weaknesses are uncapped distributions and incurrence within ratio tests run on an add-back-heavy EBITDA, uncapped investments into non-guarantors and majority amendment control. The primary default-risk path is a further debt-funded distribution that raises interest burden with no maintenance test to force early engagement, and the primary recovery risk path is pari secured dilution and structural leakage to non-guarantor subsidiaries. For security selection, the most important legal consideration is that secured-note guarantees and liens follow bank releases and that enforcement control under the first-lien intercreditor agreement is not established. Further analysis would require the intercreditor agreement, the collateral agreement and schedules, the remaining indentures and compliance certificates. The covenant aggressiveness score is four of five, provisional; the top red flags are further distributions and pari secured issuance.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 118 and 122; d887611dex101.htm.jsonl, page 188

Legal & covenants completed with limitations. Covenant aggressiveness: four of five, provisional. Key gaps: intercreditor agreement, collateral agreement and schedules, seven note indentures, compliance certificates and basket usage.

### Material claim lineage

| Claim | Material claim | Strongest lineage | Evidence ID |
|---|---|---|---|
| L1 | Revolver-only springing covenant at 7.50x above 40% usage | Directly Sourced | E01 |
| L2 | Term lenders gain covenant default only after revolver action | Directly Sourced | E02 |
| L3 | Unlimited RP at 6.75x pro forma net leverage | Directly Sourced | E04 |
| L4 | Notes RP and ratio debt at coverage above 2.0x | Directly Sourced | E14; E15 |
| L5 | Pari secured debt to 5.00x and total to 7.25x | Directly Sourced | E07; E09 |
| L6 | MFN 50 bp with 18 months sunset | Directly Sourced | E09 |
| L7 | Cost savings add-back capped at 25% | Directly Sourced | E05 |
| L8 | Uncapped investments in restricted subsidiaries | Directly Sourced | E08 |
| L9 | Designation limited to new subsidiaries | Directly Sourced | E11 |
| L10 | Majority lenders; subordination absent from every-lender list read | Directly Sourced | E10 |
| L11 | Notes guarantee release follows bank | Directly Sourced | E18 |
| L12 | Revolver exposure at most 7.36% | Calculated | E16 |
| L13 | Non-guarantor share about 20.73% of sales and 22.27% of assets | Calculated | E17 |
| L14 | Grower basket proxies | Calculated | E07; E08 |
| L15 | Capital structure totals reconcile to USD 24,880 million | Calculated | E20 |
| L16 | Aggressive overall score | Analyst Inference | E01–E19 |
| L17 | Ratio RP is the nearest pressure point | Analyst Inference | E04 |
| L18 | Uptier exposure through majority amendments | Analyst Inference | E10 |
| L19 | Drop-down route through new unrestricted subsidiaries | Analyst Inference | E08; E11 |
| L20 | Material Acquisition step-up period differs between sections | Conflicting | E01; E03 |
| L21 | First-lien enforcement control | Insufficient Information | E18 |
| L22 | Covenant-defined ratio headroom | Insufficient Information | E16 |
| L23 | Collateral exclusions and perfection | Insufficient Information | E12 |

### Verification

| Register set | Result | Note |
|---|---|---|
| Legal review registers | PASS | All present with declared columns |
| Structural map registers | PASS | Missing values shown as dashes with gaps |
| Intercreditor registers | PASS | Intercreditor-dependent cells state the agreement is not in the source set |
| Capacity registers | PASS | Unmeasured capacity marked not calculable with reasons |

## Calculations

All amounts are USD millions as at or for the year ended 2024-09-30 unless stated. Percentages are shown rounded to two decimals; exact quotients are kept in the table. Basket figures use EBITDA As Defined and consolidated total assets only as proxies for covenant inputs and are not covenant capacity.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | 2024-09-30 revolver exposure | 67 ÷ 910 | 0.073626373626373626373626373626373626374; shown as 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K02 | Covenant usage trigger | 0.40 × 910 | 364.00 | USD millions | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59 and 62 |
| K03 | Borrowing condition level | 0.35 × 910 | 318.50 | USD millions | d887611dex101.htm.jsonl, page 165 |
| K04 | Usage headroom to covenant trigger | 40 − 7.36 | 32.64 | Percentage points | calculation K01 |
| K05 | Usage headroom to borrowing condition | 35 − 7.36 | 27.64 | Percentage points | calculation K01 |
| K06 | Further usage before covenant test | 364 − 67 | 297 | USD millions | calculation K02 |
| K07 | Further usage before borrowing condition | 318.5 − 67 | 251.5 | USD millions | calculation K03 |
| K08 | Revolver check | 843 + 67 | 910 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K09 | Non-guarantor sales, FY2024 | 7940 − 6294 | 1646 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K10 | Non-guarantor share of sales | 1646 ÷ 7940 | 0.20730478589420654911838790931989924433; shown as 20.73% | Fraction; % | calculation K09 |
| K11 | Obligor-group assets | 7813 + 8186 + 3889 | 19888 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K12 | Non-guarantor assets, indicative | 25586 − 19888 | 5698 | USD millions | calculation K11; Financial foundation (CP-1) |
| K13 | Non-guarantor share of assets | 5698 ÷ 25586 | 0.22269991401547721410146173688736027515; shown as 22.27% | Fraction; % | calculation K12 |
| K14 | 10% grower proxy | 0.10 × 4173 | 417.30 | USD millions | Financial foundation (CP-1) |
| K15 | 18% grower proxy | 0.18 × 4173 | 751.14 | USD millions | Financial foundation (CP-1) |
| K16 | 20% grower proxy | 0.20 × 4173 | 834.60 | USD millions | Financial foundation (CP-1) |
| K17 | 40% grower proxy | 0.40 × 4173 | 1669.20 | USD millions | Financial foundation (CP-1) |
| K18 | 3% grower proxy | 0.03 × 4173 | 125.19 | USD millions | Financial foundation (CP-1) |
| K19 | 25% of total assets proxy | 0.25 × 25586 | 6396.50 | USD millions | Financial foundation (CP-1) |
| K20 | 25% cost-savings proxy | 0.25 × 4173 | 1043.25 | USD millions | Financial foundation (CP-1) |
| K21 | Secured notes principal | 2100 + 2750 + 1450 + 1000 + 2200 + 1500 | 11000 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K22 | Secured notes carrying value | 2077 + 2727 + 1438 + 984 + 2180 + 1486 | 10892 | USD millions | Financial foundation (CP-1) |
| K23 | Subordinated notes principal | 2650 + 1200 + 750 | 4600 | USD millions | Financial foundation (CP-1) |
| K24 | Finance leases plus government advances | 262 + 17 | 279 | USD millions | Financial foundation (CP-1) |

The obligor-group assets exclude the separately presented net intercompany balance with non-guarantors, so the non-guarantor asset share is indicative, not an entity-level value.

## Gaps

| Gap | What is missing | Conclusion affected | Required resolution |
|---|---|---|---|
| Intercreditor agreement | Executed first-lien intercreditor agreement and joinders | Enforcement control, standstill and release among first-lien classes not established | Obtain executed agreement |
| Covenant values and usage | Compliance certificates, covenant EBITDA bridge, basket tracker | All ratio headroom and remaining capacity | Obtain certificates and tracker |
| Remaining indentures | 2028 to 2032 secured and 2029 subordinated indentures | Tranche-level terms rely on the annual-report summary | Obtain indentures |
| Collateral documents and exhibits | Guarantee and collateral agreement, schedules, obligor and subsidiary lists | Excluded assets, perfection and named guarantors | Obtain documents |
| Defined terms and sections not read | Consolidated Total Indebtedness, Total Assets, Financial Covenant Consolidated EBITDA, asset-sale covenant, remainder of the amendments section, governing-law clauses | Basket proxies, debt-basis conflict, uptier conclusion | Read the full text |
| MFN sunset dates | Effective dates of Amendments No. 15, 16 and 17 | Each tranche's MFN protection ends 18 months after its amendment effective date; no fixed date is stated because effective dates are not verified | Confirm effective dates |
| Refinancing and liability-management analysis | Not supplied for this run | Liability-management overlay incomplete | Read alongside that analysis when available |
| Market comparison | Covenant-review or market-norm source | Relative assessment of terms | Obtain third-party covenant review |

## Next module
The orchestrator selects the next module.
