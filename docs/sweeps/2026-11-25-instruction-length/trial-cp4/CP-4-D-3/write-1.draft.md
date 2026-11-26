## Request
Legal and covenant assessment of TransDigm Group Incorporated and its borrower TransDigm Inc., as of 2024-09-30, under the deep_credit_assessment pathway. Scope covers the controlling credit agreement and supplied indentures, covenant tests and capacity, leakage and priming routes, the guarantee and collateral perimeter and intercreditor control, without legal advice.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, with the conformed amended and restated credit agreement (dated June 4, 2014) annexed | 2024-09-19, agreement date | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling loan covenants: springing leverage test, events of default, debt and lien baskets, incremental and MFN terms, EBITDA add-backs, restricted payments, investments, unrestricted subsidiaries, amendments, collateral release and Tranche L conditions |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 | 2024-09-19, indenture date | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note debt and lien tests, EBITDA add-back cap, intercreditor references, enforcement limits, lien releases, amendment thresholds and covenant suspension |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordinated-note restricted payments, payment blockage, turnover and guarantee subordination |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Compliance statement, revolver usage trigger, guarantor information and guarantor-group summary, term-loan and revolver terms; retrospective evidence |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted source set, retrospective boundary and legal-coverage gaps |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt stack, principal by instrument, EBITDA measures, interest, post-dividend net debt and cash; no covenant figures |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Parent–borrower ownership, dividend declaration and payment dates, acquisition behaviour |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence challenge to adjusted EBITDA, used to judge add-back inflation of covenant earnings |

## Findings

### Bottom line
TransDigm's debt documents protect creditors mainly through incurrence ratios that the September recapitalisation shows to be permissive rather than binding: maintenance protection exists only for revolver lenders, so covenant-driven default risk is low while recovery dilution risk rises with each ratio-permitted secured layer.

The credit agreement permits pari passu secured debt up to 5.00x secured net leverage and the 2033 secured notes up to 5.25x, with unlimited dividends at 6.75x net leverage under the loans and a fixed-charge cover above 2.0x under the notes. Noteholders hold 55.83% of first-lien principal yet their liens follow bank-lender releases under an intercreditor agreement that is not in the source set. The springing 7.50x test was not triggered: revolver exposure was 7.36% of commitments against a 40% trigger. Tested covenant ratios and basket usage are not disclosed, so ratio headroom is not established.
Basis: d887611dex101.htm.jsonl, pages 58–60; d887611dex101.htm.jsonl, pages 179–181; d887611dex101.htm.jsonl, page 188; d887611dex41.htm.jsonl, page 43; d887611dex41.htm.jsonl, pages 136–137; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; calculation L01; calculation L07

### Key findings
- **Maintenance protection is effectively absent for term lenders and all noteholders.** The only financial maintenance test is a 7.50x net leverage ceiling, rising to 8.00x for four quarters after a material acquisition, that applies only when revolver exposure exceeds 40% of commitments and only for revolving lenders. A breach becomes a term-loan default only after revolving lenders terminate or accelerate, and only revolving lenders can amend the test. At year-end the trigger had 32.64 percentage points of room, so the first observable early-warning signal for most creditors is a payment default or a cross-default, not a covenant trip.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 191–193; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L01; calculation L03
- **Secured debt capacity is ratio-led and expands with add-back-inflated earnings.** Incremental loans and pari passu secured debt need 5.00x secured net leverage and 7.25x total net leverage under the loans; the 2033 indenture adds a USD 3,100 million credit-facility basket, a 5.25x secured lien ratio and ratio debt at a fixed-charge cover above 2.0x. Cost-savings add-backs are capped at 25.0% of covenant EBITDA under the loans and 35.0% under the 2033 notes, over 24 months, on top of uncapped transaction, refinancing and dividend-equivalent add-backs that the earnings-quality review treats as recurring. Each turn of add-back inflation enlarges every ratio basket at once, diluting existing first-lien recovery.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, pages 58–60; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, page 16; d887611dex41.htm.jsonl, page 33; d887611dex41.htm.jsonl, page 43; d887611dex41.htm.jsonl, page 79; Earnings quality (CP-1D)
- **Dividend capacity has been demonstrated, not merely drafted.** The Tranche L proceeds, the 2033 notes and cash funded a USD 4,348 million dividend, 57.97 times the USD 75 million floor of the fixed general dividend basket, so the payment must have relied on the unlimited basket that requires net leverage of no more than 6.75x after the dividend and its financing; that reliance is an inference from basket sizes, not a disclosed certificate. On analytical inputs, post-dividend net debt is 5.50x the issuer's adjusted EBITDA, but that is not the covenant ratio.
Basis: d887611dex101.htm.jsonl, pages 1–4; d887611dex101.htm.jsonl, pages 179–181; Business & governance (CP-1A); Financial foundation (CP-1); calculation L09; calculation L14
- **The weakest protection is lender control over priority, not the covenants themselves.** Under the credit agreement, holders of more than 50% of loans and commitments, USD 4,806 million of a USD 9,612 million voting base, can amend all terms except listed each-lender rights; that list protects pro rata sharing, release of all or substantially all collateral and of material guarantors, but contains no express protection against subordinating the loans' lien or payment priority, and majority lenders can authorise non-pro-rata class-wide offers. The agent can add pari passu or junior intercreditor arrangements without lender consent. This makes an uptier of non-participating term lenders a theoretical, not demonstrated, route.
Basis: d887611dex101.htm.jsonl, page 71; d887611dex101.htm.jsonl, pages 204–206; calculation L06
- **First-lien noteholders carry most of the secured principal but little of the control.** The 2033 notes cannot be enforced directly by holders, their collateral release follows any bank-agent release other than a full cash discharge, and the indenture defers to an intercreditor agreement dated 2019-02-13 that is not supplied. Against that, holders have each-holder protection against adverse changes to ranking and need two-thirds consent to release substantially all collateral. Recovery control therefore sits with bank lenders even though noteholders hold USD 11,000 million of USD 19,702 million first-lien principal.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, pages 117–118; d887611dex41.htm.jsonl, page 128; d887611dex41.htm.jsonl, pages 135–137; calculation L07
- **Structural subordination is material but bounded by guarantee drafting.** Non-guarantor subsidiaries generated USD 1,646 million, or 20.73%, of FY2024 sales; foreign subsidiaries contribute only 65% of voting equity as collateral. All domestic restricted subsidiaries other than immaterial ones must join as guarantors, non-guarantor ratio debt under the 2033 notes is capped at USD 400 million, and foreign subsidiary debt under the loans at the greater of USD 450 million and 18.0% of covenant EBITDA. Unlimited investments in restricted subsidiaries, including non-guarantors, and unrestricted-subsidiary designation remain the open drop-down routes.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex101.htm.jsonl, pages 60–62; d887611dex101.htm.jsonl, pages 173–174; d887611dex41.htm.jsonl, page 79; calculation L04

### Contrary evidence and what would change the view
The strongest contrary evidence is that the documents have never been used against creditors in the record supplied. The issuer states compliance with all debt covenants at year-end, the September financing closed only after an officer certified 7.25x total and 5.00x secured net leverage, and the 2033 notes, unusually, require each holder's consent to any adverse change in ranking. Releasing all or substantially all collateral needs every lender under the loans and two-thirds of 2033 holders, and non-guarantor and foreign debt baskets are capped in money terms. On analytical proxies, post-dividend secured net debt is about 4.22x adjusted EBITDA, below the 5.00x secured test, which suggests the dividend did not exhaust secured capacity. The view would soften if disclosed covenant ratios showed wide headroom with little add-back reliance, if the intercreditor agreement gave noteholders shared enforcement control or blocked bank-only releases, or if an amendment added anti-subordination protection to the loans. It would harden on revolver usage above 40% of commitments, any designation of an unrestricted subsidiary, a majority-lender amendment touching pro rata or lien terms, or a further ratio-funded dividend.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, pages 3–4; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 117–118; calculation L11

### Limitations
- The intercreditor agreement is referenced but not supplied, so the conclusion that bank lenders control first-lien enforcement rests on the indenture's deference and release mechanics; its standstill, turnover and voting terms could make noteholders' recovery control better or worse than stated.
- No compliance certificate or disclosed covenant ratio is available, so every ratio-test headroom in this assessment is not established and the conclusion that the dividend used the 6.75x basket is an inference from basket sizes; a certificate could show a different basket route or narrower headroom.
- Indentures for the 2028 to 2032 secured notes and the 2029 subordinated notes were not supplied, so their thresholds are extended from the two supplied indentures and the issuer's statement that covenants are substantially similar; specific add-back caps or each-holder protections could differ by series and change series-level relative value.
- The current guarantee and collateral agreement, its excluded-asset definitions and the issuer's guarantor list exhibit are not supplied, so the collateral package and guarantor perimeter are taken from credit-agreement covenants and the issuer's summary; the recovery-access view is qualitative and any excluded material asset would weaken it.
- Basket usage history is not supplied, so remaining capacity under every fixed and grower basket is not established; leakage capacity is shown as drafted maxima, which overstates remaining room if baskets have been used.
- No refinancing and liability-management assessment was supplied for this run, so the priming and non-pro-rata routes are assessed as drafted capacity without a view on how likely the issuer is to use them under refinancing pressure.

