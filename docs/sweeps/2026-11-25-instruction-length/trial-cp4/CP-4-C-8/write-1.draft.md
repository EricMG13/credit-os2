---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-4
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-opus-high
pathway: deep_credit_assessment
module_status: Completed with Limitations
committee_status: Requires More Work
reporting_period: FY2024 (fiscal year ended 2024-09-30)
---

## Request
Interpret the legal and covenant package of TransDigm Group Incorporated (borrower TransDigm Inc.) as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers provision-level covenant review, the restricted-group and guarantee map, intercreditor control and covenant capacity and headroom from the executed documents supplied.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and Incremental Term Loan Assumption Agreement to the Second Amended and Restated Credit Agreement, execution version, with the amended credit agreement annexed | 2024-09-19, agreement date; publication not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: financial covenant, events of default, EBITDA and leverage definitions, permitted debt, incremental facility and MFN, permitted investments, restricted payments, asset sales, unrestricted subsidiaries, guarantor and collateral joinder, amendments and releases |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033, execution version | 2024-09-19, indenture date; publication not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants: collateral and change-of-control definitions, intercreditor reference, lien ratio, restricted payments, amendments, guarantor release, enforcement through collateral agents |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date per Source readiness; publication not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination: payment blockage, turnover and subrogation |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Guarantor description and obligor-group summary, debt terms, revolver usage, covenant description and compliance statement; retrospective evidence |
| d833756dex101.htm.jsonl | Amendment No. 16, loan modification and refinancing facility agreement, execution version | 2024-06-04, agreement date per Source readiness; publication not stated | 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac | Amendment-chain inventory only; no clause relied on |
| d739389dex101.htm.jsonl | Amendment and restatement agreement with the Second Amended and Restated Credit Agreement, execution version | 2014-06-04, agreement date per Source readiness; publication not stated | 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547 | Base-agreement inventory only; no clause relied on |
| d496141dex101.htm.jsonl | 2013 amendment and restatement agreement | 2013-02-28, agreement date per Source readiness; publication not stated | f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3 | Historical inventory only; no clause relied on |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Document inventory, agreement dates, temporal boundary and legal-coverage gaps |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt, cash, net debt, EBITDA and EBITDA As Defined, instrument register and post-balance-sheet adjustments used only as non-legal reference metrics |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Ownership of the borrower, dated dividend and financing events, demonstrated use of restricted-payment and incremental capacity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurring-cost challenge to issuer add-backs, compared with the covenant EBITDA definition |

## Findings

### Bottom line
Aggressive, ratio-only covenants leave TransDigm creditors protected by leverage tests the issuer has just used: dividends are unlimited at or below 6.75x covenant net leverage, term loans and notes carry no maintenance test, and pari secured debt can rise to 5.00x.

The consequence is that default risk will surface through liquidity, not covenants, and recovery risk sits in pari secured dilution and leakage to non-guarantor foreign subsidiaries rather than in priming. The strongest protections are all-lender consent to release all collateral or a material guarantor, each-holder protection of note ranking, and a bar on designating existing subsidiaries unrestricted. Overall score is four on the five-point scale, provisional, because the intercreditor agreement, security agreement and compliance certificates are not in the source set.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 204–205; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, pages 117–118; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Key findings
- Maintenance protection is effectively absent for term lenders and noteholders. The only financial maintenance covenant is a 7.50x covenant net leverage cap (8.00x for four quarters after a material acquisition) that applies only if revolving exposure exceeds 40% of commitments, or USD 364 million. Year-end usage was USD 67 million of letters of credit, 7.36% of commitments, leaving USD 297 million before the test even switches on. A breach is an event of default for revolving lenders only and reaches the term loans only once revolving lenders terminate or accelerate, so the first observable stress signal will be liquidity or a payment default, not a covenant trip.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K01; calculation K02; calculation K03
- Shareholder distribution capacity is uncapped in amount and regenerates with earnings. The credit agreement permits any restricted payment with no default and pro forma covenant net leverage at or below 6.75x; the 2033 secured notes permit any restricted payment with no default and fixed-charge coverage above 2.0x. A dividend declared when permitted can be paid within 60 days, so the October 2024 special dividend paid 29 days after declaration was tested at declaration. On a reference proxy that is not the covenant definition, net debt to EBITDA As Defined was 4.46x at year-end and 5.50x after the October 2024 payment, about 1.25x below the dividend test; financial-foundation net debt of USD 18,619 million becomes USD 22,967 million pro forma for that October 2024 payment (6.02x on reported EBITDA) and stays USD 18,619 million after the October 2024 securitization draw.
Basis: d887611dex101.htm.jsonl, pages 178–181; d887611dex41.htm.jsonl, page 75; Financial foundation (CP-1); Business & governance (CP-1A); calculation K05; calculation K06; calculation K11; calculation K17
- Pari secured dilution is the main recovery lever, and it was demonstrated in September 2024. Incremental term loans and other pari secured debt are limited only by 5.00x covenant secured net leverage (5.25x for secured ratio debt under the 2033 notes) and 7.25x total net leverage; there is no fixed-dollar incremental cap. The September financing added USD 1,500 million of Tranche L loans and USD 1,500 million of 2033 secured notes under these tests. On the reference proxy, secured net leverage moved to 4.22x after the October 2024 payment, about 0.78x below the 5.00x incremental gate. MFN protection is a 50 bp yield cushion that falls away after 18 months and never applies to acquisition debt.
Basis: d887611dex101.htm.jsonl, pages 142–146; d887611dex101.htm.jsonl, pages 58–59; d887611dex41.htm.jsonl, page 43; d887611dex101.htm.jsonl, pages 1–4; calculation K10; calculation K13
- Covenant EBITDA is broader than any earnings measure an analyst would underwrite, and it drives every ratio and grower basket. The definition adds back unusual, transaction, integration, refinancing, non-cash and deferred compensation costs and dividend-equivalent payments without a cap, plus projected cost savings for actions within 24 months, capped at 25% of covenant EBITDA. The categories Earnings quality rejects as recurring, USD 345 million in FY2024, are the same categories that enlarge covenant capacity, so the documents reward the acquisition-and-refinancing model with more debt and distribution room.
Basis: d887611dex101.htm.jsonl, pages 23–26; Earnings quality (CP-1D)
- The collateral and guarantee net is broad at home but open abroad. Domestic restricted subsidiaries must join as guarantors and grantors, except immaterial subsidiaries, unrestricted subsidiaries and securitization entities; foreign subsidiaries give only a 65% voting-stock pledge. Investments in any restricted subsidiary, including non-guarantor foreign subsidiaries, are unlimited. The issuer and guarantor group generated about 79.27% of consolidated sales, and non-guarantor subsidiaries owed the obligor group a net USD 1,881 million, so value already sits partly outside direct creditor reach and can be moved there without a basket limit.
Basis: d887611dex101.htm.jsonl, pages 173–174; d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, page 45; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K14
- Lender control is thinner in the credit agreement than in the 2033 notes. A simple majority of lenders can amend anything outside the listed all-lender rights (economics, maturity, pro rata sharing, voting thresholds, release of a material guarantor and release of all or substantially all collateral); subordination of the loans is not among the listed rights, and the same majority with the borrower can permit non-pro-rata prepayments if offered to a whole class. The 2033 notes require each holder to change ranking and two-thirds of holders to release substantially all collateral, but holders cannot enforce security directly and are bound by a first-lien intercreditor agreement that is not in the source set.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex101.htm.jsonl, page 71; d887611dex41.htm.jsonl, pages 117–118; d887611dex41.htm.jsonl, pages 127–128; d887611dex41.htm.jsonl, page 30

### Contrary evidence and what would change the view
The strongest case against an aggressive reading is that every permission is gated by leverage tests that the issuer has respected, the annual report states compliance with all debt covenants, and several structural protections are tighter than a typical leveraged-loan package. Only a newly acquired or newly formed subsidiary can be designated unrestricted, and an unrestricted subsidiary may not carry debt with recourse to the restricted group, which closes the classic route of moving an existing operating subsidiary out of the group. Release of all or substantially all collateral, of a material guarantor or a change to pro rata sharing needs every lender. Subordinated noteholders must turn over payments received in breach of subordination and can be blocked from payment for up to 179 days, which supports senior recovery. Asset sales above USD 50 million need at least 75% cash consideration. If a compliance certificate showed covenant leverage well below the reference proxy, the dividend and incremental gates would sit further away but the conclusion would not soften, because more headroom means more permitted leakage. The view would move to market-standard if the intercreditor agreement gave secured noteholders a meaningful share of enforcement control and limited lien releases, if a later amendment added subordination and asset-transfer blockers to the all-lender list, or if leverage were reduced so that the ratio gates bind. It would worsen if the security agreement excluded intellectual property or material real property, or if covenant EBITDA in a certificate materially exceeded EBITDA As Defined.
Basis: d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 181–182; d887611dex101.htm.jsonl, pages 204–205; d826058dex41.htm.jsonl, pages 107–108; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- The amended credit agreement is read from a conformed annex in which inserted and deleted text are extracted together, so a threshold read from it could be deleted language. The springing 7.50x test, the 40% trigger and the 7.25x and 5.00x incremental gates agree with the annual report; the 6.75x dividend test, the investment baskets and the amendment rights are not cross-checked, which lowers confidence in the restricted-payment and control conclusions from high to medium.
- The first-lien intercreditor agreement is not supplied, so who directs enforcement between lenders and secured noteholders, standstill terms between them and lien-release authority under that agreement are not established. This leaves the recovery split between term loans and secured notes unresolved and keeps the intercreditor map at indenture and credit-agreement level only.
- The guarantee and collateral agreement is not supplied, so excluded collateral (intellectual property, real property, deposit accounts) is not established. The collateral score of three could rise to four if exclusions are broad, which would raise the overall score's confidence in the aggressive end but not change the overall label.
- No compliance certificate or basket-usage record is supplied, so every covenant ratio test is not calculable and the reference distances to the 6.75x, 7.25x and 5.00x gates are proxies. Covenant EBITDA with pro forma cost savings is likely to exceed EBITDA As Defined, so true room under each gate is more likely larger than the proxy, which would strengthen rather than weaken the leakage conclusion.
- Only the 2033 secured-note indenture and the 2027 subordinated-note indenture are supplied; the five other secured-note series and two other subordinated series are read by analogy. The note-level conclusions on restricted payments, ranking protection and collateral-release voting are therefore confirmed for the 2033 notes only.
Basis: d887611dex101.htm.jsonl, pages 3–4; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; d887611dex41.htm.jsonl, page 30; Source readiness (CP-0)

### Covenant-implication summary
The summary shows that the package protects against outright priming better than against releveraging and distributions, which is where the measured risk sits.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, pages 204–205

| Area | Key provision | Creditor consequence | Credit implication | Score of five |
|---|---|---|---|---|
| Maintenance | Revolver-only 7.50x test above 40% usage | No early warning for term loans or notes | Negative — Covenant Erosion | 4 |
| Debt and liens | Pari secured to 5.00x; total to 7.25x; no dollar cap | Recovery dilution through pari incurrence | Negative — Leverage Increase | 4 |
| Distributions and investments | Unlimited dividends at or below 6.75x; unlimited intercompany investment | Demonstrated cash extraction; foreign leakage route | Negative — Leverage Increase | 4 |
| EBITDA definition | Uncapped transaction and compensation add-backs; 25% cost-savings cap | Capacity grows with adjusted earnings | Negative — Covenant Erosion | 4 |
| Collateral and guarantees | Domestic guarantees; 65% foreign pledge | Foreign value outside direct reach | Neutral — Stable | 3 |
| Amendment and control | Majority lenders; no subordination all-lender right | Theoretical uptier vulnerability for loans | Negative — Covenant Erosion | 4 |

### Capital structure
The capital structure is a single large pari first-lien class with subordinated notes beneath it; the governing documents in the source set cover only part of it.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–60; Financial foundation (CP-1); calculation K16; calculation K18; calculation K19

