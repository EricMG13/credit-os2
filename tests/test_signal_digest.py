"""Digests: building them, the runs and what a run holds, the due-run pass and the background loop.

Expected values are written by hand from the calendar (2026-11-24 is a Tuesday; 2026-11-27 and
2026-12-04 are Fridays). No model is called anywhere: with no writer a run with stories in scope is
recorded as skipped. The tests that give a run a writer use a plain test double standing in for
step 5's (``tests/test_signal_ai_digest.py`` tests the real one against a fake model), and say so
in their names.
"""

from __future__ import annotations

import dataclasses
import sqlite3
import threading
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import off_setup

from deploy_workflow.signal import digests, groups, service, store, topics
from deploy_workflow.signal.digests import Form
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import Conflict, Missing, StoreError

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
WRITER = User("Mara L", "writer")
READER = User("Tobias O", "reader")
FRIDAY = "Weekly, Friday 07:00 UTC"


def at(text: str) -> datetime:
    return datetime.fromisoformat(text).replace(tzinfo=UTC)


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = store.open_db(tmp_path)
    yield database
    database.close()


def source(db: sqlite3.Connection, name: str = "Wire", kind: str = "news") -> int:
    found = store.propose_source(db, name, kind, f"https://{name.lower()}.example/feed", "x")
    store.set_source_state(db, found, "approved")
    return found


def story(db: sqlite3.Connection, src: int, title: str, when: datetime) -> int:
    link = f"https://example.org/{title.replace(' ', '-')}"
    store.add_story(db, src, Entry(title, link, when, f"About {title}"), when)
    found = db.execute("SELECT id FROM stories WHERE title=?", (title,)).fetchone()
    return int(found["id"])


def form(**changes: Any) -> Form:
    base: dict[str, Any] = {
        "name": "Weekly brief",
        "covers": ["All stories"],
        "schedule": FRIDAY,
        "length": "Up to 5 points",
        "brief": "",
    }
    return Form(**{**base, **changes})


def make(db: sqlite3.Connection, owner: str = "Mara L", **changes: Any) -> int:
    spec = digests.spec_from_form(db, owner, form(**changes))
    return digests.create(db, owner, spec, NOW)


