"""Rebuild the lead-visual test fixtures from retained handoffs.

Run from the repository root:
    python3 web/src/pages/connected/report/leads/fixtures/build_fixtures.py
Then format the JSON: cd web && npx prettier --write src/pages/connected/report/leads/fixtures

Each fixture is the handoff parsed the way the published report parses it (`sections_of`), with the
chart descriptors the library derives (`reader_fields`). Nothing is edited: the markdown is read
as retained. Sources are retained TransDigm FY2024 handoffs (outdated evidence, shape only) and the
synthetic proof handoffs.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[7]
sys.path.insert(0, str(ROOT / "apps" / "issuer-library"))

from credit_os.handoff_fields import reader_fields
from credit_os.source import sections_of

SOURCES = {
    "cp1_tdg_fy2024": (
        "CP-1",
        "tests/fixtures/live_2026_11_15/earnings_update-CP-1-draft3-accepted.md",
    ),
    "relative_value_cp1": (
        "CP-1",
        "tests/fixtures/live_2026_11_15/relative_value-CP-1-draft1.md",
    ),
    "distressed_cp1": ("CP-1", "tests/fixtures/live_2026_11_15/distressed-CP-1-draft1.md"),
    "earnings_update_cp1_draft1": (
        "CP-1",
        "tests/fixtures/live_2026_11_15/earnings_update-CP-1-draft1.md",
    ),
    "cp1b_tdg_fy2024": ("CP-1B", "tests/fixtures/CP-1B-earnings_update-tdg-fy2024-t44-t46.md"),
    "cp0_synthetic": ("CP-0", "proof/handoffs/CP-0.md"),
    "cp5_synthetic": ("CP-5", "proof/handoffs/CP-5.md"),
    "cp6_synthetic": ("CP-6", "proof/handoffs/CP-6.md"),
}

out = Path(__file__).parent
for name, (module, path) in SOURCES.items():
    sections = sections_of((ROOT / path).read_text(encoding="utf-8"))
    fields = reader_fields(sections)
    entry = {
        "module": module,
        "source": path,
        "charts": fields["charts"],
        "sections": sections,
    }
    (out / f"{name}.json").write_text(
        json.dumps(entry, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(name, len(sections), "sections,", len(fields["charts"]), "charts")
