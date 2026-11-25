"""tools/instruction_trial.py: how each arm's instruction text is made, on a literal text."""

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import instruction_trial as trial

SHA = "b" * 64
RULE = (
    "State each covenant test with its ratio, threshold and tested period. " * 3
)  # 210 characters
HEAD = "# CP-X for Issuer\n\nHead rules.\n\n"
MARK = "Selected method, verbatim:\n\n"
OWN = (
    f"=== skills/cp-x/SKILL.md sha256 {SHA} ===\n\n"
    f"## Style\n{RULE}\n\n"
    "Register T9.1 and register T9B.2 are required.\n\n"
    "<!-- UX_CONTRACT:BEGIN -->\n"
    "## Invocation fields — binding before drafting\nUse the script.\n\n"
    "## Automated QA validation\nRun `python3 ./scripts/validate_handoff.py -`.\n\n"
    f"## Style (relocated from ACTIVE_PROMPT 2026-07-11)\n{RULE}\n\n"
    "Scripts: `./scripts/headroom.py` owns T9.1 headroom; the sign comes from the test type.\n\n"
)
SHARED = (
    f"=== docs/reuse/selected-methods/CANON_SHARED.md § Reader sha256 {SHA} ===\n\nShared text."
)
PREPARED = HEAD + MARK + OWN + SHARED


def test_arm_a_is_the_prepared_text_unchanged():
    assert trial.arm_text("A", "CP-X", PREPARED) == PREPARED


def test_arm_b_drops_repeats_and_what_cannot_apply_and_rewords_nothing():
    got = trial.arm_text("B", "CP-X", PREPARED)
    assert got.startswith(HEAD + MARK + f"=== skills/cp-x/SKILL.md sha256 {SHA} ===\n\n## Style\n")
    assert got.count(RULE.strip()) == 1  # the copy under the renamed heading is gone
    assert "relocated from ACTIVE_PROMPT" not in got
    assert "Invocation fields" not in got and "Automated QA validation" not in got
    assert "<!-- UX_CONTRACT:BEGIN -->" in got  # an opening marker with no closing one is kept
    # a paragraph that names a script and also holds a live rule stays, word for word
    assert "Scripts: `./scripts/headroom.py` owns T9.1 headroom; the sign comes from" in got
    assert got.endswith(SHARED)
    assert trial.dropped_ids(PREPARED, got) == []
    assert len(got) < len(PREPARED)


def test_arm_c_is_the_head_the_restructured_text_and_the_shared_sections(tmp_path, monkeypatch):
    monkeypatch.setattr(trial, "ARM_C", tmp_path)
    (tmp_path / "CP-X.md").write_text("### Role\nInterpret covenants. Register T9.1.\n")
    got = trial.arm_text("C", "CP-X", PREPARED)
    assert got.startswith(HEAD + MARK + "=== trial arm C: CP-X method, restructured sha256 ")
    assert "### Role\nInterpret covenants. Register T9.1.\n\n" + SHARED in got
    assert "## Style" not in got
    assert trial.dropped_ids(PREPARED, got) == ["T9B.2"]


def test_arm_c_without_a_text_is_refused(tmp_path, monkeypatch):
    monkeypatch.setattr(trial, "ARM_C", tmp_path)
    with pytest.raises(SystemExit, match="arm C has no text for CP-X"):
        trial.arm_text("C", "CP-X", PREPARED)


def test_instructions_without_a_method_block_are_refused():
    with pytest.raises(SystemExit, match="no method block"):
        trial.arm_text("B", "CP-X", HEAD)


def _run(folder, *charges):
    (folder / "live").mkdir(parents=True)
    lines = [json.dumps({"settled_usd": c}) for c in charges]
    (folder / "live/calls.jsonl").write_text("\n".join(lines) + "\n")


def test_the_trial_total_is_what_the_runs_beside_this_one_settled(tmp_path):
    _run(tmp_path / "cp3-A", "0.50", "0.25")
    _run(tmp_path / "cp3-B", "1.10")
    assert trial.trial_spent(tmp_path / "cp3-C") == Decimal("1.85")


def test_a_call_with_no_settled_charge_stops_the_trial(tmp_path):
    _run(tmp_path / "cp3-A", "0.50", None)
    with pytest.raises(SystemExit, match="no settled charge"):
        trial.trial_spent(tmp_path / "cp3-B")


def test_a_live_run_is_refused_once_the_trial_cap_is_settled(tmp_path):
    _run(tmp_path / "cp3-A", "30", "20")
    args = argparse.Namespace(out=tmp_path / "cp3-B", trial_cap="50", cap="10")
    with pytest.raises(SystemExit, match="settled USD 50 or more"):
        trial.live(args)
