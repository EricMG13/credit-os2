#!/usr/bin/env bash
# C5 probe: /connected/snapshot returns the absolute workspace path of the server in catalogue.workspace (the Evidence data source);
# /connected/library strips it. Usage (repo root): C5_BASE=http://127.0.0.1:8735 C5_RUN=<run> bash <this file>
set -u
BASE=${C5_BASE:-http://127.0.0.1:8735}; RUN=${C5_RUN:?set C5_RUN}
timeout 30 curl -s "$BASE/connected/snapshot?run=$RUN" -o /tmp/c5-snapshot.json
timeout 30 curl -s "$BASE/connected/library" -o /tmp/c5-library.json
python3 - <<'PY'
import json, re
snap = json.load(open('/tmp/c5-snapshot.json'))
lib = json.load(open('/tmp/c5-library.json'))
hits = []
def walk(x, p=''):
    if isinstance(x, dict):
        for k, v in x.items(): walk(v, p + '/' + k)
    elif isinstance(x, list):
        for i, v in enumerate(x): walk(v, p + '[%d]' % i)
    elif isinstance(x, str) and re.match(r'^(/[A-Za-z0-9_.-]+){2,}', x) and not x.startswith(('/connected', '/library', '/report', '/start', '/run')):
        hits.append((p, x))
walk(snap)
print('absolute paths in /connected/snapshot?run=<run>:', hits)
print('/connected/library catalogue.workspace:', lib['catalogue'].get('workspace'))
PY
echo "--- client reads of catalogue.workspace (none expected):"
grep -rn "catalogue\.workspace\|catalogue?\.workspace" web/src/pages/connected | grep -v test | head -3
echo "--- server source: src/deploy_workflow/credit_os_catalogue.py:517"
sed -n 517p src/deploy_workflow/credit_os_catalogue.py
