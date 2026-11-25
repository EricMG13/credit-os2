"""Fetching a standing reference portfolio (`deploy_workflow.reference_fetch`), on an injected
connector, resolver and clock: nothing here opens a socket, sleeps or allocates a large body.

Every workbook is SYNTHETIC (tools/synthetic_reference_portfolios.py), in an ASSUMED shape. No
real fund file or server answer was seen, so these tests prove the fetch's rules and what a
failure leaves in the store, not that the fund's site is read. Expected values are written by
hand.
"""

from __future__ import annotations

import copy
import io
import zipfile
from collections.abc import Iterable, Mapping
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta, timezone
from pathlib import Path

import pytest

from deploy_workflow import reference_fetch as rf
from deploy_workflow import reference_portfolios as rp
from deploy_workflow.research.webfetch import ConnectionTarget
from deploy_workflow.signal import fetch as signal_fetch
from tools import synthetic_reference_portfolios as synth

EARLIER = datetime(2026, 11, 24, 18, 0, tzinfo=UTC)
NOW = datetime(2026, 11, 25, 9, 30, tzinfo=UTC)
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
LVLN_PATH = "/library-content/products/fund-data/etfs/us/holdings-daily-us-en-lvln.xlsx"
JNK_PATH = "/library-content/products/fund-data/etfs/us/holdings-daily-us-en-jnk.xlsx"
NAME = "Loan index fund (LVLN)"
FILE = "holdings-daily-us-en-lvln.xlsx"
# synth.LOANS: "Holdings: As of 24-Nov-2026", five holdings. synth.BONDS: 23 Nov 2026, two.
LOANS_AS_OF = date(2026, 11, 24)
LOANS = synth.workbook_bytes(synth.LOANS)


class Reply:
    def __init__(self, status: int, body: bytes = b"", headers: Mapping[str, str] | None = None):
        self.status = status
        self.headers = {name.lower(): value for name, value in (headers or {}).items()}
        self.body = body
        self.consumed = 0

    def getheader(self, name: str, /) -> str | None:
        return self.headers.get(name.lower())

    def read(self, amt: int) -> bytes:
        chunk = self.body[self.consumed : self.consumed + amt]
        self.consumed += len(chunk)
        return chunk


class Wire:
    """A connector that answers each request from a script, in order, and records what it saw."""

    def __init__(self, *replies: Reply | Exception) -> None:
        self.script = list(replies)
        self.targets: list[ConnectionTarget] = []
        self.requests: list[tuple[str, dict[str, str]]] = []
        self.closed = 0

    def __call__(self, target: ConnectionTarget) -> Wire:
        self.targets.append(target)
        return self

    def request(self, method: str, url: str, *, headers: Mapping[str, str]) -> None:
        assert method == "GET"
        self.requests.append((url, dict(headers)))

    def getresponse(self) -> Reply:
        step = self.script.pop(0)
        if isinstance(step, Exception):
            raise step
        return step

    def close(self) -> None:
        self.closed += 1


def public(host: str) -> Iterable[str]:
    return ["10.0.0.1"] if host == "internal.example" else ["93.184.216.34"]


def wired(wire: Wire, **limits: int) -> rf.Wiring:
    return rf.Wiring(connect=wire, resolve=public, clock=lambda: 1000.0, **limits)


def workbook(body: bytes = LOANS, content_type: str = XLSX) -> Reply:
    return Reply(200, body, {"Content-Type": content_type, "Content-Length": str(len(body))})


def redirect(location: str) -> Reply:
    return Reply(302, b"", {"Location": location})


def as_of(day: str) -> synth.Layout:
    """LOANS stating another as-of date."""
    above = (*synth.LOANS.above[:2], ["Holdings:", f"As of {day}"], None)
    return replace(synth.LOANS, above=above)


def without(*names: str) -> synth.Layout:
    """LOANS without the columns headed `names`."""
    order = [i for i, name in enumerate(synth.LOANS.header) if name not in names]
    return synth.rearranged(synth.LOANS, order, {})


def a_zip(name: str, content: bytes) -> bytes:
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(name, content)
    return stream.getvalue()


@pytest.fixture
def store(tmp_path: Path) -> rp.Store:
    return rp.Store(tmp_path / "standing")


