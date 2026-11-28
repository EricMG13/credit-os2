"""CP-2G and CP-2H trigger fixes (S03 C12 round 1, dispatch A): digit-first interim period labels,
whole-word rating basis, exact EBITDA column, threshold ranges and affirmative breach words.

Every handoff is SYNTHETIC, written by hand; every expected outcome is worked by hand and literal.
"""

import pytest

from deploy_workflow import method_scripts as ms

# --- CP-2G --------------------------------------------------------------------------------------


def cp2g(
    period="FY2026",
    ebitda="1,000",
    gross="4.9x",
    definition="D1 debt / EBITDA",
    ebitda_headers=("EBITDA (USD m)",),
):
    """One period, case Base: closing debt 4,900 (5,000 + 0 - 100), closing cash 300."""
    head4 = " | ".join(["period", "case", *ebitda_headers, "FCF (USD m)"])
    cells4 = " | ".join([period, "Base", ebitda, *["12%"] * (len(ebitda_headers) - 1), "300"])
    return "\n".join(
        [
            "## Findings",
            "### T2H.4 — Operating forecast outputs",
            f"| {head4} |",
            "|---|---|" + "---|" * (len(ebitda_headers) + 1),
            f"| {cells4} |",
            "",
            "### T2H.5 — Financing and liquidity outputs",
            (
                "| period | case | opening debt/cash (USD m) | issuance (USD m) "
                "| repayment (USD m) | interest (USD m) | closing debt/cash (USD m) |"
            ),
            "|---|---|---|---|---|---|---|",
            f"| {period} | Base | 5,000 / 400 | 0 | 100 | 350 | 4,900 / 300 |",
            "",
            "### T2H.6 — Credit metrics outputs",
            "| period | case | gross/net leverage | coverage | FCF/debt | definition IDs |",
            "|---|---|---|---|---|---|",
            f"| {period} | Base | {gross} / n.m. | n.m. | n.m. | {definition} |",
            "## Gaps",
            "None.",
        ]
    )


def gross_status(text, period="FY2026"):
    return {o.figure: o.status for o in ms.run("CP-2G", text)}[f"Gross leverage ({period}, Base)"]


@pytest.mark.parametrize("period", ["1H26", "1Q26", "2Q2026", "9M26", "H1 FY26"])
def test_interim_period_labels_are_not_annual(period):
    # EBITDA 500 is a half or a quarter: 4,900 / 500 = 9.8x would disagree with a stated LTM 4.9x
    assert gross_status(cp2g(period, ebitda="500"), period) == "not checked"


def test_annual_periods_still_checked():
    assert gross_status(cp2g("FY2026", ebitda="1,000")) == "agreed"  # 4,900 / 1,000 = 4.9x
    assert gross_status(cp2g("FY2026", ebitda="500")) == "disagreed"  # 4,900 / 500 = 9.8x
    assert gross_status(cp2g("2026E", ebitda="500"), "2026E") == "disagreed"
    assert gross_status(cp2g("FY26", ebitda="500"), "FY26") == "disagreed"


def test_operating_is_not_a_rating_basis():
    # 4,900 / 1,000 = 4.9x, stated 4.5x
    for definition in ("Gross debt / Operating EBITDA", "debt / generating EBITDA"):
        assert gross_status(cp2g(gross="4.5x", definition=definition)) == "disagreed"


@pytest.mark.parametrize(
    "definition",
    ["D4 covenant EBITDA", "Moody's rating-adjusted debt / EBITDA", "S&P agency basis", "ratings"],
)
def test_a_named_other_basis_is_still_not_checked(definition):
    assert gross_status(cp2g(gross="4.5x", definition=definition)) == "not checked"
    assert gross_status(cp2g(gross="4.9x", definition=definition)) == "agreed"


def test_ebitda_margin_does_not_collide_with_ebitda():
    headers = ("EBITDA (USD m)", "EBITDA margin")
    found = {o.figure: o.status for o in ms.run("CP-2G", cp2g(ebitda_headers=headers))}
    assert "all" not in found
    assert found["Gross leverage (FY2026, Base)"] == "agreed"
    wrong = ms.run("CP-2G", cp2g(gross="4.5x", ebitda_headers=("EBITDA (USD m)", "EBITDA margin")))
    assert {o.figure: o.status for o in wrong}["Gross leverage (FY2026, Base)"] == "disagreed"


