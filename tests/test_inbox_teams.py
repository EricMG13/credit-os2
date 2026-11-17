"""Teams cards: settings from the environment, UK slots, the four cards and the sender's ledger.

No network: every post goes to a list. The scheduler test runs the fake launcher (no provider).
Expected texts are written out here, not computed with the module under test.
"""

from __future__ import annotations

import base64
import json
import logging
import tempfile
import threading
import zlib
from collections.abc import Iterator
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from typing import Any, ClassVar

import pytest
from inbox_fixtures import layout as layout_of
from inbox_fixtures import pump, settings, status, submit_run

from deploy_vii.contracts import PATHWAY_MODULES
from deploy_workflow.inbox import runs as runs_module
from deploy_workflow.inbox import scheduler as scheduler_module
from deploy_workflow.inbox import teams
from deploy_workflow.inbox.layout import Layout, ensure_layout
from deploy_workflow.inbox.runs import Record
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.inbox.startup import StartupRefused
from deploy_workflow.run_events import append_event

pytest_plugins = ["inbox_fixtures"]

HOOK = "https://example.invalid/workflows/secret-token"
BASE = "http://127.0.0.1:8765"
LINK = teams.Links(BASE, teams.CONNECTED_PAGES)
CONFIG = teams.Config(HOOK, LINK)
LOG = logging.getLogger("test.teams")
MONDAY_1300 = datetime(2026, 11, 16, 13, 0, tzinfo=UTC)  # a Monday; UK is on UTC in November


@pytest.fixture
def lay() -> Iterator[Layout]:
    with tempfile.TemporaryDirectory(prefix="tm", dir="/tmp") as root:
        yield ensure_layout(Path(root))


def record(run_id: str = "20261116-134500-01", **change: Any) -> Record:
    base = Record(
        id=run_id,
        pathway="credit_snapshot",
        folder="Northbridge Holdings",
        status="running",
        claimed_at="2026-11-16T13:44:00Z",
        issuer_id="northbridge",
        issuer_name="Northbridge Holdings",
        files=("a.pdf", "b.pdf", "c.pdf", "d.xlsx"),
        started_at="2026-11-16T13:45:00Z",
        submission="0" * 32,
        submitted_by="Priya R",
        cap="25",
    )
    return replace(base, **change)


def texts(part: Any) -> list[str]:
    """Every text a card shows, in order: TextBlocks, RichTextBlocks (their runs joined) and the
    status pill, an image whose alternative text is its word."""
    if isinstance(part, list):
        return [t for item in part for t in texts(item)]
    if not isinstance(part, dict):
        return []
    if part.get("type") == "RichTextBlock":
        return ["".join(run["text"] for run in part["inlines"])]
    own = [part["text"]] if part.get("type") == "TextBlock" else []
    if part.get("type") == "Image" and part.get("id") == "status":
        own = [part["altText"]]
    return own + [t for value in part.values() for t in texts(value)]


def pixel_row(url: str) -> tuple[int, bytes]:
    """The width and first pixel row of an RGBA PNG data URI with no row filter, read here
    without the module's own encoder."""
    data = base64.b64decode(url.removeprefix("data:image/png;base64,"))
    width = int.from_bytes(data[16:20], "big")
    at, chunks = 8, b""
    while at < len(data):
        size, kind = int.from_bytes(data[at : at + 4], "big"), data[at + 4 : at + 8]
        if kind == b"IDAT":
            chunks += data[at + 8 : at + 8 + size]
        at += 12 + size
    raw = zlib.decompress(chunks)
    assert raw[0] == 0  # filter type none
    return width, raw[1 : 1 + 4 * width]


def first_pixel(url: str) -> tuple[int, ...]:
    return tuple(pixel_row(url)[1][:4])


def posted_bytes(card: dict[str, Any]) -> int:
    message = {
        "type": "message",
        "attachments": [
            {"contentType": "application/vnd.microsoft.card.adaptive", "content": card}
        ],
    }
    return len(json.dumps(message, ensure_ascii=False, separators=(",", ":")).encode())


def actions(card: dict[str, Any]) -> list[tuple[str, str]]:
    return [(a["title"], a["url"]) for a in card["actions"]]