def count(db: sqlite3.Connection, table: str) -> int:
    return int(db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


# Building a digest


def test_a_digest_is_stored_with_its_schedule_and_the_period_it_will_cover(db):
    ident = make(db, brief="Lead with refinancing dates", upcoming="Rating decisions")
    (digest,) = digests.list_digests(db, "Mara L")
    assert digest.id == ident and digest.owner == "Mara L"
    spec = digest.spec
    assert (spec.name, spec.covers_all, spec.topic_ids, spec.group_ids) == (
        "Weekly brief",
        True,
        (),
        (),
    )
    assert (spec.schedule.cadence, spec.schedule.weekday, spec.schedule.minute) == (
        "weekly",
        4,
        420,
    )
    assert (spec.subject, spec.upcoming, spec.look_ahead_days) == (
        "Lead with refinancing dates",
        "Rating decisions",
        7,
    )
    assert (spec.length, spec.points) == ("standard", 5)
    assert digest.next_run_at == at("2026-11-27 07:00")  # the Friday after the Tuesday it was made
    assert digest.period_from == at("2026-11-20 07:00")  # the first brief looks back one period


@pytest.mark.parametrize(
    ("length", "stored"),
    [
        ("Up to 3 points", ("short", 3)),
        ("Up to 5 points", ("standard", 5)),
        ("Up to 8 points", ("standard", 8)),
    ],
)
def test_each_length_the_form_offers_stores_its_length_and_points(db, length, stored):
    make(db, length=length)
    spec = digests.list_digests(db, "Mara L")[0].spec
    assert (spec.length, spec.points) == stored
    assert digests.length_label(spec) == length


def test_a_user_has_at_most_five_digests_and_deleting_one_frees_a_place(db):
    ids = [make(db, name=f"Digest {n}") for n in range(5)]
    with pytest.raises(Conflict, match="5 digests"):
        make(db, name="Digest 6")
    assert len(digests.list_digests(db, "Mara L")) == 5
    make(db, owner="Tobias O", name="Digest 1")  # the limit is per user
    digests.delete(db, "Mara L", ids[0])
    make(db, name="Digest 6")
    assert len(digests.list_digests(db, "Mara L")) == 5


def test_signal_holds_at_most_five_hundred_digests_whoever_types_a_name(db, monkeypatch):
    """Review finding N5: any typed name may build digests (a reader keeps the screens), so a
    global cap bounds them; the store refuses the one past it with a plain sentence."""
    monkeypatch.setattr(digests, "MAX_ALL_DIGESTS", 3)
    for owner in ("Visitor 1", "Visitor 2", "Visitor 3"):
        make(db, owner=owner)
    with pytest.raises(Conflict) as refused:
        make(db, owner="Visitor 4")
    assert str(refused.value) == "Signal holds 3 digests, the most it can hold"
    assert count(db, "digests") == 3


def test_one_due_pass_runs_at_most_two_hundred_digests_the_longest_due_first(db, monkeypatch):
    monkeypatch.setattr(digests, "DUE_PER_PASS", 2)
    ids = [make(db, owner=f"Visitor {n}") for n in range(4)]
    # Due at 08:00, 06:00 and 07:00; the fourth is not due but its owner asked at 05:00.
    stamps = [
        "2026-11-24T08:00:00+00:00",
        "2026-11-24T06:00:00+00:00",
        "2026-11-24T07:00:00+00:00",
        "2026-11-30T07:00:00+00:00",
    ]
    with db:
        for ident, stamp in zip(ids, stamps, strict=True):
            db.execute("UPDATE digests SET next_run_at=? WHERE id=?", (stamp, ident))
        db.execute(
            "UPDATE digests SET run_requested_at='2026-11-24T05:00:00+00:00' WHERE id=?", (ids[3],)
        )
    later = datetime(2026, 11, 24, 9, tzinfo=UTC)
    assert [found for found, _ in digests.run_due(db, later)] == [ids[3], ids[1]]
    assert [found for found, _ in digests.run_due(db, later)] == [ids[2], ids[0]]
    assert list(digests.run_due(db, later)) == []


def test_a_name_is_taken_once_per_user(db):
    make(db)
    with pytest.raises(Conflict, match="already have a digest called"):
        make(db)
    make(db, owner="Tobias O")


BAD_FORMS = [
    ({"length": "Up to 4 points"}, "lengths offered"),
    ({"schedule": "Weekly, Friday 08:00"}, "not one of the schedules"),
    ({"schedule": "Monthly, day 31, 07:00 UTC"}, "not one of the schedules"),
    ({"covers": []}, "1 to 10"),
    ({"covers": ["Everything"]}, "not one of the things"),
    ({"covers": ["Topic: Nope"]}, "no topic called 'Nope'"),
    ({"covers": ["Group: Nope"]}, "no group called 'Nope'"),
    ({"covers": ["All stories", "Topic: Packaging"]}, "choose it alone"),
    ({"name": "   "}, "must not be empty"),
    ({"name": "x" * 61}, "at most 60"),
    ({"name": "bell\x07"}, "plain text"),
    ({"name": "two\nlines"}, "plain text"),
    ({"name": "bidi\u202eflip"}, "plain text"),
    ({"brief": "x" * 501}, "at most 500"),
    ({"brief": "esc\x1b[0m"}, "plain text"),
    ({"upcoming": "x" * 201}, "at most 200"),
    ({"look_ahead_days": -1}, "0 to 60"),
    ({"look_ahead_days": 61}, "0 to 60"),
]


@pytest.mark.parametrize(("changes", "words"), BAD_FORMS)
def test_a_form_that_is_not_accepted_says_why(db, changes, words):
    topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    with pytest.raises(StoreError, match=words):
        make(db, **changes)
    assert count(db, "digests") == 0


def test_a_brief_keeps_its_newlines_and_hostile_text_as_plain_data(db):
    text = '<script>alert(1)</script>\n"; DROP TABLE digests; --'
    make(db, brief=text, name="<b>x</b>")
    digest = digests.list_digests(db, "Mara L")[0]
    assert (digest.spec.subject, digest.spec.name) == (text, "<b>x</b>")
    assert count(db, "digests") == 1


def test_covers_resolve_topics_and_the_groups_the_owner_can_see(db):
    topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    shipping = topics.add_topic(db, "Shipping", ["tanker"], [], "Mara L")
    open_group = groups.create_group(db, WRITER, "Desk", "everyone")
    hidden = groups.create_group(db, WRITER, "Closed", "invited")
    make(db, covers=["Group: Desk", "Topic: Shipping", "Topic: Shipping"])
    digest = digests.list_digests(db, "Mara L")[0]
    assert (digest.spec.topic_ids, digest.spec.group_ids) == ((shipping,), (open_group,))
    assert digests.cover_texts(db, digest) == ["Topic: Shipping", "Group: Desk"]
    with pytest.raises(StoreError, match="no group called 'Closed'"):
        make(db, name="Other", covers=["Group: Closed"])  # a group the owner cannot see
    groups.add_member(db, WRITER, hidden, "Mara L")
    make(db, name="Other", covers=["Group: Closed"])
    assert digests.cover_options(db, "Mara L") == [
        "All stories",
        "Group: Desk",
        "Group: Closed",
        "Topic: Packaging",
        "Topic: Shipping",
    ]
    assert digests.cover_options(db, "Tobias O") == [
        "All stories",
        "Group: Desk",
        "Topic: Packaging",
        "Topic: Shipping",
    ]
    assert digests.cover_options(db, None) == ["All stories", "Topic: Packaging", "Topic: Shipping"]


def test_another_users_digest_is_not_found(db):
    ident = make(db)
    for action in (
        lambda: digests.owned(db, "Tobias O", ident),
        lambda: digests.delete(db, "Tobias O", ident),
        lambda: digests.run_now(db, "Tobias O", ident, NOW),
        lambda: digests.mark_read(db, "Tobias O", ident, None, NOW),
        lambda: digests.edit(
            db, "Tobias O", ident, digests.spec_from_form(db, "Tobias O", form()), NOW
        ),
    ):
        with pytest.raises(Missing):
            action()
    assert count(db, "digests") == 1


def test_editing_keeps_the_issues_and_moves_the_schedule_only_when_it_changes(db):
    ident = make(db)
    digests.run_now(db, "Mara L", ident, NOW)
    later = NOW + timedelta(hours=1)
    same = digests.spec_from_form(db, "Mara L", form(name="Renamed", brief="New brief"))
    digests.edit(db, "Mara L", ident, same, later)
    digest = digests.owned(db, "Mara L", ident)
    assert (digest.spec.name, digest.spec.subject) == ("Renamed", "New brief")
    assert digest.next_run_at == at("2026-11-27 07:00")  # the schedule did not change
    assert count(db, "digest_issues") == 1
    daily = digests.spec_from_form(db, "Mara L", form(name="Renamed", schedule="Daily, 07:00 UTC"))
    digests.edit(db, "Mara L", ident, daily, later)
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2026-11-25 07:00")
    clash = make(db, name="Second")
    with pytest.raises(Conflict):
        digests.edit(db, "Mara L", clash, same, later)  # "Renamed" is taken


def test_deleting_a_digest_removes_its_covers_issues_and_runs(db):
    topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    ident = make(db, covers=["Topic: Packaging"])
    digests.run_now(db, "Mara L", ident, NOW)
    digests.delete(db, "Mara L", ident)
    for table in ("digests", "digest_topics", "digest_groups", "digest_issues", "digest_runs"):
        assert count(db, table) == 0
    with pytest.raises(Missing):
        digests.delete(db, "Mara L", ident)


# Runs


def test_a_run_with_no_story_in_scope_stores_an_issue_that_says_so_without_a_writer_call(db):
    ident = make(db)
    run = digests.run_now(db, "Mara L", ident, NOW)
    assert run == digests.Run("nothing", 1, 0, "no story was in scope")
    (issue,) = digests.recent_issues(db, ident, 10)
    assert (issue.kind, issue.read) == ("nothing", False)
    assert (issue.period_start, issue.period_end, issue.created_at) == (
        at("2026-11-20 07:00"),
        NOW,
        NOW,
    )
    row = db.execute("SELECT * FROM digest_runs").fetchone()
    assert (row["trigger"], row["outcome"], row["stories"], row["issue_id"]) == (
        "manual",
        "nothing",
        0,
        1,
    )


def test_a_manual_run_moves_the_period_on_but_not_the_schedule(db):
    ident = make(db)
    digests.run_now(db, "Mara L", ident, NOW)
    digest = digests.owned(db, "Mara L", ident)
    assert digest.period_from == NOW
    assert digest.next_run_at == at("2026-11-27 07:00")
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=2))
    second = digests.recent_issues(db, ident, 10)[0]
    assert (second.period_start, second.period_end) == (NOW, NOW + timedelta(hours=2))


