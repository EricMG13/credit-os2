# Stage 0: Mechanical baseline

One agent, medium effort. No model judgement: run tools, record numbers, list what exists.
Changes nothing outside `output/0-baseline/`.

## Inputs

| Layer | File | Section | Why |
| :--- | :--- | :--- | :--- |
| L1 | `docs/audit/2026-11-16-final/README.md` | Scope, Sections, Rules | The scope and the section table to confirm |
| L3 | `docs/react-workflow.md` | Set up, Open the interface | How to build and serve both surfaces |
| L3 | `docs/QUALITY-GATE.md` | all | The Python gate command |
| L3 | `web/package.json` | `scripts` | The frontend gate commands |
| L3 | `web/src/pages/route-table.ts` and each group's `routes.tsx` | all | The static app's routes |
| L3 | `react_frontend/` and `web/src/pages/connected/api.ts` | all | The connected app's service and its client |

## Process

1. **Set up.** `uv sync --locked`, `npm --prefix web ci`, `npm --prefix web run build`. Record the
   Python, uv, Node and npm versions and the commit under audit.
2. **Gates as they stand.** Run each and record the exit code and the headline number; do not fix
   anything.
   - `npm --prefix web run lint`, `format:check`, `typecheck`, `test`, `unused`, `duplication`,
     `test:scripts`, `test:file:gates`, `audit`.
   - `uv run python tools/quality_gate.py --base HEAD~1 --json`.
   - The fast Python tests: `uv run pytest -m "not live and not browser" -q -x --timeout=300` if the
     timeout plugin is installed, otherwise without `--timeout`. Stop a run that passes ten minutes.
   - If the fallow skill or CLI is available, run its audit on `web/` and save the report. If not,
     the `unused` (knip) and `duplication` (jscpd) results stand in; say so under `Not verified:`.
3. **Surface map.** Decide from the code, the build scripts and `tools/package_react_windows.py`
   which surfaces and which files reach the work PC. Record for each: entry file, how it is
   served, where its data comes from, and whether the release ZIP contains it. State plainly
   whether the kit page (`#/kit`) and the `Kit7*.tsx` files are reachable by a user.
4. **Confirm the section table.** Check every file and route in the README's Sections table
   exists, and that every page file outside Signal belongs to exactly one section. Write the
   corrected table.
5. **Start the synthetic service.** `PYTHONPATH=src uv run --locked python -m proof.serve --root
   <new empty folder> --port <port>`. Complete one synthetic run by following "Open the interface"
   in `docs/react-workflow.md`, so the report screens have data. No paid call is made.
6. **Clickable inventory.** With Playwright (already a dev dependency), visit every screen of
   both surfaces and list every interactive element: links, buttons, tabs, toggles, inputs,
   selects, drop zones, drawers, dialogs, table sort and row controls, chart controls. For each:
   section id, screen, state, role, accessible name, and a stable locator. Open each drawer,
   dialog, tab and disclosure and inventory what it reveals. Do not judge; only list.
   If Chrome or Edge is not installed, use Playwright's Chromium and say so under `Not verified:`.
7. **Baseline screenshots.** Every screen at 1440 px and 390 px wide, in each state reachable
   from the synthetic run and the fixture. Keep them in an untracked scratch folder and record
   its path and a file list.
8. **Offline check.** Block every host but loopback in the browser (Playwright: abort any request
   whose host is not `127.0.0.1`, `localhost` or `[::1]`), then load every screen of both surfaces
   and log each request that was attempted and blocked. Separately, search `web/dist/` and the
   Python that serves pages for addresses of other hosts (`http://`, `https://`, `//host`,
   `@import`, `url(`, `<link>`, `<script src>`, `fetch(`, WebSocket addresses) and list each with
   what would load it. A namespace or licence address that nothing fetches is listed as harmless.
9. **API map.** List every route `react_frontend` serves and every call in
   `web/src/pages/connected/api.ts`. Mark each as matched, served but never called, or called but
   not served.

## Outputs

All under `docs/audit/2026-11-16-final/output/0-baseline/`.

| File | Contents |
| :--- | :--- |
| `baseline.md` | Versions, commit, each gate's command, exit code and headline number |
| `surface-map.md` | The surface map and the kit-page answer |
| `sections.md` | The confirmed section table |
| `clickables.jsonl` | One line per interactive element |
| `screens.md` | The screenshot list and its scratch path |
| `offline.md` | Requests attempted to other hosts, and other-host addresses in the built files |
| `api-map.md` | The service-to-client map |
| `report.md` | What ran, what could not, ending with `Not verified:` |
