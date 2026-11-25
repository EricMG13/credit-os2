---
issuer_id: tdg
issuer_name: TransDigm Group Incorporated
module_id: CP-DR
analysis_date: 2024-09-30
run_id: tdg-2024-09-30-deep_credit_assessment-copilot-sol-medium
pathway: deep_credit_assessment
artifact_name: tdg_CP-DR_20240930.md
module_status: Complete with Gaps
committee_status: Requires More Work
research_mode: linked
scope_type: issuer
scope_key: tdg
subject_name: TransDigm Group Incorporated
research_question: Assess the six default sector questions and locate public peer financial evidence
source_mode: hybrid
research_status: Complete with Gaps
research_stop_reason: Bounded searches completed; remaining measurement gaps explicitly retained
coverage_score: 100
---

## Request
TransDigm Group Incorporated, as of 2024-09-30; pathway: deep_credit_assessment. Research the default competition, earnings-definition, trading-context, demand, industry-structure and regulation questions, together with public candidate-peer financial operands, using information published by the cutoff.

## Sources

| Source | Document | Document date | sha256 | Use |
|---|---|---|---|---|
| TDG market quotes 2024-09-30.md | Hand-transcribed aerospace leveraged-loan relative-value sheet attributed to Bloomberg | 2024-09-30 observation date; publication date not stated | 6ec364fd720ed5245eb798b4bc52ab73e61f64d45862bf309fcc | External candidate leads and attributed trading context; not financial-peer evidence or independently authenticated pricing |
| TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl | Quarterly report for the period ended March 30, 2024 | 2024-05-07, signature date | fcec3566cfda08c82a8aaed7289c6440cc05d12976f237cd72a32cf9fbfb2ed6 | Negative search for competition; not used to establish sector concentration |
| TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Quarterly report for the period ended June 29, 2024 | 2024-08-06, signature date | ce1b0541d5e8222dc536d748942a3cb51236d7ff62d8613b002460bd8b41dcf2 | Issuer earnings definition, business mix and demand narrative available before cutoff |

| Supplied analysis | Module | sha256 | Use |
|---|---|---|---|
| Source readiness | CP-0 | 4c77b7a4349edeb22f76f4c69edbf7002f0fb6fe97327699a08160010dd95bd3 | Identity, source inventory, external-sheet restrictions and research starting point |
| Financial foundation | CP-1 | 5b9ba172bbe31a89253c6a8fd2420f5d127aac0bcb248979f824d4a858a5a2db | Definition and reporting-perimeter context; no later-published annual financial figure used as cutoff-public research evidence |

External pages below were retrieved from public SEC records on 2026-11-25. Undated discovery records establish search provenance only; historical figures below come from the dated underlying filings.

| Source | URL | Publisher | Stated date | Source type | sha256 | Use |
|---|---|---|---|---|---|---|
| web-a312b31e2a7d | https://www.sec.gov/files/company_tickers.json | SEC | Undated | Regulator or official | a312b31e2a7da0f9f4ada166e915f32c5114f44da74df2f4ab2a05d45ff44ce6 | Registrant discovery for StandardAero, Karman and HEICO; not historical listing evidence |
| web-1b4a9f589ada | https://data.sec.gov/submissions/CIK0002025410.json | SEC | Undated | Regulator or official | 1b4a9f589adaa6cba071607243bda86e5f7ec3a7b20e6f739dc9c856bea3bf11 | Located StandardAero registration amendment and its filing date |
| web-d133b5de22fa | https://data.sec.gov/submissions/CIK0002040127.json | SEC | Undated | Regulator or official | d133b5de22fa0f38fb88ef8c8719cc79a6205f01825ce02c13dcc90f83c32c2b | Karman cutoff search; no qualifying filing located |
| web-27a48ffcc65a | https://data.sec.gov/api/xbrl/companyconcept/CIK0002025410/us-gaap/RevenueFromContractWithCustomerExcludingAssessedTax.json | SEC | Undated | Regulator or official | 27a48ffcc65af43ba0cd2835653d0d54991dabf16b9b1b3a947e40003d15aefb | StandardAero revenue discovery; returned facts were filed after cutoff and excluded |
| web-912e342c5634 | https://www.sec.gov/Archives/edgar/data/2025410/000119312524227419/d838237ds1a.htm | StandardAero, filed with SEC | 2024-09-27 | Peer filing | 912e342c56349ca6c93e6185ccfd9888bcaacaca3ecf3a5f1458577159300100 | Registration amendment: competition, demand, operating model, regulation and peer financial operands |
| web-94180bf2d54f | https://data.sec.gov/submissions/CIK0000046619.json | SEC | Undated | Regulator or official | 94180bf2d54f1361f588789374f79ebde605afced32a3c1f0ccbfb53b5b8244a | HEICO filing discovery |
| web-0ff4105f035c | https://data.sec.gov/api/xbrl/companyconcept/CIK0000046619/us-gaap/RevenueFromContractWithCustomerExcludingAssessedTax.json | SEC | Undated | Regulator or official | 0ff4105f035cd2d87226ac748aeecdedbef951c8e56adf314b7f35b62cbfcbf8 | Located HEICO revenue fact, accession and pre-cutoff filing date; underlying filing used for figures |
| web-9705b33a6ef9 | https://www.sec.gov/Archives/edgar/data/46619/000004661924000059/hei-20240731.htm | HEICO, filed with SEC | 2024-08-28 | Peer filing | 9705b33a6ef94247d05eb63b87b88f0a0f1b7908a03d0ff2f13f41d7c05502eb | Quarterly report: demand corroboration, contrary electronics evidence, segments and peer financial operands |

