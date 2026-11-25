# S5 · Forecast page: spec

Session S5 of `docs/superpowers/plans/2026-11-24-frontend-redesign.md`. Branch
`claude/redesign-s5-forecast`. Requirement: `docs/design/screen-map.md` § Report · Forecast;
look: `docs/design/mockups/2026-11-24/Forecast.dc.html`.

## What the data actually carries (read before the rows)

Checked on the synthetic Northbridge run (`/connected/snapshot`) and the retained TransDigm
fixtures (`tests/fixtures/tdg_sol_high_2026_11_13/`):

- **The published model's grid** (`model.cashflow`, written by `credit_os/cashflow.py`) carries a
  row per measure and a column per forecast year per case (`FY2025E`… with `group` Base case /
  Upside / Downside case / Downside (CP-2G drivers), planning start and end), plus history
  columns. Rows include `Net leverage (net debt / Adj EBITDA)`, `Interest coverage (Adj EBITDA /
  interest)`, `Distributions`, `Debt repayment`, `Accessible liquidity`, `Cash proxy (not issuer
  free cash flow)`. Each cell has `display`, `exact`, `status` (`value` or not) and `reason`.
  So the per-year leverage path the mockup drew as "not in handoff" **is published by the model**
  wherever the model computed it; the screen map's "Method: per-year path per case" is met for
  every run whose CP-2G inputs block validates. Where a cell is not a value it is the gap cell.
- **The CP-2G handoff** carries the bottom line (`Bottom line` passage) and the forecast inputs
  block (`cpos-forecast-inputs/1`: `base_drivers`, `upside_drivers`, `downside_drivers`,
  `downside_shock`, `years`, `scope_limits`).
- **Limits** are CP-4's `Chart data: covenant headroom` table (test, threshold, current, unit).
- **The maturity wall** is CP-1's `Chart data: debt maturities` table.
- **Point-in-time stress** is CP-2A's scenario and stressed-metrics tables.
- **Shortfall at the wall** is written by no module as a figure. It is drawn as the gap state.
  The page does not subtract liquidity from the wall (that would be new analysis).

Delivery adds no analysis: every number drawn is a cell as published. Choosing the largest or
smallest of a case's published cells (peak, minimum) and the last one (end) is selection of a
published value, not a calculation; the cell's own display text is drawn.

## 1. Screen-map rows covered

| Rank | What to show | How | Where | Needs |
|---|---|---|---|---|
| P1 | The forward view in one sentence | Bottom line in the header tile, with the case switch | Top | Code |
| P1 | Net leverage path by case against the limits and the maturity wall | Line per case on a fiscal-year axis; limits dashed; the wall marked on the axis; peak labelled | Lead tile, 8 columns | Method: per-year path per case |
| P2 | Peak leverage and year, end leverage, minimum cover, shortfall at the wall | Stats strip | Under the header | Code |
| P2 | What breaks, and when | Shortfall as a share of the wall; stress cases as small multiples | Beside the lead tile, 4 columns | Code |
| P2 | Assumptions by case | Three-column table; cells that differ from base tinted | Under the lead | Code |
| P3 | Uses of cash by year | Stacked column: dividends, repayments | Beside assumptions | Code |
| P3 | The yearly grid | Rows by measure, columns by year; given cells filled, others the gap cell | Lower | Method: the model writes drivers and selected points only |
| P3 | Scope and limits; the published model and its calculation download | List; one control | Bottom | Code |

Plus, from "On every screen": basis label once per tile, one trace control per figure/row, the
gap state in place, blocked state for a module that did not run.

## 2. Blocks

Page grid: `Bento` (12 columns from `lg`, one column below, 16 px gap). Order on the page is the
order below; at 390 px every tile is full width in the same order.

### 2.1 Header tile — `ForecastHeader` (new, `report/ForecastHeader.tsx`)

