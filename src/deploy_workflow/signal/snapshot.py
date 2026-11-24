"""The reader-facing state of Signal for one user: the slice the React Signal screens read.

The shape is the one ``web/src/pages/signal/slice.ts`` (``readSlice``) accepts:
``{"scenes": [{"id": "main", "snapshot": {...}}]}``. Every display text the slice calls delivered
(times, counts, labels, monograms, initials, notes) is written here, from a ``now`` the caller
passes. Dates and the day boundaries behind "yesterday" are UTC.

The store holds users and roles, sources with their checks, stories with their duplicates, topics
with their follows, saves, and groups with their threads, comments, reactions, read marks, thread
rules and notification switches (written by ``group_view``, which also gives a story its sharer,
comment count and thread). Digests are the viewer's own and are written by ``digestview``. The AI
pass's state is the caller's (``ai``, an ``ai_gate.Status``; None: not set up): while it is on a
story carries what the pass wrote for it (``ai_view``), the Top order reads its signal strength,
and the "signal" notification event marks a followed topic's count with its strong stories of the
last day (``_strong_counts``); off or at its cap none of that is delivered and every digest is
paused.

Views: For you (stories in followed topics or shared in the viewer's groups), Latest, Saved and
one per topic. For you and each topic are ranked whole: ``latest`` holds every delivered id
newest first, ``top`` the same ids in the Top order (``group_view.ranker``), ``older`` is empty
and ``shown`` (SHOWN) is how many the page draws before Show older. For you delivers up to
``SHOWN + OLDER`` ids, a topic ``SHOWN``, or ``SHOWN + OLDER`` when the request focuses it
(``Focus.topic``). Latest and Saved keep their newest ``SHOWN`` in ``latest`` and ``top`` (Top
order among those) and the next up to ``OLDER`` in ``older``, with no ``shown``. Digest cards
join For you by time (``digestview``). ``waiting`` is null (the React app composes it when it
reads again). A viewer with no display name sees no stories and no counts. The whole snapshot is
read in one read transaction.

Size: the forwarder in front of the service refuses a reply over 4 MiB, so the snapshot is kept
under 3 MiB in every store state. The group part keeps its own budgets (``group_view``); the
stories then share what is left of ``STORY_AND_GROUP_BUDGET`` (and of ``SNAPSHOT_BUDGET`` after
the rest of the snapshot, the digest parts included), paid in the order ``_priority`` gives; a
story that does not fit is left out of every view, and a count beside a view left empty by it is
not delivered. A headline longer than ``HEADLINE_LIMIT`` characters is cut, and a link longer
than ``MAX_LINK`` is not delivered, so no one story outgrows the budget.

Focus: ``GET /api/snapshot?topic=<id>&thread=<id>`` (``Focus``) asks for a topic's older stories
and a thread's comments. An id that names nothing the viewer can see is ignored: the reply is the
same as without it.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from deploy_workflow.signal import (
    ai_gate,
    ai_view,
    digestview,
    feedview,
    group_view,
    ingest,
    notif,
    store,
    topics,
)
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.texts import ago, day, initials, monogram
from deploy_workflow.signal.texts import capital as _capital
from deploy_workflow.signal.texts import plural as _plural

__all__ = [
    "NO_FOCUS",
    "OLDER",
    "SHOWN",
    "Focus",
    "Service",
    "ago",
    "build",
    "day",
    "initials",
    "monogram",
]

Json = dict[str, Any]

SHOWN = 30
OLDER = 90
# Bytes the group part and the stories deliver together (the group part spends first, within its
# own budgets); everything else the snapshot holds is small and bounded by the store's limits.
STORY_AND_GROUP_BUDGET = 2304 << 10  # 2.25 MiB
SNAPSHOT_BUDGET = 2816 << 10  # 2.75 MiB: everything (the stories are paid from what is left)
HEADLINE_LIMIT = 500  # characters; a feed's title has no limit of its own
MAX_LINK = 2048  # a longer link is delivered as no link
_THREAD_FIELDS = 1024  # at most what sharedBy, commentCount and threadRef add to a card
_MAIN = ("saved", "for-you", "latest")
_UNRANKED = ("latest", "saved")  # views that keep SHOWN + older; the others are ranked whole
_WEEK = timedelta(days=7)
_STRONG_FOR = timedelta(hours=24)  # the "signal" event counts a topic's strong stories this recent


@dataclass(frozen=True)
class Focus:
    """What ``GET /api/snapshot?topic=<id>&thread=<id>`` asks to deliver in full."""

    topic: int | None = None
    thread: int | None = None


NO_FOCUS = Focus()


@dataclass(frozen=True)
class Service:
    """What the running service adds: whether the ingest loop's last pass failed, and the AI
    pass's status (None: no AI pass is set up, so it is off)."""

    pass_failed: bool = False
    ai: ai_gate.Status | None = None


