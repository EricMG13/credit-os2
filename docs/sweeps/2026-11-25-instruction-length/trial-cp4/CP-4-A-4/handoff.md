## Request
TransDigm Group Incorporated, as of 2024-09-30; pathway: deep_credit_assessment. Interpret the executed credit agreement as amended in September 2024, the 2033 secured notes indenture and the 2027 senior subordinated notes indenture for covenant architecture, debt and lien capacity, leakage, collateral and guarantee reach, intercreditor control, defaults and amendment exposure, translated into PD and LGD mechanisms.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Maintenance-covenant description, compliance statement, latest covenant amendment, incremental tests, securitization terms |
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement with the annexed amended second restated credit agreement | 2024-09-19, agreement date; publication not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling bank document: definitions, debt, investment and restricted-payment baskets, springing covenant, MFN, collateral, amendments, releases, defaults, governing law |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 | 2024-09-19, indenture date as recorded by Source readiness; publication not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note restricted payments, lien tests, intercreditor references, collateral-agent authority, amendment thresholds, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date as recorded by Source readiness; publication not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordinated-note restricted payments, ratio debt, payment blockage |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Accepted source set, document dates, missing-document inventory and retrospective boundary |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt instruments, carrying values, revolver availability, issuer EBITDA As Defined, October 2024 dividend pro forma net debt and cash |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation facts and borrower and holdings identity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Rejected recurring add-backs used to frame covenant EBITDA inflation |

## Findings

### Bottom line
Covenant protection for TransDigm creditors is thin and ratio-driven: term loans and notes carry no maintenance test, distributions are unlimited at or below 6.75x covenant net leverage, and pari first-lien debt can be added up to 5.00x secured net leverage.

The only maintenance test is the revolver's springing 7.50x net leverage covenant, which applies only when revolver exposure exceeds 40% of commitments; at year-end exposure was at most about 7.36%, so it was dormant. The primary PD channel is releveraging through the ratio baskets that the USD 4,348 million September recapitalisation demonstrated; the primary LGD channel is pari secured dilution under an intercreditor agreement that is not in the source set, so enforcement control is not established. The strongest protections are each-lender consent to change pro-rata sharing or release all or substantially all collateral, and a 179 days cap on subordinated-note payment blockage. The package scores 4 on the five-point aggressiveness scale, provisionally.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 205; d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation K02; Business & governance (CP-1A)

### Key findings
- Leakage is the decisive weakness because the bank restricted-payment test is a single leverage gate with no dollar cap. Any distribution is permitted with no default and pro forma covenant net leverage at or below 6.75x, and a dividend paid within 60 days of a permitted declaration remains permitted; the notes are looser still, allowing unlimited payments while fixed-charge coverage exceeds 2.00x. Fixed general baskets of USD 75 million cannot explain the USD 4,348 million recapitalisation, so the ratio route was almost certainly used, which means the provision is demonstrated rather than theoretical. On the issuer's own adjusted earnings, post-dividend net leverage is about 5.50x, leaving roughly 1.25x before the 6.75x gate on that proxy; covenant earnings are defined more broadly, so true capacity is likely larger but is not established.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, page 75; d826058dex41.htm.jsonl, pages 63–64; Business & governance (CP-1A); calculation K06; calculation K07
- Pari secured dilution is the nearest pressure point because first-lien debt can be added without lender consent up to 5.00x secured net leverage under the bank agreement and 5.25x under the 2033 notes, and the agent must enter pari or junior intercreditor arrangements on request. A secured-leverage proxy on issuer adjusted earnings after the October 2024 dividend is about 4.22x, roughly 0.78x below the bank gate; each turn of pari debt dilutes existing first-lien recovery directly.
Basis: d887611dex101.htm.jsonl, pages 59 and 205; d887611dex41.htm.jsonl, page 43; calculation K08; calculation K09
- Covenant earnings are built to expand capacity. Incurrence earnings add back acquisition, recapitalisation and refinancing costs, dividend equivalents, earn-outs and projected cost savings within 24 months capped at 25% of covenant earnings; the maintenance-covenant earnings carry the same projected savings with no cap and also add back incentive-bonus costs. Earnings quality already rejected USD 345 million of issuer add-backs as recurring, so every ratio basket is measured against a denominator above the earnings that recur.
Basis: d887611dex101.htm.jsonl, pages 23–24; d887611dex101.htm.jsonl, pages 41–42; Earnings quality (CP-1D)
- Maintenance protection is narrow and controlled by revolver lenders only. The 7.50x test, or 8.00x for four quarters after a material acquisition, can be amended by the required revolving lenders alone, and a breach becomes a term-loan default only once revolver lenders accelerate; year-end exposure of USD 67 million sat USD 297 million below the USD 364 million trigger.
Basis: d887611dex101.htm.jsonl, pages 188 and 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation K01; calculation K04
- Acquisition and investment capacity is effectively uncapped by leverage. Permitted acquisitions need only no default and USD 100 million of available liquidity; investments in restricted subsidiaries, including non-guarantor foreign subsidiaries, are unlimited; other investments are unlimited at 5.75x with no revolver loans and USD 200 million of unrestricted cash. The term-loan most-favoured-nation clause protects only 50 bp of yield, lapses after 18 months and excludes acquisition debt.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 144
- Uptier protection in the bank agreement is real but incomplete, and the notes are weaker. Changing pro-rata sharing, releasing a material guarantor or releasing all or substantially all collateral needs each affected lender, yet required lenders can open non-pro-rata prepayment offers made to a whole class, and no explicit consent right against lien subordination was found. For the 2033 notes, a majority, counting exchange-offer consents, can amend the security documents and intercreditor agreement; the each-holder right covers ranking changes that adversely affect holders.
Basis: d887611dex101.htm.jsonl, pages 204–207; d887611dex41.htm.jsonl, pages 115–117

### Contrary evidence and what would change the view
The strongest counterargument is that every expansion route is gated by a leverage or coverage test that the issuer has operated within while stating full compliance, that the secured gate at 5.00x caps first-lien layering below total leverage, and that the bank agreement reserves each-lender consent for sharing, material guarantor release and wholesale collateral release, which blocks the simplest uptier and collateral-stripping routes. Unrestricted-subsidiary designation is confined to newly acquired or formed subsidiaries, so existing operating companies cannot be designated out directly. These facts lower the probability of a coercive transaction but do not limit distributions within the gates, which the September recapitalisation shows management will use. The view would improve if the intercreditor agreement showed pro-rata enforcement with no release or standstill asymmetry against noteholders, if a lien-subordination sacred right or asset-transfer blocker were found elsewhere in the documents, or if a compliance certificate showed covenant earnings close to reported earnings. It would worsen if disclosed covenant leverage sat well below 6.75x, because that would mean larger permitted extraction, or if a further dividend were financed with pari secured debt.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, pages 59, 81 and 205; Business & governance (CP-1A)

### Limitations
- The first-lien intercreditor agreement and the guarantee and collateral agreement are referenced but not supplied, so the conclusion that bank lenders and secured noteholders share collateral equally rests on indenture and credit-agreement references; who directs enforcement, any first-lien standstill and any release asymmetry between classes are left open rather than judged benign.
Basis: d887611dex41.htm.jsonl, pages 30 and 132; d887611dex101.htm.jsonl, page 173
- No compliance certificate or covenant-earnings figure is available, so every ratio headroom except the revolver-usage trigger is stated as not established; the leverage proxies on issuer adjusted earnings are directional, and the ranking of pari secured dilution as the nearest pressure point could change if covenant earnings materially exceed the issuer measure.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; calculation K06; calculation K08
- Only one secured and one subordinated indenture were reviewed; the 2028 to 2032 secured series and the two 2029 subordinated series are treated as similar on the strength of the annual report's statement, so a weaker series-specific term would change the weakest-link leakage and lien conclusions.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61
- Basket usage history is absent, so fixed and grower basket capacity is stated only as the contractual floor; remaining capacity, and therefore the size of any non-ratio leakage, is not established.
- Clause review was targeted; the absence of an asset-transfer blocker, lien-subordination consent right or cross-default threshold in the pages read lowers confidence in the priming-exposure rating, which is therefore labelled theoretical rather than ruled out.

### Capital structure

