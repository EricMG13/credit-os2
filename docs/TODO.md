# To-do list

Work that is agreed but not yet designed or built. Each item gets its own design before code.
An item leaves this list when its PR merges.

## Sign-in, accounts and landing page

Owner decisions, 2026-11-25:

- One computer runs the app. Colleagues open it from their own PCs at a web address on the
  office network and use the live app: reports, the library, Signal with posting, and paid runs
  (2026-11-26; this replaces "single machine, other users only have offline pages").
- Signal, the library and run start are one app in one process. Done: ericmg13/credit-os2#83,
  merged 2026-11-25.
- Sign-in uses Microsoft Entra ID with OpenID Connect. The authorization-code flow with PKCE is
  the one described in the note the owner attached.
- Token checking uses Microsoft's `msal` library, a new pinned dependency.
- Entra proves who the user is. A first sign-in makes a Reader; a passcode the owner sets
  makes the account an Analyst (Signal's writer) or an Admin (Signal's owner). Passcodes are
  stored as hashes only (`docs/rulings/2026-11-25-registration-passcodes.md`).
- Users with offline pages get Signal as a read-only snapshot of stories only. Threads and
  comments stay in the running service.

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 1 | Landing page: one entry point for the library, run start and Signal, where sign-in is applied | This repository | Not started |
| 2 | Entra sign-in in the Python service with `msal`: identity checked server-side, a session cookie, and every API route and report or source download protected, not only the page controls | This repository, proved against a stand-in identity provider only | Not started |
| 3 | SQLite store for accounts, profile types, sessions and passcode hashes. No analytical data, no passwords | This repository | Not started |
| 4 | Registration on first Entra sign-in: a first sign-in creates a Reader; a valid passcode makes the account an Analyst or an Admin | This repository | Not started |
| 5 | Replace Signal's display-name cookie (`deploy_workflow.signal.identity.current_user`) with the signed-in account, and move the owner's source and AI-cap powers into the browser | This repository | Not started |
| 6 | Read-only Signal snapshot for offline pages: stories only, no threads, comments or posting. May not be needed now that colleagues use the live app; owner to confirm | This repository | Not started |
| 7 | **Full deployment: Entra app registration limited to the organisation's own tenant, tenant and client ids, the network address, a certificate colleagues' browsers trust, any firewall rule, and a sign-in with real work accounts from a colleague's PC** | **Work PC only, with IT** | Not started |
| 8 | Security audit of the sign-in code with `cloudflare/security-audit-skill` once items 2 to 5 exist | This repository | Not started |
| 14 | Serve the app on the office network over HTTPS: a `--host` option refused unless sign-in is on and a certificate is configured, plus the per-address request limits. Proved here with a test certificate | This repository, then work PC with IT | Not started |

Items 2 to 5: draft spec `docs/superpowers/specs/2026-11-26-sign-in-and-accounts.md`.

Until item 7 is done on the work PC, sign-in is proved only against a stand-in identity
provider and must be labelled with that scope in VERIFICATION.md.

## Signal, after the one-process change

Left by ericmg13/credit-os2#83 (merged 2026-11-25). Rulings recorded the same day:
`docs/rulings/2026-11-25-signal-fetches-in-app-process.md` and the amendment to
`docs/rulings/2026-11-25-signal-ai-pass.md`.

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 9 | Logging: in the application Signal's log lines have no file and no timestamp. Errors reach only the terminal and information lines are dropped, while its status and refusals say "see the log". Write them to a log a reader can find | This repository | Not started |
| 10 | Drive hosted Signal in a real browser: feed, groups, threads, digests, settings, issuer pages, the Filings tab, the market card and logos | This repository | Not started |
| 11 | `tests/test_reporting_currency_proof.py` failed 2 of 5 on main at `51687ad` (reported by the PR 83 session; a browser-marked test CI's fast job does not run). Confirm on current main and fix | This repository | Not checked since |
| 12 | Independent review of the parts PR 83 listed as unreviewed: the logo service and the React wiring for issuers, filings, the market post and logos | This repository | Not started |
| 13 | First live fetch by the hosted loop, and the first paid AI pass, each watched | Work PC, owner present | Not started |

Owner actions before Signal's sources and AI are switched on (none is taken by the build):

- Approve feeds from `docs/design/2026-11-25-signal-source-list-draft.md`.
- Filings: set the SEC contact with `signal filings contact`, then approve each filing source.
- Market post: confirm ICE's terms for the ICE BofA spread series, then propose and approve it.
- AI pass: set the cap with `signal ai cap` (at most USD 25 a month) and start the application
  with `CREDIT_OS_SIGNAL_AI=1`.

## Open decisions

- Where the HTTPS certificate is held: a path in the launching environment (needs a ruling) or
  IT's own web server in front of the app.
- Whether a sign-in with no client secret is allowed for a network address under the
  organisation's Entra settings. To be confirmed on the work PC.

- Passcode rotation and the limit on wrong attempts: the sign-in spec proposes five wrong
  attempts an hour and that a new passcode does not change existing accounts. Owner to confirm.
- The account store's folder (`CREDIT_OS_ACCOUNTS_DIR`): a folder on the machine's own disk,
  not the shared folder. Owner to name it on the work PC.