## Findings

### Bottom line
External peer evidence supports an aftermarket-led operating buffer for TransDigm creditors, but does not establish a sector-wide monopoly, comparable leverage advantage or valuation premium. StandardAero reports growth driven by “higher engine maintenance demand”; HEICO independently reports increased demand across aftermarket replacement parts and repair services.
Basis: web-912e342c5634, page 30; web-9705b33a6ef9, page 8

The distinction matters: maintenance demand can support component replacement and cash servicing without protecting every product line or validating adjusted earnings. StandardAero describes the component-repair market as “highly fragmented” and warns about OEM control of approved parts. These findings support selective operating resilience, not an unrestricted claim that aerospace exposure alone protects creditors.
Basis: web-912e342c5634, page 10

### Key findings
- **Demand corroboration is stronger than a broad aerospace-growth assertion.** HEICO identifies “strong organic growth of 13%” in Flight Support over its first nine months of fiscal 2024. That is consistent with TransDigm's reported aftermarket recovery and reduces the likelihood that its demand narrative reflects acquisitions alone; it does not establish unit shipments or future orders.
Basis: web-9705b33a6ef9, page 8; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, page 51
- **Licensing is both an entry barrier and a dependency.** StandardAero says entrants require “extensive approvals and certifications from government regulators and OEMs”. Certification can slow substitution, but dependence on OEM technical data, parts and continuing approvals can transfer economics back to the OEM rather than protect every independent supplier's margin.
Basis: web-912e342c5634, page 3
- **Reported margins cannot be read as a clean business-quality ranking.** StandardAero says new OEM materials are “often passed through to end customers at minimal or no mark-up”. Its service-heavy revenue denominator differs from TransDigm's engineered-component manufacturing exposure; earnings definitions also contain different adjustments. No common-margin or leverage statistic is produced here.
Basis: web-912e342c5634, pages 3–3; web-912e342c5634, page 27; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34
- **Trading evidence remains an attributed observation, not an underwriting anchor.** The supplied external sheet identifies aerospace loan yields and discount margins, but does not supply enterprise values or financial denominators. It therefore answers what that sheet states, not whether a sector valuation premium or executable relative-value opportunity exists.
Basis: TDG market quotes 2024-09-30.md, page 1

### Contrary evidence and what would change the view
The strongest challenge to the positive demand reading is dispersion within the same peer. HEICO reports “decreased demand for its other electronics and medical products” while its aftermarket business grows. StandardAero also describes parts shortages constraining engine throughput. A deterioration in repair turnaround, parts availability or customer collections could therefore interrupt cash conversion before maintenance need disappears. The operating-buffer view would weaken if aftermarket organic growth reversed or completed work ceased translating into collections; a uniform contraction across the independent disclosures would outweigh today's directional corroboration.
Basis: web-9705b33a6ef9, page 9; web-912e342c5634, page 30

The strongest challenge to a cautious moat interpretation is the platform-specific nature of authorization. StandardAero reports “contracts directly with the OEM that designates us as the primary or sole outsourced provider of maintenance services for the engine”. Durable exclusivity and renewal economics could support defensibility within a defined platform. To extend that conclusion to TransDigm requires product-level alternatives, certification histories and contract economics, rather than a sector label.
Basis: web-912e342c5634, page 3

### Limitations
- The demand conclusion is directional: the retained independent disclosures emphasize sales and maintenance activity, not a common annual order or physical-shipment series. They do not establish the size or duration of TransDigm's next demand cycle.
Basis: web-912e342c5634, page 30; web-9705b33a6ef9, pages 8–9
- The competition conclusion covers engine aftermarket and adjacent components, not every TransDigm product niche. StandardAero's description of “many providers and varying levels of scale and breadth of capabilities” cannot establish TransDigm's product-level market share or substitute availability.
Basis: web-912e342c5634, page 10
- The financial candidates provide located operands, not an aligned financial cohort. Different reporting durations, materials pass-through and earnings adjustments prevent a relative leverage or margin conclusion without further definition and period work.
Basis: web-912e342c5634, pages 3–3; web-912e342c5634, page 27; web-9705b33a6ef9, pages 3–3
- Regulatory observations are attributed descriptions of sector requirements, not findings about TransDigm compliance or permit enforceability. StandardAero's warning that OEM authorizations can terminate upon approval failures establishes a transmission channel, not an issuer-specific breach.
Basis: web-912e342c5634, page 15

