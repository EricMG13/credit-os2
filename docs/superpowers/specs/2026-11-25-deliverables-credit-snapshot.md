# Deliverables, Credit Snapshot workbook and portfolio recommendations

Status: approved by the owner 2026-11-25 ("Approve, start"). Nothing here is built yet.
Mock-up: `docs/superpowers/specs/2026-11-25-credit-snapshot-mockup.html`.

## 1. Owner rulings this design rests on (2026-11-25)

| # | Ruling |
|---|---|
| R1 | The Export PDF button is replaced by a Deliverables page inside an issuer's report. It lists files to download and does not display their contents (like Evidence does for handoffs). |
| R2 | First deliverable: Credit Snapshot, a one-page credit summary for portfolio managers, as an XLSX file. Same information as the owner's reference screenshots; layout and design are new ("look like an app but Excel canvas"). Investment Thesis is left blank for the analyst. |
| R3 | The five purpose reports move into Deliverables as tiles that open the browser print dialog. The Credit Snapshot PDF is dropped in favour of the workbook. |
| R4 | Bloomberg-fed cells keep Bloomberg formulas and yellow FIGI input cells in the XLSX. Where the run supplies the value, the cell holds the value instead. |
| R5 | The app proposes recommendations; the analyst confirms (in the workbook). |
| R6 | Credit Score and Valuation combine through an owner-approved 5×5 table (section 4.3). |
| R7 | Valuation is computed when prices are supplied, otherwise blank for the analyst. |
| R8 | Portfolios differ by instrument, reference and limits; a limit breach caps that portfolio's recommendation at 3 - MW. |
| R9 | CP-2 writes a scorecard table using the owner's Risk Rubric: 17 factors (Probability of default dropped), each 1-5 with a one-line basis. Code averages them (section 4.2). |
| R9a | Structuring EBITDA is reported EBITDA plus all add-backs. House EBITDA is Structuring EBITDA less unrealised add-backs. |
| R9b | The loan and bond relative value sections appear only when the issuer has loans, bonds or both. FIGI / Bloomberg IDs are extracted from the RV book and drive the other fields. |
| R10 | App styling, no third-party logo, neutral labels ("House EBITDA", "House multiple"). |
| R11 | Reference portfolios: the app fetches the SSGA daily holdings files or the analyst provides files. Analysis is not limited to the three named portfolios; a different portfolio can be supplied at the launcher. |
| R12 | New pathway Credit Screening: CP-0, CP-1, CP-L10 run with its original five screens (L10, L20, L23, L30, L40), plus CP-DR. |
| R13 | Custom routing: the analyst picks modules from the full list within handoff rules, and for a module with aliases chooses the full module or an alias phase, each with an explanation. Specialised presets are also built but appear only under Advanced. |

These override two lines of `AGENTS.md`, which PR 0 amends: "Excel is an input format for analysis
only. Do not generate Excel workbooks…" (the Credit Snapshot workbook becomes the one permitted
workbook deliverable) and "Delivery adds no analysis" (the proposed recommendation is arithmetic on
module-written scores through an owner-approved table, always labelled proposed).

## 2. Module input map

Every cell is one of: **M** module handoff (copied exactly), **A** analyst cell (yellow, blank),
**B** Bloomberg formula keyed on a FIGI cell (value instead when the run supplies it), **C** computed
by ruled arithmetic, **R** reference portfolio file.

