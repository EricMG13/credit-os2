"""The reader-facing state of Signal for one user: the slice the React Signal screens read.

The shape is the one ``web/src/pages/signal/slice.ts`` (``readSlice``) accepts:
``{"scenes": [{"id": "main", "snapshot": {...}}]}``. Every display text the slice calls delivered
(times, counts, labels, monograms, initials, notes) is written here, from a ``now`` the caller
passes. Dates and the day boundaries behind "yesterday" are UTC.

The store holds users and roles, sources with their checks, stories with their duplicates, topics
with their follows, and saves. Digests are the viewer's own and are written by ``digestview``: with
the AI pass not built every digest is delivered paused. Everything else the slice can carry
(groups, threads, thread rules, notification events, the AI pass and its spend) does not exist in
this service and is delivered empty: AI is off with a notice saying it is not set up, and no story
carries an AI line, a strength, a sharer, comments, a thread, a case stage or rating moves.

Views: For you (stories in followed topics), Latest, Saved and one per topic. Each holds its newest
``SHOWN`` story ids in both ``top`` and ``latest`` (nothing is ranked, so the two orders are equal)
and the next up to ``OLDER`` in ``older``; ``waiting`` is null (the React app composes it when it
reads again). A viewer with no display name sees no stories and no counts. The whole snapshot is
read in one read transaction.
"""

from __future__ import annotations

import json
import sqlite3
import unicodedata
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from deploy_workflow.signal import digestview, feedview, group_view, ingest, store, topics
from deploy_workflow.signal.identity import User

__all__ = ["OLDER", "SHOWN", "build", "initials", "monogram"]

Json = dict[str, Any]

SHOWN = 30
OLDER = 90
_WEEK = timedelta(days=7)
_MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
_KIND = {
    "regulator": "Regulatory case",
    "news": "News",
    "ratings": "Rating action",
    "research": "Research",
}
_KINDS = {
    "news": "News",
    "regulator": "Regulatory cases",
    "ratings": "Rating actions",
    "research": "Research",
}  # in the order a list of kinds is drawn
_STATE = {"approved": "Approved", "paused": "Paused", "proposed": "Proposed"}
_STATE_RANK = {"Approved": 1, "Paused": 2, "Proposed": 3}
_HEALTH = {"healthy": "Healthy", "quiet": "Quiet", "failing": "Failing"}
_HEALTH_RANK = {"Healthy": 1, "Quiet": 2, "Failing": 3, None: 4}
_ARTICLES = frozenset({"the", "a", "an"})


def build(
    db: sqlite3.Connection, user: User | None, now: datetime, *, pass_failed: bool = False
) -> Json:
    """The slice for `user` (None: no display name yet) as of `now`, read in one transaction.

    `pass_failed` says the ingest loop's last pass failed; the freshness line then says so."""
    with feedview.read_transaction(db):
        listed = topics.list_topics(db, user.name if user is not None else "")
        checked = [(row, ingest.health(db, row["id"], now)) for row in store.sources(db)]
        sources = _sources(checked, now)
        parts = group_view.build(db, user, now)
        stories, views = _stories_and_views(db, user, listed, now, parts)
        feed = {
            "status": "ready",
            "error": None,
            "sources": {"approved": any(row["state"] == "approved" for row, _ in checked)},
            "freshness": _freshness(checked, now, pass_failed=pass_failed),
            "stories": stories,
            "digests": [],
            "views": {key: views.pop(key) for key in ("for-you", "latest", "saved")},
            "topics": views,
        }
        channels = _channels(db, user, listed)
        channels["groups"] = parts.channels
        settings = _settings(db, listed, sources, now)
        settings["groups"] = parts.settings_groups
        settings["rules"] = group_view.rules(db)
        settings["notifications"] = group_view.notifications(db, user)
        snapshot = {
            "viewer": _viewer(user),
            "channels": channels,
            "feed": feed,
            "groups": parts.groups,
            "threads": parts.threads,
            "digests": [],
            "settings": settings,
        }
        digestview.apply(db, user, now, snapshot)
    return {"scenes": [{"id": "main", "snapshot": snapshot}]}


# Delivered text


def _utc(at: datetime) -> datetime:
    return at.astimezone(UTC)


def day(at: datetime, now: datetime) -> str:
    """A UTC date as "4 Nov", with the year when it is not `now`'s."""
    when = _utc(at)
    text = f"{when.day} {_MONTHS[when.month - 1]}"
    return text if when.year == _utc(now).year else f"{text} {when.year}"


def ago(at: datetime, now: datetime) -> str:
    """How long before `now`: "just now", "6 min ago", "2 h ago", "yesterday" or a date."""
    seconds = (now - at).total_seconds()
    if seconds < 60:
        return "just now"  # also a time a little ahead of `now` (another machine's clock)
    if seconds < 3600:
        return f"{int(seconds // 60)} min ago"
    if seconds < 86400:
        return f"{int(seconds // 3600)} h ago"
    if (_utc(now).date() - _utc(at).date()).days == 1:
        return "yesterday"
    return day(at, now)


