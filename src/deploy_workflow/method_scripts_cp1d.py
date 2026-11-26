"""CP-1D carries CP-1's Add-Back IDs into T1D.1 and T1D.2."""

import re

from deploy_workflow import method_scripts as core
from deploy_workflow.method_scripts import Loaded, Outcome, Table, Upstream

ADD_BACK_IDS = core.ARCHIVE + "skills/cp-1d-earnings-quality/scripts/add_back_ids.py"
NOTE = (
    "Copy each CP-1 T4.17 `Add-Back ID` unchanged into the matching T1D.1 and T1D.2 row, "
    "in bridge order. Do not derive an ID from a label or row position. For each adjustment in "
    "an older bridge with no ID column, put `Not supplied: CP-1 bridge has no Add-Back ID` in "
    "the Add-Back ID cell.\n\n"
)
_BOUNDARY_NO_ID = {"not applicable", "n/a"}
_EBITDA_BRIDGE = "Chart data: EBITDA bridge"
_LEGACY_KEY = "Not supplied: CP-1 bridge has no Add-Back ID"
_BLOCKED = re.compile(r"module_status:\s*['\"]?blocked\b", re.IGNORECASE)


def _cell_text(value: str) -> str:
    """Unwrap formatting around a whole cell; preserve Markdown characters within an ID."""
    value = value.strip()
    for marker in ("**", "`", "*"):
        if value.startswith(marker) and value.endswith(marker) and len(value) > 2 * len(marker):
            inner = value[len(marker) : -len(marker)]
            if inner and not inner[0].isspace() and not inner[-1].isspace():
                return inner
    return value


def _blocked(text: str) -> bool:
    """Read module_status only at the root of the YAML front matter."""
    lines = text.lstrip("\ufeff").splitlines()
    if not lines or lines[0].strip() != "---":
        return False
    front_matter = []
    for line in lines[1:]:
        if line.strip() == "---":
            break
        front_matter.append(line)
    content = [line for line in front_matter if line.strip() and not line.lstrip().startswith("#")]
    if not content:
        return False
    root_indent = min(len(line) - len(line.lstrip()) for line in content)
    for line in content:
        if len(line) - len(line.lstrip()) == root_indent and _BLOCKED.match(line.lstrip()):
            return True
    return False


def _normalized_column(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.casefold())


def _ids(
    table: Table | str,
    register: str,
    *,
    bridge: bool = False,
    empty_bridge: bool = False,
) -> list[str] | str:
    if isinstance(table, str):
        return table
    headers, rows = table
    columns = [
        i for i, name in enumerate(headers) if _normalized_column(_cell_text(name)) == "addbackid"
    ]
    if len(columns) != 1:
        message = (
            f"{register} has {len(columns)} Add-Back ID columns"
            if columns
            else f"{register} has no Add-Back ID column"
        )
        return message
    column = columns[0]
    if empty_bridge:
        if len(rows) == 1 and _cell_text(rows[0][column]).casefold() == "none":
            return []
        return f"{register} requires one NONE row for an empty CP-1 bridge"
    ids = [_cell_text(row[column]) for row in rows]
    if any(not ident for ident in ids):
        return f"{register} contains a blank Add-Back ID"
    if bridge:
        ids = [ident for ident in ids if ident.casefold() not in _BOUNDARY_NO_ID]
    return ids


def _outcome(
    loaded: Loaded,
    register: str,
    expected: list[str] | None,
    actual: list[str] | str,
) -> Outcome:
    if expected is None:
        reason = actual if isinstance(actual, str) else "CP-1 bridge IDs are unavailable"
        return Outcome(
            "CP-1D", ADD_BACK_IDS, "Add-Back IDs", register, "all", "not checked", reason=reason
        )
    if isinstance(actual, str):
        return Outcome(
            "CP-1D", ADD_BACK_IDS, "Add-Back IDs", register, "all", "missing", reason=actual
        )
    reason = loaded.script.compare(expected, actual)
    return Outcome(
        "CP-1D",
        ADD_BACK_IDS,
        "Add-Back IDs",
        register,
        "all",
        "disagreed" if reason else "agreed",
        stated=", ".join(actual) or "no add-backs",
        recomputed_label=", ".join(expected) or "no add-backs",
        reason=reason or "the ordered IDs match CP-1 T4.17",
    )


def check(text: str, loaded: Loaded, upstream: Upstream) -> list[Outcome]:
    """Compare T1D.1 and T1D.2 IDs with the CP-1 bridge, when the bridge carries IDs."""
    if _blocked(text):
        return [_outcome(loaded, "T1D.1", None, "CP-1D stopped at its gate")]
    cp1 = upstream.get("CP-1")
    if cp1 is None:
        reason = "CP-1 was not sent to this run"
        return [_outcome(loaded, "T1D.1", None, reason)]

    source = core.heading_table(cp1, _EBITDA_BRIDGE, raw_cells=True)
    if isinstance(source, str) and source.startswith(
        f"the handoff has no `### {_EBITDA_BRIDGE}` table"
    ):
        source = core.register_table(cp1, "T4.17", raw_cells=True)
    if isinstance(source, str):
        expected: list[str] | str = source
    else:
        headers, rows = source
        id_columns = [
            i
            for i, header in enumerate(headers)
            if _normalized_column(_cell_text(header)) == "addbackid"
        ]
        if not id_columns:
            expected = [_LEGACY_KEY] * max(0, len(rows) - 2)
        else:
            expected = _ids(source, "CP-1 T4.17", bridge=True)
    if isinstance(expected, str):
        return [_outcome(loaded, "T1D.1", None, expected)]

    register = _ids(
        core.register_table(text, "T1D.1", raw_cells=True), "T1D.1", empty_bridge=not expected
    )
    assessment = _ids(
        core.register_table(text, "T1D.2", raw_cells=True), "T1D.2", empty_bridge=not expected
    )
    return [
        _outcome(loaded, "T1D.1", expected, register),
        _outcome(loaded, "T1D.2", expected, assessment),
    ]


core.register("CP-1D", ADD_BACK_IDS, check, NOTE)
