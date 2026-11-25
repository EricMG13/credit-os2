# Redesign S4: lead visuals of the Credit and Structure-and-market modules

2026-11-24. Work package S4 of `docs/superpowers/plans/2026-11-24-frontend-redesign.md`, branch
`claude/redesign-s4-leads-b`. Owns `report/leads/credit.tsx`, `report/leads/structure.tsx`,
`report/Downside.tsx`, `report/BreakPoints.tsx`, `report/MacroSensitivity.tsx`,
`report/Securities.tsx` and new files beside them. Does not touch `Modules.tsx`, `leads/index.ts`
or `leads/types.ts`.

## 0. What the handoffs actually carry (research, 2026-11-24)

Read from the retained fixtures, the synthetic handoffs (`proof/handoffs/`), the TransDigm
review (`reviews/2026-11-12-…/latest-run-tdg-proof-snapshot-opus-002.md`), the method files CP-OS
sends (`docs/reuse/selected-methods/skills/*`, `cpos_launch_methods.py`) and the launcher's owner
tables (`src/deploy_workflow/owners/cpos_launch_tables.py`). All real evidence is TransDigm FY2024
(as of 2024-09-30): **outdated evidence**, used for shape only.

- **The only tables with enforced cell rules are the launcher's owner tables**: `Chart data: …`
  (plain numbers or `Not supplied: <reason>`, one unit, fixed words), `Map: …` (edge tables) and
  `Events: …`. The store publishes them as `output.charts`, `output.chartGaps`, `output.maps` and
  `output.events` descriptors. Leads read these first, through `figureSource` / `moduleSource`.
- **Registers are model-written text** with model-chosen headings. `<!-- table-id -->` markers do
  not reach the web, and the Deploy VII stand-ins (`src/deploy_vii/methods`, `bindings`) reuse the
  same ids for different tables. Leads read a register only by an id-prefixed heading **and** its
  exact header row, and draw its cells as text.
- Real handoffs retained: CP-2E (two whole handoffs, `tests/fixtures/esg/CP-2E-h3.md`, `-h4.md`),
  CP-2A (table T2DS.1 only), CP-2G (the forecast-inputs block). CP-1A, CP-DR, CP-2, CP-3 and
  CP-4 are known only through the review's quotations. **No real handoff at all** for CP-2D,
  CP-2H, CP-3C, CP-3D, CP-4C.
- The four existing figures' tests (`Downside`, `BreakPoints`, `MacroSensitivity(.retained)`,
  `Securities`) are hand-built synthetic shapes; none copies real output.

## 1. Screen-map rows covered

Copied from `docs/design/screen-map.md` § Modules. Rank in brackets.

| Module | Lead visual (P1) | Also show (P2) | Needs (screen map) |
|---|---|---|---|
| CP-1A Business & governance | Revenue mix and the operating-model map: segment → cash driver → credit effect | The transaction and new debt; ownership and control map | Code. Method for a typed mix table |
| CP-DR Deep research | Question list with answered / not answered and the answer in one line | Coverage; causal scenarios | Code. Method for a typed question table |
| CP-2 Fundamental credit | Strengths against weaknesses ledger beside leverage, cover and headroom | Credit-risk transmission map | Code |
| CP-2A Downside | Break-point ladder: fall in EBITDA needed to reach each limit | Scenario comparison: leverage, cover, cash flow | Code. Method for a break-point table |
| CP-2D Liquidity | Liquidity bridge: opening → sources → uses → closing | Funding dates; runway | Proof. Method for a monthly runway |
| CP-2E Rates, FX & hedging | Sensitivity ladder: cost per shock step | Hedged against unhedged; foreign share | Code |
| CP-2G Forward model | Case paths against limits (the Forecast lead) | Drivers by case | Method |
| CP-2H Ratings migration | Trigger bullets per agency: current against trigger | Rating register; outlook | Proof |
| CP-3 Security selection | Instrument table: rank, yield, spread, recommendation per instrument | Relative value against peers; portfolio fit | Input (market quotes). Method for a typed recommendation |
| CP-3C Refinancing | Refinancing need on the maturity axis against available sources | Liability-management risk | Proof |
| CP-3D Market-implied risk | Yield against maturity with the issuer's curve | Market-implied default | Input (market data) |
| CP-4 Legal & covenants | Headroom bullet per test: actual against limit | Baskets and capacity; legal entity and intercreditor maps | Input |
| CP-4C Restructuring | Value waterfall by class with the fulcrum marked | Recovery by class; plan treatment | Proof |

