"""Teams notifications for runs: four Adaptive Cards posted to one Teams webhook.

Off unless the launching environment sets both variables (``config_from_environment``):

``CREDIT_OS_TEAMS_WEBHOOK``
    The ``https://`` address of a Teams Workflows webhook. It lets anyone who holds it post to the
    channel, so it is read from the environment only and is never logged, stored or shown.
``CREDIT_OS_TEAMS_LINK``
    The address readers open this service at, for example ``http://10.0.0.5:8765``. Card buttons
    open its pages under that address: each service passes its own ``Pages`` (``LIBRARY_PAGES``
    for the run start service, ``CONNECTED_PAGES`` for the connected app).

What leaves the machine, to Microsoft: the issuer's name, the pathway, the analyst's name, times,
counts, the cap and, for a finished run, the report's lead bottom line exactly as its module
wrote it, with whatever figures that sentence holds. Documents and source references are not
sent. The launcher's child processes do not inherit the webhook (``runs.child_environment``).

Cards (docs/design/teams-cards): a run started, its report is ready, it stopped before
publishing, and a summary of the day's runs. The scheduler calls ``Notifier.tick`` once per poll,
outside its lock. Each run's last posted stage is kept in ``_engine/teams.json``, so a
restart posts nothing twice; the first poll with no such file records every run it finds without
posting, so switching the sender on never replays history (a summary due at that moment is not
posted either). A post that fails is retried each minute: a run's card for two hours after its
event, the summary until its window closes; then it is dropped with a log line. If the ledger
cannot be saved after a post, that card is posted again after a restart.

``tick`` never raises (documented fail-open: the cards are display, and the poll that starts and
files runs must go on): any failure is logged and the card is retried or dropped.

The summary is due at 09:00, 13:00, 17:00 and 21:00 UK time, Monday to Friday, and is posted
within ``_SLOT_MINUTES`` of the hour or not at all. It is skipped when no run is queued or
running and none has ended today since the last summary; a run that ends after 21:00 is in no
summary (its own card says so).
"""

from __future__ import annotations

import base64
import functools
import json
import logging
import os
import struct
import urllib.parse
import urllib.request
import zlib
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from functools import partial
from typing import Any

from deploy_vii import report_view
from deploy_vii.registry import plan
from deploy_workflow import platform_io
from deploy_workflow.inbox import activity
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox.runs import FORECAST_CODE, TEAMS_WEBHOOK_VARIABLE, Record, Status, cap_of
from deploy_workflow.inbox.startup import StartupRefused
from deploy_workflow.inbox.teams_brand import BAND, ICONS, LOCKUP, PILLS, SHAPES
from deploy_workflow.run_events import EVENTS, read_events

WEBHOOK_VARIABLE = TEAMS_WEBHOOK_VARIABLE
LINK_VARIABLE = "CREDIT_OS_TEAMS_LINK"
SLOTS = (9, 13, 17, 21)  # UK hours a summary is due, Monday to Friday
FINISHED_SHOWN = 5  # the summary lists this many finished runs, then counts the rest
# The other groups are cut too, and rows stop where the posted card would pass _CARD_BYTES:
# Teams refuses a card of about 25 KB, and a summary row is about 1.6 KB.
_ROWS_SHOWN: Mapping[str, int] = {"stopped": 5, "running": 5, "queued": 3}
_CARD_BYTES = 23_000

_SLOT_MINUTES = 30
_SATURDAY = 5  # datetime.weekday()
_INITIALS_AT_MOST = 2
_STALE = timedelta(hours=2)  # a run card not posted by then is dropped, with a log line
_RETRY_AFTER = timedelta(minutes=1)
_TIMEOUT = 10  # seconds: the post runs in the polling thread, between polls
_TIME = "%Y-%m-%dT%H:%M:%SZ"
_ENDED: tuple[Status, ...] = ("finished", "capped", "failed", "interrupted", "rejected")
_STOPPED = _ENDED[1:]
# Status -> the word its pill and shape say, after web/src/components/status/sets.ts ("Run states").
_STATES: Mapping[str, str] = {
    "queued": "Queued",
    "running": "Running",
    "finished": "Finished",
    "capped": "Capped",
    "failed": "Failed",
    "interrupted": "Interrupted",
    "rejected": "Rejected",
}
_WHY_STOPPED: Mapping[str, str] = {
    "capped": "Stopped at the cap before it finished.",
    "failed": "The run failed before it finished.",
    "interrupted": "The run was interrupted before it finished.",
    "rejected": "The run was not accepted.",
}
_NOT_PUBLISHED = "No report has been published."

