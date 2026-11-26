"""A balance movement bridge reconciles money: the bridged balance-sheet item must be monetary.

Synthetic book written here; no issuer evidence. Scope: `balance_movement.balance_movement_issues`.
"""

from datetime import date
from decimal import Decimal

from deploy_vii.balance_movement import balance_movement_issues
from deploy_vii.contracts import Citation
from deploy_vii.financial_contracts import (
    BalanceMovement,
    BalanceMovementBridge,
    Disclosure,
    FinancialBook,
    FinancialPeriod,
    Observation,
    StatementLine,
    StatementQuantity,
)

CITE = Citation(source_id="S1", source_sha256="a" * 64, locator="p.4", quote="Shares 105")
DISCLOSURE = Disclosure(status="complete", explanation="Synthetic.", citations=(CITE,))
NONE = Disclosure(status="not_applicable", explanation="Synthetic.", citations=(CITE,))
SPANS = {
    "fy-2024": (date(2024, 1, 1), date(2024, 12, 31)),
    "fy-2025": (date(2025, 1, 1), date(2025, 12, 31)),
}


def period(period_id: str) -> FinancialPeriod:
    start, end = SPANS[period_id]
    return FinancialPeriod(
        period_id=period_id,
        fiscal_year=str(end.year),
        fiscal_quarter=None,
        period_type="FY",
        start_date=start,
        end_date=end,
        day_count=None,
        audit_status="Synthetic",
        currency="USD",
        unit="MILLIONS",
        accounting_basis="IFRS",
        entity_perimeter="consolidated group",
        citations=(CITE,),
    )


def line(period_id: str, item: str, amount: int, kind: str | None) -> StatementLine:
    quantity = (
        None
        if kind is None
        else StatementQuantity(
            kind=kind, scale="UNITS" if kind != "monetary" else "MILLIONS", citations=(CITE,)
        )
    )
    return StatementLine(
        line_id=f"BS.{item}",
        statement="BS",
        item_id=item,
        label=item,
        period_id=period_id,
        display_priority=1,
        line_kind="detail",
        value=Observation(
            observation_id=f"{item}.{period_id}",
            status="known",
            amount=Decimal(amount),
            citations=(CITE,),
        ),
        quantity=quantity,
    )


def book(item: str, kind: str | None) -> FinancialBook:
    return FinancialBook(
        book_id="book",
        entity_perimeter="consolidated group",
        accounting_basis="IFRS",
        currency="USD",
        unit="MILLIONS",
        periods=(period("fy-2024"), period("fy-2025")),
        accounts=(),
        addbacks=(),
        segments=(),
        kpis=(),
        facilities=(),
        pro_forma=(),
        statement_lines=(line("fy-2024", item, 100, kind), line("fy-2025", item, 105, kind)),
        balance_movements=(
            BalanceMovement(
                movement_id="m1",
                label="Issue",
                period_id="fy-2025",
                role="capital_transaction",
                value=Observation(
                    observation_id="m1", status="known", amount=Decimal(5), citations=(CITE,)
                ),
            ),
        ),
        balance_movement_bridges=(
            BalanceMovementBridge(
                bridge_id="b1",
                period_id="fy-2025",
                balance_item_id=item,
                movement_ids=("m1",),
                disclosure=DISCLOSURE,
            ),
        ),
        segment_allocation=(),
        addback_disclosure=NONE,
        segment_disclosure=NONE,
    )


def test_a_share_count_cannot_be_bridged_against_money():
    assert balance_movement_issues(book("other:shares", "shares")) == (
        "Balance movement requires a monetary BS item: b1",
    )


def test_a_per_share_amount_cannot_be_bridged_against_money():
    assert balance_movement_issues(book("other:nav", "currency_per_share")) == (
        "Balance movement requires a monetary BS item: b1",
    )


def test_a_monetary_item_is_bridged():
    assert balance_movement_issues(book("other:reserve", "monetary")) == ()


def test_a_line_without_stated_quantity_is_monetary():
    assert balance_movement_issues(book("other:reserve", None)) == ()
