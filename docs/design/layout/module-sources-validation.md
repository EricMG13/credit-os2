# Modules · Sources, Validation and decision

## Purpose and source contract

Define the shared module layout and present source-readiness, evidence-validation and committee-decision handoffs. Follow `PublishedRun.modules[moduleCode].outputs[]` → `Snapshot.workspace.outputs[outputId]` → `Snapshot.workspace.handoffs[output.sha256]`. Select the exact `Section.heading`; its `blocks[]` carry prose or `Table.headers` and `Table.rows[].cells[]`. The five navigator groups follow `Sources`, `Financials`, `Credit`, `Structure and market`, `Validation and decision`; Changes belongs in the last group.

## Module routing: code to pane and reader

Route each pane by the canonical module code. The listed renderer reads that module's own output entry; it selects its own typed sections and tables and does not borrow another pane's values.

| Module code | Pane | Built lead | Exact typed section or visual mapping |
|---|---|---|---|
| `CP-0` | Sources | `SourceReadinessLead` (`web/src/pages/connected/report/leads/sourceReadiness.tsx`) | `T1 Input gate` (`Gate field`, `Resolved input`, `Readiness boundary`) supplies overall gate fields; the lead renders the module's own typed readiness matrix with its authored area, state and reason cells. |
| `CP-5` | Validation | `ClearanceLead` (`web/src/pages/connected/report/leads/validation.tsx`) | The unique two-column `Item | Value` table with a `Status` row supplies the verdict when present; gap and contradiction registers are selected by their typed headers, and clearance prose is read from its authored text block. |
| `CP-6` | Decision | `CommitteeLead` (`web/src/pages/connected/report/leads/committee.tsx`) | Committee lead visual and the `T6A.4` cross-examination register when present; the stance table and register remain independently sourced from this module. |

Pane headings follow the selected module identity; section headings and table headers remain those authored in its handoff. An absent selector stays an explicit gap.

## Layout and components

- Use the shared 232 px module navigator and a filling content column. The frame order is: module header with bottom line/status/basis; statistics strip; lead visual; findings/contrary evidence/what changes the view; limitations; tabbed records; next-module link.
- The source-readiness lead is a readiness matrix with a state word and reason. Evidence validation leads with its clearance and issue groupings. Committee decision leads with the module's stated stance and decision tables, with judgement first.
- **Reuse:** `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` (primitives in `web/src/pages/connected/report/ModuleFrame.tsx`); `ModuleStats` (`web/src/pages/connected/report/ModuleStats.tsx`); `StatusBadge` (`web/src/components/status/StatusBadge.tsx`); `GapPanel` (`web/src/components/gap/GapPanel.tsx`); report `Tabs`; `PublishedTraceProvider` for the drawer context and `PublishedSource` for each item control (both from `web/src/pages/connected/report/PublishedTrace.tsx`). `ModuleFrame.tsx` exports primitives, not a frame component. The navigator/content-column frame and leads are new composition. Do not add a generic module chart card.

At 1280, keep the navigator beside the content. At 1024, retain the rail at its supported width and let the content column contract; if a layout variant is required, make the rail collapsible with an announced control, not a horizontal page scroll.

## Data, trace and states

Readiness shows module × ready/conditional/blocked and the handoff's reason; keep key evidence, conflict and duplicate sections in records. Validation shows stated outcomes, severity and remediation as provided. Committee decision shows only the written stance, findings, counterarguments, conditions and watch items. Do not derive a score, stance or issue count.

Use the shared statuses: delivered, limited, blocked, failed and not run are distinct. A blocked module shows a dashed orange outline, slash mark, “Not assessable” and the stated reason. Empty or unavailable records remain gaps, not zero rows. Each statement, row and figure has a trace affordance; source references and raw identifiers remain in Evidence/the trace drawer.

## Fixture coverage

The committed [synthetic source-readiness](../../../web/src/pages/connected/report/leads/fixtures/cp0_synthetic.json), [validation](../../../web/src/pages/connected/report/leads/fixtures/cp5_synthetic.json) and [committee-decision](../../../web/src/pages/connected/report/leads/fixtures/cp6_synthetic.json) fixtures cover those module lead shapes; corresponding [source-readiness](../../../web/src/pages/connected/report/leads/sourceReadiness.test.tsx), [validation](../../../web/src/pages/connected/report/leads/validation.test.tsx) and [committee](../../../web/src/pages/connected/report/leads/committee.test.tsx) tests cover reader behavior. None is a full module-frame snapshot or source-backed screen answer key.

## Offline placeholder wireframe

[Open the standalone module sources validation wireframe](wireframes/module-sources-validation.html). This generic layout follows its screen map and contains no source values.
