"""A run record with a field of the wrong type is unreadable, never a crash later."""

from __future__ import annotations

import json
from dataclasses import asdict

import pytest

from deploy_workflow.inbox.layout import ensure_layout
from deploy_workflow.inbox.runs import Record, load_all, load_readable, save

pytest_plugins = ["inbox_fixtures"]

RID = "20261109-000001-01"


def _write(root, **change):
    lay = ensure_layout(root)
    data = asdict(Record(RID, "earnings_update", "a", "running", "t1"))
    data.update(change)
    (lay.state / f"{RID}.json").write_text(json.dumps(data), encoding="utf-8")
    return lay


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("pid", "abc"),
        ("pid", True),
        ("pid", 1.5),
        ("started_at", 5),
        ("ended_at", None),
        ("reason", 3),
        ("name_differs", "no"),
        ("prepared", 1),
        ("max_turns", "32"),
        ("max_turns", False),
        ("claimed_at", None),
        ("id", 7),
        ("files", [1]),
        ("modules", ["CP-0", 2]),
        ("cap", 20),
        ("config", ["x"]),
    ],
)
def test_a_wrong_typed_field_is_unreadable(root, field, value):
    lay = _write(root, **{field: value})
    with pytest.raises(ValueError, match="unreadable run record"):
        load_all(lay)
    assert load_readable(lay) == ([], [f"{RID}.json"])


def test_a_populated_record_round_trips(root):
    lay = ensure_layout(root)
    record = Record(
        RID,
        "credit_snapshot",
        "Acme",
        "finished",
        "t0",
        issuer_id="acme",
        issuer_name="Acme",
        as_of="2026-11-09",
        files=("a.txt", "b/c.txt"),
        started_at="t1",
        ended_at="t2",
        pid=9,
        reason="r",
        report="x/y",
        name_differs=True,
        prepared=True,
        submission="s",
        modules=("CP-0",),
        max_turns=16,
        level="basic",
        model="claude",
        effort="high",
        submitted_by="Ana",
        digest="d",
        prior="none",
        cap="20",
        approved_summary_limits=[
            {"id": "i", "scope": "s", "outcome": "gap", "reason": "r", "fix": "f"}
        ],
        newest_document_date="2026-11-01",
        config="copilot-opus-high",
    )
    save(lay, record)
    assert load_all(lay) == [record]
