"""Instruction-length trial: one module, fixed upstream handoffs, three instruction texts.

    uv run python tools/instruction_trial.py offline --bundle BUNDLE --module CP-3 --out SCRATCH
    uv run python tools/instruction_trial.py live --bundle BUNDLE --module CP-3 --arm B \\
        --out RUNS/cp3-B-1 --ruling docs/rulings/<file>.md --config copilot-sol-medium --cap 10

A temporary adaptation for docs/sweeps/2026-11-25-instruction-length/REPORT.md, not a launcher.
BUNDLE is a retained run copy: `context.json`, `inputs/` (the issuer files) and `handoffs/<M>.md`.
The run is prepared afresh from the bundle's context and files, so the instructions are today's;
the module is then given the bundle's upstream handoffs and one arm's instruction text:

    A  the instructions as prepared, unchanged
    B  A less text that repeats or cannot apply here (`neutral`), nothing reworded
    C  A's head with the restructured method in `trial/arms/C/<module>.md`

The acceptance check is the launcher's own, built from the canonical method, for every arm.
`offline` calls no provider: it measures each arm, lists the ids the arm no longer names, and
runs the real executor against a stand-in that submits the bundle's own handoff for the module.
`live` makes paid calls for one arm, once, into a new folder; it needs a ruling naming the config.
"""

import argparse
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from types import MappingProxyType
from typing import Any

import instruction_metrics

from deploy_vii.registry import dependencies
from deploy_workflow.model.adapter import AdapterReply, ModelAdapter
from deploy_workflow.model.configs import CONFIGS
from deploy_workflow.model.copilot import prompt_tokens_estimate
from deploy_workflow.model.handoff import HandoffExecutor
from deploy_workflow.model.turn import ToolCall, Turn, TurnRequest, Usage
from deploy_workflow.owners import cpos, cpos_launch
from deploy_workflow.owners.cpos_launch_prompts import METHOD_MARK

ROOT = Path(__file__).resolve().parents[1]
ARMS = ("A", "B", "C")
ARM_C = ROOT / "trial/arms/C"
SENT_FILE = re.compile(r"^=== (.+?) sha256 [0-9a-f]{64} ===$", re.MULTILINE)
# The shared sections a module is sent after its own skill files: arm C carries them unchanged.
SHARED = ("CANON_SHARED.md", "CPOS_REGISTER_SCOPE.md")
REGISTER_ID = re.compile(r"\bT\d+[A-Z]*\.\d+\b")
# Paragraphs of the method that only tell the model to run a helper script or to copy what one
# prints, which `TRANSPORT_RULES` in the head says cannot be done here; and the worked example of
# a score the head says Python computes. Read one by one on 2026-11-25; a paragraph that also
# holds a rule that still applies is not listed.
CANNOT_APPLY = re.compile(
    r"## Invocation fields — binding before drafting\n"
    r"|## Automated QA validation\n"
    r"|Run `python3 \./scripts/validate_handoff\.py"
    r"|#### Worked example\n"
)
COMMENT_LINE = re.compile(r"<!--.*-->")
REPLAY_CONFIG = "copilot-sol-medium"


def _paragraphs(text: str) -> list[str]:
    return re.split(r"\n[ \t]*\n", text)


def _body(paragraph: str) -> str:
    """A paragraph without its heading line: the same text sent again under a renamed heading
    ("relocated from", "continued") is still a repeat."""
    first, _, rest = paragraph.strip().partition("\n")
    return rest.strip() if first.startswith("#") else paragraph.strip()


