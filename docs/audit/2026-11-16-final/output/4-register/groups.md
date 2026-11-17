# Repair groups (stage 4)

Each group is one `repair-<n>` session (`sessions/repair.md`). No file is in two groups.

## Group 1: Connected shell, run activity, Start a run, the service and the synthetic proof

Tasks, in order: T01, T01b, T02, T03, T04, T05, T07, T08, T09, T10, T11, T12.

Findings: 28 (plus their merged ids).

Files:

- `docs/react-workflow.md`
- `proof/launcher.py`
- `react_frontend/__init__.py`
- `react_frontend/run_activity.py`
- `react_frontend/sources.py`
- `src/deploy_workflow/credit_os_catalogue.py`
- `src/deploy_workflow/inbox/runs.py`
- `src/deploy_workflow/inbox/scheduler.py`
- `src/deploy_workflow/inbox/teams.py`
- `src/deploy_workflow/run_start/submissions.py`
- `web/src/pages/connected/LibraryIndex.tsx`
- `web/src/pages/connected/RunActivity.tsx`
- `web/src/pages/connected/RunProgress.tsx`
- `web/src/pages/connected/StartRun.tsx`
- `web/src/pages/connected/api.ts`
- `web/src/pages/connected/layout.tsx`
- `web/src/pages/connected/runFigures.ts`
- `web/src/pages/connected/start/ReviewSheet.tsx`
- `web/src/pages/connected/start/plain.ts`
- `web/src/pages/connected/useResource.ts`

## Group 2: Connected report

Tasks, in order: T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T42.

Findings: 32 (plus their merged ids).

Files:

- `src/deploy_workflow/confidence.py`
- `src/deploy_workflow/credit_os_chips.py`
- `src/deploy_workflow/owners/cpos_forecast.py`
- `src/deploy_workflow/owners/cpos_periods.py`
- `web/src/components/chart/BarCanvas.tsx`
- `web/src/components/chart/ChartTable.tsx`
- `web/src/components/chart/ColumnsChart.tsx`
- `web/src/components/chart/StackChart.tsx`
- `web/src/components/chart/TrendChart.tsx`
- `web/src/pages/connected/HeadlineFigures.tsx`
- `web/src/pages/connected/ReportContent.tsx`
- `web/src/pages/connected/ReportLibrary.tsx`
- `web/src/pages/connected/publishedReport.ts`
- `web/src/pages/connected/report/ArtifactDownloads.tsx`
- `web/src/pages/connected/report/Calendar.tsx`
- `web/src/pages/connected/report/Downside.tsx`
- `web/src/pages/connected/report/Evidence.t21-fix1.test.tsx`
- `web/src/pages/connected/report/Evidence.tsx`
- `web/src/pages/connected/report/Forecast.tsx`
- `web/src/pages/connected/report/Modules.tsx`
- `web/src/pages/connected/report/RunCharts.tsx`
- `web/src/pages/connected/reportView.ts`
- `web/src/pages/connected/sourceFiles.ts`
- `web/src/pages/connected/visuals/ForecastTable.tsx`
- `web/src/pages/connected/visuals/LegacyForecast.tsx`
- `web/src/pages/connected/visuals/charts.tsx`
- `web/src/pages/connected/visuals/visualData.ts`
- `web/src/pages/library/parts/SourceFileLinks.tsx`
- `web/src/pages/library/parts/TraceDrawer.tsx`
- `web/src/pages/model/slice/read-sections.ts`

## Group 3: Static app and the library parts both surfaces draw

Tasks, in order: T25, T26, T27, T31, T32, T33, T34, T35, T37, T38, T39, T40, T41.

Findings: 20 (plus their merged ids).

Files:

- `web/src/App.tsx`
- `web/src/components/base/badges/badges.tsx`
- `web/src/pages/library/Evidence.tsx`
- `web/src/pages/library/EvidenceRecord.tsx`
- `web/src/pages/library/History.tsx`
- `web/src/pages/library/Home.tsx`
- `web/src/pages/library/Module.tsx`
- `web/src/pages/library/Overview.tsx`
- `web/src/pages/library/parts/ChangesTable.tsx`
- `web/src/pages/library/parts/EvidenceFrame.tsx`
- `web/src/pages/library/parts/LibraryPage.tsx`
- `web/src/pages/library/parts/ModuleFilter.tsx`
- `web/src/pages/library/parts/ModuleNav.tsx`
- `web/src/pages/library/parts/RegisterTable.tsx`
- `web/src/pages/library/parts/RunFeed.tsx`
- `web/src/pages/library/parts/RunFrame.tsx`
- `web/src/pages/library/parts/TraceControl.tsx`
- `web/src/pages/library/parts/links.ts`
- `web/src/pages/library/read.ts`
- `web/src/pages/library/routes.tsx`
- `web/src/pages/library/slice.ts`
- `web/src/pages/model/ForecastPage.tsx`
- `web/src/pages/model/RunsIndexPage.tsx`
- `web/src/pages/model/parts/MetricTile.tsx`
- `web/src/pages/model/parts/RunPage.tsx`
- `web/src/pages/model/parts/StatementTable.tsx`
- `web/src/pages/model/parts/TraceControl.tsx`
- `web/src/pages/model/routes.tsx`
- `web/src/pages/model/slice/read.ts`
- `web/src/pages/route-table.ts`
- `web/src/pages/run/activity/ActivityPage.tsx`
- `web/src/pages/run/routes.tsx`
- `web/src/pages/run/start/Purpose.tsx`
- `web/src/pages/run/start/Start.tsx`
- `web/src/pages/run/start/Started.tsx`
- `web/src/shell/Shell.tsx`
- `web/src/styles/theme.css`
