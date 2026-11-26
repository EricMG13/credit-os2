## Request
Legal and covenant interpretation for TransDigm Group Incorporated, with TransDigm Inc. as borrower and note issuer, as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers the controlling credit agreement, the 2033 secured notes indenture and the 2027 subordinated notes indenture, including covenant capacity, restricted-group and guarantee structure, and intercreditor control.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement, with annexed second amended and restated credit agreement as amended | 2024-09-19 | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling loan covenants: financial covenant, EBITDA and ratio definitions, permitted debt, restricted payments, investments, unrestricted subsidiaries, guarantor joinder, events of default, amendments and collateral release |
| d887611dex41.htm.jsonl | Execution-version indenture for the 6.000% senior secured notes due 2033 | 2024-09-19 | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants: ratio debt, permitted liens, restricted payments, investments, amendment thresholds, guarantor release, intercreditor reference, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13 | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, payment blockage, turnover and governing law |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of covenants and compliance, revolver usage, guarantor structure and combined guarantor financial summary; retrospective evidence |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source set, temporal boundary and legal-coverage restrictions |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt, secured carrying debt, cash, net debt, EBITDA As Defined, net interest, total assets and October 2024 pro forma adjustments |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Parent and borrower identity, Delaware incorporation, distribution history and October 2024 payment date |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Challenge of issuer add-backs used to judge covenant EBITDA inflation |

## Findings

### Bottom line
TransDigm's covenant package protects creditors mainly through incurrence ratios, not maintenance tests: the 6.75x leverage-based dividend permission and 5.00x secured-debt test leave room for further debt-funded distributions and pari secured dilution, so recovery erosion, not covenant default, is the main legal risk.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 146

On an indicative proxy using EBITDA As Defined of USD 4,173 million and year-end net debt of USD 18,619 million, which is USD 22,967 million pro forma for the October 2024 dividend and unchanged at USD 18,619 million after the October 2024 securitization draw, leverage is 5.50x and secured net leverage 4.22x. That implies about USD 5,200.75 million of dividend room and USD 3,244.00 million of pari secured room. The only maintenance test serves revolving lenders and is dormant at 7.36% usage against a 40% trigger. These are proxies, and the intercreditor agreement was not supplied.
Basis: Financial foundation (CP-1); calculation L05; calculation L07; calculation L09; calculation L10; calculation L02

### Key findings
- Dividend capacity is set by a ratio rather than a dollar cap, and the September recapitalisation shows it is used. The credit agreement permits any restricted payment while consolidated net leverage, net of unrestricted cash, stays at or below 6.75x with no default, and the 2033 secured notes permit the same while fixed-charge cover exceeds 2.00x. On the proxy, a further USD 5,200.75 million of debt-funded distributions fits under the 6.75x test after the USD 4,348 million October payment; the proxy fixed-charge cover of 3.24x leaves 1.24x of cushion.
Basis: d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75; Business & governance (CP-1A); calculation L09; calculation L08
- Pari secured dilution is the nearest pressure point. New first-lien debt needs secured net leverage at or below 5.00x under the credit agreement; the proxy sits at 4.22x after the dividend, a cushion of 0.78x or about USD 3,244.00 million. The 2033 notes add a 5.25x test only for secured ratio debt, while separately allowing liens for all credit-facility obligations without a ratio cap, so the loan test, not the bond test, is the binding limit.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 39; d887611dex41.htm.jsonl, page 43; calculation L07; calculation L10; calculation L12
- The maintenance covenant gives term lenders and bondholders almost no early-warning protection. It is a 7.50x net leverage test, 8.00x for four quarters after a material acquisition, tested only when revolving usage exceeds 40% of commitments, amendable by the required revolving lenders alone, and a breach becomes a term-loan default only if revolving lenders terminate or accelerate. Usage of USD 67 million in letters of credit sits well below the USD 364 million trigger; on the post-dividend proxy, EBITDA could fall 26.62% before 7.50x is reached.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation L01; calculation L13
- Earnings definitions inflate every ratio-based permission. The financial-covenant EBITDA adds projected cost savings for actions within 24 months with no cap, the incurrence EBITDA caps them at 25% and the 2033 notes at 35%, and all three add back acquisition, integration, non-cash compensation and dividend-equivalent costs. Earnings quality rejected USD 345 million of such items for recurring-credit purposes, so legal capacity rests on a wider earnings base than creditors should underwrite.
Basis: d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, pages 23–24; d887611dex41.htm.jsonl, page 16; Earnings quality (CP-1D)
- Loan lenders have thinner amendment protection than secured noteholders. A simple majority of lenders can amend most loan terms; the unanimous list covers economics, pro rata sharing, voting thresholds, material guarantor releases and release of substantially all collateral but, in the text reviewed, not subordination of the loans' payment or lien priority. The 2033 notes need each affected holder for adverse ranking changes and two-thirds of holders to release substantially all collateral or adversely amend the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, pages 204–205; d887611dex101.htm.jsonl, page 71; d887611dex41.htm.jsonl, pages 117–118
- Structural subordination is material but only roughly quantified. Combined issuer and guarantor sales of USD 6,294 million against consolidated sales of USD 7,940 million leave about USD 1,646 million, or 20.73%, at non-guarantor subsidiaries, to whose creditors all notes are structurally subordinated; the guarantor group is, however, owed a net intercompany balance by those subsidiaries.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; calculation L16
- The subordinated notes carry standard but real enforcement handicaps. They rank behind all senior debt, can be blocked from payment for up to 179 days in any 360 days, and must turn over any distribution received in breach.
Basis: d826058dex41.htm.jsonl, pages 106–108

### Contrary evidence and what would change the view
The strongest counter-evidence is that the package still contains hard ratio gates that bound the worst outcomes. Pari secured debt must mature after the latest term loan, may be owed only by loan parties and may be secured only on existing collateral; unrestricted subsidiaries cannot hold recourse debt to the group and investments in them are capped in the loan agreement at the greater of USD 250 million and 10% of EBITDA, about USD 417.30 million on the proxy; releasing substantially all collateral needs every lender and two-thirds of 2033 noteholders. The issuer also states it complied with all debt covenants at year-end. The view would soften if a compliance certificate showed covenant ratios materially above the proxy, if the intercreditor agreement gave noteholders independent enforcement rights, or if a future amendment added anti-subordination protection to the loan agreement. It would harden if management used the remaining ratio room for another debt-funded distribution, or if the incurrence tests were loosened by majority amendment.
Basis: d887611dex101.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 61; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, page 205; d887611dex41.htm.jsonl, page 118; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L14

### Limitations
- The capacity and headroom figures are proxies built from consolidated reported debt, all reported cash and issuer EBITDA As Defined, not from the covenant-defined debt, unrestricted cash or restricted-group EBITDA; this changes the size of the dividend and secured-debt room, which would be larger if projected cost savings are added and smaller if some cash fails the unrestricted-cash test, but not the conclusion that ratio room exists.
- The First Lien Intercreditor Agreement was not supplied, so the conclusion on who controls enforcement between term lenders and secured noteholders, and any standstill or turnover between them, is not established rather than benign.
- The guarantee and collateral agreement and the guarantor schedule were not supplied, so the collateral coverage view is limited to the pledge and joinder rules in the loan agreement; excluded assets, real-property collateral and perfection gaps could weaken the secured recovery conclusion.
- The 2028 to 2032 secured note indentures and the 2029 subordinated note indentures were not supplied, so the note-level amendment and lien conclusions are confirmed only for the 2033 secured notes and the 2027 subordinated notes.
- The loan agreement was read by targeted section; any most-favoured-nation pricing protection, the full permitted-investments list and any builder basket in the loan agreement were not reviewed, so the leakage total in this assessment may understate available capacity.

### Analytical narrative

The controlling package is the second amended and restated credit agreement as amended through the September 2024 amendment, the 2033 secured notes indenture and the 2027 subordinated notes indenture, all executed. The issuer's own summary of the financial covenant conflicts with the agreement: one passage describes a secured-debt ratio, while the agreement and the issuer's covenant section describe total net leverage; the executed agreement governs.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 70

The causal downside runs through permissions, not tripwires. If aftermarket demand weakens while management pursues another distribution or acquisition, the first legal break is not a covenant breach, because term loans and notes have no maintenance test; it is a further incurrence of pari secured or unsecured debt within the 5.00x and 7.25x tests, priced off covenant EBITDA that includes projected savings. The financial consequence is higher secured leverage ahead of the 2027 to 2029 maturity cluster, and the observable triggers are revolver usage approaching USD 364 million, new incremental joinders, and secured net leverage moving towards 5.00x.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, page 146; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation L10

Overall, TransDigm presents an aggressive covenant package, scored provisionally at four on the five-point scale. The main creditor protections are the each-lender and two-thirds noteholder consent for collateral release, the each-holder ranking protection for the 2033 notes, the capped unrestricted-subsidiary investments and the maturity and obligor conditions on pari secured debt. The main weaknesses are uncapped ratio-based dividends, a revolver-only springing covenant, uncapped projected savings in the financial-covenant earnings measure and the absence of an explicit anti-subordination right in the loan agreement. The primary default-risk path is releveraging through permitted distributions; the primary recovery path is pari secured dilution and non-guarantor value sitting outside the guarantee net.
Basis: d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 117–118

### Capital structure

The legal ranking shows a large pari first-lien block sharing one collateral pool, with subordinated notes behind it and receivables funding outside it.

