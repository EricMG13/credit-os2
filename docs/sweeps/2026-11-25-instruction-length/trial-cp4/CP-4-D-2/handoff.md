## Request
Interpret the legal and covenant package of TransDigm Group Incorporated as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers the conformed credit agreement after Amendment No. 17, the 2033 secured-notes indenture and the 2027 subordinated-notes indenture: covenants, capacity formulas, guarantees, structural priority and intercreditor control, translated into default-risk and recovery effects.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement to the second amended and restated credit agreement, with the conformed credit agreement annexed (execution version) | 2024-09-19, agreement date | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement provisions: springing covenant, debt, lien, restricted-payment and investment permissions, unrestricted-subsidiary designation, incremental and most-favoured-nation terms, amendment thresholds, agent enforcement and lien releases |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 (execution version) | 2024-09-19, indenture date | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants, ratio debt and lien tests, restricted payments, guarantees and releases, covenant suspension, amendment thresholds, enforcement and intercreditor references |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Contractual subordination, insolvency turnover and payment blockage |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of covenants, compliance statement, springing-covenant usage threshold, guarantor perimeter and summary, revolver and letters of credit, securitization facility |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted source set, retrospective boundary, identity of the historical credit-agreement chain and missing legal documents |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt register, carrying and principal amounts, reported and issuer-adjusted EBITDA, year-end and post-dividend net leverage, consolidated total assets |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation facts and dates, Delaware incorporation of borrower and parent, ownership of the borrower |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Challenge of issuer add-backs, used to judge how covenant earnings definitions can inflate capacity |

## Findings

### Bottom line
TransDigm's debt documents protect secured creditors' payment rank and pro rata sharing, but give equity wide, ratio-based room to pay dividends and add pari secured debt, so the main creditor risk is value extraction and dilution, not covenant default.

The only maintenance test is a springing revolver covenant of 7.50x net leverage that applies only when revolver usage exceeds 40% of commitments; usage was 7.36% at year-end. The credit agreement permits unlimited dividends at or below 6.75x net leverage, and the secured-notes indenture permits unlimited restricted payments while fixed-charge cover exceeds 2.0x. Financial foundation puts net leverage at 4.88x at year-end and 6.02x pro forma for the October 2024 dividend of USD 4,348 million, on unadjusted EBITDA; that already sits below 6.75x, so the recapitalisation does not appear to have exhausted the permission, although covenant-defined ratios are not reported.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Financial foundation (CP-1); calculation L01; calculation L08

### Key findings
- Covenant default is a distant default channel because the maintenance architecture is narrow and protects only the revolver. The 7.50x net-leverage test (8.00x for four quarters after a material acquisition) is drafted for the revolving lenders only, can be loosened only by the required revolving lenders, and is tested only if revolver exposure exceeds 40% of commitments. With USD 67 million of letters of credit against USD 910 million of commitments, about USD 297 million of further exposure would be needed before the test applies. Term lenders and noteholders have no maintenance protection; the issuer states it was in compliance with all debt covenants at year-end.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L01; calculation L03
- Leakage permission is the dominant legal weakness and has been used. The credit agreement allows any restricted payment while pro forma net leverage stays at or below 6.75x with no default, plus a general basket of the greater of USD 75 million and 3% of covenant EBITDA. The secured-notes indenture adds an unlimited payment test of fixed-charge cover above 2.0x and a builder basket starting at USD 400 million plus 50% of cumulative net income since October 2010. The general investment basket of the greater of USD 500 million and 25% of total assets is indicatively about USD 6,396.5 million on consolidated assets. The September recapitalisation of USD 4,348 million shows equity will use this room.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, page 62; d887611dex41.htm.jsonl, page 70; d887611dex41.htm.jsonl, page 75; Business & governance (CP-1A); calculation L07
- Pari secured dilution is the main recovery channel. The credit agreement permits same-lien senior secured debt while the secured net debt ratio stays at or below 5.00x and junior-lien or unsecured debt at or below 7.25x; the secured-notes indenture lets ratio debt be secured up to 5.25x. On the borrower's request the agent must amend the collateral documents or sign intercreditor agreements to admit such debt without lender consent. The yield protection on new term loans is 50 bp and falls away after 18 months or for acquisition-related loans. Tranche L itself was conditioned on 7.25x and 5.00x being met after the recapitalisation.
Basis: d887611dex101.htm.jsonl, pages 58–59; d887611dex41.htm.jsonl, page 43; d887611dex101.htm.jsonl, page 205; d887611dex101.htm.jsonl, page 144; d887611dex101.htm.jsonl, page 4
- Structural subordination to non-guarantor subsidiaries is moderate but real for every class. The issuer states that notes are structurally subordinated to non-guarantor liabilities; the guarantor group reports USD 6,294 million of sales against USD 7,940 million consolidated, leaving about USD 1,646 million (20.73%) outside, and about USD 2,233 million (21.43%) of goodwill sits outside the guarantor summary. Non-guarantor restricted subsidiaries may add up to USD 400 million of ratio debt under the secured-notes indenture, and foreign subsidiaries the greater of USD 450 million and 18% of covenant EBITDA under the credit agreement.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex41.htm.jsonl, page 79; d887611dex101.htm.jsonl, page 60; Financial foundation (CP-1); calculation L05; calculation L06
- Amendment mechanics protect payment terms but leave lien and payment subordination outside the credit agreement's unanimous items. Required lenders are holders of more than 50%; each affected lender must consent to principal, rate and maturity changes, and each lender to changes in pro rata sharing, voting thresholds, release of a material guarantor or release of all or substantially all collateral. Non-pro rata prepayment is limited to offers made to all lenders of a class. Subordinating existing loans is not listed, so a majority-led uptier is theoretically open, subject to an intercreditor agreement that was not supplied. Secured noteholders are better protected: an adverse ranking change needs each affected holder, and collateral release or adverse intercreditor change needs two-thirds of holders.
Basis: d887611dex101.htm.jsonl, page 71; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 117–118
- Subordinated noteholders sit behind both a payment-rank and a standstill mechanism. Senior debt must be paid in full in cash in insolvency before they receive anything other than equally subordinated securities, and a non-payment default on designated senior debt can block their payments for up to 179 days in any 360 days.
Basis: d826058dex41.htm.jsonl, pages 106–107
- The unrestricted-subsidiary route is narrower in the credit agreement than in many leveraged packages. Only a newly acquired or newly formed subsidiary may be designated, it may carry no debt with recourse to the restricted group, and investment in unrestricted subsidiaries is capped at the greater of USD 250 million and 10% of covenant EBITDA. The secured-notes indenture nevertheless releases a guarantee automatically on designation or when the guarantor is released under the credit facilities.
Basis: d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, page 61; d887611dex41.htm.jsonl, page 122

### Contrary evidence and what would change the view
The strongest case against an extraction-led legal view is that the controlling documents defend the core of the secured claim: pro rata sharing, payment terms and release of substantially all collateral need every lender, secured noteholders hold an individual veto over adverse ranking changes, the indenture requires two-thirds of holders to release the collateral, and the credit agreement confines unrestricted-subsidiary designation to newly formed or acquired entities. Incremental and pari debt are tied to leverage tests, and the recapitalisation itself was certified against them. On that reading the package is permissive on cash leakage but resistant to the drop-down and priming manoeuvres that have impaired lenders elsewhere. That case would win if the first-lien intercreditor agreement gives the credit-agreement agent and noteholders symmetrical protection against subordination, if compliance certificates show covenant leverage far below the 6.75x dividend test only because of genuinely recurring earnings, and if management retains cash rather than paying further special dividends. The view would worsen if another debt-funded dividend follows, if majority lenders amend lien priority, or if a guarantor is released through a credit-agreement amendment.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, pages 117–118; d887611dex101.htm.jsonl, page 4

### Limitations
- The first-lien intercreditor agreement is referenced but not supplied, so who directs enforcement between the credit-agreement agent and the notes collateral agents, any standstill between them and whether lien subordination needs each class's consent remain unknown; the intercreditor and uptier conclusions are therefore provisional and stated only from the credit agreement and indentures.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 135
- No compliance certificate, basket-usage record or covenant EBITDA figure is supplied, so every capacity figure here is a formula or an indicative proxy on reported earnings; the conclusion that the recapitalisation left restricted-payment room could reverse if covenant debt is measured more broadly than carrying debt.
Basis: Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62
- The security agreement, UK debenture, guarantor list and excluded-collateral definitions are not supplied, so collateral reach by entity and the value excluded from the lien are not established; the structural-priority ranking rests on sales and goodwill differences in the guarantor summary, not on asset-level collateral.
Basis: d887611dex41.htm.jsonl, page 24; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59
- Indentures for the 2028 to 2032 secured notes and the two 2029 subordinated notes are not supplied; the issuer describes their covenants only as substantially similar, so the loosest restricted-payment or lien test across the capital structure may differ from the documents read here.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61

### Capital structure

