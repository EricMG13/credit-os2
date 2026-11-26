## Request
TransDigm Group Incorporated, as of 2024-09-30; pathway: deep_credit_assessment. Interpret the supplied credit agreement and note indentures for covenant architecture, debt, lien and distribution capacity, guarantees, collateral, intercreditor mechanics, defaults and amendments, and translate them into default-risk and recovery effects for each creditor class.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, with the amended credit agreement annexed (execution version) | 2024-09-19, agreement date; publication not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: springing financial covenant, incremental facility, permitted debt, restricted payments, investments, ratio definitions, add-backs, events of default, amendment thresholds, governing law |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 (execution version) | 2024-09-19, indenture date; publication not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants: coverage-ratio debt and restricted payments, permitted debt and liens, collateral release, intercreditor reference, amendments, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date; publication not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, payment blockage, turnover, coverage-ratio tests, governing law |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer covenant summary and compliance statement, springing-test threshold, revolver and letters of credit, guarantor perimeter and obligor-group summary |
| d833756dex101.htm.jsonl | Amendment No. 16, loan modification and refinancing facility agreement (execution version) | 2024-06-04, agreement date; publication not stated | 386178c1071694cc794479a33723b3717a84d8f9b50b7c612a0aadbe71646aac | Document-authority register only; superseded in operative form by the September 2024 annexed text; not re-read |
| d739389dex101.htm.jsonl | Amendment and restatement agreement with the second restated credit agreement (execution version) | 2014-06-04, agreement date; publication not stated | 599f31abf0aa7b187a9bff99122a8cd143af1a7010252ba16ceff665df723547 | Document-authority register only; base agreement family; not re-read |
| d496141dex101.htm.jsonl | Amendment and restatement agreement involving TransDigm Inc. and TransDigm Group Incorporated | 2013-02-28, agreement date; publication not stated | f3296f34a0a29871c452cfdcdffa444ed3163ba19b7a2091f8da0081f6a659a3 | Document-authority register only; historical family; not re-read |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted issuer, date, legal-document inventory and coverage restrictions |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt register, carrying values, cash, EBITDA As Defined, post-balance-sheet dividend adjustment and pro forma net debt |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation facts, borrower and holdings identity, ownership of TransDigm Inc. |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Supported-only recurring EBITDA versus issuer-adjusted EBITDA |

## Findings

### Bottom line
Covenant protection is thin and lender value depends on financial policy, not contract: the package is cov-lite, distributions are unlimited inside a 6.75x net-leverage test, and pari secured debt can grow to 5.00x secured net leverage, diluting first-lien recovery rather than priming it.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, page 146

The strongest protections are sacred rights in the 2033 secured-note indenture, where a ranking change needs every affected holder and releasing substantially all collateral needs two-thirds, plus contractual seniority over USD 4,600 million of subordinated notes that face a payment blockage of up to 179 days. The weakest point for secured noteholders is that their lien is released whenever the bank collateral agent releases its own. The September recapitalisation shows the capacity is usable: year-end net debt of USD 18,619 million becomes USD 22,967 million, or 6.02x reported EBITDA, pro forma for the October 2024 dividend.
Basis: d887611dex41.htm.jsonl, pages 116–118; d887611dex41.htm.jsonl, pages 135–137; d826058dex41.htm.jsonl, pages 106–107; Financial foundation (CP-1); calculation L10

### Key findings
- Default risk will not be signalled early by covenants. Term lenders and noteholders have no maintenance test; the revolving lenders' 7.50x net leverage test applies only when revolver usage exceeds 40% of commitments, and implied usage at year-end was 7.36%. Exposure would have to rise from USD 67 million of letters of credit to above USD 364 million before any test applies, and a breach accelerates the term loans only after revolving lenders terminate or accelerate. Deterioration will therefore surface through liquidity and refinancing pressure rather than a covenant default that forces early negotiation.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation L01; calculation L02
- Shareholder distributions are limited by leverage ratios, not by amount. The credit agreement allows any dividend with no default and net leverage at or below 6.75x after the payment and its financing; the indentures allow any dividend while fixed-charge cover exceeds 2.00x. Post-dividend net debt is about 5.50x issuer EBITDA As Defined, an analytical proxy rather than the covenant ratio, so the September recapitalisation sat inside the test and further debt-funded payouts are not contractually barred. Unrestricted-subsidiary designation is gated by the same tests, so the same capacity can also move assets out of the guarantor group.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 74–77; Financial foundation (CP-1); calculation L04
- Lien dilution, rather than priming, is the main recovery risk for first-lien creditors. New pari secured debt is allowed up to 5.00x secured net leverage under the credit agreement, while the 2033 notes indenture permits liens for all credit-facility obligations with no indenture-level secured cap. The existing first-lien stack is USD 19,702 million of principal; on the same proxy basis, secured net leverage rises from 3.18x at year-end to 4.22x after the dividend, so the remaining room is real but narrower than the year-end balance sheet suggests.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, page 146; d887611dex41.htm.jsonl, page 12; d887611dex41.htm.jsonl, pages 39–42; d887611dex41.htm.jsonl, page 87; calculation L05; calculation L06; calculation L09
- Secured noteholders have less control over collateral than the bank lenders. The 2033 indenture releases the noteholders' lien on any asset when the credit agreement collateral agent releases its own, unless the release comes from a full cash discharge of the bank debt, and the First Lien Intercreditor Agreement overrides the indenture in any conflict. That agreement is not in the source set, so who directs enforcement is not established; the release clause alone means bank-side decisions can reduce note collateral without a noteholder vote.
Basis: d887611dex41.htm.jsonl, pages 135–137; d887611dex41.htm.jsonl, page 30
- Covenant earnings run ahead of reported earnings, which loosens every ratio test and grower basket. Projected cost savings may be added up to 25% of Consolidated EBITDA under the credit agreement and 35% under the 2033 indenture, alongside noncash compensation and dividend-equivalent add-backs. Recurring EBITDA supported by the evidence is USD 3,813 million against USD 4,173 million EBITDA As Defined, so covenant ratios will understate economic leverage.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, page 26; d887611dex41.htm.jsonl, page 16; Earnings quality (CP-1D)
- Structural subordination is material but bounded. Non-guarantor subsidiaries generate roughly 20.73% of sales, about USD 1,646 million, and both secured and subordinated notes rank behind their liabilities. Foreign restricted subsidiaries may borrow the greater of USD 450 million and a share of EBITDA, and non-guarantor ratio debt is capped at USD 400 million under the 2033 indenture, which limits how much debt can be placed ahead of the guarantor group.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, page 60; d887611dex41.htm.jsonl, page 36; d887611dex41.htm.jsonl, page 79; calculation L07
- Subordinated noteholders are the most exposed class. They are contractually subordinated to all senior debt, must hand over distributions until senior debt is paid in cash, and can be stopped from receiving payments for up to 179 days in any 360 days once designated senior debt is in default.
Basis: d826058dex41.htm.jsonl, pages 106–107

### Contrary evidence and what would change the view
The strongest case against this view is that the ratio tests have real bite and the company operates inside them. Incremental debt needs net leverage at or below 7.25x and secured net leverage at or below 5.00x, ratio-based distributions need 6.75x, every amendment that changes ranking needs each affected secured noteholder, new term loans carry a 50 bp pricing protection, and the issuer states it complied with all debt covenants at year-end. The recapitalisation was executed within these limits, which shows the documents constrain size even if they allow the transaction. The view would soften if the First Lien Intercreditor Agreement gave noteholders a voting share in enforcement or limited the release-follows-bank clause, or if covenant-defined net leverage were disclosed close to 6.75x, which would cap further distributions. It would harden if a further amendment added lien-subordination or asset-transfer permissions, or if another dividend were funded with pari secured debt that pushes secured net leverage toward 5.00x.
Basis: d887611dex101.htm.jsonl, page 146; d887611dex101.htm.jsonl, pages 143–145; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 116–118; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- The First Lien Intercreditor Agreement is not in the source set, so the conclusion that secured noteholders have weaker collateral control than bank lenders rests on the indenture release clause alone; the agreement could strengthen or weaken that ranking of control between the two secured classes.
Basis: d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 135
- No covenant-defined ratio, unrestricted-cash figure or basket-usage record is supplied, so the finding that distribution and pari-debt capacity remain open is drawn from the ratio terms and analytical proxies; no remaining capacity in dollars is established, and actual room could be larger or smaller than the proxies imply.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L04; calculation L05
- Only the 2033 secured-note and 2027 subordinated-note indentures were read; differences in the other note indentures, notably the narrower guarantor test the issuer describes for the 2028 secured notes, could change the class-by-class structural ranking set out here.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58
- The guarantee and collateral agreement, security schedules and excluded-asset definitions are not supplied, so the collateral map is qualitative and the recovery-access view for first-lien creditors cannot identify which assets sit outside the lien.
Basis: Source readiness (CP-0)
- The absence of an each-lender consent right for lien or payment subordination in the credit agreement is based on the amendment clause reviewed, not an exhaustive read; the uptier vulnerability for term lenders is therefore rated theoretical rather than demonstrated.
Basis: d887611dex101.htm.jsonl, pages 204–205

