"""PR 6 (owner, 2026-11-25, ruling R12): the `credit_screening` run pathway. Offline, synthetic
handoffs, no provider: nothing here calls a model, and the figures in the fixture are invented.

Answer keys, hand-written from the plan's rulings C1 and C4 and the method text
(`docs/reuse/selected-methods/skills/cp-l10-financial-change-screen/SKILL.md`); no expected value
is imported from production code. Every reference to what does not exist yet is inside a test
body, so the file collects before the pathway is built."""

import hashlib
import json
import re
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

import library_fixtures
import pytest
import update_library
from library_fixtures import make_run, method, with_changes, without_report
from test_cpos_launch import all_instructions, context_file, issuer_folder
from test_cpos_register_scope import CREDIT_SCREENING_L10, SCREENING_FIXTURE, _screening_text
from test_handoff_loop import GOOD, Adapter, check, turn

from deploy_vii import registry
from deploy_vii.contracts import DEACTIVATED_PATHWAYS, PATHWAY_CAP_USD, PATHWAY_MODULES, Run
from deploy_workflow import credit_os_chips, library_index, method_scripts
from deploy_workflow.changes import find_prior
from deploy_workflow.inbox import startup
from deploy_workflow.model import handoff
from deploy_workflow.model.configs import CONFIGS
from deploy_workflow.model.turn import ToolCall
from deploy_workflow.owners import cpos_launch
from deploy_workflow.owners.cpos import HandoffTask
from deploy_workflow.owners.cpos_launch import prepare
from react_frontend.library_cards import lead_summary

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


# ---- Task 3: the pathway is active (plan rulings C4 to C8, C10, C14; owner ruling R12) ---------
# Everything below reads the real library and launcher code on the synthetic handoff of
# tests/fixtures/credit-screening/CP-L10.md; no provider is called and no figure is real.

PATHWAY = "credit_screening"
OTHER_PATHWAYS = sorted(set(PATHWAY_MODULES) - {PATHWAY})
HEADER = ["Topic", "Finding", "Materiality", "Evidence", "Next step"]
# sha256 of the instructions the lite credit assessment's CP-0 and CP-1 are built with, from a clean
# `git archive afb03e89` copy of this repository (the commit before this pathway), read through
# `tests/test_cpos_launch.all_instructions(tmp, "lite_credit_assessment")`. No golden or pin of an
# instruction's bytes existed, so these two are recorded here; the comparison of every module of
# every other pathway was also made once, base against head, with a scratch script (see the report).
LITE_INSTRUCTIONS_AT_BASE = {
    "CP-0": (75268, "be10d16967417c5098cfb9e0b849daa1ae4d621c0781db7d6a64111cefac9ac2"),
    "CP-1": (59142, "fe017f0a889345502b460fe2e77e1d421e0dcded3e0eda0a91b61e5577353ec0"),
}


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _tables(text: str) -> dict[str, tuple[list[str], list[list[str]]]]:
    """Each `### <heading>` of the fixture that holds one pipe table: its header cells and rows,
    read here, line by line, independently of the library's own reader."""
    found: dict[str, tuple[list[str], list[list[str]]]] = {}
    heading = None
    for line in text.splitlines():
        if line.startswith("#"):
            heading = line.lstrip("#").strip() if line.startswith("### ") else None
        elif heading and line.startswith("|") and "---" not in line:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            header, rows = found.setdefault(heading, (cells, []))
            if cells is not header:
                rows.append(cells)
    return found


# 1. the plan ----------------------------------------------------------------------------------


def test_the_plan_orders_cp_dr_before_cp_l10_and_sends_cp_l10_the_handoff_of_cp_dr(tmp_path):
    prepared, _ = all_instructions(tmp_path, PATHWAY)
    assert list(prepared.plan.instructions) == ["CP-0", "CP-1", "CP-DR", "CP-L10"]
    producers = registry.dependencies(tuple(prepared.plan.instructions))
    assert producers["CP-L10"] == {"CP-0", "CP-1", "CP-DR"}
    assert registry.edge_rule("CP-L10", "CP-DR") == "restricted"  # optional: degrades, never blocks
    assert "CP-L10" not in producers["CP-DR"]  # no cycle: CP-DR runs before CP-L10, not after