| Instrument | Rank and security | Principal or commitment, USD million | Maturity | Governing document in the source set | Source |
|---|---|---|---|---|---|
| Revolving credit facility | First-lien secured, pari with term loans and secured notes | 910 commitment; 67 letters of credit; 843 available | 2029-02-27 | Amended credit agreement (Amendment No. 17 annex) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K, L | First-lien secured | 8702 (I 1871; J 3632; K 1699; L 1500) | 2028-08-24 to 2032-01-19 | Amended credit agreement (Amendment No. 17 annex) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Secured notes 2028, 2029, 2030, 2031, 2032, 2033 | First-lien secured; equal payment rank with credit facilities; First Lien Intercreditor Agreement | 11000 (2028 2100; 2029 2750; 2030 1450; 2031 1000; 2032 2200; 2033 1500) | 2028-08-15 to 2033-01-15 | 2033 indenture only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| Senior subordinated notes 2027, January 2029, May 2029 | Unsecured; contractually subordinated to senior debt | 4600 (2027 2650; January 2029 1200; May 2029 750) | 2027-11-15 to 2029-05-01 | 2027 indenture only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| Trade receivable securitization | Non-recourse borrowing by a securitization entity outside the guarantor group | 487.5 drawn of 650 | 2025-07-11 | Not supplied: securitization agreements not in the source set | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Group carrying debt and net debt | All borrowings at carrying value | Carrying debt 24880; net debt 18619; pro forma net debt 22967 after October 2024 dividend payment (6.02x reported EBITDA); 18619 after October 2024 securitization draw | Not applicable: aggregate | Not applicable: aggregate | Financial foundation (CP-1) |

### Covenant tests and headroom
Only the revolver usage trigger can be measured; every leverage and coverage test lacks a disclosed tested value, so headroom is not established and the trigger itself is far from switching the covenant on.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation K02; calculation K04

| Test | Threshold | Current | Headroom | Status | Source |
|---|---|---|---|---|---|
| Revolver usage trigger for springing covenant | 40.00% of revolving commitments | 7.36% | 32.64 percentage points (USD 297 million) | Compliant; covenant not in force | d887611dex101.htm.jsonl, page 188 |
| Springing maximum covenant net leverage | 7.50x (8.00x after material acquisition) | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable; not tested at year-end | d887611dex101.htm.jsonl, page 188 |
| Incremental facility, covenant net leverage | 7.25x | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable; certified met at Amendment No. 17 closing | d887611dex101.htm.jsonl, pages 3–4 |
| Incremental facility and pari secured debt, secured net leverage | 5.00x | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable; certified met at Amendment No. 17 closing | d887611dex101.htm.jsonl, page 146 |
| General restricted payments, covenant net leverage | 6.75x | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 181 |
| Joint-venture investments, covenant net leverage | 7.00x | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 62 |
| 2033 notes secured ratio-debt liens, secured net leverage | 5.25x | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex41.htm.jsonl, page 43 |
| 2033 notes general restricted payments, fixed-charge coverage | Above 2.0x | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex41.htm.jsonl, page 75 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for springing covenant | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Credit agreement section 6.14; usage is USD 67 million letters of credit over USD 910 million commitments, counted in full because cash collateralisation is not stated |
| Springing maximum covenant net leverage | 7.50 | Not supplied: tested ratio not disclosed and no compliance certificate | Not supplied: tested ratio not disclosed | Passes at or below | x | Applies only when revolver usage exceeds 40%; 8.00x for four quarters after a material acquisition; not in force at year-end |
| Incremental facility, covenant net leverage | 7.25 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test, credit agreement section 2.24(c); certified met on Amendment No. 17 closing after Tranche L |
| Incremental facility and pari secured debt, secured net leverage | 5.00 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test, section 2.24(c) and permitted-debt clause (12); reference proxy 4.22x after October 2024 payment is not a covenant figure |
| General restricted payments, covenant net leverage | 6.75 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Pro forma incurrence test, section 6.02; reference proxy 5.50x after October 2024 payment is not a covenant figure; read from conformed annex |
| Joint-venture investments, covenant net leverage | 7.00 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Condition of permitted-investment clause (11) |
| 2033 notes secured ratio-debt liens, secured net leverage | 5.25 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | 2033 indenture permitted-liens clause (xxxi) |
| 2033 notes general restricted payments, fixed-charge coverage | 2.00 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes above | x | 2033 indenture section 4.07; ratio must exceed 2.0 to 1.0; definition not reviewed |

Only the first row is a measured value; the other thresholds are incurrence or springing tests with no disclosed tested ratio, and none of the rows is a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the executed indenture states no publication date | First Lien Intercreditor Agreement among the borrower, Holdings, subsidiary guarantors, the credit-agreement collateral agent and secured-note trustees and agents | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement and priority among first-lien classes; the agreement itself is not in the source set |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement | Historical — the most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets the current restrictive-covenant baseline that Amendment No. 17 carries forward |
| 2024-09-19 | day | Not supplied: the executed amendment states no publication date | Amendment No. 17 and USD 1,500 million Tranche L incremental term loans | Historical — dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Used incremental capacity under the 7.25x and 5.00x gates to fund the dividend recapitalisation recorded by Business & governance; starts the Tranche L 18-month MFN window |
| 2024-09-19 | day | Not supplied: the executed indenture states no publication date | Indenture for the 2033 secured notes | Historical — Indenture dated as of September 19, 2024 | d887611dex41.htm.jsonl, page 1 | New pari secured series under the 5.25x lien ratio; designated as senior debt for the subordinated notes |
| 2024-09-19 | day | Not supplied: the executed indenture states no publication date | Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds the 2033 notes to the shared first-lien collateral pool |
| 2027-09-15 | day | Not supplied: the executed indenture states no publication date | Initial Redemption Date of the 2033 secured notes | Scheduled — “Initial Redemption Date” means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | End of make-whole protection on the 2033 notes opens refinancing and liability-management optionality |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report on Form 10-K via Business & governance ownership register; both are Delaware corporations per Amendment No. 17 preamble |
| TransDigm Group Incorporated | Guarantees credit-agreement obligations as Holdings | Guarantee | Senior secured credit facilities | Amended credit agreement, event of default clause (i) on the Guarantee of Holdings; New York law per Amendment No. 17 section 11 |
| Domestic Restricted Subsidiaries | Must join as guarantors within 20 business days | Guarantee | Senior secured credit facilities | Amended credit agreement section 5.11(a); New York law; excludes immaterial, unrestricted and securitization subsidiaries |
| Domestic Restricted Subsidiaries | Grant liens on Collateral | Security | Senior secured credit facilities | Amended credit agreement section 5.11(a) and Guarantee and Collateral Agreement (not supplied); New York law |
| TransDigm Inc. | Pledges 65% of voting stock of first-tier Foreign Subsidiaries | Security | Senior secured credit facilities | Amended credit agreement section 5.11(b); New York law; Rule 3-10 and 3-16 carve-out |
| TransDigm Group Incorporated | Guarantees on senior secured basis | Guarantee | Senior secured notes 2028–2033 | Annual report guarantor description; 2033 indenture Article X; New York courts per section 11.14 |
| TransDigm UK | Guarantees on senior secured basis | Guarantee | Senior secured notes 2028–2033 | Annual report guarantor description; UK entity with UK Collateral Agent under the 2033 indenture |
| TransDigm UK | All assets and undertakings charged as Debenture Collateral | Security | Senior secured notes 2028–2033 | 2033 indenture definition of Debenture Collateral; UK collateral agent; English-law debenture not supplied |
| Domestic Restricted Subsidiaries | Guarantee on senior secured basis | Guarantee | Senior secured notes 2028–2033 | Annual report guarantor description; 2033 indenture Article X; New York courts |
| TransDigm Group Incorporated | Guarantees on senior subordinated basis | Guarantee | Senior subordinated notes 2027–2029 | Annual report guarantor description; 2027 indenture Article XII payment blockage on guarantees |
| TransDigm UK | Guarantees on senior subordinated basis | Guarantee | Senior subordinated notes 2027–2029 | Annual report guarantor description; UK entity |
| Domestic Restricted Subsidiaries | Guarantee on senior subordinated basis | Guarantee | Senior subordinated notes 2027–2029 | Annual report guarantor description; 2027 indenture |
| Foreign non-guarantor subsidiaries | Own creditors rank first on their assets | Structural claim | Senior secured notes 2028–2033 | Annual report: secured notes structurally subordinated to non-guarantor liabilities; foreign jurisdictions not itemised |
| Securitization Entity | Holds sold receivables outside collateral, non-recourse | Structural claim | Senior secured credit facilities | Amended credit agreement permitted-debt clause (18) and section 5.11 excluded subsidiary; securitization agreement not supplied |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facilities | Equal right of payment | Payment rank | Senior secured notes 2028–2033 | Annual report guarantor and ranking description; 2033 indenture; New York courts |
| Senior secured notes 2028–2033 | Senior in right of payment | Payment rank | Senior subordinated notes 2027–2029 | Annual report ranking description; 2033 indenture section 11.15 designated senior debt |
| Senior subordinated notes 2027–2029 | Must hold and pay over distributions received in breach | Payment rank | Senior secured credit facilities | 2027 indenture section 10.05 turnover |
| Senior secured credit facilities | Share first-lien collateral under the intercreditor agreement | Security rank | Senior secured notes 2028–2033 | 2033 indenture definition of Intercreditor Agreement and section 11.16; agreement terms not supplied |
| Notes Collateral Agents | Sole right to enforce security; holders barred | Enforcement control | Senior secured notes 2028–2033 | 2033 indenture section 12.01(a) |
| Revolving lenders | Sole right to act on financial covenant default | Enforcement control | Term lenders | Amended credit agreement Article VII clause (l) and section 6.14; New York law |
| Designated senior debt representative | May block payments for up to 179 days | Standstill | Senior subordinated notes 2027–2029 | 2027 indenture section 10.03 payment blockage |
| Required Lenders | May approve release of individual Collateral liens | Release | Senior secured credit facilities | Amended credit agreement section 9.02(c)(iv); all or substantially all needs every lender |
| Senior secured credit facilities | Release of a guarantor there releases its note guarantee | Release | Senior secured notes 2028–2033 | 2033 indenture section 10.07(e) |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 9 |
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
| MATERIAL | 4 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

### Material claim lineage

| Claim | Material claim | Strongest lineage | Source |
|---|---|---|---|
| L1 | Only maintenance covenant is the revolver-only 7.50x springing test above 40% usage | Directly Sourced | d887611dex101.htm.jsonl, page 188 |
| L2 | Financial covenant default reaches term loans only after revolver termination or acceleration | Directly Sourced | d887611dex101.htm.jsonl, page 191 |
| L3 | Restricted payments unlimited at or below 6.75x (credit agreement) and above 2.0x coverage (2033 notes) | Directly Sourced | d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75 |
| L4 | Pari secured debt gated at 5.00x, junior and unsecured at 7.25x, 2033 note liens at 5.25x | Directly Sourced | d887611dex101.htm.jsonl, pages 58–59; d887611dex41.htm.jsonl, page 43 |
| L5 | MFN 50 bp with 18-month sunset and acquisition carve-out | Directly Sourced | d887611dex101.htm.jsonl, pages 143–145 |
| L6 | Covenant EBITDA add-backs largely uncapped; cost savings capped at 25% | Directly Sourced | d887611dex101.htm.jsonl, pages 23–24 |
| L7 | Credit-agreement all-lender rights omit subordination; Required Lenders above 50% | Directly Sourced | d887611dex101.htm.jsonl, pages 204–205; d887611dex101.htm.jsonl, page 71 |
| L8 | Secured noteholders cannot enforce directly; intercreditor agreement controls | Directly Sourced | d887611dex41.htm.jsonl, pages 127–128 |
| L9 | Subordinated notes: 179-day blockage and turnover | Directly Sourced | d826058dex41.htm.jsonl, pages 107–108 |
| L10 | Revolver trigger headroom USD 297 million | Calculated | calculation K03 |
| L11 | Reference proxy leverage 5.50x and 4.22x after October 2024 payment | Calculated | calculation K06; calculation K10 |
| L12 | Obligor group about 79.27% of sales | Calculated | calculation K14 |
| L13 | Overall covenant package aggressive, score four | Analyst Inference | Aggressiveness score table |
| L14 | Term-loan uptier vulnerability is theoretical, not demonstrated | Analyst Inference | d887611dex101.htm.jsonl, pages 204–206 |
| L15 | Foreign non-guarantor transfer is the most open leakage route | Analyst Inference | d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, pages 173–174 |
| L16 | Enforcement control between lenders and secured noteholders | Insufficient Information | d887611dex41.htm.jsonl, page 30 |
| L17 | Tested covenant ratios and basket usage | Insufficient Information | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

### T4.1 Source Gate

