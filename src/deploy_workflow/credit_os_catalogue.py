"""The Credit OS catalogue built from the runs the Issuer Library lists. Reads files only.

Credit OS's library screens read one JSON (``apps/issuer-library/credit_os/store.py``):
``{"real": [run, ...], "sources": {...}, "issues": [...]}``.
A run here is a record ``library_index`` admitted, so every handoff is read through the delivery
copy whose path and sha256 it verified, never from a folder it left out. A value the run does not
state is left empty or absent, never filled in.
"""

from __future__ import annotations

import os
import re
from collections.abc import Iterable, Mapping
from datetime import UTC, datetime
from decimal import Decimal, localcontext
from pathlib import Path, PurePath
from typing import Any
from urllib.parse import quote

from deploy_vii.period_order import PeriodClass, parse_period, period_key
from deploy_workflow.context import CONTEXT_SOURCE_ID, ContextRefused, RunContext, load_context
from deploy_workflow.library_index import (
    Library,
    Refused,
    delivery_folder,
    json_object,
    read_inside,
    read_pinned,
)

SEGMENT_SAFE = "$&+:=@"  # What url.PathEscape keeps in one path segment.
LISTED = {".md", ".txt", ".pdf", ".html", ".htm", ".json", ".csv", ".xlsx"}
RUN_FILE_LIMIT = 5000
BASIS = "Basis and limitation"
_NUMBER = re.compile(r"-?\d+(?:\.\d+)?")
_MONEY = re.compile(r"-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?")  # money may group thousands
_MONEY_KEYS = frozenset({"revenue", "adjusted_ebitda"})  # the only metrics read as money
_PERIOD = re.compile(r"^(q[1-4]|h[12]|fy)-\d{4}$")
_PERIOD_KINDS = {"f": "Annual", "h": "Half-year", "q": "Quarterly"}  # By first letter.
_NOT_SUPPLIED = "Not supplied"
# (chart table, metric key, value column) in the CP-1 handoff; the unit and basis columns are
# the table's own "Reporting unit" and "Basis and limitation".
_METRICS = (
    ("leverage", "leverage", "Total debt / EBITDA"),
    ("leverage", "net_leverage", "Net debt / EBITDA"),
    ("interest cover", "coverage", "EBITDA / cash interest"),
    ("liquidity", "cash", "Cash"),
    ("liquidity", "undrawn", "Undrawn committed facilities"),
    ("revenue and EBITDA", "revenue", "Revenue"),
    ("revenue and EBITDA", "adjusted_ebitda", "Adjusted EBITDA"),
)


def file_url(name: str) -> str:
    return "/files/" + "/".join(quote(part, safe=SEGMENT_SAFE) for part in name.split("/"))


def pinned_url(name: str, sha256: str) -> str:
    return f"{file_url(name)}?sha256={sha256}"


def pathway_title(pathway: str) -> str:
    from deploy_vii.report_view import pathways

    return next((item.title for item in pathways() if item.id == pathway), pathway)


def cells(line: str) -> list[str]:
    return [cell.strip() for cell in re.split(r"(?<!\\)\|", line.strip()[1:-1])]


def period_order(cell: str) -> tuple[int, ...] | None:
    """Sort key of a Period cell under the one ordering rule (`deploy_vii.period_order`): (class,
    year, month, day, span, PYTD-first), so fiscal years, interim dates, YTD, LTM, pro forma and
    forecast cells all order; None for a cell the rule cannot place (no year, an impossible date).
    The first element is the period class (`PeriodClass`), not the cell's written form."""
    return period_key(cell)


type RankedRow = tuple[tuple[int, ...], dict[str, str], int]

CHART_PREFIX = "Chart data: "


