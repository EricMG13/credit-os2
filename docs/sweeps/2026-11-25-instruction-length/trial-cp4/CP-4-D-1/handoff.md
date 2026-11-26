## Request
TransDigm Group Incorporated, as of 2024-09-30, under the deep_credit_assessment pathway. Scope: interpret the executed credit agreement and the supplied indentures for covenant architecture, debt, lien and distribution capacity, leakage, guarantees and collateral, structural priority, intercreditor control, defaults and amendment risk, with PD and LGD consequences for creditors.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and Incremental Term Loan Assumption Agreement to the Second Amended and Restated Credit Agreement, with the amended credit agreement text annexed | 2024-09-19 (dated as of) | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: springing covenant, restricted payments, permitted debt and investments, unrestricted subsidiaries, incremental and MFN terms, liens, collateral, events of default, amendments and releases |
| d887611dex41.htm.jsonl | Indenture for the 6.000% Senior Secured Notes due 2033 | 2024-09-19 (dated as of) | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note restricted payments, amendment thresholds, intercreditor reference, governing law, call date |
| d826058dex41.htm.jsonl | Indenture for the 5.500% Senior Subordinated Notes due 2027 | 2019-11-13 (dated as of) | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Contractual subordination, payment blockage and turnover framework |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Guarantor information and combined guarantor summary, facility table, covenant summary and year-end compliance statement; retrospective evidence |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted source set, retrospective boundary and legal-coverage gap |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt by instrument, net debt, EBITDA identities, October 2024 dividend pro forma, consolidated assets and goodwill |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Documented distribution behaviour and recapitalisation context for willingness, not capacity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurring nature of issuer add-backs, used only to frame covenant-EBITDA inflation risk |

## Findings

### Bottom line
Weak covenant protection defines this credit: TransDigm's documents are cov-lite and size dividends and secured borrowing by leverage tests rather than fixed amounts, so they permit further debt-funded distributions while covenant net leverage stays within 6.75x to 7.25x.
Basis: d887611dex101.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, page 181; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

The only maintenance test protects revolving lenders alone: a 7.50x net leverage ceiling that applies only when revolver usage exceeds 40% of commitments, USD 364 million; year-end usage was letters of credit of USD 67 million, 7.36%. Default risk therefore surfaces late, at a payment or maturity, rather than through an early covenant trigger. Recovery risk is the larger legal exposure: required lenders can amend the credit agreement without an express each-lender protection against lien subordination in the reviewed text, a majority of 2033 noteholders can amend the security documents and intercreditor agreement, and non-guarantor subsidiaries account for about 20.73% of sales.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, page 116; calculation L02; calculation L07

### Key findings
- Maintenance protection is effectively absent for term lenders and bondholders. The financial covenant is drafted for revolving lenders, swingline lender and issuing bank only, caps covenant net leverage at 7.50x (8.00x for four quarters after a material acquisition), tests only above 40% revolver usage, and can be amended by required revolving lenders alone. With USD 297 million of further revolver drawing possible before the test springs, there is no early-warning tripwire for term or note creditors; the first hard default is a missed payment or cross-default.
Basis: d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; calculation L06; calculation L08
- Distribution capacity is governed by ratios, not size caps, and has been used. The credit agreement permits any restricted payment with no default and pro forma covenant net leverage at or below 6.75x; the 2033 notes permit any restricted payment while their fixed charge coverage exceeds 2.0x. The September 2024 incremental term loan of USD 1,500 million was expressly applied, with the 2033 notes and cash, to a special dividend. Year-end carrying net debt was USD 18,619 million and 4.88x reported EBITDA; after the October 2024 dividend it is USD 22,967 million and 6.02x. A non-covenant reference of 5.50x on issuer-adjusted EBITDA suggests only about 1.25x of room before the 6.75x test, but tested covenant ratios are not disclosed, so actual headroom is not established.
Basis: d887611dex101.htm.jsonl, pages 2–4; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, pages 75–76; Financial foundation (CP-1); calculation L10; calculation L11
- Secured-debt capacity can dilute existing first-lien creditors. Equal-lien secured debt is permitted up to 5.00x covenant secured net leverage and junior or unsecured debt up to 7.25x; the agent must enter pari or junior intercreditor arrangements on request without lender consent. The 50 bp MFN on incremental term loans falls away 18 months after each tranche's effective date and never applies to acquisition-related debt, so yield protection is temporary.
Basis: d887611dex101.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 143–145; d887611dex101.htm.jsonl, page 205
- Amendment mechanics leave an uptier path open. Each-lender consent protects payment terms, pro rata sharing, voting thresholds and release of all or substantially all collateral or material guarantors, but the reviewed text contains no express each-lender protection against subordinating the lenders' liens, and required lenders may permit non-pro-rata prepayment through offers made to all lenders of a class. A majority of 2033 noteholders, including exit consents given in an exchange offer, can amend the indenture, security documents and intercreditor agreement; only changes adversely affecting ranking need each holder.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 116–117
- Structural leakage to unrestricted subsidiaries is bounded, but value outside the guarantor group is material. Only newly acquired or newly formed subsidiaries can be designated unrestricted, and investments in them are capped at the greater of USD 250 million and 10% of covenant EBITDA. Investments in restricted subsidiaries, including non-guarantors, are not capped. Non-guarantors account for about USD 1,646 million of sales and USD 2,233 million of goodwill, and foreign subsidiaries may borrow the greater of USD 450 million and 18% of covenant EBITDA ahead of the group's creditors.
Basis: d887611dex101.htm.jsonl, pages 60–61; d887611dex101.htm.jsonl, page 81; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; calculation L01; calculation L03
- Subordinated noteholders are contractually junior with a bounded standstill. Senior creditors can block payments on the 2027 subordinated notes for up to 179 days in any 360 days, and in insolvency must be paid in full in cash first. That makes the subordinated notes the most exposed tranche, while the secured package itself, not its terms, drives first-lien recovery.
Basis: d826058dex41.htm.jsonl, pages 106–107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58

### Contrary evidence and what would change the view
The strongest counter-evidence is that the documents still discipline the borrower at the point of action. Every ratio basket requires no default and is tested pro forma including the financing. The September 2024 incremental loan could close only with a certified covenant net leverage at or below 7.25x and secured net leverage at or below 5.00x after the dividend. The issuer stated full covenant compliance at year-end. Unrestricted-subsidiary designation is confined to new subsidiaries, holdings must stay a passive holding company, domestic immaterial subsidiaries above 7.5% of assets or covenant EBITDA must join as guarantors, and pro rata sharing is an each-lender right. If tested covenant ratios turned out well below the 6.75x and 5.00x gates, the creditor-adverse capacity would remain theoretical in the near term rather than an active pressure point. The view would soften if a compliance certificate showed large distance to those gates, if the intercreditor agreement gave noteholders independent enforcement and anti-subordination protections, or if lenders added an express each-lender lien-subordination protection. It would worsen if the borrower used reclassification or add-backs to restore ratio capacity ahead of another special dividend.
Basis: d887611dex101.htm.jsonl, pages 3–4; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 176 and 187; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Limitations
- The First Lien Intercreditor Agreement is referenced but not supplied, so who controls enforcement between lenders and secured noteholders, any standstill between them, and turnover or release mechanics are not established; the intercreditor conclusions are provisional, and the uptier finding rests on the credit agreement and 2033 indenture alone.
Basis: d887611dex41.htm.jsonl, page 30
- No compliance certificate or tested covenant ratio is supplied, so headroom under the 6.75x distribution test, the 5.00x secured debt test and the 7.50x springing test cannot be calculated; the nearest-pressure-point judgement is directional and the 5.50x reference figure is not covenant leverage.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation L10
- The guarantee and collateral agreement, perfection schedules and the indentures for the 2028 to 2032 secured notes and the two 2029 subordinated notes are not in the source set, so the collateral map is partial and the conclusion that all secured notes share the 2033 terms is inferred from the annual report's description, not read.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58 and 61; Source readiness (CP-0)
- The non-guarantor share of sales is derived from the issuer's combined guarantor summary and may include intercompany effects; it sizes structural subordination only approximately and does not establish non-guarantor asset or debt value.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation L01
- The credit-agreement text is an annexed marked extract whose stricken and inserted wording may merge in plain text; reviewed provisions read coherently, but any figure in a marked clause could reflect superseded wording, which would change the specific baskets cited, not the cov-lite architecture.
Basis: d887611dex101.htm.jsonl, page 3

### Covenant-implication summary
The provisions that move creditor outcomes are ratio-based permissions and amendment thresholds rather than any maintenance test; each row below is drawn from the appendix registers.

| Provision | What it permits | Creditor mechanism | PD or LGD channel | Monitoring trigger |
|---|---|---|---|---|
| Springing revolver covenant | 7.50x ceiling only above 40% revolver usage | No early-warning test for term loans or notes | PD: late default recognition | Revolver usage approaching USD 364 million |
| Ratio restricted payments | Unlimited distributions at or below 6.75x; notes above 2.0x coverage | Cash and debt capacity can be paid to equity | PD and LGD: releveraging and cash leakage | New special dividend or incremental debt with dividend use |
| Equal-lien ratio debt | Pari secured debt to 5.00x secured net leverage | Dilutes first-lien collateral coverage | LGD: recovery dilution | Secured issuance, MFN sunset dates |
| Amendment thresholds | Required lenders and majority noteholders control most terms | Lien subordination and exchange consents not each-holder protected | LGD: priming exposure | Amendment or exchange-offer filings |
| Non-guarantor value and foreign debt | Uncapped investment in restricted non-guarantors; foreign debt basket | Structurally senior claims on 20.73% of sales | LGD: structural subordination | Foreign borrowing, intercompany transfers |
| Subordination | 179-day payment blockage for senior creditors | Subordinated notes stand still and turn over | LGD: subordinated recovery | Senior default notices |