### Scope, questions and bounded work
The supplied settings contain no bespoke research questions. The method's default questions are retained in their stated order: competition; metric definitions; valuation context; market demand; industry structure; regulation. Public peer operand discovery is included. Historical evidence available by the assessment date is the boundary; no forward horizon, forecast, security choice or legal interpretation is assumed.

All default questions have a sourced answer, some expressly partial or attributed. Quantitative concentration, common annual orders and shipments, authenticated trading levels and a standardized earnings denominator remain unestablished. Completion of a bounded research question is not proof that those measurements exist.

| Workstream | Questions and perspective | Hypothesis and evidence needed | Sources and disconfirming test | Completion test and effort boundary |
|---|---|---|---|---|
| Supply and authorization | Competition, industry structure, regulation; supplier and creditor perspectives | Platform authorization may protect participation but not remove OEM bargaining power. Seek competitor descriptions, service mix and licensing requirements. | Primary peer filing; contrast exclusivity with fragmentation and OEM control. | Attribute sector descriptions; retain absent concentration measures. Standard budget; at most two focused gap loops per question. |
| Earnings and financial operands | Metric definitions and public peers; financial-statement perspective | Similar EBITDA labels need not represent the same cash economics. Seek definitions, debt basis and dated operands. | Primary filings and SEC discovery records; search for EBITDA and funds from operations rather than infer either from cash flow. | Preserve source definitions, units and durations; no cohort statistics or normalization. Same search cap. |
| Demand | Market demand; customer-utilization and cash-conversion perspectives | Independent aftermarket growth may corroborate issuer recovery. Seek annual and latest interim activity with contrary product lines. | StandardAero and HEICO origin families; test for weak channels, constraints and acquisition effects. | State directional agreement and limits of orders/shipments evidence. Same search cap. |
| Trading | Valuation context; market-evidence perspective | The supplied loan sheet may state sector trading context without establishing fundamental value. | External sheet; search for financial operands and distinguish loan principal from corporate debt. | Attribute quotes only; no valuation multiple or executable pricing inference. Same search cap. |
| Synthesis | All questions; creditor perspective | Distinguish operating support from protection of creditor cash flows. | Reconcile period, perimeter, definition and evidence-origin differences. | Close each bounded question with residual measurement gaps. |
| Adversarial review | All questions; skeptical perspective | A positive sector narrative may conceal mix or evidence-selection bias. | Search contrary electronics demand, parts constraints, OEM dependence and missing financial definitions. | Preserve contrary findings and refrain from unsupported issuer-specific extrapolation. |

### Research synthesis
**Competition — answered with a concentration limitation.** The external primary filing identifies engine OEM service divisions, independent providers, airline maintenance divisions, military facilities and component-repair specialists. Named participants include GE Aerospace, CFM International, Pratt & Whitney, Rolls Royce, Honeywell, Safran, MTU Aero Engines, ST Aerospace, SR Technics, OGMA, Duncan Aviation and HEICO. StandardAero calls component repair “highly fragmented”, while describing sizeable OEM shares on newer platforms. This is not a contradiction: platform access and the broader repair-provider population are different competitive boundaries. For TransDigm creditors, sector fragmentation cannot disprove a defensible niche, but neither can platform exclusivity prove group-wide pricing insulation. No quantitative sector concentration measure was found.
Basis: web-912e342c5634, page 10

**Metric definitions — answered, with no uniform sector measure established.** StandardAero defines Adjusted EBITDA from net income before interest, tax and depreciation and amortization, then adds non-cash and selected non-recurring costs, including transformation costs. Its phrase “other discrete expenses, when applicable” underscores discretion. TransDigm separately specifies stock and deferred compensation, foreign currency, acquisition and refinancing adjustments. HEICO's retained quarterly filing reports operating income and depreciation/amortization rather than a located EBITDA definition. These are distinct earnings identities; an apparent profitability difference cannot be assigned to business quality without reconciling them.
Basis: web-912e342c5634, page 27; web-9705b33a6ef9, page 8; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34

**Valuation context — answered only as an attributed sheet description.** The external sheet states loan bid/ask prices, yields and discount margins for aerospace issuers and rating indices. It contains no enterprise valuation or common earnings series, and its publication date is not stated. Loan issue sizes are not corporate debt operands. Consequently it can describe the sheet's stated sector trading context but cannot establish a fundamental valuation multiple or validate a private-transaction valuation.
Basis: TDG market quotes 2024-09-30.md, page 1

