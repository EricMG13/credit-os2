"""The digest parts of the snapshot: the viewer's digests with their issues, the digest channels,
the digest cards in the For you view, and the digest form in Settings.

A digest belongs to its owner, so a viewer sees their own digests only; a viewer with no display
name sees none. Every date is UTC.

AI state decides one thing here. While AI is off or at its cap (``settings.ai.state`` is not "on")
every digest is delivered paused, with the sentence ``PAUSED``: the reader requires a digest's
paused mark to follow the AI state, and a paused digest's page draws its issues as rows and its
channel entry never carries the unread mark. The issues that exist are the "nothing material"
ones, which no model wrote; their unread state is still delivered on the feed card. A digest with
nothing left to cover (``digests.covers_nothing``) says so in that sentence's place.

An issue is drawn by its kind (``_DRAWN``): the kind this service writes is "nothing". An issue of
a kind the page does not know how to draw is refused (``UnknownIssueKind``), not drawn as one that
says nothing material happened.

Card ids are ``d<issue id>`` (a story's id is a number, so they cannot meet). A card is placed in
the For you view among the stories by the time of the issue. Every read runs inside the caller's
read transaction.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from datetime import datetime, timedelta
from typing import Any

from deploy_workflow.signal import digests, schedule
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.texts import monogram, utc

Json = dict[str, Any]

PAUSED = "No new digest is written while AI is off or at its cap. Earlier digests stay readable."
NO_COVER = (
    "What this digest covered was removed, so no digest is written."
    " Edit it to choose what it covers."
)
ISSUES_SHOWN = 30  # issues delivered per digest
CARDS_PER_DIGEST = 3  # of those, the newest this many are feed cards
_MONTHS = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)
_PERIOD_WORDS = {"daily": "", "weekly": "the week to ", "monthly": "the month to "}
# How long a regular period of each cadence is (shortest, longest); a run that is a little late
# still counts as regular.
_REGULAR = {
    "daily": (timedelta(days=1), timedelta(days=1)),
    "weekly": (timedelta(days=7), timedelta(days=7)),
    "monthly": (timedelta(days=28), timedelta(days=31)),
}
_LATE = timedelta(hours=3)


class UnknownIssueKind(ValueError):
    """An issue of a kind this page does not know how to draw."""


def _short_day(at: datetime, now: datetime, *, year: bool = False) -> str:
    """ "Tue 24 Nov"; the year follows when asked for or when it is not `now`'s."""
    when = utc(at)
    weekday = schedule.WEEKDAYS[when.weekday()][:3]
    text = f"{weekday} {when.day} {_MONTHS[when.month - 1][:3]}"
    return f"{text} {when.year}" if year or when.year != utc(now).year else text


def _clock(at: datetime, now: datetime) -> str:
    return f"{_short_day(at, now)} {utc(at):%H:%M}"


def _title(digest: digests.Digest, issue: digests.Issue) -> str:
    """The issue's name and the days its period really covers. A regular period of the digest's
    cadence is worded by it ("the week to 27 November"); any other (a catch-up after downtime, a
    run made by hand) names its first and last day."""
    start, end = utc(issue.period_start), utc(issue.period_end)
    cadence = digest.spec.schedule.cadence
    shortest, longest = _REGULAR[cadence]
    last = f"{end.day} {_MONTHS[end.month - 1]}"
    if shortest - _LATE <= end - start <= longest + _LATE:
        phrase = f"{_PERIOD_WORDS[cadence]}{last}"
    elif start.date() == end.date():
        phrase = last
    elif (start.year, start.month) == (end.year, end.month):
        phrase = f"{start.day} to {last}"
    elif start.year == end.year:
        phrase = f"{start.day} {_MONTHS[start.month - 1]} to {last}"
    else:
        phrase = f"{start.day} {_MONTHS[start.month - 1]} {start.year} to {last} {end.year}"
    return f"{digest.spec.name}: {phrase}"


def _nothing(issue: digests.Issue, now: datetime) -> str:
    """The sentence of an issue no story reached (the page gives it the title "Nothing material
    to report"); times are UTC."""
    start, end = _clock(issue.period_start, now), _clock(issue.period_end, now)
    return f"No story reached what this digest covers from {start} to {end} UTC."


def _card_sentence(issue: digests.Issue, now: datetime) -> str:
    sentence = _nothing(issue, now)
    return f"Nothing material to report: {sentence[:1].lower()}{sentence[1:]}"


def _nothing_issue(issue: digests.Issue, now: datetime) -> Json:
    return {"ai": False, "summary": None, "nothing": _nothing(issue, now), "points": []}


def _nothing_card(issue: digests.Issue, now: datetime) -> Json:
    return {"ai": False, "points": [], "summary": None, "nothing": _card_sentence(issue, now)}


# How each kind of issue is drawn: its fields on the digest's page and on its feed card.
_DRAWN: dict[str, tuple[Callable[[digests.Issue, datetime], Json], ...]] = {
    digests.NOTHING: (_nothing_issue, _nothing_card)
}


def _drawn(issue: digests.Issue, which: int, now: datetime) -> Json:
    """The kind-specific fields of an issue (`which` 0: its page, 1: its card)."""
    if issue.kind not in _DRAWN:
        raise UnknownIssueKind(f"the page cannot draw an issue of kind {issue.kind!r}")
    return _DRAWN[issue.kind][which](issue, now)