### Nearest pressure point
The nearest pressure point is the credit agreement's ratio restricted-payment permission at 6.75x covenant net leverage, mirrored by the 2033 notes' 2.0x coverage permission. The evidence is the drafting itself together with use: the September 2024 incremental loan and new secured notes funded a special dividend paid in October 2024. Borrower action, not deterioration, uses this capacity: each time earnings growth or add-backs lower the covenant ratio, the documents allow the gain to be distributed or borrowed against rather than retained. The creditor consequence is a ceiling on deleveraging and repeated refinancing dependence, raising PD through leverage that stays near the permitted gate and raising LGD through cash leaving the collateral pool. The monitoring signal is any board dividend declaration or incremental borrowing whose stated use includes distributions. A compliance certificate showing tested covenant net leverage and covenant EBITDA is needed to turn this into a measured headroom figure.
Basis: d887611dex101.htm.jsonl, pages 2 and 181; d887611dex41.htm.jsonl, page 75; Business & governance (CP-1A); Financial foundation (CP-1)

### Downside transmission
The initiating condition is a further debt-funded distribution taken at the ratio gates, followed by an aerospace slowdown. The first break is lower covenant EBITDA, which pushes ratios above the incurrence gates and closes debt and distribution baskets, while the term loans and notes carry no maintenance test that would let lenders reprice or restrict the borrower early. Liquidity transmission runs through the revolver: if drawn beyond USD 364 million, the 7.50x test springs for revolving lenders only, and breach would let them stop lending when liquidity is most needed. Refinancing consequence follows at the 2028 and 2029 maturity cluster, where required-lender and majority-noteholder thresholds would allow a coordinated group to offer new priming or exchange debt that non-participants cannot block. Observable triggers are revolver usage, new pari or junior intercreditor joinders, amendments touching collateral or ranking, and exchange offers soliciting consents.
Basis: d887611dex101.htm.jsonl, pages 188–189; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, page 116; Financial foundation (CP-1)

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package, scored 4 of 5 on a provisional basis, because distributions, equal-lien debt and investments are governed by leverage gates rather than fixed caps, the only maintenance test is a revolver-only springing covenant, and covenant EBITDA admits uncapped restructuring and transaction add-backs plus projected cost savings up to 25% of EBITDA. The main creditor protections are the first-lien collateral shared on equal payment rank by lenders and secured noteholders, each-lender pro rata sharing and collateral-release rights, the restriction of unrestricted-subsidiary designation to new subsidiaries, and contractual subordination of the subordinated notes. The primary PD risk is policy-driven releveraging at the 6.75x gate with no early covenant warning; the primary LGD risk is dilution or priming of first-lien collateral through equal-lien debt and majority-controlled amendments, compounded by non-guarantor value. For security selection, the most important legal consideration is that secured notes rely on majority-amendable security documents and an unreviewed intercreditor agreement. Further analysis requires the intercreditor agreement, the guarantee and collateral agreement, the remaining indentures and compliance certificates. The legal review is completed with limitations; covenant aggressiveness is 4 of 5, provisional.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, pages 58–63; d887611dex101.htm.jsonl, pages 181 and 188; d887611dex41.htm.jsonl, pages 30 and 116

### Capital structure

| Instrument | Obligor and guarantors | Payment rank and lien | Carrying value (USD millions) | Governing document reviewed | Source |
|---|---|---|---|---|---|
| Revolving credit facility, commitment 910; letters of credit 67; available 843 | TransDigm Inc.; Holdings and subsidiary loan parties | Senior secured, first lien | Not supplied: undrawn at year-end | Credit agreement as amended by Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K and L (principal 8,702) | TransDigm Inc.; Holdings and subsidiary loan parties | Senior secured, first lien | 8642 | Credit agreement as amended by Amendment No. 17 | Financial foundation (CP-1) |
| 2028 secured notes | TransDigm Inc.; TD Group, TransDigm UK, domestic restricted subsidiaries | Senior secured, equal with credit facility | 2077 | Not in source set | Financial foundation (CP-1) |
| 2029 secured notes | TransDigm Inc.; same guarantors as 2028 notes at report date | Senior secured, equal with credit facility | 2727 | Not in source set | Financial foundation (CP-1) |
| 2030 secured notes | Same | Senior secured, equal with credit facility | 1438 | Not in source set | Financial foundation (CP-1) |
| 2031 secured notes | Same | Senior secured, equal with credit facility | 984 | Not in source set | Financial foundation (CP-1) |
| 2032 secured notes | Same | Senior secured, equal with credit facility | 2180 | Not in source set | Financial foundation (CP-1) |
| 2033 secured notes (principal 1,500) | Same | Senior secured, equal with credit facility; First Lien Intercreditor Agreement | 1486 | 2033 notes indenture | d887611dex41.htm.jsonl, page 30 |
| 2027 senior subordinated notes | TransDigm Inc.; TD Group, TransDigm UK, domestic restricted subsidiaries (subordinated) | Unsecured, subordinated to senior debt | 2641 | 2027 notes indenture | d826058dex41.htm.jsonl, page 106 |
| January 2029 senior subordinated notes | Same | Unsecured, subordinated | 1194 | Not in source set | Financial foundation (CP-1) |
| May 2029 senior subordinated notes | Same | Unsecured, subordinated | 746 | Not in source set | Financial foundation (CP-1) |
| Trade receivable securitization | Securitization entity; excluded subsidiary | Rank not established; non-recourse basket | 486 | Not in source set | Financial foundation (CP-1) |
| Finance leases and government advances | Various | Rank not established | 279 | Not applicable | Financial foundation (CP-1) |
| Total carrying debt; net debt 18,619 at year-end, 22,967 pro forma after the October 2024 dividend | Consolidated | Mixed | 24880 | Not applicable | Financial foundation (CP-1) |

### Covenant tests and headroom

| Test | Test type | Threshold | Current | Status | Source |
|---|---|---|---|---|---|
| Revolver usage gate for springing covenant | max-ratio | 40.00% | 7.36% | Compliant; test not sprung | d887611dex101.htm.jsonl, page 188 |
| Springing covenant net leverage (revolving lenders only) | max-ratio | 7.50x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 188 |
| Ratio restricted payments, credit agreement | max-ratio | 6.75x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 181 |
| Equal-lien secured debt and incremental loans | max-ratio | 5.00x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 59 |
| Junior-lien, unsecured, subordinated and incremental debt | max-ratio | 7.25x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, pages 59–60 |
| Ratio investments | max-ratio | 5.75x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 63 |
| Joint-venture investments | max-ratio | 7.00x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex101.htm.jsonl, page 62 |
| Ratio restricted payments, 2033 notes coverage | min-ratio | 2.00x | Not supplied: tested ratio not disclosed | Not Calculable | d887611dex41.htm.jsonl, page 75 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver usage gate for springing covenant | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Letters of credit of USD 67 million over commitments of USD 910 million; whether any letters are cash-collateralised and excluded is not stated; exceeding the gate springs the leverage test, it is not itself a default |
| Springing covenant net leverage | 7.50 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x, covenant net leverage | 8.00x for four quarters after a material acquisition; applies only when usage gate is exceeded; issuer states compliance at 2024-09-30 |
| Ratio restricted payments, credit agreement | 6.75 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x, covenant net leverage | Pro forma for the payment and its financing; no default required; non-covenant reference of 5.50x is not the tested ratio |
| Equal-lien secured debt and incremental loans | 5.00 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x, covenant secured net leverage | Certified at or below 5.00x on the September 2024 incremental closing; value not disclosed |
| Junior-lien, unsecured, subordinated and incremental debt | 7.25 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x, covenant net leverage | Certified at or below 7.25x on the September 2024 incremental closing; value not disclosed |
| Ratio investments | 5.75 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x, covenant net leverage | Also requires no revolving loans outstanding and at least USD 200 million unrestricted cash |
| Joint-venture investments | 7.00 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x, covenant net leverage | Basket capped at the greater of USD 1,000 million and 40% of covenant EBITDA |
| Ratio restricted payments, 2033 notes | 2.00 | Not supplied: tested ratio not disclosed | Not supplied: current tested ratio missing | Passes above | x, fixed charge coverage | Indenture requires coverage to exceed 2.0x; fixed charge definition not reviewed |

