"""Approved summary limits survive submission without a model call."""

from __future__ import annotations

from copy import deepcopy

import pytest
from inbox_fixtures import layout, settings
from test_run_start_scheduler import answers_for, upload

from deploy_workflow.inbox import runs
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.run_start import submissions
from react_frontend.run_activity import reply

pytest_plugins = ["inbox_fixtures"]

LIMIT = {
    "id": "quotes-none",
    "scope": "CP-3",
    "outcome": "gap",
    "reason": "No quotes and no price talk were entered — retain €5.10 as written.",
    "fix": "Add dated quotes.",
    "basis": "analyst input",
    "evidence": "observed offline",
    "counted": True,
    "inherited_from": [],
}


def issue(monkeypatch, root, sid, answers, items):
    digest = submissions.bound(submissions.digest(layout(root), sid, answers), "none")
    result = {"error": "", "digest": digest, "prior_choice": "none", "cap": "25", "items": items}
    monkeypatch.setattr(submissions, "_summarise", lambda *_: deepcopy(result))
    return submissions.summary(layout(root), sid, answers)


def test_issued_summary_keeps_exact_decision_items_and_replaces_them_on_review(root, monkeypatch):
    sid = upload(root)
    answers = answers_for()
    ready = {**LIMIT, "id": "ready", "outcome": "ready"}
    information = {**LIMIT, "id": "information", "outcome": "information"}
    summary = issue(monkeypatch, root, sid, answers, [LIMIT, ready, information])
    assert submissions.issued_summary_limits(layout(root), sid) == [LIMIT]
    assert submissions.issued(layout(root), sid) == summary["digest"]
    replacement = {**LIMIT, "reason": "A new exact approved limitation.", "id": "new-limit"}
    issue(monkeypatch, root, sid, answers, [replacement])
    assert submissions.issued_summary_limits(layout(root), sid) == [replacement]
    issue(monkeypatch, root, sid, answers, [])
    assert submissions.issued_summary_limits(layout(root), sid) == []


def test_old_issued_metadata_has_no_recorded_summary_limits(root):
    sid = upload(root)
    (layout(root).uploads / sid / "issued").write_text("a" * 64 + "\nnone\ncap=25\n")
    assert submissions.issued_summary_limits(layout(root), sid) is None


def test_submitted_limits_survive_upload_release_record_reload_and_activity_reply(
    root, monkeypatch
):
    sid = upload(root)
    answers = answers_for()
    summary = issue(monkeypatch, root, sid, answers, [LIMIT])
    scheduler = Scheduler(settings(root))
    try:
        record = scheduler.submit(sid, answers, summary["digest"])
        assert record.approved_summary_limits == [LIMIT]
        assert runs.load_all(layout(root))[0].approved_summary_limits == [LIMIT]
        (layout(root).runs / record.id).mkdir(parents=True)
        assert reply(layout(root), record.id).body["approved_summary_limits"] == [LIMIT]
    finally:
        scheduler.close()


def test_historical_records_distinguish_unrecorded_limits_from_an_empty_approved_list(root):
    record = runs.Record("old", "credit_snapshot", "old", "finished", "2026-11-17T12:00:00Z")
    layout(root).state.mkdir(parents=True, exist_ok=True)
    runs.save(layout(root), record)
    (layout(root).runs / "old").mkdir(parents=True)
    assert reply(layout(root), "old").body["approved_summary_limits"] is None


def test_corrupt_issued_summary_metadata_is_refused_instead_of_losing_limits(root):
    sid = upload(root)
    (layout(root).uploads / sid / "issued").write_text(
        "a" * 64 + "\nnone\ncap=25\nlimits=not-json\n"
    )
    with pytest.raises(submissions.Refused, match="approved summary limits"):
        submissions.issued_summary_limits(layout(root), sid)
