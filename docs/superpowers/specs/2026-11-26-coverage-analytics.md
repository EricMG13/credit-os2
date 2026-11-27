# Coverage analytics: a dense monitor and four lenses over one cohort

Plan critique (2026-11-26, `mx-autonomous` standing in for `mx-advisor`): three High and six
Medium findings, all applied in this version.

Date: 2026-11-26. Status: approved by the owner for planning ("approved otherwise", 2026-11-26,
with the Monitor cell simplified as below). Rests on the ruling
`docs/rulings/2026-11-26-coverage-analytics.md` (owner approved 2026-11-26, amended with the
owner's answers of 2026-11-27).
Desktop only. Module codes below are this document's references; the interface draws names.

## Why

Coverage on `main` answers "what did each run deliver" (the issuer × module map) and offers Rank,
Trend, Filters and Groups on one field at a time. The owner wants it "more data, analytics and
visually rich", with "several types of analysis, such as RV analysis", without repeating the
Library. The Library is one issuer in depth. Coverage is many issuers side by side. Each lens
below answers one cross-issuer question the Library cannot.

## Reader

A portfolio manager or credit committee member scanning 10 to 50 issuers. They want the outlier,
then the report behind it. They have not read the sources. They do not want a second issuer
report, a table of everything, or a figure they cannot trace.

## Goals, non-goals, anti-goals

- Goals: see a cohort on one measure at a glance; spot the outlier; open its run in one click;
  always know how many issuers the picture covers and why the others are missing.
- Non-goals: holdings exposure, live market data, a command bar, draggable panes, a separate
  Terminal, phone layouts, a new parser, any write to the service.
- Anti-goals: a chart that looks comparable and is not; a computed figure passed off as a
  module's; a judgement word (cheap, improving) the module did not write; a page that repeats a
  Library page.

## Approaches considered

1. **Lenses on the existing page (chosen).** Tabs on `/coverage` over the reply it already gets,
   charts from the installed `recharts`, tables from the vendored Untitled UI table. No new
   dependency, no new service route unless a lens needs a field the reply lacks.
2. A linked multi-pane "desk" (Gloomberb, OpenTerminal, React Grid Layout). Rejected: saved
   layouts and pane linking solve a problem no reader has reported, and add a dependency.
3. An external host (FINOS Workspace, Rill). Rejected: a second application to run and secure;
   FINOS Workspace is an alpha created 2026-09-25; Rill's team workflow is its cloud.

## Prior art (checked 2026-11-26)

| Candidate | Licence | Decision |
|---|---|---|
| `main` Coverage (`web/src/pages/connected/Coverage.tsx`, `coverageData.ts`) | own | Reuse: cohort, rank, trend, groups, facts |
| Valuation score method (`2026-11-25-deliverables-and-recommendations.md`) | own | Reuse its bucket and median for spreads; draw no score |
| `recharts` (installed) | MIT | Reuse for every chart |
| Untitled UI table (vendored) | MIT | Reuse for every table |
| TanStack Table | MIT | Not now: add only if pinned columns or row virtualisation prove necessary, with a decision record |
| FinceptTerminal | AGPL-3.0 | Ideas only (watchlist columns grouped by purpose); no code |
| Gloomberb, OpenTerminal, React Grid Layout | MIT | Not used (approach 2) |
| FINOS Workspace, Rill | Apache-2.0 | Not used (approach 3) |
| QuantLib | BSD-style | Not used: bond arithmetic belongs to Market-implied risk |

Searches: this repo (`coverage`, `rank`, `trend`); public GitHub `bond relative value dashboard`,
`credit portfolio analytics dashboard react`, `debt maturity wall chart` (no results returned);
the eight projects the owner's Codex thread named, licences read from each repository.

## What the examples do that the first draft did not (owner, 2026-11-26)

Owner on the first mockup: "should be more data dense and analytics & trend & pattern focused.
review the examples repo and projects i provided vs your suggestion." Read again 2026-11-26:
Rill's dashboard guide, Gloom's function catalogue, the OpenTerminal and FinceptTerminal READMEs.

| Example pattern | Where it is | First draft | This version |
|---|---|---|---|
| Leaderboard with several measures side by side, each with a comparison delta | Rill (multiple measures, time comparison) | One measure per screen | **Monitor grid**: every measure in one row per issuer |
| Sparklines in table cells | Gloom quote monitor, OpenTerminal crypto board | None | A sparkline in every measure cell |
| Columns grouped by purpose | FinceptTerminal watchlist | Flat columns | Leverage, Cover, Liquidity, Scale, Refinancing, Covenants |
| Dimension × time heat grid, pivot | Rill (time dimension detail, pivot) | A matrix of bars for one measure | **Heat grids**: issuer × period and issuer × measure |
| Market heatmap | Gloom, OpenTerminal treemap | None | Cohort-position heat in the grid (quartile bands) |
| Strength against momentum quadrant | Gloom relative rotation | None | **Level against difference** quadrant with the cohort medians as cross-hairs |
| Fundamentals across tickers; relationship graph | Gloom | One line chart | Two-measure scatter; cohort band over time |
| Covenant headroom screen; debt due by year | Gloom | Present, sparse | Kept, made dense (all tests in one table; issuer × year heat grid) |
| Screener sortable on every column | OpenTerminal, Gloom | Existing filters only | Every grid column sorts; existing filters feed all tabs |
| Dense rows, mono numerals, keyboard movement | all three terminals | 20 px tiles, 44 px rows | 28 px rows, 12 px tile padding, arrow keys move the selection |

Still not taken: linked panes and saved layouts, a command bar, an external host, dark theme
(DESIGN.md is light only), live quotes. Not possible under the ruling as approved, and worth a
further ruling if wanted: percentage growth and indexed-to-100 comparison (the ruling bars a
percentage change), correlation and regression (barred), z-scores (a score).

## The page

`/coverage` keeps its rail item and its cohort controls (filters, saved groups). A **cohort bar**
under the header states the cohort once for every tab: name, issuer count, as-of range of the
newest runs, and "N of M issuers in this picture" for the tab in view, opening the list of those
left out with reasons. Six tabs. The existing Rank and Trend views are absorbed by Monitor and
Patterns.

| Tab | Question | Typed fields it reads today (module by name) | Buildable now |
|---|---|---|---|
| Monitor | Where does every issuer stand on every measure, and which way is each moving? | Financial foundation: total debt / EBITDA, net debt / EBITDA, EBITDA / cash interest, cash, undrawn committed facilities, revenue, adjusted EBITDA. Refinancing & LME: debt maturing. Legal & covenants: threshold, current | yes |
| Patterns | Which issuers move together, and which stand apart? | the same period series; Peer benchmark: peer low, median, high, count | yes |
| Refinancing | When is the cliff, and whose is it? | Refinancing & LME: debt maturing, committed resources. Financial foundation: debt maturing | yes, by period as written |
| Headroom | How much room does each issuer have against its own limits? | Legal & covenants and Ratings & triggers: threshold, current | covenants and triggers yes; downside no |
| Market | Where do the issuer's bonds sit by yield and maturity? | Market-implied risk: yield against maturity | gap state |
| Delivery map | What did each run deliver? | all | built; unchanged |

Field ids were worked out from `react_frontend/coverage.py` and `credit_os/handoff_fields.py` by
the plan critique, not from a run of the reply; build step 1 confirms them.

Density rules for every tab: table rows 28 px, tile padding 12 px, 8 px gaps, figures in Geist
Mono 12 px, no tile taller than it needs. A 1440 × 900 screen shows the whole Monitor grid for 12
issuers with no scroll. Selecting an issuer anywhere selects it on every tab; arrow keys move the
selection in a grid. Every row ends in "Open run". Every figure has a table view and one trace
control. Computed figures carry the word "computed" once per column or figure, not per cell. No
tab draws a module's call.

### Monitor (the default tab)

- **Stat strip**, divided by hairlines, one cell per measure: the cohort median for the chosen
  period (rule 2), the count that qualified, and a small band-over-time figure (median line,
  quartile band) across the periods where three or more issuers qualify.
- **The grid.** One row per issuer, columns grouped by purpose: Leverage (total debt / EBITDA,
  net debt / EBITDA), Cover (EBITDA / cash interest), Liquidity (cash, undrawn committed
  facilities), Scale (revenue, adjusted EBITDA), Refinancing (debt maturing in the next stated
  period), Covenants (tightest test: level, limit, headroom). Each measure cell holds two things only: the figure as written and a sparkline of the
  module's own periods (owner, 2026-11-26: "monitor table has too much information visually in a
  small cells"). The cell's tint is the third channel: position in the cohort or the difference,
  by the switch. The signed difference and the quartile position as numbers are not in the cell:
  they are in the **selected-issuer strip** under the grid, one cell per measure (figure, period,
  difference from the prior period, quartile band, cohort median), and in the cell's tooltip. A
  cell that did not qualify shows the figure, no tint and a small mark. A missing figure is a hatched cell.
- Colour follows DESIGN.md "Colour as signal" (owner, 2026-11-26): position tint is sequential
  blue by quartile band; the difference tint is green for better and red-orange for worse where
  DESIGN.md gives the measure a direction, and grey with its glyph where it gives none; the sparkline's end mark takes the colour of its last difference; issuer marks and
  lines in figures take their sector's category colour. Coverage never
  decides a direction itself: it reads the ruled table. A toggle switches
  the grid tint between position and difference.
- Every column sorts. Sorting by a covenant column is refused with the reason (rows of a row
  table are not ranked across issuers); the column still shows each issuer's own tightest test.
- Sources: Untitled UI table (dense size); shadcnblocks Chart Group 7 (stats row with chart
  below) for the strip.

### Patterns

Four figures on one screen, all on the measure and period chosen once at the top.

- **Level against difference.** One mark per issuer: the figure on the x axis, its difference
  from the prior period on the y axis, the cohort medians of each as cross-hairs (rules 1 and 2).
  Quadrants are not named. Source: shadcnblocks Chart Card 23 (scatter).
- **Two measures.** One mark per issuer on two written measures of the same period (for example
  net debt / EBITDA against EBITDA / cash interest). No fitted line.
- **Cohort band over time.** Median line and quartile band per period (rule 2), every issuer a
  faint line, the selected one in the accent; beside it, where Peer benchmark wrote the selected
  issuer's peer low, median and high, those as written, labelled as that module's peer set.
  Source: shadcnblocks Chart Card 14 (range area).
- **Difference heat grid.** Issuers in rows, consecutive period pairs in columns, each cell the
  signed difference (rule 1) as a number on the better and worse tint for a measure with a ruled
  direction (grey otherwise), the sign also carried by an up or down glyph. Only issuers whose periods the page can order.

### Refinancing

- Controls: currency (one at a time, rule 4); source (Refinancing & LME where the run has it,
  otherwise Financial foundation; the two are never added together and the row says which).
- Lead figure: a **maturity wall**, one column per period as the modules wrote it, matched as
  written, stacked by issuer, the selected issuer in the accent. Totals are computed (rule 4). An
  issuer whose period labels match no column is in the left-out list. The axis is a true time
  axis only when every label is a calendar year; otherwise equal columns in the ruled period
  order, and the page says so. Source: shadcnblocks Chart Card 10 (stacked bar).
- Beside it: per issuer, **two marks on one axis**: debt maturing and committed resources as
  Refinancing & LME wrote them for the reader's chosen period. No ratio and no difference is
  drawn. DESIGN.md "value against a limit" (bullet). Source: shadcnblocks Chart Card 26.
- Under the wall: an **issuer × period heat grid** of debt maturing as written, the tint sequential amber by
  amount within one currency, each column's total computed (rule 4).
- Rows: issuer, period, debt maturing as written, committed resources as written, source module,
  Basis. Instrument-level maturity rows do not exist as typed data and are not drawn.

### Headroom

- Lead figure: one dense table, grouped by issuer, in cohort order, never ranked across issuers,
  every test visible without a disclosure. One **bullet per
  covenant test**: the current level and the threshold as written, the headroom computed (rule 1)
  where both share a unit. Within an issuer the tightest test is first (rule 5); the rest open on
  demand. A test with a missing level or limit is a gap row, not a zero.
- Second figure: the same bullets for **rating triggers** (Ratings & triggers).
- Base against downside is not drawn: Downside has no typed table. Its place holds the designed
  gap note.
- Rows: issuer, test as the module named it, current, threshold, headroom (computed), Basis.

### Market

- Lead figure: a **scatter**, yield against maturity as Market-implied risk wrote them, one mark
  per bond, the selected issuer's bonds joined by a line. No median, no distance, no fitted curve
  (rule 3 excludes bonds).
- Gap state, which is what ships first: the hatched gap note "This page could not read yields and
  maturities." with the count of issuers affected. Spread against duration needs a typed table
  from the module; see the ruling's open items.
- Rows: bond, issuer, yield, maturity, observation date, each as written.

### Shared states

| State | Drawn as |
|---|---|
| Fewer than three qualifying issuers | The figures in a table, no chart, no statistic |
| An issuer left out (other period, other unit, other heading, no figure, more than one figure, left out by the reader) | In the left-out list with that reason; never on the chart |
| A lens with no typed field in any run | One gap note; the tab stays, so the reader knows it exists |
| Retained test preview | The banner the Library already shows |

## Component map

| Need | Source (read live 2026-11-26) |
|---|---|
| Tabs, selects, badges, tables | Untitled UI React, vendored; `untitledui.com/react/components/tables` |
| Chart cards | `shadcnblocks.com/blocks/chart-card`: 6 (multi-line), 10 (stacked bar), 13 (positive/negative), 23 (scatter), 26 (bullet) |
| Lead figure with detail figure | `shadcnblocks.com/blocks/chart-group`: 2 (main chart with detail charts) |
| Stat strip in the cohort bar | `shadcnblocks.com/blocks/chart-group`: 7 (stats row with chart below) |
| Colour, type, gap forms, form choice | `DESIGN.md` |

## Data and code

- The reply `/connected/coverage` already carries `fields`, `facts` (period, unit, heading, basis,
  line) and runs. Trends needs nothing new.
- First build step, before any lens: run the reply on the fixtures and confirm the field ids in
  the table above. A lens whose fields do not exist ships as its gap state; this spec adds no
  parser. Only Financial foundation handoffs carry chart data in the fixtures, so Refinancing,
  Headroom and Market are tested on synthetic publications with hand-written expected values,
  labelled as such.
- The five computations live in one module beside `coverageData.ts`, pure functions on the
  written decimal text (the reply's float `at` is for sorting only), each returning its inputs
  with its result. Tests use hand-written expected values. The cohort rule adds the heading to
  what `rank()` matches today (field, one figure, unit, period).
- Money notation follows `docs/rulings/2026-11-26-money-unit-symbols.md`; period order follows
  `docs/superpowers/specs/2026-11-25-chart-periods.md`.

## Build order

1. Field inventory and the computation module (rules 1 to 5) with its answer key.
2. Monitor, then Patterns (fields exist today).
3. Refinancing, then Headroom (covenant and trigger bullets), each only as far as its fields exist.
4. Market: the gap state; the scatter when Market-implied risk delivers.

## Mockup

`docs/design/mockups/coverage-analytics.html`: one static page with the six tabs (second version, dense). Its
figures are illustrations of form, not a delivered run. It predates the owner's 2026-11-27 ruling
that cash carries no direction: its Cash column is coloured better or worse, and the build draws it
neutral. The owner approved the simplified-Monitor
version on 2026-11-26 ("approved").

## Additions (owner, 2026-11-26)

Owner, 2026-11-26, verbatim: "2. use the RV book market data for data. 3. there also qualitative measures such as sponsors deal count 3. should have good sorting and filtering 4. agent or code/scripts?"

**RV book as market data.** The reader the Credit Snapshot uses knows nine columns of the RV
worksheet: Company, Borrower Name, Bloomberg ID, FIGI, Loan Type, Ranking, Size ($Mn), Margin,
Maturity; and the run context's quotes: bid, ask, price, yield (%), spread (bps), as-of date,
provider. The Market tab becomes **Relative value** and reads these:

- Lead figure: margin (or spread, where a quote exists) against maturity on a true date axis, one
  mark per instrument, coloured by ranking, the selected issuer's instruments joined, sized by
  Size ($Mn) in three steps. No fitted curve. The cohort median margin per ranking (rule 2) is a
  dashed line only where three or more instruments qualify.
- Beside it: instruments per ranking and per loan type (counts), and the margin range strip per
  ranking (minimum, quartiles, median, maximum).
- Rows: issuer, instrument, loan type, ranking, size, margin, maturity, and where quoted price,
  yield, spread, as-of date and provider; distance from the ranking's median margin (rule 3's
  exception, owner 2026-11-27; open question 1).
- An issuer with no RV book row is in the left-out list, never drawn at zero.

**Qualitative measures.** A new column group in Monitor, "Profile", and a filter for each: sector,
sponsor (as the shareholder table or RV book names it), ranking mix, rating where written, and the
scorecard levels Fundamental credit wrote (Management, Sector Outlook, Sponsor Quality, Credit
Direction) as written. A **Sponsors** panel in Patterns: one row per sponsor with its deal count
(issuers and instruments in the cohort, computed counts), total size in one currency (rule 4), and
its issuers as chips that select them.

**Sorting and filtering.**

- Sort: every column, ascending then descending then off; Shift adds a second and third sort key;
  missing always last; the sort is shown in the header and kept in the address.
- Filter bar, one row above the tabs, applying to all tabs: text search; sector, pathway, sponsor,
  ranking, rating and scorecard level as multi-select chips with counts; a range for any measure
  (minimum and maximum as typed, compared exactly); "only issuers with a figure for …".
  Active filters are chips that clear singly or all at once; the cohort bar counts update.
- Saved views: a named set of filters, sort and tab, kept in the browser as saved groups are.
- Keyboard: `/` focuses search; arrows move the selection; Enter opens the run.

**Open questions for the owner**

1. Answered (owner, 2026-11-27: "Yes, allow it"). A margin or Mid 3Y DM may be compared with
   the median of the cohort's instruments of the same ranking, labelled "cohort median by
   ranking, computed"; it is not the Valuation score's median.
2. Answered in part (2026-11-27) by reading a synthetic Sector RV sheet from the Deploy VI
   evidence pack (`SYNTHETIC_Sector_RV_Gaming.xlsx`; shape only, its figures are invented). The
   reference template `REF_CP-3_Sector_RV.xlsx` is empty. The sheet's header row is row 4, with
   18 columns: Company, Borrower Name, Core Business Description, Sub-Sector, Public/Private,
   Bloomberg ID, Loan Type, Ranking, Ratings, Size ($Mn), Margin, Maturity, Bid, Ask, Δ 1M, Δ YTD,
   Mid YTM, Mid 3Y DM. The reader takes nine today; Relative value needs it to take nine more.
   So the lead figure is **Mid 3Y DM against Maturity** (Mid YTM as the alternative axis), marks
   coloured by Ranking and sized by Size ($Mn); a heat grid of Δ 1M and Δ YTD per instrument as
   written (the sheet's own price moves, so not computed); Bid and Ask as written; Ratings,
   Sub-Sector and Public/Private as filter chips and group keys. There is **no sponsor column**,
   so sponsor comes from the shareholder table the modules write, or not at all. Not confirmed:
   that the owner's real RV book has this same header row.
3. Answered (owner, 2026-11-27: "Module shareholder table"). A sponsor is a holder that Business
   & governance's ownership register marks as a sponsor (the Credit Snapshot's Shareholders block
   reads the same register, `("CP-1A", "ownership_register")` in `credit_snapshot.py`). The deal
   count of a sponsor is the number of cohort issuers whose newest run names it, and beside it the
   number of those issuers' RV book instruments; names are matched as written, exactly, with no
   fuzzy match, so two spellings are two sponsors and the panel says so. An issuer whose run has
   no register is "sponsor not stated", never "no sponsor".

## Narrowed by the implementation plan (2026-11-26)

The plan critique found three things this spec and the mockup draw that the reply or the ruling
cannot support. The plan (`docs/superpowers/plans/2026-11-26-coverage-analytics.md`) does not
build them:

- Bars coloured by the share of a limit used: a share is a division, outside the five
  computations. Headroom is shown as a signed figure from the module's own Direction instead.
- The Peer benchmark strip: its rows are keyed by a free-text metric and its count is not typed.
- The yield-against-maturity scatter: maturity is not a typed figure. Market is the gap state.

## Not verified

- The field ids, which the critique read from code, not from a run (step 1 is that check). No
  Refinancing & LME, Legal & covenants or Market-implied risk handoff is in the fixtures.
- Any cross-issuer case: the repository holds no retained multi-issuer publication.
- The three public GitHub searches returned no rows; that does not prove nothing exists.