def _capital(text: str) -> str:
    return text[:1].upper() + text[1:]


def _plural(count: int, one: str, many: str) -> str:
    return f"{count} {one if count == 1 else many}"


def _first_marks(words: list[str]) -> str:
    """The first letter or digit of each of the first two words that have one, upper case."""
    marks = []
    for word in words:
        found = next((ch for ch in word if unicodedata.category(ch)[0] in "LN"), None)
        if found is not None:
            marks.append(found)
    return "".join(marks[:2]).upper()


def initials(name: str) -> str:
    """A viewer's initials as the React name dialog makes them; "?" when the name has none."""
    return _first_marks(name.split()) or "?"


def monogram(name: str) -> str:
    """A publication's tile: its initials, a leading article left out ("The Meridian Post": MP)."""
    words = name.split()
    if len(words) > 1 and words[0].casefold() in _ARTICLES:
        words = words[1:]
    return _first_marks(words) or "?"


def _number(value: float) -> float | int:
    """A bar height to two places; a whole number is written as one (1, not 1.0)."""
    rounded = round(value, 2)
    return int(rounded) if rounded == int(rounded) else rounded


# Viewer and channels


def _viewer(user: User | None) -> Json:
    if user is None:
        return {"name": None, "initials": None, "role": "reader", "roleLabel": "Reader"}
    return {
        "name": user.name,
        "initials": initials(user.name),
        "role": "reader" if user.role == "reader" else "writer",
        "roleLabel": _capital(user.role),
    }


def _channels(db: sqlite3.Connection, user: User | None, listed: list[sqlite3.Row]) -> Json:
    named = user is not None
    saved = feedview.new_count(db, user.name, "saved", 0) if user is not None else None
    return {
        "topics": [
            {
                "id": str(row["id"]),
                "name": row["name"],
                "count": str(row["stories"]) if named else None,
                "followed": named and bool(row["following"]),
                "keywords": json.loads(row["keywords"]),
            }
            for row in listed
        ],
        "groups": [],
        "digests": [],
        "savedCount": None if saved is None else str(saved),
    }


# Feed


def _view(ids: list[int], rank: Callable[[list[int]], list[int]] | None = None) -> Json:
    """The newest SHOWN ids in `latest` and, in the Top order (`rank`), in `top`; the rest older."""
    shown = [str(number) for number in ids]
    top = ids[:SHOWN] if rank is None else rank(ids[:SHOWN])
    return {
        "top": [str(number) for number in top],
        "latest": shown[:SHOWN],
        "waiting": None,
        "older": shown[SHOWN : SHOWN + OLDER],
    }


def _story(db: sqlite3.Connection, card: feedview.Card, now: datetime, threaded: Json) -> Json:
    """`threaded` holds the story's sharedBy, commentCount and threadRef (group_view)."""
    others = feedview.other_sources(db, card.id)
    also = None
    if others:
        also = {
            "label": "Also in " + _plural(len(others), "other source", "other sources"),
            "monograms": [monogram(name) for name in others[:3]],
            "more": f"+{len(others) - 3}" if len(others) > 3 else None,
        }
    web = card.link.lower().startswith(("http://", "https://"))
    return {
        "id": str(card.id),
        "kind": card.kind,
        "kindLabel": _KIND[card.kind],
        "headline": card.title,
        "url": card.link if web else None,
        "source": {"name": card.source, "monogram": monogram(card.source)},
        "time": _capital(ago(datetime.fromisoformat(card.published_at), now)),
        "summary": card.summary if card.summary.strip() else None,
        "tags": list(card.topics),
        "alsoIn": also,
        "sharedBy": threaded.get("sharedBy"),
        "ai": None,
        "strength": None,
        "saved": card.saved,
        "commentCount": threaded.get("commentCount"),
        "threadRef": threaded.get("threadRef"),
        "stage": None,
        "ratingMoves": [],
    }


def _stories_and_views(
    db: sqlite3.Connection,
    user: User | None,
    listed: list[sqlite3.Row],
    now: datetime,
    parts: group_view.Parts,
) -> tuple[list[Json], dict[str, Json]]:
    """Every story a view or a delivered thread names, newest first, and each view's ids: the
    three fixed views by name and one per topic by its id. A viewer with no name has no stories
    and empty views."""
    names = {"for-you": "foryou", "latest": "latest", "saved": "saved"}
    names.update({str(row["id"]): f"topic:{row['id']}" for row in listed})
    if user is None:
        return [], {key: _view([]) for key in names}
    held = {
        key: feedview.view_ids(db, user.name, view, SHOWN + OLDER) for key, view in names.items()
    }
    named = {n for ids in held.values() for n in ids} | set(group_view.story_ids(parts))
    found = feedview.cards(db, user.name, sorted(named))
    newest_first = sorted(found.values(), key=lambda c: (c.published_at, c.id), reverse=True)
    published = {card.id: card.published_at for card in newest_first}
    rank = group_view.ranker(db, user.name, published, now)
    stories = [_story(db, card, now, parts.on_story.get(card.id, {})) for card in newest_first]
    return stories, {key: _view(ids, rank) for key, ids in held.items()}


