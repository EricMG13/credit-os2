## Request
TransDigm Group Incorporated (issuer ID tdg), legal and covenant review as of 2024-09-30 under the deep_credit_assessment pathway. Scope covers the controlling credit agreement, the 2033 secured notes indenture and the 2027 subordinated notes indenture: covenant architecture, definitions, debt, lien and distribution capacity, guarantee and collateral reach, events of default, amendment and intercreditor control, and their default-risk and recovery effects.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07 | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of covenants, springing revolver test and compliance statement, guarantor perimeter and combined guarantor financial summary, revolver and term-loan terms, securitization collateral, dividend payment date |
| d887611dex101.htm.jsonl | Amendment No. 17 and incremental term loan assumption agreement dated 19 September 2024, with the annexed conformed Second Amended and Restated Credit Agreement | not stated | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling bank definitions, financial covenant, draw condition, debt, lien, investment, restricted-payment and unrestricted-subsidiary provisions, incremental and MFN terms, collateral joinder and pledge terms, events of default, amendment thresholds, governing law |
| d887611dex41.htm.jsonl | Indenture for the 6.000% senior secured notes due 2033, execution version dated 19 September 2024 | not stated | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Restricted payments, lien ratio, intercreditor reference, guarantee and collateral releases, amendment thresholds, governing law |
| d826058dex41.htm.jsonl | Indenture for the 5.500% senior subordinated notes due 2027, dated 13 November 2019 | not stated | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Payment blockage and subordination mechanics |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Source set, agreement dates of legal documents, retrospective boundary, missing-document inventory |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Debt instruments, carrying and principal amounts, EBITDA As Defined, post-dividend pro forma net debt and leverage, guarantor scope by instrument |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation size and funding, issuer and borrower identity, extraction behaviour |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence of acquisition, compensation and refinancing add-backs used to test covenant EBITDA inflation |

## Findings

### Bottom line
TransDigm's covenant package protects secured creditors on payment rank and collateral breadth but gives equity ratio-based room to extract value: unlimited dividends below 6.75x net leverage under the bank agreement and above 2.0x coverage under the 2033 notes, with only a springing revolver test. Default risk therefore runs through releveraging and distributions rather than a covenant trip; the September recapitalisation used the package to add USD 3,000 million of secured debt for a USD 4,348 million distribution. Recovery risk runs through pari secured dilution and through releases that the secured notes inherit from the bank lenders.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex41.htm.jsonl, pages 75–76; d887611dex101.htm.jsonl, page 188; d887611dex41.htm.jsonl, pages 136–137; Business & governance (CP-1A)

Protections are real but narrow: subordinated noteholders face at most 179 days of payment blockage, only newly formed or acquired subsidiaries can be made unrestricted, and releasing substantially all bank collateral needs every lender. Current covenant ratios, basket usage and the first-lien intercreditor agreement are not in the documents, so numerical headroom is not established.
Basis: d826058dex41.htm.jsonl, page 107; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Key findings
- **Maintenance protection is revolver-only, springing and far from triggering, so it will not give early warning.** The 7.50x net leverage test (8.00x for four quarters after an acquisition above USD 300 million) applies only when revolver exposure exceeds 40% of commitments, or USD 364 million. At year-end exposure was letters of credit of USD 67 million, 7.36% of commitments, leaving 32.64% of commitments before the test springs. A financial-covenant default reaches term lenders only after revolving lenders accelerate or terminate, and the 35% draw condition will stop new revolver borrowing before the test is ever measured. The first observable trip-wire is revolver availability, not a covenant breach.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 165; d887611dex101.htm.jsonl, page 52; d887611dex101.htm.jsonl, page 191; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59 and 62; calculation L1; calculation L2; calculation L3
- **Distribution capacity is ratio-based and effectively uncapped in amount; the bank 6.75x test is the binding constraint.** The credit agreement permits any restricted payment at or below 6.75x net leverage with no default. The 2033 notes permit any restricted payment above 2.0x fixed-charge coverage, and payments made that way do not reduce the builder basket of USD 400 million plus 50% of cumulative net income since 1 October 2010. Financial foundation's post-dividend net leverage of 6.02x on reported EBITDA after the 18 October 2024 payment is not the covenant ratio. Covenant EBITDA adds back recurring costs and projected savings, so the covenant ratio would sit lower than that measure, but covenant headroom is not established.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex41.htm.jsonl, pages 69–70; d887611dex41.htm.jsonl, pages 75–76; d887611dex101.htm.jsonl, pages 41–42; Financial foundation (CP-1)
- **Covenant EBITDA inflates every ratio test.** Both the general and the financial-covenant EBITDA definitions add back uncapped projected cost savings from actions within 24 months. They also add back non-cash and deferred compensation, acquisition and integration costs, refinancing costs and dividend-equivalent payments. Earnings quality found these cost categories recur every year. Each add-back raises debt, lien and dividend capacity at the same time.
Basis: d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, pages 25–26; Earnings quality (CP-1D)
- **Pari secured dilution is the main recovery threat.** New first-lien debt is permitted up to 5.00x secured net leverage under the bank agreement, and the 2033 notes allow liens on ratio debt up to 5.25x. Junior or unsecured debt is permitted up to 7.25x, with a general basket of the greater of USD 250 million and 10% of covenant EBITDA. Incremental term loan pricing protection is 50 bp. For Tranche L it ends 18 months after the Amendment No. 17 effective date and excludes acquisition financings. The agent may add pari or junior intercreditor terms without lender consent.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 43; d887611dex101.htm.jsonl, page 144; d887611dex101.htm.jsonl, page 205; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62
- **Secured noteholders do not control their own collateral.** The 2033 notes' liens are released whenever the bank collateral agent releases its lien, other than on a full cash discharge of the bank debt outside enforcement. A guarantee falls away once the guarantor is released under the credit facilities and other capital-markets debt. The guarantor group generated 79.27% of consolidated net sales. That leaves an indicative USD 1,646 million of sales in non-guarantor subsidiaries, whose creditors rank structurally ahead. Only 65% of voting equity in first-tier foreign subsidiaries is pledged.
Basis: d887611dex41.htm.jsonl, pages 136–137; d887611dex41.htm.jsonl, page 122; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, page 174; calculation L6; calculation L7
- **Amendment protection against non-pro-rata treatment is partial.** Every bank lender must consent to change pro rata sharing, to release substantially all collateral or to release a material guarantor. However, Required Lenders can authorise non-pro-rata prepayment offers made to a whole class. Subordination of the bank liens does not appear among the all-lender matters in the clauses reviewed. An uptier is therefore theoretically possible, not demonstrated. The 2033 notes need two-thirds of holders to release substantially all collateral or adversely change the intercreditor agreement, and each holder to change ranking.
Basis: d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 117–118

### Contrary evidence and what would change the view
The strongest evidence against an aggressive reading is structural. Only newly formed or newly acquired subsidiaries can be made unrestricted, so existing guarantors cannot be dropped out of the group by designation. Investments in unrestricted subsidiaries are capped at the greater of USD 250 million and 10% of covenant EBITDA. Every lender must consent to release substantially all collateral or change pro rata sharing. Subordinated notes can be blocked for at most 179 days in any 360-day period. All funded senior debt is first-lien and guaranteed by every domestic restricted subsidiary, which narrows the classic drop-down and trapdoor routes. The issuer also states it complied with all debt covenants at year-end. The view would soften to market-standard if a compliance certificate showed covenant net leverage close to 6.75x, which would leave little room for further ratio dividends. It would also soften if the intercreditor agreement gave secured noteholders independent enforcement and release protection, or if usage records showed the general investment and debt baskets largely consumed by ordinary-course items. It would harden if a further debt-funded distribution, a new unrestricted-subsidiary investment or a Required Lenders amendment touching lien priority appeared.
Basis: d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, page 61; d887611dex101.htm.jsonl, pages 204–205; d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58 and 62

### Limitations
- No compliance certificate or covenant EBITDA calculation was supplied, so the distance to the 7.50x, 6.75x, 7.25x and 5.00x tests is not established. The nearest pressure point is therefore chosen on demonstrated use and revolver usage, not on ratio distance. A covenant calculation could move the dividend-capacity judgement in either direction.
- The first-lien intercreditor agreement dated 13 February 2019 and its six joinders are not in the documents. Who directs enforcement, any standstill between bank lenders and secured noteholders, turnover and purchase options are therefore not established. The recovery-control conclusions for secured noteholders rest only on the release mechanics in the 2033 indenture.
- Only the 2033 secured and 2027 subordinated indentures were read. Restricted-payment, release and amendment conclusions for the notes apply to those two series only. The 2028 to 2032 secured and both 2029 subordinated series may carry different ratio tests or sacred rights.
- The guarantee and collateral agreement, security schedules and excluded-asset definitions are absent. Collateral reach is stated by entity class and pledge percentage only, and pledged value by entity is not established, which leaves the recovery-access ranking qualitative.
- The credit-agreement review was targeted. The definitions of consolidated total indebtedness, required lenders and total assets, and the amendment clauses after the all-lender list, were not read. Whether securitization funding and customer advances count in covenant debt is unresolved, and the voting-threshold side of the uptier assessment remains provisional.
- No basket-usage records were supplied. Remaining capacity under the general debt, general investment, joint-venture, restricted-payment and builder baskets is not established, so all capacity statements are formula-level.

### Covenant-implication summary
The package's protections sit in payment rank, collateral breadth and limits on designating subsidiaries as unrestricted. Its weaknesses sit in ratio-based distribution, pari debt capacity and release authority held by the bank lenders.

| Provision area | What the documents permit | Creditor mechanism | Channel | Monitoring trigger |
|---|---|---|---|---|
| Maintenance test | 7.50x net leverage, revolver only, springing above 40% usage | Late warning; term and notes have no maintenance test | Default risk | Revolver exposure above USD 318.50 million (35%) |
| Distributions | Unlimited at 6.75x (bank) and above 2.0x coverage (2033 notes) | Cash and new debt leave the group with no amount cap | Default and recovery risk | Board dividend declaration; new incremental debt |
| Pari secured debt | First-lien debt to 5.00x secured net (bank), 5.25x lien ratio (notes) | Dilutes existing first-lien recovery | Recovery risk | Incremental joinders; ICA joinders |
| EBITDA definition | Uncapped 24-month cost savings and recurring add-backs | Raises every ratio-based capacity | Default and recovery risk | Covenant EBITDA versus EBITDA As Defined |
| Releases | Notes liens and guarantees follow bank releases | Noteholders lose collateral without a vote | Recovery risk | Guarantor releases; asset sales |
| Subordinated notes | 179-day blockage; contractual subordination | Junior class absorbs losses first | Recovery risk | Blockage notice from bank representative |

### Provision-level read
The definitions make covenant capacity larger than reported earnings imply. Consolidated net income excludes non-recurring charges, acquisition integration costs, early-extinguishment losses, non-cash and deferred compensation and purchase-accounting effects. Covenant EBITDA then adds back taxes, interest, non-cash charges, transaction and refinancing costs, dividend-equivalent payments, incentive-plan costs and uncapped projected savings from actions within 24 months. Net leverage nets all unrestricted cash with no cap. Because the debt, lien, investment and dividend ratio tests share these definitions, each add-back raises every capacity at once. Earnings quality found the acquisition, compensation and refinancing categories recur, so the covenant denominator is structurally above a recurring-credit denominator. Customer advances and securitization funding may sit outside the covenant debt numerator, but that definition was not reviewed.
Basis: d887611dex101.htm.jsonl, pages 25–27; d887611dex101.htm.jsonl, pages 41–42; d887611dex101.htm.jsonl, page 81; Earnings quality (CP-1D)

