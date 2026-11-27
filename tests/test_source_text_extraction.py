"""Source text the modules cite verbatim: docx, HTML line text and inline-XBRL parsing (S03 C14)."""

import io
import time
import zipfile

import pytest
from test_docx_text import docx, para

from deploy_workflow import inline_xbrl
from deploy_workflow.docx_text import docx_text
from deploy_workflow.html_text import convert_html

MC = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'


def _alternate_text_box(text: str) -> str:
    inner = f"<w:txbxContent>{para(f'<w:t>{text}</w:t>')}</w:txbxContent>"
    return (
        f"<mc:AlternateContent {MC}><mc:Choice><w:drawing>{inner}</w:drawing></mc:Choice>"
        f"<mc:Fallback><w:pict>{inner}</w:pict></mc:Fallback></mc:AlternateContent>"
    )


def test_a_word_text_box_is_read_once_not_per_choice_and_fallback() -> None:
    body = (
        "<w:p><w:r><w:t>Before</w:t></w:r><w:r>"
        + _alternate_text_box("Boxed revenue 100")
        + "</w:r></w:p>"
    )
    assert docx_text(docx(body)) == "Before Boxed revenue 100"


def test_a_text_box_inside_a_table_cell_is_read_once() -> None:
    paragraph = (
        "<w:p><w:r><w:t>Cell</w:t></w:r><w:r>" + _alternate_text_box("Boxed 7") + "</w:r></w:p>"
    )
    next_cell = para("<w:t>Next</w:t>")
    body = f"<w:tbl><w:tr><w:tc>{paragraph}</w:tc><w:tc>{next_cell}</w:tc></w:tr></w:tbl>"
    assert docx_text(docx(body)) == "Cell Boxed 7 | Next"


def test_a_fallback_alone_is_read_when_there_is_no_choice() -> None:
    body = (
        f"<w:p><w:r><mc:AlternateContent {MC}><mc:Fallback><w:t>Only fallback</w:t></mc:Fallback>"
        "</mc:AlternateContent></w:r></w:p>"
    )
    assert docx_text(docx(body)) == "Only fallback"


def test_a_non_breaking_hyphen_is_read_as_an_ascii_hyphen() -> None:
    body = "<w:p><w:r><w:t>A</w:t><w:noBreakHyphen/><w:t>B</w:t></w:r></w:p>"
    assert docx_text(docx(body)) == "A-B"


def test_a_docx_without_document_xml_is_refused_with_value_error() -> None:
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
    raw = out.getvalue()
    with pytest.raises(ValueError, match="word/document.xml"):
        docx_text(raw)


def test_docx_pins_unchanged_cases() -> None:
    cell = "<w:tc>" + para("<w:t>p1</w:t>") + para("<w:t>p2</w:t>") + "</w:tc>"
    nested = (
        "<w:tc>"
        + para("<w:t>o</w:t>")
        + f"<w:tbl><w:tr><w:tc>{para('<w:t>in</w:t>')}</w:tc></w:tr></w:tbl></w:tc>"
    )
    body = (
        para(
            "<w:t>Net </w:t>", '<w:t xml:space="preserve">7,940.</w:t>', "<w:tab/>", "<w:t>x</w:t>"
        )
        + f"<w:tbl><w:tr>{cell}</w:tr><w:tr>{nested}</w:tr></w:tbl>"
        + para("<w:t>keep</w:t>", "<w:delText>gone</w:delText>", "<w:br/>", "<w:t>end</w:t>")
    )
    assert docx_text(docx(body)) == "Net 7,940.\tx\np1 p2\no in\nkeep\nend"


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        (
            (
                "<table><tr><td>A</td><td>1</td></tr>"
                "<tr><td>B</td><td style='display:none'>x</td><td>2</td></tr></table>"
            ),
            "A 1\nB 2\n",
        ),
        (
            "<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul><p>one</p><p>two</p>",
            "a\nb\nc\none\ntwo\n",
        ),
        ("<p>one<p>two<p>three", "one\ntwo\nthree\n"),
        ("<table><tr><td>a<td>b<tr><td>c<td>d</table>", "a b\nc d\n"),
        ("<div style='display:none'><p>x<p>y</div><p>shown</p>", "shown\n"),
        ("<p>a <span style='display:none'>h</span> b</p>", "a b\n"),
    ],
)
def test_html_text_pins_unchanged_cases(html: str, expected: str) -> None:
    assert convert_html(html.encode()).text == expected


_XBRL = (
    "<html><body><ix:header><ix:resources>"
    '<xbrli:context id="c1"><xbrli:entity><xbrli:identifier scheme="s">E1</xbrli:identifier>'
    "</xbrli:entity><xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate>"
    "<xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period></xbrli:context>"
    '<xbrli:unit id="u"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>'
    "</ix:resources></ix:header>"
    '<table><tr><td><ix:nonFraction id="f1" name="n:Rev" contextRef="c1" unitRef="u" scale="6">'
    "1,234.5</ix:nonFraction></td>"
    '<td><ix:nonFraction id="f2" name="n:C" contextRef="c1" unitRef="u" sign="-">'
    "<ix:exclude>x</ix:exclude>7</ix:nonFraction><br><img src=x></td></tr></table>"
    "</body></html>"
)


