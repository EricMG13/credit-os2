# Stage 0: confirmed section table

Audited commit: `main` 2b881075 (checkout on `audit/final-coordination`, a0d18ac; no change under
`web/` since). Checked by listing every `.ts`, `.tsx` and `.css` file under `web/src/` outside
`web/src/pages/signal/` (283 non-test files, `web/src/setup.ts` included) and matching each to one row below; every listed
file and route was confirmed to exist (`find`, `grep -n "path:"` on each `routes.tsx`).

Convention: a directory entry (ending `/`) owns every file under it. A test file
(`*.test.ts`, `*.test.tsx`), a `*.cases.json` table and a `*.fixture.ts` belong to the section of
the file it tests. `web/src/setup.ts` (the Vitest setup) is assigned to X1. Static-app routes are
hash routes (`#/…`) from `web/src/pages/route-table.ts` and the three `routes.tsx` files; connected
routes are server paths from `react_frontend/__init__.py:238-243`.

## Corrected table

| Id | Section | Surface | Files or routes |
| :--- | :--- | :--- | :--- |
| C1 | Shell, library index, run activity and progress | Connected | `web/connected.html`, `web/src/connected-main.tsx`, `web/src/ConnectedLoadBoundary.tsx`, `web/src/pages/connected/ConnectedApp.tsx`, `web/src/pages/connected/layout.tsx`, `web/src/pages/connected/LibraryIndex.tsx`, `web/src/pages/connected/ReportLibrary.tsx`, `web/src/pages/connected/RunActivity.tsx`, `web/src/pages/connected/RunProgress.tsx`, `web/src/pages/connected/api.ts`, `web/src/pages/connected/useResource.ts`, `web/src/pages/connected/runFigures.ts`; routes `/`, `/index.html`, `/runs`, `/run/<id>`, and the frame of `/report/<folder>` |
| C2 | Start a run (all steps, review sheet, Submit dialog) | Connected | `web/src/pages/connected/StartRun.tsx`, `web/src/pages/connected/start/`; route `/start` (and `/start?from=<run>`) |
| C3 | Report: overview, changes, modules | Connected | `web/src/pages/connected/ReportContent.tsx`, `web/src/pages/connected/HeadlineFigures.tsx`, `web/src/pages/connected/publishedReport.ts`, `web/src/pages/connected/reportView.ts`, `web/src/pages/connected/signal.ts`, `web/src/pages/connected/report/Changes.tsx`, `web/src/pages/connected/report/Modules.tsx`, `web/src/pages/connected/report/ModuleTable.tsx`, `web/src/pages/connected/report/Confidence.tsx`, `web/src/pages/connected/report/MetricGrid.tsx`, `web/src/pages/connected/report/IdentityBand.tsx`, `web/src/pages/connected/report/OverviewModules.tsx`, `web/src/pages/connected/report/ToneMark.tsx`, `web/src/pages/connected/report/YearChange.tsx`; tabs Overview, Changes, Modules of `/report/<folder>` |
| C4 | Report: forecast and visuals | Connected | `web/src/pages/connected/report/Forecast.tsx`, `web/src/pages/connected/report/Downside.tsx`, `web/src/pages/connected/report/BreakPoints.tsx`, `web/src/pages/connected/report/MacroSensitivity.tsx`, `web/src/pages/connected/report/Securities.tsx`, `web/src/pages/connected/report/Calendar.tsx`, `web/src/pages/connected/report/PortfolioBasis.tsx`, `web/src/pages/connected/report/RunCharts.tsx`, `web/src/pages/connected/visuals/`; tab Forecast of `/report/<folder>` |
| C5 | Report: evidence, trace, record, downloads | Connected | `web/src/pages/connected/report/Evidence.tsx`, `web/src/pages/connected/report/PublishedTrace.tsx`, `web/src/pages/connected/report/Record.tsx`, `web/src/pages/connected/report/ScriptChecks.tsx`, `web/src/pages/connected/report/ArtifactDownloads.tsx`, `web/src/pages/connected/report/comparisonTrace.ts`, `web/src/pages/connected/report/calculations.ts`, `web/src/pages/connected/sourceFiles.ts`; tab Evidence of `/report/<folder>` (`#evidence/<token>`) |
| S1 | Shell, navigation, addresses, the kit page | Static | `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`, `web/src/data.ts`, `web/src/route.ts`, `web/src/pages/route-table.ts`, `web/src/pages/source.ts`, `web/src/shell/`, `web/src/pages/Kit.tsx`, `web/src/pages/Kit7c.tsx`, `web/src/pages/Kit7d.tsx`, `web/src/pages/Kit7e.tsx`, `web/src/pages/Kit7f.tsx`, `web/src/pages/Kit7g.tsx`; routes `#/kit`, `#/` and the bare group addresses `#/library`, `#/model`, `#/run`, the not-found page |
| S2 | Library home, history, overview, changes | Static | `web/src/pages/library/Home.tsx`, `web/src/pages/library/History.tsx`, `web/src/pages/library/Overview.tsx`, `web/src/pages/library/Changes.tsx`, `web/src/pages/library/routes.tsx`, `web/src/pages/library/read.ts`, `web/src/pages/library/slice.ts`, and in `web/src/pages/library/parts/`: `BottomLine.tsx`, `CellValue.tsx`, `ChangeCard.tsx`, `ChangeViewNote.tsx`, `ChangesTable.tsx`, `DirectionMark.tsx`, `FilterBar.tsx`, `Findings.tsx`, `InlineCell.tsx`, `IssuerCard.tsx`, `IssuerList.tsx`, `LibraryPage.tsx`, `Limitations.tsx`, `MetricTile.tsx`, `ModuleItems.tsx`, `NotHeld.tsx`, `PageTitle.tsx`, `RunContext.ts`, `RunFeed.tsx`, `RunFrame.tsx`, `Section.tsx`, `SourcesSwitch.tsx`, `heading.ts`, `links.ts`; routes `#/library/home`, `#/library/:issuer/history`, `#/library/:issuer/:run/overview`, `#/library/:issuer/:run/changes` |
| S3 | Library modules | Static | `web/src/pages/library/Module.tsx`, and in `web/src/pages/library/parts/`: `ChartTableBlock.tsx`, `EdgesBlock.tsx`, `FactsBlock.tsx`, `GapBlock.tsx`, `MatrixBlock.tsx`, `Measure.tsx`, `MeasuresBlock.tsx`, `MetricsBlock.tsx`, `ModuleNav.tsx`, `QuestionsBlock.tsx`, `Records.tsx`, `StatementBlock.tsx`, `StatusBlock.tsx`, `TableCard.tsx`, `WatchBlock.tsx`, `chartCell.ts`, `chartTableStyle.ts`, `recordNav.ts`; routes `#/library/:issuer/:run/modules`, `#/library/:issuer/:run/modules/:module` |
| S4 | Library evidence and trace | Static | `web/src/pages/library/Evidence.tsx`, `web/src/pages/library/EvidenceSummary.tsx`, `web/src/pages/library/EvidenceSources.tsx`, `web/src/pages/library/EvidenceTrace.tsx`, `web/src/pages/library/EvidenceGaps.tsx`, `web/src/pages/library/EvidenceRecord.tsx`, and in `web/src/pages/library/parts/`: `CopyToast.tsx`, `DerivationTree.tsx`, `DownloadButton.tsx`, `EvidenceFrame.tsx`, `JumpMenu.tsx`, `ModuleFilter.tsx`, `Readers.tsx`, `RegisterPage.tsx`, `RegisterTable.tsx`, `Snippet.tsx`, `SourceFileLinks.tsx`, `SourceFileRow.tsx`, `TraceControl.tsx`, `TraceDrawer.tsx`; routes `#/library/:issuer/:run/evidence`, `…/evidence/summary`, `…/evidence/sources`, `…/evidence/trace`, `…/evidence/trace/:item`, `…/evidence/gaps`, `…/evidence/gaps/:item`, `…/evidence/record` |
| S5 | Model | Static | `web/src/pages/model/`; routes `#/model/runs`, `#/model/:issuer/:run/front`, `…/analysis`, `…/statements`, `…/portfolio-fit`, `…/limitations`, `…/forecast` |
| S6 | Run start and run activity | Static | `web/src/pages/run/`; routes `#/run/start/:draft`, `#/run/activity`, `#/run/activity/:run` |
| X1 | Shared components | Both | `web/src/components/`, `web/src/utils/`, `web/src/styles/theme.css`, `web/src/index.css`, `web/src/setup.ts` |

