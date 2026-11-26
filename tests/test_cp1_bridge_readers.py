"""The issuer library reads CP-1's EBITDA bridge under both headers and no other step table with an
Add-Back ID column. Synthetic tables; the expected values are written here, not computed."""

import pytest
from credit_os import store

OLD = ["Step", "Amount", "Reporting unit", "Basis and limitation"]
NEW = ["Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"]
ROWS = [
    ["Reported EBITDA", "100", "Not applicable", "US$m", "Reported."],
    ["Run-rate savings", "5", "AB-1", "US$m", "Management."],
    ["Adjusted EBITDA", "105", "Not applicable", "US$m", "Adjusted."],
]


def _table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [f"| {' | '.join(headers)} |", "|" + "---|" * len(headers)]
    return "\n".join([*lines, *(f"| {' | '.join(r)} |" for r in rows)])


def _fields(heading: str, headers: list[str], rows: list[list[str]]) -> dict:
    text = f"## Findings\n\n### {heading}\n\n{_table(headers, rows)}\n"
    return store.reader_fields(store.sections_of(text))


def _without_id(rows: list[list[str]]) -> list[list[str]]:
    return [[*r[:2], *r[3:]] for r in rows]


def test_both_headers_draw_the_same_waterfall_from_the_amount_column_alone():
    heading = "Chart data: EBITDA bridge"
    new = _fields(heading, NEW, ROWS)["charts"]
    old = _fields(heading, OLD, _without_id(ROWS))["charts"]
    assert [(c["kind"], c["amount"], c["columns"], c["unit"]) for c in new] == [
        ("waterfall", 1, [1], "US$m")
    ]
    assert [(c["kind"], c["amount"], c["columns"], c["unit"]) for c in old] == [
        ("waterfall", 1, [1], "US$m")
    ]


def test_an_id_in_the_value_position_does_not_become_a_value():
    rows = [[*r[:2], "7", *r[3:]] for r in ROWS]
    charts = _fields("Chart data: EBITDA bridge", NEW, rows)["charts"]
    assert [c["columns"] for c in charts] == [[1]]


@pytest.mark.parametrize(
    "heading", ["Chart data: liquidity bridge", "Chart data: value allocation — scenario 1"]
)
def test_another_step_table_with_an_add_back_id_column_is_not_drawn(heading):
    assert _fields(heading, NEW, ROWS)["charts"] == []
    assert _fields(heading, OLD, _without_id(ROWS))["charts"] != []


def test_the_bridge_with_a_wrong_unit_is_still_refused_under_the_new_header():
    rows = [[*r[:3], "EUR", *r[4:]] for r in ROWS]
    assert _fields("Chart data: EBITDA bridge", NEW, rows)["charts"] == []
