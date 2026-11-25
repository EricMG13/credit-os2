"""owners/cpos_reader_run.py with a stand-in for the adapter: no provider is called. What is
proved here is the reading's own bookkeeping; the call has never been made on a provider."""

import hashlib
import json
from decimal import Decimal

import pytest

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import ToolCall, Turn, Usage
from deploy_workflow.owners import cpos_reader
from deploy_workflow.owners.cpos_reader_run import ReadingStopped, parts, read_documents

PAGES = [{"page": 1, "text": "Maximum net leverage 7.25x."}, {"page": 2, "text": "Maturity 2029."}]
RAW = "\n".join(json.dumps(p) for p in PAGES).encode()


class StandIn:
    """Answers each request through `write_notes`; keeps the requests it was given."""

    config_id = "copilot-luna-xhigh"
    ruling = None

    def __init__(self, billed=Decimal("0.02"), notes="p.1 | Covenant | 7.25x", kind="ok"):
        self.billed, self.notes, self.kind, self.requests = billed, notes, kind, []

    def complete(self, request, *, invocation_digest, call_index, reservation_id):
        self.requests.append(request)
        usage = Usage(100, 0, 0, output_tokens=20, reasoning_tokens=0)
        if self.kind != "ok":
            return AdapterReply(self.kind, None, None, 500, "ProviderRejected", None, 0.0, 0.0)
        call = ToolCall("1", "write_notes", {"markdown": self.notes})
        turn = Turn("", (call,), usage, "tool_use", "gpt-6-luna", "r", 200, self.billed)
        return AdapterReply("ok", turn, None, 200, None, None, 0.0, 0.0, usage, self.billed)


def read(tmp_path, adapter, cap="5"):
    return read_documents(
        adapter,
        "CP-4",
        {"agreement.jsonl": RAW},
        ["agreement.jsonl"],
        tmp_path / "notes",
        cap=Decimal(cap),
        redactor=Redactor(),
    )


def test_pages_are_kept_whole_and_a_large_document_is_read_in_parts():
    assert parts(PAGES) == ["[page 1]\nMaximum net leverage 7.25x.\n\n[page 2]\nMaturity 2029."]
    assert parts(PAGES, limit=40) == [
        "[page 1]\nMaximum net leverage 7.25x.",
        "[page 2]\nMaturity 2029.",
    ]
    assert parts([]) == []


def test_a_reading_writes_notes_the_launcher_accepts_and_logs_each_call(tmp_path):
    adapter = StandIn()
    assert read(tmp_path, adapter) == Decimal("0.02")
    sent = adapter.requests[0]
    assert sent.effort == "xhigh" and [t.name for t in sent.tools] == ["write_notes"]
    assert sent.messages[0].text.startswith("You are a first-pass reader")
    assert sent.messages[1].text.startswith("Document: agreement.jsonl\n\n[page 1]\n")
    sha256 = hashlib.sha256(RAW).hexdigest()
    block = cpos_reader.notes_block("CP-4", tmp_path / "notes", {"agreement.jsonl": sha256})
    assert block.endswith("### Notes on agreement.jsonl\n\np.1 | Covenant | 7.25x\n")
    (line,) = (tmp_path / "notes/reader-calls.jsonl").read_text().splitlines()
    logged = json.loads(line)
    assert (logged["source"], logged["part"], logged["settled_usd"]) == (
        "agreement.jsonl",
        1,
        "0.02",
    )


def test_a_call_whose_hold_would_pass_the_cap_is_not_sent(tmp_path):
    adapter = StandIn()
    with pytest.raises(ReadingStopped, match="would pass the cap 0.001"):
        read(tmp_path, adapter, cap="0.001")
    assert adapter.requests == []


@pytest.mark.parametrize(
    ("adapter", "why"),
    [
        (StandIn(billed=None), "charge None"),
        (StandIn(kind="sent_known"), "sent_known"),
        (StandIn(notes="  "), "wrote no notes"),
    ],
)
def test_an_unpriced_failed_or_empty_reading_stops_and_leaves_no_notes_file(tmp_path, adapter, why):
    with pytest.raises(ReadingStopped, match=why):
        read(tmp_path, adapter)
    assert not list((tmp_path / "notes/CP-4").glob("*.notes.md"))
    assert len((tmp_path / "notes/reader-calls.jsonl").read_text().splitlines()) == 1
