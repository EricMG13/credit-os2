# Plan: sign-in and accounts, slices 1 to 6

Spec: `docs/superpowers/specs/2026-11-26-sign-in-and-accounts.md`. Network listening and HTTPS (the spec's last
slice) and the landing page are not in this plan. The plan was critiqued by `mx-advisor` on
2026-11-26; the coordinator's rulings on its findings are folded in below.

## How it runs

- One session per slice, each on its own branch, ending in its own draft PR into `main`. A slice
  starts only after the slice before it is merged, because each builds on the last. The owner
  merges. The slices share files and need each other's results, so they are not CLAUDE.md
  sub-sessions of one coordinator: each session is a fresh coordinator and writes its own
  VERIFICATION.md entry and any ruling text itself.
- The session is the coordinator (CLAUDE.md): it writes each task's brief, dispatches `mx-*`
  agents, and writes no code. Briefs go in `.superpowers/sdd/sign-in/` (not committed).
- Agents: `mx-feature` implements; `mx-precise` reviews each task for spec compliance, then code
  quality; `mx-adversary` reviews every slice before its PR, since all of this is security or
  money code; `mx-invariants` reviews the tasks marked **order** below; `mx-architect` does the
  pre-merge review of the PR diff.
- Every task is test-first. The answer key for a task is the list of expected values in its brief,
  written by the coordinator by hand from the spec; the implementer does not edit it.
- Every brief and every reviewer prompt states: no stub or fake value standing in for real behaviour; no catch-all hiding a
  failure unless documented and logged; the answer key; and that the report ends `Not verified:`.
- No request to Microsoft, no model call, no live fetch, by the build or its tests.
- Finish each slice as CLAUDE.md sets out: quality gate, confidence-review, rewrite-tournament,
  the refactoring sweep where the skill exists, the pre-merge review, then tell the owner to
  type `/ship`. VERIFICATION.md stays under 1,000 lines.
- A slice that changes a page (3, 5 and 6) owes a fidelity check recorded in VERIFICATION.md with
  its scope (AGENTS.md), and passes the web lint, typecheck, unused-code, duplication, test and
  build steps.

## Reuse search (CLAUDE.md), 2026-11-26

Searched before planning anything new. Queries carried no issuer or business detail.

| Where | Queries | Found | Decision |
|---|---|---|---|
| This repository | `sqlite`, `login`, `password`, `cookie`, `scrypt`, `msal`; read `signal/store.py`, `signal/identity.py`, `http_base.py`, `react_frontend/signal_host.py` | A store pattern (WAL, numbered migrations, a made-here guard), hardened request checks, an identity seam, the hosting pattern | **Reuse**: the account store follows `signal.store`; the check sits on `http_base`'s request path; Signal's `current_user` seam is the one thing replaced |
| The owner's other repositories | code search for `msal`, `scrypt`, `PublicClientApplication`, `login session cookie` | No sign-in, session or password code; three test files in another repository that only mention the words | **Nothing to reuse** |
| Public GitHub | repository search for a Python `msal` authorization-code example and for a mock OpenID Connect provider | Microsoft's `msal` itself; several MIT-licensed mock providers, among them `geigerzaehler/oidc-provider-mock` and `nazriel/ms-oidc-mock` (described as imitating Entra) | **Reuse** `msal` as the pinned dependency. **Build** the stand-in provider in the tests: each test must control every reply, including hostile ones, and no second dependency is wanted. Slice 3's implementer reads those two projects first for the endpoint shapes Entra clients expect, as reference only; if any code is copied the licence notice goes with it |

Not verified: the two mock projects were found by description only; their code and language were
not read. No public project was found that pairs `msal` with a plain `http.server`.

## Shared ground rules

- New package `src/deploy_workflow/accounts/`. Add `accounts` to the services layer of
  `.importlinter` (`run_start : inbox : signal : reference_fetch`), since `signal` will import it.
- New tests are named `tests/test_accounts_*.py` and `tests/test_auth_*.py`. Add each pattern to
  the fast-tests list in `.github/workflows/checks.yml` in the slice that first creates a file it
  matches, not before.
