# Stage 5 Low and Info batch: connected Evidence

Branch `audit/lead-connected-evidence`, base `f9453f27` (group 2's current pushed snapshot).
This is separate lead work; the active repair-2 branch was neither taken over nor changed.
Protected Signal, prompts, analytical methods, calculations, proof handoffs and module-written
text were not changed. No package or gate was changed; no paid, Teams, or real Submit call ran.

## Finding outcomes

| Finding | Outcome and evidence |
| --- | --- |
| C5-013 | Product contract preserved. Downloads remain reachable on Evidence Summary/Trace, and call/timing/instruction/hash internals on Record. Ruling decisions 9 and 10 govern the Evidence placement; the narrower matrix wording should be aligned by the lead, without removing a reachable download (R5). Registers remain exact handoff tables in Trace. No new owner question is opened. |
| C5-017 | Repaired: handoff/file counts pluralize independently, and Summary states recorded gaps, completed-versus-listed script checks, and handoffs with a Basis/quote explicitly not located. Counts follow the same module filter as the relevant Evidence views. |
| C5-018 | Repaired: each module's Evidence link has an underline and trailing arrow. |
| C5-019 | Repaired: artifact download buttons are siblings in a wrapping content-width flex row. |
| C5-022 | Repaired: the gap detail uses the existing rich-text renderer; links say “Open handoff line” and preserve the exact revision/line destination. |
| C5-023 | Repaired for the finding's absent groups: missing handoff ZIP/files are stated, and an empty model/calculation listing keeps its section with an explanation. T23's loading/error/empty behavior is retained. |
| C5-024 | Repaired: Sources, Gaps and an empty script-check selection use the existing featured-icon/title/description empty state. Source groups are “Used by a module”, “Supplied, not used” and “Not recorded as used”. |
| C5-025 | Partly repaired here: handoff-table citation groups identify the row, retain whole-table citations, and suppress source-empty “cites no page or register” boilerplate only when the table has no source/basis/reference/citation column. Actual source identity, quote, excerpt and qualifications remain. The drawer derivation half in ReportContent is assigned by the lead to the later report-shell worker. |
| C5-033 | Partly repaired: Record explicitly states that library admission and original execution provenance are not recorded rather than inferring either. Delivery timestamps/Started-and-accepted table naming are already on batch a and must survive integration. A real admission/retention provenance mechanism is still not in this API and remains an explicit lead follow-up; nothing is fabricated. |
| C5-035 | Repaired: issue headings use the module's plain name; alternate Evidence labels that contain only a module code become “Alternate handoff”, while descriptive stored labels are retained. |
| C5-037 | Repaired: Sources and trace source records explicitly mark missing document dates/types. The Sources view collapses readership to “Read by all N modules” only for an exact match to the report's module set. |
| C5-038 | Repaired: citation, derivation/source-record, script-outcome and module-record interiors use hairlines rather than nested rounded bordered cards; outer surfaces remain. |
| C5-028 | Repaired: the run's execution wins over service mode, including the call-table labels; record request failures are shown. PublishedTable has an optional emptyLabel with the existing handoff default preserved, and run call/timing tables supply the correct recorded-field wording. |
| C5-030 | Intentional duplicate preserved: `cpos_forecast.py` writes `annual.md` from the exact `cp1` bytes, and `react_frontend/artifacts.py` labels it “Annual model handoff”. It is a retained handoff download, not a claim that the HTML Model exists. Its reachable download remains under R5; no methodological or asset-generation change was made. |
| J3-012 (J4-011 merged) | Repaired: check explanations distinguish a completed check from unavailable/not-run scripts, and the tab badge says “ran of listed” instead of implying every listed item ran. Outcome status/count/figures themselves remain exact. |
| J3-020 | Already repaired by T21 on this base: every module row is the same Evidence link. C5-018 makes that common treatment visible. |
| J5-010 | Repaired for newly approved submissions: the exact decision items in the final issued Summary are retained atomically beside its digest, copied into the run record, returned by activity and drawn on Evidence Record as “Approved summary limits”. Historical records explicitly say this was not recorded; a recorded empty list says no limits required a decision. This metadata is not merged into module-written analytical Gaps. |

The 17 assigned IDs therefore contain 12 repairs, 1 already repaired item, 2 partial items, and 2
preserved contract/informational items. The new Medium citation defect R4-001 is separate (T42).

## Exact approval metadata

The service never received individual checkbox IDs: Submit sends the approved Summary's digest.
With the lead's explicit grant, `submissions._record_issued` now records the original Summary
items with `will_refuse`, `gap`, `limited` or `check` outcomes (the same four kinds the UI asks the
analyst to decide); passive ready/information items are not called limits. Original fields,
including id, scope, outcome, reason, fix, basis, evidence and inherited metadata, survive without
recomputation. The JSON is UTF-8 then hex encoded on one issued-metadata line, so whitespace and
Unicode cannot alter the legacy digest/prior/cap parsing. It is written in the same atomic replace
as those approval fields. A later summary replaces it; an error clears it with the digest.

`runs.Record.approved_summary_limits` is optional (`None` for historical records). Malformed
core metadata is refused rather than silently dropped. Scheduler copies it before upload release;
run activity returns it unchanged. The `api.ts` field belongs to the shell worker's commit
`8bb65aea`; this branch uses a matching local optional type annotation in Record to remain
independently checkable before that integration. No accepted-ID wire change, new provider call,
new analysis or reconstruction after execution was added.

## Test-first evidence and expectation changes

- Eight initial Evidence surface cases failed (exit 1), then passed after their corresponding
  repairs. Additional row grouping, nested-card, whole-table-source and alternate-label cases
  each failed for the original cause before their repairs. The new check-count/explanation,
  source-date and outcome-badge assertions likewise failed before the relevant changes.
- Eight Record cases failed first, then pass: execution precedence, empty call fields, error
  visibility, plain issue headings, flattened interiors, provenance gaps, exact limits and
  historical-missing versus recorded-empty limits.
- PublishedTable's new explicit-label case failed first; its default-label guard passed from
  the start. No existing table value or its default label changed.
- The five initial approval-metadata tests all failed first. They now cover exact Unicode and
  fields, replacement, exclusion of passive items, historical metadata, scheduler/reload/API
  preservation and corrupt metadata. A sixth guard for clearing a failed summary passed from
  the start after implementation; it was not presented as a red-first case.
- Existing `Evidence.test.tsx` expectations changed only where a finding requires the behavior:
  two exact link-name lookups from “Open source” to “Open handoff line” (C5-022), and one exact
  “1 designated handoffs” expectation to singular “1 designated handoff” (C5-017). Link targets,
  zero values, sparse-cell coverage, source identities and counts stay unchanged.
- New Record test data was completed with all required PublishedRun identity fields after
  typecheck exposed its incomplete fixture; no production behavior or assertion was weakened.

## Checks

All long commands used `timeout 300`. Vitest used at most two workers; the Signal run used one.
Python used uv **0.12.5** with `--no-sync` and this worktree's explicit PYTHONPATH, so the shared
editable environment could not redirect verification into another checkout.

| Check | Exit/result |
| --- | --- |
| `npm --prefix web run lint` | 0 after replacing numeric template interpolation with explicit String calls and using a local optional-metadata type annotation. |
| `npm --prefix web run format:check` | 0. |
| `npm --prefix web run typecheck` | 0 after completing the new test fixture. |
| Targeted Evidence/Record/ScriptChecks/ArtifactDownloads/sourceFiles/PublishedTable Vitest | 0, 9 files and 77 tests passed. |
| Signal Vitest | 0, 34 files and 630 tests passed; no Signal file changed. |
| Approval/submissions/scheduler/activity/runs pytest | 0, 294 passed and 1 existing case-sensitive-disk skip; five initial new tests included. |
| Current approval-metadata pytest alone (six cases) | 0, 6 passed. |
| `uv run --no-sync python tools/quality_gate.py` (default origin/main scope) | 0, 15 changed Python files, 643 lines in scope, no findings; includes earlier group-2 Python changes. |
| R4-001 portable probe | 0; exact ranges, deduplication and digest identities preserved. |
| `git diff --check` | 0. |

## Confidence and simpler-design review

Doubts checked: multiple ranges on one file, repeated base/cited addresses, same filename with a
different digest, whole-table versus row citations, missing versus zero, missing versus recorded
empty metadata, UTF-8 labels, review replacement/error, and output from a run whose execution
differs from the current service mode. The independently chosen literals in tests retain the
financial values and source identities. The Record request remains a single fetch; approval
metadata uses the existing issued atomic write and run record rather than another store or
post-run reconstruction. Citation ranges remain distinct strings rather than a synthesized
continuous range. No new abstraction/dependency or compatibility shim was added.

Not verified: no browser/pixel checks or original C5 browser probes were rerun in this worker; the lead must run the combined presentation fidelity check and final frontend gates. No live provider, real Submit, Teams call, Windows/browser-channel or release-package check ran here. C5-025's drawer half, C5-033's actual admission/retention mechanism and C5-013's matrix wording remain lead work. Named historical models/skills were unavailable; available-agent direct confidence/simplification checks were used under R7.
