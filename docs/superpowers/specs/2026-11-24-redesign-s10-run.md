# Redesign S10: Run activity, Run progress, shared pipeline

Branch `claude/redesign-s10-run`. Plan: `docs/superpowers/plans/2026-11-24-frontend-redesign.md`.
Requirement: `docs/design/screen-map.md` § Run activity and run progress, § On every screen,
§ States every screen draws.

## 1. Screen-map rows covered

| Screen | Rank | What to show | How | Where | Needs |
|---|---|---|---|---|---|
| Activity | P1 | Runs in flight and their state | List, running first; state chip; progress as modules done of total | Main | Code |
| Activity | P2 | Failed, capped or interrupted runs with the reason | Reason in words on the row | Main | Code |
| Progress | P1 | The pipeline live: which module is running, done, failed | The same staged node graph as Overview, animated on the running edge | Top | Code |
| Progress | P1 | Spend against the cap | Meter with the amount in mono | Beside the pipeline | Code |
| Progress | P2 | What just happened | Feed, newest first | Under the pipeline | Code |
| Progress | P1 (done) | Open report | One primary button | Top right | Code |
| Progress | P1 (failed) | What failed, why, and what to do | Notice with retry or resume | Top | Code |
| Overview row 7 | P3 | The run as a pipeline (owned by S1; S10 owns the graph it draws) | Five stages, nodes, animated edges, blocked dashed | Row 7 | Code |
| All | — | States: loading skeleton in final layout, empty, unreachable service, read-only preview, synthetic test chip | | | Code |

## 2. Per row: component, data, states, place

### `components/pipeline/Pipeline.tsx` (new, presentational)

`Pipeline({ stages, label })`; `stages: { name; nodes: PipelineNode[] }[]`;
`PipelineNode = { id; name; state: "delivered" | "running" | "queued" | "blocked" | "failed"; href?; word?; detail? }`.
Draws only what it is given; no reading of handoffs or run records.

- Stages are columns from `lg` (24 px gap carries a 12 px stub per node and a bus); below `lg` one
  vertical line with the stages stacked (moved unchanged from `PipelineRow`).
- Node = link when `href` is given, otherwise a static item (same box). Right side: delivered is a
  dot with a screen-reader word; every other state is a status badge (Run states or Module state
  set; `word` picks the exact word, e.g. "Interrupted", "Not run", "Not assessable").
- Edges (`pipeline-flow` is the only animation; inside `prefers-reduced-motion: no-preference` already):
  the edge leaving a delivered node and the edge into a running node animate; a blocked or failed
  node passes nothing on (no out-edge) and its in-edge is dashed orange when blocked; queued edges
  are plain connector colour.
- Running node: tinted fill and accent edge. Blocked: dashed orange outline (as Overview).
  Failed (module stopped without an assessment word): badge tone sets the edge, never red for a finding.
- Delivered and queued nodes are marked quietly (a dot or ring with a screen-reader word); running, blocked and failed nodes carry a status badge under the name. Names wrap; the bus is drawn per node so uneven node heights stay joined.

### `report/overview/PipelineRow.tsx`

Same export, same props, same output. Maps its nodes (`Delivered` → delivered, `Not assessable` →
blocked, anything else → queued with its word) and renders `<Pipeline label="Stages">` inside the
existing well, the legend and the bottom lines unchanged. `lowerRows.test.tsx` stays green.

### Run progress (`RunProgress.tsx`)

12-column bento (`Bento`, `Tile`, `Well`, `GapNote`, `Figure`), reading `ConnectedRun` as today
(`getRun` 2 s poll, `getReport`, `runFigures.ts` helpers; no new request).

1. Header (frozen `PageHeader`): breadcrumb; issuer; chips: run state, pathway, as-of, **Synthetic
   test** (drawn from the first paint, before the run loads); right: **Open report** (primary link,
   only when the report is ready) and "Use this run’s inputs" (secondary, unchanged conditions).
