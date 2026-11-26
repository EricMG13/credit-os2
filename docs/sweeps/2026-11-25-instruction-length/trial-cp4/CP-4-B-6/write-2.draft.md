## Request
TransDigm Group Incorporated, with TransDigm Inc. as borrower and note issuer, assessed as of 2024-09-30 under the deep_credit_assessment pathway. Scope: interpretation of the supplied credit agreement and indentures, covenant headroom and basket capacity, the restricted-group and guarantee map, and intercreditor control.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement, with the annexed conformed second amended and restated credit agreement | 2024-09-19, agreement date; publication date not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling loan document: financial covenant, ratio and EBITDA definitions, debt, restricted payment and investment covenants, incremental and yield protection, unrestricted subsidiaries, guarantors and collateral, events of default, amendments, agent enforcement, governing law |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033 | 2024-09-19, indenture date; publication date not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note restricted payments, amendment and collateral-release thresholds, guarantor release, intercreditor agreement reference, collateral agent authority, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027 | 2019-11-13, indenture date; publication date not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination, turnover, designated senior debt and payment blockage |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of covenants and compliance, revolver usage, term-loan and note register, guarantor structure and obligor-group summary |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Issuer, date, legal-document inventory, document dates and retrospective boundary |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Reported EBITDA, carrying debt, cash, net debt, October 2024 pro forma figures, debt instrument register |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation facts, acquisition use of cash, parent and borrower identity |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Rejected recurring add-backs used to show how far covenant earnings can exceed supported earnings |

## Findings

### Bottom line
TransDigm's debt documents protect creditors through incurrence ratios rather than maintenance tests, and those ratios still permit further debt-funded distributions and pari secured layering, so creditor protection rests on ratio arithmetic that covenant earnings add-backs can loosen. After the October 2024 dividend, net leverage is 6.02x on reported EBITDA against the 6.75x test that unlocks unlimited restricted payments, leaving USD 2,770.75 million of further distribution capacity on this conservative proxy before covenant add-backs.
Basis: d887611dex101.htm.jsonl, pages 177–181; Financial foundation (CP-1); calculation K10

The nearest pressure point is pari secured debt: proxy secured net leverage of 4.62x after the dividend sits 0.38x below the 5.00x incurrence cap. The only maintenance test protects revolving lenders alone, springs above 40% revolver usage and was not triggered at year-end. Term loans and notes therefore carry default risk through leverage drift and refinancing rather than covenant breach, and loss-given-default risk through pari dilution and value held outside the guarantor group.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 59–61; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; calculation K02; calculation K08

### Key findings
- Distribution capacity is the dominant legal risk and remains open. The credit agreement allows any restricted payment while no default exists and pro forma net leverage, including the financing of the payment, does not exceed 6.75x, and a dividend permitted at declaration may be paid within 60 days. On Financial foundation's post-dividend net leverage of 6.02x the headroom is 0.73x. The 2033 secured notes are looser, allowing unlimited payments while fixed-charge coverage exceeds 2.00x, so the loans rather than the bonds set the binding limit; refinancing the loans away would weaken this protection.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex41.htm.jsonl, pages 75–76; Financial foundation (CP-1); calculation K10
- Pari secured layering is both the strongest protection and the nearest constraint. Incremental loans and other pari secured debt require secured net leverage at or below 5.00x and total net leverage at or below 7.25x, with no fixed free-and-clear incremental amount; once the ratios are met the agent must document new pari or junior liens without lender consent. On a reported-EBITDA proxy USD 1,444 million of pari secured capacity remains after the dividend. Yield protection for existing term lenders is limited to 50 bp, lapses after 18 months and excludes acquisition financing.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, pages 142–146; d887611dex101.htm.jsonl, pages 204–205; calculation K08; calculation K09
- Covenant earnings are wider than the issuer's own adjusted measure, so every ratio test is looser than reported leverage implies. The covenant definition adds back projected cost savings from actions within 24 months without a cap, plus non-cash and deferred compensation, acquisition, refinancing, incentive-bonus and dividend-equivalent costs. The earnings quality review rejected USD 345 million of issuer add-backs as recurring; the covenant base keeps those categories and can add more.
Basis: d887611dex101.htm.jsonl, pages 25–27; d887611dex101.htm.jsonl, pages 41–42; Earnings quality (CP-1D)
- Leakage capacity is large but undemonstrated. A general investment basket sized at the greater of USD 500 million and 25% of total assets is worth about USD 6,396.50 million on group assets, investments in non-guarantor restricted subsidiaries are uncapped, and no intellectual-property transfer blocker was located. Designation is narrower than usual: only newly formed or newly acquired subsidiaries can become unrestricted, so value would first have to move into a new entity.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, page 81; calculation K14
- Structural subordination to non-guarantors is moderate and documented. Subsidiaries outside the obligor group account for about USD 1,646 million, or 20.73%, of FY2024 sales and USD 2,233 million of goodwill; only 65% of voting stock in first-tier foreign subsidiaries is pledged, and foreign-subsidiary and receivables-financing baskets let creditors at those entities rank ahead of all notes on their assets.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59; d887611dex101.htm.jsonl, pages 59–60; d887611dex101.htm.jsonl, pages 173–174; calculation K15; calculation K16
- Control mechanics protect noteholders better than term lenders against subordination. The 2033 indenture needs each affected holder to change ranking and two-thirds of holders to release substantially all collateral or adversely change the intercreditor agreement. The credit agreement's unanimous-consent list protects pro rata sharing, material guarantor releases and near-total collateral releases, but does not list lien or payment subordination, which leaves a majority-lender uptier route open in theory. Subordinated noteholders can be blocked from payment for up to 179 days in any 360 days.
Basis: d887611dex41.htm.jsonl, pages 116–118; d887611dex101.htm.jsonl, pages 204–206; d826058dex41.htm.jsonl, pages 106–107

### Contrary evidence and what would change the view
The strongest counterargument is that the package has already absorbed a large distribution without strain: the issuer reports compliance with every covenant, the revolver was undrawn apart from letters of credit, all incremental secured debt is ratio-gated with no free-and-clear amount, the unlimited investment basket closes once net leverage exceeds 5.75x, and noteholders hold individual protection against ranking changes. On that reading the ratios are doing their job and a further distribution would be self-limiting at 6.75x. That argument would prevail if compliance certificates showed covenant earnings close to reported EBITDA, if basket-usage records showed the fixed and grower baskets largely consumed, or if the first-lien intercreditor agreement gave noteholders a blocking role over new super-priority debt. The view would worsen if a further distribution or secured incurrence were announced while proxy secured net leverage sits near the 5.00x cap, or if a subsidiary were newly formed and designated unrestricted.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62; d887611dex101.htm.jsonl, pages 142–146; d887611dex101.htm.jsonl, pages 61–63; d887611dex41.htm.jsonl, pages 116–118

### Limitations
- Covenant earnings and the covenant definition of unrestricted cash are not reported, so every headroom figure here is a proxy on reported EBITDA and consolidated cash; because the covenant base adds back more, the distribution and secured-debt capacities stated are floors, and the nearest-pressure-point conclusion could ease materially.
- The first-lien intercreditor agreement and the guarantee and collateral agreement are not in the source set, so who directs enforcement among the pari classes, any standstill between them, turnover, purchase options and the precise collateral scope are not established; the intercreditor conclusions cover only what the loan and note documents say about those agreements.
- No compliance certificate or basket-usage tracker was supplied, so remaining capacity in the fixed and grower baskets is gross, not net of past use; the leakage-capacity conclusion therefore describes permission, not unused room.
- Only the 2033 secured and 2027 subordinated indentures were reviewed; the other five secured note series due 2028 to 2032 and the two subordinated series due 2029 are covered only by the issuer's statement that they share many covenants, so instrument-specific differences in restricted payments or release terms are not established.
- The conformed credit agreement annexed to the September 2024 amendment is used as the operative text without a clause-by-clause reconciliation to earlier amendments or to its schedules and exhibits, so excluded-asset schedules and investment schedules that could widen permissions are not reflected.

### Nearest pressure point
The nearest pressure point is pari secured incurrence capacity under the 5.00x secured net leverage cap, which governs both incremental term loans and new pari secured notes. On a reported-EBITDA proxy, secured net leverage rises from 3.48x at year-end to 4.62x once the October 2024 dividend cash is gone, leaving USD 1,444 million of room. A borrower that wants to refinance, fund an acquisition or pay another distribution with secured debt would use this capacity first, diluting existing first-lien recoveries pari passu; once it is exhausted, further debt must be junior-lien or unsecured under the 7.25x total test, which is less dilutive for first-lien holders but raises default risk. The observable signals are new incremental joinders or secured-note indentures, quarterly reported EBITDA, and the cash balance relative to secured debt. Compliance certificates with covenant earnings and unrestricted cash would tighten the view.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, page 146; Financial foundation (CP-1); calculation K07; calculation K08; calculation K09

### Overall legal credit view
The package is Aggressive, the second-highest of five rubric levels, driven by ratio-based unlimited distributions, uncapped projected cost-savings add-backs and very large investment baskets, offset by ratio-only incremental capacity, a narrow designation right for unrestricted subsidiaries and strong noteholder consent protections. The main default-risk path is discretionary releveraging within the 6.75x and 7.25x tests rather than a covenant trip, because the only maintenance test belongs to the revolver and is not active. The main loss-given-default path is pari secured dilution under the 5.00x cap plus value held by non-guarantor and foreign subsidiaries. For security selection, the secured notes carry stronger individual protection against subordination than the term loans, while subordinated notes face contractual payment blockage and turnover. The review is completed with limitations; firmer conclusions need the intercreditor agreement, the guarantee and collateral agreement, compliance certificates and basket-usage records.
Basis: d887611dex101.htm.jsonl, pages 177–181; d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, pages 61–63; d887611dex41.htm.jsonl, pages 116–118; d826058dex41.htm.jsonl, pages 106–107