class Sent:
    def __init__(self, fail: int = 0) -> None:
        self.cards: list[dict[str, Any]] = []
        self.fail = fail

    def __call__(self, webhook: str, card: dict[str, Any]) -> None:
        assert webhook == HOOK
        if self.fail:
            self.fail -= 1
            raise OSError(f"could not reach {webhook}")
        self.cards.append(card)

    @property
    def badges(self) -> list[str]:
        return [texts(card["body"][1])[2] for card in self.cards]


def notifier(lay: Layout, sent: Sent) -> teams.Notifier:
    return teams.Notifier(lay, CONFIG, LOG, sent)


# -- settings ---------------------------------------------------------------------------------


def test_the_sender_is_off_without_its_variables():
    assert teams.config_from_environment(teams.CONNECTED_PAGES, {}) is None
    assert (
        teams.config_from_environment(
            teams.CONNECTED_PAGES, {teams.WEBHOOK_VARIABLE: " ", teams.LINK_VARIABLE: ""}
        )
        is None
    )


def test_both_variables_make_the_settings_and_the_webhook_stays_out_of_the_repr():
    got = teams.config_from_environment(
        teams.CONNECTED_PAGES,
        {teams.WEBHOOK_VARIABLE: f" {HOOK} ", teams.LINK_VARIABLE: f"{BASE}/"},
    )
    assert got == CONFIG
    assert "secret-token" not in repr(got)


@pytest.mark.parametrize(
    "environ",
    [
        {teams.WEBHOOK_VARIABLE: HOOK},
        {teams.LINK_VARIABLE: BASE},
        {teams.WEBHOOK_VARIABLE: "http://example.invalid/hook", teams.LINK_VARIABLE: BASE},
        {teams.WEBHOOK_VARIABLE: "https://", teams.LINK_VARIABLE: BASE},
        {teams.WEBHOOK_VARIABLE: HOOK, teams.LINK_VARIABLE: "file:///c:/library"},
        {teams.WEBHOOK_VARIABLE: HOOK, teams.LINK_VARIABLE: "http://host name"},
        {teams.WEBHOOK_VARIABLE: "https://example.invalid:abc/hook", teams.LINK_VARIABLE: BASE},
        {
            teams.WEBHOOK_VARIABLE: "https://example.invalid/a\x01secret-token",
            teams.LINK_VARIABLE: BASE,
        },
        {teams.WEBHOOK_VARIABLE: HOOK, teams.LINK_VARIABLE: "http://host:abc"},
        {teams.WEBHOOK_VARIABLE: HOOK, teams.LINK_VARIABLE: "http://host/app?x=1"},
        {teams.WEBHOOK_VARIABLE: HOOK, teams.LINK_VARIABLE: "http://host/app#x"},
    ],
)
def test_half_or_unusable_settings_refuse_the_start(environ):
    with pytest.raises(StartupRefused) as refused:
        teams.config_from_environment(teams.CONNECTED_PAGES, environ)
    assert "secret-token" not in str(refused.value)


# -- UK time and slots ------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("utc", "uk"),
    [
        ("2026-11-16T13:00", "2026-11-16T13:00"),
        ("2026-03-29T00:59", "2026-03-29T00:59"),  # the last Sunday of March 2026
        ("2026-03-29T01:00", "2026-03-29T02:00"),
        ("2026-07-01T08:10", "2026-07-01T09:10"),
        ("2026-10-25T00:59", "2026-10-25T01:59"),  # the last Sunday of October 2026
        ("2026-10-25T01:00", "2026-10-25T01:00"),
    ],
)
def test_uk_time_follows_summer_time(utc, uk):
    moment = datetime.fromisoformat(utc).replace(tzinfo=UTC)
    assert teams.uk_time(moment) == datetime.fromisoformat(uk)


@pytest.mark.parametrize(
    ("utc", "slot"),
    [
        ("2026-11-16T09:00", "2026-11-16T09"),
        ("2026-11-16T13:29", "2026-11-16T13"),
        ("2026-11-16T13:30", ""),  # too late for the 13:00 summary
        ("2026-11-16T17:05", "2026-11-16T17"),
        ("2026-11-16T21:00", "2026-11-16T21"),
        ("2026-11-16T08:59", ""),
        ("2026-11-16T12:00", ""),
        ("2026-11-17T01:00", ""),  # four hours after 21:00 is outside the day
        ("2026-11-14T13:00", ""),  # Saturday
        ("2026-11-15T13:00", ""),  # Sunday
        ("2026-07-01T08:10", "2026-07-01T09"),  # 09:10 in UK summer time
        ("2026-07-01T09:10", ""),
        ("2026-07-03T23:10", ""),  # 00:10 on Saturday in the UK
    ],
)
def test_a_summary_is_due_on_weekday_slots_in_uk_time(utc, slot):
    assert teams.due_slot(datetime.fromisoformat(utc).replace(tzinfo=UTC)) == slot


