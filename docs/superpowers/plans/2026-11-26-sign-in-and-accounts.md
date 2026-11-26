# Plan: sign-in and accounts, slices 1 to 5

Spec: `docs/superpowers/specs/2026-11-26-sign-in-and-accounts.md`. Slice 6 (network listening and
HTTPS) and the landing page are not in this plan.

## How it runs

- One session per slice, each on its own branch, ending in its own draft PR into `main`. A slice
  starts only after the slice before it is merged, because each builds on the last. The owner
  merges.
- The session is the coordinator (CLAUDE.md): it writes each task's brief, dispatches `mx-*`
  agents, and writes no code. Briefs go in `.superpowers/sdd/sign-in/` (not committed).
- Agents: `mx-feature` implements; `mx-precise` reviews each task for spec compliance, then code
  quality; `mx-adversary` reviews every slice before its PR, since all of this is security or
  money code; `mx-invariants` reviews the tasks marked **order** below; `mx-architect` does the
  pre-merge review of the PR diff.
- Every task is test-first. The answer key for a task is the list of expected values in its brief,
  written by the coordinator by hand from the spec; the implementer does not edit it.
- Every brief states: no stub or fake value standing in for real behaviour; no catch-all hiding a
  failure unless documented and logged; the answer key; and that the report ends `Not verified:`.
- No request to Microsoft, no model call, no live fetch, by the build or its tests.
- Finish each slice as CLAUDE.md sets out: quality gate, confidence-review, rewrite-tournament,
  the refactoring sweep where the skill exists, the pre-merge review, then tell the owner to
  type `/ship`. The coordinator returns the VERIFICATION.md lines in the PR; the file stays under
  1,000 lines.

## Shared ground rules

- New package `src/deploy_workflow/accounts/`. Add `accounts` to the services layer of
  `.importlinter` (`run_start : inbox : signal : reference_fetch`), since `signal` will import it.
- New tests are named `tests/test_accounts_*.py` and `tests/test_auth_*.py`; add both patterns to
  the fast-tests list in `.github/workflows/checks.yml` in the slice that first creates one.
- The store follows `deploy_workflow.signal.store`: `open_db(root)` creates
  `<root>/accounts/accounts.db`, WAL, foreign keys on, numbered migrations, a guard that refuses a
  store this build's migrations did not make, one connection per request.
- Times are UTC and injected: every function that reads the clock takes it as a parameter.
- Nothing secret is logged. Each slice has a test that captures the log across its hostile cases
  and asserts no passcode, session token or Entra token appears.

## Slice 1: account store, passcodes, lockout

No route uses it. Files: `accounts/__init__.py`, `store.py`, `passcodes.py`, `cli.py`,
`__main__.py`; `.importlinter`; `checks.yml`; tests.

