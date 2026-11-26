"""The feed parser's DTD refusal is limited to the document prolog: a DOCTYPE written inside an
item's CDATA or a comment is text, not a declaration."""

import pytest

from deploy_workflow.signal.feeds import FeedError, parse_feed

_ITEM = (
    "<item><title>Alpha</title><link>https://example.com/a</link>"
    "<description><![CDATA[<!DOCTYPE html><p>Body</p>]]></description></item>"
    "<item><title>Beta</title><link>https://example.com/b</link><!-- <!DOCTYPE html> -->"
    "<description>Two</description></item>"
)


def _rss(prolog: str = "") -> bytes:
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>{prolog}<rss version="2.0"><channel>'
        f"<title>T</title>{_ITEM}</channel></rss>"
    ).encode()


def test_a_doctype_inside_cdata_or_a_comment_in_an_item_does_not_fail_the_feed():
    entries = parse_feed(_rss())
    assert [(e.title, e.link) for e in entries] == [
        ("Alpha", "https://example.com/a"),
        ("Beta", "https://example.com/b"),
    ]


def test_a_doctype_in_a_comment_in_the_prolog_does_not_fail_the_feed():
    entries = parse_feed(_rss("<!-- <!DOCTYPE html> --><?pi x?>"))
    assert [e.title for e in entries] == ["Alpha", "Beta"]


_LAUGHS = (
    b'<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol">'
    b'<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">]>'
    b"<rss><channel><item><title>&lol2;</title><link>https://example.com/a</link></item>"
    b"</channel></rss>"
)
_XXE = (
    b'<?xml version="1.0"?><!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>'
    b"<rss><channel><item><title>&xxe;</title><link>https://example.com/a</link></item>"
    b"</channel></rss>"
)


@pytest.mark.parametrize(
    "body",
    [
        _LAUGHS,
        _XXE,
        b"<!doctype rss><rss/>",
        b"<!-- c --><?pi x?>\n<!DOCTYPE rss><rss/>",
        b"<!ENTITY a 'b'><rss/>",
    ],
)
def test_a_doctype_or_entity_declaration_in_the_prolog_is_refused(body):
    with pytest.raises(FeedError, match="DTD or entities"):
        parse_feed(body)


_BOM = b"\xef\xbb\xbf"
_DTD_BODY = b'<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "b">]><rss/>'


@pytest.mark.parametrize(
    "body",
    [b"\n" + _BOM + _DTD_BODY, _BOM + _BOM + _DTD_BODY, _BOM + b" " + _BOM + b"\r\n" + _DTD_BODY],
)
def test_a_dtd_behind_whitespace_and_boms_is_refused_before_the_parser_is_made(body, monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("the parser was created")

    monkeypatch.setattr("deploy_workflow.signal.feeds.ET.XMLParser", fail)
    with pytest.raises(FeedError, match="DTD or entities"):
        parse_feed(body)


def test_a_line_break_then_a_bom_before_a_feed_without_a_dtd_still_parses():
    entries = parse_feed(b"\n" + _BOM + _rss())
    assert [e.title for e in entries] == ["Alpha", "Beta"]
