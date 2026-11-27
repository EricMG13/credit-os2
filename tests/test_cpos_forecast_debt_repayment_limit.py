"""Offline CP-OS model-file regressions using synthetic CP-1 and CP-2G handoffs."""

import json

import pytest
from test_cpos_forecast_review import _block, _cp1

from deploy_workflow.owners.cp2g import AnalystDebtOverpayment
from deploy_workflow.owners.cpos_forecast import model_files

_PERIOD = "2025-06-30"


def _model_files(
    repayments: list[str], *, case_field: str = "base_drivers", missing_debt: bool = False
) -> dict[str, bytes]:
    handoff = _block(_PERIOD, 2026)
    before, payload, after = handoff.split("```")
    document = json.loads(payload.removeprefix("json\n"))
    driver = {**document["base_drivers"]["debt_repayment"], "values": repayments}
    document.setdefault(case_field, {})["debt_repayment"] = driver
    if missing_debt:
        document["base"]["debt"] = {"amount": None, "reason": "Debt was not disclosed."}
    source = f"{before}```json\n{json.dumps(document)}\n```{after}"
    return model_files(_cp1(_PERIOD, "twelve").encode(), source.encode())


@pytest.mark.parametrize(
    ("repayments", "year"),
    [(["601", "0", "0"], 1), (["400", "201", "0"], 2)],
)
def test_analyst_repayment_above_known_opening_debt_is_refused(
    repayments: list[str], year: int
) -> None:
    with pytest.raises(
        AnalystDebtOverpayment,
        match=f"forecast year {year}: repayment exceeds the opening debt balance",
    ):
        _model_files(repayments)


@pytest.mark.parametrize("case_field", ["upside_drivers", "downside_drivers"])
def test_scenario_specific_overpayment_is_refused(case_field: str) -> None:
    with pytest.raises(
        AnalystDebtOverpayment,
        match="forecast year 3: repayment exceeds the opening debt balance",
    ):
        _model_files(["100", "200", "300.0001"], case_field=case_field)


def test_repayment_equal_to_opening_debt_leaves_zero_debt_and_later_interest() -> None:
    files = _model_files(["400", "200", "0"])
    years = json.loads(files["forecast_exact.json"])["outputs"]["REFERENCE"]["years"]
    assert [year["closing_debt"]["amount"] for year in years] == ["200", "0", "0"]
    assert [year["interest"]["amount"] for year in years] == ["36", "12", "0"]


def test_unknown_opening_debt_remains_unknown() -> None:
    files = _model_files(["601", "0", "0"], missing_debt=True)
    years = json.loads(files["forecast_exact.json"])["outputs"]["REFERENCE"]["years"]
    assert years[0]["repayment"]["amount"] == "601"
    missing = {"amount": None, "reason": "Debt was not disclosed."}
    assert [year["opening_debt"] for year in years] == [missing, missing, missing]
    assert [year["closing_debt"] for year in years] == [missing, missing, missing]
    assert [year["interest"] for year in years] == [missing, missing, missing]
