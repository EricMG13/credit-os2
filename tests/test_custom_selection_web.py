"""The Start run page's copy of a custom selection (PR 7a task 5) equals the Python it copies.

`web/src/pages/connected/start/customSelection.data.json` holds each offered module's required and
optional producers, its purpose's first sentence, its modules-page-only flag and its estimate
figures, the hold, the balanced high set and the three presets; `customSelection.cases.json`
holds the launcher's own completion and estimate for chosen lists. The page computes from the first
and its tests compare with the second, so each figure, dependency, sentence and flag is read from
`contracts.py`, `methodology.json` and `cpos_custom` here and the copy cannot drift. The answer key
(`answer-key-caps.md`) is held by the page's own test, not here."""

from __future__ import annotations

import json
import re
from decimal import Decimal
from pathlib import Path

import pytest
from test_custom_estimate import MEDIUM, _prepared

from deploy_vii import registry
from deploy_vii.contracts import MODULE_ESTIMATE_USD, PATHWAY_CAP_USD
from deploy_vii.report_view import pathways
from deploy_workflow.credit_os_chips import MODULE_NAMES
from deploy_workflow.owners import cpos_custom, cpos_launch

START = Path(__file__).resolve().parents[1] / "web" / "src" / "pages" / "connected" / "start"
API = START.parent / "api.ts"
DATA = json.loads((START / "customSelection.data.json").read_text(encoding="utf-8"))
NOT_OFFERED = {"CP-8", "CP-L10", "CP-MEMO", "CP-MODEL", "CP-OS"}
ROWS = {row["id"]: row for row in DATA["modules"]}
HIGH_OF = {"fast": frozenset(), "balanced": frozenset(cpos_launch.BALANCED_HIGH_MODULES)}


def _first_sentence(text: str) -> str:
    at = text.find(". ")
    return text if at < 0 else text[: at + 1]


def test_the_page_offers_the_registrys_modules_less_the_five_that_cannot_be_chosen():
    registry_order = [m.module_id for m in registry.modules() if m.module_id not in NOT_OFFERED]
    offered = [row["id"] for row in DATA["modules"] if row["offered"]]
    assert offered == registry_order  # the registry's order is the planner's tie-break
    assert [row["id"] for row in DATA["modules"] if not row["offered"]] == ["CP-8"]


@pytest.mark.parametrize("module", registry.modules(), ids=lambda m: m.module_id)
def test_each_modules_dependencies_sentence_and_flag_are_the_registrys(module):
    if module.module_id not in ROWS:
        assert module.module_id in NOT_OFFERED
        return
    row = ROWS[module.module_id]
    assert row["required"] == list(module.required)
    assert row["optional"] == list(module.optional)
    if row["offered"]:
        assert row["answers"] == _first_sentence(module.purpose)
        assert not re.search(r"CP-[A-Z0-9]", row["answers"])
        assert row["modules_page_only"] is (module.module_id not in _owned())


def _owned() -> frozenset[str]:
    return cpos_launch.custom_owned_modules()


@pytest.mark.parametrize("module_id", sorted(ROWS))
def test_each_modules_figures_are_the_contracts(module_id):
    figures = MODULE_ESTIMATE_USD[module_id]
    row = ROWS[module_id]
    assert (Decimal(row["medium"]), Decimal(row["high"]), row["measured"]) == (
        figures.medium,
        figures.high,
        figures.measured,
    )


def test_the_hold_the_high_set_and_the_fixed_reasons_are_the_launchers():
    assert Decimal(DATA["hold"]) == _prepared_hold()
    assert DATA["balanced_high"] == list(cpos_launch.BALANCED_HIGH_MODULES)
    assert DATA["always"] == list(cpos_custom.ALWAYS)
    assert DATA["reasons"] == {"source": cpos_custom.SOURCE_REASON, "cp8": cpos_custom.CP8_REASON}
    shown = set(ROWS)
    assert set(DATA["not_cp5_fan_in"]) == registry._NOT_CP5_FAN_IN & shown
    assert set(DATA["not_cp8_fan_in"]) == registry._NOT_CP8_FAN_IN & shown