**Unproven on a real run** (Needs "Proof" or "Input", or no retained real handoff of the table the
lead reads): CP-2D, CP-2H, CP-3C, CP-3D, CP-4C entirely; CP-4's bullets (the only real CP-4 was
blocked); CP-3's yield column (only the synthetic summary carries quotes); CP-2's typed
strengths/weaknesses table; CP-2A's break-point table. These leads are built from the contract and
the synthetic handoffs, with a first-class gap state, and must be proven on a real run.

## 2. Components

### 2.1 Shared parts (`report/leads/parts.tsx`, `report/leads/read.ts`)

Every lead is `<Bento>` of `Tile`s (kit, `report/overview/Tile.tsx`). A lead never repeats the
module header, bottom line, findings or limitations (S2 draws those).

| Part | Props | Does |
|---|---|---|
| `LeadFigure` | `span`, `label`, `kicker`, `title` (the reading), `basis`, `legend`, `trace`, `figure`, `table` | A tile whose head is the reading, the basis line once, a legend, the one trace control (`PublishedSource`), and a `Segmented` Figure / Table view switch (kit). The table is `ChartTable` (`components/chart`), so every figure has a table view |
| `LeadGap` | `span`, `label`, `title`, `reason`, `needs` | A `tone="gap"` tile: the title of what would be drawn, `GapNote` with the reason in words, and what unlocks it in plain words ("Needs a typed table in the handoff", "Needs …supplied at run start", "Not yet produced by a real run") |
| `LeadBlocked` | `span`, `label`, `title`, `reason`, `unlock` | Dashed warning-edge tile, the `Module state` "Not assessable" badge (slashed circle), the reason in the module's words, and what would make it assessable |
| `NodeList` | `edges`, `label` | A node map as real lists: one item per source node, nested list of "relationship → target · edge type". Table view through `LeadFigure`. Reads `edgeMap`'s header (`From | Relationship | Edge type | To | Evidence`); the Evidence column goes to the trace only |
| `DatedList` | `records` | Dated events (`eventRecords`) in date order: mono date at its stated precision, event, status word. No day invented for a coarser date |
| `Prose` | `paragraphs` | A module-written passage in a `Well`, paragraph by paragraph; a paragraph that names a source is replaced by "In Evidence" (`containsReference`) |
| `registerTable(entry, id, headers)` (read.ts) | | The one table under a heading that starts with the id (`T2F.4`, any separator after it, any case of the title) whose header row contains every named header; else undefined. Cells are text |
| `mapEdges(entry, name)` / `chartFigure(view, entry, title)` / `chartGap(entry, title)` (read.ts) | | The published map, chart descriptor + table, or the chart's stated gap reason |
| `moneyLead(text, currency)` (read.ts) | | The leading stated amount of a cell written `[+−]USD 57.89 million …`, exactly; null otherwise. The bar's label is the whole cell as written |

States every lead draws: **data** (figure), **gap** (`LeadGap`, the reason, never zero),
**blocked** (`LeadBlocked`), **empty** (the module ran but wrote none of the lead's tables: each P1
tile becomes its `LeadGap`). Loading is the page's (S2). Missing cells inside a drawn figure are
hatched marks with "Not supplied" and the module's reason.

Grid: P1 tile first and largest (8 or 12 columns at ≥ 1024 px); P2 tiles beside (4) or under it
(6 + 6). At 390 px every tile is one column, figures scale by `viewBox` and tables scroll inside
their tile, never the page.

