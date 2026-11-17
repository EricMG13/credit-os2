# Stage 5 batch: current contracts, source icons and Record downloads

Base: `d988f71a` on the local combined review candidate. Implementation commits are
`1e66f273` (documentation), `6d89aa68` (current matrices) and `eb50afb6`
(download presentation), followed by this report and the annual-only confidence control.
No branch was pushed or merged by this worker.

## Outcomes

| Finding / decision | Outcome |
| :--- | :--- |
| S2-012 / R10 OQ-09 | Repaired. The current design-system Trace control row, component-map paragraph/Q4 and module-coverage row say controls are visible at rest. The header switch highlights the source icons where offered; Evidence hides it under OQ-03. Historical mocks and original ruling files are unchanged. |
| R10 matrix amendments | Completed in separate current copies under `matrices/`; the stage 1 CSVs remain byte-identical historical inputs. Existing headers and all 332 CM / 49 CT IDs are retained; the current copies contain 346 CM / 64 CT rows. The amendment log records each changed existing field and every new row. |
| J1-019 | Repaired as a documentation/contract clarification. The nonempty-root refusal remains the deliberate synthetic safety boundary. `docs/react-workflow.md` says to use a fresh root of at most 80 characters after a stopped proof session, never empty an existing workspace, and distinguishes same-session reloads from restart. It documents the existing qualified read-only retained preview with its required inputs and no scheduler/provider. |
| C5-013, download clause | Repaired. Record retains its metadata first, then the same handoff list, original handoff ZIP and original model/calculation offers already available elsewhere. Existing Summary/Trace offers and every address/label are preserved. Module-filtered Record keeps the run-wide model offers. Missing groups keep their explicit unavailable explanations. |
| C5-013, registers/confidence-table clause | **Partial, reported to the lead.** This narrowly assigned reuse does not add per-handoff register/confidence tables to Record or a new sortable register renderer. Those tables remain reachable in the original Trace view. Their existing C5 matrix requirements were not amended merely to match the build. |
| C5-030 | Clarified while preserving the asset. `cpos_forecast.py` returns `annual.md: cp1` directly and `react_frontend/artifacts.py` names that asset Annual model handoff. A conditional sentence identifies it as the Financial foundation handoff used as model input. The original label/address/bytes and the separate HTML Model availability claim are retained. |

The current matrix amendments apply only the decided recommendations:

- OQ-01 removes the named static section only where the original section harmony marks a row
  **missing** and explicitly cites a decided reduced-vocabulary finding. This changes 193
  section-scope fields; no connected section is removed. Static sections already supporting
  a row remain in its scope.
- OQ-02 corrects CM-005's ruled prose/figure/limitation order.
- OQ-03/OQ-09 correct CM-009 and account for the header's actual highlighting control.
- OQ-07 corrects CM-033, CT-043 and CT-044 to retain noncompleted runs/modules with states.
- OQ-10 removes the separate plan/delivery/admission stage demand from Run activity;
  S6 is removed from CM-117/CM-204. CM-092 and the connected C5-033 Record contract remain.
- OQ-13 removes S2 from CT-028 and adds rows for the retained unmapped shell, run-header,
  tab, filter, tooltip, disclosure, Model and start/activity content and controls.

`matrices/amendments.md` includes both original SHA-256 values and all 202 existing-field
changes. Mechanical checks confirmed unchanged original headers/IDs, unique current IDs,
valid section IDs, and retention of every original connected section.

### C5-013 placement source hierarchy, retained for the lead's ruling

The primary owner record `docs/rulings/2026-11-11-reader-and-issuer-report.md` says:

- Decision 9, lines 66–69: "Evidence lists, for the selected run: ... the handoffs (one per
  module, each downloadable, plus 'download all'); and the calculation and Model downloads."
  It names Evidence without requiring the Record tab specifically.
- Decision 10, lines 70–71: "Run internals (hashes, instructions sent, retry and cost log) go in
  a fourth Evidence list, 'Run record', closed by default."
