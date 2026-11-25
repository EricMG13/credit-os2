"""Categories (a story's kind) and tags, end to end for every source kind: the rule table of
docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md, section 6, pinned in one
table-driven test, and the inconsistencies the audit found, each with its fix pinned.

Feed entries and the market CSVs here are SYNTHETIC (written by hand); nothing is fetched and no
model is called (the AI pass's answers are rows written here, as the pass would store them).
Expected values are written by hand."""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import status_on
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)
from test_signal_market import Fred

from deploy_workflow.signal import ai_pass, cli, market, snapshot, store, topics
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.market import Series
from deploy_workflow.signal.store import StoreError, open_db

NOW = datetime(2026, 11, 25, 9, 0, tzinfo=UTC)
VIEWER = User("Tobias O", "reader")
KINDS = ("regulator", "news", "ratings", "research", "filing", "market")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    held = open_db(tmp_path)
    yield held
    held.close()


def _source(db: sqlite3.Connection, kind: str) -> int:
    with db:
        cur = db.execute(
            "INSERT INTO sources(name, kind, url, state, proposed_by, created_at)"
            " VALUES(?, ?, ?, 'approved', 'x', ?)",
            (f"{kind.title()} source", kind, f"https://{kind}.example/feed", NOW.isoformat()),
        )
    assert cur.lastrowid is not None
    return cur.lastrowid


def _arrive(
    db: sqlite3.Connection, source: int, title: str, hours: int, category: str | None = None
) -> int:
    when = NOW - timedelta(hours=hours)
    link = f"https://s{source}.example/{hours}"
    entry = Entry(title, link, when, "", category)
    assert store.add_story(db, source, entry, when) == "new"
    story = int(db.execute("SELECT id FROM stories WHERE link=?", (link,)).fetchone()[0])
    topics.match_story(db, story)
    return story


def _ai(db: sqlite3.Connection, story: int, kind: str, tags: list[str]) -> None:
    with db:
        db.execute(
            "INSERT INTO story_ai(story_id, outcome, why, signal, tags, kind, stage, moves,"
            " config_id, written_at, month) VALUES(?, 'written', 'Why it matters.', 2, ?, ?,"
            " NULL, '[]', 'c', 'x', '2026-11')",
            (story, json.dumps(tags), kind),
        )


def _stories(db: sqlite3.Connection, *, ai: Any = None) -> dict[str, dict[str, Any]]:
    built = snapshot.build(db, VIEWER, NOW, fmt=2, service=snapshot.Service(ai=ai))
    stories = built["scenes"][0]["snapshot"]["feed"]["stories"]
    return {s["id"]: s for s in stories}


@pytest.fixture
def every_kind(db: sqlite3.Connection) -> dict[str, str]:
    """One story of each kind, each titled with "Telecom" (the market post is not: it is never in
    a topic), in three topics: "telecoms" (1), "Zeta desk" (2, which the viewer follows) and
    "TELECOMS" (3). Every story also has an AI answer: a rating action tagged Telecoms and
    Earnings (the one for the filing and the market post is never shown)."""
    for name in ("telecoms", "Zeta desk", "TELECOMS"):
        topics.add_topic(db, name, ["Telecom"], [], "Mara L")
    topics.follow(db, VIEWER.name, 2)
    ids: dict[str, str] = {}
    for hours, kind in enumerate(KINDS[:4], start=1):
        ids[kind] = str(_arrive(db, _source(db, kind), f"Telecom update, {kind}", hours))
    filing = _source(db, "filing")
    ids["filing"] = str(_arrive(db, filing, "Telecom Corp: 8-K, current report", 5, "8-K"))
    market_source = _source(db, "market")
    with db:
        db.execute(
            "INSERT INTO market_series(id, title, short, unit, source, position, added_at)"
            " VALUES('SOFR', 'Secured Overnight Financing Rate', 'SOFR',"
            " 'Percent', 'FRBNY via FRED', 1, 'x')"
        )
    body = b"observation_date,SOFR\n2026-11-24,4.57\n"  # SYNTHETIC
    posted = market.attempt(db, NOW, Fred({"SOFR": body}))
    assert posted.story_id is not None and market_source
    ids["market"] = str(posted.story_id)
    for story in ids.values():
        _ai(db, int(story), "rating action", ["Telecoms", "Earnings"])
    return ids


