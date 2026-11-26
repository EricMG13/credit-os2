---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-4
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-opus-high
pathway: deep_credit_assessment
module_status: Completed with Limitations
committee_status: Requires More Work
artifact_name: tdg_CP-4_20240930.md
---

## Request
Interpret the legal and covenant package of TransDigm Group Incorporated as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers controlling documents, covenant features and capacity, restricted-group, guarantee and collateral structure, intercreditor control, defaults and amendment risk, translated into default-probability and recovery mechanics; no legal advice is given.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Execution-version Amendment No. 17 and incremental term loan assumption agreement, with the annexed amended credit agreement (TransDigm Inc. as borrower, TransDigm Group Incorporated as holdings) | not stated (agreement dated 2024-09-19; publication not stated) | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling loan covenants: financial covenant, restricted payments, permitted debt and investments, EBITDA and ratio definitions, incremental and MFN terms, events of default, amendments, collateral release, unrestricted-subsidiary designation, governing law |
| d887611dex41.htm.jsonl | Execution-version indenture for the 6.000% senior secured notes due 2033 | not stated (indenture dated 2024-09-19; publication not stated) | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note restricted payments, debt incurrence, secured ratio lien basket, amendments, guarantor release, intercreditor references, enforcement by collateral agent, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | not stated (indenture dated 2019-11-13 per Source readiness; publication not stated) | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination and payment-blockage mechanics |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 (signature date) | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of covenants and compliance, revolver and letters of credit, guarantor information and obligor-group summary, collateral description; retrospective evidence |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Document inventory, dates of legal documents not read here, legal-coverage gaps |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt instruments, carrying and principal amounts, net debt, EBITDA As Defined, cash interest, October 2024 pro forma adjustments |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Recapitalisation funding and dates, parent and borrower identity and jurisdiction |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence of issuer add-backs, used to frame covenant-earnings inflation |

## Findings

### Bottom line
TransDigm's debt documents protect creditors through shared first-lien collateral and unanimous-consent release rights, but ratio-based distribution and debt baskets let the company repeat debt-funded recapitalisations without lender consent, so default risk rests on financial policy, not covenant tripwires. Term lenders and noteholders have no maintenance test; the revolver's 7.50x net leverage test applies only above 40% usage, against 7.36% at year-end.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 177–181; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L02

On the issuer's adjusted-earnings proxy of 4.46x year-end net leverage, the 6.75x distribution test left USD 9,548.75 million of capacity before the October 2024 payment of USD 4,348 million. Financial foundation puts pro forma net debt at USD 22,967 million and net leverage at 6.02x on reported EBITDA after that payment; the equivalent on adjusted earnings is not established. Enforcement control for secured creditors cannot be confirmed because the intercreditor agreement was not supplied.
Basis: calculation L12; Financial foundation (CP-1); d887611dex41.htm.jsonl, page 30

### Key findings
- Covenant protection against operating deterioration arrives late and belongs to the revolver alone. The 7.50x test (8.00x for the first four quarters after a material acquisition) is tested only when revolving exposure exceeds 40% of the USD 910 million commitments, or USD 364 million; at year-end exposure was USD 67 million of letters of credit. A breach is a default for term lenders only once revolving lenders terminate or accelerate, and only the required revolving lenders can amend the test. Default risk therefore surfaces through liquidity and refinancing rather than through an early covenant trigger.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation L01; calculation L03
- The distribution covenant is the main leakage channel, and the company has already used it. The credit agreement permits unlimited restricted payments while pro forma net leverage, including the financing, is 6.75x or lower and no default exists, and a dividend permitted at declaration may be paid within 60 days. The 2033 secured notes are looser still, allowing unlimited payments while fixed-charge coverage exceeds 2.00x. The September 2024 dividend of USD 4,348 million, funded partly by USD 3,000 million of new pari secured debt, shows the route is used rather than theoretical.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 75–76; Business & governance (CP-1A); calculation L17
- Pari secured debt capacity is the binding constraint on the next secured recapitalisation. Incremental loans need 7.25x net and 5.00x secured net leverage; the indenture allows secured ratio debt to 5.25x. On a year-end proxy of 3.18x secured net leverage the 5.00x test left about USD 7,592 million of pari secured capacity, inside USD 11,635.25 million of total ratio-debt capacity; the October payment reduced both by up to USD 4,348 million because cash is netted. Pricing protection for existing term lenders is a 50 bp most-favoured-nation clause that lapses after 18 months and excludes acquisition debt.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, pages 144–146; d887611dex41.htm.jsonl, page 43; calculation L08; calculation L13; calculation L14
- Covenant earnings can be inflated well beyond reported results, which expands every ratio basket. Consolidated EBITDA adds back uncapped non-recurring, integration, transaction, refinancing and non-cash compensation items and dividend-equivalent payments, plus projected cost savings within 24 months capped at 25% of the adjusted figure. On the issuer's adjusted earnings, that cap alone allows up to USD 1,391 million of add-back, which would lift 6.75x distribution capacity by USD 9,389.25 million; actual use is not disclosed.
Basis: d887611dex101.htm.jsonl, pages 24–26; Earnings quality (CP-1D); calculation L18
- Collateral and amendment protections are the package's strongest feature, but the credit agreement lacks an express consent right against subordination in the provisions reviewed. Releasing all or substantially all collateral, releasing a material guarantor or changing payment sharing needs every lender; the 2033 indenture needs two-thirds of holders to release collateral and each affected holder to change ranking. Required lenders can still approve other changes, and the agent may add pari or junior secured debt under intercreditor terms without lender consent.
Basis: d887611dex101.htm.jsonl, pages 204–207; d887611dex41.htm.jsonl, pages 116–118
- Structural subordination is moderate but real. The issuer and guarantor group generated USD 6,294 million of USD 7,940 million consolidated sales, 79.27%; about USD 1,646 million, or 20.73%, sits outside the guarantor group and ahead of all group debt for its own value. Foreign restricted subsidiaries can borrow the greater of USD 450 million and 18% of Consolidated EBITDA, and receivables sold to the securitisation vehicle sit outside the collateral.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex101.htm.jsonl, pages 59–60; calculation L15

### Contrary evidence and what would change the view
The strongest evidence against an extraction-led legal view is that the incurrence tests do bind and were certified: the September 2024 incremental loans required a financial officer's certificate that net leverage was no higher than 7.25x and secured net leverage no higher than 5.00x after the transaction, and the issuer states compliance with every covenant at year-end. Unrestricted-subsidiary designation is limited to newly acquired or newly formed subsidiaries, which narrows the classic drop-down of existing operating companies, and all-collateral and guarantor releases need every lender. These features cap the speed of leverage build and make a coercive priming transaction harder than in many leveraged credits. The view would move toward market-standard if a compliance certificate showed covenant net leverage close to 6.75x after the October payment, if an amendment added express consent rights against lien or payment subordination and asset transfers to unrestricted subsidiaries, or if the intercreditor agreement showed noteholders sharing enforcement control. It would worsen if the company issued further pari secured debt to fund distributions or designated a newly formed subsidiary holding transferred intellectual property as unrestricted.
Basis: d887611dex101.htm.jsonl, page 4; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–207; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- The intercreditor agreement among first-lien creditors is referenced but not supplied, so who controls enforcement, any standstill, turnover and release authority among secured lenders and noteholders is not established; the conclusion that secured classes share collateral ratably rests on issuer and indenture descriptions and stays qualitative.
- No compliance certificate or covenant-earnings calculation is supplied, so every ratio headroom and capacity figure here is a proxy on the issuer's adjusted earnings; because covenant earnings permit broader add-backs, true capacity is probably larger than shown, which strengthens rather than weakens the leakage conclusion but leaves exact headroom unconfirmed.
- Basket-usage history is not supplied, so remaining capacity in fixed and grower baskets is not established; the capacity figures are gross and cannot be summed because baskets overlap.
- The guarantee and collateral agreement, guarantor exhibit and security schedules were not reviewed, so excluded assets, mortgage and control-agreement suspension mechanics and the full guarantor list are not established; the structural-subordination share is a sales-based approximation, not an asset or earnings split.
- Only the 2033 secured and 2027 subordinated indentures were supplied, so the view that the other secured and subordinated notes carry the same coverage-based payment tests rests on the issuer's statement that their covenants are substantially similar.

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package based on a revolver-only springing maintenance test, a 6.75x net-leverage distribution test with no fixed cap, a 2.00x coverage test in the secured notes and broad add-back definitions. The main creditor protections are first-lien collateral that includes cash, unanimous-consent release of all collateral and material guarantors, a pro rata sharing sacred right, a noteholder ranking sacred right and a designation limit on unrestricted subsidiaries. The main weaknesses are ratio baskets sized to adjusted earnings and the absence, in the reviewed provisions, of explicit blockers against subordination or transfers of material assets to unrestricted subsidiaries. The primary default-risk path is repeated debt-funded distributions that consume cash and refill pari secured debt up to 5.00x secured net leverage; the primary recovery path is dilution of the first-lien pool by additional pari debt and leakage to non-guarantor subsidiaries. For security selection, the most important legal consideration is that secured lenders and noteholders sit in one pari pool whose enforcement terms are not in the documents supplied. Covenant aggressiveness scores 4 out of 5, provisional. This legal and covenant review is completed with limitations; the key gaps are the intercreditor agreement, covenant compliance data, security documents and basket usage.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 75–76; d887611dex101.htm.jsonl, pages 204–207; d887611dex101.htm.jsonl, page 81

### Nearest pressure point
The nearest pressure point is the 5.00x secured net leverage incurrence test, because it is the binding limit on another secured-debt-funded distribution and the route the company used in September 2024. On the year-end proxy, secured net leverage was 3.18x, leaving about USD 7,592 million of pari secured capacity, and the October payment reduced that by up to USD 4,348 million because cash is netted; the post-payment residual is not established. Each further use dilutes the first-lien pool and raises interest burden without adding earnings. Monitor new pari secured issuance, incremental assumption agreements and their ratio certificates, and any distribution declaration. A compliance certificate with covenant earnings and an October balance would tighten the view.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, page 146; calculation L08; calculation L14; Financial foundation (CP-1)