def neutral(method: str) -> str:
    """Arm B's method text: the second and later copies of a paragraph body of 200 characters or
    more are dropped, and so is each paragraph that cannot apply here. Nothing is reworded."""
    seen: set[str] = set()
    kept = []
    for paragraph in _paragraphs(method):
        lines = paragraph.strip().split("\n")
        opening = "\n".join(line for line in lines if not COMMENT_LINE.fullmatch(line.strip()))
        if CANNOT_APPLY.match(opening + "\n"):
            marker = COMMENT_LINE.fullmatch(lines[0].strip()) and "BEGIN" in lines[0]
            if marker and not any("END" in line for line in lines[1:]):
                kept.append(lines[0])  # an opening marker whose closing one is further down
            continue
        body = _body(paragraph)
        if len(body) >= instruction_metrics.PARAGRAPH_FLOOR:
            if body in seen:
                continue
            seen.add(body)
        kept.append(paragraph)
    return "\n\n".join(kept)


def restructured(module: str, method: str) -> str:
    """Arm C's method text: the restructured file for the module's own skill files, then the
    shared sections exactly as arm A sends them."""
    path = ARM_C / f"{module}.md"
    if not path.is_file():
        raise SystemExit(f"arm C has no text for {module}: {path} is missing")
    text = path.read_text(encoding="utf-8").strip()
    heading = f"=== trial arm C: {module} method, restructured sha256 "
    heading += hashlib.sha256(text.encode()).hexdigest() + " ==="
    shared = [
        m.start() for m in SENT_FILE.finditer(method) if m[1].split(" § ")[0].endswith(SHARED)
    ]
    tail = method[min(shared) :] if shared else ""
    return f"{heading}\n{text}\n\n{tail}"


def arm_text(arm: str, module: str, prepared_text: str) -> str:
    head, mark, method = prepared_text.partition(METHOD_MARK)
    if not mark:
        raise SystemExit(f"{module}: the prepared instructions have no method block")
    if arm == "A":
        return prepared_text
    return head + mark + (neutral(method) if arm == "B" else restructured(module, method))


def dropped_ids(prepared_text: str, text: str) -> list[str]:
    """The register and table ids arm A's method names that ``text`` does not."""
    before = REGISTER_ID.findall(prepared_text.partition(METHOD_MARK)[2])
    after = set(REGISTER_ID.findall(text.partition(METHOD_MARK)[2]))
    return sorted(set(before) - after)


@dataclass(frozen=True)
class Case:
    prepared: cpos_launch.Prepared
    sources: dict[str, bytes]
    handoffs: dict[str, bytes]

    def instructions(self, module: str) -> str:
        spec = self.prepared.plan.instructions[module]
        return (self.prepared.manifest.parent / spec.path).read_text(encoding="utf-8")

    def task(self, module: str, text: str) -> cpos.HandoffTask:
        """The module's task as CP-OS builds it (`_Modules._dispatch`), with the bundle's
        handoffs standing for the producers' accepted ones."""
        ordered = self.prepared.ordered
        producers = dependencies(ordered)[module]
        if missing := sorted(producers - set(self.handoffs)):
            raise SystemExit(f"{module}: the bundle has no handoff for {', '.join(missing)}")
        supplied = {m: self.handoffs[m] for m in ordered if m in producers}
        earlier = ordered[: ordered.index(module)]
        accepted = {m: self.handoffs[m] for m in earlier if m in self.handoffs}
        return cpos.HandoffTask(
            self.prepared.plan.run,
            module,
            text.encode(),
            MappingProxyType(self.sources),
            MappingProxyType(supplied),
            1,
            (),
            accepted=MappingProxyType(accepted),
        )


def load_case(bundle: Path, work: Path, config: str) -> Case:
    """Prepare a run from the bundle's context and issuer files (offline; nothing is sent)."""
    prepared = cpos_launch.prepare(
        bundle / "context.json",
        bundle / "inputs",
        work / "prepared",
        config=config,
        cap="50",
        prior=cpos_launch.NO_PRIOR,
    )
    sources = cpos._pinned_inputs(prepared.manifest.parent, prepared.plan.sources)
    handoffs = {p.stem: p.read_bytes() for p in sorted((bundle / "handoffs").glob("*.md"))}
    return Case(prepared, sources, handoffs)


