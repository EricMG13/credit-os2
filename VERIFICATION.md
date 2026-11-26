# Verification record

Keep one running record here. A pass applies only to the stated scope. Earlier verification of the
engine is in [EricMG13/final-workflow](https://github.com/EricMG13/final-workflow)'s
`VERIFICATION.md`, which also keeps the retained runs this copy leaves out.

## 2026-11-26 — Sign-in slice 3, offline Entra flow and registration

- Scope: slice 3 and TODO item 22, stacked on #119 at `de2a5543` and #108. The owner authorized
  proceeding while both remain drafts and excluded work-PC and Windows validation. The ordinary
  HTTP launcher refuses paired Entra settings before the store or Scheduler starts. Without the
  settings it prints the sign-in-off notice to stderr and still reports the address on stdout.
  An explicit constructor provider runs the actual configured routes in the offline proof. A
  dedicated deployment hostname and HTTPS remain rollout work. [RFC 6265 §8.5](https://www.rfc-editor.org/rfc/rfc6265.html#section-8.5)
- Shared HTTP logs omit request queries, including in access, parser and service-error paths.
  MSAL 1.39.0 completed the public-client PKCE flow through the injected loopback transport. It
  accepted both the independently verified signed control and the altered-signature token with the
  same claims. The test provider checks declared request values at authorization and at token
  exchange. The real application drops the MSAL token-cache event. DEBUG captures and database
  checks covered submitted passcodes, session values, authorization codes, PKCE verifiers and the
  issued ID, access and refresh tokens. [Dependency record](docs/rulings/2026-11-26-sign-in-msal-pin.md)
- The configured handler opens exact method and path pairs. The matrix covered 468 paths and seven
  methods in eight shards of 819 app requests, half signed out and half signed in. It retains the
  original gate-only cases. Two callbacks racing on the same flow produced one session. Other tests
  covered wrong state, replay, tenant, issuer, audience and nonce refusal, first-sign-in Reader,
  disabled account refusal, Admin passcode and lockout, and sign-out. The store remained outside
  `--root`. Tests stayed within six threads and 1,000 sequential connections each.
- Local macOS: 597 targeted Python tests, changed-code quality gate and three import
  contracts passed. The MSAL query-mode warning remains visible. Confidence review, the post-edit
  rewrite tournament and changed-update sweep ran. Per-task precise, order, defensive security and
  pre-merge reviews passed. The owner approved GPT for advisor and architect after the Opus 5.5
  xhigh attempt hit expired Claude authentication.
- Desktop fidelity: lint, format, typecheck, unused-code, duplication, 18 focused web tests and the
  production web build passed. Chromium rendered the actual sign-in and connected account pages
  through the configured app at 1024, 1280 and 1440 px. A local HTTP driver finished the real
  loopback callback and imported its returned session cookie. The browser showed the actual fixed
  400 callback alert, Reader, Admin after passcode and the signed-out page. The sign-in view loaded
  three initial resources. All 40 browser requests stayed on loopback.
- GitHub's first run passed Python, import and leak checks. Its theme test found two inline hex
  literals. The account trigger now uses the existing focus token, and the standalone test checks
  the equivalent RGB color within the focus rule. All 32 targeted web tests and the web gates
  passed. A fresh Chromium run confirmed the same focus color and completed all 40 requests on
  loopback. The GPT task and architecture closure reviews passed.
- Not verified: real Entra, browser navigation through Microsoft, live TLS rollout and native
  Windows (TODO item 15), all excluded by the owner. The browser proof used the integrated local
  provider. The full weekly suite and draft CI are separate from these local checks.

## 2026-11-26 — Sign-in slice 2: sessions, the one check, the switch and `/auth/me` (PR #119)

- Scope: `deploy_workflow.accounts` (sessions; folder rules and display names moved or fixed) and
  `react_frontend` (the gate, the start-up switch, `/auth/me`, the sign-in meta) with their tests.
  Sign-in stays off unless `make_server(sign_in=True, accounts_dir=...)` is used; nothing does yet.
  No request to Microsoft, no model call, no live fetch, no new dependency. Stacked on #108.
  Trimmed here: the seven oldest entries (all 2026-11-18, from "Desktop review follow-up after
  PR #64" to "Connected desktop findings and Forecast proof").
- Sessions: a `secrets.token_urlsafe(32)` token, only its SHA-256 stored, 12 real hours from
  sign-in (UTC arithmetic; a London time across the clock change was 13 h before the fix); lookup
  writes nothing; an unknown, expired, ended or malformed token, or a disabled account, gives no
  session.
- The check: after Host, `Sec-Fetch-Site` and `Origin`, before `Transfer-Encoding` and every route.
  Only GET `/sign-in` and GET `/auth/me` pass without a session (exact method and path); app pages
  and `/library` paths get a 303 to `/sign-in`; the rest get 401. The cookie counts only when its name
  appears once across all `Cookie` headers; a store error is a 500, never "no session".
- Start-up: sign-in refused in read-only and synthetic modes; the store's folder must be given,
  absolute, private, outside `--root` by path and by file identity (case variants, the macOS
  firmlink and `..` caught), and `--root` must exist. Linux POSIX ACLs refused; on Windows the folder
  must be inside `%LOCALAPPDATA%` (simulated here). Display names: first free of three candidates,
  at most 60 characters, "before accounts" reserved.
- Checked: `tests/test_accounts_*.py` 147 and `tests/test_auth_*.py` 44 passed (440 with the server,
  Signal-host, standing-portfolio and repo-rules tests); expected values are hand-written or come
  from independent standard-library calls (`hashlib` for the stored hash, `os.path.realpath`);
  `tools/quality_gate.py`, `lint-imports`, `mypy --strict` on the package, `ruff` exit 0. The
  deny-by-default test sends every path the code names, 200 seeded hostile paths and all seven
  methods: no route runs without a session, every route runs with one; with the gate call removed
  22 tests fail. The log test finds no 8-character piece of any token and no stored hash anywhere.
  Reviews: per-task `mx-precise` (four Mediums fixed), `mx-adversary` on the slice (two Mediums and
  a Low fixed over two rounds, re-review passed), confidence review, rewrite tournament (incumbent
  holds), sweep (3 Info), `mx-architect` pre-merge PASS, 2 Low and 3 Info (Opus 5.5 at xhigh: Fable
  usage was exhausted).
- Merge with refreshed slice 1 `1aecd0fe` and `main` `cebb1726`: 412 auth, accounts, frontend,
  Signal-host and repo-rules tests passed on macOS, including deny-by-default positive controls
  and the passcode and session log checks. The quality gate and all three import contracts
  passed. The merge review confirmed the incoming deliverables route and all sign-in refusals
  before Scheduler construction. The Windows work-PC check in TODO item 15 remains open.
- Not verified: Windows and a real Linux ACL (both simulated); Linux bind mounts; SMB or OneDrive
  ownership mapping; real browsers' cookies; concurrent load; the Ubuntu runner (the case-variant and
  dot-dot tests skip there; nothing was run on Linux); routes whose path is built at run time (the
  gate still runs before them); GitNexus (not indexed); CI on the PR head until it runs. The local
  fast subset (2,611 passed) had one environmental failure, `test_react_runtime_identity` (a macOS
  temp path of 125 characters, limit 80), and 156 skips for the missing web `node_modules`.

## 2026-11-26 — Sign-in slice 1: account store, passcodes, lockout, accounts command line

- Scope: new package `deploy_workflow.accounts` (store, passcodes, command line) and its tests
  only. No route uses it; no request to Microsoft, no model call, no network access; no new
  dependency. Built on the plan and spec of PR #99 (not yet on `main` when built). Trimmed here:
  the four oldest entries (2026-11-17).
- Store: `accounts.db` in the folder named by `CREDIT_OS_ACCOUNTS_DIR` or `--accounts-dir`
  (absolute path only; the command line has no `--root`, and refusing a folder under the root is
  slice 2's start-up check), WAL, one numbered migration, a made-here guard. On
  POSIX the folder and file must belong to the running account and be open to no one else; the
  file is created 0600. Not checked: access-control lists, and anything on Windows (owner's call).
- Passcodes: Analyst and Admin only, 12 to 1,024 characters, scrypt (n 2^14, r 8, p 5) with a
  16-byte salt each time, compared in constant time, the two must differ (checked in one
  transaction). Lockout: five wrong in an hour (from the first failure) lock the identity for an
  hour from the fifth; counted in the store before the passcode is checked, so a store that cannot
  record a failure refuses rather than answers.
- Command line: `python -m deploy_workflow.accounts passcode set {analyst,admin}` reads the
  passcode twice at a terminal prompt that does not echo; a pipe, closed input, an argument or a
  non-text byte is refused, and no usage error repeats what was typed. `accounts list`,
  `accounts disable`, `accounts type`.
- Checked: `tests/test_accounts_{store,passcodes,cli,logs}.py` 94 passed, expected values
  written by hand by the coordinator; `tools/quality_gate.py` exit 0; `lint-imports` exit 0
  (`accounts` in the services layer); `mypy --strict` on the package exit 0. The log test captures
  every logger at DEBUG, stdout, stderr and exception text across the hostile cases and finds no
  five-character piece of any passcode, nor any stored hash or salt. A pty run of the real prompt
  did not echo (review probe). Reviews: per-task `mx-precise`, `mx-invariants` on the account race
  and the lockout, `mx-adversary` on the slice (two Mediums fixed, re-review passed), `mx-architect`
  pre-merge PASS, 6 Low and 5 Info (run on Opus 5.5 at xhigh: Fable usage was exhausted).
- Merge with `main` `cebb1726`: accounts and repo-rules tests 113 passed on macOS, including the
  passcode log check. The changed-code gate and all three import contracts passed.
- Not verified: Windows (the work PC) and its folder permissions; Linux ACLs; races between
  processes (threads only); a real full disk; CI on the PR head until it runs.
## 2026-11-26 — Credit Snapshot workbook: four sheets, download endpoint, fidelity check (PR #124)

- Scope: offline only. No provider call, no paid run, no Excel and no LibreOffice (owner: "no libra office should be required"). Evidence: a synthetic every-module run, a synthetic run with no scorecard and the one retained real CP-1 handoff (TransDigm, as of 2024-09-30, outdated; CP-1 blocks only). The CP-1A, CP-1B, CP-1C, CP-1D, CP-2 and CP-DR shapes are synthetic. Rulings: `docs/rulings/2026-11-25-deliverables-and-recommendations.md`, section "Credit Snapshot workbook".
- Built: `GET /connected/deliverables/<folder>/credit-snapshot.xlsx` writes one workbook (Snapshot, Inputs, Matrix, Sources) from a finished run's verified handoffs and pinned context; `credit_snapshot_workbook.py` is the one workbook writer (`tests/test_repo_rules.py`). Copied figures keep their digits; a missing value is a gap in words, never zero; every non-empty reader cell has one Sources row, and source references, file names, hashes and module ids appear on Sources only. The proposed recommendation is live Excel arithmetic over module-written scores and analyst cells, labelled proposed until confirmed. FIGI and Bloomberg ID are copied from a supplied RV worksheet on an exact maturity and asset-type join; no Bloomberg formula is written (`docs/TODO.md` item 14, work PC only).
- Presentation change and its fidelity check: `tests/test_credit_snapshot_fidelity.py` re-reads the saved file against a frozen answer key written apart from the reader (`tests/fixtures/credit_snapshot/`, `tests/credit_snapshot_case.py`) on the three cases. Formulas checked by exact text and by hand evaluation against `recommendation.py`; mutation testing (mutmut 3.8.1) on the figure path, every survivor killed or justified as equivalent.
- Coordinator's own check, PR head `02e05049` merged onto `main` `36c39519`: the fidelity, workbook, formulas, recommendation and repo-rules tests 602 passed; the every-module and TransDigm workbooks, built and reopened with openpyxl, hold exactly the four sheets, live formulas on the reader sheets and the formulas listed as text on Sources.
- Reviews: task reviews with fix rounds (Task 3b's third through an `mx-autonomous` plan); confidence review 2 Medium fixed; rewrite tournament six simplifications, output identical over 61,755 cells; sweep one defect fixed, structural rows to the next phase sweep; pre-merge review on Opus while Fable is rate-limited (owner: "Use Opus meanwhile"), 6 Medium, then 2, fixed, then pass. 18 Lows parked for the end batch.
- Not verified: Excel's own evaluation and rendering on Windows and Mac (hand-check steps in the PR body); a real run with a scorecard; real handoffs other than CP-1; an RV worksheet with real Bloomberg cached values; reading CP-1's `Asset type` (follow-up); the realised and unrealised split until CP-1D carries the Add-Back IDs; the weekly full suite.

## 2026-11-26 — Custom selection with whole modules: run type, handoff rules, estimate and cap, CP-8 base, run start picker (PR #121)

- Scope: offline only. No provider call and no paid run; no real custom run exists. Rulings: `docs/rulings/2026-11-26-custom-routing.md` (owner: "Yes, whole modules first", "Approve the cap").
- Built: pathway `custom` ("Custom selection") at the Advanced level, GPT only; the analyst's whole modules completed by the registry with a reason per added module; the Deep block list, a module with no block reading "No report section of its own"; cap = min(USD 50, ceiling(sum of per-module estimates + the USD 7.17 hold)); CP-8 compares only with an earlier custom run of the same issuer and completed modules; three Advanced presets as starting selections.
- Presentation change and its fidelity check: the custom selection page's picker, presets, running sum, hold and cap equal the hand-worked `answer-key-caps.md` for three presets at three efforts (rows without CP-8); the summary's server estimate replaces the page's; the web copy is pinned by `tests/test_custom_selection_web.py`. Scope: jsdom only, no rendered browser page.
- Other pathways: requests byte for byte against `main` `3cfcc52f` (170 prepare and 40 service cases); a custom run's instructions equal Deep's apart from pathway lines.
- Coordinator's own check at `7647979c`: the estimate code and its answer key read as ruled (Governance and ESG at fast effort 1.92 + 7.17 → USD 10); the custom, pathway and repo-rules tests 328 passed. The label commit `0e8e4aaa` was read.
- Reviews: plan critique and pre-merge review on Opus while Fable is rate-limited (owner: "Use Opus meanwhile"); task reviews with fix rounds; confidence review and rewrite tournament found no confirmed defect; sweep 2 Low fixed, 9 structural rows to the next phase sweep; pre-merge pass with 3 Low and 3 Info.
- Not verified: any real custom run; whether a run completes within its cap; the USD 50 ceiling binding on a real selection; a rendered page; Windows; parallel width above 1.

## 2026-11-26 — CP-1 instructions: bridge Add-Back ID, T4.18 asset type, pro forma interest and cover (PR #120)

- Scope: offline only. No provider call and no paid run; built by a cloud controller session. Evidence is synthetic tables, the retained Opus replay `tests/fixtures/live_2026_11_25/CP-1-replay-tdg.md` (TDG FY2024, outdated; a real model response replayed at USD 0) and the five retained CP-1 handoffs as a regression snapshot. No real CP-1 run on the new instructions exists.
- Built: CP-1's EBITDA bridge is asked for `Step | Amount | Add-Back ID | Reporting unit | Basis and limitation` with ids `AB-1`, `AB-2`, ... checked by the launcher; T4.18 gains `Asset type` by governing document (owner: "By governing document"), a named method edit with the CP-1 method pin moved; a required `Pro forma interest and cover` table, outside the chart tables, whose cover and EBITDA the launcher ties to T4.9. The CP-2D liquidity bridge and CP-4C value allocation are asked for and checked as before (request bytes identical; 196 probed cases).
- Presentation change and its fidelity check: the library and the React web read the bridge under the old and the new header to the same figures (chart columns, labels, amounts, unit); `Add-Back ID` is hidden in the chart Table view and on the Modules page and shown only on Evidence and in the trace drawer; the pro forma table is placed as a statement on the Modules page, not in a reader passage, Overview or chart, and CP-8's pack is unchanged with it. Store- and JS-level checks; no browser render.
- Answer key written by hand before the code (`tests/fixtures/cp1-instruction-pr/answer-key.json`; 67 Python and 5 web tests). Coordinator's own check, PR head `04e4dc44` merged onto `main` `542c2276`: the answer-key, bridge-reader, CP-1 check, changes and repo-rules tests 1,000 passed; the launcher tests on bridge, pro forma, T4.18, method, budget, manifest and post-balance-sheet 110 passed.
- Consequences: earlier runs show CP-1 as answered on an earlier method; a sentence added to the rule every module is sent changes every module's request bytes, so a run folder prepared before this is refused on re-prepare and resuming an in-flight run re-executes its modules; a retained pre-PR CP-1 response is refused on replay (the existing contract). `short_snapshot` (deactivated) has 775 characters of instruction headroom left.
- Reviews: plan critique and pre-merge review on Opus while Fable is rate-limited (owner: "Use Opus meanwhile"); task reviews, a figure-path adversarial review (no High; one Medium fixed) and the pre-merge review (two Medium fixed, then merge-ready with Low only). `confidence-review`, `rewrite-tournament`, the sweep and `adversarial-reviewer` were absent in the cloud and not run.
- Not verified: what a real model writes for the ids, `Asset type` and the pro forma table; CP-1D's use of the id (next PR) and CP-1B's validation of it; a launcher check of `Asset type` values; `tests/test_financial_workflow.py` and `tests/test_reporting_currency_proof.py`; a browser render; the weekly full suite. Two Lows open (a repair message's wording; a Basis label prefix).

## 2026-11-26 — Money units drawn as currency symbols ($m, £m, €m) (branch `claude/module-currency-labels-34fdbf`)

- Scope: presentation only, web reader (`docs/rulings/2026-11-26-money-unit-symbols.md`). No handoff, prompt, method, check, stored value or Python output changed; no provider call. Owner: all reader pages and the printed purpose reports; the Model page keeps `US$m`.
- Built: `moneyUnits.ts` draws a money unit as its en-US `Intl` symbol (`$m`, `£m`, `€m`, `CA$m`, `¥m`; `CHFm` where none) and figures as `$1,250m`, `−$25m`, `CHF 300m`; Unit columns, unit fields, basis lines, chart Table views, captions and Coverage labels convert where drawn. Stored and matching values, Evidence's Unit cells and source text, the trace drawer and module prose keep the written unit.
- Fidelity check: answer keys `moneyUnits.cases.json` and `signal.cases.json` (coordinator-written); a Modules-page test on the retained CP-1 TransDigm fixture and a replay test over eight retained handoffs find no `USD millions` or `US$m` outside module prose; an Evidence test keeps the raw cells. Rendered check on the synthetic run (`check-render.cjs`, 1440/1280/1024, Overview, Modules, Forecast, Changes, Coverage): 15 of 15 pass; page text shows no raw unit except module-written Forecast wording ("Stressed FCF (USD millions)"). Chromium and Node give the same symbols for 18 currencies.
- Reviews: advisor (Opus 5.5 xhigh, Fable exhausted) 2 High, 5 Medium ruled into the plan; task reviews pass (task B: 1 Medium fixed); confidence review and rewrite tournament (one shared helper adopted); sweep discover 4 Lows, fixed in one batch; pre-merge review (mx-architect on Opus 5.5 xhigh) 1 Medium (chart Table views) fixed and re-reviewed, Lows taken.
- Gates: CI `checks` run 45760301029 on `0580f154` (web: lint, format, types, unused, duplication, tests with coverage, build, scripts; fast tests; changed code; gitleaks) pass on attempt 2; attempt 1 failed one test this branch does not touch (`runLayout.test.tsx` tab title, read before its effect runs; passes 3 of 3 locally). Locally: `npm audit --omit=dev` exit 0; the browser file check passed 2 of 3 runs (the first failed in `checkRoutes`).
- Not verified: Safari and Firefox symbol output (their Playwright builds are not installed); printed purpose reports in a real print dialog; a real non-USD run; the merge with `main` at `932e252c` (only this file conflicted).

## 2026-11-26 — Copilot GPT Sol and GPT-6 Luna sessions at 1M context (branch `claude/copilot-1m-context-795226`)

- Scope: offline only, base `ef005f64`. No seat, provider or paid call; every result below comes from fake clients, the installed SDK 1.0.28 source and hand-computed answer keys. No session has been seen on the long tier.
- Owner (2026-11-26): "Full 1M" for GPT Sol and Luna; Claude Opus stays on its default tier; CP-3/5/6 compact limits raised; source reads "Read up to the hold"; one PR (over the 800-line cap).
- Built: in a run (`live_adapter_for` only; Signal stays on the default tier) copilot-sol-* and copilot-luna-xhigh sessions open with `context_tier="long_context"` when the seat lists a long budget of at most 1,050,000 tokens and long-tier prices no dearer than the hold's rates; the tier is confirmed after creation (10 s bound) and a session the runtime leaves on the default tier falls back to its limits and is guarded again. The hold counts 3 bytes per token for these configs (was 2): hold amounts unchanged, requests up to 3,137,712 bytes held. CP-3/5/6 stop where the hold would. Source reads go to the smaller of the hold and the seat's budget less 991,808 bytes (2,145,904 at a budget of 814,991 tokens or more), never below 1,100,000. A call holding two model requests settles at the sum of their readable charges (was: hold kept as unknown). The 272K first-prompt advisory is removed.
- Reviews: `/advisor` twice (Opus 5.5 xhigh, Fable exhausted); task review (`mx-precise`) pass; `mx-adversary` 1 Medium (two-request settle) fixed and re-reviewed pass; confidence review, rewrite tournament (one helper) and sweep discover; pre-merge `mx-architect` (Opus 5.5 xhigh) 1 Medium (read cap), fixed, then 1 Medium (read cap vs the seat's budget), fixed by a third round planned by `mx-autonomous`, re-review pass. Lows batched and fixed.
- Gates on the final tree: `tools/quality_gate.py` 0 findings; `ruff check` and `ruff format --check` on the changed files; `lint-imports` 3 kept; affected Python tests (adapter, pricing, budget, handoff loop/transport/read cap, Signal, reader run, launcher subsets) pass.
- First paid run's check: `session.usage_info.tokenLimit` in `live/raw/*.json` shows the long figure, not 272000; `calls.jsonl` charges for calls above 272K tokens.
- `/ship` review (high): 4 findings, applied on the owner's instruction (2026-11-26, "Apply these 4 code-review findings") as a fourth fix round, beyond the two-plus-one rule. CP-3/5/6 seeds keep the 100,000 / 160,000 limits until the tier is confirmed long; on the default tier reads stop at half of what the session's guard admits (271,286 bytes for gpt-6.1-sol at 272,000 tokens); the seat's default-tier prices are checked before pinning and logged when dear on an unpinned session; the COPILOT.md scope line. Gates rerun: quality gate 0 findings, ruff, format, mypy, `lint-imports` exit 0; 442 and 94 tests pass. The fix round had no review of its own.
- For the owner (predating or out of scope): the 3.85 bytes-per-token estimate understates Opus prompts; the reader run never compares a charge with its hold; whether a hold should cover two model requests in one call.
- Not verified: what a seat lists (long budget, prices, price unit, `billing.multiplier`); that runtime 1.0.105 honours `contextTier`, reports it truthfully and enforces the budget on real tokens; Copilot's long-tier billing; how often the runtime makes two model requests in one send; latency and cost of ~557K-token requests; mutation testing (`mutmut` not installed); the full suite and the web gates.

## 2026-11-26 — Offline replay: open items from the entry below resolved (branch `claude/replay-open-items`)

- Scope: branch cut from `main` at `5e4f9aee` (PR 97 merged). Same real TDG Deep replay `20261125-162721-01` (USD 0, no provider call), viewed from the same copy of its root. No paid run; the build ran no provider.
- Earnings label: the cash flow history says "EBITDA", not "Adj EBITDA" (`cashflow.py` labels and notes); the web readers accept both forms, so libraries published before this still read. `NET_LEVERAGE` is defined once.
- Forward credit model downside (the handoff item, ruled by the coordinator: the tables and the machine block must describe one case): the launcher now recomputes the downside from the machine block and refuses a handoff whose stated downside net leverage differs from it, with a repair request naming the two ways to agree (a pre-shock downside interest rate, or no shock and full downside drivers); the instruction says the same. Tested on the real handoff: it is refused as written (7.39x stated, 6.81x / 6.29x / 5.82x computed) and both repairs pass. The check fails open, logged, where either side cannot be read.
- Reader: the Forward credit model lead draws the upside case; Validation no longer reports an unread contradictions list where the module wrote a map, fills "Affects" and states its clearance note; Forecast states the module's case rationale, a stated zero funding gap as stated, and "no quarter column that can be read"; Ratings keeps the note under its register and states its notice once; Market-implied risk says "Not drawn." with the module's reason; a cell holding both a reference and a limitation keeps the limitation; "Stated, not drawn" replaces "No figure" for the stated FCF / debt fractions.
- Evidence and trace: "Escalation consequence" columns are shown (seen on the real page: Downside, handoff line 214); "Downstream module affected" only where every cell is within this analysis; a Basis line after a list covers the items before it; the Forecast gap horizon is read from the Years column; Evidence links name the table. Chips (Python): a row's own source id, web keys, an n–n page range as one page, upstream chips in reader words, and list-form `## Sources` read into the inventory (this run: issuer-page chips 0 before, 1,524 computed after); a heading and its table-id tag count as one register.
- Signal accent (left unchecked on PR 97): the hosted Signal pages use the theme's tokens and are already blue; no change.
- Whole-branch adversarial review (independent, on the diff): 0 High, 2 Medium, both fixed with the reviewer's probes run: the downside repair request could not converge (its remedies are now ones that pass both checks, tested), and the chips fix had no effect on the real run because its inventory was empty (list-form sources are now read). Three Lows taken. The fixes had no second review.
- Final state: rendered check 75 of 75 at 1440, 1280 and 1024 on the final build; tsc, build, eslint, prettier, knip, duplication exit 0; web tests 8,963 of 8,965 in a loaded run, the two that failed (`ReportLibrary.design` filter, `case-choice` S5-010) pass alone (26 of 26); CI's Python set 2,267 pass and 1 fails (`test_actual_adapter_classification…`, the macOS temp-root limit, as before); launcher tests 1,094 pass, 1 skipped; quality gate 0 findings.
- Open: five modules' bottom-line paragraphs carry no Basis of their own (handoff content; not invented here); 191 chips cite a page without a source key and the peer module's web key is not in the inventory (55 chips, labelled); `ForecastRecord.tsx` still keys only "Adj EBITDA"; the model's block is named "Downside shock" where the reader says "Downside case"; the committee challenge ledger's presentation; four review Lows.
- Not verified: the replay copy's published library was not regenerated, so the chip fixes, the "EBITDA" label and the reworded quarter-column message are proved by tests on the real handoffs, not seen on the replay pages; that a module follows the new downside instruction (needs a paid run); no confidence-review or rewrite-tournament of the diff; trace drawers beyond the cases above; widths below 1024; any run but this replay.

## 2026-11-26 — Credit screening pathway: CP-0, CP-1, CP-DR and the five-screen CP-L10, cap USD 10 (PR #102)

- Scope: offline only. No provider call and no paid run; the five screens' handoff is a hand-written synthetic one (`tests/fixtures/credit-screening/CP-L10.md`), checked column by column against the method. No real Credit Screening run exists.
- Built: pathway `credit_screening` ("Credit screening") with its cap in `PATHWAY_CAP_USD` and `RULED_CAPS_USD`; a method and register lookup by pathway, with each module's present method as the default; in this pathway only, CP-L10 is sent the archived five-screen method (cp-os `b57a344`) and its 20 registers TL10.1 to TL40.4 are required and checked; CP-DR's handoff is an optional input of CP-L10; the module reads "Credit screening" in such a run. `short_snapshot` stays deactivated and unchanged.
- Presentation change and its fidelity check: the run start page offers the pathway; in the issuer library CP-L10 leads Overview, Changes and Modules, the Modules lead shows the five screens, registers are held in Evidence, and Forecast says no model was published. Checked against the synthetic handoff by the PR's tests (`tests/test_credit_screening_pathway.py`, `tests/test_credit_screening_method.py` and the web tests beside the changed pages); no rendered browser page was checked.
- Other pathways: reviewers' probes compared instructions, roles, request messages, module names, plans, caps and manifests with the base byte for byte, and the existing golden requests and method pins pass unedited.
- Coordinator's own check on the PR head `8d7d64e0`: the preset, both cap entries and the `api.test.ts:92` change read as ruled; `tests/test_credit_screening_method.py`, `tests/test_pathway_tiers.py` and `tests/test_credit_screening_pathway.py`: 149 passed.
- Gates at `8d7d64e0`, reported by the PR's controller: `tools/quality_gate.py`, `lint-imports`, 18 affected Python test files and the web lint, format, type, unused and duplication checks: exit 0. The whole web suite exited 1 locally: `ConnectedApp.test.tsx` timed out under a load average of 52 and passes alone (228 tests); CI is its gate.
- Reviews: task reviews approved (the web task after fix rounds), cap audit no High or Medium, confidence review 2 Medium fixed, pre-merge review 3 Medium fixed then pass, review of the two merges with `main` pass.
- Owner, 2026-11-26: the method trimming of `main` ("apply to all modules") applies to the five-screen method too ("Yes, trim it"): 104,782 characters become 101,334; three sections that cannot apply in this transport and eight exact repeats are cut, no register lost.
- Not verified: what a real model writes for the five screens; whether a run completes within USD 10 (on `copilot-sol` each call reserves USD 7.17, so a call can start only while spend is at most USD 2.83); the Changes page with a real earlier run; accessibility and end-to-end browser tests; the full Python suite. Known and left: the Coverage filter and matrix headers name the module "Short credit snapshot" for every pathway.

## 2026-11-26 — Recommendation calculation: best result across instruments; Unrated against "and below" (PR #100, merged as `bf06af10`)

- Scope: synthetic and deterministic only; `src/deploy_workflow/recommendation.py` and its tests. No caller exists yet, no real constraints or holdings file, no real run.
- Rulings applied (owner, 2026-11-25, `docs/rulings/2026-11-25-deliverables-and-recommendations.md`, "Two rulings after PR 2"): a portfolio's recommendation is the best result across every eligible instrument, each held to 3 on its own limit breach, naming the instrument it rests on; an Unrated instrument against a rating limit worded "and below" that does not name Unrated is "not read". Tie key (coordinator): not capped before capped, then the better Valuation, then the instrument's name.
- Coordinator's own check against merged `main`: a clean B loan (Valuation 2) and a CCC second lien (Valuation 1) against a breached CCC limit read Modest OW resting on the B loan in both list orders; for an Unrated instrument, "Max CCC and below", "Max CCC & below" and "Max B and lower" read not read, "Max CCC and below incl. Unrated & Other" reads breached, "Max BB and above" does not apply: pass.
- Gates at `bdb12fb2`, reported by the PR's controller: `tools/quality_gate.py`, `lint-imports`, `tests/test_recommendation.py` with `tests/test_quality_gate.py` and `tests/test_repo_rules.py` (392 tests): exit 0. The PR 2 reviewers' probes `adv_tie_order`, `wb_two_instruments`, `rr4_ampersand_rating` failed before and pass after. Mutation at `60639e74`: 1,024 mutants, 994 killed, 30 survivors, none in the changed functions. CI on the PR head: four checks passed.
- Reviews: task review approved, calculation audit nothing at Medium or above, pre-merge review pass; no fix round. Low findings closed in two small commits.
- Consequence to know: an Unrated instrument against a breached "CCC and below" limit is not capped (the limit is shown as not read), so it can be the portfolio's result ahead of a rated instrument held to 3.
- Not verified: mutation after the last, test-only commit; any real file or caller; Unrated wordings outside the closed word lists (they stay not read). Predates this change: "Max CCC and below, unrated excluded" reads breached for an Unrated instrument.

## 2026-11-25 — Instruction and reference length: review and offline measures

- Scope: review only; no method text, launcher, prompt or presentation changed, no provider
  called. Added `docs/sweeps/2026-11-25-instruction-length/REPORT.md` with two baseline files,
  `tools/instruction_metrics.py` and `tests/test_instruction_metrics.py`. Trimmed here: the two
  oldest entries (2026-11-16), at the merge with `7391207`.
- Checked: `tools/quality_gate.py` exit 0; `tests/test_instruction_metrics.py` 3 passed, expected
  values counted by hand from a literal text. The tool's deep and lite totals (1,815,970 and
  677,194 characters) equal `tools/cp1_check_proof.py --instructions` on the same tree.
- Corrected while checking: a first count of unsent reference files (347) was wrong; they are
  sections of bundles that are sent. The measure now excludes them (5, all CP-0).
- Offline stage of the trial (third pass): `tools/instruction_trial.py` and
  `tests/test_instruction_trial.py` (5 passed; gate exit 0), four restructured method texts under
  `trial/arms/C/` written by agents, and `offline/` results. Groups A, B and C of CP-3, CP-4, CP-5
  and CP-6 were prepared from the PR #87 bundles (TransDigm 2024-09-30, outdated) and run through
  the real executor and check with a stand-in provider: no id dropped in any group; the retained
  CP-3 handoff fails today's check in every group. No provider called; `live` mode never run;
  the C texts were not read against their sources by a person; `rewrite-tournament` not run.
- Fourth pass: reading lists for CP-3, CP-4, CP-5 and CP-6 under `trial/reading/` (75 items; 239
  quoted source passages, each matched exactly to its page or handoff by script; expected values
  not checked by a person), the pilot ruling `docs/rulings/2026-11-25-instruction-length-trial-pilot.md`
  (`check_ruling` accepts it for `copilot-opus-high` only) and a trial-wide cap in the script
  (gate exit 0). Nothing was run live. Then, on the owner's instruction ("model is anthropic api
  opus high"; "Lift the guard yourself for this trial"), the ruling names `opus-high` and the
  script alone calls the Anthropic API directly; the engine's Copilot-only guard is unchanged.
  `tests/test_instruction_trial.py` 9 passed; the live path was dry-run with the network call
  replaced, never sent.
- Pilot (fifth pass), on the owner's instructions ("use key from here", "run all offline and live
  test concurrently", "raise the turn limit if a run hits 32", "run the blind reading when the
  runs finish"): fourteen live single-module runs on `opus-high`, 285 calls, none failed, USD
  54.83 settled against the USD 54 limit; ten accepted handoffs scored blind against the fixed
  lists by agents. Records in `docs/sweeps/2026-11-25-instruction-length/pilot/`. One run per
  group: no difference between groups can be claimed. The key came from the launching
  environment only; no key is in the repository (checked by search of the copied records).
- Before the full trial (owner: "do the six fixes, then run the full trial"): CP-4's covenant
  headroom rule now names the four Direction words (`cpos_launch_tables.py`); two pins in
  `tests/test_cpos_launch.py` recomputed with the reason; that file 1,001 passed with the
  end-to-end and every-pathway tests left out; gate exit 0. Reading lists version 2 (bundled
  items split; 332 quoted passages matched by script). Ruling
  `2026-11-25-instruction-length-trial-cp4.md`. CP-2H's rating-trigger rule had the same gap and
  was given the same words afterwards (owner: "fix the CP-2H chart wording too"); no run showed it.
- Full trial of CP-4 (sixth pass; owner: "do the six fixes, then run the full trial", "approved
  for both", "apply the recommendations and re-test as group D and compare with prior runs"): 19
  accepted live runs in four groups on `opus-high`, plus a first-pass reader on `claude-haiku-5-5`
  for group D; USD 98.53 settled of USD 101. Every accepted handoff but D-1 scored blind twice
  against the 61-item list; readers agreed on 98.5% of scores. Records and scores in
  `docs/sweeps/2026-11-25-instruction-length/trial-cp4/`. `tests/test_instruction_trial.py` 12
  passed; gate exit 0. Three to five runs a group on one case: leads, not findings. No person
  has checked the readers' scores. Keys came from the launching environment only.
- Applied (owner: "apply recommendations"): CP-4 is sent its method without the block's repeats
  (`TRIMMED_METHODS`); its sent text equals trial group B's byte for byte (`cmp`); other modules'
  instructions unchanged (`cmp` on CP-0, CP-3, CP-6). `tests/test_cpos_launch.py` less the
  end-to-end and every-pathway tests, `test_instruction_trial.py`, `test_methodology_selection.py`,
  `test_method_scripts.py`, `test_cpos_register_scope.py`: passed, four pins and assertions
  changed on purpose with the reason beside each; gate exit 0. Not run: the end-to-end tests,
  any live run of the applied text (group B's three runs stand for it).
- Then every module (owner: "add now apply to all modules"): checked for all 22 method blocks by
  script (no register or table id lost, every required register and file heading present); the
  same test files plus `test_library_index.py` and `test_update_library.py`, 1,562 passed, the
  end-to-end and every-pathway tests left out; 19 more method-block pins recomputed. No live run
  of any module but CP-4 on the trimmed text.
- Reading notes in the engine (owner: "CP-4 now, probe CP-0 and CP-1", "Copilot, add a cheap
  model"): `owners/cpos_reader.py`, launcher `--reading-notes`, the library comparison;
  `tests/test_cpos_reader.py` with the launcher, trial, method, register and library files,
  1,571 passed (end-to-end and every-pathway tests left out); gate exit 0. Off by default. Then (owner: "gpt luna xhigh"; "probes no live
  re-run") `owners/cpos_reader_run.py`, the reader on `copilot-luna-xhigh`: 6 tests with a stand-in
  adapter. Never run on a provider (no Copilot login here); no live launch with notes; Luna is not
  the reader the trial tested.
- Readers for CP-0, CP-1, CP-2, CP-3 and CP-5 (owner: "add D to the other modules, run offline
  test, then PR"); none for CP-6. Offline: `tests/test_cpos_reader.py`, `test_cpos_reader_run.py`,
  `test_instruction_trial.py`, `test_library_index.py`, 86 passed; CP-4's brief and rule unchanged
  (compared with the version before). No model run of any of the five; no run evidence for them.
  Merged `main` at `bc0a025` (conflicts in this file and `.importlinter`; both sides kept).
- Pre-merge review (`mx-architect`, code and instruction changes): no High, four Medium, five Low.
  The four Medium (a live CP-5 rule dropped by the trim; reader notes lost for a source in a
  subfolder; a missing or partial notes folder accepted; summarised or cut-off replies kept as
  notes) fixed by `mx-feature`, only the first test-first for all cases by its own account;
  rechecked here: 118 passed in six test files, CP-5 keeps the rule, gate exit 0. Not run in
  this session (skills absent): `confidence-review`, `rewrite-tournament`, the refactoring sweep,
  `adversarial-reviewer`.
- Not verified (second pass adds the parts of one request and a trial review; nothing built):
  any effect of length on module output (no model run); token figures are estimates; the overridden and requirement counts are keyword counts; guidance read
  from search extracts where the report says so. `confidence-review` was a self-check of the
  measures against the prepared instructions; `rewrite-tournament` was not run (one small tool).

## 2026-11-25 — Offline replay: four rendered failures fixed; 15 module pages and Forecast validated

- Scope: branch `claude/replay-render-fixes` = `claude/screen-review-fable-agents-3cdf56` merged with `main` at `73912078` (PRs 81, 82), then the fixes. Real TDG Deep replay `20261125-162721-01` (USD 0, no provider call; a test assembly, not a delivery), viewed from a copy of its root (`~/cos-live/tdg-replay-copy-8f`; the original is held by the earlier viewer on 8767 and was not changed).
- Merge: eight conflicts resolved keeping both sides; the redesign's choices stand where they met `main`'s (no `DotStrip`, both leverage tiles on one mark). Five stale test expectations corrected (Segmented is buttons, Full cap USD 30, Maturity gap text, a fixture missing `unplaced`).
- Fixed: (1) Overview Forward path and the Forward credit model panels: `forwardPath` took a case from every column with a start date, so the real model's reported columns became cases "Fiscal year" and "Last twelve months"; cases are now forecast-period columns only, and a value label that would print over its neighbour is left out. (2) Forecast uses of cash: the outside labels of one bar are stacked a line apart ("0" stays stated). (3) Earnings changes: results and margins sit side by side only from 1280 px. (4) Found by the check after those: the Forecast path's period axis leaves out a label that would collide at 1024.
- Rendered check (`check-render.cjs --widths 1440,1280,1024`, Overview, Forecast, Changes, Evidence, Calendar and all 20 module pages): 75 of 75, no failures (63 of 72 before). Gates: tsc, eslint, prettier, knip exit 0; web tests 8,273 pass; quality gate 0 findings.
- Validation against the run's handoffs (four independent read-only reviews; every figure, period and stated gap checked matched; confidence scores recomputed and equal): 5 of 16 pages passed with notes only, 11 failed. The frontend findings were then fixed and re-reviewed by two further independent reviews (scoped to the findings fixed), with two more fix rounds for what those found.
- Fixed after validation, each with a test fed the real handoff text: appendix registers written at `###` (gap ledgers, source gates, evidence-id registers) go to Evidence, not Statements; "Evidence" and "Source / Limitation" columns that carry qualifications are kept; machine-keyed registers and raw key columns (`cp2.…`, `cpdr.adoptions`, `cp1_references`, `question_id`) are held in Evidence and "calculation R9"-style ids are not reader text; Limitations follows Contrary evidence. Lead tiles now read the real shapes instead of "This page could not read …": fulcrum class and no switch for scenarios that do not exist; peer levels and the instrument matrix; clearance sentence, gap register and actions; committee stance (no confidence invented) and the bear cross-examination; the foreign-currency gap in the module's words; the earnings quality bridge with each step's support as written (the challenged 15 not drawn as a rejection) and leverage on every basis with its delta; break points and stressed multiples (unitless long fractions stated as written, not drawn; a qualified cell labelled by its multiple with the whole cell as a note; cases named by the module, the control included). Fundamental credit's leverage card shows net beside total with its note; covenant tests carry their conditions, the chart note and basket formulas. Forecast assumptions say "As base" where the model inherits base; the Forward credit model chart draws the upside case.
- Whole-branch adversarial review (independent, on the 65 files changed after the merge): 0 High, 3 Medium, all fixed with the reviewer's probes run (P2a, P2b, P6a, P6c pass): module-written conclusions after the appendix heading stay on the module page (a section there is a register unless it is prose with no table); `downstream_use` and `consumer_module_id` columns are drawn nowhere again; a bridge step whose support the module states is not labelled "(support not read)". One Low taken: a bridge closes on its final total, never a subtotal. The five changed test expectations were judged acceptable. The fixes were confirmed on the real pages; they had no second review.
- Final state: rendered check 75 of 75; tsc, eslint, prettier, knip, duplication exit 0; quality gate 0 findings; web tests 8,317 of 8,317.
- Second merge of `main` at `51687adb` (PRs 84 to 95) for PR 97: one conflict (this file). `main`'s `start/standingPortfolios.ts` sat beside `StandingPortfolios.tsx`, one module on a case-insensitive disk, so it is renamed `standingPortfoliosModel.ts` (the branch's rule for such pairs); its comparison test now presses "Start no-cost test", the redesign's label. After it: tsc, eslint, prettier, knip, duplication exit 0; web tests 8,345 pass; repo-rule and React service tests 661 of 662 (`test_actual_adapter_classification…` fails here only because the macOS temp root is over the 80-character limit); quality gate against `main` 0 findings; gitleaks no leaks. The rendered check was not re-run after this merge.
- Third and fourth merges of `main` for PR 97 (PR 96, then PR 83 at `6eb2c01c`, Signal hosted by the application): conflicts in this file, `docs/design/screen-map.md` (both wordings kept), `ConnectedApp.tsx` (Signal route added to the redesign's not-found page; the preview wrapper kept with `bleed`), and `signal/web/signal.css` (deleted with the standalone Signal server it styled; the branch's blue there goes with it). After: tsc, eslint, prettier, knip, duplication, build exit 0; web tests 8,939 pass; repo-rule, React service and Signal tests 834 of 835 (the same macOS temp-root failure); quality gate 0 findings. Not checked: whether the hosted Signal pages from `main` follow the blue-accent ruling; the rendered check after these merges.
- Open (frontend): "Adj EBITDA" is a fixed label (`cashflow.py` history labels and five web matchers) where this model's basis is reported EBITDA; `modelLead.tsx` still omits the upside case; Validation still says it could not read a list of contradictions (the module wrote none as a register) and its remediation table's "Affects" column is empty; "Downside scenario S02", "Case description not recorded", a bare dash for a stated zero funding gap and "no quarter column Python can read" on Forecast; a bare "T4.10" is not matched as an id; a cell holding both a file reference and a limitation draws "In Evidence"; Ratings drops the note under its rating register and states one notice twice; Market-implied risk withholds its chart without saying so.
- Open (handoff, owner decision): the Forward credit model's downside tables hold interest flat (7.39x, cover 2.16x) while its machine block gives only a shock, so the published model draws 6.81x / 6.29x / 5.82x and 1.64x; both reach the reader. Validation ratios written to 37 decimals.
- Review Lows left open: the stress panels draw "No figure" for the stated FCF / debt fractions (the values are in the notes beneath); the foreign-currency gap is found by keyword; the leading-multiple pattern and `NET_LEVERAGE` exist in more than one file; `forwardPath` finds forecast columns by label though the model flags them.
- Not verified: no confidence-review or rewrite-tournament of the diff; trace drawers and most of the Evidence page; widths below 1024; any run but this replay; the Python suite beyond the launcher tests the merge touched (113 pass).

## 2026-11-25 — IN PROGRESS: live Sol screen test on real output (handover)

- Ruling `docs/rulings/2026-11-25-tdg-all-modules-copilot-sol.md` (owner: three runs, cap USD 70 in
  all, `copilot-sol-medium`; SEC contact set by the owner in `~/.zshenv`; test-only adaptations:
  re-dated quotes read as current, CP-4C told to assume distress). Plan: scratch
  `live-sol-plan.md` summarised here. Runs live in `~/cos-live/tdg-all-sol-20261125/_engine/runs`
  (outside the repo; inputs are copies, originals' hashes unchanged).
- Done: `test-tdg-lite-sol-b1` Lite, 5 of 5 accepted, USD 2.23; `test-tdg-lite-sol-b2` Lite plus
  CP-L10 compared with b1, 7 of 7 accepted (CP-8 included), USD 2.55.
- `test-tdg-deep-sol-a`, Deep preset, 20 modules, cap USD 40, `--test-assume-distress`: **stopped
  at CP-2E turn 3, 10 of 20 accepted** (CP-0, 1, 1A, 1B, DR, 1C, 1D, 2, 4, 2A), USD 5.71 settled.
  Cause: the gh account's GitHub Copilot **monthly quota is exhausted** (`quota: You have exceeded
  your monthly quota`), recorded as `sent_unknown`, so one call hold (USD 7.17) stays counted
  against the cap (`model/loop.py`). Relaunch only once a gh account with Copilot quota is signed
  in (`gh auth status`), with the same command and cap; accepted modules are not re-sent:
  `COPILOT_USE_GH_LOGIN=1 COPILOT_CLI_PATH=~/Library/Caches/github-copilot-sdk/cli/1.0.105/prebuilds/darwin-arm64/copilot-runtime
  uv run python -m deploy_workflow.owners.cpos_launch --context ~/cos-live/tdg-all-sol-20261125/context.json
  --sources ~/cos-live/tdg-all-sol-20261125/sources --config copilot-sol-medium --cap 40 --prior none
  --ruling docs/rulings/2026-11-25-tdg-all-modules-copilot-sol.md --test-assume-distress
  --out ~/cos-live/tdg-all-sol-20261125/_engine/runs/test-tdg-deep-sol-a --live`
- New engine code: `--test-assume-distress` (off by default; refused without the ruling's grant, from
  the run start service and without live permission; recorded as `test_adaptations`; such a run is
  scope `partial` and never a comparison base). Adversarial review: pass after one fix round;
  launcher tests 1,116 pass; quality gate 0 findings.
- Screens on the real Lite output (viewer: `python -m react_frontend --root
  ~/cos-live/tdg-all-sol-20261125 --port 8766`, started without the Copilot variables): Overview,
  Changes, Calendar, History, Evidence, export and seven module pages checked against the accepted
  handoffs and fixed; web tests 8,021 pass; rendered check 43 of 45 at 1440/1280/1024 (open: on
  `#modules/CP-1` an axis "0" touches a period label at 1440 and 1024; a fix was in progress and
  may be half-applied in `report/leads/foundation/`).
- Owner, after the quota stop: "use what you have no further runs or use offline data". Offline
  replay, USD 0: the no-cost proof engine (a scratch copy of `proof/`, repo untouched) fed the real
  retained answers (Sol: today's 10 Deep modules and the 16 Nov subset's 2H, 3D, 3C, 4C, 3, 5, 6;
  Opus: CP-1, 2E, 2D, 2G) for a full Deep TDG report, root `~/cos-live/tdg-replay-20261125`, run
  `20261125-162721-01`, start script `SP/replay/start.sh` (SP = this session's scratchpad; lost on
  reboot). Test assembly, not a delivery: pins are restated by the proof launcher. Sol's CP-1 was
  refused by CP-2G ("no table cell of CP-1 is at row `Net sales`": Sol writes `NET SALES`; the
  cross-module row match is case-sensitive, an engine finding), so CP-1 is Opus's. Rendered check
  63 of 72: overlaps on CP-2G (all widths), #forecast "0"/"92" (all), #overview "5.12x"/"4.41x"
  (1280, 1024), CP-1B labels outside at 1024. Validation of those pages stopped unstarted (Fable
  limit). Done in the entry above.
- To do (superseded by the line above for the Deep run): finish the Deep run (CP-2E, 2D, 2G, 2H, 3D, 3C, 4C, 3, 5, 6); validate its 13 further module pages, Forecast and Overview; scoped
  re-review of the narrowed print citation rule (`export/printTable.ts`); final gates; replace this
  entry with the result.
- Found on real output, outside the frontend (not fixed): "Nine months ended …" periods match no
  period-table row (CP-1 method); CP-0 writes a content map, not the readiness table; CP-2A states
  no numerical stress; the builder's catalogue has no headline row for nine-month revenue;
  `publishedReport.ts` `containsReference` misses a register id such as "T4.9"; the PDF capital
  table omits "Cumulative leverage"; a liquidity trace shows pages with no passage;
  `changes.py:832` can emit a code as a module title; Calendar prints "Published Not supplied" on
  every row; Coverage has no Short snapshot column.

## 2026-11-25 — All-screens design review and fixes; blue accent; no module codes; desktop only

- Scope: the connected frontend on `claude/screen-review-fable-agents-3cdf56`, uncommitted (254 files).
  Owner's rulings (2026-11-25): "review all screens and apply all relevant /impeccable skills";
  "apply all fixes once the reviews finish"; "change the green used throughout to blue" and "change
  those greens to blue too"; "remove module IDs" and "remove module IDs from evidence and trace
  drawer too"; "no phone screen related work, app is only desktop". Recorded in `DESIGN.md`,
  `PRODUCT.md` and `docs/design/screen-map.md`.
- Review: eight screen groups (shell/Library/Coverage, Run start, Run activity/progress, Overview,
  Changes/Calendar/History, Modules, Forecast, Evidence/trace drawer/export), each a design critique
  then detector and rendered check: 0 P0, 21 P1, 65 P2, 24 P3. Findings that occur only below
  1024 px were dropped. Each group's reviewer applied its own findings, then looked at its rendered
  screens at 1440, 1280 and 1024 and fixed what it saw.
- Changed: accent teal → blue `#1D4ED8` (Info is slate; chart series 2 plum, 5 violet long-dashed,
  6 light blue; HTML Model, Signal and Teams positives the same blue). Module codes are drawn
  nowhere; `moduleName`, `serviceText` and `readerText` rename exact methodology codes only, so
  "CP-backed" and "CP-10" stay as written. "Start run" is the one primary action in the top bar.
  Motion for live run state with a still cue under reduced motion. Three source files whose names
  differed only by case (`moduleFrame.ts`, `evidenceSearch.ts`, `moduleRecords.ts`) are renamed
  `…Model.ts`; before that the build failed on macOS.
- Fidelity check (presentation change): `check-render.cjs --widths 1440,1280,1024 --stress` on a
  fresh synthetic Northbridge run (`proof.serve`, no provider call): Library, Coverage, Run
  activity, Run progress, Run start, Overview, Changes, Forecast, Evidence, Calendar, History and
  the 14 delivered module pages: 75 of 75 pass. `drive-synthetic-run.cjs` completed the wizard,
  the confirmation dialog and the run on the changed interface. Scope: layout and states on
  synthetic text; not a check of content against a real run.
- Gates (web): lint, format, typecheck, audit, knip, duplication, script tests, build and the
  file check exit 0; vitest 463 files, 7,986 tests pass, coverage 96.7% statements. Python:
  `tools/quality_gate.py` 0 findings; `tests/test_brand_tokens.py` 11 pass (its four expected
  greens changed to the web register's values on the owner's instruction).
  `tests/test_package_react_windows.py::test_selected_sources_include_the_react_design_specs`
  fails until the design documents are committed: it compares `HEAD` with the working tree.
- Left open: Overview row 5 leaves about 330 px blank in Forward path at 1280 and the header chips
  wrap to three lines at 1024; the trace tooltip can cover a neighbouring control
  (`report/PublishedTrace.tsx`); a waiting row repeats the held reason (`runActivityParts.tsx`);
  the validation lead repeats the bottom line as its fallback (three tests pin it); the confidence
  meter on a blocked module and the "14 against 15 modules" wording on Run start need the owner;
  the older static library's `--green` (`apps/issuer-library`) and the Teams mockup are unchanged.
- Not verified: paid mode on Run start (not rendered); a real Running run (states drawn from
  fixtures); module leads with no delivered output in the synthetic run (CP-1B, 1C, 1D, 2H, 3D, 4C,
  L10); print through the OS dialog (Playwright `page.pdf` only); the last small edits of the
  rendered round were gate-checked on the rebuilt pages, not each looked at; the full Python suite;
  Windows and Linux builds after the renames; no whole-branch adversarial review has run.
## 2026-11-25 — HTTP base: parameters no service sets are deleted (branch `claude/zealous-wright-h66pam`; written on PR 83's head, re-checked on `main` after PR 83 merged)

Scope: `src/deploy_workflow/http_base.py`, the one override in `run_start/service.py`, `tests/test_http_base.py`. Deletion only; no provider, handoff, module or page change; no model call.
- Checked first: a search of every `.py` outside `.venv` found no user of the per-address limit, the connection deadline, `response_headers` or a `read_body` override outside the base and its toy `strict` test service. On `main` Signal's standalone server still sets all four, so this change is valid only on top of PR 83.
- Deleted: the per-address half of `connection_limits` (now an `int`) and its bookkeeping; the deadline timer with `setup`, `_expire` and `finish`; `response_headers` and its loop; `read_body`, folded into `sized_body`. With them the toy `strict` service, its three tests, and the comparisons and pins that named these parameters. Every other assertion is as it was.
- Tests (loopback sockets only): `tests/test_http_base.py`, `test_run_start_service.py`, `test_react_frontend_signal.py`, `test_react_frontend.py`: 340 passed. Quality gate with `--base 5f2927a`: 0 findings; `lint-imports`: 3 contracts kept; strict mypy on the two source files: clean. Commands ran as `uv run --no-config` (the container's uv is not the pinned version).
- Review: plan critique before the work and one independent review of the diff, by models other than the implementer.
- Not verified: the full and slow suites; Windows; `confidence-review` was done by hand (the skill, `rewrite-tournament`, `/sweep` and `adversarial-reviewer` are not installed in this cloud session).
## 2026-11-25 — Signal runs inside the one application process (PR #83, branch `claude/lucid-feynman-bvglyi`)

- Scope: local and synthetic only. Spec `docs/superpowers/specs/2026-11-25-signal-one-process.md`, plan beside it. `python -m react_frontend` in live mode answers `/signal/api/*` itself through `signal.service.answer` (`react_frontend/signal_host.py`) and runs Signal's loop in one thread started by `serve`; not in the read-only preview or synthetic mode. Removed: `react_frontend/signal_forward.py`, `--signal-url` (both commands), `run_start.service.signal_link`, the `signal serve` command and its server, `Start signal.cmd` (purged from an existing package folder), the `credit-os-signal-url` meta (now `credit-os-signal` = `on`).
- Money (spec 4.4): the hosted loop is given the process environment only when `CREDIT_OS_SIGNAL_AI` is exactly `1`, read once when the host is built; otherwise an empty read-only mapping. Tests with a fake key, a recording model factory and a fetch that raises: keys present and no switch gives an empty environment, gate off for want of a key, no model built by `run_once`, by "run once now" or by start-up recovery, `ai_usage` 0 rows; `1` passes the mapping; twelve other values stay off. Reviewer mutations (switch ignored, truthy, read from the process) failed 3 to 18 tests each.
- Method: seven tasks, one implementer subagent each, then a spec-compliance and a code-quality review by other subagents, findings fixed before the next task; a whole-change review ran the plan's adversarial cases. It found one defect, repaired test-first: `//signal/api/me` was answered by Signal without its two response headers.
- Gates on the tree merged with `main` at `bc0a025` (two merges; conflicts in this file, both sides kept, and in `signal/fetch.py`, where main's `Rules`/`fetch_document` and this branch's declared contact, body cap and `check_form` were combined; 565 tests of both sides pass on it): `tools/quality_gate.py` 0 findings, `lint-imports` 3 kept, strict mypy clean on the changed modules (three known `import-untyped` errors elsewhere). Targeted pytest, CI's markers: `tests/test_signal_*.py` 1,754 passed; `tests/test_react_*.py` and `proof/test_launcher.py` 420; run start, HTTP base, packaging, repo rules, reference portfolios 574. Web: 8,766 tests in 493 files, lint, format, typecheck, knip, duplication, build, 78 script tests, file gates, audit, all exit 0.
- Test changes: the forwarder's upstream tests, the `--signal-url`/`signal_link` tests, three start tests of the removed server and its per-address and deadline tests went with their subjects. One expected value changed: a POST body that stalls gets no reply and one log line (the 400 "the request body did not arrive" was only ever sent on Signal's own port). Three inputs changed to the application's rules, which the forwarder already applied: no body on DELETE (two tests), a 400-character search text (the 5,000-character one is now sent through `service.answer`).
- Differences from the spec: section 7's search still finds the removed names in tests that assert they are absent or refused, in the packaging purge list and in dated records; comments and two test titles in `web/src` beyond `connected-main.tsx` were reworded; the 502 branch of the web client is kept for a proxy on the way.
- Not verified: no real browser was driven for this change; no live feed, SEC, FRED, publisher or model request was made, so the hosted loop's first live fetch and first paid pass are unproven; `python -m react_frontend` was not left running for hours. `tests/test_reporting_currency_proof.py` fails 2 of 5 (Forecast rows, GBP and CHF) on this tree and identically on `main` `51687ad` alone; it passed before the merge. Open for the owner: whether audit ruling R8 (the application works offline) needs a recorded exception now that approved sources are fetched in the application's process (spec 4.5); `python -m react_frontend` configures no logging, so Signal's INFO lines and timestamps that `signal serve` printed are gone while `/signal/api/status` still says "see the log"; the unused per-address and deadline hooks left in `http_base.py`; the ruling `2026-11-25-signal-ai-pass.md` still says "the Signal service".

## 2026-11-25 — Signal: issuers, filings, daily market post, source logos; screens to the redesign

Scope: `src/deploy_workflow/signal/` (issuers, filings, market, logos, migration 7) and
`web/src/pages/signal/` at the merge with main `f6cebbd`. Spec:
`docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md`.

- No SEC, FRED or publisher request and no model call was made by the build or its tests; a
  test guard fails any Signal test that reaches the real network. EDGAR and FRED documents in
  tests are synthetic, written in the published formats.
- Lead's runs on the merged state: 1,745 tests in `tests/test_signal_*.py` pass; 357 server,
  run start, pathway and packaging tests pass; quality gate 0 findings in 105 changed files;
  `lint-imports` 3 contracts kept; strict mypy clean on 47 files. Web: 67 files, 1,639 tests in
  the Signal, shell, app, connected-app and style suites pass; lint, typecheck, format, knip,
  duplication, build, script tests and file gates exit 0.
- Real browser (Chromium, seeded service, `react_frontend --signal-url`, 1280 and 375 px): the
  98 functional checks of every earlier control pass on the merged build. The new issuer pages,
  Filings tab, market card and logos were NOT driven in a browser; they are covered by unit and
  rendering tests only.
- Review: one adversarial round on the backend (format gating, the SEC contact string, approval,
  market arithmetic against an independent oracle on 30,000 generated files, issuer matching
  against an oracle) found one top finding (filings and market posts reaching digests and the
  digest model call) and others; all were fixed test first and the oracle probes rerun with 0
  mismatches. The fix pass, the logo service and the React wiring for these features have had
  no independent review.
- Presentation (fidelity scope: the Signal screens only). Brought to `DESIGN.md`: channel list
  as a tile beside the page from 960 px, Channels button and left panel below; type ramp, radii,
  no card shadows, 32 px controls and 44 px on a phone; mono numerals for counts, times and
  dates. New: Issuers in the channel list, an issuer page, a Filings tab, the market post as a
  dated table in its card, Settings → Issuers, source logos in the letter tiles (from `data:`
  URLs built from the service's JSON, never another site's address). Today's page asks for
  snapshot format 2; format 1 is unchanged for any other caller.
- Known limits: the top bar wraps to two rows between 480 and 589 px with four areas (shell);
  reader words "n.a." and service refusals naming ids; "AT&T", "3M", "GE" need a longer alias;
  stores opened by earlier commits of this branch are refused; the first live SEC, FRED and icon
  fetches are unproven; the ICE BofA series' terms are for the owner to confirm.

## 2026-11-25 — Signal's AI pass ruled by the owner; merge with main

- The owner approved the AI pass on 2026-11-25 ("approve AI pass") and chose a monthly cap of
  USD 25 when asked. `docs/rulings/2026-11-25-signal-ai-pass.md` records both (configuration
  `copilot-luna-xhigh`, `cap_usd: 25`); the draft is removed. On a fresh store `signal ai status`
  names the ruling and still reports the pass off: no cap is set and no key is in the
  environment, and `signal ai cap 30` is refused as above the ruled USD 25. No model was called
  here; the live proof is still the owner's separate step. 527 AI, command-line, service and
  digest tests pass with the ruling in place (they use their own rulings folders).
- Main (`4aaec9d`: frontend redesign, Coverage page) is merged at `236fb83`. After it: 1,469
  Signal tests, 190 React server tests and the whole web suite (474 files, 8,254 tests) pass.
  The test guard against a live adapter now covers tests that import the Signal package only;
  the run start tests build the adapter over a stand-in on purpose. The Signal screens still
  carry the layout made for the previous shell; bringing them to the redesign is in progress and
  will be recorded when checked.

## 2026-11-25 — Signal: React screens on the service, steps 3 to 6, four review rounds

Scope: `src/deploy_workflow/signal/`, `react_frontend/signal_forward.py`, `web/src/pages/signal/`,
the connected app's rail and `/signal` route, at `8986ebe`. Owner instructions of 2026-11-24:
wire the React screens to the service and remove the plain page; build backend steps 3, 4, 6,
then 5; the narrow layout and the controls listed below.

- No model or provider was called and no ruling was added. Every AI test is SYNTHETIC: a fake
  model, or the real `CopilotAdapter` class driven by its test rig's fake client. A live proof is
  a separate paid step. `docs/rulings/` holds no Signal ruling, so the pass is off; the draft
  for the owner is `docs/superpowers/specs/2026-11-25-signal-ai-ruling-draft.md`, outside the
  rulings folder, with its date, cap and answer left blank (`signal ai status` on a fresh store:
  state off, ruling missing).
- Lead's own runs on the final state: 1,469 tests in `tests/test_signal_*.py` pass (none
  skipped, React reader present); quality gate 0 findings in 86 changed files; `lint-imports` 3
  contracts kept; strict mypy clean on 38 files. Web: 327 files, 5,704 tests pass; lint,
  typecheck, format, knip, duplication and build exit 0 (run at `7f23e62`, before the last
  backend-only pass). Forwarder, packaging and HTTP base: 300 tests pass (at `1e89eed`).
- Contract between the two sides: every snapshot the Python tests build is read by the real
  `readSlice` from `web/src/pages/signal/slice.ts`; `snapshot.sample.json` is generated by the
  service and read by the web tests.
- Real browser (Chromium, a seeded service and `react_frontend --signal-url`, 1280 and 375 px),
  lead's run on the final build: 98 checks pass — name, save, follow, share with a note, comment,
  reply, react, edit and remove a comment, group create, rename, delete, members, topics and
  rules, Top order with a discussed older story first, a thread delivered without comments
  filling when opened, real refusals shown as the service's sentences. Every request went to the
  app's own origin.
- Reviews: four adversarial rounds on models other than each builder's, each followed by a fix
  pass, test first, with the reviewers' scripts rerun. Round 1 found a snapshot one writer could
  push past the forwarder's 4 MiB cap (reproduced: 260 posts blanked every screen); the worst
  reachable store now builds to 2.86 MB in 0.39 s. Round 3 found the ruling read once per job (39
  digest calls after the ruling was deleted; now 1) and a month's cap drainable through digest
  runs (now 5 paid digest calls a name and 50 a service a UTC day, 10 a pass). Round 4 found
  nothing that spends without the four preconditions, past the cap or past the day ceiling; its
  findings are fixed and three of its scripts rerun by the lead (store id, digest bypasses, a
  full day blocking other digests). The fourth fix pass itself has had no independent review.
- Presentation changes (fidelity scope: the Signal screens only; issuer library and report pages
  untouched). Design-reference app: story cards group strength, stage, rating moves and the AI
  line under one AI mark, "also in" on its own row; below 1024 px the channel list opens from a
  sticky Channels button as a panel from the left; group actions in an even grid; the Sources
  table shows four columns until 1536 px and scrolls in a labelled region when narrow; the AI
  section's line reads "The switches show the state of each part. They cannot be changed here."
  (owner approved, 2026-11-25); an empty Digests list says "No digests yet". Live page only:
  writer controls enabled and wired; per-group thread rules; one In Signal switch per
  notification event; Digests in a reader's Settings; sentences when threads or sources are left
  out. Checked by measurement at 320, 375, 414, 768, 1024, 1280 px (no element past the right
  edge, page region 320 to 956 px) and by looking at the screenshots.
- Known limits, not fixed: identity is a typed name, so writer actions are open to whoever types
  a writer's name (spec 5.2; owner powers stay on the command line); a provider rate limit counts
  as an unknown cost and switches the pass off until `signal ai clear` (spec 5.10); whether USD
  0.3585 bounds one exchange's bill needs a live run; marking a thread read can miss one comment
  committed within milliseconds of the snapshot; a store made by an earlier commit of this branch
  is refused; digests at the cap skip their period's stories; SQLite waits 30 s for a lock while
  the forwarder gives up at 5 s; the GitHub workflow changes could not be run here.

## 2026-11-25 — Recommendation calculation: roll-up, 5×5 table, valuation bands, limit caps (PR #96, branch `claude/pr-2-recommendation-80b887`)

- Scope: synthetic and deterministic only. One pure module, `src/deploy_workflow/recommendation.py`; no file read, no provider call, no real run, no real constraints or holdings file. Nothing calls it yet (the workbook, plan PR 4, will).
- Answer key: `docs/methodology/portfolio-recommendation.md` sections 4 to 7 with the owner's four rulings of 2026-11-25 (exactly ±40 bp is a 3; per-instrument proposal on the instrument's own Valuation; eligibility by asset type; a limit is breached on no headroom, a breached status or a price below the floor). `tests/test_recommendation.py` (329 tests, the 25 table cells and both worked examples as literals, `hypothesis` properties): pass at `a62df0de`.
- Coordinator's own check, written from the methodology and run against the PR's module: 25 table cells, both worked examples, the 12-factor threshold, an exact half, the Liquidity floor and every band edge: pass.
- Gates at `a62df0de`, reported by the PR's controller: `tools/quality_gate.py`, `lint-imports`, and `tests/test_cp2_scorecard.py`, `tests/test_reference_portfolios.py`, `tests/test_quality_gate.py` (359 tests): exit 0. Mutation (`mutmut` 3.8.1): 971 mutants, 942 killed, 29 survivors justified as equivalent or reason-text only.
- Reviews: three task reviews, a calculation audit (arithmetic correct by hand; 1 High and 6 Medium in limit-row matching, fixed) and the whole-branch review (1 High, 2 Medium, fixed in one wave, re-review approved). The limit code took four fix rounds and a fix wave; the fourth round and the sector-name fix were allowed by the owner. A limit row the code cannot tie to the issuer that the file shows breached, or shows nothing readable on, is "not read" and counted on the result, never a silent "does not apply".
- Not verified: limit wording outside the closed word lists (such rows come out "not read"); any real constraints or holdings file; units (levels are taken in basis points, conversion is PR 4's); the 29 surviving mutants' equivalence by a second tool; the reason wording with a reader. Parked for the owner: with two equally attractive instruments the limit check rests on the first listed.

## 2026-11-25 — Prose rules to checks: repo-rules tests and gitleaks in CI (branch `claude/prose-to-checks`)

- Scope: `tests/test_repo_rules.py` (14 tests, fast-tests job) checks `VERIFICATION.md` < 1000 lines, `AGENTS.md`/`CLAUDE.md` ≤ 200, no tracked credential files, no `.superpowers/` tracked, no provider secrets in workflows, the two tracked `.xlsx` inputs, and at most one allowed workbook writer in `src/`/`apps/` (none today). Answer keys hand-written; reviewer probe `task1_workbook_import_forms.py` exit 0.
- `secrets` job: gitleaks 8.30.1 (SHA-256 pinned) over tracked files, archives to depth 2, inline allows ignored; on PRs also every commit in `origin/<base>..HEAD`, failing closed when that range cannot be resolved (adversary probes exit 0); local run exit 0; planted fake key exit 1; same key under an allowlisted path exit 0 (accepted blind spot: `docs/work-pc/`, `docs/audit/2026-11-16-final/`, 43 digest findings, none a credential).
- Oldest entries (2026-11-16, 42 lines with the separator) trimmed; git history keeps them.
- CI on ubuntu-latest: fast-tests and the `secrets` job (tree and PR-history steps) passed on PR 95. Pre-merge fixes: download retry, `secrets.GITHUB_TOKEN`/`needs.secrets` and credential-name false positives (tests first).
- Not verified: the curl retry path; rewrite-tournament skipped (test-only and sub-15-line scripts).

## 2026-11-25 — Reference portfolios: intake, index holdings fetch, comparison portfolio at the launcher (PR #84, branch `claude/cool-gates-o27q8z`)

- Scope: synthetic fixtures only (`tools/synthetic_reference_portfolios.py`, `tools/synthetic_portfolio_exports.py`); no owner CLO pack, no live SSGA file, no provider run.
- Intake: CLO pack CSV/XLSX and header-driven holdings workbooks read into typed dated portfolios; missing vs zero, error markers, unpriced rows kept and flagged, malformed FIGI, exact par/MV with currency, buckets on the portfolio validator's scale. `tests/test_reference_portfolios.py`, `tests/test_portfolio_export.py`: pass.
- Fetch: offline through injected wiring only (deadline, 8 MB ceiling, content type, `.xlsx`, ZIP checks, same-host redirects, previous set kept on failure, one fetch per key). `tests/test_reference_fetch.py`: pass.
- Launcher presentation change (Documents step: Standing portfolios block; Compare against another portfolio). Fidelity check: jsdom tests that each line shows the stored as-of date, position count, failure message and previous as-of exactly as the service returns them; golden request files unchanged for a run with no comparison portfolio. `tests/test_run_start_standing_portfolios.py`, `tests/test_run_start_reference_portfolio.py`, `StandingPortfolios.test.tsx`, `ComparisonPortfolio.test.tsx`, `requests.comparison.test.tsx`: pass.
- Adversarial review of fetch and parsing: 13 confirmed findings repaired test-first; probes re-run hold.
- CI on PR head `80858f2` (this PR on top of PR #82): all three checks passed, including the full web suite; the local C2-002 `ConnectedApp.test.tsx` timeout under coverage load did not recur there.
- Not verified: the SSGA files' real layout, date order, content type and redirects, and live reach of www.ssga.com (refused by the build environment's proxy); the owner's real CLO pack; real-browser rendering of the two launcher blocks; the 1904 date-system reading against Mac-authored files.

## 2026-11-25 — Chart periods: every supplied period, one order, periods on X

- Scope: the owner's ruling of 2026-11-25 (all periods; oldest fiscal year → latest → YTD/PYTD →
  LTM → PF → forecasts; periods on X), desktop only. Spec
  `docs/superpowers/specs/2026-11-25-chart-periods.md`. One rule, `src/deploy_vii/period_order.py`
  and `web/src/utils/periodOrder.ts`, both tested against the hand-written
  `tests/fixtures/period-order-cases.json` (82 labels, 52 unparseable, 12 orders). Labels are read
  strictly: any unknown word or number makes a label a stated gap, drawn last as written.
- Changed: CP-1 strips S.1–S.3, S.5 plot every T4.14 period with a fact (no four-quarter rule);
  S.4 in maturity-date order; `PF` period type; Markdown chart routes, the catalogue and Changes
  order by the rule and take the latest reported period (never PF or forecast; refused when
  dated and fiscal-labelled actuals mix); HTML Model M1–M3 rule order, annual only by contract;
  issuer-library reader charts, tiles and legacy trend/path/comparison charts take order and the
  latest from the store; connected trend, path, forecast, Overview and foundation lead charts.
- Gates on the final tree, all exit 0: `tools/quality_gate.py` (0 findings, 27 files, 5,201
  lines); pytest period_order, financial_series, chart_period_delivery, credit_os_catalogue,
  credit_os_store, cash_bridge, cpos_cp1_check (875), changes and model_shell_browser (694),
  cpos_launch `-k "period or net_debt or chart or strip or figure or model"` (241); issuer-library
  node tests (830); web typecheck, lint, format:check, unused, duplication; vitest
  `connected/report` (2,560), the rest of `connected` (2,038), components, utils, model, library,
  styles, App, data (2,571). Python/TypeScript differential: 2,450,436 labels, 0 differences.
- Before/after: the branch's tests run against a `main` checkout at `4aaec9d1` (only the new rule
  module and a one-class stand-in added where a test imports them) fail as expected: strip and
  maturity-order tests, Markdown ordering, store and node chart tests (14), five web "LTM and PF"
  tests (34 of 90 in their files). The M1–M3 and shell-note tests fail there only on a missing
  helper; their behaviour was shown by a mutation run. The mixed-form refusal was already a
  refusal on `main` and is a guard. Issuer-library browser tests on the final tree: 103 passed,
  1 skipped.
- Fidelity check, synthetic data only: CP-1 strips with 11 periods rendered through `render_svg`
  with the shell CSS and viewed (labels turn 45°, all present, rule order, values equal the facts);
  the shell shows the unplaced-period and annual-only notes (headless Chrome test); issuer library
  at 1440 (reader chart and Forecast card X order, values equal cells; tiles headline LTM, a
  PF/forecast-only tile shows a dash and says why); connected trend chart and leverage path in a
  scratch build at 1440 (X order, values against ticks). Foundation leads checked in jsdom only.
- Open, not fixed: on an 11-period S.1/S.2 strip the Y tick labels lose a character on the left;
  interest cover, net debt strip and bars, and Periods still show periods as rows (spec, "Not yet
  compliant"); `NET_DEBT.rules` asks one form per table, stricter than the check now enforced;
  `financial_reconciliation.py` and `statement_validation.py` can still pick a PF balance by date.
- Not verified: any real or retained issuer run; a desktop browser on the connected foundation
  leads; `tests/test_financial_workflow.py` (exceeds the 5-minute limit); the weekly suite;
  Windows. No paid execution.
- After merging `main` (PRs 79, 80 and 81, to `0b18fdb`): quality gate 0 findings; targeted
  pytest 1,705; whole `test_cpos_launch.py` 1,077 passed, 1 skipped; web typecheck; vitest 578
  (PR 81's, `ConnectedApp`, period rule); the K6 CI timeout in `ConnectedApp.test.tsx` was PR 80's fix.

## 2026-11-25 — Deliverables, Credit Snapshot workbook and recommendations: rulings and methodology

- Scope: documentation only; no code, test, instruction or presentation changed, no provider
  called. PR 0 of `docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md` (owner,
  2026-11-25: "Approve, start"). Added `docs/rulings/2026-11-25-deliverables-and-recommendations.md`
  and `docs/methodology/portfolio-recommendation.md`; amended four bullets of `AGENTS.md` (one
  permitted workbook, the proposed-recommendation exception, the Deliverables page in the reader
  and completion bullets; cap sentence untouched); one `METHODOLOGY-REVIEW.md` paragraph. Trimmed
  here: the oldest entries, all 2026-11-16 (the last three at the merge with `f6cebbd`).
- Checked: the rubric's 85 level cells against the spec by script; `tools/quality_gate.py` exit 0
  (no Python in scope); `check_live_gate` refuses the new ruling for all four configurations, run
  directly (the test that sweeps `docs/rulings` and one other in `tests/model/test_gate.py` are in
  `tests/known-failures.txt` and fail the same way without this change);
  `tests/test_methodology_selection.py` and `tests/test_package_react_windows.py` pass. No test
  pins the changed `AGENTS.md` text.
- Review: one fresh reviewer, pass with fixes (6 Medium, 11 Low; no transcription error). Wording
  fixed; open points are in the ruling's Left open. Pre-merge review: 1 Medium (quote
  attribution), 6 Low, all applied, including four mock-up cells corrected to the table (3 MW).
- Owner's answers (2026-11-25, "1. later 2. is fine 3. fix 4. fine 5. fine 6. update it"): three
  rubric cells amended in the spec and the methodology (Leverage 4, Market share 2 and 3, wording
  the coordinating session's); the four readings confirmed; `PRODUCT.md`'s Excel line amended.
  Probe: the two changed rows, written by hand from the coordinator's message, match both files.
- Not verified: anything the documents describe, none of which is built; the rubric text against
  the owner's image (not in the repository; taken from the spec's transcription); the SSGA file
  columns; the full suite.
## 2026-11-25 — Layer 1 modules in Lite, Full and Deep; CP-DR in Lite; caps 20/30/50 (branch `claude/busy-shannon-x4bwy3`, base `main` at `4aaec9d`)

- Scope: the `lite_credit_assessment` and `credit_snapshot` presets (`contracts.py`, web `api.ts`),
  their report sections (`report_view.py`), the two cap tables (`PATHWAY_CAP_USD`,
  `RULED_CAPS_USD`), the cap sentences of `AGENTS.md` and `PRODUCT.md`, the Deep card's question,
  three synthetic proof handoffs and the tests that pin these. Ruling
  `docs/rulings/2026-11-25-layer-1-in-all-assessment-pathways.md`; `METHODOLOGY-REVIEW.md` entry.
  Registry, method files, `changes.py` and delivery code unchanged. No provider was called.
- Owner, 2026-11-25: "all credit assessment pathways (lite, full and deep) should include all layer
  1 modules"; "lite runs cp-dr too, user only provides comps if they want to at launcher."; "raise
  cap to 20/30/50". The second and third were relayed by the coordinating session; the cap raise
  was confirmed in this session ("Yes, raise to 20/30/50"). That the purpose pathways stay at USD 20
  is the coordinating session's reading.
- Modules: Lite is CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-1C, CP-1D, CP-2, CP-2A (9 calls without
  CP-8). Full gains CP-1B, CP-1C, CP-1D (17 calls; run order CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-1C,
  CP-1D, CP-2, CP-4, CP-2A, CP-2E, CP-2D, CP-2G, CP-3C, CP-3, CP-5, CP-6). Deep is unchanged: Full
  plus CP-2H, CP-3D, CP-4C. CP-DR runs in all three; CP-1C takes its peer pack only with the default
  peer source (CP-DR's public peers), otherwise no pack is requested. Comparables are optional.
- Coverage page: its fixed columns follow Full's preset, so 14 become 17; a Full run made before the
  change shows CP-1B, CP-1C and CP-1D as not in the pathway (disclosed in the ruling; no layout
  test covers the column count).
- Sections: Lite (9 to 12) and Full (12 to 15) gain headline results, earnings quality and peer
  positioning, owned and placed as in Deep; the peer figure draws in both. Fidelity scope: synthetic
  handoffs only, through the launcher and library browser tests for Lite and Full (7 passed); no
  delivered report from a model was read.
- Instructions (test input): Lite 416,093 to 669,952 characters, Full 1,468,993 to 1,650,316; each
  ceiling rose by its measured increase. The seven other pathways are byte-identical.
- Caps: Lite USD 15 to 20, Full 25 to 30, Deep 40 to 50; the rest stay 20. Kept and tested: `--cap`
  above the pathway cap is refused, a folder's cap never rises, start-up refuses a table entry above
  its ruled figure. The page reads its caps from the service; web fixtures and 18 goldens changed
  only in cap figures.
- CP-8: an earlier preset Lite or Full run stays the comparison base; the pack marks the added
  modules as run now and not before, and the checker accepts `New` only with cause `Method change`
  (`tests/test_changes.py`, synthetic).
- Cost, estimate not measured (GPT Sol, Balanced, with CP-8 and one USD 5.73 hold): Lite about
  USD 11.2, Full 19.7, Deep 22.2. Claude Opus at 2.26 times: Full with CP-8 is about USD 31 to 41
  with a hold, past USD 30; left open for the owner.
- Review: one independent review of the diff. It found four tests still at Full's 14 modules
  (`test_react_coverage`, `test_react_runtime_identity`), the proof script's "14 of 14 modules", the
  legacy-cap rule without a discriminating test (restored: a table entry of 12 gives 12, and the
  test fails under `return LEGACY_CAP`), cent slips in the ruling and kit copy at the old Full cap;
  all repaired. Left: the kit's saved example run (`web/fixtures/run.json`, USD 25, 13 modules).
- Commands, exit 0: `uv run python tools/quality_gate.py` (0 findings, 16 files); pytest, not
  browser, one file at a time: 87 files, 6,857 passed (`test_financial_workflow` timed out under
  parallel load and was not rerun); browser files for the library, launcher, changes, model shell
  and signal pages passed; web `tsc`, eslint, prettier, and the whole vitest suite (461 files,
  7,899 passed).
- Not verified: no paid or live run exercised the new presets or caps (no Lite run of any kind
  exists, nor a Full run with CP-1B, CP-1C, CP-1D); CP-DR's web lookup feeding CP-1C in Lite; the
  three sections in a delivered report; the Changes page against a real earlier run; the cost
  estimate; a resume of a real folder started at an old cap; `npm run proof:connected` (needs
  Chrome, Edge and a built `web/dist`); `test_reporting_currency_proof` (same); the Coverage page at
  17 columns in a browser; the slow Python tests.

## 2026-11-25 — Export PDF control and preview restyled to the redesign

- Scope: presentation only, `ReportExportPreview.tsx` and the screen rules of `reportExport.css`.
  Export PDF is a quiet header utility beside Run progress with the redesign's menu; the preview
  has one toolbar tile (format and issuer, state, Close preview, Print / Save PDF, the headers
  note) above the paper. No wording, option, route or print rule changed; follow-on item 21 done.
- Fidelity: looked at in the browser at 1440 and 390 on the synthetic run's Credit Snapshot.
  Under print media the toolbar is not displayed and the paper has no border or radius, as
  before. `check-render.cjs` passes the Overview at four widths; on the preview it reports only
  findings inside the paper's own content, unchanged by this work: axis labels of the small
  Debt maturities chart overlap, and one table scroll box in the paper is not named.
- Tests: export tests (79), reader tests, lint, format, types, knip and the file gates pass. A
  regex in the file now writes its quote as `\u0022`: the class check's string reader lost its
  place there and misread every class after it.

## 2026-11-25 — Redesign merged with main (issuer front page, PDF exports, complexity splits)

- Scope: `origin/main` at `59e476b` (PRs #73, #77, #78) merged into
  `claude/exciting-albattani-v1zoug`; 13 conflicts. Owner's rulings (2026-11-25): the redesigned
  Overview stays on screen and main's front page composes the Credit Snapshot PDF only; main's
  decision rule applies to the redesigned pages.
- Kept from main as written: Export PDF and the `#export/<format>` preview, the print layout, the
  publication contract (one admitted run per folder, verified scope, the published lead), the
  Python side. Ported into the redesigned pages: ticker and financial-period facts, scope labels
  on History and the Library, the Library's choice of the run a row stands for under each pathway
  filter, its verified credit view and lazy specialist finding (now sharing the row's one
  request), related reports. Kept from the redesign: RunActivity, RunProgress and Coverage (main's
  changes there were splits with no change a reader sees; its two tests of the old Coverage
  controls and four of the old Key charts section were dropped with those controls).
- Decision rule on the redesign (content change): the call is the run's published credit view,
  matched by output, hash and line for a verified publication only, never a committee or relative
  value passage; a relative value or portfolio run leads with its purpose findings. No stance
  chip and no was → now move. Each decision says why it is not shown, or its recorded hold with
  the hold's source. Security selection, market-implied risk, evidence validation and the
  committee write no bottom line on the Overview; an unheld module's limitations stay listed, a
  held one's are noted as elsewhere only when something is missing, as main computes it. History
  shows Not shown, Withheld or Unavailable per decision; the Library cell reads "Not shown".
- Tests: full `npm run gates` passes on `4d5e937` (461 files, 7,898 tests with coverage, audit,
  knip, duplication, build, 78 script tests, file gates). Python: 1,883 passed, 2 skipped (need
  retained data or a screenshot path), including every test that reads the built pages and the
  currency proof; main's targeted publication tests (246) pass.
- Fidelity (presentation change): `check-render.cjs` on the merged build over the synthetic run,
  25 pages at 1440, 1024, 480, 479 and 390: 83 of 125 passed; all 42 failures were the Export PDF
  button at 36 px on a phone, fixed and rechecked on five pages at three widths with no failures.
  The merged Overview was looked at at 1440.
- Final review before merge (Fable, independent): do not merge until one item was fixed; all
  seven findings repaired in `4d5e937`. Blocking: the Overview drew the changes module's bottom
  line, which can restate the stance and which main kept off the Overview; the tile now points
  to Changes. Also: the lead's pointer to the gaps ledger, passage names in the call, a Library
  decision note false for runs with no committee module, run counts and same-date runs, and
  main's two Coverage tests restored against the redesigned controls (not dropped, as first
  recorded above).
- Judged changes: the PDF's masthead and rules take the redesigned theme's brand tones (teal,
  where main's spec named navy and ultramarine; spec updated). The Export PDF control and preview
  keep main's markup, not yet restyled. Follow-on items 20 to 22 record what the merge left open.
- Trimmed the oldest entries to keep this record under 1,000 lines.

## 2026-11-25 — Frontend redesign: every screen rebuilt and merged

- Scope: the ten redesign branches (Run activity and progress with the module pipeline; Evidence
  and the trace drawer; Changes and Calendar; report header, Overview and History; Library and
  Coverage; Forecast; the module page frame; the module leads for all 22 modules; Start run)
  merged into `claude/exciting-albattani-v1zoug`, plus the coordinator's integration commits.
  Design authority `DESIGN.md`; the map of what each screen shows is `docs/design/screen-map.md`.
  Delivery still adds no analysis: every branch was reviewed adversarially for derived numbers,
  page-made judgements, false gap reasons, hidden content and machinery in reader text, by
  independent reviewers on each round and a final review before each merge, on retained TransDigm
  FY2024 handoffs (outdated evidence, used for shape only), the proof handoffs and the synthetic
  Northbridge run. No paid run, no provider call.
- What the page sends at Start run is unchanged: 19 recorded request transcripts from 18 drives
  match byte for byte in CI mode, and independent drives (every pathway, re-pressed options,
  edits after review, failures and retries) are byte-identical to the old page's captures.
  Consent gating, caps (Lite 15, Full 25, Deep 40, purpose pathways 20) and `X-Shown-Cap` are as
  before.
- Integration review (independent, of the coordinator's own commits): six defects, all repaired
  in `3759f22` and `f708842` with tests that fail without the repair. A prose-only chart section
  was drawn twice on four Financials leads, once denying it ("could not read"); a records address
  (`#modules/<code>/records/<table>`) threw on a malformed escape and did nothing on a change
  within the module; phone styles start below 480 px, not at it; several phone targets were
  narrow or short; the limits disclosure had lost its chevron. The render check itself was
  lenient (a hit on a parent counted, width unmeasured) and is now strict.
- Fidelity check (presentation change): `docs/design/preview/check-render.cjs` on the final
  build over the synthetic run, every page (14 module pages, a module's records, Overview,
  Changes, Forecast, Evidence, Calendar, History, Library, Coverage, Run activity, Start run) at
  1440, 1024, 480, 479 and 390: 113 of 125 passed on `f708842`; the 12 failures were all 24 px
  event-lane marks sitting 2 px apart, fixed in `b40da32` and rechecked on every page with a lane
  (30 page widths) with no failures (no sideways scroll, no unnamed scroll box, no cut
  text, no target under 32 px or under 44 px below 480 px in either dimension, no text under
  12 px, no overlapping chart label). Screenshots were looked at for the pages each review names.
- Tests: full `npm run gates` on `b40da32` passes every step (lint, format, types, 454 files and
  7,737 tests with coverage, audit, knip, duplication, build, 78 script tests, file gates). Python
  front-end tests (15 files, 295 tests) passed on `c632e84`; the currency proof (5 tests, pound
  and franc, reading the built pages) passes on `f708842`, and its new checks fail on a wrong
  value. Quality gate 0 findings. Known timing-sensitive tests (pass alone,
  fail only under load): the connected app's "reads the published handoff…" (wait raised to
  10 s), `report.auditFollowups` T17, and `ReportLibrary.design` under parallel runs.
- Not run: the confidence-review and rewrite-tournament skills are not in this session; the
  independent review above stood in for the first, and a comparison of the changed parsers kept
  one address parser (the scroll to the records reuses the router's).
- Judged changes to record:
  - Forecast prints the model's published display ("118"); exact values are in the calculation
    download, which the currency proof now checks for the downside path and base interest.
  - The Overview figure row is the financial foundation's own figures (revenue, EBITDA, cover,
    leverage, cash with undrawn facilities), as the screen map asks; the catalogue's total
    liquidity and free cash flow are in that module's records.
  - "Will refuse" at Start run keeps the error red (`DESIGN.md` now allows red for a refusal).
  - `DESIGN.md` reader words: machinery (handoff, registers, ids, file names) stays on Evidence;
    "module" is the reader's word outside a lead, so gaps such as "The module wrote no such
    passage" stay. Leads keep the stricter rule (no "the module"), enforced by test.
- For the owner's local validation (rendering only; content findings were all fixed):
  - Overview: with a three-sentence bottom line the first headline figure starts near y=900 at
    1440×900; about 160 px empty under the call tile.
  - Module pages: tiles take their content height, which leaves holes beside a taller neighbour
    on several leads (about 500 px under Downside's break points and Rates' added interest);
    Ratings and Covenants, and Liquidity and Restructuring, still look alike; a one-edge map on
    Business & governance leaves space beside its side column; the paragraph trace sits beside
    the text, not at the tile edge.
  - Financial foundation: "1,158"/"1,160" labels collide at 390 on cash interest; three pro forma
    marks at 4.88x overlap the dashed rule. Earnings delta, Ratings migration, Market-implied risk
    and Restructuring are not in the synthetic run, so their leads were seen only in test renders;
    nor is the portfolio limits disclosure (its chevron is checked in tests only).
  - Forecast: 4,617 px at 1440 (target 4,500); at 390 it is longer than the old page (chart-table
    list); headline figures are 20 px where the mockup has 36 (kit `StatsStrip` has no size
    option yet).
  - Top bar: between 480 and about 510 px the areas wrap to a second row (no sideways scroll).
  - Coverage: the matrix has one tab stop per cell (no roving focus); seven issuers and part of an
    eighth show at 1440×900.
  - Start run: Submit sits just below the first screen at 1280×800 and 1024×768 for three limits,
    and near 1,090 px with five at 1440; the dialog still says "Start a synthetic test?" (pinned
    by the recorded transcripts and scripts; your call); the Documents step is restyled rather
    than restructured.
  - Run progress: with a stopped run the feed heading is below the fold at 1280×800.
- Follow-on work the frontend cannot do alone: `docs/superpowers/plans/2026-11-25-redesign-follow-on.md`.
- Trimmed the two oldest entries (2026-11-16) to keep this record under 1,000 lines.

## 2026-11-24 — Frontend redesign: theme tokens and shell

- Scope: `web/src/styles/theme.css` re-valued under the existing token names and
  `web/src/shell/Shell.tsx` rebuilt as a top bar. No report, module, forecast or run page was
  rebuilt; their layouts are unchanged and only take the new colours, type and radii. No handoff,
  delivery or figure code changed, so no value, period, unit or source reference is affected.
- Fidelity check: static build opened from disk in Chromium at 1440 and 390 px (`#/` and `#/kit`):
  top bar, current-area tint and underline, buttons, badges, status marks, cards, metric tiles and
  timeline draw in the new palette with no page errors. No report page was viewed with real run
  data; the static build holds no report.
- Web tests in four targeted runs: 320 files, 5,459 tests pass. One ConnectedApp run-start test
  (leave-page prompt) failed once under load and passes alone, with and without this change.
  Typecheck, knip, build and the 76 script tests pass. Full `npm run gates` and the Python suite
  were not run.
- `chart-lightness.test.ts` is unchanged; chart series 1 and 2 are a shade deeper than the
  approved mockups to keep it.

## 2026-11-24 — Review fixes on the issuer front page and report exports

- Scope: eleven of the thirteen findings of the review of this branch, then the medium and high findings of two spec reviews and one adversarial review of those fixes. All under `web/src/pages/connected/`. Synthetic fixtures only; no provider was called, no retained handoff was read and no browser was used.
- A report sentence the delivery writes now says only what the document shows, and is tied to the same lookup as the exhibit it names. Module passages print whole: the cuts of amounts and qualifications, and a prefix capture that could stop inside a figure, are removed. A passage left out by the reference check is counted in its section. An unshown decision reads "not shown in this report" in the PDF and "not shown on this page" on Overview, which names the module page. A held decision's limitations are left out of the Overview list with a pointer to the module.
- References: a slash after a space is no longer a path; any `scheme://`, `//server/share`, drive and `file:/` forms are. The print check reads each block on its own, so neighbouring cells no longer block a PDF, and a content block has its own message.
- Also: specialist Overviews keep Key charts; unparsed debt terms show as written; cash and undrawn facilities stay when their basis cannot be shown; the differing-rating notice stays on Overview; a specialist card's finding is cached per publication.
- Checks on the final tree: 1,977 connected-page tests, TypeScript, lint and format on the changed files. The Python gate was not run; no Python changed.
- Not changed: the selectors written for one retained case, which need a module-side contract. Known limitations left as low: single-segment and bare relative paths are not caught as references; "P50" and similar read as page citations; some PDF text still says "available in Evidence"; a readable action output with no decision in it is still described as "this decision".

## 2026-11-24 — Issuer front page and report exports

- On the branch based on main `96bd0ef3`, the connected reader and chart suite passed 2,178 tests, and 371 targeted offline Python checks passed across the scheduler, publication and service runs. TypeScript, changed-file lint and formatting, the production build, the unused and duplication checks, and the changed-code Python gate passed. Chrome rechecked the retained TransDigm Overview, exact CP-1 row trace and 390 px layout. The saved A4 PDF preserved all four tranche terms and gross funded debt on page one, with zero link annotations.
- Integration confidence review checked older-run admissions, direct PDF routes, existing source traces and receipt stability across scheduler widths. A fixed publication clock preserves the scheduler test's byte comparison. The rewrite tournament kept the same-run export resolver beside the reader and kept exact metric identity for on-demand Evidence. No provider was called.

- Chrome verified TransDigm's retained 28 December 2024 debt stack with tranches I–L on A4 page one and the same desktop and 390 px Overview. Principal, floating margin, maturity and the CP-1 row trace matched the handoff. Tranches replace the USD 8,702 million aggregate only when the owning section, unit, count, individual fields and principal reconcile. Total funded debt of USD 25,228 million, liquidity restrictions and the leverage chart stayed on page one. Astra and the rewrite tournament kept the validated replacement, and the production build, scoped lint and 90 focused tests passed. The broader Python gate still reports findings outside this TypeScript and CSS change.

- The compact revision was verified using the earlier retained TransDigm 4 February 2025 and Caesars 5 November 2026 publications. In macOS Chrome, TransDigm page one shows the issuer profile, dated entered rating, USD 25,228 million of gross principal, the fully drawn USD 650 million July facility, USD 849 million of undrawn commitments, issuer EBITDA and cash-paid ratio labels, and the leverage chart. Caesars shows gross contractual principal and carrying value separately. Both saved landscape PDFs had zero link annotations, and the TransDigm tranche schedule remains in the exhibits.
- Native Overview was checked at 1,440 and 390 px after layout settled, including the exact TransDigm profile trace and the Caesars profile. The production build, scoped format and lint, and 388 web tests passed. Astra cleared the revision. Confidence review and the rewrite tournament kept the exact gross reconciliation and existing chart renderers with a smaller print plot. The broader Python gate reported 3,004 findings outside this TypeScript and CSS revision.

- Publication contract verified independently of presentation. Seven native historical reports and three explicitly qualified historical previews retained their receipt-pinned issuer, run, owner and handoff digests in isolated copies. Current-tier scope and publication time remain unverified for older completions. Candidate Markdown did not establish affirmative action or sizing clearance.
- Astra's adversarial recheck cleared publication after fixes for unpinned workflow scope, superseded output selection and pre-upgrade data. The follow-up admission and reader group passed 152 tests, and the final publication group passed 29. The isolated task gate found zero findings. Confidence review and the rewrite tournament kept explicit scope validation and simplified the optional comparison bound.
- Native Chrome Overview matched retained TransDigm on 4 February 2025 and 30 September 2024 and Caesars on 5 November 2026. The check covered selected-run identity, exact figures and qualifiers, three chart slots, source locator suppression, keyboard trace, an absent leverage denominator and 390 px layout without page overflow. The retained cases used earlier or partial scope, with no confirmed owned Model.
- Astra cleared the front-page review after repairs to unverified action display, visible section selection, retained limitations and amount units. The final focused groups passed 143 reader and 31 identity tests. TypeScript, scoped lint, production build, the isolated 13-file Python gate and 84 catalogue and publication checks passed. The rewrite tournament retained explicit ordering and chart ownership checks.
- Credit Snapshot PDF passed final saved-file checks on macOS Chromium. Retained TransDigm and Caesars print the decision, main qualification and figure strip on page one of four and three A4 landscape pages, respectively. Continuations carry full exhibits and repeated scope. Text, chart paths, annotations, unclipped bounds, exact missingness and the maturity, revolver, FCF and coverage qualifiers were checked against the selected handoffs with browser headers off. Synthetic long-table stress checked pagination separately.
- Astra cleared the Snapshot after fixes to mixed source locators and qualifications, exact verification of holds, private identifiers and financial table basis. The web check passed 412 focused tests, scoped formatting/lint and a production build. The browser action preserved the selected run and return tab and waited for printable geometry. Windows and packaged desktop proof remain open.
- All five specialist PDFs passed Chrome 158 A4 landscape checks with zero link annotations. The retained cases were TransDigm earnings, Ares Capital relative value, Life Time refinancing, iHeartMedia distress and LQD's Ares Capital holdings. Earnings, Ares and LQD used qualified historical previews. The checks covered exact unequal fiscal periods, clean and dirty yield differences, reported zero versus missing repayment, bounded downside cash flows, same-date held exposure and the relevant decision restrictions. B&G and Sotera remained unavailable from both menu and direct route.
- The final integration repaired unsafe held-action prose and holds without substantive Portfolio evidence. The retained Ares and LQD findings open the exact owner lines in Evidence. A synthetic dated yield chart prints its full maturity ticks and percent axis. The TransDigm Snapshot keeps its authored confidence and removes the reference to the gaps ledger. Native Chrome kept Overview, Changes, Modules, Forecast and Evidence on the selected run.
- The focused Python group passed 1,121 checks with one paid case skipped. The task-isolated quality gate found zero findings in 13 Python files. The prescribed worktree gate reported 3,000 findings against the broader dirty comparison. No provider was called.
- Final Connected reader and shared chart tests passed 2,158 checks in 138 files. Scoped lint and formatting, TypeScript, the production build and the open-from-disk check passed. The final Chrome Library cards for Ares and LQD matched the same first passage and exact Evidence owner and line opened by Overview. Both previews showed the held actions and returned to the originating run and tab. The card guards rejected a mismatched scoped response. Confidence review and the rewrite tournament retained the shared purpose selection and independently traced restrictions.
- Astra cleared the final integration after independently inspecting the saved PDFs, exact held-action and exposure treatment, same-run card and Overview proofs, and final test and quality-gate results.
## 2026-11-24 — Review fixes for PRs #72 and #71

- Scope: the thirteen findings of the review of PRs #72 and #71, on `claude/gracious-hamilton-ciefz4`. Presentation under `web/src/pages/connected/` and the parallel CP-OS path in `handoff.py`, `cpos.py` and `cpos_launch.py`. Synthetic fixtures and fake providers only. No provider was called and no retained run was read.
- Forecast page. The statement's source trace covers the columns shown. A period only one case publishes stays in the comparison and reads "Not published" for the others. Cases with no common period draw no comparison and say so. An excluded period is named with its reason. Case names are computed once per model; a label no other case shares is shown as published, and a collision gets the group's reader text or a worded ordinal. The selected case is matched by its raw group. Changes draws nothing for an empty module comparison. Run progress names the earliest unaccepted module at a checker stop.
- Parallel CP-OS. The last look is the final step before dispatch and checks the ledger before the module. A call it refuses, and a call the adapter did not send, is logged as `turn_not_sent`. A failed hold release never replaces the refusal, and a halted module's unreleased hold is named on the launch's failure. The launcher states one module at a time when retained handoffs force it. A launch-wide stop is worded as one.
- Checks run on the final tree: 1,874 connected-page tests, TypeScript, lint and format on the changed files; 247 targeted Python tests across the parallel, budget, handoff-loop and web-search files, 14 selected launcher tests with one historical case skipped, and the changed-code gate with zero findings. One connected-page test failed once in five runs while the Python tests ran alongside; it was not identified and did not repeat. The full suites were not run.
- Review. Two spec reviews and two adversarial reviews, each followed by repairs. The first fix to the turn event let a stop arriving during the event write through to dispatch; the look was restored to last and the test that covered it was restored. The adversarial reviews mutated the source in scratch copies: 18 of 19 web and 5 of 6 Python mutations were caught. The confidence-review and rewrite-tournament skills were not available in this session; the adversarial passes stood in for them. No browser was used; pages were rendered in jsdom.
- Known limitations, left as low. An `other` grid drawn as its own statement can show the no-common-period sentence beside a drawn comparison. One case that publishes a period twice gets a left-out sentence at the statement although both columns are drawn, and the trends section drops that period without a notice when no cash proxy row exists. A third case disjoint from two that share periods is drawn as "Not published" with no notice. The statement header applies reader text to a name where the cards do not. A `not_sent` reply whose release then fails leaves a `turn` with no `turn_not_sent`. A halt and a ledger stop met together now raise the ledger stop. At a width of three or more the run page may still name a bystander at a checker stop; not confirmed.
## 2026-11-24 — Coverage page (`/coverage`), first build

- New top-level page of the connected app and one read-only reply, `/connected/coverage`, under
  `docs/rulings/2026-11-24-coverage-page.md`. It reads the admitted publication only: fourteen
  fixed module columns, five cell states by the Library's existing rules, and fields from the
  Reader summary and typed `Chart data:` tables. It adds no parser, score, average or difference.
- Retained evidence, module level only: three TransDigm CP-1 handoffs of the 2026-11-15 live runs
  (as of 2024-09-30), each as its own publication. Leverage, net leverage and debt maturities kept
  the text, period, unit and Basis read by hand from each Markdown file, and each figure's line is
  its own table row. One issuer and one module: not a TDG pathway and not a cross-issuer case.
- Everything across issuers is synthetic: figures keep text, period, unit and Basis; a stated gap
  is listed apart, never ranked or shown as zero; a rank reads one reader-chosen period and keeps
  reporting units apart; the page draws no module code, hash, file name or run folder.
- Presentation fidelity, Chromium at 1500 px on a five-issuer synthetic publication: Modules, Rank,
  Find and Trend drew with no console error. Edge, mobile widths and keyboard use were not checked.
  The Evidence link's address follows `resolveEvidenceLocation` by reading; it was not clicked
  through to a published report.
- Review fixes, same day: text now comes from the current Findings sections (the synthetic
  current-format CP-2 gives its bottom line, three findings and three limitations); module text
  and Basis pass the reader's reference rule; adjusted headings join their reported measure;
  gaps count `## Gaps` entries and `Not supplied:` cells (the retained TDG CP-1 is no longer plain
  "Delivered"); absent modules are read against the run's recorded `requested_modules`, a new
  field of the published run; period order reuses the reader's `periodOrder`.
- Browser check repeated after the review fixes, Chromium at 1500 px, same five-issuer synthetic
  publication with recorded plans: Modules (gaps and "Not asked for in this run" drawn), Rank,
  Find by issuer name, Trend and an unavailable sector from the link drew with no console error.
- Not done: confidence-review and rewrite-tournament (their definitions are not in this
  repository or session), the full web and Python suites, and a check against the design system's component rules; the page uses native selects,
  checkboxes and tables as the Library list does.

## 2026-11-24 — Parallel CP-OS review fixes for PR #71

- Offline fake-provider runs reproduced a reserved call reaching dispatch after an unknown charge
  or overrun. The final check now uses the shared ledger and releases the unsent hold at zero.
  The original failure remains the recorded reason for the stop.
- At a USD 15 cap, widths 1 and 2 now both accept CP-0, CP-1 and CP-1A and settle USD 8.20.
  Funded workers still overlap. Admission checks the reloaded ledger, configured turns and
  attempts, hosted search fees, and exact pricing. An unavailable bound defers to serial calls.
- Tested interrupts before native startup and before Python bootstrap completed on CPython 3.13.
  Cleanup joins started workers and preserves the original interrupt. The library admission test
  now uses pytest's provider fixture and verifies a default-width launch.
- Scope covers synthetic handoffs, scheduler runs and library admission. The concurrency review
  and rewrite tournament retained the locked-ledger admission and the startup cleanup paths.
- Targeted offline pytest passed 1,315 tests, with one historical retained-run test skipped.
  The parallel scheduler file passed 70 tests. The changed-code gate reported zero findings.

## 2026-11-24 — Performance fixes on main `13b7d43b`

- Recovered staged code from the earlier integration and applied it to current main. The two overlaps shared route parsing between preloading and rendering, and retained the run-chart memo boundary. Astra reproduced a same-grid Forecast crash when `Upside` and `Upside case` got different names in the chart and table. Both now share the resolved name. The new same-grid test failed before the fix and passed after it, alongside the existing split-grid test. Astra cleared that fix and both overlaps in patch `b1a24422`.
- Confidence review checked read-only routes, one-use preload data, report chart output, exact Evidence links, and distinct scenario values and dates. The Chrome and Edge synthetic workflow exercised desktop and mobile Forecast, cash and debt figures, and keyboard source traces in `run-YRqxgd`. Its scope was the synthetic workspace.
- Passed 1,882 connected and route tests, 3,468 offline web tests, 581 targeted Python tests, and 76 Node script checks. Build, ESLint, formatting, the changed-code Python gate and 126 offline route probes passed. The Python rerun used a short temporary directory to stay within the app's 80-character workspace limit.
- Fallow found zero dead-code issues or duplicate groups. The six structural complexity findings also appear on main with the same scores.
- In the earlier integration on `2e488751`, six pages of the retained Caesars preview matched at 1440 × 900. Forecast preserved all 118 controls and showed the four recorded FY2029E date spans. The earlier scanner benchmark over the same 9,537 tokens took 41–43 ms versus 84–85 ms at `1112176d`. Other prototype results were 326 to 1.4 ms for the 25-run library index, 323 to 151 ms for a repeated identical report response, and 770 to 693 ms for cold Chrome Overview rendering.

## 2026-11-18 — Modules at once: an opt-in, off by default

- Scope: synthetic adapters and canned replies only, one shared Linux container. Nothing above
  width 1 has run against a live provider; no Windows. Ruling:
  `docs/rulings/2026-11-18-parallel-modules.md` (owner, 2026-11-18: "Parallel modules
  permitted.").
- Changed: CP-OS can run up to four modules whose producers are accepted at once
  (`--parallel-modules`, `CREDIT_OS_PARALLEL_MODULES`). The default is 1. Modules start and are
  accepted in plan order, one budget serves the run, and a reserve blocked only by another
  module's open hold waits for it to settle.
- Width 1, two independent reviews: 35 launches over 19 scenarios (clean, rejections, kills,
  interrupts, overruns, cap stops, relaunches) leave the same run folder, library, stdout and
  exit codes as before, apart from one new `launch_started` event that every reader ignores.
- Width 2 to 4: the cap held in every stress (3,114 rounds, never above the cap; no call sent
  twice), and accepted handoffs, deliveries and the library are byte-identical to width 1 over
  14 seeded runs. Three review rounds found and closed: a module that started and paid after
  another had failed; a cap stop reported as a provider failure; a running module shown stopped
  after a relaunch; a hang after an observer stop; a budget wait on a hold whose thread had
  ended; an interrupt that did not exit.
- Known limits of the opt-in, each stated in the ruling: a module in flight when another fails
  keeps its request without an answer and must be repaired too before the run resumes; a call
  can still begin in the instant between a bad reply and its report (5 of 80 trials built to
  hit it, within 0.05 ms median); a later module's result waits for the modules before it,
  which a live provider has not been seen to tolerate.
- Commands: `tools/quality_gate.py` 0 findings; `tests/test_cpos_parallel.py` (58) with the
  handoff, model, inbox, run page and proof files 1,453 passed; `tests/test_cpos_launch.py` and
  the run start scheduler and service 1,172 passed. The reviewer's reproductions for the last
  four findings were run again on the final commit: hang gone (1.1 s), second interrupt exits
  in 1.3 s, no start after a bad reply, no call after its report.
- Not verified: any live run above width 1; two sessions on one seat; Windows locks. The last
  fix round was checked against its four findings only, not by a further open review.

## 2026-11-18 — Connected pages: first draw and report redraws

- Scope: headless Chromium only, the two-run synthetic workspace, one shared Linux container.
  No Chrome or Edge, no Windows, no real report, no run with an earlier run to compare.
- Changed: the connected entry waits for the page's own file for at most 300 ms before the first
  draw, so React's 300 ms fallback hold is not met when the file is already there, and asks for
  the library index or the report once the file has loaded. The report page, its view, its
  parts and the run charts are not redrawn when nothing they read has changed.
- Medians of 5: report first content 497 to 306 ms, library 344 to 86 ms, the source highlight
  switch on Forecast 234 to 17 ms. At four times CPU slowdown the report's file takes longer
  than 300 ms and both builds take the same path (1,121 and 1,080 ms).
- Fidelity check, by a second reviewer on fresh builds of both commits: text, titles, requests
  and their order, alerts, console errors, tab order and PDF text are the same for the library
  and both reports across every tab at 1440, 768 and 390 px, with the file delayed 0 to
  1,500 ms, failing, and the first read failing nine ways. Generated element ids are one step
  lower; every reference to one resolves. A first build that kept charts out of the page until
  scrolled near, and one that kept library figure sources, failed the first review (chart text
  not findable, stale sources) and were removed.
- Commands: web `lint`, `format:check`, `typecheck`, `unused`, `duplication` exit 0; `npm test`
  5,293 passed on the branch before the merge.
- Not verified: Chrome and Edge on the work PC; a late portfolio basis in a browser.