@pytest.fixture
def stocked(store: rp.Store) -> rp.Store:
    """A store holding the LOANS set of 24 November, stored the evening before NOW."""
    done = rf.refresh(store, "lvln", now=EARLIER, wiring=wired(Wire(workbook())))
    assert done.outcome == "stored"
    return store


# --- Success -------------------------------------------------------------------------------------


def test_a_fetched_workbook_is_stored_with_the_files_date_and_the_fetch_time(store):
    wire = Wire(workbook())
    done = rf.refresh(store, "lvln", now=NOW, wiring=wired(wire))
    assert done == rf.Refreshed(
        "lvln", "stored", as_of=LOANS_AS_OF, stored_at=NOW, message=None, file_as_of=LOANS_AS_OF
    )
    assert not done.changed_file
    kept = store.load("lvln")
    assert (kept.key, kept.kind, kept.as_of, kept.stored_at) == (
        "lvln",
        "loan_index",
        LOANS_AS_OF,
        NOW,
    )
    assert len(kept.positions) == 5
    assert kept.positions[0].borrower == "Aster Fictional Co"
    assert [source.name for source in kept.sources] == [FILE]
    assert store.failure("lvln") is None


def test_the_request_goes_to_the_standing_address_under_the_fetch_rules(store):
    wire = Wire(workbook())
    rf.refresh(store, "lvln", now=NOW, wiring=wired(wire))
    [target] = wire.targets
    assert (target.host, target.ip, target.port) == ("www.ssga.com", "93.184.216.34", 443)
    assert target.timeout == 10  # seconds per socket operation
    assert target.deadline == 1060.0  # the clock's 1000 and 60 seconds for the whole fetch
    [(path, headers)] = wire.requests
    assert path == LVLN_PATH
    assert headers["Host"] == "www.ssga.com"
    assert headers["Accept-Encoding"] == "identity"
    assert "If-None-Match" not in headers and "If-Modified-Since" not in headers
    assert wire.closed == 1


def test_the_high_yield_fund_is_fetched_from_its_own_address(store):
    wire = Wire(workbook(synth.workbook_bytes(synth.BONDS), "application/octet-stream"))
    done = rf.refresh(store, "jnk", now=NOW, wiring=wired(wire))
    assert (done.outcome, done.as_of) == ("stored", date(2026, 11, 23))
    assert [path for path, _ in wire.requests] == [JNK_PATH]
    assert len(store.load("jnk").positions) == 2
    assert store.load("jnk").positions[0].asset_type == "bond"


def test_a_content_type_with_a_parameter_and_other_case_is_accepted(store):
    reply = workbook(content_type="Application/Octet-Stream; charset=binary")
    assert rf.refresh(store, "lvln", now=NOW, wiring=wired(Wire(reply))).outcome == "stored"


def test_a_redirect_to_another_https_xlsx_address_is_followed(store):
    wire = Wire(redirect("https://files.example.org/funds/lvln-holdings.XLSX"), workbook())
    done = rf.refresh(store, "lvln", now=NOW, wiring=wired(wire))
    assert done.outcome == "stored"
    assert [target.host for target in wire.targets] == ["www.ssga.com", "files.example.org"]
    # The stored source is named after the standing address, not the redirect's.
    assert [source.name for source in store.load("lvln").sources] == [FILE]


# --- Failures: the previous set stays, the failure is recorded -----------------------------------

