# Known-unverified list (draft for `{{KNOWN-UNVERIFIED LIST}}`)

Written in advance for step 6 of `stages/7-send-off.md`. Everything above the line "Paste from here" is
for the lead and stays out of the prompt.

## For the lead

- **Read** (2026-11-17, tip of `audit/final-coordination`, `b9ea386`): the "Not verified" section of
  `docs/COPILOT.md`; the `Not verified:` lines of `0-baseline/report.md`, `offline.md`,
  `2-sections/{C1..C5,S1..S6,X1}/report.md`, `3-journeys/J1..J6/report.md`, `4-register/report.md` and
  `5-repair/fidelity/README.md`; the register's work-PC dispositions (R15, R17, OQ-15). Stage 7 appends
  its own `Not verified:` lines and the open findings of the final register (the stage brief asks for
  both); neither exists yet.
- **Kept**: an item that needs Windows, a real seat or live run, a real Chrome or Edge build, the
  release package or the Teams path. **Left out**: screen-reader output, keyboard-only use, touch,
  narrow widths (R14, R16), 200 % zoom, print, dark theme, contrast sampling, the absent critique
  skill, unread disclosures and second-level dialogs, and hostile inputs. Each is outside the five
  headings, and R14 and R16 rule the first four out.
- **35 items**, each once with every report that names it: 7 Windows and release package, 5 real
  Chrome and Edge, 13 real seat and live run, 6 Teams, 2 deferred, 2 known limits.