- `Tile span={12} label="Forecast"`. Title row: h2 "Forecast", a quiet line with the issuer and
  "Test preview" in preview; right: the **case switch** = `Segmented label="Case"` (buttons,
  `aria-pressed`), one segment per case from `forecastCaseOptions(model)` in the model's one
  naming. A case with no net leverage value in any period gets a hatched swatch and the caption
  "Hatched: no leverage path in the model". Only drawn with two or more cases.
- **Bottom line**: kicker "Bottom line", then CP-2G's bottom line (`bottomLine(entry)` from
  `report/overview/read.ts`) in lead type (24/32 at 1440, 18/28 at 390), with one
  `PublishedSource` to its line. A paragraph that cites a source by name is not drawn: "The
  forward view cites its sources; read it in Evidence" with the trace. CP-2G not run or blocked:
  `GapNote` with `moduleSource`'s reason.
- **Basis line** (`dl`): Basis (the model's earnings basis: the grid row label in parentheses of
  `Adj EBITDA (…)` when present, else "Not recorded"); Units (`unitLabel(cashflow.units)` or
  "Units not recorded"); Years (the selected case's first and last published period with planning
  dates); Module (Forward model and its state badge text). "Open module" link to
  `#modules/CP-2G`; "Forecast evidence and artifacts" link to `#evidence/summary` (kept).
- States: no model → this tile only, with "No forecast model was published for this run." and,
  where CP-2G did not run or is blocked, its reason; model without a matched inputs record → the
  existing sentence "The model could not be matched to a single readable record of its inputs…"
  as a `GapNote` inside the tile.

### 2.2 Stats strip — `ForecastStats` (new, `report/ForecastStats.tsx`)

`StatsStrip label="Forecast figures"` with four stats for the selected case, each from the model
grid (`forecastMeasure`, §2.9):

| Stat | Value | Sub-line | Gap |
|---|---|---|---|
| Peak net leverage | display of the largest value cell | its period · case | "Not published for <case>" |
| Net leverage, <last period> | display of the last period's cell | "from <first period's display> in <first period>" when both differ | as above |
| Minimum interest cover | display of the smallest value cell | its period · case | as above |
| Shortfall at the maturity wall | — | — | always the gap: "No module states a shortfall figure" |

Each stat has a trace (`source("…", { row, case, periods })`). Basis line under the strip: "<case>
· <basis> · <units>".

### 2.3 Lead tile — `LeveragePath` (new, `visuals/ForecastPath.tsx`)

`Tile span={8} label="Net leverage path"`, kicker = basis line, title = the reading: "Net
leverage by case, <first>–<last>" (no claim not in the data).

- Data: `leveragePath(model, view)` returns cases (raw group, name, points by period), axis
  years, limits, wall, the comparison analysis.
- Periods: forecast columns go through `analyzeScenarioPeriods` exactly as the cash proxy
  comparison does (ambiguous and incompatible periods left out and named with
  `scenarioComparisonNotice`; with several cases and no shared period, only the selected case is
  drawn and the notice says no comparison is drawn). The latest actual fiscal year
  (`FY\d{4}` history column with a value) is drawn as a neutral "Actual" point.
- Axis: a true fiscal-year axis: one slot per year from the first to the last drawn year,
  extended to the maturity-wall year when it is at most three years past the last period.
- Lines: one per case, joined only between consecutive years where both cells are values. The
  selected case is emphasised (series 1, 2.5 px, end and peak labelled with the cell display); the
  others are thinner (series 2, 5, 6) and direct-labelled at their last point. A year on the axis
  where the selected case has no value is a hatched column labelled "Not published" (no column)
  or "Not calculated" (cell not a value); never joined across.
- Limits: CP-4 headroom tests whose unit is `x` and label names leverage, threshold numeric:
  dashed orange line with "<threshold>x <test>" and the CP-4 state word ("not tested" when CP-4
  is blocked is impossible: a blocked CP-4 has no table, so its reason is listed instead). None:
  the legend says "No leverage limit is stated by Legal & covenants" or that module's blocked
  reason.