def test_a_slot_is_read_from_any_time_zone():
    tokyo = MONDAY_1300.astimezone(datetime.fromisoformat("2026-11-16T22:00+09:00").tzinfo)
    assert teams.due_slot(tokyo) == "2026-11-16T13"


# -- the cards --------------------------------------------------------------------------------


def test_the_started_card_says_who_when_and_what_will_run():
    card = teams.started_card(record(), LINK, 14)
    assert card["type"] == "AdaptiveCard" and card["version"] == "1.5"
    band, stripe = card["body"][0]["items"]
    assert band["backgroundImage"]["url"].startswith("data:image/png;base64,iVBOR")
    assert band["items"][0]["altText"] == "Credit OS"
    assert first_pixel(stripe["items"][0]["url"]) == (0, 26, 255, 255)  # brand blue: running
    assert texts(card["body"][1:]) == [
        "Northbridge Holdings",
        "Full credit assessment",
        "Running",
        "Priya R",
        "13:45",
        "4 docs",
        "14 modules",
        "USD 25.00 cap",
    ]
    assert actions(card) == [
        ("Watch run", "http://127.0.0.1:8765/run/20261116-134500-01"),
        ("Library", "http://127.0.0.1:8765/"),
    ]


def test_a_card_leaves_out_what_the_record_does_not_hold():
    bare = record(submitted_by="", issuer_name="", cap="not money", started_at="")
    assert texts(teams.started_card(bare, LINK, 3)["body"][1:]) == [
        "northbridge",
        "Full credit assessment",
        "Running",
        "4 docs",
        "3 modules",
    ]


def test_the_finished_card_carries_the_lead_exactly_and_links_the_report():
    lead = "Leverage rose to 5.4x from 4.9x; liquidity covers every maturity through FY2028."
    done = record(status="finished", ended_at="2026-11-16T14:32:00Z")
    card = teams.finished_card(done, LINK, (14, 14), lead)
    assert texts(card["body"][1:]) == [
        "Northbridge Holdings",
        "Full credit assessment",
        "Finished",
        "Priya R",
        "14:32",
        "14/14 modules",
        lead,
    ]
    assert actions(card)[0] == ("Open report", "http://127.0.0.1:8765/report/20261116-134500-01")


def test_the_finished_card_has_no_callout_without_a_lead():
    done = record(status="finished", ended_at="2026-11-16T14:32:00Z")
    assert texts(teams.finished_card(done, LINK, (14, 14), "")["body"][1:])[-1] == "14/14 modules"


def test_markdown_marks_in_a_name_or_a_lead_are_shown_as_written():
    done = record(status="finished", ended_at="2026-11-16T14:32:00Z", issuer_name="A*B [x]_y")
    shown = texts(teams.finished_card(done, LINK, (1, 1), "EBITDA* fell")["body"][1:])
    assert shown[0] == r"A\*B \[x\]\_y" and shown[-1] == r"EBITDA\* fell"


@pytest.mark.parametrize(
    ("state", "word", "sentence"),
    [
        (
            "capped",
            "Capped",
            "Stopped at the cap before it finished. No report has been published.",
        ),
        ("failed", "Failed", "The run failed before it finished. No report has been published."),
        (
            "interrupted",
            "Interrupted",
            "The run was interrupted before it finished. No report has been published.",
        ),
    ],
)
def test_the_stopped_card_says_why_and_how_far_it_got(state, word, sentence):
    stopped = record(status=state, ended_at="2026-11-16T14:07:00Z", reason="see logs/x")
    card = teams.stopped_card(stopped, LINK, (11, 14))
    assert texts(card["body"][1:]) == [
        "Northbridge Holdings",
        "Full credit assessment",
        word,
        "Priya R",
        "14:07",
        "USD 25.00 cap",
        sentence,
        "11/14 modules",
    ]
    bar = card["body"][-1]["columns"][1]["items"][0]
    assert (bar["type"], bar["altText"], bar["size"]) == (
        "Image",
        "11 of 14 modules done",
        "Stretch",
    )
    width, row = pixel_row(bar["url"])
    filled = sum(row[i : i + 4] == bytes((0, 26, 255, 255)) for i in range(0, len(row), 4))
    assert (width, filled) == (600, 471)  # 11/14 of 600, rounded
    stripe = card["body"][0]["items"][1]["items"][0]
    assert (
        first_pixel(stripe["url"])
        == {
            "capped": (224, 168, 0, 255),
            "failed": (165, 76, 72, 255),
            "interrupted": (224, 168, 0, 255),
        }[state]
    )
    assert "logs" not in json.dumps(card)  # the record's reason is machinery: not shown
    assert actions(card)[0] == ("Run activity", "http://127.0.0.1:8765/runs")


