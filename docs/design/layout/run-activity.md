# Run activity

## Purpose and source contract

Show whether runs are working, where the selected run is in its pipeline and what failed. The connected run record is `ConnectedRun` from `web/src/pages/connected/api.ts`: `status`, `reason`, `modules`, `cap`, `spent`, `settled_spent`, `held`, `started_at`, `ended_at`, `execution` and `events[]`. Each `RunEvent` has `at`, `kind` and optional `module`. Activity summaries are read through the run-slice loaders. Events carry the authoritative state; presentation does not allocate or infer per-module cost.

## Layout and components

- The activity list shows in-flight runs first, with state, stated progress and failure/stop reason where applicable. Selecting one opens its progress view.
- The progress view leads with the pipeline in the approved order: `Sources`, `Financials`, `Credit`, `Structure and market`, `Validation and decision`. Beside it, show the actual spend against its cap and the run state. Put event history below, newest-first, and the real next action at top when available.
- **Reuse:** app shell, `Pipeline` (`web/src/components/pipeline/Pipeline.tsx`), `ModuleSteps`, `Feed` and `Summary` (`web/src/pages/run/activity/`), `StatusBadge` (`web/src/components/status/StatusBadge.tsx`) and `SpendBlock` (`web/src/pages/connected/runProgressParts.tsx`). The issuer-run stage overview and list/progress arrangement are new composition.
- **New composition:** list-plus-progress selection and pipeline/event arrangement. Keep run activity's layout consistent with the Overview stage groups.

At 1280, place the pipeline/progress pane beside the cost/state summary in the selected-run area. At 1024, stack the cost/state summary after the pipeline. The run list remains the left rail at 1280 and moves above the selected-run panes at 1024; the event feed stays below both at either width, with no page-level horizontal scroll.

## Data, trace and states

Display event time, order, module label, state, progress and cumulative spend exactly as supplied. Use only the real cap from the selected pathway; don't estimate elapsed time or derive per-module spend. Keep the selected case/run scope visible and distinguish replay/synthetic from live when that is the actual run identity.

Render queued, running, completed, failed, stopped and interrupted distinctly. For a failure, show the recorded reason and supported retry/resume action. If events cannot load, show a persistent error with a real retry. No event list is an empty state, not a success. Keep identifiers in the run record or trace drawer.

## Offline placeholder wireframe

[Open the standalone run activity wireframe](wireframes/run-activity.html). This generic layout follows its screen map and contains no source values.