### Nearest pressure point
The nearest pressure point is pari secured debt capacity used to fund distributions, the route the company took in September. The credit agreement allows pari secured debt while secured net leverage stays at or below 5.00x and distributions while net leverage stays at or below 6.75x, and the 2033 indenture adds no secured-debt cap of its own for credit-facility borrowings. A further secured-debt-funded dividend would raise claims on the same collateral without adding earnings, lowering first-lien recovery and adding interest burden, which raises default probability in a downturn. The signal to watch is any new pari secured incurrence or incremental tranche announced alongside a special dividend, or secured net leverage moving toward 5.00x. Covenant-defined secured net leverage, the unrestricted-cash figure and the First Lien Intercreditor Agreement are needed to size the remaining room.
Basis: d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 12; calculation L05; Business & governance (CP-1A)

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package, the fourth of five rubric levels, because it combines a springing-only maintenance test, ratio-gated unlimited distributions and investments, pari secured capacity to 5.00x secured net leverage and broad cost-saving add-backs. The main creditor protections are the incurrence ratios, sacred rights on payment terms and note ranking, two-thirds or unanimous consent for releasing substantially all collateral, and contractual subordination of the subordinated notes. The main weaknesses are the release-follows-bank clause in the secured indenture and distribution capacity that rises with covenant earnings. The primary default-risk path is debt-funded distributions eroding cash and coverage without any covenant trigger; the primary recovery path is pari secured dilution of the first-lien pool. For security selection, secured term loans and secured notes share payment rank, but the notes' weaker release control and the subordinated notes' blockage and turnover exposure separate the classes. Further work requires the intercreditor agreement, the security documents and covenant compliance calculations. Legal & covenants completed with limitations.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 135–137; d826058dex41.htm.jsonl, pages 106–107

### Capital structure

| Instrument | Principal or commitment (USD m) | Rank and security | Guarantors | Governing document in source set | Source |
|---|---|---|---|---|---|
| Term loans I–L | 8702 | Senior secured first lien; equal payment rank with secured notes | Holdings and subsidiary guarantors under the credit agreement | Credit agreement annexed to the September 2024 amendment (New York law) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Revolving credit facility | 910 commitment; 67 letters of credit; 843 available | Senior secured first lien | Same as term loans | Same credit agreement | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2028 secured notes | 2100 | Senior secured; equal payment rank | TD Group, TransDigm UK, domestic restricted subsidiaries | Indenture not in source set | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| 2029 secured notes | 2750 | Senior secured; equal payment rank | TD Group and restricted subsidiaries meeting the bank or USD 200 million capital-markets test | Indenture not in source set | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| 2030 secured notes | 1450 | Senior secured; equal payment rank | Same test as 2029 secured notes | Indenture not in source set | Financial foundation (CP-1) |
| 2031 secured notes | 1000 | Senior secured; equal payment rank | Same test as 2029 secured notes | Indenture not in source set | Financial foundation (CP-1) |
| 2032 secured notes | 2200 | Senior secured; equal payment rank | Same test as 2029 secured notes | Indenture not in source set | Financial foundation (CP-1) |
| 2033 secured notes | 1500 | Senior secured first lien under the First Lien Intercreditor Agreement | Same test as 2029 secured notes | 2033 indenture (New York law) | d887611dex41.htm.jsonl, page 30 |
| 2027 senior subordinated notes | 2650 | Unsecured; subordinated to senior debt | TD Group, TransDigm UK, domestic restricted subsidiaries (subordinated) | 2027 indenture (New York law) | d826058dex41.htm.jsonl, page 106 |
| January 2029 senior subordinated notes | 1200 | Unsecured; subordinated | Same as 2027 subordinated notes | Indenture not in source set | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 57 |
| May 2029 senior subordinated notes | 750 | Unsecured; subordinated | Same as 2027 subordinated notes | Indenture not in source set | Financial foundation (CP-1) |
| Trade receivable securitization | 487.5 drawn of 650 | Receivables in a securitization entity; outside the guarantor collateral | Not applicable: non-recourse except standard undertakings | Facility agreement not in source set | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

Secured principal totals USD 19,702 million and subordinated principal USD 4,600 million; carrying values differ and are set out by Financial foundation.

### Covenant tests and headroom

| Test | Document | Threshold | Current | Headroom | Status |
|---|---|---|---|---|---|
| Revolver usage trigger for the springing test | Credit agreement | 40% of revolving commitments | 7.36% | 32.64% of commitments | Not triggered |
| Springing net leverage (revolving lenders only) | Credit agreement | 7.50x; 8.00x for four quarters after a material acquisition | Not supplied: covenant ratio not disclosed | Not calculable | Not tested at year-end |
| Incremental facility net leverage | Credit agreement | 7.25x | Not supplied: covenant ratio not disclosed | Not calculable | Issuer states compliance |
| Pari secured and incremental secured net leverage | Credit agreement | 5.00x | Not supplied: covenant ratio not disclosed | Not calculable | Issuer states compliance |
| Ratio-based restricted payments | Credit agreement | 6.75x | Not supplied: covenant ratio not disclosed | Not calculable | Recap executed inside the test |
| Ratio-based other investments | Credit agreement | 5.75x | Not supplied: covenant ratio not disclosed | Not calculable | Not established |
| Fixed-charge cover for ratio debt and restricted payments | 2033 and 2027 indentures | Above 2.00x | Not supplied: covenant ratio not disclosed | Not calculable | Issuer states compliance |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage trigger | 40.00 | 7.36 | 32.64% of commitments | Passes at or below | % of revolving commitments | Credit agreement financial covenant; current is letters of credit USD 67 million over USD 910 million commitments, assuming no revolving loans; cash-collateralised letters of credit not established |
| Springing net leverage | 7.50 | Not supplied: covenant ratio not disclosed and test not triggered | Not supplied: tested ratio not disclosed | Passes at or below | x | Applies only above the usage trigger; 8.00x for four quarters after a material acquisition |
| Incremental net leverage | 7.25 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test on pro forma basis; covenant EBITDA includes add-backs not reported by the issuer |
| Secured net leverage for pari secured debt | 5.00 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test; proxy 4.22x after the dividend is analytical only |
| Ratio restricted payments | 6.75 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Incurrence test including financing for the payment; proxy 5.50x is analytical only |
| Ratio other investments | 5.75 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes at or below | x | Also requires no revolving loans and USD 200 million unrestricted cash |
| Indenture fixed-charge cover | 2.00 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio not disclosed | Passes above | x | Proxy 3.35x on full-year interest before the September borrowing is analytical only |

Only the usage trigger has a disclosed current value; every leverage and coverage test is an incurrence or springing test whose covenant-defined current ratio is not published, so no headroom is shown for them and the chart is not a compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: exhibit publication date not stated in the supplied file | First Lien Intercreditor Agreement dated | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs pari first-lien enforcement and release; controls over the indenture in conflicts; text not supplied |
| 2019-11-13 | day | Not supplied: exhibit publication date not stated in the supplied file | Indenture for the 2027 senior subordinated notes dated | Historical — indenture date | d826058dex41.htm.jsonl, page 1 | Sets subordination, payment blockage and turnover for the subordinated class |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement executed | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Restrictive covenants in force at year-end trace to this amendment |
| 2024-09-19 | day | Not supplied: exhibit publication date not stated in the supplied file | Amendment No. 17 and incremental Tranche L term loans of USD 1,500 million | Historical — incremental term loan assumption agreement | d887611dex101.htm.jsonl, page 1 | Used incremental capacity to fund the special dividend; restarts an 18-month pricing-protection window for Tranche L |
| 2024-09-19 | day | Not supplied: exhibit publication date not stated in the supplied file | 2033 secured notes indenture and Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Added USD 1,500 million pari first-lien notes to the shared collateral; the October dividend payment itself belongs to Business & governance |
| 2024-09-30 | day | 2024-11-07 | Company in compliance with all debt covenants | Historical — in compliance with all of its debt covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | No covenant default at year-end; covenant-defined ratios not disclosed |
| 2027-09-15 | day | Not supplied: exhibit publication date not stated in the supplied file | Initial Redemption Date of the 2033 secured notes | Scheduled — “Initial Redemption Date” means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Optional redemption opens, increasing refinancing and liability-management flexibility for the issuer |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 7 |
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

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all capital stock | Ownership | TransDigm Inc. | Annual report p4; both Delaware corporations |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | Secured notes 2028–2033 | Annual report p58; NY-law indentures; Delaware |
| TransDigm UK | Senior secured guarantee | Guarantee | 2028 secured notes | Annual report p58; UK jurisdiction not established |
| Domestic restricted subsidiaries | Senior secured guarantee | Guarantee | Secured notes 2028–2033 | Annual report p58; US domestic; NY-law indentures |
| TransDigm Group Incorporated | Senior subordinated guarantee | Guarantee | Subordinated notes | Annual report p57; 2027 indenture NY law |
| TransDigm UK | Senior subordinated guarantee | Guarantee | Subordinated notes | Annual report p57; UK jurisdiction not established |
| Domestic restricted subsidiaries | Senior subordinated guarantee | Guarantee | Subordinated notes | Annual report p57; 2027 indenture NY law |
| TransDigm Inc. | Liens on Collateral for notes | Security | 2033 secured notes | 2033 indenture art. XII; NY law; Delaware issuer |
| Non-guarantor subsidiaries | Liabilities rank ahead structurally | Structural claim | Secured notes 2028–2033 | Annual report p58; jurisdictions not established |
| Non-guarantor subsidiaries | Liabilities rank ahead structurally | Structural claim | Subordinated notes | Annual report p57; jurisdictions not established |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facility lenders | Equal right of payment | Payment rank | Secured noteholders | Annual report p58; NY-law credit agreement |
| Credit facility lenders | Shared first-priority lien | Security rank | Secured noteholders | 2033 indenture s4.12; First Lien ICA; NY law |
| Senior debt holders | Paid in full in cash first | Payment rank | Subordinated noteholders | 2027 indenture art. 10; NY law |
| Designated senior debt representative | Up to 179-day payment blockage | Standstill | Subordinated noteholders | 2027 indenture s10.03; NY law |
| Credit agreement collateral agent | Its lien release releases notes lien | Release | Secured noteholders | 2033 indenture s12.07(e)(B); NY law |