# The form


def _form(db: sqlite3.Connection, owner: str | None) -> Json:
    """A blank form whose options are the choices the create route accepts."""
    covers = digests.cover_options(db, owner)
    return {
        "name": "New digest",
        "covers": covers[0],
        "coversOptions": covers,
        "schedule": digests.DEFAULT_SCHEDULE,
        "scheduleOptions": schedule.options(),
        "length": digests.DEFAULT_LENGTH,
        "lengthOptions": list(digests.LENGTHS),
        "brief": "",
    }


def _digest_form(db: sqlite3.Connection, digest: digests.Digest) -> Json:
    """The digest's own settings in the form's words, so an edit starts from what is saved."""
    spec = digest.spec
    return {
        "name": spec.name,
        "covers": digests.cover_texts(db, digest),
        "schedule": schedule.label(spec.schedule),
        "length": digests.length_label(spec),
        "brief": spec.subject,
        "upcoming": spec.upcoming,
        "lookAhead": spec.look_ahead_days,
    }


# Digests, issues and cards


def _issue(digest: digests.Digest, issue: digests.Issue, now: datetime, *, newest: bool) -> Json:
    return {
        "id": str(issue.id),
        "title": _title(digest, issue),
        "date": _short_day(issue.created_at, now, year=newest),
        **_drawn(issue, 0, now),
    }


def _card(digest: digests.Digest, issue: digests.Issue, now: datetime) -> Json:
    return {
        "id": f"d{issue.id}",
        "digestId": str(digest.id),
        "issueId": str(issue.id),
        "digestName": digest.spec.name,
        "monogram": monogram(digest.spec.name),
        "title": _title(digest, issue),
        "date": _short_day(issue.created_at, now),
        "unread": not issue.read,
        **_drawn(issue, 1, now),
    }


def _record(
    db: sqlite3.Connection,
    digest: digests.Digest,
    issues: list[digests.Issue],
    now: datetime,
    paused: bool,
) -> Json:
    sentence = NO_COVER if digests.covers_nothing(db, digest) else PAUSED
    return {
        "id": str(digest.id),
        "name": digest.spec.name,
        "monogram": monogram(digest.spec.name),
        "paused": sentence if paused else None,
        "issues": [_issue(digest, one, now, newest=index == 0) for index, one in enumerate(issues)],
        "form": _digest_form(db, digest),
    }


def _story_times(db: sqlite3.Connection, ids: list[str]) -> dict[str, datetime]:
    found = db.execute(
        "SELECT id, published_at FROM stories WHERE id IN (SELECT value FROM json_each(?))",
        (json.dumps(ids),),
    ).fetchall()
    return {str(row["id"]): datetime.fromisoformat(row["published_at"]) for row in found}


def _place(
    db: sqlite3.Connection, view: Json, cards: list[tuple[datetime, Json]], limits: tuple[int, int]
) -> list[Json]:
    """Put the cards among the For you view's stories by time. `latest` and `older` stay in time
    order; `top` keeps its order of the stories and takes each card before the first story that is
    older than it, so `top` and `latest` still hold the same entries. A card the view has no room
    for is dropped. `limits` are the view's counts of newest stories shown and older ones held.
    Returns the cards placed."""
    when = _story_times(db, [*view["latest"], *view["older"]])
    when.update((card["id"], at) for at, card in cards)
    merged = [*view["latest"], *view["older"], *(card["id"] for _, card in cards)]
    merged.sort(key=lambda entry: when[entry], reverse=True)
    shown_count, older_count = limits
    merged = merged[: shown_count + older_count]
    shown = set(merged[:shown_count])
    top = [entry for entry in view["top"] if entry in shown]
    for _, card in sorted(cards, key=lambda held: held[0], reverse=True):
        if card["id"] in shown:
            index = next(
                (n for n, entry in enumerate(top) if when[entry] < when[card["id"]]), len(top)
            )
            top.insert(index, card["id"])
    view["top"], view["latest"] = top, merged[:shown_count]
    view["older"] = merged[shown_count:]
    return [card for _, card in cards if card["id"] in set(merged)]


def apply(
    db: sqlite3.Connection,
    user: User | None,
    now: datetime,
    snap: Json,
    limits: tuple[int, int],
) -> None:
    """Fill the digest parts of `snap`, a snapshot the other parts have built, for `user`.
    `limits` are the For you view's counts of newest stories shown and older ones held."""
    paused = snap["settings"]["ai"]["state"] != "on"
    snap["settings"]["digestForm"] = _form(db, user.name if user is not None else None)
    if user is None:
        return
    records: list[Json] = []
    channel: list[Json] = []
    cards: list[tuple[datetime, Json]] = []
    for digest in digests.list_digests(db, user.name):
        issues = digests.recent_issues(db, digest.id, ISSUES_SHOWN)
        records.append(_record(db, digest, issues, now, paused))
        unread = any(not one.read for one in issues)
        channel.append(
            {
                "id": str(digest.id),
                "name": digest.spec.name,
                "unread": unread and not paused,
                "paused": paused,
            }
        )
        cards += [(one.created_at, _card(digest, one, now)) for one in issues[:CARDS_PER_DIGEST]]
    snap["digests"] = records
    snap["channels"]["digests"] = channel
    snap["feed"]["digests"] = _place(db, snap["feed"]["views"]["for-you"], cards, limits)
