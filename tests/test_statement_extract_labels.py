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


TITLE_PAGE = """CONSOLIDATED STATEMENT OF INCOME
For the years ended December 31, 2025 and 2024

                                   2025        2024
Revenue                 (1)         500         450
Cost of sales                      (300)       (280)"""


def test_title_line_naming_the_years_does_not_double_the_year_count() -> None:
    row = _row(extract_statement_lines(TITLE_PAGE, "page:1"), "Revenue")
    assert row.raw_values == ("500", "450")
    assert row.values == (500, 450)
    assert row.flags == ("footnote_marker",)


def test_title_line_naming_the_years_still_flags_extra_values() -> None:
    page = TITLE_PAGE.replace("(1)         500         450", "500  450  400  350")
    row = _row(extract_statement_lines(page, "page:1"), "Revenue")
    assert row.flags == ("more_values_than_header_years",)


def test_two_line_period_header_counts_the_columns_of_the_year_line() -> None:
    page = """Three months ended          Nine months ended
2025   2024   2025   2024
Revenue   1   2   3   4"""
    row = _row(extract_statement_lines(page, "page:1"), "Revenue")
    assert row.raw_values == ("1", "2", "3", "4")
    assert row.flags == ()


def test_title_line_without_years_is_unchanged() -> None:
    page = TITLE_PAGE.replace(", 2025 and 2024", "")
    row = _row(extract_statement_lines(page, "page:1"), "Revenue")
    assert row.values == (500, 450)
    assert row.flags == ("footnote_marker",)
