# Issuer report layout build

This folder documents the reviewed layout proposal. Production implementation requires formal owner approval of the private mockups and this de-identified contract. It covers fifteen screens: the issuer Library; report Overview, Changes, Modules, Forecast, Evidence, Calendar and Deliverables; Run start; Run activity; and Signal. Coverage is specified by its own workstream and is outside this pass.

## Screen specifications

| Screen | Build specification | Placeholder wireframe |
|---|---|---|
| Library | [library.md](library.md) | [HTML](wireframes/library.html) |
| Overview | [overview.md](overview.md) | [HTML](wireframes/overview.html) |
| Changes | [changes.md](changes.md) | [HTML](wireframes/changes.html) |
| Modules: Sources, Validation and decision | [module-sources-validation.md](module-sources-validation.md) | [HTML](wireframes/module-sources-validation.html) |
| Modules: Financials | [module-financials.md](module-financials.md) | [HTML](wireframes/module-financials.html) |
| Modules: Credit | [module-credit-a.md](module-credit-a.md), [module-credit-b.md](module-credit-b.md) | [Credit A](wireframes/module-credit-a.html), [Credit B](wireframes/module-credit-b.html) |
| Modules: Structure and market | [module-structure.md](module-structure.md) | [HTML](wireframes/module-structure.html) |
| Forecast | [forecast.md](forecast.md) | [HTML](wireframes/forecast.html) |
| Evidence | [evidence.md](evidence.md) | [HTML](wireframes/evidence.html) |
| Calendar | [calendar.md](calendar.md) | [HTML](wireframes/calendar.html) |
| Deliverables | [deliverables.md](deliverables.md) | [HTML](wireframes/deliverables.html) |
| Run start | [run-start.md](run-start.md) | [HTML](wireframes/run-start.html) |
| Run activity | [run-activity.md](run-activity.md) | [HTML](wireframes/run-activity.html) |
| Signal | [signal.md](signal.md) | [HTML](wireframes/signal.html) |

Open the [standalone placeholder gallery](kit.html), or select a screen wireframe from the table above. Every page is static HTML with one shared local stylesheet. No mockup copy, source values, run identity, data attributes, scripts, network requests or font files are included.

## Typed source schema and handoff contract

- The connected report reader uses `Snapshot` from `web/src/pages/connected/publishedReport.ts`. The selected run is `Snapshot.workspace.runs[runFolder]`; its requested modules and outputs are `PublishedRun.modules[moduleCode].outputs[]` and `.default`.
- Resolve an output id through `Snapshot.workspace.outputs[outputId]`. Its `sha256` selects `Snapshot.workspace.handoffs[output.sha256]`, an array of `Section` records. Each section supplies `heading`, `level`, `line` and `blocks`; a prose block is `{type: "text", line, end, text}` and a table block is `{type: "table", line, headers, rows: [{line, cells}]}`. The reader must select the exact module-authored section/table, then preserve its values, wording, periods, units and basis.
- Library catalogue rows use `LibraryIndex.catalogue.real[]` / `Snapshot.catalogue.real[]` (`CatalogueRun`: `name`, optional `ticker`, `sector`, `date`, `period`, `metrics`). Each metric is read from `metrics[metricKey]` (`value`, `unit`, `period`, optional `prior.value` and `prior.period`). Do not derive a current/prior value or sort by an untyped stance.
- The report's other typed structures are `PublishedRun.changes`, `PublishedRun.evidence`, `Output.charts/events/maps`, `PublishedRun.lead`, and `Snapshot.workspace.models[]`. `PublishedTraceProvider` owns the connected report's drawer context; `PublishedSource` is the per-item trace control. Both are exported from `web/src/pages/connected/report/PublishedTrace.tsx` and have separate roles. Screen specs below give the relevant fields and handoff section families.
- Reused visual component paths on this base: `StatusBadge` (`web/src/components/status/StatusBadge.tsx`), `GapPanel` (`web/src/components/gap/GapPanel.tsx`), `Timeline` (`web/src/components/timeline/Timeline.tsx`), and `ChartWithTable`, `ChartTable`, `ColumnsChart`, `DumbbellChart`, `PathChart`, `RangeStripChart`, and `WaterfallChart` (`web/src/components/chart/`). The report lead primitives are `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` in `web/src/pages/connected/report/ModuleFrame.tsx`; `ModuleFrame.tsx` does not export a `ModuleFrame` component.
- Forecast selects the `Model` with `runModels` and the unique forward-model `OutputEntry` with `forecastHandoff`. In the declared `Model` type in `web/src/pages/connected/publishedReport.ts`, `cashflow` is typed only as `{ limits: string[] } | null`. Forecast runtime grid/case JSON is read opaquely from `ForecastModel.cashflow` through `record`, `items`, `word` and `gridOf` in `web/src/pages/connected/visuals/LegacyForecast.tsx`. `gridOf` guards for nonempty columns and rows, required nonempty labels/groups, matching row cell counts, and nonempty display strings; these checks are not a complete schema validator. The written case tables are T2H.4–T2H.8 in the selected module handoff. The separate unique `Forecast inputs (machine-readable)` text block is read by `forecastInput`, which requires one matching section, one fenced JSON text block, valid JSON and a non-array object; it does not validate a further field schema. Keep the model grid, written handoff tables and machine-readable input distinct; conflicts remain visible as conflicts/gaps.
- Run start uses the `Summary`, `Reading`, `DocumentRecord`, `ReadinessItem` and `CustomEstimate` contracts from `web/src/pages/connected/api.ts`. Run activity uses `ConnectedRun` and `RunEvent`. Signal uses `SignalSlice` / `SignalSnapshot` and the `SignalStory`/`SignalFeed` contracts in `web/src/pages/signal/slice.ts`.

