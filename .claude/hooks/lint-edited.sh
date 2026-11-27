#!/usr/bin/env bash
# PostToolUse hook: lints the edited file (quality gate for .py, eslint for web/ JS/TS); exit 2 on findings.
# Deliberate fail-opens, each logged to stderr: origin/main missing (gate skipped), web/node_modules missing (eslint skipped).
set -u

ROOT_MSG='Fix the gate findings above at their root cause; do not add suppressions.'
paths=$(python3 -c '
import json, sys

try:
    event = json.load(sys.stdin)
except (json.JSONDecodeError, UnicodeDecodeError) as error:
    print(f"lint-edited: invalid hook input: {error}", file=sys.stderr)
    raise SystemExit(2)

if not isinstance(event, dict):
    print("lint-edited: hook event must be an object", file=sys.stderr)
    raise SystemExit(2)

tool_input = event.get("tool_input")
if isinstance(tool_input, dict):
    path = tool_input.get("file_path")
    if isinstance(path, str) and path:
        if "\n" in path or "\r" in path:
            print("lint-edited: multiline file path is unsupported", file=sys.stderr)
            raise SystemExit(2)
        print(path)
        raise SystemExit(0)
    if path is not None:
        print("lint-edited: invalid tool_input.file_path", file=sys.stderr)
        raise SystemExit(2)
    tool_input = tool_input.get("patch") or tool_input.get("input")

if isinstance(tool_input, str) and tool_input.startswith("*** Begin Patch\n"):
    for header in tool_input.splitlines():
        for prefix in ("*** Add File: ", "*** Update File: ", "*** Move to: "):
            if header.startswith(prefix):
                print(header.removeprefix(prefix))
    raise SystemExit(0)

print("lint-edited: no recognized edit paths; scoped lint skipped", file=sys.stderr)
' ) || exit $?
[ -n "$paths" ] || exit 0

if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  root=$CLAUDE_PROJECT_DIR
else
  root=$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)
fi
cd "$root" || exit 0

checked_python=0
while IFS= read -r f; do
case "$f" in
  *.py)
    [ "$checked_python" -eq 0 ] || continue
    checked_python=1
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
    [ -f "$f" ] || continue
    if [ ! -x web/node_modules/.bin/eslint ]; then
      echo "lint-edited: web/node_modules missing, eslint skipped" >&2
      exit 0
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
