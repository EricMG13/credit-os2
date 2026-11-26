"""An analyst-submitted input is shown as submitted, within the reader ruling's two decimals.

Expected strings are written by hand from the submitted figures (S02-owners-cp2e-cp3-1-1, -1-2).
"""

from datetime import date
from decimal import Decimal as D

import pytest

from deploy_vii.display import written_places
from deploy_workflow.owners import cp2g as g
from deploy_workflow.owners import cp3d as c


@pytest.mark.parametrize(
    ("amount", "places"),
    [
        ("0.0475", 2),
        ("0.05", 0),
        ("0.2565", 2),
        ("0.375", 1),
        ("0.98125", 3),
        ("0", 0),
        ("1E+1", 0),
    ],
)
def test_written_places_counts_the_percent_digits_as_submitted(amount: str, places: int) -> None:
    assert written_places(D(amount), "percent") == places


@pytest.mark.parametrize(
    ("value", "shown"),
    [("0.0475", "4.75%"), ("0.05", "5.0%"), ("0.2565", "25.65%"), ("0.0525", "5.25%")],
)
def test_cp2g_submitted_percent_driver_keeps_its_digits(value: str, shown: str) -> None:
    book = g._Book()
    book.num(
        ("T2H.3", "a05", "fy1"),
        "FY1",
        D(value),
        "percent",
        "analyst input",
        value_class="analyst_judgment",
    )
    assert book.by_id["T2H.3.a05.fy1"].shown == shown


def test_cp2g_computed_percent_keeps_the_class_default() -> None:
    book = g._Book()
    book.num(("T2H.6", "r01", "ratio"), "Ratio", D("0.0475"), "percent", "calc")
    assert book.by_id["T2H.6.r01.ratio"].shown == "4.8%"


def _q(text: str) -> c.QuoteRef:
    return c.QuoteRef(source_id="mkt", locator="page:1", quote=text)


def test_cp3d_table_only_inputs_keep_their_digits_and_quoted_levels_stay_at_two() -> None:
    page = (
        "Alder Term Loan B bid 98.125 offer 99.125. Margin 350 bps. "
        "Matures June 30, 2029. SOFR 4.3125 percent."
    )
    sub = c.MarketImpliedSubmission(
        instrument=c.Instrument(name="Alder Term Loan B", quote=_q("Alder Term Loan B")),
        observations=(
            c.Observation(kind="bid", source_id="mkt", locator="page:1", quote="bid 98.125",
                          level_text="98.125", as_of_text="January 5, 2026"),
            c.Observation(kind="offer", source_id="mkt", locator="page:1", quote="offer 99.125",
                          level_text="99.125", as_of_text="January 5, 2026"),
        ),
        terms=c.Terms(
            maturity=c.MaturityTerm(quote=_q("Matures June 30, 2029"), date_text="June 30, 2029"),
            margin=c.MarginTerm(quote=_q("Margin 350 bps"), bps_text="350"),
            amortisation=c.AmortisationTerm(quote=_q("Amortisation 0"), value_text="0"),
            reference_rate=c.ReferenceRate(
                name="SOFR", quote=_q("SOFR 4.3125 percent"),
                level=c.ReferenceLevel(quote=_q("SOFR 4.3125 percent"), percent_text="4.3125"),
            ),
        ),
        recovery=c.Recovery(percent_text="37.5", rationale="r"),
        technicals=(),
        summary=c.Summary(text="s"),
    )  # fmt: skip
    ctx = c.MarketContext(
        pages={"mkt": {"page:1": page}}, names={"mkt": "Mkt"}, third_party=frozenset({"mkt"}),
        published={}, run_as_of=date(2026, 1, 10), context_quote_rows={},
    )  # fmt: skip
    result = c.market_implied_result(submission=sub, context=ctx)
    facts = {f.fact_id: f for t in result.tables for r in t.rows for f in r.facts}
    assert {k: facts[k].shown for k in (
        "T3E.1.r01.level", "T3E.1.r02.level", "T3E.3.r04.bid", "T3E.4.r01.value")
    } == {
        "T3E.1.r01.level": "98.13%", "T3E.1.r02.level": "99.13%",
        "T3E.3.r04.bid": "4.3125%", "T3E.4.r01.value": "37.5%",
    }  # fmt: skip