| Instrument | Principal | Legal rank in the reviewed documents | Guarantee and security | Governing document read here | Source |
|---|---|---|---|---|---|
| Term loans I, J, K and L | USD 8,702 million (I 1,871; J 3,632; K 1,699; L 1,500) | Senior secured; equal payment rank with secured notes | Holdings and subsidiary loan parties; first-lien collateral shared under the intercreditor agreement | Conformed credit agreement after Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 2 |
| Revolving credit facility | USD 910 million commitment; USD 67 million letters of credit; USD 843 million available | Senior secured; only class with a maintenance test | Same as term loans | Conformed credit agreement after Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 188 |
| Secured notes due 2028, 2029, 2030, 2031 and 2032 | USD 9,500 million in aggregate (2,100; 2,750; 1,450; 1,000; 2,200) | Senior secured; equal payment rank with credit facilities | Holdings, TransDigm UK and domestic restricted subsidiaries | Not supplied; issuer describes covenants as substantially similar | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Secured notes due 2033 | USD 1,500 million | Senior secured; first-priority lien subject to the intercreditor agreement | Holdings, TransDigm UK and qualifying restricted subsidiaries; UK debenture | 2033 secured-notes indenture | d887611dex41.htm.jsonl, page 30; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Senior subordinated notes due 2027 | USD 2,650 million | Subordinated to all senior debt; payment blockage up to 179 days | Subordinated guarantees of Holdings, TransDigm UK and domestic restricted subsidiaries; unsecured | 2027 subordinated-notes indenture | d826058dex41.htm.jsonl, pages 106–107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Senior subordinated notes due January 2029 and May 2029 | USD 1,950 million (1,200; 750) | Subordinated to senior debt | Subordinated guarantees; unsecured | Not supplied | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Trade receivable securitization facility | USD 487.5 million drawn of USD 650 million | Debt of a securitization entity; non-recourse permission in the credit agreement | Receivables of the securitization entity; terms not supplied | Not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, page 60 |

### Covenant tests and headroom

| Test | Document and holder | Threshold | Current position | Creditor consequence | Source |
|---|---|---|---|---|---|
| Revolver usage trigger for the leverage test | Credit agreement; revolving lenders only | Above 40% of commitments | 7.36% at 2024-09-30; trigger not exceeded | Maintenance test dormant; covenant default channel inactive | d887611dex101.htm.jsonl, page 188; calculation L01 |
| Springing maximum net leverage | Credit agreement; revolving lenders only | 7.50x (8.00x for four quarters after a material acquisition) | Covenant ratio not reported; issuer states compliance | Only maintenance protection in the structure | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Incremental, junior-lien and unsecured debt | Credit agreement; all lenders | 7.25x net leverage | Met at Tranche L funding by certified condition; current ratio not reported | Releveraging permitted up to this level | d887611dex101.htm.jsonl, pages 4 and 59 |
| Pari secured debt | Credit agreement; all lenders | 5.00x secured net debt | Met at Tranche L funding by certified condition; current ratio not reported | Pari dilution of existing first-lien claims | d887611dex101.htm.jsonl, pages 4 and 59 |
| Unlimited restricted payments | Credit agreement; all lenders | 6.75x net leverage | Covenant ratio not reported; reported-EBITDA proxy 6.02x after the October 2024 dividend | Further dividends possible without a basket | d887611dex101.htm.jsonl, page 181; Financial foundation (CP-1) |
| Ratio debt and unlimited restricted payments | 2033 secured-notes indenture | Fixed-charge cover above 2.0x | Covenant ratio not reported | Loose test; cover rather than leverage governs | d887611dex41.htm.jsonl, pages 75 and 79 |
| Liens securing ratio debt | 2033 secured-notes indenture | 5.25x secured net debt | Covenant ratio not reported | Notes permit more secured debt than the credit agreement's 5.00x | d887611dex41.htm.jsonl, page 43 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for the springing leverage test | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Credit agreement section 6.14; exposure is USD 67 million of letters of credit over USD 910 million of commitments, no drawn loans stated; lower if any letter of credit is cash-collateralised |
| Springing maximum consolidated net leverage | 7.50 | Not supplied: covenant-defined ratio not reported | Not supplied: current covenant ratio not reported | Passes at or below | x | Tested only if the usage trigger is exceeded; 8.00x for four quarters after a material acquisition; issuer states compliance |
| Incremental, junior-lien and unsecured debt net leverage | 7.25 | Not supplied: covenant-defined ratio not reported | Not supplied: current covenant ratio not reported | Passes at or below | x | Incurrence test, not maintenance; certified as met at Tranche L funding |
| Pari secured debt secured net debt ratio | 5.00 | Not supplied: covenant-defined ratio not reported | Not supplied: current covenant ratio not reported | Passes at or below | x | Incurrence test; certified as met at Tranche L funding |
| Unlimited restricted payments net leverage | 6.75 | Not supplied: covenant-defined ratio not reported | Not supplied: current covenant ratio not reported | Passes at or below | x | Incurrence-style test at the time of each payment; reported-EBITDA proxy is not the covenant ratio |
| Secured-notes ratio debt and restricted payments fixed-charge cover | 2.0 | Not supplied: covenant-defined ratio not reported | Not supplied: current covenant ratio not reported | Passes above | x | Indenture test; fixed charges as defined are not reconstructed |
| Secured-notes liens on ratio debt secured net debt ratio | 5.25 | Not supplied: covenant-defined ratio not reported | Not supplied: current covenant ratio not reported | Passes at or below | x | Indenture permitted-lien test |

Only the usage trigger is measurable from the filings; every ratio test lacks a reported covenant-defined current value, and this chart is not a legal compliance opinion.

### Nearest pressure point
The nearest pressure point is the credit agreement's unlimited restricted-payment permission at 6.75x net leverage, not the dormant maintenance test. It allows any dividend that keeps pro forma net leverage, on the agreement's own earnings definition and net of unrestricted cash, at or below 6.75x with no default. Because covenant earnings add back cost savings of up to 25% of covenant EBITDA, transaction costs and dividend-equivalent payments, each turn of permitted leverage converts into more distributable debt than reported earnings would allow. A further debt-funded special dividend would raise leverage without adding earnings and reduce the cash cushion that protects both secured and subordinated creditors. The observable signal is a new special dividend declaration, an incremental term loan or secured-note issue whose use of proceeds includes distributions, or a revolver draw above the 40% usage trigger. A compliance certificate with the covenant net-leverage calculation and the earnings bridge would tighten the view.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, page 2; Earnings quality (CP-1D)

