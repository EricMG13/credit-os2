"""The on/off decision of Signal's AI pass: every combination of its four preconditions, the ruling
file it reads (and those it does not), and the capped state. SYNTHETIC: no model is built or called;
rulings are written into a temporary folder, never under docs/rulings/.
"""

from __future__ import annotations

import itertools
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import CONFIG, environ, write_ruling

from deploy_workflow.signal import ai_gate, ai_ledger
from deploy_workflow.signal.store import open_db

NOW = datetime(2026, 11, 24, 12, 0, tzinfo=UTC)
KEY_VALUE = "test-token-not-a-real-key"
NO_RULING = (
    "No standing ruling for Signal's model calls is in docs/rulings"
    " (a file named YYYY-MM-DD-signal-ai-pass.md)."
)
NO_CAP = "The owner has not set a monthly cap."
NO_KEY = (
    "The service was started without the provider's key: COPILOT_GITHUB_TOKEN"
    " (or COPILOT_USE_GH_LOGIN=1) is not set."
)
OFF = (
    "The pass was switched off because the cost of a call made at 2026-11-24 12:00 UTC is not"
    " known; only the owner can clear it (signal ai clear)."
)


@pytest.fixture
def db(tmp_path: Path) -> Any:
    held = open_db(tmp_path / "store")
    yield held
    held.close()


def _switch_off(db: Any) -> None:
    ai_ledger.set_cap(db, Decimal(15), NOW)
    call = ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW)
    ai_ledger.settle(db, call, None, "raised: RuntimeError", NOW)


@pytest.mark.parametrize("held", list(itertools.product([True, False], repeat=4)))
def test_the_pass_is_on_exactly_when_all_four_preconditions_hold(tmp_path, db, held):
    ruling, cap, key, off = held
    rulings = tmp_path / "rulings"
    rulings.mkdir()
    if ruling:
        write_ruling(rulings)
    if off:
        _switch_off(db)  # sets a cap on its way
    if cap:
        ai_ledger.set_cap(db, Decimal(15), NOW)
    elif off:
        db.execute("DELETE FROM settings WHERE key='ai_cap_usd'")
        db.commit()
    env = environ(tmp_path) if key else {"COPILOT_CLI_PATH": environ(tmp_path)["COPILOT_CLI_PATH"]}
    gate = ai_gate.check(db, env, rulings)
    expected = [
        *([] if ruling else [NO_RULING]),
        *([] if cap else [NO_CAP]),
        *([] if key else [NO_KEY]),
        *([OFF] if off else []),
    ]
    assert list(gate.missing) == expected
    assert gate.on is (ruling and cap and key and not off)
    assert (gate.config_id == CONFIG) is ruling
    assert all(KEY_VALUE not in sentence for sentence in gate.missing)


def test_the_runtime_is_part_of_the_credentials(tmp_path, db):
    rulings = tmp_path / "rulings"
    write_ruling(rulings)
    ai_ledger.set_cap(db, Decimal(15), NOW)
    gate = ai_gate.check(db, {"COPILOT_GITHUB_TOKEN": KEY_VALUE}, rulings)
    assert gate.missing == (
        "The service was started without COPILOT_CLI_PATH naming the Copilot runtime.",
    )
    login = environ(tmp_path)
    del login["COPILOT_GITHUB_TOKEN"]
    login["COPILOT_USE_GH_LOGIN"] = "1"
    assert ai_gate.check(db, login, rulings).on


def test_another_ruling_naming_the_same_configuration_does_not_switch_signal_on(tmp_path, db):
    rulings = tmp_path / "rulings"
    write_ruling(rulings, name="2026-11-11-run-start-submit.md")  # names copilot-luna-xhigh too
    ai_ledger.set_cap(db, Decimal(15), NOW)
    assert ai_gate.check(db, environ(tmp_path), rulings).missing == (NO_RULING,)


def test_a_ruling_that_does_not_name_signals_configuration_is_not_accepted(tmp_path, db):
    rulings = tmp_path / "rulings"
    write_ruling(rulings, configs="copilot-sol-medium")
    ai_ledger.set_cap(db, Decimal(15), NOW)
    refused = (
        "The ruling 2026-11-25-signal-ai-pass.md is not accepted: the ruling does not list"
        " 'copilot-luna-xhigh'."
    )
    assert ai_gate.check(db, environ(tmp_path), rulings).missing == (refused,)


def test_a_ruling_not_by_the_user_is_not_accepted(tmp_path, db):
    rulings = tmp_path / "rulings"
    path = write_ruling(rulings)
    path.write_text(path.read_text().replace("by: user", "by: agent"), encoding="utf-8")
    ai_ledger.set_cap(db, Decimal(15), NOW)
    missing = ai_gate.check(db, environ(tmp_path), rulings).missing
    assert missing == (
        "The ruling 2026-11-25-signal-ai-pass.md is not accepted: the ruling is not by: user.",
    )


def test_the_newest_ruling_by_its_dated_name_is_the_one_read(tmp_path, db):
    rulings = tmp_path / "rulings"
    write_ruling(rulings, name="2026-11-25-signal-ai-pass.md")
    write_ruling(rulings, configs="copilot-sol-medium", name="2026-12-01-signal-ai-pass.md")
    ai_ledger.set_cap(db, Decimal(15), NOW)
    gate = ai_gate.check(db, environ(tmp_path), rulings)
    assert gate.ruling is None and "2026-12-01-signal-ai-pass.md" in gate.missing[0]


def test_the_repository_has_no_signal_ruling_so_the_pass_is_off_by_default(db):
    from deploy_workflow.model.adapter import LIVE_RULINGS_ROOT

    assert ai_gate.find_ruling(LIVE_RULINGS_ROOT) is None


def test_a_month_without_room_for_the_smallest_call_is_capped(tmp_path, db):
    rulings = tmp_path / "rulings"
    write_ruling(rulings)
    env = environ(tmp_path)
    ai_ledger.set_cap(db, Decimal("0.71"), NOW)
    assert ai_gate.status(db, NOW, env, rulings).state == "on"
    ai_ledger.reserve(db, "stories", CONFIG, Decimal("0.3585"), NOW)  # 0.3585 + 0.3585 > 0.71
    held = ai_gate.status(db, NOW, env, rulings)
    assert held.state == "capped" and held.month.held == Decimal("0.3585")
    ai_ledger.set_cap(db, Decimal("0.72"), NOW)
    assert ai_gate.status(db, NOW, env, rulings).state == "on"
    assert ai_gate.status(db, NOW, {}, rulings).state == "off"  # off before capped
