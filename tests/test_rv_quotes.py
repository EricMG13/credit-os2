"""rv_quotes refuses a percent-formatted level cell (S10-2-3)."""

import io

from openpyxl import Workbook

from deploy_vii.inputs.rv_quotes import COLUMNS, validate_rv_bytes

ROW = {
    "provider": "Dealer A",
    "as_of": "2026-10-30",
    "issuer": "Example Issuer",
    "facility_id": "TLB-2030",
    "instrument": "Term Loan B due 2030",
    "quote_kind": "observed",
    "price": "",
    "currency": "USD",
}


def workbook(yield_cell: object, code: str | None = None) -> bytes:
    book = Workbook()
    sheet = book.active
    assert sheet is not None
    sheet.title = "rv_quotes"
    sheet.append(list(COLUMNS))
    sheet.append([yield_cell if name == "yield_pct" else ROW.get(name) for name in COLUMNS])
    for cell in sheet[2]:
        if isinstance(cell.value, str):
            cell.number_format = "@"
    if code is not None:
        sheet.cell(2, COLUMNS.index("yield_pct") + 1).number_format = code
    out = io.BytesIO()
    book.save(out)
    return out.getvalue()


def test_plain_number_is_accepted() -> None:
    assert validate_rv_bytes("quotes.xlsx", workbook(8.5)).ok


def test_typed_percent_text_is_refused() -> None:
    assert not validate_rv_bytes("quotes.xlsx", workbook("8.5%")).ok


def test_percent_formatted_cell_is_refused() -> None:
    result = validate_rv_bytes("quotes.xlsx", workbook(0.085, "0.00%"))
    assert not result.ok
    assert [i.cell for i in result.issues] == ["H2"]
    assert "percentage" in result.issues[0].problem
