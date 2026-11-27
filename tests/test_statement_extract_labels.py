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


def _candidates(table, label):
    return [(p.line_no, p.text) for p in _row(table, label).label_candidates]


def test_wrapped_label_ending_in_a_year_is_kept_as_a_candidate() -> None:
    page = """BALANCE SHEET
                                   2025        2024
Senior secured notes due 2031
  net of issuance costs              500         450
Total debt                           500         450
"""
    table = extract_statement_lines(page, "p1")
    assert _candidates(table, "net of issuance costs") == [
        (3, "Senior secured notes due 2031"),
        (4, "net of issuance costs"),
    ]
    assert [part.line_no for part in table.omitted] == [3]


def test_one_value_row_above_bounds_the_label_walk() -> None:
    page = """                      2026     2025
Revenue  10  20
Total equity  500
Total assets  5  6"""
    table = extract_statement_lines(page, "p1")
    assert _candidates(table, "Total assets") == [(4, "Total assets")]


def test_title_naming_the_years_left_of_the_columns_keeps_the_year_column() -> None:
    page = """Balance sheet 2025 2024
                                 Note    2025      2024
Revenue                          5      1,000       900
Cost of sales                   (300)  (280)"""
    row = _row(extract_statement_lines(page, "p1"), "Revenue")
    assert row.raw_values == ("1,000", "900")
    assert row.flags == ("footnote_marker",)


def test_title_naming_more_years_than_columns_does_not_set_the_year_count() -> None:
    page = """CONSOLIDATED STATEMENT OF INCOME
For the years ended December 31, 2026, 2025 and 2024

                                   2026        2025
Revenue                 (1)         500         400
Cost of sales                      (300)       (280)"""
    row = _row(extract_statement_lines(page, "p1"), "Revenue")
    assert row.raw_values == ("500", "400")
    assert row.flags == ("footnote_marker",)


def test_indented_two_line_period_header_counts_the_year_line_columns() -> None:
    page = """              Three months ended June 30,    Nine months ended June 30,
                   2025      2024              2025      2024
Revenue   (1)      1         2                 3         4"""
    row = _row(extract_statement_lines(page, "p1"), "Revenue")
    assert row.raw_values == ("1", "2", "3", "4")
    assert row.flags == ("footnote_marker",)


def test_page_without_headers_keeps_prose_wrap_and_bounds_by_value_rows() -> None:
    page = """Revenue   (1)   500   400
Senior notes due 2031
  net of costs   10   20
Cost  1.234  5"""
    table = extract_statement_lines(page, "p1")
    revenue = _row(table, "Revenue")
    assert revenue.raw_values == ("(1)", "500", "400")
    assert revenue.values == (-1, 500, 400)
    assert revenue.flags == ()
    assert _candidates(table, "net of costs") == [
        (2, "Senior notes due 2031"),
        (3, "net of costs"),
    ]
    assert _row(table, "Cost").flags == ("ambiguous_separator",)
    assert [part.line_no for part in table.omitted] == [2]


def test_prose_wraps_ending_in_numbers_stay_label_candidates() -> None:
    coupon = """                      2026     2025
Senior notes 6.75% 2031
  net of costs    500    450"""
    assert _candidates(extract_statement_lines(coupon, "p1"), "net of costs") == [
        (2, "Senior notes 6.75% 2031"),
        (3, "net of costs"),
    ]
    footnoted = """                      2026     2025
Revenue (1)
  net of returns    500    450"""
    assert _candidates(extract_statement_lines(footnoted, "p1"), "net of returns") == [
        (2, "Revenue (1)"),
        (3, "net of returns"),
    ]
    percent = """                      2026     2025
Senior notes, 6.75%
  due 2031    500    450"""
    assert _candidates(extract_statement_lines(percent, "p1"), "due 2031") == [
        (2, "Senior notes, 6.75%"),
        (3, "due 2031"),
    ]