| Instrument | Rank and security | Principal | Maturity | Governing document in source set | Source |
|---|---|---|---|---|---|
| Revolving credit facility, USD 910 million commitment, USD 67 million letters of credit | First-lien senior secured, pari with term loans and secured notes | USD 0 million drawn; undrawn USD 843 million | 2029-02-27 | Credit agreement as amended through Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K and L | First-lien senior secured | USD 8,702 million | 2028-08-24 to 2032-01-19 | Credit agreement as amended through Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2028 to 2033 secured notes, six series | First-lien senior secured, pari with credit facilities under First Lien Intercreditor Agreement | USD 11,000 million | 2028-08-15 to 2033-01-15 | Only the 2033 indenture supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60; d887611dex41.htm.jsonl, page 30 |
| 2027 senior subordinated notes | Unsecured, contractually subordinated to senior debt | USD 2,650 million | 2027-11-15 | 2027 subordinated indenture supplied | d826058dex41.htm.jsonl, page 106; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| January 2029 and May 2029 senior subordinated notes | Unsecured, contractually subordinated to senior debt | USD 1,950 million | 2029-01-15 and 2029-05-01 | Indentures not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| Receivables securitization facility | Non-recourse borrowing by securitization entity on receivables; outside guarantor and collateral group | USD 487.5 million drawn of USD 650 million | 2025-07-11 | Facility agreement not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, page 60 |

### Covenant tests and headroom

Every settled test passes on the proxy, but the tightest gate is the 5.00x secured incurrence test, not the dormant maintenance covenant.

| Test | Threshold | Proxy current | Headroom | Status | Creditor consequence |
|---|---|---|---|---|---|
| Revolver usage trigger for maintenance test | 40.00% | 7.36% | 32.64% | Compliant, test not triggered | Maintenance test dormant |
| Maintenance net leverage, pro forma October 2024 dividend | 7.50x | 5.50x | 2.00x | Compliant on proxy | Revolver protection only |
| Ratio dividend test, credit agreement | 6.75x | 5.50x | 1.25x | Compliant on proxy | About USD 5,200.75 million of further distributions |
| Pari secured incurrence test, credit agreement | 5.00x | 4.22x | 0.78x | Compliant on proxy | About USD 3,244.00 million of pari secured debt |
| Junior or unsecured incurrence test, credit agreement | 7.25x | 5.50x | 1.75x | Compliant on proxy | About USD 7,287.25 million of junior or unsecured debt |
| Secured ratio-debt lien test, 2033 notes | 5.25x | 4.22x | 1.03x | Compliant on proxy | Not binding while loan test is tighter |
| Ratio debt and ratio dividend cover, 2033 notes | 2.00x | 3.24x | 1.24x | Compliant on proxy | Wide cushion; not pro forma for September debt |
| Maintenance net leverage, year-end proxy | 7.50x | 4.46x | 3.04x | Compliant on proxy | Year-end cash before dividend flatters ratio |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for maintenance test | 40.00 | 7.36 | 32.64% | Passes at or below threshold; test springs only above it | % of revolving commitments | USD 67 million letters of credit over USD 910 million commitments; letters of credit cash-collateralised at 103% would be excluded, collateralisation not stated |
| Maintenance net leverage, pro forma October 2024 dividend | 7.50 | 5.50 | 2.00x | Passes at or below threshold | x | Proxy: carrying net debt pro forma for dividend over EBITDA As Defined; not certified covenant ratio; 8.00x applies after a material acquisition |
| Maintenance net leverage, year-end proxy | 7.50 | 4.46 | 3.04x | Passes at or below threshold | x | Proxy at 2024-09-30 before dividend payment; test not triggered at that date |
| Ratio dividend test, credit agreement | 6.75 | 5.50 | 1.25x | Passes at or below threshold | x | Proxy pro forma for October 2024 dividend; no default also required |
| Junior or unsecured incurrence test, credit agreement | 7.25 | 5.50 | 1.75x | Passes at or below threshold | x | Proxy pro forma for October 2024 dividend |
| Pari secured incurrence test, credit agreement | 5.00 | 4.22 | 0.78x | Passes at or below threshold | x | Proxy: identified secured carrying debt less cash after dividend; securitization and leases excluded from secured debt |
| Secured ratio-debt lien test, 2033 notes | 5.25 | 4.22 | 1.03x | Passes at or below threshold | x | Same proxy numerator; indenture earnings definition caps savings at 35% |
| Ratio debt and ratio dividend cover, 2033 notes | 2.00 | 3.24 | 1.24x | Passes strictly above threshold | x | Proxy: EBITDA As Defined over FY2024 net interest expense; not pro forma for full-year interest on September 2024 debt |

All current values are analyst proxies from consolidated reported figures, not covenant calculations or a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement dated among borrower, holdings, guarantors, credit agreement collateral agent and secured notes trustees | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Allocates enforcement and lien sharing among first-lien classes; agreement itself not supplied |
| 2019-11-13 | day | 2024-09-19 | Offering of the 2027 senior subordinated notes | Historical — offering of the 2027 5.50% Notes on November 13, 2019 | d887611dex41.htm.jsonl, page 3 | Starts the subordination, blockage and turnover regime for that series |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15, latest amendment changing restrictive covenants | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Fixes the current covenant text before the September incremental |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17 and USD 1,500 million Tranche L incremental term loans | Historical — Amendment No. 17 and Incremental Term Loan Assumption Agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Used incremental capacity subject to 7.25x and 5.00x pro forma tests to fund the dividend |
| 2024-09-19 | day | 2024-09-19 | Joinder No. 6 adds the 2033 secured notes to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million to the pari first-lien class sharing collateral |
| 2027-09-15 | day | 2024-09-19 | First optional redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Before it, refinancing the notes needs a make-whole |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity; financial covenant ends with revolving commitments | Scheduled — maturity date of the revolving credit facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance test lapses unless the revolver is extended |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 6 |
| Calculated | 3 |
| Assumption-Based | 0 |
| Analyst Inference | 3 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 1 |
| Fields present | 32 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 4 |
| MINOR | 3 |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all outstanding capital stock | Ownership | TransDigm Inc. | Annual report parent-borrower description; both Delaware corporations per Business & governance; US law |
| TransDigm Group Incorporated | Guarantees as Holdings on senior secured basis | Guarantee | 2033 secured notes | 2033 secured notes indenture, guarantees article; New York law |
| TransDigm Group Incorporated | Guarantees as Holdings under credit agreement | Guarantee | Credit facilities | Credit agreement events of default on Holdings guarantee; governing law clause not located in reviewed pages; Delaware entity |
| TransDigm UK | Guarantees on senior secured basis | Guarantee | 2028 secured notes | Annual report guarantor description; UK debenture collateral defined in 2033 indenture; New York-law indenture |
| Domestic Restricted Subsidiaries | Guarantee on senior secured basis; must join within 20 business days if not excluded | Guarantee | Credit facilities | Credit agreement further-assurances covenant; US entities |
| Domestic Restricted Subsidiaries | Guarantee if borrower or guarantor under credit facilities or USD 200 million capital-markets debt | Guarantee | 2033 secured notes | Annual report guarantor description and 2033 indenture; New York law |
| Domestic Restricted Subsidiaries | Guarantee on senior subordinated unsecured basis | Guarantee | 2027 subordinated notes | Annual report guarantor description and 2027 indenture; New York law |
| Loan Parties | Pledge 100% of domestic subsidiary equity and 65% of voting first-tier foreign subsidiary equity | Security | Credit agreement collateral agent | Credit agreement further-assurances covenant; guarantee and collateral agreement not supplied |
| Foreign non-guarantor subsidiaries | Liabilities rank ahead of notes against their assets | Structural claim | Secured and subordinated notes | Annual report states notes structurally subordinated to non-guarantor liabilities; multiple jurisdictions not stated |
| Securitization Entity | Holds receivables financing non-recourse to group | Structural claim | Domestic receivables | Credit agreement securitization debt basket and annual report facility description; facility agreement not supplied |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facilities | Rank equally in right of payment | Payment rank | 2033 secured notes | Annual report ranking description and 2033 indenture; New York law |
| Senior Debt including credit facilities and secured notes | Paid in full in cash before subordinated holders in insolvency | Payment rank | 2027 subordinated notes | 2027 indenture subordination article; New York law |
| Credit facilities | Share first-priority liens on the same collateral | Security rank | 2033 secured notes | 2033 indenture defines First Lien Intercreditor Agreement and Joinder No. 6; agreement not supplied |
| Applicable Collateral Agent under First Lien Intercreditor Agreement | Acts on collateral; holders may not enforce security directly | Enforcement control | 2033 secured noteholders | 2033 indenture collateral article; identity of applicable agent not established without the agreement |
| Required Revolving Lenders | Alone may amend, waive or enforce the financial covenant | Enforcement control | Term lenders | Credit agreement financial covenant and events of default; term default only after revolver acceleration |
| Designated Senior Debt representative | May block payment for up to 179 days in any 360 days | Standstill | 2027 subordinated notes | 2027 indenture payment blockage provision; New York law |
| Required Lenders | May approve release of specific collateral; each lender needed for substantially all | Release | Credit facility collateral | Credit agreement waivers and amendments section |
| Holders of two-thirds of 2033 notes | Consent needed to release substantially all collateral or adversely amend intercreditor terms | Release | 2033 secured notes collateral | 2033 indenture amendment section; New York law |

### Analytical appendix — complete canonical registers

All monetary amounts in registers are USD millions unless stated. Proxy figures are analyst calculations, not covenant calculations.

#### Evidence index

