# Stage 0: offline check (ruling R8)

Main under audit: `2b881075`. Every request whose host is not `127.0.0.1`, `localhost` or `[::1]` (or `file:` for the static app) was aborted in Playwright and logged.

## Result

- **Browser, connected surface (36 addresses, proof.serve):** 0 requests aborted, no WebSocket opened. The served page's Content-Security-Policy allows only `'self'`.
- **Browser, static surface (402 visits, shipped and fixture data):** 0 requests aborted, 0 console or page errors. `index.html` declares a CSP with `connect-src 'none'`.
- **Built files:** no address of another host that anything loads. Every other-host string found is a namespace, licence text or library error-message link (react.dev, redux, bit.ly from Immer, w3.org, Tailwind licence, OFL texts).
- **Serving Python, listed for stage 2 (not judged here):** a Teams webhook POST in `src/deploy_workflow/inbox/teams.py`, sent by the scheduler `react_frontend` starts, only when `CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK` are set (proof.serve does not clear them); `--signal-url` writes any host into a page meta tag that no connected code reads.
- **Not page traffic:** while the probes ran, the egress proxy refused Chromium's own background connections (android.clients.google.com, www.google.com, redirector.gvt1.com). These came from the browser binary, not from any page; the work PC's Edge/Chrome will have its own policy.

## Connected surface (detail)

### Blocked requests (browser, every host but 127.0.0.1, localhost, [::1] aborted)

| URL | Initiating page |
| :--- | :--- |
| none | Every connected screen above, both states of each run; 0 requests aborted, 0 WebSockets opened |

The only failed loads in the console were loopback 404s for unknown ids (`/run/20000101-000000-01`,
`/report/no-such-run`, `/report/a%2Fb`, `/report/<failed run>`), each twice.

Outside the page: while the probes ran, the session's egress proxy reported refused connections to
`android.clients.google.com`, `www.google.com` and `redirector.gvt1.com`. These are Chromium's own background
services, not page requests (Playwright routing saw none); a static-surface crawl was running Chromium at the same
time, so they are not attributable to this probe.

### Other-host addresses in `web/dist/connected.html`, `web/dist/connected-assets/` and the serving Python

| Address | Where | What would load it | Verdict |
| :--- | :--- | :--- | :--- |
| `http://www.w3.org/1999/xhtml`, `/2000/svg`, `/1999/xlink`, `/1998/Math/MathML`, `/XML/1998/namespace` | `connected-HE3EWwW5.js` (React DOM), `ReportLibrary-C-BWlvla.js` (chart lib `xmlns`) | Nothing; XML namespace strings | Harmless |
| `https://react.dev/errors/<code>` | `connected-HE3EWwW5.js` | Nothing; text of a minified React error message | Harmless |
| `https://redux.js.org/Errors?code=`, `https://redux-toolkit.js.org/Errors?code=` | `ReportLibrary-C-BWlvla.js` | Nothing; error message text (bundled by the chart library) | Harmless |
| `https://bit.ly/3cXEKWf` | `ReportLibrary-C-BWlvla.js` | Nothing; Immer error message text | Harmless |
| `https://tailwindcss.com` | `style-BlfeiIiV.css` | Nothing; licence comment `/*! tailwindcss v4.3.3 \| MIT License \| ... */` | Harmless |
| `url(../fonts/*.woff2)` (7) | `style-BlfeiIiV.css` | The browser, same origin `/fonts/` | Local |
| `url(#clipPath-...)` etc. | `ReportLibrary-C-BWlvla.js` | SVG fragment references | Local |
| `fetch(G.href, ...)` | `connected-HE3EWwW5.js` | Vite modulepreload polyfill; hrefs are the page's own `/connected-assets/` | Local |
| `fetch("/connected/...")`, `/api/...` | `api.ts` bundle, `HeadlineFigures`, `ReportLibrary`, `shapes` | Same origin | Local |
| `<script src="./connected-assets/...">`, `<link href="./connected-assets/...">` | `connected.html` | Same origin; the service rewrites `./` to `/` | Local |
| Protocol-relative `//host`, `@import`, `new WebSocket`, `EventSource`, `sendBeacon` | connected build | none found | n/a |
| CSP | `connected.html` | Built with `connect-src 'none'`; `react_frontend/__init__.py:_read_page` serves it with `connect-src 'self'`, `default-src 'none'`, script/style/img/font `'self'` | Local only |
| `http://127.0.0.1:{port}` | `react_frontend/__init__.py:430`, `react_frontend/preview.py:53` | Printed startup address | Loopback |
| `http://{host}:{port}/` | `src/deploy_workflow/run_start/service.py:402` (`signal_link`) | `--signal-url` of `python -m react_frontend` only; written into `<meta name="credit-os-signal-url">`. Accepts any hostname, not only loopback. No code under `web/src` outside Signal reads that meta (grep). Signal link: exists only as this meta; not visited | Not loaded by the connected app |
| `http://{found[0]}` | `src/deploy_workflow/http_base.py:245-247` | Origin check string built from the request Host header | Not a fetch |
| `CREDIT_OS_TEAMS_WEBHOOK` (an `https://` Teams Workflows address from the environment), `urllib.request` POST | `src/deploy_workflow/inbox/teams.py:45,182-197`, used by the scheduler (`scheduler.py:450`) that `react_frontend/__init__.py:401` starts with `teams.config_from_environment(...)` | The Python service, server side, at run time, only when both `CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK` are set; off otherwise (also under proof.serve, which does not clear them) | Server-side outbound POST when configured (listed, not judged) |
| `http://10.0.0.5:8765` | `teams.py:9` docstring | Nothing; example | Harmless |
| `https://adaptivecards.io/schemas/adaptive-card.json` | `teams.py:409` | Nothing; `$schema` value inside the posted card | Harmless |
| Canned handoffs `proof/handoffs/`, `proof/*.txt` | data | No `http(s)://` addresses | n/a |


