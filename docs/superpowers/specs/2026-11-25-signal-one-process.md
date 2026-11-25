# Signal runs inside the one application process

Status: owner decision, 2026-11-25. Asked what "one app" means for Signal, the library and run
start, the owner chose: "One process. One start command and one port. The main app hosts Signal's
feed, groups and background fetch itself; the forwarder built in PR 83 and the separate 'Start
signal' entry are removed." The owner also chose that the work is pushed straight onto PR 83's
branch (`claude/lucid-feynman-bvglyi`) and that this is the only change needed before PR 83 merges.

Lines marked **(call)** are the designer's choices, not owner decisions. The owner may overrule
any of them.

## 1. Intent

Today `python -m react_frontend` serves the React application and, when started with
`--signal-url`, forwards `/signal/api/*` over HTTP to a second process started with
`python -m deploy_workflow.signal ... serve`. After this change there is one process: the React
application's server answers `/signal/api/*` itself from Signal's route table and runs Signal's
background loop. The browser sees no difference: the same paths, the same JSON.

## 2. Goals, non-goals, anti-goals

Goals

- One start command, one port, one process for the library, run start and Signal.
- No HTTP hop between the application and Signal; no second listening socket.
- Every Signal API behaviour a reader depends on is unchanged: paths, methods, statuses, JSON
  bodies, the `signal_name` cookie, refusal texts.
- The owner's `signal` command-line actions (users, sources, topics, ai, issuers, logos, filings,
  market, groups, ingest, stories) keep working against the same store while the app runs.

