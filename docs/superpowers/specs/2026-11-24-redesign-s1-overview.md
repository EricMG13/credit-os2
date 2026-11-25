# S1 · Report header, Overview, History — spec

Package S1 of `docs/superpowers/plans/2026-11-24-frontend-redesign.md`. Branch
`claude/redesign-s1-overview`. Requirement: `docs/design/screen-map.md` § On every screen (report
header, section control), § Report · Overview, § Report · Calendar and History (History rows).
Look: `docs/design/mockups/2026-11-24/Overview.dc.html`.

The owner rejected the interim Overview ("it looks more like the original than the mockup. this is
supposed to be a complete redesign not reskin"). Nothing below starts from the old page: the old
Overview (ReportFindings band, Run-at-a-glance, Bottom line by module cards, Limitations
accordions, Dates list, Key charts) is deleted, not restyled.

## 1. Screen-map rows covered

### On every screen (report part)

| Element | Rank | What | Needs |
|---|---|---|---|
| Report header | — | Breadcrumb, issuer name, sector line, pathway, as-of date and period, currency and unit; name large, facts as quiet chips | Code |
| Section control | — | Overview, Changes, Modules (count), Forecast, Evidence, Calendar; one segmented control, current tinted with a dot; right of the header | Code |
| Synthetic / preview state | — | A persistent chip so a test is never mistaken for a real run (§ States every screen draws) | Code |
| CP-2H "Rating chip in the header" | — | Ratings entered at run start as chips | Code |

### Report · Overview

| Rank | What | Where | Needs |
|---|---|---|---|
| P1 | The call: stance chip, bottom line in full | Row 1, 8 cols | Code; Method for typed stance |
| P1 | Confidence score and band, meter 0–100 | Row 1, right, top | Code |
| P2 | Evidence clearance: status, counts by severity, committee use | Row 1, right, middle | Method (CP-5); until then status and sentence |
| P2 | Since the earlier run: same/better/worse; stance was → now | Row 1, right, bottom | Code; Method for causes |
| P2 | Gross and net leverage prior → current, pro forma where stated | Row 2, left 8 | Code; Method for pro forma row |
| P2 | Revenue, EBITDA, interest cover, liquidity prior → current | Row 2, right 4 | Code |
| P2 | Key findings, numbered, a trace each | Row 3, 7 cols | Code |
| P2 | Contrary evidence on the counter surface | Row 3, 5 cols, top | Code |
| P2 | What would change the view: two outcome wells | Row 3, 5 cols, bottom | Method: typed split; until then the passage as written |
| P2 | Maturity wall on a true time axis | Row 4, 8 cols | Code |
| P2 | Capital structure by rank | Row 4, 4 cols | Code; Method for full stack |
| P2 | Room to the covenant / incurrence level | Row 5, 4 cols | Input: executed documents |
| P2 | Downside cases side by side | Row 5, 5 cols | Code |
| P3 | Forward leverage path | Row 5, 3 cols | Method (CP-2G per-year path) |
| P2 | What this run could not do | Row 6, full | Code |
| P3 | The run as a pipeline + each module's bottom line | Row 7, full | Code |
| P3 | Dates to watch on a true time axis, then a numbered list | Row 8, full | Code; Method for kind and amount |
| E | File names, hashes, run code, registers | Not on this page | — |

### Report · History

| Rank | What | How | Needs |
|---|---|---|---|
| P1 | This issuer's runs, newest first, with stance and as-of date | Vertical timeline | Code |
| P2 | Pathway, state and who started each run | Chips on the timeline rows | Code (pathway, state); **Input to the published report** for who started it (see § 4) |

## 2. Components

All tiles use the frozen kit: `Bento`, `Tile`, `Well`, `GapNote`, `Figure` (`report/overview/Tile.tsx`),
`Segmented` (`components/kit`), `PublishedSource` for every trace control, `StatusBadge`.
Grid: `Bento` is one column below `lg`, twelve at `lg` and up; DOM order is reading order, so at
390 px every tile stacks full width in the mockup's order.

### 2.1 Report header — `ReportHeader` in `ReportLibrary.tsx`, identity reading in `report/IdentityBand.tsx`

Replaces `Breadcrumb` + `PageHeader` + `ReaderBadges` + the `IdentityBand` "Company" band +
`ReportNav`.

| Part | Reads | States |
|---|---|---|
| Breadcrumb `nav[aria-label=Breadcrumb] > ol`: Library (`/`) / issuer (`#history`, the issuer's runs) / pathway (current) | `catalogue.name` → `run.issuerHeading` → `run.issuer`; `runPathway` | Unpublished run: Library / issuer or "Report" |
| `h1` issuer name (h1 32/38, semibold), sector line beside it (small, secondary) | sector chain unchanged: catalogue sector → CP-1A register Sector → profile "Sector and segments"; a sector that cites a source is not drawn | No sector: no line (the chip row still carries pathway / date / unit) |
| Fact chips (24 px, hairline, rounded): pathway; "As of {date} · {period}"; currency and unit (`runMoneyUnit` → `unitLabel`); one chip per entered rating ("Moody's B1 · Negative", outlook arrow, `title` = as-of); "Test preview" / "Synthetic test" chip in the brand tint; run labels (Earlier format, Earlier methods) | `runTiming`, `runPathway`, `runMoneyUnit`, `catalogue.ratings`, `snapshot.preview`, `mode`, `runLabels` | Missing unit: chip omitted; no ratings: one quiet chip "Ratings not entered" |
| CP-2H differing rating link | `differingAgencies` (unchanged) | Shown only when an agency differs |
| Utility links, quiet, top right of the header row: "Run progress" (`/run/<id>`, not in preview), the source-highlight switch (not on Evidence) | unchanged behaviour | — |
| Section control: `Segmented` with link segments Overview, Changes, Modules {count}, Forecast, Evidence, Calendar; accessible name "Report sections"; Modules segment named "Modules {n}" | `view.modules.length` | On History the control shows no current segment; on Calendar, Calendar is current |

The Forecast focus target `#forecast-report-nav` moves to a wrapper `div` around `Segmented`
(tabIndex −1) because the kit part takes no id; `useReportPlace` is unchanged.
The business description leaves the header (the screen map's header has no description; it stays
on the Business & governance module page). Its precedence tests are replaced by the sector-chain
tests, which exercise the same register → profile chain.

### 2.2 Overview — `Overview` in `ReportLibrary.tsx`

```
<section aria-labelledby="overview-title"> <h2 id="overview-title" class="sr-only">Overview</h2>
<Bento>
  CallRow       — call (8) | confidence, clearance, since-earlier column (4)
  FigureRow     — gross (4), net (4), 2×2 small tiles (4)
  JudgementRow  — findings (7) | contrary + what would change the view column (5)
  StructureRow  — maturity wall (8), capital structure (4)
  StressRow     — headroom (4), downside (5), forward path (3)
  LimitsRow     — what this run could not do (12)        #overview/limitations
  PipelineRow   — pipeline and bottom lines (12)  (S10's, imported unchanged)
  DatesRow      — dates to watch (12)                    #overview/dates
</Bento>
```

No page heading row, no anchor-link row, no "Credit view from …" line, no Key charts, no Issuer
calendar button (Calendar is in the section control). `#overview/key-charts` is retired.

Changes to the rows (they exist and are unit-tested; each change below is a departure from the
mockup for a reason other than missing data):

| Row / tile | Mockup | Today | Change |
|---|---|---|---|
| Call tile heading | "The call · committee stance" | "The call · from {module}" link | "The call · {lead module name}"; module link moves to the trace row |
| Call facts | Pathway, Financials as of, Currency, Modules "15 · all delivered except X" | Modules "14 · 13 delivered, 1 not assessable" | Name the exceptions: "{n} · all delivered except {names}" (names, never codes) |
| Stance chip | Icon + word | Word only | Eye icon (watch stances), plus icon for adding stances; the word always present |
| Confidence | Labels under the bar for both scores | Caption sentence | Labels in the meter: "{lead} {score}" and the second module's tick label |
| Clearance | Status word, committee use, severity wells with pips | Module state badge + sentence | Status sentence as written (bottom line), then one designed gap well "Issue counts by severity and committee use are not typed in this run" (Method item 2) |
| Since the earlier run | Verdict word (20 px), was → now chips, sentence | Sentence + link | Verdict word read from the first words of CP-8's bottom line when they are exactly "Better", "Worse" or "About the same" (the method requires that first sentence); stance chips: earlier run's CP-6 action bias → this run's, when both are stated; otherwise only the sentence. Never inferred |
| Large figure tiles | Small title + basis line, 44 px figure, "from … in FY", Worse chip | Tile h4 title, period kicker | Title 13 px with the basis line under it (period, unit), as in the mockup |
| Contrary evidence | Own tile, counter surface | One tile, rest paragraphs as wells | Counter tile under the module's own heading ("Contrary evidence and what would change the view"): first paragraph as the quote, each further paragraph as written in its own well with its own trace. Never split by position (review finding: that would label a paragraph the module did not label) |
| What would change the view | Own plain tile, two outcome wells | — | New tile, the designed gap until the outcomes are typed (Method 7): "The two outcomes, resolved favourably and resolved adversely, are not typed in this run; the module's passage is quoted above as written." |
| Limits heading | "What this run could not do" | "Limitations" | Heading text as the mockup; h3; id `overview-limitations` kept |
| Dates | Hidden when no dates | — | Tile always drawn; "No dated events were recorded in this run.", or, when events exist but none could be placed, the gap "No recorded event could be placed on the time axis. The issuer calendar lists the recorded gaps."; h3; id `overview-dates` kept |
| Tile headings | — | Limits and Dates use h2 | h3, under the page's h2 |

### 2.3 History — `RunHistory` in `ReportLibrary.tsx`

`section[aria-labelledby=history-title]`, `h2` "Runs of {issuer}", then an `ol` vertical timeline,
newest first (sorted by `asOf`, then folder), one `li` per published run of the issuer:

- Rail with a node per run (teal ring for this run with "This run" chip, zinc for others).
- Mono as-of date (P1) and the stance chip (P1) from that run's CP-6 action bias; when not stated,
  a quiet chip "Stance not stated".
- Chips (P2): pathway, state ("Finished" status badge; every listed run is published), run labels.
- Modules run, as names.
- Links: "Open overview", "What changed" (unchanged targets).
- Who started the run: not published with the report → one designed gap line above the timeline
  (§ 4).

## 3. Files

| File | Change |
|---|---|
| `web/src/pages/connected/ReportLibrary.tsx` | New `ReportHeader`, `ReportNav` → `Segmented`, new `Overview`, new `RunHistory`; remove `KeyCharts`, `ReaderBadges`, `ReaderHeader`, `TILE_KEYS`; tabs: `calendar` joins the control, `history` leaves it |
| `report/IdentityBand.tsx` | Becomes the header's identity reading: exports `identityDetails`-style `reportIdentity()` (sector, ratings, differing) and `RatingChips`; the "Company" band and description are removed |
| `report/OverviewModules.tsx` (+ test) | Deleted: `ModuleBottomLines`, `RunLimitations`, `RunGlance` were the interim blocks |
| `report/MetricGrid.tsx` | Unchanged (Modules and Confidence still use it) |
| `report/overview/CallRow.tsx` | Changes per § 2.2 |
| `report/overview/FigureRow.tsx`, `figureParts.tsx` | Large-tile head per § 2.2 |
| `report/overview/JudgementRow.tsx` | Contrary / what-would-change split |
| `report/overview/LimitsRow.tsx`, `DatesRow.tsx` | Heading, level, empty state |
| `report/overview/changeData.ts` (new) | Verdict word and stance was → now readers |

Tests to add (before the blocks): `report/overview/OverviewPage.test.tsx` (assembly order of
regions, one h2, anchors, no old blocks), header tests in `ReportLibrary.header.test.tsx`
(breadcrumb, h1, sector, chips, Segmented current states, synthetic chip), History tests
(`ReportLibrary.history.test.tsx`: newest first, stance, chips, gap line), `changeData.test.ts`,
and new cases in `callRows.test.tsx`, `lowerRows.test.tsx` and a judgement test.

Tests to rewrite (they pin the old layout): `ReportLibrary.frame.test.tsx` (Overview heading,
Key charts, Report history), `ReportLibrary.identity.test.tsx` ("Company" region, description),
`ReportLibrary.wayfinding.test.tsx` (History tab, Calendar current), `report.auditFollowups.test.tsx`
(Credit view band on Overview), `ReportLibrary.design.test.tsx` where it reads the old Overview.
Behaviour assertions (values, links, gaps, states) are kept against the new blocks.

## 4. Drawn as a gap today

| Place | Gap text (in place) | Why |
|---|---|---|
| Stance chip when CP-6 states no Final Action Bias | no chip; heading still names the lead | Method 1 (typed stance) |
| Clearance counts and committee use | "Issue counts by severity and committee use are not typed in this run." | Method 2 |
| Since-earlier stance was → now | chips omitted when either side is not stated | Method 1 |
| Net leverage pro forma mark | the tile's dot strip shows stated periods only | Method 3 |
| What would change the view, two outcomes | passage as written; gap when not separate | Method 7 |
| Covenant headroom | `FigureGap` with the legal module's reason | Input 8 |
| Forward path years | hatched / gap per the published model | Method 4 |
| History "who started" | "Who started each run is not published with the report." | The published run carries no starter field; needs `react_frontend` to publish it (coordinator request) |

## 5. Sub-agent plan

| Part | Agent · model · effort | Why |
|---|---|---|
| Spec, header, Overview assembly, since-earlier readers (handoff data) | me (Opus · high) | Reads handoff data; the page the product is judged on |
| History timeline + its tests | Sonnet · high | Presentational, list from existing readers |
| Rewriting old-layout tests to the new blocks | Sonnet · medium | Mechanical but must keep behaviour assertions |
| Independent diff review (numbers not in a handoff, missing as zero, references on a working page, a11y, 390 px) | Opus · high, given only the code | Plan rule: one independent review |

## 6. Requests to the coordinator

1. `PipelineRow` (S10) titles its tile with an `h2` ("Module pipeline"); under the Overview's
   `h2` every other tile heading is `h3`. Ask S10 to use `h3`.
2. Publish who started a run (the run-start "Your name") on `PublishedRun` so History can draw it.
3. `ReportFindings`' `overview` / `overviewLabel` / `afterBottomLine` / `besideBottomLine` props
   (S2's `ReportContent.tsx`) are no longer used by the Overview; S2 may remove them. Likewise
   `overviewCharts`, `foundationMetrics`, `headlineSources` in `reportView.ts` lost their Overview
   caller.
4. `Tile` (frozen) has no heading-level or small-head option: the mockup's 13 px tile heads are
   written as an h3 inside the tile's children (`CallRow` `Head`), and History's h2 tile repeats
   `Tile`'s classes. A `heading` prop on `Tile` would remove both.
5. `report/stages.ts` fails `no-unnecessary-type-assertion` on the base commit (owner unclear).

## 7. Verification

Synthetic Northbridge run (`docs/design/preview/README.md`), viewer restarted after each build.
Screenshots looked at, at 1440 and 390 px; what I saw:

| Shot | Seen |
|---|---|
| Before, Overview 1440 | The interim page: page h2 "Overview" with anchor links, a white findings band, a run-glance box, six equal metric cards, bottom-line cards by stage, limitation accordions beside a dates list, then Key charts. Reads as the old page. |
| v1, Overview 1440 | Header as the mockup: crumbs Library / Northbridge Synthetic Group / Full credit assessment, name 32 px, chips (pathway, as-of, US$m, Moody's B1 · Negative), segmented control right with Overview tinted and dotted, Calendar in it. Bento rows in the mockup's order: call (8) beside confidence / clearance / since-earlier (4); gross slope and net dot strip (4 + 4) beside a 2×2 of small tiles; findings (7) beside the navy contrary tile and the what-would-change gap tile (5); maturity wall (8) and capital stack (4); headroom (4), downside (5), forward path (3); "What this run could not do" full width with hatched wells; pipeline graph with three columns of bottom lines; dates on a time axis. The call tile has empty space under its one-sentence synthetic bottom line (the right column sets the row height); real bottom lines are three or four lines at this size. Negative outlook was red → changed to the signal colour. |
| v1, Overview 390 | One column in reading order, no page scroll. Small figure tiles stacked one per row with oversized mini marks → made 2×2. Maturity wall labels scaled to ~5 px → the wall now draws at the frame's width below 560 px. Downside small multiples scaled to ~6 px → the figure keeps its type size and scrolls sideways inside its tile (a focusable region). |
| v2, Overview 390 | Figures 2×2 legible; wall bars and labels at full size; downside scrolls in its tile; limits wells, pipeline (stages stacked), bottom lines and dates list all readable; breadcrumb wraps onto two lines. |
| History 1440 / 390 | Crumbs end in "Runs"; no segment current; tile "Runs of Northbridge Synthetic Group", the who-started gap line, the timeline node marked as this run, date in mono, "Stance not stated" (the synthetic committee decision states no Final Action Bias, consistent with the call tile showing no stance chip), pathway chip, Finished, modules run, Open overview / What changed. |

| Final, Overview 1440 | After the review fixes: same composition; counter tile titled with the module's heading; outcomes tile is the hatched gap; confidence scores named on a legend line under the bar; clearance, confidence and since-earlier have 13 px h3 heads. |
| Final, Overview 390 | No horizontal page scroll (measured: `main` scroll width 390 = client width). Header chips wrap; maturity wall keeps 56 px per period and scrolls inside its tile when it needs more; downside scrolls inside its tile. |

Independent review (Opus, given the code only) found 17 items; fixed: positional split of the
counter passage; dates gaps shown as "none"; header chips forcing page scroll; module-count
wording for "Delivered with gaps" and zero modules; 20 px link targets; verdict regex false
positives on a comma; meter label collisions; maturity wall unreadable with many years and
unmeasured frame; comparison problem not shown; two stance chips with different rules; small
tiles without headings; History same-date order; small figures overflowing at 390. A further
defect found by the trace tests: a gap reason citing a source was printed on the figure tile.
Not fixed, noted: History repeats "Open overview" / "What changed" link names per row; the
Forecast focus target is a wrapper `div`; the Downside scroll region is focusable on desktop too;
rating "Entered at run start" is a tooltip only; `moduleName` falls back to a code for unknown
earlier modules (pre-existing); History's tile repeats `Tile`'s classes because `Tile` has no
h2 heading (request 4).

Checks run: `npx tsc --noEmit` pass; `npx eslint --max-warnings=0` on every changed file pass
(`report/stages.ts`, unchanged here, fails one rule on the base too); `npx prettier --check` on
changed files pass; `npx vitest run src/pages/connected src/styles src/shell src/components`:
170 files, 2,434 tests pass; `npm run unused`: one finding, `LeadProps` in the frozen
`report/leads/types.ts` (not mine); `npm run build` pass. Not run: the full `npm run gates`
(coverage, audit, duplication, file gates), the Python tests that read the web build, and
`tools/quality_gate.py` (no Python changed; it also needs `origin/main`, absent here). Content
was checked on the synthetic run only; long real text was exercised through the retained-text
unit fixtures, not a rendered TransDigm run.

### Coordinator review (parts 1 and 2), fixes and re-verification

Every numbered item of both parts is fixed with a test written from the reviewer's input (item
by item in the report to the coordinator). Re-rendered after the fixes, raw synthetic run and
the same run with realistic text swapped into the snapshot in the browser (three-sentence
bottom line, six 30–40-word findings), at 1440, 1280, 1024 and 390 px: no sideways page scroll
at any width, no console errors. Seen: bottom line 44 px, the largest text, continuation behind
Read on; trust tiles tight, clearance a one-line gap; figure tiles with basis, period and a
change only against the year before; one counter tile with a one-line outcomes gap; the wall fits
its tile at 1280 (FY2028 in view); stack labels beside their segments; downside dumbbells with
the covenant limit and cover right-aligned (its clipped heading fixed after the first render);
dates axis with one mark per event, names above, dates below, no overprint; at 390 the name
follows the breadcrumb, utilities end the header, Confidence starts at about 1,130 px.

Checks: tsc pass; eslint --max-warnings=0 and prettier --check on every file changed since the
base pass; vitest src/pages/connected, src/styles, src/shell, src/components — 176 files, 2,500
tests pass; npm run unused — only LeadProps in the frozen leads/types.ts; npm run build pass.

### Coordinator review round 2 (N1–N12, D1–D13), fixes and re-verification

Rendered after the fixes, raw synthetic and realistic text, at 1440, 1280, 1024 and 390 px, plus
History at the four widths and one variant run (Legal & covenants blocked, eleven dates over two
years, no ratings): no sideways page scroll, no console errors at any width. First headline
figure at 1440x900: y = 863 (raw and realistic). Row heights at 1440, realistic / raw, against the
mockup's: call 511 / 367 (568); figures 366 (379); judgement 478 / 191 (397); structure 513
(474); stress 549 (428; 210 for headroom with Legal blocked); limits 598 (280: the synthetic run
records one limitation in each of twelve modules); pipeline 921 (S10's); dates 357 (230).
Seen and fixed in this pass: a downside value cut into the next panel (panels now as wide as their
longest value); the small Revenue figure breaking before its unit; the History collapse at 1280;
the issuer crumb's baseline at 390.

Checks: tsc pass; eslint --max-warnings=0 and prettier --check on every file changed since the
base pass; vitest src/pages/connected, src/styles, src/shell, src/components — 178 files, 2,544
tests pass; npm run unused — only LeadProps in the frozen leads/types.ts; npm run build pass.

### Render check (docs/design/preview/check-render.cjs), after round 2

Overview and History at 1440, 1280, 1024, 768 and 390, plain, `--stress` and with a fixture
(Legal & covenants blocked, eleven dates over two years, no ratings, a 62-character issuer name).
First pass: 142 failures, nearly all chart text under 12 px once a fixed viewBox scaled down.
Every figure is now drawn at its frame's measured width (12 px text, labels placed clear, ticks
thinned, long cells wrapped). Last pass: 9 / 9 / 11 failures, all from code outside S1: pipeline
node names cut at 1024 (and "Legal & covenants" at 1280/1440 in the fixture), PipelineRow (S10);
the shell nav scroll box at 390 (shell). PNGs looked at for every page and width.
