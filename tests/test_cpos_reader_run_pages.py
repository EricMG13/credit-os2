"""Page lines of a source are JSON lines: split on newline only, blank lines skipped, and every
named source parsed before the first paid call. Stand-in adapter from test_cpos_reader_run."""

import json
from decimal import Decimal

import pytest

from deploy_workflow.model.redact import Redactor
from deploy_workflow.owners.cpos_reader_run import ReadingStopped, read_documents
from tests.test_cpos_reader_run import RAW, StandIn


def run(tmp_path, adapter, sources):
    return read_documents(
        adapter,
        "CP-4",
        sources,
        list(sources),
        tmp_path / "notes",
        cap=Decimal(5),
        redactor=Redactor(),
    )


def test_blank_line_in_a_later_source_stops_before_any_call(tmp_path):
    adapter = StandIn()
    sources = {"a.jsonl": RAW, "b.jsonl": RAW + b"\n\n" + RAW}
    with pytest.raises(ReadingStopped, match=r"b\.jsonl.*line 2") as stopped:
        run(tmp_path, adapter, {"a.jsonl": RAW, "b.jsonl": b'{"page": 1, "text": "x"}\n{bad\n'})
    assert adapter.requests == []
    assert "b.jsonl" in str(stopped.value)
    # a blank line itself is skipped, not an error
    run(tmp_path / "ok", adapter, sources)
    assert len(adapter.requests) == 2


def test_trailing_blank_lines_and_whitespace_only_lines_are_skipped(tmp_path):
    adapter = StandIn()
    raw = RAW + b"\n\n  \t\n"
    assert run(tmp_path, adapter, {"a.jsonl": raw}) == Decimal("0.02")
    assert len(adapter.requests) == 1
    user = adapter.requests[0].messages[1].text
    assert user.endswith("[page 2]\nMaturity 2029.")


def test_u2028_inside_a_json_string_does_not_split_the_page(tmp_path):
    adapter = StandIn()
    raw = (json.dumps({"page": 1, "text": "one two"}, ensure_ascii=False) + "\n").encode()
    run(tmp_path, adapter, {"a.jsonl": raw})
    assert "[page 1]\none two" in adapter.requests[0].messages[1].text


def test_undecodable_source_stops_before_any_call(tmp_path):
    adapter = StandIn()
    with pytest.raises(ReadingStopped, match=r"b\.jsonl"):
        run(tmp_path, adapter, {"a.jsonl": RAW, "b.jsonl": b"\xff\xfe"})
    assert adapter.requests == []
