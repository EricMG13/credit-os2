"""Shared inline HTML comment scanning for retained Markdown readers."""

import re

_CODE_SPAN = re.compile(r"(`+).+?\1")


def inline_comments(line: str) -> tuple[str, bool]:
    """Return text outside complete comments and whether a comment remains open."""
    kept = ""
    while True:
        masked = _CODE_SPAN.sub(lambda match: "x" * len(match[0]), line)
        opener = masked.find("<!--")
        if opener < 0:
            return kept + line, False
        if masked.startswith(">", opener + 4):
            end = opener + 5
        elif masked.startswith("->", opener + 4):
            end = opener + 6
        elif (closer := masked.find("-->", opener + 4)) >= 0:
            end = closer + 3
        else:
            return kept + line[:opener], True
        kept, line = kept + line[:opener], line[end:]
