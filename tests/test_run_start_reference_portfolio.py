"""The start page's optional comparison portfolio: a reference portfolio an analyst supplies for
one run. Every file, name and number is SYNTHETIC (tools/synthetic_reference_portfolios.py); the
expected values are written by hand from those fixtures. No provider is called: the scheduler
runs over the fake launcher and nothing is launched here.
"""

from __future__ import annotations

import io
import json
import os
import urllib.parse
from collections.abc import Iterator
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import pytest
from inbox_fixtures import CONTEXT, settings
from test_run_start_service import (  # noqa: F401 - fixtures
    Service,
    service_factory,
    svc,
)

from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox.runs import load_all
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.run_start import reference_portfolio as rp
from deploy_workflow.run_start import submissions
from deploy_workflow.run_start.submissions import Refused
from tools import synthetic_reference_portfolios as synthetic

pytest_plugins = ["inbox_fixtures"]

SUBMITTED_AT = datetime(2026, 11, 25, 9, 30, 0, tzinfo=UTC)
HOLDINGS = "SYNTHETIC holdings.csv"
CONSTRAINTS = "SYNTHETIC constraints.csv"
MANDATE = "SYNTHETIC mandate.csv"
WORKBOOK = "SYNTHETIC loans.xlsx"
NOT_A_PORTFOLIO = b"This is a note, not a holdings table.\n"
NO_TABLE = (
    "No holdings table was found. notes.csv has no header row naming a holding and its weight, "
    "par or market value."
)
# The pack's holdings header has no CUSIP, ISIN, SEDOL, other identifier or coupon column.
PACK_NOT_FOUND = ["CUSIP", "ISIN", "SEDOL", "Other identifier", "Coupon"]


def answers_for() -> submissions.Answers:
    context = json.loads(json.dumps(CONTEXT))
    context["run"]["pathway"] = "credit_snapshot"
    context["run"]["as_of"] = "2026-11-09"
    context["identity"]["issuer_id"] = "acme"
    context["identity"]["issuer_name"] = "Acme Corp"
    return submissions.validated(
        {
            "context": context,
            "modules": [],
            "max_turns": 32,
            "level": "basic",
            "model": "gpt",
            "effort": "balanced",
            "submitted_by": "Ana L",
        }
    )


@pytest.fixture
def scheduler(root: Path) -> Iterator[Scheduler]:
    made = Scheduler(settings(root), now=lambda: SUBMITTED_AT)
    yield made
    made.close()


@pytest.fixture
def layout(scheduler: Scheduler) -> Layout:
    return scheduler.layout


def draft(layout: Layout) -> str:
    """A submission holding one source document."""
    sid = submissions.new(layout)
    submissions.add_file(layout, sid, "a.txt", io.BytesIO(b"Net sales were 100."), 19)
    return sid


def add(layout: Layout, sid: str, name: str, raw: bytes) -> str:
    return rp.add_file(layout, sid, name, io.BytesIO(raw), len(raw))


def add_pack(layout: Layout, sid: str) -> None:
    for name, raw in synthetic.pack_files().items():
        add(layout, sid, name, raw)


def reference_folder(layout: Layout, sid: str) -> Path:
    return layout.uploads / sid / "reference_portfolio"


# --- Reading what was supplied ----------------------------------------------------------------


def test_a_submission_without_a_portfolio_reads_as_none(layout):
    sid = draft(layout)
    assert rp.reading(layout, sid) == {
        "name": "",
        "holds": "",
        "files": [],
        "portfolio": None,
        "error": "",
    }


def test_a_pack_of_three_csv_files_is_read_with_its_date_positions_and_limits(layout):
    sid = draft(layout)
    add_pack(layout, sid)
    got = rp.name_it(layout, sid, "  Example comparison fund ", "loans")
    assert got["error"] == ""
    assert (got["name"], got["holds"]) == ("Example comparison fund", "loans")
    assert got["files"] == [CONSTRAINTS, HOLDINGS, MANDATE]
    shown = got["portfolio"]
    assert shown["name"] == "Example comparison fund"
    assert shown["kind"] == "custom"
    assert shown["as_of"] == "2026-10-31"  # the mandate's `As of Date`, 31-Oct-2026
    assert shown["positions"] == 7
    assert shown["unpriced"] == 1  # Elm Invented Ltd (row 7) has no price
    assert shown["limits"] == 3
    assert shown["not_found"] == PACK_NOT_FOUND
    assert shown["found"][:3] == ["Borrower", "Instrument", "FIGI"]
    assert (
        "No price or market value, kept and marked unpriced: 1 position (row 7)."
        in (shown["findings"])
    )
    assert rp.reading(layout, sid) == got


