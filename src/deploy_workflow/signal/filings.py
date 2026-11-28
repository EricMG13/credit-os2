"""Company filings: the SEC's per-company Atom feed as a Signal source of kind ``filing``.

The contact. The SEC refuses automated requests that do not say who is asking, so a filing source
is fetched only once the owner has set a contact string on the command line (``set_contact``:
printable ASCII, at most ``MAX_CONTACT`` characters, holding an email address). It is stored in
``service_settings`` and sent as the User-Agent of requests to ``SEC_HOST`` made for a filing
source (``fetch.Declared``), never to any other host; no snapshot or route reply carries it.

The rate. At most one filing fetch every ``SPACING`` seconds across every process on the store:
each fetch claims a slot one ``SPACING`` after the last one claimed (in a write transaction, so two
processes never claim the same slot) and waits for it (``claim_slot``). Each filing source is
checked at most every 10 minutes like any source, and a pass makes at most ``PER_PASS`` filing
fetches; the others are due at the next pass. The SEC publishes 10 requests a second as its limit.

A filing story (``story_entry``): the title "<Issuer>: <form>, <form name>" (the form name's first
letter lowered when its first word is an ordinary capitalised word), the stored summary "Form
<form>, filed <date>, accession number <number>." followed by the rest of the feed's summary, cut
as any summary is. The form is the entry's category term, else its title's part before " - ", each
only when usable (``MAX_FORM`` characters of plain text at most); an entry with neither has none:
its title is "<Issuer>: <entry title>" and its summary starts at the filing date.
"""

from __future__ import annotations

import re
import sqlite3
import time
import unicodedata
from dataclasses import replace
from datetime import UTC, datetime

from deploy_workflow.signal.feeds import Entry, shorten
from deploy_workflow.signal.fetch import Declared
from deploy_workflow.signal.store import (
    StoreError,
    _write_transaction,
    get_setting,
    set_setting,
)

SEC_HOST = "www.sec.gov"
SPACING = 1.0  # seconds between two filing fetches, whichever process makes them
PER_PASS = 30  # filing fetches one ingest pass makes at most
REWOUND = 300.0  # seconds: a stored slot further ahead than this is a clock set back
MAX_CONTACT = 200
MAX_FORM = 20  # characters of a form type ("SC 13G/A", "10-K405"); a longer one is none
CONTACT_KEY = "filings_contact"
_SLOT_KEY = "filing_slot"  # meta: the time (seconds since the epoch) of the last claimed slot
_PRINTABLE = re.compile(r"[\x20-\x7e]{1,200}")
_EMAIL = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
_FILED = re.compile(r"Filed:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})")
_ACCESSION = re.compile(r"AccNo:\s*([0-9]{10}-[0-9]{2}-[0-9]{6})")
# The feed summary's own header, "Filed: <date> AccNo: <number> Size: <n> KB", which the stored
# summary's first sentence replaces.
_HEADER = re.compile(r"^Filed:\s*\S+\s*(?:AccNo:\s*\S+\s*)?(?:Size:\s*[0-9.]+\s*[KMGT]?B\b\s*)?")
NO_CONTACT = (
    "Filings are not fetched: the SEC asks every automated client to say who is asking, and the"
    " owner has not set that contact on the command line."
)
WITH_CONTACT = (
    "Filings are fetched from the SEC at most once a second, saying who is asking with the"
    " contact the owner set on the command line."
)


def clean_contact(text: str) -> str:
    """The contact trimmed; StoreError unless it is plain ASCII of at most MAX_CONTACT characters
    holding an email address."""
    cleaned = text.strip()
    if not _PRINTABLE.fullmatch(cleaned) or not _EMAIL.search(cleaned):
        raise StoreError(
            "the contact is the organisation and an email address, such as"
            f' "Acme Credit research@acme.example", in at most {MAX_CONTACT} plain ASCII'
            " characters"
        )
    return cleaned