Debt capacity is mainly ratio-driven. Pari first-lien debt is limited by the 5.00x secured net test, and junior-lien or unsecured debt and subordinated debt by 7.25x net leverage. Incremental term loans and revolving commitments carry the same 7.25x and 5.00x tests. Fixed-or-grower baskets add the greater of USD 250 million and 10% of covenant EBITDA for borrower and guarantor debt, and the greater of USD 450 million and 18% for foreign restricted subsidiaries. Securitization funding is allowed up to the greater of USD 725 million and 20% of covenant EBITDA. The borrower may classify and reclassify debt across categories at its sole discretion, and acquisition ratio tests are measured when definitive documents are signed. Foreign-subsidiary debt sits structurally ahead of all TransDigm Inc. creditors on those subsidiaries' assets.
Basis: d887611dex101.htm.jsonl, pages 59–61; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

Leakage capacity combines ratio dividends with broad investment baskets. The bank agreement allows general investments up to the greater of USD 500 million and 25% of total assets. It allows joint-venture investments up to the greater of USD 1,000 million and 40% of covenant EBITDA at 7.00x, and unlimited further investments at 5.75x if no revolving loans are drawn and unrestricted cash is at least USD 200 million. Investments in any restricted subsidiary, including non-guarantor foreign subsidiaries, are uncapped. Permitted acquisitions need only no default and USD 100 million of available liquidity. The general dividend basket adds the greater of USD 75 million and 3% of covenant EBITDA. The demonstrated use is the USD 4,348 million October distribution, which the issuer funded partly with new secured debt.
Basis: d887611dex101.htm.jsonl, pages 61–63; d887611dex101.htm.jsonl, pages 180–181; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63; Business & governance (CP-1A)

Events of default are bank-friendly on cross-default but weak as a maintenance discipline. Failure to pay other borrowed-money debt above USD 50 million, or any event that lets such holders accelerate, is a default under the bank agreement. Restrictive-covenant breaches are defaults without a stated cure period in the clause reviewed, and loss of subordination of the subordinated notes is itself a default. Because the only financial test is revolver-only, term lenders and noteholders depend on payment, cross-default and insolvency triggers. In practice their default trigger is late, typically when liquidity is already impaired.
Basis: d887611dex101.htm.jsonl, page 189; d887611dex101.htm.jsonl, pages 190–191; d887611dex101.htm.jsonl, page 52

Recovery control is split, and the controlling intercreditor document is missing. Bank lenders hold release authority that the 2033 notes follow automatically, and the agent can enter pari or junior intercreditor arrangements for new permitted secured debt without lender consent. Subordinated noteholders are contractually junior to designated senior debt and can be blocked from payment for up to 179 days after a blockage notice, once in any 360-day period. Enforcement direction among first-lien classes is not established, so no class-level recovery percentage follows.
Basis: d887611dex41.htm.jsonl, pages 136–137; d887611dex41.htm.jsonl, page 30; d887611dex101.htm.jsonl, page 205; d826058dex41.htm.jsonl, page 107

The nearest pressure point is pari secured debt capacity under the bank agreement's 5.00x secured net leverage test. The maintenance test is untriggered and not near breach, so the selection moves to debt and lien capacity that can dilute existing creditors. That capacity has just been used: USD 3,000 million of new first-lien term loans and notes funded most of a distribution, and the 6.75x dividend permission lets further secured borrowing leave the group as equity cash. The credit consequence is higher default risk through a heavier fixed-charge burden and lower first-lien recovery through dilution of the same collateral. Further incremental joinders, new intercreditor joinders, board dividend declarations and quarterly covenant EBITDA are the signals to watch. A compliance certificate showing covenant secured net leverage and the usage of each basket is the evidence needed to tighten the view.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 30; Business & governance (CP-1A); Financial foundation (CP-1)

### Downside path and monitoring
A slowdown in commercial aftermarket demand while distributions continue would first show as lower operating cash generation. Covenant EBITDA would fall more slowly than cash because projected savings and recurring costs are added back. The borrower could then keep borrowing at the ratio limits while cash cover weakens. Liquidity would tighten as revolver use rises; above 35% usage new draws need the 7.50x test to be met, and above 40% the test binds at quarter-end. Only then do term lenders and noteholders gain a default lever, and only through revolver acceleration or cross-default. At that point the first-lien pool would already be shared with any pari debt added under the 5.00x test. The observable triggers are revolver exposure approaching USD 318.50 million, dividend declarations, new incremental or intercreditor joinders, guarantor releases and any gap between covenant EBITDA and reported EBITDA.
Basis: d887611dex101.htm.jsonl, page 165; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; d887611dex101.htm.jsonl, pages 41–42; calculation L4

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package, scored four on a five-point scale on a provisional basis. The score rests on revolver-only springing maintenance, ratio-based uncapped distributions, uncapped projected-savings add-backs and pari secured incurrence to 5.00x. The main protections are first-lien rank for all funded senior debt, domestic guarantor coverage, limits on unrestricted designation and all-lender protection on sharing and collateral release. The primary default-risk path is debt-funded distributions that raise fixed charges without earnings. The primary recovery-risk path is pari dilution of collateral together with releases that secured noteholders inherit from the bank lenders. For security selection, the most important legal point is that the 2033 notes sit pari with term loans in payment and collateral but without control over releases, while subordinated notes are contractually last among funded debt. Further analysis requires the intercreditor agreement, the other indentures, the guarantee and collateral agreement, and compliance certificates with basket usage. The legal and covenant review is completed with limitations.
Basis: d887611dex101.htm.jsonl, pages 180–181; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, pages 204–205; d887611dex41.htm.jsonl, pages 136–137; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58

Covenant-capacity visibility is limited. The main capacity concern is pari secured debt paired with ratio dividends, because it moves value to equity while diluting first-lien recovery. Exact headroom is supported only for the revolver usage trigger. Further analysis requires covenant EBITDA, covenant debt and basket usage.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 181; calculation L3

### Capital structure

| Instrument | Principal | Rank and security | Governing document in this review | Source |
|---|---|---|---|---|
| Term loans, Tranches I–L | USD 8,702 million | First lien; equal payment rank with secured notes | Credit agreement as amended by Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Revolving credit facility | USD 910 million commitments; USD 67 million letters of credit; undrawn loans | First lien; matures 2029-02-27 | Credit agreement as amended by Amendment No. 17 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2028 and 2029 secured notes | USD 4,850 million | First lien; pari with credit facilities | Not supplied: indentures not in the documents | Financial foundation (CP-1) |
| 2030, 2031 and 2032 secured notes | USD 4,650 million | First lien; pari with credit facilities | Not supplied: indentures not in the documents | Financial foundation (CP-1) |
| 2033 secured notes | USD 1,500 million | First lien; pari with credit facilities | 2033 secured notes indenture | Financial foundation (CP-1); d887611dex41.htm.jsonl, page 30 |
| 2027 subordinated notes | USD 2,650 million | Unsecured; contractually subordinated | 2027 subordinated notes indenture | Financial foundation (CP-1); d826058dex41.htm.jsonl, page 107 |
| January and May 2029 subordinated notes | USD 1,950 million | Unsecured; contractually subordinated | Not supplied: indentures not in the documents | Financial foundation (CP-1) |
| Trade receivable securitization | USD 487.5 million drawn of USD 650 million at year-end | Secured on domestic trade receivables; structurally separate | Not supplied: facility agreement not in the documents | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 62–63 |

### Covenant tests and headroom

| Test | Document | Threshold | Current position | Creditor consequence | Source |
|---|---|---|---|---|---|
| Springing net leverage, revolver only | Credit agreement | 7.50x (8.00x after a Material Acquisition) when revolver exposure exceeds 40% | Untriggered; covenant ratio not disclosed; issuer states compliance | No term or notes maintenance protection | d887611dex101.htm.jsonl, page 188 |
| Revolver usage trigger | Credit agreement | 40% of commitments | 7.36% (letters of credit); headroom 32.64% | Test far from springing | calculation L1; calculation L3 |
| Revolver draw condition | Credit agreement | 35% of commitments, then 7.50x on latest quarter | 7.36%; headroom 27.64% | Liquidity trip-wire precedes covenant | d887611dex101.htm.jsonl, page 165 |
| Ratio dividends | Credit agreement; 2033 notes | 6.75x net leverage; above 2.0x coverage | Not supplied: covenant ratios not disclosed | Uncapped equity distributions within ratio | d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75 |
| Ratio debt and liens | Credit agreement; 2033 notes | 7.25x net; 5.00x secured net; 5.25x notes lien ratio | Not supplied: covenant ratios not disclosed | Pari and junior dilution capacity | d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 43 |
| Ratio investments | Credit agreement | 5.75x unlimited; 7.00x for joint ventures | Not supplied: covenant ratio not disclosed | Value can leave guarantor group | d887611dex101.htm.jsonl, pages 62–63 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Revolver exposure versus springing-test trigger | 40.00 | 7.36 | 32.64% | Passes at or below | % of revolving commitments | Letters of credit USD 67 million over USD 910 million commitments at 2024-09-30; assumes no letter of credit is cash-collateralised; not a compliance opinion |
| Revolver exposure versus draw condition | 35.00 | 7.36 | 27.64% | Passes at or below | % of revolving commitments | Above this level a new draw requires latest-quarter net leverage at or below the springing threshold |
| Springing Consolidated Net Leverage Ratio | 7.50 | Not supplied: covenant ratio and covenant EBITDA not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Tested only when revolver exposure exceeds 40%; 8.00x for four quarters after a Material Acquisition |
| Dividend ratio test, credit agreement | 6.75 | Not supplied: covenant ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Incurrence test on pro forma basis including financing; reported-EBITDA leverage is not a substitute |
| Junior-lien and unsecured debt ratio | 7.25 | Not supplied: covenant ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Incurrence test; also governs incremental facilities |
| Pari first-lien debt ratio | 5.00 | Not supplied: covenant secured ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Consolidated Secured Net Debt Ratio; also governs incremental facilities |
| Dividend coverage test, 2033 notes | 2.00 | Not supplied: covenant fixed-charge coverage not disclosed | Not supplied: current tested ratio missing | Passes above | x | Source wording requires coverage to exceed 2.0 to 1.0 |
| Ratio-lien test, 2033 notes | 5.25 | Not supplied: covenant secured ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Permits liens on ratio debt |
| Unlimited investments test | 5.75 | Not supplied: covenant ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Also requires no revolving loans and at least USD 200 million unrestricted cash |

