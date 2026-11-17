# Final combined guard and proof-harness review

Reviewed exact stable code **`8f4ba2502c89cc1fcfbcc18bc1f086df97cf0440`**, branch
`audit/lead-proof-local-consequences`, worktree
`/workspace/audit-fidelity-guard-return`, against
`738433b801eac7a406208057b43e11fb4be0a48e`.
The worktree HEAD was the later report-only commit
`5959769efd082ce2d1da6fd9cbc12aaaaa621ec5`; every reviewed code/test file was
independently checked byte-for-byte against the frozen 8f pin. The report-only
delta contains no implementation change.

Verdict: **PASS — High 0 / Medium 0 / Low 0** for the reviewed combined return.
Both previously confirmed Medium causes, R4-017 and R4-018, are repaired.
R4-019's narrow native-icon classification and the approved compact-card proof
consequence are accepted. R4-016 is owned by a separate review and is not
duplicated here. This is harness acceptance, not a full native proof or final
fidelity-capture acceptance.

Read the complete code/test diff, guard-return and local-consequence reports,
their retained RED/native evidence, actual helper callers and packager,
`react_frontend/library_cards.py`, `_library_index`, its source-identity tests,
the approved shell-card report and T15's library-card handoff. Audit rules and
AGENTS were read during the preceding review and remain applicable. No source,
test, selector, baseline, comparator or expectation was edited in this review.
No push or merge ran.

## Previously confirmed causes

**R4-017 — fixed.** Capture now imports only pure
`REPO_ROOT/web/scripts/offline-network.mjs` (`capture.mjs:52`). That file imports
only Node assert and HTTP primitives and has no top-level proof registration,
browser launch, local listener or application execution. An old root without
the module fails with its missing-module path before importing or running the
old proof. The actual capture sentinel control verifies this, rather than
merely checking source text. FID_ATTACH validation now occurs before either
browser launch, and its launch-stub negative control passes.

All helper consumers resolve the pure module: connected proof, original guard
unit tests, fidelity capture and the optional retained browser probe. Moving
the helpers does not remove a used export from an active caller. The proxy and
context-guard function bodies are independently byte-identical to the reviewed
predecessor. The classifier retains its previous behavior except for R4-019.

**R4-018 — fixed.** The state API read validates its initial URL, specifies
`maxRedirects: 0`, requires HTTP status 200 and then checks the retained finished
run payload (`capture.mjs:919`). The paired fixture validates its initial URL,
uses Node `redirect: "error"`, and requires status 200 before JSON
(`capture.mjs:933`). The exact extracted actual functions were exercised with
two numeric 127.0.0.1 listeners: direct 200 succeeds; each of 301, 302, 303, 307
and 308 rejects and never visits the redirect receiver; 500 rejects. Both
initial-URL controls reject before the request function is invoked.

These controls use local listeners and request/launch stubs only. No DNS
override, reserved-host resolution experiment, external browser/API/Node
request or full capture was performed in this final review. Raw remote target
strings in the original proxy test are sent only to the local denial proxy,
which has no forwarding or upstream resolver code.

## Native icon and compact-card consequences

**R4-019 — accepted.** The observed Edge image address invokes its internal
`fileicon` service for the downloaded local artifact; the retained native log
distinguishes it from outside-host traffic. The new classifier clause
(`offline-network.mjs:7`) admits only chrome:/edge: at host `fileicon`, path `/`,
one `path` parameter and an absolute local POSIX or drive-letter path. It
rejects credentials, ports, fragments, unknown services/paths, extra parameters,
UNC/relative/remote paths and encoded path control characters. All other
protocol and authority handling, proxy behavior, context request recording,
WebSocket handling, zero-attempt assertion and service-worker blocking remain.
It does not admit either browser protocol generally.

The four consequence tests cover the observed URL plus parser boundaries and
exact compact provenance. An additional independent parser-only check rejected
12 authority, UNC, mixed-separator, encoded-control and extra-query examples.
No parser case issued a request.