- Wall: CP-1 maturity schedule rows with an `FY\d{4}` label placed by fiscal year on the same
  axis in a lane under the plot (navy bars, exact cell text); the largest dated amount is the wall:
  a navy vertical rule with "<year> maturity wall". A `Not supplied` row is a small hatched mark
  with its reason in the notes. Rows beyond the axis are listed in the notes ("Beyond this axis:
  FY2031 1,250"). No schedule: lane replaced by a one-line gap with the reason.
- Table view: `Segmented label="Net leverage view"` Chart | Table. Table: period rows × case
  columns, cells = display, "Not published", or the cell's reason.
- Width: measured with a ResizeObserver (`useMeasuredWidth`, in the file); geometry is recomputed
  for the width, so text stays 11–13 px at 390 px.
- States: model has no net leverage row or no value → `GapNote` "The model publishes no net
  leverage figure" (tile kept at rank, not hidden).

### 2.4 What breaks, and when — `WhatBreaks` (new, `report/ForecastBreaks.tsx`)

`Tile span={4} label="What breaks, and when"`.

- (a) **Liquidity against the wall**: the selected case's `Accessible liquidity` in the last
  forecast year at or before the wall year, and the wall amount, on one proportional bar (both
  published cells, no difference computed or printed). Caption states both periods. The shortfall
  itself: `GapNote` "No module states a shortfall figure at the wall". No wall or no liquidity
  cell: gap with the reason.
- (b) **Point-in-time stress** from CP-2A: `downsidePanels(entry)` (Overview data function) drawn
  as small multiples on one scale per measure, one row per scenario; scenario assumptions listed
  under. CP-2A absent or blocked: `GapNote` with `moduleSource`'s reason.

### 2.5 Assumptions by case — `AssumptionsByCase` (new, `report/ForecastAssumptions.tsx`)

`Tile span={7}`. Table: Driver | Base | each other case group in the inputs (Upside,
Downside) | Trace. Rows: the drivers named in any of `base_drivers`, `upside_drivers`,
`downside_drivers`, plus the downside shock (EBITDA decline, cash-interest increase) as two rows.
Cell: the recorded values by planning year, formatted as recorded (fractions as % with two
decimals, amounts as written, joined with " · "). A driver a case does not state reads "Not
stated" (never "As base": the page does not infer inheritance; the scope limit that says so is
in Scope and limits). A cell whose values differ from the base cell is tinted
(`bg-warning-fill`) **and** carries a visible "differs" mark with sr text "differs from base".
Header row names the planning years once. The full recorded record (rationale, limitation,
facilities: the existing `RecordedForecastAssumptions`) sits behind one disclosure "Recorded
drivers, rationale and limitations" under the table. No inputs record: `GapNote` with the
existing sentence.

### 2.6 Uses of cash — `UsesOfCash` (new, in `report/ForecastAssumptions.tsx`'s sibling `report/ForecastCash.tsx`)

`Tile span={5}`. Stacked column per forecast year of the selected case: `Distributions` (series
2, bottom), `Debt repayment` (series 1, top), heights exact, each segment labelled with its cell
display; no totals printed. A year where either cell is not a value: that segment is a hatched
stub with "n.a." and the reason in the notes. Table view toggle as in §2.3. Neither row: gap.

### 2.7 The yearly grid — `ForecastStatement` (kept, restyled)

`Tile span={8} label="Forecast grid"`. The existing `ForecastStatement` (statement lines
Accounts / Ratios / Growth, Selected case / Compare one period / History, `ForecastTable` with
"n.a." / "n.m." gap cells, empty columns behind a disclosure) inside the tile, with its old
dark top rule and card chrome removed. Line-item trends (`ForecastTrends`) move behind one
disclosure under the grid, as today.

### 2.8 Scope and limits; published model — `ForecastScopeTile` (new, `report/ForecastScopeTile.tsx`)

`Tile span={4}` stack of two tiles:

- **Scope and limits**: `ForecastScope`'s promoted base-case qualifications and limits as a list
  (each with its trace), then "Full model notes and limitations" → `#evidence/record` (kept), then
  the basis note (`BasisNote`, the cash-proxy bridge, kept).
