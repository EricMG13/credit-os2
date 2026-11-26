## Request
Legal and covenant assessment of TransDigm Group Incorporated (holdings) and its borrower TransDigm Inc., as of 2024-09-30, under the deep_credit_assessment pathway. Scope: controlling debt documents, covenant architecture, debt, lien and leakage capacity, guarantees and collateral, structural priority, intercreditor control and covenant headroom, read retrospectively from the documents supplied.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| d887611dex101.htm.jsonl | Amendment No. 17 and Incremental Term Loan Assumption Agreement to the Second Amended and Restated Credit Agreement dated as of June 4, 2014, with the conformed (marked) credit agreement as Annex I | 2024-09-19, agreement date | e7226c6fe4bac0a47357ed88e4c6270362396d4d461427eb6849ac790a75c7b8 | Controlling credit-agreement text: springing financial covenant, ratio debt, incremental and MFN terms, restricted payments, investments, unrestricted-subsidiary designation, guarantee and pledge requirements, amendment thresholds, collateral release, enforcement by the agent |
| d887611dex41.htm.jsonl | Indenture for the 6.000% Senior Secured Notes due 2033 | 2024-09-19, indenture date | 10cde4db465fad419d6cd9a306ffac035f9cc5b1e7fa7de3e2fbf15e1610929c | Secured-note covenants: ratio debt, lien ratio, restricted payments, EBITDA add-backs, amendment thresholds, collateral agency, intercreditor reference, lien release |
| d826058dex41.htm.jsonl | Indenture for the 5.500% Senior Subordinated Notes due 2027 | 2019-11-13, indenture date | 76c7986f4027d668729899c1a0879ca79b6a085e9b123aff9be6889e28e200f4 | Subordination and payment-blockage mechanics |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl | Annual report on Form 10-K for the year ended 30 September 2024 | 2024-11-07, signature date | d75c469fdb1966dd895c0f6faa6d5179b380d3ed95aa00aca99aa258059edab6 | Issuer description of guarantees and ranking, guarantor-group summary, facility amounts, springing-covenant trigger, covenant compliance statement, latest covenant amendment; retrospective evidence |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Issuer, date, selected legal documents and temporal restriction; missing-document inventory |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Carrying debt, instrument register, net leverage and its October 2024 pro forma, liquidity; not substituted for covenant definitions |
| Business & governance | CP-1A | 06c6c293b29f24227d40dd377d947c933c09d099672eaa200e6646a442cf6fb7 | Dividend recapitalisation amount, funding and payment date; ownership of the borrower |
| Earnings quality | CP-1D | c04f8321af9b599a679a4ac56ff1b428514fb95808dac8cb56997d1a625100fa | Recurrence challenge to issuer adjustments, used as context for covenant add-back inflation |

The earlier 2013 and 2014 restatement agreements and Amendment No. 16 were in the source set but were not relied on; the conformed annex to Amendment No. 17 is treated as the operative credit-agreement text.

## Findings

### Bottom line
Covenants will not force early creditor intervention: TransDigm can add pari secured debt up to a 5.00x secured net test and pay unlimited dividends while pro forma net leverage stays within 6.75x, so financial policy drives default risk. The only maintenance test is a 7.50x net leverage covenant that springs for revolving lenders when revolver exposure exceeds 40% of commitments; letters of credit put exposure at 7.36% at year-end. The September recapitalisation shows the capacity is usable: USD 3,000 million of new secured debt funded 69% of a USD 4,348 million dividend. The main protections are equal payment rank and shared first-priority collateral between term loans and secured notes, a two-thirds noteholder vote to release substantially all collateral, and each-holder consent to change note ranking. The main loss-given-default weaknesses are automatic release of note liens when the bank agent releases, unlimited investment into non-guarantor restricted subsidiaries, and no explicit each-lender protection against lien subordination in the credit agreement.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 181; d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; d887611dex41.htm.jsonl, pages 117–118; d887611dex41.htm.jsonl, page 137; Business & governance (CP-1A); calculation K6; calculation K12

### Key findings
- **The covenant package is cov-lite, so default signals will come from liquidity and refinancing, not a covenant breach.** Term loans and all notes carry no maintenance covenant. The revolver test of 7.50x (8.00x for four quarters after a material acquisition) applies only when quarter-end revolver exposure exceeds 40% of commitments, or USD 364 million, against USD 67 million of letters of credit at year-end. Even a breach becomes a term-loan default only if revolving lenders accelerate, so term lenders and noteholders have no early seat at the table.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62; d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; calculation K6; calculation K8
- **Secured debt capacity is set by ratios, not fixed caps, and the issuer has used it.** The credit agreement allows debt with equal lien priority up to a 5.00x secured net ratio and junior or unsecured debt up to 7.25x net leverage; the 2033 indenture allows secured ratio debt up to 5.25x and general ratio debt at fixed-charge cover above 2.0x. The borrower can reclassify debt between baskets, and acquisition financing is tested at signing. Most-favoured-nation protection is 50 bp, applies only to incremental term loans, falls away after 18 months and excludes acquisition debt. Each new secured dollar is pari passu with existing first-lien claims, so it dilutes recovery directly.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 61; d887611dex101.htm.jsonl, pages 144–145; d887611dex41.htm.jsonl, page 43; d887611dex41.htm.jsonl, page 79
- **Leakage rests mainly on ratio-based dividends; unrestricted-subsidiary drop-downs are bounded.** The credit agreement permits unlimited restricted payments at pro forma net leverage of 6.75x or less, and the 2033 indenture permits them while fixed-charge cover exceeds 2.0x. That makes the bank test the binding constraint. Investment in unrestricted subsidiaries is capped at the greater of USD 250 million and 10% of covenant EBITDA, and only newly acquired or newly formed subsidiaries can be designated unrestricted. Investment in any restricted subsidiary, including foreign non-guarantors, is unlimited. Non-guarantors already generate about USD 1,646 million of sales, so value can migrate away from guarantor claims without a designation.
Basis: d887611dex101.htm.jsonl, page 61; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, page 181; d887611dex41.htm.jsonl, page 75; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; calculation K1; calculation K2
- **The open uptier path runs through the credit agreement amendment clause.** Each-lender consent covers payment terms, pro rata sharing, voting percentages, release of a material guarantor and release of substantially all collateral. It does not expressly cover subordinating the facility's liens or payment priority, so in principle a required-lender majority could consent to priming. Non-pro-rata prepayment needs only required-lender consent, provided offers are made to all lenders of a class. The 2033 indenture is tighter: a ranking change needs each affected holder and a collateral release needs two-thirds of holders. However, its liens fall away automatically when the bank collateral agent releases the same collateral, except on a full cash discharge of the bank debt. This vulnerability is theoretical; the documents show no use of it.
Basis: d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 117–118; d887611dex41.htm.jsonl, page 137
- **Covenant EBITDA can run well ahead of reported earnings, which expands every ratio and grower basket.** Projected cost savings for actions within 24 months can be added back, capped at 25% of post-adjustment EBITDA in the credit agreement and 35% in the 2033 indenture. That equals up to 33.33% and 53.85% of EBITDA before the add-back. The indenture also adds back dividend-equivalent payments, so the recapitalisation's option payouts raise the earnings measure that tests the next transaction.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex41.htm.jsonl, page 16; calculation K10; calculation K11

### Contrary evidence and what would change the view
The strongest evidence against an aggressive reading has three parts. First, the issuer stated that it complied with all debt covenants at year-end. Second, the September amendment could take effect only if pro forma net leverage was no more than 7.25x and the secured net ratio no more than 5.00x after the new term loan, and a financial officer had to certify both. Third, several design features limit the classic attacks: debt raised under the ratio basket must be an obligation of loan parties only and secured only on existing collateral, existing subsidiaries cannot be designated unrestricted, and noteholders hold each-holder protection on ranking. Financial foundation also shows strong earnings and cash generation: year-end net leverage was 4.88x on reported EBITDA, or 6.02x pro forma for the October 2024 dividend payment. That measure uses a different definition from the covenant, so it is context only, not covenant headroom. The view would soften if a compliance certificate showed covenant ratios well below the 6.75x dividend test, or if an amendment added each-lender protection against lien subordination and limits on non-guarantor investment. It would harden if revolver exposure moved towards the 40% trigger, if the company used the 18-month window to issue unprotected term debt, or if it raised secured debt to fund another distribution.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; d887611dex101.htm.jsonl, page 4; d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, pages 117–118; Financial foundation (CP-1)

### Limitations
- The first-lien intercreditor agreement is not among the documents reviewed. Who directs enforcement between the bank agent and the noteholders' collateral agents, how long any standstill lasts and how proceeds are shared are therefore not established. The conclusion that noteholders follow bank-led enforcement rests on the indenture alone and could prove stronger or weaker for noteholders.
- No compliance certificate or covenant-defined ratio was supplied. Headroom on every ratio test is therefore not calculable, except the revolver usage trigger. The judgement that dividend and debt capacity is wide is qualitative and could reverse if the covenant net leverage sits close to the 6.75x dividend test.
- The guarantee and collateral agreement, security documents and guarantor exhibit are not in the set. Excluded assets, perfection gaps and the exact guarantor list are not established, so the loss-given-default view on secured claims is directional only.
- The current credit-agreement text is a marked-up annex that shows both deleted and inserted wording. This review reads the inserted wording as operative but cannot confirm it visually. Amendment No. 15, which the annual report names as the latest covenant change, was not supplied on its own, so confidence in the exact thresholds is lower.
- Indentures for the 2028 to 2032 secured notes and the 2029 subordinated notes were not supplied. Their baskets and release terms may differ from the 2033 and 2027 indentures, which could widen debt or leakage capacity beyond what is assessed here.
- No basket-usage history was supplied. Remaining room under the dividend, investment and general debt baskets is not established, so the ranking of pressure points rests on legal design rather than capacity actually used.

### Covenant-implication summary
The table shows that every creditor-relevant constraint is an incurrence ratio or a consent threshold, not a maintenance test. The two bank-side ratios that matter most, 5.00x secured and 6.75x for dividends, cannot be measured from the documents supplied.

| Provision | Threshold or trigger | Who it protects | Status at year-end | Creditor consequence |
|---|---|---|---|---|
| Springing net leverage covenant | 7.50x, tested only above 40% revolver use | Revolving lenders only | Not triggered; usage 7.36% | No early warning for term loans or notes |
| Pari secured ratio debt | 5.00x secured net ratio | All first-lien classes, weakly | Current ratio not supplied | Pari dilution of collateral without consent |
| Unlimited dividends | 6.75x net leverage pro forma | All creditors | Current ratio not supplied | Ratio-based extraction route |
| Notes ratio debt and dividends | Fixed-charge cover above 2.0x | Noteholders | Current ratio not supplied | Looser than bank test |
| Collateral release, notes | Two-thirds of holders, or automatic with bank release | Secured noteholders | In force | Bank majority decides release |
| Subordinated note blockage | 179 days in any 360 days | Senior creditors | In force | Payment standstill for junior class |

