"""CP-2's credit scorecard: the two registers it writes and how they are read.

Owner ruling R9 (2026-11-25, `docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md`;
level text: `docs/methodology/portfolio-recommendation.md` § 3):
CP-2 scores 17 factors from 1 (strongest) to 5 (weakest), each with a one-line basis, in `T2.13`,
and gives four assessment cells in `T2.14`. A factor with no evidence in the run is `Not scored`
and is never guessed. Nothing here computes an overall credit score.

Three outcomes are kept apart: a handoff with neither register (`parse_scorecard` returns None: it
was written before the registers existed), a register row left `Not scored` or `Not assessed` (a
level or view of None inside a `Scorecard`), and a malformed register (`ScorecardError`). A
register written where the issuer library's module page would not draw it is malformed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import cache

from deploy_workflow.method_scripts import (
    ROOT,
    _one_start_each,
    _register_start,
    _unfenced,
    register_table,
)

SCORECARD_ID = "T2.13"
SCORECARD_TITLE = "Credit scorecard"
SCORECARD_COLUMNS = ("Factor", "Level", "Basis")
ASSESSMENT_ID = "T2.14"
ASSESSMENT_TITLE = "Credit assessment"
ASSESSMENT_COLUMNS = ("Assessment", "View", "Basis")
FACTORS = (
    "Scale",
    "Market position",
    "Regulatory exposure",
    "Technology",
    "Barriers to entry",
    "Leverage",
    "Free cash flow",
    "Liquidity",
    "Rating trend",
    "Geographic diversification",
    "Product diversification",
    "Market share",
    "Customer concentration",
    "Market access",
    "Maturity profile",
    "Interest cover",
    "Financial policy",
)
LEVEL_NAMES = {1: "Excellent", 2: "Strong", 3: "Satisfactory", 4: "Weak", 5: "Poor"}
NOT_SCORED = "Not scored"
_THREE_WAY = ("Positive", "Neutral", "Negative")
ASSESSMENTS: dict[str, tuple[str, ...]] = {
    "Management": _THREE_WAY,
    "Sector Outlook": _THREE_WAY,
    "Sponsor Quality": _THREE_WAY,
    "Credit Direction": ("Improving", "Stable", "Deteriorating"),
}
# Not in the owner's ruling, which gives each cell three views only: added so that a cell with no
# evidence in the run (an issuer with no sponsor) is not guessed. Remove this one name, and its
# use in `_ASSESSMENT`, to make all four views compulsory.
NOT_ASSESSED = "Not assessed"
# The one source of the house Risk Rubric's level text (owner-approved methodology, 2026-11-25):
# this document and its `##` section holding the table `# | Factor | 1 Excellent | ... | 5 Poor`.
# `level_text` reads it; the text is never typed, copied or reworded here. Both packagers ship the
# file, and a test holds their lists to this path.
LEVEL_TEXT_SOURCE = (
    "docs/methodology/portfolio-recommendation.md",
    "3. The Risk Rubric: 17 factors",
)
_RUBRIC_HEADER = ["#", "Factor", *(f"{level} {name}" for level, name in LEVEL_NAMES.items())]
_RULE = re.compile(r":?-{3,}:?")
# A Basis that says nothing when it is one of these alone (case, emphasis and closing punctuation
# aside). `Not supplied: <reason>` says what is missing, so only an unscored row may give it.
_NO_BASIS = frozenset({"none", "n/a", "n.a", "tbd", "not stated", "not supplied"})
_NOT_SUPPLIED = "not supplied"
# A heading the module page takes for a register, whose table it holds in Evidence instead of
# drawing: `REGISTERS` of web/src/pages/connected/publishedReport.ts (a test holds the two equal).
_PAGE_REGISTERS = re.compile(
    "source assessment|confidence inputs|source context|period table|key located evidence|"
    "conflicts and duplicates|register|ledger",
    re.IGNORECASE,
)
_SECTION_START = re.compile(r"#{1,2} ")


@dataclass(frozen=True)
class FactorScore:
    """One factor's row; `level` None is a row written `Not scored`."""

    factor: str
    level: int | None
    basis: str


@dataclass(frozen=True)
class Assessment:
    """One assessment cell; `view` None is a row written `Not assessed`."""

    name: str
    view: str | None
    basis: str


@dataclass(frozen=True)
class Scorecard:
    """Both registers as written, the factors in the ruling's order."""

    factors: tuple[FactorScore, ...]
    assessments: tuple[Assessment, ...]


class ScorecardError(ValueError):
    """A handoff whose scorecard registers are malformed; `faults` says how, one sentence each."""

    def __init__(self, faults: tuple[str, ...]) -> None:
        super().__init__(" ".join(faults))
        self.faults = faults


