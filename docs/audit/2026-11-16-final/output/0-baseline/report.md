# Stage 0: report

Main under audit: `2b881075` (merge of PR #54), merged into `audit/final-coordination` at `f8f8b11`;
no change under `web/`, `src/`, `react_frontend/` or `proof/` since. Run 2026-11-17 by the lead
through four sub-agents (gates; surface, sections and API map; connected browser; static browser).
Nothing outside `output/0-baseline/` was changed and no paid call was made (R4): the connected run
used `proof.serve`, whose Submit dialog read "spends USD 0.00".

## What ran

| Step | Output | Result |
| :--- | :--- | :--- |
| 1 Set up | `baseline.md` | `uv sync --locked`, `npm ci`, `npm run build` exit 0 after upgrading uv 0.11.32 → 0.12.5 to meet the repo's `required-version` pin (tool install, no manifest change) |
| 2 Gates | `baseline.md` | Frontend: lint, format:check, typecheck, test (3,950/3,950), unused (0), duplication (1.57 %), test:scripts (70/70), audit (0) exit 0. `test:file:gates` exits 1 in this container (its Chrome wrapper hangs on every page; with the gate's own `CHROME_PATH` pointed at the headless shell it exits 0, 134 checks). Python quality gate exit 0 (against `2b881075^1`: 10 files, 0 issues). Fast Python suite in 11 chunks: 7,239 passed, 3 failed, 6 skipped; all 3 failures listed in `tests/known-failures.txt` |
| 3 Surface map | `surface-map.md` | Two surfaces as the README says, plus two legacy pages outside the scope table (ruling L1 in `sections.md`). Kit page reachable by users of the static app from the rail; not in the connected app |
| 4 Sections | `sections.md` | Table confirmed; no file missing; 283 non-Signal source files each in one row; route spellings corrected |
| 5 Synthetic service | `screens.md`, probes | Run completed on `proof.serve`. Following `docs/react-workflow.md` "Open the interface" exactly fails 3/3 at Legal & covenants ("No executed governing document"); it completes only with `proof/northbridge-credit-agreement.txt` uploaded and chosen as the executed agreement, which the doc does not say |
| 6 Clickables | `clickables.jsonl` | 13,293 lines (connected 3,778; static 9,515); every line parses with the brief's fields |
| 7 Screenshots | `screens.md` | 1,597 PNGs (connected 379, static 1,218) in the lead's scratch folder |
| 8 Offline | `offline.md` | 0 requests to another host on any screen of either surface; built files carry only harmless namespace and licence addresses |
| 9 API map | `api-map.md` | No route called but not served; five served routes never called by the connected client |

## Carried to stage 4 (to be registered there, not judged here)

- `test:file:gates` exits 1 in this container; the cause is the browser wrapper, not established as an app defect (Info unless the work PC reproduces it).
- `AGENTS.md` names `tests/nightly-known-failures.txt`; the file is `tests/known-failures.txt`.
- The documented manual synthetic run in `docs/react-workflow.md` ends Failed without the credit agreement upload.
- The run root is limited to 80 characters (`src/deploy_workflow/inbox/layout.py:61`); longer paths are refused.
- Served but never called: `GET /connected/reports`, `GET /api/runs/<id>`, `GET /activity.js`, `/index.html`, `/library/index.html` (`api-map.md`).
- The legacy issuer library and run-start form ship in the release ZIP and stay reachable (ruling L1).
- A Teams webhook POST is possible from the scheduler when two variables are set; `proof.serve` does not clear them (`offline.md`, R8 question for stage 2).
- The shipped static `data.js` is empty; the static app shows only empty states on shipped data.
- Static run-activity pages link to `#/library/transdigm/…`, an issuer the fixture library lacks (error page).
- In `clickables.jsonl` the shared shell rail is attributed X1 on the connected surface and S1 on the static one; `sections.md` (S1 owns `web/src/shell/`) governs.

## Environment notes for later sessions

- uv must be 0.12.5 (`pip install --user uv==0.12.5` if the container has another).
- Playwright 1.62.1 looks for headless shell build 1234; only build 1243 is installed. Launch with
  `executablePath` set to `/opt/pw-browsers/chromium_headless_shell-1243/…` (see the stage 0 probes).
- `test:file:gates` needs `CHROME_PATH` set to that headless shell (and `CI=true`) in the cloud container.
- `proof.serve --root` must be at most 80 characters; use a short folder under `/tmp`.
- A completed synthetic run needs `proof/northbridge-credit-agreement.txt` uploaded and chosen as the
  executed agreement, as `web/scripts/connected-proof.mjs` does.
- `tests/test_financial_workflow.py` cannot finish inside 10 minutes as one run; split it.

Not verified: Chrome and Edge on Windows (only Playwright's Chromium build 1243 here); `test:file:gates` with its default browser on a machine where that browser works; one uninterrupted run of the fast Python suite; the slow, live and browser test markers; fallow (not installed; knip and jscpd stand in); the regular `python -m react_frontend` mode and any live run (R4); the Teams path with its variables set; the release ZIP's contents (stage 7); 31 connected disclosures that timed out on click and every second-level dialog; hover-only, keyboard-only and drag-and-drop reveals; whether the `/library/downloads/…` files the connected report links are present.
