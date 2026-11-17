"""Run real legacy CP-OS with a canned adapter reply for the browser proof."""

from __future__ import annotations

import hashlib
import json
import os
import re
import socket
import sys
import tempfile
from pathlib import Path
from typing import Any
from unittest.mock import patch

from proof import DUMMY_KEY

FILING = Path(__file__).with_name("northbridge-filing.txt")
PORTFOLIO = Path(__file__).with_name("northbridge-portfolio.xlsx")
AGREEMENT = Path(__file__).with_name("northbridge-credit-agreement.txt")
HANDOFFS = Path(__file__).with_name("handoffs")


def verify_upload(sources: Path, context: Path) -> str:
    """Bind the canned replies to exactly the synthetic filing in the scheduler drop."""
    files = {p.relative_to(sources) for p in sources.rglob("*") if p.is_file() and p != context}
    filing = {Path(FILING.name)}
    optional = (PORTFOLIO, AGREEMENT)
    allowed = {frozenset(filing | {Path(f.name) for f in chosen}) for chosen in _subsets(optional)}
    if frozenset(files) not in allowed:
        raise ValueError(
            f"synthetic proof requires exactly one {FILING.name} upload and at most its "
            "workbook and credit agreement"
        )
    raw = (sources / FILING.name).read_bytes()
    if raw != FILING.read_bytes():
        raise ValueError("uploaded filing differs from the synthetic proof fixture")
    for fixture in optional:
        if (
            Path(fixture.name) in files
            and (sources / fixture.name).read_bytes() != fixture.read_bytes()
        ):
            raise ValueError(f"uploaded {fixture.name} differs from the synthetic proof fixture")
    return hashlib.sha256(raw).hexdigest()


def _subsets(items: tuple[Path, ...]) -> list[tuple[Path, ...]]:
    return [
        tuple(item for bit, item in enumerate(items) if mask >> bit & 1)
        for mask in range(1 << len(items))
    ]


def reject_network(*_args: object, **_kwargs: object) -> None:
    raise RuntimeError("outbound network is disabled in the synthetic CP-OS launcher")


def canned_handoff(context: dict[str, Any], case: str) -> str:
    module = context["module_id"]
    if not re.fullmatch(r"CP-[A-Z0-9]+", module):
        raise ValueError("unexpected module in the synthetic request")
    findings = (HANDOFFS / f"{module}.md").read_text(encoding="utf-8")
    sources = [f"- {name} {digest}" for name, digest in context["sources"].items()]
    sources.extend(f"- {name} {entry['sha256']}" for name, entry in context["handoffs"].items())
    return "\n".join(
        [f"# {module}", "", "## Request", case, "", "## Sources", "", *sources, "", findings]
    )


def run_engine(argv: list[str]) -> int:
    from deploy_workflow.model.adapter import AdapterReply, LiveAdapter
    from deploy_workflow.model.turn import ToolCall, Turn, TurnRequest, Usage
    from deploy_workflow.owners import cpos_launch

    args = cpos_launch._parser().parse_args(argv)
    if os.environ.get("OPENAI_API_KEY") != DUMMY_KEY or args.config not in {
        "sol-medium",
        "sol-high",
    }:
        raise ValueError("synthetic proof requires the browser proof service and GPT selection")
    if args.out is None or not args.no_library or not args.live:
        raise ValueError("synthetic proof requires a scheduler output and library ownership")
    digest = verify_upload(args.sources, args.context)
    workbook = args.sources / PORTFOLIO.name
    workbook_digest = (
        hashlib.sha256(workbook.read_bytes()).hexdigest() if workbook.is_file() else None
    )

    with tempfile.TemporaryDirectory(prefix="credit-os-proof-") as temp:
        prepared = cpos_launch.prepare(
            args.context,
            args.sources,
            Path(temp) / "preview",
            config=args.config,
            cap=args.cap,
            modules=args.modules,
            prior="none",
        )
    run = prepared.plan.run
    if run.pathway != "credit_snapshot" or args.prior != "none":
        raise ValueError("synthetic proof requires a first Credit Snapshot run")

    def complete(_adapter: LiveAdapter, request: TurnRequest, **_kwargs: object) -> AdapterReply:
        context = json.loads(request.messages[1].text)
        if context["sources"].get(FILING.name) != digest:
            raise ValueError("CP-OS request did not retain the uploaded filing digest")
        if (
            workbook_digest is not None
            and context["sources"].get(PORTFOLIO.name) != workbook_digest
        ):
            raise ValueError("CP-OS request did not retain the uploaded workbook digest")
        if context["run"] != run.model_dump(mode="json"):
            raise ValueError("CP-OS request did not retain the submitted run identity")
        text = canned_handoff(context, f"{run.issuer_name} as of {run.as_of}.")
        usage = Usage(
            input_tokens=0,
            cached_read_tokens=0,
            cache_write_tokens=0,
            output_tokens=0,
            reasoning_tokens=0,
        )
        call = ToolCall("synthetic-browser-proof", "write_handoff", {"markdown": text})
        turn = Turn("", (call,), usage, "tool_use", "synthetic", "synthetic", 200)
        return AdapterReply("ok", turn, None, 200, None, None, 1, 2, usage)

    with patch.object(LiveAdapter, "complete", complete):
        return cpos_launch.main(argv)


def main() -> int:
    try:
        with (
            patch.object(socket.socket, "connect", reject_network),
            patch.object(socket.socket, "connect_ex", reject_network),
            patch.object(socket, "getaddrinfo", reject_network),
        ):
            return run_engine(sys.argv[1:])
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