### Overall covenant capacity view
Overall, TransDigm has limited covenant-capacity visibility. The main capacity concern is ratio-based distribution and pari secured debt capacity, because both scale with add-back-inflated earnings and cash netting, letting value move to shareholders while secured claims grow. Exact headroom is not supported: only proxies on issuer earnings are available. The largest proxy capacities are total ratio debt of USD 11,635.25 million, distributions of USD 9,548.75 million and pari secured debt of USD 7,592 million at year-end, overlapping rather than additive. The general investment basket of the greater of USD 500 million and 25% of total assets is about USD 6,396.50 million on consolidated assets and can fund newly formed unrestricted subsidiaries.
Basis: calculation L11; calculation L12; calculation L13; calculation L14; d887611dex101.htm.jsonl, pages 61–63

### Structural and intercreditor view
Value sits mainly in the issuer and guarantor group: TransDigm Group's guarantee adds no separate assets, and TransDigm Inc. with its domestic restricted subsidiaries and TransDigm UK carries the obligor-group sales. All first-lien debt is pari in payment and, per the indenture, governed by a shared first-lien intercreditor agreement; noteholders cannot enforce security directly and act through a collateral agent. Subordinated noteholders face payment blockage of up to 179 days in any 360 days and rank behind all senior debt, including the 2033 secured notes. The worst structural leakage route is an investment of up to the general basket into a newly formed unrestricted subsidiary followed by asset transfers, which would release that subsidiary from note guarantees; it is theoretical, not demonstrated.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex41.htm.jsonl, pages 122–129; d826058dex41.htm.jsonl, page 107; d887611dex101.htm.jsonl, page 81

### Downside transmission
The initiating condition is a further debt-funded distribution or acquisition taking net leverage toward the 6.75x and 7.25x tests. The first operational break would be weaker aftermarket earnings after the cash cushion has been distributed, pushing the company to draw the revolver. Once revolving exposure passes 40% of commitments at a quarter-end, the 7.50x test applies, and a breach lets revolving lenders accelerate, which then becomes a default for term lenders and, through cross-acceleration, for noteholders. Because the term loans and notes have no maintenance test, recovery depends on the pari first-lien pool, already diluted by prior pari issuance. Observable triggers are quarter-end revolver usage, new pari secured debt, distribution declarations and acquisition-related step-ups to 8.00x.
Basis: d887611dex101.htm.jsonl, pages 188–192; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Capital structure

| Instrument | Rank and security | Principal (USD m) | Carrying value (USD m) | Maturity | Governing document reviewed |
|---|---|---|---|---|---|
| Revolving credit facility | Senior secured first lien; undrawn, USD 67m letters of credit | 910 commitment | Not supplied: undrawn facility | 2029-02-27 | Credit agreement as amended, reviewed |
| Term loans I, J, K, L | Senior secured first lien, pari with secured notes | 8702 | 8642 | 2028-08-24 to 2032-01-19 | Credit agreement as amended, reviewed |
| 2028 secured notes | Senior secured first lien | 2100 | 2077 | 2028-08-15 | Not supplied: indenture not in source set |
| 2029, 2030, 2031 and 2032 secured notes | Senior secured first lien | 7400 | 7329 | 2029-03-01 to 2032-03-01 | Not supplied: indentures not in source set |
| 2033 secured notes | Senior secured first lien | 1500 | 1486 | 2033-01-15 | 2033 indenture, reviewed |
| Senior subordinated notes 2027, January 2029, May 2029 | Unsecured, contractually subordinated | 4600 | 4581 | 2027-11-15 to 2029-05-01 | 2027 indenture subordination article reviewed; others not supplied |
| Receivables securitisation | Securitisation vehicle; receivables outside first-lien collateral | 487.5 drawn of 650 | 486 | 2025-07-11 | Not supplied: facility documents |
| Finance leases and government advances | Legal rank not established | Not supplied: no principal stated for leases | 279 | Various | Not supplied: documents |

All amounts are from Financial foundation except the summed rows, which are calculated; finance leases USD 262 million and government advances USD 17 million make up the last carrying value.
Basis: Financial foundation (CP-1); calculation L19; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59

### Covenant tests and headroom

| Test | Document | Threshold | Year-end position | Headroom | Creditor meaning |
|---|---|---|---|---|---|
| Revolver springing trigger | Credit agreement | 40% of commitments | 7.36% | 32.64 percentage points | Maintenance test dormant |
| Revolver net leverage covenant | Credit agreement | 7.50x | Legal ratio not supplied; proxy 4.46x | Proxy 3.04x | Late, revolver-only protection |
| Restricted payments ratio basket | Credit agreement | 6.75x | Proxy 4.46x | Proxy 2.29x | Unlimited distributions below threshold |
| Incremental and junior or unsecured ratio debt | Credit agreement | 7.25x | Proxy 4.46x | Proxy 2.79x | Releveraging room |
| Pari secured debt | Credit agreement | 5.00x | Proxy 3.18x | Proxy 1.82x | Binding limit on secured recap |
| Unlimited investments basket | Credit agreement | 5.75x | Proxy 4.46x | Proxy 1.29x | Leakage to non-guarantors |
| Fixed-charge coverage for payments and debt | 2033 indenture | 2.00x | Proxy 3.60x | Proxy 1.60x | Looser than bank test |
| Secured ratio debt lien basket | 2033 indenture | 5.25x | Proxy 3.18x | Proxy 2.07x | Looser than bank test |

Proxy positions are year-end, before the October 2024 payment, on issuer adjusted earnings; Financial foundation states pro forma net debt of USD 22,967 million and 6.02x on reported EBITDA after the payment.

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver springing trigger: revolving exposure / commitments | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Credit agreement financial covenant; exposure USD 67m letters of credit over USD 910m; assumes letters of credit not cash-collateralised |
| Revolver Consolidated Net Leverage Ratio, legal definition | 7.50 | Not supplied: tested covenant ratio not disclosed | Not supplied: tested covenant ratio not disclosed | Passes at or below | x | Credit agreement financial covenant; 8.00 for four quarters after a material acquisition; tested only above the trigger |
| Revolver net leverage, proxy on issuer description | 7.50 | 4.46 | 3.04x | Passes at or below | x | Net debt / EBITDA As Defined, year-end, before October 2024 payment; not the covenant ratio |
| Restricted payments ratio basket | 6.75 | 4.46 | 2.29x | Passes at or below | x | Same proxy; tested pro forma for the payment and its financing |
| Incremental and junior or unsecured ratio debt | 7.25 | 4.46 | 2.79x | Passes at or below | x | Same proxy; tested pro forma including use of proceeds |
| Pari secured debt incurrence | 5.00 | 3.18 | 1.82x | Passes at or below | x | Identified secured carrying debt less year-end cash over EBITDA As Defined; principal basis would be higher |
| Unlimited investments basket | 5.75 | 4.46 | 1.29x | Passes at or below | x | Same proxy; also needs no revolving loans and at least USD 200m unrestricted cash |
| 2033 indenture fixed-charge coverage | 2.00 | 3.60 | 1.60x | Passes above | x | EBITDA As Defined over net cash interest; indenture definition not reviewed |
| 2033 indenture secured ratio debt lien basket | 5.25 | 3.18 | 2.07x | Passes at or below | x | Same secured proxy as the bank test |

Every current value except the springing trigger is an analytical proxy at the year-end balance before the October 2024 dividend, not a certified covenant ratio.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the indenture exhibit states no publication date | First Lien Intercreditor Agreement entered among borrower, holdings, guarantors, credit-agreement collateral agent and secured-note trustees and collateral agents | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs first-lien enforcement and release; document not supplied |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement executed | Historical — most recent amendment that impacted the restrictive covenants, executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets current restrictive-covenant terms; starts one most-favoured-nation sunset |
| 2024-09-19 | day | Not supplied: the indenture exhibit states no publication date | Joinder No. 6 to the First Lien Intercreditor Agreement, bringing the 2033 secured notes into the first-lien pool | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500m pari secured claims to the shared collateral pool |
| 2027-09-15 | day | Not supplied: the indenture exhibit states no publication date | First optional redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Opens a refinancing window for the newest secured notes |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity | Scheduled — maturity date of the revolving credit facility is February 27, 2029 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance covenant benefits revolving lenders until commitments end |

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
| MINOR | 3 |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds its investment in the operating borrower; no significant separate operations or assets | Ownership | TransDigm Inc. | 2024 annual report guarantor information; Delaware parent and borrower per Business & governance |
| TransDigm Group Incorporated | Guarantees the notes on a senior secured basis as holdings | Guarantee | 2033 secured notes | 2033 secured notes indenture, guarantees article; New York law |
| TransDigm Group Incorporated | Holdings guarantee of loan obligations, failure of which is a default | Guarantee | Senior secured credit facility | Amended credit agreement events of default; New York law |
| TransDigm UK | Guarantees on senior secured basis | Guarantee | 2028 secured notes | 2024 annual report guarantor information; 2028 indenture not supplied, governing law not established |
| TransDigm UK | Guarantees on senior subordinated unsecured basis | Guarantee | Senior subordinated notes | 2024 annual report guarantor information; governing law of subordinated indentures not verified |
| Domestic restricted subsidiaries | Guarantee if borrower or guarantor under credit facilities or of USD 200m capital-markets debt | Guarantee | 2033 secured notes | 2024 annual report and 2033 indenture release terms; New York law |
| TransDigm Inc. | Grants first-lien security, collateral including available cash | Security | First-lien collateral agents | 2024 annual report; 2033 indenture collateral article, New York law; collateral agreement not supplied |
| Non-guarantor subsidiaries | Their own creditors' claims rank ahead of group debt on their assets | Structural claim | Secured and subordinated notes | 2024 annual report states notes structurally subordinated to non-guarantor liabilities; indentures New York law where reviewed |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facility | Ranks equally in right of payment | Payment rank | Secured notes | 2024 annual report; 2033 indenture; New York law |
| Senior secured credit facility | Shares first-lien collateral under the First Lien Intercreditor Agreement of 2019 with six joinders | Security rank | Secured notes | 2033 indenture definitions, New York law; intercreditor text and its governing law not supplied |
| Secured notes | Senior in right of payment | Payment rank | Senior subordinated notes | 2024 annual report; 2033 indenture designates the notes as Designated Senior Debt; New York law |
| Designated Senior Debt representative | May block payments for up to 179 days in any 360 days | Standstill | 2027 senior subordinated notes | 2027 subordinated indenture subordination article; governing law not verified |
| Notes collateral agent | Holders may not enforce security directly; agent acts under intercreditor agreements | Enforcement control | 2033 secured noteholders | 2033 indenture collateral article, New York law |
| Credit facility guarantee release | Release under credit facilities and other capital-markets debt releases the note guarantee | Release | 2033 note guarantees | 2033 indenture guarantor-release section, New York law |
| Credit agreement lenders | Release of all or substantially all collateral needs every lender | Release | First-lien collateral | Amended credit agreement amendments section, New York law |

