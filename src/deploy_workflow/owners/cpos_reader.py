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
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Reader:
    """What one module's first-pass reader is told and given."""

    study: str  # what the analyst the reader works for will do
    opening: str  # the lines every set of notes starts with
    # The step titles of the module's own method whose subject is in the documents, word for
    # word: the reader is told what the module looks for and nothing else.
    topics: tuple[str, ...]
    kinds: frozenset[str] | None  # the document kinds read (`read_documents`); None: not these
    not_kinds: frozenset[str] = frozenset()
    noun: str = "document"


_REPORTS = frozenset({"financial_report"})
_REPORT_OPENING = (
    "Start with two lines: what the document is (title, date, issuer) and the period it covers."
)
# CP-4's reader is the one group D of the instruction-length trial ran (2026-11-25). The others
# were added on the owner's instruction ("add D to the other modules") and have not been run.
# CP-6 has none: no step of its method is about what a source document says.
READERS: Mapping[str, Reader] = {
    "CP-0": Reader(
        "check the source documents of one issuer for readiness",
        _REPORT_OPENING,
        (
            "Originals, entity/period/version relationships and duplicates",
            "Document profile",
            "Text, tables, charts, clauses, locators and coverage",
        ),
        None,
    ),
    "CP-1": Reader(
        "build the financial data of one issuer from its reports",
        _REPORT_OPENING,
        (
            "Entity Period Scope",
            "Income Statement Coverage",
            "Cash Flow Statement Coverage",
            "Balance Sheet Coverage",
            "Derived Period Construction",
            "Definition Conflict Register",
        ),
        _REPORTS,
    ),
    "CP-2": Reader(
        "form a fundamental credit view of one issuer from its reports",
        _REPORT_OPENING,
        (
            "Company Description",
            "Ownership & Group Structure",
            "Key Strengths & Weaknesses Summary",
            "Financial Profile & Credit Quality",
            "Outlook, Tailwinds & Headwinds",
            "Monitoring Triggers",
        ),
        _REPORTS,
    ),
    "CP-3": Reader(
        "compare the debt instruments of one issuer",
        _REPORT_OPENING,
        (
            "Capital Structure Dashboard",
            "Instrument Matrix",
            "Structural Positioning Log",
            "Legal / Covenant and LME Overlay",
            "Recovery Sensitivity by Instrument",
        ),
        None,
    ),
    "CP-4": Reader(
        "study the governing debt documents of one issuer",
        "Start with three lines: what the document is (title, date, parties), whether it is "
        "executed, and what it amends or annexes.",
        (
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
        None,
        _REPORTS,
        "legal document",
    ),
    "CP-5": Reader(
        "audit claims made about one issuer against its documents",
        _REPORT_OPENING,
        (
            "Source Lineage Register",
            "Calculation and Assumption Register",
            "Legal / Structural Claim Audit",
            "Relative Value / Market Claim Audit",
        ),
        None,
    ),
}
READER_TOPICS: Mapping[str, tuple[str, ...]] = {m: r.topics for m, r in READERS.items()}


def reader_documents(module: str, documents: Sequence[Mapping[str, Any]]) -> list[str]:
    """The page-text sources ``module``'s reader is given, in name order."""
    reader = READERS[module]
    return sorted(
        d["source"]
        for d in documents
        if d["source"].endswith(".jsonl")
        and d["kind"] not in reader.not_kinds
        and (reader.kinds is None or d["kind"] in reader.kinds)
    )


_RULE_OPENS = "First-pass reading notes. A separate reader went through each "


def notes_rule(module: str) -> str:
    """The rule a module is given with its notes."""
    return (
        f"{_RULE_OPENS}{READERS[module].noun} once and "
        "noted, page by page, where its terms are. The notes are a finding aid, not a source: "
        "before you state a term, figure or date, read the cited page with `read_pages`, and cite "
        "the document and page, never the notes. A term the notes do not list may still be in the "
        "document. Where the notes and the page differ, the page governs."
    )


NOTES_RULE = notes_rule("CP-4")  # as group D of the trial was given it
_FIRST_LINE = re.compile(r"source: (.+) sha256 ([0-9a-f]{64})")
SUFFIX = ".notes.md"


class NotesRefused(ValueError):
    """A notes file that cannot be used for this run; nothing is written."""


def reader_brief(module: str) -> str:
    """What a first-pass reader of one document is told, for ``module``."""
    reader = READERS[module]
    return (
        f"You are a first-pass reader for a credit analyst who will {reader.study}. You are "
        "given one document, page by page. Go through all of "
        f"it and write notes that tell the analyst where things are. {reader.opening} "
        "Then one line per entry: `p.<page> | <topic> | <what the page says, with the "
        "exact figure, ratio, date, percentage or party as written> | "
        '"<a few words quoted from the page>"`. '
        "Topics: " + "; ".join(reader.topics) + ". Where the text shows struck and "
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
    if module not in READERS or not files:
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
    return "\n" + notes_rule(module) + "\n\n" + "\n\n".join(parts) + "\n"


def without_notes(method_block: str) -> str:
    """The method block of a sent instruction with any reading notes after it removed."""
    return method_block.partition("\n" + _RULE_OPENS)[0]
