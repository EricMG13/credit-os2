"""Review K12: colon labels, FY ranges and dates, bullet axes."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from decimal import Decimal

import pytest

from deploy_vii.charts import _bounds, render_svg
from deploy_vii.display import format_value
from deploy_vii.prose import _fact_years, bare_figures, bind, issues
from deploy_vii.report_view import Block, Cell, ChartMark, ChartSpec, Row

NS = "{http://www.w3.org/2000/svg}"


# -- year-figure rule: unchanged from the base (f3e13da) --
@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("USD 2030 unsecured notes", ()),
        ("EUR 2029 TLB", ()),
        ("the 2025 M&A pipeline", ()),
        ("$2050 senior notes", ("$2050",)),
        ("The firm had 1950 employees and 2025 branches.", ()),
        ("revenue of USD 2050 m", ()),
        ("Notes due 2030", ()),
        ("in 2025", ()),
    ],
)
def test_the_year_figure_rule_is_the_base_rule(text, expected):
    assert bare_figures(text) == expected


# -- K12-F2, F3 --
def _fact(fact_id: str, period: str):
    from deploy_vii.contracts import Fact

    return Fact(fact_id=fact_id, label="Revenue", amount=Decimal(5), unit="USD", period=period)


def _period(text, bound):
    return [i for i in issues(text, bound) if i.startswith("Period label")]


def test_a_colon_after_a_period_label_labels_the_following_clause():
    bound = bind([_fact("rev_c", "FY2025")])
    assert _period("FY2024 revenue was {rev_c|USD}.", bound)
    assert _period("FY2024: revenue was {rev_c|USD}.", bound)
    assert _period("FY2025: revenue was {rev_c|USD}.", bound) == []


def test_a_fiscal_range_names_both_years():
    assert _fact_years("FY25/26") == frozenset({2025, 2026})
    assert _fact_years("FY2025/26") == frozenset({2025, 2026})
    assert _fact_years("FY2025/2026") == frozenset({2025, 2026})
    bound = bind([_fact("r", "FY2025/26")])
    assert _period("FY2026 revenue reached {r|USD}.", bound) == []
    assert _period("FY2025 revenue reached {r|USD}.", bound) == []
    assert _period("FY2027 revenue reached {r|USD}.", bound)


def test_a_written_date_reads_like_an_iso_date():
    iso = _fact_years("Twelve months to 2026-03-31")
    assert _fact_years("Twelve months to 31 March 2026") == iso == frozenset({2025, 2026})
    assert _fact_years("Twelve months to March 31, 2026") == iso
    assert _fact_years("FY2026 to 31 March 2026") == frozenset({2026})


# -- K12-F5 --
def _bullet(rows: list[tuple[str, Decimal, Decimal]], unit_class: str = "multiple") -> ChartSpec:
    marks, cells = [], []
    for name, threshold, current in rows:
        for series, value in (("Threshold", threshold), ("Current", current)):
            marks.append(
                ChartMark(
                    series=series,
                    label=name,
                    text=format_value(value, unit_class, "known"),
                    value=value,
                    ref_id=f"K{len(marks) + 1}",
                )
            )
    for mark in marks:
        cells.append(
            Cell(
                text=mark.text,
                prov="calculated",
                ref_id=mark.ref_id,
                unit_class=unit_class,
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
        kind="bullet",
        series=("Threshold", "Current"),
        table_twin=twin,
        marks=tuple(marks),
        unit_class=unit_class,
        unit="x" if unit_class == "multiple" else None,
    )


def _draw(spec: ChartSpec) -> ET.Element:
    return ET.fromstring(render_svg(spec, chart_id="c", title="t"))


def _viewbox(svg: ET.Element) -> tuple[float, float]:
    parts = [float(p) for p in svg.get("viewBox", "").split()]
    return parts[2], parts[3]


def _rects(svg: ET.Element):
    return [r for r in svg.iter(f"{NS}rect") if r.get("width") and r.get("height") == "12"]


def test_a_negative_bullet_value_draws_a_bar_left_of_zero_with_labels_inside_the_plot():
    spec = _bullet([("A", Decimal(2), Decimal(-3)), ("B", Decimal(2), Decimal(4))])
    svg = _draw(spec)
    width, _ = _viewbox(svg)
    bars = _rects(svg)
    neg, pos = bars[0], bars[1]
    zero_x = float(pos.get("x"))
    assert float(neg.get("x")) + float(neg.get("width")) == pytest.approx(zero_x, abs=0.01)
    assert float(neg.get("width")) > 20  # a real bar, not 1px
    assert float(neg.get("x")) < zero_x
    # the label of the negative value is drawn left of the bar, inside the viewBox and right of the
    # category labels' anchor
    texts = {t.text: float(t.get("x")) for t in svg.iter(f"{NS}text") if t.text}
    assert texts[format_value(Decimal(-3), "multiple", "known")] >= 0
    for t in svg.iter(f"{NS}text"):
        assert 0 <= float(t.get("x")) <= width
    assert any("zero" in (l.get("class") or "") for l in svg.iter(f"{NS}line"))


def test_a_negative_threshold_tick_stays_inside_the_plot():
    svg = _draw(_bullet([("A", Decimal(-2), Decimal(1))]))
    ticks = [r for r in svg.iter(f"{NS}rect") if r.get("height") == "24"]
    assert ticks and float(ticks[0].get("x")) >= 190.0 - 1.5


def test_bounds_come_from_the_data_when_nothing_is_positive():
    low, high = _bounds([-0.005, -0.002])
    assert low == -0.01 and high == 0.0
    assert _bounds([0.0, 0.0]) == (0.0, 1.0)
    assert _bounds([-3.0])[1] == 0.0


def test_a_percent_bullet_with_only_negative_values_has_ticks_in_its_data_range():
    spec = _bullet([("A", Decimal("-0.005"), Decimal("-0.002"))], "percent")
    svg = _draw(spec)
    labels = [t.text for t in svg.iter(f"{NS}text") if t.get("class") == "ax"]
    assert "100%" not in labels and "50%" not in labels
    assert any(label.startswith(("-", "(")) or "−" in label for label in labels)


def test_bullet_value_labels_are_the_formatted_fixture_values():
    values = [Decimal(-3), Decimal(2), Decimal(4), Decimal(2)]
    spec = _bullet([("A", Decimal(2), Decimal(-3)), ("B", Decimal(2), Decimal(4))])
    drawn = [t.text for t in _draw(spec).iter(f"{NS}text") if t.get("class") == "lb small"]
    for value in values:
        assert format_value(value, "multiple", "known") in drawn


# -- K12-N3 --
def test_a_december_balance_date_does_not_admit_the_year_before():
    assert _fact_years("2025-12-31") == frozenset({2025})
    assert _fact_years("Year ended 31 December 2025") == frozenset({2025})
    assert _fact_years("Year ended December 31, 2025") == frozenset({2025})
    assert _fact_years("Twelve months to 2026-03-31") == frozenset({2025, 2026})
    assert _fact_years("Twelve months to 31 March 2026") == frozenset({2025, 2026})
    bound = bind([_fact("r", "Year ended 31 December 2025")])
    assert _period("FY2024 revenue was {r|USD}.", bound)
    assert _period("FY2025 revenue was {r|USD}.", bound) == []


def test_a_date_written_twice_counts_once():
    assert _fact_years("2026-03-31 (31 March 2026)") == frozenset({2025, 2026})
