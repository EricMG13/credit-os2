"""A reported period's balance checks read reported balances; a pro forma period's are not.

Synthetic book written here; no issuer evidence. Scope: `financial_reconciliation` debt, cash and
balance-movement checks, and that reported same-date conflicts are still detected.
Expected values are written by hand.
"""

from datetime import date
from decimal import Decimal

from deploy_vii.contracts import Citation
from deploy_vii.financial_contracts import (
    AccountObservation,
    BalanceMovementBridge,
    Disclosure,
    FacilityObservation,
    FinancialBook,
    FinancialPeriod,
    Observation,
    StatementLine,
)
from deploy_vii.financial_reconciliation import _balance_movements, _cash_movement, _debt
from deploy_vii.financial_validation import book_issues
from deploy_vii.statement_validation import statement_issues

CITE = Citation(source_id="S1", source_sha256="a" * 64, locator="p.4", quote="Balance 100")
DISCLOSURE = Disclosure(status="complete", explanation="Synthetic.", citations=(CITE,))
NONE = Disclosure(status="not_applicable", explanation="Synthetic.", citations=(CITE,))
END = date(2025, 12, 31)
# period id -> (period type, start, end)
SPANS = {
    "fy-2024": ("FY", date(2024, 1, 1), date(2024, 12, 31)),
    "fy-2025": ("FY", date(2025, 1, 1), END),
    "pf-2025": ("PF", date(2025, 1, 1), END),
    "pf-h1-2025": ("PF", date(2025, 1, 1), date(2025, 6, 30)),
    "q3-2025": ("QUARTER", date(2025, 7, 1), date(2025, 9, 30)),
}


def period(period_id: str) -> FinancialPeriod:
    kind, start, end = SPANS[period_id]
    return FinancialPeriod(
        period_id=period_id,
        fiscal_year=str(end.year),
        fiscal_quarter=3 if kind == "QUARTER" else None,
        period_type=kind,
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


def known(name: str, amount: int) -> Observation:
    return Observation(
        observation_id=name, status="known", amount=Decimal(amount), citations=(CITE,)
    )


def conflicting(name: str) -> Observation:
    return Observation(
        observation_id=name,
        status="conflicting",
        amount=None,
        citations=(CITE,),
        reason="Two sources disagree.",
        alternatives=(
            {"amount": Decimal(1), "citations": (CITE,), "explanation": "One."},
            {"amount": Decimal(2), "citations": (CITE,), "explanation": "Two."},
        ),
    )


def facility(
    facility_id: str, period_id: str, amount: int, issued_on: date | None = None
) -> FacilityObservation:
    gap = Observation(
        observation_id=f"{facility_id}.{period_id}.gap",
        status="missing",
        amount=None,
        citations=(),
        reason="Not stated.",
    )
    return FacilityObservation(
        facility_id=facility_id,
        facility_name=facility_id,
        period_id=period_id,
        facility_type="SENIOR NOTES",
        currency="USD",
        carrying_value=known(f"{facility_id}.{period_id}", amount),
        principal=gap,
        drawn_amount=gap,
        commitment=gap,
        secured_status="NOT_STATED",
        seniority="NOT_STATED",
        lease_classification="NOT_LEASE",
        margin_or_coupon="n/a",
        maturity_date=None,
        maturity_limitation="Not stated.",
        rate_type="NOT_STATED",
        reference_rate="NOT_STATED",
        spread_bps=gap,
        floor_bps=gap,
        fixed_rate=gap,
        annual_amortisation=gap,
        terms_citations=(CITE,),
        issued_on=issued_on,
        issuance_citations=(CITE,) if issued_on else (),
    )


def bs_line(period_id: str, item: str, value: Observation) -> StatementLine:
    return StatementLine(
        line_id=f"BS.{item}.{period_id}",
        statement="BS",
        item_id=item,
        label=item,
        period_id=period_id,
        display_priority=1,
        line_kind="detail",
        value=value,
    )


def book(**fields: object) -> FinancialBook:
    base: dict[str, object] = {
        "book_id": "book",
        "entity_perimeter": "consolidated group",
        "accounting_basis": "IFRS",
        "currency": "USD",
        "unit": "MILLIONS",
        "periods": tuple(period(p) for p in ("fy-2024", "fy-2025", "pf-2025")),
        "accounts": (),
        "addbacks": (),
        "segments": (),
        "kpis": (),
        "facilities": (),
        "pro_forma": (),
        "segment_allocation": (),
        "addback_disclosure": NONE,
        "segment_disclosure": NONE,
    }
    return FinancialBook(**{**base, **fields})


def debt_check(b: FinancialBook):
    return _debt(b, period("fy-2025"), {})


def test_a_pro_forma_facility_is_not_added_to_the_reported_debt():
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
        ),
        facilities=(
            facility("notes", "fy-2025", 100),
            facility("refi-notes", "pf-2025", 50),
        ),
    )
    check = debt_check(b)
    assert check.reported_value == Decimal(100)
    assert check.calculated_value == Decimal(100)