| Evidence ID | Provision or fact | Source |
|---|---|---|
| E01 | Financial covenant: 7.50x net leverage, 8.00x after material acquisition, springing above 40% revolving usage; Required Revolving Lenders amend | d887611dex101.htm.jsonl, page 188 |
| E02 | Events of default incl. financial-covenant default limited to revolving lenders; cross-default; judgments above USD 50 million; change of control | d887611dex101.htm.jsonl, pages 188–191 |
| E03 | Financial Covenant Consolidated EBITDA with uncapped projected cost savings within 24 months | d887611dex101.htm.jsonl, pages 41–42 |
| E04 | Consolidated EBITDA for incurrence with 25% cost-savings cap | d887611dex101.htm.jsonl, pages 23–24 |
| E05 | Consolidated Net Leverage Ratio, Consolidated Secured Debt, Consolidated Secured Net Debt Ratio, Unrestricted Cash | d887611dex101.htm.jsonl, pages 26–27; d887611dex101.htm.jsonl, page 81 |
| E06 | Permitted Indebtedness clauses 11 to 18 | d887611dex101.htm.jsonl, pages 58–60 |
| E07 | Incremental facility conditions 7.25x and 5.00x; Amendment No. 17 conditions and Tranche L | d887611dex101.htm.jsonl, page 146; d887611dex101.htm.jsonl, pages 1–4 |
| E08 | Restricted payments incl. general basket and ratio dividend permission at 6.75x | d887611dex101.htm.jsonl, pages 177–181 |
| E09 | Unrestricted subsidiary investment cap and designation conditions | d887611dex101.htm.jsonl, page 61; d887611dex101.htm.jsonl, page 81 |
| E10 | Waivers and amendments, unanimous list, non-pro-rata offers, pari lien accommodation | d887611dex101.htm.jsonl, pages 204–206 |
| E11 | Automatic collateral release triggers | d887611dex101.htm.jsonl, pages 206–207 |
| E12 | Guarantor joinder, Excluded Subsidiaries, equity pledge limits | d887611dex101.htm.jsonl, pages 173–174 |
| E13 | Required Lenders and Required Class Lenders above 50% | d887611dex101.htm.jsonl, page 71 |
| E14 | 2033 indenture ratio debt above 2.00x cover; non-guarantor ratio debt cap USD 400 million; credit facilities basket USD 3,100 million | d887611dex41.htm.jsonl, page 79; d887611dex41.htm.jsonl, pages 33–35 |
| E15 | 2033 indenture permitted liens incl. Bank Indebtedness and secured ratio debt at 5.25x; liens covenant | d887611dex41.htm.jsonl, pages 39–43; d887611dex41.htm.jsonl, page 87 |
| E16 | 2033 indenture restricted payments, ratio dividend at 2.00x cover, investments incl. 25% of Total Assets | d887611dex41.htm.jsonl, page 38; d887611dex41.htm.jsonl, pages 71–76 |
| E17 | 2033 indenture amendments: majority, each holder, two-thirds | d887611dex41.htm.jsonl, pages 117–118 |
| E18 | 2033 indenture guarantor release triggers | d887611dex41.htm.jsonl, page 122 |
| E19 | 2033 indenture intercreditor definition, intercreditor-controls clause, collateral agent, New York law | d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, pages 126–129 |
| E20 | 2027 subordinated indenture subordination, blockage, turnover, New York law | d826058dex41.htm.jsonl, pages 106–108; d826058dex41.htm.jsonl, page 124 |
| E21 | Issuer guarantor description and combined issuer-guarantor summary | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| E22 | Issuer covenant description, USD 364 million trigger, compliance statement; conflicting description of covenant numerator | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 70 |
| E23 | 2033 indenture Consolidated EBITDA with 35% cost-savings cap | d887611dex41.htm.jsonl, page 16 |
| E24 | Carrying debt, cash, EBITDA As Defined, October 2024 pro forma | Financial foundation (CP-1) |

#### T4.1 Source gate and module status

| Source | Status | Authority Rank | Limitation | Module status effect |
|---|---|---|---|---|
| Credit agreement as amended through Amendment No. 17 | Executed, conformed annex | 1 | Schedules, exhibits and guarantee and collateral agreement not supplied; targeted reading | Gate passed |
| 2033 secured notes indenture | Executed | 1 | Other secured-note indentures not supplied | Gate passed |
| 2027 subordinated notes indenture | Executed | 1 | 2029 subordinated indentures not supplied | Gate passed |
| First Lien Intercreditor Agreement | Not supplied | 2 | Referenced only | Limits enforcement-control findings |
| Compliance certificates | Not supplied | 3 | No certified ratio | Headroom proxy only |
| Annual report covenant description | Filed issuer summary | 4 | Summary; one passage conflicts with executed text | Secondary support |

Module status: Completed with Limitations.

#### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as amended through Amendment No. 17 | Credit agreement | Base 2014-06-04; annexed text 2024-09-19 | Executed conformed text | Controls loan covenants, incremental, financial covenant, amendments and release | Sets binding ratio gates on debt, liens and dividends | E01; E05; E07; E08; E10 |
| 1 | Amendment No. 17 and incremental term loan assumption agreement | Credit agreement amendment | 2024-09-19 | Executed | Adds USD 1,500 million Tranche L and certifies pro forma ratios | Demonstrates use of incremental capacity for distribution funding | E07 |
| 1 | Indenture for 2033 senior secured notes | Indenture | 2024-09-19 | Executed | Controls 2033 note covenants and consent thresholds | Second set of debt, lien and dividend tests; amendment protection for noteholders | E14; E15; E16; E17 |
| 1 | Indenture for 2027 senior subordinated notes | Indenture | 2019-11-13 | Executed | Controls subordination, blockage and turnover | Defines junior class handicaps | E20 |
| 2 | First Lien Intercreditor Agreement with Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — referenced in 2033 indenture, not in the source set | Would control first-lien enforcement and sharing | Enforcement control and standstill not established | E19 |
| 4 | Annual report covenant and guarantor description | Issuer filing summary | 2024-11-07 | Filed | Summary only; executed documents govern | Supplies USD 364 million trigger, compliance statement and guarantor financial summary | E21; E22 |

#### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x, 8.00x for four quarters after material acquisition, tested if revolving exposure exceeds 40% of commitments; revolving lenders only | Credit agreement s6.14 | Springing, lender-class-limited test gives no early warning to term lenders or notes | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | E01 |
| Financial covenant default | Default for revolving lenders only; term-loan default only after revolving termination or acceleration | Credit agreement Art. VII(l) | Term lenders cannot act on a covenant breach | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | E02 |
| Pari secured debt | Senior secured debt pari or junior permitted if secured net leverage at or below 5.00x, maturity after latest term loan, no non-loan-party obligors, collateral only | Credit agreement Permitted Indebtedness cl. 12 | Pari debt dilutes existing first-lien collateral share | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | E06 |
| Junior and unsecured debt | Permitted if net leverage at or below 7.25x | Credit agreement Permitted Indebtedness cl. 12 and 17 | Adds claims ahead of equity but behind first lien; raises default risk | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | E06 |
| Incremental facility | Incremental term or revolving commitments if net leverage at or below 7.25x and secured net leverage at or below 5.00x pro forma | Credit agreement s2.24(c) | Same gate as pari debt; used in September 2024 | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | E07 |
| Restricted payments | Any restricted payment if no default and net leverage at or below 6.75x pro forma; general basket greater of USD 75 million and 3% of EBITDA | Credit agreement s6.02 final paragraph and cl. 7 | Unlimited-amount distributions within ratio | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | E08 |
| Investments in unrestricted subsidiaries | Capped at greater of USD 250 million and 10% of EBITDA; designation requires compliance and no recourse debt | Credit agreement Permitted Investments cl. 1(c); Unrestricted Subsidiary definition | Bounded drop-down capacity in the loan agreement | Neutral — Stable | [Insufficient Information] — no comparative source supplied | E09 |
| Asset sales | Fair value; 75% cash above USD 50 million with USD 300 million designated non-cash; proceeds per prepayment section | Credit agreement s6.03 | Limited non-cash leakage; prepayment terms not read | Neutral — Stable | [Insufficient Information] — no comparative source supplied | E08 |
| Amendments | Majority for most terms; each lender for economics, sharing, voting, material guarantors, substantially all collateral; no subordination right seen | Credit agreement s9.02(b) | Majority could pursue priming amendments | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | E10; E13 |
| Collateral release | Automatic release on permitted sale, guarantor release, Required Lenders approval, remedies, mortgage and control-agreement suspension periods | Credit agreement s9.02(c) | Majority-approved partial releases possible | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | E11 |
| Guarantor coverage | Domestic subsidiaries other than immaterial, unrestricted and securitization entities must join; 65% voting foreign equity pledged | Credit agreement s5.11 | Foreign value outside guarantees | Neutral — Stable | [Insufficient Information] — no comparative source supplied | E12 |
| 2033 notes debt and liens | Ratio debt if cover above 2.00x; liens for all credit-facility obligations; secured ratio debt at or below 5.25x | 2033 indenture s4.09; Permitted Liens iii and xxxi | Bond does not cap bank-lien secured debt | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | E14; E15 |
| 2033 notes dividends and investments | Any restricted payment if cover above 2.00x; investments up to greater of USD 500 million and 25% of Total Assets | 2033 indenture s4.07; Permitted Investments xii | Bond leakage capacity much wider than loan | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | E16 |
| 2033 notes amendments | Majority generally; each affected holder for ranking; two-thirds for substantially all collateral or adverse intercreditor change | 2033 indenture s9.02 | Notes protected against uptier by consent | Neutral — Stable | [Insufficient Information] — no comparative source supplied | E17 |
| Subordinated notes | Subordinated to Senior Debt; 179-day blockage; turnover | 2027 indenture Art. 10 | Junior class realises only after senior paid | Negative — Refinancing Risk | [Insufficient Information] — no comparative source supplied | E20 |

