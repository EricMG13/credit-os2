"""The local coordinator view projects the ledger without changing it."""

from __future__ import annotations

import argparse
from http import HTTPStatus
from pathlib import Path

from tools.dev_dashboard import dashboard
from tools.dev_ledger import connect, decision_run, start_run


def test_uninitialized_dashboard_does_not_create_a_database(tmp_path: Path) -> None:
    path = tmp_path / "dev.sqlite"
    status, contents = dashboard(path, "/local/", {})
    assert status == HTTPStatus.OK
    assert b"No ledger yet" in contents
    assert not path.exists()


def test_dashboard_shows_ranked_decisions_and_escapes_ledger_content(tmp_path: Path) -> None:
    path = tmp_path / "dev.sqlite"
    with connect(path) as db:
        start_run(db, argparse.Namespace(run="run-1", spec="s", plan="p", cap=0, workers=1))
        for ident, kind in (("D-03", "verified"), ("D-04", "applied"), ("D-05", "owner")):
            decision_run(
                db,
                argparse.Namespace(
                    run="run-1",
                    id=ident,
                    expected_revision=1,
                    command="note",
                    payload=f'{{"kind":"{kind}","summary":"<script>run</script>"}}',
                ),
            )
    status, contents = dashboard(path, "/local/", {"run": ["run-1"], "decision": ["D-05"]})
    assert status == HTTPStatus.OK
    assert contents.index(b"Needs your decision") < contents.index(b"Applied")
    assert contents.index(b"Applied") < contents.index(b"Verified")
    assert b"run run-1, decision D-05" in contents
    assert b"&lt;script&gt;run&lt;/script&gt;" in contents
    assert b"<script>run</script>" not in contents
    assert dashboard(path, "/local/", {"run": ["unknown"]})[0] == HTTPStatus.NOT_FOUND


def test_dashboard_links_a_replaced_decision_to_its_latest_resolution(tmp_path: Path) -> None:
    path = tmp_path / "dev.sqlite"
    with connect(path) as db:
        start_run(db, argparse.Namespace(run="run-1", spec="s", plan="p", cap=0, workers=1))
        records = [
            ("D-01", "note", '{"kind":"owner","summary":"Choose periods","urgency":"Today"}'),
            ("D-02", "decision", '{"summary":"Matched periods","supersedes":"D-01"}'),
            ("D-03", "decision", '{"summary":"Use June only","supersedes":"D-02"}'),
        ]
        for ident, command, payload in records:
            decision_run(
                db,
                argparse.Namespace(
                    run="run-1",
                    id=ident,
                    expected_revision=1 if ident != "D-03" else 2,
                    command=command,
                    payload=payload,
                ),
            )
    status, contents = dashboard(path, "/local/", {"run": ["run-1"], "decision": ["D-01"]})
    assert status == HTTPStatus.OK
    assert b"Needs your decision" not in contents
    assert b"Draft change request" not in contents
    assert b"Urgency</dt><dd>Today" in contents
    assert b'run=run-1&amp;decision=D-03#detail">D-03</a>' in contents


def test_model_notices_follow_the_selected_run(tmp_path: Path) -> None:
    from tools.dev_dashboard import model_decisions

    with connect(tmp_path / "dev.sqlite") as db:
        db.executescript(
            """
            CREATE TABLE dev_route_notifications (decision_id TEXT, message TEXT);
            INSERT INTO dev_route_notifications VALUES ('D-legacy','Legacy note');
            INSERT INTO dev_route_notifications VALUES ('D-own','Own run');
            INSERT INTO dev_route_notifications VALUES ('D-other','Other run');
            CREATE TABLE dev_route_notification_runs (decision_id TEXT, run_id TEXT);
            INSERT INTO dev_route_notification_runs VALUES ('D-own','run-1');
            INSERT INTO dev_route_notification_runs VALUES ('D-other','run-2');
            """
        )
        markup = model_decisions(db, "run-1")
    assert "Own run" in markup
    assert "Other run" not in markup
    assert "Legacy note" in markup and "Project notice" in markup


def test_recorded_worker_progress_appears_in_timeline_without_adding_a_decision(
    tmp_path: Path,
) -> None:
    from tools.dev_ledger import launch_run

    path = tmp_path / "dev.sqlite"
    with connect(path) as db:
        start_run(db, argparse.Namespace(run="run-1", spec="s", plan="p", cap=0, workers=1))
        launch_run(
            db,
            argparse.Namespace(
                run="run-1", id="worker-1", expected_revision=1, reserve=0, spec="s", plan="p"
            ),
        )
        decision_run(
            db,
            argparse.Namespace(
                run="run-1",
                id="P-01",
                expected_revision=1,
                command="note",
                payload='{"kind":"progress","attempt":"worker-1","summary":"Review running"}',
            ),
        )
        assert db.execute("SELECT revision FROM runs WHERE id='run-1'").fetchone()[0] == 1
    status, contents = dashboard(path, "/local/", {"run": ["run-1"]})
    assert status == HTTPStatus.OK
    assert b"No decisions have been recorded" in contents
    assert b"Run progress" in contents
    assert b"worker-1 \xc2\xb7 Review running" in contents
    assert b"<dt>Active</dt><dd>1</dd>" in contents


def test_superseded_work_is_separate_from_eligible_results() -> None:
    from tools.dev_dashboard import stage

    attempt = {"id": "worker", "state": "settled", "revision": 1}
    activity = {"results": {"worker": {"returncode": 0}}, "revalidated": {}}
    assert stage(attempt, activity, revision=2) == "Superseded"
    activity["revalidated"]["worker"] = 2
    assert stage(attempt, activity, revision=2) == "Awaiting verification"


def test_progress_note_cannot_supersede_an_owner_decision(tmp_path: Path) -> None:
    import pytest

    with connect(tmp_path / "dev.sqlite") as db:
        start_run(db, argparse.Namespace(run="run-1", spec="s", plan="p", cap=0, workers=1))
        args = argparse.Namespace(
            run="run-1",
            id="P-01",
            expected_revision=1,
            command="note",
            payload='{"kind":"progress","summary":"Checking","supersedes":"D-01"}',
        )
        with pytest.raises(ValueError, match="only a summary"), db:
            decision_run(db, args)
        assert db.execute("SELECT count(*) FROM decisions").fetchone()[0] == 0
