"""The methods' shared `completeness_check.py`, run on every module's handoff (harness:
`deploy_workflow.method_scripts`).

The script reads a module's completeness contract from the `## Output profile` of the SKILL.md the
module is sent (the archived bytes, sha256-pinned like the script): each required register's
declared columns, its minimum body rows, the columns it calls critical and the placeholder cells
that disqualify a full run. Its own `load_contract` reads the contract here, so the check cannot
drift from the method; its matching does not run as written, because in this transport:

- registers the scope file cut and the routing registers are not required (`CPOS_REGISTER_SCOPE.md`:
  "not required by the method's ... completeness check"), so only the registers the launcher's
  presence check requires (`cpos_launch.required_registers`) are judged; whether a register is
  present at all stays that check's;
- the CP-MODEL interface tables are not asked for (ROUTING_RULES), so they are not read;
- an explicit gap is the required answer for missing evidence, so a placeholder in a critical
  column, and a register with fewer rows than the method's minimum, are recorded (`noted`), never
  sent back;
- header cells are matched as the harness reads labels (emphasis, case, spacing, `_`, hyphens and a
  trailing unit such as `(USD m)` aside), a joined header (`Currency and scale`) holds each part,
  and a declared column naming a downstream or receiving module is not required (ROUTING_RULES:
  "map upstream or downstream dependencies ... write none of them").

Only a declared column absent from the table under a required register's heading is sent back
(status `missing`), and only for the ten modules with a presence check: no other module's handoff
has been calibrated against it (the retained Sol runs measured the ten). Every other module's
outcomes are recorded as `noted`. A register written only as a gap (`Not supplied: <reason>`),
written as rows instead of columns, or not found as a table under its heading is not checked.
"""

import re
from collections.abc import Callable, Mapping, Sequence
from dataclasses import asdict
from functools import cache
from typing import Any

from deploy_workflow import method_scripts as core
from deploy_workflow.method_scripts import (
    ROOT,
    SHARED,
    Outcome,
    Status,
    Table,
    _plain,
    _verified,
    blocked,
    register_table,
    registered,
)
from deploy_workflow.owners.cpos_launch_methods import (
    METHODS,
    has_scope,
    method_check_enabled,
    pathway_method,
)

COMPLETENESS = SHARED + "completeness_check.py"
# A declared column whose rows would address another module (ROUTING_RULES forbids them).
# ROUTING_RULES: "map upstream or downstream dependencies", "keep a ... export record", "a register
# whose rows are addressed to receiving modules": a declared column (or one part of a joined one)
# that is one of these is never required. Checked against every declared column of the ten modules
# (ruling, review of 2026-11-15): `Export Record` (CP-1A T2D.11), `dependency` (CP-2G T2H.8),
# `Responsible Module` (CP-2A), the `downstream` columns. Kept: `Module Status`, CP-5's
# audited and originating `Module` (provenance), `independence_family`.
ROUTING_COLUMN = re.compile(
    r"downstream|upstream|receiving module|next module|consumer|export record|"
    r"responsible module|^\W*dependenc(?:y|ies)\W*$",
    re.IGNORECASE,
)
MISSING_COLUMNS = (
    "{register} lacks the method's column{s} {names}: its Output profile declares every column of "
    "the register. Write {register}'s table with all of them, under the method's names (a column "
    "with nothing to report holds `Not supplied: <reason>`); a renamed column does not count."
)
SHOWN = 6  # placeholder cells named in one outcome


def _where(module: str, register: str, figure: str, status: Status, reason: str) -> Outcome:
    return Outcome(module, COMPLETENESS, figure, register, figure, status, reason=reason)


def skill(module: str, pathway: str | None = None) -> str | None:
    """The archive path of the SKILL.md the module is sent in ``pathway``, if it is sent one."""
    methods = pathway_method(module, pathway) or METHODS.get(module, ())
    sent = [p for p in methods if p.startswith(core.ARCHIVE) and p.endswith("/SKILL.md")]
    return sent[0] if sent else None


