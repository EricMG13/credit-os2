"""Company filings as a Signal source: the EDGAR Atom format through the feed parser, a filing
story's title and summary, the contact string the SEC asks for (sent only to www.sec.gov, only for a
filing source), the one-second spacing of filing fetches, and the rule that nothing is fetched from
a source the owner has not approved.

Every EDGAR document here is SYNTHETIC: written by hand in the format of the SEC's per-company Atom
feed as its published examples show it (entries with a ``<category term="8-K" label="form type">``,
a ``<title>8-K  - Current report</title>``, a link, an updated time and an HTML summary). None is a
recorded SEC response, and nothing here touches a network: fetches go to fakes."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from test_signal_fetch import PUBLIC, Reply, Wire, redirect

from deploy_workflow.signal import filings, ingest, issuers, store
from deploy_workflow.signal.feeds import Entry, parse_feed
from deploy_workflow.signal.fetch import USER_AGENT, Declared, Fetched, FetchRefused, Wiring, fetch
from deploy_workflow.signal.issuers import Form
from deploy_workflow.signal.store import StoreError, open_db

NOW = datetime(2026, 11, 25, 9, 0, tzinfo=UTC)
CONTACT = "Acme Credit Research research@acme.example"
ALTICE_URL = (
    "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001702780&type=&dateb="
    "&owner=include&count=40&output=atom"
)

# SYNTHETIC, in the format of EDGAR's per-company Atom feed (not a recorded response). "{data}"
# stands for the filer's archive folder; line breaks between attributes and inside the summary are
# whitespace to XML and to the parser.
DATA = "https://www.sec.gov/Archives/edgar/data/1702780"
EDGAR_TEXT = """<?xml version="1.0" encoding="ISO-8859-1" ?>
<feed xmlns="http://www.w3.org/2005/Atom">
<author><email>webmaster@sec.gov</email><name>Webmaster</name></author>
<company-info>
<conformed-name>SYNTHETIC ISSUER INC</conformed-name>
<cik>0001702780</cik>
</company-info>
<id>urn:tag:sec.gov,2008:company=0001702780</id>
<link href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany"
 rel="alternate" type="text/html" />
<title>SYNTHETIC ISSUER INC  (0001702780)</title>
<updated>2026-11-25T03:10:00-05:00</updated>
<entry>
<category label="form type" scheme="https://www.sec.gov/" term="8-K" />
<content type="text/xml">
<accession-number>0001193125-26-123456</accession-number>
<filing-date>2026-11-24</filing-date>
<filing-type>8-K</filing-type>
<form-name>Current report</form-name>
</content>
<id>urn:tag:sec.gov,2008:accession-number=0001193125-26-123456</id>
<link href="{data}/000119312526123456/0001193125-26-123456-index.htm"
 rel="alternate" type="text/html" />
<summary type="html"> &lt;b&gt;Filed:&lt;/b&gt; 2026-11-24 &lt;b&gt;AccNo:&lt;/b&gt;
 0001193125-26-123456 &lt;b&gt;Size:&lt;/b&gt; 312 KB&lt;br&gt;Item 2.02: Results of
 Operations and Financial Condition&lt;br&gt;Item 9.01: Financial Statements and Exhibits</summary>
<title>8-K  - Current report</title>
<updated>2026-11-24T16:05:12-05:00</updated>
</entry>
<entry>
<category label="form type" scheme="https://www.sec.gov/" term="10-Q" />
<id>urn:tag:sec.gov,2008:accession-number=0001702780-26-000041</id>
<link href="{data}/000170278026000041/0001702780-26-000041-index.htm"
 rel="alternate" type="text/html" />
<summary type="html"> &lt;b&gt;Filed:&lt;/b&gt; 2026-11-06 &lt;b&gt;AccNo:&lt;/b&gt;
 0001702780-26-000041 &lt;b&gt;Size:&lt;/b&gt; 9 MB</summary>
<title>10-Q  - Quarterly report [Sections 13 or 15(d)]</title>
<updated>2026-11-06T17:30:00-05:00</updated>
</entry>
<entry>
<category label="form type" scheme="https://www.sec.gov/" term="SC 13G/A" />
<id>urn:tag:sec.gov,2008:accession-number=0000950123-26-000777</id>
<link href="{data}/000095012326000777/0000950123-26-000777-index.htm"
 rel="alternate" type="text/html" />
