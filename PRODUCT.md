# Product

Rewritten 2026-11-24 for the frontend redesign (owner: "re-design the entire frontend design
language and system from scratch"). Replaces the earlier PRODUCT.md. Visual language lives in
`DESIGN.md`. The full map of every screen and module — what to show, in what form, where,
for whom and how much it matters — is `docs/design/screen-map.md`.

## What Credit OS is

Credit OS runs an analytical workflow over an issuer's source files. Analytical modules write
Markdown handoffs; delivery assembles the issuer report from them (Overview, Changes, Modules,
Forecast, Evidence). Delivery adds no analysis. A run is complete only when those pages are
populated from its actual handoffs and checked against them (AGENTS.md).

## Personas

| Persona | Who | Comes to the product to | Time on a screen | Reads | Never wants to see |
|---|---|---|---|---|---|
| **Decider** (portfolio manager, committee member) | Senior, has not read the source documents | Decide: act, wait or pass, and know how far to trust the call | 2–5 minutes on Overview; seconds on anything else | The call, the bottom line, the numbers that carry it, what argues against it, what the run could not do | Module codes without names, file names, hashes, run ids, registers, a wall of tables |
| **Analyst** (credit analyst, starts runs) | Knows credit, not JSON or launcher flags | Start a paid run knowing what it will and will not do; check that it landed; work inside one module's numbers | Minutes on run start; long sessions inside Modules and Forecast | Readiness, cost cap, progress, the full statements and calculations, gaps to repair | Surprise spend, a failed run with no reason, a figure with no way to its source |
| **Reviewer** (second analyst, risk, audit) | Checks someone else's run | Confirm a figure or sentence is supported and see what was left out | Targeted visits, starting from one figure | Evidence: sources, trace, gaps, checks, run record | Findings re-argued; they want provenance only |

One screen serves one persona first. Overview and Changes are the Decider's; Modules, Forecast,
run start and run activity are the Analyst's; Evidence and the trace drawer are the Reviewer's.

## Screens: goal against the insight wanted

"Goal" is what the screen does in the workflow. "Insight" is what its first reader wants to
see first, and that — not the goal — sets the layout.

| Screen | First reader | Goal | Key insight wanted | So the screen leads with |
|---|---|---|---|---|
| Library | Decider, Analyst | List issuers and runs | Which names need me, and what changed | Issuers ranked by stance and change since the last run, not an alphabetical list of runs |
| Report · Overview | Decider | Present the run's result | What is the call, why, and how much to trust it | The call and bottom line; before→after figures; each finding beside its evidence; what the run could not do |
| Report · Changes | Decider | Compare with the earlier run | What moved and why | Changed measures with earlier → current and the stated cause; unchanged collapsed |
| Report · Modules | Analyst | Show each module's output | That module's own question answered visually (table below) | A module-specific lead visual, then its findings; records behind a disclosure |
| Report · Forecast | Analyst, Decider | Show the forward model | Where leverage, cover and liquidity go under each case, and when something breaks | Case paths against thresholds; assumptions editable-looking but read-only; statement grid second |
| Report · Evidence | Reviewer | Hold all machinery | Is this figure supported; what is missing | Search and trace first; gaps by severity; run record last |
| Report · Calendar | Decider | List dated events | What is coming and when | One time axis with maturities, tests and reporting dates |
| Run start | Analyst | Collect files and purpose, commit spend | What will this run do, not do, and cost | Readiness per module and the cap, before Submit |
| Run activity | Analyst | Show progress | Is it working, where is it, what failed | The module pipeline live; the feed second |

## Modules: goal against the insight wanted

Source of the module list: `src/deploy_vii/methodology.json`. "Data today" is what a retained
real handoff carries (TransDigm FY2024 runs; see `DESIGN.md` § Evidence base).

| Module | Goal | Key insight wanted | Lead visual | Data today | Change needed |
|---|---|---|---|---|---|
| CP-0 Source readiness | Freeze the source set | Can each module run on these files | Readiness matrix, module × status | Structured | Code |
| CP-1 Financial foundation | Collect canonical financials | How the financials are trending | Visual financial analysis: paired period comparison, margin, cash conversion, bridge, maturity wall, debt stack | Statements for two annual periods; seven chart tables | Code for the forms; **methodology** for more than two periods, LTM/quarterly, and a full debt stack (today six secured notes only) |
| CP-1A Business & governance | Describe the issuer and the transaction | What drives the cash and who controls it | Operating-model map and revenue mix | Prose and edge tables | Code; mix by segment needs a typed table (**methodology**) |
| CP-1B Earnings delta | Compare periods | What changed this period and why | Variance waterfall and ranked movers | Structured | Code |
| CP-1C Peer benchmark | Place the issuer against peers | Better or worse than peers, on what | Range strips with the issuer marked | Blocked at the peer data gate in every retained run | **Input/methodology** (peer data) |
| CP-1D Earnings quality | Test the add-backs | How much of adjusted EBITDA is supported | Add-back bridge with supported vs unsupported | No retained handoff | Prove on a real run first |
| CP-DR Deep research | Answer locked questions | Which questions were answered, and the answer | Question list with coverage | Prose; coverage figure | Code; a typed question/answer/status table (**methodology**) |
| CP-2 Fundamental credit | Form the credit view | Is the credit sound and what carries the risk | Strengths/weaknesses ledger beside leverage, cover and headroom | Prose, a metric table, a register | Code |
| CP-2A Downside | Stress the issuer | How far is the first break | Break-point ladder and scenario comparison | Scenario table; break points in prose | Code; a break-point table (**methodology**) |
| CP-2D Liquidity | Bridge liquidity | Does cash last, and until when | Liquidity bridge and runway | No retained real handoff | Prove on a real run; monthly runway is **methodology** |
| CP-2E Rates, FX & hedging | Size macro exposure | What a rate or FX move costs | Sensitivity ladder; hedged vs unhedged | Sensitivity rows | Code |
| CP-2G Forward model | Project the credit | Where leverage goes and when it peaks | Case paths against thresholds | Driver JSON; yearly path in calculation rows | Code via CP-MODEL output; a per-year path table (**methodology**) |
| CP-2H Ratings migration | Track rating triggers | Distance to a downgrade trigger | Trigger bullets by agency | No retained handoff | Prove on a real run first |
| CP-3 Security selection | Choose the instrument | Which security, at what value | Instrument table with value marks | Recommendation in prose; no yields or spreads | **Input** (market quotes) and a typed recommendation field (**methodology**) |
| CP-3C Refinancing | Assess refinancing and LME risk | What must be refinanced, when, with what | Refinancing need on the maturity axis | No retained real handoff | Prove on a real run first |
| CP-3D Market-implied risk | Read the market | What the market prices in | Yield against maturity; implied default | No retained handoff | **Input** (market data) |
| CP-4 Legal & covenants | Read the documents | How much headroom, and what the documents allow | Headroom bullets per test | Blocked without executed documents; cells "Not supplied" | **Input** (documents) |
| CP-4C Restructuring | Find the fulcrum | Who recovers what | Waterfall by class with the fulcrum marked | No retained handoff | Prove on a real run first |
| CP-5 Evidence validation | Validate support | Can the committee rely on this | Clearance status with issues by severity | Structured prose | Code; typed clearance fields (**methodology**) |
| CP-6 Committee decision | Reach the decision | The stance, the debate, the conditions | Bull/bear ledger with verdicts; stance and what moves it | Prose; score in front matter | Code; typed stance and action fields (**methodology**) |
| CP-8 Changes | Compare with the earlier run | What moved and why | Earlier → current per measure with cause | `changes.json`; causes often "Unresolved" | Code; cause attribution is **methodology** |
| CP-L10 Short snapshot | Ten-line view | The few figures that matter | Key-figure strip | No retained handoff | Prove on a real run first |
| CP-MODEL | Compute the model | The gridded forecast | Forecast page | Calculation JSON | Code |

## Methodology change against code change

A frontend change can re-draw anything a handoff already states. It cannot create a figure,
period, split or status the handoff does not carry: delivery adds no analysis, and missing is
never shown as zero. The redesign therefore sorts every wanted visual into one of three bins.

1. **Code only** — the data exists; the form is wrong. Examples: two-period column charts become
   before→after comparisons; the maturity table becomes a wall on a time axis; one generic chart
   card per descriptor becomes a form chosen by data shape; thirteen record tables move behind a
   disclosure.
2. **Methodology (handoff contract)** — the module knows the fact but writes it in prose or
   calculation rows. Needs a typed table or field in the handoff, selected per
   METHODOLOGY-REVIEW.md: CP-6 stance and action; CP-3 recommendation; CP-5 clearance counts;
   CP-2A break points; CP-2G yearly path; CP-DR question status; CP-8 causes; CP-1 periods beyond
   two and the full debt stack.
3. **Input** — the module is blocked for lack of material: peer data (CP-1C), market quotes
   (CP-3, CP-3D), executed documents (CP-4). The design draws the gap as a first-class state and
   run start says so before Submit; no UI change fills it.

Until a bin-2 or bin-3 item lands, its visual shows the designed gap state.

## Operating context and constraints (unchanged)

- An analyst uploads documents, picks a pathway, reviews a summary and submits. Submit on an
  approved summary starts a paid run capped by pathway: Lite USD 15, Full 25, Deep 40, the five
  purpose pathways 20 (`docs/rulings/2026-11-15-pathway-tiers-and-caps.md`,
  `docs/rulings/2026-11-11-run-start-submit.md`). A synthetic test mode spends nothing.
- Excel is an input format only. No workbook is a deliverable.
- Source references, file names, hashes, ids, registers, gap ledgers and run codes are drawn only
  on Evidence and in the trace drawer. Every other page shows findings and one trace control per
  paragraph, row or figure.
- The connected page ships `script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'`:
  no inline or third-party script or style, no CDN, no remote fonts. Fonts are self-hosted.
- No credential files; provider keys come only from the launching environment.

## Brand

- Name: Credit OS. The logo symbol is the only asset carried over from the previous design.
- Voice for report prose: judgement first — bottom line, key findings, contrary evidence and what
  would change the view, limitations (`docs/rulings/2026-11-11-reader-and-issuer-report.md`).
- Look (owner, 2026-11-24): clean, slick, modern, AI, enterprise SaaS and analytics platform.
- Design sources the owner likes, to copy, adapt or repurpose (2026-11-24): Untitled UI React,
  React Bits Pro (pipeline, bento grid, blocks), shadcnblocks (application shell, dashboard,
  timeline, chart card, chart group, bento), Shadcn UI Kit, ui-sdk menu.

## Principles

1. The call first, then the reason, then the doubt.
2. The form follows the data's shape and the reader's question — never one chart for everything.
3. A gap is drawn, named and owned; missing is never zero.
4. Findings on working pages; machinery on Evidence.
5. Exact values survive every boundary: amounts, periods, units, missing versus zero.
6. The analyst commits money once, knowing what the run will and will not do.

## Accessibility

WCAG 2.2 AA is the working standard until the owner sets one. Colour never carries meaning
alone; series that must be told apart also differ in lightness.
