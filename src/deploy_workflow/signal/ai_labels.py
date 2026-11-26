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
two entries naming one id make that story invalid (neither is taken). A story with no valid entry
is invalid. That does not keep one story's text from deciding another's fields: a model that obeys
an instruction injected into one story can mislabel the other stories of the same batch. What
bounds the harm is that every field is validated as above (a fixed list, a whole number, or one
checked sentence with nothing that looks like a link or a scheme), and the page renders each as
plain text marked AI: nothing a model writes becomes a link or markup.
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
_LETTER_GRADES = (
    "AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-",
    "B+", "B", "B-", "CCC+", "CCC", "CCC-", "CC", "C",
)  # fmt: skip
SCALES: tuple[tuple[str, ...], ...] = (
    (*_LETTER_GRADES, "SD", "D"),  # S&P: selective default, then default
    (*_LETTER_GRADES, "RD", "D"),  # Fitch: restricted default, then default
    (
        "Aaa", "Aa1", "Aa2", "Aa3", "A1", "A2", "A3", "Baa1", "Baa2", "Baa3", "Ba1", "Ba2", "Ba3",
        "B1", "B2", "B3", "Caa1", "Caa2", "Caa3", "Ca", "C",
    ),
)  # fmt: skip
OUTLOOKS = ("Positive", "Stable", "Negative", "Developing")
_NUMBERS = ("one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten")
_LINK = re.compile(
    r"(?i)https?:|www\.|://|//\S"  # a scheme, a web host, a protocol-relative address
    r"|\b[a-z][a-z0-9+.-]*:(?=[^\s\d])"  # any scheme-like word: javascript:, mailto:, data:
    r"|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/"  # any label.tld/ (bit.ly/x, evil.ru/login)
    r"|\b[a-z0-9-]+\.[a-z0-9-]+\.[a-z]{2,}\b"  # a host of three labels (evil.example.info)
    # a lower-case bare host on a common top-level domain; a capitalised name (Cars.com) is not one
    r"|\b(?-i:[a-z])[a-z0-9-]*\.(?:com|org|net|io|co|uk|eu|de|fr|me|ly|ru|info|biz|xyz|app|dev)\b"
)
_SECOND_SENTENCE = re.compile(r"[.!?](?=\s+\S)")
_DOTTED_INITIALISM = re.compile(r"(?:[^\W\d_]\.){2,}")
# The word before a stop: the trailing run of letters and dots, not joined to a word character, a
# dot, "&" ("S&P.", "AT&T.") or a possessive ("Moody's."); a quote, dash or bracket before it is
# not part of it.
_TOKEN = re.compile(r"(?<![\w.&])(?<![^\W\d_]['\u2019])(?:[^\W\d_]+\.)+\Z")
# Company forms are matched without case (all-capital names: "ACME INC."); the rest exact case.
_COMPANY_FORMS = frozenset(
    a.casefold()
    for a in (
        "Inc",
        "Co",
        "Corp",
        "Ltd",
        "Plc",
        "Bros",
        "Cos",
        "Pty",
        "Pte",
        "Sdn",
        "Bhd",
        "Intl",
        "Hldgs",
    )
)
_ABBREVIATIONS = frozenset(
    {
        "No",
        "vs",
        "St",
        "Mr",
        "Ms",
        "Dr",
        "Jr",
        "Sr",
        "Gov",
        "Sen",
        "Rep",
        "Gen",
        "Sec",
        "Lt",
        "Col",
        "Sgt",
        "Prof",
        "Mt",
        "Ft",
        "Mrs",
        "v",
    }
)


def has_second_sentence(text: str) -> bool:
    """Whether a sentence end (``.``, ``!`` or ``?`` then space then a capital letter; a digit
    does not start one: "Dec. 15") is not
    just an abbreviation: a dotted initialism (U.S., A.Ş.), a single letter (J.), a company form
    in any case (Inc, Co, ACME INC.) or a listed title in its exact case (Sen., Gov., No.)."""
    for end in _SECOND_SENTENCE.finditer(text):
        if not text[end.end() :].lstrip()[0].isupper():
            continue  # a digit or lower-case letter never starts a sentence
        token = _TOKEN.search(text, 0, end.end())
        word = token.group() if token else ""
        if text[end.start()] == "." and (
            _DOTTED_INITIALISM.fullmatch(word)
            or len(word) == 2
            or word[:-1] in _ABBREVIATIONS
            or word[:-1].casefold() in _COMPANY_FORMS
        ):
            continue
        return True
    return False


def plain(text: str) -> bool:
    """Text a page can show as it is: no control, format, surrogate or unassigned character, and
    no line or paragraph separator (U+2028, U+2029)."""
    return not any(unicodedata.category(ch)[0] == "C" or ch in "\u2028\u2029" for ch in text)


def has_link(text: str) -> bool:
    """Whether `text` holds anything shaped like a link: a scheme or scheme-like word, a
    protocol-relative address, ``www.``, a ``label.tld/`` path, a host of three labels, or a
    lower-case bare host on a common top-level domain (a capitalised name such as Cars.com is not
    one)."""
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
        if has_second_sentence(value):
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