Card = dict[str, Any]
Post = Callable[[str, Card], None]


@dataclass(frozen=True)
class Pages:
    """Where a service serves the pages a card opens, as paths under the address readers use;
    ``{id}`` stands for the run's ID."""

    library: str
    runs: str
    run: str
    report: str


CONNECTED_PAGES = Pages("/", "/runs", "/run/{id}", "/report/{id}")
_LIBRARY = "/library/index.html"
LIBRARY_PAGES = Pages(
    f"{_LIBRARY}#W-Library/cases",
    f"{_LIBRARY}#CP-OS/activity",
    f"{_LIBRARY}#CP-OS/activity",
    f"{_LIBRARY}#W-Report/history?c={{id}}",
)


@dataclass(frozen=True)
class Links:
    base: str
    pages: Pages

    def to(self, page: str, run_id: str = "") -> str:
        """The address of ``page`` (a ``Pages`` field), for the run when the page is a run's."""
        path: str = getattr(self.pages, page)
        return self.base + path.replace("{id}", urllib.parse.quote(run_id, safe=""))


@dataclass(frozen=True)
class Config:
    webhook: str = field(repr=False)  # a secret: kept out of every repr and log line
    links: Links


def config_from_environment(
    pages: Pages, environ: Mapping[str, str] | None = None
) -> Config | None:
    """The sender's settings, None when it is off; ``StartupRefused`` for half a configuration."""
    source = os.environ if environ is None else environ
    webhook = source.get(WEBHOOK_VARIABLE, "").strip()
    link = source.get(LINK_VARIABLE, "").strip().rstrip("/")
    if not webhook and not link:
        return None
    if not webhook or not link:
        raise StartupRefused(
            f"Teams cards need both {WEBHOOK_VARIABLE} and {LINK_VARIABLE}; set both or neither"
        )
    if not _address(webhook, ("https",)):
        raise StartupRefused(f"{WEBHOOK_VARIABLE} must be an https:// address")
    if not _address(link, ("http", "https")) or "?" in link or "#" in link:
        raise StartupRefused(
            f"{LINK_VARIABLE} must be an http:// or https:// address with no query or fragment"
        )
    return Config(webhook, Links(link, pages))


def _address(text: str, schemes: tuple[str, ...]) -> bool:
    try:
        url = urllib.parse.urlsplit(text)
        port_reads = url.port is None or url.port >= 0  # .port raises for a port that is no number
    except ValueError:
        return False
    plain = all(" " < c < "\x7f" for c in text)  # no space or control character, ASCII only
    return port_reads and plain and url.scheme in schemes and bool(url.hostname)


