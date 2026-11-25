# Credit OS React report design

Design specification for the connected issuer report, 15 November 2026. The
[React design system](design-system.md), [component map](component-map.md), and React
[mocks](mocks/library.md) govern presentation. The current RBOT-HTML `fc010a7` methodology,
accepted handoffs, and published report data govern content. This specification
covers 25 registry entries and the delivery surface. At `fc010a7`, the full
assessment also schedules Liquidity (CP-2D) and Refinancing & LME (CP-3C) and
requires the CP-6 portfolio posture. Retained cases keep their delivered coverage.

- [Visualisation map](react-visualisation-map.md) maps all 91 catalogue entries to
  React components, source requirements, and fallback states.
- [Live handoff crosswalk](react-live-handoff-crosswalk.csv) maps all 350 parsed
  sections of the 12-module Caesars delivery to their proposed destinations and
  components. The current section role follows the parser. The design
  destination and component specify the React target. Heading paths and
  handoff lines are review locators.

## Screen layout

The reader is a credit analyst, portfolio manager, or committee member who needs the
decision, the evidence against it, and a way to check the underlying work. Use the
React slim application rail, page header, and underlined tabs. The issuer, case date,
pathway, and delivery state stay visible. Use the violet canvas, white cards, Navy
bottom-line band, Ultramarine action colour, Schibsted Grotesk headings, and Geist
body and tabular figures. Geist Mono stays with evidence identifiers. Space and
component density follow the React system.

| Destination | Reader sees first | React components and behaviour |
| --- | --- | --- |
| Library | Issuer and latest published view | Search and filter bar (N5), issuer cards (R10), Cards or List (N6), explicit delivery state (S1). Retained dates and adjusted earnings bases remain visible. |
| Report | Timeline of an issuer's runs | Run history feed (R11), pathway and date (N4), link to Changes and existing issuer intake. Distinguish accepted analytical work from an admitted report. |
| Overview | Decision and its key limitation | Bottom-line band (P1), metric tiles (F1), findings (P2), contrary evidence (P3), change-of-view callout (P4), limitations (P5), selected watch events (R4). Module tiles can summarise delivery. The module and section navigators belong on Modules. |
| Changes | Material change since the earlier eligible run | Change cards (F3), comparable numeric pair (C11), a table form and module state items (R7). Keep cause, consequence, and qualification together. A first run has a specific empty state (S2). |
| Modules | Selected module's bottom line | Run-scoped module list and section index (N3). On wide screens the module navigator stays in view. At narrow widths use a labelled picker and section menu. Keep Bottom line, Key findings, Contrary evidence and what would change the view in order; put figures after those passages and before Limitations, then the remaining typed records (R10, OQ-02). |
| Forecast | Forecast cases, basis, and usable outputs | Case cards (R9), scenario paths (C3), trend (C2), statements (R1), comparison (C5), debt and cash views (C1/C4/C10). Use a shared case choice where supported. Run figures have their own frames. Event lanes and relationship maps stay with the owning module. |
| Evidence | What can be verified and how | Five tabs from the React design, Summary, Trace, Sources, Gaps, Record. Calculations expand in Trace (R12). Module-written tables and registers remain unchanged and exact; they may appear in the inspector, Trace or Record. Run internals (calls, timings and instructions) live under Record (R13/R16/R17). Handoff downloads remain available there. One module filter applies to all five. |
| Trace drawer | The exact claim, then its derivation and source | Drawer (N7), derivation (R12), source row (R14), and Open in Evidence. One labelled control per paragraph, row, or figure, visible at rest; the page-level switch highlights the source icons where offered (R10, OQ-09). Return focus to the initiating control. |
| Start and Run activity | Inputs to approve, then what is happening | Stepper and upload rows (I1/I2), pathway choice (I3), review details (R2), explicit Submit (I4), progress steps (I5), labelled cap and spend (F4), run alert (S4). Plan, execution, delivery, and library admission have distinct states. |
| Signal | Outside stories and topics | Use the [React Signal mock](mocks/signal.md) and its own routes and source states. Cited research becomes report evidence only through an accepted handoff. |

On narrow screens wrap the report tabs and stack reading panels. Preserve the
label column and horizontal scrolling for statements, the table option on all
figures, and access to Evidence. In print keep qualifications with their figures.
Motion loops only for live work and respects reduced motion.

## From handoff to component