### Overall legal credit view
Overall the package is aggressive on the method's scale, with provisional confidence: protection is concentrated in sacred rights over payment terms and collateral release rather than in covenants that constrain behaviour. The main protections are the each-lender consent items, the narrow unrestricted-subsidiary designation right in the credit agreement and the individual-holder veto over adverse ranking changes in the secured-notes indenture. The main weaknesses are a revolver-only springing covenant, ratio-based unlimited restricted payments, pari secured capacity to 5.00x under the loans and 5.25x under the notes, and earnings definitions that inflate every ratio basket. The primary default risk path is releveraging through distributions that leaves less cash for a downturn; the primary recovery risk path is pari secured dilution and value held outside the guarantor group. For security selection, secured claims carry the strongest documented protection, while subordinated notes bear blockage and full-payment subordination. Further analysis needs the intercreditor agreement, security documents, compliance certificates and the remaining indentures. Legal & covenants completed with limitations; the key gaps are listed under Gaps.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 117–118; d826058dex41.htm.jsonl, pages 106–107

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement executed | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement and priority among first-lien classes; the document is not in the source set |
| 2019-11-13 | day | 2019-11-13 | 2027 senior subordinated notes indenture executed | Historical — Indenture dated as of November 13, 2019 | d826058dex41.htm.jsonl, page 1 | Source of subordination and 179-day payment blockage |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15, latest amendment changing restrictive covenants | Historical — the most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Restrictive covenants not changed by later amendments, per the issuer |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17: USD 1,500 million Tranche L incremental term loans to fund the special dividend | Historical — Amendment No. 17 and Incremental Term Loan Assumption Agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, pages 1–2 | Incremental capacity used for distribution; the October dividend payment and securitization draw are recorded in Business & governance |
| 2024-09-19 | day | 2024-09-19 | Joinder No. 6 to the First Lien Intercreditor Agreement for the 2033 secured notes | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds the 2033 notes to the shared first-lien collateral |
| 2027-09-15 | day | 2024-09-19 | Initial redemption date of the 2033 secured notes | Scheduled — “Initial Redemption Date” means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Start of fixed-price call schedule; refinancing optionality for the issuer |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity | Scheduled — The maturity date of the revolving credit facility is February 27, 2029 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance covenant ends with the revolver unless replaced |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report as summarised by Business & governance; both Delaware corporations per the Amendment No. 17 recital; United States |
| TransDigm Inc. | Issuer and primary obligor | Structural claim | 2033 secured notes | 2033 secured-notes indenture, New York law; Delaware issuer |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | 2033 secured notes | Indenture Article X and annual report guarantor description; New York law |
| TransDigm UK | Senior secured guarantee | Guarantee | 2033 secured notes | Annual report guarantor description; indenture New York law; UK entity |
| Domestic restricted subsidiaries | Senior secured guarantee where borrower or guarantor under the credit facilities | Guarantee | 2033 secured notes | Indenture section 4.17 and annual report; New York law; United States |
| TransDigm UK | Grants debenture over its assets to the UK collateral agent | Security | 2033 secured notes | Debenture defined in the indenture; governing law of the debenture not established; UK entity |
| TransDigm Inc. | Borrower | Structural claim | Senior secured credit facility | Amendment No. 17, New York law; Delaware borrower |
| TransDigm Group Incorporated | Holdings guarantor and loan party | Guarantee | Senior secured credit facility | Amendment No. 17 and Financial foundation debt stack; New York law |
| TransDigm Group Incorporated | Subordinated guarantee | Guarantee | 2027 subordinated notes | 2027 indenture and annual report; New York law |
| Domestic restricted subsidiaries | Subordinated guarantee | Guarantee | 2027 subordinated notes | Annual report guarantor description; 2027 indenture; United States |
| Non-guarantor subsidiaries | Their creditors rank ahead on their assets | Structural claim | 2033 secured notes | Annual report states notes are structurally subordinated to non-guarantor liabilities; jurisdictions not established |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facility | Equal right of payment | Payment rank | 2033 secured notes | Annual report ranking description; credit agreement and indenture under New York law |
| 2033 secured notes | Senior in right of payment | Payment rank | 2027 subordinated notes | Annual report ranking and 2027 indenture Article 10; New York law |
| Senior secured credit facility | Shared first-priority lien under the first-lien intercreditor agreement | Security rank | 2033 secured notes | Indenture definition of the intercreditor agreement and Joinder No. 6; agreement itself and its governing law not supplied |
| Senior secured credit facility | Designated senior debt can block payments up to 179 days in 360 days | Standstill | 2027 subordinated notes | 2027 indenture section 10.03; New York law |
| First Lien Intercreditor Agreement | Controls on conflict with the indenture and security documents | Enforcement control | 2033 secured notes | Indenture section 12.02; agreement not supplied |
| Notes collateral agents | Only the agents enforce; holders may not act directly | Enforcement control | 2033 secured notes | Indenture section 12.01; New York law |
| Credit agreement agent | Sole right to proceed against the collateral; may credit bid | Enforcement control | Senior secured credit facility | Credit agreement Article VIII; New York law |
| Senior secured credit facility | Release of a guarantor under the facility releases its note guarantee | Release | 2033 secured notes | Indenture section 10.07(e); New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 7 |
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

### Analytical appendix — complete canonical registers

All monetary amounts are USD millions unless stated. Provision locators are page numbers of the supplied documents. Indicative figures are not covenant calculations.

### Evidence register

| Evidence ID | Evidence | Source |
|---|---|---|
| E01 | Restrictive covenants summary; compliance with all debt covenants at 2024-09-30; no maintenance covenants except revolver; 40% usage (USD 364 million) trigger for 7.50x; incremental conditions 7.25x and 5.00x; Amendment No. 15 latest covenant amendment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E02 | Guarantor perimeter, structural subordination to non-guarantors, guarantor summary (sales 6,294; goodwill 8,186; due from non-guarantors 1,881), term loans 8,702, revolver 910, letters of credit 67, availability 843 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59 |
| E03 | Amendment No. 17: Delaware borrower and holdings; USD 1,500 million Tranche L; proceeds with 2033 notes and cash to fund special dividend; conditions 7.25x and 5.00x after the transactions | d887611dex101.htm.jsonl, pages 1–4 |
| E04 | Consolidated EBITDA add-backs: transaction and refinancing costs, non-cash charges, earn-outs, dividend equivalent payments, cost savings within 24 months capped at 25% of covenant EBITDA | d887611dex101.htm.jsonl, page 24 |
| E05 | Permitted indebtedness clauses (11) to (18): acquired debt, pari secured at 5.00x, junior or unsecured at 7.25x, general basket, foreign subsidiaries, subordinated at 7.25x, securitization non-recourse | d887611dex101.htm.jsonl, pages 58–60 |
| E06 | Reclassification at borrower's discretion; limited-condition acquisition testing; investments in unrestricted subsidiaries; general investments; joint ventures at 7.00x | d887611dex101.htm.jsonl, pages 61–62 |
| E07 | Required lenders more than 50% | d887611dex101.htm.jsonl, page 71 |
| E08 | Unrestricted cash definition; unrestricted-subsidiary designation limited to newly acquired or formed subsidiaries | d887611dex101.htm.jsonl, page 81 |
| E09 | Incremental loans: maturity and weighted-life limits; 50 bp yield protection; 18-month and acquisition carve-outs; more favourable terms flow to existing lenders | d887611dex101.htm.jsonl, pages 143–145 |
| E10 | Restricted payments: general basket; legacy clause (10); unlimited payments at 6.75x | d887611dex101.htm.jsonl, pages 180–181 |
| E11 | Section 6.14 springing covenant for revolving lenders only, amendable by required revolving lenders; payment events of default | d887611dex101.htm.jsonl, page 188 |
| E12 | Agent sole right to proceed against collateral; credit bid; agent authorised to sign intercreditor agreements | d887611dex101.htm.jsonl, page 197 |
| E13 | Amendment thresholds and sacred rights; agent must admit pari or junior secured debt to collateral; non-pro rata offers to all lenders of a class; automatic lien releases | d887611dex101.htm.jsonl, pages 204–206 |
| E14 | New York governing law of the credit agreement | d887611dex101.htm.jsonl, page 222 |
| E15 | First Lien Intercreditor Agreement dated 2019-02-13 with Joinders 1 to 6; initial redemption date 2027-09-15; securitization indebtedness measured at face of receivables interests | d887611dex41.htm.jsonl, page 30 |
| E16 | Indenture investments: greater of USD 500 million and 25% of total assets; liens on ratio debt at 5.25x; total assets defined as consolidated assets of the company and restricted subsidiaries | d887611dex41.htm.jsonl, pages 38, 43 and 49 |
| E17 | Indenture restricted payments: builder from USD 400 million plus 50% of net income since 2010; management basket; general basket; unlimited at fixed-charge cover above 2.0x | d887611dex41.htm.jsonl, pages 70–75 |
| E18 | Indenture ratio debt at fixed-charge cover above 2.0x; non-guarantor cap USD 400 million | d887611dex41.htm.jsonl, page 79 |
| E19 | Additional guarantees where a subsidiary guarantees the credit facilities or USD 200 million of capital markets debt; covenant suspension on two investment-grade ratings | d887611dex41.htm.jsonl, pages 89–90 |
| E20 | Indenture amendments: majority; each affected holder for payment terms and adverse ranking changes; two-thirds for collateral release or adverse intercreditor change | d887611dex41.htm.jsonl, pages 117–118 |
| E21 | Guarantor release events including unrestricted designation and release under the credit facilities; lien release on unrestricted designation | d887611dex41.htm.jsonl, pages 122 and 137 |
| E22 | Indenture New York law; holders may not enforce security documents directly; intercreditor agreement controls on conflict | d887611dex41.htm.jsonl, pages 126, 128 and 135 |
| E23 | UK debenture of TransDigm UK in favour of the UK collateral agent | d887611dex41.htm.jsonl, page 24 |
| E24 | Indenture cost-savings add-back capped at 35% of covenant EBITDA | d887611dex41.htm.jsonl, page 16 |
| E25 | 2027 notes subordination, insolvency payment in full, payment blockage 179 days in 360 days | d826058dex41.htm.jsonl, pages 106–107 |
| E26 | Debt register, principal and carrying values, reported and issuer-adjusted EBITDA, post-dividend net leverage, total assets | Financial foundation (CP-1) |
| E27 | Recapitalisation of USD 4,348 million; October 2024 payment and securitization draw | Business & governance (CP-1A) |
| E28 | Issuer add-backs recur and are rejected for recurring-credit earnings | Earnings quality (CP-1D) |

