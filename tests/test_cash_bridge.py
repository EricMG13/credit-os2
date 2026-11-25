"""A declared cash scope reads reported balances; a pro forma period's balance sheet is not one.

Synthetic book written here; no issuer evidence. Scope: `cash_bridge.cash_bridge_issues` only.
"""

from datetime import date
from decimal import Decimal

from deploy_vii.cash_bridge import cash_bridge_issues
from deploy_vii.contracts import Citation
from deploy_vii.financial_contracts import (
    CashMovementBridge,
    CashScope,
    Disclosure,
    FinancialBook,
    FinancialPeriod,
    Observation,
    StatementLine,
)

CASH_LINE = Citation(
    source_id="S1",
    source_sha256="a" * 64,
    locator="p.4",
    quote="Cash, cash equivalents and restricted cash at end of period 120",
)
NONE = Disclosure(status="not_applicable", explanation="Synthetic.", citations=(CASH_LINE,))
# period id -> (period type, start, end)
SPANS = {
    "fy-2023": ("FY", date(2023, 1, 1), date(2023, 12, 31)),
    "fy-2024": ("FY", date(2024, 1, 1), date(2024, 12, 31)),
    "pf-2024": ("PF", date(2024, 1, 1), date(2024, 12, 31)),
}


def period(period_id: str) -> FinancialPeriod:
    kind, start, end = SPANS[period_id]
    return FinancialPeriod(
        period_id=period_id,
        fiscal_year=str(end.year),
        fiscal_quarter=None,
        period_type=kind,
        start_date=start,
        end_date=end,
        day_count=None,
        audit_status="Synthetic",
        currency="USD",
        unit="MILLIONS",
        accounting_basis="IFRS",
        entity_perimeter="consolidated group",
        citations=(CASH_LINE,),
    )


def line(period_id: str, statement: str, item_id: str, label: str) -> StatementLine:
    return StatementLine(
        line_id=f"{statement}.{item_id}",
        statement=statement,
        item_id=item_id,
        label=label,
        period_id=period_id,
        display_priority=1,
        line_kind="detail",
        value=Observation(
            observation_id=f"{period_id}.{statement}.{item_id}",
            status="known",
            amount=Decimal(20),
            citations=(CASH_LINE,),
        ),
    )


def book(bridge_period: str, *restricted_at: str) -> FinancialBook:
    """A book whose `bridge_period` declares restricted cash in its cash line, with a restricted
    cash balance-sheet line in each of the periods `restricted_at`."""
    scope = CashScope(items=("restricted_cash",), citations=(CASH_LINE,))
    return FinancialBook(
        book_id="book",
        entity_perimeter="consolidated group",
        accounting_basis="IFRS",
        currency="USD",
        unit="MILLIONS",
        periods=tuple(period(period_id) for period_id in SPANS),
        accounts=(),
        addbacks=(),
        segments=(),
        kpis=(),
        facilities=(),
        pro_forma=(),
        statement_lines=(
            line(bridge_period, "CFS", "closing_cash", "Cash and restricted cash, end of period"),
            *(line(at, "BS", "restricted_cash", "Restricted cash") for at in restricted_at),
        ),
        cash_movement_bridges=(
            CashMovementBridge(
                bridge_id="b1",
                period_id=bridge_period,
                components=(),
                explanation="Synthetic.",
                citations=(CASH_LINE,),
                cash_scope=scope,
            ),
        ),
        segment_allocation=(),
        addback_disclosure=NONE,
        segment_disclosure=NONE,
    )


def test_a_reported_period_with_both_reported_balances_has_no_issue():
    assert cash_bridge_issues(book("fy-2024", "fy-2023", "fy-2024")) == ()


def test_a_pro_forma_balance_does_not_stand_in_for_a_missing_reported_one():
    """Only the pro forma period, which ends the same day, states restricted cash at the close."""
    assert cash_bridge_issues(book("fy-2024", "fy-2023", "pf-2024")) == (
        "Declared cash scope balance missing: b1 restricted_cash 2024-12-31",
    )


def test_a_pro_forma_period_reads_its_own_closing_balance():
    assert cash_bridge_issues(book("pf-2024", "fy-2023", "pf-2024")) == ()
    assert cash_bridge_issues(book("pf-2024", "fy-2023")) == (
        "Declared cash scope balance missing: b1 restricted_cash 2024-12-31",
    )
