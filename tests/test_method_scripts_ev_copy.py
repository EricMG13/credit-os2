"""CP-3's copy of CP-1C's T4.10 multiple: units, periods, short combined cells, none-rows.

SYNTHETIC: every handoff is hand-made; every expected value is worked by hand in the comment beside
it. Reuses the layouts of tests/test_method_scripts.py.
"""

import pytest

from deploy_workflow import method_scripts as ms
from tests.test_method_scripts import FROM_T410, copies, cp3, edited, t410

BASIS_NO_METHOD = "CP-1C T4.10: minimum, median, maximum peer multiple x FY2024 EBITDA"
AGREED = [2.0, 4.2, 7.0]


def sent_copies(handoff, rows=None):
    return copies(ms.run("CP-3", cp3(FROM_T410 if rows is None else rows), {"CP-1C": handoff}))


def with_metric(handoff, metric):
    return handoff.replace("EBITDA 100", metric)


def mis_copied_base():
    return edited(
        "EV multiple", rows=edited("Enterprise value", rows=FROM_T410, base="450"), base="4.5x"
    )


# --- E-4: a period's digits are not the borrower metric's figures ---------------------------------


def test_a_period_in_the_borrower_metric_is_not_a_second_figure():
    # `FY2024 EBITDA 100`: 200/100 = 2.0, 420/100 = 4.2, 700/100 = 7.0.
    out = sent_copies(with_metric(t410(), "FY2024 EBITDA 100"))
    assert [o.status for o in out] == ["agreed"] * 3
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


def test_a_dated_ltm_borrower_metric_with_thousands_is_read():
    # `LTM Dec-2025 EBITDA 1,250`: 2,500/1,250 = 2.0, 5,250/1,250 = 4.2, 8,750/1,250 = 7.0.
    sent = with_metric(t410(low="2,500", median="5,250", high="8,750"), "LTM Dec-2025 EBITDA 1,250")
    out = sent_copies(sent)
    assert [o.status for o in out] == ["agreed"] * 3
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


def test_a_borrower_metric_with_two_figures_stays_not_checked():
    out = sent_copies(with_metric(t410(), "EBITDA 100; adjusted 120"))
    assert {o.status for o in out} == {"not checked"}


# --- E-1: the scale and currency of each side ----------------------------------------

UNITLESS = {"low": "USD 200m", "median": "USD 420m", "high": "USD 700m", "unit": ""}


def test_a_metric_in_billions_is_converted_to_the_evs_millions():
    # EV USD 420m, metric USD 0.100bn = 100m: 200/100, 420/100, 700/100.
    out = sent_copies(with_metric(t410(**UNITLESS), "EBITDA USD 0.100bn"))
    assert [o.status for o in out] == ["agreed"] * 3
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


def test_a_mis_copied_base_is_disagreed_when_the_metric_is_in_billions():
    sent = with_metric(t410(**UNITLESS), "EBITDA USD 0.100bn")
    base = sent_copies(sent, mis_copied_base())[1]
    assert (base.status, base.recomputed) == ("disagreed", pytest.approx(4.2))


def test_a_metric_in_billions_to_one_place_agrees_on_base():
    # USD 0.1bn = 100m; 420/100 = 4.2.
    out = sent_copies(with_metric(t410(**UNITLESS), "EBITDA USD 0.1bn"))
    assert (out[1].status, out[1].recomputed) == ("agreed", pytest.approx(4.2))


def test_a_metric_in_another_currency_is_not_checked():
    out = sent_copies(with_metric(t410(**UNITLESS), "EBITDA EUR 100m"))
    assert {o.status for o in out} == {"not checked"}


def test_an_unstated_scale_on_one_side_is_read_as_before():
    # EV cells state `m`, the metric states none: 420/100 = 4.2 as before the scale was read.
    out = sent_copies(t410(**UNITLESS))
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


# --- E-2: a short combined cell is not read as every case's figure --------------------------------


def test_a_short_combined_cell_is_not_used_for_every_case():
    combined = """### T4.10 — Implied EV
| Method | Multiple Source/Value | Borrower Metric | Implied EV/Low/Median/High | Status |
|---|---|---|---|---|
| EV/EBITDA | T4.8, 4.2x | EBITDA 100 | 420 | Calculated |
"""
    rows = FROM_T410
    out = sent_copies(combined, rows)
    assert [o.status for o in out] == ["not checked"] * 3
    assert all("states no Low, Median and High" in o.reason for o in out)
    assert ms.issues("CP-3", cp3(rows), {"CP-1C": combined}) == ()


def test_a_method_less_basis_skips_a_combined_row_that_says_none():
    combined = """### T4.10 — Implied EV
| Method | Multiple Source/Value | Borrower Metric | Implied EV/Low/Median/High | Status |
|---|---|---|---|---|
| Peer EV/Revenue | T4.8 | Revenue 900 | Not Calculable | Not Calculable |
| Peer EV/EBITDA | T4.8, 4.2x | EBITDA 100 | 420 / 200 / 420 / 700 | Calculated |
"""
    rows = edited("EV basis", low=BASIS_NO_METHOD, base=BASIS_NO_METHOD, high=BASIS_NO_METHOD)
    assert [o.status for o in sent_copies(combined, rows)] == ["agreed"] * 3


