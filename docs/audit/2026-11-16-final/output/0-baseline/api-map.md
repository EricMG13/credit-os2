# Stage 0: service-to-client map

Commit `960f35641edde8bb9cf79bfb9c6c7308fe430c05`.

- Served routes: read from `react_frontend/__init__.py` (`_app_page`, `_connected_reply`,
  `_connected_report_reply`, `_asset_path`, `STATIC_FILES`, `STATIC_DIRS`), `react_frontend/sources.py`
  (`ADDRESS`), `react_frontend/artifacts.py` (`GRAPH`), `react_frontend/portfolio.py` (`PORTFOLIO`)
  and the inherited `deploy_workflow/run_start/service.py` `Handler._get/_post/_delete`. Order
  matters: the React handler answers first and falls back to the run_start handler.
- Client calls: `node docs/audit/2026-11-16-final/output/0-baseline/probes/api_map.mjs <net-connected.json>`
  lists every exported request helper in `web/src/pages/connected/api.ts` with its method, path and
  importers, the other `fetch()` calls and built addresses in `web/src/pages/connected/`, and, from
  the connected probe's network log, the paths the browser actually requested.
- "Observed" means requested by the browser during the final inventory pass (synthetic service on
  port 8793, one finished run, then the paid-dialog walk with submit aborted); the count is the
  number of requests. Report views after the first load are hash changes in the same document, so
  the snapshot is fetched once per report load.

## Every route the service answers, and its caller