| Document | Status | Authority Rank | Governing law | Limitations | Module status |
|---|---|---|---|---|---|
| Amended credit agreement annexed to Amendment No. 17 | Executed; conformed annex with inserted and deleted text extracted together | 1 | New York (Amendment No. 17 section 11; credit agreement section 9.09 not reviewed) | Schedules, commitment schedule and Guarantee and Collateral Agreement not supplied | Completed with Limitations |
| 2033 secured notes indenture | Executed | 1 | Not verified in pages reviewed; New York courts submitted to | Security documents and intercreditor agreement not supplied | Completed with Limitations |
| 2027 subordinated notes indenture | Executed per Source readiness | 1 | Not verified in pages reviewed | Only subordination article reviewed | Completed with Limitations |
| Amendment No. 16; 2014 restatement; 2013 restatement | Executed per Source readiness | 1 | Not reviewed | Inventory only; no clause relied on | Completed with Limitations |
| Annual report on Form 10-K | Filed; published after the cutoff | 4 for covenant descriptions; financial input source | Not applicable: filing | Summary of covenants; compliance statement without tested ratios | Completed with Limitations |
| First Lien Intercreditor Agreement; Guarantee and Collateral Agreement; compliance certificates; other five secured and two subordinated indentures | Not supplied | Not applicable: absent | Not applicable: absent | Intercreditor, collateral and capacity conclusions limited | Completed with Limitations |

Status is Completed with Limitations: executed governing documents and current financial inputs are available, but the intercreditor agreement, the security agreement, compliance certificates, basket usage and most note indentures are missing; the refinancing and liability-management overlay is not supplied, so the liability-management legal-capacity overlay is incomplete; no comparative source exists, so market-norm commentary is skipped.
Basis: Source readiness (CP-0); d887611dex101.htm.jsonl, page 8; d887611dex41.htm.jsonl, page 127

### T4.2 Controlling Document Register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second Amended and Restated Credit Agreement as amended by Amendment No. 17 | Credit agreement (revolver and term loans I–L) | Base 2014-06-04; amended 2024-09-19 | Executed; conformed annex | Controls loan covenants, incremental, MFN, events of default, amendments, guarantor and collateral joinder | Governs pari secured capacity and dividend test for the whole group | EV-01 to EV-19 |
| 1 | 2033 secured notes indenture | Indenture | 2024-09-19 | Executed | Controls 2033 note covenants, liens, restricted payments, amendments, guarantee release | Note-level protection and lien ratio | EV-20 to EV-25 |
| 1 | 2027 subordinated notes indenture | Indenture | 2019-11-13 | Executed | Controls subordination and blockage for 2027 notes | Senior recovery support | EV-26 |
| 1 | Amendment No. 16; 2014 and 2013 restatements | Credit-agreement amendments | 2024-06-04; 2014-06-04; 2013-02-28 | Executed | Historical chain; superseded in reviewed provisions by the Amendment No. 17 annex | Provenance only | EV-33 |
| 2 | First Lien Intercreditor Agreement and joinders 1 to 6 | Intercreditor agreement | 2019-02-13; joinder 6 2024-09-19 | Not supplied | Would control lien priority and enforcement among first-lien classes | Enforcement control unresolved | EV-20 |
| 4 | Annual report on Form 10-K, covenant description | Regulatory filing summary | 2024-11-07 | Filed | Summary of covenants and compliance; verified against executed text where possible | Confirms springing test, 40% trigger, incremental gates and compliance | EV-27 to EV-29 |

Executed documents govern; the annual report is a summary. One conflict of wording exists: the annual report describes the springing test denominator as EBITDA As Defined while the credit agreement uses Financial Covenant Consolidated EBITDA; the credit agreement governs.
Basis: d887611dex101.htm.jsonl, page 1; d887611dex101.htm.jsonl, page 27; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### T4.3 Covenant Feature Register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Covenant net leverage at or below 7.50x (8.00x for four quarters after a material acquisition) tested only if revolving exposure exceeds 40% of commitments; amendable by Required Revolving Lenders only | d887611dex101.htm.jsonl, page 188; credit agreement section 6.14 | Term lenders and noteholders have no covenant tripwire | Negative — Covenant Erosion | Not assessed: no comparative source | EV-01 |
| Financial covenant default | Event of default for revolving lenders only; becomes a term-loan default only on revolver termination or acceleration | d887611dex101.htm.jsonl, page 191; Article VII clause (l) | Revolving lenders control timing of any covenant-led acceleration | Negative — Covenant Erosion | Not assessed: no comparative source | EV-02 |
| Covenant breach of other negative covenants | Article VI breach is an immediate event of default; other covenants have 30 days after notice | d887611dex101.htm.jsonl, pages 189–191; Article VII clauses (d), (k) | Incurrence breaches are immediately actionable | Neutral — Stable | Not assessed: no comparative source | EV-02; EV-03 |
| Cross-default | Payment default at maturity or acceleration of Material Indebtedness; secured debt due on permitted asset sale excluded | d887611dex101.htm.jsonl, page 189; clause (e) | Cross-acceleration across loans and notes | Neutral — Stable | Not assessed: no comparative source | EV-03 |
| EBITDA add-backs | Uncapped unusual, transaction, integration, refinancing, non-cash and deferred compensation, dividend-equivalent add-backs; cost savings within 24 months capped at 25% | d887611dex101.htm.jsonl, pages 23–26; definitions of Consolidated EBITDA and Consolidated Net Income | Inflates denominator of every ratio and grower basket | Negative — Covenant Erosion | Not assessed: no comparative source | EV-04; EV-05 |
| Incremental facility | Unlimited in amount if covenant net leverage at or below 7.25x and secured net leverage at or below 5.00x pro forma; limited-condition acquisition testing at signing | d887611dex101.htm.jsonl, pages 142–146; section 2.24 | Pari secured debt dilutes existing first-lien recovery | Negative — Leverage Increase | Not assessed: no comparative source | EV-07 |
| MFN | Yield above existing class plus 50 bp triggers margin increase; not for acquisition debt, after 18 months from the relevant amendment, or for maturities more than 18 months after the class | d887611dex101.htm.jsonl, pages 143–145; section 2.24(b) | Repricing protection is temporary and narrow | Negative — Refinancing Risk | Not assessed: no comparative source | EV-07 |
| Ratio debt | Pari secured debt at secured net leverage at or below 5.00x; junior or unsecured at covenant net leverage at or below 7.25x; must be at Collateral only and guaranteed only by Loan Parties | d887611dex101.htm.jsonl, pages 58–59; permitted-debt clause (12) | Same dilution as incremental; no non-obligor debt | Negative — Leverage Increase | Not assessed: no comparative source | EV-08 |
| Fixed and grower debt baskets | General greater of USD 250 million and 10% EBITDA; capital leases same; acquired debt greater of USD 150 million and 6%; foreign subsidiaries greater of USD 450 million and 18%; securitization greater of USD 725 million and 20% | d887611dex101.htm.jsonl, pages 57–60; clauses (7), (11), (13), (14), (18) | Foreign and securitization baskets create structurally senior claims | Negative — Leverage Increase | Not assessed: no comparative source | EV-08 |
| Restricted payments | Unlimited if no default and covenant net leverage at or below 6.75x; general basket greater of USD 75 million and 3%; 60-day declaration rule | d887611dex101.htm.jsonl, pages 178–181; section 6.02 | Ratio-only capacity regenerates with EBITDA | Negative — Leverage Increase | Not assessed: no comparative source | EV-11 |
| Investments | Unlimited in restricted subsidiaries; unrestricted subsidiaries greater of USD 250 million and 10%; general greater of USD 500 million and 25% of Total Assets; joint ventures greater of USD 1,000 million and 40% at or below 7.00x | d887611dex101.htm.jsonl, pages 61–62; definition of Permitted Investments; section 6.16 | Value can move to non-guarantors and outside the group | Negative — Covenant Erosion | Not assessed: no comparative source | EV-10 |
| Asset sales | Fair value; 75% cash above USD 50 million; designated non-cash consideration up to USD 300 million; proceeds applied under section 2.10 | d887611dex101.htm.jsonl, pages 181–182; section 6.03 | Limits non-cash disposals; reinvestment terms not reviewed | Neutral — Stable | Not assessed: no comparative source | EV-12 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries may be designated; must comply with sections 6.02 and 6.16; no recourse debt | d887611dex101.htm.jsonl, page 81 | Blocks designation of existing operating subsidiaries | Neutral — Stable | Not assessed: no comparative source | EV-13 |
| Guarantor and collateral coverage | Domestic subsidiaries join within 20 business days except immaterial (5% of EBITDA and assets each), unrestricted and securitization entities; 65% foreign voting stock pledge | d887611dex101.htm.jsonl, pages 173–174; page 45; section 5.11 | Foreign value only reachable through equity pledge | Neutral — Stable | Not assessed: no comparative source | EV-14; EV-15 |
| Amendments | Required Lenders above 50%; all-lender rights limited to economics, sharing, voting, material guarantor and all collateral; agent may add pari and junior intercreditor agreements without lender consent; non-pro-rata prepayment offers by Required Lenders | d887611dex101.htm.jsonl, pages 204–206; page 71; section 9.02(b) | Majority can loosen covenants and permit class-wide non-pro-rata offers | Negative — Covenant Erosion | Not assessed: no comparative source | EV-16; EV-18 |
| Collateral release | Automatic on permitted disposal to a non-Loan Party, guarantor release, Required Lender approval, mortgage suspension when no other debt holds mortgages | d887611dex101.htm.jsonl, pages 206–207; page 53; section 9.02(c) | Collateral can shrink without all-lender consent | Negative — Covenant Erosion | Not assessed: no comparative source | EV-17 |
| 2033 notes restricted payments | Unlimited if no default and fixed-charge coverage above 2.0x; builder from 2010 | d887611dex41.htm.jsonl, page 75; section 4.07 | Notes add no tighter constraint than the loans | Negative — Leverage Increase | Not assessed: no comparative source | EV-22 |
| 2033 notes amendments | Each holder for ranking and economics; two-thirds for release of all or substantially all collateral or adverse intercreditor changes | d887611dex41.htm.jsonl, pages 117–118; section 9.02 | Stronger anti-subordination protection than the loans | Positive — Covenant Headroom Expansion | Not assessed: no comparative source | EV-23 |
| Change of control | Sale of substantially all assets, liquidation plan, or more than 50% voting power; no rating condition | d887611dex41.htm.jsonl, page 14 | Put protects against sale-led re-leveraging | Neutral — Stable | Not assessed: no comparative source | EV-20 |

### Standard findings

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Credit agreement section 6.14 and Article VII clause (l) | Amended credit agreement; 2024-09-19; rank 1 | 7.50x springing test above 40% revolver usage, revolver-only default | No covenant tripwire before liquidity stress | Moderate: late warning, but no covenant-led default risk | Low direct effect | Quarter-end revolver usage against USD 364 million | Negative — Covenant Erosion | High | EV-01; EV-02 |
| Section 6.02 general restricted payment | Amended credit agreement; rank 1 | Unlimited at or below 6.75x pro forma | Distributions can absorb all earnings growth | High: reduces liquidity buffer before downturns | Moderate: cash leaves the collateral pool | Dividend declarations, compliance certificates | Negative — Leverage Increase | Medium (annex extraction) | EV-11 |
| Section 2.24 and permitted-debt clause (12) | Amended credit agreement; rank 1 | Pari secured debt to 5.00x secured net leverage with no dollar cap | Pari dilution of first-lien recovery | Moderate | High: dilutes all first-lien classes | Incremental joinders, note issuance, secured proxy leverage | Negative — Leverage Increase | High | EV-07; EV-08 |
| Consolidated EBITDA definition | Amended credit agreement; rank 1 | Uncapped transaction and compensation add-backs; 25% cost-savings cap | Covenant EBITDA expands all capacity | Moderate | Moderate | Gap between covenant and reported EBITDA in certificates | Negative — Covenant Erosion | High | EV-04 |
| Permitted Investments clause (1)(a) and section 5.11(b) | Amended credit agreement; rank 1 | Unlimited investment in restricted subsidiaries; foreign only 65% pledged | Assets can move to foreign non-guarantors | Low | High under stress: structural subordination | Intercompany balances, obligor-group share of sales | Negative — Covenant Erosion | Medium | EV-10; EV-14 |
| Section 9.02(b) | Amended credit agreement; rank 1 | No all-lender right for subordination; majority can permit class-wide non-pro-rata offers | Theoretical uptier route for term loans | Low | High if used | Amendment filings, lender-group formation | Negative — Covenant Erosion | Medium | EV-16 |
| 2033 indenture sections 9.02 and 12.01 | 2033 indenture; rank 1 | Each-holder ranking protection; two-thirds for collateral release; no direct holder enforcement | Notes harder to subordinate but enforcement delegated | Low | Moderate: control depends on intercreditor terms | Intercreditor amendments, joinders | Neutral — Stable | Medium | EV-23; EV-25 |
| 2027 indenture section 10.03 | 2027 indenture; rank 1 | 179-day blockage, one per 360 days; turnover | Supports senior recovery at subordinated expense | Low | Positive for seniors; adverse for subordinated | Blockage notices | Neutral — Stable | High | EV-26 |

