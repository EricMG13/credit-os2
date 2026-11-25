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
read in one read transaction. A view of more than ``feedview.MEMBERS_READ`` members is read from
the newest ``feedview.WINDOW`` stories (``feedview.view_ids``) and, when those hold fewer of its
stories than it shows, from its own newest member rows, so a very large topic whose stories are
older than that window still delivers its newest and keeps its count.

Size: the forwarder in front of the service refuses a reply over 4 MiB, so the snapshot is kept
under 3 MiB in every store state. The group part keeps its own budgets (``group_view``); the
stories then share what is left of ``STORY_AND_GROUP_BUDGET`` (and of ``SNAPSHOT_BUDGET`` after
the rest of the snapshot, the digest parts included), paid in the order ``_priority`` gives; a
story that does not fit is left out of every view, and a count beside a view left empty by it is
not delivered. A headline longer than ``HEADLINE_LIMIT`` characters is cut, and a link longer
than ``MAX_LINK`` is not delivered, so no one story outgrows the budget. Settings lists at most
``MAX_SOURCES`` sources (the approved first, a failing one before the others; then the proposed,
then the paused; each by name) and, when it leaves some out, says so in ``settings.sourcesMore``
(absent otherwise; the owner removes sources on the command line).

Focus: ``GET /api/snapshot?topic=<id>&thread=<id>`` (``Focus``) asks for a topic's older stories
and a thread's comments (with ``format=2`` also ``issuer=<id>``, an issuer's older stories). An id
that names nothing the viewer can see is ignored: the reply is the same as without it.

Formats. ``fmt`` 1 (the default; ``GET /api/snapshot`` or ``?format=1``) is exactly what the
current React reader accepts: stories of the four feed kinds only, no thread naming any other, no
issuer data, no filing or market source in Settings or the freshness line, and every count over
those stories only (``feedview.FORMAT_1``). ``fmt`` 2 (``?format=2``) delivers every kind
(``filing`` "Filing", ``market`` "Market") and the format-2 keys: a story's ``issuers`` and
``market`` (``market.delivered``), ``channels.issuers``, ``feed.issuers``, ``settings.issuers``
and ``settings.filings`` (``issuer_view``), and the issuers among the digest form's covers.

Tags (the rule of docs/superpowers/specs/2026-11-25-signal-issuers-filings-market.md, section 6):
a market post carries "Market" only; a filing its form type first; then the AI pass's tags (feed
kinds only, while it is on), then the names of the story's topics, those the viewer follows first;
a tag that repeats an earlier one case-folded is dropped; at most ``ai_view.MAX_STORY_TAGS``.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from deploy_workflow.signal import (
    ai_gate,
    ai_view,
    digestview,
    feedview,
    group_view,
    ingest,
    issuer_view,
    issuers,
    market,
    notif,
    store,
    topics,
)
from deploy_workflow.signal.store import FILING, KINDS, MARKET
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.texts import ago, day, initials, monogram, shortened
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
MAX_SOURCES = 200  # source rows Settings delivers (the owner can remove the rest)
HEADLINE_LIMIT = 500  # characters; a feed's title has no limit of its own
MAX_LINK = 2048  # a longer link is delivered as no link
_THREAD_FIELDS = 1024  # at most what sharedBy, commentCount and threadRef add to a card
_MAIN = ("saved", "for-you", "latest")
_UNRANKED = ("latest", "saved")  # views that keep SHOWN + older; the others are ranked whole
_WEEK = timedelta(days=7)
_STRONG_FOR = timedelta(hours=24)  # the "signal" event counts a topic's strong stories this recent