### Analytical appendix — complete canonical registers

### Evidence references

| Evidence ID | Provision or fact | Source |
|---|---|---|
| E01 | Financial covenant: 7.50x (8.00x four quarters after Material Acquisition), only if revolving exposure exceeds 40% of commitments; amendable by Required Revolving Lenders only | d887611dex101.htm.jsonl, page 188 |
| E02 | Events of default: payment, cross-default and cross-acceleration to Material Indebtedness, insolvency, USD 50m judgments, guarantee and collateral failure, financial covenant event of default limited to revolving lenders until termination or acceleration, change of control; acceleration by Required Lenders | d887611dex101.htm.jsonl, pages 188–192 |
| E03 | Restricted payments covenant: 60-day declared-dividend clause; dividend-equivalent and management basket; general basket greater of USD 75m and 3.0%; expired USD 1,500m basket; unlimited payments at no default and CNLR not above 6.75x pro forma including financing | d887611dex101.htm.jsonl, pages 177–181 |
| E04 | Permitted Indebtedness: ratio debt with CSNDR 5.00x for pari secured and CNLR 7.25x for junior secured and unsecured; general basket greater of USD 250m and 10.0%; foreign restricted subsidiaries greater of USD 450m and 18.0%; subordinated debt at 7.25x; securitisation greater of USD 725m and 20.0%; reclassification | d887611dex101.htm.jsonl, pages 59–61 |
| E05 | Permitted Investments: unrestricted subsidiaries greater of USD 250m and 10.0%; general greater of USD 500m and 25.0% of Total Assets; joint ventures greater of USD 1,000m and 40.0% at CNLR 7.00x; Permitted Acquisitions with USD 100m Available Liquidity; unlimited at CNLR 5.75x, no revolving loans and USD 200m cash | d887611dex101.htm.jsonl, pages 61–63 |
| E06 | Consolidated EBITDA add-backs including non-recurring, integration, transaction, refinancing, dividend equivalents and projected cost savings within 24 months capped at 25.0%; net income exclusions for non-cash compensation, purchase accounting, currency and extinguishment | d887611dex101.htm.jsonl, pages 24–26 |
| E07 | Ratio definitions: CNLR and CSNDR net of Unrestricted Cash, LTM, pro forma for acquisitions and sales; Unrestricted Cash definition | d887611dex101.htm.jsonl, pages 26–27; d887611dex101.htm.jsonl, page 81 |
| E08 | Financial Covenant Consolidated EBITDA definition | d887611dex101.htm.jsonl, page 41 |
| E09 | Incremental facilities: CNLR 7.25x and CSNDR 5.00x; MFN 50 bp yield differential with 18-month sunsets and carve-outs; existing lenders get benefit of more restrictive incremental terms | d887611dex101.htm.jsonl, pages 144–146 |
| E10 | Amendments: Required Lenders; each-lender rights for principal, rate, maturity, payment sharing, voting, material guarantor release and all-collateral release; agent may enter intercreditor agreements for pari or junior secured debt; Required Lenders may allow non-pro rata prepayment offers to all lenders of a class; automatic collateral release on permitted disposition and suspension periods | d887611dex101.htm.jsonl, pages 204–207 |
| E11 | Unrestricted Subsidiary: only newly acquired or newly formed subsidiaries; certification of compliance with payment and investment covenants; no recourse debt | d887611dex101.htm.jsonl, page 81 |
| E12 | September 2024 amendment conditions: CNLR not above 7.25x and CSNDR not above 5.00x after Tranche L, financial officer certificate, solvency certificate | d887611dex101.htm.jsonl, page 4 |
| E13 | 2033 indenture restricted payments: builder from December 2010 (USD 400m plus 50% of cumulative net income plus equity), general basket greater of USD 75m and 3.0%, unlimited when FCCR exceeds 2.0x | d887611dex41.htm.jsonl, pages 69–70; d887611dex41.htm.jsonl, pages 74–76 |
| E14 | 2033 indenture debt: ratio debt at FCCR above 2.0x with USD 400m cap for non-guarantor restricted subsidiaries; secured ratio debt lien basket at CSNDR 5.25x | d887611dex41.htm.jsonl, page 79; d887611dex41.htm.jsonl, page 43 |
| E15 | 2033 indenture amendments: majority; two-thirds for release of substantially all collateral or adverse intercreditor change; each holder for ranking and payment terms | d887611dex41.htm.jsonl, pages 116–118 |
| E16 | 2033 indenture guarantor release: sale, asset sale, unrestricted designation, immaterial subsidiary, release under credit facilities and capital-markets debt, defeasance | d887611dex41.htm.jsonl, page 122 |
| E17 | 2033 indenture: First Lien Intercreditor Agreement and joinders; Designated Senior Debt; intercreditor controls; holders cannot enforce security directly; New York law | d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, pages 126–129 |
| E18 | 2027 subordinated indenture payment blockage: 179 days, one per 360 days, 181 clear days | d826058dex41.htm.jsonl, page 107 |
| E19 | Issuer covenant summary: no maintenance covenant except revolver; 40% trigger, USD 364m; compliance; collateral includes available cash; incremental at 7.25x and 5.00x | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E20 | Guarantor information and obligor-group summary | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| E21 | Revolver USD 910m, letters of credit USD 67m, availability USD 843m, term loans | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| E22 | Financial inputs: net debt, EBITDA As Defined, secured carrying debt, cash, coverage, October 2024 pro forma | Financial foundation (CP-1) |
| E23 | Credit agreement governed by New York law | d887611dex101.htm.jsonl, page 222 |

### T4.1 Source gate and module status