def test_a_pro_forma_conflicting_debt_row_does_not_override_the_reported_one():
    b = book(
        accounts=(
            AccountObservation(
                metric_id="total_debt", period_id="pf-2025", value=conflicting("pf")
            ),
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
        ),
        facilities=(facility("notes", "fy-2025", 100),),
    )
    assert debt_check(b).reported_value == Decimal(100)


def test_a_pro_forma_period_reads_its_own_debt():
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="pf-2025", value=known("p", 150)),
        ),
        facilities=(
            facility("notes", "pf-2025", 100),
            facility("refi-notes", "pf-2025", 50),
        ),
    )
    check = _debt(b, period("pf-2025"), {})
    assert check.reported_value == Decimal(150)
    assert check.calculated_value == Decimal(150)


def test_a_pro_forma_cash_row_does_not_stand_in_for_the_reported_closing_cash():
    b = book(
        accounts=(
            AccountObservation(
                metric_id="cash_and_equivalents", period_id="pf-2025", value=known("p", 999)
            ),
            AccountObservation(
                metric_id="cash_and_equivalents", period_id="fy-2025", value=known("c", 40)
            ),
            AccountObservation(
                metric_id="cash_and_equivalents", period_id="fy-2024", value=known("o", 30)
            ),
        ),
    )
    terms = _cash_movement(b, period("fy-2025")).components
    closing = next(t for t in terms if t.label == "cash_and_equivalents" and t.coefficient == 1)
    assert closing.amount == Decimal(40)


def movement_book(*equity: tuple[str, Observation]) -> FinancialBook:
    return book(
        statement_lines=tuple(bs_line(p, "total_equity", v) for p, v in equity),
        balance_movement_bridges=(
            BalanceMovementBridge(
                bridge_id="eq",
                period_id="fy-2025",
                balance_item_id="total_equity",
                movement_ids=(),
                disclosure=DISCLOSURE,
            ),
        ),
    )


def test_a_pro_forma_balance_line_does_not_stand_in_for_the_reported_closing_balance():
    b = movement_book(
        ("pf-2025", known("p", 999)),
        ("fy-2025", known("c", 130)),
        ("fy-2024", known("o", 100)),
    )
    check = next(
        c for c in _balance_movements(b, period("fy-2025")) if c.metric_id == "total_equity"
    )
    assert check.reported_value == Decimal(130)


def test_a_pro_forma_period_reads_its_own_closing_balance_line():
    b = movement_book(("pf-2025", known("p", 999)), ("fy-2025", known("c", 130)))
    check = next(
        c for c in _balance_movements(b, period("pf-2025")) if c.metric_id == "total_equity"
    )
    assert check.reported_value == Decimal(999)