def chart_rows(lines: list[str], chart: str, prefix: str = CHART_PREFIX) -> list[RankedRow] | None:
    """Every row of ``### <prefix><chart>`` as (period key, {column: cell}, 1-based line), as
    written. None when the table is absent; ValueError when a Period cannot be placed by the
    ordering rule or two rows have one key (never a guess). Rows of different forms and classes
    (fiscal years, interim dates, LTM, pro forma, forecasts) order together."""
    try:
        start = lines.index(f"### {prefix}{chart}")
    except ValueError:
        return None
    table: list[int] = []
    for number in range(start + 1, len(lines)):
        if lines[number].startswith("|"):
            table.append(number)
        elif table or lines[number].startswith("#"):
            break
    if len(table) < 3:  # header, separator, at least one row
        return None
    header = cells(lines[table[0]])
    ranked: list[RankedRow] = []
    for number in table[2:]:
        values = cells(lines[number])
        key = period_order(dict(zip(header, values, strict=False)).get("Period", ""))
        if len(values) != len(header) or key is None:
            raise ValueError("a row has no period that can be ordered")
        ranked.append((key, dict(zip(header, values, strict=True)), number + 1))
    if len({key for key, _, _ in ranked}) != len(ranked):
        raise ValueError("two rows state one period")
    return ranked


def is_reported(key: tuple[int, ...]) -> bool:
    """Whether a `period_order` key is of the actual, YTD or LTM class: a reported period, not a
    pro forma one and not a forecast."""
    return key[0] <= PeriodClass.LTM


class MixedPeriodForms(ValueError):
    """The actual rows mix dated and fiscal-labelled periods: no latest reported row is chosen."""

    def __init__(self) -> None:
        super().__init__("the reported rows mix dated and fiscal-labelled periods")


def carries_date(cell: str) -> bool | None:
    """Whether an actual-class period carries its own date (`2025-06-30`, `FY2024 / 2024-09-30`)
    or is fiscal-labelled (`FY2025`, `Q3 2025`, `Jun 2025`); None for a cell of another class or
    one the rule cannot place."""
    parsed = parse_period(cell)
    if parsed is None or parsed.period_class is not PeriodClass.ACTUAL:
        return None
    return parsed.span == "date"


def mixes_dated_and_fiscal(periods: Iterable[str]) -> bool:
    """Whether the actual-class periods among these mix dated and fiscal-labelled ones. Which of
    `FY2025` and `2025-06-30` is later depends on the year end, so no latest reported figure is
    chosen from such a set; charts still draw both, in rule order."""
    return {carries_date(cell) for cell in periods} >= {True, False}


def latest_reported(ranked: list[RankedRow]) -> RankedRow:
    """The latest reported row: the last in rule order among the actual, YTD and LTM classes. A
    pro forma or forecast row is never the latest reported figure; ValueError when every row is
    one, or when the actual rows mix dated and fiscal-labelled periods (never a guess)."""
    reported = [item for item in ranked if is_reported(item[0])]
    if not reported:
        raise ValueError("no row is a reported period: each is pro forma or a forecast")
    if mixes_dated_and_fiscal(row.get("Period", "") for _, row, _ in ranked):
        raise MixedPeriodForms
    return max(reported, key=lambda item: item[0])


def chart_row(
    lines: list[str], chart: str, prefix: str = CHART_PREFIX
) -> tuple[dict[str, str], int] | None:
    """The latest reported row of ``### <prefix><chart>`` (``Chart data: <chart>``) as {column:
    cell}, with its 1-based line: the last in rule order among the actual, YTD and LTM rows,
    whatever the row order, never a pro forma or forecast row. None when the table is absent;
    ValueError when its periods cannot be ordered, none is a reported period, or the actual rows
    mix dated and fiscal-labelled periods (never a guess)."""
    ranked = chart_rows(lines, chart, prefix)
    if ranked is None:
        return None
    _, row, number = latest_reported(ranked)
    return row, number


_YEAR = re.compile(r"(?<!\d)\d{4}(?!\d)")