**Market demand — answered directionally, not as a common order-volume series.** StandardAero's latest interim Engine Services discussion attributes commercial growth to “higher engine maintenance demand”; its preceding annual discussion also describes rising component usage and maintenance demand, offset by parts constraints. HEICO attributes Flight Support organic growth to aftermarket replacement, repair and specialty-product demand. These separate company-origin disclosures corroborate TransDigm's reported aftermarket recovery, but measure sales and service demand rather than a consistent industry shipment index. The latest annual and interim periods are retained separately.
Basis: web-912e342c5634, page 30; web-9705b33a6ef9, page 8; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, page 51

**Industry structure — answered for the examined adjacent markets.** StandardAero describes firms ranging from “divisions of large public corporations to small privately-held entities”, with independent engine services and component repairs differing in scale and focus. HEICO separates Flight Support from Electronic Technologies, whereas TransDigm separates Power & Control, Airframe and Non-aviation. This mix dispersion means an engine-service operator and a component manufacturer need not share either revenue economics or downturn sensitivity. The candidate list is evidence-led and deliberately does not assert final peer inclusion.
Basis: web-912e342c5634, page 10; web-9705b33a6ef9, page 8; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34

**Regulation — answered as a peer's primary account of sector requirements.** StandardAero identifies FAA, European, British and Canadian oversight, recurring inspections, certifications and quality approvals, plus export controls and sanctions. Its warning that OEM authorizations may terminate if necessary approvals are lost links regulatory failure to access, revenue and cash servicing rather than merely higher compliance expense. It explicitly requires operators to “obtain and maintain certifications from regulatory authorities to provide service for commercially operated aircraft engines”. This supports a sector barrier and disruption channel, not a finding on TransDigm's compliance.
Basis: web-912e342c5634, page 15

### Causal downside and monitoring
A utilization slowdown or parts shortage would first reduce completed maintenance work and replacement-part throughput. Work in progress and receivables could then absorb cash while skilled labor and certification costs persist. TransDigm's debt servicing would become more dependent on liquidity if component collections slowed before costs adjusted. StandardAero identifies “ongoing supply chain delays” affecting parts availability and engine throughput, while HEICO demonstrates that adjacent electronics weakness can coexist with aftermarket strength. Monitor aftermarket organic sales, shop turnaround, supplier lead times, receivable conversion and approval continuity; no numerical stress threshold is established here.
Basis: web-912e342c5634, page 30; web-9705b33a6ef9, page 9; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34

### Analytical appendix — complete canonical registers

### TDR.2 Claim and evidence ledger
<!-- table-id: cpdr.evidence -->

