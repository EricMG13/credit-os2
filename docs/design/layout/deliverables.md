# Report · Deliverables

## Purpose and source contract

Let the reader open or download artifacts already published for the run. Read `Snapshot.reportFolder` and `PublishedRun.evidence.downloads`, `.handoffs`, `.zip`, `.record.hashes` and `.record.instructions` for their supported artifact categories. The tile is a file-selection surface, not a report-content renderer.

## Layout and components

- Keep shared report shell/header/tabs.
- Present grouped artifact tiles with artifact type, reader-safe title, state and the existing open/download action. Tiles only: do not preview or reproduce file contents.
- **Reuse:** report shell, `PageHeader`, `Tabs`, `ArtifactDownloads` (`web/src/pages/connected/report/ArtifactDownloads.tsx`), `StatusBadge` and the existing action button. The grouped artifact tile grid is new composition.
- **New composition:** grouped artifact tile layout and its empty/error state. No content-specific tile is introduced.

At 1280, use a balanced grid of artifact tiles. At 1024, reduce columns while preserving reading order and full labels. Do not allow a filename or title to force horizontal overflow.

## Data, trace and states

Use only artifact identity, type, availability and action supplied by the published inventory. Keep source paths, hashes and internal identifiers in Evidence; the reader tile uses a safe label. Do not claim a download exists if the inventory has none, and do not synthesize a preview.

Draw loading, no artifacts, unavailable artifact and failed open/download states. A failed action reports the failure and offers the applicable retry; do not swallow it. The tile may contain a trace/control only when the existing artifact contract requires one; it must not expose raw trace payload.

## Offline placeholder wireframe

[Open the standalone deliverables wireframe](wireframes/deliverables.html). This generic layout follows its screen map and contains no source values.
