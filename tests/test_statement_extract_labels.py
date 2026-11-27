"""Label candidates of extracted statement lines (expected values written by hand)."""

from deploy_vii.statement_extract import extract_statement_lines

NOTE_PAGE = """Income statement
                      Note    2026     2025
Cost of sales    4, 5    (500)    (450)
Equity   7   $ 100"""


def _row(table, label):
    return next(line for line in table.lines if line.label == label)


def test_note_reference_row_last_candidate_is_the_final_label() -> None:
    table = extract_statement_lines(NOTE_PAGE, "p1")
    row = _row(table, "Cost of sales")
    assert row.label_candidates[-1].text == "Cost of sales"
    assert row.label_candidates[-1].line_no == row.line_no


def test_bare_number_kept_in_label_is_the_last_candidate() -> None:
    page = """                      Note    2026     2025
Equity   7   $ 100"""
    table = extract_statement_lines(page, "p1")
    row = table.lines[0]
    assert row.label == "Equity 7"
    assert row.label_candidates[-1].text == "Equity 7"


def test_unreadable_numeric_row_bounds_the_label_walk() -> None:
    page = """                      2026     2025
Revenue  10  20
Net margin  -12.5  -13.0
Total assets  5  6"""
    table = extract_statement_lines(page, "p1")
    assert [part.line_no for part in table.omitted] == [3]
    row = _row(table, "Total assets")
    assert [(p.line_no, p.text) for p in row.label_candidates] == [(4, "Total assets")]