| evidence_id | question_id | claim | claim_type | source | source_locator | source_date | source_type | independence_family | entity_period_unit_perimeter | Claim confidence | Uncertainty and creditor consequence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ECOMP | competition | StandardAero describes OEM, independent, airline and military competition; component repair is described as fragmented rather than uniformly concentrated. | source_characterisation | web-912e342c5634 | Competition risk discussion, page 10 | 2024-09-27 | primary | StandardAero | Engine aftermarket and component repair; qualitative market structure | High | No concentration statistic; platform access differs from provider count. Protects against assuming sector-wide pricing insulation. | web-912e342c5634, page 10 |
| EDEF | metric-definitions | StandardAero adjusts net income for interest, tax, depreciation and amortization, non-cash items and selected non-recurring expenses, including business transformation costs. | fact | web-912e342c5634 | Non-GAAP reconciliation, page 27 | 2024-09-27 | primary | StandardAero | Consolidated Adjusted EBITDA; annual and half-year periods distinguished | High | This is company-defined adjusted earnings, not a standardized cash measure. | web-912e342c5634, page 27 |
| EVAL | valuation-context | The supplied external sheet states aerospace loan yields and discount margins, but no enterprise valuation or financial denominator. | source_characterisation | TDG market quotes 2024-09-30.md | Entire sheet, page 1 | Not supplied: observation date 2024-09-30 only | attributed_view | Bloomberg attribution; manual transcription | Aerospace loans; observation 2024-09-30; prices in par points, yields in %, margins in bp | Low | Weak Lineage. Publication and provider-origin authenticity are not established. No executable pricing conclusion. | TDG market quotes 2024-09-30.md, page 1 |
| EDEMS | market-demand | StandardAero reports higher engine maintenance demand in its latest interim period and higher component usage in the preceding annual period, with parts constraints limiting throughput. | fact | web-912e342c5634 | Segment results, page 30 | 2024-09-27 | primary | StandardAero | H1 ended 2024-06-30 versus H1 ended 2023-06-30; FY2023 versus FY2022; company sales and demand descriptions | High | Company experience, not a sector order series; partly offsets an acquisition-only explanation for demand strength. | web-912e342c5634, page 30 |
| EDEMH | market-demand | HEICO reports strong Flight Support organic growth and weaker adjacent electronics demand. Verbatim: “strong organic growth of 13%”; “partially offset by a 1% organic net sales decline”. | fact | web-9705b33a6ef9 | Operating review, pages 8–9 | 2024-08-28 | primary | HEICO | 9M ended 2024-07-31 versus 9M ended 2023-07-31; FSG growth 13%; ETG organic decline 1% | High | Separate company origin from StandardAero, not independent macroeconomic measurement. Dispersion limits group-wide extrapolation. | web-9705b33a6ef9, pages 8–9 |
| ESTR | industry-structure | Engine maintenance is OEM-aligned, specialized and capital intensive; materials pass-through influences revenue margins. HEICO and TransDigm report different operating groupings. | source_characterisation | web-912e342c5634 | Business model, page 3 | 2024-09-27 | primary | StandardAero | Engine Services and Component Repair Services; qualitative operating perimeter | High | Maintenance-service economics do not duplicate component-manufacturing economics. | web-912e342c5634, page 3; web-9705b33a6ef9, page 8; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34 |
| EREG | regulation | StandardAero describes civil aviation oversight, recurring approvals, quality certifications, export controls and sanctions; approval failure may terminate OEM authorization. | source_characterisation | web-912e342c5634 | Regulatory risk discussion, page 15 | 2024-09-27 | primary | StandardAero | Sector requirements as described by a regulated service provider; no TransDigm compliance determination | High | No regulator-origin interpretation or issuer permit review. Provides a disruption pathway only. | web-912e342c5634, page 15 |
| ESFIN | metric-definitions | StandardAero supplies consolidated revenue, Adjusted EBITDA, carrying debt and accrued interest; each is retained at its printed precision and period. | fact | web-912e342c5634 | Business summary, page 3; reconciliation, page 27; debt summary, page 30 | 2024-09-27 | primary | StandardAero | Consolidated USD millions; H1 ended 2024-06-30 flows and 2024-06-30 debt instant | High | No annualization; no funds-from-operations substitution; selected debt is actual carrying debt, not offering-adjusted principal. | web-912e342c5634, pages 27–27; web-912e342c5634, page 30 |
| EHFIN | metric-definitions | HEICO supplies consolidated sales, carrying debt and accrued interest, but the EBITDA search finds no stated measure. | fact | web-9705b33a6ef9 | Statements, page 3; debt note, page 6; segment note, page 8 | 2024-08-28 | primary | HEICO | Consolidated USD thousands; 9M ended 2024-07-31 flows; 2024-07-31 debt instant | High | Operating income and depreciation are not automatically relabelled EBITDA. Interest retains statement expense sign. | web-9705b33a6ef9, page 3; web-9705b33a6ef9, page 6 |
| EISSUER | metric-definitions | TransDigm specifies compensation, foreign currency, acquisition and refinancing adjustments and reports recovery-related commercial aftermarket growth. | fact | TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl | Segment definition, pages 33–34; organic-sales discussion, page 51 | 2024-08-06 | primary | TransDigm | Consolidated group; thirty-nine weeks ended 2024-06-29 versus 2023-07-01; qualitative definition and demand attribution | High | Issuer evidence is not independent corroboration; it is the proposition tested against external company disclosures. | TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, page 51 |
| GOPERAND | metric-definitions | Searches of the StandardAero registration amendment and HEICO quarterly report found no funds-from-operations measure; the HEICO EBITDA search also found none. The external loan sheet contains no EBITDA. | gap | web-912e342c5634 | Recorded searches: funds from operations; HEICO EBITDA and funds from operations; sheet EBITDA | 2024-09-27 | gap | Search record; no factual support | Missing StandardAero ffo; HEICO ebitda and ffo; no substituted quantities | Insufficient Information | Missing operands stay missing. No common leverage, coverage or FFO comparison is established. | web-912e342c5634, page 27; web-9705b33a6ef9, page 8; TDG market quotes 2024-09-30.md, page 1 |
| GCUTOFF | competition | Karman registrant and filing-history searches located no filing published by the cutoff. StandardAero concept-history searches returned later-filed facts, so the dated registration amendment was used instead. | gap | web-d133b5de22fa | Filing-history search for cutoff period; StandardAero concept-history date search | Not supplied: discovery records are undated | gap | SEC discovery; no economic claim | Karman omitted from financial candidates; StandardAero later-filed concept facts excluded | Insufficient Information | Discovery does not establish historic public availability of a company or figure. | web-d133b5de22fa, pages 1–2; web-27a48ffcc65a, page 1 |

### Interpretation trace

