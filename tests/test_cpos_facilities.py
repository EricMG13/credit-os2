"""CP-2G facility schedule: stated terms to interest and repayment (hand-computed answer key)."""

import json
from dataclasses import replace
from decimal import Decimal
from fractions import Fraction

import pytest
from pydantic import ValidationError

from deploy_workflow.owners import cp2g
from deploy_workflow.owners.cpos_facilities import Facility, schedule

D = Decimal
A = {
    "name": "Notes",
    "balance": "400",
    "fixed_rate_pct": "6.00",
    "spread_pct": None,
    "floor_pct": None,
    "reference_rate": None,
    "annual_amortisation": "20",
    "maturity": None,
}
B = {
    "name": "Term loan",
    "balance": "150",
    "fixed_rate_pct": None,
    "spread_pct": "3.00",
    "floor_pct": "1.00",
    "reference_rate": ["0.04", "0.03", "0.005"],
    "annual_amortisation": None,
    "maturity": None,
}


def test_schedule_matches_the_answer_key():
    s = schedule([Facility(**A), Facility(**B)])
    assert s.totals() == ((D("34.5"), D("20")), (D("31.8"), D("20")), (D("27.6"), D("20")))
    assert [y.rate for y in s.rows[1]] == [D("0.07"), D("0.06"), D("0.04")]
    assert [y.closing for y in s.rows[0]] == [D("380"), D("360"), D("340")]


def test_amortisation_never_takes_a_balance_below_zero():
    s = schedule([Facility(**{**A, "balance": "30"})])
    assert [y.repaid for y in s.rows[0]] == [D("20"), D("10"), D("0")]


@pytest.mark.parametrize(
    "change",
    [
        {"fixed_rate_pct": None},  # no rate at all
        {"spread_pct": "3.00"},  # fixed and floating together
        {"fixed_rate_pct": None, "spread_pct": "3.00"},  # spread without a reference rate
        {"fixed_rate_pct": "31"},
        {"fixed_rate_pct": "6.00001"},
        {"balance": "-1"},
        {"name": ""},
        {"floor_pct": "1.00"},  # floor without a spread
        {"fixed_rate_pct": None, "spread_pct": "21", "reference_rate": ["0.04", "0.03", "0.005"]},
        {
            "fixed_rate_pct": None,
            "spread_pct": "3",
            "floor_pct": "11",
            "reference_rate": ["0.04", "0.03", "0.005"],
        },
        {"maturity": "2030-13-01"},
    ],
)
def test_a_row_that_is_not_one_rate_form_is_refused(change):
    with pytest.raises(ValidationError):
        Facility(**{**A, **change})


# --- the engine takes a schedule (Task 2) ------------------------------------------------------
# Copied from tests/test_cpos_launch.py (BASE, PATHS): tests is not a package, so not importable.
_BASE = {
    "revenue": "1000",
    "ebitda": "300",
    "interest": "36",
    "taxes": "20",
    "wc": "10",
    "capex": "40",
    "fcf": "194",
    "debt": "600",
    "cash": "100",
    "undrawn": "50",
}
_PATHS = {
    "revenue_growth": ("0.05", "0.04", "0.03"),
    "ebitda_margin": ("0.30", "0.31", "0.32"),
    "capex_pct_revenue": ("0.04", "0.04", "0.04"),
    "tax_wc_pct_revenue": ("0.10", "0.10", "0.10"),
    "interest_rate": ("0.06", "0.06", "0.06"),
    "dividends": ("20", "20", "20"),
    "debt_repayment": ("50", "50", "50"),
}
OPERANDS = cp2g.Operands(**{k: cp2g.Val(D(v), None) for k, v in _BASE.items()})
DRIVERS = cp2g.Drivers(**{k: tuple(D(x) for x in v) for k, v in _PATHS.items()})
TOTALS = ((D("34.5"), D("20")), (D("31.8"), D("20")), (D("27.6"), D("20")))


def test_scheduled_interest_and_repayment_replace_the_two_drivers():
    years = cp2g.forecast(operands=OPERANDS, drivers=DRIVERS, shock=None, schedule=TOTALS).years
    assert [y.interest.amount for y in years] == [D("34.5"), D("31.8"), D("27.6")]
    assert [y.closing_debt.amount for y in years] == [D("580"), D("560"), D("540")]


def test_scheduled_year_one_free_cash_flow_and_cash():
    y = cp2g.forecast(operands=OPERANDS, drivers=DRIVERS, shock=None, schedule=TOTALS).years[0]
    revenue = Fraction(1000) * (1 + Fraction("0.05"))
    fcf = (
        revenue * Fraction("0.30")
        - Fraction("34.5")
        - revenue * Fraction("0.10")
        - revenue * Fraction("0.04")
    )
    assert Fraction(y.fcf.amount) == fcf
    assert Fraction(y.closing_cash.amount) == 100 + fcf - 20 - 20