#### Step 4 to 8 findings in standard format

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Financial Covenant Consolidated EBITDA cost savings | Credit agreement definitions; executed; rank 1 | Adds projected savings from actions within 24 months, net of realised, with no cap | Ratio denominators can be lifted by management projections | Delays any covenant trip | More debt can be raised against projected earnings | Track savings add-backs in certificates | Negative — Covenant Erosion | High | E03 |
| Debt definition versus carrying debt | Credit agreement definitions; Financial foundation | Covenant uses Consolidated Total Indebtedness less Unrestricted Cash; Financial foundation uses carrying debt USD 24,880 million | Divergence from carrying basis cannot be sized without definition text and certificate | Proxy may misstate headroom | None directly | Obtain covenant debt definition and certificate | Insufficient Information | Medium | E05; E24 |
| Pari secured and incremental debt | Credit agreement; executed; rank 1 | Pari secured permitted at or below 5.00x net of unrestricted cash | Netting cash lets cash-funded capacity grow; pari claims dilute collateral | Higher interest burden | Dilutes first-lien recovery | Watch joinders and secured net leverage | Negative — Leverage Increase | Medium | E06; E07 |
| Ratio dividends | Credit agreement and 2033 indenture; executed; rank 1 | Unlimited amount within 6.75x net leverage and 2.00x cover | Debt-funded distributions without dollar cap | Raises leverage and refinancing need | Lowers asset cover for all classes | Watch declarations and pro forma leverage | Negative — Leverage Increase | High | E08; E16 |
| Unrestricted subsidiary and investments | Credit agreement and 2033 indenture | Loan cap greater of USD 250 million and 10% of EBITDA; bond allows general investments up to 25% of Total Assets | Loan agreement is the binding limit on drop-downs | Limited | Bounded leakage while loans outstanding | Watch designations | Neutral — Stable | Medium | E09; E16 |
| Guarantees and collateral | Credit agreement s5.11; annual report | Domestic restricted subsidiaries guarantee; foreign subsidiaries do not; 65% voting foreign equity pledged | Non-guarantor value outside direct claims | None | Structural subordination for all notes and loans | Track guarantor share of sales | Negative — Covenant Erosion | Medium | E12; E21 |
| Events of default and amendments | Credit agreement Art. VII and s9.02 | Majority amendments; no explicit anti-subordination right in list read; financial-covenant default revolver-only | Weak lender control under stress | Lower trip risk, later intervention | Priming risk for non-consenting lenders | Monitor amendment filings | Negative — Covenant Erosion | Medium | E02; E10 |

#### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio dividends | Unlimited distributions at or below 6.75x and above 2.00x cover | Releveraging through equity payouts | Raises default risk through higher leverage and refinancing need | Reduces value available per creditor | Pro forma leverage at each declaration | E08; E16 |
| Pari secured capacity | 5.00x secured net leverage gate | New pari claims on same collateral | Modest, via interest burden | Direct dilution of first-lien recovery | Incremental joinders and new secured series | E06; E07 |
| Springing covenant | Revolver-only test above 40% usage | No early acceleration right for term or notes | Defers default to payment failure | Later default usually means lower value at default | Revolver usage versus USD 364 million | E01; E02 |
| Uncapped cost savings | Financial-covenant EBITDA uncapped; incurrence 25%; notes 35% | Inflated denominators expand all ratio capacity | Delays trip | More debt ahead of or alongside each class | Add-back share in certificates | E03; E04; E23 |
| Majority amendments | No explicit subordination sacred right in loan list read | Majority could subordinate dissenters | Could extend runway via new money | Severe for excluded lenders | Amendment filings and lender groupings | E10; E13 |
| Subordination and blockage | 179-day blockage; turnover | Junior payments stop when senior default noticed | Accelerates junior default | Junior recovers only after senior paid | Blockage notices | E20 |
| Non-guarantor value | About 20.73% of sales outside guarantor group | Non-guarantor creditors paid first from that value | None | Structural subordination for all group debt | Guarantor share of sales | E21 |

#### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All topics | Provisions in the covenant feature register | [Insufficient Information] — no covenant-review report or market-norm source supplied | Not assessed: market-norm comparison is limited because no supported comparative source was provided | Not assessed: no third-party view to compare | Insufficient Information | E01; E08; E10 |

#### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x test at 40% usage; term and notes covenant-lite | No early intervention for term lenders or noteholders | Negative — Covenant Erosion | Provisional | E01; E02 |
| Debt / lien incurrence capacity | 4 | Pari secured at 5.00x net of cash; junior and unsecured at 7.25x; grower baskets; bond permits uncapped bank liens | Large ratio-based secured capacity | Negative — Leverage Increase | Provisional | E06; E07; E15 |
| RP / investment / leakage capacity | 4 | Unlimited dividends within 6.75x; used for USD 4,348 million; bond investment basket 25% of Total Assets; loan unrestricted-subsidiary cap bounded | Distributions transfer value to equity | Negative — Leverage Increase | Provisional | E08; E09; E16 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped projected savings in financial-covenant EBITDA; 25% and 35% caps elsewhere; broad add-backs | Inflates every ratio | Negative — Covenant Erosion | Provisional | E03; E04; E23 |
| Collateral / guarantor protection | 3 | Domestic guarantors; 65% foreign voting equity; each-lender release of substantially all collateral; release on unrestricted designation | Foreign value and excluded subsidiaries outside net | Neutral — Stable | Provisional | E11; E12; E18 |
| Amendment / control mechanics | 4 | Majority loan amendments without explicit subordination right; notes protected by each-holder ranking and two-thirds consent | Loan class exposed to majority-led priming | Negative — Covenant Erosion | Provisional | E10; E13; E17 |
| Overall | 4 | Weighted to ratio dividends, pari secured capacity and loan amendment mechanics | Releveraging and dilution without covenant trip | Negative — Leverage Increase | Provisional | E01; E08; E10 |

Covenant Aggressiveness Score: 4/5. Score rationale: six areas are scorable from executed text; the overall is weighted to the most creditor-adverse areas, not averaged. Status: Provisional, because the intercreditor agreement, security documents and certificates are missing.

#### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| New special dividend | Ratio dividend permission at 6.75x | Repeats September 2024 extraction | PD up; LGD up; RV weaker for all classes | Track board declarations and pro forma leverage | E08 |
| New pari secured debt | 5.00x secured net leverage gate | Dilutes first-lien collateral | LGD up for first lien; RV weaker | Track incremental joinders and intercreditor joinders | E06; E07 |
| Revolver usage above USD 364 million | Springing trigger | Activates the only maintenance test | PD signal | Track quarterly usage and letters of credit | E01; E22 |
| Majority amendment touching priority or sharing | Loan amendment section | Possible uptier of consenting lenders | LGD up for non-consenting lenders | Track 8-K amendment filings | E10 |
| Unrestricted subsidiary designation | Designation definition; notes guarantor release | Releases guarantees and moves value | LGD up | Track board designations | E09; E18 |
| Large savings add-backs | Financial-covenant EBITDA | Inflates capacity | PD masked | Request certificates with add-back detail | E03 |

#### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| G1 | First Lien Intercreditor Agreement and Joinders 1 to 6 | Controls enforcement, standstill, turnover and sharing | Intercreditor registers carry insufficient-information cells | Obtain executed agreement and joinders |
| G2 | Compliance certificates and covenant calculations | Certified ratios and add-backs | Headroom is proxy only | Obtain latest certificate |
| G3 | Guarantee and collateral agreement, guarantor schedule, subsidiary list | Excluded assets and perfection | Collateral map partial | Obtain security documents and guarantor exhibit |
| G4 | 2028 to 2032 secured and 2029 subordinated indentures | Series-specific terms | Note conclusions confirmed for 2033 and 2027 series only | Obtain indentures |
| G5 | Loan agreement MFN, full permitted investments, builder basket and governing law clause | Leakage and pricing protection | Leakage total may be understated | Targeted read of remaining sections |
| G6 | Basket usage history | Remaining fixed-basket capacity | Basket remaining capacity not established | Obtain usage tracker |
| G7 | Market-norm or covenant-review source | Relative assessment | Market-norm comparison skipped | Obtain third-party review if required |

#### T4D.1 Structural source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement guarantor and collateral covenants | Executed | 1 | Schedules and security agreement not supplied | Completed with Limitations |
| 2033 secured notes indenture guarantee and collateral articles | Executed | 1 | Security documents and intercreditor agreement referenced only | Completed with Limitations |
| Annual report guarantor description and combined summary | Filed | 4 | Accounting summary, not a legal perimeter; subsidiary list not supplied | Completed with Limitations |
| Subsequent perimeter events | Searched issuer sources | 4 | No guarantee release, designation or collateral release after 2024-09-30 identified in the reviewed text | Completed with Limitations |

#### T4D.2 Legal entity perimeter register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of loans and notes | Delaware | Listed public company | Holdings, not a restricted subsidiary | No significant operations or assets apart from its investment in TransDigm Inc. | Yes, as guarantor | E21; E19 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Company | Combined with guarantors: current assets 7,813; goodwill 8,186; sales 6,294 | Yes | E21 |
| TransDigm UK | Guarantor of secured and subordinated notes | [Insufficient Information] — jurisdiction not stated in reviewed text | [Insufficient Information] — parent not stated in reviewed text | Restricted; guarantor | Included in combined guarantor summary; separate value not disclosed | Yes | E21 |
| Domestic Restricted Subsidiaries | Guarantors | United States | TransDigm Inc. | Restricted; can be designated unrestricted within investment caps | Included in combined guarantor summary | Yes | E12; E21 |
| Foreign Restricted Subsidiaries other than TransDigm UK | Non-guarantors | Various, not stated | TransDigm Inc. or subsidiaries | Restricted | About 1,646 of external sales, an approximation; guarantors owed net 1,881 by non-guarantors | No, except 65% voting equity pledge | E12; E21 |
| Securitization Entity | Receivables financing vehicle | [Insufficient Information] — not stated | [Insufficient Information] — not stated | Excluded Subsidiary | Receivables backing 487.5 drawn | No | E06; E12 |
| Unrestricted Subsidiaries | None identified | Not applicable: none identified | Not applicable: none identified | Unrestricted | Not disclosed | No | E09 |
| Immaterial Domestic Subsidiaries | Excluded from joinder | United States | Group | Excluded Subsidiary | Not disclosed | No | E12 |

#### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × credit facilities | Senior secured | Upstream from parent to subsidiary borrower debt, downstream in corporate terms | Termination of agreement or release per guarantee and collateral agreement | E02; E10 |
| Holdings × 2033 secured notes | Senior secured | Downstream | Defeasance or discharge | E18 |
| Domestic Restricted Subsidiaries × credit facilities | Senior secured | Upstream | Sale to non-loan party, designation, immaterial status; material guarantor release needs each lender otherwise | E10; E11; E12 |
| Domestic Restricted Subsidiaries × 2033 secured notes | Senior secured | Upstream | Sale, unrestricted designation, immaterial status, release from credit facilities and capital-markets debt, defeasance | E18 |
| Domestic Restricted Subsidiaries × 2027 subordinated notes | Senior subordinated unsecured | Upstream | [Insufficient Information] — release clause of 2027 indenture not read | E21 |
| TransDigm UK × 2028 to 2033 secured notes | Senior secured | Cross-stream | [Insufficient Information] — UK guarantee limitations not supplied | E21 |
| TransDigm UK × 2027 subordinated notes | Senior subordinated unsecured | Cross-stream | [Insufficient Information] — release clause not read | E21 |
| Foreign non-guarantors × all tranches | None | Not applicable: no guarantee | Not applicable: no guarantee | E12; E21 |

#### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Holdings × first lien | Equity of unrestricted subsidiaries; equity requiring separate SEC financial statements | Required Lenders approval; each lender for substantially all; two-thirds of 2033 notes | [Insufficient Information] — security agreement not supplied | E11; E12; E17 |
| Holdings × junior lien | No junior-lien debt identified | Not applicable: no junior lien outstanding | Not applicable: no junior lien outstanding | E06 |
| TransDigm Inc. × first lien | Same equity exclusions; 65% cap on voting foreign equity | Automatic on permitted sale to non-loan party | Mortgage and control-agreement suspension periods allow release | E11; E12 |
| TransDigm Inc. × junior lien | No junior-lien debt identified | Not applicable: no junior lien outstanding | Not applicable: no junior lien outstanding | E06 |
| Domestic guarantors × first lien | Excluded Collateral as defined in security agreement | Released with guarantor release | [Insufficient Information] — security agreement not supplied | E11; E18 |
| Domestic guarantors × junior lien | No junior-lien debt identified | Not applicable: no junior lien outstanding | Not applicable: no junior lien outstanding | E06 |
| TransDigm UK × first lien | Debenture collateral; excluded assets not stated | Foreign security documents amendable by agent for local law | [Insufficient Information] — UK debenture not supplied | E10; E19 |
| TransDigm UK × junior lien | No junior-lien debt identified | Not applicable: no junior lien outstanding | Not applicable: no junior lien outstanding | E06 |
| Foreign non-guarantors × first lien | All assets; only 65% voting first-tier equity pledged | Not applicable: no asset lien | Local-law limits not supplied | E12 |
| Securitization Entity × first lien | Receivables sold to entity, outside collateral | Not applicable: outside collateral | Not applicable: outside collateral | E06 |

#### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc. with Holdings and domestic guarantors | First-lien collateral of loan parties plus 65% voting foreign equity | Pari | Foreign non-guarantor assets, about 1,646 of sales, reachable only through equity after local creditors | Senior access to guarantor value, shared pro rata with notes | Medium | E12; E21 |
| 2028 to 2033 secured notes | TransDigm Inc. with Holdings, TransDigm UK and qualifying restricted subsidiaries | Same first-lien collateral under intercreditor agreement | Pari | Same foreign non-guarantor value | Equal payment rank; enforcement control not established | Medium | E19; E21 |
| Subordinated notes | TransDigm Inc. with subordinated guarantees | Residual guarantor value after all Senior Debt | Contractually Subordinated | Foreign non-guarantor value and all collateral value ahead | Recovery only after first-lien claims paid | High | E20; E21 |
| Securitization facility | Securitization Entity | Sold domestic receivables | Structurally Senior | Receivables removed from collateral | Senior to group creditors on receivables | Medium | E06 |
| Foreign subsidiary creditors | Foreign Restricted Subsidiaries | Foreign assets | Structurally Senior | Foreign value ahead of all group debt | Group debt sits behind them on foreign assets | Medium | E21 |

#### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividend to equity | TransDigm Inc. to Holdings to shareholders | Credit agreement ratio dividend at 6.75x; 2033 indenture cover above 2.00x | Proxy room 5,200.75 after October 2024 dividend | 4 | Cash leaves all creditor reach | Demonstrated: 4,348 paid October 2024 | E08; E16 |
| Investment in unrestricted subsidiary | Restricted group to unrestricted subsidiary | Loan cap greater of 250 and 10% of EBITDA; bond greater of 250 and 12% of EBITDA | Proxy 417.30 under loan; 500.76 under bond | 2 | Assets leave guarantee and collateral net | Theoretical | E09; E16 |
| General investments under bond | Company to any person | 2033 indenture general basket greater of 500 and 25% of Total Assets | Proxy 6,396.50, constrained while loans outstanding | 3 | Bond alone would allow large drop-down | Theoretical | E16 |
| Transfer to non-guarantor restricted subsidiary | Guarantors to foreign restricted subsidiaries | Loan Permitted Investments in restricted subsidiaries, uncapped clause 1(a) | [Insufficient Information] — no usage or transfer data | 3 | Value moves behind foreign creditors | Theoretical | E09 |
| Asset sale out of group | Group to third party | Loan asset-sale covenant; 75% cash, 300 non-cash cap | Not disclosed | 2 | Proceeds applied per prepayment section, not read | Theoretical | E08 |

#### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by majority loan amendment | Loan amendment list lacks explicit payment or lien subordination right in text read | Non-consenting term and revolving lenders | Theoretical | Majority could create senior class ahead of dissenters | Medium | E10; E13 |
| Non-pro-rata repurchase | Required Lenders may allow non-pro-rata prepayment via offers to all lenders of a class | Term lenders | Theoretical | Open offer limits selectivity | Medium | E10 |
| Drop-down to unrestricted subsidiary | Loan cap greater of 250 and 10% of EBITDA; bond 25% of Total Assets | All classes | Theoretical | Bounded by loan cap while loans outstanding | Medium | E09; E16 |
| Pari dilution | 5.00x secured gate; bond bank-lien permission | Existing first-lien lenders and noteholders | Demonstrated: Tranche L and 2033 notes added September 2024 | Dilution, not priming | High | E06; E07; E15 |
| Uptier of 2033 notes | Each affected holder for adverse ranking change; two-thirds for collateral or intercreditor change | 2033 secured noteholders | Theoretical | Notes better protected than loans | High | E17 |

#### T4D.8 Structural gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| S1 | Guarantor exhibit and subsidiary list | Names guarantors and jurisdictions | Entity register uses classes, not named entities | Obtain guarantor exhibit and subsidiary list |
| S2 | Guarantee and collateral agreement, UK debenture | Excluded assets and perfection | Collateral matrix partial | Obtain security documents |
| S3 | Entity-level debt, assets and EBITDA for non-guarantors | Quantifies structural subordination | Only sales approximation | Obtain non-guarantor financial detail |
| S4 | Release clauses of subordinated indentures | Release triggers | Subordinated guarantee release not established | Obtain and read indentures |
| S5 | Transfer and usage history | Demonstrated leakage | Routes marked theoretical | Obtain investment and designation history |

#### T4F.1 Controlling intercreditor documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders 1 to 6 | TransDigm Inc., Holdings, subsidiary guarantors, credit agreement collateral agent, secured notes trustees and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — intercreditor agreement not in the source set | Referenced, not supplied | d887611dex41.htm.jsonl, page 30 | E19 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, guarantors, The Bank of New York Mellon Trust Company, N.A. as trustee, notes collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, pages 123–129 | E17; E19 |
| Credit agreement as amended | TransDigm Inc., Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | Base 2014-06-04; amended 2024-09-19 | [Insufficient Information] — governing law clause not located in reviewed pages | Executed | d887611dex101.htm.jsonl, pages 1–9 | E07 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, trustee | 2019-11-13 | New York | Executed | d826058dex41.htm.jsonl, page 124 | E20 |

#### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Shared first-lien collateral | Sole right on financial covenant default | Required Revolving Lenders for financial covenant; part of Required Lenders above 50% | E01; E02; E13 |
| Term lenders | First lien, pari | Shared first-lien collateral | Acceleration by Required Lenders; covenant default only after revolver acts | Required Lenders above 50% across loans and commitments | E02; E13 |
| 2033 secured noteholders | First lien, pari | Shared collateral via notes collateral agents | Cannot enforce security directly; acts through collateral agent subject to intercreditor agreement | Majority generally; two-thirds for collateral or intercreditor change | E17; E19 |
| Other secured noteholders | First lien, pari | Shared collateral | [Insufficient Information] — indentures not supplied | [Insufficient Information] — indentures not supplied | E19 |
| Subordinated noteholders | Contractually subordinated | None | Remedies preserved subject to turnover and blockage | [Insufficient Information] — 2027 amendment thresholds not read | E20 |

#### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement under intercreditor agreement | [Insufficient Information] — intercreditor agreement not in the source set | [Insufficient Information] — intercreditor agreement not in the source set | Applicable Collateral Agent as defined in intercreditor agreement; identity not established | Term lenders and secured noteholders | The class controlling the applicable agent sets timing of collateral sales | Insufficient Information | E19 |
| Financial covenant default | No standstill; term default only after revolver termination or acceleration | Breach of 7.50x when usage above 40% | Required Revolving Lenders | Term lenders and noteholders | Revolving lenders decide whether a covenant breach becomes a group default | Negative — Covenant Erosion | E01; E02 |
| Subordinated payment blockage | 179 days, once per 360 days, at least 181 days unblocked | Non-payment default on Designated Senior Debt with blockage notice | Representative of Designated Senior Debt | Subordinated noteholders | Junior interest stops while senior negotiates | Negative — Refinancing Risk | E20 |
| Secured note direct enforcement bar | Not applicable: bar is permanent, not time-limited | Any default | Notes collateral agents subject to intercreditor agreement | 2033 secured noteholders | Holders depend on agent and intercreditor terms | Insufficient Information | E19 |

#### T4F.4 Turnover, release and purchase options

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes | Holders hold in trust and pay over distributions received in breach | [Insufficient Information] — 2027 release clause not read | [Insufficient Information] — no purchase option identified | Senior Debt not paid in full | Subordinated holders retain subrogation after senior paid | E20 |
| Credit facility collateral | [Insufficient Information] — intercreditor agreement not in the source set | Required Lenders for specific releases; each lender for substantially all; automatic on permitted sales | [Insufficient Information] — intercreditor agreement not in the source set | Compliance with agreement | Each-lender protection for substantially all collateral | E10; E11 |
| 2033 notes collateral | [Insufficient Information] — intercreditor agreement not in the source set | Two-thirds of holders for substantially all collateral or adverse intercreditor change; otherwise per security documents | [Insufficient Information] — intercreditor agreement not in the source set | Release in accordance with indenture and security documents | Releases tracking credit facilities may occur without note vote | E17; E18 |

#### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Shared collateral proceeds pari with notes | No covenant default right; majority amendment exposure | High | Late intervention and possible majority-led priming | Negative — Covenant Erosion | E02; E10 |
| Revolving lenders | Shared collateral; covenant control | Covenant only above 40% usage | Moderate | Early warning only if drawn | Neutral — Stable | E01 |
| 2033 secured noteholders | Shared collateral via agent | Enforcement depends on intercreditor agreement not supplied | Insufficient Information | Control allocation unknown | Insufficient Information | E19 |
| Subordinated noteholders | Residual after senior; turnover | Blockage and turnover | High | Payment stops and recoveries pass to senior | Negative — Refinancing Risk | E20 |

#### T4F.6 Intercreditor gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| I1 | First Lien Intercreditor Agreement and joinders | Defines applicable collateral agent, control switch, standstill and sharing | Enforcement-control and turnover cells not established | Obtain executed agreement |
| I2 | Amendment thresholds of 2027 and 2029 subordinated indentures | Junior class voting | Subordinated voting weight not established | Obtain and read indentures |
| I3 | Other secured indentures | Series consistency | Only 2033 series confirmed | Obtain indentures |

#### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended through Amendment No. 17 | Executed credit agreement | 2024-09-19 | Executed | Legal formula | Binding debt, lien and dividend ratios | E01; E06; E08 |
| 1 | 2033 secured notes indenture | Executed indenture | 2024-09-19 | Executed | Legal formula | Bond ratios and baskets | E14; E15; E16 |
| 3 | Compliance certificate | Covenant schedule | [Insufficient Information] — not supplied | Not supplied | Usage and tested ratio | Would replace proxy | E22 |
| 4 | Financial foundation | Consolidated financial analysis | FY2024 | Accepted | Financial input | Debt, cash, EBITDA As Defined and pro forma dividend | E24 |
| 4 | Annual report | Filed issuer summary | 2024-11-07 | Filed | Financial input and usage | Revolver usage, trigger amount, compliance statement | E22 |

#### T4C.3 Definition and ratio mechanics register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA, or for the covenant Financial Covenant Consolidated EBITDA, last four quarters, pro forma for acquisitions and sales | Covenant debt, unrestricted cash, covenant EBITDA | Drives 6.75x, 7.25x and 7.50x tests | Cash netting means cash-funded or pre-funded transactions look lower-levered | Negative — Leverage Increase | E05 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA | Secured debt, unrestricted cash, EBITDA | Drives 5.00x pari secured gate | Secured capacity grows with EBITDA add-backs | Negative — Leverage Increase | E05 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Net income plus taxes, interest, non-cash charges, unusual items, transaction costs, incentive costs, dividend equivalents and uncapped projected savings within 24 months | Certificate add-back detail | Expands maintenance headroom | Projections lift the denominator | Negative — Covenant Erosion | E03 |
| Consolidated EBITDA for incurrence | Credit agreement definitions | Similar add-backs; projected savings capped at 25% | Certificate add-back detail | Expands incurrence capacity | Add-back inflation of up to 25% | Negative — Covenant Erosion | E04 |
| Bond Consolidated EBITDA | 2033 indenture definitions | Similar add-backs; projected savings capped at 35% | Add-back detail | Expands bond ratios | Wider than loan | Negative — Covenant Erosion | E23 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | Consolidated EBITDA over Consolidated Fixed Charges, pro forma | Fixed charges definition, pro forma interest | Ratio debt and ratio dividends above 2.00x | Coverage tests loosen as rates fall or EBITDA grows | Negative — Leverage Increase | E14; E16 |
| Unrestricted Cash | Credit agreement definitions | Cash of Holdings, borrower and restricted subsidiaries free of liens other than loan-document liens | Cash by entity and lien status | Reduces net debt | Netted cash may be spent after incurrence | Negative — Leverage Increase | E05 |
| Covenant debt versus carrying debt | Credit agreement definitions; Financial foundation | Covenant uses Consolidated Total Indebtedness; carrying debt USD 24,880 million | Definition text of Consolidated Total Indebtedness | Divergence unsized | Definition conflict cannot be resolved without text | Insufficient Information | E05; E24 |

#### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger | max-ratio | 40.00% | 7.36% | Letters of credit 67 over commitments 910 | 32.64% | Compliant | Collateralised letters of credit excluded if at 103%; not stated | Above trigger the maintenance test applies | Neutral — Stable | E01; E22 |
| Maintenance net leverage, year-end proxy | max-ratio | 7.50x | 4.46x | Carrying net debt 18,619 over EBITDA As Defined 4,173 | 3.04x | Compliant | Proxy, not certified; pre-dividend cash | Large cushion overstated by pre-dividend cash | Neutral — Stable | E01; E24 |
| Maintenance net leverage, pro forma dividend proxy | max-ratio | 7.50x | 5.50x | Pro forma net debt 22,967 over 4,173 | 2.00x | Compliant | Proxy; standalone October 2024 event adjustment | EBITDA can fall 26.62% before breach | Neutral — Stable | E01; E24 |
| Ratio dividend test, credit agreement | max-ratio | 6.75x | 5.50x | Pro forma net debt over EBITDA As Defined | 1.25x | Compliant | Proxy; no default also required | Room for further debt-funded dividends | Negative — Leverage Increase | E08; E24 |
| Junior or unsecured incurrence, credit agreement | max-ratio | 7.25x | 5.50x | Pro forma net debt over EBITDA As Defined | 1.75x | Compliant | Proxy | Room for junior or unsecured debt | Negative — Leverage Increase | E06; E24 |
| Pari secured incurrence, credit agreement | max-ratio | 5.00x | 4.22x | Secured carrying 19,534 less pro forma cash 1,913 over 4,173 | 0.78x | Compliant | Proxy; securitization, leases excluded | Nearest gate on dilution | Negative — Leverage Increase | E06; E07; E24 |
| Secured ratio-debt liens, 2033 notes | max-ratio | 5.25x | 4.22x | Same proxy as pari secured | 1.03x | Compliant | Proxy; bank-facility liens not subject to this test | Not binding while loan test tighter | Neutral — Stable | E15; E24 |
| Ratio debt and dividends cover, 2033 notes | min-ratio | 2.00x | 3.24x | EBITDA As Defined 4,173 over net interest expense 1,286 | 1.24x | Compliant | Proxy; not pro forma for September 2024 debt; fixed charges definition not fully read | Bond ratio gates loose relative to loan | Neutral — Stable | E14; E16; E24 |
| Maintenance net leverage, certified | max-ratio | 7.50x | [Insufficient Information] — missing: certified Consolidated Net Leverage Ratio | Certified covenant ratio | [Insufficient Information] — missing: certified tested ratio | Not Calculable | No compliance certificate supplied | Certified ratio may differ from proxy | Insufficient Information | E22 |

#### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Restricted payment capacity | Ratio dividend permission | Net leverage at or below 6.75x pro forma | No default | Proxy 5.50x | 4,348 paid October 2024 | Proxy 5,200.75 further | Proxy 5,200.75 | Provisional | High | Unlimited-amount distributions | Negative — Leverage Increase | E08; E24 |
| Lien capacity | Pari secured debt | Secured net leverage at or below 5.00x | Maturity and obligor conditions | Proxy 4.22x | Tranche L and 2033 notes September 2024 | Proxy 3,244.00 | Proxy 3,244.00 | Provisional | High | Dilutes first-lien collateral | Negative — Leverage Increase | E06; E07 |
| Debt incurrence capacity | Junior or unsecured debt | Net leverage at or below 7.25x | No default; maturity conditions | Proxy 5.50x | [Insufficient Information] — usage not tracked | Proxy 7,287.25 | Proxy 7,287.25 | Provisional | Moderate | Adds claims behind first lien | Negative — Leverage Increase | E06 |
| Debt incurrence capacity | General debt basket | Greater of 250 and 10% of EBITDA | Borrower and guarantors | Proxy EBITDA 4,173 | [Insufficient Information] — usage not disclosed | Proxy 417.30 | [Insufficient Information] — usage not disclosed | Formula Extracted Only | Low | Fixed grower capacity | Negative — Leverage Increase | E06 |
| Debt incurrence capacity | Foreign subsidiary debt | Greater of 450 and 18% of EBITDA | Foreign restricted subsidiaries | Proxy EBITDA 4,173 | [Insufficient Information] — usage not disclosed | Proxy 751.14 | [Insufficient Information] — usage not disclosed | Formula Extracted Only | Moderate | Structurally senior debt at non-guarantors | Negative — Leverage Increase | E06 |
| Debt incurrence capacity | Securitization debt | Greater of 725 and 20% of EBITDA | Non-recourse | Drawn 487.5 at year-end | 487.5, then 650 after October 2024 draw | Proxy 834.60 | Proxy 184.60 after October draw | Provisional | Moderate | Receivables leave collateral | Negative — Liquidity Deterioration | E06; E22 |
| Unrestricted subsidiary capacity | Loan investment cap | Greater of 250 and 10% of EBITDA | Designation compliance and no recourse debt | Proxy EBITDA 4,173 | None identified | Proxy 417.30 | [Insufficient Information] — usage not disclosed | Formula Extracted Only | Low | Bounded drop-down | Neutral — Stable | E09 |
| Investment capacity | Bond general investments | Greater of 500 and 25% of Total Assets | Bond only; loan limits apply concurrently | Total assets 25,586 | [Insufficient Information] — usage not disclosed | Proxy 6,396.50 | [Insufficient Information] — usage not disclosed | Formula Extracted Only | Moderate | Wide if loans repaid | Negative — Covenant Erosion | E16; E24 |
| Restricted payment capacity | General basket | Greater of 75 and 3% of EBITDA | No default | Proxy EBITDA 4,173 | [Insufficient Information] — usage not disclosed | Proxy 125.19 | [Insufficient Information] — usage not disclosed | Formula Extracted Only | Low | Small top-up | Neutral — Stable | E08 |
| Maintenance covenant headroom | Revolver springing test | 7.50x when usage above 40% | Revolving lenders only | Usage 67 against trigger 364 | 67 | Usage room 297 | 297 | Ready with Limitations | Low | Dormant test | Neutral — Stable | E01; E22 |

The ratio capacities overlap: one dollar of new secured debt used to fund a dividend consumes secured, total and dividend capacity at once, so the capacities are not additive. A secured-debt-funded dividend is limited by the smaller proxy, USD 3,244.00 million.

#### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental or notes | 5.00x secured net leverage | Provisional proxy 3,244.00 | Pari dilution of shared collateral | Higher interest burden | First-lien recovery diluted | Favours senior secured notes with stronger amendment protection over loans | E06; E07 |
| Bond bank-lien permission | Liens for all credit-facility obligations uncapped in 2033 indenture | Formula Extracted Only | Bond does not limit secured loan growth | None alone | Notes rely on loan test for dilution limit | Notes holders exposed to loan amendments | E15 |
| Junior lien or unsecured | 7.25x net leverage | Provisional proxy 7,287.25 | Junior layering | Higher leverage | Subordinated notes face more pari unsecured or junior claims | Subordinated notes most exposed | E06 |
| Foreign subsidiary debt | Greater of 450 and 18% of EBITDA | Formula Extracted Only | Structurally senior at non-guarantors | Limited | Group debt subordinated on foreign assets | All classes | E06 |
| Majority-led uptier | No explicit subordination sacred right in loan list read | Not quantifiable | Priming of non-consenting lenders | Could extend runway | Severe for excluded lenders | Loans weaker than notes | E10 |

#### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividends | Credit agreement and 2033 indenture permit unlimited ratio dividends | 6.75x net leverage; cover above 2.00x | 4,348 paid October 2024, dated subsequent event; proxy 5,200.75 remaining | Cash leaves the group | High | Negative — Leverage Increase | E08; E16 |
| Unrestricted subsidiary investments | Loan cap binds | Greater of 250 and 10% of EBITDA | None identified; proxy 417.30 | Assets leave guarantee and collateral | Low | Neutral — Stable | E09 |
| Bond general investments | Bond only | Greater of 500 and 25% of Total Assets | Proxy 6,396.50; constrained by loan | Could fund drop-down if loans repaid | Moderate | Negative — Covenant Erosion | E16 |
| Non-guarantor transfers | Loan investments in restricted subsidiaries uncapped | Clause 1(a) | [Insufficient Information] — transfer data not disclosed | Value moves behind foreign creditors | Moderate | Negative — Covenant Erosion | E09 |
| Dividend equivalents to management | Annual cap with carry-forward | Greater of 50 and 2% of EBITDA, capped at greater of 100 and 4%, plus carry-forward | [Insufficient Information] — usage not disclosed | Small cash leakage | Low | Neutral — Stable | E08 |

#### T4C.8 EBITDA add-back inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings, financial covenant | Credit agreement Financial Covenant Consolidated EBITDA | No cap; actions within 24 months; net of realised | Not Calculable without certificate | Lifts maintenance headroom | Delays covenant trip | E03 |
| Projected cost savings, incurrence | Credit agreement Consolidated EBITDA | 25% of Consolidated EBITDA after adjustment | Not Calculable without certificate | Each USD of add-back raises secured capacity by 5.00 USD | More pari secured debt | E04 |
| Projected cost savings, bond | 2033 indenture Consolidated EBITDA | 35% of Consolidated EBITDA after adjustment | Not Calculable without certificate | Bond ratios looser than loan | Bond tests not binding | E23 |
| Non-cash and deferred compensation, acquisition and integration costs, refinancing costs | All three definitions | No cap | Issuer adjustments: Earnings quality rejected USD 345 million for recurring-credit purposes | Covenant earnings above supported earnings of USD 3,813 million | Capacity overstated against recurring earnings | E03; E04; E24 |
| Dividend-equivalent payments | All three definitions | No cap | Not Calculable | Distributions to management do not reduce covenant earnings | Small inflation | E03 |

#### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio dividends unlimited in amount | 6.75x loan test; 2.00x cover bond test | Repeat recapitalisation | High | High | Orchestrator routes; relevance is leverage and recovery | E08; E16 |
| Pari secured dilution | 5.00x gate; bond bank-lien permission | First-lien dilution | High | Moderate | Orchestrator routes; relevance is first-lien recovery | E06; E15 |
| Fungible classification | Borrower may divide and reclassify debt among baskets | Capacity can be refreshed | Moderate | High | Orchestrator routes; relevance is capacity tracking | E06 |
| Unrestricted designation releases note guarantees | Bond guarantor release on designation | Guarantor loss | Moderate | High | Orchestrator routes; relevance is structural priority | E09; E18 |
| Majority loan amendments | No explicit subordination right in list read | Uptier risk | High | Moderate | Orchestrator routes; relevance is loan recovery | E10 |
| Uncapped covenant savings | Financial-covenant earnings | Masked deterioration | Moderate | High | Orchestrator routes; relevance is default timing | E03 |

#### Nearest pressure point

The nearest pressure point is pari secured debt capacity under the loan agreement's 5.00x secured net leverage gate. On the proxy the group sits at 4.22x after the October 2024 dividend, about USD 3,244.00 million of new first-lien debt away from the gate, and that debt would share collateral with every existing first-lien class. The monitoring signal is any incremental joinder, new secured note series or intercreditor joinder; the evidence needed to tighten the view is a compliance certificate with covenant secured debt, unrestricted cash and earnings add-backs.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 30; calculation L10

#### T4C.11 Capacity risk prioritisation

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured capacity at 5.00x | High | Moderate | Collateral dilution | Moderate | High for first lien | Track joinders and secured series | E06; E07 |
| 2 | Ratio dividends at 6.75x | High | Moderate | Value transfer to equity | High | Moderate for all classes | Track declarations | E08 |
| 3 | Majority-led loan amendments | High | Moderate | Uptier of non-consenting lenders | Low | High for excluded lenders | Track amendments | E10 |
| 4 | Uncapped financial-covenant savings | Moderate | High | Masked deterioration | Moderate | Low | Request certificate detail | E03 |
| 5 | Bond general investments | Moderate | Moderate | Drop-down if loans repaid | Low | Moderate | Track investments and designations | E16 |

#### T4C.12 Capacity gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| C1 | Compliance certificate with tested ratios | Certified headroom | All headroom provisional | Obtain latest certificate |
| C2 | Covenant earnings bridge and savings add-backs | Denominator of every ratio | Proxy uses EBITDA As Defined | Obtain bridge |
| C3 | Unrestricted cash by entity | Netting in all ratios | Proxy nets all cash | Obtain cash by loan party |
| C4 | Basket usage tracker | Remaining fixed-basket capacity | Grower basket remaining capacity not established | Obtain tracker |
| C5 | Consolidated Fixed Charges definition text | Bond cover ratio | Proxy uses net interest | Read definition and pro forma interest |

#### Overall covenant capacity view