2. Notice (full width, top, only when `reason`, held, stalled, waiting or report problem): the
   existing Alert texts and roles kept. For failed, capped, rejected and interrupted it also says what
   stopped (the module row the record marks, via `moduleSteps`) and what to do (the existing restart
   sentence: review the inputs in a new draft; the new run has its own cap).
3. Pipeline tile (span 8): "Pipeline", `Pipeline` over `byStage(modules)` with a final "Report"
   stage for the Report row, outer list named "Modules in this run" (the test hook), nodes from
   `moduleSteps` (word → state: Finished delivered, Running running, Queued/Not run queued, Not
   assessable blocked with its detail line, Interrupted failed). Caption "n of m modules done" in mono.
4. Spend tile (span 4): amount in mono large, "of USD cap", meter (`ProgressBar`, the existing
   label text), then modules finished and elapsed as mono key-values. No cap or unreadable journal:
   the gap note with the service's reason (`spendFigure.note`); never zero.
5. Feed tile (span 12): "What just happened", `Feed` restyled as compact rows, newest first; the
   existing "activity log is unavailable" and "No activity recorded yet" sentences kept.

States: loading = header + the same three tiles as skeletons; run not found / unreachable / failed =
the existing alerts with Try again or a link back, and the three tiles as gap notes that say the run's
progress is not known (not blank, not zero); finished with report pending / absent / unreachable =
existing alerts and the Check for report control; read-only preview = ConnectedApp's (see requests).

### Run activity (`RunActivity.tsx`)

1. Header: "Run activity", Updated stamp, **Synthetic test** chip when `mode="synthetic"`, "Start a run".
2. Counts strip (`StatsStrip`: Running, Waiting, Ended without a report; `dt`/`dd` pairs kept).
3. Running first: a card per run: issuer link, pathway, state chip (Running), stalled chip, line
   "n of m modules" in mono, a proportional meter and a per-module segment strip (one cell per module:
   done, running, waiting), then the notes (files, reason, name-differs). Module list stays as a
   labelled list of names with state words.
4. Waiting: the table (keyboard-focus follow kept), in a tile.
5. Ended without a report: table with state chip (Failed / Capped / Rejected / Interrupted), ended
   time, and the reason in words as the widest column; "Showing the latest n of m" kept.
6. States: loading skeleton in the same two-column layout with the counts strip placeholder; empty
   ("No run in progress" + "Open the library" + Start a run); unreadable records; failed poll (alert,
   last good list kept); held by the service. All existing texts kept.

### `pages/run/activity/*` (Feed, Summary, ModuleSteps, ActivityPage)

`ActivityPage` is the hash-routed slice surface (`#/run/...`), not the connected app's pages. Its
tests pin its behaviour and it stays. `Feed` is restyled (compact, mono time, state shape) and
shared with Run progress; `Summary` and `ModuleSteps` stay for `ActivityPage` and are no longer
imported by the connected pages. `activity.css` unchanged.

## 3. Files

Add: `web/src/components/pipeline/Pipeline.tsx`, `Pipeline.test.tsx`, `index.ts`;
`web/src/pages/connected/runProgressParts.tsx` (Spend tile, notice, stage mapping),
`web/src/pages/connected/runActivityParts.tsx` (run card, tables) if the page files grow past reading size.
Change: `RunProgress.tsx`, `RunActivity.tsx`, `report/overview/PipelineRow.tsx`, `run/activity/Feed.tsx`.
Delete: nothing.

