"""The snapshot's two delivered formats, each read by the real React reader as it is today.

Format 1 (no ``format``) is what the reader accepted before it knew the new kinds, and still
accepts: no filing or market story, no thread naming one, no issuer data, and every count over the
stories it delivers. Format 2 adds the new kinds and keys, and the reader now accepts it whole
(it is what the page asks for).

The store holds every kind: news and regulator stories, filing stories from a SYNTHETIC EDGAR Atom
document (``test_signal_filings.EDGAR_ATOM``, written by hand in the SEC's format, not a recorded
response), and a market post from SYNTHETIC FRED CSVs (``test_signal_market``). Nothing touches a
network. Expected values are written by hand."""

from __future__ import annotations

import json
import sqlite3
import time
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)
from test_signal_filings import EDGAR_ATOM, FakePace
from test_signal_group_bounds import LETTER, _long, _seed_groups, _seed_sources, _seed_stories
from test_signal_market import BODIES, SERIES, Fred

from deploy_workflow.signal import (
    digests,
    feedview,
    filings,
    groups,
    ingest,
    issuers,
    market,
    snapshot,
    store,
    threads,
    topics,
)
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.fetch import Fetched
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.issuers import Form
from deploy_workflow.signal.store import open_db

NOW = datetime(2026, 11, 25, 9, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")
TOBIAS = User("Tobias O", "reader")
CAP = 3 * 1024 * 1024


def _sec_only(url: str, etag: str | None, modified: str | None, *, declared: Any = None) -> Fetched:
    assert url.startswith("https://www.sec.gov/")
    return Fetched(EDGAR_ATOM, None, None)


def _story(db: sqlite3.Connection, source: int, title: str, hours: int) -> int:
    when = NOW - timedelta(hours=hours)
    link = f"https://wire.example/{hours}"
    assert store.add_story(db, source, Entry(title, link, when, ""), when) == "new"
    story = int(db.execute("SELECT id FROM stories WHERE link=?", (link,)).fetchone()[0])
    topics.match_story(db, story)
    return story


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    """Stories 1 (news, 08:00) and 2 (regulator, 07:00); filing stories 3 to 5; market post 6.
    Tobias O follows topic 2 and issuer 1, saves stories 1 and 3, and is in the group Desk, where
    stories 1 and 3 are shared."""
    held = open_db(tmp_path)
    wire = store.propose_source(held, "Wire", "news", "https://wire.example/rss", "Mara L")
    authority = store.propose_source(
        held, "Competition Authority", "regulator", "https://authority.example/rss", "Mara L"
    )
    topics.add_topic(held, "Altice", ["Altice"], [], "Mara L")
    topics.add_topic(held, "Wire news", ["bonds"], ["news"], "Mara L")
    form = Form("Altice USA", ("ATUS",), "0001702780", "id:altice")
    issuers.add_issuer(held, form, "Mara L")  # source 3, its filings
    store.set_source_state(held, 3, "approved")
    assert _story(held, wire, "Altice USA bonds fall", 1) == 1
    assert _story(held, authority, "Authority opens review of Altice USA deal", 2) == 2
    filings.set_contact(held, "Acme Credit research@acme.example", NOW)
    assert ingest.run_due(held, NOW, _sec_only, pace=FakePace()) == [(3, True, "3 new")]
    for source in (wire, authority):
        store.set_source_state(held, source, "approved")
    store.record_check(held, wire, store.Check(NOW, True, "0 new", None, None, 0))
    store.record_check(held, authority, store.Check(NOW, True, "0 new", None, None, 0))
    market.propose(held, "Ida Owner", series=SERIES)
    store.set_source_state(held, 4, "approved")
    assert market.attempt(held, NOW, Fred(BODIES)).story_id == 6
    topics.follow(held, "Tobias O", 2)
    issuers.follow(held, "Tobias O", 1)
    feedview.save(held, "Tobias O", 1)
    feedview.save(held, "Tobias O", 3)
    desk = groups.create_group(held, MARA, "Desk", "everyone")
    groups.add_member(held, MARA, desk, "Tobias O")
    threads.share(held, MARA, desk, threads.Item(1, None), NOW)
    threads.share(held, MARA, desk, threads.Item(3, "The 8-K is out"), NOW)
    yield held
    held.close()


def _build(db: sqlite3.Connection, user: User | None, **options: Any) -> dict[str, Any]:
    built = snapshot.build(db, user, NOW, **options)
    assert len(json.dumps(built, ensure_ascii=False).encode()) < CAP
    return built


def _snap(built: dict[str, Any]) -> dict[str, Any]:
    return dict(built["scenes"][0]["snapshot"])


# Format 1


def test_format_one_is_what_the_reader_accepts_with_every_new_thing_left_out(db):
    built = _build(db, TOBIAS)
    assert react_refusal(built) is None
    snap = _snap(built)
    feed = snap["feed"]
    assert [s["id"] for s in feed["stories"]] == ["1", "2"]
    assert {s["kind"] for s in feed["stories"]} == {"news", "regulator"}
    assert feed["views"]["latest"]["latest"] == ["1", "2"]
    assert feed["views"]["for-you"]["latest"] == ["1"]  # topic 2 and the group; no issuer follow
    assert feed["views"]["saved"]["latest"] == ["1"]  # the saved filing is not delivered
    assert snap["channels"]["savedCount"] == "1"
    assert [(t["id"], t["count"]) for t in snap["channels"]["topics"]] == [("1", "2"), ("2", "1")]
    assert [t["weekly"] for t in snap["settings"]["topics"]] == [
        "2 stories this week",
        "1 story this week",
    ]
    (desk,) = snap["groups"]
    assert [t["storyId"] for t in desk["threads"]] == ["1"] and desk["more"] is None
    assert [t["storyId"] for t in snap["threads"]] == ["1"]
    assert [s["id"] for s in snap["settings"]["sources"]] == ["1", "2"]
    assert snap["settings"]["topics"][0]["kinds"] == [
        "News",
        "Regulatory cases",
        "Rating actions",
        "Research",
    ]
    assert "issuers" not in snap["channels"] and "issuers" not in feed
    assert "issuers" not in snap["settings"] and "filings" not in snap["settings"]
    assert all(
        not o.startswith("Issuer: ") for o in snap["settings"]["digestForm"]["coversOptions"]
    )
    assert all("issuers" not in s and "market" not in s for s in feed["stories"])


def test_format_one_ignores_an_issuer_focus_and_a_hidden_threads_focus(db):
    plain = _build(db, TOBIAS)
    thread = int(db.execute("SELECT id FROM threads WHERE story_id=3").fetchone()[0])
    focused = _build(db, TOBIAS, focus=snapshot.Focus(issuer=1, thread=thread))
    assert focused == plain


def test_a_viewer_with_no_name_gets_format_one_and_two_accepted(db):
    for fmt in (1, 2):
        built = _build(db, None, fmt=fmt)
        assert react_refusal(built) is None  # no story at all, so no new kind either


# Format 2


def test_format_two_is_what_the_reader_accepts_with_the_new_kinds_and_keys(db):
    built = _build(db, TOBIAS, fmt=2)
    assert react_refusal(built) is None
    assert {s["kind"] for s in _snap(built)["feed"]["stories"]} >= {"filing", "market"}


def test_format_two_delivers_every_kind_with_its_label_tags_and_issuers(db):
    snap = _snap(_build(db, TOBIAS, fmt=2))
    stories = {s["id"]: s for s in snap["feed"]["stories"]}
    assert list(stories) == ["6", "1", "2", "3", "4", "5"]
    assert [(stories[n]["kind"], stories[n]["kindLabel"]) for n in ("6", "1", "2", "3")] == [
        ("market", "Market"),
        ("news", "News"),
        ("regulator", "Regulatory case"),
        ("filing", "Filing"),
    ]
    assert stories["6"]["tags"] == ["Market"]
    assert stories["3"]["tags"] == ["8-K", "Altice"]
    assert stories["4"]["tags"] == ["10-Q", "Altice"]
    assert stories["1"]["tags"] == ["Wire news", "Altice"]  # the followed topic first
    assert stories["2"]["tags"] == ["Altice"]
    altice = [{"id": "1", "name": "Altice USA"}]
    assert [stories[n]["issuers"] for n in ("1", "2", "3", "6")] == [altice, altice, altice, []]
    assert stories["3"]["headline"] == "Altice USA: 8-K, current report"
    assert stories["3"]["source"] == {
        "name": "Altice USA filings (SEC)",
        "monogram": "AU",
        "id": "3",
        "logo": False,  # source logos: format 2 says whether one is stored
    }
    assert all(stories[n]["market"] is None for n in ("1", "2", "3", "4", "5"))
    assert all(s["ai"] is None for s in stories.values())


def test_format_two_delivers_the_market_table(db):
    snap = _snap(_build(db, TOBIAS, fmt=2))
    post = snap["feed"]["stories"][0]
    assert post["headline"] == "Market backdrop: 25 November 2026"  # the UTC day it was written
    assert post["url"] == "https://fred.stlouisfed.org/"
    table = post["market"]
    assert table["asOf"] == "24 November 2026"
    assert table["rows"][0] == {
        "id": "BAMLH0A0HYM2",
        "name": "ICE BofA US High Yield Index Option-Adjusted Spread",
        "short": "US HY",
        "unit": "Percent",
        "value": "3.12",
        "date": "24 Nov",
        "changes": [
            {"label": "Previous", "since": "20 Nov", "value": "+4 bp"},
            {"label": "Week", "since": "17 Nov", "value": "-8 bp"},
            {"label": "Month", "since": "23 Oct", "value": "+12 bp"},
        ],
        "source": "ICE Data Indices, LLC, via FRED",
        "note": None,
    }
    assert table["rows"][2] == {
        "id": "DGS2",
        "name": (
            "Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity, Quoted on an"
            " Investment Basis"
        ),
        "short": "UST 2y",
        "unit": "Percent",
        "value": None,
        "date": None,
        "changes": [],
        "source": "Board of Governors of the Federal Reserve System (US), via FRED",
        "note": "Could not be read: server answered HTTP 500",
    }
    assert table["rows"][4]["changes"] == [
        {"label": "Previous", "since": None, "value": None},
        {"label": "Week", "since": None, "value": None},
        {"label": "Month", "since": None, "value": None},
    ]


def test_format_two_delivers_the_issuer_views_channels_and_settings(db):
    snap = _snap(_build(db, TOBIAS, fmt=2))
    feed = snap["feed"]
    assert feed["views"]["for-you"]["latest"] == ["6", "1", "2", "3", "4", "5"]
    assert feed["views"]["saved"]["latest"] == ["1", "3"] and snap["channels"]["savedCount"] == "2"
    assert feed["issuers"] == {
        "1": {
            "top": feed["issuers"]["1"]["top"],
            "latest": ["1", "2", "3", "4", "5"],
            "waiting": None,
            "older": [],
            "shown": 30,
        }
    }
    assert sorted(feed["issuers"]["1"]["top"]) == ["1", "2", "3", "4", "5"]
    assert snap["channels"]["issuers"] == [
        {"id": "1", "name": "Altice USA", "count": "5", "followed": True}
    ]
    assert [(t["id"], t["count"]) for t in snap["channels"]["topics"]] == [("1", "5"), ("2", "1")]
    assert snap["settings"]["issuers"] == [
        {
            "id": "1",
            "name": "Altice USA",
            "aliases": ["ATUS"],
            "cik": "0001702780",
            "libraryKey": "id:altice",
            "source": {"id": "3", "state": "Approved", "note": "Approved. Checked just now."},
        }
    ]
    assert snap["settings"]["filings"] == {
        "contactSet": True,
        "note": (
            "Filings are fetched from the SEC at most once a second, saying who is asking with"
            " the contact the owner set on the command line."
        ),
    }
    kinds = {s["id"]: s["kind"] for s in snap["settings"]["sources"]}
    assert kinds == {"1": "News", "2": "Regulatory cases", "3": "Filings", "4": "Market data"}
    assert snap["settings"]["topics"][0]["kinds"] == [
        "News",
        "Regulatory cases",
        "Rating actions",
        "Research",
        "Filings",
    ]
    assert "Issuer: Altice USA" in snap["settings"]["digestForm"]["coversOptions"]
    (desk,) = snap["groups"]
    assert sorted(t["storyId"] for t in desk["threads"]) == ["1", "3"]
    assert "acme" not in json.dumps(snap).lower()  # the owner's contact is never delivered


def test_format_two_with_no_contact_says_why_filings_are_not_fetched(db):
    filings.set_contact(db, None, NOW)
    snap = _snap(_build(db, TOBIAS, fmt=2))
    assert snap["settings"]["filings"] == {
        "contactSet": False,
        "note": (
            "Filings are not fetched: the SEC asks every automated client to say who is asking,"
            " and the owner has not set that contact on the command line."
        ),
    }
    source = snap["settings"]["issuers"][0]["source"]
    assert source == {
        "id": "3",
        "state": "Approved",
        "note": "Approved, but not fetched: the owner has not set the contact the SEC asks for.",
    }


def test_an_issuer_focus_delivers_its_older_stories_in_format_two(db):
    with db:
        for n in range(40):
            db.execute(
                "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
                " fetched_at, summary) VALUES(1, ?, ?, ?, ?, ?, ?, '')",
                (
                    f"Old {n}",
                    f"l{n}",
                    f"k{n}",
                    f"t{n}",
                    (NOW - timedelta(days=30, minutes=n)).isoformat(),
                    NOW.isoformat(),
                ),
            )
        db.execute("INSERT INTO issuer_stories SELECT 1, id FROM stories WHERE title LIKE 'Old %'")
    plain = _snap(_build(db, TOBIAS, fmt=2))["feed"]["issuers"]["1"]["latest"]
    focused = _snap(_build(db, TOBIAS, fmt=2, focus=snapshot.Focus(issuer=1)))
    assert len(plain) == 30 and len(focused["feed"]["issuers"]["1"]["latest"]) == 45


def test_the_ai_pass_never_marks_a_filing_or_a_market_post(db):
    from signal_ai_fakes import status_on

    with db:
        db.execute(
            "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, stage, moves,"
            " config_id, written_at, month) SELECT id, 'written', 'Why.', 3, '[\"Telecoms\"]',"
            " 'rating action', NULL, '[]', 'c', 'x', '2026-11' FROM stories"
        )
    built = _build(db, TOBIAS, fmt=2, service=snapshot.Service(ai=status_on()))
    stories = {s["id"]: s for s in _snap(built)["feed"]["stories"]}
    for n in ("3", "6"):
        assert (stories[n]["ai"], stories[n]["strength"]) == (None, None)
        assert stories[n]["kind"] in ("filing", "market")
    assert stories["1"]["kind"] == "ratings" and stories["1"]["tags"][0] == "Telecoms"
    assert react_refusal(built) is None


def test_a_digest_may_cover_an_issuer(db):
    form = digests.Form(
        "Altice watch", ["Issuer: Altice USA"], "Daily, 07:00 UTC", "Up to 3 points", ""
    )
    spec = digests.spec_from_form(db, "Tobias O", form)
    made = digests.create(db, "Tobias O", spec, NOW - timedelta(days=1))
    run = digests.run_now(db, "Tobias O", made, NOW)
    # The first period runs from 23 Nov 07:00 to now: stories 1, 2 and 3 (24 Nov 21:05); the
    # 10-Q and the SC 13G/A are older. Story 3 is a filing, which no digest takes (review finding
    # 1): two in scope. AI is off, so nothing is written.
    assert (run.outcome, run.stories) == ("skipped", 2)
    digest = digests.owned(db, "Tobias O", made)
    assert digests.cover_texts(db, digest) == ["Issuer: Altice USA"]
    assert digests.covers_phrase(db, digest) == "Altice USA"
    plain = _snap(_build(db, TOBIAS))
    (record,) = plain["digests"]
    assert record["form"]["covers"] == ["Issuer: Altice USA"]  # kept, so an edit never drops it
    issuers.remove_issuer(db, 1)
    assert digests.covers_nothing(db, digests.owned(db, "Tobias O", made))


# The worst store, with issuers at their limits


def _issuers_at_limits(db: sqlite3.Connection) -> None:
    """100 issuers, every text at its limit in four-byte letters, 8 aliases each, a CIK and a
    proposed filing source each, every one followed by Mara L and holding 200 stories."""
    for n in range(issuers.MAX_ISSUERS):
        aliases = tuple(_long(f"{n:03d}{a}", issuers.MAX_ALIAS) for a in range(issuers.MAX_ALIASES))
        form = Form(
            _long(f"{n:03d}", issuers.MAX_NAME),
            aliases,
            f"{n + 1:010d}",
            _long(f"{n:03d}", issuers.MAX_LIBRARY_KEY),
        )
        issuers.add_issuer(db, form, "Mara L")
    with db:
        db.execute(
            "INSERT INTO issuer_stories SELECT i.id, s.id FROM issuers i JOIN stories s"
            " ON s.id BETWEEN 121 + (i.id - 1) * 100 AND 320 + (i.id - 1) * 100"
        )
        db.execute("INSERT INTO issuer_follows SELECT 'Mara L', id FROM issuers")


def test_the_worst_store_with_issuers_at_their_limits_stays_under_the_cap(tmp_path):
    db = open_db(tmp_path)
    with db:
        spare = _seed_stories(db)
        _seed_groups(db, spare)
        _seed_sources(db)
    _issuers_at_limits(db)
    for fmt in (1, 2):
        for viewer in (MARA, TOBIAS, None):
            started = time.perf_counter()
            built = snapshot.build(db, viewer, NOW, fmt=fmt)
            took = time.perf_counter() - started
            size = len(json.dumps(built, ensure_ascii=False).encode())
            assert size < CAP and took < 3, (fmt, viewer, size, took)
            assert react_refusal(built) is None  # only news stories here: format 2 passes too
        focused = snapshot.build(db, MARA, NOW, fmt=fmt, focus=snapshot.Focus(topic=7, issuer=9))
        assert len(json.dumps(focused, ensure_ascii=False).encode()) < CAP
        assert react_refusal(focused) is None
    snap = _snap(snapshot.build(db, MARA, NOW, fmt=2))
    assert len(snap["settings"]["issuers"]) == 100 and len(snap["channels"]["issuers"]) == 100
    assert snap["settings"]["issuers"][0]["aliases"][0].endswith(LETTER)
    assert all(view["latest"] for view in snap["feed"]["issuers"].values())
    db.close()


def test_the_feed_routes_read_issuer_views_and_for_you_with_every_kind(db):
    """Doubt: For you's SQL has one more parameter with issuers; the JSON feed routes (every kind)
    and the format-1 snapshot must each give it the count it expects."""
    page = feedview.feed(db, "Tobias O", "foryou")
    assert [card.id for card in page.cards] == [6, 1, 2, 3, 4, 5]
    assert feedview.new_count(db, "Tobias O", "foryou", 3) == 3  # 4, 5 and 6
    assert feedview.new_count(db, "Tobias O", "foryou", 0, feedview.FORMAT_1) == 1
    assert [card.id for card in feedview.feed(db, "Tobias O", "issuer:1").cards] == [1, 2, 3, 4, 5]
    assert [card.id for card in feedview.feed(db, "x", "latest", kind="filing").cards] == [3, 4, 5]
    with pytest.raises(feedview.ViewError, match="no issuer with id 9"):
        feedview.feed(db, "Tobias O", "issuer:9")


def test_the_issuer_views_are_paid_for_before_the_stories(db, monkeypatch):
    """Doubt: the issuer views' id lists were not counted in what the rest of the snapshot takes,
    so a hundred of them could pass SNAPSHOT_BUDGET. Their largest size is reserved first."""
    # 100 views of 30 ids and one focused view's 90 older ones, twice each, 22 bytes an id.
    assert snapshot.view_reserve(100) == 2 * (100 * 30 + 90) * 22 == 135_960
    assert snapshot.view_reserve(0) == 0
    # And it is taken from what the stories may spend: reserving the whole budget leaves only the
    # stories the group threads paid for (1 and 3) in format 2; format 1 has no issuer view.
    monkeypatch.setattr(
        snapshot, "view_reserve", lambda views: snapshot.SNAPSHOT_BUDGET if views else 0
    )
    assert [s["id"] for s in _snap(_build(db, TOBIAS, fmt=2))["feed"]["stories"]] == ["1", "3"]
    assert [s["id"] for s in _snap(_build(db, TOBIAS))["feed"]["stories"]] == ["1", "2"]