- **Where the store is.** Not under `--root`: that is the shared folder, and anyone who can
  write there could add a session row or make themselves Admin; WAL also does not work on a
  network share. The store's folder comes from `CREDIT_OS_ACCOUNTS_DIR` in the launching
  environment (and `--accounts-dir` on the accounts command line), a folder on the machine's own
  disk that only the account running the application can write. With sign-in on and no folder
  set, the application refuses to start. This is the coordinator's ruling on the advisor's
  finding, and it keeps the passcode ruling's "on the managed machine".
- The store follows `deploy_workflow.signal.store`: `open_db(folder)` creates
  `<folder>/accounts.db`, WAL, foreign keys on, numbered migrations, a guard that refuses a
  store this build's migrations did not make, one connection per request.
- Times are UTC and injected: every function that reads the clock takes it as a parameter.
- Nothing secret is logged. Each slice has a test that captures the log across its hostile cases
  and asserts no passcode, session token or Entra token appears.

## Slice 1: account store, passcodes, lockout

No route uses it. Files: `accounts/__init__.py`, `store.py`, `passcodes.py`, `cli.py`,
`__main__.py`; `.importlinter`; `checks.yml`; tests.

1. **Store and migrations.** Tables of spec 5.1 (`passcodes` holds `analyst` and `admin` only).
   Unique on (tenant id, object id) and on display name. An account also keeps Entra's given
   name and family name, for slice 6.
2. **Accounts.** Create a Reader for an Entra identity; read by identity and by id; disable;
   change profile type. Display name made unique per spec 5.5: the Entra name, or the name with
   the email's local part in brackets when taken. **order**: two creations racing for one identity
   yield one account, proved with two connections.
3. **Passcodes.** `hashlib.scrypt` with a random 16-byte salt per passcode; `hmac.compare_digest`;
   at least 12 characters; the two passcodes must differ (checked by verifying the new one against
   the other type's hash); setting replaces.
4. **Lockout.** Five wrong passcodes for one identity within an hour refuse the sixth for an hour
   from the fifth; a correct passcode clears the count; counted in the store. **order**: the count
   and the check are one transaction.
5. **Command line.** `python -m deploy_workflow.accounts --accounts-dir <folder> passcode set
   {analyst,admin}` reads the passcode twice with `getpass`, never from an argument, environment
   or standard-input pipe; `accounts list`; `accounts disable <id>`; `accounts type <id> <type>`.

Answer key, slice 1: a 11-character passcode is refused and a 12-character one accepted; the
stored row holds no substring of the passcode; a passcode one character off fails; attempts 1 to 5
wrong are each answered "wrong passcode", attempt 6 is "locked" even when correct, and one second
past the hour a correct one succeeds; "A. Kovac" taken, `a.kovac2@example.org` registers as
"A. Kovac (a.kovac2)".

## Slice 2: sessions and the one check

Files: `accounts/sessions.py`; `react_frontend/auth_gate.py`; `react_frontend/__init__.py`; tests.

1. **Sessions.** Mint a 256-bit token (`secrets.token_urlsafe(32)`), store its SHA-256, 12 hours
   from sign-in; look up; delete on sign-out; a disabled account's session fails at lookup.
2. **The check.** In the application server's request path after `check_origin` and before any
   route: with sign-in on, a request without a valid session gets 401 (API, download, `/data.js`)
   or a 303 to `/sign-in` (a page navigation). Allowlist: `/sign-in`, the `/auth/` routes, and the
   static files the sign-in page needs, named one by one. `/signal/api/` is covered by the same
   check. This slice adds one route, `GET /auth/me`.
3. **The switch.** `make_server(..., sign_in=False)` by default in this slice; never on in the
   read-only preview or synthetic mode (a `ValueError` if asked). The page gets
   `<meta name="credit-os-sign-in" content="on">` when on.
4. **Deny by default, proved structurally.** The application has no route table to walk: its
   routes are if-chains in `_get`, `_post` and `_delete`. So the test proves that with sign-in on
   and no session, none of `_get`, `_post`, `_delete` or `signal_host.divert` is entered for any
   path outside the allowlist: every known path, a few hundred generated ones, every method. It
   also walks Signal's `_ROUTES`. Sessions for tests are minted through `accounts.sessions`.

Answer key, slice 2: a token is 43 characters; the stored value is 64 hex characters and is not
the token; a session at 11 h 59 min 59 s is valid and at 12 h 0 min 1 s is not; with sign-in on and
no session `GET /connected/reports` and `GET /data.js` are 401, `GET /` is 303 to `/sign-in`,
`GET /auth/me` is 200 `{"account": null}`; with sign-in off every existing path answers as on
`main` today and `/auth/me` and `/sign-in` are 404.

## Slice 3: Entra sign-in and registration

Files: `pyproject.toml`, `uv.lock` (`msal`, pinned); `accounts/entra.py`;
`react_frontend/auth_routes.py`; a plain sign-in page in `web/`; `tests/auth_provider.py` (the
stand-in identity provider); tests; README.

0. **First, settle two things by test**, before any other task. (a) `msal` completes the flow
   against a stand-in provider on loopback and opens no connection to any other host: the test
   fails on any non-loopback connect. If `msal` insists on an `https` authority or on Microsoft's
   instance discovery, use its own options or an injected HTTP client; if neither works, stop
   and report. (b) Spec 5.3: hand `msal` an identity token whose signature bytes are altered but
   whose claims are valid, and record in the PR and VERIFICATION.md whether it is refused.
   Either result of (b) is acceptable; an unrecorded one is not.
1. **Configuration.** `CREDIT_OS_ENTRA_TENANT` and `CREDIT_OS_ENTRA_CLIENT` from the launching
   environment. Sign-in turns on in live mode when both are set; with one set the application
   refuses to start; with neither it starts as today and prints one line saying sign-in is off.
2. **The flow.** `GET /sign-in` is the page; `GET /auth/start` redirects to Entra;
   `GET /auth/callback` (the reply arrives in the query string: a form post would fail the
   `Origin` check); `POST /auth/passcode`; `POST /auth/sign-out`; `GET /auth/me`. A request that
   arrives on `127.0.0.1` is first redirected to the same path on `localhost`, the redirect
   address's host, so the flow cookie is not lost. The callback never adopts a session cookie
   the browser presents: it always mints a new one. **order**: pending flows are a dictionary
   shared across the server's threads, at most 100, ten minutes each, one use; two callbacks
   racing with one code yield one session.
3. **Registration.** A first sign-in creates a Reader. `/auth/passcode` raises the profile type,
   under the lockout of slice 1. Only the tenant configured may sign in.
4. **The stand-in provider.** A local HTTP server in the tests that plays Entra's discovery,
   authorise and token endpoints. It refuses by default; each test states what it will issue.
5. **The sign-in page.** One screen: the product name, "Sign in with your work account", and the
   plain-language reason when sign-in fails. `DESIGN.md` tokens; no new component library.

Answer key, slice 3: `POST /auth/passcode` without a session is 401 and counts no attempt; the
stand-in's signing key is made in the test process (the repository refuses `.pem` and `.key`
files); a callback with a wrong `state` is 400 and creates nothing; a replayed
callback is 400; a token for another tenant, another audience or a wrong nonce is refused with
"this account cannot sign in here" and no account row; a first sign-in yields profile type
`reader`; the Admin passcode then yields `admin`; no row of any table and no captured log line
holds an access, refresh or identity token.

