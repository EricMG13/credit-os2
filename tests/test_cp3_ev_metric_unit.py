"""Synthetic CP-3 checks against the CP-1C handoff it was sent."""

import pytest

from tests.test_method_scripts import t410
from tests.test_method_scripts_ev_copy import UNITLESS, mis_copied_base, sent_copies, with_metric


@pytest.mark.parametrize("metric", ["EBITDA 2024 USD 0.100bn", "EBITDA USD 0.100bn (2024)"])
def test_cp3_reads_scale_from_the_amount_beside_a_bare_year(metric):
    # USD 0.100bn is USD 100m, so 200 / 100 = 2, 420 / 100 = 4.2, 700 / 100 = 7.
    out = sent_copies(with_metric(t410(**UNITLESS), metric))
    assert [outcome.recomputed for outcome in out] == pytest.approx([2.0, 4.2, 7.0])
    assert [outcome.status for outcome in out] == ["agreed"] * 3


def test_cp3_reads_a_foreign_currency_from_the_amount_beside_a_bare_year():
    out = sent_copies(with_metric(t410(**UNITLESS), "EBITDA 2024 EUR 0.100bn"))
    assert [outcome.status for outcome in out] == ["not checked"] * 3
    assert all(
        outcome.recomputed is None
        and outcome.reason == "the implied EV is in USD and the borrower metric in EUR"
        for outcome in out
    )


def test_cp3_still_flags_a_wrongly_copied_base_multiple():
    sent = with_metric(t410(**UNITLESS), "EBITDA 2024 USD 0.100bn")
    base = sent_copies(sent, mis_copied_base())[1]
    assert base.recomputed == pytest.approx(4.2)
    assert base.status == "disagreed"


@pytest.mark.parametrize("period", ["2024", "2000"])
def test_cp3_keeps_a_year_shaped_amount_with_its_unit(period):
    # USD 2000m is USD 2bn, so 4 / 2 = 2, 8.4 / 2 = 4.2, 14 / 2 = 7.
    sent = t410(low="USD 4bn", median="USD 8.4bn", high="USD 14bn", unit="")
    out = sent_copies(with_metric(sent, f"EBITDA {period} USD 2000m"))
    assert [outcome.recomputed for outcome in out] == pytest.approx([2.0, 4.2, 7.0])
    assert [outcome.status for outcome in out] == ["agreed"] * 3
