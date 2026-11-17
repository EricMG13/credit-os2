# Stage 2, section S6: run start and run activity (static)

Audited: `main` 2b881075, branch `audit/out-sections-static`, 2026-11-17. Files: `web/src/pages/run/` (22 non-test files). Routes: `#/run/start/:draft`, `#/run/activity`, `#/run/activity/:run`, plus the bare `#/run`. Data variants: shipped (`web/dist/data.js`, no issuers, no run slice) and fixture (`web/fixtures/*.json` written into a copy of `web/dist`). Every browser context blocked every host but loopback (R8). Headless Chromium 1243, 1440 x 900 and 390 x 844, plus 320 x 700 for reflow. No code was changed, no paid call made, no real Submit. Signal was not opened.

(Written by the worker; placed in this file by the `sections-static` controller because the Write tool refuses report files from subagents.)

## Result

37 findings: 0 High, 12 Medium, 19 Low, 6 Info (`findings.jsonl`). Nothing requested another host (0 blocked requests on all S6 addresses, both data variants, and the connected pages opened with `proof.serve`); Geist and Schibsted Grotesk load from `file:`; 0 console errors or page errors anywhere.

The static run pages draw the slice faithfully: `probes/s6-figures.mjs` checks 447 figures both ways against `web/fixtures/run.json` (every drawn figure is in the fixture, every fixture figure the page should draw is drawn) with 0 mismatches (one slice field, `started.position`, is read and never drawn). The defects are in what the fixture says (USD 20 cap for a Full review, four mock purposes), what the pages do not say (they are a saved example), and four wiring points (Purpose choice dropped, "Runs" and "Open what finished" go to the wrong place, "Try again" does nothing).

Medium findings, one line each:
- S6-001 focused Purpose card looks the same as the selected one (outline-style stays none; also on the connected page).
- S6-002 after confirming the Submit dialog focus falls to `body`.
- S6-003 only 7 of 17 populated pages say "saved example"; the Start step and "Run started" imply a real paid run.
- S6-004 cap USD 20.00 shown for a Full review (ruling: 25); retired R-09 still offered.
- S6-005 Purpose step has four mock purposes, not the eight pathways.
- S6-006 the Purpose choice is not carried to the next step.
- S6-007 "Runs" goes to the current run, not a list.
- S6-008 "Open the library" / "Open what finished" go to a library that lacks the run's issuer.
- S6-009 "Try again" links to its own address.
- S6-010 run label chip cannot wrap (cut off at 390 px).
- S6-011 stepper completed steps are not buttons (CM-083).
- S6-012 the review step lacks most of the review sheet (CM-086).

S6-037 is filed with `section: C1`: on one finished synthetic run the connected page shows "14 of 14 modules" but lists 15 module rows. It is an observation of S6's shared `Summary.tsx` as drawn on the connected surface; stage 4 places it.

## Screens and controls covered

Addresses opened (fixture, 1440 and 390 px, with screenshots): 22 = `#/run`, `#/run/activity`, 2 not-found addresses, 7 drafts (no-documents, documents, purpose, confirm, context, start, started), 11 runs (running, queued, starting, finished, failed, capped, rejected, interrupted, many-modules, none, unreadable). Shipped data: the same 22 addresses (all draw the single empty state). The same 22 were opened directly in a new page, with Back and Forward checked on the Confirm, Context and Start chain.

Inventory (`clickables.jsonl`, 74 lines with section S6):

| Coverage | Lines |
| :--- | ---: |
| Operated with the mouse on the line's own address (link click and result, disabled control click and no effect, radios, textbox, dialog Cancel and action) | 73 |
| Operated with the keyboard alone on the line's own address (Tab walk of 11 addresses, Enter, Space, Escape, arrow keys) | 52 |
| Keyboard coverage by an identical control on a walked sibling address (Runs x9, Stop run x5, Open what finished x2, Review and resume, Start a new run, Back to Documents, and the like, all native links or disabled buttons) | 22 |
| Inspected only: `Dismiss` (the visually hidden 1 x 1 screen-reader dismiss button of the modal, `tabindex=-1`; it cannot be clicked) | 1 |
| Not reached | 0 |

Controls missing from the inventory: none found (74 of 74 matched by role and name). The stepper markers and the file-row "PDF" labels are not controls. For each control the implied effect was stated and checked: address, content, state after Back/Forward and reload.

Shared files drawn on the connected surface: `Purpose.tsx` (`PurposeCards`: same focus defect, S6-001), `Stepper.tsx` (`onSelect` buttons work there, focus moves to the step heading), `Start.tsx` (`SubmitConfirmation`: Escape returns focus to Submit), `ModuleSteps.tsx`, `Feed.tsx`, `Summary.tsx` (opened on one finished synthetic run on port 8766, "Cap usage" caption, 15 module rows against "14 of 14 modules", recorded as S6-037 for C1), `TextLink.tsx`. Connected page layout belongs to C1 to C5 and was not audited.