def test_two_reported_periods_with_one_end_date_still_conflict():
    twin = FinancialPeriod(**{**period("fy-2025").model_dump(), "period_id": "fy-2025b"})
    b = book(
        periods=(period("fy-2024"), period("fy-2025"), twin),
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
            AccountObservation(metric_id="total_debt", period_id="fy-2025b", value=known("e", 101)),
        ),
        facilities=(
            facility("notes", "fy-2025", 100),
            facility("notes", "fy-2025b", 101),
        ),
        statement_lines=(
            bs_line("fy-2025", "total_equity", known("e1", 130)),
            bs_line("fy-2025b", "total_equity", known("e2", 131)),
        ),
    )
    issues = [i for i in (*book_issues(b), *statement_issues(b)) if "same-date" in i]
    assert any("account balances: total_debt" in i for i in issues)
    assert any("facility balances: notes" in i for i in issues)
    assert any("statement balances: total_equity" in i for i in issues)


def test_a_pro_forma_period_reads_its_own_debt_row_though_the_reported_one_is_listed_first():
    """Direct call of `_debt`: the reported rows precede the pro forma ones in book order."""
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
            AccountObservation(metric_id="total_debt", period_id="pf-2025", value=known("p", 150)),
        ),
        facilities=(facility("notes", "fy-2025", 100), facility("notes", "pf-2025", 150)),
    )
    check = _debt(b, period("pf-2025"), {})
    assert check.reported_value == Decimal(150)
    assert check.calculated_value == Decimal(150)


def test_a_pro_forma_own_known_row_wins_over_a_conflicting_reported_one():
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=conflicting("c")),
            AccountObservation(metric_id="total_debt", period_id="pf-2025", value=known("p", 150)),
        ),
        facilities=(facility("notes", "fy-2025", 100), facility("notes", "pf-2025", 150)),
    )
    check = _debt(b, period("pf-2025"), {})
    assert check.reported_value == Decimal(150)
    assert check.calculated_value == Decimal(150)


def test_a_pro_forma_period_reads_the_reported_sibling_only_where_it_has_no_row_of_its_own():
    b = book(
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="fy-2025", value=known("d", 100)),
        ),
        facilities=(facility("notes", "fy-2025", 100),),
    )
    check = _debt(b, period("pf-2025"), {})
    assert check.reported_value == Decimal(100)
    assert check.calculated_value == Decimal(100)


def test_a_pro_forma_period_reads_its_own_balance_line_though_the_reported_one_is_listed_first():
    b = movement_book(("fy-2025", known("c", 130)), ("pf-2025", known("p", 999)))
    check = next(
        c for c in _balance_movements(b, period("pf-2025")) if c.metric_id == "total_equity"
    )
    assert check.reported_value == Decimal(999)


def test_a_pro_forma_period_reads_its_own_cash_row_though_the_reported_one_is_listed_first():
    b = book(
        accounts=(
            AccountObservation(
                metric_id="cash_and_equivalents", period_id="fy-2025", value=conflicting("c")
            ),
            AccountObservation(
                metric_id="cash_and_equivalents", period_id="pf-2025", value=known("p", 999)
            ),
            AccountObservation(
                metric_id="cash_and_equivalents", period_id="fy-2024", value=known("o", 30)
            ),
        ),
    )
    terms = _cash_movement(b, period("pf-2025")).components
    closing = next(t for t in terms if t.label == "cash_and_equivalents" and t.coefficient == 1)
    assert closing.amount == Decimal(999)


def test_a_facility_held_only_in_an_earlier_pro_forma_period_is_named_missing_at_a_later_date():
    """BASE behaviour kept: Q3 reported debt BLOCKs naming `notes2`, never silently omitting it."""
    b = book(
        periods=(period("pf-h1-2025"), period("q3-2025")),
        accounts=(
            AccountObservation(metric_id="total_debt", period_id="q3-2025", value=known("d", 100)),
        ),
        facilities=(
            facility("notes", "q3-2025", 100),
            facility("notes2", "pf-h1-2025", 50, issued_on=date(2025, 6, 30)),
        ),
    )
    check = _debt(b, period("q3-2025"), {})
    assert check.status == "BLOCK"
    assert check.calculated_value is None
    missing = next(t for t in check.components if t.label == "notes2")
    assert missing.amount is None
    assert missing.reason == "Not supplied"
