"""The AI parts of the snapshot: a story's AI fields and the "AI and cost" section of Settings.

Only while the pass is on (``settings.ai.state`` "on") does a story carry what the pass wrote for
it: ``ai`` (the AI line, and which fields the pass wrote: ``kind`` true when the story's kind is the
pass's, ``tags`` the tags it wrote; the page marks each AI), ``strength`` (marks and a word), its
kind from the pass (``kind``/``kindLabel``; "other" keeps the source's kind), its tags (the pass's
first, then the names of the topics it is in, a name not repeated, at most ``MAX_STORY_TAGS``; with
the pass off a story carries at most that many topic names), the case stage (``stage``, only when
the model returned one) and the rating moves (``ratingMoves``, only when it returned them, each with
a word written here, never by the model). Off or at the cap, no story carries any of it, as the
reader requires: the feed is as it was before the pass existed. Every field is plain text from a
fixed list or a checked sentence, delivered as data; nothing the model wrote becomes a link or
markup, and nothing of it is put where a colleague's words go.

Settings: the notice says why AI is off (to a writer or the owner each missing precondition in a
plain sentence, never a key or a variable name; to anyone else the title and one fixed sentence)
or that it is at its cap; the spend line (writers and the owner, once a cap is set) shows the
month's spend in USD against the cap, with the reservations in progress and the count of stories
whose output failed its check; the three parts are shown as switches the page cannot change.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import ROUND_CEILING, Decimal, localcontext
from typing import Any

from pydantic import ValidationError

from deploy_workflow.signal import ai_gate, ai_labels
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.texts import plural

Json = dict[str, Any]

STRENGTH_WORDS = {1: "Light", 2: "Moderate", 3: "Strong"}
MAX_STORY_TAGS = 6  # tags delivered per story: the pass's first, then topic names
_KIND = {  # the pass's kind: (the reader's kind, its label)
    "news": ("news", "News"),
    "regulatory case": ("regulator", "Regulatory case"),
    "rating action": ("ratings", "Rating action"),
}
_MONTHS = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)  # fmt: skip
STOPPED = (
    "Stories arrive with no AI line and no signal strength, and digests are paused."
    " Nothing more is spent while it is off."
)
NOT_SET_UP = "The AI pass is not set up on this Signal service."
DAY_FULL = (
    "Digests have made today's {count} model calls, the most a day allows; the others are"
    " written after 00:00 UTC."
)
_CENT = Decimal("0.01")
SHOWN_UP_TO = Decimal(10) ** 12  # USD amounts from here up are shown as "more than ..."


@dataclass(frozen=True)
class StoryAi:
    """What the pass wrote for one story."""

    why: str
    signal: int
    tags: tuple[str, ...]
    kind: str
    stage: str | None
    moves: tuple[ai_labels.Move, ...]


def load(db: sqlite3.Connection, ids: Sequence[int]) -> dict[int, StoryAi]:
    """The written answers of these stories (read in the caller's transaction)."""
    found: dict[int, StoryAi] = {}
    unique = sorted(set(ids))
    for start in range(0, len(unique), 500):
        part = unique[start : start + 500]
        rows = db.execute(
            "SELECT * FROM story_ai WHERE outcome='written' AND story_id IN"
            f" ({', '.join('?' * len(part))})",
            part,
        ).fetchall()
        for row in rows:
            try:
                moves = tuple(ai_labels.Move.model_validate(m) for m in json.loads(row["moves"]))
            except ValidationError:  # a move a later scale no longer reads: the row is not shown
                continue
            found[int(row["story_id"])] = StoryAi(
                row["why"],
                row["signal"],
                tuple(json.loads(row["tags"])),
                row["kind"],
                row["stage"],
                moves,
            )
    return found


def _stage(stage: str) -> Json:
    index = ai_labels.STAGES.index(stage)
    names = ai_labels.STAGE_NAMES
    return {
        "current": names[index],
        "label": f"Stage {index + 1} of {len(names)}",
        "position": (index + 1) / len(names),
        "stages": [{"name": name, "current": n == index} for n, name in enumerate(names)],
    }


def story_fields(found: StoryAi, kind: str, label: str, tags: Sequence[str]) -> Json:
    """The AI fields of a story card; `kind`, `label` and `tags` are what it has without them."""
    kind, label = _KIND.get(found.kind, (kind, label))
    held = {tag.casefold() for tag in found.tags}
    named = [*found.tags, *(tag for tag in tags if tag.casefold() not in held)]
    moves = sorted(found.moves, key=lambda move: move.outlook)  # the rating before the outlook
    return {
        "kind": kind,
        "kindLabel": label,
        "tags": named[:MAX_STORY_TAGS],
        # what the pass wrote, so the page can mark each such field AI: the line, whether the
        # kind is the pass's, and which of the tags are (strength, stage and rating moves are only
        # ever delivered from the pass)
        "ai": {"line": found.why, "kind": found.kind in _KIND, "tags": list(found.tags)},
        "strength": {"marks": found.signal, "word": STRENGTH_WORDS[found.signal]},
        "stage": _stage(found.stage) if found.stage is not None else None,
        "ratingMoves": [
            {"from": m.start, "to": m.end, "word": ai_labels.move_word(m)} for m in moves
        ],
    }


# Settings


def usd(amount: Decimal, *, up: bool = False) -> str:
    """ "USD 6.40": to the cent; `up` rounds up, so a spend is never shown below what it is. Any
    finite amount the ledger can hold is shown without raising: one of ``SHOWN_UP_TO`` or more
    (a reported cost no real call has, such as USD 1E+27) is "more than USD 999999999999.99"."""
    if amount >= SHOWN_UP_TO:
        return f"more than USD {SHOWN_UP_TO - _CENT}"
    with localcontext() as exact:
        exact.prec = 28  # room for every amount below SHOWN_UP_TO to the cent
        shown = amount.quantize(_CENT, rounding=ROUND_CEILING) if up else amount.quantize(_CENT)
    return f"USD {shown}"


def _next_month(now: datetime) -> str:
    at = now.astimezone(UTC)
    return _MONTHS[at.month % 12]


def _notice(status: ai_gate.Status | None, now: datetime, managing: bool) -> Json | None:
    """Why AI is not on. A writer or the owner is told each reason; anyone else (a reader, a
    viewer with no name) the title and one fixed sentence: no cap, ruling or file name."""
    if status is None:
        return {"title": "AI is off", "text": f"{NOT_SET_UP} {STOPPED}"}
    if status.state == "on":
        return None
    if status.state == "capped":
        month = _MONTHS[now.astimezone(UTC).month - 1]
        return {
            "title": f"AI has reached its cap for {month}",
            "text": "Stories arrive with no AI line and no signal strength, and digests are"
            f" paused until 1 {_next_month(now)}. Only the owner can raise the cap.",
        }
    if not managing:
        return {"title": "AI is off", "text": STOPPED}
    return {"title": "AI is off", "text": " ".join([*status.gate.reasons, STOPPED])}


def _note(status: ai_gate.Status, now: datetime) -> str | None:
    lines = []
    if status.state == "on":
        lines.append(f"The cap resets on 1 {_next_month(now)}.")
    cap, config = status.gate.cap, status.gate.config_id
    if (
        status.state == "capped"
        and cap is not None
        and config is not None
        and status.month.spent < cap
    ):
        hold = usd(ai_gate.smallest_hold(config), up=True)
        lines.append(f"Each call holds up to {hold} until it is settled, and that no longer fits.")
    if status.month.held:
        lines.append(f"{usd(status.month.held, up=True)} more is held for calls in progress.")
    if status.state == "on" and status.day_full:
        lines.append(DAY_FULL.format(count=status.digests_per_day))
    if status.invalid:
        many = plural(status.invalid, "story", "stories")
        lines.append(f"{many} this month had AI output that failed its check and show no AI line.")
    return " ".join(lines) or None


def _spend(status: ai_gate.Status, now: datetime) -> Json | None:
    cap = status.gate.cap
    if cap is None:
        return None
    spent = status.month.spent
    month = _MONTHS[now.astimezone(UTC).month - 1]
    return {
        "title": f"Spend in {month}",
        "label": f"{usd(spent, up=True)} of {usd(cap)}",
        "note": _note(status, now),
        "position": round(float(min(spent / cap, Decimal(1))), 2),
    }


def _parts(state: str) -> list[Json]:
    on = state != "off"
    digest_hint = "Scheduled briefs." + (
        " A digest with nothing to report makes no call." if state == "on" else ""
    )
    return [
        {
            "id": "ai-line",
            "label": "AI line on stories",
            "hint": "One line on why a story matters, marked AI.",
            "on": on,
        },
        {
            "id": "strength",
            "label": "Signal strength",
            "hint": "Three marks and a word on each story.",
            "on": on,
        },
        {"id": "digests", "label": "Digests", "hint": digest_hint, "on": on},
    ]


def settings_ai(status: ai_gate.Status | None, user: User | None, now: datetime) -> Json:
    """``settings.ai`` for this viewer; `status` None: the service was given no AI status."""
    state = "off" if status is None else status.state
    managing = user is not None and user.role in ("writer", "owner")
    shown = status is not None and managing
    return {
        "state": state,
        "notice": _notice(status, now, managing),
        "spend": _spend(status, now) if status is not None and shown else None,
        "parts": _parts(state) if shown else [],
    }