| Block | Cell(s) | Kind | Source | Available today |
|---|---|---|---|---|
| Header | Issuer, sector, country | M | CP-1A `company_description` | Yes |
| Header | Run date, pathway | M | run record | Yes |
| Company profile | Shareholders | M | CP-1A `ownership_register` | Yes |
| Company profile | Corporate ratings and outlook (M/S/F) | A then B | run-start entered ratings; Bloomberg formula if blank | Entered ratings yes |
| Company profile | Issuer ID | A | none | n/a |
| Scorecard | 17 factor levels and bases | M | CP-2 scorecard table (new, PR 1) | **No** |
| Scorecard | Management, Sector Outlook, Sponsor Quality, Credit Direction | M | CP-2 scorecard table; sponsor evidence from the CP-2C phase of CP-1A | **No** |
| Scorecard | Credit Score 1-5 | C | mean of the 17 levels (4.2) | **No** |
| Recommendation | Analyst, confirmation date | A | none | n/a |
| Recommendation | Valuation 1-5 per portfolio | C or A | instrument spread vs reference bucket (4.4) | **No** |
| Recommendation | Proposed recommendation per portfolio and per instrument | C | 5×5 table (4.3) and limit caps (4.5) | **No** |
| Transaction | Summary text | M | CP-1A `transaction_summary` | Yes |
| Transaction | New issue table: borrower, instrument, type, use of proceeds, size, maturity | M | CP-1A `transaction_summary`; the run context's `deal_terms` (CP-1 writes no new-issue rows: owner, 2026-11-26, "Leave it out") | Yes when a transaction exists; block hidden otherwise |
| Transaction | Guidance, OID, expected ratings, commit date, covenant score | A | none (third-party or deal terms) | n/a |
| Capital structure | Facility, coupon or spread, currency, maturity, outstanding, ranking | M | CP-1 T4.18 debt instruments | Yes |
| Capital structure | FIGI / Bloomberg ID | R then A | the RV book (Sector RV workbook) supplied to the run, joined to a T4.18 instrument only on a maturity date unique on both sides with agreeing asset type, no fuzzy match (PR 4); either identifier is enough; analyst cell when no join | Only with an RV book |
| Capital structure | Facility ratings, bid, ask | A (B later) | analyst cells until the Bloomberg formulas are added (`docs/TODO.md` item 14) | n/a |
| Capital structure | Senior, unsecured, total debt, cash, multiples | M | CP-1 T4.6 and T4.9, net debt data; senior and unsecured debt and leverage only from a row of that name, with its unit, else the gap `not in handoff` (PR 4) | Partly |
| Capital structure | Equity value or EV multiple, % EV | B or A, then C | Bloomberg equity value if listed; analyst multiple if not | n/a |
| Capital structure | Pro forma interest and cover | M | CP-1 `Pro forma interest and cover` table (PR 120), its `Reported EBITDA` row only, else `not in handoff` (PR 4); cash flow model output where the pathway holds it | Partly |
| EBITDA bridge | Reported EBITDA, each add-back, Structuring EBITDA (reported plus all add-backs), less unrealised add-backs, House EBITDA (structuring less unrealised add-backs) | M | Amounts: CP-1 T4.17 EBITDA bridge. Realised or unrealised: CP-1D T1D.1 add-back register and T1D.2 achievability ("Run-Rate Claimed" against "Realized To Date"), joined on Add-Back ID (owner, 2026-11-25: "add back are covered in cp-1d"); until CP-1D carries the ids, the split is the gap `needs add-back ids in the bridge` (PR 4) | Amounts yes; the split once CP-1D carries the ids; an add-back CP-1D marks Insufficient Information is shown unclassified, not assumed realised |
| Business | Description | M | CP-1A company and operating model | Yes |
| Thesis | Investment thesis | A | blank by ruling R2 | n/a |
| Thesis | Catalysts and near-term events | M | CP-1A `events_timeline`; CP-2 T2.12 monitoring triggers | Yes |
| Credit summary | Strengths and weaknesses (label, mechanism) | M | CP-2 strengths and weaknesses | Yes |
| Credit summary | Historical performance | M | CP-1B bottom line and key findings | Yes once CP-1B is in every pathway (in flight) |
| Financials | Revenue, gross profit, EBITDA, margins, growth | M | CP-1 T4.4 | Yes, all periods |
| Financials | Interest, tax, FFO, working capital, CFO, capex, FCF, M&A, debt, equity, net change in cash | M | CP-1 T4.5 | Yes, all periods |
| Financials | Cash, senior debt, total debt, net debt | M | CP-1 T4.6, net debt data | Yes |
| Financials | Senior, total and net leverage, interest cover | M | CP-1 leverage and interest cover data, T4.9 | Yes |
| Financials | Leverage and cover chart | C (chart of M cells) | cells above; periods on the X axis, oldest → LTM → PF | In flight (chart-periods PR) |
| Relative value | Loan table only if the issuer has loans; bond table only if it has bonds; both if both | – | the Inputs sheet's Type cell, with CP-1 T4.18 Type read fail-safe (an unknown type joins nothing); reading T4.18 `Asset type` (PR 120) is a follow-up | Yes |
| Relative value | FIGI / Bloomberg ID of the issuer's instruments and peers (required to populate every other field) | R | the RV book | Only with an RV book |
| Relative value | Index rows by rating bucket | A (B later) | analyst cells in each card's Index row; the reference portfolios feed the Matrix's valuation bands | n/a |
| Relative value | Peer loans and bonds: names | M | CP-1C peers, CP-DR peer pack, CP-3 relative value | Yes once CP-1C is in every pathway |
| Relative value | Peer pricing | A (B later) | analyst cells, one row per named peer | n/a |