def post(webhook: str, card: Card) -> None:
    """POST the card as one Teams message. Raises when it is not accepted; a redirect is a
    refusal, because following one would re-send the card's content somewhere else, or send
    nothing and read as posted."""
    message = {
        "type": "message",
        "attachments": [
            {"contentType": "application/vnd.microsoft.card.adaptive", "content": card}
        ],
    }
    request = urllib.request.Request(  # https only: config_from_environment checked it
        webhook,
        data=json.dumps(message, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with _OPENER.open(request, timeout=_TIMEOUT) as reply:
        reply.read()


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args: Any, **kwargs: Any) -> None:
        return None  # urllib then raises HTTPError for the 3xx reply


_OPENER = urllib.request.build_opener(_NoRedirect)


# -- UK time ----------------------------------------------------------------------------------


def _last_sunday(year: int, month: int) -> datetime:
    last = datetime(year, month, 31, 1, tzinfo=UTC)  # March and October both have 31 days
    return last - timedelta(days=(last.weekday() + 1) % 7)


def uk_time(moment: datetime) -> datetime:
    """``moment`` as a naive UK wall-clock time: UTC, or an hour ahead from 01:00 UTC on the last
    Sunday of March to 01:00 UTC on the last Sunday of October. Computed here because the time
    zone database is not installed on every machine the service runs on."""
    utc = moment.astimezone(UTC)
    summer = _last_sunday(utc.year, 3) <= utc < _last_sunday(utc.year, 10)
    return (utc + timedelta(hours=1 if summer else 0)).replace(tzinfo=None)


def _uk_from_record(text: str) -> datetime | None:
    try:
        return uk_time(datetime.strptime(text, _TIME).replace(tzinfo=UTC))
    except ValueError:
        return None


def _clock(text: str) -> str:
    moment = _uk_from_record(text)
    return "" if moment is None else f"{moment:%H:%M}"


def due_slot(now: datetime) -> str:
    """The summary slot ``now`` falls in, as ``YYYY-MM-DDTHH`` in UK time, or ``""``."""
    uk = uk_time(now)
    if uk.weekday() >= _SATURDAY or uk.hour not in SLOTS or uk.minute >= _SLOT_MINUTES:
        return ""
    return f"{uk:%Y-%m-%dT%H}"


# -- card parts -------------------------------------------------------------------------------
#
# Teams draws a card's text, buttons and named colours itself. What the design needs beyond that
# is drawn as images: the header, each state's pill and shape and the meta icons are fixed
# (teams_brand); the tints, the bars and the stripe are made here, as small PNGs repeated behind
# a container or column. A tint is partly transparent, so Teams' own text stays readable on it in
# the light and the dark theme alike.

_BLUE, _DONE, _AMBER = (0, 26, 255), (29, 78, 216), (224, 168, 0)
_RED, _GREY = (165, 76, 72), (127, 132, 141)
_TONE: Mapping[str, tuple[int, int, int]] = {
    "queued": _GREY,
    "running": _BLUE,
    "finished": _DONE,
    "failed": _RED,
    "capped": _AMBER,
    "rejected": _GREY,
    "interrupted": _AMBER,
}
_TINT_ALPHA = {_BLUE: 18, _AMBER: 30, _RED: 22, _DONE: 22, _GREY: 22}  # out of 255
_TRACK = (*_GREY, 64)
_EDGE_PX, _EDGE_SPAN = 3, 1600  # a callout's left rule, and the widest a card is drawn
_STRIPE_PX = 160  # 1px high, stretched: about 3px high on a card 480px wide
_BAR_PX, _ROW_BAR_PX = 300, 64  # a bar's drawn width; 4px high when shown at that width


def _png(width: int, rows: Sequence[bytes]) -> str:
    """An RGBA PNG of the given pixel rows, as a data URI."""

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
        )

    header = struct.pack(">IIBBBBB", width, len(rows), 8, 6, 0, 0, 0)
    pixels = zlib.compress(b"".join(b"\0" + row for row in rows), 9)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", pixels)
    return "data:image/png;base64," + base64.b64encode(png + chunk(b"IEND", b"")).decode()


@functools.cache
def _fill(rgba: tuple[int, int, int, int]) -> str:
    return _png(1, [bytes(rgba)])


@functools.cache
def _edged(rgb: tuple[int, int, int]) -> str:
    """A tint with an opaque rule along its left edge, repeated down a callout."""
    tint = bytes((*rgb, _TINT_ALPHA[rgb]))
    return _png(_EDGE_SPAN, [bytes((*rgb, 255)) * _EDGE_PX + tint * (_EDGE_SPAN - _EDGE_PX)])


def _behind(url: str, mode: str = "Repeat") -> dict[str, str]:
    return {"url": url, "fillMode": mode, "horizontalAlignment": "Left"}


def _image(url: str, alt: str, height: str, **more: Any) -> Card:
    return {"type": "Image", "url": url, "altText": alt, "height": height, **more}


def _icon(name: str, alt: str) -> Card:
    return _image(ICONS[name], alt, "14px", width="14px")


def _shape(status: str) -> Card:
    return _image(SHAPES[status], _STATES[status], "10px", width="10px")