### Step 4: definitions and ratio mechanics
Covenant EBITDA starts from consolidated net income of the borrower and restricted subsidiaries, excludes asset-sale, currency and extinguishment gains and losses and all unusual charges, then adds back taxes, interest, non-cash charges, unusual and integration costs, transaction and refinancing expenses whether or not completed, earn-outs, dividend-equivalent payments, customer start-up costs and projected cost savings within 24 months, capped at 25%. Relative to issuer EBITDA As Defined of USD 4,173 million and reported EBITDA of USD 3,813 million, the covenant measure can only be equal or larger because it contains the issuer's categories and more. Ratio debt is measured net of Unrestricted Cash held by Holdings, the borrower and restricted subsidiaries and not subject to non-loan-document liens, and leverage tests are run pro forma for acquisitions and asset sales. The definition of Consolidated Total Indebtedness was not reviewed, so whether the dividend payable, the securitization or contract liabilities sit inside covenant debt is not established. Collectively the definitions move ratio capacity in the borrower's favour whenever acquisitions add projected savings.
Basis: d887611dex101.htm.jsonl, pages 23–27; d887611dex101.htm.jsonl, page 81; Financial foundation (CP-1)

### Step 5: incurrence capacity and priming
Total incurrence capacity is ratio-led: pari secured to 5.00x secured net leverage, junior secured or unsecured and subordinated to 7.25x total net leverage, plus fixed-and-grower baskets whose floors total at least USD 250 million general debt, USD 250 million capital leases, USD 150 million acquired debt, USD 450 million foreign debt and USD 725 million securitization. Pari secured debt must be secured only on Collateral and incurred by Loan Parties, so the credit agreement does not permit structurally senior new-money debt at non-guarantors beyond the foreign and securitization baskets. The agent may add pari or junior intercreditor agreements without lender consent. Priming in the strict sense needs an amendment by Required Lenders because subordination is not an all-lender right in the reviewed list; that route is theoretical. The October 2024 securitization draw used the securitization basket, which is a structurally senior claim on transferred receivables.
Basis: d887611dex101.htm.jsonl, pages 57–60; d887611dex101.htm.jsonl, pages 204–205; Business & governance (CP-1A)

### Step 6: leakage
The largest leakage route is the ratio-only restricted-payment permission, already used for distributions of USD 2,020 million in November 2023 and USD 4,348 million declared in September 2024. Investment routes add unrestricted-subsidiary capacity with a USD 250 million floor, a general basket with a USD 500 million floor or 25% of Total Assets, joint ventures with a USD 1,000 million floor at or below 7.00x, and unlimited investment in restricted non-guarantor subsidiaries. Designation of existing subsidiaries as unrestricted is blocked, which limits a drop-down of an existing business but not the contribution of assets to a newly formed unrestricted subsidiary within those baskets. Combined capacity cannot be summed because baskets overlap and usage is not disclosed.
Basis: d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 180–181; Business & governance (CP-1A)

### Step 7: collateral and structural subordination
Lenders and secured noteholders share one pari first-lien class on the collateral of Holdings, the borrower, domestic restricted subsidiaries and TransDigm UK, subject to an intercreditor agreement not in the source set. Subordinated notes rank behind them contractually and, with the secured notes, are structurally behind creditors of non-guarantor subsidiaries. The obligor group produced about 79.27% of consolidated sales and held about 78.57% of goodwill, so roughly a fifth of sales sits at entities reachable only through equity pledges and intercompany claims. By class, first-lien recovery is protected by breadth of domestic collateral but diluted by pari incurrence; subordinated notes recovery is exposed to both blockage and structural subordination.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex41.htm.jsonl, page 30; calculation K14; calculation K16

### Step 8: defaults, remedies and amendment risk
Payment defaults have no grace on principal and five business days on interest; other covenants have 30 days after notice; negative covenants default immediately; judgments above USD 50 million unpaid for 60 days are defaults; change of control is a default. No equity cure was identified in the reviewed financial covenant text. Lender control is a simple majority for most changes, with the springing covenant itself controlled by Required Revolving Lenders. The main amendment risk is that a majority could approve covenant loosening or class-wide non-pro-rata offers without minority consent.
Basis: d887611dex101.htm.jsonl, pages 188–191; d887611dex101.htm.jsonl, pages 204–206

### T4.9 PD vs LGD Translation Table

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio-only restricted payments | Unlimited at or below 6.75x and no default | Cash leaves before debt reduction | Higher: thinner liquidity into a downturn | Moderate: less cash in collateral pool | Dividend declarations; compliance certificates | EV-11 |
| Pari secured incurrence | 5.00x secured net leverage gate, no dollar cap | More claims on same collateral | Moderate: higher interest burden | High: first-lien recovery diluted | Incremental joinders; new secured notes | EV-07; EV-08 |
| Springing covenant | Revolver-only above 40% usage | No early acceleration right for term or notes | Lowers covenant default risk; delays warning | Adverse: value erodes before creditors can act | Revolver usage | EV-01; EV-02 |
| Foreign non-guarantor transfers | Unlimited intercompany investment; 65% foreign pledge | Value moves behind local creditors | Low | High under stress | Intercompany balances; obligor share | EV-10; EV-14 |
| Amendment thresholds | Majority lenders; subordination not all-lender | Theoretical uptier | Low | High for non-participating lenders if used | Amendment filings | EV-16 |
| Subordination of subordinated notes | 179-day blockage; turnover | Senior priority in distress | Raises subordinated payment-default risk in stress | Positive for seniors; adverse for subordinated | Blockage notices | EV-26 |

### T4.10 Market Norm Comparison Table

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Ratio-only restricted payments, revolver-only springing covenant, uncapped transaction add-backs | Not supplied: no covenant-review report or market-norm source in the source set | Not assessed: comparison skipped for want of a comparative source | Not assessed: no third-party view to compare | Insufficient Information | EV-33 |

Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided.

### T4.11 Aggressiveness Score Table

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only 7.50x above 40% usage; no term or note test | No early acceleration right | Negative — Covenant Erosion | Completed | EV-01; EV-02 |
| Debt / lien incurrence capacity | 4 | Ratio-only incremental and pari debt to 5.00x; 7.25x total; 5.25x note liens; narrow MFN | Pari dilution, repricing risk | Negative — Leverage Increase | Completed | EV-07; EV-08; EV-21 |
| RP / investment / leakage capacity | 4 | Unlimited at 6.75x and above 2.0x coverage; unlimited restricted-subsidiary investment; demonstrated use; existing-subsidiary designation blocked | Cash and value leakage | Negative — Leverage Increase | Provisional | EV-10; EV-11; EV-13; EV-22 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped transaction, integration, compensation, dividend-equivalent add-backs; 25% cost-savings cap | Capacity inflation | Negative — Covenant Erosion | Completed | EV-04 |
| Collateral / guarantor protection | 3 | Domestic guarantees and joinder; 65% foreign pledge; all-lender release of all collateral; mortgage suspension release | Foreign value outside reach | Neutral — Stable | Provisional | EV-14; EV-17; EV-27 |
| Amendment / control mechanics | 4 | Majority lenders; subordination not an all-lender right; class-wide non-pro-rata offers; notes protect ranking | Theoretical uptier for loans | Negative — Covenant Erosion | Provisional | EV-16; EV-23 |
| Overall | 4 | Weighted to distribution and pari dilution capacity already used | Releveraging and leakage before any covenant signal | Negative — Leverage Increase | Provisional | EV-01 to EV-26 |

Overall score is four on the five-point scale, status Provisional, because collateral exclusions, intercreditor control and tested ratios are not established.

### T4.12 Red Flags Table

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further ratio-funded special dividend | Section 6.02 unlimited at 6.75x; 60-day declaration rule | Repeats the September 2024 extraction | PD up; LGD up; negative relative value for longer-dated paper | Track declarations and 8-K filings | EV-11 |
| New pari secured debt | Section 2.24; permitted-debt clause (12); 2033 note liens at 5.25x | Dilutes first-lien recovery | LGD up for all first-lien classes | Track incremental joinders and intercreditor joinders | EV-07; EV-08; EV-21 |
| Revolver usage near 40% | Section 6.14 trigger at USD 364 million | Switches on the only maintenance test | PD signal for revolver lenders | Quarterly revolver and letter-of-credit usage | EV-01 |
| Majority-lender amendment touching subordination or sharing | Section 9.02(b) | Theoretical uptier route | LGD up for excluded lenders | Monitor amendment filings | EV-16 |
| Transfer of assets to foreign or new unrestricted subsidiaries | Permitted Investments clauses (1), (10), (11) | Moves value behind local creditors or outside the group | LGD up | Intercompany balances; guarantor summary each year | EV-10 |
| Mortgage suspension | Section 9.02(c)(vii); definition of Mortgage Suspension Period | Real-property collateral released if no other debt requires mortgages | LGD up | Collateral notices | EV-17 |
| Securitization upsizing | Permitted-debt clause (18) | Receivables leave collateral pool | LGD up modestly | Securitization amendments | EV-08 |

### T4.13 Gaps Ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor control | First Lien Intercreditor Agreement and joinders | Enforcement control, standstill and release authority between first-lien classes | Intercreditor registers carry insufficient-information cells; recovery split unresolved | Obtain executed agreement and joinders |
| Collateral scope | Guarantee and Collateral Agreement; excluded-asset definition; UK debenture | Excluded intellectual property or real property would weaken recovery | Collateral score provisional | Obtain security documents |
| Tested ratios and usage | Compliance certificates; basket usage | Headroom and remaining capacity | All ratio headroom not calculable | Obtain latest certificates |
| Other note indentures | 2028, 2029, 2030, 2031, 2032 secured and 2029 subordinated indentures | Series-level terms may differ | Note conclusions confirmed for 2033 and 2027 notes only | Obtain indentures |
| Conformed annex reading | Clean conformed credit agreement | Deleted text may be read as operative | Medium confidence on unchecked thresholds | Obtain clean conformed copy |
| Debt and EBITDA definitions | Consolidated Total Indebtedness; Financial Covenant Consolidated EBITDA | Covenant debt and maintenance denominator | Definition conflicts unresolved | Review definitions |
| Refinancing and liability-management overlay | Not supplied for this assessment | Liability-management legal-capacity overlay | Uptier and exchange analysis capacity-based only | Combine when available |
| Market norm | Covenant-review report | Relative assessment | Market-norm table skipped | Obtain comparative source |

### Overall legal credit view
Overall, TransDigm Group Incorporated presents an aggressive covenant package based on ratio-only distribution and pari secured debt permissions, a revolver-only springing covenant and an EBITDA definition with largely uncapped add-backs. The main creditor protections are all-lender consent to release all collateral or a material guarantor or change pro rata sharing, the bar on designating existing subsidiaries unrestricted, each-holder ranking protection and two-thirds collateral-release voting in the 2033 notes, and strong subordination of the subordinated notes. The main covenant weaknesses are unlimited dividends at or below 6.75x, pari secured incurrence to 5.00x with a short MFN, unlimited investment in non-guarantor restricted subsidiaries and majority-lender control of most amendments. The primary default-risk path is releveraging through distributions or acquisitions with no maintenance tripwire, so stress surfaces as a liquidity squeeze; the primary recovery-risk path is pari dilution of the first-lien class and value sitting at foreign non-guarantors. For security selection the most important legal consideration is that secured notes carry stronger anti-subordination protection than term loans but delegate enforcement under an intercreditor agreement not supplied. Further analysis would require the intercreditor agreement, security documents, compliance certificates and the other note indentures. Legal & covenants completed with limitations; covenant aggressiveness four on the five-point scale; key gaps are the intercreditor agreement, security documents, compliance certificates and other indentures.
Basis: d887611dex101.htm.jsonl, pages 59–62; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 117–118; d826058dex41.htm.jsonl, pages 107–108