Only the revolver usage gate can be measured from disclosed figures; every leverage and coverage row lacks the borrower's tested ratio, so the chart shows thresholds, not headroom, for those tests.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2014-06-04 | day | 2024-09-19 | Second Amended and Restated Credit Agreement dated | Historical — dated as of June 4, 2014 | d887611dex101.htm.jsonl, page 1 | Base agreement for all current term loans and the revolver; amended many times since |
| 2019-02-13 | day | 2024-09-19 | First Lien Intercreditor Agreement dated | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs lien sharing and enforcement between lenders and secured noteholders; document not supplied |
| 2019-11-13 | day | 2019-11-13 | Indenture for 2027 senior subordinated notes dated | Historical — Dated as of November 13, 2019 | d826058dex41.htm.jsonl, page 1 | Establishes subordination and 179-day payment blockage |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 executed, latest amendment affecting restrictive covenants per issuer | Historical — executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Restrictive-covenant changes not separately reviewed |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17 and Tranche L incremental term loans of USD 1,500 million for a special dividend | Historical — dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Demonstrates use of incremental and distribution capacity; closing certified 7.25x and 5.00x gates |
| 2024-09-19 | day | 2024-09-19 | 2033 secured notes indenture executed | Historical — Dated as of September 19, 2024 | d887611dex41.htm.jsonl, page 1 | Adds secured debt sharing the first-lien package |
| 2024-09-19 | day | 2024-09-19 | Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Brings 2033 notes into the intercreditor arrangement |
| 2024-09-30 | day | 2024-11-07 | Issuer states compliance with all debt covenants | Historical — was in compliance with all of its debt covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Compliance statement without tested ratios |
| 2027-09-15 | day | 2024-09-19 | First optional redemption date of 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Ends non-call period, enabling refinancing of the 2033 notes |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Owns the borrower's equity and must remain a passive holding company | Ownership | TransDigm Inc. | Credit agreement section 6.12 as amended by Amendment No. 17, New York law; both Delaware corporations per Amendment No. 17 preamble |
| TransDigm Group Incorporated | Guarantees credit facility obligations as Holdings and reaffirms guarantee | Guarantee | Senior secured credit facility | Amendment No. 17 parties and credit agreement guarantee provisions, New York law |
| Domestic restricted subsidiaries | Must join as loan parties within 20 business days unless excluded | Guarantee | Senior secured credit facility | Credit agreement section 5.11(a), New York law |
| TransDigm Group Incorporated | Guarantees on a senior secured basis | Guarantee | Secured notes 2028–2033 | 2024 annual report guarantor information; 2033 notes indenture, New York law |
| TransDigm UK | Guarantees on a senior secured basis | Guarantee | Secured notes 2028–2033 | 2024 annual report: 2028 notes guaranteed by TransDigm UK, other series same guarantors at report date; indentures other than 2033 not supplied |
| Domestic restricted subsidiaries | Guarantee on a senior secured basis | Guarantee | Secured notes 2028–2033 | 2024 annual report guarantor information; 2033 notes indenture, New York law |
| TransDigm Group Incorporated | Guarantees on a senior subordinated unsecured basis | Guarantee | Senior subordinated notes | 2024 annual report guarantor information; 2027 notes indenture |
| TransDigm UK | Guarantees on a senior subordinated unsecured basis | Guarantee | Senior subordinated notes | 2024 annual report guarantor information |
| Domestic restricted subsidiaries | Guarantee on a senior subordinated unsecured basis | Guarantee | Senior subordinated notes | 2024 annual report guarantor information |
| Loan parties | Grant first-priority liens on collateral including cash | Security | Credit agreement collateral agent | Credit agreement sections 6.06 and 9.02(c); annual report states collateral includes available cash; New York law |
| Loan parties | Pledge 65% of voting and 100% of non-voting stock of first-tier foreign subsidiaries | Security | Foreign subsidiaries | Credit agreement section 5.11(b), New York law |
| Loan parties | Grant liens securing the notes through US and UK collateral agents | Security | 2033 notes collateral agents | 2033 notes indenture parties and security references, New York law |
| Non-guarantor subsidiaries | Their creditors are paid from their assets before secured notes | Structural claim | Secured notes 2028–2033 | 2024 annual report: secured notes structurally subordinated to non-guarantor liabilities |
| Non-guarantor subsidiaries | Their creditors are paid from their assets before subordinated notes | Structural claim | Senior subordinated notes | 2024 annual report: subordinated notes structurally subordinated to non-guarantor liabilities |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Secured notes 2028–2033 | Rank equally in right of payment | Payment rank | Senior secured credit facility | 2024 annual report guarantor information and debt description; 2033 notes indenture, New York law |
| Senior subordinated notes | Subordinated in right of payment to senior debt | Payment rank | Senior secured credit facility | 2027 notes indenture section 10.01; annual report description, New York law not verified for 2027 indenture |
| Senior subordinated notes | Subordinated in right of payment to senior debt | Payment rank | Secured notes 2028–2033 | 2024 annual report: secured notes senior to subordinated notes |
| Secured notes 2028–2033 | Share first-lien collateral under the First Lien Intercreditor Agreement; relative terms not reviewed | Security rank | Senior secured credit facility | 2033 notes indenture definition of Intercreditor Agreement dated 2019-02-13 and Joinder No. 6; agreement not supplied |
| Credit agreement collateral agent | Holds sole right, as among lenders, to proceed against collateral and credit bid | Enforcement control | Collateral | Credit agreement Article VIII agency provisions, New York law; control versus noteholders not established |
| Senior debt representative | May block subordinated note payments up to 179 days in any 360 days | Standstill | Senior subordinated notes | 2027 notes indenture section 10.03 |
| Required Lenders | May approve release of specific collateral; release of all or substantially all needs each lender | Release | Collateral | Credit agreement section 9.02(b) and (c), New York law |
| Majority of 2033 noteholders | May amend security documents and intercreditor agreement, including through exchange-offer consents | Release | 2033 notes collateral | 2033 notes indenture section 9.02, New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 13 |
| Calculated | 3 |
| Assumption-Based | 0 |
| Analyst Inference | 3 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 3 |
| Fields present | 32 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 4 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

Module status: completed with limitations. Executed credit-agreement and indenture texts are available; the intercreditor agreement, guarantee and collateral agreement, five secured-note indentures, two subordinated-note indentures and compliance certificates are not.

### Evidence register

