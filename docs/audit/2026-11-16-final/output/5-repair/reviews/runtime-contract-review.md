# Independent runtime metadata and contract/docs review

Reviewed by the independent group-1 reviewer on 2026-11-17. This report is local review evidence, not authorization to merge or a claim of live analytical acceptance.

## Pins and scope

- Shared base: `d988f71a178b22879b33632adc81a0c23631d9d7`.
- Original runtime: `e825f90f2054d3df72a7abc6d87648c42a1c3f2d`, including `1f05c06e`, `30a522e9`, and `e825f90f`, in `/workspace/audit-runtime-metadata`.
- Contract/docs: `5c39a559a933e8dc81c3038390a942cb8163864f`, including `1e66f273`, `6d89aa68`, `eb50afb6`, `43ed1a76`, and `5c39a559`, in `/workspace/audit-contract-docs`.
- Narrow runtime fix follow-up: `76d57bc64a40d3adacc9bfc479eeda6bc0f6c025`, based on original runtime `e825f90f`, in `/workspace/audit-runtime-identity`. Follow-up results are appended below.

Read the applicable AGENTS, README rulings and stage-5 records, both batch reports, all changed production and test code, and the affected callers/producers. No production edits, test relaxations, provider calls, pushes or merges were made in this review. Python commands used pinned uv `/workspace/audit-tooling/bin/uv`, `--no-sync`, and explicit worktree `PYTHONPATH`; tests used `timeout 300`. Frontend tests used one worker and linked existing dependencies.

## Original runtime verdict: changes needed, 0 High / 1 Medium / 0 Low

**R4-011 — Medium: genuine scheduler runs lose all module response metadata because the two run identities differ.**

In original `react_frontend/run_metadata.py:83-90`, `_workflow` expects `workflow.run.run_id == record.id`. The scheduler record ID is a timestamp directory identity such as `20261117-183524-01`. The actual engine producer, `src/deploy_workflow/owners/cpos_launch.py:1049`, constructs the analytical identity as `issuer-as_of-pathway-config`, even with the scheduler's explicit output directory. An ordinary accepted Full synthetic engine run therefore contains `example-2025-04-30-credit_snapshot-sol-medium`, not the timestamp scheduler ID. The strict mismatch is caught and `reply(...).body["module_outputs"]` becomes null. Completed, accepted responses lose their assessment/provenance display, so the main repair is not usable on a genuine run. The original unit fixture used `case` for both identities and could not expose this failure.

Portable offline reproduction, from the original runtime repository root:

```sh
PYTHONPATH=/workspace/audit-runtime-metadata/src:/workspace/audit-runtime-metadata/apps/issuer-library:/workspace/audit-runtime-metadata timeout 300 /workspace/audit-tooling/bin/uv run --no-sync python /workspace/scratch/R4-011-runtime-engine-identity.py
```

The script wraps the repository's existing real-scheduler synthetic export proof, retains all original export assertions, uses its canned provider/dummy key, checks the fixed known 14-module Full set, and independently hashes each selected response. It fails on `e825f90f` at `ordinary accepted synthetic responses became unknown metadata`. Evidence: `/workspace/scratch/R4-011-runtime-engine-identity.log`. The actual retained diagnostic case is `/workspace/scratch/runtime-review-case`; the internal refusal explicitly names the workflow run ID mismatch. A separate phase-only diagnostic found 14 downstream verified module rows and approximately 1.6 MiB of metadata reads, but bypassed the failed scheduler binding and is not acceptance evidence.

The requested repair is the existing producer's analytical-ID mapping plus a bounded exact engine identity pin. It must preserve independent issuer/name/date/pathway matching, config mapping, source hashes, upstream accepted-response hashes, request fingerprint, instruction hash, review acceptance, selected response SHA and retained/new provenance checks. Missing or contradictory pins should remain unknown.

The remaining original runtime implementation is supported by the static and focused checks. Reads are bounded per file and in total, reject links/path escapes, and use existing regular-file reading. A completion must have the SHA-named record, pinned unique delivery selection and matching response bytes. Missing, ambiguous, rejected or stale selections do not become accepted metadata. Current acceptance stays distinct from delivery and current library membership; missing metadata does not claim a paid execution. Module assessment reuses the existing reader semantics rather than introducing a second analytical assessment. No additional reproducible High or Medium was found.

## Contract/docs verdict: pass with 0 High / 0 Medium / 1 Low follow-up

**Low CD-1 — current design descriptions still prescribe an exclusive Record register destination.**

- `docs/design/component-map.md:243`: Record row ends with `registers as written`.
- `docs/design/component-map.md:400`: Q6 still says `Record with registers`.
- `docs/design/react-module-coverage.md:37`: `Registers, calls, timings, instructions and handoff downloads live under Record`.

These current design descriptions should acknowledge that retained module-written tables/registers can be shown through the inspector/Trace or Record, while true run internals stay on Record. The unqualified combined sentence can send a future implementer back to the derived exclusive placement that this chunk correctly removed. This is documentation consistency only; it does not justify removing any register/table, changing any analytical content, adding sorting or reopening the owner decision. The original historical crosswalk can remain historical with its override recorded.

I independently checked primary authority rather than accepting the changed matrices as the answer key. `docs/rulings/2026-11-11-reader-and-issuer-report.md:66-69` decision 9 requires handoff and model/calculation downloads in Evidence without mandating the Record tab. Decision 10 at lines 70-71 puts true run internals in Run record. H4 at lines 172-176 preserves every retained table/register row, column, ID, value and order and explicitly permits inspector or Run record for raw locators/hashes/reference columns. Those sources support the narrow C5-013 placement correction. CM-076 retains true internals; CM-347 separates the unchanged module-written content obligation. A secondary derived crosswalk cannot override this primary ruling. No new sortable register control is required by that primary text.

