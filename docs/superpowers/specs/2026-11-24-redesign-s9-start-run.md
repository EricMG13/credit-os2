# S9 · Start run: spec

2026-11-24. Work package S9 of `docs/superpowers/plans/2026-11-24-frontend-redesign.md`.
Branch `claude/redesign-s9-start-run`. Owner of `web/src/pages/connected/StartRun.tsx`,
`web/src/pages/connected/start/**`, `web/src/pages/run/start/**` and new files beside them.

The form commits money. The redesign changes presentation and structure only: every request it
sends stays byte-for-byte what it sends today (§ 3), every behaviour test stays (§ 6), and the
labels and control names the tests, `web/scripts/connected-proof.mjs` and
`docs/design/preview/drive-synthetic-run.cjs` use stay (§ 4). No provider call, no paid run.

Inputs read: `AGENTS.md`; the plan; `docs/design/screen-map.md` ("On every screen", "Start
run"); `docs/rulings/2026-11-11-run-start-submit.md`; `docs/rulings/2026-11-15-pathway-tiers-and-caps.md`;
`.impeccable/surfaces/web-src-pages-connected-startrun-tsx.md` (the owner-confirmed brief) and its
critique of 2026-11-16; `DESIGN.md`; `PRODUCT.md`; the Overview and Module CP-1 mockups;
`docs/design/preview/README.md`.

## 1. Screen-map rows covered

From "Start run" (all eight rows) and the "On every screen" elements that appear on it.

| Step             | Rank | What to show                                                                    | How                                                                                         | Where                  | Needs |
| ---------------- | ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------- | ----- |
| All              | P1   | Readiness per module for the chosen pathway, and the cap                        | Persistent panel: module list by stage with ready, conditional, blocked; "USD x of USD cap" | Right rail, every step | Code  |
| All              | P2   | Where I am                                                                      | Four-step stepper                                                                           | Top                    | Code  |
| Documents        | P1   | Drop zone; each file's detected type and what it unlocks                        | Upload list with a type chip and "unlocks: covenants, liquidity…"                           | Main                   | Code  |
| Documents        | P2   | What is missing for the modules I will want                                     | Gap rows with the module they block                                                         | Under the list         | Code  |
| Purpose          | P1   | Eight pathways as what they answer, their module count and cap                  | Cards: question, modules, cap. Not a dropdown                                               | Main                   | Code  |
| More context     | P2   | Questions for deep research, legal document status, portfolio workbook, ratings | Short form in groups                                                                        | Main                   | Code  |
| Review and start | P1   | What the run will do, what it will not do, and what it will cost                | Three blocks; each limit is a checkbox the analyst accepts                                  | Main                   | Code  |
| Review and start | P1   | Submit with the cap in the button label                                         | One primary button; confirmation dialog                                                     | Bottom                 | Code  |
| Review and start | P2   | For a private issuer: what leaves the building                                  | Plain statement before Submit                                                               | Above the button       | Code  |

| On every screen     | What                                                         | How                                                                | Where                                  |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------- |
| Gap state           | What is not known and why                                    | Hatched, dashed panel with the reason in words (`GapNote`)         | In the place the figure would be       |
| Blocked             | A module that could not run                                  | Dashed orange outline, slash icon, "Not assessable" and the reason | Wherever the module appears (the rail) |
| Synthetic test mode | A persistent chip so a test is never mistaken for a real run | The existing "Synthetic test" badge in the page header             | Page header, every step                |
| Top bar             | Areas, Start run as the primary action                       | Frozen shell (`web/src/shell/**`); not changed here                | Top                                    |

The report header, section control, basis label, trace control and better/worse marks do not
appear on Start run.

## 2. Blocks: component, props, data, states, place

Round 2 (2026-11-25) rebuilt the blocks after the coordinator's review (K1–K13, Q1–Q4); this
section states what is built now.

The page keeps one route (`/start`, lazy chunk `StartRun-*`, which the proof script checks) and one
form state (`IntakeForm`); the blocks below are views over it. Grid: from `xl` (≥1280 px) a
12-column bento, the step column 8 and the rail 4, sticky. Below `xl` one column: stepper, step,
then the rail; the one-line readiness summary ("2 of 4 ready · Cap USD 25.00") stays above the
step action. At 1024 the stepper keeps its labels and the pathway cards keep two columns. At
390 px nothing scrolls sideways, every control is at least 44 px tall, Submit is full width. The
stepper strip and the step form are kit `Tile`s. While the run options load, the same layout is
drawn as quiet tiles (hidden from assistive technology; the status "Loading run options" is what
is said).

### 2.1 Readiness rail — `start/ReadinessRail.tsx`, `start/StagePipeline.tsx` (P1, every step)

`<aside aria-label="Readiness">`, sticky from `xl`, scrolling on its own (and then focusable) when
taller than the window.

1. **Cap.** "Spending cap for this run" (live) or "Configured cap for paid runs" (synthetic); the
   cap as the rail's largest figure in mono (`text-metric`), "USD 25.00", and "Cap · {pathway}".
   No meter: nothing is spent before Submit. Cap missing: "Unavailable".
2. **Before Submit.** `<ul aria-label="Before Submit">`, four rows in the "Met or not met" set:
   Documents inspected; Purpose chosen (met from the Purpose step on, where a card is always
   selected; back to not met on a carry-over or reset); Decisions made (`n of m`); Summary
   approved.
3. **Modules.** "{n} modules · {pathway}", then the five stages as a compact pipeline: stage
   number, name, module count, and one mark per module. Before a review every mark is a quiet
   ring ("not checked yet") and the rail says once "Each module is checked against your documents
   when you review the run." After a review, from the summary alone, each module's mark is its
   most severe limit in the "Run limits" set (Will refuse, Gap, Limited, Check), or a quiet dot
   ("no limit in this review"); the page never calls a module ready. A limit on something not
   drawn as a module (the cash-flow model, say) is marked under "Other limits", so the rail never
   reads as limit-free while one exists. Under the stages, the list "Carrying a limit" names each
   limited row (Whole run first) with its word; the reasons are the review's to give, not the
   rail's. Kept from the last review, the marks say "From your last review. Review the run again
   to check changes." On Review below `xl` this tile is hidden, because the review tile draws the
   stages itself; from `xl` the rail beside the tile draws them and the tile does not.

### 2.2 Stepper — `run/start/Stepper.tsx` (P2, top)

Unchanged from round 1: four steps, `<ol aria-label="Steps in this run">`, done steps are
"Go back to {step}" buttons when the form allows; below 620 px "Step n of 4 · {step}".

### 2.3 Documents — `start/DocumentsStep.tsx` (P1 drop zone and list; P2 missing)

- **Drop zone**, large and dashed, input "Documents", `data-dropzone`; its one action is the link
  "Click to upload" (the step's one primary is Continue). A file refused at selection (type or
  size) is said in a bordered alert directly under the zone. "Choose a folder" and "Inspect
  documents" are secondary.
- **Upload list** `<ul aria-label="Documents added">`: name; the service's detected kind as a
  static chip; state (Uploading from the "File state" set while a chosen file is being sent, then
  Selected, Inspected, Ignored, Repeated content, Will be copied, Copied); facts; Remove (focus
  then moves to the next Remove, else the previous, else the drop zone).
- **Gap note** "Which modules each file serves is not reported before review." only while files
  are listed and no review has answered it (the rail says when modules are checked).
- **Missing for the modules** (after a review only): limit causes headed "Missing for the
  modules"; causes that only need checking under their own heading "To check".
- **Issuer and case date**: Issuer name, Issuer ID, As-of date and Your name each carry
  "Required" in words beside the label.

### 2.4 Purpose — `start/PurposeStep.tsx`, `run/start/Purpose.tsx` (P1)

Eight cards in the react-aria `RadioGroup` "Pathway": title, the question it answers (every line
is a question; Deep's now reads "Beyond the full assessment: how do earnings, peers, ratings,
market prices and recoveries change the view?"), module count in mono, "Cap USD x" in mono;
selected by the filled mark, accent edge and tint. Under them one kit `Well`, "Options", with
Market view, Case kind and Run form level as kit `Segmented` groups named by those labels.

### 2.5 More context — `start/ContextStep.tsx`, `start/contextSummary.ts` (P2)

One accordion: each section a native `details` sharing one name, so one is open at a time;
closed by default, its summary the title (h3) and one line from the form ("Note given · 1
question", "Cutoff 2025-03-31 · periods not given", "Not given"). Sections: For the research,
Dates and periods, Legal documents, Files with a role (when drawn), Ratings, quotes and
facilities, Issuer details; at Advanced, Valuation and peers, Module options, Scenario
assumptions, Model and modules. Two columns at `lg`. Which controls are drawn, and their labels,
are unchanged. The step opens the section that holds a problem field; for an Earnings Update,
Dates and periods opens.

### 2.6 Review and start — `start/ReviewStep.tsx`, `start/ReviewSheet.tsx` (P1)

One decision tile, region "Review and start", then one closed disclosure.

The tile, in reading order:

1. **Head.** h2 "Review and start" (focused on arrival) with the mode chip ("Paid run" or
   "No-cost test"), and the run in one line: "{pathway} of {issuer} · As of {date} · {market
   view} · n documents read · m modules".
2. **Cost** (region "What it will cost", top right from `sm`): "Spending cap", the cap as the
   tile's largest figure in mono, "Cap · {pathway}"; synthetic: "What it will cost", "USD 0.00",
   "A paid run is capped at USD 25.00".
3. **Limits to decide** (full width; "n of m decided"; "No action needed (n)" beside the heading,
   taking the full width when opened). One row per shared cause: the "Run limits" badge, what it
   limits and the service's reason on one line where it fits, "Will also refuse" / "Also
   affects"; at the right its control ("I accept this limit…", "I have checked this") and, where
   there is one, "How to lift it" (the fixes, "Choose the Portfolio workbook", "Leave out …").
4. **Footer** (two columns from `md`, 4:8): what leaves the building (always drawn: the service's
   statements, else the gap "The service does not say what leaves."; never "nothing leaves") and
   the synthetic, Issuer-ID and unverified-model notes; beside it the blocker line, the consent
   "Approve: I have read this summary and want this run started", the error, and the cost
   sentence (`#run-submit-cost`) beside Submit ("Submit, spend up to USD 25.00" / "Submit run").
5. **Modules by stage** below `xl` only (§ 2.1).

On a phone the order is the same, so the cap and the limits come first.

**Everything Submit sends**: one closed `details` under the tile ("n groups of inputs · k not
given"), holding the region "What will run" with every block and its Edit button: Issuer and
documents, Purpose and modules, Context, Issuer details, Context details, at Advanced Valuation and
peers, Module options and Scenario assumptions, and Advanced choices (model and effort, turns —
only here). A block whose every input is not given is one line naming each input ("Context
details · Not given: Facilities and deal terms, Observed quotes, Ratings, Research questions").
Nothing is left out of it.

The dialog keeps its titles, sentences and actions, restates Issuer, Pathway and Cap (synthetic:
"Cost USD 0.00 · No-cost test"), and focuses Cancel when it opens; Cancel returns focus to
Submit. Its mark is the warning triangle for a paid run and a ring in the accent for the no-cost
test. The Submit button keeps its lock icon (restored in round 2; round 1 had dropped it, which
also changed the static `run/start` page). Gating is unchanged.

When a step is sent the browser checks its controls. A control in a closed section is opened;
for Issuer name, Issuer ID, As-of date, Your name and Turns per module the page cancels the
browser's bubble and puts its own words on the field, marks it and focuses it; the step is still
not sent. A service refusal names its field the same way, now including Current period and Prior
period.

## 3. Request shapes held fixed

Held by `web/src/pages/connected/start/requests.golden.test.tsx` (five jsdom drives, written from
the form before any change) and `requests.golden.paths.test.tsx` (13 drives of the paths those
five did not record, written on round 1's head before the round-2 rebuild); the files are under
`start/requests.golden/` and are never rewritten with `-u`. A Playwright drive of the real
synthetic service (13 requests, upload hashes equal to the proof files') was compared with its
recorded capture after each structural step; that driver and its capture are kept outside the
repository (review K13), and can be committed under `docs/design/preview/` if wanted (§ 8).

| #   | Request                                                                                     | Method | Headers                                                        | Body                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/connected/context`                                                                        | GET    | —                                                              | —                                                                                                                                         |
| 2   | `/api/runs/{from}/inputs` (only with `?from=`)                                              | GET    | —                                                              | —                                                                                                                                         |
| 3   | `/api/issuers/{id}` (issuer notice, 250 ms after typing; holder lookup at review and carry) | GET    | —                                                              | —                                                                                                                                         |
| 4   | `/api/submissions`                                                                          | POST   | —                                                              | —                                                                                                                                         |
| 5   | `/api/submissions/{id}/files?name={name}` per new file, in selection order                  | POST   | —                                                              | the `File` itself                                                                                                                         |
| 6   | `/api/submissions/{id}/files?name={name}` on Remove of an uploaded or carried file          | DELETE | —                                                              | —                                                                                                                                         |
| 7   | `/api/submissions/{id}/carry` once per draft when carrying                                  | POST   | `Content-Type: application/json`                               | `{"run":"{from}"}`                                                                                                                        |
| 8   | `/api/submissions/{id}/reading` after uploads, after Remove, and on each Continue/Review    | GET    | —                                                              | —                                                                                                                                         |
| 9   | `/api/submissions/{id}/summary` on Review run                                               | POST   | `Content-Type: application/json`, `X-Shown-Cap: {pathway cap}` | `JSON.stringify(answers)`: `context`, `modules`, `max_turns`, `level`, `model`, `effort`, `submitted_by`, `newest_document_date` when set |
| 10  | `/api/submissions/{id}/submit` on the dialog's confirm (again, identical, on retry)         | POST   | `Content-Type: application/json`, `X-Shown-Cap: {cap}`         | `JSON.stringify({answers, digest})`, the reviewed answers and the summary's digest                                                        |

Order, per drive, is exactly as recorded in the golden files. Nothing in the redesign adds,
removes, reorders or alters a request.

## 4. Control names held fixed

Every label, button, checkbox, radio, landmark and region name the tests, the proof script and
the preview driver use is kept, with these round-2 changes (each made with its script and test in
one commit):

- The drop zone's "Choose files" button is now the link "Click to upload" (no test or script used
  "Choose files").
- Round 3, one name per mode: the page header's chip on Start run reads "No-cost test" (it read
  "Synthetic test"; other pages keep that chip) and the paid stepper note reads "Paid run" (it read
  "Paid step"); `connected-proof.mjs` waits for "Paid run" (c8fa460). A document's kind is a label
  in sentence case ("Credit agreement", "Unrecognised").
- The rail's text "USD 0.00 of USD 25.00" and its progress bar are gone; the cap is the figure
  "USD 25.00". `connected-proof.mjs` now waits for "USD 25.00" in Readiness (commit 974cd49).
- The summary line reads "n of 4 ready · Cap USD 25.00".
- More context's fields sit in closed sections: `connected-proof.mjs` and
  `docs/design/preview/drive-synthetic-run.cjs` open "For the research", "Files with a role",
  "Legal documents" and "Ratings, quotes and facilities" before filling them (commit 995cf5f).
  In 995cf5f the preview driver's helper was named `open`, which its later "Open report" link
  declares again, so the file did not parse; it was never run from the repository in rounds 2
  and 3 (the real drive in § 9 is a separate capture driver kept outside it, which did the same
  steps). The helper is `openSection` since the round-4 fix, and the committed file was run
  against the synthetic service on a fresh root to the run's report.
- The Purpose step's Market view, Case kind and Run form level are segmented groups of buttons,
  named by the same labels; tests choose them through `start/testControls.ts`.
- On Review, region "What will run" is inside the closed disclosure "Everything Submit sends";
  the web-search and Yahoo sentences are in region "What leaves the building".

Removed headings: "Context details" (the More context group), "Confirm a synthetic test" and
"Confirm a paid run" were dropped in round 1; round 2 does not restore them (the sections and the
dialog title say the same).

Added names: list "Before Submit", list "Stages" (rail) and "Stages in this run" (review), the
lists "{stage} modules", "Other limits" and "Carrying a limit", regions "Review and start", "What
it will cost", "What leaves the building", "Modules by stage", the disclosure "Everything Submit
sends", "How to lift it", "To check", and the More context section titles.

## 5. Files

`StartRun.tsx` keeps the page, `IntakeForm`'s state and handlers and the re-exports the tests use.
The steps are `start/DocumentsStep.tsx`, `PurposeStep.tsx`, `ContextStep.tsx` (with
`contextSummary.ts`), `ReviewStep.tsx` and `ReviewSheet.tsx`; the frame is `IntakePanels.tsx`;
the rail is `ReadinessRail.tsx`, `StagePipeline.tsx` and `moduleReadiness.ts`; helpers are in
`intake.ts`, `fields.tsx`, `plain.ts`, `limits.ts`, `limitWords.ts`, `pathways.ts`,
`reviewInputs.ts`. Test helpers: `goldenFixtures.ts`, `testControls.ts`, `connectedTesting.ts`.
The kit `Chip` copied from S8 in 7aa59c5 was unused and is removed (689bc68); `components/kit`
is as on the base.

## 6. Drawn as a gap, and why

| What                                                                   | Why it is a gap                                                                                                                                                                                                                                                                                                                    | What would fill it                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| "What it unlocks" per file (Documents, P1)                             | The reading the page receives gives each file's detected kind, period end and executed state, not which modules it serves; that is decided by the service's readiness rules (`deploy_workflow/run_expectations.py`) only when the summary is made. Copying those rules into the page would be a second, drifting statement of them | The reading endpoint returning, per document, the modules that read it (a service change outside the frontend)                        |
| What is missing, before the first review (Documents, P2)               | Same: the service states it only with the summary. Before a review the block is not drawn (the gap note and the rail say it is checked at review); after one it shows the last summary's causes, marked as such                                                                                                                    | The same service change, or a readiness call before review (a new request: outside this package, and a change to what the page sends) |
| What leaves the building, when the summary states nothing (Review, P2) | The summary says what the research module sends only when it searches the web or reads Yahoo Finance; it does not say what else leaves (the documents go to the model provider on a paid run). The page says "The service does not say what leaves." and never "nothing leaves"                                                    | A statement from the service of everything a run sends out                                                                            |
| Per-module readiness before the first review (rail, P1)                | Same; the rail lists the planned modules by stage and says when they are checked                                                                                                                                                                                                                                                   | The same                                                                                                                              |
| The cap in the synthetic Submit label                                  | A synthetic test spends USD 0.00; the label "Submit run" is pinned by the tests, the proof script and the preview driver, and showing the paid cap on a no-cost test would mislead. The paid label carries the cap                                                                                                                 | —                                                                                                                                     |

## 7. Sub-agents, round 2

| Part                                                                                                                                                       | Model · effort                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Rail and stage pipeline, review decision tile and disclosure, consent and Submit, dialog, invalid-control handling, loading layout, merges and every check | Opus · high (this session)                            |
| Documents step (K7, K8, K12, Q2)                                                                                                                           | Sonnet · medium, worktree, reviewed and cherry-picked |
| Purpose step (K5)                                                                                                                                          | Sonnet · medium, worktree, reviewed and cherry-picked |
| More context accordion (K2)                                                                                                                                | Sonnet · high, worktree, reviewed and cherry-picked   |

## 8. Requests to the coordinator, and the coordinator's decisions (2026-11-25)

1. The top bar on `/start` tints "Run activity": decided, it stays unless the owner asks otherwise.
   The top bar at 390 is fixed on the integration branch (one row, no scroller), merged here.
2. `layout.tsx` (not mine): the breadcrumb link "Library" is 20 px tall at every width.
3. `ConnectedApp.tsx:166` (not mine): the read-only preview sentence ("This preview has no Credit
   OS service behind it, so it cannot start or follow a run. Library and Coverage show the saved
   reports.") is accepted; the coordinator adds it at integration.
4. The service change for "what each file unlocks" (§ 6) belongs in the follow-on plan.
5. The step render driver and the request-capture driver: decided, not committed.
6. "Will refuse" stays red, as the set defines it.

## 9. Verification

Rounds 2 and 3, 2026-11-25, branch `claude/redesign-s9-start-run`. Round 3 is on the tree
merged with `claude/exciting-albattani-v1zoug` (0033da3) and is recorded in § 9.1 at the end. Synthetic mode only; no provider was called and no paid run was made (the "paid" shots
are the page in live mode against the offline synthetic service, with every Submit request
aborted, as `connected-proof.mjs` does).

### What is sent: unchanged

- **jsdom goldens**: 19 transcripts from 18 drives (one drive records two) (`requests.golden.test.tsx`, 5, recorded before any change;
  `requests.golden.paths.test.tsx`, 13, recorded on round 1's head before the rebuild), 19
  transcripts in `start/requests.golden/`. Green after every commit; never rewritten. In the last
  commit the transcripts were renamed `.txt` → `.golden` (git: pure renames, content identical)
  and run in CI mode, where no snapshot can be written: all 18 match, and changing one byte of a
  transcript fails its drive.
- **Real drive** against `proof.serve` on a fresh root (driver kept outside the repository):
  13 requests, identical to the recorded capture, after the rail rebuild, after the accordion and
  review rebuild (cos-r2c), and after the invalid-control change (cos-r2f).

### Checks run

| Check                                                                           | Result                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npx tsc --noEmit -p .`                                                         | pass                                                                                                                                                                                                               |
| `npx eslint --max-warnings=0` on `connected/start`, `StartRun.tsx`, `run/start` | pass                                                                                                                                                                                                               |
| `npm run lint` (repo)                                                           | one error, `report/stages.ts:19`, unchanged from the base commit, not in this package                                                                                                                              |
| `npm run format:check`                                                          | pass                                                                                                                                                                                                               |
| `npx vitest run` ConnectedApp, `connected/start`, `run/start`                   | 31 files, 710 tests pass (594 on the base commit 1265838, counted there the same way); every base test name is still present except two renamed rewrites (below)                                                   |
| `npm run unused` (knip)                                                         | only `LeadProps` in `report/leads/types.ts` (not mine, pre-existing)                                                                                                                                               |
| `npm run duplication`                                                           | 2.32 % (threshold 3; round 1 2.48 %). It was 3.46 % before the last commit: 2,500 of the 2,780 lines round 2 added were the request transcripts, which jscpd read as code                                          |
| `npm run build`; `scripts/classes.mjs` on the build                             | pass; no problem reported                                                                                                                                                                                          |
| `tools/quality_gate.py`                                                         | `uv run` refused (the repo pins uv 0.12.5; 0.11.32 is installed); run with the repo venv's Python: 0 findings in 16 changed files                                                                                  |
| `connected-proof.mjs`                                                           | not run in round 2. Round 1 ran it only from an edited throwaway copy (its browser list changed to the preinstalled Chromium); branded Chrome and Edge, which it requires, are not installed here and are untested |

Not run: `npm run test` with coverage over all of `web/`, `npm audit`, `npm run test:scripts`.

### Tests rewritten and added in round 2

Rewritten (layout or pinned wording; the behaviour each checks is kept):

1. ConnectedApp: two cap assertions read the rail's cap figure, not the removed progress bar;
   the summary-line regex reads "Cap USD 25.00".
2. ConnectedApp "carries a prior run's documents…": the rail names the limit ("Whole run ·
   Limited"), not its reason (K3).
3. ConnectedApp "Purpose chosen" (two tests): met on the Purpose step, where a card is selected
   (K3: a behaviour change the review asked for).
4. ConnectedApp: four step helpers choose Run form level, Case kind and Market view through
   `testControls.ts` (the selects are segmented buttons).
5. ConnectedApp web-search and Yahoo tests (8): read region "What leaves the building".
6. ConnectedApp S8: opens "Everything Submit sends" before checking "Modules (8)" is visible;
   V15: reads the one not-given line that names each row section.
7. `ReviewSheet.test` C2-007: renamed; its limits-before-inputs assertion kept, and the round-1
   assertion "no echoed input folded" replaced by the closed disclosure K1 asks for.
8. `ReviewSheet.finalAudit.test`: six tests open the disclosure (or "How to lift it") before
   checking visibility. `StartRun.finalAudit` Luna: opens "Model and modules".
9. `ReviewStep.test`, `ReadinessRail.test`, `moduleReadiness.test`, `DocumentsStep.test`,
   `ContextStep.test`: this package's own round-1 tests, rewritten to the new blocks.
10. From round 1, still in force: `run/start/Steps.test` "draws the Purpose card header as a
    strip…" became "…an unselected Purpose card as a hairline-bordered surface"; and
    `Purpose.focusRing.test` reads `outline-focus` for `outline-brand`.

Added: `invalidControls.test.tsx` (4), `loading.test.tsx` (1), `PurposeStep.test.tsx` (1),
`contextSummary.test.ts` (37), period-refusal cases in `plain.test.ts` (2), Q1 "Other limits"
and the stages-said-once case in the rail tests, and the K9, K11 and dialog cases in
`ReviewStep.test.tsx`.

### Screens looked at

A scratchpad driver walks the synthetic Northbridge drive and, at each step and state, runs
check-render's `measure` (sideways scroll, unnamed scroll boxes, cut text, targets under 32 px or
44 px at phone width, text under 11.5 px) and records where the review's decision falls. Run at
1440, 1280, 1024, 768 and 390 px, synthetic with and without the context filled, and paid at
1440 and 390: no failure in this package's files in any state. Two failures outside it, at every
width: the breadcrumb link "Library" is 20 px tall, and at 390 the top bar's nav list scrolls
without a name or tab stop (`layout.tsx`, shell; § 8). No console error.

Where the decision falls (three-limit run, context filled; the screen is 900 px tall, 844 at 390):

| Width, mode    | Cap ends | Last limit ends     | Submit ends (approved)     |
| -------------- | -------- | ------------------- | -------------------------- |
| 1440 synthetic | 419      | 731                 | 890 (856)                  |
| 1440 paid      | 385      | 697                 | 865 (831)                  |
| 1280 paid      | 385      | 697                 | 912 (878)                  |
| 390 synthetic  | 537      | limits start at 655 | 1,646 (two screens: 1,688) |
| 390 paid       | 503      | limits start at 621 | 1,446                      |

At 1440×900 the cap, every limit and Submit are on the first screen in both modes; at 1280 the
paid Submit is 12 px below it until approved. With the context left empty the review has six
limits and Submit ends at 1,099 px at 1440.

What the PNGs showed, step by step:

- Documents: the dashed drop zone with "Click to upload or drag and drop" on one line; Choose a
  folder and Inspect documents as secondary buttons; each file a row with its kind chip and state;
  the gap note only with files; Issuer name, Issuer ID, As-of date, Your name with "Required"; the
  rail beside it at 1440 with the cap figure, the four rows and the 14 modules as rings.
- Purpose: at 1024 the labelled stepper and two columns of cards; each card's question, module
  count and cap in mono; Full selected by mark and tint; the Options well under them.
- More context: five closed sections with their one-line summaries; one opened at a time.
- Review: one tile; the run line and the cap top right; three limits each on one line with its
  control at the right; what leaves the building as a gap beside the consent and Submit; at 390
  the stages last in the tile and not repeated in the rail; the disclosure closed below.
- Dialog (1440, 390): "Start a paid run?" with the warning mark, Issuer, Pathway and Cap
  restated, Cancel focused; the synthetic one with the ring mark and "Cost USD 0.00 · No-cost
  test".

Defects found only by looking, and fixed: the grid row of the cost column stretched with the
limits and pushed the stages down a screen; the tile repeated the rail's stages beside it at
1440 and under it at 390; the paid Submit wrapped under its sentence (912 px); the upload link
sat below its sentence's baseline. Found by a Playwright probe of the invalid-control handling: with several invalid fields the last one was marked, because the browser runs microtasks between invalid events (fixed in f03e835, with a test that fails on the old code). The real drive was run once more on that head: 13 requests, identical. Found by the measurement: the drop zone's upload link and the
row editors' Add buttons were under the target size.

### 9.1 Round 3 (the coordinator's second review, S1–S4)

On the merged tree (head after c8fa460), synthetic mode only.

- **S4**: merged `origin/claude/exciting-albattani-v1zoug` (0033da3, no conflict); `byStage` now
  orders a stage's modules by the stage's own order, and `moduleReadiness.test` follows it (75024b6).
- **S1**: a Purpose option already chosen does nothing when pressed again (d4a5946).
  `segmentChoice.test.tsx` drives Relative Value after re-pressing "No market view (research)"
  (the summary sends `"run_type":"secondary"`, as an untouched form does), re-pressing the market
  view after approval (approval and decisions kept), and re-pressing "Basic" after a Leave out
  (the module stays out); the three fail on the old code.
- **S2**: "Everything Submit sends" draws the date of the newest file and the valuation parts'
  sent defaults under "Also sent, not used by this basis" (d8c74e2). `everythingSent.test.tsx`
  walks the recorded submit bodies of two drives (and one with the date) and finds every value,
  as typed or by a reader name written in the test. Two values are named as not inputs: the
  context's format tag and the cash-flow model (S8).
- **S3**: one check's invalid events are gathered; the first control with words takes the focus
  and only its section opens; every control with words is marked; a double click's second click
  on a section heading is ignored (03d958f). A Chromium probe of the coordinator's case (Turns 0
  and a cutoff after the as-of date, all sections closed; click, then double click) showed only
  Dates and periods open, the cutoff focused with its words, Turns marked, and no request.
- **Rendering**: c8fa460 (targets, one mode name, openers, badge size, Before Submit mark, kind
  label, Cancel ring); d4a5946 (Market view across both columns; the two reworded lines).
- **Goldens**: 18 drives green in CI mode (no snapshot can be written); the two ID-offer drives
  now hold the issuer notice's 250 ms lookup until the second summary is drawn, the pace they
  were recorded at (under CPU load it had moved ahead of it); six runs alongside a full
  ConnectedApp run, all green. The real drive: 13 requests, identical, on the final head.
- **Checks**: `tsc` pass; vitest 718 (ConnectedApp 221, `connected/start` and `run/start` 497);
  `npm run lint` pass (repo-wide, now that the merged `report/stages.ts` is clean);
  `format:check` pass; knip only `LeadProps`; duplication 2.49 %; build and `classes.mjs` pass;
  `tools/quality_gate.py` (repo venv; `uv run` refuses the pinned uv) 0 findings.
- **Targets**: a strict check (every control's own box, in `main`, outside sentences and the
  breadcrumb) finds none under 44 px at 390 or 32 px at 1440 in any state.