## Slice 4: Signal's identity is the account; typed-name rows removed

Files: `signal/identity.py`, `signal/service.py`, `signal/routing.py`, `signal/store.py`,
`signal/cli.py`; `react_frontend/signal_host.py`; tests. No page changes.

1. **Identity.** `current_user` returns `User(name, role)` from the signed-in account: `reader`,
   `analyst` as Signal's `writer`, `admin` as Signal's `owner`. `POST /api/me`, the `signal_name`
   cookie, the `users` table's use and `signal users add` are removed. Existing refusal texts on
   existing routes ("only a writer can ...") do not change.
2. **Removal of typed-name rows.** **order**. Signal's migrations are SQL run inside one write
   transaction, opened by every request and every loop job, so the copy cannot be a migration
   line. In the upgrade step, under the write lock and after re-reading the version, and only for
   a store that existed at the previous version: make the copy with `sqlite3.Connection.backup()`
   to `signal.db.before-accounts`, created exclusively (an existing copy is never overwritten),
   open the copy and check its row counts, then delete and mark the version in that same
   transaction. A new store gets no copy.
3. **What is removed and what stays.** The coordinator writes the exact key from the schema, in
   delete order, on these rulings:
   - emptied: `saves`, `topic_follows`, `issuer_follows`, `read_marks`, `reactions`, `comments`,
     `threads`, `thread_rules`, `group_topics`, `group_members`, `groups` (a group with no members
     is no use), `notification_settings`, the digest tables children first (`digest_runs`,
     `digest_points`, `digest_issue_ai`, `digest_issues`, `digest_topics`, `digest_groups`,
     `digest_issuers`, then `digests`), `users`, and proposed sources of the news kinds only;
   - kept, row counts unchanged: `stories` and their duplicates, approved and paused `sources`,
     every filing and market source whatever its state (issuers point at them), `topics`,
     `issuers`, `story_ai`, `ai_usage` (the money ledger is never edited), settings and logos of
     retained sources. When this upgrade removes a proposed source of a news kind, its logo row
     is removed as the owner approved. That row remains in the verified pre-upgrade copy;
   - a kept row that names its typed creator (`topics.created_by`, `issuers.created_by`,
     `sources.proposed_by`) has that name replaced by the fixed text `before accounts`.