def test_the_downside_rate_increase_scales_scheduled_interest():
    years = cp2g.forecast(
        operands=OPERANDS, drivers=DRIVERS, shock=(D("0"), D("0.10")), schedule=TOTALS
    ).years
    assert [y.interest.amount for y in years] == [D("37.95"), D("34.98"), D("30.36")]


def test_no_schedule_uses_the_two_drivers():
    year = cp2g.forecast(operands=OPERANDS, drivers=DRIVERS, shock=None, schedule=None).years[0]
    assert year.interest.amount == D("36")  # 600 x 0.06
    assert year.closing_debt.amount == D("550")  # 600 - 50


def test_missing_base_debt_stays_missing_with_its_reason():
    ops = replace(OPERANDS, debt=cp2g.Val(None, "why"))
    y = cp2g.forecast(operands=ops, drivers=DRIVERS, shock=None, schedule=TOTALS).years[0]
    assert (y.interest.amount, y.interest.reason) == (None, "why")
    assert y.closing_debt.amount is None


# --- the inputs block states facilities (Task 3) ------------------------------------------------
# A local builder modelled on forecast_block in tests/test_cpos_launch.py (not importable).
_CP1 = " ".join(_BASE.values()) + " 400 150 6.00% 3.00% 1.00%"


def _block(**changes) -> bytes:
    inputs = {
        "schema_version": "cpos-forecast-inputs/1",
        "base": {k: {"amount": v, "reason": None} for k, v in _BASE.items()},
        "base_drivers": {
            name: {
                "values": list(v),
                "category": "Analyst Interpretation",
                "rationale": "Synthetic.",
                "limitation": None,
            }
            for name, v in _PATHS.items()
        },
        "downside_shock": {"ebitda_decline": "0.20", "rate_increase": "0.10"},
        "years": [
            {"year": 2025 + i, "start": f"{2025 + i}-04-01", "end": f"{2026 + i}-03-31"}
            for i in range(3)
        ],
        "scope_limits": ["Synthetic; not analytical review."],
        **changes,
    }
    return (
        f"### Forecast inputs (machine-readable)\n\n```json\n{json.dumps(inputs)}\n```\n".encode()
    )


def _exact(cp1: str = _CP1, **changes) -> dict:
    from deploy_workflow.owners.cpos_forecast import model_files

    return json.loads(model_files(cp1.encode(), _block(**changes))["forecast_exact.json"])


def _refusal(cp1: str = _CP1, source: str = "CP-2G", **changes) -> str:
    from deploy_workflow.owners import cpos_forecast

    with pytest.raises(ValueError) as caught:
        cpos_forecast.parse(_block(**changes).decode(), cp1, source)
    return str(caught.value)


def test_a_block_with_facilities_publishes_the_answer_key():
    exact = _exact(facilities=[A, B])
    ref = exact["outputs"]["REFERENCE"]["years"]
    # 50 of base debt is outside the facilities and bears the analyst's 6%: 3 on top of 34.5 etc.
    assert [D(y["interest"]["amount"]) for y in ref] == [D("37.5"), D("34.8"), D("30.6")]
    assert [D(y["closing_debt"]["amount"]) for y in ref] == [D("580"), D("560"), D("540")]
    assert D(exact["unallocated_debt"]["amount"]) == D("50")
    assert exact["unallocated_debt"]["reason"] is None
    assert D(exact["facility_schedule"][1]["years"][2]["rate"]) == D("0.04")
    assert exact["facility_schedule"][1]["years"][2]["year"] == 2027
    assert [f["name"] for f in exact["facility_schedule"]] == ["Notes", "Term loan"]
    assert exact["facilities"][0]["balance"] == "400"
    limits = exact["scope_limits"]
    assert limits[1] == "Synthetic; not analytical review."
    assert limits[2] == (
        "Cash interest on the stated facilities and scheduled repayment are computed from the "
        "facility terms the CP-2G handoff stated; the analyst's repayment assumption is not used."
    )
    assert limits[3] == (
        "Debt of 50 is not in a stated facility; it bears interest at the analyst's assumed rate "
        "and is not repaid in this forecast."
    )


def _interest(exact: dict, case: str) -> list[Decimal]:
    return [D(y["interest"]["amount"]) for y in exact["outputs"][case]["years"]]


def test_debt_outside_the_facilities_bears_the_analyst_rate_in_every_case():
    exact = _exact(
        facilities=[A, B],
        downside_drivers={"interest_rate": {**_driver("interest_rate"), "values": ["0.08"] * 3}},
    )
    assert _interest(exact, "REFERENCE") == [D("37.5"), D("34.8"), D("30.6")]
    # Ruling 2026-11-13: the shock (k = 0.1) sits on the downside drivers, so the unallocated 50
    # bears the downside's 0.08: (34.5 + 50 x 0.08) x 1.1 = 42.35, and the same on the later years.
    # Before the ruling the shock sat on base drivers: [41.25, 38.28, 33.66].
    assert _interest(exact, "DOWNSIDE") == [D("42.35"), D("39.38"), D("34.76")]
    assert _interest(exact, "DOWNSIDE_DRIVERS") == [D("38.5"), D("35.8"), D("31.6")]