def test_the_short_snapshots_plan_is_unchanged_by_the_optional_input():
    producers = registry.dependencies(PATHWAY_MODULES["short_snapshot"])
    assert producers == {"CP-0": set(), "CP-1": {"CP-0"}, "CP-L10": {"CP-0", "CP-1"}}


def _task() -> HandoffTask:
    run = Run(
        run_id="screening-run",
        issuer_id="harbourline",
        issuer_name="Harbourline Synthetic Foods plc",
        as_of=date(2025, 3, 31),
        case_kind="synthetic",
        pathway="credit_screening",
        requested_modules=PATHWAY_MODULES["credit_screening"],
    )
    handoffs = {m: f"{m} synthetic handoff".encode() for m in ("CP-0", "CP-1", "CP-DR")}
    return HandoffTask(run, "CP-L10", b"screen", {"S1.txt": b"Revenue 100"}, handoffs, 1, ())


def test_the_request_names_cp_l10_by_the_pathways_words_and_carries_cp_drs_handoff(tmp_path):
    adapter = Adapter(turn(ToolCall("w", "write_handoff", {"markdown": GOOD.decode()})))
    executor = handoff.HandoffExecutor(tmp_path, adapter=adapter, cap_usd=Decimal(10), check=check)
    assert executor(_task()) == GOOD
    sent = json.loads(adapter.requests[0].messages[1].text)
    assert set(sent["handoffs"]) == {"CP-0", "CP-1", "CP-DR"}
    assert sent["handoffs"]["CP-DR"]["markdown"] == "CP-DR synthetic handoff"
    roles = sent["module_roles"]
    assert roles["CP-L10"] == (
        "Screens the issuer's financial change, credit, liquidity, market and legal position "
        "and names where a full assessment is needed."
    )
    assert roles["CP-DR"] == next(m.purpose for m in registry.modules() if m.module_id == "CP-DR")


def test_the_role_of_cp_l10_is_unchanged_in_every_other_pathway():
    short = next(m.purpose for m in registry.modules() if m.module_id == "CP-L10")
    assert "short credit snapshot" in short
    for pathway in (None, "", *OTHER_PATHWAYS):
        for module in registry.modules():
            assert registry.purpose(module.module_id, pathway or "") == module.purpose


# 2. the instructions --------------------------------------------------------------------------


def test_cp_l10s_instructions_hold_the_method_the_rules_the_selectors_and_the_name(tmp_path):
    _, texts = all_instructions(tmp_path, PATHWAY)
    text = texts["CP-L10"]
    head, mark, block = text.partition(cpos_launch.METHOD_MARK)
    assert mark and block == cpos_launch.method_text("CP-L10", PATHWAY) + "\n"
    assert cpos_launch.PRESENCE_RULE in head
    for _, title in SCREEN_BLOCKS:
        assert f"- `### {title}`: exactly one populated Markdown table under it." in head
    assert "Topic | Finding | Materiality | Evidence | Next step" in text
    assert "Credit screening" in head.partition("Refer to another module")[2].partition(".")[0]
    assert "Short credit snapshot" not in text
    assert cpos_launch.voice_rules(PATHWAY) in head
    assert cpos_launch.VOICE_RULES not in head


def test_the_other_modules_of_the_pathway_are_sent_the_pathways_name_too(tmp_path):
    _, texts = all_instructions(tmp_path, PATHWAY)
    for module, text in texts.items():
        assert cpos_launch.voice_rules(PATHWAY) in text, module
        assert "Short credit snapshot" not in text, module


