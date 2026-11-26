"""Review findings C9-F1, C9-F2 and C9-F3 and the round-2 findings C9-R1 to C9-R4 on the web lookup
core. Offline: the fakes of test_weblookup stand in for the network; expected values are literal."""

import hashlib
import json
from pathlib import Path

import pytest
from test_web_lookup_tools import tools_for
from test_weblookup import (
    FILING_URL,
    UA_ENV,
    UA_VALUE,
    FakeNet,
    filing_list_net,
    html,
    index_rows,
    make,
    ok,
    retained,
    web_dir,
)

from deploy_workflow.research import weblookup

HOST = "www.fca.org.uk"


def _live_known(tmp_path: Path) -> weblookup.KnownPages:
    """What the module tools register live for the run ``tmp_path`` holds."""
    return tools_for(tmp_path, FakeNet())[0]._known_pages()


# C9-F1 -----------------------------------------------------------------------------------------


def _redated_run(tmp_path: Path) -> weblookup.Retained:
    """A filing document fetched before its list is later-event; the list then dates it usable."""
    net = filing_list_net("2024-11-01")
    key = ("www.sec.gov", "/Archives/edgar/data/320193/000032019324000123/a10k.htm")
    net.pages[key] = ok(html("<p>Annual report</p>", '<meta name="date" content="2025-09-01">'))
    lookup = make(tmp_path, net, env={UA_ENV: UA_VALUE})
    assert retained(lookup.fetch_page(FILING_URL)).status == "later-event"
    lookup.filing_list("320193")
    again = retained(lookup.fetch_page(FILING_URL))
    assert again.status == "usable"
    return again


def test_f1_a_redated_page_is_usable_for_the_handoff_check(tmp_path: Path) -> None:
    item = _redated_run(tmp_path)
    found = weblookup.known_pages(tmp_path / "run")
    md = (
        "## Request\nx\n## Sources\n"
        "| Source | URL | Publisher | Stated date | Source type |\n|---|---|---|---|---|\n"
        f"| {item.source_id} | {FILING_URL} | Example | 2024-11-01 | Issuer filing |\n"
        "## Findings\nNet sales rose.\n## Calculations\nNone\n## Gaps\n{gaps}\n"
        "## Next module\nCP-1\n"
    )
    assert weblookup.web_handoff_issues(md, found) == []


def test_f1_retained_pages_gives_the_latest_row_of_an_address(tmp_path: Path) -> None:
    _redated_run(tmp_path)
    page = next(p for p in weblookup.retained_pages(tmp_path / "run") if p.url == FILING_URL)
    assert (page.status, page.page_date) == ("usable", "2024-11-01")


def test_f1_known_pages_gives_every_row_and_the_first_row_of_an_id(tmp_path: Path) -> None:
    item = _redated_run(tmp_path)
    found = weblookup.known_pages(tmp_path / "run")
    live = _live_known(tmp_path)
    assert [r.status for r in found.rows if r.source_id == item.source_id] == [
        "later-event",
        "usable",
    ]
    assert found[item.source_id][0].status == "later-event"
    assert dict(found) == dict(live)
    assert found.rows == live.rows


def test_f1_usable_then_redated_later_is_later_event(tmp_path: Path) -> None:
    net = filing_list_net("2025-07-01")
    lookup = make(tmp_path, net, env={UA_ENV: UA_VALUE})
    first = retained(lookup.fetch_page(FILING_URL))
    assert first.status == "usable"  # the page's own meta date, before its list is retained
    lookup.filing_list("320193")
    assert retained(lookup.fetch_page(FILING_URL)).status == "later-event"
    found = weblookup.known_pages(tmp_path / "run")
    md = (
        "## Request\nx\n## Sources\n"
        "| Source | URL | Publisher | Stated date | Source type |\n|---|---|---|---|---|\n"
        f"| {first.source_id} | {FILING_URL} | Example | 2025-07-01 | Issuer filing |\n"
        "## Findings\nNet sales rose.\n## Calculations\nNone\n## Gaps\n{gaps}\n"
        "## Next module\nCP-1\n"
    )
    assert any("Later event" in issue for issue in weblookup.web_handoff_issues(md, found))