def test_no_remainder_adds_no_interest():
    # hand-computed on opening balances: 400 at 6% + 200 at 7%/6%/4%, A amortising 20 a year
    rows = [A, {**B, "balance": "200"}]
    exact = _exact(_CP1 + " 200", facilities=rows)
    assert _interest(exact, "REFERENCE") == [D("38"), D("34.8"), D("29.6")]


def test_balances_above_base_debt_add_no_remainder_interest():
    rows = [{**A, "balance": "500"}, {**B, "balance": "150"}]
    exact = _exact(_CP1 + " 500", facilities=rows)
    # 500 at 6% (480, 460 after amortisation) + 150 at 7%/6%/4%
    assert _interest(exact, "REFERENCE") == [D("40.5"), D("37.8"), D("33.6")]


def test_a_block_without_facilities_publishes_no_facility_key():
    # The handoff text differs (null vs absent), so its hash in `consumed` does; all else is equal.
    from deploy_workflow.owners.cpos_forecast import model_files

    cp1 = _CP1.encode()
    plain = json.loads(model_files(cp1, _block())["forecast_exact.json"])
    nulled = json.loads(model_files(cp1, _block(facilities=None))["forecast_exact.json"])
    plain["consumed"] = nulled["consumed"] = None
    assert plain == nulled
    assert b"facilit" not in model_files(cp1, _block())["forecast_exact.json"]
    assert plain["scope_limits"][1:] == ["Synthetic; not analytical review."]


def test_missing_base_debt_says_so():
    base = {k: {"amount": v, "reason": None} for k, v in _BASE.items()}
    base["debt"] = {"amount": None, "reason": "CP-1 gives no debt"}
    exact = _exact(base=base, facilities=[A])
    assert exact["unallocated_debt"] == {"amount": None, "reason": "CP-1 gives no debt"}
    assert (
        "Base debt is missing, so debt outside the stated facilities is not known."
        in exact["scope_limits"]
    )


@pytest.mark.parametrize(
    "rows, cp1, message",
    [
        (
            [{**A, "fixed_rate_pct": "6.0"}],
            _CP1,
            "CP-2G: facility Notes fixed_rate_pct 6.0% is not printed in CP-1",
        ),
        (
            [{**A, "balance": "999"}],
            _CP1,
            "CP-2G: facility Notes balance 999 is not printed in CP-1",
        ),
        (
            [B, {**B, "name": "T2", "floor_pct": "2.50"}],
            _CP1,
            "CP-2G: facility T2 floor_pct 2.50% is not printed in CP-1",
        ),
        (
            [{**A, "balance": "400000"}],
            _CP1 + " 400000",
            (
                "CP-2G: facility balances total 400000, more than 1.25 times base debt 600; "
                "check the unit"
            ),
        ),
    ],
)
def test_refusals(rows, cp1, message):
    assert _refusal(cp1, facilities=rows) == message


def test_the_balance_check_is_one_and_a_quarter_inclusive():
    exact = _exact(_CP1 + " 750", facilities=[{**A, "balance": "750"}])
    assert D(exact["unallocated_debt"]["amount"]) == D("-150")
    assert "more than 1.25 times" in _refusal(_CP1 + " 751", facilities=[{**A, "balance": "751"}])


@pytest.mark.parametrize("case", ["upside_drivers", "downside_drivers"])
def test_a_case_override_of_debt_repayment_is_refused(case):
    override = {"debt_repayment": {**_driver("debt_repayment")}}
    message = _refusal(facilities=[A], **{case: override})
    assert message == (
        f"CP-2G: {case} states debt_repayment, which is not used when facilities are stated"
    )


@pytest.mark.parametrize("case", ["upside_drivers", "downside_drivers"])
def test_a_case_override_of_interest_rate_is_accepted_with_facilities(case):
    assert _exact(facilities=[A], **{case: {"interest_rate": _driver("interest_rate")}})


def _driver(name: str) -> dict:
    return {
        "values": list(_PATHS[name]),
        "category": "Analyst Interpretation",
        "rationale": "Synthetic.",
        "limitation": None,
    }


def test_a_case_override_of_another_driver_is_allowed_with_facilities():
    exact = _exact(facilities=[A], upside_drivers={"dividends": _driver("dividends")})
    assert "UPSIDE" in exact["outputs"]


def test_cp1s_layer1_block_states_no_facilities():
    message = _refusal(source="CP-1", downside_shock=None, facilities=[A])
    assert message == "CP-1: a layer-1 forecast states no facilities"


def test_duplicate_names_are_refused():
    assert "facility names must be unique" in _refusal(facilities=[A, {**B, "name": "Notes"}])


def test_a_facility_name_is_trimmed_and_unique_ignoring_case_and_edges():
    for name in (" Notes", "Notes ", "   "):
        with pytest.raises(ValidationError, match="must not start or end with whitespace"):
            Facility(**{**A, "name": name})
    assert "facility names must be unique" in _refusal(facilities=[B, {**B, "name": "TERM LOAN"}])