The production diff reuses the same `EvidenceHandoffs` and `ArtifactDownloads` on Record, preserving the existing Summary/Trace offers and addresses, original asset bytes and unavailable explanations. The annual-model caption is grounded in the existing producer mapping of `annual.md` to the Financial foundation handoff; it retains the distinct unavailable HTML Model explanation and does not invent a new asset. No protected module text, calculation, source identity or analytical value changed.

The R10 doc/matrix amendments retain the applicable at-rest trace controls, hidden Evidence switch, reader passage ordering, noncompleted run/module state, and recorded current-output/admission obligations. I independently checked both CSV structures: unchanged headers, unique IDs, every original ID retained, no C1-C5 connected section removed; current content 347 rows versus original 332 and control 64 versus original 49. Original source files remain unchanged, with SHA-256 `c50bba4ba27106e86ebccd330ae86898963da38bd6746e457d63a08929a48fad` (content) and `3bef212f8973cbe42c8bc3e322810047fe32bcc447c5c7c1f1e843c041bc8920` (control). The synthetic restart documentation stops the server first and uses a fresh bounded root; it does not instruct deletion or imply navigation resets the server.

## Independently executed original-pin checks

| Pin / check | Result | Evidence |
| --- | --- | --- |
| Original runtime Python: runtime metadata, library cards, run activity | 73 passed | `/workspace/scratch/runtime-review-pytest.log` |
| Original runtime Vitest: RuntimeMetadata, Record, runStates, runFigures | 4 files / 46 tests passed | `/workspace/scratch/runtime-review-vitest.log` |
| Original runtime default changed-code quality gate | 37 changed Python files / 3,912 lines / 0 findings | `/workspace/scratch/runtime-review-quality.log` |
| Original runtime TypeScript check | Passed, exit 0 | `/workspace/scratch/runtime-review-typecheck.log` |
| Contract Vitest: Evidence.contracts, Evidence.t21-fix1, ArtifactDownloads.states, Record | 4 files / 27 tests passed | `/workspace/scratch/contract-review-vitest.log` |
| Contract TypeScript check and changed TSX ESLint / Prettier | Passed, exit 0 | `/workspace/scratch/contract-review-typecheck.log`, `/workspace/scratch/contract-review-eslint.log`, `/workspace/scratch/contract-review-prettier.log` |
| Both original diffs `git diff --check d988f71a..HEAD` | Passed | Independent command exit 0 |
| Actual scheduler synthetic metadata proof on original runtime | Failed as R4-011 | `/workspace/scratch/R4-011-runtime-engine-identity.log` |

The focused green unit results do not supersede the actual engine-artifact failure. Existing assertions were retained; no test timeout or gate was relaxed. The implementers' broader report results were reviewed for scope, not counted as independent runs here.

## Narrow R4-011 follow-up

**Follow-up verdict at `76d57bc64a40d3adacc9bfc479eeda6bc0f6c025`: PASS, 0 High / 0 Medium / 0 Low runtime findings remaining. R4-011 is resolved.** The original failure and its reproduction remain historical evidence.

I reviewed the full fix diff: five production lines, one new actual-engine regression file, and the fixture adjustment needed to represent the true analytical identity and identity pin. The existing `runs.config_for(record.model, record.effort)` supplies the same launcher config used by `_prepare`; expected analytical ID retains exact scheduler issuer, date, pathway and config. Exact issuer name is still checked independently. An additional bounded `_Reads.object("identity.json")` requires the engine's full `run` object to equal the workflow run, preserving requested-module/case-kind and other engine identity fields rather than dropping them. Missing or linked identity files and stale pins remain unknown. It does not parse source documents or read a guessed context location. It changes no cap, scheduler status, paid-execution authorization, source data, instruction, request, completion, assessment or provenance rules.

Independent follow-up evidence:

| Check at the fixed pin | Result | Evidence |
| --- | --- | --- |
| Same portable actual-scheduler synthetic proof that failed on original runtime | Passed: known 14-module set, every exact selected response hash, every new-response origin, current listed admission | `/workspace/scratch/R4-011-review-fixed-proof.log` |
| `pytest -q tests/test_react_runtime_identity.py tests/test_react_runtime_metadata.py tests/test_react_library_cards.py tests/test_react_run_activity.py` | 88 passed in 5.92 seconds | `/workspace/scratch/R4-011-review-fixed-pytest.log` |
| Default changed-code quality gate | 38 changed Python files / 4,049 lines / 0 findings | `/workspace/scratch/R4-011-review-fixed-quality.log` |
| `git diff --check e825f90f..HEAD` | Passed, exit 0 | Independent command |

The new tests retain a complete genuine engine/scheduler synthetic artifact before independently exercising completed responses, real event-prefix pending/accepted states, all five mismatched scheduler identity fields, changed launch configs, and missing/linked/stale engine identity pins. Existing ambiguity, source/request/fingerprint/hash/review rejection, stale acceptance and bounded-reader tests still pass. The unchanged frontend is covered by the original runtime 46 passing tests and type check above. No source-identity shortcut or relaxed acceptance rule was introduced to make the actual artifact pass.

Not verified: paid/provider execution, real production Submit, Teams, native-browser/Windows fidelity, broad weekly suite, and unrelated concurrent branches. CP-8's generated `changes.json` independent source-pack pin under internally inconsistent/tampered metadata remains an adversarial coverage limit, not a confirmed finding or an expansion of R4-011. No live analytical-success claim is made.
