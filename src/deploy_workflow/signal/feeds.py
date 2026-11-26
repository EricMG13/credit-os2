"""Parse RSS 2.0 and Atom feed bytes into entries. Standard library only.

Feed bytes are untrusted: a DTD or entity declaration is refused before parsing, and
no article body is fetched; only the feed's own title, link, date and summary are read, of an
Atom entry its first category's term (the form type of an SEC EDGAR filing entry), and the image
address the feed declares for itself (``parse``: the source's logo, ``logos``). A line break or
block element in a summary's HTML separates the words on either side of it.
"""

import re
import unicodedata
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import urlsplit

SUMMARY_LIMIT = 300
_ATOM = "{http://www.w3.org/2005/Atom}"
_DTD = re.compile(rb"<!(DOCTYPE|ENTITY)", re.IGNORECASE)


_DTD_MESSAGE = "feed declares a DTD or entities"


class FeedError(ValueError):
    """The feed cannot be read; the message is shown to the owner."""


class _RefuseDoctype(ET.TreeBuilder):
    """Tree builder that refuses any doctype, whatever the body's encoding."""

    def doctype(self, name: str, pubid: str, system: str) -> None:
        raise FeedError(_DTD_MESSAGE)


@dataclass(frozen=True)
class Entry:
    title: str
    link: str
    published: datetime | None
    summary: str
    category: str | None = None  # an Atom entry's first <category term>, whitespace collapsed


_BREAKS = frozenset({"br", "p", "div", "li", "tr", "td", "th", "h1", "h2", "h3", "h4", "hr"})
CATEGORY_LIMIT = 60


