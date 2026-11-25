"""PR 6, Task 2 (owner, 2026-11-25, ruling R12; plan C1 to C4, C13, C14): the pathway-keyed method,
registers and checks. CP-L10 in `credit_screening` is sent the archived five-screen method and owes
its 20 registers; every other (module, pathway) behaves as before. The pathway id is a plain string
here: `PathwayId` gains it in Task 3, so these tests never build a prepared run for it."""

import dataclasses
import re
from datetime import date
from typing import Any, cast

import pytest
import test_cpos_launch as launch_tests
from test_cpos_register_scope import CREDIT_SCREENING_L10, SCREENING_FIXTURE, _screening_text

from deploy_vii.contracts import PATHWAY_MODULES, Run
from deploy_workflow import method_scripts, prose_checks
from deploy_workflow.owners import cpos_launch
from deploy_workflow.owners.cpos_launch import METHODS, REGISTER_SCOPE_MODULES

PATHWAY = "credit_screening"
OTHER_PATHWAYS = sorted(set(PATHWAY_MODULES) - {PATHWAY})
SCREEN_HEADER = ["Topic", "Finding", "Materiality", "Evidence", "Next step"]
SCREEN_TITLES = [
    "Financial change screen",
    "Credit screen",
    "Liquidity and forward-risk screen",
    "Security opportunity screen",
    "Creditor-document screen",
]


def _without_column(text: str, register: str, column: int) -> str:
    """The fixture with one column (by position) removed from every row of one register's table."""
    out: list[str] = []
    inside = False
    for line in text.split("\n"):
        if line.startswith("#### "):
            inside = line.startswith(f"#### {register} - ")
        if inside and line.startswith("|"):
            cells = line.strip().strip("|").split("|")
            del cells[column]
            line = "|" + "|".join(cells) + "|"
        out.append(line)
    return "\n".join(out)


# -- the lookup: nothing else moves ----------------------------------------------------------


@pytest.mark.parametrize("pathway", [None, *OTHER_PATHWAYS, "no_such_pathway"])
def test_every_module_in_every_other_pathway_is_sent_the_method_it_is_sent_today(pathway):
    for module in METHODS:
        assert cpos_launch.method_sections(module, pathway) == cpos_launch.method_sections(module)
        assert cpos_launch.method_text(module, pathway) == cpos_launch.method_text(module)
        assert cpos_launch.required_registers(module, pathway) == (
            cpos_launch.required_registers(module)
        )


def test_in_credit_screening_every_module_but_cp_l10_is_sent_todays_method():
    for module in METHODS:
        if module == "CP-L10":
            continue
        assert cpos_launch.method_text(module, PATHWAY) == cpos_launch.method_text(module)
        assert cpos_launch.required_registers(module, PATHWAY) == (
            cpos_launch.required_registers(module)
        )
        assert cpos_launch.register_issues(module, "## Findings\n\nx\n", PATHWAY) == (
            cpos_launch.register_issues(module, "## Findings\n\nx\n")
        )


def test_the_scope_of_every_measured_module_is_the_same_in_every_pathway():
    for module in REGISTER_SCOPE_MODULES:
        assert cpos_launch.register_scope(module, PATHWAY) == cpos_launch.register_scope(module)


def test_the_one_override_is_the_five_screen_method_and_methods_stays_the_one_page():
    five = cpos_launch.method_text("CP-L10", PATHWAY)
    assert five != cpos_launch.method_text("CP-L10")
    assert five.startswith("=== docs/reuse/selected-methods/skills/cp-l10-financial-change-screen/")
    assert cpos_launch.METHODS["CP-L10"][0] == "src/deploy_vii/methods/cpl10.md"
    assert cpos_launch.method_text("CP-L10", "short_snapshot") == cpos_launch.method_text("CP-L10")


def test_the_one_argument_form_is_still_what_method_text_calls(monkeypatch):
    seen: list[tuple[Any, ...]] = []
    real = cpos_launch.method_sections

    def spy(*args: Any):
        seen.append(args)
        return real(*args)

    monkeypatch.setattr(cpos_launch, "method_sections", spy)
    cpos_launch.method_text("CP-1")
    cpos_launch.method_text("CP-1", None)
    assert seen == [("CP-1",), ("CP-1",)]