### Analytical appendix — complete canonical registers

All monetary amounts in the registers are USD millions unless stated. Ratios labelled proxy use issuer EBITDA As Defined and carrying-value debt from Financial foundation and are not covenant calculations.

### Evidence references

| Evidence ID | Provision or fact | Source |
|---|---|---|
| E01 | Springing financial covenant: net leverage not above 7.50x (8.00x for four quarters after a Material Acquisition) when revolving exposure exceeds 40% of commitments; amendable only by Required Revolving Lenders | d887611dex101.htm.jsonl, page 188 |
| E02 | Events of default: covenant breach other than the financial covenant; financial covenant default is a term-lender default only after revolving lenders terminate or accelerate; subordination failure; change of control | d887611dex101.htm.jsonl, pages 191–192 |
| E03 | Incremental facility: unlimited amount subject to net leverage at or below 7.25x and secured net leverage at or below 5.00x; 50 bp MFN with 18-month sunset and acquisition carve-out; maturity and average-life limits | d887611dex101.htm.jsonl, pages 142–146 |
| E04 | Permitted debt: pari secured at secured net leverage at or below 5.00x; junior or unsecured at net leverage at or below 7.25x; general basket greater of USD 250 million and 10.0% of Consolidated EBITDA; foreign subsidiaries greater of USD 450 million and 18.0%; subordinated debt at 7.25x; securitization greater of USD 725 million and 20.0% | d887611dex101.htm.jsonl, pages 59–60 |
| E05 | Restricted payments: general basket greater of USD 75 million and 3.0%; management and dividend-equivalent basket; unlimited if no default and net leverage at or below 6.75x pro forma including financing | d887611dex101.htm.jsonl, pages 177–181 |
| E06 | Permitted investments: greater of USD 500 million and 25.0% of Total Assets; joint ventures greater of USD 1,000 million and 40.0% at 7.00x; permitted acquisitions with USD 100 million liquidity; unlimited at 5.75x with no revolving loans and USD 200 million unrestricted cash | d887611dex101.htm.jsonl, pages 62–63 |
| E07 | Consolidated Net Leverage Ratio and Consolidated Secured Net Debt Ratio defined net of Unrestricted Cash over four-quarter Consolidated EBITDA; non-cash and deferred compensation and purchase-accounting exclusions | d887611dex101.htm.jsonl, pages 26–27 |
| E08 | Consolidated EBITDA cost-savings add-back capped at 25.0% of Consolidated EBITDA | d887611dex101.htm.jsonl, page 24 |
| E09 | Amendments: Required Lenders generally; each affected lender for payment terms; each lender for pro rata sharing, voting thresholds, release of material guarantors and of all or substantially all collateral; agent may add pari or junior secured debt to collateral documents; Required Lenders may permit non-pro rata offers to all lenders of a class | d887611dex101.htm.jsonl, pages 204–205 |
| E10 | Indenture Consolidated EBITDA: dividend-equivalent add-back; cost savings within 24 months capped at 35.0%; fixed-charge cover definition with officer good-faith pro forma and expense-reduction adjustments | d887611dex41.htm.jsonl, pages 16–19 |
| E11 | Indenture permitted debt: credit facilities USD 3,100 million less securitization debt; general basket greater of USD 250 million and 12.0%; foreign subsidiaries greater of USD 450 million and 20.0%; acquisition debt if ratio met or cover improves; reclassification allowed | d887611dex41.htm.jsonl, pages 33–37 |
| E12 | Indenture liens: Bank Indebtedness means all obligations under the Credit Facilities and its liens are permitted; general lien basket greater of USD 50 million and 2.0%; secured debt otherwise must be junior or a Permitted Lien | d887611dex41.htm.jsonl, page 12; d887611dex41.htm.jsonl, pages 39–42; d887611dex41.htm.jsonl, page 87 |
| E13 | Indenture restricted payments unlimited with no default and fixed-charge cover above 2.00x; unrestricted-subsidiary designation as deemed restricted payment at fair market value; ratio debt above 2.00x with USD 400 million non-guarantor cap | d887611dex41.htm.jsonl, pages 74–79 |
| E14 | Indenture amendments: majority generally, counting exchange-offer consents; each affected holder for payment terms and adverse ranking changes; 66⅔% to release all or substantially all collateral or adversely modify the intercreditor agreement | d887611dex41.htm.jsonl, pages 116–118 |
| E15 | Collateral release: automatic on guarantee release, permitted asset sales, credit agreement agent release other than on full cash discharge, unrestricted designation, immaterial subsidiary; intercreditor agreement controls conflicts | d887611dex41.htm.jsonl, pages 135–137; d887611dex41.htm.jsonl, page 30 |
| E16 | Subordinated notes: subordinated to Senior Debt; payment default stop; blockage of 179 days, one per 360 days, at least 181 days unblocked; turnover until senior paid in cash | d826058dex41.htm.jsonl, pages 106–107 |
| E17 | Subordinated notes: restricted payments and ratio debt gated by fixed-charge cover above 2.00x | d826058dex41.htm.jsonl, page 64; d826058dex41.htm.jsonl, page 67 |
| E18 | Guarantor perimeter, structural subordination to non-guarantors, obligor-group sales USD 6,294 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| E19 | Issuer covenant summary: no maintenance covenants except revolver; 40% usage equals USD 364 million; compliance at year-end; Amendment No. 15 the latest covenant amendment | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E20 | Term loans USD 8,702 million; revolver USD 910 million; letters of credit USD 67 million; availability USD 843 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| E21 | Carrying debt, secured carrying debt USD 19,534 million, EBITDA As Defined USD 4,173 million, year-end and pro forma net debt | Financial foundation (CP-1) |
| E22 | September declaration and October 2024 payment of the special dividend, funded with USD 3,000 million new secured debt and cash | Business & governance (CP-1A) |
| E23 | Governing law: New York for the credit agreement and both indentures | d887611dex101.htm.jsonl, page 222; d887611dex41.htm.jsonl, page 126; d826058dex41.htm.jsonl, page 124 |
| E24 | Supported-only recurring EBITDA USD 3,813 million | Earnings quality (CP-1D) |

