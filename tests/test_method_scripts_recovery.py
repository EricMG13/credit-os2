"""CP-3's recovery waterfall check and CP-4C's T4E.5/T4E.6 check: what they read as a claim, a
fulcrum name, a title, a pooled step and a note (SYNTHETIC handoffs, USD m, figures worked by hand;
the expected statuses and figures are literals, not production output)."""

import pytest

from deploy_workflow import method_scripts as ms
from tests.test_method_scripts import WATERFALL, by_case, cp3, edited
from tests.test_method_scripts_rest import BASE_ROWS, cp4c, cp4c_run, swap, t4e5

# --- CP-3: a row with an Amount that is not marked `Claim:` ------------------------------------


def test_cp3_a_claim_row_without_its_prefix_makes_the_whole_check_not_checked():
    # Term Loan B 300 is a claim written without `Claim:` and with fractions, not percentages.
    rows = [
        ("Term Loan B", "300", "0.433", "1.0", "1.0", "USD", "m")
        if r[0] == "Claim: Term Loan B"
        else r
        for r in WATERFALL
    ]
    outcomes = ms.run("CP-3", cp3(rows))
    assert [o.status for o in outcomes] == ["not checked"]
    assert "`Term Loan B`" in outcomes[0].reason
    assert ms.issues("CP-3", cp3(rows)) == ()


def test_cp3_a_total_row_with_an_amount_is_still_named_and_the_rest_checked():
    rows = [*WATERFALL[:5], ("Subtotal debt", "550", "—", "—", "—", "USD", "m"), *WATERFALL[5:]]
    outcomes = ms.run("CP-3", cp3(rows))
    assert outcomes[0].figure == "Row: Subtotal debt" and outcomes[0].status == "not checked"
    assert {o.status for o in outcomes[1:]} == {"agreed"}


# --- CP-3: the fulcrum names a claim by its full name ------------------------------------------

TWO_NOTES = [
    ("Enterprise value", "—", "—", "420", "—", "USD", "m"),
    ("EV multiple", "—", "—", "4.2x", "—", "—", "—"),
    ("EV metric", "—", "—", "100", "—", "USD", "m"),
    ("EV basis", "—", "—", "FY2024 EBITDA; multiple from evidence S4", "—", "—", "—"),
    ("Claim: Senior Notes (2027)", "300", "—", "100%", "—", "USD", "m"),
    ("Claim: Senior Notes (2029)", "300", "—", "40%", "—", "USD", "m"),
    ("Fulcrum", "—", "—", "{fulcrum}", "—", "—", "—"),
    ("Residual to equity", "—", "—", "0", "—", "USD", "m"),
]


def two_notes(fulcrum):
    return [tuple(c.replace("{fulcrum}", fulcrum) for c in r) for r in TWO_NOTES]


@pytest.mark.parametrize(
    ("stated", "status"),
    [
        ("Senior Notes (2027)", "disagreed"),  # 2029 is the first partial recovery
        ("Senior Notes (2029)", "agreed"),
        ("Claim: Senior Notes (2029) - 40% recovery", "agreed"),
        ("Senior Notes", "not checked"),  # names neither of two claims
    ],
)
def test_cp3_a_fulcrum_names_one_of_two_claims_sharing_a_stem(stated, status):
    found = by_case(ms.run("CP-3", cp3(two_notes(stated))), "Base")
    assert found["Fulcrum"].status == status, stated


def test_cp3_a_note_after_the_only_claim_of_that_name_is_still_stripped():
    for stated in ("Senior Notes (fulcrum)", "Senior Notes - 25% recovery", "Claim: Senior Notes"):
        rows = edited("Fulcrum", base=stated)
        assert by_case(ms.run("CP-3", cp3(rows)), "Base")["Fulcrum"].status == "agreed", stated


# --- CP-3: the heading that is the waterfall's title -------------------------------------------


@pytest.mark.parametrize(
    "limits",
    [
        "#### Recovery waterfall limitations",
        "**Recovery waterfall: limitations**",
        "### Recovery waterfall - limitations and caveats",
    ],
)
def test_cp3_a_limitations_heading_naming_the_waterfall_is_not_a_second_table(limits):
    text = cp3(edited("Residual to equity", high="999")).replace(
        "## Gaps", f"{limits}\nThe recoveries are indicative.\n## Gaps"
    )
    found = ms.run("CP-3", text)
    assert [o.status for o in found if o.status == "disagreed"] == ["disagreed"]
    assert not any("headings" in o.reason for o in found)