### T4D.1 Source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Conformed credit agreement in Amendment No. 17 | Executed amendment; annex is a marked conformed text | 1 | Schedules, collateral documents and guarantee agreement not reviewed | Completed with Limitations |
| 2033 secured-notes indenture | Executed | 1 | Security agreement, debenture and intercreditor agreement referenced but not supplied | Completed with Limitations |
| 2027 subordinated-notes indenture | Executed | 1 | Only the subordination article and identity pages read | Completed with Limitations |
| First Lien Intercreditor Agreement and joinders | Referenced; not in the source set | 2 | Enforcement control and voting between first-lien classes not established | Completed with Limitations |
| Annual report | Issuer filing, retrospective | Supplementary issuer disclosure | Signed after the as-of date; summary only | Completed with Limitations |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as conformed in Amendment No. 17 | Credit agreement | Base 2014-06-04; amendment 2024-09-19 | Executed | Controls loan and revolver covenants, incremental, releases and amendments | Governs USD 8,702 million term loans and the revolver | E03; E13 |
| 1 | 2033 secured-notes indenture | Indenture | 2024-09-19 | Executed | Controls 2033 note covenants, guarantees, collateral provisions | Loosest supplied secured-debt and payment tests | E15; E20 |
| 1 | 2027 subordinated-notes indenture | Indenture | 2019-11-13 | Executed | Controls subordination and blockage | Junior claim mechanics | E25 |
| 1 | 2013 and 2014 restatements and Amendment No. 16 | Credit agreement chain | 2013-02-28; 2014-06-04; 2024-06-04 | Executed; superseded for current text by the Amendment No. 17 annex | Provenance only; not relied on here | No separate current effect identified | E26 |
| 2 | First Lien Intercreditor Agreement with Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; latest joinder 2024-09-19 | [Insufficient Information] — ICA not in the source set | Controls first-lien enforcement and priority | Decisive for uptier and enforcement conclusions | E15; E22 |
| 3 | Compliance certificates and covenant schedules | Compliance evidence | Not supplied: none in the source set | [Insufficient Information] — compliance certificate not in the source set | Would control tested ratios and basket usage | Prevents exact headroom | E01 |
| Supplementary issuer disclosure | Annual report | Issuer filing | 2024-11-07 | Filed, retrospective | Summarises covenants and guarantors | Compliance statement and usage trigger amount | E01; E02 |

### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Conformed credit agreement | Executed credit agreement | 2024-09-19 | Executed | Legal formula | Debt, lien, payment and investment formulas | E05; E10 |
| 1 | 2033 secured-notes indenture | Executed indenture | 2024-09-19 | Executed | Legal formula | Fixed-charge tests and builder basket | E17; E18 |
| Financial input | Financial foundation | Accepted financial analysis | As of 2024-09-30 | Accepted | Financial input | Reported EBITDA, debt and post-dividend leverage proxies only | E26 |
| Supplementary issuer disclosure | Annual report | Issuer filing | 2024-11-07 | Filed | Usage: revolver letters of credit and securitization draw | Usage trigger measurement | E01; E02 |
| 3 | Compliance certificates and basket trackers | Usage evidence | Not supplied: none in the source set | [Insufficient Information] — compliance certificate and basket tracker not in the source set | Usage | Remaining capacity undetermined | E01 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x (8.00x after a material acquisition) only if revolver exposure exceeds 40% of commitments; revolving lenders only | Credit agreement section 6.14 | Default trigger rarely live; term lenders and noteholders have no maintenance protection | Neutral — Stable | Not assessed: no comparative source supplied | E11; E01 |
| Pari secured debt | Same-lien senior secured debt at or below 5.00x secured net debt; maturity and weighted-life limits | Credit agreement permitted indebtedness clause (12) | Dilutes existing first-lien recovery | Negative — Leverage Increase | Not assessed: no comparative source supplied | E05 |
| Junior and unsecured debt | Junior-lien or unsecured at or below 7.25x net leverage; subordinated at 7.25x | Clauses (12) and (17) | Releverages without priming | Negative — Leverage Increase | Not assessed: no comparative source supplied | E05 |
| Incremental facilities and yield protection | Incremental loans subject to 7.25x and 5.00x; 50 bp yield protection with 18-month and acquisition carve-outs | Section 2.24 | Pricing protection lapses; dilution capacity | Negative — Leverage Increase | Not assessed: no comparative source supplied | E09; E01 |
| Restricted payments | Unlimited at 6.75x; general basket greater of USD 75 million and 3% of covenant EBITDA | Section 6.02 | Cash leakage to equity | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E10 |
| Indenture restricted payments | Builder from USD 400 million plus 50% of net income; unlimited above 2.0x fixed-charge cover | 2033 indenture section 4.07 | Coverage test is loose for a high-margin issuer | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E17 |
| Investments | General greater of USD 500 million and 25% of total assets; unrestricted subsidiaries greater of USD 250 million and 10% of covenant EBITDA; joint ventures greater of USD 1,000 million and 40% at 7.00x | Permitted investments clauses (1)(c), (10), (11) | Value can leave the restricted group | Negative — Covenant Erosion | Not assessed: no comparative source supplied | E06; E16 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries; no recourse debt; compliance with payment and investment covenants | Unrestricted Subsidiary definition | Limits drop-down of existing assets | Neutral — Stable | Not assessed: no comparative source supplied | E08 |
| Guarantor coverage and release | Note guarantees from subsidiaries guaranteeing the credit facilities or USD 200 million of capital markets debt; automatic release on unrestricted designation or facility release | 2033 indenture sections 4.17 and 10.07 | Note coverage follows bank coverage | Neutral — Stable | Not assessed: no comparative source supplied | E19; E21 |
| Covenant suspension | Most covenants suspended with two investment-grade ratings and no default | 2033 indenture section 4.19 | Protection would fall away on upgrade | Neutral — Stable | Not assessed: no comparative source supplied | E19 |
| Amendments | Required lenders more than 50%; each-lender items; notes majority, each-holder and two-thirds items | Credit agreement section 9.02; indenture section 9.02 | Lien subordination not a listed unanimous item in the credit agreement | Negative — Refinancing Risk | Not assessed: no comparative source supplied | E07; E13; E20 |
| Events of default | Principal non-payment; interest after five business days; other amounts after 30 days | Credit agreement Article VII | Short payment grace | Neutral — Stable | Not assessed: no comparative source supplied | E11 |

### Provision-level analysis: definitions, debt, leakage, collateral and defaults
Covenant earnings are wider than reported earnings. The credit agreement adds back transaction, refinancing and acquisition-related costs without a cap, dividend-equivalent payments, earn-outs and projected cost savings from actions within 24 months up to 25% of covenant EBITDA; the secured-notes indenture allows cost savings up to 35%. Every grower basket, the 6.75x dividend test and the 5.00x pari test therefore expand as add-backs rise, which is why the challenge of issuer adjustments in Earnings quality matters for capacity, not only for credit leverage.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex41.htm.jsonl, page 16; Earnings quality (CP-1D)

Debt capacity is ratio-led and fungible. The borrower may divide and reclassify debt between permitted categories at its discretion, and limited-condition acquisitions are tested at signing. Same-lien debt must mature no earlier than the latest term loan and cannot be guaranteed by non-loan parties, which constrains structurally senior financing within the credit agreement, although the indenture still permits USD 400 million of ratio debt at non-guarantor restricted subsidiaries.
Basis: d887611dex101.htm.jsonl, pages 58–61; d887611dex41.htm.jsonl, page 79

Collateral releases are automatic on permitted disposals to non-loan parties and on full repayment, while releasing all or substantially all collateral needs every lender. Enforcement sits with the credit-agreement agent and the notes collateral agents; individual holders cannot enforce the security documents. Payment defaults carry short grace periods, and the springing covenant default belongs to the revolving lenders.
Basis: d887611dex101.htm.jsonl, pages 205–206; d887611dex101.htm.jsonl, page 197; d887611dex41.htm.jsonl, page 128; d887611dex101.htm.jsonl, page 188

### Definition conflict register

| Item | Covenant definition | Carrying-value basis | Divergence and effect | Source |
|---|---|---|---|---|
| Covenant debt numerator | Covenant indebtedness definitions not read in full; indenture measures securitization debt at face of receivables interests | Carrying debt USD 24,880 million; gross principal USD 25,068 million | Covenant ratios may use principal rather than carrying amounts; proxies here use Financial foundation's carrying-based figures | d887611dex41.htm.jsonl, page 30; Financial foundation (CP-1) |
| Cash netting | Unrestricted cash of Holdings, borrower and restricted subsidiaries not subject to other liens | All reported cash and equivalents | Covenant netting may be smaller than reported cash | d887611dex101.htm.jsonl, page 81; Financial foundation (CP-1) |
| Earnings denominator | Consolidated EBITDA with uncapped transaction add-backs and capped cost savings | Reported EBITDA USD 3,813 million; issuer EBITDA As Defined USD 4,173 million | Covenant earnings likely at least issuer-adjusted earnings; not reported | d887611dex101.htm.jsonl, page 24; Financial foundation (CP-1) |
| Customer advances | Not established whether contract liabilities fall within covenant indebtedness | Contract liabilities USD 177 million outside financial debt | Likely outside every debt basket; float not captured by ratio tests | Financial foundation (CP-1) |