| Published output | Placement |
| --- | --- |
| Accepted bottom line, key findings, contrary evidence and what would change the view, limitations | Keep that order in the owning module. Use P1–P5 and preserve the author's paragraphs. Split contrary evidence from the change trigger only when the handoff distinguishes them. Overview selects the run's authorised lead and settled headline figures. |
| Named facts, status rows, questions, watches, cases, and relationships | Use Details List (R2), Status List (R6), Questions (R3), Watch (R8), Case Cards (R9), or a labelled pathway (R5). Use a matrix (C7) only when both axes or grades are published. Default to a readable fact list or a table for exact, novel shapes. |
| Chart, event or map descriptor linked to a handoff table | Render the mapped chart, event lane, or directed graph with `ChartFrame` and its Table view. The descriptor, source line, reporting unit, basis, and original cells stay together. A descriptor with a stated gap uses S3 with that reason. An unrecognised shape keeps its table. |
| Earlier/current comparison pack and accepted Changes passages | Use published pairs and verbatim explanations. A chart needs the same issuer, pathway, measure definition, unit, and comparable periods. Keep an incompatible pair and its reason in Evidence. |
| Published model output | Read the grid, exact calculation output, case names, and assumptions from the selected model. Mark the last actual and distinguish cash proxy from issuer free cash flow. When narrative and model figures differ, preserve both labels and bases and surface the recorded limitation beside the affected measure. |
| Source locators, Basis lines, calculation rows, hashes, gaps, registers, files and method/run identifiers | Send to the trace drawer or owning Evidence tab. Findings retain qualification and an accessible trace control. File selection during intake shows filenames as input labels. |
| Request, instructions for the next module, consumer commands, and inter-module transport | Keep out of the reading path and reader search. The original handoff remains available through its governed download. |

A number is drawable only on the published basis. Keep currency, units, period
precision, accounting signs, definitions, scenario identity, and qualification.
Use one y-axis, chronological periods across the x-axis, and side-by-side bars
for measures compared within a period. Use the React chart palette with shape,
dash, label, and table cues. Preserve zero. Show `n.a.` with its reason for a
missing number, the withheld treatment for a withheld number, and **Not
assessable** for a blocked module. An empty source slot never becomes a zero,
an inferred observation, or a fabricated forecast. Use dated lanes only for
records with explicit date precision and separate observed, scheduled and
scenario events. Relationship graphs show only declared edges.

Keep displayed values and comparison decisions with the publisher. React can
position a mark from a supplied number and apply its visual format. It never
derives a new delta, total, ratio, FX conversion, ranking or eligibility result.

## Module output map

Component IDs refer to the React component map. Every entry inherits the
handoff routing above. The detailed chart map gives the source conditions and
separates each figure from other outputs with a similar title.