Non-goals (each is on `docs/TODO.md` in ericmg13/credit-os2#86, its own design later)

- Sign-in. Identity stays the typed display name of spec 5.2 in `2026-11-13-signal-design.md`.
- The landing page, profile types and passcodes, the offline stories snapshot.
- Any change to what Signal fetches, stores, shows or spends.

Anti-goals (a failure even if it works)

- A model call that the two-process design would not have made. See 4.4.
- Signal's background loop running in a test, in the read-only preview or in a synthetic proof run.
- A request under `/signal/api/` reaching Signal's handlers without the application server's own
  `Host`, `Origin` and `Sec-Fetch-Site` checks.
- Code kept only so tests can start the old standalone server.

## 3. Constraints

- Python standard library plus the pinned dependencies. No new dependency.
- No model is called by the build or its tests. No live request to a feed, the SEC or FRED.
- The quality gate, targeted tests (`timeout 300`), confidence-review and rewrite-tournament apply.
- Expected values in tests are written by hand, never computed from the code under test.
- VERIFICATION.md stays under 1,000 lines (it is at 990 on this branch): trim the oldest entries.
- Never rewrite history on this branch: new commits only, and merge main in, no rebase.

## 4. Design

### 4.1 Signal's service becomes transport-free

`src/deploy_workflow/signal/service.py` keeps `Loop`, the route handlers and `_ROUTES`, and gains
one public entry **(call)**:

    answer(root, loop, request) -> http_base.Reply

`request` carries exactly what `_dispatch` and `_api` read today: the method, the path with the
`/signal` prefix already removed (so it starts `/api/`), the raw query string, the `Cookie` header
value, and the two body readers (required JSON object, optional JSON object). `answer` does what
`Handler._dispatch` and `Handler._api` do now: match the route table, 405 with `Allow` for a known
path and another method, 404 otherwise, open this request's own database connection, resolve the
user, 401 where a name is needed, call the handler, close the connection.

Removed from the module: `Handler`, `_Server`, `make_server`, `serve`, the connection ceilings and
the socket timeout constants that only the removed server used. The module docstring is rewritten
to say what is true now and to name `react_frontend` as the one caller.

### 4.2 The application hosts Signal

`react_frontend/signal_forward.py` is deleted. A new `react_frontend/signal_host.py` **(call)**
holds what the application needs:

- `SignalHost(root, *, environ)`: owns one `service.Loop`. `environ` is the mapping the AI gate
  reads (4.4).
- `divert(host, handler, url)`: for a path under `/signal/api/`, raise the reply. With no host
  (the read-only preview), 404. With a host: read the body under the same rules as today (a body
  only on POST, `Content-Length` required, at most 64 KiB, a JSON object), call `service.answer`,
  and add to the reply the headers Signal's own server put on every response:
  `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` and
  `X-Frame-Options: DENY`.
- `other_method`: PUT, PATCH, HEAD and OPTIONS under `/signal/api/` stay 405 where Signal is
  hosted, and the `http.server` default 501 elsewhere, as now.
- `PAGE_PATHS` (`/signal`, `/signal/`) stays.

`react_frontend.make_server` and `serve` lose `signal_url`. Signal is hosted in live mode
**(call)**; it is not hosted in the read-only preview (as now) or in synthetic mode (a proof run
must not open a feed store or a background loop). `make_server` builds the host but starts no
thread. `serve` starts the loop thread after the server is bound and stops and joins it on the
way out, beside the scheduler loop it already runs; before the first tick it opens the store once
and runs `ai_run.recover`, and a store that cannot be opened stops start-up with the same message
`signal serve` printed.

The page meta `credit-os-signal-url` is replaced by `<meta name="credit-os-signal" content="on">`
**(call)**, written exactly when Signal is hosted. `web/src/connected-main.tsx` reads the new
name; nothing else in `web/` changes.

### 4.3 What goes away

- `python -m react_frontend --signal-url` and `python -m deploy_workflow.run_start.service
  --signal-url`, with `run_start.service.signal_link` and the `signal_url` parameter of its
  `make_server`.
- The `serve` command of `python -m deploy_workflow.signal`. Every other `signal` command stays.
- `Start signal.cmd` in `apps/issuer-library/packaging/runtime.py`, and its tests.
- The forwarder's tests against a scripted hostile upstream: there is no upstream.

### 4.4 Money: the AI pass must not switch itself on

The AI pass runs only when three things hold: the owner's ruling, a cap set on the store, and the
model adapter's key in the environment of the process that runs the loop. In two processes the
owner chose the third by starting the Signal service with the Copilot variables. In one process
the application's environment already carries those variables for analysis runs, so the third
would hold without anyone choosing it.

Decision **(call)**, to keep the owner's choice explicit: the hosted loop reads the AI gate's
environment from the process environment only when the launching environment also sets
`CREDIT_OS_SIGNAL_AI=1`; otherwise the loop is given an empty mapping, so the gate reports the pass
off for want of a key, exactly as a Signal service started without the variables did. The owner's
`signal ai pass` command is unchanged. The ruling `docs/rulings/2026-11-25-signal-ai-pass.md` is
not edited; README's Signal section states the new switch.

### 4.5 The offline rule

`docs/audit/2026-11-16-final/README.md` ruling R8 says the application works offline and Signal was
out of that audit's scope as a separate service. Hosting moves Signal's fetches of owner-approved
sources into the application's process. Nothing is fetched until the owner approves a source, as
before. This spec records the change; whether R8 needs a recorded exception like the Teams one is
left to the owner and noted under "Not yet verified" in the PR.

### 4.6 Differences accepted

- Signal's server allowed 16 connections per remote address and cut a connection at 120 seconds.
  The application's server has its own ceiling of 64 connections and no per-address limit. The
  application listens on loopback only, so the per-address limit protected nothing it still needs.
- `/api/status` and friends are no longer reachable on a second port.

## 5. Tests

- `tests/test_react_frontend_signal.py` is rewritten for hosting: the name round trip and a save
  reaching the store through the application's port; 404 under `/signal/api/` in the read-only
  preview and in synthetic mode; 405 for PUT, PATCH, HEAD and OPTIONS; the body rules; the two
  response headers; `Origin` required on a write; and that answering a request opens no outbound
  connection.
- The Signal tests that started `signal_service.make_server` (about a dozen call sites in
  `tests/test_signal_*.py`) move to one shared helper that calls `service.answer` directly or
  starts the application. Their assertions do not change.
- New: `make_server` starts no Signal thread; `serve` starts and stops it; the loop gets an empty
  environment without `CREDIT_OS_SIGNAL_AI=1` and the process environment with it; the meta is
  written only when hosted.
- Removed with their subjects: forwarder upstream tests, `signal serve` CLI tests, `--signal-url`
  tests in `tests/test_run_start_service.py` and `tests/test_react_frontend.py`, `Start signal.cmd`
  packaging tests.

## 6. Documents

README (Signal section and the start command), `apps/issuer-library/README.md`,
`docs/superpowers/specs/2026-11-13-signal-design.md` section 5.1 (a dated note that this spec
replaces "a separate service"), `docs/design/component-map.md` and `screen-map.md` where they name
the Signal address, `.github/workflows/checks.yml` if a removed test file is listed, and one
VERIFICATION.md entry with its actual scope.

## 7. Done means

- `rg "signal_forward|signal-url|signal_url|signal_link|Start signal|credit-os-signal-url"` finds
  nothing outside `docs/work-pc/syncs`, `docs/audit`, VERIFICATION.md history and this spec.
- The quality gate, `lint-imports`, strict mypy, the Signal tests, the server, run-start and
  packaging tests, and the web lint, typecheck, tests and build all pass.
- Main is merged into the branch, the VERIFICATION.md conflict is resolved keeping both sides'
  entries, and the three CI checks pass on the pushed head.
- PR 83's description says one process, lists what was removed, and states what is not verified.
