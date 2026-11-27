"""validate_bindings judges composition by the Pathway the report draws, not the registry preset."""

from datetime import date

from deploy_vii.bindings import Binding, BindingMap, validate_bindings
from deploy_vii.contracts import Fact, ModuleView, Run, View
from deploy_vii.report_view import FactCoord, pathways

HASH = "a" * 64
PRESET = next(p for p in pathways() if p.id == "credit_snapshot")


def _view() -> View:
    run = Run(
        run_id="run-1",
        issuer_id="issuer-1",
        issuer_name="Issuer",
        as_of=date(2026, 1, 1),
        case_kind="synthetic",
        pathway="credit_snapshot",
    )
    module = ModuleView(
        module_id="CP-X",
        title="Module X",
        aliases=(),
        status="accepted",
        artifact_sha256=HASH,
        facts=(Fact(fact_id="f1", label="Fact", text="v"),),
    )
    return View(run=run, mode="candidate", modules=(module,))


def _map(*blocks: str) -> BindingMap:
    return BindingMap(
        module_id="CP-X",
        entries=tuple(
            Binding(
                fact_coord=FactCoord(module_id="CP-X", table_id="summary"),
                block_id=block,
                cell_slot=f"slot-{n}",
                unit_class="text",
            )
            for n, block in enumerate(blocks)
        ),
    )


def test_doubly_bound_across_blocks_the_layout_composes_is_reported() -> None:
    # Neither block is in the registry preset, so the preset lookup misses the double drawing.
    assert not {"layout-a", "layout-b"} & set(PRESET.blocks)
    effective = PRESET.model_copy(update={"blocks": ("layout-a", "layout-b")})
    issues = validate_bindings(_view(), [_map("layout-a", "layout-b")], pathway=effective)
    assert len(issues) == 1
    assert issues[0].startswith("doubly bound fact CP-X/summary/summary/'f1'")


def test_valid_under_the_layout_is_not_refused_for_the_preset() -> None:
    first, second = PRESET.blocks[3], PRESET.blocks[4]
    effective = PRESET.model_copy(update={"blocks": (first,)})
    assert validate_bindings(_view(), [_map(first, second)], pathway=effective) == ()


def test_rail_destination_is_composed_everywhere() -> None:
    effective = PRESET.model_copy(update={"blocks": ("layout-a",)})
    assert validate_bindings(_view(), [_map("layout-a", "evidence")], pathway=effective)


def test_registry_preset_is_used_when_no_pathway_is_passed() -> None:
    first, second = PRESET.blocks[3], PRESET.blocks[4]
    assert validate_bindings(_view(), [_map(first, second)])
