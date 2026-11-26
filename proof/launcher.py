"""Run CP-OS with a canned Copilot reply for the browser proof."""

from __future__ import annotations

import hashlib
import json
import os
import re
import socket
import sys
import tempfile
from decimal import Decimal
from pathlib import Path
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

from proof import DUMMY_KEY

if TYPE_CHECKING:
    from deploy_workflow.owners.cpos_launch import Prepared

FILING = Path(__file__).with_name("northbridge-filing.txt")
PORTFOLIO = Path(__file__).with_name("northbridge-portfolio.xlsx")
AGREEMENT = Path(__file__).with_name("northbridge-credit-agreement.txt")
HANDOFFS = Path(__file__).with_name("handoffs")
STRUCTURAL_PHASES = {"CP-4": ("CP-4B",)}
STRUCTURAL_SCOPE = "Analysis scope: Core analysis and Structural priority."

NO_DOCUMENT = "Not supplied: no executed governing document"
EDGES = ("From", "Relationship", "Edge type", "To", "Evidence")
EVENTS = (
    "Event date",
    "Date precision",
    "Published",
    "Event",
    "Status",
    "Source",
    "Credit relevance",
)
CHART = ("Test", "Threshold", "Current", "Headroom", "Direction", "Reporting unit")


def _table(head: tuple[str, ...], row: tuple[str, ...]) -> str:
    return "\n".join(f"| {' | '.join(cells)} |" for cells in (head, ("---",) * len(head), row))


# What a model writes when CP-4's source gate stops it (`cpos_launch._SOURCE_GATE`): front matter
# that says Blocked, a Bottom line that begins `Not assessable: `, the gate register and each fixed
# report selector once with one not-assessable row. It is the reply only for a run that declares no
# legal documents; a run that supplies an agreement gets the canned CP-4 handoff.
BLOCKED_FRONT = ("---", "module_id: CP-4", "module_status: Blocked", "---")
BLOCKED_SECTIONS = {
    "T4.1 Source gate register": _table(
        ("Document", "Status", "Limitation"), (NO_DOCUMENT, "Blocked", "Source gate")
    ),
    "Chart data: covenant headroom": _table(
        (*CHART, "Basis and limitation"), (*[NO_DOCUMENT] * 5, "x", "Not assessable.")
    ),
    "Events: Legal": _table(EVENTS, (NO_DOCUMENT,) * len(EVENTS)),
    "Confidence inputs": _table(("Input", "Value"), ("Not assessable", NO_DOCUMENT)),
    "Map: legal entities": _table(EDGES, (NO_DOCUMENT,) * len(EDGES)),
    "Map: intercreditor": _table(EDGES, (NO_DOCUMENT,) * len(EDGES)),
}
BLOCKED_BOTTOM_LINE = (
    "Not assessable: no executed governing document was supplied, so the covenants, their "
    "capacity and headroom and the lenders' protection are not established for this run."
)
BLOCKED_CP4 = "\n".join(
    [
        *("## Findings", "", "### Bottom line", "", BLOCKED_BOTTOM_LINE, ""),
        *(line for h, t in BLOCKED_SECTIONS.items() for line in (f"### {h}", "", t, "")),
        *("## Calculations", "", "None.", "", "## Gaps", "", f"- {NO_DOCUMENT}.", ""),
        *("## Next module", "", "The orchestrator selects the next module."),
    ]
)


def capital_structure() -> str:
    """The `### Capital structure` section of the canned CP-4 handoff. With no legal documents the
    report's Capital structure goes to CP-3 (`cpos_launch._layout`) and the canned CP-3 has none,
    so its reply carries the canned CP-4 section, read here so the two cannot differ."""
    text = (HANDOFFS / "CP-4.md").read_text(encoding="utf-8")
    section = re.search(r"^### Capital structure\n.*?(?=^#{2,3} )", text, re.MULTILINE | re.DOTALL)
    if section is None:
        raise ValueError("the canned CP-4 handoff has no Capital structure section")
    return section.group().rstrip() + "\n"


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


