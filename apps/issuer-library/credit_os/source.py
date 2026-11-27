"""Reading retained files: bounded bytes, Markdown handoffs parsed into sections, dates.

Part of the library's store (`credit_os.store`, which re-exports every name here).
"""

import datetime
import hashlib
import json
import os
import re
import stat
from collections.abc import Iterator
from pathlib import Path
from typing import Any

HANDOFF_NAME = re.compile(r"CP-[A-Z0-9]+")
MONTHS = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)
ISO_DATE = re.compile(r"\d{4}-\d{2}-\d{2}", re.ASCII)


def valid_date(text: str) -> bool:
    """A real YYYY-MM-DD calendar date (not merely that shape)."""
    try:
        return bool(ISO_DATE.fullmatch(text)) and bool(datetime.date.fromisoformat(text))
    except ValueError:
        return False


def display_date(iso: Any) -> Any:
    """`31 December 2024` for a valid YYYY-MM-DD calendar date; any other text unchanged."""
    if not isinstance(iso, str) or not ISO_DATE.fullmatch(iso):
        return iso
    try:
        day = datetime.date.fromisoformat(iso)
    except ValueError:
        return iso
    return f"{day.day} {MONTHS[day.month - 1]} {day.year}"


def physical_lines(text: str) -> list[str]:
    """The text's lines split on newlines only (`\\r\\n` and a lone `\\r` count as one), as
    delivery's `physical_lines` does, so a "line N" citation is the line a reader opens."""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    if not lines[-1]:
        lines.pop()
    return lines


EQUITY_HEADERS = [
    "Reported equity movement",
    "Common shares (individual)",
    "Common stock par",
    "APIC",
    "Accumulated deficit",
    "Accumulated other comprehensive loss",
    "Treasury shares (individual)",
    "Treasury stock value",
    "Noncontrolling interests",
    "Total",
]


def equity_block(lines: list[str], i: int) -> tuple[dict[str, Any], int]:
    """The retained equity statement at `lines[i]` (the ```text fence): a delimited
    transcription, not prose. Its explicitly supplied column order governs this table."""
    start = i + 1
    rows = []
    i += 1
    while i < len(lines) and lines[i] != "```":
        label, values = lines[i].split(":", 1)
        row = [label] + [c.strip() for c in values.split("|")]
        if len(row) != len(EQUITY_HEADERS):
            raise ValueError(f"Malformed equity transcription at {i + 1}")
        rows.append({"line": i + 1, "cells": row})
        i += 1
    if i == len(lines):
        raise ValueError("Unclosed equity transcription")
    block = {
        "type": "table",
        "line": start,
        "headers": list(EQUITY_HEADERS),
        "rows": rows,
        "financial": True,
    }
    return block, i + 1


# The launcher's acceptance check reads a table row the same way
# (`deploy_workflow.handoff_delivery.TABLE_ROW`): up to three leading spaces, trailing whitespace
# dropped. Matched here rather than imported: this module is stdlib-only and the delivery module
# pulls in the engine's contracts and pydantic.
TABLE_ROW = re.compile(r" {0,3}(\|.*?)\s*")
SEPARATOR_ROW = re.compile(r"\|[\s:|\-]+\|")


def table_row(line: str) -> str | None:
    """The row text of a line that opens with `|` after at most three spaces, else None."""
    found = TABLE_ROW.fullmatch(line)
    return None if found is None else found[1]


def source_table_cells(value: str) -> list[str]:
    """Cells of one row: one boundary pipe is dropped each side, so `||` is an empty cell."""
    inner = value.strip().removeprefix("|").removesuffix("|")
    return [c.strip() for c in re.split(r"(?<!\\)\|", inner)]