| Item | Finding | Source |
|---|---|---|
| Executed governing document | Present: amended credit agreement annexed to executed September 2024 amendment; executed 2033 secured notes indenture; 2027 subordinated indenture | d887611dex101.htm.jsonl, page 4; d887611dex41.htm.jsonl, page 30; d826058dex41.htm.jsonl, page 107 |
| Missing supplements | First Lien Intercreditor Agreement; guarantee and collateral agreement and schedules; other note indentures; compliance certificates; basket-usage records | Source readiness (CP-0) |
| Financial inputs | Present from Financial foundation; covenant-defined earnings not supplied | Financial foundation (CP-1) |
| Refinancing and liability-management assessment | Not supplied for this run; liability-management overlay limited to provisions | Not supplied: refinancing assessment not among supplied analyses |
| Governing law | New York for credit agreement and 2033 indenture; not verified for 2027 indenture | d887611dex101.htm.jsonl, page 222; d887611dex41.htm.jsonl, page 126 |
| Module status | Completed with Limitations | Source readiness (CP-0) |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Amended credit agreement annexed to Amendment No. 17 | Executed amendment with annexed amended credit agreement | Amendment dated 2024-09-19; issuer names Amendment No. 15 of 2024-03-22 as last covenant-impacting amendment | Executed; annex shows marked page references | Controls loan covenants, definitions, events of default, amendments and collateral release | Sets the binding distribution, debt and investment tests | E01–E12; E23 | d887611dex101.htm.jsonl, page 4; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| 1 | 2033 secured notes indenture | Executed indenture | Dated 2024-09-19 | Executed | Controls 2033 notes covenants, guarantees, amendments and collateral agency | Looser payment test than bank; ranking sacred right | E13–E17 | d887611dex41.htm.jsonl, page 30 |
| 1 | 2027 senior subordinated notes indenture | Executed indenture | Dated 2019-11-13 | Executed; subordination article reviewed only | Controls subordination and blockage for 2027 notes | Defines junior-class standstill | E18 | d826058dex41.htm.jsonl, page 107; Source readiness (CP-0) |
| 1 | 2014 restated credit agreement, 2013 restatement and June 2024 Amendment No. 16 | Base agreement and earlier amendments | 2013-02-28; 2014-06-04; 2024-06-04 | Executed; not relied on because the September 2024 annex restates current text | Historical provenance | No independent provision used | E10 | Source readiness (CP-0) |
| 2 | First Lien Intercreditor Agreement with Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; joinders to 2024-09-19 | Not in source set | Controls first-lien enforcement, turnover and release | Enforcement control and standstill not established | E17 | d887611dex41.htm.jsonl, page 30 |
| 3 | Compliance certificates | Covenant certificates | Not supplied: no certificate in source set | Not in source set | Would control tested ratios and usage | Exact headroom not established | E19 | Source readiness (CP-0) |
| Supplementary | Annual report on Form 10-K | Issuer filing summarising covenants | 2024-11-07 | Filed; postdates cutoff | Financial inputs and issuer covenant description only | Confirms compliance and springing structure | E19–E21 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–62 |
| 1 | Indentures for 2028, 2029, 2030, 2031, 2032 secured notes and January and May 2029 subordinated notes | Indentures | Not supplied: not in source set | Not in source set | Would control those notes | Covenants assumed similar per issuer only | E19 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage 7.50x (8.00x four quarters after Material Acquisition), tested only if revolving exposure exceeds 40% of commitments at quarter-end | Credit agreement Section 6.14 | Dormant unless revolver is drawn; term lenders and noteholders have none | Negative — Covenant Erosion | Not assessed: no comparative source | E01 | d887611dex101.htm.jsonl, page 188 |
| Financial covenant default | Default for revolving lenders only; becomes term-lender default only after revolver termination or acceleration | Credit agreement Article VII(l) | Delays cross-class acceleration | Negative — Covenant Erosion | Not assessed: no comparative source | E02 | d887611dex101.htm.jsonl, page 191 |
| Ratio debt, bank | Pari secured debt at CSNDR 5.00x; junior secured or unsecured at CNLR 7.25x; refinancing exempt | Permitted Indebtedness clause (12) | Allows releveraging as earnings grow | Negative — Leverage Increase | Not assessed: no comparative source | E04 | d887611dex101.htm.jsonl, page 59 |
| General debt basket | Greater of USD 250m and 10.0% of Consolidated EBITDA | Permitted Indebtedness clause (13) | Grower basket expands with covenant earnings | Negative — Leverage Increase | Not assessed: no comparative source | E04 | d887611dex101.htm.jsonl, page 59 |
| Foreign subsidiary debt | Greater of USD 450m and 18.0% of Consolidated EBITDA | Permitted Indebtedness clause (14) | Structurally senior claims at non-guarantors | Negative — Leverage Increase | Not assessed: no comparative source | E04 | d887611dex101.htm.jsonl, page 60 |
| Securitisation debt | Greater of USD 725m and 20.0% of Consolidated EBITDA, non-recourse | Permitted Indebtedness clause (18) | Receivables move outside collateral | Negative — Liquidity Deterioration | Not assessed: no comparative source | E04 | d887611dex101.htm.jsonl, page 60 |
| Incremental facilities and MFN | Incremental at CNLR 7.25x and CSNDR 5.00x; 50 bp MFN lapsing 18 months after each amendment and excluding acquisition debt and later-maturing debt | Section 2.24 | Pari dilution; pricing protection lapses | Negative — Leverage Increase | Not assessed: no comparative source | E09 | d887611dex101.htm.jsonl, pages 144–146 |
| Restricted payments, ratio | Unlimited if no default and CNLR not above 6.75x pro forma including financing | Section 6.02 final paragraph | Debt-funded distributions without consent | Negative — Leverage Increase | Not assessed: no comparative source | E03 | d887611dex101.htm.jsonl, page 181 |
| Restricted payments, declared dividend | Payment within 60 days of declaration if permitted at declaration | Section 6.02(1) | Locks capacity at declaration date | Negative — Liquidity Deterioration | Not assessed: no comparative source | E03 | d887611dex101.htm.jsonl, page 178 |
| Restricted payments, general and management | General greater of USD 75m and 3.0%; dividend equivalents and repurchases capped annually with carry-forward | Section 6.02(4) and (7) | Small recurring leakage | Neutral — Stable | Not assessed: no comparative source | E03 | d887611dex101.htm.jsonl, pages 179–180 |
| Investments | Unrestricted subsidiaries greater of USD 250m and 10.0%; general greater of USD 500m and 25.0% of Total Assets; joint ventures greater of USD 1,000m and 40.0%; unlimited at CNLR 5.75x | Permitted Investments | Value can leave guarantor and collateral group | Negative — Covenant Erosion | Not assessed: no comparative source | E05 | d887611dex101.htm.jsonl, pages 61–63 |
| Unrestricted subsidiaries | Only newly acquired or newly formed subsidiaries may be designated; certified compliance; no recourse debt | Unrestricted Subsidiary definition | Limits redesignation of existing operating companies | Neutral — Stable | Not assessed: no comparative source | E11 | d887611dex101.htm.jsonl, page 81 |
| EBITDA add-backs | Uncapped non-recurring, integration, transaction and refinancing items; projected savings within 24 months capped at 25% | Consolidated EBITDA definition | Inflates all grower and ratio capacity | Negative — Covenant Erosion | Not assessed: no comparative source | E06 | d887611dex101.htm.jsonl, pages 24–26 |
| Collateral release | Automatic on permitted disposition, guarantor release, suspension periods; all-collateral release needs each lender | Section 9.02(b)(G) and (c) | Collateral can shrink through permitted transactions | Neutral — Stable | Not assessed: no comparative source | E10 | d887611dex101.htm.jsonl, pages 205–207 |
| Amendments, bank | Required Lenders generally; each lender for economics, sharing, voting, material guarantor and all-collateral release; no express subordination consent in reviewed text | Section 9.02(b) | Uptier risk not expressly blocked | Negative — Covenant Erosion | Not assessed: no comparative source | E10 | d887611dex101.htm.jsonl, pages 204–205 |
| Restricted payments, 2033 notes | Unlimited if FCCR exceeds 2.0x; builder from 2010 | Indenture Section 4.07 | Notes add little constraint beyond bank test | Negative — Covenant Erosion | Not assessed: no comparative source | E13 | d887611dex41.htm.jsonl, pages 70–76 |
| Debt and liens, 2033 notes | Ratio debt at FCCR above 2.0x, USD 400m cap at non-guarantors; secured ratio debt at CSNDR 5.25x | Indenture Section 4.09; Permitted Liens (xxxi) | Looser secured capacity than bank | Negative — Leverage Increase | Not assessed: no comparative source | E14 | d887611dex41.htm.jsonl, page 79; d887611dex41.htm.jsonl, page 43 |
| Amendments, 2033 notes | Majority; two-thirds for collateral release or adverse intercreditor change; each holder for ranking | Indenture Section 9.02 | Ranking protection for noteholders | Neutral — Stable | Not assessed: no comparative source | E15 | d887611dex41.htm.jsonl, pages 116–118 |
| Subordinated payment blockage | Up to 179 days, once per 360 days | 2027 indenture Section 10.03 | Junior cash interrupted in stress | Negative — Liquidity Deterioration | Not assessed: no comparative source | E18 | d826058dex41.htm.jsonl, page 107 |

### Step 4 to 8 provision findings

| Provision | Source | Summary | Risk mechanic | PD effect | LGD / recovery effect | Monitoring implication | Credit implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Consolidated EBITDA definition | Amended credit agreement, Rank 1 | Broad add-backs plus capped projected savings | Grower and ratio baskets scale with adjusted earnings | Moderate: more releveraging room | High: more pari debt in pool | Track add-backs in certificates | Negative — Covenant Erosion | Medium | E06 |
| Restricted payments ratio basket | Amended credit agreement, Rank 1 | Unlimited at 6.75x | Cash leaves before creditors | High: demonstrated recap | Moderate: lower cash cushion | Track declarations | Negative — Leverage Increase | High | E03 |
| Pari secured ratio debt | Amended credit agreement, Rank 1 | 5.00x secured net | Pari dilution of collateral | Moderate | High | Track incremental agreements | Negative — Leverage Increase | High | E04; E09 |
| Investments into unrestricted subsidiaries | Amended credit agreement, Rank 1 | Up to general basket into newly formed subsidiaries | Drop-down then guarantee release | Low near term | High if used | Track designations | Negative — Covenant Erosion | Medium | E05; E11; E16 |
| Collateral and guarantee | Annual report and indenture, Rank 1 and supplementary | First lien on assets including cash; domestic guarantors | Ratable sharing in pari pool | Low | Moderate: non-guarantor value outside | Track guarantor changes | Neutral — Stable | Medium | E17; E19; E20 |
| Defaults and amendments | Amended credit agreement and indenture, Rank 1 | Springing default chain; Required Lenders control | Late acceleration; uptier not expressly blocked | Moderate | Moderate | Track amendments | Negative — Covenant Erosion | Medium | E02; E10; E15 |

### Definition and conflicts register

| Item | Figures and roles | Conflict | Resolution | Source |
|---|---|---|---|---|
| Covenant debt versus carrying debt | Carrying total debt USD 24,880m; contractual gross USD 25,068m; covenant Consolidated Total Indebtedness not supplied | Covenant figure differs in basis and perimeter | Covenant definition governs tests; proxies use carrying debt and are labelled | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 26 |
| Secured debt basis | Identified secured carrying USD 19,534m; principal USD 19,702m; difference USD 168m | Principal basis gives higher secured ratio | Proxy uses carrying value; principal shown as alternative | Financial foundation (CP-1); calculation L16 |
| Covenant earnings | EBITDA As Defined USD 4,173m; covenant Consolidated EBITDA and Financial Covenant Consolidated EBITDA not supplied | Different add-back sets | No substitution as covenant figure; proxy only | Financial foundation (CP-1); d887611dex101.htm.jsonl, pages 24–26 |
| September 2024 recapitalisation, multi-figure | Tranche L USD 1,500m; 2033 notes principal USD 1,500m, carrying USD 1,486m; new secured debt USD 3,000m; dividend USD 4,216m plus equivalents USD 132m, total USD 4,348m | Debt, payment and carrying roles differ | All figures kept by role; no single figure chosen | Business & governance (CP-1A); Financial foundation (CP-1); calculation L17 |
| Securitisation, multi-figure | Covenant basket greater of USD 725m and 20.0%; commitment USD 650m; drawn USD 487.5m; carrying USD 486m | Capacity, commitment, draw and carrying roles differ | All kept by role | d887611dex101.htm.jsonl, page 60; Financial foundation (CP-1) |
| Non-debt funding float | Contract liabilities USD 177m; dividend payable USD 4,216m at year-end | Inclusion in Indebtedness definition not established | Treated as outside covenant debt pending definition; float flagged | Financial foundation (CP-1) |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| Distribution capacity | Unlimited payments at 6.75x; 2.0x coverage in 2033 notes; USD 4,348m paid October 2024 | Cash cushion transferred to equity | Higher: less liquidity buffer in downturn | Moderate: lower cash collateral | Declarations and ratio certificates | E03; E13 | d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75 |
| Pari secured incurrence | 5.00x bank, 5.25x indenture | More claims on same collateral | Moderate: interest burden rises | High: pari dilution | Incremental and note issuance | E04; E14 | d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 43 |
| Maintenance covenant | Revolver-only, springing at 40% | No early default trigger | Higher: deterioration detected late | Moderate: value erodes before control shifts | Quarter-end revolver usage | E01 | d887611dex101.htm.jsonl, page 188 |
| EBITDA add-backs | Uncapped categories; 25% savings cap | Inflated ratios | Moderate | Moderate | Add-back trend | E06 | d887611dex101.htm.jsonl, pages 24–26 |
| Investments and unrestricted subsidiaries | General basket greater of USD 500m and 25% of Total Assets | Drop-down route | Low near term | High if used | Designations and asset transfers | E05; E11 | d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81 |
| Subordination | 179-day blockage; Designated Senior Debt | Junior payments stop in stress | Higher for subordinated notes | High for subordinated notes | Blockage notices | E17; E18 | d826058dex41.htm.jsonl, page 107 |
| Collateral and release | Each-lender all-collateral release; two-thirds for notes | Protects pool against consensual stripping | Neutral | Supportive for secured | Amendment filings | E10; E15 | d887611dex101.htm.jsonl, page 205; d887611dex41.htm.jsonl, page 118 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All topics | Provisions in the covenant feature register | Not supplied: no market-norm or covenant-review source in the source set | Not assessed: market-norm comparison skipped | Not assessed: no comparator to agree or disagree | Insufficient Information | E01–E18 |

Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided.

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only 7.50x springing above 40% usage; term loans and notes none | No early tripwire | Negative — Covenant Erosion | High | E01; E19 |
| Debt / lien incurrence capacity | 4 | 7.25x net and 5.00x secured; 5.25x and 2.0x in notes; grower baskets; MFN sunset | Repeated pari releveraging | Negative — Leverage Increase | High | E04; E09; E14 |
| RP / investment / leakage capacity | 4 | Unlimited payments at 6.75x and 2.0x; 25% of Total Assets investments; demonstrated recap | Value leaves restricted group | Negative — Leverage Increase | High | E03; E05; E13 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped non-recurring categories; 25% savings cap over 24 months | Inflates all ratio capacity | Negative — Covenant Erosion | Medium | E06 |
| Collateral / guarantor protection | 3 | First lien including cash; each-lender all-collateral release; non-guarantor share about 20.73% of sales; designation limited to new subsidiaries | Some value outside pool | Neutral — Stable | Medium | E10; E11; E20 |
| Amendment / control mechanics | 3 | Required Lenders; sacred rights for sharing, voting, release; noteholder ranking right; no express bank subordination right in reviewed text | Uptier not expressly blocked | Negative — Covenant Erosion | Medium | E10; E15 |
| Overall | 4 | Weighted to distribution and debt capacity | Policy-driven releveraging | Negative — Leverage Increase | Provisional | E01–E15 |

