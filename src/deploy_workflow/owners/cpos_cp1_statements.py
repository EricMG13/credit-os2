"""The statements of CP-1's Findings and the money unit they state.

The pure reading `cpos_cp1_check` and `cpos_forecast` share, below both: the table reader
(`## Findings` outside code fences), the fixed statement rows and `money_unit`, the one currency
of the statements' Unit cells (docs/rulings/2026-11-16-reporting-currency-from-sources.md).
Imports nothing from the workflow."""

import re
from collections import Counter
from dataclasses import dataclass

_UNIT = re.compile(r"[A-Z]{3} (millions|thousands)", re.ASCII)
_SEPARATOR = re.compile(r"\s*:?-+:?\s*")


@dataclass(frozen=True)
class StatementSpec:
    heading: str
    fixed: tuple[str, ...]
    optional: tuple[str, ...] = ()


REPORTED = "EBITDA (Reported)"
ADJUSTED = "EBITDA (Adjusted)"
INTEREST = "Cash Interest Paid"
STATEMENTS = (
    StatementSpec("T4.4 Income statement", (REPORTED,), (ADJUSTED,)),
    StatementSpec(
        "T4.5 Cash flow statement",
        (
            "Net Cash from Operating Activities",
            "Net Cash from Investing Activities",
            "Net Cash from Financing Activities",
            "Net Cash Change",
            "Opening Cash",
            "Closing Cash",
            INTEREST,
        ),
        ("FX Effect on Cash",),
    ),
    StatementSpec(
        "T4.6 Balance sheet",
        ("Total Assets", "Total Liabilities", "Total Equity", "Total Debt", "Cash & Equivalents"),
        ("Temporary Equity",),
    ),
)
STATEMENT_TAIL = ["Unit", "Basis", "Source"]


def _findings(text: str) -> list[str]:
    """The lines of `## Findings` outside code fences: the only place a table is read."""
    kept: list[str] = []
    inside, fence = False, None
    for line in text.splitlines():
        marker = line.lstrip()[:3]
        if marker in ("```", "~~~"):
            fence = None if fence == marker else (fence or marker)
        elif fence is None and line.startswith("## "):
            inside = line.rstrip() == "## Findings"
        elif fence is None and inside:
            kept.append(line)
    return kept


def _cells(line: str) -> list[str]:
    inner = line.strip()[1:]
    if inner.endswith("|") and not inner.endswith("\\|"):
        inner = inner[:-1]
    return [c.replace("\\|", "|").strip() for c in re.split(r"(?<!\\)\|", inner)]


def _table(lines: list[str], heading: str) -> list[list[str]] | None:
    """The first table under `### heading` as rows of cells (header first, separator dropped);
    None when the heading is absent, an empty list when it holds no table."""
    try:
        start = lines.index(f"### {heading}")
    except ValueError:
        return None
    rows: list[list[str]] = []
    for line in lines[start + 1 :]:
        if line.startswith("#") or (rows and not line.startswith("|")):
            break
        if line.startswith("|"):
            rows.append(_cells(line))
    return _unseparated(rows)


def _unseparated(rows: list[list[str]]) -> list[list[str]]:
    if len(rows) > 1 and all(_SEPARATOR.fullmatch(c) for c in rows[1]):
        del rows[1]
    return rows


@dataclass(frozen=True)
class Statement:
    spec: StatementSpec
    periods: list[str]
    rows: dict[str, list[str]]  # label -> cells (first cell the label)
    stated_twice: tuple[str, ...]
    wrong_width: tuple[str, ...]

    def column(self, year: str) -> int | None:
        """The column headed `year` (`FY2024`), the statement column its Period-table row names."""
        return self.periods.index(year) if year in self.periods else None

    def cell(self, label: str, at: int) -> str | None:
        row = self.rows.get(label)
        return row[at + 1] if row else None

    def unit(self, label: str) -> str | None:
        row = self.rows.get(label)
        return row[-3] if row else None

    def per(self, label: str) -> int | None:
        """How many of the row's units make one of the money tables' (1 for millions, 1,000 for
        thousands); None when the Unit cell is neither (refused where it is read)."""
        found = _UNIT.fullmatch(self.unit(label) or "")
        return None if found is None else 1000 if found[1] == "thousands" else 1


def _statement(lines: list[str], spec: StatementSpec) -> Statement | None:
    rows = _table(lines, spec.heading)
    if not rows or len(rows[0]) < 5 or rows[0][0] != "Line item" or rows[0][-3:] != STATEMENT_TAIL:
        return None
    header, body = rows[0], rows[1:]
    good = [row for row in body if len(row) == len(header)]
    counts = Counter(row[0] for row in good)
    return Statement(
        spec,
        header[1:-3],
        {row[0]: row for row in reversed(good)},
        tuple(sorted(n for n in counts if counts[n] > 1 and n in (*spec.fixed, *spec.optional))),
        tuple(row[0] for row in body if len(row) != len(header)),
    )


def _currencies(
    statements: list[Statement | None], optional: bool = False
) -> list[tuple[str, str, str]]:
    """(table, row, currency code) of each fixed row (with `optional`, the optional rows after
    them, table by table) whose Unit cell is readable, in order."""
    return [
        (found.spec.heading, label, unit[:3])
        for found in statements
        if found
        for label in (*found.spec.fixed, *(found.spec.optional if optional else ()))
        if (unit := found.unit(label)) and _UNIT.fullmatch(unit)
    ]


def _money_of(code: str) -> str:
    return "US$m" if code == "USD" else f"{code}m"


def money_unit(text: str) -> str | None:
    """The money unit of CP-1's tables: `US$m` for USD statements, else the statements' currency
    code and `m` (`GBPm`), in millions even where a statement prints thousands. The single
    currency of the fixed rows' Unit cells; None when there is none or more than one."""
    lines = _findings(text)
    codes = {c for _, _, c in _currencies([_statement(lines, spec) for spec in STATEMENTS])}
    return _money_of(next(iter(codes))) if len(codes) == 1 else None