def table_block(lines: list[str], i: int) -> tuple[dict[str, Any], int]:
    """The pipe table whose header is `lines[i]`; the separator row follows it."""
    start = i + 1
    headers = source_table_cells(lines[i])
    i += 2
    rows = []
    while i < len(lines) and (text := table_row(lines[i])) is not None:
        row = source_table_cells(text)
        if len(row) != len(headers):
            raise ValueError(f"Malformed table at line {i + 1}")
        rows.append({"line": i + 1, "cells": row})
        i += 1
    return {"type": "table", "line": start, "headers": headers, "rows": rows}, i


def text_block(lines: list[str], i: int) -> tuple[dict[str, Any], int]:
    """The paragraph starting at `lines[i]`, up to a blank line or the next structure.
    A line opening with three backticks starts a fenced block: one block up to its closing
    fence, blank lines and structure markers inside it kept. A fence closes only before the next
    `## ` or `### ` heading line, unless a closing fence follows the heading and the later fence
    lines pair up and none has an info string (a heading-looking line inside code); otherwise it
    is unclosed and is a paragraph. A fence line ends the paragraph before it."""
    start = i + 1
    if lines[i].startswith("```"):
        heads = (n for n in range(i + 1, len(lines)) if lines[n].startswith(("## ", "### ")))
        stop = next(heads, len(lines))
        close = next((n for n in range(i + 1, len(lines)) if lines[n].rstrip() == "```"), None)
        if close is not None and close > stop:
            fences = [n for n in range(i + 1, len(lines)) if lines[n].startswith("```")]
            inside = [n for n in fences if n < close]
            after = [n for n in fences if n > close]
            if inside or len(after) % 2:
                close = None
        if close is not None:
            return {
                "type": "text",
                "line": start,
                "end": close + 1,
                "text": "\n".join(lines[i : close + 1]),
            }, close + 1
    parts = [lines[i]]
    i += 1
    while (
        i < len(lines)
        and lines[i].strip()
        and not lines[i].startswith(("#", "- ", "<!-- table-id:", "```"))
        and table_row(lines[i]) is None
        and not re.match(r"\d+\. ", lines[i])
    ):
        parts.append(lines[i])
        i += 1
    return {"type": "text", "line": start, "end": i, "text": "\n".join(parts)}, i


def parse_source(text: str) -> list[dict[str, Any]]:
    """Keep every nonblank body line in one typed block with its source locator."""
    lines = physical_lines(text)
    sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    i = 0
    first = next((n for n, line in enumerate(lines) if line.strip()), None)
    if first is not None and lines[first] == "---":
        close = next((n for n in range(first + 1, len(lines)) if lines[n] == "---"), None)
        if close is not None:
            # YAML front matter: kept whole as the leading section, never dropped.
            body = [line for line in lines[first + 1 : close] if line.strip()]
            current = {"heading": "Front matter", "level": 2, "line": first + 1, "blocks": []}
            if body:
                start = next(n for n in range(first + 1, close) if lines[n].strip())
                end = max(n for n in range(first + 1, close) if lines[n].strip()) + 1
                current["blocks"].append(
                    {
                        "type": "text",
                        "line": start + 1,
                        "end": end,
                        "text": "\n".join(lines[start:end]),
                    }
                )
            sections.append(current)
            current = None  # a stray body line after the marker is not front matter: it raises
            i = close + 1
    while i < len(lines):
        line = lines[i]
        heading = re.match(r"^(#{1,4}) (.+)$", line)
        if heading:
            current = {"heading": heading[2], "level": len(heading[1]), "line": i + 1, "blocks": []}
            sections.append(current)
            i += 1
        elif not line.strip() or re.fullmatch(r"<!-- table-id: [\w.-]+ -->", line):
            # Blank, or a transport identifier preserved in the downloadable original.
            i += 1
        elif current is None:
            raise ValueError("Body before first heading")
        else:
            if line == "```text" and current["heading"].startswith("T4.4 —"):
                block, i = equity_block(lines, i)
            elif (
                table_row(line) is not None
                and i + 1 < len(lines)
                and (divider := table_row(lines[i + 1])) is not None
                and SEPARATOR_ROW.fullmatch(divider)
            ):
                block, i = table_block(lines, i)
            else:
                block, i = text_block(lines, i)
            current["blocks"].append(block)
    return sections


