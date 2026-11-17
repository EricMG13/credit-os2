# R4-002 round 2: isolate retained register test inputs

Base: `e9c50ed4` on `audit/lead-tool-test-isolation`. Scope: the register-input
fixture loader in `tests/test_final_audit_tools.py`, one retained fixture archive,
and this report. No production helper, gate, configuration, manifest, lock file,
suppression, existing expected value, or protected source was changed.

## Cause and repair

The six literal output hashes and stdout counts describe the baseline with 505
findings. The test loader copied live audit JSON, so registering another finding
would incorrectly invalidate that frozen baseline. The loader now extracts a
retained input snapshot instead. The expected six hashes, 505/396 counts, severity
and disposition counts, validation cases, and requirements expectations are
unchanged.

`test_frozen_register_inputs_ignore_new_live_findings` was written first and
observed failing: a replacement live tree with one new finding produced SHA-256
`1a0b5e5ba51f2a9c88deba34b9516030d6e610036d3fbd2ad6c35256414364c4`, instead of
the original repair-findings input fingerprint
`548c9978293802037324b0a12d25e7c0a301c8db9b20d06c77f79349457123a2`.
After the loader repair the same regression passes. It uses a live tree without
Git metadata, so loading the baseline does not depend on Git objects or a remote.

## Retained snapshot

- Path: `tests/fixtures/final-audit-register-baseline.zip`.
- Exact input revision: `e3759109310d0193c6bea44c22245447cce2f613`.
- Inputs: 48 text files, 1,135,277 uncompressed bytes; archive 314,040 bytes.
- Archive SHA-256: `d0fb18a0eff2c461089fc0a38daab7f9f4e9ad6a3543b7aa7736e4f757d76074`.
- `_fixture_manifest.json` SHA-256:
  `eb1ec7f7d7cfbf310ac6137bd15fe96601664fde0acdaffe88cb4966c059541e`.
- The manifest records every input path and its SHA-256. At capture every input
  byte was compared with that revision, all manifest fingerprints were verified,
  and every archive path was checked to be relative with no parent traversal.
  The test does not recalculate this snapshot from production output.

## Checks

All Python commands used uv 0.12.5, `--no-sync`, this worktree's explicit
`PYTHONPATH`, and `timeout 300`.

| Check | Exit / result |
| :--- | :--- |
| New isolation regression before repair | 1; one expected failure |
| `pytest tests/test_final_audit_tools.py tests/test_quality_gate.py -q` | 0; 22 passed |
| Required default `uv run --no-sync python tools/quality_gate.py` | 0; zero findings, five changed Python files / 1,348 scoped lines against `origin/main` |
| Manifest hashes, safe paths and copied builders in a temporary tree without `.git` | 0; both builders complete without Git metadata |
| `git diff --check` | 0 |

The chief doubts were accidentally moving an answer key, retaining a Git-only
fixture dependency, or extracting different relative source paths. Existing
literal expectations were not edited; the archive retains those exact inputs and
paths, and the independent no-Git builder check succeeds. A committed compact
snapshot is simpler than runtime Git recovery or dynamic expected values. The
named historical review skills/models are unavailable; the direct confidence and
simplest-design review above was performed with the available worker (R7).

Not verified: fresh independent review and the final combined repository gates; the full Python/weekly/Windows suites. The register fixture and builders work without Git metadata, but the existing separate cumulative quality-gate test still requires its normal Git baseline; this repair does not redesign that environment requirement. Requirements-table manifests and lock files remain unchanged and outside this register-input isolation scope.