- H4, lines 172–176: "Tables and registers follow the reader passages, unchanged and exact:
  same rows, columns, IDs, values and order." Raw locators, hashes and reference columns
  "stay where the method puts them; the app may show them in the inspector or the Run record,
  but never removes them."

CM-076 adds source/method registers and confidence inputs to decision 10's run-internals list.
The specific Record destinations in CM-212/CM-216 and the later register/confidence rows derive
from `docs/design/react-live-handoff-crosswalk.csv`. CT-048 similarly turns decision 9's
Evidence scope into an Evidence > Record placement. The quoted primary ruling does not require
all module-written registers/confidence tables to be sortable Record tables. The lead was sent
these exact sources before any expansion: no new register schema/UI or unsupported matrix
placement amendment was made by this worker.

## Tests first and checks

`Evidence.contracts.test.tsx` was added before the presentation changes. The first run
exited **1**, with **4 failed / 2 passed**: Record lacked handoff offers, model/calculation
offers and unavailable-group explanations, and the annual-input explanation was absent.
The two passing controls pinned the pre-existing Summary and Trace handoff addresses.
After the repair, all six passed. A seventh annual-only control, passing from the start,
confirms that the input handoff never claims an unavailable original HTML Model exists.

No existing test expectation was changed. The initial type check identified a missing
`name` field in the new handoff test fixture; the fixture now supplies that required identity
and is declared as `PublishedRun` without a type assertion. This changed no expectation.

| Check | Exit / result |
| :--- | :--- |
| New test-first file on base | 1; 4 failed, 2 baseline controls passed |
| New file plus artifact-state tests after repair | 0; 13 passed |
| Nine affected Evidence/artifact/Record test files | 0; 77 passed |
| Final new file with annual-only confidence control | 0; 7 passed |
| `npm --prefix web run lint` | 0 |
| `npm --prefix web run format:check` | 0 |
| `npm --prefix web run typecheck` after completing the new fixture identity | 0 |
| Targeted Prettier / ESLint after the confidence control | 0 |
| `uv run --no-sync python tools/quality_gate.py` against `origin/main` | 0; 35 inherited changed Python files, 3,219 lines, no findings; no Python changed by this chunk |
| CSV header, original-ID, unique-ID and section-scope checks | 0; current 346 CM / 64 CT rows; original source hashes unchanged |
| `git diff --check` | 0 |

Commands used `timeout 300`, Vitest `--maxWorkers=1`, uv **0.12.5** and explicit worktree
`PYTHONPATH` with `--no-sync`. No npm installation was run in the shared package tree.
No executable test applies to the documentation-only policy amendments: their checks are
the exact decided recommendations, original CSV fingerprints and structural CSV validation.

## Confidence and simplest-design review

The main doubts were lost existing offers, model downloads disappearing under a module filter,
confusing an input Markdown handoff with the HTML Model, and making the matrix agree with a
defect. The tests preserve existing addresses and unavailable states, exercise Record/CP-1,
and explicitly keep the HTML Model unavailable with only annual.md present. The matrices keep
all connected requirements, including the unimplemented C5-013 table clause and C5-033.

Reusing `EvidenceHandoffs` and `ArtifactDownloads` through the existing tab guards is simpler
than duplicating their markup or adding a Record prop/component abstraction. No Record.tsx,
source metadata, calculation, module-written text or original asset was edited. The new
caption is interface wording grounded in the unchanged producer's direct mapping.

Not verified: the remaining C5-013 register/confidence-table presentation clause; original downloads' bytes in a newly executed browser proof (producer/route mappings and exact existing offer addresses were read and unit-tested); browser/pixel rendering of these two added Record sections; the final combined fidelity capture and repository-wide frontend/Signal gates, which belong to the lead; every current matrix row against a live run; Windows, a real issuer/model/provider run, real Submit, Teams or a retained-preview execution. No Signal or shared library-part code changed, so Signal's suite was not repeated in this chunk. Historical named models/skills were unavailable; direct confidence and simplest-design reviews above used the available worker.