def test_progress_counts_accepted_modules_of_the_run(lay):
    run = record()
    folder = lay.runs / run.id
    folder.mkdir(parents=True)
    for module in ("CP-0", "CP-1"):
        append_event(folder, "module_started", module=module)
    append_event(folder, "module_accepted", module="CP-0")
    done, total = teams.progress(lay, run)
    assert (done, total) == (
        1,
        len(PATHWAY_MODULES["credit_snapshot"]) - 1,
    )  # CP-MODEL is not shown
    assert teams.progress(lay, replace(run, modules=("CP-0", "CP-1"))) == (1, 2)
    assert teams.progress(lay, record("no-such-run"))[0] == 0


@pytest.mark.parametrize(
    ("name", "short"),
    [
        ("Eric G", "Eric G"),
        ("Eric MG", "Eric MG"),
        ("Dana Reyes", "Dana R"),
        ("analyst", "analyst"),
        ("", ""),
    ],
)
def test_a_summary_row_shortens_an_earlier_free_text_name(name, short):
    assert teams.short_name(name) == short


def day_of_runs() -> list[Record]:
    def ended(n: int, state: str, at: str, **change: Any) -> Record:
        return record(f"20261116-0{n}0000-01", status=state, ended_at=at, **change)

    return [
        record("20261116-120000-01", issuer_name="Harrowgate Industrials", submitted_by="Tom O"),
        record("20261116-123000-01", status="queued", issuer_name="Sable Energy", started_at=""),
        ended(1, "capped", "2026-11-16T12:07:00Z", pathway="deep_credit_assessment"),
        *(ended(n, "finished", f"2026-11-16T1{n - 2}:1{n}:00Z") for n in range(2, 9)),
        ended(9, "finished", "2026-11-15T16:00:00Z", issuer_name="Yesterday plc"),
    ]


def test_the_summary_counts_the_day_and_lists_five_finished_runs(lay):
    sent = Sent()
    sender = notifier(lay, sent)
    sender.tick(day_of_runs(), MONDAY_1300 - timedelta(hours=1), {})  # the first poll only records
    sender.tick(day_of_runs(), MONDAY_1300, {})
    [card] = sent.cards
    shown = texts(card["body"][1:])
    assert shown[:7] == [
        "Runs today",
        "Mon 16 Nov 2026",
        "13:00",
        "1 Stopped",
        "1 Running",
        "1 Queued",
        "7 Finished",
    ]
    rows = [shown[i : i + 3] for i in range(7, len(shown) - 1, 3)]
    assert rows[:3] == [
        ["Northbridge Holdings Deep", "Priya R", "12:07"],
        ["Harrowgate Industrials Full", "Tom O", "0/14"],
        ["Sable Energy Full", "Priya R", "Queued"],
    ]
    assert [row[2] for row in rows[3:]] == ["16:18", "15:17", "14:16", "13:15", "12:14"]
    assert shown[-1] == "+2 more finished"
    assert "Yesterday plc" not in json.dumps(card)
    assert posted_bytes(card) < 23_000  # Teams refuses a card of about 25 KB


def test_the_summary_is_posted_once_per_slot_and_not_when_the_day_is_quiet(lay):
    sent = Sent()
    sender = notifier(lay, sent)
    sender.tick([], MONDAY_1300 - timedelta(hours=1), {})
    running = [record()]
    sender.tick(running, MONDAY_1300, {})
    sender.tick(running, MONDAY_1300 + timedelta(minutes=5), {})
    assert sent.badges == ["13:00", "Running"]  # one summary, and the run's own card
    ended = [record(status="finished", ended_at="2026-11-16T14:32:00Z")]
    sender.tick(ended, MONDAY_1300 + timedelta(hours=2), {})
    sender.tick(ended, MONDAY_1300 + timedelta(hours=4), {})  # 17:00: it ended since 13:00
    sender.tick(ended, MONDAY_1300 + timedelta(hours=8), {})  # 21:00: nothing since 17:00
    assert sent.badges == ["13:00", "Running", "Finished", "17:00"]
    sender.tick(ended, MONDAY_1300 + timedelta(days=5), {})  # Saturday
    assert len(sent.cards) == 4


