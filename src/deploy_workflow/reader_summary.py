"""Read the Reader summary tables of an earlier-format handoff (the library still shows them)."""

import re

HEADING = re.compile(r"^### Reader summary[ \t]*$", re.MULTILINE)
NEXT_HEADING = re.compile(r"^#{2,3} ", re.MULTILINE)
TABLES = (
    ("Bottom line", "Confidence", "Main limitation"),
    ("Finding", "Creditor impact", "Confidence"),
)


def _cells(line: str) -> list[str]:
    return [cell.strip() for cell in re.split(r"(?<!\\)\|", line.strip()[1:-1])]


# A separator or blank row: every cell empty or made of dashes with a colon or at least two dashes
# (`---`, `:--:`); a single `-` is a cell's content.
_RULE_CELL = re.compile(r"(?::-*:?|-+:|-{2,})?")
# The row directly under a table's header is its delimiter when every cell is `:?-+:?` (`-` too).
_DELIMITER_CELL = re.compile(r":?-+:?")


def _tables(section: str) -> list[list[list[str]]]:
    """The tables of a section; a separator or blank row never starts one."""
    tables: list[list[list[str]]] = []
    in_table = False
    header_only = False  # the table so far is its header: the next row may be its delimiter
    for line in section.splitlines():
        is_row = line.lstrip().startswith("|") and line.rstrip().endswith("|")
        if is_row:
            cells = _cells(line)
            delimiter = header_only and all(_DELIMITER_CELL.fullmatch(cell) for cell in cells)
            header_only = False
            if delimiter or all(_RULE_CELL.fullmatch(cell) for cell in cells):
                continue
            if not in_table:
                tables.append([])
                header_only = True
            tables[-1].append(cells)
        in_table = is_row
    return tables


def _bounds(text: str, heading: re.Match[str]) -> tuple[int, int]:
    """Where the section under ``heading`` starts and ends: at the next level-2 or -3 heading."""
    following = NEXT_HEADING.search(text, heading.end())
    return heading.end(), following.start() if following else len(text)


def reader_tables(text: str) -> list[list[list[str]]]:
    """The tables under the handoff's one ``### Reader summary``, header rows included.

    Empty when the heading is missing or repeated.
    """
    text = text.replace("\r\n", "\n")
    headings = list(HEADING.finditer(text))
    if len(headings) != 1:
        return []
    start, end = _bounds(text, headings[0])
    return _tables(text[start:end])
