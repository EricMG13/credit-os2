"""A Word document's (.docx) text, for an issuer folder.

Body paragraphs in document order, each table row as its cells joined by `` | ``, tabs and line
breaks kept. A text box is read once (its ``mc:Choice``, else its fallback); a
non-breaking hyphen is ``-``.
Text a tracked change deleted (``w:delText``) is left out; headers, footers, footnotes
and comments are not read. Standard library only, through the workbook reader's guarded XML parse
(no DTD or entity declaration) and its expanded-size limit. Nothing in the file is run or followed.
"""

from __future__ import annotations

import io
from collections.abc import Iterator
from xml.etree.ElementTree import Element
from zipfile import ZipFile

from deploy_vii.preparation import MAX_EXPANDED_BYTES, xml_part

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}"
_BOX = "\0"  # marks a text-box paragraph's edges; NUL cannot occur in parsed XML text
_BREAKS = frozenset({f"{W}br", f"{W}cr"})
# Paragraph and run properties hold formatting, including <w:tab> tab stops, never text.
_PROPERTIES = frozenset({f"{W}pPr", f"{W}rPr"})


def docx_text(raw: bytes) -> str:
    """The text of the Word document ``raw``; raises on a file that is not one."""
    with ZipFile(io.BytesIO(raw)) as archive:
        infos = archive.infolist()
        if len({info.filename for info in infos}) != len(infos):
            raise ValueError("duplicate ZIP members")
        if sum(info.file_size for info in infos) > MAX_EXPANDED_BYTES:
            raise ValueError("expanded document exceeds the extraction limit")
        if "word/document.xml" not in archive.namelist():
            raise ValueError("the file has no word/document.xml part")
        body = xml_part(archive, "word/document.xml").find(f"{W}body")
    if body is None:
        raise ValueError("the document has no body")
    return "\n".join(_lines(body))


def _through(parent: Element) -> Iterator[Element]:
    """The children of ``parent``, looking through custom-XML and content-control wrappers."""
    for child in parent:
        if child.tag == f"{W}customXml":
            yield from _through(child)
        elif child.tag == f"{W}sdt":
            if (content := child.find(f"{W}sdtContent")) is not None:
                yield from _through(content)
        else:
            yield child


def _lines(parent: Element) -> Iterator[str]:
    for child in _through(parent):
        if child.tag == f"{W}p":
            yield _paragraph(child)
        elif child.tag == f"{W}tbl":
            for row in (r for r in _through(child) if r.tag == f"{W}tr"):
                cells = [c for c in _through(row) if c.tag == f"{W}tc"]
                yield " | ".join(
                    " ".join(_paragraph(p, " ") for p in _paragraphs(c)) for c in cells
                )


def _paragraphs(node: Element) -> Iterator[Element]:
    """The paragraphs under ``node`` that are not inside another paragraph, in document order
    (a text box's paragraphs are read as part of the paragraph that holds the box)."""
    pending = [iter(node)]
    while pending:
        for child in pending[-1]:
            if child.tag == f"{W}p":
                yield child
            else:
                pending.append(iter(child))
                break
        else:
            pending.pop()


def _paragraph(paragraph: Element, separator: str = "\n") -> str:
    """The paragraph's text. Paragraphs inside its text boxes are set apart from the anchor text
    and from each other by ``separator`` (the module's paragraph separator in this context)."""
    parts: list[str] = []
    _collect(paragraph, parts)
    if _BOX in parts:
        return separator.join(p for p in "".join(parts).split(_BOX) if p)
    return "".join(parts)


def _collect(node: Element, parts: list[str]) -> None:
    for child in node:
        if child.tag == f"{W}p":
            parts.append(_BOX)
            _collect(child, parts)
            parts.append(_BOX)
        elif child.tag == f"{W}t":
            parts.append(child.text or "")
        elif child.tag == f"{W}tab":
            parts.append("\t")
        elif child.tag in _BREAKS:
            parts.append("\n")
        elif child.tag == f"{W}noBreakHyphen":
            parts.append("-")  # plain ASCII, as tabs and breaks are plain \t and \n
        elif child.tag == f"{MC}AlternateContent":
            # The Choice is the current rendering, the Fallback a copy of it for old readers.
            chosen = child.find(f"{MC}Choice")
            _collect(chosen if chosen is not None else child, parts)
        elif child.tag not in _PROPERTIES:
            _collect(child, parts)
