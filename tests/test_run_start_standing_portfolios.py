"""The start page's standing reference portfolios through the service's handler: the listing, the
analyst's "fetch latest", the first fetch of an absent set, and a set the analyst supplies.

Offline: each request is written into the handler's own input stream and its reply read back from
its output stream, so no socket is opened, and every fetch runs on an injected connector and
resolver (the server object's ``standing`` desk). Every file is SYNTHETIC
(tools/synthetic_reference_portfolios.py) and every expected value is written by hand from those
fixtures: LOANS states 24 November 2026 and holds 5 positions, BONDS 23 November 2026 and 2, the
CLO pack 31 October 2026 (its mandate) and 7 with 3 limits. No provider is called.
"""

from __future__ import annotations

import http.client
import io
import json
import os
import socket
import threading
import urllib.parse
from collections.abc import Callable, Iterator, Mapping
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from inbox_fixtures import settings

from deploy_workflow import http_base, reference_fetch
from deploy_workflow import reference_portfolios as rp
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.research.webfetch import ConnectionTarget
from deploy_workflow.run_start import service, standing_portfolios, submissions
from deploy_workflow.run_start.reference_portfolio import standing_root
from tools import synthetic_reference_portfolios as synthetic

pytest_plugins = ["inbox_fixtures"]

PORT = 8765
HOST = f"127.0.0.1:{PORT}"
EARLIER = datetime(2026, 11, 24, 18, 0, tzinfo=UTC)
NOW = datetime(2026, 11, 25, 9, 30, tzinfo=UTC)
EARLIER_TEXT = "2026-11-24T18:00:00+00:00"
NOW_TEXT = "2026-11-25T09:30:00+00:00"
LOANS = synthetic.workbook_bytes(synthetic.LOANS)
BONDS = synthetic.workbook_bytes(synthetic.BONDS)
LVLN = "Loan index fund (LVLN)"
JNK = "High-yield bond fund (JNK)"
NOT_FOUND = f"{LVLN}: the holdings file could not be fetched (server answered HTTP 404)."
NOT_A_PORTFOLIO = b"This is a note, not a holdings table.\n"
NO_TABLE = (
    "No holdings table was found. notes.csv has no header row naming a holding and its weight, "
    "par or market value."
)
# The pack's holdings header has no CUSIP, ISIN, SEDOL, other identifier or coupon column.
PACK_NOT_FOUND = ["CUSIP", "ISIN", "SEDOL", "Other identifier", "Coupon"]
BASE = "/api/reference-portfolios"


def absent(key: str, name: str, kind: str, *, fetchable: bool) -> dict[str, Any]:
    """A listing entry with no stored set and no failure."""
    return {
        "key": key,
        "name": name,
        "kind": kind,
        "as_of": None,
        "stored_at": None,
        "positions": None,
        "failure": None,
        "error": None,
        "fetchable": fetchable,
    }


EMPTY = [
    absent("clo", "CLO portfolio", "clo", fetchable=False),
    absent("lvln", LVLN, "loan_index", fetchable=True),
    absent("jnk", JNK, "hy_index", fetchable=True),
]


# --- A connector per fund path, and the handler without a socket ---------------------------------

FUNDS = "/library-content/products/fund-data/etfs/us/"
LVLN_PATH = FUNDS + "holdings-daily-us-en-lvln.xlsx"
JNK_PATH = FUNDS + "holdings-daily-us-en-jnk.xlsx"
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


class FetchReply:
    """An answer the connector gives: a status, headers and a body read in chunks."""

    def __init__(self, status: int, body: bytes = b"", headers: Mapping[str, str] | None = None):
        self.status = status
        self.headers = {name.lower(): value for name, value in (headers or {}).items()}
        self.body, self.consumed = body, 0

    def getheader(self, name: str, /) -> str | None:
        return self.headers.get(name.lower())

    def read(self, amt: int) -> bytes:
        chunk = self.body[self.consumed : self.consumed + amt]
        self.consumed += len(chunk)
        return chunk


def workbook(body: bytes, content_type: str = XLSX) -> FetchReply:
    return FetchReply(200, body, {"Content-Type": content_type, "Content-Length": str(len(body))})