@dataclass(frozen=True)
class _Register:
    """One register's shape: its id, columns, each row's allowed values and the null word."""

    ident: str
    title: str
    columns: tuple[str, str, str]
    rows: dict[str, tuple[str, ...]]
    unset: str

    @property
    def heading(self) -> str:
        return f"### {self.ident} - {self.title}"


_SCORECARD = _Register(
    SCORECARD_ID,
    SCORECARD_TITLE,
    SCORECARD_COLUMNS,
    dict.fromkeys(FACTORS, tuple(map(str, LEVEL_NAMES))),
    NOT_SCORED,
)
_ASSESSMENT = _Register(
    ASSESSMENT_ID, ASSESSMENT_TITLE, ASSESSMENT_COLUMNS, ASSESSMENTS, NOT_ASSESSED
)
# How the two registers are headed and where: one sentence for the instructions and the repair.
# `_misplaced` refuses what it rules out: the method's own appendix rule would nest the registers
# where the module page does not draw them.
PLACEMENT = (
    f"Head them exactly `{_SCORECARD.heading}` (columns `{' | '.join(SCORECARD_COLUMNS)}`, one "
    f"row per factor) and `{_ASSESSMENT.heading}` (columns `{' | '.join(ASSESSMENT_COLUMNS)}`, "
    "one row per assessment): each a `###` heading in `## Findings`, after `### Limitations`, "
    "never nested as a `####` heading under the Analytical appendix heading or any other "
    "heading, and headed by that heading alone (no `table-id` tag)."
)
_Rows = dict[str, tuple[str | None, str]]


def _name(cell: str) -> str:
    """A cell as compared: Markdown emphasis, case and spacing aside."""
    return " ".join(re.sub(r"[*_`]", "", cell).casefold().split())


def _basis(cell: str, *, evidence: bool) -> str:
    """The Basis as written, or "" for one that says nothing: no letter or digit, a placeholder
    word alone, or, on a row with a level or view (``evidence``), the transport's `Not supplied`."""
    said = _name(cell).rstrip(" .:;,!?")
    nothing = said in _NO_BASIS or not any(character.isalnum() for character in said)
    return "" if nothing or (evidence and said.startswith(_NOT_SUPPLIED)) else cell.strip()


def _starts(lines: list[str], ident: str) -> list[int]:
    """The lines a register starts at, as `register_table` finds them."""
    start = _register_start(ident)
    return _one_start_each(lines, [n for n, line in enumerate(lines) if start.match(line)])


def _misplaced(lines: list[str], register: _Register) -> list[str]:
    """Why the module page would not draw the register where it is written: the page draws the
    table of a `###` section directly under `## Findings` whose heading names no register.
    Nothing for a register that is absent or written twice (`register_table` says so)."""
    ident, found = register.ident, _starts(lines, register.ident)
    if len(found) != 1:
        return []
    line = lines[found[0]].strip()
    if not line.startswith("### "):
        return [f"{ident} must start at a `###` heading, `{register.heading}`, not at `{line}`."]
    above = next((a.strip() for a in reversed(lines[: found[0]]) if _SECTION_START.match(a)), None)
    if above != "## Findings":
        where = f"under `{above}`" if above else "under no `##` heading"
        return [f"{ident} must be in `## Findings`; it is {where}."]
    words = _PAGE_REGISTERS.search(line)
    if words:
        heading = f"`{register.heading}`, without `{words[0]}`"
        return [f"{ident}'s heading must be {heading}: it is `{line}`."]
    return []


def _read(text: str, register: _Register) -> tuple[_Rows, list[str]]:
    """The register's rows by their ruled name (value None when left unset) and its faults,
    those of its placement first."""
    ident, (_, value_name, _) = register.ident, register.columns
    faults = _misplaced(_unfenced(text), register)
    table = register_table(text, ident)
    if isinstance(table, str):
        return {}, [*faults, f"{table[0].upper()}{table[1:]}."]
    header, rows = table
    if [_name(h) for h in header] != [_name(c) for c in register.columns]:
        columns = " | ".join(register.columns)
        return {}, [*faults, f"{ident}'s columns must be exactly `{columns}`, in that order."]
    names = {_name(name): name for name in register.rows}
    read: _Rows = {}
    seen: set[str] = set()
    for written, cell, basis_cell in rows:
        name = names.get(_name(written))
        if name is None:
            faults.append(
                f"{ident} has a row `{written}` that is not one of its {len(names)} rows; "
                "remove it or use the exact name."
            )
            continue
        if name in seen:
            faults.append(f"{ident} has the row `{name}` more than once; write it once.")
            continue
        seen.add(name)
        allowed = {_name(v): v for v in register.rows[name]}
        if _name(cell) != _name(register.unset) and _name(cell) not in allowed:
            faults.append(
                f"{ident} row `{name}`: {value_name} `{cell}` is not allowed; write exactly one "
                f"of {', '.join(register.rows[name])} or `{register.unset}`."
            )
            continue
        value = allowed.get(_name(cell))
        basis = _basis(basis_cell, evidence=value is not None)
        if not basis:
            faults.append(
                f"{ident} row `{name}`: Basis is empty; a `{register.unset}` row states in one "
                "line what evidence is missing."
                if value is None
                else f"{ident} row `{name}`: Basis states no evidence; a row with a {value_name} "
                "states the evidence it rests on in one line."
            )
            continue
        read[name] = (value, basis)
    missing = [name for name in register.rows if name not in seen]
    if missing:
        faults.append(
            f"{ident} is missing the row{'s' if len(missing) > 1 else ''} {', '.join(missing)}; "
            f"write exactly one row for each (`{register.unset}` where this run has no evidence)."
        )
    return read, faults


