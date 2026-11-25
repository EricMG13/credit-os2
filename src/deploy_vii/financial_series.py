"""Source-native chart coordinates from a selected settled CP1 register.

This projection selects facts, never calculates financial values or display text.
Its strip charts plot every T4.14 period that carries a T4.10 fact (FY, QUARTER, YTD, LTM, PF)
in the one period order (`period_order`, docs/superpowers/specs/2026-11-25-chart-periods.md);
its maturity wall reads a complete current facility snapshot. Bounded support: USD millions,
IFRS consolidated group. Authentication belongs to the unchanged envelope/publication
boundary; a ModuleView alone is not that proof.
"""

from __future__ import annotations

import hashlib
from collections.abc import Sequence
from dataclasses import dataclass, replace
from datetime import date
from decimal import Decimal
from itertools import pairwise
from typing import Literal

from deploy_vii.contracts import Fact, ModuleView
from deploy_vii.period_order import structured_period_key
from deploy_vii.trailing_period import states_trailing_period


@dataclass(frozen=True, slots=True)
class FinancialSeriesPoint:
    series: str
    category: str
    fact_id: str
    companion_fact_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class FinancialSeriesGap:
    """A series with no fact at a category of its figure: stated, never a fabricated point."""

    series: str
    category: str


@dataclass(frozen=True, slots=True)
class FinancialFigureSeries:
    fig_id: str
    title: str
    kind: Literal["line", "grouped"]
    unit_class: Literal["amount", "multiple"]
    unit: str
    series: tuple[str, ...]
    points: tuple[FinancialSeriesPoint, ...]
    reason: str | None
    gaps: tuple[FinancialSeriesGap, ...] = ()


@dataclass(frozen=True)
class _Period:
    identity: str
    kind: str
    start: str | None
    end: date | None
    row: dict[str, Fact]


# What start date a column's facts state, beside the period's end (`_start_agrees`).
type _StartRule = Literal["own", "own_or_unbuilt", "contains"]


@dataclass(frozen=True)
class _Column:
    """One T4.10 column of a T4.14 period: `column_id` is financial_model's column identity,
    `kind` the period type it is ordered as, `start` the start date its facts state."""

    period: _Period
    column_id: str
    kind: str
    category: str
    start: _StartRule


_PERIOD_FIELDS = (
    "period_id",
    "period_type",
    "fiscal_year",
    "fiscal_quarter",
    "start_date",
    "end_date",
    "currency",
    "unit",
    "accounting_basis",
    "entity_perimeter",
)
# The T4.10 columns a T4.14 period of each type (financial_contracts.FinancialPeriod.period_type)
# can carry, as (column-id prefix, period type it is ordered as, the start its facts state).
# model.periods builds them: a period's own column (`Q:`, `FY:`, `YTD:` or `PYTD:`, `LTM:`; `PF:`
# is model.frame's pro forma column id) and the host-built columns that carry the id of the
# period they end at (`LTM:<anchor>`, and `YTD:`/`PYTD:` summed to a quarter). A PERIOD_END row is
# a balance date: no KPI column exists for it.
# The start: financial_model._bases dates a basis as end - days + 1 (`null` without an end or a
# day count), and financial_adapter._periods gives a period with both dates their day count.
# - `own`: the column's days are the period's own (model.periods._quarter_spec, _period_spec),
#   so the period's start. The LTM at a fiscal-year end is that year (_host_ltm), so the same.
# - `own_or_unbuilt`: an LTM row's column takes the host's summed span (_host_ltm), `null` where
#   a component is missing; a sum that differs from the row's dates (UNSPANNED) contradicts
#   the row and raises.
# - `contains`: quarters summed to date (_summed) and the LTM rolled to a quarter or YTD
#   (_rolled) end with the period and start at or before it, or `null` where a day count is
#   unknown.
_HOST_LTM: tuple[str, str, _StartRule] = ("LTM", "LTM", "contains")
_COLUMN_KINDS: dict[str, tuple[tuple[str, str, _StartRule], ...]] = {
    "QUARTER": (
        ("Q", "QUARTER", "own"),
        ("YTD", "YTD", "contains"),
        ("PYTD", "YTD", "contains"),
        _HOST_LTM,
    ),
    "FY": (("FY", "FY", "own"), ("LTM", "LTM", "own")),
    "YTD": (("YTD", "YTD", "own"), ("PYTD", "YTD", "own"), _HOST_LTM),
    "LTM": (("LTM", "LTM", "own_or_unbuilt"),),
    "PF": (("PF", "PF", "own"),),
    "PERIOD_END": (),
}
# The period types a facility snapshot (T4.18) is read at.
_SNAPSHOT_KINDS = frozenset({"QUARTER", "FY", "PERIOD_END"})
_SERIES = (
    ("S.1", "Leverage", ("total_leverage_reported", "net_leverage_reported")),
    ("S.2", "Interest cover", ("interest_coverage_reported",)),
    ("S.3", "Liquidity", ("cash_closing", "undrawn_rcf", "liquidity")),
    # S.5 reads T4.10 `revenue` and `adjusted_ebitda` (T4.5 is the cash-flow statement).
    ("S.5", "Net revenues and Adjusted EBITDA", ("revenue", "adjusted_ebitda")),
)
_MONEY_FIGURES = frozenset({"S.3", "S.5"})
_NO_FACTS = "No reported period has a value for this chart."