@pytest.mark.parametrize(
    "rows, bound",
    [
        ([], "facilities: Tuple should have at least 1 item"),
        ([{**A, "name": f"F{i}"} for i in range(41)], "facilities: Tuple should have at most 40"),
    ],
)
def test_one_to_forty_facilities(rows, bound):
    assert bound in _refusal(facilities=rows)


MATURES_2026 = (
    "Notes matures in FY2026 and is assumed refinanced; no repayment at maturity is modelled."
)


def test_a_maturity_inside_the_forecast_is_named():
    limits = _exact(facilities=[{**A, "maturity": "2026-09-30"}])["scope_limits"]
    assert MATURES_2026 in limits


def test_a_maturity_before_the_forecast_is_named_in_the_first_year_and_a_late_one_is_not():
    rows = [
        {**A, "maturity": "2020-01-01"},
        {**B, "maturity": "2028-03-31"},
    ]
    limits = _exact(facilities=rows)["scope_limits"]
    assert (
        "Notes has a stated maturity of 2020-01-01, before the forecast; it is assumed "
        "refinanced and no repayment at maturity is modelled." in limits
    )
    assert (
        "Term loan matures in FY2027 and is assumed refinanced; "
        "no repayment at maturity is modelled." in limits
    )
    after = _exact(facilities=[{**A, "maturity": "2028-04-01"}])["scope_limits"]
    assert not any("matures in" in s for s in after)


def test_a_maturity_is_a_dated_form_only():
    with pytest.raises(ValidationError):
        Facility(**{**A, "maturity": "20300101"})


def test_a_maturity_that_is_not_a_calendar_date_names_the_field():
    with pytest.raises(ValidationError, match="maturity 2030-13-01 is not a calendar date"):
        Facility(**{**A, "maturity": "2030-13-01"})


# --- fix round 1 --------------------------------------------------------------------------------
def test_scheduled_repayments_above_base_debt_are_refused():
    row = {**A, "balance": "700", "annual_amortisation": "300"}
    message = _refusal(_CP1 + " 700", facilities=[row])
    assert message == "CP-2G: scheduled repayments total 700, more than base debt 600"


def test_scheduled_repayments_equal_to_base_debt_are_accepted():
    row = {**A, "balance": "700", "annual_amortisation": "200"}
    exact = _exact(_CP1 + " 700", facilities=[row])
    assert D(exact["unallocated_debt"]["amount"]) == D("-100")


def test_balances_above_base_debt_name_the_excess_in_a_scope_limit():
    rows = [{**A, "balance": "500"}, {**B, "balance": "150"}]
    exact = _exact(_CP1 + " 500", facilities=rows)
    assert D(exact["unallocated_debt"]["amount"]) == D("-50")
    limits = exact["scope_limits"]
    assert limits[3] == (
        "Stated facility balances exceed base debt by 50; interest is computed on the stated "
        "balances."
    )


@pytest.mark.parametrize(
    "reference, year, rate",
    [(["1", "1", "1"], 1, "1.03"), (["0.04", "0.5", "0.04"], 2, "0.53")],
)
def test_a_floating_all_in_rate_above_thirty_percent_is_refused(reference, year, rate):
    with pytest.raises(ValidationError) as caught:
        Facility(**{**B, "floor_pct": None, "reference_rate": reference})
    assert (
        f"all-in rate {rate} in forecast year {year} is outside 0 to 0.30; reference_rate is a "
        "decimal fraction (0.04 is 4%)"
    ) in str(caught.value)


def test_a_negative_all_in_rate_is_refused_and_a_negative_reference_rate_above_zero_is_not():
    with pytest.raises(ValidationError, match="all-in rate -0.47 in forecast year 1 is outside"):
        Facility(**{**B, "floor_pct": None, "reference_rate": ["-0.5", "-0.5", "-0.5"]})
    ok = Facility(**{**B, "floor_pct": None, "reference_rate": ["-0.01", "0", "0.27"]})
    assert [y.rate for y in schedule([ok]).rows[0]] == [D("0.02"), D("0.03"), D("0.30")]


def test_a_rate_term_is_a_printed_percent():
    # "6.00" appears in CP-1 only as part of 16.00 and as a bare number: neither is a percent
    for cp1 in (_CP1.replace("6.00%", "16.00%"), _CP1.replace("6.00%", "6.00")):
        assert "fixed_rate_pct 6.00% is not printed" in _refusal(cp1, facilities=[A])
    spaced = _CP1.replace("6.00%", "6.00 %")
    assert _exact(spaced, facilities=[A])["facilities"][0]["fixed_rate_pct"] == "6.00"


def test_forecast_states_exactly_three_schedule_pairs():
    with pytest.raises(ValueError, match="exactly three"):
        cp2g.forecast(operands=OPERANDS, drivers=DRIVERS, shock=None, schedule=TOTALS[:2])


