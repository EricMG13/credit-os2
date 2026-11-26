"""PR 7a task 1 (owner, 2026-11-26): the `custom` run type. Offline, synthetic, no provider.

Answer key: a custom run's every module is sent what the same module is sent in the Deep credit
assessment of the same context, sources and module list. The only differences allowed are named in
`NAMED_DIFFERENCES`, each with its cause; the comparison removes exactly those, so any other
difference fails."""

from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest
from test_cpos_launch import context_file, issuer_folder

from deploy_vii import registry, report_view
from deploy_vii.contracts import PATHWAY_CAP_USD, PATHWAY_MODULES, ModuleView, Run, View
from deploy_vii.report_view import pathways
from deploy_workflow import credit_os_chips
from deploy_workflow.inbox import startup
from deploy_workflow.owners.cpos_launch import Prepared, prepare, run_cap

DEEP = "deep_credit_assessment"
CONFIG = "copilot-sol-medium"
# The three Advanced presets of the plan's answer key, as `registry.plan` completes them.
SELECTIONS = {
    "model-and-rates": ["CP-0", "CP-1", "CP-1A", "CP-2E"],
    "portfolio-fit": ["CP-0", "CP-1", "CP-1A", "CP-2", "CP-3", "CP-5", "CP-6"],
}
# What differs between a custom run's instruction file and Deep's, and why. Each is removed
# before the comparison; nothing else may differ.
NAMED_DIFFERENCES = {
    # The one line that names the run's pathway (cause: the run's pathway name).
    "Pathway: custom.": "Pathway: deep_credit_assessment.",
}


def _prepared(tmp_path: Path, pathway: str, modules: list[str], cap: str = "50") -> Prepared:
    tmp_path.mkdir(parents=True, exist_ok=True)
    return prepare(
        context_file(tmp_path, pathway),
        issuer_folder(tmp_path),
        tmp_path / "run",
        config=CONFIG,
        cap=cap,
        modules=modules,
    )


def _texts(prepared: Prepared) -> dict[str, str]:
    return {
        m: (prepared.directory / spec.path).read_text()
        for m, spec in prepared.plan.instructions.items()
    }


def test_custom_is_a_run_type_with_a_ruled_cap() -> None:
    assert PATHWAY_MODULES["custom"] == ("CP-0", "CP-1")
    assert PATHWAY_CAP_USD["custom"] == Decimal(50)
    assert startup.RULED_CAPS_USD["custom"] == 50
    startup.check_launchable(startup.STANDING_RULING)
    assert startup.CUSTOM_CAP_RULING == "docs/rulings/2026-11-26-custom-routing.md"
    # A cap above the ceiling is refused and the refusal cites the custom ruling.
    with pytest.raises(Exception, match="custom-routing") as raised:
        run_cap("custom", Decimal(51))
    assert "above the custom cap of USD 50" in str(raised.value)
    assert run_cap("custom", None) == Decimal(50)


def test_custom_report_composition_is_decks_own_tuple() -> None:
    by_id = {p.id: p for p in pathways()}
    assert by_id["custom"].blocks == by_id[DEEP].blocks
    assert by_id["custom"].title == "Custom selection"
    presets = {row[0]: row for row in report_view._PRESETS}
    assert presets["custom"][3] is presets[DEEP][3]  # one tuple object, so they cannot drift
    assert [p.id for p in pathways()].index("custom") > [p.id for p in pathways()].index(
        "credit_screening"
    )


def test_every_site_that_looks_a_pathway_up_finds_custom() -> None:
    # The sites do `next(p for p in pathways() if p.id == run.pathway)`.
    assert next(p for p in pathways() if p.id == "custom")
    assert credit_os_chips.module_names("custom") == credit_os_chips.module_names(DEEP)
    for module in ("CP-0", "CP-1", "CP-2", "CP-6"):
        assert registry.purpose(module, "custom") == registry.purpose(module, DEEP)


@pytest.mark.parametrize("name", sorted(SELECTIONS))
def test_a_custom_run_sends_every_module_deeps_request(tmp_path: Path, name: str) -> None:
    modules = SELECTIONS[name]
    custom = _prepared(tmp_path / "custom", "custom", modules)
    # Deep names CP-MODEL in its list to publish the forecast; a custom run is planned with it.
    deep = _prepared(tmp_path / "deep", DEEP, [*modules, "CP-MODEL"])
    assert custom.ordered == deep.ordered
    assert set(custom.ordered) == set(registry.plan(tuple(modules))) - {"CP-MODEL"}
    assert custom.plan.publish_forecast and deep.plan.publish_forecast
    custom_texts, deep_texts = _texts(custom), _texts(deep)
    assert custom_texts.keys() == deep_texts.keys()
    for module, text in custom_texts.items():
        assert "Pathway: custom." in text, module
        for ours, theirs in NAMED_DIFFERENCES.items():
            text = text.replace(ours, theirs)
        assert text == deep_texts[module], module
    assert custom.omitted == deep.omitted
    assert custom.plan.run.pathway == "custom"


