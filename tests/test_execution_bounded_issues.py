"""`bounded_issues` is a fixed point: re-bounding a bounded list keeps the hidden-issue count."""

import json

from deploy_vii.execution import COUNT_LINE, bounded_issues
from deploy_vii.live.tools import UNBACKED_ABSENCE, UNREAD_PAGE, Seen, unread_citation_issues


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
    rules19 = tuple(f"rule {n}" for n in range(19))
    combined = (*rules19, "6 further issues not listed", "validator 0", "validator 1")
    assert bounded_issues(combined) == (*combined[:20], "2 further issues not listed")


def test_short_list_with_a_count_line_is_unchanged() -> None:
    issues = ("a", "b", "c", "6 further issues not listed")
    assert bounded_issues(issues) == issues


def test_count_line_in_the_middle_is_left_where_it_is() -> None:
    issues = ("a", "6 further issues not listed", "b")
    assert bounded_issues(issues) == issues


def test_several_short_count_lines_are_unchanged() -> None:
    issues = ("a", "2 further issues not listed", "3 further issues not listed")
    assert bounded_issues(issues) == issues


def test_non_ascii_digits_and_overlong_lines_are_not_count_lines() -> None:
    first = tuple(f"issue {n}" for n in range(20))
    lookalikes = (
        "٦ further issues not listed",
        "9 further issues not listed" + "x" * 600,
        "src: 5 further cited pages not listed",
        "5 further issues not listed ",
    )
    assert bounded_issues((*first, *lookalikes)) == (*first, "4 further issues not listed")


def _unread() -> tuple[str, ...]:
    payload = json.dumps({"c": [{"source_id": "s1", "locator": f"page:{n}"} for n in range(30)]})
    return unread_citation_issues(payload, Seen())


_UNREAD_REST = "Cited page not read through read_pages: 11 further cited pages not listed"
_VALIDATOR = (*(f"validator {n}" for n in range(19)), "3 further issues not listed")


def test_validator_list_composed_with_the_unread_list_keeps_the_full_count() -> None:
    unread = _unread()
    assert len(unread) == 20
    assert unread[-1] == _UNREAD_REST
    result = bounded_issues((*_VALIDATOR, *unread))
    assert result[:20] == _VALIDATOR
    assert result[20:] == ("30 further issues not listed",)
    assert len(result) == 21


def test_zero_count_lines_are_kept_or_dropped_as_written() -> None:
    assert bounded_issues(("0 further issues not listed",)) == ("0 further issues not listed",)
    two = ("a", "0 further issues not listed")
    assert bounded_issues(two) == two
    real = tuple(f"issue {n}" for n in range(20))
    assert bounded_issues((*real, "0 further issues not listed")) == real


def test_rebounding_composed_and_plain_results_is_a_fixed_point() -> None:
    composed = bounded_issues((*_VALIDATOR, *_unread()))
    assert bounded_issues(composed) == composed
    plain = bounded_issues(tuple(f"issue {n}" for n in range(45)))
    assert bounded_issues(plain) == plain


def test_overlong_line_in_a_short_list_is_shortened() -> None:
    long_line = "y" * 700
    assert bounded_issues(("a", long_line)) == ("a", long_line[:599] + "…")


def test_cpdr_shaped_list_counts_every_hidden_line() -> None:
    absence = "Absence claim without a recorded search"
    lines = (
        *(f"v{n}" for n in range(20)),
        "5 further issues not listed",
        *(f"{absence}: x{n}" for n in range(19)),
        f"{absence}: 8 further absence claims not listed",
        *_unread(),
    )
    assert len(lines) == 61
    result = bounded_issues(lines)
    assert result == (*lines[:20], "62 further issues not listed")


def test_prefixed_count_line_within_the_first_twenty_stays_verbatim() -> None:
    unread = _unread()
    assert bounded_issues((*unread, "extra")) == (*unread, "1 further issues not listed")


def test_count_line_prefixes_match_the_producers() -> None:
    for prefix, noun in ((UNREAD_PAGE, "cited pages"), (UNBACKED_ABSENCE, "absence claims")):
        assert COUNT_LINE.fullmatch(f"{prefix}: 4 further {noun} not listed")
