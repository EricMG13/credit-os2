# Stage 0: offline check

Commit `960f35641edde8bb9cf79bfb9c6c7308fe430c05`. Ruling R8: at run time the interface may load only
from `file:` or loopback.

## 1. Requests attempted in the browser

Probe: `node docs/audit/2026-11-16-final/output/0-baseline/probes/offline.mjs <origin> <probe-out-dir> <workspace-root> <out.json>`
(helpers in `probes/lib.mjs`). Chromium 153 (Chrome for Testing) with a context route that aborts
every request whose host is not `127.0.0.1`, `localhost` or `[::1]` and logs it, a WebSocket route
that does the same, and a `securitypolicyviolation` listener plus console capture that log any
request the page's own Content-Security-Policy refused before it reached the network.

BROWSER_RESULT

The same blocking and logging were on during the whole clickable inventory (`connected.mjs`,
`static.mjs`), which also opened every disclosure, drawer and dialog it listed:
INVENTORY_RESULT

**Result: no request to any host but the local machine was attempted, on any screen of either
surface, in any state reached, including the native issuer library page.**

## 2. Other-host addresses in the built files and the page-serving Python

Probe: `python3 docs/audit/2026-11-16-final/output/0-baseline/probes/offline_grep.py [out.json]`
(after `npm --prefix web run build`). It scanned 95 files: `web/dist/` (both surfaces as built and
shipped), `apps/issuer-library/credit_os/web/` (the native library page the service also serves),
`react_frontend/`, `proof/serve.py`, `src/deploy_workflow/run_start/`,
`src/deploy_workflow/http_base.py` and `apps/issuer-library/update_library.py`, for `http://`,
`https://`, `ws(s)://`, protocol-relative `//host`, `@import`, `url(`, `<link>`, `<script src>`,
`fetch(`, `WebSocket`, `EventSource`, `sendBeacon`, `importScripts` and `XMLHttpRequest`.
143 hits. Every `<link>`, `<script src>`, `url()` and `fetch(` is relative or same-origin; no
`@import`, WebSocket, EventSource, `sendBeacon`, `importScripts` or `XMLHttpRequest` occurs.

| Address (host) | Where | What would load it | Verdict |
| :--- | :--- | :--- | :--- |
| `http://www.w3.org/2000/svg`, `/1999/xlink`, `/1999/xhtml`, `/1998/Math/MathML`, `/XML/1998/namespace` (73 hits) | React DOM in `web/dist/assets/index-*.js`, `connected-assets/connected-*.js`, `ReportLibrary-*.js`; `web/dist/symbol.svg`; every SVG icon and `brand.css`/`screen.css` data URIs of the native library | Nothing: XML namespace identifiers passed to `createElementNS`/`xmlns` | harmless (namespace) |
| `https://react.dev/errors/<code>` | `assets/index-*.js` offsets 14558, 18738; `connected-assets/connected-*.js` offsets 16098, 20309 | Nothing: text of a minified React error message | harmless (message text) |
| `https://redux.js.org/Errors?code=…`, `https://redux-toolkit.js.org/Errors?code=…`, `https://bit.ly/3cXEKWf` (Immer) | `assets/index-*.js` offsets 678519, 702904, 681565; `connected-assets/ReportLibrary-*.js` offsets 157574, 181858, 160613 (bundled with Recharts) | Nothing: text of minified error messages | harmless (message text) |
| `https://tailwindcss.com` | licence comment at the top of `assets/style-*.css` and `connected-assets/style-*.css` | Nothing: a CSS comment | harmless (licence) |
| `https://github.com/untitleduico/react`, `https://github.com/markmead/hyperui` | `web/dist/THIRD-PARTY-NOTICES.md` lines 7, 74 | Nothing: a Markdown notice served as a file, not linked from any page | harmless (licence) |
| `https://github.com/vercel/geist-font`, `https://github.com/schibsted/schibsted-grotesk`, `https://openfontlicense.org`, `https://scripts.sil.org/OFL`, `https://github.com/RedHatOfficial/RedHatFont` | `web/dist/fonts/OFL-*.txt`, `apps/issuer-library/credit_os/web/fonts/OFL.txt` | Nothing: font licence texts | harmless (licence) |
| `//i.test` | `assets/index-*.js` offset 1380029 | Nothing: a false match inside the regular expression `/^https?:\/\//i.test(e)` | not an address |
| `http://127.0.0.1:{port}/` | `react_frontend/__init__.py:427`, `react_frontend/preview.py:53` | Printed to the console for the user to open | loopback |
| `http://{host}:{port}/` | `src/deploy_workflow/run_start/service.py:391` (`signal_link`), `:469` (startup message) | `signal_link` normalises the operator's `--signal-url` (any host the operator names; Signal is out of scope) into a `credit-os-signal-url` meta tag on the connected page, which no file in `web/src` reads, and into the legacy form's rail link; the second is a printed startup line | conditional; not loaded by either surface |
| `http://{Host header}` | `src/deploy_workflow/http_base.py:245`, `:247` | The Origin check compares a request's `Origin` with the request's own `Host`; nothing is fetched | not an address |

**Result: no address of another host in the built files or the serving Python would be loaded by
either surface.** The only operator-supplied other-host address is `--signal-url`, which is off by
default and is not read by the React code.
