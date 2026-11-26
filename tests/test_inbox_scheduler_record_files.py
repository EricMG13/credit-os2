"""A run submitted from the start page records the source documents it was approved on."""

from __future__ import annotations

from pathlib import Path

from inbox_fixtures import layout
from test_inbox_teams import LINK, texts
from test_run_start_scheduler import answers_for, approved

from deploy_workflow.inbox import teams
from deploy_workflow.inbox.runs import load_all
from deploy_workflow.inbox.scheduler import Scheduler
from deploy_workflow.run_start import submissions

pytest_plugins = ["inbox_fixtures"]


def test_the_record_carries_the_submitted_document_names(root: Path, fake_env) -> None:
    from inbox_fixtures import settings

    fake_env({"sleep": 30})
    lay = layout(root)
    sid = submissions.new(lay)
    folder = submissions.files_folder(lay, sid)
    (folder / "b.txt").write_bytes(b"Two.")
    (folder / "a.txt").write_bytes(b"One.")
    (folder / "sub").mkdir()
    (folder / "sub" / "c.txt").write_bytes(b"Three.")
    answers = answers_for()
    w = Scheduler(settings(root))
    record = w.submit(sid, answers, approved(root, sid, answers))
    assert record.files == ("a.txt", "b.txt", "sub/c.txt")
    assert load_all(lay)[0].files == ("a.txt", "b.txt", "sub/c.txt")
    assert "3 docs" in texts(teams.started_card(record, LINK, 2)["body"])