Excluded (Signal, out of scope, not audited): `web/src/pages/signal/`, the `#/signal/*` routes and
the Signal rail item, `src/deploy_workflow/signal/`, `docs/signal/`.

## Corrections made to the README table

Files and routes in the README table that exist as written: every C1–C5 file named, `start/`,
`visuals/`, `web/src/shell/`, `App.tsx`, `route.ts`, `route-table.ts`, `#/kit` (`web/src/App.tsx:103`),
`web/src/components/`, and every S2–S6 route. None is missing.

Route spellings corrected (the README abbreviated them; the real patterns are in the table):
- `…/overview` and `…/changes` are `/library/:issuer/:run/overview` and `/library/:issuer/:run/changes`
  (`web/src/pages/library/routes.tsx:31,37`), not under `/library/:issuer/`.
- `…/evidence/*` is eight explicit routes, no wildcard (`web/src/pages/library/routes.tsx:59-108`);
  `web/src/pages/route-table.ts:74` says the matcher has no wildcard.
- `/model/*` is seven routes (`web/src/pages/model/routes.tsx:18-55`).
- C4/C5 short names (`Downside`, `BreakPoints`, `MacroSensitivity`, `Securities`, `Calendar`,
  `PortfolioBasis`, `RunCharts`, `PublishedTrace`, `Record`, `ScriptChecks`, `ArtifactDownloads`)
  are `.tsx` files in `web/src/pages/connected/report/`; `comparisonTrace.ts` is in the same folder.