def test_a_run_is_due_only_when_its_time_has_come_and_runs_once(db):
    ident = make(db)
    assert digests.run_due(db, NOW) == []
    assert digests.run_due(db, at("2026-11-27 06:59")) == []
    ran = digests.run_due(db, at("2026-11-27 07:00"))
    assert [(found, run.outcome) for found, run in ran] == [(ident, "nothing")]
    digest = digests.owned(db, "Mara L", ident)
    assert digest.next_run_at == at("2026-12-04 07:00")
    assert digest.period_from == at("2026-11-27 07:00")
    assert digests.run_due(db, at("2026-11-27 07:00")) == []  # the same instant does not run again
    (issue,) = digests.recent_issues(db, ident, 10)
    assert (issue.period_start, issue.period_end) == (
        at("2026-11-20 07:00"),
        at("2026-11-27 07:00"),
    )


def test_a_digest_whose_time_passed_while_the_service_was_down_runs_once(db):
    ident = make(db)
    ran = digests.run_due(db, at("2026-12-31 09:00"))  # five Fridays on
    assert len(ran) == 1
    (issue,) = digests.recent_issues(db, ident, 10)
    assert (issue.period_start, issue.period_end) == (
        at("2026-11-20 07:00"),
        at("2026-12-31 09:00"),
    )
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2027-01-01 07:00")
    assert count(db, "digest_runs") == 1
    assert digests.run_due(db, at("2026-12-31 09:00")) == []


def test_stories_in_scope_and_no_writer_records_a_skipped_run_and_writes_no_issue(db):
    wire = source(db)
    story(db, wire, "Corvane closes plants", NOW - timedelta(hours=3))
    ident = make(db)
    run = digests.run_now(db, "Mara L", ident, NOW)
    assert run == digests.Run("skipped", None, 1, digests.SKIPPED)
    assert count(db, "digest_issues") == 0
    row = db.execute("SELECT * FROM digest_runs").fetchone()
    assert (row["outcome"], row["stories"], row["issue_id"], row["reason"]) == (
        "skipped",
        1,
        None,
        digests.SKIPPED,
    )
    # A skipped run moves the period on, as any run does: a period never outgrows its schedule.
    assert digests.owned(db, "Mara L", ident).period_from == NOW
    ran = digests.run_due(db, at("2026-11-27 07:00"))
    assert [run.outcome for _, run in ran] == ["nothing"]  # the story was before this period
    digest = digests.owned(db, "Mara L", ident)
    assert (digest.period_from, digest.next_run_at) == (
        at("2026-11-27 07:00"),
        at("2026-12-04 07:00"),
    )


class RecordingWriter:
    """A test double for step 5's writer: it records the scope and stores a placeholder issue."""

    def __init__(self) -> None:
        self.scopes: list[digests.Scope] = []
        self.stopped: str | None = None

    def blocked(self, owner: str) -> digests.WriterFailed | None:
        return None

    def clock(self) -> datetime:
        return NOW

    def draft(self, scope: digests.Scope) -> object:
        self.scopes.append(scope)
        return "draft"

    def store(
        self, db: sqlite3.Connection, scope: digests.Scope, draft: object, now: datetime
    ) -> int:
        assert draft == "draft"
        cur = db.execute(
            "INSERT INTO digest_issues(digest_id, kind, period_start, period_end, created_at)"
            " VALUES(?, 'test-double', ?, ?, ?)",
            (
                scope.digest.id,
                scope.start.isoformat(),
                scope.end.isoformat(),
                scope.end.isoformat(),
            ),
        )
        assert cur.lastrowid is not None
        return cur.lastrowid


def test_a_writer_the_seam_is_given_gets_the_scope_and_its_issue_is_recorded_test_double(db):
    wire = source(db)
    first = story(db, wire, "First", NOW - timedelta(hours=5))
    second = story(db, wire, "Second", NOW - timedelta(hours=1))
    ident = make(db)
    writer = RecordingWriter()
    run = digests.run_now(db, "Mara L", ident, NOW, writer)
    assert (run.outcome, run.stories) == ("written", 2)
    (scope,) = writer.scopes
    assert [one.id for one in scope.stories] == [second, first]  # newest first
    assert (scope.start, scope.end) == (at("2026-11-20 07:00"), NOW)
    assert db.execute("SELECT issue_id FROM digest_runs").fetchone()["issue_id"] == run.issue_id
    assert digests.owned(db, "Mara L", ident).period_from == NOW  # an issue covered the period


def test_a_run_with_no_story_never_calls_the_writer_test_double(db):
    ident = make(db)
    writer = RecordingWriter()
    assert digests.run_now(db, "Mara L", ident, NOW, writer).outcome == "nothing"
    assert writer.scopes == []


def test_the_scope_holds_at_most_sixty_stories_the_newest_ones_test_double(db):
    wire = source(db)
    made = [story(db, wire, f"Story {n:02d}", NOW - timedelta(minutes=n + 1)) for n in range(70)]
    ident = make(db)
    writer = RecordingWriter()
    run = digests.run_now(db, "Mara L", ident, NOW, writer)
    assert run.stories == 60
    assert [one.id for one in writer.scopes[0].stories] == made[:60]  # made[0] is the newest


# What is in scope


def scoped(db: sqlite3.Connection, ident: int, start: str, end: str) -> list[str]:
    # mark 0: tests the look-back and the cover filters on their own, apart from the mark
    digest = dataclasses.replace(digests.owned(db, "Mara L", ident), story_mark=0)
    found = digests._scope_stories(db, digest, at(start), at(end), digests._highest_story(db))
    return [one.title for one in found]


def test_a_period_takes_stories_after_its_start_less_the_look_back_with_no_upper_bound(db):
    wire = source(db)
    story(db, wire, "Too old", at("2026-11-02 08:00"))  # a week before the start: out
    story(db, wire, "At look-back edge", at("2026-11-03 08:00"))  # start less the week: out
    story(db, wire, "Inside the look-back", at("2026-11-03 08:01"))
    story(db, wire, "At end", at("2026-11-10 10:00"))
    story(db, wire, "After", at("2026-11-10 10:01"))  # the id window bounds it, not its time
    ident = make(db)  # weekly: the look-back is 7 days, the period 2 hours
    assert scoped(db, ident, "2026-11-10 08:00", "2026-11-10 10:00") == [
        "After",
        "At end",
        "Inside the look-back",
    ]


