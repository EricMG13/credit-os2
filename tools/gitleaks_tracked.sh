#!/usr/bin/env bash
# gitleaks over the tracked files (index, so staged additions count) as they are
# on disk. `gitleaks dir` walks the disk and ignores .gitignore, so this copies
# exactly `git ls-files` into a scratch directory and scans it from `.`, where
# .gitleaks.toml is read and its `^`-anchored path allowlist matches repo-relative
# paths. A tracked file deleted on disk has nothing to scan and is skipped.
# Adapted from caos-databricks/scripts/gitleaks_tree.sh.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
repo=$PWD
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

git ls-files -z --cached |
  while IFS= read -r -d '' path; do
    if [ -e "$path" ]; then printf '%s\0' "$path"; fi
  done |
  tar --null -T - -cf - |
  tar -xf - -C "$scratch"

cd "$scratch"
gitleaks dir --no-banner --redact -v -c "$repo/.gitleaks.toml" .