@pytest.mark.parametrize("pathway", OTHER_PATHWAYS)
def test_no_other_pathway_is_sent_the_new_name(pathway):
    assert cpos_launch.voice_rules(pathway) == cpos_launch.VOICE_RULES
    assert credit_os_chips.module_names(pathway) == credit_os_chips.MODULE_NAMES
    assert "Short credit snapshot" in cpos_launch.VOICE_RULES
    assert "Credit screening" not in cpos_launch.VOICE_RULES
    assert library_index.module_titles(pathway) == {
        m.module_id: m.title for m in registry.modules()
    }


def test_cp_0_and_cp_1_of_the_lite_assessment_are_byte_identical_to_those_of_the_base(tmp_path):
    _, texts = all_instructions(tmp_path, "lite_credit_assessment")
    for module, (size, digest) in LITE_INSTRUCTIONS_AT_BASE.items():
        assert (len(texts[module]), _sha(texts[module])) == (size, digest), module


# 3. the checks on the fixture -----------------------------------------------------------------


def test_removing_one_register_names_it():
    (issue,) = cpos_launch.register_issues("CP-L10", _screening_text(without="TL40.3"), PATHWAY)
    assert "Missing registers: TL40.3." in issue


def _drop(text: str, register: str, column: str) -> str:
    """The fixture with one named column removed from every row of one register's table."""
    out, inside, index = [], False, -1
    for line in text.split("\n"):
        if line.startswith("#"):
            inside = line.startswith(f"#### {register} - ")
            index = -1
        elif inside and line.startswith("|"):
            cells = line.strip().strip("|").split("|")
            if index < 0:
                index = [c.strip() for c in cells].index(column)
            del cells[index]
            line = "|" + "|".join(cells) + "|"
        out.append(line)
    return "\n".join(out)


def test_removing_one_declared_column_is_sent_back_naming_register_and_column():
    text = _drop(_screening_text(), "TL20.3", "assessment")
    (issue,) = method_scripts.shared_issues("CP-L10", text, PATHWAY)
    assert "TL20.3" in issue and "`assessment`" in issue
    missing = [o for o in method_scripts.shared("CP-L10", text, PATHWAY) if o.status == "missing"]
    assert [(o.register, o.status) for o in missing] == [("TL20.3", "missing")]
    assert method_scripts.shared_issues("CP-L10", text) == ()  # no pathway: no contract


def test_removing_one_topic_row_is_recorded_as_noted_and_never_refused():
    text = _screening_text()
    cut = re.sub(r"^\| KPI_COMPARABILITY \|.*\n", "", text, count=1, flags=re.MULTILINE)
    assert cut != text
    whole = method_scripts.shared("CP-L10", text, PATHWAY)
    assert "noted" not in [o.status for o in whole if o.register == "TL10.2"]
    outcomes = method_scripts.shared("CP-L10", cut, PATHWAY)
    assert "noted" in [o.status for o in outcomes if o.register == "TL10.2"]
    assert not [o for o in outcomes if o.status == "missing"]
    assert method_scripts.shared_issues("CP-L10", cut, PATHWAY) == ()
    assert cpos_launch.register_issues("CP-L10", cut, PATHWAY) == ()


# 4. the prior run -----------------------------------------------------------------------------

ME = {"issuer_name": "Northbridge Synthetic Group", "case_kind": "public"}


def _prior(workspace: Path, as_of: str = "2025-03-31") -> str | None:
    found = find_prior(
        workspace,
        folder="cur",
        issuer_id="nbg",
        **ME,
        pathway=PATHWAY,
        as_of=as_of,
        method=method(),
    )
    return None if found is None else found[0].folder


