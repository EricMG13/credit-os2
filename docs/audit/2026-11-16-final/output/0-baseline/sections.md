# Stage 0: confirmed section table

Commit `960f35641edde8bb9cf79bfb9c6c7308fe430c05`. Probe:
`node docs/audit/2026-11-16-final/output/0-baseline/probes/sections.mjs` (prints JSON; reads files only).

## What was checked

- Every file the README names exists: **yes, all 31 named connected and shell files exist** (no file
  is missing).
- Every route the README names is declared in a `routes.tsx` (or, for `#/kit`, in `App.tsx`): **yes**.
  One declared route is not covered by the README's wording: `/library/:issuer/:run/evidence` (the
  bare Evidence address, which draws the Summary page). `…/evidence/*` does not match it.
- Every page file outside Signal belongs to exactly one section: **not before correction**. 92 of the
  273 page files (non-test `.ts`, `.tsx`, `.css` under `web/src`, plus the two HTML entries) were not
  named by the README's table, either as a file, as a folder it names, or as the page component of a
  route it names; after correction each is in exactly one section (appendix). Test files (`*.test.*`),
  `setup.ts`, `run/test-helpers.tsx`, `model/slice/test-fixture.ts`, `chart/ColumnsChart.fixtures.ts`,
  `visuals/EventLane.fixture.ts` and the `connected/*.cases.json` case files are imported only by
  tests and are not page files.

## Corrected table

All connected paths are under `web/src/pages/connected/`; `l/` is `web/src/pages/library/`.
**Bold** marks a correction (see the list below the table).

| Id | Section | Surface | Files or routes |
| :--- | :--- | :--- | :--- |
| C1 | Shell, library index, run activity and progress | Connected | `ConnectedApp.tsx`, `layout.tsx`, `LibraryIndex.tsx`, `RunActivity.tsx`, `RunProgress.tsx`, **`useResource.ts`, `runFigures.ts`, `web/connected.html`, `web/src/connected-main.tsx`, `web/src/ConnectedLoadBoundary.tsx`**; paths `/`, `/index.html`, `/runs`, `/run/<id>` |
| C2 | Start a run (all steps, review sheet, Submit dialog) | Connected | `StartRun.tsx`, `start/`, **`api.ts`**; path `/start`, `/start?from=<run>` |
| C3 | Report: overview, changes, modules | Connected | `ReportContent.tsx`, `HeadlineFigures.tsx`, **`ReportLibrary.tsx` (moved from C1)**, `report/Changes.tsx`, `report/Modules.tsx`, `report/ModuleTable.tsx`, `report/Confidence.tsx`, `report/MetricGrid.tsx`, **`report/IdentityBand.tsx`, `report/OverviewModules.tsx`, `report/ToneMark.tsx`, `report/YearChange.tsx`, `report/calculations.ts`, `publishedReport.ts`, `reportView.ts`, `signal.ts`, `sourceFiles.ts`**; path `/report/<folder>` with `#history`, `#overview`, `#changes`, `#modules`, `#modules/<code>` |
| C4 | Report: forecast and visuals | Connected | `report/Forecast.tsx`, `Downside`, `BreakPoints`, `MacroSensitivity`, `Securities`, `Calendar`, `PortfolioBasis`, `RunCharts`, `visuals/`; `#forecast`, `#calendar` (C4 visuals are also drawn inside `#modules/<code>`) |
| C5 | Report: evidence, trace, record, downloads | Connected | `report/Evidence.tsx`, `PublishedTrace`, `Record`, `ScriptChecks`, `ArtifactDownloads`, `comparisonTrace.ts`; `#evidence` and its sub-addresses |
| S1 | Shell, navigation, addresses, the kit page | Static | `web/src/shell/`, `App.tsx`, `route.ts`, `route-table.ts`, `#/kit`, **`Kit.tsx`, `Kit7c.tsx` to `Kit7g.tsx`, `web/index.html`, `web/src/main.tsx`, `web/src/data.ts`, `pages/source.ts`**; the data-file states (missing, newer schema) |
| S2 | Library home, history, overview, changes | Static | `/library/home`, `/library/:issuer/history`, `…/overview`, `…/changes`; **files `l/Home.tsx`, `l/History.tsx`, `l/Overview.tsx`, `l/Changes.tsx`, `l/routes.tsx`, `l/read.ts`, `l/slice.ts` and 25 shared `l/parts/` files (appendix)** |
| S3 | Library modules | Static | `…/modules`, `…/modules/:module`; **files `l/Module.tsx` and 21 `l/parts/` files (appendix)** |
| S4 | Library evidence and trace | Static | **`…/evidence`**, `…/evidence/*`; **files `l/Evidence*.tsx` (6) and 10 `l/parts/` files (appendix)** |
| S5 | Model | Static | `/model/*`; `web/src/pages/model/` |
| S6 | Run start and run activity | Static | `/run/start/:draft`, `/run/activity`, `/run/activity/:run`; `web/src/pages/run/` |
| X1 | Shared components | Both | `web/src/components/`, **`web/src/index.css`, `web/src/styles/theme.css`, `web/src/utils/`** |