NOT_WORKBOOK = f"{NAME}: the file received is not an Excel workbook."
FAILURES = {
    "connection error": (
        OSError("connection refused"),
        f"{NAME}: the holdings file could not be fetched (fetch failed: connection refused).",
    ),
    "HTTP 404": (
        Reply(404, b"<html>Not found</html>", {"Content-Type": "text/html"}),
        f"{NAME}: the holdings file could not be fetched (server answered HTTP 404).",
    ),
    "HTTP 200 text/html": (
        workbook(b"<html>Please accept our terms</html>", "text/html; charset=utf-8"),
        f"{NAME}: the server sent 'text/html', not an Excel workbook.",
    ),
    "HTML sent as a workbook": (workbook(b"<html>Please accept our terms</html>"), NOT_WORKBOOK),
    "no content type": (
        Reply(200, LOANS),
        f"{NAME}: the server sent no content type, not an Excel workbook.",
    ),
    "truncated body": (
        Reply(200, LOANS[:100], {"Content-Type": XLSX, "Content-Length": "5000"}),
        (
            f"{NAME}: the holdings file could not be fetched "
            "(the response ended early (100 of 5000 bytes))."
        ),
    ),
    "declared larger than the ceiling": (
        # 8 MB is 8,388,608 bytes; one more is declared and none is read.
        Reply(200, LOANS, {"Content-Type": XLSX, "Content-Length": "8388609"}),
        f"{NAME}: the holdings file could not be fetched (holdings file is larger than 8 MB).",
    ),
    "content encoding": (
        Reply(200, LOANS, {"Content-Type": XLSX, "Content-Encoding": "gzip"}),
        (
            f"{NAME}: the holdings file could not be fetched "
            "(holdings file uses a content encoding)."
        ),
    ),
    "empty body": (workbook(b""), NOT_WORKBOOK),
    "ZIP signature and nothing else": (workbook(b"PK\x03\x04 not an archive"), NOT_WORKBOOK),
    "a ZIP that is not a workbook": (
        workbook(a_zip("notes.txt", b"SYNTHETIC text")),
        f"{NAME}: {FILE} cannot be read as an Excel workbook.",
    ),
    "the header lost the name column": (
        # LOANS has four rows above its header, so the header is row 5.
        workbook(synth.workbook_bytes(without("Name"))),
        f"{NAME}: {FILE}: the header row (row 5) has no column for the holding's name.",
    ),
    "the header lost weight, par and market value": (
        workbook(synth.workbook_bytes(without("Weight", "Par Value", "Market Value"))),
        (
            f"{NAME}: {FILE}: the header row (row 5) has no column for a weight, par or market "
            "value."
        ),
    ),
    "a header and no holdings": (
        workbook(synth.workbook_bytes(replace(synth.LOANS, rows=(), below=()))),
        f"{NAME}: {FILE}: the holdings table has no rows.",
    ),
    "no as-of date": (
        workbook(synth.workbook_bytes(replace(synth.LOANS, above=synth.LOANS.above[:2]))),
        f"{NAME}: the file states no as-of date.",
    ),
}


@pytest.mark.parametrize("case", FAILURES)
def test_a_failure_keeps_the_previous_set_and_is_recorded(case, stocked, tmp_path):
    step, message = copy.copy(FAILURES[case][0]), FAILURES[case][1]  # a reply is read once
    path = tmp_path / "standing" / "lvln.json"
    before = path.read_bytes()
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(step)))
    assert done == rf.Refreshed(
        "lvln", "failed", as_of=LOANS_AS_OF, stored_at=EARLIER, message=message
    )
    assert path.read_bytes() == before
    assert stocked.failure("lvln") == rp.Failure(message, NOW)
    assert "\n" not in message and "Traceback" not in message and "CP-" not in message


@pytest.mark.parametrize("case", FAILURES)
def test_a_failure_with_no_previous_set_stores_nothing(case, store, tmp_path):
    step, message = copy.copy(FAILURES[case][0]), FAILURES[case][1]  # a reply is read once
    done = rf.refresh(store, "lvln", now=NOW, wiring=wired(Wire(step)))
    assert done == rf.Refreshed("lvln", "failed", message=message)
    assert not (tmp_path / "standing" / "lvln.json").exists()
    with pytest.raises(rp.NotStored):
        store.load("lvln")
    listed = {item.key: item for item in rp.list_portfolios(store)}["lvln"]
    assert (listed.as_of, listed.stored_at, listed.positions) == (None, None, None)
    assert listed.failure == rp.Failure(message, NOW)


def test_a_declared_length_over_the_ceiling_is_refused_before_the_body_is_read(store):
    reply = Reply(200, LOANS, {"Content-Type": XLSX, "Content-Length": "8388609"})
    assert rf.refresh(store, "lvln", now=NOW, wiring=wired(Wire(reply))).outcome == "failed"
    assert reply.consumed == 0


def test_a_body_over_the_ceiling_is_refused_one_byte_past_it(stocked):
    reply = Reply(200, LOANS, {"Content-Type": XLSX})  # no declared length
    assert len(LOANS) > 1000
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(reply), max_bytes=1000))
    assert done.message == (
        f"{NAME}: the holdings file could not be fetched (holdings file is larger than 1000 bytes)."
    )
    assert reply.consumed == 1001
    assert done.as_of == LOANS_AS_OF