### Definitions and ratio mechanics
Covenant leverage measures debt net of unrestricted cash, meaning cash held by holdings, the borrower and restricted subsidiaries and not pledged to anyone other than the bank secured parties. It divides that by a covenant EBITDA that differs from reported earnings. For the springing covenant the credit agreement uses a separate financial-covenant EBITDA, while the annual report describes the test as net debt to trailing EBITDA As Defined. The executed text governs, and the gap is logged as a definition conflict. Pro forma cost savings over 24 months and, in the 2033 indenture, dividend-equivalent payments raise the denominator. This loosens every ratio and enlarges every basket expressed as a percentage of covenant EBITDA. Earnings quality found that acquisition, compensation and refinancing adjustments recur. Covenant EBITDA therefore probably sits above an earnings base suitable for credit analysis, so covenant ratios will understate economic leverage.
Basis: d887611dex101.htm.jsonl, page 24; d887611dex101.htm.jsonl, page 81; d887611dex41.htm.jsonl, page 16; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Earnings quality (CP-1D)

### Debt, lien and priming capacity
Capacity is layered. Ratio debt with equal lien priority runs to a 5.00x secured net ratio under the credit agreement and 5.25x under the 2033 indenture. Junior-lien and unsecured debt runs to 7.25x net leverage. On top sit grower baskets such as general debt at the greater of USD 250 million and 10% of covenant EBITDA, and a USD 400 million cap on ratio debt at non-guarantor restricted subsidiaries under the indenture. Because the borrower can reclassify debt between baskets and test acquisition debt at signing, the baskets cannot simply be added together. The most important constraint is that ratio debt must be owed only by loan parties, secured only on collateral and no earlier-maturing than the term loans. That limits structurally senior debt but not pari dilution. The recapitalisation shows the route working: new pari secured term debt and notes funded a dividend rather than earnings-generating assets.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 61; d887611dex41.htm.jsonl, page 43; d887611dex41.htm.jsonl, page 79; Business & governance (CP-1A)

### Collateral, guarantees and structural priority
Holdings has no significant operations or assets of its own. The obligor group of holdings, the borrower, TransDigm UK and the domestic restricted subsidiaries reported about 79% of consolidated sales and 78% of consolidated assets on the issuer's combined basis. Non-guarantor subsidiaries therefore carry a material minority of value, to which all notes and loans are structurally subordinated. Their creditors are paid first from that value. Foreign value can be reached only through a pledge of 65% of voting equity, and the pledge can be dropped where it would require separate subsidiary financial statements. New domestic subsidiaries must join within 20 business days unless immaterial, unrestricted or securitization entities, which keeps the domestic perimeter largely sealed. Unlimited investment into foreign restricted subsidiaries is the open route by which collateral value can move outside guarantor reach.
Basis: TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59; d887611dex101.htm.jsonl, pages 173–174; d887611dex101.htm.jsonl, page 61; calculation K1; calculation K4

### Defaults, remedies and amendment control
Payment default on interest has a five-business-day grace period under the credit agreement. A breach of the springing covenant is enforceable only by revolving lenders and reaches term lenders only once revolving lenders accelerate. Required lenders control waivers; only the revolving majority can amend the springing covenant. Two features let a majority reshape the structure without unanimous consent. A majority can agree to secure new pari or junior debt on collateral, and a majority can permit non-pro-rata prepayment through offers to an entire class. Each-lender consent protects payment terms and collateral release. Together with the absence of an express lien-subordination protection, this places the key control on the bank side and makes the noteholders' collateral position follow bank decisions.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 191; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, page 137

### Intercreditor read-through
Within the first-lien group, the bank agent alone proceeds against collateral for bank lenders, and noteholders cannot enforce security directly. Their collateral agents act under a first-lien intercreditor agreement dated February 2019, joined for the 2033 notes in September 2024, and that agreement prevails over the indenture in any conflict. Because the agreement itself was not supplied, the rules on who directs enforcement, how long any standstill lasts and how proceeds are turned over and shared are not established. An unexamined intercreditor agreement is not treated as benign. Lien rank between bank debt and notes is pari passu under the indenture and the annual report. Subordinated noteholders are subordinated in payment and can be blocked from receiving payments for 179 days in any 360-day period after a senior default notice. That pushes their realised recovery behind the full first-lien and senior class.
Basis: d887611dex101.htm.jsonl, page 197; d887611dex41.htm.jsonl, page 30; d887611dex41.htm.jsonl, page 128; d887611dex41.htm.jsonl, page 135; d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58

### Nearest pressure point
The nearest pressure point is the 5.00x pari secured ratio-debt route, because the revolver covenant is far from being triggered. The capacity sits in the credit agreement's ratio-debt clause, with the parallel 5.25x lien ratio in the 2033 indenture. It is usable without lender consent and was used in September to fund a distribution. If earnings weaken or another distribution is financed, new pari secured debt shrinks first-lien recovery per dollar of claim before any default occurs. The default risk then shows up as refinancing strain against the receivables-facility maturity and the 2028 to 2029 wall rather than as a covenant breach. Signals to monitor are new secured issuance outside refinancing, revolver use above the trigger, further special dividends and any amendment touching lien priority. Tightening this view requires a compliance certificate with the secured net ratio and net leverage on the covenant definitions, plus the intercreditor agreement.
Basis: d887611dex101.htm.jsonl, page 59; d887611dex41.htm.jsonl, page 43; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62; Financial foundation (CP-1); Business & governance (CP-1A)

### Downside path
The trigger would be a fall in aftermarket demand while the company keeps paying dividends. Covenant EBITDA would decline more slowly than cash because of pro forma add-backs, so the dividend and debt ratios would still allow distributions or secured borrowing after cash cover has weakened. Cash would fall first, then revolver use would rise. Only if use passed 40% at a quarter-end would the 7.50x test apply, and only revolving lenders could act on it. By then, any new pari secured debt would have diluted first-lien recovery and junior noteholders would face a possible 179-day payment block. Observable triggers are quarterly revolver exposure, secured issuance not used to refinance, dividend declarations and amendments to the credit agreement's consent clause.
Basis: d887611dex101.htm.jsonl, page 188; d887611dex101.htm.jsonl, page 181; d826058dex41.htm.jsonl, page 107; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Overall legal credit view
Overall, TransDigm presents an aggressive covenant package. Maintenance protection is limited to a distant springing test, debt and dividend capacity is ratio-based and has been used for a debt-funded distribution, and covenant EBITDA allows large add-backs. The main protections are equal-rank first-lien sharing, two-thirds and each-holder consent thresholds in the 2033 indenture, ratio debt confined to loan parties and collateral, and a designation power limited to new subsidiaries. The main weaknesses are majority-controlled pari and junior lien amendments, no explicit lien-subordination protection in the credit agreement, note liens that follow bank releases and unlimited investment into non-guarantor restricted subsidiaries. The primary default risk is a releveraging distribution or acquisition financed with secured debt while cash cover weakens, with no covenant forcing a negotiation. The primary loss-given-default risk is pari dilution and value migrating to non-guarantors. For security selection, the most important legal point is that secured notes share collateral equally with bank debt but follow bank control. Further analysis requires the intercreditor agreement, security documents, a compliance certificate and basket-usage records. The covenant aggressiveness score is 4 of 5 on a provisional basis, completed with limitations.
Basis: d887611dex101.htm.jsonl, pages 59–61; d887611dex101.htm.jsonl, page 81; d887611dex101.htm.jsonl, pages 204–206; d887611dex41.htm.jsonl, pages 117–118; d887611dex41.htm.jsonl, page 137; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62

### Capital structure

| Instrument | Principal or commitment | Ranking and security | Governing document reviewed | Legal read-through | Source |
|---|---|---|---|---|---|
| Revolving credit facility | USD 910 million commitment; USD 67 million letters of credit; USD 843 million available | First-lien secured; pari with term loans and secured notes | Credit agreement annex to Amendment No. 17 | Holds the only maintenance test, springing above 40% usage | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Term loans I, J, K, L | USD 8,702 million total: I 1,871; J 3,632; K 1,699; L 1,500 | First-lien secured; Holdings and domestic restricted subsidiary guarantees | Credit agreement annex to Amendment No. 17 | Required-lender amendment control; MFN 50 bp with 18-month sunsets | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| 2028, 2029, 2030, 2031 and 2032 secured notes | USD 2,100; 2,750; 1,450; 1,000; 2,200 million | First-lien secured; equal payment rank with credit facilities | Not supplied; indentures not in set | Terms assumed comparable only where the annual report says guarantors match | Financial foundation (CP-1) |
| 2033 secured notes | USD 1,500 million | First-lien secured; Holdings and qualifying restricted-subsidiary guarantees | 2033 indenture | Liens follow bank agent release; two-thirds vote for collateral release | Financial foundation (CP-1); d887611dex41.htm.jsonl, page 137 |
| 2027 senior subordinated notes | USD 2,650 million | Unsecured; subordinated to senior debt | 2027 indenture | 179-day payment blockage in any 360 days | Financial foundation (CP-1); d826058dex41.htm.jsonl, page 107 |
| January and May 2029 senior subordinated notes | USD 1,200 and USD 750 million | Unsecured; subordinated to senior debt | Not supplied; indentures not in set | Blockage terms not verified for these notes | Financial foundation (CP-1) |
| Receivables securitization facility | USD 487.5 million drawn of USD 650 million | Securitization entity; legal rank not established | Not supplied | Outside the guarantor credit group; matures July 2025 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Net debt to reported EBITDA, year-end | 4.88x; 6.02x pro forma for the October 2024 dividend payment | Analytical measure, not a covenant ratio | Not applicable | Does not measure covenant headroom | Financial foundation (CP-1) |

### Covenant tests and headroom

| Test | Document and clause | Threshold | Current | Status | Credit consequence | Source |
|---|---|---|---|---|---|---|
| Springing covenant trigger: revolver exposure to commitments | Credit agreement Section 6.14 | 40.00% | 7.36% | Not triggered; 32.64% headroom | Maintenance test dormant | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Consolidated net leverage, springing, revolving lenders only | Credit agreement Section 6.14 | 7.50x (8.00x after material acquisition) | Not supplied: no compliance certificate | Not calculable; issuer states compliance | No early-warning value for term loans and notes | d887611dex101.htm.jsonl, page 188; TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| Pari secured ratio debt and incremental condition | Credit agreement clause (12) of Permitted Indebtedness; Section 2.24(c) | 5.00x secured net | Not supplied: covenant ratio not disclosed | Not calculable; certified met on Amendment No. 17 effectiveness | Pari dilution capacity | d887611dex101.htm.jsonl, page 59; d887611dex101.htm.jsonl, page 4 |
| Junior or unsecured ratio debt | Credit agreement clause (12) | 7.25x net leverage | Not supplied: covenant ratio not disclosed | Not calculable | Layering capacity | d887611dex101.htm.jsonl, page 59 |
| Unlimited restricted payments | Credit agreement Section 6.02 | 6.75x net leverage pro forma | Not supplied: covenant ratio not disclosed | Not calculable | Binding constraint on dividends | d887611dex101.htm.jsonl, page 181 |
| Secured ratio debt liens | 2033 indenture, Permitted Liens clause (xxxi) | 5.25x secured net | Not supplied: covenant ratio not disclosed | Not calculable | Note-side pari capacity | d887611dex41.htm.jsonl, page 43 |
| Ratio debt and unlimited restricted payments | 2033 indenture Sections 4.09 and 4.07 | Fixed-charge cover above 2.0x | Not supplied: covenant ratio not disclosed | Not calculable | Looser than bank tests | d887611dex41.htm.jsonl, page 75; d887611dex41.htm.jsonl, page 79 |

### Chart data: covenant headroom