# C9-F3 -----------------------------------------------------------------------------------------


def test_f3_fragment_spellings_are_one_fetch_one_row(tmp_path: Path) -> None:
    net = FakeNet({(HOST, "/a"): ok(html("<p>a</p>"))})
    lookup = make(tmp_path, net)
    first = retained(lookup.fetch_page(f"https://{HOST}/a"))
    second = retained(lookup.fetch_page(f"https://{HOST}/a#x"))
    third = retained(lookup.fetch_page(f"https://{HOST}/a#y"))
    assert len(net.requests) == 1
    assert len(index_rows(tmp_path)) == 1
    assert first == second == third
    assert index_rows(tmp_path)[0]["url"] == f"https://{HOST}/a"


def test_f3_host_case_trailing_dot_and_default_port_are_one_fetch(tmp_path: Path) -> None:
    net = FakeNet({(HOST, "/a"): ok(html("<p>a</p>"))})
    lookup = make(tmp_path, net)
    lookup.fetch_page(f"https://{HOST}/a")
    for spelling in (
        "https://WWW.FCA.ORG.UK/a",
        "https://www.fca.org.uk./a",
        "https://www.fca.org.uk:443/a",
    ):
        assert retained(lookup.fetch_page(spelling)).url == f"https://{HOST}/a"
    assert len(net.requests) == 1
    assert len(index_rows(tmp_path)) == 1


def test_f3_a_different_query_is_a_different_page(tmp_path: Path) -> None:
    net = FakeNet({(HOST, "/a?x=1"): ok(html("<p>1</p>")), (HOST, "/a?x=2"): ok(html("<p>2</p>"))})
    lookup = make(tmp_path, net)
    lookup.fetch_page(f"https://{HOST}/a?x=1")
    lookup.fetch_page(f"https://{HOST}/a?x=2")
    assert len(index_rows(tmp_path)) == 2


