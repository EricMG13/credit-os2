"""Notification settings: two switches per event, per user, with stated defaults."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from pathlib import Path

import pytest

from deploy_workflow.signal import notif
from deploy_workflow.signal.groups import GroupError, NotFound
from deploy_workflow.signal.store import open_db

DEFAULTS = {
    "replies": (True, False),
    "threads": (True, False),
    "signal": (True, False),
    "digest": (True, False),
}


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    yield database
    database.close()


def test_a_user_who_set_nothing_has_the_defaults(db):
    assert notif.switches(db, "Mara L") == DEFAULTS


def test_one_switch_changes_and_the_events_other_switch_keeps_its_value(db):
    notif.set_switch(db, "Mara L", "digest", "onDesktop", True)
    notif.set_switch(db, "Mara L", "digest", "inSignal", False)
    notif.set_switch(db, "Mara L", "replies", "inSignal", False)
    notif.set_switch(db, "Mara L", "replies", "inSignal", False)
    assert notif.switches(db, "Mara L") == {
        **DEFAULTS,
        "digest": (False, True),
        "replies": (False, False),
    }
    assert notif.switches(db, "Tobias O") == DEFAULTS  # per user
    assert db.execute("SELECT COUNT(*) FROM notification_settings").fetchone()[0] == 2


@pytest.mark.parametrize(
    ("sent", "error", "text"),
    [
        (("comment", "inSignal", True), NotFound, "no notification event"),
        ((None, "inSignal", True), NotFound, "no notification event"),
        (("digest", "in_signal", True), GroupError, "channel must be"),
        (("digest", "email", True), GroupError, "channel must be"),
        (("digest", "inSignal", 1), GroupError, "true or false"),
        (("digest", "inSignal", "true"), GroupError, "true or false"),
    ],
)
def test_unknown_events_channels_and_values_are_refused(db, sent, error, text):
    with pytest.raises(error, match=text):
        notif.set_switch(db, "Mara L", *sent)
    assert notif.switches(db, "Mara L") == DEFAULTS