Only the two revolver-usage rows carry a measured position; every ratio test lacks a disclosed covenant-defined current value, and the issuer's general statement of compliance is the only evidence for them.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | Not supplied: the indenture exhibit states no publication date | First Lien Intercreditor Agreement dated | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Governs enforcement and release among first-lien creditors; agreement itself not in the documents |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15 to the credit agreement | Historical — most recent amendment that impacted the restrictive covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Later amendments refinanced or added loans without changing restrictive covenants |
| 2024-09-19 | day | Not supplied: the indenture exhibit states no publication date | Joinder No. 6 to the First Lien Intercreditor Agreement | Historical — Joinder No. 6, dated September 19, 2024 | d887611dex41.htm.jsonl, page 30 | Added the 2033 notes to the pari first-lien pool; the dividend payment it helped fund is recorded by Business & governance |
| 2027-09-15 | day | Not supplied: the indenture exhibit states no publication date | Initial Redemption Date of the 2033 secured notes | Scheduled — Initial Redemption Date | d887611dex41.htm.jsonl, page 30 | First optional redemption date; refinancing optionality for the issuer |
| 2029-02-27 | day | 2024-11-07 | Revolving credit facility maturity | Scheduled — maturity date of the revolving credit facility | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 | The only maintenance covenant falls away unless the revolver is extended or replaced |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 8 |
| Calculated | 2 |
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
| MATERIAL | 4 |
| MINOR | 3 |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds all capital stock | Ownership | TransDigm Inc. | 2024 annual report; Delaware corporations |
| TransDigm Group Incorporated | Guarantees as Holdings and Loan Party | Guarantee | Senior secured credit facilities | Credit agreement Loan Parties; New York law |
| Domestic restricted subsidiaries | Guarantee as Loan Parties, ex immaterial subs | Guarantee | Senior secured credit facilities | Credit agreement s.5.11; New York law |
| TransDigm Group Incorporated | Senior secured guarantee | Guarantee | 2033 secured notes | 2033 indenture art.10; New York law |
| Domestic restricted subsidiaries | Senior secured guarantee | Guarantee | 2033 secured notes | 2033 indenture; annual report; New York law |
| TransDigm UK | Senior secured guarantee | Guarantee | 2033 secured notes | Annual report guarantor list; New York law indenture |
| TransDigm Group Incorporated | Senior subordinated guarantee | Guarantee | 2027 subordinated notes | Annual report; 2027 indenture, law not verified |
| Domestic restricted subsidiaries | Senior subordinated guarantee | Guarantee | 2027 subordinated notes | Annual report; 2027 indenture, law not verified |
| Domestic restricted subsidiaries | Pledge 100% of domestic subsidiary equity | Security | Senior secured credit facilities | Credit agreement s.5.11(b); New York law |
| Domestic restricted subsidiaries | Pledge 65% voting equity of foreign subs | Security | Senior secured credit facilities | Credit agreement s.5.11(b); New York law |
| Foreign restricted subsidiaries | Own creditors rank first on own assets | Structural claim | 2033 secured notes | Annual report guarantor note; non-guarantors |
| Securitization entity | Holds domestic receivables as collateral | Security | Securitization facility | Annual report; facility agreement not supplied |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| Senior secured credit facilities | Equal payment rank | Payment rank | 2033 secured notes | Annual report; 2033 indenture; New York law |
| Senior secured credit facilities | Shared first lien under First Lien ICA | Security rank | 2033 secured notes | 2033 indenture ICA definition; ICA not supplied |
| Senior secured credit facilities | Senior in right of payment | Payment rank | 2027 subordinated notes | 2027 indenture art.10; annual report |
| Senior secured credit facilities | Up to 179-day payment blockage | Standstill | 2027 subordinated notes | 2027 indenture s.10.03 |
| Senior secured credit facilities | Bank agent lien release releases notes liens | Release | 2033 secured notes | 2033 indenture s.12.07(e); New York law |
| Senior secured credit facilities | Bank guarantee release releases notes guarantee | Release | 2033 secured notes | 2033 indenture s.10.07(e); New York law |
| Required Revolving Lenders | Control financial-covenant remedies | Enforcement control | Term lenders | Credit agreement art.VII(l); New York law |

### Analytical appendix — complete canonical registers

All monetary amounts are USD unless stated. The tables below use evidence references defined in the evidence register; raw locators appear only in tables.

### Evidence register

| Evidence ID | Evidence | Source |
|---|---|---|
| L01 | Covenant summary; Amendment No. 15 as latest covenant amendment; notes ranking | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| L02 | Incremental conditions 7.25x and 5.00x; springing 7.50x at 40% (USD 364 million); no other maintenance covenants; compliance statement; securitization USD 650 million capacity, USD 487.5 million drawn | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| L03 | Securitization collateral; 18 October 2024 dividend USD 4,216 million plus USD 132 million equivalents; contractual dividend restrictions | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63 |
| L04 | Guarantor scope by series; structural subordination to non-guarantors; guarantee trigger USD 200 million capital-markets debt | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| L05 | Guarantor combined net sales USD 6,294 million; net due from non-guarantors USD 1,881 million; term loans USD 8,702 million; revolver USD 910 million, letters of credit USD 67 million, availability USD 843 million; quarterly amortisation USD 22 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L06 | Consolidated Net Income exclusions; Consolidated Net Leverage Ratio and Consolidated Secured Net Debt Ratio definitions | d887611dex101.htm.jsonl, pages 25–27 |
| L07 | Financial Covenant Consolidated EBITDA add-backs incl. uncapped 24-month projected cost savings | d887611dex101.htm.jsonl, pages 41–42 |
| L08 | Consolidated EBITDA projected cost-savings add-back | d887611dex101.htm.jsonl, page 24 |
| L09 | Debt incurrence: pari 5.00x, junior/unsecured 7.25x, general USD 250 million/10%, foreign USD 450 million/18%, subordinated 7.25x, securitization USD 725 million/20% | d887611dex101.htm.jsonl, pages 59–60 |
| L10 | Reclassification; limited-condition acquisition testing; permitted investments incl. unrestricted-subsidiary, general, joint-venture, acquisition and 5.75x baskets | d887611dex101.htm.jsonl, pages 61–63 |
| L11 | Unrestricted Cash; unrestricted-subsidiary designation limited to newly acquired or formed subsidiaries | d887611dex101.htm.jsonl, page 81 |
| L12 | Incremental facility; MFN 50 bp; 18-month sunset; acquisition carve-out | d887611dex101.htm.jsonl, pages 142–144 |
| L13 | Draw condition at 35%; reference to first two fiscal quarters after a Material Acquisition | d887611dex101.htm.jsonl, page 165 |
| L14 | Joinder of new domestic subsidiaries; excluded subsidiaries; 100% domestic and 65% foreign voting equity pledge; Rule 3-10/3-16 and unrestricted-subsidiary equity carve-outs | d887611dex101.htm.jsonl, pages 173–174 |
| L15 | Restricted payments: general USD 75 million/3%; expired 2017 clause; unlimited at 6.75x | d887611dex101.htm.jsonl, pages 180–181 |
| L16 | Financial covenant 7.50x/8.00x at 40% usage; amendment only by Required Revolving Lenders; investment covenant | d887611dex101.htm.jsonl, page 188 |
| L17 | Events of default incl. judgments USD 50 million, guarantee and collateral failure, revolver-only financial covenant default, subordination failure, change of control | d887611dex101.htm.jsonl, pages 190–191 |
| L18 | Loan Parties; Material Acquisition USD 300 million; Material Indebtedness USD 50 million | d887611dex101.htm.jsonl, page 52 |
| L19 | Cross-default and cross-acceleration on Material Indebtedness | d887611dex101.htm.jsonl, page 189 |
| L20 | Amendment thresholds, all-lender matters, agent intercreditor authority, non-pro-rata offers | d887611dex101.htm.jsonl, pages 204–205 |
| L21 | New York governing law of credit agreement and amendment | d887611dex101.htm.jsonl, page 8; d887611dex101.htm.jsonl, page 222 |
| L22 | First Lien Intercreditor Agreement dated 2019-02-13 with Joinders 1–6; Initial Redemption Date 2027-09-15 | d887611dex41.htm.jsonl, page 30 |
| L23 | Liens on ratio debt up to 5.25x secured net | d887611dex41.htm.jsonl, page 43 |
| L24 | Restricted payments builder: USD 400 million plus 50% cumulative net income since 2010-10-01 plus equity proceeds | d887611dex41.htm.jsonl, pages 69–70 |
| L25 | Unlimited restricted payments above 2.0x fixed-charge coverage; reclassification | d887611dex41.htm.jsonl, pages 75–76 |
| L26 | Notes amendments: majority, each-holder sacred rights incl. ranking; two-thirds for collateral release or adverse ICA change | d887611dex41.htm.jsonl, pages 117–118 |
| L27 | Guarantor release triggers | d887611dex41.htm.jsonl, page 122 |
| L28 | Collateral release triggers incl. following the bank collateral agent | d887611dex41.htm.jsonl, pages 136–137 |
| L29 | New York governing law of the 2033 indenture | d887611dex41.htm.jsonl, page 126 |
| L30 | Subordinated notes payment blockage of 179 days | d826058dex41.htm.jsonl, page 107 |
| L31 | Security-impairment event of default above USD 50 million of collateral | d887611dex41.htm.jsonl, page 97 |
| L32 | Notes general restricted-payment basket greater of USD 75.0 million and a percentage of EBITDA | d887611dex41.htm.jsonl, page 74 |
| H1 | Debt instruments, EBITDA As Defined USD 4,173 million, post-dividend net debt USD 22,967 million and 6.02x on reported EBITDA | Financial foundation (CP-1) |
| H2 | USD 3,000 million secured financing and USD 4,348 million distribution | Business & governance (CP-1A) |
| H3 | Recurring acquisition, compensation and refinancing add-backs | Earnings quality (CP-1D) |

### T4.1 Source gate and module status

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement as annexed to Amendment No. 17 | Executed amendment with conformed annexed agreement | 1 | Targeted reading; schedules and collateral documents absent | Completed with Limitations |
| 2033 secured notes indenture | Executed execution version | 1 | Only series read among six secured series | Completed with Limitations |
| 2027 subordinated notes indenture | Executed | 1 | Subordination article read; other covenants not reviewed | Completed with Limitations |
| First Lien Intercreditor Agreement | Not in source set | 2 | [Insufficient Information] — ICA not in the source set | Completed with Limitations |
| Compliance certificates | Not in source set | 3 | [Insufficient Information] — no covenant calculation supplied | Completed with Limitations |
| 2024 annual report covenant description | Filed issuer summary | 4 | Published after the analysis date; summary only | Completed with Limitations |

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second Amended and Restated Credit Agreement as amended through Amendment No. 17 (annex to d887611dex101.htm.jsonl) | Executed credit agreement, conformed annex | Amendment No. 17 dated 2024-09-19 | Executed | Controls bank definitions, financial covenant, incurrence, investments, restricted payments, defaults and amendments | Sets the binding 6.75x dividend test and release authority over notes collateral | L06–L21 |
| 1 | 2033 secured notes indenture (d887611dex41.htm.jsonl) | Executed indenture | 2024-09-19 per Source readiness | Executed | Controls 2033 notes covenants, guarantees, liens, releases and amendments | Looser dividend test (above 2.0x coverage); releases follow bank lenders | L22–L32 |
| 1 | 2027 subordinated notes indenture (d826058dex41.htm.jsonl) | Executed indenture | 2019-11-13 per Source readiness | Executed | Controls subordination and blockage of 2027 notes | Junior class standstill and turnover | L30 |
| 1 | Earlier credit-agreement family: 2013 and 2014 restatements and Amendment No. 16 | Executed amendments | 2013-02-28; 2014-06-04; 2024-06-04 per Source readiness | Executed; superseded in operative text by the conformed annex | Provenance of the amendment chain only | No independent covenant reliance | Source readiness (CP-0) |
| 2 | First Lien Intercreditor Agreement with Joinders 1–6 | Executed intercreditor agreement, referenced only | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | Would control first-lien enforcement, standstill and turnover | Recovery control among first-lien classes not established | L22 |
| 3 | Compliance certificates and covenant calculations | Covenant schedule | Not supplied: none provided | [Insufficient Information] — not in the source set | Would control tested ratios and basket usage | Headroom not established | L02 |
| 4 | 2024 annual report covenant description | Issuer summary in annual report | 2024-11-07 | Filed | Summary verified against the credit agreement where read | Compliance statement and usage trigger amount | L01–L05 |
| 1 | 2028 to 2032 secured notes and both 2029 subordinated notes indentures | Executed indentures, referenced only | Not supplied: not in the documents | [Insufficient Information] — indentures not in the source set | Would control those series' covenants and releases | Series-level differences unknown | L04 |

### Provision-level findings