def test_an_archive_declaring_more_than_the_unpacked_limit_is_not_read(stocked):
    body = a_zip("xl/workbook.xml", b"0" * 2000)  # 2,000 bytes unpacked, a few dozen packed
    assert len(body) < 500
    done = rf.refresh(
        stocked, "lvln", now=NOW, wiring=wired(Wire(workbook(body)), max_expanded_bytes=1999)
    )
    assert done.message == f"{NAME}: the workbook received is too large to read once unpacked."
    assert stocked.load("lvln").stored_at == EARLIER


def test_the_limits_in_force_by_default():
    assert rf.Wiring().max_bytes == rf.MAX_BYTES == 8 * 1024 * 1024
    assert rf.Wiring().max_expanded_bytes == rf.MAX_EXPANDED_BYTES == 64 * 1024 * 1024
    assert rf.TOTAL_SECONDS == 60
    assert rf.CONTENT_TYPES == {XLSX, "application/octet-stream"}
    # Signal's own feed limits are as they were.
    assert (signal_fetch.MAX_BYTES, signal_fetch.TOTAL_SECONDS) == (2 * 1024 * 1024, 10)
    assert signal_fetch.Rules() == signal_fetch.Rules(
        "feed", signal_fetch.ACCEPT, signal_fetch.USER_AGENT, 10, 2 * 1024 * 1024
    )


def test_a_fetch_past_its_total_deadline_is_a_failure(stocked):
    ticks = iter([1000.0, 1000.0, 1000.0, 1061.0])  # 61 seconds by the time the answer arrives
    wiring = rf.Wiring(connect=Wire(workbook()), resolve=public, clock=lambda: next(ticks))
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wiring)
    assert done.message == (
        f"{NAME}: the holdings file could not be fetched "
        "(holdings file took longer than 60 seconds)."
    )
    assert done.as_of == LOANS_AS_OF


def test_an_address_that_is_not_public_is_refused_without_a_connection(stocked):
    wire = Wire(workbook())
    wiring = rf.Wiring(connect=wire, resolve=lambda host: ["127.0.0.1"], clock=lambda: 0.0)
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wiring)
    assert done.message == (
        f"{NAME}: the holdings file could not be fetched "
        "(www.ssga.com resolves to 127.0.0.1, which is not a public address)."
    )
    assert wire.targets == []


REDIRECTS = {
    "not https": (
        "http://www.ssga.com" + LVLN_PATH,
        "the holdings file could not be fetched (only https addresses are fetched)",
        1,
    ),
    "a non-public host": (
        "https://internal.example/holdings.xlsx",
        (
            "the holdings file could not be fetched "
            "(internal.example resolves to 10.0.0.1, which is not a public address)"
        ),
        1,
    ),
    "an IP literal": (
        "https://93.184.216.34/holdings.xlsx",
        (
            "the holdings file could not be fetched "
            "(holdings file address must use a plain host name)"
        ),
        1,
    ),
    "not an .xlsx path": (
        "https://www.ssga.com/us/en/error-page.html",
        "the address led to a page that is not an .xlsx file",
        2,
    ),
    ".xlsx only in the query": (
        "https://www.ssga.com/download?file=holdings.xlsx",
        "the address led to a page that is not an .xlsx file",
        2,
    ),
}


@pytest.mark.parametrize("case", REDIRECTS)
def test_a_redirect_to_a_target_that_is_not_allowed_is_refused(case, stocked):
    location, reason, connections = REDIRECTS[case]
    wire = Wire(redirect(location), workbook())  # the target would answer with a good workbook
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(wire))
    assert (done.outcome, done.message) == ("failed", f"{NAME}: {reason}.")
    assert len(wire.targets) == connections
    assert stocked.load("lvln").stored_at == EARLIER


def test_text_echoed_from_the_answer_is_made_printable_and_short(store):
    sent = "text/\x1b[31mhtml\u202e" + "x" * 500
    done = rf.refresh(store, "lvln", now=NOW, wiring=wired(Wire(workbook(content_type=sent))))
    # 80 characters of the type are echoed: "text/", "?[31mhtml?" and 65 of the x's, lower-cased.
    assert done.message == (
        f"{NAME}: the server sent 'text/?[31mhtml?{'x' * 65}', not an Excel workbook."
    )
    wire = Wire(OSError("bad\x00thing\r\nSet-Cookie: " + "y" * 900))
    done = rf.refresh(store, "lvln", now=NOW, wiring=wired(wire))
    assert done.message is not None
    assert len(done.message) <= 301 and done.message.isprintable() and done.message.isascii()


