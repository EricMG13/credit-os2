#!/bin/sh
# J1-019: proof.serve cannot reopen a root that already holds runs. Run from the repository root.
# Usage: timeout 120 sh docs/audit/2026-11-16-final/output/3-journeys/J1/probes/j1-nonempty-root.sh
root=$(mktemp -d /tmp/jr/j1-probe-root-XXXXXX)
mkdir "$root/_engine"
PYTHONPATH=src timeout 60 /root/.local/bin/uv run --locked python -m proof.serve --root "$root" --port 8761
code=$?
rm -rf "$root"
echo "exit $code (2 = refused: a restart cannot reopen earlier runs)"