- **Published model**: the model choice (`PublishedModelSelect`, kept, only with two or more
  models) and **Download calculation**: the run's `Calculation JSON` from
  `/connected/artifacts/<folder>` (the file whose delivery matches the selected model), using the
  existing `DownloadButton`; loading and unavailable states in words.

### 2.9 Cash proxy by case (kept behaviour, new tile)

`Tile span={12} label="Cash proxy by case"`, P3, under the grid. The case figures that were the
radio cards (name, latest value, period and dates, description, reason, trace) become a compact
list (`dl`), and the existing unified `CashProxy` comparison (chart + table + notices) sits beside
it. Every notice, name, value and trace of the old cards and comparison is kept.

### 2.10 Run charts (kept)

`RunCharts` stays last, id `forecast-run-charts` (the `#forecast/run-charts` deep link focuses it).

### 2.11 Data functions (new, `report/forecastData.ts`)

- `forecastMeasure(model, pattern)`: per case (raw group, one naming), the cells of the one row
  matching `pattern` in the forecast columns (main grid, then `other`), keyed by period, with
  display / value / reason / published; plus the `analyzeScenarioPeriods` result. Never
  interpolates; an absent column is `published: false`.
- `peakOf`, `troughOf`, `endOf`: selection over value cells (ties: earliest period).
- `leverageLimits(view)`, `maturityWall(view)`, `fiscalYear(label)`.
- `driverTable(document)` for §2.5.

## 3. Files

| Action | File |
|---|---|
| Rewrite | `report/Forecast.tsx` (page assembly on `Bento`; keeps `Forecast` export and props) |
| Add | `report/ForecastHeader.tsx`, `report/ForecastStats.tsx`, `report/ForecastBreaks.tsx`, `report/ForecastAssumptions.tsx`, `report/ForecastCash.tsx`, `report/ForecastScopeTile.tsx`, `report/forecastData.ts`, `visuals/ForecastPath.tsx` |
| Change | `visuals/LegacyForecast.tsx` (`ForecastScope` renders a list without its old details card; `CashProxy` card chrome; exports unchanged), `visuals/ForecastStatement.tsx` (chrome only), `report/ForecastRecord.tsx` (no behaviour change; `RecordedForecastAssumptions` chrome), `report/RunCharts.tsx` (heading level, chrome) |
| Keep | `visuals/ForecastTable.tsx`, `visuals/scenarioPeriods.ts` (no change expected) |
| Delete | `ForecastNavigation` and `forecastSections` in `Forecast.tsx` (the "On this page" jumps; the tiles replace them) |

Signatures kept: `gridOf`, `forecastCaseNames`, `forecastCaseOptions`, `cashProxyCases`,
`CashProxy`, `ForecastScope`, `ForecastTrends`, `LegacyForecast`, `forecastHandoff`,
`forecastInput`, `forecastTraceContext`, `RecordedForecastAssumptions`,
`RecordedModelQualifications`, `ForecastStatement`, `ForecastTable`, all of `scenarioPeriods`.
The Overview reads only `gridOf` (`report/overview/stressData.ts`); Evidence reads
`forecastHandoff` and `RecordedModelQualifications`.

Tests to add (written before each block): `Forecast.layout.test.tsx` (tile order and spans, one
accessible name per region, no source reference on the page), `ForecastHeader.test.tsx`,
`ForecastStats.test.tsx`, `ForecastPath.test.tsx` (gap column never joined, not-published vs
not-calculated, limits, wall, peak label, table view, notices), `ForecastBreaks.test.tsx`,
`ForecastAssumptions.test.tsx` (differs tint + word, Not stated, shock rows),
`ForecastCash.test.tsx`, `forecastData.test.ts` (independent expected values, missing ≠ zero).

Tests to rewrite (layout only): the case radio cards → `Case` segmented buttons and the case list
(`Forecast.cases`, `Forecast.recovery`, `Forecast.basis`, `Forecast.periods`); the "On this page"
jumps (`Forecast.test.tsx` two tests) → tiles present only when their content is; class-name pins
on the old `card` chrome. Every value, period, case name, notice and trace assertion is kept.