Kept from the original: every block above. Dropped: the logo, "State Street" labels, the
guidance notes column. Added: the 17-factor scorecard strip, proposed-versus-confirmed state on
each recommendation, an as-of date for every reference portfolio, and a Sources sheet carrying the
trace for each M cell (source references stay off the Snapshot sheet, per the reader ruling).

A missing M value is written as an explicit gap ("not in handoff"), never as zero.

Amended at PR 4's merge (2026-11-26, coordinator, from the PR's rulings): the rows marked PR 4 above
and the three `A (B later)` kinds. No Bloomberg is installed here, so PR 4 writes no Bloomberg
formula: a B cell is an analyst cell until the formulas are added on the work PC (`docs/TODO.md`
item 14). The owner's words: "bloomberg id or figi will work with the same formula, so either is
fine. adding the formulas can only be done on the work PC."

## 3. Workbook design

One file, five sheets. Sheet 1 fits one landscape page.

| Sheet | Contents |
|---|---|
| Snapshot | The one-pager (see mock-up). Gridlines off, frozen title band, cards built from bordered ranges. |
| Model | The full cash flow model (section 7). |
| Inputs | FIGI cells, analyst overrides, portfolio selection. All yellow cells live here or are mirrored from here. |
| Matrix | The 5×5 table, the rubric, valuation bands. The Snapshot's recommendation cells are lookups into it, so an analyst edit to a score re-derives the proposal in Excel. |
| Sources | One row per M cell: module, section, run, as-of. |

Presentation by data type, so no component repeats for different information:

| Information | Element |
|---|---|
| Recommendation per portfolio | Chip cell with dropdown (data validation list), "proposed" tag cleared when the analyst sets the confirm cell |
| Credit Score, Valuation, leverage, cover, liquidity | KPI tiles; direction shown by an arrow glyph |
| 17 rubric factors | Heat strip: one cell per factor, 3-colour scale, basis in the cell comment |
| Financials by period | Table, all periods; negative in brackets; missing shown as "–" |
| Leverage and cover over time | Native Excel line chart, periods on X |
| Capital structure | Table with data bars on % EV and a per-instrument recommendation dropdown |
| EBITDA bridge | Stepped rows (reported, adjustments indented, house, structuring) |
| Strengths and weaknesses | Two facing columns with ▲ / ▼ glyphs in place of repeated words |
| 1M and YTD price moves | Green/red conditional fill |
| Analyst cells | Pale yellow fill, the only yellow on the sheet |

Built with `openpyxl` 3.1.5, already pinned; no new dependency. Prior art: the predecessor's
`cp_model_v3/workbook.py` `_render_snapshot` (cp-os, read-only) is adapted, not copied blind; its
table ids do not exist in this repo's handoffs.

## 4. Recommendation methodology (question 5B: methodology and code)

Three parts: a methodology document the owner approves, module instructions, deterministic code.

### 4.1 Scales
Credit Score: 1 Strong, 2 Good, 3 Fair, 4 Weak, 5 Stressed. Valuation: 1 Very attractive …
5 Very unattractive. Recommendation: 1 Strong OW, 2 Modest OW, 3 MW, 4 Modest UW, 5 Strong UW.