_LOCATOR = re.compile(
    r"\b(?:pages?|pp?|paras?|paragraphs?|sections?|notes?|lines?|slides?|exhibits?)\b\.?\s*"
    r"(?:\d+(?:[.,]\d+)*(?:\s*(?:[-\u2013/&,]|and(?=\s*\d)|to(?=\s*\d))\s*\d+(?:[.,]\d+)*)*)",
    re.IGNORECASE,
)


# A year after an instrument word names the instrument (`notes 2027`), not a place in a document:
# it is kept (as letters, so the digit and locator removal leave it) and so tells two debts apart.
_INSTRUMENT_YEAR = re.compile(
    r"\b(notes?|bonds?|loans?|facility|facilities|due|maturing|maturity)\s+((?:19|20)\d{2})\b"
)
_YEAR_LETTERS = str.maketrans("0123456789", "abcdefghij")


def definition_key(text: str | None) -> str | None:
    """A definition text compared: no page or locator references, no digits, no punctuation, lower
    case, one space between words. None stays None (no text)."""
    if text is None:
        return None
    kept = _INSTRUMENT_YEAR.sub(
        lambda m: f"{m[1]} {m[2].translate(_YEAR_LETTERS)}", text.casefold()
    )
    bare = _LOCATOR.sub(" ", kept)
    return " ".join(re.sub(r"[^\w\s]|_|\d", " ", bare).split())


def prior_metric(
    rows: list[dict[str, str]], row: dict[str, str], column: str, number: re.Pattern[str] = _NUMBER
) -> tuple[dict[str, str], str] | None:
    """The same column a year earlier and the exact change, or None.

    The prior row is the one row whose Period is ``row``'s with every 4-digit year lowered by one;
    its cell must be a quotable number, its Reporting unit the current row's and its Basis and
    limitation the same definition under ``definition_key`` (the cross-run rule)."""
    label = row.get("Period", "")
    years = _YEAR.findall(label)
    if not years or any(int(year) < 1 for year in years):
        return None
    earlier = _YEAR.sub(lambda year: f"{int(year[0]) - 1:04d}", label)
    found = [other for other in rows if other.get("Period") == earlier]
    if len(found) != 1:
        return None
    prior_value = found[0].get(column, "")
    unit = row.get("Reporting unit", "")
    if not (number.fullmatch(prior_value) and found[0].get("Reporting unit", "") == unit):
        return None
    if definition_key(row.get(BASIS)) != definition_key(found[0].get(BASIS)):
        return None
    return {"value": prior_value, "period": earlier}, _exact_change(row[column], prior_value)


def _exact_change(current: str, prior: str) -> str:
    """``current - prior`` with every digit kept; a zero change carries no sign."""
    with localcontext() as context:
        context.prec = len(current) + len(prior) + 2
        change = Decimal(current.replace(",", "")) - Decimal(prior.replace(",", ""))
    return format(abs(change) if change == 0 else change, "f")


def pinned_context(folder: Path, issues: list[str]) -> RunContext | None:
    """The context CP-OS pinned for the run, or None when there is none or it is not used.

    ``workflow.json`` names the context by hash (``sources["context"]``); its bytes are under
    ``inputs/<sha256>``. Bytes that fail the hash or the context rules give None and are recorded
    as an issue.
    """
    try:
        workflow = json_object(read_inside(folder, "workflow.json"), "workflow.json")
        sources = workflow.get("sources")
        pin = sources.get(CONTEXT_SOURCE_ID) if isinstance(sources, dict) else None
        if not isinstance(pin, dict):
            return None  # This run was launched without a context form; its fields stay empty.
        digest = pin.get("sha256")
        raw = read_pinned(folder, f"inputs/{digest}", digest)
        return load_context(raw)
    except (Refused, ContextRefused) as error:
        issues.append(f"{folder.name}: context not used ({error})")
        return None


