# Stage 0: API map (connected service vs connected client)

Audited commit: `main` 2b881075 (checkout a0d18ac; no change to the files below since).

Server: `react_frontend/__init__.py` `_handler` (`:307-375`). Its `_get` tries, in order, the app
pages (`:348-358`), the `/connected/*` routes (`_connected_reply`, `:269-304`), the static build
files (`:362-369`), then the run-start service's own GET routes (`super()._get`,
`src/deploy_workflow/run_start/service.py:239-269`). POST and DELETE go straight to the run-start
service (`service.py:271-296`) after the read-only check (`react_frontend/__init__.py:338-344`).
Anything no route answers is 404 `{"error": "not found"}` (`src/deploy_workflow/http_base.py:204-218`).
Every non-GET request must carry the service's own `Origin` (`service.py` module docstring; probe:
`POST /api/submissions` without `Origin` → 403).

`proof.serve` serves exactly the same routes: it calls the same `react_frontend.serve` with
`synthetic=True` and a network-disabled launcher (`proof/serve.py:34-40`). The only differences are
the `credit-os-mode` meta (`react_frontend/__init__.py:217-221`) and that Submit starts the synthetic
engine child instead of a provider run. `react_frontend.preview` uses the same handler with
`read_only=True`: every POST and DELETE answers 405 (`:264-266,338-344`).

Client: every `fetch` in `web/src/pages/connected/` (five sites: `api.ts:174` through the `request`
helper, `publishedReport.ts:248,255`, `report/PortfolioBasis.tsx:30`, `report/ArtifactDownloads.tsx:11`)
and every same-origin link or navigation the connected pages build.