def scorecard_faults(text: str) -> tuple[str, ...]:
    """Every fault of the two registers in a handoff that owes them, T2.13's first; a register
    the handoff lacks is a fault. Empty when both are well formed."""
    return (*_read(text, _SCORECARD)[1], *_read(text, _ASSESSMENT)[1])


def parse_scorecard(text: str) -> Scorecard | None:
    """The scorecard a CP-2 handoff carries; None for a handoff with neither register. Raises
    `ScorecardError` when one register is there without the other or either is malformed."""
    lines = _unfenced(text)
    if not any(_starts(lines, r.ident) for r in (_SCORECARD, _ASSESSMENT)):
        return None
    (levels, level_faults), (views, view_faults) = _read(text, _SCORECARD), _read(text, _ASSESSMENT)
    if level_faults or view_faults:
        raise ScorecardError((*level_faults, *view_faults))
    return Scorecard(
        tuple(
            FactorScore(name, None if level is None else int(level), basis)
            for name in FACTORS
            for level, basis in (levels[name],)
        ),
        tuple(Assessment(name, *views[name]) for name in ASSESSMENTS),
    )


def _rubric_lines(document: str, heading: str) -> list[str]:
    """The table lines of the one `## heading` section of ``document``."""
    found = list(re.finditer(rf"^## {re.escape(heading)}[ \t]*$", document, re.MULTILINE))
    if len(found) != 1:
        raise ValueError(f"Risk Rubric: expected one section `## {heading}`, found {len(found)}")
    section = re.split(r"^## ", document[found[0].end() :], maxsplit=1, flags=re.MULTILINE)[0]
    return [line for line in section.splitlines() if line.startswith("|")]


def rubric_table(document: str, heading: str = LEVEL_TEXT_SOURCE[1]) -> str:
    """The Risk Rubric table of ``document``: its header row and its 17 factor rows, each line
    exactly as written (the separator row is left out). Raises unless the `## heading` section is
    there once and its table has the header `# | Factor | 1 Excellent | ... | 5 Poor`, a separator
    row, and one row per factor, numbered 1 to 17, named and ordered as `FACTORS`, with five level
    cells that all say something."""
    lines = _rubric_lines(document, heading)
    cells = [[cell.strip() for cell in line.strip("|").split("|")] for line in lines]
    if not cells or cells[0] != _RUBRIC_HEADER:
        raise ValueError(f"Risk Rubric: the table's header must be `{' | '.join(_RUBRIC_HEADER)}`")
    if len(cells) < 2 or not all(_RULE.fullmatch(cell) for cell in cells[1]):
        raise ValueError("Risk Rubric: the table has no separator row under its header")
    rows = cells[2:]
    if [row[:2] for row in rows] != [[str(n), f] for n, f in enumerate(FACTORS, 1)]:
        found = ", ".join(row[1] if len(row) > 1 else row[0] for row in rows) or "none"
        raise ValueError(
            f"Risk Rubric: the rows must be the {len(FACTORS)} factors in order, numbered 1 to "
            f"{len(FACTORS)} ({', '.join(FACTORS)}); found {found}"
        )
    for row in rows:
        if len(row) != len(_RUBRIC_HEADER) or not all(row):
            raise ValueError(
                f"Risk Rubric: `{row[1]}` must have {len(LEVEL_NAMES)} level cells, none empty"
            )
    return "\n".join([lines[0], *lines[2:]])


@cache
def level_text() -> str:
    """The Risk Rubric table as the instructions carry it, read from `LEVEL_TEXT_SOURCE`."""
    return rubric_table((ROOT / LEVEL_TEXT_SOURCE[0]).read_text(encoding="utf-8"))
