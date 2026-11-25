"""CP1 strip charts plot every supplied period in the one rule order (owner, 2026-11-25).

docs/superpowers/specs/2026-11-25-chart-periods.md. Synthetic registers: each case builds its own
T4.14 / T4.10 / T4.18 facts; expected categories, fact ids and basis digests are literals.
"""

from __future__ import annotations

import hashlib
import math
import xml.etree.ElementTree as ET
from datetime import date
from decimal import Decimal
from itertools import pairwise
from typing import get_args

import pytest

from deploy_vii import report_view
from deploy_vii.charts import render_svg
from deploy_vii.contracts import Fact, ModuleView
from deploy_vii.financial_contracts import FinancialPeriod
from deploy_vii.financial_series import FinancialFigureSeries, FinancialSeriesGap, cp1_chart_series
from deploy_vii.model.registers import PERIOD_TYPES
from deploy_vii.period_order import structured_period_key

SCOPE = "IFRS · consolidated group"
RATIOS = ("total_leverage_reported", "net_leverage_reported", "interest_coverage_reported")
MONEY = ("cash_closing", "undrawn_rcf", "liquidity", "revenue", "adjusted_ebitda")

# period id -> (period type, fiscal year, fiscal quarter, start, end)
PERIODS = {
    "fy-2023": ("FY", "2023", None, "2023-01-01", "2023-12-31"),
    "fy-2024": ("FY", "2024", None, "2024-01-01", "2024-12-31"),
    "q1-2025": ("QUARTER", "2025", "1", "2025-01-01", "2025-03-31"),
    "q2-2025": ("QUARTER", "2025", "2", "2025-04-01", "2025-06-30"),
    "ytd-2024": ("YTD", "2024", None, "2024-01-01", "2024-06-30"),
    "ytd-2025": ("YTD", "2025", None, "2025-01-01", "2025-06-30"),
    "ltm-2025": ("LTM", "2025", None, "2024-07-01", "2025-06-30"),
    "pf-2025": ("PF", "2025", None, "2024-07-01", "2025-06-30"),
}
# T4.10 column id (financial_model column_id) -> the period id whose dates it states
COLUMNS = {
    "FY:fy-2023": "fy-2023",
    "FY:fy-2024": "fy-2024",
    "Q:q1-2025": "q1-2025",
    "Q:q2-2025": "q2-2025",
    "PYTD:ytd-2024": "ytd-2024",
    "YTD:ytd-2025": "ytd-2025",
    "LTM:ltm-2025": "ltm-2025",
    "PF:pf-2025": "pf-2025",
}
ALL_CATEGORIES = [
    "FY2023",
    "FY2024",
    "Q1 2025",
    "Q2 2025",
    "PYTD 2024-06-30",
    "YTD 2025-06-30",
    "LTM 2025-06-30",
    "PF 2025-06-30",
]


def basis(column_id: str) -> str:
    """The T4.10 field of a column, derived here independently of production code."""
    raw = "".join(f"{len(part)}:{part}" for part in ("historical", column_id)).encode()
    return "model-basis:" + hashlib.sha256(raw).hexdigest()


def period_facts(pid: str, spec: tuple[str, str, str | None, str | None, str | None]) -> list[Fact]:
    kind, fiscal_year, quarter, start, end = spec
    values = {
        "period_id": pid,
        "period_type": kind,
        "fiscal_year": fiscal_year,
        "fiscal_quarter": quarter,
        "start_date": start,
        "end_date": end,
        "currency": "USD",
        "unit": "MILLIONS",
        "accounting_basis": "IFRS",
        "entity_perimeter": "consolidated group",
    }
    facts = []
    for field, value in values.items():
        unknown = {} if value is not None else {"status": "not_applicable", "limitation": "n/a"}
        facts.append(
            Fact(
                fact_id=f"T4.14:{pid}:{field}",
                label=field,
                table_id="T4.14",
                row_id=pid,
                field=field,
                text=value,
                period=pid,
                basis=SCOPE,
                **unknown,
            )
        )
    return facts


def metric_facts(
    key: str,
    columns: dict[str, str],
    periods: dict[str, tuple[str, str, str | None, str | None, str | None]],
    amounts: dict[str, Decimal | None] | None = None,
) -> list[Fact]:
    """One T4.10 row: `field_1` and a cell per column; an amount of None is a stated gap."""
    money = key in MONEY
    facts = [
        Fact(
            fact_id=f"T4.10:{key}:field_1",
            label="Metric",
            table_id="T4.10",
            row_id=key,
            field="field_1",
            text=key,
        )
    ]
    for index, (column_id, pid) in enumerate(columns.items()):
        _, _, _, start, end = periods[pid]
        amount = (amounts or {}).get(column_id, Decimal(index + 1))
        gap = {} if amount is not None else {"status": "missing", "limitation": "Not stated"}
        facts.append(
            Fact(
                fact_id=f"T4.10:{key}:{column_id}",
                label=key,
                table_id="T4.10",
                row_id=key,
                field=basis(column_id),
                amount=amount,
                unit="MILLIONS" if money else "MULTIPLE",
                currency="USD" if money else None,
                scale=Decimal(1000000) if money else Decimal(1),
                period=f"{column_id}: {start or 'null'} to {end or 'null'}",
                basis=SCOPE,
                **gap,
            )
        )
    return facts


