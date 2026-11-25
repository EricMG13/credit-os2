"""Source logos (``logos``): what is accepted by its leading bytes, the fetch rules an icon goes
through, when icons are fetched, the route, the snapshot keys and the owner's command line.

Every image here is SYNTHETIC: a few bytes built by hand in each format's header layout (no real
icon, no image library). Nothing touches a network: fetches go to a fake, or through the real
``fetch.fetch`` on the fetch tests' scripted connector (``Wire``) and resolver. Expected values
are written by hand."""

from __future__ import annotations

import base64
import contextlib
import io
import sqlite3
import struct
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from signal_app import Live
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)
from test_signal_fetch import PUBLIC, Reply, Wire, redirect
from test_signal_issuer_api import cookie

from deploy_workflow.signal import cli_logos, filings, ingest, logos, market, snapshot, store
from deploy_workflow.signal.cli import main
from deploy_workflow.signal.feeds import Entry, parse
from deploy_workflow.signal.fetch import Fetched, FetchRefused, Wiring, fetch
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.logos import LogoError, sniff

NOW = datetime(2026, 11, 25, 9, 0, tzinfo=UTC)
VIEWER = User("Tobias O", "reader")


# SYNTHETIC images, one per accepted format, each 16 by 16 unless a size is given


def png(width: int = 16, height: int = 16) -> bytes:
    ihdr = struct.pack(">II", width, height) + b"\x08\x06\x00\x00\x00"
    return b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\rIHDR" + ihdr + b"\x00\x00\x00\x00"


def gif(width: int = 16, height: int = 16) -> bytes:
    return b"GIF89a" + struct.pack("<HH", width, height) + b"\x80\x00\x00" + b"\x00" * 8 + b";"


def jpeg(width: int = 16, height: int = 16) -> bytes:
    app0 = b"\xff\xe0" + struct.pack(">H", 16) + b"JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    sof = b"\xff\xc0" + struct.pack(">HBHHB", 11, 8, height, width, 1) + b"\x01\x11\x00"
    return b"\xff\xd8" + app0 + sof + b"\xff\xd9"


def webp(chunk: bytes, width: int = 16, height: int = 16) -> bytes:
    if chunk == b"VP8X":
        data = b"\x00\x00\x00\x00" + (width - 1).to_bytes(3, "little")
        data += (height - 1).to_bytes(3, "little")
    elif chunk == b"VP8L":
        data = b"\x2f" + ((width - 1) | ((height - 1) << 14)).to_bytes(4, "little")
    else:
        data = b"\x00\x00\x00" + b"\x9d\x01\x2a" + struct.pack("<HH", width, height)
    body = chunk + struct.pack("<I", len(data)) + data
    return b"RIFF" + struct.pack("<I", 4 + len(body)) + b"WEBP" + body


def ico(width: int = 16, height: int = 16) -> bytes:
    payload = png(width or 256, height or 256)
    entry = struct.pack("<BBBBHHII", width % 256, height % 256, 0, 0, 1, 32, len(payload), 22)
    return b"\x00\x00\x01\x00\x01\x00" + entry + payload


SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'


@pytest.mark.parametrize(
    ("data", "kind"),
    [
        (png(), "image/png"),
        (gif(), "image/gif"),
        (b"GIF87a" + gif()[6:], "image/gif"),
        (jpeg(), "image/jpeg"),
        (webp(b"VP8X"), "image/webp"),
        (webp(b"VP8L"), "image/webp"),
        (webp(b"VP8 "), "image/webp"),
        (ico(), "image/x-icon"),
        (ico(0, 0), "image/x-icon"),  # 0 in an ICO directory is 256
        (png(512, 512), "image/png"),
    ],
)
def test_the_accepted_formats_are_told_by_their_leading_bytes(data, kind):
    assert sniff(data) == kind


