"""``deploy_vii.charts``: what the SVG draws for a waterfall's labels and a debt stack's axis."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from decimal import Decimal

from deploy_vii.charts import render_svg
from deploy_vii.display import format_value
from deploy_vii.report_view import Block, Cell, ChartMark, ChartSpec, Row

NS = "{http://www.w3.org/2000/svg}"


def _spec(kind: str, steps: list[tuple[str, Decimal, str]], **extra) -> ChartSpec:
    marks, cells = [], []
    for index, (label, value, role) in enumerate(steps):
        text = format_value(value, "amount", "known")
        marks.append(
            ChartMark(
                series="S", label=label, text=text, value=value, role=role, ref_id=f"K{index + 1}"
            )
        )
        cells.append(
            Cell(
                text=text,
                prov="calculated",
                ref_id=f"K{index + 1}",
                unit_class="amount",
                state="known",
            )
        )
    twin = Block(
        block_id="t",
        title="t",
        owner="o",
        state="populated",
        kind="dense",
        row_header="r",
        columns=("c",),
        rows=tuple(
            Row(row_id=f"r{i}", label=m.label, cells=(c,))
            for i, (m, c) in enumerate(zip(marks, cells, strict=True))
        ),
    )
    return ChartSpec(
        kind=kind,
        series=("S",),
        table_twin=twin,
        marks=tuple(marks),
        unit_class="amount",
        **extra,
    )


def test_a_waterfall_bar_label_is_drawn_in_full_however_many_lines_it_wraps_to():
    """S13-1-1: no word after the second 14-character line is dropped from the axis."""
    labels = [
        "Cash and cash equivalents",
        "Scheduled amortisation inside the horizon",
        "Cash at horizon end before refinancing",
    ]
    steps = [
        (labels[0], Decimal(500), "total"),
        (labels[1], Decimal(-80), "value"),
        (labels[2], Decimal(420), "total"),
    ]
    svg = ET.fromstring(render_svg(_spec("waterfall", steps), chart_id="c", title="t"))
    by_x: dict[float, list[tuple[float, str]]] = {}
    for node in svg.iter(f"{NS}text"):
        classes = (node.attrib.get("class") or "").split()
        if "ax" in classes and "small" in classes:
            by_x.setdefault(float(node.attrib["x"]), []).append(
                (float(node.attrib["y"]), node.text or "")
            )
    drawn = [" ".join(t for _, t in sorted(lines)) for _, lines in sorted(by_x.items())]
    assert drawn == labels


def test_a_debt_stack_over_a_tiny_denominator_draws_a_bounded_number_of_grid_lines():
    """S13-1-2: a 100,000x axis does not draw 100,000 grid lines."""
    steps = [("Facility 0", Decimal(600), "value"), ("Facility 1", Decimal(400), "value")]
    spec = _spec("debt_stack", steps, denominator=Decimal("0.01"))
    svg = ET.fromstring(render_svg(spec, chart_id="c", title="t"))
    grid = [n for n in svg.iter(f"{NS}line") if n.attrib.get("class") == "grid"]
    assert 1 <= len(grid) <= 10
    big = ET.fromstring(
        render_svg(_spec("debt_stack", steps, denominator=Decimal(100)), chart_id="c", title="t")
    )
    assert len([n for n in big.iter(f"{NS}line") if n.attrib.get("class") == "grid"]) == 10
