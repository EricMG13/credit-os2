"""owners/cpos_reader_run.py with a stand-in for the adapter: no provider is called. What is
proved here is the reading's own bookkeeping; the call has never been made on a provider."""

import hashlib
import json
from decimal import Decimal

import pytest

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import Compaction, ToolCall, Turn, Usage
from deploy_workflow.owners import cpos_reader
from deploy_workflow.owners.cpos_reader_run import ReadingStopped, parts, read_documents

PAGES = [{"page": 1, "text": "Maximum net leverage 7.25x."}, {"page": 2, "text": "Maturity 2029."}]
RAW = "\n".join(json.dumps(p) for p in PAGES).encode()


class StandIn:
    """Answers each request through `write_notes`; keeps the requests it was given."""

    config_id = "copilot-luna-xhigh"
    ruling = None

    def __init__(
        self,
        billed=Decimal("0.02"),
        notes="p.1 | Covenant | 7.25x",
        kind="ok",
        compactions=(),
        stop_reason="tool_use",
    ):
        self.billed, self.notes, self.kind = billed, notes, kind
        self.compactions, self.stop_reason = compactions, stop_reason
        self.requests, self.released = [], []

    def release(self, invocation_digest):
        self.released.append(invocation_digest)

    def complete(self, request, *, invocation_digest, call_index, reservation_id):
        self.requests.append(request)
        usage = Usage(100, 0, 0, output_tokens=20, reasoning_tokens=0)
        if self.kind != "ok":
            return AdapterReply(self.kind, None, None, 500, "ProviderRejected", None, 0.0, 0.0)
        call = ToolCall("1", "write_notes", {"markdown": self.notes})
        turn = Turn("", (call,), usage, self.stop_reason, "gpt-6-luna", "r", 200, self.billed)
        return AdapterReply(
            "ok",
            turn,
            None,
            200,
            None,
            None,
            0.0,
            0.0,
            usage,
            self.billed,
            compactions=self.compactions,
        )


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
    block = cpos_reader.notes_block(
        "CP-4", tmp_path / "notes", {"agreement.jsonl": sha256}, ["agreement.jsonl"]
    )
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
        (StandIn(stop_reason="max_tokens"), "stopped with max_tokens"),
        (StandIn(stop_reason="other"), "stopped with other"),
        (
            StandIn(compactions=(Compaction(kind="complete", usd=Decimal("0.01")),)),
            "agreement.jsonl: the runtime summarised",
        ),
    ],
)
def test_an_unpriced_failed_or_empty_reading_stops_and_leaves_no_notes_file(tmp_path, adapter, why):
    with pytest.raises(ReadingStopped, match=why):
        read(tmp_path, adapter)
    assert not list((tmp_path / "notes/CP-4").glob("*.notes.md"))
    assert len((tmp_path / "notes/reader-calls.jsonl").read_text().splitlines()) == 1


@pytest.mark.parametrize("module", ["CP-0", "CP-1", "CP-2", "CP-3", "CP-5"])
def test_every_module_with_a_reader_can_be_read_for(tmp_path, module):
    adapter = StandIn()
    spent = read_documents(
        adapter,
        module,
        {"report.jsonl": RAW},
        ["report.jsonl"],
        tmp_path / "notes",
        cap=Decimal(5),
        redactor=Redactor(),
    )
    assert spent == Decimal("0.02")
    assert adapter.requests[0].messages[0].text.startswith(cpos_reader.reader_brief(module))
    sha256 = hashlib.sha256(RAW).hexdigest()
    block = cpos_reader.notes_block(
        module, tmp_path / "notes", {"report.jsonl": sha256}, ["report.jsonl"]
    )
    assert block.startswith("\n" + cpos_reader.notes_rule(module))


def test_a_compacted_reading_is_logged_with_the_fact_and_each_call_is_released(tmp_path):
    adapter = StandIn(compactions=(Compaction(kind="complete", usd=Decimal("0.01")),))
    with pytest.raises(ReadingStopped, match="summarised"):
        read(tmp_path, adapter)
    (line,) = (tmp_path / "notes/reader-calls.jsonl").read_text().splitlines()
    assert json.loads(line)["compactions"] == 1
    assert len(adapter.released) == 1  # the call's runtime is stopped even when the reading is


def test_a_call_is_released_after_it_and_an_adapter_without_release_still_reads(tmp_path):
    adapter = StandIn()
    read(tmp_path, adapter)
    assert len(adapter.released) == 1 and len(adapter.released[0]) == 64

    class Plain(StandIn):
        release = None  # `getattr(adapter, "release", None)` finds no callable

    assert read(tmp_path / "again", Plain()) == Decimal("0.02")


def test_a_source_in_a_subfolder_gets_its_notes_folder_before_any_call_is_paid(tmp_path):
    name = "filings/agreement.jsonl"
    adapter = StandIn()
    out = tmp_path / "notes"
    (out / "CP-4").mkdir(parents=True)
    (out / "CP-4/filings").write_text("in the way")  # the notes file's folder cannot be made
    with pytest.raises(FileExistsError):
        read_documents(
            adapter, "CP-4", {name: RAW}, [name], out, cap=Decimal(5), redactor=Redactor()
        )
    assert adapter.requests == []
    (out / "CP-4/filings").unlink()
    read_documents(adapter, "CP-4", {name: RAW}, [name], out, cap=Decimal(5), redactor=Redactor())
    assert (out / "CP-4/filings/agreement.jsonl.notes.md").is_file()
    sha256 = hashlib.sha256(RAW).hexdigest()
    block = cpos_reader.notes_block("CP-4", out, {name: sha256}, [name])
    assert block.endswith("### Notes on filings/agreement.jsonl\n\np.1 | Covenant | 7.25x\n")


def test_the_cap_is_cumulative_across_documents(tmp_path):
    # each call holds USD 0.3585 (copilot-luna-xhigh, about 1.8 KB in, 32000 tokens out) and
    # settles at 0.02: a cap of 0.37 covers the first hold, not 0.02 + 0.3585 for the second
    adapter = StandIn()
    why = r"b.jsonl: holding USD 0.35850000 would pass the cap 0.37"
    with pytest.raises(ReadingStopped, match=why):
        read_documents(
            adapter,
            "CP-4",
            {"a.jsonl": RAW, "b.jsonl": RAW},
            ["a.jsonl", "b.jsonl"],
            tmp_path / "notes",
            cap=Decimal("0.37"),
            redactor=Redactor(),
        )
    assert len(adapter.requests) == 1
    assert (tmp_path / "notes/CP-4/a.jsonl.notes.md").is_file()
    assert not (tmp_path / "notes/CP-4/b.jsonl.notes.md").exists()


def test_a_document_larger_than_the_part_limit_is_read_in_parts_and_the_notes_joined(tmp_path):
    adapter = StandIn()
    spent = read_documents(
        adapter,
        "CP-4",
        {"agreement.jsonl": RAW},
        ["agreement.jsonl"],
        tmp_path / "notes",
        cap=Decimal(5),
        redactor=Redactor(),
        part_bytes=40,
    )
    assert spent == Decimal("0.04")
    first, second = (r.messages[1].text for r in adapter.requests)
    assert first == (
        "Document: agreement.jsonl (part 1 of 2)\n\n[page 1]\nMaximum net leverage 7.25x."
    )
    assert second == "Document: agreement.jsonl (part 2 of 2)\n\n[page 2]\nMaturity 2029."
    written = (tmp_path / "notes/CP-4/agreement.jsonl.notes.md").read_text()
    assert written.endswith("\n\np.1 | Covenant | 7.25x\n\np.1 | Covenant | 7.25x\n")