### Nearest pressure point
The nearest pressure point is debt and lien capacity that can dilute existing first-lien creditors, because the maintenance trigger is distant and not tested for most creditors. The credit agreement allows pari passu secured debt to 5.00x secured net leverage, measured net of all unrestricted cash and over covenant EBITDA that adds back cost savings up to 25.0% plus transaction and compensation-related items. Identified secured debt is already 5.12x reported EBITDA before cash netting, so remaining capacity exists only because of cash netting and add-backs; once October dividend cash left, the analytical secured proxy sits at 4.22x adjusted earnings or 4.62x reported earnings. Further pari passu borrowing would dilute term-loan and noteholder recovery directly, while default probability would move only through higher interest burden. The signals to monitor are new incremental or secured note issuance, quarterly cash balances and any widening of the gap between covenant and reported EBITDA. A compliance certificate showing the tested secured ratio is the evidence needed to tighten this view.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, page 81; Financial foundation (CP-1); calculation L11

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package, scored 4 out of 5 on a provisional basis, because maintenance protection is revolver-only, secured and dividend capacity is ratio-based on add-back-rich earnings, and majority lenders hold broad amendment power. The main protections are full guarantees from domestic restricted subsidiaries, a 65% pledge of foreign voting equity, money caps on non-guarantor and foreign debt, each-lender protection against stripping substantially all collateral and the 2033 notes' each-holder ranking protection. The primary default-risk path is releveraging through further ratio-funded dividends or acquisitions without any tested covenant to intervene before payment stress. The primary recovery-risk path is pari passu secured dilution and bank-controlled collateral release, compounded by value in non-guarantor subsidiaries. For security selection, the decisive legal consideration is that first-lien noteholders, despite holding the majority of secured principal, depend on bank-lender decisions under an unseen intercreditor agreement; the subordinated notes additionally face 179 days of payment blockage. Further analysis requires the intercreditor agreement, compliance certificates, the remaining indentures and the current collateral agreement. The legal review is completed with limitations.
Basis: d887611dex101.htm.jsonl, pages 173–174; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 117–118; d826058dex41.htm.jsonl, pages 107–108; calculation L07

### Overall structural view
The worst structural route is not a single trapdoor but the combination of unlimited investment in restricted subsidiaries, including non-guarantors, and a general investment basket of up to 25.0% of total assets, indicatively USD 6,396.50 million on group assets; either can move value outside the guarantee net without lender consent. Unrestricted-subsidiary designation needs only covenant compliance and releases the designated guarantor and its liens. These routes are theoretical: no designation or transfer has been documented. Recovery access ranks first-lien loans and notes pari passu at the guarantor level, then subordinated notes, with all three behind creditors of non-guarantor subsidiaries on that value.
Basis: d887611dex101.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, pages 136–137; calculation L12

### Capital structure

| Instrument | Principal (USD million) | Rank and security | Obligors and guarantors | Governing document in source set | Source |
|---|---|---|---|---|---|
| Term loans, Tranches I to L | 8702 | First-lien secured; pari passu with secured notes | TransDigm Inc. borrower; Holdings and domestic restricted subsidiaries guarantee | Yes: conformed credit agreement under Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Revolving credit facility, commitments | 910 (undrawn; 67 letters of credit) | First-lien secured | Same as term loans | Yes: conformed credit agreement | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2028, 2029, 2030, 2031 and 2032 secured notes | 9500 | First-lien secured; pari passu with loans | TransDigm Inc. issuer; Holdings and credit-facility guarantors (2028 notes also TransDigm UK) | No: indentures not supplied | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| 2033 secured notes, 6.000% | 1500 | First-lien secured; pari passu with loans | TransDigm Inc. issuer; Holdings and credit-facility guarantors | Yes: 2033 indenture | Financial foundation (CP-1); d887611dex41.htm.jsonl, page 30 |
| 2027 senior subordinated notes, 5.500% | 2650 | Unsecured; subordinated to senior debt | TransDigm Inc. issuer; Holdings, TransDigm UK and domestic restricted subsidiaries on a subordinated basis | Yes: 2027 indenture | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58 |
| January and May 2029 senior subordinated notes | 1950 | Unsecured; subordinated to senior debt | Same as 2027 subordinated notes | No: indentures not supplied | Financial foundation (CP-1) |
| Trade receivable securitization | 487.5 drawn of 650 | Receivables sold to securitization entity; non-recourse basket | Securitization entity; legal rank not established | No | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Finance leases and government advances | 279 carrying | Not established | Not established | No | Financial foundation (CP-1) |

### Covenant tests and headroom

| Test | Applies to | Threshold | Position at 2024-09-30 | Headroom | Source |
|---|---|---|---|---|---|
| Revolver usage trigger for springing test | Revolving lenders only | 40% of commitments (USD 364 million) | 7.36% (USD 67 million letters of credit, no loans drawn) | 32.64 percentage points; USD 297 million | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| Springing net leverage maintenance | Revolving lenders only, when triggered | 7.50x (8.00x for four quarters after a material acquisition) | Not tested; ratio not disclosed | Not established | d887611dex101.htm.jsonl, page 188 |
| Incremental and pari secured incurrence | Loans | 5.00x secured net; 7.25x total net | Certified met for Tranche L; ratios not disclosed | Not established | d887611dex101.htm.jsonl, pages 3–4; d887611dex101.htm.jsonl, page 146 |
| Unlimited restricted payments | Loans | 6.75x total net | Not disclosed; analytical proxy 5.50x on adjusted EBITDA | Not established | d887611dex101.htm.jsonl, page 181; calculation L09 |
| Ratio debt and restricted payments | Supplied indentures | Fixed-charge cover above 2.0x | Not disclosed; analytical proxy 3.24x | Not established | d887611dex41.htm.jsonl, page 79; d826058dex41.htm.jsonl, pages 63–64; calculation L10 |
| Secured lien ratio | 2033 notes | 5.25x secured net | Not disclosed; analytical proxy 4.22x | Not established | d887611dex41.htm.jsonl, page 43; calculation L11 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger for springing leverage test | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Credit agreement springing covenant; exposure taken as USD 67 million letters of credit with no loans drawn at year-end; cash-collateralised letters of credit would be excluded but none are identified |
| Springing net leverage maintenance test | 7.50 | Not supplied: tested ratio not disclosed and test not triggered | Not supplied: tested ratio not disclosed | Passes at or below | x | Applies only when revolver exposure exceeds 40% of commitments; 8.00x for four quarters after a material acquisition; covenant EBITDA differs from reported EBITDA |
| Pari passu secured debt and incremental incurrence | 5.00 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Consolidated secured net debt ratio after the incurrence and use of proceeds; Tranche L closing certificate confirmed compliance without stating the ratio |
| Unlimited restricted payments | 6.75 | Not supplied: tested ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Total net leverage after the payment and its financing; analytical proxy of 5.50x is not the covenant figure |

The chart is not a legal compliance opinion: only the revolver usage trigger has a disclosed current value, and the ratio rows show thresholds whose tested values are not disclosed.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement dated, later joined six times | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Controls lien priority and enforcement among all first-lien classes; text not supplied |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15, the latest amendment affecting credit-agreement restrictive covenants | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Fixes the covenant baseline in force at year-end |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17: USD 1,500 million Tranche L incremental term loans to fund the special dividend | Historical — Amendment No. 17 and Incremental Term Loan Assumption Agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, pages 1–2 | Demonstrates use of ratio-based incremental capacity for shareholder distribution |
| 2024-09-19 | day | 2024-09-19 | Joinder No. 6 brings the 2033 secured notes into the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million pari passu first-lien claim under bank-led control |
| 2027-09-15 | day | 2024-09-19 | Initial redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Before this date redemption carries a make-whole premium; it frames refinancing optionality |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all capital stock | Ownership | TransDigm Inc. | Annual report via Business & governance; both Delaware corporations per Amendment No. 17 |
| TransDigm Group Incorporated | Guarantees loan obligations as Holdings | Guarantee | Term loans and revolver | Credit agreement guarantee default clause; US, New York forum not re-read |
| Domestic restricted subsidiaries | Must join as loan parties and guarantors | Guarantee | Term loans and revolver | Credit agreement further-assurances covenant; US entities |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | First-lien secured notes | Annual report guarantor information and 2033 indenture; Manhattan courts |
| Credit-facility guarantor subsidiaries | Senior secured guarantee | Guarantee | First-lien secured notes | Annual report guarantor information; 2033 indenture; Manhattan courts |
| TransDigm UK | Senior subordinated guarantee | Guarantee | Senior subordinated notes | Annual report guarantor information; 2027 indenture; UK guarantor |
| Loan-party collateral and 65% foreign voting equity | First-priority lien | Security | Term loans and revolver | Credit agreement collateral covenant; US loan parties |
| Loan-party collateral and 65% foreign voting equity | Shared first-priority lien | Security | First-lien secured notes | 2033 indenture collateral article and intercreditor reference |
| Non-guarantor subsidiaries | Own creditors rank first on their assets | Structural claim | First-lien secured notes | Annual report structural-subordination statement; US and foreign |
| Non-guarantor subsidiaries | Own creditors rank first on their assets | Structural claim | Senior subordinated notes | Annual report structural-subordination statement; US and foreign |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Term loans and revolver | Equal first-lien priority on shared collateral | Security rank | First-lien secured notes | 2033 indenture and First Lien ICA of 2019-02-13 (not supplied); New York forum |
| First-lien secured notes | Senior in right of payment | Payment rank | Senior subordinated notes | Annual report ranking statement; 2027 indenture subordination article |
| Term loans and revolver | Senior in right of payment | Payment rank | Senior subordinated notes | 2027 indenture subordination article; loans are senior debt |
| Credit agreement collateral agent | Its lien release releases notes lien | Release | First-lien secured notes | 2033 indenture release section; Manhattan courts |
| Required Lenders | Direct agent to exercise remedies | Enforcement control | Credit agreement collateral | Credit agreement remedies paragraph; US borrower |
| First-lien noteholders | No direct enforcement; act via notes agents | Enforcement control | Notes collateral agents | 2033 indenture collateral article; Manhattan courts |
| Designated senior debt holders | Up to 179 days payment blockage | Standstill | Senior subordinated notes | 2027 indenture payment-blockage section; US issuer |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 11 |
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
| MATERIAL | 3 |
| MINOR | 3 |