<summary type="html"> &lt;b&gt;Filed:&lt;/b&gt; 2026-10-30 &lt;b&gt;AccNo:&lt;/b&gt;
 0000950123-26-000777 &lt;b&gt;Size:&lt;/b&gt; 14 KB</summary>
<title>SC 13G/A  - [Amend] Statement of acquisition of beneficial ownership by individuals</title>
<updated>2026-10-30T09:00:00-04:00</updated>
</entry>
</feed>
"""
EDGAR_ATOM = EDGAR_TEXT.replace("{data}", DATA).encode("iso-8859-1")


# The feed parser reads EDGAR's Atom


def test_the_parser_reads_each_synthetic_edgar_entry_with_its_form_type():
    entries = parse_feed(EDGAR_ATOM)
    assert [(e.category, e.title) for e in entries] == [
        ("8-K", "8-K - Current report"),
        ("10-Q", "10-Q - Quarterly report [Sections 13 or 15(d)]"),
        (
            "SC 13G/A",
            ("SC 13G/A - [Amend] Statement of acquisition of beneficial ownership by individuals"),
        ),
    ]
    first = entries[0]
    assert first.link == (
        "https://www.sec.gov/Archives/edgar/data/1702780/000119312526123456/"
        "0001193125-26-123456-index.htm"
    )
    assert first.published == datetime(2026, 11, 24, 21, 5, 12, tzinfo=UTC)  # 16:05 at UTC-5
    # A line break in the summary's HTML separates its text, so words are not run together.
    assert first.summary == (
        "Filed: 2026-11-24 AccNo: 0001193125-26-123456 Size: 312 KB Item 2.02: Results of"
        " Operations and Financial Condition Item 9.01: Financial Statements and Exhibits"
    )


def test_an_rss_items_category_is_not_read_and_an_atom_entry_without_one_has_none():
    rss = (
        b"<rss><channel><item><title>T</title><link>https://a.example/1</link>"
        b"<category>Ignored</category></item></channel></rss>"
    )
    assert parse_feed(rss)[0].category is None
    atom = (
        b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>T</title>'
        b'<link href="https://a.example/1"/><category term="  "/></entry></feed>'
    )
    assert parse_feed(atom)[0].category is None


# A filing story's title and summary


def _entry(title: str, summary: str = "", category: str | None = None) -> Entry:
    when = datetime(2026, 11, 24, 21, 5, tzinfo=UTC)
    return Entry(title, "https://www.sec.gov/x-index.htm", when, summary, category)


@pytest.mark.parametrize(
    ("entry", "title"),
    [
        (_entry("8-K - Current report", category="8-K"), "Altice USA: 8-K, current report"),
        (
            _entry("10-Q - Quarterly report [Sections 13 or 15(d)]", category="10-Q"),
            "Altice USA: 10-Q, quarterly report [Sections 13 or 15(d)]",
        ),
        (
            _entry("SC 13G/A - [Amend] Statement of acquisition", category="SC 13G/A"),
            "Altice USA: SC 13G/A, [Amend] Statement of acquisition",
        ),
        (_entry("8-K - Current report"), "Altice USA: 8-K, current report"),  # form from title
        (_entry("8-K", category="8-K"), "Altice USA: 8-K"),
        (
            _entry("Notice of effectiveness", category="EFFECT"),
            "Altice USA: EFFECT, notice of effectiveness",
        ),
        (_entry("S-1 - SEC registration", category="S-1"), "Altice USA: S-1, SEC registration"),
        (_entry("4 - A statement", category="4"), "Altice USA: 4, A statement"),
    ],
)
def test_a_filing_story_is_titled_issuer_form_and_form_name(entry, title):
    assert filings.story_entry("Altice USA", entry).title == title


def test_a_filing_storys_summary_keeps_the_form_type_filing_date_and_accession_number():
    first = filings.story_entry("Altice USA", parse_feed(EDGAR_ATOM)[0])
    assert first.summary == (
        "Form 8-K, filed 2026-11-24, accession number 0001193125-26-123456. Item 2.02: Results of"
        " Operations and Financial Condition Item 9.01: Financial Statements and Exhibits"
    )
    assert first.link.endswith("0001193125-26-123456-index.htm")
    assert first.category == "8-K"


def test_a_summary_with_no_filed_line_takes_the_date_of_the_entry_and_is_cut_at_300():
    bare = filings.story_entry("Altice USA", _entry("8-K - Current report", "", "8-K"))
    assert bare.summary == "Form 8-K, filed 2026-11-24."
    long = filings.story_entry(
        "Altice USA", _entry("8-K - Current report", "Item " + "word " * 100, "8-K")
    )
    assert len(long.summary) <= 300 and long.summary.startswith("Form 8-K, filed 2026-11-24. Item")
    assert not long.summary.endswith(" ")


def test_the_form_type_is_the_filing_storys_first_tag():
    assert filings.form_of(_entry("8-K - Current report", category="8-K")) == "8-K"
    assert filings.form_of(_entry("10-K - Annual report")) == "10-K"


# The contact string


@pytest.mark.parametrize(
    "text",
    [
        "",
        "Acme Credit",  # no email address
        "research@acme.example\r\nX-Injected: 1",
        "Acmé Credit research@acme.example",  # not ASCII
        "A" * 190 + " r@acme.example",  # over 200 characters
    ],
)
def test_a_contact_that_is_not_an_organisation_and_an_email_is_refused(tmp_path, text):
    db = open_db(tmp_path)
    with pytest.raises(StoreError, match="the contact is the organisation and an email address"):
        filings.set_contact(db, text, NOW)
    assert filings.contact(db) is None
    db.close()


def test_the_contact_is_stored_trimmed_and_can_be_cleared(tmp_path):
    db = open_db(tmp_path)
    filings.set_contact(db, f"  {CONTACT} ", NOW)
    assert filings.contact(db) == CONTACT
    filings.set_contact(db, None, NOW)
    assert filings.contact(db) is None
    db.close()


# The contact goes as the User-Agent to www.sec.gov only


SEC = Declared("www.sec.gov", CONTACT)


def _fetch(wire: Wire, url: str, declared: Declared | None) -> Fetched:
    return fetch(url, None, None, resolve=PUBLIC, wiring=Wiring(connect=wire), declared=declared)


def test_a_filing_fetch_sends_the_contact_as_its_user_agent_to_www_sec_gov():
    wire = Wire(Reply(200, EDGAR_ATOM))
    _fetch(wire, ALTICE_URL, SEC)
    ((path, headers),) = wire.requests
    assert headers["User-Agent"] == CONTACT and headers["Host"] == "www.sec.gov"
    assert path.startswith("/cgi-bin/browse-edgar?action=getcompany&CIK=0001702780")


def test_a_redirect_off_www_sec_gov_gets_the_ordinary_user_agent():
    wire = Wire(redirect("https://efts.sec.gov/feed"), Reply(200, EDGAR_ATOM))
    _fetch(wire, ALTICE_URL, SEC)
    assert [headers["User-Agent"] for _, headers in wire.requests] == [CONTACT, USER_AGENT]
    assert [headers["Host"] for _, headers in wire.requests] == ["www.sec.gov", "efts.sec.gov"]


def test_another_host_never_gets_the_contact_even_when_one_is_declared():
    wire = Wire(Reply(200, EDGAR_ATOM))
    _fetch(wire, "https://feeds.example.org/sec.gov", SEC)
    assert wire.requests[0][1]["User-Agent"] == USER_AGENT
    plain = Wire(Reply(200, EDGAR_ATOM))
    _fetch(plain, ALTICE_URL, None)
    assert plain.requests[0][1]["User-Agent"] == USER_AGENT


def test_a_declared_contact_with_a_line_break_is_refused_before_any_request():
    wire = Wire(Reply(200, EDGAR_ATOM))
    with pytest.raises(FetchRefused, match="the declared contact is not plain text"):
        _fetch(wire, ALTICE_URL, Declared("www.sec.gov", "a@b.example\r\nX: 1"))
    assert wire.requests == []


# The ingest pass and filing sources


class Recorder:
    """A fetch function that answers every address with the synthetic EDGAR document and records
    what it was asked, with the declared contact."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, Declared | None]] = []

    def __call__(
        self, url: str, etag: str | None, modified: str | None, *, declared: Declared | None = None
    ) -> Fetched:
        self.calls.append((url, declared))
        return Fetched(EDGAR_ATOM, None, None)