| Instrument | Principal | Carrying value | Rank and security | Governing document reviewed | Source |
|---|---|---|---|---|---|
| Term loans I–L, TransDigm Inc. borrower | USD 8,702 million | USD 8,642 million | First lien, equal with secured notes | Yes: credit agreement as amended September 2024 | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 1 |
| Revolving credit facility | USD 910 million commitment; USD 843 million available after letters of credit | Not supplied: no drawn loan balance stated | First lien; sole holder of the springing covenant | Yes: same credit agreement | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 188 |
| Secured notes 2028 to 2033, six series | USD 11,000 million | USD 10,892 million | First lien, equal with credit facilities under first-lien intercreditor agreement | Partly: 2033 indenture only | Financial foundation (CP-1); d887611dex41.htm.jsonl, page 30 |
| 2027 senior subordinated notes | USD 2,650 million | USD 2,641 million | Unsecured; contractually subordinated with payment blockage | Yes: 2027 indenture | Financial foundation (CP-1); d826058dex41.htm.jsonl, page 107 |
| 2029 senior subordinated notes, two series | USD 1,950 million | USD 1,940 million | Unsecured; contractually subordinated | No: indentures not supplied | Financial foundation (CP-1) |
| Trade receivable securitization | USD 487 million | USD 486 million | Securitization entity debt; structurally senior on sold receivables | No: facility agreement not supplied | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Finance leases and government advances | Not supplied: lease principal not separately stated | USD 279 million | Legal rank not established | No | Financial foundation (CP-1) |
| Total carrying debt | Not applicable: mixed principal bases | USD 24,880 million | All classes | Not applicable | Financial foundation (CP-1); calculation K14 |

### Covenant tests and headroom

| Test | Document | Threshold | Position at 2024-09-30 | Creditor consequence | Source |
|---|---|---|---|---|---|
| Springing net leverage, revolver only | Credit agreement | 7.50x; 8.00x for four quarters after a material acquisition | Dormant; ratio not disclosed | No term-loan or note maintenance protection | d887611dex101.htm.jsonl, page 188 |
| Revolver exposure trigger | Credit agreement | 40% of commitments, USD 364 million | 7.36% upper bound, USD 67 million; USD 297 million below trigger | Covenant tests only if revolver use rises sharply | calculation K02; calculation K04 |
| Unlimited restricted payments | Credit agreement | Net leverage at or below 6.75x pro forma | Not disclosed; proxy about 5.50x on issuer adjusted earnings | Primary extraction gate | d887611dex101.htm.jsonl, page 181; calculation K06 |
| Pari first-lien debt | Credit agreement | Secured net leverage at or below 5.00x | Not disclosed; proxy about 4.22x | Nearest dilution gate | d887611dex101.htm.jsonl, page 59; calculation K08 |
| Junior-lien, unsecured and subordinated debt | Credit agreement | Net leverage at or below 7.25x | Not disclosed | Total releveraging ceiling | d887611dex101.htm.jsonl, pages 59–60 |
| Unlimited other investments | Credit agreement | Net leverage at or below 5.75x, no revolver loans, USD 200 million cash | Not disclosed | Opens drop-down capacity | d887611dex101.htm.jsonl, page 63 |
| Secured ratio-debt liens | 2033 indenture | Secured net leverage at or below 5.25x | Not disclosed | Looser than bank gate | d887611dex41.htm.jsonl, page 43 |
| Unlimited note restricted payments | 2033 and 2027 indentures | Fixed-charge coverage above 2.00x | Not disclosed | Notes alone barely restrain dividends | d887611dex41.htm.jsonl, page 75; d826058dex41.htm.jsonl, pages 63–64 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Springing consolidated net leverage, revolver lenders only | 7.50 | Not supplied: covenant ratio not disclosed and no compliance certificate supplied | Not supplied: tested ratio missing | Passes at or below | x | Credit agreement financial covenant; 8.00x for four quarters after a material acquisition; tested only when revolver exposure exceeds 40% of commitments |
| Revolver exposure trigger for the springing covenant | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Exposure derived as commitments less availability after letters of credit; upper bound because cash-collateralised letters of credit are excluded by the covenant |
| Ratio restricted-payment gate | 6.75 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio missing | Passes at or below | x | Incurrence-style condition tested pro forma at each payment; issuer-adjusted proxy is not the covenant quantity |
| Pari first-lien debt gate | 5.00 | Not supplied: covenant secured ratio not disclosed | Not supplied: tested ratio missing | Passes at or below | x | Consolidated secured net debt ratio, tested at incurrence; refinancing debt exempt |
| Junior and unsecured debt gate | 7.25 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio missing | Passes at or below | x | Also gates subordinated debt and incremental facilities with the 5.00x secured test |
| Unlimited investments gate | 5.75 | Not supplied: covenant ratio not disclosed | Not supplied: tested ratio missing | Passes at or below | x | Also requires no revolver loans and USD 200 million unrestricted cash |
| 2033 notes secured ratio-debt lien gate | 5.25 | Not supplied: covenant secured ratio not disclosed | Not supplied: tested ratio missing | Passes at or below | x | Indenture lien permission; other secured series not reviewed |
| Notes unlimited restricted-payment gate | 2.00 | Not supplied: fixed-charge coverage not disclosed | Not supplied: tested ratio missing | Passes above | x | Same structure in 2033 secured and 2027 subordinated indentures |

Only the revolver-usage trigger has a settled current value; every ratio test lacks a disclosed covenant figure, so the chart is not a compliance opinion and the issuer's stated compliance is the only evidence for the other rows.

### Nearest pressure point
The nearest pressure point is pari first-lien debt capacity under the bank agreement's 5.00x secured net leverage gate, because the springing maintenance covenant is dormant with wide usage headroom, while secured debt can be layered without lender consent. The bank agreement permits new senior secured debt sharing the existing lien when pro forma secured net leverage is at or below 5.00x and obliges the agent to document pari or junior intercreditor arrangements on request; the 2033 notes allow secured ratio debt up to 5.25x. Management could fund a further distribution or acquisition with pari secured debt, as it did with secured notes and an incremental term loan for the September recapitalisation, so each added dollar shares the same collateral pool. Existing first-lien recovery is diluted pro rata and subordinated noteholders fall further behind, while higher interest cost lifts default risk only modestly given the leverage gates. The signal to watch is new secured issuance or incremental term loans, especially if paired with a restricted payment. A compliance certificate with covenant earnings and secured debt would tighten this view; on the issuer-adjusted proxy the gap is about 0.78x.
Basis: d887611dex101.htm.jsonl, pages 59 and 205; d887611dex41.htm.jsonl, page 43; Business & governance (CP-1A); calculation K08; calculation K09

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package based on revolver-only springing maintenance protection, ratio-gated unlimited distributions and investments, pari secured incurrence to 5.00x, and covenant earnings that add back projected savings and transaction costs. The main creditor protections are each-lender consent over pro-rata sharing, material guarantor release and wholesale collateral release, restriction of unrestricted-subsidiary designation to new subsidiaries, and a 179 days cap on subordinated payment blockage; the main weaknesses are the leverage-only extraction gate, unlimited investment in non-guarantor restricted subsidiaries and majority-controlled note collateral amendments. The primary PD risk is releveraging through further debt-funded distributions; the primary LGD risk is pari secured dilution and the unexamined first-lien enforcement mechanics. For security selection, the most important legal consideration is that secured notes and term loans share collateral under an intercreditor agreement not in the source set, while subordinated notes sit behind all of it. Further analysis requires the intercreditor and collateral agreements, the remaining note indentures, compliance certificates and basket usage. Legal & covenants completed with limitations; covenant aggressiveness 4 on the five-point scale, provisional.
Basis: d887611dex101.htm.jsonl, pages 59, 61–63, 81, 181, 188 and 205; d887611dex41.htm.jsonl, pages 30 and 115–117; d826058dex41.htm.jsonl, page 107

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the indenture exhibit states no publication date | First Lien Intercreditor Agreement dated, later modified by joinders | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs lien sharing and enforcement among bank lenders and secured noteholders; agreement not supplied |
| 2024-03-22 | day | 2024-11-07 | Latest amendment affecting the bank restrictive covenants executed | Historical — Amendment No. 15, executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets the restrictive-covenant terms now in force and starts the 18 months MFN window for Tranches I and K |
| 2024-09-19 | day | Not supplied: the agreement exhibit states no publication date | Amendment and incremental Tranche L term loans of USD 1,500 million under the restated credit agreement | Historical — Amendment No. 17 and Incremental Term Loan Assumption Agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Pari first-lien incurrence used to fund the September recapitalisation; Tranche L MFN window runs from its effective date |
| 2024-09-30 | day | 2024-11-07 | Issuer states compliance with all debt covenants at fiscal year-end | Historical — in compliance with all of its debt covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Only compliance evidence available; no tested ratios disclosed |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Owns all capital stock | Ownership | TransDigm Inc. | Annual report via Business & governance; Delaware |
| TransDigm Group Incorporated | Guarantees bank debt as holdings | Guarantee | TransDigm Inc. | Credit agreement; NY law; Delaware holdings |
| Domestic subsidiary loan parties | Join and guarantee bank obligations | Guarantee | TransDigm Inc. | Credit agreement s.5.11; NY law; US entities |
| Domestic subsidiary loan parties | Grant first-lien collateral | Security | First-lien secured parties | Credit agreement s.5.11; NY law; US entities |
| Loan parties | Pledge 65% voting stock of foreign subs | Security | First-lien secured parties | Credit agreement s.5.11(b); NY law |
| TransDigm UK Holdings plc | Guarantees 2028 secured and sub notes | Guarantee | TransDigm Inc. | Annual report via Financial foundation; UK plc |
| Foreign subsidiary creditors | Claim first on foreign sub assets | Structural claim | Foreign restricted subsidiaries | Credit agreement debt basket 14; NY law; non-US |
| Securitization lenders | Claim first on sold receivables | Structural claim | Securitization entity | Credit agreement basket 18; annual report; US |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Credit facility lenders | Share first lien equally | Security rank | Secured noteholders | First Lien ICA 2019, not supplied; NY law |
| Senior debt incl. secured debt | Senior in right of payment | Payment rank | Senior subordinated notes | 2027 indenture subordination; US issuer |
| Designated senior debt agent | Blocks sub payments up to 179 days | Standstill | Senior subordinated notes | 2027 indenture s.10.03; US issuer |
| Applicable authorized representative | Acts for first-lien classes | Enforcement control | First-lien collateral | 2033 indenture art.12; ICA not supplied; NY law |
| Required revolving lenders | Accelerate on covenant breach first | Enforcement control | Term lenders | Credit agreement art.VII(l); NY law |
| Required lenders | Approve specific lien releases | Release | Credit agreement collateral | Credit agreement s.9.02(c)(iv); NY law |
| Each lender | Consent to release all collateral | Release | Credit agreement collateral | Credit agreement s.9.02(b)(G); NY law |
| Majority of 2033 noteholders | Amend security documents and ICA | Release | 2033 notes collateral | 2033 indenture s.9.02; NY law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 8 |
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
| MATERIAL | 4 |
| MINOR | 3 |