def _text(fact: Fact) -> str:
    if fact.status != "known" or fact.text is None or fact.amount is not None:
        raise ValueError(f"Unresolved chart identity: {fact.fact_id}")
    return fact.text


def _rows(module: ModuleView, table: str) -> tuple[dict[str, Fact], ...]:
    rows: dict[str, dict[str, Fact]] = {}
    for fact in module.facts:
        if fact.table_id == table:
            if fact.status == "known":
                if (fact.amount is None) == (fact.text is None):
                    raise ValueError(f"Malformed known chart fact: {fact.fact_id}")
            elif fact.amount is not None or fact.text is not None or not fact.limitation:
                raise ValueError(f"Malformed nonknown chart fact: {fact.fact_id}")
            if fact.amount is not None and not fact.amount.is_finite():
                raise ValueError(f"Nonfinite chart fact: {fact.fact_id}")
            row = rows.setdefault(fact.row_id, {})
            if fact.field in row:
                raise ValueError(f"Duplicate chart coordinate: {table}/{fact.row_id}/{fact.field}")
            row[fact.field] = fact
    return tuple(rows.values())


def _period(row: dict[str, Fact], identity: str) -> _Period:
    """A checked T4.14 row. A QUARTER, FY or PERIOD_END row states its end date; a YTD, LTM or PF
    row whose dates CP-1 could not establish is kept undated, never dropped."""
    scope = tuple(
        _text(row[key]) for key in ("currency", "unit", "accounting_basis", "entity_perimeter")
    )
    if scope != ("USD", "MILLIONS", "IFRS", "consolidated group"):
        raise ValueError("Unsupported chart currency, unit or perimeter")
    if any(f.basis != "IFRS · consolidated group" for f in row.values()):
        raise ValueError("Inconsistent chart period perimeter")
    kind = _text(row["period_type"])
    if kind not in _COLUMN_KINDS:
        raise ValueError("Unsupported historical chart period type")
    start, end = row["start_date"], row["end_date"]
    dated = kind in _SNAPSHOT_KINDS or end.status == "known"
    return _Period(
        identity,
        kind,
        _text(start) if start.status == "known" else None,
        date.fromisoformat(_text(end)) if dated else None,
        row,
    )


def _periods(module: ModuleView) -> tuple[_Period, ...]:
    """Every T4.14 period, by end date (an undated one last) and identity."""
    periods = []
    seen = set()
    for row in _rows(module, "T4.14"):
        if not set(_PERIOD_FIELDS) <= row.keys():
            raise ValueError("Incomplete T4.14 chart identity")
        identity = _text(row["period_id"])
        if identity in seen or any(f.period != identity for f in row.values()):
            raise ValueError("Ambiguous T4.14 chart period")
        seen.add(identity)
        periods.append(_period(row, identity))
    return tuple(sorted(periods, key=lambda p: (p.end or date.max, p.identity)))


