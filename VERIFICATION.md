# Verification record

Keep one running record here. A pass applies only to the stated scope. Earlier verification of the
engine is in [EricMG13/final-workflow](https://github.com/EricMG13/final-workflow)'s
`VERIFICATION.md`, which also keeps the retained runs this copy leaves out.

## 2026-11-25 — Instruction and reference length: review and offline measures

- Scope: review only; no method text, launcher, prompt or presentation changed, no provider
  called. Added `docs/sweeps/2026-11-25-instruction-length/REPORT.md` with two baseline files,
  `tools/instruction_metrics.py` and `tests/test_instruction_metrics.py`. Trimmed here: the oldest
  entry (2026-11-16, PR #17).
- Checked: `tools/quality_gate.py` exit 0; `tests/test_instruction_metrics.py` 3 passed, expected
  values counted by hand from a literal text. The tool's deep and lite totals (1,815,970 and
  677,194 characters) equal `tools/cp1_check_proof.py --instructions` on the same tree.
- Corrected while checking: a first count of "reference files named but not sent" (347) was wrong;
  the files are sections of bundles that are sent. The measure now excludes them (5, all CP-0).
- Not verified: any effect of instruction length on module output (no model run); token figures
  are estimates from bytes; the overridden and requirement counts are keyword counts; guidance read
  from search extracts where the report says so. `confidence-review` was a self-check of the
  measures against the prepared instructions; `rewrite-tournament` was not run (one small tool).

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

## 2026-11-16 — Module test and repair routine: offline, one live Deep run on Claude Opus medium, then the market-data modules on GitHub Copilot GPT Sol (repairs ported onto `main` `4f8a375a` by branch `claude/module-routine-repairs`, from `e6028846`)

Scope: offline gates and the canned browser proof on `main` `a438cb9f` plus the routine's repairs;
one **live** launch from the React launcher (`python -m react_frontend`, Submit on an approved
summary, standing ruling `2026-11-11-run-start-submit.md`), Deep credit assessment, Claude Opus at
Fast (all medium, `opus-medium`), cap USD 40, the retained TDG FY2024 public files (as of
2024-09-30, legal documents `none`), run `20261116-185348-01` in `~/cos-live/tdg-deep-20261116b`
(outside the repo). Owner: "run the module test and repair routine offline then live", "Use opus
medium anthropic key", "Deep, cap USD 40". One case and route; outputs are candidates until
reviewed.

- Offline, `main`: CP-OS tests 1,696 passed; React 129; library 245 (1 skipped, screenshot);
  `web` gates exit 0 (171 files, 3,663 tests); `tools/quality_gate.py` 0 findings. The connected
  browser proof **failed** in Chrome and Edge: PR #40 made the analyst's name required and the proof
  never types it (`main` types it since `951bcda0`). CLI dry launch of the same Deep run: 20
  modules, cap USD 40, exit 0, no provider.
- Repaired, ported onto `main` `4f8a375a` by branch `claude/module-routine-repairs` (tests first:
  5 of its 9 new tests failed on `main`; the other 4 are guards that pass before and after):
  1. Uploaded names over 80 characters lost their extension (`safe_name` cut), so the TDG annual
     report PDF (84 characters) was stored without `.pdf` and silently ignored by the launcher; two
     long names agreeing for 80 characters overwrote each other. Now the last part keeps its suffix
     and gains 8 hex of its SHA-256 (`run_start/submissions.py`); in the routine the launcher then
     read all five files. 2. Issuer ID `pattern` was invalid under the `v` flag (console error,
     native check skipped); now `[a-z0-9][a-z0-9\-]{0,39}` on the start page #42 rebuilt
     (`StartRun.tsx`). 3. CP-DR's web page text ran table cells together (`Sep 30, 20241,398.32`);
     cells are now separated by ` | `. The routine's other two repairs are not in this branch: the
     proof's name line is on `main` since `951bcda0`; `finance.yahoo.com` is a separate PR. Gates
     on the branch: 550 targeted tests (submissions, service, React frontend, web lookup) and 486
     in the related start-page and lookup files passed, quality gate 0 findings, `web` typecheck,
     lint, prettier and vitest (3,917) exit 0 on Node 22; one independent review: pass with Lows,
     none High or Medium. Browser-marked tests and the connected proof run after the PR opens.
- Live run: 18 of 20 modules accepted, then **stopped at the cap** before CP-5 (USD 35.62 settled;
  the next call's hold would pass USD 40). No module failed; 11 drafts were sent back once and
  corrected on the next write (page locators in prose, figures not backed by tables, unit-less
  figures, chart-data wording). Handoff chain: every request's upstream hash equals that module's
  accepted response (0 mismatches). Method-script checks: none sent back on any accepted handoff
  (for example CP-4 46 agreed, CP-1B 32, CP-1D 12, CP-1 7). Run activity drew the run as Capped,
  18 of 20, Evidence validation Interrupted, Committee decision and Report Not run; no report was
  published, so the library and report views were not checked on live output.
- Market test data: the owner's Bloomberg aerospace loan sheet transcribed (five TransDigm tranches,
  nine peers, four index rows; 147 figures, each found in the OCR text) and **re-dated from
  2026-06-27 to 2024-09-30 at the owner's instruction** ("This is a test just updated the figures to
  make it run"); typed quotes for term loans J–N, ratings Moody's Ba3, S&P BB- (facility).
- Module-output run (ruling `2026-11-16-tdg-subset-copilot-sol.md`, temp folder
  `~/cos-live/tdg-subset-sol`, scratch driver): 13 Opus answers reused, CP-2H, CP-3D,
  CP-3C, CP-4C, CP-3, CP-5, CP-6 on `copilot-sol-medium`: **7 of 7 accepted, USD 4.51**, 104 handoff
  pins 0 mismatches, answer key 13 of 15 (the two misses are sound choices: CP-3 used the Ba and
  Ba/B indices, −4 and −169 bp, correct; CP-3C declined the quotes after CP-3D's block). GPT Sol on
  OpenAI was refused (no credits, USD 0).
- Fixes, ranked (owner, 2026-11-16: modules that need the RV Book will have it at deployment):
  1. High. **CP-4 acceptance must enforce its source gate.** CP-4 concluded covenant capacity and
     compliance (5.50x against 7.25x) from the 10-K's summary with no executed agreement, though its
     method says "Blocked: No executed governing document. STOP" and the launcher forecast "Will
     refuse"; CP-OS accepted it. **Done: #45, merged `d64bdf81`** (refused unless Blocked when no
     agreement is declared; CP-3 then writes Capital structure; CP-4 told its gate; review pass after
     one fix round). Open: rerun CP-4 with the agreements in `~/cos-live/tdg-agreements`.
  2. High, owner's call. **Opus medium does not finish Full or Deep under its cap** (Full's twelve
     modules before CP-5 cost USD 25.91 against 25; Deep needs about 43 against 40), so an ordinary
     run stops with no report. **Owner: "Default Full and Deep to GPT Sol"**: the start page already
     does (2026-11-12 amendment); OpenAI has no credits, so the default cannot run until topped up.
  3. Medium. **A wrong prose figure passed every check**: CP-1D says compensation lifts leverage
     "about 0.39x"; its own formula gives 22,967/3,871 − 22,967/4,088 = 0.315x (CP-5 caught it as
     minor). **Done: #47, merged `4f8a375a`**: a note in a table cell backed it; such a note now
     holds only a restatement of its cell's value (review pass).
  4. Medium. **Late requests are too large for Copilot**: first prompts CP-5 about 252,000 tokens
     (plus 32,000 output, over the 272,000 limit), CP-6 224,000, CP-3 209,000; Copilot summarised all
     three. No figure was lost this time (every CP-5 and CP-6 figure traces upstream). Smaller inputs
     to CP-3, CP-5, CP-6 also remove fix 5's cause and cut Opus cost (fix 2).
  5. Medium. **Summaries Copilot does not bill are invisible to the cap** (CP-3, CP-6): hold an
     allowance per summary, or stop it happening (fix 4).
  6. Medium, deployment setting. **Set `DEPLOY_WORKFLOW_SEC_USER_AGENT`**: without it CP-1C found no
     peers and CP-DR's SEC lookups were refused; the launcher readiness could say so.
  7. Check at deployment. Only CP-3's instructions say the Sector RV Book is current; CP-3D requires
     dated quotes and blocked on the re-dated sheet. If RV Book rows carry no quote date, CP-3D,
     CP-3C and CP-2H may block while CP-3 proceeds; then give them CP-3's policy.
  8. Low, one batch after the final phase: GPT Sol writes calculator results at 37 decimals in tables
     (34 lines in CP-3C, CP-5, CP-6; Opus none); a `.pdf.` name loses its suffix; `# Market quotes
     as of` is not read as a quotes file; `_row_has_cell` is not reset at `table`; the review sheet
     shows codes and "Will refuse wording open until A-live."; favicon 404.
- No fix needed: CP-3D and CP-3C market inference, CP-3's comparisons and CP-2H's facility ratings
  get the RV Book at deployment (CP-3 already worked fully on the test sheet). Leverage 6.02x and
  5.50x are two labelled bases, not a conflict: CP-1 states both (reported EBITDA, and EBITDA As
  Defined, the revolver test's measure) and the gap; this corrects the earlier note. CP-4C Not
  Applicable is right (no distress trigger). The library leaves out runs with reused answers by design.
- Not verified: library and report views on live output; CP-3D on dated RV Book quotes; the cell
  separator on a live page; Copilot's billing of summaries; other issuers; Windows; the full suite;
  on this branch, the browser-marked tests, the connected proof and the web gates on Node 24.

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