# The one size limit for a delivered or uploaded file in this language. The Go server states the
# same 64 MiB as `maxFileBytes` (model.go); change the two together.
MODEL_FILE_LIMIT = 64 * 1024 * 1024
CHUNK = 1024 * 1024


class UnreadableFile(OSError):
    """A path that is not a plain, bounded file: absent is OSError; this is everything else."""


def regular_chunks(
    path: str | Path, follow: bool = True, limit: int = MODEL_FILE_LIMIT
) -> Iterator[bytes]:
    """The bytes of a regular file of at most `limit` bytes, in chunks.

    The kind and size are read from the open descriptor, so a path swapped for a FIFO after a
    check is still refused; the open never blocks on a FIFO.
    """
    flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NONBLOCK", 0)
    if not follow:
        flags |= getattr(os, "O_NOFOLLOW", 0)
        if Path(path).is_symlink():
            raise UnreadableFile("a link")
    try:
        descriptor = os.open(path, flags)
    except ValueError as error:  # An embedded NUL.
        raise UnreadableFile("an invalid path") from error
    try:
        info = os.fstat(descriptor)
        if not stat.S_ISREG(info.st_mode):
            raise UnreadableFile("not a regular file")
        if info.st_size > limit:
            raise UnreadableFile("over the size limit")
        handle = os.fdopen(descriptor, "rb")
    except BaseException:
        os.close(descriptor)
        raise
    with handle:
        total = 0
        while chunk := handle.read(CHUNK):
            total += len(chunk)
            if total > limit:
                raise UnreadableFile("over the size limit")
            yield chunk


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    for chunk in regular_chunks(path):
        digest.update(chunk)
    return digest.hexdigest()


def _refuse_constant(name: str) -> Any:
    raise ValueError(f"non-finite number {name} is not accepted")


def strict_loads(text: str | bytes) -> Any:
    """json.loads that refuses ``NaN``, ``Infinity`` and ``-Infinity`` with a ValueError, so a run
    file holding one is unreadable and named by its caller; no stand-in value is made up."""
    return json.loads(text, parse_constant=_refuse_constant)


def describe(error: BaseException) -> str:
    """An error as its type and a short reason; never the repr, which can hold file bytes.

    An OSError's text holds the absolute path it failed on and the reason reaches the browser, so
    it is named by its kind alone; this module's own UnreadableFile reasons hold no path."""
    if isinstance(error, UnicodeDecodeError):
        return f"UnicodeDecodeError: {error.reason}"
    if isinstance(error, OSError) and not isinstance(error, UnreadableFile):
        return type(error).__name__
    return f"{type(error).__name__}: {str(error)[:80]}"


def sections_of(text: str) -> list[dict[str, Any]]:
    """parse_source, typed as a list of section dicts."""
    sections: list[dict[str, Any]] = parse_source(text)
    return sections


def structured(raw: bytes, strict: bool) -> tuple[list[dict[str, Any]], str | None]:
    """Typed blocks. In the app a handoff the parser refuses stays readable as one flagged block.

    A UTF-8 byte-order mark, which Windows editors often write, is not part of the first heading.
    """
    try:
        return sections_of(raw.decode("utf-8-sig")), None
    except ValueError as error:
        if strict:
            raise
        text = raw.decode("utf-8-sig", "replace")
        block = {"type": "text", "line": 1, "end": text.count("\n") + 1, "text": text}
        return [{"heading": "Unstructured handoff", "level": 1, "line": 1, "blocks": [block]}], str(
            error
        )


def text_or_none(value: Any) -> str | None:
    return value if isinstance(value, str) else None