| Test | Threshold | Current | Headroom | Direction | Reporting unit | Basis and limitation |
|---|---|---|---|---|---|---|
| Springing trigger: revolver exposure to revolving commitments | 40.00 | 7.36 | 32.64 percentage points | Passes at or below | % of revolving commitments | Letters of credit USD 67 million over USD 910 million commitments; assumes no cash-collateralized letters of credit and no revolving loans, consistent with USD 843 million availability; the covenant applies only if exposure exceeds 40% at quarter-end |
| Consolidated net leverage, springing covenant | 7.50 | Not supplied: no compliance certificate or covenant ratio | Not supplied: current tested ratio missing | Passes at or below | x | 8.00x for four quarters after a material acquisition; tested only when the trigger is exceeded; issuer states compliance at 2024-09-30 |
| Pari secured ratio debt, credit agreement | 5.00 | Not supplied: covenant secured net ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Incurrence test; certified met at Amendment No. 17 effectiveness after the new term loan |
| Junior or unsecured ratio debt, credit agreement | 7.25 | Not supplied: covenant net leverage not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Incurrence test; also the incremental-facility condition |
| Unlimited restricted payments, credit agreement | 6.75 | Not supplied: covenant net leverage not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Pro forma for the payment and its financing; no default |
| Secured ratio debt liens, 2033 indenture | 5.25 | Not supplied: covenant secured net ratio not disclosed | Not supplied: current tested ratio missing | Passes at or below | x | Incurrence test on lien grant; acquisition debt tested at signing |
| Ratio debt and unlimited restricted payments, 2033 indenture | 2.0 | Not supplied: covenant fixed-charge cover not disclosed | Not supplied: current tested ratio missing | Passes above | x | The covenant requires cover greater than 2.0x; no default for restricted payments |

Only the revolver-usage trigger can be measured; every leverage and coverage test lacks a covenant-defined current ratio, and this chart is not a legal compliance opinion.

### Events: Legal

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| 2019-02-13 | day | 2024-09-19 | First-lien intercreditor agreement governing shared collateral between bank lenders and secured noteholders | Historical — First Lien Intercreditor Agreement, dated as of February 13, 2019 | d887611dex41.htm.jsonl, page 30 | Controls enforcement and sharing among first-lien classes; text not supplied |
| 2019-11-13 | day | 2019-11-13 | Indenture for the 2027 senior subordinated notes | Historical — Dated as of November 13, 2019 | d826058dex41.htm.jsonl, page 1 | Sets the 179-day payment blockage behind senior debt |
| 2024-03-22 | day | 2024-11-07 | Amendment No. 15, latest amendment affecting credit-agreement restrictive covenants | Historical — Amendment No. 15, executed on March 22, 2024 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 | Separate document not supplied; conformed annex relied on |
| 2024-09-19 | day | 2024-09-19 | Amendment No. 17 and USD 1,500 million Tranche L incremental term loan funding a special dividend | Historical — dated as of September 19, 2024 | d887611dex101.htm.jsonl, page 1 | Demonstrated use of pari secured capacity; the October 2024 dividend payment itself is recorded by Business & governance |
| 2024-09-19 | day | 2024-09-19 | 2033 secured notes indenture and intercreditor Joinder No. 6 | Historical — Dated as of September 19, 2024 | d887611dex41.htm.jsonl, page 1; d887611dex41.htm.jsonl, page 30 | Adds USD 1,500 million pari first-lien claim |
| 2024-09-30 | day | 2024-11-07 | Issuer statement of compliance with all debt covenants | Historical — in compliance with all of its debt covenants | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 | Confirms no breach; no ratio disclosed |
| 2027-09-15 | day | 2024-09-19 | First optional redemption date of the 2033 secured notes | Scheduled — Initial Redemption Date | d887611dex41.htm.jsonl, page 30 | Ends make-whole protection; refinancing and liability-management optionality rises |

### Map: legal entities

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| TransDigm Group Incorporated | Holds its investment in the borrower; no significant separate operations or assets | Ownership | TransDigm Inc. | Annual report, issuer and guarantor description; both entities are Delaware corporations per Amendment No. 17 |
| TransDigm Group Incorporated | Guarantees on a senior secured basis | Guarantee | 2033 secured noteholders | Annual report guarantee description; 2033 indenture; Delaware guarantor |
| Domestic Restricted Subsidiaries | Guarantee on a senior secured basis, same guarantors as the 2028 notes | Guarantee | 2033 secured noteholders | Annual report guarantee description; 2033 indenture Section 4.17; United States domestic entities |
| Domestic Restricted Subsidiaries | Must join as loan parties and grant liens within 20 business days unless excluded | Guarantee | Credit facility lenders | Credit agreement Section 5.11(a); United States domestic subsidiaries |
| TransDigm UK | Guarantees the subordinated notes on a senior subordinated basis | Guarantee | Senior subordinated noteholders | Annual report guarantee description; United Kingdom entity by name, incorporation not re-verified |
| TransDigm Group Incorporated | Guarantees the subordinated notes on a senior subordinated basis | Guarantee | Senior subordinated noteholders | Annual report guarantee description; 2027 indenture; Delaware guarantor |
| Loan Parties | Pledge 65% of voting and 100% of non-voting equity of first-tier foreign subsidiaries, plus liens on collateral | Security | Credit facility lenders | Credit agreement Section 5.11(b); pledge excluded where separate SEC financial statements would be required; United States loan parties |
| Loan Parties | Grant first-priority liens on collateral, matching what the credit facilities require | Security | 2033 secured noteholders | 2033 indenture Sections 12.03 and 12.06; Delaware borrower and holdings |
| Non-guarantor subsidiary creditors | Paid ahead of all notes and loans from non-guarantor assets | Structural claim | Non-guarantor subsidiaries | Annual report states notes are structurally subordinated to non-guarantor liabilities; foreign and excluded subsidiaries, jurisdictions not itemised |

### Map: intercreditor

| From | Relationship | Edge type | To | Evidence |
|---|---|---|---|---|
| 2033 secured noteholders | Rank equally in right of payment | Payment rank | Credit facility lenders | Annual report ranking description; Delaware obligors |
| Senior subordinated noteholders | Subordinated in right of payment to senior debt | Payment rank | Credit facility lenders | 2027 indenture Article 10; annual report; Delaware obligors |
| Senior subordinated noteholders | Junior in right of payment | Payment rank | 2033 secured noteholders | Annual report states secured notes are senior to subordinated notes; Delaware obligors |
| Credit facility lenders | Blockage notice can stop subordinated payments for up to 179 days in any 360 days | Standstill | Senior subordinated noteholders | 2027 indenture Section 10.03; Delaware issuer |
| Credit agreement Agent | Has the sole right to proceed against collateral for bank lenders | Enforcement control | Credit facility lenders | Credit agreement Article VIII acknowledgement; Delaware loan parties |
| Notes Collateral Agents | Enforce security for holders, subject to intercreditor agreements; holders cannot enforce directly | Enforcement control | 2033 secured noteholders | 2033 indenture Sections 12.01 and 12.08; US and UK collateral agents |
| Credit agreement Agent | Its release of collateral liens releases the note liens on the same assets, except on full cash discharge | Release | 2033 secured noteholders | 2033 indenture Section 12.07(e)(B); Delaware grantors |
| 2033 secured noteholders | Share first-priority liens on common collateral under the intercreditor agreement | Security rank | Credit facility lenders | 2033 indenture intercreditor definition and Section 12.06; credit agreement Section 9.02(b) pari passu securing; Delaware grantors |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 12 |
| Calculated | 3 |
| Assumption-Based | 0 |
| Analyst Inference | 4 |
| Weak Lineage | 0 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 3 |
| Fields present | 27 |
| Fields total | 32 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 2 |

### Analytical appendix — complete canonical registers

All registers use the evidence identifiers defined in the evidence reference table immediately below. Monetary amounts are USD millions unless stated. Module status: Completed with Limitations. Covenant aggressiveness: 4 of 5, Provisional.

### Evidence references

| Evidence ID | Evidence | Source |
|---|---|---|
| E01 | Ranking of secured and subordinated notes; guarantor scope; structural subordination to non-guarantor liabilities; holdings has no significant separate assets | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 58 |
| E02 | Guarantor-group summary: net sales 6,294; current assets 7,813; goodwill 8,186; other non-current assets 3,889; term loans 8,702; revolver 910; letters of credit 67; availability 843 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| E03 | Amendment No. 15 of 2024-03-22 is latest covenant-affecting amendment; notes covenant compliance | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 61 |
| E04 | No maintenance covenants other than revolver; 40% trigger, USD 364 million; 7.50x or 8.00x; compliance at 2024-09-30; collateral includes cash; securitization 487.5 drawn of 650, maturity 2025-07-11 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| E05 | Amendment No. 17 parties, Delaware borrower and holdings, Tranche L 1,500 under Section 2.24; base agreement dated 2014-06-04 | d887611dex101.htm.jsonl, page 1 |
| E06 | Tranche L proceeds with 2033 notes and cash fund special dividend and dividend equivalents | d887611dex101.htm.jsonl, page 2 |
| E07 | Annex amends by stricken and underlined text; effectiveness requires pro forma net leverage at most 7.25x and secured net at most 5.00x, with officer certificate and solvency certificate | d887611dex101.htm.jsonl, pages 3–4 |
| E08 | Credit agreement cost-savings add-back capped at 25.0% of Consolidated EBITDA for any four-quarter period, calculated after the adjustment | d887611dex101.htm.jsonl, page 24 |
| E09 | Ratio debt clause (12): pari secured at secured net ratio 5.00x; junior or unsecured at net leverage 7.25x; loan-party obligors only; collateral-only liens; maturity and life not earlier than term loans; general basket (13) greater of 250 and 10.0% of Consolidated EBITDA | d887611dex101.htm.jsonl, page 59 |
| E10 | Reclassification in sole discretion; acquisition ratio tests at signing; unlimited investments in restricted subsidiaries; unrestricted-subsidiary investments greater of 250 and 10.0% of Consolidated EBITDA | d887611dex101.htm.jsonl, page 61 |
| E11 | Unrestricted Cash definition; designation only of newly acquired or formed subsidiaries, with certification of restricted-payment and investment compliance and no recourse debt | d887611dex101.htm.jsonl, page 81 |
| E12 | MFN: 50 bp yield differential; inapplicable to acquisition debt, debt after 18 months from the relevant amendment effective date, or long-dated debt; more favourable incremental terms incorporated | d887611dex101.htm.jsonl, pages 144–145 |
| E13 | Domestic subsidiaries join within 20 business days unless excluded; 65% voting foreign pledge; pledge carve-out for SEC separate-statement requirements and unrestricted-subsidiary equity | d887611dex101.htm.jsonl, pages 173–174 |
| E14 | Restricted payments: general basket greater of 75 and 3.0% of Consolidated EBITDA; clause (10) 1,500 expired with 500 repurchase continuation; unlimited payments at pro forma net leverage at most 6.75x with no default | d887611dex101.htm.jsonl, pages 180–181 |
| E15 | Section 6.14: 7.50x, or 8.00x for four quarters after a material acquisition, if exposure exceeds 40% of commitments, excluding letters of credit cash-collateralized at 103%; amendable only by Required Revolving Lenders | d887611dex101.htm.jsonl, page 188 |
| E16 | Financial covenant default is a term-loan default only after revolving acceleration; interest grace five business days | d887611dex101.htm.jsonl, pages 188–191 |
| E17 | Agent has the sole right to proceed against the collateral | d887611dex101.htm.jsonl, page 197 |
| E18 | Section 9.02(b) each-lender matters; pari or junior securing of specified secured debt at borrower request; non-pro-rata prepayment and loan modification offers with Required Lenders; Section 9.02(c) automatic release on permitted disposition | d887611dex101.htm.jsonl, pages 204–206 |
| E19 | 2033 indenture Consolidated EBITDA adds dividend-equivalent payments and 24-month projected cost savings capped at 35.0%, calculated after the adjustment | d887611dex41.htm.jsonl, page 16 |
| E20 | Initial Redemption Date 2027-09-15; First Lien Intercreditor Agreement dated 2019-02-13 with Joinders 1 to 6, Joinder No. 6 dated 2024-09-19 | d887611dex41.htm.jsonl, page 30 |
| E21 | Liens for secured ratio debt permitted at secured net ratio of at most 5.25x; acquisition tested at signing | d887611dex41.htm.jsonl, page 43 |
| E22 | Unlimited restricted payments if no default and fixed-charge cover would exceed 2.0x | d887611dex41.htm.jsonl, page 75 |
| E23 | Ratio debt if fixed-charge cover greater than 2.0x; non-guarantor restricted subsidiary ratio debt capped at 400 | d887611dex41.htm.jsonl, page 79 |
| E24 | Each-holder matters incl. ranking; two-thirds for release of all or substantially all collateral or adverse intercreditor changes; majority waiver | d887611dex41.htm.jsonl, pages 117–118 |
| E25 | Holders may not enforce security directly; collateral agents act under intercreditor agreements | d887611dex41.htm.jsonl, page 128 |
| E26 | Intercreditor agreement controls in conflict; further assurances only if required under credit facilities; perfection within 90 days; lien release incl. on bank agent release, designation as unrestricted, immaterial status | d887611dex41.htm.jsonl, pages 135–137 |
| E27 | 179-day payment blockage; one blockage per 360 days; 181 days free; bank may give a further notice | d826058dex41.htm.jsonl, page 107 |
| E28 | 2033 indenture dated 2024-09-19; US and UK collateral agents | d887611dex41.htm.jsonl, page 1 |
| E29 | 2027 indenture dated 2019-11-13 | d826058dex41.htm.jsonl, page 1 |
| E30 | Carrying debt 24,880; instrument register; net leverage 4.88x reported and 6.02x pro forma for October 2024 dividend | Financial foundation (CP-1) |
| E31 | Dividend 4,348 funded by 3,000 new secured debt and cash; paid 2024-10-18 | Business & governance (CP-1A) |
| E32 | Recurring issuer adjustments; earnings base below issuer-adjusted EBITDA | Earnings quality (CP-1D) |