Overall, TransDigm has limited covenant-capacity visibility: the formulas are documented but no certified ratio or usage record was supplied. The main capacity concern is pari secured debt room, because new first-lien debt shares collateral with existing first-lien creditors and so dilutes their recovery. Exact headroom is not supported; the proxies point to meaningful room under every incurrence test. Further analysis requires a compliance certificate, the covenant earnings bridge and the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 181; calculation L09; calculation L10

#### Material claim lineage

| Claim | Material claim | Strongest lineage | Source |
|---|---|---|---|
| M1 | Maintenance covenant is revolver-only, springing at 40% usage, 7.50x | Directly Sourced | d887611dex101.htm.jsonl, page 188 |
| M2 | Revolver usage of 7.36% leaves the test dormant | Calculated | calculation L02 |
| M3 | Dividends are unlimited in amount within 6.75x and no default | Directly Sourced | d887611dex101.htm.jsonl, page 181 |
| M4 | Proxy dividend room of USD 5,200.75 million | Analyst Inference | calculation L09 |
| M5 | Proxy pari secured room of USD 3,244.00 million is the nearest pressure point | Analyst Inference | calculation L10 |
| M6 | Loan amendment list read contains no explicit subordination right | Analyst Inference | d887611dex101.htm.jsonl, pages 204–205 |
| M7 | 2033 notes need two-thirds for collateral release and each holder for ranking | Directly Sourced | d887611dex41.htm.jsonl, pages 117–118 |
| M8 | Subordinated notes face 179-day blockage and turnover | Directly Sourced | d826058dex41.htm.jsonl, pages 107–108 |
| M9 | Enforcement control between first-lien classes not established | Insufficient Information | d887611dex41.htm.jsonl, page 30 |
| M10 | Financial-covenant savings uncapped; 25% and 35% caps elsewhere | Directly Sourced | d887611dex101.htm.jsonl, pages 23–24; d887611dex41.htm.jsonl, page 16 |
| M11 | About 20.73% of sales at non-guarantors | Calculated | calculation L16 |
| M12 | Bond permits uncapped liens for credit-facility obligations | Directly Sourced | d887611dex41.htm.jsonl, page 39 |
| M13 | Bond general investment basket proxy USD 6,396.50 million | Calculated | calculation L15 |

#### Verification

| Register | Result | Note |
|---|---|---|
| T4.2, T4.3, T4.9 to T4.13 | PASS | Present with required columns; market-norm skipped for lack of source |
| T4D.1 to T4D.8 | PASS | Present; perimeter by entity class pending guarantor exhibit |
| T4F.1 to T4F.6 | PASS | Present; intercreditor-dependent cells marked with the missing agreement |
| T4C.2 to T4C.9, T4C.11, T4C.12 | PASS | Present; capacities labelled proxy |

Legal and covenant interpretation completed with limitations. Covenant aggressiveness: 4 of 5, provisional. Key gaps: intercreditor agreement, compliance certificate, security documents and other indentures.

## Calculations

All amounts are USD millions for consolidated TransDigm Group Incorporated unless stated. Proxy ratios use consolidated figures from Financial foundation as stand-ins for covenant-defined quantities and are not compliance calculations. Displayed ratios are rounded to two decimals.

| ID | Quantity and period | Formula and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | Revolver usage trigger, 2024-09-30 | 910 × 0.40 | USD 364 million, matching the issuer's stated USD 364 million | USD million | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L02 | Revolver usage ratio, 2024-09-30 | USD 67 million letters of credit ÷ USD 910 million commitments = 0.0736263736 | 7.36% | % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L03 | Usage headroom | 40.00% − 7.36% = 32.64%; 364 − 67 = 297 | 32.64%; USD 297 million | %; USD million | calculation L01; calculation L02 |
| L04 | Year-end net leverage proxy | Net debt USD 18,619 million ÷ EBITDA As Defined USD 4,173 million = 4.4617780973 | 4.46x | x | Financial foundation (CP-1) |
| L05 | Pro forma October 2024 dividend net leverage proxy | Pro forma net debt USD 22,967 million ÷ USD 4,173 million = 5.5037143542 | 5.50x | x | Financial foundation (CP-1) |
| L06 | Year-end secured net leverage proxy | 19,534 − 6,261 = 13,273; 13,273 ÷ 4,173 = 3.1806853583 | 3.18x | x | Financial foundation (CP-1) |
| L07 | Pro forma October 2024 secured net leverage proxy | 19,534 − 1,913 = 17,621; 17,621 ÷ 4,173 = 4.2226216151 | 4.22x | x | Financial foundation (CP-1) |
| L08 | Fixed-charge cover proxy, FY2024 | 4,173 ÷ 1,286 net interest expense = 3.2449455677 | 3.24x | x | Financial foundation (CP-1) |
| L09 | Ratio dividend room proxy | 6.75 × 4,173 = 28,167.75; 28,167.75 − 22,967 | USD 5,200.75 million | USD million | calculation L05; d887611dex101.htm.jsonl, page 181 |
| L10 | Pari secured debt room proxy | 5.00 × 4,173 = 20,865.00; 20,865.00 − 17,621 | USD 3,244.00 million | USD million | calculation L07; d887611dex101.htm.jsonl, page 59 |
| L11 | Junior or unsecured debt room proxy | 7.25 × 4,173 = 30,254.25; 30,254.25 − 22,967 | USD 7,287.25 million | USD million | calculation L05; d887611dex101.htm.jsonl, page 60 |
| L12 | Bond secured ratio-debt lien room proxy | 5.25 × 4,173 = 21,908.25; 21,908.25 − 17,621 | USD 4,287.25 million | USD million | calculation L07; d887611dex41.htm.jsonl, page 43 |
| L13 | EBITDA decline before 7.50x maintenance level, post-dividend proxy | 7.50 × 4,173 = 31,297.50; 22,967 ÷ 31,297.50 = 0.7338285806; 1 − 0.7338285806 = 0.2661714194 | 26.62% | % | calculation L05; d887611dex101.htm.jsonl, page 188 |
| L14 | Grower basket proxies | 10% × 4,173 = 417.30; 12% × 4,173 = 500.76; 18% × 4,173 = 751.14; 20% × 4,173 = 834.60; 3% × 4,173 = 125.19; securitization room 834.60 − 650 = 184.60 | USD 417.30 million; USD 500.76 million; USD 751.14 million; USD 834.60 million; USD 125.19 million; USD 184.60 million | USD million | d887611dex101.htm.jsonl, pages 58–61; d887611dex41.htm.jsonl, page 39; Financial foundation (CP-1) |
| L15 | Bond general investment basket proxy | 25% × total assets USD 25,586 million | USD 6,396.50 million | USD million | d887611dex41.htm.jsonl, page 38; Financial foundation (CP-1) |
| L16 | Non-guarantor sales approximation, FY2024 | USD 7,940 million consolidated − USD 6,294 million issuer and guarantors = USD 1,646 million; 1,646 ÷ 7,940 = 0.2073047859 | USD 1,646 million; 20.73% | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L17 | Headroom on displayed figures | 7.50 − 4.46 = 3.04; 7.50 − 5.50 = 2.00; 7.25 − 5.50 = 1.75; 5.00 − 4.22 = 0.78; 6.75 − 5.50 = 1.25; 5.25 − 4.22 = 1.03; 3.24 − 2.00 = 1.24 | 3.04x; 2.00x; 1.75x; 0.78x; 1.25x; 1.03x; 1.24x | x | calculations L04 to L08 |
| L18 | Secured notes aggregate principal | 2,100 + 2,750 + 1,450 + 1,000 + 2,200 + 1,500 | USD 11,000 million | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |

The proxies net all reported cash against debt and use issuer EBITDA As Defined, which the issuer says matches the financial-covenant definition but which excludes any projected savings the agreements allow. The October 2024 dividend adjustment is the standalone event figure from Financial foundation, not an October closing balance.

## Gaps

The open items below restrict the size of capacity figures and the intercreditor conclusions; they do not change the reading of the executed provisions.

| Gap | Severity | What is missing | Effect on conclusions | Source |
|---|---|---|---|---|
| First Lien Intercreditor Agreement and joinders | MATERIAL | Executed agreement allocating enforcement control, standstill, turnover and sharing among first-lien classes | Enforcement control and class-level realised recovery mechanics not established | d887611dex41.htm.jsonl, page 30 |
| Compliance certificate and covenant earnings bridge | MATERIAL | Certified ratios, unrestricted cash and add-backs | All headroom and capacity figures remain proxies | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Security documents and guarantor exhibit | MATERIAL | Guarantee and collateral agreement, UK debenture, guarantor and subsidiary lists | Collateral coverage, excluded assets and perfection not established | d887611dex101.htm.jsonl, pages 173–174 |
| Basket usage history | MATERIAL | Usage of grower and fixed baskets | Remaining fixed-basket capacity not established | d887611dex101.htm.jsonl, pages 58–61 |
| Other note indentures | MINOR | 2028 to 2032 secured and 2029 subordinated indentures | Note conclusions confirmed only for the 2033 and 2027 series | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–60 |
| Unread loan sections | MINOR | Most-favoured-nation pricing, full permitted investments, any builder basket, governing law | Leakage and pricing protection may be understated | d887611dex101.htm.jsonl, page 146 |
| Issuer covenant description conflict | MINOR | One annual-report passage describes the covenant as secured debt to EBITDA; executed agreement and covenant section say total net leverage | Executed agreement governs; no change to conclusions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 70; d887611dex101.htm.jsonl, page 188 |
| Market-norm source | MINOR | Covenant-review report or comparative source | No relative market-norm judgement made | Not supplied: no comparative source in the source set |

## Next module
The orchestrator selects the next module.