def public(host: str) -> list[str]:
    """The fund manager's host resolves to one public address; no other host is asked for."""
    assert host == "www.ssga.com"
    return ["93.184.216.34"]


class Funds:
    """A connector answering each fund's path from ``answers`` (a reply is read once, so each is
    made per request) and recording every path asked for. The request for ``gate`` sets
    ``entered`` and waits for ``release`` (at most 10 seconds) before it is answered."""

    def __init__(
        self, answers: Mapping[str, Callable[[], FetchReply]], gate: str | None = None
    ) -> None:
        self.answers = answers
        self.gate = gate
        self.paths: list[str] = []
        self.entered = threading.Event()
        self.release = threading.Event()

    def __call__(self, target: ConnectionTarget) -> _Line:
        assert (target.host, target.ip) == ("www.ssga.com", "93.184.216.34")
        return _Line(self)


class _Line:
    def __init__(self, funds: Funds) -> None:
        self.funds, self.path = funds, ""

    def request(self, method: str, url: str, *, headers: Mapping[str, str]) -> None:
        assert method == "GET"
        self.path = url
        self.funds.paths.append(url)

    def getresponse(self) -> FetchReply:
        if self.path == self.funds.gate:
            self.funds.entered.set()
            assert self.funds.release.wait(10)
        return self.funds.answers[self.path]()

    def close(self) -> None:
        pass


ANSWERS: dict[str, Callable[[], FetchReply]] = {
    LVLN_PATH: lambda: workbook(LOANS),
    JNK_PATH: lambda: workbook(BONDS, "application/octet-stream"),
}


class Clock:
    """The scheduler's clock, set by the test."""

    def __init__(self, at: datetime) -> None:
        self.at = at

    def __call__(self) -> datetime:
        return self.at


@dataclass
class Box:
    """The server object the handler reads: the scheduler, the host check's values and the
    standing portfolios' desk. ``funds`` is the desk's connector."""

    scheduler: Scheduler
    standing: standing_portfolios.Desk
    funds: Funds
    clock: Clock
    allowed_hosts: frozenset[str] = http_base.hosts("127.0.0.1", PORT)
    advertised_port: int = PORT

    def wire(self, funds: Funds) -> Funds:
        """Fetch with ``funds`` from now on."""
        self.funds = funds
        self.standing.wiring = reference_fetch.Wiring(funds, public, lambda: 1000.0)
        return funds

    @property
    def store(self) -> rp.Store:
        return rp.Store(standing_root(self.scheduler.layout))


@dataclass
class Answer:
    status: int
    body: bytes

    def json(self) -> Any:
        return json.loads(self.body)


class _Sent:
    """What the handler wrote, as the socket ``http.client`` reads a response from."""

    def __init__(self, data: bytes) -> None:
        self.data = data

    def makefile(self, *args: object, **kwargs: object) -> io.BytesIO:
        return io.BytesIO(self.data)


def call(
    box: Box,
    method: str,
    path: str,
    body: bytes | None = None,
    head: Mapping[str, str | None] | None = None,
) -> Answer:
    """One request through ``service.Handler``, as a browser on the service's own page sends it.
    ``head`` adds headers, or replaces one; None leaves it out (``Origin``)."""
    sent: dict[str, str | None] = {"Host": HOST, "Origin": f"http://{HOST}"}
    if body is not None:
        sent["Content-Length"] = str(len(body))
    sent.update(head or {})
    lines = [f"{method} {path} HTTP/1.1"]
    lines += [f"{name}: {value}" for name, value in sent.items() if value is not None]
    handler = service.Handler.__new__(service.Handler)
    handler.server = box  # type: ignore[assignment]
    handler.client_address = ("127.0.0.1", 50000)
    handler.rfile = io.BytesIO(("\r\n".join(lines) + "\r\n\r\n").encode("ascii") + (body or b""))
    handler.wfile = io.BytesIO()
    handler.handle_one_request()
    reply = http.client.HTTPResponse(_Sent(handler.wfile.getvalue()))  # type: ignore[arg-type]
    reply.begin()
    return Answer(reply.status, reply.read())


