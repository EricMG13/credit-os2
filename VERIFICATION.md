# Verification record

Keep one running record here. A pass applies only to the stated scope. Earlier verification of the
engine is in [EricMG13/final-workflow](https://github.com/EricMG13/final-workflow)'s
`VERIFICATION.md`, which also keeps the retained runs this copy leaves out.

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

## 2026-11-18 — Adversarial review of the performance changes; fonts, imports, publisher reuse

- Scope: synthetic runs and fixtures on one shared Linux container. No provider call, no real
  issuer file, no Windows. Each part was attacked by a separate reviewer given the diff only;
  every confirmed defect was reproduced, corrected with a test, and its reproduction run again.
- Merged change of the entry below, three confirmed: (1) a run recorded before the Copilot
  cutover lost its module outputs on the run page (its workflow names the configuration without
  `copilot-`); a record with no config now matches that name; (2) the 64 MB limit of the run
  page's publication read was a check before the read (3 of 6,363 raced reads answered from a
  larger file); the read is now bounded on the open handle; (3) the kept publication was keyed
  on file identity and times, which do not show every change; it is keyed on the sha256 of the
  bytes read each request. That costs time: publication requests at 30 runs take about 20 ms
  (6 to 10 ms in the entry below, 110 to 150 ms before it).
- Fonts and imports: `/fonts/*.woff2` and `/symbol.svg` are fresh for a day (a font replaced
  under its name can be stale that long). Review: every file under `/fonts/` had the lifetime;
  now only fonts, and the test asks for `data.js`. `model.handoff` no longer imports every
  module owner: `react_frontend` 906 to 612 ms, `owners.cpos_launch` 966 to 688 ms (min of 3).
- Publisher: handoff sections, chips and the cash-flow grid are reused between publications of
  one process, by the sha256 of bytes read in that publication (256 MiB of pickled values, least
  recently used first out). Every pinned file is still read and hashed each publication (362
  files, 269 digests, as before). At 30 runs a repeat publication takes 1.6 to 1.9 s (3.9 to
  4.1 s before). Review: a value pickle could not copy made a run unreadable, and a grid that
  failed for a passing reason stayed missing until restart; both corrected. The reviewer's
  scenarios (tampered, removed, renamed, changed source text) are byte-identical to the parent.
- Commands: `tools/quality_gate.py` 0 findings; pytest on the server, proof, publisher, store,
  chips, changes, handoff, model, inbox and quality-gate files 3,054 passed.
- Not fixed: publication still grows with the number of runs (reads, hashes, 840 download
  files at 30 runs). Not verified: a live run, real PDFs, Windows. One server test failed once
  under load and passed in the next ten runs; it was not identified.

## 2026-11-18 — Performance review: source pages, publication reads, library index, PR checks

- Scope: synthetic runs with canned replies on one Linux container (4 cores, shared with other
  jobs). No provider call, no real issuer file, no Windows, no browser proof. Medians of 7
  loopback requests unless stated. The PDF is a Chromium-printed text file, not a filing.
- Source pages: `model.handoff._pages` now keeps the pages of bytes it has read, by their sha256,
  in memory (50 million characters, least recently read first out). The reader still reads and
  hashes the original on every request. One 250-page PDF source: report open 9.5 s to 41 ms after
  the first open in a process (9.1 s); one cited page 9.8 s to 3 ms. A synthetic run with one
  10-page PDF read it 46 times: 46.2 s to 3.9 s.
- Publication: `admission.published` keeps the parsed `data.js` until the file's identity changes
  (inode, size, modified and changed times); a file changed less than 2 s ago is not kept. At 30
  runs (16.1 MB): library 116 to 9.5 ms, reports list 124 to 6.4, report entry 145 to 6.2, report
  snapshot 155 to 45, finished run page 146 to 30, source download 112 to 5.7, portfolio basis
  120 to 5.7. The kept object takes about 48 MB at that size.
- Library index: the reply leaves out each run's `files` list, which no page reads: 1,306,297 to
  92,407 bytes decoded at 30 runs (102,754 to 6,619 gzip).
- PR checks: `checks.yml` now runs `tests/test_react_*.py`, `proof/test_launcher.py` and a `web`
  job (lint, format, types, unused, duplication, component tests, build, script tests). At
  2e48875 57 of 254 server tests failed or errored (run identifiers and a launcher signature
  from the Copilot cutover) and `npm run unused` failed on one export; the tests and the export
  are corrected. One server defect found by them: an output without `module` made the report
  list and the library index answer 500 (`library_cards._designated_output`).
- Commands: `tools/quality_gate.py` 0 findings; pytest on `tests/test_react_*.py`,
  `proof/test_launcher.py`, `tests/test_handoff_loop.py`, `tests/test_handoff_transport.py`,
  `tests/model`, `tests/test_quality_gate.py`, `tests/test_library_index.py`,
  `tests/test_update_library.py` 1,377 passed; `tests/test_cpos_launch.py`, the run start and
  inbox scheduler, runs and activity files 1,523 passed; web `lint`, `format:check`, `typecheck`,
  `unused`, `duplication`, `test:scripts` exit 0. `npm test` (5,285 tests) passed before the
  one-word web edit; after it the start-page files (281 tests) passed.