@cache
def contract(module: str, pathway: str | None = None) -> dict[str, Any] | str:
    """The module's completeness contract as the script's own `load_contract` reads it from the
    SKILL.md it is sent in ``pathway``, or why there is none."""
    path = skill(module, pathway)
    if path is None:
        return "the module is sent no SKILL.md"
    loaded = core._loaded(COMPLETENESS)
    text = _verified(ROOT, path, registered()).decode("utf-8")
    try:
        found: dict[str, Any] = loaded.script.load_contract(text, module)
    except ValueError as error:
        return f"its SKILL.md declares no completeness contract: {error}"
    return found


def _norm(text: str) -> str:
    """A header as compared: emphasis, case, `_`, `.`, hyphens and dashes, `?`, footnote marks and
    `<br>` aside, `&` and `+` read as `and`, spacing around `/` and a word's plural `s` ignored
    (`Evidence IDs`)."""
    text = re.sub(r"<br\s*/?>", " ", _plain(text), flags=re.IGNORECASE).casefold().replace("_", " ")
    text = re.sub(r"[†‡§¹²³⁴⁵⁶⁷⁸⁹⁰*]", "", text)
    text = re.sub(r"\s*[&+]\s*", " and ", text)
    text = re.sub(r"[\u2010-\u2015-]", " ", text)
    text = re.sub(r"\?", "", text).replace(".", " ")
    text = re.sub(r"\s*/\s*", "/", text)
    text = re.sub(r"\s+", " ", text).strip(" :")
    return re.sub(r"(?<=\w{2})(?<!s)s\b", "", text)


def _whole(name: str) -> set[str]:
    """A column name as compared: whole, and without what may trail it: a bracketed note (`(USD
    m)`), a scale or range (`1–5`, `(1-5)`), a number mark (`Gap #`, `Gap No.`), a unit after a
    comma (`Revenue, USD m`), a plural mark (`Period(s)`); a bracketed abbreviation is a form
    too (`Free cash flow (FCF)`)."""
    whole = _norm(re.sub(r"\(s\)", "", name))
    short = re.sub(r"\s*\([^()]*\)$", "", whole).strip()
    bare = re.sub(r"(?:\s+(?:\d+(?:\s+\d+)?|#|no))+$", "", short).strip()
    comma = whole.split(",")[0].strip()
    abbreviation = re.findall(r"\((\w+)\)$", whole)
    return {f for f in (whole, short, bare, comma, *abbreviation) if f}


def _parts(name: str) -> set[str]:
    """The parts of a joined name (`a/b`, `a and b`, `a or b`), each as compared."""
    return {p.strip() for w in _whole(name) for p in re.split(r"/| and | or ", w) if p.strip()}


def _spelt(name: str) -> list[set[str]]:
    """Each part of a joined declared name with the words its neighbours share: `gross/net
    leverage` is `gross leverage` and `net leverage`; `opening debt/cash` is `opening debt` and
    `opening cash`; `target/date` may be `target date`. A routing part is left out."""
    whole = _norm(re.sub(r"\(s\)", "", name))
    pieces = [p.strip() for p in re.split(r"/| and | or ", whole) if p.strip()]
    head, tail = pieces[0].split()[0], pieces[-1].split()[-1]
    return [{p, f"{p} {tail}", f"{head} {p}"} for p in pieces if not ROUTING_COLUMN.search(p)]


def _holds(cells: set[str], forms: set[str], shadow: frozenset[str] = frozenset()) -> bool:
    """A header form is one of ``forms``, or starts or ends with one as whole words (`Principal
    amount`, `Cash interest`); a ``shadow`` form is another declared column's, so it is held only
    whole."""
    return bool(forms & cells) or any(
        c.startswith(f + " ") or c.endswith(" " + f) for f in forms for c in cells - shadow
    )


