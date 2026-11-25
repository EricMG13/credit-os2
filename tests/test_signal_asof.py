"""A snapshot's `asOf` is read inside its read transaction, after the first read (review doubt:
taken before the transaction began, a comment committed in between was in the snapshot and newer
than its asOf, so "mark read up to asOf" left it unread). Expected values are written by hand."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path

import pytest
from signal_reader_check import react_refusal, reader_part  # noqa: F401 (autouse)

from deploy_workflow.signal import snapshot
from deploy_workflow.signal.identity import User
from deploy_workflow.signal.store import open_db

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
MARA = User("Mara L", "writer")


@pytest.fixture
def db(tmp_path: Path) -> Iterator[sqlite3.Connection]:
    database = open_db(tmp_path)
    yield database
    database.close()


def test_a_clock_given_to_the_build_is_read_inside_the_read_transaction_after_its_first_read(db):
    seen: list[tuple[bool, int]] = []
    reads: list[str] = []
    db.set_trace_callback(reads.append)

    def clock() -> datetime:
        seen.append((db.in_transaction, sum(sql.startswith("SELECT") for sql in reads)))
        return NOW

    built = snapshot.build(db, MARA, clock)
    db.set_trace_callback(None)
    assert len(seen) == 1  # read once
    in_transaction, selects = seen[0]
    assert in_transaction and selects >= 1  # the transaction had begun and had read
    assert built["asOf"] == NOW.isoformat()
    assert react_refusal(built) is None


def test_a_fixed_time_gives_no_asof_of_its_own(db):
    assert "asOf" not in snapshot.build(db, MARA, NOW)