def test_cp3d_mid_in_the_level_sentence_shows_two_decimals_like_bid_and_offer() -> None:
    """S02-owners-cp2e-cp3-1-2 (ruling): the claim read "98.13% bid and 99.13% offer, a mid of
    98.625%"; the reader standard is two decimals, so the mid reads 98.63% (98.625 by hand)."""
    page = (
        "Alder Term Loan B bid 98.125 offer 99.125. Margin 350 bps. "
        "Matures June 30, 2029. SOFR 4.3125 percent."
    )
    sub = c.MarketImpliedSubmission(
        instrument=c.Instrument(name="Alder Term Loan B", quote=_q("Alder Term Loan B")),
        observations=(
            c.Observation(kind="bid", source_id="mkt", locator="page:1", quote="bid 98.125",
                          level_text="98.125", as_of_text="January 5, 2026"),
            c.Observation(kind="offer", source_id="mkt", locator="page:1", quote="offer 99.125",
                          level_text="99.125", as_of_text="January 5, 2026"),
        ),
        terms=c.Terms(
            maturity=c.MaturityTerm(quote=_q("Matures June 30, 2029"), date_text="June 30, 2029"),
            margin=c.MarginTerm(quote=_q("Margin 350 bps"), bps_text="350"),
            amortisation=c.AmortisationTerm(quote=_q("Amortisation 0"), value_text="0"),
            reference_rate=c.ReferenceRate(
                name="SOFR", quote=_q("SOFR 4.3125 percent"),
                level=c.ReferenceLevel(quote=_q("SOFR 4.3125 percent"), percent_text="4.3125"),
            ),
        ),
        recovery=c.Recovery(percent_text="37.5", rationale="r"),
        technicals=(),
        summary=c.Summary(text="s"),
    )  # fmt: skip
    ctx = c.MarketContext(
        pages={"mkt": {"page:1": page}}, names={"mkt": "Mkt"}, third_party=frozenset({"mkt"}),
        published={}, run_as_of=date(2026, 1, 10), context_quote_rows={},
    )  # fmt: skip
    result = c.market_implied_result(submission=sub, context=ctx)
    facts = {f.fact_id: f for t in result.tables for r in t.rows for f in r.facts}
    assert facts["T3E.2.r01.value"].shown == "98.63%"


def _macro_inputs(**over):  # type: ignore[no-untyped-def]
    from deploy_workflow.owners import cp2e as m

    cite = m.Cite("financial", "page:1", "x")

    def src(v: str) -> m.Sourced:
        return m.Sourced(D(v), cite)

    base = {
        "reporting_currency": m.SourcedCode("USD", cite),
        "total_debt": src("100"),
        "ebitda": src("30"),
        "interest": src("5"),
        "fcf": src("10"),
        "fx_cash_effect": src("0"),
        "facility": m.FacilityTerms(
            src("60"), m.RateBasis("FLOATING", "SOFR", cite), src("0"), src("0")
        ),
        "rate_absence": None,
        "debt_currency": m.SourcedCode("EUR", cite),
        "debt_currency_absence": None,
        "foreign_ebitda_share": None,
        "operating_fx_absence": m.Absence("r", "f"),
        "hedge_ratio": None,
        "hedge_absence": m.Absence("r", "f"),
        "rate_shocks_bp": (D(100),),
        "fx_shocks": (D("0.1"),),
        "shock_rationale": "r",
        "assessments": (),
        "summary": "s",
        "source_names": {"financial": "Fin"},
    }
    base.update(over)
    return m, m.MacroFxInputs(**base), src


def _cp2e_shown(result, fact_id: str) -> str:  # type: ignore[no-untyped-def]
    cells = (c for t in result.tables for r in t.rows for c in r.cells)
    return next(c for c in cells if c.fact_id == fact_id).shown