def _basis(column_id: str) -> str:
    """Adopted financial_model historical column identity, not a label-based join.

    financial_periods._id length-prefixes each part; financial_model._basis_id
    uses ('historical', column_id), and a column is `<prefix>:<period id>` (`_COLUMN_KINDS`).
    Keep this local identity boundary pinned by literal contract tests rather
    than exposing or importing private financial calculation helpers.
    """
    parts = ("historical", column_id)
    raw = "".join(f"{len(part)}:{part}" for part in parts).encode()
    return "model-basis:" + hashlib.sha256(raw).hexdigest()


def _numeric(fact: Fact, money: bool) -> None:
    dimensions = (fact.unit, fact.currency, fact.scale, fact.basis)
    expected = (
        ("MILLIONS", "USD", Decimal(1000000), "IFRS · consolidated group")
        if money
        else ("MULTIPLE", None, Decimal(1), "IFRS · consolidated group")
    )
    if dimensions != expected or fact.text is not None:
        raise ValueError(f"Incompatible chart dimensions: {fact.fact_id}")
    if fact.status == "known":
        if fact.amount is None or not fact.amount.is_finite():
            raise ValueError(f"Nonfinite or absent chart value: {fact.fact_id}")
    elif fact.amount is not None or not fact.limitation:
        raise ValueError(f"Invalid chart gap: {fact.fact_id}")


def _quarter_number(period: _Period) -> str:
    return _text(period.row["fiscal_quarter"]).removeprefix("Q")


def _check_quarters(periods: tuple[_Period, ...]) -> None:
    """Contradictory QUARTER identities raise: a quarter number outside 1 to 4, (fiscal year,
    quarter) labels that repeat or do not increase with the dates, a stated start after its end,
    or a stated start inside the quarter before. Any number of quarters, of any fiscal years, is
    plotted; a quarter whose start the register does not state is checked by its labels alone."""
    quarters = [p for p in periods if p.kind == "QUARTER"]
    labels = [(_text(p.row["fiscal_year"]), _quarter_number(p)) for p in quarters]
    if any(n not in {"1", "2", "3", "4"} for _, n in labels) or any(
        a >= b for a, b in pairwise(labels)
    ):
        raise ValueError("Ambiguous QUARTER identities")
    ends = [date.min if p.end is None else p.end for p in quarters]
    starts = [None if p.start is None else date.fromisoformat(p.start) for p in quarters]
    if any(start is not None and start > end for start, end in zip(starts, ends, strict=True)):
        raise ValueError("Overlapping or inverted QUARTER periods")
    if any(start is not None and start <= prior for prior, start in zip(ends, starts[1:])):
        raise ValueError("Overlapping or inverted QUARTER periods")


def _kpi_metrics(module: ModuleView) -> dict[str, dict[str, Fact]]:
    """The T4.10 rows by their `field_1` metric identity; a missing or repeated one raises."""
    metrics: dict[str, dict[str, Fact]] = {}
    for row in _rows(module, "T4.10"):
        if "field_1" not in row:
            raise ValueError("Missing KPI metric identity")
        key = _text(row["field_1"])
        if key in metrics:
            raise ValueError("Duplicate KPI metric identity")
        metrics[key] = row
    return metrics


def _category(period: _Period, prefix: str) -> str:
    """The X label of a period's column, naming its kind: `FY2024`, `Q1 2025`, `YTD 2025-09-30`,
    `PYTD 2024-09-30`, `LTM 2025-06-30`, `PF 2025-06-30`."""
    fiscal_year = _text(period.row["fiscal_year"])
    if prefix == "Q":
        return f"Q{_quarter_number(period)} {fiscal_year}"
    if prefix == "FY":
        return fiscal_year if fiscal_year.upper().startswith("FY") else f"FY{fiscal_year}"
    if period.end is None:
        return f"{prefix} {fiscal_year} (no end date)"
    return f"{prefix} {period.end.isoformat()}"


def _distinct(columns: Sequence[_Column]) -> tuple[_Column, ...]:
    """The columns with distinct categories. Columns that share one are told apart by their own
    periods' start dates (`LTM 2025-06-30 (from 2024-07-01)`) where each states a different one,
    else numbered in the order drawn; a period id is never part of a label a reader sees."""
    groups: dict[str, list[_Column]] = {}
    for column in columns:
        groups.setdefault(column.category, []).append(column)
    labels: dict[str, str] = {}
    for category, group in groups.items():
        starts = [None if c.start == "contains" else c.period.start for c in group]
        dated = None not in starts and len(set(starts)) == len(group)
        for place, (column, start) in enumerate(zip(group, starts, strict=True), 1):
            suffix = f" (from {start})" if dated else f" ({place})"
            labels[column.column_id] = category + (suffix if len(group) > 1 else "")
    return tuple(replace(column, category=labels[column.column_id]) for column in columns)


