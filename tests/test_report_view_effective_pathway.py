"""Report builds validate bindings against the blocks they actually compose."""

import pytest
from test_bindings_effective_pathway import PRESET, _map, _view

from deploy_vii.report_view import build


def test_build_rejects_a_fact_bound_to_two_effective_blocks() -> None:
    blocks = ("layout-a", "layout-b")
    assert not set(blocks).intersection(PRESET.blocks)
    effective = PRESET.model_copy(update={"blocks": blocks})

    with pytest.raises(ValueError, match="doubly bound fact CP-X/summary/summary/'f1'"):
        build(_view(), effective, [_map(*blocks)])


def test_build_draws_the_fact_once_when_only_one_preset_block_is_effective() -> None:
    shown, omitted = "key-findings", "capital-structure"
    assert {shown, omitted}.issubset(PRESET.blocks)
    effective = PRESET.model_copy(update={"blocks": (shown,)})

    report = build(_view(), effective, [_map(shown, omitted)])

    assert [block.block_id for block in report.blocks] == [shown]
    assert [[run.text for run in line.runs] for line in report.blocks[0].lines] == [["v"]]