Checked = list[tuple[sqlite3.Row, ingest.Health]]


def _freshness(checked: Checked, now: datetime, *, pass_failed: bool) -> Json:
    """The freshness line over the approved sources: the newest check, and how many fail."""
    approved = [health for row, health in checked if row["state"] == "approved"]
    times = [health.last_check for health in approved if health.last_check is not None]
    failing = sum(health.state == "failing" for health in approved)
    return {
        "state": "checked" if times else "not-checked",
        "checked": ago(max(times), now) if times else None,
        "failing": _plural(failing, "source failing", "sources failing") if failing else None,
        "error": "last ingest pass failed" if pass_failed else None,
    }


# Settings


def _settings(
    db: sqlite3.Connection, listed: list[sqlite3.Row], sources: list[Json], now: datetime
) -> Json:
    recent = topics.counts_since(db, now - _WEEK)
    return {
        "topics": [_settings_topic(row, recent.get(row["id"], 0)) for row in listed],
        "ai": _ai_off(),
        "groups": [],
        "rules": [],
        "notifications": {"events": []},
        "sources": sources,
        "sourceWeeksHeading": f"Items per week, {ingest.HEALTH_WEEKS} weeks",
    }


def _ai_off() -> Json:
    """AI and cost: off, because this service has no AI pass, so nothing is spent."""
    text = (
        "The AI pass is not set up on this Signal service. Stories arrive with no AI line and "
        "no signal strength, and a digest with stories to cover writes no issue. Nothing is spent."
    )
    return {
        "state": "off",
        "notice": {"title": "AI is off", "text": text},
        "spend": None,
        "parts": [],
    }


def _settings_topic(row: sqlite3.Row, recent: int) -> Json:
    kinds = set(json.loads(row["kinds"])) or set(_KINDS)  # none listed: it takes every kind
    weekly = (
        f"{_plural(recent, 'story', 'stories')} this week" if recent else "No stories this week"
    )
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "weekly": weekly,
        "keywords": json.loads(row["keywords"]),
        "kinds": [label for kind, label in _KINDS.items() if kind in kinds],
    }


def _weeks(health: ingest.Health, now: datetime) -> list[Json]:
    """One bar per week, oldest first; none for a source never checked (no week was read)."""
    if health.last_check is None:
        return []
    top = max(health.per_week)
    weeks = []
    for index, count in enumerate(health.per_week):
        start = now - (ingest.HEALTH_WEEKS - index) * _WEEK
        height = _number(max(count / top, 0.01)) if count else 0  # a count is never a flat bar
        weeks.append({"label": f"Week of {day(start, now)}", "items": str(count), "height": height})
    return weeks


def _health_texts(health: ingest.Health, now: datetime) -> tuple[str | None, str | None]:
    """The failing reason and the note under the health badge."""
    if health.state == "failing":
        return f"The last check failed: {health.reason}", None
    if health.state != "quiet":
        return None, None
    if health.last_item is None:
        return None, "No item yet"
    return None, "No item for " + _plural((now - health.last_item).days, "day", "days")


def _source(row: sqlite3.Row, health: ingest.Health, now: datetime, name_rank: int) -> Json:
    state = _STATE[row["state"]]
    shown = _HEALTH.get(health.state) if state == "Approved" else None  # only approved are checked
    reason, note = _health_texts(health, now) if shown is not None else (None, None)
    proposed = f"By {row['proposed_by']}, {ago(datetime.fromisoformat(row['created_at']), now)}"
    checked = health.last_check
    item = health.last_item if checked is not None else None
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "kind": _KINDS[row["kind"]],
        "state": state,
        "health": shown,
        "reason": reason,
        "stateNote": proposed if state == "Proposed" else None,
        "healthNote": note,
        "lastCheck": ago(checked, now) if checked is not None else None,
        "lastItem": ago(item, now) if item is not None else None,
        "weeks": _weeks(health, now),
        "sort": {"name": name_rank, "state": _STATE_RANK[state], "health": _HEALTH_RANK[shown]},
    }


def _sources(checked: Checked, now: datetime) -> list[Json]:
    """Every source, in the order it was added; `sort.name` ranks the names A to Z."""
    order = sorted(range(len(checked)), key=lambda i: (checked[i][0]["name"].casefold(), i))
    rank = {index: place for place, index in enumerate(order, start=1)}
    return [_source(row, health, now, rank[i]) for i, (row, health) in enumerate(checked)]
