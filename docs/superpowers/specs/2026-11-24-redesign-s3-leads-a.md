# Redesign S3 · lead visuals A (Sources, Financials, Validation and decision)

Branch `claude/redesign-s3-leads-a`. Written 2026-11-24 before any component code. Plan:
`docs/superpowers/plans/2026-11-24-frontend-redesign.md`; requirement: `docs/design/screen-map.md`
§ Modules; look: `DESIGN.md`; reference tiles: `docs/design/mockups/2026-11-24/Module-CP1.dc.html`.

## 1. Screen-map rows covered

Each row is the module's P1 (lead visual) and P2 (also show) from the screen map. "Needs" is copied.

| Module | Lead visual (P1) | Also show (P2) | Needs | Real handoff retained? |
|---|---|---|---|---|
| CP-0 Source readiness | Readiness matrix: module × ready, conditional, blocked, with the reason | Key evidence located; conflicts and duplicates | Code | Synthetic only (`proof/handoffs/CP-0.md`); contract in `methods/cp0.md` |
| CP-1 Financial foundation | Earnings against debt and leverage in one composed figure, prior → current | Cash conversion ladder; EBITDA bridge; net debt with pro forma; segments; maturity wall | Code (Method for >2 periods, LTM, full debt stack) | Yes: TransDigm FY2024 draft 3 |
| CP-1B Earnings delta | Variance waterfall, prior → current | Ranked movers; margin and KPI changes as dumbbells | Code | Partial: T4.4/T4.6 tables only (`tests/fixtures/CP-1B-…`), no chart tables |
| CP-1C Peer benchmark | Range strip per metric with the issuer marked | Outliers; peer table | Input | **None** (blocked at the peer-data gate in every retained run) |
| CP-1D Earnings quality | Add-back bridge: supported against unsupported | Leverage restated on supported earnings | Proof | **None** |
| CP-MODEL Model | The Forecast page | — | Code | Calculation JSON on the published model |
| CP-L10 Short snapshot | Key-figure strip | Change screen | Proof | **None** |
| CP-5 Evidence validation | Clearance status with issues by severity | Remediation list by priority | Code; Method for typed counts and use | Synthetic only; register ids from `cp5_integrity.py` |
| CP-6 Committee decision | Stance and the bull against bear ledger with a verdict per claim | Conditions and watch items; portfolio limits | Code; Method for typed stance and action | Synthetic only; table shapes from `cp6_committee.py` |
| CP-8 Changes | The Changes page | — (limitations ledger on demand) | Code; Method for causes | Contract in `methods/cp8.md` |

Not covered, by the plan: the module frame, header, statistics strip, findings and limitations
passages (S2); `Modules.tsx`, `leads/index.ts`, `leads/types.ts` (not touched).

## 2. Design rules this package applies