Tests to add: `Pipeline.test.tsx` (states, edges, link vs static, reduced-motion class contract);
new-layout tests in `runProgress.layout.test.tsx` and `runActivity.layout.test.tsx` (synthetic chip,
spend meter in mono, pipeline from run modules incl. Report stage, notice what/why/what-to-do, gap
tiles when unreachable, running-first order, ended reason on the row).
Tests to rewrite: only locators that pin layout (`runStates.test.tsx` row helper keeps the "Modules in
this run" list name so it stays; `ConnectedApp.test.tsx` expectations on the "Modules and report
delivery" heading, which names the old card, move to "Pipeline").
Behaviour tests kept as is: polling, state names, reasons, earliest unaccepted module at a checker
stop, links, "Open report", Failed / Capped / Rejected / Interrupted words.

## 4. Gaps drawn today

- A module's per-module duration or spend is not in the run record: not drawn.
- Nodes on Run progress have no link: a run's modules have no page until the report is published.
- An open "retry or resume" beyond "Use this run’s inputs" (a new draft) does not exist in the service;
  none is invented.

## 5. Sub-agent plan

- Pipeline component and `PipelineRow` extraction: me (Sonnet, high); the Overview tests are the guard.
- Run progress and Run activity layout: me. Test rewrites and the new layout tests: one Sonnet
  sub-agent after the components exist.
- One independent review of the final diff (Opus, high), given the code not my conclusions.

## 6. Requests to the coordinator

1. `ConnectedApp.tsx`: pass `mode` to `<RunActivity mode={mode} />` (RunActivity accepts an optional
   `mode`; without it no chip is drawn on the list).
2. `ConnectedApp.tsx`: the read-only preview for `run-list` and `run` is a bare "Read-only preview"
   header. The screen map lists a read-only preview state; the page would be better drawn as the
   screen's own header with a gap tile that says runs are not available in a read-only preview. I
   export `RunReadOnly` from `RunActivity.tsx` for that.

## 7. Verification

Built as specified, with these differences: no `PipelineLegend` (state words are in the nodes);
the pipeline tile is 9 columns and the spend tile 3 at 1280 px and up, both full width below
(the six stage columns need the width); no per-module segment strip on the activity cards (the
module list with state words and the meter carry it).

Checks run (all in `web/`): `npx tsc --noEmit` clean; `npx eslint --max-warnings=0` and
`npx prettier --check` on every changed file clean; `npm run build` clean; `vitest` on
`src/pages/connected` (117 files, 1709 tests, ConnectedApp.test.tsx run separately), `src/components`,
`src/styles`, `src/shell`, `src/pages/run` (68 files, 787 tests) all pass, including
`lowerRows.test.tsx` (PipelineRow); `tools/quality_gate.py --base 1265838`: no Python changed, 0
findings. `npm run unused` reports one unused type, `LeadProps` in the frozen
`report/leads/types.ts`, which this branch does not touch.
Tests rewritten (layout only): the "Modules and report delivery" heading locators in
`shellFinalAudit.test.tsx` and `ConnectedApp.test.tsx` now locate the pipeline list. Tests added:
`components/pipeline/Pipeline.test.tsx`, `pages/connected/runLayout.test.tsx`.

Screenshots looked at, 1440 and 390 px, from the **built page served by `react_frontend` with the
run and activity responses replaced by fixtures in a throwaway Playwright script** (the run states
were not produced by the synthetic drive; synthetic data is thin and cannot show failed or capped):
running, failed (checker stop; Downside is the stopped module), capped, finished (Open report +
Use this run's inputs), unreachable (alert, three gap tiles), activity list (two running, one
waiting, three ended), activity empty, activity unreachable. What I saw: the pipeline reads as
five stage columns plus a Report delivery column at 1440 and as one vertical line at 390; the
running node is tinted with a Running badge and a dashed animated edge into it; the stopped
module is a dashed orange node with "Not assessable" and its detail; spend is one large mono
amount with the cap meter; the failed notice leads the page with reason, where it stopped and what
to do; no horizontal page scroll at 390 (the ended table scrolls inside its panel). A defect I
found and fixed from these: node names broke mid-word and the "Not assessable" badge overflowed its
node; names now wrap at word boundaries and the badge is compact.
A real synthetic drive (`proof.serve` + `drive-synthetic-run.cjs`) was also screenshotted at 1440 px
the moment the run was registered: 0 of 14 modules, all queued, the Synthetic test chip, USD 0.00
of the cap (the service's own recorded zero). The synthetic run completes too fast to catch a module
in progress, so running/failed/capped come from the fixtures above.
An independent review (Opus, given the diff only) found: (1) a node with the word "Delivered with
gaps" or "Not run" was drawn as a quiet ring with a screen-reader-only word: fixed (quiet only for
the state's own word; test added); (2) and (3) the chip and read-only state need `ConnectedApp.tsx`,
which this package does not own: they are requests 1 and 2 above. No other defect found (figures
from the record, polling, restart-note id, edges, no test weakened, no hex or inline style).
Not run: the paid or live drive; reduced-motion
rendering was checked only by the CSS (the animation sits inside `prefers-reduced-motion: no-preference`).

## 8. Coordinator review round (23 Nov 24, 17 items) — what changed

Items 1–17 of the coordinator's review of 34145e4 were fixed on this branch, tests first. Layout
now: Run progress = one pipeline tile whose header holds the h2, the one modules meter and the spend
block (spend first in reading order, beside the title from `lg`), then the graph full width, then the
feed. Run activity = counts line, then Running (one compact row per run: state, "n of m modules" in
mono with one meter, "Now: module"), then Ended without a report (reason on the row), then Waiting.
The pipeline draws two sub-columns for a stage of more than four nodes, a key of the states in
use, flow modes (`delivered` for the Overview, `running` for a run in flight, `none` otherwise),
one bus per gap, and columns from `xl` (a single list below; a three-column grid inside each stage
from `lg`). Not done: spend on the activity row (the activity feed carries none for a run in flight);
stage headings on the Overview stay h3 beside the tile's h3 title, because `lowerRows.test.tsx`
(not to be changed) pins h3 stage headings.
Screenshots re-taken at 390, 768, 1024, 1280 and 1440 from the built page with fixtures (22-module
run in flight, checker stop with three modules in flight, failed with no reason, capped, finished,
unreachable; activity list with two running, one waiting, three ended with long reasons, empty).

### Overview addendum (items 18–23)

18 bottom lines are placed by count, not by the browser's column balancing: 13 lines are 5/4/4 in
three columns and 7/6 in two (grid with per-item column/row variables, pipeline order kept).
19 a blocked module draws its full name, the slash icon and "Not assessable" in a dashed orange
outline on a warm fill; every node of its stage grows from 44 to 64 px so sub-columns still line up.
20 the key lists only the states present (the old fixed legend text is gone). 21 the accessible name
"Bottom line by module" is kept, and the visible heading now reads the same. 22 `byStage` returns
rows in the stage's module order (one change in `report/stages.ts`); the lines are flattened from it.
23 every edge is a solid connector-coloured line with the dashes laid over it, and in flight the
delivered edges out of the stage before, the bus, and the edge into the running node move together.
`lowerRows.test.tsx` is unchanged. Not verified in a browser: the Overview itself (this branch does
not mount `PipelineRow`; S1 integrates it) — checked by DOM tests and on Run progress, which draws
the same component with a blocked node.

### Round 3 (P1–P10)

One meter component (`runMeter.tsx`) serves the activity rows and both Run progress meters (names
"Modules finished" and "Spend against cap", valuetext carries the reading, the cap is stated once, in
the spend label). Stage columns are back to `lg` for every use (a stage of five nodes or fewer is one
column, so no mid-word breaks from 1024). In flight only the path into each running module moves: its
own branch and the bus segment from the trunk to it. Run progress puts title, modules meter, elapsed
and spend in one band, the feed below in three columns from xl; the stop notice is one paragraph with
its action inline. Feed heading y (built page, fixtures): in flight 699 at 1440x900 and 1280x800 (3+
entries on screen), delivering 731, finished 727/743, each stopped state 823 at 1440 (notice + heading
visible). The Overview pipeline was rendered at 1024 and 1440 with 14 and 21 modules through a
temporary, uncommitted harness (this branch does not mount `PipelineRow`).