- Confidence review, ranked: (1) a kept publication could go stale or be changed by a reply:
  tests cover a swapped folder, a same-size rewrite in place, a missing file and every read
  route against the shared object; (2) kept pages could bypass the hash check: the hash is taken
  on each request before the lookup, and changed bytes are refused (test); (3) a caller could
  edit kept pages: each call gets its own list (test); (4) the run page's admission lookup lost
  a guard: the link and 64 MB checks stay, and a pending run still reads nothing (tests).
- Not fixed: the publisher still rebuilds the whole library for each run end and each service
  start, under the scheduler lock (0.12 s a run: 3.5 s at 30 runs), and `data.js` grows by about
  0.5 MB a synthetic run. The profile is flat, so this needs per-run publication, a design choice.
- Not verified: a live run, real PDFs, Windows, the web gates in GitHub Actions before this PR.

## 2026-11-18 — Copilot cutover, compact handoffs and connected publication

- Astra's end-of-phase review and follow-up confirmed the pinned SDK disables background
  compaction and autonomous continuations. The Opus hold prices one input token per serialized
  byte plus runtime framing. Tests covered rejected direct HTTP routes, unavailable Luna effort
  and disabled seat policy, first and later context checks, and the approved configuration and cap.
- Confidence review exercised interrupted publication, stale uploads and on-disk edits to approved
  inputs, including module list, model route and cap. A restart refused the changed queue entries
  before dispatch. Failed capability checks opened the app offline with paid choices unavailable.
- Read-only TDG inputs estimated CP-3 at 61,424, CP-5 at 48,098 and CP-6 at 50,061 initial tokens.
  The prior full requests estimated 209,269, 252,017 and 223,679 respectively. These are serialized
  request estimates. Offline tests passed an exact chunk through the continuation and validated
  the resulting handoff. Unknown transport versions and source text with split credentials refused.
- Clean extraction of ZIP SHA-256 `8b5c0a8f03f776a2fbc0a40b4882be419546d93e3daa04cecaaa60f6292ba1c7`
  (local proof snapshot `08e281b9`) passed Chrome `20261118-020520-01` and Edge
  `20261118-020552-01` on macOS. Both exercised intake, report pages and verified a downloaded
  handoff against its published SHA-256. The old library URL redirected and its script returned
  404. Zero non-loopback page requests. Static fixture checks passed.
- The Python quality gate passed. Focused Python checks passed for launch, model, scheduler,
  intake and publication. Embedded packaging verified that rebuilding removes retired files.
- Follow-up confidence and Astra review checked the stored first-prompt estimate, the oversized
  repair refusal before reservation, and the exact seat status in the review summary. A stale
  picker cannot enable paid Submit. Passed 509 web and 402 targeted Python tests plus the repair check.
- On macOS the pinned SDK 1.0.28 opened a local stdio connection to Copilot CLI 1.0.108 (protocol 3).
  The isolated status check reported unauthenticated and created zero sessions.
- Integrated with main `c1439225`. ZIP SHA-256 `593911cc8a84f6d2722daee9e7aa983564ef57b9ec0a735f50c79bfb8c2bf47d`
  (proof snapshot `b7fcc73b`) passed clean-extraction Chrome `20261118-020828-01`
  and Edge `20261118-020859-01` on macOS with zero non-loopback page requests.
  Passed 232 targeted Python tests, 540 web tests, the quality gate, lint and typecheck.
  Astra confirmed the merge retained the desktop styles and Copilot approval and cap checks.
- Deployment-seat verification, the first authorized paid run and Windows work-PC acceptance
  are pending. Native Copilot search stays unavailable pending evidence and cost verification.

## 2026-11-18 — Desktop review follow-up after PR #64

- Astra reviewed the merged desktop diff. Fixed activity polling after a malformed response, source-run provenance for reused inputs, Forecast copy for missing calculations, and the retry action named by the service. Verified the regressions, exact source-run link and draft preservation, retained layout, 680 Forecast cells and three confidence scores in the live desktop checks. Chrome and Edge passed offline workflow proof (`run-ryqfCu`), and all 83 file routes rendered. 1,161 frontend and 42 Python tests, build, lint, formatting and the quality gate passed. Fallow passed against merged main with zero new findings and against the original base with 12 styling advisories for values already on that base.

## 2026-11-18 — Desktop Impeccable refinement

- Distill, Clarify, Layout, Typeset, Quieter, Harden, Animate and Polish covered the connected and file-based React workflow. The retained Caesars desktop preview checked Library, History, Overview, Calendar, Changes, Modules, Forecast and Evidence. All 680 Forecast display cells and confidence scores of 33, 0 and 54 matched, including source trace access.
- Chrome and Edge passed the synthetic desktop workflow (`run-0lS2Cg`). Local browser fixtures verified long text, stale-filter recovery, keyboard focus as runs changed groups, stable feed and module rows, and the reduced-motion setting. Chrome rendered 83 file-based Library, Model and Run routes.
- All 3,844 focused tests, production build, changed-file ESLint and Prettier, and the quality gate passed. The confidence review checked report figures, source destinations, run approval and caps, polling behavior, and missing values.