### T4.1 Source gate

| Source | Status | Authority rank | Limitation | Source |
|---|---|---|---|---|
| Credit agreement as conformed in Amendment No. 17 Annex I | Executed amendment; annex is marked-up conformed text | 1 | Markup shows deleted and inserted text; schedules, guarantee and collateral agreement not attached | d887611dex101.htm.jsonl, pages 1–4 |
| 2033 secured notes indenture | Executed version | 1 | Intercreditor and security agreement incorporated by reference, not attached | d887611dex41.htm.jsonl, page 1 |
| 2027 subordinated notes indenture | Executed | 1 | Covers one of three subordinated issues | d826058dex41.htm.jsonl, page 1 |
| Annual report | Filed, retrospective | 4 | Summary of legal terms; verify against executed text | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–62 |

Module status: Completed with Limitations. At least one executed governing document is present; the intercreditor agreement, security documents, compliance certificates and other note indentures are missing.

### T4.2 Controlling document register

| Authority Rank | Document | Document Type | Version / Date | Status | Governing Role | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | Second Amended and Restated Credit Agreement, as amended through Amendment No. 17 | Credit agreement | Base 2014-06-04; amendment 2024-09-19 | Executed amendment; conformed marked annex | Controls bank covenants, collateral, guarantees, amendments | Governs maintenance test, ratio debt, dividends, release and enforcement for the largest secured class | E05; E07 |
| 1 | Indenture, 6.000% Senior Secured Notes due 2033 | Indenture | 2024-09-19 | Executed version | Controls 2033 note covenants and collateral agency | Defines noteholder consent, release and enforcement limits | E28 |
| 1 | Indenture, 5.500% Senior Subordinated Notes due 2027 | Indenture | 2019-11-13 | Executed | Controls subordination and blockage | Sets junior-class standstill | E29 |
| 2 | First Lien Intercreditor Agreement with Joinders 1 to 6 | Intercreditor agreement | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — intercreditor agreement not in the source set | Would control lien priority and enforcement among first-lien classes | Determines realised recovery split and control | E20 |
| 1 | Guarantee and Collateral Agreement and security documents | Security documents | Not supplied: not in the source set | [Insufficient Information] — security documents not in the source set | Would define collateral, excluded assets and perfection | Determines collateral coverage | E13; E26 |
| 1 | Indentures for 2028 to 2032 secured notes and 2029 subordinated notes | Indentures | Not supplied: not in the source set | [Insufficient Information] — indentures not in the source set | Would control those classes | Basket and release terms may differ | E01 |
| 3 | Compliance certificates | Covenant schedule | Not supplied: not in the source set | [Insufficient Information] — compliance certificates not in the source set | Would control tested ratios and usage | Headroom not calculable | E04 |
| 4 | Annual report on Form 10-K for FY2024 | Issuer filing | 2024-11-07 | Filed | Summary and compliance statement | Corroborates ranking, guarantors and compliance; executed documents govern on conflict | E01; E02; E04 |

Conflict noted: the annual report describes the springing test as net debt to EBITDA As Defined, while the credit agreement uses a separate financial-covenant EBITDA. The executed agreement governs.

### T4.3 Covenant feature register

| Topic | Provision Summary | Source / Clause | Risk Mechanic | Credit Implication | Market Norm Assessment | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant | Net leverage at most 7.50x (8.00x post material acquisition), only when revolver exposure exceeds 40%; revolving lenders only | Credit agreement Section 6.14 | No covenant trigger for term loans or notes; revolving-only acceleration | Negative — Covenant Erosion | No comparative source supplied; not assessed | E15; E16 |
| Ratio debt | Pari secured at 5.00x secured net; junior or unsecured at 7.25x net leverage | Credit agreement Permitted Indebtedness clause (12) | Pari dilution of collateral without lender consent | Negative — Leverage Increase | No comparative source supplied; not assessed | E09 |
| Incremental and MFN | Incremental conditions 7.25x and 5.00x; MFN 50 bp, 18-month sunsets, acquisition carve-out | Credit agreement Sections 2.24(b), 2.24(c) | Repricing protection lapses; acquisition debt unprotected | Negative — Leverage Increase | No comparative source supplied; not assessed | E07; E12 |
| General debt basket | Greater of 250 and 10.0% of Consolidated EBITDA | Credit agreement clause (13) | Grows with add-back-inflated EBITDA | Negative — Leverage Increase | No comparative source supplied; not assessed | E09 |
| Notes ratio debt | Fixed-charge cover above 2.0x; non-guarantor cap 400; secured liens at 5.25x | 2033 indenture Section 4.09; Permitted Liens (xxxi) | Notes allow more debt than bank tests | Negative — Leverage Increase | No comparative source supplied; not assessed | E21; E23 |
| Restricted payments | Unlimited at net leverage 6.75x pro forma (bank); unlimited at fixed-charge cover above 2.0x (notes); general basket greater of 75 and 3.0% | Credit agreement Section 6.02; 2033 indenture Section 4.07 | Debt-funded dividends permitted by ratio | Negative — Leverage Increase | No comparative source supplied; not assessed | E14; E22 |
| Investments | Unlimited in restricted subsidiaries; unrestricted subsidiaries greater of 250 and 10.0% | Credit agreement Permitted Investments (1) | Value can move to non-guarantor restricted subsidiaries | Negative — Covenant Erosion | No comparative source supplied; not assessed | E10 |
| Unrestricted subsidiaries | Only newly acquired or formed subsidiaries; no recourse debt | Credit agreement definition | Limits drop-down of existing assets | Neutral — Stable | No comparative source supplied; not assessed | E11 |
| EBITDA add-backs | Cost savings 24 months, 25% (bank) and 35% (notes) post-adjustment caps; dividend-equivalent add-back in notes | Credit agreement and 2033 indenture Consolidated EBITDA | Inflates ratio capacity and grower baskets | Negative — Covenant Erosion | No comparative source supplied; not assessed | E08; E19 |
| Guarantees and pledge | Domestic restricted subsidiaries join; 65% voting foreign pledge | Credit agreement Section 5.11 | Foreign value only partly reachable | Neutral — Stable | No comparative source supplied; not assessed | E13 |
| Amendments, bank | Required Lenders; each-lender list lacks express lien-subordination item; majority can add pari or junior secured debt and non-pro-rata class offers | Credit agreement Section 9.02(b) | Uptier exposure is theoretical but not blocked | Negative — Covenant Erosion | No comparative source supplied; not assessed | E18 |
| Amendments, notes | Ranking each-holder; collateral release two-thirds; waiver majority | 2033 indenture Section 9.02 | Stronger noteholder protection than bank | Neutral — Stable | No comparative source supplied; not assessed | E24 |
| Collateral release | Automatic on permitted disposition; notes released when bank agent releases | Credit agreement Section 9.02(c); 2033 indenture Section 12.07 | Bank majority controls release for notes | Negative — Covenant Erosion | No comparative source supplied; not assessed | E18; E26 |
| Subordination | 179-day blockage, one per 360 days | 2027 indenture Section 10.03 | Junior class payment standstill | Negative — Refinancing Risk | No comparative source supplied; not assessed | E27 |
| Events of default | Interest grace five business days; financial-covenant default limited to revolving lenders | Credit agreement Article VII | Late acceleration path | Neutral — Stable | No comparative source supplied; not assessed | E16 |

### T4.9 PD versus LGD translation

| Legal Topic | Supported Fact | Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Springing covenant | Tested only above 40% revolver use; revolving-only | No early covenant renegotiation | Default arrives via liquidity or maturity, later and less negotiated | Value erodes before creditors gain leverage | Quarterly revolver exposure versus USD 364 million | E04; E15 |
| Pari secured ratio debt | 5.00x bank and 5.25x notes | New first-lien debt shares collateral | Higher debt service raises default probability | Direct dilution of first-lien recovery | Secured issuance not used for refinancing | E09; E21 |
| Ratio dividends | Unlimited at 6.75x bank, 2.0x cover notes | Distributions funded by debt | Cash cushion removed | Claims rise with no added asset value | Dividend declarations and financing | E14; E22; E31 |
| Non-guarantor investment | Unlimited into restricted subsidiaries | Value migrates outside guarantor reach | Limited direct effect | Structural subordination deepens | Guarantor-group share of sales and assets | E10; E02 |
| Bank amendment control | No express lien-subordination item in each-lender list | Majority-consented priming possible | Could extend runway for consenting lenders | Non-consenting lenders and notes could be primed or released | Amendment filings touching Section 9.02 | E18 |
| Note lien release | Follows bank agent release | Bank majority decides note collateral | Limited | Note collateral can fall away without note vote | Bank collateral releases | E26 |
| Subordinated blockage | 179 days per 360 days | Junior payments stop on senior default | Junior default probability rises in stress | Junior recovery subordinated | Blockage notices | E27 |
| EBITDA add-backs | 25% and 35% post-adjustment caps; dividend-equivalent add-back | Ratios loosen | Delays ratio constraints | More debt before tests bind | Gap between covenant and reported EBITDA | E08; E19; E32 |