Answer key, slice 4: the lists above with a seeded store's exact before and after counts; a
store upgraded twice has one copy, made the first time; a crash injected between copy and delete
leaves the rows and the copy, and the next open completes; with sign-in off Signal answers 401
"sign in first" on every route that needed a name.

## Slice 5: the Admin's powers in the browser

Files: the Signal `api_*` modules that gain Admin routes; `accounts` routes in
`react_frontend/auth_routes.py`; `web/src/pages/signal/` (name dialog removed, Admin controls
enabled); tests.

1. **Routes**, each requiring `admin`: approve and pause a source; remove a thread, a comment or a
   group; disable an account; change a profile type. Each existing command-line action stays.
2. **Not in the browser:** the AI cap. The AI-pass ruling says the owner sets it on the command
   line, and this plan changes nothing about what may spend.
3. **Web.** The name dialog and its tests go; Settings shows the Sources and accounts sections as
   working controls for an Admin and read-only for others; "AI and cost" stays read-only.

Answer key, slice 5: a Reader's and an Analyst's call to each new Admin route is 403 "only an
Admin can do this"; an Admin's succeeds and the store shows it; no route sets the AI cap; an
Admin cannot disable or lower their own account when they are the only Admin.

## Slice 6: Submit by profile type

Files: `deploy_workflow/run_start/service.py`, `submissions.py`; `deploy_workflow/inbox/`
`scheduler.py`, `runs.py`, `teams.py`; `react_frontend/__init__.py`, `run_activity.py`;
`web/src/pages/connected/StartRun.tsx`; tests.

1. Preparing and submitting a run needs `analyst` or `admin`; a Reader gets 403 and sees the
   run-start page without Submit.
2. **The analyst name.** Today it is typed, and must be a first name and one or two initials
   ("Eric G"); run records and Teams cards carry it. With sign-in on it is derived from the
   account's given and family names kept in slice 1 ("Eric Green" gives "Eric G") and the typed
   field is removed. Where it cannot be derived under the existing rule, Submit is refused with
   "an Admin must set your analyst name", and an Admin sets it (one more Admin route and command).
   The submission record also carries the account id.
3. With sign-in off (no Entra variables), run start behaves exactly as on `main` today.

Answer key, slice 6: a Reader's `POST` to the submit route is 403 and writes no submission file; an
Analyst "Eric Green" is recorded as "Eric G" with their account id; given name "Jean-Luc", family
name "de la Tour" and an account with no family name are each refused until an Admin sets the
name; the cap figures (Lite 20, Full 30, Deep 50, purpose pathways 20) are unchanged; with sign-in
off the existing run-start tests pass unedited.

## Stop and report instead of deciding

- A test that can only pass by weakening an assertion, skipping, or computing its expectation.
- Anything that would call Microsoft, a model, or a live feed.
- `msal` needing a client secret, or a browser-side step, for the flow in spec 5.3.
- A route the enumeration test finds that cannot sensibly require a session.
- Any change that would alter what a run spends or when Signal's AI pass may run.
- A store folder that turns out to be on a network share.

## Known and left alone

- `signal.db` stays under `--root`, the shared folder, as today. It holds no credential, but
  anyone who can write the share can edit the feed's content. Moving it is separate work.
- `python -m deploy_workflow.run_start.service --host` would still serve Submit with no sign-in.
  It has no entry point in the package today; slice 7 (network) must remove or gate it.
- Existing tests that build a server read the real environment by default; each slice passes an
  explicit environment so a developer's own Entra variables cannot switch sign-in on in a test.