### Capital structure
The debt sits in three payment tiers at one borrower, with every senior secured class sharing one first-lien package and subordinated notes ranking behind it.

| Debt class | Principal, USD million | Rank and security | Obligors and guarantors | Governing document in source set | Source |
|---|---|---|---|---|---|
| Revolving credit facility | 910 committed; 67 letters of credit; 843 available | Senior secured first lien, pari with term loans and secured notes | TransDigm Inc.; Holdings and domestic loan-party subsidiaries | Conformed credit agreement annexed to Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 188 |
| Term loans I, J, K and L | 8702 | Senior secured first lien | Same as revolver | Conformed credit agreement; Tranche L under Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 1 |
| Secured notes due 2028 to 2033, six series | 11000 | Senior secured first lien under the First Lien Intercreditor Agreement | TransDigm Inc.; TD Group and restricted subsidiaries that guarantee the facilities or large capital-markets debt | Only the 2033 indenture supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58; d887611dex41.htm.jsonl, page 30 |
| Senior subordinated notes due 2027 and 2029, three series | 4600 | Unsecured, contractually subordinated to senior debt | TransDigm Inc.; TD Group, TransDigm UK and domestic restricted subsidiaries | Only the 2027 indenture supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–58; d826058dex41.htm.jsonl, pages 106–107 |
| Receivables securitization | 487.5 drawn of 650 at year-end; 162.5 drawn in October 2024 | Non-recourse securitization entity debt; excluded subsidiary | Securitization entity; not a guarantor | Facility agreement not supplied | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, page 60 |
| Finance leases and government advances | 262 and 17 carrying | Legal rank not established | Not established | Not supplied | Financial foundation (CP-1) |

### Covenant tests and headroom
Every test below is an incurrence condition except the revolver test, and all are measured here on reported EBITDA and consolidated cash because covenant earnings are not disclosed.

| Test and limit | Year-end proxy and headroom | After October 2024 dividend | Who is protected | Creditor consequence | Source |
|---|---|---|---|---|---|
| Revolver net leverage, at or below 7.50x, tested only above 40% usage | 4.88x; 2.62x; usage 7.36% so not tested | 6.02x; 1.48x; securitization draw in October 2024 leaves 4.88x unchanged | Revolving lenders only | No term-loan or note maintenance protection | d887611dex101.htm.jsonl, page 188; calculation K05 |
| Ratio debt and incremental, total net at or below 7.25x | 4.88x; 2.37x | 6.02x; 1.23x | All lenders | USD 4,677.25 million junior or unsecured capacity on proxy | d887611dex101.htm.jsonl, pages 59–60; calculation K06; calculation K12 |
| Pari secured debt, secured net at or below 5.00x | 3.48x; 1.52x | 4.62x; 0.38x | First-lien holders | USD 1,444 million pari secured capacity on proxy | d887611dex101.htm.jsonl, pages 59 and 146; calculation K07; calculation K08 |
| Unlimited restricted payments, total net at or below 6.75x | 4.88x; 1.87x | 6.02x; 0.73x | All creditors | USD 2,770.75 million further distributions on proxy | d887611dex101.htm.jsonl, page 181; calculation K10 |
| Unlimited investments, total net at or below 5.75x | 4.88x; 0.87x | 6.02x; minus 0.27x, basket closed | All creditors | Reopens only after deleveraging | d887611dex101.htm.jsonl, page 63; calculation K11 |
| 2033 notes unlimited restricted payments, fixed-charge coverage above 2.00x | Not calculable: coverage inputs not disclosed | Not calculable | Secured noteholders | Looser gate than the loans once loans are repaid | d887611dex41.htm.jsonl, page 75 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver springing trigger: revolving exposure as share of commitments | 40.00 | 7.36 | 32.64% | Passes at or below | % of revolving commitments | Credit agreement financial covenant; current is USD 67 million letters of credit over USD 910 million commitments, assumes no cash-collateralised letters of credit; year-end 2024-09-30 |
| Revolver maximum net leverage | 7.50 | 4.88 | 2.62x | Passes at or below | x | Proxy: Financial foundation year-end net debt over reported EBITDA, not covenant earnings; 6.02x after October 2024 dividend, 4.88x after October 2024 securitization draw; test not active because usage below 40% |
| Ratio debt and incremental total net leverage | 7.25 | 4.88 | 2.37x | Passes at or below | x | Proxy as above; incurrence condition, not a maintenance test; 6.02x after October 2024 dividend leaves 1.23x |
| Pari secured net leverage | 5.00 | 3.48 | 1.52x | Passes at or below | x | Proxy: identified secured carrying debt less all cash over reported EBITDA; securitization and leases excluded; 4.62x after October 2024 dividend leaves 0.38x |
| Unlimited restricted payments total net leverage | 6.75 | 4.88 | 1.87x | Passes at or below | x | Proxy as above; also requires no default; 6.02x after October 2024 dividend leaves 0.73x |
| Unlimited investments total net leverage | 5.75 | 4.88 | 0.87x | Passes at or below | x | Proxy as above; also requires no revolving loans and at least USD 200 million unrestricted cash; closed at 6.02x after October 2024 dividend |
| 2033 notes unlimited restricted payments fixed-charge coverage | 2.00 | Not supplied: indenture coverage inputs not disclosed | Not supplied: tested ratio not disclosed | Passes above | x | 2033 indenture restricted payments covenant; ratio must exceed 2.0 to 1.0; definition of fixed charges not reviewed |

Every current figure except the springing trigger is an analyst proxy on reported EBITDA, so covenant headroom, measured on wider covenant earnings, is likely larger than shown.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: 2033 indenture exhibit states no publication date | First Lien Intercreditor Agreement entered among the borrower, Holdings, guarantors, credit agreement collateral agent and secured-note trustees | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement and release among pari first-lien classes; agreement itself not supplied |
| 2019-11-13 | day | Not supplied: indenture exhibit states no publication date | Indenture for the 2027 senior subordinated notes executed | Historical — indenture dated 2019-11-13 | Source readiness (CP-0); d826058dex41.htm.jsonl, page 1 | Source of subordination, turnover and payment blockage terms |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15, the most recent amendment affecting the credit agreement restrictive covenants | Historical — executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Sets the current covenant package; also anchors Tranche I and K yield-protection sunsets |
| 2024-09-19 | day | Not supplied: amendment exhibit states no publication date | Amendment No. 17 adds USD 1,500 million Tranche L incremental term loans | Historical — Amendment No. 17 and incremental term loan assumption agreement dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Demonstrates use of ratio-based incremental capacity to fund the dividend; starts Tranche L yield-protection clock |
| 2024-09-19 | day | Not supplied: indenture exhibit states no publication date | Joinder No. 6 adds the 2033 secured notes to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million pari first-lien claim to the shared collateral |
| 2027-09-15 | day | Not supplied: indenture exhibit states no publication date | Initial redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date means September 15, 2027 | d887611dex41.htm.jsonl, page 30 | Earliest optional call under the indenture; affects refinancing flexibility for the pari secured stack |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity | Scheduled — maturity date of the revolving credit facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance covenant lapses with the revolver unless replaced |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Owns all capital stock | Ownership | TransDigm Inc. | Annual report; both Delaware corporations |
| TransDigm Group Incorporated | Guarantees facilities as Holdings | Guarantee | Senior secured credit facilities | Credit agreement default clause (i); New York law |
| Domestic restricted subsidiaries | Join as loan parties and guarantee | Guarantee | Senior secured credit facilities | Credit agreement s5.11; New York law |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | 2033 secured notes | 2033 indenture art. 10; New York law |
| Domestic restricted subsidiaries | Senior secured guarantee | Guarantee | 2033 secured notes | 2033 indenture s10.07; New York law |
| Domestic loan parties | Grant first-priority liens | Security | Credit agreement collateral agent | Credit agreement s5.11; New York law |
| Domestic loan parties | Grant first liens for noteholders | Security | 2033 notes collateral agents | 2033 indenture art. 12; New York law |
| Non-guarantor subsidiaries | Own liabilities rank first on assets | Structural claim | Secured and subordinated notes | Annual report guarantor note; US SEC filing |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured debt | Senior in right of payment | Payment rank | 2027 subordinated notes | 2027 indenture art. 10; law clause not read |
| Credit facility obligations | Equal-priority first liens | Security rank | Secured notes | 2033 indenture ICA term; New York law |
| Applicable collateral agent | Acts for first-lien classes | Enforcement control | First-lien collateral | 2033 indenture art. 12; ICA not supplied |
| Designated senior debt agent | Blocks payment up to 179 days | Standstill | 2027 subordinated notes | 2027 indenture s10.03; law clause not read |
| Required Lenders | Approve release of specific collateral | Release | Credit facility collateral | Credit agreement s9.02(c); New York law |
| Two-thirds of 2033 holders | Approve near-total collateral release | Release | 2033 notes collateral | 2033 indenture s9.02; New York law |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 8 |
| Calculated | 4 |
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

### Analytical appendix — complete canonical registers

### Evidence register