### T4.10 Market norm comparison

| Topic | Issuer Provision | Market / Third-Party Reference | Relative Assessment | Agreement / Discrepancy | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| All covenant topics | As recorded in the covenant feature register | No supported comparative source or covenant-review report was provided | Market-norm and third-party covenant-review comparison is limited because no supported comparative source was provided | Not assessed; no comparison drawn | Insufficient Information — no market-norm conclusion | E07; E09; E14 |

### T4.11 Covenant aggressiveness score

| Area | Score 1–5 | Evidence | Risk Mechanic | Credit Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Maintenance covenant architecture | 4 | Only a revolver-only springing test at 7.50x above 40% usage | No covenant-driven early intervention | Negative — Covenant Erosion | Provisional | E04; E15; E16 |
| Debt / lien incurrence capacity | 4 | Ratio pari secured debt 5.00x and 5.25x; junior 7.25x; reclassification; MFN 50 bp with 18-month sunset | Large pari capacity, demonstrated in September | Negative — Leverage Increase | Provisional | E09; E12; E21 |
| RP / investment / leakage capacity | 4 | Unlimited dividends at 6.75x; unlimited restricted-subsidiary investment; designation limited to new subsidiaries | Debt-funded extraction and non-guarantor migration | Negative — Leverage Increase | Provisional | E10; E11; E14 |
| EBITDA definitions and add-back flexibility | 4 | Cost savings 24 months; caps 25% and 35% post-adjustment; dividend-equivalent add-back | Ratio inflation | Negative — Covenant Erosion | Provisional | E08; E19 |
| Collateral / guarantor protection | 3 | Domestic guarantors; 65% foreign pledge; automatic releases; security documents not reviewed | Non-guarantor value outside reach | Neutral — Stable | Provisional | E01; E13; E26 |
| Amendment / control mechanics | 4 | Required Lenders control pari and junior securing and non-pro-rata class offers; no express subordination protection; notes two-thirds and each-holder ranking | Theoretical uptier path; note collateral follows bank | Negative — Covenant Erosion | Provisional | E18; E24; E26 |
| Overall | 4 | Weighted to debt, leakage and control areas; demonstrated debt-funded recapitalisation | Financial policy, not covenants, sets risk | Negative — Leverage Increase | Provisional | E31; E09; E14 |

Covenant Aggressiveness Score: 4 of 5 (Aggressive). Status: Provisional, because the intercreditor agreement, security documents and compliance inputs are missing.

### T4.12 Red flags and monitoring triggers

| Red Flag / Trigger | Provision or Signal | Why It Matters | PD / LGD / RV Impact | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|
| New pari secured debt for distributions | Credit agreement clause (12); indenture lien (xxxi) | Repeats September recapitalisation | PD up; LGD up for first lien; secured notes relative value weaker | Track secured issuance and use of proceeds | E09; E21; E31 |
| Amendment to Section 9.02 or lien priority | Credit agreement Section 9.02(b) | Priming route needs only majority | LGD sharply higher for non-consenting classes | Watch amendment filings | E18 |
| Bank collateral release | Indenture Section 12.07(e)(B) | Note liens fall with bank release | Note LGD up | Watch release notices and asset sales | E26 |
| Revolver use above trigger | Credit agreement Section 6.14 | Maintenance test applies | PD signal for revolving lenders | Quarterly exposure against USD 364 million | E04; E15 |
| Investment into foreign restricted subsidiaries | Permitted Investments (1) | Value leaves guarantor reach | LGD up for all guaranteed classes | Guarantor-group share in annual reports | E10; E02 |
| MFN window expiry and acquisition debt | Section 2.24(b) proviso | Repricing protection lost | Term-loan relative value weaker | Track 18-month anniversaries and acquisition financings | E12 |
| Senior default notice | 2027 indenture Section 10.03 | 179-day payment block | Junior PD and LGD up | Watch blockage notices | E27 |

### T4.13 Gaps ledger

| Gap | Missing Document / Clause / Schedule | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor | First Lien Intercreditor Agreement and Joinders 1 to 6 | Controls enforcement, standstill and proceeds sharing | Enforcement-control and turnover registers incomplete | Obtain executed agreement and joinders |
| Security | Guarantee and Collateral Agreement, security agreement, schedules and guarantor exhibit | Defines collateral, excluded assets and guarantor list | Collateral map partial | Obtain executed security documents and guarantor list |
| Other indentures | 2028 to 2032 secured notes; 2029 subordinated notes | Baskets and releases may differ | Capacity and release may be understated | Obtain executed indentures |
| Compliance inputs | Compliance certificates with covenant ratios | Needed for headroom | All ratio headroom not calculable | Obtain latest certificate |
| Basket usage | Usage records for dividends, investments and general baskets | Needed for remaining capacity | Remaining capacity not calculable | Obtain usage tracker |
| Amendment chain | Amendment No. 15 standalone text; clean conformed copy | Confirms operative wording | Threshold confidence reduced | Obtain clean conformed agreement |
| Market norm | Covenant-review report or comparable set | Needed for market comparison | Market-norm register not assessed | Obtain third-party covenant review |

### T4D.1 Source gate and entity evidence

| Source | Status | Authority Rank | Limitations | Module Status |
|---|---|---|---|---|
| d887611dex101.htm.jsonl, pages 173–174 | Executed amendment with conformed annex | 1 | Guarantee and pledge requirements only; no guarantor schedule | Completed with Limitations |
| TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 58–59 | Filed annual report | 4 | Guarantor list held in an exhibit not supplied; combined summary only | Completed with Limitations |
| d887611dex41.htm.jsonl, pages 135–137 | Executed indenture | 1 | Security documents and intercreditor agreement not attached | Completed with Limitations |

No post-balance-sheet guarantee release, designation or entity transfer was found in the supplied documents; the October 2024 dividend and securitization draw change cash and debt, not the perimeter.

### T4D.2 Entity perimeter register

| Entity | Role | Jurisdiction | Parent | Designation | Material Value Held | Inside Credit Group? | Evidence ID |
|---|---|---|---|---|---|---|---|
| TransDigm Group Incorporated | Holdings; guarantor of all classes | Delaware | Listed parent | Not a subsidiary; not designatable | No significant separate operations or assets | Yes | E01; E05 |
| TransDigm Inc. | Borrower and note issuer | Delaware | TransDigm Group Incorporated | Restricted | Part of obligor group: sales 6,294; assets 19,888 combined | Yes | E01; E02; E05 |
| TransDigm UK | Guarantor of 2028 secured notes and subordinated notes | United Kingdom by name; not re-verified | Not supplied: parent not stated in reviewed pages | Restricted | Within obligor combined figures | Yes | E01 |
| Domestic Restricted Subsidiaries | Guarantors and grantors | United States | TransDigm Inc. | Restricted; only new subsidiaries could be designated unrestricted | Within obligor combined figures | Yes | E01; E11; E13 |
| Foreign subsidiaries and other non-guarantors | Non-guarantors; 65% voting equity pledged where first-tier | Various, not itemised | Loan parties | Restricted unless newly formed and designated | Non-obligor sales about 1,646 | No | E02; E13 |
| Immaterial subsidiaries | Excluded from joinder | United States | Loan parties | Restricted | Not supplied: not quantified | No | E13 |
| Securitization entity | Receivables facility borrower | Not supplied: not stated in reviewed pages | Not supplied: not stated | Excluded subsidiary | Drawn 487.5 of 650 | No | E04; E13 |
| Unrestricted subsidiaries | None identified | Not supplied: none identified | Not applicable | Investment cap greater of 250 and 10.0% | Not supplied: none identified | No | E10; E11 |

### T4D.3 Guarantee map

| Entity × Tranche | Guarantee Type | Direction | Release Trigger | Evidence ID |
|---|---|---|---|---|
| Holdings × credit facilities | Senior secured | Upstream from parent to borrower obligations | Release of material guarantor needs each lender | E18 |
| Domestic Restricted Subsidiaries × credit facilities | Senior secured, joinder within 20 business days | Upstream | Permitted disposition to non-loan party; becoming excluded | E13; E18 |
| Holdings and Domestic Restricted Subsidiaries × 2033 secured notes | Senior secured | Upstream | Guarantor sale, designation as unrestricted, immaterial status | E01; E26 |
| Holdings, TransDigm UK, Domestic Restricted Subsidiaries × subordinated notes | Senior subordinated unsecured | Upstream | Not reviewed in this run for 2029 notes | E01 |
| Foreign subsidiaries × all tranches | None | Not applicable | Not applicable | E01; E13 |

### T4D.4 Collateral map

| Entity × Lien | Excluded Assets | Release Mechanic | Perfection Limit | Evidence ID |
|---|---|---|---|---|
| Loan parties × first lien, credit facilities | Unrestricted-subsidiary equity; equity where SEC separate statements would be needed; remainder not supplied | Automatic on permitted disposition, full payment or guarantor release | Foreign equity limited to 65% voting | E13; E18 |
| Loan parties × first lien, 2033 notes | Excluded collateral as defined in security agreement, not supplied | Automatic with bank agent release, permitted asset sale, designation, immaterial status | Perfection within 90 days of issue; after-acquired only if required by credit facilities | E26 |
| Loan parties × first lien, 2028 to 2032 notes | [Insufficient Information] — indentures and security documents not in the source set | [Insufficient Information] — indentures not in the source set | [Insufficient Information] — security documents not in the source set | E01 |
| Non-guarantor subsidiaries × any lien | Not pledged except 65% voting equity of first-tier foreign subsidiaries | Not applicable | Foreign assets not directly secured | E13 |
| Loan parties × unsecured, subordinated notes | No collateral | Not applicable | Not applicable | E01 |

### T4D.5 Structural priority

| Claim/Tranche | Obligor Entity | Reachable Value | Structural-Priority Label | Stranded Value Named | Recovery-Access Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|---|
| Revolver and term loans | TransDigm Inc. with Holdings and domestic guarantors | Obligor collateral plus 65% voting equity of first-tier foreign subsidiaries | Pari | Non-guarantor value, sales about 1,646, reachable only through equity pledge after non-guarantor creditors | Strong within obligor group; residual access to foreign value | Medium | E01; E02; E13 |
| 2033 and other secured notes | Same obligors | Same collateral shared under intercreditor agreement | Pari | Same non-guarantor value | Equal to bank debt economically, but control follows bank | Medium | E01; E26 |
| Securitization facility | Securitization entity | Receivables sold to the entity | Structurally Senior | Receivables transferred out of obligor collateral | Senior on receivables pool | Low | E04; E13 |
| Subordinated notes | TransDigm Inc. with subordinated guarantees | Residual after all senior debt | Contractually Subordinated | Non-guarantor value plus all collateral value ahead of them | Recovers only after first-lien and senior classes | Medium | E01; E27 |
| All guaranteed classes versus non-guarantor creditors | Non-guarantor subsidiaries | Non-guarantor assets | Structurally Subordinated — Non-Guarantor Value | Non-guarantor sales about 1,646 and assets outside the obligor combined figures | Non-guarantor creditors paid first | Medium | E01; E02 |