def test_a_topic_digest_takes_the_stories_of_its_topics_only(db):
    wire = source(db)
    story(db, wire, "Plant closure at Corvane", at("2026-11-10 09:00"))
    story(db, wire, "Tanker rates rise", at("2026-11-10 09:30"))
    story(db, wire, "Plant closure at Delmere", at("2026-11-02 06:00"))  # past the look-back
    topics.add_topic(db, "Packaging", ["plant closure"], [], "Mara L")
    topics.add_topic(db, "Shipping", ["tanker"], [], "Mara L")
    packaging = make(db, name="One", covers=["Topic: Packaging"])
    both = make(db, name="Two", covers=["Topic: Packaging", "Topic: Shipping"])
    assert scoped(db, packaging, "2026-11-10 08:00", "2026-11-10 12:00") == [
        "Plant closure at Corvane"
    ]
    assert scoped(db, both, "2026-11-10 08:00", "2026-11-10 12:00") == [
        "Tanker rates rise",
        "Plant closure at Corvane",
    ]


def share(db: sqlite3.Connection, group: int, story_id: int, when: datetime) -> None:
    db.execute(
        "INSERT INTO threads(group_id, story_id, created_at, created_by, last_activity_at)"
        " VALUES(?, ?, ?, 'Mara L', ?)",
        (group, story_id, when.isoformat(), when.isoformat()),
    )
    db.commit()


def test_a_group_digest_takes_stories_shared_in_the_group_during_the_period(db):
    wire = source(db)
    old = story(db, wire, "Old story shared now", at("2026-10-01 09:00"))
    shared_before = story(db, wire, "Shared before", at("2026-11-10 09:00"))
    plain = story(db, wire, "Never shared", at("2026-11-10 09:10"))
    group = groups.create_group(db, WRITER, "Desk", "everyone")
    other = groups.create_group(db, WRITER, "Other desk", "everyone")
    share(db, group, old, at("2026-11-10 09:00"))
    share(db, group, shared_before, at("2026-11-09 09:00"))  # shared before the period
    share(db, other, plain, at("2026-11-10 09:00"))  # shared in a group the digest does not cover
    ident = make(db, covers=["Group: Desk"])
    assert scoped(db, ident, "2026-11-10 08:00", "2026-11-10 12:00") == ["Old story shared now"]


def test_a_story_in_a_covered_topic_and_a_covered_group_is_counted_once(db):
    wire = source(db)
    both = story(db, wire, "Plant closure shared", at("2026-11-10 09:00"))
    topics.add_topic(db, "Packaging", ["plant closure"], [], "Mara L")
    group = groups.create_group(db, WRITER, "Desk", "everyone")
    share(db, group, both, at("2026-11-10 09:30"))
    ident = make(db, covers=["Topic: Packaging", "Group: Desk"])
    assert scoped(db, ident, "2026-11-10 08:00", "2026-11-10 12:00") == ["Plant closure shared"]


def test_a_group_the_owner_can_no_longer_see_adds_nothing_to_a_digest(db):
    wire = source(db)
    secret = story(db, wire, "Closed-door story", at("2026-11-10 09:00"))
    group = groups.create_group(db, WRITER, "Closed", "invited")
    groups.add_member(db, WRITER, group, "Tobias O")
    share(db, group, secret, at("2026-11-10 09:30"))
    ident = make(db, owner="Tobias O", covers=["Group: Closed"])
    digest = digests.owned(db, "Tobias O", ident)
    top = digests._highest_story(db)
    span = (at("2026-11-10 08:00"), at("2026-11-10 12:00"), top)
    assert [one.title for one in digests._scope_stories(db, digest, *span)] == ["Closed-door story"]
    groups.remove_member(db, WRITER, group, "Tobias O")  # the owner leaves the group
    assert digests._scope_stories(db, digest, *span) == ()
    run = digests.run_now(db, "Tobias O", ident, at("2026-11-10 12:00"))
    assert digests.covers_nothing(db, digest)
    assert (run.outcome, run.stories, run.reason) == ("skipped", 0, digests.NO_COVER)
    assert count(db, "digest_issues") == 0  # no issue claims that nothing happened


def test_all_stories_takes_every_story_of_the_period(db):
    wire = source(db)
    story(db, wire, "One", at("2026-11-10 09:00"))
    story(db, wire, "Two", at("2026-11-10 09:05"))
    ident = make(db)
    assert scoped(db, ident, "2026-11-10 08:00", "2026-11-10 12:00") == ["Two", "One"]


def _new_kind_source(db: sqlite3.Connection, name: str, kind: str) -> int:
    with store._write_transaction(db):
        made = store.insert_source(db, name, kind, f"https://{kind}.example/{name[:4]}", "x")
    store.set_source_state(db, made, "approved")
    return made


def test_no_digest_cover_takes_a_filing_or_a_market_post(db):
    """Review finding 1 (decision): a digest's scope holds the four feed kinds only, for every
    cover; so no run counts them, no model call is sent them and no issue cites them."""
    from deploy_workflow.signal import issuers

    wire = source(db)
    issuers.add_issuer(db, issuers.Form("Altice USA", (), "0001702780"), "Mara L")  # source 2
    store.set_source_state(db, 2, "approved")
    fred = _new_kind_source(db, "Market backdrop (FRED)", "market")
    topics.add_topic(db, "Everything Altice", ["Altice"], [], "Mara L")  # no kinds: takes filings
    news = story(db, wire, "Altice USA bonds fall", at("2026-11-23 09:00"))
    filing = story(db, 2, "Altice USA: 8-K, current report", at("2026-11-23 09:10"))
    post = story(db, fred, "Market backdrop: 10 November 2026", at("2026-11-23 09:20"))
    for one in (news, filing, post):
        topics.match_story(db, one)
    group = groups.create_group(db, WRITER, "Desk", "everyone")
    for one in (news, filing, post):
        share(db, group, one, at("2026-11-23 09:30"))
    covers = (
        ["All stories"],
        ["Topic: Everything Altice"],
        ["Issuer: Altice USA"],
        ["Group: Desk"],
    )
    for number, cover in enumerate(covers):
        ident = make(db, name=f"D{number}", covers=cover)
        assert scoped(db, ident, "2026-11-23 08:00", "2026-11-23 12:00") == [
            "Altice USA bonds fall"
        ], cover
    writer = RecordingWriter()
    run = digests.run_now(db, "Mara L", make(db, name="Run", covers=["All stories"]), NOW, writer)
    assert run.stories == 1 and [one.id for one in writer.scopes[0].stories] == [news]