### T4D.1 Source Gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Amended credit agreement section 5.11, Unrestricted Subsidiary and Immaterial Subsidiary definitions, release provisions | Executed | 1 | Guarantor and collateral schedules and Guarantee and Collateral Agreement not supplied | Completed with Limitations |
| 2033 indenture collateral, guarantee release and collateral-agent provisions | Executed | 1 | Security documents and intercreditor agreement not supplied | Completed with Limitations |
| Annual report guarantor description and obligor-group summary | Filed | 4 | Exhibit 22.1 guarantor list and subsidiary list not supplied; summary aggregated | Completed with Limitations |
| Amendment No. 17 signature pages naming subsidiary parties | Executed | 1 | Partial list only; not a guarantor schedule | Completed with Limitations |

Subsequent-events scan: no guarantor release, collateral release, unrestricted designation or entity disposal after 2024-09-30 was identified in the reviewed sources; the October 2024 securitization draw uses an existing excluded entity and does not change the perimeter. Governing law: credit documents New York; TransDigm UK collateral under a UK debenture not supplied; the borrower and Holdings are Delaware corporations.
Basis: d887611dex101.htm.jsonl, pages 1–8; Business & governance (CP-1A); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59

### T4D.2 Restricted / Unrestricted Entity Register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; parent guarantor | Delaware | Public shareholders | Not a subsidiary; not designable | No significant operations or assets apart from TransDigm Inc. | Yes | EV-27 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated (100%) | Restricted; not designable | Combined obligor group: current assets USD 7,813 million; goodwill USD 8,186 million; net sales USD 6,294 million | Yes | EV-19; EV-27 |
| Domestic Restricted Subsidiaries (for example Esterline Technologies Corporation, AmSafe, Inc., Calspan, LLC) | Guarantors and grantors | United States | TransDigm Inc. | Restricted; existing subsidiaries cannot be designated unrestricted | Included in obligor-group summary; entity-level values not disclosed | Yes | EV-14; EV-19 |
| TransDigm UK | Guarantor of notes; debenture grantor | United Kingdom | Not established: ownership chain not supplied | Restricted | Included in obligor-group summary; entity value not disclosed | Yes | EV-20; EV-27 |
| Foreign Restricted Subsidiaries other than TransDigm UK | Non-guarantors; 65% voting stock pledged | Various, not itemised | Not established: subsidiary list not supplied | Restricted; can receive unlimited investment | Non-guarantor share approx USD 1,646 million of sales (gross difference); owe obligor group net USD 1,881 million | No | EV-10; EV-14; EV-27 |
| Immaterial Subsidiaries | Excluded domestic subsidiaries | United States | Not established: schedule not supplied | Restricted; excluded if at or below 5% of EBITDA and assets each | Not disclosed | No | EV-15 |
| Securitization Entity | Receivables purchaser and borrower | Not established: securitization documents not supplied | Not established | Excluded subsidiary | USD 487.5 million drawn of USD 650 million at year-end | No | EV-08; EV-29 |
| Unrestricted Subsidiaries | None identified | Not applicable: none identified | Not applicable: none identified | Only newly acquired or formed subsidiaries designable | Not disclosed; none identified | No | EV-13 |

### T4D.3 Guarantor Coverage Matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × credit facilities | Senior secured | Downstream | Termination of agreement or release under loan documents | EV-02; EV-17 |
| Holdings × secured notes | Senior secured | Downstream | Defeasance or discharge | EV-24; EV-27 |
| Holdings × subordinated notes | Senior subordinated | Downstream | Not reviewed in 2027 indenture | EV-27 |
| TransDigm UK × credit facilities | Not established: credit-agreement guarantor schedule not supplied; inferred from same-guarantor statement | Not established | Not established | EV-27 |
| TransDigm UK × secured notes | Senior secured | Cross-stream or upstream, not established | Release from credit facilities and capital-markets debt | EV-24; EV-27 |
| TransDigm UK × subordinated notes | Senior subordinated | Not established | Not reviewed | EV-27 |
| Domestic Restricted Subsidiaries × credit facilities | Senior secured | Upstream | Permitted disposal to non-Loan Party; Required Lender approval (not material guarantor); all-lender for material guarantor | EV-14; EV-16; EV-17 |
| Domestic Restricted Subsidiaries × secured notes | Senior secured | Upstream | Sale, unrestricted designation, becoming immaterial, release under credit facilities | EV-24; EV-27 |
| Domestic Restricted Subsidiaries × subordinated notes | Senior subordinated | Upstream | Not reviewed | EV-27 |
| Foreign non-guarantor subsidiaries × all tranches | None; 65% voting stock pledged by parent | Not applicable: no guarantee | Not applicable: no guarantee | EV-14 |

### T4D.4 Collateral-by-Entity Matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Holdings × first lien | Not established: excluded collateral definition not supplied | Termination or loan-document release | Not established | EV-17; EV-20 |
| Holdings × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| TransDigm Inc. × first lien | Excluded Collateral per Security Agreement, not supplied; equity where Rule 3-10 or 3-16 would apply | Permitted disposal; Required Lender approval; mortgage suspension | Rule 3-10 and 3-16 equity carve-out | EV-14; EV-17 |
| TransDigm Inc. × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| Domestic Restricted Subsidiaries × first lien | Not established: excluded collateral definition not supplied | Permitted disposal; guarantor release; mortgage suspension | Not established | EV-14; EV-17 |
| Domestic Restricted Subsidiaries × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| TransDigm UK × first lien | Not established: debenture not supplied | Agent may amend foreign documents for local law without lender consent | Local-law form at agent discretion | EV-17; EV-20 |
| TransDigm UK × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| Foreign Restricted Subsidiaries × first lien | All assets; only 65% voting stock of first-tier entities pledged | Equity pledge release on permitted disposal | 65% voting stock limit | EV-14 |
| Foreign Restricted Subsidiaries × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| Immaterial Subsidiaries × first lien | Excluded until thresholds exceeded | Joinder required once no longer excluded | Not established | EV-14; EV-15 |
| Immaterial Subsidiaries × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| Securitization Entity × first lien | Transferred receivables outside collateral | Receivables transfer under securitization basket | Not applicable: non-recourse entity | EV-08 |
| Securitization Entity × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |
| Unrestricted Subsidiaries × first lien | Equity of unrestricted subsidiaries excluded from pledge | Not applicable: none identified | Not applicable: none identified | EV-14 |
| Unrestricted Subsidiaries × junior lien | — no junior lien debt outstanding | Not applicable: none outstanding | Not applicable: none outstanding | EV-29 |

Recovery-access view is qualitative: domestic collateral is broad but its exclusions are not established, foreign value is reachable only through partial equity pledges, and receivables sold to the securitization entity are outside the pool.
Basis: d887611dex101.htm.jsonl, pages 173–174; d887611dex101.htm.jsonl, pages 206–207

### T4D.5 Structural Priority Table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans I–L | TransDigm Inc.; Holdings; domestic guarantors | Obligor-group assets and 65% foreign equity | Pari (same entity, same lien) | Foreign non-guarantor value approx USD 1,646 million of sales and net intercompany claim USD 1,881 million | Strong domestic access, diluted by pari incurrence | Medium | EV-14; EV-27 |
| Secured notes 2028–2033 | TransDigm Inc.; Holdings; TransDigm UK; domestic guarantors | Same pool under intercreditor agreement | Pari (same entity, same lien) | Same foreign non-guarantor value | Same access; enforcement delegated | Medium | EV-20; EV-27 |
| Term loans against future priming | TransDigm Inc. | Same pool | Priming-Exposed (uptier capable) | Collateral value if majority subordinates the loans | Theoretical loss of priority for non-participants | Low | EV-16 |
| Senior subordinated notes | TransDigm Inc.; Holdings; TransDigm UK; domestic guarantors, unsecured | Residual obligor value after senior debt | Contractually Subordinated | All value absorbed by senior claims of USD 19,702 million principal first | Recovery only after first-lien class and non-guarantor creditors | High | EV-26; EV-27 |
| Any group claim against foreign subsidiaries | Foreign non-guarantor subsidiaries | Equity residual only | Structurally Subordinated — Non-Guarantor Value | Approx USD 1,646 million of sales generated outside obligors | Local creditors first | Medium | EV-27 |
| Securitization facility | Securitization Entity | Transferred receivables | Structurally Senior | Receivables transferred, USD 487.5 million funded | Ahead of group creditors on those receivables | Medium | EV-08; EV-29 |

### T4D.6 Drop-down / Transfer Capacity Register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Investment in restricted non-guarantor | Borrower or guarantor to foreign restricted subsidiary | Permitted Investments clause (1)(a), EV-10 | Unlimited by amount | 4 | Structural subordination of transferred value | Theoretical | EV-10 |
| Investment in new unrestricted subsidiary | Obligor to newly formed unrestricted subsidiary | Permitted Investments clauses (1)(c) and (10); Unrestricted Subsidiary definition, EV-10 and EV-13 | Floors USD 250 million and USD 500 million; grower amounts not calculable | 4 | Value leaves restricted group | Theoretical | EV-10; EV-13 |
| Designation of existing subsidiary | Existing guarantor to unrestricted | Unrestricted Subsidiary definition, EV-13 | Not permitted for existing subsidiaries | 1 | Route closed | Theoretical | EV-13 |
| Joint-venture contribution | Obligor to joint venture | Permitted Investments clause (11), EV-10 | Floor USD 1,000 million at or below 7.00x | 3 | Value outside guarantee net | Theoretical | EV-10 |
| Distribution to shareholders | Borrower to Holdings to shareholders | Section 6.02, EV-11 | Unlimited at or below 6.75x; USD 4,348 million declared September 2024 | 4 | Cash leaves all creditors | Demonstrated | EV-11; EV-31 |
| Receivables sale | Domestic operations to Securitization Entity | Permitted-debt clause (18), EV-08 | Floor USD 725 million | 2 | Receivables leave collateral | Demonstrated | EV-08; EV-29 |

### T4D.7 Priming-Exposure Findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier | Section 9.02(b): subordination not an all-lender right; majority can permit class-wide non-pro-rata offers, EV-16 | Term lenders and revolving lenders not participating | Theoretical | Majority could subordinate the loans or exchange into priority debt | Medium (annex extraction) | EV-16 |
| Uptier | 2033 indenture section 9.02(h) each-holder ranking protection; two-thirds for collateral release, EV-23 | 2033 noteholders | Theoretical; protected | Harder to subordinate notes than loans | Medium | EV-23 |
| Trapdoor | Permitted Investments clause (1)(a) into foreign restricted subsidiaries, EV-10 | All guaranteed creditors | Theoretical | Value moved to foreign non-guarantors could support structurally senior local debt within the USD 450 million floor foreign basket | Medium | EV-08; EV-10 |

### T4D.8 Gaps Ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit 22.1 and credit-agreement guarantor schedule | Entity-level guarantee coverage | Guarantor matrix by class, not entity | Obtain schedule |
| Subsidiary list | Exhibit 21 subsidiary list | Perimeter and jurisdictions | Foreign entities not itemised | Obtain list |
| Security documents | Guarantee and Collateral Agreement; UK debenture | Excluded assets | Collateral matrix cells not established | Obtain documents |
| Entity-level debt and EBITDA | Debt and EBITDA by entity | Structural ranking by reachable value | Only obligor-group aggregate used | Obtain entity data |
| Intercreditor agreement | First Lien Intercreditor Agreement | Release and enforcement between classes | Priority by class not enforcement | Obtain agreement |

### Overall structural view
The highest-severity open routes are unlimited investment into foreign restricted non-guarantor subsidiaries and the ratio-only distribution permission, the latter already demonstrated. The most material structural gap is that about a fifth of sales is generated outside the obligor group, with the group's net intercompany claim of USD 1,881 million the main bridge to that value. Overall structural risk is weighted to those routes and is Open rather than Trapdoor, because existing subsidiaries cannot be designated unrestricted and new debt under the main ratio basket must sit at Loan Parties on Collateral. By class, first-lien lenders and secured noteholders share the same reachable value; subordinated noteholders are contractually and structurally behind; term lenders alone carry theoretical uptier exposure. Restricted-group and guarantee mapping completed with limitations, driven by missing guarantor schedules, security documents and the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, page 81; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation K15