Covenant Aggressiveness Score: 4/5 (Aggressive). Status: Provisional, because the intercreditor agreement, collateral documents and compliance data are missing.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further distribution declaration | Restricted payments ratio basket at 6.75x | Repeats September 2024 recap | PD up; RV weaker for all classes | Track board declarations and 60-day payment windows | E03 |
| New pari secured issuance | CSNDR 5.00x bank, 5.25x notes | Dilutes first-lien pool | LGD up for secured | Track incremental assumption agreements and joinders | E04; E09; E14 |
| Revolver usage near 40% at quarter-end | Springing test | Activates 7.50x test | PD signal | Track quarter-end revolver and letters of credit | E01 |
| Material acquisition | Step-up to 8.00x for four quarters | Loosens only maintenance test | PD up | Track acquisitions and certificates | E01; E05 |
| Unrestricted designation of a new subsidiary | Investments and designation provisions | Guarantee release and asset transfer | LGD up | Track officers' certificates and asset transfers | E05; E11; E16 |
| Amendment touching lien or payment priority | Required Lenders control; no express subordination right | Uptier route | LGD up for non-participants | Track amendment filings | E10 |
| Payment blockage notice | Subordinated indenture | Junior cash stops | PD up for subordinated notes | Track trustee notices | E18 |
| Add-back growth | Consolidated EBITDA | Inflates capacity | PD and LGD up | Compare covenant and reported earnings | E06 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor | First Lien Intercreditor Agreement and joinders | Controls enforcement, turnover and release | Intercreditor registers carry missing-document cells | Obtain executed agreement and joinders |
| Compliance | Compliance certificates and covenant-earnings calculation | Exact headroom | Headroom shown as proxies | Obtain latest certificate |
| Security | Guarantee and collateral agreement, schedules, guarantor exhibit | Collateral perimeter and exclusions | Collateral matrix qualitative | Obtain documents and schedules |
| Usage | Basket-usage records | Remaining capacity | Capacity gross only | Obtain usage tracker |
| Other indentures | 2028 to 2032 secured and 2029 subordinated indentures | Instrument-specific terms | Assumed similar per issuer | Obtain indentures |
| Definitions | Consolidated Total Indebtedness, Total Assets, Fixed Charge Coverage definitions | Ratio inputs | Proxies only | Read full definitions |
| Refinancing assessment | Liability-management analysis not supplied | Overlay of legal capacity on maturity needs | Overlay limited | Run with refinancing assessment |
| Market comparator | Covenant-review or market-norm source | Relative assessment | Market-norm register skipped | Obtain comparator |

### T4D.1 Entity evidence source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Amended credit agreement | Executed | 1 | Collateral and guarantee agreement not supplied | Completed with Limitations |
| 2033 secured notes indenture | Executed | 1 | Guarantor list by exhibit not supplied | Completed with Limitations |
| Annual report guarantor information and obligor summary | Filed | Supplementary | Accounting summary, not legal perimeter; income lines not reconciled | Completed with Limitations |
| Guarantor exhibit, organisation chart, security schedules | Not in source set | Not ranked: not supplied | Perimeter partly inferred from issuer description | Completed with Limitations |
| Subsequent perimeter events | None identified in reviewed pages | Not ranked: scan of reviewed pages only | October 2024 securitisation draw is financing, not a perimeter change | Completed with Limitations |

### T4D.2 Restricted and unrestricted entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware, United States | Listed public company | Holdings; not subject to designation | No significant operations or assets beyond investment in TransDigm Inc. | Yes | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; Business & governance (CP-1A) |
| TransDigm Inc. | Borrower and note issuer | Delaware, United States | TransDigm Group Incorporated | Borrower | Obligor-group current assets USD 7,813m, goodwill USD 8,186m, other non-current USD 3,889m, combined with guarantors | Yes | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| TransDigm UK | Guarantor of 2028 secured and subordinated notes | Not established in reviewed pages; name indicates United Kingdom | Not established in reviewed pages | Restricted | — included in obligor-group totals | Yes | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58 |
| Domestic restricted subsidiaries | Guarantors | United States | TransDigm Inc. | Restricted; newly formed or acquired ones designatable | — included in obligor-group totals | Yes | E11; E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; d887611dex101.htm.jsonl, page 81 |
| Foreign restricted non-guarantor subsidiaries | Non-guarantors | Various, not established | TransDigm Inc. group | Restricted | About USD 1,646m of FY2024 sales by difference; net USD 1,881m due from them to obligors | No | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation L15 |
| Securitisation entity | Receivables vehicle | Not established | Not established | Securitisation Entity | Transferred domestic receivables backing USD 487.5m drawn | No | E04 | d887611dex101.htm.jsonl, page 60; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Unrestricted subsidiaries | Unrestricted | Not established | Not established | None identified in reviewed pages | — not disclosed | No | E11 | d887611dex101.htm.jsonl, page 81 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID | Source |
|---|---|---|---|---|---|
| TransDigm Group × credit facility | Holdings guarantee, senior secured | Upstream | Release under credit agreement and collateral agreement; failure is a default | E02 | d887611dex101.htm.jsonl, page 191 |
| TransDigm Group × 2033 secured notes | Senior secured | Upstream | Defeasance or discharge | E16 | d887611dex41.htm.jsonl, page 122 |
| TransDigm Group × subordinated notes | Senior subordinated unsecured | Upstream | Not established for subordinated indentures | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 57 |
| TransDigm UK × 2028 and 2029 to 2033 secured notes | Senior secured | Cross-stream | Sale, unrestricted designation, release under credit facilities and capital-markets debt | E16; E20 | d887611dex41.htm.jsonl, page 122; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| TransDigm UK × subordinated notes | Senior subordinated unsecured | Cross-stream | Not established for subordinated indentures | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 57 |
| Domestic restricted subsidiaries × secured notes | Senior secured | Downstream from parent group to issuer debt | Sale, unrestricted designation, immaterial status, release under credit facilities | E16; E20 | d887611dex41.htm.jsonl, page 122 |
| Domestic restricted subsidiaries × credit facility | Senior secured, inferred from note guarantor test | Downstream | Material guarantor release needs each lender unless otherwise permitted | E10; E20 | d887611dex101.htm.jsonl, page 205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Foreign non-guarantor subsidiaries × all tranches | No guarantee | Not applicable: no guarantee | Not applicable: no guarantee | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |

### T4D.4 Collateral by entity and lien

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID | Source |
|---|---|---|---|---|---|
| TransDigm Inc. × first lien | Not established: excluded-asset schedule not supplied; collateral includes available cash | Automatic on permitted disposition; all-collateral release needs each lender or two-thirds of 2033 holders | Mortgage and control-agreement suspension periods; terms not read | E10; E15; E19 | d887611dex101.htm.jsonl, pages 205–207; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| TransDigm Inc. × junior lien | — none outstanding; agent may document junior liens without lender consent | Not applicable: no junior lien | Not applicable: no junior lien | E10 | d887611dex101.htm.jsonl, page 205 |
| TransDigm Group × first lien | Not established | Holdings acts as grantor under security documents | Not established | E17 | d887611dex41.htm.jsonl, page 95 |
| TransDigm Group × junior lien | — none outstanding | Not applicable: no junior lien | Not applicable: no junior lien | E10 | d887611dex101.htm.jsonl, page 205 |
| Domestic restricted subsidiaries × first lien | Not established | Released with guarantee release | Not established | E10; E16 | d887611dex101.htm.jsonl, page 207 |
| Domestic restricted subsidiaries × junior lien | — none outstanding | Not applicable: no junior lien | Not applicable: no junior lien | E10 | d887611dex101.htm.jsonl, page 205 |
| TransDigm UK × first lien | Not established; separate UK collateral agent referenced | Foreign documents amendable by agent for local law | Local-law limits not established | E10; E17 | d887611dex101.htm.jsonl, page 207; d887611dex41.htm.jsonl, page 32 |
| TransDigm UK × junior lien | — none outstanding | Not applicable: no junior lien | Not applicable: no junior lien | E10 | d887611dex101.htm.jsonl, page 205 |
| Foreign non-guarantors × first lien | — outside collateral | Not applicable: not a grantor | Not applicable: not a grantor | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Securitisation entity × first lien | — transferred receivables outside collateral | Not applicable: not a grantor | Not applicable: not a grantor | E04 | d887611dex101.htm.jsonl, page 60 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with holdings and domestic guarantors | Obligor-group assets and first-lien collateral including cash | Pari | Non-guarantor subsidiary value, about USD 1,646m of sales | Shares pool ratably with secured notes, subject to intercreditor terms not supplied | Medium | E17; E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; d887611dex41.htm.jsonl, page 30 |
| 2028 to 2033 secured notes | TransDigm Inc. with same guarantors | Same pool | Pari | Same non-guarantor value | Equal to loans in payment; enforcement through collateral agent | Medium | E17; E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; d887611dex41.htm.jsonl, page 128 |
| All issuer-level debt versus non-guarantor creditors | Foreign restricted subsidiaries | Their own assets first | Structurally Subordinated — Non-Guarantor Value | Non-guarantor assets and about USD 1,646m sales; net USD 1,881m intercompany receivable | Equity residual and intercompany claim only | Medium | E20 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59 |
| Senior subordinated notes | TransDigm Inc. with subordinated guarantees | Residual after senior debt | Contractually Subordinated | Same non-guarantor value; collateral value reserved to senior | Recovers after all senior claims; blockage up to 179 days | High | E18; E20 | d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 57 |
| Securitisation lenders | Securitisation entity | Transferred receivables | Structurally Senior | Receivables removed from first-lien pool | Ahead of first lien on those receivables | Medium | E04 | d887611dex101.htm.jsonl, page 60 |

