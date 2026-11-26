"""CP-1D carries CP-1's Add-Back IDs into T1D.1 and T1D.2."""

import re

from deploy_workflow import method_scripts as core
from deploy_workflow.method_scripts import Loaded, Outcome, Table, Upstream

ADD_BACK_IDS = core.ARCHIVE + "skills/cp-1d-earnings-quality/scripts/add_back_ids.py"
NOTE = (
    "Copy each CP-1 T4.17 `Add-Back ID` unchanged into the matching T1D.1 and T1D.2 row, "
    "in bridge order. Do not derive an ID from a label or row position. An older bridge with no "
    "ID column remains usable.\n\n"
)
_BOUNDARY_NO_ID = {"not applicable", "n/a"}
_EBITDA_BRIDGE = "Chart data: EBITDA bridge"


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
    columns = [i for i, name in enumerate(headers) if _normalized_column(name) == "addbackid"]
    if not columns:
        return f"{register} has no Add-Back ID column"
    if len(columns) > 1:
        return f"{register} has {len(columns)} Add-Back ID columns"
    column = columns[0]
    ids = []
    for index, row in enumerate(rows):
        ident = row[column].strip()
        if not ident:
            return f"{register} contains a blank Add-Back ID"
        sentinel = ident.casefold()
        if bridge and index in (0, len(rows) - 1) and sentinel in _BOUNDARY_NO_ID:
            continue
        if bridge and sentinel in _BOUNDARY_NO_ID:
            return f"{register} uses a boundary sentinel on a non-boundary row"
        if empty_bridge and len(rows) == 1 and index == 0 and sentinel == "none":
            continue
        ids.append(ident)
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
    cp1 = upstream.get("CP-1")
    if cp1 is None:
        reason = "CP-1 was not sent to this run"
        return [_outcome(loaded, "T1D.1", None, reason)]

    source = core.heading_table(cp1, _EBITDA_BRIDGE)
    if isinstance(source, str) and source.startswith(
        f"the handoff has no `### {_EBITDA_BRIDGE}` table"
    ):
        source = core.register_table(cp1, "T4.17")
    expected = _ids(source, "CP-1 T4.17", bridge=True)
    if isinstance(expected, str):
        return [_outcome(loaded, "T1D.1", None, expected)]

    register = _ids(core.register_table(text, "T1D.1"), "T1D.1", empty_bridge=not expected)
    assessment = _ids(core.register_table(text, "T1D.2"), "T1D.2", empty_bridge=not expected)
    return [
        _outcome(loaded, "T1D.1", expected, register),
        _outcome(loaded, "T1D.2", expected, assessment),
    ]


core.register("CP-1D", ADD_BACK_IDS, check, NOTE)
