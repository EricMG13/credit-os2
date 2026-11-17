# Independent lead Evidence and static library/run review

Reviewed source Evidence diff: `f9453f27..7ebb6476` (`audit/lead-connected-evidence`). Reviewed own static-library/run commits: `9112aa0d`, `f6c00ee6`, `2805660b`, `6b85260c`, `9e311221`, based on `152fdeef`; foreign Shell dependencies `662909ad` and `adb4b6f3` were excluded as requested. Candidate reviewed: `/workspace/review-connected-integration`, initially `10c00cf5`, related integration test correction `66d8ec0b`, then documentation-only `d988f71a`. No tracked file was edited by this reviewer; no push, merge, external application call or subagent was used.

Read AGENTS.md, the decided audit R1–R17 and stage-5 rules, finding records relevant to the patches, `batch-connected-evidence.md`, `T42.md`, `batch-static-library-run.md`, all named production diffs and their existing/new test changes. T18/T22 remain unfinished on repair-2 and are outside this candidate; their known unfinished state is not counted as a new finding.

## Verdicts

| Scope | Verdict | New High | New Medium | New Low |
| --- | --- | ---: | ---: | ---: |
| Connected Evidence, Record and approval persistence | PASS with one Low reader-copy follow-up | 0 | 0 | 1 |
| T42 / R4-001 source-page preservation | PASS | 0 | 0 | 0 |
| Static App/library/run own changes | PASS | 0 | 0 | 0 |
| Named integration conflicts and follow-up expectations | PASS | 0 | 0 | 0 |

No new High or Medium finding blocks these chunks. This review does not approve unfinished repair-2 work or substitute for the final combined fidelity/browser gates.

## Approval metadata: exact issued values survive the boundary

- `_record_issued` reads the original Summary result, selects exactly the four kinds that `start/limits.ts::needsCheck` makes decisions (`will_refuse`, `gap`, `limited`, `check`), and serializes each full original item. Ready/information are excluded without renaming them accepted decisions. There is no accepted-ID wire change or inferred acceptance flag.
- Digest, prior, cap and selected items are written in the same existing atomic replacement. UTF-8 JSON hex encoding retains newlines/whitespace/non-ASCII reason/fix and nested metadata while remaining one issued line, so existing whitespace splitting of digest/prior/cap is not reinterpreted. A later Summary replaces the metadata; an error clears it with the digest.
- Submit retains its existing approved-digest/files/answers/prior/cap checks and constructs the queued Record with the issued metadata before uploading files are released. No analysis is recomputed to reconstruct approvals after execution. The only Record constructors are the existing submit and loader paths; later scheduler transitions use replacement and preserve this field.
- The loader validates core string fields and decision kinds, retains other original item fields, and reports corrupt records as unreadable rather than silently converting a malformed list to no limits. A missing historical field is `None`; an issued empty decision list is `[]`; API JSON and UI distinguish these. This remains trusted local record metadata, like the digest/prior/cap state it accompanies; no new claim of tamper-evident audit storage is made.
- The added tests independently choose literal Unicode text, monetary text, ids, scopes, outcomes, fixes, basis/evidence/counting/inheritance fields. Replacement, passive exclusion, error clearing, upload release, disk reload and activity API consumption are exercised. Stored financial/analytical values and module-written text are unchanged.

## Low follow-up E1: approved limits display raw module codes rather than approval's displayed words

`web/src/pages/connected/report/Record.tsx` renders `{item.reason}` and `{item.fix}` directly in Approved summary limits. The Summary the analyst approved renders the same values through `api.ts::serviceText` in `start/ReviewSheet.tsx`. Ordinary generated items can contain known codes: `run_expectations.py` rule `cp1c-no-peer-source` says `CP-1C has no peer set ... CP-DR is not in this run.` and fixes it with `... add CP-DR.` Thus these fields reappear as codes on Evidence Record although the approval showed the module names. Scope headings already use `moduleName`.

Keep the stored original fields exact. A small display-only repair can reuse `serviceText` for reason/fix, matching the approved Summary and the existing reader-copy standard. First add a Record surface regression with that literal reason/fix, assert the independently written plain module names and absence of the known codes, while retaining the Python exact raw-metadata equality tests. This is a Low wording/fidelity-of-display item, not loss or mutation of stored approved metadata. It was sent to the lead during review; no repair was made here.

## T42: source citation identity and page ranges

The earlier Medium R4-001 is repaired. `citedSourceNames` groups by the exact source path (which includes run/digest/file), retains every distinct cited range in insertion order, and never synthesizes a larger continuous interval. Repeated base/cited URLs do not duplicate or erase ranges. Equal display names with different digests remain distinct sources. The TraceDrawer regression and portable offline probe independently pin pages 2–3, page 7 and a separate digest's page 11 as plain text, with no `/connected/sources/` anchors. The candidate continues to use this citation metadata visibly; it is not dead data for the sweep.

Evidence table citation groups retain both table-wide and row-specific source chips with actual source identity/quotes/excerpts/qualifications. Suppression is limited to source-empty repeated no-page boilerplate where the table has no source-like column. Revised link captions retain exact revision/line URLs. Source missing-date/type labels and completed-versus-listed script counts are explicit; no value is silently replaced by zero. New EmptyState and hairline changes preserve reachable downloads under the decided contract.

## Static library/run scope

