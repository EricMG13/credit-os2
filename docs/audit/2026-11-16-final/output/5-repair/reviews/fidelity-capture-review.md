# Independent fidelity-capture security and caller review

Frozen code: **`738433b801eac7a406208057b43e11fb4be0a48e`** in
`/workspace/audit-fidelity-alignment`, branch `audit/lead-fidelity-alignment`.
Comparison base: **`3e6bc4ee2fc8865fc320a178a92bf13b57a46c9f`**, the byte-for-byte
fidelity tool copy. HEAD matched the frozen code. The code change is confined
to `docs/audit/2026-11-16-final/output/5-repair/fidelity/capture.mjs`; the other
ten changed files are explicitly preliminary diagnostics.

Verdict: **CHANGES NEEDED — High 0 / Medium 2 / Low 0**. The lead has assigned
the two causes as **R4-017** and **R4-018**. R4-016 evidence-probe cleanup is
being reviewed separately and is not duplicated here. No capture, comparator,
selector, expected value, baseline, application or assertion was edited during
this review. No push, merge, paid/provider/live execution, real Submit, seat or
Teams action ran. No final AFTER capture or fidelity acceptance is claimed.

## Medium R4-017: unsupported proof dependencies execute before validation

`capture.mjs:52` dynamically imports the proof script under the selected
`REPO_ROOT` without first establishing that it is import-safe. An older proof
script registers/starts its own proof at top level. A later missing-export
check cannot undo that execution, and this candidate has no such explicit
check either: its first diagnostic is `createOfflineProxy is not a function`
at line 1225, after importing the old module.

The capture is intended to read another selected checkout through `REPO_ROOT`.
The current checkout has the reviewed import-safe proof, but selecting an older
checkout can execute its unguarded proof before this capture's denial proxy or
context guard exists. The dependency must fail clearly before executing an
unsupported proof module. Keep the existing reviewed import-safe source and
all capture behavior intact when making that preflight explicit.

Concrete safe reproduction is saved in
`/workspace/scratch/fidelity-capture-review-controls.mjs`. It creates a temporary
minimal repository and an old-style proof module with no guard exports and a
single sentinel top-level print. The actual frozen capture is launched with
that `REPO_ROOT`; no browser is launched. It prints
`REVIEW_OLD_PROOF_TOP_LEVEL_EXECUTED` before the undefined guard error. This
tests actual capture import ordering without running the historical unguarded
proof or issuing any network request.

## Medium R4-018: Node/API redirects fall outside the browser guard

`capture.mjs:926` obtains the paired fixture snapshot with global Node `fetch`
and default redirect following. That request is outside the launched browser,
its context request observer, WebSocket routing and its denial proxy. The
loopback check on the initial `FID_ATTACH` URL does not validate a redirect's
authority. A local endpoint redirect can therefore be followed without the
new guard recording or denying it. This is a gap in the added R8 harness guard,
not a claim that the current synthetic application emitted such a redirect.

The saved safe control extracts the exact frozen `pairedSnapshot` function and
invokes it against two local HTTP listeners. The first responds to the snapshot
request with a 302 to the second origin. The second receives the request and
returns a valid minimal snapshot, allowing the actual function to complete.
Both authorities are numeric 127.0.0.1; no browser, external resolver or outside
socket is involved. This independently confirms automatic cross-origin redirect
following through the Node path that the browser guard cannot cover.

The state API read at `capture.mjs:916` also retains default redirect following
and needs the same no-redirect caller coverage. Playwright inherits the proxy
but creates its API request agent for the initial URL; the installed version's
`coreBundle.js:25804` bypasses the proxy for initial loopback, and redirect
options at line 26012 reuse that agent. Do not treat the browser proxy as an
independent guarantee for this path. The reviewed proof script already uses
`maxRedirects: 0` on its explicit API reads. Stop these harness reads at the
initial response and fail clearly for redirects, preserving their intended
snapshot/run-state payload checks.

An extra API diagnostic attempted to force `example.invalid` to loopback with
a process-local `node:dns.lookup` override. That override did not intercept
Playwright's resolver: the redirected request returned `getaddrinfo ENOTFOUND
example.invalid`. Actual DNS packet status is **unknown**; no external HTTP
response was received. This is not relied on as the local reproduction and no
further DNS experiment ran. Its exact attempted source is retained as
`/workspace/scratch/fidelity-capture-review-attempted-api-control.txt` and its
limitation as `/workspace/scratch/fidelity-capture-review-dns-limitation.log`.
The portable `.mjs` control contains only the two sentinel/loopback cases and
does not repeat that attempted extension.

## Independent checks and preserved scope

| Check | Observed result |
| :--- | :--- |
| Actual capture dependency and exact pairedSnapshot controls | Exit 0; both causes reproduced locally; saved portable control above |
| `timeout 300 node .../fidelity/compare-selftest.mjs` | Exit 0; all 28 planted changes reported |
| `timeout 300 node --test web/scripts/connected-proof-network.test.mjs` | Exit 0; 3 passed, zero skips |
| `node --check .../fidelity/capture.mjs` | Exit 0 |
| Baseline SHA-256 manifest checked independently | 127 records: 126 unchanged; only capture.mjs changed |
| Comparator, comparator self-test and comparison JSON/Markdown checked against tool-copy commit | Exact bytes retained |
| `git diff --check 3e6bc4ee..738433b8` | Exit 0 |
| Actual capture with `FID_ATTACH=https://example.invalid`, `FID_RUN=review-no-run`, native Chrome and a new scratch output folder | Expected exit 1, `FID_ATTACH must be loopback`; no service/run submission; blank and application context counts both zero |

The last check is a negative attach-validation control, not a screen capture.
It produced `/workspace/scratch/fidelity-capture-review-attach/` with zero
context attempts in both JSON files; separate proxy counts were 10 for the
blank control and zero for the rejected attachment. Browser traffic was
guarded and proxy-denied before this validation control ran.

The candidate correctly installs the reused reviewed guard before every page,
blocks service workers, passes the local denial proxy at every browser launch
and keeps native proxy denials separate from context attempts. Browser popup
initial requests and WebSockets inherit that context guard. External initial
attachment addresses are rejected. The browser guard itself remains the
previously reviewed `f251fbc7` implementation and its independent unit tests pass.

The new explicit Python child path contains this checkout's `src`, issuer-library
app and repository root, protecting source selection from shared editable
installations. Synthetic child startup, the <=80-character root check, direct
`/start` flow, 15-second default page lookup, synthetic completion wait and
selected executed credit agreement remain. The command usage comment now says
`timeout 300`; no in-script budget, comparator gate, expected value or selector
was relaxed. The historical README's older command text is among the unchanged
baseline files and was not used as authority to extend the review timeout.

The implementation's retained native Overview-only diagnostic was independently
checked as preliminary older-source evidence: blank context attempts 0, capture
context attempts 0, native proxy denials 10 and 44 respectively. It did not
exercise the paired fixture Node fetch and cannot establish that all capture
network paths are guarded. It is not an AFTER capture or final source proof.

Not verified: repaired R4-017/R4-018 code or integration; final source after
R4-015 repair and proof-export integration; complete connected/static AFTER
capture, final comparison/diff and presentation fidelity acceptance; independent
full build/frontend/Python/weekly/Windows/package gates; actual DNS packet
status for the disclosed failed reserved-host diagnostic; providers, paid/live
execution, real Submit, seats, Teams and any real external application service.
