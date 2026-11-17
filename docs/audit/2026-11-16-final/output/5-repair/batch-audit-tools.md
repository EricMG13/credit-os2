# R4-002: cumulative quality gate for the retained audit helpers

Base: `e3759109310d0193c6bea44c22245447cce2f613` on
`audit/final-coordination`. Work branch: `audit/lead-audit-tools`.

The default gate against `origin/main` found 237 inherited problems in the four
retained audit helpers. Task-specific comparison bases had excluded those already
added files. The helpers now pass the unchanged default gate. Their generated
files, warning order, counts, Markdown and validation outcomes are preserved.

## Test first

Added `tests/test_final_audit_tools.py` before editing a helper and ran its
default-quality-gate regression. It failed with exit 1: the JSON report retained
all 237 helper findings (and two transient unused imports in the initially partial
test file; its subsequently added behaviour tests use both imports).

Before implementing, captured SHA256 expectations from the original builders after
adding the test file. The six register outputs and the controlled 54-row
requirements table are checked byte for byte. The requirements fixture uses the
real manifests and locks with explicitly supplied import-usage files, so adding
another repository test cannot silently change that expectation. Additional tests
cover duplicate finding ids, unknown cluster/ruling ids, Python and npm pin/lock
mismatches, malformed findings, required files and a complete journey unit.

One new negative-test fixture initially included an unintended tenth fault: its
evidence was missing as well as its nine intended invalid conditions. The expected
`9 problems` assertion was preserved. Before changing the checker, supplied valid
evidence in that fixture to remove the unintended tenth fault; all original
assertions remained exact. No expected value was changed, no existing test edited,
no test skipped and no gate or configuration loosened.

## Implementation

- `build_register.py`: explicit JSON-row types; small helpers for cluster maps,
  verdicts, finding entries, disposition and writing. Entry field insertion order,
  source order, highest cluster severity, task inheritance and warning order stay
  as before.
- `check_outputs.py`: separate schema, identity and artifact checks; file-level
  report and harmony checks; unit counts. The original diagnostic order and
  command exit statuses are retained. No new validation rule was added.
- `write_docs.py`: one writer per generated document, with the former nested
  `probes_for` helper taking its lookup explicitly. Existing output strings and
  row ordering remain exact.
- `requirements_table.py`: typed table rows and helper signatures, sorted imports,
  formatted string literals and the equivalent insertion-ordered dict literal.
  Its CLI, 54 row numbers, assertions, handwritten usage text and usage counts
  stay unchanged. Corrected only the module docstring's example path to the actual
  `4-register/lead-tools` directory and wrapped the example.

No manifest, lock, gate, threshold, ignore, suppression, analytical method, prompt,
calculation, handoff or module-written text changed. Signal is untouched.

## Exact-output evidence

The tests freeze these independently captured pre-edit outputs for the copied
505-finding inputs (396 after merges):

| Output | SHA256 |
| :--- | :--- |
| `register.jsonl` | `41fc3c374328bdeeab7c1547ed99555ae8aa0ac3fb705ed8e935ebd83cf1e74e` |
| `register.md` | `cbaa016ea11398f3c3629862b91965d01936152a7fce3f8bf6e73e341dc269aa` |
| `tasks.md` | `d672f80900d1edfbfa2f8cd5009ce5d3bd704a44a76c38b0cf9f84962d7a7c5d` |
| `groups.md` | `760e8db9f571038c83127ff524d923aa7edcdc99e8f63033225d5edbc8883dce` |
| `parked.md` | `08f34a58d2d606c21377d6b697c9453afe29a8bc42d7621b55f94b46716e5da4` |
| `harmony.md` | `a72e7ec8e3cec79966f1d7ef61949ab6046273cafc34a9ff5510b2faad1122b5` |
| Controlled requirements table | `38cc6298c019cce9a71227d30cb76f946dd42575a8fb8792e777733b78e2183d` |

Also ran the original requirements script from base `e3759109` and the edited
script on this same actual checkout. Both stdout and all 54 rows matched exactly;
the actual-checkout table SHA256 is
`65f198d36db87375d251a374b3d19611a251abf35f739a1bd6ade69eb8af27f5`.

Ran the original and edited output checker on every section and journey. Their
stdout, stderr and exit codes match exactly. Sections retain their existing exit
1 for `S6/findings.jsonl:37`, whose `section: C1` is the already recorded intentional
placement; 376 findings, one diagnostic. Journeys retain exit 0: 99 findings, OK.
The checker was preserved rather than changed to accept that historical row.

## Checks and review

All long commands used `timeout 300`; uv is exactly 0.12.5. Python commands used
`uv run --no-sync` and this worktree's explicit `PYTHONPATH` with the shared installed
environment. No application network call, paid action or Teams call was made.

| Command or check | Exit | Result |
| :--- | ---: | :--- |
| Initial default-gate regression | 1 | Required failing test observed before helper edits |
| `uv run --no-sync pytest tests/test_final_audit_tools.py -q` | 0 | 10 passed |
| `uv run --no-sync pytest tests/test_final_audit_tools.py tests/test_quality_gate.py -q` | 0 | 21 passed |
| `uv run --no-sync python tools/quality_gate.py` | 0 | Default `origin/main` base; 0 findings, 5 changed files, 1,341 lines in scope |
| Ruff with `tools/ruff-gate.toml` on the four helpers and new test | 0 | All checks passed |
| `ruff format --check` on those five files | 0 | Five files already formatted |
| Old-versus-new full checker comparison | 0 | Exact stdout, stderr and exit-code equality for both kinds |
| Old-versus-new actual-checkout requirements comparison | 0 | Exact output bytes and stdout |
| `git diff --check` | 0 | No whitespace errors |

Confidence review focused on JSON insertion order, merged finding disposition and
task inheritance, diagnostic order, output escaping and dynamic usage counts.
Golden output bytes and the negative cases address those risks. The whole checker
comparison also preserves the known section diagnostic instead of concealing it.

Post-edit alternatives considered: a register pipeline object, schema validation
models, a Markdown template layer and a generalized requirements framework. Each
would add machinery or alter validation without fixing this finding. Kept direct
section helpers and existing string construction; the requirements CLI retains its
simple one-pass counter rather than gaining a new execution abstraction.

Not verified: the full Python suite, weekly and Windows CI, frontend/browser gates,
browser fidelity, live providers and Teams cards. This is offline audit-tooling
verification on the stated base and inputs. Named historical models and the
confidence-review/rewrite-tournament skills are unavailable; the explicit reviews
above use their stated fallback process. Fresh independent review is the lead's
next step before integration.