# kind, (kind, label, tags) with the AI pass off, then the same with it on
RULE = [
    ("regulator", ("regulator", "Regulatory case"), ("ratings", "Rating action")),
    ("news", ("news", "News"), ("ratings", "Rating action")),
    ("ratings", ("ratings", "Rating action"), ("ratings", "Rating action")),
    ("research", ("research", "Research"), ("ratings", "Rating action")),
    ("filing", ("filing", "Filing"), ("filing", "Filing")),
    ("market", ("market", "Market"), ("market", "Market")),
]
TAGS_OFF = {
    "filing": ["8-K", "Zeta desk", "telecoms"],
    "market": ["Market"],
}
TAGS_ON = {
    "filing": ["8-K", "Zeta desk", "telecoms"],
    "market": ["Market"],
}
FEED_TAGS_OFF = ["Zeta desk", "telecoms"]  # followed first; "TELECOMS" repeats "telecoms"
FEED_TAGS_ON = ["Telecoms", "Earnings", "Zeta desk"]  # the topics' "telecoms" repeats "Telecoms"


@pytest.mark.parametrize(("source_kind", "off", "on"), RULE, ids=[row[0] for row in RULE])
def test_the_rule_table(every_kind, db, source_kind, off, on):
    story = every_kind[source_kind]
    plain = _stories(db)[story]
    assert (plain["kind"], plain["kindLabel"]) == off
    assert plain["tags"] == TAGS_OFF.get(source_kind, FEED_TAGS_OFF)
    assert (plain["ai"], plain["strength"]) == (None, None)
    lit = _stories(db, ai=status_on())[story]
    assert (lit["kind"], lit["kindLabel"]) == on
    assert lit["tags"] == TAGS_ON.get(source_kind, FEED_TAGS_ON)
    if source_kind in ("filing", "market"):
        assert (lit["ai"], lit["strength"]) == (None, None)  # nobody re-kinds or tags these
    else:
        assert lit["ai"] == {
            "line": "Why it matters.",
            "kind": True,
            "tags": ["Telecoms", "Earnings"],
        }


def test_an_ai_kind_of_other_keeps_the_sources_kind(db):
    story = _arrive(db, _source(db, "research"), "A paper", 1)
    _ai(db, story, "other", [])
    lit = _stories(db, ai=status_on())[str(story)]
    assert (lit["kind"], lit["kindLabel"], lit["ai"]["kind"]) == ("research", "Research", False)


def test_the_ai_pass_is_never_given_a_filing_or_a_market_post(db):
    news = _arrive(db, _source(db, "news"), "News", 1)
    _arrive(db, _source(db, "filing"), "Corp: 8-K", 2, "8-K")
    with db:
        db.execute(
            "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(?, 'Market backdrop: 24 November 2026', 'm', 'market:x',"
            " '', ?, ?, '')",
            (_source(db, "market"), NOW.isoformat(), NOW.isoformat()),
        )
    assert [one.id for one in ai_pass.pending(db, NOW)] == [news]


# Topic membership reads the source's kind, never the AI pass's


def test_a_topic_keeps_its_members_when_the_ai_pass_re_kinds_a_story(db):
    topics.add_topic(db, "Rated", ["downgrade"], ["ratings"], "Mara L")
    topics.add_topic(db, "Wire", ["downgrade"], ["news"], "Mara L")
    story = _arrive(db, _source(db, "news"), "Agency downgrade of Acme", 1)
    _ai(db, story, "rating action", [])
    for status in (None, status_on()):
        built = snapshot.build(db, VIEWER, NOW, service=snapshot.Service(ai=status))
        feed = built["scenes"][0]["snapshot"]["feed"]
        assert (feed["topics"]["1"]["latest"], feed["topics"]["2"]["latest"]) == ([], [str(story)])
        assert react_refusal(built) is None
    assert _stories(db, ai=status_on())[str(story)]["kind"] == "ratings"  # the card follows the AI