def _pill(status: str) -> Card:
    return _image(PILLS[status], _STATES[status], "22px", id="status")


def _text(text: str, **more: Any) -> Card:
    return {"type": "TextBlock", "text": text, "wrap": True, **more}


def _runs(*parts: tuple[str, dict[str, Any]], **more: Any) -> Card:
    """Text in runs of their own weight and colour. A TextRun is shown as written: Teams reads
    no Markdown there, so nothing needs escaping."""
    inlines = [{"type": "TextRun", "text": text, **style} for text, style in parts]
    return {"type": "RichTextBlock", "inlines": inlines, **more}


def _plain(text: str) -> str:
    """Text a TextBlock shows as written: Teams reads Markdown there, so the marks that would
    turn a name or a sentence into emphasis or a link are escaped."""
    return "".join(f"\\{c}" if c in "\\*_[]" else c for c in text)


def _column(items: list[Card], width: str = "auto", **more: Any) -> Card:
    return {
        "type": "Column",
        "width": width,
        "verticalContentAlignment": "Center",
        "items": items,
        **more,
    }


def _header(status: str) -> Card:
    """The navy band with the lockup, then a 3px stripe in the state's colour."""
    band = {
        "type": "Container",
        "bleed": True,
        "backgroundImage": {
            "url": BAND,
            "fillMode": "Cover",
            "horizontalAlignment": "Right",
            "verticalAlignment": "Center",
        },
        "items": [_image(LOCKUP, "Credit OS", "28px")],
    }
    # Stretched to the card's width, keeping its shape: about 3px high on a card 450px wide.
    rule = _stretched(_strip(_STRIPE_PX, 1, ((1, (*_TONE[status], 255)),)))
    stripe = {"type": "Container", "bleed": True, "spacing": "None", "items": [rule]}
    return {"type": "Container", "items": [band, stripe]}


def _bar(done: int, total: int, width: int) -> Card:
    """A progress bar drawn ``width`` pixels wide (twice over, for sharp screens) and 4px high,
    filled for the share of modules done. Shown stretched across its column."""
    share = min(max(done, 0), max(total, 1)) / max(total, 1)
    parts = ((share, (*_BLUE, 255)), (1 - share, _TRACK))
    return _stretched(_strip(2 * width, 8, parts), f"{done} of {total} modules done")


def _stretched(url: str, alt: str = "") -> Card:
    return {"type": "Image", "url": url, "altText": alt, "size": "Stretch", "spacing": "None"}


@functools.cache
def _strip(
    width: int, height: int, parts: tuple[tuple[float, tuple[int, int, int, int]], ...]
) -> str:
    """A ``width`` by ``height`` PNG of colour bands left to right, each its share of the width."""
    row = b""
    for share, rgba in parts:
        row += bytes(rgba) * round(share * width)
    row = (row + bytes(parts[-1][1]) * width)[: 4 * width]
    return _png(width, [row] * height)


def _title(name: str, sub: str, right: Card) -> Card:
    heading = _text(_plain(name), size="Large", weight="Bolder", style="heading")
    under = _text(_plain(sub), isSubtle=True, size="Small", spacing="None")
    return {
        "type": "ColumnSet",
        "columns": [_column([heading, under], "stretch"), _column([right])],
    }


def _meta(items: Sequence[tuple[str, str, str]]) -> list[Card]:
    """One line of icon and value pairs; no line at all when there is nothing to show."""
    columns: list[Card] = []
    for icon, alt, text in items:
        columns.append(_column([_icon(icon, alt)], spacing="Default" if columns else "None"))
        columns.append(_column([_text(_plain(text), size="Small", wrap=False)], spacing="Small"))
    return [{"type": "ColumnSet", "spacing": "Small", "columns": columns}] if columns else []


def _callout(text: str, tone: tuple[int, int, int]) -> Card:
    return {
        "type": "Container",
        "roundedCorners": True,
        "spacing": "Medium",
        "backgroundImage": _behind(_edged(tone), "RepeatVertically"),
        "items": [_text(_plain(text))],
    }


