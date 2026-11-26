"""The executor's read cap follows the session's tier (owner, 2026-11-26: "read up to the hold").

Sizes are worked by hand: copilot-sol/luna hold 3 x (1,050,000 - 4,096) = 3,137,712 bytes, the
default-tier OpenAI hold 2 x (1,050,000 - 4,096) = 2,091,808 bytes; reads on the default tier stop
at 1,100,000, which leaves 991,808 bytes, and the long tier keeps that headroom:
3,137,712 - 991,808 = 2,145,904. Offline: fake adapters, no runtime, no seat, no network."""

import json
from collections.abc import Callable
from dataclasses import replace
from decimal import Decimal
from pathlib import Path

import pytest

from deploy_workflow.model import handoff
from deploy_workflow.model.handoff import HandoffExecutor
from deploy_workflow.model.pricing import handoff_largest_request_bytes
from deploy_workflow.model.turn import ToolCall
from tests.test_handoff_loop import GOOD, check, task, turn, write_call

LONG_CAP = 2_145_904
DEFAULT_CAP = 1_100_000


class Copilot:
    """The route as the executor sees it: live (a ruling), a reported charge, a tier answer."""

    ruling = Path("lift.md")

    def __init__(self, config_id: str, budget: int | None, admits: int | None = None) -> None:
        self.config_id = config_id
        self._budget = budget
        self._admits = admits
        self.requests: list[object] = []
        self.asked: list[str] = []
        self.replies: list[object] = []

    def long_tier_budget(self, invocation_digest: str) -> int | None:
        self.asked.append(invocation_digest)
        return self._budget

    def prompt_admits(self, invocation_digest: str) -> int | None:
        return self._admits

    def complete(self, request: object, **_identity: object) -> object:
        self.requests.append(request)
        return self.replies.pop(0)


class Plain:
    """A test adapter with no tier query (as every non-Copilot adapter)."""

    config_id = "sol-medium"
    ruling = Path("lift.md")

    def __init__(self) -> None:
        self.requests: list[object] = []
        self.replies: list[object] = []

    def complete(self, request: object, **_identity: object) -> object:
        self.requests.append(request)
        return self.replies.pop(0)


def read_result(tmp: Path, adapter: Copilot | Plain, extra: int) -> dict[str, object]:
    """The result of the one read_pages the model asks for, with ``extra`` bytes of handoff."""
    read = ToolCall("r", "read_pages", {"source_id": "S1.txt", "first": 1, "last": 1})
    adapter.replies = [
        replace(turn(read), billed_usd=Decimal("0.01")),
        replace(turn(write_call()), billed_usd=Decimal("0.01")),
    ]
    loop = HandoffExecutor(
        tmp / "live", adapter=adapter, cap_usd=Decimal(50), check=check, events=tmp
    )
    big = replace(task(), handoffs={"CP-1": b"x" * extra})
    assert loop(big) == GOOD
    (tools,) = (tmp / "live" / "modules").glob("*/0.tools.json")
    (result,) = json.loads(tools.read_text())
    return result  # type: ignore[no-any-return]


def request_bytes(adapter: Copilot | Plain) -> int:
    first = adapter.requests[0]
    return len(json.dumps(handoff.asdict(first), separators=(",", ":")).encode())  # type: ignore[arg-type]


def extra_for(tmp: Path, make: object, cap: int) -> int:
    """Handoff bytes that put the first request at ``cap`` minus the page result's size."""
    probe = make()  # type: ignore[operator]
    result = read_result(tmp / "probe", probe, 1000)
    base = request_bytes(probe) - 1000
    page = len(json.dumps(result["text"]))
    assert result["text"] != handoff.READS_FULL
    return cap - page - base


def long_sol() -> Copilot:
    return Copilot("copilot-sol-medium", 922_000)


def test_g1a_a_long_tier_session_reads_past_the_old_cap(tmp_path: Path) -> None:
    adapter = long_sol()
    result = read_result(tmp_path, adapter, 1_200_000)
    assert request_bytes(adapter) > DEFAULT_CAP
    assert result["name"] == "read_pages" and result["text"] != handoff.READS_FULL
    assert adapter.asked  # the executor asked under the module's digest


