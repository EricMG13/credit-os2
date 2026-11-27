"""Offline sizing of the first CP-OS exchange using synthetic issuer files."""

import json
from decimal import Decimal
from pathlib import Path

import pytest

from deploy_workflow.model.adapter import AdapterReply
from deploy_workflow.model.handoff import HandoffExecutor
from deploy_workflow.model.turn import TurnRequest
from deploy_workflow.owners.cpos import HandoffTask
from deploy_workflow.owners.cpos_launch import LaunchRefused, Prepared, prepare
from deploy_workflow.run_events import read_events


class OfflineStop:
    ruling = None

    def __init__(self, config: str) -> None:
        self.config_id = config
        self.calls: list[TurnRequest] = []

    def complete(
        self,
        request: TurnRequest,
        *,
        invocation_digest: str,
        call_index: int,
        reservation_id: str,
    ) -> AdapterReply:
        self.calls.append(request)
        return AdapterReply("not_sent", None, None, None, "OfflineStop", None, None, None)


def first_exchange(prepared: Prepared, config: str, max_output: int) -> tuple[Decimal, bytes]:
    directory = prepared.directory
    module = prepared.ordered[0]
    assert module == "CP-0"
    task = HandoffTask(
        prepared.plan.run,
        module,
        (directory / prepared.plan.instructions[module].path).read_bytes(),
        {
            name: (directory / entry.path).read_bytes()
            for name, entry in prepared.plan.sources.items()
        },
        {},
        1,
        (),
    )
    adapter = OfflineStop(config)
    executor = HandoffExecutor(
        directory / "live",
        adapter=adapter,
        cap_usd=prepared.plan.provider_cap_usd,
        check=lambda *_: (),
        max_output_tokens=max_output,
        events=directory,
    )
    with pytest.raises(RuntimeError, match="cpos_live_stopped: not_sent"):
        executor(task)
    assert len(adapter.calls) == 1
    assert executor.budget.spent == 0
    events = (row for row in read_events(directory / "events.jsonl") if row["event"] == "turn")
    hold = Decimal(next(events)["held_usd"])
    (request,) = (directory / "live" / "modules").glob("*/0.request.json")
    return hold, request.read_bytes()


@pytest.mark.parametrize(
    ("config", "terms"),
    [
        ("opus-medium", (64000, "8", "20", 64000)),
        ("deepseek-max", (32000, "0.45", "1.80", 32000)),
        ("copilot-opus-medium", (32000, "8", "20", 128000)),
    ],
)
def test_prepared_hold_covers_first_screening_exchange(
    tmp_path: Path, config: str, terms: tuple[int, str, str, int]
):
    max_output, input_rate, output_rate, held_output = terms
    fixture = Path(__file__).resolve().parents[1] / "cases/cpdr-context-cutoff/context.json"
    data = json.loads(fixture.read_bytes())
    data["run"].update(pathway="credit_screening", as_of="2025-03-31", cutoff="")
    data["identity"].update(issuer_name="Northbridge Synthetic Group", issuer_id="nbg")
    context = tmp_path / "context.json"
    context.write_text(json.dumps(data))
    sources = tmp_path / "issuer"
    sources.mkdir()
    for number in range(800):
        name = f"{number:03}-" + "synthetic-source-description-" * 5 + ".txt"
        (sources / name).write_text(f"Synthetic issuer statement number {number}.")

    probe = prepare(context, sources, tmp_path / "probe", config=config, cap="10")
    actual, request = first_exchange(probe, config, max_output)
    # The three configurations hold one input token per serialized byte, 4096 framing
    # tokens, and the configured output ceiling, at the listed USD per million rates.
    expected = (
        (len(request) + 4096) * Decimal(input_rate) + held_output * Decimal(output_rate)
    ) / 1_000_000
    assert actual == expected
    assert probe.hold == expected

    tight = prepare(context, sources, tmp_path / "tight", config=config, cap=probe.hold)
    assert first_exchange(tight, config, max_output) == (actual, request)

    # The exact hold is the boundary for this source-heavy case. A lower cap fails in prepare,
    # before the output folder or its manifest has been created.
    small = tmp_path / "too-small"
    with pytest.raises(LaunchRefused, match="call holds up to USD"):
        prepare(context, sources, small, config=config, cap=actual - Decimal("0.00000001"))
    assert not small.exists()
