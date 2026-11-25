# To-do list

Work that is agreed but not yet designed or built. Each item gets its own design before code.
An item leaves this list when its PR merges.

## Sign-in, accounts and landing page

Owner decisions, 2026-11-25:

- The app is managed on a single machine. Other users only interact with offline pages.
- Sign-in uses Microsoft Entra ID (OpenID Connect, authorization-code flow with PKCE).
- Token checking uses Microsoft's `msal` library, a new pinned dependency.
- Entra proves who the user is. A passcode the owner sets chooses the profile type at
  registration: Reader, Analyst (Signal's writer) or Admin.
- Users with offline pages get Signal as a read-only snapshot of stories only. Threads and
  comments stay in the running service.

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 1 | Landing page: one entry point for the library, run start and Signal, where sign-in is applied | This repository | Not started |
| 2 | Entra sign-in in the Python service with `msal`: identity checked server-side, a session cookie, and every API route and report or source download protected, not only the page controls | This repository, proved against a stand-in identity provider only | Not started |
| 3 | SQLite store for accounts, profile types, sessions and passcode hashes. No analytical data, no passwords | This repository | Not started |
| 4 | Registration on first Entra sign-in: the passcode entered sets the profile type (Reader, Analyst, Admin); a wrong or missing passcode creates no account | This repository | Not started |
| 5 | Replace Signal's display-name cookie (`deploy_workflow.signal.identity.current_user`) with the signed-in account, and move the owner's source and AI-cap powers into the browser | This repository | Not started |
| 6 | Read-only Signal snapshot for offline pages: stories only, no threads, comments or posting | This repository | Not started |
| 7 | **Full Entra deployment: app registration limited to the organisation's own tenant, tenant and client ids, redirect address, and a sign-in with real work accounts** | **Work PC only** | Not started |
| 8 | Security audit of the sign-in code with `cloudflare/security-audit-skill` once items 2 to 5 exist | This repository | Not started |

Until item 7 is done on the work PC, sign-in is proved only against a stand-in identity
provider and must be labelled with that scope in VERIFICATION.md.

## Open decisions

- Whether Admin is the same as Signal's owner (approves sources, sets the AI spend cap) or a
  separate type below the owner.
- Whether stored passcode hashes need an owner ruling under "no credential files" (AGENTS.md).
