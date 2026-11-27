# Library

## Purpose and source contract

Help the reader scan issuers, find a run and open a useful preview. Read `LibraryIndex.catalogue.real[]`, `LibraryIndex.workspace.runs[runKey]` and, for the selected run only, `Snapshot.workspace.runs[runFolder]`. A `CatalogueRun` carries `name`, optional `ticker`, `sector`, `date`, `period` and `metrics[metricKey]` (`value`, `unit`, `period`, optional `prior.value` and `prior.period`). Do not compute portfolio aggregates or imply a stance the source does not carry.

## Layout and components

- Keep the shared Credit OS top bar, then a page heading and a compact scope line.
- Use one dense table as the primary region. Search and sector/pathway/state filters sit above it. Keep issuer identity sticky; align each source-provided metric and its period in its own column. Show a prior-period mark only if both observations are present.
- Selecting an issuer opens a right-side master-detail preview. It contains that run's bottom line, selected headline figures and a route to its report; it must not repeat the full report inline.
- **Reuse:** app shell, `PageHeader` (`web/src/shell/PageHeader.tsx`), report `Tabs` (`web/src/components/application/tabs/tabs.tsx`) where applicable, `StatusBadge` (`web/src/components/status/StatusBadge.tsx`), connected library row/metric trace parts (`web/src/pages/connected/libraryRows/`) and `TraceDrawer` (`web/src/pages/library/parts/TraceDrawer.tsx`).
- **New composition:** filter row, compact issuer roster, selected-row state and library preview panel. Do not create a stance badge or changed-first ordering without a typed source field.

At 1280, keep filters in one row where they fit; move secondary filters to a disclosure when needed. At 1024, keep the table legible by hiding only secondary descriptive columns behind row detail; do not make the page scroll horizontally.

## Data, trace and states

Map issuer identity, sector, pathway, run state, metric family, period and next event from named catalogue fields. Preserve the field's exact currency/unit and period. Metric direction may appear only when the row carries a prior period and its supported direction. A blank sector is a named “no sector” state with the available count. Keep the stated gap for unavailable typed stance; do not synthesize a rank, average or change.

Give each displayed value or sourced statement its own trace affordance. Raw identifiers and source references belong in the Evidence route or trace drawer. Draw loading skeleton, no matching rows, no published runs, unavailable snapshot, no prior period, and missing field states distinctly. Missing is never zero.

## Fixture coverage

[LibraryIndex metric-trace tests](../../../web/src/pages/connected/LibraryIndex.metricTrace.test.tsx) and [issuer-row tests](../../../web/src/pages/connected/libraryRows/IssuerRow.test.tsx) cover row rendering and metric trace behavior using local test setup. They are not a full de-identified catalogue plus selected-run snapshot answer key. The seeded library page fixture is intentionally not used as the source-fidelity key.

## Offline placeholder wireframe

[Open the standalone library wireframe](wireframes/library.html). It uses 24 repeated, shape-only roster rows to demonstrate the dense desktop table; all geometry is generic and contains no source values.