def test_f3_the_page_budget_counts_one_charge_per_canonical_address(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setattr(weblookup, "MAX_PAGES", 2)
    net = FakeNet({(HOST, "/a"): ok(html("<p>a</p>")), (HOST, "/b"): ok(html("<p>b</p>"))})
    lookup = make(tmp_path, net)
    for spelling in ("/a", "/a#x", "/a#y", "/b"):
        assert not isinstance(lookup.fetch_page(f"https://{HOST}{spelling}"), weblookup.Refused)
    assert len(index_rows(tmp_path)) == 2


def test_f3_the_byte_budget_charges_a_page_once(tmp_path: Path) -> None:
    rows = [
        {"url": "https://www.fca.org.uk/a", "bytes": 10},
        {"url": "https://WWW.FCA.ORG.UK/a#x", "bytes": 10},
        {"url": "https://www.fca.org.uk./a", "bytes": 10},
    ]
    assert weblookup._spent_bytes(rows) == 10


# C9-F2 (BOM and <meta> charset; the windows-1252 fallback is a separate expectation change) ------


def _decoded(tmp_path: Path, body: bytes, ctype: str) -> str:
    lookup = make(tmp_path, FakeNet({(HOST, "/p"): ok(body, ctype)}))
    item = retained(lookup.fetch_page(f"https://{HOST}/p"))
    assert item.sha256 == hashlib.sha256(body).hexdigest()
    kept = web_dir(tmp_path) / f"{item.sha256}.{'html' if 'html' in ctype else 'txt'}"
    assert kept.read_bytes() == body
    return "".join(lookup.page_text(item))


def test_f2_meta_charset_is_honoured(tmp_path: Path) -> None:
    body = (
        '<html><head><meta charset="windows-1252"></head><body>Revenue \xa31,200m</body></html>'
    ).encode("cp1252")
    assert "Revenue £1,200m" in _decoded(tmp_path, body, "text/html")


def test_f2_meta_http_equiv_charset_is_honoured(tmp_path: Path) -> None:
    head = '<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">'
    body = f"<html><head>{head}</head><body>Cr\xe9dit \xa31m</body></html>".encode("latin-1")
    assert "Crédit £1m" in _decoded(tmp_path, body, "text/html")


def test_f2_utf16le_bom_is_decoded(tmp_path: Path) -> None:
    body = b"\xff\xfe" + "<html><body>Revenue \xa31,200m</body></html>".encode("utf-16-le")
    assert "Revenue £1,200m" in _decoded(tmp_path, body, "text/html")


def test_f2_utf8_bom_wins_over_a_wrong_header_and_is_stripped(tmp_path: Path) -> None:
    body = b"\xef\xbb\xbf" + "Revenue £1m".encode()
    assert _decoded(tmp_path, body, "text/plain; charset=iso-8859-1") == "Revenue £1m"


def test_f2_undeclared_non_utf8_text_still_uses_replacement(tmp_path: Path) -> None:
    assert _decoded(tmp_path, b"caf\xe9 ok", "text/plain") == "caf� ok"


# C9-R1 and C9-R2: only a WHATWG label in a real <meta> tag declares the charset ----------------


def test_r1_a_meta_utf16_label_is_read_as_utf8(tmp_path: Path) -> None:
    body = '<html><head><meta charset="utf-16"></head><body>Crédit £1m</body></html>'.encode()
    assert "Crédit £1m" in _decoded(tmp_path, body, "text/html")


@pytest.mark.parametrize("label", ["punycode", "utf-7", "unicode_escape", "rot13", "idna"])
def test_r1_a_python_only_codec_name_in_meta_is_ignored(tmp_path: Path, label: str) -> None:
    body = f'<meta charset="{label}"><p>Crédit £1m</p>'.encode()
    assert "Crédit £1m" in _decoded(tmp_path, body, "text/html")


def test_r1_whatwg_latin1_and_ascii_labels_are_windows_1252(tmp_path: Path) -> None:
    body = b'<meta charset="latin1"><p>Cr\x93dit \x80</p>'
    assert "Cr\u201cdit \u20ac" in _decoded(tmp_path, body, "text/html")
    ascii_body = body.replace(b"latin1", b"us-ascii")
    assert "Cr\u201cdit" in _decoded(tmp_path / "ascii", ascii_body, "text/html")


def test_r1_a_header_non_text_codec_is_still_not_used(tmp_path: Path) -> None:
    assert "Crédit" in _decoded(tmp_path, "Crédit".encode(), "text/html; charset=rot13")


def test_r2_a_commented_out_meta_is_skipped(tmp_path: Path) -> None:
    body = '<!-- <meta charset="ascii"> --><meta charset="utf-8">café'.encode()
    assert "café" in _decoded(tmp_path, body, "text/html")


def test_r2_a_metadata_tag_is_not_a_meta_tag(tmp_path: Path) -> None:
    body = '<metadata charset="ascii"></metadata><meta charset="utf-8">café'.encode()
    assert "café" in _decoded(tmp_path, body, "text/html")


def test_r2_charset_text_inside_another_attribute_is_not_a_declaration(tmp_path: Path) -> None:
    body = '<meta name="description" content="see charset=ascii"><p>café</p>'.encode()
    assert "café" in _decoded(tmp_path, body, "text/html")


def test_r2_a_self_closed_meta_tag_declares_the_charset(tmp_path: Path) -> None:
    body = b'<meta charset="windows-1252"/><p>\x80</p>'
    assert "\u20ac" in _decoded(tmp_path, body, "text/html")


def test_r2_http_equiv_needs_content_type(tmp_path: Path) -> None:
    body = b'<meta http-equiv="refresh" content="0; charset=windows-1252"><p>caf\xc3\xa9</p>'
    assert "café" in _decoded(tmp_path, body, "text/html")


# C9-R3: one canonical key for the fetch and the handoff compare --------------------------------


def _cited(tmp_path: Path, fetched: str, cited: str) -> list[str]:
    page = ok(html("<p>a</p>"))
    net = FakeNet({(HOST, "/a"): page, (f"{HOST}.", "/a"): page})
    lookup = make(tmp_path, net)
    item = retained(lookup.fetch_page(fetched))
    found = weblookup.known_pages(tmp_path / "run")
    return weblookup.web_handoff_issues(handoff_rows(item.source_id, cited), found)


def handoff_md(rows: str, gaps: str = "None.") -> str:
    return (
        "## Request\nx\n## Sources\n"
        "| Source | URL | Publisher | Stated date | Source type |\n|---|---|---|---|---|\n"
        f"{rows}\n## Findings\nNet sales rose.\n## Calculations\nNone\n## Gaps\n{gaps}\n"
        "## Next module\nCP-1\n"
    )


def handoff_rows(sid: str, url: str) -> str:
    gaps = f"The page states no date.\nBasis: {sid}"
    return handoff_md(f"| {sid} | {url} | Example | Undated | Issuer filing |", gaps)


def test_r3_a_dotted_host_citation_is_the_fetched_page(tmp_path: Path) -> None:
    assert _cited(tmp_path, f"https://{HOST}/a", f"https://{HOST}./a") == []


def test_r3_a_dotted_host_fetch_is_cited_by_the_plain_host(tmp_path: Path) -> None:
    assert _cited(tmp_path, f"https://{HOST}./a", f"https://{HOST}/a") == []


def test_r3_empty_path_before_a_query_is_one_address(tmp_path: Path) -> None:
    net = FakeNet({(HOST, "/?x=1"): ok(html("<p>a</p>"))})
    lookup = make(tmp_path, net)
    item = retained(lookup.fetch_page(f"https://{HOST}/?x=1"))
    found = weblookup.known_pages(tmp_path / "run")
    md = handoff_rows(item.source_id, f"https://{HOST}?x=1")
    assert weblookup.web_handoff_issues(md, found) == []


def test_r3_a_different_page_is_still_not_fetched(tmp_path: Path) -> None:
    issues = _cited(tmp_path, f"https://{HOST}/a", f"https://{HOST}./b")
    assert any("was not fetched in this run" in issue for issue in issues)


# C9-R4: every retained source id stays known, only the status is the latest per address --------


def _two_ids_one_address(tmp_path: Path) -> tuple[str, str]:
    net = FakeNet({(HOST, "/a"): ok(html("<p>one</p>")), (HOST, "/b"): ok(html("<p>two</p>"))})
    lookup = make(tmp_path, net)
    first = retained(lookup.fetch_page(f"https://{HOST}/a"))
    second = retained(lookup.fetch_page(f"https://{HOST}/b"))
    path = web_dir(tmp_path) / "index.jsonl"
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    rows[1]["url"] = f"https://{HOST}/a#x"  # an old index: the same address, changed bytes
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))
    assert first.source_id != second.source_id
    return first.source_id, second.source_id