@pytest.mark.parametrize(
    ("data", "words"),
    [
        (SVG, "the file is not a PNG, JPEG, GIF, WebP or ICO image"),
        (b"<html><body>Not found</body></html>", "the file is not a PNG, JPEG, GIF"),
        (b"", "the file is not a PNG"),
        (b"BM" + b"\x00" * 60, "the file is not a PNG"),  # a BMP
        (b"\x00\x00\x02\x00\x01\x00" + b"\x00" * 16, "the file is not a PNG"),  # a cursor
        (png(513, 16), "the image is 513 by 16; at most 512 by 512"),
        (gif(16, 600), "the image is 16 by 600"),
        (jpeg(1024, 1024), "the image is 1024 by 1024"),
        (webp(b"VP8X", 4000, 10), "the image is 4000 by 10"),
        (png(0, 16), "the image is 0 by 16"),
        (png()[:20], "the PNG header is cut short"),
        (gif()[:8], "the GIF header is cut short"),
        (jpeg()[:22], "the JPEG frame header is missing or cut short"),
        (b"\xff\xd8\xff\xda\x00\x08", "the JPEG frame header is missing or cut short"),
        (webp(b"VP8X")[:26], "the WebP header is cut short"),
        (webp(b"ALPH"), "the WebP header is cut short or not one this build reads"),
        (ico()[:10], "the ICO directory is cut short"),
        (ico()[:30], "an ICO image runs past the end of the file"),
        (png() + b"\x00" * (32 * 1024), "the file is larger than 32 KiB"),
    ],
)
def test_anything_else_is_refused_with_its_reason(data, words):
    with pytest.raises(LogoError, match=words):
        sniff(data)


# The fetch an icon goes through: every rule of fetch.fetch, a 32 KiB cap


def _real(wire: Wire, resolve: Any = PUBLIC) -> logos.LogoFetch:
    def fetched(url: str) -> Fetched:
        return fetch(
            url,
            None,
            None,
            resolve=resolve,
            wiring=Wiring(wire),
            limit=logos.MAX_BYTES,
            accept=logos.ACCEPT,
        )

    return fetched


def test_a_larger_file_is_refused_whole_never_cut():
    wire = Wire(Reply(200, png() + b"\x00" * 40_000))
    with pytest.raises(FetchRefused, match="the file is larger than 32 KiB"):
        _real(wire)("https://wire.example/favicon.ico")
    declared = Wire(Reply(200, b"", {"Content-Length": "40000"}))
    with pytest.raises(FetchRefused, match="the file is larger than 32 KiB"):
        _real(declared)("https://wire.example/favicon.ico")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    held = store.open_db(tmp_path)
    yield held
    held.close()


def _source(db: sqlite3.Connection, url: str = "https://wire.example/rss", **more: str) -> int:
    made = store.propose_source(db, more.get("name", "Wire"), "news", url, "Mara L")
    if more.get("state", "approved") != "proposed":
        store.set_source_state(db, made, more.get("state", "approved"))
    return made


class Icons:
    """A fake logo fetch: each address answers from `answers` (an exception is raised)."""

    def __init__(self, answers: dict[str, bytes | Exception] | None = None) -> None:
        self.answers = answers or {}
        self.calls: list[str] = []

    def __call__(self, url: str) -> Fetched:
        self.calls.append(url)
        answer = self.answers.get(url, png())
        if isinstance(answer, Exception):
            raise answer
        return Fetched(answer, None, None)


def _row(db: sqlite3.Connection, source: int) -> tuple[Any, ...]:
    row = db.execute(
        "SELECT media_type, url, note, cleared FROM source_logos WHERE source_id=?", (source,)
    ).fetchone()
    return tuple(row)


def test_an_svg_served_as_png_is_refused_and_a_png_served_as_html_is_kept(db):
    """The content type is never read: only the leading bytes."""
    one = _source(db, "https://one.example/rss", name="One")
    two = _source(db, "https://two.example/rss", name="Two")
    lying_svg = Wire(Reply(200, SVG, {"Content-Type": "image/png"}))
    logos.fetch_one(db, _due_row(db, one), NOW, _real(lying_svg))
    assert _row(db, one) == (
        None,
        "https://one.example/favicon.ico",
        "the file is not a PNG, JPEG, GIF, WebP or ICO image",
        0,
    )
    html_png = Wire(Reply(200, png(), {"Content-Type": "text/html"}))
    logos.fetch_one(db, _due_row(db, two), NOW, _real(html_png))
    assert _row(db, two) == ("image/png", "https://two.example/favicon.ico", None, 0)
    assert logos.delivered(db, two) == {
        "type": "image/png",
        "data": base64.b64encode(png()).decode(),
    }


