# Independent R4-014 / C5-013 documentation scope review

Reviewed 2026-11-17, independently of the implementer. This is a narrow documentation follow-up review, not a runtime or analytical acceptance claim.

## Exact pins and verdict

- Base: `5c39a559a933e8dc81c3038390a942cb8163864f`.
- Reviewed tip: `e896e256256ceac98a2dd564ffedacb4c86bb1e3`.
- Branch/worktree: `audit/lead-contract-doc-scope`, `/workspace/audit-contract-doc-scope`.
- **PASS: 0 High / 0 Medium / 0 Low findings in this follow-up.** The original contract/docs review's Low CD-1 / R4-014 is resolved by this pin.

Read `/workspace/credit-os2/AGENTS.md`, final-audit README R1–R17 and stage 5, lead STATUS/RESUME, the original `/workspace/scratch/runtime-contract-review.md`, the complete four-file follow-up diff, the repair report and saved finite probe. No production changes, push, merge, provider/live run, seat check, real Submit or Teams action was made by this reviewer.

## Authority and scope

The primary authority supports this correction independently of the implementation and amended matrices. In `docs/rulings/2026-11-11-reader-and-issuer-report.md`, decision 9 (lines 66–69) requires run handoff and calculation/Model downloads in Evidence without specifying an exclusive Record destination. Decision 10 (70–71) places true execution internals—hashes, instructions, retries and cost log—in Run record. H4 (169–176) preserves retained module-written tables/registers with the same rows, columns, IDs, values and order, and expressly permits inspector or Run record treatment of raw locators, hashes and reference columns. The governing AGENTS reader standard places registers and source references in Evidence/trace surfaces. The three current design rows now distinguish those content obligations from execution internals instead of collapsing them into exclusive Record placement.

`component-map.md:243` and `:400` and `react-module-coverage.md:37` retain the five Evidence tabs, exact unchanged module content, existing component references, download access and applicable module filter. They neither remove a register nor introduce a sorting or analytical requirement. The original primary ruling, original stage-1 matrices and historical crosswalk are unchanged. This is a correction to current derivative descriptions, not a new answer key inferred from what the build happens to draw.

The saved probe is intentionally finite: it reads only the three named design rows and checks their placement/internal distinctions. Its exact-phrase assertions enforce the documented correction; they do not independently prove runtime placement, completeness or handoff fidelity. That limit is stated in the repair report and is appropriate to the documentation-only diff.

## Independently observed checks

| Check | Result |
| --- | --- |
| Same saved probe against unchanged `/workspace/audit-contract-docs` at base `5c39a559` | Exit 1; 3 rows / 12 failures, reproducing the old exclusive wording |
| Same saved probe against reviewed tip | Exit 0; 3 rows / 0 failures |
| `node --check` on the probe | Exit 0 |
| `git diff --check 5c39a559..e896e256` | Exit 0 |
| Diff of primary rulings, `output/1-rubrics`, historical crosswalk | Empty; exit 0 |
| Original content/control snapshot SHA-256 | Preserved: `c50bba4ba27106e86ebccd330ae86898963da38bd6746e457d63a08929a48fad` / `3bef212f8973cbe42c8bc3e322810047fe32bcc447c5c7c1f1e843c041bc8920` |

The retained implementer red/green logs were read and show the same 12-failure then zero-failure sequence. The independent baseline and tip runs above confirm the same probe remains portable. No production code, analytical method, prompt, calculation, module handoff, dependency, expected-value fixture or gate changed in this repair. Full application gates and screenshots would not add evidence for these three non-rendered documentation rows and were not repeated.

Not verified: rendered UI/runtime behavior, analytical/handoff fidelity, full original contract chunk beyond the cited historical review, paid/provider execution, seat checks, real Submit, Teams, network behavior, Windows/native-browser behavior, weekly suite and unrelated concurrent changes.
