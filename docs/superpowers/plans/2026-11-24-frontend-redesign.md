# Frontend redesign: implementation plan

2026-11-24. Owner's instruction: complete the redesign of all screens from the screen map;
spec, then spec-driven build by sub-agents with model and effort varied by task, then an
adversarial review by the coordinator; run as parallel cloud sessions with one coordinator.

## Goal and inputs

Every screen in `docs/design/screen-map.md` rebuilt to the chosen direction, not re-coloured.
"Rebuilt" means the page's blocks, their order, their forms and their sizes follow the screen
map's rows and ranks; the old page's layout is not the starting point.

| Input | Role |
|---|---|
| `docs/design/screen-map.md` | What each screen and module shows, for whom, in what form, where, at what rank. The requirement |
| `DESIGN.md` | Direction, tokens, form-selection rules |
| `PRODUCT.md` | Personas, principles, methodology / code / input split |
| Design canvas (Overview, Module CP-1, Forecast mockups) | The look to match; copies of the three files are in `docs/design/mockups/2026-11-24/` |
| `docs/design/preview/README.md` | How to see a page on the synthetic Northbridge run |
| `AGENTS.md` | Project rules; they bind every session |

## Phases

| Phase | Who | Output | Gate to the next phase |
|---|---|---|---|
| 0. Foundation | Coordinator | Theme, top bar, segmented control, `components/kit` (stats strip, segmented, bar cell), `report/overview` tiles, `report/leads` contract, preview scripts | Done before launch |
| 1. Spec | Each session, first hour | `docs/superpowers/specs/2026-11-24-redesign-<id>.md`, committed and pushed before any code | Coordinator reads it; a session does not wait for an answer unless the spec states a blocking question |
| 2. Build | Each session, with its own sub-agents | Code and tests on the session's branch, in small commits | The session's own checks pass and its screenshots are recorded in its spec |
| 3. Adversarial review | Coordinator (Fable) | Findings per branch, sent back to the session; fixes pushed | No open finding of importance |
| 4. Integration | Coordinator | Branches merged into `claude/exciting-albattani-v1zoug` in the order below; full web gates; `VERIFICATION.md` entry; old design docs removed | Owner reviews the integrated branch |

## Rules for every session

1. **Scope.** Change only the files your package owns (table below) and new files beside them.
   Frozen for everyone but the coordinator: `web/src/styles/theme.css`, `web/src/shell/**`,
   `web/src/components/kit/**`, `web/src/pages/connected/report/overview/Tile.tsx`,
   `web/src/pages/connected/report/leads/{types.ts,index.ts}`, `web/package.json`, `DESIGN.md`,
   `PRODUCT.md`, `AGENTS.md`, `VERIFICATION.md`, `docs/design/screen-map.md`. If you need a
   token, a kit part or a frozen file changed, write the request in your spec under "Requests to
   the coordinator" and carry on with what you have.
2. **Use the kit.** `Bento`, `Tile`, `Well`, `GapNote`, `Figure` (`report/overview/Tile.tsx`);
   `StatsStrip`, `Segmented`, `BarCell` (`components/kit`); the existing status badges and
   `PublishedSource` trace control. Do not write a second version of any of them.
3. **No hex colour in `web/src`** outside `theme.css` (a test enforces it). No new dependency.
   Content security policy: no inline script or style element, no remote asset.
4. **Delivery adds no analysis.** Draw only text and numbers the handoffs carry. An exact
   difference of two given figures is allowed where the page already shows one. Never
   interpolate; missing is never zero; a blocked module or absent figure is the designed gap state
   with the reason. Source references, file names, hashes, ids and run codes appear only on
   Evidence and in the trace drawer.
5. **Form follows data shape** (`DESIGN.md` § Choosing the form). No generic chart card. Two
   periods are a before→after mark, not a column chart.
6. **Rank sets size and position.** P1 is the largest thing on the page and first; P2 on the
   first screen; P3 lower or behind a disclosure.
7. **Accessibility.** Real landmarks, headings, lists, buttons and links; one accessible name per
   region; text contrast 4.5:1; direction never by colour alone; targets 32 px, 44 px on a phone;
   works at 390 px with no horizontal page scroll.
8. **Tests.** Write the test for a block before the block. Tests that pin the old layout are
   rewritten to the new one, not deleted without replacement; a test of behaviour (values,
   links, states, gaps) is kept. Never skip or weaken a test to get green.
9. **Checks before you report done** (fast, targeted; each under five minutes): `npx tsc
   --noEmit`; `npx eslint --max-warnings=0` and `npx prettier --check` on changed files; `npx
   vitest run` on the directories you changed; `npm run unused`; `npm run build`. Screenshots at
   1440 and 390 px of each rebuilt screen on the synthetic run, looked at, with what you saw
   written in your spec's "Verification" section. Say what you did not run.
10. **Git.** Commit small, push often, to your own branch only. No pull request. No rebase or
    force-push. Do not edit `VERIFICATION.md`; the coordinator consolidates.