# -- the sender -------------------------------------------------------------------------------


def test_switching_the_sender_on_posts_nothing_for_runs_already_there(lay):
    sent = Sent()
    old = [record("a"), record("b", status="finished", ended_at="2026-11-13T10:00:00Z")]
    sender = notifier(lay, sent)
    sender.tick(old, MONDAY_1300 + timedelta(minutes=40), {})
    sender.tick(old, MONDAY_1300 + timedelta(minutes=41), {})
    assert sent.cards == []
    sender.tick(
        [replace(old[0], status="capped", ended_at="2026-11-16T13:42:00Z"), old[1]],
        MONDAY_1300 + timedelta(minutes=42),
        {},
    )
    assert sent.badges == ["Capped"]


def test_each_stage_of_a_run_is_posted_once_across_restarts(lay):
    sent = Sent()
    quiet = MONDAY_1300 + timedelta(minutes=40)
    notifier(lay, sent).tick([], quiet, {})
    queued = record(status="queued", started_at="")
    notifier(lay, sent).tick([queued], quiet, {})
    assert sent.cards == []  # a queued run has no card
    for _ in range(2):
        notifier(lay, sent).tick([record()], quiet, {})
    assert sent.badges == ["Running"]
    done = record(status="finished", ended_at="2026-11-16T14:32:00Z")
    for _ in range(2):
        notifier(lay, sent).tick([done], quiet, {done.id: "The lead."})
    assert sent.badges == ["Running", "Finished"]
    assert texts(sent.cards[1]["body"])[-1] == "The lead."


def test_a_run_that_ends_within_one_poll_gets_only_its_ending_card(lay):
    sent = Sent()
    sender = notifier(lay, sent)
    quiet = MONDAY_1300 + timedelta(minutes=40)
    sender.tick([], quiet, {})
    sender.tick(
        [record(status="failed", ended_at="2026-11-16T13:41:00Z", started_at="")], quiet, {}
    )
    assert sent.badges == ["Failed"]


def test_a_failed_post_is_retried_after_a_minute_and_the_webhook_is_never_logged(lay, caplog):
    sent = Sent(fail=2)
    sender = notifier(lay, sent)
    quiet = MONDAY_1300 + timedelta(minutes=40)
    sender.tick([], quiet, {})
    with caplog.at_level(logging.WARNING, logger="test.teams"):
        sender.tick([record()], quiet, {})
        sender.tick([record()], quiet + timedelta(seconds=30), {})  # inside the wait: no attempt
        assert sent.fail == 1
        sender.tick([record()], quiet + timedelta(seconds=61), {})
        sender.tick([record()], quiet + timedelta(seconds=122), {})
    assert sent.badges == ["Running"]
    assert "retrying" in caplog.text and "secret-token" not in caplog.text
    assert "<webhook>" in caplog.text


def test_a_card_not_posted_within_two_hours_is_dropped_and_later_cards_still_go(lay, caplog):
    sent = Sent(fail=1000)
    sender = notifier(lay, sent)
    quiet = MONDAY_1300 + timedelta(minutes=40)  # the run started at 13:45
    sender.tick([], quiet, {})
    with caplog.at_level(logging.WARNING, logger="test.teams"):
        for minute in range(0, 126, 2):
            sender.tick([record()], quiet + timedelta(minutes=minute), {})
        assert "dropped" not in caplog.text and sent.fail < 950  # still trying at 15:44
        sender.tick([record()], quiet + timedelta(minutes=126), {})  # 15:46
    assert sent.cards == [] and "20261116-134500-01:started dropped" in caplog.text
    sent.fail = 0
    done = record(status="finished", ended_at="2026-11-16T15:50:00Z")
    sender.tick([done], quiet + timedelta(minutes=135), {})
    assert sent.badges == ["Finished"]


class Odd(Exception):
    """Not an OSError: what a garbled reply or an unparsable address raises."""


