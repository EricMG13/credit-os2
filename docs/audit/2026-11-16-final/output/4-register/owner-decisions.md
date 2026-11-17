# Owner decisions (stage 4)

Each question below collects the findings whose resolution would remove something the reader
sees, change what the user controls (ruling R5), or needs a choice only the owner can make. The
lead acts on none of them. Each question gives the facts, the options and the lead's
recommendation. The findings are in `register.md` under disposition `owner`.

## OQ-01. What is the static app for in this release?

Findings: S5-024, S6-003, S6-005, S6-006, S6-009, S6-011, S6-012, S6-032, S2-009, S2-010,
S3-004, S3-010, S3-030, S4-010, S4-011, S4-012, S4-025, S5-013, S5-014, S5-015, S5-022.

Facts:
- The release ships `web/public/data.js` empty; `tools/package_react_windows.py:74` refuses a build
  whose `data.js` is not the empty placeholder.
- Nothing in `src/`, `react_frontend/`, `tools/` or `proof/` writes a populated `data.js` (S5-024).
  Every populated static screen the audit saw comes from the hand-written `web/fixtures/*.json`.
- The library that "opens from disk" in `README.md` is the legacy `apps/issuer-library` page
  (ruling L1), not the static React app.
- The static run start is a saved example that cannot start a run (S6-003, S6-005, S6-006,
  S6-009, S6-011, S6-012). The static Overview, Changes, Modules, Evidence and Model slices hold a
  smaller vocabulary than the content matrix asks for (S2-009, S2-010, S3-004, S3-010, S3-030,
  S4-010, S4-011, S4-012, S4-025, S5-013, S5-014, S5-015, S5-022, S6-032).

Options:
1. **A design reference and component fixture.** Say so on its pages, take it out of the reader's
   path, and amend the matrices to the reduced fixture set. The findings above close as
   "by design". Fixture contradictions are repaired in the Low batch.
2. **A reader surface.** Add a writer that publishes `data.js` from completed runs, and extend
   the static slices to the matrix. This is a feature, larger than this audit.
3. **Remove it from the release.** This removes a surface (R5).

Recommendation: option 1. The connected app is the reader surface; the static app has no data
source in the release.

## OQ-02. Reading order on module pages and Overview

Findings: C3-028 (connected module pages put charts, event lanes and maps between the Bottom line
and Key findings, 1,200 to 1,600 px), S2-025 (static Overview puts headline figures and For and
against between the bottom line and Key findings).

Options: 1. move the figures block after the prose passages (Key findings, Contrary evidence,
What would change the view), before Limitations; 2. keep figures first and amend rubric D-11 and
the matrix.

Recommendation: option 1. `AGENTS.md` fixes the prose order (bottom line, key findings, contrary
evidence and what would change the view, limitations); figures between the first two break it.

## OQ-03. The page-level "Show sources" switch on Evidence

Findings: C5-005 (with S4-019). The switch is drawn and changes state on every Evidence tab, but
Evidence has no trace control for it to reveal.

Options: 1. hide the switch on Evidence; 2. disable it there with a visible reason; 3. keep it.

Recommendation: option 1.

## OQ-04. Opening supplied source files from Evidence

Finding: C5-011. Evidence > Sources opens the supplied files (the workbook downloads). Ruling
`docs/rulings/2026-11-11-reader-and-issuer-report.md` decision 9 says source files are "listed
only, not downloadable or viewable" (harmony H-02).

Options: 1. follow decision 9: list the files only (removes the links, R5); 2. amend decision 9
and serve each file as a download with `Content-Disposition`.

Recommendation: option 1, unless the owner now wants analysts to open the sources from the report.

## OQ-05. The kit page, the legacy pages and the rail

Findings: S1-004 (with X1-018), S1-017, X1-013, B0-006.

- The component kit (`#/kit`) is a rail item of the static app: sample figures, buttons that do
  nothing, looping animations (S1-004). No matrix row covers its 25 sections (X1-018). Several
  component variants have no caller outside the kit (X1-013).
- The legacy issuer library and run-start form ship in the release ZIP and stay reachable at
  `/library/*` (B0-006, ruling L1).
- Both rails differ from decision 12's four items (Start a run, Issuer library, Run activity,
  Search): the connected rail has Library and Run; the static rail has Library, Model, Run and
  Kit (S1-017, harmony H-08).

Options and recommendation: the kit stays reachable by address only (`#/kit`), not from the rail;
the sweep then drops variants no screen or kit section draws. The legacy pages stay while ruling
L1 stands, and the owner decides at the work-PC hand-over. Confirm that `docs/react-workflow.md`'s
rail (Library, Run) replaces decision 12.

## OQ-06. Resume, stop and start again

Findings: S6-014, S6-033, C1-028 (harmony H-15). The control matrix says no page control resumes a
run (a resume is a launcher relaunch). The static run alerts offer "Review and resume" and "Review
and start again"; every static live run page draws a disabled "Stop run"; the connected Run
activity offers "Start from this run" beside a capped or interrupted run and has no "Not
assessable" state for a blocked module.

Options: 1. no resume or stop in the page: remove the static offers and the disabled Stop, keep
"Start from this run" (it copies answers into a new run), add the "Not assessable" state;
2. add a resume and a stop to the product (matrix rows and service work).

Recommendation: option 1.

## OQ-07. Which runs and modules are listed

Findings: S2-011 (the library lists issuers whose latest run is Running, Failed or Capped; CM-033
and CT-043 say only completed runs with all modules answered), S3-013 (modules that did not run
are listed in the navigator and open pages; CT-044 says only modules that ran).

Options: 1. follow the matrix and hide them (removes items, R5); 2. keep them with their state
drawn and amend the matrix.

