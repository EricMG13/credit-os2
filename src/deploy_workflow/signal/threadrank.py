"""The "Top" order of a feed view (spec 5.6): signal strength, decayed by age, raised by shares
and comments in the viewer's groups. Deterministic and free of any AI call.

    score = (strength + SHARE_WEIGHT * shares + COMMENT_WEIGHT * comments)
            * 0.5 ** (age / HALF_LIFE)

`strength` is the AI pass's 1, 2 or 3. That pass is not built, so every story's strength is absent
today and counts as NO_STRENGTH; the order is then age decay raised by shares and comments. Age
is measured from the published time to `now` (a time ahead of `now` counts as age 0). Ties keep
the Latest order: newer published time first, then the higher id.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta

HALF_LIFE = timedelta(hours=24)
SHARE_WEIGHT = 1.0
COMMENT_WEIGHT = 0.25
NO_STRENGTH = 1.0


@dataclass(frozen=True)
class Standing:
    """What the order reads about one story for one viewer."""

    story_id: int
    published_at: datetime
    shares: int = 0  # threads it has in the viewer's groups
    comments: int = 0  # comments in those threads, removed ones left out
    strength: int | None = None  # the AI pass's signal strength; None while there is none


def score(item: Standing, now: datetime) -> float:
    """The logarithm of the score above (same order; no underflow for a years-old story)."""
    base = NO_STRENGTH if item.strength is None else float(item.strength)
    raised = base + SHARE_WEIGHT * item.shares + COMMENT_WEIGHT * item.comments
    age = max(now - item.published_at, timedelta(0))
    return math.log(raised) - (age / HALF_LIFE) * math.log(2)


def top_order(items: Sequence[Standing], now: datetime) -> list[int]:
    """The story ids, highest score first; equal scores in the Latest order."""
    ranked = sorted(
        items,
        key=lambda item: (score(item, now), item.published_at, item.story_id),
        reverse=True,
    )
    return [item.story_id for item in ranked]
