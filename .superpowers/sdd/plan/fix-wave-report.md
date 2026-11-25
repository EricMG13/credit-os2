# Fix wave report (claude/prose-to-checks)

1. checks.yml: curl download now has `--retry 3 --retry-all-errors`.
2. tests/test_repo_rules.py: `provider_secret_refs(text)` factored out; `test_provider_secret_ref_rules` written first, failed (NameError), then passed. Repo-wide test asserts `== []` per workflow. Regex ignores `secrets.GITHUB_TOKEN` and `needs.secrets.*`.
3. `is_credential_file`: `id_rsa` or `id_rsa.*`; `credentials.json` or `credentials.*.json`. Negatives added to `test_credential_patterns` first (failed), then passed; positives id_rsa, id_rsa.pub, credentials.json added in a new loop. keys/id_rsa and a/credentials.prod.json still pass. No existing assertion edited.

Exit codes: `uv run pytest -q tests/test_repo_rules.py` 0 (14 passed); `tools/quality_gate.py --base origin/main --checks code` 0 (ruff format applied once to the new code).

Not verified: the curl retry flags were not exercised (config only, no test applies; no CI run). Other workflow YAML/secrets checks beyond the regex cases untested.