### T4F.1 Controlling Documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Amended credit agreement | TransDigm Inc.; TransDigm Group Incorporated; subsidiaries party; lenders; Goldman Sachs Bank USA as administrative and collateral agent | 2024-09-19 amendment; base 2014-06-04 | New York | Executed | d887611dex101.htm.jsonl, pages 1 and 8 | EV-19 |
| 2033 secured notes indenture | TransDigm Inc.; TransDigm Group Incorporated; guarantors; The Bank of New York Mellon Trust Company as trustee and US collateral agent; The Bank of New York Mellon as UK collateral agent | 2024-09-19 | Not verified in pages reviewed; New York courts | Executed | d887611dex41.htm.jsonl, pages 1 and 127 | EV-25 |
| 2027 subordinated notes indenture | TransDigm Inc.; Holdings; guarantors; trustee | 2019-11-13 | Not verified in pages reviewed | Executed | d826058dex41.htm.jsonl, page 107 | EV-26 |
| First Lien Intercreditor Agreement | [Insufficient Information] — ICA not in the source set; parties named in 2033 indenture are the borrower, Holdings, guarantors, credit-agreement collateral agent and note trustees and agents | 2019-02-13 with joinders to 2024-09-19 | [Insufficient Information] — ICA not in the source set | Not supplied | d887611dex41.htm.jsonl, page 30 | EV-20 |

### T4F.2 Creditor Class Map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Shared Collateral | Sole right on financial covenant default; Required Revolving Lenders amend the springing test | Share of Required Lenders by loans and commitments | EV-01; EV-02; EV-18 |
| Term lenders I–L | First lien, pari | Shared Collateral | Act on other defaults through Required Lenders | Share of Required Lenders | EV-18 |
| Secured noteholders 2028–2033 | First lien, pari | Shared Collateral through notes collateral agents | No direct enforcement; through collateral agents and intercreditor agreement | Majority of each series; two-thirds for collateral release | EV-23; EV-25 |
| Subordinated noteholders | Contractually subordinated, unsecured | None | Remedies subject to blockage and turnover | Majority of each series | EV-26 |
| Securitization investors | Structurally senior on transferred receivables | Receivables of securitization entity | Not established: securitization agreement not supplied | Not established | EV-08 |

### T4F.3 Enforcement Control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Credit agreement Article VII clause (l) | Indefinite for term lenders until revolver termination or acceleration | Breach of 7.50x springing covenant | Revolving lenders | Term lenders | Term lenders cannot accelerate on covenant breach alone | Negative — Covenant Erosion | EV-02 |
| 2027 indenture section 10.03 | 179 days; one per 360 days; 181 clear days required | Blockage notice for non-payment default on designated senior debt | Designated senior debt representative | Subordinated noteholders | Seniors can stop subordinated payments in distress | Neutral — Stable | EV-26 |
| 2033 indenture section 12.01 | Not applicable: delegation, not standstill | Any enforcement | Notes collateral agents subject to intercreditor agreement | Secured noteholders | Holders cannot act individually | Neutral — Stable | EV-25 |
| First Lien Intercreditor Agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Lenders and secured noteholders | [Insufficient Information] — ICA not in the source set | Insufficient Information | EV-20 |

### T4F.4 Turnover and Release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| 2027 indenture section 10.05 | Subordinated holders hold in trust and pay over distributions received in breach | Not applicable: unsecured | Not applicable: none in reviewed text | Distribution not permitted under Article 10 | Subrogation after seniors paid | EV-26 |
| Credit agreement section 9.02(c) | Not applicable: release clause | Automatic on permitted disposal to non-Loan Party, guarantor release, mortgage suspension; otherwise Required Lenders; all lenders for all or substantially all | Not applicable: none in reviewed text | Compliance with agreement | All-lender protection for all collateral | EV-17 |
| 2033 indenture sections 9.02 and 10.07 | Not applicable: release clause | Two-thirds of holders for all or substantially all; guarantor released when released under credit facilities | Not applicable: none in reviewed text | Release under credit facilities not caused by payment | Ranking change needs each holder | EV-23; EV-24 |
| First Lien Intercreditor Agreement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | EV-20 |

### T4F.5 Recovery Control Assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Pro rata share of first-lien proceeds | No covenant acceleration right; majority amendments | High | Value erodes before term lenders can act | Negative — Covenant Erosion | EV-02; EV-16 |
| Secured noteholders | Pro rata share through collateral agents | Enforcement delegated under unsupplied intercreditor agreement | Insufficient Information | Control share not established | Insufficient Information | EV-20; EV-25 |
| Revolving lenders | Pro rata share; covenant control | Covenant only above 40% usage | Moderate | Late trigger | Negative — Liquidity Deterioration | EV-01 |
| Subordinated noteholders | Residual after seniors; turnover | Blockage up to 179 days | High | Payment can be stopped during distress | Negative — Refinancing Risk | EV-26 |

### T4F.6 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Controlling-party, standstill, release and purchase terms | Determines realised recovery split between lenders and secured noteholders | Enforcement and release rows insufficient | Obtain agreement and joinders |
| Other indentures | Five secured and two subordinated indentures | Series-level control rights | Class map extended by analogy | Obtain indentures |
| Securitization documents | Investor rights | Control over transferred receivables | Securitization row partially established | Obtain agreements |

### Intercreditor verification

| Register | Present | Columns complete | Minimum rows | Figures sourced or gapped | No unsupported conclusion |
|---|---|---|---|---|---|
| Controlling Documents | PASS | PASS | PASS | PASS | PASS |
| Creditor Class Map | PASS | PASS | PASS | PASS | PASS |
| Enforcement Control | PASS | PASS | PASS | PASS | PASS |
| Turnover and Release | PASS | PASS | PASS | PASS | PASS |
| Recovery Control Assessment | PASS | PASS | PASS | PASS | PASS |
| Gaps Ledger | PASS | PASS | PASS | NA | PASS |

### T4C.1 Capacity source gate

| Input | Availability | Quality | Limitation |
|---|---|---|---|
| Legal formulas | Available from executed credit agreement and 2033 indenture | High, subject to annex extraction | Debt and covenant EBITDA definitions not fully reviewed |
| Financial inputs | Available from Financial foundation | Retrospective annual report | Not covenant-defined |
| Usage data | Letters of credit, securitization draw, dividend amounts only | Partial | No basket tracker or certificate |
| Status | Completed with Limitations; Restricted (Usage) and Restricted (Definitions) | Not applicable: status row | Remaining capacity undetermined |

### T4C.2 Source Map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Amended credit agreement | Credit agreement | 2024-09-19 | Executed; conformed annex | Legal Formula | All loan tests and baskets | EV-01 to EV-18 |
| 1 | 2033 secured notes indenture | Indenture | 2024-09-19 | Executed | Legal Formula | Note lien ratio and restricted payments | EV-21; EV-22 |
| 2 | Amendment No. 17 closing conditions | Amendment | 2024-09-19 | Executed | Usage (certified ratios at closing) | Confirms gates met after Tranche L | EV-19 |
| 3 | Annual report on Form 10-K | Filing | 2024-11-07 | Filed | Financial Input; Usage (letters of credit, securitization) | Revolver usage and compliance statement | EV-28; EV-29 |
| 3 | Financial foundation | Analysis of annual report | As of 2024-09-30 | Accepted | Financial Input | Reference proxies only | EV-30 |
| 4 | Business & governance | Analysis | As of 2024-09-30 | Accepted | Usage (dividends, financing events) | Demonstrated restricted-payment use | EV-31 |

### T4C.3 Definition Register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | d887611dex101.htm.jsonl, pages 23–25 | Net income plus taxes, interest, non-cash, unusual, transaction, earn-out, dividend-equivalent, start-up and capped cost-savings add-backs | Covenant EBITDA from certificate | Expands every ratio and grower basket | Add-back inflation | Negative — Covenant Erosion | EV-04 |
| Consolidated Net Leverage Ratio | d887611dex101.htm.jsonl, pages 26–27 | Consolidated Total Indebtedness less Unrestricted Cash over LTM covenant EBITDA (Financial Covenant Consolidated EBITDA for section 6.14), pro forma | Covenant debt, Unrestricted Cash, covenant EBITDA | Gates restricted payments 6.75x, investments 7.00x, incurrence 7.25x, maintenance 7.50x | Netting of cash supports capacity | Negative — Leverage Increase | EV-05 |
| Consolidated Secured Net Debt Ratio | d887611dex101.htm.jsonl, page 27 | Secured debt less Unrestricted Cash over covenant EBITDA, pro forma | Secured covenant debt, cash, EBITDA | Gates pari secured debt at 5.00x | Netting of cash raises secured capacity | Negative — Leverage Increase | EV-06 |
| Unrestricted Cash | d887611dex101.htm.jsonl, page 81 | Cash of Holdings, borrower and restricted subsidiaries not subject to non-loan-document liens | Cash by entity and encumbrance | Increases net capacity | Cash netted even when later distributed | Negative — Leverage Increase | EV-13 |
| Immaterial Subsidiary | d887611dex101.htm.jsonl, page 45 | Designated subsidiary at or below 5% of EBITDA and 5% of Total Assets | Entity EBITDA and assets | Excludes subsidiaries from guarantee | Aggregate cap not identified in reviewed text | Neutral — Stable | EV-15 |
| Secured ratio debt under 2033 notes | d887611dex41.htm.jsonl, page 43 | Liens on ratio debt at secured net leverage at or below 5.25x | Note-defined secured debt and EBITDA | Looser than loan gate by 0.25x | Notes permit more secured debt than loans | Negative — Leverage Increase | EV-21 |
| Consolidated Fixed Charge Coverage Ratio | d887611dex41.htm.jsonl, page 75 | Must exceed 2.0x for unlimited restricted payments under notes | Note-defined EBITDA and fixed charges | Very wide permission | Notes add little constraint | Negative — Leverage Increase | EV-22 |
| Indebtedness of a Securitization Entity | d887611dex41.htm.jsonl, page 30 | Face amount of outstanding receivables interests counted as debt | Securitization face amount | Includes securitization in note debt tests | Differs from carrying value | Neutral — Stable | EV-20 |

### Definition conflict register

| Item | Covenant definition | Financial foundation basis | Figures and locators | Treatment |
|---|---|---|---|---|
| Leverage denominator | Consolidated EBITDA or Financial Covenant Consolidated EBITDA (credit agreement pages 23–27); annual report describes the test on EBITDA As Defined (page 62) | Reported EBITDA USD 3,813 million; EBITDA As Defined USD 4,173 million; supported-only USD 3,813 million per Earnings quality | Covenant EBITDA not disclosed | Covenant definition governs; reference proxies use EBITDA As Defined and are labelled non-covenant |
| Debt numerator | Consolidated Total Indebtedness, definition not reviewed | Carrying debt USD 24,880 million; gross USD 25,068 million | Annual report page 120; Financial foundation | Not reconciled; conflict preserved |
| Securitization | 2033 indenture counts face amount; credit agreement treatment not reviewed | Carrying USD 486 million; gross drawn USD 487.5 million | Annual report pages 62 and 144 | Both figures retained |
| Cash netting | Unrestricted Cash of Holdings, borrower and restricted subsidiaries | Total cash USD 6,261 million; USD 1,913 million after October 2024 dividend payment | Annual report page 120; Financial foundation calculation C21 | Unrestricted Cash not established |
| Dividend payable | Inclusion in covenant Indebtedness not established | Payable USD 4,216 million excluded from financial debt; included in obligation-inclusive debt by Earnings quality | Annual report page 170 | Outside covenant debt not confirmed |
| Customer advances | Inclusion in covenant Indebtedness not established | Contract liabilities USD 177 million, non-debt float | Annual report page 142 | Float sits outside every debt basket if excluded; capacity-relevant gap |