### Analytical appendix — complete canonical registers

### Evidence references

| Evidence ID | Provision or fact | Source |
|---|---|---|
| E01 | Section 6.14 springing financial covenant, 40% revolver trigger, 7.50x or 8.00x, required revolving lenders amend | d887611dex101.htm.jsonl, page 188 |
| E02 | Annual-report covenant description: no maintenance covenants other than revolver; trigger USD 364 million; compliance; securitization USD 650 million capacity, USD 487.5 million drawn | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| E03 | Section 6.02 restricted payments: definition, 60-day clause, management basket, general USD 75 million or 3.0% basket, unlimited at 6.75x | d887611dex101.htm.jsonl, pages 177–181 |
| E04 | Permitted Indebtedness clauses 12 to 18: pari secured 5.00x, junior 7.25x, general USD 250 million or 10.0%, foreign USD 450 million or 18.0%, subordinated 7.25x, securitization USD 725 million or 20.0% | d887611dex101.htm.jsonl, pages 59–61 |
| E05 | Permitted Investments: unlimited in restricted subsidiaries, USD 250 million or 10.0% in unrestricted subsidiaries, USD 500 million or 25.0% of Total Assets general, joint ventures USD 1,000 million or 40.0% at 7.00x, acquisitions with USD 100 million liquidity, unlimited at 5.75x | d887611dex101.htm.jsonl, pages 61–63 |
| E06 | Consolidated EBITDA definition for incurrence ratios, cost savings capped at 25.0% | d887611dex101.htm.jsonl, pages 23–24 |
| E07 | Financial Covenant Consolidated EBITDA, uncapped cost savings, incentive bonus add-back | d887611dex101.htm.jsonl, pages 41–42 |
| E08 | Consolidated Net Income exclusions; Consolidated Net Leverage Ratio, Consolidated Secured Net Debt Ratio | d887611dex101.htm.jsonl, pages 26–27 |
| E09 | Unrestricted Cash and Unrestricted Subsidiary definitions | d887611dex101.htm.jsonl, page 81 |
| E10 | Term-loan MFN 50 bp, 18 months sunset, acquisition and maturity carve-outs | d887611dex101.htm.jsonl, page 144 |
| E11 | Section 5.11 guarantor joinder, Excluded Subsidiaries, 65% foreign voting stock pledge, Rule 3-10 and 3-16 carve-out | d887611dex101.htm.jsonl, pages 173–174 |
| E12 | Section 9.02 amendment thresholds, sacred rights, non-pro-rata offer amendments, intercreditor authority, collateral releases | d887611dex101.htm.jsonl, pages 204–207 |
| E13 | Events of Default; Financial Covenant Event of Default cross-over to term lenders on revolver acceleration | d887611dex101.htm.jsonl, pages 188 and 191 |
| E14 | 2033 indenture Section 4.07 unlimited restricted payments above 2.0 fixed-charge coverage | d887611dex41.htm.jsonl, page 75 |
| E15 | 2033 indenture Permitted Liens: bank indebtedness, secured ratio debt at 5.25x; unrestricted-subsidiary investment grower 12.0% | d887611dex41.htm.jsonl, pages 39–40 and 43 |
| E16 | 2033 indenture Sections 9.01 and 9.02: majority amendments incl. security documents and ICA; each-holder rights | d887611dex41.htm.jsonl, pages 115–117 |
| E17 | 2033 indenture First Lien Intercreditor Agreement dated 2019-02-13; holders bound through Applicable Authorized Representative | d887611dex41.htm.jsonl, pages 30 and 132 |
| E18 | 2027 indenture unlimited restricted payments above 2.0 coverage; ratio debt above 2.0 coverage | d826058dex41.htm.jsonl, pages 63–64 and 67 |
| E19 | 2027 indenture payment blockage: 179 days, one period per 360 days, 181 days clear | d826058dex41.htm.jsonl, page 107 |
| E20 | Annual report: restrictive covenants, Amendment No. 15 on 2024-03-22, incremental 7.25x and 5.00x tests, notes covenants similar to credit agreement | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| E21 | Amendment No. 17 cover: borrower, holdings, Goldman Sachs Bank USA as administrative and collateral agent, Tranche L USD 1,500 million | d887611dex101.htm.jsonl, page 1 |
| E22 | Governing law: credit agreement New York; 2033 indenture New York; 2027 indenture clause located, state not visible in reviewed text | d887611dex101.htm.jsonl, page 222; d887611dex41.htm.jsonl, page 126; d826058dex41.htm.jsonl, page 123 |
| E23 | Debt instruments, revolver availability, EBITDA As Defined, October 2024 dividend pro forma net debt and cash | Financial foundation (CP-1) |
| E24 | September 2024 recapitalisation USD 4,348 million funded with USD 3,000 million secured debt and cash | Business & governance (CP-1A) |
| E25 | USD 345 million of issuer add-backs rejected as recurring | Earnings quality (CP-1D) |

