"""Authenticated summary consent and immutable run attribution."""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from threading import Barrier

import pytest
from inbox_fixtures import layout, settings
from test_run_start_scheduler import answers_for, upload

from deploy_workflow.inbox import activity, runs, teams
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.run_start import submissions
from react_frontend import run_activity

pytest_plugins = ["inbox_fixtures"]


def test_actor_binding_rejects_foreign_or_changed_summary_and_persists_provenance(root) -> None:
    sid = upload(root)
    first = submissions.RunActor(3, "Eric G")
    second = submissions.RunActor(4, "Sam K")
    answers = answers_for(submitted_by="Client L")
    scheduler = Scheduler(settings(root))
    issued = scheduler.issue_summary(sid, answers, actor=first)
    forged = dict(answers)
    forged["submitted_by"] = "Eric G"
    assert submissions.digest(layout(root), sid, answers) == submissions.digest(
        layout(root), sid, forged
    )
    assert issued["submitted_by"] == "Eric G"
    assert submissions.issued_approval(layout(root), sid).actor_id == 3

    folder = layout(root).uploads / sid
    before_mtime = (folder.stat().st_mtime_ns, (folder / "files").stat().st_mtime_ns)
    with pytest.raises(submissions.Refused, match="another account or name"):
        scheduler.submit(sid, answers, issued["digest"], actor=second)
    assert (folder.stat().st_mtime_ns, (folder / "files").stat().st_mtime_ns) == before_mtime
    assert (submissions.files_folder(layout(root), sid) / "a.txt").is_file()
    assert scheduler.record_of_submission(sid) is None

    changed_name = submissions.RunActor(3, "Eric MG")
    with pytest.raises(submissions.Refused, match="another account or name"):
        scheduler.submit(sid, answers, issued["digest"], actor=changed_name)
    assert (folder.stat().st_mtime_ns, (folder / "files").stat().st_mtime_ns) == before_mtime
    assert (submissions.files_folder(layout(root), sid) / "a.txt").is_file()

    refreshed = scheduler.issue_summary(sid, answers, actor=changed_name)
    assert refreshed["submitted_by"] == "Eric MG"
    record = scheduler.submit(sid, answers, refreshed["digest"], actor=changed_name)
    persisted = json.loads((layout(root).state / f"{record.id}.json").read_text())
    assert persisted["account_id"] == 3
    assert persisted["submitted_by"] == "Eric MG"
    reopened = next(item for item in runs.load_all(layout(root)) if item.id == record.id)
    assert reopened.account_id == 3 and reopened.submitted_by == "Eric MG"
    run_reply = run_activity.reply(layout(root), record.id)
    assert run_reply.body["submitted_by"] == "Eric MG"
    assert "account_id" not in run_reply.body
    snapshot = activity.snapshot(layout(root), [record], now=scheduler.now())
    assert "account_id" not in snapshot["runs"][0]
    activity.write(layout(root), snapshot)
    published = (layout(root).engine / "activity.js").read_text(encoding="utf-8")
    assert "account_id" not in published
    assert "Eric MG" in published
    card = teams.started_card(
        replace(record, started_at="2026-11-26T12:00:00Z"),
        teams.Links("http://127.0.0.1:8765", teams.CONNECTED_PAGES),
        modules=1,
    )
    rendered_card = json.dumps(card)
    assert "Eric MG" in rendered_card
    assert "account_id" not in rendered_card

    replay = scheduler.submit(
        sid, answers, refreshed["digest"], actor=submissions.RunActor(3, "Eric G")
    )
    assert replay.id == record.id
    assert replay.account_id == 3 and replay.submitted_by == "Eric MG"
    scheduler.close()


def test_same_actor_concurrent_submit_is_idempotent(root) -> None:
    sid = upload(root)
    actor = submissions.RunActor(3, "Eric G")
    answers = answers_for(submitted_by="forged")
    scheduler = Scheduler(settings(root))
    issued = scheduler.issue_summary(sid, answers, actor=actor)
    with ThreadPoolExecutor(max_workers=2) as pool:
        records = list(
            pool.map(
                lambda _: scheduler.submit(sid, answers, issued["digest"], actor=actor),
                range(2),
            )
        )
    assert records[0].id == records[1].id
    assert records[0].account_id == 3
    assert records[0].submitted_by == "Eric G"
    assert len(runs.load_all(layout(root))) == 1
    scheduler.close()


def test_signed_summary_keeps_the_existing_malformed_answer_refusal(root) -> None:
    sid = upload(root)
    actor = submissions.RunActor(3, "Eric G")
    result = submissions.summary(layout(root), sid, [], actor=actor)  # type: ignore[arg-type]
    assert "error" in result and "answers need exactly" in result["error"]
    assert not result.get("digest")
    scheduler = Scheduler(settings(root))
    with pytest.raises(submissions.Refused, match="answers need exactly"):
        scheduler.submit(sid, [], "bad", actor=actor)  # type: ignore[arg-type]
    assert scheduler.record_of_submission(sid) is None
    scheduler.close()


def test_signed_summary_cannot_replace_or_clear_approval_after_seal(root) -> None:
    sid = upload(root)
    actor = submissions.RunActor(3, "Eric G")
    answers = answers_for()
    issued = submissions.summary(layout(root), sid, answers, actor=actor)
    assert issued["error"] == ""
    before = submissions.issued_approval(layout(root), sid)
    submissions.seal(layout(root), sid)

    with pytest.raises(submissions.Refused, match="being submitted"):
        submissions.summary(layout(root), sid, answers, actor=submissions.RunActor(4, "Sam K"))
    refused = submissions.summary(layout(root), sid, [], actor=actor)  # type: ignore[arg-type]
    assert "answers need exactly" in refused["error"]
    assert submissions.issued_approval(layout(root), sid) == before