| Claim | Analytical conclusion | Evidence references | Contrary evidence and what would change it | Lineage | Claim confidence | Source |
|---|---|---|---|---|---|---|
| Demand buffer | Independent aftermarket activity supports TransDigm's demand direction, but not a common volume forecast or automatic deleveraging. | EDEMS; EDEMH; EISSUER | Parts delays and electronics weakness coexist with aftermarket growth. A broad reversal of aftermarket organic sales and collections would outweigh corroboration. | Analyst Inference | Medium | web-912e342c5634, page 30; web-9705b33a6ef9, pages 8–9; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, page 51 |
| Bounded moat | Authorization barriers support selective defensibility, not a sector-wide monopoly or an assumed valuation premium. | ECOMP; EREG; ESTR | Primary or sole platform arrangements can be durable. Product-level alternatives, renewals and contract economics could strengthen the issuer-specific moat conclusion. | Analyst Inference | Medium | web-912e342c5634, page 3; web-912e342c5634, page 10; web-912e342c5634, page 15 |

### TDR.4 Candidate peers
<!-- table-id: cpdr.peers -->

| peer_id | name | basis_note | evidence_id | locator | Source |
|---|---|---|---|---|---|
| standardaero | StandardAero, Inc. | Named in the supplied aerospace loan sheet; a dated primary filing establishes engine aftermarket and component-repair exposure. Candidate only, with service-heavy economics. | ESTR; ESFIN | Business summary and financial reconciliation | web-912e342c5634, page 3; web-912e342c5634, page 27 |
| heico | HEICO Corporation | Named by StandardAero as a scaled component-repair competitor; its own filing supplies aftermarket replacement-parts, repair and electronics operating evidence. | ECOMP; EHFIN | Competition description; product disaggregation and segments | web-912e342c5634, page 10; web-9705b33a6ef9, page 6; web-9705b33a6ef9, page 8 |

### TDR.5 Provisional alignment observations
<!-- table-id: cpdr.alignment -->

| peer_id.dimension | observation | evidence_id | locator | Source |
|---|---|---|---|---|
| standardaero.period | Latest retained flows are a calendar half year; debt is the matching half-year-end instant. Annual comparatives are separately available. These are not TransDigm's annual duration. | ESFIN | Reconciliation and debt summary | web-912e342c5634, page 27; web-912e342c5634, page 30 |
| standardaero.definition | Adjusted EBITDA includes selected non-cash and non-recurring adjustments, including transformation costs. Debt selected below includes current maturities and is net of discounts and deferred finance charges. Interest is accrued expense, not cash paid. | EDEF; ESFIN | Non-GAAP definition and debt footnote | web-912e342c5634, page 27; web-912e342c5634, page 30 |
| standardaero.currency | US dollars, reported in millions; no conversion performed. | ESFIN | Financial table unit labels | web-912e342c5634, page 27; web-912e342c5634, page 30 |
| standardaero.segment | Consolidated Engine Services and Component Repair Services; OEM materials can pass through with little or no mark-up. | ESTR | Business model and segment results | web-912e342c5634, page 3; web-912e342c5634, page 30 |
| heico.period | Latest retained flows are nine months ending in July; debt is the same July-end instant. Neither flows nor debt are advanced to September. | EHFIN | Statement headings | web-9705b33a6ef9, page 3 |
| heico.definition | No stated EBITDA or funds-from-operations measure located. Debt includes finance leases and notes payable net of issuance costs and discounts; interest expense is shown as a deduction. | EHFIN; GOPERAND | Statements and debt note | web-9705b33a6ef9, page 3; web-9705b33a6ef9, page 6 |
| heico.currency | US dollars, reported in thousands; no conversion performed. | EHFIN | Statement unit labels | web-9705b33a6ef9, page 3 |
| heico.segment | Consolidated Flight Support and Electronic Technologies; Flight Support is closer to aftermarket replacement-parts and repair exposure, while adjacent electronics has a different demand pattern. | EDEMH; EHFIN | Segments, product lines and operating review | web-9705b33a6ef9, page 6; web-9705b33a6ef9, pages 8–9 |

### TDR.6 Located peer figures
<!-- table-id: cpdr.peer_figures -->

| peer_id.operand | amount | unit | currency | period_end | evidence_id | locator | quote | Source |
|---|---|---|---|---|---|---|---|---|
| standardaero.revenue | 2,582.9 | million; flow, six months ended 2024-06-30 | USD | 2024-06-30 | ESFIN | Business summary, page 3 | “For the six months ended June 30, 2024, we generated revenue of $2,582.9 million” | web-912e342c5634, page 3 |
| standardaero.ebitda | 336.0 | million; Adjusted EBITDA, six months ended 2024-06-30 | USD | 2024-06-30 | ESFIN | Business summary, page 3 | “Adjusted EBITDA of $336.0 million” | web-912e342c5634, page 3 |
| standardaero.debt | 3,275.7 | million; actual carrying debt including current portion, instant | USD | 2024-06-30 | ESFIN | Business summary, page 3; carrying-basis footnote, page 30 | “as of June 30, 2024 totaled $3,275.7 million” | web-912e342c5634, page 3; web-912e342c5634, page 30 |
| standardaero.interest | 155.6 | million; accrued interest expense, six months ended 2024-06-30 | USD | 2024-06-30 | ESFIN | Reconciliation, Interest expense row, first column, page 27 | “155.6” | web-912e342c5634, page 27 |
| heico.revenue | 2,844,004 | thousand; net sales, nine months ended 2024-07-31 | USD | 2024-07-31 | EHFIN | Statements of operations, Net sales row, first column, page 3 | “$2,844,004” | web-9705b33a6ef9, page 3 |
| heico.debt | 2,259,097 | thousand; carrying debt including current maturities, instant | USD | 2024-07-31 | EHFIN | Debt note, total before current-maturity deduction, first column, page 6 | “2,259,097” | web-9705b33a6ef9, page 6 |
| heico.interest | (113,907) | thousand; statement deduction for accrued interest expense, nine months ended 2024-07-31 | USD | 2024-07-31 | EHFIN | Statements of operations, Interest expense row, first column, page 3 | “(113,907)” | web-9705b33a6ef9, page 3 |

