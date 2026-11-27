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