def test_credit_screening_cp_l10_cuts_no_register_and_says_none_is_routing():
    assert cpos_launch.register_scope("CP-L10", PATHWAY) == ""
    section = dict(cpos_launch.method_sections("CP-L10", PATHWAY))[
        "docs/reuse/selected-methods/CPOS_REGISTER_SCOPE.md § CP-L10"
    ]
    assert "None of this module's required registers is a routing register." in section
    assert "do not write " not in section


def test_the_credit_screening_text_says_where_the_tables_and_registers_go():
    section = dict(cpos_launch.method_sections("CP-L10", PATHWAY))[
        "docs/reuse/selected-methods/CPOS_REGISTER_SCOPE.md § CP-L10"
    ]
    assert "`Topic | Finding | Materiality | Evidence | Next step`" in section
    assert "once" in section and "selector heading" in section
    assert "`####` headings under `### Analytical appendix — complete canonical registers`" in (
        section
    )
    for title in SCREEN_TITLES:
        assert f"`{title}`" in section, title


# -- the instructions: the pathway reaches every read of the method -------------------------------


def _instructions_of(pathway: str) -> str:
    run = Run(
        run_id="screening-run",
        issuer_id="harbourline",
        issuer_name="Harbourline Synthetic Foods plc",
        as_of=date(2025, 12, 31),
        case_kind="synthetic",
        pathway="credit_snapshot",
        requested_modules=("CP-0", "CP-1", "CP-L10"),
    ).model_copy(update={"pathway": pathway})  # PathwayId has no `credit_screening` before Task 3
    return cpos_launch._instructions(run, "CP-L10", (), context=cast(Any, None)).decode()


def test_cp_l10_is_sent_the_five_screen_method_the_presence_rule_and_the_confidence_inputs():
    text = _instructions_of(PATHWAY)
    head, mark, block = text.partition(cpos_launch.METHOD_MARK)
    assert mark and block == cpos_launch.method_text("CP-L10", PATHWAY) + "\n"
    assert cpos_launch.PRESENCE_RULE in head
    assert cpos_launch.CONFIDENCE_RULE in head
    assert cpos_launch.APPENDIX_HEADING_NOTE in head
    assert "### Confidence inputs" in head


@pytest.mark.parametrize("pathway", ["short_snapshot", "credit_snapshot"])
def test_cp_l10_in_any_other_pathway_is_sent_what_it_is_sent_today(pathway):
    text = _instructions_of(pathway)
    head, _, block = text.partition(cpos_launch.METHOD_MARK)
    assert block == cpos_launch.method_text("CP-L10") + "\n"
    assert cpos_launch.PRESENCE_RULE not in head
    assert cpos_launch.CONFIDENCE_RULE not in head
    assert "### Confidence inputs" not in head


def test_the_confidence_inputs_table_is_owed_by_cp_l10_in_credit_screening_only():
    owed = cpos_launch._owner_tables("CP-L10", (), PATHWAY)
    assert [t.heading for t in owed] == ["Confidence inputs"]
    assert cpos_launch._owner_tables("CP-L10", ()) == ()
    assert cpos_launch._owner_tables("CP-L10", (), "short_snapshot") == ()
    for module in METHODS:
        if module != "CP-L10":
            assert cpos_launch._owner_tables(module, (), PATHWAY) == (
                cpos_launch._owner_tables(module, ())
            )


# -- the completeness contract: the five-screen contract, credit screening only ----------------


def test_the_fixture_meets_the_five_screen_completeness_contract():
    text = _screening_text()
    outcomes = method_scripts.shared("CP-L10", text, PATHWAY)
    assert outcomes, "the five-screen SKILL.md is read for a credit screening"
    assert {o.register for o in outcomes} >= set(CREDIT_SCREENING_L10)
    assert [o for o in outcomes if o.status == "missing"] == []
    assert method_scripts.shared_issues("CP-L10", text, PATHWAY) == ()


def test_a_declared_column_missing_from_tl30_2_is_sent_back_naming_the_register_and_column():
    text = _without_column(SCREENING_FIXTURE.read_text(encoding="utf-8"), "TL30.2", 7)
    assert "| summary |" not in text.split("#### TL30.2 - ")[1].split("####")[0]
    (issue,) = method_scripts.shared_issues("CP-L10", text, PATHWAY)
    assert "TL30.2" in issue and "`summary`" in issue
    missing = [o for o in method_scripts.shared("CP-L10", text, PATHWAY) if o.status == "missing"]
    assert [(o.register, o.status) for o in missing] == [("TL30.2", "missing")]


