# Stage 5: live assessment and response provenance metadata

Base: `d988f71a` combined candidate. Branch `audit/lead-runtime-metadata`, worktree
`/workspace/audit-runtime-metadata`. Backend commit `1f05c06e`; frontend commit
`30a522e9`. No push or merge. The lead approved the proposed optional schema,
files and trust path before production edits. This worker did not author the
preceding shell/Evidence implementations.

## Outcomes

- **C1-028 / review SC-1 repaired.** The existing activity reply carries the
  current accepted response's recorded assessment before the whole run publishes.
  Run progress uses it immediately; the independent execution completion tally and
  Report delivery state are unchanged. A completed module whose metadata cannot
  be established has an explicit named assessment gap. Finished publication
  metadata still works, including older replies omitting the optional field.
- **C5-033 repaired for reliable recorded metadata, with explicit historical
  gaps.** Evidence Record shows actual membership in the current admitted library
  and each current accepted response's recorded retained/new origin and exact
  SHA-256. New-response means a response recorded for this run; it makes no claim
  that a provider was called or money was spent. Existing delivery events remain
  untouched. No admission time is invented. Historical/malformed/unavailable
  metadata remains unknown; a recorded empty result stays distinct from unknown.
- **OQ-15 remains deferred.** No engine checker reason, analytical diagnosis,
  model execution, method, prompt or handoff text was added or changed.

## Minimal public schema

Both fields are optional on the frontend Run type for older-service compatibility:

```
module_outputs: null | [{
  module,
  assessment: null | "not-assessable" | "readable",
  provenance: null | "retained-response" | "new-response",
  response_sha256: null | "<exact recorded response hash>"
}]
library_admission: null | "listed" | "not-listed"
```

The list concerns current accepted responses, not every historical attempt.
Readable is the existing reader's non-blocked/readable state, not analytical
completeness. Null fields mean the response's identity could not be established;
null for the whole list means its authoritative metadata could not be read.

## Trust path and bounds

`react_frontend/run_metadata.py` is a read-only adapter. It writes nothing and
adds no API request or orchestration mechanism.

1. The workflow must name the current scheduler record's run id, issuer id/name,
   as-of date and pathway. Accepted states come from the existing event log. A
   later module start or draft rejection cannot reuse the old accepted label.
2. A final completion is used only when its bytes match its SHA-named filename,
   its pinned delivery manifest matches its hash and current run identity, and
   that manifest agrees with the selected module response path/hash. This permits
   retained replays without a live event log. Otherwise an accepted module needs
   exactly one unambiguous successful candidate.
3. A candidate must be a current module request path with a matching attempt and
   input fingerprint. Request run/module, instruction hash, source hashes and
   verified upstream response hashes must match the current workflow/plan. These
   are recorded source identities; source files and analysis are not re-executed.
4. Response bytes must match the review SHA and the review must record exactly
   `issues: []`. A selected response must also belong to the selected module and
   match its delivery pin. Multiple qualifying candidates remain unknown.
5. Retained origin requires the request's retained hash to match the exact
   response and the workflow's retained response/source/upstream pins. Missing
   retained-origin metadata is never called new. A recorded null retained hash
   with no retained pin means a response recorded for this run.
6. The assessment reuses the existing structured parser, reader/report fields and
   `library_cards` declared blocked/unreadable rule, including its legacy fallback.
   No independent analytical judgment or checker is introduced.
7. The reader refuses path escapes and symlinks, uses the existing nonblocking
   regular-file reader, and caps metadata at 4 MiB per file, 32 MiB total, 1,000
   scanned names/events and the engine's three attempt slots. Cap tests use tiny
   fixtures, never an operating-system limit.
8. Admission reads at most the existing 64 MiB publication limit, applies
   `admission.admitted`, and requires a unique matching workspace folder and
   catalogue entry with the current identity. A missing/unreadable/ambiguous
   publication is unknown, not not-listed. Malformed optional publication data
   cannot hide the otherwise readable run record.

Only `run_activity.reply`, the narrow new reader, the existing library reader-state
adapter, Run API fields, RunProgress and Record metadata were changed. The approved
summary limits section was not edited; report worker `0af85674` owns its independent
label mapping change. No Signal/shared component imports the changed connected
Run type (confirmed by source search).