## Static surface (detail)

### In the browser

Every request in the Playwright context was routed: a request was allowed only if its scheme was `file:` or its host was 127.0.0.1, localhost or [::1] (`data:` and `blob:` were also allowed and counted, as they leave nothing; none were seen). Anything else was aborted and logged.

- Blocked requests: **0**, across all 402 visits (both data variants), every opened control (1,199 opener clicks over the four passes) and the Show sources shots. Logged in `static-blocked.json` (empty list).
- `data:`/`blob:` requests: 0. Console errors and page errors: 0 in every pass (`static-run-*/static-console-*.json`).
- The page itself declares a Content-Security-Policy (`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; ...`), which would also refuse other-host loads.

### In the built files (`offline-grep.sh`, output in `static-offline-grep.txt`)

Searched web/dist/index.html, data.js, symbol.svg, assets/*.css, assets/*.js, fonts/ (woff2 and OFL texts), THIRD-PARTY-NOTICES.md for http://, https://, //host, ws(s)://, @import, url(, <link>, <script src>, fetch(, XMLHttpRequest, WebSocket, EventSource, sendBeacon, importScripts, Worker, serviceWorker, and run-time scheme strings.

Loaders: index.html loads only `./assets/index-CLQd3tzT.js` (script defer), `./assets/style-CZvAa0DA.css` (link) and `./data.js` (script), all relative. The CSS `url()`s are the seven `../fonts/*.woff2` files; no `@import`. The bundle contains no fetch(, XMLHttpRequest, WebSocket, EventSource, sendBeacon, importScripts, Worker or serviceWorker; its `url(#…)` are SVG clip-path fragment references. No `"http:"`/`"ws:"` scheme strings built at run time. The woff2 files contain no http(s) strings.

Other-host addresses found, all harmless (nothing fetches them):

| File | Address | What would load it |
| :--- | :--- | :--- |
| symbol.svg | http://www.w3.org/2000/svg | Nothing: SVG xmlns namespace |
| assets/index-*.js | http://www.w3.org/2000/svg, /1999/xlink, /1999/xhtml, /1998/Math/MathML, /XML/1998/namespace | Nothing: namespace strings (React DOM createElementNS/setAttributeNS; Recharts tooltip xmlns) |
| assets/index-*.js | https://react.dev/errors/ (2) | Nothing: text of React's minified error message |
| assets/index-*.js | https://redux.js.org/Errors?code=${e}, https://redux-toolkit.js.org/Errors?code=${e} | Nothing: text of Redux / Redux Toolkit minified error messages (Recharts dependency) |
| assets/index-*.js | https://bit.ly/3cXEKWf | Nothing: text of Immer's minified error message |
| assets/index-*.js | `//i.test(e` | Not an address: end of a regular expression literal |
| assets/style-*.css | https://tailwindcss.com | Nothing: licence comment `/*! tailwindcss v4.3.3 \| MIT License \| https://tailwindcss.com */` |
| fonts/OFL-*.txt | https://github.com/vercel/geist-font, https://github.com/schibsted/schibsted-grotesk, https://openfontlicense.org, https://scripts.sil.org/OFL | Nothing: licence text files, not referenced by any page |
| THIRD-PARTY-NOTICES.md | https://github.com/untitleduico/react, https://github.com/markmead/hyperui | Nothing: notices file, not referenced by any page |

Not searched here (other worker's surface): web/dist/connected.html and web/dist/connected-assets/. Signal fixture addresses (https://example.com/…) exist only in web/fixtures/signal.json and in the scratch fixture data.js built from it; the shipped data.js has none.


Not verified: Chrome and Edge (only Playwright's Chromium headless shell build 1243); the regular `python -m react_frontend` mode and a live run (R4); the Teams path with its variables set; the release ZIP's contents (checked in stage 7); controls inside 31 connected disclosures that timed out and second-level dialogs.
