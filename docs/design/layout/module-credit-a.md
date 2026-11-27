# Modules · Credit (business, research, fundamental credit and downside)

## Purpose and source contract

Present business and governance, research questions, fundamental credit and downside in the shared module layout. Follow `PublishedRun.modules[moduleCode].outputs[]` → `Snapshot.workspace.outputs[outputId]` → `Snapshot.workspace.handoffs[output.sha256]`; read each exact `Section.heading` and its typed text/table `blocks[]`. Preserve the module-authored bottom line, key findings, contrary evidence/view-change, limitations, question/answer, dimension, case and breakpoint sections.

## Module routing: code to pane and reader

Route each pane by the canonical module code. Each built lead selects only its module's typed handoff sections, tables or events.

| Module code | Pane | Built lead | Exact typed section or visual mapping |
|---|---|---|---|
| `CP-1A` | Business and governance | `BusinessLead` (`web/src/pages/connected/report/leads/cp1a.tsx`) | The `revenue_business_mix` register supplies the business-mix table; `Map:` sections and `Events: Issuer history` remain separate typed visuals. |
| `CP-DR` | Research questions | `ResearchLead` (`web/src/pages/connected/report/leads/cpdr.tsx`) | The new question→answer card composition reads only the `Scope, questions and bounded work` section in this module output and preserves its authored pair order; `Events: Research catalysts` remains the separate event lane. |
| `CP-2` | Fundamental credit | `CreditLead` (`web/src/pages/connected/report/leads/cp2.tsx`) | `Chart data: Total debt / EBITDA`, `Chart data: Net debt / EBITDA` and `Chart data: EBITDA / cash interest` feed their named paths; `T2.10` feeds the driver register; `Map: credit-risk transmission` feeds the map when present. |
| `CP-2A` | Downside cases | `DownsideLead` (`web/src/pages/connected/report/leads/cp2a.tsx`) | `T2DS.4` supplies stressed metrics by scenario; `T2DS.6` supplies break points; missing registers remain gaps. |

Keep the pane heading keyed to the module code and its module identity. Do not route a business, research or downside table into another code's pane.

For CP-DR, walk `Section.blocks[]` under `Scope, questions and bounded work` in source order. Pair a question only with its explicitly corresponding answer in the same typed table row or marked question/answer block sequence; do not pair arbitrary neighboring prose or take text from `Research synthesis` or `Causal downside and monitoring`. Keep synthesis and downside as their own source-linked passages after the cards, and preserve a source control on each card. If an authored pair is incomplete or cannot be read, keep its slot and show exactly: “Question and answer pair could not be read from this handoff.” If the whole question/answer sequence is absent, retain the existing whole-section missing-list state. Never substitute a default question, answer or causal statement. Keep the catalyst event lane independently.

## Layout and components

- Keep one navigator and repeat the shared module frame for each module. Do not merge distinct module conclusions into one summary.
- Business and governance: lead with the stated operating model or driver map; place ownership, transaction and dates in supporting records. Research questions: use question/answer rows with the handoff's answer status. Fundamental credit: put written strengths and weaknesses beside its stated measures. Downside: compare only the supplied cases and break points.
- **Reuse:** `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` (primitives in `web/src/pages/connected/report/ModuleFrame.tsx`); `ModuleStats` (`web/src/pages/connected/report/ModuleStats.tsx`); record `Tabs`, `StatusBadge`, `GapPanel`, `ChartWithTable`, `Timeline`, and `PublishedTraceProvider` plus `PublishedSource` from `web/src/pages/connected/report/PublishedTrace.tsx`. The navigator/content frame and four-module sequence are new composition.
- **New composition:** operating-model map, question/answer stack, strengths-versus-weaknesses ledger and case comparison. Reuse the shared frame, not a single repeated lead visual.

At 1280, allow question/answer and strengths/weaknesses to share a row with their lead visual. At 1024, stack those regions. Keep case labels and all stated case measures together; don't split a qualification from its value.

## Data, trace and states

Map module bottom line, status, basis, business drivers, question/answer pairs, credit measures, written strengths and weaknesses, downside cases, break points and limitations from their named handoff sections. Do not transform a prose answer into an invented status, dimension score or break-point calculation. A case gap remains a gap; do not interpolate.

Render limited and blocked states distinctly. Blocked uses the dashed orange outline, slash and “Not assessable” with the source reason. Keep source identity in the trace drawer/Evidence and place one trace on every claim, case, row and figure.

## Offline placeholder wireframe

[Open the standalone module credit a wireframe](wireframes/module-credit-a.html). This generic layout follows its screen map and contains no source values.