**Compact lead — authorized and stronger than merely adding a key.** The
approved source-card addition is documented under **C1-008** in
`batch-connected-shell.md`, together with C3-001/J4-001's library-card trace
handoff; **C1-025** supplies the compact-payload context. This is the fuller
authorization map behind the C1-025/C3-001 shorthand in the new proof comment.
The retained actual-native failure shows the old outer-key list rejecting the
already-approved `lead` field.

The new assertion adds only `lead` to the exact outer key list, preserves the
workspace/catalogue checks and then requires exactly five nested fields:
`module`, `output`, `sha256`, `line`, `text`. It checks the selected CP-6 output's
id, run key, module and SHA-256 identity against the run-scoped publication,
checks the paragraph's source line and exact text, independently pins the
unchanged synthetic sentence and requires a positive integer line. The measured
synthetic serialized-size bound is an additional proof compactness assertion;
it introduces no product truncation rule. Thirteen public-key/provenance/text
mutations are rejected by the exact extracted function tests.

All original monetary/numeric, source-identity, handoff download/hash, caller,
paid-dialog interception, submission-count and timeout assertions remain.
The exact settled `execution === "synthetic"`, `Synthetic test`, `Adapter
status` and `200` checks remain. Source commit/optional ZIP provenance checks
are unchanged. No original test was skipped or weakened to obtain these passes.

## Independent checks

All long commands used `timeout 300`; no native proof or fidelity capture ran.

| Check | Result |
| :--- | :--- |
| Five guard-return tests + four consequence tests + three original guard tests | Exit 0; 12 passed, no skips |
| Original `npm --prefix web run test:scripts` | Exit 0; 73 passed, no skips, about 70 seconds |
| Comparator self-test | Exit 0; all 28 planted changes reported |
| Baseline manifest independently verified | All 126 non-capture comparator/baseline files retain exact SHA-256 |
| Reviewed current code/tests versus frozen 8f pin | Exact bytes for all six reviewed files |
| Proxy/context-guard bodies versus reviewed predecessor | Byte-identical |
| Extra icon parser boundaries | 12 rejected, no request issued |
| ESLint on changed web scripts and both audit tests, with explicit `web/eslint.config.mjs` | Exit 0 |
| Prettier on changed web scripts | Exit 0 |
| Changed code/test whitespace check | Exit 0 |
| Exact 8f actual packager `SOURCE_PATHS` git archive and `validate_source` | Exit 0; helper and both packaged callers included with exact bytes |

The exact-pin source archive contained 1,514 entries. New helper SHA-256 was
`417557253458f8da5f4deb07aab5a50b90f2910bc776ab3706be196b706d492e`.
This exercised real source selection and validation without installing
packages, building a release, launching a browser or creating a release bundle.
Audit-only controls remain outside the packaged web script test suite.

Initial lint invocations had an incorrect config scope/path; they did not
verify the audit tests. The explicit-config rerun above covers the scripts and
both audit tests and passed. Aggregate `git diff --check` still reports whitespace
and terminal blank lines in retained raw diagnostic logs; the code/test-scoped
check passes. Raw evidence was not rewritten to hide those warnings.

The existing synthetic workflow still selects the executed credit agreement,
uses its bounded root and unchanged page/run waits, and supplies the selected
checkout's src/app/repository through explicit PYTHONPATH. Blank/native proxy
denials and application/context attempts remain separate diagnostics. All
capture comparison content and immutable before evidence are unchanged.

Not verified: native Chrome/Edge full proof or final connected/static AFTER
capture on the accepted integrated source; final capture comparison/fidelity
acceptance and lead second read; R4-016's separately owned cleanup; independent
full frontend/typecheck/build/Python/weekly/Windows gates or release execution;
actual providers, paid/live execution, real Submit, seats and Teams. This review
made no outside-network or DNS experiment.