| Registry entry | Lead output and components | Visuals or qualified fallback |
| --- | --- | --- |
| CP-0 · Source readiness | Readiness judgement, document coverage, blocking issues and supersession. P1, R6 and R2. Inventory, source and consumer register in Evidence. | Date-precision source lane. Use a dependency view only for recorded edges and states. |
| CP-1 · Financial foundation | Financial judgement, reporting-period grid, KPI metrics, income/cash/balance statements, debt instruments and reconciliation. P1, F1, R1. Definitions, construction and calculations in Evidence. | C1 revenue/EBITDA and maturity columns, C2 leverage/cover/liquidity, C4 debt stack, C10 EBITDA bridge. Keep reported, adjusted, face and carrying bases separate. |
| CP-1A · Business and governance | Company and transaction facts, governance and capital allocation, business mix, operating-model credit implications. R2, P2, C7 where graded. | Dated issuer history, ownership/control and operating-model edges. A business mix bar needs compatible stated amounts. |
| CP-1B · Earnings update | Paired periods and results, earnings drivers, margin/KPIs, guidance and watch dates. F2, R1, R8. | C1 grouped results and C11 KPI pairs need comparable periods and settlement. Preserve tables if their named figure bindings are absent. |
| CP-1C · Market and valuation | Defined peer universe, inclusion, operating and leverage comparison, outliers and valuation bases. R2, R1. | C12 separate percent and multiple strips. Use a table for heterogeneous or missing peer ranges and R4 for explicitly dated transactions. |
| CP-1D · Financial quality | Reported-to-supported EBITDA, add-back evidence and recurrence, cash conversion, and restated leverage. R1, C7 when graded. | C10 reconciled adjustments and C5 comparisons. Show unsupported adjustments as qualified records. |
| CP-DR · Research | Research questions, answers and consumers, support or contradiction, topic/peer coverage and sourced catalysts. R3, R2, R13 in Evidence. | Dated catalyst lane and evidence links. Keep provisional peer observations and comparable settled figures visibly distinct. |
| CP-2 · Fundamental credit | Thesis, strengths and weaknesses, credit drivers, contrary case and monitoring thresholds. P1–P6 and R8. | Directed risk transmission when the handoff has labelled edges. A flat list of drivers remains a reading panel. |
| CP-2A · Downside | Base operands, scenario shocks, stressed flows, break points, cushions and monitoring. R9, C5, R8. | Discrete case bars and stress decision map. Use ranked thresholds only with comparable units and typed thresholds. |
| CP-2D · Liquidity | Sources/uses, accessible and restricted resources, cash runway, funding dates. R2, R1 and R8. | C10 signed liquidity bridge, C2 runway and a dated financing lane. A point-in-time balance supplies no runway. |
| CP-2E · Rates, FX and hedging | Rate/FX scenarios, gross, hedged and residual exposure, terms, expiry, and other recorded macro risks. R2, R9, R8. | C5 discrete shock comparisons, directed hedge relationships and a dated expiry lane. Use spans only when both endpoints are available. |
| CP-2G · Forward credit model | Assumption register, operating and cash-flow forecasts, debt and liquidity roll-forward, case metrics, breakpoints and limitations. R1, R9 and R8. | C3 scenario paths, C5 case comparison and C2 trends from the published model. Machine-readable inputs remain a delivery contract and Evidence record. |
| CP-2H · Ratings | Current ratings and agency divergence, actions and migration triggers. F6, C15 and R8. | Dated ratings lane for dated actions. DR.6 has an explicit unavailable frame. Use C6 only for stated compatible threshold, direction and current value. |
| CP-3 · Instruments | Security preference, terms, observed or indicative prices, compensation/recovery basis, optionality and portfolio-fit qualification. R2, C5, R8. | Comparable instrument marks and dated catalyst lane. Keep quote timestamp and source class visible in the basis. |
| CP-3C · Financing | Refinancing need, funding burden, repricing/LME alternatives, conditions and deadlines. R9, R2, R8. | C1 funding need, C5 cost sensitivity and dated refinancing lane. Show only terms and dates evidenced for each alternative. |
| CP-3D · Relative value | Market-implied risk, estimates, quote basis and trading technicals. R1, R2 and C5. | C9 numeric yield/maturity scatter requires comparable dated quotes. RV.1 has no bound producer. Dated observations can support a trend only with a consistent series. |
| CP-4 · Legal and covenants | Document authority, covenant mechanics, capacity, creditor protections, entities and control. P1, R2, R8. Governing clause registers in Evidence. | C6 covenant headroom, dated legal events, legal-entity and intercreditor graphs at the stated perimeter. Broader legal graph conclusions require broader handoffs. |
| CP-4C · Recovery | Valuation cases, claims, distributions, class recovery, fulcrum/attachment and plan treatment. R9, R1, R5. | C1 class recovery by case and C10 one waterfall per supplied case. A missing scenario keeps its explicit gap. |
| CP-5 · Validation | Clearance, supported or contradicted claims, material issues and remediation. P1, R6, R8. Audit and all issue ledgers in Evidence. | Support/contradiction graph with stated relations. The graph leads to source trace and keeps restricted clearance distinct from passed. |
| CP-6 · Committee decision | Action bias, bull/bear/chair challenge, resolution, portfolio qualification and watch commitments. P1, P6, R8. | Dated decision/watch lane. C13 limits needs validated mandate, as-of exposure, applicable limit, NAV basis and optional proposed exposure. An unevaluated position stays a gap. |
| CP-8 · Changes | Material issuer and module changes, earlier/current measures, assumptions, limitations and regression recheck. F3, R7. | C11 for comparable numeric pairs. The Changes page owns narrative, and Evidence owns comparison measures, sources and the regression ledger. |
| CP-L10 · Short snapshot | Retained seven-topic summary, headline figures, qualification and upgrade disposition. P1–P5, F1, F2. | Comparable pairs only. The short pathway is closed to new runs. The selectable lite pathway uses CP-0, CP-1, CP-1A, CP-2 and CP-2A without a model. |
| CP-MODEL · Published model | Model grid, statements, scenario cases, bridges and calculation lineage. R1, R9, R12. | Same forecast/debt chart primitives. A Model Evidence link scopes the run's Trace view. Excel remains an input. |
| CP-OS · Orchestration | Plan, stage transitions, spend, retries, accepted handoffs, and delivery. I5, R11, F4 and S1/S4. | R17 timing spans only with recorded start/end times. Trace retention and stop reasons in Evidence Record. |
| CP-MEMO · Retired | The delivery process owns report composition. | No separate route or analytical stage. |
| Delivery | Eligible blocks, current/retained method distinction, publication and original files. N2, R7, R14. | Seven active pathway compositions. Cross-module event calendar and figure/table/export parity are design requirements driven by published records. |

Historical module aliases use the owning module's design. In particular CP-6A is
the portfolio debate phase of Committee Decision. A Holdings and Market Data
workbook can supply dated instrument context. The portfolio visual still needs
the contracted mandate, exposure, ratings, sector, holdings, maturity, and
compliance records on a basis that matches the run. The supplied Test CLO I
exposure was dated 29 May 2026. RBOT-HTML `b8cf4ca` recognizes the portfolio
exports and reports their validation issues. The October Caesars run used
separate issuer inputs and published **Requires More Work** with a portfolio
chart gap.

