"""list_sources shows an id's latest index row at its address (S02 C2 fix, finding M1)."""

from dataclasses import replace
from pathlib import Path

from deploy_workflow.model.handoff import ModuleTools
from deploy_workflow.research.weblookup import Retained
from tests.test_handoff_loop import check, task


class Pages:
    """Returns fixed page text and counts reads: a repeat id must not be read again."""

    def __init__(self) -> None:
        self.reads = 0

    def page_text(self, _item: Retained) -> list[str]:
        self.reads += 1
        return ["page one"]


def _row(status: str, stated: str | None, url: str = "https://www.sec.gov/a") -> Retained:
    return Retained(
        source_id="W1",
        url=url,
        final_url=url,
        fetched_at="2024-10-01T00:00:00Z",
        sha256="ab" * 32,
        bytes=10,
        content_type="text/html",
        page_date=stated,
        page_date_source="filing_list" if stated else None,
        cutoff="2024-09-30",
        status=status,
        tool="fetch_page",
        module="CP-2",
    )


def test_a_redated_row_replaces_the_first_row_in_list_sources(tmp_path: Path) -> None:
    module = ModuleTools(task(), tmp_path, check)
    pages = Pages()
    first = _row("usable", None)
    later = replace(_row("later-event", "2024-11-02"), tool="sec_filing_list")
    module._register(pages, first)  # type: ignore[arg-type]
    module._register(pages, later)  # type: ignore[arg-type]
    listed = module.list_sources().splitlines()
    assert any(
        "W1:" in line and "stated_date=2024-11-02" in line and "status=later-event" in line
        for line in listed
    )
    assert not any("status=usable" in line for line in listed)
    assert module.sources["W1"]["web"] is later
    assert pages.reads == 1


def test_the_same_bytes_at_another_address_keep_the_first_row(tmp_path: Path) -> None:
    module = ModuleTools(task(), tmp_path, check)
    pages = Pages()
    module._register(pages, _row("usable", None))  # type: ignore[arg-type]
    module._register(pages, _row("later-event", "2024-11-02", "https://www.sec.gov/b"))  # type: ignore[arg-type]
    assert "status=usable" in module.list_sources()