Unassigned files placed (files in no row of the README table):
- Entry points: `web/connected.html`, `web/src/connected-main.tsx`, `web/src/ConnectedLoadBoundary.tsx` → C1;
  `web/index.html`, `web/src/main.tsx`, `web/src/data.ts`, `web/src/pages/source.ts` → S1.
- Kit files: `web/src/pages/Kit.tsx`, `Kit7c.tsx`, `Kit7d.tsx`, `Kit7e.tsx`, `Kit7f.tsx`, `Kit7g.tsx` → S1
  (the README named only the `#/kit` route). `web/src/pages/Kit7b.test.tsx` has no `Kit7b.tsx`; it tests
  `Kit.tsx` and stays with S1.
- Connected service client and helpers: `api.ts`, `useResource.ts`, `runFigures.ts` → C1.
- Connected report data and overview parts: `publishedReport.ts`, `reportView.ts`, `signal.ts`,
  `report/IdentityBand.tsx`, `report/OverviewModules.tsx`, `report/ToneMark.tsx`, `report/YearChange.tsx` → C3.
  Note: `web/src/pages/connected/signal.ts` is **not** Signal code. It is exact decimal subtraction for
  change figures (`exactDifference`, imported by `report/Changes.tsx`, `report/YearChange.tsx`,
  `reportView.ts`); it is outside every Signal path and is in scope.
- `report/calculations.ts` and `sourceFiles.ts` → C5 (calculation trace nodes and source-file links of
  the Evidence tab).
- Static library files (the README listed routes only): the 11 page files, `routes.tsx`, `read.ts`,
  `slice.ts` and all 56 files in `web/src/pages/library/parts/` → S2, S3 or S4 by the page that imports
  them (a part used by several library pages goes to S2 when an S2 page uses it; otherwise S3 for
  Module-only blocks, S4 for evidence/trace parts).
- `web/src/utils/`, `web/src/styles/theme.css`, `web/src/index.css` (imported by both entry files,
  `web/src/main.tsx:5`, `web/src/connected-main.tsx:4`) and `web/src/setup.ts` → X1.