### T4.1 Source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement as amended by Amendment No. 17 | Executed version, conformed annex | 1 | Schedules, exhibits and the Guarantee and Collateral Agreement not reviewed; post-September amendments not supplied | Completed with Limitations |
| 2033 secured notes indenture | Executed version | 1 | Other secured series not supplied; guarantee-release section not reviewed | Completed with Limitations |
| 2027 senior subordinated notes indenture | Executed | 1 | 2029 subordinated indentures not supplied; turnover clause not reviewed | Completed with Limitations |
| First Lien Intercreditor Agreement | Referenced only | 2 | [Insufficient Information] — ICA not in the source set | Completed with Limitations |
| Compliance certificates | Not supplied | 3 | [Insufficient Information] — no tested ratios or basket usage | Completed with Limitations |
| Annual report | Filed | Supporting financial input | Retrospective; published 2024-11-07 | Completed with Limitations |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as amended by Amendment No. 17 | Credit agreement | Base 2014-06-04; amendment 2024-09-19 | Executed version | Controls bank covenants, springing covenant, baskets, collateral, releases, amendments | Tightest leakage gates while outstanding; revolver-only maintenance test | E01; E03; E21 |
| 1 | 2033 senior secured notes indenture | Indenture | 2024-09-19 | Executed version | Controls 2033 notes covenants, liens, amendments | Looser restricted-payment and lien tests than bank document | E14; E15; E16 |
| 1 | 2027 senior subordinated notes indenture | Indenture | 2019-11-13 | Executed | Controls subordination, blockage, sub-note covenants | Defines junior standstill and leakage tests | E18; E19 |
| 2 | First Lien Intercreditor Agreement | Intercreditor agreement | 2019-02-13 with joinders | [Insufficient Information] — ICA not in the source set | Would control first-lien enforcement and release | Enforcement control unresolved | E17 |
| 3 | Compliance certificates | Covenant schedules | Not supplied | [Insufficient Information] — not supplied | Would control tested ratios and usage | Headroom not established | E02 |
| Supporting | Annual report on Form 10-K | Filing | 2024-11-07 | Filed | Summary of covenants and compliance; not controlling | Corroborates trigger and incremental tests | E02; E20 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x, 8.00x for four quarters after material acquisition, tested only when revolver exposure exceeds 40% | Credit agreement s.6.14 | Term lenders and notes have no early-warning test; revolver lenders alone can amend | Negative — Covenant Erosion | Not assessed: no comparative source | E01 |
| Ratio restricted payments | Unlimited if no default and net leverage at or below 6.75x pro forma; dividends payable within 60 days of permitted declaration | Credit agreement s.6.02 final paragraph and clause 1 | Cash can leave whenever leverage is under the gate | Negative — Leverage Increase | Not assessed: no comparative source | E03 |
| Notes restricted payments | Unlimited if no default and fixed-charge coverage above 2.00x | 2033 and 2027 indentures s.4.07 | Notes add no meaningful restraint beyond bank gate | Negative — Leverage Increase | Not assessed: no comparative source | E14; E18 |
| Pari secured debt | Senior secured debt with same lien priority at secured net leverage at or below 5.00x | Credit agreement Permitted Indebtedness clause 12 | Dilutes existing first-lien collateral | Negative — Leverage Increase | Not assessed: no comparative source | E04 |
| Junior and unsecured debt | Junior-lien, unsecured and subordinated debt at net leverage at or below 7.25x | Credit agreement Permitted Indebtedness clauses 12 and 17 | Total releveraging ceiling | Negative — Leverage Increase | Not assessed: no comparative source | E04 |
| General and foreign debt baskets | Greater of USD 250 million and 10.0% of Consolidated EBITDA; foreign subsidiaries greater of USD 450 million and 18.0% | Credit agreement clauses 13 and 14 | Foreign basket structurally primes group creditors at foreign subsidiaries | Negative — Leverage Increase | Not assessed: no comparative source | E04 |
| Securitization | Non-recourse securitization debt up to greater of USD 725 million and 20.0% | Credit agreement clause 18 | Receivables leave collateral pool | Negative — Liquidity Deterioration | Not assessed: no comparative source | E04; E02 |
| Investments | Unlimited in restricted subsidiaries; USD 250 million or 10.0% in unrestricted subsidiaries; USD 500 million or 25.0% of Total Assets general; unlimited at 5.75x | Credit agreement Permitted Investments | Value can move to non-guarantors and unrestricted subsidiaries | Negative — Covenant Erosion | Not assessed: no comparative source | E05 |
| Acquisitions | Permitted acquisitions need no default and USD 100 million liquidity; no leverage test | Credit agreement Permitted Investments clause 18 | Debt-funded acquisitions not leverage-gated beyond debt tests | Negative — Leverage Increase | Not assessed: no comparative source | E05 |
| MFN | 50 bp yield protection, lapses after 18 months, excludes acquisition debt and later-maturing debt | Credit agreement s.2.24 proviso | Weak economics protection for existing term lenders | Negative — Refinancing Risk | Not assessed: no comparative source | E10 |
| EBITDA definitions | Incurrence EBITDA adds transaction costs and projected savings capped at 25%; maintenance EBITDA uncapped savings and bonus costs | Credit agreement definitions | Inflates every ratio and grower basket | Negative — Covenant Erosion | Not assessed: no comparative source | E06; E07 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries may be designated; must comply with s.6.02 and s.6.16; no recourse debt | Credit agreement definition | Limits direct designation of existing operating companies | Neutral — Stable | Not assessed: no comparative source | E09 |
| Guarantors and collateral | Domestic non-excluded subsidiaries join; 100% domestic and 65% foreign voting stock pledged | Credit agreement s.5.11 | Foreign value only reachable through limited equity pledge | Negative — Covenant Erosion | Not assessed: no comparative source | E11 |
| Amendments | Required lenders generally; each lender for sharing, material guarantor and all-collateral releases; agent may add pari intercreditor arrangements | Credit agreement s.9.02 | Uptier partly blocked; dilution enabled | Neutral — Stable | Not assessed: no comparative source | E12 |
| Notes amendments | Majority, including exchange-offer consents, can amend indenture, security documents and ICA; each-holder rights cover payment terms and adverse ranking changes | 2033 indenture s.9.02 | Collateral terms change at majority | Negative — Covenant Erosion | Not assessed: no comparative source | E16 |
| Events of Default | Financial-covenant breach is a term-loan default only after revolver acceleration | Credit agreement art.VII(l) | Delays cross-class acceleration | Neutral — Stable | Not assessed: no comparative source | E13 |
| Subordination standstill | Payment blockage up to 179 days, one per 360 days | 2027 indenture s.10.03 | Junior cash interrupted during senior non-payment default | Neutral — Stable | Not assessed: no comparative source | E19 |

### Step 4 to Step 8 provision findings

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Consolidated EBITDA | Credit agreement, executed, rank 1 | Adds acquisition, recapitalisation and debt costs, dividend equivalents, earn-outs, start-up costs, projected savings within 24 months capped at 25% | Raises denominator of every incurrence and restricted-payment ratio | Moderate: permits releveraging before reported leverage shows it | Moderate: larger pari capacity | Compare covenant EBITDA with issuer EBITDA As Defined when certificates appear | Negative — Covenant Erosion | High | E06 |
| Financial Covenant Consolidated EBITDA | Credit agreement, rank 1 | Same add-backs plus incentive-bonus costs; projected savings uncapped | Makes springing test even harder to trip | Low: test rarely bites | Low | Track revolver exposure against 40% | Negative — Covenant Erosion | High | E07 |
| Net leverage definitions | Credit agreement, rank 1 | Net of Unrestricted Cash of holdings, borrower and restricted subsidiaries; Consolidated Total Indebtedness definition not reviewed | Cash netting lets pre-funded cash raise capacity | Moderate | Low | Watch cash build before distributions | Negative — Covenant Erosion | Medium | E08; E09 |
| Pari secured incurrence | Credit agreement and 2033 indenture, rank 1 | 5.00x bank, 5.25x notes; refinancing debt exempt | Dilutes first lien | Low to moderate | High for first-lien classes | Track secured issuance | Negative — Leverage Increase | High | E04; E15 |
| Ratio restricted payments | Credit agreement and indentures, rank 1 | 6.75x bank gate; 2.00x coverage note gate | Debt-funded distributions | High: demonstrated | Moderate: cash leaves group | Track declarations and pro forma leverage | Negative — Leverage Increase | High | E03; E14; E18; E24 |
| Investments in non-guarantor restricted subsidiaries | Credit agreement, rank 1 | Unlimited | Assets can move out of collateral without a basket | Low | High if used | Watch guarantor-summary share of assets | Negative — Covenant Erosion | Medium | E05; E11 |
| Collateral release | Credit agreement s.9.02(c), rank 1 | Automatic on permitted sale to non-loan party; Required Lenders for specific releases | Collateral shrinks with permitted transfers | Low | Moderate | Monitor asset sales and guarantor releases | Negative — Covenant Erosion | High | E12 |
| Amendment control | Credit agreement and 2033 indenture, rank 1 | Each-lender sacred rights in bank deal; majority for note collateral | Notes more exposed to consent-driven collateral change | Low | Moderate | Watch exchange or consent solicitations | Neutral — Stable | Medium | E12; E16 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Restricted payments | Unlimited at 6.75x bank, above 2.00x coverage notes; USD 4,348 million September recapitalisation | Debt-funded extraction | Raises PD through higher leverage and interest | Moderate: cash leaves before creditors can act | Track declarations, pro forma leverage, cash build | E03; E14; E24 |
| Pari secured debt | 5.00x bank, 5.25x notes | Layering on shared collateral | Modest PD effect | High for existing first-lien classes | Track secured issuance and incremental loans | E04; E15 |
| Maintenance covenant | Springing 7.50x at 40% usage | No early-warning trigger for most creditors | Defaults arrive late as payment or cross defaults | Higher LGD from later intervention | Revolver usage each quarter | E01; E02 |
| Covenant EBITDA | Projected savings and transaction add-backs | Inflated denominators | Delays covenant pressure | Larger permitted debt stack before default | Covenant versus reported EBITDA | E06; E07; E25 |
| Investments and unrestricted subsidiaries | Unlimited in restricted subsidiaries; capped and ratio routes to unrestricted subsidiaries | Value migration from guarantors | Limited PD effect | Higher LGD if guarantor value falls | Guarantor share of assets, designations | E05; E09 |
| Subordination | 179 days blockage cap | Junior holders stand still during senior defaults | Sub notes default earlier in cash terms | Sub notes rank behind all senior debt | Blockage notices | E19 |
| Intercreditor | First-lien ICA referenced, not supplied | Enforcement control unknown | Not established | Not established | Obtain ICA | E17 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions in T4.3 | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed: no comparative source supplied | Not applicable: no third-party assessment to compare | Insufficient Information | E20 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x at 40% usage; revolver lenders alone amend | No early-warning test for term loans or notes | Negative — Covenant Erosion | Provisional | E01; E02 |
| Debt / lien incurrence capacity | 4 | Pari secured 5.00x and 5.25x; junior 7.25x; general, foreign and securitization grower baskets; weak MFN | Large releveraging and dilution capacity | Negative — Leverage Increase | Provisional | E04; E10; E15 |
| RP / investment / leakage capacity | 4 | Unlimited distributions at 6.75x; notes at 2.00x coverage; unlimited restricted-subsidiary investments; demonstrated use | Repeatable debt-funded extraction | Negative — Leverage Increase | Provisional | E03; E05; E14; E24 |
| EBITDA definitions and add-back flexibility | 4 | Projected savings 24 months, capped at 25% for incurrence, uncapped for maintenance; transaction add-backs | Denominator inflation | Negative — Covenant Erosion | Completed | E06; E07 |
| Collateral / guarantor protection | 3 | Domestic guarantors; 65% foreign voting pledge; automatic release on permitted sale; each-lender all-collateral release | Foreign value outside guarantee reach | Negative — Covenant Erosion | Provisional | E11; E12 |
| Amendment / control mechanics | 3 | Each-lender sharing and release rights; class-wide non-pro-rata offers by required lenders; note collateral by majority | Partial uptier protection, weaker for notes | Neutral — Stable | Provisional | E12; E16 |
| Overall | 4 | Weighted to leakage and incurrence areas; six areas scorable | Aggressive package, ratio-gated | Negative — Leverage Increase | Provisional | E01; E03; E04; E06 |