def test_an_issue_an_earlier_build_wrote_never_shows_a_filing_or_a_market_post(db):
    from deploy_workflow.signal import digestview

    wire = source(db)
    fred = _new_kind_source(db, "Market backdrop (FRED)", "market")
    news = story(db, wire, "Altice USA bonds fall", at("2026-11-10 09:00"))
    post = story(db, fred, "Market backdrop: 10 November 2026", at("2026-11-10 09:20"))
    ident = make(db)
    issue = db.execute(
        "INSERT INTO digest_issues(digest_id, kind, period_start, period_end, created_at)"
        " VALUES(?, 'written', ?, ?, ?)",
        (ident, NOW.isoformat(), NOW.isoformat(), NOW.isoformat()),
    ).lastrowid
    db.execute("INSERT INTO digest_issue_ai VALUES(?, 2, 'c', 'All stories')", (issue,))
    db.execute(
        "INSERT INTO digest_points VALUES(?, 1, 'Lead', 'Body', ?)", (issue, f"[{news}, {post}]")
    )
    db.commit()
    digest = digests.owned(db, "Mara L", ident)
    (written,) = digestview._written(db, digest, digests.recent_issues(db, ident, 5), NOW).values()
    ((_, _, _, shown, behind),) = written.points
    assert [one["headline"] for one in shown] == ["Altice USA bonds fall"] and behind == 1


# Reading and keeping


def test_reading_an_issue_marks_it_and_only_the_owners_digest_can_be_read(db):
    ident = make(db)
    digests.run_now(db, "Mara L", ident, NOW)
    digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=1))
    newest, older = digests.recent_issues(db, ident, 10)
    digests.mark_read(db, "Mara L", ident, newest.id, NOW)
    assert [one.read for one in digests.recent_issues(db, ident, 10)] == [True, False]
    digests.mark_read(db, "Mara L", ident, older.id, NOW)
    digests.mark_read(db, "Mara L", ident, older.id, NOW)  # again: no change, no error
    assert [one.read for one in digests.recent_issues(db, ident, 10)] == [True, True]
    other = make(db, name="Other")
    digests.run_now(db, "Mara L", other, NOW)
    with pytest.raises(Missing, match="no issue"):
        digests.mark_read(db, "Mara L", ident, 99, NOW)
    foreign = digests.recent_issues(db, other, 1)[0]
    with pytest.raises(Missing, match="no issue"):
        digests.mark_read(db, "Mara L", ident, foreign.id, NOW)  # an issue of another digest
    digests.mark_read(db, "Mara L", other, None, NOW)
    assert digests.recent_issues(db, other, 1)[0].read


def test_a_digest_keeps_its_newest_sixty_issues_and_one_hundred_twenty_runs(db):
    ident = make(db)
    for hour in range(130):
        digests.run_now(db, "Mara L", ident, NOW + timedelta(hours=hour))
    kept = digests.recent_issues(db, ident, 500)
    assert len(kept) == digests.KEEP_ISSUES == 60
    assert kept[0].created_at == NOW + timedelta(hours=129)
    assert count(db, "digest_runs") == digests.KEEP_RUNS == 120


# Periods stay as long as the schedule says


def test_skipped_runs_while_ai_is_off_never_let_a_period_outgrow_one_day(db):
    wire = source(db)
    story(db, wire, "One early story", NOW)
    ident = make(db, schedule="Daily, 07:00 UTC")
    for day in range(90):
        digests.run_due(db, at("2026-11-25 07:00") + timedelta(days=day))
    spans = [
        datetime.fromisoformat(row["period_end"]) - datetime.fromisoformat(row["period_start"])
        for row in db.execute(
            "SELECT period_start, period_end FROM digest_runs WHERE digest_id=?", (ident,)
        )
    ]
    assert len(spans) == 90 and max(spans) <= timedelta(days=1)


def test_a_period_is_the_gap_since_the_last_run_so_catching_up_covers_the_downtime_once(db):
    wire = source(db)
    ident = make(db)  # weekly, first period from Fri 20 Nov 07:00
    digests.run_due(db, at("2026-11-27 07:00"))
    story(db, wire, "During the outage", at("2026-12-10 09:00"))  # stored after that run
    # The service is down for three weeks, then one run covers the whole gap and no more.
    ran = digests.run_due(db, at("2026-12-20 09:00"))
    assert [run.outcome for _, run in ran] == ["skipped"]
    row = db.execute("SELECT * FROM digest_runs ORDER BY id DESC LIMIT 1").fetchone()
    assert (row["period_start"], row["period_end"]) == (
        at("2026-11-27 07:00").isoformat(),
        at("2026-12-20 09:00").isoformat(),
    )
    assert digests.owned(db, "Mara L", ident).period_from == at("2026-12-20 09:00")


def test_changing_the_schedule_never_leaves_a_period_longer_than_the_new_one(db):
    ident = make(db)  # weekly: the next period starts Fri 20 Nov 07:00
    daily = digests.spec_from_form(db, "Mara L", form(schedule="Daily, 07:00 UTC"))
    digests.edit(db, "Mara L", ident, daily, NOW)  # Tue 24 Nov 12:00; next run Wed 25 Nov 07:00
    digest = digests.owned(db, "Mara L", ident)
    assert (digest.period_from, digest.next_run_at) == (
        at("2026-11-24 07:00"),
        at("2026-11-25 07:00"),
    )
    again = digests.spec_from_form(db, "Mara L", form(schedule=FRIDAY))
    digests.edit(db, "Mara L", ident, again, NOW)  # a longer period may keep its earlier start
    assert digests.owned(db, "Mara L", ident).period_from == at("2026-11-24 07:00")


# Which runs are retried