| Evidence ID | Provision and content | Source |
|---|---|---|
| LE01 | Amendment No. 17: parties, Tranche L of USD 1,500 million, dividend use of proceeds, closing conditions at 7.25x and 5.00x | d887611dex101.htm.jsonl, pages 1–4 |
| LE02 | Section 6.14 springing covenant 7.50x (8.00x after material acquisition), 40% usage gate, required revolving lenders amend | d887611dex101.htm.jsonl, page 188 |
| LE03 | Section 6.02 restricted payments: management equity clause (4), general clause (7), expired clause (10), ratio permission at 6.75x | d887611dex101.htm.jsonl, pages 179–181 |
| LE04 | Sections 6.03 asset sales, 6.04 subsidiary payment restrictions, 6.06 liens, 6.07 mergers | d887611dex101.htm.jsonl, pages 181–184 |
| LE05 | Permitted Indebtedness clauses (6), (7), (11), (12), (13), (14), (17), (18) and reclassification and limited-condition acquisition rules | d887611dex101.htm.jsonl, pages 57–61 |
| LE06 | Permitted Investments clauses (1), (10), (11), (18), (20) | d887611dex101.htm.jsonl, pages 61–63 |
| LE07 | Unrestricted Subsidiary and Unrestricted Cash definitions | d887611dex101.htm.jsonl, page 81 |
| LE08 | Section 2.24(b) incremental terms, 50 bp MFN, 18-month sunset and acquisition carve-out, more-favourable-terms incorporation | d887611dex101.htm.jsonl, pages 143–145 |
| LE09 | Section 9.02 amendment thresholds, each-lender rights, intercreditor authorisation, non-pro-rata and loan-modification offers, lien releases, foreign documents | d887611dex101.htm.jsonl, pages 204–207 |
| LE10 | Agent sole right to proceed against collateral and credit bid | d887611dex101.htm.jsonl, page 197 |
| LE11 | Section 5.11 additional guarantors, excluded subsidiaries, 65% foreign pledge, Rule 3-10 and 3-16 carve-out, 7.5% immaterial-subsidiary caps | d887611dex101.htm.jsonl, pages 173–176 |
| LE12 | Consolidated EBITDA add-backs (d) to (m), cost savings within 24 months capped at 25.0% | d887611dex101.htm.jsonl, page 24 |
| LE13 | Section 6.11 subordinated-note amendment limits, 6.12 passive Holdings, 6.13 security impairment | d887611dex101.htm.jsonl, page 187 |
| LE14 | Events of default (a) to (e), including cross-default to Material Indebtedness with secured-debt carve-out | d887611dex101.htm.jsonl, pages 188–189 |
| LE15 | 2033 notes indenture parties, date, collateral agents, First Lien Intercreditor Agreement and joinders, Initial Redemption Date | d887611dex41.htm.jsonl, pages 1 and 30 |
| LE16 | 2033 notes restricted payments: builder from USD 400 million plus 50% of net income since 2010, coverage permission above 2.0x, reclassification | d887611dex41.htm.jsonl, pages 69–70 and 75–76 |
| LE17 | 2033 notes amendments by majority including security documents and intercreditor agreement; each-holder list | d887611dex41.htm.jsonl, pages 115–117 |
| LE18 | 2033 notes governed by New York law | d887611dex41.htm.jsonl, page 126 |
| LE19 | 2027 notes indenture date, subordination, payment blockage 179 days in 360 days | d826058dex41.htm.jsonl, pages 1 and 106–107 |
| LE20 | Guarantor information, combined guarantor summary, term loan and revolver table | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| LE21 | Issuer covenant summary, revolver-only maintenance covenant, USD 364 million gate, compliance at year-end, collateral includes cash | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| LE22 | Credit agreement and Amendment No. 17 governed by New York law | d887611dex101.htm.jsonl, pages 8 and 222 |
| LE23 | Carrying debt by instrument, net debt, October 2024 dividend pro forma, EBITDA identities | Financial foundation (CP-1) |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second Amended and Restated Credit Agreement as amended through Amendment No. 17 (annexed amended text) | Executed credit agreement amendment with marked conformed agreement | Base 2014-06-04; amendment 2024-09-19 | Execution version; annex marked | Controls term loans, revolver, springing covenant, debt, liens, RP, investments, amendments, releases | Primary source for all lender-side capacity and control conclusions | LE01; LE22 |
| 1 | Indenture, 2033 secured notes | Executed indenture | 2024-09-19 | Execution version | Controls 2033 notes covenants, amendments and collateral references | Secured-note distribution and amendment exposure | LE15; LE16; LE17; LE18 |
| 1 | Indenture, 2027 senior subordinated notes | Indenture | 2019-11-13 | Executed status not verified on reviewed pages; supplements not supplied | Controls subordination and blockage for 2027 notes | Subordinated-note recovery mechanics | LE19 |
| 2 | First Lien Intercreditor Agreement and Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; Joinder No. 6 2024-09-19 | Referenced only; not in source set | Would control lien sharing, enforcement and release between lenders and noteholders | Enforcement control and uptier analysis provisional | LE15 |
| 3 | Compliance certificates | Covenant schedules | Not supplied: no certificate in source set | Not in source set | Would control tested ratios and basket usage | Headroom not calculable | LE21 |
| 4 | Annual report covenant and guarantor summaries | Issuer filing summary (secondary to executed documents) | 2024-11-07 | Filed | Corroborates ranking, guarantors, compliance and revolver gate | Used where executed documents are absent; summary only | LE20; LE21 |
| 1 | Indentures for 2028, 2029, 2030, 2031, 2032 secured notes and both 2029 subordinated notes; guarantee and collateral agreement | Executed indentures and security agreement | Not supplied: not in source set | Not in source set | Would control those instruments and collateral perfection | Covenant parity with 2033 notes assumed from annual report, not read | LE20 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Covenant net leverage not above 7.50x (8.00x for four quarters after a material acquisition) only if revolver exposure exceeds 40% of commitments; revolving lenders only; required revolving lenders amend | Credit agreement §6.14 | No test for term loans or notes; revolver lenders can waive alone | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE02 |
| Ratio restricted payments | Any restricted payment if no default and pro forma covenant net leverage at or below 6.75x | Credit agreement §6.02 final paragraph | Unlimited distribution once ratio met, including debt-funded | Negative — Leverage Increase | Not assessed: no comparative source supplied | LE03 |
| General RP basket | Greater of USD 75 million and 3.0% of covenant EBITDA, no default | Credit agreement §6.02(7) | Grower basket independent of ratio | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE03 |
| Management equity basket | Annual cap lesser of greater of USD 50 million and 2.0% EBITDA plus carry-forward (deemed USD 93,650,000 at 2017-11-30) and greater of USD 100 million and 4.0% EBITDA, plus management equity proceeds | Credit agreement §6.02(4) | Dividend-equivalent and buyback leakage | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | LE03 |
| Notes RP | Builder from USD 400 million plus 50% of consolidated net income since 2010; any RP while fixed charge coverage exceeds 2.0x | 2033 indenture §4.07 | Notes impose a looser distribution test than the loans | Negative — Leverage Increase | Not assessed: no comparative source supplied | LE16 |
| Ratio debt | Equal-lien secured debt to 5.00x secured net leverage; junior lien or unsecured to 7.25x; maturity and life not earlier than term loans | Credit agreement Permitted Indebtedness (12) | Pari debt dilutes first-lien collateral | Negative — Leverage Increase | Not assessed: no comparative source supplied | LE05 |
| Fixed and grower debt baskets | General greater of USD 250 million and 10.0% EBITDA; capital leases same; acquired debt greater of USD 150 million and 6.0%; foreign debt greater of USD 450 million and 18.0%; securitization greater of USD 725 million and 20.0%; subordinated debt at 7.25x | Permitted Indebtedness (7), (11), (13), (14), (17), (18) | Grower bases expand with covenant EBITDA; foreign and securitization debt structurally senior | Negative — Leverage Increase | Not assessed: no comparative source supplied | LE05 |
| Reclassification and LCA | Borrower may divide and classify debt across clauses; acquisition ratio tests at signing | Permitted Indebtedness closing paragraph | Capacity can be recycled across baskets | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE05 |
| Incremental and MFN | Incremental subject to ratio tests; 50 bp MFN; MFN excludes acquisition debt, debt after 18 months, debt maturing over 18 months after the tranche | Credit agreement §2.24(b) | Yield protection is temporary | Negative — Refinancing Risk | Not assessed: no comparative source supplied | LE08 |
| Investments | Unlimited in restricted subsidiaries; USub greater of USD 250 million and 10.0% EBITDA; general greater of USD 500 million and 25.0% total assets; JV greater of USD 1,000 million and 40.0% EBITDA at 7.00x; ratio investments at 5.75x with USD 200 million cash and no revolver loans | Permitted Investments (1), (10), (11), (20) | Value can move to non-guarantors and joint ventures | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE06 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries designatable; no recourse debt; must comply with RP and investment covenants | Credit agreement definition of Unrestricted Subsidiary | Limits drop-down of existing operating subsidiaries | Neutral — Stable | Not assessed: no comparative source supplied | LE07 |
| Asset sales | Fair value; at least 75% cash above USD 50 million; designated non-cash consideration up to USD 300 million; proceeds under §2.10 | Credit agreement §6.03 | Collateral released on permitted sale | Neutral — Stable | Not assessed: no comparative source supplied | LE04 |
| Liens | Liens on collateral only if junior to first priority or Permitted Liens | Credit agreement §6.06 | Pari liens flow through Permitted Liens for specified secured debt | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE04 |
| Guarantors and collateral | Domestic subsidiaries join within 20 business days unless immaterial, unrestricted or securitization; foreign pledge 65% voting stock; immaterial caps 7.5% of assets and EBITDA | Credit agreement §5.11 | Foreign value not guaranteed | Neutral — Stable | Not assessed: no comparative source supplied | LE11 |
| Events of default | Payment default; five business days interest grace; 30-day grace for other covenants except Article VI; cross-default to Material Indebtedness with secured-debt sale carve-out | Credit agreement Article VII | Negative covenant breaches default immediately; cross-default links loans to notes | Neutral — Stable | Not assessed: no comparative source supplied | LE14 |
| Amendments | Required Lenders; each-lender items: principal, rate, maturity, pro rata sharing, voting, material guarantor release, all or substantially all collateral release | Credit agreement §9.02(b) | No express lien-subordination protection; non-pro-rata offers by required lenders | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE09 |
| Notes amendments | Majority, including exit consents, amends indenture, security documents and intercreditor agreement; each-holder items include ranking | 2033 indenture §9.02 | Collateral and intercreditor terms majority-controlled | Negative — Covenant Erosion | Not assessed: no comparative source supplied | LE17 |

### Provision-level findings: definitions, debt, leakage, collateral and defaults

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Consolidated EBITDA add-backs | Credit agreement, Amendment No. 17 text, rank 1 | Adds restructuring, integration and transaction costs, dividend equivalent payments, customer start-up costs and projected cost savings within 24 months capped at 25.0% | Higher covenant EBITDA lowers every ratio gate and enlarges grower baskets | Moderate: permits releveraging earlier | Moderate: more pari debt and distributions before gates close | Compare covenant EBITDA with issuer EBITDA As Defined of USD 4,173 million | Negative — Covenant Erosion | Medium | LE12; LE23 |
| Debt definition and cash netting | Credit agreement, rank 1 | Net leverage deducts Unrestricted Cash, which may be subject to loan-document liens | Netting all unrestricted cash favours borrower ahead of distributions funded from that cash | Low | Low | Track cash balances against ratio certificates | Neutral — Stable | Medium | LE07 |
| Ratio debt and incremental | Credit agreement, rank 1 | Equal-lien debt to 5.00x; junior to 7.25x; MFN 50 bp with sunset | Secured claims can grow alongside collateral | Moderate | High: dilution of first-lien recovery | Secured issuance and intercreditor joinders | Negative — Leverage Increase | High | LE05; LE08 |
| Distribution permissions | Credit agreement and 2033 indenture, rank 1 | 6.75x leverage gate and 2.0x coverage gate | Distributions sized only by ratios | High: policy releveraging demonstrated | Moderate: cash leaves collateral | Dividend declarations, incremental use of proceeds | Negative — Leverage Increase | High | LE03; LE16; LE01 |
| Collateral and guarantors | Credit agreement and annual report | Domestic guarantors; 65% foreign stock pledge; non-guarantors carry about 20.73% of sales | Foreign value only reachable through pledged equity after local creditors | Low | Moderate: structural subordination | Foreign debt basket use, guarantor joinders | Negative — Covenant Erosion | Medium | LE11; LE20 |
| Defaults and amendments | Credit agreement and 2033 indenture | Immediate default on negative covenants; majority-controlled amendments without lien-subordination protection | Late default but easy coordinated restructuring by majority | Moderate | High: priming exposure | Amendment filings and exchange offers | Negative — Covenant Erosion | Medium | LE09; LE14; LE17 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Springing covenant | 7.50x revolver-only test above 40% usage | No early lender intervention for term loans and notes | Defaults recognised late, at payment or maturity | Value can erode before enforcement | Quarterly revolver usage versus USD 364 million | LE02; LE21 |
| Ratio restricted payments | 6.75x gate in loans; 2.0x coverage gate in notes | Debt capacity converted to equity distributions | Higher leverage and refinancing need | Cash leaves collateral pool | Board dividend declarations | LE03; LE16 |
| Equal-lien ratio debt | 5.00x secured net leverage gate | More first-lien claims on same collateral | Higher interest burden | Dilution of first-lien recovery | Secured issuance and joinders | LE05 |
| Amendment thresholds | Required lenders and majority noteholders; no express lien-subordination right | Majority can subordinate or exchange minority | Can delay default through liability management | Non-participants can be primed | Amendment and exchange filings | LE09; LE17 |
| Non-guarantor value | About 20.73% of sales outside guarantor group; foreign debt basket | Local creditors rank first on foreign assets | Limited | Structural subordination of all group debt | Foreign borrowing and intercompany flows | LE05; LE20 |
| Subordination | 179-day blockage; payment in full before junior receipt | Subordinated notes stand still in stress | Missed subordinated coupons become early distress signal | Subordinated recovery only after senior paid | Blockage notices | LE19 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions as recorded in the feature register | Not supplied: no covenant-review report or comparative source in the source set | Not assessed: market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed: no comparator | Insufficient Information | LE01; LE15 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only 7.50x springing test above 40% usage; term loans and notes have none | No early trigger for most creditors | Negative — Covenant Erosion | Completed | LE02; LE21 |
| Debt / lien incurrence capacity | 4 | 5.00x pari secured, 7.25x junior; grower baskets; reclassification; temporary MFN | Large secured capacity dilutes first lien | Negative — Leverage Increase | Provisional | LE05; LE08 |
| RP / investment / leakage capacity | 4 | 6.75x unlimited RP; 2.0x notes RP; uncapped restricted-subsidiary investments; USub designation limited to new subsidiaries | Distributions and transfers to non-guarantors sized by ratios | Negative — Leverage Increase | Provisional | LE03; LE06; LE07; LE16 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped restructuring and transaction add-backs; cost savings to 25.0% within 24 months | Ratio gates and grower baskets inflate | Negative — Covenant Erosion | Provisional | LE12 |
| Collateral / guarantor protection | 3 | Domestic guarantors with 7.5% immaterial caps; 65% foreign pledge; release of all collateral needs each lender | Some foreign value outside reach | Neutral — Stable | Provisional | LE11; LE09 |
| Amendment / control mechanics | 4 | Required lenders and majority noteholders; no express lien-subordination right; exit consents | Priming or exchange by majority | Negative — Covenant Erosion | Provisional | LE09; LE17 |
| Overall | 4 | Weighted to distribution, pari debt and amendment exposure, not averaged | Policy releveraging and priming exposure dominate | Negative — Leverage Increase | Provisional | LE03; LE05; LE09 |