def module(
    periods: dict[str, tuple[str, str, str | None, str | None, str | None]],
    columns: dict[str, str],
    *,
    drop: frozenset[tuple[str, str]] = frozenset(),
    amounts: dict[tuple[str, str], Decimal | None] | None = None,
    extra: tuple[Fact, ...] = (),
) -> ModuleView:
    facts: list[Fact] = []
    for pid in reversed(periods):  # authored order is not the plotted order
        facts.extend(period_facts(pid, periods[pid]))
    for key in (*RATIOS, *MONEY):
        kept = {c: p for c, p in reversed(columns.items()) if (key, c) not in drop}
        own = {c: v for (k, c), v in (amounts or {}).items() if k == key}
        facts.extend(metric_facts(key, kept, periods, own))
    return ModuleView(
        module_id="CP-1",
        title="Financials",
        aliases=(),
        status="accepted",
        artifact_sha256="a" * 64,
        facts=(*facts, *extra),
    )


def figure(view: ModuleView, fig_id: str) -> FinancialFigureSeries:
    return next(item for item in cp1_chart_series(view) if item.fig_id == fig_id)


def categories(item: FinancialFigureSeries, series: str | None = None) -> list[str]:
    """The figure's X categories in first-seen order (what `charts._categories` draws)."""
    seen: list[str] = []
    for point in item.points:
        if (series is None or point.series == series) and point.category not in seen:
            seen.append(point.category)
    return seen


def test_basis_identity_is_the_financial_model_column_identity() -> None:
    from deploy_vii.financial_model import _basis_id
    from deploy_vii.model.frame import Column

    def column(column_id: str) -> Column:
        return Column(column_id, "FY", "x", None, "2024", None, None, None)

    assert _basis_id(column("FY:fy-2024")) == (
        "model-basis:dffaa0c1315a4552417ad0e28767966a212255e1dd070aaadad08443f79e7eed"
    )
    assert basis("FY:fy-2024") == _basis_id(column("FY:fy-2024"))
    assert basis("LTM:ltm-2025-06") == (
        "model-basis:f6226ad5a6398d4d8713826ceb593f8d073f0369c9138dccabe0d4ce0c620001"
    )


@pytest.mark.parametrize("fig_id", ["S.1", "S.2", "S.3", "S.5"])
def test_every_period_kind_is_plotted_in_rule_order(fig_id: str) -> None:
    item = figure(module(PERIODS, COLUMNS), fig_id)
    assert item.reason is None
    assert item.gaps == ()
    assert categories(item) == ALL_CATEGORIES
    for series in item.series:
        assert categories(item, series) == ALL_CATEGORIES


def test_points_name_the_fact_of_their_own_column() -> None:
    item = figure(module(PERIODS, COLUMNS), "S.5")
    found = {(p.series, p.category): p.fact_id for p in item.points}
    assert found["revenue", "FY2023"] == "T4.10:revenue:FY:fy-2023"
    assert found["revenue", "Q2 2025"] == "T4.10:revenue:Q:q2-2025"
    assert found["adjusted_ebitda", "PYTD 2024-06-30"] == "T4.10:adjusted_ebitda:PYTD:ytd-2024"
    assert found["adjusted_ebitda", "LTM 2025-06-30"] == "T4.10:adjusted_ebitda:LTM:ltm-2025"
    assert found["revenue", "PF 2025-06-30"] == "T4.10:revenue:PF:pf-2025"
    point = next(p for p in item.points if (p.series, p.category) == ("revenue", "LTM 2025-06-30"))
    assert point.companion_fact_ids[0] == "T4.10:revenue:field_1"
    assert "T4.14:ltm-2025:end_date" in point.companion_fact_ids
    assert not any("q2-2025" in fact_id for fact_id in point.companion_fact_ids)


def test_fiscal_years_alone_are_plotted() -> None:
    periods = {pid: PERIODS[pid] for pid in ("fy-2024", "fy-2023")}
    columns = {"FY:fy-2024": "fy-2024", "FY:fy-2023": "fy-2023"}
    for fig_id in ("S.1", "S.2", "S.3", "S.5"):
        item = figure(module(periods, columns), fig_id)
        assert item.reason is None
        assert categories(item) == ["FY2023", "FY2024"]


def test_two_quarters_across_a_year_end_are_plotted() -> None:
    periods = {
        "q4-2024": ("QUARTER", "2024", "4", "2024-10-01", "2024-12-31"),
        "q1-2025": PERIODS["q1-2025"],
    }
    item = figure(module(periods, {"Q:q4-2024": "q4-2024", "Q:q1-2025": "q1-2025"}), "S.3")
    assert item.reason is None
    assert categories(item) == ["Q4 2024", "Q1 2025"]


def test_quarter_sharing_its_fiscal_year_end_comes_before_the_year() -> None:
    periods = {
        "fy-2024": PERIODS["fy-2024"],
        "q4-2024": ("QUARTER", "2024", "4", "2024-10-01", "2024-12-31"),
        "q3-2024": ("QUARTER", "2024", "3", "2024-07-01", "2024-09-30"),
    }
    columns = {"FY:fy-2024": "fy-2024", "Q:q4-2024": "q4-2024", "Q:q3-2024": "q3-2024"}
    item = figure(module(periods, columns), "S.1")
    assert categories(item) == ["Q3 2024", "Q4 2024", "FY2024"]