class _TextOnly(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("script", "style"):
            self._skip += 1
        elif tag in _BREAKS:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style") and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip:
            self.parts.append(data)


def _summary(raw: str) -> str:
    parser = _TextOnly()
    parser.feed(raw)
    parser.close()
    return shorten("".join(parser.parts))


def shorten(plain: str) -> str:
    """Plain text with its whitespace collapsed, cut at a space to SUMMARY_LIMIT characters (at
    the limit when the first SUMMARY_LIMIT + 1 hold no space): the stored summary's rule."""
    text = " ".join(plain.split())
    if len(text) <= SUMMARY_LIMIT:
        return text
    head = text[: SUMMARY_LIMIT + 1]
    if " " not in head:
        return text[:SUMMARY_LIMIT]
    return head.rsplit(" ", 1)[0].rstrip()


def _utc(moment: datetime) -> datetime:
    # A date with no zone is read as UTC.
    if moment.tzinfo is None:
        return moment.replace(tzinfo=UTC)
    return moment.astimezone(UTC)


def _iso_date(text: str) -> datetime | None:
    try:
        return _utc(datetime.fromisoformat(text.strip()))
    except (ValueError, OverflowError):
        return None


# Zone names outside RFC 5322's list, as hours east of UTC. A name on no list (and an ambiguous
# one such as IST) leaves the entry undated, which then takes the fetch time.
_ZONE_HOURS = {
    "WET": 0, "WEST": 1, "BST": 1, "CET": 1, "CEST": 2, "EET": 2, "EEST": 3, "MSK": 3,
    "HKT": 8, "SGT": 8, "JST": 9, "KST": 9, "AEST": 10, "AEDT": 11, "NZST": 12, "NZDT": 13,
}  # fmt: skip
_ZONE_NAME = re.compile(r"(?<![A-Za-z])([A-Za-z]{2,5})\s*$")
_CLOCK_12 = re.compile(r"(?<![\d:])(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?(?![A-Za-z])")


def _clock_24(text: str) -> str | None:
    """``text`` with a 12-hour clock ("10:00 PM") rewritten as 24-hour ("22:00"); None when the
    hour is not 1 to 12. The email parser drops AM and PM, so it must never see them."""
    found = _CLOCK_12.search(text)
    if found is None:
        return text
    hour, minute, second, half = found.groups()
    if not 1 <= int(hour) <= 12:
        return None
    hour24 = int(hour) % 12 + (12 if half in "pP" else 0)
    clock = f"{hour24:02d}:{minute}" + (f":{second}" if second else "")
    return text[: found.start()] + clock + text[found.end() :]


def _rss_date(text: str) -> datetime | None:
    clock = _clock_24(text)
    if clock is None:
        return None
    try:
        moment = parsedate_to_datetime(clock)
        if moment.tzinfo is None:
            # No zone from the parser: none was written (read as UTC), or a name it does not know.
            name = _ZONE_NAME.search(clock)
            if name is not None:
                hours = _ZONE_HOURS.get(name.group(1).upper())
                if hours is None:
                    return None
                moment = moment.replace(tzinfo=timezone(timedelta(hours=hours)))
        return _utc(moment)
    except (ValueError, OverflowError):
        return _iso_date(text)


def _text(parent: ET.Element, tag: str) -> str:
    child = parent.find(tag)
    return "".join(child.itertext()).strip() if child is not None else ""


def _usable_link(link: str) -> bool:
    """An http(s) link whose host is present and whose port, if any, parses."""
    if not link.lower().startswith(("http://", "https://")):
        return False
    try:
        parts = urlsplit(link)
        return bool(parts.hostname) and (parts.port is None or parts.port > 0)
    except ValueError:
        return False


def _make(
    title: str, link: str, date: datetime | None, summary: str, category: str | None = None
) -> Entry | None:
    if not title or not _usable_link(link):
        return None
    return Entry(title, link, date, _summary(summary), category)


def _rss_entry(item: ET.Element) -> Entry | None:
    pub = _text(item, "pubDate")
    date = _rss_date(pub) if pub else None
    return _make(
        " ".join(_text(item, "title").split()),
        _text(item, "link"),
        date,
        _text(item, "description"),
    )


def _atom_link(entry: ET.Element) -> str:
    for link in entry.findall(f"{_ATOM}link"):
        if link.get("rel") in (None, "alternate"):
            return (link.get("href") or "").strip()
    return ""


def _atom_category(entry: ET.Element) -> str | None:
    """The entry's first category's term, whitespace collapsed; None when empty, too long, or
    holding a control or format character (a bidi override)."""
    found = entry.find(f"{_ATOM}category")
    term = " ".join((found.get("term") or "").split()) if found is not None else ""
    plain = not any(unicodedata.category(ch)[0] == "C" for ch in term)
    return term if term and len(term) <= CATEGORY_LIMIT and plain else None


def _atom_entry(entry: ET.Element) -> Entry | None:
    stamp = _text(entry, f"{_ATOM}published") or _text(entry, f"{_ATOM}updated")
    date = _iso_date(stamp) if stamp else None
    return _make(
        " ".join(_text(entry, f"{_ATOM}title").split()),
        _atom_link(entry),
        date,
        _text(entry, f"{_ATOM}summary"),
        _atom_category(entry),
    )


@dataclass(frozen=True)
class Parsed:
    """A feed's readable entries, in feed order, and the image address it declares (RSS
    ``<channel><image><url>``, else Atom ``<logo>``, else ``<icon>``; None when none is plain
    printable text of at most IMAGE_LIMIT characters). The address may be relative to the feed."""

    entries: list[Entry]
    image: str | None


IMAGE_LIMIT = 512
_IMAGE_TEXT = re.compile(r"[\x21-\x7e]{1,512}")


def _image(root: ET.Element) -> str | None:
    if root.tag == "rss":
        candidates = [root.findtext("channel/image/url")]
    else:
        candidates = [root.findtext(f"{_ATOM}logo"), root.findtext(f"{_ATOM}icon")]
    for text in candidates:
        held = (text or "").strip()
        if _IMAGE_TEXT.fullmatch(held):
            return held
    return None


def parse(body: bytes) -> Parsed:
    """The readable entries of an RSS 2.0 or Atom feed, in feed order, and its declared image."""
    # A server template's line break before `<?xml` is not part of the document (expat refuses a
    # declaration that is not at byte 0); a UTF-8 BOM and whitespace are dropped, a UTF-16 one kept.
    body = body.removeprefix(b"\xef\xbb\xbf").lstrip(b" \t\r\n")
    if _DTD.search(body):
        raise FeedError(_DTD_MESSAGE)
    try:
        parser = ET.XMLParser(target=_RefuseDoctype())
        parser.feed(body)
        root = parser.close()
    except ET.ParseError as exc:
        raise FeedError("feed is not valid XML") from exc
    except FeedError:
        raise
    except (ValueError, LookupError) as exc:
        raise FeedError(f"feed uses an unsupported text encoding ({exc})") from exc
    if root.tag == "rss":
        found = (_rss_entry(item) for item in root.findall("channel/item"))
    elif root.tag == f"{_ATOM}feed":
        found = (_atom_entry(entry) for entry in root.findall(f"{_ATOM}entry"))
    else:
        raise FeedError("document is neither an RSS 2.0 nor an Atom feed")
    return Parsed([entry for entry in found if entry is not None], _image(root))


def parse_feed(body: bytes) -> list[Entry]:
    """Return the readable entries of an RSS 2.0 or Atom feed, in feed order."""
    return parse(body).entries