@pytest.mark.parametrize(
    "bad",
    [
        {"submitted_by": 5},
        {"issuer_name": 5},
        {"pathway": None},
        {"pathway": ""},
        {"started_at": 5},
        {"files": None},
    ],
)
def test_a_hand_edited_record_loses_its_card_and_stops_nothing(lay, caplog, bad):
    sent = Sent()
    sender = notifier(lay, sent)
    quiet = MONDAY_1300 + timedelta(minutes=50)
    sender.tick([], quiet, {})
    good = record("20261116-134600-01", issuer_name="Good plc")
    with caplog.at_level(logging.WARNING, logger="test.teams"):
        sender.tick([replace(record(), **bad), good], quiet, {})
        sender.tick([replace(record(), **bad), good], quiet + timedelta(minutes=2), {})
    shown = [texts(card["body"])[0] for card in sent.cards]
    assert shown.count("Good plc") == 1 and len(sent.cards) <= 2


def test_a_summary_with_hand_edited_records_does_not_raise(lay):
    sent = Sent()
    sender = notifier(lay, sent)
    sender.tick([], MONDAY_1300 - timedelta(hours=1), {})
    odd = [
        record("a", status="finished", ended_at=5),
        record("b", pathway=""),
        record("c", status="queued", submitted_by=None),
    ]
    sender.tick(odd, MONDAY_1300, {})
    sender.tick(odd, MONDAY_1300 + timedelta(minutes=2), {})


def test_an_error_that_is_no_oserror_is_retried_and_its_text_is_not_logged(lay, caplog):
    calls: list[int] = []

    def send(webhook: str, card: dict[str, Any]) -> None:
        calls.append(1)
        if len(calls) == 1:
            raise Odd(f"cannot parse {webhook}")

    sender = teams.Notifier(lay, CONFIG, LOG, send)
    quiet = MONDAY_1300 + timedelta(minutes=50)
    sender.tick([], quiet, {})
    with caplog.at_level(logging.WARNING, logger="test.teams"):
        sender.tick([record()], quiet, {})
        sender.tick([record()], quiet + timedelta(minutes=2), {})
        sender.tick([record()], quiet + timedelta(minutes=4), {})
    assert len(calls) == 2
    assert "(Odd); retrying" in caplog.text and "example.invalid" not in caplog.text


def test_a_ledger_that_cannot_be_saved_posts_each_card_once_and_keeps_the_summary(
    lay, monkeypatch, caplog
):
    sent = Sent()
    sender = notifier(lay, sent)
    sender.tick([], MONDAY_1300 - timedelta(hours=1), {})

    def refuse(*args: Any, **kwargs: Any) -> None:
        raise PermissionError("read-only")

    monkeypatch.setattr(teams.platform_io, "write_atomic", refuse)
    runs = [
        record("a", started_at="2026-11-16T12:59:00Z"),
        record("b", started_at="2026-11-16T12:59:00Z"),
    ]
    with caplog.at_level(logging.ERROR, logger="test.teams"):
        sender.tick(runs, MONDAY_1300, {})
        sender.tick(runs, MONDAY_1300 + timedelta(minutes=2), {})
    assert sent.badges == ["13:00", "Running", "Running"]
    assert "Teams ledger could not be saved" in caplog.text


def test_a_null_summary_time_in_the_ledger_reads_as_none(lay):
    (lay.engine / "teams.json").write_text(
        json.dumps({"runs": {}, "summary": "", "summary_at": None}), encoding="utf-8"
    )
    sent = Sent()
    ended = record(status="finished", ended_at="2026-11-16T12:50:00Z")
    (lay.engine / "teams.json").write_text(
        json.dumps({"runs": {ended.id: "ended"}, "summary": "", "summary_at": None}),
        encoding="utf-8",
    )
    notifier(lay, sent).tick([ended], MONDAY_1300, {})
    assert sent.badges == ["13:00"]


def test_a_summary_that_was_not_posted_leaves_its_runs_for_the_next_one(lay):
    sent = Sent(fail=1000)
    sender = notifier(lay, sent)
    sender.tick([], MONDAY_1300 - timedelta(hours=1), {})
    ended = [record(status="finished", ended_at="2026-11-16T12:50:00Z")]
    notifier(lay, Sent()).tick(ended, MONDAY_1300 - timedelta(minutes=5), {})  # its own card
    sender = notifier(lay, sent)
    for minute in range(0, 30, 2):
        sender.tick(ended, MONDAY_1300 + timedelta(minutes=minute), {})
    sent.fail = 0
    sender.tick(ended, MONDAY_1300 + timedelta(hours=4), {})
    assert sent.badges == ["17:00"]