def _due_row(db: sqlite3.Connection, source: int) -> sqlite3.Row:
    return db.execute(
        "SELECT s.id, s.url, l.declared FROM sources s LEFT JOIN source_logos l"
        " ON l.source_id = s.id WHERE s.id=?",
        (source,),
    ).fetchone()


@pytest.mark.parametrize(
    ("location", "words"),
    [
        ("http://wire.example/favicon.ico", "only https addresses are fetched"),
        ("https://internal.example/favicon.ico", "which is not a public address"),
        ("https://wire.example:8443/favicon.ico", "a redirect must use the default port"),
    ],
)
def test_a_redirect_the_fetch_rules_refuse_is_refused_for_an_icon(db, location, words):
    source = _source(db)
    wire = Wire(redirect(location), Reply(200, png()))

    def resolve(host: str) -> list[str]:
        return ["10.0.0.1"] if host == "internal.example" else ["93.184.216.34"]

    outcome = logos.fetch_one(db, _due_row(db, source), NOW, _real(wire, resolve))
    assert not outcome.ok and words in outcome.note
    assert logos.delivered(db, source) is None


def test_an_icon_is_fetched_with_the_ordinary_client_never_the_sec_contact(db):
    filings.set_contact(db, "Acme Credit research@acme.example", NOW)
    from deploy_workflow.signal import issuers

    issuers.add_issuer(db, issuers.Form("Altice USA", (), "0001702780"), "Mara L")
    store.set_source_state(db, 1, "approved")
    wire = Wire(Reply(200, ico()))
    (outcome,) = logos.run_due(db, NOW, _real(wire))
    assert outcome.ok and wire.requests[0][0] == "/favicon.ico"
    headers = wire.requests[0][1]
    assert headers["Host"] == "www.sec.gov" and "research@acme.example" not in headers["User-Agent"]
    assert headers["Accept"] == logos.ACCEPT and "Cookie" not in headers


# Where from, and when


def test_the_feeds_own_image_is_used_when_it_declares_one_else_the_hosts_favicon():
    rss = (
        b'<?xml version="1.0"?><rss version="2.0"><channel><title>W</title>'
        b"<image><url>/img/logo.png</url></image></channel></rss>"
    )  # SYNTHETIC
    atom = (
        b'<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>A</title>'
        b"<icon>https://cdn.example/a.ico</icon><logo>https://cdn.example/a.png</logo></feed>"
    )  # SYNTHETIC: the logo is preferred to the icon
    assert parse(rss).image == "/img/logo.png" and parse(atom).image == "https://cdn.example/a.png"
    assert logos.address("https://wire.example/rss", "/img/logo.png") == (
        "https://wire.example/img/logo.png"
    )
    assert (
        logos.address("https://wire.example/news/rss", None) == "https://wire.example/favicon.ico"
    )
    assert logos.address(market.SOURCE_URL, None) == "https://fred.stlouisfed.org/favicon.ico"


def test_the_ingest_pass_keeps_the_image_the_feed_declares(db):
    source = _source(db)
    rss = (
        b'<?xml version="1.0"?><rss version="2.0"><channel><title>W</title>'
        b"<image><url>https://cdn.example/w.png</url></image><item><title>T</title>"
        b"<link>https://wire.example/1</link></item></channel></rss>"
    )  # SYNTHETIC
    ingest.run_due(db, NOW, lambda url, etag, modified: Fetched(rss, None, None))
    icons = Icons()
    logos.run_due(db, NOW, icons)
    assert icons.calls == ["https://cdn.example/w.png"] and _row(db, source)[0] == "image/png"


def test_only_approved_sources_are_fetched_at_most_five_a_pass(db):
    proposed = _source(db, "https://p.example/rss", name="P", state="proposed")
    paused = _source(db, "https://q.example/rss", name="Q", state="paused")
    approved = [_source(db, f"https://s{n}.example/rss", name=f"S{n}") for n in range(7)]
    icons = Icons()
    assert len(logos.run_due(db, NOW, icons)) == 5
    assert len(logos.run_due(db, NOW, icons)) == 2  # the other two, at the next pass
    assert logos.run_due(db, NOW, icons) == []
    assert icons.calls == [f"https://s{n}.example/favicon.ico" for n in range(7)]
    assert {proposed, paused} & set(logos.logo_ids(db)) == set()
    assert logos.logo_ids(db) == frozenset(approved)


