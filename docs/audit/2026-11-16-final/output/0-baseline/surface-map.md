# Stage 0: surface map

Audited commit: `main` 2b881075 (checkout on `audit/final-coordination`, a0d18ac; no change under
`web/`, `react_frontend/`, `proof/` or `tools/` since). Read from the code, `web/scripts/build.mjs`,
the two Vite configs and `tools/package_react_windows.py`; the connected routes were also probed on a
running `proof.serve` (`scratchpad/stage0/apimap-probe.txt`, see `api-map.md`).

## What the release ZIP contains

`tools/package_react_windows.py` builds `delivery/credit-os2-react.zip` (`:120`):

- The tracked files under `SOURCE_PATHS` (`tools/package_react_windows.py:16-37`), taken with
  `git archive` of the chosen commit (`:98`): `.python-version`, `METHODOLOGY-REVIEW.md`, `README.md`,
  `Run-React-Proof.cmd`, `apps/issuer-library`, `cases/context`, `docs/design/brand-tokens.md`,
  `docs/design/design-system.md`, `docs/react-workflow.md`, `docs/reuse/selected-methods`,
  `docs/rulings`, `docs/templates`, `docs/visualisations`, `prompts`, `proof`, `pyproject.toml`,
  `react_frontend`, `src`, `uv.lock`, `web`.
  - So all of `web/src` reaches the work PC as source, tests included: `Kit.tsx`, `Kit7c.tsx`…`Kit7g.tsx`,
    the static pages, the connected pages, `web/scripts/`, `web/fixtures/`, `web/public/`.
  - `tests/`, `tools/` and the rest of `docs/` are not in the ZIP.
  - Signal source (`src/deploy_workflow/signal/`, `web/src/pages/signal/`) is in the ZIP because whole
    `src` and `web` are; it is out of audit scope and not examined further.
- A fresh `web/dist/` built inside a temporary copy (`npm ci`, `npm run build`, `:65-76`) and written
  under `web/dist/` (`:88-92`). The source part may not contain `web/dist`, `node_modules`, `.venv`,
  `.env`, `.key`, `.pem`, `.rtf` or links (`:49-58`).
- `SOURCE-COMMIT.txt` (`:93`).

`npm run build` (`web/package.json:52`) runs `tsc --noEmit` then `web/scripts/build.mjs`, which runs Vite
twice (`web/scripts/build.mjs:8-11`):

1. `web/vite.config.ts` → `web/dist/index.html`, `web/dist/assets/index-*.js` (one classic IIFE,
   `web/vite.config.ts:9-27,40`), `web/dist/assets/style-*.css`, and `web/public/` copied as is
   (`data.js`, `symbol.svg`, `fonts/`, `THIRD-PARTY-NOTICES.md`).
2. `web/vite.connected.config.ts` → `web/dist/connected.html` and `web/dist/connected-assets/*`
   (`web/vite.connected.config.ts:13-22`), without emptying `dist` (`:12`).

## Surfaces