Covenant aggressiveness score 4 of 5, Aggressive; status Provisional because the intercreditor and collateral agreements and compliance inputs are missing.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further debt-funded special dividend | Ratio RP gate 6.75x | Repeats September pattern | PD up; RV adverse for all classes | Board declarations, pro forma leverage disclosure | E03; E24 |
| New pari secured issuance | 5.00x and 5.25x secured gates | Dilutes first-lien collateral | LGD up for first lien; RV favours shorter secured paper | Secured issuance, incremental joinders | E04; E15 |
| Assets moved to non-guarantor subsidiaries | Unlimited restricted-subsidiary investments | Strips guarantor value without basket use | LGD up | Guarantor-summary asset share each year | E05; E11 |
| Note consent solicitation | Majority can amend security documents and ICA | Collateral terms change without each holder | LGD up for notes | Consent and exchange offers | E16 |
| Revolver exposure above 40% | Springing covenant trigger | Only maintenance test activates | PD signal | Quarterly revolver usage | E01 |
| Cost-savings add-backs growing | Projected savings in covenant EBITDA | Capacity inflation | PD and LGD up | Covenant EBITDA bridge | E06; E07 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| L1 | First Lien Intercreditor Agreement dated 2019-02-13 and joinders | Controls enforcement, standstill and release among first-lien classes | T4F.2 to T4F.5 and intercreditor map partly unresolved | Obtain executed ICA |
| L2 | Guarantee and Collateral Agreement and schedules | Defines collateral, excluded assets, perfection | T4D.4 partial | Obtain executed agreement and schedules |
| L3 | Compliance certificates and covenant EBITDA | Tested ratios unknown | All ratio headroom not established | Obtain latest certificate |
| L4 | 2028 to 2032 secured and 2029 subordinated indentures | Series terms may differ | Weakest-link analysis extrapolated | Obtain indentures |
| L5 | Basket usage history | Remaining fixed and grower capacity unknown | T4C.5 floors only | Obtain usage tracker |
| L6 | Cross-default threshold, equity cure, asset-transfer blocker and lien-subordination consent searches beyond pages read | Priming and default mechanics incomplete | T4D.7 theoretical; T4.3 partial | Full clause review |
| L7 | Consolidated Total Indebtedness and Fixed Charge Coverage Ratio full definitions | Numerators and coverage denominators | T4C.3 partial | Read definitions |

### T4D.1 Structural source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement s.5.11 guarantor and pledge requirements | Executed version | 1 | Schedules of existing loan parties not reviewed | Completed with Limitations |
| Annual report guarantor descriptions via Financial foundation | Filed | Supporting | Accounting summary, not a legal perimeter | Completed with Limitations |
| Guarantee and Collateral Agreement | Referenced only | 1 | [Insufficient Information] — security document not in the source set | Completed with Limitations |
| Subsidiary list | Not supplied | Supporting | [Insufficient Information] — subsidiary list and org chart not in the source set | Completed with Limitations |
| Subsequent perimeter events | None identified in reviewed sources | Not applicable | No post-2024-09-30 guarantee release or designation found; scan limited to supplied sources | Completed with Limitations |

### T4D.2 Entity perimeter register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware | Public shareholders | Not a subsidiary; outside designation regime | — undisclosed at entity level; gap D1 | Yes, guarantor | E21; E23 |
| TransDigm Inc. | Borrower and notes issuer | Delaware | TransDigm Group Incorporated | Restricted; borrower | — undisclosed at entity level; gap D1 | Yes | E21; E23 |
| Domestic subsidiary loan parties | Guarantors and grantors | United States | TransDigm Inc. | Restricted; existing subsidiaries cannot be designated unrestricted | — guarantor summary values not extracted; gap D1 | Yes | E11; E09 |
| TransDigm UK Holdings plc | Guarantor of 2028 secured and subordinated notes | United Kingdom | Not established in reviewed sources | Restricted | — undisclosed; gap D1 | Yes for named notes; bank status not established | E23 |
| Foreign restricted subsidiaries other than TransDigm UK | Non-guarantors | Various non-US | Not established | Restricted; 65% voting stock pledged | — undisclosed; gap D1 | No guarantee; equity partly pledged | E11; E23 |
| Immaterial domestic subsidiaries | Excluded Subsidiaries | United States | Not established | Restricted; excluded from joinder | — undisclosed; gap D1 | No | E11 |
| Securitization entity | Excluded Subsidiary; securitization borrower | United States | Not established | Securitization Entity | USD 487 million funded at 2024-09-30 | No | E02; E04 |
| Unrestricted subsidiaries | None identified | Not applicable | Not applicable | New subsidiaries designable subject to s.6.02 and s.6.16 | — none identified; gap D2 | No | E09 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities | Senior secured holdings guarantee | Downstream | Material guarantor release needs each lender | E12; E21 |
| Domestic subsidiary loan parties × credit facilities | Senior secured guarantee | Upstream and cross-stream | Release on permitted disposal to non-loan party; each lender for material guarantor otherwise | E11; E12 |
| TransDigm Group Incorporated and qualifying restricted subsidiaries × 2033 secured notes | Senior secured guarantee | Downstream and upstream | [Insufficient Information] — indenture guarantee-release section not reviewed | E15; E23 |
| TransDigm Group Incorporated, TransDigm UK and domestic restricted subsidiaries × 2027 subordinated notes | Senior subordinated guarantee subject to blockage | Downstream and upstream | [Insufficient Information] — indenture guarantee-release section not reviewed | E19; E23 |
| Foreign restricted subsidiaries × all tranches | None | Not applicable | Not applicable: non-guarantors | E11; E23 |

### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Loan parties × first lien | Excluded Subsidiaries, 35% voting stock of foreign subsidiaries, equity triggering Rule 3-10 or 3-16 statements, unrestricted-subsidiary equity | Automatic on permitted sale, guarantor release, Required Lenders approval; all collateral needs each lender | Mortgage and control-agreement suspension periods release perfection | E11; E12 |
| Loan parties × second lien | — no second-lien debt identified; junior liens permitted at 7.25x | Not applicable | Not applicable | E04 |
| Foreign restricted subsidiaries × first lien | Own assets unpledged; only 65% voting stock held by loan parties pledged | Foreign security documents amendable by agent alone for local-law reasons | Local-law limits not established | E11; E12 |
| Securitization entity × first lien | Sold receivables outside collateral | Not applicable | Not applicable | E04; E02 |
| Unrestricted subsidiaries × first lien | Equity excluded from pledge | Designation removes from group | Not applicable | E11; E09 |

### T4D.5 Structural priority

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with holdings and domestic guarantors | Domestic guarantor collateral plus 65% foreign voting stock | Pari | Foreign subsidiary assets and sold receivables | Shares collateral with secured notes; foreign value only via equity | Medium | E11; E17 |
| Secured notes 2028 to 2033 | TransDigm Inc. with guarantors | Same collateral under ICA | Pari | Same as term loans | Equal economic rank; enforcement control not established | Low | E15; E17 |
| Senior subordinated notes | TransDigm Inc. with subordinated guarantors | Unsecured residual after all senior debt | Contractually Subordinated | All collateral value plus foreign subsidiary assets | Behind all senior and structurally senior claims | Medium | E19 |
| Securitization debt | Securitization entity | Sold domestic receivables | Structurally Senior | Not applicable | Ahead of group creditors on receivables | Medium | E02; E04 |
| Foreign subsidiary debt | Foreign restricted subsidiaries | Foreign subsidiary assets | Structurally Senior | Not applicable | Capacity greater of USD 450 million and 18.0% | Medium | E04 |

### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Distribution to shareholders | TransDigm Inc. to holdings to shareholders | T4.3 ratio restricted payments | Unlimited within 6.75x gate | 4 | Cash and debt capacity leave group | Demonstrated: USD 4,348 million September recapitalisation | E03; E24 |
| Investment in non-guarantor restricted subsidiary | Loan parties to foreign restricted subsidiaries | T4.3 investments | Unlimited | 4 | Assets leave guarantee and lien reach | Theoretical | E05; E11 |
| Investment in new unrestricted subsidiary | Loan parties to newly formed subsidiary | T4.3 investments; unrestricted-subsidiary definition | At least USD 250 million plus USD 500 million general floor; unlimited at 5.75x | 4 | Value fully outside group | Theoretical | E05; E09 |
| Joint ventures | Loan parties to joint ventures | T4.3 investments | At least USD 1,000 million at 7.00x | 3 | Value outside guarantee reach | Theoretical | E05 |
| Asset sale out of group | Loan parties to third party | Section 6.03; collateral auto-release | Fair-value consideration required | 3 | Collateral replaced by proceeds subject to application rules not reviewed | Theoretical | E12 |
| Receivables securitization | Loan parties to securitization entity | Permitted Indebtedness clause 18 | At least USD 725 million | 2 | Receivables primed | Demonstrated: USD 487 million funded | E04; E02 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier via non-pro-rata exchange | Section 9.02 non-pro-rata offers to a whole class; no explicit lien-subordination consent found | Term lenders | Theoretical | Sharing change needs each lender, limiting classic uptier | Low | E12 |
| Note collateral amendment by majority | 2033 indenture s.9.02 | Secured noteholders | Theoretical | Majority could alter security documents and ICA | Medium | E16 |
| Trapdoor through non-guarantor restricted subsidiaries | Unlimited restricted-subsidiary investments | All first-lien classes | Theoretical | Value could support structurally senior foreign debt | Medium | E05; E04 |
| Pari dilution | Pari secured gates 5.00x and 5.25x | Existing first-lien classes | Demonstrated: September secured financing | Equal-rank dilution, not priming | High | E04; E15; E24 |

### T4D.8 Structural gaps

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| D1 | Entity-level assets, EBITDA and debt; guarantor summary values | Ranks reachable value | T4D.2 and T4D.5 qualitative | Extract guarantor summary and subsidiary data |
| D2 | Subsidiary list and organisational chart | Perimeter completeness | Unrestricted subsidiaries none identified, not confirmed | Obtain subsidiary list |
| D3 | Guarantee and Collateral Agreement | Collateral scope and release | T4D.4 partial | Obtain document |
| D4 | Indenture guarantee-release provisions | Note guarantee durability | T4D.3 release cells open | Read release sections |

### T4F.1 Controlling intercreditor documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement as amended | TransDigm Inc., TransDigm Group Incorporated, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2014-06-04; amended 2024-09-19 | New York | Executed version | d887611dex101.htm.jsonl, pages 1 and 222 | E21; E22 |
| 2033 secured notes indenture | TransDigm Inc., holdings, guarantors, trustee and notes collateral agents | 2024-09-19 | New York | Executed version | d887611dex41.htm.jsonl, page 126 | E22 |
| 2027 subordinated notes indenture | TransDigm Inc., guarantors, trustee | 2019-11-13 | Not established: clause located, state not visible | Executed | d826058dex41.htm.jsonl, page 123 | E22 |
| First Lien Intercreditor Agreement | [Insufficient Information] — ICA not in the source set | 2019-02-13 | [Insufficient Information] — ICA not in the source set | Referenced only | d887611dex41.htm.jsonl, page 30 | E17 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien | Shared collateral | Required revolving lenders control springing-covenant acceleration | Required revolving lenders for covenant; required lenders otherwise | E01; E13 |
| Term lenders | First lien | Shared collateral | Through agent at required lenders; covenant default only after revolver acceleration | Required lenders definition not reviewed | E12; E13 |
| Secured noteholders | First lien | Shared collateral via ICA | [Insufficient Information] — ICA not in the source set | Majority per series under indenture | E16; E17 |
| Senior subordinated noteholders | Contractually subordinated | Unsecured | Subject to 179 days payment blockage | Majority per indenture, not reviewed in full | E19 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Subordinated payment blockage | 179 days; one per 360 days; 181 days clear | Blockage notice for non-payment default on designated senior debt | Designated senior debt representative | Subordinated noteholders | Junior cash stops during senior default | Negative — Liquidity Deterioration | E19 |
| Financial-covenant default crossover | Until revolver acceleration | Springing covenant breach | Required revolving lenders | Term lenders | Term lenders cannot act on covenant breach alone | Neutral — Stable | E13 |
| First-lien enforcement | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Applicable Authorized Representative; identity not established | Secured noteholders and bank lenders | Holders bound by ICA representative | Insufficient Information | E17 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement collateral | Not applicable: pari sharing via ICA | Automatic on permitted sale; Required Lenders for specific liens; each lender for all collateral | [Insufficient Information] — ICA not in the source set | Sale must comply with agreement | Each-lender protection for wholesale release | E12 |
| 2033 notes collateral | [Insufficient Information] — ICA not in the source set | Release as permitted without consent; majority for document amendments | [Insufficient Information] — ICA not in the source set | Indenture and ICA terms | Ranking sacred right | E16 |
| Subordinated notes | [Insufficient Information] — turnover clause not reviewed | Not applicable: unsecured | Not applicable | Subordination article | Blockage capped at 179 days | E19 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders and revolver | Agent-led enforcement on shared collateral | Share control with noteholders on terms not established | Moderate | Pari dilution and unknown ICA voting | Negative — Covenant Erosion | E12; E17 |
| Secured noteholders | Bound through ICA representative | Likely minority voice if bank debt controls; not established | High | Enforcement timing set by others | Insufficient Information | E17 |
| Subordinated noteholders | Paid after senior debt | Blockage and contractual subordination | High | Recovery depends on residual after all senior claims | Negative — Refinancing Risk | E19 |

### T4F.6 Intercreditor gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| F1 | First Lien Intercreditor Agreement and joinders | Controlling enforcement, standstill, turnover and purchase options | T4F.2 to T4F.5 unresolved cells | Obtain executed ICA |
| F2 | Required Lenders definition and note voting by series | Voting weight | T4F.2 partial | Read definitions |
| F3 | Subordination turnover clause | Junior turnover mechanics | T4F.4 open | Read subordination article |

### T4C.2 Capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended | Credit agreement | 2024-09-19 | Executed version | Legal formula | Tightest gates | E03; E04; E05 |
| 1 | 2033 and 2027 indentures | Indentures | 2024-09-19; 2019-11-13 | Executed | Legal formula | Note gates | E14; E15; E18 |
| 3 | Compliance certificates | Covenant schedules | Not supplied | [Insufficient Information] — not supplied | Usage and tested ratios | Headroom not established | E02 |
| Supporting | Financial foundation | Financial input | FY2024 | Accepted analysis | Financial input, non-legal proxies only | Proxies only | E23 |
| Supporting | Annual report | Filing | 2024-11-07 | Filed | Financial input and compliance statement | Trigger amount | E02 |