def test_r4_known_pages_keeps_every_source_id(tmp_path: Path) -> None:
    a, b = _two_ids_one_address(tmp_path)
    assert sorted(weblookup.known_pages(tmp_path / "run")) == sorted([a, b])


def test_r4_a_handoff_citing_the_older_id_is_accepted(tmp_path: Path) -> None:
    a, _b = _two_ids_one_address(tmp_path)
    found = weblookup.known_pages(tmp_path / "run")
    issues = weblookup.web_handoff_issues(handoff_rows(a, f"https://{HOST}/a"), found)
    assert not [issue for issue in issues if "not a page retained in this run" in issue]


def test_r4_retained_pages_keeps_every_source_id(tmp_path: Path) -> None:
    a, b = _two_ids_one_address(tmp_path)
    assert sorted(p.source_id for p in weblookup.retained_pages(tmp_path / "run")) == sorted([a, b])


# C9-S1 and C9-S2: known_pages rebuilds what ModuleTools registers live -------------------------


def _delete_bodies(tmp_path: Path, suffix: str) -> None:
    for body in web_dir(tmp_path).glob(f"*.{suffix}"):
        body.unlink()


def test_s1_a_page_whose_body_is_gone_is_not_known(tmp_path: Path) -> None:
    lookup = make(tmp_path, FakeNet({(HOST, "/a"): ok(html("<p>one</p>"))}))
    retained(lookup.fetch_page(f"https://{HOST}/a"))
    _delete_bodies(tmp_path, "html")
    found = weblookup.known_pages(tmp_path / "run")
    assert (dict(found), found.rows) == ({}, ())
    live = _live_known(tmp_path)
    assert (dict(live), live.rows) == ({}, ())
    for host in (HOST, f"{HOST}."):
        url = f"https://{host}/a"
        row = f"| - | {url} | Example | Undated | Issuer filing |"
        expected = [
            (
                f'Sources row "-" cites {url}, which was not fetched in this run: '
                "fetch it with fetch_page or remove the row."
            )
        ]
        assert weblookup.web_handoff_issues(handoff_md(row), found) == expected
        assert weblookup.web_handoff_issues(handoff_md(row), live) == expected