def stage(box: Box, key: str, name: str, raw: bytes) -> Answer:
    quoted = urllib.parse.quote(name, safe="")
    return call(box, "POST", f"{BASE}/{key}/files?name={quoted}", raw)


def listed(box: Box) -> dict[str, dict[str, Any]]:
    got = call(box, "GET", BASE)
    assert got.status == 200
    return {entry["key"]: entry for entry in got.json()["portfolios"]}


@pytest.fixture
def box(root: Path) -> Iterator[Box]:
    clock = Clock(NOW)
    scheduler = Scheduler(settings(root), now=clock)
    made = Box(scheduler, standing_portfolios.Desk(), Funds(ANSWERS), clock)
    made.wire(made.funds)
    yield made
    scheduler.close()


@pytest.fixture
def stocked(box: Box) -> Box:
    """LVLN's set of 24 November, fetched the evening before NOW."""
    box.clock.at = EARLIER
    assert call(box, "POST", f"{BASE}/lvln/refresh").json()["outcome"] == "stored"
    box.clock.at = NOW
    box.wire(Funds(ANSWERS))
    return box


@pytest.fixture
def offline(monkeypatch: pytest.MonkeyPatch) -> None:
    """Any real name lookup or connection fails the test."""

    def refuse(*args: object, **kwargs: object) -> None:
        raise AssertionError("the network was touched")

    monkeypatch.setattr(socket, "getaddrinfo", refuse)
    monkeypatch.setattr(socket, "create_connection", refuse)


# --- The listing ----------------------------------------------------------------------------------


def test_the_listing_of_an_empty_store_names_the_three_and_fetches_nothing(box, offline):
    got = call(box, "GET", BASE)
    assert got.status == 200
    assert got.json() == {"portfolios": EMPTY}
    assert box.funds.paths == []
    assert not standing_root(box.scheduler.layout).exists()  # a listing writes nothing


def test_a_fetched_set_is_listed_with_the_files_date_and_the_fetch_time(stocked, offline):
    assert listed(stocked)["lvln"] == {
        **absent("lvln", LVLN, "loan_index", fetchable=True),
        "as_of": "2026-11-24",
        "stored_at": EARLIER_TEXT,
        "positions": 5,
    }
    assert stocked.funds.paths == []


def test_a_stored_file_that_cannot_be_read_is_listed_with_its_error_without_the_key(stocked):
    (stocked.store.root / "jnk.json").write_text("{not json", encoding="utf-8")
    (stocked.store.root / "lvln.failure.json").write_text("[]", encoding="utf-8")
    shown = listed(stocked)
    assert shown["jnk"] == {
        **absent("jnk", JNK, "hy_index", fetchable=True),
        "error": "The stored set cannot be read: its file is damaged or is not a stored portfolio.",
    }
    # A damaged record of a failed fetch is said beside the good set, which stays listed.
    assert shown["lvln"] == {
        **absent("lvln", LVLN, "loan_index", fetchable=True),
        "as_of": "2026-11-24",
        "stored_at": EARLIER_TEXT,
        "positions": 5,
        "error": "The record of the last failed refresh of this portfolio cannot be read.",
    }
    # A file the store cannot read is not fetched over by the first fetch.
    assert call(stocked, "POST", f"{BASE}/ensure").json()["portfolios"][1:] == [
        shown["lvln"],
        shown["jnk"],
    ]
    assert stocked.funds.paths == []


# --- Fetch latest ---------------------------------------------------------------------------------


def test_fetch_latest_stores_the_file_and_the_listing_shows_its_date(box):
    got = call(box, "POST", f"{BASE}/lvln/refresh")
    assert got.status == 200
    done = got.json()
    shown = done.pop("portfolios")
    assert done == {
        "key": "lvln",
        "name": LVLN,
        "outcome": "stored",
        "as_of": "2026-11-24",
        "stored_at": NOW_TEXT,
        "file_as_of": "2026-11-24",
        "message": None,
        "columns_gained": [],
        "columns_lost": [],
    }
    assert box.funds.paths == [LVLN_PATH]
    assert shown == [
        EMPTY[0],
        {**EMPTY[1], "as_of": "2026-11-24", "stored_at": NOW_TEXT, "positions": 5},
        EMPTY[2],
    ]
    assert call(box, "GET", BASE).json() == {"portfolios": shown}


