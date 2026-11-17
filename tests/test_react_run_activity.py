from decimal import Decimal
from pathlib import Path

import pytest

from deploy_workflow.inbox import activity, runs
from deploy_workflow.inbox.layout import Layout
from deploy_workflow.inbox.scheduler import _REBUILD_FAILED
from deploy_workflow.model.budget import Budget
from react_frontend.run_activity import _cap, _usage, listing, reply


def test_usage_separates_settled_charges_and_unknown_or_open_holds(tmp_path):
    budget = Budget(Decimal(20), tmp_path / "live")
    budget.reserve("settled", Decimal(2), config_id="sol-medium")
    budget.settle("settled", Decimal("1.25"))
    budget.reserve("unknown", Decimal(3), config_id="sol-medium")
    budget.settle("unknown", None)
    assert _usage(tmp_path) == {
        "spent": "4.25",
        "settled_spent": "1.25",
        "held": "3",
    }


def test_usage_counts_a_crash_left_reservation_as_held(tmp_path):
    budget = Budget(Decimal(20), tmp_path / "live")
    budget.reserve("open", Decimal(4), config_id="sol-medium")

    assert _usage(tmp_path) == {"spent": "4", "settled_spent": "0", "held": "4"}


def test_usage_is_unavailable_when_journal_cannot_be_read(tmp_path):
    (tmp_path / "live").mkdir()
    (tmp_path / "live" / "owner-run-audit").mkdir()
    (tmp_path / "live" / "owner-run-audit" / "reservations").write_text("bad")

    assert _usage(tmp_path) == {"spent": None, "settled_spent": None, "held": None}


def test_usage_does_not_report_zero_when_live_path_is_not_a_directory(tmp_path):
    (tmp_path / "live").write_text("unreadable", encoding="utf-8")

    assert _usage(tmp_path) == {"spent": None, "settled_spent": None, "held": None}


def test_activity_uses_recorded_selected_or_legacy_pathway_cap(tmp_path):
    layout = Layout(tmp_path)
    layout.state.mkdir(parents=True)
    cases = (
        ("legacy-full", "credit_snapshot", "", "20"),
        ("legacy-lite", "lite_credit_assessment", "", "15"),
        ("selected-full", "credit_snapshot", "23", "23"),
    )
    for run_id, pathway, cap, expected in cases:
        record = runs.Record(
            id=run_id,
            pathway=pathway,
            folder=run_id,
            status="finished",
            claimed_at="2026-11-16T12:00:00Z",
            cap=cap,
        )
        runs.save(layout, record)
        (layout.runs / run_id).mkdir(parents=True)
        response = reply(layout, run_id)
        assert response.body["cap"] == expected


def test_activity_cap_missing_and_pinned_legacy_workflow_cap():
    assert _cap({}, None) is None
    assert _cap({"provider_cap_usd": "50.00"}, "25") == "50.00"


_RETRY = "To try again, choose Start from this run on the run's page."
_ASK = "If it ends the same way again, ask whoever runs the service to check the run's"
_SERVICE_LOG_THEN_RETRY = (
    "Ask whoever runs the service to check the service's log, then choose Start from this run on "
    "the run's page."
)
_NO_REASON = (
    f"The run ended before it finished, and the service recorded no reason. {_RETRY} {_ASK} log."
)
_PROVIDER = (
    "The run stopped because of a problem with a model provider call, not because it reached "
    f"the spending cap. {_RETRY}"
)
_CHECKER = f"The run stopped because a module's answer did not pass the checks. {_RETRY}"
_INTERRUPTED = f"The run was interrupted before it finished. {_RETRY}"
_RULING = (
    "The run stopped because the approval that lets the service make paid model calls was not in "
    "place for this setup. Starting it again will stop the same way until whoever runs the "
    "service puts it in place."
)
_UNCLASSIFIED = f"The run stopped for a reason the service did not classify. {_RETRY} {_ASK} log."
_NOT_LISTED = (
    "The run finished, but the library would not list it, so it has no report. "
    f"{_RETRY} {_ASK} record."
)
_DELIVERIES = (
    "The run finished, but the service did not find exactly one delivery for it, so it has no "
    f"report. {_RETRY} {_ASK} record."
)
_NOT_FILED = (
    "The run finished, but the service could not file its report. Ask whoever runs the service "
    "to check the service's log before starting it again."
)
_NOT_STARTED = f"The run could not be started, so it did not run. {_SERVICE_LOG_THEN_RETRY}"
_NOT_SAVED = (
    "The service stopped this run because it could not save the run's record. "
    f"{_SERVICE_LOG_THEN_RETRY}"
)
_NO_CONTEXT = f"The run's submission record was missing, so it was not started. {_RETRY}"
_NOT_REBUILT = (
    "The library could not be rebuilt, so runs that have ended wait to be filed. The service "
    "tries again on each check; if this stays, ask whoever runs the service to check the "
    "service's log."
)
_DIGEST = "6db777d690651e26d1fa6a9706bd571fa0f4fba908d022d6cfa87407d92b5585"
_REFUSED = (
    f"the delivery does not record CP-1's handoff (deliveries/{_DIGEST}/view.json is missing)"
)
# (what the scheduler stored, what the reader is shown). The shown text is written out here so the
# test does not depend on the production table.
_READER_REASONS = [
    ("stopped: provider", _PROVIDER),
    ("stopped: checker", _CHECKER),
    ("stopped: interrupted", _INTERRUPTED),
    ("stopped: ruling", _RULING),
    ("stopped: other", _UNCLASSIFIED),
    ("stopped: a kind this page does not know", _UNCLASSIFIED),
    (f"not listed: {_REFUSED}", _NOT_LISTED),
    ("not listed: CP-2D: its answer is not in a CP-OS request folder", _NOT_LISTED),
    ("expected one deliveries/*/delivery.json, found 2", _DELIVERIES),
    ("could not be filed: the issuer registry is corrupt", _NOT_FILED),
    ("could not be started: [Errno 13] Permission denied: 'launch.cmd'", _NOT_STARTED),
    (
        "stopped by the scheduler: its record could not be saved ([Errno 28] No space left)",
        _NOT_SAVED,
    ),
    (
        "no context.json in _engine/drops/20261117-080332-01; submit it again from the run page",
        _NO_CONTEXT,
    ),
]