| Method | Route | Served by | Client caller | Status | Observed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/`, `/index.html`, `/start`, `/runs`, `/run/<id>` (`/run/<id>/`), `/report/<folder>` (`/report/<folder>/`) | `_app_page` → the rewritten `connected.html` | page addresses: rail links, `navigate()`, links in `LibraryIndex`, `RunActivity`, `RunProgress`, `ReportLibrary` | matched (navigation, not `api.ts`) | yes |
| GET | `/connected/context` | `_connected_reply` (context JSON + `submission_caps_usd`) | `api.ts` `getContext` ← `StartRun.tsx` | matched | yes (4) |
| GET | `/connected/activity` | `run_activity.listing` | `api.ts` `getActivity` ← `RunActivity.tsx` | matched | yes (3) |
| GET | `/connected/activity/<id>` | `run_activity.reply` | `api.ts` `getRun` ← `RunProgress.tsx`, `report/Record.tsx` | matched | yes (6) |
| GET | `/connected/library` | `_library_index` | `publishedReport.ts:248` (`fetch`, not `api.ts`) | matched outside `api.ts` | yes (2) |
| GET | `/connected/snapshot` and `/connected/snapshot?run=<folder>` | `_visible_scope` | `publishedReport.ts:255` (`fetch`, not `api.ts`) | matched outside `api.ts` | yes (2), always with `?run=`; the bare form was never requested |
| GET | `/connected/sources/<folder>/<sha256>/<name>` (optional `?page=&end=`) | `sources.reply` | `sourceFiles.ts:28` builds the address for a link | matched (link) | no (source links were listed, not followed) |
| GET | `/connected/artifacts/<folder>` | `artifacts.reply` (list) | `report/ArtifactDownloads.tsx:11` (`fetch`, not `api.ts`) | matched outside `api.ts` | yes (2) |
| GET | `/connected/artifacts/<folder>/<sha256>/(model.html\|annual.md\|calculation.json\|forecast_exact.json)` | `artifacts.reply` (file) | `href` values in the list reply, drawn as download links | matched (link from the server's reply) | no (download links were listed, not followed) |
| GET | `/connected/portfolio/<folder>` | `portfolio.attested` | `report/PortfolioBasis.tsx:30` (`fetch`, not `api.ts`) | matched outside `api.ts` | yes (2) |
| GET | `/connected/report/<folder>` | `_report_response` (one entry) | `api.ts` `getReport` ← `RunProgress.tsx` | matched | yes (2) |
| GET | `/connected/reports` | `_report_response` (listing) | none in `web/src` | **served but never called** | no |
| GET | `/data.js` | `_asset_path` (`STATIC_FILES`) | static `index.html` only; `connected.html` does not load it, and the service never serves the static page | **served but never called by the connected app** | no |
| GET | `/symbol.svg` | `_asset_path` | `ConnectedApp.tsx:69` (`Shell symbol="/symbol.svg"`) | matched | yes (14) |
| GET | `/THIRD-PARTY-NOTICES.md` | `_asset_path` | none in `web/src` | **served but never called** | no |
| GET | `/connected-assets/*` | `_asset_path` | the connected bundle and its lazy chunks | matched | yes (all 19 files) |
| GET | `/fonts/*` | `_asset_path` | `url(../fonts/…)` in the connected stylesheet | matched | yes (7 of 7 font files) |
| GET | `/assets/*` | `_asset_path` | the static app's bundle; nothing the service serves loads it | **served but never called by the connected app** | no |
| GET | `/library/<path>` | run_start `Handler._get` (`<root>/_engine/library/`) | `publishedReport.ts:571` `publishedHref` builds `/library/downloads/<folder>/…` links; the native library page itself (`/library/index.html`) has no link from the connected app | matched (download links) | no (download links were listed, not followed) |
| GET | `/activity.js` | run_start `Handler._get` | the native library page (`<script src="../activity.js">`), not the connected app | **served but never called by the connected app** | no (requested only by the native library page) |
| GET | `/api/submissions/<id>/reading` | run_start `Handler._get` | `api.ts` `getReading` ← `StartRun.tsx` | matched | yes (6) |
| GET | `/api/runs/<id>/inputs` | run_start `Handler._get` | `api.ts` `getPriorInputs` ← `StartRun.tsx` | matched | yes (1, `/start?from=<run>`) |
| GET | `/api/issuers/<slug>` | run_start `Handler._get` | `api.ts` `getLatestIssuerRun` ← `StartRun.tsx` | matched | no (the flow never typed an issuer with an earlier run) |
| GET | `/api/runs/<id>` | run_start `Handler._get` (`_run`) | none in `web/src` (used by the legacy form) | **served but never called** | no |
| POST | `/api/submissions` | run_start `Handler._post` | `api.ts` `createSubmission` ← `StartRun.tsx` | matched | yes (2: the synthetic walk and the paid-dialog walk) |
| POST | `/api/submissions/<id>/files?name=<name>` | `_upload` | `api.ts` `upload` ← `StartRun.tsx` | matched | yes (4: two files in each walk) |
| DELETE | `/api/submissions/<id>/files?name=<name>` | `_delete` | `api.ts` `removeDocument` ← `StartRun.tsx` | matched | no (no document was removed) |
| POST | `/api/submissions/<id>/summary` (header `X-Shown-Cap`) | `_summary` | `api.ts` `getSummary` ← `StartRun.tsx` | matched | yes (2) |
| POST | `/api/submissions/<id>/submit` (header `X-Shown-Cap`) | `_submit` | `api.ts` `submit` ← `StartRun.tsx` | matched | yes (1: the synthetic run; the paid walk sent none) |
| POST | `/api/submissions/<id>/carry` | `_carry` | `api.ts` `carryDocuments` ← `StartRun.tsx` | matched | no |
| GET | `/` under `python -m deploy_workflow.run_start` only | run_start `Handler._get` (the legacy form) | shadowed by the React page under `react_frontend`/`proof.serve` | not reachable through the React service | — |
| POST, DELETE | any path when started by `react_frontend.preview` | refused with 405 ("read-only retained preview") | — | — | — |

## Every call in `api.ts`

| Helper | Method and path | Imported by (outside tests) | Status |
| :--- | :--- | :--- | :--- |
| `getContext` | GET `/connected/context` | `StartRun.tsx` | matched |
| `createSubmission` | POST `/api/submissions` | `StartRun.tsx` | matched |
| `upload` | POST `/api/submissions/<id>/files?name=<name>` | `StartRun.tsx` | matched |
| `removeDocument` | DELETE `/api/submissions/<id>/files?name=<name>` | `StartRun.tsx` | matched |
| `getPriorInputs` | GET `/api/runs/<run>/inputs` (a JSON `error` with status 200 is allowed as a warning) | `StartRun.tsx` | matched |
| `getLatestIssuerRun` | GET `/api/issuers/<issuer>` | `StartRun.tsx` | matched |
| `carryDocuments` | POST `/api/submissions/<id>/carry` | `StartRun.tsx` | matched |
| `getReading` | GET `/api/submissions/<id>/reading` | `StartRun.tsx` | matched |
| `getSummary` | POST `/api/submissions/<id>/summary` | `StartRun.tsx` | matched |
| `submit` | POST `/api/submissions/<id>/submit` | `StartRun.tsx` | matched |
| `getActivity` | GET `/connected/activity` | `RunActivity.tsx` | matched |
| `getRun` | GET `/connected/activity/<id>` | `RunProgress.tsx`, `report/Record.tsx` | matched |
| `getReport` | GET `/connected/report/<id>` | `RunProgress.tsx` | matched |

**Called but not served: none.** Every path `api.ts` and the other connected `fetch()` calls build
has a server route. **Served but never called by the connected app:** `/connected/reports`,
`/api/runs/<id>`, `/THIRD-PARTY-NOTICES.md`, and, for the connected page, `/data.js`, `/assets/*` and
`/activity.js` (these three are used by the static app and the native library page).

Four connected `fetch()` calls bypass `api.ts` and its shared error handling (`request()`):
`publishedReport.ts:248` and `:255`, `report/ArtifactDownloads.tsx:11` and
`report/PortfolioBasis.tsx:30`; the source links are built in `sourceFiles.ts:28`.

The network log records URLs, not methods. POST and DELETE on `/api/submissions/<id>/files` share
one path; DELETE is marked not observed because no remove control was used in the flow.