def test_ytd_and_ltm_alone_are_plotted() -> None:
    periods = {pid: PERIODS[pid] for pid in ("ltm-2025", "ytd-2025")}
    columns = {"LTM:ltm-2025": "ltm-2025", "YTD:ytd-2025": "ytd-2025"}
    view = module(periods, columns)
    assert categories(figure(view, "S.5")) == ["YTD 2025-06-30", "LTM 2025-06-30"]
    assert figure(view, "S.4").reason == "No complete current facility snapshot is supplied."


def test_a_period_without_a_fact_for_one_metric_is_a_gap_for_that_point() -> None:
    view = module(PERIODS, COLUMNS, drop=frozenset({("net_leverage_reported", "FY:fy-2023")}))
    item = figure(view, "S.1")
    assert item.reason is None
    assert categories(item) == ALL_CATEGORIES
    assert categories(item, "net_leverage_reported") == ALL_CATEGORIES[1:]
    assert item.gaps == (FinancialSeriesGap("net_leverage_reported", "FY2023"),)
    assert figure(view, "S.2").gaps == ()


def test_a_stated_gap_fact_stays_a_point_of_its_period() -> None:
    view = module(PERIODS, COLUMNS, amounts={("revenue", "LTM:ltm-2025"): None})
    item = figure(view, "S.5")
    assert categories(item, "revenue") == ALL_CATEGORIES
    assert item.gaps == ()
    assert item.reason is None


def test_a_period_no_column_reports_is_a_stated_gap_and_the_rest_is_plotted() -> None:
    columns = {c: p for c, p in COLUMNS.items() if c != "PF:pf-2025"}
    item = figure(module(PERIODS, columns), "S.2")
    assert item.reason is None
    assert categories(item) == ALL_CATEGORIES[:-1]
    assert item.gaps == (FinancialSeriesGap("interest_coverage_reported", "PF 2025-06-30"),)


def test_no_period_with_a_fact_is_an_unavailable_figure_not_an_error() -> None:
    item = figure(module(PERIODS, {}), "S.3")
    assert item.points == ()
    assert item.reason == "No reported period has a value for this chart."


def test_trailing_ratio_of_a_quarter_column_and_host_built_columns_are_plotted() -> None:
    """A quarter column's ratio states its trailing window (S13 C01); the host-built LTM and YTD
    of quarters carry the anchor quarter's id (`LTM:<id>`, `YTD:<id>`), with no T4.14 row."""
    periods = {pid: PERIODS[pid] for pid in ("q1-2025", "q2-2025")}
    columns = {"Q:q1-2025": "q1-2025", "Q:q2-2025": "q2-2025"}
    extra = []
    for key in (*RATIOS, *MONEY):
        money = key in MONEY
        for column_id, start in (("YTD:q2-2025", "2025-01-01"), ("LTM:q2-2025", "null")):
            extra.append(
                Fact(
                    fact_id=f"T4.10:{key}:{column_id}",
                    label=key,
                    table_id="T4.10",
                    row_id=key,
                    field=basis(column_id),
                    amount=Decimal(7),
                    unit="MILLIONS" if money else "MULTIPLE",
                    currency="USD" if money else None,
                    scale=Decimal(1000000) if money else Decimal(1),
                    period=f"LTM Q2 25: {start} to 2025-06-30",
                    basis=SCOPE,
                )
            )
    view = module(periods, columns, extra=tuple(extra))
    trailing = [
        fact.model_copy(update={"period": "LTM Q2 25: 2024-07-01 to 2025-06-30"})
        if fact.fact_id == "T4.10:total_leverage_reported:Q:q2-2025"
        else fact
        for fact in view.facts
    ]
    view = view.model_copy(update={"facts": tuple(trailing)})
    item = figure(view, "S.1")
    assert categories(item) == ["Q1 2025", "Q2 2025", "YTD 2025-06-30", "LTM 2025-06-30"]
    found = {(p.series, p.category): p.fact_id for p in item.points}
    assert found["total_leverage_reported", "LTM 2025-06-30"] == (
        "T4.10:total_leverage_reported:LTM:q2-2025"
    )


def test_two_periods_of_one_kind_and_end_keep_distinct_categories() -> None:
    periods = {
        "ltm-a": ("LTM", "2025", None, "2024-07-01", "2025-06-30"),
        "ltm-b": ("LTM", "2025", None, "2024-07-01", "2025-06-30"),
    }
    item = figure(module(periods, {"LTM:ltm-a": "ltm-a", "LTM:ltm-b": "ltm-b"}), "S.2")
    # Numbered in the order drawn: a reader is never shown a period id.
    assert categories(item) == ["LTM 2025-06-30 (1)", "LTM 2025-06-30 (2)"]


def test_two_periods_of_one_kind_and_end_are_told_apart_by_their_start_dates() -> None:
    periods = {
        "ltm-b": ("LTM", "2025", None, "2024-07-01", "2025-06-30"),
        "ltm-a": ("LTM", "2025", None, "2024-06-29", "2025-06-30"),
        "fy-2024": PERIODS["fy-2024"],
    }
    columns = {"LTM:ltm-b": "ltm-b", "LTM:ltm-a": "ltm-a", "FY:fy-2024": "fy-2024"}
    item = figure(module(periods, columns), "S.2")
    assert categories(item) == [
        "FY2024",
        "LTM 2025-06-30 (from 2024-06-29)",
        "LTM 2025-06-30 (from 2024-07-01)",
    ]