# --- E-3: `Not calculable: <reason>` is no figure ----------------------------------------


def only_ebitda_and_not_calculable(sent_none):
    return t410().replace(
        "Not Calculable | Not Calculable | Not Calculable | Not Calculable: N=2",
        f"{sent_none} | {sent_none} | {sent_none} | {sent_none}",
    )


def test_a_not_calculable_row_with_a_reason_is_not_counted_as_a_row_with_a_figure():
    rows = edited("EV basis", low=BASIS_NO_METHOD, base=BASIS_NO_METHOD, high=BASIS_NO_METHOD)
    sent = only_ebitda_and_not_calculable("Not calculable: N=2")
    out = sent_copies(sent, rows)
    assert [o.status for o in out] == ["agreed"] * 3
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


def test_a_mis_copied_base_is_disagreed_beside_a_not_calculable_reason_row():
    rows = mis_copied_base()
    basis = {"low": BASIS_NO_METHOD, "base": BASIS_NO_METHOD, "high": BASIS_NO_METHOD}
    rows = edited("EV basis", rows=rows, **basis)
    base = sent_copies(only_ebitda_and_not_calculable("Not calculable: N=2"), rows)[1]
    assert (base.status, base.recomputed) == ("disagreed", pytest.approx(4.2))


def test_a_bare_not_calculable_row_stays_skipped():
    rows = edited("EV basis", low=BASIS_NO_METHOD, base=BASIS_NO_METHOD, high=BASIS_NO_METHOD)
    assert [o.status for o in sent_copies(t410(), rows)] == ["agreed"] * 3


# --- audit F1, F2, F7: words and bare amounts in the borrower metric --------------------------


@pytest.mark.parametrize(
    "metric",
    [
        "Segment EBITDA 100 (three units)",
        "EBITDA 100 per unit basis",
        "EBITDA 100 - peak",
        "EBITDA 100 (k-adjusted)",
        "EBITDA 100 (per thousand subscribers basis)",
        "EBITDA 100 (ALL segments)",
    ],
)
def test_description_words_in_the_metric_are_not_a_scale_or_currency(metric):
    out = sent_copies(with_metric(t410(), metric))
    assert [o.status for o in out] == ["agreed"] * 3
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


@pytest.mark.parametrize("header", ["Borrower Metric", "Borrower Metric (USD bn)"])
def test_a_description_in_a_billions_ev_table_is_not_a_scale(header):
    # EV USD bn 0.2 / 0.42 / 0.7 over EBITDA 0.1 (USD bn): 2.0, 4.2, 7.0.
    sent = t410(low="0.2", median="0.42", high="0.7", unit=" (USD bn)")
    sent = with_metric(sent, "EBITDA 0.1 (pro forma for M&A)")
    out = sent_copies(sent.replace("Borrower Metric", header))
    assert [o.status for o in out] == ["agreed"] * 3
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


@pytest.mark.parametrize("metric", ["EBITDA 0.1bn", "EBITDA USD 0.1 bn", "EBITDA USD 100 mn"])
def test_a_scale_attached_to_the_metrics_figure_is_read(metric):
    # EV USD 420m (bn metric: 0.1bn = 100m) and 200/420/700 over 100m.
    sent = with_metric(t410(**UNITLESS), metric)
    out = sent_copies(sent)
    assert [o.recomputed for o in out] == pytest.approx(AGREED)


def test_a_bare_amount_that_looks_like_a_year_is_a_figure():
    # EBITDA 2024: 4048 / 2024 = 2.0, 8501 / 2024 = 4.2, 14168 / 2024 = 7.0.
    out = sent_copies(with_metric(t410("4048", "8501", "14168"), "EBITDA 2024"))
    assert [o.status for o in out] == ["agreed"] * 3
    # EBITDA USD 2000m: 4000 / 2000 = 2.0, 8400 / 2000 = 4.2, 14000 / 2000 = 7.0.
    out = sent_copies(with_metric(t410("4000", "8400", "14000"), "EBITDA USD 2000m"))
    assert [o.status for o in out] == ["agreed"] * 3


def test_a_second_amount_after_a_year_like_figure_is_not_one_figure():
    sent = with_metric(t410("4000", "8400", "14000"), "EBITDA USD 2000m incl. 150m synergies")
    assert {o.status for o in sent_copies(sent)} == {"not checked"}


@pytest.mark.parametrize(
    "metric",
    ["EBITDA 100 (2024E)", "EBITDA 100 / FY2024", "EBITDA 100 (31/12/2024)", "May 2024 EBITDA 100"],
)
def test_a_marked_period_is_still_set_aside(metric):
    out = sent_copies(with_metric(t410(), metric))
    assert [o.status for o in out] == ["agreed"] * 3