def test_a_block_without_facilities_is_byte_identical_to_main():
    import hashlib

    from deploy_workflow.owners.cpos_forecast import model_files

    doc = {
        "schema_version": "cpos-forecast-inputs/1",
        "base": {k: {"amount": v, "reason": None} for k, v in _BASE.items()},
        "base_drivers": {n: _driver(n) for n in _PATHS},
        "downside_shock": {"ebitda_decline": "0.20", "rate_increase": "0.10"},
        "upside_drivers": {
            "revenue_growth": {**_driver("revenue_growth"), "values": ["0.07", "0.06", "0.05"]}
        },
        "years": [
            {"year": 2025 + i, "start": f"{2025 + i}-04-01", "end": f"{2026 + i}-03-31"}
            for i in range(3)
        ],
        "scope_limits": ["Synthetic; not analytical review."],
    }
    handoff = f"### Forecast inputs (machine-readable)\n\n```json\n{json.dumps(doc)}\n```\n"
    files = model_files(" ".join(_BASE.values()).encode(), handoff.encode())
    digest = hashlib.sha256()
    for name in sorted(files):
        digest.update(name.encode())
        digest.update(files[name])
    assert digest.hexdigest() == "e5017389abc2c878a0b0bae323a50bcbadf35c3a08f676f277c1505b9d047089"


# --- boundaries carried from review -------------------------------------------------------------
def test_a_floating_all_in_rate_of_exactly_zero_and_of_exactly_thirty_percent_is_accepted():
    zero = Facility(**{**B, "floor_pct": None, "reference_rate": ["-0.03", "-0.03", "-0.03"]})
    assert [y.rate for y in schedule([zero]).rows[0]] == [D("0")] * 3
    top = Facility(**{**B, "floor_pct": None, "reference_rate": ["0.27", "0.27", "0.27"]})
    assert [y.rate for y in schedule([top]).rows[0]] == [D("0.30")] * 3


def test_balances_equal_to_base_debt_state_zero_unallocated_and_no_limit_either_way():
    rows = [{**A, "balance": "450"}, {**B, "balance": "150"}]
    exact = _exact(_CP1 + " 450", facilities=rows)
    assert D(exact["unallocated_debt"]["amount"]) == 0
    assert exact["unallocated_debt"]["reason"] is None
    assert not any("is not in a stated facility" in s for s in exact["scope_limits"])
    assert not any("exceed base debt" in s for s in exact["scope_limits"])


def test_a_maturity_on_the_first_forecast_years_start_is_inside_the_forecast():
    limits = _exact(facilities=[{**A, "maturity": "2025-04-01"}])["scope_limits"]
    assert (
        "Notes matures in FY2025 and is assumed refinanced; no repayment at maturity is modelled."
        in limits
    )
    assert not any("before the forecast" in s for s in limits)


# --- the forecast instruction matches the parser (parked finding a, owner "fix all") ---
# Live: CP-1 wrote `dividends.values = ["4348", null, null]`; the parser takes only
# three figures per driver, or every driver `[null, null, null]` (the method declines).
def _driver_texts() -> dict[str, str]:
    from deploy_workflow.owners import cpos_launch

    forecast = cpos_launch.FORECAST_BLOCK
    return {
        "CP-2G": forecast[forecast.index("Drivers: give a value") :],
        "CP-1": cpos_launch.LAYER1_FORECAST_BLOCK,
    }


_ZERO = 'no declared or scheduled payment is `"0"`'
_DECLINE = "if a driver has no anchor, every driver's `values` is `[null, null, null]`"


@pytest.mark.parametrize("module", ["CP-2G", "CP-1"])
def test_the_driver_instruction_allows_no_single_null_driver(module):
    text = " ".join(_driver_texts()[module].split())
    assert "Leave a driver's values null" not in text  # the sentence that read as permission
    assert "Never write null for one driver or year" in text
    assert _DECLINE in text


def test_cp1_states_the_zero_year_before_the_decline_rule_and_cp2g_has_no_zero_rule():
    cp1 = " ".join(_driver_texts()["CP-1"].split())
    assert _ZERO in cp1 and "`limitation` says so" in cp1
    assert "repeat no one-off payment" in cp1
    assert cp1.index(_ZERO) < cp1.index(_DECLINE)  # a no-payment year is not "no anchor"
    # CP-2G's method says to use null, not zero, for an unsupported amount.
    cp2g_text = " ".join(_driver_texts()["CP-2G"].split())
    assert _ZERO not in cp2g_text and "one-off payment" not in cp2g_text


def test_the_parser_takes_three_figures_or_a_declined_block_and_no_part_null_driver():
    from deploy_workflow.owners import cpos_forecast

    assert cpos_forecast.parse(_block().decode(), _CP1).base_drivers
    declined = {name: {**_block_driver(), "values": [None, None, None]} for name in _PATHS}
    with pytest.raises(ValueError, match="no forecast drivers"):
        cpos_forecast.parse(_block(base_drivers=declined).decode(), _CP1)
    part = {name: {**_block_driver(), "values": list(v)} for name, v in _PATHS.items()}
    part["dividends"]["values"] = ["4348", None, None]
    with pytest.raises(ValueError, match="base_drivers.dividends.values.1"):
        cpos_forecast.parse(_block(base_drivers=part).decode(), _CP1)