def test_a_bad_day_s_summary_stays_under_the_teams_limit(lay):
    name = "N" * 80

    def many(count: int, state: str, **change: Any) -> list[Record]:
        return [
            record(f"{state}-{n:02d}", status=state, issuer_name=name, **change)
            for n in range(count)
        ]

    ended = {"ended_at": "2026-11-16T12:30:00Z"}
    runs = [
        *many(30, "failed", **ended),
        *many(3, "running"),
        *many(30, "queued", started_at=""),
        *many(30, "finished", **ended),
    ]
    sent = Sent()
    sender = notifier(lay, sent)
    sender.tick(runs, MONDAY_1300 - timedelta(hours=1), {})
    sender.tick(runs, MONDAY_1300, {})
    [card] = sent.cards
    shown = texts(card["body"])
    assert shown[3:7] == ["30 Stopped", "3 Running", "30 Queued", "30 Finished"]
    rows = [texts(row)[-1] for row in card["body"][3]["items"]]
    queued = rows.count("Queued")
    assert rows[:9] == ["12:30"] * 5 + ["0/14"] * 3 + ["Queued"]  # stopped first, five of them
    assert queued >= 1 and len(rows) == 5 + 3 + queued
    assert (
        shown[-1] == f"+25 more stopped \u00b7 +{30 - queued} more queued \u00b7 +30 more finished"
    )
    assert 21_000 < posted_bytes(card) <= 23_000


def test_an_unreadable_ledger_replays_nothing(lay):
    sent = Sent()
    (lay.engine / "teams.json").parent.mkdir(parents=True, exist_ok=True)
    (lay.engine / "teams.json").write_text("{not json", encoding="utf-8")
    sender = notifier(lay, sent)
    done = record(status="finished", ended_at="2026-11-13T10:00:00Z")
    sender.tick([done], MONDAY_1300 + timedelta(minutes=40), {})
    assert sent.cards == []
    assert json.loads((lay.engine / "teams.json").read_text(encoding="utf-8"))["runs"] == {
        done.id: "ended"
    }


class _Hook(BaseHTTPRequestHandler):
    seen: ClassVar[list[tuple[str, str, bytes]]] = []

    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers["Content-Length"]))
        self.seen.append((self.path, self.headers["Content-Type"], body))
        if self.path == "/moved":
            self.send_response(302)
            self.send_header("Location", "/hook")
        else:
            self.send_response(202)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        self.seen.append((self.path, "GET", b""))
        self.send_response(200)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, *args: Any) -> None:
        return None


@pytest.fixture
def hook(monkeypatch: pytest.MonkeyPatch) -> Iterator[str]:
    for name in ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr(teams, "_OPENER", teams.urllib.request.build_opener(teams._NoRedirect))
    _Hook.seen.clear()
    server = ThreadingHTTPServer(("127.0.0.1", 0), _Hook)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()
    server.server_close()


def test_post_sends_one_teams_message_holding_the_card(hook):
    teams.post(f"{hook}/hook", {"type": "AdaptiveCard", "speak": "caf\u00e9"})
    [(path, kind, body)] = _Hook.seen
    assert (path, kind) == ("/hook", "application/json; charset=utf-8")
    assert json.loads(body.decode("utf-8")) == {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {"type": "AdaptiveCard", "speak": "caf\u00e9"},
            }
        ],
    }


def test_post_refuses_a_redirect_instead_of_following_it(hook):
    with pytest.raises(OSError, match="302"):
        teams.post(f"{hook}/moved", {"type": "AdaptiveCard"})
    assert [path for path, _, _ in _Hook.seen] == ["/moved"]


def test_a_run_s_child_process_does_not_inherit_the_webhook(monkeypatch):
    monkeypatch.setenv(teams.WEBHOOK_VARIABLE, HOOK)
    monkeypatch.setenv(teams.LINK_VARIABLE, BASE)
    env = runs_module.child_environment()
    assert teams.WEBHOOK_VARIABLE not in env and HOOK not in env.values()
    assert env[teams.LINK_VARIABLE] == BASE