def test_a_topic_filters_on_the_feed_kinds_only_and_takes_filings_when_it_names_none(db):
    with pytest.raises(StoreError, match="invalid kind 'filing'"):
        topics.add_topic(db, "Filings", ["8-K"], ["filing"], "Mara L")
    with pytest.raises(StoreError, match="invalid kind 'market'"):
        topics.add_topic(db, "Markets", ["SOFR"], ["market"], "Mara L")
    topics.add_topic(db, "Any", ["Telecom"], [], "Mara L")
    filing = _arrive(db, _source(db, "filing"), "Telecom Corp: 8-K", 1, "8-K")
    assert db.execute("SELECT story_id FROM topic_stories").fetchall()[0][0] == filing


def test_a_new_or_edited_topic_never_takes_a_market_post(db):
    source = _source(db, "market")
    with db:
        db.execute(
            "INSERT INTO stories(source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(?, 'Market backdrop: 24 November 2026', 'm', 'market:x',"
            " '', ?, ?, 'SOFR 4.57%')",
            (source, NOW.isoformat(), NOW.isoformat()),
        )
    made = topics.add_topic(db, "Rates", ["SOFR"], [], "Mara L")
    topics.edit_topic(db, made, "Rates", ["SOFR", "backdrop"], [])
    assert db.execute("SELECT COUNT(*) FROM topic_stories").fetchone()[0] == 0


# Tags: the cap, the order, the letter case, renamed and deleted topics


def test_the_six_tag_cap_keeps_the_followed_topics_and_then_the_oldest(db):
    for n in range(1, 9):
        topics.add_topic(db, f"Topic {n}", ["Acme"], [], "Mara L")
    topics.follow(db, VIEWER.name, 7)
    topics.follow(db, VIEWER.name, 8)
    story = str(_arrive(db, _source(db, "news"), "Acme results", 1))
    assert _stories(db)[story]["tags"] == [
        "Topic 7",
        "Topic 8",
        "Topic 1",
        "Topic 2",
        "Topic 3",
        "Topic 4",
    ]
    _ai(db, int(story), "news", ["Telecoms", "Earnings", "Leverage"])
    assert _stories(db, ai=status_on())[story]["tags"] == [
        "Telecoms",
        "Earnings",
        "Leverage",
        "Topic 7",
        "Topic 8",
        "Topic 1",
    ]


def test_a_renamed_topic_shows_its_new_name_and_a_deleted_one_none(db):
    made = topics.add_topic(db, "Old name", ["Acme"], [], "Mara L")
    story = str(_arrive(db, _source(db, "news"), "Acme results", 1))
    topics.edit_topic(db, made, "New name", ["Acme"], [])
    assert _stories(db)[story]["tags"] == ["New name"]
    topics.delete_topic(db, made)
    assert _stories(db)[story]["tags"] == []


# Folded stories and source kinds


def test_a_folded_story_keeps_the_kind_of_the_source_that_stored_it_first(db):
    regulator, news = _source(db, "regulator"), _source(db, "news")
    when = NOW - timedelta(hours=1)
    first = Entry("Authority fines Acme", "https://authority.example/case/9", when, "")
    copy = Entry("Authority fines Acme", "https://authority.example/case/9?utm_source=x", when, "")
    assert store.add_story(db, regulator, first, when) == "new"
    assert store.add_story(db, news, copy, when) == "duplicate"
    (story,) = _stories(db).values()
    assert (story["kind"], story["source"]["name"]) == ("regulator", "Regulator source")
    assert story["alsoIn"]["label"] == "Also in 1 other source"
    reversed_ = Entry("Wire says Beta fined", "https://wire.example/beta", when, "")
    later = Entry("Wire says Beta fined", "https://wire.example/beta/", when, "")
    store.add_story(db, news, reversed_, when)
    store.add_story(db, regulator, later, when)
    kinds = {s["headline"]: s["kind"] for s in _stories(db).values()}
    assert kinds == {"Authority fines Acme": "regulator", "Wire says Beta fined": "news"}