| Evidence ID | Provision or fact | Source |
|---|---|---|
| L01 | Section 6.14 springing net leverage covenant for revolving lenders, 7.50x or 8.00x after a Material Acquisition, tested when revolving exposure exceeds 40% of commitments; amendable only by Required Revolving Lenders | d887611dex101.htm.jsonl, page 188 |
| L02 | Consolidated Net Leverage Ratio, Consolidated Secured Debt and Consolidated Secured Net Debt Ratio definitions; pro forma for acquisitions and asset sales | d887611dex101.htm.jsonl, pages 26–27 |
| L03 | Financial Covenant Consolidated EBITDA add-backs, including uncapped projected cost savings within 24 months | d887611dex101.htm.jsonl, pages 41–42 |
| L04 | Consolidated Net Income exclusions, including non-recurring and integration costs, non-cash and deferred compensation and purchase accounting | d887611dex101.htm.jsonl, pages 25–26 |
| L05 | Permitted Indebtedness clauses 12 to 18: pari secured at 5.00x, junior or unsecured at 7.25x, general basket, foreign subsidiary basket, subordinated debt at 7.25x, securitization basket; reclassification right | d887611dex101.htm.jsonl, pages 59–61 |
| L06 | Permitted Investments: unrestricted subsidiaries, general, joint venture, acquisition and unlimited ratio baskets | d887611dex101.htm.jsonl, pages 61–63 |
| L07 | Section 6.02 restricted payments, clauses 1 to 10 and unlimited payments at 6.75x | d887611dex101.htm.jsonl, pages 177–181 |
| L08 | Section 2.24 incremental commitments, yield protection and ratio conditions | d887611dex101.htm.jsonl, pages 142–146 |
| L09 | Unrestricted Subsidiary definition and designation conditions; Unrestricted Cash definition | d887611dex101.htm.jsonl, page 81 |
| L10 | Section 5.11 joinder of domestic subsidiaries, excluded subsidiaries, 65% voting-stock pledge of foreign subsidiaries, SEC-rule pledge carve-out | d887611dex101.htm.jsonl, pages 173–174 |
| L11 | Article VII events of default, including cross-default, judgment default, guarantee and collateral invalidity, financial covenant default and change of control | d887611dex101.htm.jsonl, pages 188–191 |
| L12 | Section 9.02 amendments, unanimous-consent items, agent duty to add pari or junior liens, non-pro-rata offers, collateral release; Required Lenders more than 50% | d887611dex101.htm.jsonl, pages 204–207; d887611dex101.htm.jsonl, page 71 |
| L13 | Agent sole right to proceed against collateral; agent authorised to enter intercreditor agreements | d887611dex101.htm.jsonl, page 197 |
| L14 | Credit agreement governed by New York law | d887611dex101.htm.jsonl, page 222 |
| L15 | Amendment No. 17: Tranche L USD 1,500 million incremental term loans to TransDigm Inc. | d887611dex101.htm.jsonl, pages 1–2 |
| L16 | 2033 indenture definition of the First Lien Intercreditor Agreement and joinders; initial redemption date | d887611dex41.htm.jsonl, page 30 |
| L17 | 2033 indenture restricted payments: builder basket and unlimited payments above 2.0x fixed-charge coverage | d887611dex41.htm.jsonl, page 70; d887611dex41.htm.jsonl, pages 75–76 |
| L18 | 2033 indenture amendment thresholds and holder-by-holder protections; two-thirds for near-total collateral release or adverse intercreditor change | d887611dex41.htm.jsonl, pages 116–118 |
| L19 | 2033 indenture guarantor release triggers | d887611dex41.htm.jsonl, page 122 |
| L20 | 2033 indenture collateral-agent authority through the intercreditor agreement | d887611dex41.htm.jsonl, page 132 |
| L21 | 2027 indenture subordination, turnover, payment blockage; Designated Senior Debt includes facilities and secured notes | d826058dex41.htm.jsonl, pages 106–107; d826058dex41.htm.jsonl, page 20 |
| L22 | Issuer covenant summary, incremental ratios, maintenance test description, compliance statement, securitization terms | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 61–62 |
| L23 | Guarantor structure, structural subordination statement and obligor-group summary | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 |
| L24 | Term loan and revolver register, letters of credit USD 67 million, availability USD 843 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| U1 | Reported EBITDA 3813, carrying debt 24880, cash 6261, net debt 18619, net leverage 4.88x; October 2024 dividend 4348, pro forma net debt 22967, 6.02x, pro forma cash 1913; identified secured carrying debt 19534 | Financial foundation (CP-1) |
| U2 | Dividend recapitalisation: USD 3,000 million secured debt plus cash; FY2024 acquisitions USD 2,347 million | Business & governance (CP-1A) |
| U3 | USD 345 million of issuer add-backs rejected as recurring | Earnings quality (CP-1D) |
| U4 | Legal-document inventory and dates | Source readiness (CP-0) |

### T4.1 Source gate and module status

| Item | Determination | Source |
|---|---|---|
| Executed governing document available | Yes: execution-version Amendment No. 17 with conformed credit agreement, and two executed indentures | d887611dex101.htm.jsonl, page 1; Source readiness (CP-0) |
| Financial inputs | Financial foundation year-end figures and October 2024 pro forma | Financial foundation (CP-1) |
| Missing supplements | First Lien Intercreditor Agreement, Guarantee and Collateral Agreement, schedules, compliance certificates, basket-usage records, five secured and two subordinated note indentures | d887611dex41.htm.jsonl, page 30 |
| Module status | Completed with Limitations | Not applicable: determination |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Second amended and restated credit agreement as annexed to Amendment No. 17 | Credit agreement, conformed restated text | 2024-09-19 | Executed amendment; annex treated as operative text | Controls revolver, term loans, financial covenant, baskets, guarantees and collateral | Sets the binding restricted payment, investment and secured-debt limits | L01; L05; L07; L15 | d887611dex101.htm.jsonl, pages 1–2 |
| 1 | Indenture for 2033 secured notes | Indenture | 2024-09-19 | Executed | Controls 2033 notes covenants, guarantees and collateral consents | Holder protections against subordination and release; looser distribution gate | L17; L18; L19 | d887611dex41.htm.jsonl, pages 116–118 |
| 1 | Indenture for 2027 subordinated notes | Indenture | 2019-11-13 | Executed | Controls subordination and payment blockage | Junior class payment and turnover mechanics | L21 | d826058dex41.htm.jsonl, pages 106–107 |
| 2 | First Lien Intercreditor Agreement with Joinders No. 1 to No. 6 | Intercreditor agreement | 2019-02-13; latest joinder 2024-09-19 | [Insufficient Information] — ICA not in the source set | Would control enforcement and release among pari first-lien classes | Enforcement control and standstill not established | L16 | d887611dex41.htm.jsonl, page 30 |
| 3 | Compliance certificates | Covenant schedule | Not supplied | [Insufficient Information] — compliance certificate not in the source set | Would control tested ratios and basket usage | Headroom limited to proxies | L22 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Supporting | Annual report on Form 10-K | Issuer filing | 2024-11-07 | Filed | Summary of covenants, compliance, guarantor structure | Corroborates documents; not a legal formula source | L22; L23; L24 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–62 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x, 8.00x for four quarters after a Material Acquisition, only when revolving exposure exceeds 40% of commitments; for revolving lenders only | Credit agreement s6.14 | Inactive while revolver usage is low; term lenders and noteholders have no maintenance protection | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L01 |
| Covenant amendment control | Financial covenant and its definitions amendable by Required Revolving Lenders alone | Credit agreement s6.14 | Revolving class can relax the only maintenance test without term lenders | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L01 |
| Pari secured debt | Senior secured debt with same lien priority allowed if secured net leverage at or below 5.00x; collateral-only liens; maturity and average-life limits | Credit agreement Permitted Indebtedness clause 12 | Uncapped in amount subject to ratio; dilutes first-lien collateral | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L05 |
| Junior or unsecured ratio debt | Allowed if total net leverage at or below 7.25x | Credit agreement Permitted Indebtedness clauses 12 and 17 | Releveraging capacity behind first lien | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L05 |
| Incremental facilities | Ratio-only at 7.25x total and 5.00x secured; no fixed free-and-clear amount; limited-condition acquisition testing at signing | Credit agreement s2.24(c) | Capacity tracks covenant earnings, which include uncapped cost savings | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L08 |
| Yield protection | 50 bp yield differential; lapses 18 months after the relevant amendment effective date; excludes acquisition-related loans and loans maturing more than 18 months after the tranche | Credit agreement s2.24(b) | Repricing protection is short and porous | Negative — Refinancing Risk | [Insufficient Information] — no comparative source supplied | L08 |
| General and foreign debt baskets | Greater of USD 250 million and 10% covenant EBITDA; foreign subsidiaries greater of USD 450 million and 18% | Credit agreement Permitted Indebtedness clauses 13 and 14 | Foreign-subsidiary debt sits ahead of notes on non-guarantor assets | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L05 |
| Securitization basket | Greater of USD 725 million and 20% covenant EBITDA, non-recourse | Credit agreement Permitted Indebtedness clause 18 | Receivables move outside the collateral pool | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L05 |
| Restricted payments, ratio route | Any restricted payment if no default and pro forma net leverage at or below 6.75x including financing | Credit agreement s6.02 final paragraph | Unlimited debt-funded distributions up to the ratio | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L07 |
| Restricted payments, declaration | Dividend payable within 60 days if permitted at declaration | Credit agreement s6.02 clause 1 | Tests capacity at declaration, before cash leaves | Negative — Liquidity Deterioration | [Insufficient Information] — no comparative source supplied | L07 |
| Restricted payments, fixed baskets | General greater of USD 75 million and 3% covenant EBITDA; management and dividend-equivalent basket with carry-forward | Credit agreement s6.02 clauses 4 and 7 | Small relative to ratio route | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L07 |
| Investments | Unrestricted subsidiaries greater of USD 250 million and 10%; general greater of USD 500 million and 25% of total assets; joint ventures greater of USD 1,000 million and 40% at 7.00x; unlimited at 5.75x with no revolving loans and USD 200 million unrestricted cash; unlimited in restricted subsidiaries | Credit agreement Permitted Investments clauses 1, 10, 11, 20 | Large value-transfer capacity, including to non-guarantor restricted subsidiaries | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L06 |
| Permitted acquisitions | No leverage test; no default and available liquidity at least USD 100 million; domestic targets must join | Credit agreement Permitted Investments clause 18 | Debt-funded acquisitions limited mainly by debt covenants | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L06 |
| Unrestricted subsidiaries | Only newly formed or newly acquired subsidiaries may be designated; must comply with restricted payment and investment covenants; no recourse debt | Credit agreement Unrestricted Subsidiary definition | Existing value-holding subsidiaries cannot be designated directly | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L09 |
| Guarantors and collateral | Domestic subsidiaries other than immaterial, unrestricted and securitization entities join within 20 business days; 65% voting stock of foreign subsidiaries pledged | Credit agreement s5.11 | Foreign value outside guarantees; partial equity pledge | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L10 |
| Events of default | Payment default with 5 business days grace for interest; covenant default; cross-default on Material Indebtedness; judgments above USD 50 million unpaid 60 days; insolvency; change of control | Credit agreement Article VII | Cross-default links loans to notes | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L11 |
| Amendments | Required Lenders more than 50%; unanimous consent for pro rata sharing, voting thresholds, material guarantor release and near-total collateral release; lien or payment subordination not listed | Credit agreement s9.02(b) | Majority could in principle approve priming structures not otherwise blocked | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L12 |
| Non-pro-rata offers | Required Lenders may permit class-wide non-pro-rata prepayment offers and loan modification offers | Credit agreement s9.02(b) | Offers must go to all lenders of a class, limiting selective exchanges | Neutral — Stable | [Insufficient Information] — no comparative source supplied | L12 |
| 2033 notes restricted payments | Builder basket of USD 400 million plus 50% of cumulative net income since 2010, and unlimited payments if fixed-charge coverage exceeds 2.0x | 2033 indenture s4.07 | Bond gate looser than loan gate | Negative — Leverage Increase | [Insufficient Information] — no comparative source supplied | L17 |
| 2033 notes amendments | Majority generally; each affected holder for ranking and payment terms; two-thirds for near-total collateral release or adverse intercreditor change | 2033 indenture s9.02 | Strong individual protection against subordination | Positive — Covenant Headroom Expansion | [Insufficient Information] — no comparative source supplied | L18 |
| 2033 notes guarantor release | Automatic on permitted sale, designation as unrestricted, immateriality, or release from credit facilities and capital-markets guarantees | 2033 indenture s10.07 | Note guarantees follow bank-lender releases | Negative — Covenant Erosion | [Insufficient Information] — no comparative source supplied | L19 |
| Subordinated notes blockage | One blockage period per 360 days, up to 179 days; second notice allowed to bank debt; turnover until senior debt paid in full in cash | 2027 indenture s10.02 and s10.03 | Junior payments can stop while senior lenders decide | Negative — Liquidity Deterioration | [Insufficient Information] — no comparative source supplied | L21 |

