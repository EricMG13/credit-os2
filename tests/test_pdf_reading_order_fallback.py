"""Keep usable Form XObject text when the PDF layout extraction is empty."""

import io

import pytest
from pypdf import PdfReader
from test_pdf_form_text import FORM_ONLY, make_form

from deploy_vii import preparation
from deploy_workflow.model import handoff


def test_agreement_words_survive_layout_without_text() -> None:
    raw = make_form(FORM_ONLY, b"BT /F1 12 Tf 72 600 Td (Executed by Acme) Tj ET")
    page = PdfReader(io.BytesIO(raw)).pages[0]
    assert not page.extract_text(extraction_mode="layout", layout_mode_strip_rotated=False).strip()
    plain = page.extract_text()
    assert plain == "Executed by Acme"

    assert handoff._read_pages("agreement.pdf", raw) == [plain]
    result = preparation.pdf_content(raw)
    assert result.spans[0].text == plain
    assert result.coverage[0].status == "retained"
    assert result.coverage[0].limitation == preparation.PLAIN_ONLY


@pytest.mark.parametrize("form_text", [b"", b"   ", b"... ---", b"12"])
def test_form_without_letters_reaches_ocr(
    form_text: bytes, monkeypatch: pytest.MonkeyPatch
) -> None:
    raw = make_form(FORM_ONLY, b"BT /F1 12 Tf 72 600 Td (" + form_text + b") Tj ET")
    page = PdfReader(io.BytesIO(raw)).pages[0]
    assert page.extract_text().strip() == form_text.strip().decode("ascii")
    monkeypatch.setattr(preparation.shutil, "which", lambda _name: None)

    assert handoff._read_pages("agreement.pdf", raw) == [""]
    result = preparation.pdf_content(raw)
    assert result.spans[0].text == ""
    assert result.coverage[0].status == "empty"
    assert result.coverage[0].limitation == preparation.OCR_UNAVAILABLE
