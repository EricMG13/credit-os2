"""`bounded_issues` is a fixed point: re-bounding a bounded list keeps the hidden-issue count."""

from deploy_vii.execution import bounded_issues


def test_unbounded_input_keeps_twenty_lines_and_a_count() -> None:
    issues = tuple(f"issue {n}" for n in range(45))
    result = bounded_issues(issues)
    assert len(result) == 21
    assert result[0] == "issue 0"
    assert result[19] == "issue 19"
    assert result[20] == "25 further issues not listed"


def test_rebounding_a_bounded_list_leaves_it_unchanged() -> None:
    once = bounded_issues(tuple(f"issue {n}" for n in range(45)))
    twice = bounded_issues(once)
    assert twice == once
    assert twice[-1] == "25 further issues not listed"


def test_exactly_twenty_one_plain_issues_are_still_bounded() -> None:
    result = bounded_issues(tuple(f"issue {n}" for n in range(21)))
    assert len(result) == 21
    assert result[-1] == "1 further issues not listed"
    assert result[19] == "issue 19"


def test_embedded_count_line_is_folded_into_the_total() -> None:
    rules = (*(f"rule {n}" for n in range(19)), "6 further issues not listed")
    combined = (*rules, "validator 0", "validator 1")
    result = bounded_issues(combined)
    assert len(result) == 21
    assert result[:19] == tuple(f"rule {n}" for n in range(19))
    assert result[19] == "validator 0"
    assert result[-1] == "7 further issues not listed"


def test_short_list_with_a_count_line_is_unchanged() -> None:
    issues = ("a", "b", "c", "6 further issues not listed")
    assert bounded_issues(issues) == issues


def test_count_line_in_the_middle_moves_to_the_end() -> None:
    assert bounded_issues(("a", "6 further issues not listed", "b")) == (
        "a",
        "b",
        "6 further issues not listed",
    )


def test_several_count_lines_are_summed() -> None:
    result = bounded_issues(("a", "2 further issues not listed", "3 further issues not listed"))
    assert result == ("a", "5 further issues not listed")


def test_non_ascii_digits_and_overlong_lines_are_not_count_lines() -> None:
    arabic = "٦ further issues not listed"
    long_line = "9 further issues not listed" + "x" * 600
    assert bounded_issues((arabic, long_line)) == (arabic, long_line[:599] + "…")
