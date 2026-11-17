#!/usr/bin/env bash
# C5 probe: every download and source link the Evidence page draws, fetched from the service.
# Usage (repo root): C5_BASE=http://127.0.0.1:8735 C5_RUN=<run> C5_ROOT=/tmp/cs-C5/root bash <this file>
# Compares each handoff download with the delivered file byte for byte and lists status, type, disposition.
set -u
BASE=${C5_BASE:-http://127.0.0.1:8735}; RUN=${C5_RUN:?set C5_RUN}; ROOT=${C5_ROOT:-/tmp/cs-C5/root}
DEL=$(ls -d "$ROOT"/_engine/runs/$RUN/deliveries/*/ | head -1)
SHA=$(basename "$DEL")
echo "delivery $SHA"
H="timeout 20 curl -s -D - -o /tmp/c5-dl.bin"
fetch() { # url label
  hdr=$($H -w '' "$BASE$1"); code=$(echo "$hdr" | head -1 | tr -d '\r')
  ct=$(echo "$hdr" | grep -i '^content-type' | tr -d '\r'); cd=$(echo "$hdr" | grep -i '^content-disposition' | tr -d '\r')
  size=$(stat -c %s /tmp/c5-dl.bin)
  echo "$2 | $code | $ct | ${cd:-no content-disposition} | $size bytes"
}
for m in CP-0 CP-1 CP-1A CP-2 CP-2A CP-2D CP-2E CP-2G CP-3 CP-3C CP-4 CP-5 CP-6 CP-DR; do
  fetch "/library/downloads/$RUN/$m.md" "handoff $m"
  if cmp -s /tmp/c5-dl.bin "$DEL/$m.md"; then echo "   bytes equal to delivered $m.md"; else echo "   BYTES DIFFER from delivered $m.md"; fi
done
fetch "/library/downloads/$RUN/handoffs.zip" "zip"
python3 - <<'PY'
import zipfile
z=zipfile.ZipFile('/tmp/c5-dl.bin'); print('   zip entries:', z.namelist())
PY
for f in annual.md calculation.json forecast_exact.json; do
  fetch "/connected/artifacts/$RUN/$SHA/$f" "artifact $f"
  cmp -s /tmp/c5-dl.bin "$DEL/$f" && echo "   bytes equal to delivered $f" || echo "   BYTES DIFFER from delivered $f"
done
fetch "/connected/artifacts/$RUN" "artifact listing"; cat /tmp/c5-dl.bin; echo
for f in model.html report.html forecast.md quarter.md view.json coverage.json delivery.json; do fetch "/connected/artifacts/$RUN/$SHA/$f" "artifact (not offered) $f"; done
for f in northbridge-filing.txt northbridge-credit-agreement.txt northbridge-portfolio.xlsx; do
  S=$(sha256sum /home/user/credit-os2/proof/$f | cut -d' ' -f1)
  fetch "/connected/sources/$RUN/$S/$f" "source $f"
  fetch "/connected/sources/$RUN/$S/$f?page=1" "source $f ?page=1"
  fetch "/connected/sources/$RUN/$S/$f?page=999" "source $f ?page=999"
done
fetch "/connected/sources/$RUN/0000000000000000000000000000000000000000000000000000000000000000/northbridge-filing.txt" "source wrong hash"
fetch "/connected/sources/$RUN/../x/northbridge-filing.txt" "source traversal"
fetch "/library/downloads/$RUN/CP-8.md" "handoff CP-8 (none in run)"
fetch "/library/downloads/$RUN/../../state/x" "downloads traversal"
fetch "/library/index.html" "legacy library page"
fetch "/report.html" "report.html"