def test_an_index_holdings_workbook_is_read_by_its_header(layout):
    sid = draft(layout)
    add(layout, sid, WORKBOOK, synthetic.workbook_bytes(synthetic.LOANS))
    shown = rp.name_it(layout, sid, "Example loan fund", "")["portfolio"]
    assert shown["as_of"] == "2026-11-24"  # `As of 24-Nov-2026` beside `Holdings:`
    assert shown["positions"] == 5
    assert shown["unpriced"] == 1  # Cedar Example LLC has neither price nor market value
    assert shown["limits"] == 0


def test_holdings_alone_state_no_date_and_say_so(layout):
    sid = draft(layout)
    add(layout, sid, HOLDINGS, synthetic.holdings_csv())
    shown = rp.name_it(layout, sid, "Holdings only", "bonds")["portfolio"]
    assert shown["as_of"] is None
    assert shown["limits"] == 0
    assert shown["findings"][:2] == [
        "The files state no as-of date that could be read.",
        "No constraints file was supplied: the portfolio has no limits.",
    ]


def test_files_without_a_name_ask_for_the_name(layout):
    sid = draft(layout)
    add_pack(layout, sid)
    got = rp.reading(layout, sid)
    assert got["portfolio"] is None
    assert got["error"] == "Give the comparison portfolio a name."


def test_a_file_that_is_not_a_portfolio_is_refused_in_reader_words(layout):
    sid = draft(layout)
    add(layout, sid, "notes.csv", NOT_A_PORTFOLIO)
    got = rp.name_it(layout, sid, "Not a portfolio", "")
    assert got["portfolio"] is None
    assert got["error"] == NO_TABLE
    assert got["files"] == ["notes.csv"]


def test_bytes_that_are_not_a_workbook_are_refused_in_reader_words(layout):
    sid = draft(layout)
    add(layout, sid, "holdings.xlsx", b"not a workbook")
    got = rp.name_it(layout, sid, "Broken workbook", "")
    assert got["portfolio"] is None
    assert got["error"] == (
        "No holdings table was found. holdings.xlsx cannot be read as an Excel workbook."
    )


def test_a_parser_failure_of_any_kind_is_a_refusal_not_a_service_failure(layout, monkeypatch):
    def broken(*_: object, **__: object) -> None:
        raise RuntimeError("an internal detail")

    monkeypatch.setattr(rp.portfolios, "read_portfolio_files", broken)
    sid = draft(layout)
    add(layout, sid, HOLDINGS, synthetic.holdings_csv())
    got = rp.name_it(layout, sid, "Example", "")
    assert got["error"] == "The files could not be read as a portfolio's holdings."
    assert "internal" not in json.dumps(got)


# --- Names ------------------------------------------------------------------------------------


@pytest.mark.parametrize("name", ["", "   ", "x" * 81, "two\nlines", "tab\there", "bell\x07"])
def test_a_bad_portfolio_name_is_refused(layout, name):
    sid = draft(layout)
    with pytest.raises(Refused, match="Give the comparison portfolio a name of at most 80"):
        rp.name_it(layout, sid, name, "")
    assert rp.reading(layout, sid)["name"] == ""


def test_a_name_of_eighty_characters_is_kept(layout):
    sid = draft(layout)
    assert rp.name_it(layout, sid, "n" * 80, "")["name"] == "n" * 80


@pytest.mark.parametrize("holds", ["loan", "equity", None, 3])
def test_what_it_holds_is_loans_bonds_or_not_stated(layout, holds):
    sid = draft(layout)
    with pytest.raises(Refused, match="loans, bonds or left unstated"):
        rp.name_it(layout, sid, "Example", holds)


