"""A constructed period's debt check ignores a facility held only in a same-date pro forma period.

Built on the synthetic Northbridge case of `test_financial_workflow` (no issuer evidence). Scope:
`period_reconciliation` DEBT_TOTAL_EX_LEASES on constructed periods; the source check of the same
date is 50 = 50. Expected values are written by hand.
"""

import json
from copy import deepcopy
from datetime import date
from decimal import Decimal

from test_financial_workflow import financials, make_pack

from deploy_vii.financial_contracts import FinancialReview
from deploy_vii.period_reconciliation import reconcile_periods


def _review(*, pro_forma_facility: bool):
    pack = make_pack()
    fin = json.loads(json.dumps(financials(pack)["financial"]))
    fin["pack_sha256"] = pack.content_hash()
    book = fin["books"][0]
    scope = {
        "currency": "USD",
        "unit": "MILLIONS",
        "accounting_basis": "IFRS",
        "entity_perimeter": "consolidated group",
    }
    book.update(scope)
    for period in book["periods"]:
        period.update(scope)
    if pro_forma_facility:
        fy = next(p for p in book["periods"] if p["period_id"] == "fy-2025")
        book["periods"].append(
            {
                **deepcopy(fy),
                "period_id": "pf-2025",
                "period_type": "PF",
                "component_period_ids": [],
            }
        )
        row = next(r for r in book["facilities"] if r["period_id"] == "fy-2025")
        pf_row = {
            **deepcopy(row),
            "facility_id": "pf-notes",
            "facility_name": "Pro forma notes",
            "period_id": "pf-2025",
        }
        for value in pf_row.values():
            if isinstance(value, dict) and "observation_id" in value:
                value["observation_id"] += "-pf"
        book["facilities"].append(pf_row)
    review = FinancialReview.model_validate_json(json.dumps(fin))
    return pack, review


def _debt_checks(pack, review):
    report = reconcile_periods(pack, review, "consolidated")
    ends = {n.construction_id: n.end_date for n in report.historical.constructions}
    return [
        (ends[c.construction_id], c)
        for c in report.checks
        if c.metric_id == "total_debt" and c.check_type == "DEBT_TOTAL_EX_LEASES"
    ]


YEAR_END = date(2025, 12, 31)


def test_a_facility_only_in_a_same_date_pro_forma_period_is_no_part_of_the_constructed_debt():
    """Source check 50 = 50; q4, FY and LTM constructed checks must be 50, not 50 + 50 = 100."""
    pack, review = _review(pro_forma_facility=True)
    year_end = [c for end, c in _debt_checks(pack, review) if end == YEAR_END]
    assert len(year_end) == 3
    for check in year_end:
        assert check.reported.amount == Decimal(50)
        assert check.calculated_value == Decimal(50)
        assert check.status == "PASS"
        assert all(t.label != "pf-notes" for t in check.components)


def test_a_book_without_pro_forma_keeps_its_constructed_debt_checks():
    """Equality guard: the normal book gives 46.25, 47.5, 48.75 and 50 x 3, all PASS."""
    pack, review = _review(pro_forma_facility=False)
    checks = _debt_checks(pack, review)
    assert [c.calculated_value for _, c in checks] == [
        Decimal("46.25"),
        Decimal("47.5"),
        Decimal("48.75"),
        Decimal(50),
        Decimal(50),
        Decimal(50),
    ]
    assert {c.status for _, c in checks} == {"PASS"}


def _conflicting_debt_review():
    """Reported q4/FY total_debt conflict; a same-date pro forma total_debt of 50 is known."""
    pack, review = _review(pro_forma_facility=False)
    data = json.loads(review.model_dump_json())
    book = data["books"][0]
    fy = next(p for p in book["periods"] if p["period_id"] == "fy-2025")
    book["periods"].append(
        {**deepcopy(fy), "period_id": "pf-2025", "period_type": "PF", "component_period_ids": []}
    )
    line = next(
        ln
        for ln in book["statement_lines"]
        if ln["item_id"] == "total_debt" and ln["period_id"] == "fy-2025"
    )
    pf = deepcopy(line)
    pf["period_id"] = "pf-2025"
    pf["value"] = {**pf["value"], "observation_id": "BS-debt-pf", "amount": "50"}
    for ln in book["statement_lines"]:
        if ln["item_id"] == "total_debt" and ln["period_id"] in ("fy-2025", "q4-2025"):
            cites = ln["value"]["citations"]
            ln["value"] = {
                "observation_id": ln["value"]["observation_id"],
                "status": "conflicting",
                "amount": None,
                "citations": cites,
                "reason": "Two printed figures.",
                "alternatives": [
                    {"amount": "1", "citations": cites, "explanation": "One."},
                    {"amount": "2", "citations": cites, "explanation": "Two."},
                ],
            }
    book["statement_lines"].append(pf)
    return pack, FinancialReview.model_validate_json(json.dumps(data))


def test_a_reported_debt_conflict_is_not_papered_over_by_a_same_date_pro_forma_figure():
    from deploy_vii.financial_model import model_report

    pack, review = _conflicting_debt_review()
    year_end = [c for end, c in _debt_checks(pack, review) if end == YEAR_END]
    assert len(year_end) == 3
    assert {c.status for c in year_end} == {"BLOCK"}
    assert all("BS-debt-pf" not in c.reported.observation_ids for c in year_end)
    model = model_report(pack, review, "consolidated")
    bases = {b.basis_id: b for b in model.bases}
    found = [
        v
        for v in model.values
        if v.key == "acct:total_debt" and bases[v.basis_id].label in ("Q4 25", "FY25", "LTM Q4 25")
    ]
    assert len(found) == 4  # the LTM Q4 25 label is carried by two bases
    assert all(v.value.amount is None for v in found)