def context_values(context: RunContext | None) -> dict[str, str]:
    """Ticker, sector, country and period of the run's context; empty without one."""
    if context is None:
        return {}
    found = {
        "ticker": context.identity.ticker,
        "sector": context.identity.sector,
        "country": context.identity.country,
        "current_period": context.run.current_period,
    }
    return {key: value.strip() for key, value in found.items() if value.strip()}


def entered_ratings(context: RunContext | None) -> list[dict[str, str]]:
    """The ratings the analyst entered, in the shape the library page reads (`label` is the rating
    symbol, `date` its as-of date); empty without a context."""
    if context is None:
        return []
    return [
        {
            "label": r.rating,
            "agency": r.agency,
            "scope": r.scope,
            "outlook": r.outlook,
            "date": r.as_of,
        }
        for r in context.ratings
    ]


def period_fields(context: dict[str, str]) -> tuple[str, str]:
    period = context.get("current_period", "")
    if not _PERIOD.match(period):
        return "", ""
    return period.upper(), _PERIOD_KINDS[period[0]]


def summary_fields(run: dict[str, Any]) -> tuple[str, list[str]]:
    """CP-2's bottom line, else the latest module's, with that module's main limitation. CP-8, the
    comparison, is never the lead."""
    modules = [m for m in run["modules"] if m["summary"] is not None and m["id"] != "CP-8"]
    chosen = next((m for m in modules if m["id"] == "CP-2"), modules[-1] if modules else None)
    if chosen is None:
        return "", []
    summary = chosen["summary"]
    return summary["bottom_line"], [summary["limitation"]]


def run_files(folder: Path, name: str, issues: list[str]) -> list[dict[str, str]]:
    """The run's retained files in name order; links and hidden entries are not listed."""
    found: list[dict[str, str]] = []
    for base, directories, files in os.walk(folder):
        directories[:] = sorted(d for d in directories if not d.startswith("."))
        inside = Path(base).relative_to(folder).as_posix()
        prefix = "" if inside == "." else f"{inside}/"
        href = file_url(f"runs/{name}/{prefix}")  # ends with "/": the entry is the last segment
        for entry in sorted(files):
            if entry.startswith(".") or PurePath(entry).suffix.lower() not in LISTED:
                continue
            if os.path.islink(os.path.join(base, entry)):
                continue
            found.append({"name": prefix + entry, "href": href + quote(entry, safe=SEGMENT_SAFE)})
    if len(found) > RUN_FILE_LIMIT:
        issues.append(f"{name}: run file limit ({RUN_FILE_LIMIT}) reached; files not listed")
        return []
    return found


def twin_of(column: str) -> str:
    """The adjusted twin of a reported chart column (`Total debt / EBITDA` -> `Total debt /
    adjusted EBITDA`); the column itself when it has none."""
    from deploy_workflow.owners.cpos_cp1_check import ADJUSTED_TWIN

    return ADJUSTED_TWIN.get(column, column)