def _prepared_hold() -> Decimal:
    """The hold the launcher counts for a custom run (the one it checks the cap against)."""
    import tempfile

    with tempfile.TemporaryDirectory() as name:
        prepared = _prepared(Path(name), ["CP-4"], config=MEDIUM)
    assert prepared.estimate is not None
    assert prepared.estimate.hold == prepared.hold
    return prepared.hold


def test_the_three_presets_complete_to_the_registrys_lists():
    done = {
        preset["name"]: cpos_custom.complete(preset["modules"], owned=_owned()).modules
        for preset in DATA["presets"]
    }
    assert done == {
        "Governance and ESG": ("CP-0", "CP-1", "CP-1A", "CP-2E"),
        "Covenant Capacity": ("CP-0", "CP-1", "CP-4"),
        "Portfolio Fit": ("CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"),
    }


def test_the_custom_card_asks_the_reports_question_and_the_names_are_the_chips():
    question = next(item.question for item in pathways() if item.id == "custom")
    questions = (START / "pathways.ts").read_text(encoding="utf-8")
    assert f'custom: "{question}"' in re.sub(r"custom:\s*\n\s*", "custom: ", questions)
    names = dict(re.findall(r'^  "(CP-[0-9A-Z]+)": "([^"]+)",', _block(), re.MULTILINE))
    for module_id in ROWS:
        assert names[module_id] == MODULE_NAMES[module_id]


def _block() -> str:
    text = API.read_text(encoding="utf-8")
    found = re.search(r"const MODULE_NAMES\b.*?\n\};\n", text, re.DOTALL)
    assert found, "MODULE_NAMES not found in api.ts"
    return found.group(0)


def test_the_page_card_ceiling_is_the_tables_custom_cap():
    assert PATHWAY_CAP_USD["custom"] == Decimal(50)


# --- the launcher's own completion and estimate, as the page's tests read them -----------------

CASES = START / "customSelection.cases.json"
SINGLES = [m.module_id for m in registry.modules() if m.module_id not in NOT_OFFERED]
NAMED = {
    "Governance and ESG": ["CP-1A", "CP-2E"],
    "Covenant Capacity": ["CP-4"],
    "Portfolio Fit": ["CP-6"],
    "Research, covenants and peers": ["CP-DR", "CP-4", "CP-1C"],
    "Every offered module": SINGLES,
    "Nothing beyond the two every run holds": [],
}


def _per(rows: tuple[cpos_custom.EstimateRow, ...]) -> str:
    return " ".join(f"{row.module} {row.figure}" for row in rows)


def cases() -> list[dict[str, object]]:
    """Each named selection and each module alone: what `cpos_custom` completes it to, why, and its
    estimate at each effort with and without CP-8 (the hold is the launcher's, 7.17)."""
    hold = Decimal(DATA["hold"])
    made = []
    for name, chosen in [*NAMED.items(), *((f"{m} alone", [m]) for m in SINGLES)]:
        done = cpos_custom.complete(chosen, owned=_owned())
        estimates = {}
        for effort in ("fast", "balanced", "high"):
            for compared in (False, True):
                planned = (*done.modules, *(("CP-8",) if compared else ()))
                high = frozenset(planned) if effort == "high" else HIGH_OF.get(effort, frozenset())
                result = cpos_custom.estimate(done, compared=compared, high=high, hold=hold)
                estimates[f"{effort}/{'cp8' if compared else 'no-cp8'}"] = {
                    "per": _per(result.rows),
                    "total": str(result.total),
                    "cap": result.cap,
                }
        made.append(
            {
                "name": name,
                "chosen": chosen,
                "completed": list(done.modules),
                "reasons": done.reasons,
                "page_only": sorted(done.modules_page_only),
                "estimates": estimates,
            }
        )
    return made


def test_the_launchers_completion_and_estimates_are_the_pages_cases_file():
    assert json.loads(CASES.read_text(encoding="utf-8")) == json.loads(json.dumps(cases()))