@pytest.mark.parametrize(
    "name",
    ["../holdings.csv", "pack/holdings.csv", "C:\\holdings.csv", "..", "", ".holdings.csv"],
)
def test_an_unsafe_file_name_is_refused_and_nothing_is_written(layout, name):
    sid = draft(layout)
    with pytest.raises(Refused):
        add(layout, sid, name, b"x")
    assert not reference_folder(layout, sid).exists()
    assert sorted(p.name for p in (layout.uploads / sid).iterdir()) == ["files"]


@pytest.mark.parametrize("name", ["holdings.pdf", "holdings.xls", "holdings", "holdings.csv.exe"])
def test_only_csv_and_xlsx_files_are_accepted(layout, name):
    sid = draft(layout)
    with pytest.raises(Refused, match=r"must be a \.csv or \.xlsx file"):
        add(layout, sid, name, b"x")


# --- Links, limits and the seal ---------------------------------------------------------------


def test_a_link_where_the_file_would_go_is_refused(layout, tmp_path):
    sid = draft(layout)
    add(layout, sid, HOLDINGS, synthetic.holdings_csv())
    outside = tmp_path / "outside.csv"
    outside.write_bytes(b"outside")
    planted = reference_folder(layout, sid) / "linked.csv"
    os.symlink(outside, planted)
    with pytest.raises(Refused, match="link"):
        add(layout, sid, "linked.csv", b"new")
    assert outside.read_bytes() == b"outside"
    with pytest.raises(Refused, match="link"):
        rp.reading(layout, sid)


def test_a_linked_portfolio_folder_is_an_unknown_submission(layout, tmp_path):
    sid = draft(layout)
    (tmp_path / "elsewhere").mkdir()
    os.symlink(tmp_path / "elsewhere", reference_folder(layout, sid))
    with pytest.raises(Refused, match="unknown submission"):
        add(layout, sid, HOLDINGS, b"x")
    assert list((tmp_path / "elsewhere").iterdir()) == []


def test_a_file_over_the_ceiling_is_refused_from_its_declared_length(layout):
    assert rp.MAX_FILE == 20 * 1024 * 1024
    sid = draft(layout)
    with pytest.raises(Refused, match="at most 20 MB"):
        rp.add_file(layout, sid, HOLDINGS, io.BytesIO(b""), rp.MAX_FILE + 1)
    assert not reference_folder(layout, sid).exists()


def test_an_upload_cut_short_leaves_nothing(layout):
    sid = draft(layout)
    with pytest.raises(Refused, match="ended 3 bytes short"):
        rp.add_file(layout, sid, HOLDINGS, io.BytesIO(b"ab"), 5)
    assert rp.reading(layout, sid)["files"] == []
    assert sorted(p.name for p in (layout.uploads / sid).iterdir()) == ["files"]


def test_no_more_files_than_the_cap_and_a_replacement_is_not_one_more(layout, monkeypatch):
    assert rp.MAX_FILES == 4
    monkeypatch.setattr(rp, "MAX_FILES", 2)
    sid = draft(layout)
    add(layout, sid, "one.csv", b"1")
    add(layout, sid, "two.csv", b"2")
    add(layout, sid, "two.csv", b"22")
    with pytest.raises(Refused, match="at most 2 files"):
        add(layout, sid, "three.csv", b"3")
    assert rp.reading(layout, sid)["files"] == ["one.csv", "two.csv"]


def test_portfolio_files_count_toward_the_stores_ceiling_both_ways(layout, monkeypatch):
    sid = draft(layout)  # 19 bytes of documents
    monkeypatch.setattr(submissions, "MAX_STORE", 30)
    add(layout, sid, "one.csv", b"1234567890")  # 29 held
    with pytest.raises(Refused, match="storage for uploads is full"):
        add(layout, sid, "two.csv", b"12")
    other = submissions.new(layout)
    with pytest.raises(Refused, match="storage for uploads is full"):
        submissions.add_file(layout, other, "b.txt", io.BytesIO(b"12"), 2)
    submissions.add_file(layout, other, "b.txt", io.BytesIO(b"1"), 1)