## Evidence and design dispositions

React owns the design target. The pre-redesign reader had one report shell,
headline tiles, generic findings and tables, a working trace drawer,
descriptor-backed charts, maps and events, and a published forecast grid. The
React kit supplies richer reading components such as
`ModuleNav`, `MatrixBlock`, `WatchBlock`, `QuestionsBlock`, `StatementBlock`,
`EvidenceFrame`, `ChangeCard`, and `ModuleSteps`. Their presence in the kit alone
does not establish a live binding.

| Pre-redesign difference | Design disposition |
| --- | --- |
| Overview currently includes a module link group and a lead handoff action. | Keep the verdict and selective delivery tiles on Overview. Use Modules for navigation and Evidence for original handoffs. |
| Modules currently uses chips with module codes and generic rendered sections. Its descriptor figures appear ahead of findings. | Use the persistent module/section navigator, reader-facing module names and judgement before figures. Select the typed component using the map. |
| Changes renders the first-run state and available passages. | A paired run needs tested change cards and matched figures or explicit comparability limits. The live Caesars case supplies no prior-run pair. |
| Evidence currently groups source and handoff sections on one page. | Use the five React tabs and shared module filter. Keep exact row-level trace and unchanged downloads. |
| Forecast has published cases and charts. Original model download is unavailable through the connected service. | Keep model cases, table and stated assumptions together. Establish actual original model asset access before exposing a download action. |
| Replay can deliver native files while the standard library refuses listing. | The report state must state both outcomes. A labelled local preview cannot be counted as official publication. |

Caesars `20261115-114658-01`, retained from the earlier RBOT-HTML baseline,
supplies 12 accepted modules, eight chart descriptors, seven event descriptors,
seven directed maps, one explicit chart gap, and one published model grid with
34 rows and 14 columns. Chrome and Edge on macOS checked the five report views
in the read-only preview, the visible rows and source links for all 21 drawn
figures, and the two authored gaps. The report check also covered the model
grid, first-run Changes and the exact handoff download.
For the model fidelity check, the narrative and deterministic FY2027 base
cash figures differ by USD 183.09 million. The cash-proxy label and stated
limitation must remain with the model output.

The earlier synthetic acceptance supplied CP-1 maturities of 500 and 1,250 US$m
with an explicit FY2027 gap, and calculated base FY2025E revenue of 1,050.
It is a separate regression fixture for number, missing-value and unit fidelity.

## Design acceptance

- On the wide layout, keep the selected issuer, run, module and section within
  reach while reading a long handoff. On a narrow layout the same controls and
  trace links remain reachable with one column of reading content.
- Verify one chart and its table against the same accepted handoff. Include a
  zero, a missing figure with a reason, a withheld value, and an incompatible
  earlier/current pair. Tooltips and accessible names follow the same rules as
  visible labels.
- From a finding, a chart and a table row, open the correct source line and
  return to the initiating control. Reopening a report retains issuer and run
  identity. Downloads match the accepted handoff bytes.
- Verify both a first run and a comparable pair, a restricted module, an
  unavailable model, and delivery without library admission. A retained output
  and its original provenance stay distinguishable from a newly executed module.

## Design sources reviewed

| React source | Used for |
| --- | --- |
| [DESIGN.md](../../DESIGN.md) (authority), [screen map](screen-map.md), [design system](design-system.md) token register, [component sources](component-sources.md) | Tokens, density, judgement hierarchy, charts, motion, source look and accessible state rules. React owner rulings in original Credit OS decision 0003 resolve open mock choices. |
| [Component map](component-map.md), [screen inventory](screen-inventory.md), [predecessor behaviour](predecessor-behaviour.md) | Kit vocabulary, navigation responsibilities and inherited data semantics. The old screen inventory is a coverage checklist. |
| [Library](mocks/library.md), [Model](mocks/model.md), [Run](mocks/run.md), [Signal](mocks/signal.md), [States](mocks/states-2.md) | React screen structure and component placement. Later owner rulings take precedence over differences recorded in the mock notes. |
| [States 2](states-2.md) | Confidence, run ends and module states. Proposals remain identified as proposals when the design system has no settled equivalent. |
| Original Credit OS design-track decision and D2 plans at `4df574a1` | Source-look rules, five Evidence tabs, kit choices and responsive intent. Review used the original repository alongside the imported React documents. |
| Original Credit OS handoff retrieval proposal at `5e0d70d2` | Confirms that raw headings, source links and typed facts are useful to retrieval. The proposal supplies no display requirement or new handoff contract. |
| Inherited RBOT screen, run, and visualisation documents | Data inventory, source conditions, and catalogue IDs. The current React design governs placement, layout, tokens and components. |