def test_a_locked_database_leaves_the_digest_due_and_the_next_tick_runs_it(db, monkeypatch):
    ident = make(db)
    real = digests._plan

    def locked(*args: Any) -> digests.Run:
        error = sqlite3.OperationalError("database is locked")
        error.sqlite_errorcode = sqlite3.SQLITE_BUSY  # as SQLite itself raises it
        raise error

    monkeypatch.setattr(digests, "_plan", locked)
    assert digests.run_due(db, at("2026-11-27 07:00")) == []
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2026-11-27 07:00")  # still due
    assert count(db, "digest_runs") == 0  # nothing was recorded as a failure
    monkeypatch.setattr(digests, "_plan", real)
    ran = digests.run_due(db, at("2026-11-27 07:01"))
    assert [(found, run.outcome) for found, run in ran] == [(ident, "nothing")]


def test_a_failure_while_recording_a_failure_does_not_stop_the_other_digests(db, monkeypatch):
    first, second, third = (make(db, name=n) for n in ("First", "Second", "Third"))
    real = digests._plan

    def flaky(database: sqlite3.Connection, digest: digests.Digest, *rest: Any) -> digests.Run:
        if digest.id == first:
            raise RuntimeError("bug")
        return real(database, digest, *rest)

    def broken(*args: Any) -> None:
        raise sqlite3.OperationalError("disk I/O error")

    monkeypatch.setattr(digests, "_plan", flaky)
    monkeypatch.setattr(digests, "_record_failure", broken)
    ran = digests.run_due(db, at("2026-11-27 07:00"))
    assert [found for found, _ in ran] == [second, third]


# Covers that were removed


def test_deleting_a_topic_or_a_group_never_fails_because_of_a_digest_and_keeps_the_others(db):
    packaging = topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    shipping = topics.add_topic(db, "Shipping", ["tanker"], [], "Mara L")
    desk = groups.create_group(db, WRITER, "Desk", "everyone")
    mine = make(db, covers=["Topic: Packaging", "Topic: Shipping", "Group: Desk"])
    theirs = make(db, owner="Tobias O", covers=["Topic: Packaging", "Group: Desk"])
    topics.delete_topic(db, packaging)
    groups.delete_group(db, WRITER, desk)
    first = digests.owned(db, "Mara L", mine)
    assert (first.spec.topic_ids, first.spec.group_ids) == ((shipping,), ())
    assert digests.cover_texts(db, first) == ["Topic: Shipping"]
    assert not digests.covers_nothing(db, first)
    second = digests.owned(db, "Tobias O", theirs)
    assert (second.spec.topic_ids, second.spec.group_ids) == ((), ())
    assert digests.covers_nothing(db, second)
    assert [tuple(r) for r in db.execute("SELECT digest_id, topic_id FROM digest_topics")] == [
        (mine, shipping)
    ]
    assert count(db, "digest_groups") == 0


def test_a_digest_left_with_no_cover_runs_as_skipped_and_is_edited_back_into_use(db):
    wire = source(db)
    story(db, wire, "A story in the period", NOW - timedelta(hours=1))
    packaging = topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    ident = make(db, covers=["Topic: Packaging"])
    topics.delete_topic(db, packaging)
    run = digests.run_now(db, "Mara L", ident, NOW)
    assert run == digests.Run("skipped", None, 0, digests.NO_COVER)
    assert count(db, "digest_issues") == 0
    ran = digests.run_due(db, at("2026-11-27 07:00"))  # and so does a scheduled run
    assert [(found, r.outcome, r.reason) for found, r in ran] == [
        (ident, "skipped", digests.NO_COVER)
    ]
    assert digests.owned(db, "Mara L", ident).next_run_at == at("2026-12-04 07:00")
    with pytest.raises(StoreError, match="1 to 10"):
        digests.spec_from_form(db, "Mara L", form(covers=[]))  # the form still needs a cover
    digests.edit(db, "Mara L", ident, digests.spec_from_form(db, "Mara L", form()), NOW)
    revived = digests.owned(db, "Mara L", ident)
    assert not digests.covers_nothing(db, revived)
    story(db, wire, "A story after the removal", at("2026-11-28 09:00"))
    assert digests.run_now(db, "Mara L", ident, at("2026-11-28 12:00")) == digests.Run(
        "skipped", None, 1, digests.SKIPPED
    )


# The pass and the loop


def test_one_digest_that_raises_is_recorded_and_the_others_still_run(db, monkeypatch):
    first, second = make(db, name="First"), make(db, name="Second")
    real = digests._plan

    def flaky(database: sqlite3.Connection, digest: digests.Digest, *rest: Any) -> digests.Run:
        if digest.id == first:
            raise RuntimeError("secret detail")
        return real(database, digest, *rest)

    monkeypatch.setattr(digests, "_plan", flaky)
    ran = digests.run_due(db, at("2026-11-27 07:00"))
    assert [found for found, _ in ran] == [second]
    row = db.execute("SELECT * FROM digest_runs WHERE digest_id=?", (first,)).fetchone()
    assert (row["outcome"], row["reason"]) == (
        "skipped",
        "the run failed (RuntimeError); see the log",
    )
    assert digests.owned(db, "Mara L", first).next_run_at == at("2026-12-04 07:00")  # not retried
    assert digests.owned(db, "Mara L", first).period_from == at("2026-11-27 07:00")  # period moved
    assert digests.run_due(db, at("2026-11-27 07:00")) == []


@pytest.fixture
def loop_root(tmp_path: Path) -> Path:
    database = store.open_db(tmp_path)
    make(database)
    database.close()
    return tmp_path


def issue_count(root: Path) -> int:
    database = store.open_db(root)
    try:
        return count(database, "digest_issues")
    finally:
        database.close()


def test_the_loop_runs_the_digests_that_are_due_next_to_the_ingest_pass(loop_root):
    loop = service.Loop(loop_root, ai=off_setup(loop_root))
    loop.run_once(at("2026-11-26 12:00"))
    assert issue_count(loop_root) == 0
    loop.run_once(at("2026-11-27 07:00"))
    assert issue_count(loop_root) == 1
    assert (loop.last_error, loop.digest_error) == (None, None)
    loop.run_once(at("2026-11-27 07:01"))
    assert issue_count(loop_root) == 1  # once