Covenant aggressiveness score: 4 of 5, provisional. The rationale is ratio-based distribution and secured-debt capacity with demonstrated use, revolver-only maintenance, and majority-controlled amendments; the score is provisional because the intercreditor agreement, security agreement and tested ratios are missing.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Debt-funded special dividend capacity | Ratio RP at 6.75x; incremental use of proceeds | Leverage reset by policy | PD up; LGD up through cash leakage; RV favours shorter secured paper | Track declarations and use-of-proceeds clauses | LE01; LE03 |
| Notes RP looser than loans | 2.0x coverage gate | Notes do not constrain beyond loan test | PD up | Monitor fixed charge coverage once disclosed | LE16 |
| No lien-subordination sacred right | §9.02(b) list | Uptier by required lenders possible | LGD up for non-participants | Watch amendment filings, lender groups | LE09 |
| Majority noteholder control of collateral documents | 2033 indenture §9.02 | Exit consents can strip protections | LGD up for holdouts | Watch exchange offers and consent solicitations | LE17 |
| MFN sunset and carve-outs | §2.24(b) | Later pari debt can price wide without repricing existing loans | RV down for existing term loans | Track 18-month dates and acquisition debt | LE08 |
| Foreign subsidiary debt | Permitted Indebtedness (14) | Structurally senior claims on foreign value | LGD up | Track foreign borrowings | LE05 |
| Springing covenant gate | §6.14 | Only revolver lenders gain leverage control | PD signal when usage exceeds USD 364 million | Quarterly revolver usage | LE02; LE21 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement dated 2019-02-13 and Joinders 1 to 6 | Controls enforcement, standstill, turnover and release between lenders and noteholders | Intercreditor registers and uptier view provisional | Obtain executed agreement and joinders |
| Compliance certificates | Tested covenant net leverage, secured net leverage, covenant EBITDA and basket usage | Required for headroom and capacity | All leverage headroom not calculable | Obtain latest certificate and basket tracker |
| Security documents | Guarantee and collateral agreement, perfection certificate, excluded-asset schedules, mortgage and control-agreement suspension terms | Defines collateral reach | Collateral map partial | Obtain current security agreement and schedules |
| Other indentures | 2028 to 2032 secured notes; both 2029 subordinated notes; supplemental indentures | Covenant parity assumed from annual report | Notes-side conclusions extend from 2033 and 2027 indentures only | Obtain each indenture |
| Definitions not reviewed | Consolidated Total Indebtedness, Fixed Charge Coverage, Material Indebtedness threshold, Change of Control, Mortgage Suspension Period | Affect ratio numerators, notes RP gate and cross-default | Some tests described without full definition | Read full definitions |
| Earlier amendments | Amendment No. 15 and No. 16 texts not reviewed | Amendment No. 15 changed restrictive covenants per issuer | Possible unverified changes in marked text | Read amendment texts against Annex I |
| Comparative source | Covenant-review report | Market-norm view | Market comparison skipped | Obtain third-party review |

### T4D.1 Source gate and entity evidence

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement as amended by Amendment No. 17 | Execution version; annexed text marked | 1 | Guarantee and collateral agreement and schedules not supplied | Completed with Limitations |
| 2033 secured notes indenture | Execution version | 1 | Security documents and intercreditor agreement referenced only | Completed with Limitations |
| 2027 subordinated notes indenture | Indenture text available | 1 | Supplements not supplied | Completed with Limitations |
| Annual report guarantor information and combined summary | Filed | 4 | Summary; non-guarantor figures derived and may include intercompany effects; no entity list read | Completed with Limitations |
| Subsequent perimeter events | No guarantee release, designation or collateral release found in reviewed text after 2024-09-30 | Not applicable | October 2024 dividend and securitization draw are financing events, not perimeter changes | Completed with Limitations |

### T4D.2 Legal entity perimeter

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of all debt | Delaware | Public company | Not a restricted subsidiary; passive holding company covenant | No significant operations or assets other than investment in TransDigm Inc. | Yes, guarantor | LE01; LE13; LE20 |
| TransDigm Inc. | Borrower and issuer of all notes | Delaware | TransDigm Group Incorporated | Borrower | Included in combined guarantor group: current assets USD 7,813 million, goodwill USD 8,186 million, other non-current USD 3,889 million, sales USD 6,294 million (with guarantors) | Yes, obligor | LE01; LE20 |
| TransDigm UK | Guarantor of secured and subordinated notes | Not supplied: jurisdiction not stated in reviewed pages; UK collateral agent suggests United Kingdom | Not supplied: parent not stated in reviewed pages | Restricted; guarantor | Within combined guarantor figures | Yes, guarantor | LE15; LE20 |
| Domestic restricted subsidiaries | Subsidiary guarantors and loan parties | United States | TransDigm Inc. | Restricted; existing subsidiaries cannot be designated unrestricted | Within combined guarantor figures | Yes, guarantors | LE07; LE11; LE20 |
| Domestic immaterial subsidiaries | Excluded subsidiaries | United States | TransDigm Inc. or subsidiaries | Restricted; non-guarantors within 7.5% caps | Below 7.5% of total assets and covenant EBITDA in aggregate by covenant | No | LE11 |
| Foreign restricted subsidiaries other than TransDigm UK | Non-guarantors; equity 65% voting pledged | Various non-US | Loan parties | Restricted | Part of non-guarantor value: about USD 1,646 million of sales and USD 2,233 million of goodwill across all non-guarantors | No | LE11; LE20 |
| Securitization entity | Receivables financing vehicle | Not supplied: not stated in reviewed pages | Not supplied: not stated | Excluded subsidiary; non-recourse basket | Receivables backing USD 486 million carrying borrowing | No | LE05; LE11; LE23 |
| Unrestricted subsidiaries | None identified | Not applicable | Not applicable | Only new subsidiaries designatable | Not supplied: no designation found in reviewed text | No | LE07 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × credit facility | Senior secured | Upstream from parent | Release of material guarantor needs each lender | LE01; LE09 |
| Domestic restricted subsidiaries × credit facility | Senior secured | Upstream and cross-stream | Lien and guarantee release on permitted disposal to non-loan party; material guarantor release otherwise each lender | LE09; LE11 |
| Holdings, TransDigm UK, domestic restricted subsidiaries × 2028 secured notes | Senior secured | Upstream and cross-stream | Not supplied: 2028 indenture not in source set | LE20 |
| Holdings and restricted subsidiaries that borrow under or guarantee the credit facility or at least USD 200 million of capital-markets debt × 2029 to 2033 secured notes | Senior secured, springing to credit-facility guarantor set | Upstream and cross-stream | Guarantee follows credit-facility guarantor status per annual report; precise release clause not reviewed | LE20 |
| Holdings, TransDigm UK, domestic restricted subsidiaries × subordinated notes | Senior subordinated unsecured | Upstream and cross-stream | Not supplied: release clause not reviewed | LE19; LE20 |
| Foreign subsidiaries other than TransDigm UK × all tranches | None | Not applicable | Not applicable | LE11; LE20 |

### T4D.4 Collateral by entity

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Inc. and loan parties × first lien (lenders and secured notes) | Equity of unrestricted subsidiaries; equity requiring separate SEC financial statements; property outside pledged and Article 9 collateral | Automatic on permitted sale to non-loan party, guarantor release, payoff; specific release by required lenders; all or substantially all needs each lender | Mortgage and control-agreement suspension periods exist; triggers not reviewed | LE09; LE11 |
| Foreign subsidiary equity × first lien | 35% of voting stock | Same as above | Pledge only of first-tier foreign stock; no foreign asset liens identified | LE11 |
| Foreign subsidiary assets × any lien | All assets | Not applicable | Not supplied: no foreign security documents reviewed beyond UK collateral agent role | LE11; LE15 |
| Cash of loan parties × first lien | Not supplied: account control limits not reviewed | Control-agreement suspension period | Annual report states collateral includes available cash | LE21; LE09 |
| Securitization receivables × first lien | Excluded subsidiary assets | Not applicable | Outside loan-party collateral | LE11 |
| Loan parties × second lien | Not applicable: no second-lien debt outstanding | Junior liens permitted up to 7.25x | Agent must enter junior intercreditor on request | LE05; LE09 |