- App preserves a matched page's own area/title when global data is missing/newer, ignores one trailing slash on Kit, and makes unknown addresses recoverable with no falsely current rail item. Generic shared App effects do not change Signal files or its analytical behavior.
- Home's search/filter/layout/range state is saved on the current history entry using a merge with other existing state; App's scroll-entry marker is retained. No local/global store exposes one entry's choices as another entry's saved state. The new regression restores all four choice families.
- The OQ-02 move changes only presentation order; actual prose, financial values and the fixed heading count remain. Blocked/not-run modules receive their exact existing reason/note in the Bottom line band with the correct state and gap link. The complete limitation text remains, with only the whole-card disclosure; state/measurement/per-item clipping is removed.
- Statement surface and cell-index changes retain row trace identity, amounts and periods. Loading skeletons now match Modules/Evidence and the current Modules tab remains reachable while loading. Module section selection observes the actual `main` scroll position rather than retaining only a clicked key.
- Static run empty states explain missing data and link back. The started page no longer describes a future Submit step. OQ-06 removes the unsupported Stop button; real Open actions remain. Purpose's selected tick stays functional while repeated decorative icons are removed. Readiness remains the existing simple hairline layout; no speculative shared abstraction was added.

## Named expected-value and conflict review

- `Record.tsx`: batch-a Delivery is preserved, including the exact distinction between `events: null` and `[]`; comparison problem/note remain; Started and accepted is a named heading; call tables retain module-specific headings; h4 remains. New empty-field labels, execution precedence and approval section are added alongside these, rather than replacing them.
- `ScriptChecks.tsx`: batch-a's removal of `aria-label` remains; visible meaningful register/figure titles stay; the new hairline-only layout and explanatory/empty text remain. No duplicate old region-label expectation was reintroduced.
- `ReportLibrary.design.test.tsx`: combined correction `66d8ec0b` keeps no raw Snapshot unavailable, no Loading report and no Report sections navigation. The earlier null Run activity assertion conflicted with T17/C3-007's required recovery action. It now pins the main-content Run activity link and exact `/run/northbridge-2026` target. This is an explicit finding-required expected-behavior correction, not a relaxed assertion.
- `Module.test.tsx` blocked state check now locates the exact Not assessable badge within the blocked Bottom line container rather than the reason heading's immediate parent; the visible ModuleNav state adds another copy elsewhere. Exact reason, note, gap link and state assertions remain. The changed query remains exact and scoped to the affected module.
- Source anchors become absence/plain cited-page assertions under OQ-04; link-name/plural expectations change only to C5-022/C5-017 wording. Old zero rejection becomes negative rejection while new zero behavior is independently covered in the earlier group-2 repair; this chunk changes none of those numbers.
- Static limitation/disclosure, Stop/icon and heading-order expectations change exactly to their decided finding behavior. Home test histories reset per independent test; no expected filter choice is removed. The Corvane no-report regression now explicitly creates a no-report fixture because batch b legitimately gives the shipped Corvane a report; it still pins No report yet and Start a run navigation.
- No test skip/only/todo, gate threshold, coverage allowance or persisted timeout is added in the reviewed diff. The only skip observed below is the existing case-sensitive-disk test.

## Independent verification

All long commands used `timeout 300`. uv was exactly 0.12.5. Python used `uv run --no-sync` with `PYTHONPATH=/workspace/review-connected-integration/src:/workspace/review-connected-integration/apps/issuer-library:/workspace/review-connected-integration`; no editable installs were rewritten. Vitest used `--maxWorkers=1` and default timeouts; no package install occurred.

| Command/check | Exit | Result/log |
| --- | ---: | --- |
| `uv run --no-sync pytest tests/test_approved_summary_limits.py tests/test_run_start_scheduler.py tests/test_run_start_submissions.py tests/test_inbox_runs.py -q` | 0 | 324 passed, 1 pre-existing case-sensitive-disk skip; 14.13s; `/workspace/scratch/lead-evidence-review-pytest.log` |
| Vitest App audit routes; library FinalAudit/Module/Module.limitationsOrder/Overview/Home.startRun; run FinalAudit; Evidence finalAudit/t21-fix1; Record finalAudit/existing; ScriptChecks; ArtifactDownloads states; PublishedTable recordEmpty; sourceFiles | 0 | 15 files, 234 tests; 53.29s; `/workspace/scratch/lead-evidence-static-review-vitest.log` |
| After related correction `66d8ec0b`: Vitest `Module.test.tsx` and `ReportLibrary.design.test.tsx` | 0 | 2 files, 124 tests; 23.66s; `/workspace/scratch/lead-evidence-static-integration-tests.log` |
| `node docs/audit/2026-11-16-final/output/5-repair/probes/R4-001-source-pages.mjs` | 0 | All distinct ranges retained, duplicates removed, digest identities separate |
| `git diff --check` | 0 | No tracked reviewer changes |

Source worker reports record successful full lint/format/typecheck, targeted callers and Signal tests, and the changed-code Python gate. Those report claims were read and assessed against their diffs; the final combined-tree versions of those broad gates remain the lead/integration worker's responsibility rather than being represented as repeated by this reviewer.

Not verified: browser/pixel rendering, actual browser Back/Forward and end-of-page section-marker geometry; final combined handoff fidelity, full frontend gates/connected proof, release ZIP, Windows/work-PC browsers and weekly full CI; original repair-2 T18/T22 work not in this candidate. No live/model/paid/provider/Teams/seat or real Submit call ran. Low E1 is a code-traced display-copy residual, reported for a failing surface test and display-only repair; no stored reason was modified by this review.