### T4.1 Source gate and module status

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement annexed to the September 2024 amendment | Executed, conformed annex | 1 | Schedules, guarantee and collateral agreement not supplied | Completed with Limitations |
| 2033 secured notes indenture | Executed | 1 | Security documents not supplied | Completed with Limitations |
| 2027 subordinated notes indenture | Executed | 1 | Other subordinated indentures not supplied | Completed with Limitations |
| First Lien Intercreditor Agreement | Not in source set | 2 | Enforcement control, standstill and turnover among first-lien classes not established | Completed with Limitations |
| Compliance certificates and basket trackers | Not in source set | 3 | Tested ratios and usage not established | Completed with Limitations |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement annexed to Amendment No. 17 | Credit agreement | 2024-09-19 | Executed, conformed | Controls term-loan and revolver covenants, incremental capacity and lender voting | Primary source for distribution, debt, lien and investment capacity | E01; E03; E04; E05; E06; E09 |
| 1 | 2033 secured notes indenture | Indenture | 2024-09-19 | Executed | Controls 2033 secured-note covenants, collateral release and amendments | Representative secured-note terms; other secured indentures not supplied | E10; E11; E12; E13; E14; E15 |
| 1 | 2027 subordinated notes indenture | Indenture | 2019-11-13 | Executed | Controls subordination, blockage, turnover for the 2027 notes | Representative subordinated-note terms | E16; E17 |
| 1 | Amendment No. 16 | Credit agreement amendment | 2024-06-04 | Executed | Superseded in operative form by the September 2024 annex | No separate effect relied on | E19 |
| 1 | 2014 amendment and restatement | Credit agreement base | 2014-06-04 | Executed | Base family; superseded by annexed restated text | Provenance only | E19 |
| 1 | 2013 amendment and restatement | Credit agreement history | 2013-02-28 | Executed | Historical | Provenance only | E19 |
| 2 | First Lien Intercreditor Agreement and Joinders No. 1 to 6 | Intercreditor agreement | 2019-02-13; latest joinder 2024-09-19 | Executed per indenture reference; text not in source set | Controls enforcement and release among first-lien classes | [Insufficient Information] — intercreditor agreement not in the source set | E15 |
| Not ranked: issuer filing | Annual report for FY2024 | Issuer periodic report | 2024-11-07 | Filed | Summarises covenants and states compliance | Corroborates thresholds and perimeter; not a legal source | E18; E19; E20 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x, tested only when revolving exposure exceeds 40% of commitments; 8.00x for four quarters after a material acquisition | Credit agreement s6.14 | No early-warning test for term lenders or noteholders | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the set | E01 |
| Financial covenant default | Term-lender default only after revolving lenders terminate or accelerate | Credit agreement art. VII (l) | Revolving lenders alone decide whether a breach escalates | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the set | E02 |
| Incremental facility | Unlimited subject to net leverage at or below 7.25x and secured net leverage at or below 5.00x | Credit agreement s2.24(c) | Pari secured debt can be added without lender consent | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the set | E03 |
| MFN | 50 bp yield protection; lapses after 18 months, for later maturities and for acquisition debt | Credit agreement s2.24(b) | Repricing protection is time-limited | Negative — Refinancing Risk | [Insufficient Information] — no comparative source in the set | E03 |
| Ratio and general debt | Pari secured at 5.00x; junior or unsecured at 7.25x; general basket greater of USD 250 million and 10.0% | Credit agreement Permitted Indebtedness (12), (13), (17) | Debt capacity rises with covenant EBITDA | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the set | E04 |
| Restricted payments (bank) | Unlimited with no default and net leverage at or below 6.75x including financing | Credit agreement s6.02 final paragraph | Debt-funded dividends permitted inside the ratio | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the set | E05 |
| Restricted payments (notes) | Unlimited with no default and fixed-charge cover above 2.00x | 2033 indenture s4.07; 2027 indenture | Coverage test is looser than the bank leverage test | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the set | E13; E17 |
| Investments | Greater of USD 500 million and 25.0% of Total Assets; JVs to 40.0% at 7.00x; unlimited at 5.75x with conditions | Credit agreement Permitted Investments (10), (11), (20) | Value can move to non-guarantors or JVs | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the set | E06 |
| Unrestricted subsidiaries | Designation allowed if the deemed restricted payment at fair market value is permitted | 2033 indenture s4.07 | Ratio-based RP capacity doubles as designation capacity | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the set | E13 |
| Liens (notes) | Liens for all credit-facility obligations permitted; other secured debt must be junior or a Permitted Lien | 2033 indenture s4.12; Permitted Liens (iii), (xx), (xxix) | Notes rely on the bank secured-leverage test for dilution protection | Negative — Leverage Increase | [Insufficient Information] — no comparative source in the set | E12 |
| EBITDA add-backs | Cost savings capped at 25% (bank) and 35% (notes); compensation and dividend equivalents excluded from expense | Credit agreement Consolidated EBITDA (m); 2033 indenture Consolidated EBITDA (M), (K) | Ratio tests and grower baskets inflate | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the set | E07; E08; E10 |
| Collateral release | Notes lien released when bank agent releases, other than on full cash discharge | 2033 indenture s12.07(e)(B) | Bank-side decisions bind noteholders' collateral | Negative — Covenant Erosion | [Insufficient Information] — no comparative source in the set | E15 |
| Amendments (bank) | Required Lenders generally; each lender for pro rata sharing and release of substantially all collateral | Credit agreement s9.02 | No each-lender right on lien subordination identified in pages reviewed | Insufficient Information | [Insufficient Information] — no comparative source in the set | E09 |
| Amendments (notes) | Majority, counting exchange-offer consents; each holder for adverse ranking change; 66⅔% for collateral release | 2033 indenture s9.02 | Ranking protection strong; covenant strip by majority exit consent possible | Neutral — Stable | [Insufficient Information] — no comparative source in the set | E14 |
| Subordination | Blockage up to 179 days per 360 days; turnover until senior paid in cash | 2027 indenture art. 10 | Junior payments stop in senior default | Negative — Liquidity Deterioration | [Insufficient Information] — no comparative source in the set | E16 |

### Provision-level findings: definitions, incurrence, leakage, collateral, defaults

| Provision | Summary | PD effect | LGD / recovery effect | Monitoring implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA definitions | Cost-savings add-backs capped at 25% or 35%; compensation and dividend-equivalent add-backs; officer good-faith pro forma acquisition adjustments | Delays any ratio-based constraint as earnings weaken | Grower baskets and ratio capacity expand debt ahead of creditors | Track issuer EBITDA As Defined against supported recurring EBITDA of USD 3,813 million | Negative — Covenant Erosion | High | E07; E08; E10; E24 |
| Covenant net debt definition | Total Indebtedness minus Unrestricted Cash; Total Indebtedness basis not read | Cash netting flatters ratios while cash is held for distributions | Not applicable to collateral | Obtain definition and compliance certificate | Insufficient Information | Medium | E07 |
| Incremental and ratio debt | Incremental to 7.25x net and 5.00x secured net; MFN 50 bp with 18-month sunset | Higher interest burden from debt-funded payouts | Pari dilution of first-lien pool | Track incremental tranches and secured issuance | Negative — Leverage Increase | High | E03; E04 |
| Ratio restricted payments | Unlimited at 6.75x (bank) and above 2.00x cover (notes) | Cash leaves the group without covenant trigger | Lower cash and higher debt at default | Track special dividends and their funding | Negative — Leverage Increase | High | E05; E13 |
| Collateral release follows bank | Notes lien released with bank lien | No direct PD effect | Note collateral can shrink without noteholder vote | Monitor credit agreement amendments and release notices | Negative — Covenant Erosion | High | E15 |
| Subordination and blockage | Blockage and turnover for subordinated notes | Junior payment stop in senior default accelerates distress | Junior recoveries flow to seniors until paid | Track senior defaults and blockage notices | Negative — Liquidity Deterioration | High | E16 |
| Default and amendment mechanics | Financial covenant default reaches term lenders only via revolver; majority amendments with exchange-offer consents | Fewer default triggers; more room for out-of-court changes | Exit-consent covenant strip possible for notes | Monitor exchange offers and consent solicitations | Negative — Covenant Erosion | Medium | E02; E09; E14 |

### Definition conflict register

| Metric | Covenant definition | Financial foundation basis | Divergence | Resolution | Source |
|---|---|---|---|---|---|
| Net leverage | Consolidated Total Indebtedness minus Unrestricted Cash over Consolidated EBITDA with add-backs | Carrying debt USD 24,880 million less all reported cash over reported EBITDA | Debt basis, cash restriction test and EBITDA add-backs differ; covenant figure not disclosed | Covenant definition governs tests; proxies labelled analytical only | d887611dex101.htm.jsonl, pages 26–27; Financial foundation (CP-1) |
| Secured debt | Consolidated Secured Debt is Total Indebtedness secured by liens | Secured carrying value USD 19,534 million; principal USD 19,702 million | Principal versus carrying value; securitization debt treatment not established | Both figures retained; no reconciliation | d887611dex101.htm.jsonl, page 27; Financial foundation (CP-1); calculation L09 |
| Indenture interest | Consolidated Interest Expense excludes debt-cost amortization and securitization costs | Net interest excluding debt-cost amortization USD 1,246 million | Securitization and swap effects not separated | Proxy only | d887611dex41.htm.jsonl, page 19; Financial foundation (CP-1) |
| Customer advances | Inclusion in Indebtedness not established | Contract liabilities USD 177 million treated as non-debt float | Not established whether outside every debt basket | Logged as capacity-relevant gap | Financial foundation (CP-1) |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Springing covenant | Test applies only above 40% revolver usage | No covenant trigger before liquidity stress | Higher: default arrives late and abruptly | Lower recovery from later intervention | Revolver usage and letters of credit each quarter | E01; E19 |
| Ratio restricted payments | Unlimited at 6.75x net leverage | Debt-funded dividends | Higher interest burden and lower cash buffer | Less value per unit of claim | Special dividend announcements with new debt | E05; E22 |
| Pari secured capacity | Up to 5.00x secured net leverage | Dilution of the shared first-lien pool | Moderate | Higher LGD for all first-lien classes | Secured issuance and incremental tranches | E03; E04 |
| Release follows bank | Notes lien released with bank lien | Collateral reduction without noteholder vote | Neutral | Higher LGD for secured notes than for term loans | Credit agreement amendments | E15 |
| Structural subordination | Non-guarantors roughly 20.73% of sales | Non-guarantor creditors paid first | Neutral | Higher LGD for all guarantor-level claims | Non-guarantor debt and sales share | E18; E11 |
| Subordination and blockage | Blockage up to 179 days, turnover | Junior payment stop in senior default | Higher for subordinated notes | Subordinated recovery only after senior paid | Senior defaults; blockage notices | E16 |
| Add-backs | Cost savings caps 25% and 35% | Inflated covenant EBITDA | Delays ratio constraints | Expands debt ahead of liquidation | Gap between covenant and recurring EBITDA | E08; E10 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions recorded in the covenant feature register | [Insufficient Information] — no covenant-review report or market-norm source in the set | Not assessed: market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed: no comparator | Insufficient Information | E19 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Springing 7.50x test only above 40% usage; term-lender default only via revolver | No early-warning trigger | Negative — Covenant Erosion | Completed | E01; E02 |
| Debt / lien incurrence capacity | 4 | Incremental unlimited inside 7.25x and 5.00x; indenture liens for all credit-facility debt; MFN sunset 18 months | Pari dilution and releveraging | Negative — Leverage Increase | Completed | E03; E04; E12 |
| RP / investment / leakage capacity | 4 | Unlimited RP at 6.75x or cover above 2.00x; unlimited investments at 5.75x; designation via RP capacity | Value leaves the guarantor group | Negative — Leverage Increase | Completed | E05; E06; E13 |
| EBITDA definitions and add-back flexibility | 4 | Cost savings to 25% and 35%; compensation and dividend-equivalent add-backs | All ratios and grower baskets inflate | Negative — Covenant Erosion | Completed | E07; E08; E10 |
| Collateral / guarantor protection | 4 | Release follows bank; release on designation; non-guarantors roughly 20.73% of sales; security documents absent | Collateral can shrink without noteholder vote | Negative — Covenant Erosion | Provisional | E15; E18 |
| Amendment / control mechanics | 3 | Sacred rights on payments and note ranking; collateral release each lender or 66⅔%; majority exit consents | Ranking protected; covenants strippable by majority | Neutral — Stable | Provisional | E09; E14 |
| Overall | 4 | Weighted to distribution and pari secured capacity | Debt-funded leakage without trigger | Negative — Leverage Increase | Provisional | E03; E05; E15 |