### T4C.3 Covenant definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA (credit agreement) | Definition clauses (e) to (m) | Net income plus add-backs incl. transaction costs, non-cash charges, earn-outs, dividend equivalents and cost savings up to 25% | Covenant earnings bridge | Expands every grower and ratio basket | Add-back inflation | Negative — Covenant Erosion | E04 |
| Consolidated EBITDA (2033 indenture) | Definition clause (M) | Similar add-backs; cost savings up to 35% | Covenant earnings bridge | Larger inflation than the credit agreement | Add-back inflation | Negative — Covenant Erosion | E24 |
| Consolidated Net Leverage Ratio | Credit agreement definitions; section 6.14 | Consolidated debt less unrestricted cash over four-quarter covenant EBITDA, pro forma | Covenant debt, unrestricted cash, covenant EBITDA | Governs 7.50x, 7.25x, 6.75x and 7.00x tests | Cash netting and add-backs lower the ratio | Negative — Covenant Erosion | E08; E11 |
| Consolidated Secured Net Debt Ratio | Credit agreement clause (12); indenture lien clause (xxxi) | Secured debt less unrestricted cash over covenant EBITDA | Secured covenant debt, cash, covenant EBITDA | Governs 5.00x pari debt and 5.25x note liens | Pari secured dilution | Negative — Leverage Increase | E05; E16 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture sections 4.07 and 4.09 | Covenant EBITDA over fixed charges, pro forma | Fixed charges as defined | Governs ratio debt and unlimited payments above 2.0x | Loose test for a high-margin issuer | Negative — Covenant Erosion | E17; E18 |
| Total Assets | 2033 indenture definition | Consolidated assets of the company and restricted subsidiaries | Balance sheet of the restricted group | Sizes the 25% investment basket | Asset-based grower basket | Negative — Covenant Erosion | E16 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger for section 6.14 | max-ratio | 40.00% | 7.36% | Revolving exposure 67 over commitments 910 | 32.64% | Compliant | Trigger not exceeded so the leverage test did not apply; drawn loans taken as nil because availability equals commitments less letters of credit | About USD 297 million of further exposure activates the test | Neutral — Stable | E01; E02; E11 |
| Springing consolidated net leverage | max-ratio | 7.50x | Not supplied: covenant-defined ratio not reported | Covenant net debt over covenant EBITDA | [Insufficient Information] — missing: covenant-defined current ratio | Not Calculable | Issuer states compliance; reported-EBITDA proxy 6.02x after the October dividend is not the covenant ratio | Only maintenance protection; revolving lenders only | Neutral — Stable | E01; E11; E26 |
| Incremental, junior-lien and unsecured net leverage | max-ratio | 7.25x | Not supplied: covenant-defined ratio not reported | Pro forma covenant net leverage at incurrence | [Insufficient Information] — missing: covenant-defined current ratio | Not Calculable | Certified met at Tranche L funding | Releveraging capacity | Negative — Leverage Increase | E03; E05 |
| Pari secured net debt | max-ratio | 5.00x | Not supplied: covenant-defined ratio not reported | Pro forma secured covenant net debt over covenant EBITDA | [Insufficient Information] — missing: covenant-defined current ratio | Not Calculable | Certified met at Tranche L funding | Pari dilution | Negative — Leverage Increase | E03; E05 |
| Unlimited restricted payments net leverage | max-ratio | 6.75x | Not supplied: covenant-defined ratio not reported | Pro forma covenant net leverage after the payment | [Insufficient Information] — missing: covenant-defined current ratio | Not Calculable | Reported-EBITDA proxy indicates room; not a covenant figure | Cash leakage | Negative — Covenant Erosion | E10; E26 |
| Indenture fixed-charge cover | min-ratio | 2.0x | Not supplied: covenant-defined ratio not reported | Covenant EBITDA over fixed charges | [Insufficient Information] — missing: covenant-defined current ratio and fixed charges | Not Calculable | Fixed charges as defined not reconstructed | Unlimited payments and ratio debt | Negative — Covenant Erosion | E17; E18 |
| Indenture liens on ratio debt | max-ratio | 5.25x | Not supplied: covenant-defined ratio not reported | Pro forma secured covenant net debt | [Insufficient Information] — missing: covenant-defined current ratio | Not Calculable | Wider than the credit agreement's 5.00x | Secured dilution | Negative — Leverage Increase | E16 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Debt incurrence capacity | Pari secured clause (12) | Ratio Basket: secured net debt at or below 5.00x | No default; maturity and weighted-life limits; loan-party obligors only | Covenant ratio not reported | Not supplied: no basket tracker | Not calculable: covenant inputs absent | Not calculable: covenant inputs absent | Formula Extracted Only | High | Pari claims share collateral | Negative — Leverage Increase | E05 |
| Debt incurrence capacity | Junior or unsecured clause (12); subordinated clause (17) | Ratio Basket: net leverage at or below 7.25x | No default | Covenant ratio not reported | Not supplied: no basket tracker | Not calculable: covenant inputs absent | Not calculable: covenant inputs absent | Formula Extracted Only | Moderate | Releveraging without priming | Negative — Leverage Increase | E05 |
| Debt incurrence capacity | General basket clause (13) | Grower Basket: greater of USD 250 million and 10% of covenant EBITDA | Borrower and guarantors | Covenant EBITDA not reported | Not supplied: no basket tracker | Floor USD 250 million | Not calculable: usage absent | Formula Extracted Only | Moderate | Free-and-clear add-on debt | Negative — Leverage Increase | E05 |
| Debt incurrence capacity | Foreign subsidiaries clause (14) | Grower Basket: greater of USD 450 million and 18% of covenant EBITDA | Includes subsidiary preferred stock | Covenant EBITDA not reported | Not supplied: no basket tracker | Floor USD 450 million | Not calculable: usage absent | Formula Extracted Only | Moderate | Structurally senior debt at non-guarantors | Negative — Leverage Increase | E05 |
| Debt incurrence capacity | Securitization clause (18) | Grower Basket: greater of USD 725 million and 20% of covenant EBITDA | Non-recourse to borrower and subsidiaries | Facility USD 650 million; drawn USD 487.5 million at year-end; remainder drawn in October 2024 | Facility fully drawn after October 2024 | Floor USD 725 million | Not calculable: covenant EBITDA absent | Provisional | Moderate | Receivables leave first-lien reach | Negative — Liquidity Deterioration | E05; E01; E27 |
| Debt incurrence capacity | Indenture ratio debt at non-guarantors | Ratio Basket: fixed-charge cover above 2.0x, non-guarantor cap USD 400 million | No default stated in the ratio test | Covenant ratio not reported | Not supplied: no basket tracker | Cap USD 400 million | Not calculable: usage absent | Formula Extracted Only | Moderate | Structural subordination of notes | Negative — Leverage Increase | E18 |
| Restricted payment capacity | Unlimited payments section 6.02 | Ratio Basket: net leverage at or below 6.75x | No default | Reported-EBITDA proxy 6.02x after October 2024 dividend | September dividend USD 4,348 million used capacity under an unidentified basket | Not calculable: covenant inputs absent | Not calculable: covenant inputs absent | Provisional | High | Cash leakage to equity | Negative — Covenant Erosion | E10; E26; E27 |
| Restricted payment capacity | General basket clause (7) | Grower Basket: greater of USD 75 million and 3% of covenant EBITDA | No default | Covenant EBITDA not reported | Not supplied: no basket tracker | Floor USD 75 million | Not calculable: usage absent | Formula Extracted Only | Low | Small additional leakage | Negative — Covenant Erosion | E10 |
| Builder / available amount capacity | Indenture builder | Builder Basket: USD 400 million plus 50% of cumulative net income since October 2010 plus equity proceeds | No default | Cumulative covenant net income not supplied | Payments since December 2010 not supplied | Not calculable: cumulative inputs absent | Not calculable: usage absent | Insufficient Information | Insufficient Information | Notes-level leakage ceiling unknown | Insufficient Information | E17 |
| Investment capacity | General investments clause (10) and indenture clause (xii) | Grower Basket: greater of USD 500 million and 25% of total assets | Outstanding investments under the clause | Consolidated total assets USD 25,586 million used as proxy | Not supplied: no basket tracker | Indicative USD 6,396.5 million | Not calculable: usage absent | Provisional | High | Value can move outside the restricted group | Negative — Covenant Erosion | E06; E16; E26 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries clause (1)(c) | Grower Basket: greater of USD 250 million and 10% of covenant EBITDA | Designation only of newly acquired or formed subsidiaries | Covenant EBITDA not reported | No unrestricted subsidiary identified | Floor USD 250 million | Not calculable: usage absent | Formula Extracted Only | Moderate | Drop-down route bounded | Negative — Covenant Erosion | E06; E08 |
| Incremental facility capacity | Section 2.24 | Incremental Ratio Amount: net leverage at or below 7.25x and secured net debt at or below 5.00x | Maturity and weighted-life limits; 50 bp yield protection | Certified met at Tranche L funding | Tranche L USD 1,500 million used | Not calculable: covenant inputs absent | Not calculable: covenant inputs absent | Provisional | High | Pari dilution and pricing pressure | Negative — Leverage Increase | E03; E09 |
| MFN protection | Section 2.24 proviso | Yield excess above 50 bp passed to existing tranches | Excludes acquisition loans and loans after 18 months | Tranche L effective in September 2024; exact effective day not stated | Not applicable: protection, not a basket | Not applicable: protection, not a basket | Not applicable: protection, not a basket | Ready with Limitations | Moderate | Pricing protection lapses | Negative — Refinancing Risk | E09 |
| Guarantor / collateral release capacity | Automatic release on permitted disposal; note guarantee release on facility release | Release mechanic | Disposal to non-loan party in compliance | Not applicable: no release identified | Not applicable: no release identified | Not calculable: event-driven | Not calculable: event-driven | Ready with Limitations | Moderate | Coverage can shrink without noteholder vote | Negative — Covenant Erosion | E13; E21 |