class Replay:
    """Stands for a provider offline: each turn submits the same Markdown through `write_handoff`.
    It records the size of the first request, which is what a model would be sent."""

    config_id = REPLAY_CONFIG
    # Not a ruling and never read: with None the executor would price this route from tokens,
    # which the Copilot route has no price for, and stop on an unknown charge.
    ruling = Path("offline-replay-no-ruling")

    def __init__(self, markdown: str) -> None:
        self.markdown = markdown
        self.first_request_bytes = 0
        self.turns = 0

    def complete(
        self, request: TurnRequest, *, invocation_digest: str, call_index: int, reservation_id: str
    ) -> AdapterReply:
        if not self.turns:
            parts = [m.text for m in request.messages] + [
                json.dumps(t.parameters) for t in request.tools
            ]
            self.first_request_bytes = sum(len(p.encode()) for p in parts)
        self.turns += 1
        usage = Usage(1, 0, 0, output_tokens=1, reasoning_tokens=0)  # priced, and next to nothing
        call = ToolCall(f"replay-{self.turns}", "write_handoff", {"markdown": self.markdown})
        model = CONFIGS[REPLAY_CONFIG].model
        turn = Turn("", (call,), usage, "tool_use", model, "replay", 200, Decimal(0))
        return AdapterReply("ok", turn, None, 200, None, None, 0.0, 0.0, usage, Decimal(0))


def _executor(
    folder: Path, adapter: ModelAdapter, case: Case, args: argparse.Namespace
) -> HandoffExecutor:
    return HandoffExecutor(
        folder / "live",
        adapter=adapter,
        cap_usd=Decimal(args.cap),
        check=cpos_launch.checker(case.prepared.layout),
        max_turns=args.max_turns,
        max_output_tokens=cpos_launch.MAX_OUTPUT_TOKENS,
        events=folder,
    )


def write_reviews(folder: Path) -> list[list[str]]:
    """The issues the check raised at each write of the module run under ``folder``, in order."""
    reviews = sorted(
        (folder / "live/modules").glob("*/*.review.json"), key=lambda p: int(p.stem.split(".")[0])
    )
    return [list(json.loads(p.read_text())["issues"]) for p in reviews]


def replay(
    case: Case, module: str, text: str, folder: Path, args: argparse.Namespace
) -> dict[str, Any]:
    """Run the real executor and check on one arm with the bundle's own handoff as the answer."""
    stand_in = Replay(case.handoffs[module].decode("utf-8"))
    executor = _executor(folder, stand_in, case, args)
    task = case.task(module, text)
    try:
        cpos._handoff(task, folder, executor, executor.check, 1)
        outcome = "accepted"
    except (ValueError, RuntimeError) as stop:
        outcome = f"not accepted: {str(stop)[:200]}"
    issues = write_reviews(folder)
    return {
        "first_request_bytes": stand_in.first_request_bytes,
        "first_request_tokens_estimate": prompt_tokens_estimate(stand_in.first_request_bytes),
        "replay_outcome": outcome,
        "replay_writes": len(issues),
        "replay_first_write_issues": issues[0] if issues else [],
    }


def offline(args: argparse.Namespace) -> int:
    case = load_case(args.bundle, args.out / "case", REPLAY_CONFIG)
    module = args.module
    if module not in case.handoffs:
        raise SystemExit(f"{module}: the bundle holds no handoff of its own to replay")
    prepared_text = case.instructions(module)
    report: dict[str, Any] = {"module": module, "bundle": args.bundle.name, "arms": {}}
    for arm in args.arms:
        text = arm_text(arm, module, prepared_text)
        row: dict[str, Any] = dict(instruction_metrics.measure(text))
        row["dropped_ids"] = dropped_ids(prepared_text, text)
        missing = [i for i in cpos_launch.required_registers(module) if i not in text]
        row["required_registers_not_named"] = missing
        row.update(replay(case, module, text, args.out / f"replay-{module}-{arm}", args))
        report["arms"][arm] = row
    target = args.out / f"offline-{module}.json"
    target.write_text(json.dumps(report, indent=1) + "\n")
    for arm, row in report["arms"].items():
        print(
            f"{module} {arm}: {row['chars']:,} characters, first request about "
            f"{row['first_request_tokens_estimate']:,} tokens, {len(row['dropped_ids'])} ids "
            f"dropped, replay {row['replay_outcome']}, "
            f"{len(row['replay_first_write_issues'])} issue(s) on the first write"
        )
    print(f"written: {target}")
    return 0