## Corrections made (each flagged in bold above)

1. **`ReportLibrary.tsx` moved from C1 to C3.** The file holds the report reader (`ReportReader`:
   the report header, the "Report sections" tab navigation, the Report-history tab and the Overview
   composition). The library index is `LibraryIndex.tsx`, whose exported component is confusingly
   named `ReportLibrary` (`ConnectedApp.tsx:7-9`).
2. **Unlisted connected files assigned:** `useResource.ts` and `runFigures.ts` (C1), `api.ts` (C2),
   `publishedReport.ts`, `reportView.ts`, `signal.ts`, `sourceFiles.ts` and `report/IdentityBand.tsx`,
   `OverviewModules.tsx`, `ToneMark.tsx`, `YearChange.tsx`, `calculations.ts` (C3), and the connected
   entry files (C1). `api.ts` is the client for every connected section; it sits in C2 because the
   Start-a-run files import it most, and `api-map.md` is the reference for all its calls.
   `connected/signal.ts` is a decimal-sign helper used by Changes; it is not the Signal product.
3. **Kit files named in S1:** `#/kit` was listed but not `Kit.tsx` and `Kit7c.tsx`–`Kit7g.tsx`.
   There is no `Kit7b.tsx`; `Kit7b.test.tsx` tests sections of `Kit.tsx`.
4. **Static entry and data files named in S1:** `web/index.html`, `main.tsx`, `data.ts`, `source.ts`.
5. **S2–S4 given files:** the README named only routes. The library page files and the 58
   `l/parts/` files are now assigned (appendix). Rule for a part used by several sections: the
   section with the most direct importers within its own folder's surface, ties to table order.
6. **S4 route `…/evidence` added** (declared in `library/routes.tsx`, not matched by `…/evidence/*`).
7. **X1 extended** to the stylesheets both entries load and `web/src/utils/`.

## Cross-surface sharing (not a correction; for stage 2's harmony check)

The connected app imports 29 files from the static app's folders, so a change there reaches both
surfaces: 19 from `web/src/pages/library/` (`slice.ts` and the parts BottomLine, ChangeCard,
DerivationTree, DownloadButton, MatrixBlock, MetricTile, ModuleNav, QuestionsBlock, RunContext,
RunFrame, SourceFileLinks, SourcesSwitch, StatementBlock, StatusBlock, TraceControl, TraceDrawer,
WatchBlock, heading), 8 from `web/src/pages/run/` (TextLink, activity/Feed, activity/ModuleSteps,
activity/Summary, slice-activity, start/Purpose, start/Start, start/Stepper) and 2 from
`web/src/shell/` (Shell, PageHeader). The "Imported directly by sections" column of the appendix
lists every such case.

## Appendix: every page file and its one section

Generated by the probe above (`files[]`: file, section, rule, importedBy).