def _columns(
    periods: tuple[_Period, ...], metrics: dict[str, dict[str, Fact]]
) -> tuple[_Column, ...]:
    """The chart columns in the one period order, with distinct categories (`_distinct`): each
    column of a period that any T4.10 metric carries, and for a period none carries, its own
    first column (a stated gap)."""
    carried = {field for row in metrics.values() for field in row}
    columns: list[_Column] = []
    for period in periods:
        candidates = [
            _Column(period, f"{prefix}:{period.identity}", kind, _category(period, prefix), start)
            for prefix, kind, start in _COLUMN_KINDS[period.kind]
        ]
        found = [c for c in candidates if _basis(c.column_id) in carried]
        columns.extend(found or candidates[:1])
    columns.sort(key=lambda c: (structured_period_key(c.kind, c.period.end), c.column_id))
    return _distinct(columns)


def _stated_span(stated: str) -> tuple[date | None, str] | None:
    """(start, end text) of a fact's `<label>: <start> to <end>`, a `null` start as None; None
    when it states no span or a start that is not a date."""
    start, separator, end = stated.rsplit(": ", 1)[-1].partition(" to ")
    if not separator:
        return None
    if start == "null":
        return None, end
    try:
        return date.fromisoformat(start), end
    except ValueError:
        return None


def _start_agrees(start: date | None, column: _Column) -> bool:
    """Whether a start a fact states (None for `null`) is one its column can state (`_StartRule`).
    A start is dated only from an end, and is never after it; a period that states no start binds
    no date; otherwise the column's rule decides against the period's own start."""
    period = column.period
    if period.end is None:
        return start is None
    if start is not None and start > period.end:
        return False
    if period.start is None:
        return True
    own = date.fromisoformat(period.start)
    if column.start == "contains":
        return start is None or start <= own
    return start == own or (start is None and column.start == "own_or_unbuilt")


def _states_dates(stated: str | None, column: _Column, *, trailing: bool) -> bool:
    """Whether a chart fact states its column's period: a span ending at the period's end whose
    start the column can state (`_start_agrees`). A quarter's leverage and coverage (`trailing`)
    state the twelve months ending it instead (S13 C01)."""
    if stated is None:
        return False
    period = column.period
    end = "null" if period.end is None else period.end.isoformat()
    span = _stated_span(stated)
    if span is not None and span[1] == end and _start_agrees(span[0], column):
        return True
    return trailing and period.end is not None and states_trailing_period(stated, end)


def _strip_figure(
    spec: tuple[str, str, tuple[str, ...]],
    metrics: dict[str, dict[str, Fact]],
    columns: tuple[_Column, ...],
) -> FinancialFigureSeries:
    """One strip figure: a point per (column, series) fact, column by column so the categories
    are first seen in period order; a series with no fact at a column is a stated gap."""
    fig_id, title, series = spec
    money = fig_id in _MONEY_FIGURES
    for key in series:
        if key not in metrics:
            raise ValueError(f"Missing chart metric implementation: {key}")
    points: list[FinancialSeriesPoint] = []
    gaps: list[FinancialSeriesGap] = []
    for column in columns:
        field = _basis(column.column_id)
        period_companions = tuple(column.period.row[k].fact_id for k in _PERIOD_FIELDS)
        for key in series:
            fact = metrics[key].get(field)
            if fact is None:
                gaps.append(FinancialSeriesGap(key, column.category))
                continue
            _numeric(fact, money)
            if not _states_dates(
                fact.period, column, trailing=not money and column.kind == "QUARTER"
            ):
                raise ValueError("Chart fact does not match its period dates")
            companions = (metrics[key]["field_1"].fact_id, *period_companions)
            points.append(FinancialSeriesPoint(key, column.category, fact.fact_id, companions))
    return FinancialFigureSeries(
        fig_id,
        title,
        "grouped" if fig_id == "S.5" else "line",
        "amount" if money else "multiple",
        "US$m" if money else "x",
        series,
        tuple(points),
        None if points else _NO_FACTS,
        tuple(gaps),
    )


