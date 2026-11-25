"""Display-text helpers every Signal view module shares: dates, ages, counts, initials, monograms.

A leaf module (it imports nothing from the Signal package), so ``snapshot`` and the view modules
it calls can all import it. Dates and the day boundaries behind "yesterday" are UTC.
"""

from __future__ import annotations

import unicodedata
from datetime import UTC, datetime

__all__ = [
    "ago",
    "capital",
    "clock",
    "day",
    "initials",
    "monogram",
    "plural",
    "shortened",
    "utc",
]

_MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
_ARTICLES = frozenset({"the", "a", "an"})


def utc(at: datetime) -> datetime:
    return at.astimezone(UTC)


def day(at: datetime, now: datetime) -> str:
    """A UTC date as "4 Nov", with the year when it is not `now`'s."""
    when = utc(at)
    text = f"{when.day} {_MONTHS[when.month - 1]}"
    return text if when.year == utc(now).year else f"{text} {when.year}"


def ago(at: datetime, now: datetime) -> str:
    """How long before `now`: "just now", "6 min ago", "2 h ago", "yesterday" or a date."""
    seconds = (now - at).total_seconds()
    if seconds < 60:
        return "just now"  # also a time a little ahead of `now` (another machine's clock)
    if seconds < 3600:
        return f"{int(seconds // 60)} min ago"
    if seconds < 86400:
        return f"{int(seconds // 3600)} h ago"
    if (utc(now).date() - utc(at).date()).days == 1:
        return "yesterday"
    return day(at, now)


def clock(at: datetime, now: datetime) -> str:
    """A comment's time: "10:02 UTC" today, "Yesterday 16:40 UTC", else "4 Nov 16:40 UTC"."""
    hours = utc(at).strftime("%H:%M")
    days = (utc(now).date() - utc(at).date()).days
    if days <= 0:
        return f"{hours} UTC"
    if days == 1:
        return f"Yesterday {hours} UTC"
    return f"{day(at, now)} {hours} UTC"


def capital(text: str) -> str:
    return text[:1].upper() + text[1:]


def plural(count: int, one: str, many: str) -> str:
    return f"{count} {one if count == 1 else many}"


def shortened(text: str, limit: int) -> str:
    """`text` as it is, or, past `limit` characters, cut at its last space within them (at
    `limit` when there is none) with an ellipsis."""
    if len(text) <= limit:
        return text
    head = text[:limit]
    cut = head.rsplit(" ", 1)[0] if " " in head else head
    return cut.rstrip() + "\u2026"


def _first_marks(words: list[str]) -> str:
    """The first letter or digit of each of the first two words that have one, upper case."""
    marks = []
    for word in words:
        found = next((ch for ch in word if unicodedata.category(ch)[0] in "LN"), None)
        if found is not None:
            marks.append(found)
    return "".join(marks[:2]).upper()


def initials(name: str) -> str:
    """A viewer's initials as the React name dialog makes them; "?" when the name has none."""
    return _first_marks(name.split()) or "?"


def monogram(name: str) -> str:
    """A publication's tile: its initials, a leading article left out ("The Meridian Post": MP)."""
    words = name.split()
    if len(words) > 1 and words[0].casefold() in _ARTICLES:
        words = words[1:]
    return _first_marks(words) or "?"