def _block_driver() -> dict:
    return {"category": "Analyst Interpretation", "rationale": "Synthetic.", "limitation": None}


# --- a facility in another currency than the block's (PR 46 review F1, 2026-11-16) ---------------
# docs/rulings/2026-11-16-reporting-currency-from-sources.md: T4.18 prints each instrument's
# amounts in its own currency, so a facility whose T4.18 `Currency` is not the block's `currency`
# is left out of `facilities` and its debt stays in the remainder at the `interest_rate` driver.
# Answer key fixed by the PR 2 controller: a GBP run, base debt 600; the GBP term loan's year-1
# interest is 250 x 6.00% = 15.00 and the unallocated debt 600 - 250 = 350.
_T418_HEADER = (
    "| Instrument | Type | Carrying Value | Principal | Drawn | Commitment | Security | Ranking | "
    "Currency | Reporting Currency Amount | FX Rate | Coupon or Margin | Rate Type | "
    "Reference Rate | Spread (bps) | Floor (bps) | Maturity | Annual Amortisation | Source |"
)
GBP_CP1 = (
    "### Base operands (GBP millions)\n\n| Base | FY2025 |\n| --- | --- |\n"
    + "".join(f"| {k} | {v} |\n" for k, v in _BASE.items())
    + "\n### T4.18 Debt instruments\n\n"
    + _T418_HEADER
    + "\n"
    + "| --- " * 19
    + "|\n"
    "| GBP term loan | Term loan | 250 | 250 | 250 | 250 | Secured | Senior | GBP | 250 | "
    "Not applicable | 6.00% | Fixed | Not applicable | Not applicable | Not applicable | "
    "2030-06-30 | 0 | AR p.86 |\n"
    "| EUR notes | Notes | 400 | 400 | 400 | 400 | Unsecured | Senior | EUR | 350 | "
    "0.875 GBP/EUR | 5.00% | Fixed | Not applicable | Not applicable | Not applicable | "
    "2031-06-30 | 0 | AR p.87; rate AR p.88 |\n"
)
GBP_TERM_LOAN = {**A, "name": "GBP term loan", "balance": "250", "annual_amortisation": None}
EUR_NOTES = {
    **A,
    "name": "EUR notes",
    "balance": "400",
    "fixed_rate_pct": "5.00",
    "annual_amortisation": None,
}


def _gbp_files(facilities: list[dict], cp1: str = GBP_CP1, currency: str = "GBP") -> dict:
    from deploy_workflow.owners import cpos_forecast

    block = _block(currency=currency, scale=1, facilities=facilities)
    return cpos_forecast.model_files(cp1.encode(), block)


def test_a_facility_in_another_currency_than_the_block_is_refused():
    with pytest.raises(ValueError) as caught:
        _gbp_files([GBP_TERM_LOAN, EUR_NOTES])
    message = str(caught.value)
    assert "EUR notes" in message and "EUR" in message.replace("EUR notes", "")


def test_the_same_block_with_only_the_gbp_facility_is_accepted():
    exact = json.loads(_gbp_files([GBP_TERM_LOAN])["forecast_exact.json"])
    assert exact["units"] == "GBP millions"
    (loan,) = exact["facility_schedule"]
    assert loan["name"] == "GBP term loan"
    assert D(loan["years"][0]["interest"]) == D("15.00")
    assert D(exact["unallocated_debt"]["amount"]) == D("350")
    assert not any("exceed base debt" in limit for limit in exact["scope_limits"])


@pytest.mark.parametrize("cell", ["GBP", "Pounds sterling (GBP)", "£"])
def test_a_t418_currency_that_reads_as_the_blocks_is_not_refused(cell):
    cp1 = GBP_CP1.replace(" | Senior | EUR | 350 | ", f" | Senior | {cell} | 350 | ")
    assert cp1 != GBP_CP1
    assert _gbp_files([GBP_TERM_LOAN, EUR_NOTES], cp1)


# Round 1 accepted these two (the cell states no code); PR 46 review M1's ruling refuses them: a
# row whose currency does not read as the block's makes every facility match a block-currency row.
@pytest.mark.parametrize("cell", ["Not supplied: the note does not say", ""])
def test_a_t418_currency_that_states_no_code_makes_its_facility_refused(cell):
    cp1 = GBP_CP1.replace(" | Senior | EUR | 350 | ", f" | Senior | {cell} | 350 | ")
    with pytest.raises(ValueError, match="`EUR notes`"):
        _gbp_files([GBP_TERM_LOAN, EUR_NOTES], cp1)


def test_the_currency_is_read_from_the_row_whose_instrument_is_the_facility_ignoring_case():
    with pytest.raises(ValueError) as caught:
        _gbp_files([GBP_TERM_LOAN, {**EUR_NOTES, "name": "eur NOTES"}])
    message = str(caught.value)
    assert "eur NOTES" in message and "`EUR`" in message