## States reached, per screen type, and how

| State | How reached | Result |
| :--- | :--- | :--- |
| Loading | none exists on the static pages (data is a script loaded before render); the live "starting" run draws the spinner with its label | checked on `#/run/activity/starting` |
| Empty | shipped data (all 22 addresses), fixture `none` and `no-documents`, mutated empty slice (no drafts, no runs, no current) | S6-026 |
| Error | not-found addresses, `unreadable`, invalid slice (a module code in one string) | S6-019, S6-009 |
| Partial | fixture `capped`, `rejected`, `interrupted`; mutated copy with null spend, finished and elapsed, no labels, no module detail | draws "n.a." and the note; no defect |
| Missing against zero | mutated copy with "USD 0.00", "0 of 13", "0 min 00 s" next to nulls; also empty strings | null draws "n.a.", zero draws the figure; empty string draws a blank (S6-020) |
| Very long text | mutated copy: 4x-long sentences in labels, alerts, feed, module rows, purposes, file names, recap values, one 160-character unbroken string | wraps everywhere but the label chip (S6-010) |
| Narrow window | 390 px every address; 320 px on Start, Documents, Confirm, many-modules, failed | S6-010, S6-013, S6-028 |
| Disabled | Stop run, Previous, Next, upload and file controls; blocked Submit (mutated `nextBlocked`) | S6-030 |

Fixture variants were built in a scratch copy of `web/dist` with `writeDataFile`; `web/` was not touched.

## Design critique

The impeccable skill is not installed in this session; the rubric was applied rule by rule to screenshots and code, with the `.impeccable/config.json` exceptions (mockup file only, so none applied). Rules checked and not breached by S6 code: D-09 (animations only in a live run; none under `prefers-reduced-motion: reduce`, measured with `getAnimations()`), D-10 (offline), D-33 (computed contrast of all drawn text on 17 pages: 0 pairs under 4.5:1, disabled controls excluded), D-36 (one `h1` per page, heading order in 22 fixture addresses), D-38 for Escape, scrim and Cancel, D-39 (every state has a word and a shape), D-08 (no non-approved library). Breaches are in `findings.jsonl` under D-17, D-15, D-14, D-13, D-20, D-21, D-23, D-26, D-30, D-31, D-32, D-34, D-35, D-37, D-38, D-42, D-43.

## Harmony

`harmony.csv` has 62 rows: all 17 content rows and 27 control rows with S6, 7 retired items, 11 unaccounted items. Content: 3 shown as required, 5 correctly not shown, 9 shown but wrong place or form. Control: 9 decidable as required, 6 decides less, 1 decides more (CT-038), 11 not reachable here. Retired: 6 not offered, 1 still offered (R-09, S6-004). Every mark that is not one of the four clean marks cites a finding id in `note`. Reading of the control rows: the static run start is a saved example, so rows for choices it does not draw (Lite, Deep, four purpose pathways, limits, the Changes row) are `not reachable here`.

Stage 0's note that static run-activity pages link to `#/library/transdigm/...` does not reproduce: no S6 page holds such an href (`probes/s6-library-links.mjs` prints 0). Those links are in `web/fixtures/model.json` (the Model section). What does reproduce is that the run links go to `#/`, which holds no TransDigm Group (S6-008).

Open questions left for the owner (`owner_decision: true`): S6-003, S6-012, S6-014, S6-015, S6-032, S6-033, S6-034, S6-035 (including the R8 question for the Teams POST, harmony-report H-26, which this agent did not settle).

## Files

`findings.jsonl` (37), `harmony.csv` (62 rows), `probes/` (16 scripts and `_s6lib.mjs`; each runs from the repository root, copies `web/dist` to a temporary folder, blocks non-loopback hosts and removes the folder), `evidence/` (11 screenshots and 2 captures, each cited by a finding). Scratch (not committed): `/tmp/ss-S6/scratch`; the service on port 8766 was stopped.

Not verified: the impeccable critique (skill not installed, rubric applied by hand); Chrome and Edge (only Playwright's headless Chromium 1243); a real screen reader (announcements are inferred from the DOM, roles and focus, S6-002 included); a native file drop onto the Documents page (the page has no drop handler; whether the browser then navigates away was not tried); 200 percent text size, forced colours and print; non-text contrast (1.4.11) of status shapes and borders; hover states beyond a read of the code (D-27); the connected `Start a paid run?` dialog, connected queued, failed, capped, interrupted and rejected run pages, and live polling announcements (D-43), which belong to C1 and C2; keyboard walks of `#/run`, `#/run/activity`, running, queued, starting, finished, capped, rejected, interrupted (covered by identical sibling controls); any real run slice (no code outside `web/fixtures` writes one), so every finding about wording, caps and links describes the fixture.