def _card(status: str, body: list[Card], primary: tuple[str, str], link: Links, speak: str) -> Card:
    return {
        "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.5",
        "speak": speak,
        "body": [_header(status), *body],
        "actions": [
            {"type": "Action.OpenUrl", "title": primary[0], "url": primary[1], "style": "positive"},
            {
                "type": "Action.OpenUrl",
                "title": "Library",
                "url": link.to("library"),
                "iconUrl": "icon:Library",
            },
        ],
    }


# -- what a card says of one run --------------------------------------------------------------


def _pathway(record: Record) -> str:
    titles = {item.id: item.title for item in report_view.pathways()}
    return titles.get(record.pathway) or record.pathway.replace("_", " ").capitalize()


def _issuer(record: Record) -> str:
    return record.issuer_name or record.issuer_id or "Unnamed issuer"


def _cap(record: Record) -> str:
    try:
        return f"USD {cap_of(record):.2f} cap"
    except (ValueError, TypeError):
        return ""  # a hand-edited record: the cap is left out, as Run activity shows none


def _who_when(record: Record, at: str) -> list[tuple[str, str, str]]:
    found = [("person", "Started by", record.submitted_by), ("clock", "Time", _clock(at))]
    return [(icon, alt, text) for icon, alt, text in found if text]


def progress(layout: Layout, record: Record) -> tuple[int, int]:
    """(modules done, modules in the run), the final Report entry not counted."""
    try:
        events = [e for e in read_events(layout.runs / record.id / EVENTS) if isinstance(e, dict)]
    except (OSError, ValueError):
        events = []  # fail-open, display only: no readable log reads as nothing done yet
    states = activity.module_states(record.pathway, events)[:-1]
    total = len(states)
    if record.modules:
        # The list's plan less the forecast code (no row), as cpos_launch.py plans it: producers
        # count, a repeat once. The launcher may append CP-8 (an earlier run is listed and its
        # call fits the cap); the record cannot say so, so a module the log shows started counts.
        try:
            planned = {name for name in plan(record.modules) if name != FORECAST_CODE}
        except (ValueError, TypeError):
            pass  # fail-open, display only: a list the plan refuses leaves the rows as the total
        else:
            total = len(planned | {name for name, state in states if state != "waiting"})
    return min(sum(state == "done" for _, state in states), total), total


def started_card(record: Record, link: Links, modules: int) -> Card:
    counts = [
        ("document", "Documents", f"{len(record.files)} docs"),
        ("layers", "Modules", f"{modules} modules"),
    ]
    cap = _cap(record)
    body = [
        _title(_issuer(record), _pathway(record), _pill("running")),
        *_meta(_who_when(record, record.started_at)),
        *_meta([*counts, *([("money", "Spending cap", cap)] if cap else [])]),
    ]
    speak = f"Credit OS. Run started for {_issuer(record)}."
    return _card("running", body, ("Watch run", link.to("run", record.id)), link, speak)


def finished_card(record: Record, link: Links, done: tuple[int, int], lead: str) -> Card:
    modules = ("layers", "Modules", f"{done[0]}/{done[1]} modules")
    meta = [*_who_when(record, record.ended_at), modules]
    body = [_title(_issuer(record), _pathway(record), _pill("finished")), *_meta(meta)]
    if lead:
        body.append(_callout(lead, _BLUE))
    speak = f"Credit OS. The report for {_issuer(record)} is ready."
    return _card("finished", body, ("Open report", link.to("report", record.id)), link, speak)


def stopped_card(record: Record, link: Links, done: tuple[int, int]) -> Card:
    cap = _cap(record)
    meta = [*_who_when(record, record.ended_at), *([("money", "Spending cap", cap)] if cap else [])]
    why = f"{_WHY_STOPPED[record.status]} {_NOT_PUBLISHED}"
    short = _text(f"{done[0]}/{done[1]} modules", size="Small", weight="Bolder", wrap=False)
    body = [
        _title(_issuer(record), _pathway(record), _pill(record.status)),
        *_meta(meta),
        _callout(why, _TONE[record.status]),
        {
            "type": "ColumnSet",
            "spacing": "Medium",
            "columns": [
                _column([_icon("layers", "Modules")]),
                _column([_bar(*done, _BAR_PX)], "stretch", spacing="Small"),
                _column([short], spacing="Small"),
            ],
        },
    ]
    speak = f"Credit OS. The run for {_issuer(record)} stopped. {why}"
    return _card(record.status, body, ("Run activity", link.to("runs")), link, speak)