### T4D.6 Leakage routes

| Route | Entity Path | Enabling Provision (CP-4 ref) | Value Exposed | Severity 1–5 | Recovery/Priority Implication | Demonstrated vs Theoretical | Evidence ID |
|---|---|---|---|---|---|---|---|
| Investment into non-guarantor restricted subsidiaries | Loan parties to foreign restricted subsidiaries | Credit agreement Permitted Investments (1)(a) | Not capped; amount not supplied | 4 | Moves value behind non-guarantor creditors | Theoretical | E10 |
| Investment into unrestricted subsidiaries | Loan parties to new unrestricted subsidiaries | Permitted Investments (1)(c); designation definition | Greater of 250 and 10.0% of covenant EBITDA, plus general baskets | 2 | Bounded drop-down | Theoretical | E10; E11 |
| Debt-funded dividends | Borrower to Holdings to shareholders | Credit agreement Section 6.02; indenture Section 4.07 | Unlimited within 6.75x and 2.0x tests | 4 | Claims rise without assets | Demonstrated: 4,348 recapitalisation | E14; E22; E31 |
| Asset sale to non-loan party | Grantor to third party | Credit agreement Section 9.02(c); indenture Section 12.07(e) | Not supplied: asset sale basket not reviewed | 3 | Collateral released on permitted disposition | Theoretical | E18; E26 |
| Designation of existing subsidiary | Not available | Designation limited to newly acquired or formed subsidiaries | Not applicable | 1 | Existing assets sealed against designation | Not available under text | E11 |

### T4D.7 Priming exposure

| Vulnerability | Enabling Provision (CP-4 ref) | Affected Creditor Class | Demonstrated vs Theoretical | Structural Implication | Confidence | Evidence ID |
|---|---|---|---|---|---|---|
| Uptier by majority-consented lien subordination | Credit agreement Section 9.02(b) list lacks express subordination item | Non-consenting term and revolving lenders; secured noteholders via release linkage | Theoretical | Priming-Exposed (uptier capable) | Medium | E18; E26 |
| Non-pro-rata class prepayment or exchange | Section 9.02(b) proviso (x) with Required Lenders | Term lenders of a class | Theoretical; offers must go to all lenders of the class | Priming-Exposed (uptier capable) | Medium | E18 |
| Pari dilution through ratio debt | Clause (12); indenture lien (xxxi) | All first-lien classes | Demonstrated September 2024 | Pari dilution rather than priming | High | E09; E21; E31 |
| Trapdoor to unrestricted subsidiary | Investment cap and new-subsidiary designation only | All guaranteed classes | Theoretical and bounded | Leakage-Exposed (drop-down capable) | Medium | E10; E11 |

### T4D.8 Gaps ledger

| Gap | Missing Document/Schedule/Provision | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Guarantor list | Guarantor exhibit filed with the annual report | Names every guarantor | Entity register at class level | Obtain exhibit |
| Security documents | Guarantee and Collateral Agreement and security agreement | Excluded assets and perfection | Collateral map partial | Obtain documents |
| Entity-level value | Non-guarantor assets and EBITDA by entity | Size of stranded value | Stranded value named by sales only | Obtain entity financials |
| Asset-sale basket | Credit agreement Section 6.03 detail | Sizing disposal leakage | Route severity provisional | Review section |
| Intercreditor | First Lien Intercreditor Agreement | Release and enforcement linkage | Priming linkage partially verified | Obtain agreement |

### T4F.1 Controlling documents

| Document | Parties | Date | Governing Law | Status | Source / Locator | Evidence ID |
|---|---|---|---|---|---|---|
| Credit agreement through Amendment No. 17 | TransDigm Inc., Holdings, subsidiaries, lenders, Goldman Sachs Bank USA as agent | 2014-06-04; 2024-09-19 | [Insufficient Information] — governing-law clause not re-read in this review | Executed; marked annex | Amendment No. 17, cover and Annex I | E05 |
| 2033 secured notes indenture | TransDigm Inc., Holdings, guarantors, BNY Mellon Trust Company as trustee and US collateral agent, BNY Mellon as UK collateral agent | 2024-09-19 | [Insufficient Information] — governing-law clause not re-read in this review | Executed version | Indenture cover | E28 |
| First Lien Intercreditor Agreement | Company, Holdings, guarantors, credit agreement collateral agent, secured notes trustees and collateral agents | 2019-02-13; Joinder No. 6 2024-09-19 | [Insufficient Information] — intercreditor agreement not in the source set | [Insufficient Information] — intercreditor agreement not in the source set | 2033 indenture definition | E20 |
| 2027 subordinated notes indenture | TransDigm Inc., Holdings, guarantors, BNY Mellon Trust Company as trustee | 2019-11-13 | [Insufficient Information] — governing-law clause not re-read in this review | Executed | Indenture cover | E29 |

### T4F.2 Creditor class map

| Creditor Class | Rank | Security Interest | Enforcement Rights | Voting Weight | Evidence ID |
|---|---|---|---|---|---|
| Revolving lenders | First lien, pari | Collateral | Through agent; sole lenders able to enforce springing covenant | Required Revolving Lenders for Section 6.14; part of Required Lenders | E15; E17 |
| Term lenders | First lien, pari | Collateral | Through agent at Required Lenders' direction | Required Lenders; each-lender for listed matters | E17; E18 |
| 2033 secured noteholders | First lien, pari | Collateral under intercreditor agreement | Only through notes collateral agents; 25% acceleration not reviewed here | Majority waiver; two-thirds for collateral release; each holder for ranking | E24; E25 |
| 2028 to 2032 secured noteholders | First lien, pari | [Insufficient Information] — indentures not in the source set | [Insufficient Information] — indentures not in the source set | [Insufficient Information] — indentures not in the source set | E01 |
| Subordinated noteholders | Subordinated to senior debt | None | Subject to 179-day blockage | [Insufficient Information] — amendment thresholds of 2027 indenture not reviewed | E27 |

### T4F.3 Enforcement control

| Provision | Standstill Period | Trigger | Who Controls Enforcement | Creditor Class Affected | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Agent sole right against collateral | None stated for bank lenders | Event of default and Required Lenders' direction | Credit agreement agent | Bank lenders | Individual lenders cannot act alone | Negative — Covenant Erosion | E17 |
| Noteholder enforcement through collateral agents | [Insufficient Information] — intercreditor agreement not in the source set | [Insufficient Information] — intercreditor agreement not in the source set | Notes collateral agents subject to intercreditor agreement | 2033 secured noteholders | Holders cannot enforce directly; agreement prevails over indenture | Insufficient Information | E25; E26 |
| Subordinated payment blockage | 179 days; one per 360 days; 181 days free | Blockage notice after senior non-payment default | Representative of designated senior debt | Subordinated noteholders | Junior payments stop during senior workout | Negative — Refinancing Risk | E27 |
| Springing covenant remedies | None stated | Section 6.14 breach | Required Revolving Lenders | Revolving lenders; term lenders only after acceleration | Term creditors cannot act on covenant breach | Negative — Covenant Erosion | E15; E16 |

### T4F.4 Turnover, release and purchase options

| Provision | Turnover Obligation | Release Authority | Purchase Option | Conditions | Countervailing Evidence | Evidence ID |
|---|---|---|---|---|---|---|
| Note lien release linked to bank | [Insufficient Information] — intercreditor agreement not in the source set | Credit agreement collateral agent's release | [Insufficient Information] — intercreditor agreement not in the source set | Except release on full cash discharge not tied to enforcement | Two-thirds note vote needed for amendment-based release | E24; E26 |
| Bank automatic release | Not applicable | Automatic on permitted disposition to non-loan party, payment in full or guarantor release | Not supplied: no purchase option in reviewed pages | Disposition must comply with the agreement | Release of substantially all collateral needs each lender | E18 |
| Subordinated turnover | Section 10.05 heading present; text not reviewed | Not applicable | Not supplied: not in reviewed pages | Blockage period rules | Payments resume after blockage unless accelerated | E27 |

### T4F.5 Recovery control assessment

| Creditor Class | Realised-Recovery Mechanic | Control Weakness | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Bank lenders | Agent-led enforcement; pari sharing | Majority may add pari or junior secured debt and agree non-pro-rata class offers | High | Majority decisions bind minority | Negative — Covenant Erosion | E17; E18 |
| Secured noteholders | Economic pari sharing; control via collateral agents | Liens follow bank releases; intercreditor terms unknown | High | Bank majority shapes note collateral | Negative — Covenant Erosion | E25; E26 |
| Subordinated noteholders | Residual after senior | 179-day blockage; no collateral | High | Paid last; payments can stop | Negative — Refinancing Risk | E27 |

### T4F.6 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Intercreditor terms | First Lien Intercreditor Agreement and joinders | Controlling authority, standstill and turnover | Enforcement and turnover rows incomplete | Obtain executed agreement |
| Governing law | Governing-law clauses | Enforcement forum | Law column incomplete | Re-read clauses |
| Other note classes | 2028 to 2032 and 2029 indentures | Voting and release terms | Class map incomplete | Obtain indentures |
| Subordinated turnover text | 2027 indenture Section 10.05 | Turnover mechanics | Turnover row partial | Review section |

### T4C.2 Capacity source map

| Authority Rank | Source | Source Type | Version / Date | Status | Controls Legal Formula / Financial Input / Usage | Credit Relevance | Evidence ID |
|---|---|---|---|---|---|---|---|
| 1 | d887611dex101.htm.jsonl, pages 59–61 | Credit agreement | 2024-09-19 conformed | Executed; marked annex | Legal formula | Bank debt, dividend and investment tests | E09; E10; E14 |
| 1 | d887611dex41.htm.jsonl, pages 43–79 | Indenture | 2024-09-19 | Executed version | Legal formula | Note-side debt, lien and dividend tests | E21; E22; E23 |
| 4 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 | Annual report | 2024-11-07 | Filed | Financial input: revolver exposure, commitments | Springing trigger | E02; E04 |
| 3 | Compliance certificate | Covenant schedule | Not supplied | [Insufficient Information] — compliance certificate not in the source set | Usage and tested ratios | Headroom | E04 |
| Supplied analysis | Financial foundation (CP-1) | Analysis of filed statements | 2024-09-30 | Accepted | Financial context only; not covenant inputs | Analytical leverage | E30 |

### T4C.3 Definition and ratio mechanics

