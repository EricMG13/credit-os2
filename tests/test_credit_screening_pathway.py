"""PR 6 (owner, 2026-11-25, ruling R12): the `credit_screening` run pathway.

Answer keys, hand-written from the plan's rulings C1 and C4 and the method text
(`docs/reuse/selected-methods/skills/cp-l10-financial-change-screen/SKILL.md`); no expected value
is imported from production code. Every reference to what does not exist yet is inside a test
body, so the file collects before the pathway is built."""

from decimal import Decimal

import pytest

from deploy_vii.contracts import DEACTIVATED_PATHWAYS, PATHWAY_CAP_USD, PATHWAY_MODULES
from deploy_workflow.inbox import startup
from deploy_workflow.owners import cpos_launch

SKILL_DIR = "docs/reuse/selected-methods/skills/cp-l10-financial-change-screen/"
CANON = "docs/reuse/selected-methods/CANON_SHARED.md"
# C1: the seventeen sections CP-L10 is sent in `credit_screening`, in order: SKILL.md, the five
# adaptive methods, the lite analysis policy, the five schema references (all under SKILL_DIR),
# then the Confidence Score section, the three reader-layer sections and the register-scope section.
CREDIT_SCREENING_SECTIONS = [
    SKILL_DIR + "SKILL.md",
    SKILL_DIR + "references/REF_CP-L10_ADAPTIVE_METHOD.md",
    SKILL_DIR + "references/REF_CP-L20_ADAPTIVE_METHOD.md",
    SKILL_DIR + "references/REF_CP-L23_ADAPTIVE_METHOD.md",
    SKILL_DIR + "references/REF_CP-L30_ADAPTIVE_METHOD.md",
    SKILL_DIR + "references/REF_CP-L40_ADAPTIVE_METHOD.md",
    SKILL_DIR + "references/CP-L10_CP_LITE_ANALYSIS_POLICY_v1.md",
    SKILL_DIR + "references/CP-L10_SCHEMA_REFERENCE.md",
    SKILL_DIR + "references/CP-L20_SCHEMA_REFERENCE.md",
    SKILL_DIR + "references/CP-L23_SCHEMA_REFERENCE.md",
    SKILL_DIR + "references/CP-L30_SCHEMA_REFERENCE.md",
    SKILL_DIR + "references/CP-L40_SCHEMA_REFERENCE.md",
    CANON + " § CP_CONFIDENCE_SCORE.md",
    CANON + " § Reader-facing research layer",
    CANON + " § Credit-research reading order",
    CANON + " § Analytical appendix",
    "docs/reuse/selected-methods/CPOS_REGISTER_SCOPE.md § CP-L10",
]
# What CP-L10 is sent today in every other pathway (the archived-method stand-in, unchanged).
CP_L10_UNCHANGED_SECTIONS = [
    "src/deploy_vii/methods/cpl10.md",
    CANON + " § Reader-facing research layer",
    CANON + " § Credit-research reading order",
    CANON + " § Analytical appendix",
]
# C4: the reader tables, in order: (block id, title).
SCREEN_BLOCKS = [
    ("financial-change-screen", "Financial change screen"),
    ("credit-screen", "Credit screen"),
    ("liquidity-forward-risk-screen", "Liquidity and forward-risk screen"),
    ("security-opportunity-screen", "Security opportunity screen"),
    ("creditor-document-screen", "Creditor-document screen"),
]
QUESTION = (
    "Which financial, credit, liquidity, market and legal points matter most, and where is a "
    "full assessment needed?"
)


def test_the_cap_is_usd_10_in_the_table_and_in_the_ruled_figures():
    assert PATHWAY_CAP_USD["credit_screening"] == Decimal(10)
    assert startup.RULED_CAPS_USD["credit_screening"] == 10


def test_the_pathway_runs_cp0_cp1_cpdr_then_cpl10():
    assert PATHWAY_MODULES["credit_screening"] == ("CP-0", "CP-1", "CP-DR", "CP-L10")


def test_credit_screening_is_active_and_the_short_snapshot_stays_deactivated():
    assert "credit_screening" not in DEACTIVATED_PATHWAYS
    assert "short_snapshot" in DEACTIVATED_PATHWAYS
    assert PATHWAY_CAP_USD["short_snapshot"] == Decimal(20)
    assert PATHWAY_MODULES["short_snapshot"] == ("CP-0", "CP-1", "CP-L10")


def test_start_up_admits_the_credit_screening_with_its_cap():
    from deploy_workflow.inbox.startup import STANDING_RULING

    startup.check_launchable(STANDING_RULING)  # raises StartupRefused on a cap with no ruled figure
    assert "credit_screening" in PATHWAY_CAP_USD
    assert "credit_screening" in startup.RULED_CAPS_USD


def test_the_launcher_admits_credit_screening_and_still_refuses_the_short_snapshot():
    cpos_launch.refuse_deactivated("credit_screening")  # does not raise
    with pytest.raises(cpos_launch.LaunchRefused, match="short credit snapshot is deactivated"):
        cpos_launch.refuse_deactivated("short_snapshot")


def test_cp_l10_is_sent_the_seventeen_sections_of_the_five_screen_method_in_order():
    names = [name for name, _ in cpos_launch.method_sections("CP-L10", "credit_screening")]
    assert names == CREDIT_SCREENING_SECTIONS
    assert len(set(names)) == 17


def test_the_five_payload_schemas_are_not_sent():
    names = cpos_launch.method_sections("CP-L10", "credit_screening")
    assert not [n for n, _ in names if n.endswith(".schema.txt")]


def test_every_other_method_selection_of_cp_l10_is_unchanged():
    assert [n for n, _ in cpos_launch.method_sections("CP-L10")] == CP_L10_UNCHANGED_SECTIONS
    assert [n for n, _ in cpos_launch.method_sections("CP-L10", "short_snapshot")] == (
        CP_L10_UNCHANGED_SECTIONS
    )
    assert cpos_launch.method_text("CP-L10") == cpos_launch.method_text("CP-L10", "short_snapshot")


def test_the_report_preset_is_the_five_screens_each_dense_and_owned_by_cp_l10():
    from deploy_vii import report_view

    found = [p for p in report_view.pathways() if p.id == "credit_screening"]
    assert len(found) == 1
    preset = found[0]
    assert preset.title == "Credit screening"
    assert preset.question == QUESTION
    assert preset.requested_modules == ("CP-0", "CP-1", "CP-DR", "CP-L10")
    assert list(preset.blocks) == [block_id for block_id, _ in SCREEN_BLOCKS]
    for block_id, title in SCREEN_BLOCKS:
        spec = report_view._spec_of(block_id)
        assert (spec.title, spec.kind, spec.owner) == (title, "dense", "CP-L10")