def test_g1b_a_long_tier_session_reads_up_to_the_hold_less_the_headroom(tmp_path: Path) -> None:
    extra = extra_for(tmp_path, long_sol, LONG_CAP)
    ok = read_result(tmp_path / "at", long_sol(), extra)
    assert ok["text"] != handoff.READS_FULL  # request + page == 2,145,904 exactly: allowed
    over = read_result(tmp_path / "over", long_sol(), extra + 1)
    assert over["text"] == handoff.READS_FULL  # one byte past it


def test_g1c_a_session_on_the_default_tier_stops_at_the_old_cap(tmp_path: Path) -> None:
    adapter = Copilot("copilot-sol-medium", None)
    assert read_result(tmp_path, adapter, 1_200_000)["text"] == handoff.READS_FULL
    extra = extra_for(tmp_path / "e", lambda: Copilot("copilot-sol-medium", None), DEFAULT_CAP)
    assert read_result(tmp_path / "at", Copilot("copilot-sol-medium", None), extra)["text"] != (
        handoff.READS_FULL
    )


@pytest.mark.parametrize(
    "make",
    [
        lambda: Copilot("copilot-opus-medium", 922_000),
        lambda: Copilot("copilot-opus-medium", None),
    ],
)
def test_g1d_opus_keeps_the_old_cap_whatever_the_adapter_says(tmp_path: Path, make: object) -> None:
    result = read_result(tmp_path, make(), 1_200_000)  # type: ignore[operator]
    assert result["text"] == handoff.READS_FULL


def test_g1d_an_adapter_without_a_tier_query_keeps_the_old_cap(tmp_path: Path) -> None:
    assert read_result(tmp_path, Plain(), 1_200_000)["text"] == handoff.READS_FULL


def sol_with(budget: int) -> Callable[[], Copilot]:
    return lambda: Copilot("copilot-sol-medium", budget)


def test_m1r_a_smaller_long_budget_stops_reads_earlier(tmp_path: Path) -> None:
    # B = 700,000: the budget binds, floor(3.85 x 700,000) - 991,808 = 1,703,192
    make = sol_with(700_000)
    extra = extra_for(tmp_path / "e7", make, 1_703_192)
    assert read_result(tmp_path / "a7", make(), extra)["text"] != handoff.READS_FULL
    assert read_result(tmp_path / "o7", make(), extra + 1)["text"] == handoff.READS_FULL
    # B = 500,000: 1,925,000 - 991,808 is under the default cap, so reads stop at 1,100,000
    small = sol_with(500_000)
    assert read_result(tmp_path / "a5", small(), 1_100_001)["text"] == handoff.READS_FULL


def test_g1e_the_largest_request_a_hold_accepts() -> None:
    assert handoff_largest_request_bytes("copilot-sol-medium") == 3_137_712
    assert handoff_largest_request_bytes("copilot-sol-high") == 3_137_712
    assert handoff_largest_request_bytes("copilot-luna-xhigh") == 3_137_712
    assert handoff_largest_request_bytes("sol-medium") == 2_091_808
    # the Opus hold has no context ceiling to reach: no bound
    assert handoff_largest_request_bytes("copilot-opus-medium") is None
    assert handoff_largest_request_bytes("copilot-opus-high") is None


def test_h2_a_default_tier_session_reads_half_of_what_it_admits(tmp_path: Path) -> None:
    # admits 140,928 tokens: floor(140,928 x 3.85) = 542,572 bytes, half is 271,286

    def make() -> Copilot:
        return Copilot("copilot-sol-medium", None, 140_928)

    extra = extra_for(tmp_path / "e", make, 271_286)
    assert read_result(tmp_path / "at", make(), extra)["text"] != handoff.READS_FULL
    assert read_result(tmp_path / "over", make(), extra + 1)["text"] == handoff.READS_FULL


def test_h2_a_session_admitting_more_than_the_old_cap_keeps_the_old_cap(tmp_path: Path) -> None:
    # admits 868,928 tokens: 3,345,372 bytes, half 1,672,686, capped at 1,100,000
    adapter = Copilot("copilot-sol-medium", None, 868_928)
    assert read_result(tmp_path, adapter, 1_200_000)["text"] == handoff.READS_FULL