def test_the_forecast_period_block_reaches_cp1_of_a_custom_run(tmp_path: Path) -> None:
    without = _prepared(tmp_path / "a", "custom", ["CP-0", "CP-1", "CP-1A", "CP-2E"])
    assert without.plan.publish_forecast
    text = _texts(without)["CP-1"]
    deep = _prepared(tmp_path / "b", DEEP, ["CP-0", "CP-1", "CP-1A", "CP-2E"])  # no CP-MODEL
    assert not deep.plan.publish_forecast
    assert text != _texts(deep)["CP-1"].replace(
        "Pathway: deep_credit_assessment.", "Pathway: custom."
    )


def test_layout_omits_blocks_whose_owner_did_not_run(tmp_path: Path) -> None:
    custom = _prepared(tmp_path, "custom", SELECTIONS["model-and-rates"])
    assert custom.omitted, "a four-module run leaves report blocks out"
    routed = {r.block_id for r in custom.layout.routes}
    assert routed.isdisjoint(custom.omitted)
    assert {r.module_id for r in custom.layout.routes} <= set(custom.ordered)
    assert "Custom selection" in custom.layout.title


def test_cp6_of_a_custom_run_takes_the_portfolio_workbook(tmp_path: Path) -> None:
    custom = _prepared(tmp_path, "custom", SELECTIONS["portfolio-fit"])
    assert custom.portfolio.collected
    assert any(r.module_id == "CP-6" for r in custom.layout.routes)
    assert "Portfolio workbook:" in _texts(custom)["CP-6"]
    assert (
        json.loads((custom.directory / "workflow.json").read_text())["run"]["pathway"] == "custom"
    )


def test_a_module_a_custom_run_left_out_reads_not_run_not_outside_the_pathway() -> None:
    # `module_display` reads the pathway's preset to tell "not requested" from "not in this
    # pathway"; a custom run has no preset of its own, so it is read as Deep (every module).
    run = Run(
        run_id="custom-x",
        issuer_id="x",
        issuer_name="Synthetic Issuer",
        as_of=date(2026, 9, 30),
        case_kind="synthetic",
        pathway="custom",
        requested_modules=("CP-0", "CP-1", "CP-1A", "CP-2E"),
    )
    view = View(
        run=run,
        mode="candidate",
        modules=tuple(
            ModuleView(module_id=m.module_id, title=m.title, aliases=m.aliases, status=status)
            for m in registry.modules()
            for status in [registry.idle_statuses(run)[m.module_id]]
        ),
    )
    display = report_view.module_display(view)
    by_id = {m.module_id: m for m in view.modules}
    assert display(by_id["CP-2"])[1] == "Not run"  # left out by the analyst
    assert display(by_id["CP-2E"])[1] == "Not run"  # in the run, not yet run
    assert by_id["CP-2"].status == "not_in_pathway"


def test_a_custom_run_without_cp6_withholds_the_call_as_not_requested() -> None:
    # Reviewer's probe T1-call-band-custom: the call band and the honest state read a custom run's
    # preset as Deep's, as the module row does.
    run = Run(
        run_id="custom-y",
        issuer_id="x",
        issuer_name="Synthetic Issuer",
        as_of=date(2026, 9, 30),
        case_kind="synthetic",
        pathway="custom",
        requested_modules=("CP-0", "CP-1", "CP-1A", "CP-2E"),
    )
    statuses = registry.idle_statuses(run)
    by_id = {
        m.module_id: ModuleView(
            module_id=m.module_id, title=m.title, aliases=m.aliases, status=statuses[m.module_id]
        )
        for m in registry.modules()
    }
    custom = next(p for p in pathways() if p.id == "custom")
    deep = next(p for p in pathways() if p.id == DEEP)
    assert report_view._call(by_id, custom)[1] == "not_requested"
    assert report_view._call(by_id, custom)[1] == report_view._call(by_id, deep)[1]
    spec = next(
        report_view._spec_of(b)
        for b in custom.blocks
        if "CP-2" in report_view._spec_of(b).producers
    )
    state = report_view._honest_state(spec, statuses, custom)
    assert state[0] == report_view._honest_state(spec, statuses, deep)[0] == "not_run"


def test_a_custom_layout_meets_the_layout_conditions_the_delivery_sites_check(
    tmp_path: Path,
) -> None:
    # The conditions at owners/cpos.py (cpos_layout) and markdown_delivery.py (markdown_layout),
    # written out here; the two sites themselves are not called (each needs a whole delivery
    # request).
    custom = _prepared(tmp_path, "custom", SELECTIONS["portfolio-fit"])
    layout = custom.layout
    preset = next(p for p in pathways() if p.id == "custom")
    assert len(set(layout.blocks)) == len(layout.blocks)
    assert set(layout.blocks) <= set(preset.blocks)
    assert {r.module_id for r in layout.routes} <= set(custom.ordered)
    assert {r.block_id for r in layout.routes} == set(layout.blocks)