def test_cp3_two_genuine_waterfall_tables_are_still_ambiguous():
    table = cp3().split("### Recovery waterfall")[1].split("## Gaps")[0]
    text = cp3().replace("## Gaps", f"### Recovery waterfall (restated)\n{table}\n## Gaps")
    (outcome,) = ms.run("CP-3", text)
    assert outcome.status == "not checked" and "2 recovery waterfall headings" in outcome.reason


# --- CP-4C: a pooled group with a row set by the governing evidence ----------------------------

POOL = [
    ("Base", "HoldCo", "1,000", "Admin and DIP: 100", "100", "900"),
    ("Base", "HoldCo", "1,000", "Senior secured TLB: 600", "550 (settlement)", "350"),
    ("Base", "HoldCo", "1,000", "Senior notes: 500", "350", "0"),
]


def test_cp4c_rows_after_a_settled_row_of_a_pool_are_not_recomputed():
    found = {o.figure: o for o in cp4c_run(cp4c(t4e5(POOL)))}
    for name in ("Allocation", "Residual"):
        assert found[f"{name}: Senior secured TLB (Base, HoldCo)"].status == "not checked"
        assert found[f"{name}: Senior notes (Base, HoldCo)"].status == "not checked"
    # the row above the settlement is still checked
    assert found["Allocation: Admin and DIP (Base, HoldCo)"].status == "agreed"
    assert "disagreed" not in {o.status for o in found.values()}
    assert ms.issues("CP-4C", cp4c(t4e5(POOL))) == ()


def test_cp4c_an_unsettled_pool_is_still_allocated_row_by_row():
    pool = [
        ("Base", "HoldCo", "1,000", "Admin and DIP: 100", "100", "900"),
        ("Base", "HoldCo", "1,000", "Senior secured TLB: 600", "600", "300"),
        ("Base", "HoldCo", "1,000", "Senior notes: 500", "300", "0"),
    ]
    found = {o.figure: o.status for o in cp4c_run(cp4c(t4e5(pool)))}
    assert found["Allocation: Senior notes (Base, HoldCo)"] == "agreed"
    wrong = swap(pool, 2, 4, "500")
    found = {o.figure: o.status for o in cp4c_run(cp4c(t4e5(wrong)))}
    assert found["Allocation: Senior notes (Base, HoldCo)"] == "disagreed"


# --- CP-4C: what after an allocation figure is a note ------------------------------------------


@pytest.mark.parametrize("cell", ["(650m)", "(USD 650m)", "(650)", "-650"])
def test_cp4c_a_bracketed_figure_with_a_unit_is_a_figure_not_a_note(cell):
    rows = swap(BASE_ROWS, 1, 4, cell)  # the TLB takes 600; 650 is wrong
    found = {o.figure: o.status for o in cp4c_run(cp4c(t4e5(rows)))}
    assert found["Allocation: Senior secured TLB (Base, HoldCo)"] == "disagreed", cell
    assert found["Fulcrum (Base)"] == "agreed"


@pytest.mark.parametrize("cell", ["600 (USD m)", "600 (full)", "600 (USD millions)"])
def test_cp4c_a_clarifier_after_the_figure_is_not_a_note(cell):
    rows = swap(BASE_ROWS, 1, 4, cell)
    found = {o.figure: o.status for o in cp4c_run(cp4c(t4e5(rows)))}
    assert found["Allocation: Senior secured TLB (Base, HoldCo)"] == "agreed", cell
    assert found["Fulcrum (Base)"] == "agreed"


def test_cp4c_a_reason_after_the_figure_is_still_a_note():
    rows = swap(BASE_ROWS, 1, 4, "550 (settlement)")
    found = {o.figure: o for o in cp4c_run(cp4c(t4e5(rows)))}
    out = found["Allocation: Senior secured TLB (Base, HoldCo)"]
    assert out.status == "not checked" and "settlement" in out.reason
    assert found["Fulcrum (Base)"].status == "not checked"