# --- An older file, a changed file ---------------------------------------------------------------


def test_an_older_file_does_not_replace_a_newer_set(stocked, tmp_path):
    path = tmp_path / "standing" / "lvln.json"
    before = path.read_bytes()
    older = workbook(synth.workbook_bytes(as_of("20-Nov-2026")))
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(older)))
    assert done == rf.Refreshed(
        "lvln",
        "kept",
        as_of=LOANS_AS_OF,
        stored_at=EARLIER,
        message=(
            f"{NAME}: the file fetched is as of 20 November 2026, older than the stored set of "
            "24 November 2026, which is kept."
        ),
        file_as_of=date(2026, 11, 20),
    )
    assert path.read_bytes() == before
    assert stocked.failure("lvln") is None  # an older file is not a failed refresh


@pytest.mark.parametrize(
    ("day", "expected"), [("24-Nov-2026", LOANS_AS_OF), ("25-Nov-2026", date(2026, 11, 25))]
)
def test_a_file_of_the_same_or_a_later_date_replaces_the_set_and_clears_a_failure(
    day, expected, stocked
):
    rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(Reply(404))))
    assert stocked.failure("lvln") is not None
    later = NOW + timedelta(hours=1)
    body = workbook(synth.workbook_bytes(as_of(day)))
    done = rf.refresh(stocked, "lvln", now=later, wiring=wired(Wire(body)))
    assert (done.outcome, done.as_of, done.stored_at) == ("stored", expected, later)
    assert stocked.load("lvln").stored_at == later
    assert stocked.failure("lvln") is None


def test_a_file_whose_columns_changed_is_stored_and_reported(stocked):
    fewer = workbook(synth.workbook_bytes(without("Sector", "Coupon")))
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(fewer)))
    assert (done.outcome, done.changed_file) == ("stored", True)
    assert (done.columns_gained, done.columns_lost) == ((), ("coupon", "sector"))
    assert {"coupon", "sector"} <= set(stocked.load("lvln").columns_missing)
    # The full file again: the two fields are back.
    again = rf.refresh(
        stocked, "lvln", now=NOW + timedelta(hours=1), wiring=wired(Wire(workbook()))
    )
    assert (again.columns_gained, again.columns_lost) == (("coupon", "sector"), ())
    assert again.changed_file


def test_columns_in_another_order_under_the_same_fields_are_not_a_changed_file(stocked):
    order = list(reversed(range(len(synth.LOANS.header))))
    moved = workbook(synth.workbook_bytes(synth.rearranged(synth.LOANS, order, {}, lower=2)))
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(moved)))
    assert (done.outcome, done.changed_file) == ("stored", False)


def test_a_stored_file_that_cannot_be_read_is_replaced_by_a_good_fetch(stocked, tmp_path):
    (tmp_path / "standing" / "lvln.json").write_text("{not json", encoding="utf-8")
    done = rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(workbook())))
    assert (done.outcome, done.columns_gained, done.columns_lost) == ("stored", (), ())
    assert stocked.load("lvln").stored_at == NOW


# --- Keys and times ------------------------------------------------------------------------------


@pytest.mark.parametrize("key", ["clo", "custom", "LVLN", "", "https://evil.example/x.xlsx"])
def test_a_key_that_is_not_fetched_is_refused_without_a_connection(key, store, tmp_path):
    wire = Wire(workbook())
    with pytest.raises(rf.NotFetchable, match="No holdings file is fetched for"):
        rf.refresh(store, key, now=NOW, wiring=wired(wire))
    assert wire.targets == []
    assert not (tmp_path / "standing").exists()  # nothing recorded either


def test_only_the_two_funds_have_an_address_and_both_are_https_xlsx():
    fetched = {key: item.url for key, item in rp.STANDING.items() if item.url is not None}
    assert fetched == {
        "lvln": "https://www.ssga.com" + LVLN_PATH,
        "jnk": "https://www.ssga.com" + JNK_PATH,
    }


