"""C11 fix round 1: four false verdicts of the live method-script checks (CP-3C, CP-1 T4.8,
CP-1B T4.6 and T4.4). SYNTHETIC handoffs; every expected value is worked by hand in its comment."""

import pytest
from test_method_scripts import FUNDING, LINES, cp1, cp3c, replaced, statuses
from test_method_scripts_rest import cp1b, cp1b_by

from deploy_workflow import method_scripts as ms

# --- C11-1: CP-3C, a facility cell the totals need that cannot be read ----------------------------


def run3c(**cells):
    return {
        o.figure: o
        for o in ms.run("CP-3C", cp3c(funding=replaced(FUNDING, "Facility: RCF", **cells)))
    }


@pytest.mark.parametrize(
    ("cell", "column"), [("drawn", "Drawn"), ("amount", "Amount"), ("years", "Years")]
)
def test_an_unread_cell_of_a_counted_facility_makes_its_totals_not_checked(cell, column):
    # RCF is committed; its cell is blank. Cash 220 alone would be a reduced total (stated 470):
    # Maturities due (300 + 450 = 750) is unaffected and agrees.
    out = run3c(**{cell: "—"})
    assert out["Maturities due"].status == "agreed"
    for line in ("Available liquidity", "Funding gap"):
        assert out[line].status == "not checked", line
        assert "RCF" in out[line].reason and column in out[line].reason, out[line].reason
    assert ms.issues("CP-3C", cp3c(funding=replaced(FUNDING, "Facility: RCF", **{cell: "—"}))) == ()


def test_facility_totals_regression_pins():
    assert statuses(ms.run("CP-3C", cp3c())) == dict.fromkeys(LINES, "agreed")
    # an uncommitted line needs no cell: its blank Drawn changes nothing (470 and 200 stand)
    funding = replaced(FUNDING, "Facility: Uncommitted line", drawn="—")
    assert statuses(ms.run("CP-3C", cp3c(funding=funding))) == dict.fromkeys(LINES, "agreed")
    # a wrong figure over fully read cells is still sent back: gap 200 stated 180
    wrong = replaced(FUNDING, "Funding gap", amount="180")
    assert statuses(ms.run("CP-3C", cp3c(funding=wrong)))["Funding gap"] == "disagreed"


# --- C11-2: T4.8 LTM rounding slack ---------------------------------------------------------------


def ltm(value):
    rows = {"Revenue": ("USD 1250m", "USD 300m", "USD 280m", value)}
    return {o.figure: o for o in ms.run("CP-1", cp1(ltm=rows))}["LTM: Revenue"]


def test_a_derived_value_within_the_components_rounding_agrees():
    # 1250 + 300 - 280 = 1270 from 0-dp figures, each up to 0.5 off (1.5 in all); 1270.4 is inside.
    outcome = ltm("USD 1270.4m")
    assert outcome.status == "agreed"
    assert outcome.tolerance == pytest.approx(1.6)  # 0.1 (1 dp) + 3 x 0.5


def test_ltm_rounding_regression_pins():
    assert ltm("USD 1270m").status == "agreed"
    assert ltm("USD 1272.0m").status == "disagreed"  # 2.0 off, bound 1.5 + 0.1
    assert ltm("USD 1273m").status == "disagreed"  # 3 off, bound 1.5 + 0.5
    assert ltm("USD 1275m").status == "disagreed"


# --- C11-3: the cost-sign leniency only for cost lines --------------------------------------------


def t44_line(item, cell):
    t44 = (
        "### T4.4 - Performance\n\n| Line Item | FY2023 | FY2024 | YoY Change (%) |\n"
        f"|---|---|---|---|\n| {item} | 100 | 110 | {cell} |\n\n"
    )
    return cp1b_by(cp1b(t44=t44))[("T4.4", f"% Change: {item}")]


@pytest.mark.parametrize(
    "item",
    [
        "Net income after tax",
        "Profit before tax",
        "Interest income",
        "Interest coverage",
        "Adjusted EBITDA",
        "Operating margin",
        "Retained earnings",
        "Net interest income",
    ],
)
def test_a_wrong_signed_change_on_a_non_cost_line_is_sent_back(item):
    # 100 -> 110 is +10.0%; (10.0%) is the wrong sign
    assert t44_line(item, "(10.0%)") == "disagreed"
    assert t44_line(item, "10.0%") == "agreed"


@pytest.mark.parametrize(
    "item",
    [
        "Interest expense",
        "Tax expense",
        "Income tax expense",
        "Cost of sales",
        "Operating costs",
        "COGS",
        "Cash Interest Paid",
        "SG&A",
        "Capex",
        "Depreciation and amortisation",
    ],
)
def test_cost_lines_keep_the_unfavourable_sign(item):
    assert t44_line(item, "(10.0%)") == "agreed"
    assert t44_line(item, "-10.0%") == "agreed"
    assert t44_line(item, "10.0%") == "agreed"
    assert t44_line(item, "(12.0%)") == "disagreed"


# --- C11-4: T4.4 joined `YoY Abs/%` ---------------------------------------------------------------