| Provision | Source | Summary | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|
| Section 6.14 financial covenant | Credit agreement, Amendment No. 17 annex, rank 1 | 7.50x net leverage (8.00x after Material Acquisition) only when revolver exposure exceeds 40% | Revolver-only springing test gives term and notes no early default lever | Late warning; breach unlikely before liquidity stress | Delayed enforcement lets value erode before acceleration | Track revolver exposure each quarter | Negative — Covenant Erosion | High | L16 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Adds back uncapped 24-month projected cost savings, transaction, refinancing, compensation and dividend-equivalent costs | Inflates denominator of every ratio test | Covenant tests loosen as costs recur | Grower and ratio capacity expands | Compare covenant EBITDA with EBITDA As Defined | Negative — Covenant Erosion | High | L07; L08; H3 |
| Section 6.01 debt and Permitted Liens | Credit agreement | Pari secured to 5.00x; junior/unsecured and subordinated to 7.25x; general and foreign baskets | Ratio capacity rises with inflated EBITDA; reclassification | Higher fixed charges | Pari dilution of collateral | Incremental joinders; new debt filings | Negative — Leverage Increase | High | L09; L10 |
| Section 2.24 incremental and MFN | Credit agreement | Incremental at 7.25x and 5.00x; 50 bp MFN, 18-month sunset, acquisition carve-out | Repricing protection is time-limited and excludes acquisition debt | Refinancing at higher spreads possible | Pari incremental dilutes recovery | Track sunset and joinders | Negative — Leverage Increase | High | L12; L02 |
| Section 6.02 restricted payments | Credit agreement | Unlimited at 6.75x pro forma net leverage; general USD 75 million/3% | Debt-funded dividends permitted within ratio | Releveraging without earnings | Cash leaves restricted group | Board declarations | Negative — Leverage Increase | High | L15 |
| Section 4.07 restricted payments | 2033 indenture | Builder since 2010 plus unlimited above 2.0x coverage; ratio payments do not reduce builder | Notes test looser than bank test | Bank test is the binding limit | Notes holders rely on bank protection | Track bank test as the binding constraint | Negative — Covenant Erosion | High | L24; L25 |
| Permitted Investments | Credit agreement | Unrestricted subsidiaries USD 250 million/10%; general USD 500 million/25% of total assets; joint ventures USD 1,000 million/40% at 7.00x; unlimited at 5.75x with conditions; uncapped in restricted subsidiaries | Value can move to non-guarantors and joint ventures | Limited direct effect | Collateral and guarantee leakage | Investment disclosures | Negative — Covenant Erosion | Medium | L10 |
| Unrestricted Subsidiary definition | Credit agreement | Only newly acquired or formed subsidiaries may be designated | Blocks designation of existing guarantors | Neutral | Limits drop-down to new entities funded within baskets | Board designation resolutions | Neutral — Stable | High | L11 |
| Section 5.11 guarantees and pledge | Credit agreement | Domestic subsidiaries except immaterial, unrestricted and securitization entities join; 100% domestic and 65% foreign voting equity pledged | Foreign assets outside collateral | Neutral | Structural subordination to foreign creditors | Joinder and release notices | Negative — Refinancing Risk | Medium | L14; L04 |
| Sections 10.07 and 12.07 releases | 2033 indenture | Guarantees and liens fall away when bank lenders release | Notes holders cannot block bank-led releases | Neutral | Collateral can leave notes without notes vote | Release notices; asset sales | Negative — Covenant Erosion | High | L27; L28 |
| Article VII events of default | Credit agreement | Cross-default above USD 50 million; financial covenant default revolver-only | Term lenders depend on revolver acceleration | Late trigger | Enforcement timing controlled by revolver lenders | Revolver lender actions | Neutral — Stable | High | L17; L18; L19 |
| Section 9.02 amendments | Credit agreement | Each lender for sharing, release of substantially all collateral, material guarantor; Required Lenders for open non-pro-rata offers; agent adds pari/junior ICAs | Lien subordination not an all-lender item in clauses read | Neutral | Theoretical uptier | Amendment filings | Negative — Covenant Erosion | Medium | L20 |
| Section 10.03 blockage | 2027 indenture | 179-day blockage, once per 360 days, aggregate 179 days | Junior payment standstill under stress | Junior class default risk higher | Subordinated class absorbs loss first | Blockage notices | Negative — Liquidity Deterioration | High | L30 |

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at or below 7.50x (8.00x for four quarters after a Material Acquisition above USD 300 million) only if revolver exposure exceeds 40% of commitments | Credit agreement s.6.14; definition of Material Acquisition | Springing, revolver-only; term loans and notes have none | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L16; L18 |
| Amendment of financial covenant | Section 6.14 and its definitions amendable only by Required Revolving Lenders | Credit agreement s.6.14 | Revolver lenders alone can waive or reset the only maintenance test | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L16 |
| Draw condition | Above 35% exposure a new credit event requires latest-quarter net leverage within the s.6.14 level; refers to first two fiscal quarters after a Material Acquisition | Credit agreement s.4.01(d) | Liquidity stop precedes covenant test; two-quarter wording conflicts with four quarters in s.6.14 | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | L13 |
| Covenant EBITDA | Adds back taxes, interest, non-cash charges, unusual items, transaction and refinancing costs, earn-outs, dividend equivalents, incentive plans and uncapped projected cost savings within 24 months | Credit agreement definition of Financial Covenant Consolidated EBITDA; Consolidated EBITDA clause (m) | Denominator inflation across all ratio tests | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L07; L08 |
| Net income exclusions | Excludes unusual items, integration costs, extinguishment losses, impairments, non-cash and deferred compensation, purchase-accounting effects | Credit agreement definition of Consolidated Net Income | Same recurring costs removed before add-backs | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L06 |
| Cash netting | All unrestricted cash of Holdings, borrower and restricted subsidiaries netted, no cap | Credit agreement definitions of Consolidated Net Leverage Ratio and Unrestricted Cash | Debt raised and held as cash does not move the ratio until spent | Negative — Leverage Increase | Not assessed: no comparative source supplied | L06; L11 |
| Pari secured debt | Senior secured debt of equal lien priority to 5.00x secured net leverage | Credit agreement s.6.01 clause (12) | Dilutes first-lien collateral | Negative — Leverage Increase | Not assessed: no comparative source supplied | L09 |
| Junior and unsecured debt | 7.25x net leverage; subordinated debt also 7.25x | Credit agreement s.6.01 clauses (12) and (17) | Layering capacity | Negative — Leverage Increase | Not assessed: no comparative source supplied | L09 |
| Incremental facilities and MFN | Incremental at 7.25x net and 5.00x secured net; 50 bp MFN, Tranche L protection ends 18 months after Amendment No. 17 effective date; excludes acquisition debt and long-dated debt | Credit agreement s.2.24 | Time-limited pricing protection | Negative — Refinancing Risk | Not assessed: no comparative source supplied | L12; L02 |
| General debt basket | Greater of USD 250 million and 10% of covenant EBITDA | Credit agreement s.6.01 clause (13) | Grower basket | Negative — Leverage Increase | Not assessed: no comparative source supplied | L09 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% of covenant EBITDA | Credit agreement s.6.01 clause (14) | Structurally senior debt at non-guarantors | Negative — Refinancing Risk | Not assessed: no comparative source supplied | L09 |
| Securitization | Greater of USD 725 million and 20% of covenant EBITDA, non-recourse | Credit agreement s.6.01 clause (18) | Receivables sold out of collateral pool | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | L09; L03 |
| Bank restricted payments | Unlimited at 6.75x pro forma including financing; general USD 75 million/3% of covenant EBITDA | Credit agreement s.6.02 | Debt-funded dividends within ratio | Negative — Leverage Increase | Not assessed: no comparative source supplied | L15 |
| Notes restricted payments | Builder USD 400 million plus 50% of cumulative Consolidated Net Income since 2010-10-01 plus equity proceeds; unlimited when fixed-charge coverage exceeds 2.0x; ratio payments do not reduce builder | 2033 indenture s.4.07 | Looser than bank test; reclassification permitted | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L24; L25; L32 |
| Notes lien ratio | Liens on ratio debt to 5.25x secured net | 2033 indenture definition of Permitted Liens clause (xxxi) | Pari dilution capacity measured differently from bank 5.00x | Negative — Leverage Increase | Not assessed: no comparative source supplied | L23 |
| Investments | Unrestricted subsidiaries USD 250 million/10%; general USD 500 million/25% of total assets; joint ventures USD 1,000 million/40% at 7.00x; unlimited at 5.75x if no revolving loans and USD 200 million unrestricted cash; uncapped in restricted subsidiaries | Credit agreement definition of Permitted Investments | Value transfer outside guarantors | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L10 |
| Permitted acquisitions | No ratio test; no default and USD 100 million available liquidity; limited-condition testing at signing | Credit agreement Permitted Investments clause (18) | Debt-funded acquisitions without leverage cap beyond debt tests | Negative — Leverage Increase | Not assessed: no comparative source supplied | L10 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries designable; no recourse debt | Credit agreement definition of Unrestricted Subsidiary | Protects existing guarantors from designation | Neutral — Stable | Not assessed: no comparative source supplied | L11 |
| Guarantees and pledge | Domestic subsidiaries other than immaterial, unrestricted and securitization entities join within 20 business days; 100% domestic and 65% foreign voting equity pledged | Credit agreement s.5.11 | Foreign value outside collateral | Negative — Refinancing Risk | Not assessed: no comparative source supplied | L14 |
| Notes guarantee release | Release on sale, unrestricted designation, immateriality, or release under credit facilities and other capital-markets debt | 2033 indenture s.10.07 | Springing release tied to bank | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L27 |
| Notes collateral release | Release with guarantor release, permitted asset sales, bank-agent release, unrestricted designation, as ICA provides | 2033 indenture s.12.07 | Notes holders cannot independently hold collateral | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L28 |
| Events of default | Cross-default above USD 50 million; judgments above USD 50 million; guarantee and collateral failure; subordination failure; change of control | Credit agreement Article VII | Broad cross-default | Neutral — Stable | Not assessed: no comparative source supplied | L17; L18; L19 |
| Bank amendments | Required Lenders generally; each lender for sharing, release of substantially all collateral, material guarantor release; agent adds pari/junior ICAs | Credit agreement s.9.02(b) | Lien subordination not listed among all-lender items read | Negative — Covenant Erosion | Not assessed: no comparative source supplied | L20 |
| Notes amendments | Majority generally; each holder for payment terms and ranking; two-thirds for release of substantially all collateral or adverse ICA change | 2033 indenture ss.9.02 | Strong payment and ranking protection | Neutral — Stable | Not assessed: no comparative source supplied | L26 |
| Subordinated notes blockage | 179-day blockage, once per 360 days | 2027 indenture s.10.03 | Junior standstill | Negative — Liquidity Deterioration | Not assessed: no comparative source supplied | L30 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Ratio dividends | Unlimited at 6.75x bank, above 2.0x notes | Debt-funded distributions | Raises default risk through higher fixed charges | Cash and value leave the restricted group | Board declarations; incremental joinders | L15; L25; H2 |
| Pari secured capacity | 5.00x bank, 5.25x notes lien ratio | Pari dilution | Moderate rise from higher interest | Directly lowers first-lien recovery | Secured debt issuance; ICA joinders | L09; L23 |
| Springing maintenance | 7.50x revolver-only above 40% usage | Late warning | Defaults arrive late and closer to insolvency | Value erodes before enforcement | Revolver exposure | L16 |
| Covenant EBITDA | Uncapped projected savings, recurring add-backs | Denominator inflation | Delays ratio-based restrictions | Larger capacity for dilution and leakage | Covenant EBITDA disclosures | L07; H3 |
| Notes releases | Liens and guarantees follow bank releases | Bank-controlled release | Neutral | Notes recovery depends on bank decisions | Release notices | L27; L28 |
| Non-guarantor perimeter | Guarantor group 79.27% of net sales; 65% foreign equity pledge | Structural subordination | Neutral | Foreign creditors rank ahead on foreign value | Foreign subsidiary debt | L05; L14 |
| Subordination | 179-day blockage | Junior standstill | Subordinated holders may miss coupons in stress | Subordinated class absorbs losses first | Blockage notices | L30 |
| Amendment control | Each-lender for sharing and collateral; Required Lenders for open non-pro-rata offers | Uptier theoretical | Neutral | Possible loss of priority for non-participants | Amendment filings | L20 |

