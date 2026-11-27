"""Review findings K6-F1..F3 of the report view: summary, limitation, spacing."""

from __future__ import annotations

from decimal import Decimal

from deploy_vii import report_view as rv
from deploy_vii.contracts import Fact, ModuleView, ReportTable, TableColumn, TableRow

HASH = "a" * 64


def _amount(fact_id: str, label: str, amount: str, unit: str = "x", **extra) -> Fact:
    return Fact(
        fact_id=fact_id,
        label=label,
        amount=Decimal(amount),
        unit=unit,
        period="FY2025",
        **extra,
    )


def _module(facts, tables=(), module_id="CP-1") -> ModuleView:
    return ModuleView(
        module_id=module_id,
        title="t",
        aliases=(),
        status="accepted",
        artifact_sha256=HASH,
        facts=tuple(facts),
        tables=tuple(tables),
    )


# K6-F1


def test_a_collapsed_summary_keeps_the_figure_text_and_drops_only_the_trace_mark():
    line = rv.Line(
        runs=(
            rv.TextRun(text="Net leverage:", kind="text"),
            rv.TextRun(text="4.00x", kind="fig", ref_id="C1"),
            rv.TextRun(text="C1", kind="fig", ref_id="C1"),
        )
    )
    assert rv._summary((line,), ()) == "Net leverage: 4.00x"


# K6-F3


def test_two_figures_split_by_one_space_keep_that_space():
    a = _amount("a", "A", "4", calculation_id="calc-a")
    b = _amount("b", "B", "3", calculation_id="calc-b")
    module = _module([a, b])
    refs = {("CP-1", "a"): ("C1",), ("CP-1", "b"): ("C2",)}
    runs = rv._token_runs("{a|x} {b|x}", module, refs, judged=False)
    assert "".join(run.text for run in runs) == "4 x 3 x"


# K6-F2

LIMITATION = "Missing selected comparison basis; the growth column is not drawn."


def _headline_block(*, with_row: bool):
    from datetime import date

    from deploy_vii.bindings import Binding
    from deploy_vii.contracts import Run, View
    from deploy_vii.report_view import FactCoord

    fact = Fact(
        fact_id="f1",
        label="Net leverage",
        table_id="T1B.1",
        row_id="r1",
        field="current",
        amount=Decimal(4),
        unit="x",
        period="FY2025",
        calculation_id="calc-1",
    )
    table = ReportTable(
        table_id="T1B.1",
        title="Headline",
        columns=(TableColumn(field="current", label="Current"),),
        rows=(TableRow(row_id="r1", label="Net leverage", fact_ids=("f1",)),) if with_row else (),
        limitation=LIMITATION,
    )
    facts = [fact] if with_row else []
    module = _module(facts, [table], module_id="CP-1B")
    run = Run(
        run_id="run1",
        issuer_id="acme",
        issuer_name="Acme",
        as_of=date(2025, 12, 31),
        case_kind="synthetic",
    )
    view = View(run=run, mode="candidate", modules=(module,))
    pathway = rv.Pathway(
        id="p", title="p", question="q", requested_modules=("CP-1B",), blocks=("headline-results",)
    )
    binding = Binding(
        fact_coord=FactCoord(module_id="CP-1B", table_id="T1B.1"),
        block_id="headline-results",
        cell_slot="headline",
        unit_class="multiple",
    )
    refs = {("CP-1B", "f1"): ("C1",)}
    return rv._block("headline-results", pathway, view, (binding,), refs, {})


def test_a_populated_primary_table_shows_its_limitation_verbatim():
    block = _headline_block(with_row=True)
    assert block.rows and block.note == LIMITATION


def test_an_empty_primary_table_shows_its_limitation_beside_the_generic_note():
    block = _headline_block(with_row=False)
    assert LIMITATION in (block.note or "")


# K7 review of 52b2437

LIMIT_2 = "Balance changes exclude the acquired entity."
LIMIT_1 = "Missing selected comparison basis; the growth column is not drawn."


def _two_register_block(block_id="headline-results", *, strip=False):
    from datetime import date

    from deploy_vii.bindings import Binding
    from deploy_vii.contracts import Run, View
    from deploy_vii.report_view import FactCoord

    facts, tables, bindings, refs = [], [], [], {}
    for n, limit in ((1, LIMIT_1), (2, LIMIT_2)):
        tid = f"T1B.{n}"
        facts.append(
            Fact(
                fact_id=f"f{n}",
                label="Net leverage",
                table_id=tid,
                row_id="r1",
                field="current",
                amount=Decimal(4),
                unit="x",
                period="FY2025",
                calculation_id=f"calc-{n}",
            )
        )
        tables.append(
            ReportTable(
                table_id=tid,
                title=f"Title {n}",
                columns=(TableColumn(field="current", label="Current"),),
                rows=(TableRow(row_id="r1", label="Net leverage", fact_ids=(f"f{n}",)),),
                limitation=limit,
            )
        )
        bindings.append(
            Binding(
                fact_coord=FactCoord(module_id="CP-1B", table_id=tid),
                block_id=block_id,
                cell_slot=f"slot{n}",
                unit_class="multiple",
                label=f"Register {n}",
            )
        )
        refs[("CP-1B", f"f{n}")] = (f"C{n}",)
    module = _module(facts, tables, module_id="CP-1B")
    run = Run(
        run_id="run1",
        issuer_id="acme",
        issuer_name="Acme",
        as_of=date(2025, 12, 31),
        case_kind="synthetic",
    )
    view = View(run=run, mode="candidate", modules=(module,))
    pathway = rv.Pathway(
        id="p", title="p", question="q", requested_modules=("CP-1B",), blocks=(block_id,)
    )
    return rv._block(block_id, pathway, view, tuple(bindings), refs, {})


def test_a_second_populated_register_limitation_reaches_the_reader_verbatim():
    block = _two_register_block()
    note = block.note or ""
    assert LIMIT_1 in note
    assert f"Register 2: {LIMIT_2}" in note


def test_a_degraded_strip_note_keeps_the_primary_limitation():
    block = _two_register_block("model-chart-strip")
    assert LIMIT_1 in (block.note or "")
    assert "Chart" in (block.note or "")


def test_a_prose_block_whose_producer_carries_none_of_its_facts_is_absent_not_a_crash():
    from datetime import date

    from deploy_vii.bindings import Binding
    from deploy_vii.contracts import Run, View
    from deploy_vii.report_view import FactCoord

    module = _module([_amount("f9", "Other", "1")], module_id="CP-2")
    run = Run(
        run_id="run1",
        issuer_id="acme",
        issuer_name="Acme",
        as_of=date(2025, 12, 31),
        case_kind="synthetic",
    )
    view = View(run=run, mode="candidate", modules=(module,))
    pathway = rv.Pathway(
        id="p", title="p", question="q", requested_modules=("CP-2",), blocks=("key-findings",)
    )
    binding = Binding(
        fact_coord=FactCoord(module_id="CP-2", fact_id="missing"),
        block_id="key-findings",
        cell_slot="findings",
        unit_class="text",
    )
    block = rv._block("key-findings", pathway, view, (binding,), {}, {})
    assert block.state == "absent"
    assert block.note == "Absent: CP-2 supplied no rows for this block."
