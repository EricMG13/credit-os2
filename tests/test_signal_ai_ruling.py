"""Third review, finding 8: which file is Signal's ruling. Only an ASCII-dated
``YYYY-MM-DD-signal-ai-pass.md`` is one; the newest by its real date is read, and when any such
name's date is impossible or after today, or the newest is not accepted, the pass is off (an older
ruling never stands in). SYNTHETIC: rulings are written into a temporary folder; no model is built.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from signal_ai_fakes import environ

from deploy_workflow.signal import ai_gate, ai_ledger
from deploy_workflow.signal.store import open_db

NOW = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
# The shape of the owner's draft ruling (its heading, its note, the rule, the title, the header
# block with its two blanks, and the quoted answer still blank), as the owner received it.
DRAFT = """# DRAFT for the owner's review: not a ruling until the owner makes it one

To make it standing, the owner saves it as docs/rulings/YYYY-MM-DD-signal-ai-pass.md.

---

# Standing ruling: Signal's AI pass on GPT-6 Luna through the Copilot CLI

lifts: live-provider-pause
by: user
date: ____-__-__
configs: copilot-luna-xhigh
cap_usd: ____

The owner was asked: "Allow it on copilot-luna-xhigh under a monthly cap?", and said: "____".
"""


def text(day: str = "2026-11-20", cap: str = "5", body: str = "") -> str:
    return (
        "# Standing ruling: Signal AI pass (TEST)\n\n"
        f"lifts: live-provider-pause\nby: user\ndate: {day}\nconfigs: copilot-luna-xhigh\n"
        f"cap_usd: {cap}\n\nThe owner said: yes.\n{body}"
    )


@pytest.fixture
def world(tmp_path: Path) -> Any:
    db = open_db(tmp_path / "store")
    ai_ledger.set_cap(db, Decimal(5), NOW)
    rulings = tmp_path / "rulings"
    rulings.mkdir()
    yield db, rulings, environ(tmp_path)
    db.close()


def gate(world: Any) -> ai_gate.Gate:
    db, rulings, env = world
    return ai_gate.check(db, env, rulings, NOW)


def refused(name: str, why: str) -> tuple[str]:
    return (f"The ruling {name} is not accepted: {why}",)


def write(world: Any, name: str, body: str) -> Path:
    path: Path = world[1] / name
    path.write_text(body, encoding="utf-8")
    return path


def test_a_valid_ruling_is_on_and_carries_its_ruled_cap(world):
    write(world, "2026-11-20-signal-ai-pass.md", text())
    found = gate(world)
    assert found.on and found.ruled_cap == Decimal(5) and found.ruling is not None
    assert found.ruling.name == "2026-11-20-signal-ai-pass.md"


def test_an_impossible_date_in_a_name_turns_the_pass_off_and_shadows_nothing(world):
    write(world, "2026-11-20-signal-ai-pass.md", text())
    write(world, "9999-99-99-signal-ai-pass.md", text("9999-99-99", "99999"))
    assert gate(world).missing == refused(
        "9999-99-99-signal-ai-pass.md", "the date in its name is not a real date."
    )


def test_a_ruling_dated_after_today_turns_the_pass_off(world):
    write(world, "2026-11-20-signal-ai-pass.md", text())
    write(world, "2026-11-26-signal-ai-pass.md", text("2026-11-26", "500"))
    assert gate(world).missing == refused(
        "2026-11-26-signal-ai-pass.md", "it is dated after today (UTC)."
    )


def test_a_name_in_other_digits_is_not_a_ruling(world):
    stray = write(world, "２０２６-11-25-signal-ai-pass.md", text("2026-11-25", "500"))
    assert gate(world).missing[0].startswith("The rulings folder holds '２０２６-11-25-signal-ai")
    write(world, "2026-11-20-signal-ai-pass.md", text())
    assert not gate(world).on  # never read beside a near-miss name (fourth review, N4)
    stray.unlink()
    assert gate(world).on and gate(world).ruled_cap == Decimal(5)


def test_the_newest_by_its_date_is_read_and_an_invalid_newest_never_falls_back(world):
    write(world, "2026-11-05-signal-ai-pass.md", text("2026-11-05", "15"))
    write(world, "2026-11-20-signal-ai-pass.md", text())
    assert gate(world).ruled_cap == Decimal(5)
    write(world, "2026-11-24-signal-ai-pass.md", "lifts: live-provider-pause\n")
    assert not gate(world).on and "2026-11-24-signal-ai-pass.md" in gate(world).missing[0]


@pytest.mark.parametrize("shape", ["folder", "link inside", "link outside"])
def test_a_link_or_a_folder_is_never_a_ruling(world, tmp_path, shape):
    write(world, "2026-11-05-signal-ai-pass.md", text("2026-11-05"))
    newest = world[1] / "2026-11-20-signal-ai-pass.md"
    if shape == "folder":
        newest.mkdir()
    elif shape == "link inside":
        newest.symlink_to(write(world, "another-ruling.md", text()))
    else:
        outside = tmp_path / "outside.md"
        outside.write_text(text(), encoding="utf-8")
        newest.symlink_to(outside)
    assert gate(world).missing == refused(
        "2026-11-20-signal-ai-pass.md",
        "it is not a regular file of text (a link or folder is never read).",
    )


def test_the_date_line_must_be_the_date_in_the_name(world):
    write(world, "2026-11-20-signal-ai-pass.md", text("2026-11-19"))
    assert gate(world).missing == refused(
        "2026-11-20-signal-ai-pass.md", "its date: line is not the date in its name."
    )


@pytest.mark.parametrize(
    ("body", "cap"),
    [
        ("\nExample:\ncap_usd: 15\n", Decimal(5)),  # a body line is never read
        ("", Decimal(5)),
    ],
)
def test_the_ruled_cap_is_read_from_the_header_block_only(world, body, cap):
    write(world, "2026-11-20-signal-ai-pass.md", text(body=body))
    assert gate(world).ruled_cap == cap


def test_a_cap_only_in_the_body_is_no_cap(world):
    body = (
        "# Standing ruling\n\nlifts: live-provider-pause\nby: user\ndate: 2026-11-20\n"
        "configs: copilot-luna-xhigh\n\nThe cap is:\ncap_usd: 15\n"
    )
    write(world, "2026-11-20-signal-ai-pass.md", body)
    assert gate(world).missing == refused("2026-11-20-signal-ai-pass.md", MISPLACED_CAP)


def test_a_ruling_with_windows_line_ends_is_read(world):
    write(world, "2026-11-20-signal-ai-pass.md", text().replace("\n", "\r\n"))
    assert gate(world).on and gate(world).ruled_cap == Decimal(5)


def test_a_blank_of_the_draft_anywhere_is_not_accepted(world):
    write(world, "2026-11-20-signal-ai-pass.md", text(body='The owner said: "____".\n'))
    assert gate(world).missing == refused(
        "2026-11-20-signal-ai-pass.md", "it still holds a blank of the draft (____)."
    )


def test_the_draft_is_not_a_ruling_as_it_stands_or_with_only_its_date_and_cap_filled(world):
    write(world, "2026-11-20-signal-ai-pass.md", DRAFT)
    assert not gate(world).on
    filled = DRAFT.replace("date: ____-__-__", "date: 2026-11-20").replace(
        "cap_usd: ____", "cap_usd: 5"
    )
    write(world, "2026-11-20-signal-ai-pass.md", filled)
    assert gate(world).missing == refused(
        "2026-11-20-signal-ai-pass.md", "it still holds a blank of the draft (____)."
    )
    answered = filled.replace('said: "____"', 'said: "Yes, at USD 5."')
    write(world, "2026-11-20-signal-ai-pass.md", answered)
    assert gate(world).on and gate(world).ruled_cap == Decimal(5)


def test_the_header_block_is_the_run_of_lines_holding_the_lifts_line():
    lines = ai_gate.header_lines("# Title\n\nintro\n\nby: user\nlifts: x\nb: 2\n\nbody: 3\n")
    assert lines == ["by: user", "lifts: x", "b: 2"]
    assert ai_gate.header_lines("lifts: x\r\ncap_usd: 1\r\n\r\nc: 3") == ["lifts: x", "cap_usd: 1"]
    assert ai_gate.header_lines("no headers\n") == []


# Fourth review, N4: a newer file with a near-miss name never leaves an older ruling in force

OLD = "2026-11-01-signal-ai-pass.md"


@pytest.mark.parametrize(
    "stray",
    [
        "2026-11-20-Signal-ai-pass.md",
        "2026-11-20-signal-ai-pass.md.txt",
        "2026-11-20-signal-ai-pass.md ",
        "2026-11-20-signal-ai-pass-withdrawn.md",
        "2026-11-20-SIGNAL-AI-PASS.MD",
        "signal-ai-pass.md",
        "2026-11-5-signal-ai-pass.md",
        "2026-11-01-signal-ai-pass.md.bak",
    ],
)
def test_a_near_miss_name_turns_the_pass_off_and_names_the_entry(world, stray):
    write(world, OLD, text("2026-11-01", "15"))
    assert gate(world).on  # the valid ruling alone is in force
    write(world, stray, text("2026-11-20", "5"))
    found = gate(world)
    assert not found.on and found.ruled_cap is None and found.ruling is None
    sentence = (
        f"The rulings folder holds {stray!r}, which is not named YYYY-MM-DD-signal-ai-pass.md;"
        " Signal reads no ruling while it is there (rename it or move it out of the folder)."
    )
    assert found.missing == (sentence,)


def test_a_near_miss_folder_or_link_turns_the_pass_off_too(world, tmp_path):
    write(world, OLD, text("2026-11-01", "15"))
    (world[1] / "2026-11-20-signal-ai-pass").mkdir()
    assert not gate(world).on and "'2026-11-20-signal-ai-pass'" in gate(world).missing[0]


def test_other_files_in_the_folder_change_nothing(world):
    write(world, OLD, text("2026-11-01", "15"))
    write(world, "2026-11-11-run-start-submit.md", text("2026-11-11", "500"))
    write(world, "README.md", "rulings\n")
    assert gate(world).on and gate(world).ruled_cap == Decimal(15)


# Fourth review, N10: honest files refused with the sentence that says what is wrong

NOT_UTF8 = "it is not UTF-8 text (save it as UTF-8)."
MISPLACED_CAP = (
    "its cap_usd: line is not among its header lines: it goes directly below the configs: line,"
    " with no blank line between them."
)


@pytest.mark.parametrize("codec", ["utf-16", "cp1252"])
def test_a_ruling_in_another_encoding_is_refused_as_not_utf8(world, codec):
    body = text(body='The owner said: "Yes \u2013 cap it at 5".\n').encode(codec)
    (world[1] / "2026-11-20-signal-ai-pass.md").write_bytes(body)
    assert gate(world).missing == refused("2026-11-20-signal-ai-pass.md", NOT_UTF8)


def test_a_blank_line_before_the_cap_line_says_where_the_line_must_be(world):
    write(
        world, "2026-11-20-signal-ai-pass.md", text().replace("xhigh\ncap_usd", "xhigh\n\ncap_usd")
    )
    assert gate(world).missing == refused("2026-11-20-signal-ai-pass.md", MISPLACED_CAP)


def test_a_link_is_still_refused_as_a_link(world, tmp_path):
    outside = tmp_path / "outside.md"
    outside.write_bytes(text().encode("utf-16"))
    (world[1] / "2026-11-20-signal-ai-pass.md").symlink_to(outside)
    assert gate(world).missing == refused(
        "2026-11-20-signal-ai-pass.md",
        "it is not a regular file of text (a link or folder is never read).",
    )