def test_a_failed_fetch_keeps_the_previous_set_and_both_are_listed(stocked):
    path = stocked.store.root / "lvln.json"
    before = path.read_bytes()
    stocked.wire(Funds({LVLN_PATH: lambda: FetchReply(404, b"<html>gone</html>")}))
    got = call(stocked, "POST", f"{BASE}/lvln/refresh")
    assert got.status == 200
    done = got.json()
    shown = done.pop("portfolios")
    assert done == {
        "key": "lvln",
        "name": LVLN,
        "outcome": "failed",
        "as_of": "2026-11-24",
        "stored_at": EARLIER_TEXT,
        "file_as_of": None,
        "message": NOT_FOUND,
        "columns_gained": [],
        "columns_lost": [],
    }
    assert path.read_bytes() == before
    assert (
        shown[1]
        == listed(stocked)["lvln"]
        == {
            **absent("lvln", LVLN, "loan_index", fetchable=True),
            "as_of": "2026-11-24",
            "stored_at": EARLIER_TEXT,
            "positions": 5,
            "failure": {"message": NOT_FOUND, "at": NOW_TEXT},
        }
    )


FEWER = synthetic.workbook_bytes(
    synthetic.rearranged(
        synthetic.LOANS,
        [i for i, name in enumerate(synthetic.LOANS.header) if name not in ("Sector", "Coupon")],
        {},
    )
)


def test_a_file_that_lost_columns_is_a_reported_failure_and_the_set_kept(stocked):
    path = stocked.store.root / "lvln.json"
    before = path.read_bytes()
    stocked.wire(Funds({LVLN_PATH: lambda: workbook(FEWER)}))
    got = call(stocked, "POST", f"{BASE}/lvln/refresh").json()
    assert (got["outcome"], got["as_of"], got["stored_at"]) == (
        "failed",
        "2026-11-24",
        EARLIER_TEXT,
    )
    assert (got["columns_gained"], got["columns_lost"]) == ([], ["Coupon", "Sector"])
    assert got["message"].startswith(f"{LVLN}: ")  # the fetch's own sentence (reference_fetch)
    assert path.read_bytes() == before
    assert got["portfolios"][1]["failure"] == {"message": got["message"], "at": NOW_TEXT}


def test_a_file_that_gained_columns_is_stored_and_the_change_reported_in_reader_words(box):
    box.wire(Funds({LVLN_PATH: lambda: workbook(FEWER)}))
    assert call(box, "POST", f"{BASE}/lvln/refresh").json()["outcome"] == "stored"
    box.wire(Funds(ANSWERS))
    got = call(box, "POST", f"{BASE}/lvln/refresh").json()
    assert (got["outcome"], got["as_of"], got["stored_at"]) == ("stored", "2026-11-24", NOW_TEXT)
    assert (got["columns_gained"], got["columns_lost"]) == (["Coupon", "Sector"], [])


def test_an_older_file_is_kept_out_with_its_sentence(stocked):
    above = (*synthetic.LOANS.above[:2], ["Holdings:", "As of 20-Nov-2026"], None)
    older = synthetic.workbook_bytes(replace(synthetic.LOANS, above=above))
    stocked.wire(Funds({LVLN_PATH: lambda: workbook(older)}))
    got = call(stocked, "POST", f"{BASE}/lvln/refresh").json()
    assert (got["outcome"], got["as_of"], got["file_as_of"]) == ("kept", "2026-11-24", "2026-11-20")
    assert got["message"] == (
        f"{LVLN}: the file fetched is as of 20 November 2026, older than the stored set of "
        "24 November 2026, which is kept."
    )


