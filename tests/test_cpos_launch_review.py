"""Context-summary disclosures of the launch review, from events as the writer emits them."""

from typing import Any

from deploy_workflow.model.handoff import FAILED_NO_USAGE
from deploy_workflow.owners.cpos_launch_review import _uncharged_summaries

STARTED = "started, no completion reported"
NO_CHARGE = "completed after the module ended, no readable charge"


def _ev(name: str, module: str = "m1", **fields: Any) -> dict[str, Any]:
    return {"event": name, "module": module, "call_index": 1, **fields}


def test_anonymous_start_charged_late_is_only_the_late_charge() -> None:
    events = [
        _ev("context_compaction_started"),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_charge_late", usd="0.1", attempt_id=""),
    ]
    assert _uncharged_summaries(events) == {}


def test_anonymous_start_without_late_charge_is_disclosed_once() -> None:
    events = [_ev("context_compaction_started"), _ev("compaction_uncharged", reason=STARTED)]
    assert len(_uncharged_summaries(events)) == 1


def test_two_anonymous_starts_one_charged_late_leaves_one() -> None:
    events = [
        _ev("context_compaction_started"),
        _ev("context_compaction_started"),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_charge_late", usd="0.1", attempt_id=""),
    ]
    assert len(_uncharged_summaries(events)) == 1


def test_late_charge_does_not_cancel_other_reasons() -> None:
    events = [
        _ev("compaction_uncharged", reason=FAILED_NO_USAGE),
        _ev("compaction_uncharged", reason=NO_CHARGE),
        _ev("compaction_charge_late", usd="0.1", attempt_id=""),
    ]
    assert len(_uncharged_summaries(events)) == 2


def test_late_charge_in_another_module_cancels_nothing() -> None:
    events = [
        _ev("context_compaction_started"),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_charge_late", module="m2", usd="0.1", attempt_id=""),
    ]
    assert len(_uncharged_summaries(events)) == 1


def test_attempt_id_late_charge_replaces_its_uncharged_event() -> None:
    events = [
        _ev("context_compaction_started", attempt_id="a1"),
        _ev("compaction_uncharged", reason=STARTED, attempt_id="a1"),
        _ev("compaction_charge_late", usd="0.1", attempt_id="a1"),
        _ev("context_compaction_started", attempt_id="a2"),
        _ev("compaction_uncharged", reason=STARTED, attempt_id="a2"),
    ]
    assert list(_uncharged_summaries(events)) == [("m1", "a2")]


def test_anonymous_start_completed_late_unreadable_is_disclosed_once() -> None:
    # sequence C: the module end disclosed the start, then the late completion had no charge
    events = [
        _ev("context_compaction_started"),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_uncharged", reason=NO_CHARGE),
    ]
    assert len(_uncharged_summaries(events)) == 1


def test_late_unreadable_completion_before_started_disclosure_is_disclosed_once() -> None:
    # sequence L: the writer settles the late completion, then the started loop
    events = [
        _ev("context_compaction_started", call_index=0),
        _ev("compaction_uncharged", reason=NO_CHARGE),
        _ev("compaction_uncharged", reason=STARTED),
    ]
    assert len(_uncharged_summaries(events)) == 1


def test_unreadable_late_completions_cancel_no_more_starts_than_exist() -> None:
    events = [
        _ev("context_compaction_started"),
        _ev("context_compaction_started"),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_uncharged", reason=NO_CHARGE),
        _ev("compaction_uncharged", reason=NO_CHARGE),
        _ev("compaction_uncharged", reason=NO_CHARGE),
    ]
    # three late events, but only one started disclosure exists to cancel
    assert len(_uncharged_summaries(events)) == 3


def test_unreadable_late_completion_in_another_module_cancels_nothing() -> None:
    events = [
        _ev("context_compaction_started"),
        _ev("compaction_uncharged", reason=STARTED),
        _ev("compaction_uncharged", module="m2", reason=NO_CHARGE),
    ]
    assert len(_uncharged_summaries(events)) == 2