## 2026-11-18 — Fallow follow-up on main

- Verified all 18 original warnings with per-file Fallow inspection before refactoring. Fallow 3.8.1 audit against `origin/main` passed with zero new complexity, dead-code, or duplication findings. Seven styling advisories point to arbitrary utility literals already present on main. No suppressions or threshold changes.
- All 570 focused tests passed. Build, changed-file lint and formatting, and Python quality gate passed. Desktop synthetic proof passed in Chrome and Edge (`run-LeBkY9`). Retained Caesars matched all 680 display cells and confidence scores of 33, 0, and 54 with their trace controls. Post-edit review retained the separate intake session, validation, and report trace responsibilities.

## 2026-11-18 — Module Bottom line confidence

- Retained Caesars desktop preview. Verified 33/100 and 0/100 as Insufficient Information and 54/100 as Low, with distinct fills and the original confidence and prose traces. The tile remains available when the score has no rendered Bottom line. All 97 focused tests, build, lint and formatting passed. The Python gate passed with the untracked predecessor copy excluded.

## 2026-11-18 — Forecast redesign

- Desktop preview verified at 1440 × 900 and 1280 × 900. Cash flow and scenario comparison open together. Compared all 680 historical and forecast display cells with the retained Caesars calculation record, including periods, missing values and zeros.
- In-app preview verified FY2029E scenario comparison, Growth rates, Chart or Table and the downside source drawer. Design review confirmed the stronger selected-control state after recapture. Claude Model handoff and RBOT-HTML `fc010a7` informed the layout.
- 174 focused tests passed. Chrome and Edge completed the synthetic desktop proof in `run-ikJ2Lt`. Build, lint and formatting passed. The Python gate passed with the untracked predecessor copy excluded. Post-edit review retained exact row matching and the separate-grid fallback.

## 2026-11-18 — Desktop Forecast case comparison

- Retained Caesars, Chrome at 1440 × 900. The four FY2029E figures fit on one row, reducing the case section from 384 to 230 px. Each value matched the retained preview. The opening qualification and shared rounding note appeared once in the comparison. Verified all four source buttons, arrow-key case selection, active comparison row and downside trace.
- The focused frontend suite passed 134 tests. Chrome and Edge passed desktop synthetic proof (run-1oq0zs). Build, formatting and changed-component lint passed. The unfiltered Python gate found 3,008 issues in the untracked predecessor copy; excluding it yielded zero. Post-edit review confirmed the model supplies a common period and unit, and only exact matches to visible qualification text are removed from case labels.

## 2026-11-18 — Connected desktop findings and Forecast proof

- Retained Caesars preview at 1440 × 900 in Chrome. Library identified the test preview in both layouts and labelled 4.19× using the retained debt cash-interest basis. Read-only intake and progress controls were checked.
- All 49 limitations across 12 modules matched the previous preview in order, prose and trace labels. Chart index focused Run charts 16 px from the top, including on reload. The Evidence model register appeared for Forward credit model and was absent under Legal.
- Chrome and Edge passed the desktop-only synthetic proof (run-DQdHfb), including both intake cost labels, the qualification immediately preceding case figures, the scope disclosure and scenario comparison. An earlier Edge run timed out loading intake. The complete rerun passed on both browsers.
- 314 focused frontend and 94 backend tests passed, as did build, lint and formatting. The Python gate reported 3,008 findings in the untracked predecessor copy and zero on the changed project code. Post-edit review retained grouped rows and per-history-entry scroll offsets.

## 2026-11-18 — Forecast adversarial review

- Exact recorded scope limits open their input trace. Generated notes link to Evidence Record. Assumption links require matching ordered headers and a unique full row. Jumps target available Forecast sections.
- Retained Caesars Chrome fidelity check preserved four interest basis rows, the original input wording in the trace, and all 17 register rows and source links. Driver scrolling stayed within a 390 px viewport.
- The combined local checkout passed 1,457 connected frontend tests and 170 focused Python tests. The isolated Forecast patch passed all 1,456 C1–C5 tests, build, lint, formatting, and the Python import gate. Chrome and Edge passed the full synthetic flow on the isolated patch.
- Confidence review checked split excerpts, missing inputs, ambiguous row identity and section availability. Rewrite comparison kept the exact-row index and exact-text membership check.

## 2026-11-17 — Caesars Forecast desktop

- Retained test preview, 1440 × 900 Chrome. The base-case qualification immediately precedes the four FY2029E cash proxies (US$m 496.85, 131.38, 684.03, 326.97). The first value is visible in the opening viewport.
- The Interest and Interest coverage basis rows in both tables matched the retained limitation exactly. The trace included the original scope limit. Evidence reproduced all 17 register rows cell for cell, with 17 matched source-row links. Forecast omitted the register identifiers and production categories.
- At desktop widths the driver table has a named keyboard scroll region and pinned driver names. Focused tests passed (183), as did TypeScript, changed-file ESLint, formatting and the connected build. The unfiltered Python gate reported 3,008 findings in the existing untracked predecessor copy; excluding only that copy produced zero findings. Scope is presentation fidelity for this run.