def test_the_clo_portfolio_has_nothing_to_fetch_and_no_connection_is_made(box, offline):
    got = call(box, "POST", f"{BASE}/clo/refresh")
    assert (got.status, got.json()) == (
        400,
        {"error": "CLO portfolio has no holdings file to fetch; replace it with a file."},
    )
    assert box.funds.paths == []
    assert not standing_root(box.scheduler.layout).exists()


@pytest.mark.parametrize("key", ["custom", "runs", "staging", "LVLN"])
def test_a_key_that_is_not_a_standing_one_is_unknown(box, key):
    for method, tail in (("POST", "/refresh"), ("POST", ""), ("DELETE", "/files")):
        got = call(box, method, f"{BASE}/{key}{tail}")
        assert got.status == 404, (method, tail)
    assert stage(box, "custom", "h.csv", b"x").status == 404
    assert box.funds.paths == []


def test_a_second_fetch_of_the_same_key_is_refused_while_one_runs(box):
    funds = box.wire(Funds(ANSWERS, gate=LVLN_PATH))
    first: list[Answer] = []
    running = threading.Thread(
        target=lambda: first.append(call(box, "POST", f"{BASE}/lvln/refresh"))
    )
    running.start()
    try:
        assert funds.entered.wait(10)
        second = call(box, "POST", f"{BASE}/lvln/refresh")
        busy = f"{LVLN} is already being fetched or replaced; try again when it has finished."
        assert (second.status, second.json()) == (409, {"error": busy})
        assert stage(box, "lvln", "lvln.xlsx", LOANS).status == 200  # staging is not the store
        assert call(box, "POST", f"{BASE}/lvln").status == 409  # nor is it read meanwhile
        # The first fetch on a page load skips the key being fetched and fetches the other.
        assert call(box, "POST", f"{BASE}/ensure").status == 200
        assert funds.paths == [LVLN_PATH, JNK_PATH]
    finally:
        funds.release.set()
        running.join(10)
    assert not running.is_alive()
    assert first[0].json()["outcome"] == "stored"
    assert funds.paths == [LVLN_PATH, JNK_PATH]  # the refused request fetched nothing
    assert (listed(box)["lvln"]["as_of"], listed(box)["jnk"]["as_of"]) == (
        "2026-11-24",
        "2026-11-23",
    )


# --- The first fetch ------------------------------------------------------------------------------


def test_ensure_fetches_each_absent_fund_once_and_never_the_clo_portfolio(box):
    got = call(box, "POST", f"{BASE}/ensure")
    assert got.status == 200
    shown = {entry["key"]: entry for entry in got.json()["portfolios"]}
    assert box.funds.paths == [LVLN_PATH, JNK_PATH]
    assert (shown["lvln"]["as_of"], shown["lvln"]["positions"]) == ("2026-11-24", 5)
    assert (shown["jnk"]["as_of"], shown["jnk"]["positions"]) == ("2026-11-23", 2)
    assert shown["clo"] == EMPTY[0]
    assert call(box, "POST", f"{BASE}/ensure").json() == got.json()
    assert box.funds.paths == [LVLN_PATH, JNK_PATH]  # both are stored: nothing more is fetched


def test_ensure_fetches_neither_a_stored_set_nor_a_key_whose_fetch_failed(stocked):
    stocked.wire(Funds({JNK_PATH: lambda: FetchReply(503)}))
    assert call(stocked, "POST", f"{BASE}/jnk/refresh").json()["outcome"] == "failed"
    funds = stocked.wire(Funds(ANSWERS))
    for _ in range(3):  # a page load each
        shown = {
            entry["key"]: entry
            for entry in call(stocked, "POST", f"{BASE}/ensure").json()["portfolios"]
        }
    assert funds.paths == []
    assert shown["lvln"]["as_of"] == "2026-11-24"
    assert shown["jnk"]["as_of"] is None
    assert shown["jnk"]["failure"] == {
        "message": f"{JNK}: the holdings file could not be fetched (server answered HTTP 503).",
        "at": NOW_TEXT,
    }
    # Only the analyst's action fetches the failed key again.
    assert call(stocked, "POST", f"{BASE}/jnk/refresh").json()["outcome"] == "stored"
    assert funds.paths == [JNK_PATH]
    assert listed(stocked)["jnk"]["failure"] is None