def _cell_forms(header: list[str]) -> list[set[str]]:
    return [_whole(h) | _parts(h) for h in header]


def _present(declared: str, header: list[str], others: Sequence[str] = ()) -> bool:
    """A declared column is in the header when a header cell, or a part of a joined one
    (`Currency and scale`), is it or holds it as whole words (`Principal amount`, `Cash
    interest`), or when a joined declared name's parts are each there (`evidence/date` as two
    columns, `gross/net leverage` as `Gross leverage` and `Net leverage`). A part that names a
    routing record (`Export Record`) is not required. A header cell that is a whole form of one
    of the register's ``others`` declared columns is that column's, so it is not held as a prefix
    or suffix of this one (`Source Trace` is not `Source`)."""
    forms = _cell_forms(header)
    cells = set().union(*forms) if forms else set()
    taken = set().union(*(_whole(o) for o in others)) if others else set()
    shadow = frozenset(set().union(*(f for f in forms if f & taken)) if taken else ())
    if _holds(cells, _whole(declared), shadow):
        return True
    spelt = _spelt(declared)
    joined = len(re.split(r"/| and | or ", _norm(declared))) > 1
    return joined and bool(spelt) and all(_holds(cells, f, shadow) for f in spelt)


# A cell in the transport's gap form: a gap word, or a null word with its reason after a colon.
_GAP_FORM = re.compile(r"^(?:not calculable|not assessable|unavailable|not applicable)\s*:")


def _gap_row(row: list[str]) -> bool:
    """A row that states a gap: a cell in the transport's form (`Not supplied: <reason>`,
    `Not calculable: <reason>`) whatever its other cells say (a label, a source, `n/a`), or a row
    whose cells are mostly the method's placeholder (`[Insufficient Information]`): the presence
    rule's form for a register with nothing to report, under whatever header."""
    said = [_plain(c).casefold() for c in row if _plain(c) not in ("", *core.NOT_APPLICABLE)]
    if any(c.startswith(core.GAP_WORDS[:4]) or _GAP_FORM.match(c) for c in said):
        return True
    gaps = [c for c in said if c.startswith(core.GAP_WORDS) or c in ("n/a", "na", "tbd")]
    return bool(said) and len(gaps) * 2 > len(said)


def tables(text: str, ident: str) -> list[Table] | str:
    """Every table between the register's heading and the next heading of its level or above
    (a register may be written as more than one table, under `####` sub-headings), or why none
    is read (the first reason a table could not be)."""
    found, unread = _scan(text, ident)
    return found or (unread[0] if unread else f"{ident} has no table under its heading")


def _scan(text: str, ident: str) -> tuple[list[Table], list[str]]:
    """The tables of the register read, and the reason each table that could not be read."""
    lines = core._unfenced(text)
    starts = [i for i, line in enumerate(lines) if core._register_start(ident).match(line)]
    if len(starts) != 1:
        why = register_table(text, ident)
        return ([], [why]) if isinstance(why, str) else ([why], [])
    start = starts[0]
    level = len(lines[start]) - len(lines[start].lstrip("#")) or 6  # a tag: any heading ends it
    found: list[Table] = []
    unread: list[str] = []
    for i in range(start + 1, len(lines)):
        heading = core._HEADING.match(lines[i])
        if heading and len(lines[i]) - len(lines[i].lstrip("#")) <= level:
            break
        if lines[i].lstrip().startswith("|") and not lines[i - 1].lstrip().startswith("|"):
            table = core._table_after(lines, i - 1, ident)
            if isinstance(table, str):
                unread.append(table)
            else:
                found.append(table)
    return found, unread


