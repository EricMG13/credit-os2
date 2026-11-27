"""C3 revert: segment captions use the Unit only; citation headers follow the leading/trailing-word
rule on the segment and debt paths (BASE 030805f behaviour).

SYNTHETIC: tables are invented handoff tables; expected cell text is literal.
"""

from __future__ import annotations

import pytest

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_workbook as writer


def table(headers, *rows):
    return snap._Table(
        "CP-1",
        "cp1.test",
        tuple(headers),
        tuple(snap._Row(10 + i, tuple(row)) for i, row in enumerate(rows)),
    )


def triples(cells):
    return {(c.row, c.column, c.text) for c in cells}


@pytest.mark.parametrize(
    ("measure", "unit", "currency", "label"),
    [
        ("Revenue", "USDm", "USD", "A · Revenue (USDm)"),
        ("Margin", "%", "USD", "A · Margin (%)"),
        ("Revenue", "usd millions", "USD", "A · Revenue (usd millions)"),
    ],
)
def test_segment_caption_is_the_unit_only(measure, unit, currency, label):
    cells = writer._segment_schedule_cells(
        table(
            ["Business Unit", "Period", measure, "Unit", "Currency"],
            ["A", "FY2025", "100", unit, currency],
        )
    )
    assert triples(cells) == {(label, "FY2025", "100")}


@pytest.mark.parametrize("header", ["Source Files", "Source Reference"])
def test_source_prefixed_headers_are_excluded_on_both_paths(header):
    cells = writer._segment_schedule_cells(
        table(["Business Unit", "Period", "Revenue", header], ["A", "FY2025", "100", "f.pdf"])
    )
    assert triples(cells) == {("A · Revenue", "FY2025", "100")}
    assert not writer._debt_property(header)