## Test-first evidence and named expectation changes

- Sixteen initial Python activity-surface cases failed before metadata existed,
  then passed: live blocked/new/retained metadata, exact execution-state retention,
  ambiguous/rejected/hash-mismatched/fingerprint-mismatched/other-identity/other-
  instruction/other-source/linked candidates, later restart, missing metadata, and
  actual listed/not-listed/unknown admission.
- Nine initial frontend cases had seven new-behaviour failures and two existing
  historical-gap guards; all nine passed after implementation.
- Confidence review found two implementation trust gaps. New tests failed first
  for a selected path naming another module and for a later rejected draft after
  an old acceptance; both now pass without changing execution counts. A new
  finished-report compatibility case likewise failed first, then passed after
  preserving current metadata when an older report omits its optional field.
- A malformed publication-shape regression failed first with AttributeError;
  optional admission now explicitly remains unknown while the run record remains
  available. Other added confidence guards cover pinned final selection without
  events, links, small read/name caps, source/identity mutations with recomputed
  fingerprints, and bad publication JSON. There are 23 retained Python cases.
- The new empty-response wording was narrowed to “No current accepted module
  responses are recorded.” A surface regression failed before that wording fix;
  the list must not imply that an earlier historical attempt never existed.
- **Only existing expected value edited:** `Record.test.tsx`'s exact region-name
  list gains `Response provenance` before the same two named module call tables.
  The new C5-033 metadata section requires this addition. Both original table
  names and the assertion that neither is called Table remain exact. No amount,
  status, hash, source identity, count, timeout or gate was relaxed or skipped.

## Verification

All long commands used `timeout 300`; Vitest used one worker. uv is exactly
0.12.5. Python acceptance commands use `--no-sync` and explicit worktree PYTHONPATH
so the shared editable environment cannot select another checkout. No package or
lock file changed.

| Check | Exit | Result |
| --- | ---: | --- |
| New and affected Python: runtime metadata, run activity, library cards, react frontend, run-reason sentences, performance | 0 | 172 passed, including all 23 new metadata cases |
| Affected frontend RunProgress callers, run figures/states, Record and new metadata | 1 then corrected 0 scopes | 7 files: 287 passed, one old exact region-name assertion failed for the added metadata section |
| Corrected Record files plus new RuntimeMetadata | 0 | 3 files, 27 passed; resolves that sole failure and includes all 10 new UI cases |
| `npm --prefix web run lint` | 0 | Full frontend lint |
| `npm --prefix web run format:check` | 0 | Full frontend format |
| `npm --prefix web run typecheck` | 0 | Full frontend types |
| `uv run --no-sync python tools/quality_gate.py` (default origin/main scope, own PYTHONPATH) | 0 | 0 findings, 37 changed Python files, 3,912 lines in scope, including inherited combined repairs |
| `git diff --check` | 0 | No whitespace error |

The first frontend lint found only three test-helper issues (unused mock input and
unnecessary default object stringification); the helper now accepts and pins the
actual same existing activity path. No runtime expectation was relaxed. The first
quality check found formatting/import ordering only; the final default gate is clean.

## Confidence and simplest design

The rejected simpler shortcuts were deriving success from Finished, deriving
retained origin from run mode, selecting the first successful-looking file, and
using a library publication before its admission predicate. Each would state a
fact unsupported by the recorded identity or current scope. The implementation
instead reuses the current plan, parser, explicit status rule and admission policy;
one bounded reader carries the shared byte/name budget. It transports only
metadata, retains the existing poll and tally, and leaves model/checker methods
and stored artifacts untouched. Explicit unknown values cover unavailable
historical records without a compatibility shim or new store.

Not verified: native browser/pixel rendering and the combined before/after fidelity capture; final complete frontend/Signal gates, connected proof, release packaging and Windows/work PC (lead stages 5–7); real issuer/provider execution, paid Submit, seat access or Teams (none attempted). Signal was not rerun in this metadata-only worker because no changed type/helper has a Signal caller; the lead's final full gate remains required. Metadata proves recorded accepted-response identity and current publication membership, not analytical correctness, actual paid execution or an admission timestamp. Historical named models and confidence-review/rewrite-tournament skills are unavailable; direct doubt tracing and simplification above were used.