### T4D.5 Structural priority

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Credit facility | TransDigm Inc. plus guarantors | Guarantor assets and pledged foreign equity | Pari (same entity, same lien) | Non-guarantor value, about 20.73% of sales, reachable only through 65% stock pledge after local creditors | First claim on guarantor collateral shared with secured notes | Medium | LE11; LE20 |
| Secured notes 2028–2033 | TransDigm Inc. plus guarantors | Same collateral under intercreditor agreement | Pari (same entity, same lien) | Same non-guarantor value; plus Priming-Exposed (uptier capable) through majority amendments | Equal with loans, subject to unreviewed intercreditor terms | Low | LE15; LE17; LE20 |
| Subordinated notes | TransDigm Inc. plus guarantors | Residual after senior debt | Contractually Subordinated | Non-guarantor value structurally ahead; senior debt paid in full first | Lowest recovery access | High | LE19; LE20 |
| Foreign subsidiary debt and securitization | Non-guarantor subsidiaries and securitization entity | Their own assets and receivables | Structurally Senior | Not applicable | Senior on foreign assets and sold receivables | Medium | LE05; LE11 |

### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distribution to shareholders | TransDigm Inc. to Holdings to shareholders | Ratio RP at 6.75x; notes 2.0x coverage gate | Unlimited within ratio | 4 | Cash and debt capacity leave creditors | Demonstrated: September 2024 recapitalisation | LE01; LE03; LE16 |
| Investment into non-guarantor restricted subsidiaries | Loan parties to foreign restricted subsidiaries | Permitted Investments (1)(a), uncapped | Uncapped intercompany value | 4 | Value moves behind local creditors and 65% pledge | Theoretical | LE06 |
| Designation and investment into unrestricted subsidiary | Loan parties to newly formed or acquired subsidiary | Unrestricted Subsidiary definition; Permitted Investments (1)(c), (10), (20) | Greater of USD 250 million and 10% EBITDA plus general and ratio baskets | 3 | New-subsidiary limit protects existing operating value | Theoretical | LE06; LE07 |
| Joint ventures | Loan parties to joint ventures | Permitted Investments (11) | Greater of USD 1,000 million and 40% EBITDA at 7.00x | 3 | Assets leave restricted group | Theoretical | LE06 |
| Asset sales out of group | Loan parties to third parties | §6.03 and automatic lien release | Bounded by fair value and 75% cash; proceeds under §2.10 | 2 | Collateral replaced by proceeds unless reinvested | Theoretical | LE04; LE09 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by required lenders | §9.02(b) lacks express lien-subordination each-lender right; non-pro-rata offers allowed with required lenders | Non-participating term lenders and revolver lenders | Theoretical | Participating lenders could gain priority; pro rata sharing protection limits open-market selectivity | Low | LE09 |
| Exit-consent exchange on 2033 notes | Indenture §9.02 majority can amend security documents and intercreditor agreement | Non-exchanging 2033 noteholders | Theoretical | Holdout collateral could be weakened; ranking change needs each holder | Low | LE17 |
| Pari debt dilution | Permitted Indebtedness (12) to 5.00x; agent must sign pari intercreditor | All first-lien creditors | Demonstrated: 2033 notes and Tranche L joined in 2024 | Same-priority claims on fixed collateral | High | LE01; LE05; LE09 |
| Drop-down to non-guarantor | Uncapped restricted-subsidiary investments plus foreign debt basket | All group creditors | Theoretical | Value can support structurally senior foreign debt | Medium | LE05; LE06 |

### T4D.8 Gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Entity list | Exhibit 22.1 obligor and guarantor list; subsidiary list | Names guarantors and jurisdictions | Perimeter shown by class, not by entity | Obtain exhibit and subsidiary list |
| Entity-level debt and assets | Non-guarantor debt and assets net of intercompany | Sizes structural subordination | Non-guarantor value approximated from sales and goodwill | Obtain non-guarantor balance sheet detail |
| Security agreement | Guarantee and collateral agreement and perfection schedules | Collateral reach and exclusions | Collateral map partial | Obtain current security documents |
| Release clauses in notes | Guarantee release provisions of 2028 to 2033 and subordinated indentures | Guarantee fall-away mechanics | Release triggers for notes partly not supplied | Read indenture release sections |

### T4F.1 Controlling documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement as amended by Amendment No. 17 | TransDigm Inc., Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent and collateral agent | 2024-09-19; base 2014-06-04 | New York | Execution version | d887611dex101.htm.jsonl, pages 1 and 222 | LE01; LE22 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, guarantors, BNY Mellon Trust Company as trustee and US collateral agent, BNY Mellon as UK collateral agent | 2024-09-19 | New York | Execution version | d887611dex41.htm.jsonl, pages 1 and 126 | LE15; LE18 |
| First Lien Intercreditor Agreement | Company, Holdings, subsidiary guarantors, credit agreement collateral agent, secured notes trustees and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced only | d887611dex41.htm.jsonl, page 30 | LE15 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, BNY Mellon Trust Company as trustee | 2019-11-13 | Not supplied: governing-law clause not reviewed | Indenture text available | d826058dex41.htm.jsonl, page 1 | LE19 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, equal payment rank | Shared first-priority collateral | Agent acts; revolving lenders alone benefit from springing covenant | Required revolving lenders for §6.14; required lenders generally | LE02; LE09; LE10 |
| Term lenders, Tranches I to L | First lien, equal payment rank | Shared first-priority collateral | Agent has sole right among lenders to proceed against collateral | Required Lenders; each-lender sacred rights | LE09; LE10 |
| Secured noteholders | First lien, equal payment rank with credit facility | Shared collateral through notes collateral agents | [Insufficient Information] — ICA not in the source set | Majority of each series amends indenture, security documents and intercreditor agreement | LE15; LE17 |
| Subordinated noteholders | Contractually subordinated, unsecured | None | Subject to payment blockage and turnover | Not supplied: amendment thresholds not reviewed | LE19 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Agent sole right to proceed against collateral | Not applicable: no standstill among lenders | Event of default and required-lender direction | Credit agreement agent | Lenders | Individual lenders cannot enforce separately | Neutral — Stable | LE10 |
| Lender versus secured-noteholder enforcement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Secured noteholders and lenders | Controlling party in enforcement not established | Insufficient Information | LE15 |
| Subordinated payment blockage | Up to 179 days; one period per 360 days; at least 181 days per 360 without blockage | Non-payment default on designated senior debt permitting acceleration and blockage notice | Representative of designated senior debt | Subordinated noteholders | Junior payments stop while senior creditors negotiate | Negative — Liquidity Deterioration | LE19 |
| Subordinated payment default stop | Until cure, waiver, acceleration rescinded or senior paid | Payment default or acceleration of designated senior debt | Designated senior debt | Subordinated noteholders | Junior payments stop without time limit while payment default continues | Negative — Refinancing Risk | LE19 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordination in insolvency | Payments to subordinated holders go to senior holders until senior paid in full in cash | Not applicable | Not supplied: no purchase option in reviewed text | Except junior securities subordinated to same extent | Holders may receive subordinated stock and debt | LE19 |
| Credit agreement lien release | Not applicable | Automatic on permitted sale, guarantor release, payoff; required lenders for specific releases; each lender for all or substantially all | Not applicable | Compliance with agreement; officer certificate reliance | Each-lender protection for wholesale release | LE09 |
| 2033 notes collateral release | [Insufficient Information] — ICA not in the source set | Indenture may release collateral as permitted without holder consent; majority amends security documents | [Insufficient Information] — ICA not in the source set | Intercreditor terms not reviewed | Ranking changes need each holder | LE17 |
| Term loan buybacks | Not applicable | Required lenders may permit non-pro-rata prepayment | Offers must be made to all lenders of a class | Agent-approved procedures | Each-lender pro rata sharing otherwise | LE09 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term and revolving lenders | Agent-led enforcement and credit bid over shared collateral | No express lien-subordination protection | High | Required lenders could restructure priority | Negative — Covenant Erosion | LE09; LE10 |
| Secured noteholders | Recovery through shared collateral per intercreditor agreement | Enforcement control and majority amendment of security documents | High | Noteholders may not direct enforcement; holdouts exposed to exit consents | Insufficient Information | LE15; LE17 |
| Subordinated noteholders | Recovery only after senior paid; turnover | Blockage and turnover | High | Junior stands still in stress | Negative — Refinancing Risk | LE19 |

### T4F.6 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | Executed First Lien Intercreditor Agreement and six joinders | Enforcement control, standstill, release and turnover between lenders and noteholders | Secured-noteholder enforcement rows not established | Obtain executed agreement |
| Subordinated amendment thresholds | 2027 indenture amendment article | Subordinated holder control | Voting weight not established | Read indenture amendment section |
| Other note collateral terms | Security documents of 2028 to 2032 notes | Whether all series share identical rights | Notes treated as one class on annual-report description | Obtain documents |

### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended by Amendment No. 17 | Executed credit agreement | 2024-09-19 | Execution version | Legal formula | All loan-side baskets and ratio gates | LE01 to LE14 |
| 1 | 2033 notes indenture | Executed indenture | 2024-09-19 | Execution version | Legal formula | Notes RP and amendment thresholds | LE16; LE17 |
| 3 | Compliance certificate | Covenant schedule | Not supplied: not in source set | Not in source set | Usage and tested ratios | Headroom not calculable | LE21 |
| Financial input | Financial foundation | Accepted financial analysis | As of 2024-09-30 | Accepted | Financial input, non-covenant reference only | Carrying debt and EBITDA for reference metrics | LE23 |
| 4 | Annual report covenant summary | Issuer filing | 2024-11-07 | Filed | Usage of revolver and compliance statement | Revolver gate measurable | LE21 |