def test_two_exact_ebitda_columns_stay_ambiguous():
    (outcome,) = ms.run("CP-2G", cp2g(ebitda_headers=("EBITDA (USD m)", "EBITDA (GBP m)")))
    assert (outcome.figure, outcome.status) == ("all", "not checked")
    assert "2 `EBITDA` columns" in outcome.reason


def test_a_missing_ebitda_column_is_still_reported():
    (outcome,) = ms.run("CP-2G", cp2g(ebitda_headers=("Operating profit",)))
    assert (outcome.figure, outcome.status) == ("all", "not checked")
    assert "no `EBITDA` column" in outcome.reason


# --- CP-2H --------------------------------------------------------------------------------------

T2R4_HEAD = (
    "| agency | rating type | trigger direction | metric | threshold | case/period value "
    "| headroom | status |\n|---|---|---|---|---|---|---|---|\n"
)


def cp2h(direction, threshold, value, headroom, status):
    row = f"| Moody's | CFR | {direction} | Lev | {threshold} | {value} | {headroom} | {status} |"
    return f"## Findings\n\n### T2R.4 - Quantitative triggers\n\n{T2R4_HEAD}{row}\n\n## Gaps\n"


def cp2h_by(text):
    return {o.figure: o.status for o in ms.run("CP-2H", text)}


@pytest.mark.parametrize(
    "threshold", ["6.0x and 2 consecutive quarters", "6.0x (FY25-26)", "6.0x (FY25 - FY26)"]
)
def test_a_count_or_year_pair_is_not_a_range(threshold):
    # single bound 6.0x: 6.0 - 5.2 = 0.8 Compliant
    found = cp2h_by(cp2h("maximum", threshold, "5.2x", "0.8x", "Compliant"))
    assert found == {"Headroom: Lev": "agreed", "Status: Lev": "agreed"}


@pytest.mark.parametrize(
    "threshold", ["5.0x-5.5x", "5.0-5.5x", "between 5.0x and 5.5x", "5.0x to 5.5x"]
)
def test_real_ranges_still_read_as_ranges(threshold):
    # 5.0 - 5.2 = -0.2 to the lower bound, 5.5 - 5.2 = 0.3: Breached against the binding bound
    found = cp2h_by(cp2h("maximum", threshold, "5.2x", "-0.2x / 0.3x", "Breached"))
    assert found == {"Headroom: Lev": "agreed", "Status: Lev": "agreed"}


def test_bare_pair_is_a_range_unless_a_duration():
    assert (
        cp2h_by(cp2h("maximum", "5.0 - 5.5", "5.2", "-0.2", "Breached"))["Status: Lev"] == "agreed"
    )
    one = cp2h("maximum", "6.0 and 2 consecutive quarters", "5.2", "0.8", "Compliant")
    assert cp2h_by(one)["Status: Lev"] == "not checked"  # bare, so no figure is plainly the bound
    twelve = cp2h("maximum", "6.0x for 12-18 months", "5.2x", "0.8x", "Compliant")
    assert cp2h_by(twelve)["Status: Lev"] == "agreed"


def test_no_breach_is_not_a_breach():
    # 6.0 - 6.4 = -0.4: Breached, so `Compliant (no breach)` is wrong
    found = cp2h_by(cp2h("maximum", "6.0x", "6.4x", "-0.4x", "Compliant (no breach)"))
    assert found["Status: Lev"] == "disagreed"
    found = cp2h_by(cp2h("maximum", "6.0x", "6.4x", "-0.4x", "Compliant (not a breach)"))
    assert found["Status: Lev"] == "disagreed"


def test_breach_risk_low_reads_compliant():
    found = cp2h_by(cp2h("maximum", "6.0x", "5.2x", "0.8x", "Breach risk low"))
    assert found == {"Headroom: Lev": "agreed", "Status: Lev": "agreed"}
    high = cp2h_by(cp2h("maximum", "6.0x", "6.4x", "-0.4x", "Breach risk high"))
    assert high["Status: Lev"] == "not checked"  # no status word the script has


