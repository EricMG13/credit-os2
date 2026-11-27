# Report · Changes

## Purpose and source contract

Explain what changed between the current run and its earlier comparison run. Read `PublishedRun.changes.pack` and `.verdicts`. The pack's source contract is `prior`, `current`, `measures[]` (`prior`, `current`, `difference`, `same_period`, `comparable`, `reason`), `omitted`, `modules[]` and `maturity_profile`. Narrative qualifiers come from the selected comparison output resolved through `PublishedRun.modules` → `Snapshot.workspace.outputs` → `Snapshot.workspace.handoffs`. The comparison handoff owns the qualifier, status and cause. Do not infer that a missing statement was removed.

## Layout and components

- Keep the shared report shell/header and a white verdict panel naming the comparison in reader-safe terms.
- Put measures with stated movement in the main column as a dense dumbbell table: earlier mark, current mark, exact period/basis and the handoff's cause. Direction is shown only where the comparison explicitly states it.
- Put module conclusion changes in a compact status matrix at the side. Below, align the two maturity views on one scale, then show limitations added and no longer stated as separate lists. Put unchanged measures in a disclosure.
- **Reuse:** report shell, `PageHeader` (`web/src/shell/PageHeader.tsx`), `Tabs` (`web/src/components/application/tabs/tabs.tsx`), `DumbbellChart` (`web/src/components/chart/DumbbellChart.tsx`), `ChartTable` (`web/src/components/chart/ChartTable.tsx`), `StatusBadge`, `GapPanel`, `PublishedTraceProvider` for the report-level drawer context, and `PublishedSource` for each item control (both from `web/src/pages/connected/report/PublishedTrace.tsx`). The verdict, measure/matrix region and limitation ledger are new composition.
- **New composition:** verdict panel, comparison table, status matrix and two-view maturity grouping. The table may combine existing chart and table primitives; it does not calculate differences.

At 1280, keep the measure table and status matrix side by side. At 1024, place the matrix after the table, and let each dumbbell occupy the table's full measure cell; do not introduce a nested horizontal scroller.

## Data, trace and states

Preserve both runs' identity as reader-safe labels, each measure's exact value, basis, period, unit and qualifier, stated cause, module state, maturity periods and limitation wording. Treat “no longer stated” as its own wording. Do not treat “Unresolved” as an explanation or infer better/worse from arithmetic.

If no earlier run exists, show the fixed no-comparison state and omit the compare visuals. Missing current or earlier values stay hatched gaps. A module absent from one run remains distinct from a changed conclusion. Every measure, module row and limitation has a trace control; raw run IDs and source identifiers stay in the trace drawer/Evidence.

## Fixture coverage

The [comparison-row fixture](../../../tests/fixtures/changes-seam/rows.json) and [Changes page tests](../../../web/src/pages/connected/report/Changes.test.tsx) cover row parsing and state distinctions. They do not cover an issuer comparison end to end, including run identity, maturity source basis, comparison qualifiers and separate added/remaining/no-longer-stated limitations. A screen-level answer key remains uncovered.

## Offline placeholder wireframe

[Open the standalone changes wireframe](wireframes/changes.html). This generic layout follows its screen map and contains no source values.
