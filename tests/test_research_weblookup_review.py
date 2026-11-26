"""Review findings C9-F1 and C9-F3 on the web lookup core (C9-F2 is not covered here). Offline: the
fakes of test_weblookup stand in for the network; expected values are literal."""

import hashlib
from pathlib import Path

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
        "## Findings\nNet sales rose.\n## Calculations\nNone\n## Gaps\nNone.\n"
        "## Next module\nCP-1\n"
    )
    assert weblookup.web_handoff_issues(md, found) == []


def test_f1_retained_pages_gives_the_latest_row_of_an_address(tmp_path: Path) -> None:
    _redated_run(tmp_path)
    page = next(p for p in weblookup.retained_pages(tmp_path / "run") if p.url == FILING_URL)
    assert (page.status, page.page_date) == ("usable", "2024-11-01")


def test_f1_known_pages_gives_the_latest_row_of_an_address(tmp_path: Path) -> None:
    item = _redated_run(tmp_path)
    found = weblookup.known_pages(tmp_path / "run")
    assert found[item.source_id][0].status == "usable"


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
        "## Findings\nNet sales rose.\n## Calculations\nNone\n## Gaps\nNone.\n"
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