Only located operands are shown. Missing funds-from-operations measures and the unlocated HEICO EBITDA measure are recorded as gaps rather than replaced with operating cash flow or a constructed earnings measure. Short numerical quotations reproduce printed cells; their labels, units and periods are supplied by the specified table headings and columns.

### Search and disagreement record

| Search area | Searches executed | Retained result | Contrary evidence or unresolved difference | Source |
|---|---|---|---|---|
| Supplied external sheet | aerospace; EBITDA | Candidate names and attributed loan observations; no EBITDA | No provider publication date or financial fundamentals. Other sheet names remain leads, not financial peers established by this research. | TDG market quotes 2024-09-30.md, page 1 |
| Supplied interim issuer filings | March competition; June EBITDA As Defined, commercial aftermarket, FAA | March competition and June FAA searches found none; June definitions and demand passages located | Lack of a keyword hit is not proof that a requirement or competitor does not exist. | TDG_2024-03-30_10-Q_0001260221-24-000046_tdg-20240330.htm.jsonl; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, pages 33–34; TDG_2024-06-29_10-Q_0001260221-24-000069_tdg-20240629.htm.jsonl, page 51 |
| StandardAero discovery | Registrant search; filing history; cutoff-month search; registration-document search; revenue concept date search | Dated September registration amendment located | Later-filed concept facts excluded despite historical period labels. | web-1b4a9f589ada, pages 1–2; web-1b4a9f589ada, page 6; web-27a48ffcc65a, page 1 |
| StandardAero substance | Adjusted EBITDA; Total debt; competitors; Federal Aviation; licensing; Government Regulation; funds from operations | Definitions, actual carrying debt, competitors, regulation and demand located; FFO not found | Fragmentation versus platform leadership is a perimeter distinction. Actual debt and offering-adjusted capitalization are distinct roles, not competing measurements of the same instant. | web-912e342c5634, page 3; web-912e342c5634, page 10; web-912e342c5634, page 15; web-912e342c5634, page 27; web-912e342c5634, page 30 |
| Karman discovery | Registrant search; filing history; cutoff-year and cutoff-month searches | No pre-cutoff filing located in returned history | No later-filed Karman financial figures adopted. | web-d133b5de22fa, pages 1–2 |
| HEICO discovery and substance | Registrant and filing history; revenue concept and filing-date searches; quarterly report EBITDA, debt, interest expense, organic, funds from operations | Dated August quarterly filing; revenue, debt, interest, segments and organic growth located | No EBITDA or FFO definition located. Organic Flight Support growth and weaker electronics demand concern different segments, not a reconciled sector average. | web-94180bf2d54f, pages 4–5; web-94180bf2d54f, page 22; web-0ff4105f035c, page 2; web-9705b33a6ef9, pages 3–3; web-9705b33a6ef9, page 6; web-9705b33a6ef9, pages 8–9 |

### Events: Research catalysts

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
|---|---|---|---|---|---|---|
| Not supplied: no dated research catalyst established | Not supplied: no dated research catalyst established | Not supplied: no dated research catalyst established | Not supplied: no dated research catalyst established | Not supplied: no dated research catalyst established | Not supplied: no dated research catalyst established | Not supplied: demand, licensing and cash-conversion themes remain date-free monitoring items |

### Confidence inputs

| Input | Value |
|---|---|
| Directly Sourced | 9 |
| Calculated | 0 |
| Assumption-Based | 0 |
| Analyst Inference | 2 |
| Weak Lineage | 1 |
| Untraced | 0 |
| Conflicting | 0 |
| Insufficient Information | 2 |
| Fields present | 223 |
| Fields total | 223 |
| Source gate | partial |
| CRITICAL | 0 |
| MATERIAL | 3 |
| MINOR | 2 |

## Calculations

