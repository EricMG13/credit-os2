"""A pro forma period's source conflict reaches only itself in the kernel registers.

Synthetic book of `test_financial_reconciliation_pf` (no issuer evidence). Scope:
`financial_adapter._accounts` and `_facilities` conflict pooling. Reported rows of one date still
share a conflict; a pro forma period's rows are its own. Expected values are written by hand.
"""

from decimal import Decimal

from test_financial_reconciliation_pf import book, conflicting, facility, known, period

from deploy_vii.financial_adapter import _accounts, _facilities
from deploy_vii.financial_contracts import AccountObservation


def _debt_rows(b):
    return {r.period_id: r.value for r in _accounts(b) if r.metric_id == "total_debt"}


def _carrying(b):
    return {(r.facility_id, r.period_id): r.carrying_value for r in _facilities(b)}


def test_a_pro_forma_conflicting_total_debt_does_not_blank_the_reported_value():
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
            AccountObservation(
                metric_id="total_debt", period_id="pf-2025", value=conflicting("pf")
            ),
        ),
    )
    rows = _debt_rows(b)
    assert rows["fy-2025"] == Decimal(100)
    assert rows["pf-2025"] is None


def test_a_pro_forma_conflicting_facility_does_not_blank_the_reported_carrying_value():
    pf = facility("notes", "pf-2025", 100).model_copy(update={"carrying_value": conflicting("pf")})
    b = book(facilities=(facility("notes", "fy-2025", 100), pf))
    rows = _carrying(b)
    assert rows["notes", "fy-2025"] == Decimal(100)
    assert rows["notes", "pf-2025"] is None


def test_a_reported_conflict_still_blanks_every_reported_period_of_its_date():
    """Equality guard: reported rows of one date share a conflict, as before."""
    twin = period("fy-2025").model_copy(update={"period_id": "fy-2025b"})
    b = book(
        periods=(period("fy-2025"), twin),
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
            AccountObservation(
                metric_id="total_debt", period_id="fy-2025b", value=conflicting("c")
            ),
        ),
        facilities=(
            facility("notes", "fy-2025", 100),
            facility("notes", "fy-2025b", 100).model_copy(
                update={"carrying_value": conflicting("cf")}
            ),
        ),
    )
    assert _debt_rows(b) == {"fy-2025": None, "fy-2025b": None}
    assert _carrying(b) == {("notes", "fy-2025"): None, ("notes", "fy-2025b"): None}


def test_a_reported_conflicting_total_debt_blanks_a_same_date_pro_forma_row():
    """One-way scope: a reported conflict reaches the same-date pro forma row."""
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=conflicting("c")),
            AccountObservation(metric_id="total_debt", period_id="pf-2025", value=known("d", 150)),
        ),
    )
    rows = _debt_rows(b)
    assert rows["fy-2025"] is None
    assert rows["pf-2025"] is None


def test_a_reported_conflicting_facility_blanks_a_same_date_pro_forma_row():
    fy = facility("notes", "fy-2025", 100).model_copy(update={"carrying_value": conflicting("c")})
    b = book(facilities=(fy, facility("notes", "pf-2025", 70)))
    rows = _carrying(b)
    assert rows["notes", "fy-2025"] is None
    assert rows["notes", "pf-2025"] is None
