#!/usr/bin/env bash
# PostToolUse hook: lints the edited file (quality gate for .py, eslint for web/ JS/TS); exit 2 on findings.
# Deliberate fail-opens, each logged to stderr: origin/main missing (gate skipped), web/node_modules missing (eslint skipped).
set -u

ROOT_MSG='Fix the gate findings above at their root cause; do not add suppressions.'
f=$(python3 -c 'import json,sys; print((json.load(sys.stdin).get("tool_input") or {}).get("file_path") or "")')
[ -z "$f" ] && exit 0

if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  root=$CLAUDE_PROJECT_DIR
else
  root=$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)
fi
cd "$root" || exit 0

case "$f" in
  *.py)
    if ! git rev-parse --verify -q origin/main >/dev/null; then
      echo "lint-edited: origin/main missing, quality gate skipped" >&2
      exit 0
    fi
    out=$(uv run python tools/quality_gate.py --base origin/main --checks code 2>&1)
    if [ $? -ne 0 ]; then
      printf '%s\n%s\n' "$out" "$ROOT_MSG" >&2
      exit 2
    fi
    ;;
  web/*.ts|web/*.tsx|web/*.js|web/*.jsx|web/*.mjs|"$root"/web/*.ts|"$root"/web/*.tsx|"$root"/web/*.js|"$root"/web/*.jsx|"$root"/web/*.mjs)
    if [ ! -x web/node_modules/.bin/eslint ]; then
      echo "lint-edited: web/node_modules missing, eslint skipped" >&2
      exit 0
    fi
    rel=${f#"$root"/}
    rel=${rel#web/}
    out=$(cd web && node_modules/.bin/eslint --max-warnings=0 "$rel" 2>&1)
    if [ $? -ne 0 ]; then
      printf '%s\n%s\n' "$out" "$ROOT_MSG" >&2
      exit 2
    fi
    ;;
esac
exit 0