| File | Section | Rule | Imported directly by sections |
| :--- | :--- | :--- | :--- |
| `web/connected.html` | C1 | named | (entry) |
| `web/index.html` | S1 | named | (entry) |
| `web/src/App.tsx` | S1 | named | S1 |
| `web/src/ConnectedLoadBoundary.tsx` | C1 | named | C1 |
| `web/src/components/alert/Alert.tsx` | X1 | named | C1, C3, S1, S2, S3, S4, S6 |
| `web/src/components/application/app-navigation/base-components/nav-button.tsx` | X1 | named | S1 |
| `web/src/components/application/empty-state/empty-state.tsx` | X1 | named | C1, C3, S1, S2, S4, S5, S6 |
| `web/src/components/application/file-upload/file-upload-base.tsx` | X1 | named | C2, S1, S6 |
| `web/src/components/application/loading-indicator/loading-indicator.tsx` | X1 | named | S1, S6 |
| `web/src/components/application/modals/modal.tsx` | X1 | named | S1, S4, S6 |
| `web/src/components/application/slideout-menus/slideout-menu.tsx` | X1 | named | S1, S2 |
| `web/src/components/application/table/table.tsx` | X1 | named | C1, S1, S2 |
| `web/src/components/application/tabs/tabs.tsx` | X1 | named | S1, S5 |
| `web/src/components/base/badges/badge-types.ts` | X1 | named | X1 |
| `web/src/components/base/badges/badges.tsx` | X1 | named | C1, C2, C3, C5, S1, S2, S3, S4, S5, S6, X1 |
| `web/src/components/base/button-group/button-group.tsx` | X1 | named | C1, C3, S1, S2, S5, X1 |
| `web/src/components/base/buttons/button-utility.tsx` | X1 | named | S4, S6, X1 |
| `web/src/components/base/buttons/button.tsx` | X1 | named | C1, C2, C3, C4, C5, S1, S2, S3, S4, S5, S6, X1 |
| `web/src/components/base/buttons/close-button.tsx` | X1 | named | X1 |
| `web/src/components/base/input/hint-text.tsx` | X1 | named | S6, X1 |
| `web/src/components/base/input/input.tsx` | X1 | named | S1, S2 |
| `web/src/components/base/input/label.tsx` | X1 | named | S6, X1 |
| `web/src/components/base/progress-indicators/progress-indicators.tsx` | X1 | named | C1, C2, C5, S1, S2, S4, S6, X1 |
| `web/src/components/base/select/popover.tsx` | X1 | named | X1 |
| `web/src/components/base/select/select-item.tsx` | X1 | named | X1 |
| `web/src/components/base/select/select-shared.tsx` | X1 | named | X1 |
| `web/src/components/base/select/select.tsx` | X1 | named | S1, S2 |
| `web/src/components/base/tooltip/tooltip.tsx` | X1 | named | S1, S2, S3, S5, X1 |
| `web/src/components/card/Card.tsx` | X1 | named | C1, S1, S2, S5, S6 |
| `web/src/components/chart/BarCanvas.tsx` | X1 | named | X1 |
| `web/src/components/chart/BulletChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/ChartFrame.tsx` | X1 | named | X1 |
| `web/src/components/chart/ChartTable.tsx` | X1 | named | C4, S2, S3, X1 |
| `web/src/components/chart/ChartWithTable.tsx` | X1 | named | C4, X1 |
| `web/src/components/chart/ColumnsChart.tsx` | X1 | named | C3, C4, S5, X1 |
| `web/src/components/chart/ComparisonChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/DumbbellChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/LimitsChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/PairTile.tsx` | X1 | named | S5 |
| `web/src/components/chart/PathChart.tsx` | X1 | named | C4, S5, X1 |
| `web/src/components/chart/RangeStripChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/RowChart.tsx` | X1 | named | C4, X1 |
| `web/src/components/chart/RowCharts.helpers.ts` | X1 | named | (entry) |
| `web/src/components/chart/ScatterPlot.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/SeriesLine.tsx` | X1 | named | X1 |
| `web/src/components/chart/StackChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/TrendChart.tsx` | X1 | named | C4, S1, X1 |
| `web/src/components/chart/WaterfallChart.tsx` | X1 | named | C4, S5 |
| `web/src/components/chart/marks.tsx` | X1 | named | X1 |
| `web/src/components/chart/series.ts` | X1 | named | X1 |
| `web/src/components/chart/seriesData.ts` | X1 | named | X1 |
| `web/src/components/foundations/dot-icon.tsx` | X1 | named | X1 |
| `web/src/components/foundations/featured-icon/featured-icon.tsx` | X1 | named | S1, S6, X1 |
| `web/src/components/gap/Blocked.tsx` | X1 | named | S1, S3, S5 |
| `web/src/components/gap/GapPanel.tsx` | X1 | named | C3, C4, S1, S2, S3, S5 |
| `web/src/components/gap/Missing.tsx` | X1 | named | C4, S1, S2, S3, S4, S5, S6, X1 |
| `web/src/components/gap/Skeleton.tsx` | X1 | named | S1, S2, S6 |
| `web/src/components/gap/Withheld.tsx` | X1 | named | S1, S2, S3, S4, S5, X1 |
| `web/src/components/metric/MetricCard.tsx` | X1 | named | S1, X1 |
| `web/src/components/path/plain.ts` | X1 | named | S2, S5 |
| `web/src/components/status/StatusBadge.tsx` | X1 | named | C1, C2, C3, C4, C5, S1, S2, S3, S4, S5, S6, X1 |
| `web/src/components/status/sets.ts` | X1 | named | C4, S1, S2, S3, S5, S6, X1 |
| `web/src/components/status/shapes.tsx` | X1 | named | C1, C3, C4, S2, S3, S4, S5, S6, X1 |
| `web/src/components/steps/ProgressSteps.tsx` | X1 | named | S1 |
| `web/src/components/timeline/Timeline.tsx` | X1 | named | S1, S2 |
| `web/src/connected-main.tsx` | C1 | named | C1 |
| `web/src/data.ts` | S1 | override: shared by both entries or the static app's data context | S1 |
| `web/src/index.css` | X1 | override: shared by both entries or the static app's data context | C1, S1 |
| `web/src/main.tsx` | S1 | named | S1 |
| `web/src/pages/Kit.tsx` | S1 | named | S1 |
| `web/src/pages/Kit7c.tsx` | S1 | only importer's section | S1 |
| `web/src/pages/Kit7d.tsx` | S1 | only importer's section | S1 |
| `web/src/pages/Kit7e.tsx` | S1 | only importer's section | S1 |
| `web/src/pages/Kit7f.tsx` | S1 | only importer's section | S1 |
| `web/src/pages/Kit7g.tsx` | S1 | only importer's section | S1 |
| `web/src/pages/connected/ConnectedApp.tsx` | C1 | named | C1 |
| `web/src/pages/connected/HeadlineFigures.tsx` | C3 | named | C1, C3 |
| `web/src/pages/connected/LibraryIndex.tsx` | C1 | named | C1 |
| `web/src/pages/connected/ReportContent.tsx` | C3 | named | C3, C4, C5 |
| `web/src/pages/connected/ReportLibrary.tsx` | C3 | named | C1 |
| `web/src/pages/connected/RunActivity.tsx` | C1 | named | C1 |
| `web/src/pages/connected/RunProgress.tsx` | C1 | named | C1 |
| `web/src/pages/connected/StartRun.tsx` | C2 | named | C1 |
| `web/src/pages/connected/api.ts` | C2 | shared: most direct importers in its own folder's surface | C1, C2, C3, C4, C5 |
| `web/src/pages/connected/layout.tsx` | C1 | named | C1, C2, C3, C4, C5 |
| `web/src/pages/connected/publishedReport.ts` | C3 | shared: most direct importers in its own folder's surface | C1, C3, C4, C5 |
| `web/src/pages/connected/report/ArtifactDownloads.tsx` | C5 | named | C5 |
| `web/src/pages/connected/report/BreakPoints.tsx` | C4 | named | C3 |
| `web/src/pages/connected/report/Calendar.tsx` | C4 | named | C3 |
| `web/src/pages/connected/report/Changes.tsx` | C3 | named | C3 |
| `web/src/pages/connected/report/Confidence.tsx` | C3 | named | C3 |
| `web/src/pages/connected/report/Downside.tsx` | C4 | named | C3, C4 |
| `web/src/pages/connected/report/Evidence.tsx` | C5 | named | C3 |
| `web/src/pages/connected/report/Forecast.tsx` | C4 | named | C3 |
| `web/src/pages/connected/report/IdentityBand.tsx` | C3 | only importer's section | C3 |
| `web/src/pages/connected/report/MacroSensitivity.tsx` | C4 | named | C3 |
| `web/src/pages/connected/report/MetricGrid.tsx` | C3 | named | C3 |
| `web/src/pages/connected/report/ModuleTable.tsx` | C3 | named | C3 |
| `web/src/pages/connected/report/Modules.tsx` | C3 | named | C3 |
| `web/src/pages/connected/report/OverviewModules.tsx` | C3 | only importer's section | C3 |
| `web/src/pages/connected/report/PortfolioBasis.tsx` | C4 | named | C3, C4 |
| `web/src/pages/connected/report/PublishedTrace.tsx` | C5 | named | C3, C4 |
| `web/src/pages/connected/report/Record.tsx` | C5 | named | C5 |
| `web/src/pages/connected/report/RunCharts.tsx` | C4 | named | C4 |
| `web/src/pages/connected/report/ScriptChecks.tsx` | C5 | named | C5 |
| `web/src/pages/connected/report/Securities.tsx` | C4 | named | C3 |
| `web/src/pages/connected/report/ToneMark.tsx` | C3 | shared: most direct importers in its own folder's surface | C3, S2 |
| `web/src/pages/connected/report/YearChange.tsx` | C3 | shared: most direct importers in its own folder's surface | C3, S2 |
| `web/src/pages/connected/report/calculations.ts` | C3 | only importer's section | C3 |
| `web/src/pages/connected/report/comparisonTrace.ts` | C5 | named | C3 |
| `web/src/pages/connected/reportView.ts` | C3 | shared: most direct importers in its own folder's surface | C3, C4, C5 |
| `web/src/pages/connected/runFigures.ts` | C1 | shared: most direct importers in its own folder's surface | C1, C5 |
| `web/src/pages/connected/signal.ts` | C3 | only importer's section | C3 |
| `web/src/pages/connected/sourceFiles.ts` | C3 | shared: most direct importers in its own folder's surface | C3, C5 |
| `web/src/pages/connected/start/ReviewSheet.tsx` | C2 | named | C2 |
| `web/src/pages/connected/start/RowEditor.tsx` | C2 | named | C2 |
| `web/src/pages/connected/start/StartReadiness.tsx` | C2 | named | C2 |
| `web/src/pages/connected/start/limits.ts` | C2 | named | C2 |
| `web/src/pages/connected/start/plain.ts` | C2 | named | C2 |
| `web/src/pages/connected/start/rows.ts` | C2 | named | C2 |
| `web/src/pages/connected/useResource.ts` | C1 | shared: most direct importers in its own folder's surface | C1, C2, C3, C4, C5 |
| `web/src/pages/connected/visuals/ChartQualifications.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/EdgeMap.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/EventLane.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/ForecastTable.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/LegacyForecast.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/PortfolioLimits.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/charts.tsx` | C4 | named | C4 |
| `web/src/pages/connected/visuals/drawnQualifications.ts` | C4 | named | C3, C4 |
| `web/src/pages/connected/visuals/index.tsx` | C4 | named | C3, C4 |
| `web/src/pages/connected/visuals/visualData.ts` | C4 | named | C3, C4 |
| `web/src/pages/library/Changes.tsx` | S2 | named | S2 |
| `web/src/pages/library/Evidence.tsx` | S4 | named | S2 |
| `web/src/pages/library/EvidenceGaps.tsx` | S4 | named | S4 |
| `web/src/pages/library/EvidenceRecord.tsx` | S4 | named | S4 |
| `web/src/pages/library/EvidenceSources.tsx` | S4 | named | S4 |
| `web/src/pages/library/EvidenceSummary.tsx` | S4 | named | S4 |
| `web/src/pages/library/EvidenceTrace.tsx` | S4 | named | S4 |
| `web/src/pages/library/History.tsx` | S2 | named | S2 |
| `web/src/pages/library/Home.tsx` | S2 | named | S2 |
| `web/src/pages/library/Module.tsx` | S3 | named | S2 |
| `web/src/pages/library/Overview.tsx` | S2 | named | S2 |
| `web/src/pages/library/parts/BottomLine.tsx` | S2 | shared: most direct importers in its own folder's surface | C3, S2, S3 |
| `web/src/pages/library/parts/CellValue.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/ChangeCard.tsx` | S2 | shared: most direct importers in its own folder's surface | C3, S2 |
| `web/src/pages/library/parts/ChangeViewNote.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/ChangesTable.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/ChartTableBlock.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/CopyToast.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/DerivationTree.tsx` | S2 | shared: most direct importers in its own folder's surface | C5, S2, S4 |
| `web/src/pages/library/parts/DirectionMark.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/DownloadButton.tsx` | S4 | shared: most direct importers in its own folder's surface | C3, C5, S4 |
| `web/src/pages/library/parts/EdgesBlock.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/EvidenceFrame.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/FactsBlock.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/FilterBar.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S4 |
| `web/src/pages/library/parts/Findings.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/GapBlock.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/InlineCell.tsx` | S3 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/IssuerCard.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/IssuerList.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/JumpMenu.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/LibraryPage.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/Limitations.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/MatrixBlock.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, S3 |
| `web/src/pages/library/parts/Measure.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/MeasuresBlock.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/MetricTile.tsx` | S2 | shared: most direct importers in its own folder's surface | C3, S2, S3, S4 |
| `web/src/pages/library/parts/MetricsBlock.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/ModuleFilter.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/ModuleItems.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/ModuleNav.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, S3 |
| `web/src/pages/library/parts/NotHeld.tsx` | S2 | shared: most direct importers in its own folder's surface | S2, S3 |
| `web/src/pages/library/parts/PageTitle.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/QuestionsBlock.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, S3 |
| `web/src/pages/library/parts/Readers.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/Records.tsx` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/RegisterPage.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/RegisterTable.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/RunContext.ts` | S2 | shared: most direct importers in its own folder's surface | C3, S2, S3 |
| `web/src/pages/library/parts/RunFeed.tsx` | S2 | only importer's section | S2 |
| `web/src/pages/library/parts/RunFrame.tsx` | S2 | shared: most direct importers in its own folder's surface | C3, C5, S2, S3, S4 |
| `web/src/pages/library/parts/Section.tsx` | S3 | shared: most direct importers in its own folder's surface | S2, S3, S4 |
| `web/src/pages/library/parts/Snippet.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/SourceFileLinks.tsx` | S2 | shared: most direct importers in its own folder's surface | C5, S2 |
| `web/src/pages/library/parts/SourceFileRow.tsx` | S4 | only importer's section | S4 |
| `web/src/pages/library/parts/SourcesSwitch.tsx` | S2 | shared: most direct importers in its own folder's surface | C3, S2 |
| `web/src/pages/library/parts/StatementBlock.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, S3 |
| `web/src/pages/library/parts/StatusBlock.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, S3 |
| `web/src/pages/library/parts/TableCard.tsx` | S3 | shared: most direct importers in its own folder's surface | S2, S3, S4 |
| `web/src/pages/library/parts/TraceControl.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, C4, C5, S2, S3, X1 |
| `web/src/pages/library/parts/TraceDrawer.tsx` | S2 | shared: most direct importers in its own folder's surface | C3, C5, S2 |
| `web/src/pages/library/parts/WatchBlock.tsx` | S3 | shared: most direct importers in its own folder's surface | C3, S3 |
| `web/src/pages/library/parts/chartCell.ts` | S2 | shared: most direct importers in its own folder's surface | S2, S3, S4 |
| `web/src/pages/library/parts/chartTableStyle.ts` | S3 | only importer's section | S3 |
| `web/src/pages/library/parts/heading.ts` | S3 | shared: most direct importers in its own folder's surface | C3, S2, S3, S4 |
| `web/src/pages/library/parts/links.ts` | S2 | shared: most direct importers in its own folder's surface | S2, S3, S4 |
| `web/src/pages/library/parts/recordNav.ts` | S3 | only importer's section | S3 |
| `web/src/pages/library/read.ts` | S2 | only importer's section | S2 |
| `web/src/pages/library/routes.tsx` | S2 | override: shared by both entries or the static app's data context | S1 |
| `web/src/pages/library/slice.ts` | S2 | shared: most direct importers in its own folder's surface | C3, C5, S2, S3, S4 |
| `web/src/pages/model/AnalysisPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/ForecastPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/FrontPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/LimitationsPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/PortfolioFitPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/RunsIndexPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/StatementsPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/Banner.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/CaseCards.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/Collapsible.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/DetailsList.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/Item.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/ListPanel.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/MetricTile.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/ModelShell.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/Passage.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/PublishedModel.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/RunPage.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/SectionIndex.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/ShowSources.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/Stat.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/StatementTable.tsx` | S5 | named | S5 |
| `web/src/pages/model/parts/TraceControl.tsx` | S5 | named | S5 |
| `web/src/pages/model/routes.tsx` | S5 | named | S1 |
| `web/src/pages/model/runAddress.ts` | S5 | named | S5 |
| `web/src/pages/model/sections/AnalysisCharts.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/Bridges.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/CaseComparison.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/ColumnsCard.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/DebtSection.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/ForecastCharts.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/PortfolioCharts.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/RecoverySection.tsx` | S5 | named | S5 |
| `web/src/pages/model/sections/shared.tsx` | S5 | named | S5 |
| `web/src/pages/model/slice/read-analysis.ts` | S5 | named | S5 |
| `web/src/pages/model/slice/read-forecast.ts` | S5 | named | S5 |
| `web/src/pages/model/slice/read-portfolio.ts` | S5 | named | S5 |
| `web/src/pages/model/slice/read-sections.ts` | S5 | named | S5 |
| `web/src/pages/model/slice/read.ts` | S5 | named | S5 |
| `web/src/pages/model/slice/reader-kit.ts` | S5 | named | S5 |
| `web/src/pages/model/slice/types.ts` | S5 | named | S5 |
| `web/src/pages/route-table.ts` | S1 | named | S1, S2, S5, S6 |
| `web/src/pages/run/TextLink.tsx` | S6 | named | C1, C3, S6 |
| `web/src/pages/run/activity/ActivityPage.tsx` | S6 | named | S6 |
| `web/src/pages/run/activity/Feed.tsx` | S6 | named | C1, S6 |
| `web/src/pages/run/activity/ModuleSteps.tsx` | S6 | named | C1, S6 |
| `web/src/pages/run/activity/RunAlert.tsx` | S6 | named | S6 |
| `web/src/pages/run/activity/Summary.tsx` | S6 | named | C1, S6 |
| `web/src/pages/run/activity/activity.css` | S6 | named | S6 |
| `web/src/pages/run/reasons.ts` | S6 | named | S6 |
| `web/src/pages/run/routes.tsx` | S6 | named | S1 |
| `web/src/pages/run/slice-activity.ts` | S6 | named | C1, S6 |
| `web/src/pages/run/slice-read.ts` | S6 | named | S6 |
| `web/src/pages/run/slice-start.ts` | S6 | named | S6 |
| `web/src/pages/run/slice.ts` | S6 | named | S6 |
| `web/src/pages/run/start/Confirm.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/Context.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/DetailsList.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/Documents.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/Purpose.tsx` | S6 | named | C2, S6 |
| `web/src/pages/run/start/Readiness.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/Start.tsx` | S6 | named | C2, S6 |
| `web/src/pages/run/start/StartPage.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/Started.tsx` | S6 | named | S6 |
| `web/src/pages/run/start/Stepper.tsx` | S6 | named | C2, S6 |
| `web/src/pages/source.ts` | S1 | override: shared by both entries or the static app's data context | S1, S2, S5, S6 |
| `web/src/route.ts` | S1 | named | S1 |
| `web/src/shell/PageHeader.tsx` | S1 | named | C1, C2, C3, S1, S2, S5, S6 |
| `web/src/shell/Shell.tsx` | S1 | named | C1, S1 |
| `web/src/styles/theme.css` | X1 | override: shared by both entries or the static app's data context | (entry) |
| `web/src/utils/cx.ts` | X1 | override: shared by both entries or the static app's data context | C4, S2, S3, S4, S5, S6, X1 |
| `web/src/utils/is-react-component.ts` | X1 | override: shared by both entries or the static app's data context | C3, S1, X1 |
