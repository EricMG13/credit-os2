"""CP1 strip charts plot every supplied period in the one rule order (owner, 2026-11-25).

docs/superpowers/specs/2026-11-25-chart-periods.md. Synthetic registers: each case builds its own
T4.14 / T4.10 / T4.18 facts; expected categories, fact ids and basis digests are literals.
"""

from __future__ import annotations

import hashlib
import logging
import math
import xml.etree.ElementTree as ET
from collections.abc import Callable
from datetime import date
from decimal import Decimal
from itertools import pairwise
from types import SimpleNamespace
from typing import Any, get_args

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


def test_an_undated_quarter_among_dated_ones_is_plotted_undated() -> None:
    """S12-2-1: a quarter with no end date has no span, so it is checked by its number alone."""
    periods = {
        "q1": ("QUARTER", "2025", "1", "2025-01-01", "2025-03-31"),
        "q2": ("QUARTER", "2025", "2", None, None),
        "q3": ("QUARTER", "2025", "3", "2025-07-01", "2025-09-30"),
    }
    columns = {"Q:q1": "q1", "Q:q2": "q2", "Q:q3": "q3"}
    item = figure(module(periods, columns), "S.5")
    assert sorted(categories(item)) == ["Q1 2025", "Q2 2025", "Q3 2025"]


def test_an_undated_quarter_number_outside_one_to_four_still_raises() -> None:
    periods = {
        "q1": ("QUARTER", "2025", "1", "2025-01-01", "2025-03-31"),
        "q5": ("QUARTER", "2025", "5", None, None),
    }
    with pytest.raises(ValueError, match="Ambiguous QUARTER identities"):
        cp1_chart_series(module(periods, {"Q:q1": "q1", "Q:q5": "q5"}))


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
        ("2026-09-30", "RCF"),
        ("2027-03-01", "Term loan B"),
        ("2027-03-01", "Senior notes 2027"),
        ("2030-06-15", "Senior notes 2030"),
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
    # S12-4-2: the reason names the facility and quotes its limitation, never a fact id.
    assert item.reason == "Contractual maturity unavailable for Term loan B: Not stated"