Peer figures are transcribed, not annualized, converted or used to calculate peer ratios. Research coverage measures whether each default question received a supported, bounded answer; it does not measure completeness of every desired financial operand. Field counts describe populated required register cells and entry checks, including explicit gap cells, not economic-data availability.

| ID | Operation | Inputs | Result | Unit and perimeter | Source |
|---|---|---|---|---|---|
| RCOVER | Ratio, then product | 6 answered questions / 6 locked default questions = 1; 1 × 100 | 100 | % question coverage; all six answers include their stated scope restrictions | Six default questions; Research synthesis; TDR.2 |
| RFIELDS | Sum | 120 evidence-register core cells + 10 candidate-peer core cells + 32 alignment core cells + 56 located-figure core cells + 5 entry checks | 223 | Populated fields of 223 required fields; entry checks: issuer, assessment date, scope, source capability and prerequisite identity | TDR.2; TDR.4; TDR.5; TDR.6; Request and supplied analyses |

## Gaps

| Gap | Severity | What remains open and where sought | Effect on the research conclusion | Follow-up question | Source |
|---|---|---|---|---|---|
| GSUPPLY | MATERIAL | No quantitative concentration or product-substitution series located in the examined competition and licensing descriptions. | Qualitative structure is answered; a group-wide monopoly or measurable sector concentration conclusion is not supported. | Which specific TransDigm product lines have qualified alternatives, and on what switching timetable? | web-912e342c5634, pages 3–3; web-912e342c5634, page 10 |
| GOPERATING | MATERIAL | StandardAero annual/interim and HEICO interim discussions provide sales and activity evidence, not common annual orders, physical shipments or a common observation period. | Directional aftermarket corroboration does not establish a volume forecast, demand duration or matched-period peer ranking. | Do common-period orders, shipment volumes, service completions and collections confirm the sales signal? | web-912e342c5634, page 30; web-9705b33a6ef9, pages 8–9 |
| GFINANCIAL | MATERIAL | FFO searches found none for either financial candidate; HEICO EBITDA search found none. Retained periods, definitions and service/manufacturing mixes differ. | No FFO comparison, common earnings denominator or relative leverage conclusion follows from the located figures. Missing figures are not zeros. | What definition and matched annual or trailing period can be supported consistently for each candidate? | web-912e342c5634, page 27; web-9705b33a6ef9, page 8 |
| GTRADING | MINOR for this bounded research; restrictive for valuation | External sheet publication date and provider-origin verification are not established; no EV or transaction denominator supplied. Searches of the sheet found no EBITDA. | Trading-context answer is explicitly an attributed observation only; no valuation multiple or private-transaction figure is validated. | Is there a dated original market extract and a documented enterprise-value bridge for the intended comparison? | TDG market quotes 2024-09-30.md, page 1 |
| GREGULATORY | MINOR | Regulatory discussion comes from a regulated peer, not an original regulator ruling or TransDigm permit-level review. | Sector requirements and potential disruption are described; issuer compliance and legal interpretation remain outside the conclusion. | Which approvals and export permissions are material to the particular product exposures being underwritten? | web-912e342c5634, page 15 |
| GCANDIDATES | Scope boundary | Karman searches did not locate a cutoff-eligible filing. Signia Aerospace, Barnes Aerospace, ITP Aero, Ontic, Vertex, Arxis and Chromalloy are names in the supplied sheet, but no qualifying financial evidence for them was retained in the bounded search. | These are discovery leads only, not a financial cohort. Absence of retained evidence does not establish that public financial information does not exist. | Which additional candidates have dated primary financials and relevant business overlap? | TDG market quotes 2024-09-30.md, page 1; web-d133b5de22fa, pages 1–2 |
| GTEMPORAL | Scope boundary | The annual figures in Financial foundation were published after the research cutoff; later SEC concept facts can describe earlier periods without having been public then. | No later-published issuer annual amount or later-filed peer concept fact is substituted for cutoff-public research evidence. This research does not revise retrospective annual extraction. | Was the particular disclosure public by the cutoff, rather than merely labelled with a historical period? | Financial foundation (CP-1); web-27a48ffcc65a, page 1; web-0ff4105f035c, page 2 |

The SEC registrant directory states no date and is used only for discovery, not to establish historical listings or candidate identity at the cutoff.
Basis: web-a312b31e2a7d, page 9

The SEC company filing histories state no publication date for the discovery records themselves. Individual filing dates were used to select the underlying reports; current directory attributes were not treated as historical facts.
Basis: web-1b4a9f589ada, pages 1–2; web-d133b5de22fa, pages 1–2; web-94180bf2d54f, pages 4–5

The SEC concept histories state no publication date for the histories themselves. Each observation's own filing date governs eligibility; the StandardAero observations returned were excluded, and the HEICO history served to locate its dated quarterly filing.
Basis: web-27a48ffcc65a, page 1; web-0ff4105f035c, page 2

## Next module
The orchestrator selects the next module.