#!/usr/bin/env bash
# Both clients use the same scoped lint implementation.
exec bash "$(dirname "$0")/../../.claude/hooks/lint-edited.sh"
