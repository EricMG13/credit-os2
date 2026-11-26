"""Write a module's first-pass reading notes on the Copilot route: one paid call a document.

    uv run python -m deploy_workflow.owners.cpos_reader_run --context CONTEXT.json \\
        --sources FOLDER --module CP-4 --config copilot-luna-xhigh \\
        --ruling docs/rulings/<file>.md --cap 3 --out NOTES_FOLDER

Then launch with `--reading-notes NOTES_FOLDER`. Each document is given whole to a reader in a
clean context (in parts when it is larger than `PART_BYTES`); the reader's notes are written as
`<module>/<source>.notes.md`, each naming its source and sha256, and one line a call goes to
`reader-calls.jsonl`. A call is not sent when its hold would pass the cap, and a call whose
charge is unknown stops the reading.

NEVER RUN ON A PROVIDER (2026-11-25): written where no Copilot login was available and tested
with a stand-in for the adapter only. The configuration tested in the instruction-length trial
was another one (claude-haiku-5-5 on the Anthropic API).
"""

import argparse
import hashlib
import json
import os
from collections.abc import Mapping, Sequence
from dataclasses import asdict
from decimal import Decimal
from pathlib import Path
from typing import Any

from deploy_workflow.model.adapter import ModelAdapter
from deploy_workflow.model.configs import CONFIGS
from deploy_workflow.model.loop_helpers import redacted_request
from deploy_workflow.model.pricing import handoff_reservation_usd
from deploy_workflow.model.redact import Redactor
from deploy_workflow.model.turn import Message, ToolSpec, TurnRequest, dump_json
from deploy_workflow.owners import cpos, cpos_launch, cpos_reader

PART_BYTES = 1_500_000  # a document larger than this is read in parts, page boundaries kept
MAX_OUTPUT_TOKENS = 32000
NOTES_TOOL = ToolSpec(
    "write_notes",
    "Submit the complete notes on this document.",
    {
        "type": "object",
        "properties": {"markdown": {"type": "string"}},
        "required": ["markdown"],
        "additionalProperties": False,
    },
)
_COMPLETE = ("tool_use", "end")  # the other stop reasons: `max_tokens` (cut short) and `other`
SUBMIT = " Submit the notes with write_notes."


class ReadingStopped(RuntimeError):
    """The reading cannot go on: a cap would be passed, or a call failed or cannot be priced."""


def parts(pages: Sequence[Mapping[str, Any]], limit: int = PART_BYTES) -> list[str]:
    """The document's pages, each under a `[page N]` line, joined into parts of at most
    ``limit`` bytes; a page is never split."""
    out: list[str] = []
    current: list[str] = []
    size = 0
    for page in pages:
        text = f"[page {page['page']}]\n{page['text']}"
        length = len(text.encode()) + 2
        if current and size + length > limit:
            out.append("\n\n".join(current))
            current, size = [], 0
        current.append(text)
        size += length
    return [*out, "\n\n".join(current)] if current else out


def _source_pages(name: str, raw: bytes) -> list[dict[str, Any]]:
    """The pages of one source: JSON lines split on newline only, blank lines skipped. A line
    that cannot be read raises `ReadingStopped` naming the source and the line."""
    try:
        text = raw.decode()
    except UnicodeDecodeError as error:
        raise ReadingStopped(f"{name}: not UTF-8 text ({error})") from error
    pages: list[dict[str, Any]] = []
    for number, line in enumerate(text.split("\n"), 1):
        if not line.strip():
            continue
        try:
            pages.append(json.loads(line))
        except json.JSONDecodeError as error:
            raise ReadingStopped(f"{name}: line {number} is not JSON ({error})") from error
    return pages