def test_the_prior_run_of_a_credit_screening_is_an_earlier_credit_screening(tmp_path):
    make_run(tmp_path, "lite-1", as_of="2025-03-30", pathway="lite_credit_assessment")
    make_run(tmp_path, "short-1", as_of="2025-03-29", pathway="short_snapshot")
    make_run(tmp_path, "full-1", as_of="2025-03-28", pathway="credit_snapshot")
    assert _prior(tmp_path) is None  # newer runs of other pathways are no base
    make_run(tmp_path, "screen-1", as_of="2024-12-31", pathway=PATHWAY)
    assert _prior(tmp_path) == "screen-1"  # the older screening beats every newer other pathway
    make_run(tmp_path, "screen-2", as_of="2025-02-28", pathway=PATHWAY)
    assert _prior(tmp_path) == "screen-2"
    assert _prior(tmp_path, "2025-01-31") == "screen-1"


# 5. the cap -----------------------------------------------------------------------------------


@pytest.mark.parametrize("web_search", [False, True])
@pytest.mark.parametrize("config", sorted(CONFIGS))
def test_the_launcher_admits_the_preset_at_usd_10_on_every_configuration(
    tmp_path, config, web_search
):
    prepared = prepare(
        context_file(tmp_path, PATHWAY),
        issuer_folder(tmp_path),
        tmp_path / "out",
        config=config,
        cap="10",
        web_search=web_search,
    )
    assert prepared.plan.provider_cap_usd == Decimal(10)
    assert 0 < prepared.hold <= Decimal(10)


def test_cp_drs_search_fee_is_held_and_a_cap_below_the_largest_hold_is_refused(tmp_path):
    """sol-medium holds USD 5.73 for each call at this size; CP-DR's call also holds the 16 searches
    of one turn at USD 0.01 each (written out here, not read from the pricing constants)."""

    def held(cap: str, web_search: bool) -> Decimal:
        here = tmp_path / f"{cap}-{web_search}"
        here.mkdir()
        return prepare(
            context_file(here, PATHWAY),
            issuer_folder(here),
            here / "out",
            config="sol-medium",
            cap=cap,
            web_search=web_search,
        ).hold

    assert held("10", False) == Decimal("5.73")
    assert held("10", True) == Decimal("5.89")
    with pytest.raises(
        cpos_launch.LaunchRefused, match=r"one sol-medium call holds up to USD 5\.89"
    ):
        held("5.8", True)


# 6. fidelity: a retained run read by the library ----------------------------------------------


@pytest.fixture
def screening_library(tmp_path, monkeypatch):
    """A run folder of the four modules in the pathway (CP-L10 is the Task 1 fixture), each sent
    the method the launcher sends it in this pathway, then the library built by its real update
    path (`update_library`), and the published data read back."""

    def sent(module: str, version: str = "") -> str:
        return cpos_launch.method_text(module, PATHWAY if module == "CP-L10" else None)

    monkeypatch.setattr(library_fixtures, "method_block", sent)
    workspace = tmp_path / "ws"
    run = make_run(
        workspace,
        "screening-1",
        pathway=PATHWAY,
        modules=PATHWAY_MODULES[PATHWAY],
        answers={"CP-L10": SCREENING_FIXTURE.read_text(encoding="utf-8")},
        supplied=("harbourline_annual_report.txt",),
    )
    folder = without_report(run).parent.parent
    with_changes(folder, line="changes: first run of this pathway")
    update_library.update_library(workspace)
    text = (workspace / "library/data.js").read_text(encoding="utf-8")
    data = json.loads(text.removeprefix("window.CREDIT_OS_DATA=").rstrip().removesuffix(";"))
    key = next(iter(data["workspace"]["runs"]))
    output = next(o for o in data["workspace"]["outputs"].values() if o["module"] == "CP-L10")
    return (
        data,
        data["workspace"]["runs"][key],
        key,
        data["workspace"]["handoffs"][output["sha256"]],
    )


def _section(sections: list[dict[str, Any]], heading: str) -> dict[str, Any]:
    (found,) = [s for s in sections if s["heading"] == heading]
    return found