Covenant aggressiveness is scored at the fourth of five levels, Aggressive; status is Provisional because the intercreditor agreement and security documents are absent.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Debt-funded special dividend | Ratio RP at 6.75x; September recap | Demonstrated use of capacity | PD up; LGD up; secured RV weaker | Track dividend declarations and related issuance | E05; E22 |
| Pari secured issuance | Secured net leverage at or below 5.00x | Dilutes first-lien collateral | LGD up for first-lien classes | Track incremental tranches and secured notes | E03; E04 |
| Release-follows-bank | Notes lien released with bank lien | Collateral loss without noteholder vote | LGD up for secured notes | Monitor credit agreement amendments and release notices | E15 |
| Unrestricted designation | Deemed RP at fair market value | Moves guarantor assets out | LGD up | Monitor designations and guarantor releases | E13; E15 |
| Revolver usage above 40% | Springing test trigger | First covenant test becomes live | PD signal | Quarterly revolver and letters-of-credit usage | E01; E19 |
| Exchange offer with consent solicitation | Majority amendment counting exchange consents | Exit-consent covenant strip | RV risk for holdouts | Monitor consent solicitations | E14 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and joinders | Enforcement control, standstill and release among first-lien classes | Intercreditor registers and secured-note control view provisional | Obtain executed agreement and joinders |
| Security documents | Guarantee and collateral agreement, schedules, excluded assets | Collateral perimeter and excluded assets | Collateral map qualitative | Obtain security documents and schedules |
| Compliance data | Compliance certificates, covenant ratios, unrestricted cash, basket usage | Headroom and remaining capacity | All leverage tests Not Calculable | Obtain latest compliance certificate and basket tracker |
| Other indentures | 2028 to 2032 secured notes and 2029 subordinated notes indentures | Tranche-specific guarantor tests and covenants | Representative terms assumed only as issuer describes | Obtain each indenture |
| Comparator | Covenant-review or market-norm source | Market-norm assessment | Comparison not performed | Obtain third-party covenant review |
| Lien subordination consent | Full credit agreement read for lien or payment subordination protections | Uptier vulnerability | Rated theoretical | Read remaining provisions and any Serta-style protection |

### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement annex | Executed credit agreement | 2024-09-19 | Executed | Legal formula | Bank ratio tests and baskets | E01; E03; E04; E05; E06 |
| 1 | 2033 indenture | Executed indenture | 2024-09-19 | Executed | Legal formula | Note ratio tests and baskets | E10; E11; E12; E13 |
| 1 | 2027 indenture | Executed indenture | 2019-11-13 | Executed | Legal formula | Subordinated-note tests | E16; E17 |
| 3 | Compliance certificates | Covenant schedules | Not supplied: not in source set | Absent | Usage | [Insufficient Information] — no certificate in the source set | E19 |
| Financial input | Financial foundation | Accepted financial analysis | FY2024 | Accepted | Financial input | Carrying debt, cash, EBITDA As Defined | E21 |
| Issuer summary | Annual report | Issuer filing | 2024-11-07 | Filed | Financial input and usage | Usage trigger amount and compliance statement | E19; E20 |