@dataclass(frozen=True)
class Focus:
    """What ``GET /api/snapshot?topic=<id>&thread=<id>&issuer=<id>`` asks to deliver in full."""

    topic: int | None = None
    thread: int | None = None
    issuer: int | None = None  # format 2 only


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
    FILING: "Filing",
    MARKET: "Market",
}
_KINDS = {
    "news": "News",
    "regulator": "Regulatory cases",
    "ratings": "Rating actions",
    "research": "Research",
    FILING: "Filings",
    MARKET: "Market data",
}  # in the order a list of kinds is drawn
MARKET_TAG = "Market"
MAX_STORY_ISSUERS = 6  # issuers a story carries, by name: a card's size stays bounded
_ISSUER = "issuer:"  # the key of an issuer's view among the views a snapshot reads
_STATE = {"approved": "Approved", "paused": "Paused", "proposed": "Proposed"}
_STATE_RANK = {"Approved": 1, "Paused": 2, "Proposed": 3}
_HEALTH = {"healthy": "Healthy", "quiet": "Quiet", "failing": "Failing"}
_HEALTH_RANK = {"Healthy": 1, "Quiet": 2, "Failing": 3, None: 4}
_LISTED_FIRST = ("approved", "proposed", "paused")  # the order Settings keeps sources in


FORMATS = (1, 2)


@dataclass(frozen=True)
class _Read:
    """One snapshot's store, viewer, time and format."""

    db: sqlite3.Connection
    user: User | None
    now: datetime
    fmt: int

    @property
    def reading(self) -> feedview.Reading:
        return feedview.FORMAT_1 if self.fmt == 1 else feedview.EVERY


def build(  # noqa: PLR0913 -- the store, viewer and time; keyword-only focus, service and format
    db: sqlite3.Connection,
    user: User | None,
    at: datetime | Callable[[], datetime],
    *,
    focus: Focus = NO_FOCUS,
    service: Service = NO_SERVICE,
    fmt: int = 1,
) -> Json:
    """The slice for `user` (None: no display name yet) as of `at`, read in one transaction.

    `at` is a time, or a clock: the clock is read once, inside the read transaction after its first
    read, so everything the snapshot holds (a comment committed before that read) is stamped no
    later than the time it is then delivered as (`asOf`, beside `scenes`); a time given is the
    caller's and no `asOf` is added. `focus` names a topic, a thread and (format 2) an issuer to
    deliver in full (see the module docstring). `service` says whether the ingest loop's last pass
    failed (the freshness line then says so) and gives the AI pass's status. `fmt` is the
    delivered format, 1 or 2 (see the module docstring); ValueError for any other."""
    if fmt not in FORMATS:
        raise ValueError(f"no snapshot format {fmt!r}")
    ai = service.ai
    on = ai is not None and ai.state == "on"
    reading = feedview.FORMAT_1 if fmt == 1 else feedview.EVERY
    with feedview.read_transaction(db):
        listed = topics.list_topics(db, user.name if user is not None else "", reading.condition)
        now = at() if callable(at) else at
        read = _Read(db, user, now, fmt)
        checked = _checked(read)
        held = _Cards(db, user, now, ai_on=on, fmt=fmt)
        parts = group_view.build(
            db, user, now, focus=focus.thread, story_cost=held.cost, stories=reading.condition
        )
        channels, settings = _lists(read, listed, checked, ai)
        if on and user is not None:
            _strong_counts(db, user, now, channels)
        drawn = digestview.build(db, user, now, ai_on=on, issuers=fmt == 2)
        rest = group_view.encoded_size([channels, settings]) + drawn.size
        rest += view_reserve(len(channels.get("issuers", [])))
        stories, views = _stories_and_views(held, listed, parts, (_focused(focus, fmt), rest))
        feed = _feed(read, checked, service, stories, views)
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
        key = held.rank.key if held.rank is not None else _unranked
        digestview.place(db, drawn, snapshot, (SHOWN + OLDER, 0), key)  # For you: all in latest
    built: Json = {"scenes": [{"id": "main", "snapshot": snapshot}]}
    if callable(at):
        built["asOf"] = store._utc_text(now)
    return built