def handoff_metrics(
    name: str, pin: dict[str, str], text: str, sources: dict[str, Any], issues: list[str]
) -> dict[str, dict[str, Any]]:
    """Metrics quoted from the CP-1 chart tables' latest rows; a cell not supplied gives no key.
    A metric whose row a year earlier states the same column in the same unit also carries that
    ``prior`` and the exact ``change``."""
    lines = text.replace("\r\n", "\n").split("\n")
    metrics: dict[str, dict[str, Any]] = {}
    unordered: set[str] = set()
    for chart, key, column in _METRICS:
        try:
            ranked = chart_rows(lines, chart)
            latest = None if ranked is None else latest_reported(ranked)
        except ValueError as error:
            if chart not in unordered:
                unordered.add(chart)
                issues.append(f"{name}: CP-1 {chart} table has no metric ({error})")
            continue
        if ranked is None or latest is None:
            continue
        _, row, number = latest
        held = column if column in row or twin_of(column) not in row else twin_of(column)
        value = row.get(held, "")
        if value.startswith(_NOT_SUPPLIED):
            continue
        unit, basis, period = (
            row.get(c, "") for c in ("Reporting unit", "Basis and limitation", "Period")
        )
        pattern = _MONEY if key in _MONEY_KEYS else _NUMBER
        if not (pattern.fullmatch(value) and unit and basis and period):
            issues.append(f"{name}: CP-1 {chart} {column!r} is not a quotable metric; left out")
            continue
        source = f"{name}.cp1-{chart.replace(' ', '-')}"
        quote_text = lines[number - 1]
        sources[source] = {
            **pin,
            "line": number,
            "quote": quote_text,
            "href": pinned_url(pin["path"], pin["sha256"]),
        }
        metrics[key] = {
            "value": value,
            "unit": unit,
            "period": period,
            "basis": basis,
            "source": source,
            "provenance": "cited",
        }
        compared = prior_metric([r for _, r, _ in ranked], row, held, pattern)
        if compared is not None:
            metrics[key]["prior"], metrics[key]["change"] = compared
        if held != column:  # an adjusted name is stated, not implied
            metrics[key]["label"] = held
    return metrics


# The files `credit_os` reads for a model (CASHFLOW_FILES in `credit_os/cashflow.py`).
MODEL_FILES = ("forecast_exact.json", "calculation.json", "annual.md", "quarter.md")


def forecast_published(folder: Path, relative: str, files: Mapping[str, str]) -> bool:
    """Whether the verified delivery's receipt says it carries the Python-computed forecast."""
    receipt = json_object(read_inside(folder, f"{relative}/delivery.json"), "delivery.json")
    return receipt.get("cp_forecast_published") is True and set(MODEL_FILES) <= set(files)


NO_REPORT_PAGE = "this delivery has no report page; the library shows the run itself"


def model_artifact(
    report: dict[str, Any], delivered: str, files: Mapping[str, str]
) -> dict[str, Any]:
    """The Forecast artifact of a delivery, pinned to a file the delivery publishes.

    An earlier-format delivery shows it through its report page. A newer one has no report page, so
    the reader-facing published file (``model.html``, else ``annual.md``) is pinned instead. A
    caller reaches this only when ``forecast_published`` held, which requires ``annual.md``."""
    model = {**report, "kind": "model", "label": "Forecast"}
    if "report.html" in files:
        return {**model, "issue": "", "available": True}
    name = "model.html" if "model.html" in files else "annual.md"
    return {
        **model,
        "issue": "",
        "available": True,
        "href": pinned_url(f"{delivered}/{name}", files[name]),
    }


def delivery_fields(
    workspace: Path,
    run: dict[str, Any],
    sources: dict[str, Any],
    issues: list[str],
    verified: Mapping[str, Any] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, str]], str]:
    """The run's verified delivery as one artifact, the metrics its CP-1 handoff states, and the
    run's currency (the ISO code of CP-1's money unit; empty when CP-1 states none).

    ``verified`` is the delivery this build already verified (``Library.deliveries``), used as is
    and never changed; without it the delivery is verified here."""
    name = run["id"]
    folder = workspace / "runs" / name
    try:
        if verified is not None:
            relative, files, view = verified["folder"], verified["files"], verified["view"]
        else:
            report = run["report"]
            relative, files = (
                delivery_folder(folder, report["sha256"])
                if report is not None
                else delivery_folder(folder, run["delivery_sha256"], receipt_hash=True)
            )
            view = json_object(read_inside(folder, f"{relative}/view.json"), "view.json")
        published = forecast_published(folder, relative, files)
        cp1 = next((m for m in run["modules"] if m["id"] == "CP-1"), None)
        text = ""
        if cp1 is not None:
            raw = read_pinned(folder, f"{relative}/CP-1.md", cp1["sha256"])
            text = raw.decode("utf-8", errors="replace")
    except (Refused, OSError) as error:
        # A refusal's reason is run-relative; an OSError's text holds the absolute path, so only
        # its kind reaches the issue, which the library page and /connected/snapshot show.
        why = str(error) if isinstance(error, Refused) else type(error).__name__
        issues.append(f"{name}: delivery not catalogued ({why})")
        return [], {}, ""
    delivered = f"runs/{name}/{relative}"
    mode = view.get("mode")
    artifact = {
        "folder": delivered,
        "kind": "report",
        "label": relative.rsplit("/", 1)[-1],
        "state": mode if isinstance(mode, str) and mode else "candidate",
        "relationship": "direct",
        "issue": "" if "report.html" in files else NO_REPORT_PAGE,
        "available": "report.html" in files,
        "href": pinned_url(f"{delivered}/report.html", files["report.html"])
        if "report.html" in files
        else "",
    }
    metrics = {}
    if cp1 is not None:
        pin = {"path": f"{delivered}/CP-1.md", "sha256": cp1["sha256"]}
        metrics = handoff_metrics(name, pin, text, sources, issues)
    artifacts = [artifact]
    if published:
        artifacts.append(model_artifact(artifact, delivered, files))
    return artifacts, metrics, cp1_currency(text)


