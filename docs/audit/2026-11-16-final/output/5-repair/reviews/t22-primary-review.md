# T22 — independent primary review

**Verdict: CHANGES NEEDED on code `12e53e2179095600a0fa3e19a88f9b322211c937`.** One confirmed Medium, R4-013 already registered/assigned by the lead and merged into C5-003. No additional High or Medium found. Reports-only `4b948312` changes no product code and was read with git-show. Round-2 repair is pending; no final repaired verdict is claimed here.

Read the complete seven-file diff against eaf0a879, AGENTS/current audit rulings/stage5, T22 and original/merged C5-003/J4-005/J3-015 records/probes, the unchanged confidence scorer and both real parsers, actual MetricGrid/ModuleConfidence/Modules callers, new regressions and committed T22 report. C5-007/J5-002 are withdrawn under R14. The card's separate out-of-100 batch is lead-owned; the reviewed drawer states the scale. Forecast/Signal/method/math/prompts/handoffs remain unchanged.

## Medium — R4-013: fallback drops the confidence qualification

An earlier unrelated malformed two-column table makes `credit_os.source.structured(raw, False)` retain an Unstructured handoff. The valid 14 Confidence inputs rows still score 89/High through the unchanged authority parser and populate confidenceTrace. But ReportContent.traceForConfidence's no-section fallback sets qualification:null and constructs only accepted rows/method; it does not retain the exact confidence-scope prose. This loses the qualification “Counts cover FY2025 audited standalone evidence only; overseas subsidiaries are excluded.” The original handoff/hash token survives, so this is qualified analysis omitted rather than a wrong score.

Independent reproduction on the pinned code used the actual store/source helper with this checkout's explicit src/apps import paths, then the portable Vite SSR trace probe. Artifacts: `/workspace/scratch/t22-primary-fixture-before.py`, `t22-primary-fixture-before.json`, `t22-primary-fixture-before.log`, `t22-primary-fallback-before.json/.log`. The observed JSON has parseError “Malformed table at line 7”, score 89/High, traceQualification null and qualificationRetained false. A separate positive assertion verifies those exact observations. Shared portable probe source: `/workspace/scratch/t22-adversarial-probe.mjs`; CLI fixture is `/workspace/scratch/t22-adversarial-fixture.py`. This reproduces the known Medium without changing either parser/scorer or invoking providers. Lead has assigned its repair; no additional implementation requested by this review.

## What the current code does correctly

- Store projects accepted raw input strings/order with the existing authority parser after one existing score call. The original confidence value/band object remains exact; no second score, formula or rounding computation is introduced. Leading 0008, zero, absent, missing and blocked states are covered.
- Formula, lineage weights, source gates, penalties, caps, half-even rounding and bands match the unchanged scorer. Values for weights/gates/penalties come from its existing constants. No analytical method was altered.
- Structured and split Confidence sections show accepted rows/method even with generated no-page chips. The precise placeholder filter retains real identity, quoted source, reason, href/pageHref and qualification content. Later blocks' citations/prose are gathered. The known fallback defect above is the remaining gap.
- MetricGrid's optional trace preserves existing line-based callers. Its trace key derives from the same original evidence token; module foundation metric callers remain supported. The source control also exists when accepted rows have no generic Markdown table.
- Generic-parser mismatch coverage is real: no separator yields text, and prose/blank splits stop the generic first table while the authority parser accepts all rows. The implementation changes neither parser.

## Independent checks on code12e53e21

Every command bounded by timeout300; Vitest maxWorkers1; existing linked dependencies, no installs. Python imports explicitly target `/workspace/recovery-t22/src:/workspace/recovery-t22/apps/issuer-library`.

| Check | Observed result |
| --- | --- |
| Projection and unchanged authority/oracle tests | Exit0, 85 passed. `t22-primary-python.log`. |
| Existing store confidence integration cases | Exit0, 5 passed /263 deliberately deselected by `-k confidence`. `t22-primary-store.log`. |
| Recovery + ReportContent.records | Exit0, 2 files/27 tests. `t22-primary-web.log`. Requested nonexistent generic test filenames were not counted. |
| ReportContent codes/drawings/findings + Modules caller | Exit0, 4 files/47 tests. `t22-primary-callers.log`. |
| Python quality gate against task base eaf0a879 | Exit0, zero findings, 2 changed files/162 scoped lines. Pinned uv0.12.5 --no-sync. `t22-primary-quality.log`. |
| Changed frontend ESLint/Prettier, full typecheck/build, diff whitespace | All exit0. `t22-primary-lint.log`, `t22-primary-format.log`, `t22-primary-typecheck.log`, `t22-primary-build.log`; existing build-size advisory remains. |
| Native actual synthetic source/drawer | Exit0 on Chrome157.0.8103.78, synthetic run20261117-184014-01. Exact14 accepted rows and eight method nodes; published89/High; no repeated placeholder reason; exact original output/hash/line161 Evidence href; zero external hosts/page errors. `t22-primary-native-final.log`, `t22-primary-native.json`, `t22-primary-native.cjs`. |

The first native attempt used the retained C4 helper's hardcoded PYTHONPATH=src and thus imported the shared environment's older credit_os package, so it found no confidenceTrace. This is retained in `t22-primary-native.log` and is not product acceptance evidence. A scratch-only adapter sets the synthetic child to this checkout's absolute src/apps paths; the correctly scoped rerun above passes. No retained probe or product code was edited. The initial fixture adapter also wrote its CLI-default scratch data to the checkout; that exact generated untracked file was moved into scratch immediately, leaving no product change.

Implementation evidence at4b948312 additionally records 353 Python tests,762 frontend/Signal tests, default quality gate, gates and28 Chrome/Edge drawers, plus original C5 output and J4's documented NOT REPRODUCED exit1. These are implementation evidence; this reviewer did not rerun unrelated broad suites or treat an output probe's exit alone as acceptance.

Not verified: the pending R4-013 round-2 repair/final verdict, combined final-T18/lead-batch integration and gates/fidelity, Windows/Edge independently, broad/full or independent final Signal/knip/duplication/default-base Python gates, live/paid/provider/seat/real Submit/Teams execution, or real retained analytical correctness beyond the explicitly synthetic presentation/source scopes above. No code/test edits, push or merge performed.