### Definition conflict register

| Item | Legal definition | Financial foundation basis | Divergence | Treatment | Evidence ID |
|---|---|---|---|---|---|
| Covenant net debt | Consolidated Total Indebtedness less Unrestricted Cash of Holdings, borrower and restricted subsidiaries free of non-loan-document liens | Carrying debt 24880 less all cash 6261 | Indebtedness definition not reviewed; securitization face amount treatment and cash restrictions unknown | Proxy only; legal definition governs | L02; L09; U1 |
| Covenant EBITDA | Consolidated EBITDA for incurrence tests; Financial Covenant Consolidated EBITDA with uncapped projected savings for the revolver test | Reported EBITDA 3813; issuer EBITDA As Defined 4173 | Issuer describes the revolver test on EBITDA As Defined; legal definition is wider | Reported EBITDA used as conservative proxy; not a covenant calculation | L01; L03; L22; U1 |
| Secured debt | Indebtedness secured by liens on assets of Holdings, borrower and restricted subsidiaries | Identified secured carrying debt 19534 | Finance leases, securitization and other secured items may be included legally | Proxy excludes them; capacity may be overstated by their amount | L02; U1 |
| Contract liabilities | Inclusion in Indebtedness not established | Contract liabilities USD 177 million outside carrying debt | Customer advances fund operations outside ratio tests | Logged as non-debt funding outside the proxy | U1 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio restricted payments | Unlimited at 6.75x including financing | Distributions add debt or remove cash with no earnings added | Higher: leverage can be pushed to 6.75x on covenant earnings | Lower cash and higher claims dilute recovery | Track declarations and pro forma leverage at each quarter | L07; U1 |
| Pari secured incurrence | 5.00x secured net cap, ratio-only | New pari first-lien claims share collateral | Moderate | Higher first-lien LGD as claims grow | Track joinders and new secured indentures | L05; L08 |
| Springing maintenance test | Revolver-only, tested above 40% usage | No early-warning trip for term or note holders | Lower technical-default risk, later intervention | Value can erode before lenders act | Track revolver usage each quarter end | L01 |
| Covenant earnings | Uncapped projected savings and broad add-backs | Inflates denominator of every ratio test | Higher: more debt before limits bind | Higher if added debt is secured | Request compliance certificate bridge | L03 |
| Non-guarantor value | About 20.73% of sales outside obligor group | Notes structurally behind non-guarantor creditors | Neutral | Higher for all notes on that value | Track foreign debt and securitization use | L23; K15 |
| Subordination and blockage | 179-day blockage; turnover to senior debt | Junior payments stop in senior default | Higher for subordinated notes in stress | Subordinated recovery only after senior paid in full in cash | Track blockage notices and senior defaults | L21 |
| Amendment control | No listed subordination protection in loans; holder protection in notes | Majority loan amendment could permit priming | Neutral | Higher for non-participating loan holders in an uptier | Track amendment filings and lender groups | L12; L18 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions recorded in the covenant feature register | [Insufficient Information] — no market-norm or covenant-review source in the source set | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessable without a comparative source | Insufficient Information | L01; L05; L07 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing test above 40% usage, amendable by revolving lenders | No maintenance protection for term or note holders | Neutral — Stable | Provisional | L01 |
| Debt / lien incurrence capacity | 3 | Ratio-only incremental at 7.25x and 5.00x; no free-and-clear amount; general and foreign baskets | Capacity large but tied to ratios | Negative — Leverage Increase | Provisional | L05; L08 |
| RP / investment / leakage capacity | 4 | Unlimited distributions at 6.75x; general investments greater of USD 500 million and 25% of total assets; uncapped investment in restricted subsidiaries | Large leakage permission; usage unknown | Negative — Leverage Increase | Provisional | L06; L07 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped projected cost savings within 24 months; broad compensation and transaction add-backs | Inflates all ratio capacity | Negative — Covenant Erosion | Provisional | L03; L04 |
| Collateral / guarantor protection | 3 | Domestic subsidiaries guarantee; 65% foreign voting-stock pledge; note guarantees fall away with bank releases | Partial foreign reach; release linkage | Neutral — Stable | Provisional | L10; L19 |
| Amendment / control mechanics | 3 | Loans: majority, no listed subordination protection; notes: holder-level ranking protection and two-thirds for collateral | Split protection across classes | Negative — Covenant Erosion | Provisional | L12; L18 |
| Overall | 4 | Weighted to distribution capacity and covenant-earnings flexibility | Releveraging within documents is the main path | Negative — Leverage Increase | Provisional | L03; L07 |

Covenant Aggressiveness Score: 4/5, Aggressive. Status: Provisional, because covenant earnings, basket usage and the intercreditor agreement are not supplied.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further distribution declaration | Ratio restricted payment at 6.75x | Repeats the September 2024 recapitalisation | PD up; LGD up; equity-favourable, credit-negative | Watch board declarations and pro forma leverage | L07; U2 |
| New pari secured incurrence | Secured net 5.00x cap | Proxy room only USD 1,444 million | LGD up for first lien | Watch incremental joinders and secured note issues | L05; L08; K09 |
| Revolver usage above 40% at quarter end | Springing test | Activates the only maintenance test | PD signal | Track quarter-end revolving exposure | L01 |
| New subsidiary designated unrestricted | Designation of new subsidiaries | Possible drop-down route | LGD up | Watch officer certificates and filings | L09 |
| Large investments into non-guarantor subsidiaries | Uncapped investments in restricted subsidiaries | Moves value outside guarantees | LGD up for notes | Track obligor-group summary each year | L06; L23 |
| Majority loan amendment affecting liens or pro rata terms | Section 9.02 consent structure | Uptier exposure for term lenders | LGD up for non-participants; RV dispersion | Watch amendment filings | L12 |
| Payment blockage notice | Subordinated indenture blockage | Junior payment stop | PD up for subordinated notes | Watch trustee notices | L21 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| G1 | First Lien Intercreditor Agreement and joinders | Controls enforcement, standstill and release among pari classes | Intercreditor registers partial | Obtain executed agreement and joinders |
| G2 | Guarantee and Collateral Agreement, excluded-asset terms and schedules | Defines collateral scope and release | Collateral map qualitative | Obtain agreement and perfection schedules |
| G3 | Compliance certificates with covenant earnings and unrestricted cash | Required for exact headroom | All headroom proxies | Obtain latest certificate |
| G4 | Basket-usage records | Required for remaining capacity | Capacity gross, not net | Obtain usage tracker |
| G5 | Indentures for other secured and subordinated notes | Instrument terms may differ | Note-level conclusions inferred | Obtain each indenture |
| G6 | Consolidated Total Indebtedness definition | Ratio numerator | Proxy numerator | Review definition |
| G7 | Comparative covenant source | Market-norm step | Market norm not assessed | Obtain covenant-review report |

### T4C.1 Capacity source gate

| Input | Availability | Limitation |
|---|---|---|
| Legal formulas | Available from conformed credit agreement and two indentures | Schedules and exhibits not reviewed |
| Financial inputs | Financial foundation year-end and October 2024 pro forma | Reported, not covenant, earnings and cash |
| Usage data | Not supplied | Remaining capacity gross |
| Post-balance-date capacity events | October 2024 dividend payment USD 4,348 million and securitization draw USD 162.5 million | Treated as pro forma only, never as period fact |
| Module status | Completed with Limitations | Not applicable |

### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Conformed credit agreement | Credit agreement | 2024-09-19 | Executed amendment annex | Legal formula | Governs all loan baskets and tests | L02; L05; L07 | d887611dex101.htm.jsonl, pages 26–27 |
| 1 | 2033 secured notes indenture | Indenture | 2024-09-19 | Executed | Legal formula for notes | Governs bond distribution gate and consents | L17; L18 | d887611dex41.htm.jsonl, pages 70–76 |
| 3 | Compliance certificate | Covenant schedule | Not supplied | [Insufficient Information] — compliance certificate not in the source set | Usage and tested ratio | Exact headroom unavailable | L22 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Financial input | Financial foundation | Accepted financial analysis | As of 2024-09-30 | Accepted | Financial input | Reported EBITDA, debt, cash and pro forma | U1 | Financial foundation (CP-1) |
| Supporting | Annual report | Issuer filing | 2024-11-07 | Filed | Financial input and usage context | Revolver usage and guarantor summary | L22; L23; L24 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–62 |

### T4C.3 Covenant definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over trailing four-quarter Consolidated EBITDA, pro forma for acquisitions and asset sales | Covenant debt, unrestricted cash, covenant EBITDA | Drives 7.25x, 6.75x, 7.00x and 5.75x tests | Netting cash allows debt-funded cash build to pass tests | Negative — Leverage Increase | L02 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA | Secured debt, unrestricted cash, covenant EBITDA | Drives 5.00x pari secured test | Cash netting on a secured-only numerator | Negative — Leverage Increase | L02 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Net income plus taxes, interest, non-cash charges, unusual items, transaction and refinancing costs, dividend equivalents, incentive bonuses, and projected cost savings within 24 months, uncapped | Covenant ledger of add-backs | Raises revolver-test denominator | Good-faith projections inflate earnings | Negative — Covenant Erosion | L03 |
| Consolidated Net Income exclusions | Credit agreement definitions | Excludes non-recurring and integration costs, non-cash and deferred compensation, purchase accounting, impairments | Ledger of exclusions | Raises incurrence-test earnings | Recurring costs treated as excluded | Negative — Covenant Erosion | L04 |
| Unrestricted Cash | Credit agreement definitions | Unencumbered cash of Holdings, borrower and restricted subsidiaries, liens under loan documents allowed | Cash by entity and lien status | Lowers net debt | Foreign cash may count | Neutral — Stable | L09 |
| Grower base | Credit agreement baskets | Consolidated EBITDA of most recent four quarters delivered; total assets for general investments | Covenant EBITDA; total assets | Grower baskets expand with earnings and assets | Add-backs and acquisitions enlarge baskets | Negative — Covenant Erosion | L05; L06 |
| 2033 notes Consolidated Fixed Charge Coverage Ratio | 2033 indenture | Definition not reviewed | Indenture fixed charges and EBITDA | Gates unlimited bond restricted payments above 2.0x | Bond gate not computable | Insufficient Information | L17 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver springing trigger | max-ratio | 40.00% | 7.36% | Aggregate revolving exposure over revolving commitments at quarter end | 32.64% | Compliant | Letters of credit USD 67 million assumed not cash-collateralised; no revolving loans at year-end | Above the trigger the 7.50x test applies | Neutral — Stable | L01; L24; K02; K03 |
| Revolver maximum net leverage | max-ratio | 7.50x | 4.88x | Net debt over trailing earnings | 2.62x | Compliant | Proxy on reported EBITDA and all cash; 6.02x after October 2024 dividend leaves 1.48x; not active below trigger | Breach would be a revolver-only default until acceleration | Neutral — Stable | L01; U1; K05 |
| Ratio debt and incremental total net leverage | max-ratio | 7.25x | 4.88x | Pro forma net debt over trailing earnings | 2.37x | Compliant | Proxy; 6.02x after October 2024 dividend leaves 1.23x | Junior or unsecured debt up to the cap | Negative — Leverage Increase | L05; L08; U1; K06 |
| Pari secured net leverage | max-ratio | 5.00x | 3.48x | Pro forma secured debt less cash over trailing earnings | 1.52x | Compliant | Proxy excludes securitization and leases; 4.62x after October 2024 dividend leaves 0.38x | Pari dilution of first-lien collateral | Negative — Leverage Increase | L05; L08; U1; K07; K08 |
| Unlimited restricted payments total net leverage | max-ratio | 6.75x | 4.88x | Pro forma net debt over trailing earnings including financing | 1.87x | Compliant | Proxy; 6.02x after October 2024 dividend leaves 0.73x | Debt-funded distribution capacity | Negative — Leverage Increase | L07; U1; K10 |
| Unlimited investments total net leverage | max-ratio | 5.75x | 4.88x | Pro forma net debt over trailing earnings | 0.87x | Compliant | Proxy; 6.02x after October 2024 dividend exceeds the cap, so basket closed | Investment leakage while below cap | Negative — Covenant Erosion | L06; U1; K11 |
| 2033 notes unlimited restricted payments coverage | min-ratio | 2.00x | Not supplied: fixed-charge coverage inputs not disclosed | Indenture EBITDA over fixed charges | [Insufficient Information] — missing: current tested ratio and indenture fixed-charge definition | Not Calculable | Definition not reviewed | Bond gate looser than loans | Insufficient Information | L17 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Incremental facility capacity | Incremental commitments | Ratio-only | Total net at or below 7.25x and secured net at or below 5.00x; no default | Proxy secured net debt 17621 after October 2024 dividend; EBITDA 3813 | Tranche L USD 1,500 million in September 2024 | USD 1,444 million pari secured on proxy | USD 1,444 million on proxy, shared with pari secured notes | Provisional | High | Pari claims dilute collateral | Negative — Leverage Increase | L08; K09 |
| Lien capacity | Pari secured debt, clause 12 | Ratio-only | Secured net at or below 5.00x; collateral-only liens | Same as above | Not supplied: other usage | Same pool as incremental, not additive | Same pool | Provisional | High | Same pool as incremental | Negative — Leverage Increase | L05; K09 |
| Debt incurrence capacity | Junior or unsecured ratio debt, clauses 12 and 17 | Ratio-only | Total net at or below 7.25x | Pro forma net debt 22967; EBITDA 3813 | Not supplied | USD 4,677.25 million on proxy | Same, overlaps with pari capacity | Provisional | High | Releveraging behind first lien | Negative — Leverage Increase | L05; K12 |
| Debt incurrence capacity | General basket, clause 13 | Greater of USD 250 million and 10% covenant EBITDA | Borrower and guarantors | Proxy 10% of 3813 | Not supplied: usage | USD 381.30 million on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | Moderate | Small free-standing basket | Negative — Leverage Increase | L05; K13 |
| Debt incurrence capacity | Foreign subsidiary basket, clause 14 | Greater of USD 450 million and 18% covenant EBITDA | Includes subsidiary preferred stock | Proxy 18% of 3813 | Not supplied: usage | USD 686.34 million on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | Moderate | Structurally senior to notes on foreign assets | Negative — Leverage Increase | L05; K13 |
| Debt incurrence capacity | Securitization basket, clause 18 | Greater of USD 725 million and 20% covenant EBITDA | Non-recourse | Proxy 20% of 3813; facility USD 650 million fully drawn after October 2024 | USD 650 million after October 2024 draw | USD 762.60 million on proxy | USD 112.60 million on proxy | Provisional | Low | Receivables leave collateral pool | Neutral — Stable | L05; K13; K17 |
| Restricted payment capacity | Ratio route | Unlimited at total net at or below 6.75x | No default; pro forma including financing | Pro forma net debt 22967; EBITDA 3813 | USD 4,348 million October 2024 distribution already reflected | USD 2,770.75 million on proxy | USD 2,770.75 million on proxy; overlaps with debt capacity | Provisional | High | Debt-funded distributions | Negative — Leverage Increase | L07; U1; K10 |
| Restricted payment capacity | General basket, clause 7 | Greater of USD 75 million and 3% covenant EBITDA | No default | Proxy 3% of 3813 | Not supplied: usage | USD 114.39 million on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | Low | Minor leakage | Neutral — Stable | L07; K13 |
| Restricted payment capacity | Management and dividend-equivalent basket, clause 4 | Lesser of greater of USD 50 million and 2% plus carry-forward, and greater of USD 100 million and 4%, plus management equity proceeds | Annual | Proxy 2% and 4% of 3813 | Dividend equivalents USD 132 million paid October 2024, basket used not stated | USD 76.26 million and USD 152.52 million bounds on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | Low | Compensation-linked leakage | Neutral — Stable | L07; K13; U1 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries, clause 1 | Greater of USD 250 million and 10% covenant EBITDA | Designation of new subsidiaries only | Proxy 10% of 3813 | No designation identified | USD 381.30 million on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | Moderate | Value moved out of group | Negative — Covenant Erosion | L06; L09; K13 |
| Investment capacity | General investments, clause 10 | Greater of USD 500 million and 25% of total assets | None beyond amount | Proxy 25% of group total assets 25586 | Not supplied: usage | USD 6,396.50 million on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | High | Can fund transfers to any person, including a new unrestricted subsidiary | Negative — Covenant Erosion | L06; K14 |
| Investment capacity | Joint ventures, clause 11 | Greater of USD 1,000 million and 40% covenant EBITDA | Total net at or below 7.00x; no default | Proxy 40% of 3813 | Not supplied: usage | USD 1,525.20 million on proxy | [Insufficient Information] — basket usage not supplied | Formula Extracted Only | Moderate | Assets contributed outside guarantees | Negative — Covenant Erosion | L06; K13 |
| Investment capacity | Unlimited investments, clause 20 | Unlimited | Total net at or below 5.75x; no revolving loans; at least USD 200 million unrestricted cash | Proxy 6.02x after October 2024 dividend | Not supplied: usage | Closed on proxy after dividend | Closed until deleveraging | Provisional | Moderate | Reopens as leverage falls | Neutral — Stable | L06; K11 |
| Asset transfer capacity | Investments in restricted subsidiaries, clause 1 | Unlimited | None | Non-guarantor restricted subsidiaries hold about 20.73% of sales | Not supplied: intercompany flows beyond USD 1,881 million net receivable | Uncapped | Uncapped | Formula Extracted Only | High | Moves value to non-guarantors | Negative — Covenant Erosion | L06; L23; K15 |
| Investment capacity | Permitted acquisitions, clause 18 | Unlimited | No default; available liquidity at least USD 100 million; joinder of domestic targets | FY2024 acquisitions USD 2,347 million | USD 2,347 million in FY2024 | Uncapped, limited by debt covenants | Uncapped | Completed | Moderate | Debt-funded growth | Negative — Leverage Increase | L06; U2 |
| MFN protection | Yield differential | 50 bp threshold | Lapses 18 months after relevant amendment effective date; acquisition and late-maturity carve-outs | Amendment No. 17 effective date not stated | Not applicable | Not applicable | Sunset date not established | Formula Extracted Only | Moderate | Repricing dilution | Negative — Refinancing Risk | L08 |
| Guarantor / collateral release capacity | Section 9.02 and note release clauses | Release on permitted sale, Required Lenders approval for specific collateral, unanimous for near-total | Note guarantees fall away with bank releases | Not applicable | Not supplied | Not quantified | Not quantified | Formula Extracted Only | Moderate | Collateral can leave via permitted disposals | Negative — Covenant Erosion | L12; L19 |
| Maintenance covenant headroom | Springing 7.50x | Max-ratio | Above 40% usage | Usage 7.36%; proxy 4.88x | Not applicable | Trigger headroom USD 297 million of usage | Same | Ready with Limitations | Low | Low near-term breach risk | Neutral — Stable | L01; K03 |
| EBITDA add-back capacity | Projected cost savings | Uncapped within 24 months | Good faith | Not supplied: covenant ledger | Not supplied | Not quantifiable | Not quantifiable | Insufficient Information | High | Inflates every ratio | Negative — Covenant Erosion | L03 |

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental or notes | Ratio-only at 5.00x secured net | Provisional: USD 1,444 million on proxy | Shares first-lien collateral pari passu | Moderate | Dilutes all first-lien holders | First-lien spread sensitive to new issuance | L05; L08; K09 |
| Junior or unsecured ratio debt | 7.25x total net | Provisional: USD 4,677.25 million on proxy | Layers behind first lien | Higher | Neutral for first lien; dilutes subordinated notes if senior | Subordinated notes most exposed | L05; K12 |
| Foreign-subsidiary debt | Greater of USD 450 million and 18% | Formula only | Structurally senior on foreign assets | Moderate | Reduces non-guarantor value reachable by notes | All notes | L05 |
| Securitization | Greater of USD 725 million and 20% | Provisional: USD 112.60 million headroom on proxy | Receivables sold away from collateral | Low | Removes receivables from collateral | First lien | L05; K17 |
| Majority-lender uptier | Lien or payment subordination not in unanimous list | Theoretical | Majority amendment could permit priming debt; intercreditor agreement and note consents would also need changes | Neutral | Higher for non-participating term lenders | Notes better protected than loans | L12; L18 |
| Yield protection weakness | 50 bp, 18-month sunset, acquisition carve-out | Formula extracted | Later incremental loans priced wider without repricing existing loans | Neutral | Neutral | Term-loan relative value | L08 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio distributions | September 2024 recapitalisation of USD 4,348 million funded with USD 3,000 million secured debt and cash | Unlimited at 6.75x | USD 2,770.75 million remaining on proxy | Cash leaves restricted group | High | Negative — Leverage Increase | L07; U1; U2; K10 |
| Bond distribution gate | Unlimited above 2.0x fixed-charge coverage; builder basket since 2010 | Coverage test | [Insufficient Information] — coverage inputs not disclosed | Binding only if loans are repaid | Moderate | Negative — Leverage Increase | L17 |
| General investments | Greater of USD 500 million and 25% of total assets | Fixed or grower | USD 6,396.50 million on proxy; usage not supplied | Can fund a new unrestricted subsidiary | High | Negative — Covenant Erosion | L06; K14 |
| Unrestricted subsidiary investments | Greater of USD 250 million and 10% | Grower | USD 381.30 million on proxy | Value outside guarantees and collateral | Moderate | Negative — Covenant Erosion | L06; L09; K13 |
| Non-guarantor restricted subsidiaries | Unlimited investments in restricted subsidiaries | Uncapped | Uncapped | Value moves outside guarantees but stays in covenant group | High | Negative — Covenant Erosion | L06; L23 |
| Joint ventures | Greater of USD 1,000 million and 40% at 7.00x | Grower with ratio | USD 1,525.20 million on proxy | Assets contributed outside collateral | Moderate | Negative — Covenant Erosion | L06; K13 |

