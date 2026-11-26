"""tools/instruction_metrics.py: the measures of one hand-written instruction text.

The expected numbers are counted by hand from the literal text below, not by the tool.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import instruction_metrics

SHA = "a" * 64
REPEATED = "The module must state each amount with its period and unit. " * 4  # 240 characters
TEXT = (
    "# CP-X for Issuer\n\n"
    "Never invent a figure. Write the handoff.\n\n"
    "Selected method, verbatim:\n\n"
    f"=== skills/cp-x/SKILL.md sha256 {SHA} ===\n\n"
    f"{REPEATED}\n\n"
    "You MUST read REF_CP-X_STEPS.md, REF_CP-X_RUBRIC.md and REF_CP-X_SCHEMA.md first.\n\n"
    f"=== skills/cp-x/references/REF_CP-X_STEPS.md sha256 {SHA} ===\n\n"
    "## REF_CP-X_RUBRIC.md\n\n"
    "Set qa_status.\n\n"
    f"{REPEATED}\n"
)


def test_one_text_is_measured_as_counted_by_hand():
    got = instruction_metrics.measure(TEXT)
    head = "# CP-X for Issuer\n\nNever invent a figure. Write the handoff.\n\n"
    assert got["chars"] == len(TEXT)
    assert got["head_chars"] == len(head) == 62
    assert got["method_chars"] == len(TEXT) - 62
    assert got["method_files"] == 2
    assert got["lines"] == 19
    # "Never invent", the paragraph's four "must" sentences twice, and "You MUST read"
    assert got["directive_sentences"] == 10
    assert got["emphasis_words"] == 1
    assert got["repeated_chars"] == 239  # the second copy, stripped of its trailing space
    assert got["overridden_chars"] == len("Set qa_status.") == 14
    assert got["unsent_references"] == 1  # SCHEMA: not a sent file, not a bundle section


def test_a_change_is_reported_against_an_earlier_measurement(tmp_path):
    (tmp_path / "CP-X.md").write_text(TEXT, encoding="utf-8")
    after = instruction_metrics.measure_folder(tmp_path)
    before = {"CP-X": dict(after["CP-X"], chars=after["CP-X"]["chars"] + 500)}
    lines = instruction_metrics.table(after, before).splitlines()
    assert [line.split()[0] for line in lines] == ["module", "CP-X", "TOTAL"]
    assert lines[1].split()[1] == "-500" and lines[2].split()[1] == "-500"
    assert lines[1].split()[2] == "+0"


def test_a_folder_without_instruction_files_is_refused(tmp_path):
    with pytest.raises(SystemExit, match="no <module>.md instruction file"):
        instruction_metrics.measure_folder(tmp_path)