def test_a_first_fetch_that_fails_is_listed_and_not_tried_again_on_the_next_load(box):
    funds = box.wire(Funds({LVLN_PATH: lambda: FetchReply(404), JNK_PATH: ANSWERS[JNK_PATH]}))
    first = {e["key"]: e for e in call(box, "POST", f"{BASE}/ensure").json()["portfolios"]}
    assert first["lvln"]["failure"] == {"message": NOT_FOUND, "at": NOW_TEXT}
    assert first["lvln"]["as_of"] is None and first["jnk"]["as_of"] == "2026-11-23"
    call(box, "POST", f"{BASE}/ensure")
    assert funds.paths == [LVLN_PATH, JNK_PATH]


# --- A set the analyst supplies -------------------------------------------------------------------


def test_the_clo_pack_supplied_by_hand_is_stored_and_listed(box, offline):
    assert call(box, "DELETE", f"{BASE}/clo/files").json() == {"cleared": True}
    for name, raw in synthetic.pack_files().items():
        assert stage(box, "clo", name, raw).json() == {"name": name}
    got = call(box, "POST", f"{BASE}/clo")
    assert got.status == 200, got.body
    read = got.json()
    portfolio = read["portfolio"]
    assert (portfolio["name"], portfolio["kind"], portfolio["as_of"]) == (
        "CLO portfolio",
        "clo",
        "2026-10-31",  # the mandate's `As of Date`, 31-Oct-2026
    )
    assert (portfolio["positions"], portfolio["unpriced"], portfolio["limits"]) == (7, 1, 3)
    assert portfolio["not_found"] == PACK_NOT_FOUND
    shown = {entry["key"]: entry for entry in read["portfolios"]}
    assert shown["clo"] == {
        **absent("clo", "CLO portfolio", "clo", fetchable=False),
        "as_of": "2026-10-31",
        "stored_at": NOW_TEXT,
        "positions": 7,
    }
    assert listed(box) == shown
    kept = box.store.load("clo")
    assert [source.name for source in kept.sources] == [
        "SYNTHETIC constraints.csv",
        "SYNTHETIC holdings.csv",
        "SYNTHETIC mandate.csv",
    ]
    assert {position.asset_type for position in kept.positions} == {"loan"}
    assert not (standing_root(box.scheduler.layout) / "staging" / "clo").exists()
    assert box.funds.paths == []


def test_a_fund_file_supplied_by_hand_replaces_its_set_and_clears_a_failure(stocked):
    stocked.wire(Funds({LVLN_PATH: lambda: FetchReply(404)}))
    call(stocked, "POST", f"{BASE}/lvln/refresh")
    later = replace(synthetic.LOANS, above=(*synthetic.LOANS.above[:2], ["As of 25-Nov-2026"]))
    assert (
        stage(stocked, "lvln", "SYNTHETIC lvln.xlsx", synthetic.workbook_bytes(later)).status == 200
    )
    got = call(stocked, "POST", f"{BASE}/lvln").json()
    assert (got["portfolio"]["as_of"], got["portfolio"]["positions"]) == ("2026-11-25", 5)
    assert listed(stocked)["lvln"] == {
        **absent("lvln", LVLN, "loan_index", fetchable=True),
        "as_of": "2026-11-25",
        "stored_at": NOW_TEXT,
        "positions": 5,
    }


def test_a_file_that_is_not_a_portfolio_is_refused_and_the_set_kept(stocked):
    path = stocked.store.root / "lvln.json"
    before = path.read_bytes()
    assert stage(stocked, "lvln", "notes.csv", NOT_A_PORTFOLIO).status == 200
    got = call(stocked, "POST", f"{BASE}/lvln")
    assert (got.status, got.json()) == (400, {"error": NO_TABLE})
    assert path.read_bytes() == before
    assert listed(stocked)["lvln"]["as_of"] == "2026-11-24"
    # The refused file has left staging: the next read has nothing to read.
    assert call(stocked, "POST", f"{BASE}/lvln").json() == {
        "error": "Choose the file or files to store first."
    }