def _strip_figures(
    module: ModuleView, periods: tuple[_Period, ...]
) -> tuple[FinancialFigureSeries, ...]:
    _check_quarters(periods)
    metrics = _kpi_metrics(module)
    columns = _columns(periods, metrics)
    return tuple(_strip_figure(spec, metrics, columns) for spec in _SERIES)


_FACILITY_FIELDS = (
    "facility_id",
    "facility_name",
    "period_id",
    "facility_type",
    "principal",
    "currency",
    "maturity_date",
    "annual_amortisation",
    "lease_classification",
)


def _facility_rows(
    rows: tuple[dict[str, Fact], ...],
    period_ids: set[str] | frozenset[str],
    unplotted: frozenset[str],
) -> dict[tuple[str, str], dict[str, Fact]]:
    """The T4.18 rows by (facility, period). Every row must be complete and dated at a T4.14
    period; a row dated at a YTD, LTM or PF period (`unplotted`) is checked and then left out:
    those are not snapshot periods."""
    indexed: dict[tuple[str, str], dict[str, Fact]] = {}
    for row in rows:
        if not frozenset(_FACILITY_FIELDS) <= row.keys():
            raise ValueError("Incomplete facility chart coordinates")
        fid, pid = _text(row["facility_id"]), _text(row["period_id"])
        if pid not in period_ids or any(f.period != pid for f in row.values()):
            raise ValueError("Foreign facility period")
        if pid in unplotted:
            continue
        if (fid, pid) in indexed:
            raise ValueError("Duplicate facility snapshot identity")
        indexed[fid, pid] = row
    return indexed


def _check_aliases(
    fid: str,
    row: dict[str, Fact],
    current: tuple[_Period, ...],
    indexed: dict[tuple[str, str], dict[str, Fact]],
) -> None:
    """FY/Q4 are aliases only when the facility identity AND its terms agree."""
    for alias in current:
        other = indexed.get((fid, alias.identity))
        # The selected quarter's snapshot is complete; an alias without this
        # facility's row has nothing to compare, and is not plotted.
        if other is None or other is row:
            continue
        for key in _FACILITY_FIELDS:
            if key == "period_id":
                continue
            a, b = row[key], other[key]
            if (a.amount, a.text, a.status, a.unit, a.currency, a.scale, a.basis) != (
                b.amount,
                b.text,
                b.status,
                b.unit,
                b.currency,
                b.scale,
                b.basis,
            ):
                raise ValueError("Conflicting same-date facility snapshot aliases")


def _maturity_points(
    indexed: dict[tuple[str, str], dict[str, Fact]], period: _Period, current: tuple[_Period, ...]
) -> tuple[tuple[FinancialSeriesPoint, ...], str]:
    """The snapshot's points in ascending maturity date (ties by facility id), so the X categories
    are first seen in date order; or no points and the reason a maturity is unavailable."""
    dated: list[tuple[date, str, FinancialSeriesPoint]] = []
    for fid in sorted({fid for fid, _ in indexed}):
        row = indexed[fid, period.identity]
        _check_aliases(fid, row, current, indexed)
        if _text(row["currency"]) != "USD" or _text(row["lease_classification"]) != "NOT_LEASE":
            raise ValueError("Unsupported facility currency or lease scope")
        _numeric(row["principal"], True)
        if row["maturity_date"].status != "known":
            return (), f"Contractual maturity unavailable: {row['maturity_date'].fact_id}"
        maturity = date.fromisoformat(_text(row["maturity_date"]))
        label = f"{_text(row['facility_name'])} ({fid})"
        companions = tuple(row[k].fact_id for k in _FACILITY_FIELDS if k != "principal") + tuple(
            period.row[k].fact_id for k in _PERIOD_FIELDS
        )
        point = FinancialSeriesPoint(
            label, maturity.isoformat(), row["principal"].fact_id, companions
        )
        dated.append((maturity, fid, point))
    return tuple(point for _, _, point in sorted(dated, key=lambda entry: entry[:2])), ""