Routes overlap and are not additive; the general investment basket alone exceeds the other investment routes on the proxy.

### T4C.8 EBITDA add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Financial Covenant Consolidated EBITDA clause n | Uncapped; actions within 24 months; good faith; net of realised benefits | Insufficient Information: amount not disclosed | Raises revolver-test denominator without realised cash | PD up through later trip; RV negative | L03 |
| Transaction, acquisition and refinancing costs | Clauses d and e; Consolidated Net Income exclusions | Uncapped | Earnings quality rejected USD 345 million of issuer add-backs as recurring | Recurring costs excluded from covenant earnings | PD up; leverage capacity overstated | L03; L04; U3 |
| Non-cash and deferred compensation | Consolidated Net Income exclusion 11; clauses i and m | Uncapped | Included in the USD 345 million rejected by Earnings quality | Employee cost treated as excluded | Same | L04; U3 |
| Dividend equivalents | Clause j | Uncapped | USD 132 million paid October 2024 | Distribution-linked cash excluded from earnings | Same | L03; U1 |
| Pro forma acquisitions | Ratio definitions | Pro forma for acquisitions and asset sales | Not quantified | Acquired earnings counted for full period | Grows grower baskets | L02 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Unlimited ratio distributions | 6.75x test with financing included | Repeat recapitalisation | High | Moderate | Not routed here; bears on refinancing and recovery analysis | L07 |
| Reclassification of debt baskets | Borrower may divide and reclassify debt among categories | Basket capacity can be refreshed | Moderate | High | Not routed here; bears on capacity monitoring | L05 |
| Investment fungibility | Bond restricted payments may be split across clauses and Permitted Investments | Combined use across routes | Moderate | High | Not routed here; bears on leakage analysis | L17 |
| Uncapped cost savings | 24-month projections uncapped | Ratio inflation | High | High | Not routed here; bears on leverage analysis | L03 |
| Note guarantee release linkage | Release when released under credit facilities | Notes lose guarantors with lender releases | Moderate | High | Not routed here; bears on recovery analysis | L19 |
| No listed subordination protection in loans | Unanimous items omit lien and payment subordination | Uptier route | Moderate | Moderate | Not routed here; bears on security selection | L12 |

### T4C.11 Capacity risk prioritisation matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Ratio restricted payments at 6.75x | High | Moderate | Debt-funded distribution | Higher | Higher | Track declarations and leverage | L07; K10 |
| 2 | Pari secured capacity at 5.00x | High | Moderate | First-lien dilution | Moderate | Higher for first lien | Track secured incurrence | L05; K09 |
| 3 | Uncapped covenant add-backs | High | High | Inflates ratio capacity | Higher | Higher | Request covenant bridge | L03 |
| 4 | General investment basket | High | Moderate | Transfer to new entity | Neutral | Higher | Track designations and investments | L06; K14 |
| 5 | Non-guarantor value and baskets | Moderate | Moderate | Structural priority | Neutral | Higher for notes | Track obligor-group summary | L23; K15 |

### T4C.12 Capacity gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| C1 | Covenant earnings and add-back ledger | Denominator of every test | Headroom proxies only | Obtain compliance certificate |
| C2 | Unrestricted cash by entity and lien status | Numerator netting | Proxy uses all cash | Obtain cash by entity |
| C3 | Basket usage history | Remaining capacity | Gross capacity only | Obtain usage tracker |
| C4 | Consolidated Total Indebtedness definition and secured debt inventory | Numerator | Securitization and leases excluded from secured proxy | Review definition and lien schedule |
| C5 | Amendment No. 17 effective date | Yield-protection sunset | No fixed sunset date | Confirm effective date |
| C6 | Indenture fixed-charge coverage inputs | Bond distribution gate | Not calculable | Obtain indenture definitions and inputs |

### T4D.1 Structural source gate

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Conformed credit agreement guarantor and collateral clauses, d887611dex101.htm.jsonl, pages 173–174 | Executed amendment annex | 1 | Guarantee and Collateral Agreement and schedules not supplied | Completed with Limitations |
| 2033 indenture guarantee and collateral clauses, d887611dex41.htm.jsonl, pages 122 and 132 | Executed | 1 | Security documents not supplied | Completed with Limitations |
| Annual report guarantor information, TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 57–59 | Filed | Filing disclosure | Combined obligor summary, not a legal perimeter; subsidiary list exhibit not supplied | Completed with Limitations |
| First Lien Intercreditor Agreement | [Insufficient Information] — ICA not in the source set | 2 | Enforcement and release mechanics unknown | Completed with Limitations |
| Subsequent events scan | No post-balance-date guarantee release, collateral release or designation identified in pages read; October 2024 securitization draw is not a perimeter change | Not applicable | Scan limited to pages read | Completed with Limitations |