def test_a_file_and_then_the_whole_portfolio_can_be_removed(layout):
    sid = draft(layout)
    add_pack(layout, sid)
    rp.name_it(layout, sid, "Example comparison fund", "loans")
    rp.remove_file(layout, sid, MANDATE)
    assert rp.reading(layout, sid)["files"] == [CONSTRAINTS, HOLDINGS]
    with pytest.raises(Refused, match="is not stored"):
        rp.remove_file(layout, sid, MANDATE)
    rp.remove(layout, sid)
    assert rp.reading(layout, sid) == {
        "name": "",
        "holds": "",
        "files": [],
        "portfolio": None,
        "error": "",
    }
    assert sorted(p.name for p in (layout.uploads / sid).iterdir()) == ["files"]
    rp.remove(layout, sid)  # removing none is not an error


def test_a_sealed_submission_takes_no_portfolio_change(layout):
    sid = draft(layout)
    add_pack(layout, sid)
    rp.name_it(layout, sid, "Example comparison fund", "")
    submissions.seal(layout, sid)
    for change in (
        lambda: add(layout, sid, "more.csv", b"x"),
        lambda: rp.remove_file(layout, sid, HOLDINGS),
        lambda: rp.remove(layout, sid),
        lambda: rp.name_it(layout, sid, "Another name", ""),
    ):
        with pytest.raises(Refused, match="has been submitted"):
            change()
    assert rp.reading(layout, sid)["name"] == "Example comparison fund"


# --- The summary and Submit -------------------------------------------------------------------


def test_a_run_with_no_portfolio_summarises_and_submits_exactly_as_before(layout, scheduler):
    sid = draft(layout)
    answers = answers_for()
    got = submissions.summary(layout, sid, answers)
    assert got["error"] == ""
    assert "reference_portfolio" not in got
    # The digest is the documents' and answers' digest with the earlier run folded in: unchanged.
    assert got["digest"] == submissions.bound(
        submissions.digest(layout, sid, answers), got["prior_choice"]
    )
    record = scheduler.submit(sid, answers, got["digest"])
    assert record.digest == got["digest"]
    assert not rp.standing_root(layout).exists()
    listed = rp.run_portfolios(layout, record.id)
    assert [(item.key, item.scope, item.as_of) for item in listed] == [
        ("clo", "standing", None),
        ("lvln", "standing", None),
        ("jnk", "standing", None),
    ]


def test_the_summary_shows_the_portfolio_and_its_digest_covers_it(layout):
    sid = draft(layout)
    answers = answers_for()
    without = submissions.summary(layout, sid, answers)
    add_pack(layout, sid)
    rp.name_it(layout, sid, "Example comparison fund", "loans")
    with_it = submissions.summary(layout, sid, answers)
    assert with_it["error"] == ""
    assert with_it["reference_portfolio"] == rp.reading(layout, sid)["portfolio"]
    assert with_it["reference_portfolio"]["positions"] == 7
    assert with_it["digest"] != without["digest"]
    assert submissions.issued(layout, sid) == with_it["digest"]
    # The documents the launcher reads are unchanged: the portfolio is not one of them.
    assert with_it["documents"] == without["documents"]
    assert with_it["items"] == without["items"]
    rp.name_it(layout, sid, "Example comparison fund", "bonds")
    assert submissions.summary(layout, sid, answers)["digest"] != with_it["digest"]


def test_submit_stores_the_portfolio_for_the_run_and_lists_it_after_the_standing_three(
    layout, scheduler
):
    sid = draft(layout)
    answers = answers_for()
    add_pack(layout, sid)
    rp.name_it(layout, sid, "Example comparison fund", "loans")
    got = submissions.summary(layout, sid, answers)
    record = scheduler.submit(sid, answers, got["digest"])

    listed = rp.run_portfolios(layout, record.id)
    assert [item.key for item in listed] == ["clo", "lvln", "jnk", "custom"]
    own = listed[-1]
    assert (own.name, own.kind, own.scope) == ("Example comparison fund", "custom", "run")
    assert (own.as_of, own.positions) == (date(2026, 10, 31), 7)
    assert own.stored_at == SUBMITTED_AT
    stored = rp.run_store(layout, record.id).load("custom")
    assert {position.asset_type for position in stored.positions} == {"loan"}
    assert len(stored.limits) == 3
    assert [source.name for source in stored.sources] == [CONSTRAINTS, HOLDINGS, MANDATE]

    # The run's source documents are the uploaded document and the context: no portfolio file.
    drop = layout.drops / record.id
    assert sorted(p.relative_to(drop).as_posix() for p in drop.rglob("*")) == [
        "a.txt",
        "context.json",
    ]
    # The record keeps the documents' digest, which the launch re-checks against the drop.
    assert record.digest == submissions.bound(
        submissions.folder_digest(drop, answers), record.prior
    )
    assert not (layout.uploads / sid).exists()
    assert [r.id for r in load_all(layout)] == [record.id]
    # Another run is offered the standing three only.
    assert [item.key for item in rp.run_portfolios(layout, "20260101-000000-01")] == [
        "clo",
        "lvln",
        "jnk",
    ]