- **Added beyond the named sources**, each marked "(added)": K3 (the versions table of
  `0-baseline/baseline.md`), K5 (OCR, from the code), K7 (the legacy package's own README), K9's
  register line (B0-001), K26 to K31 (Teams: `VERIFICATION.md`, the Teams ruling, register R1-003,
  R1-009 and C2-025) and K34 and K35 (register B0-004 and J1-019). Drop any the owner does not want.
- **Tags** are mine, to keep the agent inside the prompt's section 5: **Agent** may be checked offline
  with no provider, key, seat or webhook; **Owner** needs a provider key, a Copilot seat, a Teams
  webhook, a real run or a decision, and the agent reports it "not run"; **Info** asks for no check.
- **Two tensions in the draft to settle.**
  1. R15 says Teams run cards are *implemented* and checked on the work PC (K30 and K31 are code and
     text changes in `src/deploy_workflow/inbox/teams.py` and
     `web/src/pages/connected/StartRun.tsx`), but the draft's job is "the smallest adaptation" and its
     section 5 forbids more. The prompt needs a rule for them, for example: named tasks, done only
     after the owner approves the gap table.
  2. R8's recorded Teams exception (R10, OQ-11) lets the service post to one webhook when
     `CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK` are both set; the draft says nothing else may
     reach another machine. K26 says the owner sets both, never the agent.
- **Check at stage 7.** K2 (the ZIP's contents were read from code in stage 0; stage 7 builds and lists
  it); K30 (that repair T02 for R1-003 is in the final commit; it is on `audit/repair-1` at
  `d7b1e66` and not yet in `audit/final-repairs`); K31 (`StartRun.tsx:750` still reads "Shown on Run
  activity and in Teams" on every audit branch); K23 and K24 (they shrink if a sweep or repair changes what
  the canned handoffs cover).

---

## Paste from here

Who acts: **Agent** (you may check it, offline, with no provider key, seat or webhook), **Owner**
(needs a provider key, a Copilot seat, a Teams webhook, a real run or a decision: report it "not run"
and do not attempt it), **Info** (no check; read it before judging a difference). Sources are paths under
`docs/audit/2026-11-16-final/output/` unless they begin `docs/`, `src/`, `apps/`, `README.md` or
`VERIFICATION.md`. The cloud audit saw Playwright's Chromium headless shell only, with canned model
responses and no paid call (R4), so nothing below was seen in Chrome, Edge or on Windows.

### Windows and the release package

- **K1 (Agent). `Run-React-Proof.cmd` on Windows.** It runs `uv sync --locked`, `npm ci`, the build
  and `proof:connected`; none of it has run on Windows. The release needs exit 0 and a `proof.json`
  that names the Windows platform and both browsers. Source: `0-baseline/surface-map.md`;
  `3-journeys/J1`, `J3`, `J4`, `J5` (the work-PC journey); `docs/react-workflow.md`.
- **K2 (Agent, when the owner hands over the release ZIP and its `.sha256`). The release ZIP on
  Windows.** The checksum check, extraction to a short path and `CREDIT_OS_PROOF_ZIP_SHA256` run in
  `docs/react-workflow.md` have not run on Windows, and the ZIP's contents were read from the build
  script in stage 0, not from an archive. Source: `0-baseline/surface-map.md`, `report.md`,
  `offline.md`.
- **K3 (Agent) (added). The pinned toolchain.** The pins are Python 3.13.15, uv 0.12.5 and Node 24.
  The audit ran Python 3.13.18, Node v22.23.4 and npm 10.9.9, with uv upgraded to 0.12.5; the web
  gates and `proof:connected` have not run on Node 24. Source: `0-baseline/baseline.md` (Versions),
  `report.md` (environment notes); `web/package.json` `engines`.
- **K4 (Agent, with documents the owner supplies). Real source documents.** How a real PDF, Word file
  or large workbook is read or refused on the start page and in a prepare-only launch; a file over
  50 MB and more than 500 files (no probe made them), 50 or more documents and a file of exactly
  50 MB. Source: `3-journeys/J2`; `2-sections/C2`.
- **K5 (Agent) (added, from the code). OCR of scanned PDFs on Windows.** A scanned page is read
  through `pdftoppm` and `tesseract` when both are on `PATH`; without them the page reads as empty
  with the limitation "No extractable text; OCR unavailable: pdftoppm or tesseract not found". No
  audit report exercised either path and no document mentions them. Source:
  `src/deploy_vii/preparation.py` (`OCR_UNAVAILABLE`, `_Ocr.page`).
- **K6 (Agent). Windows high contrast and forced colours.** Not exercised; the app declares no
  forced-colours styling. Source: `2-sections/S3`, `C3`, `C4`, `S6`.
- **K7 (Owner, only if the legacy library package is used on the work PC) (added). The legacy
  Windows package and run-start service.** The package built by `apps/issuer-library/packaging`
  (bundled Python 3.13.15, `Smoke-test.ps1`, `Start run page.cmd`, Task Scheduler at start-up) "has
  not been run on Windows"; "Windows, and browsers other than Chrome, are not verified". `Smoke-test.ps1`
  on the target is its acceptance and calls no provider. The legacy pages stay in this release
  (R17). Source: `apps/issuer-library/README.md` ("Known limits", "Windows package"); `README.md`
  ("Limits of the run start page"); `apps/issuer-library/packaging/runtime.py:58`.

### Real Chrome and Edge on Windows

- **K8 (Agent). Both surfaces in branded Chrome and Edge.** Every screen was drawn in the headless
  shell only. Walk the connected app and the static app in both browsers, including chart hover,
  tooltips and other hover-only content. Source: `0-baseline/report.md`, `offline.md`;
  `2-sections/C2`, `C3`, `C4`, `C5`, `S1`, `S2`, `S3`, `S4`, `S5`, `S6`, `X1`; `3-journeys/J1` to
  `J6`; `4-register/report.md`.
- **K9 (Agent). `npm run test:file` and `test:file:gates` (134 checks) with the PC's own browser.**
  In the cloud the default `google-chrome` wrapper hung on every page and the gate exited 1; it
  passed only with `CHROME_PATH` pointed at the headless shell. Register B0-001 asks for one check on
  the work PC. A skip ("no supported browser found") is not a pass. Source: `0-baseline/report.md`,
  `baseline.md` (row 8b); `4-register/register.md` (B0-001) (added).
- **K10 (Agent). The real file chooser, folder upload and drag-and-drop from Windows Explorer** on
  the start page, and what the browser does when a file is dropped on the static app's Documents page,
  which has no drop handler. The audit set files on the input and sent a synthetic drop event.
  Source: `2-sections/C2`, `S6`; `3-journeys/J1`, `J5`.
- **K11 (Agent). Clipboard.** The "Copied" success toast and real clipboard writes. Source:
  `2-sections/S4`.
- **K12 (Info). The fidelity capture on another browser or font set.** The "before" record was taken
  twice on one machine (Node v22.23.4, headless shell 153.0.8010.12). The pixel size of a mark depends
  on rendering, so a difference in Chrome or Edge on the work PC is not by itself a defect. Source:
  `5-repair/fidelity/README.md`.

### A real seat and live runs (all Owner)

GitHub Copilot, from `docs/COPILOT.md` ("Not verified"); the seat check is paid.

- **K13.** The pinned model ids `gpt-6.1-sol` and `claude-opus-5.5` on a real seat.
- **K14.** `numToolCalls` and the event order on a real seat.
- **K15.** `copilotUsage.totalNanoAiu` is present, and 1 AI unit = $0.01 holds.
- **K16.** `max_output_tokens` is not enforceable on the runtime (holds cover it; the output is not
  capped).
- **K17.** The Windows runtime path, and whether the allowlisted environment is enough there.
- **K18.** `stop()` and `force_stop()` timing on a real runtime.
- **K19.** The runtime dispatches a turn's custom tool calls concurrently (the seat check now
  exercises two calls in one turn).