### T4C.3 Covenant definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Total Indebtedness minus Unrestricted Cash over four-quarter Consolidated EBITDA | Covenant debt, unrestricted cash, covenant EBITDA | Gates incremental, RP, JV and investments | Cash netting and add-backs widen room | Negative — Covenant Erosion | E07 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Total Indebtedness minus Unrestricted Cash over Consolidated EBITDA | Secured debt, unrestricted cash, covenant EBITDA | Gates pari secured debt | Dilution limit for first lien | Negative — Leverage Increase | E07 |
| Consolidated EBITDA (bank) | Credit agreement definitions | Includes cost savings capped at 25% and compensation add-backs | Add-back schedule | Inflates all ratios | Capacity grows with projections | Negative — Covenant Erosion | E08 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Separate definition for the springing test; issuer describes it as EBITDA As Defined | Definition text not read in full | Governs springing test | Basis may differ from incurrence EBITDA | Insufficient Information | E07; E19 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture definitions | Consolidated EBITDA over Consolidated Fixed Charges, pro forma with officer adjustments | Covenant EBITDA, interest excluding debt costs | Gates ratio debt and unlimited RP | Coverage test loose relative to leverage | Negative — Leverage Increase | E10 |
| Consolidated EBITDA (notes) | 2033 indenture definitions | Adds dividend equivalents and cost savings capped at 35% | Add-back schedule | Inflates note tests | Wider cap than bank | Negative — Covenant Erosion | E10 |
| Bank Indebtedness | 2033 indenture definitions | All obligations under the Credit Facilities | Credit facility amount | Liens permitted without indenture cap | Notes rely on bank tests | Negative — Leverage Increase | E12 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage trigger | max-ratio | 40.00% | 7.36% | Revolving exposure excluding cash-collateralised letters of credit over revolving commitments | 32.64% | Compliant | Exposure taken as USD 67 million letters of credit over USD 910 million commitments with no revolving loans stated | Test is dormant until usage rises | Neutral — Stable | E01; E20; L01; L03 |
| Springing net leverage | max-ratio | 7.50x | [Insufficient Information] — missing: covenant-defined net leverage at 2024-09-30, not disclosed and not tested | Total Indebtedness minus Unrestricted Cash over Financial Covenant Consolidated EBITDA | [Insufficient Information] — missing: current tested ratio | Not Calculable | 8.00x for four quarters after a material acquisition | Only revolving lenders can call a breach | Negative — Covenant Erosion | E01; E19 |
| Incremental net leverage | max-ratio | 7.25x | [Insufficient Information] — missing: covenant-defined net leverage | Pro forma net leverage after incremental loans and use of proceeds | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 5.50x after the dividend is not covenant-defined | Room for further debt | Negative — Leverage Increase | E03; L04 |
| Secured net leverage | max-ratio | 5.00x | [Insufficient Information] — missing: covenant-defined secured net leverage | Pro forma secured net leverage after incurrence | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 4.22x after the dividend is not covenant-defined | Pari dilution limit | Negative — Leverage Increase | E03; E04; L05 |
| Ratio restricted payments | max-ratio | 6.75x | [Insufficient Information] — missing: covenant-defined net leverage | Pro forma net leverage after payment and its financing | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 5.50x is not covenant-defined | Debt-funded distributions | Negative — Leverage Increase | E05; L04 |
| Ratio other investments | max-ratio | 5.75x | [Insufficient Information] — missing: covenant-defined net leverage | Pro forma net leverage after investment | [Insufficient Information] — missing: current tested ratio | Not Calculable | Also needs no revolving loans and USD 200 million unrestricted cash | Unlimited investments when met | Negative — Covenant Erosion | E06 |
| Indenture fixed-charge cover | min-ratio | 2.00x | [Insufficient Information] — missing: covenant-defined fixed-charge cover | Consolidated EBITDA over Consolidated Fixed Charges, pro forma | [Insufficient Information] — missing: current tested ratio | Not Calculable | Proxy 3.35x uses full-year interest before the September borrowing | Gates ratio debt and unlimited RP under notes | Negative — Leverage Increase | E10; E13; L08 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Incremental facility capacity | Incremental term and revolving commitments | Incremental Ratio Amount | Net leverage at or below 7.25x; secured net at or below 5.00x; no default | [Insufficient Information] — covenant ratios not disclosed | Tranche L USD 1,500 million in September 2024; earlier usage not tracked | Not Calculable: covenant EBITDA and unrestricted cash not established | Not Calculable: inputs missing | Formula Extracted Only | High | Pari secured dilution | Negative — Leverage Increase | E03 |
| Debt incurrence capacity | General debt basket (bank) | General Basket: greater of USD 250 million and 10.0% of Consolidated EBITDA | None beyond amount | Fixed floor USD 250 million | [Insufficient Information] — no basket tracker | At least USD 250 million fixed floor | Not Calculable: usage unknown | Formula Extracted Only | Moderate | Can be secured on Collateral under the notes' parallel basket | Negative — Leverage Increase | E04; E11 |
| Debt incurrence capacity | Foreign restricted subsidiary debt | Grower Basket: greater of USD 450 million and 18.0% (bank) or 20.0% (notes) | Foreign restricted subsidiaries only | Fixed floor USD 450 million | [Insufficient Information] — no basket tracker | At least USD 450 million fixed floor | Not Calculable: usage unknown | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E04; E11 |
| Debt incurrence capacity | Securitization debt (bank) | Grower Basket: greater of USD 725 million and 20.0% | Non-recourse securitization | Facility USD 650 million; drawn USD 487.5 million at year-end | Remaining USD 162.5 million drawn in October 2024, a subsequent event | Facility sits inside the USD 725 million fixed floor | Not Calculable: EBITDA leg not computed | Ready with Limitations | Low | Receivables leave first-lien reach | Negative — Liquidity Deterioration | E04; E20 |
| Restricted payment capacity | Ratio RP (bank) | Ratio Basket: unlimited at net leverage at or below 6.75x | No default; pro forma including financing | [Insufficient Information] — covenant ratio not disclosed | USD 4,348 million paid October 2024 | Not Calculable: covenant inputs missing | Not Calculable: covenant inputs missing | Formula Extracted Only | High | Debt-funded dividends | Negative — Leverage Increase | E05; E22 |
| Restricted payment capacity | General RP basket (bank) | General Basket: greater of USD 75 million and 3.0% | No default | Fixed floor USD 75 million | [Insufficient Information] — no basket tracker | At least USD 75 million fixed floor | Not Calculable: usage unknown | Formula Extracted Only | Low | Small leakage | Neutral — Stable | E05 |
| Investment capacity | General investments and ratio investments | General Basket: greater of USD 500 million and 25.0% of Total Assets; unlimited at 5.75x | Ratio route needs no revolving loans and USD 200 million unrestricted cash | [Insufficient Information] — covenant ratio and Total Assets definition not established | [Insufficient Information] — no basket tracker | At least USD 500 million fixed floor | Not Calculable: usage unknown | Formula Extracted Only | High | Value to non-guarantors | Negative — Covenant Erosion | E06 |
| Lien capacity | Indenture Permitted Liens for Bank Indebtedness | Free-and-Clear Amount not capped in indenture; bank 5.00x secured test governs pari debt | Bank tests | [Insufficient Information] — covenant ratios not disclosed | Existing first-lien principal USD 19,702 million | Not Calculable: covenant inputs missing | Not Calculable: covenant inputs missing | Formula Extracted Only | High | Pari dilution for notes | Negative — Leverage Increase | E12; L09 |
| Unrestricted subsidiary capacity | Designation as deemed RP | Reclassification Feature: fair market value counted as RP | RP permitted at the time | [Insufficient Information] — covenant ratio not disclosed | No designation identified | Not Calculable: equals RP capacity | Not Calculable: inputs missing | Formula Extracted Only | High | Assets leave guarantor and collateral group | Negative — Covenant Erosion | E13; E15 |
| Guarantor / collateral release capacity | Release follows bank; release on designation | Not a quantified basket | Bank agent release other than full cash discharge | Not applicable: release mechanic | No release identified | Not Calculable: not a dollar basket | Not Calculable: not a dollar basket | Formula Extracted Only | High | Note collateral shrinks without vote | Negative — Covenant Erosion | E15 |
| MFN protection | Incremental yield protection | 50 bp threshold | Lapses after 18 months, for later maturities and acquisition debt | Tranche L sunset date not established | Not applicable: protection | Not applicable: protection | Not applicable: protection | Ready with Limitations | Moderate | Repricing exposure after sunset | Negative — Refinancing Risk | E03 |

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental or ratio debt | Secured net leverage at or below 5.00x | Not Calculable; proxy 4.22x after dividend | Dilution of shared first-lien pool | Higher interest burden | Lower first-lien recovery | Term loans and secured notes equally diluted | E03; E04; L05 |
| Junior or unsecured ratio debt | Net leverage at or below 7.25x | Not Calculable; proxy 5.50x after dividend | Adds claims ahead of equity, behind first lien | Higher leverage | Subordinated recovery diluted | Subordinated notes most affected | E04 |
| Foreign subsidiary debt | Greater of USD 450 million and a share of EBITDA | Fixed floor only | Structurally senior to guarantor claims | Modest | Lower recovery on non-guarantor value | All guarantor-level claims | E04; E11 |
| Non-guarantor ratio debt (notes) | Capped at USD 400 million | Not Calculable: usage unknown | Structurally senior claim | Modest | Bounded dilution | All guarantor-level claims | E13 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividend | Year-end net debt USD 18,619 million; pro forma USD 22,967 million and 6.02x reported EBITDA after the October 2024 payment of USD 4,348 million | Unlimited at 6.75x net leverage | Remaining not calculable; proxy 5.50x | Cash leaves the restricted group | Critical | Negative — Leverage Increase | E05; E21; E22; L04 |
| Unrestricted designation | Deemed RP at fair market value | Uses RP capacity | No designation identified; remaining not calculable | Guarantee and lien release on designation | High | Negative — Covenant Erosion | E13; E15 |
| Investments in JVs and non-guarantors | Greater of USD 1,000 million and 40.0% at 7.00x; general basket | Grower and ratio baskets | Not calculable: no tracker | Value outside collateral | High | Negative — Covenant Erosion | E06 |
| Asset sales | Release of sold collateral | Asset-sale covenant | Not calculable | Collateral reduction with reinvestment rights | Moderate | Neutral — Stable | E15 |
| Dividend equivalents and management payments | Annual cap tied to EBITDA | Fixed and grower | Not calculable | Small cash leakage | Low | Neutral — Stable | E05 |

### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings (bank) | Credit agreement Consolidated EBITDA | 25% of Consolidated EBITDA | Not Calculable: no add-back schedule | Raises EBITDA in all ratio tests | Releveraging capacity; higher LGD | E08 |
| Projected cost savings (notes) | 2033 indenture Consolidated EBITDA (M) | 35% of Consolidated EBITDA; actions within 24 months | Not Calculable: no add-back schedule | Loosens note coverage test | Debt and RP capacity under notes | E10 |
| Compensation and dividend equivalents | Credit agreement exclusions; indenture (K) | Uncapped | Not Calculable: covenant figures absent | Removes recurring costs from EBITDA | Recurring EBITDA USD 3,813 million versus USD 4,173 million EBITDA As Defined | E07; E10; E24 |
| Pro forma acquisition adjustments | 2033 indenture fixed-charge cover | Officer good-faith determination | Not Calculable | Acquired earnings and expected savings counted | Acquisition-funded debt capacity | E10 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio RP used for debt-funded dividend | September recap funded with new secured debt | Repeat extraction | Critical | High | Affects recovery and committee conclusions | E05; E22 |
| Release-follows-bank | Notes lien released with bank lien | Note collateral loss | High | High | Affects structural-priority and recovery conclusions | E15 |
| Uncapped indenture lien permission for credit facilities | Bank Indebtedness liens permitted | Pari dilution | High | High | Affects recovery conclusions | E12 |
| Reclassification and fungibility | Indenture lets debt and RP be split and reclassified across baskets | Capacity re-use | Moderate | High | Affects capacity conclusions | E11; E13 |
| Add-back inflation | Cost savings caps 25% and 35% | Ratio capacity overstated | High | High | Affects leverage and capacity conclusions | E08; E10 |