def test_a_failing_digest_job_does_not_stop_the_ingest_job_and_the_reverse(loop_root, monkeypatch):
    loop = service.Loop(loop_root, ai=off_setup(loop_root))
    ingested: list[datetime] = []

    def boom(*args: object, **kwargs: object) -> None:
        raise RuntimeError("secret")

    monkeypatch.setattr(service.ingest, "run_due", lambda db, now, fetch: ingested.append(now))
    monkeypatch.setattr(digests, "run_due", boom)
    loop.run_once(at("2026-11-27 07:00"))  # must not raise
    assert ingested == [at("2026-11-27 07:00")]
    assert loop.last_error is None
    assert loop.digest_error is not None
    assert "digest" in loop.digest_error and "RuntimeError" in loop.digest_error
    assert "secret" not in loop.digest_error
    monkeypatch.undo()
    monkeypatch.setattr(service.ingest, "run_due", boom)
    loop.run_once(at("2026-11-27 07:00"))
    assert loop.last_error is not None and "ingest" in loop.last_error
    assert loop.digest_error is None
    assert issue_count(loop_root) == 1  # the digest job ran although ingest failed


def test_a_topic_removed_between_the_form_and_the_write_leaves_no_half_made_digest(db):
    topics.add_topic(db, "Packaging", ["plant"], [], "Mara L")
    spec = digests.spec_from_form(db, "Mara L", form(covers=["Topic: Packaging"]))
    topics.delete_topic(db, 1)  # another writer deletes the topic after the form was checked
    with pytest.raises(Conflict, match="removed just now"):
        digests.create(db, "Mara L", spec, NOW)
    assert count(db, "digests") == 0 and count(db, "digest_topics") == 0


def test_two_runners_at_once_run_a_due_digest_once(tmp_path):
    first = store.open_db(tmp_path)
    digests.create(first, "Mara L", digests.spec_from_form(first, "Mara L", form()), NOW)
    barrier = threading.Barrier(2)
    found: list[list[tuple[int, digests.Run]]] = []

    def runner() -> None:
        database = store.open_db(tmp_path)  # a connection belongs to the thread that opened it
        barrier.wait()
        found.append(digests.run_due(database, at("2026-11-27 07:00")))
        database.close()

    threads = [threading.Thread(target=runner) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=30)
    assert sorted(len(ran) for ran in found) == [0, 1]
    assert count(first, "digest_issues") == 1 and count(first, "digest_runs") == 1
    first.close()


def test_creating_digests_at_the_same_time_cannot_pass_the_limit_of_five(tmp_path):
    first = store.open_db(tmp_path)
    for number in range(3):
        spec = digests.spec_from_form(first, "Mara L", form(name=f"Digest {number}"))
        digests.create(first, "Mara L", spec, NOW)

    barrier = threading.Barrier(5)
    outcomes: list[str] = []

    def attempt(number: int, wait_at_barrier: bool) -> None:
        database = store.open_db(tmp_path)
        spec = digests.spec_from_form(database, "Mara L", form(name=f"Digest {number}"))
        if wait_at_barrier:
            barrier.wait()
        try:
            digests.create(database, "Mara L", spec, NOW)
            outcomes.append("made")
        except Conflict:
            outcomes.append("refused")
        database.close()

    threads = [threading.Thread(target=attempt, args=(n + 3, True)) for n in range(5)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=60)
    assert sorted(outcomes) == ["made"] * 2 + ["refused"] * 3
    assert count(first, "digests") == 5
    first.close()


# A story is in scope by the id window and a one-period look-back, not by the period it fell in


def daily(db: sqlite3.Connection) -> int:
    return make(db, schedule="Daily, 07:00 UTC")


def run_counts(db: sqlite3.Connection) -> list[int]:
    rows = db.execute("SELECT stories FROM digest_runs ORDER BY id").fetchall()
    return [int(row["stories"]) for row in rows]


def late(db: sqlite3.Connection, src: int, title: str, published: str, fetched: str) -> None:
    link = f"https://example.org/{title.replace(' ', '-')}"
    entry = Entry(title, link, at(published), f"About {title}")
    store.add_story(db, src, entry, at(fetched))


def titles(writer: Any) -> list[list[str]]:
    return [[one.title for one in scope.stories] for scope in writer.scopes]


def test_a_story_fetched_after_a_run_but_published_before_it_is_in_the_next_run_only(db):
    wire = source(db)
    ident = daily(db)
    writer = RecordingWriter()
    late(db, wire, "Control story", "2026-11-24 13:00", "2026-11-24 13:05")
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    late(db, wire, "Late story", "2026-11-25 00:00", "2026-11-25 10:00")
    digests.run_due(db, at("2026-11-26 07:00"), writer)
    digests.run_due(db, at("2026-11-27 07:00"), writer)
    assert titles(writer) == [["Control story"], ["Late story"]]
    assert run_counts(db) == [1, 1, 0]
    assert digests.owned(db, "Mara L", ident).period_from == at("2026-11-27 07:00")


def test_a_source_added_with_an_old_archive_does_not_flood_the_next_run(db):
    wire = source(db)
    daily(db)
    writer = RecordingWriter()
    assert digests.run_due(db, at("2026-11-25 07:00"), writer)[0][1].outcome == "nothing"
    archive = source(db, "Archive")
    late(db, archive, "Archive from last week", "2026-11-20 09:00", "2026-11-25 08:00")
    late(db, archive, "Just over a day old", "2026-11-24 06:59", "2026-11-25 08:00")
    late(db, wire, "Within a day", "2026-11-24 20:00", "2026-11-25 08:00")
    digests.run_due(db, at("2026-11-26 07:00"), writer)
    assert titles(writer) == [["Within a day"]]


def test_run_once_now_after_a_scheduled_run_takes_the_day_stamped_story_once(db):
    wire = source(db)
    ident = daily(db)
    writer = RecordingWriter()
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    late(db, wire, "Day stamped", "2026-11-25 00:00", "2026-11-25 07:10")
    run = digests.run_now(db, "Mara L", ident, at("2026-11-25 07:31"), writer)
    assert (run.outcome, run.stories) == ("written", 1)
    digests.run_due(db, at("2026-11-26 07:00"), writer)
    assert titles(writer) == [["Day stamped"]]
    assert run_counts(db) == [0, 1, 0]


class InterleavingWriter(RecordingWriter):
    """A writer whose draft is the moment an ingest pass commits a story stamped before the run."""

    def __init__(self, db: sqlite3.Connection, src: int) -> None:
        super().__init__()
        self.db, self.src = db, src

    def draft(self, scope: digests.Scope) -> object:
        if not self.scopes:
            late(self.db, self.src, "Committed mid-run", "2026-11-25 06:58", "2026-11-25 06:59")
        return super().draft(scope)


