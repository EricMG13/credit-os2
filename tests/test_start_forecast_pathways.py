"""The Start a run page keeps the forecast on an explicit module list.

The launcher publishes the forecast only when CP-MODEL is in an explicit list; the page's lists
(`web/src/pages/connected/api.ts` PATHWAYS) equal the presets, so they hold it where the preset
does.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from test_cpos_launch import context_file, issuer_folder

from deploy_vii.contracts import DEACTIVATED_PATHWAYS, PATHWAY_MODULES
from deploy_workflow.owners.cpos_launch import prepare

API = Path(__file__).resolve().parents[1] / "web" / "src" / "pages" / "connected" / "api.ts"

LEFT_OUT = {
    "earnings_update": ["CP-0", "CP-1", "CP-1B", "CP-DR", "CP-2E", "CP-5"],
    "relative_value": [
        "CP-0", "CP-1", "CP-1A", "CP-DR", "CP-1C", "CP-2", "CP-2E", "CP-2D", "CP-3C", "CP-3",
        "CP-5",
    ],
    "portfolio_decision": ["CP-0", "CP-1", "CP-1A", "CP-DR", "CP-2", "CP-2E", "CP-3", "CP-5"],
}  # fmt: skip


def _prepared(tmp_path: Path, pathway: str, modules: list[str]):
    context = context_file(tmp_path, pathway)
    if pathway == "earnings_update":
        data = json.loads(context.read_text())
        data["run"].update(run_type="earnings", current_period="q3-2026", prior_period="q3-2025")
        context.write_text(json.dumps(data))
    return prepare(
        context, issuer_folder(tmp_path), tmp_path / "run", config="sol-medium", cap="20",
        modules=modules,
    )  # fmt: skip


@pytest.mark.parametrize("pathway", sorted(LEFT_OUT))
def test_r5_a_list_with_cp_model_publishes_the_forecast(tmp_path, pathway):
    (tmp_path / "with").mkdir()
    (tmp_path / "without").mkdir()
    kept = _prepared(tmp_path / "with", pathway, [*LEFT_OUT[pathway], "CP-MODEL"])
    dropped = _prepared(tmp_path / "without", pathway, LEFT_OUT[pathway])
    assert kept.plan.publish_forecast
    assert not dropped.plan.publish_forecast  # the launcher's rule the page relies on


def test_s1_the_page_lists_equal_the_presets():
    text = API.read_text(encoding="utf-8")
    paths = re.search(r"export const PATHWAYS\b.*?\n\};\n", text, re.DOTALL)
    assert paths, "PATHWAYS not found in api.ts"
    page: dict[str, list[str]] = {}
    for name, body in re.findall(
        r"^  (\w+): \{(.*?)^  \},", paths.group(0), re.MULTILINE | re.DOTALL
    ):
        modules = re.search(r"modules: \[(.*?)\]", body, re.DOTALL)
        assert modules, f"no modules list for {name}"
        page[name] = re.findall(r'"([^"]+)"', modules.group(1))
    assert set(page) == set(PATHWAY_MODULES) - set(DEACTIVATED_PATHWAYS)
    for name, modules in page.items():
        assert modules == list(PATHWAY_MODULES[name]), name
