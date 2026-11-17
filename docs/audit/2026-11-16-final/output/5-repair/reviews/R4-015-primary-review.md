# R4-015 / T45 — independent primary review

**Verdict: PASS on `01a163aba07cb157f52e85d865d9d4f8a7b51e41`, based on `135d2d19`. High 0 / Medium 0 / Low 0 outstanding in this scope.** This accepts the isolated repair for the lead's integration review; it does not claim canonical native proof or final combined-tree completion.

Read AGENTS, current audit rulings R1–R17 and stage-5 process, current lead STATUS/RESUME, R4-015's canonical registration, all five changed product/test files and the committed report/probes. Also traced the unchanged actual adapter marker writer, `CallRecord` schema, bounded metadata reader, workflow/scheduler identity validator, activity HTTP route, API type and Record's actual callers. No product/test edit, push or merge was performed by this review.

## Cause and repair

The synthetic scheduler proof uses the actual CP-OS engine with a network-denied replacement adapter. `proof.launcher` writes both the returned model and request identity as exactly `synthetic`; its prepared workflow intentionally retains the nominal `live-provider` execution route. Returning that nominal field directly made settled Record metadata contradict the actual fourteen retained synthetic calls. The original native diagnostics show those calls and CP-1 status200; this was not missing call data.

The classifier now reads the bounded local call journal through the actual `model-call/1` schema. A synthetic override requires both exact adapter markers on **every** call, plus the existing workflow/identity binding to the scheduler issuer/date/pathway/config and a planned module. Mixed, incomplete, schema-invalid, linked or foreign-identity synthetic evidence produces null. A single marker cannot turn a run synthetic, and issuer `case_kind` is never consulted for execution. Ordinary provider identifiers on the same synthetic issuer data preserve `live-provider`; this control edits copied metadata and invokes no provider.

Absent/empty journals preserve the pre-existing nominal provider route for legacy/not-yet-started records; this is explicitly documented and tested, rather than being counted as actual provider-response evidence. Explicit host-session, retained-response-replay, synthetic and unknown manifest modes preserve their prior meanings. Status, checker stop, admission, accepted response hashes, call values, cap and timing fields are unchanged. The new helper reads only; it does not mutate calls/workflows, start an execution or add an analytical assessment.

Record still trusts settled API provenance. Its service-mode fallback now applies only while the API request is pending. Null/omitted provenance or a failed settled load shows Unavailable and neutral Recorded responses / Recorded status labels instead of claiming synthetic or live execution. Actual live/synthetic labels and exact values remain intact. The optional API execution contract is unchanged, so existing callers remain compatible.

The selected design reuses the existing safe reader, schema and identity authority. It is smaller than adding a new persisted mode or changing engine execution contracts, and avoids treating synthetic issuer data as evidence about which adapter ran. The own diff leaves engine, analytical method, confidence scorer, prompts, calculations, canned handoffs, Signal and Teams source untouched. No existing expected value, assertion, fixture or gate was weakened.

## Evidence and independent checks

Read test-first evidence in `docs/audit/2026-11-16-final/output/5-repair/probes/r4-015/`: `red.txt` fails the actual finished/listed scheduler-run test because its fourteen synthetic calls initially return `live-provider`; `frontend-unknown-red.txt` has the two null/omitted settled-provenance failures. Those failures were observed before repair and are not passing evidence.

Independent commands use `timeout 300`, `/workspace/audit-tooling/bin/uv` 0.12.5 with `--no-sync`, and explicit `PYTHONPATH=/workspace/audit-synthetic-classification/src:/workspace/audit-synthetic-classification/apps/issuer-library:/workspace/audit-synthetic-classification`. Existing shared dependencies were reused. Vitest used `--maxWorkers=1`.

| Independent check | Result and retained scratch output |
| --- | --- |
| `tests/test_react_runtime_identity.py` | Exit0, **41 passed**, including actual scheduler/engine export, actual loopback HTTP Record API, all marker/mixed/malformed/link/missing/stale identity controls, provider-identifiers-over-synthetic-issuer control, explicit modes and unchanged outcomes. `R4-015-primary-python.log`. |
| Record final-audit and ordinary Record caller suites | Exit0, **2 files /23 passed**. `R4-015-primary-web.log`. |
| Python quality gate against exact task base135d2d19 | Exit0, **zero findings**, three files /258 scoped lines. `R4-015-primary-quality.log`. |
| Changed Record frontend ESLint/Prettier | Exit0 each. `R4-015-primary-lint.log`, `R4-015-primary-format.log`. |
| Full frontend TypeScript check | Exit0. `R4-015-primary-types.log`. |
| Own diff whitespace and protected source paths | `git diff --check 135d2d19..01a163ab` exit0; src/proof/Signal protected-path diff empty; only existing dependency symlinks untracked. |

Read the retained `actual-scheduler-metadata.json` separately from test exit codes: original workflow execution remains live-provider; workflow/engine identity matches; all fourteen original calls have the exact two adapter markers. The real read-only loopback activity response is HTTP200/no-store with execution synthetic, finished status, fourteen accepted outputs, listed admission and unchanged USD25 cap. The independent runtime identity test reran this actual pipeline and checks the connected HTTP route, rather than constructing a desired manifest classification.

Worker evidence additionally records 195 Python tests, 55 frontend tests, default Python quality and full frontend lint/format/typecheck passes. These were read, not rerun as a broad suite by this reviewer. Original native diagnostics remain RED evidence; no native GREEN is inferred from the API or component tests. The lead's unchanged strict Adapter status and settled-synthetic canonical proof assertions remain the required integration check.

Named confidence-review/rewrite-tournament skills are unavailable in the catalog. Direct cause/adverse-case/caller and simplest-design review was performed under R7; no skill execution is claimed. No actual provider, paid run, seat check, real Submit, Teams or external application request occurred.

Not verified: native Chrome/Edge GREEN and canonical combined connected proof on the accepted integration pin, combined full gates/build/fidelity/Signal/knip/duplication, full weekly Python suite, work-PC behavior, or actual paid/provider/real Submit/Teams execution. Synthetic scheduler execution and mutated retained-metadata controls establish only the stated functional/provenance display scope, not real analytical or live-model success.