## 4. Drawn as a gap today

| Item | Why | Needs |
|---|---|---|
| Shortfall at the wall (stat and §2.4 a) | No module writes it as a figure; computing wall − liquidity is analysis | Method (CP-2D or CP-3C typed shortfall) |
| Limits when CP-4 is blocked (TDG) | No executed documents | Input |
| Leverage path where CP-2G inputs did not validate | No model grid | Method/Proof per run |
| Wall when CP-1 has no maturity schedule | Not supplied | Input |
| Lite pathway | CP-2G does not run; the page shows the header tile's gap only | — (by design) |

## 5. Sub-agent plan

| Part | Model · effort | Why |
|---|---|---|
| `forecastData.ts` + its tests; `ForecastPath.tsx` | Opus · high (me) | Reads model cells and period logic; the regression risk |
| Page assembly, header, stats, test rewrites of cases/periods | Opus · high (me) | Behaviour tests must survive |
| `ForecastAssumptions.tsx`, `ForecastCash.tsx`, `ForecastBreaks.tsx` + tests | Sonnet · high sub-agent, from this spec | Presentational over typed inputs |
| Chrome changes in `LegacyForecast`, `ForecastStatement`, `RunCharts`; lint/format fixes | Haiku or Sonnet · medium | Mechanical |
| Independent review of the diff | Sonnet · high, given the code and the rules, not my conclusions | Rule: one review before done |

## 6. Requests to the coordinator

1. The page imports S1's data functions `bottomLine`, `entryOf` (`overview/read.ts`),
   `moduleSource`, `figureSource` (`overview/figureData.ts`), `downsidePanels`, `headroomTests`
   (`overview/stressData.ts`) and `wallSlots` (`overview/structureData.ts`). Please keep their
   signatures in S1 or tell me.
2. No token or kit change needed. If the kit gains a chart/table toggle, I will switch to it.
3. The screen map's "Needs: Method" on the P1 path is met by the model grid for runs whose
   inputs block validates (§ What the data carries); consider updating the map's Needs column.

## 7. Verification

Scope: synthetic Northbridge run `20261124-222149-01` (Full pathway, `proof.serve`, no provider
call) and unit tests on retained fixtures, including the real TransDigm CP-2G inputs block
(outdated evidence, FY2024, shape only). Not a live run.

### Built against each screen-map row

