"""The digest parts of the snapshot: the viewer's digests with their issues, the digest channels,
the digest cards in the For you view, and the digest form in Settings.

A digest belongs to its owner, so a viewer sees their own digests only; a viewer with no display
name sees none. Every date is UTC.

AI state decides whether a digest is paused. While AI is off or at its cap (``settings.ai.state``
is not "on") every digest is delivered paused, with the sentence ``PAUSED``: the reader requires a
digest's paused mark to follow the AI state, and a paused digest's page draws its issues as rows and
its channel entry never carries the unread mark; their unread state is still delivered on the feed
card. A digest with nothing left to cover (``digests.covers_nothing``) says so in that sentence's
place. While AI is on no digest is paused.

An issue is drawn by its kind (``_DRAWN``): "nothing" (no story reached the digest; no model wrote
it) or "written" (the AI pass's, with numbered points, marked AI). Only the newest issue of a digest
that is not paused is drawn with its points on the digest's page (number, lead, body, the stories
line and at most ``POINT_STORIES`` of the stories behind the point); any other is a row with its
summary. A written issue's feed card holds each point's number and lead. An issue of a kind the
page does not know how to draw (one a later build wrote, read after a rollback) is left out of
what is delivered and logged, never drawn as one that says nothing material happened; the
snapshot stays readable.

Size: ``build`` makes every digest part before the stories are chosen, so the snapshot can count
their bytes (``Built.size``) before it pays for stories; ``place`` then puts the cards among the
For you view's stories.

Card ids are ``d<issue id>`` (a story's id is a number, so they cannot meet). A card is placed in
the For you view among the stories by the time of the issue. Every read runs inside the caller's
read transaction.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from deploy_workflow.signal import digests, schedule, threadrank
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.texts import day, monogram, plural, utc

Json = dict[str, Any]
Key = tuple[float, datetime]  # an entry's place in Top: its threadrank score, then its time

log = logging.getLogger(__name__)
WRITTEN_STRENGTH = 2  # a written issue ranks in Top as a story of strength 2; "nothing" as none

PAUSED = "No new digest is written while AI is off or at its cap. Earlier digests stay readable."
NO_COVER = (
    "What this digest covered was removed, so no digest is written."
    " Edit it to choose what it covers."
)
ISSUES_SHOWN = 30  # issues delivered per digest
CARDS_PER_DIGEST = 3  # of those, the newest this many are feed cards
POINT_STORIES = 5  # stories drawn under one point on the digest's page
POINT_HEADLINE = 160  # characters of a headline drawn under a point
POINT_LINK = 512  # a longer link is drawn as none
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
    if shortest - _LATE <= end - start <= longest + _LATE:
        phrase = f"{_PERIOD_WORDS[cadence]}{end.day} {_MONTHS[end.month - 1]}"
    else:
        phrase = _days(start, end)
    return f"{digest.spec.name}: {phrase}"


def _titles(digest: digests.Digest, issues: list[digests.Issue]) -> dict[int, str]:
    """Each issue's title (``_title``), by id. An issue whose title an earlier issue of the
    digest already has (two runs on one day) adds the UTC time its period ends: "Credit desk:
    20 November, 14:05 UTC"."""
    titles: dict[int, str] = {}
    for issue in sorted(issues, key=lambda one: (one.created_at, one.id)):
        title = _title(digest, issue)
        if title in titles.values():
            title = f"{title}, {utc(issue.period_end):%H:%M} UTC"
        titles[issue.id] = title
    return titles


def _days(start: datetime, end: datetime) -> str:
    """The UTC days from `start` to `end`: "24 November", "9 to 13 November", "30 November to
    2 December", or with the years when they differ."""
    start, end = utc(start), utc(end)
    last = f"{end.day} {_MONTHS[end.month - 1]}"
    if start.date() == end.date():
        return last
    if (start.year, start.month) == (end.year, end.month):
        return f"{start.day} to {last}"
    if start.year == end.year:
        return f"{start.day} {_MONTHS[start.month - 1]} to {last}"
    return f"{start.day} {_MONTHS[start.month - 1]} {start.year} to {last} {end.year}"


def _nothing(issue: digests.Issue, now: datetime) -> str:
    """The sentence of an issue no story reached (the page gives it the title "Nothing material
    to report"); times are UTC."""
    start, end = _clock(issue.period_start, now), _clock(issue.period_end, now)
    return f"No story reached what this digest covers from {start} to {end} UTC."


