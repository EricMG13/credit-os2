# Stage 5 batch: connected shell, library and activity

Branch `audit/lead-connected-shell`, base `301c7ded` (the repair-1 snapshot). This is a separate lead batch; it did not edit, push or take over `audit/repair-1`. Use only the new commit range after that base when integrating. Requested historical worker models and named confidence-review/rewrite-tournament skills were unavailable; the available inherited model performed implementation, followed by the direct review below. A fresh external review remains the lead's next step.

## Outcomes

Twelve assigned findings are repaired in this branch, five are repaired in part with explicit ownership handoffs, and two formatting findings remain assigned to the report/charts worker. The handoffs must be combined before the corresponding canonical finding can be closed.

| Finding | Outcome | Change or remaining work |
| --- | --- | --- |
| C1-008 | repaired | Library cards show admitted delivery state, sector rather than raw issuer ID, and the exact designated credit-view paragraph. A compact additive `lead` preserves original paragraph, Basis line, output, hash and line. The card uses existing reader text/reference rules and links its source control to that exact Evidence address. Missing lead content is stated, never invented. |
| C1-014 | in part | Library, Run activity and Run progress titles identify the page; case loading also has its destination title. Start is coordinated with the start worker. Report module/Evidence subtab titles remain with the report worker. |
| C1-018 | repaired | Running-card modules show the module name as plain text beside a badge whose visible word is the state. |
| C1-019 | repaired | Query, sector, pathway and Cards/List choice live in search parameters and are restored on a fresh mount. Other address parameters and history state remain intact. |
| C1-022 | repaired | The search, sector and pathway labels use the same type, colour and spacing classes; the search retains its width limit. |
| C1-023 | in part | Cards/list dates and Run progress use `asOfDate` (`31 March 2026`). UTC event stamps retain their existing timestamp format. The report's `runTiming` change remains with the report worker, which can use the exported helper. |
| C1-027 | repaired | Spend, settled charges, holds and cap round their original decimal strings half up to cents. Binary numbers are used only for bar geometry. Decimal and exponent spellings agree; zero/underflow exponents do not allocate enormous powers. |
| C1-028 | repaired | The existing report metadata request carries designated outputs explicitly marked Not assessable/unreadable. Run progress displays their assessment state while retaining completed-module counts and the separate report-delivery step. The original checker-stop handling remains. Older metadata with no field remains readable. No extra HTTP request is made. |
| C1-032 | in part | Library cards, Run activity, Run progress and lazy-page fallback use static content-shaped blocks. The report reader's own resolved loading state remains with the report worker. |
| J1-008 | repaired | The tally says `Ended without a report`. A populated page links to the library; the empty state retains its library action and explanation. |
| J1-011 | repaired | The connected rail says `Run activity`; its existing NavButton tooltip receives that same label. The shared current area also gains the distinct line marker required by S1-019. |
| J1-012 | in part | Rail/list name fixed. The report action still needs its distinct `Run progress` label in the report worker's files. |
| J2-009 | repaired | Under the retained `Start from this run` control, the page explicitly says it opens a new run with its own cap and leaves the earlier run as it is. No resume/retry control was added (OQ-06). |
| J2-010 | repaired | An ended run's feed has its recorded terminal state, reason and end time ahead of earlier Running entries. A live run has no invented end entry. |
| J2-015 | repaired | Where no specific run/held reason exists, queued rows and progress explain that the run waits for a slot and starts when the service can accept it. Existing specific reasons remain. No unsupported live count or queue position is invented. |
| C3-011 | handed off | Positive change-card sign is in `publishedReport.ts` formatting, reserved for the report/charts worker. No formatting function in that file changed here. |
| C4-013 | handed off | Common report currency-unit rendering is in the reserved formatting functions, assigned to the report/charts worker. |
| S6-037 | repaired | The progress card is explicitly `Modules and report delivery`, consistent with the analytical-module count excluding Report. |
| J4-001 | in part | The new credit-view paragraph has an exact source control. Individual library-card metric traces require the group-2 HeadlineFigures/report worker; no guessed metric provenance was added. |

Additional coordinated changes: S1-019's shared rail marker; S1-011's `Shell.current: Area | null` support for the static not-found worker; the real service `Run.stopped_by` field replaces the hidden local intersection; optional filed `issuer_name` and `approved_summary_limits` API types support the start/evidence workers. T03's joined rebuild/daily-limit notice now starts the second sentence `Daily`, preserving the rest exactly.

## Test first

All new tests are retained in the branch. Every production repair above that this branch implemented had a failing test observed first. Additional confidence guards that already passed are not described as baseline failures.