| Definition / Ratio | Source / Clause | Formula / Definition Summary | Required Inputs | Capacity Effect | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Consolidated Net Leverage Ratio | Credit agreement definitions | Consolidated Total Indebtedness less Unrestricted Cash over Consolidated EBITDA; Section 6.14 uses Financial Covenant Consolidated EBITDA | Covenant debt, unrestricted cash, covenant EBITDA | Cash netting enlarges capacity | Pre-funded cash lowers ratio before distribution | Negative — Covenant Erosion | E11; E15 |
| Consolidated Secured Net Debt Ratio | Credit agreement and 2033 indenture | Secured debt less Unrestricted Cash over Consolidated EBITDA | Secured debt, cash, EBITDA | Sets pari capacity at 5.00x or 5.25x | Pari dilution | Negative — Leverage Increase | E09; E21 |
| Consolidated EBITDA cost savings | Credit agreement clause (m); indenture clause (M) | 24-month projected savings, caps 25% and 35% after adjustment, equal to 33.33% and 53.85% of pre-add-back EBITDA | Management projections | Raises every ratio and grower basket | Capacity expands as earnings weaken | Negative — Covenant Erosion | E08; E19 |
| Dividend-equivalent add-back | 2033 indenture clause (K) | Dividend-equivalent payments added back | Equivalent payments | Recapitalisation payouts raise EBITDA | Extraction loosens next test | Negative — Covenant Erosion | E19 |
| Consolidated Fixed Charge Coverage Ratio | 2033 indenture | Four-quarter pro forma cover; greater than 2.0x | Covenant EBITDA, fixed charges | Note debt and dividend tests | Loose compared with bank tests | Negative — Leverage Increase | E22; E23 |
| Definition conflict: covenant versus carrying debt | Credit agreement versus Financial foundation | Covenant Indebtedness basis not re-read; Financial foundation uses carrying debt 24,880 | Both definitions | Ratios not interchangeable | Analytical leverage is not covenant headroom | Insufficient Information | E30 |
| Definition conflict: annual report versus executed text | Annual report and Section 6.14 | Annual report says EBITDA As Defined; agreement says Financial Covenant Consolidated EBITDA | Both definitions | Executed text governs | Issuer summary may differ from tested measure | Insufficient Information | E04; E15 |
| Non-debt float in Indebtedness | Credit agreement Indebtedness definition not re-read | Contract liabilities of 177 in Financial foundation; inclusion not established | Indebtedness definition | Not established | Float outside debt tests would loosen ratios | Insufficient Information | E30 |

### T4C.4 Headroom table

| Test | Test Type | Threshold | Current Basis | Formula | Headroom | Status | Limitation | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Springing trigger: revolver exposure to commitments | max-ratio | 40.00% | 7.36% | Aggregate Revolving Credit Exposure 67 over Revolving Credit Commitments 910 | 32.64% | Compliant | Not triggered; assumes no cash-collateralized letters of credit and no revolving loans; quarter-end test | Maintenance covenant dormant until usage exceeds USD 364 million | Neutral — Stable | E02; E04; E15 |
| Consolidated Net Leverage Ratio, springing covenant | max-ratio | 7.50x | [Insufficient Information] — missing: covenant net leverage ratio | Net debt over Financial Covenant Consolidated EBITDA, quarter-end | [Insufficient Information] — missing: current tested ratio | Not Calculable | 8.00x after material acquisition; issuer states compliance | Revolving-only protection | Insufficient Information | E04; E15 |
| Pari secured ratio debt, credit agreement | max-ratio | 5.00x | [Insufficient Information] — missing: covenant secured net debt ratio | Secured debt less Unrestricted Cash over Consolidated EBITDA, pro forma | [Insufficient Information] — missing: current tested ratio | Not Calculable | Certified met on Amendment No. 17 effectiveness | Pari dilution capacity | Insufficient Information | E07; E09 |
| Junior or unsecured ratio debt, credit agreement | max-ratio | 7.25x | [Insufficient Information] — missing: covenant net leverage ratio | Net debt over Consolidated EBITDA, pro forma | [Insufficient Information] — missing: current tested ratio | Not Calculable | Certified met on Amendment No. 17 effectiveness | Layering capacity | Insufficient Information | E07; E09 |
| Unlimited restricted payments, credit agreement | max-ratio | 6.75x | [Insufficient Information] — missing: covenant net leverage ratio | Net leverage pro forma for payment and financing | [Insufficient Information] — missing: current tested ratio | Not Calculable | October 2024 dividend implies a basket was satisfied; which one is not established | Extraction capacity | Insufficient Information | E14; E31 |
| Secured ratio debt liens, 2033 indenture | max-ratio | 5.25x | [Insufficient Information] — missing: covenant secured net debt ratio | Secured net debt over Consolidated EBITDA, pro forma | [Insufficient Information] — missing: current tested ratio | Not Calculable | Acquisition debt tested at signing | Note-side pari capacity | Insufficient Information | E21 |
| Ratio debt, 2033 indenture | min-ratio | 2.0x | [Insufficient Information] — missing: covenant fixed charge coverage ratio | Four-quarter pro forma fixed-charge cover | [Insufficient Information] — missing: current tested ratio | Not Calculable | Non-guarantor ratio debt capped at 400 | Debt capacity | Insufficient Information | E23 |
| Unlimited restricted payments, 2033 indenture | min-ratio | 2.0x | [Insufficient Information] — missing: covenant fixed charge coverage ratio | Fixed-charge cover pro forma for payment | [Insufficient Information] — missing: current tested ratio | Not Calculable | No default condition | Extraction capacity on note side | Insufficient Information | E22 |

### T4C.5 Capacity register

| Capacity Type | Basket / Test | Formula | Conditions | Current Input | Usage | Estimated Capacity | Remaining Capacity | Status | Severity | Risk Mechanic | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Maintenance covenant headroom | Section 6.14 | Ratio Basket | Usage above 40% | Usage 7.36% | Letters of credit 67 | Trigger not reached | [Insufficient Information] — missing: covenant net leverage ratio | Ready with Limitations | Low | Dormant test | Neutral — Stable | E15 |
| Debt incurrence capacity | Clause (12) pari secured | Incremental Ratio Amount | Secured net at most 5.00x; loan-party obligors; collateral only | Not supplied: covenant ratio | Not supplied: usage record | Not calculable without ratio | [Insufficient Information] — missing: covenant ratio and usage | Formula Extracted Only | Critical | Pari dilution | Negative — Leverage Increase | E09 |
| Debt incurrence capacity | Clause (12) junior or unsecured | Ratio Basket | Net leverage at most 7.25x | Not supplied: covenant ratio | Not supplied: usage record | Not calculable without ratio | [Insufficient Information] — missing: covenant ratio and usage | Formula Extracted Only | High | Layering | Negative — Leverage Increase | E09 |
| Debt incurrence capacity | Clause (13) general | Grower Basket | Greater of 250 and 10.0% of covenant EBITDA | Covenant EBITDA not supplied | Not supplied: usage record | At least 250 fixed floor before usage | [Insufficient Information] — missing: usage | Formula Extracted Only | Moderate | Grows with add-backs | Negative — Leverage Increase | E09 |
| Debt incurrence capacity | Indenture non-guarantor ratio debt | Fixed Basket | Cover above 2.0x; cap 400 | Not supplied: covenant ratio | Not supplied: usage record | Up to 400 | [Insufficient Information] — missing: usage | Formula Extracted Only | Moderate | Structurally senior debt | Negative — Leverage Increase | E23 |
| Restricted payment capacity | Section 6.02 unlimited | Ratio Basket | Net leverage at most 6.75x; no default | Not supplied: covenant ratio | October 2024 payment of 4,348 | Not calculable without ratio | [Insufficient Information] — missing: covenant ratio | Formula Extracted Only | Critical | Debt-funded extraction | Negative — Leverage Increase | E14; E31 |
| Restricted payment capacity | Section 6.02(7) general | Grower Basket | Greater of 75 and 3.0%; no default | Not supplied: covenant EBITDA | Not supplied: usage record | At least 75 fixed floor | [Insufficient Information] — missing: usage | Formula Extracted Only | Low | Small leakage | Neutral — Stable | E14 |
| Restricted payment capacity | Indenture Section 4.07 unlimited | Ratio Basket | Cover above 2.0x; no default | Not supplied: covenant ratio | Not supplied: usage record | Not calculable without ratio | [Insufficient Information] — missing: covenant ratio | Formula Extracted Only | High | Note side permits what bank permits | Negative — Leverage Increase | E22 |
| Unrestricted subsidiary capacity | Permitted Investments (1)(c) | Grower Basket | Greater of 250 and 10.0%; new subsidiaries only | Covenant EBITDA not supplied | Not supplied: usage record | At least 250 fixed floor | [Insufficient Information] — missing: usage | Formula Extracted Only | Moderate | Bounded drop-down | Negative — Covenant Erosion | E10; E11 |
| Investment capacity | Permitted Investments (1)(a) restricted subsidiaries | General Basket | None stated | Not applicable | Not supplied: usage record | Unlimited by text | Unlimited by text | Ready with Limitations | High | Value to non-guarantors | Negative — Covenant Erosion | E10 |
| MFN protection | Section 2.24(b) | Reclassification Feature | 50 bp; 18-month sunset; acquisition carve-out | Amendment effective dates not stated in reviewed pages | Not applicable | Not applicable | Not applicable | Provisional | Moderate | Repricing protection lapses | Negative — Refinancing Risk | E12 |
| Guarantor / collateral release capacity | Section 9.02(c); indenture Section 12.07 | Prepayment / Reinvestment Capacity | Permitted disposition; bank release drags note release | Not applicable | Not applicable | Not calculable: asset-sale basket not reviewed | [Insufficient Information] — missing: asset-sale basket review | Provisional | High | Collateral reduction without note vote | Negative — Covenant Erosion | E18; E26 |

Baskets are not summed: reclassification in the borrower's sole discretion makes debt baskets fungible, and dividend and investment routes overlap.

### T4C.6 Debt, lien and priming capacity

| Route | Supported Legal Capacity | Current Calculation Status | Priming / Dilution Mechanic | PD Effect | LGD / Recovery Effect | RV / Security Selection Effect | Evidence ID |
|---|---|---|---|---|---|---|---|
| Pari secured ratio debt | Up to 5.00x secured net (bank) and 5.25x (notes) | Formula Extracted Only | Dilution of shared collateral | Higher leverage and service | First-lien recovery per dollar falls | Secured notes and loans equally exposed | E09; E21 |
| Junior and unsecured layering | Up to 7.25x net leverage | Formula Extracted Only | Adds claims behind first lien | Higher default probability | Limited first-lien effect; subordinated class diluted | Subordinated notes weaker | E09 |
| Incremental term loans and MFN | Conditions 7.25x and 5.00x; 50 bp MFN | Formula Extracted Only | Pricing protection lapses after 18 months | Refinancing cost rises | Pari dilution | Term-loan relative value weaker after sunset | E07; E12 |
| Majority-consented uptier | No express subordination protection | Not calculable: legal mechanic only | Priming of non-consenting classes | Could extend runway | Sharp loss for excluded lenders and notes | Favour positions able to join majority | E18 |
| Non-guarantor ratio debt | Up to 400 under indenture | Formula Extracted Only | Structurally senior claims | Limited | Non-guarantor value encumbered | Modest | E23 |

### T4C.7 Leakage analysis

| Leakage Route | Supported Fact | Formula / Basket | Usage / Remaining Capacity | Restricted-Group / Collateral Impact | Severity | Credit Implication | Evidence ID |
|---|---|---|---|---|---|---|---|
| Ratio dividends | Unlimited at 6.75x bank; cover above 2.0x notes | Ratio Basket | October 2024 payment 4,348; remaining not calculable | Cash leaves restricted group | Critical | Negative — Leverage Increase | E14; E22; E31 |
| General dividends | Greater of 75 and 3.0% | Grower Basket | Usage not supplied | Small | Low | Neutral — Stable | E14 |
| Unrestricted subsidiaries | Greater of 250 and 10.0%; new subsidiaries only | Grower Basket | Usage not supplied | Value outside restricted group | Moderate | Negative — Covenant Erosion | E10; E11 |
| Non-guarantor restricted subsidiaries | Unlimited investment | General Basket | Unlimited by text | Stays in restricted group but outside guarantees and direct collateral | High | Negative — Covenant Erosion | E10 |
| Asset sales | Automatic lien release on permitted disposition | Prepayment / Reinvestment Capacity | Basket not reviewed | Collateral reduced | Moderate | Negative — Covenant Erosion | E18; E26 |