Baskets are not summed: debt categories can be reclassified at the borrower's discretion and investment and payment routes overlap.

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured debt under the credit agreement | Same-lien debt at or below 5.00x secured net debt; agent must admit it to collateral | Formula Extracted Only | Pari dilution of shared first-lien collateral | Higher interest burden | Lower recovery per first-lien claim | Secured loans and notes equally exposed | E05; E13 |
| Secured ratio debt under the 2033 indenture | Liens on ratio debt at or below 5.25x | Formula Extracted Only | Notes allow more secured debt than loans | Higher interest burden | Dilution if loans also permit | Notes covenant is the looser constraint | E16 |
| Incremental term loans | 7.25x and 5.00x; yield protection 50 bp for 18 months | Provisional | Pari dilution; pricing reset risk | Higher interest burden | Dilution | Existing tranches lose pricing protection after 18 months | E09 |
| Majority-led lien subordination | Not listed as an each-lender item in the credit agreement | Insufficient Information | Theoretical uptier by required lenders | Raises default severity if used in distress | Could subordinate minority lenders | Depends on intercreditor terms not supplied | E13; E07 |
| Non-guarantor debt | Indenture USD 400 million; foreign subsidiaries floor USD 450 million | Formula Extracted Only | Structurally senior claims on non-guarantor assets | Limited | Reduces value reaching group creditors | All group classes affected | E18; E05 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Special dividends | USD 4,348 million declared 2024-09-19 and paid in October 2024, funded by Tranche L, 2033 notes and cash | Unlimited at 6.75x; indenture unlimited above 2.0x cover | Used; remaining not calculable | Cash leaves the group entirely | High | Negative — Covenant Erosion | E10; E17; E27 |
| General investments | Basket greater of USD 500 million and 25% of total assets | Grower basket | Indicative USD 6,396.5 million; usage not supplied | Could fund entities outside the guarantor group | High | Negative — Covenant Erosion | E06; E16 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries; investment cap greater of USD 250 million and 10% | Grower basket plus designation conditions | No designation identified | Note guarantees and liens release on designation | Moderate | Negative — Covenant Erosion | E08; E21 |
| Joint ventures | Greater of USD 1,000 million and 40% of covenant EBITDA at 7.00x | Ratio-conditioned grower basket | Usage not supplied | Assets move to non-guarantor joint ventures | Moderate | Negative — Covenant Erosion | E06 |
| Asset sales | Automatic lien release on permitted disposals to non-loan parties | Asset-sale covenant | Usage not supplied | Collateral reduced without lender vote | Moderate | Negative — Covenant Erosion | E13 |

### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Credit agreement clause (m) | Actions within 24 months; up to 25% of covenant EBITDA | Formula Extracted Only | Raises the denominator of every leverage test | More debt and payments permitted than reported earnings support | E04 |
| Projected cost savings | 2033 indenture clause (M) | Up to 35% of covenant EBITDA | Formula Extracted Only | Looser than the credit agreement | Notes allow more ratio debt | E24 |
| Transaction, acquisition and refinancing costs | Credit agreement clause (e) | Uncapped | Formula Extracted Only | Recurring costs excluded from covenant earnings | Earnings quality rejects these for recurring credit | E04; E28 |
| Dividend equivalent payments | Credit agreement clause (k) | Uncapped | Formula Extracted Only | Distribution-linked payments raise covenant earnings | Leakage increases capacity for further leakage | E04 |
| Earn-outs and non-cash charges | Clauses (f) and (i) | Non-cash excludes accruals for future cash | Formula Extracted Only | Acquisition consideration excluded | Acquisition-led capacity growth | E04 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Debt reclassification | Borrower may divide and reclassify debt among permitted categories | Basket capacity refreshes and cannot be summed reliably | Moderate | High | Not addressed: the orchestrator routes results | E06 |
| Ratio dividend permission used | USD 4,348 million recapitalisation | Repeatable extraction | High | High | Not addressed: the orchestrator routes results | E10; E27 |
| Guarantee release follows bank release | Note guarantee released when released under the credit facilities | Noteholders depend on bank-lender decisions | Moderate | High | Not addressed: the orchestrator routes results | E21 |
| Lien subordination not a sacred right | Each-lender list omits subordination | Theoretical uptier | High | Low | Not addressed: the orchestrator routes results | E13 |
| Covenant suspension on investment grade | Most indenture covenants suspended | Protection could fall away | Low | High | Not addressed: the orchestrator routes results | E19 |

### T4C.11 Capacity risk prioritisation

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Unlimited restricted payments at 6.75x | High | Moderate | Debt-funded distributions | Thinner cash cushion | Less value for all classes | Track dividend declarations and use of proceeds | E10; E27 |
| 2 | Pari secured debt at 5.00x (loans) and 5.25x (notes) | High | Moderate | Pari dilution | Higher interest burden | Lower first-lien recovery per claim | Track secured issuance and certified ratios | E05; E16 |
| 3 | General investment basket | High | Low | Value transfer outside guarantor group | Limited | Lower reachable value | Track investments and new subsidiaries | E06; E16 |
| 4 | Add-back inflation | Moderate | Moderate | Covenant earnings above reported | Masks releveraging | Expands baskets | Obtain covenant earnings bridge | E04; E28 |
| 5 | Majority amendment of lien priority | High | Low | Uptier | Distress outcome severity | Minority subordination | Track amendments and intercreditor changes | E13 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Revolver-only 7.50x test above 40% usage | Early-warning default rarely live | Lowers near-term covenant-default probability but removes early lender leverage | Late intervention may reduce recoveries | Revolver usage each quarter | E11; E01 |
| Restricted payments | 6.75x unlimited test; recapitalisation used it | Releveraging | Raises default probability over the cycle | Less residual value | Dividend declarations | E10; E27 |
| Pari secured debt | 5.00x and 5.25x tests | Dilution | Higher interest burden | Lower first-lien recovery | Secured issuance | E05; E16 |
| Structural subordination | About 20.73% of sales outside guarantor group | Non-guarantor creditors rank first on those assets | Limited | Lower recovery for all group classes | Guarantor summary each year | E02 |
| Subordination and blockage | 179-day blockage; full payment of senior debt first | Junior cash flow interruption | Raises subordinated default probability in stress | Subordinated recovery after senior paid in full | Senior defaults and blockage notices | E25 |
| Amendment mechanics | Majority amendments; each-lender list omits subordination | Uptier risk | Limited | Minority creditors could be primed | Amendment filings | E13 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions in the registers above | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed: no comparative source supplied | Not assessed: no comparative source supplied | Insufficient Information | E01 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x above 40% usage | No early lender control for term lenders and noteholders | Neutral — Stable | Completed | E11 |
| Debt / lien incurrence capacity | 4 | Pari secured to 5.00x and 5.25x; junior to 7.25x; reclassification; 18-month yield protection | Dilution and releveraging | Negative — Leverage Increase | Provisional | E05; E09; E16 |
| RP / investment / leakage capacity | 4 | Unlimited payments at 6.75x and above 2.0x cover; 25% of total assets investment basket; used for USD 4,348 million | Cash and value leakage | Negative — Covenant Erosion | Provisional | E10; E16; E27 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped transaction costs; cost savings 25% and 35% | Capacity inflation | Negative — Covenant Erosion | Provisional | E04; E24 |
| Collateral / guarantor protection | 3 | Designation limited to new subsidiaries; automatic releases; non-guarantor share about 20.73% of sales | Coverage bounded but releasable | Neutral — Stable | Provisional | E08; E21; E02 |
| Amendment / control mechanics | 3 | Each-lender payment, sharing and collateral items; subordination not listed; notes each-holder ranking veto | Uptier theoretical | Negative — Refinancing Risk | Provisional | E13; E20 |
| Overall | 4 | Weighted to leakage and dilution areas, not averaged | Extraction and dilution dominate | Negative — Covenant Erosion | Provisional | E10; E05 |

Covenant aggressiveness score 4 of 5, status Provisional because the intercreditor agreement, security documents and compliance certificates are missing.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further special dividend | Section 6.02 6.75x test | Repeat of debt-funded extraction | PD up; LGD up | Track declarations and incremental use of proceeds | E10 |
| Revolver usage above 40% | Section 6.14 trigger | Activates the only maintenance test | PD signal of liquidity stress | Quarterly revolver exposure | E11 |
| New secured issuance near 5.00x or 5.25x | Clause (12); indenture lien (xxxi) | Pari dilution | LGD up for first lien | Certified ratios in issuance documents | E05; E16 |
| Amendment touching lien priority or intercreditor | Section 9.02 credit agreement | Uptier vulnerability | LGD up for non-participants | Amendment filings and intercreditor joinders | E13 |
| Guarantor release or new subsidiary designated unrestricted | Indenture section 10.07; designation definition | Coverage shrinks | LGD up | Guarantor list in each annual report | E21; E08 |