def test_maturity_wall_reads_the_quarter_snapshot_beside_trailing_periods() -> None:
    """A YTD, LTM or PF period ending on the snapshot date is an alias ranked after the
    quarter: identical rows there are read at the quarter."""
    extra = (*facility_facts("q2-2025"), *facility_facts("ltm-2025"))
    item = figure(module(PERIODS, COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".q2-2025:" in point.fact_id for point in item.points)


LEASES_LEFT_OUT = (
    "Leases are left out of the maturity wall, so it does not sum to CP-1's total debt."
)
NON_USD_REASON = (
    "The maturity wall supports USD facilities; this snapshot states another currency; "
    "nothing was converted."
)


@pytest.mark.parametrize("lease", ["FINANCE_LEASE", "OPERATING_LEASE"])
def test_a_current_lease_is_left_out_of_the_wall_and_the_wall_says_so(lease: str) -> None:
    """Owner item 12: the wall plots the facilities the debt total sums and states that leases
    are left out; S.1 to S.3 and S.5 are unchanged."""
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    facts = tuple(
        fact.model_copy(update={"text": lease})
        if fact.fact_id == "T4.18:fac-b.q2-2025:lease_classification"
        else fact
        for fact in view.facts
    )
    figures = figures_of(view.model_copy(update={"facts": facts}))
    assert figures["S.4"].reason is None
    assert [p.fact_id for p in figures["S.4"].points] == [
        "T4.18:fac-d.q2-2025:principal",
        "T4.18:fac-c.q2-2025:principal",
        "T4.18:fac-a.q2-2025:principal",
    ]
    assert figures["S.4"].note == LEASES_LEFT_OUT
    control = figures_of(module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025")))
    assert control["S.4"].note is None
    for fig_id in ("S.1", "S.2", "S.3", "S.5"):
        assert figures[fig_id] == control[fig_id]


def test_a_non_usd_facility_empties_the_wall_with_a_reason_that_names_no_lease() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    item = figure(with_text(view, "T4.18:fac-b.q2-2025:currency", "EUR"), "S.4")
    assert item.points == ()
    assert item.series == ()
    assert item.note is None
    assert item.reason == NON_USD_REASON
    assert "lease" not in item.reason


def test_a_non_usd_lease_is_left_out_not_a_reason_to_empty_the_wall() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    view = with_text(view, "T4.18:fac-b.q2-2025:lease_classification", "FINANCE_LEASE")
    item = figure(with_text(view, "T4.18:fac-b.q2-2025:currency", "EUR"), "S.4")
    assert item.reason is None
    assert len(item.points) == 3
    assert item.note == LEASES_LEFT_OUT


@pytest.mark.parametrize("kind", ["FY", "QUARTER", "PERIOD_END"])
def test_a_period_without_stated_dates_is_plotted_last_and_never_a_snapshot(kind: str) -> None:
    undated = (kind, "2025", "4" if kind == "QUARTER" else None, None, None)
    periods = {"fy-2024": PERIODS["fy-2024"], "undated": undated}
    columns = {"FY:fy-2024": "fy-2024"}
    if kind != "PERIOD_END":
        columns[("Q:" if kind == "QUARTER" else "FY:") + "undated"] = "undated"
    view = module(periods, columns, extra=facility_facts("undated"))
    figures = {item.fig_id: item for item in cp1_chart_series(view)}
    expected = (
        ["FY2024"]
        if kind == "PERIOD_END"
        else ["FY2024", "Q4 2025" if kind == "QUARTER" else "FY2025"]
    )
    assert categories(figures["S.3"]) == expected
    assert figures["S.4"].points == ()
    assert figures["S.4"].title == "Maturity wall — principal at 2024-12-31 (not a forecast)"


def test_a_facility_lease_status_not_stated_is_not_called_a_lease_or_currency() -> None:
    """S12-2-2: NOT_STATED is neither a lease nor another currency; the reason says so."""
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    facts = tuple(
        fact.model_copy(update={"text": "NOT_STATED"})
        if fact.fact_id == "T4.18:fac-b.q2-2025:lease_classification"
        else fact
        for fact in view.facts
    )
    item = figure(view.model_copy(update={"facts": facts}), "S.4")
    assert item.points == ()
    assert item.reason == (
        "The maturity wall supports USD facilities stated not to be leases; this snapshot "
        "does not state whether a facility is a lease; nothing was converted."
    )


Q4_2024 = ("QUARTER", "2024", "4", "2024-10-01", "2024-12-31")
ALIAS_REASON = (
    "The maturity wall reads one facility snapshot; two facility rows for one facility at this "
    "date disagree in its terms; nothing was plotted."
)


def with_text(view: ModuleView, fact_id: str, text: str) -> ModuleView:
    facts = tuple(
        fact.model_copy(update={"text": text}) if fact.fact_id == fact_id else fact
        for fact in view.facts
    )
    return view.model_copy(update={"facts": facts})


def figures_of(view: ModuleView) -> dict[str, FinancialFigureSeries]:
    return {item.fig_id: item for item in cp1_chart_series(view)}


@pytest.mark.parametrize(
    ("field", "text"),
    [
        ("facility_name", "Renamed loan"),
        ("maturity_date", "2028-01-01"),
        ("annual_amortisation", "5"),
    ],
)
def test_conflicting_snapshot_aliases_empty_only_the_maturity_wall(field: str, text: str) -> None:
    """S12-3-1: FY and Q4 rows of one facility disagreeing is an S.4 gap, not a figure-set error."""
    periods = {"q4-2024": Q4_2024, "fy-2024": PERIODS["fy-2024"]}
    columns = {"Q:q4-2024": "q4-2024", "FY:fy-2024": "fy-2024"}
    facts = (*facility_facts("q4-2024"), *facility_facts("fy-2024"))
    control = figures_of(module(periods, columns, extra=facts))
    assert len(control["S.4"].points) == 4
    assert all(".q4-2024:" in point.fact_id for point in control["S.4"].points)
    changed = with_text(module(periods, columns, extra=facts), f"T4.18:fac-b.fy-2024:{field}", text)
    got = figures_of(changed)
    assert got["S.4"].points == ()
    assert got["S.4"].series == ()
    assert got["S.4"].reason == ALIAS_REASON
    plain = figures_of(module(periods, columns))
    for fig_id in ("S.1", "S.2", "S.3", "S.5"):
        assert got[fig_id] == plain[fig_id]


CLOSE_2024 = ("PERIOD_END", "2024", None, None, "2024-12-31")


def fy_and_close(*, close: bool, fy: bool, quarter: bool = False) -> ModuleView:
    periods = {"fy-2024": PERIODS["fy-2024"], "close-2024": CLOSE_2024}
    columns = {"FY:fy-2024": "fy-2024"}
    extra: tuple[Fact, ...] = ()
    if fy:
        extra += facility_facts("fy-2024")
    if close:
        extra += facility_facts("close-2024")
    if quarter:
        periods["q4-2024"] = Q4_2024
        columns["Q:q4-2024"] = "q4-2024"
        extra += facility_facts("q4-2024")
    return module(periods, columns, extra=extra)


def test_an_fy_snapshot_is_read_beside_a_period_end_book_at_the_same_date() -> None:
    """S12-3-2 (a): FY outranks PERIOD_END, so the one FY row set is plotted."""
    item = figure(fy_and_close(close=False, fy=True), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".fy-2024:" in point.fact_id for point in item.points)


def test_identical_fy_and_period_end_rows_plot_the_fy_rows() -> None:
    item = figure(fy_and_close(close=True, fy=True), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".fy-2024:" in point.fact_id for point in item.points)


def test_a_period_end_row_disagreeing_with_the_fy_row_is_an_alias_gap() -> None:
    view = with_text(
        fy_and_close(close=True, fy=True), "T4.18:fac-b.close-2024:maturity_date", "2028-01-01"
    )
    got = figures_of(view)
    assert got["S.4"].points == ()
    assert got["S.4"].reason == ALIAS_REASON
    plain = figures_of(fy_and_close(close=False, fy=False))
    for fig_id in ("S.1", "S.2", "S.3", "S.5"):
        assert got[fig_id] == plain[fig_id]


def test_a_quarter_snapshot_outranks_fy_and_period_end_at_one_date() -> None:
    item = figure(fy_and_close(close=True, fy=True, quarter=True), "S.4")
    assert item.reason is None
    assert all(".q4-2024:" in point.fact_id for point in item.points)


def test_undated_quarters_of_two_fiscal_years_are_drawn_in_fiscal_order() -> None:
    """S12-3-3: undated periods of one class are ordered by their own fiscal year and quarter."""
    periods = {
        "q4-2024": ("QUARTER", "2024", "4", None, None),
        "q1-2025": ("QUARTER", "2025", "1", None, None),
        "q2-2025": PERIODS["q2-2025"],
    }
    columns = {"Q:q4-2024": "q4-2024", "Q:q1-2025": "q1-2025", "Q:q2-2025": "q2-2025"}
    assert categories(figure(module(periods, columns), "S.5")) == [
        "Q2 2025",
        "Q4 2024",
        "Q1 2025",
    ]


def test_an_undated_fy_follows_its_own_years_undated_quarters() -> None:
    periods = {
        "q4-2025": ("QUARTER", "2025", "4", None, None),
        "fy-2025": ("FY", "2025", None, None, None),
    }
    columns = {"Q:q4-2025": "q4-2025", "FY:fy-2025": "fy-2025"}
    assert categories(figure(module(periods, columns), "S.5")) == ["Q4 2025", "FY2025"]


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


def test_a_snapshot_held_only_at_a_lower_ranked_alias_is_plotted() -> None:
    """S12-4-1: the kind is ranked among the latest-date periods that carry facility rows."""
    item = figure(fy_and_close(close=True, fy=False), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".close-2024:" in point.fact_id for point in item.points)


def test_an_fy_snapshot_beside_a_quarter_without_rows_is_plotted() -> None:
    periods = {"q4-2024": Q4_2024, "fy-2024": PERIODS["fy-2024"]}
    columns = {"Q:q4-2024": "q4-2024", "FY:fy-2024": "fy-2024"}
    item = figure(module(periods, columns, extra=facility_facts("fy-2024")), "S.4")
    assert item.reason is None
    assert (item.points[0].category, item.points[0].series) == ("2026-09-30", "RCF")
    assert all(".fy-2024:" in point.fact_id for point in item.points)


def test_an_unavailable_maturity_reason_carries_no_fact_identity() -> None:
    """S12-4-2: ids and hashes are drawn only on Evidence; the reason is reader text."""
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    limitation = "Maturity not stated in the debt note"
    facts = tuple(
        fact.model_copy(update={"text": None, "status": "missing", "limitation": limitation})
        if fact.fact_id == "T4.18:fac-a.q2-2025:maturity_date"
        else fact
        for fact in view.facts
    )
    reason = figure(view.model_copy(update={"facts": facts}), "S.4").reason
    assert reason == f"Contractual maturity unavailable for Senior notes 2030: {limitation}"
    assert "T4.18" not in reason and "fac-a" not in reason


@pytest.mark.parametrize("kind", ["YTD", "LTM"])
def test_undated_trailing_periods_of_one_year_are_drawn_in_quarter_order(kind: str) -> None:
    """S12-4-3: an undated YTD/LTM is ordered by its own stated fiscal quarter."""
    prefix = "YTD" if kind == "YTD" else "LTM"
    periods = {
        "fy-2024": PERIODS["fy-2024"],
        "p-9m-2025": (kind, "2025", "3", None, None),
        "p-h1-2025": (kind, "2025", "2", None, None),
    }
    columns = {
        "FY:fy-2024": "fy-2024",
        f"{prefix}:p-9m-2025": "p-9m-2025",
        f"{prefix}:p-h1-2025": "p-h1-2025",
    }
    item = figure(module(periods, columns), "S.5")
    drawn = [p.fact_id.removeprefix("T4.10:revenue:") for p in item.points if p.series == "revenue"]
    assert drawn == ["FY:fy-2024", f"{prefix}:p-h1-2025", f"{prefix}:p-9m-2025"]


# S12-5: the snapshot is read across every period of the latest date (owner ruling, round 5).
CLOSE_2024_AR = ("PERIOD_END", "2024", None, None, "2024-12-31")


def facility_subset(pid: str, *fids: str) -> tuple[Fact, ...]:
    return tuple(f for f in facility_facts(pid) if f.row_id.split(".")[0] in fids)


def two_closes(*, first: bool, second: bool) -> ModuleView:
    periods = {"fy-2024": PERIODS["fy-2024"], "close-2024": CLOSE_2024}
    periods["close-2024-ar"] = CLOSE_2024_AR
    extra: tuple[Fact, ...] = ()
    if first:
        extra += facility_facts("close-2024")
    if second:
        extra += facility_facts("close-2024-ar")
    return module(periods, {"FY:fy-2024": "fy-2024"}, extra=extra)


def test_rows_at_one_of_two_period_ends_at_the_latest_date_are_plotted() -> None:
    """S12-5-1: two PERIOD_END periods at one date never raise; the rows are read where stated."""
    got = figures_of(two_closes(first=False, second=True))
    assert got["S.4"].reason is None
    assert [p.series for p in got["S.4"].points] == [
        "RCF",
        "Term loan B",
        "Senior notes 2027",
        "Senior notes 2030",
    ]
    assert all(".close-2024-ar:" in p.fact_id for p in got["S.4"].points)
    plain = figures_of(module({"fy-2024": PERIODS["fy-2024"]}, {"FY:fy-2024": "fy-2024"}))
    for fig_id in ("S.1", "S.2", "S.3", "S.5"):
        assert got[fig_id] == plain[fig_id]


def test_identical_rows_at_two_period_ends_plot_the_first_by_period_id() -> None:
    item = figure(two_closes(first=True, second=True), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert all(".close-2024:" in p.fact_id for p in item.points)


Q4_AND_FY = {"q4-2024": Q4_2024, "fy-2024": PERIODS["fy-2024"]}
Q4_AND_FY_COLUMNS = {"Q:q4-2024": "q4-2024", "FY:fy-2024": "fy-2024"}


@pytest.mark.parametrize(
    ("at_fy", "fy_read"),
    [
        (("fac-a", "fac-b", "fac-c", "fac-d"), {"fac-c", "fac-d"}),  # subset at Q4
        (("fac-c", "fac-d"), {"fac-c", "fac-d"}),  # each facility at one alias
    ],
)
def test_facility_rows_spread_over_same_date_aliases_are_one_snapshot(
    at_fy: tuple[str, ...], fy_read: set[str]
) -> None:
    """S12-5-2: the population is every facility with rows at any alias of the latest date."""
    extra = (*facility_subset("q4-2024", "fac-a", "fac-b"), *facility_subset("fy-2024", *at_fy))
    item = figure(module(Q4_AND_FY, Q4_AND_FY_COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert [(p.category, p.series) for p in item.points] == [
        ("2026-09-30", "RCF"),
        ("2027-03-01", "Term loan B"),
        ("2027-03-01", "Senior notes 2027"),
        ("2030-06-15", "Senior notes 2030"),
    ]
    for point in item.points:
        fid = next(f for f, (name, _, _) in FACILITIES.items() if name == point.series)
        pid = "fy-2024" if fid in fy_read else "q4-2024"
        assert point.fact_id == f"T4.18:{fid}.{pid}:principal"
        assert f"T4.14:{pid}:end_date" in point.companion_fact_ids


def unstated_at_q4(field: str) -> ModuleView:
    facts = (*facility_facts("q4-2024"), *facility_facts("fy-2024"))
    target = f"T4.18:fac-b.q4-2024:{field}"
    gap = {"text": None, "amount": None, "status": "missing", "limitation": "Not stated in Q4"}
    changed = tuple(f.model_copy(update=gap) if f.fact_id == target else f for f in facts)
    return module(Q4_AND_FY, Q4_AND_FY_COLUMNS, extra=changed)


@pytest.mark.parametrize("field", ["annual_amortisation", "principal", "maturity_date"])
def test_a_field_one_alias_leaves_unstated_is_read_from_the_alias_that_states_it(
    field: str,
) -> None:
    """S12-5-3: an unstated value never conflicts with a stated one."""
    item = figure(unstated_at_q4(field), "S.4")
    assert item.reason is None
    assert [(p.category, p.series) for p in item.points] == [
        ("2026-09-30", "RCF"),
        ("2027-03-01", "Term loan B"),
        ("2027-03-01", "Senior notes 2027"),
        ("2030-06-15", "Senior notes 2030"),
    ]
    loan = item.points[1]
    principal_at = "fy-2024" if field == "principal" else "q4-2024"
    assert loan.fact_id == f"T4.18:fac-b.{principal_at}:principal"
    assert f"T4.18:fac-b.fy-2024:{field}" in (loan.fact_id, *loan.companion_fact_ids)
    assert f"T4.18:fac-b.q4-2024:{field}" not in (loan.fact_id, *loan.companion_fact_ids)


EARLIER_AND_LATEST = {"fy-2023": PERIODS["fy-2023"], **Q4_AND_FY}
EARLIER_AND_LATEST_COLUMNS = {"FY:fy-2023": "fy-2023", **Q4_AND_FY_COLUMNS}


def test_a_facility_absent_from_every_alias_of_the_latest_date_empties_the_wall() -> None:
    """Coordinator ruling (round 5): the population spans every dated snapshot; a facility with
    rows at an earlier date and none at the latest date is a missing snapshot, never dropped."""
    extra = (
        *facility_facts("fy-2023"),
        *facility_subset("q4-2024", "fac-a", "fac-b"),
        *facility_subset("fy-2024", "fac-c"),
    )
    item = figure(module(EARLIER_AND_LATEST, EARLIER_AND_LATEST_COLUMNS, extra=extra), "S.4")
    assert item.points == ()
    assert item.reason == "No complete current facility snapshot is supplied."


def test_every_earlier_facility_spread_over_latest_aliases_is_plotted() -> None:
    extra = (
        *facility_facts("fy-2023"),
        *facility_subset("q4-2024", "fac-a", "fac-b"),
        *facility_subset("fy-2024", "fac-c", "fac-d"),
    )
    item = figure(module(EARLIER_AND_LATEST, EARLIER_AND_LATEST_COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert [p.fact_id for p in item.points] == [
        "T4.18:fac-d.fy-2024:principal",
        "T4.18:fac-b.q4-2024:principal",
        "T4.18:fac-c.fy-2024:principal",
        "T4.18:fac-a.q4-2024:principal",
    ]


# S12-6-1: the population is the facilities `financial_reconciliation._debt` sums (round-6 ruling).
NO_SNAPSHOT = "No complete current facility snapshot is supplied."
THREE_POINTS = [
    "T4.18:fac-d.q2-2025:principal",
    "T4.18:fac-b.q2-2025:principal",
    "T4.18:fac-c.q2-2025:principal",
]


def restyled(facts: tuple[Fact, ...], fid: str, **texts: str) -> tuple[Fact, ...]:
    """The facts with the named T4.18 fields of one facility (at every period) restated."""
    return tuple(
        fact.model_copy(update={"text": texts[fact.field]})
        if fact.row_id.split(".")[0] == fid and fact.field in texts
        else fact
        for fact in facts
    )


def lease_a_at_q1(facility_type: str, lease: str) -> ModuleView:
    extra = (*facility_facts("q1-2025"), *facility_subset("q2-2025", "fac-b", "fac-c", "fac-d"))
    extra = restyled(extra, "fac-a", facility_type=facility_type, lease_classification=lease)
    return module(QUARTERS, QUARTER_COLUMNS, extra=extra)


@pytest.mark.parametrize("lease", ["FINANCE_LEASE", "OPERATING_LEASE"])
def test_a_lease_listed_only_at_an_earlier_date_leaves_the_current_wall_plotted(
    lease: str,
) -> None:
    """T1: `_debt` sums no lease, so a lease without a row at the latest date is not missing."""
    item = figure(lease_a_at_q1("LEASE", lease), "S.4")
    assert item.reason is None
    assert [p.fact_id for p in item.points] == THREE_POINTS


@pytest.mark.parametrize("lease", ["FINANCE_LEASE", "OPERATING_LEASE"])
def test_a_debt_adjustment_lease_missing_at_the_latest_date_empties_the_wall(lease: str) -> None:
    """T2: `_debt` sums a DEBT ADJUSTMENT however it is classified; its absence is a gap."""
    item = figure(lease_a_at_q1("DEBT ADJUSTMENT", lease), "S.4")
    assert item.points == ()
    assert item.reason == NO_SNAPSHOT


def test_a_facility_row_at_a_trailing_period_of_the_latest_date_is_in_the_snapshot() -> None:
    """T3: every period ending on the latest date is a snapshot alias, ranked after the
    QUARTER, FY and PERIOD_END kinds."""
    periods = {**QUARTERS, "ltm-2025": PERIODS["ltm-2025"]}
    columns = {**QUARTER_COLUMNS, "LTM:ltm-2025": "ltm-2025"}
    extra = (
        *facility_facts("q1-2025"),
        *facility_subset("q2-2025", "fac-b", "fac-c", "fac-d"),
        *facility_subset("ltm-2025", "fac-a"),
    )
    item = figure(module(periods, columns, extra=extra), "S.4")
    assert item.reason is None
    assert [p.fact_id for p in item.points] == [*THREE_POINTS, "T4.18:fac-a.ltm-2025:principal"]


@pytest.mark.parametrize(
    ("pid", "spec"),
    [
        ("ytd-2024", PERIODS["ytd-2024"]),
        ("q4-undated", ("QUARTER", "2024", "4", None, None)),
    ],
)
def test_a_debt_facility_held_only_off_the_latest_date_empties_the_wall(
    pid: str, spec: tuple[str, str, str | None, str | None, str | None]
) -> None:
    """T4: a facility `_debt` sums with a row at any period, dated or not, must be present at
    the latest date; an undated row is never a snapshot row."""
    periods = {**QUARTERS, pid: spec}
    extra = (
        *facility_subset(pid, "fac-a"),
        *facility_subset("q2-2025", "fac-b", "fac-c", "fac-d"),
    )
    item = figure(module(periods, QUARTER_COLUMNS, extra=extra), "S.4")
    assert item.points == ()
    assert item.reason == NO_SNAPSHOT


def test_a_current_lease_is_left_out_beside_the_debt_facilities() -> None:
    """T5 (owner item 12): an earlier-only lease is not required; a lease at the latest date is
    left out and stated, the other facilities are plotted."""
    extra = (
        *facility_subset("q1-2025", "fac-a"),
        *facility_subset("q2-2025", "fac-b", "fac-c", "fac-d"),
    )
    extra = restyled(extra, "fac-a", facility_type="LEASE", lease_classification="FINANCE_LEASE")
    extra = restyled(extra, "fac-d", facility_type="LEASE", lease_classification="OPERATING_LEASE")
    item = figure(module(QUARTERS, QUARTER_COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert [p.fact_id for p in item.points] == [
        "T4.18:fac-b.q2-2025:principal",
        "T4.18:fac-c.q2-2025:principal",
    ]
    assert item.note == LEASES_LEFT_OUT


def test_a_snapshot_of_leases_only_states_that_the_wall_shows_debt_facilities() -> None:
    extra = restyled(
        facility_subset("q2-2025", "fac-a", "fac-b"),
        "fac-a",
        facility_type="LEASE",
        lease_classification="FINANCE_LEASE",
    )
    extra = restyled(extra, "fac-b", facility_type="LEASE", lease_classification="FINANCE_LEASE")
    item = figure(module(QUARTERS, QUARTER_COLUMNS, extra=extra), "S.4")
    assert item.points == ()
    assert item.reason == (
        "CP-1 states only leases at the latest date; the maturity wall shows debt facilities."
    )


def test_a_debt_adjustment_lease_is_plotted_whatever_its_lease_class() -> None:
    extra = restyled(
        facility_facts("q2-2025"),
        "fac-a",
        facility_type="DEBT ADJUSTMENT",
        lease_classification="FINANCE_LEASE",
    )
    item = figure(module(QUARTERS, QUARTER_COLUMNS, extra=extra), "S.4")
    assert item.reason is None
    assert len(item.points) == 4
    assert item.note is None


# Owner item 7: a facility-row failure empties S.4 only, with one fixed reader reason.
MATURITY_FAILED = "The maturity wall cannot be drawn from CP-1's facility rows."


def _drop(view: ModuleView, fact_id: str) -> ModuleView:
    return view.model_copy(update={"facts": tuple(f for f in view.facts if f.fact_id != fact_id)})


def _update(view: ModuleView, fact_id: str, **changes: object) -> ModuleView:
    facts = tuple(f.model_copy(update=changes) if f.fact_id == fact_id else f for f in view.facts)
    return view.model_copy(update={"facts": facts})


def _incomplete(view: ModuleView) -> ModuleView:
    return _drop(view, "T4.18:fac-b.q2-2025:lease_classification")


def _foreign(view: ModuleView) -> ModuleView:
    return _update(view, "T4.18:fac-b.q2-2025:period_id", text="no-such-period")


def _duplicate(view: ModuleView) -> ModuleView:
    copies = tuple(
        f.model_copy(update={"row_id": "fac-b.again", "fact_id": f.fact_id + ".again"})
        for f in view.facts
        if f.table_id == "T4.18" and f.row_id == "fac-b.q2-2025"
    )
    return view.model_copy(update={"facts": (*view.facts, *copies)})


def _thousands(view: ModuleView) -> ModuleView:
    return _update(view, "T4.18:fac-b.q2-2025:principal", unit="THOUSANDS")


def _malformed_row(view: ModuleView) -> ModuleView:
    return _update(view, "T4.18:fac-b.q2-2025:annual_amortisation", text=None)


def _unresolved_identity(view: ModuleView) -> ModuleView:
    return _update(
        view,
        "T4.18:fac-b.q2-2025:facility_type",
        text=None,
        status="missing",
        limitation="Not stated",
    )


def _bad_maturity(view: ModuleView) -> ModuleView:
    return _update(view, "T4.18:fac-b.q2-2025:maturity_date", text="not-a-date")


@pytest.mark.parametrize(
    "break_it",
    [
        _incomplete,
        _foreign,
        _duplicate,
        _thousands,
        _malformed_row,
        _unresolved_identity,
        _bad_maturity,
    ],
)
def test_a_facility_row_failure_empties_only_the_maturity_wall(
    break_it: Callable[[ModuleView], ModuleView], caplog: pytest.LogCaptureFixture
) -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    control = figures_of(view)
    assert control["S.4"].reason is None
    with caplog.at_level(logging.WARNING, logger="deploy_vii.financial_series"):
        got = figures_of(break_it(view))
    assert got["S.4"].points == ()
    assert got["S.4"].series == ()
    assert got["S.4"].reason == MATURITY_FAILED
    assert got["S.4"].note is None
    assert got["S.4"].fig_id == "S.4"
    for fig_id in ("S.1", "S.2", "S.3", "S.5"):
        assert got[fig_id] == control[fig_id]
    # The detail goes to the log, never to a page.
    assert [r.levelno for r in caplog.records] == [logging.WARNING]
    assert caplog.records[0].getMessage().startswith("CP-1 maturity wall not drawn: ")
    assert len(caplog.records[0].getMessage()) > len("CP-1 maturity wall not drawn: ")
    assert "T4.18" not in (got["S.4"].reason or "")


def test_a_period_failure_still_raises_rather_than_hiding_in_the_wall() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    broken = _update(view, "T4.14:q2-2025:currency", text="EUR")
    assert figures_of(broken)["S.4"].reason is not None  # unsupported scope: stated, not raised
    mismatched = _update(view, "T4.14:q2-2025:period_type", text="NO_SUCH_KIND")
    with pytest.raises(ValueError, match="Unsupported historical chart period type"):
        cp1_chart_series(mismatched)


# Owner item 11: a twin row and a series name are reader text; ids and refs are Evidence's.
RAW_MARKERS = ("period_id", "facility_id", "T4.", "model-basis", "fac-", " [", "]", ": ")


@pytest.mark.parametrize("fig_id", ["S.1", "S.2", "S.3", "S.4", "S.5"])
def test_a_cp1_twin_row_is_caption_and_category_only_and_keeps_its_trace(fig_id: str) -> None:
    view = module(PERIODS, COLUMNS, extra=facility_facts("q2-2025"))
    item = drawn(view, fig_id)
    twin = item.chart.table_twin
    assert twin.rows
    for row, mark in zip(twin.rows, item.chart.marks, strict=True):
        assert row.label == f"{mark.series} · {mark.label}"
        assert not any(marker in row.label for marker in RAW_MARKERS)
        assert row.cells[0].ref_id == "K1"  # the cell keeps its trace control
    assert not any(marker in name for name in item.chart.series for marker in RAW_MARKERS)


def test_the_maturity_wall_names_a_series_by_its_facility_and_numbers_repeated_names() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    assert figure(view, "S.4").series == (
        "RCF",
        "Term loan B",
        "Senior notes 2027",
        "Senior notes 2030",
    )
    renamed = with_text(view, "T4.18:fac-c.q2-2025:facility_name", "Term loan B")
    assert figure(renamed, "S.4").series == (
        "RCF",
        "Term loan B (1)",
        "Term loan B (2)",
        "Senior notes 2030",
    )
    assert [p.fact_id for p in figure(renamed, "S.4").points][1:3] == [
        "T4.18:fac-b.q2-2025:principal",
        "T4.18:fac-c.q2-2025:principal",
    ]


def test_the_drawn_wall_twin_states_that_leases_are_left_out() -> None:
    view = module(QUARTERS, QUARTER_COLUMNS, extra=facility_facts("q2-2025"))
    leased = with_text(view, "T4.18:fac-b.q2-2025:lease_classification", "FINANCE_LEASE")
    item = drawn(leased, "S.4")
    assert item.chart.reason is None
    assert item.chart.table_twin.note == LEASES_LEFT_OUT
    assert len(item.chart.marks) == 3
    assert drawn(view, "S.4").chart.table_twin.note is None


def test_a_group_b_twin_row_names_no_companion_field_or_ref() -> None:
    """RV.3 and CR.1 draw through `_figure_of_points`: the same reader-only row label."""
    facts = (
        Fact(
            fact_id="X.value",
            label="Net leverage",
            table_id="X",
            row_id="r",
            field="value",
            amount=Decimal("3.5"),
            unit="MULTIPLE",
            scale=Decimal(1),
            period="FY2024",
            basis=SCOPE,
        ),
        Fact(
            fact_id="X.flag",
            label="Peer flag",
            table_id="X",
            row_id="r",
            field="flag",
            text="Included",
            period="FY2024",
            basis=SCOPE,
        ),
    )
    view = ModuleView(
        module_id="CP-1C",
        title="Peers",
        aliases=(),
        status="accepted",
        artifact_sha256="a" * 64,
        facts=facts,
    )
    refs = {("CP-1C", "X.value"): ("K1",), ("CP-1C", "X.flag"): ("K2",)}
    item = report_view._figure_of_points(
        "blk",
        view,
        refs,
        fig_id="RV.3b",
        title="Peer positioning",
        kind="range",
        unit_class="multiple",
        unit="x",
        series=("Issuer",),
        points=(report_view._ChartPoint("Issuer", "Net leverage", "X.value", ("X.flag",)),),
        placement="above",
    )
    (row,) = item.chart.table_twin.rows
    assert row.label == "Issuer · Net leverage"
    assert row.cells[0].ref_id == "K1"
    with pytest.raises(ValueError, match="unknown fact X.nope"):
        report_view._figure_of_points(
            "blk",
            view,
            refs,
            fig_id="RV.3b",
            title="Peer positioning",
            kind="range",
            unit_class="multiple",
            unit="x",
            series=("Issuer",),
            points=(report_view._ChartPoint("Issuer", "Net leverage", "X.value", ("X.nope",)),),
            placement="above",
        )


def _cr1_view() -> Any:
    """CP-4's T4.9 with two rows that share a label and one whose comparison is not drawn."""
    from deploy_vii.contracts import ReportTable, TableColumn, TableRow

    fields = (
        "comparison",
        "threshold",
        "current",
        "headroom",
        "cp_1_metric",
        "test_on_cp_1_metric",
        "headroom_share",
    )
    row_labels = {"c1": "Net leverage", "c2": "Net leverage", "c3": "Cover"}
    facts, rows = [], []
    for row_id, row_label in row_labels.items():
        ids = []
        for field in fields:
            fact_id = f"T4.9.{row_id}.{field}"
            ids.append(fact_id)
            common = {
                "fact_id": fact_id,
                "label": field,
                "table_id": "T4.9",
                "row_id": row_id,
                "field": field,
                "period": "FY2024",
                "basis": SCOPE,
            }
            if field in {"current", "headroom"}:
                facts.append(
                    Fact(
                        **common,
                        amount=Decimal("1.5"),
                        unit="MULTIPLE",
                        scale=Decimal(1),
                    )
                )
            elif field == "comparison":
                text = "Sometimes" if row_id == "c3" else "Not more than"
                facts.append(Fact(**common, text=text))
            elif field == "threshold":
                facts.append(Fact(**common, text="4.00x"))
            else:
                facts.append(Fact(**common, text="note"))
        rows.append(TableRow(row_id=row_id, label=row_label, fact_ids=tuple(ids)))
    table = ReportTable(
        table_id="T4.9",
        title="Covenants",
        columns=tuple(TableColumn(field=f, label=f) for f in fields),
        rows=tuple(rows),
    )
    module = ModuleView(
        module_id="CP-4",
        title="Legal",
        aliases=(),
        status="accepted",
        artifact_sha256="b" * 64,
        facts=tuple(facts),
        tables=(table,),
    )
    return SimpleNamespace(modules=(module,))


def test_cr1_numbers_repeated_labels_and_names_no_id_in_its_note() -> None:
    """Ids stay on Evidence: repeated labels are numbered and the note names reader labels."""
    import re

    view = _cr1_view()
    refs: dict[tuple[str, str], tuple[str, ...]] = {}
    for module in view.modules:
        for fact in module.facts:
            refs[(module.module_id, fact.fact_id)] = ("K1",)
    (figure,) = report_view._cr1_figures("blk", view, refs)
    labels = [row.label for row in figure.chart.table_twin.rows]
    assert "Threshold · Net leverage (1)" in labels
    assert "Threshold · Net leverage (2)" in labels
    assert not any("c1" in label or "c2" in label for label in labels)
    assert figure.summary is not None
    assert figure.summary.startswith("Not drawn: Cover")
    assert not re.search(r"T4\.9|\.c3\.|c3", figure.summary)