def test_an_affirmative_breach_still_reads_and_excuses():
    breached = ("Breached", "Breach (point-in-time)", "Breach of covenant")
    for status in breached:
        found = cp2h_by(cp2h("maximum", "6.0x", "6.4x", "-0.4x", status))
        assert found["Status: Lev"] == "agreed", status
        wrong = cp2h_by(cp2h("maximum", "6.0x", "5.2x", "0.8x", status))
        assert wrong["Status: Lev"] == "disagreed", status
    excused = cp2h_by(
        cp2h("maximum", "6.0x", "6.4x", "-0.4x", "Compliant (breach is not a trigger)")
    )
    assert excused["Status: Lev"] == "not checked"


# --- S03 C12 fix round 2, dispatch A -----------------------------------------------------------


@pytest.mark.parametrize(
    "period", ["1Q26E", "1H26E", "2Q2026E", "9M26A", "3Q26A", "4Q26F", "FY1H26"]
)
def test_interim_labels_with_an_estimate_suffix_are_not_annual(period):
    # EBITDA 500 is part of a year: 4,900 / 500 = 9.8x must not be called a disagreement
    assert gross_status(cp2g(period, ebitda="500"), period) == "not checked"


@pytest.mark.parametrize("period", ["FY26E", "2026E", "FY2026A"])
def test_annual_labels_with_a_suffix_stay_annual(period):
    assert gross_status(cp2g(period, ebitda="500"), period) == "disagreed"  # 4,900 / 500 = 9.8x
    assert gross_status(cp2g(period, ebitda="1,000"), period) == "agreed"  # 4.9x


@pytest.mark.parametrize("definition", ["rating_adjusted_debt", "D_RATING_1", "Rating basis"])
def test_underscore_joined_rating_id_is_an_other_basis(definition):
    assert gross_status(cp2g(gross="4.5x", definition=definition)) == "not checked"


def test_operating_ebitda_stays_checked_after_rating_boundary_change():
    assert gross_status(cp2g(gross="4.5x", definition="Operating EBITDA")) == "disagreed"


def test_between_leads_a_one_sided_unit_range_joined_by_and():
    # range 5.0-5.5, value 5.2x: headroom -0.2x / 0.3x, Breached against the lower bound
    found = cp2h_by(cp2h("maximum", "between 5.0 and 5.5x", "5.2x", "-0.2x / 0.3x", "Breached"))
    assert found == {"Headroom: Lev": "agreed", "Status: Lev": "agreed"}


def test_and_without_between_stays_a_single_bound_one_sided_unit():
    found = cp2h_by(cp2h("maximum", "6.0x and 2 consecutive quarters", "5.2x", "0.8x", "Compliant"))
    assert found == {"Headroom: Lev": "agreed", "Status: Lev": "agreed"}


@pytest.mark.parametrize("status", ["Breaching", "Breaches", "Breaching covenant"])
def test_breaching_and_breaches_read_as_breached(status):
    found = cp2h_by(cp2h("maximum", "6.0x", "6.4x", "-0.4x", status))
    assert found["Status: Lev"] == "agreed"
    wrong = cp2h_by(cp2h("maximum", "6.0x", "5.2x", "0.8x", status))
    assert wrong["Status: Lev"] == "disagreed"


def test_negated_breaching_is_still_not_a_breach():
    found = cp2h_by(cp2h("maximum", "6.0x", "6.4x", "-0.4x", "Compliant (not breaching)"))
    assert found["Status: Lev"] == "disagreed"
    risk = cp2h_by(cp2h("maximum", "6.0x", "5.2x", "0.8x", "Breach risk low"))
    assert risk["Status: Lev"] == "agreed"


def test_and_pair_with_one_sided_unit_is_a_range_without_between():
    # BASE 030805f: range 5.0-5.5, value 5.2x: headroom -0.2x / 0.3x, Breached; both agreed
    found = cp2h_by(cp2h("maximum", "5.0 and 5.5x", "5.2x", "-0.2x / 0.3x", "Breached"))
    assert found == {"Headroom: Lev": "agreed", "Status: Lev": "agreed"}