def run_summary(folder: Path) -> dict[str, Any]:
    """What one live module run cost and how its writes fared, from the records it left."""
    calls = [json.loads(line) for line in (folder / "live/calls.jsonl").read_text().splitlines()]
    issues = write_reviews(folder)

    def total(key: str) -> int:
        return sum(int(c[key] or 0) for c in calls)

    return {
        "calls": len(calls),
        "input_tokens": total("input_tokens"),
        "cached_read_tokens": total("cached_read_tokens"),
        "output_tokens": total("output_tokens"),
        "reasoning_tokens": total("reasoning_tokens"),
        "first_call_input_tokens": int(calls[0]["input_tokens"] or 0) if calls else 0,
        "settled_usd": str(sum(Decimal(c["settled_usd"] or "0") for c in calls)),
        "started_at": calls[0]["started_at"] if calls else None,
        "finished_at": calls[-1]["finished_at"] if calls else None,
        "writes": len(issues),
        "issues_per_write": [len(i) for i in issues],
        "first_write_issues": issues[0] if issues else [],
    }


def live(args: argparse.Namespace) -> int:
    """One paid run of one arm. The ruling gate is the engine's own (`live_adapter_for`)."""
    if args.out.exists():
        raise SystemExit(f"{args.out} exists: each repeat needs its own new folder")
    case = load_case(args.bundle, args.out / "case", args.config)
    text = arm_text(args.arm, args.module, case.instructions(args.module))
    task = case.task(args.module, text)
    adapter = cpos.live_adapter_for(CONFIGS[args.config], args.ruling, os.environ, None)
    executor = None
    outcome = "accepted"
    try:
        executor = _executor(args.out, adapter, case, args)
        cpos._handoff(task, args.out, executor, executor.check, 1)
    except (ValueError, RuntimeError) as stop:
        outcome = f"not accepted: {cpos.with_notes(stop)}"
    finally:
        cpos._release(adapter, executor)
    summary = {"module": args.module, "arm": args.arm, "config": args.config, "outcome": outcome}
    summary.update(instruction_metrics.measure(text))
    summary.update(run_summary(args.out))
    (args.out / "trial-summary.json").write_text(json.dumps(summary, indent=1) + "\n")
    print(json.dumps(summary, indent=1))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    modes = parser.add_subparsers(dest="mode", required=True)
    for name in ("offline", "live"):
        mode = modes.add_parser(name)
        mode.add_argument("--bundle", type=Path, required=True)
        mode.add_argument("--module", required=True)
        mode.add_argument("--out", type=Path, required=True)
        mode.add_argument("--max-turns", type=int, default=32)
        mode.add_argument("--cap", default="50", help="USD the module's calls may total")
    modes.choices["offline"].add_argument("--arms", nargs="+", choices=ARMS, default=list(ARMS))
    modes.choices["live"].add_argument("--arm", choices=ARMS, required=True)
    modes.choices["live"].add_argument("--ruling", type=Path, required=True)
    modes.choices["live"].add_argument("--config", choices=tuple(CONFIGS), required=True)
    args = parser.parse_args()
    return offline(args) if args.mode == "offline" else live(args)


if __name__ == "__main__":
    sys.exit(main())
