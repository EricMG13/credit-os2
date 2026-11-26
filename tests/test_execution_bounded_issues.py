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