def test_the_library_admits_the_run_and_does_not_mark_cp_l10_as_changed(screening_library):
    data, run, _, _ = screening_library
    assert data["catalogue"]["issues"] == [] and data["workspace"]["issues"] == []
    assert run["pathway"] == PATHWAY
    assert run["publicationVerified"] is True
    assert run["methodChanges"] == []
    assert list(run["modules"]) == ["CP-0", "CP-1", "CP-DR", "CP-L10"]
    assert next(m["title"] for m in data["catalogue"]["real"]) == "Credit screening"


def test_overview_lead_is_the_bottom_line_of_cp_l10(screening_library):
    data, run, key, _ = screening_library
    expected = SCREENING_FIXTURE.read_text(encoding="utf-8").split("### Bottom line\n")[1]
    expected = expected.split("\n\n")[0]
    lead = lead_summary(data["workspace"], run, key)
    assert lead is not None and lead["module"] == "CP-L10"
    assert lead["text"] == expected


def test_changes_for_the_first_run_of_the_pathway_name_cp_l10_as_the_lead(screening_library):
    _, run, _, _ = screening_library
    assert run["changes"] == {
        "lead": "CP-L10",
        "first_run": True,
        "pack": None,
        "note": None,
        "problem": None,
        "verdicts": None,
    }


def test_modules_page_holds_the_five_reader_tables_cell_for_cell(screening_library):
    _, _, _, sections = screening_library
    wanted = _tables(SCREENING_FIXTURE.read_text(encoding="utf-8"))
    assert len(SCREEN_BLOCKS) == 5
    for _, title in SCREEN_BLOCKS:
        header, rows = wanted[title]
        assert header == HEADER and len(rows) == 6
        (table,) = [b for b in _section(sections, title)["blocks"] if b["type"] == "table"]
        assert table["headers"] == header
        assert [row["cells"] for row in table["rows"]] == rows


def test_forecast_has_no_model_for_the_run(screening_library):
    data, run, _, _ = screening_library
    assert data["workspace"]["models"] == []
    assert not run.get("forecast")


def test_evidence_reaches_all_twenty_registers_and_the_sources(screening_library):
    _, run, _, sections = screening_library
    published = {
        s["heading"].split(" - ")[0]: s
        for s in sections
        if s["level"] == 4 and re.match(r"TL\d\d\.\d - ", s["heading"])
    }
    assert sorted(published) == sorted(CREDIT_SCREENING_L10)
    for ident, section in published.items():
        assert any(b["type"] == "table" for b in section["blocks"]), ident
    assert _section(sections, "Sources")["blocks"]
    assert [s["name"] for s in run["evidence"]["sources"]] == ["harbourline_annual_report.txt"]
    assert {h["module"] for h in run["evidence"]["handoffs"]} == set(PATHWAY_MODULES[PATHWAY])


CAP_RULING = "docs/rulings/2026-11-25-deliverables-and-recommendations.md"
LAYER_1_RULING = "docs/rulings/2026-11-25-layer-1-in-all-assessment-pathways.md"


def test_the_credit_screening_cap_refusals_cite_the_ruling_that_holds_the_figure(monkeypatch):
    """Review finding L1: the USD 10 figure is in R12's ruling, so a refusal of that cap cites it
    and not the layer-1 ruling, which has no credit screening cap. Other pathways keep theirs."""
    with pytest.raises(cpos_launch.LaunchRefused) as launch:
        cpos_launch.run_cap("credit_screening", Decimal(11))
    caps = {**startup.PATHWAY_CAP_USD, "credit_screening": Decimal(11)}
    monkeypatch.setattr(startup, "PATHWAY_CAP_USD", caps)
    with pytest.raises(startup.StartupRefused) as start:
        startup.check_launchable(startup.STANDING_RULING)
    for message in (str(launch.value), str(start.value)):
        assert CAP_RULING in message and LAYER_1_RULING not in message
    with pytest.raises(cpos_launch.LaunchRefused, match=LAYER_1_RULING):
        cpos_launch.run_cap("credit_snapshot", Decimal(31))