def test_inline_xbrl_parse_output_is_pinned_on_well_formed_input() -> None:
    document = inline_xbrl.parse(_XBRL.encode())
    assert [
        (f.fact_id, f.concept, f.lexeme, f.scale, f.negative, f.table, f.row)
        for f in document.facts
    ] == [("f1", "n:Rev", "1,234.5", 6, False, 0, 0), ("f2", "n:C", "7", 0, True, 0, 0)]
    assert document.units == {"u": ("iso4217:USD",)}
    assert inline_xbrl.period_lines(document) == (
        "XBRL context c1; entity E1; scheme s; duration 2024-01-01 through 2024-12-31",
    )


def test_inline_xbrl_reads_the_same_after_base_embed_and_source_tags() -> None:
    html = (
        '<html><body><base href="x"><embed src="y"><source src="z">'
        '<ix:nonFraction id="f" name="n" contextRef="c" unitRef="u"><ix:exclude>skip</ix:exclude>'
        "5</ix:nonFraction></body></html>"
    )
    assert [f.lexeme for f in inline_xbrl.parse(html.encode()).facts] == ["5"]


def test_inline_xbrl_parse_time_is_linear_on_many_unclosed_paragraphs() -> None:
    html = "<html><body><ix:header></ix:header>" + "<p>x" * 40_000 + "</body></html>"
    started = time.perf_counter()
    inline_xbrl.parse(html.encode())
    assert time.perf_counter() - started < 1.0


def _alternate_text_box_paragraphs(*texts: str) -> str:
    inner = "<w:txbxContent>" + "".join(para(f"<w:t>{t}</w:t>") for t in texts) + "</w:txbxContent>"
    return (
        f"<mc:AlternateContent {MC}><mc:Choice><w:drawing>{inner}</w:drawing></mc:Choice>"
        f"<mc:Fallback><w:pict>{inner}</w:pict></mc:Fallback></mc:AlternateContent>"
    )


def test_text_box_paragraphs_in_a_cell_are_separated_by_spaces() -> None:
    box = _alternate_text_box_paragraphs("Revenue", "2023", "1,234")
    paragraph = f"<w:p><w:r><w:t>Cell</w:t></w:r><w:r>{box}</w:r></w:p>"
    next_cell = para("<w:t>Next</w:t>")
    body = f"<w:tbl><w:tr><w:tc>{paragraph}</w:tc><w:tc>{next_cell}</w:tc></w:tr></w:tbl>"
    assert docx_text(docx(body)) == "Cell Revenue 2023 1,234 | Next"


def test_text_box_paragraphs_in_the_body_are_separated_by_spaces() -> None:
    box = _alternate_text_box_paragraphs("Revenue", "2023", "1,234")
    body = f"<w:p><w:r><w:t>Before</w:t></w:r><w:r>{box}</w:r><w:r><w:t>After</w:t></w:r></w:p>"
    assert docx_text(docx(body)) == "Before Revenue 2023 1,234 After"


def test_a_deleted_no_break_hyphen_is_not_read_so_the_sign_is_not_flipped() -> None:
    body = (
        "<w:p><w:del><w:r><w:noBreakHyphen/></w:r></w:del>"
        "<w:ins><w:r><w:t>5.8</w:t></w:r></w:ins></w:p>"
    )
    assert docx_text(docx(body)) == "5.8"


def test_a_text_box_inside_a_deleted_or_moved_run_is_not_read() -> None:
    box = _alternate_text_box("k")
    deleted = f"<w:p><w:r><w:t>gone</w:t></w:r><w:del><w:r>{box}</w:r></w:del></w:p>"
    moved = f"<w:p><w:r><w:t>gone</w:t></w:r><w:moveFrom><w:r>{box}</w:r></w:moveFrom></w:p>"
    assert docx_text(docx(deleted)) == "gone"
    assert docx_text(docx(moved)) == "gone"


def test_a_text_box_mid_sentence_keeps_the_host_paragraph_on_one_line() -> None:
    body = (
        '<w:p><w:r><w:t xml:space="preserve">Revenue was </w:t></w:r><w:r>'
        + _alternate_text_box("note")
        + '</w:r><w:r><w:t xml:space="preserve"> 5.8 m</w:t></w:r></w:p>'
    )
    assert docx_text(docx(body)) == "Revenue was note 5.8 m"


def test_docx_pins_inserted_and_hyphen_text_unchanged() -> None:
    body = (
        "<w:p><w:ins><w:r><w:t>new </w:t></w:r></w:ins><w:r><w:noBreakHyphen/>"
        "<w:t>5</w:t></w:r></w:p>"
    )
    assert docx_text(docx(body)) == "new -5"


def test_deeply_nested_wrappers_in_a_cell_do_not_overflow_the_stack() -> None:
    depth = 3000
    wrapped = (
        "<w:sdt><w:sdtContent>" * depth
        + para("<w:t>deep</w:t>")
        + "</w:sdtContent></w:sdt>" * depth
    )
    body = f"<w:tbl><w:tr><w:tc>{wrapped}</w:tc></w:tr></w:tbl>"
    assert docx_text(docx(body)) == "deep"
