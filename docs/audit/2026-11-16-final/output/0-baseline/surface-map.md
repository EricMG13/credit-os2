# Stage 0: surface map

Commit `960f35641edde8bb9cf79bfb9c6c7308fe430c05`. Sources read: `web/package.json`,
`web/scripts/build.mjs`, `web/vite.config.ts`, `web/vite.connected.config.ts`, `web/index.html`,
`web/connected.html`, `web/src/main.tsx`, `web/src/connected-main.tsx`, `web/src/App.tsx`,
`web/src/shell/Shell.tsx`, `web/src/pages/connected/ConnectedApp.tsx`, `react_frontend/__init__.py`,
`react_frontend/__main__.py`, `react_frontend/preview.py`, `proof/serve.py`,
`src/deploy_workflow/run_start/service.py`, `apps/issuer-library/update_library.py`,
`tools/package_react_windows.py`, `Run-React-Proof.cmd`. Observations come from the running
synthetic service (`proof.serve`, port 8792) and from `curl` against it.

## What reaches the work PC

`tools/package_react_windows.py --revision <rev>` writes `delivery/credit-os2-react.zip`: a
`git archive` of 20 paths at the chosen commit (`SOURCE_PATHS`), plus a fresh `web/dist/` built by
`npm ci` and `npm run build` in a temporary copy, plus `SOURCE-COMMIT.txt`. At this commit the
archive part holds 1,360 entries (`git archive … | tar -t`). It contains `web/` whole (sources,
`fixtures/`, `scripts/`, `public/`, including `web/src/pages/signal/` and every `Kit*.tsx`),
`react_frontend/`, `proof/` (synthetic filing, workbook and the canned handoffs), `src/` (including
`src/deploy_workflow/signal/`), `apps/issuer-library`, `prompts/`, `cases/context`, `docs/rulings`,
`docs/templates`, a few design docs, `pyproject.toml`, `uv.lock` and `Run-React-Proof.cmd`. It does
not contain `tests/`, `tools/`, `runs/`, `reviews/`, `AGENTS.md`, `VERIFICATION.md` or `docs/audit/`.
`build_web` refuses a build whose `dist/data.js` differs from `web/public/data.js`, so the shipped
static data file is always the empty placeholder.

## Surfaces

| # | Surface | Entry file | How it is served | Where its data comes from | In the release ZIP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Connected app (Credit OS 2) | `web/connected.html` → `web/src/connected-main.tsx` → `pages/connected/ConnectedApp.tsx` (lazy chunks); built to `web/dist/connected.html` + `connected-assets/` | `python -m react_frontend --root <folder>` (port 8765 by default) or `python -m proof.serve --root <empty folder>` (synthetic launcher, dummy key, port 0 by default), both bound to `127.0.0.1`; also `python -m react_frontend.preview` (read-only retained preview, writes refused with 405). The service rewrites the page on the way out: `connect-src 'none'` becomes `'self'`, it adds `credit-os-backend`, `credit-os-mode` (`synthetic`/`live`) and optionally `credit-os-signal-url` meta tags, and turns `./` into `/`. Pages: `/`, `/index.html`, `/start`, `/runs`, `/run/<id>`, `/report/<folder>` | Same-origin JSON: `/connected/*` (built from `<root>/_engine/library/data.js`, run folders and uploads) and `/api/*` (the run_start submissions, runs and issuers). See `api-map.md` | Yes: sources in `web/`, built page in `web/dist/` |
| 2 | Static app | `web/index.html` → `web/src/main.tsx` → `App.tsx` (hash routes from `pages/route-table.ts`); built to `web/dist/index.html` + `assets/` + `data.js` | Opened from disk (`file://…/web/dist/index.html`). Not served as a page by the Python service: `/index.html` there returns the connected page; only `/assets/*`, `/data.js`, `/fonts/*`, `/symbol.svg` are served as files | `window.CREDIT_OS_DATA` from `data.js`. As built and shipped it is `{ schema: "credit-os-data/1", issuers: [] }` (69 bytes). The fixture is `web/fixtures/{library,model,run,signal}.json`, written into a copy's `data.js` only by `web/scripts/fixture-data.mjs` (gates and tests, and this audit's probe) | Yes, with the empty data file. Opened from the ZIP, it draws the library home with no issuers; `#/model` and `#/run` draw their homes with no data (screens `static-empty-*`) |
| 3 | Native issuer library (not in the README scope table) | `apps/issuer-library/credit_os/web/index.html`, copied by `update_library.py` to `<root>/_engine/library/index.html` with `data.js`, scripts, fonts and icons; `<root>/library.html` redirects to it | From disk, and over loopback at `/library/index.html` (and `/library/`) by the run_start handler the React service inherits; `/activity.js` is served beside it | Its own `data.js` (catalogue and workspace store) written after each run | Yes (`apps/issuer-library`) |
| 4 | Legacy run-start form (not in scope) | `docs/templates/context-form.html` (`deploy_workflow.inbox.startup.FORM`) | Only by `python -m deploy_workflow.run_start`, at `/`. Under `react_frontend`/`proof.serve` the React page takes `/` first, so the form is unreachable there | `/api/*` | Yes (`docs/templates`, `src/`) |
| — | Signal (out of scope, R2) | `web/src/pages/signal/`, `src/deploy_workflow/signal/` | Static app hash `#/signal`; separate Python service; the connected rail shows it only when `--signal-url` is set | — | Yes (not audited) |

Notes from the observations:

- An unknown top-level path on the connected service (`/no-such-page`, `/kit`) is answered by
  Python with `404 application/json {"error": "not found"}`; the React "Page not found" heading in
  `ConnectedApp.tsx` is never drawn for such a path (screen `connected-no_such_page-*`). It is drawn
  only when the server accepts a path as an app page that the client's own patterns then reject;
  this baseline did not look for such a path.
- The README's Scope table says the static app's data is "`web/public/data.js` fixture". That file is
  the empty placeholder; the fixture lives in `web/fixtures/*.json` and never ships as data.

## The kit page (`#/kit`) and `Kit7*.tsx`

**Yes, a user can reach the kit page, in the static app only.** `Shell.tsx` puts a "Kit" item
(`href="#/kit"`, icon `Grid01`) in the rail whenever the caller passes no `sections`; the static
`App.tsx` passes none, so the Kit item is in the rail on every static screen, including the release
build opened from disk (clickables: `section S1`, role `link`, name `Kit`). `App.tsx` draws `<Kit />`
for `#/kit`, and `Kit.tsx` imports and renders `Kit7c.tsx` (`KitInputSelect`), `Kit7d.tsx`
(`KitTableProgress`), `Kit7e.tsx` (`KitOverlays`), `Kit7f.tsx` (`KitFileUpload`) and `Kit7g.tsx`
(`KitLinkButton`), so all five are reachable through it. There is no `Kit7b.tsx`; `Kit7b.test.tsx`
tests `Kit.tsx`.

**No, in the connected app.** `ConnectedApp.tsx` passes `sections` (Library, Run) to `Shell`, so the
rail has no Kit item, and `/kit` is a Python 404. All Kit files ship in the ZIP: as sources under
`web/src/pages/`, and compiled into `web/dist/assets/index-*.js`, the static app's single bundle.