### T4.10 Market norm and covenant review comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | Provisions in the covenant feature register | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed: no comparative source | Not assessed: no comparative source | Insufficient Information — no market-norm conclusion drawn | L01–L32 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Revolver-only springing 7.50x above 40% usage; term and notes covenant-lite | No early default lever for term and notes | Negative — Covenant Erosion | Provisional | L16; L02 |
| Debt / lien incurrence capacity | 4 | Pari secured to 5.00x; 5.25x notes lien ratio; 7.25x junior; grower baskets; 50 bp MFN with 18-month sunset | Pari dilution and layering | Negative — Leverage Increase | Provisional | L09; L12; L23 |
| RP / investment / leakage capacity | 4 | Unlimited ratio dividends; large general investment basket; uncapped investment in restricted subsidiaries; designation limited to new subsidiaries | Value transfer to equity and non-guarantors | Negative — Leverage Increase | Provisional | L10; L11; L15; L25 |
| EBITDA definitions and add-back flexibility | 4 | Uncapped 24-month projected savings plus recurring cost add-backs | Denominator inflation | Negative — Covenant Erosion | Provisional | L07; L08 |
| Collateral / guarantor protection | 3 | All domestic restricted subsidiaries guarantee; 65% foreign equity pledge; notes releases follow bank | Some release flexibility and foreign leakage | Negative — Refinancing Risk | Provisional | L14; L27; L28 |
| Amendment / control mechanics | 3 | Each-lender for sharing and collateral release; lien subordination not listed among items read; notes two-thirds and each-holder ranking protection | Theoretical uptier | Negative — Covenant Erosion | Provisional | L20; L26 |
| Overall | 4 | Weighted to ratio-based distributions and pari dilution, which have been used | Debt-funded extraction with late default trigger | Negative — Leverage Increase | Provisional | L15; L09; H2 |

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| Further debt-funded dividend | Bank 6.75x ratio dividend; incremental at 5.00x | Repeats the September recapitalisation | Higher default risk; first-lien dilution | Board declarations and incremental joinders | L15; L12; H2 |
| New pari secured issuance | Pari secured 5.00x; notes 5.25x | Shares the same collateral | Lower first-lien recovery | ICA joinders and 8-K financing filings | L09; L23; L22 |
| Covenant EBITDA diverging from reported | Uncapped projected savings | Ratio tests loosen as earnings weaken | Delayed restriction; larger capacity | Request covenant EBITDA bridge | L07 |
| Revolver exposure above 35% | Draw condition | Liquidity stop precedes covenant | Rising default risk | Quarterly revolver use and letters of credit | L13 |
| Guarantor or collateral release | Notes ss.10.07 and 12.07 follow bank | Notes collateral shrinks without notes vote | Lower secured-notes recovery | Release notices and asset sales | L27; L28 |
| New unrestricted subsidiary | Designation of new subsidiaries; USD 250 million/10% investment cap | Possible drop-down via new entity | Recovery leakage | Board designation certificates | L11; L10 |
| Required Lenders amendment touching priority or sharing | Section 9.02(b) | Lien subordination not shown as an all-lender item | Priming risk for non-participants | Amendment filings | L20 |
| Subordinated blockage notice | 2027 indenture s.10.03 | Coupon stop for junior class | Subordinated default risk | Trustee notices | L30 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor agreement | First Lien Intercreditor Agreement dated 2019-02-13 and Joinders 1–6 | Controls enforcement direction, standstill, turnover and release among first-lien classes | Intercreditor registers carry insufficient-information cells; recovery control not settled | Obtain executed agreement and joinders |
| Compliance certificates | Quarterly covenant calculations | Needed for tested ratios | No ratio headroom | Obtain latest certificate and covenant EBITDA bridge |
| Other indentures | 2028–2032 secured and both 2029 subordinated indentures | Series may differ on dividends, releases and sacred rights | Notes conclusions limited to the 2033 and 2027 series | Obtain executed indentures and supplements |
| Collateral documents | Guarantee and Collateral Agreement, security schedules, excluded assets | Defines collateral reach and perfection | Collateral map qualitative | Obtain agreement and schedules |
| Unread definitions | Consolidated Total Indebtedness, Required Lenders, Total Assets, remaining s.9.02 clauses | Affects covenant debt, voting thresholds and basket sizes | Uptier and capacity conclusions provisional | Read full definitions and s.9.02 |
| Basket usage | Usage tracker for all baskets | Remaining capacity | Capacity formula-only | Obtain usage records |
| Market comparison | Covenant-review report | Market-norm comparison | Market-norm column not assessed | Obtain third-party covenant review |

### T4D.1 Source gate and entity evidence

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| Credit agreement s.5.11 and Loan Parties definition | Executed | 1 | Guarantor schedule and Guarantee and Collateral Agreement absent | Completed with Limitations |
| 2033 indenture guarantee and collateral articles | Executed | 1 | Security Documents absent | Completed with Limitations |
| Annual report guarantor note and combined summary | Filed | 4 | Combined basis; exhibit list of guarantors not supplied | Completed with Limitations |
| Subsidiary list and organisation chart | Not in source set | 4 | [Insufficient Information] — entity-by-entity list not supplied | Completed with Limitations |
| Post-period perimeter events | No guarantee release, designation or entity transfer identified in pages read | 4 | Scan limited to pages read; October 2024 dividend and securitization draw are financing events, not perimeter changes | Completed with Limitations |

### T4D.2 Restricted / unrestricted entity register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of all funded debt | Delaware | None; listed parent | Not a restricted subsidiary; Loan Party and guarantor | No significant operations or assets other than its investment in TransDigm Inc. | Yes, as guarantor | L04; L18; H2 |
| TransDigm Inc. | Borrower and notes issuer | Delaware | TransDigm Group Incorporated | Borrower; cannot be designated unrestricted | Part of guarantor combined net sales USD 6,294 million | Yes | L04; L05 |
| TransDigm UK | Guarantor of notes | Not established in pages read | Not established in pages read | Restricted guarantor | Included in guarantor combined summary; separate value not disclosed | Yes for notes; credit-facility status not established | L04 |
| Domestic restricted subsidiaries | Guarantors and grantors | United States | TransDigm Inc. | Restricted; existing ones cannot be designated unrestricted | Included in guarantor combined net sales USD 6,294 million | Yes | L04; L11; L14 |
| Immaterial domestic subsidiaries | Excluded subsidiaries | United States | TransDigm Inc. group | Restricted, non-guarantor until no longer immaterial | — value not disclosed | No | L14 |
| Foreign restricted subsidiaries | Non-guarantors except TransDigm UK | Outside United States | Loan Parties | Restricted | Indicative non-guarantor net sales USD 1,646 million; guarantors net due from non-guarantors USD 1,881 million | No; 65% voting equity pledged | L05; L14 |
| Securitization entity | Receivables financing vehicle | Not established in pages read | Not established in pages read | Excluded subsidiary | Domestic trade receivables securing USD 487.5 million drawn at year-end | No | L03; L14 |
| Unrestricted subsidiaries | None identified | Not established in pages read | Not established in pages read | Only newly formed or acquired subsidiaries designable | — none identified | No | L11 |

### T4D.3 Guarantor coverage matrix

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| TransDigm Group Incorporated × credit facilities | Senior secured guarantee as Loan Party | Upstream parent guarantee of subsidiary borrower, described as downstream from parent | Material guarantor release needs each lender unless otherwise permitted | L18; L20 |
| Domestic restricted subsidiaries × credit facilities | Senior secured guarantee | Upstream and cross-stream | Sale, immateriality or as Loan Documents permit; material guarantor release needs each lender otherwise | L14; L20 |
| TransDigm Group Incorporated × 2033 secured notes | Senior secured guarantee | Downstream | Released with discharge or defeasance | L27 |
| Domestic restricted subsidiaries × 2033 secured notes | Senior secured guarantee | Upstream and cross-stream | Sale to non-affiliate, unrestricted designation, immateriality, release under credit facilities and capital-markets debt | L27 |
| TransDigm UK × 2033 secured notes | Senior secured guarantee | Cross-stream | Same as domestic guarantors | L04; L27 |
| TransDigm Group Incorporated, TransDigm UK and domestic restricted subsidiaries × 2027 subordinated notes | Senior subordinated guarantee | Upstream, cross-stream and downstream | [Insufficient Information] — 2027 indenture release section not reviewed | L04 |
| Foreign restricted subsidiaries × all tranches | No guarantee | Not applicable: non-guarantors | Not applicable: no guarantee to release | L04; L14 |

### T4D.4 Collateral-by-entity matrix

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| TransDigm Inc. × first lien | Equity of unrestricted subsidiaries; equity requiring separate SEC financial statements; other exclusions in collateral agreement not supplied | Bank: each lender for substantially all collateral; notes follow bank-agent release | Notes perfection by commercially reasonable efforts within 90 days of issue | L14; L20; L28 |
| TransDigm Group Incorporated × first lien | [Insufficient Information] — collateral agreement not supplied | As above | [Insufficient Information] — security documents not supplied | L18; L28 |
| Domestic restricted subsidiaries × first lien | 100% of domestic subsidiary equity pledged, subject to the same carve-outs | Released with guarantee or permitted sale | [Insufficient Information] — security documents not supplied | L14; L28 |
| TransDigm UK × first lien | [Insufficient Information] — UK security documents not supplied | Released with guarantee | A UK collateral agent is named in the indenture; local-law limits not established | L27; L28 |
| Foreign restricted subsidiaries × first lien | Assets not pledged; only 65% of first-tier voting equity pledged | Not applicable: assets outside collateral | Foreign local law not established | L14 |
| Securitization entity × first lien | Receivables sold to the vehicle are outside the first-lien pool | Facility terms not supplied | Facility agreement not supplied | L03; L09 |
| All entities × second lien | — no second-lien debt identified | Agent may document junior liens without lender consent | — none outstanding | L20 |
| All entities × unsecured | — subordinated notes unsecured | Not applicable: no lien | Not applicable: no lien | L04 |

### T4D.5 Structural priority table

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Term loans and revolver | TransDigm Inc. with Holdings and domestic guarantors | Guarantor assets and pledged equity, including 65% of foreign voting equity | Pari | Foreign subsidiary assets reachable only through equity after foreign creditors | Equal first-lien access with secured notes | Medium | L14; L04 |
| 2033 secured notes | TransDigm Inc. with TD Group, TransDigm UK and domestic guarantors | Same collateral under First Lien ICA | Pari | Same foreign value gap; collateral can be released by bank decision | Equal economic rank but no independent release control | Medium | L28; L22 |
| 2028–2032 secured notes | Same issuer; guarantor scope described as same as 2033 notes | Same collateral | Pari | Same foreign value gap | Indentures not supplied; series-level releases unknown | Low | L04 |
| 2027 and 2029 subordinated notes | TransDigm Inc. with subordinated guarantees | Residual after senior debt | Contractually Subordinated | Foreign subsidiary value and all collateral value ahead | Last among funded debt | High | L30; L04 |
| Securitization facility | Securitization entity | Domestic trade receivables | Structurally Senior | Receivables removed from first-lien pool | Senior on receivables | Medium | L03 |
| Foreign subsidiary creditors | Foreign restricted subsidiaries | Foreign assets | Structurally Senior | Indicative non-guarantor net sales USD 1,646 million | Ahead of all TransDigm Inc. creditors on foreign value | Medium | L05; L09 |