### T4D.2 Restricted and unrestricted entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor | Delaware | Not applicable: listed parent | Holdings, not a subsidiary | No significant operations or assets separate from TransDigm Inc. | Yes | L23; U2 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Borrower | Obligor group combined: current assets USD 7,813 million, goodwill USD 8,186 million | Yes | L15; L23 |
| Domestic restricted subsidiaries, including signatories such as Bruce Aerospace Inc., Calspan, LLC, Kirkhill Inc. and Korry Electronics Co. | Guarantors and grantors | United States; entity-level states not established | TransDigm Inc. or subsidiaries | Restricted | Within obligor-group totals | Yes | L10; L23 |
| TransDigm UK | Guarantor of 2028 secured notes and subordinated notes | [Insufficient Information] — jurisdiction not stated in pages read | [Insufficient Information] — parent not stated | Restricted | Within obligor-group totals | Yes for named notes | L23 |
| Foreign non-guarantor subsidiaries | Non-guarantors; 65% voting stock pledged where first-tier | Various; not established | Loan parties | Restricted | Part of USD 1,646 million sales and USD 2,233 million goodwill outside obligor group | No | L10; L23; K15; K16 |
| Immaterial domestic subsidiaries | Excluded subsidiaries | United States | Loan parties | Restricted | — | No | L10 |
| Securitization entity | Excluded subsidiary; securitization borrower | [Insufficient Information] — not stated | Not stated | Excluded | Receivables backing USD 650 million facility | No | L05; L10; L22 |
| Unrestricted subsidiaries | None identified | Not applicable | Not applicable | Only newly formed or acquired subsidiaries may be designated | — | No | L09 |
| FY2024 acquired businesses | Joinder status not established | Not established | Group | Restricted unless designated | Purchase cash USD 2,347 million | [Insufficient Information] — joinder evidence not supplied | U2; L10 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities | Senior secured | Downstream | Payment in full; release under loan documents | L11; L13 |
| Domestic restricted subsidiaries × credit facilities | Senior secured | Upstream and cross-stream | Sale to non-loan party; material guarantor release needs each lender | L10; L12 |
| TransDigm Group Incorporated × 2033 secured notes | Senior secured | Downstream | Legal or covenant defeasance or discharge | L19 |
| Domestic restricted subsidiaries × 2033 secured notes | Senior secured | Upstream and cross-stream | Permitted sale, designation as unrestricted, immateriality, or release from credit facilities and capital-markets guarantees | L19 |
| TransDigm UK × 2028 secured notes and subordinated notes | Senior secured and senior subordinated | Cross-stream | [Insufficient Information] — those indentures not in the source set | L23 |
| Holdings, TransDigm UK and domestic subsidiaries × 2027 subordinated notes | Senior subordinated, unsecured | Downstream, upstream and cross-stream | [Insufficient Information] — release clause not read | L21; L23 |
| Foreign subsidiaries × all tranches | No guarantee required | Not applicable | Not applicable | L10 |

### T4D.4 Collateral by entity and lien

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × first lien | Guarantee and Collateral Agreement terms not supplied | Automatic on permitted sale; Required Lenders for specific collateral; each lender for near-total | Not established | L12 |
| TransDigm Group Incorporated × junior lien | No junior-lien debt identified | — | — | L05 |
| TransDigm Inc. × first lien | Equity pledges limited where SEC rules would require separate subsidiary financials | Same as above; 2033 notes need two-thirds for near-total release | Mortgage and control-agreement suspension periods allow release | L10; L12; L18 |
| TransDigm Inc. × junior lien | No junior-lien debt identified | — | — | L05 |
| Domestic guarantors × first lien | Immaterial and securitization entities excluded | Release with guarantor release | Not established | L10; L12 |
| Domestic guarantors × junior lien | No junior-lien debt identified | — | — | L05 |
| Foreign subsidiaries × first lien | Assets not pledged; only 65% voting and 100% non-voting stock of first-tier foreign subsidiaries | Not applicable | Foreign documents amendable by agent for local law | L10; L12 |
| Foreign subsidiaries × junior lien | No junior-lien debt identified | — | — | L05 |
| Securitization entity × first lien | Receivables sold to the entity outside collateral | Not applicable | Not applicable | L05; L10 |
| Securitization entity × junior lien | Not applicable | — | — | L05 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc. with Holdings and domestic guarantors | Obligor-group assets and pledged equity | Pari | Non-guarantor assets beyond the 65% foreign equity pledge | Shares collateral with secured notes; behind non-guarantor creditors on foreign value | Moderate | L10; L23 |
| Secured notes | Same obligors | Same collateral | Pari | Same; plus value moved by permitted investments | Equal with loans; holder-level consent protection | Moderate | L16; L18; L23 |
| Secured notes and loans | Same obligors | Non-guarantor subsidiary value | Structurally Subordinated — Non-Guarantor Value | About USD 1,646 million of sales and USD 2,233 million of goodwill outside obligor group | Recovery on that value only through equity and intercompany claims of USD 1,881 million | Moderate | L23; K15; K16 |
| Senior subordinated notes | TransDigm Inc. with guarantors | Residual after senior debt | Contractually Subordinated | Same non-guarantor value | Turnover to senior debt until paid in full in cash | High | L21; L23 |
| Securitization debt | Securitization entity | Sold receivables | Structurally Senior | Receivables outside collateral | Senior on receivables | Moderate | L05 |
| Foreign-subsidiary debt | Foreign restricted subsidiaries | Foreign assets | Structurally Senior | Foreign assets | Senior to all notes on foreign value | Moderate | L05 |

### T4D.6 Leakage-route register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Drop-down to new unrestricted subsidiary | Loan party to newly formed subsidiary, then designation | General investments and unrestricted-subsidiary investment baskets | Up to USD 6,396.50 million basket on proxy | 4 | Value leaves guarantees and collateral | Theoretical | L06; L09; K14 |
| Transfer to non-guarantor restricted subsidiary | Loan party to foreign or immaterial subsidiary | Unlimited investments in restricted subsidiaries | Uncapped | 4 | Notes and loans structurally behind non-guarantor creditors | Theoretical | L06 |
| Distribution to equity | Borrower to Holdings to shareholders | Ratio restricted payments | USD 2,770.75 million on proxy | 4 | Reduces assets and raises claims | Demonstrated in September 2024 | L07; U2; K10 |
| Joint venture contribution | Loan party to joint venture | Joint venture basket at 7.00x | USD 1,525.20 million on proxy | 3 | Assets outside collateral | Theoretical | L06; K13 |
| Asset sale out of group | Loan party to third party | Asset sale covenant and automatic lien release | Not quantified | 3 | Collateral released on permitted sale | Theoretical | L12 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by majority lenders | Unanimous-consent list omits lien and payment subordination | Non-participating term and revolving lenders | Theoretical | Majority could permit senior debt if intercreditor and note consents allow | Low | L12 |
| Non-pro-rata exchange | Class-wide non-pro-rata offers permitted by Required Lenders | Term lenders | Theoretical; offers must go to all lenders of a class | Limits selective exchanges | Moderate | L12 |
| Pari secured layering | Agent must add pari liens once 5.00x is met | All first-lien holders | Demonstrated in September 2024 | Dilution, not priming | High | L05; L12; L15 |
| Trapdoor through new subsidiary | General investments plus designation | All secured creditors | Theoretical | Could support structurally senior debt at the new entity | Low | L06; L09 |
| Note protection | Each holder must consent to ranking change; two-thirds for collateral and intercreditor changes | Secured noteholders | Documentary | Notes harder to prime than loans | High | L18 |

### T4D.8 Structural gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| S1 | Guarantor list exhibit to the annual report | Exact guarantor perimeter | Entity register partly generic | Obtain subsidiary guarantor exhibit |
| S2 | Guarantee and Collateral Agreement | Collateral scope and excluded assets | Collateral matrix qualitative | Obtain agreement |
| S3 | Entity-level assets, earnings and debt | Stranded-value sizing | Only obligor-group summary used | Obtain entity data |
| S4 | Joinders for FY2024 acquisitions | Guarantor coverage of new businesses | Coverage of acquired value not established | Obtain joinders |
| S5 | TransDigm UK jurisdiction and parent | Guarantee enforceability | Jurisdiction not stated | Obtain subsidiary list |

### T4F.1 Controlling intercreditor documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders No. 1 to No. 6 | TransDigm Inc., Holdings, subsidiary guarantors, credit agreement collateral agent, secured-note trustees and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced, not supplied | 2033 indenture definition | L16 | d887611dex41.htm.jsonl, page 30 |
| Conformed credit agreement | TransDigm Inc., Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2024-09-19 | New York | Executed amendment annex | Agent and amendment clauses | L12; L13; L14 | d887611dex101.htm.jsonl, pages 197–222 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, guarantors, The Bank of New York Mellon Trust Company, N.A. as trustee | 2024-09-19 | New York | Executed | Amendment, guarantee and collateral clauses | L18; L19; L20 | d887611dex41.htm.jsonl, pages 116–132 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, trustee | 2019-11-13 | [Insufficient Information] — governing law clause located but wording not read | Executed | Subordination article | L21 | d826058dex41.htm.jsonl, pages 106–107 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders, USD 910 million commitments | First lien, pari | Shared collateral | Through agent; sole beneficiaries of the springing covenant | Part of Required Lenders; Required Revolving Lenders control the covenant | L01; L12 |
| Term lenders, USD 8,702 million | First lien, pari | Shared collateral | Through agent by Required Lenders | Majority of loans and commitments | L12; L24 |
| Secured noteholders, USD 11,000 million across six series | First lien, pari | Shared collateral under the intercreditor agreement | Through trustee and collateral agents | [Insufficient Information] — ICA not in the source set | L16; L20; K18 |
| Subordinated noteholders, USD 4,600 million across three series | Contractually subordinated, unsecured | None | Subject to blockage and turnover | Not applicable to senior decisions | L21; K18 |
| Securitization lenders, USD 650 million facility | Structurally senior on receivables | Receivables at securitization entity | Under facility agreement, not supplied | Not applicable | L05; L22 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement among pari classes | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set; agent named as Applicable Collateral Agent | Term lenders, revolving lenders and secured noteholders | Controlling class could time enforcement against other pari holders | Insufficient Information | L16; L20 |
| Credit agreement collateral | No standstill stated in credit agreement | Event of default | Agent has sole right to proceed; Required Lenders direct | All loan lenders | Individual lenders cannot enforce | Neutral — Stable | L13 |
| Revolver financial covenant default | Term lenders cannot act until revolving lenders terminate commitments or accelerate | Breach of springing covenant | Required Revolving Lenders | Term lenders and noteholders through cross-default | Revolving class controls timing | Negative — Covenant Erosion | L01; L11 |
| Subordinated payment blockage | Up to 179 days; one per 360 days; 181 days free in any 360 days | Non-payment default on designated senior debt and blockage notice | Representative of designated senior debt; bank debt may give a second notice | Subordinated noteholders | Junior payment stops while senior decides | Negative — Liquidity Deterioration | L21 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Subordinated notes in insolvency | Payments to subordinated holders go to senior debt until paid in full in cash, except subordinated securities | Not applicable | None identified | Liquidation or reorganisation | Holders may keep equivalently subordinated securities | L21 |
| Credit agreement collateral release | Not applicable | Automatic on permitted disposal; Required Lenders for specific collateral; each lender for near-total | None identified | Compliance with credit agreement | Mortgage and control-agreement suspensions also release | L12 |
| 2033 notes collateral release | Not applicable | Two-thirds of holders for near-total release or adverse intercreditor change | None identified | Other releases per indenture and security documents | Holder-level ranking protection | L18 |
| 2033 notes guarantor release | Not applicable | Automatic on release under credit facilities and capital-markets guarantees | None identified | Permitted sale or designation | Reinstated if bank guarantee reinstated | L19 |
| First-lien intercreditor turnover and purchase options | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Note consents limit adverse changes | L16; L18 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Pari share of first-lien collateral via agent | No listed subordination protection; enforcement order with notes unknown | Moderate | Majority amendments or new pari debt dilute recovery | Negative — Covenant Erosion | L12; L16 |
| Revolving lenders | Same collateral; covenant control | Covenant protection only when usage above 40% | Low | Early-warning only for revolving class | Neutral — Stable | L01 |
| Secured noteholders | Pari share via collateral agents | Do not control enforcement absent intercreditor terms | Moderate | Enforcement timing set by controlling representative | Insufficient Information | L16; L20 |
| Subordinated noteholders | Residual after senior debt; turnover | Payment blockage and turnover | High | Senior claims absorb value first | Negative — Liquidity Deterioration | L21 |

