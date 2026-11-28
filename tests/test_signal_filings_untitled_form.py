"""A filing entry whose title has no usable form and no category keeps its whole title."""

from datetime import UTC, datetime

from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.filings import story_entry


def _entry(title: str, category: str | None = None) -> Entry:
    when = datetime(2026, 11, 24, 21, 5, tzinfo=UTC)
    return Entry(title, "https://www.sec.gov/x-index.htm", when, "", category)


def test_a_title_whose_head_is_not_a_form_is_kept_whole():
    story = story_entry("Acme", _entry("Annual report of the company - Details follow"))
    assert story.title == "Acme: Annual report of the company - Details follow"


def test_a_title_with_a_form_head_still_names_the_form():
    story = story_entry("Acme", _entry("8-K - Current report"))
    assert story.title == "Acme: 8-K, current report"