1. **Store and migrations.** Tables of spec 5.1 (`passcodes` holds `analyst` and `admin` only).
   Unique on (tenant id, object id) and on display name.
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
5. **Command line.** `python -m deploy_workflow.accounts --root <root> passcode set
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
   route: with sign-in on, a request without a valid session gets 401 (API, download) or a 303 to
   `/auth/sign-in` (a page navigation). Allowlist: `/auth/` routes and the static files the
   sign-in page needs. `/signal/api/` is covered by the same check.
3. **The switch.** `make_server(..., sign_in=False)` by default in this slice; never on in the
   read-only preview or synthetic mode (a `ValueError` if asked). The page gets
   `<meta name="credit-os-sign-in" content="on">` when on.
4. **Enumeration test.** Walk the application's routes and `signal.service`'s route table, ask
   each without a session with sign-in on, and require a refusal, so a route added later is
   covered without editing the test. Sessions for tests are minted through `accounts.sessions`
   directly, not through a test-only route.

Answer key, slice 2: a token is 43 characters; the stored value is 64 hex characters and is not
the token; a session at 11 h 59 min 59 s is valid and at 12 h 0 min 1 s is not; without a session
`GET /connected/reports` is 401, `GET /` is 303 to `/auth/sign-in`, `GET /auth/me` is 200
`{"account": null}`; with sign-in off every one of those answers as on `main` today.

## Slice 3: Entra sign-in and registration

Files: `pyproject.toml`, `uv.lock` (`msal`, pinned); `accounts/entra.py`;
`react_frontend/auth_routes.py`; a plain sign-in page in `web/`; `tests/auth_provider.py` (the
stand-in identity provider); tests; README.

0. **First, settle by test** (spec 5.3): hand `msal` an identity token whose signature bytes are
   altered but whose claims are valid. Record in the PR and VERIFICATION.md whether it is refused.
   Either result is acceptable; an unrecorded one is not.
1. **Configuration.** `CREDIT_OS_ENTRA_TENANT` and `CREDIT_OS_ENTRA_CLIENT` from the launching
   environment. Sign-in turns on in live mode when both are set; with one set the application
   refuses to start; with neither it starts as today and prints one line saying sign-in is off.
2. **The flow.** `/auth/sign-in`, `/auth/callback`, `/auth/passcode`, `/auth/sign-out`, `/auth/me`
   per spec 5.3 and 5.4. Pending flows in memory, ten minutes, one use.
3. **Registration.** A first sign-in creates a Reader. `/auth/passcode` raises the profile type,
   under the lockout of slice 1. Only the tenant configured may sign in.
4. **The stand-in provider.** A local HTTP server in the tests that plays Entra's discovery,
   authorise and token endpoints. It refuses by default; each test states what it will issue.
5. **The sign-in page.** One screen: the product name, "Sign in with your work account", and the
   plain-language reason when sign-in fails. `DESIGN.md` tokens; no new component library.

Answer key, slice 3: a callback with a wrong `state` is 400 and creates nothing; a replayed
callback is 400; a token for another tenant, another audience or a wrong nonce is refused with
"this account cannot sign in here" and no account row; a first sign-in yields profile type
`reader`; the Admin passcode then yields `admin`; no row of any table and no captured log line
holds an access, refresh or identity token.

## Slice 4: Signal on the account

Files: `signal/identity.py`, `signal/service.py`, `signal/routing.py`, `signal/store.py` (one
migration), the `api_*` modules that gain Admin routes, `signal/cli.py`;
`react_frontend/signal_host.py`; `web/src/pages/signal/` (name dialog removed, Admin controls
enabled); tests.

1. **Identity.** `current_user` returns `User(name, role)` from the signed-in account: `reader`,
   `analyst` as Signal's `writer`, `admin` as Signal's `owner`. `POST /api/me` and the
   `signal_name` cookie are removed.
2. **Removal of typed-name rows** (spec 5.5), in one migration, after
   `signal.db` is copied to `signal.db.before-accounts` beside it. **order**: copy, then delete,
   then mark the migration, so a crash between steps repeats safely and never deletes twice
   without a copy. The answer key lists every table and what remains.
3. **Admin in the browser.** Routes for approve and pause a source, set the AI cap (still refused
   above the ruling's USD 25), remove a thread, comment or group, disable an account and change a
   profile type. Each requires `admin`; each existing command-line action stays.
4. **Web.** The name dialog and its tests go; Settings shows the owner sections as working
   controls for an Admin and read-only for others.

Answer key, slice 4: a Reader's `POST` to a writer route is 403 "your profile cannot do this";
an Analyst's call to an Admin route is 403; an Admin setting the cap to 25.01 is refused and to 25
accepted; after the migration `saves`, `topic_follows`, `group_members`, `threads`, `comments`,
`reactions`, `read_marks`, `digests` and its child tables, `notification_settings` and proposed
sources are empty, while `stories`, approved `sources`, `topics`, `issuers` and `ai_usage` keep
their row counts; the copy exists and opens.

## Slice 5: Submit by profile type

Files: `deploy_workflow/run_start/service.py`, `submissions.py`; `react_frontend/__init__.py`;
`web/src/pages/` run start; tests.

1. Preparing and submitting a run needs `analyst` or `admin`; a Reader gets 403 and sees the
   run-start page without Submit.
2. The submission record carries the account id and display name in place of the typed analyst
   name. The existing name rule ("Eric G") still applies to what Teams cards show: the card uses
   the display name's first name and initial.
3. With sign-in off (no Entra variables), run start behaves exactly as on `main` today.

Answer key, slice 5: a Reader's `POST` to the submit route is 403 and writes no submission file; an
Analyst's is accepted and the record names their account; the cap figures (Lite 20, Full 30, Deep
50, purpose pathways 20) are unchanged; with sign-in off the existing run-start tests pass
unedited.

## Stop and report instead of deciding

- A test that can only pass by weakening an assertion, skipping, or computing its expectation.
- Anything that would call Microsoft, a model, or a live feed.
- `msal` needing a client secret, or a browser-side step, for the flow in spec 5.3.
- A route the enumeration test finds that cannot sensibly require a session.
- Any change that would alter what a run spends or when Signal's AI pass may run.