def test_the_lead_is_the_library_s_overview_line_for_that_run():
    summary = {"bottom_line": "Leverage is 5.4x.", "limitation": "No covenant package."}
    library = SimpleNamespace(
        runs=[
            {
                "id": "other",
                "modules": [{"id": "CP-2", "summary": {**summary, "bottom_line": "x"}}],
            },
            {
                "id": "run",
                "modules": [
                    {"id": "CP-1", "summary": {**summary, "bottom_line": "CP-1 says."}},
                    {"id": "CP-2", "summary": summary},
                    {"id": "CP-8", "summary": {**summary, "bottom_line": "Changed."}},
                ],
            },
            {"id": "bare"},
        ]
    )
    assert scheduler_module._lead(library, "run") == "Leverage is 5.4x."
    assert scheduler_module._lead(library, "bare") == ""
    assert scheduler_module._lead(library, "missing") == ""


# -- with the scheduler -----------------------------------------------------------------------

DELIVERED = [
    ["module_started", {"module": "CP-0"}],
    ["module_accepted", {"module": "CP-0"}],
    ["delivered", {}],
]


def test_the_scheduler_posts_a_run_s_start_and_its_report(root, fake_env, listed, monkeypatch):
    sent = Sent()
    monkeypatch.setattr(teams, "post", sent)
    fake_env({"events": DELIVERED, "sleep": 1})
    listed("*")
    w = Scheduler(settings(root, teams=CONFIG))
    w.step()  # the first poll records what is there: nothing
    submit_run(w, root)
    pump(w, lambda: status(root) == ["finished"] and len(sent.cards) == 2, limit=10)
    assert sent.badges == ["Running", "Finished"]
    assert texts(sent.cards[0]["body"])[0] == "Acme Corp"
    assert json.loads((layout_of(root).engine / "teams.json").read_text(encoding="utf-8"))["runs"]
    w.close()


def test_the_scheduler_posts_nothing_without_teams_settings(root, fake_env, listed, monkeypatch):
    sent = Sent()
    monkeypatch.setattr(teams, "post", sent)
    fake_env({"events": DELIVERED})
    listed("*")
    w = Scheduler(settings(root))
    submit_run(w, root)
    pump(w, lambda: status(root) == ["finished"])
    assert sent.cards == [] and not (layout_of(root).engine / "teams.json").exists()
    w.close()


def test_the_run_start_service_links_into_its_library_page():
    link = teams.Links("http://10.0.0.5:8765", teams.LIBRARY_PAGES)
    done = record("a b", status="finished", ended_at="2026-11-16T14:32:00Z")
    assert actions(teams.finished_card(done, link, (1, 1), "")) == [
        ("Open report", "http://10.0.0.5:8765/library/index.html#W-Report/history?c=a%20b"),
        ("Library", "http://10.0.0.5:8765/library/index.html#W-Library/cases"),
    ]
    assert actions(teams.stopped_card(replace(done, status="failed"), link, (0, 1)))[0] == (
        "Run activity",
        "http://10.0.0.5:8765/library/index.html#CP-OS/activity",
    )


def test_every_run_state_has_its_pill_and_shape_and_every_meta_icon_is_drawn():
    from deploy_workflow.inbox import teams_brand

    states = {"queued", "running", "finished", "failed", "capped", "rejected", "interrupted"}
    assert set(teams_brand.PILLS) == set(teams_brand.SHAPES) == states
    assert set(teams_brand.ICONS) == {"person", "clock", "document", "layers", "money"}
    for url in (*teams_brand.PILLS.values(), *teams_brand.SHAPES.values()):
        assert (
            base64.b64decode(url.removeprefix("data:image/png;base64,"))[:8] == b"\x89PNG\r\n\x1a\n"
        )


def test_a_callout_tint_lets_the_theme_show_through_and_its_rule_does_not():
    done = record(status="finished", ended_at="2026-11-16T14:32:00Z")
    callout = teams.finished_card(done, LINK, (1, 1), "The lead.")["body"][-1]
    width, row = pixel_row(callout["backgroundImage"]["url"])
    assert callout["backgroundImage"]["fillMode"] == "RepeatVertically"
    assert row[:12] == bytes((0, 26, 255, 255)) * 3  # a 3px opaque rule
    assert row[12:16] == bytes((0, 26, 255, 18))  # then the tint, mostly transparent
    assert width == 1600
