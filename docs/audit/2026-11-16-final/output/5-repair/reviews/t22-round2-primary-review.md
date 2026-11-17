# T22 round 2 — independent primary review

**Verdict: PASS on code `5b5610fe390e848086c5c2b16a501707c7de919b`. High 0 / Medium 0 / Low 0 outstanding in the reviewed scope.** R4-013's lost confidence qualification and recovered source-chip path are repaired. Documentation-only tip `4726ebd0543b6a3c975b0f2d4398b5d97940be11` was read; its product/test diff after the code pin is empty. This report does not promote or merge the branch.

Read `AGENTS.md`, audit README rulings R1–R17, stage 5, `docs/QUALITY-GATE.md`, lead STATUS/RESUME, T22 and canonical C5-003/J4-005/J3-015/R4-013 records, the original probes, both initial independent reviews, all eight round-2 code/test diffs from initial code `12e53e21`, and the final worker report/evidence. C5-007/J5-002 remain withdrawn under R14. The original card-scale batch remains lead-owned.

## Cause, fix and caller review

The generic Markdown parser may refuse an earlier malformed table while the unchanged confidence authority still accepts the later fourteen inputs and publishes 89/High. The recovered projection now copies only the accepted section's non-fenced, non-table source prose and original line locators, using the scorer's existing `_lines` heading/fence rules. Its accepted strings/order and the published confidence object remain unchanged. The section selector is called only after successful authority scoring; it introduces no second score calculation or independent input parser.

The no-section frontend branch now feeds that optional section into existing `buildTrace`, retaining the qualification and existing citation/excerpt/source-link/Evidence-token behavior. When a normal structured Confidence inputs section exists, existing handling remains in use. Older outputs without the optional field remain supported. The initial input/method-only fallback still covers a section with no source prose. The optional MetricGrid trace and existing line-based module/overview callers remain compatible.

Read both actual chip callers: `credit_os_chips.chips` and `react_frontend.sources.enrich` → `_refresh`. The latter deletes and rebuilds admitted outputs' chips against verified originals, so fixing only initial chip generation would have been insufficient. Both now include the same isolated projected section only when an exact Confidence inputs section is absent. The bridge continues to verify supplied filename, workflow hash pin, actual original bytes, page bounds and inventory aliases before attaching native links; no validation was weakened. Earlier malformed-table citations, fenced examples and next-section prose are excluded from the confidence trace.

The authority scorer, formula, float operation order, weights, gate factors, penalties, clamp/caps, half-even rounding and bands are unchanged. Missing, blocked, absent and zero remain distinct; leading `0008` and explicit zeros stay strings in accepted row order. No method, calculation, prompt, proof handoff, analytical owner, Forecast or Signal source change occurs in the round-2 diff. Existing test expectations and gates were not edited or weakened. The small recovered projection and reuse of current trace/chip loops are simpler than another parser or drawing the whole Unstructured handoff.

## Test-first and independent verification

Read retained RED evidence: `red-python.txt` has two missing-section failures with six previous passes; `red-web.txt` has the missing exact qualification with five previous passes; `red-bridge.txt` fails because the real verified-original refresh removes the recovered line's chip. Before-native evidence records six passes/two qualification failures. These are real failures at the identified causes, not final passing evidence.

Independent commands used `timeout 300`, `/workspace/audit-tooling/bin/uv` **0.12.5**, `--no-sync`, and explicit `PYTHONPATH=/workspace/recovery-t22-round2/src:/workspace/recovery-t22-round2/apps/issuer-library:/workspace/recovery-t22-round2`. Existing shared dependencies were reused; Vitest uses `--maxWorkers=1`.

| Independent check | Observed result / scratch artifact |
| --- | --- |
| Projection + unchanged confidence/archive oracle + actual React source bridge | Exit 0, **116 passed**. `t22-round2-primary-python.log`. |
| Confidence recovery + ReportContent.records + Modules callers | Exit 0, **3 files / 61 passed**. `t22-round2-primary-web.log`. |
| Scoped Python quality gate against initial code `12e53e21` | Exit 0, no findings, six files /417 scoped lines including the owned fixture. `t22-round2-primary-quality.log`. |
| Default Python quality gate against `origin/main` | Exit 0, no findings, 15 files /865 scoped lines. `t22-round2-primary-default-quality.log`. |
| Changed frontend ESLint/Prettier; full TypeScript check | All exit 0. `t22-round2-primary-lint.log`, `-format.log`, `-types.log`. |
| Actual store/chips/verified-original enrichment fixture | Exit 0. `t22-round2-primary-source-fixture.json`, `-fixture.log`. |
| Independent quoted-source variant through that actual backend pipeline | Exit 0; exact filename/hash, verified original, line12/end13, page7, quoted text, excerpt and native/page links asserted. `t22-round2-primary-quoted-fixture.py`, `.json`, `-final.log`. |
| Native Chrome **157.0.8103.78** with unchanged portable probe | Exit 0, **8/8**, zero external hosts/page errors. `t22-round2-primary-native.json`, `.log`. |
| Independent assertions over native/trace output | Exit 0, **8/8**: exact qualification, no unrelated prose, exact 14 rows/order/raw strings, one input group/one eight-node method, published89/High once, exact original output hash/line12 Evidence href, exact source hash/file/page links and quote/excerpt. `t22-round2-primary-native-checks.py`, `.json`, `.log`. |
| Product/test pin and whitespace | Product/test diff from5b5610fe to4726ebd0 empty; `git diff --check 4b948312..5b5610fe` exit0. Only existing dependency symlinks untracked. |

The quoted-source variant uses the inventory's existing supported `K, page 7. “…”` syntax. Two scratch setup variants instead appended a quote to the strict `Basis:` grammar or used an unkeyed filename as prose; they returned explicit existing gap chips and failed the scratch expectation. Their logs `t22-round2-primary-quoted-fixture.log` and `-green.log` are not acceptance evidence. Inspection traced both to unchanged scanner rules; the supported keyed variant above passes without any product/test changes.

The worker's separately retained 501 Python, 771 frontend/Signal tests and Chrome/Edge evidence were read and agree with the scoped results; this reviewer did not rerun those broader suites. Original C5/J4 probes were read, not rerun on round2; the historical J4 probe's exit1 means its defect is NOT REPRODUCED and is not counted as a new passing command here. The new actual-parser/native/caller evidence directly exercises this round's loss. Named confidence-review/rewrite-tournament skills are absent from the available catalog; direct cause, adversarial and simpler-design review was performed under R7 without claiming those skills ran.

All review-created files are under `/workspace/scratch`; no product/test edit, push, merge, provider call, live run, seat check, real Submit, Teams call or external application request was made.

Not verified: combined final-T18/T22/lead-batch integration, final fidelity/full frontend gates/build/connected-service proof, original task probes rerun on round2, full/weekly Python suite, independent final Signal/knip/duplication or Edge/Windows/work-PC runs, real retained analytical correctness beyond these explicitly synthetic source/presentation cases, live/paid/provider/seat/real Submit/Teams execution, or unavailable named skills.
