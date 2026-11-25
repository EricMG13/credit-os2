#!/usr/bin/env bash
# gitleaks over the on-disk copy of every tracked file (`git ls-files`). `gitleaks dir`
# walks the disk and ignores .gitignore, so this copies exactly the tracked set into a
# scratch directory and scans it from `.`, where the `^`-anchored path allowlist in
# .gitleaks.toml matches repo-relative paths. A tracked file deleted on disk has
# nothing to scan and is skipped. Zip and gz contents are scanned (depth 2); inline
# `gitleaks:allow` comments are ignored. Adapted from caos-databricks/scripts/gitleaks_tree.sh.
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

if [ -z "$(ls -A "$scratch")" ]; then
  echo "gitleaks_tracked: no tracked files to scan; refusing to pass an empty scan" >&2
  exit 1
fi

cd "$scratch"
gitleaks dir --no-banner --redact -v --ignore-gitleaks-allow --max-archive-depth 2 \
  -c "$repo/.gitleaks.toml" .
