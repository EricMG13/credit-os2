"""Review round K7 of the chart producers (S.4, S.2/S.3 quarters, CR.2, CR.3, DR.2).

Expected values are written by hand from the fixtures below, never from production output.
"""

from __future__ import annotations

from decimal import Decimal
from types import SimpleNamespace

import pytest

from deploy_vii import report_view
from deploy_vii.contracts import Fact, ModuleView, ReportTable, TableColumn, TableRow
from deploy_vii.distressed_figures import _cp4c_figures
from deploy_vii.financial_series import cp1_chart_series
from deploy_vii.liquidity_series import cp2d_chart_series, cp3c_chart_series
from deploy_vii.restructuring_series import cp4c_chart_series
from tests.test_financial_series import (
    COLUMNS,
    PERIODS,
    QUARTER_COLUMNS,
    QUARTERS,
    categories,
    facility_facts,
    figure,
    module,
)

HASH = "b" * 64


def facility_at(pid: str, fid: str, *, as_fid: str | None = None, principal: str | None = None):
    """The facility_facts rows of `fid` at `pid`, optionally renamed or restated."""
    target = as_fid or fid
    out = []
    for fact in facility_facts(pid):
        if f"T4.18:{fid}." not in fact.fact_id:
            continue
        update = {
            "fact_id": fact.fact_id.replace(fid, target),
            "row_id": fact.row_id.replace(fid, target),
        }
        if fact.field == "facility_id":
            update["text"] = target
        if fact.field == "facility_name" and as_fid is not None:
            update["text"] = "Pro forma notes"
        if fact.field == "principal" and principal is not None:
            update["amount"] = Decimal(principal)
        out.append(fact.model_copy(update=update))
    return tuple(out)


PF_PERIODS = {**QUARTERS, "pf-2025": PERIODS["pf-2025"]}
PF_COLUMNS = {**QUARTER_COLUMNS, "PF:pf-2025": COLUMNS["PF:pf-2025"]}


# K7-F1