### 4.2 Credit Score roll-up
CP-2 scores each of the 17 factors 1-5 with the rubric's level text and a one-line basis. Code
takes the equal-weight mean of the scored factors, rounds half toward the weaker score, and floors
the result at 4 if Liquidity or Maturity profile is scored 5. A factor with no evidence is left
unscored and listed as a gap; fewer than 12 scored factors gives no Credit Score.

### 4.3 The 5×5 table (seed for approval)
Rounded average, half toward weaker; a 5 on either axis can be no better than 3.

| Credit ↓ / Valuation → | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 Strong | 1 | 2 | 2 | 3 | 3 |
| 2 Good | 2 | 2 | 3 | 3 | 4 |
| 3 Fair | 2 | 3 | 3 | 4 | 4 |
| 4 Weak | 3 | 3 | 4 | 4 | 5 |
| 5 Stressed | 3 | 4 | 4 | 5 | 5 |

### 4.4 Valuation score (seed for approval)
Per instrument, against the same-rating bucket of that portfolio's reference: loans by discount
margin (CLO book, loan index holdings), bonds by spread (HY index holdings). Difference from the
bucket median: ≥ +100 bp → 1; +40 to +100 → 2; within ±40 → 3; −40 to −100 → 4; ≤ −100 → 5.
A portfolio's Valuation is that of its best eligible instrument. No price or no bucket of at least
five names → blank, for the analyst.

### 4.5 Per-portfolio reading
- An issuer with no eligible instrument for a portfolio shows "n/a" there.
- A breach of that portfolio's supplied limits by adding the name (sector, rating bucket, CCC,
  price floor) caps the recommendation at 3 and names the limit.
- The issuer's current weight in the portfolio or index is shown beside the recommendation.
- A custom portfolio supplied at the launcher gets its own column by the same rules.

### 4.6 Reference data
CLO: the reconciled pack shape (`holdings.csv`, constraints, mandate). Loan index: SSGA LVLN daily
holdings. HY index: SSGA JNK daily holdings. Each stored with its as-of date and printed on the
workbook. The SSGA files' columns are **not yet verified**; PR 3 starts by reading them.

## 7. Model sheet: the full cash flow model (proposal)

Written from the run's existing model outputs (CP-1 tables and the calculation JSON); no second
analytical execution. The Snapshot sheet's Financials cells become references into this sheet, so
the workbook has one set of numbers.

Columns, left to right, each block present only when the run has it:
Quarterly (all supplied quarters) · YTD and prior YTD · Historic fiscal years · LTM · PF · Base
forecast · Downside forecast. The PF block is omitted when the issuer has no pro forma period.
Forecast blocks are omitted where the pathway holds no cash flow model.

Rows are data-driven, not a fixed template:

| Block | Rows | Source |
|---|---|---|
| Operating KPIs | Whatever the issuer reports (volumes, ARPU, backlog…); zero rows if none | CP-1 T4.10 KPI dashboard, operating KPIs |
| Income statement | Segment revenue and growth rows only for segments the issuer reports; revenue, COGS, gross profit, opex, EBIT, D&A, EBITDA | CP-1 T4.4, T4.16 segments |
| Adjustments | One row per add-back, flagged realised or unrealised; segment EBITDA rows only if reported; adjusted EBITDA | CP-1 T4.17, T4.16; CP-1D T1D.1, T1D.2 |
| Cash flow | Adjusted EBITDA to FFO, CFO, FCF, net cash flow | CP-1 T4.5 |
| Balance sheet | Cash, one row per debt facility with margin, secured, other and total debt, working capital lines | CP-1 T4.6, T4.18 |
| Credit KPIs | Senior, total and net leverage, interest cover, FCF to debt, cost ratios, days, tax rate, capex to revenue | CP-1 T4.9 |
| Assumptions | Base rates and forecast drivers | calculation JSON |

A line the issuer does not report is absent, not blank or zero. Historic cells are values copied
exactly. Forecast cells are values too, matching the app's model exactly (owner, 2026-11-25: "Values").

## 8. Custom routing: full module or alias phase (proposal, PR 7)

Fact: an alias is a phase inside a parent module; today the parent always runs every phase and
writes one handoff. Custom routing adds a scope choice per module that has phases.