### T4D.2 Entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware, United States | Public shareholders | Not a restricted subsidiary; holding company | No significant operations or assets apart from TransDigm Inc. | Yes, as guarantor | E02; E03 |
| TransDigm Inc. | Borrower and note issuer | Delaware, United States | TransDigm Group Incorporated | Borrower | Guarantor summary sales USD 6,294 million combined with guarantors | Yes | E02; E03 |
| TransDigm UK | Guarantor; debenture grantor for 2033 notes | United Kingdom | [Insufficient Information] — immediate parent not established | Restricted guarantor | Not supplied: entity-level value not disclosed | Yes | E02; E23 |
| Domestic restricted subsidiaries | Guarantors | United States | TransDigm Inc. directly or indirectly | Restricted | Included in guarantor summary | Yes | E02 |
| Non-guarantor subsidiaries, including foreign subsidiaries | Non-guarantors | Not established | TransDigm Inc. group | Restricted; not guarantors | About USD 1,646 million of sales and USD 2,233 million of goodwill outside the guarantor summary | No | E02; E26 |
| Securitization entity | Receivables financing vehicle | Not established | Not established | Securitization Entity under the credit agreement | Receivables backing USD 487.5 million drawn at year-end | No | E05; E01 |
| Unrestricted subsidiaries | None identified | Not applicable: none identified | Not applicable: none identified | Only newly acquired or formed subsidiaries may be designated | Not applicable: none identified | No | E08 |

### T4D.3 Guarantee map

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities and secured notes | Senior secured guarantee | Upstream from parent to subsidiary borrower | Defeasance or discharge for notes; release of all guarantees needs each lender under the credit agreement | E02; E13; E21 |
| TransDigm UK × 2028 to 2033 secured notes and subordinated notes | Senior secured; subordinated for subordinated notes | Cross-stream | Sale, unrestricted designation, release under credit facilities | E02; E21 |
| Domestic restricted subsidiaries × credit facilities and secured notes | Senior secured | Upstream | Sale, unrestricted designation, immateriality, release under credit facilities | E02; E21 |
| Domestic restricted subsidiaries × subordinated notes | Senior subordinated | Upstream | [Insufficient Information] — 2027 indenture release clause not read | E02; E25 |
| Non-guarantor subsidiaries × all tranches | No guarantee | Not applicable: no guarantee | Not applicable: no guarantee | E02 |

### T4D.4 Collateral map

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Inc. × first lien (loans and secured notes) | [Insufficient Information] — security agreement not in the source set; indenture refers to Excluded Collateral defined there | Automatic on permitted disposal to a non-loan party; all or substantially all needs each lender and two-thirds of 2033 noteholders | [Insufficient Information] — security agreement not in the source set | E13; E20; E22 |
| TransDigm Group Incorporated × first lien | [Insufficient Information] — security agreement not in the source set | Same as above | [Insufficient Information] — security agreement not in the source set | E13 |
| Domestic restricted subsidiaries × first lien | [Insufficient Information] — security agreement not in the source set | Lien release on unrestricted designation of the guarantor | [Insufficient Information] — security agreement not in the source set | E21 |
| TransDigm UK × first lien under the debenture | [Insufficient Information] — debenture not in the source set | [Insufficient Information] — debenture not in the source set | UK collateral agent acts; US trustee acts only in the United States | E23; E22 |
| Non-guarantor subsidiaries × first lien | Not collateral grantors | Not applicable: no lien granted | Not applicable: no lien granted | E02 |
| All entities × subordinated notes | Unsecured | Not applicable: unsecured | Not applicable: unsecured | E02 |

### T4D.5 Structural priority

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with guarantors | Guarantor-group collateral shared first lien | Pari | Non-guarantor sales about USD 1,646 million and goodwill about USD 2,233 million reachable only through equity and intercompany claims | Strongest access, diluted by pari debt | Medium | E02; E26 |
| Secured notes 2028 to 2033 | TransDigm Inc. with guarantors | Same shared collateral | Pari | Same non-guarantor value | Same access; enforcement through collateral agents | Medium | E02; E22 |
| Subordinated notes 2027 and 2029 | TransDigm Inc. with subordinated guarantors | Residual after senior debt paid in full | Contractually Subordinated | Same non-guarantor value plus all senior claims ahead | Recovery only after senior debt is paid in full in cash | High | E25; E02 |
| Securitization facility | Securitization entity | Transferred receivables | Structurally Senior | Receivables sold out of the guarantor group | First access to receivables ahead of group creditors | Low | E05; E01 |
| Non-guarantor subsidiary creditors | Non-guarantor subsidiaries | Assets of those subsidiaries | Structurally Senior | Not applicable: they hold the value | Rank ahead of all group creditors on those assets | Medium | E02 |

### T4D.6 Leakage routes

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Dividend to equity | TransDigm Inc. to Holdings to shareholders | Section 6.02 unlimited at 6.75x; indenture section 4.07 | USD 4,348 million paid in October 2024 | 4 | Cash leaves all creditors | Demonstrated | E10; E17; E27 |
| Investment into new subsidiary then designation | TransDigm Inc. to newly formed subsidiary | Unrestricted subsidiary definition; investments clauses (1)(c) and (10) | Floor USD 250 million plus possible general basket | 3 | Assets leave guarantor and lien perimeter | Theoretical | E06; E08 |
| Transfer to non-guarantor restricted subsidiary | Guarantor to non-guarantor | Restricted-subsidiary investments clause (1)(a) | Not calculable: no cap on investments among restricted subsidiaries in the reviewed text | 3 | Value moves outside guarantees | Theoretical | E06 |
| Asset sale out of group | Loan party to third party | Automatic lien release section 9.02(c) | Not calculable: disposal-driven | 3 | Collateral replaced by proceeds subject to the asset-sale covenant | Theoretical | E13 |

### T4D.7 Priming exposure

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by majority lenders | Section 9.02(b) each-lender list omits lien or payment subordination | Non-participating term lenders | Theoretical | Minority could be primed if the intercreditor agreement permits | Low | E13; E07 |
| Uptier against secured notes | Indenture section 9.02(h) each-holder veto on adverse ranking change | Secured noteholders | Theoretical and protected | Notes better shielded than loans | Medium | E20 |
| Trapdoor drop-down | Designation limited to newly formed or acquired subsidiaries; investment caps | All secured classes | Theoretical | Bounded transfer route | Medium | E08; E06 |
| Non-pro rata exchange | Offers must be to all lenders of a class | Term lenders | Theoretical | Open-to-all offers limit discrimination | Medium | E13 |