def test_submit_refuses_a_portfolio_changed_or_added_after_approval(layout, scheduler):
    sid = draft(layout)
    answers = answers_for()
    before = submissions.summary(layout, sid, answers)
    add_pack(layout, sid)
    rp.name_it(layout, sid, "Example comparison fund", "loans")
    with pytest.raises(Refused, match="documents or answers changed after approval"):
        scheduler.submit(sid, answers, before["digest"])
    approved = submissions.summary(layout, sid, answers)
    rp.name_it(layout, sid, "Another name", "loans")
    with pytest.raises(Refused, match="documents or answers changed after approval"):
        scheduler.submit(sid, answers, approved["digest"])
    assert load_all(layout) == []
    assert not rp.standing_root(layout).exists()
    assert rp.reading(layout, sid)["files"] == [CONSTRAINTS, HOLDINGS, MANDATE]  # unsealed again


def test_a_bad_portfolio_stops_the_summary_until_it_is_removed_then_the_run_submits(
    layout, scheduler
):
    sid = draft(layout)
    answers = answers_for()
    add(layout, sid, "notes.csv", NOT_A_PORTFOLIO)
    rp.name_it(layout, sid, "Not a portfolio", "")
    refused = submissions.summary(layout, sid, answers)
    assert refused == {
        "error": "The comparison portfolio cannot be read. "
        + NO_TABLE
        + " Replace its files or remove the comparison portfolio, then review the run again."
    }
    assert submissions.issued(layout, sid) == ""
    assert submissions.reading(layout, sid)["error"] == ""  # the documents are still read

    rp.remove(layout, sid)
    got = submissions.summary(layout, sid, answers)
    assert got["error"] == "" and "reference_portfolio" not in got
    record = scheduler.submit(sid, answers, got["digest"])
    assert record.status == "queued"
    assert not rp.standing_root(layout).exists()


def test_files_without_a_name_stop_the_summary_with_the_request_for_one(layout):
    sid = draft(layout)
    add_pack(layout, sid)
    refused = submissions.summary(layout, sid, answers_for())
    assert refused == {
        "error": "The comparison portfolio cannot be read. Give the comparison portfolio a name. "
        "Replace its files or remove the comparison portfolio, then review the run again."
    }


@pytest.mark.parametrize("run_id", ["..", ".", "a/b", "", "x" * 81])
def test_a_run_id_that_is_not_one_is_refused(layout, run_id):
    with pytest.raises(Refused, match="unknown run"):
        rp.run_portfolios(layout, run_id)


def test_the_standing_store_is_under_the_engine_folder(layout):
    assert rp.standing_root(layout) == layout.engine / "reference_portfolios"
    assert rp.run_store(layout, "20261125-093000-01").root == (
        layout.engine / "reference_portfolios" / "runs" / "20261125-093000-01"
    )


# --- The routes -------------------------------------------------------------------------------


def _path(sid: str, tail: str = "", **query: str) -> str:
    asked = "?" + urllib.parse.urlencode(query) if query else ""
    return f"/api/submissions/{sid}/reference-portfolio{tail}{asked}"


def _answers() -> dict[str, Any]:
    return dict(answers_for())