### T4C.3 Definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | Credit agreement definition | Net income plus add-backs including restructuring, transaction costs, dividend equivalents, start-up costs and projected cost savings capped at 25.0% | Covenant EBITDA bridge | Higher EBITDA enlarges grower baskets and lowers ratios | Add-back inflation | Negative — Covenant Erosion | LE12 |
| Consolidated Net Leverage Ratio | Credit agreement definition | Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA, pro forma | Covenant debt, Unrestricted Cash, covenant EBITDA | Gates RP 6.75x, junior debt 7.25x, investments 5.75x and 7.00x, springing 7.50x | Cash netting and add-backs | Insufficient Information | LE07; LE02 |
| Consolidated Secured Net Debt Ratio | Credit agreement definition | Secured debt less Unrestricted Cash over Consolidated EBITDA | Secured covenant debt, cash, EBITDA | Gates pari secured debt at 5.00x | Pari dilution | Insufficient Information | LE05 |
| Covenant debt versus carrying debt | Credit agreement versus financial foundation | Covenant total indebtedness definition not reviewed; carrying debt USD 24,880 million | Full definition | Divergence unquantified | Definition conflict recorded, not reconciled | Insufficient Information | LE23 |
| Fixed charge coverage, notes | 2033 indenture §4.07 | Must exceed 2.0x for unlimited RP; definition not reviewed | Notes EBITDA and fixed charges | Unlimited RP while above gate | Notes gate looser than loan gate | Insufficient Information | LE16 |
| Unrestricted Cash | Credit agreement definition | Cash of holdings, borrower and restricted subsidiaries free of non-loan-document liens | Cash by entity | Collateral cash still nets | Netting maximises capacity | Neutral — Stable | LE07 |
| Non-debt funding float | Covenant debt definition not reviewed | Customer advances of USD 177 million sit outside carrying debt | Definition | Not supplied: treatment in covenant debt not established | Float outside ratio tests | Insufficient Information | LE23 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver usage gate for springing covenant | max-ratio | 40.00% | 7.36% | Revolving credit exposure divided by revolving commitments; letters of credit 67 over commitments 910 | 32.64% | Compliant | Cash-collateralised letters excluded by definition; collateralisation not stated | Test springs only above USD 364 million usage | Neutral — Stable | LE02; LE21 |
| Springing covenant net leverage | max-ratio | 7.50x | Not supplied: tested ratio not disclosed | Consolidated Net Leverage Ratio at quarter end | Not calculable: missing current tested ratio | Not Calculable | 8.00x after material acquisition; revolver-only | Late intervention | Insufficient Information | LE02 |
| Ratio restricted payments, credit agreement | max-ratio | 6.75x | Not supplied: tested ratio not disclosed | Pro forma Consolidated Net Leverage Ratio including payment and financing | Not calculable: missing current tested ratio | Not Calculable | Reference proxy 5.50x on carrying net debt after October 2024 dividend over EBITDA As Defined is not covenant leverage | Distribution capacity | Insufficient Information | LE03; LE23 |
| Equal-lien secured debt | max-ratio | 5.00x | Not supplied: tested ratio not disclosed | Pro forma Consolidated Secured Net Debt Ratio | Not calculable: missing current tested ratio | Not Calculable | Certified at or below at September 2024 closing | Pari dilution | Insufficient Information | LE01; LE05 |
| Junior and unsecured debt and incremental loans | max-ratio | 7.25x | Not supplied: tested ratio not disclosed | Pro forma Consolidated Net Leverage Ratio | Not calculable: missing current tested ratio | Not Calculable | Certified at or below at September 2024 closing | Releveraging | Insufficient Information | LE01; LE05 |
| Ratio investments | max-ratio | 5.75x | Not supplied: tested ratio not disclosed | Pro forma Consolidated Net Leverage Ratio | Not calculable: missing current tested ratio | Not Calculable | Also needs USD 200 million Unrestricted Cash and no revolver loans | Investment leakage | Insufficient Information | LE06 |
| Joint-venture investments | max-ratio | 7.00x | Not supplied: tested ratio not disclosed | Pro forma Consolidated Net Leverage Ratio | Not calculable: missing current tested ratio | Not Calculable | Basket cap greater of USD 1,000 million and 40% EBITDA | JV leakage | Insufficient Information | LE06 |
| Notes ratio restricted payments | min-ratio | 2.00x | Not supplied: tested ratio not disclosed | Consolidated Fixed Charge Coverage Ratio pro forma | Not calculable: missing current tested ratio | Not Calculable | Definition not reviewed | Distribution capacity | Insufficient Information | LE16 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Debt incurrence capacity | Ratio debt, equal lien | Ratio Basket: secured net leverage at or below 5.00x | No default; maturity and life not before term loans; collateral only | Not supplied: tested ratio | Tranche L USD 1,500 million and 2033 notes USD 1,500 million used in September 2024 | Not calculable: tested ratio and covenant EBITDA missing | Not calculable: tested ratio missing | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | LE01; LE05 |
| Incremental facility capacity | §2.24 incremental | Incremental Ratio Amount: 7.25x and 5.00x | MFN 50 bp, 18-month sunset | Not supplied: tested ratio | Tranche L USD 1,500 million | Not calculable: tested ratio missing | Not calculable: tested ratio missing | Formula Extracted Only | High | Secured add-on debt | Negative — Leverage Increase | LE08; LE01 |
| Debt incurrence capacity | General debt basket | General Basket: greater of USD 250 million and 10.0% covenant EBITDA | Borrower and guarantors | Not supplied: covenant EBITDA | Not supplied: usage not disclosed | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Additional debt | Negative — Leverage Increase | LE05 |
| Debt incurrence capacity | Foreign subsidiary debt | Grower Basket: greater of USD 450 million and 18.0% covenant EBITDA | Foreign restricted subsidiaries | Not supplied: covenant EBITDA | Not supplied: usage not disclosed | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | High | Structurally senior debt | Negative — Leverage Increase | LE05 |
| Debt incurrence capacity | Securitization | Grower Basket: greater of USD 725 million and 20.0% covenant EBITDA | Non-recourse | Facility commitment USD 650 million; carrying USD 486 million at year-end | Not supplied: classification across clauses at borrower discretion | Not calculable: classification and covenant EBITDA missing | Not calculable: classification missing | Ready with Limitations | Moderate | Receivables outside collateral | Negative — Liquidity Deterioration | LE05; LE23 |
| Restricted payment capacity | Ratio RP | Ratio Basket: covenant net leverage at or below 6.75x | No default | Not supplied: tested ratio | Special dividend paid October 2024 | Unlimited when ratio met | Not calculable: tested ratio missing | Formula Extracted Only | High | Debt-funded distributions | Negative — Leverage Increase | LE03; LE01 |
| Restricted payment capacity | General RP | General Basket: greater of USD 75 million and 3.0% covenant EBITDA | No default | Not supplied: covenant EBITDA | Not supplied: usage not disclosed | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Low | Small leakage | Neutral — Stable | LE03 |
| Restricted payment capacity | Notes builder and coverage gate | Builder Basket: USD 400 million plus 50% of net income since 2010; ratio gate above 2.0x | No default | Not supplied: cumulative net income and RP usage | Not supplied: usage not disclosed | Not calculable: builder inputs missing | Not calculable: usage missing | Formula Extracted Only | High | Notes permit distributions loans also permit | Negative — Leverage Increase | LE16 |
| Investment capacity | Unrestricted subsidiary investments | Grower Basket: greater of USD 250 million and 10.0% covenant EBITDA | New subsidiaries only; no recourse debt | Not supplied: covenant EBITDA | Not supplied: no designation found | Not calculable: covenant EBITDA missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Drop-down to unrestricted vehicle | Negative — Covenant Erosion | LE06; LE07 |
| Investment capacity | General investments | General Basket: greater of USD 500 million and 25.0% of total assets | Outstanding amount | Not supplied: covenant total assets | Not supplied: usage not disclosed | Not calculable: covenant total assets missing | Not calculable: usage missing | Formula Extracted Only | Moderate | Value transfer | Negative — Covenant Erosion | LE06 |
| Investment capacity | Restricted subsidiaries including non-guarantors | Uncapped | None | Not applicable | Not supplied: intercompany flows not disclosed | Uncapped | Uncapped | Ready with Limitations | High | Value moves behind foreign creditors | Negative — Covenant Erosion | LE06 |
| Asset transfer capacity | Asset sales | Prepayment / Reinvestment Capacity: fair value, 75% cash above USD 50 million, non-cash up to USD 300 million | Proceeds under §2.10 | Not applicable | Not supplied: usage not disclosed | Not calculable: no fixed cap | Not calculable: no fixed cap | Formula Extracted Only | Moderate | Collateral release on sale | Neutral — Stable | LE04 |
| Guarantor / collateral release capacity | Required-lender specific release | Required Lenders; all or substantially all needs each lender | §9.02(c) | Not applicable | Not applicable | Not calculable: depends on assets selected | Not calculable: no cap | Formula Extracted Only | High | Piecemeal collateral release | Negative — Covenant Erosion | LE09 |
| MFN protection | §2.24(b) | 50 bp yield differential | Excludes acquisition debt, debt after 18 months, longer-dated debt | Not applicable | Not applicable | Not applicable | Not applicable | Ready with Limitations | Moderate | Yield dilution after sunset | Negative — Refinancing Risk | LE08 |

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured ratio debt and incremental loans | Up to 5.00x secured net leverage | Formula Extracted Only | Same-priority claims added to fixed collateral | Higher debt service | Dilution of first-lien recovery | Favours shorter-dated first-lien paper | LE05; LE08 |
| Junior lien and unsecured debt | Up to 7.25x net leverage | Formula Extracted Only | Layering below first lien | Higher leverage | First lien protected; subordinated holders diluted | Weighs on subordinated notes | LE05 |
| Foreign subsidiary debt | Greater of USD 450 million and 18.0% EBITDA | Formula Extracted Only | Structurally senior on foreign assets | Modest | Reduces value reaching pledged foreign equity | Weighs on all group debt | LE05 |
| Lien subordination by amendment | Required lenders; no express each-lender right in reviewed text | Formula Extracted Only | Uptier for participating lenders | Can defer default | Non-participants primed | Favours larger holders able to join groups | LE09 |
| Notes exchange with exit consents | Majority of series | Formula Extracted Only | Strip security-document protections from holdouts | Can defer default | Holdouts diluted | Weighs on smaller note series | LE17 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Shareholder distributions | Unlimited RP at 6.75x; notes at 2.0x coverage | Ratio Basket | Used for special dividend; remaining not calculable without tested ratio | Cash leaves collateral pool | High | Negative — Leverage Increase | LE01; LE03; LE16 |
| Management equity and dividend equivalents | Annual cap with carry-forward | Grower Basket | Not supplied: usage not disclosed | Small recurring leakage | Low | Neutral — Stable | LE03 |
| Non-guarantor restricted subsidiaries | Uncapped intercompany investment | Uncapped | Not supplied: flows not disclosed | Value outside guarantee and lien | High | Negative — Covenant Erosion | LE06 |
| Unrestricted subsidiaries | New subsidiaries only; capped investment | Grower Basket | Not supplied: none identified | Leaves restricted group if used | Moderate | Negative — Covenant Erosion | LE06; LE07 |
| Joint ventures | Ratio-conditioned basket | Grower Basket | Not supplied: usage not disclosed | Leaves restricted group | Moderate | Negative — Covenant Erosion | LE06 |