# -- the summary ------------------------------------------------------------------------------


def short_name(name: str) -> str:
    """``Eric G`` as written; an earlier free-text name becomes its first word and an initial."""
    words = name.split()
    last = words[-1] if words else ""
    if len(words) < 2 or (last.isalpha() and last.isupper() and len(last) <= _INITIALS_AT_MOST):
        return name.strip()
    return f"{words[0]} {words[-1][0].upper()}"


def _count(status: str, number: int, label: str) -> Card:
    text = _runs((str(number), {"weight": "Bolder"}), (f" {label}", {"size": "Small"}))
    inner = [_column([_shape(status)]), _column([text], "stretch", spacing="Small")]
    tile: Card = {
        "type": "Container",
        "showBorder": True,
        "roundedCorners": True,
        "items": [{"type": "ColumnSet", "columns": inner}],
    }
    if status in _STOPPED and number:  # stopped runs need someone: the one tinted tile
        tile["backgroundImage"] = _behind(_fill((*_AMBER, _TINT_ALPHA[_AMBER])))
    return _column([tile], "stretch", spacing="Small")


def _row(record: Record, right: str, done: tuple[int, int] | None) -> Card:
    name = _runs(
        (_issuer(record), {"weight": "Bolder", "size": "Small"}),
        (f" {_pathway(record).split()[0]}", {"size": "Small", "isSubtle": True}),
    )
    emphasis = {"color": "Warning", "weight": "Bolder"} if record.status in _STOPPED else {}
    bar = [_bar(*done, _ROW_BAR_PX)] if done else []
    return {
        "type": "ColumnSet",
        "separator": True,
        "spacing": "Small",
        "columns": [
            _column([_shape(record.status)]),
            _column([name], "stretch", spacing="Small"),
            _column([_text(_plain(short_name(record.submitted_by)), size="Small", isSubtle=True)]),
            _column(bar, f"{_ROW_BAR_PX}px"),
            _column(
                [_text(right, size="Small", wrap=False, horizontalAlignment="Right", **emphasis)],
                "48px",
            ),
        ],
    }


@dataclass(frozen=True)
class Day:
    """The runs a summary shows: each with the text of its right-hand cell."""

    stopped: Sequence[tuple[Record, str]]
    running: Sequence[tuple[Record, str]]
    queued: Sequence[Record]
    finished: Sequence[tuple[Record, str]]  # newest first
    done: Mapping[str, tuple[int, int]] = field(default_factory=dict)  # run ID -> modules done


def summary_card(day: Day, now: datetime, link: Links) -> Card:
    """The day's runs, stopped first. Rows are added in that order while the posted card stays
    within ``_CARD_BYTES``; the rows left out are counted beneath."""
    uk = uk_time(now)
    queued = [(record, "Queued") for record in day.queued]
    groups = [
        ("stopped", day.stopped, _ROWS_SHOWN["stopped"]),
        ("running", day.running, _ROWS_SHOWN["running"]),
        ("queued", queued, _ROWS_SHOWN["queued"]),
        ("finished", day.finished, FINISHED_SHOWN),
    ]
    speak = (
        f"Credit OS run summary at {uk:%H:%M}. {len(day.stopped)} stopped, {len(day.running)} "
        f"running, {len(day.queued)} queued, {len(day.finished)} finished today."
    )
    rows: list[Card] = []
    shown = dict.fromkeys([word for word, _, _ in groups], 0)
    card = _summary(uk, day, rows, groups, shown, link, speak)
    for word, found, limit in groups:
        for record, right in found[:limit]:
            rows.append(_row(record, right, day.done.get(record.id)))
            shown[word] += 1
            trial = _summary(uk, day, rows, groups, shown, link, speak)
            if _posted_bytes(trial) > _CARD_BYTES:
                rows.pop()
                shown[word] -= 1
                return _summary(uk, day, rows, groups, shown, link, speak)
            card = trial
    return card


