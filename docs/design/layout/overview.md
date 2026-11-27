# Report · Overview

## Purpose and source contract

Answer the call, why it follows and how far the reader can trust it. Resolve the run through `Snapshot.workspace.runs[runFolder]`; each module output is `PublishedRun.modules[moduleCode].outputs[]` → `Snapshot.workspace.outputs[outputId]` → `Snapshot.workspace.handoffs[output.sha256]`. The hero uses `PublishedRun.lead`; period, as-of, pathway and assessment scope use their fields on `PublishedRun`. Prose comes from the output's `Section` records and `blocks`; keep module-authored passages in the required reader order.

## Layout and components

- Retain the shared report header, report tabs and white hero. The hero occupies the main left region with the bottom line; a right rail holds confidence, evidence clearance and the earlier-run comparison when those fields exist.
- Below, use a compact figure band, then a three-part argument band: findings, contrary evidence and what would change the view. Give each passage its own trace.
- Group structural figures as maturity wall and capital stack; put covenant room beside the downside and forward path. Keep the limitation strip visible before the run pipeline.
- Show five stage groups in this order: `Sources`, `Financials`, `Credit`, `Structure and market`, `Validation and decision`. Place Changes since the earlier run in the final group. Use a date-axis strip for supported events.
- **Reuse:** `PageHeader`, report `Tabs`, `ModuleStats`, `StatusBadge`, `GapPanel`, chart/table components, `Timeline`, `PublishedTraceProvider` for the report-level drawer context, and `PublishedSource` for each item control (both from `web/src/pages/connected/report/PublishedTrace.tsx`). The shared hero, trust rail, argument band, figure grouping and five-stage overview are new composition; there is no built `ModuleFrame` component to reuse. Do not create an aggregate or derive a new confidence/clearance state.

At 1280, preserve the hero and rail as distinct regions and let the argument band rebalance. At 1024, stack the rail below the hero and the argument sections vertically; retain their order and white judgement surface.

## Data, trace and states

Map bottom line, confidence, clearance, comparison, each headline measure, findings, contrary evidence, view-change conditions, maturity, capital structure, covenant room, downside, forward path, limitations, stage status and dated events from their typed source fields or named handoff sections. Keep all qualifiers and source periods. Draw only stated outcomes; no generated “since earlier” explanation or assumed directional color.

Missing clearance details, no earlier run, blocked modules, missing periods and unavailable inputs remain visible as labeled gaps. A blocked module uses the established dashed orange “Not assessable” treatment and reason. Keep source citations in the trace drawer/Evidence; one trace control per item.

## Fixture coverage

[Overview row tests](../../../web/src/pages/connected/report/overview/callRows.test.tsx), the [pipeline layout test](../../../web/src/pages/connected/report/overview/PipelineRow.layout.test.tsx) and [structure row test](../../../web/src/pages/connected/report/overview/StructureRow.test.tsx) cover individual readers and layout states. They do not provide a complete de-identified `Snapshot` answer key spanning all five groups, limitations and events.

## Offline placeholder wireframe

[Open the standalone overview wireframe](wireframes/overview.html). This generic layout follows its screen map and contains no source values.