def test_two_periods_sharing_a_label_with_one_start_not_stated_are_numbered() -> None:
    periods = {
        "ltm-a": ("LTM", "2025", None, None, "2025-06-30"),
        "ltm-b": ("LTM", "2025", None, "2024-07-01", "2025-06-30"),
    }
    item = figure(module(periods, {"LTM:ltm-a": "ltm-a", "LTM:ltm-b": "ltm-b"}), "S.3")
    assert categories(item) == ["LTM 2025-06-30 (1)", "LTM 2025-06-30 (2)"]


def test_a_trailing_period_without_dates_is_plotted_last_of_its_kind() -> None:
    periods = {
        "ltm-undated": ("LTM", "2025", None, None, None),
        "ltm-2025": PERIODS["ltm-2025"],
        "fy-2024": PERIODS["fy-2024"],
    }
    columns = {
        "LTM:ltm-undated": "ltm-undated",
        "LTM:ltm-2025": "ltm-2025",
        "FY:fy-2024": "fy-2024",
    }
    item = figure(module(periods, columns), "S.5")
    assert categories(item) == ["FY2024", "LTM 2025-06-30", "LTM 2025 (no end date)"]


def test_a_period_without_a_start_date_does_not_bind_the_fact_start() -> None:
    """The basis dates its start from the day count; the register row may state no start."""
    periods = {"ltm-2025": ("LTM", "2025", None, None, "2025-06-30")}
    view = module(periods, {"LTM:ltm-2025": "ltm-2025"})
    facts = tuple(
        fact.model_copy(update={"period": "LTM Q2 25: 2024-07-01 to 2025-06-30"})
        if fact.table_id == "T4.10" and fact.field != "field_1"
        else fact
        for fact in view.facts
    )
    item = figure(view.model_copy(update={"facts": facts}), "S.3")
    assert categories(item) == ["LTM 2025-06-30"]


def restated(view: ModuleView, column_id: str, period: str) -> ModuleView:
    """The view with every metric's fact of one column stating `period`."""
    facts = tuple(
        fact.model_copy(update={"period": period})
        if fact.fact_id.startswith("T4.10:") and fact.fact_id.endswith(f":{column_id}")
        else fact
        for fact in view.facts
    )
    assert facts != view.facts
    return view.model_copy(update={"facts": facts})


def hosted(periods: dict, columns: dict[str, str], column_id: str, stated: str) -> ModuleView:
    """`periods` and `columns` plus a host-built column (no T4.14 row of its own) stating
    `stated` on every metric."""
    extra = tuple(
        Fact(
            fact_id=f"T4.10:{key}:{column_id}",
            label=key,
            table_id="T4.10",
            row_id=key,
            field=basis(column_id),
            amount=Decimal(7),
            unit="MILLIONS" if key in MONEY else "MULTIPLE",
            currency="USD" if key in MONEY else None,
            scale=Decimal(1000000) if key in MONEY else Decimal(1),
            period=stated,
            basis=SCOPE,
        )
        for key in (*RATIOS, *MONEY)
    )
    return module(periods, columns, extra=extra)


MISMATCH = "Chart fact does not match its period dates"
QUARTER_2 = {"q2-2025": PERIODS["q2-2025"]}
YEAR_2024 = {"fy-2024": PERIODS["fy-2024"]}


@pytest.mark.parametrize(
    ("column_id", "stated"),
    [
        # A period's own column is dated from the period's own day count, which the adapter
        # derives from the two dates: it never states `null` or another start.
        ("FY:fy-2024", "FY24: null to 2024-12-31"),
        ("FY:fy-2024", "FY24: 2024-02-01 to 2024-12-31"),
        ("Q:q2-2025", "Q2 25: null to 2025-06-30"),
        ("YTD:ytd-2025", "YTD H1 25: null to 2025-06-30"),
        ("PYTD:ytd-2024", "PYTD H1 24: 2023-12-31 to 2024-06-30"),
        ("PF:pf-2025", "PF: null to 2025-06-30"),
        # An LTM row's column is dated from the host's own sum: `null` where it cannot be summed,
        # never another start than the row states.
        ("LTM:ltm-2025", "LTM Q2 25: 2024-06-30 to 2025-06-30"),
        ("LTM:ltm-2025", "LTM Q2 25: 2024-07-02 to 2025-06-30"),
        ("LTM:ltm-2025", "LTM Q2 25: last year to 2025-06-30"),
    ],
)
def test_an_own_column_stating_another_start_than_its_period_raises(column_id, stated) -> None:
    with pytest.raises(ValueError, match=MISMATCH):
        cp1_chart_series(restated(module(PERIODS, COLUMNS), column_id, stated))


def test_an_ltm_row_whose_column_the_host_could_not_sum_states_a_null_start() -> None:
    view = restated(module(PERIODS, COLUMNS), "LTM:ltm-2025", "LTM Q2 25: null to 2025-06-30")
    assert categories(figure(view, "S.3")) == ALL_CATEGORIES


@pytest.mark.parametrize(
    "stated",
    ["FY24: 2025-01-01 to 2024-12-31", "FY24: yesterday to 2024-12-31", "FY24:  to 2024-12-31"],
)
def test_a_start_that_is_no_date_or_is_after_the_end_raises_without_a_period_start(stated) -> None:
    periods = {"fy-2024": ("FY", "2024", None, None, "2024-12-31")}
    view = restated(module(periods, {"FY:fy-2024": "fy-2024"}), "FY:fy-2024", stated)
    with pytest.raises(ValueError, match=MISMATCH):
        cp1_chart_series(view)


