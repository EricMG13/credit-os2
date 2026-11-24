"""What the AI pass accepts from a model for one story, and how a reply is read (spec 5.5).

Every field is checked with pydantic, strictly (no coercion, no field the schema does not name):

* ``why``: one sentence of plain text, at most 240 characters, with no link in it;
* ``signal``: the whole number 1, 2 or 3;
* ``tags``: at most ``ai_tags.MAX_TAGS`` distinct tags, each spelled as ``ai_tags.TAGS`` lists it;
* ``kind``: news, regulatory case, rating action or other;
* ``stage`` (a regulatory case only): opened, initial review, in-depth review or decision;
* ``moves`` (a rating action only): at most one rating move, both ends on one agency scale, and at
  most one outlook move, both ends outlooks.

A reply is one JSON object ``{"stories": [...]}``. An entry belongs to the story whose id it names,
and only the ids this service put in the prompt count: an entry naming another id is ignored, and
two entries naming one id make that story invalid (neither is taken), so one story's text can at
worst mislabel that story itself. A story with no valid entry is invalid.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections.abc import Sequence
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

from deploy_workflow.signal.ai_tags import MAX_TAGS, TAGS

MAX_WHY = 240
KINDS = ("news", "regulatory case", "rating action", "other")
STAGES = ("opened", "initial review", "in-depth review", "decision")
STAGE_NAMES = ("Opened", "Initial review", "In-depth review", "Decision")
SCALES: tuple[tuple[str, ...], ...] = (
    (
        "AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-",
        "B+", "B", "B-", "CCC+", "CCC", "CCC-", "CC", "C", "RD", "SD", "D",
    ),
    (
        "Aaa", "Aa1", "Aa2", "Aa3", "A1", "A2", "A3", "Baa1", "Baa2", "Baa3", "Ba1", "Ba2", "Ba3",
        "B1", "B2", "B3", "Caa1", "Caa2", "Caa3", "Ca", "C",
    ),
)  # fmt: skip
OUTLOOKS = ("Positive", "Stable", "Negative", "Developing")
_NUMBERS = ("one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten")
_LINK = re.compile(r"(?i)https?:|www\.|://|\b[a-z0-9-]+\.(?:com|org|net|io|co|uk|eu|de|fr)\b")
_SECOND_SENTENCE = re.compile(r"[.!?]\s+\S")


def plain(text: str) -> bool:
    """Text a page can show as it is: no control, format, surrogate or unassigned character."""
    return not any(unicodedata.category(ch)[0] == "C" for ch in text)


def has_link(text: str) -> bool:
    return _LINK.search(text) is not None


def _scale(move: Move) -> tuple[str, ...] | None:
    for scale in SCALES:
        if move.start in scale and move.end in scale:
            return scale
    return None


def move_word(move: Move) -> str:
    """The delivered word of a move: "Downgrade, one notch", "Upgrade, two notches", "Affirmed",
    "Outlook" (changed) or "Outlook affirmed"."""
    if move.start in OUTLOOKS:
        return "Outlook" if move.start != move.end else "Outlook affirmed"
    scale = _scale(move)
    assert scale is not None  # validated
    steps = scale.index(move.end) - scale.index(move.start)
    if steps == 0:
        return "Affirmed"
    count = abs(steps)
    words = _NUMBERS[count - 1] if count <= len(_NUMBERS) else str(count)
    notches = "notch" if count == 1 else "notches"
    return f"{'Downgrade' if steps > 0 else 'Upgrade'}, {words} {notches}"


class Move(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True, populate_by_name=True)

    start: str = Field(alias="from")
    end: str = Field(alias="to")

    @model_validator(mode="after")
    def _one_scale(self) -> Move:
        outlook = self.start in OUTLOOKS and self.end in OUTLOOKS
        if not outlook and _scale(self) is None:
            raise ValueError("a move is two ratings on one agency scale, or two outlooks")
        return self

    @property
    def outlook(self) -> bool:
        return self.start in OUTLOOKS


class Label(BaseModel):
    """One story's validated output."""

    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)

    id: str
    why: Annotated[str, Field(min_length=1, max_length=MAX_WHY)]
    signal: Annotated[int, Field(ge=1, le=3)]
    tags: Annotated[list[str], Field(max_length=MAX_TAGS)]
    kind: Literal["news", "regulatory case", "rating action", "other"]
    stage: Literal["opened", "initial review", "in-depth review", "decision"] | None = None
    moves: Annotated[list[Move], Field(max_length=2)] = []

    @field_validator("why")
    @classmethod
    def _sentence(cls, value: str) -> str:
        if value != value.strip() or not plain(value):
            raise ValueError("why is plain text with no surrounding space")
        if has_link(value):
            raise ValueError("why holds no link")
        if _SECOND_SENTENCE.search(value):
            raise ValueError("why is one sentence")
        return value

    @field_validator("tags")
    @classmethod
    def _listed(cls, value: list[str]) -> list[str]:
        if any(tag not in TAGS for tag in value) or len(set(value)) != len(value):
            raise ValueError("tags are distinct tags from the fixed list")
        return value

    @model_validator(mode="after")
    def _fits_kind(self) -> Label:
        if self.stage is not None and self.kind != "regulatory case":
            raise ValueError("a stage belongs to a regulatory case")
        if self.moves and self.kind != "rating action":
            raise ValueError("moves belong to a rating action")
        if sum(m.outlook for m in self.moves) > 1 or sum(not m.outlook for m in self.moves) > 1:
            raise ValueError("at most one rating move and one outlook move")
        return self


def _unique_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    found: dict[str, Any] = {}
    for key, value in pairs:
        if key in found:
            raise ValueError(f"duplicate key {key!r}")
        found[key] = value
    return found


def _refuse_constant(name: str) -> object:
    raise ValueError(f"{name} is not JSON")


_FENCE = re.compile(r"\A```(?:json)?\s*\n(.*)\n```\Z", re.DOTALL)


def load_object(text: str) -> dict[str, Any] | None:
    """The reply's one JSON object (a single fenced block around it is allowed), or None when the
    reply is not one: not JSON, nested too deeply, a repeated key, NaN or Infinity."""
    body = text.strip()
    fenced = _FENCE.match(body)
    if fenced is not None:
        body = fenced.group(1).strip()
    try:
        value = json.loads(body, object_pairs_hook=_unique_keys, parse_constant=_refuse_constant)
    except (ValueError, RecursionError):
        return None
    return value if isinstance(value, dict) else None


def read_labels(text: str, ids: Sequence[int]) -> dict[int, Label | None] | None:
    """Each asked story's label (None: invalid), or None when the whole reply cannot be read."""
    body = load_object(text)
    if body is None or set(body) != {"stories"} or not isinstance(body["stories"], list):
        return None
    wanted = {str(n): n for n in ids}
    entries: dict[int, list[Any]] = {n: [] for n in ids}
    for entry in body["stories"]:
        named = entry.get("id") if isinstance(entry, dict) else None
        if isinstance(named, str) and named in wanted:
            entries[wanted[named]].append(entry)
    labels: dict[int, Label | None] = {}
    for story_id, found in entries.items():
        labels[story_id] = _one(found)
    return labels


def _one(found: list[Any]) -> Label | None:
    if len(found) != 1:
        return None
    try:
        return Label.model_validate(found[0])
    except ValidationError:
        return None