### T4C.4 Headroom Table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger for springing covenant | max-ratio | 40.00% | 7.36% | Threshold minus revolving exposure over commitments (USD 67 million over USD 910 million) | 32.64% | Compliant | Letters of credit counted in full; cash collateralisation not stated | Covenant switches on only with heavy revolver use | Neutral — Stable | EV-01; EV-29 |
| Springing maximum covenant net leverage | max-ratio | 7.50x | [Insufficient Information] — missing: current tested ratio | Threshold minus tested ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Not in force at year-end; reference proxy 4.46x is not covenant-defined | No tripwire for term loans or notes | Negative — Covenant Erosion | EV-01 |
| Incremental facility, covenant net leverage | max-ratio | 7.25x | [Insufficient Information] — missing: current tested ratio | Threshold minus pro forma ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Certified met at Amendment No. 17 closing | Releveraging capacity | Negative — Leverage Increase | EV-07; EV-19 |
| Incremental and pari secured debt, secured net leverage | max-ratio | 5.00x | [Insufficient Information] — missing: current tested ratio | Threshold minus pro forma ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Reference proxy 4.22x after October 2024 payment is not covenant-defined | Pari dilution | Negative — Leverage Increase | EV-07; EV-08 |
| General restricted payments, covenant net leverage | max-ratio | 6.75x | [Insufficient Information] — missing: current tested ratio | Threshold minus pro forma ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Reference proxy 5.50x after October 2024 payment; read from conformed annex | Distribution capacity | Negative — Leverage Increase | EV-11 |
| Joint-venture investments, covenant net leverage | max-ratio | 7.00x | [Insufficient Information] — missing: current tested ratio | Threshold minus pro forma ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Grower amount not calculable | Leakage | Negative — Covenant Erosion | EV-10 |
| 2033 notes secured ratio-debt liens | max-ratio | 5.25x | [Insufficient Information] — missing: current tested ratio | Threshold minus pro forma ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Note definition not fully reviewed | Pari dilution | Negative — Leverage Increase | EV-21 |
| 2033 notes general restricted payments, fixed-charge coverage | min-ratio | 2.00x | [Insufficient Information] — missing: current tested ratio | Tested ratio minus threshold; must exceed | [Insufficient Information] — missing: current tested ratio | Not Calculable | Fixed-charge definition not reviewed | Distribution capacity | Negative — Leverage Increase | EV-22 |

### T4C.5 Capacity Register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Incremental facility capacity | Section 2.24 | Ratio Basket: unlimited while 7.25x and 5.00x met | No default; certificate | Covenant ratios not disclosed | USD 1,500 million Tranche L in September 2024 | Not calculable: tested ratios missing | Not calculable: tested ratios missing | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | EV-07 |
| Debt incurrence capacity | Permitted-debt clause (12) | Incremental Ratio Amount at 5.00x pari, 7.25x junior or unsecured | Maturity and life not shorter than term loans; Loan Parties only | Ratios not disclosed | USD 1,500 million 2033 notes in September 2024 | Not calculable: tested ratios missing | Not calculable: tested ratios missing | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | EV-08 |
| Debt incurrence capacity | Permitted-debt clause (13) | Grower Basket: greater of USD 250 million and 10% EBITDA | Borrower and guarantors | Covenant EBITDA not disclosed | Not disclosed | At least USD 250 million | Not calculable: usage missing | Provisional | Moderate | General debt | Negative — Leverage Increase | EV-08 |
| Debt incurrence capacity | Permitted-debt clause (14) | Grower Basket: greater of USD 450 million and 18% EBITDA | Foreign restricted subsidiaries | Covenant EBITDA not disclosed | Not disclosed | At least USD 450 million | Not calculable: usage missing | Provisional | High | Structurally senior foreign debt | Negative — Leverage Increase | EV-08 |
| Debt incurrence capacity | Permitted-debt clause (18) | Grower Basket: greater of USD 725 million and 20% EBITDA | Non-recourse securitization | USD 487.5 million drawn at year-end; USD 650 million after October 2024 draw | USD 650 million facility commitment | At least USD 725 million | Not calculable: completeness of securitization usage not certified | Provisional | Moderate | Receivables leave collateral | Negative — Leverage Increase | EV-08; EV-29 |
| Restricted payment capacity | Section 6.02 general | Ratio Basket: unlimited at 6.75x | No default | Ratio not disclosed | USD 4,348 million declared September 2024 | Not calculable: tested ratio missing | Not calculable: tested ratio missing | Formula Extracted Only | Critical | Cash extraction | Negative — Leverage Increase | EV-11 |
| Restricted payment capacity | Section 6.02 clause (7) | General Basket: greater of USD 75 million and 3% EBITDA | No default | Not disclosed | Not disclosed | At least USD 75 million | Not calculable: usage missing | Provisional | Low | Small leakage | Neutral — Stable | EV-11 |
| Investment capacity | Permitted Investments clause (1)(a) | Unlimited into restricted subsidiaries | None | Not applicable: unlimited | Net USD 1,881 million owed by non-guarantors | Unlimited | Unlimited | Completed | High | Transfer to non-guarantors | Negative — Covenant Erosion | EV-10; EV-27 |
| Unrestricted subsidiary capacity | Permitted Investments clause (1)(c) | Grower Basket: greater of USD 250 million and 10% EBITDA | New subsidiaries only | Not disclosed | None identified | At least USD 250 million | Not calculable: usage missing | Provisional | Moderate | Value outside group | Negative — Covenant Erosion | EV-10; EV-13 |
| Investment capacity | Permitted Investments clause (10) | General Basket: greater of USD 500 million and 25% of Total Assets | None stated | Total Assets as defined not established | Not disclosed | At least USD 500 million | Not calculable: usage missing | Provisional | High | Broad investment leakage | Negative — Covenant Erosion | EV-10 |
| Investment capacity | Permitted Investments clause (11) | Grower Basket: greater of USD 1,000 million and 40% EBITDA | 7.00x; no default | Not disclosed | Not disclosed | At least USD 1,000 million | Not calculable: usage missing | Provisional | Moderate | Joint-venture leakage | Negative — Covenant Erosion | EV-10 |
| Asset transfer capacity | Section 6.03 | Prepayment / Reinvestment Capacity | 75% cash above USD 50 million; non-cash up to USD 300 million | Not disclosed | Not disclosed | Not calculable: reinvestment terms not reviewed | Not calculable: usage missing | Insufficient Information | Moderate | Disposal proceeds | Neutral — Stable | EV-12 |
| Maintenance covenant headroom | Section 6.14 trigger | Fixed Basket: 40% of commitments | Quarter-end | USD 67 million letters of credit | USD 67 million | USD 364 million | USD 297 million | Completed | Low | Trigger far away | Neutral — Stable | EV-01; EV-29 |
| MFN protection | Section 2.24(b) | Not applicable: protection term | 50 bp; 18 months; acquisition carve-out | Not applicable | Not applicable | Not applicable: no amount | Not applicable: no amount | Completed | Moderate | Repricing exposure | Negative — Refinancing Risk | EV-07 |
| Guarantor / collateral release capacity | Section 9.02(c) | Not applicable: consent mechanics | Required Lenders except all or substantially all | Not applicable | Not disclosed | Not calculable: collateral values missing | Not calculable: collateral values missing | Formula Extracted Only | High | Collateral reduction by majority | Negative — Covenant Erosion | EV-17 |
| EBITDA add-back capacity | Consolidated EBITDA clause (m) | Cost savings at most 25% of covenant EBITDA | 24 months; good faith | Not disclosed | Not disclosed | Not calculable: covenant EBITDA missing | Not calculable: covenant EBITDA missing | Formula Extracted Only | High | Capacity inflation | Negative — Covenant Erosion | EV-04 |

Fixed floors are minimums of greater-of baskets and are not totalled because baskets overlap, investment routes are fungible with restricted payments for unrestricted-subsidiary funding, and usage is not disclosed.

### T4C.6 Debt/Lien/Priming Table

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental | Unlimited at 7.25x and 5.00x | Formula Extracted Only | Pari dilution | Moderate | High | Favour shorter first-lien maturities over longer pari paper | EV-07 |
| Pari secured notes under 2033 indenture | Liens at 5.25x | Formula Extracted Only | Pari dilution beyond loan gate | Moderate | High | Notes and loans equally diluted | EV-21 |
| Junior or unsecured ratio debt | 7.25x | Formula Extracted Only | Layering below first lien | Moderate | Low for first lien; high for subordinated | Subordinated notes most exposed | EV-08 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% EBITDA | Provisional | Structurally senior | Low | Moderate | Adverse for all guaranteed classes | EV-08 |
| MFN sunset | 50 bp; 18 months; acquisition carve-out | Completed | Repricing of new tranches | Low | Low | Existing lenders lose yield protection | EV-07 |
| Majority-lender subordination | Not an all-lender right in reviewed list | Formula Extracted Only | Uptier | Low | High for non-participants | Notes better protected than loans | EV-16; EV-23 |

### T4C.7 Leakage Analysis Table

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Special dividends | USD 2,020 million paid November 2023; USD 4,348 million declared 2024-09-19 and paid October 2024 within 29 days | Ratio Basket at 6.75x; 60-day declaration rule | Remaining not calculable: tested ratio missing | Cash leaves group | Critical | Negative — Leverage Increase | EV-11; EV-31 |
| Restricted non-guarantor investment | Unlimited | Permitted Investments clause (1)(a) | Unlimited | Value moves behind foreign creditors | High | Negative — Covenant Erosion | EV-10 |
| Unrestricted subsidiary investment | Floor USD 250 million | Grower Basket | Not calculable: usage missing | Value leaves restricted group | Moderate | Negative — Covenant Erosion | EV-10; EV-13 |
| General investments | Floor USD 500 million or 25% of Total Assets | General Basket | Not calculable: usage missing | Broad | High | Negative — Covenant Erosion | EV-10 |
| Receivables securitization | Fully drawn USD 650 million after October 2024 | Grower Basket | Not calculable: usage completeness not certified | Receivables outside collateral | Moderate | Negative — Liquidity Deterioration | EV-08; EV-29 |

Aggregate leakage capacity is not totalled because restricted payments and investment routes overlap and usage is not certified; the recovery implication is that value can leave the guarantor net faster than any maintenance covenant can respond.

### T4C.8 Add-Back Inflation Table

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Unusual, integration, restructuring and transaction costs | d887611dex101.htm.jsonl, pages 23–24; clauses (d), (e) | Uncapped; whether or not completed | Not calculable: covenant EBITDA missing | Recurring acquisition costs lift every ratio basket | PD up through releveraging | EV-04 |
| Non-cash and deferred compensation | d887611dex101.htm.jsonl, page 26; net income clause (11) | Uncapped | Not calculable | Excluded although Earnings quality treats it as recurring | Capacity overstated relative to sustainable earnings | EV-05; EV-32 |
| Dividend-equivalent payments | d887611dex101.htm.jsonl, page 24; clause (k) | Uncapped | Not calculable | Distribution-linked payments raise EBITDA | Distributions partly self-fund capacity | EV-04 |
| Projected cost savings | d887611dex101.htm.jsonl, page 24; clause (m) | 25% of covenant EBITDA; 24 months | Not calculable | Savings before realisation lift capacity | LGD up through earlier pari incurrence | EV-04 |
| Pro forma acquisitions | d887611dex101.htm.jsonl, page 27; section 1.07 | Pro forma for acquisitions and asset sales | Not calculable | Acquired EBITDA counted at once | Acquisitive model expands capacity | EV-05 |

### T4C.9 Flags Table

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio-only distributions | Unlimited at 6.75x; demonstrated use | Cash extraction | Critical | Moderate | Not mapped: routing of this flag is outside this assessment | EV-11 |
| Pari dilution without dollar cap | 5.00x gate; 5.25x note liens | First-lien recovery dilution | High | Moderate | Not mapped: routing of this flag is outside this assessment | EV-07; EV-21 |
| Fungible investment and distribution routes | Unrestricted-subsidiary funding through investments or distributions | Double-counting risk | Moderate | Formula Only | Not mapped: routing of this flag is outside this assessment | EV-10; EV-11 |
| Classification flexibility | Borrower may divide and classify debt among baskets | Reclassification feature | Moderate | High | Not mapped: routing of this flag is outside this assessment | EV-09 |
| Majority-lender amendments | Subordination not an all-lender right | Lender-control weakness | High | Low | Not mapped: routing of this flag is outside this assessment | EV-16 |
| Collateral release by majority and mortgage suspension | Section 9.02(c) | Collateral reduction | Moderate | Moderate | Not mapped: routing of this flag is outside this assessment | EV-17 |

### Subsequent events affecting capacity

| Event | Date | Capacity effect | Treatment | Source |
|---|---|---|---|---|
| Payment of special dividend and equivalents, USD 4,348 million | 2024-10-18 | Restricted-payment usage declared 2024-09-19 and tested at declaration under 60-day rule | Pro forma only; not period fact | Business & governance (CP-1A); Financial foundation (CP-1) |
| Securitization draw of remaining USD 162.5 million | 2024-10-16 | Securitization basket usage to USD 650 million | Pro forma only | Business & governance (CP-1A) |

