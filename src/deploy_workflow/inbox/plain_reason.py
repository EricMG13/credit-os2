"""A stored run reason without the server's absolute paths, for every surface that serves one.

The stored record keeps the operating system's full text (it names the file); what a peer is sent
is cleaned here, where it is served.
"""

from __future__ import annotations

import os
import re

from deploy_workflow.inbox.layout import Layout

_PATH_START = r"(?P<start>^|[\s'\"(\[:=,;])"  # beginning of text, whitespace, a quote or bracket
_PATH_BODY = r"[^\s'\"()\[\],;]"  # a path runs to whitespace, a quote, a bracket, `,` or `;`
_ABSOLUTE = re.compile(
    _PATH_START
    + "(?P<path>"
    + rf"/(?!/){_PATH_BODY}+"  # POSIX: one leading slash (`//` follows a URL scheme's colon)
    + rf"|[A-Za-z]:[\\/]{_PATH_BODY}*"  # Windows drive, X:\ or X:/ (a doubled backslash is a run)
    + rf"|\\{{2,4}}{_PATH_BODY}+"  # UNC \\host\share, single or doubled spelling
    + ")"
)
# A quoted absolute path runs to its closing quote, so a space in a folder name does not end it.
_QUOTED = re.compile(
    r"(?P<q>['\"])(?P<path>(?:/(?!/)|[A-Za-z]:[\\/]|\\{2,4})(?:(?!(?P=q)).)*)(?P=q)"
)
_SEPARATORS = re.compile(r"[\\/]+")


def _name(path: str) -> str | None:
    """The last named segment of ``path``; None when it names nothing."""
    named = [p for p in _SEPARATORS.split(path) if p and not re.fullmatch(r"[A-Za-z]:", p)]
    return named[-1] if named else None


def _quoted_last_segment(found: re.Match[str]) -> str:
    name = _name(found["path"])
    return found["q"] + name + found["q"] if name else found[0]


def _last_segment(found: re.Match[str]) -> str:
    name = _name(found["path"])
    return found["start"] + name if name else found[0]


def plain_reason(root: str, sep: str, reason: str) -> str:
    """A reason with no absolute path: the service root is removed and any other path keeps its
    last segment.

    1. ``root`` plus a separator is removed where it starts a path, in plain and backslash-doubled
       form, leaving the path relative to the root.
    2. The bare root becomes ``the service folder``.
    3. Any absolute path left (POSIX, Windows drive, UNC) keeps only its last segment.

    A path starts at the beginning of the text or after whitespace, a quote, a bracket, ``:``,
    ``=``, ``,`` or ``;``. A URL, a fraction (``3/4``) and a relative path stay as stored.

    A quoted path runs to its closing quote, so a space in a folder name is handled there. An
    unquoted path stops at the first space: a folder name with a space in an unquoted path keeps
    its tail (a known limit; the text marks no end).
    """
    if root.rstrip(sep):
        prefix = root + sep
        for form in {prefix, prefix.replace("\\", "\\\\")}:
            reason = re.sub(rf"{_PATH_START}{re.escape(form)}", r"\g<start>", reason)
        for form in {root, root.replace("\\", "\\\\")}:
            # The bare root: at a path start, then the end, a delimiter, or a full stop that ends.
            bare = rf"{_PATH_START}{re.escape(form)}(?=$|[\s'\")\],;]|\.(?:$|\s))"
            reason = re.sub(bare, r"\g<start>the service folder", reason)
    return _ABSOLUTE.sub(_last_segment, _QUOTED.sub(_quoted_last_segment, reason))


def served_reason(layout: Layout, reason: str) -> str:
    """``reason`` with the service root removed and every other absolute path cut to its name."""
    return plain_reason(str(layout.root.resolve()), os.sep, reason)