### T4D.6 Leakage route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distribution to shareholders | TransDigm Inc. to holdings to shareholders | Restricted payments ratio basket, E03 | Proxy USD 9,548.75m at year-end before USD 4,348m October payment | 4 | Cash collateral and cushion leave | Demonstrated | E03 |
| Investment into newly formed unrestricted subsidiary | TransDigm Inc. to new unrestricted subsidiary | General investments and designation, E05 and E11 | Proxy USD 6,396.50m general basket; USD 417.30m dedicated basket | 4 | Assets leave pool; guarantee released | Theoretical | E05; E11; E16 |
| Investment in non-guarantor restricted subsidiaries | Guarantors to foreign restricted subsidiaries | Permitted Investments clause (1)(a), E05 | Not capped in reviewed text | 3 | Value moves behind non-guarantor creditors | Theoretical | E05 |
| Asset sale out of group | Guarantor to third party | Collateral auto-release on permitted disposition, E10 | Not quantified | 3 | Collateral replaced by proceeds subject to asset-sale terms | Theoretical | E10 |
| Joint ventures | Group to joint venture | Joint-venture basket at 7.00x, E05 | Proxy USD 1,669.20m | 3 | Value outside pool | Theoretical | E05 |

### T4D.7 Priming exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by Required Lender amendment | Bank amendment section lacks express subordination consent in reviewed text, E10 | Non-participating term lenders | Theoretical; pro rata sharing changes still need each lender | Priming-Exposed (uptier capable), contested | Low | E10 |
| Non-pro rata prepayment offers | Required Lenders may allow offers to all lenders of a class, E10 | Term lenders | Theoretical; offers must be made to all class lenders | Limited priming effect | Medium | E10 |
| Drop-down trapdoor | Investments into newly formed unrestricted subsidiary, E05 and E11 | All secured and subordinated classes | Theoretical | Leakage-Exposed (drop-down capable) | Medium | E05; E11 |
| Pari dilution | Pari secured ratio debt and agent intercreditor power, E04 and E10 | Existing first-lien creditors | Demonstrated, September 2024 | Pari, diluted | High | E04; E10; E12 |
| Noteholder ranking change | Each-holder ranking right, E15 | 2033 secured noteholders | Protected | Pari | High | E15 |

### T4D.8 Structural gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Guarantor exhibit | Exact guarantor perimeter | Entity rows grouped | Obtain exhibit |
| Collateral perimeter | Guarantee and collateral agreement and schedules | Excluded assets and suspension periods | Collateral matrix qualitative | Obtain documents |
| Entity value | Asset and earnings split by non-guarantor | Stranded value size | Sales-based approximation only | Obtain entity financials |
| Obligor income | Obligor-group income lines not reconciled to consolidated results | Earnings location | Not used for structural view | Obtain full summary table |
| Intercreditor | First Lien Intercreditor Agreement | Enforcement and release | Intercreditor registers limited | Obtain agreement |

### T4F.1 Intercreditor controlling documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders 1 to 6 | TransDigm Inc., holdings, subsidiary guarantors, credit-agreement collateral agent, existing secured-note trustees and collateral agents, 2033 trustee and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced; not in source set | d887611dex41.htm.jsonl, page 30 | E17 |
| Amended credit agreement | TransDigm Inc., holdings, lenders, agent | Annex to amendment dated 2024-09-19 | New York | Executed | d887611dex101.htm.jsonl, page 222 | E23 |
| 2033 secured notes indenture | TransDigm Inc., holdings, guarantors, trustee, notes collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, page 126 | E17 |
| 2027 subordinated notes indenture | TransDigm Inc., holdings, guarantors, trustee | 2019-11-13 | Not verified in reviewed pages | Executed | d826058dex41.htm.jsonl, page 107 | E18 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving and term lenders | Senior secured, pari | First lien | Agent on Required Lenders' request; financial covenant default first for revolving lenders | [Insufficient Information] — ICA not in the source set | E02; E17 |
| Secured noteholders | Senior secured, pari | First lien | Only through notes collateral agent | [Insufficient Information] — ICA not in the source set | E17 |
| Senior subordinated noteholders | Contractually subordinated | Unsecured | Acceleration subject to notice to senior; payment blockage | Not applicable: no collateral vote | E18 |
| Securitisation lenders | Structurally senior on receivables | Receivables in vehicle | Under facility documents not supplied | Not applicable: outside first-lien pool | E04 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement control | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Secured noteholders and lenders | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | E17 |
| Noteholder direct-action bar | No direct action by holders at any time | Any enforcement of security | Notes collateral agent acting under intercreditor agreements | Secured noteholders | Noteholders depend on agent and controlling party | Negative — Covenant Erosion | E17 |
| Subordinated payment blockage | Up to 179 days; one per 360 days; 181 clear days | Blockage notice for non-payment senior default | Representative of Designated Senior Debt | Subordinated noteholders | Junior interest stops in stress | Negative — Liquidity Deterioration | E18 |
| Financial covenant default | Until revolver termination or acceleration | Breach of 7.50x test at tested quarter-end | Required Revolving Lenders | Term lenders and noteholders via cross-default | Others wait for revolving lenders | Negative — Covenant Erosion | E02 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| First-lien turnover and release | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Indenture requires two-thirds to release substantially all collateral | E15; E17 |
| Bank collateral release | Not applicable: release provision | Each lender for all collateral; automatic for permitted dispositions | Not applicable: no purchase option in provision | Disposition compliant with agreement | Agent may rely on officer certificate | E10 |
| Note guarantee release | Not applicable: release provision | Automatic when released under credit facilities and capital-markets debt | Not applicable: no purchase option in provision | Release not by payment | Reinstated if bank guarantee reinstated | E16 |
| Subordinated turnover | Distribution must be paid over to senior; text not reviewed | Not applicable: unsecured | Not applicable: unsecured | Subordination article | Section heading only reviewed | E18 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Lenders | Ratable share of first-lien pool, subject to intercreditor terms | Pool diluted by pari issuance without lender consent | High | More pari claims on same collateral | Negative — Leverage Increase | E04; E10 |
| Secured noteholders | Ratable share via collateral agent | No direct enforcement; controlling party not established | High | Timing and method set by another class | Negative — Covenant Erosion | E17 |
| Subordinated noteholders | Residual after all senior | Blockage and turnover | Critical | Payments stop and are turned over | Negative — Liquidity Deterioration | E18 |
| Securitisation lenders | Receivables in vehicle | Facility documents not supplied | Moderate | Outside pool | Insufficient Information | E04 |

### T4F.6 Intercreditor gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Executed First Lien Intercreditor Agreement and six joinders | Controlling party, standstill, turnover, purchase options | Enforcement rows marked missing | Obtain from filings |
| Subordinated turnover text | Full subordination article of 2027 indenture | Turnover scope | Summarised from heading | Read full article |
| Other subordinated indentures | January and May 2029 indentures | Blockage terms may differ | Assumed similar | Obtain indentures |

### T4C.2 Capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Amended credit agreement | Executed credit agreement | 2024-09-19 annex | Executed | Legal formula | Binding bank tests | E01–E12 |
| 1 | 2033 secured notes indenture | Executed indenture | 2024-09-19 | Executed | Legal formula | Note tests | E13–E17 |
| 3 | Compliance certificates | Not supplied: not in source set | Not supplied: not in source set | Missing | Usage and tested ratios | Exact headroom | E19 |
| Financial | Financial foundation | Supplied analysis of annual report | FY2024 | Accepted | Financial input | Proxy denominators and net debt | E22 |
| Supplementary | Annual report | Issuer filing | 2024-11-07 | Filed | Financial input and issuer covenant description | Compliance statement, trigger amount | E19–E21 |

