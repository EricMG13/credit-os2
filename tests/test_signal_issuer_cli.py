"""The owner's command line for issuers, filings and the market post: plain output, and exit 2
with one sentence on an error. The FRED CSVs are SYNTHETIC (``test_signal_market``); nothing is
fetched: the post's fetch function is replaced. Expected output is written by hand."""

from __future__ import annotations

import contextlib
import io
from datetime import UTC, datetime
from pathlib import Path

import pytest
from test_signal_market import BODIES, Fred

from deploy_workflow.signal import cli_issuers, store
from deploy_workflow.signal.cli import main
from deploy_workflow.signal.fetch import Fetched

CONTACT = "Acme Credit research@acme.example"


def run(root: Path, *args: str) -> tuple[int, str, str]:
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main(["--root", str(root), *args])
    return code, out.getvalue(), err.getvalue()


def test_issuers_add_list_edit_and_remove(tmp_path):
    code, out, _ = run(
        tmp_path,
        "issuers", "add", "Altice USA", "--aliases", "Optimum, ATUS",
        "--cik", "0001702780", "--library-key", "id:altice", "--by", "Ida Owner",
    )  # fmt: skip
    assert code == 0
    assert out == (
        "issuer 1 added: Altice USA\n"
        "its filing source 1 waits for the owner: signal sources approve 1\n"
    )
    assert run(tmp_path, "issuers", "add", "TransDigm Group", "--aliases", "TDG", "--by", "x")[
        1
    ] == ("issuer 2 added: TransDigm Group\n")
    code, out, _ = run(tmp_path, "issuers", "list")
    assert (code, out) == (
        0,
        (
            "1  Altice USA  CIK 0001702780  key id:altice  aliases: Optimum, ATUS"
            "  filings: source 1, proposed\n"
            "2  TransDigm Group  aliases: TDG\n"
        ),
    )
    code, out, _ = run(tmp_path, "issuers", "edit", "1", "--cik", "", "--aliases", "")
    assert (code, out) == (0, "issuer 1 changed: Altice USA; its filing source 1 is paused\n")
    assert run(tmp_path, "issuers", "list")[1].startswith("1  Altice USA  key id:altice\n")
    assert run(tmp_path, "issuers", "remove", "2") == (0, "issuer 2 removed\n", "")
    assert run(tmp_path, "issuers", "list")[1] == "1  Altice USA  key id:altice\n"


@pytest.mark.parametrize(
    ("args", "sentence"),
    [
        (("issuers", "add", "GE", "--by", "x"), "'GE' cannot be matched: each of its words"),
        (("issuers", "add", "Acme", "--cik", "12", "--by", "x"), "a CIK is 10 digits"),
        (("issuers", "edit", "9", "--name", "Acme"), "no issuer with id 9"),
        (("issuers", "remove", "9"), "no issuer with id 9"),
        (("filings", "contact", "no email here"), "the contact is the organisation and an email"),
        (
            (
                "market",
                "post",
            ),
            "no approved market source",
        ),
        (("market", "hour", "24"), "the hour is a whole number from 0 to 23"),
        (("market", "series", "remove", "DGS5"), "no series DGS5 in the market post"),
        # Review finding 15: both at once was a silent clear; an empty --by was accepted.
        (
            ("filings", "contact", "Acme research@acme.example", "--clear"),
            "give a contact or --clear, not both",
        ),
        (("issuers", "add", "Acme Corp", "--by", ""), "who adds the issuer must not be empty"),
        (("issuers", "add", "Acme Corp", "--by", "  "), "who adds the issuer must not be empty"),
    ],
)
def test_an_error_is_one_sentence_and_exit_2(tmp_path, args, sentence):
    code, out, err = run(tmp_path, *args)
    assert code == 2 and out == ""
    assert err.startswith(f"error: {sentence}") and err.count("\n") == 1