def view_reserve(views: int) -> int:
    """The most bytes `views` issuer views' id lists can take (a ranked view holds its ids twice,
    in `top` and `latest`: SHOWN of them, and OLDER more for the one a request may focus; each id
    of at most 19 digits with its quotes and comma): reserved before the stories are paid."""
    if views == 0:
        return 0
    return 2 * (views * SHOWN + OLDER) * (len(str(feedview.MAX_ID)) + 3)


def _checked(read: _Read) -> Checked:
    """Every source this format lists, with its health: format 1 leaves out filing and market
    sources (Settings, the freshness line and `sources.approved` alike)."""
    return [
        (row, ingest.health(read.db, row["id"], read.now))
        for row in store.sources(read.db)
        if read.fmt == 2 or row["kind"] in KINDS
    ]


def _focused(focus: Focus, fmt: int) -> tuple[str, ...]:
    """The keys of the views the request asks to deliver whole: a topic's, and (format 2) an
    issuer's."""
    keys = [] if focus.topic is None else [str(focus.topic)]
    if fmt == 2 and focus.issuer is not None:
        keys.append(f"{_ISSUER}{focus.issuer}")
    return tuple(keys)


def _lists(
    read: _Read, listed: list[sqlite3.Row], checked: Checked, ai: ai_gate.Status | None
) -> tuple[Json, Json]:
    """The channels and Settings (their group parts are filled in later)."""
    db, user, now = read.db, read.user, read.now
    channels = _channels(read, listed)
    settings = _settings(read, listed, _sources(checked, now, named=user is not None))
    if (more := _sources_more(len(checked))) is not None:
        settings["sourcesMore"] = more  # optional: only while sources are left out
    settings["ai"] = ai_view.settings_ai(ai, user, now)
    if read.fmt == 2:
        channels["issuers"] = issuer_view.channels(db, user)
        settings["issuers"] = issuer_view.settings(
            db, {row["id"]: (row, h) for row, h in checked}, now
        )
        settings["filings"] = issuer_view.filings_line(db)
    return channels, settings


def _feed(
    read: _Read, checked: Checked, service: Service, stories: list[Json], views: dict[str, Json]
) -> Json:
    main = {key: views.pop(key) for key in ("for-you", "latest", "saved")}
    held = {
        key.removeprefix(_ISSUER): views.pop(key) for key in list(views) if key.startswith(_ISSUER)
    }
    feed = {
        "status": "ready",
        "error": None,
        "sources": {"approved": any(row["state"] == "approved" for row, _ in checked)},
        "freshness": _freshness(checked, read.now, pass_failed=service.pass_failed),
        "stories": stories,
        "digests": [],
        "views": main,
        "topics": views,
    }
    if read.fmt == 2:
        feed["issuers"] = held
    return feed


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


def _channels(read: _Read, listed: list[sqlite3.Row]) -> Json:
    user = read.user
    named = user is not None
    saved = (
        feedview.new_count(read.db, user.name, "saved", 0, read.reading)
        if user is not None
        else None
    )
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
    return shortened(title, HEADLINE_LIMIT)


def _distinct(names: list[str]) -> list[str]:
    """`names` with any that repeats an earlier one case-folded dropped (the earlier kept)."""
    seen: set[str] = set()
    kept = []
    for name in names:
        if name.casefold() not in seen:
            seen.add(name.casefold())
            kept.append(name)
    return kept


def _tags(card: feedview.Card) -> list[str]:
    """A story's tags with no AI fields (see the module docstring): "Market" alone on a market
    post; a filing's form type, then the topic names; else the topic names."""
    if card.kind == MARKET:
        return [MARKET_TAG]
    first = [card.category] if card.kind == FILING and card.category else []
    return _distinct([*first, *card.topics])[: ai_view.MAX_STORY_TAGS]


