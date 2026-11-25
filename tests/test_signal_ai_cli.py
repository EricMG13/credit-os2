"""The owner's AI commands: `ai cap`, `ai status`, `ai clear`, `ai pass`. SYNTHETIC: the pass runs
against ``signal_ai_fakes.FakeModel``; rulings are written into a temporary folder.
"""

from __future__ import annotations

import contextlib
import io
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from signal_ai_fakes import (
    CONFIG,
    ENV,
    FakeModel,
    label,
    labels_reply,
    ok,
    setup,
    write_ruling,
)

from deploy_workflow.signal import ai_ledger
from deploy_workflow.signal.cli import main
from deploy_workflow.signal.feeds import Entry
from deploy_workflow.signal.store import add_story, open_db, propose_source

RULED = Decimal(100000)  # a ruled cap above every stored one: the stored cap binds


def run(root: Path, *args: str, **kwargs: object) -> tuple[int, str]:
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        code = main(["--root", str(root), "ai", *args], **kwargs)  # type: ignore[arg-type]
    return code, out.getvalue()


def test_the_owner_sets_the_cap_and_a_bad_amount_is_refused(tmp_path):
    held = setup(tmp_path)
    assert run(tmp_path, "cap", "15", ai=held) == (0, "monthly cap set to USD 15\n")
    code, out = run(tmp_path, "cap", "15.001", ai=held)
    assert code == 2 and out == "error: the cap has at most two decimal places\n"
    db = open_db(tmp_path)
    assert ai_ledger.cap(db) == Decimal(15)
    db.close()


def test_a_cap_above_the_rulings_is_refused_and_a_lower_one_is_set(tmp_path):
    held = setup(tmp_path)  # the ruling carries cap_usd: 15
    root = tmp_path / "store"
    assert run(root, "cap", "15.01", ai=held) == (
        2,
        "error: the cap is at most the ruled USD 15 a month (2026-11-01-signal-ai-pass.md)\n",
    )
    assert run(root, "cap", "15", ai=held) == (0, "monthly cap set to USD 15\n")
    assert run(root, "cap", "9.50", ai=held) == (0, "monthly cap set to USD 9.50\n")
    # The owner lowers the ruled cap below the stored one: the pass goes off and says why.
    write_ruling(tmp_path / "rulings", cap="5", name="2026-11-20-signal-ai-pass.md")
    lines = run(root, "status", ai=held)[1].splitlines()
    assert lines[:3] == [
        "state: off",
        f"ruling: 2026-11-20-signal-ai-pass.md ({CONFIG})",
        "cap: USD 9.50 a month, per Signal store, above the ruled cap",
    ]
    assert lines[3] == (
        "missing: The owner's monthly cap of USD 9.50 is above the ruled cap of USD 5; the owner"
        " sets one no higher (signal ai cap)."
    )


def test_status_names_each_missing_precondition_and_never_a_key(tmp_path):
    held = setup(tmp_path, ruling=False)
    code, out = run(tmp_path / "store", "status", ai=held)
    assert code == 0
    lines = out.splitlines()
    assert lines[:3] == ["state: off", "ruling: missing", "cap: not set"]
    no_ruling = (
        "missing: No standing ruling for Signal's model calls is in docs/rulings (a file named"
        " YYYY-MM-DD-signal-ai-pass.md)."
    )
    assert lines[3:5] == [no_ruling, "missing: The owner has not set a monthly cap."]
    month = (
        f"{ai_ledger.month_of(datetime.now(UTC))} (UTC), this Signal store: spent USD 0, held USD 0"
        " in 0 open calls,"
        " 0 calls of unknown cost"
    )
    assert lines[5:] == [
        month,
        "stories whose output failed its check this month: 0",
        "digest calls today (UTC): 0 of 50",
        "digest calls a name may make a day (UTC): 5",
        "last failed call: none this month",
    ]
    assert ENV["COPILOT_GITHUB_TOKEN"] not in out


def test_status_when_on_and_clear_after_an_unknown_cost(tmp_path):
    held = setup(tmp_path)
    root = tmp_path / "store"
    run(root, "cap", "15", ai=held)
    out = run(root, "status", ai=held)[1]
    assert out.splitlines()[:3] == [
        "state: on",
        f"ruling: 2026-11-01-signal-ai-pass.md ({CONFIG})",
        "cap: USD 15 a month, per Signal store",
    ]
    db = open_db(root)
    now = datetime.now(UTC)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), now, ruled_cap=RULED)
    ai_ledger.settle(db, call, None, "sent_unknown: OverallTimeout", now)
    db.close()
    out = run(root, "status", ai=held)[1]
    assert "state: off" in out and "calls of unknown cost" in out
    assert "last failed call:" in out and "sent_unknown: OverallTimeout" in out
    assert run(root, "clear", ai=held) == (0, "switch-off cleared\n")
    assert run(root, "clear", ai=held) == (0, "the AI pass was not switched off\n")
    assert "state: on" in run(root, "status", ai=held)[1]


def test_a_manual_pass_runs_only_while_the_pass_is_on(tmp_path):
    root = tmp_path / "store"
    db = open_db(root)
    source = propose_source(db, "Wire", "news", "https://wire.example/f", "x")
    now = datetime.now(UTC)
    add_story(
        db,
        source,
        Entry("A story", "https://wire.example/1", now - timedelta(minutes=5), "S."),
        now,
    )
    db.close()
    code, out = run(root, "pass", ai=setup(tmp_path))  # no cap yet: the fake must not be built
    assert code == 2
    assert out == "no pass: the AI pass is off\nmissing: The owner has not set a monthly cap.\n"
    run(root, "cap", "5", ai=setup(tmp_path))
    model = FakeModel([ok(labels_reply([label(1)]))])
    code, out = run(root, "pass", ai=setup(tmp_path, model))
    assert code == 0
    assert out == "calls: 1, stories written: 1, stories whose output failed its check: 0\n"
    assert model.closed


def test_the_owner_sets_the_digest_calls_a_day_and_status_shows_them(tmp_path):
    held = setup(tmp_path)
    root = tmp_path / "store"
    assert run(root, "digests-per-day", "12", ai=held) == (0, "digest calls a day set to 12\n")
    assert "digest calls today (UTC): 0 of 12" in run(root, "status", ai=held)[1].splitlines()
    code, out = run(root, "digests-per-day", "1001", ai=held)
    assert (code, out) == (2, "error: the digest calls a day are at most 1000\n")
    code, out = run(root, "digests-per-day", "-1", ai=held)
    assert (code, out) == (2, "error: the digest calls a day are a whole number, such as 50\n")
