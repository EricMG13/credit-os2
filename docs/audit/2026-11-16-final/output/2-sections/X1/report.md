# Stage 2, section X1: shared components (both surfaces)

Audited commit: main 2b881075 (checkout `audit/out-sections-static`). X1 owns `web/src/components/`, `web/src/utils/`, `web/src/styles/theme.css`, `web/src/index.css` and `web/src/setup.ts` (`output/0-baseline/sections.md`). It has no screens of its own, so this pass did checks 2 (design critique) and 5 (code read) only, as the brief says. No paid call, no service started, no application file changed; every browser context aborted any request that was not loopback or `file:` (ruling R8).

(Written by the worker; placed in this file by the `sections-static` controller because the Write tool refuses report files from subagents. The worker was sent back once to read the 12 chart files in full; this is the revised text.)

## Result

26 findings: 0 High, 2 Medium, 12 Low, 12 Info (6 carry `owner_decision: true`: X1-009, X1-013, X1-017, X1-018, X1-020, X1-026). Findings are in `findings.jsonl`, the harmony rows in `harmony.csv` (24 retired rows, 25 unaccounted rows; X1 has no content-matrix or control-matrix rows), probes in `probes/`, captures in `evidence/`.

What the checks found worth the owner's attention, in order:

1. One zero-balance debt part makes every Model page of a run unreadable in the static app (X1-024, Medium): `StackChart` throws for a part that is not above zero and the static reader enforces the same rule, so a fixture with the last part set to 0 reads "This part of the library could not be read" on all six model pages. The connected app draws such a stack with its own hand-built bar. Whether the exporter ever emits a zero part is not established (its code is not in the repository), which is why it is Medium and not High; stage 4 may raise it.
2. A value label is cut off in a three-series column group (X1-019, Medium): the middle series' label is raised 16 px, and when its bar reaches the top tick the label's top sits 8 px above the drawing and is clipped (the "100" above the Notes bar is cut in half).
3. Three different headline-figure cards exist (X1-003): the kit `MetricCard` (24 px figure, 8 px radius), the library `MetricTile` (30 px, 12 px) and the model `MetricTile` (28 px, 28 px). None uses the design system's 40 px metric token.
4. Written-here text is below the 13 px floor (X1-001): chart ticks and labels, Table headings, the Timeline date, the MetricCard "from" figure, and 10 px ProgressSteps numerals. S1-014 has the rail and kit-text side of the same defect.
5. Accessibility on shared components: every warning Alert is `role="alert"`, including the permanent "Contrary evidence" passage on each Modules page (X1-005); every chart drawing is a `role="application"` named only by its title (X1-007); each path chart carries a focusable "scroll horizontally" region that does not scroll (X1-021); bar, stack and strip series differ by colour alone and chart-1 and chart-3 are nearly the same grey (X1-020, owner's palette).
6. Smaller design points: a range strip row with no range draws no case markers although their values are delivered (X1-023); the empty-state title is set in Geist, not the heading face (X1-002); a hovered tab looks exactly like the selected tab (X1-009, owner to choose between D-08 and D-27); the Card heading is always h3 (X1-012); a Table cell is blank for `undefined` or `""` (X1-004).

## Scope covered

| Item | Count | How |
| :--- | :--- | :--- |
| Component source files (non-test, non-fixture) under `web/src/components/` | 61 | all 61 read in full, including the 12 chart files added in this pass (BarCanvas, BulletChart, ColumnsChart, ComparisonChart, DumbbellChart, LimitsChart, PathChart, RangeStripChart, RowChart, ScatterPlot, StackChart, WaterfallChart) |
| Other X1 files | 5 | `utils/cx.ts`, `utils/is-react-component.ts`, `styles/theme.css`, `index.css`, `setup.ts`, read in full |
| Importers of every component | 61 | script over `web/src` (relative and `@/` imports) separating page, component, kit, Signal and test callers; Signal callers counted, none of the findings concerns a component only Signal uses |
| Kit-page sections | 25 | each opened in the shipped `web/dist/index.html#/kit` at 1440 and 390 px, screenshotted per section; 16 status sets, the live run state, 2 charts, 3 overlays |
| Chart kinds exercised outside the kit | 11 | rendered in an esbuild bundle of the real components (Columns, Waterfall, Stack, Scatter, Path, Limits) or on the static fixture Forecast page (RangeStrip); Bullet, Dumbbell, Comparison and RowChart were read in full and not rendered |
| Stage 0 inventory lines | 0 of 129 | the 129 `clickables.jsonl` lines tagged X1 are the connected shell rail; `sections.md` and the session notes give them to S1. X1 checks none of them |

States and widths: kit at 1440 and 390 px; reduced motion emulated; 53 keyboard stops walked with Tab; drawer and both modals opened with the keyboard, tabbed through, closed with Escape and by scrim click; contrast computed for 317 visible text runs; components outside the kit (Table cell values, Alert with block children, Timeline duplicates, thrown props, long Select and file names, tab hover, drop-zone invalid, column, limits, path, stack, waterfall and scatter charts) rendered in an esbuild bundle with React in development mode. A copy of the fixture with a zero debt part and one with an unknown module state were opened to see what the readers do. In-situ views came from the static fixture (`dist-fixture`): library Modules (contrary evidence), Overview, model Front, Portfolio fit and Forecast.

## Check 5 on the 12 chart files

- Handlers that do nothing: none in the chart code except the PathChart region's tab stop, which does nothing when the chart does not overflow (X1-021). State set and never read: none (`useWrappedAxis` width is read). Catch-alls that hide a failure: none; there is no `try` or `catch` in `components/chart/`, and bad props throw (see X1-008, X1-024).
- Props passed and unused: every optional chart prop (`rowLabels`, `divider`, `emphasis`, `emphasised`, `detailTable`, `subtitle`, `actions`) has a page caller; `barGap`, `labelOffset` and `nameAt` are set only by sibling chart components. Branches no input reaches: not found in these files.
- Duplicated blocks and misplaced helpers: X1-025. Table-against-chart figure checks differ between chart kinds: X1-022. Local colour constants: X1-026.

## Check 2 on the 12 chart files (rubric chart rules)

- D-14, missing never zero: every chart draws a missing value as no mark with n.a. (Columns and Waterfall write n.a. in the slot, Scatter lists "Not plotted", Bullet, Dumbbell, Comparison and Limits write n.a., SeriesLine uses `connectNulls={false}` so a line breaks); no `?? 0` on a value. One gap: X1-023 (no n.a. in a strip track whose markers are dropped).
- Status colours: none of the chart files uses a success, warning, error or info token; series use the chart palette only (X1-026 notes the waterfall's brand tint).
- D-30 text sizes: Columns, Waterfall, Path, Scatter and SeriesLine set SVG text at 12 px and LimitsChart and the Scatter "Not plotted" note at `text-xs` (X1-001); the row-style charts (Bullet, Dumbbell, RangeStrip, Comparison) use the 13 px caption or 14 px small.
- Keyboard: the five Recharts kinds (Columns, Waterfall, Stack, Scatter, Path, plus Trend from the kit) are one tab stop each and ArrowRight moves the readout to the next group, step, period or point, so the values are reachable without a pointer; the row-style charts and LimitsChart are plain DOM with every value as text and no tab stop. Aria: the Recharts surface is `role="application"` named by its title only (X1-007); the row-style charts have no role (their values are text).
- LimitsChart with five columns at 390 px: no label overlaps another and none leaves the plot.

## Rubric rules checked with no defect found in X1 files

- D-10 offline: the kit loads with no blocked request and no console message; Geist (400, 500, 600) and Schibsted Grotesk (600, 700) report `loaded` under `file:`; Geist Mono is declared and unloaded because nothing in X1 uses it. No gradient, `blur`, glow or hex literal outside `theme.css`; the only gradients are the ruled `gap-hatch`, `withheld-stripes`, `queued-shimmer` and the Button's inner-border mask. The modal scrim's `backdrop-blur` is the source component's own scrim (D-19 allows it).
- D-09 and D-40: loops are the Running halo, the Queued shimmer and the spinner; under `prefers-reduced-motion: reduce` no animation runs. The kit page draws all of them at rest (S1-004 covers that). No duration over 200 ms.
- D-29: no two states in one set share a shape (all 16 sets read). One cross-set point is in X1-017.
- D-33: 317 text runs on the kit, none below its threshold. D-34: every one of the 53 stops shows a 2 px focus ring or an inset ring on its field. D-35 and D-38: dialogs take focus, trap it, close on Escape and scrim, and return focus to the opener. D-37: every control on the kit has a name. D-41: the only targets under 24 px are the 16 px MetricCard info trigger and the 20 px link-style buttons, both passing by the spacing exception.
- D-08, D-18 to D-20, D-23 to D-25: only Untitled UI, HyperUI and own pieces; no emoji, no second icon package, no default Tailwind palette class.

## Not reached, and why

- The connected surface was not opened: no synthetic service was started. How the shared components are drawn there belongs to C1 to C5; where an X1 finding names a connected page (X1-012, X1-024) it is read from that page's code, not seen.
- Wiring (check 1), states (check 3) and the figure-by-figure harmony tie-out (check 4) are not X1's. Component states that can be reached only through a page (Table sort, Select open) were exercised on the kit only as far as the focus and keyboard sweep.
- The impeccable skill is not installed in this cloud session (ruling R7), so the critique is the rubric applied rule by rule to screenshots, computed styles and code.

Not verified: how a screen reader announces the Alert role (X1-005), the chart application role (X1-007), the path chart's scroll region (X1-021) and the LoadingIndicator status (X1-011), since none was run; whether any real run has a middle-series bar at the top tick (X1-019) or a zero-balance debt part (X1-024), and whether the exporter can emit one, since the exporter is not in the repository; Bullet, Dumbbell, Comparison and RowChart were read in full but not rendered, and the Waterfall, Stack, Scatter, Limits, Path and Columns charts were rendered with small hand-written data, not with a real run's series; Chrome on Windows and Edge (only Playwright's headless shell build 1243); the connected report pages that draw these components; the Tab, Select and Table sort states beyond the focus and keyboard sweep; the Tooltip on touch; the `Geist Mono` face (unused in X1); the design system and component map were read for the lines cited only, not in full.
