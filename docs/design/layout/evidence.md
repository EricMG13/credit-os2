# Report · Evidence

## Purpose and source contract

Give a reviewer the source, trace, gap, check and run-record detail needed to challenge a displayed claim. Read `PublishedRun.evidence.sources`, `.unused`, `.unrecorded`, `.noSourcesModules`, `.scriptChecks`, `.handoffs`, `.downloads`, `.zip`, and `.record.hashes` / `.record.instructions`; outputs resolve via `Snapshot.workspace.outputs` and `Snapshot.workspace.handoffs[output.sha256]`. `Source` records expose name, type, document date, read-by list and hash; `ScriptCheckRecord` preserves status/count/outcome fields. This is the sole report page for source identifiers and file-level provenance.

## Layout and components

- Keep report shell/header/tabs. Use master-detail: a narrow source/register list on the left; selected source or trace detail on the right. A trace deep link opens with its claim and source passage selected.
- Provide separate views for gaps, checks and record. Group gaps by severity without deriving a new severity. Checks show explicit pass/fail/not-run states. Record keeps cost/timing/model metadata together; source/file details remain here or in the trace drawer.
- **Reuse:** report shell, `PageHeader`, `Tabs`, `EvidenceSources`, `EvidenceGaps`, `EvidenceHandoffs`, `ReportRecord` (`web/src/pages/connected/report/Record.tsx`), `PublishedTable` (`web/src/pages/connected/ReportContent.tsx`), `StatusBadge`, `GapPanel` and the existing `TraceDrawer` (`web/src/pages/library/parts/TraceDrawer.tsx`). Master-detail selection and the check matrix are new composition.
- **New composition:** evidence master-detail selection, check matrix and grouped record panels. Make the evidence tools dense and searchable without reusing a reader-facing report card for every register row.

At 1280, use a persistent source list and detail panel. At 1024, switch to a source list view with explicit selection/navigation into detail; keep the return path. Avoid nested horizontal scrolling in tables.

## Data, trace and states

Show the selected claim, source passage/location and relation; source register rows, type, file metadata, use references, check results, gaps and run record exactly as retained. Module names may be displayed; remove module codes from rendered reader text. Stored paths may appear only in the approved stored-file presentation. Never invent a source, hash, check or gap count.

Draw loading, empty, failed-to-load and no-selection states separately. A missing source is a stated gap. Preserve the source's excerpt exactly in the trace view. Evidence entries can have identifiers and file references because this is the designated evidence surface; other pages must still keep them inside the trace drawer.

## Offline placeholder wireframe

[Open the standalone evidence wireframe](wireframes/evidence.html). This generic layout follows its screen map and contains no source values.