### T4C.11 Capacity risk prioritisation

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Ratio RP with pari secured funding | Critical | High | Debt-funded distributions | Higher | Higher LGD | Track dividends and secured issuance | E03; E05 |
| 2 | Pari secured capacity to 5.00x | High | Moderate | Dilution | Moderate | Higher first-lien LGD | Track secured net leverage | E04 |
| 3 | Release-follows-bank | High | Moderate | Collateral loss for notes | Neutral | Higher secured-note LGD | Monitor bank amendments | E15 |
| 4 | Add-back inflation | High | High | Ratio inflation | Delayed constraint | Higher LGD | Compare covenant and recurring EBITDA | E08; E10 |
| 5 | Springing covenant | Moderate | High | Late default trigger | Higher severity at default | Lower recovery | Track revolver usage | E01 |

### T4C.12 Capacity gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Covenant ratios | Covenant net leverage, secured net leverage, fixed-charge cover | Exact headroom | All leverage rows Not Calculable | Compliance certificate |
| Basket usage | Usage tracker for general, investment and RP baskets | Remaining capacity | Remaining capacity Not Calculable | Basket tracker |
| Unrestricted cash | Covenant Unrestricted Cash amount | Net ratios | Proxies use all reported cash | Covenant calculation |
| Add-back schedule | Cost-savings and other add-backs used | Covenant EBITDA | Inflation not sized | Add-back bridge |
| MFN date | Amendment No. 17 effective date | Sunset date | Event not dated | Effective-date notice |

### T4D.1 Structural source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Annual report guarantor information and obligor-group summary | Filed | Issuer filing | Summary only; Exhibit 22.1 guarantor list not supplied | Completed with Limitations |
| 2033 indenture guarantor, collateral and release provisions | Executed | 1 | Security documents not supplied | Completed with Limitations |
| Credit agreement guarantee and collateral references | Executed | 1 | Guarantee and collateral agreement not supplied | Completed with Limitations |
| Org chart and subsidiary list | Not in source set | Not applicable: absent | Entity perimeter incomplete | Completed with Limitations |

No post-balance-sheet guarantee release, designation or entity transfer was identified in the pages read; the October 2024 dividend and securitization draw are financial events, not perimeter changes.

### T4D.2 Entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware | Listed public company | Holdings; not a restricted subsidiary | No significant assets other than TransDigm Inc. | Yes | E18; E22 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Restricted; issuer | Part of obligor group with sales USD 6,294 million | Yes | E18 |
| TransDigm UK | Guarantor of 2028 secured and subordinated notes | Not established | Not established | Restricted | Not disclosed separately | Yes | E18 |
| Domestic restricted subsidiaries | Guarantors | United States | TransDigm Inc. | Restricted; designatable if RP permitted | Included in obligor group | Yes | E18; E13 |
| Foreign non-guarantor restricted subsidiaries | Non-guarantors | Various, not established | TransDigm Inc. group | Restricted; designatable | Share of roughly USD 1,646 million non-obligor sales | No | E18; L07 |
| Securitization entity | Receivables financing vehicle | Not established | Not established | Securitization Entity | Domestic receivables backing USD 487.5 million draw | No | E20 |
| Unrestricted subsidiaries | None identified | Not applicable: none identified | Not applicable | Unrestricted | None identified | No | E13 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TD Group × credit facilities | Senior secured | Upstream from parent of borrower | Release per credit agreement; material guarantor release needs each lender | E09; E18 |
| TD Group × secured notes | Senior secured | Parent guarantee | Indenture release terms | E18 |
| TD Group × subordinated notes | Senior subordinated | Parent guarantee | Indenture release terms | E18 |
| Domestic restricted subsidiaries × secured notes | Senior secured | Downstream to issuer obligations | Designation unrestricted; ceasing to guarantee bank debt or USD 200 million capital-markets debt (2029–2033 notes); immaterial subsidiary | E15; E18 |
| Domestic restricted subsidiaries × subordinated notes | Senior subordinated | Downstream | Indenture release terms not read | E18 |
| TransDigm UK × 2028 secured and subordinated notes | Senior secured; senior subordinated | Cross-stream | Not established | E18 |
| Foreign non-guarantor subsidiaries × all tranches | None | Not applicable | Not applicable | E18 |

### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TD Group × first lien | [Insufficient Information] — security documents not in the source set | Release follows bank; full cash discharge | Not established | E15 |
| TD Group × junior lien | — no junior lien identified | Not applicable | Not applicable | E12 |
| TransDigm Inc. × first lien | [Insufficient Information] — security documents not in the source set | Release follows bank; permitted asset sales | Post-closing perfection within 90 days for 2033 notes | E15 |
| TransDigm Inc. × junior lien | — no junior lien identified | Not applicable | Not applicable | E12 |
| TransDigm UK × first lien | [Insufficient Information] — security documents not in the source set | Release follows bank | UK collateral agent role referenced; perfection not established | E15 |
| TransDigm UK × junior lien | — no junior lien identified | Not applicable | Not applicable | E12 |
| Domestic restricted subsidiaries × first lien | [Insufficient Information] — security documents not in the source set | Released with guarantee; designation; bank release | Not established | E15 |
| Domestic restricted subsidiaries × junior lien | — no junior lien identified | Not applicable | Not applicable | E12 |
| Foreign non-guarantor subsidiaries × first lien | — not grantors | Not applicable | Liens only for their own debt | E12 |
| Foreign non-guarantor subsidiaries × junior lien | — not grantors | Not applicable | Not applicable | E12 |
| Securitization entity × first lien | Receivables transferred to securitization | Not applicable | Securitization liens permitted | E12 |
| Securitization entity × junior lien | — not a grantor | Not applicable | Not applicable | E12 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with guarantors | Collateral of grantors plus unsecured guarantor value | Pari (same entity, same lien) | Non-guarantor subsidiaries, roughly 20.73% of sales | First-lien access shared with notes; bank controls release | Medium | E15; E18 |
| 2029–2033 secured notes | TransDigm Inc. with guarantors | Same collateral | Pari (same entity, same lien) | Same non-guarantor value; collateral released by bank decision | Same rank as bank, weaker release control | Medium | E15; E18 |
| 2028 secured notes | TransDigm Inc. with TD Group, TransDigm UK, domestic restricted subsidiaries | Same collateral | Pari (same entity, same lien) | Non-guarantor value | Guarantor test differs from later notes; indenture not supplied | Low | E18 |
| Subordinated notes | TransDigm Inc. with subordinated guarantees | Residual after senior debt | Contractually Subordinated | Non-guarantor value and all senior-secured collateral | Recovery only after senior paid in cash | High | E16; E18 |
| Securitization funding | Securitization entity | Transferred receivables | Structurally Senior | Receivables outside the guarantor collateral | Paid from receivables ahead of guarantor creditors | Medium | E12; E20 |
| Non-guarantor creditors | Foreign subsidiaries | Non-guarantor assets | Structurally Senior | Not applicable | Paid ahead of all guarantor-level claims | Medium | E18 |

### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Dividend out of the group | TransDigm Inc. to Holdings to shareholders | Ratio RP at 6.75x | USD 4,348 million in October 2024 | 4 | Lower cash and value for all creditors | Demonstrated | E05; E22 |
| Designation unrestricted | Guarantor to unrestricted subsidiary | Deemed RP; release on designation | Not established | 4 | Guarantee and lien released | Theoretical | E13; E15 |
| Investment in non-guarantors or JVs | Guarantor to non-guarantor | Investment baskets and 5.75x ratio | Not established | 3 | Value structurally behind non-guarantor creditors | Theoretical | E06 |
| Asset sale out of the group | Grantor to third party | Asset-sale covenant; collateral release | Not established | 3 | Collateral replaced by proceeds subject to reinvestment | Theoretical | E15 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Release-follows-bank for notes collateral | 2033 indenture release clause | Secured noteholders | Theoretical | Bank lenders can reduce note collateral | High | E15 |
| Lien subordination by Required Lenders | Credit agreement amendment clause; no each-lender subordination right identified in pages reviewed | Term lenders | Theoretical | Uptier risk not excluded | Low | E09 |
| Non-pro rata offers | Required Lenders may allow offers made to all lenders of a class | Term lenders | Theoretical | Offers must be open to the whole class | Medium | E09 |
| Note ranking change | Each affected holder must consent | Secured noteholders | Theoretical | Protected against non-consensual subordination | High | E14 |
| Trapdoor to unrestricted subsidiary | Designation via RP capacity | All guarantor-level classes | Theoretical | Value could support new structurally senior debt | Medium | E13 |

### T4D.8 Structural gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Exhibit 22.1 and subsidiary list | Entity perimeter | Entity rows aggregated | Obtain exhibit list |
| Security documents | Guarantee and collateral agreement | Excluded assets and perfection | Collateral matrix uses Insufficient Information | Obtain security documents |
| Entity value | Non-guarantor assets and debt by entity | Stranded value sizing | Sales-share proxy only | Obtain entity financials |
| Intercreditor agreement | First Lien Intercreditor Agreement | Release and enforcement priority | Priming exposure provisional | Obtain agreement |

