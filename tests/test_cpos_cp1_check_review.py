"""Review fixes for the CP-1 check: gaps never read as zero, grouped numbers, T4.18 register
errors and one row reader for the check and the forecast. Hand-written synthetic inputs."""

import pytest

from deploy_workflow.owners import cpos_cp1_check as check
from deploy_workflow.owners import cpos_forecast
from tests.test_cpos_cp1_check import CASH_FLOW, build, table

GAP = "Not supplied: not disclosed"


def _sum_issues(text: str) -> list[str]:
    return [i for i in check.cp1_issues(text) if "add to" in i]


def test_optional_row_that_is_a_gap_skips_the_cash_flow_identity():
    # 2,045 - 2,441 + 3,171 = 2,775; Net Cash Change 2,789 differs by the undisclosed FX effect.
    flow = {**CASH_FLOW, "FX Effect on Cash": (GAP, "12")}
    assert _sum_issues(build(cash_flow=flow)) == []


def test_optional_row_that_is_stated_still_checks_the_identity():
    flow = {**CASH_FLOW, "FX Effect on Cash": ("15", "12")}
    assert any("FX Effect on Cash 15" in i for i in _sum_issues(build(cash_flow=flow)))


def test_absent_optional_row_is_left_out_of_the_identity():
    flow = {k: v for k, v in CASH_FLOW.items() if k != "FX Effect on Cash"}
    assert any("add to 2,775" in i for i in _sum_issues(build(cash_flow=flow)))


@pytest.mark.parametrize("cell", ["1,5", "12,34,5", "1,2345", ",123", "1,23"])
def test_mis_grouped_figure_is_not_a_plain_number(cell):
    assert check._number(cell) is None


@pytest.mark.parametrize(
    ("cell", "value"), [("1,234", "1234"), ("12,345,678", "12345678"), ("-0.5", "-0.5"), ("7", "7")]
)
def test_grouped_in_threes_or_ungrouped_is_a_plain_number(cell, value):
    assert str(check._number(cell)) == value


def test_two_places_pattern_refuses_mis_grouping():
    assert check._TWO_PLACES.fullmatch("1,234.56")
    assert check._TWO_PLACES.fullmatch("1,5.00") is None


_REGISTER_HEADER = ["Instrument", "Type", "Asset type"]


def _t418(*tables: str) -> str:
    return "## Findings\n" + "\n\n".join(tables) + "\n"


def test_duplicated_register_is_reported_when_asset_type_is_required():
    one = table("T4.18 Debt instruments", _REGISTER_HEADER, [["Synthetic loan", "Term", "banana"]])
    issues = check.cp1_issues(_t418(one, one), require_asset_type=True)
    assert any(i.startswith("T4.18: ") and "2 T4.18 registers" in i for i in issues)


def test_malformed_register_is_reported_when_asset_type_is_required():
    bad = table("T4.18 Debt instruments", _REGISTER_HEADER, [["Synthetic loan", "banana"]])
    issues = check.cp1_issues(_t418(bad), require_asset_type=True)
    assert any(i.startswith("T4.18: ") for i in issues)


def test_missing_register_or_not_required_stays_silent():
    assert not [i for i in check.cp1_issues(_t418(), require_asset_type=True) if "T4.18" in i]
    one = table("T4.18 Debt instruments", _REGISTER_HEADER, [["Synthetic loan", "Term", "banana"]])
    assert not [i for i in check.cp1_issues(_t418(one, one)) if "T4.18" in i]


def test_forecast_reads_a_row_without_a_closing_pipe():
    text = (
        "| Line item | FY2024 | FY2023 | Unit | Basis | Source |\n"
        "| --- | --- | --- | --- | --- | --- |\n"
        "| EBITDA (Reported) | 3,813 | 3,148 | USD millions | Synthetic. | 10-K\n"
    )
    assert cpos_forecast._tables(text) == [
        [
            ["Line item", "FY2024", "FY2023", "Unit", "Basis", "Source"],
            ["EBITDA (Reported)", "3,813", "3,148", "USD millions", "Synthetic.", "10-K"],
        ]
    ]