1. **A lead is a small bento** (`Bento`, `Tile`, `Well`, `GapNote`, `Figure`) of hand-drawn inline SVG,
   `role="img"` with an `aria-label` that states the reading, geometry computed from the handoff's
   numbers, mono direct labels, **one trace control per figure**, and a **table view** (a `<details>`
   holding the figure's numbers as a real table) beneath each figure.
2. **Titles are templated from numbers, never written.** The mockup's headline sentences
   ("Earnings grew; leverage still rose") are judgements; a lead builds a title only from an exact
   comparison of two stated figures ("Gross debt rose 5,130 while reported EBITDA rose 665").
   Better / worse comes only from `signal.ts` `tone()` (the owner's fixed table); a measure the
   table does not know gets direction with no better/worse word.
3. **Derived is labelled.** An exact difference or sum of stated figures (`exactDifference` in
   `signal.ts`, decimal-safe) may be drawn where the figure already shows one, and carries the
   word "derived" in the drawing, its table view and its aria-label. Percentages the handoff does not state
   are not computed, except growth columns the mockup shows (exact `Δ ÷ prior`, labelled derived).
4. **Missing is never zero.** A cell `Not supplied: …` / `Not calculable: …` draws the gap mark with the
   handoff's reason; a remainder that is not itemised is drawn as "Not itemised here" (hatched), not
   as a bar. Totals that do not reconcile are labelled, not forced.
5. **Blocked / absent module** draws one `tone="gap"` tile: "Not assessable" and the module's own
   first sentence (`moduleSource` in `overview/figureData.ts` already does this).
6. **No source references on a lead.** Basis notes that name a file, page, hash, calculation id or
   register are dropped by `containsReference`; the trace control links to Evidence.
7. **Colour only from tokens** (`fill-chart-1…`, `stroke-chart-3`, `fill-warning-mark`, `gap-hatch`);
   direction is never colour alone (arrow + word).

## 3. Components, data and states

Paths under `web/src/pages/connected/report/leads/`. Every lead is `FC<LeadProps>`; its data function is
pure, takes the `OutputEntry`, and returns typed rows or `null` for "draw the gap".

### Shared kit (written first, by me): `kit/`

| File | What |
|---|---|
| `kit/tables.ts` | `sectionTable(entry, heading)`; `tableWith(entry, headers)` (the unique table carrying those headers, in any section); `lineRows(table, label)`; `periodColumns(headers)` (orders `FYnnnn` headers into prior/current); `textUnder(entry, heading)`. Reads what the handoff wrote; returns `null` if absent or ambiguous. |
| `kit/numbers.ts` | `readNumber(cell)` → `{ value, text, gap: string \| null }` (commas, unicode minus, `Not supplied:`/`Not calculable:` reasons, never zero); `sumExact`, `diffExact` over `exactDifference`; `format(value, decimals)` with true minus; `scale(values)` nice axis from zero. |
| `kit/LeadFrame.tsx` | `LeadFrame`: the `Bento`, the blocked/parse-error gap tile, an `aria-label` region. `FigureTile`: `Tile` + `FigureSourceControl` + `Key`s + `<TableView>`. `Derived` tag. `TableView`: `<details>` with a real `<table>`. |
| `kit/*.test.ts(x)` | Unit tests of each helper. |

Imports from S1's `overview/figureParts.tsx` (`FigureSourceControl`, `Key`, `FigureNotes`, `GapPattern`,
`FigureGap`) and `overview/figureData.ts` (`moduleSource`, `basisNotes`, `readCell`), `overview/read.ts`
(`periodSeries`, `gapReason`, `bottomLine`), `overview/stressData.ts` (`forwardPath`, `pathGeometry`)
and `signal.ts`. See § 7: S1 must keep those exports.

### CP-1 Financial foundation: `foundation/` (first and most careful)

`Foundation.tsx` is the lead: a 12-column bento of six tiles, the mockup's six analysis tiles.
At 1440 px: tile 1 span 12; tiles 2 + 3 span 7 + 5; tiles 4 + 5 span 6 + 6; tile 6 span 5, with a
span-7 gap tile "More than two periods". At 390 px every tile is one column and every SVG
`viewBox` scales to width (`width="100%"`); the table views carry the numbers where labels would be
under 11 px.

| # | Tile | Reads (heading → columns) | Drawing |
|---|---|---|---|
| 1 | Earnings against debt and leverage | `Chart data: revenue and EBITDA` (Revenue, Adjusted EBITDA); `T4.4 Income statement` row `EBITDA (Reported)` (FY2024 / FY2023 columns); `Net debt data` (Gross debt); `Chart data: leverage` (Total debt / EBITDA) | Left panel: one dumbbell per measure (prior ring → current dot) on **one USD scale from zero**, plus a growth column (derived, exact Δ ÷ prior, 2 dp) ; right panel: total debt / EBITDA on its own labelled axis, prior → current, tone from `tone("leverage")`. |
| 2 | Cash conversion ladder | `T4.5 Cash flow statement` rows `Cash Interest Paid`, `Cash taxes paid`, `Net Cash from Operating Activities`, `Capital expenditures`, `Levered free cash flow`, `Acquisition of businesses…`, `Dividends and dividend equivalent payments`; EBITDA (Adjusted) from `T4.4` | Horizontal waterfall from EBITDA As Defined: − cash interest, − cash taxes, **− not itemised here** (hatched; derived remainder, labelled), = CFO, − capex, = FCF after capex, − acquisitions and distributions (derived sum of the two stated rows), = FCF after both (derived). FY2023 levels as thin ticks beneath each level. Negative end drawn left of zero with the sign word. |
| 3 | Net debt, with pro forma where a row states it | `Net debt data` (Gross debt, Cash, Net debt per period); `Post-balance-sheet adjustments` (row whose `Pro forma net debt` and `Pro forma net leverage` are stated; the dividend row); `Chart data: leverage` (Net debt / EBITDA); `Chart data: liquidity` | Stacked rows FY2023, FY2024, Pro forma: net debt bar with cash segment to gross debt; the pro forma is the orange (signal) mark carrying the event's stated amount, never drawn where no row states it; a second strip of net debt / EBITDA with the pro forma marked; liquidity (cash + undrawn) as text figures. |
| 4 | EBITDA bridge | `Chart data: EBITDA bridge` (Step, Amount) | Waterfall from reported EBITDA through each stated add-back to EBITDA (Adjusted); axis start labelled and marked on both totals (truncated-axis rule); bracket "add-backs total" = exact sum (derived). If the steps do not reconcile (opening + steps ≠ closing) the bridge is replaced by the gap with the stated amounts listed. |
| 5 | Segments | `Segment schedule` (Net sales, EBITDA As Defined per business unit, latest period) | Per segment a sales bar with an EBITDA bar beneath on **one scale**; EBITDA ÷ sales shown labelled derived; a row with a gap draws the gap mark; "Unallocated corporate" is listed apart ("no revenue line") and never ranked. States whether segment sales sum to the stated net sales (exact, derived) only when both are stated. |
| 6 | Maturity wall, compact | `Chart data: debt maturities` | A compact wall on a true year axis with "Thereafter" after an axis break (the S1 `wallSlots`/`wallGeometry` readers, same marks), bracket "falls due before the first year with a large amount" is **not** drawn (judgement); the sum of the nearest years is offered only as a derived bracket when the module's table has ≥ 3 dated rows. Link: "Full wall on Overview". |
| 7 | More than two periods | — | `GapNote`: "The handoff states two annual periods; a longer trend, last twelve months and a full debt stack need a methodology change (screen map, Needs)." Always drawn for CP-1; cleared only when a period table carries ≥ 3 periods (then tile 1 is not changed by this package; the gap simply stops being drawn). |

Per tile the states are: **data** (as above), **gap** (table or column absent → `GapNote` with the reason
named: "The financial foundation has no EBITDA bridge table."), **partial** (individual cells `Not
supplied` → hatched mark + reason beneath), **blocked** (whole lead is the single gap tile),
**loading** is S2's (the entry is already loaded when a lead is drawn), **empty** = gap.

`foundationData.ts` is the typed reader (one function per tile, returning typed rows); every
function is tested against the retained fixture (`fixtures/cp1_tdg_fy2024.json`) with
**expected values written out by hand** (rule: independent of production calculations) and against
adversarial variants (a `Not supplied` cell, a missing table, a non-reconciling bridge, units that
differ, FY columns in either order, a period label that is not a year).

### CP-0 Source readiness: `sourceReadiness.tsx`

Reads the table with headers `Area | Readiness | Key limitation` (`Source-readiness summary`); states
`READY`, `READY_WITH_LIMITATIONS`, `CONDITIONAL`, `BLOCKED`, `Not ready` (as `ModuleTable.tsx` already
accepts). Draws a **matrix**: one row per area, four state columns, the row's state shown as a
**shape plus word** in its column (filled dot, half dot, ring, slash) and the key limitation in words
at the right; a row naming a source (`containsReference`) shows "Reason is in Evidence". Above it, four
counts (one per state) as a quiet strip. A state word outside the four draws no matrix: gap "The
readiness table uses states this page does not recognise." Span 12 at 1440; at 390 the state columns
collapse into one chip column (shape + word) and the reason wraps under the area.
"Key evidence located" and "conflicts and duplicates" (P2) are not drawn: no retained table;
they stay a gap note listing what is missing ("Key evidence located is not in this handoff").

### CP-1B Earnings delta: `earningsDelta.tsx`

Reads `Chart data: prior and current results` and `Chart data: margin and KPI changes` (`Measure | Prior
period | Prior | Current period | Current | Reporting unit | Basis…`), and a step table
`Chart data: …` with `Step | Amount` for the **variance waterfall** when the handoff supplies one.
Fallback when no chart tables exist (the retained draft carries only `T4.4`/`T4.6`): read the
`T4.4` line-item table (`Line Item | FY2023 | FY2024 | YoY Change (Abs) …`) and draw the pairs whose both
cells are plain numbers, unit taken only from the sentence "All money amounts are USD millions"
under its heading; otherwise the gap. Lead = waterfall (or, without a step table, the **ranked movers**
as the lead with "No variance bridge in this handoff" as the stated gap), P2 = dumbbells of margins and KPI
changes on their own percent axis. Ranking is by the module's stated `YoY Change (Abs)` where present,
else by exact difference (derived), largest first, within one unit.

### CP-1C Peer benchmark: `peerBenchmark.tsx` (unproven on a real run)

Built from the launcher contract: `Chart data: peer range — percent metrics` and `— multiples`
(`Metric | Issuer | Peer low | Peer median | Peer high | Peer count`). One **range strip per metric**,
low–high band, median tick, issuer mark, labelled; percent and multiples on separate axes; peer count
printed; a metric with a gap in any of the four values draws the gap mark in place with the reason.
Blocked/absent peer data (the usual state): the designed gap, "Peer data was not supplied, so this
credit is not placed against peers" is **not** invented — the lead shows the module's own bottom-line
sentence from `moduleSource`, with the gap treatment. Outliers and the peer table are not drawn
(no contract table retained; `GapNote` says so). **Unproven on a real run.**

### CP-1D Earnings quality: `earningsQuality.tsx` (unproven on a real run)

Built from `bindings/cp1d.py`: add-back assessment (T1D.2), adjusted EBITDA bridge (T1D.3 steps), add-back
share (T1D.5), restated leverage (T1D.6). Reads a table with `Step | Amount` for the bridge and the
assessment table by its headers (`tableWith`); draws an **add-back bridge** from reported to adjusted EBITDA
with each add-back split **supported / unsupported** only when the assessment table states a support
word per add-back (no inference); otherwise the bridge is drawn single-colour with "Support is not
stated per add-back" as a gap. Restated leverage shows reported against restated when both are stated.
**Unproven on a real run.**

### CP-MODEL: `modelLead.tsx`

The module page for CP-MODEL: a compact forward path (published model's net leverage by case, reusing
`forwardPath` / `pathGeometry` from S1's stress reader) and one link tile "Open the forecast"
(`#forecast`). When the published model has no net leverage row: gap "The model states no net
leverage path" with the link kept.

### CP-L10 Short snapshot: `shortSnapshot.tsx` (unproven on a real run)

Built from `bindings/cpl10.py` (TL10.2 topic screen, TL10.3 items, TL10.5 totals): a **key-figure strip**
(`StatsStrip`) of the screen's stated items, each with prior → current where the table states both, and
the "change screen" list beneath. Unknown shape ⇒ the lead draws the strip only for a table whose headers
are recognised (`Topic`/`Item` with `Prior`/`Current`), otherwise the gap with the reason. **Unproven on a real run.**

### CP-5 Evidence validation: `validation.tsx` (in `decision.tsx` registry)

Reads the integrity verdict (`Item | Value`, row `Status` — "Cleared/Restricted over the evaluated set"), the
integrity gaps register (`Gap ID | Gap | Why it matters | Affected modules | Severity | Action`) and the
contradiction register (`Contradiction | Claims | Nature | Severity | Rationale`).
Draws **clearance status** (status word + shape, from the verdict row; if absent, the module's bottom line
sentence) and **one pip per listed issue by severity** (Critical / Material / Minor) — the pips are rows of the
registers, counted exactly and labelled "listed in the gaps and contradiction registers": **this is not the
typed counts the screen map asks for** (Method item 2); the label says so, and `use restriction` is drawn only as the
sentence in the verdict row. P2: remediation list by priority (the `Action` column, severity order).
Registers absent or in the synthetic `Item | Value` "Not supplied" shape ⇒ no pips; the gap says "No issues are
listed" only when the register states that; never zero from absence.

### CP-6 Committee decision: `committee.tsx`

Reads `Final bias` (`Action bias | Rationale | Conditions | Confidence …`), `Bear cross-examination` (`CP-2 row | Counter-case |
Evidence for | Evidence against | What would change the view | Basis`) and `Chart data: portfolio limits`. Draws the **stance**
as the action bias word + confidence (as the handoff states them; not typed — the screen map's Method item 1) and the **bull
against bear ledger**: one row per CP-2 row, left the case for (Evidence for), right the counter-case/evidence against; the
**verdict per claim** is a gap ("No verdict is stated per claim") because the handoff carries none. P2: conditions (from Final bias), portfolio limits
as bullets against the limit (`bulletGeometry` from S1's reader) when the limits chart exists. Without `Final bias`, the synthetic
`Committee challenge` paragraph (`Action bias: X (confidence Y)…`) is read for the word; otherwise the gap.

### CP-8 Changes: `changesLead.tsx`

CP-8's page is the Changes page (S6 owns it). `leadFor("CP-8")` is therefore a summary only: status counts from
`What changed: the analysis` (Unchanged / Strengthened / Weakened / Reversed / New / Not run this time), and the five
largest measure moves from `What changed: the issuer` as earlier → current dumbbells **when both cells are plain numbers in one unit**, otherwise rows in words; a link "Open Changes" (`#changes`). Causes are shown as the handoff states them (`Unresolved` is shown, not hidden).

## 4. Files

Add (all under `web/src/pages/connected/report/leads/`): `kit/{tables,numbers}.ts`, `kit/LeadFrame.tsx`,
`kit/*.test.*`; `foundation/{foundationData.ts, EarningsDebt.tsx, CashLadder.tsx, NetDebt.tsx, EbitdaBridge.tsx,
Segments.tsx, Maturity.tsx, Foundation.tsx, *.test.tsx}`; `sourceReadiness.tsx`, `earningsDelta.tsx`, `peerBenchmark.tsx`,
`earningsQuality.tsx`, `modelLead.tsx`, `shortSnapshot.tsx`, `validation.tsx`, `committee.tsx`, `changesLead.tsx` with their data
files and tests; `fixtures/build_fixtures.py` and the generated JSON fixtures (parsed by the library's own
`sections_of`, unedited); `fixtures/load.ts` (turns a fixture into an `OutputEntry` and a `ReportView`).
Change: `financials.tsx` (registers CP-0, CP-1, CP-1B, CP-1C, CP-1D, CP-MODEL, CP-L10) and `decision.tsx` (CP-5, CP-6, CP-8).
Delete: nothing. Not touched: `Modules.tsx`, `leads/index.ts`, `leads/types.ts`, `index.test.ts` (S2).

Throwaway visual harness, **not committed into routes**: `web/preview-leads/` is not created; instead
`/tmp` scratch (`leads-harness.tsx` + a Vite config) renders each lead from the fixtures with the real stylesheet
and Playwright screenshots it. Screenshots are looked at and described in § 8.

## 5. Gaps drawn today (methodology or input needed)

| Place | Why it is a gap |
|---|---|
| CP-1: trend beyond two periods, LTM, a full debt stack | The handoff carries two annual periods and a notes-only stack (screen map Needs: Method). Tile 7 states it. |
| CP-1: pro forma as a typed row | The pro forma exists as an adjustments table (`Post-balance-sheet adjustments`); drawn from that table only. The Method item (typed rows) is not required for this. |
| CP-1C | Input: peer data. Contract-built; unproven. |
| CP-1D, CP-L10 | Proof: no retained handoff. Contract-built; unproven. |
| CP-5 typed counts and use | Method; pips are register rows, labelled as such. |
| CP-6 typed stance, verdict per claim | Method; the action bias word is the handoff's phrase; verdict is a stated gap. |
| CP-8 causes | Method; shown as written, `Unresolved` visible. |
| CP-0 key evidence located, conflicts | No retained table; a stated gap note. |

## 6. Sub-agent plan

| Part | Model · effort | Why |
|---|---|---|
| Spec; kit (`kit/*`); fixtures; `foundationData.ts` and its tests with hand-written expected values | Me (this session, Sonnet high) | Reads handoff data; defines the shared contract; independent expected values |
| Six CP-1 tile components | Sub-agents, Opus · high, one per two tiles, in parallel after the kit lands | Handoff-reading + SVG geometry with several derived-label rules |
| CP-0, CP-1B, CP-5, CP-6, CP-8 leads | Sub-agents, Sonnet · high, in parallel | Typed tables with clear shapes |
| CP-1C, CP-1D, CP-L10, CP-MODEL | Sub-agent, Sonnet · high | Contract-built gap-first leads |
| Mechanical: fixture generation, registry edits, `knip`/`prettier` fixes | Haiku · low | Fixture and mechanical edits |
| Independent review of the whole diff (numbers not in a handoff; missing shown as zero; source references on a working page; weakened tests) | One Opus · high reviewer given the code and the plan's phase-3 list, not my conclusions | Plan rule |

## 7. Requests to the coordinator

1. S1 owns `overview/figureParts.tsx`, `figureData.ts`, `read.ts`, `structureData.ts`, `stressData.ts`, `marks.tsx`. This package imports
   `FigureSourceControl`, `Key`, `FigureNotes`, `GapPattern`, `FigureGap`, `moduleSource`, `basisNotes`, `readCell`, `periodSeries`,
   `gapReason`, `bottomLine`, `wallSlots`, `wallGeometry`, `forwardPath`, `pathGeometry`, `bulletGeometry`. Please have S1 keep those exports
   and signatures (or tell me).
2. S2: a lead for a **blocked** module draws its own gap tile. If S2 already draws a blocked header with the reason, tell me and I will draw nothing for a blocked module.
3. CP-0 sits in the "Sources" stage; the plan assigns it to `financials.tsx`, so it is registered there. If S2 prefers a
   `sources.tsx`, say so; `leads/index.ts` already merges any stage file.
4. CP-8 has no Modules page (the route goes to Changes): its lead is built but may never be drawn.

## 8. Verification

### Built as (departures from § 3; round 2 after the coordinator's review of 98556cb)

Rulings applied: (i) no derived number the module did not write (removed items listed in `2026-11-24-s3-removed-derived.md` for the methodology plan; the only computed figure is the exact prior → current change of one stated measure on one basis and unit); (ii) handoff order, not a computed ranking; (iii) CP-0 states readiness exactly as written, prints the command's hold words beside the state, no headline count, the handoff's own column header; (iv) a blocked or unreadable module draws nothing (the frame states it), every other gap is one `GapTile` pattern; (v) each lead carries a static `draws` property (CP-0 `[]`, CP-1 `["figures"]`, CP-1B `["figures"]`, CP-1C `["figures"]`, CP-1D `["figures"]`, CP-5 `[]`, CP-6 `["figures","events"]`, CP-L10 `[]`, CP-MODEL `[]`). **CP-8's lead is dropped** (no module page; files and registry entry deleted).

Shared system in `kit/`: `useFigureWidth` (every figure draws at its measured width, one unit one pixel, narrow layout below 520 px, no sideways scroll), one `Waterfall` (axis cut with break marks, gap rows, prior ticks, split steps), one `Dumbbell`, one `Bullet`, `niceAxis`, `GapSlot`, `FigureTile` with the Table view as a button in the tile head, `Link`, `GapTile`, `safeText` (screens sources, register ids and calculation ids out of handoff text). `ScrollFigure` is gone. Chart text is 12 px.

CP-1 data layer (`foundation/foundationData.ts`): every reader returns all stated periods in year order (one, two or more; LTM listed apart), gaps in place; the three real handoffs (accepted, single-period relative value, distressed) and a three-period and an LTM mutation are tested; the cash ladder is the handoff's own stated levels (the distressed after-distributions −158 is read from its KPI dashboard); no plug, no derived end level, no ratio, no growth, no sums. Maturity span 6 (so its columns fit at 12 px).

Gap wording: a gap states what the page checked ("This page could not read X from the handoff") unless a cell states its own reason; no build or methodology notes on the page.

### Verification (round 2)

Run from `web/` unless stated. Evidence: retained TransDigm FY2024 handoffs (accepted CP-1, relative-value single period, distressed, earnings-update draft; outdated, shape and scope only) and synthetic or contract-built entries; no live run, no provider call.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint --max-warnings=0 src/pages/connected/report/leads` | clean |
| `npx prettier --check src/pages/connected/report/leads` | clean |
| `npx vitest run src/pages/connected src/styles` | see the report (leads alone: 25 files, 525 tests) |
| `npm run unused` (knip), `node scripts/duplication.mjs`, `npm run build` | clean, exit 0, built |
| `docs/design/preview/check-render.cjs` on the throwaway lead harness (not a route), 5 widths (1440, 1280, 1024, 768, 390), plain and `stress=1` (long text), CP-1 accepted / relative / distressed / three-period / LTM / single-period, CP-1B (T4.4 fallback and chart-table bridge), CP-0, CP-5, CP-6 (weakness-point row, proposed above limit), CP-1C, CP-1D, CP-L10, CP-MODEL | no failures in lead-owned code. Remaining failures are all the Overview marks' own 11 px tick labels and one tick label clipped outside its SVG (`overview/marks.tsx` `Slope` and `DotStrip`, S1's file) |
| Not run | `tools/quality_gate.py` (uv 0.12.5 needed, 0.11.32 here; the only Python file added is `fixtures/build_fixtures.py`, ruff clean); the full Python suite; a live run; the checker on the real report route (the frame, S2, is not merged here) |

Looked at: every case above at 1440 and 390 (PNGs in the session scratchpad). Defects found by looking and fixed: pips squeezed, clipped ticks, stretched gap tiles, a CP-1B change label wider than its slot (Dumbbell now wraps the change), maturity wall falling to rows at 12 px (span 6), the false "not in the handoff" ladder gap.

Known limits: the Overview `Slope`/`DotStrip` are fixed 408-unit viewBoxes, so on a phone the tiles write the figures as HTML instead and the strip's last tick label sits about 4 px outside its SVG; the real accepted CP-1 lists five stated adjustments, so no real fixture draws the single solid pro forma bar (proved on a one-adjustment mutation); CP-1C/1D/L10 and CP-5/6 are contract-built, unproven on a real run.

### Verification (round 3: L1–L13, N1–N8, wording ruling; merged with d097d0d)

Scope: retained TransDigm FY2024 handoffs (outdated; shape only) and synthetic inputs built from the module contracts; no real run, no paid call.

- Merged `origin/claude/exciting-albattani-v1zoug` (S1 Overview, d097d0d). Overview marks now take `Slot[]`, a measured width and 12 px, so the HTML fallback below 408 px for the leverage Slope is removed (`EarningsDebt.tsx`).
- Gates on the merged tree: `tsc --noEmit` 0 errors; `eslint --max-warnings=0 src` clean; `prettier --check src` clean; `vitest run src/pages/connected src/styles` 188 files / 3,251 tests pass; `npm run unused` clean; `scripts/duplication.mjs` exit 0; `npm run build` ok.
- Rendered check (`docs/design/preview/check-render.cjs`, widths 1440/1280/1024/768/390, plain and stress text, harness `web/.lead-preview`, 15 lead entries): no failures. PNGs looked at: CP-1 accepted (1440, 390), CP-1B retained (1440, 390), CP-6 (1440, 390).
- Seen and left (rendering only): at 390 the cash-ladder connector touches the "1,236" label, and on net debt the dotted pro forma rule crosses the first pro forma label; the Debt maturities tile sits alone in the last CP-1 row when two periods are stated (five span-6 tiles).
- Not verified: any real handoff for CP-1C, CP-1D, CP-L10, CP-MODEL, CP-5, CP-6 (none retained); the CP-6 ledger subject when the CP-2 cell is a register id.

### Verification (round 4: T1–T7 and the two judged items)

Gates on c85f859: tsc 0; eslint, prettier, knip clean; `vitest src/pages/connected src/styles` 189 files / 3,304 tests pass; duplication exit 0; build ok; check-render 1440/1280/1024/768/390 plain and stress on 13 lead entries: no failures; CP-1B at 1440 looked at (axis-headed groups, one compact gap line). Not run: quality gate (uv pin mismatch). Not verified: any real handoff for these leads.