### T4F.1 Controlling intercreditor documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders No. 1 to 6 | TransDigm Inc., Holdings, subsidiary guarantors, Credit Agreement Collateral Agent, secured notes trustees and collateral agents | 2019-02-13; latest joinder 2024-09-19 | [Insufficient Information] — ICA not in the source set | Executed per indenture definition; text not supplied | d887611dex41.htm.jsonl, page 30 | E15 |
| 2033 secured notes indenture | TransDigm Inc., guarantors, trustee, notes collateral agents | 2024-09-19 | New York | Executed | d887611dex41.htm.jsonl, page 126 | E23 |
| 2027 subordinated notes indenture | TransDigm Inc., guarantors, trustee | 2019-11-13 | New York | Executed | d826058dex41.htm.jsonl, page 124 | E23 |
| Credit agreement | TransDigm Inc., Holdings, subsidiaries, lenders, agent | 2024-09-19 annex | New York | Executed | d887611dex101.htm.jsonl, page 222 | E23 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Credit facility lenders | Senior; equal payment rank | First-priority lien on Collateral | [Insufficient Information] — ICA not in the source set | Required Lenders under credit agreement | E09; E15 |
| Secured noteholders | Senior; equal payment rank | First-priority lien on Collateral | [Insufficient Information] — ICA not in the source set | Majority per series; 66⅔% for collateral release | E14; E15 |
| Subordinated noteholders | Subordinated to Senior Debt | None | Subject to payment blockage and turnover | Majority per series | E16 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Payment blockage | Up to 179 days; one per 360 days; at least 181 days unblocked | Blockage notice from designated senior debt representative on a non-payment default | Designated senior debt representative | Subordinated noteholders | Junior payments stop while seniors decide | Negative — Liquidity Deterioration | E16 |
| Payment default stop | Until cured, waived or senior paid in cash | Designated senior debt payment default or acceleration | Senior creditors | Subordinated noteholders | No junior payments during senior payment default | Negative — Liquidity Deterioration | E16 |
| First-lien enforcement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Credit facility lenders and secured noteholders | Control between pari classes unknown | Insufficient Information | E15 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordination turnover | Junior receipts paid to seniors until paid in full in cash | Not applicable | [Insufficient Information] — no purchase option identified in pages read | Except subordinated securities | Juniors may receive equally subordinated securities | E16 |
| Notes collateral release | None | Credit agreement collateral agent release triggers notes release | [Insufficient Information] — ICA not in the source set | Not on full cash discharge of bank debt | Releasing substantially all collateral otherwise needs 66⅔% of noteholders | E14; E15 |
| Bank collateral release | None | Each lender for all or substantially all collateral | [Insufficient Information] — ICA not in the source set | Except as permitted by collateral documents | Each-lender consent protects substantial releases | E09 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Credit facility lenders | Shared first-lien pool | Pari dilution to 5.00x | Moderate | New pari debt shares collateral | Negative — Leverage Increase | E03; E04 |
| Secured noteholders | Shared pool with bank-controlled releases | Release-follows-bank; ICA unknown | High | Collateral can shrink without noteholder vote | Negative — Covenant Erosion | E15 |
| Subordinated noteholders | Residual after senior debt; turnover | Blockage and turnover | High | Value passes to seniors first | Negative — Liquidity Deterioration | E16 |

### T4F.6 Intercreditor gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| ICA text | First Lien Intercreditor Agreement and joinders | Enforcement control and standstill among pari classes | Enforcement rows Insufficient Information | Obtain executed agreement |
| Purchase options | Junior purchase rights | Recovery options for juniors | Not assessed | Review subordinated indentures and any ICA |
| Release limits | Limits on bank-led releases | Secured-note collateral protection | Release risk rated theoretical | Review ICA release clauses |

### Register verification

| Register group | Present | Columns complete | Minimum rows | Figures traced | Result |
|---|---|---|---|---|---|
| Legal registers | Yes | Yes | Yes | Yes | PASS |
| Capacity registers | Yes | Yes | Yes | Yes; covenant inputs null with gap rows | PASS |
| Structural registers | Yes | Yes | Yes | Yes; undisclosed values shown as gaps | PASS |
| Intercreditor registers | Yes | Yes | Yes | ICA-dependent cells marked missing | PASS |

### Material claim lineage

| Claim | Material conclusion | Strongest lineage |
|---|---|---|
| M1 | Only a springing revolver maintenance test exists | Directly Sourced |
| M2 | Bank RP unlimited at 6.75x net leverage | Directly Sourced |
| M3 | Note RP unlimited above 2.00x cover | Directly Sourced |
| M4 | Pari secured debt allowed to 5.00x; indenture permits all credit-facility liens | Directly Sourced |
| M5 | Notes lien released when bank lien released | Directly Sourced |
| M6 | Amendment thresholds and sacred rights | Directly Sourced |
| M7 | Payment blockage and turnover for subordinated notes | Directly Sourced |
| M8 | Revolver usage 7.36% against 40% trigger | Calculated |
| M9 | Post-dividend proxies 5.50x and 4.22x | Calculated |
| M10 | Non-guarantor sales roughly 20.73% | Calculated |
| M11 | Package scored Aggressive; dilution is the main recovery route | Analyst Inference |
| M12 | No each-lender lien subordination right identified | Analyst Inference |
| M13 | Enforcement control among pari classes | Insufficient Information |
| M14 | Covenant-defined headroom and basket usage | Insufficient Information |

Field counts cover the thirty-one required registers plus the source gate. Material findings: missing intercreditor agreement, missing compliance and basket data, and missing other note indentures; minor findings: missing market comparator and unread lien-subordination provisions.

## Calculations

All amounts are consolidated USD millions at 2024-09-30 unless stated; ratios labelled proxy use issuer EBITDA As Defined and carrying debt and are not covenant calculations.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | 2024-09-30 revolver usage | 67 letters of credit / 910 revolving commitments | 0.073626373626373626373626373626373626374; 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L02 | 2024-09-30 usage trigger | 0.40 × 910; then 364 − 67 | 364; 297 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| L03 | 2024-09-30 trigger headroom | 40.00 − 7.36 | 32.64 | Percentage points of commitments | calculation L01 |
| L04 | Pro forma October 2024 net leverage proxy | 22967 pro forma net debt / 4173 EBITDA As Defined | 5.5037143541816439012700694943685597891; 5.50x | x | Financial foundation (CP-1) |
| L05 | Pro forma October 2024 secured net leverage proxy | 19534 secured carrying debt − 1913 pro forma cash = 17621; 17621 / 4173 | 17621; 4.2226216151449796309609393721543254254; 4.22x | USD million; x | Financial foundation (CP-1) |
| L06 | 2024-09-30 secured net leverage proxy | 19534 − 6261 = 13273; 13273 / 4173 | 13273; 3.1806853582554517133956386292834890966; 3.18x | USD million; x | Financial foundation (CP-1) |
| L07 | FY2024 non-obligor sales approximation | 7940 consolidated sales − 6294 obligor-group sales = 1646; 1646 / 7940 | 1646; 0.20730478589420654911838790931989924433; 20.73% | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L08 | FY2024 fixed-charge cover proxy | 4173 EBITDA As Defined / 1246 net interest excluding debt-cost amortization | 3.3491171749598715890850722311396468700; 3.35x | x | Financial foundation (CP-1) |
| L09 | 2024-09-30 first-lien principal | 8702 + 2100 + 2750 + 1450 + 1000 + 2200 + 1500 | 19702 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L10 | 2024-09-30 subordinated principal | 2650 + 1200 + 750 | 4600 | USD million | Financial foundation (CP-1) |

The non-obligor share is approximate because obligor-group sales exclude intercompany sales to non-guarantors and the obligor summary is not a legal perimeter. The fixed-charge proxy uses full-year interest before the September 2024 borrowing and so overstates cover after the recapitalisation.

## Gaps

The gaps below restrict sizing and control conclusions, not the reading of the provisions themselves.

| Gap | Severity | Missing or unresolved | Effect on conclusion | Required follow-up |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement and its joinders | Enforcement control, standstill and release limits between bank lenders and secured noteholders not established | Obtain the executed agreement |
| Compliance and usage | MATERIAL | Covenant-defined ratios, unrestricted cash, add-back bridge, basket trackers | Headroom and remaining capacity not calculable; proxies only | Obtain the latest compliance certificate and basket tracker |
| Other indentures | MATERIAL | 2028 to 2032 secured-note and 2029 subordinated-note indentures | Tranche-specific guarantor tests and covenants assumed from the issuer summary | Obtain each indenture |
| Market comparator | MINOR | Covenant-review or market-norm source | No market-norm statement made | Obtain a third-party covenant review |
| Lien subordination consent | MINOR | Full read of credit agreement for lien or payment subordination protections | Uptier vulnerability rated theoretical | Complete provision review |
| MFN sunset date | MINOR | Effective date of the September 2024 amendment | Pricing protection for Tranche L lapses 18 months after that effective date, which is not established, so no dated event is recorded | Obtain the effective-date notice |
| Springing test step-up | MINOR | Whether any acquisition qualifies as a material acquisition | The 7.50x limit rises to 8.00x for four quarters after a material acquisition; the trigger date is not established | Obtain acquisition classification under the credit agreement |

## Next module
The orchestrator selects the next module.