NO_SERVICE = Service()
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


def build(
    db: sqlite3.Connection,
    user: User | None,
    now: datetime,
    *,
    focus: Focus = NO_FOCUS,
    service: Service = NO_SERVICE,
) -> Json:
    """The slice for `user` (None: no display name yet) as of `now`, read in one transaction.

    `focus` names a topic and a thread to deliver in full (see the module docstring). `service`
    says whether the ingest loop's last pass failed (the freshness line then says so) and gives
    the AI pass's status."""
    ai = service.ai
    on = ai is not None and ai.state == "on"
    with feedview.read_transaction(db):
        listed = topics.list_topics(db, user.name if user is not None else "")
        checked = [(row, ingest.health(db, row["id"], now)) for row in store.sources(db)]
        sources = _sources(checked, now, named=user is not None)
        held = _Cards(db, user, now, ai_on=on)
        parts = group_view.build(db, user, now, focus=focus.thread, story_cost=held.cost)
        channels = _channels(db, user, listed)
        if on and user is not None:
            _strong_counts(db, user, now, channels)
        settings = _settings(db, listed, sources, now)
        settings["ai"] = ai_view.settings_ai(ai, user, now)
        drawn = digestview.build(db, user, now, ai_on=on)
        rest = group_view.encoded_size([channels, settings]) + drawn.size
        stories, views = _stories_and_views(held, listed, parts, (focus.topic, rest))
        feed = {
            "status": "ready",
            "error": None,
            "sources": {"approved": any(row["state"] == "approved" for row, _ in checked)},
            "freshness": _freshness(checked, now, pass_failed=service.pass_failed),
            "stories": stories,
            "digests": [],
            "views": {key: views.pop(key) for key in ("for-you", "latest", "saved")},
            "topics": views,
        }
        _blank_counts(channels, feed)
        channels["groups"] = parts.channels
        settings["groups"] = parts.settings_groups
        settings["rules"] = []  # per group now: settings.groups[].rules
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
        digestview.place(db, user, drawn, snapshot, (SHOWN + OLDER, 0))  # For you: all in latest
    return {"scenes": [{"id": "main", "snapshot": snapshot}]}


# Delivered text


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


def _view(
    ids: list[int], rank: Callable[[list[int]], list[int]] | None = None, *, ranked: bool = False
) -> Json:
    """A view's delivered ids, newest first. A `ranked` view (For you, a topic) holds them all in
    `latest` and, in the Top order (`rank`), all in `top`, with `older` empty and `shown` the
    count the page draws before Show older. Any other view (Latest, Saved) holds the newest SHOWN
    in `latest` and, in the Top order, in `top`, and the rest in `older`."""
    every = [str(number) for number in ids]
    if ranked:
        order = ids if rank is None else rank(ids)
        top = [str(number) for number in order]
        return {"top": top, "latest": every, "waiting": None, "older": [], "shown": SHOWN}
    first = ids[:SHOWN] if rank is None else rank(ids[:SHOWN])
    return {
        "top": [str(number) for number in first],
        "latest": every[:SHOWN],
        "waiting": None,
        "older": every[SHOWN : SHOWN + OLDER],
    }


def _headline(title: str) -> str:
    """A title as stored, or, past HEADLINE_LIMIT characters, cut at a space with an ellipsis."""
    if len(title) <= HEADLINE_LIMIT:
        return title
    head = title[:HEADLINE_LIMIT]
    cut = head.rsplit(" ", 1)[0] if " " in head else head
    return cut.rstrip() + "\u2026"