11. **No paid run, no provider call, no credential file.** Synthetic proof and retained
    fixtures only.
12. **Report.** When done or blocked, send the coordinator session one message: branch, spec
    path, what is built against each screen-map row, what is a gap and why, checks run and not
    run, requests.

## Spec template (phase 1)

`docs/superpowers/specs/2026-11-24-redesign-<id>.md`:

1. Screen-map rows covered, copied with their rank and "Needs".
2. For each row: the component, its props, the handoff data it reads (module, section, table),
   its states (data, gap, blocked, empty, loading), and its place in the grid at 1440 and 390 px.
3. Files to add, change and delete; tests to add and tests to rewrite.
4. What is drawn as a gap today because it needs a methodology change or an input.
5. Sub-agent plan: which parts go to which model and effort, and why.
6. Requests to the coordinator.
7. Verification (filled in during phase 2).

## Work packages

All branch from `claude/exciting-albattani-v1zoug`.

| Id | Screens (screen map) | Owns | Model · effort | Why that level |
|---|---|---|---|---|
| S1 overview | Report header; Overview; History | `ReportLibrary.tsx`, `report/overview/**` except `Tile.tsx` and `PipelineRow.tsx`, `report/OverviewModules.tsx`, `report/IdentityBand.tsx`, `report/MetricGrid.tsx` | Opus · high | The page the product is judged on; assembly of eight tile rows against the mockup |
| S2 module frame | Modules (frame) | `report/Modules.tsx`, `report/ModuleTable.tsx`, `report/Record.tsx`, `report/Confidence.tsx`, `ReportContent.tsx`, `library/parts/ModuleNav.tsx` | Opus · high | Central, test-heavy file; defines the frame all 23 module pages share |
| S3 leads A | Modules: Sources, Financials, Validation and decision | `report/leads/financials.tsx`, `report/leads/decision.tsx`, new files beside them | Sonnet · high | Well-specified visuals from typed tables; CP-1 has a mockup |
| S4 leads B | Modules: Credit, Structure and market | `report/leads/credit.tsx`, `report/leads/structure.tsx`, `report/Downside.tsx`, `report/BreakPoints.tsx`, `report/MacroSensitivity.tsx`, `report/Securities.tsx` | Opus · high | Thirteen modules, mostly prose and edge tables; needs judgement on what can be drawn truthfully |
| S5 forecast | Forecast | `report/Forecast*.tsx`, `report/RunCharts.tsx`, `visuals/LegacyForecast.tsx`, `visuals/Forecast*.tsx`, `visuals/scenarioPeriods.ts` | Opus · high | Dense, recently changed code with case and period logic that must not regress |
| S6 changes | Changes; Calendar | `report/Changes.tsx`, `report/Calendar.tsx`, `visuals/EventLane.tsx` | Sonnet · medium | Two contained pages with structured data |
| S7 evidence | Evidence; trace drawer | `report/Evidence.tsx`, `report/ScriptChecks.tsx`, `report/ArtifactDownloads.tsx`, `report/PublishedTrace.tsx`, `library/parts/TraceDrawer.tsx` | Sonnet · high | Large page, but a table-and-list design with clear rules |
| S8 library | Library; Coverage | `LibraryIndex.tsx`, `Coverage.tsx`, `coverageData.ts` (reads only), `react_frontend/library_cards.py` only if a field is missing | Sonnet · high | Two list pages; Coverage has a ruling to respect |
| S9 start run | Start run, four steps | `StartRun.tsx`, `start/**`, `run/start/**` | Opus · xhigh | 3,300-line form that commits money; behaviour must be preserved exactly |
| S10 run | Run activity; Run progress; shared pipeline | `RunActivity.tsx`, `RunProgress.tsx`, `run/activity/**`, `report/overview/PipelineRow.tsx`, new `components/pipeline/**` | Sonnet · high | Extract the pipeline graph for reuse; live states |

Within a session, sub-agents are chosen the same way: the spec and any block that reads
handoff data or touches money on Opus or Fable at high effort; presentational blocks and test
rewrites on Sonnet; fixture and mechanical edits on Haiku; one independent review of the
session's diff before it reports done.

### Interfaces between packages

| Between | Contract |
|---|---|
| S2 ↔ S3, S4 | `leadFor(module)` from `report/leads/index.ts` returns a component taking `LeadProps`. S2 draws it directly under the module header and draws nothing in its place when undefined. S3 and S4 fill the four stage files; they do not touch `Modules.tsx` |
| S1 ↔ S10 | S1 imports `PipelineRow` unchanged. S10 moves the graph into `components/pipeline` and keeps `PipelineRow`'s export and props |
| S1 ↔ S6 | The Overview's changes tile and dates tile read existing helpers; S6 keeps `buildCalendar`, `upcomingCalendarRows` and the comparison helpers' signatures |
| S5 ↔ S1 | The Overview's forward-path tile reads the published model row; S5 keeps the reader functions it uses or tells the coordinator |
| Everyone ↔ Evidence | `evidencePath` and `PublishedSource` keep their signatures (S7) |