def test_the_routes_take_a_pack_name_it_show_it_and_remove_it(svc: Service):  # noqa: F811
    sid = svc.new()
    assert svc.upload(sid, "a.txt", b"Net sales were 100.").status == 200
    for name, raw in synthetic.pack_files().items():
        stored = svc.call("POST", _path(sid, "/files", name=name), raw)
        assert (stored.status, stored.json()) == (200, {"name": name})
    named = svc.call("POST", _path(sid), {"name": "Example comparison fund", "holds": "loans"})
    assert named.status == 200
    shown = named.json()
    assert shown["error"] == ""
    assert shown["files"] == [CONSTRAINTS, HOLDINGS, MANDATE]
    assert (shown["portfolio"]["as_of"], shown["portfolio"]["positions"]) == ("2026-10-31", 7)
    assert svc.call("GET", _path(sid)).json() == shown

    summary = svc.call("POST", f"/api/submissions/{sid}/summary", _answers()).json()
    assert summary["reference_portfolio"] == shown["portfolio"]

    gone = svc.call("DELETE", _path(sid, "/files", name=MANDATE))
    assert (gone.status, gone.json()) == (200, {"name": MANDATE})
    assert svc.call("GET", _path(sid)).json()["portfolio"]["as_of"] is None
    removed = svc.call("DELETE", _path(sid))
    assert (removed.status, removed.json()) == (200, {"removed": True})
    assert svc.call("GET", _path(sid)).json()["files"] == []
    # The document routes never saw the portfolio's files.
    reading = svc.call("GET", f"/api/submissions/{sid}/reading").json()
    assert [doc["source"] for doc in reading["documents"]] == ["a.txt"]


def test_the_routes_refuse_in_reader_words_and_leave_the_submission_usable(svc: Service):  # noqa: F811
    sid = svc.new()
    assert svc.upload(sid, "a.txt", b"Net sales were 100.").status == 200
    unknown = "0" * 32
    assert svc.call("GET", _path(unknown)).status == 404
    assert svc.call("POST", _path(unknown, "/files", name="h.csv"), b"x").status == 404
    assert svc.call("POST", _path(sid, "/files"), b"x").status == 400  # no file name
    unsafe = svc.call("POST", _path(sid, "/files", name="../h.csv"), b"x")
    assert unsafe.status == 400
    for body in ({"name": ""}, {"name": "x", "holds": "equity"}, b'["x"]', {"holds": "loans"}):
        assert svc.call("POST", _path(sid), body).status == 400

    assert svc.call("POST", _path(sid, "/files", name="notes.csv"), NOT_A_PORTFOLIO).status == 200
    bad = svc.call("POST", _path(sid), {"name": "Not a portfolio", "holds": ""})
    assert bad.status == 200
    assert (bad.json()["error"], bad.json()["portfolio"]) == (NO_TABLE, None)
    answers = _answers()
    refused = svc.call("POST", f"/api/submissions/{sid}/summary", answers).json()
    assert refused["error"].startswith("The comparison portfolio cannot be read. " + NO_TABLE)

    assert svc.call("DELETE", _path(sid)).status == 200
    summary = svc.call("POST", f"/api/submissions/{sid}/summary", answers).json()
    assert summary["error"] == "" and "reference_portfolio" not in summary
    submitted = svc.call(
        "POST", f"/api/submissions/{sid}/submit", {"answers": answers, "digest": summary["digest"]}
    )
    assert submitted.status == 200, submitted.body


def test_an_upload_over_the_ceiling_is_refused_from_the_header(svc: Service, monkeypatch):  # noqa: F811
    monkeypatch.setattr(rp, "MAX_FILE", 10)
    sid = svc.new()
    big = svc.call("POST", _path(sid, "/files", name="h.csv"), b"x" * 11)
    assert big.status == 400
    assert svc.call("GET", _path(sid)).json()["files"] == []


def test_a_comparison_file_that_folds_to_another_stored_name_is_refused(layout):
    """S08-2-1: a different name the disk reads as the same would replace the first."""
    sid = draft(layout)
    assert add(layout, sid, "Holdings.csv", b"first,1\n") == "Holdings.csv"
    with pytest.raises(Refused):
        add(layout, sid, "HOLDINGS.csv", b"second,2\n")
    held = layout.uploads / sid / submissions.REFERENCE_FOLDER / "Holdings.csv"
    assert held.read_bytes() == b"first,1\n"
    assert add(layout, sid, "Holdings.csv", b"third,3\n") == "Holdings.csv"  # same name replaces
