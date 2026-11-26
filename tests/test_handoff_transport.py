"""Producer-scoped compact handoff transport and UTF-8 byte cursor behavior."""

import hashlib
import json
from dataclasses import replace
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace

import pytest

from deploy_vii.inputs.csv_text import CsvDecodeError
from deploy_workflow.model.handoff import HandoffExecutor, ModuleTools, _pages, _read_pages
from deploy_workflow.model.handoff_transport import (
    MAX_CHUNK_BYTES,
    MAX_HEADING_CHARS,
    MAX_INDEXED_HEADINGS,
    compact_index,
    heading_index,
    read_handoff,
    reader_excerpts,
)
from deploy_workflow.model.turn import Message, ToolCall, TurnRequest
from deploy_workflow.run_events import EVENTS, read_events
from tests.test_handoff_loop import GOOD, Adapter, check, task, turn


def test_index_has_full_digest_heading_offsets_and_only_complete_short_excerpts() -> None:
    raw = (
        "## Findings\n\n### Bottom line\n\nCredit is stable.\n\n"
        "### Key findings\n\nLeverage is 2.0x.\n\n"
        "### Contrary evidence\n\nCovenant headroom is narrowing.\n\n"
        "### Limitations\n\nForecast is unaudited.\n\n"
        "### Other\n\n" + "x" * 700
    ).encode()
    index = compact_index({"CP-1": raw})["CP-1"]
    assert index["sha256"] == hashlib.sha256(raw).hexdigest()
    assert index["headings"] == heading_index(raw)
    assert len(index["headings"]) == 6
    excerpts = index["reader_excerpts"]
    assert excerpts == {
        "bottom line": "### Bottom line\n\nCredit is stable.",
        "key findings": "### Key findings\n\nLeverage is 2.0x.",
        "contrary evidence": "### Contrary evidence\n\nCovenant headroom is narrowing.",
        "limitations": "### Limitations\n\nForecast is unaudited.",
    }
    assert "markdown" not in index


def test_read_handoff_returns_exact_bounded_chunks_with_byte_cursors() -> None:
    raw = ("a" * (MAX_CHUNK_BYTES - 1) + "€" + "tail").encode()
    first = read_handoff({"CP-1": raw}, "CP-1", 0)
    body = first.split("\n\n", 1)[1]
    assert body.encode() == raw[: MAX_CHUNK_BYTES - 1]
    assert "next_cursor: 10239" in first
    second = read_handoff({"CP-1": raw}, "CP-1", MAX_CHUNK_BYTES - 1)
    assert second.split("\n\n", 1)[1].encode() == raw[MAX_CHUNK_BYTES - 1 :]
    assert "next_cursor: None" in second


def test_read_handoff_refuses_unknown_producers_and_non_boundary_cursors() -> None:
    handoffs = {"CP-1": "évidence".encode()}
    assert read_handoff(handoffs, "CP-9", 0).startswith("ERROR:")
    assert read_handoff(handoffs, "CP-1", 1).startswith("ERROR:")
    assert read_handoff(handoffs, "CP-1", True).startswith("ERROR:")


def test_heading_byte_offsets_count_utf8_bytes() -> None:
    raw = "évidence\n## Findings\n".encode()
    (heading,) = heading_index(raw)
    assert heading["byte_offset"] == len("évidence\n".encode())


def test_long_reader_section_is_omitted_whole() -> None:
    raw = ("### Bottom line\n\n" + "x" * 700 + "\n\n### Limitations\n\nUnknown.").encode()
    assert reader_excerpts(raw) == {"limitations": "### Limitations\n\nUnknown."}


def test_full_contrary_heading_is_a_complete_excerpt() -> None:
    raw = (
        b"### Contrary evidence and what would change the view\n\n"
        b"A covenant breach would reverse the view.\n"
    )
    assert reader_excerpts(raw) == {
        "contrary evidence and what would change the view": (
            "### Contrary evidence and what would change the view\n\n"
            "A covenant breach would reverse the view."
        )
    }


def test_reader_excerpt_includes_nested_headings_until_the_section_ends() -> None:
    raw = (
        b"### Bottom line\n\nRisk is stable.\n\n#### Rationale\n\nMargins hold.\n\n"
        b"### Limitations\n\nNone."
    )
    assert reader_excerpts(raw)["bottom line"] == (
        "### Bottom line\n\nRisk is stable.\n\n#### Rationale\n\nMargins hold."
    )


def test_heading_manifest_is_bounded_and_counts_the_full_document() -> None:
    raw = ("\n".join(f"### Section {index}" for index in range(600))).encode()
    manifest = compact_index({"CP-1": raw})["CP-1"]
    assert manifest["heading_count"] == 600
    assert manifest["headings_truncated"] is True
    assert len(manifest["headings"]) == MAX_INDEXED_HEADINGS
    assert manifest["headings"][-1]["heading"] == "Section 599"


