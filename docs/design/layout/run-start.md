# Run start

## Purpose and source contract

Help an analyst review what a run will use, what it will do, what it will not do and its stated cost before submitting. Bind Documents to `Reading.documents[]` (`DocumentRecord`) and `Reading.ignored[]`; Purpose to the selected pathway and server-provided `Summary.cap`; More context to `Context.run`, `Context.identity`, `attachments`, research questions and typed optional inputs; Review to `Summary.modules`, `omitted`, `items[]` (`ReadinessItem`), `changes`, and optional `estimate` (`CustomEstimate.rows[]`, `sum`, `hold`, `cap`). These contracts live in `web/src/pages/connected/api.ts` and connected start loaders. Rendering never starts a provider run.

## Layout and components

- Use the Credit OS top bar without a Start run action. Place the four-step flow in order: Documents, Purpose, More context, Review and start.
- Keep a persistent readiness panel on the right, listing module readiness by the five ordered groups. Main content changes with the active step.
- Documents uses a real upload/list control and source-type state. Purpose uses selectable pathway cards with the source's description and cap. More context groups the existing questions/choices. Review separates included work, excluded scope and cost, with required acknowledgement checks and the approved Submit control.
- **Reuse:** `PageHeader`; `DocumentFields` in `web/src/pages/connected/start/DocumentsStep.tsx`; `PurposeFields` in `web/src/pages/connected/start/PurposeStep.tsx`; `ReadinessRail` in `web/src/pages/connected/start/ReadinessRail.tsx`; and `ReviewSheet` in `web/src/pages/connected/start/ReviewSheet.tsx`. The four-step flow and persistent readiness rail are new composition.
- **New composition:** four-step navigation, persistent readiness rail and review summary. No duplicate orchestrator or second analysis path.

At 1280, keep form content and readiness panel side by side. At 1024, retain a visible readiness summary below the step heading and keep it accessible at each step. Do not hide a blocking readiness item in a collapsed panel by default.

## Data, trace and states

Bind inputs and readiness to real runtime state; preserve the selected pathway and its cap. Readiness reports ready/conditional/blocked with reasons. The review summary shows only the actual planned modules, exclusions and estimate supplied by the runtime. Do not compute a new estimate in presentation code. Failed document parsing or readiness checks must remain visible errors.

Draw empty documents, upload progress, unsupported file, parse failure, conditional/blocked module, invalid context, stale review and submission failure. Disable Submit until existing validation and acknowledgement requirements are met. A successful click uses the existing submit action once and presents its actual result; it must not fire on render or retry invisibly.

## Offline placeholder wireframe

[Open the standalone run start wireframe](wireframes/run-start.html). This generic layout follows its screen map and contains no source values.