def _register(
    module: str, ident: str, found: dict[str, Any], text: str, enforced: bool
) -> list[Outcome]:
    """One required register against ``found``, the module's contract (its `registers[ident]`
    is this register's)."""
    spec = found["registers"][ident]
    read, unread = _scan(text, ident)
    if not read:
        why = unread[0] if unread else f"{ident} has no table under its heading"
        return [_where(module, ident, "columns", "not checked", why)]
    rows = [row for _, body in read for row in body]
    if rows and all(_gap_row(row) for row in rows):
        why = f"every row of {ident} states a gap, so its columns are not judged"
        return [_where(module, ident, "columns", "not checked", why)]
    out = [_where(module, ident, "contract", "noted", e) for e in spec["contract_errors"]]
    out.append(_columns(module, ident, spec, (read, unread), enforced))
    if len(rows) < spec["minimum_body_rows"]:
        why = f"{len(rows)} body row(s); the method's minimum is {spec['minimum_body_rows']}"
        out.append(_where(module, ident, "rows", "noted", why))
    cells = [c for table in read for c in _placeholders(spec, table, found)]
    if cells:
        more = f" and {len(cells) - SHOWN} more" if len(cells) > SHOWN else ""
        why = (
            "not a full analytical run by the method's blocklist (an explicit gap is this "
            f"transport's answer, so recorded only): {'; '.join(cells[:SHOWN])}{more}"
        )
        out.append(_where(module, ident, "placeholders", "noted", why))
    return out


def _columns(
    module: str,
    ident: str,
    spec: dict[str, Any],
    scan: tuple[list[Table], list[str]],
    enforced: bool,
) -> Outcome:
    """Whether every declared column (less a routing one) is in one of the register's tables.
    ``scan`` is the tables read and why each other was not: a column absent from the tables read is
    not called missing while a table could not be read."""
    read, unread = scan
    script = core._loaded(COMPLETENESS).script
    header = [cell for head, _ in read for cell in head]
    fixed = [c for c in spec["columns"] if not script.is_template_column(c)]
    missing = [
        c
        for c in fixed
        if not ROUTING_COLUMN.search(c) and not _present(c, header, [o for o in fixed if o != c])
    ]
    if not missing:
        templated = len(fixed) < len(spec["columns"]) and len(read[0][0]) <= len(fixed)
        if templated:
            why = f"{ident} has no period column beside its declared columns"
            return _where(module, ident, "columns", "noted", why)
        return _where(module, ident, "columns", "agreed", "every declared column is present")
    if unread:
        why = (
            f"{ident} has a table that could not be read ({unread[0]}); its columns are not judged"
        )
        return _where(module, ident, "columns", "not checked", why)
    labels = {_norm(row[0]) for _, body in read for row in body if row}
    if any(_whole(m) & labels for m in missing):
        why = f"{ident} is written as rows, not the declared columns; not read"
        return _where(module, ident, "columns", "not checked", why)
    names = ", ".join(f"`{m}`" for m in missing)
    reason = MISSING_COLUMNS.format(register=ident, s="s" * (len(missing) > 1), names=names)
    return _where(module, ident, "columns", "missing" if enforced else "noted", reason)


def _critical_indexes(spec: dict[str, Any], header: list[str]) -> list[int]:
    """The header positions of the critical columns: a cell holding a declared name or one part of
    a joined name (`Rate / Strike` as `Rate`, `Strike`); a template column (`Period 1…N`) is the
    cells between the fixed columns declared before and after it, as the script reads them."""
    script = core._loaded(COMPLETENESS).script
    found: list[int] = []
    for column in spec["critical_columns"]:
        if script.is_template_column(column):
            hits = _period_indexes(spec["columns"], header, script.is_template_column)
        else:
            hits = [i for i, cell in enumerate(header) if _critical_cell(column, cell)]
        found += [i for i in hits if i not in found]
    return sorted(found)