def test_long_heading_text_is_bounded_but_keeps_its_full_text_readable() -> None:
    raw = ("### " + "A" * (MAX_HEADING_CHARS + 20) + "\n").encode()
    (heading,) = heading_index(raw)
    assert len(heading["heading"]) == MAX_HEADING_CHARS
    assert heading["heading_truncated"] is True


def test_read_tool_is_offered_only_for_compact_transport(tmp_path) -> None:
    raw = ("a" * (MAX_CHUNK_BYTES - 1) + "€tail").encode()
    task = SimpleNamespace(sources={}, handoffs={"CP-1": raw}, draft=None)
    compact = ModuleTools(task, tmp_path, lambda *_: (), compact_handoffs=True)
    legacy = ModuleTools(task, tmp_path, lambda *_: ())
    answer = compact.call("read_handoff", {"producer": "CP-1", "cursor": 0})
    assert answer.split("\n\n", 1)[1].encode() == raw[: MAX_CHUNK_BYTES - 1]
    assert "next_cursor: 10239" in answer
    assert compact.call("read_handoff", {"producer": "CP-2", "cursor": 0}).startswith(
        "ERROR: producer is not an upstream"
    )
    second = compact.call("read_handoff", {"producer": "CP-1", "cursor": MAX_CHUNK_BYTES - 1})
    assert second.split("\n\n", 1)[1].encode() == raw[MAX_CHUNK_BYTES - 1 :]
    assert legacy.call("read_handoff", {"producer": "CP-1", "cursor": 0}).startswith(
        "ERROR: unknown tool"
    )


def test_new_copilot_loops_pin_transport_and_unversioned_loops_stay_legacy(tmp_path) -> None:
    class OfflineCopilot:
        config_id = "copilot-sol-medium"
        ruling = Path("test-ruling")

    def executor(folder):
        return HandoffExecutor(
            folder,
            adapter=OfflineCopilot(),
            cap_usd=Decimal(1),
            check=lambda *_: (),
        )

    fresh = executor(tmp_path / "fresh")
    assert fresh.handoff_transport == "compact-v1"
    assert json.loads((tmp_path / "fresh" / "loop.json").read_text())["handoff_transport"] == (
        "compact-v1"
    )

    legacy_dir = tmp_path / "legacy"
    legacy_dir.mkdir()
    (legacy_dir / "loop.json").write_text(
        '{"config":"copilot-sol-medium","cap":"1","max_turns":24,'
        '"max_output_tokens":16000,"execution":"live-provider"}'
    )
    legacy = executor(legacy_dir)
    assert legacy.handoff_transport is None
    assert not legacy._compact_handoffs(SimpleNamespace(module_id="CP-3"))
    path = legacy_dir / "loop.json"
    previous = json.loads(path.read_bytes())
    path.unlink()
    path.write_text(json.dumps({**previous, "handoff_transport": "unknown"}))
    with pytest.raises(ValueError, match="unsupported handoff transport"):
        executor(legacy_dir)


def test_compact_prompt_guard_stops_accumulated_requests_with_headroom(tmp_path) -> None:
    class OfflineCopilot:
        config_id = "copilot-sol-medium"
        ruling = Path("test-ruling")

    loop = HandoffExecutor(
        tmp_path / "guard",
        adapter=OfflineCopilot(),
        cap_usd=Decimal(1),
        check=lambda *_: (),
    )
    task = SimpleNamespace(module_id="CP-3")
    request = TurnRequest((Message("user", "x" * 400_000),), (), 16_000, "medium")
    with pytest.raises(ValueError, match="CP-3 compact prompt exceeds"):
        loop._guard_compact_request(task, request, initial=True)
    loop._guard_compact_request(task, request)
    oversized = TurnRequest((Message("user", "x" * 600_000),), (), 16_000, "medium")
    with pytest.raises(ValueError, match="CP-3 compact prompt exceeds"):
        loop._guard_compact_request(task, oversized)


def test_oversized_compact_repair_stops_before_reserving_or_sending(tmp_path) -> None:
    adapter = Adapter()
    adapter.config_id = "copilot-sol-medium"
    repair = replace(task(), module_id="CP-5", attempt=2, draft=b"x" * 400_000)
    loop = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(10), check=check, events=tmp_path
    )
    with pytest.raises(ValueError, match="CP-5 compact prompt exceeds"):
        loop(repair)
    assert adapter.requests == [] and loop.budget.spent == 0 and not loop.budget.unsettled
    (stop,) = read_events(tmp_path / EVENTS)
    assert stop["event"] == "compact_prompt_stopped" and stop["module"] == "CP-5"
    assert stop["estimated_input_tokens"] > stop["input_limit"] == 100_000