| Surface | Entry file | How served | Data source | In release ZIP |
| :--- | :--- | :--- | :--- | :--- |
| Connected app, live (Credit OS 2) | `web/connected.html` → `web/src/connected-main.tsx` → `web/src/pages/connected/ConnectedApp.tsx` (lazy, `connected-main.tsx:6-10`) | `python -m react_frontend --root <folder>` (`react_frontend/__main__.py:7-17`, default port 8765) → `serve()` (`react_frontend/__init__.py:415-434`) on `127.0.0.1` (`:407`). Every app path (`/`, `/index.html`, `/start`, `/runs`, `/run/<id>`, `/report/<folder>`, `:238-243`) gets `dist/connected.html` rewritten with `connect-src 'self'` and a mode meta (`:212-226`); assets from `dist/` (`:229-235,362-369`) | The workspace under `--root`: the published library `engine/library/data.js` filtered by `admission.admitted` (`:81-94`), run records (`run_activity.py`), run folders (sources, artifacts, portfolio); start-run calls go to the run-start service and scheduler (`src/deploy_workflow/run_start/service.py:239-296`) | Yes: source (`react_frontend`, `src`, `web`) and the built `web/dist/connected.html`, `web/dist/connected-assets/` |
| Connected app, synthetic proof | Same page and bundle; `credit-os-mode` meta is `synthetic` (`react_frontend/__init__.py:217-221`; read at `web/src/connected-main.tsx:15,31`) | `python -m proof.serve --root <empty folder>` (`proof/serve.py:11-40`): the same `react_frontend.serve` with `synthetic=True` and the network-disabled launcher `proof.launcher` (`proof/__init__.py:8-9`); refuses a non-empty root (`proof/serve.py:17-18`); a dummy key replaces provider keys (`:24-32`). `Run-React-Proof.cmd` runs `npm run proof:connected`, which spawns `proof.serve` on port 0 and drives it with Playwright (`web/scripts/connected-proof.mjs:54`) | Canned module handoffs in `proof/handoffs/` via `proof/launcher.py`; the uploaded `proof/northbridge-*` files | Yes (`proof`, `Run-React-Proof.cmd`) |
| Connected app, read-only retained preview | Same page and bundle | `python -m react_frontend.preview --engine --snapshot --run --web [--port]` (`react_frontend/preview.py:57-78`) → `make_server(..., read_only=True)` (`:47-49`); POST and DELETE answer 405 (`react_frontend/__init__.py:264-266,338-344`) | A supplied snapshot written as `data.js` into an isolated copy (`react_frontend/preview.py:21,29-43`) | Yes (in `react_frontend`); no document in the ZIP names it |
| Static app (React library opened from disk) | `web/index.html` → `web/src/main.tsx` → `web/src/App.tsx`; hash routes from `web/src/pages/route-table.ts` and `web/src/pages/{library,model,run,signal}/routes.tsx` | Opened from disk (`file://…/web/dist/index.html`); built as a classic deferred script so it runs from `file:` (`web/vite.config.ts:6-27`); CSP `connect-src 'none'` (`web/index.html:5-8`). **Not served by `react_frontend`**: `/index.html` there returns the connected page (`react_frontend/__init__.py:214,240`), although `/data.js` and `/assets/` are served (`:31-32`) | `web/dist/data.js`, loaded by `<script src="./data.js">` (`web/index.html:17`) and read at `web/src/main.tsx:12`. In the ZIP it must equal `web/public/data.js` (`tools/package_react_windows.py:74-75`), which is `window.CREDIT_OS_DATA = { schema: "credit-os-data/1", issuers: [] };` — no runs and no library/model/run slices. No Python code writes the `credit-os-data/1` schema (only `web/src/data.ts`, `web/scripts/fixture-data.mjs`, `web/scripts/open-from-disk.mjs` and tests name it). The fixtures `web/fixtures/{library,model,run,signal}.json` are written into a temporary copy only by the from-disk checks (`web/scripts/route-visits.mjs:77`) | Yes: `web/dist/index.html`, `web/dist/assets/`, `web/dist/data.js` (empty placeholder). No launcher, `.cmd` or document in the ZIP tells a user to open `web/dist/index.html` (the only references are `Run-React-Proof.cmd:7`, which uses it as a "build done" marker, and the package/test checks) |
| Legacy issuer library page (not in README Scope) | `<workspace>/library/index.html`, copied from `apps/issuer-library/credit_os/web/` (`apps/issuer-library/update_library.py:28,270,292-298`) | Opened from disk, or served under `/library/*` by the run-start handler that `react_frontend` extends (`src/deploy_workflow/run_start/service.py:254-255`). Rebuilt after each run by the scheduler (`src/deploy_workflow/inbox/scheduler.py:414` → `src/deploy_workflow/owners/cpos_launch.py:1837-1848`). The connected report links its download files as `/library/downloads/<folder>/…` (`web/src/pages/connected/publishedReport.ts:558-571`, used at `ReportContent.tsx:73`, `report/Evidence.tsx:477`, `report/Record.tsx:147`) | `<workspace>/library/data.js` (`window.CREDIT_OS_DATA=…`) written by `update_library.py:290-292` from run folders | Yes (`apps/issuer-library`) |
| Legacy run-start form (not in README Scope) | `docs/templates/context-form.html` (`src/deploy_workflow/inbox/startup.py:25`) | `python -m deploy_workflow.run_start` (`src/deploy_workflow/run_start/__main__.py`; `service.py:241-253` serves it at `/`). Under `react_frontend` and `proof.serve` the `/` path is taken by the connected page first (`react_frontend/__init__.py:240,348-358`), so the form is unreachable there | Same run-start service and scheduler | Yes (`src`, `docs/templates`) |
| Signal | — | Excluded from this audit (README, Scope). Its rail item appears in the static app (`web/src/shell/Shell.tsx:11`) | — | Yes (inside `src`, `web`); not examined |

