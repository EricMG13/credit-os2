"""Undated periods are not one date: a facility's gap in one undated period is its own.

Synthetic book written here; no issuer evidence. Scope: `facility_fx.normalize_facilities` and
`fx_conversion_issues` for periods without an end date.
"""

from datetime import date
from decimal import Decimal

from deploy_vii.contracts import Citation
from deploy_vii.facility_fx import fx_conversion_issues, normalize_facilities
from deploy_vii.financial_contracts import (
    Disclosure,
    FacilityObservation,
    FinancialBook,
    FinancialPeriod,
    Observation,
)

CITE = Citation(source_id="S1", source_sha256="a" * 64, locator="p.4", quote="Notes 10")
NONE = Disclosure(status="not_applicable", explanation="Synthetic.", citations=(CITE,))


def period(period_id: str) -> FinancialPeriod:
    return FinancialPeriod(
        period_id=period_id,
        fiscal_year="2025",
        fiscal_quarter=None,
        period_type="YTD",
        start_date=None,
        end_date=None,
        day_count=None,
        audit_status="Synthetic",
        currency="USD",
        unit="MILLIONS",
        accounting_basis="IFRS",
        entity_perimeter="consolidated group",
        citations=(CITE,),
        limitation="Dates not stated.",
    )


def gap(name: str) -> Observation:
    return Observation(
        observation_id=name, status="missing", amount=None, citations=(), reason="Not stated."
    )


def conflicting() -> Observation:
    return Observation(
        observation_id="a.carry",
        status="conflicting",
        amount=None,
        citations=(CITE,),
        reason="Two sources disagree.",
        alternatives=(
            {"amount": Decimal(1), "citations": (CITE,), "explanation": "One."},
            {"amount": Decimal(2), "citations": (CITE,), "explanation": "Two."},
        ),
    )


def facility(period_id: str, carrying: Observation) -> FacilityObservation:
    return FacilityObservation(
        facility_id="eur-notes",
        facility_name="EUR notes",
        period_id=period_id,
        facility_type="SENIOR NOTES",
        currency="EUR",
        carrying_value=carrying,
        principal=gap(f"{period_id}.p"),
        drawn_amount=gap(f"{period_id}.d"),
        commitment=gap(f"{period_id}.c"),
        secured_status="NOT_STATED",
        seniority="NOT_STATED",
        lease_classification="NOT_LEASE",
        margin_or_coupon="n/a",
        maturity_date=None,
        maturity_limitation="Not stated.",
        rate_type="NOT_STATED",
        reference_rate="NOT_STATED",
        spread_bps=gap(f"{period_id}.s"),
        floor_bps=gap(f"{period_id}.f"),
        fixed_rate=gap(f"{period_id}.x"),
        annual_amortisation=gap(f"{period_id}.a"),
        terms_citations=(CITE,),
    )


def book() -> FinancialBook:
    known = Observation(
        observation_id="b.carry", status="known", amount=Decimal(10), citations=(CITE,)
    )
    return FinancialBook(
        book_id="book",
        entity_perimeter="consolidated group",
        accounting_basis="IFRS",
        currency="USD",
        unit="MILLIONS",
        periods=(period("ytd-a"), period("ytd-b")),
        accounts=(),
        addbacks=(),
        segments=(),
        kpis=(),
        facilities=(facility("ytd-a", conflicting()), facility("ytd-b", known)),
        pro_forma=(),
        segment_allocation=(),
        addback_disclosure=NONE,
        segment_disclosure=NONE,
    )


def carrying(period_id: str):
    return next(
        n
        for n in normalize_facilities(book())
        if n.period_id == period_id and n.field == "carrying_value"
    )


def test_a_conflict_in_one_undated_period_does_not_reach_another():
    assert carrying("ytd-b").reason == "No explicit source-bound FX conversion"
    assert carrying("ytd-b").input_observation_ids == ("b.carry",)


def test_the_conflicting_undated_period_keeps_its_own_conflict():
    assert carrying("ytd-a").reason == "Same-date source amount is conflicting"
    assert "a.carry" in carrying("ytd-a").input_observation_ids


def test_undated_periods_pass_the_conversion_checks():
    assert fx_conversion_issues(book()) == ()


def dated(period_id: str, kind: str) -> FinancialPeriod:
    return FinancialPeriod(
        **{
            **period(period_id).model_dump(),
            "period_type": kind,
            "start_date": date(2025, 1, 1),
            "end_date": date(2025, 12, 31),
            "limitation": None,
        }
    )


def dated_book(*rows: tuple[str, Observation], kinds: dict[str, str]) -> FinancialBook:
    return FinancialBook(
        **{
            **book().model_dump(),
            "periods": tuple(dated(p, k) for p, k in kinds.items()),
            "facilities": tuple(facility(p, v) for p, v in rows),
        }
    )


def carrying_of(b: FinancialBook, period_id: str):
    return next(
        n
        for n in normalize_facilities(b)
        if n.period_id == period_id and n.field == "carrying_value"
    )


KNOWN = Observation(observation_id="b.carry", status="known", amount=Decimal(10), citations=(CITE,))


def test_a_pro_forma_conflict_does_not_null_the_reported_period_normalisation():
    b = dated_book(("fy", KNOWN), ("pf", conflicting()), kinds={"fy": "FY", "pf": "PF"})
    assert carrying_of(b, "fy").reason == "No explicit source-bound FX conversion"
    assert carrying_of(b, "fy").input_observation_ids == ("b.carry",)


def test_a_pro_forma_period_keeps_its_own_conflict():
    b = dated_book(("fy", KNOWN), ("pf", conflicting()), kinds={"fy": "FY", "pf": "PF"})
    assert carrying_of(b, "pf").reason == "Same-date source amount is conflicting"
    assert fx_conversion_issues(b) == ()


def test_a_reported_conflict_still_reaches_a_same_date_reported_alias():
    b = dated_book(("fy", KNOWN), ("fy-b", conflicting()), kinds={"fy": "FY", "fy-b": "FY"})
    assert carrying_of(b, "fy").reason == "Same-date source amount is conflicting"
