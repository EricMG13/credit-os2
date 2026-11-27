"""An undated column still reads its own period's balance in the statement history.

Built on the synthetic Northbridge case of `test_financial_workflow` (no issuer evidence). Scope:
`statement_history` closing/opening reads of a balance for a column with no end date. The
kernel (`model.history._balance`) reads the column's own period first; so must this.
Expected values are written by hand.
"""

import json
from copy import deepcopy
from datetime import date
from decimal import Decimal

from test_financial_workflow import financials, make_pack

from deploy_vii.financial_contracts import FinancialReview
from deploy_vii.statement_history import statement_history

SCOPE = {
    "currency": "USD",
    "unit": "MILLIONS",
    "accounting_basis": "IFRS",
    "entity_perimeter": "consolidated group",
}


def _review(*, undated: bool = False, pro_forma: bool = False, own_cash: bool = True):
    pack = make_pack()
    fin = json.loads(json.dumps(financials(pack)["financial"]))
    fin["pack_sha256"] = pack.content_hash()
    book = fin["books"][0]
    book.update(SCOPE)
    for period in book["periods"]:
        period.update(SCOPE)
    if undated:
        q2 = next(p for p in book["periods"] if p["period_id"] == "q2-2025")
        book["periods"].append(
            {
                **deepcopy(q2),
                "period_id": "ytd-h1",
                "period_type": "YTD",
                "fiscal_quarter": None,
                "start_date": None,
                "end_date": None,
                "day_count": None,
                "component_period_ids": ["q1-2025", "q2-2025"],
                "limitation": "YTD dates not stated",
            }
        )
        line = next(
            ln
            for ln in book["statement_lines"]
            if ln["item_id"] == "cash_and_equivalents" and ln["period_id"] == "q2-2025"
        )
        own = deepcopy(line)
        own["period_id"] = "ytd-h1"
        own["value"] = {
            **own["value"],
            "observation_id": "BS-cash-ytd-h1",
            "amount": "20.00",
        }
        if own_cash:
            book["statement_lines"].append(own)
    if pro_forma:
        fy = next(p for p in book["periods"] if p["period_id"] == "fy-2025")
        book["periods"].append(
            {
                **deepcopy(fy),
                "period_id": "pf-2025",
                "period_type": "PF",
                "component_period_ids": [],
            }
        )
        line = next(
            ln
            for ln in book["statement_lines"]
            if ln["item_id"] == "cash_and_equivalents" and ln["period_id"] == "fy-2025"
        )
        pf_line = deepcopy(line)
        pf_line["period_id"] = "pf-2025"
        pf_line["value"] = {
            "observation_id": "BS-cash-pf-2025",
            "status": "conflicting",
            "amount": None,
            "citations": line["value"]["citations"],
            "reason": "Two printed pro forma figures.",
            "alternatives": [
                {"amount": "1", "citations": line["value"]["citations"], "explanation": "One."},
                {"amount": "2", "citations": line["value"]["citations"], "explanation": "Two."},
            ],
        }
        book["statement_lines"].append(pf_line)
    return pack, FinancialReview.model_validate_json(json.dumps(fin))


def _cash(report, column):
    return [
        v
        for v in report.values
        if v.table_id == "T4.6"
        and v.item_id == "cash_and_equivalents"
        and v.construction_id == column
    ]


def test_an_undated_column_reads_its_own_period_balance():
    pack, review = _review(undated=True)
    report = statement_history(pack, review, "consolidated")
    ytd = next(
        c for c in report.constructions if c.own_period_id == "ytd-h1" and c.end_date is None
    )
    (value,) = _cash(report, ytd.construction_id)
    assert value.value.amount == Decimal("20.00")


def test_a_dated_book_reads_the_same_balances():
    """Equality guard: with every period dated, each column's cash is its own period's line."""
    pack, review = _review(undated=False)
    report = statement_history(pack, review, "consolidated")
    ends = {c.construction_id: c.end_date for c in report.constructions}
    cash = [
        v for v in report.values if v.table_id == "T4.6" and v.item_id == "cash_and_equivalents"
    ]
    assert cash
    assert all(ends[v.construction_id] is not None for v in cash)
    assert all(v.value.amount is not None for v in cash)


def test_a_pro_forma_conflicting_balance_line_does_not_blank_the_reported_year_end_balance():
    """The year-end column (the LTM to 2025-12-31) reads the reported 20.00, not a conflict."""
    pack, review = _review(pro_forma=True)
    report = statement_history(pack, review, "consolidated")
    year_end = next(c for c in report.constructions if c.end_date == date(2025, 12, 31))
    (value,) = _cash(report, year_end.construction_id)
    plain = statement_history(*_review(), "consolidated")
    (expected,) = _cash(plain, year_end.construction_id)
    assert expected.value.amount == Decimal("20.00")
    assert value.value.amount == Decimal("20.00")


def test_an_undated_column_without_its_own_balance_keeps_the_closing_date_note():
    """No own cash line and no date to search by: NOT_SOURCED with the note, as at HEAD."""
    pack, review = _review(undated=True, own_cash=False)
    report = statement_history(pack, review, "consolidated")
    ytd = next(
        c for c in report.constructions if c.own_period_id == "ytd-h1" and c.end_date is None
    )
    (value,) = _cash(report, ytd.construction_id)
    assert value.value.amount is None
    assert value.value.reason == "NOT_SOURCED"
    assert value.value.note == "Closing date is unavailable"