### T4F.6 Intercreditor gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| I1 | First Lien Intercreditor Agreement text | Controlling representative, standstill, turnover and voting | Enforcement control not established | Obtain agreement and joinders |
| I2 | Security documents | Collateral scope and release | Collateral map qualitative | Obtain security documents |
| I3 | 2027 indenture governing-law wording | Jurisdiction of subordination terms | Jurisdiction not confirmed | Read governing-law clause |

### Material claim lineage

| Claim | Material claim | Strongest lineage | Source |
|---|---|---|---|
| M1 | Unlimited restricted payments at 6.75x with financing included | Directly Sourced | d887611dex101.htm.jsonl, page 181 |
| M2 | 2033 notes allow unlimited payments above 2.0x coverage | Directly Sourced | d887611dex41.htm.jsonl, page 75 |
| M3 | Incremental capacity ratio-only at 7.25x and 5.00x | Directly Sourced | d887611dex101.htm.jsonl, page 146 |
| M4 | Yield protection 50 bp with 18-month sunset | Directly Sourced | d887611dex101.htm.jsonl, pages 143–145 |
| M5 | Springing revolver-only covenant | Directly Sourced | d887611dex101.htm.jsonl, page 188 |
| M6 | Uncapped projected cost-savings add-back | Directly Sourced | d887611dex101.htm.jsonl, pages 41–42 |
| M7 | Unanimous-consent list and note sacred rights | Directly Sourced | d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 117–118 |
| M8 | Subordinated payment blockage up to 179 days | Directly Sourced | d826058dex41.htm.jsonl, page 107 |
| M9 | Non-guarantor share of sales 20.73% | Calculated | calculation K15 |
| M10 | Distribution capacity USD 2,770.75 million on proxy | Calculated | calculation K10 |
| M11 | Pari secured capacity USD 1,444 million on proxy | Calculated | calculation K09 |
| M12 | General investment basket USD 6,396.50 million on proxy | Calculated | calculation K14 |
| M13 | Loans exposed to majority uptier in theory | Analyst Inference | d887611dex101.htm.jsonl, pages 204–205 |
| M14 | Loans, not bonds, set the binding distribution limit | Analyst Inference | d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75 |
| M15 | Enforcement control among pari classes | Insufficient Information | d887611dex41.htm.jsonl, page 30 |
| M16 | Exact covenant headroom and basket usage | Insufficient Information | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |

### Verification

| Register group | Result | Note |
|---|---|---|
| Legal and covenant registers | PASS | Present with declared columns and rows; gaps logged |
| Restricted-group registers | PASS | Every entity and lien tier rowed; undisclosed values shown as a dash |
| Intercreditor registers | PASS | Missing agreement written as an explicit gap in each dependent cell |
| Capacity registers | PASS | Proxies labelled; missing usage not treated as zero |

## Calculations

All amounts are USD millions for TransDigm consolidated unless stated; multiples are times. Every leverage figure is an analytical proxy on reported FY2024 EBITDA and Financial foundation cash and debt, not a covenant calculation, and October 2024 figures are standalone pro forma adjustments, not closing balances. Capacity figures assume unchanged earnings and that new debt proceeds are spent rather than held as cash; debt, lien and distribution capacities overlap and are not additive.

| ID | Period / quantity | Operation and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| K01 | Springing trigger amount at 2024-09-30 | 910 × 0.40 | 364.00 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59 and 62 |
| K02 | Revolving exposure share at 2024-09-30 | 67 / 910 = 0.0736263736; displayed as 7.36% | 7.36% | % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K03 | Trigger headroom | 40.00 − 7.36; 364 − 67 | 32.64%; USD 297 million | %; USD million | calculation K01; calculation K02 |
| K04 | Revolver availability cross-check | 910 − 67 | 843, equal to reported availability | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K05 | Revolver net leverage headroom | 7.50 − 4.88; after October 2024 dividend 7.50 − 6.02 | 2.62x; 1.48x | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 188 |
| K06 | Ratio debt headroom | 7.25 − 4.88; 7.25 − 6.02 | 2.37x; 1.23x | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 146 |
| K07 | Secured net leverage at year-end | 19534 − 6261 = 13273; 13273 / 3813 = 3.4809861; 5.00 − 3.48 | 3.48x; headroom 1.52x | x | Financial foundation (CP-1) |
| K08 | Secured net leverage after October 2024 dividend | 19534 − 1913 = 17621; 17621 / 3813 = 4.6212956; 5.00 − 4.62 | 4.62x; headroom 0.38x | x | Financial foundation (CP-1) |
| K09 | Pari secured capacity after dividend | 5.00 × 3813 = 19065; 19065 − 17621 | 1444 | USD million | calculation K08 |
| K10 | Restricted payment headroom and capacity | 6.75 − 4.88; 6.75 − 6.02; 6.75 × 3813 = 25737.75; 25737.75 − 22967 | 1.87x; 0.73x; 2770.75 | x; USD million | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 181 |
| K11 | Unlimited investment headroom | 5.75 − 4.88; 5.75 − 6.02 | 0.87x; −0.27x | x | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 63 |
| K12 | Junior or unsecured ratio capacity after dividend | 7.25 × 3813 = 27644.25; 27644.25 − 22967 | 4677.25 | USD million | Financial foundation (CP-1) |
| K13 | Grower baskets on reported EBITDA 3813 | 10% = 381.30; 18% = 686.34; 20% = 762.60; 3% = 114.39; 40% = 1525.20; 2% = 76.26; 4% = 152.52 | As listed; each above its fixed floor except the 2% and 3% baskets, where USD 50 million and USD 75 million floors are lower | USD million | d887611dex101.htm.jsonl, pages 59–62; d887611dex101.htm.jsonl, pages 179–180 |
| K14 | General investment basket | 25586 × 0.25 | 6396.50 | USD million | Financial foundation (CP-1); d887611dex101.htm.jsonl, page 62 |
| K15 | Sales outside obligor group | 7940 − 6294 = 1646; 1646 / 7940 = 0.2073048 | 1646; 20.73% | USD million; % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K16 | Goodwill outside obligor group | 10419 − 8186 | 2233 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K17 | Securitization basket headroom | 762.60 − 650 | 112.60 | USD million | calculation K13; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K18 | Class principal totals | Secured notes 2100 + 2750 + 1450 + 1000 + 2200 + 1500; subordinated 2650 + 1200 + 750; term loans 1871 + 3632 + 1699 + 1500 | 11000; 4600; 8702 | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |

The obligor-group sales comparison is approximate because the combined summary also shows USD 28 million of sales to non-guarantors and eliminates intercompany items differently from the consolidated statements.

## Gaps

These gaps restrict exact headroom, enforcement-control and perimeter conclusions; they do not change the provision-level reading of the documents reviewed.

| Gap | Missing evidence | Why it matters | Conclusion affected | Source |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement and six joinders | Controlling representative, standstill, turnover, purchase rights | Enforcement control among pari classes not established | d887611dex41.htm.jsonl, page 30 |
| Covenant earnings and cash | Compliance certificate, covenant earnings bridge, unrestricted cash by entity | Exact headroom | All headroom and capacity figures are proxies and likely floors | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Basket usage | Usage tracker for debt, investment and restricted payment baskets | Remaining capacity | Capacity stated gross | d887611dex101.htm.jsonl, pages 59–63 |
| Yield-protection sunset date | Amendment No. 17 effective date | Sunset runs 18 months from that date; no fixed deadline is set here | Sunset recorded only as a relative condition | d887611dex101.htm.jsonl, pages 144–145 |
| Other indentures | Indentures for the 2028 to 2032 secured notes and both 2029 subordinated notes | Terms may differ | Note-level conclusions inferred from two indentures | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| Security documents and guarantor list | Guarantee and Collateral Agreement, schedules, subsidiary guarantor exhibit, joinders for FY2024 acquisitions | Collateral scope and perimeter | Collateral and entity maps partly generic | d887611dex101.htm.jsonl, pages 173–174 |
| Market comparison | Covenant-review or market-norm source | Relative assessment | Market-norm step not assessed | Not supplied: no comparative source in the source set |

## Next module
The orchestrator selects the next module.