## 2026-11-17 — Post-audit app repairs

- Re-ran connected sections C1–C5 and static sections S2 and S6. All 2,374 focused
  frontend tests and 553 focused backend tests passed. The build and 125 offline
  route visits passed. The Python quality gate passed in an isolated checkout
  containing the patch. ESLint and Prettier passed on changed web files.
- On macOS Chrome, the accepted newest-document warning matched the saved
  metadata and Evidence Record. The static build guided readers to the connected
  service when no draft was available and opened the sample form when one was.
- Chrome and Edge passed the connected synthetic flow after the browser check
  began waiting for the Evidence Summary tab to become active.
- Confidence review checked digest compatibility, changed overrides, restart
  recovery, approval snapshot consistency, History output ownership and labels,
  prior repayment inputs, and the empty-draft boundary. The rewrite tournament
  retained the ordered History metadata scan and date limit calculation.

## 2026-11-17 — Stage 7 final audit handoff

- Application source `a987af9b`. Stage 7 adds audit evidence and work-PC documents.
- Locked setup, Python quality, 6,285 fast Python passes with one existing skip,
  573 Node checks, 5,259 frontend passes at 97.69% lines and 73 script checks.
- Native Chrome and Edge synthetic proof and 138 native file checks passed on
  both the checkout and the checksummed runtime ZIP. The screenshot reports
  record paired baseline and final states and the independent ZIP comparison.
- The work-PC rehearsal stopped at the two missing pins with the source unchanged.
  Actual Windows setup, live or paid runs, real Submit and Teams remain unverified.
- [Final gates](docs/audit/2026-11-16-final/output/7-send-off/gates.md) ·
  [Audit summary](docs/audit/2026-11-16-final/output/SUMMARY.md)

## 2026-11-17 — Stage 6 sweep

- Scope: six reviewed refactors on the repaired app, with the same tests, public routes,
  handoffs and protected inputs. Nine production files add 21 and remove 66 lines.
- Passed: 5,259 frontend tests including 630 Signal tests, native 97.69% lines,
  6,285 Python tests plus one existing skip, 573 Node checks, both quality gates,
  73 script checks, 138 native file checks, and synthetic Chrome and Edge proof.
- Measured: 20 fewer duplicated frontend lines. Paired History row data 2,168 to
  109 bytes with the same requests and markup.
- Source pins, retry outcomes and limits: [sweep report](docs/audit/2026-11-16-final/output/6-sweep/report.md).

## 2026-11-17 final audit presentation fidelity

On repair tree `bb94ddce`, rebuilt both surfaces and captured connected
synthetic Northbridge and the static fixture with native Chrome 157.0.8103.78
at 1440 by 900. Both captures exited 0. Checked 267 distinct screens
(29 connected, 238 static), 654 sourced drawers, 419 explicit missing-source
markers and zero coverage gaps, trace errors or outside application-context
attempts. The immutable comparator and baseline matched 126 stored hashes.
Its 28 self-test cases passed. The full comparison covered 7,761 entries.
The unmodified diff exited 1, reporting seven new differences, fourteen
omissions and 352 not-found items. Each is explained in
`docs/audit/2026-11-16-final/output/5-repair/fidelity/after-report.md`
and the item readbacks, including scoped event counts, retained drawer basis
and inputs, static sample notices and unchanged call totals. Static had no
difference flags. Browser background proxy denials are counted separately.
This evidence covers values, units, periods, source statements and
qualifications in the captured screens. Other browsers, CSS presentation,
remaining controls, work-PC and real-run behavior were outside this check.

## 2026-11-17 — Final audit T18 Forecast recovery (audit/repair-2)

- Scope: optional contextual Forecast traces; exact model qualification ledger on Evidence Record;
  recorded drivers/shock/facilities; desktop long tokens; assigned Forecast Low/Info display fixes.
  No analytical calculation, Python, prompt, handoff or protected Signal source changed.
- Test first: eight recovery tests, a Downside containment test, three confidence/caption cases and
  the invalid-grid Record-link assertion each failed before their corresponding production fix.
- Passed: 333 affected tests, then 40 focused after final source metadata; 743 caller/Signal tests; lint, format, typecheck, knip, duplication,
  build, 70 script tests, pinned-uv quality gate and native Chrome/Edge offline file gates.
- Unchanged C4-002/003/025/026 probes passed. Native Chrome 157 and Edge 155 checked synthetic
  source tokens, the ledger, selected-case figures and seven intercepted states each, with no
  outside hosts or page errors. Exact scopes and original expected-text changes: [T18 report](docs/audit/2026-11-16-final/output/5-repair/T18.md).