def read_documents(  # noqa: PLR0913 - one keyword per setting of the reading
    adapter: ModelAdapter,
    module: str,
    sources: Mapping[str, bytes],
    names: Sequence[str],
    out: Path,
    *,
    cap: Decimal,
    redactor: Redactor,
    part_bytes: int = PART_BYTES,
) -> Decimal:
    """Read each named source and write its notes file under ``out``/``module``; returns what
    the calls settled. Raises `ReadingStopped` before a call whose hold would pass ``cap`` and
    after one that failed, has no known charge, was cut short or refused, or was summarised by
    the runtime (the notes would not be of the whole document)."""
    config = CONFIGS[adapter.config_id]
    folder = out / module
    folder.mkdir(parents=True, exist_ok=True)
    # every source is read before the first paid call, so none can fail to parse after one
    all_pages = {name: _source_pages(name, sources[name]) for name in names}
    spent = Decimal(0)
    for name in names:
        pieces = parts(all_pages[name], part_bytes)
        notes_path = folder / f"{name}{cpos_reader.SUFFIX}"
        # a source named by a path (`filings/a.htm.jsonl`) needs its folder; made before the first
        # call, so a path problem cannot follow a paid one
        notes_path.parent.mkdir(parents=True, exist_ok=True)
        notes = []
        for number, piece in enumerate(pieces, 1):
            which = f" (part {number} of {len(pieces)})" if len(pieces) > 1 else ""
            request = redacted_request(
                redactor,
                TurnRequest(
                    (
                        Message("system", cpos_reader.reader_brief(module) + SUBMIT),
                        Message("user", f"Document: {name}{which}\n\n{piece}"),
                    ),
                    (NOTES_TOOL,),
                    MAX_OUTPUT_TOKENS,
                    config.effort,
                ),
            )
            encoded = dump_json(asdict(request)).encode()
            hold = handoff_reservation_usd(config.config_id, len(encoded), MAX_OUTPUT_TOKENS)
            if spent + hold > cap:
                raise ReadingStopped(f"{name}{which}: holding USD {hold} would pass the cap {cap}")
            digest = hashlib.sha256(encoded).hexdigest()
            reply = adapter.complete(
                request, invocation_digest=digest, call_index=0, reservation_id=f"reader-{digest}"
            )
            record: dict[str, Any] = {"module": module, "source": name, "part": number}
            record.update(config=config.config_id, kind=reply.kind, error=reply.error_class)
            record["settled_usd"] = None if reply.billed_usd is None else str(reply.billed_usd)
            record["usage"] = None if reply.usage is None else asdict(reply.usage)
            record["compactions"] = len(reply.compactions)
            with (out / "reader-calls.jsonl").open("a") as log:
                log.write(json.dumps(record) + "\n")
            # `release` is the Copilot adapter's (stop this exchange's runtime); the `ModelAdapter`
            # Protocol does not declare it, so it is called only where the adapter has it
            release = getattr(adapter, "release", None)
            if callable(release):
                release(digest)
            if reply.kind != "ok" or reply.turn is None or reply.billed_usd is None:
                raise ReadingStopped(f"{name}{which}: {reply.kind}; charge {reply.billed_usd}")
            spent += reply.billed_usd
            if reply.compactions:
                raise ReadingStopped(
                    f"{name}{which}: the runtime summarised the document; "
                    "notes from a summary are not a reading of the whole"
                )
            if reply.turn.stop_reason not in _COMPLETE:
                raise ReadingStopped(f"{name}{which}: stopped with {reply.turn.stop_reason}")
            written = [c.arguments.get("markdown", "") for c in reply.turn.tool_calls]
            text = "\n".join(str(w) for w in written if w) or reply.turn.text
            if not text.strip():
                raise ReadingStopped(f"{name}{which}: the reader wrote no notes")
            notes.append(text.strip())
        sha256 = hashlib.sha256(sources[name]).hexdigest()
        notes_path.write_text(cpos_reader.notes_file(name, sha256, "\n\n".join(notes)))
    return spent


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    parser.add_argument("--context", type=Path, required=True)
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--module", choices=tuple(cpos_reader.READER_TOPICS), required=True)
    parser.add_argument("--config", choices=tuple(CONFIGS), required=True)
    parser.add_argument("--ruling", type=Path, required=True)
    parser.add_argument("--cap", required=True, help="USD the reader's calls may total")
    parser.add_argument("--out", type=Path, required=True, help="the notes folder to write")
    args = parser.parse_args()
    if args.out.exists():
        raise SystemExit(f"{args.out} exists: write each reading to a new folder")
    prepared = cpos_launch.prepare(
        args.context,
        args.sources,
        args.out / "prepared",
        config=args.config,
        cap="50",
        prior=cpos_launch.NO_PRIOR,
    )
    sources = cpos._pinned_inputs(prepared.manifest.parent, prepared.plan.sources)
    names = cpos_reader.reader_documents(args.module, prepared.documents)
    adapter = cpos.live_adapter_for(CONFIGS[args.config], args.ruling, os.environ, None)
    try:
        spent = read_documents(
            adapter,
            args.module,
            sources,
            names,
            args.out,
            cap=Decimal(args.cap),
            redactor=Redactor.from_environ(os.environ),
        )
    finally:
        cpos._release(adapter)
    print(
        f"{len(names)} document(s) read for {args.module}; settled USD {spent}; notes in {args.out}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