def test_issued_actor_metadata_rejects_unbounded_account_id(root) -> None:
    sid = upload(root)
    actor = submissions.RunActor(3, "Eric G")
    got = submissions.summary(layout(root), sid, answers_for(), actor=actor)
    assert got["error"] == ""
    issued = layout(root).uploads / sid / "issued"
    issued.write_text(issued.read_text().replace("account=3", "account=" + "9" * 5000))
    with pytest.raises(submissions.Refused, match="identity could not be read"):
        submissions.issued_approval(layout(root), sid)


def test_foreign_actor_cannot_unseal_an_interrupted_signed_submission(root) -> None:
    sid = upload(root)
    actor = submissions.RunActor(3, "Eric G")
    other = submissions.RunActor(4, "Sam K")
    answers = answers_for(submitted_by="Client L")
    scheduler = Scheduler(settings(root))
    issued = scheduler.issue_summary(sid, answers, actor=actor)
    sealed = submissions.seal(layout(root), sid, actor)
    before_mtime = (sealed.stat().st_mtime_ns, (sealed / "a.txt").stat().st_mtime_ns)

    with pytest.raises(submissions.Refused, match="another account or name"):
        scheduler.submit(sid, answers, issued["digest"], actor=other)
    assert sealed.is_dir()
    assert (sealed.stat().st_mtime_ns, (sealed / "a.txt").stat().st_mtime_ns) == before_mtime
    assert scheduler.record_of_submission(sid) is None

    recovered = scheduler.submit(sid, answers, issued["digest"], actor=actor)
    assert recovered.account_id == 3 and recovered.submitted_by == "Eric G"
    scheduler.close()


def test_signed_writer_cannot_use_an_unsigned_legacy_approval(root) -> None:
    sid = upload(root)
    answers = answers_for(submitted_by="Client L")
    legacy = submissions.summary(layout(root), sid, answers)
    assert legacy["error"] == ""
    folder = layout(root).uploads / sid
    issued = (folder / "issued").read_bytes()
    before = (folder.stat().st_mtime_ns, (folder / "files").stat().st_mtime_ns)
    scheduler = Scheduler(settings(root))

    with pytest.raises(submissions.Refused, match="another account or name"):
        scheduler.submit(sid, answers, legacy["digest"], actor=submissions.RunActor(3, "Eric G"))
    assert (folder / "issued").read_bytes() == issued
    assert (folder.stat().st_mtime_ns, (folder / "files").stat().st_mtime_ns) == before
    assert scheduler.record_of_submission(sid) is None
    scheduler.close()


def test_account_b_reviews_after_a_then_only_b_can_win_race_or_replay(root) -> None:
    sid = upload(root)
    answers = answers_for(submitted_by="Client L")
    account_a = submissions.RunActor(3, "Eric G")
    account_b = submissions.RunActor(4, "Sam K")
    scheduler = Scheduler(settings(root))
    reviewed_a = scheduler.issue_summary(sid, answers, actor=account_a)
    with pytest.raises(submissions.Refused, match="another account or name"):
        scheduler.submit(sid, answers, reviewed_a["digest"], actor=account_b)
    reviewed_b = scheduler.issue_summary(sid, answers, actor=account_b)

    start = Barrier(2)

    def accepted_or_refused(actor):
        start.wait(timeout=10)
        try:
            return scheduler.submit(sid, answers, reviewed_b["digest"], actor=actor)
        except submissions.Refused as refused:
            return refused

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(accepted_or_refused, (account_a, account_b)))
    records = [outcome for outcome in outcomes if not isinstance(outcome, submissions.Refused)]
    refusals = [outcome for outcome in outcomes if isinstance(outcome, submissions.Refused)]
    assert len(records) == len(refusals) == 1
    accepted = records[0]
    assert accepted.account_id == 4 and accepted.submitted_by == "Sam K"
    saved = (layout(root).state / f"{accepted.id}.json").read_bytes()
    with pytest.raises(submissions.Refused, match="another account"):
        scheduler.submit(sid, answers, reviewed_b["digest"], actor=account_a)
    assert (layout(root).state / f"{accepted.id}.json").read_bytes() == saved
    assert len(runs.load_all(layout(root))) == 1
    assert scheduler.submit(sid, answers, reviewed_b["digest"], actor=account_b) == accepted
    scheduler.close()


def test_historical_accepted_record_replays_without_new_account_id(root) -> None:
    sid = upload(root)
    answers = answers_for()
    old = runs.Record(
        "20261126-120000-01",
        "credit_snapshot",
        "Acme Corp",
        "queued",
        "2026-11-26T12:00:00Z",
        submission=sid,
        submitted_by="Old L",
    )
    scheduler = Scheduler(settings(root))
    scheduler._put(old)
    replay = scheduler.submit(sid, answers, "old-approval", actor=submissions.RunActor(3, "Eric G"))
    saved = json.loads((layout(root).state / f"{old.id}.json").read_text())
    assert replay.id == old.id and replay.account_id is None and replay.submitted_by == "Old L"
    assert "account_id" not in saved
    scheduler.close()