Field counts cover the source gate and the thirty-one required registers; the source gate is partial because the intercreditor agreement, current collateral agreement, other indentures and compliance certificates are missing. The three material findings are the missing intercreditor agreement, the missing tested ratios and basket usage, and the missing current collateral agreement.

### Analytical appendix — complete canonical registers

#### Evidence references

| Evidence ID | Evidence | Source |
|---|---|---|
| E01 | Springing 7.50x net leverage test for revolving lenders; 40% exposure trigger; amendable only by Required Revolving Lenders | d887611dex101.htm.jsonl, page 188 |
| E02 | Events of default: 5 business-day interest grace, 30-day covenant cure after notice, cross-default to Material Indebtedness, judgments above USD 50,000,000, guarantee and collateral failure, financial covenant default limited to revolving lenders, change of control; remedies by Required Lenders; 20-day cross-default annulment | d887611dex101.htm.jsonl, pages 188–193 |
| E03 | Compliance with all debt covenants at year-end; revolver maintenance only; 40% equals USD 364 million; incremental conditions 7.25x and 5.00x; Amendment No. 15 latest covenant amendment; securitization USD 650 million capacity, USD 487.5 million drawn | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E04 | Permitted Indebtedness: acquired debt greater of USD 150,000,000 and 6.0%; pari secured at 5.00x secured net; junior and unsecured at 7.25x; general basket greater of USD 250,000,000 and 10.0%; foreign subsidiaries greater of USD 450,000,000 and 18.0%; subordinated at 7.25x; securitization greater of USD 725,000,000 and 20.0%; reclassification at borrower's discretion | d887611dex101.htm.jsonl, pages 58–61 |
| E05 | Incremental facilities conditional on 7.25x total net and 5.00x secured net leverage; limited-condition acquisition testing at signing | d887611dex101.htm.jsonl, page 146 |
| E06 | MFN: 50 basis points yield differential; Tranche L protection lapses for acquisition debt, debt incurred after 18 months from Amendment No. 17 effectiveness, or debt maturing 18 months after the Tranche L maturity | d887611dex101.htm.jsonl, page 144 |
| E07 | Covenant EBITDA add-backs: restructuring and integration, transaction and refinancing expenses, non-cash charges, earn-outs, dividend equivalent payments, cost savings within 24 months capped at 25.0% | d887611dex101.htm.jsonl, page 24 |
| E08 | Restricted payments: management equity and dividend equivalents greater of USD 50,000,000 and 2.0% with carry-forward, capped by greater of USD 100,000,000 and 4.0%; general basket greater of USD 75,000,000 and 3.0%; expired USD 1,500,000,000 basket; unlimited payments at 6.75x total net leverage with no default | d887611dex101.htm.jsonl, pages 179–181 |
| E09 | Permitted Investments: unlimited in restricted subsidiaries; unrestricted subsidiaries greater of USD 250,000,000 and 10.0%; general greater of USD 500,000,000 and 25.0% of Total Assets; joint ventures greater of USD 1,000,000,000 and 40.0% at 7.00x | d887611dex101.htm.jsonl, pages 61–62 |
| E10 | Unrestricted subsidiary designation on certified compliance with restricted-payment and investment covenants; no recourse debt; Unrestricted Cash netting definition | d887611dex101.htm.jsonl, page 81 |
| E11 | Amendments by Required Lenders; each-lender rights list; agent may add pari or junior intercreditor arrangements; majority may permit non-pro-rata class offers and loan modifications; automatic collateral release on permitted disposals | d887611dex101.htm.jsonl, pages 204–206 |
| E12 | Required Lenders: more than 50% of loans, letter-of-credit exposure and unused commitments | d887611dex101.htm.jsonl, page 71 |
| E13 | Amendment No. 17: USD 1,500,000,000 Tranche L; proceeds with 2033 notes and cash fund special dividend; conditions 7.25x and 5.00x with officer certificate and solvency certificate | d887611dex101.htm.jsonl, pages 1–4 |
| E14 | Domestic subsidiaries other than immaterial, unrestricted and securitization entities join within 20 business days; 100% domestic and 65% foreign voting equity pledge; unrestricted subsidiary equity excluded | d887611dex101.htm.jsonl, pages 173–174 |
| E15 | First Lien Intercreditor Agreement dated 2019-02-13 with Joinders 1 to 6, the last dated 2024-09-19 | d887611dex41.htm.jsonl, page 30 |
| E16 | Indenture subject to the intercreditor agreement, which controls on conflict; 2033 notes designated Designated Senior Debt for the subordinated notes | d887611dex41.htm.jsonl, page 127; d887611dex41.htm.jsonl, page 135 |
| E17 | Holders may not take direct action to enforce security documents | d887611dex41.htm.jsonl, page 128 |
| E18 | Lien releases: with guarantor release; permitted asset sales; when credit agreement collateral agent releases other than on full cash discharge; on unrestricted designation; immaterial status; per intercreditor agreement | d887611dex41.htm.jsonl, pages 136–137 |
| E19 | Majority amendments; each-holder rights include ranking and subordination changes; 66 2/3% for release of substantially all collateral or adverse intercreditor change | d887611dex41.htm.jsonl, pages 117–118 |
| E20 | Credit Facilities basket USD 3,100.0 million less securitization debt; secured lien ratio 5.25x; ratio debt at fixed-charge cover above 2.0x; non-guarantor ratio debt capped at USD 400.0 million | d887611dex41.htm.jsonl, page 33; d887611dex41.htm.jsonl, page 43; d887611dex41.htm.jsonl, page 79 |
| E21 | 2033 notes cost-savings add-back capped at 35.0% over 24 months | d887611dex41.htm.jsonl, page 16 |
| E22 | Covenant suspension on investment-grade ratings from both agencies | d887611dex41.htm.jsonl, page 90 |
| E23 | 2027 subordinated notes: management equity basket USD 100.0 million per year, general basket USD 75.0 million, unlimited restricted payments at fixed-charge cover above 2.0x, mixed-basket classification | d826058dex41.htm.jsonl, pages 61–64 |
| E24 | 179-day payment blockage, one per 360 days, 181 days free; turnover of improper distributions; five business-day wait after acceleration notice | d826058dex41.htm.jsonl, pages 107–108 |
| E25 | Guarantees of subordinated notes subordinated to guarantor senior debt; senior debt paid in full in cash first in insolvency | d826058dex41.htm.jsonl, page 116 |
| E26 | Guarantor information: structural subordination to non-guarantor liabilities; guarantor-group sales USD 6,294 million; term loans USD 8,702 million; revolver USD 910 million with USD 67 million letters of credit and USD 843 million available | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| E27 | Debt stack, principal, EBITDA, net interest expense, post-dividend net debt and cash | Financial foundation (CP-1) |
| E28 | Ownership; dividend declared 2024-09-19 and paid 2024-10-18 | Business & governance (CP-1A) |
| E29 | Recurring transaction, compensation and refinancing add-backs rejected for recurring-credit earnings | Earnings quality (CP-1D) |

#### T4D.1 Source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Conformed credit agreement annexed to Amendment No. 17 | Executed, marked-up conformed annex | 1 | Schedules and collateral documents not annexed | Completed with Limitations |
| 2033 secured notes indenture | Executed | 1 | Security documents and intercreditor agreement referenced, not supplied | Completed with Limitations |
| 2027 subordinated notes indenture | Executed | 1 | Other subordinated-note indentures not supplied | Completed with Limitations |
| Annual report guarantor information | Filed, retrospective | 4 (summary disclosure) | Guarantor list exhibit not supplied; combined summary not a legal perimeter | Completed with Limitations |
| First Lien Intercreditor Agreement | Referenced only | 2 | Not in the source set | Completed with Limitations |
| Compliance certificates and basket trackers | Not supplied | 3 | Not in the source set | Completed with Limitations |

No post-balance-sheet guarantee release, collateral release or subsidiary designation is documented in the sources read; the October dividend payment and securitization draw are financial events owned elsewhere and do not change the perimeter.

#### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as amended through Amendment No. 17 | Credit agreement, conformed restatement | Base 2014-06-04; amendment 2024-09-19 | Executed; marked-up annex, inserted text treated as in force | Controls loan covenants, incremental capacity, amendments and lender remedies | Governs term loans USD 8,702 million and revolver USD 910 million | E01; E02; E04; E05; E06; E07; E08; E09; E10; E11; E12; E13; E14 |
| 1 | Indenture for 2033 secured notes | Indenture | 2024-09-19 | Executed | Controls 2033 notes covenants, lien release and holder rights | Representative of first-lien note terms; other series not verified | E15; E16; E17; E18; E19; E20; E21; E22 |
| 1 | Indenture for 2027 subordinated notes | Indenture | 2019-11-13 | Executed | Controls subordination, blockage and restricted payments for that series | Representative of subordinated terms; other series not verified | E23; E24; E25 |
| 2 | First Lien Intercreditor Agreement and Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; latest joinder 2024-09-19 | Referenced, not supplied | Controls enforcement, standstill and releases among first-lien classes; prevails over the indenture | Decisive for noteholder recovery control; unexamined | E15; E16 |
| 1 | Indentures for 2028, 2029, 2030, 2031 and 2032 secured notes and January and May 2029 subordinated notes | Indentures | Not supplied | Not supplied | Would govern those series | Thresholds extended by analogy only | E26 |
| 1 | Current guarantee and collateral agreement | Security document | Not supplied in current form | Not supplied | Collateral scope and excluded assets | Recovery-access view qualitative | E14 |
| 4 | Annual report debt and guarantor disclosures | Filed summary | 2024-11-07 | Filed, retrospective | Financial inputs, compliance statement and perimeter summary | Supports trigger headroom and non-guarantor sizing | E03; E26 |

#### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at most 7.50x (8.00x after a material acquisition) only if revolver exposure exceeds 40% | Credit agreement §6.14 | Most creditors have no tested early warning | Negative — Covenant Erosion | No comparative source supplied | E01; E03 |
| Pari passu secured debt | Allowed at 5.00x consolidated secured net debt ratio; maturity and life no shorter than term loans | Credit agreement Permitted Indebtedness (12) | Dilutes first-lien recovery; cash netting enlarges room | Negative — Leverage Increase | No comparative source supplied | E04 |
| Junior, unsecured and subordinated debt | Allowed at 7.25x net leverage | Credit agreement Permitted Indebtedness (12) and (17) | Adds claims ahead of equity without touching first-lien test | Negative — Leverage Increase | No comparative source supplied | E04 |
| Incremental facilities | No fixed amount found; 7.25x total and 5.00x secured net tests | Credit agreement §2.24(c) | Capacity grows with covenant EBITDA | Negative — Leverage Increase | No comparative source supplied | E05 |
| MFN | 50 basis points; carve-outs for acquisition debt, after 18 months, or later-maturing debt | Credit agreement §2.24 proviso | Repricing protection lapses quickly | Negative — Refinancing Risk | No comparative source supplied | E06 |
| EBITDA add-backs | Cost savings to 25.0% (loans) and 35.0% (2033 notes) over 24 months; uncapped transaction, refinancing and dividend-equivalent add-backs | Credit agreement Consolidated EBITDA (e), (k), (m); 2033 indenture (M) | Inflates every ratio basket | Negative — Covenant Erosion | No comparative source supplied | E07; E21 |
| Restricted payments | Unlimited at 6.75x (loans) or fixed-charge cover above 2.0x (indentures); general basket greater of USD 75 million and 3.0% | Credit agreement §6.02; 2027 indenture §4.07 | Demonstrated USD 4,348 million dividend | Negative — Leverage Increase | No comparative source supplied | E08; E23; E28 |
| Investments | Unlimited in restricted subsidiaries; general greater of USD 500 million and 25.0% of Total Assets; unrestricted subsidiaries greater of USD 250 million and 10.0% | Credit agreement Permitted Investments | Value can move to non-guarantors or outside the group | Negative — Covenant Erosion | No comparative source supplied | E09 |
| Unrestricted subsidiaries | Designation on certified covenant compliance; guarantee and lien release follows | Credit agreement definition; 2033 indenture §12.07(f) | Drop-down route | Negative — Covenant Erosion | No comparative source supplied | E10; E18 |
| Guarantor coverage | Domestic subsidiaries join; 65% foreign voting equity pledged | Credit agreement §5.11 | Non-guarantor value structurally senior to group creditors | Neutral — Stable | No comparative source supplied | E14; E26 |
| Collateral release | Automatic on permitted disposal; substantially all needs each lender (loans) or 66 2/3% (2033 notes); notes follow bank-agent releases | Credit agreement §9.02(b), (c); 2033 indenture §9.02, §12.07 | Partial releases without noteholder vote | Negative — Covenant Erosion | No comparative source supplied | E11; E18; E19 |
| Events of default | Cross-default above Material Indebtedness; judgments above USD 50,000,000; financial covenant default revolver-only | Credit agreement Article VII | Term lenders act late | Neutral — Stable | No comparative source supplied | E02 |
| Amendment and waiver | Required Lenders above 50%; no express anti-subordination right for loans; non-pro-rata offers by majority amendment | Credit agreement §9.02(b) | Uptier and non-pro-rata exchange capacity | Negative — Covenant Erosion | No comparative source supplied | E11; E12 |
| Covenant suspension | Most 2033 notes covenants suspend on dual investment-grade ratings | 2033 indenture §4.19 | Protections fall away at upgrade | Neutral — Stable | No comparative source supplied | E22 |

#### Step findings: definitions, incurrence, leakage, collateral and remedies

| Provision | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| Covenant EBITDA and net leverage | Ratios use consolidated debt less Unrestricted Cash over covenant EBITDA with add-backs | Add-backs and full cash netting enlarge capacity | Low near term; releveraging later | Higher via pari dilution | Compare covenant EBITDA with reported EBITDA when disclosed | Negative — Covenant Erosion | High | E07; E10; E29 |
| Covenant debt versus carrying debt | Covenant debt is principal-based and nets cash; analytical debt uses carrying value USD 24,880 million | Definition conflict means analytical ratios are proxies only | No direct effect | No direct effect | Log both bases; do not substitute | Insufficient Information | Medium | E27 |
| Non-debt float | Customer advances are not Indebtedness under the definitions read | Float sits outside every debt test | Minor | Minor | Track contract liabilities | Neutral — Stable | Low | E27 |
| Ratio-based secured incurrence | 5.00x loans; 5.25x 2033 notes; USD 3,100 million credit-facility basket | Term loans exceed the basket by USD 5,602 million, so further secured debt relies on ratio tests | Moderate | High | Track new secured issuance | Negative — Leverage Increase | High | E04; E20 |
| Leakage through restricted payments | Ratio basket at 6.75x used for USD 4,348 million dividend | Repeated ratio dividends reduce retained value | Moderate | Moderate | Monitor declarations and leverage | Negative — Leverage Increase | Medium | E08; E13; E28 |
| Collateral and guarantees | Domestic guarantee net; 65% foreign pledge; releases follow permitted disposals | Non-guarantor value outside collateral | Low | Moderate | Track guarantor list and disposals | Neutral — Stable | Medium | E14; E18; E26 |
| Remedies and amendments | Required Lenders control remedies and most amendments | Bank majority can alter priority-relevant terms | Low | High if used | Monitor amendment filings | Negative — Covenant Erosion | Medium | E02; E11; E12 |

#### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Springing maintenance | Revolver-only 7.50x test, 40% trigger, 7.36% usage | No early covenant trigger for term lenders or noteholders | Defers default recognition to payment stress | Later intervention erodes value before enforcement | Quarter-end revolver exposure | E01; E03 |
| Pari secured incurrence | 5.00x and 5.25x secured net tests | New pari debt shares collateral | Higher interest burden | Direct dilution of first-lien recovery | New secured issuance and cash balances | E04; E20 |
| Ratio dividends | 6.75x loans; fixed-charge cover above 2.0x indentures | Cash leaves the group while ratios pass | Releveraging raises default risk | Less value retained for all classes | Dividend declarations | E08; E23 |
| EBITDA add-backs | 25.0% and 35.0% cost-savings caps plus uncapped items | All ratio baskets inflate together | Indirect | Indirect via larger baskets | Covenant versus reported EBITDA gap | E07; E21 |
| Investment and designation routes | Unlimited restricted-subsidiary investment; unrestricted designation | Value moves outside guarantee net | Minor | Strands value from guaranteed creditors | Unrestricted designations and intercompany transfers | E09; E10 |
| Amendment control | Majority lenders; no express anti-subordination right in loans | Uptier or non-pro-rata exchange possible | Can extend runway for participants | Non-participants subordinated | Amendment and exchange announcements | E11; E12 |
| Notes enforcement | No direct holder action; release follows bank agent | Bank lenders steer recovery process | None | Noteholders bear process risk | Intercreditor terms when available | E17; E18 |
| Subordinated blockage | 179 days blockage; turnover | Senior lenders can stop subordinated payments | Accelerates subordinated default once senior default occurs | Subordinated notes recover only after senior debt in full | Blockage notices | E24; E25 |

#### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions in the covenant feature register | No comparative source or covenant-review report supplied | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not compared | Insufficient Information | E01; E04; E08 |

#### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x at 40% usage; term loans and notes covenant-lite | No early warning for most creditors | Negative — Covenant Erosion | High | E01; E03 |
| Debt / lien incurrence capacity | 4 | 5.00x and 5.25x secured net; 7.25x total; MFN 50 basis points with 18-month lapse | Ratio capacity grows with adjusted earnings | Negative — Leverage Increase | High | E04; E05; E06; E20 |
| RP / investment / leakage capacity | 4 | Unlimited dividends at 6.75x, demonstrated; unlimited restricted-subsidiary investment; 25.0% of Total Assets general basket | Value leaves creditor reach without consent | Negative — Leverage Increase | High | E08; E09; E10 |
| EBITDA definitions and add-back flexibility | 4 | 25.0% and 35.0% cost-savings caps over 24 months plus uncapped transaction and dividend-equivalent add-backs | Inflates all ratio baskets | Negative — Covenant Erosion | High | E07; E21; E29 |
| Collateral / guarantor protection | 3 | Domestic guarantees; 65% foreign pledge; capped non-guarantor debt; substantially-all release protected | Non-guarantor value and partial releases | Neutral — Stable | Medium | E14; E18; E20; E26 |
| Amendment / control mechanics | 4 | Majority lenders; no express anti-subordination right in loans; non-pro-rata offers by majority amendment; notes follow bank releases | Priority can be reshaped by a bank majority | Negative — Covenant Erosion | Medium | E11; E12; E18; E19 |
| Overall | 4 | Weighted to leakage, incurrence and control areas; not an average | Aggressive package | Negative — Covenant Erosion | Provisional | E01; E04; E08; E11 |

Covenant Aggressiveness Score: 4/5, status Provisional, because the intercreditor agreement, current collateral agreement and compliance certificates are missing.

#### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| No anti-subordination each-lender right in loans | Credit agreement §9.02(b) list | Majority could enable priming of non-participants | LGD higher for non-participating term lenders; RV favours notes with ranking protection | Watch amendment filings and exchange offers | E11 |
| Notes lien follows bank-agent release | 2033 indenture §12.07(e)(B) | Partial collateral can leave without noteholder vote | LGD higher for noteholders | Track collateral releases and disposals | E18 |
| Ratio-based dividends | Credit agreement §6.02 unlimited basket | Repeat recapitalisations remain permitted | PD and LGD higher | Track declarations against leverage | E08; E28 |
| Revolver usage near 40% | Credit agreement §6.14 | Would activate the only maintenance test | PD signal | Quarter-end revolver exposure | E01; E03 |
| Unrestricted designation | Credit agreement definition | Releases guarantees and liens | LGD higher | Board designations and officer certificates | E10; E18 |
| Investment-grade suspension | 2033 indenture §4.19 | Covenants fall away | LGD higher on later downgrade | Rating actions | E22 |
| Subordinated payment blockage | 2027 indenture §10.03 | Senior default stops subordinated payments | PD higher for subordinated notes | Blockage notices | E24 |

#### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and Joinders 1 to 6 | Governs enforcement, standstill, turnover and releases among first-lien classes | Intercreditor registers carry insufficient-information cells; recovery-control view provisional | Obtain executed agreement and joinders |
| Tested covenant ratios | Compliance certificates and officer certificates | Headroom and basket route not established | Ratio headroom rows not calculable; dividend-basket route inferred | Obtain year-end and Tranche L certificates |
| Other indentures | 2028 to 2032 secured and 2029 subordinated indentures | Series terms may differ | Series-level relative value provisional | Obtain executed indentures |
| Collateral agreement | Current guarantee and collateral agreement and excluded-asset schedule | Collateral scope unknown | Recovery-access view qualitative | Obtain current agreement and perfection certificate |
| Guarantor list | Guarantor list exhibit to the annual report | Perimeter by entity unknown | Entity register by class only | Obtain exhibit |
| Basket usage | Basket trackers | Remaining capacity unknown | Capacity shown as drafted | Obtain usage records |
| Market comparison | Covenant-review report | No market-norm benchmark | Market-norm column not assessed | Obtain third-party review if required |

#### T4D.2 Restricted and unrestricted entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of loans and all notes | Delaware | Listed public company | Holdings, guarantor | No significant operations beyond its investment in TransDigm Inc. | Yes | E26; E28; E13 |
| TransDigm Inc. | Borrower and issuer | Delaware | TransDigm Group Incorporated | Borrower | Guarantor-group sales USD 6,294 million combined with guarantors | Yes | E13; E26 |
| Domestic restricted subsidiaries | Guarantors and grantors | United States | TransDigm Inc. | Restricted; can be designated unrestricted on compliance | Included in guarantor-group summary; entity split not disclosed | Yes | E14; E26 |
| TransDigm UK | Guarantor of subordinated and 2028 secured notes | United Kingdom | Not established | Restricted guarantor | Not disclosed | Yes for those series | E26 |
| Foreign restricted subsidiaries and other non-guarantors | Non-guarantors; 65% voting equity pledged | Various, not disclosed | Not disclosed | Restricted, non-guarantor | Sales outside guarantor group USD 1,646 million; goodwill outside summary USD 2,233 million | No | E14; E26; calculation L04; calculation L05 |
| Immaterial domestic subsidiaries | Excluded subsidiaries | United States | Not disclosed | Excluded below 7.5% tests per annual-report-cited agreement terms; not re-read | Not disclosed | No | E14 |
| Securitization entity | Receivables purchaser | Not established | Not established | Securitization entity, non-recourse basket | Receivables backing USD 487.5 million drawn at year-end | No | E03; E04 |
| Unrestricted subsidiaries | None identified | Not established | Not established | None identified in sources read | Not established | No | E10 |

#### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × term loans and revolver | Senior secured | Upstream | Full payment; release of material guarantor needs each lender | E02; E11 |
| Domestic restricted subsidiaries × term loans and revolver | Senior secured | Cross-stream and upstream | Permitted disposal; unrestricted designation; each-lender consent otherwise | E11; E14 |
| Holdings × secured notes | Senior secured | Upstream | Satisfaction, defeasance, payment | E18; E26 |
| Credit-facility guarantors × 2029 to 2033 secured notes | Senior secured | Cross-stream | Release from credit facilities guarantee; unrestricted designation; immaterial status | E18; E26 |
| TransDigm UK × 2028 secured and subordinated notes | Senior secured or subordinated | Cross-stream | Not verified for those series | E26 |
| Holdings and domestic restricted subsidiaries × subordinated notes | Senior subordinated | Upstream and cross-stream | Unrestricted designation and disposal per indenture; not re-read in detail | E25; E26 |
| Non-guarantor subsidiaries × all tranches | None | None | Not applicable: no guarantee | E26 |

#### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Holdings × first lien | Not established: current collateral agreement not supplied | Full payment; each-lender consent for substantially all | Not established | E11; E14 |
| TransDigm Inc. × first lien | Unrestricted subsidiary equity; 35% foreign voting equity | Automatic on permitted disposal | Not established | E11; E14 |
| Domestic restricted subsidiaries × first lien | Not established beyond equity limits | Automatic on permitted disposal or designation | Not established | E11; E14; E18 |
| Foreign subsidiaries × first lien | Assets not pledged; only 65% voting equity of first-tier holdings | Not applicable | Foreign-law perfection not established | E14 |
| All grantors × first lien for notes | Collateral as defined; excluded collateral per security agreement not supplied | Follows bank-agent release other than full discharge; 66 2/3% for substantially all | 90-day post-closing perfection window | E18; E19 |
| All entities × second lien | — | Not applicable: no second lien identified | Not applicable | E04 |
| All entities × subordinated notes | Unsecured | Not applicable | Not applicable | E25 |

#### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with Holdings and domestic guarantors | Guarantor-group assets and 65% foreign voting equity | Pari (same entity, same lien) | Non-guarantor sales USD 1,646 million reachable only through pledged equity | Best-positioned with enforcement control | Medium | E14; E26 |
| First-lien secured notes | TransDigm Inc. with Holdings and credit-facility guarantors | Same collateral as loans | Pari (same entity, same lien) | Same non-guarantor value; partial releases follow bank agent | Equal economic rank, weaker control | Medium | E17; E18; E26 |
| Senior subordinated notes | TransDigm Inc. with Holdings, TransDigm UK and domestic guarantors | Residual after senior debt | Contractually Subordinated | Non-guarantor value and all collateral value ahead of them | Recover only after senior debt is paid in full in cash | High | E24; E25 |
| All group claims versus non-guarantor creditors | Non-guarantor subsidiaries | Non-guarantor assets | Structurally Subordinated — Non-Guarantor Value | USD 1,646 million of sales and USD 2,233 million of goodwill outside guarantor summary | Local creditors, foreign debt and securitization rank first there | Medium | E04; E20; E26 |
| Securitization funding | Securitization entity | Sold receivables | Structurally Senior | Receivables sold out of the group | Ranks ahead of group creditors on sold receivables | Medium | E03; E04 |

#### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Investment into non-guarantor restricted subsidiaries | Guarantors to foreign or other non-guarantor subsidiaries | Permitted Investments (1)(a), unlimited | Uncapped | 4 | Moves value outside guarantee net while staying in the restricted group | Theoretical | E09 |
| General investment basket | Group to any person, including unrestricted subsidiaries | Permitted Investments (10), greater of USD 500 million and 25.0% of Total Assets | Indicatively USD 6,396.50 million on group assets | 4 | Large drop-down capacity | Theoretical | E09; calculation L12 |
| Unrestricted designation | Restricted subsidiary to unrestricted | Unrestricted Subsidiary definition; investment basket greater of USD 250 million and 10.0% | Not calculable: covenant EBITDA and usage not disclosed | 3 | Releases guarantee and liens | Theoretical | E09; E10; E18 |
| Ratio dividends | Borrower to Holdings to shareholders | Credit agreement unlimited restricted payments at 6.75x | Not calculable: tested ratio not disclosed | 4 | Value leaves all creditors | Demonstrated: USD 4,348 million | E08; E28 |
| Asset sale out of group | Guarantor asset to third party | Automatic release on permitted disposal | Not established: asset-sale terms not re-read | 3 | Collateral shrinks with proceeds subject to sweep | Theoretical | E11; E18 |
| Receivables securitization | Receivables to securitization entity | Permitted Indebtedness (18), greater of USD 725 million and 20.0% | Facility USD 650 million, at least USD 75 million below the floor | 2 | Receivables leave collateral | Demonstrated | E03; E04; calculation L13 |

#### T4D.7 Trapdoor and uptier vulnerability

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier of non-participating term lenders | Credit agreement §9.02(b) majority amendment; no express anti-subordination right | Term lenders outside a majority group | Theoretical | A majority holding more than USD 4,806 million could reshape priority | Medium | E11; E12 |
| Non-pro-rata exchange or prepayment offers | Credit agreement §9.02(b) final paragraph | Lenders not accepting offers | Theoretical | Class-wide offers with differential outcomes | Medium | E11 |
| Bank-led partial collateral release | 2033 indenture §12.07(e)(B) | First-lien noteholders | Theoretical | Collateral can be released without noteholder vote | Medium | E18 |
| Drop-down to non-guarantors | Permitted Investments (1)(a) and (10) | All guaranteed creditors | Theoretical | Value moved beyond guarantee reach | Medium | E09 |
| Noteholder ranking protection | 2033 indenture §9.02(h) each-holder right | Protects 2033 noteholders | Demonstrated drafting | Limits uptier against that series | High | E19 |

#### T4D.8 Gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Entity-level perimeter | Guarantor list exhibit and subsidiary list | Cannot map every guarantor | Entity register by class | Obtain exhibits |
| Collateral scope | Current guarantee and collateral agreement | Excluded assets unknown | Collateral matrix partial | Obtain agreement |
| Entity-level debt and EBITDA | Non-guarantor debt and EBITDA by entity | Cannot size structural claims precisely | Only sales and goodwill proxies used | Obtain entity data |
| Intercreditor control | First Lien Intercreditor Agreement | Release and enforcement terms unknown | Priming and release labels provisional | Obtain agreement |
| Basket usage | Investment and designation usage | Remaining leakage capacity unknown | Severity on drafted capacity | Obtain trackers |

