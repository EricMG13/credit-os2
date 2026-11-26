"""Serve original forecast artifacts named in the published run's evidence."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote

from deploy_workflow import http_base

GRAPH = re.compile(
    r"/connected/artifacts/([^/]+)(?:/([0-9a-f]{64})/"
    r"(model\.html|annual\.md|calculation\.json|forecast_exact\.json))?"
)
NAMES = {
    "model.html": "HTML Model",
    "annual.md": "Annual model handoff",
    "calculation.json": "Calculation JSON",
    "forecast_exact.json": "Exact forecast JSON",
}
LINK = re.compile(r"\.\./runs/([^/]+)/deliveries/([0-9a-f]{64})/([^/]+)")


def _links(record: dict[str, Any], folder: str) -> dict[tuple[str, str], str]:
    allowed = {}
    for item in record.get("evidence", {}).get("downloads", []):
        match = LINK.fullmatch(item.get("href") or "")
        if match and unquote(match[1]) == folder and match[3] in NAMES:
            allowed[(match[2], match[3])] = NAMES[match[3]]
    return allowed


def artifacts(record: dict[str, Any], root: Path, folder: str) -> dict[tuple[str, str], Path]:
    """Return available immutable file paths inside this run's deliveries directory."""
    result = {}
    deliveries = root.resolve() / folder / "deliveries"
    for digest, name in _links(record, folder):
        file = deliveries / digest / name
        if file.is_file() and file.resolve() == file:
            result[(digest, name)] = file
    return result


def entries(available: dict[tuple[str, str], Path], folder: str) -> list[dict[str, str]]:
    return [
        {
            "label": NAMES[name],
            "href": f"/connected/artifacts/{quote(folder, safe='')}/{digest}/{name}",
        }
        for digest, name in available
    ]


def admitted(
    encoded: str, folder_pattern: re.Pattern[str], snapshot: dict[str, Any] | None
) -> tuple[str, dict[str, Any]]:
    """The run folder named in a request and its record in the admitted snapshot, or a 404
    `unknown report` when the name is not a run folder or the snapshot holds no such run."""
    folder = unquote(encoded)
    if folder in {".", ".."} or not folder_pattern.fullmatch(folder):
        raise http_base.refuse(404, "unknown report")
    records = snapshot["workspace"]["runs"].values() if snapshot else ()
    record = next((item for item in records if item["folder"] == folder), None)
    if record is None:
        raise http_base.refuse(404, "unknown report")
    return folder, record


def reply(
    match: re.Match[str],
    root: Path,
    folder_pattern: re.Pattern[str],
    snapshot: dict[str, Any] | None,
) -> http_base.Reply:
    encoded, delivery, name = match.groups()
    folder, record = admitted(encoded, folder_pattern, snapshot)
    available = artifacts(record, root, folder)
    if delivery is None:
        return http_base.Reply(
            200, {"files": entries(available, folder)}, {"Cache-Control": "no-store"}
        )
    file = available.get((delivery, name))
    if file is None or (data := http_base.read_regular(file)) is None:
        raise http_base.refuse(404, "artifact unavailable")
    return http_base.Reply(
        200,
        data,
        {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": f'attachment; filename="{name}"',
            "Cache-Control": "no-store",
        },
    )