def test_holdings_with_no_as_of_date_are_refused_and_the_set_kept(box):
    for name, raw in synthetic.pack_files().items():
        stage(box, "clo", name, raw)
    assert call(box, "POST", f"{BASE}/clo").status == 200
    assert stage(box, "clo", "SYNTHETIC holdings.csv", synthetic.holdings_csv()).status == 200
    got = call(box, "POST", f"{BASE}/clo")
    assert (got.status, got.json()) == (
        400,
        {
            "error": "CLO portfolio: the files state no as-of date, so they were not stored. A "
            "standing portfolio is kept only with its date; a CLO pack states it in its mandate "
            "file."
        },
    )
    assert listed(box)["clo"]["as_of"] == "2026-10-31"


def test_clearing_staging_removes_a_file_from_an_earlier_attempt(box):
    stage(box, "clo", "notes.csv", NOT_A_PORTFOLIO)
    assert call(box, "DELETE", f"{BASE}/clo/files").json() == {"cleared": True}
    for name, raw in synthetic.pack_files().items():
        stage(box, "clo", name, raw)
    assert call(box, "POST", f"{BASE}/clo").json()["portfolio"]["positions"] == 7


@pytest.mark.parametrize(
    ("name", "refusal"),
    [
        ("../h.csv", "has an empty, '.' or '..' part"),
        ("pack/h.csv", "must be a file name, without a folder"),
        ("C:\\h.csv", "starts with a drive letter"),
        ("..", "has an empty, '.' or '..' part"),
        (".h.csv", "must be a file name, without a folder"),
        ("h.pdf", "must be a .csv or .xlsx file"),
    ],
)
def test_an_unsafe_file_name_is_refused_and_nothing_is_written(box, name, refusal):
    got = stage(box, "clo", name, b"x")
    assert got.status == 400
    assert refusal in got.json()["error"]
    assert not standing_root(box.scheduler.layout).exists()


def test_a_staged_file_name_needs_exactly_one_name(box):
    assert call(box, "POST", f"{BASE}/clo/files", b"x").json() == {
        "error": "the request needs exactly one name"
    }


def test_a_link_in_staging_is_refused_and_not_followed(box, tmp_path):
    folder = standing_root(box.scheduler.layout) / "staging" / "clo"
    folder.mkdir(parents=True)
    outside = tmp_path / "outside.csv"
    outside.write_bytes(b"outside")
    os.symlink(outside, folder / "linked.csv")
    got = stage(box, "clo", "linked.csv", b"new")
    assert (got.status, got.json()) == (400, {"error": "'linked.csv' goes through a link"})
    assert outside.read_bytes() == b"outside"


def test_a_link_planted_among_the_staged_files_is_refused_when_they_are_read(box, tmp_path):
    for name, raw in synthetic.pack_files().items():
        stage(box, "clo", name, raw)
    outside = tmp_path / "outside.csv"
    outside.write_bytes(synthetic.holdings_csv())
    os.symlink(outside, standing_root(box.scheduler.layout) / "staging" / "clo" / "linked.csv")
    got = call(box, "POST", f"{BASE}/clo")
    assert (got.status, got.json()) == (
        400,
        {"error": "'linked.csv' is a link, not an uploaded file"},
    )
    assert listed(box)["clo"] == EMPTY[0]


def test_a_route_that_is_not_one_is_not_found(box):
    for method, path in (("POST", BASE), ("GET", f"{BASE}/lvln"), ("GET", f"{BASE}/ensure")):
        assert call(box, method, path).status == 404, (method, path)
    assert box.funds.paths == []


def test_a_linked_staging_folder_is_refused(box, tmp_path):
    (tmp_path / "elsewhere").mkdir()
    (standing_root(box.scheduler.layout) / "staging").mkdir(parents=True)
    os.symlink(tmp_path / "elsewhere", standing_root(box.scheduler.layout) / "staging" / "clo")
    got = stage(box, "clo", "h.csv", b"x")
    assert (got.status, got.json()) == (
        400,
        {"error": "the standing portfolios' folder is a link; nothing is written there"},
    )
    assert list((tmp_path / "elsewhere").iterdir()) == []