| Before change | Observed result |
| --- | --- |
| `runFigures.finalAudit.test.ts` | 5 failures: exact cents/exponent equivalents and missing terminal failure feed; 4 guards already passed. |
| `shellFinalAudit.test.tsx`, initial UI cases | 11 failures, covering card delivery/ID, URL filters, labels, long date/title, skeleton, visible module state, ended count/library link, queue explanation and separate-run wording/delivery heading. |
| Card paragraph/source-control additions | 2 failures before rendering the new source-preserving card credit view. |
| `Shell.finalAudit.test.tsx` | 2 failures for marker/connected label; nullable-current runtime guard already passed. Type checking also required nullable current support. |
| API contract tests | Typecheck rejected missing public `stopped_by`, filed `issuer_name` and approved-summary metadata before the type additions. |
| `tests/test_react_library_cards.py`, initial compact lead cases | 5 failures, with the no-wrong-pathway guard already passing. |
| C1-028 published blocked metadata | Python 1 failure and UI 1 failure before the additive metadata and display handling; older-metadata guard already passed. |
| `ConnectedApp.loading.test.tsx` | Skeleton assertion failed first; a later loading-destination title assertion also failed before its title effect. |
| `tests/test_react_run_reason_sentences.py` | 1 failure for `. daily`, with the unchanged unrecognised-message guard already passing. |
| Confidence check of blocked-status semantics | 1 failure: a preceding nonempty level-three audit section must use the reader's legacy declared-status fallback. The helper now follows that existing rule exactly. |

## Existing test assertions changed

No monetary amount, module count, expected status, hash, source, timeout or gate was relaxed.

- `ConnectedApp.test.tsx`: two rail-name assertions now say `Run activity` (J1-011); the three tally labels say `Ended without a report` with their original 1/23/20 counts (J1-008); one card heading says `Modules and report delivery` (S6-037).
- The progress breadcrumb assertion and two report-action-absence assertions in `ReportLibrary.design.test.tsx` are scoped to `main`, because the correctly named rail now independently links to Run activity. Their expected href/absence is unchanged.
- One activity-table assertion awaits the same exact `Harbour Packaging` link using the default lookup timeout. The independent group-1 review and the start worker observed the asynchronous React Aria table-collection race; no expected value or timeout changed.
- `tests/test_react_run_activity.py`: only the expected `daily` after the new full stop changes to `Daily`, the precise T03 residual wording repair. Its input and the rest of the expected sentence stay exact.

## Verification

Commands used uv **0.12.5**, Node 24.22.1 and existing symlinked npm packages. Python commands used the worktree's explicit `PYTHONPATH` and `uv run --no-sync`, avoiding the shared editable install pointing at another worktree. Long commands were bounded by `timeout 300`; Vitest used one worker under the shared machine load.

| Check | Exit | Result |
| --- | ---: | --- |
| `npm --prefix web run lint` | 0 | No errors/warnings. |
| `npm --prefix web run format:check` | 0 | All matched files formatted. |
| `npm --prefix web run typecheck` | 0 | Public API and nullable-current contracts accepted. |
| Affected connected/shell tests plus all `src/pages/signal`, `vitest run --root web --maxWorkers 1 ...` | 0 | 46 files, 954 tests; 239.62 s. Includes `ConnectedApp.test.tsx`, `ReportLibrary.design.test.tsx`, new batch tests, Run states/reasons/activity and Signal. |
| Post-review targeted run (`runFigures.finalAudit`, `runFigures`, lazy loading) | 0 | 3 files, 19 tests, including two bounded extreme-exponent guards. |
| `pytest tests/test_react_library_cards.py tests/test_react_performance.py tests/test_react_run_reason_sentences.py tests/test_react_run_activity.py tests/test_react_frontend.py -q` | 0 | Final 149 passed; 27.53 s. |
| `uv run --no-sync python tools/quality_gate.py` (default origin/main scope) | 0 | 0 findings; 23 changed Python files, 2,597 lines in scope, including inherited repair-1 code. |
| `git diff --check` | 0 | No whitespace errors. |

The earlier broad run had three failures: the known filters/Synthetic-test lookup timeout and two report-action queries that now matched the newly named rail. After the semantically required main-region scopes, the full affected run above passed unchanged default timeouts, including the filters test. The final confidence repair changed only Python; its affected Python suite and changed-code gate were rerun, while unaffected frontend tests were not repeated.

## Confidence review and simplest design

- Exact-money doubts: preserved original decimal strings until display rounding; independent literal amounts pin decimal half-cent and carry cases. Numeric conversion remains confined to approximate bar geometry. Zero and underflow exponents have finite work.
- Source/lead doubts: selected-output, run-key, source hash and line remain attached; tests reject retained output from another run, unselected output, and a Bottom line inside an audit-only section. Long unrelated handoff/chip/activity content stays out of the compact index (the independent payload bound remains under 2,000 bytes in its regression).
- Status doubt: tested mixed delivered/blocked outputs and older/no report metadata. The metadata copies the reader's explicit status/Bottom-line semantics; it supplies no new analytical judgment and makes no additional request.
- Layout/state doubt: URL filters restore from a copied address on remount. Loading blocks are static and case-date formatting preserves invalid/unknown source text instead of inventing another date. Pixel layout remains a combined-branch browser check.
- Post-edit comparison retained the small exact-cent helper over a dependency; one compact lead assembler over transporting complete reports; existing metadata over another snapshot request; optional API fields over local type intersections; and URL state over a second persistence store. No gate, known-failure list or protected analytical content changed.

Not verified: browser hover/layout and native Back/Forward were not exercised in this worker; the existing NavButton tooltip was checked by its caller contract, not by a hover screenshot; the original browser probes were not rerun, and combined-branch screen/figure/source/limitation fidelity remains the lead's stage-5 check; ReportReader loading, report subpage titles, report unit/sign formatting, the distinct report Run-progress action and metric-level card traces are explicit handoffs above; Windows/work PC, native branded-browser connected proof, release packaging, real providers/paid Submit and Teams were not exercised here; the named historical models and named review skills were unavailable.