def test_an_undated_period_binds_a_null_start() -> None:
    """The basis dates a start only from an end date: with no end there is none to state."""
    periods = {"ltm-undated": ("LTM", "2025", None, None, None)}
    view = module(periods, {"LTM:ltm-undated": "ltm-undated"})
    assert categories(figure(view, "S.3")) == ["LTM 2025 (no end date)"]
    with pytest.raises(ValueError, match=MISMATCH):
        cp1_chart_series(restated(view, "LTM:ltm-undated", "LTM: 2024-07-01 to null"))


@pytest.mark.parametrize(
    ("column_id", "stated"),
    [
        # Quarters summed to date, and the LTM ending at the quarter, start at or before it.
        ("YTD:q2-2025", "YTD H1 25: 2025-04-02 to 2025-06-30"),
        ("PYTD:q2-2025", "PYTD H1 25: 2025-05-01 to 2025-06-30"),
        ("LTM:q2-2025", "LTM Q2 25: 2025-04-02 to 2025-06-30"),
        ("LTM:q2-2025", "LTM Q2 25: a year before to 2025-06-30"),
        ("YTD:q2-2025", "YTD H1 25: 2025-01-01 to 2025-05-31"),
    ],
)
def test_a_host_built_column_starting_after_its_quarter_starts_raises(column_id, stated) -> None:
    with pytest.raises(ValueError, match=MISMATCH):
        cp1_chart_series(hosted(QUARTER_2, {"Q:q2-2025": "q2-2025"}, column_id, stated))


@pytest.mark.parametrize(
    ("column_id", "stated", "category"),
    [
        ("YTD:q2-2025", "YTD H1 25: 2025-01-01 to 2025-06-30", "YTD 2025-06-30"),
        ("YTD:q2-2025", "YTD H1 25: 2025-04-01 to 2025-06-30", "YTD 2025-06-30"),
        ("PYTD:q2-2025", "PYTD H1 25: null to 2025-06-30", "PYTD 2025-06-30"),
        ("LTM:q2-2025", "LTM Q2 25: 2024-07-01 to 2025-06-30", "LTM 2025-06-30"),
        ("LTM:q2-2025", "LTM Q2 25: null to 2025-06-30", "LTM 2025-06-30"),
    ],
)
def test_a_host_built_column_containing_its_quarter_is_plotted(column_id, stated, category) -> None:
    view = hosted(QUARTER_2, {"Q:q2-2025": "q2-2025"}, column_id, stated)
    assert categories(figure(view, "S.5")) == ["Q2 2025", category]


@pytest.mark.parametrize(
    "stated", ["LTM Q4 24: 2024-02-01 to 2024-12-31", "LTM Q4 24: null to 2024-12-31"]
)
def test_the_ltm_at_a_fiscal_year_end_is_that_year_and_states_its_start(stated) -> None:
    with pytest.raises(ValueError, match=MISMATCH):
        cp1_chart_series(hosted(YEAR_2024, {"FY:fy-2024": "fy-2024"}, "LTM:fy-2024", stated))
    view = hosted(
        YEAR_2024, {"FY:fy-2024": "fy-2024"}, "LTM:fy-2024", "LTM Q4 24: 2024-01-01 to 2024-12-31"
    )
    assert categories(figure(view, "S.5")) == ["FY2024", "LTM 2024-12-31"]


def test_a_balance_date_period_is_not_a_chart_period_and_not_a_gap() -> None:
    periods = {
        "opening-2023": ("PERIOD_END", "2023", None, None, "2023-12-31"),
        "fy-2024": PERIODS["fy-2024"],
    }
    item = figure(module(periods, {"FY:fy-2024": "fy-2024"}), "S.5")
    assert categories(item) == ["FY2024"]
    assert item.gaps == ()


def test_a_fiscal_year_already_spelled_with_fy_is_not_prefixed_twice() -> None:
    periods = {"fy-2024": ("FY", "FY2024", None, "2024-01-01", "2024-12-31")}
    item = figure(module(periods, {"FY:fy-2024": "fy-2024"}), "S.2")
    assert categories(item) == ["FY2024"]


# Integrity checks that stay.


def test_duplicate_period_identity_raises() -> None:
    view = module(PERIODS, COLUMNS)
    twin = tuple(
        fact.model_copy(update={"fact_id": fact.fact_id + ":twin", "row_id": "other-row"})
        for fact in view.facts
        if fact.table_id == "T4.14" and fact.row_id == "fy-2024"
    )
    with pytest.raises(ValueError, match="Ambiguous T4.14 chart period"):
        cp1_chart_series(view.model_copy(update={"facts": (*view.facts, *twin)}))


def test_inconsistent_perimeter_raises() -> None:
    view = module(PERIODS, COLUMNS)
    facts = tuple(
        fact.model_copy(update={"basis": "IFRS · restricted group"})
        if fact.fact_id == "T4.14:ltm-2025:end_date"
        else fact
        for fact in view.facts
    )
    with pytest.raises(ValueError, match="Inconsistent chart period perimeter"):
        cp1_chart_series(view.model_copy(update={"facts": facts}))


def test_nonfinite_value_raises() -> None:
    view = module(PERIODS, COLUMNS)
    facts = tuple(
        fact.model_copy(update={"amount": Decimal("NaN")})
        if fact.fact_id == "T4.10:revenue:FY:fy-2024"
        else fact
        for fact in view.facts
    )
    with pytest.raises(ValueError, match="Nonfinite chart fact"):
        cp1_chart_series(view.model_copy(update={"facts": facts}))


