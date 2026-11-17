# R4-015 / T45 — fresh adversarial execution-provenance review

**PASS at exact code `01a163aba07cb157f52e85d865d9d4f8a7b51e41`: 0 High / 0 Medium / 0 Low findings in scope.**

Reviewed `/workspace/audit-synthetic-classification`, branch `audit/lead-synthetic-classification`, against `135d2d19`. Read the full production/regression diff, repair report and retained actual-scheduler/API snapshot and RED logs; traced the actual proof adapter producer, `CallRecord` contract, bounded metadata reader/workflow identity authority, real Record API caller and settled UI path. Applicable AGENTS, audit R1–R17, stage 5 and lead checkpoints were already read during this continuous assignment. This reviewer did not implement the change or edit product/tests, push, merge, invoke a provider, use real Submit, check seats or call Teams.

## Authority and adverse boundaries

The defect and its authority are real: `proof.launcher` invokes the actual scheduler/CP-OS engine, denies outbound networking and substitutes a `Turn` whose reported model and request identity are both exactly `synthetic`. Its workflow still records the nominal `live-provider` engine route. The original actual-engine regression retained a finished/listed run with fourteen such call records and failed because the settled API returned that nominal route. The retained UI RED separately demonstrates both null and omitted settled execution being mislabelled from the service mode.

The repair reads existing local `live/calls.jsonl` through the established safe reader, bounds it to 4 MiB and 1,000 lines, and validates every nonblank record through the actual `CallRecord` schema. Any synthetic marker requires both exact markers on every call plus matching engine run ID, scheduler issuer, pathway, launcher config and planned module. The existing workflow validator independently binds issuer/name/date/pathway/config to the scheduler and requires the exact engine `identity.json` run pin. Malformed, mixed, linked or unbound candidate evidence returns unknown rather than claiming synthetic provenance.

Issuer `case_kind` is not consulted. Provider identifiers on copied artifacts from the synthetic issuer remain live-provider; synthetic adapter markers with a separately changed issuer-data kind remain synthetic. Neither counter-control invokes a provider. Explicit non-provider manifest modes and the documented missing/empty legacy journal behavior remain as before; a nominal provider route is not new evidence of model success. This narrow change alters no scheduler outcome, cap, charge, source hash, accepted-response hash, admission or engine execution behavior.

The actual API now supplies the corrected classification. `ReportRecord` retains the synthetic service-mode fallback only while the request is pending. A settled null/omitted value or read error has unavailable run type and neutral `Recorded responses` / `Recorded status` labels, preserving the recorded numeric call values. Explicit live-provider, synthetic, host-session and retained-response-replay values continue to win over service mode. No global relabelling or case-kind shortcut was introduced.

## Independent bounded checks

Commands used existing linked dependencies, timeout 300 or less, pinned `/workspace/audit-tooling/bin/uv` (verified 0.12.5), `--no-sync`, explicit `/workspace/audit-synthetic-classification/src:/workspace/audit-synthetic-classification/apps/issuer-library:/workspace/audit-synthetic-classification` PYTHONPATH and one Vitest worker.

| Check | Observed result / artifact |
| --- | --- |
| Actual engine/HTTP identity and runtime metadata regressions | 64 passed; `/workspace/scratch/R4-015-adversarial-python.log` |
| Actual Record + final-audit Record components | 2 files / 23 passed; `/workspace/scratch/R4-015-adversarial-web.log` |
| Six independent copied-actual-artifact counter-controls | 6 passed / 0 failed; `/workspace/scratch/R4-015-adversarial-probe.json` |
| Own-diff Python quality gate `--base 135d2d19` | 0 findings / 3 changed files / 258 scoped lines; `/workspace/scratch/R4-015-adversarial-quality.log` |
| Own-diff whitespace/protected source checks | Exit 0; engine/method/scorer/prompt/handoff/Signal source diff empty |

The Python run executes the actual network-denied scheduler once and copies its retained outputs for isolated mutations. It covers the settled HTTP route (200/no-store, fourteen consumed outputs), exact source hashes, mixed/model-only/request-only markers, malformed/non-object/schema records, linked journal, missing/forged workflow identity, foreign call identities, explicit modes, missing/empty journal and running/checker-stopped outcomes. The original failure is retained in the worker's `probes/r4-015/red.txt`; no existing expected value was changed.

The independent portable probe is `/workspace/scratch/R4-015-adversarial-probe.py`. Its source was the actual scheduler case from this review's run at `/tmp/pytest-of-agent/pytest-71/runtime-engine0/case`, copied into a fresh temporary directory for each of six controls. It independently checks fourteen original synthetic calls, CP-1 status 200, fourteen downstream accepted responses, unchanged finished status and nominal workflow route; then tests changed issuer-data kind, provider-over-synthetic control, a mixed seventh call, an extra schema field and a linked parent journal directory. Every classification matches the literal expectation. The linked-directory case also correctly makes existing spend metadata unknown; it does not crash the API.

The frontend command included a nonexistent optional `report/RuntimeMetadata.test.tsx` filter; only the two real Record files above are counted. The worker's broader 195-Python/55-frontend results and full frontend gates were read for scope, not represented as independent runs. The changed-code gate does not certify native UI rendering. No analytical model result or paid execution is claimed by this review.

Not verified: canonical Chrome/Edge connected-proof GREEN after integration, combined-tree full gates/fidelity, Windows/work-PC and weekly/full suite, real provider/paid/live execution, actual Submit, seats, Teams, or analytical correctness beyond the explicit synthetic scheduler/artifact/display scope.
