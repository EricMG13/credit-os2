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

from deploy_workflow.model.adapter import LIVE_RULINGS_ROOT
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


ABOVE = (
    "The owner's monthly cap of USD 15.01 is above the ruled cap of USD 15; the owner sets one"
    " no higher (signal ai cap)."
)
NO_RULED_CAP = (
    "The ruling 2026-11-25-signal-ai-pass.md is not accepted: it needs exactly one cap_usd: line"
    " holding the ruled monthly cap in USD, such as cap_usd: 15."
)


@pytest.mark.parametrize(
    ("line", "stored", "missing"),
    [
        ("15", "15", ()),  # equal
        ("15.00", "12.50", ()),  # below
        ("15", "15.01", (ABOVE,)),  # above
        (None, "15", (NO_RULED_CAP,)),  # missing
        ("", "15", (NO_RULED_CAP,)),  # blank, as the draft leaves it
        ("____", "15", (NO_RULED_CAP,)),
        ("USD 15", "15", (NO_RULED_CAP,)),
        ("15.001", "15", (NO_RULED_CAP,)),
        ("1e3", "15", (NO_RULED_CAP,)),
        ("0", "15", (NO_RULED_CAP,)),
        ("-5", "15", (NO_RULED_CAP,)),
        ("015", "15", (NO_RULED_CAP,)),
        ("15\ncap_usd: 20", "15", (NO_RULED_CAP,)),  # two lines
    ],
)
def test_the_stored_cap_is_checked_against_the_rulings_cap(tmp_path, db, line, stored, missing):
    rulings = tmp_path / "rulings"
    write_ruling(rulings, cap=line)
    ai_ledger.set_cap(db, Decimal(stored), NOW)
    gate = ai_gate.check(db, environ(tmp_path), rulings)
    assert gate.missing == missing
    assert gate.on is (not missing)
    held = ai_gate.newest_ruled_cap(rulings)
    if missing and missing[0] == NO_RULED_CAP:
        assert held is None and gate.ruling is None and gate.cap == Decimal(stored)
    else:
        assert held == (rulings / "2026-11-25-signal-ai-pass.md", Decimal(line))
        assert gate.cap == (None if missing else Decimal(stored))  # above the ruling: no valid cap


def test_the_run_start_ruling_never_switches_signal_on(tmp_path, db):
    """The project's own run start ruling (which names copilot-luna-xhigh): under its own name it is
    not read; saved under Signal's name it has no cap_usd: line and is not accepted."""
    real = LIVE_RULINGS_ROOT / "2026-11-11-run-start-submit.md"
    rulings = tmp_path / "rulings"
    rulings.mkdir()
    ai_ledger.set_cap(db, Decimal(15), NOW)
    (rulings / real.name).write_bytes(real.read_bytes())
    assert ai_gate.check(db, environ(tmp_path), rulings).missing == (NO_RULING,)
    (rulings / "2026-11-25-signal-ai-pass.md").write_bytes(real.read_bytes())
    assert ai_gate.check(db, environ(tmp_path), rulings).missing == (NO_RULED_CAP,)


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


def test_settings_says_the_stored_cap_is_above_the_ruled_one(tmp_path, db):
    from deploy_workflow.signal import ai_view
    from deploy_workflow.signal.identity import User

    rulings = tmp_path / "rulings"
    write_ruling(rulings, cap="10")
    ai_ledger.set_cap(db, Decimal(12), NOW)
    held = ai_gate.status(db, NOW, environ(tmp_path), rulings)
    shown = ai_view.settings_ai(held, User("Mara L", "owner"), NOW)
    assert shown["state"] == "off"
    assert shown["notice"] == {
        "title": "AI is off",
        "text": "The owner's monthly cap of USD 12 is above the ruled cap of USD 10; the owner"
        " sets one no higher (signal ai cap). " + ai_view.STOPPED,
    }
    assert shown["spend"] is None
