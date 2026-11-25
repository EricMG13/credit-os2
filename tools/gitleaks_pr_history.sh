#!/usr/bin/env bash
# gitleaks over the commits a PR adds (origin/$BASE..HEAD), so a secret added and later
# removed inside the PR is still caught. Fails closed: an unresolvable base ref or an
# empty range would otherwise scan 0 commits and exit 0.
set -euo pipefail

: "${BASE:?BASE (the PR base branch) must be set}"
if ! git rev-parse --verify --quiet "origin/$BASE^{commit}" >/dev/null; then
  echo "gitleaks_pr_history: origin/$BASE does not resolve; refusing to pass an unscanned history" >&2
  exit 1
fi
n=$(git rev-list --count "origin/$BASE..HEAD")
if [ "$n" -le 0 ]; then
  echo "gitleaks_pr_history: origin/$BASE..HEAD holds no commits; refusing to pass an empty scan" >&2
  exit 1
fi
gitleaks git --no-banner --redact -v --ignore-gitleaks-allow -c .gitleaks.toml \
  --log-opts="origin/$BASE..HEAD" .
