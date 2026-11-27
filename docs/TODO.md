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
| 3 | SQLite store for accounts, profile types, sessions and passcode hashes. No analytical data, no passwords | This repository | Slice 1 (store, passcodes, lockout, accounts command line): ericmg13/credit-os2#108; slice 2 (sessions, the one check, `/auth/me`): ericmg13/credit-os2#119 |
| 4 | Registration on first Entra sign-in: a first sign-in creates a Reader; a valid passcode makes the account an Analyst or an Admin | This repository | Not started |
| 5 | Replace Signal's display-name cookie (`deploy_workflow.signal.identity.current_user`) with the signed-in account, and move the owner's source and AI-cap powers into the browser | This repository | Not started |
| 6 | Read-only Signal snapshot for offline pages: stories only, no threads, comments or posting. May not be needed now that colleagues use the live app; owner to confirm | This repository | Not started |
| 7 | **Full deployment: Entra app registration limited to the organisation's own tenant, tenant and client ids, the network address, a certificate colleagues' browsers trust, any firewall rule, and a sign-in with real work accounts from a colleague's PC** | **Work PC only, with IT** | Not started |
| 8 | Security audit of the sign-in code with `cloudflare/security-audit-skill` once items 2 to 5 exist | This repository | Not started |
| 14 | Serve the app on the office network over HTTPS: a `--host` option refused unless sign-in is on and a certificate is configured, plus the per-address request limits. Proved here with a test certificate | This repository, then work PC with IT | Not started |
| 15 | Before sign-in can switch on (slice 3): the account store's folder check on Windows and for access-control lists, which slice 1 leaves unchecked (ruling R17 in #108); a person whose display name and bracketed name are both taken cannot register, and display names have no cap while Signal cuts user names at 60 characters (#108 pre-merge review L1, L2) | This repository; Windows check on the work PC | Done in #119 (folder rules in `store.open_db`: Linux POSIX ACL refused, Windows folder inside `%LOCALAPPDATA%`; display names first free of three candidates, at most 60 characters). Left: run the Windows rule on the work PC; macOS ACLs stay unchecked |
| 22 | **Before slice 3 ships:** `http_base` logs every request line with its query string at INFO, so `/auth/callback?code=…` would write the Entra authorization code to the log (#119 pre-merge review, Info A) | This repository | Fixed on the slice 3 branch. Shared HTTP logs retain safe request metadata and omit the query. The loopback regression passed for access, parser and service errors. |
| 23 | The run-start server (`python -m deploy_workflow.run_start --root <shared> --host <address>`) serves the run routes with no sign-in on any address that is not a wildcard; slice 2 gates only the application server (#119 security review, P1; predates it). Decide before slice 7 | This repository | Owner's call |
| 24 | Slice 2's parked Low and Info items, in one batch after the last slice: a test for the order of the start-up checks; a simulated case-variant test that runs on CI's Ubuntu runner; `sessions.last_used_at` holds the sign-in time (rename, or say so before slice 5 shows it); a deleted store is re-created by the next request; `BEFORE ACCOUNTS` accepted as a display name; the store checks its own folder and file, not their ancestors; a quoted, escaped cookie value decodes to the same token; `_is_inside` can raise if `--root` vanishes mid-check, and the raw-spelling identity check has no test; small test tidy-ups (T1 I1–I3, T2 I1) (#119) | This repository | Done in the parked-batch PR (branch `claude/sign-in-parked-batch`), with the other open sign-in Lows. Left: the store does not check its folder's ancestors (owner); display-name cuts can split a grapheme (no standard-library segmentation; a dependency would need a ruling) |
| 25 | Slice 3's session cookie: no other cookie name may contain `credit_os_session` (any second occurrence signs the request out), and its attributes must settle cookie tossing from another localhost port, which can overwrite the session with an attacker's own valid token (#119 security review I2, I5) | This repository | Offline guard implemented in slice 3. The flow cookie uses a distinct name, and the ordinary HTTP launcher refuses configured sign-in. The loopback proof runs the real flow with an explicit test provider. Real activation on a dedicated HTTPS hostname is work-PC rollout, outside this build. |

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
| 11 | `tests/test_reporting_currency_proof.py` failed 2 of 5 on main at `51687ad` (reported by the PR 83 session; a browser-marked test CI's fast job does not run). Confirm on current main and fix | This repository | Still failing at `ef005f64` (2026-11-26): the GBP and CHF Forecast-row tests; not in `tests/known-failures.txt` |
| 12 | Independent review of the parts PR 83 listed as unreviewed: the logo service and the React wiring for issuers, filings, the market post and logos | This repository | Not started |
| 13 | First live fetch by the hosted loop, and the first paid AI pass, each watched | Work PC, owner present | Not started |

Owner actions before Signal's sources and AI are switched on (none is taken by the build):

- Approve feeds from `docs/design/2026-11-25-signal-source-list-draft.md`.
- Filings: set the SEC contact with `signal filings contact`, then approve each filing source.
- Market post: confirm ICE's terms for the ICE BofA spread series, then propose and approve it.
- AI pass: set the cap with `signal ai cap` (at most USD 25 a month) and start the application
  with `CREDIT_OS_SIGNAL_AI=1`.

## Credit Snapshot workbook

Owner, 2026-11-26: Bloomberg is not installed on this Mac, so cells fed by Bloomberg formulas
cannot be populated here, and formulas other than arithmetic stay unfilled. The spec
(`docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md`, R4 and R9b) keys the
Bloomberg-fed cells on each instrument's FIGI, extracted from the RV book; that extraction, of
the FIGI and the Bloomberg ID, is being built in the Credit Snapshot workbook PR, not yet merged.
The same formula works with either identifier, so one is enough.

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 14 | **Bloomberg formulas in the Credit Snapshot workbook: the Bloomberg-fed cells (R4) filled by formulas keyed on each instrument's FIGI or Bloomberg ID cell** | **Work PC only** | Not started |

## Left by the 2026-11-26 High fixes

Left by ericmg13/credit-os2#114 (H3 CP-3C currency, H6 stated basis points; merged 2026-11-26).

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 15 | Write the two `VERIFICATION.md` entries proposed in ericmg13/credit-os2#114's body (H3, and the H6 fidelity check) | This repository, by the coordinator | Not started |
| 16 | `tests/test_cp2_scorecard.py::test_a_heading_and_a_tag_for_one_register_count_as_two` fails on main at `ef005f64` ("expected a fault") and is not in `tests/known-failures.txt`. Find the cause and fix | This repository | Not started |
| 17 | Earnings-delta lead (`earningsDeltaData.ts`): a stated change outside the ruled `bp`/`bps`/`basis points` words, such as `+1 basis point`, `+50 bps YoY`, `+50 bps, reported` or `+50 basis pts`, is still drawn in percentage points, 100 times the change. Widening the words needs an owner ruling | Owner decision, then this repository | Decision needed |
| 18 | CP-3C: a currency code in lower or mixed case on a due T3D.2 row (`eur`) is unread by `currency_of`, so it counts as foreign and `Maturities due` is not checked while `Funding gap` agrees. Decide whether `currency_of` should read such codes | Owner decision, then this repository | Decision needed |
| 19 | Small test and code tidy-ups from PR 114: the earnings-delta render test asserts with `toContain` rather than exact text; `digits.replaceAll(",", "")` is repeated four times in the `AMOUNT` branch | This repository | Not started |

## Copilot context, after the 1M change

Left by the reviews of branch `claude/copilot-1m-context-795226` (2026-11-26). All predate that
change or fall outside it.

| # | Item | Where it can be done | Status |
|---|---|---|---|
| 20 | Opus prompt estimate: the adapter's 3.85 bytes per token is calibrated on GPT Sol; the pilot measured Opus at 2.39–2.55 (`cases/pilot-fixes/limits.json`), so Opus prompts are understated by about 1.6x and the guard can pass one the runtime then refuses after sending | This repository | Not started |
| 21 | Reader run: it adds each charge but never compares it with the call's hold (`owners/cpos_reader_run.py:136`), so an overrun is not stopped there | This repository | Not started |

## Open decisions

- Where the HTTPS certificate is held: a path in the launching environment (needs a ruling) or
  IT's own web server in front of the app.
- Whether a sign-in with no client secret is allowed for a network address under the
  organisation's Entra settings. To be confirmed on the work PC.

- Passcode rotation and the limit on wrong attempts (left open by the passcode ruling): the sign-in
  spec proposes five wrong attempts an hour and that a new passcode does not change existing
  accounts. Owner to confirm.
- The account store's folder (`CREDIT_OS_ACCOUNTS_DIR`): a folder on the machine's own disk,
  not the shared folder. Owner to name it on the work PC.
- Whether a Copilot hold should cover two model requests in one call. Today one call that the
  runtime turns into two can settle above its hold; the ledger now records the real sum and the run
  stops, but the cap can be passed by that one call.
