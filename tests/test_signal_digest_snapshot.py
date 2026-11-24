"""The digest parts of the Signal snapshot: the viewer's digests and issues, the channel entries,
the feed cards placed in the For you view, and the digest form. Every snapshot built here is also
read by the real React reader (``slice.ts``), because a snapshot it refuses blanks the whole screen.

Expected text is written by hand from the fixture's wording (``web/fixtures/signal.json``) and the
calendar (2026-11-24 is a Tuesday, 2026-11-20 the Friday before it).
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
import signal_ai_fakes
import signal_reader_check
from signal_reader_check import react_refusal

from deploy_workflow.signal import digests, digestview, groups, snapshot, store, topics
from deploy_workflow.signal.digests import Form
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
WRITER = User("Mara L", "writer")
READER = User("Tobias O", "reader")
PAUSED = "No new digest is written while AI is off or at its cap. Earlier digests stay readable."
NO_COVER = (
    "What this digest covered was removed, so no digest is written."
    " Edit it to choose what it covers."
)


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = store.open_db(tmp_path)
    store.add_user(database, WRITER.name, "writer")
    store.add_user(database, READER.name, "reader")
    yield database
    database.close()


def snap(
    db: sqlite3.Connection, user: User | None, now: datetime = NOW, **options: Any
) -> dict[str, Any]:
    built = snapshot.build(db, user, now, **options)
    assert react_refusal(built) is None, react_refusal(built)
    (scene,) = built["scenes"]
    return dict(scene["snapshot"])


def make(db: sqlite3.Connection, owner: str, **changes: Any) -> int:
    base: dict[str, Any] = {
        "name": "Weekly brief",
        "covers": ["All stories"],
        "schedule": "Weekly, Friday 07:00 UTC",
        "length": "Up to 5 points",
        "brief": "",
    }
    spec = digests.spec_from_form(db, owner, Form(**{**base, **changes}))
    return digests.create(db, owner, spec, NOW)


def stories(db: sqlite3.Connection, titles: list[str], newest: datetime) -> None:
    src = store.propose_source(db, "Wire", "news", "https://wire.example/feed", "x")
    store.set_source_state(db, src, "approved")
    for index, title in enumerate(titles):
        when = newest - timedelta(minutes=index)
        store.add_story(db, src, Entry(title, f"https://wire.example/{index}", when, "About"), when)


def test_the_form_offers_what_the_create_route_accepts(db):
    topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    topics.add_topic(db, "Shipping", ["tanker"], [], "Mara L")
    groups.create_group(db, WRITER, "Desk", "everyone")
    hidden = groups.create_group(db, WRITER, "Closed", "invited")
    groups.add_member(db, WRITER, hidden, "Mara L")
    form = snap(db, WRITER)["settings"]["digestForm"]
    assert form["name"] == "New digest"
    assert form["covers"] == "All stories"
    assert form["coversOptions"] == [
        "All stories",
        "Group: Desk",
        "Group: Closed",
        "Topic: Packaging",
        "Topic: Shipping",
    ]
    assert form["schedule"] == "Weekly, Friday 07:00 UTC"
    assert form["scheduleOptions"][:3] == [
        "Daily, 07:00 UTC",
        "Weekly, Monday 07:00 UTC",
        "Weekly, Tuesday 07:00 UTC",
    ]
    assert len(form["scheduleOptions"]) == 37
    assert form["length"] == "Up to 5 points"
    assert form["lengthOptions"] == ["Up to 3 points", "Up to 5 points", "Up to 8 points"]
    assert form["brief"] == ""
    # Every option the form delivers is one the create route accepts, posted back as given.
    owner = WRITER.name
    for covers in form["coversOptions"]:
        for schedule in (form["scheduleOptions"][0], form["scheduleOptions"][-1]):
            spec = digests.spec_from_form(
                db, owner, Form("Probe", [covers], schedule, form["lengthOptions"][0], "")
            )
            assert spec.name == "Probe"
    for schedule in form["scheduleOptions"]:
        digests.spec_from_form(
            db, owner, Form("Probe", ["All stories"], schedule, "Up to 3 points", "")
        )
    for length in form["lengthOptions"]:
        digests.spec_from_form(
            db, owner, Form("Probe", ["All stories"], form["schedule"], length, "")
        )
    reader_form = snap(db, READER)["settings"]["digestForm"]
    assert "Group: Closed" not in reader_form["coversOptions"]  # a group the reader cannot see
    assert "Group: Desk" in reader_form["coversOptions"]


def test_a_viewer_with_no_name_and_a_user_with_no_digest_have_none(db):
    make(db, "Mara L")
    for viewer in (None, READER):
        got = snap(db, viewer)
        assert (got["digests"], got["channels"]["digests"], got["feed"]["digests"]) == ([], [], [])
    form = snap(db, None)["settings"]["digestForm"]
    assert form["coversOptions"] == ["All stories"]  # no name, no groups; no topics yet


def test_a_digest_with_a_nothing_issue_is_delivered_paused_with_its_card(db):
    ident = make(db, "Mara L", brief="Lead with refinancing dates")
    digests.run_now(db, "Mara L", ident, NOW)
    got = snap(db, WRITER)
    assert got["settings"]["ai"]["state"] == "off"
    assert got["digests"] == [
        {
            "id": "1",
            "name": "Weekly brief",
            "monogram": "WB",
            "paused": PAUSED,
            "issues": [
                {
                    "id": "1",
                    "title": "Weekly brief: 20 to 24 November",
                    "date": "Tue 24 Nov 2026",
                    "ai": False,
                    "summary": None,
                    "nothing": "No story reached what this digest covers from Fri 20 Nov 07:00 "
                    "to Tue 24 Nov 12:00 UTC.",
                    "points": [],
                }
            ],
            "form": {
                "name": "Weekly brief",
                "covers": ["All stories"],
                "schedule": "Weekly, Friday 07:00 UTC",
                "length": "Up to 5 points",
                "brief": "Lead with refinancing dates",
                "upcoming": "",
                "lookAhead": 7,
            },
        }
    ]
    # The reader requires a paused digest to carry no unread mark; the card carries it.
    assert got["channels"]["digests"] == [
        {"id": "1", "name": "Weekly brief", "unread": False, "paused": True}
    ]
    assert got["feed"]["digests"] == [
        {
            "id": "d1",
            "digestId": "1",
            "issueId": "1",
            "digestName": "Weekly brief",
            "monogram": "WB",
            "title": "Weekly brief: 20 to 24 November",
            "date": "Tue 24 Nov",
            "unread": True,
            "ai": False,
            "points": [],
            "summary": None,
            "nothing": "Nothing material to report: no story reached what this digest covers "
            "from Fri 20 Nov 07:00 to Tue 24 Nov 12:00 UTC.",
        }
    ]
    assert got["feed"]["views"]["for-you"]["top"] == ["d1"]
    assert got["feed"]["views"]["for-you"]["latest"] == ["d1"]
    assert got["feed"]["views"]["latest"]["top"] == []  # a card is in For you only


def at(text: str) -> datetime:
    return datetime.fromisoformat(text).replace(tzinfo=UTC)


def test_an_issue_title_says_the_real_start_and_end_of_its_period(db):
    make(db, "Mara L", name="Weekly")  # the first period starts Fri 20 Nov 07:00
    make(db, "Mara L", name="Daily", schedule="Daily, 07:00 UTC")  # from Tue 24 Nov 07:00
    make(db, "Mara L", name="Monthly", schedule="Monthly, day 1, 07:00 UTC")  # from Sun 1 Nov
    digests.run_due(db, at("2026-11-25 07:00"))  # only the daily digest is due: a regular day
    for when in ("2026-11-27 07:00", "2026-12-31 09:00", "2027-01-12 09:00"):
        digests.run_due(db, at(when))
    later = snap(db, WRITER, at("2027-01-12 12:00"))
    got = {d["name"]: [i["title"] for i in d["issues"]] for d in later["digests"]}
    assert got["Weekly"] == [
        "Weekly: 31 December 2026 to 12 January 2027",  # a catch-up names both ends, and both years
        "Weekly: 27 November to 31 December",  # five weeks down, across a month
        "Weekly: the week to 27 November",  # a regular week
    ]
    assert got["Daily"][-1] == "Daily: 25 November"  # a regular day
    assert got["Monthly"][-1] == "Monthly: 1 November to 31 December"


def test_an_issue_kind_the_page_does_not_know_is_refused_not_called_nothing_material(db):
    ident = make(db, "Mara L")
    digests.run_now(db, "Mara L", ident, NOW)
    db.execute("UPDATE digest_issues SET kind='written'")
    db.commit()
    with pytest.raises(digestview.UnknownIssueKind, match="written"):
        snapshot.build(db, WRITER, NOW)
    assert snapshot.build(db, READER, NOW)  # another viewer's snapshot is not affected


def test_a_digest_whose_cover_was_removed_is_delivered_paused_with_that_sentence(db):
    packaging = topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    topics.add_topic(db, "Shipping", ["tanker"], [], "Mara L")
    gone = make(db, "Mara L", name="Gone", covers=["Topic: Packaging"])
    make(db, "Mara L", name="Kept", covers=["Topic: Shipping"])
    topics.delete_topic(db, packaging)
    got = snap(db, WRITER)
    by_name = {d["name"]: d for d in got["digests"]}
    assert by_name["Gone"]["paused"] == NO_COVER
    assert by_name["Gone"]["form"]["covers"] == []
    assert by_name["Kept"]["paused"] == PAUSED
    assert by_name["Kept"]["form"]["covers"] == ["Topic: Shipping"]
    assert [c["paused"] for c in got["channels"]["digests"]] == [True, True]
    chosen = Form("Gone", ["Topic: Shipping"], "Daily, 07:00 UTC", "Up to 3 points", "")
    digests.edit(db, "Mara L", gone, digests.spec_from_form(db, "Mara L", chosen), NOW)
    again = {d["name"]: d["paused"] for d in snap(db, WRITER)["digests"]}
    assert again == {"Gone": PAUSED, "Kept": PAUSED}  # covering something again


def test_reading_the_issue_clears_the_cards_unread_mark(db):
    ident = make(db, "Mara L")
    digests.run_now(db, "Mara L", ident, NOW)
    digests.mark_read(db, "Mara L", ident, None, NOW)
    got = snap(db, WRITER)
    assert got["feed"]["digests"][0]["unread"] is False


def test_each_cadence_words_its_issue_title_and_a_reader_owns_digests_too(db):
    daily = make(db, "Tobias O", name="Daily ratings", schedule="Daily, 07:00 UTC")
    monthly = make(db, "Tobias O", name="Monthly", schedule="Monthly, last day, 07:00 UTC")
    digests.run_now(db, "Tobias O", daily, NOW)
    digests.run_now(db, "Tobias O", monthly, NOW)
    got = snap(db, READER)
    assert got["viewer"]["role"] == "reader"
    titles = {d["name"]: d["issues"][0]["title"] for d in got["digests"]}
    assert titles == {
        "Daily ratings": "Daily ratings: 24 November",  # a run five hours into its day
        "Monthly": "Monthly: 31 October to 24 November",  # a manual run, 24 days into its month
    }
    assert [c["name"] for c in got["channels"]["digests"]] == ["Daily ratings", "Monthly"]
    assert snap(db, WRITER)["digests"] == []  # digests are the owner's alone


def test_only_the_newest_issue_carries_the_year_and_an_old_one_does(db):
    ident = make(db, "Mara L")
    digests.run_now(db, "Mara L", ident, NOW)
    digests.run_now(db, "Mara L", ident, NOW + timedelta(days=1))
    issues = snap(db, WRITER)["digests"][0]["issues"]
    assert [i["date"] for i in issues] == ["Wed 25 Nov 2026", "Tue 24 Nov"]
    later = snap(db, WRITER, datetime(2027, 1, 5, 12, 0, tzinfo=UTC))
    assert [i["date"] for i in later["digests"][0]["issues"]] == [
        "Wed 25 Nov 2026",
        "Tue 24 Nov 2026",
    ]
    assert later["feed"]["digests"][0]["date"] == "Wed 25 Nov 2026"


def test_cards_sit_before_older_for_you_stories_and_the_view_stays_coherent(db):
    stories(db, [f"Story {n:03d}" for n in range(130)], NOW - timedelta(hours=1))
    topics.add_topic(db, "Wire", ["story"], [], "Mara L")
    topics.follow(db, "Mara L", 1)
    topics.add_topic(db, "Quiet", ["nothing here"], [], "Mara L")  # no story, so a nothing issue
    ident = make(db, "Mara L", covers=["Topic: Quiet"])
    digests.run_now(db, "Mara L", ident, NOW - timedelta(minutes=50))
    digests.run_now(db, "Mara L", ident, NOW - timedelta(minutes=30))
    got = snap(db, WRITER)
    view = got["feed"]["views"]["for-you"]
    assert [c["id"] for c in got["feed"]["digests"]] == ["d2", "d1"]
    # A ranked view holds every delivered entry in both orders; the page draws the first `shown`.
    assert (len(view["top"]), len(view["latest"]), len(view["older"])) == (120, 120, 0)
    assert view["shown"] == 30
    assert view["latest"][:2] == ["d2", "d1"]  # both are newer than every story
    assert sorted(view["top"]) == sorted(view["latest"])  # the same entries, in two orders
    assert {"d1", "d2"} <= set(view["top"])
    seen = [*view["latest"], *view["older"]]
    assert len(seen) == len(set(seen))  # no entry twice


def test_a_card_goes_between_the_stories_it_falls_between(db):
    stories(
        db, ["Story A", "Story B", "Story C"], NOW - timedelta(hours=1)
    )  # A, B, C a minute apart
    topics.add_topic(db, "Wire", ["story"], [], "Mara L")
    topics.follow(db, "Mara L", 1)
    topics.add_topic(db, "Quiet", ["nothing here"], [], "Mara L")
    ident = make(db, "Mara L", covers=["Topic: Quiet"])
    digests.run_now(db, "Mara L", ident, NOW - timedelta(hours=1, seconds=30))  # after B, before A
    view = snap(db, WRITER)["feed"]["views"]["for-you"]
    assert view["latest"] == ["1", "d1", "2", "3"]  # stories 1, 2, 3 are A, B, C
    assert sorted(view["top"]) == sorted(view["latest"])


def test_the_digest_parts_follow_the_ai_state_when_ai_is_on(db):
    ident = make(db, "Mara L")
    digests.run_now(db, "Mara L", ident, NOW)
    got = snap(
        db, WRITER, service=snapshot.Service(ai=signal_ai_fakes.status_on())
    )  # the reader accepts it, too
    assert got["digests"][0]["paused"] is None
    assert got["channels"]["digests"] == [
        {"id": "1", "name": "Weekly brief", "unread": True, "paused": False}
    ]


def test_the_react_reader_check_does_refuse_a_wrong_digest_snapshot(db):
    ident = make(db, "Mara L")
    digests.run_now(db, "Mara L", ident, NOW)
    built = snapshot.build(db, WRITER, NOW)
    scene = built["scenes"][0]["snapshot"]
    scene["channels"]["digests"][0]["paused"] = False  # contradicts "AI is off"
    reason = react_refusal(built)
    assert reason is not None and "channels.digests[0].paused" in reason


def test_the_committed_sample_is_read_by_the_react_reader():
    sample = Path(__file__).resolve().parents[1] / "web/src/pages/signal/live/snapshot.sample.json"
    assert react_refusal(json.loads(sample.read_text(encoding="utf-8"))) is None


def test_without_the_react_reader_a_check_skips_here_and_fails_under_ci(monkeypatch, tmp_path):
    monkeypatch.setattr(signal_reader_check, "ESBUILD", tmp_path / "no-esbuild")
    monkeypatch.setattr(signal_reader_check, "_built", [])
    monkeypatch.delenv("CI", raising=False)
    with pytest.raises(pytest.skip.Exception, match="npm --prefix web ci"):
        react_refusal({})
    monkeypatch.setenv("CI", "true")
    with pytest.raises(pytest.fail.Exception, match="npm --prefix web ci"):
        react_refusal({})