### T4D.6 Drop-down / transfer capacity register

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividends to equity | TransDigm Inc. to Holdings to shareholders | Bank s.6.02 6.75x; notes s.4.07 above 2.0x | USD 4,348 million paid in October 2024; further amount not capped | 4 | Value leaves the creditor group entirely | Demonstrated | L15; L25; H2 |
| Investment in new unrestricted subsidiary | Guarantor to newly formed unrestricted subsidiary | Permitted Investments clause (1)(c) and general basket | Greater of USD 250 million and 10% of covenant EBITDA, plus general basket | 3 | Assets leave guarantees and collateral | Theoretical | L10; L11 |
| Transfer to non-guarantor restricted subsidiaries | Guarantor to foreign restricted subsidiary | Permitted Investments clause (1)(a) uncapped | Not supplied: no cap and no usage disclosure | 4 | Value moves behind foreign creditors | Theoretical | L10 |
| Joint-venture contribution | Guarantor to joint venture | Permitted Investments clause (11) at 7.00x | Greater of USD 1,000 million and 40% of covenant EBITDA | 3 | Value outside guarantee group | Theoretical | L10 |
| Receivables sale | Domestic guarantors to securitization entity | Bank s.6.01 clause (18); Permitted Investments clause (19) | Greater of USD 725 million and 20% of covenant EBITDA; USD 650 million drawn after October 2024 draw | 2 | Receivables removed from first-lien pool | Demonstrated | L09; L03 |
| Redesignation of existing guarantor | Existing restricted subsidiary to unrestricted | Unrestricted Subsidiary definition limits to new subsidiaries | Not applicable: route closed for existing subsidiaries | 1 | Protects current guarantor value | Theoretical | L11 |

### T4D.7 Priming-exposure findings

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by Required Lenders amendment | Bank s.9.02(b): lien subordination not among all-lender items read; open non-pro-rata offers allowed | Non-participating term and revolving lenders | Theoretical | Could subordinate non-participants' liens if Required Lenders consent | Low | L20 |
| Uptier against secured notes | Notes s.9.02: ranking change needs each holder; adverse ICA change needs two-thirds | 2033 secured noteholders | Theoretical | Notes better protected than bank lenders on ranking | Medium | L26 |
| Trapdoor via new unrestricted subsidiary | Designation of new subsidiaries plus investment baskets | All guaranteed creditors | Theoretical | New entity could hold transferred assets and raise structurally senior debt | Medium | L10; L11 |
| Collateral release following bank | Notes s.12.07(e)(B) | 2033 secured noteholders | Theoretical | Bank decision can strip notes collateral outside a discharge | High | L28 |

### T4D.8 Gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Entity list | Subsidiary list and guarantor schedule by entity | Needed to place value by entity | Entity register by class only | Obtain subsidiary list and guarantor exhibit |
| Entity-level value | Assets, EBITDA and debt by entity | Needed to name stranded value precisely | Non-guarantor value indicated by net sales only | Obtain entity or non-guarantor financials |
| Security documents | Guarantee and Collateral Agreement; UK security; mortgages | Defines excluded assets and perfection | Collateral matrix partly insufficient | Obtain security documents |
| 2027 indenture releases | Guarantee release and turnover terms | Junior release and turnover mechanics | Subordinated guarantee release not assessed | Read 2027 indenture guarantee article |
| Securitization documents | Facility and sale agreements | True-sale and recourse terms | Securitization label provisional | Obtain facility documents |

### T4F.1 Controlling documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| First Lien Intercreditor Agreement with Joinders 1–6 | TransDigm Inc., Holdings, subsidiary guarantors, Credit Agreement Collateral Agent, secured-notes trustees and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — ICA not in the source set | Referenced; not supplied | d887611dex41.htm.jsonl, page 30 | L22 |
| 2033 secured notes indenture | TransDigm Inc., TransDigm Group Incorporated, subsidiary guarantors, trustee, notes collateral agents | 2024-09-19 per Source readiness | New York | Executed | d887611dex41.htm.jsonl, pages 30 and 126 | L22; L29 |
| Credit agreement as amended by Amendment No. 17 | TransDigm Inc., Holdings, subsidiaries, lenders, agent | 2024-09-19 | New York | Executed | d887611dex101.htm.jsonl, pages 8 and 222 | L21 |
| 2027 subordinated notes indenture | TransDigm Inc., guarantors, trustee | 2019-11-13 per Source readiness | [Insufficient Information] — governing-law text not reviewed | Executed | d826058dex41.htm.jsonl, page 107 | L30 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | First-priority liens via Credit Agreement Collateral Agent | Sole beneficiaries of s.6.14 and its remedies through Required Revolving Lenders | [Insufficient Information] — ICA not in the source set | L16; L17 |
| Term lenders, Tranches I–L | First lien, pari | Same collateral | Remedies through agent at Required Lenders request; financial-covenant default only after revolver action | [Insufficient Information] — ICA not in the source set | L17; L20 |
| 2033 secured noteholders | First lien, pari | Liens via Notes Collateral Agents under Security Documents | Acceleration under indenture; collateral enforcement subject to ICA | [Insufficient Information] — ICA not in the source set | L22; L28 |
| 2028–2032 secured noteholders | First lien, pari | Same collateral per annual report | [Insufficient Information] — indentures not in the source set | [Insufficient Information] — ICA not in the source set | L04 |
| 2027 subordinated noteholders | Contractually subordinated | None | Payment blockage up to 179 days on notice from designated senior debt | [Insufficient Information] — 2027 indenture amendment section not reviewed | L30 |
| 2029 subordinated noteholders | Contractually subordinated | None | [Insufficient Information] — indentures not in the source set | [Insufficient Information] — indentures not in the source set | L04 |
| Securitization funders | Structurally senior on receivables | Domestic trade receivables | [Insufficient Information] — facility agreement not in the source set | [Insufficient Information] — facility agreement not in the source set | L03 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| First-lien enforcement among classes | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Term lenders, revolving lenders, secured noteholders | [Insufficient Information] — ICA not in the source set | Insufficient Information — control not established | L22 |
| Subordinated payment blockage | Up to 179 days; once per 360 days; at least 181 blockage-free days | Blockage notice from representative of designated senior debt following a non-payment default | Representative of designated senior debt | 2027 subordinated noteholders | Junior coupons stop while senior lenders negotiate | Negative — Liquidity Deterioration | L30 |
| Financial-covenant default | No fixed period; term lenders wait until revolver lenders terminate or accelerate | Breach of s.6.14 above 40% usage | Required Revolving Lenders | Term lenders | Term lenders cannot act on the covenant breach alone | Negative — Covenant Erosion | L17 |

### T4F.4 Turnover and release

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| First-lien turnover and purchase | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | [Insufficient Information] — ICA not in the source set | Notes s.12.07(h) defers to ICA | L22; L28 |
| Notes collateral release | Not applicable: release provision | Credit Agreement Collateral Agent release drives notes release | Not applicable: no purchase option in clause | Except release on full cash discharge of bank debt outside enforcement | Release of substantially all collateral by amendment needs two-thirds of notes | L28; L26 |
| Notes guarantee release | Not applicable: release provision | Release under credit facilities and capital-markets debt | Not applicable: no purchase option in clause | Not on release by payment of the guarantee | Bank release of a material guarantor needs each lender | L27; L20 |
| Subordinated turnover | Section 10.05 heading on distributions paid over located; terms not reviewed | Not applicable: subordinated notes unsecured | Not applicable: none identified | [Insufficient Information] — section 10.05 text not reviewed | Subordination failure is a bank event of default | L30; L17 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Term lenders | Pari share of first-lien collateral | Financial-covenant remedies held by revolving lenders; enforcement direction under ICA not established | Moderate | Late enforcement | Negative — Covenant Erosion | L17; L22 |
| Revolving lenders | Pari share plus sole maintenance test | Required Lenders vote may be dominated by term lenders; definition not reviewed | Moderate | Covenant control does not equal enforcement control | Insufficient Information — voting weights not established | L16; L20 |
| 2033 secured noteholders | Pari share of first-lien collateral | Liens and guarantees follow bank releases | High | Bank-controlled release | Negative — Covenant Erosion | L27; L28 |
| 2027 subordinated noteholders | Residual after senior debt | 179-day blockage; contractual subordination | High | Junior standstill and loss absorption | Negative — Liquidity Deterioration | L30 |

### T4F.6 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor terms | First Lien Intercreditor Agreement and six joinders | Enforcement control, standstill, turnover, purchase options | Enforcement and turnover registers incomplete | Obtain executed agreement and joinders |
| Voting weights | Required Lenders and Required Revolving Lenders definitions | Who can amend or waive | Voting weight not established | Read definitions in credit agreement |
| Subordinated turnover | 2027 indenture s.10.05 and other subordinated indentures | Turnover of junior recoveries | Junior turnover not assessed | Read s.10.05; obtain 2029 indentures |
| Securitization intercreditor | Securitization facility and any intercreditor | Receivables priority | Receivables access provisional | Obtain facility documents |

### T4C.1 Capacity source gate

| Input | Availability | Quality | Limitation |
|---|---|---|---|
| Executed governing documents | Available for bank debt, 2033 notes and 2027 notes | High | Other indentures absent |
| Financial inputs | Financial foundation available | High for reported figures | Covenant EBITDA and covenant debt not disclosed |
| Usage data | Revolver exposure only | Medium | No basket tracker |
| Post-period capacity events | October 2024 dividend and securitization draw | High | Used as pro forma usage signals only |

### T4C.2 Controlling capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Credit agreement as amended by Amendment No. 17 | Executed credit agreement | 2024-09-19 | Executed | Legal formula | Binding ratio and basket formulas | L06–L20 |
| 1 | 2033 secured notes indenture | Executed indenture | 2024-09-19 per Source readiness | Executed | Legal formula | Notes dividend and lien tests | L23–L28 |
| 3 | Compliance certificates | Covenant schedule | Not supplied: none provided | [Insufficient Information] — not in the source set | Usage and tested ratios | Headroom not calculable | L02 |
| 4 | Annual report | Filed annual report | 2024-11-07 | Filed | Financial input and usage (revolver, securitization) | Revolver exposure and compliance statement | L02; L05 |
| 4 | Financial foundation | Accepted financial analysis | 2024-09-30 | Supplied | Financial input | Reported debt, EBITDA As Defined and pro forma figures; not covenant measures | H1 |