def _card_sentence(issue: digests.Issue, now: datetime) -> str:
    sentence = _nothing(issue, now)
    return f"Nothing material to report: {sentence[:1].lower()}{sentence[1:]}"


@dataclass(frozen=True)
class Written:
    """A written issue as its page draws it: the stories it was written from, and its points as
    (number, lead, body, the stories behind it as drawn, how many there are)."""

    stories: int
    covers: str
    points: tuple[tuple[int, str, str, tuple[Json, ...], int], ...]


@dataclass(frozen=True)
class Drawing:
    """What drawing an issue needs besides the issue: the time, whether its points are drawn on
    its page, and the written issues' points."""

    now: datetime
    full: bool = False
    written: dict[int, Written] = field(default_factory=dict)
    titles: dict[int, str] = field(default_factory=dict)  # by issue id (``_titles``)


def _nothing_issue(issue: digests.Issue, drawing: Drawing) -> Json:
    return {"ai": False, "summary": None, "nothing": _nothing(issue, drawing.now), "points": []}


def _nothing_card(issue: digests.Issue, drawing: Drawing) -> Json:
    return {
        "ai": False,
        "points": [],
        "summary": None,
        "nothing": _card_sentence(issue, drawing.now),
    }


def _short_summary(found: Written) -> str:
    many = plural(len(found.points), "point", "points")
    return f"{many} from {plural(found.stories, 'story', 'stories')}"


def _written_issue(issue: digests.Issue, drawing: Drawing) -> Json:
    found = drawing.written[issue.id]
    if not drawing.full:
        return {"ai": True, "summary": _short_summary(found), "nothing": None, "points": []}
    stories = plural(found.stories, "story", "stories")
    covers = f" in {found.covers}" if found.covers else ""
    points = [
        {
            "number": str(number),
            "lead": lead,
            "body": body,
            "storiesLine": f"{plural(count, 'story', 'stories')} behind this point"
            + (f", {len(shown)} shown" if count > len(shown) else ""),
            "stories": list(shown),
        }
        for number, lead, body, shown, count in found.points
    ]
    return {
        "ai": True,
        "summary": f"Covers {_days(issue.period_start, issue.period_end)}."
        f" Written by a model from {stories}{covers}.",
        "nothing": None,
        "points": points,
    }


def _written_card(issue: digests.Issue, drawing: Drawing) -> Json:
    found = drawing.written[issue.id]
    return {
        "ai": True,
        "points": [{"number": str(n), "lead": lead} for n, lead, _, _, _ in found.points],
        "summary": _short_summary(found),
        "nothing": None,
    }


# How each kind of issue is drawn: its fields on the digest's page and on its feed card.
_DRAWN: dict[str, tuple[Callable[[digests.Issue, Drawing], Json], ...]] = {
    digests.NOTHING: (_nothing_issue, _nothing_card),
    digests.WRITTEN: (_written_issue, _written_card),
}


def _drawn(issue: digests.Issue, which: int, drawing: Drawing) -> Json:
    """The kind-specific fields of an issue (`which` 0: its page, 1: its card)."""
    if issue.kind not in _DRAWN or (
        issue.kind == digests.WRITTEN and issue.id not in drawing.written
    ):
        raise UnknownIssueKind(f"the page cannot draw an issue of kind {issue.kind!r}")
    return _DRAWN[issue.kind][which](issue, drawing)


def _point_story(row: sqlite3.Row, now: datetime) -> Json:
    title = str(row["title"])
    if len(title) > POINT_HEADLINE:
        title = title[:POINT_HEADLINE].rstrip() + "\u2026"
    link = str(row["link"])
    web = link.lower().startswith(("http://", "https://")) and len(link) <= POINT_LINK
    return {
        "headline": title,
        "url": link if web else None,
        "source": row["source"],
        "time": day(datetime.fromisoformat(row["published_at"]), now),
    }