def test_without_the_pathway_no_completeness_contract_is_read_for_cp_l10():
    text = _without_column(SCREENING_FIXTURE.read_text(encoding="utf-8"), "TL30.2", 7)
    assert method_scripts.shared("CP-L10", text) == ()
    assert method_scripts.shared("CP-L10", text, "short_snapshot") == ()
    assert method_scripts.shared_issues("CP-L10", text) == ()
    assert method_scripts.record("CP-L10", b"x") is None


def test_the_retained_record_of_a_screening_names_its_register_checks():
    raw = SCREENING_FIXTURE.read_bytes()
    record = method_scripts.record("CP-L10", raw, None, PATHWAY)
    assert record is not None
    assert {c["register"] for c in record["checks"]} >= set(CREDIT_SCREENING_L10)
    assert method_scripts.record("CP-L10", raw, None, "short_snapshot") is None


# -- the reader tables: the header is C4's, exactly -----------------------------------------------


def test_the_fixtures_five_reader_tables_have_the_header():
    assert prose_checks.screen_table_issues(_screening_text()) == ()


def test_a_reader_table_with_a_wrong_header_is_refused_naming_the_table():
    text = _screening_text().replace(
        "### Credit screen\n\n| Topic | Finding | Materiality | Evidence | Next step |",
        "### Credit screen\n\n| Topic | Finding | Materiality | Evidence | Next steps |",
    )
    (issue,) = prose_checks.screen_table_issues(text)
    assert (
        "Credit screen" in issue and "Topic | Finding | Materiality | Evidence | Next step" in issue
    )
    assert "Financial change screen" not in issue


def test_a_missing_reader_table_is_refused_naming_the_table():
    text = re.sub(
        r"### Security opportunity screen\n\n(?:\|.*\n)+\n", "", _screening_text(), count=1
    )
    (issue,) = prose_checks.screen_table_issues(text)
    assert "Security opportunity screen" in issue


def test_a_module_that_stops_at_its_gate_owes_no_reader_table():
    blocked = "---\nmodule_status: Blocked\n---\n\n## Findings\n"
    assert prose_checks.screen_table_issues(blocked)  # the bare check owes every table
    assert cpos_launch.screen_issues("CP-L10", blocked, PATHWAY) == ()


def test_the_launcher_refuses_a_wrong_header_in_credit_screening_only(tmp_path):
    prepared, task, _ = launch_tests.good_task(tmp_path, "CP-4", "credit_snapshot")
    check = cpos_launch.checker(prepared.layout)
    task = dataclasses.replace(task, module_id="CP-L10")
    bad = _screening_text().replace(
        "| Topic | Finding | Materiality | Evidence | Next step |\n"
        "| --- | --- | --- | --- | --- |\n| Source basis",
        "| Topic | Finding | Evidence | Next step |\n| --- | --- | --- | --- |\n| Source basis",
        1,
    )
    assert bad != _screening_text()

    def issues(pathway: str, text: str) -> list[str]:
        screened = dataclasses.replace(task, run=task.run.model_copy(update={"pathway": pathway}))
        return [
            i
            for i in check(screened, text.encode())
            if "Financial change screen" in i or "Missing registers" in i or "TL30.2" in i
        ]

    assert len(issues(PATHWAY, bad)) == 1
    assert issues(PATHWAY, _screening_text()) == []
    assert issues("credit_snapshot", bad) == []
    assert issues("short_snapshot", bad) == []


def test_the_launcher_sends_back_a_missing_register_and_a_missing_column_in_credit_screening_only(
    tmp_path,
):
    prepared, task, _ = launch_tests.good_task(tmp_path, "CP-4", "credit_snapshot")
    check = cpos_launch.checker(prepared.layout)
    task = dataclasses.replace(task, module_id="CP-L10")
    whole = SCREENING_FIXTURE.read_text(encoding="utf-8")
    cases = {
        "Missing registers: TL23.2.": _screening_text(without="TL23.2"),
        "lacks the method's column `summary`": _without_column(whole, "TL30.2", 7),
    }

    def raised(pathway: str, text: str) -> list[str]:
        screened = dataclasses.replace(task, run=task.run.model_copy(update={"pathway": pathway}))
        return check(screened, text.encode())  # type: ignore[return-value]

    for words, text in cases.items():
        assert [i for i in raised(PATHWAY, text) if words in i], words
        for other in ("credit_snapshot", "short_snapshot"):
            assert [i for i in raised(other, text) if words in i] == [], (other, words)
