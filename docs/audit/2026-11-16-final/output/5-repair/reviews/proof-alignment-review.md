# Independent proof-harness security and caller review

Reviewed frozen code `f251fbc79f418e7e06c652fd016d065490588c7f` on
`audit/lead-proof-alignment` in `/workspace/audit-proof-alignment`, against base
`ff93a15080c4b475e1a05ea2c25b94571d809f2a`. HEAD was verified equal to the frozen
pin. The code diff contains only `web/scripts/connected-proof.mjs` and
`web/scripts/connected-proof-network.test.mjs`. No product, test, probe or
assertion was edited during this review; no push or merge ran.

Verdict: **PASS for the frozen two-file harness change**. Code findings:
**High 0 / Medium 0 / Low 0**. One **Low**, nonblocking finding concerns the
separate retained browser-evidence probe, below. This does not certify a green
connected journey: the pinned product's R4-015 synthetic classification failure
remains a valid blocker, and the harness must continue failing until the product
repair is integrated.

Read `/workspace/credit-os2/AGENTS.md`, audit README R1–R17 and Rules,
`stages/5-repair.md`, current lead STATUS/RESUME, the complete two-file diff,
the implementation report and the relevant owner/finding records. Scope was
security, callers, retained assertions and finding-authorized expectation changes.

## Findings

**Low — the retained negative browser probe leaks its local listeners if browser
launch fails.**

File: `docs/audit/2026-11-16-final/output/5-repair/proof-alignment-evidence/network-guard-browser.mjs:51`.
The probe starts its local HTTP server and denial proxy at lines 51–52, then
awaits `chromium.launch` at line 53, before entering the cleanup `try` at line 59.
An absent browser executable fails the test but leaves those listeners alive;
the process waits until an external timeout. This affects evidence-tool usability
on a machine without the default native channel. The actual harness places
service/proxy/browser startup inside its cleanup scope (lines 1592–1641), so
this is not a defect in the frozen code files or an offline escape.

Concrete, entirely local reproduction (existing saved probe; no browser starts):

```sh
CHROME_PATH=/definitely-not-an-installed-browser timeout 5 node --test docs/audit/2026-11-16-final/output/5-repair/proof-alignment-evidence/network-guard-browser.mjs
```

Observed: browser launch failed after 22.9 ms with `executable doesn't exist`,
but the command ended only at the five-second timeout, exit **124**, with one
test cancelled. This matches the initial default-channel invocation after the
environment restart; only that invocation's three PIDs were terminated. Put
startup under the probe's `try/finally` and close whichever local resources were
created. No change to the frozen harness is requested for this Low.

## Independent verification

All commands ran from `/workspace/audit-proof-alignment` with a bounded timeout.

| Check | Result |
| :--- | :--- |
| `timeout 300 node --test web/scripts/connected-proof-network.test.mjs` | Exit 0; 3 passed, 0 skipped |
| Retained negative browser probe with `CHROME_PATH=/workspace/audit-browsers/chrome/opt/google/chrome/chrome` | Exit 0; 2 passed, 0 skipped |
| Same probe with `CHROME_PATH=/workspace/audit-browsers/edge/opt/microsoft/msedge/msedge` | Exit 0; 2 passed, 0 skipped |
| Additional independent URL-authority assertions using the exported actual classifier | Exit 0; 15/15 passed |
| `git diff --check` for both code files, base to pin | Exit 0 |

The additional authority cases include userinfo in both directions, misleading
localhost suffixes, encoded host separators, canonical integer/hex/octal/short
IPv4 loopback representations, IPv4-mapped IPv6 denied conservatively, local
versus remote file shares, local versus remote blob origins, and browser URL
backslash normalization. These are parser-only tests and make no request.