| Rank | Row | Built | State on the synthetic run |
|---|---|---|---|
| P1 | Forward view in one sentence, case switch | `ForecastHeader`: CP-2G bottom line with trace; `Segmented` "Case" | "The synthetic issuer shows one observed item."; Base case / Downside shock |
| P1 | Net leverage path by case vs limits and wall | `LeveragePath` (`visuals/ForecastPath.tsx`) | Base 1.23x → 0.29x labelled peak and end; Downside thinner; CP-4 5.0x limit dashed; FY2028 maturity wall (1,250) on the axis; FY2027 schedule gap hatched in the lane with its reason |
| P2 | Peak, end, min cover, shortfall | `ForecastStats` on `StatsStrip` | 1.23x FY2025E; 0.29x FY2027E from 1.23x; 8.75x FY2025E; shortfall gap "No module states a shortfall figure" |
| P2 | What breaks, and when | `WhatBreaks` | Accessible liquidity FY2027E 397 beside 1,250 due FY2028, not on one scale (units differ: model's not recorded vs US$m), shortfall gap; CP-2A stress small multiples (three measures × three scenarios) with gaps and qualifications listed |
| P2 | Assumptions by case | `AssumptionsByCase` | Base and Downside drivers columns; shock rows tinted with ≠ and "differs from base"; "Not stated" for unstated drivers; full record behind a disclosure |
| P3 | Uses of cash | `UsesOfCash` | Stacked 20 / 50 per year, no totals; table view |
| P3 | Yearly grid | `ForecastStatement` in "Forecast grid" tile | n.a. / n.m. gap cells; unavailable rows behind their disclosure |
| P3 | Scope, limits, published model, calculation download | `ForecastScopeTiles` | Base-case qualification, scope disclosure, "Download calculation" → the run's Calculation JSON |
| — | Cash proxy by case (kept behaviour) | `CaseFigures` + `CashProxy` | 172.46 / 97.47, FY2027E with dates, comparison chart and table |
| — | Run charts (kept) | `RunCharts` behind "Charts from the other modules of this run"; open on `#forecast/run-charts` | — |

### Screenshots looked at

- 1440 px, full page: header, strip, lead + what breaks, assumptions + uses of cash, grid +
  scope/model, cash proxy, run charts in that order. Fixed after looking: limit label collided
  with the wall label (limits now left-aligned); the lead tile had dead space beside the tall
  stress tile (plot is taller at ≥ 700 px); stress values wrapped (leading figure in the bar,
  the bracketed qualification listed in full under it); the old dark selected-button override
  on the grid's controls removed; the generic run-chart cards moved behind a disclosure.
- 390 px, full page: every tile full width in the same order; case switch wraps under the
  title; axis labels shorten to `FY25E` (table view keeps exact labels); no horizontal page
  scroll (main scrollWidth 390 = clientWidth, measured after the last change); the wide
  statement and assumptions tables and the uses-of-cash chart scroll inside their own focusable
  regions. Fixed after looking: the assumptions table squeezed its values a word per line (now a
  minimum width inside its region); the uses-of-cash labels shrank to about 5 px (the chart keeps
  a minimum width and scrolls); the "differs from base" screen-reader spans, absolutely
  positioned, escaped the scroll region and widened the page to 533 px (regions are positioned).
- No-forecast state, 1440 and 390 px: the Full run's snapshot served with `models` emptied
  (Playwright route), because the synthetic engine's Lite run `20261124-225415-01` ended as
  failed with no reason recorded and published no report. Header tile with the bottom line and
  the gap "No forecast model was published for this run.", then the run-charts disclosure only.
  On a real Lite run CP-2G is absent: the bottom line reads "Forward credit model did not run in
  this run." and there is no "Open module" link (tested).

### Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npx eslint --max-warnings=0` and `npx prettier --check` on the 24 changed files | pass |
| `npx vitest run src/pages/connected/report src/pages/connected/visuals src/components/kit src/styles src/pages/connected/ReportLibrary*` | pass (88 files, 970 tests) |
| `npm run unused` | one finding, `LeadProps` in `report/leads/types.ts` (frozen, not changed here) |
| `npm run build` | pass |
| Not run | the full web gate (`npm run gates`), Python tests that read the web build, the weekly full suite; the quality gate's Python part (no Python changed) |

### Independent review

One Sonnet reviewer was given the diff and the rules, not my conclusions. Confirmed and fixed:
a selected case with no row for a measure showed the first case's figures under its name (stats,
lead, uses of cash, liquidity); periods left out of the comparison (dates differing between
cases) were still plotted and could become the peak; the wall appeared in the legend and the
chart's reading when beyond the axis; other cases told apart by colour only (now dashed too);
a driver key that is also a shock key made two rows with one React key and hid a value; empty
inputs drew a header-only table; liquidity and a far wall shared one scale; float tick labels;
the case list and its wrapper shared one accessible name; a calculation-listing failure showed
the raw error. Each has a test. Not changed: a grid with two rows matching one measure is skipped
for that measure without a notice (rare; listed for the coordinator); the retired section-jump
focus behaviour is no longer tested (the jumps were removed by the mockup).

### Tests

Added: `forecastData.test.ts` (incl. the TransDigm block), `ForecastPath.test.tsx`,
`ForecastHeader.test.tsx`, `ForecastBreaks.test.tsx`, `ForecastAssumptions.test.tsx`,
`ForecastCash.test.tsx`, `ForecastScopeTile.test.tsx`, `Forecast.layout.test.tsx`.
Rewritten (layout only; every value, period, case name, notice and trace assertion kept):
radio-card queries → the `Case` buttons and the `Forecast cases` list in `Forecast.basis`,
`Forecast.cases`, `Forecast.periods`, `Forecast.recovery`, `LegacyForecast`; the two section-jump
tests in `Forecast.test.tsx` → tile presence and the run-charts deep link; the Forecast marker in
`ReportLibrary.design.test.tsx` ("Forecast assumptions" → "Assumptions by case"; outside S5's
files, a one-word marker the old label pinned).