### T4C.8 Add-back and capacity inflation

| Add-Back / Definition Feature | Source / Clause | Cap / Condition | Calculation Status | Capacity Inflation Mechanic | PD / LGD / RV Implication | Evidence ID |
|---|---|---|---|---|---|---|
| Projected cost savings, credit agreement | Consolidated EBITDA clause (m) | 25.0% of post-adjustment EBITDA, equal to 33.33% of pre-add-back EBITDA | Cap converted; amount used not supplied | Raises EBITDA and all grower baskets | Ratios understate economic leverage | E08 |
| Projected cost savings, 2033 indenture | Consolidated EBITDA clause (M) | 35.0% post-adjustment, equal to 53.85% of pre-add-back; 24 months | Cap converted; amount used not supplied | Larger note-side inflation | Note tests looser than bank tests | E19 |
| Dividend-equivalent payments | 2033 indenture clause (K) | No cap stated in reviewed text | Amount used not supplied | Distribution payouts raise EBITDA | Extraction feeds further capacity | E19; E31 |
| Financial-covenant EBITDA | Section 6.14 definition | Separate definition, detail not re-read | Not calculable | Maintenance measure may differ from incurrence measure | Monitoring complexity | E15 |
| Recurring issuer adjustments | Earnings quality | Acquisition, compensation and refinancing recur | Context only | Covenant EBITDA likely above credit earnings base | Higher true leverage than tested | E32 |

### T4C.9 Leakage and basket flags

| Flag | Supported Fact | Creditor Risk | Severity | Confidence | Downstream Module | Evidence ID |
|---|---|---|---|---|---|---|
| Debt-funded dividend capacity | Unlimited at 6.75x; used for 4,348 | Repeat recapitalisation | Critical | Moderate | Not applicable: routing excluded in this run | E14; E31 |
| Pari secured capacity | 5.00x and 5.25x tests | First-lien dilution | Critical | Formula Only | Not applicable: routing excluded in this run | E09; E21 |
| Uptier exposure | No express subordination protection | Priming of minority | High | Moderate | Not applicable: routing excluded in this run | E18 |
| Note release linkage | Bank release drags note release | Note collateral loss without vote | High | Moderate | Not applicable: routing excluded in this run | E26 |
| Non-guarantor investment | Unlimited into restricted subsidiaries | Structural leakage | High | Moderate | Not applicable: routing excluded in this run | E10 |
| Basket fungibility | Reclassification in sole discretion | Capacity cannot be summed or tracked simply | Moderate | Formula Only | Not applicable: routing excluded in this run | E10 |
| Add-back inflation | Caps 25% and 35% post-adjustment | Ratios loosen | High | Formula Only | Not applicable: routing excluded in this run | E08; E19 |

### T4C.11 Capacity risk prioritization

| Priority | Capacity Item | Severity | Confidence | Primary Risk Mechanic | PD Effect | LGD / Recovery Effect | Monitoring Action | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| 1 | Pari secured ratio debt | Critical | Formula Only | First-lien dilution | Higher | Higher first-lien loss | Track secured issuance | E09; E21 |
| 2 | Ratio dividends | Critical | Moderate | Debt-funded extraction | Higher | Higher for all classes | Track declarations | E14; E31 |
| 3 | Majority uptier route | High | Moderate | Priming of minority | Mixed | Sharp for excluded classes | Track Section 9.02 amendments | E18 |
| 4 | Note release linkage | High | Moderate | Collateral follows bank | Limited | Higher for notes | Track releases | E26 |
| 5 | Non-guarantor investment | High | Moderate | Value migration | Limited | Higher structural subordination | Track guarantor-group share | E10; E02 |
| 6 | Add-back inflation | High | Formula Only | Looser ratios | Delayed constraint | More debt before tests bind | Compare covenant to reported EBITDA | E08; E19 |

### T4C.12 Gaps ledger

| Gap | Missing Data | Why It Matters | Impact on Output | Required Follow-Up |
|---|---|---|---|---|
| Compliance certificate | Covenant net leverage, secured net and fixed-charge cover | Headroom | Seven tests not calculable | Obtain certificate |
| Basket usage | Usage for every basket | Remaining capacity | Remaining capacity not calculable | Obtain tracker |
| Covenant EBITDA bridge | Bridge from reported to covenant EBITDA | Ratio capacity | Grower baskets sized at fixed floors only | Obtain bridge |
| MFN dates | Amendment No. 15, 16 and 17 effective dates | Sunset timing | Sunset expressed relatively | Obtain effectiveness notices |
| Indebtedness definition | Covenant debt basis and float treatment | Definition conflict | Logged, not resolved | Re-read definition |
| Asset-sale basket | Section 6.03 and indenture Section 4.10 detail | Disposal leakage | Route severity provisional | Review sections |

### Material claim lineage

| Claim | Material conclusion | Strongest lineage | Evidence ID |
|---|---|---|---|
| D1 | Only maintenance test is springing revolver covenant at 7.50x above 40% use | Directly Sourced | E04; E15 |
| D2 | Pari secured ratio debt at 5.00x; junior at 7.25x | Directly Sourced | E09 |
| D3 | Unlimited bank dividends at 6.75x | Directly Sourced | E14 |
| D4 | Notes ratio debt and dividends at cover above 2.0x; liens at 5.25x | Directly Sourced | E21; E22; E23 |
| D5 | MFN 50 bp with 18-month sunsets and acquisition carve-out | Directly Sourced | E12 |
| D6 | Designation limited to new subsidiaries; investment cap greater of 250 and 10.0% | Directly Sourced | E10; E11 |
| D7 | Unlimited investment into restricted subsidiaries | Directly Sourced | E10 |
| D8 | Each-lender list in Section 9.02(b) | Directly Sourced | E18 |
| D9 | Note lien release on bank agent release; two-thirds for collateral release | Directly Sourced | E24; E26 |
| D10 | 179-day blockage | Directly Sourced | E27 |
| D11 | Cost-savings caps and dividend-equivalent add-back | Directly Sourced | E08; E19 |
| D12 | Issuer compliance at year-end and amendment ratio conditions | Directly Sourced | E04; E07 |
| C1 | Revolver usage 7.36% and headroom 32.64% | Calculated | E02 |
| C2 | Obligor share of sales 79.27% and assets 77.73% | Calculated | E02 |
| C3 | Cap equivalents 33.33% and 53.85%; debt share of recapitalisation 69.00% | Calculated | E08; E19; E31 |
| I1 | Absence of express subordination protection creates theoretical uptier route | Analyst Inference | E18 |
| I2 | Nearest pressure point is pari secured ratio debt | Analyst Inference | E09; E15 |
| I3 | Covenant EBITDA likely exceeds credit earnings base | Analyst Inference | E32 |
| I4 | Aggressiveness 4 of 5 | Analyst Inference | E09; E14; E18 |
| N1 | Intercreditor control, standstill and turnover | Insufficient Information | E20 |
| N2 | Covenant ratio headroom | Insufficient Information | E04 |
| N3 | Collateral exclusions and perfection | Insufficient Information | E13; E26 |

Field coverage counts the source gate and the thirty-one required registers; five fields lack their controlling input (intercreditor terms, security documents, compliance ratios, basket usage, other indentures).

## Calculations

All amounts are USD millions at 2024-09-30 unless stated; ratios are fractions shown also as percentages rounded to two decimals. None of these is a covenant ratio.

| ID | Operation | Period / units | Inputs | Result | Source |
|---|---|---|---|---|---|
| K1 | Ratio | FY2024; USD millions; fraction | Obligor-group net sales 6294 / consolidated net sales 7940 | 0.79269521 (79.27%) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K2 | Difference | FY2024; USD millions | 7940 - 6294 | 1646 non-obligor sales, before intercompany effects | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K3 | Sum | 2024-09-30; USD millions | Obligor current assets 7813 + goodwill 8186 + other non-current 3889 | 19888 | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K4 | Ratio | 2024-09-30; fraction | 19888 / consolidated total assets 25586 | 0.77730009 (77.73%) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59; Financial foundation (CP-1) |
| K5 | Difference | 2024-09-30; USD millions | Revolver commitment 910 - availability 843 | 67, matching stated letters of credit | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K6 | Ratio | 2024-09-30; fraction | Letters of credit 67 / commitments 910 | 0.07362637 (7.36%) | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| K7 | Product | 2024-09-30; USD millions | 0.40 × 910 | 364.00, matching the issuer's stated USD 364 million | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 62 |
| K8 | Difference | 2024-09-30; USD millions | 364 - 67 | 297 additional exposure before the trigger | TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, pages 59–62 |
| K9 | Difference | 2024-09-30; percentage points | 40.00 - 7.36 | 32.64 | d887611dex101.htm.jsonl, page 188 |
| K10 | Ratio | Definition; fraction | 0.35 / 0.65, cap on post-adjustment EBITDA restated on pre-add-back EBITDA | 0.53846154 (53.85%) | d887611dex41.htm.jsonl, page 16 |
| K11 | Ratio | Definition; fraction | 0.25 / 0.75 | 0.33333333 (33.33%) | d887611dex101.htm.jsonl, page 24 |
| K12 | Ratio | September 2024 transaction; fraction | New secured debt 3000 / dividend and equivalents 4348 | 0.68997240 (69.00%) | Business & governance (CP-1A) |

## Gaps

The open items below restrict headroom, intercreditor control and collateral conclusions; they do not alter the provision-level reading of the documents reviewed.

| Gap | Severity | What is missing | Conclusion restricted | Required resolution |
|---|---|---|---|---|
| Intercreditor agreement | MATERIAL | First Lien Intercreditor Agreement dated 2019-02-13 and its six joinders | Enforcement direction, standstill length, turnover and purchase rights among first-lien classes not established | Obtain executed agreement |
| Covenant ratios | MATERIAL | Compliance certificate with covenant net leverage, secured net ratio and fixed-charge cover | Headroom on seven tests not calculable; dividend and debt capacity not sized | Obtain latest certificate and covenant EBITDA bridge |
| Security and guarantor documents | MATERIAL | Guarantee and Collateral Agreement, security agreement, guarantor exhibit | Excluded assets, perfection and guarantor list not established | Obtain executed documents |
| Other indentures | MINOR | 2028 to 2032 secured and 2029 subordinated indentures | Class-specific baskets and releases not verified | Obtain indentures |
| Clean credit agreement | MINOR | Clean conformed copy and Amendment No. 15 | Operative wording read from marked annex | Obtain clean copy |
| MFN sunset timing | Relative condition | Amendment effective dates | MFN lapses eighteen months after each relevant amendment's effective date; no dated event recorded | Obtain effectiveness notices |
| Governing law | Relative condition | Governing-law clauses not re-read | Jurisdiction recorded by entity incorporation only | Re-read clauses |
| Temporal boundary | Scope | Annual report published after the as-of date | Issuer compliance statement and guarantor summary are retrospective evidence | Use only cutoff-public sources for a point-in-time decision |

## Next module
The orchestrator selects the next module.
