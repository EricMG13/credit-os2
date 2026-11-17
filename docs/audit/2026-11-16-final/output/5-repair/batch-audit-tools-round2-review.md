# R4-002 round 2: independent review of retained input isolation

Verdict: **PASS**. High: 0. Medium: 0. No code change requested.

Reviewed `054e2e1d` against `e9c50ed4` on `audit/lead-tool-test-isolation`.
This reviewer did not implement the isolation repair. Read the three-file diff,
implementation report and fixture manifest against the project and stage-5 rules.

The change is confined to the regression fixture loader, one new regression, the
retained archive and the report. Production helpers, gates, configuration,
suppressions, dependencies and protected product sources are unchanged.
AST comparisons confirm that **every existing function except `_register_tree`
is unchanged**, including all existing assertions, negative cases, six literal
output hashes, expected stdout and 505/396 counts. The requirements-table tests
and expectations are unchanged. Exactly one isolation regression was added.

Independently checked the ZIP rather than relying on its manifest's claims:

- Its 48 input entries match `e3759109310d0193c6bea44c22245447cce2f613` byte for
  byte, and exactly cover the former loader's input patterns. The 49th entry is
  `_fixture_manifest.json`. No input, generated answer or script was substituted.
- All manifest SHA256 values match; input bytes total 1,135,277. Archive SHA256 is
  `d0fb18a0eff2c461089fc0a38daab7f9f4e9ad6a3543b7aa7736e4f757d76074`;
  manifest SHA256 is
  `eb1ec7f7d7cfbf310ac6137bd15fe96601664fde0acdaffe88cb4966c059541e`.
- Every path is unique and relative, with no parent traversal, backslash, drive
  prefix or symlink entry. The archive's extra manifest is not a builder input.
- The fixture loader reads the committed snapshot directly. It does not recover
  Git history, contact a remote or calculate expected output from changed code.

For an independent adversarial check, copied the actual test module, archive and
helper scripts to a temporary root with **no `.git`**. Populated that root's live
repair-findings, clusters and section findings with different new/malformed data.
Ran the frozen register-output test, changed the live findings and clusters again,
and ran it a second time. Both runs completed from the retained inputs and
produced the exact original six SHA256 values, stdout and counts. No actual
canonical audit data was changed during review.

All Python commands used uv **0.12.5**, `--no-sync`, this worktree's explicit
`PYTHONPATH`, and `timeout 300` for long commands.

| Check | Exit / result |
| :--- | :--- |
| `pytest tests/test_final_audit_tools.py tests/test_quality_gate.py -q` | 0; 22 passed |
| Default `python tools/quality_gate.py`, against `origin/main` | 0; zero findings, five changed Python files, 1,348 lines in scope |
| Independent archive/source/AST/no-Git mutation checks | 0; all checks above passed |
| Ruff with `tools/ruff-gate.toml` on the changed test | 0 |
| `ruff format --check` on the changed test | 0 |
| `git diff --check e9c50ed4..054e2e1d` | 0 |

Local scratch evidence is `/workspace/scratch/review-audit-tools-round2.py` and
`/workspace/scratch/audit-tools-round2-review-xv928ghz/review-results.json`.
Only this review report was added to the candidate branch; no code edits, push,
merge, application network call, provider action, paid Submit, seat check or Teams
call was made.

Not verified: final combined repository gates, the full Python/weekly/Windows suites and browser fidelity; live providers, seats and Teams. The separate default-quality-gate regression continues to require its normal Git baseline; the retained register fixture and builders were independently exercised without Git metadata. Historical named models and review skills remain unavailable; the explicit source and adversarial checks above supply the brief's fallback review.