### T4C.3 Covenant definition and ratio mechanics register

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA (Financial Covenant Consolidated EBITDA for s.6.14), latest four quarters, pro forma for acquisitions | Covenant debt, unrestricted cash, covenant EBITDA | Drives dividend, junior debt, investment and maintenance tests | Uncapped cash netting and add-backs | Negative — Covenant Erosion | L06 |
| Consolidated Secured Net Debt Ratio | Credit agreement definitions | Secured Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA | Covenant secured debt, cash, EBITDA | Drives pari secured and incremental capacity | Same inflation | Negative — Leverage Increase | L06 |
| Financial Covenant Consolidated EBITDA | Credit agreement definitions | Net income plus taxes, interest, non-cash charges, unusual items, transaction and refinancing costs, earn-outs, dividend equivalents, incentive plans, uncapped projected cost savings within 24 months, less non-cash gains | Covenant EBITDA bridge | Raises maintenance headroom | Projected savings unaudited and uncapped | Negative — Covenant Erosion | L07 |
| Consolidated EBITDA | Credit agreement definitions | Similar add-backs including projected cost savings | Covenant EBITDA bridge | Raises all grower baskets and ratio tests | Same | Negative — Covenant Erosion | L08 |
| Consolidated Total Indebtedness | Credit agreement definitions | [Insufficient Information] — definition not reviewed; treatment of securitization funding, letters of credit and customer advances not established | Definition text | Determines numerator of all ratios | Definition conflict with carrying debt USD 24,880 million unresolved | Insufficient Information — numerator basis not established | H1 |
| Unrestricted Cash | Credit agreement definitions | Unencumbered cash of Holdings, borrower and restricted subsidiaries; bank liens permitted | Cash by entity | Full netting raises capacity | Borrowed cash offsets debt until spent | Negative — Leverage Increase | L11 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture | [Insufficient Information] — definition not reviewed | Covenant EBITDA and fixed charges | Gates unlimited notes dividends above 2.0x | Coverage test loose relative to leverage | Negative — Covenant Erosion | L25 |
| Covenant EBITDA versus reported | Credit agreement definitions; Financial foundation | Reported EBITDA USD 3,813 million; EBITDA As Defined USD 4,173 million; covenant EBITDA not disclosed | Compliance certificate | Covenant figure expected above EBITDA As Defined given projected savings, not established | Ratio inflation | Insufficient Information — covenant figure not established | H1; L07 |
| Revolver usage trigger | Credit agreement s.6.14 and s.4.01(d) | Aggregate Revolving Credit Exposure excluding letters of credit cash-collateralised at 103% or more, over commitments | Exposure and commitments | 40% triggers test; 35% conditions draws | Drafting refers to four quarters in s.6.14 and two quarters in s.4.01(d) for the acquisition step-up | Negative — Liquidity Deterioration | L13; L16 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver exposure versus springing-test trigger | max-ratio | 40.00% | 7.36% | Revolving exposure (USD 67 million letters of credit) / commitments (USD 910 million) | 32.64% | Compliant | Assumes no letter of credit cash-collateralised; exposure at 2024-09-30 | Test springs only above USD 364 million exposure | Neutral — Stable | L05; L16 |
| Revolver exposure versus draw condition | max-ratio | 35.00% | 7.36% | Same exposure / commitments | 27.64% | Compliant | Condition tested on each credit event | Above USD 318.50 million new draws need latest-quarter compliance | Neutral — Stable | L05; L13 |
| Springing Consolidated Net Leverage Ratio | max-ratio | 7.50x | [Insufficient Information] — missing: covenant ratio at 2024-09-30 | Covenant debt less unrestricted cash / Financial Covenant Consolidated EBITDA | [Insufficient Information] — missing: current tested ratio | Not Calculable | Untriggered; issuer states compliance; Financial foundation's 6.02x post-dividend reported-EBITDA leverage is not the covenant ratio | Late warning to term and notes | Insufficient Information — ratio not disclosed | L16; L02 |
| Dividend ratio test, credit agreement | max-ratio | 6.75x | [Insufficient Information] — missing: covenant ratio and pro forma financing | Pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Incurrence test | Uncapped ratio dividends | Insufficient Information — ratio not disclosed | L15 |
| Junior and unsecured debt ratio | max-ratio | 7.25x | [Insufficient Information] — missing: covenant ratio | Pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Incurrence test | Layering capacity | Insufficient Information — ratio not disclosed | L09 |
| Pari secured debt ratio | max-ratio | 5.00x | [Insufficient Information] — missing: covenant secured ratio | Pro forma covenant secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Incurrence test | Pari dilution | Insufficient Information — ratio not disclosed | L09 |
| Notes dividend coverage test | min-ratio | 2.00x | [Insufficient Information] — missing: covenant fixed-charge coverage | Pro forma Consolidated Fixed Charge Coverage Ratio | [Insufficient Information] — missing: current tested ratio | Not Calculable | Test requires coverage to exceed 2.0x; Financial foundation's 3.29x reported EBITDA to net cash interest is not the covenant ratio | Uncapped notes dividends | Insufficient Information — ratio not disclosed | L25; H1 |
| Notes ratio-lien test | max-ratio | 5.25x | [Insufficient Information] — missing: covenant secured ratio | Pro forma secured net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Incurrence test | Pari dilution | Insufficient Information — ratio not disclosed | L23 |
| Unlimited investments test | max-ratio | 5.75x | [Insufficient Information] — missing: covenant ratio | Pro forma covenant net leverage | [Insufficient Information] — missing: current tested ratio | Not Calculable | Also requires no revolving loans and USD 200 million unrestricted cash | Value transfer | Insufficient Information — ratio not disclosed | L10 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Debt incurrence capacity | Pari secured ratio debt | Ratio Basket: secured net leverage at or below 5.00x | Same lien priority; maturity and life tests | Covenant ratio not disclosed | September 2024 USD 3,000 million secured financing | [Insufficient Information] — covenant ratio missing | [Insufficient Information] — covenant ratio missing | Formula Extracted Only | Critical | Pari dilution | Negative — Leverage Increase | L09; H2 |
| Debt incurrence capacity | Junior and unsecured ratio debt | Ratio Basket: net leverage at or below 7.25x | Maturity and life tests | Covenant ratio not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant ratio missing | [Insufficient Information] — covenant ratio missing | Formula Extracted Only | High | Layering | Negative — Leverage Increase | L09 |
| Debt incurrence capacity | General debt basket | Grower Basket: greater of USD 250 million and 10% of covenant EBITDA | Borrower and guarantors | Covenant EBITDA not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant EBITDA missing | [Insufficient Information] — usage missing | Formula Extracted Only | Moderate | Free-and-clear debt | Negative — Leverage Increase | L09 |
| Debt incurrence capacity | Foreign subsidiary debt | Grower Basket: greater of USD 450 million and 18% of covenant EBITDA | Foreign restricted subsidiaries | Covenant EBITDA not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant EBITDA missing | [Insufficient Information] — usage missing | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Refinancing Risk | L09 |
| Debt incurrence capacity | Securitization | Grower Basket: greater of USD 725 million and 20% of covenant EBITDA | Non-recourse | USD 487.5 million drawn at year-end; USD 650 million after 2024-10-16 | USD 650 million after October draw | [Insufficient Information] — covenant EBITDA missing | [Insufficient Information] — covenant EBITDA missing | Ready with Limitations | Low | Receivables leave collateral pool | Negative — Liquidity Deterioration | L09; L02; L03 |
| Incremental facility capacity | Section 2.24 | Incremental Ratio Amount: 7.25x net and 5.00x secured net | MFN 50 bp; 18-month sunset for Tranche L | Covenant ratios not disclosed | Tranche L USD 1,500 million in September 2024 | [Insufficient Information] — covenant ratio missing | [Insufficient Information] — covenant ratio missing | Formula Extracted Only | High | Pari dilution | Negative — Leverage Increase | L12; L02; H1 |
| MFN protection | Section 2.24(b) | 50 bp yield differential | Excludes acquisition debt, debt after 18 months, long-dated debt | Effective date not established | Not applicable: protection not a basket | Not applicable: protection not a basket | Not applicable: protection not a basket | Ready with Limitations | Moderate | Repricing risk for existing lenders | Negative — Refinancing Risk | L12 |
| Restricted payment capacity | Bank ratio dividend | Ratio Basket: pro forma net leverage at or below 6.75x | No default | Covenant ratio not disclosed | USD 4,348 million paid 2024-10-18 | [Insufficient Information] — covenant ratio missing | [Insufficient Information] — covenant ratio missing | Formula Extracted Only | Critical | Debt-funded extraction | Negative — Leverage Increase | L15; L03 |
| Restricted payment capacity | Bank general basket | General Basket: greater of USD 75 million and 3% of covenant EBITDA | No default | Covenant EBITDA not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant EBITDA missing | [Insufficient Information] — usage missing | Formula Extracted Only | Low | Small leakage | Neutral — Stable | L15 |
| Builder / available amount capacity | Notes builder | Builder Basket: USD 400 million plus 50% cumulative net income since 2010-10-01 plus equity proceeds less builder usage | No default | Cumulative covenant net income not disclosed | Not supplied: builder usage not disclosed | [Insufficient Information] — cumulative net income missing | [Insufficient Information] — usage missing | Formula Extracted Only | High | Bank test binds first | Negative — Covenant Erosion | L24 |
| Restricted payment capacity | Notes ratio dividend | Ratio Basket: coverage above 2.0x | No default; does not reduce builder | Covenant coverage not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant coverage missing | [Insufficient Information] — covenant coverage missing | Formula Extracted Only | High | Notes add little protection | Negative — Covenant Erosion | L25 |
| Investment capacity | General investments | General Basket: greater of USD 500 million and 25% of Total Assets | None stated | Total Assets definition not reviewed | Not supplied: usage not disclosed | [Insufficient Information] — Total Assets definition missing | [Insufficient Information] — usage missing | Formula Extracted Only | High | Value transfer | Negative — Covenant Erosion | L10 |
| Investment capacity | Joint ventures | Grower Basket: greater of USD 1,000 million and 40% of covenant EBITDA | 7.00x and no default | Covenant inputs not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant EBITDA missing | [Insufficient Information] — usage missing | Formula Extracted Only | Moderate | Value outside guarantors | Negative — Covenant Erosion | L10 |
| Investment capacity | Other investments | Ratio Basket: 5.75x | No revolving loans; USD 200 million unrestricted cash; no default | Covenant ratio not disclosed | Not supplied: usage not disclosed | [Insufficient Information] — covenant ratio missing | [Insufficient Information] — covenant ratio missing | Formula Extracted Only | High | Uncapped value transfer | Negative — Covenant Erosion | L10 |
| Unrestricted subsidiary capacity | Investments in unrestricted subsidiaries | Grower Basket: greater of USD 250 million and 10% of covenant EBITDA | New subsidiaries only | No unrestricted subsidiary identified | Not supplied: usage not disclosed | [Insufficient Information] — covenant EBITDA missing | [Insufficient Information] — usage missing | Formula Extracted Only | Moderate | Drop-down to new entity | Negative — Covenant Erosion | L10; L11 |
| Guarantor / collateral release capacity | Notes releases following bank | Release on bank-agent release, permitted sale, designation | Bank needs each lender for substantially all collateral | Not applicable: event-driven | Not supplied: no release identified | Not applicable: event-driven | Not applicable: event-driven | Ready with Limitations | High | Collateral loss for notes | Negative — Covenant Erosion | L27; L28; L20 |
| Maintenance covenant headroom | Revolver usage trigger | Exposure over commitments at or below 40% | Letters of credit cash-collateralised at 103% excluded | USD 67 million / USD 910 million | 7.36% | Not applicable: trigger, not a basket | 32.64% of commitments | Completed | Low | Test far from springing | Neutral — Stable | L05; L16 |

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured incremental and ratio debt | 5.00x secured net (bank); 5.25x lien ratio (notes) | Formula only; USD 3,000 million used in September 2024 | Shares first-lien collateral | Higher interest burden | Lower first-lien recovery per dollar of claim | First-lien instruments carry dilution risk; prefer earlier maturities | L09; L23; H2 |
| Junior and unsecured layering | 7.25x net leverage | Formula only | Adds claims behind first lien, ahead of or pari with subordinated notes | Higher fixed charges | Subordinated recovery diluted | Subordinated notes most exposed | L09 |
| Foreign subsidiary debt | Greater of USD 450 million and 18% of covenant EBITDA | Formula only | Structurally senior on foreign assets | Limited | Reduces value reaching guarantors | Negative for all TransDigm Inc. claims | L09 |
| MFN weakness | 50 bp; 18-month sunset; acquisition carve-out | Ready with limitations | Pricing dilution, not lien priming | Refinancing cost risk | Limited | Existing term loans exposed to repricing gap | L12 |
| Uptier by amendment | Required Lenders open non-pro-rata offers; lien subordination not among all-lender items read | Theoretical | Possible priming of non-participants | Limited | Possible loss of priority | Notes better protected than loans on ranking | L20; L26 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividends | October 2024 distribution USD 4,348 million (USD 4,216 million dividend plus USD 132 million equivalents) | Bank 6.75x; notes above 2.0x | Used 2024-10-18; remaining not established | Cash leaves group; Financial foundation pro forma net debt USD 22,967 million and 6.02x on reported EBITDA | Critical | Negative — Leverage Increase | L03; L15; H1 |
| Investments in non-guarantor restricted subsidiaries | Uncapped under clause (1)(a) | Uncapped | Not supplied: usage not disclosed | Value moves outside guarantees and collateral | High | Negative — Covenant Erosion | L10 |
| General and ratio investments | USD 500 million/25% of Total Assets; unlimited at 5.75x | General and ratio baskets | Not supplied: usage not disclosed | Value can leave guarantors | High | Negative — Covenant Erosion | L10 |
| Unrestricted subsidiary | New subsidiaries only; USD 250 million/10% | Grower basket | Not supplied: usage not disclosed | New entity outside group | Moderate | Negative — Covenant Erosion | L10; L11 |
| Joint ventures | USD 1,000 million/40% at 7.00x | Grower basket | Not supplied: usage not disclosed | Value outside guarantors | Moderate | Negative — Covenant Erosion | L10 |
| Receivables sale | USD 650 million drawn after October 2024 | Securitization basket | Used | Receivables outside collateral | Low | Negative — Liquidity Deterioration | L02; L03 |