The service and the reports, from the audit:

- **K20. The regular service and a real Submit.** `python -m react_frontend`, a real Submit, the paid
  confirmation ("Start a paid run?"; the proof shows "Start a synthetic test?"), real spend and cap
  figures (the proof's spend is USD 0.00), the read-only retained-run preview
  (`react_frontend.preview`), the live default `case_kind`, the SEC contact-string sentence on the
  start page (seen only because its variable was unset), and whether a real submission with a module
  left out now starts (J1-001 sat in the scheduler the regular service shares; its repair, T02, was
  proven on the synthetic service only). Source: `0-baseline/report.md`, `offline.md`,
  `surface-map.md`; `2-sections/C1`, `C2`; `3-journeys/J1`, `J2`; `4-register/report.md`.
- **K21. A real run on a pathway other than Full credit assessment.** The proof completes Full only;
  the other seven pathways are submitted and then fail in the proof launcher. Source: `3-journeys/J1`
  (J1-003), `J5`; `5-repair/fidelity/README.md`.
- **K22. The run states a real run produces.** Capped, rejected, interrupted, "Not assessable" and
  blocked modules; queued, stalled and held runs; progress over a run longer than 3 s and the 30 s
  refresh; two runs at once; a service restart during a run and reopening earlier runs after it
  (`proof.serve` refuses a root that holds a file); the 30-runs-a-day wait and its wording. Source:
  `2-sections/C1`; `3-journeys/J1`, `J2`, `J5`.
- **K23. A second run of the same issuer.** The Changes page on a real CP-8 comparison pack (Cards and
  Table views, verdicts, the comparison-note reason), Report history, the "Earlier format" and
  "Earlier methods" labels, and Forecast and Calendar with an earlier run, including cross-run
  isolation of models and events. The proof launcher refuses a second run, so the audit reached these
  pages only by rewriting the service's JSON. Source: `2-sections/C1`, `C3`, `C4`, `C5`;
  `3-journeys/J1`, `J3`, `J4`, `J5`; `4-register/report.md`; `5-repair/fidelity/README.md`.
- **K24. Report pages on a real run.** Every figure, sentence and register the audit saw came from the
  canned Northbridge handoffs in `proof/handoffs/`. Not seen with real module output: Overview,
  Modules, Forecast, Evidence, Record, the calendar and charts; the Model pages and the original HTML
  Model download (unavailable for the proof run); real driver registers, Basis and limitation text,
  source page links and excerpts; a non-USD issuer, an Upside or second-grid case, a Lite or
  no-forecast run; the CP-1B, CP-1C, CP-1D, CP-2H, CP-3D and CP-4C outputs; a blocked or gap-bearing
  module; a library with sectors or many issuers; whether the canned-handoff inconsistencies J3-006
  and J4-002 occur in real output; and a source trace that reaches an uploaded file; chart edge cases (a bar at the top tick, a zero-balance
  debt part, a negative-cash forecast year). Source:
  `2-sections/C1`, `C3`, `C4`, `C5`, `S5`, `X1`; `3-journeys/J3`, `J4`, `J5`; `4-register/report.md`.
- **K25. The library after a real run.** That the files the connected report links
  (`library/downloads/…`) and `library/data.js` exist and open, and whether a synthetic or replayed run
  is unlisted in a live library (CM-033: the proof's completion record says live-provider). Source:
  `0-baseline/report.md`, `api-map.md`; `2-sections/C1`.

### Teams run cards (R15: implemented and checked only on the work PC)

- **K26 (Owner). A real post of the four cards.** Run started, report ready, stopped before
  publishing, and the summary (09:00, 13:00, 17:00 and 21:00 UK time on weekdays, skipped when quiet),
  to a real Teams Workflows webhook, with both `CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK` set
  by the owner in the launching environment, never by the agent. Check how Teams draws the header,
  stripe, pills, icons, callouts, bars and tiles, light and dark, desktop and mobile. Card text
  (issuer, pathway, analyst name, times, counts, cap, run ID, link and the report's lead bottom line)
  goes to Microsoft; with the variables set, the webhook is the service's one allowed request to
  another host (R8's recorded exception, OQ-11). Nothing has been posted to a real channel. Source:
  `0-baseline/report.md`, `offline.md`; `2-sections/C1`, `C2`; `4-register/report.md`;
  `docs/rulings/2026-11-16-teams-run-cards.md`; `VERIFICATION.md` (2026-11-16, Teams entries) (added).
- **K27 (Owner). Card links.** A card's links work only for a reader who can reach
  `CREDIT_OS_TEAMS_LINK`; check them from a reader's PC. Source: the Teams ruling.
- **K28 (Owner). A slow webhook.** A reply slower than 10 seconds counts as failed and is retried a
  minute later, so a card Teams accepted late can appear twice. Source: the Teams ruling ("Known, not
  fixed here").
- **K29 (Agent) (added). The Teams unit tests on Windows.** `tests/test_inbox_teams.py` (a loopback
  HTTP server, the PNG reader, the UK summer-time boundaries, the ledger `_engine/teams.json`) has not
  run on Windows. It posts only to a loopback server. Source: `VERIFICATION.md` (2026-11-16, Teams entries: "Windows").
- **K30 (Agent to implement, Owner to approve). The module count on the cards.** R1-003: the cards
  counted CP-MODEL, so a finished run read "13/14 modules"; repair T02 removes it and is covered by a
  unit test only. R1-009 (Low, open): with an earlier run listed, the started card counts CP-8 only
  from its first event, so it reads 13 against the run page's 14, and a run stopped before CP-8 keeps
  13; the suggested change is to read the run's manifest for the planned module list in `progress`
  (`src/deploy_workflow/inbox/teams.py`). Implement and check on the work PC only. Source:
  `4-register/register.md` (R1-003, R1-009); `4-register/owner-decisions.md` (R15 ruling).
- **K31 (Agent to implement, Owner to approve). The analyst-name help.** It reads "Shown on Run
  activity and in Teams", also where Teams is not set up (C2-025, Info; OQ-11 recommends "…and in
  Teams, when it is set up"). Source: `4-register/register.md` (C2-025);
  `4-register/owner-decisions.md` (OQ-11); `web/src/pages/connected/StartRun.tsx`.

### Deferred by the owner (no check; listed so nothing is lost)

- **K32. OQ-15 (R1-012): a reader-safe reason for a checker stop.** When the checker rejects a module's
  draft and the run stops, the run page says "Not assessable" and that the checks rejected the draft,
  but not why (for example, that no executed agreement was chosen). The engine records only
  `stopped: checker` and `draft_rejected` events with no reason. Decided as recommended (R15): the
  engine records a short reader-safe reason with each rejection and stop
  (`src/deploy_workflow/model/handoff.py`, `src/deploy_workflow/owners/cpos_launch.py`), as separate
  work after the audit. Source: `4-register/owner-decisions.md` (OQ-15, R15 ruling).
- **K33. The legacy-page split (R17, B0-006).** The legacy issuer library and the legacy run-start
  form stay in this release. The connected app reads `library/data.js` and links `library/downloads/`,
  both written by the legacy library's build (`apps/issuer-library/update_library.py`); the Python
  context checks (`src/deploy_vii/context.py`) and five test files rely on the legacy form. After the
  audit: separate the data build from the old page, and move the form's rules into Python, before
  either is removed. Source: `4-register/owner-decisions.md` (B0-006, R17);
  `docs/audit/2026-11-16-final/README.md` (R17).

### Known limits you will meet (not defects) (added)

- **K34. The run root is limited to 80 characters** (`src/deploy_workflow/inbox/layout.py:61`); a
  longer path is refused at start with a message. Use a short local folder. Source: `0-baseline/report.md`;
  `4-register/register.md` (B0-004, "named in the work-PC prompt").
- **K35. `proof.serve --root` refuses a folder that already holds a file.** Give each synthetic run a
  new empty folder. Source: `4-register/register.md` (J1-019).
