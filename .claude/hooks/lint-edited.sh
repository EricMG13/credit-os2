#!/usr/bin/env bash
# Lints only Python and frontend files changed by the current edit event.
# Missing lint prerequisites fail closed so an edit cannot appear checked when no lint ran.
set -u

ROOT_MSG='Fix the gate findings above at their root cause; do not add suppressions.'
script_dir=$(cd "$(dirname "$0")" && pwd) || exit 2
paths=$(python3 "$script_dir/lint_event.py") || exit $?
[ -n "$paths" ] || exit 0

root=$(cd "$(dirname "$0")" && git rev-parse --show-toplevel) || exit 2
cd "$root" || exit 2

checked_python=0
while IFS= read -r f; do
case "$f" in
  *.py)
    [ "$checked_python" -eq 0 ] || continue
    checked_python=1
    if ! git rev-parse --verify -q origin/main >/dev/null; then
      echo "lint-edited: origin/main is required to run the Python quality gate" >&2
      exit 2
    fi
    out=$(uv run python tools/quality_gate.py --base origin/main --checks code 2>&1)
    if [ $? -ne 0 ]; then
      printf '%s\n%s\n' "$out" "$ROOT_MSG" >&2
      exit 2
    fi
    ;;
  web/*.ts|web/*.tsx|web/*.js|web/*.jsx|web/*.mjs|"$root"/web/*.ts|"$root"/web/*.tsx|"$root"/web/*.js|"$root"/web/*.jsx|"$root"/web/*.mjs)
    [ -f "$f" ] || continue
    if [ ! -x web/node_modules/.bin/eslint ]; then
      echo "lint-edited: web/node_modules/.bin/eslint missing; install web dependencies before editing frontend files" >&2
      exit 2
    fi
    rel=${f#"$root"/}
    rel=${rel#web/}
    out=$(cd web && node_modules/.bin/eslint --max-warnings=0 -- "$rel" 2>&1)
    if [ $? -ne 0 ]; then
      printf '%s\n%s\n' "$out" "$ROOT_MSG" >&2
      exit 2
    fi
    ;;
esac
done <<< "$paths"
exit 0
