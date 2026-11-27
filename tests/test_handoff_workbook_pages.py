"""Workbook source pages show cell comments and hidden cells (S02 C2 fix, finding M3).

Workbooks are written by hand with zipfile; expected strings are literal."""

import io
import zipfile

from deploy_workflow.model import handoff

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RELS = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def _book(sheet_xml: str, cols: str = "", comments: str | None = None) -> bytes:
    parts = {
        "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/'
        'content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
        "_rels/.rels": f'<Relationships xmlns="{RELS}"><Relationship Id="r1" '
        f'Type="{OFFICE}/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        "xl/workbook.xml": f'<workbook xmlns="{MAIN}" xmlns:r="{OFFICE}"><sheets>'
        '<sheet name="Annual" sheetId="1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels": f'<Relationships xmlns="{RELS}"><Relationship Id="rId1" '
        f'Type="{OFFICE}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/worksheets/sheet1.xml": f'<worksheet xmlns="{MAIN}">{cols}'
        f"<sheetData>{sheet_xml}</sheetData></worksheet>",
    }
    if comments is not None:
        parts["xl/comments1.xml"] = comments
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, text in parts.items():
            archive.writestr(name, text)
    return buffer.getvalue()


NOTES = (
    "Workbook values are raw stored lexemes, not Excel display values. Formula caches may be "
    "absent or stale; no recalculation. Charts, drawings and embedded objects require separate "
    "visual review.\nWorkbook date system: 1900; date serials are retained without conversion."
)
HEAD = f"Sheet Annual\n{NOTES}\n"
ROWS = '<row r="2"><c r="B2"><v>20</v></c><c r="C2"><v>7</v></c></row>'
COMMENTS = (
    f'<comments xmlns="{MAIN}"><authors><author>J Smith</author></authors><commentList>'
    '<comment ref="B2" authorId="0"><text><r><t>RESTATED: prior figure was 25</t></r></text>'
    "</comment></commentList></comments>"
)


def test_plain_workbook_pages_are_unchanged() -> None:
    assert handoff._workbook_pages(_book(ROWS)) == [HEAD + "B2=20 | C2=7"]


def test_cell_comment_text_ref_and_author_are_in_the_pages() -> None:
    pages = handoff._workbook_pages(_book(ROWS, comments=COMMENTS))
    assert pages[0] == HEAD + "B2=20 | C2=7"  # earlier page numbers keep their text
    joined = "\n".join(pages)
    assert "RESTATED: prior figure was 25" in joined
    assert "B2" in pages[-1] and "J Smith" in pages[-1]
    assert len(pages) == 2


def test_hidden_column_cells_are_marked_and_visible_ones_are_not() -> None:
    cols = '<cols><col min="3" max="3" width="9" hidden="1"/></cols>'
    (page,) = handoff._workbook_pages(_book(ROWS, cols=cols))
    assert page == HEAD + "B2=20 | C2=7 hidden"


def _two_sheet_book() -> bytes:
    def sheet(value: str) -> str:
        return (
            f'<worksheet xmlns="{MAIN}"><sheetData><row r="2">'
            f'<c r="B2"><v>{value}</v></c></row></sheetData></worksheet>'
        )

    def note(author: str, text: str) -> str:
        return (
            f'<comments xmlns="{MAIN}"><authors><author>{author}</author></authors><commentList>'
            f'<comment ref="B2" authorId="0"><text><r><t>{text}</t></r></text></comment>'
            "</commentList></comments>"
        )

    def sheet_rels(target: str) -> str:
        return (
            f'<Relationships xmlns="{RELS}"><Relationship Id="rId1" '
            f'Type="{OFFICE}/comments" Target="{target}"/></Relationships>'
        )

    parts = {
        "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/'
        'content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
        "_rels/.rels": f'<Relationships xmlns="{RELS}"><Relationship Id="r1" '
        f'Type="{OFFICE}/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        "xl/workbook.xml": f'<workbook xmlns="{MAIN}" xmlns:r="{OFFICE}"><sheets>'
        '<sheet name="Annual" sheetId="1" r:id="rId1"/>'
        '<sheet name="Quarterly" sheetId="2" r:id="rId2"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels": f'<Relationships xmlns="{RELS}">'
        f'<Relationship Id="rId1" Type="{OFFICE}/worksheet" Target="worksheets/sheet1.xml"/>'
        f'<Relationship Id="rId2" Type="{OFFICE}/worksheet" Target="worksheets/sheet2.xml"/>'
        "</Relationships>",
        "xl/worksheets/sheet1.xml": sheet("1"),
        "xl/worksheets/sheet2.xml": sheet("2"),
        "xl/worksheets/_rels/sheet1.xml.rels": sheet_rels("../comments1.xml"),
        "xl/worksheets/_rels/sheet2.xml.rels": sheet_rels("../comments2.xml"),
        "xl/comments1.xml": note("A", "annual note"),
        "xl/comments2.xml": note("B", "quarterly restated"),
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, text in parts.items():
            archive.writestr(name, text)
    return buffer.getvalue()


def test_comments_on_two_sheets_name_their_own_sheet() -> None:
    last = handoff._workbook_pages(_two_sheet_book())[-1]
    assert last == (
        "Cell comments\nAnnual B2 by A: 'annual note'\nQuarterly B2 by B: 'quarterly restated'"
    )


def test_a_comment_with_no_resolvable_sheet_names_its_part() -> None:
    last = handoff._workbook_pages(_book(ROWS, comments=COMMENTS))[-1]
    assert last == "Cell comments\nxl/comments1.xml B2 by J Smith: 'RESTATED: prior figure was 25'"