### T4C.3 Covenant definitions and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | (Consolidated Total Indebtedness − Unrestricted Cash) / LTM Consolidated EBITDA, pro forma | Covenant debt, unrestricted cash, covenant EBITDA | Higher cash or earnings raise capacity | Borrowed cash held is netted | Negative — Covenant Erosion | E07 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | (Secured debt − Unrestricted Cash) / LTM Consolidated EBITDA | Secured debt, cash, EBITDA | Binds pari secured debt | Distributions reduce netting cash | Negative — Leverage Increase | E07 |
| Consolidated EBITDA | Credit agreement definitions | Net income plus tax, interest, non-cash, non-recurring, transaction, dividend-equivalent and capped savings add-backs | Add-back detail | Inflates every grower and ratio basket | Up to 25% savings uplift | Negative — Covenant Erosion | E06 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Similar add-backs for the maintenance test | Add-back detail | Inflates maintenance headroom | Delays covenant breach | Negative — Covenant Erosion | E08 |
| Unrestricted Cash | Credit agreement definitions | Unencumbered cash of holdings, borrower and restricted subsidiaries, loan-document liens allowed | Cash by entity | Nets all group cash | Cash pledged to lenders still counts | Neutral — Stable | E07 |
| Consolidated Total Indebtedness | Credit agreement definitions | Not reviewed | Definition text | Unknown treatment of leases, securitisation and float | Divergence from carrying debt | Insufficient Information | E07 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | Not reviewed; tested above 2.0x | Definition text | Unlimited payments and ratio debt | Coverage test loose at current earnings | Negative — Covenant Erosion | E13; E14 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver springing trigger: revolving exposure / commitments | max-ratio | 40.00% | 7.36% | USD 67m letters of credit, no revolving loans, over USD 910m commitments | 32.64% | Compliant | Assumes letters of credit not cash-collateralised; in dollars trigger USD 364m against USD 67m, USD 297m headroom | Maintenance test dormant until large revolver draw | Neutral — Stable | E01; E21 |
| Revolver Consolidated Net Leverage Ratio, legal definition | max-ratio | 7.50x | [Insufficient Information] — missing: current tested ratio under Financial Covenant Consolidated EBITDA and covenant net debt | (Consolidated Total Indebtedness − Unrestricted Cash) / Financial Covenant Consolidated EBITDA; 8.00x four quarters after Material Acquisition | [Insufficient Information] — missing: current tested ratio | Not Calculable | No compliance certificate; issuer states compliance | Breach only matters when trigger is met | Insufficient Information | E01; E08; E19 |
| Revolver net leverage, proxy on issuer description | max-ratio | 7.50x | 4.46x | Net debt USD 18,619m / EBITDA As Defined USD 4,173m | 3.04x | Compliant | Proxy; year-end before October payment; pro forma on this basis not established; Financial foundation pro forma USD 22,967m net debt, 6.02x on reported EBITDA | Wide proxy headroom delays control shift | Neutral — Stable | E01; E22 |
| Restricted payments ratio basket | max-ratio | 6.75x | 4.46x | Same proxy; test pro forma for payment and financing | 2.29x | Compliant | Proxy; October payment of USD 4,348m consumes capacity | Room for further distributions | Negative — Leverage Increase | E03; E22 |
| Incremental and junior or unsecured ratio debt | max-ratio | 7.25x | 4.46x | Same proxy | 2.79x | Compliant | Proxy; overlapping with secured capacity | Releveraging room | Negative — Leverage Increase | E04; E09; E22 |
| Pari secured debt incurrence | max-ratio | 5.00x | 3.18x | (USD 19,534m − USD 6,261m) / USD 4,173m | 1.82x | Compliant | Carrying basis; principal USD 19,702m; year-end cash before October payment | Binding limit on secured recap | Negative — Leverage Increase | E04; E22 |
| Unlimited investments basket | max-ratio | 5.75x | 4.46x | Same net proxy | 1.29x | Compliant | Also needs no revolving loans and at least USD 200m unrestricted cash | Leakage to non-guarantors | Negative — Covenant Erosion | E05; E22 |
| 2033 indenture fixed-charge coverage | min-ratio | 2.00x | 3.60x | EBITDA As Defined / net cash interest | 1.60x | Compliant | Indenture definition not reviewed; cash interest not fixed charges | Loose note payment test | Negative — Covenant Erosion | E13; E14; E22 |
| 2033 indenture secured ratio debt lien basket | max-ratio | 5.25x | 3.18x | Same secured proxy | 2.07x | Compliant | Proxy; looser than bank test | Bank test binds first | Negative — Leverage Increase | E14; E22 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Restricted payment capacity | Ratio basket | 6.75x × EBITDA − net debt | No default; pro forma with financing | Proxy EBITDA USD 4,173m; net debt USD 18,619m | October payment USD 4,348m declared before year-end | USD 9,548.75m proxy | Not supplied: post-payment residual not established | Provisional | Critical | Cash to equity | Negative — Leverage Increase | E03; E22 |
| Debt incurrence capacity | Junior or unsecured ratio debt | 7.25x × EBITDA − net debt | No default for subordinated debt | Same | Not supplied: usage record | USD 11,635.25m proxy | Not supplied: overlaps other baskets | Provisional | High | Releveraging | Negative — Leverage Increase | E04 |
| Lien capacity | Pari secured ratio debt | 5.00x × EBITDA − secured net debt | Same lien priority | Secured net debt USD 13,273m | Not supplied: usage record | USD 7,592m proxy | Not supplied: October payment reduces by up to USD 4,348m | Provisional | High | Pari dilution | Negative — Leverage Increase | E04 |
| Lien capacity | 2033 indenture secured ratio debt | 5.25x × EBITDA − secured net debt | Ratio Indebtedness under indenture | Same | Not supplied: usage record | USD 8,635.25m proxy | Not supplied: bank test binds first | Provisional | Moderate | Note test looser | Negative — Leverage Increase | E14 |
| Debt incurrence capacity | General basket | Greater of USD 250m and 10% EBITDA | None | Proxy EBITDA | Not supplied: usage record | USD 417.30m proxy | Not supplied: usage record | Formula Extracted Only | Moderate | Grower | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Foreign restricted subsidiaries | Greater of USD 450m and 18% EBITDA | Foreign restricted subsidiaries | Proxy EBITDA | Not supplied: usage record | USD 751.14m proxy | Not supplied: usage record | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Securitisation | Greater of USD 725m and 20% EBITDA | Non-recourse | Proxy EBITDA; drawn USD 487.5m | USD 487.5m drawn at year-end | USD 834.60m proxy | Not supplied: other securitisations not established | Ready with Limitations | Moderate | Receivables outside pool | Negative — Liquidity Deterioration | E04 |
| Debt incurrence capacity | Letters of credit bilateral | Greater of USD 35m and 1.5% EBITDA | Under ratio clause | Proxy EBITDA | Not supplied: usage record | USD 62.595m proxy | Not supplied: usage record | Formula Extracted Only | Low | Small | Neutral — Stable | E04 |
| Investment capacity | General investments | Greater of USD 500m and 25% of Total Assets | None | Consolidated assets USD 25,586m as proxy | Not supplied: usage record | USD 6,396.50m proxy | Not supplied: usage record | Provisional | High | Funds drop-down | Negative — Covenant Erosion | E05 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries | Greater of USD 250m and 10% EBITDA | Newly acquired or formed subsidiaries only | Proxy EBITDA | Not supplied: usage record | USD 417.30m proxy | Not supplied: usage record | Formula Extracted Only | Moderate | Designation route | Negative — Covenant Erosion | E05; E11 |
| Investment capacity | Joint ventures | Greater of USD 1,000m and 40% EBITDA | CNLR 7.00x, no default | Proxy EBITDA | Not supplied: usage record | USD 1,669.20m proxy | Not supplied: usage record | Formula Extracted Only | Moderate | Value outside pool | Negative — Covenant Erosion | E05 |
| Restricted payment capacity | General basket | Greater of USD 75m and 3% EBITDA | No default | Proxy EBITDA | Not supplied: usage record | USD 125.19m proxy | Not supplied: usage record | Formula Extracted Only | Low | Small leakage | Neutral — Stable | E03 |
| EBITDA add-back capacity | Projected cost savings | Up to 25% of post-adjustment EBITDA | 24 months | Proxy pre-adjustment USD 4,173m | Not supplied: usage not disclosed | USD 1,391m ceiling | Not supplied: usage not disclosed | Provisional | High | Inflates all ratios | Negative — Covenant Erosion | E06 |
| MFN protection | Incremental yield protection | 50 bp yield differential | 18-month sunset; acquisition and later-maturity carve-outs | Amendment effective dates | Not supplied: effective dates not established | Not applicable: pricing protection | Not supplied: sunset dates not established | Formula Extracted Only | Moderate | Repricing risk for existing lenders | Negative — Refinancing Risk | E09 |
| Guarantor / collateral release capacity | Release on permitted disposition | Automatic | Compliance with agreement | Not supplied: no disposal pipeline | Not supplied: usage record | Not applicable: transaction-dependent | Not applicable: transaction-dependent | Formula Extracted Only | Moderate | Collateral shrinkage | Neutral — Stable | E10; E16 |

Capacities overlap and are not additive; every proxy uses issuer adjusted earnings at the year-end balance before the October 2024 payment.

### T4C.6 Debt, lien and priming routes

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental or notes | 5.00x bank; 5.25x notes | Proxy USD 7,592m before October payment | Pari dilution | Moderate | High for secured | Secured tranches carry dilution risk | E04; E09; E14 |
| Junior or unsecured ratio debt | 7.25x | Proxy USD 11,635.25m | Layering above subordinated notes | Moderate | High for subordinated | Subordinated notes most exposed | E04 |
| Structurally senior foreign debt | Greater of USD 450m and 18% | Proxy USD 751.14m | Claims ahead at non-guarantors | Low | Moderate | Minor | E04 |
| Uptier by amendment | No express subordination consent in reviewed bank text | Theoretical | Non-pro rata priming | Low | High for non-participants | Monitor amendments | E10 |
| MFN sunset | 50 bp, 18 months | Sunset dates not established | Repricing without economic protection | Low | Low | Term-loan pricing risk | E09 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distributions | USD 4,348m paid October 2024 | Ratio basket 6.75x | Proxy USD 9,548.75m before payment; residual not established | Cash leaves collateral | Critical | Negative — Leverage Increase | E03 |
| Note-level distributions | Unlimited above 2.0x coverage | Indenture coverage test | Proxy coverage 3.60x | Bank test binds first | High | Negative — Covenant Erosion | E13 |
| Unrestricted subsidiary drop-down | Designation limited to new subsidiaries | General and dedicated investment baskets | Proxy USD 6,396.50m and USD 417.30m; usage not supplied | Guarantee and collateral released | High | Negative — Covenant Erosion | E05; E11; E16 |
| Non-guarantor transfers | Investments in restricted subsidiaries | Permitted Investments clause (1)(a) | Not capped in reviewed text | Value behind foreign creditors | Moderate | Negative — Covenant Erosion | E05 |
| Asset sales | Collateral auto-release | Asset-sale covenant | Not quantified | Collateral shrinks | Moderate | Neutral — Stable | E10 |