- `web/src/pages/model/` and `web/src/pages/run/` are taken whole (S5, S6), including
  `web/src/pages/run/activity/activity.css`, `web/src/pages/run/test-helpers.tsx` and
  `web/src/pages/model/slice/test-fixture.ts`.

Duplicates: none in the README table. Nothing is assigned twice in the corrected table.

New section ids: none. Ids remain C1–C5, S1–S6, X1.

## Lead ruling L1: pages outside the two surfaces (2026-11-17)

Stage 0 found two more HTML pages the README's Scope table does not name (`surface-map.md`): the
legacy issuer library (`apps/issuer-library`, built to `<workspace>/library/index.html`, served at
`/library/*` by `react_frontend`) and the legacy run-start form (`docs/templates/context-form.html`,
`python -m deploy_workflow.run_start`, unreachable under `react_frontend` because `/` serves the
connected page). Ruling: neither becomes a stage 2 section; the owner fixed the scope at the two
browser surfaces. The download links the connected report builds into `/library/downloads/<run>/…`
(`publishedReport.ts:558-571`) are part of C5 and are audited there, including whether the files
they point at are served. That the legacy pages ship in the release ZIP and remain reachable is
carried to stage 4 as an Info finding for the owner and the sweep.

## Cross-surface ownership the stage-2 agents need

Each file has one owner, but these files are drawn in the other surface too. The owner audits the
file; the other section audits only how it is used.

- `web/src/shell/Shell.tsx` and `web/src/shell/PageHeader.tsx` (S1) render the connected rail and
  headers (`web/src/pages/connected/ConnectedApp.tsx:4,69`; `LibraryIndex.tsx:214`). The connected
  rail shows Library and Run only (`ConnectedApp.tsx:28-31`).
- S6 files drawn in the connected app: `web/src/pages/run/start/Purpose.tsx`, `Start.tsx`
  (`SubmitConfirmation`), `Stepper.tsx` in C2 (`StartRun.tsx:14-16`); `web/src/pages/run/activity/ModuleSteps.tsx`,
  `Feed.tsx`, `Summary.tsx` in C1 (`RunProgress.tsx:8-10`); `web/src/pages/run/TextLink.tsx` in C1
  (`layout.tsx:2`, `LibraryIndex.tsx:6`, `RunActivity.tsx:11`, `ReportLibrary.tsx:9`);
  `web/src/pages/run/slice-activity.ts` types in `runFigures.ts:1`.
- S2/S3/S4 library parts drawn in the connected report: `BottomLine`, `RunContext`, `RunFrame`
  (`RunTabLink`), `SourcesSwitch`, `ChangeCard`, `MetricTile`, `heading` (S2); `ModuleNav`,
  `MatrixBlock`, `QuestionsBlock`, `StatementBlock`, `StatusBlock`, `WatchBlock` (S3);
  `TraceControl`, `TraceDrawer`, `DerivationTree`, `DownloadButton`, `SourceFileLinks` (S4), and
  `web/src/pages/library/slice.ts` types. Importers: `web/src/pages/connected/ReportContent.tsx:6-11`,
  `report/ModuleTable.tsx:2-9`, `report/Evidence.tsx:3-9`, `report/MetricGrid.tsx:2-5`, and others.
- C3 files drawn in the static library: `report/YearChange.tsx` (`web/src/pages/library/parts/MetricTile.tsx:2`)
  and `report/ToneMark.tsx` (`web/src/pages/library/parts/ChangeCard.tsx:6`).
- `web/src/pages/library/parts/PageTitle.tsx`, `Section.tsx` and `slice.ts` are also imported by Signal
  pages; Signal's tests must still pass after a change to them (README, Scope).

Not verified: coverage was checked by a script over the file list (283 files, each matched exactly once); test files were matched to sections by convention only, not one by one; whether each
stage-2 agent can audit a section whose files are drawn in the other surface (the cross-surface list
above) was not tried; nothing was rendered for this table.