| Choice | What is sent | What is checked | Handoff |
|---|---|---|---|
| Full module | Parent method and every phase's steps (today's behaviour) | All of the module's required registers | Parent's handoff |
| Selected phases | Parent's core method plus only the ticked phases' step files | Core registers plus the ticked phases' registers | Parent's handoff, labelled with its scope (for example "Legal and covenants: covenant capacity only") |

- Each option carries an explanation on the run start page: what it answers, what it needs
  upstream, what it leaves out, and its cost estimate. Reader words, no module IDs.
- Handoff rules: a later module that needs a register from an unticked phase causes the launcher to
  add that phase and say why (for example portfolio posture needs portfolio fit).
- A phase reads the parent's core results from the same run only; no reuse of an earlier run's
  handoff (owner, 2026-11-25: "Same run only").
- Phase-selectable now (own step file): CP-2B, CP-2C, CP-2F, CP-3A, CP-3B, CP-4A, CP-4B, CP-5A,
  CP-6A. Needs a step file extracted first: CP-1E, CP-4D. Not selectable: CP-PARSE (done in code);
  CP-L20 to CP-L40 (the five screens run together).
- Registers cut by the 2026-11-13 scope ruling are restored for a phase the analyst ticks.
- A custom run is compared by CP-8 only with an earlier custom run of the same module and phase selection.

## 5. Plan: one PR each, in sub-sessions, sub-agent-driven

| PR | Delivers | Depends on | Review |
|---|---|---|---|
| 0 | Rulings record, `AGENTS.md` amendments, methodology document with the rubric, table and bands | owner approval of this draft | batched docs review |
| 1 | CP-2 scorecard table: instructions, presence check, parser, tests | 0 | task review |
| 2 | Recommendation code: roll-up, table lookup, valuation bands, limit caps; property tests | 0, 1 | task review + adversary (deterministic calculation) |
| 3 | Reference portfolios: file intake, SSGA fetch, custom portfolio at the launcher | 0 | task review |
| 4 | Credit Snapshot workbook writer and its download endpoint; fidelity check against handoffs | 1, 2, 3 | task review |
| 4b | Model sheet (section 7); Snapshot financials reference it | 4, chart-periods PR merged (shared period order) | task review + adversary (figures) |
| 5 | Deliverables page: tiles, Export PDF button removed, purpose reports as print tiles | 4 | task review + design critique |
| 6 | Credit Screening pathway (five-screen CP-L10 + CP-DR) | layer-1 PR merged | task review |
| 7 | Custom routing, Advanced presets, alias choice with explanations; wires CP-1E, CP-4B, CP-4D | 6 | task review |

PRs 1 and 3 can run in parallel; 6 and 7 touch the pathway files the in-flight layer-1 PR changes,
so they wait for it. A paid proof run of CP-2's scorecard stays a separate owner action.

## 6. Open items for the owner

1. Approve or edit the 5×5 table (4.3) and the valuation bands (4.4).
2. Credit Screening cap: proposed USD 10.
3. Names and contents of the Advanced presets (proposed: Governance and ESG; Covenant Capacity; Portfolio Fit).
4. Custom routing cap: proposed sum of per-module estimates, ceiling USD 50.

Not verified: SSGA holdings file columns; whether the app's host can reach ssga.com; cost of the
longer CP-2 instruction; that Excel renders the conditional formats identically on Windows and Mac.

## 9. Risk Rubric level text (transcribed from the owner's rubric image, 2026-11-25; three cells amended the same day, see below)

Factor names are the coordinating session's reading, confirmed by the owner; the image has no row
labels. Probability of default is dropped by ruling R9. Levels: 1 Excellent, 2 Strong,
3 Satisfactory, 4 Weak, 5 Poor.

