"""Signal's issuer watchlist: issuers, their limits and plain-text rules, follows, the matching rule
that ties stories to an issuer, and the filing source a CIK proposes. Expected values are written
by hand. Feed entries here are synthetic (made up for the test), and nothing is fetched."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from deploy_workflow.signal import issuers, store, topics
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.issuers import Form
from deploy_workflow.signal.store import Conflict, Missing, StoreError, open_db

NOW = datetime(2026, 11, 25, 9, 0, tzinfo=UTC)
EDGAR = (
    "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={}&type=&dateb="
    "&owner=include&count=40&output=atom"
)


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    held = open_db(tmp_path)
    yield held
    held.close()


def _source(db: sqlite3.Connection, kind: str = "news", name: str = "Wire") -> int:
    with db:
        cur = db.execute(
            "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
            " VALUES(?, ?, ?, 'approved', 'x', 'x')",
            (name, kind, f"https://{name.lower().replace(' ', '')}.example/{kind}"),
        )
    assert cur.lastrowid is not None
    return cur.lastrowid


def _arrive(db: sqlite3.Connection, source: int, title: str, summary: str = "") -> int:
    """A story as the ingest pass stores it: added, then matched in one write transaction."""
    link = f"https://wire.example/{abs(hash((source, title, summary)))}"
    when = NOW - timedelta(hours=1)
    assert store.add_story(db, source, Entry(title, link, when, summary), when) == "new"
    story = db.execute("SELECT id FROM stories WHERE link=?", (link,)).fetchone()["id"]
    topics.match_story(db, story)
    return int(story)


def _linked(db: sqlite3.Connection, issuer_id: int) -> list[int]:
    rows = db.execute(
        "SELECT story_id FROM issuer_stories WHERE issuer_id=? ORDER BY story_id", (issuer_id,)
    )
    return [int(row[0]) for row in rows]


def _add(db: sqlite3.Connection, name: str, *aliases: str, **more: str | None) -> int:
    return issuers.add_issuer(db, Form(name, aliases, **more), "Mara L")


# Storing issuers


def test_an_issuer_is_stored_with_its_name_aliases_cik_and_library_key(db):
    made = _add(db, "Altice USA", "Optimum", "ATUS", cik="0001702780", library_key="id:altice")
    assert made == 1
    row = db.execute("SELECT name, aliases, cik, library_key, created_by FROM issuers").fetchone()
    assert tuple(row) == ("Altice USA", '["Optimum", "ATUS"]', "0001702780", "id:altice", "Mara L")
    assert _add(db, "TransDigm", "TDG") == 2


def test_an_issuers_id_is_never_given_again(db):
    _add(db, "First Issuer")
    second = _add(db, "Second Issuer")
    issuers.remove_issuer(db, second)
    assert _add(db, "Third Issuer") == 3


@pytest.mark.parametrize(
    ("form", "words"),
    [
        (Form("x" * 81), "an issuer's name is at most 80 characters of plain text"),
        (Form("  "), "an issuer's name must not be empty"),
        (Form("Bell\x07 Corp"), "an issuer's name is at most 80 characters of plain text"),
        (Form("Flip‮Corp"), "an issuer's name is at most 80 characters of plain text"),
        (Form("Acme", ("a" * 61,)), "an alias is at most 60 characters of plain text"),
        (Form("Acme", tuple(f"Alias {n}" for n in range(9))), "at most 8 aliases"),
        (Form("Acme", ("two\nlines",)), "an alias is at most 60 characters of plain text"),
        (Form("Acme", cik="123"), "a CIK is 10 digits, such as 0000320193"),
        (Form("Acme", cik="00003201930"), "a CIK is 10 digits, such as 0000320193"),
        (Form("Acme", cik="000032019a"), "a CIK is 10 digits, such as 0000320193"),
        (Form("Acme", cik="０" * 10), "a CIK is 10 digits, such as 0000320193"),
        (Form("Acme", cik=" 0000320193"), "a CIK is 10 digits, such as 0000320193"),
        (Form("Acme", library_key="k" * 121), "a library key is at most 120 characters"),
        (Form("GE"), "'GE' needs at least 3 letters or digits"),
        (Form("Acme", ("A.B",)), "'A.B' needs at least 3 letters or digits"),
        (Form("Acme", ("&&&",)), "'&&&' needs at least 3 letters or digits"),
    ],
)
def test_an_issuer_that_is_not_accepted_says_why_and_stores_nothing(db, form, words):
    with pytest.raises(StoreError) as refused:
        issuers.add_issuer(db, form, "Mara L")
    assert words in str(refused.value)
    assert db.execute("SELECT COUNT(*) FROM issuers").fetchone()[0] == 0
    assert db.execute("SELECT COUNT(*) FROM sources").fetchone()[0] == 0


def test_short_but_long_enough_names_and_an_empty_cik_or_key_are_taken(db):
    made = _add(db, "TDG Holdings", "TDG", "AT&T", cik="", library_key="")
    found = issuers.get(db, made)
    assert (found.cik, found.library_key, found.aliases) == (None, None, ("TDG", "AT&T"))


def test_an_alias_repeating_the_name_or_another_alias_is_kept_once(db):
    made = _add(db, "Caesars Entertainment", "CZR", "czr", "caesars entertainment")
    assert issuers.get(db, made).aliases == ("CZR",)


def test_there_are_at_most_a_hundred_issuers(db):
    for number in range(100):
        _add(db, f"Issuer number {number}")
    with pytest.raises(Conflict, match="Signal holds 100 issuers, the most it can"):
        _add(db, "One too many")


@pytest.mark.parametrize(
    ("first", "second"),
    [
        (Form("Next plc", ("Next",)), Form("NEXT")),  # a name that is another's alias
        (Form("Next plc"), Form("Other plc", ("next PLC",))),  # an alias that is another's name
        (Form("Acme", ("Roadrunner",)), Form("Coyote", ("roadrunner",))),  # a shared alias
        (Form("Acme"), Form("ACME")),  # the same name in other letters
    ],
)
def test_a_phrase_belongs_to_one_issuer(db, first, second):
    issuers.add_issuer(db, first, "Mara L")
    with pytest.raises(Conflict, match="is already the name or an alias of the issuer"):
        issuers.add_issuer(db, second, "Mara L")
    assert db.execute("SELECT COUNT(*) FROM issuers").fetchone()[0] == 1


def test_hostile_text_is_stored_as_plain_data(db):
    made = _add(db, 'Say "hi" <b>Corp</b>', "'; DROP TABLE issuers; --", library_key="<x>")
    found = issuers.get(db, made)
    assert found.name == 'Say "hi" <b>Corp</b>'
    assert found.aliases == ("'; DROP TABLE issuers; --",)
    wire = _source(db)
    story = _arrive(db, wire, 'Say "hi" <b>Corp</b> wins', "")
    assert _linked(db, made) == [story]


# The matching rule


def test_a_name_matches_whole_tokens_only(db):
    wire = _source(db)
    nextdoor = _arrive(db, wire, "Nextdoor shares rise after results")
    nextera = _arrive(db, wire, "NextEra Energy prices bonds")
    plc = _arrive(db, wire, "Next plc cuts its guidance")
    sentence = _arrive(db, wire, "Retailers report", "Next week the board meets")
    made = _add(db, "Next plc", "Next")
    # "Next" is not "Nextdoor" or "NextEra"; it is the word "next" in a sentence (the known limit
    # of a common-word alias: case is not part of the match).
    assert _linked(db, made) == [plc, sentence]
    assert nextdoor not in _linked(db, made) and nextera not in _linked(db, made)


def test_a_ticker_matches_as_a_token_and_not_inside_another(db):
    wire = _source(db)
    tdg = _arrive(db, wire, "TDG raises its outlook")
    lower = _arrive(db, wire, "Shares of tdg rose")
    longer = _arrive(db, wire, "TDGX opens a plant")
    dotted = _arrive(db, wire, "T.D.G. is a different firm")
    made = _add(db, "TransDigm Group", "TDG")
    assert _linked(db, made) == [tdg, lower]
    assert longer not in _linked(db, made) and dotted not in _linked(db, made)


def test_a_phrase_of_several_words_matches_in_order_with_accents_folded(db):
    wire = _source(db)
    bonds = _arrive(db, wire, "Altice France bonds fall")
    reversed_ = _arrive(db, wire, "France: Altice sells towers")
    other = _arrive(db, wire, "Altice USA reports")
    accent = _arrive(db, wire, "Bank results", "Societe Generale and Altice  France  talk")
    made = _add(db, "Altice France")
    assert _linked(db, made) == [bonds, accent]
    assert reversed_ not in _linked(db, made) and other not in _linked(db, made)
    socgen = _add(db, "Société Générale")
    assert _linked(db, socgen) == [accent]


def test_a_story_arriving_later_is_matched_as_it_is_stored(db):
    wire = _source(db)
    made = _add(db, "Caesars Entertainment", "CZR")
    story = _arrive(db, wire, "CZR prices notes", "Caesars to refinance")
    other = _arrive(db, wire, "Casino tax rises")
    assert _linked(db, made) == [story]
    assert other not in _linked(db, made)


def test_editing_the_phrases_rematches_and_editing_only_the_key_keeps_the_matches(db):
    wire = _source(db)
    first = _arrive(db, wire, "Optimum cuts prices")
    second = _arrive(db, wire, "Altice USA refinances")
    made = _add(db, "Altice USA", "Optimum")
    assert _linked(db, made) == [first, second]
    issuers.edit_issuer(db, made, Form("Altice USA"))
    assert _linked(db, made) == [second]
    with db:  # a link only a re-match would remove
        db.execute("INSERT INTO issuer_stories VALUES(?, ?)", (made, first))
    issuers.edit_issuer(db, made, Form("Altice USA", library_key="id:altice"))
    assert _linked(db, made) == [first, second]  # nothing was re-matched


def test_market_and_filing_stories_are_not_matched_by_text(db):
    wire, market = _source(db), _source(db, "market", "Fred")
    filing = _source(db, "filing", "Edgar")
    news = _arrive(db, wire, "Altice USA: rates")
    with db:
        db.execute(
            "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(?, 'Altice USA backdrop', 'l1', 'k1', '', ?, ?, '')",
            (market, NOW.isoformat(), NOW.isoformat()),
        )
    _arrive(db, filing, "Altice USA: 8-K, current report")
    made = _add(db, "Altice USA")
    assert _linked(db, made) == [news]


def test_an_unknown_issuer_is_missing(db):
    for action in (
        lambda: issuers.get(db, 9),
        lambda: issuers.edit_issuer(db, 9, Form("Acme")),
        lambda: issuers.remove_issuer(db, 9),
        lambda: issuers.follow(db, "Mara L", 9),
        lambda: issuers.unfollow(db, "Mara L", 9),
    ):
        with pytest.raises(Missing, match="no issuer with id 9"):
            action()


# Follows and removal


def test_any_user_follows_and_unfollows_and_removal_takes_matches_and_follows(db):
    wire = _source(db)
    made = _add(db, "Caesars Entertainment")
    _arrive(db, wire, "Caesars Entertainment wins")
    issuers.follow(db, "Tobias O", made)
    issuers.follow(db, "Tobias O", made)  # again: still one follow
    issuers.follow(db, "Mara L", made)
    issuers.unfollow(db, "Mara L", made)
    rows = db.execute("SELECT user_name, issuer_id FROM issuer_follows").fetchall()
    assert [tuple(row) for row in rows] == [("Tobias O", made)]
    issuers.remove_issuer(db, made)
    for table in ("issuers", "issuer_stories", "issuer_follows"):
        assert db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] == 0


# The filing source a CIK proposes


def _sources(db: sqlite3.Connection) -> list[tuple[object, ...]]:
    rows = db.execute("SELECT id, name, kind, url, state FROM sources ORDER BY id").fetchall()
    return [tuple(row) for row in rows]


def test_a_cik_proposes_one_filing_source_named_for_the_issuer(db):
    made = _add(db, "Altice USA", cik="0001702780")
    assert _sources(db) == [
        (1, "Altice USA filings (SEC)", "filing", EDGAR.format("0001702780"), "proposed")
    ]
    assert issuers.get(db, made).source_id == 1


def test_removing_the_cik_pauses_the_source_and_setting_it_again_proposes_the_same(db):
    made = _add(db, "Altice USA", cik="0001702780")
    store.set_source_state(db, 1, "approved")
    issuers.edit_issuer(db, made, Form("Altice USA"))
    assert _sources(db)[0][4] == "paused" and issuers.get(db, made).source_id is None
    issuers.edit_issuer(db, made, Form("Altice USA", cik="0001702780"))
    assert _sources(db) == [
        (1, "Altice USA filings (SEC)", "filing", EDGAR.format("0001702780"), "proposed")
    ]
    assert issuers.get(db, made).source_id == 1


def test_a_changed_cik_pauses_the_old_source_and_proposes_the_new(db):
    made = _add(db, "Altice USA", cik="0001702780")
    store.set_source_state(db, 1, "approved")
    issuers.edit_issuer(db, made, Form("Altice USA", cik="0000320193"))
    assert [(row[0], row[4]) for row in _sources(db)] == [(1, "paused"), (2, "proposed")]
    assert _sources(db)[1][3] == EDGAR.format("0000320193")


def test_renaming_renames_the_source_and_removing_the_issuer_pauses_it(db):
    made = _add(db, "Altice USA", cik="0001702780")
    store.set_source_state(db, 1, "approved")
    issuers.edit_issuer(db, made, Form("Optimum Communications", cik="0001702780"))
    assert _sources(db)[0][1:] == (
        "Optimum Communications filings (SEC)",
        "filing",
        EDGAR.format("0001702780"),
        "approved",
    )
    issuers.remove_issuer(db, made)
    assert _sources(db)[0][4] == "paused"


def test_a_cik_belongs_to_one_issuer_and_an_address_taken_by_a_feed_is_refused(db):
    _add(db, "Altice USA", cik="0001702780")
    with pytest.raises(Conflict, match="the CIK 0001702780 is already that of the issuer 'Altice USA'"):
        _add(db, "Optimum", cik="0001702780")
    store.propose_source(db, "Apple feed", "news", EDGAR.format("0000320193"), "Mara L")
    with pytest.raises(Conflict, match="already a source of kind news"):
        _add(db, "Apple", cik="0000320193")
    assert db.execute("SELECT COUNT(*) FROM issuers").fetchone()[0] == 1


def test_a_filing_story_belongs_to_its_issuer_by_its_source(db):
    made = _add(db, "Altice USA", cik="0001702780")
    other = _add(db, "Optimum Holdings")
    filing = _arrive(db, 1, "Altice USA: 8-K, current report", "Optimum Holdings is named")
    assert _linked(db, made) == [filing]
    assert _linked(db, other) == []  # filings are not text-matched to other issuers
    issuers.edit_issuer(db, made, Form("Altice USA"))  # the CIK goes: its filings with it
    assert _linked(db, made) == []
    issuers.edit_issuer(db, made, Form("Altice USA", cik="0001702780"))
    assert _linked(db, made) == [filing]


def test_a_filing_source_an_issuer_uses_cannot_be_removed(db):
    _add(db, "Altice USA", cik="0001702780")
    with pytest.raises(Conflict, match="take the issuer's CIK off first"):
        store.remove_source(db, 1, with_stories=True)


def test_removing_a_source_with_stories_takes_their_issuer_links(db):
    wire = _source(db)
    made = _add(db, "Caesars Entertainment")
    _arrive(db, wire, "Caesars Entertainment wins")
    assert store.remove_source(db, wire, with_stories=True) == 1
    assert _linked(db, made) == []