def _period_indexes(
    columns: list[str], header: list[str], is_template: Callable[[str], bool]
) -> list[int]:
    """The period cells between the fixed columns declared before a template column (the first
    cells) and after it (the last), or none when the header does not hold them there."""
    first = next((i for i, c in enumerate(columns) if is_template(c)), len(columns))
    pre = [c for c in columns[:first] if not is_template(c)]
    post = [c for c in columns[first:] if not is_template(c)]
    fixed = pre + post
    end = len(header) - len(post)
    if len(header) <= len(fixed):
        return []
    at = [*range(len(pre)), *range(end, len(header))]
    held = all(_present(c, [header[i]], [o for o in fixed if o != c]) for c, i in zip(fixed, at))
    return list(range(len(pre), end)) if held else []


def _critical_cell(column: str, cell: str) -> bool:
    """A header cell holds a critical column's name, or one part of a joined name."""
    if _present(column, [cell]):
        return True
    cells = set().union(*_cell_forms([cell]))
    joined = len(re.split(r"/| and | or ", _norm(column))) > 1
    return joined and any(_holds(cells, forms) for forms in _spelt(column))


def _placeholders(spec: dict[str, Any], table: Table, found: Any) -> list[str]:
    """The critical cells of one table holding a placeholder the method's blocklist names."""
    header, rows = table
    exempt = {_norm(c) for c in spec["disqualifier_exempt_columns"]}
    critical = [i for i in _critical_indexes(spec, header) if _norm(header[i]) not in exempt]
    return [
        f"row {n} `{header[i]}`: `{row[i]}`"
        for n, row in enumerate(rows, 1)
        for i in critical
        if _disqualified(row[i], found)
    ]


def _disqualified(cell: str, found: Any) -> bool:
    text = _plain(cell).casefold().strip()
    return text in found["blocklist"] or any(s and s in text for s in found["substrings"])


def check(
    module: str, text: str, pathway: str | None = None, phases: tuple[str, ...] = ()
) -> list[Outcome]:
    """Each required register's columns, rows and critical cells against the contract of the
    SKILL.md the module is sent in ``pathway``; none for a module sent no SKILL.md there."""
    if skill(module, pathway) is None:
        return []
    if blocked(text):
        why = "the module stopped at its gate (`module_status: Blocked`): only the gate is owed"
        return [_where(module, "", "all", "not checked", why)]
    found = contract(module, pathway)
    if isinstance(found, str):
        return [_where(module, "", "all", "not checked", found)]
    # Imported here: the launcher imports this module.
    from deploy_workflow.owners.cpos_launch import required_registers

    scoped = bool(phases) or has_scope(module, pathway)
    required = set(required_registers(module, pathway, phases))
    out: list[Outcome] = []
    for ident in sorted(found["registers"]):
        if scoped and ident not in required:
            why = "not required in this transport (register scope or routing rule)"
            out.append(_where(module, ident, "all", "not checked", why))
            continue
        out += _register(module, ident, found, text, scoped)
    return out


def scoped_outcomes(
    module: str, text: str, pathway: str, phases: tuple[str, ...]
) -> tuple[Outcome, ...]:
    return core._guarded(module, COMPLETENESS, lambda: check(module, text, pathway, phases))


def scoped_record(
    module: str, raw: bytes, upstream: Mapping[str, bytes], selection: Mapping[str, tuple[str, ...]]
) -> dict[str, Any] | None:
    """Record the checks used to accept a scoped custom handoff."""
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return core.record(module, raw, upstream, "custom")
    outcomes = scoped_outcomes(module, text, "custom", selection[module])
    if method_check_enabled(module, selection):
        outcomes = (*core.run(module, text, core.upstream_texts(upstream)), *outcomes)
    if not outcomes:
        return None
    hashes = core.registered()
    return {
        "kind": core.RECORD_KIND,
        "module": module,
        "response_sha256": core._sha(raw),
        "scripts": {path: hashes.get(path) for path in sorted({o.script for o in outcomes})},
        "checks": [asdict(outcome) for outcome in outcomes],
    }


core.register_shared(COMPLETENESS, check)