def _story(
    db: sqlite3.Connection,
    card: feedview.Card,
    now: datetime,
    threaded: Json,
    found: ai_view.StoryAi | None = None,
) -> Json:
    """`threaded` holds the story's sharedBy, commentCount and threadRef (group_view); `found` what
    the AI pass wrote for it, delivered only while the pass is on."""
    others = feedview.other_sources(db, card.id)
    also = None
    if others:
        also = {
            "label": "Also in " + _plural(len(others), "other source", "other sources"),
            "monograms": [monogram(name) for name in others[:3]],
            "more": f"+{len(others) - 3}" if len(others) > 3 else None,
        }
    web = card.link.lower().startswith(("http://", "https://")) and len(card.link) <= MAX_LINK
    story: Json = {
        "id": str(card.id),
        "kind": card.kind,
        "kindLabel": _KIND[card.kind],
        "headline": _headline(card.title),
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
    if found is not None:
        story.update(ai_view.story_fields(found, card.kind, _KIND[card.kind], card.topics))
    return story


class _Cards:
    """The viewer's story cards, read once each; `cost` is a card's bytes for the group part.
    While the AI pass is on (`ai_on`) each card carries what the pass wrote for its story."""

    def __init__(
        self, db: sqlite3.Connection, user: User | None, now: datetime, *, ai_on: bool = False
    ) -> None:
        self.db, self.user, self.now, self.ai_on = db, user, now, ai_on
        self.found: dict[int, feedview.Card] = {}
        self.ai: dict[int, ai_view.StoryAi] = {}

    def load(self, ids: list[int]) -> None:
        missing = sorted(set(ids) - set(self.found))
        if missing and self.user is not None:
            self.found.update(feedview.cards(self.db, self.user.name, missing))
            if self.ai_on:
                self.ai.update(ai_view.load(self.db, missing))

    def story(self, story_id: int, threaded: Json) -> Json | None:
        card = self.found.get(story_id)
        if card is None:
            return None
        return _story(self.db, card, self.now, threaded, self.ai.get(story_id))

    def strengths(self) -> dict[int, int]:
        return {story_id: found.signal for story_id, found in self.ai.items()}

    def cost(self, story_id: int) -> int:
        """The card's bytes, with room for the fields a delivered thread adds to it."""
        self.load([story_id])
        built = self.story(story_id, {})
        return 0 if built is None else group_view.encoded_size(built) + _THREAD_FIELDS


def _priority(held: dict[str, list[int]], focused: str | None) -> list[int]:
    """The order stories are paid in: the newest of Saved, For you and Latest; the focused topic's
    whole list; the newest of every other topic; the rest of the three main views' SHOWN; the
    other topics' SHOWN, one of each in turn; then the main views' older stories, likewise."""
    main = [held[key] for key in _MAIN]
    topics_ = [ids for key, ids in held.items() if key not in _MAIN and key != focused]
    order = [ids[0] for ids in main if ids]
    order += held[focused] if focused is not None else []
    order += [ids[0] for ids in topics_ if ids]
    order += [n for ids in main for n in ids[1:SHOWN]]
    order += [ids[i] for i in range(1, SHOWN) for ids in topics_ if i < len(ids)]
    order += [ids[i] for i in range(SHOWN, SHOWN + OLDER) for ids in main if i < len(ids)]
    return order


def _blank_counts(channels: Json, feed: Json) -> None:
    """A count beside a view that the size bound left empty is not delivered (the reader never
    shows a count beside an empty list): a topic's, and the Saved badge."""
    for topic in channels["topics"]:
        if topic["count"] != "0" and not feed["topics"][topic["id"]]["latest"]:
            topic["count"] = None
    if channels["savedCount"] != "0" and not feed["views"]["saved"]["latest"]:
        channels["savedCount"] = None


def _paid(order: list[int], costs: dict[int, int], free: set[int], left: int) -> set[int]:
    """The stories delivered: those `free` (a delivered thread paid for them), then each in
    `order` whose card fits in what is left of `left` bytes (one that does not is left out)."""
    chosen = set(free)
    for story_id in order:
        if story_id in chosen or story_id not in costs:
            continue
        if costs[story_id] + 1 <= left:  # one more byte: the comma between cards
            chosen.add(story_id)
            left -= costs[story_id] + 1
    return chosen


def _stories_and_views(
    held_cards: _Cards,
    listed: list[sqlite3.Row],
    parts: group_view.Parts,
    asked: tuple[int | None, int],
) -> tuple[list[Json], dict[str, Json]]:
    """Every story a view or a delivered thread names, newest first, and each view's ids: the
    three fixed views by name and one per topic by its id. A viewer with no name has no stories
    and empty views. `asked` is the focused topic and the bytes the rest of the snapshot takes.
    The stories share STORY_AND_GROUP_BUDGET with the group part, which spent its part first;
    with the rest they stay within SNAPSHOT_BUDGET."""
    db, user, now = held_cards.db, held_cards.user, held_cards.now
    topic, rest = asked
    names = {"for-you": "foryou", "latest": "latest", "saved": "saved"}
    names.update({str(row["id"]): f"topic:{row['id']}" for row in listed})
    if user is None:
        return [], {key: _view([], ranked=key not in _UNRANKED) for key in names}
    focused = str(topic) if topic is not None and str(topic) in names else None
    depth = {key: SHOWN + OLDER if key in _MAIN or key == focused else SHOWN for key in names}
    held = {key: feedview.view_ids(db, user.name, view, depth[key]) for key, view in names.items()}
    free = set(group_view.story_ids(parts))
    held_cards.load([n for ids in held.values() for n in ids] + sorted(free))
    built = {
        n: card
        for n in held_cards.found
        if (card := held_cards.story(n, parts.on_story.get(n, {}))) is not None
    }
    costs = {n: group_view.encoded_size(card) for n, card in built.items()}
    left = min(STORY_AND_GROUP_BUDGET, SNAPSHOT_BUDGET - rest) - parts.spent
    chosen = _paid(_priority(held, focused), costs, free & set(built), left)
    cards = sorted((held_cards.found[n] for n in chosen), key=lambda c: (c.published_at, c.id))
    published = {card.id: card.published_at for card in reversed(cards)}
    rank = group_view.ranker(db, user.name, published, now, held_cards.strengths())
    stories = [built[card.id] for card in reversed(cards)]
    return stories, {
        key: _view([n for n in ids if n in chosen], rank, ranked=key not in _UNRANKED)
        for key, ids in held.items()
    }


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
        "ai": ai_view.settings_ai(None, None, now),
        "groups": [],
        "rules": [],
        "notifications": {"events": []},
        "sources": sources,
        "sourceWeeksHeading": f"Items per week, {ingest.HEALTH_WEEKS} weeks",
    }