- Early independent source/context findings were reproduced red and addressed within the still-open fourth round; final code pin `f7f1e011`. Fresh final verdicts remain with the lead.
- Not verified: fresh independent primary/adversarial final verdicts, final combined branch and live cases.

## 2026-11-17 — Run state from one reading of the event log; a delivered run is finished (branch `claude/jolly-gauss-0erxtn`)

Scope: how a run's end and its modules' states are read from `events.jsonl` (`run_events.progress`, used by `inbox/runs.outcome` and `inbox/activity.module_states`), the new module state `stopped` in the React run pages and the static library's run steps, the run page's `held_reason`, and CP-OS's relaunch of a folder that already holds a completion record (`owners/cpos.py`). Launcher options, caps, budget, checkers and delivery files unchanged. No provider was called and no paid run was made.
- Owner, 2026-11-17: asked to find the app's implicit state machines, then "do it" to the fixes proposed from that inventory.
- Changed: (1) the log is read once, in order: a `stopped` ends the running module and Report (`stopped`; before, a stopped module read `running` for good); modules run one at a time, so the next start or `delivery_started` ends one still running (a launch killed mid-module; a CP-8 not produced, which read running beside a delivered Report); a later start runs a module again; the run's end is the last stop no start followed (before: the first stop in a log shared by every launch); exit 0 is finished (a live launch returns 0 only once it delivered; before, a lost `delivered` line made it "failed: launcher exited 0"), and the scheduler still requires the library to list the run. (2) `stopped` reads "Interrupted" in React (`moduleWord`, Run activity) and in the static library (`runSteps`, amber segment, warning mark). (3) The single-run reply carries the scheduler's hold note as `held_reason` (`held` there is the reserved amount), path-scrubbed like `reason`, only for a run that waits on the service: queued, or kept "running" after its log ended (read from the log, not by probing the PID, which could reap the scheduler's child); the run page shows it. (4) A run folder with a completion record is finished: a live relaunch returns its delivery with no call and writes nothing; a non-live replay into it is refused (it would check no bytes); one with two records, or whose recorded delivery is gone, is refused (`cpos_delivered`, "start a new run"). A launch refused before it held the folder (its executor's settings differ from the running launch's: `identity_mismatch` on `live/loop.json`) no longer appends `stopped` to the running run's log. Before, a relaunch whose completion bytes differed (changed rendering, a forecast that now passes) wrote a second record and the library refused the run as ambiguous. This generalises the 2026-11-12 rule that a relaunch after CP-8 was not produced "leaves the delivery as it is, makes no new call and says so"; `_recorded_not_produced` is removed. (5) `tests/test_react_frontend.py` holds `RunStatus`, `EndedRun` and `ModuleState` in `web/src/pages/connected/api.ts` to the Python literals; the Python status-set copies are typed with `Status`.
- Not changed, by decision: a module whose request was saved but whose response was not stays `cpos_interrupted` on relaunch. The request may have been paid; the executor keeps its own re-entry marker; a capped folder cannot continue anyway (the cap is pinned). Recovery remains a new run.
- Tests: new cases for stop/relaunch ordering, one module at a time and CP-8 not produced, last-stop and exit-0 outcomes, `held_reason` (ended, held, running again) and a stopped module in the reply, the TS/Python contract, a delivered run's relaunch (no call, no `delivery_files` call, one record), a replay into a delivered folder, a folder with two records, and a refused second launch leaving the log as it was; the delivered-relaunch and two-record tests fail on the previous `cpos.py`, the second-launch test without the new guard. `test_an_unreadable_compaction_note_still_flags_the_module` now removes the completion record first (a launch killed before it), since a delivered run is no longer resumed.
- Commands, exit 0: `tools/quality_gate.py` (0 findings); pytest `test_cpos_launch` (910 passed, 1 skipped paid), `test_changes`, `test_cp8_comparison`, `test_library_index`, `test_credit_os_store`, `test_handoff_loop`, `test_cpos_cp1_check`, `test_inbox_runs`, `test_inbox_activity`, `test_inbox_scheduler`, `test_inbox_teams`, `test_react_frontend`, `test_react_admission`, `test_run_start_submissions`, `test_context_form`; `node --test components.test.cjs static.test.cjs` (576); `npx vitest run src/pages/connected src/pages/run src/components` (1,467); `tsc --noEmit`; eslint and prettier on the changed files; `node scripts/build.mjs`.
- Fidelity check: the static run steps (labelled and compact) rendered in Chromium with `screen.css`: the stopped step reads "Interrupted" with the warning mark on the neutral card, amber in the compact bar, 2 of 4 done. The built React run page served by `react_frontend` (synthetic mode) over a run held "running" after a `stopped` event: "Held by the service" with the note, CP-1 "Interrupted", "1 of 3" modules.
- Review: one independent read-only review of the diff. Confirmed and fixed: the refused second launcher's `stopped` (now acted on by `progress`); `held_reason` was the service-wide note on any live run's page, unscrubbed; CP-8 not produced left running after delivery. Also taken: a non-live replay into a delivered folder passed unchecked (now refused); the missing-delivery refusal now says to start a new run. Left: a relaunch of a delivered folder with other loop settings stops at `loop.json` before the delivered check (exit 1, nothing written to the log now); a delivered run killed before its `delivered` line keeps its Report running in the log (the scheduler's exit-0 rule covers its own launches). Rewrite comparison for `progress`, `outcome`, `_recorded_delivery`: a table-driven `progress` was no shorter or clearer; kept.
- Not verified: `pytest -m browser` (Chrome cannot start in this sandbox; `test_run_start_page.py` timed out), the full suite, a live run, Teams cards with a stopped module (they count done modules only).
## 2026-11-17 — CP-DR may read finance.yahoo.com (PR #52, merged to `main` as `859b3ae1`)

Scope: the research module's web allowlist and its statement on both start pages: `src/deploy_workflow/research/`, `src/deploy_workflow/run_start/`, `src/deploy_workflow/model/`, `docs/rulings/`, `docs/audit/`, `docs/templates/` (older start page), `web/src/pages/connected/start/` (review sheet) and their tests. No provider was called and nothing was fetched from a Yahoo host.
- Owner, 2026-11-16: "Use public source like yahoo finance for cp-dr. We want information on all modules". Owner, 2026-11-17, asked with the exposure put plainly: "Yes, allow it".
- Changed: `finance.yahoo.com` alone joins the allowlist (28 to 29 domains; `yahoo.com` and other Yahoo hosts are not added). The summary gains `web_lookup`, the launcher's own setting for the run; both start pages say, exactly when it is true, that the research module may read Yahoo Finance pages, that their addresses name what it looks up and that no document is sent. The research instruction tells the module how a Yahoo page is cited (Source type `Other`, a Gaps line, undated, current figures not used for an earlier cutoff). The ruling `docs/rulings/2026-11-13-cpdr-web-lookup.md` records the amendment, what Yahoo sees (three headers) and the header audit; `docs/audit/2026-11-16-final/README.md` rule R8 records the exception.
- Fidelity check (presentation, as the PR body states it): `vitest run src/pages/connected/ConnectedApp.test.tsx` for the connected review sheet; for the older page a Playwright probe from disk (`file://`, no service) showed the Yahoo row once with `web_lookup` true and never with false, absent, a string or the research module left out; the browser-marked tests were then run locally by the PR manager.
- Reviews: one independent adversarial review (first verdict request changes; three Medium, fixed and re-checked with probes: the older page's test could never pass, the Yahoo citation rules were not told to the module, a Claude run "reads only its files" sat beside the Yahoo row). After the send-back, the PR manager's combined run on the first head (4863dfa1) found six browser tests failing (four new Yahoo tests returning an `error` key the harness refuses; two existing "stay in view" tests broken because the new row made the card taller). Fix round 738d40a9 (Approve/Submit sticky in the older page; the test returns only asserted fields) was re-reviewed (Opus `mx-precise`: pass, one Info held for the end batch) and re-verified.
- Commands on head 2c508753, run by the PR manager: `npm --prefix web run proof:connected` exit 0, pass 2 / fail 0 (Chrome 157, Edge 157); `pytest -m browser` on `tests/test_run_start_page.py`, `tests/test_reporting_currency_proof.py`, `tests/test_cpos_launch.py` 173 passed; CI both checks green. As recorded in the PR body (at 4863dfa, the author's run): `tests/test_weblookup.py` 241 passed, `tests/test_web_lookup_tools.py` 264, `tests/test_run_start_submissions.py` 164 (3 skipped), `tests/test_run_start_service.py` 97, `tests/test_cpos_launch.py` 938, `tools/quality_gate.py` 0 findings, `lint-imports` 3 contracts kept, web typecheck and lint exit 0, vitest 156 on the connected page file. The header audit is by test: a Yahoo request on the wire is the request line and three headers, and redirects to consent hosts are refused.
- Not verified: anything fetched from a live Yahoo host (consent redirects, script-drawn pages, whether pages state no date); a mechanical check of the Yahoo citation rules (none exists; follow-up for the owner); a live CP-DR run; the full suite (weekly CI).

## 2026-11-16 — Keep the library and the scheduler working beside an unreadable run record (PR #39, merged to `main` as `82f0fceb`)

Scope: backend ordering and admission code, no presentation change and no web change: `react_frontend/admission.py`, `src/deploy_workflow/inbox/` (runs, scheduler), `src/deploy_workflow/run_start/` (prior, service) and their tests.
- Owner's instruction: one unreadable run record (`state/<run id>.json`) used to fail every library reply and stop the scheduler. Now only the affected run is strict. The library hides that run's folder; the scheduler starts, never writes or deletes the file, reserves the id, counts one running slot and one daily start for it, keeps sealed uploads while any record is unreadable and ignores a readable copy with the same run id (`runs.name_key`, case and Unicode form). Run lookups refuse only that run. With no unreadable file nothing changes. `load_all` still raises.
- Reviews (adversarial, ordering code): two High findings in two rounds (a readable copy carrying the bad file's id could overwrite it and start its run; the same through Unicode form), both fixed; the final re-review was clean (six mutants of the comparison caught, four hard limits held, 707 name pairs sharing one key).
- Commands as recorded in the PR body, on head 0919f266: `uv run pytest` over admission, inbox scheduler and runs, prior, service, react frontend and run activity tests exit 0 (332 passed); `tools/quality_gate.py` exit 0. 507 changed lines, 12 files. One existing test replaced on purpose.
- Not verified: the whole Python suite and the web suite; Windows or a case-distinct file system; a real restart after repairing a file; a real launcher process; hundreds of bad files. Left as is: the page of the run whose own record is unreadable shows a generic failure and logs a traceback each poll. Predates the change (for the owner): `/library/` is served without admission; the comparison module can choose an unaccepted run folder; the folder lock leaks if start-up raises; a stray readable record is tracked under its id; `_load` does not check a record's id against its file name.

## 2026-11-16 — Run activity: no absolute path in a run's reason; an unreadable record no longer fails the list (PR #36, merged to `main` as `e70380c5`)

Scope: the connected Run activity page and its service reply: `react_frontend/run_activity.py`, `src/deploy_workflow/inbox/runs.py` (read-only `load_readable`), `web/src/pages/connected/` (`RunActivity.tsx`, `api.ts`) and their tests. Scheduler, `load_all` and admission unchanged.
- Changed: a run's reason (ended list, running list, single-run reply) no longer shows an absolute path: the bare service root reads "the service folder" and any other absolute path keeps its last segment (POSIX, Windows, network shares; a quoted path is cut whole). File names, URLs and relative paths stay. One unreadable run record no longer fails the list or a single-run page; the list sends an `unreadable` count and the page says "Some run records could not be read", and the empty state no longer claims nothing is running beside one. The skip is a documented fail-open on a display path; not logged because the page polls every 5 seconds.
- Review: one adversarial review, three Medium (a spaced folder name kept its tail; a non-text id still failed the list; the page said nothing was running beside unreadable records), fixed and re-reviewed clean with mutation checks.
- Fidelity check (presentation): not recorded in the PR body beyond the web tests below.
- Commands as recorded in the PR body, on 9c459b17: `uv run pytest` on `tests/test_react_frontend.py`, `tests/test_react_run_activity.py`, `tests/test_run_start_scheduler.py` exit 0 (112 passed); `tools/quality_gate.py` 0; web `lint`, `format:check`, `typecheck`, `unused`, `duplication` exit 0; `npm test` exit 0 (3,507 tests). All 19 reason texts the scheduler writes come out as intended; a 100,000-character reason costs 32 to 44 ms.
- Not verified: Windows (paths tested as strings); an unquoted path with a space in a folder name, an apostrophe path in single quotes and a path after `file://`, `<`, `{`, a backtick or curly quotes still show (by ruling); a page with both an unreadable record and a listed run; `/sweep refactoring discover`, `confidence-review`, `rewrite-tournament` and the browser proof were not run; with one bad record file admission still fails library replies and the scheduler refuses to start (predates this PR; PR #39 addresses it).

## 2026-11-16 — Run activity: list runs that ended without a report (PR #34, merged to `main` as `94110a54`)

Scope: PR 3 (Task 9) of `docs/superpowers/plans/2026-11-16-connected-reader-high-gaps.md`: `react_frontend/run_activity.py`, `web/src/pages/connected/` (`RunActivity.tsx`, `api.ts`), their tests and the plan. Task 10 is dropped (the Start flow has no Confirm step).
- Changed: `GET /connected/activity` gains `ended` (the 20 latest runs that failed, hit the cap, were rejected or were interrupted; seven fields each, no spend, folders or file lists) and `ended_total`. The page adds a third group, "Ended without a report", with issuer linked to the run's page, pathway, state, end time and reason; the tally shows the real total and the group says "Showing the latest 20 of N." when cut; a run with no end time shows "Not recorded". A reason is sent without the service's root directory on the ended list, the running list and the single-run reply.
- Reviews: task review approved; whole-branch adversarial review two Medium (the tally showed 20 for ever; a Windows OS-error path was not stripped), fixed and re-reviewed with mutation checks; a last test-only fix made the path test platform independent.
- Fidelity check (presentation): not recorded in the PR body beyond the web tests below.
- Commands as recorded in the PR body: `uv run pytest tests/test_react_frontend.py tests/test_react_run_activity.py` 29 passed on the head; `tools/quality_gate.py` 0 findings; web `lint`, `format:check`, `typecheck`, `unused`, `duplication` and `npm test` (163 files, 3,506 tests) exit 0 on the last commit that changed `web/`, before the rebase onto 3c96a3a2. The list is read-only (about 35 ms per poll at 1,000 saved records). 451 changed lines.
- Not verified: Windows (path cases are simulated strings); `/sweep refactoring discover`, `confidence-review`, `rewrite-tournament` and the browser proof were not run; a path outside the service root, a file name under it, the bare root with nothing after it and a root in a different drive-letter case are still sent in a reason; a hand-edited record with a non-text reason or end time fails the whole list.

## 2026-11-17 — PR 3: the review sheet shows every input Submit sends (branch `claude/review-sheet-every-input`)

Scope: a presentation change to the connected start page's review sheet (`web/src/pages/connected/start/ReviewSheet.tsx`, new `start/reviewInputs.ts`), with labels moved unchanged from `StartRun.tsx` into `start/plain.ts` and `start/rows.ts`. What Submit sends, the reviewed-summary digest, the caps, limit acceptance and the service are unchanged; no Python changed. No provider was called.
- Owner, 2026-11-16: the review sheet shows every input the analyst approves, in plain words.
- Changed: the sheet adds the issuer ID and issue classification, the legal documents and the three file boxes, Issuer details, Context details (each facility, quote, rating and research question, the analyst's note among the questions), Valuation and peers, Module options and Scenario assumptions, and shows the form level, model and effort and turns per module at every level. Labels come from the page's own sources (`plain.ts`, `rows.ts`, `valuation.ts`, `assumptions.ts`); module lists use names, never the forecast. A blank or unsent input reads `Not given`, never 0. The form version (`context.schema`) is sent and not drawn.
- Fidelity check, scope the review sheet of a Full credit assessment at the Basic and Advanced levels, synthetic inputs: V1–V26 in `ConnectedApp.test.tsx` assert each input's label and value as hand-written strings; 26 failed before the change (at the sheet lookup) and pass after. V27 asserts that no text on the sheet or its limits matches braces, `snake_case` keys, module codes, ids or `context/1`. It passed before and after (a guard). The N8 and N9 request bodies are unchanged and pass. One older assertion (Basic hides turns, model and effort) now asserts they are shown, under the owner's rule.
- Browser check (scratch Playwright script, not committed; Chrome for Testing 153 on the synthetic `proof.serve`): an Advanced run with inputs in every group. The service accepted the summary. Every key of the sent body appears on the sheet with its value, except `context.schema` and the five new-issue facility boxes, which are sent blank and not drawn for a run that is not a new issue. The sheet text has no raw pattern.
- Commands, exit 0 on 366bdb1: `npm --prefix web ci`; `npm --prefix web run` lint, format:check, typecheck, test (173 files, 3,944 tests), unused, duplication (1.57%), build; `tools/quality_gate.py` (0 findings, no Python changed). The first full test run, on 50dd42a, failed only by V27 timing out at 6.97 s against the 5 s default under load; 366bdb1 gives V27 20 s.
- Not verified:
  - `proof:connected`: it needs branded Google Chrome and Microsoft Edge; this container has Chrome for Testing only (`/opt/google/chrome/chrome` links to it) and no Edge.
  - `pytest -m browser tests/test_run_start_page.py`: in this container the run did not finish: its first 12 tests failed at about two minutes each, and the first, run alone, failed because its headless Chrome `--dump-dom` call against the service hung to the 120 s timeout (Chrome renders a trivial page in 0.6 s). That file drives the older start page (`docs/templates/context-form.html`), which this branch does not change.
  - Other pathways in a browser; a live or paid run; the full weekly suite.

## 2026-11-17 — Browser proof declares an executed agreement (branch `claude/proof-cp4-gate`)

Scope: `proof:connected` on main 4f8a375a. Synthetic fixtures and the proof script only; no product code changed, no provider called.
- Broke: `proof:connected` failed (`pass 0, fail 2`, `AssertionError: stopped: checker`, run `failed`; reproduced by the PR manager, not re-run here) from d64bdf81 (#45). CP-4's acceptance now enforces its source gate: a run declaring no legal documents must write the blocked handoff. The proof declared none and its canned CP-4 is a full analysis.
- Refused alternative: blocking the canned CP-4. The proof's calendar asserts 37 rows and 9 "Synthetic note" rows (`web/scripts/connected-proof.mjs`, checkCalendar), 4 rows from each of 9 handoffs including CP-4; a blocked CP-4 gives 34 and 8, and drops the covenant chart and maps. Ruling (PR manager, coordinator): declare the agreement instead; no assertion is changed.
- Fix: `proof/northbridge-credit-agreement.txt` (fictional; "Credit Agreement" / "EXECUTION VERSION"); `verify_upload` accepts the filing plus optionally the workbook and the agreement, each byte-checked; the script uploads it and sets Legal documents to Executed and The agreement to that file. No assertion edited; no document-count assertion changed.
- `guess_kind` reads the file as `credit_agreement`, executed True, so `cp4-declared-executed-none-recognised` cannot fire (checked on the fixture, not on the run's forecast page).
- Results: `npm --prefix web run proof:connected` exit 0, pass 2 fail 0 (Chrome 157, Edge 157). `proof/test_launcher.py` 4 passed (one added). `tests/test_cpos_launch.py -m "not live and not browser"` 938 passed. Quality gate (tools/quality_gate.py) exit 0.
- Not verified: the forecast page of the proof run (limits shown) was not read; the before-fix failure was not re-run in this worktree.