def test_s1_one_id_with_two_bodies_keeps_the_readable_row(tmp_path: Path) -> None:
    body = b"Revenue rose."
    net = FakeNet({(HOST, "/a"): ok(body, "text/html"), (HOST, "/b"): ok(body, "text/plain")})
    lookup = make(tmp_path, net)
    sid = retained(lookup.fetch_page(f"https://{HOST}/a")).source_id
    assert retained(lookup.fetch_page(f"https://{HOST}/b")).source_id == sid
    _delete_bodies(tmp_path, "html")
    md = handoff_rows(sid, f"https://{HOST}/b")
    found = weblookup.known_pages(tmp_path / "run")
    assert weblookup.web_handoff_issues(md, found) == []
    assert weblookup.web_handoff_issues(md, _live_known(tmp_path)) == []


def test_s2_an_id_superseded_at_its_address_keeps_its_later_event_status(tmp_path: Path) -> None:
    meta = '<meta name="date" content="2099-09-01">'
    net = FakeNet(
        {(HOST, "/a"): ok(html("<p>one</p>", meta)), (HOST, "/b"): ok(html("<p>two</p>"))}
    )
    lookup = make(tmp_path, net)
    a = retained(lookup.fetch_page(f"https://{HOST}/a")).source_id
    retained(lookup.fetch_page(f"https://{HOST}/b"))
    path = web_dir(tmp_path) / "index.jsonl"
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    rows[1]["url"] = f"https://{HOST}/a#x"
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))
    found = weblookup.known_pages(tmp_path / "run")
    live = _live_known(tmp_path)
    bare = f"| {a} | - | Ex | 2099-09-01 | Issuer filing |"
    labelled = f"{bare[:-1]}| Later event |"
    expected = [
        (
            f"Sources row for {a} is a page dated after the cutoff: "
            'add the words "Later event" to the row.'
        )
    ]
    for known in (found, live):
        assert weblookup.web_handoff_issues(handoff_md(bare), known) == expected
        assert weblookup.web_handoff_issues(handoff_md(labelled), known) == []
    cited = handoff_md(f"| {a} | https://{HOST}/a | Ex | 2099-09-01 | Issuer filing |")
    assert weblookup.web_handoff_issues(cited, found) == weblookup.web_handoff_issues(cited, live)