class FakePace(filings.Pace):
    def __init__(self) -> None:
        self.now = 5000.0
        self.waits: list[float] = []

    def clock(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.waits.append(seconds)
        self.now += seconds


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    held = open_db(tmp_path)
    yield held
    held.close()


def _issuer(db: sqlite3.Connection, name: str, cik: str, *, approve: bool = True) -> int:
    made = issuers.add_issuer(db, Form(name, cik=cik), "Mara L")
    source = issuers.get(db, made).source_id
    assert source is not None
    if approve:
        store.set_source_state(db, source, "approved")
    return source


def _pass(db: sqlite3.Connection, fetcher: Any, pace: filings.Pace | None = None) -> Any:
    return ingest.run_due(db, NOW, fetcher, pace=pace or FakePace())


def test_with_no_contact_no_filing_source_is_fetched_and_no_check_is_recorded(db):
    _issuer(db, "Altice USA", "0001702780")
    recorder = Recorder()
    assert _pass(db, recorder) == []
    assert recorder.calls == []
    assert db.execute("SELECT COUNT(*) FROM source_checks").fetchone()[0] == 0


def test_a_proposed_or_paused_filing_source_is_never_fetched(db):
    filings.set_contact(db, CONTACT, NOW)
    _issuer(db, "Altice USA", "0001702780", approve=False)
    paused = _issuer(db, "Apple", "0000320193")
    store.set_source_state(db, paused, "paused")
    recorder = Recorder()
    _pass(db, recorder)
    assert recorder.calls == []


def test_an_approved_filing_source_is_fetched_with_the_contact_and_its_stories_shaped(db):
    filings.set_contact(db, CONTACT, NOW)
    source = _issuer(db, "Altice USA", "0001702780")
    recorder = Recorder()
    assert _pass(db, recorder) == [(source, True, "3 new")]
    assert recorder.calls == [(ALTICE_URL, Declared("www.sec.gov", CONTACT))]
    titles = [row[0] for row in db.execute("SELECT title FROM stories ORDER BY published_at DESC")]
    assert titles == [
        "Altice USA: 8-K, current report",
        "Altice USA: 10-Q, quarterly report [Sections 13 or 15(d)]",
        (
            "Altice USA: SC 13G/A, [Amend] Statement of acquisition of beneficial ownership by"
            " individuals"
        ),
    ]
    linked = db.execute("SELECT COUNT(*) FROM issuer_stories WHERE issuer_id=1").fetchone()[0]
    assert linked == 3


def test_an_ordinary_source_is_never_given_the_contact(db):
    filings.set_contact(db, CONTACT, NOW)
    wire = store.propose_source(db, "Wire", "news", "https://wire.example/rss", "Mara L")
    store.set_source_state(db, wire, "approved")
    recorder = Recorder()
    _pass(db, recorder)
    assert recorder.calls == [("https://wire.example/rss", None)]


def test_filing_fetches_are_a_second_apart_and_at_most_thirty_a_pass(db):
    filings.set_contact(db, CONTACT, NOW)
    for number in range(32):
        _issuer(db, f"Issuer number {number}", f"{number + 1:010d}")
    pace = FakePace()
    recorder = Recorder()
    _pass(db, recorder, pace)
    assert len(recorder.calls) == 30  # the other two wait for the next pass
    assert pace.waits == [0.0] + [1.0] * 29
    later = ingest.run_due(db, NOW + timedelta(minutes=1), recorder, pace=pace)
    assert len(later) == 2 and len(recorder.calls) == 32


def test_the_one_second_spacing_holds_across_processes_through_the_store(db):
    first, second = FakePace(), FakePace()
    filings.claim_slot(db, first)
    filings.claim_slot(db, second)  # another process on the same store, at the same moment
    filings.claim_slot(db, second)
    assert first.waits == [0.0] and second.waits == [1.0, 1.0]


def test_a_filing_source_whose_issuer_is_gone_is_not_fetched(db):
    filings.set_contact(db, CONTACT, NOW)
    source = _issuer(db, "Altice USA", "0001702780")
    store.set_source_state(db, source, "approved")
    with db:
        db.execute("UPDATE issuers SET source_id=NULL")  # unlinked; approved again by hand
    recorder = Recorder()
    _pass(db, recorder)
    assert recorder.calls == []


def test_a_clock_set_back_never_makes_a_filing_fetch_wait_past_its_spacing(db):
    """Doubt: the slot is wall time; a clock set back an hour would leave the stored slot an hour
    ahead, and the next fetch would sleep that hour, holding the ingest loop."""
    ahead, back = FakePace(), FakePace()
    filings.claim_slot(db, ahead)
    back.now = ahead.now - 3600  # the machine's clock was set back an hour
    filings.claim_slot(db, back)
    filings.claim_slot(db, back)
    assert back.waits == [0.0, 1.0]