def test_a_story_committed_while_a_run_drafts_lands_in_the_next_run(db):
    wire = source(db)
    daily(db)
    late(db, wire, "Before the run", "2026-11-24 13:00", "2026-11-24 13:05")
    writer = InterleavingWriter(db, wire)
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    digests.run_due(db, at("2026-11-26 07:00"), writer)
    assert titles(writer) == [["Before the run"], ["Committed mid-run"]]


OLD_ROWS = [
    ("Old 1", "2026-11-20T05:00:00+00:00", "2026-11-20T06:00:00+00:00"),
    ("Old 2", "2026-11-20T05:00:00+00:00", "2026-11-20T07:00:00+00:00"),
    ("Old 3", "2026-11-20T05:00:00+00:00", "2026-11-20T07:00:01+00:00"),
]


def v7_store(
    root: Path,
    rows: list[tuple[str, str, str]] = OLD_ROWS,
    period_from: str = "2026-11-20T07:00:00+00:00",
) -> sqlite3.Connection:
    (root / "signal").mkdir()
    old = sqlite3.connect(root / "signal" / "signal.db")
    old.row_factory = sqlite3.Row
    old.execute("CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    old.executescript("".join(store.MIGRATIONS[:7]))
    old.execute("INSERT INTO meta VALUES('schema_version', '7')")
    old.execute("INSERT INTO meta VALUES('schema_hash', ?)", (store.scripts_hash(7),))
    old.execute("INSERT INTO users(name, role) VALUES('Mara L', 'writer')")
    old.execute(
        "INSERT INTO sources(id, name, kind, url, state, proposed_by, created_at)"
        " VALUES(1, 'Wire', 'news', 'https://wire.example/feed', 'approved', 'x', '2026-11-01')"
    )
    for number, (title, published, when) in enumerate(rows, 1):
        old.execute(
            "INSERT INTO stories(id, source_id, title, link, link_key, title_key, published_at,"
            " fetched_at, summary) VALUES(?, 1, ?, ?, ?, ?, ?, ?, 's')",
            (
                number,
                title,
                f"https://e.org/{number}",
                f"k{number}",
                f"t{number}",
                published,
                when,
            ),
        )
    old.execute(
        "INSERT INTO digests(owner, name, cadence, minute, weekday, month_day, covers_all, subject,"
        " length, points, upcoming, look_ahead_days, period_from, next_run_at, created_at)"
        " VALUES('Mara L', 'Daily', 'daily', 420, NULL, NULL, 1, '', 'standard', 5, '', 7,"
        " ?, '2026-11-25T07:00:00+00:00', '2026-11-01')",
        (period_from,),
    )
    old.commit()
    old.close()
    # This test is specifically for the v7-to-v8 story_mark migration. Apply the real v8
    # migration under its normal write transaction, then keep the connection at v8 so v9's
    # account-state removal cannot erase the digest being checked here.
    migrated = sqlite3.connect(root / "signal" / "signal.db")
    migrated.row_factory = sqlite3.Row
    store._apply_migration(migrated, 8)
    migrated.commit()
    return migrated


def test_a_digest_of_an_older_store_starts_its_mark_below_the_first_story_fetched_after_its_period(
    tmp_path,
):
    db = v7_store(tmp_path)
    assert db.execute("SELECT story_mark FROM digests").fetchone()[0] == 2
    writer = RecordingWriter()
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    # the period is 20 to 25 Nov, so the look-back starts 15 Nov 07:00 and holds all three
    assert titles(writer) == [["Old 3"]]
    db.close()


def test_a_new_digest_takes_only_stories_fetched_after_its_period_starts(db):
    wire = source(db)
    story(db, wire, "Fetched before", at("2026-11-23 06:00"))
    story(db, wire, "Fetched at the start", at("2026-11-24 07:00"))
    story(db, wire, "Fetched after", at("2026-11-24 09:00"))
    ident = daily(db)  # made at NOW: its first period starts 24 Nov 07:00
    assert digests.owned(db, "Mara L", ident).story_mark == 2
    writer = RecordingWriter()
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    assert titles(writer) == [["Fetched after"]]


def test_a_failed_paid_write_leaves_the_period_and_the_mark_so_the_next_run_covers_it_again(db):
    wire = source(db)
    ident = daily(db)
    late(db, wire, "Held over", "2026-11-24 13:00", "2026-11-24 13:05")

    class Failing(RecordingWriter):
        def draft(self, scope: digests.Scope) -> object:
            super().draft(scope)
            raise digests.WriterFailed("the model said no")

    before = digests.owned(db, "Mara L", ident)
    run = digests.run_due(db, at("2026-11-25 07:00"), Failing())[0][1]
    assert run.reason.startswith(digests.NOT_WRITTEN)
    after = digests.owned(db, "Mara L", ident)
    assert (after.period_from, after.story_mark) == (before.period_from, before.story_mark)
    writer = RecordingWriter()
    digests.run_due(db, at("2026-11-26 07:00"), writer)
    assert titles(writer) == [["Held over"]]


# Two ingest passes overlap: the later-started pass commits first, so fetch time does not rise
# with story id. Period start is 24 Nov 07:00. Id 1 was fetched (07:00:30) after it, id 2 (06:59)
# before it, yet id 2 was committed after the period began, so both belong to run 1's scope.
OVERLAP = [
    ("CLI pass story", "2026-11-24T07:00:10+00:00", "2026-11-24T07:00:30+00:00"),
    ("Pass A story", "2026-11-24T06:58:00+00:00", "2026-11-24T06:59:00+00:00"),
]


def test_a_new_digests_mark_leaves_a_story_fetched_after_its_period_whatever_its_id(db):
    wire = source(db)
    for title, published, fetched in OVERLAP:
        late(db, wire, title, published[:16].replace("T", " "), fetched[:19].replace("T", " "))
    ident = daily(db)  # made at NOW: its first period starts 24 Nov 07:00
    assert digests.owned(db, "Mara L", ident).story_mark == 0
    writer = RecordingWriter()
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    assert titles(writer) == [["CLI pass story", "Pass A story"]]


def test_a_migrated_digests_mark_leaves_a_story_fetched_after_its_period_whatever_its_id(tmp_path):
    db = v7_store(tmp_path, OVERLAP, "2026-11-24T07:00:00+00:00")
    assert db.execute("SELECT story_mark FROM digests").fetchone()[0] == 0
    writer = RecordingWriter()
    digests.run_due(db, at("2026-11-25 07:00"), writer)
    assert titles(writer) == [["CLI pass story", "Pass A story"]]
    db.close()
