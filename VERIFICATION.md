# Verification record

Keep one running record here. A pass applies only to the stated scope. Earlier verification of the
engine is in [EricMG13/final-workflow](https://github.com/EricMG13/final-workflow)'s
`VERIFICATION.md`, which also keeps the retained runs this copy leaves out.

## 2026-11-17 — CP-DR: a Yahoo Finance page's row and date are checked (branch `claude/inspiring-thompson-jy5l0f`, on #52)

Scope: this branch on top of `claude/cpdr-yahoo-allowlist` at `4863dfa` (PR #52, open, not on `main`). Ruling: `docs/rulings/2026-11-13-cpdr-web-lookup.md`, amendment 2026-11-17 ("Checks, 2026-11-17") and A14. No provider was called, nothing was fetched from a live host and no paid run was made. Synthetic: hand-written pages through the fake network.
- Owner, 2026-11-17: on the two proposed checks, "both"; on how the date check treats price-history pages, "Exempt history pages".
- A14: a `## Sources` row naming a Yahoo page (its `final_url` on `finance.yahoo.com` or a subdomain) has Source type `Other` only, and `## Gaps` names its id.
- At fetch: an undated Yahoo page other than `/quote/<ticker>/history`, fetched after the cutoff (UTC day), is `later-event`, with its own lookup sentence; A7 and A13(ii) then apply. `WEB_LOOKUP_RULES` says both. `SOURCE_TYPES` and the Source type cell reader moved to `weblookup.py` (same values).
- Pins: `WEB_LOOKUP_RULES` is added to CP-DR's system prompt per request and is in no instruction file or `method_text`. No test or executed case pins its hash: `METHOD_TEXT_SHA256_AT_1B41E65` and the CP-4 executed-case pin pass unchanged. A call's `prompt_sha256` goes into a content-addressed invocation preimage, so a resumed CP-DR step gets a new digest, not a refusal.
- Tests first: on `4863dfa` with the new tests, 17 cases failed, 514 passed. The other 9 new cases guard unchanged behaviour (history pages, the cutoff day, dated pages, other hosts, the repaired probe). The review probe of #52 (statistics page fetched after the cutoff, typed `Financial press`, `Undated` with a Gaps item, current figure in TDR.6) gave 0 issues before and 3 after.
- Commands, exit 0 on `e3ce2b1`: `tools/quality_gate.py` (0 findings) and `lint-imports`; `tests/test_weblookup.py` and `tests/test_web_lookup_tools.py` (531 passed); web search scope, handoff loop, citation markers, register scope, run-start submissions and context form (527 passed, 3 skipped); `tests/test_cpos_launch.py` (950 passed, 1 skipped: paid).
- Reviews: confidence-review and rewrite-tournament (post-edit) by the implementer; an independent adversarial review of `e3ce2b1` is running and is recorded here when it reports. Low, parked: a dot segment as the ticker (`/quote/../history`) passes as price history, since addresses are not normalised; what Yahoo serves there is unknown.
- Not verified: a live Yahoo page (its layout, dates and redirects); whether a model follows the new text; a Yahoo URL cited from hosted `web_search` and not retained (outside A14); the full weekly suite.

## 2026-11-17 — PR 2: a run in the currency its source files report in (branch `claude/reporting-currency`)

Scope: the whole branch against `main` 0bca1822. That covers the two entries below (PRs 44 and 46, merged into this branch) and the work listed here. Ruling: `docs/rulings/2026-11-16-reporting-currency-from-sources.md`. No provider was called and no paid run was made. The proof is synthetic: retained, canned module answers, labelled as such.
- Owner, 2026-11-16: "it has to run run on any reported currency provided by the source files"; "modules should be currency agnostic, the source files dictate reporting currency"; on a facility with no reporting-currency amount: "the sources materials will contain a selected FX rate for the reporting. and that can be used to calculate it."
- Money tables: CP-2D's liquidity bridge, CP-3C's refinancing need and CP-4C's value allocation take CP-1's money unit (`US$m` for USD, otherwise ISO code + `m`). They are told what it is, and told that a foreign instrument enters at T4.18's `Reporting Currency Amount`, otherwise `Not supplied`, never at a rate of their own. The issuer library accepts one money unit per table.
- The currency is not asked: neither start page asks for or sends `run.reporting_currency`, which is optional in the context. The `cp2d-non-usd` rule and the US-dollar warnings are removed. The library's run currency comes from CP-1.
- Forecast: the run's currency is CP-1's money unit. A CP-2G block stating another currency is refused. A facility whose T4.18 `Currency` is not the run's is refused, and its debt stays in the remainder at the interest-rate driver. CP-1's statement readers moved to `owners/cpos_cp1_statements.py` (a pure move; `.importlinter` gains membership only).
- Reviews:
  - Task reviews (mx-precise) on every task, PR 44 and PR 46.
  - Money-path review (mx-adversary): one High, fixed. The forecast took its currency from CP-2G's block, defaulting to USD, so a USD 125 balance was scheduled as GBP.
  - Whole-branch adversarial review (Opus 5.5; Fable unavailable): one Medium, fixed (CP-3C and CP-4C had no foreign-facility rule), and one Low on an ordinary USD input, fixed.
  - Re-review: all fixed. Each reviewer's probe exits 1 on 2cf77df7 and 0 on 981cad96.
  - Sweep (discover only): no High or Medium finding.
- Fidelity check (`tests/test_reporting_currency_proof.py`, deep pathway, hand-written expected amounts):
  - GBP and CHF runs go through the launcher's checks, delivery and the library with their own amounts (`£…m`, `CHF …m`).
  - A facility with no stated amount and no stated rate shows a `Not supplied` total, never 0. The total is a fixture cell, since no code sums T4.18.
  - The FX rate's locator appears only on Evidence.
  - A USD run's delivered files and pages are byte-identical to `main`'s, after normalising timestamps, temp paths and hashes; the instruction files differ on purpose.
- Correction to the PR 44 entry below: 14 of its 17 new cases failed before the change, not 9; three were added with the change.
- Commands, exit 0 on 981cad96: all 9 browser-marked files exit 0 (changes 1, cpos_launch 12, library full assessment 3, library changes 8, library page 104 + 1 skipped, model shell 7, reporting-currency proof 5, run start page 152, signal page 13);
  - `tools/quality_gate.py` (0 findings) and `lint-imports`;
  - `tests/test_cpos_launch.py` (930 passed, 1 skipped);
  - the facilities, scale, proof and CP-1 check tests (476 passed);
  - on 943280ee (web unchanged since): `npm --prefix web run` lint, format:check, typecheck, test (3,909), unused, duplication, build and `proof:connected` (Chrome and Edge).
- Not verified:
  - no live or paid run, and no real non-USD issuer, so whether models follow the new text is unknown;
  - CP-1 computing a total from T4.18;
  - the full weekly suite.

## 2026-11-16 — What the models are sent works in any currency (branch `claude/reporting-currency-method-text`, into `claude/reporting-currency`)

Scope: method text and the launcher and repair text sent to models, under ruling `docs/rulings/2026-11-16-reporting-currency-from-sources.md`; the forecast's unit reader (`cpos_forecast._CURRENCY`) and facility check (`_check_facilities`). No rule id, selector or money-table unit changed; the one new check behaviour is the facility refusal below; the frozen non-CP-1 selector digest is unchanged. No provider was called.
- Changed method text (new under the ruling, not copied from an earlier package; manifest named edits, METHODOLOGY-REVIEW rows): CP-1's step file (step 3: the presentation currency, a functional currency recorded in T4.2, conversion only at a rate the sources state; T4.18 gains `Reporting Currency Amount` and `FX Rate` (the rate only; its locator in `Source`) with their rules, the never-invent rule, amortisation in the instrument's currency, those cells plus the financing-cost row reconcile to `Total Debt`); CP-2D's SKILL Canon Core rule 11 (a foreign facility's debt balance at `Reporting Currency Amount`; its undrawn, commitment, amortisation or maturity amount only where CP-1 states it in the statements' currency, else `Not supplied`, never a partial total); CP-2A's stress copy and CP-8's method lose a USD default and three USD-only examples.
- Changed launcher and repair text: `VOICE_RULES`, `PERIOD_TABLE_BLOCK`, `UNIT_EXAMPLE` (CP-1 check block and its unit refusal), the CP-1, CP-2E and CP-2G script notes and `prose_checks.FIGURE_ADVICE` show a GBP (and euro) example beside each USD one. `_CURRENCY` reads any ISO 4217 code in capitals, so `CHFk` is thousands; a scan of every table cell of the 408 tracked Markdown files (45,746 cells) found none whose reading changed.
- PR 46 review (PR 2 controller; 1 High, 1 Medium, 2 Low), each fixed with its test red first: F1 `_check_facilities` refuses a facility whose T4.18 `Currency` is not the block's, naming it and its currency, and `FORECAST_BLOCK` tells CP-2G to leave it out (answer key: a GBP run, base debt 600, GBP term loan 250 at 6.00% and EUR notes EUR 400 = GBP 350; both rows refused, the GBP row alone accepted with year-1 interest 15.00 and unallocated debt 350); F2 rule 11 as above; F3 CP-1's check block: a figure in another currency is `Not supplied` "unless converted at a rate the sources state, as step 3 allows" (`CP1_CHECK_DIGEST` re-pinned); F4 `FX Rate and Source` renamed `FX Rate` so no locator is drawn outside Evidence.
- PR 46 review round 2 (M1, Medium): the F1 check failed open (a facility named `EUR notes due 2030`, an `Instrument` `EUR notes (2030)`, a `Currency` cell `Euro`). Now T4.18's `Currency` is an ISO 4217 code, `FORECAST_BLOCK` asks for names copied exactly, and where any T4.18 row's currency does not read as the block's, every facility must match a block-currency row exactly (trimmed, emphasis removed, ignoring case) or is refused, named. Answer key (c)-(f) refused, (g)-(h) accepted, round 1's (a)-(b) unchanged; two round-1 cases (a `Currency` cell blank or `Not supplied`) now refuse their facility, as the ruling requires. Every retained live CP-1 handoff with a T4.18 (4 files) reads USD on every row, so none is affected.
- Instruction sizes, each pathway's ceiling raised by its measured increase on the tree merged with base 943280e (+1,203 short_snapshot to +2,559 deep); method-text pins of CP-1, CP-2A, CP-2D and CP-8 recomputed. 9c685dd pins `CP1_CHECK_BLOCK`'s digest to show its money-unit sentence left CP-1's block alone; the widened unit example changes that block, so the test puts the example back before checking the pin, and F3 (below) re-pinned that digest for its added clause.
- Tests, red on the base source and green here: `test_cp1_is_sent_each_instruments_reporting_currency_amount_and_never_invents_a_rate`, `test_cp2d_is_sent_one_currency_rule_for_its_liquidity_tables`, `test_no_text_sent_to_a_model_gives_usd_as_its_only_example` (one kept exemption: CP-4's illustrative covenant quote `$200m`), `test_cpos_scale.py` CHF cases.
- Commands, exit 0 on the tree merged with base 943280e: `tools/quality_gate.py` (0 findings) and `--base origin/claude/reporting-currency` (CI's base; 0 findings); `pytest tests/test_cpos_launch.py tests/test_methodology_selection.py tests/test_method_scripts.py` (1,182 passed, 1 skipped); forecast tests `test_cpos_scale`, `test_cpos_periods`, `test_cpos_facilities`, `test_start_forecast_pathways`, `test_negative_cash_not_calculable`, `test_downside_follows_forward_model` (472 passed); `test_cpos_cp1_check`, `test_prose_checks`, `test_changes`, `test_context_form`, `test_context_module_options`, `test_credit_os_catalogue`, `test_run_expectations_words`, `test_run_start_service`, `test_inbox_activity` (1,521 passed, 1 skipped).
- Not verified: no real model has read this text; no non-USD run (live or paid); the full weekly suite. Oldest entry trimmed.

## 2026-11-16 — Report pages show a run's figures in its own currency (branch `claude/reporting-currency-report-pages`, into `claude/reporting-currency`, PR 2)

Scope: the connected React report only (`web/src/pages/connected/reportView.ts`, `report/Forecast.tsx`, `report/Securities.tsx`, `report/Modules.tsx` and their tests); ruling `docs/rulings/2026-11-16-reporting-currency-from-sources.md`. No Python, method, launcher or library change; `withUnit` and `unitLabel` unchanged. No provider was called.
- Owner, 2026-11-16: "it has to run run on any reported currency provided by the source files"; "the source files dictate reporting currency".
- Changed: the Overview credit-metric tiles (liquidity, free cash flow, net debt, contractual principal, maturities) take the run's money unit, the one the catalogue records with the run's cash figure (CP-1's), else the one money unit (`US$m|[A-Z]{3}m`) the table states, and carry the row's unit into the value and year change; a row or schedule in another unit draws no tile. The Forecast basis note accepts `<ISO code> millions` and labels the difference with it. On a non-USD run the Instrument decisions card notes that market levels are US market quotes in US dollars.
- Fidelity check: hand-written expected strings for GBP (`£1,250m`, `+£150m vs H1 2025`, `£5.00m`), CHF (`CHF 1,250m`, `CHF 5.00m`), EUR (`€5.00m`), mixed-unit tables and USD (`$1,250m`, `$5.00m`, the whole tile object); 9 new cases failed before the change, every USD case passed before and after. Two existing assertions pinned the superseded USD-only rule and change citing the ruling: the GBP maturity-schedule refusal now has its catalogue state the run's unit (`US$m`); the Forecast "unsupported unit" case uses `EUR thousands` for `EUR millions`.
- Commands, exit 0: `npm --prefix web ci`; `npm --prefix web run` lint, format:check, typecheck, test (172 files, 3,906 tests), unused, duplication, build; `tools/quality_gate.py` (0 changed Python files).
- Not verified: `proof:connected` (exit 1: it needs branded Google Chrome and Microsoft Edge, and this container has Chromium only; it stops at the brand check before any report page); a real non-USD run's pages. Oldest entry trimmed.
- Follow-up (owner, 2026-11-16: "fix price chart"; branch `claude/reporting-currency-report-pages` restarted from `claude/reporting-currency` after #44 merged): the Instrument decisions price and yield chart accepts CP-3's last-trade basis line with its amounts in any `<ISO code> millions`, not only `USD millions`; the trades stay US market quotes. Tests: the chart drawn for GBP, CHF and EUR (prices `$99.00`, `$89.00`, yields `7.005000%`, `9.12%`), red before the change; withheld for `GBP thousands`, `£ millions`, `GBPm`, `gbp millions` and a line naming two currencies. `npm --prefix web ci` and `run` lint, format:check, typecheck, test (173 files, 3,917 tests), unused, duplication, build: exit 0. Not verified: a CP-3 handoff from a real non-USD run; `proof:connected` (Chromium only, as above).

## 2026-11-16 — Earnings Update runs CP-1A (branch `claude/earnings-update-cp1a`)

Scope: the `earnings_update` preset and its copies (`src/deploy_vii/contracts.py`, `web/src/pages/connected/api.ts`, `docs/templates/context-form.html` `PATHWAYS` and `RUN_ORDER`) and the tests that pin them; ruling `docs/rulings/2026-11-16-earnings-update-cp1a.md`. Caps, launcher, registry, method files and delivery code unchanged. No provider was called.
- Owner, 2026-11-16: "Cp-1a should run most of the time. It describes the issuer."; asked about Earnings Update, "Add it to Earnings Update".
- Changed: the preset gains CP-1A after CP-MODEL; run order from `registry.plan` CP-0, CP-1, CP-1A, CP-1B, CP-DR, CP-2E, CP-1D, CP-5; `company-profile` is routed to CP-1A instead of omitted. The owner's `PRESET_ANSWER_KEY` changes for `earnings_update` only. Instructions 546,723 → 651,532 characters (+104,809); the prompt-size ceiling rises by that, to 651,538.
- Cap: USD 20 unchanged; estimate USD 4.18 to 5.64 from the last live Earnings Update run (USD 3.51) and CP-1A's recorded cost (USD 1.0643); not measured.
- Commands, exit 0: `tools/quality_gate.py` (0 findings); `tests/test_cpos_launch.py` whole (906 passed, 1 skipped paid); the brief's pytest set (1,082 passed, incl. `test_start_forecast_pathways`, `test_context_form`, `test_pathway_tiers`, `test_changes`, `test_run_expectations*`, `test_run_start_*`); `pytest -m browser tests/test_run_start_page.py` (152 passed); `npm --prefix web run` lint, format:check, typecheck, test (3,889), unused, duplication, build, proof:connected (Chrome and Edge).
- Not verified: an Earnings Update run with CP-1A (live or paid); the Company profile section's text in a delivered Earnings Update report; the Changes page against an earlier run without CP-1A (read from `changes.py`, not run).

## 2026-11-16 — Start a run: Leave out, fields in place of JSON, no raw data shown (branch `claude/module-removal-pathways-1d072a`, PR 1)

Scope: the connected React start page (`web/src/pages/connected/StartRun.tsx`, `api.ts`, `layout.tsx`, `start/*`), the summary answer's new `omitted_titles` (`owners/cpos_launch.py`, `run_start/submissions.py`, `run_start/service.py`) and the wording of 14 forecast rules (`run_expectations.py`). The launcher's rules, the digest, cap and acceptance code, the older start page and currency behaviour (PR 2) are unchanged. No provider was called and no paid run was made.
- Owner, 2026-11-16: remove modules likely to fail "as a means of reducing costs, so modules do not run"; "Users should never be putting data into JSON entries"; "fix, no raw data should be visible", then "Yes, rewrite them" for the forecast sentences.
- Changed: Leave out / Put back on each Will refuse card (the refusing modules and those refusing because they read them; the analyst presses Review run again); Valuation and peers, Module options and Scenario assumptions as fields with example input, the JSON text areas removed; a service refusal in the screen's labels, sent to its control through the field-error path where the control is drawn (the note's refusal to the note box), the rest in the notice; option labels for case kind, model and effort; omitted report sections by title; the Source lookup line in sentences; 14 rules' reason and fix reworded.
- Pre-existing defect fixed here (owner ruling 2026-11-16, relayed): the React page's pathway lists differed from the service presets — no `CP-MODEL` on any forecast pathway, and CP-1A on Relative Value and Portfolio Decision — so any explicit module list it sent (an Advanced choice, a carried choice, now a Leave out) published no forecast on Earnings Update, Relative Value and Portfolio Decision while the summary looked the same. `PATHWAYS` in `web/src/pages/connected/api.ts` now equals `deploy_vii.contracts.PATHWAY_MODULES` for every listed pathway (`tests/test_start_forecast_pathways.py` reads the expected lists from the service); `CP-MODEL` is sent but never drawn or counted as a module; a carried list gains it only on a pathway whose preset holds it. Presets and launcher unchanged. A module choice made at Advanced is cleared when the level leaves Advanced, so a Basic run sends `modules: []` again.
- Fidelity check: what is sent — N8 (Basic, nothing left out) compares the summary body with a literal written in the test, and the same test copied unchanged onto `main` a438cb9f passes there; N9 (Distressed, Legal & covenants left out) and R2a-c (one module left out on each forecast pathway, the preset list with `CP-MODEL`) pin the module lists; R1 pins `[]` at Basic after an Advanced choice. What is shown — refusal lines swept against every `_Rules` message template with no path, row index, snake-case token or quoted identifier left (D10); the review sheet's facts and module list, Leave out names, "Left out", the picker, the pathway cards and the focus choices never show a code or "Cash flow model" (R10, S3, S4, Task S fix round 1). Rule wording — a script loading `RULES` from `main` and from the branch compared all 21 rules field by field: only `reason`/`fix` differ (23 cells in 14 rules).
- Commands, exit 0, on the final tree: `npm --prefix web run` build, lint, format:check, typecheck, unused, duplication, test (172 files, 3,889 tests) and proof:connected (Chrome and Edge, 2 pass); `uv run python tools/quality_gate.py` (0 findings, 430 lines in scope); `pytest tests/test_start_forecast_pathways.py tests/test_run_expectations_words.py tests/test_run_start_submissions.py tests/test_run_start_service.py tests/test_context_form.py` (352 passed); `pytest -m browser tests/test_run_start_page.py` 152 passed (before the fix round, which changed only `web/src`).
- Review: one adversarial whole-branch review on Opus (High 0, Medium 2: a Basic run sending an Advanced module choice; the note's refusal on a question row that does not exist) and two scoped re-reviews (round 1 left a Medium: Leave out named "Cash flow model"; round 2 pass); the pathway-list change had its own task review (a Medium: the review sheet's Modules list showed and counted "Cash flow model"; fixed, re-review pass). Clean, with probes: Submit sends only the reviewed body; Leave out bypasses no acceptance, cap or digest; left-out modules do not run; the fields send loaded values back exactly ("0", "-50", "8.50", null, ""). A register-only refactoring sweep found no defect introduced and 13 Low structural costs, left for the next phase sweep; 7 Low and 2 Info review findings wait for the end batch.
- Not verified: a live or paid run from the page; focus, scroll and section opening for a routed refusal in a real browser by hand (jsdom tests and the browser proof only); Windows; the full Python suite.

## 2026-11-16 — Older start page: name refusal routes to the pathway step again (branch `claude/legacy-start-page-name`)

Scope: `docs/templates/context-form.html` (`errorStage`), `tests/test_run_start_page.py` and `web/scripts/connected-proof.mjs` only.
- Broke: after #40 the 15 browser tests in `tests/test_run_start_page.py` that open the review failed. Causes: (1) the service's new name sentence ("Enter your name as your first name and initial...") has no `submitted_by`, so `errorStage` gave a name refusal no "Go to" button; (2) setups that never typed a name now got a name refusal and so no summary items.
- Fixed: `errorStage` also matches `first name and initial` and sends it to `pathway`; eight page setups type `Ana L`; the "80 characters" assertion now reads the service's new sentence. `links == ["pathway"]` unchanged; it failed (`[]`) before the page fix and passed after.
- Commands: `pytest -m browser tests/test_run_start_page.py` 152 passed (one earlier loaded-machine run had 3 unrelated tests fail with a Chrome `CalledProcessError`; each passed alone and in the next full run); `tests/test_run_start_submissions.py tests/test_run_start_service.py` 257 passed; `tools/quality_gate.py` 0 findings.
- Proof: `npm --prefix web run proof:connected` also failed on a438cb9f (Chrome and Edge, exit 1: the Submit, spend up to USD 25.00 button never appeared) because `web/scripts/connected-proof.mjs` never entered "Your name"; it now fills `Ana L` and passes (2 pass, exit 0).
- Not verified: the page in a real browser by hand; React start page (unchanged); CI (deselects browser tests).

## 2026-11-16 — Teams cards carry the design as inline images (branch `claude/zealous-keller-yvc5mb`)

Scope: presentation of the four Teams cards only (`inbox/teams.py` card parts, `inbox/teams_brand.py`, new `tools/teams_brand_images.mjs`); no change to when or what is posted.
- Owner asked why the cards fell short of the mock-ups, then "try step 2 now": the brand pieces as images inside the card.
- Changed: status pills, shapes and meta icons are the app's own, drawn by the tool as palette PNGs (pill about 1.2 KB, shape about 0.2 KB); the state stripe, progress bars, callout tints and the Stopped tile are PNGs made by the sender, the tints partly transparent; `Badge`, `ProgressBar`, `Icon` and Markdown bold are no longer used; summary rows stop at a posted size of 23 KB; the post is compact JSON.
- Fidelity check: the four sample cards in `docs/design/teams-cards/` rendered with adaptivecards 3 and Microsoft's Teams light and dark host configurations (`adaptivecards-designer`), `rendered-light-dark-2x.png`, compared with `docs/design/mockups/teams-cards.html`: header, stripe, pills, icons, callouts, bars, tiles and rows match the mock-up's layout; the font, the button colour and rounded borders do not (Teams' own). Sizes posted: 9.7 to 11.1 KB for a run card, 20.9 KB for the sample summary with five finished rows.
- Tests: `tests/test_inbox_teams.py` 76 passed, with the stripe colour, bar fill and tint alpha read from the PNGs by a reader written in the test; scheduler, service and React-server files passed; quality gate 0 findings.
- Not verified: Teams itself, light or dark, desktop or mobile.

## 2026-11-16 — Teams run cards and the analyst's name (branch `claude/zealous-keller-yvc5mb`, `main` at `52f798f` merged)

Scope: a new sender (`src/deploy_workflow/inbox/teams.py`, `teams_brand.py`), its hook in the scheduler and the two services' start-up, the name rule in `run_start/submissions.py`, the React start page and the older start page's help text. No provider, handoff, module or library change; nothing was posted to Teams and no paid run was made.
- Owner, 2026-11-16: cards for run activity only (started, report ready, stopped, summary); summary at 09:00, 13:00, 17:00 and 21:00 UK time on weekdays, skipped when quiet, five finished runs then a count; every card links to the library; the analyst's name is required as a first name and one initial ("Eric G"), two allowed ("Eric MG").
- Changed: with `CREDIT_OS_TEAMS_WEBHOOK` and `CREDIT_OS_TEAMS_LINK` both set the scheduler posts each run's cards once (ledger `_engine/teams.json`; the first poll records existing runs and posts none) and the summary on its slots; with neither it posts nothing; with one the service refuses to start. `submitted_by` is refused unless it is a first name, a space and one or two capital initials, on the service and on the React page (same rule, `start/analystName.ts`); an empty name is refused. The report-ready card carries the library Overview's lead bottom line (`summary_fields`) unchanged.
- Tests (synthetic, no network; posts go to a list): `tests/test_inbox_teams.py` 74 passed, with expected card texts written out by hand, the UK summer-time boundaries of 2026, restart, failed-post, unsaved-ledger, hand-edited-record and unreadable-ledger cases, a local HTTP server for the post and its refused redirect, and one scheduler run through the fake launcher; `tests/test_run_start_submissions.py` 153 passed (7 accepted and 12 refused names); the scheduler, service, activity, prior, context-form, React-server and launcher files, 1,900 tests in all, passed; `web`: `src/pages/connected` 34 files passed, typecheck, eslint, prettier and knip clean. Quality gate on the working tree: 0 findings.
- Review: one independent adversarial review of the working tree (2 High, 5 Medium, 7 Low) and its simpler-design pass. Fixed: any exception in the sender is caught and logged, so a bad record or a garbled reply cannot stop the poll; a webhook or link with an unreadable port, a control character, a query or a fragment refuses the start; launched runs no longer inherit the webhook; the summary lists at most 18 rows (measured under 22 KB for a 93-run day with 80-character names); a failed ledger save no longer stops the pass; the retry counter is replaced by an age limit (two hours for a run card, the slot window for a summary) and a summary that was not posted leaves its runs for the next; a redirect is refused. Left as designed: a run ending after 21:00 UK is in no summary; module-written Markdown marks in the bottom line are shown as written.
- Card check: the four payloads in `docs/design/teams-cards/` are the sender's output for sample runs (5.2 to 12.8 KB posted); rendered with Microsoft's reference renderer (adaptivecards 3), where the header, layout and text draw and `Badge` and `ProgressBar` fall back to text.
- Not verified: a post to a real Teams channel, and so how Teams draws `Icon`, `Badge`, `ProgressBar`, `icon:Library` and the Fluent icon names; `tests/test_run_start_page.py` (browser), edited to type a valid name but not run: headless Chrome's `--dump-dom` hangs in this container even on a one-line local file; the full `web` gates and the full Python suite; Windows.
- For the owner: card text goes to Microsoft (issuer, pathway, analyst name, times, counts, cap, the lead bottom line); a card's links work only for a reader who can reach `CREDIT_OS_TEAMS_LINK`; the report-ready card shows no count of stated limits because the library holds none; earlier records keep their free-text names and the summary shortens them ("Dana Reyes" to "Dana R"). The oldest entry here (2026-11-13, CP-DR web lookup) was trimmed to stay under 1,000 lines; git history keeps it.
## 2026-11-16 — Reader: year-on-year comparator on metric cards; colour by a fixed better/worse table (branch `claude/reports-formatting-updates-cfb43a`, not pushed)

Scope: the catalogue's headline metrics (`src/deploy_workflow/credit_os_catalogue.py`: `chart_rows`, `prior_metric`, `handoff_metrics`) and the connected reader (`web/src/pages/connected/{signal.ts,HeadlineFigures.tsx,reportView.ts,report/YearChange.tsx,report/Changes.tsx,report/IdentityBand.tsx}`, `web/src/pages/library/{slice.ts,parts/MetricTile.tsx,parts/ChangeCard.tsx}`). Sits on the entry below.
- Changed: each headline metric gains `prior {value, period}` and `change` (current minus the same column one year earlier, `Decimal`, as written) when exactly one prior-year row with a quotable figure and the same unit exists; else the metric is unchanged. Library and Overview headline cards and the Overview credit-metric tiles draw `[arrow] +0.2x vs FY2023` under the value; the tiles take the prior column from the CP-1 Period table (Start and End both one year earlier) and subtract in exact decimal (`exactDifference`, BigInt). No prior, no comparator. Colour: comparator, comparable Changes cards and rating outlook use the success or error text colour; sign, arrow and a hidden word carry the same meaning.
- Fidelity check: answer key `web/src/pages/connected/signal.cases.json` (46 cases, exact equality, written by the coordinating session); catalogue tests per key line plus a `hypothesis` property (`change == format(Decimal(a) - Decimal(b), "f")`); tile tests for label and dated periods, ambiguous and missing Period rows. Seen in the browser proof on the synthetic run: five headline cards with comparators (`-0.75x`, `-0.95x`, `+0.80x`, `-$25m`, `-$50m` vs FY2023) in the expected colours.
- Gates, exit 0, on the working tree: `npm run gates` from `web/` (170 files, 3,542 tests) before the last fix; after it `vitest src/pages` (133 files, 3,101 tests), typecheck, lint, format, unused, duplication, build, `npm run proof:connected` (Chrome and Edge); `uv run python tools/quality_gate.py`; `pytest tests/test_credit_os_catalogue.py tests/test_changes.py` (721 passed).
- Reviews: `mx-precise` task review: pass, no High or Medium; its Info note that label periods (`FY2024`) gave the Overview tiles no comparator was fixed test-first (one round, not re-reviewed).
- Rulings (coordinating session, for the owner to confirm or reverse): the change is this year minus last year; lower is better for leverage, net leverage, gross and net debt; higher is better for coverage, cash, undrawn, liquidity and free cash flow; principal and maturities carry no judgement; gaps, limitations, "Changed" markers, Downside, rate sensitivity and Forecast stay uncoloured.
- Known: a chart table with a half-year, LTM or repeated period yields no headline metric, so no comparator; the launch check (`owners/cpos_launch_tables.py`) already refuses such a table, so a finished run cannot hold one.
- After merging `main` at `7e2724b8` (commits `6a669c94`, `f5105bb9`, conflicts in this file and `reportView.test.ts`, both sides kept): the three blue links `main` added in `report/OverviewModules.tsx` use `link-gray`; the band's CP-1A description and sector go through `readerText` (PR-manager ruling), entered sector and ratings as entered; the back-end subtraction is exact at any length and a zero change has no sign (was rounding past 28 digits, `-0`); the browser proof enters one rating at run start and asserts it, with a red Negative outlook, in the band. Gates, exit 0: `npm run gates` (170 files, 3,577 tests), `npm run proof:connected` (Chrome and Edge), quality gate, `pytest` catalogue and changes (725 passed), the reviewer's `py_prior_metric.py` probe. These fixes were not separately reviewed.
- After merging `main` at `94110a54` (`b35ae746`; conflict in this file only): whole-branch review (`mx-architect`, `adversarial-reviewer`): two Medium, no High. Fixed test-first in one round, re-reviewed clean by `mx-precise` against the reviewer's probes: (M1) `prior` and `change` are sent only when both years' `Basis and limitation` give the same `definition_key`, the cross-run comparison's own rule, now one function in `credit_os_catalogue.py` that `changes.py` imports (reconstructed TDG rows had drawn `-0.33x vs FY2023` in green against a pro-forma basis note); (M2) a CP-1A description holding a source reference draws `Business description in Evidence` and the trace control, no text or title; a handoff sector holding one is omitted. Gates on that head, exit 0: `npm run gates` (170 files, 3,612 tests), `npm run proof:connected` (Chrome and Edge), quality gate, `pytest` catalogue and changes (729 passed), probes `py_tdg_basis.py`, `py_prior_edges.py`, `intact_and_contrast.sh`. Parked Low: Company profile fact read by position; `link-gray` links do not wrap; `docs/design/design-system.md` still says links are Ultramarine; `library/parts/MetricTile.tsx` imports from `connected/`; rating date and clamped description reachable by hover only.
- PR #37 review round (PR manager, Medium): better and worse differed by colour alone. Fixed test-first, re-reviewed clean (`mx-precise`): `report/ToneMark.tsx` draws a filled circle with "better", a diamond with "worse", a ring with "unchanged" as visible text, once, on the comparator and comparable Changes cards; no tone, no word or shape. The band shows "Entered at run start" with the rating tiles. Ruling recorded as relayed: `docs/rulings/2026-11-11-reader-and-issuer-report.md`, amendment 2026-11-16 (two delivery exceptions; cap waived for #37). Gates on the head merged with `main` `e70380c5`, exit 0: `npm run gates` (170 files, 3,615 tests), `npm run proof:connected` (Chrome and Edge, with a 375px no-overflow check on the Overview cards), quality gate, `pytest` catalogue and changes (729 passed). Parked Low: the 375px check does not assert it found cards; a trailing separator shows where the comparator line wraps.
- Owner round after #37 merged as `85292995`, for a follow-up PR, 2026-11-16 ("use different measure revenue or adj ebitda"; "drop undrawn"; "Yes, add note"; "fix"): `cash` carries no judgement, `revenue` and `adjusted_ebitda` are judged (higher is better) and sent by the catalogue from `Chart data: revenue and EBITDA` with prior and exact change (well-formed comma-grouped money accepted for these two keys only); headline cards are net leverage, gross leverage, interest coverage, revenue, adjusted EBITDA, cash; the band adds one link, "Ratings & triggers shows a different rating for <agency>", when an entered issuer rating differs from every issuer-level row of that module's `T2R.1` register (no register text drawn); the comparator's trailing separator is gone and the 375px proof check asserts it found cards. Review (`mx-precise`): one Medium (the note ignored issuer versus instrument scope, from the brief's rule), fixed test-first and re-reviewed clean with an asserting probe. Gates on `8a98f270` (merged with `main` `d6282d80`), exit 0: `npm run gates` (170 files, 3,641 tests), `npm run proof:connected` (Chrome and Edge); on its parent merge `fb98c924`: quality gate, `pytest` catalogue and changes (733 passed); the fix after it changes only `IdentityBand.tsx` and its test. Parked Low: a note can still show when the register's only issuer-level row is a subsidiary's, a withdrawn rating, or an instrument row that mentions "the issuer". Not verified: the Revenue and Adjusted EBITDA cards and the note in a browser (the synthetic run has neither); a real ratings-module handoff; the older library page now drawing `revenue`.
- For the owner: the PR is 1,940 changed lines by the global gate's count (820 without tests, answer keys and this file); split or waive. The year-on-year change is computed by delivery and the better/worse table is a new judgement; both were asked for in this session and sit against "delivery adds no analysis".
- Not verified: a real CP-1 handoff or a paid run; the Overview tiles and coloured Changes cards in a browser (tests only); the band with a real description in a browser; colour contrast and screen-reader reading; `confidence-review`, `rewrite-tournament`, `/sweep refactoring discover` and the whole-branch review; Windows.

## 2026-11-16 — Reader: company band in the report header, one money format, gray links (branch `claude/reports-formatting-updates-cfb43a`, not pushed)

Scope: presentation of the connected issuer report (`web/src/pages/connected/`, four files under `web/src/pages/library/`, `web/src/components/base/buttons/button.tsx`), `web/scripts/connected-proof.mjs`, and the catalogue's `ratings` field (`src/deploy_workflow/credit_os_catalogue.py`). No module prompt or method changed.
- Changed: (1) `report/IdentityBand.tsx` between the header and the tabs on every report tab: business description verbatim from CP-1A (`company_description` register, else the single `Business` row of `Company profile`), sector (catalogue, else register, else `Sector and segments` row), and the ratings the analyst entered at run start, now passed through the catalogue as `label/agency/scope/outlook/date` (was `[]`); missing or ambiguous data is drawn as a stated gap. (2) `withUnit`/`unitLabel`: millions of a currency read `$2,222m`, `£1,250m`, `€90m`, `CHF 300m`, labels `$m`; digits unchanged, no rounding. (3) 23 blue underlined links became kit buttons in a new `link-gray` colour, the trace fallback an icon button; destinations and accessible names unchanged.
- Fidelity check: answer key `web/src/pages/connected/moneyUnits.cases.json` (33 cases, exact equality, written by the coordinating session); `ReportLibrary.identity.test.tsx` (9 tests: exact strings, precedence, gaps, position on four tabs); `linkStyle.test.ts` (no `text-action` + `underline`, no new `link-color` under `connected/` or `library/`). Existing expectations changed only from old unit wording to the new format of the same digits.
- Gates, exit 0, on the working tree: `npm run gates` from `web/` (166 files, 3,488 tests, lint, format, typecheck, audit, unused, duplication, build, script tests, file gates); `npm run proof:connected` (Chrome and Edge, synthetic run); `uv run python tools/quality_gate.py` (0 findings); `pytest tests/test_credit_os_catalogue.py` (22 passed).
- Reviews: `mx-precise` task review: one Medium (sector tied to the description's source), fixed in one round and re-reviewed clean against the reviewer's probe; no High.
- Rulings (coordinating session, for the owner to confirm or reverse): ratings come from the run-start entries, not CP-2H (which runs in two pathways only and has no fixed register shape); module-written text and cells (for example `−USD 5.13 million`) stay verbatim; a non-numeric value with a money unit is drawn without the unit.
- Known: `ReportLibrary.wayfinding.test.tsx` and `ConnectedApp.test.tsx` each timed out once in a full run under load and pass alone; the first reproduces on unchanged code. Parked Low/Info: `(150)`, `+10`, `150*` with a money unit lose the unit (no upstream source writes these); outlook lookup on a plain object; diff is about 840 lines.
- Not verified: the band with a real description and rating tiles in a browser (the synthetic run shows the gap state only); a real CP-1A handoff carrying the `company_description` register; entered ratings through a published `data.js` end to end (path read, not run); the older issuer-library page with a non-empty `ratings` list; `confidence-review`, `rewrite-tournament`, `/sweep refactoring discover` and the whole-branch review were not run; Windows.

## 2026-11-16 — Browser proof on merged `main` (`4be1e30d`)

Scope: `npm --prefix web run proof:connected` on the tree at `4be1e30d`, after `uv sync --locked`, `npm --prefix web ci` and `npm --prefix web run build`. Beyond the earlier run at `ab661d8d`, `main` now also contains #25, #26, #28, #29, #30 and #31. Synthetic Northbridge case with canned model responses; no provider, no paid run, no credentials. Load average at start 4.99.
- Result: pass. Exit code 0; 2 of 2 browsers run and passed (tests 2, pass 2, fail 0, skipped 0). Google Chrome 157.0.8103.78 completed run `20261116-152404-01`; Microsoft Edge 157.0.4341.60 completed run `20261116-152432-01`. No check failed.
- Not verified: Windows; the proof ran once; the proof drives no row control of the typed-row editor (#20, #21) and the pages and controls its script does not open; the reader's PR 3 and the reports-formatting work are not yet on `main`, so the proof must run again after they land.

## 2026-11-16 — Start a run: errors on their fields; focus, announcements and readiness (PRs #31 and #30, merged to `main` as `8c76c434` and `4be1e30d`)

Scope: PR D of `docs/superpowers/plans/2026-11-16-start-run-review-and-rows.md`, split in two: #31 (Task 6, 529 changed lines): `web/src/components/base/buttons/button.tsx`, `web/src/pages/connected/{StartRun.tsx,ConnectedApp.test.tsx}` and `web/src/pages/connected/start/{RowEditor.tsx,RowEditor.test.tsx,rows.ts}`; #30 (Tasks 7 and 8, 799 changed lines, stacked on #31): `web/scripts/connected-proof.mjs`, `web/src/pages/connected/{StartRun.tsx,layout.tsx,ConnectedApp.test.tsx}`, `web/src/pages/connected/start/{RowEditor.tsx,RowEditor.test.tsx,StartReadiness.tsx}` (new) and `web/src/pages/run/start/{Purpose.tsx,Start.tsx}`. The cap, review, acceptance and submit code is not changed (compared byte for byte by a probe); in #31 the validation messages, their order and the point they are raised are the same, only where the message is drawn changed; in #30 `withDraft` gained only the focus memory.
- Changed (#31): a validation problem is shown on its own field instead of one notice at the top: the page goes to the field's step, opens the section it sits in, focuses and scrolls to it, and draws the message under it; editing the field clears it. Beside the step action, `1 problem to fix: …` takes the analyst back to the field and wraps on narrow screens. Service refusals and network failures stay in the general notice. Row editors: a row keeps its open or closed state when a row above it is removed; after Remove, focus stays in the editor; required fields (quote date and provider, rating agency and rating, question text) are marked, as the static form requires them.
- Changed (#30): keyboard focus stays where it was when a request finishes; a step's heading takes focus only after a step change, not on first load. After inspecting, `1 document inspected, 0 ignored.` is announced, and announced again on a repeat. Readiness is four status rows (Documents inspected, Purpose chosen, Decisions made (`n of m`), Summary approved) with the cap bar; on narrow screens one line beside the step action: `2 of 4 ready · USD 0.00 of USD 25.00`. "Purpose chosen" stays Met after going back a step; it resets only on a different issuer or a carried-over run. Help lines: case kind, run form level, the earlier run's as-of date, and "Add at least one document to continue." Pathway cards show a radio dot; the review's actions stack on mobile with Submit last; the mobile step line and the stepper labels switch on one condition. Rows: the facility requirement is stated once; an invalid field has an error border; "Required" sits beside its label; removing a row is announced.
- Gates: #31, web gates (`npm --prefix web run gates`) exit 0 with current `main` merged in (the last step, route visits in a browser, timed out once at 60 s and passed on re-run); `tools/quality_gate.py` exit 0; Chrome proof (`web/scripts/connected-proof.mjs`) exit 0 on #30's branch, which contains #31's change, with current `main` merged in. #30, web gates, the Chrome proof and `tools/quality_gate.py` exit 0 with current `main` merged in; the proof's new keyboard-stepper and focus-after-Inspect checks pass. The commit each ran on is not stated in either body.
- Fidelity check (#30): against the synthetic service's own `/summary` (Northbridge case, Playwright in Chrome, 17 checks, all pass): each of the 8 items needing a decision is in exactly one decision card; issuer, as-of date, pathway, module count, cap and documents match the response; no module code or launcher flag in the review at the Basic level. Looked at in Chrome at 1440, 900 and 390 px, every step: no horizontal overflow; focus stays on "Inspect documents" after inspecting. #31 was looked at in Chrome against the synthetic service at 1440, 1100, 768 and 390 px (before `main` was merged in): the error sits under its field with focus in it; the problem button fits the viewport at every width (it was cut off at 390 px before the last commit).
- Reviews: #31: task review (one Medium, a line added inside `changeRun`, fixed and re-reviewed); a separate review of the paid-submit path (pass: no sequence enables Submit on a stale or unapproved summary); sweep discovery, confidence-review, ponytail-review and rewrite-tournament (no defect); whole-branch adversarial review (pass, no High or Medium). #30: task review (spec met); a separate review of the paid-submit path (pass: readiness rows equal the gates they describe; the cap shown equals the cap sent); sweep discovery, confidence-review, ponytail-review, rewrite-tournament; whole-branch adversarial review, which failed the first head on one Medium (the purpose row after going back), fixed test-first and re-reviewed: approved, no High or Medium open.
- Rulings / Known: one ruled change to the plan's own test: "Purpose chosen" is Not met on the Purpose step until Continue. #31 known, handled in #30 or left for the owner: the footer says "1 problem" when more than one field is wrong, the next one shows after the first is fixed; cutoff and turns messages sit behind the browser's own date and number checks.
- For the owner (not fixed here): a step not yet reached is drawn as amber "Not met"; the badge set has two states. Below 1041px the one-line summary and the full panel are both drawn. The Basic-level help line names Advanced inputs (the plan's sentence). Older than this work: a run id in "Starting from run …" on Documents; a general notice drawn above the step heading with no scroll to it; the review's content reaching the card edge at 390px; focus lost after removing a document. Owed at merge: this entry, and the `/impeccable critique` re-run against the 21/40 baseline, which is still owed.
- Not verified: Edge and Windows; a screen reader (whether the message is read once or twice; the announcements); Safari and Firefox; development StrictMode focus order (the built bundle is not affected); a paid run against a live provider; the earnings and new-issue pathways in the browser proof; the `/impeccable critique` re-run; #30 was retargeted to `main` after #31 merged; the merged tree equals #30's head tree, on which CI's two checks had passed; nothing was re-run on `main`.

## 2026-11-16 — Final audit: stage briefs and cloud launch prompt (PR #29, merged to `main` as `7e2724b8`)

Scope: documentation only: the new `docs/audit/2026-11-16-final/` (the briefs for the final audit before the work-PC hand-over); no application code changes.
- Changed: `README.md` (scope with Signal excluded, stages, the 12 sections, rulings and the rules every agent follows), `FINDINGS-SCHEMA.md` (one finding format and the severity table), `stages/0-baseline.md` to `stages/7-send-off.md` (one brief per stage), `CLOUD-PROMPT.md` (the prompt that starts the audit in a cloud session) and `work-pc-init-prompt.draft.md` (draft first-setup prompt for the work PC; stage 7 finishes it as `docs/work-pc/WORK-PC-INIT-PROMPT.md`). Docs only, so it took the batched docs review; no sweep or whole-branch review applies.
- Gates: none stated in the PR body beyond: every path the briefs cite was checked to exist.
- Not verified: the audit has not been run; the briefs are untested as a workflow; the commands the briefs name were not executed; ruling R3 (which findings are repaired or parked) is the author's reading, not confirmed by the owner; CI's two checks passed on the PR head before merge.

## 2026-11-16 — Wayfinding test: wait up to 5 s for the first render (PR #28, merged to `main` as `a9a9420b`)

Scope: test only: `web/src/pages/connected/ReportLibrary.wayfinding.test.tsx`. No assertion, fixture, source or config file changes.
- Changed: one line, `configure({ asyncUtilTimeout: 5000 })`, for this file only (its 14 `findBy…` waits were on Testing Library's 1,000 ms default); the rest of the diff is prettier wrapping the import.
- Gates: before, on `main`'s reader code at a load average of about 60, the full suite failed 1 of 3,456 (this file) and the file alone failed 2 of 3 runs, always its first test at 1.0–1.2 s. After, on `a1ec33f9`: `npm test` exit 0 (load rose from 15 to 89 during the run); the file alone passed 6 of 6 runs; `npm run lint`, `format:check`, `typecheck`, `unused` exit 0.
- Not verified: not run at the load of 170–210 where up to 4 of the 14 tests failed, so a slower machine could still pass 5 s; why the first render takes over a second was not profiled; CI's two checks passed on the PR head before merge.

## 2026-11-16 — Reader: unnamed module brackets keep their attribution; the Changes page states no-comparison in plain words (PR #26, merged to `main` as `5df9c29b`)

Scope: `readerText` and `publishedReport.ts`, `report/Changes.tsx`, `report/Record.tsx`, `api.ts` and `start/ReviewSheet.tsx` under `web/src/pages/connected/`, with two ruling files in `docs/rulings/`. Owner rulings of 2026-11-16 on three items left open by #23 and by the review of rewritten work: the dropped attribution, launcher text on a findings page, and the scope of the web-search statement.
- Changed: on findings pages a bracketed code directly after that module's own name is still dropped; after any other words a known code becomes " (module name)" ("The haircut (CP-3) holds." now reads "The haircut (Security selection) holds."); an unknown code stays; `plainModuleNames` (Evidence page, trace drawer) is unchanged. The Changes page draws none of the service's reason text and states which case applies in a fixed sentence: "First run of this pathway." (plus "An earlier run exists but could not be used for comparison." when one was skipped), "The comparison was planned but not produced for this run.", "This run was not compared with an earlier run.", or the existing "No comparison was recorded for this run."; the reference check reads the raw note. Evidence draws the raw stored note as "Comparison note:" in the Run record card. `changesSentence` moved from `start/plain.ts` to `api.ts` beside `serviceText`; Start's review draws what it drew before.
- Answer key: `moduleCodes.cases.json` gains 8 rows (34 in all); the earlier 26 are unchanged. One pins an accepted outcome: a handoff that names a module differently ("Financial data foundation (CP-1)") draws as "Financial data foundation (Financial foundation)".
- Gates: at `14aa7326`, from `web/`, exit 0 (implementer): lint, format:check, typecheck, unused, duplication; the six affected test files (106 tests, also run by the reviewer). The full suite was run at `3b92ff61` (3,454 passed) and not re-run after the fix round because the machine was under heavy load; CI on the PR is the full-suite run. Merges cleanly with `main` at `1748db76` (#25 in); nothing else reads the note.
- Reviews: task review (`mx-precise`) at `3b92ff61`: one Medium (the reference check ran on converted text and let a mangled register id through), fixed; scoped re-review approved. Every real note form the service writes (not accepted, pack not built, module failed with a register id, budget and cap notes, run folder, earlier run unavailable, first run with and without a skipped run) was run through the page: no error code, launcher wording, figure, module code, run id or folder is drawn. New tests were seen failing first. The whole-branch adversarial pass, `confidence-review` and `rewrite-tournament` were not run.
- Rulings / Known: rulings recorded in `docs/rulings/2026-11-11-reader-and-issuer-report.md` (2026-11-16 amendment extended) and `docs/rulings/2026-11-11-run-start-submit.md` (the web-search statement shows for public and private cases). Low, parked: `Evidence.test.tsx` removes its `fetch` stub at the end of the test body, not in `afterEach`; three hand mutants of the new bracket code survive because a later pass gives the same text.
- Not verified: any page in a browser; a retained run (literal notes and fixtures only); a stored note that begins with none of the three phrases, beyond the empty and referenced cases; Windows; CI's two checks passed on the PR head before merge; nothing was re-run on the merged tree.

## 2026-11-16 — Reader Overview: one bottom line per module and the run's limitations (PR #25, merged to `main` as `1748db76`)

Scope: PR 2b of `docs/superpowers/plans/2026-11-16-connected-reader-high-gaps.md` (Task 7): `ReportContent.tsx`, `ReportLibrary.tsx`, `reportView.ts` and the new `report/OverviewModules.tsx` under `web/src/pages/connected/`, with their tests. `readerText`, `report/Changes.tsx` and `api.ts` are not touched.
- Changed: Overview shows, after the lead module's passages and the figures, a Bottom line by module (one row per other module that ran, in run order: name linked to its module page, state badge, the module's bottom line, one trace control; a bottom line that holds a source reference is a link to Evidence; a module that wrote none shows a gap) and Limitations (every limitation the run's modules wrote, each once, first writer kept, shown as written less its Basis line and module codes, with the module's name and a trace control). The lead's own Limitations passage is no longer drawn separately on Overview. Earlier-format runs (a Reader summary, no passages): the summary's bottom line and limitation are used, read without bracket citations. Module-written text goes through `readerText`.
- Gates: on `9acc9b7f`, `npm run lint`, `format:check`, `typecheck`, `unused`, `duplication` exit 0. The full suite was not green on the head commit: `npm test` on `9acc9b7f` gave 163 files, 3,456 tests, 2 failed, both in `ReportLibrary.wayfinding.test.tsx`, at a machine load average of 170-210; that file is not touched, it failed the same way on `daf62560` (before this branch) under load and passed 14 of 14 at normal load. The last green full run is the previous commit `90063705` (3,452 tests). 681 changed lines against the 800 cap (including the plan document).
- Reviews: task review approved, no High or Medium. Whole-branch adversarial review: one Medium (earlier-format runs said no limitation was recorded), fixed in `9acc9b7f` and re-reviewed clean with mutation checks. Not run: `/sweep refactoring discover`, `confidence-review`, `rewrite-tournament`, the browser proof and fidelity check.
- Rulings / Known: parked Low findings: a lead limitation written as a table is not on Overview; a module with outputs but no designated one is absent from the list; two limitations from one module give same-named trace buttons; a `* ` bulleted list is parsed as one item (predates this branch); de-duplication ignores punctuation, as the producer's check does.
- For the owner: the PR body asked for `npm test` to be rerun at normal load before merging.
- Not verified: no real published run checked, earlier-format included; a summary limitation that reads "None" would be listed as a limitation; the full suite on the head commit; CI's two checks passed on the PR head before merge; nothing was re-run on the merged tree.

## 2026-11-16 — Browser proof on merged `main` (`ab661d8d`)

Scope: `npm --prefix web run proof:connected` on the merged tree at `ab661d8d`, after `uv sync --locked`, `npm --prefix web ci` and `npm --prefix web run build`. Synthetic Northbridge case with canned model responses; no provider, no paid run, no credentials.
- Result: pass. Exit code 0; 2 of 2 browsers run and passed (tests 2, pass 2, fail 0, skipped 0). Google Chrome 157.0.8103.78 completed run `20261116-132537-01`; Microsoft Edge 157.0.4341.60 completed run `20261116-132612-01`. No check failed, so the `checkForecastEvidence` failure that #21's body reports on a tree with `main` merged did not occur here.
- Not verified: Windows; the proof drives no row control of the typed-row editor (#20, #21); the proof ran once.

## 2026-11-16 — Start a run: context as typed rows (PRs #20 and #21, merged to `main` as `b18d6a7c` and `ab661d8d`)

Scope: the More context step of Start a run (PR C of `docs/superpowers/plans/2026-11-16-start-run-review-and-rows.md`, Task 5, split in two): `web/src/pages/connected/start/{rows.ts,RowEditor.tsx,RowEditor.test.tsx}` (#20, 602 added lines, nothing an analyst sees until #21) and `web/src/pages/connected/{StartRun.tsx,ConnectedApp.test.tsx}` (#21, 249 changed lines). The pathway cap, review, acceptance and submit code is not changed.
- Changed: facilities and deal terms, quotes, ratings and research questions are typed, repeatable, labelled rows with add and remove, with labels, hints, placeholders and options ported from `docs/templates/context-form.html`, in place of four JSON text boxes. Each row sends every key of the service's model for its kind (17 facility, 9 quote, 5 rating, 2 question) as trimmed strings, `""` when blank; new-issue-only facility keys are `""` when the run is not a new issue; a row still exactly as "Add" created it is not sent; keys the page does not know are kept. Valuation, scenario assumptions and module options stay as JSON, drawn only at the Advanced level or at any level while they hold an edit. A kind the analyst did not edit is sent exactly as the prior run held it.
- Gates: #20, `npm --prefix web run gates` exit 0 with current `main` merged in. #21, web gates and `tools/quality_gate.py` exit 0 with current `main` merged in. Chrome proof on #21: exit 0 before `main` was merged in; with `main` merged it failed in `checkForecastEvidence` (`connected-proof.mjs:990`), and `main` failed at the same assertion without the change. The proof on merged `main` at `ab661d8d` is in the entry above.
- Reviews: task review, sweep discovery, confidence-review, ponytail-review, rewrite-tournament and a whole-branch adversarial review on the whole of PR C. The whole-branch review failed the first head on one High (rows sent with blank keys left out, refused by the service) and one Medium (values sent untrimmed); both were fixed test-first and the re-review approved with no High or Medium open. #21's final head was approved with no High or Medium finding open. Looked at in Chrome at 1440 and 390 px against the synthetic service.
- Rulings / Known, parked for PR D: a row's open or closed state follows its position after a row above is removed (values stay on the right row); focus falls to the page when the last row is removed; no required marks or checks before review, so a refused value is learned at review; an all-blank prior facility is dropped when another facility is edited.
- For the owner: #21's body owes this entry as the fidelity-check record for PR C (what the rows send against the service's reader and the static form); the record is the scope above and the reviews' probes, which called the service's reader directly.
- Not verified: Edge and Windows; real keyboard and screen-reader use; a live request to the service (the service's reader was called directly by the review probes); paid mode against a live service; the Chrome proof drives no row control; #21's branch was updated with `main` (head `737d0758`) before merge and only CI ran on that head.

## 2026-11-16 — Reader and Start: one rule for module codes on screen (PR #23, merged to `main` as `bbb5b3dd`)

Scope: module codes drawn on the connected issuer report reader and Start, under `web/src/pages/connected/` (`publishedReport.ts`, `api.ts`, `ReportContent.tsx`, `report/{Changes,ModuleTable,calculations}`, `start/{plain,ReviewSheet}`) with tests, `moduleCodes.cases.json` and `moduleCodes.test.ts`, and `docs/rulings/2026-11-11-reader-and-issuer-report.md`. Fifteen files. Two sessions had written two module-code strippers for the 2026-11-16 ruling (#6 for Start, #13 for the reader); this makes one rule with a named function per kind of text.
- Changed: findings pages use `readerText` (new, in `publishedReport.ts`): it drops " (CP-x)" after a name and replaces a standalone module code with the module's name; a run of codes joined by "/" is replaced code by code; a code inside a register id, a file name or a path, and an unknown code, stay as stored. Used by prose, tables, bottom lines and trace-control labels in `ReportContent.tsx`, the Changes cards, and the typed table cells in `report/ModuleTable.tsx`, including the limitations ledger's "What closed it" cell that raised the question in #18. The Evidence page and trace drawer keep `plainModuleNames`, drawn as on `main`; `PublishedTable` picks the function from its `evidence` flag; `report/calculations.ts` now cleans each part before the app's own " · " join. Service text on Start is `serviceText` in `api.ts` (the old `plainText` from `start/plain.ts`, moved and renamed, behaviour identical). The literal "Confidence inputs" uses the `CONFIDENCE_INPUTS` constant; an unreachable alternative in `RECORD_CODE` is removed. The ruling file gains the owner's 2026-11-16 amendment, which supersedes ruling 2 of the reader plan ("a bare code is drawn as stored").
- Answer key: `moduleCodes.cases.json`, 26 literal `[surface, input, expected]` rows written by the PR-manager session, not the implementer; `moduleCodes.test.ts` asserts each exactly. A second key of six rows from the reader session, never shown to the implementer, also passes.
- Gates: at `5c775e5e`, from `web/`, exit 0 (implementer): lint, format:check, typecheck, unused, duplication, test. The reviewer ran the full suite at `5c91ef9e` (3,424 passed) and the affected files plus probes at `5c775e5e` (67 passed).
- Reviews: task review (`mx-precise`) at `5c91ef9e`: two Medium (Evidence tables and the trace-drawer statement went through the new rule; the second came from the brief), one Low (a code next to a slash); all fixed in `5c775e5e`; scoped re-review approved. Of 19 hand mutants, 11 are killed by committed tests, 5 more by the reviewer's probes, 3 survive (each needs a backslash, digit, underscore or unspaced bracket directly before the code). The whole-branch adversarial pass, `confidence-review` and `rewrite-tournament` were not run.
- Rulings / Known: one expectation changed: `ReportContent.drawings.test.tsx` asserted a bare "CP-2" stays on a findings page; it now expects "Fundamental credit", per the ruling. `plainModuleNames` drops any " (CP-x)" even with no module name before it ("The haircut (CP-3) holds." loses the code and gains nothing); older than this change, not altered. `CP-4A`, `CP-4B` and `CP-4D` have no name in the web table, so they stay as codes.
- Not verified: any page in a browser; the retained runs (fixtures and literal cases only); a table whose cell is only a module code beside a name column on a findings page; the whole-branch adversarial pass, `confidence-review` and `rewrite-tournament`; Windows. `proof:connected` was not run on #23's own head; it ran on merged `main` at `ab661d8d` (entry above).

## 2026-11-16 — Reader: CP-8 limitations ledger on Changes; passages in fixed order with gaps (PR #18, merged to `main` as `32260ab1`)

Scope: the connected issuer report reader only, under `web/src/pages/connected/` (`ReportContent.tsx`, `publishedReport.ts`, `report/ModuleTable.tsx`) with their tests; PR 2a (Tasks 5 and 6) of `docs/superpowers/plans/2026-11-16-connected-reader-high-gaps.md`. Seven files, 594 changed lines against the 800 cap.
- Changed: on Changes, the comparison module's "Limitations ledger" is drawn as a typed card grouped by status (Closed, Still open, New, then others), one trace control per row, the two ref columns not drawn, and it no longer appears under "Statements and records". On module pages and Changes, the four reader passages (Bottom line, Key findings, Contrary evidence and what would change the view, Limitations) are drawn in that order, then the other sections in handoff order; a prose module that lacks a passage, or whose passage has nothing drawable, gets a gap card; data modules owe only the bottom line; Overview draws no gap cards. Passage slots are picked by role and line, so a nested or repeated section named like a passage cannot displace the real one.
- Gates on `daf62560`, exit 0: `npm run lint`, `format:check`, `typecheck`, `unused`, `duplication`; `npm test` 160 files, 3,388 tests.
- Reviews: task reviews, one fix round each (Task 5: three Medium; Task 6: one High, one Medium), both re-reviewed clean with mutation checks; whole-branch adversarial review: CLEAN, no High or Medium, 11 Low (parked for the end batch).
- Rulings / Known: the ledger's "What closed it" cell can hold a bare module code (the method requires a code there; a retained run wrote "CP-2A: …"); a bare code is drawn as stored, per the plan's ruling 2.
- For the owner: the 2026-11-12 amendment says a reader sees no module code, which conflicts with the bare code above; not changed here.
- Not verified: `/sweep refactoring discover`, `confidence-review`, `rewrite-tournament`, the browser proof and the fidelity check were not run; no live CP-8 handoff parsed end to end (fixtures are hand-built from the method); a passage drawn as a map or events table; the fallback generic table still draws the ledger's ref columns when a column is missing or a cell holds a reference; `ReportLibrary.wayfinding.test.tsx` (untouched) failed under heavy machine load during review and passed at normal load.

## 2026-11-16 — Start a run: state before Submit that the research module searches the web (PR #17, merged to `main` as `f41ab956`)

Scope: the run-start summary and review: `src/deploy_workflow/owners/cpos_launch.py`, `src/deploy_workflow/run_start/submissions.py`, `web/src/pages/connected/{api.ts,start/ReviewSheet.tsx}` with tests, and root `.gitignore`. The Submit gate, cap, digest and submit request (`StartRun.tsx` is not in the diff) and the `Web:` line's text do not change.
- Changed: the summary gains `web_search` (boolean), from a new `web_search_on` in `cpos_launch.py` that the launcher's `Web:` line now also uses, so the line and the summary share one rule. When true, the review ("What will run") shows above the limits and the approval: "The research module will search the web. The issuer's name and the questions it researches go to OpenAI's search." Nothing is drawn when it is false or absent. Root `.gitignore` now ignores `/node_modules/`. The digest does not cover summary output fields, so no existing digest changed.
- Gates at `86f1d169`, exit 0: `uv run python tools/quality_gate.py`; `pytest tests/test_run_start_submissions.py` (141 passed); from `web/`: lint, format:check, typecheck, vitest `ConnectedApp.test.tsx` (51 passed). `tests/test_cpos_launch.py` passed on the pre-amend commit with the same `cpos_launch.py` diff, not re-run after.
- Reviews: `mx-adversary` (paid launch path): the summary's flag matched the executor's own search decision on 180 combinations (pathway, case kind, model, effort, module set); the `Web:` line is identical to `main` on 336 cases; four hand mutants of the sentence all caught. One Medium (six generated vitest cache files, two holding a local absolute path, in the first commit) fixed by rewriting the unpushed commit without them; no commit on the branch contains `node_modules` (checked from git). One Low (no public-case test), added. Both reviewer probes exit 0.
- Rulings / Known: from `docs/rulings/2026-11-11-run-start-submit.md`, amendment 2026-11-12 (for a private case the page states this before Submit; no such text existed under `web/src`). Ruling by the PR-manager session, for the owner to confirm or reverse: the statement shows whenever search will run (public and private), not only for private cases.
- For the owner: confirm or reverse that ruling. The Start plan's unstarted PRs C and D will edit `ReviewSheet.tsx` and `ConnectedApp.test.tsx` and must branch after this merge.
- Not verified: a live or paid launch (no provider called); a browser render; the three web tests were not seen failing before the component existed (covered by the mutants); a ruling file or pause changing between summary and launch; Windows; the gates and CI ran on the branch head, not re-run on the merged tree.

## 2026-11-16 — Issuer calendar: one shape per category, category word visible in each row (PR #16, merged to `main` as `8bbb74ab`)

Scope: presentation only: `web/src/pages/connected/visuals/EventLane.tsx` and `EventLane.test.tsx`. `EventLane.fixture.ts` unchanged.
- Changed: the four event categories differ by shape, the same in the year strip, the list rows and the legend toggles: Historical filled circle, Scheduled half-filled circle, User reminder ring (all from `StatusShape`), Scenario an outlined diamond drawn inline. The category word is visible text in each row; its screen-reader-only copy is gone. Reason: #10 left Historical and Scheduled differing by colour alone and Scenario on the dashed ring, against `docs/design/design-system.md` (every state carries a shape and a word, each state in a set has its own shape, the dashed ring means a gap and nothing else).
- Answer key: the design-system rule above; tests written first (29 of 41 failed before the change).
- Gates at `7f070cc8`, from `web/`, exit 0: lint, format:check, typecheck, unused, duplication, vitest on `EventLane.test.tsx`, `report/Calendar.test.tsx`, `visuals/LegacyVisuals.test.tsx` (71 tests).
- Reviews: task review (`mx-precise`): approved, no High or Medium; nine hand mutants, all killed. One Low (status-only-in-panel is not asserted directly for rows with a quoted status) and one Info (Scenario handled outside the shape lookup), both parked for the end-of-phase batch.
- Rulings / Known: one existing assertion was removed and one replaced, because fixture rows whose status equals their category word would now match twice; the reviewer confirmed no check weakened. No other open PR or in-flight session edits `EventLane.tsx`.
- Not verified: the layout at 375px and 44px targets (read from classes only); the look in a browser or grayscale; a screen reader; the full suite; `proof:connected`; the gates and CI ran on the branch head, not re-run on the merged tree.

## 2026-11-16 — Reader: plain module names, CP-1's own lead and labels, confidence score (PR #13, merged to `main` as `7fcff960`)

Scope: the connected issuer report reader only, under `web/src/pages/connected/` (`reportView.ts`, `publishedReport.ts`, `api.ts`, `ReportContent.tsx`, `ReportLibrary.tsx`, `report/{Modules,Calendar,Changes,Confidence,Evidence,calculations}`, `start/{plain,ReviewSheet}`) with their tests, plus the plan `docs/superpowers/plans/2026-11-16-connected-reader-high-gaps.md` (PR 1 of 3). No Python, handoff, provider or model change. Gated code head `550bb2dc`; the merged head `b85899f5` adds only plan text.
- Changed: `moduleName` returns the plain name and `plainModuleNames` drops " (CP-x)" from handoff text wherever drawn (prose, tables, bottom lines, trace drawers and control names, Evidence Gaps, calculation steps, Changes cards); a stored file name such as `Deck (CP-1) Q3.pdf` is shown as stored. CP-1 leads with its own bottom line (the app-written "Lease-adjusted gross leverage is …" sentence is gone) and its tiles carry the handoff's own row label, column header or calculation text, selected by a typed `MetricKey`. The published `confidence` field is drawn as one tile on the module page (value and band as published, or the publisher's sentence when there is none); its trace opens the Confidence inputs rows, and that table leaves the reading path for Evidence. `moduleTitle` is folded into `moduleName`.
- Rulings applied: `docs/rulings/2026-11-11-reader-and-issuer-report.md` amendment 2026-11-12 (no module code on screen); `docs/rulings/2026-11-12-module-output-review-changes.md` item 9 (confidence score on the module page); AGENTS.md (delivery adds no analysis).
- Gates on `550bb2dc`, from `web/`, exit 0: test (159 files, 3,319 tests), lint, format:check, typecheck, unused, duplication. CI's two checks passed on the merged head `b85899f5`. The build, `test:scripts` and `test:file:gates` are not recorded as run.
- Reviews: task reviews by `mx-precise` (Task 1 one fix round; Tasks 2 and 3 clean); whole-branch `adversarial-reviewer` by `mx-architect`: 0 High, 3 Medium, all fixed in `550bb2dc` and re-reviewed clean. Not run: `/sweep refactoring discover`, `confidence-review`, `rewrite-tournament`.
- Known, Low, parked for the batch: a " (CP-x)" is kept only when a known file extension follows before the next `;`, `,`, `|` or newline, so an unlisted extension (`Scan (CP-1).png`), a comma inside a file name, and a calculation note whose source part names a file still show the code; forecast model strings are not filtered; four small test gaps; two leftover uses of the literal "Confidence inputs".
- For the owner: 856 changed lines of code and tests against the 800-line cap (lift unconfirmed past 09:00 GMT 2026-11-16), plus the 650-line plan; the plan's PR 2 and PR 3 were refreshed only for PR 2 (split into 2a and 2b) and PR 3 needs the same before it starts.
- Not verified: the reader in a browser (no fidelity check of the plain names, CP-1 lead or confidence tile on a retained run); `proof:connected`; a screen reader; Windows; Python gates (no Python changed); a mutation run. No paid execution.

## 2026-11-16 — Start a run: limits as grouped decisions (PRs #11 and #12, merged to `main` as `8868f96d` and `915b0f79`)

Scope: the connected Start a run review only, under `web/` (`start/limits.ts`, `start/ReviewSheet.tsx`, `StartRun.tsx`, `components/status/sets.ts`, `scripts/connected-proof.mjs`) plus the design-system and plan docs. The Python service, the submit request and the Submit gate (`checksComplete`, `capForPathway`, `requireSummaryCap`, `invalidateReview`, `makeReview`, `submitReviewed`) are byte-identical to `main`. No provider called.
- Changed: "Readiness checks" becomes "Limits to decide": one card per decision (status badge Will refuse / Gap / Limited / Check, cause and fix in plain words, `Will also refuse:` and `Also affects:` lines, one acceptance per group); items needing no decision fold under "No action needed (n)"; no module code is drawn. A line above the approval says how many decisions remain. An acceptance carries across a stepper or Edit return only for the same limit id and reason, issuer ID and pathway; the approval is never carried; "Carry over from latest run" and "This is a different issuer" drop it.
- Answer key: the 180 cases built from the service's own readiness rows in the whole-branch review, and the reviewer's 13-case probe with 400 generated summaries (#11): no item needing a decision falls outside a group, no code is drawn, and ticking every card hands over exactly the required ids.
- Gates at `fb1fb3ba` (branch cut from `8c4abeb7`), exit 0: `npm --prefix web run gates`, Chrome 157 `connected-proof.mjs`, `uv run python tools/quality_gate.py`. CI's `changed code passes…` and `fast tests and page logic` passed on #11 and on #12 at its final head (`aaa33fbe` plus three later commits) before each merge; #12 was retargeted to `main` after #11 merged and CI was not re-run on the merged tree.
- Reviews: task review (one Low, fixed); paid-submit path by `mx-adversary` (one Medium, an acceptance carried to a different typed issuer, fixed test-first in `2056ece7`, re-review approved); sweep `refactoring discover changed-update` (no defect, one Info); whole-branch `adversarial-reviewer` (one Medium, a following module that will refuse listed only under "Also affects", fixed test-first in `6805f268`, re-review approved); `confidence-review`, `ponytail-review`, `rewrite-tournament` (no defect).
- Rulings: the issuer ID is the carry identity (renaming under the same ID still carries); changing pathway and back before the next review carries; limit acceptance is enforced by the page only, as on `main`. Parked for the plan's last PR: a following module whose refusal has a different root cause can sit in a card whose cause is only "limited".
- Not verified: the gates and Chrome proof on the merged tree and on the last two fixes (`2056ece7`, `6805f268`); the review in Chrome after those two fixes (viewed at desktop and mobile widths before them); Edge and Windows; keyboard and screen-reader behaviour in a real browser (jsdom only); paid mode against the live service (mock fetch); behaviour against the live service for #11's grouping. No paid execution.

## 2026-11-16 — Browser proof script brought up to the merged reader (branch `claude/proof-forecast-every-scenario`, from `main` at `8bbb74ab`)

- Scope: `web/scripts/connected-proof.mjs` only; no product code. On `main` the proof failed 0 of 2 (Chrome 157.0.8103.78 and Edge, macOS) at two assertions that predate deliberate, unit-tested product changes. (1) Cash proxy table with "Downside shock" selected: the script expected no "Base case" row; since `cc836f5f` every case is drawn and the selected one emphasised (`LegacyForecast.test.tsx`), so it now expects exactly one "Base case" and one "Downside shock" row. (2) Phone trace control: the script measured the button box as at least 44px; since `8d2089bc` the box is 28px with a 9px outset hit area (`ResponsiveReading.test.tsx`), which computes to exactly 44px by 44px, so it now requires the corner pixels of that square (22px before the centre to 21px after it, both ways) to hit the button.
- Result: `npm run proof:connected` exits 0, 2 of 2, all synthetic upload-to-finished-report checks in both browsers; evidence `proof-artifacts/run-4T32BF/proof.json`. This is the first execution of the calendar check written for the year strip (Scenario marker and category toggle, Table view, trace drawer): it passes in both browsers. `lint`, `format:check` and `test:scripts` exit 0. Synthetic data, no provider.
- Seen while measuring, not fixed (predates): at 390px wide the trace controls in the last column of the Forecast "Scenario comparison" table have their hit area cut off on the right by the table's edge.
- Review: one scoped review, pass, three Low (probe the full 44px, applied; no browser assertion that the selected case is emphasised, the unit test holds it; clearance near a viewport edge, not seen).
- Not verified: that the hit-area check fails on a build without the outset (reasoned from the 28px box, not run); Windows; the full suite on this branch (script-only change).

## 2026-11-16 — Issuer calendar: year strip over a grouped list (PR #10, branch `claude/calendar-compact-strip`, base `main` at `a9aec10a`)

Scope: presentation only: `web/src/pages/connected/visuals/EventLane.tsx`, its tests and answer key, the old-drawing assertions in `report/Calendar.test.tsx` and `visuals/LegacyVisuals.test.tsx`, and the calendar check in `web/scripts/connected-proof.mjs`. No backend, handoff, provider or model change. Gated code head `84e41de3`.
- Changed: the per-event rows with a position track are replaced by (1) a strip with one column per year that has events and one marker per event, the years with no event in the input named ("No events 1974 to 2013"), and (2) one list in date order grouped by year. A row shows date and precision, category mark, title, credit relevance, module and trace control; status, published date and (where the host does not send it to the drawer) source are in a per-row detail panel, closed at first, with "Show all details". The legend entries are toggles that show or hide a category (owner request). A marker moves focus to its row; row and marker highlight each other on hover and focus. Layout switches on the drawing's own width (container query), so a half-width module card gets the stacked layout. No heading elements in the drawing (the old `h5` skipped a level).
- Rulings by this session: a linear date axis was rejected (60 of 69 Caesars events fall in 2020–2032, 18 in 2026, so positions overplot); every detail line visible at 14px/22px cannot reach half height (about 200 characters per event), so status and published date moved to the detail panel; markers are outside the tab order (`tabIndex=-1`) and the rows' own controls are the keyboard path; collapsing one row after "Show all details" returns the button to "Show all details". The brief's figure target of 3,300px was missed by 46px (3,346px); the page target (half of 8,480px) is met.
- Prior art: nothing reusable in the owner's repositories (`gh search code`, owner `EricMG13`: timeline, strip, calendar); patterns taken from Preline Timeline (date-group label beside rows) and Preline Accordion (button `aria-expanded`/`aria-controls`, hidden panel), read on the live pages; no approved library has a unit dot strip; Flowbite's pages returned HTTP 429 and were not read. No dependency added.
- Answer key: `EventLane.fixture.ts`, 14 hand-written events (four categories, four precisions, a same-date pair, a "Not supplied" published text) with stated year, order and gaps, committed with the implementation; `EventLane.test.tsx` asserts each event's title, date, precision, relevance, status, published and source text once per row, its marker, category, year group, order and original row index against it.
- Gates on `84e41de3` from `web/`, all exit 0: lint, format:check, typecheck, test (159 files, 3,311 tests, statements 93.49%), unused, duplication, build, test:scripts, test:file:gates.
- Reviews: one task review (no High or Medium; five Low, applied). Sweep `refactoring discover changed-update` on the PR diff: one confirmed defect (with "Show all details" on, a row's own button did nothing and the row stayed open after "Hide all details"), fixed with its probe failing first and its first test passing after; the probe's second test looks for a "Hide all details" button the ruling above removes, and an added test covers that cause; one measured cost deferred to the phase sweep (the hover and focus handlers repeat in `Marker` and `EventRow`, 15 lines). Browser check found the half-width card defect (466px card, text columns about 100px), fixed. Whole-branch adversarial review on `b8c47da1`: no High; one Medium, this record describing the first commit, corrected here; four Low, applied in `84e41de3` (its stale-highlight probe exit 1 before, 0 after). Not run: `confidence-review` and `rewrite-tournament` as named steps.
- Fidelity check on `84e41de3`, retained Caesars run `20261115-114658-01`, read-only preview of the built branch, 69 events. At 1440x900: calendar page 4,138px (8,480px before in the same browser pane, recorded earlier as 8,568px), figure 3,346px (7,688px); 69 markers and 69 rows, each marker's `aria-controls` resolving to a distinct row; 138 row controls in tab order; no duplicate id; headings h1, h2, h3, h3; no horizontal overflow; Historical off leaves 23 rows (1,992px), Scheduled off 46 rows (3,139px), the five gap texts unchanged in both; "Show all details" opens all 69 panels (7,588px) and closes them; a marker click puts a visible focus ring on its row and Tab moves on to that row's trace control, Enter opens the drawer. At 375x812: 12,854px (27,904px before), no horizontal overflow, 141 row and toggle targets all at least 44x44 with none overlapping, markers not touch targets. Module pages: the drawing appears on six (CP-0, CP-1A, CP-2E, CP-3, CP-4, CP-DR) with no overflow; the 466px card for CP-1A is 2,546px for 20 events with the title at the card's width. The accessibility tree names each year group, gap and marker.
- For the owner: the PR is 1,061 changed lines against the 800-line cap, whose lift was not confirmed past 09:00 GMT today; the entry trimmed to keep this file under 1,000 lines (2026-11-13, negative cash) is in git history; status text reaches the marker name and detail panel as written, unscreened for source references, as on `main`.
- Not verified: a real screen reader; real touch devices; Windows; `proof:connected` (run here, 0 of 2: Chrome timed out waiting for the synthetic run to finish using the main checkout's Python environment, Edge is not installed, so the edited calendar check never executed; not tried on `main`); Scenario and User reminder events in a browser (answer key only); a mutation run beyond the reviewer's 12 hand mutants. No paid execution.

## 2026-11-16 — Report reader design critique: five priorities, review fixes, main merged (branch `claude/fable-reviewers-critique-b4de59`)

Scope: presentation only, all under `web/`; no backend, handoff, provider or model change. Source: an Impeccable critique of the connected issuer report reader (21/40; snapshot under `.impeccable/critique/`). Gated code head `8d2089bc`; the branch holds `origin/main` at `8c4abeb7` (three merges, the last docs only; the first resolved conflicts in `ReportContent.tsx`, `ReportLibrary.tsx` and `ReportLibrary.design.test.tsx`, resolution reviewed from git objects: nothing dropped from either side). Nothing pushed.
- Changed: numbered record tables (`T4.4 …`, `P3 …`, `Confidence inputs`) leave module pages for a "Statements and records" card linking to Evidence, while every module-written sentence in such a section stays on the page; trace controls visible at rest, drawer values wrap; "Chart data:" headings and tables a chart already draws removed; qualifications moved from forecast table headers to a note list under the table; axis ticks from zero on round steps, every scenario drawn with one emphasised and one end value label; scroll-spy navigator; skip link, per-page title, heading order, 44px phone targets, a disclosure for empty forecast columns. Calendar: the shared-lane drawing was built, measured taller (17,038px against 11,168px) and withdrawn; rows kept with a wider label column.
- Gates on `8d2089bc`, from `web/`, all exit 0: lint, format:check, typecheck, test (159 files, 3,287 tests, statements 93.51%), unused, duplication, build, test:scripts, test:file:gates.
- Reviews: per-task review of each change; whole-branch adversarial review (1 High, 2 Medium), confidence review (2 Medium) and a rewrite tournament on the pre-merge head; one fix wave; its re-review found all four fixed and nothing above Low. The High was a qualification sentence inside a coded section no longer drawn (fixture `tests/fixtures/esg/CP-2E-h4.md` lines 134 and 232); it is drawn once again.
- Fidelity check, retained Caesars run `20261115-114658-01` in a read-only preview of the built head at 1440x900: CP-1 module page 10,716px (28,702px before) with no register-code heading and no "Chart data:" heading; records card lists 8 tables and the Evidence link; 63 trace controls, none hidden; no heading-level skip; navigator marks "Figures and records" while its block is in view, the last entry at the bottom and "Bottom line" at the top; Forecast headers at most 77px (273px before) with the interest-basis qualification once per note list and in no header; no overlapping chart text in 10 charts; calendar 8,568px with no horizontal overflow; Overview shows the labelled "Test preview" note. At 375x812: no horizontal overflow, trace hit area 44x44, no pinned column.
- Open, not fixed: a table's scroll-region label can differ from its heading on the Overview; `ticks` keeps an unused parameter; a heading that only looks like a code ("P50 …") is treated as one; promoted monitoring tables keep their code in the heading (`T2.12`, predates); a non-finite chart value falls back to an empty axis without a log (unreachable today); a scenario ending early could put its name near the emphasised value label (not measured).
- For the owner: the calendar's planned lane layout is not delivered and needs a different design; five uncoded CP-1 summary tables stay on the module page; module-written prose defects, the repeated run charts on Forecast and the History list reading "Finished" for a test-preview run predate this work.
- Not verified: a screen reader; real touch devices; Windows and CI; the browser proof script (`proof:connected`); the CP-2E coded-section fix in a browser (its handoffs are fixtures, not a retained run); the Changes page beyond its shared code path; a mutation run. No paid execution.

## 2026-11-16 — Start a run: four steps and one plain review (PR #6, main `76ed9dde`)

- Scope: the connected Start a run flow only. Five steps became four (Documents, Purpose, More context, Review and start; completed stepper steps are buttons) and the review became one sheet, "What will run", with an Edit button per block and no module code, run id or launcher flag below the Advanced level. Service text is rewritten on the page only (`web/src/pages/connected/start/plain.ts`); the Python service, the summary data and the submit request are unchanged. Brief: `.impeccable/surfaces/web-src-pages-connected-startrun-tsx.md`.
- Merged main twice on the way (`ed26598a` per-pathway caps; `c88773d8` intake hooks and panels, where main's file was taken whole and the four-step changes re-applied). Paid-submit path reviewed after each merge by a read-only reviewer: main's cap, review and submit functions are byte-identical; 33 cases in paid and synthetic mode (jsdom, mock fetch) found no submit against a cap, pathway, digest, acceptance or approval other than the review on screen; 11 of 12 hand mutants killed (the survivor: the pathway cards' `invalidateReview` is redundant while no pathway control shares the screen with the review).
- Defects found by review and fixed test-first: the review footer read "Step 5 of 5"; a run id reached the Changes line when a skipped run's reason quoted an issuer name with brackets; the `SEC:` label stayed on a lookup line; the comparison caveat ("earlier format", "earlier methods") was dropped and is now shown without the run folder; focus fell to the page body after a stepper return (the step heading's `key`, dropped on main in `89e4e2be`, is restored, which also returns focus after Continue and Previous).
- Gates at `57eadd8e`, the merged tree: `npm --prefix web run gates` exit 0; Chrome 157.0.8103.78 run `20261116-100900-01` passes the synthetic upload-to-finished-report proof on macOS (`proof-artifacts/run-xBeXl3`); Python quality gate zero findings (no Python changed); 800 changed lines. Merged on the owner's instruction while CI's "fast tests and page logic" was still running; its result was not seen before the merge.
- Presentation fidelity scope: the Purpose step and the review viewed in Chrome at 1440 px and 390 px at `08144b4b`, before both merges; afterwards the adopted shorter `ReviewSheet` was compared by rendered markup against the version it replaced on seven summary fixtures (identical), and the page was not viewed again. Not verified: Edge and Windows; keyboard focus in a real browser (jsdom only); paid mode against the live service (no provider called); widths of about 640–815 px and 1041–1159 px, where neither the step line nor the stepper labels name the step. Known, with the owner: lookup lines, one environment-variable name and omitted-section ids are drawn as the service sends them.

## 2026-11-16 — Six-fix PR integration with current main

- Main advanced to `ed26598a` (Run activity). Merged it into the six-fix branch, retaining both verification entries and resolving the API conflict with upstream LiveRun/Activity/getActivity plus the private ReportEntry type. Astra confirms all six-fix production changes and upstream activity routes/components are preserved exactly; no new feature or design change. Native backend and pins remain unchanged.
- Combined-source verification: 196 connected tests pass (86.90% line coverage), 30 bridge tests pass, full web ESLint/Prettier and TypeScript pass, Python quality gate zero findings. Clean offline install/dual build from tree `510a7c0f05f61356fbd1de95f3fb49162c9a0bde`; Chrome 157.0.8103.78 `20261116-092647-01` and Edge 157.0.4341.60 `20261116-092716-01` each pass all 38 synthetic upload-to-finished-report checks on macOS. Evidence: `proof-artifacts/run-wxeUO5/proof.json`. Final Fallow audit against current main: PASS, zero introduced and zero inherited findings.
- No paid execution, tournaments or ZIP. ZIP remains held pending actual Windows work-PC proof in both browsers. Historical verification entries retained in git history when trimmed below 1,000 lines.

## 2026-11-16 — Six remaining frontend Fallow findings

- Verified each reported item before editing using its `fallow inspect`, `dead-code --trace` or `dupes --trace` command. Removed only ReportEntry's unused export; extracted the repeated following paragraphs and empty findings notice; isolated citation rendering; split Run intake into stable step/panel components, state hooks and bounded derived-data helpers. No suppression, dependency, native backend or Credit OS design changes.
- Confidence review, ranked: (1) form extraction could alter approval/submission or hidden data — Astra found Listed equity uncheck retained an old ticker; restored the original atomic clear and verified the actual review payload. Frozen cap, pending locks, retries and single submission retain their guards; (2) hooks/components could reset state, focus or uploaded/prior files — stable top-level definitions and hook order reviewed; UI regressions exercise carry-latest success/no-history, file copying, exact reviewed context and zero premature submit; (3) report extraction could move qualifications/trace identity — literal paragraph order, bold qualification, exact block line/hash/source link and both empty notices tested; (4) citation extraction could change missing/empty/file/source precedence — exact original file/page URLs, SHA-256, excerpt, missing identity and mismatch warning verified. Astra independently approves final Run, report and citation changes. No remaining confirmed defect in scope; no tournaments.
- Final combined connected suite: 194 tests across 25 files passed, 86.64% line coverage. A separate cold-import reader test exceeded its one-second heading wait; allowed three seconds for the lazy chunk and reran the entire ConnectedApp file: 24/24 passed. This test-only change does not alter the frozen runtime. TypeScript, changed-file ESLint/Prettier, clean offline install and dual build pass. Python quality gate: zero findings (no Python changes). Final Fallow against `24531dae`: PASS, zero introduced and zero inherited findings.
- Frozen runtime/build source tree `9e4bdadb490826c28acc70c9003df3b832eba3f2`; Chrome 157.0.8103.78 run `20261116-091915-01` and Edge 157.0.4341.60 run `20261116-091944-01` each pass all 38 synthetic upload-to-finished-report checks on macOS. Evidence: `proof-artifacts/run-ozVMtZ/proof.json`. Read-only Caesars preview moved to `http://127.0.0.1:58346/report/20261115-114658-01#overview`. Its run records, outputs, handoffs, models and chips equal the preceding preview exactly; visible Overview keeps its Test preview/withheld-method qualification. This is retained data, not a new live analytical run.
- Fidelity scope: Astra compares rendered structures/classes/copy and source identities against merged `24531dae`; focused tests and branded browser checks cover the five-step Run and report pages, including selected narrow layouts. Native backend and pins remain RBOT-HTML `be953752`; React manifest/lock unchanged. No paid providers, Signal changes, historical-run mutation, ZIP, push or publication. Windows work-PC Chrome and Edge proof remains outstanding; ZIP stays held. Trimmed oldest whole entries below 1,000 lines; git history retains them.

## 2026-11-16 — Run activity section in the connected interface (branch `claude/run-activity-section-81a806`)

- Added `/runs`: the runs that are running and waiting, after the Claude Design brand-application mock "E · Run activity" and today's HTML Run activity view. Counts, the service's hold note, a card per running run (pathway, state, a stalled mark, module progress and one chip per module, source-file count, the name warning) and a Waiting table with each run's reason. Each issuer links to its run page. The rail's Run item opens it; Start a run stays a button there and on Library; a run page's breadcrumb returns to it.
- New `GET /connected/activity` reads the live records fresh through `deploy_workflow.inbox.activity.snapshot` and sends a fixed set of fields: no spend, folder, process ID, digest or file names (a count only). The hold note is read from the `_engine/activity.js` the scheduler writes. RBOT-HTML's scheduler and `inbox` modules are unchanged. Departures from the mock, following the later HTML view's rule: no run code and no file list; the page re-reads every 5 seconds.
- Confidence review, ranked: (1) audit fields reaching the page — the endpoint test compares a running run's whole entry with a hand-written one; (2) the list and the run page disagreeing on progress — both now use `finishedFigure` and the prepared plan's modules (seen as 3 of 15 against 3 of 14 in the browser, repaired); (3) a failed read shown as "no run" — a failed or malformed read shows "Run activity could not be read", tested. Rewrite review of `listing`, `useActivity` and `RunningCard` done inline, no sub-agents: kept. Reading the whole list from `activity.js` was rejected, since it is absent until the first poll.
- Gates: `tests/test_react_frontend.py` 9 pass with 118 scheduler and activity tests; 186 frontend tests across 24 files; TypeScript, ESLint and Prettier on the changed folders, knip, duplication and build pass; Python quality gate zero findings. Not run: the full suites, the Chrome and Edge connected proof, the a11y gate.
- Presentation fidelity scope: seeded local preview (two running, one stalled, three waiting, a hold note; no scheduler loop, no provider) viewed at 1440 px, 800 px and 375 px, and one run page for the breadcrumb. The empty and unreadable states are covered by tests only. `StatusBadge` gains an optional `label`; no other design-system component changed.
- After merging main at RBOT-HTML `be953752` (per-pathway caps): the run list takes no cap, as main's snapshot and single-run reply no longer do. Inherited findings fixed on the owner's instruction: the ESLint error at `web/src/ConnectedLoadBoundary.tsx:22` (braces only) and Prettier on `web/.fallowrc.json` and `web/knip.json`; ESLint and Prettier now pass on all of `web`. The browser preview was not repeated after the merge. Merged without an independent review, changed-update sweep or whole-branch adversarial review (owner: no sub-agents).

## 2026-11-16 — RBOT-HTML main update to be953752

- Merged RBOT-HTML `be953752e5e6b981e24082d452637c5120d63825` (remote main verified again before completion). Native `src/`, `apps/issuer-library`, Python manifest/lock/version exactly match that revision; React manifest/lock unchanged. Imported methodology, PDF Form-XObject extraction, pathway tiers and retained script-check evidence without replacing the Credit OS frontend or performance fixes.
- Adapted the bridge and React intake to native per-pathway caps (Lite USD 15, Full 25, Deep 40, purpose pathways 20), exact `X-Shown-Cap` summary/submit acknowledgements, and native historical-cap display. Deep shows 20 analytical modules; native delivery adds CP-MODEL. Changing pathway invalidates review; pending review locks navigation; absent/malformed/mismatched caps block submission.
- Evidence conditionally shows native retained script checks with exact outcomes, counts, reasons, script hashes and accepted-response attribution. Earnings-update Overview can use CP-1B only after higher-priority leads; it is labelled Earnings view and cannot supply a committee action. Source serving reuses the new PDF extractor while preserving original bytes.
- Confidence review, ranked: (1) changed scheduler/summary contracts could break startup or acknowledge the wrong cap — traced bridge callers, repaired removed global-cap arguments, checked frozen approval, mismatch, missing-cap, concurrent navigation and retry cases; (2) historical caps or optional-module selection could drift — native tier regressions and independent Astra review pass; (3) retained script checks could imply a different attempt or alter null/zero — adapter uses native accepted records and exact values, reader tests and browser/native comparisons pass; (4) earnings fallback/helper extraction could change qualifications or trace identity — scoped fallback tests, explicit action/maturity boundary cases and final Astra comparison pass; (5) PDF extraction could change original downloads — form-body/page and exact-byte regression passes; (6) performance/offline/data fidelity could regress — lazy/scoped-fetch browser assertions, dual build and exact retained-Caesars data equality pass. Initial browser attempts exposed test-helper argument/navigation omissions; repaired the script and reran both from upload. No confirmed defect remains in this scope.
- Astra backend, intake and report reviewers approve; final helper recheck confirms exact paragraph order, qualifications, section references and trace identities. No tournaments. Presentation fidelity scope: existing Credit OS Run/report assertions in both branded browsers (desktop and selected mobile views); inspected the new Evidence Script checks desktop screenshot. Caesars remains a retained qualified Test preview, not new live analysis; no script checks invented for its historical snapshot.
- Tests: 3,067 focused native Python passes (known failures/irrelevant live cases deselected), 565 native JavaScript passes, 72 bridge passes, 186 connected React passes across 24 files with 84.9% line coverage; final test-fixture type correction followed by TypeScript and 10 reader tests passing. Changed-file ESLint/Prettier, TypeScript, fresh offline install, dual build and existing Chrome file:// gates pass. Python quality gate: zero findings. Fallow against `63d7edd`: PASS, zero introduced and six inherited findings; no suppression changes.
- Frozen runtime/build tree `3d727f069ea7dccb4a8635f11b553930ca5de0e0`; passing browser-proof tree `9d545b0fbb89099bd8be3a3daa4161592748be3b` differs in test scripts only (subsequent test-only Paragraph end fields typechecked). Chrome 157.0.8103.78 run `20261116-085154-01` and Edge 157.0.4341.60 run `20261116-085227-01` each pass all 38 synthetic upload-to-finished-report checks on macOS. Artifacts: `proof-artifacts/run-JGyo4g/proof.json`; synthetic responses retained, no real provider invoked.
- Updated Caesars preview: `http://127.0.0.1:58345/report/20261115-114658-01#overview`, isolated read-only copy. Run records, outputs, handoffs, models and chips exactly equal the preceding preview. Native merge verification records remain in the upstream parent history; oldest local entries trimmed to stay under 1,000 lines. No predecessor/historical-run mutation, Signal work, paid execution or ZIP creation/publication. Actual Windows work-PC Chrome and Edge proof remains outstanding; ZIP stays held.

## 2026-11-16 — Three connected-interface performance fixes

- Removed whole-publication enrichment from original-source requests: each request verifies the requested file's publication/workflow identity and current bytes; raw file downloads skip page extraction. Library uses a compact index; a report fetch scopes heavy content to its run and a valid Changes dependency while retaining history/ambiguity metadata. Added negotiated gzip and immutable caching for hashed connected assets.
- Separate connected build lazily loads Run, activity, library and report routes; the offline classic-script build still works from file://. Credit OS components/styles, native analytical code and dependency versions remain unchanged. The 628.4 KB report-reader chunk is deferred on Run; 227.4 KB is the bootstrap file alone, not total initial JavaScript.
- Local retained-Caesars measurements (three requests, medians; not Web Vitals): library 2,933,438 to 18,654 decoded bytes (2,318 gzip), 357.5 to 12.9 ms; unchanged 12,160-byte source page 353.8 to 13.7 ms. Final frozen preview confirms compact sizes and exact equality of retained run records, outputs, handoffs, models and chips against the previous preview. Measurements: `proof-artifacts/run-HAyUPU/performance-measurements.json`.
- Confidence review, ranked: (1) scoped data could alter financial history/CP-8 admission — Astra reproduced duplicate-folder ambiguity loss and null-current crashes; repaired and independently rechecked, with wrong-issuer/unfinished/missing-prior cases; (2) direct source access could weaken identity checks — request-time hash/tamper, admission, traversal and page tests pass; (3) split builds could break offline use or error recovery — dual build/file gates pass; real reload button unit-tested (real failed-chunk injection not tested); (4) extraction could change reader data/design — retained-data equality, component and browser checks pass; (5) search after filter changes — reproduced stale event.currentTarget crash, capture value synchronously, component and both browser regressions pass; (6) gzip/cache/query boundaries — quality-value, malformed/duplicate query, gzip round-trip/Vary/cache tests pass. No remaining confirmed defect in this scope.
- Astra backend final recheck approves admission, source verification, scoped snapshots and CP-8 guards; Astra UI final review approves repeated search, Overview design and exact trace excerpt/warning/page identity/focus. Forecast/Evidence/Run desktop/mobile fidelity sampled on the preceding implementation build; both final branded proofs cover the synthetic equivalents. Actual Caesars remains a retained, qualified Test preview, not a new analytical run.
- Gates: 51 focused Python tests; 63 frontend tests across seven files; TypeScript/build, changed-file ESLint and Chrome file:// gates pass. Python quality gate: zero findings. Fallow against `c519093`: PASS, zero introduced/inherited findings. No tournaments.
- Fresh offline install and dual build, runtime tree `7662375c19bd55eb4082ba72bdd0ef79f81f0d50`; final proof tree `db9b41075f6849450fa7e918e389ca895fefbf8e` differs only in the browser script. Corrected test-only URL serialization, the paired fixture's scoped-route interception and additional-page creation after initial proof failures. Final Chrome 157.0.8103.78 run `20261116-044325-01` and Edge 157.0.4341.60 run `20261116-044350-01` each pass all 37 upload-to-finished-report checks on macOS, including source bytes/pages, repeated searches, scoped fetches and deferred route bundles. Evidence: `proof-artifacts/run-HAyUPU/proof.json`.
- Caesars opened at `http://127.0.0.1:58344/report/20261115-114658-01#overview` from the frozen runtime/build, in an isolated read-only copy. Native backend/Python pins match RBOT-HTML `256101a`; React dependencies unchanged. No paid providers, Signal work, historical-run mutation or ZIP creation/publication. Actual Windows work-PC Chrome and Edge proof remains outstanding; ZIP stays held. Trimmed oldest entries to keep this record under 1,000 lines; git history retains them.

## 2026-11-16 — Caesars original source files and citation links

- Root causes: the retained preview copied deliveries/library but omitted workflow pins and inputs; native inventory parsing assumed key/file columns while Caesars CP-0 uses Original/sha256; raw TXT input pages were unavailable to the JSONL-only citation reader. Added a React-side bridge using verified workflow identities, original input bytes and RBOT's native page extraction, without changing native code or saved handoffs.
- Evidence Sources, cited rows and the trace drawer now open the verified original file and available cited page/range. Actual extracted text alone is labelled as a source excerpt. Native unmatched-quote/value findings remain explicit; page labels state that supplied-source pagination can differ from printed filings. Existing Credit OS layout/components remain.
- Retained Caesars `20261115-114658-01`: 18 original files match recorded SHA-256 across retained inputs/source pack; all 18 HTTP file responses and first pages checked exactly. 1,049 page references now link; 819 missing-text and 230 missing-inventory warnings resolved. Remaining recorded limitations: 706 rows without a page/register citation, 106 Not Supplied, 29 pages without a source key, and 156 unmatched quote/value checks. This proves connectivity to retained inputs (some extracts), not new source authentication or analytical correctness.
- Confidence review, ranked: (1) wrong source or hidden tampering — require published filename/hash plus workflow identity, rehash bytes on access, reject traversal/symlinks and unavailable/withheld runs; (2) lost genuine warnings/legacy evidence — reproduced and fixed missing-file identity loss and no-workflow chip replacement, retaining native reasons; (3) misleading excerpts/page identity — fixed claim-as-excerpt fallback, URL punctuation encoding and ambiguous page labels, using native page extraction unchanged; (4) historical mutation — reproduced copied data.js symlink overwrite in temporary fixtures, replaced directory entry before exclusive creation, regression verifies original target untouched; (5) preview startup — shortened temporary prefix after native 80-character root limit refused startup, then successfully served an isolated read-only copy. No outstanding defect in this scope.
- Astra source reviewer independently confirms hash/identity/failure behaviour and symlink preservation; Astra UI reviewer confirms actual source text, pages 1–2, mismatch warning, drawer focus/Escape and readable links at 390px. No remaining blockers in either review. No tournaments.
- Targeted verification: 36 Python tests pass; 62 frontend tests across five files pass; TypeScript, changed-file ESLint and build pass. Python quality gate: zero findings. Fallow against `fbcc5ac`: PASS, zero introduced findings, two inherited ReportContent findings (unchanged ReportFindings complexity and duplication).
- Fresh offline source build from tree `585f57dcf86dfaf5f8ce2bc67629dcf2c5394061`: Chrome 157.0.8103.78 `20261116-041031-01` and Edge 157.0.4341.60 `20261116-041049-01` each pass 34 synthetic upload-to-finished-report checks on macOS, including actual source file/page opening. Evidence: `proof-artifacts/run-YDopBV/proof.json` and `caesars-sources.json`. Subsequent runtime change only shortens the standalone retained-preview temporary-directory prefix, verified by successful startup and HTTP read-only checks.
- Presentation fidelity scope: actual Caesars Sources, CP-1 cited excerpts and trace drawer sampled in browser, including 390px; Credit OS styling preserved. User preview open at `http://127.0.0.1:58342/report/20261115-114658-01#evidence/sources`, using tested web assets. Test-preview/admission qualification retained; original report untouched. POST/DELETE blocked by read-only mode.
- RBOT-HTML backend/Python pins match `256101a`; React dependencies unchanged. No paid providers, Signal work, ZIP creation, push or publication. Real Windows work-PC Chrome and Edge proof is still outstanding; ZIP remains held.

## 2026-11-16 — Five remaining Fallow findings

- Verified all four clone IDs with their `fallow dupes --trace` commands and Evidence with `fallow inspect` before edits. Shared chart name/shape validation, positional keys and period data preparation; shared exact evidence section-line membership; split Evidence routing, navigation, summary, sources and handoffs into bounded components. No suppressions.
- Audit then exposed the pre-existing comparison-row complexity; verified its inspect command and extracted unchanged comparability, period and difference predicates. Final audit against `fbcc5ac`: PASS, zero introduced and zero inherited findings.
- Confidence review, ranked: (1) financial semantics — Astra independently checked 19,440 before/after cases plus literal missing/zero/currency/precision/revision expectations; implementer checked another 10,000; (2) chart data/key/validation fidelity — independent Astra frozen-input assertions cover sparse cells, zero/null, signed values, hostile/duplicate names, order and exact errors; (3) evidence identity/routing/admission — retained exact match predicate, module/source filters, alternate links and stale-address rejection, covered by regression tests and parent diff review. No outstanding defect in this scope.
- Targeted tests pass: chart subset 96; Evidence/publishedReport/design subset 32; connected app/design/Changes/legacy visuals/Forecast subset 58 (overlapping design tests); final Evidence rerun 11/11. TypeScript, changed-file ESLint/Prettier and Python quality gate pass (zero findings).
- Fresh offline install/build from source tree `34510a2dd75d3ce8154534329c3f49525a0d7b02`; Chrome 157.0.8103.78 `20261116-035824-01` and Edge 157.0.4341.60 `20261116-035841-01` each pass all 33 synthetic upload-to-finished-report checks on macOS. Evidence: `proof-artifacts/run-vuQ8ku/proof.json`. Final commit additionally tightens one test-only excluded-module matcher; runtime source matches this tested tree.
- Presentation fidelity scope: unchanged classes/markup/labels and chart data checked by component tests and branded browser proof. Opened retained Caesars in the app at `http://127.0.0.1:58341/report/20261115-114658-01#evidence/summary`; 12 handoffs/18 sources; Financial foundation opens the exact saved CP-1 revision. Observed Credit OS layout and Evidence controls preserved. This retained preview still reports missing source text/inventory entries; opening its handoff does not establish complete underlying source availability.
- RBOT-HTML backend and pins remain identical to `256101a`; React dependencies unchanged. No providers, Signal, tournaments, ZIP build or publication. Actual Windows work-PC Chrome and Edge proof remains outstanding; ZIP stays held.

## 2026-11-16 — Evidence gap complexity repair

- Verified the app finding before editing with `fallow inspect --file src/pages/connected/report/Evidence.tsx --format json`: `gapRecords` cyclomatic 15 / cognitive 24. Extracted table title selection and row conversion; retained block filters and per-row appending. No suppressions or design changes.
- The subsequent audit exposed `checkReadingLayout` CRAP 42 (cyclomatic 6, estimated coverage absent). Verified with its `fallow inspect` command before separating null/dimension assertions; preserved exact `===` semantics. This browser check executes in both branded proofs.
- Confidence review, ranked: (1) lost gap/source identity — Astra compared 3,600 adversarial inputs with the original, exact equality; (2) title fallback, no-gap and ledger exclusions, sparse/zero details and order — nine Evidence tests pass, including two independent boundary regressions; (3) large-table append — reproduced spread argument-limit failure, replaced with individual appends, Astra verified actual helpers with 200,000 rows; (4) assertion semantics — restored original handling of negative zero. No outstanding Astra finding.
- 38 targeted tests pass; final Evidence subset 9/9 passes. TypeScript, changed-file ESLint/Prettier and Python quality gate pass (zero findings). Final Fallow audit against `fbcc5ac`: PASS, zero introduced findings, five inherited findings remain.
- Final source tree `e26d7fe86f3bf6d9a480aa4907c7b1dae1a5cc10`; fresh build passes all 33 upload-to-finished-report checks in each browser on macOS: Chrome 157.0.8103.78 (`20261116-035417-01`) and Edge 157.0.4341.60 (`20261116-035435-01`). Evidence: `proof-artifacts/run-9vzN45/proof.json`. This is synthetic source-snapshot proof, not a Windows or ZIP proof.
- Fidelity scope: behavior-preserving Evidence parser and test assertions only; no layout, component, chart, number, qualification or backend edits. Native backend and pins match RBOT-HTML `256101a`; React dependencies unchanged. No providers, tournaments, Signal changes or ZIP build/publication. Windows work-PC Chrome and Edge proof remains required.
- Trimmed the oldest verification entry to keep this record below 1,000 lines; git history retains it.

## 2026-11-16 — Financial qualifications and five reading-design fixes

- Forecast preserves all recorded labels, dates, units and values while placing
  exact base-period qualifications beside uniquely matched period headers and
  exact interest-basis qualifications in the Interest row. Ambiguous/unrecognised
  period tokens keep a visible table-level note; no analytical relabelling.
- Historical chart qualifications now follow their owning chart, with paragraph
  traces distinct from table traces. Ownership requires one matching section and
  one table; source-bearing passages point to Evidence instead of leaking references.
- Compact model tables hide only wholly unavailable/unmodelled rows without exact
  operands, retain zeros/unknown states, and expand every missing-data reason.
  Entirely unavailable tables remain visible. Forecast section jumps precede scope
  and preserve keyboard focus; Evidence's duplicate preview notice is removed.
- Under 768px the incumbent rail becomes bottom navigation and reading width grows;
  narrow source controls are 44px, with matching text clearance. Cash charts use a
  keyboard-scrollable minimum plot width under 480px to separate period labels.
  Shared line rendering was extracted without changing points/labels/styles.
- Two Astra confidence reviews ranked (1) qualification ownership/financial fidelity,
  (2) missing versus zero, (3) source identity, (4) responsive width/trace overlap,
  (5) navigation/focus/admission. Repaired partial-token association, all-missing
  empty tables and mobile case/qualification text clearance; targeted regressions
  cover them. Reviewers report no outstanding issue in the inspected scope.
- 177 focused tests across 15 files pass; final Forecast/table subset 10/10 passes.
  TypeScript, changed-file ESLint/Prettier and Python quality gate pass. Fallow
  retains five inherited findings and labels `gapRecords` as introduced; its exact
  function is unchanged from `fbcc5ac` (SHA-256
  `554ac0b77d38e6a36775e67ed4d9b749f1965bdc38194b16f2a1cc21baf83753`).
  No suppressions. Newly introduced chart duplication and changed-function
  complexity were resolved; unchanged gap parsing was not refactored for this task.
- Fresh offline install/build; source tree
  `01e1525e6735cf738bf1eb2591ac546b1f270894`. Chrome 157.0.8103.78 run
  `20261116-033501-01` and Edge 157.0.4341.60 run `20261116-033518-01` each pass
  all 33 synthetic upload-to-report checks on macOS. Added browser checks cover
  Forecast jumps, 390px main width, 44px source targets and nonoverlapping period
  labels. Evidence: `proof-artifacts/run-ySH02V/proof.json` (source snapshot, no ZIP).
- Fidelity check: Astra inspected actual retained Caesars at 1728x996 and 390x844;
  Credit OS palette/type/icon language preserved, qualifications visible locally,
  one Evidence notice, working keyboard jumps/trace dismissal/focus restoration,
  mobile chart scroll and separated labels. Judgement card height about 334px
  versus the reviewed ~650px. Viewport restored and reviewer tab closed.
- User preview opened at port 58340, actual run `20261115-114658-01`; its assets
  exactly match the tested build. CP-1 and CP-2G downloads retain their original
  SHA-256 identities. Preview remains read-only and retains its admission notice.
- Backend/Python pins match RBOT-HTML `256101a`; React dependencies unchanged.
  No providers, Signal work or tournaments. ZIP not built/published; both browsers
  still require acceptance on the actual Windows work PC.

## 2026-11-16 — Remaining Modules and ReportReader findings resolved

- Verified both findings using `fallow inspect --file ... --format json` before
  editing. Modules now separates output selection, figures, findings and saved
  outputs. ReportReader separates its header, badges and status messages while
  retaining its hooks, admission lookup and route handling. No suppressions.
- Two Astra reviewers used confidence-review. Ranked doubts: (1) unpublished-run
  admission and preview truthfulness, (2) retained-output selection/source identity,
  (3) null/loading/error boundaries, (4) metrics and transformed figure table lines,
  (5) navigation remounts, original workspace keys and title fallbacks. Compared
  source and consumers with `71d55d4`; no defects found. Added adversarial tests for
  catalogue-only rejection, preview with empty reason, null/error/title states,
  default/selected/singleton/ambiguous outputs, invalid output addresses and exact
  alternate evidence links. Calendar fixture now checks a distinct workspace key.
- 72 focused tests across ten files pass. TypeScript, changed-file ESLint/Prettier
  and Python quality gate pass. Fallow audit against `dd765b5`: PASS, zero introduced
  and zero inherited findings. Backend/Python pins match RBOT-HTML `256101a`;
  React dependency files unchanged. No providers, Signal work or tournaments.
- Clean offline install/build, source tree
  `9be6488b01f37c6b859ad39db4c02ab527d9c334`. Chrome 157.0.8103.78 run
  `20261116-031733-01` and Edge 157.0.4341.60 run `20261116-031749-01` each pass
  all 32 synthetic upload-to-report checks on macOS, including module charts,
  mobile navigation, report history and evidence traces. Artifacts:
  `proof-artifacts/run-cxcHo3/proof.json`. Source-snapshot proof, not ZIP proof.
- Fidelity scope: compiled CSS byte-identical to the prior build; Astra confirmed
  unchanged markup/order, and browser checks cover chart values and source links.
  Actual retained Caesars Forecast opened at port 58339 with its original Test
  preview/admission qualification; CP-2G download SHA-256 unchanged.
- ZIP not built or published. Chrome and Edge acceptance on the Windows work PC
  remains pending; macOS passes do not satisfy that gate.

## 2026-11-16 — Five branch-introduced Fallow findings resolved

- Verified all five with their `fallow inspect --file ... --format json` commands
  before editing. Extracted calendar validation/row mapping, forecast display and
  unique-row lookup, and comparison rendering; simplified the unique-JSON lookup.
  No suppressions, threshold changes, backend changes or dependency changes.
- Fallow audit against `dd765b5`: PASS, zero introduced, two inherited findings
  (`Modules` and `ReportReader`). RBOT-HTML and pins remain at `256101a`.
- Confidence review with Astra ranked (1) calendar validation/order/source identity,
  (2) unique forecast-input provenance, (3) missing/zero/duplicate chart cells and
  caption layout, (4) comparison admission, (5) portfolio-provider scope. Traced
  callers and previous code. Astra caught an empty-units caption regression;
  normalized units outside the chart callback and added a regression. Other
  semantics verified equivalent, including empty comparison headings being absent.
- 71 focused tests pass across eight files; new guards cover ambiguous JSON,
  invalid/duplicate event source lines and missing chart units. TypeScript,
  changed-file ESLint/Prettier and changed-code quality gate pass (zero findings).
- Fresh offline install and production build; source tree
  `55f78cdd1d61e13e0dba8889e82fd63d1d785212`. Branded Chrome 157.0.8103.78
  (`20261116-031230-01`) and Edge 157.0.4341.60 (`20261116-031246-01`) each pass
  all 32 synthetic checks on macOS. Evidence: `proof-artifacts/run-rzGwkj/proof.json`.
  This is source-snapshot proof, not ZIP or Windows acceptance.
- Fidelity scope: unchanged compiled CSS (SHA-256
  `914e40937b01bfc5efe4ecad2f6000924dff284e2fca629f897cb6831afd08f0`), browser
  chart/table/trace assertions and actual Caesars Forecast opened at port 58338.
  Retained CP-2G bytes match the prior SHA-256; preview stays read-only with its
  Test preview/admission qualification. No providers, Signal work or tournaments.
- ZIP not built or published; Chrome and Edge work-PC acceptance remains pending.

## 2026-11-16 — Five Caesars design critique priorities implemented

- Preserved Credit OS React components and RBOT-HTML source/Python pins at
  `256101a`; React dependencies unchanged. No providers, Signal work or tournaments.
- Forecast now promotes exact reference-free scope/basis sentences before case
  selection, with traces and the complete original notes retained below. Case
  cards say Forecast cases; descriptions come from retained notes or explicit gaps.
  Comparison keeps every case, highlights the selection and retains row traces;
  the chart and its table still follow the selected case, including missing values.
- Forecast axes use readable labels without changing series/table values; close
  ticks fall back to exact labels rather than merge through display rounding.
- Dates to watch uses the run as-of date, excludes Historical events, retains
  recorded precision/status/source identity and qualifies overlapping partial dates.
  Narrow Modules uses a native selector and collapsible section jump; desktop
  navigation is preserved, with complementary 1000/1001px visibility boundaries.
- Confidence review ranked (1) analytical fidelity/reference leakage, (2) case
  selection versus comparison, (3) date/status ambiguity, (4) keyboard/navigation
  boundaries, (5) rounded values/missing versus zero. Tests and Astra reviewers
  confirmed and repaired false absence wording, missing-case comparison vanishing,
  historical partial dates appearing upcoming, first-section activation failing,
  and the breakpoint overlap. Numeric inputs and retained handoffs were untouched.
- Two independent Astra reviewers rereviewed their fixes and inspected actual
  Caesars in Chrome. Forecast: four rows, selected chart, readable axes, exact
  464.86/647.95/183.09 bridge, trace to handoff line 310. Overview: watch dates begin
  November 2026. At 390px the module selector and first-section jump work; all
  temporary review tabs closed and viewport restored. This is scoped fidelity
  review, not analytical clearance or Windows proof.
- 61 focused tests pass, plus TypeScript, changed-file ESLint/Prettier and Python
  quality gate (zero findings). Fallow still reports five 'new' and two inherited
  complexity warnings: AST comparison shows four flagged new functions unchanged
  from HEAD and the fifth differs only in its axis formatter call, with no added
  branching. Existing complexity risks are retained; no suppressions were added.
- Fresh offline dependency install and production build; staged production tree
  `fb91f1e5e7eb01f403a13ba30ffd5ca19d040d14`. Both branded browsers passed all 32
  synthetic upload-to-report checks on macOS: Chrome 157.0.8103.78 run
  `20261116-030448-01`, Edge 157.0.4341.60 run `20261116-030505-01`.
  Evidence: `proof-artifacts/run-4l6Qel/proof.json`. Added checks cover all-case
  comparison, early scope, compact navigation and breakpoint/first-section behavior.
- Updated read-only actual Caesars preview is at port 58337, run
  `20261115-114658-01`; original Test preview/admission qualification remains.
  ZIP was not rebuilt or published. Chrome and Edge work-PC acceptance is pending.

## 2026-11-16 — Four remaining Fallow findings resolved

- Split Forecast case cards and assumptions into components; split browser intake
  checks and browser execution from resource ownership. Reclassified the Vite
  Tailwind plugin as a development dependency after tracing its sole import to
  vite.config.ts. All locked versions, resolutions and integrity values unchanged.
- Fallow audit against `b3a607f`: PASS, zero introduced or inherited findings.
  No suppressions or threshold changes. Native RBOT-HTML and Python pins still
  match `256101a`. No provider execution, Signal work or tournaments.
- Confidence review, ranked: (1) weakened proof or submission races — all 167
  assertion/wait expressions preserved by AST comparison; response listeners
  remain before actions, cancellation and exactly-one-submit pass in both browsers;
  (2) case state and source identity — state remains in Forecast, exact row and
  hash lookup unchanged, 15 focused boundary/Forecast tests pass;
  (3) build dependency classification — clean offline npm ci and production build
  pass with every package version unchanged; (4) design drift — all Forecast
  class expressions and compiled CSS unchanged, desktop/mobile intake and debt
  screenshots pixel-identical to the preceding proof, revenue chart visually checked.
  Verified fine within this scope; Windows work-PC execution remains open.
- TypeScript, ESLint, Prettier and changed-code quality gate pass (zero findings).
  Built source tree `0fb3973faa8494c2b51093afbdbe71b20f1dfb36` in an isolated
  directory with a fresh dependency install. Chrome 157.0.8103.78 run
  `20261116-024417-01` and Edge 157.0.4341.60 run `20261116-024434-01` each passed
  all 30 synthetic checks on macOS. Proof: `proof-artifacts/run-D9auAO/proof.json`.
- This is source-snapshot proof, not Windows or archive acceptance. The held ZIP
  was not regenerated or published; release still requires Chrome and Edge passes
  on the Windows work PC. Oldest complete entries trimmed; git retains them.

## 2026-11-16 — Two requested Fallow findings resolved

- Verified both findings with `fallow inspect --file` for
  `scripts/connected-proof.mjs` and `src/pages/connected/report/Forecast.tsx`.
  Separated the forecast's recorded bridge validation from its rendering;
  split the browser proof into debt, portfolio, forecast and Evidence checks.
  No suppression or threshold change. Fallow audit against `b3a607f` PASS:
  zero introduced findings, four inherited findings remain outside this request.
- Confidence review checked zero versus missing values, unit identity,
  duplicate or absent rows, nonfinite values, source line identity and proof
  ordering. Nine new rendering cases plus existing Forecast tests pass (15).
  AST comparison confirms all 45 assertions/waits from the original checkCharts
  remain exact. TypeScript, ESLint, Prettier and changed-code quality gate pass.
- Built staged source tree `ed759e0477d3c685619568dc160b7631368b0dbe` in an isolated
  directory using installed pinned dependencies. Chrome 157.0.8103.78 run
  `20261116-023941-01` and Edge 157.0.4341.60 run `20261116-023955-01` each passed
  all 30 synthetic checks on macOS. Proof: `proof-artifacts/run-z6RLzy/proof.json`.
  This is source-snapshot proof; the previously held ZIP was not regenerated.
- RBOT-HTML and pins still match `256101a`; React lock unchanged. Windows work
  PC acceptance remains pending. No ZIP publication, Signal work or tournaments.

## 2026-11-16 — Connected admission, durable traces and Credit OS design

- Scope: React reader and additive connected adapter only. Native RBOT-HTML
  source, issuer-library engine and Python pins still match `256101a`; React
  dependency lock remains unchanged. No provider execution, Signal work,
  tournaments or publication.
- Admission now applies to the snapshot consumed by the Library and report
  reader, the report listing, forecast artifacts and portfolio attestation.
  Managed running/queued/failed/capped/rejected/interrupted reports stay out;
  native retained reports without scheduler records remain available, including
  folders containing spaces and Unicode. Source publications are not changed.
- Evidence links bind output identity, SHA-256 revision and exact paragraph,
  table row or section line. Reordering cannot select another output. Old ordinal
  links and missing revisions/rows show an unavailable state. Overview, Changes,
  Modules, Forecast, calendar and Evidence use the same resolver.
- Credit OS fidelity scope: original React components and Claude HTML exports
  at `450f6406`, Library filters and Cards/List, Overview dates with traces,
  Changes Cards/Table, Forecast case cards and shared chart/table selection,
  source-control hover, existing Evidence navigation and expandable Record.
  Gaps counts actual saved gap rows, preserves effects and delivered severity,
  and filters explicit None records. Module-scoped counts and empty states agree.
- Confidence review ranked identity/reordering, admission timing, exact data
  preservation, null/zero budget display, filters and case-label matching.
  Reproduced and repaired empty-result controls disappearing, deferred event
  reads, Gap ID being mistaken for Gap, unknown severity being discarded, and
  Downside shock selection differing from its raw Downside case column label.
  Budget totals use one retained reservation snapshot and exact decimal sums;
  unreadable journals remain unavailable, holds are separate from settled charges.
  Native historical admission and invalidation of unversioned bookmarks are
  deliberate. Browser/platform scope and retained source limitations stay explicit.
- Checks before browser proof: 74 targeted Python tests, 1,425 frontend tests,
  TypeScript, ESLint, formatting and the changed-code quality gate passed.
  Fallow retains baseline findings plus complexity/duplication warnings in
  touched code; the new unused export was removed. Browser results follow below.
- Browser preparation found and fixed a duplicated-label locator in Record.
  Visual inspection also required an explicit label for unrecorded model units;
  the native synthetic model leaves units null, and the UI does not infer them.
- Final clean-extraction browser proof: Chrome 157.0.8103.78 completed
  `20261116-023525-01`; Edge 157.0.4341.60 completed `20261116-023541-01`.
  Both passed all 30 recorded checks on macOS, including source hover with
  Show sources off, Base/Downside selection (independent 315/252 fixture values),
  exact source reload, output reorder and rejection of an old ordinal link.
  Paired Changes uses an explicitly separate fixture, not a second analytical run.
  The final null-unit change also passed 15 focused frontend tests.
- Candidate source `ab6641058546f8dc9ccde1054a44ce9b0beb62d7`; SHA-256
  `b0faadd99b3801d4c7ee922c0553b566196bd1c189cfdacc9913c43f7a783ce1`.
  Proof retained at `proof-artifacts/run-EkSYga/proof.json`; logs and screenshots
  are beside it. Preview run `20261116-023313-01` is synthetic and its 16 compiled
  files match the final candidate. Opened the Forecast view in the app preview.
  Browser retries corrected only test selectors and the paired fixture's digest
  lookup; no native backend or analytical output changed.
- The Windows release gate remains open. Keep the ZIP local until Chrome and
  Edge both pass on the actual Windows work PC using `docs/react-workflow.md`.

## 2026-11-15 — Evidence Record and report traces

- Viewed the Record tab with the existing Evidence tabs and module filter.
  Run totals use RBOT-HTML's scheduler timestamps and spend journal. Module
  timings, calls, instructions and hashes use the published record. Synthetic
  adapter responses carry an explicit label, and unavailable totals remain
  unavailable in retained reports without a scheduler record.
- Verified the Overview passage, a specific Modules debt chart row, and the
  Forecast model's pinned input block. A separate paired-run fixture checked
  the Changes measure link and both maturity schedule sources. It confirmed
  that a recorded zero opens the earlier row and that the current source
  excludes the other maturity rows. The upload-to-report proof used actual
  RBOT-HTML publication of the synthetic run. Confidence review checked
  ambiguous row bindings, exact amounts and the selected delivery's handoff.
- Fixed two browser proof issues. The debt locator now searches within the
  chosen row, and the download check waits until Summary has switched tabs
  and cleared the module filter.
- Backend and pins match `256101a`. The quality gate, 68 targeted Python tests,
  1,408 web tests, production build, lint and formatting passed.
- Candidate `f495920049e6691bb00538ee8802c62eb82290a4` SHA-256
  `228292e206f850acc376db101f5650a887d1018ef04df4c7b4d567a15cbf3c7d`.
  Chrome 157.0.8103.78 (`20261115-223326-01`) and Edge 157.0.4341.60
  (`20261115-223341-01`) each passed 27 checks from a clean macOS extraction.
  The preview build's files match the candidate and the preview run is
  `20261115-222925-01`. The ZIP stays local pending both work PC passes.

## 2026-11-15 — Credit OS Run start and Run activity exports

- Compared both screens with `Run start.dc.html` and `Run activity.dc.html` from
  Credit OS design commit `450f6406e25d26e53cf8af87956e529dc8c67bb2`. Checked
  the five-step layout, document picker, Readiness, paid warning dialog and the
  activity summary and two panels against the browser captures. The reference's
  Stop run control has no RBOT-HTML endpoint.
- Confidence review checked that opening or canceling either dialog sends no
  submission, final confirmation reuses the approved digest and uncertain retries
  reuse the exact payload. Checked recorded zero spend, a historical USD 50.00
  cap against the current USD 20.00 setting, missing event logs, private event
  fields, elapsed time and report-only delivery. The digested summary receives
  the optional analyst note as a native research question with line breaks
  converted to spaces for the native table contract.
- The RBOT-HTML backend and pins match `256101a`. Quality gate, 68 targeted
  Python tests, 172 web tests, ESLint, Prettier and production build passed.
- Candidate `f045f69768c4aed90cd23e7c9a7a41f2f7cf7af6` SHA-256
  `af69e17f9d7f306fd2fda39223bd3af2accffad899976399b59f2b7cc7b7cb75`.
  Clean macOS extraction passed Chrome 157.0.8103.78 (`20261115-214116-01`)
  and Edge 157.0.4341.60 (`20261115-214130-01`). Each passed 24 checks
  from upload through the published report. The paid dialog was exercised with
  submission blocked. The separate synthetic preview completed
  `20261115-214052-01` with USD 0.00 spent and 14 of 14 modules finished.
  The ZIP stays local pending both browsers on the Windows work PC.

## 2026-11-15 — RBOT-HTML 256101a and browser proof

- Native backend and pins match upstream `256101a`. All 16 compiled React
  files match the five-step Run candidate. The current upstream work-PC pack
  and historical handoffs retain their original bytes.
- Both browsers initially reached the new checker and failed on the old
  synthetic CP-2E headers. The corrected fixture separates the chart data
  from the native registers. Each browser verified the new completeness
  records and native agreement on USD 500m unhedged debt, 62.5% and USD 5m
  added interest. Confidence review also checked rejection of a renamed
  header and an incorrect gross-interest value. Quality, 657 targeted
  Python tests, 98 web tests and the build passed.
- Candidate `8862b08` SHA-256
  `0692c62a670c42e1af4d94c9d066920db09c4a5c53037467f6ad84574afea379`.
  Clean macOS extraction passed Chrome (`20261115-210759-01`) and Edge
  (`20261115-210811-01`). The offline preview completed
  `20261115-210806-01`. Windows work-PC proof and publication are pending.

## 2026-11-15 — Connected five-step Run intake

- Compared the connected page with the Credit OS Run mock and kit. Documents,
  Purpose, Confirm, More context and Start use the existing stepper, drop zone,
  purpose cards, details list and side Readiness. The cap comes from the native
  scheduler. At 390 px the compact stepper and uploader fit inside the form.
- Confidence review checked drag and drop, duplicate stored names, valid
  file attachment choices, back navigation, pre-approval refusal, expired
  approval and identical retries. The native summary is requested after
  More context and the final submit uses its exact answers and digest.
  Targeted web (98) and Python (27) tests, quality, lint, format and build passed.
- Candidate `cac625b`, SHA-256
  `6fb94dabd80d044070e3ced0bb1850e4df2d3bcd321b4712185ae5f27060b2a3`.
  Clean extraction passed Chrome (`20261115-210031-01`) and Edge
  (`20261115-210040-01`) on macOS. The interactive offline preview completed
  `20261115-205932-01` and serves the same compiled JS and CSS. The engine and
  pins match the existing RBOT-HTML `b8cf4ca` baseline. Upstream advanced to
  `256101a`. Windows work-PC proof and publication are pending.

## 2026-11-15 — Windows candidate and extracted-project checks

- The archive had omitted the React design system and brand tokens used by
  12 web test files. Confidence review traced those reads and verified the
  revised ZIP contains both files byte for byte. The Windows guide now records
  the retained Caesars result. Packaged application, proof inputs and pins
  match the preceding candidate. The Python quality gate and 27 targeted tests
  passed. Extracted `CI=1 npm run gates` passed locally (3,047 web tests,
  70 script tests and the file-browser checks).
- Candidate `9c9a924`, SHA-256
  `f6def4b788135bfb583e11829e339c92d90df22c1657ddcebf71bb6c2097fbfd`.
  Its verified clean extraction passed macOS Chrome (`20261115-173348-01`)
  and Edge (`20261115-173359-01`). The same build replayed all five Caesars
  views at 1,440 and 390 px, checked against the mock layouts and native data.
  The replay restored the download copy after local preview startup and verified
  the CP-2 hash, C11/C14 and 464.86 versus 647.95 US$m. Windows work-PC proof
  and publication are pending.

## 2026-11-15 — Portfolio limits from a validated fund export

- Confidence review exercised the frozen source links and pinned bytes, plot
  and table agreement, exact zero and zero maximum, report date and check
  date, absent NAV, duplicate limits, minimum limits and exposure definitions
  the holdings cannot corroborate. The targeted Python suite passed 103
  tests. The changed-code quality gate and packaged web build passed.
- The standard candidate `b532d3e` had SHA-256
  `422d6a7769214b199aa7cfdf50511f52dcfeb617866a25a4a99701efcb5febcc`.
  Its verified clean extraction passed full macOS Chrome
  (`20261115-172838-01`) and Edge (`20261115-172847-01`) proof.
- A separate synthetic upload used the same application with export fixtures
  and a matching canned CP-6 handoff. Chrome (`20261115-172851-01`) and Edge
  (`20261115-172902-01`) rendered 29.80% against 30.0% and 0.00% against
  5.00% in Modules and Forecast. The 29.90% illustrative proposal stayed in
  the original table. Both browsers showed the retained Caesars portfolio gap
  at 390 px in both views. Windows work-PC proof and publication are pending.

## 2026-11-15 — Portfolio limits from a validated workbook

- The native synthetic run uploaded and selected the test workbook. Both
  browsers showed 2.37% against 2.50% and 3.73% against 5.00% in Modules and
  Forecast. The illustrative 2.40 proposal stayed in the original table.
- Confidence review checked the frozen source hash, selected output, date,
  mismatching limit data and authored gap. CSV exports still use the source
  table. Both browsers retained the Caesars gap at 390 px in both views.
  Targeted web (97) and Python (17) tests, quality, lint, format and build passed.
- Candidate `eb1a5c1` SHA-256
  `8a2cd284e9b023c7138c973fcce0986a41067d7e9e6ad3b33c14213a8ddb3626`.
  Clean macOS extraction passed Chrome (`20261115-172022-01`) and Edge
  (`20261115-172031-01`). Windows work-PC proof and publication are pending.

## 2026-11-15 — Security decisions and last trades

- Both macOS browsers checked six retained Caesars decisions, two observed
  bond prices ($93.28 and $84.94), exact yields (8.063520% and 9.318398%),
  original quote and row traces, recovery qualifications, and year-precision
  maturities. The module fit at 390 px with both tables open.
- Confidence review checked future, impossible and conflicting quote dates,
  missing locators, and unquoted rows. Targeted web (103) and Python (15)
  tests, quality, lint, format and build passed.
- Candidate `2c971bc` SHA-256
  `79b6b93b02754cbfebc493f297bf4c4be06796f411f00df26d4a5b4fa1a79080`.
  Clean macOS extraction passed Chrome (`20261115-170434-01`) and Edge
  (`20261115-170442-01`). Windows work-PC proof and publication are pending.

## 2026-11-15 — Rate and currency sensitivity

- The read-only Caesars handoff's 100 bp shock adds USD 59.68 million
  annual cash interest and moves all-in cover from 1.52x to 1.48x. Both
  browsers checked the distinct calculation traces, hedge terms, FX gap and
  dated events at 390 px. The hedged cash impact remains unestablished.
- Confidence review checked mixed currencies, zero versus missing net interest,
  before/after quote alignment, and the reported shock basis. Focused web
  (85) and Python (15) tests, quality, lint, format and build passed.
- Candidate `944bc5e` SHA-256
  `8c2c14f4448697e51529a98cdd424b233417bce799aab95b998e94539b4176c6`.
  Clean macOS extraction passed Chrome (`20261115-165617-01`) and Edge
  (`20261115-165625-01`). Windows work-PC proof and publication are pending.

## 2026-11-15 — Downside break points and narrow report layout

- Retained Caesars showed the first break at 17.86% EBITDA decline with
  interest held and 15.55% under the recorded cash-interest shock. Both
  browsers verified the analyst-watch qualification, unresolved break
  values, six leading and two lagging flags, and the original calculation.
- Confidence review checked share spelling, zero, reversed rank, unknown
  values, source focus, and the table header's containing block. Both
  macOS browsers saw all five report routes at 390 px. Focused web (940)
  and Python (15) tests, quality, lint, format and build passed.
- Candidate `ecef6fc` SHA-256
  `affdcadd30fece8505fabe1fc32412ce83ebc8dead650fe8f33724dd130fcaf1`.
  Clean macOS extraction passed Chrome (`20261115-164826-01`) and Edge
  (`20261115-164833-01`). Windows work-PC proof and publication are pending.

## 2026-11-15 — Downside case comparison

- The retained Caesars CP-2A handoff supplied an unstressed control and three
  named shocks. Chrome and Edge matched the cover-watch result of −31.3278 USD
  million free cash flow and 1.22x all-in cover across chart, table and row trace.
  The 720 px layout passed after the trace tooltip closed. The report still has
  the same pre-existing horizontal overflow at 390 px.
- Confidence review verified reordered columns, ambiguous control and shock
  inputs, negative and zero geometry, cross-currency rejection and missing
  net debt. Focused web (80) and Python (15) tests, quality, lint and build passed.
- Candidate `203c547` SHA-256
  `697bdea7f42e71c7454d0f19ea0cb82b31ad891dead59a34658bc54c4d32a58f`.
  Clean macOS extraction passed Chrome (`20261115-164043-01`) and Edge
  (`20261115-164051-01`). Windows work-PC proof and publication are pending.

## 2026-11-15 — Module readiness and monitoring records

- The retained Caesars replay in macOS Chrome and Edge showed six CP-0 readiness
  decisions (five with limitations, one conditional) and eight CP-2 triggers.
  The USD 1,502 million liquidity threshold and the unresolved covenant basis
  match the handoffs. Both browsers checked section jumps and row trace focus.
- Confidence review checked the combined and split register columns, module
  ownership, unavailable thresholds and preservation of source qualifications.
  Focused web (927) and Python (15) tests, quality, lint, format and build passed.
- Candidate `c96d161` SHA-256
  `5b0599d74f0ccbedd122c8920f8deaf225f4494eef309c7ee4c19c957cae86df`.
  Clean extraction passed macOS Chrome (`20261115-162914-01`) and Edge
  (`20261115-162922-01`). Windows work-PC proof and publication are pending.

## 2026-11-15 — Keyboard source traces for figures and calendar rows

- Both macOS browsers opened the Caesars Watchlist passage, maturity chart
  and calendar row by keyboard. Escape returned focus to the exact control
  and kept the selected Table view. Modules and Forecast opened the same maturity
  source. The Evidence route reloaded with the 3,962 US$m maturity and the original
  quarterly filing reference. The calendar table fit the 720 px viewport.
- Confidence review reproduced lost focus and the reset Table view. Checked
  same-run row identities, deduplicated exact source records, both trace dismissal
  and deep-link navigation, and chart stability during module route changes.
  Focused web (305) and Python (15) tests, quality, lint, format and build passed.
- Candidate `3104896` SHA-256
  `f30be0c81281f0b7fa560ed148e26099018c98cf08837dd6ddd39e61a1070c4b`.
  Clean extraction passed macOS Chrome (`20261115-161824-01`) and Edge
  (`20261115-161832-01`), with paired proof. Windows work-PC proof and
  publication are pending.

## 2026-11-15 — Cross-module issuer calendar

- Both macOS browsers checked 69 retained Caesars calendar rows, split into 46
  historical and 23 scheduled events. Exact dates, publication dates, precision
  and row traces matched the native handoffs. Both displayed the authored watch
  gap, opened the source by keyboard, reloaded the route and fit 720 px.
- Confidence review checked duplicate descriptors, coincident independent rows,
  retained alternatives, incompatible dates and source text placement. The
  synthetic path checked a scenario quarter and nine distinct same-day entries.
  Focused web (53) and Python (15) tests, quality, lint, format and build passed.
- Candidate `2611797` SHA-256
  `0c89b8bbe33df260a6d7e8da45d2d8a174adddb1bc97c70650eb037ac5da92ff`.
  Clean extraction passed macOS Chrome (`20261115-161013-01`) and Edge
  (`20261115-161020-01`). The paired proof contains the hash and ten screenshots.
  Windows work-PC proof and publication remain pending.

## 2026-11-15 — Paired browser proof tied to the candidate ZIP

- The Windows guide verifies the companion checksum and extracts into a fresh
  local folder. The runner records the exact archive hash, source commit, host
  platform and release, run IDs, browser versions and screenshot names together.
  Windows synthetic workspaces use the short extraction path.
- Confidence review checked invalid provenance and a failing second browser.
  The latter returned exit 1, left Chrome's individual record, and wrote no
  paired proof. The Python quality gate, focused Python tests (15), lint and
  formatting passed.
- Candidate `3712f2a`, ZIP SHA-256
  `df2e529a8ea938989646d68f62711cfe4ac85335cd39f1d0979ecb602e00a044`.
  A clean macOS extraction passed in Chrome (`20261115-160346-01`) and Edge
  (`20261115-160352-01`). Verified `proof.json` against the ZIP, the exact
  individual records and all eight screenshots. The React assets are identical
  to the preceding candidate. Windows work-PC proof and publication are pending.

## 2026-11-15 — Latest RBOT-HTML and additional chart contracts

- Verified upstream at `b8cf4ca`. The engine, native library and Python pins match it.
  The React lockfile is unchanged. [Upstream method and portfolio verification](https://github.com/EricMG13/RBOT-HTML/blob/b8cf4ca58083e1a822fb45515cd7ce63ce467834/VERIFICATION.md)
- The new native validator recognizes the supplied holdings, market data, mandate, exposure
  and constraints. Validation failed for both the May exposure date and the October
  Caesars date. React now offers the workbook selection for Full credit assessment.
- Confidence review reproduced intermittent-data chart fallback and dropped recovery
  columns. Both macOS browsers verified ten plots and one mixed-unit record from the
  native descriptor parser, with exact zero, no-quote and recovery gaps. The figures
  used synthetic handoffs. Caesars separately passed 23 retained descriptor checks.
- Restored the newly required CP-2E and CP-3 registers in the synthetic handoffs.
  Candidate source `3cb2b40` and ZIP SHA-256
  `e2c984bf061d7b571cdc20b1f0d046032abf184ae20f4becf00120db1690811c`.
  The clean extraction passed macOS Chrome (`20261115-155903-01`) and Edge
  (`20261115-155910-01`), including the signed bridge and missing funding commitment.
  Python (285), web (302), quality, typecheck, formatting and build checks passed.
  Windows work-PC proof and publication remain pending.

## 2026-11-15 — Published run charts in Forecast

- Forecast takes figures and stated gaps from the current module output. Each
  chart keeps the owning module and same handoff-line trace used in Modules.
  The collection works without a calculation model. Native chart rejections
  keep their diagnostic text in Evidence Record.
- Confidence review checked alternate output identity, non-assessable charts,
  recorded build rejections, zero versus a missing value, and cited gap text.
  No dated event lanes or relationship maps entered the Forecast collection.
- The retained Caesars case showed eight figures in Chrome and Edge on macOS.
  Both kept the portfolio gap, the FY2027 cash-basis reconciliation, and the
  2030 maturity of 3,962 US$m through the chart table and Evidence reload.
  Both layouts fit 720 px. See `proof-artifacts/caesars-forecast-run-charts/`.
- Source `47cbd8b`, ZIP SHA-256 `70d1414ead1682be2791ced60b314cca7b2abdec2350034442513ad09027c4f2`.
  Extracted-package synthetic runs passed in macOS Chrome (`20261115-154748-01`)
  and Edge (`20261115-154754-01`). Targeted web tests passed (73) and Python
  passed (15). Lint, format, typecheck, build and quality gate passed.
  Windows work-PC proof and publication are pending.

## 2026-11-15 — Portfolio evidence and all retained Caesars figures

- The pinned portfolio validator at RBOT-HTML `fc010a7` rejects the supplied two-sheet
  workbook and accepts the repository template. The dated May exposure was outside the
  October Caesars case. No supplied portfolio files were included in the ZIP.
- Confidence review reproduced a plot from numeric limits alone. The connected reader now
  shows the source table, with a validation gap, when no validated portfolio basis is
  published. Tests preserve 0.00, the exact limit and the reason when no proposal exists.
  The existing portfolio chart component passed its synthetic component checks. The
  native snapshot still has no validated portfolio basis to bind a positive PD.1 case.
- The retained Caesars replay on macOS Chrome and Edge checked eight plotted financial
  charts, six dated event lanes, seven maps, two authored gaps and the source links and
  visible table rows of all 21 figures. Records are under
  `proof-artifacts/caesars-figure-audit/`. The preview served an isolated copy with
  same-origin POST and DELETE returning 405.
- Candidate `425655b` SHA-256 `44bcf35e6bd4172a874cadbc363e60e92762be0a07af0467d755fef144e07df5`.
  The extracted ZIP passed on macOS Chrome 157.0.8103.78 (run `20261115-153911-01`)
  and Edge 157.0.4341.60 (run `20261115-153916-01`). Both checked chart-source route
  reload, the portfolio table and its qualification, and the original CP-2 file hash.
  Focused tests passed (70 web and 15 Python), with clean lint, format, build and
  quality gate results. The work-PC browser proof and ZIP publication are pending.