### Nearest pressure point
The nearest pressure point is the general restricted-payment permission at 6.75x covenant net leverage. The evidence is section 6.02 of the credit agreement and the September 2024 declaration of USD 4,348 million paid in October 2024, with a reference proxy of 5.50x after payment. The mechanism is that any rise in covenant EBITDA, including projected savings from acquisitions, reopens room for another debt-funded distribution with no amount cap and no maintenance test to stop it. The credit implication is higher default risk through thinner liquidity and higher loss given default through cash leaving the collateral pool, with longer-dated first-lien and subordinated paper most exposed. The monitoring signal is a new special dividend declaration, an incremental joinder or new secured notes issued alongside it. A compliance certificate with covenant EBITDA and Consolidated Total Indebtedness would tighten the view.
Basis: d887611dex101.htm.jsonl, pages 180–181; Business & governance (CP-1A); calculation K06; calculation K11

### T4C.11 Priority Matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | General restricted payments at 6.75x | Critical | Moderate | Debt-funded distributions | Higher | Higher | Dividend declarations | EV-11 |
| 2 | Pari secured incremental and ratio debt at 5.00x | High | Moderate | Pari dilution | Moderate | Higher | Incremental joinders; note issues | EV-07; EV-08 |
| 3 | Unlimited investment into restricted non-guarantors | High | Moderate | Structural leakage | Low | Higher | Guarantor summary; intercompany balances | EV-10 |
| 4 | EBITDA add-backs and cost savings | High | Formula Only | Capacity inflation | Moderate | Moderate | Covenant EBITDA versus reported | EV-04 |
| 5 | Majority-lender amendments | High | Low | Uptier | Low | Higher for non-participants | Amendment filings | EV-16 |

### T4C.12 Gaps Ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Tested covenant ratios | Maintenance and incurrence headroom unconfirmable | Seven tests not calculable | Obtain certificates |
| Covenant EBITDA bridge | Covenant EBITDA versus reported | Ratio capacity unreliable | Grower amounts above floors not calculable | Obtain bridge |
| Basket usage tracker | Usage of fixed and grower baskets | Remaining capacity undetermined | Remaining capacity not calculable | Obtain tracker |
| Debt definition | Consolidated Total Indebtedness | Numerator for every ratio | Definition conflicts preserved | Review definition |
| Guarantor and collateral schedules | Schedules and security agreement | Leakage and recovery | Collateral capacity not calculable | Obtain schedules |
| MFN effective dates | Amendment No. 16 and No. 17 effective dates | Sunset timing | Sunset dates not fixed | Confirm effective dates |

### Overall covenant capacity view
Overall, TransDigm Group Incorporated has limited covenant-capacity visibility. The main capacity concern is the general restricted-payment permission, because it is unlimited in amount below 6.75x covenant net leverage and regenerates with add-back-inflated EBITDA, which raises both default risk and loss given default through cash extraction. Exact headroom is not supported. Further analysis requires compliance certificates, a covenant EBITDA bridge and a basket-usage record.
- The only measured headroom is on the revolver trigger, USD 297 million below the level at which the springing test applies.
- Debt and lien capacity is ratio-based with no dollar cap, demonstrated in September 2024.
- Investment into restricted non-guarantor subsidiaries is unlimited, the widest leakage route by amount.
- Covenant EBITDA includes the recurring costs Earnings quality rejects, so capacity is larger than sustainable earnings justify.
Covenant capacity completed with limitations; key gaps are compliance certificates, covenant EBITDA bridge, basket usage and the debt definition.
Basis: d887611dex101.htm.jsonl, pages 23–27; d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, pages 180–181; calculation K03; Earnings quality (CP-1D)

### Evidence register

| Evidence ID | Provision or fact | Source |
|---|---|---|
| EV-01 | Section 6.14 financial covenant | d887611dex101.htm.jsonl, page 188 |
| EV-02 | Article VII clauses (i), (k), (l) | d887611dex101.htm.jsonl, page 191 |
| EV-03 | Article VII clauses (c), (d), (e) | d887611dex101.htm.jsonl, page 189 |
| EV-04 | Consolidated EBITDA definition | d887611dex101.htm.jsonl, pages 23–25 |
| EV-05 | Consolidated Net Income exclusions; Consolidated Net Leverage Ratio | d887611dex101.htm.jsonl, pages 25–27 |
| EV-06 | Consolidated Secured Debt and Secured Net Debt Ratio | d887611dex101.htm.jsonl, page 27 |
| EV-07 | Section 2.24 incremental and MFN | d887611dex101.htm.jsonl, pages 142–146 |
| EV-08 | Permitted Indebtedness clauses (6) to (18) | d887611dex101.htm.jsonl, pages 57–60 |
| EV-09 | Classification and limited-condition acquisition testing | d887611dex101.htm.jsonl, page 61 |
| EV-10 | Permitted Investments | d887611dex101.htm.jsonl, pages 61–62 |
| EV-11 | Section 6.02 restricted payments | d887611dex101.htm.jsonl, pages 178–181 |
| EV-12 | Sections 6.03 and 6.04 | d887611dex101.htm.jsonl, pages 181–182 |
| EV-13 | Unrestricted Cash and Unrestricted Subsidiary | d887611dex101.htm.jsonl, page 81 |
| EV-14 | Section 5.11 guarantors and pledges | d887611dex101.htm.jsonl, pages 173–174 |
| EV-15 | Immaterial Subsidiary | d887611dex101.htm.jsonl, page 45 |
| EV-16 | Section 9.02(b) amendments | d887611dex101.htm.jsonl, pages 204–206 |
| EV-17 | Section 9.02(c) and (d) releases; Mortgage Suspension Period | d887611dex101.htm.jsonl, pages 206–207; d887611dex101.htm.jsonl, page 53 |
| EV-18 | Required Lenders | d887611dex101.htm.jsonl, page 71 |
| EV-19 | Amendment No. 17 preamble, conditions, governing law | d887611dex101.htm.jsonl, pages 1–8 |
| EV-20 | 2033 indenture: Change of Control, Collateral, Intercreditor Agreement, securitization debt | d887611dex41.htm.jsonl, page 14; d887611dex41.htm.jsonl, page 30 |
| EV-21 | 2033 indenture permitted liens clause (xxxi) | d887611dex41.htm.jsonl, page 43 |
| EV-22 | 2033 indenture section 4.07 | d887611dex41.htm.jsonl, page 75 |
| EV-23 | 2033 indenture section 9.02 | d887611dex41.htm.jsonl, pages 117–118 |
| EV-24 | 2033 indenture section 10.07 | d887611dex41.htm.jsonl, page 122 |
| EV-25 | 2033 indenture sections 11.14 to 12.01 | d887611dex41.htm.jsonl, pages 127–128 |
| EV-26 | 2027 indenture sections 10.03 to 10.08 | d826058dex41.htm.jsonl, pages 107–108 |
| EV-27 | Guarantor information and obligor-group summary | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| EV-28 | Covenant description and compliance | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| EV-29 | Debt terms, revolver and securitization usage | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| EV-30 | Financial reference metrics | Financial foundation (CP-1) |
| EV-31 | Distribution and financing events | Business & governance (CP-1A) |
| EV-32 | Recurring add-back challenge | Earnings quality (CP-1D) |
| EV-33 | Document inventory and gaps | Source readiness (CP-0) |

## Calculations

All amounts are USD millions unless stated; ratios are times; dates are calendar days. Leverage proxies divide financial-foundation carrying net debt by issuer EBITDA As Defined and are reference metrics only, not covenant calculations.

| ID | Operation | Period / units | Inputs and output | Source |
|---|---|---|---|---|
| K01 | Product | 2024-09-30; USD million | 910 revolving commitments × 0.40 = 364.00 trigger amount; matches annual report USD 364 million | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59 and 62 |
| K02 | Ratio | 2024-09-30; fraction | 67 letters of credit / 910 commitments = 0.073626373626373626373626373626373626374, displayed 7.36% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K03 | Difference | 2024-09-30; USD million | 364 − 67 = 297 headroom to trigger | calculation K01; calculation K02 |
| K04 | Difference | 2024-09-30; percentage points | 40.00 − 7.36 = 32.64 | calculation K02 |
| K05 | Ratio | FY2024; x | Net debt 18619 / EBITDA As Defined 4173 = 4.4617780972921159837047687514977234603, displayed 4.46x | Financial foundation (CP-1) |
| K06 | Ratio | October 2024 dividend pro forma; x | Pro forma net debt 22967 / 4173 = 5.5037143541816439012700694943685597891, displayed 5.50x | Financial foundation (CP-1) |
| K07 | Difference | 2024-09-30; USD million | Identified secured carrying debt 19534 − cash 6261 = 13273 | Financial foundation (CP-1) |
| K08 | Ratio | 2024-09-30; x | 13273 / 4173 = 3.1806853582554517133956386292834890966, displayed 3.18x | calculation K07 |
| K09 | Sum | October 2024 dividend pro forma; USD million | 13273 + 4348 = 17621 | calculation K07; Financial foundation (CP-1) |
| K10 | Ratio | October 2024 dividend pro forma; x | 17621 / 4173 = 4.2226216151449796309609393721543254254, displayed 4.22x | calculation K09 |
| K11 | Difference | Reference only; x | 6.75 − 5.50 = 1.25 distance from proxy to dividend test | calculation K06 |
| K12 | Difference | Reference only; x | 7.25 − 5.50 = 1.75 distance from proxy to incremental total-leverage gate | calculation K06 |
| K13 | Difference | Reference only; x | 5.00 − 4.22 = 0.78 distance from secured proxy to pari secured gate | calculation K10 |
| K14 | Ratio | FY2024; fraction | Obligor-group net sales 6294 / consolidated 7940 = 0.79269521410579345088161209068010075567, displayed 79.27% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K15 | Difference | FY2024; USD million | 7940 − 6294 = 1646 sales outside the obligor summary, gross of intercompany effects | calculation K14 |
| K16 | Ratio | 2024-09-30; fraction | Obligor-group goodwill 8186 / consolidated 10419 = 0.78568000767828006526538055475573471542, displayed 78.57% | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K17 | Difference and sum | 2024-09-19 to 2024-10-18; days | 30 − 19 = 11 days remaining in September; 11 + 18 = 29 days from declaration to payment, inside the 60-day rule | Business & governance (CP-1A); d887611dex101.htm.jsonl, page 178 |
| K18 | Sum | 2024-09-30; USD million principal | Secured notes 2100 + 2750 + 1450 + 1000 + 2200 + 1500 = 11000 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| K19 | Sum | 2024-09-30; USD million principal | Subordinated notes 2650 + 1200 + 750 = 4600 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| K20 | Sum | 2024-09-30; USD million principal | Term loans 8702 + secured notes 11000 = 19702 first-lien funded principal, excluding undrawn revolver | calculation K18; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |

## Gaps

| Gap | What is missing | Conclusion restricted | Severity |
|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement of 2019-02-13 and joinders | Enforcement control, standstill and release between lenders and secured noteholders | MATERIAL |
| Security documents | Guarantee and Collateral Agreement, excluded-collateral definition, UK debenture | Collateral scope and score | MATERIAL |
| Tested ratios and usage | Compliance certificates, covenant EBITDA, basket tracker | All ratio headroom and remaining capacity | MATERIAL |
| Other indentures | 2028, 2029, 2030, 2031, 2032 secured and January and May 2029 subordinated indentures | Series-level covenant and voting terms | MATERIAL |
| Clean conformed text | Credit agreement without merged inserted and deleted text | Confidence in thresholds not cross-checked to the annual report | MINOR |
| Market norm | Covenant-review report or comparative source | Relative assessment | MINOR |
| Definitions | Consolidated Total Indebtedness and Financial Covenant Consolidated EBITDA | Covenant debt and maintenance denominator | MINOR |

Relative conditions without fixed dates: the Tranche L MFN protection lapses 18 months after the Amendment No. 17 Effective Date, and the Tranche J protection 18 months after the Amendment No. 16 Effective Date; neither effective date is established in the reviewed text, so no sunset date is fixed. The refinancing and liability-management overlay was not supplied for this assessment, so whether a majority-lender uptier or class-wide non-pro-rata offer is economically likely is not established; the legal capacity analysis stands on the documents alone.

## Next module
The orchestrator selects the next module.
