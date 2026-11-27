"""Source-native chart coordinates from a selected settled CP1 register.

This projection selects facts, never calculates financial values or display text.
Its strip charts plot every T4.14 period that carries a T4.10 fact (FY, QUARTER, YTD, LTM, PF)
in the one period order (`period_order`, docs/superpowers/specs/2026-11-25-chart-periods.md);
its maturity wall reads a complete current facility snapshot (every T4.18 row at a period ending
on the latest date, each facility the debt total sums present; it plots those facilities and
states that leases are left out). Bounded support: USD millions,
IFRS consolidated group. Authentication belongs to the unchanged envelope/publication
boundary; a ModuleView alone is not that proof.
"""

from __future__ import annotations

import hashlib
import logging
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass, replace
from datetime import date
from decimal import Decimal
from itertools import pairwise
from typing import Literal

from deploy_vii.contracts import Fact, ModuleView
from deploy_vii.model.dates import fiscal_year_number
from deploy_vii.period_order import structured_period_key
from deploy_vii.trailing_period import states_trailing_period

LOGGER = logging.getLogger(__name__)


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
    # Reader text the chart's table twin states beside plotted points (never a reason: a figure
    # with points has none).
    note: str | None = None


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
# The period types whose latest end date is the facility snapshot (T4.18) date.
_SNAPSHOT_KINDS = frozenset({"QUARTER", "FY", "PERIOD_END"})
# At one date each facility field is read from the first of these kinds that states it, then
# from any other kind (YTD, LTM, PF) ending on that date.
_SNAPSHOT_PRIORITY = ("QUARTER", "FY", "PERIOD_END")
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
    """A checked T4.14 row. A period whose end date is not stated (any type; the contract allows
    it with a limitation) is kept undated, never dropped: it sorts last and is no snapshot."""
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
    dated = end.status == "known"
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
    """The stated quarter without its `Q`, whichever the case of the letter."""
    return _text(period.row["fiscal_quarter"]).upper().removeprefix("Q")


def _check_quarters(periods: tuple[_Period, ...]) -> None:
    """Contradictory QUARTER identities raise: a quarter number outside 1 to 4, (fiscal year,
    quarter) labels that repeat or do not increase with the dates, a stated start after its end,
    or a stated start inside the quarter before. Any number of quarters, of any fiscal years, is
    plotted; a quarter whose start the register does not state is checked by its labels alone, and
    a quarter with no end date has no span: only its number is checked."""
    quarters = [p for p in periods if p.kind == "QUARTER"]
    if any(_quarter_number(p) not in {"1", "2", "3", "4"} for p in quarters):
        raise ValueError("Ambiguous QUARTER identities")
    dated = [p for p in quarters if p.end is not None]
    years = [fiscal_year_number(_text(p.row["fiscal_year"])) for p in dated]
    if None in years:
        raise ValueError("Ambiguous QUARTER identities")
    labels = [(year, _quarter_number(p)) for year, p in zip(years, dated, strict=True)]
    if any(a >= b for a, b in pairwise(labels)):
        raise ValueError("Ambiguous QUARTER identities")
    ends = [p.end for p in dated if p.end is not None]
    starts = [None if p.start is None else date.fromisoformat(p.start) for p in dated]
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