### Existing test fixtures and their limits

These are pointers to committed synthetic fixtures/tests, not answer keys for a complete screen. Where a source-backed screen case is not covered, implementation adds an independent de-identified fixture before claiming screen-level answer-key coverage.

| Screen | Existing fixture or test | Proven scope / uncovered case |
|---|---|---|
| Library | [LibraryIndex metric-trace test](../../../web/src/pages/connected/LibraryIndex.metricTrace.test.tsx); [issuer-row test](../../../web/src/pages/connected/libraryRows/IssuerRow.test.tsx) | Metric cells, row rendering and trace behavior; no full de-identified catalogue plus selected-run snapshot fixture. |
| Overview | [overview row tests](../../../web/src/pages/connected/report/overview/callRows.test.tsx), [pipeline layout test](../../../web/src/pages/connected/report/overview/PipelineRow.layout.test.tsx), [structure row test](../../../web/src/pages/connected/report/overview/StructureRow.test.tsx) | Individual judgement, stage and structure readers; no full-screen snapshot answer key. |
| Changes | [comparison-row fixture](../../../tests/fixtures/changes-seam/rows.json); [Changes tests](../../../web/src/pages/connected/report/Changes.test.tsx) | Typed measure-row comparison states; no full two-run handoff, maturity and limitation-ledger fixture. |
| Modules · Sources, Validation and decision | [synthetic source-readiness fixture](../../../web/src/pages/connected/report/leads/fixtures/cp0_synthetic.json), [synthetic validation fixture](../../../web/src/pages/connected/report/leads/fixtures/cp5_synthetic.json), [synthetic decision fixture](../../../web/src/pages/connected/report/leads/fixtures/cp6_synthetic.json) | Module-specific synthetic handoff shapes; not an integrated module-frame snapshot. |
| Modules · Financials | [synthetic financial handoff](../../../apps/issuer-library/fixtures/synthetic-new-format/SYNTHETIC-CP-1.md); [foundation test](../../../web/src/pages/connected/report/leads/foundation/Foundation.test.tsx) | Financial-foundation sections and lead; no de-identified full group fixture for earnings change, peer range and earnings quality. |
| Modules · Credit A | [synthetic business handoff](../../../apps/issuer-library/fixtures/synthetic-new-format/SYNTHETIC-CP-1A.md), [synthetic fundamental-credit handoff](../../../apps/issuer-library/fixtures/synthetic-new-format/SYNTHETIC-CP-2.md) | Business/fundamental section shapes; research-question and downside cases need independent screen fixtures. |
| Modules · Credit B | [synthetic liquidity handoff](../../../apps/issuer-library/fixtures/synthetic-new-format/SYNTHETIC-CP-2D.md); [forward-data test](../../../web/src/pages/connected/report/forecastData.test.ts) | Liquidity and typed model-data behavior; no complete group fixture for exposures, forward model and ratings. |
| Modules · Structure and market | [synthetic refinancing handoff](../../../apps/issuer-library/fixtures/synthetic-new-format/SYNTHETIC-CP-3C.md); [module structure tests](../../../web/src/pages/connected/report/leads/cp3c.test.tsx) | Refinancing section shape; security, market, legal and recovery screen cases remain uncovered by a de-identified full fixture. |
| Forecast | [forecast data tests](../../../web/src/pages/connected/report/forecastData.test.ts), [forecast period tests](../../../web/src/pages/connected/report/Forecast.periods.test.tsx) | Period selection and model-cell handling; no full de-identified model plus written-case fixture for the exact forecast family. |
| Evidence | [Evidence source test](../../../web/src/pages/connected/report/EvidenceSources.test.tsx), [Evidence gaps test](../../../web/src/pages/connected/report/EvidenceGaps.test.tsx) | Source and gap components; no full de-identified evidence register/run-record snapshot. |
| Calendar | [Calendar axis test](../../../web/src/pages/connected/report/Calendar.axis.test.tsx), [unplaced-row test](../../../web/src/pages/connected/report/Calendar.unplaced-rows.test.tsx) | Axis precision and unplaced rows; no de-identified full event register. |
| Deliverables | [artifact-download state test](../../../web/src/pages/connected/report/ArtifactDownloads.states.test.tsx) | Availability/action states; no de-identified complete published-artifact inventory. |
| Run start | [document-step test](../../../web/src/pages/run/start/Documents.test.tsx), [purpose-card test](../../../web/src/pages/run/start/Purpose.cards.test.tsx), [start-page test](../../../web/src/pages/run/start/StartPage.test.tsx) | Intake controls and reviewed summary behavior; no de-identified full intake/readiness fixture. |
| Run activity | [activity page test](../../../web/src/pages/run/activity/ActivityPage.test.tsx), [summary test](../../../web/src/pages/run/activity/Summary.test.tsx) | Run state, progress summary and event presentation; no full de-identified event-sequence fixture. |
| Signal | [feed-state tests](../../../web/src/pages/signal/feedstates.test.tsx), [feed slice test](../../../web/src/pages/signal/slice.test.ts) | Empty/error presentation and typed slice reader; no source-backed story payload in the accepted review scope. Seeded sample stories are not an answer key for that empty source. |