### T4C.8 EBITDA add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings | Financial Covenant Consolidated EBITDA clause (n); Consolidated EBITDA clause (m) | Uncapped; actions within 24 months; net of realised benefits | Not calculable: no covenant bridge | Raises every ratio basket and maintenance headroom | Delays restriction; larger dilution capacity | L07; L08 |
| Transaction, refinancing and amendment costs | Clause (e) | Uncapped; successful or not | Not calculable: no covenant bridge | Recurring costs excluded; Earnings quality finds them recurring | Overstates sustainable capacity | L07; H3 |
| Non-cash and deferred compensation; incentive plans | Consolidated Net Income clause (11); clauses (i) and (m) | Uncapped | Not calculable: no covenant bridge | Excludes recurring employee cost | Overstates capacity | L06; L07; H3 |
| Dividend-equivalent payments | Clause (j) | Uncapped | Not calculable: no covenant bridge | Cash paid to optionholders does not reduce covenant EBITDA | Distribution-linked cash outflow invisible to ratios | L07 |
| Unusual, integration and restructuring charges | Clause (d); Consolidated Net Income clause (3) | Uncapped | Not calculable: no covenant bridge | Acquisition-led strategy keeps these recurring | Overstates capacity | L06; L07 |
| Customer-arrangement start-up costs | Clause (l) | Uncapped | Not calculable: no covenant bridge | Broad discretionary add-back | Overstates capacity | L07 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Uncapped ratio dividends | 6.75x bank; above 2.0x notes; used for USD 4,348 million | Releveraging and value extraction | Critical | High | Fundamental credit and recovery analysis | L15; L25; L03 |
| Reclassification across baskets | Debt and restricted-payment reclassification at borrower discretion | Capacity can be reloaded | High | High | Covenant capacity and refinancing analysis | L10; L25 |
| Uncapped projected savings | 24-month add-back without cap | Ratio inflation | High | High | Earnings and leverage analysis | L07 |
| Investments in non-guarantors uncapped | Clause (1)(a) | Structural leakage | High | Medium | Structural priority analysis | L10 |
| Notes releases follow bank | Sections 10.07 and 12.07 | Collateral loss for notes | High | High | Recovery and security selection analysis | L27; L28 |
| Lien subordination not an all-lender item in clauses read | Section 9.02(b) | Uptier exposure for loans | Moderate | Low | Refinancing and liability-management analysis | L20 |
| Drafting inconsistency on acquisition step-up | Four quarters in s.6.14 versus two quarters in s.4.01(d) | Ambiguity in draw condition after acquisitions | Low | High | Liquidity analysis | L13; L16 |

### T4C.11 Capacity risk prioritisation matrix

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured debt at 5.00x paired with 6.75x ratio dividends | Critical | Moderate | Debt-funded extraction diluting first lien | Higher fixed charges | Lower first-lien recovery | Incremental and ICA joinders; dividend declarations | L09; L15; H2 |
| 2 | Uncapped covenant EBITDA add-backs | High | Moderate | Ratio inflation | Delays restrictions | Larger dilution capacity | Covenant EBITDA bridge | L07 |
| 3 | Notes releases following bank | High | Moderate | Collateral loss for notes | Neutral | Lower secured-notes recovery | Release notices | L27; L28 |
| 4 | Investments in non-guarantors and general investments | High | Formula Only | Structural leakage | Limited | Value behind foreign creditors | Investment disclosures | L10 |
| 5 | Springing revolver covenant | Low | Moderate | Late warning | Late default trigger | Value erosion before enforcement | Quarterly revolver exposure | L16; L05 |

### T4C.12 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Covenant ratios | Compliance certificate with covenant EBITDA, debt and cash | Exact headroom for all ratio tests | Ratio rows of the headroom table not calculable | Obtain latest certificate |
| Covenant EBITDA bridge | Bridge from reported EBITDA to covenant EBITDA incl. projected savings | Size of add-back inflation | Add-back inflation not quantified | Obtain bridge |
| Basket usage | Usage of general debt, foreign debt, investment, joint-venture and dividend baskets and builder | Remaining capacity | Remaining capacity not established | Obtain usage tracker |
| Covenant debt definition | Consolidated Total Indebtedness and Total Assets definitions | Numerator and basket size | Definition conflict with carrying debt unresolved | Read definitions |
| MFN start date | Amendment No. 17 effective date | Sunset timing | Sunset date stated as relative condition only | Confirm effective date |

### Material claim lineage

| Claim | Material claim | Strongest lineage | Evidence ID |
|---|---|---|---|
| A | Maintenance test is revolver-only, springing at 7.50x above 40% usage | Directly Sourced | L16; L02 |
| B | Bank dividends unlimited at 6.75x | Directly Sourced | L15 |
| C | Notes dividends unlimited above 2.0x coverage | Directly Sourced | L25 |
| D | Pari secured debt to 5.00x; notes lien ratio 5.25x | Directly Sourced | L09; L23 |
| E | Uncapped 24-month projected-savings add-back | Directly Sourced | L07 |
| F | Notes liens and guarantees follow bank releases | Directly Sourced | L27; L28 |
| G | Only new subsidiaries can be unrestricted | Directly Sourced | L11 |
| H | Subordinated blockage up to 179 days | Directly Sourced | L30 |
| I | Revolver exposure 7.36%, headroom 32.64% to trigger | Calculated | L05; L16 |
| J | Guarantor group 79.27% of net sales | Calculated | L05 |
| K | Package is aggressive overall | Analyst Inference | T4.11 |
| L | Uptier theoretically possible for loans | Analyst Inference | L20 |
| M | Ratio headroom not established | Insufficient Information | L02 |
| N | First-lien enforcement control not established | Insufficient Information | L22 |

### Verification

| Register | Result | Note |
|---|---|---|
| T4F.1 to T4F.6 | PASS | Present with required columns; intercreditor cells marked insufficient where the agreement is absent |
| T4D.1 to T4D.8 | PASS | Every entity class has a row; undisclosed values shown as a dash or insufficient, never zero |
| T4C.2 to T4C.12 | PASS | Ratio headroom marked not calculable where inputs are missing |
| T4.2 to T4.13 | PASS | Market-norm comparison recorded as conditional skip |

## Calculations

All amounts are USD millions at 30 September 2024 unless stated. Ratios use matching units, and percentages are rounded to two decimals from exact fractions. No covenant ratio, covenant EBITDA or basket capacity is calculated, because the covenant inputs are not disclosed.

| ID | Quantity | Formula and inputs | Result | Unit | Source |
|---|---|---|---|---|---|
| L1 | Revolver exposure as share of commitments | USD 67 million letters of credit / USD 910 million commitments = 0.073626373626373626373626373626373626374 | 7.36% | % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L2 | Exposure at which the springing test applies | 0.40 × USD 910 million = 364.00 | USD 364 million, matching the annual report | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, page 188 |
| L3 | Headroom to springing-test trigger | 40.00% − 7.36% | 32.64% | % of commitments | calculation L1; d887611dex101.htm.jsonl, page 188 |
| L4 | Draw-condition exposure and headroom | 0.35 × USD 910 million = 318.50; 35.00% − 7.36% = 27.64% | USD 318.50 million; 27.64% | USD million; % of commitments | d887611dex101.htm.jsonl, page 165; calculation L1 |
| L5 | Revolver availability check | USD 910 million − USD 67 million = 843 | USD 843 million, matching reported availability | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| L6 | Guarantor group share of consolidated net sales | USD 6,294 million / USD 7,940 million = 0.79269521410579345088161209068010075567 | 79.27% | % | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| L7 | Indicative non-guarantor net sales | USD 7,940 million − USD 6,294 million | USD 1,646 million; indicative only because USD 28 million of sales to non-guarantors are shown separately | USD million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |

## Gaps

The gaps below limit numerical headroom, intercreditor control and series-level conclusions. They do not affect the provision-level reading of the documents that were reviewed.

| Gap | Severity | What is missing | Effect on conclusions | Source |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement of 13 February 2019 and Joinders 1–6 | Enforcement direction, standstill, turnover and purchase options among first-lien classes not established | d887611dex41.htm.jsonl, page 30 |
| Covenant calculations | MATERIAL | Compliance certificate, covenant EBITDA bridge, covenant debt | Ratio headroom for 7.50x, 6.75x, 7.25x, 5.00x, 5.25x, 5.75x and 2.0x tests not established | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Basket usage | MATERIAL | Usage of debt, investment, joint-venture, dividend and builder baskets | Remaining capacity not established | d887611dex101.htm.jsonl, pages 59–63 |
| Other indentures | MATERIAL | 2028 to 2032 secured and January and May 2029 subordinated indentures | Notes conclusions limited to 2033 and 2027 series | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| Collateral documents | MINOR | Guarantee and Collateral Agreement, security schedules, UK security | Collateral reach qualitative | d887611dex101.htm.jsonl, pages 173–174 |
| Unread definitions and clauses | MINOR | Consolidated Total Indebtedness, Required Lenders, Total Assets, remaining amendment clauses, 2027 indenture turnover and governing law | Uptier and capacity readings provisional | d887611dex101.htm.jsonl, pages 204–205 |
| Drafting inconsistency | MINOR | Section 6.14 uses four quarters and section 4.01(d) two quarters for the acquisition step-up | Draw availability after a Material Acquisition ambiguous | d887611dex101.htm.jsonl, page 165; d887611dex101.htm.jsonl, page 188 |
| Tranche L MFN sunset | MINOR | Amendment No. 17 effective date not confirmed | Pricing protection ends 18 months after the effective date; no fixed date is set until that date is confirmed | d887611dex101.htm.jsonl, page 144 |

## Next module
The orchestrator selects the next module.