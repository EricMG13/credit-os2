# To-do list

Work that is agreed but not yet designed or built. Each item gets its own design before code.
An item leaves this list when its PR merges.

## Sign-in, accounts and landing page

Owner decisions, 2026-11-25:

- The app is managed on a single machine. Other users only interact with offline pages.
- Sign-in uses Microsoft Entra ID (OpenID Connect, authorization-code flow with PKCE).
- Account creation needs a passcode that the owner sets.

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 1 | Landing page: one entry point for the library, run start and Signal, where sign-in is applied | This repository | Not started |
| 2 | Entra sign-in in the Python service: identity checked server-side, a session cookie, and every API route and report or source download protected, not only the page controls | This repository, proved against a stand-in identity provider only | Not started |
| 3 | SQLite store for accounts, roles, sessions and passcode hashes. No analytical data | This repository | Not started |
| 4 | Passcode-gated account creation: first Entra sign-in plus a valid passcode creates the account | This repository | Not started |
| 5 | Replace Signal's display-name cookie (`deploy_workflow.signal.identity.current_user`) with the signed-in account, and move the owner's source and AI-cap powers into the browser | This repository | Not started |
| 6 | **Full Entra deployment: app registration, tenant and client ids, redirect address, and a sign-in with real work accounts** | **Work PC only** | Not started |
| 7 | Security audit of the sign-in code with `cloudflare/security-audit-skill` once items 2 to 5 exist | This repository | Not started |

Until item 6 is done on the work PC, sign-in is proved only against a stand-in identity
provider and must be labelled with that scope in VERIFICATION.md.

## Open decisions

- Whether stored passcode hashes need an owner ruling under "no credential files" (AGENTS.md).
- Whether token checking may add a dependency (for example `msal`) or stays standard-library only.
- What Signal offers a user who only has offline pages: group threads and comments need the
  running service.