# --- the check fails closed (PR 46 review M1, 2026-11-16) ---------------------------------------
# Same ruling. When any T4.18 row's `Currency` does not read as the block's currency, every facility
# must be an instrument T4.18 prints in the block's currency, its name copied exactly (trimmed,
# casefolded, emphasis removed); otherwise it is refused, named, and falls to the remainder. Answer
# key fixed by the PR 2 controller; (a) and (b) above are unchanged.


def _refused_naming(name: str, facilities: list[dict], cp1: str = GBP_CP1) -> str:
    with pytest.raises(ValueError) as caught:
        _gbp_files(facilities, cp1)
    message = str(caught.value)
    assert f"`{name}`" in message, message
    return message


def test_c_a_facility_not_named_as_t418_prints_it_is_refused():
    renamed = {**EUR_NOTES, "name": "EUR notes due 2030"}
    _refused_naming("EUR notes due 2030", [GBP_TERM_LOAN, renamed])


def test_d_a_t418_instrument_named_otherwise_than_the_facility_is_refused():
    cp1 = GBP_CP1.replace("| EUR notes | Notes |", "| EUR notes (2030) | Notes |")
    assert cp1 != GBP_CP1
    _refused_naming("EUR notes", [GBP_TERM_LOAN, EUR_NOTES], cp1)


def test_e_a_currency_cell_that_is_no_iso_code_is_refused():
    cp1 = GBP_CP1.replace(" | Senior | EUR | 350 | ", " | Senior | Euro | 350 | ")
    assert cp1 != GBP_CP1
    _refused_naming("EUR notes", [GBP_TERM_LOAN, EUR_NOTES], cp1)


def test_f_the_blocks_own_loan_on_a_row_that_is_no_code_is_refused_beside_a_foreign_row():
    # The accepted cost: the term loan falls to the remainder at the `interest_rate` driver.
    cp1 = GBP_CP1.replace(" | Senior | GBP | 250 | ", " | Senior | Sterling | 250 | ")
    assert cp1 != GBP_CP1
    _refused_naming("GBP term loan", [GBP_TERM_LOAN], cp1)


GBP_ONLY_CP1 = GBP_CP1.split("| EUR notes |")[0]  # T4.18 holds the GBP term loan alone


def test_g_a_t418_all_in_the_blocks_currency_is_read_as_today():
    exact = json.loads(_gbp_files([GBP_TERM_LOAN], GBP_ONLY_CP1)["forecast_exact.json"])
    (loan,) = exact["facility_schedule"]
    assert D(loan["years"][0]["interest"]) == D("15.00")
    assert D(exact["unallocated_debt"]["amount"]) == D("350")


def test_h_a_usd_run_whose_t418_is_all_usd_accepts_a_facility_named_otherwise():
    cp1 = GBP_ONLY_CP1.replace("GBP", "USD")
    assert "| USD term loan |" in cp1 and "| Senior | USD | 250 |" in cp1 and "GBP" not in cp1
    loan = {**GBP_TERM_LOAN, "name": "Term loan B"}
    exact = json.loads(_gbp_files([loan], cp1, "USD")["forecast_exact.json"])
    assert exact["units"] == "USD millions"
    assert [f["name"] for f in exact["facility_schedule"]] == ["Term loan B"]
    assert D(exact["facility_schedule"][0]["years"][0]["interest"]) == D("15.00")


def test_a_name_matches_after_emphasis_is_removed():
    cp1 = GBP_CP1.replace("| GBP term loan | Term loan |", "| **GBP term loan** | Term loan |")
    assert cp1 != GBP_CP1
    loan = {**GBP_TERM_LOAN, "name": "gbp TERM loan"}  # a name with edge spaces is refused
    exact = json.loads(_gbp_files([loan], cp1)["forecast_exact.json"])
    assert D(exact["unallocated_debt"]["amount"]) == D("350")


# --- the run's currency is CP-1's money unit (final fix round 1, H1 and L1) -----------------------
# docs/rulings/2026-11-16-reporting-currency-from-sources.md: every check and label takes the
# currency from CP-1. The statements table makes CP-1's money unit `GBPm`; the answer key is the
# one above (GBP term loan 250 at 6.00%: year-1 interest 15.00, unallocated 350).
_GBP_STATEMENT = (
    "## Findings\n\n### T4.4 Income statement\n\n"
    "| Line item | FY2024 | Unit | Basis | Source |\n| --- | --- | --- | --- | --- |\n"
    "| EBITDA (Reported) | 300 | GBP millions | Reported. | AR p.10 |\n\n"
)
GBP_RUN_CP1 = _GBP_STATEMENT + GBP_CP1
GBP_RUN_ONLY_CP1 = _GBP_STATEMENT + GBP_ONLY_CP1
_DOLLAR_ROW = (
    "| Dollar notes | Notes | 125 | 125 | 125 | 125 | Unsecured | Senior | USD | 100 | "
    "0.80 GBP/USD | 7.00% | Fixed | Not applicable | Not applicable | Not applicable | "
    "2031-06-30 | 0 | AR p.87 |\n"
)
DOLLAR_NOTES = {**EUR_NOTES, "name": "Dollar notes", "balance": "125", "fixed_rate_pct": "7.00"}
FINANCING_ADJUSTMENT_ROW = (
    "| Financing cost adjustment | Adjustment | -5 | Not applicable | Not applicable | "
    "Not applicable | Not applicable | Not applicable | Not applicable | -5 | Not applicable | "
    "Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | "
    "Not applicable | Not applicable | AR p.86 |\n"
)


