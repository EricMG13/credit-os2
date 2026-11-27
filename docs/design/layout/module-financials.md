# Modules · Financials

## Purpose and source contract

Present financial foundation, earnings changes, peer benchmark and earnings quality in the shared module layout. Follow `PublishedRun.modules[moduleCode].outputs[]` → `Snapshot.workspace.outputs[outputId]` → `Snapshot.workspace.handoffs[output.sha256]`; use each exact `Section.heading` and typed `blocks[]`. Table blocks supply `headers` and `rows[].cells[]`; text blocks preserve `line`, `end` and `text`. Relevant table families are financial-foundation leverage, debt maturities, debt stack, income statement, net debt and segments; earnings changes' prior/current results, KPI changes and variance register; peer benchmark positioning/range; earnings quality's quality-adjusted bridge. Handoffs remain the sole source for values, periods, units, conclusions and limitations.

## Module routing: code to pane and reader

Route each pane by the canonical module code. Its lead reads only that module's typed output sections and tables. `Chart data:` denotes the exact matching section heading and its typed table; no visual creates a replacement table.

| Module code | Pane | Built lead | Exact typed section or visual mapping |
|---|---|---|---|
| `CP-1` | Financial foundation | `FoundationLead` (`web/src/pages/connected/report/leads/foundation/Foundation.tsx`) | `Chart data:` selectors for Revenue and EBITDA, Leverage, Liquidity, EBITDA bridge, Interest cover, Debt stack and Debt maturities; typed financial figures and periods remain as written. |
| `CP-1B` | Earnings changes | `EarningsDeltaLead` (`web/src/pages/connected/report/leads/earningsDelta.tsx`) | `Chart data: prior and current results` and `Chart data: margin and KPI changes` feed the typed prior/current pairs; the variance bridge uses the module's published figures. |
| `CP-1C` | Peer benchmark | `PeerBenchmarkLead` (`web/src/pages/connected/report/leads/peerBenchmark.tsx`) | `Chart data:` peer-range sections and their typed tables feed the range/position visual; use the exact matching `Section.heading` and `Table`, and show a gap where the peer table is absent. |
| `CP-1D` | Earnings quality | `EarningsQualityLead` (`web/src/pages/connected/report/leads/earningsQuality.tsx`) | Typed bridge/assessment registers `T1D.2`, `T1D.4` and `T1D.6` feed the add-back bridge and assessment table. |

The frame keeps these four code-to-pane assignments distinct; a lead never uses a neighboring module's section because its heading happens to look similar.

## Layout and components

- Repeat the shared module frame for each module, with a visible module header between modules in this grouped view.
- Financial foundation: compose the stated earnings-against-debt view, leverage periods and debt-service figures; put supporting statements, net debt, cash conversion, maturities and segments in records.
- Earnings changes: show a variance bridge and prior/current measures only where the handoff supplies them. Peer benchmark: use a range/position view only when its peer input exists. Earnings quality: use an add-back bridge and support classification only when supplied.
- **Reuse:** `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` (primitives in `web/src/pages/connected/report/ModuleFrame.tsx`); `ModuleStats` (`web/src/pages/connected/report/ModuleStats.tsx`); `ChartWithTable`, `DumbbellChart`, `WaterfallChart` and `RangeStripChart` from `web/src/components/chart/`; `Timeline` (`web/src/components/timeline/Timeline.tsx`); record `Tabs`; `PublishedTraceProvider` for the drawer context and `PublishedSource` for each item control (both from `web/src/pages/connected/report/PublishedTrace.tsx`). `ModuleFrame.tsx` holds primitives; the frame and four-module sequence are new composition.
- **New composition:** the four module-specific lead visuals and compact sequence. Keep each visual specific to the data type; do not repeat a generic tile or chart wrapper for every section.

At 1280, keep a lead figure beside its argument or period comparison. At 1024, stack those regions while keeping the table legible; move supporting records behind tabs rather than hiding a period or unit.

## Data, trace and states

Use typed fields for measure, period, unit, basis, category and source row. For comparisons, use the module's stated comparison and direction; do not calculate a delta. Draw sparklines only where the source includes at least three ordered periods. A missing peer input or unsupported earnings-quality handoff is an explicit gap with its reason, never a sample peer, add-back or fabricated waterfall.

Keep statement rows and supporting calculations behind records tabs. Trace every chart point, table row, claim and limitation. Distinguish not run, blocked, limited, unavailable and empty records. Keep exact number formatting, currencies, signs and period labels from the handoff.

## Offline placeholder wireframe

[Open the standalone module financials wireframe](wireframes/module-financials.html). This generic layout follows its screen map and contains no source values.