### Round 2 (coordinator review of fb11c05, 21 items)

Fixed on this branch, tests first; report sent to the coordinator item by item. Renders looked
at, at 390, 1024, 1280 and 1440, on the synthetic run and on transformed snapshots (Playwright
route; synthetic, not a real run): the real run; three cases + a mid-path highest year + an n.a.
cell + two net-leverage rows + a case year excluded from the comparison + a liquidity funding gap;
a missing year + no covenant or maturity tables; no model. No horizontal page scroll at any width
(main scrollWidth = clientWidth), no console errors.

Design changes from section 2: no covenant levels on the path (item 4) and no single "maturity
wall" (item 2); "What breaks" shows the funding gap, the liquidity path, the maturity schedule,
the covenant tests and the stress each as stated; the grid is one flat table (ForecastGrid.tsx)
with Selected case / All cases / Compare one year / History; the case list and the cash proxy
chart are removed (the selected case's cash proxy is under the case switch and a grid row); the
run charts are a list of chart tables; the grid spans 12 columns with scope and model under it.

Checks: tsc, eslint --max-warnings=0, prettier on every changed file; vitest on
src/pages/connected, components/kit, styles: 2,067 tests, one timing failure under load in
report.auditFollowups (passes alone); npm run build; npm run unused: only LeadProps (frozen).
Not run: npm run gates, the Python tests that read the web build.

### Round 3 (coordinator review of bb4dbe2: R1–R14 content, W1–W9 design)

Fixed on this branch, tests first, at d59d78f, 510eceb, 710febc, cba2e1c and e95d8dc. Page
length at 1440 on the real run, everything in its default state: 4,460px (was 7,017; base
6,308; mockup 2,987); at 390, 9,974px (was 11,420; base 9,227).

Layout changes from round 2: the lead, assumptions, scope and published model sit in a 12-column
grid of their own, with what breaks and uses of cash in the right column spanning four rows;
its last row is flexible, so the left tiles stack without bands. The page reads in the same
order at every width. The forecast grid follows at full width, then the chart tables in two or
three columns. The page opens on the case whose raw group is "Base case". The base page opened
on `caseOptions[0]`, where groups not in `caseLabels` sorted first.

Render check (docs/design/preview/check-render.cjs from ead118f, copied to the scratchpad and not
committed) at 1440/1280/1024/768/390, plain, `--stress`, and `--fixture` (three cases with a long
case name; the hard set; no model):
- Plain, stress, long and hard: 37 findings each. 30 are trace controls inside the closed
  "Recorded drivers" disclosure. The check counts closed `<details>` content as shown; with
  every disclosure open and no 15,000px cap, none of these fails. The rest is shared code: the
  breadcrumb "Library" (20px tall), "Run progress" (40px at 390) and the shell's Areas list
  (an unnamed scroll box at 390).
- No model: 1 finding, the shell's Areas list.
- No chart label overlaps or leaves its figure. No text is under 12px, no text is cut, there is
  no sideways page scroll and there are no console errors.

A copy of the check that skips closed disclosures and scrolls each control into its own scroll
box reports only the shared items.

PNGs were looked at at every width: the case switch stacked at 390 with a long name, the lead
chart's labels, the stress names, the grid and the chart tables.

Checks:
- tsc, eslint --max-warnings=0 and prettier on every changed file.
- vitest on report and visuals (1,001 tests), and on connected and library (3,097 tests).
- npm run build. npm run unused: only LeadProps, which is frozen.
- On a merge with origin/claude/redesign-s1-overview (117d748): tsc is clean and 296 Forecast
  tests pass.
- Not run: npm run gates, and the Python tests that read the web build.