def _files(cp1: str, **changes) -> dict:
    from deploy_workflow.owners import cpos_forecast

    return cpos_forecast.model_files(cp1.encode(), _block(**changes))


def test_cp1_money_unit_is_what_this_fixture_reads_as():
    from deploy_workflow.owners.cpos_cp1_check import money_unit

    assert money_unit(GBP_RUN_CP1) == "GBPm"
    assert money_unit(GBP_CP1) is None


def test_h1_a_gbp_run_block_without_currency_accepts_the_gbp_facility():
    exact = json.loads(_files(GBP_RUN_ONLY_CP1, facilities=[GBP_TERM_LOAN])["forecast_exact.json"])
    (loan,) = exact["facility_schedule"]
    assert D(loan["years"][0]["interest"]) == D("15.00")
    assert D(exact["unallocated_debt"]["amount"]) == D("350")


def test_h1_a_gbp_run_block_without_currency_refuses_a_eur_facility():
    with pytest.raises(ValueError) as caught:
        _files(GBP_RUN_CP1, facilities=[GBP_TERM_LOAN, EUR_NOTES])
    message = str(caught.value)
    assert "`EUR notes`" in message and "`EUR`" in message and "`GBP`" in message, message


def test_h1_a_gbp_run_block_without_currency_refuses_a_usd_facility_at_its_usd_balance():
    cp1 = GBP_RUN_ONLY_CP1 + _DOLLAR_ROW
    with pytest.raises(ValueError) as caught:
        _files(cp1, facilities=[DOLLAR_NOTES])
    message = str(caught.value)
    assert "`Dollar notes`" in message and "`USD`" in message, message


def test_h1_a_block_stating_another_currency_than_cp1s_is_refused_naming_both():
    with pytest.raises(ValueError) as caught:
        _files(GBP_RUN_CP1, scale=1, currency="USD")
    message = str(caught.value)
    assert "`USD`" in message and "`GBP`" in message, message


def test_h1_the_units_label_of_a_gbp_run_is_gbp():
    exact = json.loads(_files(GBP_RUN_CP1, scale=1, currency="GBP")["forecast_exact.json"])
    assert exact["units"] == "GBP millions"


def test_h1_a_usd_run_without_currency_is_unchanged():
    usd = _GBP_STATEMENT.replace("GBP", "USD") + GBP_ONLY_CP1.replace("GBP", "USD")
    loan = {**GBP_TERM_LOAN, "name": "USD term loan"}
    exact = json.loads(_files(usd, facilities=[loan])["forecast_exact.json"])
    assert D(exact["facility_schedule"][0]["years"][0]["interest"]) == D("15.00")


def test_h1_with_no_currency_and_no_cp1_money_unit_a_mixed_t418_asks_for_currency():
    assert "Currency" in GBP_CP1  # GBP_CP1 has no statements: its money unit is unknown
    with pytest.raises(ValueError) as caught:
        _files(GBP_CP1, facilities=[GBP_TERM_LOAN])
    message = str(caught.value)
    assert "state `currency`" in message, message


def test_l1_a_usd_t418_with_the_financing_cost_adjustment_row_accepts_another_name():
    usd = GBP_ONLY_CP1.replace("GBP", "USD") + FINANCING_ADJUSTMENT_ROW
    loan = {**GBP_TERM_LOAN, "name": "Term loan B"}
    exact = json.loads(_gbp_files([loan], usd, "USD")["forecast_exact.json"])
    assert [f["name"] for f in exact["facility_schedule"]] == ["Term loan B"]


def test_l1_only_the_methods_adjustment_row_is_left_out_of_the_mode_decision():
    from deploy_workflow.owners import cpos_forecast

    other = FINANCING_ADJUSTMENT_ROW.replace("Financing cost adjustment", "Other adjustment")
    usd = GBP_ONLY_CP1.replace("GBP", "USD")
    assert cpos_forecast._t418_rows(usd + FINANCING_ADJUSTMENT_ROW) == [("usd term loan", "USD")]
    assert cpos_forecast._t418_rows(usd + other)[-1] == ("other adjustment", None)
    loan = {**GBP_TERM_LOAN, "name": "Term loan B"}
    with pytest.raises(ValueError):  # a no-code cell of any other row still fails closed
        _gbp_files([loan], usd + other, "USD")
