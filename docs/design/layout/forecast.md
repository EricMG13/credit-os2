# Report · Forecast

## Purpose and source contract

Show where the modeled credit goes under its named cases, which stated thresholds are approached or crossed, and when. Select the run's `Model` through `runModels(Snapshot, runKey, PublishedRun)` and the unique forward-model `OutputEntry` through `forecastHandoff(model, entries, runFolder)`. In the declared `Model` type (`web/src/pages/connected/publishedReport.ts`), `cashflow` is typed only as `{ limits: string[] } | null`; it does not type the runtime grid/case payload. The Forecast reader treats `ForecastModel.cashflow` as opaque input through `record`, `items`, `word` and `gridOf` (`web/src/pages/connected/visuals/LegacyForecast.tsx`). `gridOf` guards for nonempty columns/rows, nonempty column labels/groups and row labels, aligned cell counts, and nonempty cell display strings. These are reader guards, not a complete schema validator. The module-authored `T2H.4`–`T2H.8` tables are a separate source. The unique `Forecast inputs (machine-readable)` text block is parsed by `forecastInput` (`web/src/pages/connected/report/ForecastRecord.tsx`): one matching section, one fenced JSON block, valid JSON and a non-array object; no further field schema is asserted. Preserve all three source families separately; the page does not extend the forecast.

## Layout and components

- Keep the shared report header/tabs and a white judgement header with the forward-view bottom line and case selector when present.
- Use a large path visual across the lead area. Keep period labels, legend and trace together. Pair it with a compact stated break/limit summary; do not draw an unstated limit onto the model path.
- Place headline metrics below the header; assumptions in a case-by-case table; cash uses in a separate visual; and the annual grid lower on the page. Only draw row trends when at least three source periods are present.
- **Reuse:** report shell, `PageHeader`, `Tabs`, `ModuleStats`, `PathChart` (`web/src/components/chart/PathChart.tsx`), `ChartWithTable` (`web/src/components/chart/ChartWithTable.tsx`), `ColumnsChart` (`web/src/components/chart/ColumnsChart.tsx`), `StatusBadge`, `GapPanel`, `PublishedTraceProvider` for the drawer context, and `PublishedSource` for each item control (both from `web/src/pages/connected/report/PublishedTrace.tsx`). Case selection, path/support arrangement and source-family comparison are new composition.
- **New composition:** case selector/path layout, compact break summary and assumptions/uses arrangement. Avoid a generic chart-card wrapper that hides the case, period or limitation.

At 1280, keep the path and break summary side by side. At 1024, place the summary below the path. Keep table headers and cell gaps visible; don't replace an absent model point with a zero or connect across a gap.

## Data, trace and states

Read bottom line, cases, points, periods, stated peak, limit, break data, assumptions and cash uses from the published model outputs/handoff. Keep value strings and units exact. Forecast path source templates name the model output family; don't substitute illustrative values from this wireframe.

Use a broken line and visible gap treatment for missing years. Keep blocked/limited status with its reason, and show missing assumptions/inputs as gaps. Case selection cannot alter or recompute source values. Trace each figure, assumption row, case and prose passage; source references remain in Evidence/the trace drawer.

## Offline placeholder wireframe

[Open the standalone forecast wireframe](wireframes/forecast.html). This generic layout follows its screen map and contains no source values.