def test_f1_a_pro_forma_only_facility_is_neither_plotted_nor_required() -> None:
    extra = (*facility_facts("q2-2025"), *facility_at("pf-2025", "fac-a", as_fid="fac-new"))
    item = figure(module(PF_PERIODS, PF_COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    # The four reported facilities of FACILITIES, by maturity; fac-new (pro forma only) absent.
    assert [p.series for p in item.points] == [
        "RCF",
        "Term loan B",
        "Senior notes 2027",
        "Senior notes 2030",
    ]
    assert not any("fac-new" in p.fact_id for p in item.points)


def test_f1_a_pro_forma_row_restating_a_reported_facility_does_not_blank_the_wall() -> None:
    extra = (*facility_facts("q2-2025"), *facility_at("pf-2025", "fac-a", principal="999"))
    item = figure(module(PF_PERIODS, PF_COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".q2-2025:" in p.fact_id for p in item.points)


# K7-F3


def quarters(first: tuple[str, str | None], second: tuple[str, str | None]):
    periods = {
        "qa": ("QUARTER", first[0], first[1], "2024-10-01", "2024-12-31"),
        "qb": ("QUARTER", second[0], second[1], "2025-01-01", "2025-03-31"),
    }
    return module(periods, {"Q:qa": "qa", "Q:qb": "qb"})


def test_f3_fiscal_years_spelled_differently_are_compared_as_years() -> None:
    view = quarters(("FY2024", "4"), ("2025", "1"))
    assert categories(figure(view, "S.2")) == ["Q4 FY2024", "Q1 2025"]


def test_f3_the_quarter_letter_is_case_insensitive() -> None:
    view = quarters(("2024", "q4"), ("2025", "Q1"))
    assert categories(figure(view, "S.2")) == ["Q4 2024", "Q1 2025"]


def test_f3_an_unparseable_fiscal_year_still_raises() -> None:
    with pytest.raises(ValueError, match="Ambiguous QUARTER identities"):
        cp1_chart_series(quarters(("later", "4"), ("2025", "1")))


# CR fixtures


def money(fact_id: str, label: str, amount: str) -> Fact:
    """A USD-millions fact; its table, row and field are the dotted parts of its id."""
    parts = fact_id.split(".")
    table, row, field = ".".join(parts[:2]), parts[2], parts[3] if len(parts) > 3 else "value"
    return Fact(
        fact_id=fact_id,
        label=label,
        table_id=table,
        row_id=row,
        field=field,
        amount=Decimal(amount),
        unit="MILLIONS",
        currency="USD",
        scale=Decimal(1000000),
        period="2025-06-30",
    )


def refs_of(view: ModuleView) -> dict[tuple[str, str], tuple[str, ...]]:
    """One citation reference per fact, as the report index would allocate."""
    return {(view.module_id, f.fact_id): (f"C{n}",) for n, f in enumerate(view.facts, 1)}


def cp3c(rows: dict[str, tuple[str, str, str]]) -> ModuleView:
    """T3D.1 rows: row id -> (label, c6, c7); c2 is a date text, c3 an amount."""
    facts: list[Fact] = []
    table_rows = []
    for row, (label, c6, c7) in rows.items():
        ids = []
        for field in ("c2", "c3", "c6", "c7"):
            fid = f"T3D.1.{row}.{field}"
            ids.append(fid)
            if field == "c2":
                facts.append(
                    Fact(
                        fact_id=fid,
                        label="Maturity",
                        table_id="T3D.1",
                        row_id=row,
                        field=field,
                        text="2027-03-01",
                    )
                )
            else:
                amount = {"c3": "1", "c6": c6, "c7": c7}[field]
                facts.append(money(fid, field, amount))
        table_rows.append(TableRow(row_id=row, label=label, fact_ids=tuple(ids)))
    table = ReportTable(
        table_id="T3D.1",
        title="Refinancing",
        columns=tuple(TableColumn(field=f, label=f) for f in ("c2", "c3", "c6", "c7")),
        rows=tuple(table_rows),
    )
    return ModuleView(
        module_id="CP-3C",
        title="Refi",
        aliases=(),
        status="accepted",
        artifact_sha256=HASH,
        facts=tuple(facts),
        tables=(table,),
    )


# K7-F2


def test_f2_two_facilities_with_one_name_are_numbered_in_row_order() -> None:
    view = cp3c(
        {
            "r1": ("Term Loan B", "100", "40"),
            "r2": ("Term Loan B", "200", "60"),
            "r3": ("Notes", "300", "10"),
        }
    )
    (item,) = cp3c_chart_series(view)
    assert [(p.series, p.category) for p in item.points] == [
        ("Principal payable at maturity", "Term Loan B (1)"),
        ("Resources at maturity", "Term Loan B (1)"),
        ("Principal payable at maturity", "Term Loan B (2)"),
        ("Resources at maturity", "Term Loan B (2)"),
        ("Principal payable at maturity", "Notes"),
        ("Resources at maturity", "Notes"),
    ]
    figure_ = report_view._liquidity_figure(
        "b",
        view,
        refs_of(view),
        item,
        owner="CP-3C",
        row_header="Facility",
        placement="beside",
        summary=None,
    )
    assert [r.label for r in figure_.chart.table_twin.rows] == [
        "Term Loan B (1)",
        "Term Loan B (2)",
        "Notes",
    ]


# CR.2 fixture: T2E.2.r01 cash, T2E.3.r03..r08.


def cp2d(*, repeated: bool = False) -> ModuleView:
    names = {
        "T2E.2.r01": "Cash at balance date",
        "T2E.3.r03": "Horizon start",
        "T2E.3.r04": "Horizon end",
        "T2E.3.r05": "Run-rate net cash flow",
        "T2E.3.r06": "Scheduled amortisation",
        "T2E.3.r07": "Maturities",
        "T2E.3.r08": "Cash at horizon end",
    }
    if repeated:
        names["T2E.3.r07"] = "Scheduled amortisation"
    facts = []
    for fact_id, label in names.items():
        facts.append(money(fact_id, label, "10"))
    return ModuleView(
        module_id="CP-2D",
        title="Liquidity",
        aliases=(),
        status="accepted",
        artifact_sha256=HASH,
        facts=tuple(facts),
    )


def test_f2_repeated_cr2_step_labels_are_numbered() -> None:
    (item,) = cp2d_chart_series(cp2d(repeated=True))
    assert [p.category for p in item.points] == [
        "Cash at balance date",
        "Run-rate net cash flow",
        "Scheduled amortisation (1)",
        "Scheduled amortisation (2)",
        "Cash at horizon end",
    ]
    report_view._liquidity_figure(
        "b",
        cp2d(repeated=True),
        refs_of(cp2d(repeated=True)),
        item,
        owner="CP-2D",
        row_header="Step",
        placement="above",
        summary=None,
    )


# K7-F4

LIMITATION = (
    "The design bridge (accessible liquidity plus inflow less mandatory uses less "
    "discretionary capex) is not drawn: CP-2D settles no lease or capex split."
)


def test_f4_the_cr2_limitation_is_on_the_twin_note_the_shell_draws_and_names_no_design_file() -> (
    None
):
    view = cp2d()
    (item,) = cp2d_chart_series(view)
    drawn = report_view._liquidity_figure(
        "b",
        view,
        refs_of(view),
        item,
        owner="CP-2D",
        row_header="Step",
        placement="above",
        summary=None,
    )
    note = drawn.chart.table_twin.note
    assert note is not None
    assert LIMITATION in note
    assert note.startswith(
        "Steps are CP-2D's settled cash bridge: cash at the balance date, run-rate net cash "
        "flow over the horizon, scheduled amortisation, maturities, and cash at horizon end "
        "before refinancing."
    )
    assert "rbot" not in note
    assert drawn.summary is None


# K7-F5


def cp4c_without_classes() -> ModuleView:
    row = "s1"
    facts = [
        Fact(
            fact_id="T4E.3.s1.scenario",
            label="Scenario",
            table_id="T4E.3",
            row_id=row,
            field="scenario",
            text="Base",
        ),
        Fact(
            fact_id="T4E.3.s1.multiple",
            label="Multiple",
            table_id="T4E.3",
            row_id=row,
            field="multiple",
            amount=Decimal(6),
            unit="MULTIPLE",
            period="2025-06-30",
            value_class="source",
        ),
        money("T4E.3.s1.ev", "Enterprise value", "500"),
        money("T4E.9.s1.equity_residual", "Equity residual", "500"),
        money("T4E.9.s1.total_claims", "Total claims", "0"),
        money("T4E.9.s1.creditor_distributions", "Creditor distributions", "0"),
        money("T4E.9.s1.balance", "Balance", "0"),
    ]
    return ModuleView(
        module_id="CP-4C",
        title="Restructuring",
        aliases=(),
        status="accepted",
        artifact_sha256=HASH,
        facts=tuple(facts),
    )


def test_f5_no_creditor_classes_gives_an_na_dr2_and_still_draws_the_waterfall() -> None:
    figures = cp4c_chart_series(cp4c_without_classes())
    assert [f.fig_id for f in figures] == ["DR.2", "DR.3"]
    assert figures[0].kind == "na"
    assert figures[0].points == ()
    assert figures[0].reason == "No creditor classes are supplied."
    assert figures[1].kind == "waterfall"
    assert [p.category for p in figures[1].points] == ["Equity residual", "Enterprise value"]


def test_f5_the_report_draws_dr3_when_dr2_has_no_classes() -> None:
    view = SimpleNamespace(modules=(cp4c_without_classes(),))
    drawn = _cp4c_figures(view, refs_of(view.modules[0]), "b", frozenset({"DR.2", "DR.3"}))  # type: ignore[arg-type]
    assert {f.fig_id: f.chart.kind for f in drawn} == {"DR.2": "na", "DR.3": "waterfall"}
