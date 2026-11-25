"""First-pass reading notes: page-referenced notes on a module's documents, written by a separate
reader before the module runs, and placed after the module's instructions.

Tested for CP-4 only (docs/sweeps/2026-11-25-instruction-length/REPORT.md, group D: the notes
were written by a cheaper model given each legal document whole, in a clean context). Off unless
a launch names a notes folder (`--reading-notes`): the notes are then pinned with the
instructions, so a run and its resume read the same ones.

A notes folder holds `<module>/<source name>.notes.md`. The first line of each file names the
source and its sha256, so notes written for another version of a document are refused.
"""

import re
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

# The topics a reader is given: the step titles of the module's own method, word for word, so the
# reader is told what the module looks for and nothing else.
READER_TOPICS: Mapping[str, tuple[str, ...]] = {
    "CP-4": (
        "Controlling Documents and Source Authority",
        "Covenant Feature Register",
        "EBITDA, Definitions, and Ratio Mechanics",
        "Debt Incurrence, Incremental Facilities, and MFN",
        "Leakage, Restricted Payments, Investments, and Asset Transfers",
        "Collateral, Guarantees, and Structural Subordination",
        "Events of Default, Remedies, and Amendment Risk",
        "Class & Rank Map",
        "Standstill & Enforcement Control",
        "Turnover, Release & Purchase Options",
    ),
}
# The document kinds (the launcher's own reading of each source, `read_documents`) a module's
# reader is not given. CP-4's reader takes the agreements, indentures and amendments.
NOT_READ: Mapping[str, frozenset[str]] = {"CP-4": frozenset({"financial_report"})}


def reader_documents(module: str, documents: Sequence[Mapping[str, Any]]) -> list[str]:
    """The page-text sources ``module``'s reader is given, in name order."""
    skipped = NOT_READ[module]
    return sorted(
        d["source"]
        for d in documents
        if d["source"].endswith(".jsonl") and d["kind"] not in skipped
    )


NOTES_RULE = (
    "First-pass reading notes. A separate reader went through each legal document once and "
    "noted, page by page, where its terms are. The notes are a finding aid, not a source: "
    "before you state a term, figure or date, read the cited page with `read_pages`, and cite "
    "the document and page, never the notes. A term the notes do not list may still be in the "
    "document. Where the notes and the page differ, the page governs."
)
_FIRST_LINE = re.compile(r"source: (.+) sha256 ([0-9a-f]{64})")
SUFFIX = ".notes.md"


class NotesRefused(ValueError):
    """A notes file that cannot be used for this run; nothing is written."""


def reader_brief(module: str) -> str:
    """What a first-pass reader of one document is told, for ``module``."""
    return (
        "You are a first-pass reader for a credit analyst who will study the governing debt "
        "documents of one issuer. You are given one document, page by page. Go through all of "
        "it and write notes that tell the analyst where things are. Start with three lines: what "
        "the document is (title, date, parties), whether it is executed, and what it amends or "
        "annexes. Then one line per entry: `p.<page> | <topic> | <what the page says, with the "
        "exact figure, ratio, date, percentage or party as written> | "
        '"<a few words quoted from the page>"`. '
        "Topics: " + "; ".join(READER_TOPICS[module]) + ". Where the text shows struck and "
        "inserted wording side by side, give the wording now in force and say the page is marked "
        "up. Record what the page says; do not interpret, compare or conclude. Write `none found` "
        "for a topic with no entry. At most 3,000 words."
    )


def notes_file(name: str, sha256: str, notes: str) -> str:
    """The text of one notes file: the source it is for, then the reader's notes."""
    return f"source: {name} sha256 {sha256}\n\n{notes.strip()}\n"


def notes_block(module: str, folder: Path, sources: Mapping[str, str]) -> str:
    """What follows ``module``'s instructions: the rule, then each document's notes in name
    order; empty when the folder holds none for the module. ``sources`` is each pinned source's
    sha256. Refuses notes for a source this run does not have, for another version of one it has,
    and a file with no notes."""
    files = sorted((folder / module).glob(f"*{SUFFIX}"))
    if module not in READER_TOPICS or not files:
        return ""
    parts = []
    for path in files:
        first, _, notes = path.read_text(encoding="utf-8").partition("\n")
        named = _FIRST_LINE.fullmatch(first)
        if named is None:
            raise NotesRefused(f"{path.name}: the first line must be `source: <name> sha256 <hex>`")
        name, sha256 = named[1], named[2]
        if sources.get(name) != sha256:
            raise NotesRefused(
                f"{path.name}: written for a version of {name} this run does not pin"
            )
        if not notes.strip():
            raise NotesRefused(f"{path.name}: holds no notes")
        parts.append(f"### Notes on {name}\n\n{notes.strip()}")
    return "\n" + NOTES_RULE + "\n\n" + "\n\n".join(parts) + "\n"


def without_notes(method_block: str) -> str:
    """The method block of a sent instruction with any reading notes after it removed."""
    return method_block.partition("\n" + NOTES_RULE)[0]
