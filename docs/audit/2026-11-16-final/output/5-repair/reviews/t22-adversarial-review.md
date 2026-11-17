# T22 — second adversarial source/figure review

Initial verdict: **one Medium finding, R4-013, merged into C5-003; no High finding.** Final acceptance is pending the isolated round-2 fix and independent rereview.

Reviewed code pin `12e53e2179095600a0fa3e19a88f9b322211c937` in `/workspace/recovery-t22`, based on `eaf0a879`. Read all seven changed files, AGENTS, stage-5/T22 and canonical C5-003/J4-005/J3-015 records, and the committed worker report at documentation-only `4b948312`. Standing audit rulings R1–R17 and lead decisions L1–L18 remain as read for the prior review. No production/test file, protected source, prompt, calculation, handoff, Forecast or Signal file was edited by this review.

## Finding

**Medium / R4-013 — the new unstructured-handoff confidence fallback discards the score's qualification.** `ReportContent.tsx:296–321` builds an input/method-only trace when the general handoff parser exposes no Confidence inputs section. That branch sets `qualification: null`, `excerpt: null` and supplies no source links, without reading retained raw text or its source chips. An unrelated malformed supporting table earlier in the same handoff can make `source.structured(..., False)` return one Unstructured handoff while `confidence.from_handoff()` correctly accepts the later confidence inputs. The retained confidence passage says: `Counts cover FY2025 audited standalone evidence only; overseas subsidiaries are excluded.` The score remains `89 / High`, and the drawer now opens with all fourteen accepted rows and the method, but that exact scope/exclusion disappears. This is a lost qualification in a reachable new presentation path; it does not require changing either parser or the scoring algorithm.

Actual backend/source repro: `/workspace/scratch/t22-adversarial-fixture.py` constructs the raw synthetic handoff, uses the current `store.confidence_fields()` and `source.structured()` and records the actual SHA-256 of those bytes. Result `/workspace/scratch/t22-adversarial-fixture.json` has `parseError = Malformed table at line 7`, a valid `89 / High` projection, and original qualification in the retained raw block. `/workspace/scratch/t22-adversarial-probe.json` shows `traceQualification: null` and `qualificationRetained: false`.

Portable checkout-root probe: `/workspace/scratch/t22-adversarial-portable.mjs <fixture.json> <result.json> [native-browser-path]`. It resolves existing Vite/React/Playwright from that checkout's `web/package.json`; optional native rendering bundles only the local components with existing esbuild. Generate the fixture with the Python script using that checkout's explicit PYTHONPATH and the pinned uv. No workflow engine/provider/real Submit is used.

Native Chrome **157.0.8103.78** independently confirms the actual ModuleConfidence drawer loses the qualification: `/workspace/scratch/t22-adversarial-before-chrome.json`, **6 passed / 2 failed**, error=null, zero external hosts/page errors. Both failed checks are the same qualification loss at the trace object and actual drawer. All fourteen accepted input strings, leading `0008`, explicit zero rows, published score/band, method and exact output-hash Evidence target remain correct. Root registered R4-013 and assigned a fresh isolated round-2 implementer; exact repro files were sent directly.

## Preservation and method read

- The new projection uses `confidence.inputs()` from the same raw bytes as `from_handoff()`. It does not introduce another score formula or call the score twice. The projection test's spy confirms one score call. Raw accepted order, leading zeros and explicit zero strings stay strings.
- Method text matches the unchanged actual scorer: lineage weights 1.0/0.9/0.5/0.4/0.3/0/0/0; evidence quality over all claim counts with zero for no claims; 60/40 evidence/coverage; gate factors 1.0/0.7/0; penalties 40/15/3 per finding; clamp before critical/material caps 39/59; half-to-even rounding; bands after the rounded score at 80/60/40/0. No new analytical method was found.
- Structured confidence traces always show accepted input rows despite placeholder chips, retain later split-section prose/citations, and filter only the exact producer-shaped empty no-page placeholder. Real source identity, excerpt and reason are covered by the focused regression. Non-confidence traces retain their previous branch and no placeholder filtering is added to them.
- `MetricGrid` adds an optional prebuilt trace while keeping the existing line-based path for Overview and module metrics. Its new key remains the output/hash/line evidence target. Confidence zero stays `0`; refused/missing scores retain the backend's reason, and absent legacy scores stay absent.
- The accepted no-separator and prose-split cases use authoritative scored rows rather than a competing JavaScript parser. The lost-qualification finding above is specifically the fallback after a whole-document generic parse failure.

## Independent checks

- Backend: `PYTHONPATH=/workspace/recovery-t22/src:/workspace/recovery-t22/apps/issuer-library:/workspace/recovery-t22 timeout 300 /workspace/audit-tooling/bin/uv run --no-sync python -m pytest tests/test_confidence_trace_projection.py tests/test_confidence.py -q`: **85 passed**. Includes the existing archived-script oracle/caps/clamps/rounding/refusal boundaries and the new projection cases.
- Frontend: `timeout 300 node_modules/.bin/vitest run --maxWorkers=1` for Confidence.recovery and ReportContent codes/findings/records: **4 files / 34 tests passed**.
- Portable source-only/native repro: **6 passed / 2 failed**, both failures retained as R4-013 evidence rather than hidden by the passing suite.
- `git diff --check eaf0a879..12e53e21`: passed. Protected source-path diff is empty, including `src/deploy_workflow/confidence.py`, analytical owners/prompts, proof handoffs, Forecast and Signal. Existing test expectations were not edited in this seven-file change.

Not verified: the pending R4-013 round-2 patch/final pin; final combined T18/T22/lead-batch gates/fidelity; full end-to-end retained-source workflows beyond these explicit synthetic fixtures; Windows/work-PC behavior; live/paid providers, seat checks, real Submit or Teams. No production/test changes, push, merge or subagent work was performed by this review.