def _undated_order(period: _Period) -> tuple[int, int]:
    """(0, 0) for a dated period; an undated one by its own fiscal year and stated fiscal quarter
    (a QUARTER, YTD or LTM), else after its year's quarters (slot 5: an FY, or no quarter stated).
    Undated periods of one class share one structured key."""
    if period.end is not None:
        return 0, 0
    year = fiscal_year_number(_text(period.row["fiscal_year"]))
    if year is None:
        raise ValueError(f"Unresolved chart identity: {period.row['fiscal_year'].fact_id}")
    states_quarter = period.kind == "QUARTER" or (
        period.kind != "FY" and period.row["fiscal_quarter"].status == "known"
    )
    return year, int(_quarter_number(period)) if states_quarter else 5


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
    columns.sort(
        key=lambda c: (
            structured_period_key(c.kind, c.period.end),
            _undated_order(c.period),
            c.column_id,
        ),
    )
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
    period; a row at an undated period (`unplotted`) is checked and then left out: it is never
    a snapshot row."""
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


def _terms(fact: Fact) -> tuple[object, ...]:
    return (fact.amount, fact.text, fact.status, fact.unit, fact.currency, fact.scale, fact.basis)


_LEASES = frozenset({"FINANCE_LEASE", "OPERATING_LEASE"})


def _in_debt(row: dict[str, Fact]) -> bool:
    """Whether `financial_reconciliation._debt` sums the facility: every facility but a lease of
    either class, and a DEBT ADJUSTMENT however it is classified."""
    return (
        _text(row["facility_type"]) == "DEBT ADJUSTMENT"
        or _text(row["lease_classification"]) not in _LEASES
    )


def _snapshot_row(
    fid: str,
    current: tuple[_Period, ...],
    indexed: dict[tuple[str, str], dict[str, Fact]],
) -> tuple[dict[str, Fact], tuple[_Period, ...]] | None:
    """One facility's snapshot at the latest date, read across its aliases (`current`, in
    snapshot priority order): each field from the first alias that states it (status not
    `missing`), else the first alias's unstated fact. With the periods that supplied a field;
    or None where two aliases state one field with different values. An unstated value never
    conflicts with a stated one."""
    rows = [(p, indexed[fid, p.identity]) for p in current if (fid, p.identity) in indexed]
    merged: dict[str, Fact] = {"period_id": rows[0][1]["period_id"]}
    for key in _FACILITY_FIELDS:
        if key == "period_id":
            continue
        stated = [row[key] for _, row in rows if row[key].status != "missing"]
        if len({_terms(fact) for fact in stated}) > 1:
            return None
        merged[key] = stated[0] if stated else rows[0][1][key]
    sources = tuple(p for p, row in rows if any(row[k] is merged[k] for k in _FACILITY_FIELDS))
    return merged, sources


_MATURITY_LEASE_STATUS_REASON = (
    "The maturity wall supports USD facilities stated not to be leases; this snapshot "
    "does not state whether a facility is a lease; nothing was converted."
)
_MATURITY_ALIAS_REASON = (
    "The maturity wall reads one facility snapshot; two facility rows for one facility at this "
    "date disagree in its terms; nothing was plotted."
)
_MATURITY_SCOPE_REASON = (
    "The maturity wall supports USD facilities; this snapshot states another currency; "
    "nothing was converted."
)
_MATURITY_LEASES_ONLY_REASON = (
    "CP-1 states only leases at the latest date; the maturity wall shows debt facilities."
)
_MATURITY_LEASES_NOTE = (
    "Leases are left out of the maturity wall, so it does not sum to CP-1's total debt."
)


def _maturity_unavailable(row: dict[str, Fact]) -> str:
    """The reader reason for a facility without a known maturity: its stated name and the
    limitation its maturity fact states; no fact, row or table identity (those are Evidence)."""
    limitation = row["maturity_date"].limitation
    name = _text(row["facility_name"])
    return f"Contractual maturity unavailable for {name}" + (
        f": {limitation}" if limitation else "."
    )


def _maturity_points(
    indexed: dict[tuple[str, str], dict[str, Fact]],
    current: tuple[_Period, ...],
    population: tuple[str, ...],
) -> tuple[tuple[FinancialSeriesPoint, ...], str, bool]:
    """The snapshot's debt facilities as points in ascending maturity date (ties by facility id),
    so the X categories are first seen in date order; or no points and the reason a maturity is
    unavailable. A lease the debt total leaves out (`_in_debt`) is not plotted; the last item
    says whether the snapshot holds one."""
    merged: list[tuple[str, dict[str, Fact], tuple[_Period, ...]]] = []
    for fid in population:
        snapshot = _snapshot_row(fid, current, indexed)
        if snapshot is None:
            return (), _MATURITY_ALIAS_REASON, False
        merged.append((fid, *snapshot))
    plotted = [entry for entry in merged if _in_debt(entry[1])]
    left_out = len(plotted) < len(merged)
    if not plotted:
        return (), _MATURITY_LEASES_ONLY_REASON, left_out
    names = Counter(_text(row["facility_name"]) for _, row, _ in plotted)
    placed: Counter[str] = Counter()
    dated: list[tuple[date, str, FinancialSeriesPoint]] = []
    for fid, row, sources in plotted:
        if _text(row["currency"]) != "USD":
            return (), _MATURITY_SCOPE_REASON, left_out
        if _text(row["lease_classification"]) == "NOT_STATED":
            return (), _MATURITY_LEASE_STATUS_REASON, left_out
        _numeric(row["principal"], True)
        if row["maturity_date"].status != "known":
            return (), _maturity_unavailable(row), left_out
        maturity = date.fromisoformat(_text(row["maturity_date"]))
        # The facility's name, numbered (1), (2) in facility-id order only where names repeat:
        # a facility id is never part of a label a reader sees.
        name = _text(row["facility_name"])
        placed[name] += 1
        label = f"{name} ({placed[name]})" if names[name] > 1 else name
        companions = tuple(row[k].fact_id for k in _FACILITY_FIELDS if k != "principal") + tuple(
            period.row[k].fact_id for period in sources for k in _PERIOD_FIELDS
        )
        point = FinancialSeriesPoint(
            label, maturity.isoformat(), row["principal"].fact_id, companions
        )
        dated.append((maturity, fid, point))
    ordered = tuple(point for _, _, point in sorted(dated, key=lambda entry: entry[:2]))
    return ordered, "", left_out


def _snapshot_rank(kind: str) -> int:
    return _SNAPSHOT_PRIORITY.index(kind) if kind in _SNAPSHOT_PRIORITY else len(_SNAPSHOT_PRIORITY)


def _maturity_figure(module: ModuleView, periods: tuple[_Period, ...]) -> FinancialFigureSeries:
    rows = _rows(module, "T4.18")
    title = "Maturity wall"
    reason = "No complete current facility snapshot is supplied."
    points: tuple[FinancialSeriesPoint, ...] = ()
    note: str | None = None
    snapshots = tuple(p for p in periods if p.kind in _SNAPSHOT_KINDS and p.end is not None)
    if snapshots:
        latest = max(p.end for p in snapshots if p.end is not None)
        # Every reported period ending on the latest date is one snapshot (its aliases), read
        # in priority order: a reported quarter, then its FY, then a PERIOD_END, then any other
        # kind; by period id within a kind; never by value or label. A pro forma period is no
        # alias of the reported snapshot (`financial_reconciliation._debt`).
        current = tuple(
            sorted(
                (p for p in periods if p.end == latest and p.kind != "PF"),
                key=lambda p: (_snapshot_rank(p.kind), p.identity),
            )
        )
        title = f"Maturity wall — principal at {latest.isoformat()} (not a forecast)"
        unplotted = frozenset(p.identity for p in periods if p.end is None)
        indexed = _facility_rows(rows, {p.identity for p in periods}, unplotted)
        # The snapshot is every facility with a row at a reported period of the latest date. It is
        # complete when each facility the debt total sums (not a lease, or a DEBT ADJUSTMENT)
        # with a row at any period, dated or not, is in it; a facility whose rows all sit in
        # same-date pro forma periods belongs to those scenarios and is not required.
        at_date = {p.identity for p in current}
        same_date_pro_forma = {p.identity for p in periods if p.end == latest and p.kind == "PF"}
        present = {fid for fid, pid in indexed if pid in at_date}
        required = {
            _text(row["facility_id"])
            for row in rows
            if _in_debt(row) and _text(row["period_id"]) not in same_date_pro_forma
        }
        if present and required <= present:
            points, reason, left_out = _maturity_points(indexed, current, tuple(sorted(present)))
            note = _MATURITY_LEASES_NOTE if left_out and points else None
    return FinancialFigureSeries(
        "S.4",
        title,
        "grouped",
        "amount",
        "US$m",
        tuple(point.series for point in points),
        points,
        reason or None,
        note=note,
    )


_MATURITY_FAILED_REASON = "The maturity wall cannot be drawn from CP-1's facility rows."


def _maturity_or_empty(module: ModuleView, periods: tuple[_Period, ...]) -> FinancialFigureSeries:
    """S.4, or an empty S.4 with a fixed reader reason when CP-1's facility rows cannot be read
    (every such failure is a ValueError from `_maturity_figure`). A documented fail-open: the other
    four figures do not read those rows, so they are still drawn; the error text carries fact ids
    and goes to the log, never to a page."""
    try:
        return _maturity_figure(module, periods)
    except ValueError as error:
        LOGGER.warning("CP-1 maturity wall not drawn: %s", error)
        return FinancialFigureSeries(
            "S.4", "Maturity wall", "grouped", "amount", "US$m", (), (), _MATURITY_FAILED_REASON
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
    return (*strip, _maturity_or_empty(module, periods), period_figure)