The browser negative probes run with the local denial proxy installed at launch,
before any page exists. Each verifies exactly four context attempts: fetch,
redirect, initial popup navigation and WebSocket; the zero-attempt assertion is
required to fail. Each also requires `example.invalid:443` CONNECT to be denied
at that proxy, so unrelated native browser background denials cannot satisfy
the redirect check. The proxy has no upstream/DNS/forwarding code, binds only
127.0.0.1, and returns 403 for ordinary HTTP and CONNECT. The three portable unit
tests meaningfully exercise authority classification, guard abort/continuation
and real local HTTP/CONNECT denial, rather than only mocking a final pass.

## Security and caller conclusions

- Every proof page now uses one guarded context. The guard is installed before
  its first page, covers popup initial requests and WebSockets, and the context
  blocks service workers. The browser-level denial proxy backstops redirects
  that Playwright routing does not intercept. No external host is allowlisted.
- Mock response routes are limited to the actual synthetic origin. Explicit
  `page.request.get` calls and the HTML `route.fetch` use `maxRedirects: 0`;
  their initial URLs are constructed from the local service. Their callers do
  not gain an external redirect path. The paid-dialog preview still aborts
  submit requests and cancels; actual execution remains `proof.serve`.
- Main-harness teardown closes context, browser and proxy, then stops the local
  service and removes its temporary workspace. The offline assertion follows
  the retained proof failure and aggregates a second guard failure. Neither a
  product failure nor an external attempt can produce a success record.
- Independently parsed frozen retained evidence reports context attempts **0/0**
  for Chrome/Edge, with native proxy denials **119/154**. Their blank controls
  independently report context attempts **0/0** and proxy denials **7/8**.
  Those counters are kept separate; the report does not claim native browser
  denials are application attempts. The earlier route-only redirect/DNS
  uncertainty remains explicitly disclosed and is not counted as verified.
- The original exact `Synthetic test`, `Adapter status` and `200` checks remain.
  The new awaited activity response adds `execution === "synthetic"` before
  checking UI metadata. The retained frozen RED log shows both native browsers
  failing with actual `live-provider`, expected `synthetic`; this prevents the
  previous transient service-mode fallback from making a wrong run type pass.

## Expectation and provenance alignment

Every changed expectation maps to an explicit approved finding: C1-002/T05
(footer Start), S6-037 (activity heading), J3-016 (stress label and percentages),
C4-036 (authored unranked B1/B2/B3 order), C4-013 (US$m unit), C4-020 (period
lines), J3-019 (highlight label), T18 C4-003/C5-004 (model row source control),
J3-017 (History label), C5-011/OQ-04/R10 (listed-only supplied sources), C5-014
(script-check heading) and C5-028/R4 (settled run classification).

The meaningful change to source-opening coverage is explicitly authorized by
C5-011/OQ-04. It is replaced with all three original filenames, independently
computed SHA-256 values from the uploaded bytes, no per-row links, no named
source-open link and no `/connected/sources/` link. Original handoff download,
downloaded bytes and designated-output hash checks are unchanged. Source commit
and optional ZIP SHA-256 validation/provenance, module source-identity assertions,
exact signed amounts and the independent `1,050`/`315`/`252` model arithmetic
remain. The refinancing change independently pins the supplied `300`, two
maturity points, one committed-resource point and the exact missing reason;
no missing value is accepted as zero. Both break-point bases retain B1/B2/B3
order, all supplied percentages and the unchanged missing-net-debt reason.

The original timeout budgets, per-browser cases, synthetic submission count,
caller flow, module counts, cap/spend checks, download/hash checks, paired Changes
fixture and final library checks remain. No numeric threshold, source identity,
skip, retry or gate was relaxed. Later assertions are retained but are not yet
runtime-proven after the known Record failure.

Not verified: the complete connected journey after the known R4-015 product
failure (later Record, script checks, download/hash, paired Changes and final
library assertions); independent rerun of full frontend/Python/weekly/Windows,
packaging/ZIP or original finding probes; actual provider/paid/live execution,
real Submit, seats, Teams or any application traffic to an outside host. No
such action was performed in this review.