def test_cp2e_hedge_ratio_shows_the_submitted_digits() -> None:
    """S02-owners-cp2e-cp3-1-3: a 62.5% hedge read "63%", the balance beside it used 62.5%."""
    m, inputs, _ = _macro_inputs(hedge_ratio=D("0.625"), hedge_absence=None)
    assert _cp2e_shown(m.compute(inputs), "T2F.5.r01.value") == "62.5%"


def test_cp2e_whole_hedge_ratio_keeps_its_whole_percent() -> None:
    m, inputs, _ = _macro_inputs(hedge_ratio=D("0.5"), hedge_absence=None)
    assert _cp2e_shown(m.compute(inputs), "T2F.5.r01.value") == "50%"


def test_cp2e_foreign_ebitda_share_shows_the_submitted_digits() -> None:
    """S02-owners-cp2e-cp3-2-2: 32.55% of EBITDA read "32.6%" beside arithmetic on 32.55%."""
    from deploy_workflow.owners import cp2e as m0

    share = m0.Sourced(D("0.3255"), m0.Cite("financial", "page:1", "x"))
    m, inputs, _ = _macro_inputs(foreign_ebitda_share=share, operating_fx_absence=None)
    assert _cp2e_shown(m.compute(inputs), "T2F.1.r12.value") == "32.55%"


def test_cp2g_a_conflicting_cp1_operand_is_named_conflicting_not_missing() -> None:
    """S02-owners-cp2e-cp3-1-4: two disagreeing sources are not a missing figure."""
    from deploy_vii.contracts import Fact
    from deploy_workflow.owners.period_basis import DEFAULT_BASIS as basis

    def fact(metric: str, **kw: object) -> Fact:
        return Fact(
            fact_id=f"T4.10.x.{metric}", label=f"{basis.ltm_column} · {metric}", table_id="T4.10",
            row_id="x", field=metric, unit="MILLIONS", currency=basis.currency,
            scale=D(1000000), period=basis.ltm_period, value_class="source", **kw,
        )  # fmt: skip

    facts = [
        fact(m, status="conflicting", limitation="Two sources differ")
        if m == "ebitda"
        else fact(m, amount=D(10))
        for m in g.CP1_METRICS
    ]
    ops = g.Operands.from_cp1(facts, basis)
    assert ops.ebitda.reason == (
        f"Not calculable: base EBITDA is conflicting in CP-1 ({basis.ltm_period})"
    )
    assert g._operand_state(ops.ebitda) == "conflicting"
    assert ops.revenue.amount == D(10)


def test_cp2h_percentage_point_headroom_is_two_decimals_not_thirty_eight_digits() -> None:
    """S02-owners-cp2e-cp3-2-1. By hand: FCF 9 / debt 47.3 = 90/473; against a 5.0% floor the
    headroom is (90/473 - 0.05) x 100 = 6635/473 = 14.0275 pp, so 14.03 pp at two decimals."""
    from fractions import Fraction

    from deploy_vii.contracts import Fact
    from deploy_workflow.owners import cp2h as h
    from deploy_workflow.owners.period_basis import DEFAULT_BASIS as basis

    exact = Fraction(6635, 473)
    term = h.TriggerTerm("Alder", "Downgrade", "FCF to debt", "Below", "5.0%", D("0.05"), "line")
    metric = h.Metric("fcf_to_debt", "percent", "fcf_to_debt")
    fact = Fact(
        fact_id="T2H.6.a25.fcf_to_debt", label="x", table_id="T2H.6", row_id="a25",
        field="fcf_to_debt", amount=D(90) / D(473), unit="PERCENT", period=basis.ltm_period,
        value_class="calculated",
    )  # fmt: skip
    value, reached = h._Test("t01", term, metric).headroom(fact)
    assert value == D("14.03")
    assert abs(Fraction(value) - exact) < Fraction(5, 1000)
    assert reached is False
