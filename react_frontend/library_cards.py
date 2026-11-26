"""The selected credit-view paragraph and its identity for a compact library card."""

from __future__ import annotations

import re
from collections.abc import Iterator
from typing import Any

from credit_os.handoff_fields import reader_fields, report_fields
from credit_os.source import structured

_METHOD_NOTE = re.compile(
    r"^(?:Module status|Two method texts)\b|^Confidence is \d|qa_status|committee_status"
    r"|\bbelongs in CP-[A-Z0-9]+\b",
    re.IGNORECASE,
)
_BASIS = re.compile(r"(?:\n|^)Basis: [^\n]*\Z")
_EVIDENCE_LOCATOR = re.compile(
    r"(?<![\w.-])[\w-]+(?:\.[\w-]+)*\."
    r"(?:jsonl?|x?html?|xml|pdf|docx?|xlsx?|xlsm|csv|tsv|pptx?|txt|md|zip)\b"
    r"|\b(?=[0-9a-f]*[a-f])[0-9a-f]{32,}\b"
    r"|\bCP-[A-Z0-9]+-(?:GAP|MON|FACT|CALC|EVID|SRC|ASSUMPTION)-[A-Z0-9-]+\b"
    r"|∅\s*\[?G\d+\b|\b\d{8}-\d{6}-\d{2}\b|\bH\d+\s+table\s+\d+\b",
    re.IGNORECASE,
)
_PAGE = re.compile(r"(?<![\w&.-])(p|pg|pp|pages?)\.?\s*:?\s*\d+\b", re.IGNORECASE)
_LETTER = r"[^\W\d_]"
_DURATION = re.compile(
    rf"^\s+(?:{_LETTER}+(?:-{_LETTER}+)*\s+)*(?:days?|weeks?|months?|quarters?|years?)\b",
    re.IGNORECASE,
)
_NAMED_GAP = re.compile(
    rf"(?:\bgroup of {_LETTER}+(?:-{_LETTER}+)?|\b(?:economies|currencies)|"
    r"\b(?:series|class|gen|tranche)\s+[\w-]+(?:\s+[\w-]+)?)\s*$",
    re.IGNORECASE,
)
_QUANTITY = re.compile(r"(?:^|[,;:=]|\b(?:is|equals?))\s*\d+(?:\.\d+)?x\s*$", re.IGNORECASE)


def _bottom_line(sections: list[dict[str, Any]]) -> dict[str, Any] | None:
    """The first text block in Findings > Bottom line, without altering its Basis line.
    Coverage reads it; the Library card's lead is chosen by ``_candidate``."""
    parent = ""
    for section in sections:
        level = section["level"]
        if level <= 2:
            parent = section["heading"] if level == 2 else ""
        if parent == "Findings" and level == 3 and section["heading"] == "Bottom line":
            return next((block for block in section["blocks"] if block["type"] == "text"), None)
    return None


def _finding_paragraphs(sections: list[dict[str, Any]], heading: str) -> Iterator[dict[str, Any]]:
    """The text blocks under a designated Findings heading, in their published order."""
    parent = ""
    for section in sections:
        level = section["level"]
        if level <= 2:
            parent = section["heading"] if level == 2 else ""
        if parent == "Findings" and level == 3 and section["heading"] == heading:
            yield from (block for block in section["blocks"] if block["type"] == "text")


def _page_reference(text: str, match: re.Match[str]) -> bool:
    before, after = text[: match.start()], text[match.end() :]
    marker = match[1].lower()
    if re.search(r"\b(?:see|at|on|as)\s*$", before, re.IGNORECASE):
        return True
    if marker == "pp" and (
        re.search(r"\d\s*$", before)
        or (re.search(rf"{_LETTER}\s*$", before) and _DURATION.match(after))
    ):
        return False
    return not (marker == "page" and re.search(r"\bfront\s+$", before, re.IGNORECASE))