@pytest.mark.parametrize(
    "now", [datetime(2026, 11, 25, 9, 30), datetime(2026, 11, 25, 9, 30, tzinfo=timezone.min)]
)
def test_a_fetch_time_not_in_utc_is_a_callers_error_before_any_connection(now, store):
    wire = Wire(workbook())
    with pytest.raises(ValueError, match="UTC"):
        rf.refresh(store, "lvln", now=now, wiring=wired(wire))
    assert wire.targets == []


# --- ensure --------------------------------------------------------------------------------------


def test_ensure_returns_the_stored_set_without_fetching(stocked):
    wire = Wire(workbook())
    a_month_on = NOW + timedelta(days=30)
    got = rf.ensure(stocked, "lvln", now=a_month_on, wiring=wired(wire))
    assert got.portfolio == stocked.load("lvln")
    assert (got.portfolio.as_of, got.portfolio.stored_at) == (LOANS_AS_OF, EARLIER)
    assert (got.message, got.refreshed) == (None, None)
    assert wire.targets == []


def test_ensure_does_not_fetch_over_a_stored_set_with_a_recorded_failure(stocked):
    rf.refresh(stocked, "lvln", now=NOW, wiring=wired(Wire(Reply(404))))
    wire = Wire(workbook())
    got = rf.ensure(stocked, "lvln", now=NOW, wiring=wired(wire))
    assert got.portfolio is not None and got.portfolio.stored_at == EARLIER
    assert wire.targets == []
    assert stocked.failure("lvln") is not None  # still listed beside the set


def test_ensure_fetches_once_when_no_set_is_stored(store):
    wire = Wire(workbook())
    got = rf.ensure(store, "lvln", now=NOW, wiring=wired(wire))
    assert len(wire.targets) == 1
    assert got.portfolio == store.load("lvln")
    assert got.refreshed is not None and got.refreshed.outcome == "stored"
    assert (got.portfolio.as_of, got.portfolio.stored_at) == (LOANS_AS_OF, NOW)
    # The second call finds the set.
    rf.ensure(store, "lvln", now=NOW + timedelta(hours=1), wiring=wired(wire))
    assert len(wire.targets) == 1


def test_ensure_reports_a_failed_fetch_and_makes_one_attempt(store):
    wire = Wire(Reply(503), workbook())
    got = rf.ensure(store, "lvln", now=NOW, wiring=wired(wire))
    message = f"{NAME}: the holdings file could not be fetched (server answered HTTP 503)."
    assert (got.portfolio, got.message) == (None, message)
    assert got.refreshed == rf.Refreshed("lvln", "failed", message=message)
    assert len(wire.targets) == 1  # no retry
    assert store.failure("lvln") == rp.Failure(message, NOW)


@pytest.mark.parametrize(
    ("key", "message"),
    [("clo", "CLO portfolio: not supplied."), ("custom", "custom: not supplied.")],
)
def test_ensure_reports_a_key_with_no_address_and_no_set_as_not_supplied(key, message, store):
    wire = Wire(workbook())
    got = rf.ensure(store, key, now=NOW, wiring=wired(wire))
    assert got == rf.Ensured(key, None, message, None)
    assert wire.targets == []
    assert store.failure(key) is None


def test_ensure_returns_a_supplied_set_for_a_key_with_no_address(store):
    pack = rp.read_clo_pack(synth.pack_files(), stored_at=EARLIER)
    store.save(pack)
    wire = Wire(workbook())
    got = rf.ensure(store, "clo", now=NOW, wiring=wired(wire))
    assert got.portfolio == pack and wire.targets == []


def test_ensure_reports_a_stored_file_that_cannot_be_read_and_does_not_fetch(stocked, tmp_path):
    (tmp_path / "standing" / "lvln.json").write_text("{not json", encoding="utf-8")
    wire = Wire(workbook())
    got = rf.ensure(stocked, "lvln", now=NOW, wiring=wired(wire))
    assert got.portfolio is None and got.refreshed is None
    assert got.message == (
        "The stored portfolio 'lvln' cannot be read: its file is damaged or is not a stored "
        "portfolio."
    )
    assert wire.targets == []


def test_importing_the_module_and_building_its_defaults_opens_nothing(monkeypatch):
    import importlib
    import socket

    def refuse(*args: object, **kwargs: object) -> None:
        raise AssertionError("the network was touched")

    monkeypatch.setattr(socket, "getaddrinfo", refuse)
    monkeypatch.setattr(socket, "create_connection", refuse)
    importlib.reload(rf)
    assert rf.Wiring().connect is None