def test_no_command_or_route_re_kinds_a_source_or_proposes_a_new_kind_by_hand(tmp_path, capsys):
    root = ["--root", str(tmp_path)]
    assert cli.main([*root, "sources", "rekind", "1", "--kind", "news"]) == 2
    for kind in ("filing", "market"):
        argv = [*root, "sources", "propose", "X", "--kind", kind, "--url", "https://x.example/f"]
        assert cli.main([*argv, "--by", "Mara L"]) == 2
    db = open_db(tmp_path)
    with pytest.raises(StoreError, match="invalid kind 'filing'"):
        store.propose_source(db, "X", "filing", "https://x.example/f", "Mara L")
    db.close()
    capsys.readouterr()


def test_market_series_unit_and_kind_labels_say_nothing_of_direction(db):
    sofr = Series("SOFR", "Secured Overnight Financing Rate", "SOFR", "Percent", "s")
    assert market.change_text(Decimal("-0.01"), sofr.unit) == "-1 bp"
    labels = set(snapshot._KIND.values()) | set(snapshot._KINDS.values())
    assert labels == {
        "Regulatory case",
        "News",
        "Rating action",
        "Research",
        "Filing",
        "Market",
        "Regulatory cases",
        "Rating actions",
        "Filings",
        "Market data",
    }


# Review round 5: the spelling of a repeated tag, alsoIn and Top in format 1


def test_a_tag_spelled_twice_takes_the_lower_topic_ids_spelling_for_every_viewer(db):
    """Doubt settled: "telecoms" (topic 1) and "TELECOMS" (topic 2) show as "telecoms" to every
    viewer; a viewer following either sees it among the followed topics, first."""
    for name in ("telecoms", "TELECOMS", "Desk"):
        topics.add_topic(db, name, ["Telecom"], [], "Mara L")
    story = str(_arrive(db, _source(db, "news"), "Telecom results", 1))
    assert _stories(db)[story]["tags"] == ["telecoms", "Desk"]
    topics.follow(db, VIEWER.name, 3)
    assert _stories(db)[story]["tags"] == ["Desk", "telecoms"]
    topics.follow(db, VIEWER.name, 2)  # the later spelling: the earlier one is still shown
    assert _stories(db)[story]["tags"] == ["telecoms", "Desk"]


def _format_one(db: sqlite3.Connection, **options: Any) -> dict[str, Any]:
    built = snapshot.build(db, VIEWER, NOW, **options)
    assert react_refusal(built) is None
    return dict(built["scenes"][0]["snapshot"])


def test_format_one_also_in_names_no_filing_or_market_source(db):
    """Review finding 12: a news story whose link a filing source also carried said "Also in 1
    other source" with the filing source's monogram in format 1."""
    news = _source(db, "news")
    filing = _source(db, "filing")
    story = _arrive(db, news, "Apple files its current report", 1)
    link = f"https://s{news}.example/1"
    assert store.add_story(db, filing, Entry("Apple: 8-K", link, NOW, ""), NOW) == "duplicate"
    (card,) = _format_one(db)["feed"]["stories"]
    assert card["id"] == str(story) and card["alsoIn"] is None
    two = _stories(db)[str(story)]
    assert two["alsoIn"]["label"] == "Also in 1 other source"  # format 2 names it


def test_a_stray_ai_row_on_a_filing_never_moves_it_in_top(db):
    """Review finding 16: AI rows put on a filing by hand fed the Top order."""
    news = _source(db, "news")
    filing = _source(db, "filing")
    stray = _arrive(db, filing, "Apple: 8-K", 3)
    story = _arrive(db, news, "Newer story", 1)
    _ai(db, story, "news", [])  # strength 2
    _ai(db, stray, "news", [])
    with db:
        db.execute("UPDATE story_ai SET signal=3 WHERE story_id=?", (stray,))  # never ranked
    built = snapshot.build(db, VIEWER, NOW, fmt=2, service=snapshot.Service(ai=status_on()))
    top = built["scenes"][0]["snapshot"]["feed"]["views"]["latest"]["top"]
    assert top == [str(story), str(stray)]