### T4F.1 Controlling documents for intercreditor analysis

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders 1 to 6 | Company, Holdings, subsidiary guarantors, credit agreement collateral agent, existing secured-notes trustees and collateral agents, 2033 trustee and notes collateral agents | 2019-02-13; joinders to 2024-09-19 | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | d887611dex41.htm.jsonl, page 30 | E15 |
| Conformed credit agreement | Borrower, Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2024-09-19 | New York | Executed | d887611dex101.htm.jsonl, pages 1 and 222 | E03; E14 |
| 2033 secured-notes indenture | Company, Holdings, guarantors, trustee, US and UK collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 30 and 126 | E22 |
| 2027 subordinated-notes indenture | Company, Holdings, guarantors, trustee | 2019-11-13 | [Insufficient Information] — governing-law clause not read | Executed | d826058dex41.htm.jsonl, page 1 | E25 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | Senior secured | First lien, shared | Agent has sole right to proceed; revolving lenders alone enforce section 6.14 | Required revolving lenders for section 6.14; required lenders more than 50% otherwise | E11; E12; E07 |
| Term lenders | Senior secured | First lien, shared | Agent has sole right to proceed | Required lenders more than 50%; inter-class weight under the intercreditor agreement: [Insufficient Information] — ICA not in the source set | E12; E07 |
| Secured noteholders 2028 to 2033 | Senior secured | First lien, shared | Only collateral agents enforce; intercreditor agreement controls | Majority; two-thirds for collateral release; inter-class weight: [Insufficient Information] — ICA not in the source set | E20; E22 |
| Subordinated noteholders | Contractually subordinated | Unsecured | Subject to blockage and turnover | Majority under their indentures | E25 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement between loans and notes | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Term lenders, revolving lenders, secured noteholders | [Insufficient Information] — ICA not in the source set | Insufficient Information | E15 |
| Notes collateral enforcement | Not stated in the indenture | Event of default | Notes collateral agents; holders cannot act directly | Secured noteholders | Holders depend on agent and intercreditor terms | Neutral — Stable | E22 |
| Credit agreement collateral enforcement | Not stated in the credit agreement | Event of default | Agent has sole right; may credit bid | Loan lenders | Majority lender direction | Neutral — Stable | E12 |
| Subordinated payment blockage | Up to 179 days; once per 360 days; at least 181 days unblocked | Non-payment default on designated senior debt and blockage notice | Representative of designated senior debt | Subordinated noteholders | Interrupts junior cash flow | Negative — Liquidity Deterioration | E25 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated insolvency distribution | Payments go to senior debt until paid in full in cash | Not applicable: unsecured | [Insufficient Information] — no purchase option in the reviewed text | Liquidation or insolvency of the company | Holders may keep equally subordinated securities | E25 |
| Credit agreement collateral release | [Insufficient Information] — ICA not in the source set | Automatic on permitted disposal; each lender for all or substantially all | [Insufficient Information] — ICA not in the source set | Compliance with the agreement | Each-lender veto on wholesale release | E13 |
| Secured-notes collateral release | [Insufficient Information] — ICA not in the source set | Two-thirds of holders for all or substantially all; automatic on permitted events | [Insufficient Information] — ICA not in the source set | Per indenture and security documents | Higher threshold than majority | E20; E21 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Pari share of first-lien collateral through the agent | Majority may amend lien terms; inter-class control not established | High | Dilution or theoretical subordination | Negative — Leverage Increase | E13; E15 |
| Revolving lenders | Same pari collateral; sole holders of the maintenance test | Small share of first-lien claims may limit enforcement influence; weight not established | Moderate | Early test gives leverage only to revolving lenders | Neutral — Stable | E11; E15 |
| Secured noteholders | Pari share through notes collateral agents | Cannot enforce directly; intercreditor agreement controls | Moderate | Dependence on agent and bank-led decisions | Neutral — Stable | E22; E21 |
| Subordinated noteholders | Residual after senior paid in full; blockage | Payment blockage and turnover | High | Junior recovery behind all senior debt | Negative — Refinancing Risk | E25 |

### Material claim lineage

| Claim | Material conclusion | Strongest lineage |
|---|---|---|
| M1 | Maintenance test is revolver-only and springing above 40% usage | Directly Sourced |
| M2 | Revolver usage 7.36% with about USD 297 million to the trigger | Calculated |
| M3 | Unlimited dividends at 6.75x under the credit agreement | Directly Sourced |
| M4 | Indenture unlimited payments above 2.0x cover and builder from USD 400 million | Directly Sourced |
| M5 | Pari secured debt at 5.00x and agent must admit it to collateral | Directly Sourced |
| M6 | Each-lender items and their omission of subordination | Directly Sourced |
| M7 | Subordinated blockage of 179 days | Directly Sourced |
| M8 | About 20.73% of sales outside the guarantor summary | Calculated |
| M9 | Designation limited to newly acquired or formed subsidiaries | Directly Sourced |
| M10 | Recapitalisation did not exhaust the dividend permission | Analyst Inference |
| M11 | Majority-led uptier is theoretically open | Analyst Inference |
| M12 | Overall aggressiveness 4 of 5 | Analyst Inference |
| M13 | First-lien enforcement control between classes | Insufficient Information |
| M14 | Covenant-defined current ratios | Insufficient Information |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and Joinders 1 to 6 | Controls enforcement, voting and priority among first-lien classes | Intercreditor registers and uptier view provisional | Obtain executed agreement and joinders |
| Security documents | Security agreement, UK debenture, perfection schedules | Defines collateral and excluded assets | Collateral map qualitative | Obtain executed security documents |
| Compliance evidence | Compliance certificates and covenant earnings bridge | Needed for exact headroom | All ratio tests Not Calculable | Obtain latest certificate |
| Other indentures | 2028 to 2032 secured notes and 2029 subordinated notes | Thresholds may differ | Loosest-document view incomplete | Obtain the indentures |
| Market comparison | Covenant-review or market-norm source | Needed for relative assessment | No market-norm statement | Obtain a dated covenant review |

### T4C.12 Capacity gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Covenant earnings | Consolidated EBITDA as defined, with add-backs | Denominator of every test | Capacity Formula Extracted Only | Compliance certificate with bridge |
| Basket usage | Usage trackers for debt, payment and investment baskets | Remaining capacity | Remaining capacity Not calculable | Basket usage schedule |
| Covenant debt and cash | Indebtedness and unrestricted cash as defined | Numerator of ratios | Proxies only | Covenant calculation schedule |
| Builder inputs | Cumulative covenant net income since October 2010 and payments since December 2010 | Indenture builder size | Builder capacity Insufficient Information | Indenture compliance records |

### T4D.8 Structural gaps

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit listing guarantors and obligors | Confirms entity coverage | Entity register uses grouped rows | Obtain guarantor exhibit |
| Entity-level value | Assets, EBITDA and debt by non-guarantor entity | Sizes stranded value | Stranded value proxied by sales and goodwill | Obtain entity financials |
| TransDigm UK details | Parent, assets and debenture law | Perfection and reach | UK rows partly Insufficient Information | Obtain debenture and entity data |
| Securitization terms | Receivables purchase and recourse terms | Priority over receivables | Securitization label Low confidence | Obtain facility agreement |

### T4F.6 Intercreditor gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Controlling first-lien representative | Which agent directs enforcement and on what vote | Determines who controls collateral realisation | Enforcement-control rows Insufficient Information | Obtain intercreditor agreement |
| Standstill among first-lien classes | Days and triggers | Timing of enforcement | Standstill not stated | Obtain intercreditor agreement |
| Turnover and purchase options | Turnover and buy-out provisions | Realised recovery by class | Turnover rows Insufficient Information | Obtain intercreditor agreement |
| 2027 indenture release and law clauses | Guarantee release and governing law | Completes the junior map | Partial rows | Read remaining indenture sections |

## Calculations

All amounts are consolidated USD millions at 2024-09-30 unless stated. Indicative proxies compare reported or consolidated figures with covenant thresholds; they are not covenant calculations.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | Revolver usage at 2024-09-30 | Ratio 67 letters of credit / 910 commitments | 0.0736263736, displayed 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L02 | Usage trigger amount | Product 910 × 0.40 | 364.00, agreeing to the issuer's stated USD 364 million | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L03 | Further exposure before trigger | Difference 364 − 67 | USD 297 million | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59 and 62 |
| L04 | Usage headroom | Difference 40.00 − 7.36 | 32.64 percentage points | percentage points | calculation L01 |
| L05 | Sales outside the guarantor summary, FY2024 | Difference 7,940 − 6,294; ratio 1,646 / 7,940 | USD 1,646 million; 0.2073047859, displayed 20.73% | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L06 | Goodwill outside the guarantor summary | Difference 10,419 − 8,186; ratio 2,233 / 10,419 | USD 2,233 million; 0.2143199923, displayed 21.43% | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L07 | Indicative general investment basket | Product 25,586 consolidated total assets × 0.25 | USD 6,396.5 million; proxy because restricted-group total assets are not separately reported | USD million | d887611dex41.htm.jsonl, page 38; d887611dex101.htm.jsonl, page 62; Financial foundation (CP-1) |
| L08 | Distance from Financial foundation's post-dividend net leverage 6.02x to thresholds | Differences 6.75 − 6.02; 7.25 − 6.02; 7.50 − 6.02 | 0.73x; 1.23x; 1.48x; reported-EBITDA proxy, not covenant headroom | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, pages 59, 181 and 188 |

The post-dividend figure of 6.02x is Financial foundation's standalone pro forma for the October 2024 payment of USD 4,348 million (year-end 4.88x); the day of payment is not stated there, and no intervening cash flow is included.

## Gaps

The missing documents restrict intercreditor control, collateral reach and exact capacity; they do not change the documented permissions read from the executed credit agreement and indentures.

| Gap | Severity | What is missing or unresolved | Effect on conclusions | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement and six joinders not supplied | Enforcement control, standstill, turnover and uptier protection among first-lien classes not established | d887611dex41.htm.jsonl, page 30 |
| Security and guarantee documents | MATERIAL | Security agreement, UK debenture, guarantor list, excluded collateral | Collateral reach by entity not established; stranded value proxied | d887611dex41.htm.jsonl, page 24; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Compliance and usage evidence | MATERIAL | Compliance certificates, covenant earnings, basket usage | Every ratio test and basket remains a formula; proxies only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Other indentures | MINOR | 2028 to 2032 secured and 2029 subordinated note indentures | Loosest test across the structure may differ | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Yield-protection sunset date | MINOR | Tranche L protection ends 18 months after the Amendment No. 17 effective date; the effective day is not stated, so no dated event is recorded | Pricing protection end date relative, not fixed | d887611dex101.htm.jsonl, page 144 |
| Market comparison | MINOR | No covenant-review or market-norm source | No market-norm assessment | Source readiness (CP-0) |

## Next module
The orchestrator selects the next module.