Accessibility: each figure is inline SVG with `role="img"` and an `aria-label` stating the reading
with the figures; direct labels in mono; direction always in words; Figure/Table is a pressed
button group; node maps and dated events are lists.

### 2.2 Credit stage (`leads/credit.tsx` → `LEADS`)

| Module | File | Tiles (1440 px span) | Reads | Gap / blocked |
|---|---|---|---|---|
| CP-1A | `cp1a.tsx` | P1 "Operating model to credit" `NodeList` (8); P1 revenue mix (4); P2 ownership and control `NodeList` (6); P2 transaction and new debt `Prose` (6) | `output.maps` "operating model to credit", "ownership and control" + their tables; section "Transaction summary and new debt issues" | Revenue mix is always `LeadGap` today: **Method** (no typed mix table; the register's mix is free text). Node roles (segment / driver / effect) are not typed, so the map is drawn as written, not in three columns: **Method**. A map with a `gap` draws its reason |
| CP-DR | `cpdr.tsx` | P1 question list (12) ; P2 causal scenarios `Prose` (8); P2 research catalysts `DatedList` (4) | section "Causal synthesis and scenarios"; events lane "Research catalysts" | P1 question list is `LeadGap`: **Method** (TDR.3 is out of the CP-OS register scope; no typed question / state / answer table). Coverage has no fixed place: stated in the gap, **Method** |
| CP-2 | `cp2.tsx` | P1 ledger: strengths column against weaknesses column (8); P1 beside it: leverage, cover, headroom (4); P2 transmission map `NodeList` (12) | The table with header `direction | rank | label | mechanism | …` (any heading), else `T2.10` with `Rank | Driver | … | Direction`; fallback the "Strengths and weaknesses" passage. Leverage and cover from CP-1 `Chart data: leverage` / `interest cover` (`periodSeries`); headroom from CP-4 `Covenant headroom` (`headroomTests`) | No typed ledger → the passage in a `Well` plus a gap line (**Proof**). CP-4 absent or blocked → headroom states why (**Input**). Rows are never counted into a score |
| CP-2A | `Downside.tsx`, `BreakPoints.tsx` | P1 break-point ladder (8); P2 scenario comparison as small multiples, one panel per measure, every case on that measure's scale (4, or 12 below) | `breakPointView` (T2DS.6 / first-break ranking) and `downsideView` (T2DS.4 × T2DS.1), data reading unchanged | No break-point table → `LeadGap` "Break points are written in prose" (**Method**: CP-2A to write the break-point table). Cases not bound → table only with the stated note |
| CP-2D | `cp2d.tsx` | P1 liquidity bridge, horizontal waterfall (8); P2 funding dates `DatedList` (4); P2 runway (4) | `Chart data: liquidity bridge` descriptor (Step / Amount); events lane "Financing" | Bridge that does not reconcile or has a gap amount → table view with the reason, no bars. Runway → `LeadGap` (**Method**: no monthly runway). Whole module **Proof** |
| CP-2E | `MacroSensitivity.tsx` | P1 sensitivity ladder: one row per stated shock step, added annual interest before hedges with the after-hedges mark (8); P2 hedged against unhedged, one proportional bar (4); P2 foreign share (4); P3 hedge terms in the table view | `macroView` (deploy_vii shapes, kept), plus skill registers by id: `T2F.5` (`Sensitivity | … | Estimated Cash Impact`), `T2F.4` (`Metric | Amount`), `T2F.3` hedges | A single stated step is drawn as one row with its gross comparator; a ladder of more steps needs a step grid (**Method**). Foreign share → `LeadGap` with the module's FX limitation (**Input**) |
| CP-2G | `cp2g.tsx` | P1 net leverage path by case from the published model, one small panel per case on one scale (12: three panels need the width) with a link to Forecast; P2 drivers by case, driver × case × year (12: unreadable at 4) | `forwardPath` of `view.models[0]`; `forecastInput(entry)` drivers | No numeric limit is published with the model: the limit line is a `LeadGap` line (**Method**). Declined forecast (null drivers) → `LeadGap` with the module's reason. Per-year path beyond the model grid: **Method** |
| CP-2H | `cp2h.tsx` | P1 trigger bullets grouped by agency (8); P2 rating register and outlook (4) | `Chart data: rating triggers` descriptor (`headroomTests`/`bulletGeometry`); register `T2R.1` (`agency | issuer/instrument | rating | outlook/watch`) | Row with a `Not supplied` value → gap row with reason. No table → `LeadGap`. Whole module **Proof** |

### 2.3 Structure and market stage (`leads/structure.tsx` → `LEADS`)

| Module | File | Tiles | Reads | Gap / blocked |
|---|---|---|---|---|
| CP-3 | `Securities.tsx` | P1 instrument table (12): instrument, rank as written, market level, yield as `BarCell` (share of the largest stated yield), spread, recommendation badge, one trace per row; P2 relative value (6) and portfolio fit (6) as `Prose` | `securityView` (kept) and the real run's `Recommendation` table shape (`Security group | Market level … | … | Recommendation`); sections "Relative value", "Portfolio Fit" | Spread column is always "Not supplied" with the reason (**Method** + **Input**: no spread column). Yield only where the cell states a last-trade yield; otherwise text, no bar (**Input**). Peer chart → `LeadGap` (**Input**) |
| CP-3C | `cp3c.tsx` | P1 debt maturing against committed resources per period, paired bars on one scale from zero (8); P2 liability-management paths (4) | `Chart data: refinancing need` descriptor; register `T3D.6` (`Path Type | Feasibility | Likelihood Direction`) | Shortfall is not stated, so it is not drawn. Gap cells hatched with reason. No T3D.6 → `LeadGap`. Whole module **Proof** |
| CP-3D | `cp3d.tsx` | P1 yield against maturity on a true date axis, points only (8); P2 market-implied default (4) | `Chart data: yield against maturity` descriptor; register `T3E.5` | The issuer curve line is a `LeadGap` note (**Method**: no curve points are stated; a line through the points would interpolate). Whole module **Input** |
| CP-4 | `cp4.tsx` | P1 headroom bullet per test, each on its own scale, current against threshold, headroom as stated (8); P2 legal entities (4) and intercreditor (6) `NodeList`; P2 baskets and capacity (6) | `Covenant headroom` descriptor (`headroomTests`/`bulletGeometry`); maps "legal entities", "intercreditor"; register `T4C.5` text | **Blocked**: `LeadBlocked` "Not assessable" with the chart's own gap reason, else the bottom line's first sentence after `Not assessable:`; unlock line "Covenant headroom needs the executed credit agreement and indentures supplied at run start". Maps with a `gap` draw it |
| CP-4C | `cp4c.tsx` | P1 value allocation waterfall per scenario (8); P2 recovery by class, claim against recovery with the stated recovery % (4); P2 plan treatment (12) | `Value allocation — scenario n` descriptors; `Recovery by class` descriptor; register `T4E.4` class treatment | The fulcrum marker is a gap line (**Method**: no drawable table states it; deriving it would be analysis). Whole module **Proof** |

### 2.4 The four existing figures

Their data readers (`downsideView`, `breakPointView`, `macroView`, `securityView`, and helpers)
keep their signatures and behaviour; `stressData.ts` (S1) imports `downsideView` and
`scenarioShareLabel`. Their presentation is rebuilt into the lead tiles above. The exported
components `Downside`, `BreakPoints`, `MacroSensitivity`, `Securities` keep their props so
`Modules.tsx` still compiles; they render the new tiles. Once S2 draws `leadFor(module)`,
`Modules.tsx` should stop drawing them a second time (request below).

### 2.5 Changes from the coordinator's first review (2026-11-25)

These override §2.1–2.4 where they differ.

- **Blocked**: a lead draws nothing when the module is blocked; the frame's header draws the
  state. `LeadBlocked` and every unlock line are gone.
- **`draws`**: each lead is exported through `withDraws` (`leads/draws.ts`) with the kinds it
  draws; the frame keeps the rest. CP-1A maps+events; CP-DR events; CP-2 maps; CP-2A figures;
  CP-2D figures+events; CP-2E figures+events; CP-2G none; CP-2H figures; CP-3 figures; CP-3C
  figures+events; CP-3D figures; CP-4 figures+maps; CP-4C figures. A lead that draws figures
  also draws their gaps (`OtherCharts` in `leads/written.tsx`).
- **Gap wording**: "This page could not read <thing>." or the module's stated reason; no "from the
  handoff", no "the module", no methodology or build note on the page. A table the store withheld
  is read from the handoff and drawn, or said to be present and not drawable, with its trace.
- **Titles** are subject names; no reading is assembled by the page.
- **One system**: `BarRow`, `KeyValues`, `Notes`, `GapCell`, `CompactGap`, `TableRegion` (named,
  focusable), `Disclosure`, the node map by depth, the figure head with its `controls` slot, one
  `writtenTable`; Overview's `DeltaBar` for two periods in CP-2.
- **Forms changed**: CP-2E one or two stated steps are figures, the ladder from three; currency
  shocks one table. CP-3C need and resources as columns on a true year axis. CP-3D points from
  three quotes, else a list; labels HTML at 12px. CP-3 a card per instrument below lg, every
  module column drawn, price and yield comparison when two comparable trades are stated. CP-2G
  "Net leverage by case" with "Highest published forecast year" per case and no picked peak.
  CP-1A draws the revenue-mix register as written. The CP-2D runway tile is removed.

## 3. Files

Add: `leads/parts.tsx`, `leads/read.ts`, `leads/cp1a.tsx`, `cpdr.tsx`, `cp2.tsx`, `cp2d.tsx`,
`cp2g.tsx`, `cp2h.tsx`, `cp3c.tsx`, `cp3d.tsx`, `cp4.tsx`, `cp4c.tsx`, a test per file, and
`leads/markdown.fixture.ts` (test-only: turns a retained Markdown handoff into sections, so the
real CP-2E and CP-2A fixtures are tested as written).
Change: `leads/credit.tsx`, `leads/structure.tsx`, `Downside.tsx`, `BreakPoints.tsx`,
`MacroSensitivity.tsx`, `Securities.tsx`.
Tests rewritten to the new layout (behaviour kept: values, links, states, gaps, the case and
basis choices): `Downside.test.tsx`, `BreakPoints.test.tsx`, `MacroSensitivity.test.tsx`,
`MacroSensitivity.retained.test.tsx`, `Securities.test.tsx`. Delete nothing.

## 4. Drawn as a gap today (for the methodology plan)

| Module | Gap | Kind | What the handoff would need |
|---|---|---|---|
| CP-1A | Revenue mix | Method | A typed mix table: business line, period, revenue, share, unit, basis; coverage shown, never forced to 100% |
| CP-1A | Map in three columns (segment → driver → effect) | Method | A node role on each map node |
| CP-1A | New debt list | Method | Instrument, date, amount, secured, use of proceeds as a table |
| CP-DR | Question list, answered state, one-line answer, coverage | Method | TDR.3 back in scope or a fixed `Research answers` table (up to 32 rows) with Deploy V state words, and coverage as a field |
| CP-2 | Risk / support polarity on the transmission map | Method | An edge sign |
| CP-2 | Typed ledger on a real run | Proof | — |
| CP-2A | Break-point ladder on real runs | Method / Proof | T2DS.6 under a fixed heading and header, with the limit level as a number |
| CP-2D | Runway | Method | A runway field or monthly path |
| CP-2E | Ladder of several steps; foreign share | Method; Input | A step grid in T2F.5; currency shares in T2F.6 |
| CP-2G | Limit lines; per-year path | Method | Numeric limits with the model; T2H.6 path per case |
| CP-2H | Everything | Proof | — |
| CP-3 | Spread; yield on real runs; typed recommendation; peers | Method; Input | A spread column; market quotes; a typed recommendation field; peer levels |
| CP-3C, CP-3D, CP-4C | Everything; issuer curve; fulcrum | Proof; Method | Curve points; a stated fulcrum column |
| CP-4 | Headroom | Input | Executed credit agreement and indentures |

Also a reader change the methodology plan should weigh: real headings carry the id with an em
dash ("T2DS.1 — Scenarios") while `downsideView` / `breakPointView` / `macroView` match exact
titles, so on the retained real CP-2A and CP-2E output they find little. S4 keeps those readers
as they are (their behaviour tests pin them) and adds id-prefixed lookup only for the new
register reads.

## 5. Sub-agent plan

| Part | Model · effort | Why |
|---|---|---|
| Spec, shared parts, `read.ts` readers | Opus · high (me) | Reads handoff data; defines what every lead may draw |
| CP-2A, CP-2E, CP-2D, CP-2G leads and their test rewrites | Opus · high | Data readers with real fixtures, cases and units that must not regress |
| CP-3, CP-3C, CP-3D, CP-4, CP-4C leads | Opus · high | Market and legal states, blocked path |
| CP-1A, CP-DR, CP-2, CP-2H leads | Sonnet · high | Mostly lists, prose and gap tiles from the shared parts |
| Independent review of the whole diff | Opus · high, given the code only | Plan rule: one independent review before reporting |

## 6. Requests to the coordinator

1. **S2 / `Modules.tsx`**: once `leadFor(module)` is drawn, remove `moduleFigures`' direct
   `Downside`, `BreakPoints`, `MacroSensitivity` and `Securities` calls, or the page draws them
   twice. Their exports stay until then.
2. **S1 / `report/overview`**: S4 imports `figureSource`, `moduleSource`, `readCell`,
   `basisNotes` (`figureData.ts`), `headroomTests`, `bulletGeometry`, `forwardPath`,
   `pathGeometry` (`stressData.ts`), `periodSeries`, `lastTwo`, `gapReason`
   (`read.ts`) and `Key`, `GapPattern` (`figureParts.tsx`). Please keep these signatures, or say.
3. **S5**: S4 imports `forecastInput` (`ForecastRecord.tsx`).
4. **Kit**: a `blocked` tone on `Tile` (dashed warning edge) would replace the class S4 passes.
5. **Shared parts that now exist twice** (review nit, left for the coordinator because the other
   copy is frozen or owned by S1): `leads/bullet.tsx` re-implements the Overview's covenant bullet
   (`overview/StressRow.tsx` `TestRow` / `BulletChart`); `LeadFigure`'s notes list repeats
   `FigureNotes`; `cp3c.tsx` `BarLine` is close to the kit `BarCell` but needs a hatched gap mark
   and a signed track. A kit bullet row and a `BarCell` gap mark would let both pages share one.
7. **types.ts**: type the static `draws` on `Leads` (today `DrawingLead` in `leads/draws.ts`
   satisfies `FC<LeadProps>`; the frame reads `.draws`).
8. **Shared parts outside S4's files** the render check flags: the 28px (36px at 390) trace button
   (`PublishedSource`); the shell nav scroller (unnamed `ul`); 20px text links in the module
   navigator; the old page's native selects and generic charts still drawn by `Modules.tsx`.
6. **Reader titles**: the methodology plan should fix headings and headers for T2DS.4 / T2DS.6
   (CP-2A) and T2F.3–T2F.6 (CP-2E), or the existing exact-title readers keep missing real output
   (§4, last paragraph).

## 7. Verification

2026-11-24, on the branch head. All built against §2; nothing in §1 is left without a tile or
its stated gap.

**Checks run** (from `web/`): `npx tsc --noEmit` clean; `npx eslint --max-warnings=0` and
`npx prettier --check` on the 46 changed files clean; `npx vitest run src/pages/connected` 134
files, 2078 tests passed; `npm run unused` clean (it lists only `src/harness-leads.tsx`, the
untracked throwaway harness below, never committed); `npm run duplication` passes; `npm run build`
passes. **Not run**: `npm run gates` in full (the audit, script and file-gate steps are the
coordinator's at integration); the Python tests (no Python file changed:
`git diff --name-only 1265838..HEAD | grep -c '\.py$'` is 0); `tools/quality_gate.py` could not
run here (it diffs against `origin/main`, which this clone does not have) and has no Python change
to check.

**Real fixtures in tests** (TransDigm FY2024, as of 2024-09-30, outdated evidence, shape only):
CP-2E on both retained handoffs (`tests/fixtures/esg/CP-2E-h3.md`, `-h4.md`); CP-2A on both
retained T2DS.1 tables; CP-2G on the sol-high and the declined sol-medium forecast blocks; the
real blocked CP-4 shape as the review quotes it.

**Independent review** (Opus, given the code only): ten confirmed findings — blocked modules
missed when their reason named a source; the reason cut at "Inc."; source text reaching map,
event, bridge and bullet labels; a table view crash on an empty cell; a range drawn as a point;
negative share drivers shown raw; yields in two units on one axis; ledger rows dropped; status
detail cut; gap texts claiming what was not checked — plus nits. All fixed with a regression test
each (`leads/blocked.test.tsx` runs every lead through three blocked forms). A further defect the
fix exposed (two different source-naming nodes merging into one "In Evidence" node) is fixed and
tested. Duplication nits are request 5.

**Screenshots, looked at** (throwaway harnesses, not committed: an uncommitted patch to
`Modules.tsx` drawing `leadFor(module)` under the title on the synthetic Northbridge run, and a
stand-alone page rendering leads from contract-shaped samples and the retained real fixtures).
Every lead at 1440 and 390 px — 36 shots — has no console error and no horizontal page scroll.
What I saw and changed:

- CP-2D (synthetic): bridge 900 → +120 → −450 → 570 reads left to right; funding dates in date
  order with their precision; runway as a hatched gap. At 390 the first SVG version shrank labels
  to ~6 px: all row figures were rebuilt as HTML rows; a near-full bar's figure was clipped off
  the left edge at 390 (CP-4C, "00"): it now sits inside the bar.
- CP-1A / CP-2 / CP-DR (synthetic): maps as node lists with their edge type chips; revenue mix,
  question list, causal scenarios as hatched gaps with reasons; CP-2's leverage 2.80x from 3.75x,
  cover 4.00x from 3.20x, headroom 4.2x / 5.0x, 0.8x from CP-1 and CP-4.
- CP-2A (synthetic): ladder 10% / 15% / 32% on a 0–100% fall axis with the basis switch; small
  multiples with the control marked; net leverage listed as not drawn with the module's words. On
  the real T2DS.1 both tiles are gaps, no zero.
- CP-2E: synthetic two-step ladder with after-hedges ticks; on real h3 one stated step "+USD
  57.89 million", the issuer's ~USD 30 million and the gross comparator listed as text, hedged USD
  3,400 million against unhedged USD 5,789 million, gross as text, hedge terms table scrolling in
  its tile.
- CP-2G (synthetic): base and downside panels, highest 1.80x labelled, no limit line (stated);
  drivers table.
- CP-2H, CP-3D, CP-4C, blocked CP-4 (contract samples): agency groups with bullets and a Not
  supplied row; quoted yields on a date axis — instrument names collided and scaled with the tile
  at 1440, so points are numbered with a key list; value allocation per scenario with the fulcrum
  stated as a gap; blocked CP-4 badge, the reason once (it repeated "Not assessable"), the unlock
  line, both maps' own gap reasons.
- CP-3 (synthetic): instrument table with yield bars only on the two stated yields, spread Not
  supplied; at 390 the table broke words into fragments, now it scrolls inside its tile.
- CP-3C / CP-4 (synthetic): paired bars with the FY2027 commitment hatched and its reason; headroom
  bullets per test, minimum liquidity Not supplied with "Not stated".

Not seen: the leads inside S2's real module frame (not merged); a real run of CP-2D, CP-2H, CP-3C,
CP-3D, CP-4C (none exists).

### 7.1 After the first review (2026-11-25, base d097d0d merged in)

**Checks**: `npx tsc --noEmit` clean; eslint and prettier clean on changed files; `npx vitest run
src/pages/connected` 174 files, 2,722 tests pass; `npm run build` and `npm run duplication` pass;
`npm run unused` flags only `src/harness-leads.tsx` (the untracked harness) and exports in
`coverage/trendLayout.ts` and `runActivityParts.tsx` that came with the merged base.

**Rendered check** (`docs/design/preview/check-render.cjs`, widths 1440, 1280, 1024, 768, 390):
- Throwaway harness, every lead on its synthetic or contract sample, the retained real shapes
  (CP-2E h3 and h4, CP-2A T2DS.1, CP-2G sol-high block, CP-3 real recommendation table), an
  empty and a blocked handoff for each of the 13: 205 renders, no failures.
- Synthetic run module pages (10 leads, with an uncommitted `Modules.tsx` patch), plain and
  `--stress`: no sideways page scroll at any width. The failures are all in parts outside S4's
  files: the 28px trace button, the shell nav scroller, the frame's "Jump to section" select, the
  shared event-lane buttons, and the generic waterfall chart `Modules.tsx` still draws on CP-2D.

**Looked at**: contact sheets of every lead at 1440, 1024 and 390. Long dated lists were the
tallest tiles (CP-2E hedge dates, CP-1A issuer history): a lane now shows three rows and keeps the
rest behind a disclosure. Blocked leads draw nothing.

### 7.2 After the second review (2026-11-25, base with the S2 frame merged in)

**Checks**: `npx tsc --noEmit` clean; eslint and prettier clean on changed files; `npx vitest
run src/pages/connected` 196 files, 3,226 of 3,229 tests pass. The three failures are frame tests
outside S4's files: `ReportLibrary.frame.test.tsx` and `Modules.order.test.tsx` pin the frame's
own drawing of CP-2's transmission map, which the CP-2 lead now draws; `ReportContent.records.test.tsx`
shows a frame gap — with a lead that lists "figures", `moduleFrame`'s `typedTables: false` drops a
section's prose and its promoted table (CP-2A "Monitoring sensitivity flags") from both the page
and the records.

**Rendered check** in the real module frame on the synthetic run (10 leads, 1440/1280/1024/768/390,
plain and `--stress`): no sideways scroll; the only failures are on CP-3 and CP-4, in the frame's
own lanes (Instruments, Legal) and the shared 28px trace button. Harness (contract samples, real
TransDigm shapes, long-text variants of CP-1A, CP-2E, CP-3C, CP-4, empty, blocked, unreadable):
225 renders, no failures. `--stress` does not reach the harness, hence the long-text variants.

**Drawn once**: on the real page, Downside, Rates & hedging and Security selection each draw their
figures once, by the lead; the leads no longer repeat the module's passages, which the frame draws.

**Looked at**: every lead in the real frame at 1440 and 390. Left for local validation: CP-1A's
one-edge map leaves space beside a tall side column.

### 7.3 After the third review (2026-11-25)

**Content**: the downside shock's `rate_increase` is the contract's proportional cash-interest
increase, printed as a share ("cash-interest increase 10%"). A cell keeps its leading words only
when a link word (per, see, in, from, table, register, rows of) introduces the cited token and
nothing dangles; otherwise "In Evidence". A last trade the market level states as missing carries
that stated reason. A zero bridge step has no add or use tone; the liquidity legend keeps "Adds" /
"Uses", the value allocation names its falls "Allocated" and lists "Adds" only with a rise.

**Prose-only drawing sections**: a `Chart data:`, `Events:` or `Map:` section the module wrote as
prose with no table is the frame's to draw in the module's words. `statedInProse(entry, title)` in
`leads/read.ts` tells one; every lead draws nothing for such a title, and `chartsStartingWith` (hence
`OtherCharts`) leaves it out.

**Absent versus unread**: CP-2 draws no ledger gap where the frame draws the written "Strengths and
weaknesses" passage; CP-2E draws the foreign-share tile only with a currency register or a stated FX
limitation; CP-4 draws the baskets tile only where a T4C.5 register is written. The break-point axis
caption is "Fall in EBITDA"; the ticks show the range.