def joined(cell):
    t44 = (
        "### T4.4 - Performance\n\n| Line Item | FY2023 | FY2024 | YoY Abs/% |\n|---|---|---|---|\n"
        f"| Revenue | 6585 | 7940 | {cell} |\n\n"
    )
    outcomes = [o for o in ms.run("CP-1B", cp1b(t44=t44)) if o.register == "T4.4"]
    return outcomes[0]


# 7940 / 6585 - 1 = 20.577%
@pytest.mark.parametrize(
    "cell", ["1355; 20.6%", "+1,355 (20.6%)", "1355 / 20.6%", "20.6%", "1355, 20.6% reported"]
)
def test_joined_cells_are_read_and_agree(cell):
    assert joined(cell).status == "agreed", cell


@pytest.mark.parametrize("cell", ["1355; 25.0%", "+1,355 (25.0%)", "1355 / 25.0%"])
def test_a_wrong_percentage_disagrees(cell):
    assert joined(cell).status == "disagreed", cell


def test_an_unreadable_cell_is_not_checked_with_a_reason_that_names_it():
    outcome = joined("about a fifth")
    assert outcome.status == "not checked"
    assert "about a fifth" in outcome.reason or "Abs/%" in outcome.reason
    assert "no change is stated" not in outcome.reason
    assert joined("—").status == "not checked"
    assert joined("1355; 10 to 12%").status == "not checked"


# --- C11 fix round 2: three round-1 regressions restored to BASE ----------------------------------


@pytest.mark.parametrize(
    "item",
    [
        "Tax on profit",
        "Taxes on income",
        "Cash taxes on income",
        "Interest expense, net of interest income",
        "Costs and expenses excluding EBITDA",
    ],
)
def test_cost_lines_naming_profit_or_income_keep_the_unfavourable_sign(item):
    # 100 -> 110 is +10.0%; a cost line may carry either sign (ruling 2026-11-15)
    assert t44_line(item, "(10.0%)") == "agreed"
    assert t44_line(item, "10.0%") == "agreed"
    assert t44_line(item, "(12.0%)") == "disagreed"


@pytest.mark.parametrize(
    ("cell", "status"),
    [
        ("-10; 10.0%", "agreed"),
        ("-10, 10.0%", "agreed"),
        ("-10 (10.0%)", "agreed"),
        ("-10; -10.0%", "agreed"),
        ("-10; 12.0%", "disagreed"),
        ("-10 / 10.0%", "disagreed"),
    ],
)
def test_percentage_after_punctuation_inherits_the_absolute_sign(cell, status):
    # 90 / 100 - 1 = -10.0%
    t44 = (
        "### T4.4 - Performance\n\n| Line Item | FY2023 | FY2024 | YoY Abs/% |\n|---|---|---|---|\n"
        f"| Revenue | 100 | 90 | {cell} |\n\n"
    )
    outcomes = [o for o in ms.run("CP-1B", cp1b(t44=t44)) if o.register == "T4.4"]
    assert outcomes[0].status == status, cell


def test_a_blank_cell_on_a_facility_expiring_inside_the_horizon_does_not_block_the_totals():
    # Bilateral line expires at 1.0y, inside the 2y Horizon: not in the totals (470 and 200 stand).
    funding = replaced(FUNDING, "Facility: Bilateral line", drawn="—")
    assert statuses(ms.run("CP-3C", cp3c(funding=funding))) == dict.fromkeys(LINES, "agreed")


# --- C11 regression repair: restore BASE 030805f for two inputs round 2 made worse ----------------


@pytest.mark.parametrize(
    "item",
    [
        "Interest expense after interest income",
        "Interest expense less interest income",
        "Interest expense, net of  interest income",
    ],
)
def test_an_interest_expense_line_naming_interest_income_stays_a_cost(item):
    # BASE: agreed with either sign (100 -> 110 is +10.0%)
    assert t44_line(item, "(10.0%)") == "agreed"


@pytest.mark.parametrize("item", ["Interest income", "Net interest income"])
def test_an_interest_income_line_alone_is_not_a_cost(item):
    assert t44_line(item, "(10.0%)") == "disagreed"
    assert t44_line(item, "10.0%") == "agreed"


def test_a_space_only_abs_then_percentage_is_not_checked():
    # BASE: `-10 10.0%` is not read (no separator, no brackets); 90 / 100 - 1 = -10.0%
    t44 = (
        "### T4.4 - Performance\n\n| Line Item | FY2023 | FY2024 | YoY Abs/% |\n|---|---|---|---|\n"
        "| Revenue | 100 | 90 | -10 10.0% |\n\n"
    )
    outcomes = [o for o in ms.run("CP-1B", cp1b(t44=t44)) if o.register == "T4.4"]
    assert outcomes[0].status == "not checked"


def test_years_equal_to_the_horizon_still_blocks_the_totals():
    # Bilateral line expires at 2.0y = the 2y Horizon: not inside it, so it is in the totals.
    funding = replaced(FUNDING, "Facility: Bilateral line", drawn="—", years="2.0")
    out = {o.figure: o for o in ms.run("CP-3C", cp3c(funding=funding))}
    assert out["Available liquidity"].status == "not checked"
    assert out["Funding gap"].status == "not checked"
