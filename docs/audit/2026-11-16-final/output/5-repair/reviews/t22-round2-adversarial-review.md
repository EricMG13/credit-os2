# T22 round 2 — independent second adversarial review

**PASS at code `5b5610fe390e848086c5c2b16a501707c7de919b`: 0 High / 0 Medium / 0 Low findings in the reviewed round-2 scope. R4-013 is resolved.**

Reviewed `/workspace/recovery-t22-round2`, branch `audit/recovery-t22-round2`, against its parent `4b948312` (the original T22 code remains `12e53e2179095600a0fa3e19a88f9b322211c937`). The later observed `4726ebd0` is report/evidence only and does not change this code verdict. Read both original T22 review reports, the full eight-file round-2 code diff and regressions, the unchanged confidence parser/scorer, and real store/chip/verified-source/ModuleConfidence/trace callers. This reviewer did not implement the changes or edit production/tests, push, merge or run providers, seat checks, real Submit or Teams.

The repair preserves the exact source scope that the accepted score previously lost after an unrelated malformed Markdown table. `confidence_section()` uses the unchanged scorer's fence and heading rules to select only the accepted Confidence inputs section, projects original prose and locators with their original one-based line indices, and leaves accepted input values/order with the existing authority parser. `traceForConfidence()` now passes that section through the existing `buildTrace()` rather than constructing an input/method-only fallback when the general parser refused the handoff. Structured sections still take precedence, and old outputs without the new optional field keep their former paths.

The source-chip producer and `react_frontend.sources.enrich()` both include this fallback section only when the general parser has no matching section. They retain existing inventory/workflow/source-byte verification and the same source chip/link construction. The change does not authorize a different original, guessed page, replaced quote or changed source hash. The focused verified-source regressions exercise stale links, missing/changed/unpublished sources and page checks alongside the new malformed-handoff bridge. The actual-source fixture retains the exact Annual.txt filename, source SHA-256, cited page 7, source excerpt, original handoff SHA and line 12 Evidence target. Earlier-table and fenced/next-section passages do not enter the score's qualification.

The score remains the unchanged published `89 / High`. Raw `0008`, every explicit `0`, all fourteen input strings and their order remain exact. The method still states all original lineage weights, 60/40 weighting, gate factors, finding penalties, clamp/caps, half-to-even rounding and bands. The original scorer is unchanged and called once; no score or interpretation is recomputed in JavaScript. The new optional `section` has no effect on old no-score, refused or blocked records. No protected confidence method, prompt, proof handoff or Signal source changed.

## Independent bounded evidence

All commands used linked existing dependencies, `timeout 300` or less, Vitest `--maxWorkers=1`, and Python `--no-sync` with explicit `/workspace/recovery-t22-round2/src:/workspace/recovery-t22-round2/apps/issuer-library:/workspace/recovery-t22-round2` PYTHONPATH. `/workspace/audit-tooling/bin/uv --version` is exactly 0.12.5; that is the available pinned binary.

| Check | Result / artifact |
| --- | --- |
| Projection, unchanged confidence authority/oracle and verified React sources | 116 passed; `/workspace/scratch/t22-round2-adversarial-python.log` |
| Confidence recovery, ReportContent records and Modules actual callers | 3 files / 61 passed; `/workspace/scratch/t22-round2-adversarial-web.log` |
| Original portable adversarial fixture/probe, actual ModuleConfidence drawer in native Chrome 157.0.8103.78 | 8 passed / 0 failed; `/workspace/scratch/t22-round2-adversarial-chrome.json` |
| Actual store + native chips + verified-original source bridge fixture, then actual `traceForConfidence` | 11 passed / 0 failed; `/workspace/scratch/t22-round2-adversarial-source-final.json` |
| Round-2 whitespace check and protected scorer/prompt/proof/Signal diff | Exit 0; protected diff empty |

Portable sources are `/workspace/scratch/t22-adversarial-fixture.py`, `/workspace/scratch/t22-adversarial-portable.mjs` and `/workspace/scratch/t22-round2-adversarial-source-probe.mjs`; the actual-source fixture generator is retained under the worker's `output/5-repair/evidence/t22-round2/source-citation-fixture.py`. The original 12e53e21 failures remain historical evidence in the initial primary/adversarial reports. The same original qualification probe that failed before now passes at the fixed pin.

The first added source-probe run had two reviewer assertion mistakes: it assumed a colon line separator rather than the existing hash-line token's hyphen, and tested a native drawer display phrase in the trace object rather than its exact source-link label. The retained first JSON shows the correct product token/excerpt. After checking the existing token and source-link contracts, only the scratch probe expectations were corrected; no product/test assertion changed. Final eleven checks pass. Implementer broad 501-Python/771-frontend and Chrome/Edge evidence was read for scope and was not redundantly rerun or counted as independent evidence here.

Not verified: combined final integration/fidelity/gates, full weekly suite, Windows/work-PC and Edge independently, live/paid/provider execution, seat checks, real Submit, Teams, or analytical correctness beyond the explicitly synthetic retained-source/presentation fixtures. This bounded second adversarial review covers the round-2 qualification/source-preservation repair, not unlimited input forms.