def _written(
    db: sqlite3.Connection, digest: digests.Digest, issues: list[digests.Issue], now: datetime
) -> dict[int, Written]:
    """The written issues among `issues`, with their points and the stories behind them."""
    ids = [one.id for one in issues if one.kind == digests.WRITTEN]
    if not ids:
        return {}
    marks = ", ".join("?" * len(ids))
    held = {
        int(row["issue_id"]): (int(row["stories"]), str(row["covers"]))
        for row in db.execute(
            f"SELECT issue_id, stories, covers FROM digest_issue_ai WHERE issue_id IN ({marks})",
            ids,
        ).fetchall()
    }
    rows = db.execute(
        f"SELECT * FROM digest_points WHERE issue_id IN ({marks}) ORDER BY issue_id, number", ids
    ).fetchall()
    named = sorted({n for row in rows for n in json.loads(row["story_ids"])})
    stories = {
        int(row["id"]): _point_story(row, now)
        for row in db.execute(
            "SELECT s.id, s.title, s.link, s.published_at, src.name AS source FROM stories s"
            " JOIN sources src ON src.id = s.source_id"
            " WHERE s.id IN (SELECT value FROM json_each(?))",
            (json.dumps(named),),
        ).fetchall()
    }
    points: dict[int, list[tuple[int, str, str, tuple[Json, ...], int]]] = {n: [] for n in ids}
    for row in rows:
        behind = [stories[n] for n in json.loads(row["story_ids"]) if n in stories]
        shown = tuple(behind[:POINT_STORIES])
        points[row["issue_id"]].append(
            (row["number"], row["lead"], row["body"], shown, len(behind))
        )
    return {
        n: Written(*held.get(n, (0, "")), tuple(points[n])) for n in ids if points[n]
    }  # each issue says what it covered when it was written


# The form


def _form(db: sqlite3.Connection, owner: str | None, *, issuers: bool) -> Json:
    """A blank form whose options are the choices the create route accepts (the issuers among
    them only when the snapshot delivers issuers)."""
    covers = digests.cover_options(db, owner, issuers=issuers)
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


def _issue(digest: digests.Digest, issue: digests.Issue, drawing: Drawing, *, newest: bool) -> Json:
    return {
        "id": str(issue.id),
        "title": drawing.titles[issue.id],
        "date": _short_day(issue.created_at, drawing.now, year=newest),
        **_drawn(issue, 0, drawing),
    }


def _card(digest: digests.Digest, issue: digests.Issue, drawing: Drawing) -> Json:
    return {
        "id": f"d{issue.id}",
        "digestId": str(digest.id),
        "issueId": str(issue.id),
        "digestName": digest.spec.name,
        "monogram": monogram(digest.spec.name),
        "title": drawing.titles[issue.id],
        "date": _short_day(issue.created_at, drawing.now),
        "unread": not issue.read,
        **_drawn(issue, 1, drawing),
    }


def _record(
    db: sqlite3.Connection,
    digest: digests.Digest,
    issues: list[digests.Issue],
    drawing: Drawing,
    paused: bool,
) -> Json:
    sentence = NO_COVER if digests.covers_nothing(db, digest) else PAUSED
    drawn = [
        _issue(
            digest,
            one,
            Drawing(drawing.now, index == 0 and not paused, drawing.written, drawing.titles),
            newest=index == 0,
        )
        for index, one in enumerate(issues)
    ]
    return {
        "id": str(digest.id),
        "name": digest.spec.name,
        "monogram": monogram(digest.spec.name),
        "paused": sentence if paused else None,
        "issues": drawn,
        "form": _digest_form(db, digest),
    }


def _story_times(db: sqlite3.Connection, ids: list[str]) -> dict[str, datetime]:
    found = db.execute(
        "SELECT id, published_at FROM stories WHERE id IN (SELECT value FROM json_each(?))",
        (json.dumps(ids),),
    ).fetchall()
    return {str(row["id"]): datetime.fromisoformat(row["published_at"]) for row in found}


def card_score(written: bool, at: datetime, now: datetime) -> float:
    """A digest card's score in Top: ``threadrank.score`` of a story of the card's time with no
    shares or comments, of strength ``WRITTEN_STRENGTH`` when the AI pass wrote the issue, and
    none (the weakest) when it says nothing material happened."""
    strength = WRITTEN_STRENGTH if written else None
    return threadrank.score(threadrank.Standing(0, at, strength=strength), now)


def top_order(entries: list[str], keys: dict[str, Key]) -> list[str]:
    """Entries highest key first; equal keys keep their order (the stories' own Top order)."""
    return sorted(entries, key=keys.__getitem__, reverse=True)