Routes are recorded separately; because baskets overlap and the borrower may classify across clauses, capacities are not summed.

### T4C.8 EBITDA add-back inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Consolidated EBITDA (m) | Actions within 24 months; capped at 25.0% of EBITDA | Not calculable: covenant EBITDA bridge missing | Up to a quarter of covenant EBITDA can be projected | Lowers ratio gates; more debt and RP capacity | LE12 |
| Restructuring and integration costs | Consolidated EBITDA (d) | Uncapped | Not calculable: amounts not disclosed | Recurring acquisition costs added back | Inflates EBITDA in an acquisitive model | LE12; Earnings quality (CP-1D) |
| Transaction and refinancing expenses | Consolidated EBITDA (e) | Uncapped, successful or not | Not calculable: amounts not disclosed | Financing activity raises EBITDA | Inflates capacity | LE12 |
| Dividend equivalent payments | Consolidated EBITDA (k) | Uncapped | Not calculable: amounts not disclosed | Distributions to option holders added back | Distributions do not reduce covenant EBITDA | LE12 |
| Customer start-up costs | Consolidated EBITDA (l) | Uncapped | Not calculable: amounts not disclosed | Operating costs added back | Inflates capacity | LE12 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio RP used for debt-funded dividend | Tranche L proceeds applied to special dividend | Repeat releveraging | High | Moderate | Refinancing & LME; Committee decision | LE01; LE03 |
| Reclassification across debt baskets | Borrower divides and classifies in sole discretion | Basket recycling | Moderate | Formula Only | Covenant capacity | LE05 |
| Uncapped non-guarantor investment | Permitted Investments (1)(a) | Value transfer | High | Formula Only | Structural priority; Recovery & fulcrum | LE06 |
| No express lien-subordination protection | §9.02(b) list | Uptier | High | Low | Recovery & fulcrum; Refinancing & LME | LE09 |
| Majority notes amendment of collateral documents | Indenture §9.02 | Exit-consent stripping | High | Low | Security selection | LE17 |
| Add-back inflation | Uncapped (d), (e), (k), (l); 25.0% cost savings | Ratio capacity overstated | Moderate | Formula Only | Covenant capacity | LE12 |

### T4C.11 Capacity priority matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Ratio restricted payments at 6.75x and notes 2.0x | High | Moderate | Debt-funded distributions | Higher | Cash leakage | Dividend declarations and use of proceeds | LE03; LE16 |
| 2 | Equal-lien secured debt to 5.00x | High | Moderate | Pari dilution | Higher | Dilution | Secured issuance and joinders | LE05 |
| 3 | Amendment thresholds without lien-subordination protection | High | Low | Uptier or exchange | Deferred | Priming | Amendment and exchange filings | LE09; LE17 |
| 4 | Uncapped non-guarantor investment and foreign debt | High | Formula Only | Value behind structurally senior debt | Limited | Structural subordination | Foreign borrowing | LE05; LE06 |
| 5 | EBITDA add-backs | Moderate | Formula Only | Ratio inflation | Higher | Indirect | Covenant EBITDA versus issuer EBITDA | LE12 |
| 6 | Springing revolver covenant | Low | High | Late intervention | Late signal | Indirect | Revolver usage | LE02 |

### T4C.12 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Tested ratios | Compliance certificate with covenant net leverage, secured net leverage and fixed charge coverage | Headroom and maximum additional debt | All ratio headroom not calculable | Obtain certificate |
| Covenant EBITDA bridge | Covenant EBITDA and add-back amounts | Grower baskets and ratios | Grower basket capacity not calculable | Obtain bridge |
| Basket usage | Tracker for general, foreign, securitization, RP and investment baskets | Remaining capacity | Remaining capacity not calculable | Obtain tracker |
| Covenant debt definition | Full Consolidated Total Indebtedness definition | Numerator and float treatment | Definition conflict unquantified | Read definition |
| MFN dates | Effective dates of Amendments No. 16 and 17 | Sunset dates of MFN and soft call | No dated sunset event | Confirm effective dates |

## Calculations

All amounts are USD millions unless stated; ratios use the same currency and scale. Results feed only non-covenant reference metrics and the revolver usage gate; none is a covenant calculation.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L01 | FY2024 sales outside guarantor group | Consolidated sales 7940 less combined guarantor sales 6294 | 1646 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L02 | FY2024 non-guarantor share of sales | 1646 / 7940 | 0.20730478589420654911838790931989924433, displayed 20.73% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L03 | 2024-09-30 goodwill outside guarantor group | Consolidated goodwill 10419 less guarantor goodwill 8186 | 2233 | USD millions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L06 | 2024-09-30 springing covenant usage gate | 910 × 0.40 | 364.00; issuer states USD 364 million | USD millions | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L07 | 2024-09-30 revolver usage | Letters of credit 67 / commitments 910 | 0.073626373626373626373626373626373626374, displayed 7.36% | Fraction; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L08 | 2024-09-30 drawing before gate | 364 − 67 | 297 | USD millions | Calculations L06 and L07 inputs |
| L09 | 2024-09-30 usage-gate headroom | 40.00 − 7.36 | 32.64 | Percentage points | Calculation L07 |
| L10 | October 2024 reference leverage | Pro forma carrying net debt 22967 / EBITDA As Defined 4173 | 5.5037143541816439012700694943685597891, displayed 5.50x | x | Financial foundation (CP-1) |
| L11 | Reference gap to restricted-payment gate | 6.75 − 5.5037143541816439012700694943685597891 | 1.2462856458183560987299305056314402109, displayed 1.25x; not covenant headroom | x | Calculation L10; d887611dex101.htm.jsonl, page 181 |
| I01 | Inherited year-end and pro forma figures | Carrying debt 24880; net debt 18619 and 4.88x; pro forma after October 2024 dividend 22967 and 6.02x; EBITDA As Defined 4173 | Inherited, not recalculated | USD millions; x | Financial foundation (CP-1) |

The October 2024 dividend pro forma is inherited as stated and holds annual EBITDA constant; the reference leverage divides it by issuer-adjusted rather than covenant EBITDA, so it can differ from the tested ratio in either direction.

## Gaps

The open items below restrict headroom, intercreditor and collateral conclusions; they do not change the reading of the reviewed clauses.

| Gap | Severity | What is missing | Effect on conclusion | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | Executed First Lien Intercreditor Agreement and joinders | Enforcement control, standstill and release between lenders and noteholders not established | d887611dex41.htm.jsonl, page 30 |
| Tested covenant ratios | MATERIAL | Compliance certificate, covenant EBITDA and basket usage | No leverage headroom or remaining capacity | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Security documents | MATERIAL | Guarantee and collateral agreement, perfection schedules, suspension-period triggers | Collateral reach partial | d887611dex101.htm.jsonl, page 207 |
| Other indentures | MATERIAL | 2028 to 2032 secured and both 2029 subordinated indentures | Notes-side terms extended from two indentures and the annual report | Source readiness (CP-0) |
| MFN and soft-call sunset dates | MINOR | Effective dates of the June and September 2024 amendments | MFN falls away 18 months after each effective date; no dated event recorded | d887611dex101.htm.jsonl, page 144 |
| Definitions not reviewed | MINOR | Total indebtedness, fixed charge coverage, Material Indebtedness threshold, change of control | Some gates described without full definition | d887611dex101.htm.jsonl, page 189 |
| Market comparison | MINOR | Covenant-review report | No market-norm judgement | Not supplied: no comparative source in the source set |

## Next module
The orchestrator selects the next module.