## Phase 3: adversarial review

For each branch as it reports done, the coordinator, on Fable:

1. Reads the spec against the screen map: every row covered or stated as a gap with the right
   reason; ranks honoured.
2. Reviews the diff with independent reviewers that are given the code, not the session's
   conclusions, each trying to break one thing: a number or sentence that is not in a handoff;
   missing shown as zero or hidden; a source reference on a working page; an old layout left in
   new colours; a second copy of a kit part; a weakened or deleted behaviour test; contrast and
   keyboard failures; 390 px overflow; for S9, any change to what is sent on Submit.
3. Builds the branch and looks at the screens at 1440 and 390 px on the synthetic run, and
   compares Overview, the CP-1 module page and Forecast with the mockups.
4. Sends confirmed findings to the session; the session fixes and pushes; repeat until clean.

### Reviewer model (owner, 2026-11-24)

"Switch to opus xhigh reviewers after current tasks, and final fable review before merge."
Review rounds launched from now on run on Opus at xhigh effort; rounds already running finish
as launched. A branch that an Opus round passes then gets one final review on Fable before it
is merged; findings from the final review go back to the session like any other.

## Phase 4: integration

Merge order: S10, S2, S3, S4, S1, S5, S6, S7, S8, S9. After each merge: typecheck and the
tests of the touched directories. After the last: `npm run gates`, the Python tests that read
the web build, a full set of screenshots, the confidence review `AGENTS.md` requires, one
`VERIFICATION.md` entry, and removal of `docs/design/brand-tokens.md` and the superseded prose
in `docs/design/design-system.md`.

## Done

- Every screen-map row is built at its rank or drawn as its gap with the stated reason.
- Overview, the CP-1 module page and Forecast match their mockups in structure, hierarchy and
  form on the synthetic run.
- No page uses the previous generic module template or generic chart card.
- Web gates pass; no behaviour test was removed without a replacement.
- The start-run request bodies are unchanged.

## Not in this plan

The ten changes outside the frontend (`screen-map.md` § What must change outside the
frontend): typed stance, clearance fields, pro forma rows, per-year forecast path, break-point
table, causes, typed events, and the inputs. They need method selection under
METHODOLOGY-REVIEW.md and proof on real runs, which are paid. They get their own plan after
this one lands; until then their places show the gap state.

## Risks

| Risk | Handling |
|---|---|
| Ten branches drift apart in look | Frozen theme and kit; coordinator compares screenshots across branches in phase 3 |
| Two sessions edit one file | Ownership table; a needed change in another's file is a request, not an edit |
| Synthetic text hides layout problems with real sentences | Tests on the retained TransDigm fixtures; reviewers check long text and wrapping |
| A session rebuilds on the old layout | Review item; the spec must list blocks from the screen map, not from the old page |
| Start run regresses | Xhigh effort, request-body tests kept, reviewer assigned only to that |

## Sessions (launched 2026-11-24)

Coordinator: `session_01EB6ycPxKRUz49po8T6WMyS`, branch `claude/exciting-albattani-v1zoug`.

| Id | Session | Branch |
|---|---|---|
| S1 | `session_01EB6ycR3VFeZsHNwPEvh7nA` | `claude/redesign-s1-overview` |
| S2 | `session_01EB6ycQUfYfHKjGRF2tKdZ8` | `claude/redesign-s2-module-frame` |
| S3 | `session_01EB6ycP8kCiqs7rNQv6KwEC` | `claude/redesign-s3-leads-a` |
| S4 | `session_01EB6ycPBYdDv9SZUBw7Jo2j` | `claude/redesign-s4-leads-b` |
| S5 | `session_01EB6ycQCe8XxBS2gjFigNsm` | `claude/redesign-s5-forecast` |
| S6 | `session_01EB6ycRZbVLZBJgiCyqfuxa` | `claude/redesign-s6-changes-calendar` |
| S7 | `session_01EB6ycTLXz8UohKUYgF2ewq` | `claude/redesign-s7-evidence` |
| S8 | `session_01EB6ycP6P5K1yaBQpSXRf9K` | `claude/redesign-s8-library-coverage` |
| S9 | `session_01EB6ycQcudmWEUV4y5xjsRW` | `claude/redesign-s9-start-run` |
| S10 | `session_01EB6ycPNYufzfhRnFDveY6V` | `claude/redesign-s10-run` |

## Rendered check and the three-round limit (owner, 2026-11-25)

About half of the review findings were things only a real browser shows. Every session runs
`docs/design/preview/check-render.cjs` (five widths, `--stress`, a fixture for its hard cases) and
looks at the PNGs before it reports. Owner: "consider if more than 3 rounds and likely due no live
browser. leave for local validation." So after a branch's third review round, findings that are
rendering-only (layout, overlap, size, spacing) no longer hold the merge: they are listed in
VERIFICATION.md under "For local validation" and the branch goes to the final review. Findings
about what the page says (a false or hidden statement, a wrong count, a derived figure, machinery
in page text, an unreachable control) still hold it at any round.