#### T4F.1 Controlling documents for intercreditor analysis

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders 1 to 6 | TransDigm Inc., Holdings, subsidiary guarantors, credit agreement collateral agent, existing secured notes trustees and agents, 2033 trustee and notes collateral agents | 2019-02-13; joinders through 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced, not supplied | d887611dex41.htm.jsonl, page 30 | E15 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, guarantors, Bank of New York Mellon Trust Company as trustee and US collateral agent, Bank of New York Mellon as UK collateral agent | 2024-09-19 | Manhattan court submission; governing-law clause not re-read | Executed | d887611dex41.htm.jsonl, pages 127–128 | E16; E17 |
| Conformed credit agreement | TransDigm Inc., Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2014-06-04 as amended 2024-09-19 | Not re-read in current text | Executed | d887611dex101.htm.jsonl, page 1 | E13 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, Bank of New York Mellon Trust Company | 2019-11-13 | Not re-read | Executed | d826058dex41.htm.jsonl, pages 107–108 | E24 |

#### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien | Shared collateral | Sole control of financial covenant remedies | Part of Required Lenders base USD 9,612 million; Required Revolving Lenders for the covenant | E01; E02; E12 |
| Term lenders | First lien | Shared collateral | Required Lenders direct agent | Term loans USD 8,702 million in the Required Lenders base; Tranche J 37.79% of base | E02; E12; calculation L06 |
| First-lien noteholders | First lien | Shared collateral via notes collateral agents | No direct action; [Insufficient Information] — ICA not in the source set for authorised representative | Majority for most amendments; 66 2/3% for substantially all collateral; USD 11,000 million principal | E17; E19; calculation L07 |
| Senior subordinated noteholders | Contractually subordinated | None | Remedies subject to senior payment-blockage rights | Majority per series | E24; E25 |

#### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement order | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set; credit agreement Required Lenders direct the bank agent | First-lien noteholders and lenders | Control allocation unknown | Insufficient Information | E02; E15 |
| Noteholder direct action bar | Indefinite: holders may not act directly | Always | Notes collateral agents under the intercreditor agreement | First-lien noteholders | Holders depend on agents and the unseen agreement | Negative — Covenant Erosion | E17 |
| Subordinated payment blockage | 179 days from blockage notice; one per 360 days; 181 days free | Non-payment default on designated senior debt, or other default with blockage notice | Representative of designated senior debt | Senior subordinated noteholders | Payments stop while senior lenders decide | Negative — Liquidity Deterioration | E24 |
| Financial covenant remedies | None stated beyond revolver acceleration | Breach of springing test | Required Revolving Lenders | Term lenders wait for revolver action | Delayed cross-default for term lenders | Negative — Covenant Erosion | E02 |

#### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes turnover | Holders hold improper distributions in trust for senior debt | Not applicable | None stated | Distribution in breach of subordination | Holders keep subordinated securities received in a plan | E24; E25 |
| Notes lien release on bank release | [Insufficient Information] — ICA not in the source set | Credit agreement collateral agent, unless full cash discharge | [Insufficient Information] — ICA not in the source set | Bank agent releases its lien | 66 2/3% consent needed to release substantially all | E18; E19 |
| Credit agreement collateral release | Not applicable | Automatic on permitted disposal; each lender for substantially all | Non-consenting lender replacement exists but not re-read | Disposal compliant with agreement | Each-lender protection for substantially all collateral | E11 |
| First-lien turnover and purchase option | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Not established | Not established | E15 |

#### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders and revolver | Majority directs agent; partial releases by covenant | Non-participants exposed to majority amendments | Moderate | Priority can be reshaped without each-lender consent | Negative — Covenant Erosion | E02; E11 |
| First-lien noteholders | Act only through notes agents; liens follow bank releases | Control rests with bank lenders and the unseen agreement | High | Majority of secured principal without matching control | Negative — Covenant Erosion | E17; E18; calculation L07 |
| Senior subordinated noteholders | Paid only after senior debt in full | Blockage and turnover | High | Recovery depends on residual value | Negative — Liquidity Deterioration | E24; E25 |

#### T4F.6 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor terms | Enforcement order, standstill, turnover, release and purchase options among first-lien classes | Determines noteholder recovery control | Intercreditor registers partly insufficient | Obtain First Lien Intercreditor Agreement and joinders |
| Governing law | Governing-law clauses of the credit agreement and intercreditor agreement | Affects enforcement analysis | Jurisdiction stated as forum only | Obtain and read clauses |
| Authorised representative | Which agent controls collateral enforcement | Defines control | Control weakness assessed on indenture terms only | Obtain agreement |

#### T4C.2 Source map for capacity

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | d887611dex101.htm.jsonl, pages 1–206 | Conformed credit agreement | 2024-09-19 | Executed | Legal formula | Loan tests and baskets | E01; E04; E08; E09 |
| 1 | d887611dex41.htm.jsonl, pages 16–137 | Indenture | 2024-09-19 | Executed | Legal formula | 2033 notes tests | E20; E21 |
| 1 | d826058dex41.htm.jsonl, pages 61–116 | Indenture | 2019-11-13 | Executed | Legal formula | Subordinated restricted payments and blockage | E23; E24 |
| 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–62 | Annual report | 2024-11-07 | Filed | Financial input and usage of revolver and securitization | Trigger headroom and perimeter | E03; E26 |
| 4 | Financial foundation (CP-1) | Accepted analysis | 2024-09-30 | Accepted | Financial input | Analytical proxies only | E27 |

#### T4C.3 Definition and ratio register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions and §6.14 | Total indebtedness less Unrestricted Cash over covenant EBITDA; financial covenant EBITDA for the springing test | Covenant debt, unrestricted cash, covenant EBITDA | Higher EBITDA or cash raises capacity | Cash netting and add-backs loosen tests | Negative — Covenant Erosion | E01; E10 |
| Consolidated Secured Net Debt Ratio | Credit agreement and 2033 indenture | Secured debt less Unrestricted Cash over covenant EBITDA | Secured debt, cash, covenant EBITDA | Governs pari secured capacity | Pari dilution | Negative — Leverage Increase | E04; E20 |
| Consolidated EBITDA | Credit agreement clauses (e) to (m); 2033 indenture (M) | Net income plus add-backs including cost savings capped at 25.0% or 35.0% | Add-back ledger | Inflates every ratio basket | Divergence from reported EBITDA | Negative — Covenant Erosion | E07; E21 |
| Consolidated Fixed Charge Coverage Ratio | Supplied indentures | Covenant EBITDA over fixed charges, pro forma | Fixed charges and covenant EBITDA | Governs ratio debt and dividends under notes | Loose 2.0x floor | Negative — Leverage Increase | E20; E23 |
| Total Assets grower | Credit agreement Permitted Investments (10) | 25.0% of Borrower's Total Assets | Borrower total assets | Large investment capacity | Drop-down room | Negative — Covenant Erosion | E09 |
| Covenant debt versus carrying debt | Definitions versus carrying value | Covenant uses principal net of cash; analytical debt uses carrying value | Both bases | Proxies differ from covenant figures | Definition conflict | Insufficient Information | E27 |

#### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger for springing leverage test | max-ratio | 40.00% | 7.36% | Revolving exposure 67 / commitments 910 | 32.64% | Compliant | Exposure taken as letters of credit with no loans drawn; headroom is in percentage points of commitments | Breaching 40% activates the only maintenance test | Neutral — Stable | E01; E03; calculation L01 |
| Springing net leverage maintenance | max-ratio | 7.50x | Not supplied: tested ratio not disclosed | Net debt less unrestricted cash over financial covenant EBITDA | [Insufficient Information] — missing: tested Consolidated Net Leverage Ratio | Not Calculable | Test not triggered at year-end; 8.00x after a material acquisition | Revolver-only protection | Insufficient Information | E01 |
| Pari passu secured and incremental incurrence | max-ratio | 5.00x | Not supplied: tested ratio not disclosed | Secured debt less unrestricted cash over covenant EBITDA, pro forma | [Insufficient Information] — missing: tested Consolidated Secured Net Debt Ratio | Not Calculable | Tranche L certificate confirmed compliance without stating the ratio; analytical proxy 4.22x | Pari dilution capacity | Insufficient Information | E04; E05; E13; calculation L11 |
| Junior, unsecured and incremental total leverage | max-ratio | 7.25x | Not supplied: tested ratio not disclosed | Total net debt over covenant EBITDA, pro forma | [Insufficient Information] — missing: tested Consolidated Net Leverage Ratio | Not Calculable | Analytical proxy 5.50x is not the covenant figure | Layering capacity | Insufficient Information | E04; E05; calculation L09 |
| Unlimited restricted payments under loans | max-ratio | 6.75x | Not supplied: tested ratio not disclosed | Total net debt over covenant EBITDA after the payment and financing | [Insufficient Information] — missing: tested Consolidated Net Leverage Ratio | Not Calculable | Basket route inferred from dividend size | Dividend capacity | Insufficient Information | E08; calculation L14 |
| Ratio debt and restricted payments under indentures | min-ratio | 2.00x | Not supplied: tested ratio not disclosed | Covenant EBITDA over fixed charges, pro forma | [Insufficient Information] — missing: tested Consolidated Fixed Charge Coverage Ratio | Not Calculable | Test is strictly greater than 2.0x; analytical proxy 3.24x | Debt and dividend capacity under notes | Insufficient Information | E20; E23; calculation L10 |
| Secured lien ratio under 2033 notes | max-ratio | 5.25x | Not supplied: tested ratio not disclosed | Secured debt less unrestricted cash over covenant EBITDA | [Insufficient Information] — missing: tested Consolidated Secured Net Debt Ratio | Not Calculable | Other secured indentures not supplied | Lien capacity | Insufficient Information | E20 |