Recommendation: option 2. A reader who sees the state loses nothing; hiding a failed run hides
information.

## OQ-08. The run form level "Standard"

Finding: C2-009. The Run form level select offers Standard, which behaves exactly like Basic.

Options: 1. remove Standard; 2. state what Standard adds and make it do so.

Recommendation: option 1.

## OQ-09. Departures from the design system

| Finding | Departure | Recommendation |
| :--- | :--- | :--- |
| S2-012 | The trace control is drawn at rest on pointer devices; the design system and CM-009 say hover and focus only | Amend the design system to the build: a control the reader cannot see is found by nobody |
| X1-009 | A hovered, unselected tab is drawn like the selected tab | Hover changes the text colour only (D-27) |
| X1-017 | The slashed circle means "Not assessable" only, but the set table gives it to "Not ready" | Give "Not ready" its own shape |
| X1-020 | Bar, stack and strip series differ by colour alone; chart colours 1 and 3 are nearly the same grey | Separate the lightness of the first three chart tokens |
| X1-026 | Waterfall colours are local constants; "up" uses a brand tint outside the chart palette | Add the three tokens to `theme.css` and the design system |
| C4-020 | Period series are drawn as grouped columns; a line only when a value is negative | Choose the form from the descriptor's kind (trend as a line) |
| S2-023 | A group item ("9 modules unchanged") draws a chevron and does nothing; linked rows have none | Chevron on linked rows only |
| S3-017 | Each limitation is clamped to three lines behind "Show all"; only the card is meant to collapse | Show limitations in full; keep the card collapse |

## OQ-10. Evidence, Record and trace content

| Finding | Question | Recommendation |
| :--- | :--- | :--- |
| S4-006 | The module filter is on three of five Evidence tabs and resets on every tab change | Hold the chosen module above the five tabs and apply it on each |
| S4-008 | Record's Model calls table has a "Code" column of module codes | Remove the Code column: amendment 2026-11-12 bans module codes on Evidence |
| S5-004 | A trace control on the Model pages is a link that leaves the Model for Evidence | Open the trace drawer in place, as the library does |
| S6-015 | Run activity has no state for plan, delivery and library admission | Leave as is; the matrix is ahead of both surfaces; amend it |
| C3-012 | When CP-8 delivered, its handoff is drawn on Changes and again as a module | Show CP-8 on Changes only |

## OQ-11. Teams run cards and the offline rule

Findings: B0-007, C2-025, S6-035. `docs/rulings/2026-11-16-teams-run-cards.md` lets the scheduler
post run cards to one Teams webhook when `CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK` are
both set, and calls this a second exception to R8 ("the PR-manager session's reading"). README
ruling R8 lists only CP-DR's lookups. Stage 0 also noted that `proof/serve.py` does not clear the
two Teams variables; verification showed this is harmless, because a synthetic service builds its
scheduler without Teams settings (`react_frontend/__init__.py:399-403`), so it never posts. The analyst-name help says the name is "Shown on
Run activity and in Teams", also when Teams is not configured.

Options: 1. confirm the Teams exception and add it to R8; reword the help to "and in Teams, when
it is set up"; 2. withdraw the Teams sender.

Recommendation: option 1.

## OQ-12. The known-failures file name in AGENTS.md

Finding: B0-002. `AGENTS.md` names `tests/nightly-known-failures.txt`; the file and the weekly job
use `tests/known-failures.txt`.

Recommendation: change the name in `AGENTS.md`. It is the owner's rules file, so the lead does not
edit it.

## OQ-13. Screen items no matrix row covers

Findings: S1-018, S2-030, S2-031, S2-032, S2-033, S2-034, S2-035, S3-033, S3-035, S4-026, S5-026,
S6-034. The skip link, brand mark, not-found page, data notices, run tab bar, run-header actions,
Show sources switch, sort buttons, disclosures, list-view range filters and tooltips, the Readiness
panel and other items are on screen with no content-matrix or control-matrix row. S2-030: control
row CT-028 names S2, but S2 offers no such control.

Recommendation: keep every item and add the missing rows to the matrices; correct CT-028's
section. No screen changes.

## OQ-14. A model with one case (raised during stage 5)

Finding: R3-001. The static Model reader refuses a whole run when its model delivers one case
instead of two (`web/src/pages/model/slice/read.ts:302`), so none of the run's Model pages can be
read. The Model pages compare two cases by design. Repair T38 makes a run with no forecast readable
(S5-001), but leaves this check as it is.

Options: 1. show the run, and say on the Forecast page that the model delivered one case; 2. keep
refusing it.

Recommendation: option 1. It matches S5-001's repair: a missing part is stated, not a reason to hide
the run. The static app is a design reference (OQ-01), so this is Info and can wait for the owner.

## OQ-15. Why a run stopped at the checker (raised during stage 5)

Finding: R1-012, with the product half of J1-002 and the remaining half of J5-001. When the checker
rejects a module's draft and the run stops, the run page now says "Not assessable" and that the run
stopped after the checks rejected the draft (T04). It cannot say why, for example that no
executed agreement was chosen. The engine records only `stopped: checker` and `draft_rejected` events
with no reason. The cause exists only in the checker's instruction to the model, which must not be
drawn on a reader page.

Options: 1. the engine records a short reader-safe reason with each rejection and stop
(`src/deploy_workflow/model/handoff.py`, `src/deploy_workflow/owners/cpos_launch.py`) and run
activity passes it on: a change to what the orchestrator records, outside this audit; 2. leave it.

Recommendation: option 1, as separate work after the audit. A run that has the documents it needs
is not affected, and T12 makes the documented synthetic path finish.
