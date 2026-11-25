# Sign-in and accounts: Entra identity, passcode profile types, Signal on the account

Status: draft for owner approval, 2026-11-26. Covers items 2 to 5 of `docs/TODO.md`. Items 1
(landing page), 6 (offline stories snapshot), 7 (real Entra on the work PC) and 8 (security audit)
are separate work.

Lines marked **(call)** are the designer's choices, not owner decisions. The owner may overrule
any of them. Section 9 lists the ones that most need an answer.

## 1. Intent

Today anyone at the machine can use every screen, start a paid run, and type any name into Signal
to act as that writer. After this change a person signs in with their work account, registers once
with a passcode that sets their profile type, and every action in Signal and every paid Submit is
tied to that account.

## 2. What the owner has decided (2026-11-25)

- The application runs on a single machine; other users only have offline pages.
- Microsoft Entra ID proves who the user is, using OpenID Connect, with Microsoft's `msal` library.
- A passcode the owner sets chooses the profile type at registration: Reader, Analyst (Signal's
  writer) or Admin (Signal's owner). Passcodes are stored as salted hashes only
  (`docs/rulings/2026-11-25-registration-passcodes.md`).
- Signal, the library and run start are one application in one process (built).

## 3. Goals, non-goals, anti-goals

Goals

- No page data, API route, report or source download is served to a request without a signed-in
  account, in live mode. Hiding a control is not protection.
- Registration: first sign-in plus a valid passcode creates the account with that profile type.
- Signal takes its user from the account. The typed display name and its cookie are removed.
- The Admin's powers move into the browser: approving and pausing sources, the AI cap, removing
  threads, comments and groups. Today they are command-line only because a typed name proves
  nothing.
- Submit of a paid run needs Analyst or Admin, and records who submitted.

Non-goals

- The landing page design. This work serves a plain sign-in page; the landing page replaces it.
- Password storage, password reset, multi-factor: Entra does these.
- Per-issuer or per-group access rules. A signed-in Reader reads everything.
- Protecting offline pages. They are files; anyone holding one can read it.

Anti-goals (a failure even if it works)

- A route that answers without a session because it was added later and nobody listed it. The
  check is deny-by-default at the one place every request passes, with a short, named allowlist.
- A passcode, session token or Entra token in a log, a page, a run folder, or the repository.
- A plain-text passcode or a reusable session token in the store.
- A test that passes because the stand-in identity provider accepts anything.
- Sign-in required in the read-only preview or a synthetic proof run, which have no accounts.

## 4. Constraints

- Python standard library plus pinned dependencies. One new dependency: `msal`, pinned, with its
  transitive packages recorded for the work-PC change pack.
- No client secret: the public-client authorization-code flow with PKCE. Tenant and client ids
  come from the launching environment and are not secrets.
- The build and its tests make no request to Microsoft. Sign-in is proved against a stand-in
  identity provider and labelled with that scope until item 7 is done on the work PC.
- The quality gate, targeted tests, confidence-review and rewrite-tournament apply. Sign-in is
  security code: `mx-adversary` reviews it before merge (CLAUDE.md).

## 5. Design

### 5.1 The account store

One SQLite file, `<root>/accounts/accounts.db`, WAL mode, opened per request like Signal's store
**(call)**: separate from `signal.db`, so Signal's schema guard and upgrades are untouched and a
feed store can be replaced without losing accounts.

- `accounts`: id; Entra tenant id and object id (the stable pair that identifies a person, unique
  together); display name (unique, see 5.5); email as Entra gave it; profile type
  (`reader`, `analyst`, `admin`); created at; disabled flag.
- `sessions`: SHA-256 of the session token; account id; created at; last used at; expires at.
- `passcodes`: profile type (one row each); scrypt hash; salt; set at.
- `registration_attempts`: Entra object id; failed count; first failure at; for the lockout.

### 5.2 Passcodes

- The owner sets each with `python -m deploy_workflow.accounts passcode set <type>`, typed at a
  prompt that does not echo; never an argument, an environment variable or a file.
- Stored with `hashlib.scrypt` and a per-passcode random salt; compared in constant time.
- Rules **(call)**: at least 12 characters; the three passcodes must differ; setting a new one
  replaces the old and does not change accounts already registered.
- Lockout **(call)**: five wrong passcodes for one Entra identity within an hour refuse further
  attempts for that identity for an hour. Counted in the store, so a restart does not reset it.
- No passcode set for a type means nobody can register as that type.

### 5.3 Sign-in with Entra

- `msal.PublicClientApplication` with the tenant-specific authority, so only the organisation's
  own tenant can sign in. `initiate_auth_code_flow` and `acquire_token_by_auth_code_flow` carry
  PKCE, `state` and `nonce`.
- Routes: `GET /auth/sign-in` redirects to Entra; `GET /auth/callback` redeems the code;
  `POST /auth/register` takes the passcode; `POST /auth/sign-out`; `GET /auth/me`.
- The redirect address is `http://localhost:<port>/auth/callback`. The server already accepts
  `localhost:<port>` as its own address.
- The pending flow (state, nonce, code verifier) is held in memory, keyed by a short-lived cookie,
  and expires after ten minutes. Entra's tokens are used once to read the identity and then
  dropped: nothing calls Microsoft Graph, and no token cache is written.
- **To settle before the build, by test:** whether `msal` checks the identity token's signature or
  only its claims. Published sources disagree. If it checks claims only, the token is still
  received directly from Entra over a verified TLS connection, which OpenID Connect accepts in
  place of a signature check for this flow; the spec then says so plainly and the stand-in
  provider test proves a token from any other issuer, audience or nonce is refused. If the owner
  wants the signature checked regardless, that needs `PyJWT` with `cryptography` as well.

### 5.4 Sessions and the one check

- After a successful callback the server makes a 256-bit random token, stores its SHA-256, and
  sets it in a cookie: `HttpOnly`, `SameSite=Lax` (the callback is a cross-site navigation, so
  `Strict` would drop it), `Path=/`. No `Secure` flag: the application is served over loopback
  HTTP only.
- Lifetime **(call)**: 12 hours from sign-in, and 2 hours without a request. Sign-out deletes the
  row. Disabling an account ends its sessions at the next request.
- The check sits in the application server's request path after the existing `Host`, `Origin`
  and `Sec-Fetch-Site` checks and before any route. Allowlist without a session: `/auth/*`, the
  sign-in page, and the static files that page needs. Everything else: a page navigation
  redirects to sign-in; an API or download request gets 401.
- A signed-in identity with no account yet can reach only the registration step.
- Live mode only. The read-only preview and synthetic mode run as now, with no accounts.

### 5.5 Profile types and what each may do

| | Reader | Analyst | Admin |
|---|---|---|---|
| Read the library, reports, Signal | yes | yes | yes |
| Save stories, follow topics, own digests | yes | yes | yes |
| Post, comment, manage groups and topics, propose sources | no | yes | yes |
| Prepare a run and Submit a paid run | no | yes | yes |
| Approve or pause sources, set the AI cap, remove threads, comments, groups | no | no | yes |
| Disable an account, change a profile type | no | no | yes |

Signal stores who did what by name (`user_name`, `author`). The account's display name takes that
place **(call)**: it comes from Entra, is made unique at registration by adding the email's local
part when two people share a name, and does not change afterwards, so existing rows keep their
meaning. `deploy_workflow.signal.identity.current_user` is replaced by a function that reads the
account; Signal's `users` table and the `signal users add` command are retired, and the Admin's
existing command-line actions stay as a fallback.

Rows already written under typed names are left as they are and belong to nobody **(call)**:
there is no safe way to map a typed name to a person.

### 5.6 The first Admin

The Admin passcode is what makes the first Admin: the owner sets it on the command line and
registers with it. There is no default account and no bootstrap flag.

## 6. Slices

Each is one PR, in order; each leaves main working.

1. Account store, passcode command, hashing and lockout. No route uses it yet.
2. Sessions and the deny-by-default check, behind a start-up switch that is off, proved with a
   test-only way to mint a session.
3. Entra sign-in and registration against the stand-in provider; the switch turns on in live mode.
4. Signal on the account; the typed name removed; Admin powers in the browser.
5. Submit requires Analyst or Admin and records the account.

## 7. Tests

- Expected values written by hand. The stand-in identity provider is a local server whose every
  response the test controls; it refuses by default and each test states what it will accept.
- Every route in the application's and Signal's route tables is asked without a session and must
  refuse, by enumerating the tables, so a route added later is covered without editing the test.
- Hostile cases: a replayed callback, a wrong `state`, a token for another tenant or audience, an
  expired session, a session cookie from a deleted row, a passcode one character off, the sixth
  attempt, two registrations racing for one identity, a Reader calling a writer route, an Analyst
  calling an Admin route.
- No passcode or token appears in any log line the tests capture.

## 8. Not covered until the work PC

App registration, tenant and client ids, and a sign-in with real accounts (`docs/TODO.md` item 7).
Until then every sign-in claim in VERIFICATION.md carries "stand-in identity provider only".

## 9. For the owner

1. **Who signs in.** The application listens on this machine only, so sign-in separates the
   people who sit at it. If colleagues are meant to reach it from their own PCs, that is a
   different design (TLS, a network address) and should be said now.
2. **Reader needs a passcode too?** The spec says yes: no passcode, no account.
3. **Token signature** (5.3): accept the direct-from-Entra token on its claims, or add two more
   dependencies to check the signature.
4. **Old Signal rows** under typed names: left unowned, as the spec says, or removed.
5. **Session length**: 12 hours, 2 hours idle.