Probe: every row below was requested against a running `proof.serve` on `127.0.0.1:8741` with a new
empty root and no run; status codes are in `probes/api-map-probe.txt`. With no run, per-run routes
answer 404 for an unknown id, which shows the route exists (a missing route also answers 404, but with
`{"error": "not found"}`, not the route's own message).

## Data routes

| Method | Path | Server handler | Client caller | Status |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/connected/context` | `react_frontend/__init__.py:273-274` | `web/src/pages/connected/api.ts:205-219` (`getContext`), called at `StartRun.tsx:1239` | matched |
| GET | `/connected/activity` | `react_frontend/__init__.py:275-276` → `react_frontend/run_activity.py:227` (`listing`) | `api.ts:252-253` (`getActivity`), called at `RunActivity.tsx:56` | matched |
| GET | `/connected/activity/<run id>` | `react_frontend/__init__.py:275-276` → `react_frontend/run_activity.py:291` (`reply`) | `api.ts:254-255` (`getRun`), called at `RunProgress.tsx:54`, `report/Record.tsx:180` | matched |
| GET | `/connected/library` | `react_frontend/__init__.py:277-278` → `_library_index` `:97-116` | `publishedReport.ts:248` | matched |
| GET | `/connected/snapshot` and `/connected/snapshot?run=<folder>` | `react_frontend/__init__.py:279-284` (query check `:119-137`) | `publishedReport.ts:255` | matched |
| GET | `/connected/report/<folder>` | `react_frontend/__init__.py:298-303` → `_report_request` `:246-251`, `_report_response` `:254-261` | `api.ts:256-257` (`getReport`), called at `RunProgress.tsx:62` | matched |
| GET | `/connected/reports` | `react_frontend/__init__.py:298-303` (listing branch, `:247,257-258`) | none | **served but never called** |
| GET | `/connected/artifacts/<folder>` | `react_frontend/__init__.py:291-293` → `react_frontend/artifacts.py:55` (`reply`) | `report/ArtifactDownloads.tsx:11` | matched |
| GET | `/connected/artifacts/<folder>/<sha256>/<model.html\|annual.md\|calculation.json\|forecast_exact.json>` | same (`react_frontend/artifacts.py:12-15,55`) | link hrefs the server returns (`artifacts.py:49`), drawn at `report/ArtifactDownloads.tsx:25-28` | matched (link) |
| GET | `/connected/portfolio/<folder>` | `react_frontend/__init__.py:294-297` → `react_frontend/portfolio.py:243` (`attested`) | `report/PortfolioBasis.tsx:30` | matched |
| GET | `/connected/sources/<folder>/<sha256>/<name>` (optional `?page=N[&end=M]`) | `react_frontend/__init__.py:285-286` → `react_frontend/sources.py:371` (`reply`); page query `sources.py:306,362` | link hrefs built and checked at `sourceFiles.ts:25-36`, drawn by `report/Evidence.tsx` and `ReportContent.tsx` (via `SourceFileLinks`) | matched (link) |
| GET | `/api/issuers/<slug>` | `src/deploy_workflow/run_start/service.py:264-266` → `prior.issuer` (`prior.py:101`) | `api.ts:234-237` (`getLatestIssuerRun`), called at `StartRun.tsx:251` | matched |
| GET | `/api/runs/<run id>/inputs` | `service.py:261-263` | `api.ts:232-233` (`getPriorInputs`), called at `StartRun.tsx:253,1242` | matched |
| GET | `/api/runs/<run id>` | `service.py:267-269` → `_run` `:343-356` | none (the connected app reads a run from `/connected/activity/<id>`) | **served but never called** |
| GET | `/api/submissions/<id>/reading` | `service.py:258-260` | `api.ts:240` (`getReading`), called at `StartRun.tsx:1500,1523` | matched |
| POST | `/api/submissions` | `service.py:272-273` | `api.ts:221-222` (`createSubmission`), called at `StartRun.tsx:1470` | matched |
| POST | `/api/submissions/<id>/files?name=<name>` | `service.py:278-279` → `_upload` `:306-313` | `api.ts:223-229` (`upload`), called at `StartRun.tsx:1476` | matched |
| DELETE | `/api/submissions/<id>/files?name=<name>` | `service.py:291-296` | `api.ts:230-231` (`removeDocument`), called at `StartRun.tsx:1496,1510` | matched |
| POST | `/api/submissions/<id>/carry` | `service.py:288-289` → `_carry` `:315-326` | `api.ts:238-239` (`carryDocuments`), called at `StartRun.tsx:1494` | matched |
| POST | `/api/submissions/<id>/summary` (header `X-Shown-Cap`) | `service.py:280-283` (cap check `:217-234`) | `api.ts:241-249` (`getSummary`), called at `StartRun.tsx:1673` | matched |
| POST | `/api/submissions/<id>/submit` (header `X-Shown-Cap`) | `service.py:284-287` → `_submit` `:331-341` | `api.ts:250-251` (`submit`), called at `StartRun.tsx:1762` | matched (not called by this worker: no Submit, R4) |
| GET | `/activity.js` | `service.py:256-257` | none | **served but never called** (legacy run-activity script for the old pages) |
| GET | `/library/<path>` | `service.py:254-255` (files of `<engine>/library/`, the legacy issuer library) | download links `/library/downloads/<folder>/…` built at `publishedReport.ts:558-571`, used at `ReportContent.tsx:73`, `report/Evidence.tsx:477`, `report/Record.tsx:147` | matched (link); the legacy page `/library/index.html` itself is served but nothing in the connected app links it |

## App pages and static files

| Method | Path | Server handler | Client caller | Status |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | `react_frontend/__init__.py:238-243,348-358` (connected page) | rail Library `ConnectedApp.tsx:29`; drawn at `ConnectedApp.tsx:71` | matched |
| GET | `/index.html` | same | drawn at `ConnectedApp.tsx:71`; no link builds it | served, page only (no client link) |
| GET | `/start` (`?from=<run>`) | same | `RunActivity.tsx:259`, `LibraryIndex.tsx:214`, `RunProgress.tsx:115`; drawn at `ConnectedApp.tsx:64-65` | matched |
| GET | `/runs` | same | rail Run `ConnectedApp.tsx:30`, `RunProgress.tsx:88`; drawn at `ConnectedApp.tsx:66` | matched |
| GET | `/run/<run id>` | same (`RUN_PAGE`, `:26`) | `RunActivity.tsx:39`, `ReportLibrary.tsx:393`, `StartRun.tsx:1768`; drawn at `ConnectedApp.tsx:62` | matched |
| GET | `/report/<folder>` (fragment `#evidence/<token>`) | same (`REPORT_PAGE`, `:28,41-45`) | `publishedReport.ts:291,621,624`, `RunProgress.tsx:113`; drawn via `reportFolder` `ConnectedApp.tsx:37-40` | matched |
| GET | `/connected-assets/*` | `react_frontend/__init__.py:32,229-235,362-369` | `web/dist/connected.html` script and stylesheet | matched |
| GET | `/fonts/*` | same | `url(../fonts/…)` in `web/dist/connected-assets/style-*.css` | matched |
| GET | `/symbol.svg` | `react_frontend/__init__.py:31,230-231` | `ConnectedApp.tsx:69` (`symbol="/symbol.svg"`) | matched |
| GET | `/data.js` | `react_frontend/__init__.py:31` | none: `connected.html` has no `data.js` script (it is the static app's file) | **served but never called** |
| GET | `/assets/*` | `react_frontend/__init__.py:32` | none: the static app's bundle; no served page loads it | **served but never called** |
| GET | `/THIRD-PARTY-NOTICES.md` | `react_frontend/__init__.py:31` | none | **served but never called** (licence file) |
| GET | `/` (legacy start form) | `service.py:241-253` | none | unreachable here: `react_frontend` answers `/` first (`__init__.py:240,348`) |

## Summary

- **Called but not served: none.** Every client fetch and every link the connected pages build has a
  server route, and every one answered with its own route's reply in the probe.
- **Served but never called by the connected client:** `GET /connected/reports`, `GET /api/runs/<id>`,
  `GET /activity.js`, `GET /index.html` (page, no link), `GET /library/index.html` (legacy page, no link),
  and the static files `/data.js`, `/assets/*`, `/THIRD-PARTY-NOTICES.md`. The legacy `/` start form in
  `service.py:241-253` is shadowed. This is a list, not a dead-code ruling (stage 6 decides).
- Pattern edge seen in reading, not exercised: `getLatestIssuerRun` sends `issuerSlug(name)`
  (`api.ts:259-268`); a name with no ASCII letter or digit gives an empty slug, and `/api/issuers/` does
  not match `[a-z0-9-]{1,40}` (`service.py:151`), so the reply is the generic 404 "not found". Unusual
  input; recorded only.
- `POST …/summary` answers 200 with an `{"error": …}` body when the answers are refused
  (probe: unknown submission, `{}` body); `request` in `api.ts:173-193` treats any `error` field as a
  failure, so the client and server agree.

Not verified: no synthetic run was completed, so every per-run route was probed only with an unknown id
(404 from the route itself), not with real data; `POST …/submit` was not sent (R4); `react_frontend`
in live mode and `react_frontend.preview` were not started (their routes are read from the code; they
share the handler); HEAD and other methods were not probed; links drawn only from data
(`/connected/sources/…`, `/connected/artifacts/…/<file>`, `/library/downloads/…`) were not followed.
The run root had to be `/tmp/claude-0/s0-apimap` instead of the assigned scratchpad folder, because the
scheduler refuses a root longer than 80 characters (`src/deploy_workflow/inbox/layout.py:61`) and the
assigned path is 102; a symlink did not help (the path is resolved). The service was stopped after the
probe.
