# Layout pass: accepted constraints and approval state

## Accepted scope

The layout pass may rearrange, merge, split, reshape and densify screen regions to help a portfolio manager or credit committee member reach the finding quickly. It does not change the analytical source, add calculations, rewrite module conclusions, or treat missing evidence as zero. This ruling records design constraints for implementation; it does not authorize a production build.

The scope is the fifteen screens listed in [the layout build README](../design/layout/README.md). Coverage remains under its separate specification. The private review evidence and mockups remain local and are not copied into this repository.

## Accepted design constraints

- Use the existing brand and component language. The hero and module judgement surfaces stay white; the brand mark remains the Credit OS symbol. Blue remains selected-state chrome.
- Use the established 12-column desktop grid with a 16 px gutter and the established tile, nested-card, well/control and chip radii. No card shadow.
- Support 1024 px and wider. Check the page at 1024, 1280 and 1440 px with no page-level horizontal overflow, and document reflow at 1280 and 1024.
- Keep the module and Overview/Activity stage order: Sources; Financials; Credit; Structure and market; Validation and decision. Changes since the earlier run is within the final group.
- Reuse named built components where their role matches: `PageHeader` (`web/src/shell/PageHeader.tsx`), `Tabs` (`web/src/components/application/tabs/tabs.tsx`), `ModuleHeader`, `ModuleFindings`, `ModuleLimitations` and `NextModule` (primitives in `web/src/pages/connected/report/ModuleFrame.tsx`), `ModuleStats` (`web/src/pages/connected/report/ModuleStats.tsx`), `StatusBadge` (`web/src/components/status/StatusBadge.tsx`), `GapPanel` (`web/src/components/gap/GapPanel.tsx`), `Timeline` (`web/src/components/timeline/Timeline.tsx`), chart/table components (`web/src/components/chart/`), `PublishedTraceProvider` for report-level drawer context and `PublishedSource` for each per-item control (both in `web/src/pages/connected/report/PublishedTrace.tsx`). `ModuleFrame.tsx` exports primitives, not a `ModuleFrame` component; each screen composes its own frame from the primitives.
- Preserve the reader order, exact handoff wording and numbers, source basis, periods, units, qualifications, limitations and conclusions. The delivery layer selects and orders handoff material; it performs no analysis.
- Put source references, identifiers and raw trace payloads on Evidence or inside the trace drawer. Use a trace control on each sourced paragraph, row or figure elsewhere. If a source or screen input is unavailable, show its honest gap or blocked state.
- Keep the Library's prior-period indication only where that row carries a prior period. Do not invent a typed stance or changed-first sort. Preserve the Changes handoff's own qualifiers and distinguish “no longer stated” from removal. Signal's source can be empty; draw its real empty and failed states.
- Run start follows the four-step flow: Documents, Purpose, More context, Review and start, with a persistent readiness rail. Its top bar has no Start run action.

## Approval and build gates

The coordinator reports Stage R accepted: all fifteen private maps and mockups passed the batched review, the checker/probes and the three-width review. The reviewed artifacts are private and are not included here. Formal owner approval is still a prerequisite for production implementation; this ruling does not record that approval or authorize implementation.

After the Colour changes merge, implementation begins only after a pre-flight diff. Keep each implementation batch at or below 800 changed lines, run the code quality gate and design migration tests, verify 1024/1280/1440 rendering, and record the presentation fidelity check in `VERIFICATION.md`. Resolve any source mismatch against the handoff; do not repair it by deriving or substituting a value in the delivery layer.
