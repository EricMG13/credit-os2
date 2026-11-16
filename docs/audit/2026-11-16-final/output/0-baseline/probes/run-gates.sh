#!/usr/bin/env bash
# Stage 0 baseline: run each gate as it stands and record its exit code.
# Run from the repository root:  bash docs/audit/2026-11-16-final/output/0-baseline/probes/run-gates.sh <log-dir>
# Needs Node 24 and uv 0.12.5 first on PATH (the repo pins both). Changes nothing in the repo.
set -u
LOG="${1:?usage: run-gates.sh <log-dir>}"
mkdir -p "$LOG"
SUMMARY="$LOG/gates-summary.tsv"
: > "$SUMMARY"

run() {
  local name="$1"; shift
  local limit="$1"; shift
  local start end code
  start=$(date +%s)
  timeout "$limit" "$@" > "$LOG/$name.log" 2>&1
  code=$?
  end=$(date +%s)
  printf '%s\t%s\t%ss\t%s\n' "$name" "$code" "$((end - start))" "$*" >> "$SUMMARY"
  echo "$name exit=$code ($((end - start))s)"
}

for script in lint format:check typecheck test unused duplication test:scripts test:file:gates audit; do
  run "npm-${script//:/-}" 600 npm --prefix web run "$script"
done

run quality-gate 600 uv run python tools/quality_gate.py --base HEAD~1 --json

if uv run python -c "import pytest_timeout" > /dev/null 2>&1; then
  run pytest-fast 600 uv run pytest -m "not live and not browser" -q -x --timeout=300
else
  run pytest-fast 600 uv run pytest -m "not live and not browser" -q -x
fi
