# Modules · Structure and market

## Purpose and source contract

Present security selection, refinancing/liability management, market-implied risk, legal/covenants and recovery/fulcrum in the shared module layout. Follow `PublishedRun.modules[moduleCode].outputs[]` → `Snapshot.workspace.outputs[outputId]` → `Snapshot.workspace.handoffs[output.sha256]`; select each exact `Section.heading` and read its typed text/table blocks (`headers`, `rows[].cells[]`). Relevant section families are bottom line, key findings, contrary evidence/view-change, limitations, maturity/funding, market evidence, covenant tests and recovery classes. Keep class, instrument, entity, test, basis, case and qualification intact.

## Module routing: code to pane and reader

Route each pane by the canonical module code. Each lead reads the named typed sections or registers from its own module output.

| Module code | Pane | Built lead | Exact typed section or visual mapping |
|---|---|---|---|
| `CP-3` | Security | `SecurityLead` (`web/src/pages/connected/report/leads/cp3.tsx`) | Module-authored instrument, peer-level and outcome tables feed the instrument table, peer comparison and value matrix; absent tables are shown as gaps. |
| `CP-3C` | Refinancing | `RefinancingLead` (`web/src/pages/connected/report/leads/cp3c.tsx`) | `Chart data: Refinancing need` feeds the need visual; `T3D.6` feeds the path-feasibility register; `Events: Refinancing` feeds the event lane when present. |
| `CP-3D` | Market | `MarketLead` (`web/src/pages/connected/report/leads/cp3d.tsx`) | `Chart data: Yield against maturity` feeds the market visual; `T3E.5` supplies the typed market-model register. |
| `CP-4` | Legal and covenants | `LegalLead` (`web/src/pages/connected/report/leads/cp4.tsx`) | `Chart data: Covenant headroom` feeds the headroom visual; `T4C.5` supplies capacity/test rows; typed `Map:` sections remain tied to their authored names. |
| `CP-4C` | Recovery and restructuring | `RestructuringLead` (`web/src/pages/connected/report/leads/cp4c.tsx`) | `Chart data: Value allocation` and `Chart data: Recovery by class` feed the recovery visuals; `T4E.4` and `T4E.6` supply the corresponding typed registers. |

A code's missing visual or register stays an explicit gap with its reason. Do not fill it from another module's similarly named section.

## Layout and components

- Keep the common module navigator/frame and separate module conclusions. The lead visual is specific to the module: instrument rank table; dated refinancing view; market-risk state; covenant test/basket view; recovery waterfall by class.
- Put instrument and legal registers in the records region. The market-implied module's current blocked/limited condition must read as a state panel, not as an empty chart. Show the fulcrum only where the handoff states it.
- **Reuse:** `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` (primitives in `web/src/pages/connected/report/ModuleFrame.tsx`); `ModuleStats` (`web/src/pages/connected/report/ModuleStats.tsx`); record `Tabs`, `StatusBadge`, `GapPanel`, `ChartWithTable`, `Timeline`, `DumbbellChart`, `WaterfallChart`, and `PublishedTraceProvider` plus `PublishedSource` from `web/src/pages/connected/report/PublishedTrace.tsx`. `ModuleFrame.tsx` supplies primitives; the five-pane navigator/content frame is new composition.
- **New composition:** instrument comparison, refinancing view, blocked market-risk panel, covenant room group and class recovery view. Never draw an input-dependent visual from absent data.

At 1280, place supporting register summaries beside their lead view. At 1024, stack them in reading order and leave full table access in records. Keep each axis and legend with its visual.

## Data, trace and states

Read security terms and rank, refinancing dates and sources, market observations, covenant tests and limits, entity relationships, recovery classes and fulcrum from named handoff sections. A market quote, executed document or recovery input absent from the handoff stays an explicit gap/blocked state; no proxy, assumed quote, waterfall amount or legal conclusion is allowed.

Keep amount, currency/unit, date and legal qualifier exact. Provide a trace for each row, claim and visual. “Not assessable” retains its stated reason and blocked styling. Source keys and file details remain in Evidence/the trace drawer.

## Offline placeholder wireframe

[Open the standalone module structure wireframe](wireframes/module-structure.html). This generic layout follows its screen map and contains no source values.