def _save_ended(layout: Layout, status: runs.Status, reason: str) -> None:
    layout.state.mkdir(parents=True, exist_ok=True)
    runs.save(
        layout,
        runs.Record(
            id="ended",
            pathway="credit_snapshot",
            folder="ended",
            status=status,
            claimed_at="2026-11-17T08:00:00Z",
            ended_at="2026-11-17T08:03:00Z",
            reason=reason,
        ),
    )
    (layout.runs / "ended").mkdir(parents=True, exist_ok=True)


@pytest.mark.parametrize(("stored", "shown"), _READER_REASONS)
def test_an_ended_runs_reason_reaches_the_page_in_the_readers_words(tmp_path, stored, shown):
    layout = Layout(tmp_path)
    _save_ended(layout, "failed", stored)

    assert listing(layout).body["ended"][0]["reason"] == shown
    assert reply(layout, "ended").body["reason"] == shown


@pytest.mark.parametrize(
    ("stored", "kind"),
    [
        ("stopped: checker", "checker"),
        ("stopped: provider", "provider"),
        ("stopped: interrupted", "interrupted"),
        ("stopped: ruling", "ruling"),
        ("stopped: other", ""),
        ("stopped: a kind this page does not know", ""),
        ("launcher exited 2; see logs/ended.log", ""),
        (f"not listed: {_REFUSED}", ""),
        ("expected one deliveries/*/delivery.json, found 2", ""),
        ("", ""),
    ],
)
def test_the_run_page_is_told_what_kind_of_stop_ended_a_run(tmp_path, stored, kind):
    """The page words a module's stop by the kind of stop (a checker stop is the module the checks
    refused); a failure the scheduler found after a clean exit, or one with no kind, names none."""
    layout = Layout(tmp_path)
    _save_ended(layout, "failed", stored)

    assert reply(layout, "ended").body["stopped_by"] == kind


@pytest.mark.parametrize("code", [2, 3221225786, -9, -1073741510])
def test_a_launcher_exit_reaches_the_page_in_the_readers_words(tmp_path, code):
    """The stored text is what ``runs.outcome`` writes, so a signal-killed launcher (a negative
    exit code) is the case the scheduler really stores."""
    layout = Layout(tmp_path)
    record = runs.Record(
        id="ended",
        pathway="credit_snapshot",
        folder="ended",
        status="running",
        claimed_at="2026-11-17T08:00:00Z",
    )
    status, stored = runs.outcome(layout, record, code)
    assert (status, stored) == ("failed", f"launcher exited {code}; see logs/ended.log")
    _save_ended(layout, status, stored)

    assert listing(layout).body["ended"][0]["reason"] == _NO_REASON
    assert reply(layout, "ended").body["reason"] == _NO_REASON


@pytest.mark.parametrize(
    "stored",
    ["stopped at the cap", "the run's process ended without a result", "Provider error"],
)
def test_a_reason_that_is_already_plain_or_unknown_is_sent_as_stored(tmp_path, stored):
    layout = Layout(tmp_path)
    _save_ended(layout, "capped", stored)

    assert listing(layout).body["ended"][0]["reason"] == stored
    assert reply(layout, "ended").body["reason"] == stored


def test_the_listing_sends_the_held_note_without_the_service_root(tmp_path):
    layout = Layout(tmp_path)
    root = layout.root.resolve()
    activity.write(layout, {"updated": "", "held": f"waiting on {root}/inbox/a.pdf", "runs": []})

    assert listing(layout).body["held"] == f"waiting on {Path('inbox') / 'a.pdf'}"


def _hold_a_queued_run(layout: Layout, held: str) -> None:
    layout.state.mkdir(parents=True, exist_ok=True)
    runs.save(
        layout,
        runs.Record(
            id="queued",
            pathway="credit_snapshot",
            folder="queued",
            status="queued",
            claimed_at="2026-11-17T08:00:00Z",
        ),
    )
    (layout.runs / "queued").mkdir(parents=True, exist_ok=True)
    activity.write(layout, {"updated": "", "held": held, "runs": []})


@pytest.mark.parametrize(
    ("error", "after", "shown"),
    [
        ("update_library.py not found", "", _NOT_REBUILT),
        (
            "[Errno 13] Permission denied: '{root}/library/index.html'",
            "",
            _NOT_REBUILT,
        ),
        (
            "locked",
            "; daily limit of 1 runs reached; waiting until tomorrow",
            f"{_NOT_REBUILT} Daily limit of 1 runs reached; waiting until tomorrow",
        ),
    ],
)
def test_the_librarys_rebuild_note_reaches_the_page_without_the_error(
    tmp_path, error, after, shown
):
    """The held note is what the scheduler writes: ``_REBUILD_FAILED`` with the error, joined to
    any other note with a semicolon. The error text is logged by the scheduler, not sent."""
    layout = Layout(tmp_path)
    held = _REBUILD_FAILED.format(error.format(root=layout.root.resolve())) + after
    _hold_a_queued_run(layout, held)

    assert listing(layout).body["held"] == shown
    assert reply(layout, "queued").body["held_reason"] == shown