def _maturity_figure(module: ModuleView, periods: tuple[_Period, ...]) -> FinancialFigureSeries:
    rows = _rows(module, "T4.18")
    title = "Maturity wall"
    reason = "No complete current facility snapshot is supplied."
    points: tuple[FinancialSeriesPoint, ...] = ()
    snapshots = tuple(p for p in periods if p.kind in _SNAPSHOT_KINDS and p.end is not None)
    if snapshots:
        latest = max(p.end for p in snapshots if p.end is not None)
        current = tuple(p for p in snapshots if p.end == latest)
        # An explicit reported quarter wins over its FY alias, never by value or label.
        selected = tuple(p for p in current if p.kind == "QUARTER") or current
        if len(selected) != 1:
            raise ValueError("Ambiguous current facility snapshot period")
        period = selected[0]
        title = f"Maturity wall — principal at {latest.isoformat()} (not a forecast)"
        unplotted = frozenset(p.identity for p in periods if p.kind not in _SNAPSHOT_KINDS)
        indexed = _facility_rows(rows, {p.identity for p in periods}, unplotted)
        population = {fid for fid, _ in indexed}
        if population and {fid for fid, pid in indexed if pid == period.identity} == population:
            points, reason = _maturity_points(indexed, period, current)
    return FinancialFigureSeries(
        "S.4",
        title,
        "grouped",
        "amount",
        "US$m",
        tuple(point.series for point in points),
        points,
        reason or None,
    )


_SCOPE_FIELDS = ("currency", "unit", "accounting_basis", "entity_perimeter")
_SUPPORTED_SCOPE = ("USD", "MILLIONS", "IFRS", "consolidated group")
_SCOPE_REASON = (
    "Charts support USD millions on an IFRS consolidated group basis; this register states "
    "another currency, unit, accounting basis or perimeter; nothing was converted."
)


def _states_other_scope(module: ModuleView) -> bool:
    """Whether a T4.14 period states a known currency, unit, basis and perimeter that are not the
    supported scope. An incomplete or unresolved identity is left to `_periods`, which raises."""
    for row in _rows(module, "T4.14"):
        facts = [row.get(key) for key in _SCOPE_FIELDS]
        stated = tuple(f.text for f in facts if f is not None and f.status == "known")
        if len(stated) == len(_SCOPE_FIELDS) and None not in stated and stated != _SUPPORTED_SCOPE:
            return True
    return False


def _unsupported_scope_figures() -> tuple[FinancialFigureSeries, ...]:
    """S.1 to S.5 with no points, each carrying the unsupported-scope reason."""
    kinds: dict[str, Literal["line", "grouped"]] = {"S.4": "grouped", "S.5": "grouped"}
    titles = {fig_id: title for fig_id, title, _ in _SERIES} | {"S.4": "Maturity wall"}
    return tuple(
        FinancialFigureSeries(
            fig_id,
            titles[fig_id],
            kinds.get(fig_id, "line"),
            "multiple" if fig_id in {"S.1", "S.2"} else "amount",
            "x" if fig_id in {"S.1", "S.2"} else "US$m",
            (),
            (),
            _SCOPE_REASON,
        )
        for fig_id in ("S.1", "S.2", "S.3", "S.4", "S.5")
    )


def cp1_chart_series(module: ModuleView) -> tuple[FinancialFigureSeries, ...]:
    """Project settled CP1 facts; inactive/foreign modules have no numeric series.

    Every T4.14 period that carries a T4.10 fact is a strip-chart point, in the one period
    order; a series with no fact at a period is a stated gap (`gaps`), and a figure no period
    carries a fact for, or without current facility/maturity evidence, is an explicit
    unsupported figure. A missing metric row and inconsistent accepted identities fail closed
    instead of becoming source gaps.
    A complete selected facility register is an upstream validation prerequisite;
    this projection can detect missing historical identities at the current date,
    but cannot establish completeness for an issuer outside the qualified case.
    """
    if module.module_id != "CP-1" or module.status not in {"accepted", "restricted"}:
        return ()
    if not module.artifact_sha256:
        raise ValueError("Settled CP1 chart facts require an artifact identity")
    if len({f.fact_id for f in module.facts}) != len(module.facts):
        raise ValueError("Duplicate chart fact identity")
    if _states_other_scope(module):
        return _unsupported_scope_figures()
    periods = _periods(module)
    *strip, period_figure = _strip_figures(module, periods)
    return (*strip, _maturity_figure(module, periods), period_figure)