def test_read_result_is_exact_or_withheld_as_a_whole(tmp_path) -> None:
    class OfflineCopilot:
        config_id = "copilot-sol-medium"
        ruling = Path("test-ruling")

    loop = HandoffExecutor(
        tmp_path / "redaction",
        adapter=OfflineCopilot(),
        cap_usd=Decimal(1),
        check=lambda *_: (),
    )
    exact = "producer: CP-1\ncursor: 0\nnext_cursor: None\n\n€ evidence"
    assert loop._tool_result("read_handoff", exact) == exact
    loop.redactor = SimpleNamespace(text=lambda text: text.replace("€ evidence", "[redacted]"))
    assert loop._tool_result("read_handoff", exact).startswith("ERROR:")


def test_compact_exchange_consumes_an_exact_read_and_validates_a_handoff(tmp_path):
    producer = "CP-1"
    raw = b"## Findings\n### Revenue series\nRevenue 100; cash unavailable.\n"
    offset = raw.index(b"### Revenue series")
    current = replace(task(), module_id="CP-3", handoffs={producer: raw})
    calls = [
        ToolCall("r", "read_handoff", {"producer": producer, "cursor": offset}),
        ToolCall("w", "write_handoff", {"markdown": GOOD.decode()}),
    ]
    replies = []
    for call in calls:
        reply = turn(call)
        replies.append(replace(reply, billed_usd=Decimal("0.001")))

    class CopilotFixture(Adapter):
        config_id = "copilot-sol-medium"
        ruling = Path("synthetic")

    adapter = CopilotFixture(*replies)
    loop = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(10), check=check, events=tmp_path
    )
    assert loop(current) == GOOD
    first, continuation = adapter.requests
    sent = json.loads(first.messages[1].text)["handoffs"][producer]
    assert sent["sha256"] == hashlib.sha256(raw).hexdigest()
    assert first.messages[1].text.find("Revenue 100") == -1
    assert continuation.messages[-1].text.split("\n\n", 1)[1].encode() == raw[offset:]
    assert loop.budget.spent == Decimal("0.002")
    (invocation,) = tmp_path.glob("modules/*/invocation.json")
    (estimate,) = (
        event
        for event in read_events(tmp_path / EVENTS)
        if event["event"] == "compact_prompt_estimated"
    )
    assert estimate["module"] == "CP-3" and estimate["attempt"] == current.attempt
    assert estimate["estimated_input_tokens"] == (invocation.stat().st_size * 100 + 384) // 385
    assert estimate["output_tokens"] == first.max_output_tokens


def test_compact_exchange_refuses_credentials_that_span_the_chunk_boundary(tmp_path):
    from deploy_workflow.model.redact import Redactor

    secret = "example-test-credential"
    current = replace(
        task(),
        module_id="CP-3",
        handoffs={"CP-1": b"x" * (MAX_CHUNK_BYTES - 9) + secret.encode()},
    )
    adapter = Adapter()
    adapter.config_id = "copilot-sol-medium"
    loop = HandoffExecutor(
        tmp_path, adapter=adapter, cap_usd=Decimal(10), check=check, redactor=Redactor([secret])
    )
    with pytest.raises(ValueError, match="upstream handoff contains credential-like content"):
        loop(current)
    assert adapter.requests == []


def test_a_csv_source_reads_as_windows_1252_when_it_is_not_utf_8_and_a_text_file_does_not() -> None:
    raw = "Name,Note\nCaf\u00e9,\u201cquoted\u201d\n".encode("cp1252")
    assert _read_pages("export.csv", raw) == ["Name,Note\nCafé,\u201cquoted\u201d\n"]
    assert _read_pages("EXPORT.CSV", raw) == _read_pages("export.csv", raw)
    with pytest.raises(UnicodeDecodeError):
        _read_pages("export.txt", raw)  # only a CSV is read as Windows-1252
    with pytest.raises(CsvDecodeError):
        _read_pages("export.csv", b"a,b\x81\n")


def test_the_page_cache_keeps_a_csv_read_apart_from_a_text_read_of_the_same_bytes() -> None:
    raw = "Caf\u00e9,1\n".encode("cp1252")
    assert _pages("same-bytes.csv", raw) == ["Café,1\n"]
    with pytest.raises(UnicodeDecodeError):
        _pages("same-bytes.txt", raw)
    with pytest.raises(UnicodeDecodeError):
        _pages("other-bytes.txt", raw + b" ")  # a text read first, then the CSV
    assert _pages("other-bytes.csv", raw + b" ") == ["Café,1\n "]


def test_a_utf_8_csv_source_keeps_its_page_text_and_its_byte_order_mark() -> None:
    text = "\ufeffBorrower,Par\n" + "".join(f"Fern {n:04d} S.\u00e0 r.l.,{n}\n" for n in range(900))
    pages = _read_pages("holdings.csv", text.encode())
    assert pages == [text[i : i + 12000] for i in range(0, len(text), 12000)]
    assert len(pages) == 2 and pages[0].startswith("\ufeffBorrower")
    assert _pages("holdings.csv", text.encode()) == pages
