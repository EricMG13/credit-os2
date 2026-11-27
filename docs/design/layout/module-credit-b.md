# Modules · Credit (liquidity, exposures, forward model and ratings)

## Purpose and source contract

Present liquidity, rates/foreign exchange/hedging, the forward credit model and ratings/triggers in the shared module layout. Follow `PublishedRun.modules[moduleCode].outputs[]` → `Snapshot.workspace.outputs[outputId]` → `Snapshot.workspace.handoffs[output.sha256]`; use each exact `Section.heading` and typed `blocks[]`, including table `headers` and `rows[].cells[]`. The forward-model view uses the T2H.4–T2H.8 written-case family, with its limitation preserved. Keep case, unit, period, exposure and trigger terms as written.

## Module routing: code to pane and reader

Route each pane by the canonical module code. The lead reads only that module's typed output; the Forecast screen's model and written case series are a separate, explicitly bound source family.

| Module code | Pane | Built lead | Exact typed section or visual mapping |
|---|---|---|---|
| `CP-2D` | Liquidity | `LiquidityLead` (`web/src/pages/connected/report/leads/cp2d.tsx`) | `Chart data: Liquidity bridge` feeds the bridge visual; `Events: Financing` feeds the event lane when present. |
| `CP-2E` | Macro and exposures | `MacroLead` (`web/src/pages/connected/report/leads/cp2e.tsx`) | `T2F.3`, `T2F.4` and `T2F.5` supply the named typed registers; `Events: Hedges` supplies its event lane. |
| `CP-2G` | Forward model | `ForwardLead` (`web/src/pages/connected/report/leads/cp2g.tsx`) | The forward lead uses its typed model reader. The Forecast screen separately selects this code's unique output and maps its written `T2H.4`–`T2H.8` tables and machine-readable input section as specified in [Forecast](forecast.md). |
| `CP-2H` | Ratings | `RatingsLead` (`web/src/pages/connected/report/leads/cp2h.tsx`) | `T2R.1` supplies the ratings register; the `Rating triggers` section supplies the trigger visual when present. |

A missing code-specific table, model or period remains a gap in that pane. Do not substitute data from another module.

## Layout and components

- Keep one navigator and a separate frame for each module. The forward-model lead also feeds the Forecast route, but the module handoff remains authoritative.
- Liquidity: place stated sources and uses on a bridge with dated funding information nearby. Exposures: use a plain table and sensitivity rows; do not use better/worse colors. Forward model: compare case paths using the supplied model output and selected periods. Ratings: show agency/status and trigger text as a ladder or ordered list.
- **Reuse:** `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` (primitives in `web/src/pages/connected/report/ModuleFrame.tsx`); `ModuleStats` (`web/src/pages/connected/report/ModuleStats.tsx`); record `Tabs`, `StatusBadge`, `GapPanel`, `ChartWithTable`, `PathChart`, `Timeline`, and `PublishedTraceProvider` plus `PublishedSource` from `web/src/pages/connected/report/PublishedTrace.tsx`. The navigator/content frame and four-module sequence are new composition.
- **New composition:** liquidity bridge, exposure table, case path panel and trigger ladder in the shared frame. Do not infer a runway, rating transition or sensitivity from partial inputs.

At 1280, place the path beside its stated drivers. At 1024, stack it below the module header. Never separate the trigger from its qualifier or the case label from its path.

## Data, trace and states

Read measures, period, basis, sources/uses, scenario labels, path points, exposures, sensitivity, agency and trigger terms from the named fields/sections. A source that lacks a retained handoff remains marked unavailable. Do not calculate runway or annualize a sensitivity. Do not create rows for unprovided exposures or ratings.

Every table row, path, claim, trigger and limitation has one trace control. Unsupported data, missing periods and blocked modules use the shared gap/blocked states with reason. Keep source details in Evidence/the trace drawer.

## Offline placeholder wireframe

[Open the standalone module credit b wireframe](wireframes/module-credit-b.html). This generic layout follows its screen map and contains no source values.