def test_an_icon_is_refreshed_after_30_days_and_a_failure_retried_after_a_day(db):
    good = _source(db, "https://good.example/rss", name="Good")
    icons = Icons()
    logos.run_due(db, NOW, icons)
    assert logos.run_due(db, NOW + timedelta(days=30) - timedelta(seconds=1), icons) == []
    (again,) = logos.run_due(db, NOW + timedelta(days=30), icons)
    assert (again.source_id, again.ok) == (good, True)
    icons.answers["https://good.example/favicon.ico"] = FetchRefused("server answered HTTP 500")
    (failed,) = logos.run_due(db, NOW + timedelta(days=60), icons)
    assert not failed.ok and logos.delivered(db, good) is not None  # the icon it had is kept
    assert logos.run_due(db, NOW + timedelta(days=61) - timedelta(seconds=1), icons) == []
    (retried,) = logos.run_due(db, NOW + timedelta(days=61), icons)
    assert (retried.source_id, retried.ok) == (good, False)
    assert len(icons.calls) == 4


def test_a_fault_in_one_icon_is_that_sources_note_and_the_others_go_on(db):
    first = _source(db, "https://a.example/rss", name="A")
    second = _source(db, "https://b.example/rss", name="B")
    icons = Icons({"https://a.example/favicon.ico": RuntimeError("a bug")})
    outcomes = logos.run_due(db, NOW, icons)
    assert [(o.source_id, o.ok) for o in outcomes] == [(first, False), (second, True)]
    assert _row(db, first)[2] == "unexpected error (RuntimeError); see the log"


def test_off_fetches_none_and_delivers_none_and_on_brings_them_back(db):
    source = _source(db)
    logos.run_due(db, NOW, Icons())
    logos.set_enabled(db, False, NOW)
    icons = Icons()
    assert logos.run_due(db, NOW + timedelta(days=40), icons) == [] and icons.calls == []
    assert logos.delivered(db, source) is None and logos.logo_ids(db) == frozenset()
    logos.set_enabled(db, True, NOW)
    assert logos.delivered(db, source) is not None


def test_a_cleared_icon_is_not_fetched_until_refreshed(db):
    source = _source(db)
    logos.run_due(db, NOW, Icons())
    logos.clear(db, source)
    assert logos.delivered(db, source) is None
    icons = Icons()
    assert logos.run_due(db, NOW + timedelta(days=90), icons) == [] and icons.calls == []
    assert logos.refresh(db, source, NOW, icons).ok and logos.delivered(db, source) is not None


def test_removing_a_source_takes_its_icon(db):
    source = _source(db)
    logos.run_due(db, NOW, Icons())
    store.remove_source(db, source, with_stories=False)
    assert db.execute("SELECT COUNT(*) FROM source_logos").fetchone()[0] == 0


# The route


def test_the_route_answers_the_icon_and_one_404_for_every_other_case(tmp_path):
    db = store.open_db(tmp_path)
    with_logo = _source(db, "https://a.example/rss", name="A")
    without = _source(db, "https://b.example/rss", name="B")
    paused = _source(db, "https://c.example/rss", name="C")
    logos.fetch_one(db, _due_row(db, with_logo), NOW, Icons())
    logos.fetch_one(db, _due_row(db, paused), NOW, Icons())
    store.set_source_state(db, paused, "paused")
    db.close()
    svc = Live(tmp_path)
    try:
        status, _, reply = svc.call("GET", f"/api/logos/{with_logo}", cookie=cookie("Tobias O"))
        assert (status, reply) == (
            200,
            {"type": "image/png", "data": base64.b64encode(png()).decode()},
        )
        missing = [
            svc.call("GET", f"/api/logos/{n}", cookie=cookie("Tobias O"))
            for n in (without, paused, 999, 0)
        ]
        assert [(s, r) for s, _, r in missing] == [(404, {"error": "no logo for this source"})] * 4
        assert svc.call("GET", f"/api/logos/{with_logo}")[0] == 401  # a named user only
        db = store.open_db(tmp_path)
        logos.set_enabled(db, False, NOW)
        db.close()
        off = svc.call("GET", f"/api/logos/{with_logo}", cookie=cookie("Tobias O"))
        assert (off[0], off[2]) == (404, {"error": "no logo for this source"})
    finally:
        svc.close()