def test_a_file_over_twenty_megabytes_is_refused_from_its_declared_length(box):
    assert standing_portfolios.MAX_FILE == 20 * 1024 * 1024
    declared = {"Content-Length": str(20 * 1024 * 1024 + 1)}  # and no byte of it is sent
    got = call(box, "POST", f"{BASE}/clo/files?name=h.csv", None, declared)
    assert (got.status, got.json()) == (
        400,
        {"error": "a standing portfolio file is at most 20 MB"},
    )
    assert not standing_root(box.scheduler.layout).exists()


def test_an_upload_cut_short_leaves_nothing(box):
    got = call(box, "POST", f"{BASE}/clo/files?name=h.csv", b"ab", {"Content-Length": "5"})
    assert (got.status, got.json()) == (400, {"error": "the upload ended 3 bytes short of its 5"})
    staging = standing_root(box.scheduler.layout) / "staging"
    assert [path.name for path in staging.rglob("*")] == []


def test_no_more_than_four_files_and_a_replacement_is_not_one_more(box):
    assert standing_portfolios.MAX_FILES == 4
    for number in range(4):
        assert stage(box, "clo", f"{number}.csv", b"x").status == 200
    assert stage(box, "clo", "0.csv", b"xx").status == 200
    got = stage(box, "clo", "4.csv", b"x")
    assert (got.status, got.json()) == (400, {"error": "a standing portfolio is at most 4 files"})


def test_staged_files_count_toward_the_stores_ceiling(box, monkeypatch):
    monkeypatch.setattr(submissions, "MAX_STORE", 10)
    sid = submissions.new(box.scheduler.layout)
    submissions.add_file(box.scheduler.layout, sid, "a.txt", io.BytesIO(b"1234"), 4)
    assert stage(box, "clo", "one.csv", b"12345").status == 200  # 9 held
    assert stage(box, "lvln", "two.csv", b"12").json() == {
        "error": "the service's storage for uploads is full; try again later"
    }
    assert stage(box, "clo", "one.csv", b"123456").status == 200  # a replacement: 10 held


def test_the_staged_files_are_not_read_while_one_is_still_being_written(box):
    stage(box, "clo", "h.csv", b"x")
    submissions._PENDING["standing/clo"] = {".part-x": ("m.csv", 1)}
    try:
        for method, path in (("POST", f"{BASE}/clo"), ("DELETE", f"{BASE}/clo/files")):
            assert call(box, method, path).json() == {"error": "an upload is still in progress"}
    finally:
        submissions._PENDING.pop("standing/clo")


# --- The service's own checks ---------------------------------------------------------------------


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("POST", f"{BASE}/lvln/refresh"),
        ("POST", f"{BASE}/ensure"),
        ("POST", f"{BASE}/clo/files?name=h.csv"),
        ("POST", f"{BASE}/clo"),
        ("DELETE", f"{BASE}/clo/files"),
    ],
)
@pytest.mark.parametrize("origin", [None, "http://evil.example", f"https://{HOST}"])
def test_a_change_from_another_page_or_none_is_refused_before_anything_happens(
    box, offline, method, path, origin
):
    got = call(box, method, path, b"x", {"Origin": origin})
    assert (got.status, got.json()) == (
        403,
        {"error": "the request did not come from the service's own page"},
    )
    assert box.funds.paths == []
    assert not standing_root(box.scheduler.layout).exists()


def test_another_site_cannot_read_the_listing(box):
    got = call(box, "GET", BASE, None, {"Origin": None, "Sec-Fetch-Site": "cross-site"})
    assert (got.status, got.json()) == (403, {"error": "the request came from another site"})


def test_the_production_desk_fetches_on_the_pinned_connection_and_never_queues():
    desk = standing_portfolios.Desk()
    assert desk.wiring is None
    busy = pytest.raises(standing_portfolios.Busy, match="CLO portfolio is already being replaced")
    with desk.held("clo"), busy, desk.held("clo"):
        pass
    with desk.held("clo"):  # released again
        pass