def _posted_bytes(card: Card) -> int:
    attachment = {"contentType": "application/vnd.microsoft.card.adaptive", "content": card}
    message = {"type": "message", "attachments": [attachment]}
    return len(json.dumps(message, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def _summary(  # noqa: PLR0913 - the parts summary_card has worked out
    uk: datetime,
    day: Day,
    rows: list[Card],
    groups: Sequence[tuple[str, Sequence[Any], int]],
    shown: Mapping[str, int],
    link: Links,
    speak: str,
) -> Card:
    clock = [
        _column([_icon("clock", "Time")]),
        _column([_text(f"{uk:%H:%M}", size="Small", wrap=False)], spacing="Small"),
    ]
    counts = [
        _count("capped", len(day.stopped), "Stopped"),
        _count("running", len(day.running), "Running"),
        _count("queued", len(day.queued), "Queued"),
        _count("finished", len(day.finished), "Finished"),
    ]
    more = [
        f"+{len(found) - shown[word]} more {word}"
        for word, found, _ in groups
        if len(found) > shown[word]
    ]
    body = [
        _title(
            "Runs today", f"{uk:%a} {uk.day} {uk:%b %Y}", {"type": "ColumnSet", "columns": clock}
        ),
        {"type": "ColumnSet", "spacing": "Medium", "columns": counts},
        {"type": "Container", "spacing": "Medium", "items": list(rows)},
    ]
    if more:
        body.append(_text(" \u00b7 ".join(more), size="Small", isSubtle=True, spacing="Small"))
    return _card("running", body, ("Run activity", link.to("runs")), link, speak)


# -- the sender -------------------------------------------------------------------------------


class Notifier:
    """Posts each run's cards once and the summary on its slots. Not thread-safe: one caller."""

    def __init__(
        self, layout: Layout, config: Config, logger: logging.Logger, send: Post | None = None
    ) -> None:
        self._layout, self._config, self._logger = layout, config, logger
        self._send = post if send is None else send
        self._path = layout.engine / "teams.json"
        self._ledger: dict[str, Any] | None = self._load()
        self._wait_until: datetime | None = None

    def _load(self) -> dict[str, Any] | None:
        try:
            held = json.loads(self._path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return None
        except (OSError, ValueError):
            # Fail closed against a replay: an unreadable ledger is rebuilt from the runs as they
            # stand, so nothing already ended is posted again.
            self._logger.exception("Teams ledger unreadable; starting from the runs as they are")
            return None
        runs = held.get("runs") if isinstance(held, dict) else None
        if not isinstance(runs, dict):
            return None
        summary, summary_at = held.get("summary"), held.get("summary_at")
        return {
            "runs": {str(k): str(v) for k, v in runs.items()},
            "summary": summary if isinstance(summary, str) else "",
            "summary_at": summary_at if isinstance(summary_at, str) else "",
        }

    def _save(self) -> None:
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            platform_io.write_atomic(self._path, json.dumps(self._ledger, sort_keys=True) + "\n")
        except OSError:
            # The copy in memory still stops a repeat in this process; see the module docstring.
            self._logger.exception("Teams ledger could not be saved")

    def settled(self, run_id: str) -> bool:
        """Whether the run's last card needs nothing more (it was posted or dropped)."""
        return self._ledger is not None and self._ledger["runs"].get(run_id) == "ended"

    def tick(self, records: Sequence[Record], now: datetime, leads: Mapping[str, str]) -> None:
        """Post what is due. Never raises (see the module docstring)."""
        try:
            self._tick(sorted(records, key=lambda r: str(r.id)), now, leads)
        except Exception:  # documented fail-open: the poll must go on
            self._logger.exception("Teams cards: this poll's pass failed")

    def _tick(self, records: Sequence[Record], now: datetime, leads: Mapping[str, str]) -> None:
        if self._ledger is None:  # first poll: record what is there, post none of it
            stages = {r.id: _stage(r) for r in records if _stage(r)}
            self._ledger = {"runs": stages, "summary": due_slot(now), "summary_at": ""}
            self._save()
            return
        self._summary(records, now)  # first: its window is short, a run's card has two hours
        posted: dict[str, str] = self._ledger["runs"]
        for record in records:
            stage = _stage(record)
            if not stage or posted.get(record.id) in ("ended", stage):
                continue
            key = f"{record.id}:{stage}"
            if self._stale(record, stage, now):
                self._logger.warning("Teams card %s dropped: not posted within two hours", key)
            elif not self._deliver(key, partial(self._run_card, record, leads), now):
                continue
            posted[record.id] = stage
            self._save()

    def _stale(self, record: Record, stage: str, now: datetime) -> bool:
        text = record.started_at if stage == "started" else record.ended_at
        try:
            at = datetime.strptime(text, _TIME).replace(tzinfo=UTC)
        except (ValueError, TypeError):
            return False  # no readable time (a hand-edited record): never dropped for its age
        return now.astimezone(UTC) - at > _STALE

    def _run_card(self, record: Record, leads: Mapping[str, str]) -> Card:
        link = self._config.links
        done = progress(self._layout, record)
        if record.status == "running":
            return started_card(record, link, done[1])
        if record.status == "finished":
            return finished_card(record, link, done, leads.get(record.id, ""))
        return stopped_card(record, link, done)

    def _deliver(self, key: str, build: Callable[[], Card], now: datetime) -> bool:
        """True once ``key`` needs no more attempts: it was posted, or its card cannot be built
        (a hand-edited record; it never will be). False while it waits for a retry."""
        if self._wait_until is not None and now < self._wait_until:
            return False
        try:
            card = build()
        except Exception:  # documented fail-open: one bad record, one lost card
            self._logger.exception("Teams card %s could not be built; dropped", key)
            return True
        try:
            self._send(self._config.webhook, card)
        except Exception as error:  # noqa: BLE001 - documented fail-open: retried next minute
            # No traceback and, unless it is an OSError, no text: an error raised while the
            # address is parsed quotes parts of the webhook.
            text = _without(str(error), self._config.webhook) if isinstance(error, OSError) else ""
            self._wait_until = now + _RETRY_AFTER
            self._logger.warning(
                "Teams card %s not posted (%s%s); retrying",
                key,
                type(error).__name__,
                f": {text}" if text else "",
            )
            return False
        self._wait_until = None
        return True

    def _summary(self, records: Sequence[Record], now: datetime) -> None:
        assert self._ledger is not None
        slot = due_slot(now)
        if not slot or self._ledger["summary"] == slot:
            return
        day = self._day(records, now)
        since = self._ledger["summary_at"]
        fresh = any(r.ended_at > since for r, _ in (*day.stopped, *day.finished))
        quiet = not (day.running or day.queued or fresh)
        link = self._config.links
        if quiet or self._deliver(f"summary:{slot}", lambda: summary_card(day, now, link), now):
            self._ledger["summary"] = slot
            self._ledger["summary_at"] = now.astimezone(UTC).strftime(_TIME)
            self._save()

    def _day(self, records: Sequence[Record], now: datetime) -> Day:
        today = uk_time(now).date()

        def ended(statuses: Sequence[str]) -> list[tuple[Record, str]]:
            found = [
                (record, at)
                for record in records
                if record.status in statuses
                and isinstance(record.ended_at, str)
                and (at := _uk_from_record(record.ended_at)) is not None
                and at.date() == today
            ]
            found.sort(key=lambda pair: (pair[0].ended_at, str(pair[0].id)), reverse=True)
            return [(record, f"{at:%H:%M}") for record, at in found]

        stopped = ended(_STOPPED)
        running = [r for r in records if r.status == "running"]
        done = {r.id: progress(self._layout, r) for r in (*running, *(r for r, _ in stopped))}
        return Day(
            stopped=stopped,
            running=[(r, "{}/{}".format(*done[r.id])) for r in running],
            queued=[r for r in records if r.status == "queued"],
            finished=ended(("finished",)),
            done=done,
        )


def _stage(record: Record) -> str:
    if record.status == "running":
        return "started"
    return "ended" if record.status in _ENDED else ""


def _without(text: str, secret: str) -> str:
    return text.replace(secret, "<webhook>")