def _story(cards: _Cards, card: feedview.Card, threaded: Json) -> Json:
    """`threaded` holds the story's sharedBy, commentCount and threadRef (group_view); what the AI
    pass wrote for it is delivered only while the pass is on, and never on a filing or a market
    post."""
    others = feedview.other_sources(cards.db, card.id)
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
        "time": _capital(ago(datetime.fromisoformat(card.published_at), cards.now)),
        "summary": card.summary if card.summary.strip() else None,
        "tags": _tags(card),
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
    found = cards.ai.get(card.id) if card.kind in KINDS else None
    if found is not None:
        topic_tags = _distinct(list(card.topics))
        story.update(ai_view.story_fields(found, card.kind, _KIND[card.kind], topic_tags))
    if cards.read.fmt == 2:
        named = cards.issuers.get(card.id, [])[:MAX_STORY_ISSUERS]
        story["issuers"] = [{"id": str(n), "name": name} for n, name in named]
        table = cards.tables.get(card.id) if card.kind == MARKET else None
        story["market"] = None if table is None else market.delivered(*table, cards.now)
    return story


class _Cards:
    """The viewer's story cards, read once each; `cost` is a card's bytes for the group part.
    While the AI pass is on (`ai_on`) each card carries what the pass wrote for its story; in
    format 2 each carries its issuers, and a market post its table."""

    def __init__(
        self,
        db: sqlite3.Connection,
        user: User | None,
        now: datetime,
        *,
        ai_on: bool = False,
        fmt: int = 1,
    ) -> None:
        self.read, self.ai_on = _Read(db, user, now, fmt), ai_on
        self.db, self.user, self.now = db, user, now
        self.found: dict[int, feedview.Card] = {}
        self.ai: dict[int, ai_view.StoryAi] = {}
        self.issuers: dict[int, list[tuple[int, str]]] = {}
        self.tables: dict[int, tuple[date, list[market.Row]]] = {}
        self.rank: group_view.Ranker | None = None  # the Top order, once the stories are chosen

    def load(self, ids: list[int]) -> None:
        missing = sorted(set(ids) - set(self.found))
        if not missing or self.user is None:
            return
        self.found.update(feedview.cards(self.db, self.user.name, missing))
        if self.ai_on:
            self.ai.update(ai_view.load(self.db, missing))
        if self.read.fmt == 2:
            self.issuers.update(issuers.of_stories(self.db, missing))
            self.tables.update(market.tables(self.db, missing))

    def story(self, story_id: int, threaded: Json) -> Json | None:
        card = self.found.get(story_id)
        if card is None:
            return None
        return _story(self, card, threaded)

    def strengths(self) -> dict[int, int]:
        return {story_id: found.signal for story_id, found in self.ai.items()}

    def cost(self, story_id: int) -> int:
        """The card's bytes, with room for the fields a delivered thread adds to it."""
        self.load([story_id])
        built = self.story(story_id, {})
        return 0 if built is None else group_view.encoded_size(built) + _THREAD_FIELDS


def _priority(held: dict[str, list[int]], focused: tuple[str, ...]) -> list[int]:
    """The order stories are paid in: the newest of Saved, For you and Latest; the focused views'
    whole lists; the newest of every other topic and issuer view; the rest of the three main views'
    SHOWN; the other views' SHOWN, one of each in turn; then the main views' older stories,
    likewise."""
    main = [held[key] for key in _MAIN]
    others = [ids for key, ids in held.items() if key not in _MAIN and key not in focused]
    order = [ids[0] for ids in main if ids]
    for key in focused:
        order += held[key]
    order += [ids[0] for ids in others if ids]
    order += [n for ids in main for n in ids[1:SHOWN]]
    order += [ids[i] for i in range(1, SHOWN) for ids in others if i < len(ids)]
    order += [ids[i] for i in range(SHOWN, SHOWN + OLDER) for ids in main if i < len(ids)]
    return order