### T4C.3 Definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over four-quarter Consolidated EBITDA, pro forma | Covenant debt, unrestricted cash, Consolidated EBITDA | Gates RP 6.75x, junior debt 7.25x, investments 5.75x and 7.00x | Cash netting and broad EBITDA raise capacity | Negative — Covenant Erosion | E08 |
| Consolidated Secured Net Debt Ratio | Credit agreement and 2033 indenture definitions | Secured debt less Unrestricted Cash over Consolidated EBITDA | Secured debt, cash, EBITDA | Gates pari debt 5.00x and 5.25x | Same inflation | Negative — Leverage Increase | E08; E15 |
| Consolidated EBITDA | Credit agreement definition | Net income plus taxes, interest, non-cash charges, unusual and transaction costs, earn-outs, dividend equivalents, projected savings capped at 25% | Covenant bridge | Raises every ratio and grower basket | Denominator inflation | Negative — Covenant Erosion | E06 |
| Financial Covenant Consolidated EBITDA | Credit agreement definition | As above plus incentive bonus costs; projected savings uncapped | Covenant bridge | Springing test rarely bites | Maintenance erosion | Negative — Covenant Erosion | E07 |
| Unrestricted Cash | Credit agreement definition | Unencumbered cash of holdings, borrower and restricted subsidiaries; bank liens allowed | Cash by entity | Pre-funded cash lifts capacity | Netting | Neutral — Stable | E09 |
| Consolidated Fixed Charge Coverage Ratio | 2027 and 2033 indentures | Consolidated EBITDA over fixed charges; full definition not reviewed | EBITDA, fixed charges | Unlimited RP and ratio debt above 2.00x | Weak note restraint | Negative — Leverage Increase | E18; E14 |
| Covenant debt versus carrying debt | Consolidated Total Indebtedness not reviewed | Definition conflict not resolvable; Financial foundation carrying debt USD 24,880 million | Definition text | Numerator basis unknown | Possible divergence from carrying value | Insufficient Information | E23 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Springing consolidated net leverage | max-ratio | 7.50x | Not supplied: covenant ratio not disclosed | Threshold less tested ratio | [Insufficient Information] — missing: current tested Consolidated Net Leverage Ratio | Not Calculable | Dormant while exposure at or below 40%; 8.00x after material acquisition | Late early warning | Negative — Covenant Erosion | E01 |
| Revolver exposure trigger | max-ratio | 40.00% | 7.36% | Threshold less exposure over USD 910 million commitments | 32.64% | Compliant | Exposure is commitments less availability after letters of credit; upper bound | Covenant activates only on heavy revolver use | Neutral — Stable | E01; E23 |
| Ratio restricted-payment gate | max-ratio | 6.75x | Not supplied: covenant ratio not disclosed | Threshold less pro forma ratio | [Insufficient Information] — missing: current tested Consolidated Net Leverage Ratio | Not Calculable | Proxy 5.50x on issuer adjusted EBITDA is not covenant basis | Extraction capacity | Negative — Leverage Increase | E03 |
| Pari first-lien debt gate | max-ratio | 5.00x | Not supplied: covenant secured ratio not disclosed | Threshold less pro forma secured ratio | [Insufficient Information] — missing: current tested Consolidated Secured Net Debt Ratio | Not Calculable | Proxy 4.22x not covenant basis | Dilution capacity | Negative — Leverage Increase | E04 |
| Junior and unsecured debt gate | max-ratio | 7.25x | Not supplied: covenant ratio not disclosed | Threshold less pro forma ratio | [Insufficient Information] — missing: current tested Consolidated Net Leverage Ratio | Not Calculable | Also incremental facility test | Releveraging ceiling | Negative — Leverage Increase | E04; E20 |
| Unlimited investments gate | max-ratio | 5.75x | Not supplied: covenant ratio not disclosed | Threshold less pro forma ratio | [Insufficient Information] — missing: current tested Consolidated Net Leverage Ratio | Not Calculable | Also no revolver loans and USD 200 million cash | Drop-down capacity | Negative — Covenant Erosion | E05 |
| 2033 notes secured ratio-debt liens | max-ratio | 5.25x | Not supplied: covenant secured ratio not disclosed | Threshold less pro forma secured ratio | [Insufficient Information] — missing: current tested Consolidated Secured Net Debt Ratio | Not Calculable | Other secured series not reviewed | Looser note lien gate | Negative — Leverage Increase | E15 |
| Notes unlimited restricted payments | min-ratio | 2.00x | Not supplied: fixed-charge coverage not disclosed | Tested ratio less threshold | [Insufficient Information] — missing: current Consolidated Fixed Charge Coverage Ratio | Not Calculable | Both reviewed indentures | Weak note restraint | Negative — Leverage Increase | E14; E18 |
| Subordinated notes ratio debt | min-ratio | 2.00x | Not supplied: fixed-charge coverage not disclosed | Tested ratio less threshold | [Insufficient Information] — missing: current Consolidated Fixed Charge Coverage Ratio | Not Calculable | 2027 indenture only | Debt capacity under notes | Negative — Leverage Increase | E18 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Restricted payment capacity | Ratio RP | Ratio Basket: unlimited at 6.75x | No default | Covenant ratio not disclosed | Demonstrated: USD 4,348 million recapitalisation | Unlimited within gate | [Insufficient Information] — tested ratio missing | Formula Extracted Only | High | Debt-funded distributions | Negative — Leverage Increase | E03; E24 |
| Restricted payment capacity | General RP | General Basket: greater of USD 75 million and 3.0% of Consolidated EBITDA | No default | Covenant EBITDA not disclosed | [Insufficient Information] — usage tracker not supplied | At least USD 75 million | [Insufficient Information] — usage not supplied | Formula Extracted Only | Low | Small leakage | Neutral — Stable | E03 |
| Debt incurrence capacity | Pari secured | Ratio Basket: 5.00x secured | Refinancing exempt | Not disclosed | [Insufficient Information] — usage not applicable to ratio basket | Unlimited within gate | [Insufficient Information] — tested ratio missing | Formula Extracted Only | High | Collateral dilution | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | General debt | Grower Basket: greater of USD 250 million and 10.0% | Borrower and guarantors | Not disclosed | [Insufficient Information] — usage not supplied | At least USD 250 million | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Additional debt | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Foreign subsidiary debt | Grower Basket: greater of USD 450 million and 18.0% | Foreign restricted subsidiaries | Not disclosed | [Insufficient Information] — usage not supplied | At least USD 450 million | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E04 |
| Debt incurrence capacity | Securitization | Grower Basket: greater of USD 725 million and 20.0% | Non-recourse | USD 487 million funded | USD 487 million funded at 2024-09-30 | At least USD 725 million | At least USD 238 million on fixed floor | Ready with Limitations | Low | Receivables leave collateral | Negative — Liquidity Deterioration | E04; E02 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries | Grower Basket: greater of USD 250 million and 10.0% | New subsidiaries only | Not disclosed | [Insufficient Information] — usage not supplied | At least USD 250 million | [Insufficient Information] — usage not supplied | Formula Extracted Only | Moderate | Value outside group | Negative — Covenant Erosion | E05; E09 |
| Investment capacity | General investments | Grower Basket: greater of USD 500 million and 25.0% of Total Assets | None beyond basket | Total Assets definition not reviewed | [Insufficient Information] — usage not supplied | At least USD 500 million | [Insufficient Information] — usage not supplied | Formula Extracted Only | High | Can combine with unrestricted-subsidiary route | Negative — Covenant Erosion | E05 |
| Investment capacity | Ratio investments | Ratio Basket: unlimited at 5.75x | No revolver loans; USD 200 million cash | Not disclosed | [Insufficient Information] — ratio basket | Unlimited within gate | [Insufficient Information] — tested ratio missing | Formula Extracted Only | High | Unlimited drop-down | Negative — Covenant Erosion | E05 |
| Asset transfer capacity | Investments in restricted subsidiaries | Unlimited | None | Not applicable | [Insufficient Information] — transfers not disclosed | Unlimited | Unlimited | Ready with Limitations | High | Assets to non-guarantors | Negative — Covenant Erosion | E05 |
| MFN protection | Term-loan MFN | 50 bp, 18 months, carve-outs | Pari term loans only | Effective dates of later amendments not established | Not applicable | Protection limited | Lapses relative to effective dates | Ready with Limitations | Moderate | Repricing risk | Negative — Refinancing Risk | E10 |
| Guarantor / collateral release capacity | Section 9.02 releases | Automatic on permitted sale; Required Lenders specific; each lender all | Compliance with agreement | Not applicable | Not applicable | Partial releases by Required Lenders | Not applicable | Ready with Limitations | Moderate | Collateral shrinkage | Negative — Covenant Erosion | E12 |

The fixed and grower baskets above are not summed: the credit agreement lets the borrower classify and divide debt across categories, so the routes overlap and independent use is not established.

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari first-lien debt | Unlimited at 5.00x bank, 5.25x notes | Formula Extracted Only; proxy 4.22x | Equal-rank dilution of collateral | Modest | High for first lien | Favours shorter first-lien maturities | E04; E15 |
| Junior and unsecured debt | Unlimited at 7.25x | Formula Extracted Only | Layering above subordinated notes | Raises PD | Hurts subordinated notes most | Subordinated notes weakest | E04 |
| Foreign subsidiary debt | At least USD 450 million | Formula Extracted Only | Structural priming at foreign subsidiaries | Low | Moderate | Neutral across first-lien classes | E04 |
| MFN weakness | 50 bp with 18 months sunset and acquisition carve-out | Ready with Limitations | Cheaper incremental pari debt without repricing | Low | Low | Older term tranches exposed | E10 |
| Agent intercreditor authority | Agent must document pari or junior intercreditor on request | Ready with Limitations | No consent for new pari classes | Low | Moderate | Notes and loans share dilution | E12 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Debt-funded dividends | USD 4,348 million September recapitalisation, USD 3,000 million new secured debt | Ratio RP 6.75x; notes 2.00x | Remaining not established | Cash leaves group; debt stays | High | Negative — Leverage Increase | E03; E24 |
| Non-guarantor transfers | Unlimited restricted-subsidiary investments | Unlimited | Not disclosed | Collateral and guarantee reach reduced | High | Negative — Covenant Erosion | E05 |
| Unrestricted subsidiaries | New subsidiaries only | At least USD 250 million plus general USD 500 million; unlimited at 5.75x | Not disclosed | Value outside group | Moderate | Negative — Covenant Erosion | E05; E09 |
| Junior debt prepayment | Prepayment of subordinated debt is a restricted payment | Same RP gates | Not disclosed | Junior paid before senior maturity | Moderate | Negative — Liquidity Deterioration | E03 |

### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings, incurrence EBITDA | Consolidated EBITDA clause (2)(m) | Actions within 24 months; capped at 25% of Consolidated EBITDA | Not Calculable: projections not disclosed | Up to 25% denominator uplift | Larger debt and RP capacity | E06 |
| Projected cost savings, covenant EBITDA | Financial Covenant Consolidated EBITDA clause (2)(n) | 24 months; no cap found | Not Calculable | Uncapped maintenance denominator | Springing test less likely to bite | E07 |
| Transaction, recapitalisation and refinancing costs | Clauses (2)(d) and (2)(e) | None | Not Calculable | Recurring acquisition costs added back | Earnings quality rejected USD 345 million of similar issuer add-backs | E06; E25 |
| Dividend equivalents and equity-plan costs | Clauses (2)(j) and (2)(k) | Equity-funded for plan costs | Not Calculable | Distribution-linked payments excluded | Extraction raises capacity | E06 |
| Incentive bonus costs | Financial covenant clause (2)(m) | None | Not Calculable | Cash compensation excluded | Maintenance erosion | E07 |
| Earn-outs and start-up costs | Clauses (2)(i) and (2)(l) | None | Not Calculable | Acquisition cash costs excluded | Acquisition-led releveraging | E06 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Leverage-only distribution gate | Unlimited RP at 6.75x | Repeat recapitalisations | High | High | Analysis affected: Downside; Committee decision | E03 |
| Basket reclassification | Borrower may divide and classify debt across categories | Capacity stacking | Moderate | High | Analysis affected: Recovery & fulcrum | E04 |
| Unlimited non-guarantor investment | Permitted Investments clause 1(a) | Collateral leakage | High | Medium | Analysis affected: Structural priority | E05 |
| Note collateral by majority | 2033 indenture s.9.02 | Consent-driven collateral change | Moderate | Medium | Analysis affected: Security selection | E16 |
| Uncapped maintenance savings | Financial covenant EBITDA | Maintenance erosion | Moderate | High | Analysis affected: Liquidity | E07 |

### T4C.11 Capacity risk prioritisation

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari first-lien debt at 5.00x | High | Moderate | Equal-rank dilution | Modest | High for first lien | Secured issuance | E04 |
| 2 | Ratio restricted payments at 6.75x | High | High | Debt-funded extraction | High | Moderate | Declarations | E03; E24 |
| 3 | Investments in non-guarantor restricted subsidiaries | High | Moderate | Collateral leakage | Low | High | Guarantor asset share | E05 |
| 4 | Projected cost-savings add-backs | Moderate | High | Ratio inflation | Moderate | Moderate | Covenant EBITDA bridge | E06; E07 |
| 5 | Note collateral amendments by majority | Moderate | Medium | Lender-control loss | Low | Moderate | Consent solicitations | E16 |

### T4C.12 Capacity gaps

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| C1 | Compliance certificate and covenant EBITDA bridge | Tested ratios unknown | T4C.4 ratio rows Not Calculable | Obtain certificate |
| C2 | Basket usage tracker | Remaining capacity unknown | T4C.5 floors only | Obtain usage records |
| C3 | Consolidated Total Indebtedness and Total Assets definitions | Numerator and investment basket base | Definition conflict with carrying debt unresolved | Read definitions |
| C4 | Effective dates of the June and September 2024 amendments | MFN sunset dating | No dated MFN event | Obtain effective-date notices |

### Material claim lineage

| Claim | Material claim | Strongest lineage | Evidence ID |
|---|---|---|---|
| M1 | Only the revolver has a maintenance covenant, springing at 40% | Directly Sourced | E01; E02 |
| M2 | Springing covenant dormant at year-end, exposure 7.36% | Calculated | E23; K02 |
| M3 | Unlimited bank RP at 6.75x | Directly Sourced | E03 |
| M4 | Notes RP unlimited above 2.00x coverage | Directly Sourced | E14; E18 |
| M5 | Pari secured gates 5.00x and 5.25x | Directly Sourced | E04; E15 |
| M6 | Covenant EBITDA adds projected savings | Directly Sourced | E06; E07 |
| M7 | Acquisitions not leverage-tested | Directly Sourced | E05 |
| M8 | Uptier partly blocked; no lien-subordination consent found | Analyst Inference | E12 |
| M9 | Note collateral amendable by majority | Directly Sourced | E16 |
| M10 | First-lien enforcement control not established | Insufficient Information | E17 |
| M11 | September recapitalisation used ratio RP route | Analyst Inference | E03; E24 |
| M12 | Proxy leverage 5.50x and 4.22x | Calculated | K06; K08 |
| M13 | 179 days blockage cap | Directly Sourced | E19 |
| M14 | Current covenant ratios not established | Insufficient Information | E02 |
| M15 | Drop-down route via investments despite designation limit | Analyst Inference | E05; E09 |

### Verification

| Register | Result | Note |
|---|---|---|
| T4.1 to T4.13 | PASS | Present with required columns and rows |
| T4D.1 to T4D.8 | PASS | Undisclosed entity values shown as dashes with gap rows |
| T4F.1 to T4F.6 | PASS | ICA-dependent cells marked with the missing document |
| T4C.2 to T4C.12 | PASS | Ratio headroom Not Calculable where tested ratio missing |

## Calculations

All amounts are consolidated USD millions at 2024-09-30 unless stated. Proxy ratios use the issuer's EBITDA As Defined of USD 4,173 million and post-dividend figures from the financial foundation after the October 2024 dividend; they are not covenant ratios, because covenant earnings and debt definitions differ and no compliance certificate was supplied.

| ID | Period / basis | Formula and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | 2024-09-30 revolver | 910 commitments less 843 availability after letters of credit | 67 | USD million | Financial foundation (CP-1) |
| K02 | 2024-09-30 revolver | 67 / 910 | 0.073626373626373626373626373626373626374; displayed 7.36% | Fraction; % | Financial foundation (CP-1) |
| K03 | Springing trigger | 910 × 0.40 | 364.00, matching the USD 364 million stated in the annual report | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K04 | Trigger headroom amount | 364 − 67 | 297 | USD million | calculation K01; calculation K03 |
| K05 | Trigger headroom ratio | 40.00 − 7.36 | 32.64 | percentage points | calculation K02 |
| K06 | Proxy post-dividend net leverage, October 2024 | 22,967 pro forma net debt / 4,173 EBITDA As Defined | 5.5037143541816439012700694943685597891; displayed 5.50x | x | Financial foundation (CP-1) |
| K07 | Proxy gap to RP gate | 6.75 − 5.50 | 1.25 | x | calculation K06 |
| K08 | Proxy post-dividend secured net leverage, October 2024 | 19,534 identified secured debt − 1,913 pro forma cash = 17,621; 17,621 / 4,173 | 17,621 USD million; 4.2226216151449796309609393721543254254, displayed 4.22x | USD million; x | Financial foundation (CP-1) |
| K09 | Proxy gap to pari secured gate | 5.00 − 4.22 | 0.78 | x | calculation K08 |
| K10 | Secured notes aggregate | Principal 2,100 + 2,750 + 1,450 + 1,000 + 2,200 + 1,500; carrying 2,077 + 2,727 + 1,438 + 984 + 2,180 + 1,486 | 11,000; 10,892 | USD million | Financial foundation (CP-1) |
| K11 | 2029 subordinated notes aggregate | Principal 1,200 + 750; carrying 1,194 + 746 | 1,950; 1,940 | USD million | Financial foundation (CP-1) |
| K12 | Term loans principal | 1,871 + 3,632 + 1,699 + 1,500 | 8,702 | USD million | Financial foundation (CP-1) |
| K13 | Leases and government advances | 262 + 17 | 279 | USD million | Financial foundation (CP-1) |
| K14 | Total carrying debt | 8,642 + 10,892 + 2,641 + 1,940 + 486 + 279 | 24,880 | USD million | Financial foundation (CP-1) |
| K15 | Securitization fixed-floor remaining | 725 − 487 | 238 | USD million | d887611dex101.htm.jsonl, page 60; Financial foundation (CP-1) |

The pro forma figures in the proxy rows reflect the October 2024 dividend of USD 4,348 million; year-end net debt before that payment was USD 18,619 million per the financial foundation, with pro forma net debt of USD 22,967 million after it.

## Gaps

The open items restrict tested headroom, enforcement control and series-specific terms; they do not change the provision readings of the three executed documents reviewed. The most-favoured-nation protection for each term tranche lapses 18 months after the relevant amendment effective date; the effective dates of the June and September 2024 amendments are not established, so no dated lapse is recorded.

| Gap | Severity | What is missing | Effect on conclusion | Source |
|---|---|---|---|---|
| First-lien intercreditor agreement | MATERIAL | Executed agreement dated 2019-02-13 and joinders | Enforcement control, first-lien standstill, release and purchase rights not established | d887611dex41.htm.jsonl, page 30 |
| Compliance certificate and covenant EBITDA | MATERIAL | Tested ratios, covenant debt and unrestricted cash | Ratio headroom not established; proxies directional only | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Remaining indentures | MATERIAL | 2028 to 2032 secured and two 2029 subordinated indentures | Series terms extrapolated | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Basket usage | MATERIAL | Usage records for fixed and grower baskets | Capacity stated as floors only | d887611dex101.htm.jsonl, pages 59–63 |
| Guarantee and Collateral Agreement | MINOR | Collateral scope, excluded assets | Collateral map partial | d887611dex101.htm.jsonl, page 173 |
| Cross-default, cure and blocker clauses | MINOR | Clauses beyond pages read | Priming exposure labelled theoretical | d887611dex101.htm.jsonl, page 205 |
| Subordinated indenture governing law and turnover | MINOR | Clause text not visible or not read | Junior turnover mechanics open | d826058dex41.htm.jsonl, page 123 |

## Next module
The orchestrator selects the next module.