| Factor | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Scale | EBITDA > $1bn — large, diversified issuer with global reach | $500m–$1bn — strong mid-cap with solid market presence | $200m–$500m — medium-sized, regionally focused | $100m–$200m — small-scale, limited diversification | < $100m — niche or subscale, vulnerable to shocks |
| Market position | Market leader with strong pricing power and durable brand | Top-tier competitor with moderate pricing power | Mid-tier competitor in fragmented industry | Weak player in highly competitive or commoditized sector | Marginal operator with limited market relevance |
| Regulatory exposure | Minimal regulatory exposure; stable framework | Moderate oversight, but manageable compliance burden | Some exposure to evolving regulation; minor compliance risk | High regulatory sensitivity (e.g., pharma, healthcare, finance) | Significant compliance or litigation risk; ongoing investigations |
| Technology | Tech leader or innovator; disrupts peers | Competitive adopter; technology embedded in strategy | Average tech positioning; not at risk near-term | Lagging digital adoption; facing disruptive pressures | Obsolete tech; business model threatened by innovation |
| Barriers to entry | Very high barriers (capital intensity, IP, regulation) | High barriers (brand, relationships, economies of scale) | Moderate barriers (cost efficiencies, know-how) | Low barriers (few obstacles to entry) | None (high churn, perfect competition) |
| Leverage | Low leverage (<3x), conservative structure | Moderate leverage (3–4x), ample headroom | Elevated leverage (4–5x), stable but stretched | High leverage (5–6x), limited covenant cushion | Very high leverage (>6x), fragile structure or covenant breach risk |
| Free cash flow | Strong, consistent FCF >10% of revenue | Solid FCF, positive through cycle | Modest FCF, positive in stable years only | Weak FCF, negative under mild stress | Persistent negative FCF, reliant on external financing |
| Liquidity | Cash & RCF comfortably cover 2+ years' obligations | Sufficient to cover 12–24 months | Adequate for 6–12 months | Tight liquidity; dependent on revolver draw | Insufficient liquidity; default risk within 12 months |
| Rating trend | Stable rating trend, strong outlook | Limited downgrade risk, stable fundamentals | Balanced risk of upgrade/downgrade | Negative outlook or on watch | Repeated downgrades or imminent distress |
| Geographic diversification | Operations in >3 continents; diversified customer base globally | 2–3 major regions, with one contributing 40–50% of revenue | Majority (>60%) of revenues from one region, limited operations elsewhere | >80% of revenue from one country; minimal cross-border sales | 100% single country operations |
| Product diversification | Multiple independent revenue streams across end-markets | 1–2 products/services contribute 30–50% of sales | 1 main product/service contributes 60–70% of sales | 1–2 products/services contribute >80% of sales | 100% of revenues derived from one product/service |
| Market share | Dominant market leader (>30%) | Top 3 competitor, or 10–30% share | Mid-tier, 5–10% share | Small player, <5% share | Marginal presence or niche operator |
| Customer concentration | Highly diversified; no customer >5% of sales | Some concentration; top 3 <20% total | Moderate; top 3 <35% total | High; top 3 >50% total | Extreme; one client >50% total |
| Market access | Frequent issuer; broad investor base | Regular market access; well-followed credit | Occasional issuer; depends on market conditions | Limited access; small or private placement only | No market access; dependent on sponsor or bank support |
| Maturity profile | No maturities <3 years | Small near-term maturities, easily manageable | Moderate maturities, likely refinanced | Large maturities requiring market access | Refinancing wall imminent or missed maturity |
| Interest cover | EBITDA/Interest >4.0x | 3.0–4.0x | 2.0–3.0x | 1.0–2.0x | <1.0x (interest not covered) |
| Financial policy | Conservative and creditor-friendly. Net leverage <2.5x; stable policy. | Moderately conservative. Leverage <3.5x; disciplined management. | Neutral or balanced policy. Leverage 3.5–4.5x; some shareholder bias. | Aggressive policy. Frequent debt-funded actions. | Highly aggressive / equity-focused. Covenant breaches; distressed history. |

Two cells were amended on the owner's ruling of 2026-11-25 ("fix"); the wording is the
coordinating session's. Leverage level 4 was "High leverage (>5x), limited covenant cushion";
Market share level 2 was "Top 3 competitor" and level 3 "Mid-tier, <10% share", which overlapped
level 4. This closes the two gaps the image left (no level for 5–6x leverage; none for a 10–30%
share outside the top three).
