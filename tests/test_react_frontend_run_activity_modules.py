"""A queued custom run lists and replies with its chosen modules, not the custom preset."""

from pathlib import Path

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.layout import Layout, ensure_layout
from react_frontend import run_activity

COMPLETED_PLAN = [
    ["CP-0", "waiting"],
    ["CP-1", "waiting"],
    ["CP-1A", "waiting"],
    ["CP-2", "waiting"],
    ["CP-4", "waiting"],
    ["Report", "waiting"],
]


def _queued_custom(tmp_path: Path) -> Layout:
    layout = ensure_layout(tmp_path)
    runs.save(
        layout,
        runs.Record(
            id="custom-q",
            pathway="custom",
            folder="custom-q",
            status="queued",
            claimed_at="2026-10-31T11:00:00Z",
            issuer_name="Harbour Packaging",
            submitted_by="analyst",
            files=("annual-report.pdf",),
            modules=("CP-2", "CP-4"),
        ),
    )
    return layout


def test_listing_of_a_queued_custom_run_shows_the_completed_custom_plan(tmp_path: Path) -> None:
    reply = run_activity.listing(_queued_custom(tmp_path))
    [run] = reply.body["runs"]
    assert run["modules"] == COMPLETED_PLAN


def test_reply_of_a_queued_custom_run_shows_the_completed_custom_plan(tmp_path: Path) -> None:
    reply = run_activity.reply(_queued_custom(tmp_path), "custom-q")
    assert reply.body["modules"] == COMPLETED_PLAN