def test_filings_contact_and_status(tmp_path):
    run(tmp_path, "issuers", "add", "Altice USA", "--cik", "0001702780", "--by", "x")
    code, out, _ = run(tmp_path, "filings", "status")
    assert (code, out) == (
        0,
        (
            "contact: not set, so no filing source is fetched\n"
            "spacing: one filing fetch a second at most, 30 a pass, each source every 10 minutes\n"
            "1  proposed  never checked  Altice USA filings (SEC)  (issuer 1, Altice USA)\n"
        ),
    )
    code, out, _ = run(tmp_path, "filings", "contact", CONTACT)
    assert (code, out) == (
        0,
        "contact set; it is sent as the User-Agent of filing fetches to www.sec.gov only\n",
    )
    assert run(tmp_path, "filings", "status")[1].startswith(
        f"contact: {CONTACT} (sent to www.sec.gov only)\n"
    )
    code, out, _ = run(tmp_path, "filings", "contact", "--clear")
    assert (code, out) == (0, "contact cleared; no filing source is fetched until one is set\n")


def test_market_propose_series_hour_and_post(tmp_path, monkeypatch):
    code, out, _ = run(tmp_path, "market", "propose", "--by", "Ida Owner")
    assert (code, out) == (
        0,
        "market source 1 proposed with 8 series; approve it with: signal sources approve 1\n",
    )
    code, out, _ = run(tmp_path, "market", "series", "list")
    lines = out.splitlines()
    assert code == 0 and len(lines) == 8
    assert lines[0] == (
        "BAMLH0A0HYM2  US HY  Percent  ICE BofA US High Yield Index Option-Adjusted Spread"
        "  (ICE Data Indices, LLC, via FRED)"
    )
    for series in ("BAMLH0A2HYB", "BAMLH0A3HYC", "BAMLHE00EHYIOAS"):
        assert run(tmp_path, "market", "series", "remove", series)[0] == 0
    code, out, _ = run(
        tmp_path, "market", "series", "add", "dgs5", "--title", "Five-year Treasury",
        "--unit", "Percent", "--short", "UST 5y", "--source", "FRB via FRED",
    )  # fmt: skip
    assert (code, out) == (0, "series DGS5 added; the market post reads 6 series\n")
    assert run(tmp_path, "market", "series", "remove", "DGS5")[1] == (
        "series DGS5 removed; the market post reads 5 series\n"
    )
    assert run(tmp_path, "market", "hour", "13")[1] == "the market post is made from 13:00 UTC\n"
    db = store.open_db(tmp_path)
    store.set_source_state(db, 1, "approved")
    db.close()
    fred = Fred(BODIES)
    monkeypatch.setattr(cli_issuers, "FETCH", fred)
    code, out, _ = run(tmp_path, "market", "post")
    today = datetime.now(UTC).date()  # the post is titled with the UTC day it is written
    title = f"Market backdrop: {today.day} {today:%B} {today.year}"
    assert code == 0 and out.startswith(f"posted story 1: {title}\n")
    assert out.endswith("series not read: US BB, UST 2y\n")
    code, out, err = run(tmp_path, "market", "post")
    assert code == 2 and err.startswith("error: today's market post is written already: story 1")
    assert len(fred.calls) == 5


def _approved_market(tmp_path: Path) -> None:
    assert run(tmp_path, "market", "propose")[0] == 0
    db = store.open_db(tmp_path)
    store.set_source_state(db, 1, "approved")
    db.close()


def test_market_post_that_reads_no_series_exits_2_with_one_sentence(tmp_path, monkeypatch):
    """Review findings 2 and 10: never a traceback; exit 2 when no series was read."""
    _approved_market(tmp_path)
    # SYNTHETIC: every default series answers a body the csv module refuses (lone CR endings).
    monkeypatch.setattr(cli_issuers, "FETCH", lambda url, e, m: Fetched(b"a\rb\r", None, None))
    code, out, err = run(tmp_path, "market", "post")
    assert (code, out) == (2, "")
    assert err == "error: no post: no series could be read\n"


def test_market_post_with_one_unreadable_series_posts_the_others(tmp_path, monkeypatch):
    _approved_market(tmp_path)

    def fred(url: str, etag: object, modified: object) -> Fetched:
        series_id = url.rsplit("=", 1)[1]
        if series_id == "SOFR":
            return Fetched(b"observation_date,SOFR\n2026-11-24," + b"9" * 200_000, None, None)
        return Fetched(f"observation_date,{series_id}\n2026-11-24,1.00\n".encode(), None, None)

    monkeypatch.setattr(cli_issuers, "FETCH", fred)
    code, out, err = run(tmp_path, "market", "post")
    assert (code, err) == (0, "") and out.endswith("series not read: SOFR\n")