def contact(db: sqlite3.Connection) -> str | None:
    return get_setting(db, CONTACT_KEY)


def set_contact(db: sqlite3.Connection, text: str | None, now: datetime) -> None:
    """Store the owner's contact (None clears it)."""
    set_setting(db, CONTACT_KEY, None if text is None else clean_contact(text), now)


def declared(db: sqlite3.Connection) -> Declared | None:
    """Who a filing fetch says is asking, or None: no contact, so no filing is fetched."""
    held = contact(db)
    return None if held is None else Declared(SEC_HOST, held)


class Pace:
    """The clock and the wait the one-second spacing uses (wall time: it holds across processes)."""

    def clock(self) -> float:
        return time.time()

    def sleep(self, seconds: float) -> None:
        time.sleep(seconds)


def claim_slot(db: sqlite3.Connection, pace: Pace) -> None:
    """Wait for the next free slot: SPACING after the last one any process claimed. A stored slot
    more than REWOUND ahead of the clock was claimed before the clock was set back: it is passed
    over, so a fetch never waits more than the spacing for it."""
    with _write_transaction(db):
        now = pace.clock()
        row = db.execute("SELECT value FROM meta WHERE key=?", (_SLOT_KEY,)).fetchone()
        last = float(row["value"]) if row is not None else 0.0
        if last > now + REWOUND:
            last = 0.0
        slot = max(now, last + SPACING)
        db.execute("INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?)", (_SLOT_KEY, repr(slot)))
    pace.sleep(max(0.0, slot - now))


def _usable_form(text: str | None) -> str | None:
    """`text` as a form type: whitespace collapsed, at most MAX_FORM characters, no control or
    format character (a bidi override included); None otherwise."""
    held = " ".join((text or "").split())
    plain = not any(unicodedata.category(ch)[0] == "C" for ch in held)
    return held if held and len(held) <= MAX_FORM and plain else None


def form_of(entry: Entry) -> str | None:
    """The filing's form type: the entry's category, else its title's part before " - ", when
    usable (``_usable_form``); None when neither is."""
    return _usable_form(entry.category) or _usable_form(entry.title.partition(" - ")[0])


def _lowered(name: str) -> str:
    """The form name with its first letter lowered when its first word is an ordinary capitalised
    word ("Current report": "current report"; "SEC registration", "[Amend] ..." stay)."""
    first = name.split(" ", 1)[0]
    if len(first) > 1 and first[0].isupper() and first[1:].islower():
        return name[0].lower() + name[1:]
    return name


def _form_name(entry: Entry, form: str | None) -> str:
    head, dash, tail = entry.title.partition(" - ")
    if dash:
        return tail.strip() if form is not None else entry.title.strip()
    return "" if head.strip() == form else head.strip()


def _summary(entry: Entry, form: str | None) -> str:
    filed = _FILED.search(entry.summary)
    if filed is not None:
        date = filed.group(1)
    elif entry.published is not None:
        date = entry.published.astimezone(UTC).date().isoformat()
    else:
        date = None
    accession = _ACCESSION.search(entry.summary)
    said = ([f"Form {form}"] if form else []) + ([f"filed {date}"] if date else [])
    if accession:
        said.append(f"accession number {accession.group(1)}")
    head = ", ".join(said) + "." if said else ""
    head = head[:1].upper() + head[1:]  # "Filed 2026-11-24, ..." when there is no form
    rest = _HEADER.sub("", entry.summary) if filed is not None else entry.summary
    return shorten(f"{head} {rest}".strip())


def story_entry(issuer_name: str, entry: Entry) -> Entry:
    """The feed entry as a filing story: its title and summary (see the module docstring)."""
    form = form_of(entry)
    name = _form_name(entry, form)
    if form is None:
        title = f"{issuer_name}: {name}" if name else issuer_name
    else:
        title = f"{issuer_name}: {form}" + (f", {_lowered(name)}" if name else "")
    return replace(entry, title=title, summary=_summary(entry, form), category=form)