# The snapshot


def _shared_story(db: sqlite3.Connection) -> tuple[int, int, int]:
    wire = _source(db, "https://wire.example/rss", name="Wire")
    other = _source(db, "https://other.example/rss", name="Other")
    when = NOW - timedelta(hours=1)
    entry = Entry("Acme results", "https://wire.example/1", when, "")
    assert store.add_story(db, wire, entry, when) == "new"
    assert store.add_story(db, other, entry, when) == "duplicate"
    return wire, other, 1


def test_format_two_says_which_sources_have_a_logo_and_format_one_is_unchanged(db):
    wire, other, _ = _shared_story(db)
    plain_before = snapshot.build(db, VIEWER, NOW)
    logos.fetch_one(db, _due_row(db, wire), NOW, Icons())
    plain_after = snapshot.build(db, VIEWER, NOW)
    assert plain_after == plain_before  # format 1 carries no logo key
    built = snapshot.build(db, VIEWER, NOW, fmt=2)
    snap = built["scenes"][0]["snapshot"]
    (card,) = snap["feed"]["stories"]
    assert card["source"] == {"name": "Wire", "monogram": "W", "id": str(wire), "logo": True}
    assert card["alsoIn"]["sources"] == [{"id": str(other), "name": "Other", "logo": False}]
    assert {row["id"]: row["logo"] for row in snap["settings"]["sources"]} == {
        str(wire): True,
        str(other): False,
    }
    assert "data" not in str(card["source"])  # the bytes are never in the snapshot
    assert react_refusal(plain_after) is None


# The command line


def run_cli(root: Path, *args: str) -> tuple[int, str, str]:
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main(["--root", str(root), *args])
    return code, out.getvalue(), err.getvalue()


def test_the_owners_commands(tmp_path, monkeypatch):
    db = store.open_db(tmp_path)
    source = _source(db)
    proposed = _source(db, "https://p.example/rss", name="P", state="proposed")
    db.close()
    icons = Icons()
    monkeypatch.setattr(cli_logos, "FETCH", icons)
    assert run_cli(tmp_path, "logos", "status") == (
        0,
        (
            "1  Wire  none yet: due at the next pass\n"
            "2  P  none: the source is proposed, so none is fetched\n"
        ),
        "",
    )
    code, out, _ = run_cli(tmp_path, "logos", "refresh", str(source))
    assert (code, out) == (0, "source 1: logo stored: image/png, 33 bytes\n")
    code, _, err = run_cli(tmp_path, "logos", "refresh", str(proposed))
    assert (code, err) == (2, "error: source 2 is not approved, so its logo is not fetched\n")
    assert run_cli(tmp_path, "logos", "clear", str(source))[1] == (
        "source 1: logo cleared; none is fetched until: signal logos refresh\n"
    )
    assert run_cli(tmp_path, "logos", "status")[1].startswith(
        "1  Wire  cleared by the owner; not fetched until refreshed\n"
    )
    assert run_cli(tmp_path, "logos", "off")[1] == "logos are off: none is fetched or shown\n"
    code, _, err = run_cli(tmp_path, "logos", "refresh", str(source))
    assert (code, err) == (
        2,
        "error: logos are switched off; switch them on with: signal logos on\n",
    )
    assert run_cli(tmp_path, "logos", "on")[1] == "logos are on\n"
    assert run_cli(tmp_path, "logos", "clear", "99")[2] == "error: no source with id 99\n"
    assert len(icons.calls) == 1


def test_the_loop_fetches_logos_after_the_ingest_job_with_its_own_fetch(tmp_path):
    from deploy_workflow.signal import service

    db = store.open_db(tmp_path)
    _source(db)
    db.close()
    feed_only = service.Loop(tmp_path, fetch_fn=lambda u, e, m: Fetched(b"<rss/>", None, None))
    assert feed_only.logo_fetch is None  # a fake world fetches no logo unless it gives one
    icons = Icons()
    loop = service.Loop(
        tmp_path, fetch_fn=lambda u, e, m: Fetched(b"<rss/>", None, None), logo_fetch=icons
    )
    loop.run_once(NOW)
    assert icons.calls == ["https://wire.example/favicon.ico"] and loop.logo_error is None