Maximum additional debt before breach is not calculable for any ratio test because no tested ratio, covenant EBITDA or covenant debt figure is disclosed.

#### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Incremental facility capacity | Credit agreement §2.24 | Ratio Basket: 7.25x total and 5.00x secured net | No default; officer certificate | Tested ratios not disclosed | Tranche L USD 1,500 million | Not calculable: tested ratios not disclosed | Not calculable: tested ratios not disclosed | Formula Extracted Only | High | Pari incremental debt | Negative — Leverage Increase | E05; E13 |
| Debt incurrence capacity | Permitted Indebtedness (12) secured | Ratio Basket: 5.00x secured net | Maturity and life tests | Not disclosed | Not supplied | Not calculable: tested ratio not disclosed | Not calculable: tested ratio not disclosed | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Permitted Indebtedness (12) unsecured and (17) subordinated | Ratio Basket: 7.25x net | No default | Not disclosed | Not supplied | Not calculable: tested ratio not disclosed | Not calculable: tested ratio not disclosed | Formula Extracted Only | Moderate | Layering | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Permitted Indebtedness (13) general | Grower Basket: greater of USD 250 million and 10.0% of covenant EBITDA | None stated | Covenant EBITDA not disclosed | Not supplied | Not calculable: covenant EBITDA not disclosed; floor USD 250 million | Not calculable: usage not disclosed | Formula Extracted Only | Moderate | Additional debt | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Permitted Indebtedness (14) foreign subsidiaries | Grower Basket: greater of USD 450 million and 18.0% | Foreign restricted subsidiaries only | Not disclosed | Not supplied | Not calculable: covenant EBITDA not disclosed; floor USD 450 million | Not calculable: usage not disclosed | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Permitted Indebtedness (18) securitization | Grower Basket: greater of USD 725 million and 20.0% | Non-recourse | Facility USD 650 million | USD 487.5 million at year-end; fully drawn after October draw | Floor USD 725 million | At least USD 75 million against the floor | Ready with Limitations | Low | Receivables leave collateral | Neutral — Stable | E03; E04; calculation L13 |
| Lien capacity | 2033 notes Credit Facilities basket and lien ratio | Fixed Basket USD 3,100 million plus Ratio Basket 5.25x | Less securitization debt | Term loans USD 8,702 million | Excess USD 5,602 million above fixed basket | Ratio capacity not calculable | Not calculable: tested ratio not disclosed | Ready with Limitations | High | Further secured loans rely on ratio route | Negative — Leverage Increase | E20; calculation L08 |
| Restricted payment capacity | Unlimited basket under loans | Ratio Basket: 6.75x net | No default | Not disclosed | USD 4,348 million dividend | Not calculable: tested ratio not disclosed | Not calculable: tested ratio not disclosed | Formula Extracted Only | High | Cash leaves group | Negative — Leverage Increase | E08; E28 |
| Restricted payment capacity | General basket under loans | Grower Basket: greater of USD 75 million and 3.0% | No default | Not disclosed | Not supplied | Floor USD 75 million | Not calculable: usage not disclosed | Formula Extracted Only | Low | Small leakage | Neutral — Stable | E08 |
| Restricted payment capacity | Indenture ratio basket | Ratio Basket: fixed-charge cover above 2.0x | No default | Not disclosed | Not supplied | Not calculable: tested ratio not disclosed | Not calculable: tested ratio not disclosed | Formula Extracted Only | High | Looser than loans | Negative — Leverage Increase | E23 |
| Investment capacity | Permitted Investments (10) | Grower Basket: greater of USD 500 million and 25.0% of Total Assets | None stated | Group total assets USD 25,586 million; Borrower definition not verified | Not supplied | Indicative USD 6,396.50 million | Not calculable: usage not disclosed | Provisional | High | Drop-down capacity | Negative — Covenant Erosion | E09; calculation L12 |
| Investment capacity | Permitted Investments (1)(a) restricted subsidiaries | Uncapped | None | Not applicable | Not supplied | Uncapped | Uncapped | Ready with Limitations | High | Transfer to non-guarantors | Negative — Covenant Erosion | E09 |
| Unrestricted subsidiary capacity | Permitted Investments (1)(c) and designation | Grower Basket: greater of USD 250 million and 10.0% | Certified compliance; no recourse debt | Covenant EBITDA not disclosed | None identified | Not calculable: covenant EBITDA not disclosed; floor USD 250 million | Not calculable: usage not disclosed | Formula Extracted Only | Moderate | Guarantee and lien release | Negative — Covenant Erosion | E09; E10 |
| Investment capacity | Permitted Investments (11) joint ventures | Grower Basket: greater of USD 1,000 million and 40.0% | 7.00x net; no default | Not disclosed | Not supplied | Not calculable: tested ratio not disclosed; floor USD 1,000 million | Not calculable: usage not disclosed | Formula Extracted Only | Moderate | Value moved to joint ventures | Negative — Covenant Erosion | E09 |
| EBITDA add-back capacity | Cost savings | Cap 25.0% loans; 35.0% 2033 notes | 24 months; good-faith projection | Add-back ledger not disclosed | Not supplied | Not calculable: add-back ledger not disclosed | Not calculable: add-back ledger not disclosed | Formula Extracted Only | High | Inflates ratio baskets | Negative — Covenant Erosion | E07; E21 |
| MFN protection | Tranche L MFN | 50 basis points yield differential | Lapses for acquisition debt, after 18 months, or later maturities | Effective date not confirmed in pages read | Not applicable | Not applicable | Not applicable | Ready with Limitations | Moderate | Repricing protection short | Negative — Refinancing Risk | E06 |
| Guarantor / collateral release capacity | Credit agreement §9.02(c); 2033 indenture §12.07 | Automatic on permitted disposal; follows bank release | Substantially all needs each lender or 66 2/3% | Not applicable | Not supplied | Not calculable: depends on disposals | Not calculable: depends on disposals | Ready with Limitations | High | Partial collateral leakage | Negative — Covenant Erosion | E11; E18; E19 |

Baskets are not summed: the loan agreement lets the borrower divide and reclassify debt across categories, and investment and designation routes overlap.

#### T4C.6 Debt, lien and priming routes

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured ratio debt | 5.00x loans; 5.25x 2033 notes | Formula extracted; tested ratio not disclosed | Dilutes shared collateral | Higher interest burden | Lower first-lien recovery | Neutral across first-lien instruments; negative for all | E04; E20 |
| Incremental loans | 7.25x and 5.00x | Formula extracted; Tranche L used | Pari dilution; MFN lapses after 18 months | Moderate | Lower first-lien recovery | Existing loans lose repricing protection | E05; E06 |
| Junior and unsecured layering | 7.25x | Formula extracted | Ranks behind first lien | Higher leverage | Dilutes subordinated recovery | Negative for subordinated notes | E04 |
| Majority-lender uptier | No express anti-subordination right in loans | Theoretical | Subordinates non-participants | Could extend runway | Severe for non-participants | Favours 2033 notes with ranking protection | E11; E19 |
| Foreign structurally senior debt | Greater of USD 450 million and 18.0% | Formula extracted | Ranks first on foreign value | Minor | Reduces pledged-equity value | Negative for all group creditors | E04 |

#### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividends | USD 4,348 million paid in October 2024 | 6.75x unlimited basket | Used; remaining not calculable | Cash leaves group and collateral | High | Negative — Leverage Increase | E08; E28 |
| Investments in non-guarantors | Unlimited restricted-subsidiary investment | Uncapped | Not calculable: usage not disclosed | Stays in restricted group, leaves guarantee net | High | Negative — Covenant Erosion | E09 |
| General investments | Greater of USD 500 million and 25.0% of Total Assets | Grower | Not calculable: usage not disclosed | Can leave restricted group | High | Negative — Covenant Erosion | E09 |
| Unrestricted designation | Designation on compliance | Greater of USD 250 million and 10.0% | None identified | Leaves restricted group with lien release | Moderate | Negative — Covenant Erosion | E10 |
| Management equity and dividend equivalents | Annual caps with carry-forward | Greater of USD 50 million and 2.0%, capped by greater of USD 100 million and 4.0% | Not calculable: usage not disclosed | Cash leakage | Low | Neutral — Stable | E08 |

Post-period shareholder returns: the October 2024 payment of the September dividend is the dated restricted-payment usage signal; it is treated as usage of the ratio basket, not as period fact.

#### T4C.8 Add-back inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Credit agreement clause (m); 2033 indenture clause (M) | 25.0% and 35.0% of covenant EBITDA; 24 months | Not calculable: add-back ledger not disclosed | Raises denominator of every ratio | More debt and dividends permitted; lower recovery | E07; E21 |
| Transaction and refinancing expenses | Credit agreement clause (e) | Uncapped | Not calculable: amounts not disclosed | Recurring costs excluded | Earnings-quality review rejects these as recurring | E07; E29 |
| Dividend equivalent payments | Credit agreement clause (k) | Uncapped | Not calculable: amounts not disclosed | Distribution-linked costs added back | Dividends inflate their own capacity | E07 |
| Restructuring and integration costs | Credit agreement clause (d) | Uncapped | Not calculable: amounts not disclosed | Acquisition costs excluded | Supports serial acquisitions | E07; E29 |
| Earn-outs and non-cash charges | Credit agreement clauses (f) and (i) | Uncapped; cash reserves excluded | Not calculable: amounts not disclosed | Excludes acquisition consideration | Inflates capacity after deals | E07 |

#### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Credit dimension affected | Evidence ID |
|---|---|---|---|---|---|---|
| Basket reclassification | Borrower may divide and classify debt across categories | Capacity can be re-used across baskets | Moderate | High | Debt capacity | E04 |
| Mixed-basket restricted payments | Indenture lets payments combine baskets | Larger combined leakage | Moderate | High | Leakage | E23 |
| Uncapped restricted-subsidiary investment | No limit on investment in non-guarantors | Drop-down to non-guarantors | High | High | Structural priority | E09 |
| Bank-led collateral release | Notes follow bank release | Noteholder collateral shrinks without vote | High | Medium | Recovery control | E18 |
| No loan anti-subordination right | Each-lender list omits subordination | Uptier route | High | Medium | Recovery and priority | E11 |
| Covenant suspension | Investment-grade suspension under 2033 notes | Protections fall away | Low | High | Covenant protection | E22 |

#### Nearest pressure point and capacity view
Overall, TransDigm has limited covenant-capacity visibility. The main capacity concern is pari passu secured ratio debt, because cash netting and add-backs keep it open even though identified secured debt is already above 5.00x reported EBITDA, and further use would dilute first-lien recovery. Exact headroom is not supported for any ratio test; only the revolver trigger is measurable. Further analysis requires compliance certificates, basket usage records and the intercreditor agreement. The covenant-capacity review is completed with limitations.
Basis: d887611dex101.htm.jsonl, pages 58–59; Financial foundation (CP-1); calculation L11

#### T4C.11 Capacity priority matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured ratio debt and incremental loans | High | Formula Only | Pari dilution of shared collateral | Moderate | High | Track secured issuance and cash | E04; E05; E20 |
| 2 | Ratio dividends | High | Moderate | Value leaves the group | Moderate | Moderate | Track declarations | E08; E28 |
| 3 | Majority-lender amendment and non-pro-rata offers | High | Formula Only | Priority reshaped | Low | High for non-participants | Track amendment filings | E11; E12 |
| 4 | Investment in non-guarantors and general investments | High | Formula Only | Drop-down | Low | High | Track intercompany transfers | E09 |
| 5 | Add-back inflation | High | Formula Only | All baskets inflate | Indirect | Indirect | Compare covenant and reported EBITDA | E07; E21 |
| 6 | Revolver usage trigger | Low | High | Activates maintenance test | Signal | None | Quarter-end exposure | E01; E03 |

#### T4C.12 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Missing compliance certificate | Tested ratios and covenant EBITDA | Maintenance and incurrence headroom unconfirmable | Six ratio rows not calculable | Obtain certificates |
| Missing covenant EBITDA bridge | Add-back ledger | Ratio capacity unreliable | Add-back inflation not quantified | Obtain bridge |
| Missing basket usage tracker | Usage by basket | Remaining capacity undetermined | All remaining capacity not calculable | Obtain tracker |
| Missing Borrower Total Assets | Borrower-level total assets | General investment basket only indicative | Provisional estimate | Obtain Borrower figure |
| Missing Tranche L effective date confirmation | Agent effectiveness notice | MFN lapse date not fixed | No dated MFN event | Obtain notice |
| Definition conflict | Covenant debt versus carrying debt | Proxies differ from covenant figures | Proxies labelled as such | Obtain covenant debt figure |

#### Material claim lineage

| Claim | Material claim | Strongest lineage | Evidence ID |
|---|---|---|---|
| M1 | Maintenance test is revolver-only and springing | Directly Sourced | E01 |
| M2 | Secured, total and indenture ratio thresholds | Directly Sourced | E04; E20 |
| M3 | Restricted-payment ratio baskets | Directly Sourced | E08; E23 |
| M4 | Add-back caps and uncapped add-backs | Directly Sourced | E07; E21 |
| M5 | Required Lenders and each-lender list | Directly Sourced | E11; E12 |
| M6 | Notes lien release follows bank release; no direct action | Directly Sourced | E17; E18 |
| M7 | Notes each-holder ranking protection and 66 2/3% release threshold | Directly Sourced | E19 |
| M8 | Subordinated blockage and turnover | Directly Sourced | E24 |
| M9 | Guarantor perimeter and 65% foreign pledge | Directly Sourced | E14; E26 |
| M10 | Tranche L funded the dividend after certified leverage tests | Directly Sourced | E13 |
| M11 | Issuer reports covenant compliance at year-end | Directly Sourced | E03 |
| M12 | Revolver trigger headroom | Calculated | calculation L03 |
| M13 | Non-guarantor sales share | Calculated | calculation L04 |
| M14 | Noteholder share of first-lien principal | Calculated | calculation L07 |
| M15 | Dividend relied on the 6.75x basket | Analyst Inference | calculation L14 |
| M16 | Uptier and non-pro-rata routes are theoretical | Analyst Inference | E11 |
| M17 | Overall aggressiveness 4 out of 5 | Analyst Inference | E01; E04; E08; E11 |
| M18 | Tested ratios and basket usage | Insufficient Information | E03 |
| M19 | Intercreditor enforcement and standstill terms | Insufficient Information | E15 |

#### Verification

| Register | Present | Columns complete | Minimum rows met | Figures traced or gapped |
|---|---|---|---|---|
| T4.2 to T4.13 | PASS | PASS | PASS | PASS |
| T4D.1 to T4D.8 | PASS | PASS | PASS | PASS |
| T4F.1 to T4F.6 | PASS | PASS | PASS | PASS; intercreditor cells marked insufficient with the missing document named |
| T4C.2 to T4C.12 | PASS | PASS, with the affected-dimension column in place of a routing column | PASS | PASS |

## Calculations

All amounts are USD millions unless stated; ratios use matching currency and scale. Analytical proxies use carrying debt and issuer-adjusted or reported EBITDA and are not covenant figures.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | 2024-09-30 revolver exposure share | 67 / 910 | 0.073626373626373626373626373626373626374; displayed 7.36% | fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L02 | 2024-09-30 trigger amount | 910 × 0.40 | 364.00 | USD million | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L03 | 2024-09-30 trigger headroom | 364 − 67; 40.00 − 7.36 | 297; 32.64 | USD million; percentage points | calculation L01; calculation L02 |
| L04 | FY2024 non-guarantor sales | 7940 − 6294; 1646 / 7940; 6294 / 7940 | 1646; 0.20730478589420654911838790931989924433, displayed 20.73%; 0.79269521410579345088161209068010075567, displayed 79.27% | USD million; fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L05 | 2024-09-30 goodwill outside guarantor summary | 10419 − 8186 | 2233 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L06 | 2024-09-30 Required Lenders base | 8702 + 910; 9612 × 0.5; 3632 / 9612 | 9612; 4806.0; 0.37786100707449022055763628797336662505, displayed 37.79% | USD million; fraction | d887611dex101.htm.jsonl, page 71; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L07 | 2024-09-30 first-lien principal | 2100 + 2750 + 1450 + 1000 + 2200 + 1500; 8702 + 11000; 11000 / 19702 | 11000; 19702; 0.55831895239062024159983757994112272866, displayed 55.83% | USD million; fraction | Financial foundation (CP-1) |
| L08 | 2024-09-30 term loans above notes credit-facility basket | 8702 − 3100 | 5602 | USD million | d887611dex41.htm.jsonl, page 33; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L09 | Post-dividend, October 2024 event-only | 22967 / 4173 | 5.5037143541816439012700694943685597891; displayed 5.50x | x | Financial foundation (CP-1) |
| L10 | FY2024 coverage proxy | 4173 / 1286 | 3.2449455676516329704510108864696734059; displayed 3.24x | x | Financial foundation (CP-1) |
| L11 | Post-dividend secured proxy, October 2024 event-only | 19534 − 1913; 17621 / 4173; 17621 / 3813 | 17621; 4.2226216151449796309609393721543254254, displayed 4.22x; 4.6212955677943876212955677943876212956, displayed 4.62x | USD million; x | Financial foundation (CP-1) |
| L12 | FY2024 indicative general investment basket | 25586 × 0.25 | 6396.50 | USD million | d887611dex101.htm.jsonl, page 62; Financial foundation (CP-1) |
| L13 | Securitization basket floor less facility size | 725 − 650 | 75 | USD million | d887611dex101.htm.jsonl, page 60; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L14 | September dividend versus general basket floor | 4348 / 75 | 57.973333333333333333333333333333333333; displayed 57.97 times | times | d887611dex101.htm.jsonl, page 180; Business & governance (CP-1A) |

## Gaps

The open items below limit headroom, intercreditor control and series-level conclusions; they do not change the provision-level reading of the supplied documents.

| Gap | Severity | What is missing | Effect on conclusions | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement and Joinders 1 to 6 | First-lien enforcement order, standstill, turnover and purchase options not established | d887611dex41.htm.jsonl, page 30 |
| Tested covenant ratios and basket usage | MATERIAL | Compliance and officer certificates; basket trackers | Ratio headroom and remaining capacity not established; dividend-basket route inferred | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Current collateral agreement | MATERIAL | Guarantee and collateral agreement in current form, excluded assets, perfection status | Collateral scope and recovery access qualitative | d887611dex101.htm.jsonl, pages 173–174 |
| Other indentures | MINOR | 2028 to 2032 secured and 2029 subordinated indentures | Series thresholds assumed similar | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Guarantor list and entity data | MINOR | Guarantor list exhibit; entity-level debt and EBITDA | Structural subordination sized by sales and goodwill proxies only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| Market comparison | MINOR | Covenant-review report | No market-norm assessment | Not supplied: no comparative source in the set |

Relative conditions without a dated row: Tranche L MFN protection lapses eighteen months after the Amendment No. 17 effective date, which is set by agent notice not confirmed in the pages read; the springing covenant ceiling rises to 8.00x for four fiscal quarters after any material acquisition; and most 2033 note covenants suspend while both rating agencies rate the notes investment grade.

## Next module
The orchestrator selects the next module.
