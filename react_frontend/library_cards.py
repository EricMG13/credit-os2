"""The selected credit-view paragraph and its identity for a compact library card."""

from __future__ import annotations

from typing import Any

from credit_os.handoff_fields import reader_fields, report_fields
from credit_os.source import structured


def _bottom_line(sections: list[dict[str, Any]]) -> dict[str, Any] | None:
    """The first text block in Findings > Bottom line, without altering its Basis line."""
    parent = ""
    for section in sections:
        level = section["level"]
        if level <= 2:
            parent = section["heading"] if level == 2 else ""
        if parent == "Findings" and level == 3 and section["heading"] == "Bottom line":
            return next((block for block in section["blocks"] if block["type"] == "text"), None)
    return None


def _designated_output(
    workspace: dict[str, Any], record: dict[str, Any], key: str, code: str
) -> dict[str, Any] | None:
    module = record.get("modules", {}).get(code, {})
    identifier = module.get("default")
    if not identifier or identifier not in module.get("outputs", []):
        return None
    output = workspace.get("outputs", {}).get(identifier)
    if (
        not isinstance(output, dict)
        or output["module"] != code
        or output.get("run") not in (None, "", key)
    ):
        return None
    return output


def _blocked(output: dict[str, Any], sections: list[dict[str, Any]]) -> bool:
    """The connected reader's declared-status rule, including its legacy fallback."""
    parent = ""
    for section in sections:
        if section["level"] <= 2:
            parent = section["heading"] if section["level"] == 2 else ""
        if section["level"] == 3 and section["blocks"]:
            if parent == "Findings" and section["heading"] == "Bottom line":
                paragraph = next(
                    (block for block in section["blocks"] if block["type"] == "text"), None
                )
                return bool(
                    paragraph is not None and paragraph["text"].startswith("Not assessable:")
                )
            break
    return output.get("state", {}).get("established") is False


def _candidate(
    workspace: dict[str, Any], record: dict[str, Any], key: str, code: str
) -> dict[str, Any] | None:
    output = _designated_output(workspace, record, key, code)
    if output is None:
        return None
    sections = workspace.get("handoffs", {}).get(output["sha256"], [])
    paragraph = _bottom_line(sections)
    if paragraph is None or _blocked(output, sections):
        return None
    return {
        "module": code,
        "output": output.get("id", record["modules"][code]["default"]),
        "sha256": output["sha256"],
        "line": paragraph["line"],
        "text": paragraph["text"],
    }


def lead_summary(
    workspace: dict[str, Any], record: dict[str, Any], key: str
) -> dict[str, Any] | None:
    """Use the existing Overview lead order; CP-1B leads an earnings update only."""
    codes = ["CP-6", "CP-2", "CP-L10"]
    if record.get("pathway") == "earnings_update":
        codes.append("CP-1B")
    return next(
        (summary for code in codes if (summary := _candidate(workspace, record, key, code))),
        None,
    )


def not_assessable_modules(
    workspace: dict[str, Any], record: dict[str, Any], key: str
) -> list[str]:
    """Designated outputs the published reader marks as blocked or unreadable; no inference."""
    result = []
    for code in record.get("modules", {}):
        output = _designated_output(workspace, record, key, code)
        if output is None:
            continue
        sections = workspace.get("handoffs", {}).get(output["sha256"], [])
        blocked = _blocked(output, sections)
        if blocked or output.get("parseError"):
            result.append(code)
    return result


def response_assessment(raw: bytes) -> str:
    """Apply the same explicit blocked/unreadable rule before the full run is published."""
    sections, problem = structured(raw, strict=False)
    fields = report_fields(sections, reader_fields(sections)["summary"])
    return "not-assessable" if problem or _blocked(fields, sections) else "readable"