def test_fact_stating_another_period_raises() -> None:
    view = module(PERIODS, COLUMNS)
    facts = tuple(
        fact.model_copy(update={"period": "FY24: 2024-01-01 to 2024-11-30"})
        if fact.fact_id == "T4.10:revenue:FY:fy-2024"
        else fact
        for fact in view.facts
    )
    with pytest.raises(ValueError, match="Chart fact does not match its period dates"):
        cp1_chart_series(view.model_copy(update={"facts": facts}))


def test_quarter_number_outside_one_to_four_raises() -> None:
    periods = {"q5": ("QUARTER", "2025", "5", "2025-01-01", "2025-03-31")}
    with pytest.raises(ValueError, match="Ambiguous QUARTER identities"):
        cp1_chart_series(module(periods, {"Q:q5": "q5"}))


def test_repeated_quarter_label_raises() -> None:
    periods = {
        "q1-a": ("QUARTER", "2025", "1", "2025-01-01", "2025-03-31"),
        "q1-b": ("QUARTER", "2025", "1", "2025-04-01", "2025-06-30"),
    }
    with pytest.raises(ValueError, match="Ambiguous QUARTER identities"):
        cp1_chart_series(module(periods, {"Q:q1-a": "q1-a", "Q:q1-b": "q1-b"}))


def test_overlapping_quarters_raise() -> None:
    periods = {
        "q1": ("QUARTER", "2025", "1", "2025-01-01", "2025-03-31"),
        "q2": ("QUARTER", "2025", "2", "2025-03-15", "2025-06-30"),
    }
    with pytest.raises(ValueError, match="Overlapping or inverted QUARTER periods"):
        cp1_chart_series(module(periods, {"Q:q1": "q1", "Q:q2": "q2"}))


def test_a_quarter_without_a_stated_start_is_still_plotted() -> None:
    periods = {
        "q1": ("QUARTER", "2025", "1", None, "2025-03-31"),
        "q2": ("QUARTER", "2025", "2", "2025-04-01", "2025-06-30"),
    }
    item = figure(module(periods, {"Q:q1": "q1", "Q:q2": "q2"}), "S.5")
    assert categories(item) == ["Q1 2025", "Q2 2025"]


def test_unknown_period_type_raises() -> None:
    periods = {"h1": ("HALF", "2025", None, "2025-01-01", "2025-06-30")}
    with pytest.raises(ValueError, match="Unsupported historical chart period type"):
        cp1_chart_series(module(periods, {}))


# PF is a period type everywhere period types are enumerated.


def test_pro_forma_is_a_financial_period_type() -> None:
    period = FinancialPeriod(
        period_id="pf-2025",
        fiscal_year="2025",
        fiscal_quarter=None,
        period_type="PF",
        start_date=date(2024, 7, 1),
        end_date=date(2025, 6, 30),
        day_count=365,
        audit_status="unaudited",
        currency="USD",
        unit="MILLIONS",
        accounting_basis="IFRS",
        entity_perimeter="consolidated group",
        citations=(),
        component_period_ids=("ltm-2025",),
    )
    assert period.period_type == "PF"


def test_period_type_enumerations_agree() -> None:
    declared = set(get_args(FinancialPeriod.model_fields["period_type"].annotation))
    assert declared == {"QUARTER", "YTD", "FY", "LTM", "PF", "PERIOD_END"}
    assert declared == PERIOD_TYPES
    for period_type in sorted(declared):
        assert structured_period_key(period_type, date(2025, 6, 30))[0] in {0, 1, 2, 3}


# S.4 maturity wall: X in maturity-date order.

FACILITIES = {
    # facility id -> (name, maturity, principal)
    "fac-a": ("Senior notes 2030", "2030-06-15", Decimal(500)),
    "fac-b": ("Term loan B", "2027-03-01", Decimal(300)),
    "fac-c": ("Senior notes 2027", "2027-03-01", Decimal(200)),
    "fac-d": ("RCF", "2026-09-30", Decimal(50)),
}


def facility_facts(pid: str) -> tuple[Fact, ...]:
    facts = []
    for fid, (name, maturity, principal) in FACILITIES.items():
        texts = {
            "facility_id": fid,
            "facility_name": name,
            "period_id": pid,
            "facility_type": "TERM LOAN",
            "currency": "USD",
            "maturity_date": maturity,
            "annual_amortisation": "0",
            "lease_classification": "NOT_LEASE",
        }
        row = f"{fid}.{pid}"
        for field, text in texts.items():
            facts.append(
                Fact(
                    fact_id=f"T4.18:{row}:{field}",
                    label=field,
                    table_id="T4.18",
                    row_id=row,
                    field=field,
                    text=text,
                    period=pid,
                )
            )
        facts.append(
            Fact(
                fact_id=f"T4.18:{row}:principal",
                label="principal",
                table_id="T4.18",
                row_id=row,
                field="principal",
                amount=principal,
                unit="MILLIONS",
                currency="USD",
                scale=Decimal(1000000),
                period=pid,
                basis=SCOPE,
            )
        )
    return tuple(facts)


QUARTERS = {pid: PERIODS[pid] for pid in ("q1-2025", "q2-2025")}
QUARTER_COLUMNS = {"Q:q1-2025": "q1-2025", "Q:q2-2025": "q2-2025"}