## The kit page (`#/kit`) and the `Kit7*.tsx` files

Plain answer: **yes, a user can reach the kit page, in the static app only, and it is linked from the
navigation rail.** It is not reachable in the connected app.

- Route: `#/kit` is not in the route table. `web/src/App.tsx:103-109` special-cases `route === "/kit"`
  and renders `<Kit />` (`web/src/pages/Kit.tsx:119`) inside the shell.
- Navigation: the static shell's rail always lists Kit: `{ area: "kit", label: "Kit", href: "#/kit" }`
  (`web/src/shell/Shell.tsx:12`). `App.tsx` never passes `sections` to `Shell`
  (`web/src/App.tsx:67,78,87,95,105,112,118`), so the full list `ITEMS` (`Shell.tsx:7-13,29-35`) is
  drawn on every static page. A user one click away from any static page reaches it; typing
  `#/kit` also works.
- Built: the kit is in the static bundle (`web/dist/assets/index-*.js` contains the "Component kit"
  heading from `Kit.tsx:124`) and is checked in Chrome by `web/scripts/kit-chrome.mjs`
  (`web/scripts/open-from-disk.mjs:226`). It is not in the connected bundle (`web/dist/connected-assets/`
  has no "Component kit").
- `Kit7*.tsx`: `Kit7c.tsx`, `Kit7d.tsx`, `Kit7e.tsx`, `Kit7f.tsx`, `Kit7g.tsx` are imported only by
  `Kit.tsx:22-26` and drawn at `Kit.tsx:387-390,434`. They are reachable exactly as far as `#/kit` is.
  There is no `Kit7b.tsx` (or `Kit7a`); `web/src/pages/Kit7b.test.tsx` tests `Kit.tsx`.
- Connected app: the connected rail is limited to Library and Run (`web/src/pages/connected/ConnectedApp.tsx:28-31,69`);
  the server has no `/kit` path (probe: `GET /kit` → 404 `{"error": "not found"}`), and `ConnectedApp`
  has no kit branch.
- In practice: the static app reaches the work PC in the ZIP, but nothing in the ZIP tells a user to
  open it, and with the shipped empty `data.js` its library, model and run pages have no run data to draw (inferred from the code); the kit
  page needs no data, so it is the one static page that draws fully.

Not verified: the ZIP was not built (no `package_react_windows.py` run: it runs `npm ci`/`npm run build`,
which this worker must not run); the ZIP contents above are read from the code, not listed from a real
archive. The static app was not opened in a browser, so what each static page shows with the empty
`data.js` is inferred from the code, not seen. `python -m react_frontend` (live) and
`react_frontend.preview` were not started; `python -m deploy_workflow.run_start` was not started.
`Run-React-Proof.cmd` was not run (Windows-only).