def _contains_reference(text: str) -> bool:
    if _EVIDENCE_LOCATOR.search(text) or any(
        _page_reference(text, m) for m in _PAGE.finditer(text)
    ):
        return True
    for gap in re.finditer(r"\(G\d+\)", text, re.IGNORECASE):
        before, after = text[: gap.start()], text[gap.end() :]
        if not (
            _NAMED_GAP.search(before)
            or _QUANTITY.search(before)
            or re.match(r"\s*(?:=|equals?\b)", after, re.IGNORECASE)
        ):
            return True
    return False


def _reader_body(text: str) -> str:
    """Strip the Basis line and the reader's trailing legacy citation clusters."""
    body, count = _BASIS.subn("", text)
    words = re.sub(r"^[-*] ", "", " ".join(body.splitlines())).strip()
    if count:
        return words

    def cluster(match: re.Match[str]) -> str:
        before, after = words[: match.start()], words[match.end() :]
        punctuation = r"[.!?][\"')”’]*"
        if not (
            re.match(rf"^(?:\s*$|{punctuation}(?:\s|$))", after)
            or (re.search(rf"{punctuation}\s?$", before) and re.match(r"\s|$", after))
        ):
            return match[0]

        def citation(item: re.Match[str]) -> str:
            return (
                ""
                if re.search(r"CP-[A-Z0-9]+|\bpp?\.|\bpages?\b|\b[A-Z]\d{1,3}\b|†|^【", item[1])
                or _contains_reference(item[1])
                else item[0]
            )

        return re.sub(r" ?(\[[^\]]*\]|【[^】]*】)", citation, match[0])

    return re.sub(r"(?: ?(?:\[[^\]]*\]|【[^】]*】))+", cluster, words)


def _reader_visible(paragraph: dict[str, Any]) -> bool:
    text = paragraph["text"].strip()
    body = _reader_body(text).replace("**", "").replace("`", "")
    return bool(
        body.strip()
        and not _METHOD_NOTE.search(body)
        and not re.search(r"\bSKILL\b", text)
        and not _contains_reference(body)
    )


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
        or output.get("module") != code
        or output.get("id", identifier) != identifier
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
    workspace: dict[str, Any], record: dict[str, Any], key: str, code: str, heading: str
) -> dict[str, Any] | None:
    output = _designated_output(workspace, record, key, code)
    if output is None:
        return None
    sections = workspace.get("handoffs", {}).get(output["sha256"], [])
    if (
        output.get("parseError")
        or output.get("state", {}).get("declared") == "Blocked"
        or _blocked(output, sections)
    ):
        return None
    paragraph = next(
        (item for item in _finding_paragraphs(sections, heading) if _reader_visible(item)), None
    )
    if paragraph is None:
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
    """Use a designated reader passage from a non-action analytical owner.

    Current Markdown publication does not separately qualify Committee or Relative Value prose
    for an actionable lead. The fundamental conclusion is independently owned by CP-2.
    """
    candidates = {
        "earnings_update": (
            ("CP-1B", "Bottom line"),
            ("CP-1B", "Earnings delta view"),
            ("CP-1B", "Variance mechanics and comparative credit evaluation"),
        ),
        "relative_value": (),
        "covenant_refinancing": (
            ("CP-4", "Bottom line"),
            ("CP-2D", "Liquidity view"),
            ("CP-3C", "Funding gap view"),
        ),
        "distressed_restructuring": (("CP-2A", "Distress gate"), ("CP-2A", "Bottom line")),
        "portfolio_decision": (),
        "short_snapshot": (("CP-L10", "Bottom line"),),
        "credit_screening": (("CP-L10", "Bottom line"),),
    }.get(record.get("pathway", ""), (("CP-2", "Bottom line"), ("CP-2", "Credit view")))
    return next(
        (
            summary
            for code, heading in candidates
            if (summary := _candidate(workspace, record, key, code, heading))
        ),
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