def test_maturity_wall_categories_are_in_maturity_date_order() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    item = figure(view, "S.4")
    assert item.reason is None
    assert item.title == "Maturity wall — principal at 2025-06-30 (not a forecast)"
    assert [(p.category, p.series) for p in item.points] == [
        ("2026-09-30", "RCF (fac-d)"),
        ("2027-03-01", "Term loan B (fac-b)"),
        ("2027-03-01", "Senior notes 2027 (fac-c)"),
        ("2030-06-15", "Senior notes 2030 (fac-a)"),
    ]
    assert item.series == tuple(p.series for p in item.points)


def test_maturity_wall_without_a_known_maturity_is_unavailable() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    facts = tuple(
        fact.model_copy(update={"text": None, "status": "missing", "limitation": "Not stated"})
        if fact.fact_id == "T4.18:fac-b.q2-2025:maturity_date"
        else fact
        for fact in view.facts
    )
    item = figure(view.model_copy(update={"facts": facts}), "S.4")
    assert item.points == ()
    assert item.series == ()
    assert item.reason == "Contractual maturity unavailable: T4.18:fac-b.q2-2025:maturity_date"


def test_maturity_wall_reads_the_quarter_snapshot_beside_trailing_periods() -> None:
    """A YTD, LTM or PF period ending on the snapshot date is not a snapshot period."""
    extra = (*facility_facts("q2-2025"), *facility_facts("ltm-2025"))
    item = figure(module(PERIODS, COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".q2-2025:" in point.fact_id for point in item.points)


def drawn_x_labels(view: ModuleView, fig_id: str) -> list[str]:
    """The X-axis category texts of the rendered SVG, left to right."""
    refs = {(view.module_id, fact.fact_id): ("K1",) for fact in view.facts}
    refs |= {
        (view.module_id, fact.fact_id): ("G1",) for fact in view.facts if fact.status != "known"
    }
    supplied = report_view._cp1_supplied(view)
    (drawn,) = report_view._cp1_figures("strip", view, refs, supplied, frozenset({fig_id}))
    svg = ET.fromstring(render_svg(drawn.chart, chart_id="c1", title=drawn.title))
    axis = [
        (float(node.attrib["x"]), node.text or "")
        for node in svg.iter("{http://www.w3.org/2000/svg}text")
        if node.attrib.get("class") == "ax" and node.attrib.get("text-anchor") != "end"
    ]
    assert [x for x, _ in axis] == sorted({x for x, _ in axis})
    return [text for _, text in axis]


def drawn(view: ModuleView, fig_id: str) -> report_view.Figure:
    refs = {(view.module_id, fact.fact_id): ("K1",) for fact in view.facts}
    refs |= {
        (view.module_id, fact.fact_id): ("G1",) for fact in view.facts if fact.status != "known"
    }
    supplied = report_view._cp1_supplied(view)
    (item,) = report_view._cp1_figures("strip", view, refs, supplied, frozenset({fig_id}))
    return item


def test_drawn_strip_figure_states_a_series_gap_in_reader_words() -> None:
    drop = frozenset(
        {("net_leverage_reported", "FY:fy-2023"), ("net_leverage_reported", "LTM:ltm-2025")}
    )
    item = drawn(module(PERIODS, COLUMNS, drop=drop), "S.1")
    stated = "No reported value: Net leverage (reported) at FY2023 and LTM 2025-06-30."
    assert item.chart.table_twin.note == stated
    assert item.chart.reason is None
    assert len(item.chart.marks) == 14


def test_drawn_strip_figure_states_a_period_no_column_carries() -> None:
    columns = {c: p for c, p in COLUMNS.items() if c != "PF:pf-2025"}
    item = drawn(module(PERIODS, columns), "S.2")
    stated = "No reported value: Interest cover (reported) at PF 2025-06-30."
    assert item.chart.table_twin.note == stated
    assert item.chart.reason is None


def test_drawn_strip_figure_without_a_gap_states_none() -> None:
    item = drawn(module(PERIODS, COLUMNS), "S.1")
    assert item.chart.table_twin.note is None


def test_rendered_maturity_wall_x_axis_is_in_date_order() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    assert drawn_x_labels(view, "S.4") == ["2026-09-30", "2027-03-01", "2030-06-15"]


def test_rendered_strip_chart_x_axis_keeps_rule_order_across_a_gap() -> None:
    view = module(PERIODS, COLUMNS, drop=frozenset({("total_leverage_reported", "FY:fy-2024")}))
    assert drawn_x_labels(view, "S.1") == ALL_CATEGORIES


# 3 fiscal years, 4 quarters, PYTD, YTD, LTM and PF: the widest strip the ruling asks for.
ELEVEN_PERIODS = {
    "fy-2022": ("FY", "2022", None, "2022-01-01", "2022-12-31"),
    "fy-2023": ("FY", "2023", None, "2023-01-01", "2023-12-31"),
    "fy-2024": ("FY", "2024", None, "2024-01-01", "2024-12-31"),
    "q3-2024": ("QUARTER", "2024", "3", "2024-07-01", "2024-09-30"),
    "q4-2024": ("QUARTER", "2024", "4", "2024-10-01", "2024-12-31"),
    "q1-2025": ("QUARTER", "2025", "1", "2025-01-01", "2025-03-31"),
    "q2-2025": ("QUARTER", "2025", "2", "2025-04-01", "2025-06-30"),
    "ytd-2024": ("YTD", "2024", None, "2024-01-01", "2024-06-30"),
    "ytd-2025": ("YTD", "2025", None, "2025-01-01", "2025-06-30"),
    "ltm-2025": ("LTM", "2025", None, "2024-07-01", "2025-06-30"),
    "pf-2025": ("PF", "2025", None, "2024-07-01", "2025-06-30"),
}
ELEVEN_COLUMNS = {
    "FY:fy-2022": "fy-2022",
    "FY:fy-2023": "fy-2023",
    "FY:fy-2024": "fy-2024",
    "Q:q3-2024": "q3-2024",
    "Q:q4-2024": "q4-2024",
    "Q:q1-2025": "q1-2025",
    "Q:q2-2025": "q2-2025",
    "PYTD:ytd-2024": "ytd-2024",
    "YTD:ytd-2025": "ytd-2025",
    "LTM:ltm-2025": "ltm-2025",
    "PF:pf-2025": "pf-2025",
}
ELEVEN_CATEGORIES = [
    "FY2022",
    "FY2023",
    "Q3 2024",
    "Q4 2024",
    "FY2024",  # same end date as Q4 2024: the shorter period comes first
    "Q1 2025",
    "Q2 2025",
    "PYTD 2024-06-30",
    "YTD 2025-06-30",
    "LTM 2025-06-30",
    "PF 2025-06-30",
]
AXIS_FONT_PX = 11.0  # `.chart text` in app.css
CHAR_PX = 6.6  # estimated advance of one character: 0.6 em of the axis font


def x_axis(svg_text: str) -> tuple[float, float, list[tuple[float, float, float, str]]]:
    """(width, height, [(x, y, degrees turned clockwise, text)]) of the X labels, left to right."""
    svg = ET.fromstring(svg_text)
    _, _, width, height = (float(part) for part in svg.attrib["viewBox"].split())
    labels = []
    for node in svg.iter("{http://www.w3.org/2000/svg}text"):
        if node.attrib.get("class") != "ax" or node.attrib.get("text-anchor") == "end":
            continue
        x, y = float(node.attrib["x"]), float(node.attrib["y"])
        turn = node.attrib.get("transform")
        if turn is None:
            assert node.attrib["text-anchor"] == "middle"
            labels.append((x, y, 0.0, node.text or ""))
            continue
        degrees, about_x, about_y = (float(part) for part in turn[len("rotate(") : -1].split())
        assert turn.startswith("rotate(") and node.attrib["text-anchor"] == "start"
        assert (about_x, about_y) == (x, y)
        labels.append((x, y, degrees, node.text or ""))
    return width, height, sorted(labels)


def assert_x_labels_clear(svg_text: str) -> None:
    """No two neighbouring X labels' estimated extents overlap, and each stays in the frame."""
    width, height, labels = x_axis(svg_text)
    for (x, y, degrees, text), (next_x, _, next_degrees, next_text) in pairwise(labels):
        assert degrees == next_degrees
        if degrees == 0:
            assert x + len(text) * CHAR_PX / 2 <= next_x - len(next_text) * CHAR_PX / 2
        else:
            # Parallel turned lines of text: their baselines are a full text height apart.
            assert (next_x - x) * math.sin(math.radians(degrees)) >= AXIS_FONT_PX
    for x, y, degrees, text in labels:
        length = len(text) * CHAR_PX
        if degrees == 0:
            assert x - length / 2 >= 0 and x + length / 2 <= width and y <= height
        else:
            assert 0 < degrees <= 90
            assert x + length * math.cos(math.radians(degrees)) <= width
            assert y + length * math.sin(math.radians(degrees)) <= height


@pytest.mark.parametrize("fig_id", ["S.1", "S.2", "S.3", "S.5"])
def test_eleven_period_strip_labels_every_period_without_overlap(fig_id: str) -> None:
    item = drawn(module(ELEVEN_PERIODS, ELEVEN_COLUMNS), fig_id)
    svg = render_svg(item.chart, chart_id="c1", title=item.title)
    assert [text for _, _, _, text in x_axis(svg)[2]] == ELEVEN_CATEGORIES
    assert_x_labels_clear(svg)


def test_four_period_line_chart_keeps_its_flat_labels_and_size() -> None:
    periods = {pid: ELEVEN_PERIODS[pid] for pid in ("fy-2022", "fy-2023", "fy-2024", "q1-2025")}
    columns = {c: p for c, p in ELEVEN_COLUMNS.items() if p in periods}
    item = drawn(module(periods, columns), "S.1")
    svg = render_svg(item.chart, chart_id="c1", title=item.title)
    assert x_axis(svg) == (
        320.0,
        160.0,
        [
            (54.0, 152.0, 0.0, "FY2022"),
            (122.0, 152.0, 0.0, "FY2023"),
            (190.0, 152.0, 0.0, "FY2024"),
            (258.0, 152.0, 0.0, "Q1 2025"),
        ],
    )
    assert_x_labels_clear(svg)


def test_long_maturity_dates_on_the_wall_do_not_overlap() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    item = drawn(view, "S.4")
    svg = render_svg(item.chart, chart_id="c1", title=item.title)
    assert [text for _, _, _, text in x_axis(svg)[2]] == ["2026-09-30", "2027-03-01", "2030-06-15"]
    assert_x_labels_clear(svg)