def canned_handoff(context: dict[str, Any], case: str, *, gated: bool = False) -> str:
    """The synthetic reply for one module: its canned handoff. In a run that declares no legal
    documents (``gated``), CP-4 gets the blocked handoff its source gate requires and CP-3, which
    then owns the report's Capital structure, gets that section as well. The approved CP-4B
    case gets its own findings and scope line."""
    module = context["module_id"]
    if not re.fullmatch(r"CP-[A-Z0-9]+", module):
        raise ValueError("unexpected module in the synthetic request")
    blocked = module == "CP-4" and gated
    structural = module == "CP-4" and context.get("run", {}).get("phase_selection") == {
        "CP-4": ["CP-4B"]
    }
    fixture = "CP-4-structural" if structural else module
    findings = BLOCKED_CP4 if blocked else (HANDOFFS / f"{fixture}.md").read_text(encoding="utf-8")
    if structural:
        case += f"\n\n{STRUCTURAL_SCOPE}"
    if module == "CP-3" and gated:
        findings = findings.replace(
            "\n## Calculations", f"\n{capital_structure()}\n## Calculations", 1
        )
    sources = [f"- {name} {digest}" for name, digest in context["sources"].items()]
    sources.extend(f"- {name} {entry['sha256']}" for name, entry in context["handoffs"].items())
    return "\n".join(
        [
            *(BLOCKED_FRONT if blocked else ()),
            *(f"# {module}", "", "## Request", case, "", "## Sources", "", *sources, "", findings),
        ]
    )


def supports_custom_case(prepared: Prepared, legal: str, source_names: set[str]) -> bool:
    """The one scoped case whose canned reply matches its sources and approved method."""
    run = prepared.plan.run
    return (
        run.pathway == "custom"
        and run.case_kind == "synthetic"
        and run.issuer_name == "Northbridge Synthetic Group"
        and run.as_of.isoformat() == "2025-03-31"
        and prepared.ordered == ("CP-0", "CP-1", "CP-4")
        and run.phase_selection == STRUCTURAL_PHASES
        and legal == "executed"
        and source_names == {FILING.name, AGREEMENT.name}
    )


def run_engine(argv: list[str]) -> int:
    from deploy_workflow.context import load_context
    from deploy_workflow.model.adapter import AdapterReply
    from deploy_workflow.model.copilot_adapter import CopilotAdapter
    from deploy_workflow.model.turn import ToolCall, Turn, TurnRequest, Usage
    from deploy_workflow.owners import cpos_launch
    from deploy_workflow.run_expectations import no_legal_documents

    args = cpos_launch._parser().parse_args(argv)
    if os.environ.get("COPILOT_GITHUB_TOKEN") != DUMMY_KEY or not args.config.startswith(
        "copilot-"
    ):
        raise ValueError(
            "synthetic proof requires the browser proof service and a Copilot selection"
        )
    if args.out is None or not args.no_library or not args.live:
        raise ValueError("synthetic proof requires a scheduler output and library ownership")
    digest = verify_upload(args.sources, args.context)
    submitted_context = load_context(args.context.read_bytes())
    gated = no_legal_documents(submitted_context)
    source_digests = {FILING.name: digest}
    for fixture in (PORTFOLIO, AGREEMENT):
        uploaded = args.sources / fixture.name
        if uploaded.is_file():
            source_digests[fixture.name] = hashlib.sha256(fixture.read_bytes()).hexdigest()

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
    if args.prior != "none" or (
        run.pathway != "credit_snapshot"
        and not supports_custom_case(
            prepared, submitted_context.attachments.legal_documents, set(source_digests)
        )
    ):
        raise ValueError(
            "synthetic proof requires a first Credit Snapshot run or the documented "
            "Northbridge Structural priority case"
        )

    def complete(_adapter: CopilotAdapter, request: TurnRequest, **_kwargs: object) -> AdapterReply:
        context = json.loads(request.messages[1].text)
        for name, digest in source_digests.items():
            if context["sources"].get(name) != digest:
                raise ValueError(f"CP-OS request did not retain the uploaded {name} digest")
        if context["run"] != run.model_dump(mode="json"):
            raise ValueError("CP-OS request did not retain the submitted run identity")
        text = canned_handoff(context, f"{run.issuer_name} as of {run.as_of}.", gated=gated)
        usage = Usage(
            input_tokens=0,
            cached_read_tokens=0,
            cache_write_tokens=0,
            output_tokens=0,
            reasoning_tokens=0,
        )
        call = ToolCall("synthetic-browser-proof", "write_handoff", {"markdown": text})
        turn = Turn("", (call,), usage, "tool_use", "synthetic", "synthetic", 200, Decimal(0))
        return AdapterReply("ok", turn, None, 200, None, None, 1, 2, usage, Decimal(0))

    with patch.object(CopilotAdapter, "complete", complete):
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
