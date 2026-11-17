# R4-002: independent review of the audit-helper gate repair

Verdict: **PASS**. High: 0. Medium: 0. No code change requested.

Reviewed candidate `29270208` on `audit/lead-audit-tools`, against base
`e3759109310d0193c6bea44c22245447cce2f613`. This reviewer previously produced the
read-only batch inventory and did not implement this refactor. Read `AGENTS.md`,
the final-audit rulings, stage 5, the implementation report, all four helper diffs
and the new `tests/test_final_audit_tools.py`.

## Scope and preservation

The complete diff contains the four named helper scripts, the new regression-test
file and the implementation report. No existing test, product code, gate,
configuration, threshold, ignore, suppression, manifest or lock changed. No
protected Signal, method, prompt, calculation, canned handoff or module-written
text changed. The explicit JSON-row types and the one `cast` add no runtime
acceptance path. The helper decomposition keeps the original predicates, iteration
orders, field insertion order, strings and command results. The requirements
module's example-path correction affects its docstring only.

Independently reproduced the default gate at the exact base in a disposable
detached worktree: exit 1, **237 findings**, comprising 13 in `build_register.py`,
7 in `check_outputs.py`, 133 in `requirements_table.py` and 84 in `write_docs.py`.
Ran the unchanged default gate on the candidate against `origin/main`: exit 0,
**0 findings in 5 changed files, 1,341 lines in scope**. The repair clears the
inherited helper failures; it does not choose a narrower comparison base.

## Independent adversarial checks

A separate scratch harness ran the original scripts read from `e3759109` and the
candidate scripts on identical copied inputs. It did not edit production code or
checked-in tests.

- Both register builders produce the same stdout and all six generated files
  byte for byte. Independently matched every frozen SHA256 in
  `REGISTER_HASHES`, using the copied 505-finding input set, 396 after merges.
- Checked closure metadata explicitly: both versions discard annotations present
  only in a pre-existing generated `register.jsonl`; both preserve an added
  `closed_by` field when it is in a source finding. This existing behavior is
  unchanged. Final closure annotations still need to be applied after rebuilding;
  no new metadata-preservation feature was smuggled into the refactor.
- Duplicate member, self-member and member-as-primary cluster structures all
  retain exit 1 and the same diagnostic. Unknown cluster and ruling IDs retain
  exit 1 and do not write a register. The regression suite also exercises duplicate
  finding IDs.
- Compared the entire checker output, stderr and exit code on all 12 section
  units and six journey units. Sections retain exit 1 with the single existing
  diagnostic for `S6/findings.jsonl:37` recording `section: C1`; journeys retain
  exit 0. Counts remain 376 section findings and 99 journey findings. The checker
  was not taught to accept the historical section exception.
- Compared 13 controlled checker row variants: valid input; extra field; invalid
  surface, severity, kind, check, section and ID; wrong `owner_decision` type;
  absent probe/evidence; missing audit evidence/probe paths. Valid input alone
  succeeds; every invalid variant retains rejection and exact diagnostic output.
- Reproduced the new malformed fixture against both versions: its nonempty
  evidence removes the accidental extra fault, and both report the same exact
  **9 problems**. The `9 problems` expectation is unchanged; schema, evidence and
  artifact checks were not weakened to meet it.
- Both requirements scripts produce the same 54 rows, stdout and controlled
  SHA256 `38cc6298c019cce9a71227d30cb76f946dd42575a8fb8792e777733b78e2183d`.
  Also compared complete output bytes on this actual checkout, including dynamic
  usage counts. Python-lock and npm-lock mismatches, wrong Python patch pin,
  wrong uv pin and an otherwise pinned dependency without a usage entry all
  retain rejection before writing a table. Exception messages match; traceback
  source locations naturally differ after decomposition.

## Verification

Python used uv **0.12.5**, `uv run --no-sync`, the shared installed environment and
explicit `PYTHONPATH=/workspace/audit-tools/src:/workspace/audit-tools/apps/issuer-library:/workspace/audit-tools`.
Every long command used `timeout 300`. No npm command, application network call,
seat check, live provider action or Teams call was made.

| Check | Exit | Result |
| :--- | ---: | :--- |
| Default quality gate at base `e3759109`, JSON retained in scratch | 1 | Expected 237 inherited findings reproduced |
| `pytest tests/test_final_audit_tools.py tests/test_quality_gate.py -q` | 0 | 21 passed |
| `python tools/quality_gate.py`, default base `origin/main` | 0 | 0 findings; 5 files; 1,341 lines in scope |
| Independent original-versus-candidate differential harness | 0 | Output bytes, validation results and diagnostics preserved as above |
| Ruff with `tools/ruff-gate.toml`, four helpers and new test | 0 | All checks passed |
| `ruff format --check`, same five files | 0 | Five files already formatted |
| `git diff --check e3759109..29270208` | 0 | No whitespace errors |

Scratch evidence: `/workspace/scratch/audit-tools-before-gate.json`,
`/workspace/scratch/review-audit-tools.py` and
`/workspace/scratch/audit-tools-review-i2kj7j_2/review-results.json`.
These are local review evidence, not release artifacts. Only this review report
was written to the candidate branch.

Not verified: the full Python suite, weekly/Windows CI, frontend/browser gates, browser fidelity and the eventual combined audit tree; live providers, paid Submit, seats and Teams; arbitrary malformed JSON outside the tested cases. Historical named models and confidence-review/rewrite-tournament skills are unavailable; this fresh source review and the explicit negative-case comparisons supply the audit brief's fallback review.