def cp1_currency(text: str) -> str:
    """The ISO code of the currency CP-1's statements are printed in, from CP-1's money unit
    (`US$m` is USD, `GBPm` is GBP); empty when CP-1 states no single currency. Never the context's
    `reporting_currency` (docs/rulings/2026-11-16-reporting-currency-from-sources.md)."""
    # Imported here: cpos_cp1_check imports this module (period_order), so a top-level import loops.
    from deploy_workflow.owners.cpos_cp1_check import money_unit

    unit = money_unit(text)
    if unit is None:
        return ""
    return "USD" if unit == "US$m" else unit.removesuffix("m")


def run_record(
    workspace: Path,
    run: dict[str, Any],
    sources: dict[str, Any],
    issues: list[str],
    verified: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    name = run["id"]
    pinned = pinned_context(workspace / "runs" / name, issues)
    context = context_values(pinned)
    period, period_kind = period_fields(context)
    summary, gaps = summary_fields(run)
    title = pathway_title(run["pathway"])
    artifacts, metrics, currency = delivery_fields(workspace, run, sources, issues, verified)
    return {
        "id": name,
        "issuer": context.get("ticker") or run["issuer_id"].upper(),
        "ticker": context.get("ticker"),
        "name": run["issuer_name"],
        "title": title,
        "workflow": title,
        "sector": context.get("sector", ""),
        "country": context.get("country", ""),
        "currency": currency,
        "date": run["as_of"],
        "period": period,
        "period_kind": period_kind,
        "summary": summary,
        "gaps": gaps,
        "metrics": metrics,
        "artifacts": artifacts,
        "files": run_files(workspace / "runs" / name, name, issues),
        "completion": None,
        "checkpoints": None,
        "ratings": entered_ratings(pinned),
        "classification": "",
        "classification_source": "",
        "private_side": False,
        "private_side_source": "",
        "facilities": [],
        "identity_source": "",
        "sector_source": "",
        "handoff": "",
        "handoff_href": "",
        "checklist": None,
    }


def catalogue(workspace: Path, library: Library) -> dict[str, Any]:
    """Every run ``library_index`` listed, in its order, as the JSON Credit OS reads."""
    sources: dict[str, Any] = {}
    issues: list[str] = []
    real = [
        run_record(workspace, run, sources, issues, library.deliveries.get(run["id"]))
        for run in library.runs
    ]
    return {
        "real": real,
        "illustrative": [],
        "sources": sources,
        "built_at": datetime.now(UTC).strftime("%d %b %Y, %H:%M:%S UTC"),
        "issues": issues,
        "live": False,
        "policy_locked": False,
    }