### T4C.8 Add-back inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Consolidated EBITDA clause (m) | 25% of post-adjustment EBITDA; 24 months; net of realised | Ceiling USD 1,391m on proxy | Adds USD 9,389.25m to 6.75x capacity at ceiling | PD and LGD up if used | E06 |
| Non-recurring, integration, restructuring | Clause (d) and net income exclusion (3) | Uncapped | Usage not disclosed | Repeated costs treated as one-off | Earnings quality challenge applies | E06 |
| Transaction and refinancing costs | Clause (e) | Uncapped | Usage not disclosed | Recurring financing costs added back | Inflates ratios | E06 |
| Non-cash and deferred compensation | Net income exclusion (11) | Uncapped | Usage not disclosed | Recurring compensation excluded | Inflates ratios | E06 |
| Dividend equivalents | Clause (k) | Uncapped | USD 132m paid October 2024 | Distributions to option holders added back | Inflates ratios after recaps | E06 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio-uncapped distributions | 6.75x bank and 2.0x notes tests | Repeat recap | Critical | High | Committee decision; Refinancing & LME | E03; E13 |
| Basket reclassification | Debt and payments may be divided and reclassified | Capacity stacking | High | High | Recovery & fulcrum | E04; E13 |
| Drop-down route | Investments into new unrestricted subsidiaries | Value stranding | High | Medium | Recovery & fulcrum | E05; E11 |
| Guarantee fall-away | Note guarantee follows bank release | Guarantee loss | Moderate | High | Security selection | E16 |
| Agent intercreditor power | Pari or junior liens without lender consent | Dilution | High | High | Security selection | E10 |
| Springing covenant | Revolver-only | Late signal | High | High | Downside | E01 |

### T4C.11 Capacity priority matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured debt at 5.00x | High | Moderate | Pari dilution funding distributions | Moderate | High | Track incremental agreements and joinders | E04 |
| 2 | Distribution ratio basket at 6.75x | Critical | Moderate | Cash to equity | High | Moderate | Track declarations | E03 |
| 3 | Add-back savings cap | High | Low | Ratio inflation | Moderate | Moderate | Compare covenant and reported earnings | E06 |
| 4 | General investments and unrestricted subsidiaries | High | Low | Drop-down | Low | High | Track designations | E05; E11 |
| 5 | Amendment control | Moderate | Moderate | Uptier | Low | High | Track amendments | E10 |

### T4C.12 Capacity gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Covenant earnings | Consolidated EBITDA calculation | Ratio capacity | Proxies only | Obtain certificate |
| Tested ratios | Compliance certificate | Exact headroom | Maintenance row not calculable | Obtain certificate |
| Usage | Basket tracker | Remaining capacity | Gross capacity only | Obtain tracker |
| Post-payment balance | October 2024 balance sheet | Residual capacity | Residual not established | Obtain quarter report |
| Definitions | Indebtedness and Total Assets | Numerators | Proxies on carrying debt and consolidated assets | Read definitions |
| MFN dates | Amendment effective dates | Sunset timing | Dates not established | Obtain effective-date notices |

### Material claim lineage

| Claim | Material claim | Strongest lineage | Source |
|---|---|---|---|
| A | Revolver-only springing covenant | Directly Sourced | d887611dex101.htm.jsonl, page 188 |
| B | Unlimited payments at 6.75x | Directly Sourced | d887611dex101.htm.jsonl, page 181 |
| C | Notes unlimited payments at 2.0x | Directly Sourced | d887611dex41.htm.jsonl, page 75 |
| D | Ratio debt at 7.25x and 5.00x | Directly Sourced | d887611dex101.htm.jsonl, page 59 |
| E | Add-back definitions | Directly Sourced | d887611dex101.htm.jsonl, page 24 |
| F | Sacred rights and release | Directly Sourced | d887611dex101.htm.jsonl, pages 204–207 |
| G | Noteholder protections | Directly Sourced | d887611dex41.htm.jsonl, pages 116–118 |
| H | Designation limited to new subsidiaries | Directly Sourced | d887611dex101.htm.jsonl, page 81 |
| I | Payment blockage | Directly Sourced | d826058dex41.htm.jsonl, page 107 |
| J | Springing usage 7.36% | Calculated | calculation L02 |
| K | Proxy capacities | Calculated | calculation L12 |
| L | Non-guarantor sales share | Calculated | calculation L15 |
| M | Secured test is binding pressure point | Analyst Inference | calculation L14 |
| N | Uptier not expressly blocked | Analyst Inference | d887611dex101.htm.jsonl, pages 204–205 |
| O | First-lien enforcement control | Insufficient Information | d887611dex41.htm.jsonl, page 30 |
| P | Exact covenant headroom | Insufficient Information | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

## Calculations

All amounts are USD millions unless stated; ratios are times. Proxy ratios use Financial foundation's year-end net debt and the issuer's EBITDA As Defined, not covenant-defined figures, and precede the October 2024 payment.

| ID | Period / units | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | 2024-09-30 | 910 × 0.40 | 364.00 | USD m | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| L02 | 2024-09-30 | 67 / 910 | 0.073626373626373626373626373626373626374; displayed 7.36% | fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L03 | 2024-09-30 | 40.00 − 7.36; 364 − 67 | 32.64 percentage points; USD 297m | pp; USD m | calculation L01; calculation L02 |
| L04 | FY2024 proxy | 7.50 − 4.46 | 3.04 | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 188 |
| L05 | FY2024 proxy | 6.75 − 4.46 | 2.29 | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 181 |
| L06 | FY2024 proxy | 7.25 − 4.46 | 2.79 | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 59 |
| L07 | FY2024 proxy | 5.75 − 4.46 | 1.29 | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 63 |
| L08 | 2024-09-30 proxy | 19534 − 6261 = 13273; 13273 / 4173 | 13273; 3.1806853582554517133956386292834890966, displayed 3.18x | USD m; x | Financial foundation (CP-1) |
| L09 | FY2024 proxy | 5.00 − 3.18; 5.25 − 3.18 | 1.82; 2.07 | x | calculation L08; d887611dex41.htm.jsonl, page 43 |
| L10 | FY2024 proxy | 3.60 − 2.00 | 1.60 | x | Financial foundation (CP-1); d887611dex41.htm.jsonl, page 75 |
| L11 | FY2024 proxy | 4173 × 0.10; × 0.03; × 0.18; × 0.20; × 0.40; × 0.015; 25586 × 0.25 | 417.30; 125.19; 751.14; 834.60; 1669.20; 62.595; 6396.50 | USD m | Financial foundation (CP-1); d887611dex101.htm.jsonl, pages 59–62; d887611dex101.htm.jsonl, page 180 |
| L12 | FY2024 proxy | 6.75 × 4173 = 28167.75; 28167.75 − 18619 | 9548.75 | USD m | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 181 |
| L13 | FY2024 proxy | 7.25 × 4173 = 30254.25; 30254.25 − 18619 | 11635.25 | USD m | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 59 |
| L14 | FY2024 proxy | 5.00 × 4173 = 20865.00; − 13273; 5.25 × 4173 = 21908.25; − 13273 | 7592.00; 8635.25 | USD m | calculation L08 |
| L15 | FY2024 | 6294 / 7940; 7940 − 6294; 1646 / 7940 | 0.79269521410579345088161209068010075567, displayed 79.27%; 1646; 0.20730478589420654911838790931989924433, displayed 20.73% | fraction; USD m; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L16 | 2024-09-30 | 8702 + 2100 + 2750 + 1450 + 1000 + 2200 + 1500; 19702 − 19534 | 19702; 168 | USD m | Financial foundation (CP-1) |
| L17 | September 2024 | 1500 + 1500 | 3000 | USD m | Business & governance (CP-1A) |
| L18 | FY2024 proxy | Cap x ≤ 0.25 × (4173 + x) gives 4173 / 3; 1391 × 6.75 | 1391; 9389.25 | USD m | d887611dex101.htm.jsonl, page 24; Financial foundation (CP-1) |
| L19 | 2024-09-30 | 2750 + 1450 + 1000 + 2200; 2727 + 1438 + 984 + 2180; 2650 + 1200 + 750 | 7400; 7329; 4600 | USD m | Financial foundation (CP-1) |

| Inherited input | Value | Unit | Source |
|---|---|---|---|
| Net debt, year-end | 18619 | USD m | Financial foundation (CP-1) |
| Net debt / EBITDA As Defined, year-end | 4.46 | x | Financial foundation (CP-1) |
| EBITDA As Defined, FY2024 | 4173 | USD m | Financial foundation (CP-1) |
| Cash and equivalents, year-end | 6261 | USD m | Financial foundation (CP-1) |
| Identified secured carrying debt | 19534 | USD m | Financial foundation (CP-1) |
| EBITDA As Defined / net cash interest | 3.60 | x | Financial foundation (CP-1) |
| October 2024 dividend and equivalents paid | 4348 | USD m | Financial foundation (CP-1) |
| Pro forma net debt after October 2024 payment | 22967 | USD m | Financial foundation (CP-1) |
| Pro forma net leverage on reported EBITDA after October 2024 payment | 6.02 | x | Financial foundation (CP-1) |
| Total assets, year-end | 25586 | USD m | Financial foundation (CP-1) |
| Obligor-group net sales | 6294 | USD m | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Consolidated net sales | 7940 | USD m | Financial foundation (CP-1) |

## Gaps

The gaps below restrict exact headroom, enforcement control and collateral perimeter, not the identification of the provisions themselves.

| Gap | Severity | What is missing | Conclusion affected | Resolution | Source |
|---|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement of 2019 and six joinders | Enforcement control, standstill, turnover, release and purchase options among first-lien classes | Obtain executed agreement and joinders | d887611dex41.htm.jsonl, page 30 |
| Covenant compliance | MATERIAL | Compliance certificate, covenant earnings, covenant debt and October 2024 balance | Exact headroom and post-payment residual capacity | Obtain latest certificate and quarter report | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Security and guarantee documents | MATERIAL | Guarantee and collateral agreement, schedules, guarantor exhibit, suspension-period definitions | Collateral perimeter, excluded assets, entity-level recovery access | Obtain documents | d887611dex101.htm.jsonl, page 207 |
| Basket usage | MINOR | Usage records for fixed and grower baskets | Remaining capacity | Obtain tracker | Source readiness (CP-0) |
| Other indentures | MINOR | 2028 to 2032 secured and 2029 subordinated indentures | Instrument-specific covenant differences | Obtain indentures | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Market comparator | MINOR | Covenant-review or market-norm source | Relative assessment | Obtain comparator | Source readiness (CP-0) |

Most-favoured-nation protection for each term-loan tranche lapses 18 months after the effective date of the amendment that created it, but those effective dates are not established in the pages reviewed, so no dated sunset is recorded. The 8.00x maintenance level applies for the first four fiscal quarters after a material acquisition closes; no such quarter count is dated here.
Basis: d887611dex101.htm.jsonl, page 144; d887611dex101.htm.jsonl, page 188

## Next module
The orchestrator selects the next module.