## Shared layout contract

- Desktop only: support widths from 1024 px; prove 1024, 1280 and 1440 px with no page-level horizontal scroll. Each screen spec names its reflow changes.
- Use the established 12-column grid with 16 px gutters. Large tiles use the 20 px radius; nested cards use 12 px; wells and controls use 8 px; chips use 6 px. Cards have no shadow.
- Preserve the white hero and module judgement surfaces and the Credit OS brand. Blue is the selected-state chrome. Do not apply a selection tint to a judgement surface.
- Keep the shell, report header, report tabs, module frame, status and gap primitives, source trace drawer, chart/table conventions and existing accessible controls. Add screen-specific composition only where named by the screen spec.
- Keep the module navigator in the ordered stages `Sources`, `Financials`, `Credit`, `Structure and market`, `Validation and decision`. Changes since the earlier run belongs to `Validation and decision`.
- Findings pages retain the reader order: bottom line, key findings, contrary evidence and what would change the view, then limitations. Figures and prose keep their exact source basis, period, unit, qualification and trace.
- A missing value remains missing. Use the established gap or blocked state and its reason; do not substitute zero, interpolate, infer a direction, or silently omit an unavailable input the layout needs.
- Keep source references and raw trace material in Evidence or the trace drawer. Elsewhere, provide one trace control for each paragraph, row or figure. Module codes and source identifiers are not reader-facing copy.
- Wireframes below are independent, de-identified structural references. Their labels and geometric proportions are generic placeholders, not issuer content. Private review artifacts stay outside this repository.

## Pull request order and release gates

1. **Prerequisite:** merge the approved Colour work. Re-read its final tokens and component API, then run a pre-flight diff against the current base; resolve overlap before implementation.
2. **Approval gate:** before production implementation begins, record formal owner approval of the private mockups and this de-identified contract. Approval does not authorize changing analytical handoffs or source truth.
3. **PR 1 — shared foundation:** integrate the shell, brand, white hero/module surfaces, 12-column layout and shared primitives; build the module frame and five-stage navigator.
4. **PR 2 — modules:** implement the five grouped module screens against that frame, with screen-specific lead visuals and honest source gaps.
5. **PR 3 — issuer report:** implement Overview and Changes, then Forecast, Evidence, Calendar and Deliverables, reusing the shared report shell and trace behavior.
6. **PR 4 — workspace flows:** implement Library, Run start, Run activity and Signal. Keep Run activity and Overview in the five-stage order above.
7. For each implementation PR, keep a coherent diff at or below 800 changed lines. Review the diff before carrying it into the next PR.
8. Run `uv run python tools/quality_gate.py` for changed code. Run the design migration tests and render check at 1024, 1280 and 1440. Check keyboard/focus and accessible names for new controls. Add a scoped fidelity record to `VERIFICATION.md`.
9. Reconcile the rendered screens with actual handoffs, including values, periods, units, source references, limitations and conclusions. Keep expected values independent from production calculations. Preserve gaps where the input is unavailable.

Fixture pointers above are limited to the stated scopes. The new wireframes are not test data and must never replace an expected-value fixture. Keep expected values independent of production calculations. The quality gate applies to implementation code, not these specifications. The private mockups, their source material, screenshots, maps and raw source pointers are not build inputs to commit or publish.