def _blank_counts(channels: Json, feed: Json) -> None:
    """A count beside a view that the size bound left empty is not delivered (the reader never
    shows a count beside an empty list): a topic's, an issuer's, and the Saved badge."""
    for name in ("topics", "issuers"):
        views = feed.get(name, {})
        for channel in channels.get(name, []):
            if channel["count"] != "0" and not views[channel["id"]]["latest"]:
                channel["count"] = None
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
    asked: tuple[tuple[str, ...], int],
) -> tuple[list[Json], dict[str, Json]]:
    """Every story a view or a delivered thread names, newest first, and each view's ids: the
    three fixed views by name, one per topic by its id and (format 2) one per issuer by
    "issuer:<id>". A viewer with no name has no stories and empty views. `asked` is the focused
    views' keys and the bytes the rest of the snapshot takes. The stories share
    STORY_AND_GROUP_BUDGET with the group part, which spent its part first; with the rest they
    stay within SNAPSHOT_BUDGET."""
    read = held_cards.read
    db, user, now = read.db, read.user, read.now
    keys, rest = asked
    names = {"for-you": "foryou", "latest": "latest", "saved": "saved"}
    names.update({str(row["id"]): f"topic:{row['id']}" for row in listed})
    if read.fmt == 2:
        names.update({f"{_ISSUER}{one.id}": f"issuer:{one.id}" for one in issuers.every(db)})
    if user is None:
        return [], {key: _view([], ranked=key not in _UNRANKED) for key in names}
    focused = tuple(key for key in keys if key in names)
    depth = {key: SHOWN + OLDER if key in _MAIN or key in focused else SHOWN for key in names}
    held = {
        key: feedview.view_ids(db, user.name, view, depth[key], read.reading)
        for key, view in names.items()
    }
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
    held_cards.rank = rank
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


def _settings(read: _Read, listed: list[sqlite3.Row], sources: list[Json]) -> Json:
    recent = topics.counts_since(read.db, read.now - _WEEK, read.reading.condition)
    return {
        "topics": [_settings_topic(row, recent.get(row["id"], 0), read.fmt) for row in listed],
        "ai": ai_view.settings_ai(None, None, read.now),
        "groups": [],
        "rules": [],
        "notifications": {"events": []},
        "sources": sources,
        "sourceWeeksHeading": f"Items per week, {ingest.HEALTH_WEEKS} weeks",
    }


def _unranked(story_id: int) -> tuple[float, datetime]:
    raise AssertionError("a viewer with no name has no stories to rank")


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


def _settings_topic(row: sqlite3.Row, recent: int, fmt: int) -> Json:
    """A topic as Settings lists it. A topic of no kinds takes every feed kind, and filings (said
    in format 2 only, where filings are delivered); never market posts."""
    every = [*KINDS, FILING] if fmt == 2 else list(KINDS)
    kinds = set(json.loads(row["kinds"]) or every)
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


def _shown_sources(checked: Checked) -> list[int]:
    """Which sources Settings delivers, as positions in `checked` (the order they were added): at
    most MAX_SOURCES, the approved first (a failing one before the others, so the freshness line's
    failing source is always listed), then the proposed, then the paused, each by name."""

    def rank(i: int) -> tuple[int, bool, str, int]:
        row, health = checked[i]
        state = row["state"]
        failing = state == "approved" and health.state == "failing"
        return _LISTED_FIRST.index(state), not failing, row["name"].casefold(), i

    return sorted(sorted(range(len(checked)), key=rank)[:MAX_SOURCES])


def _sources(checked: Checked, now: datetime, *, named: bool) -> list[Json]:
    """Up to MAX_SOURCES sources (`_shown_sources`), in the order they were added; `sort.name`
    ranks the names A to Z among them. A viewer with no display name is not told who proposed a
    source (`named` False)."""
    shown = _shown_sources(checked)
    order = sorted(shown, key=lambda i: (checked[i][0]["name"].casefold(), i))
    rank = {index: place for place, index in enumerate(order, start=1)}
    return [_source(checked[i][0], checked[i][1], now, rank[i], named=named) for i in shown]


def _sources_more(total: int) -> str | None:
    """The sentence saying Settings lists fewer sources than the store holds, if it does."""
    if total <= MAX_SOURCES:
        return None
    return (
        f"Showing {MAX_SOURCES} of {total:,} sources: the approved ones first, then the proposed,"
        " then the paused."
    )