def _place(
    db: sqlite3.Connection,
    view: Json,
    built: Built,
    limits: tuple[int, int],
    story_key: Callable[[int], Key],
) -> list[Json]:
    """Put the cards among the For you view's stories. `latest` and `older` are in time order;
    `top` ranks stories and cards by one score (`story_key`, ``card_score``), so a card stands
    where a story of its time would, and `top` and `latest` hold the same entries. A card the view
    has no room for is dropped. `limits` are the view's counts of newest stories shown and older
    ones held. Returns the cards placed."""
    cards = built.cards
    when = _story_times(db, [*view["latest"], *view["older"]])
    when.update((card["id"], at) for at, card in cards)
    merged = [*view["latest"], *view["older"], *(card["id"] for _, card in cards)]
    merged.sort(key=lambda entry: when[entry], reverse=True)
    shown_count, older_count = limits
    merged = merged[: shown_count + older_count]
    shown = set(merged[:shown_count])
    keys = {entry: story_key(int(entry)) for entry in view["top"] if entry in shown}
    keys.update((card, key) for card, key in built.card_keys.items() if card in shown)
    ranked = [entry for entry in view["top"] if entry in shown]
    ranked += [card["id"] for _, card in cards if card["id"] in shown]
    view["top"], view["latest"] = top_order(ranked, keys), merged[:shown_count]
    view["older"] = merged[shown_count:]
    return [card for _, card in cards if card["id"] in set(merged)]


@dataclass
class Built:
    """Every digest part of a snapshot, before the cards are placed in the For you view."""

    form: Json
    named: bool = False  # the viewer has a display name
    records: list[Json] = field(default_factory=list)
    channel: list[Json] = field(default_factory=list)
    cards: list[tuple[datetime, Json]] = field(default_factory=list)
    card_keys: dict[str, Key] = field(default_factory=dict)

    @property
    def size(self) -> int:
        """The bytes the digest parts take in the reply (cards counted whole, placed or not)."""
        parts = [self.form, self.records, self.channel, [card for _, card in self.cards]]
        return len(json.dumps(parts, ensure_ascii=False).encode("utf-8"))


def _drawable(issues: list[digests.Issue], written: dict[int, Written]) -> list[digests.Issue]:
    """The issues this build can draw: a kind it knows (a written one with its points)."""
    return [
        one
        for one in issues
        if one.kind in _DRAWN and (one.kind != digests.WRITTEN or one.id in written)
    ]


def build(
    db: sqlite3.Connection,
    user: User | None,
    now: datetime,
    *,
    ai_on: bool,
    issuers: bool = False,
) -> Built:
    """The digest parts for `user`; `ai_on` says whether ``settings.ai.state`` is "on", `issuers`
    whether the form offers issuers. An issue of a kind this build does not draw (a later build
    wrote it) is left out, logged once. A digest's own saved covers keep an issuer cover either
    way, so an edit posted back from a page that does not show issuers never drops it."""
    paused = not ai_on
    owner = user.name if user is not None else None
    built = Built(_form(db, owner, issuers=issuers), named=user is not None)
    if user is None:
        return built
    left_out = 0
    for digest in digests.list_digests(db, user.name):
        stored = digests.recent_issues(db, digest.id, ISSUES_SHOWN)
        written = _written(db, digest, stored, now)
        issues = _drawable(stored, written)
        left_out += len(stored) - len(issues)
        kept = digests.recent_issues(db, digest.id, digests.KEEP_ISSUES)
        drawing = Drawing(now, False, written, _titles(digest, kept))
        built.records.append(_record(db, digest, issues, drawing, paused))
        unread = any(not one.read for one in issues)
        built.channel.append(
            {
                "id": str(digest.id),
                "name": digest.spec.name,
                "unread": unread and not paused,
                "paused": paused,
            }
        )
        for one in issues[:CARDS_PER_DIGEST]:
            built.cards.append((one.created_at, _card(digest, one, drawing)))
            score = card_score(one.kind == digests.WRITTEN, one.created_at, now)
            built.card_keys[f"d{one.id}"] = (score, one.created_at)
    if left_out:
        log.warning("%s digest issues of a kind this build does not draw were left out", left_out)
    return built


def place(
    db: sqlite3.Connection,
    built: Built,
    snap: Json,
    limits: tuple[int, int],
    story_key: Callable[[int], Key],
) -> None:
    """Fill the digest parts of `snap`, a snapshot the other parts have built, from `built`.
    `limits` are the For you view's counts of newest stories shown and older ones held;
    `story_key` is a story's place in Top (``group_view.Ranker.key``)."""
    snap["settings"]["digestForm"] = built.form
    if not built.named:
        return
    snap["digests"] = built.records
    snap["channels"]["digests"] = built.channel
    view = snap["feed"]["views"]["for-you"]
    snap["feed"]["digests"] = _place(db, view, built, limits, story_key)