def _strong_counts(db: sqlite3.Connection, user: User, now: datetime, channels: Json) -> None:
    """The "signal" notification event (spec 5.9): while its "In Signal" switch is on, a followed
    topic holding strong stories (3 marks) published in the last 24 hours shows how many beside it
    ("2 strong") in place of its story count. Only while the AI pass is on."""
    if not notif.switches(db, user.name)["signal"][0]:
        return
    rows = db.execute(
        "SELECT ts.topic_id, COUNT(*) AS n FROM topic_stories ts"
        " JOIN topic_follows f ON f.topic_id = ts.topic_id AND f.user_name = ?"
        " JOIN story_ai a ON a.story_id = ts.story_id AND a.outcome = 'written' AND a.signal = 3"
        " JOIN stories s ON s.id = ts.story_id WHERE s.published_at > ? GROUP BY ts.topic_id",
        (user.name, store._utc_text(now - _STRONG_FOR)),
    ).fetchall()
    strong = {str(row["topic_id"]): int(row["n"]) for row in rows}
    for topic in channels["topics"]:
        if strong.get(topic["id"]):
            topic["count"] = f"{strong[topic['id']]} strong"


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


def _source(
    row: sqlite3.Row, health: ingest.Health, now: datetime, name_rank: int, *, named: bool
) -> Json:
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
        "stateNote": proposed if state == "Proposed" and named else None,
        "healthNote": note,
        "lastCheck": ago(checked, now) if checked is not None else None,
        "lastItem": ago(item, now) if item is not None else None,
        "weeks": _weeks(health, now),
        "sort": {"name": name_rank, "state": _STATE_RANK[state], "health": _HEALTH_RANK[shown]},
    }


def _sources(checked: Checked, now: datetime, *, named: bool) -> list[Json]:
    """Every source, in the order it was added; `sort.name` ranks the names A to Z. A viewer with
    no display name is not told who proposed a source (`named` False)."""
    order = sorted(range(len(checked)), key=lambda i: (checked[i][0]["name"].casefold(), i))
    rank = {index: place for place, index in enumerate(order, start=1)}
    return [
        _source(row, health, now, rank[i], named=named) for i, (row, health) in enumerate(checked)
    ]
