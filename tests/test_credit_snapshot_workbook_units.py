"""The Credit Snapshot writer keeps every unit and every table-read failure visible.

SYNTHETIC: the run is the key's invented "Northbridge" case (`tests/credit_snapshot_case.py`);
the model JSON and handoff tables are invented. Scope: written cell texts are compared with the
literal handoff-table or model-JSON text they come from.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import replace

import credit_snapshot_case as cs
import pytest

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_workbook as writer


@pytest.fixture(scope="module")
def full(tmp_path_factory):
    built = cs.build_case(tmp_path_factory.mktemp("units"), cs.CASES["full"])
    return built, snap.gather(snap.load_run(built.folder, built.stores.both()))


def triples(cells):
    return {(c.row, c.column, c.text) for c in cells}


def with_snapshot_unit(snapshot, row, unit):
    cell = snap.SnapshotCell(
        writer.SNAPSHOT, writer.FINANCIALS, row, "Unit", snap.COPIED, unit, "CP-1", "T4.1"
    )
    return replace(
        snapshot, blocks=(*snapshot.blocks, snap.Block(writer.SNAPSHOT, writer.FINANCIALS, (cell,)))
    )


def with_cp1_addition(snapshot, addition):
    changed = snapshot.model_handoffs["CP-1"] + addition
    return replace(
        snapshot,
        model_handoffs={"CP-1": changed},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(changed)},
    )


def forecast_snapshot(snapshot, units):
    forecast = {
        "schema_version": "cpos-forecast-exact/1",
        "consumed": {"CP-1.md": snapshot.handoff_sha256["CP-1"]},
        "units": units,
        "scale": "1000000",
        "outputs": {
            "REFERENCE": {
                "years": [
                    {
                        "year": 2026,
                        "ebitda": {"amount": "400", "reason": None},
                        "cfo": {"amount": None, "reason": "cash gap"},
                    }
                ]
            },
            "DOWNSIDE": {"years": [{"year": 2026, "ebitda": {"amount": "380", "reason": None}}]},
        },
    }
    forecast_bytes = json.dumps(forecast).encode()
    calculation = {
        "schema_version": "cpos-model/1",
        "forecast_exact_file": "forecast_exact.json",
        "forecast_exact_sha256": hashlib.sha256(forecast_bytes).hexdigest(),
        "history": {"schema_version": "cpos-history/1", "columns": []},
    }
    files = {
        "calculation.json": json.dumps(calculation).encode(),
        "forecast_exact.json": forecast_bytes,
    }
    return replace(
        snapshot,
        model_files=files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{name}": cs.sha256(raw) for name, raw in files.items()},
        },
    )


def model_rows(snapshot):
    return triples(writer._model_output_cells(snapshot))


def test_forecast_ebitda_row_takes_its_unit_suffix_from_the_adjusted_ebitda_snapshot_row(full):
    _, snapshot = full
    snapshot = forecast_snapshot(
        with_snapshot_unit(snapshot, "Adjusted EBITDA", "USD thousands"), "USD millions"
    )
    rows = model_rows(snapshot)
    assert ("Adjusted EBITDA (USD millions)", "Base FY2026", "400") in rows
    assert ("Adjusted EBITDA (USD millions)", "Downside FY2026", "380") in rows
    assert ("Adjusted EBITDA (USD millions)", "Unit", "USD millions") in rows
    assert not {r for r in rows if r[0] == "Adjusted EBITDA"}


def test_forecast_ebitda_row_does_not_borrow_the_unit_of_a_plain_ebitda_snapshot_row(full):
    _, snapshot = full
    snapshot = forecast_snapshot(
        with_snapshot_unit(snapshot, "EBITDA", "USD thousands"), "USD millions"
    )
    rows = model_rows(snapshot)
    assert ("Adjusted EBITDA", "Base FY2026", "400") in rows
    assert ("Adjusted EBITDA", "Unit", "USD millions") in rows
    assert not {r for r in rows if r[0].startswith("Adjusted EBITDA (")}


def retained_snapshot(snapshot, built, entry):
    annual = built.handoff_text["CP-1"].encode()
    current = b"SYNTHETIC CP-2 current synthesis\n"
    calculation = {
        "schema_version": "retained-handoff-model/1",
        "annual_periods": ["FY2024"],
        "inputs": {
            "annual": {"path": "annual.md", "sha256": cs.sha256(annual)},
            "current_synthesis": {"path": "current_synthesis.md", "sha256": cs.sha256(current)},
        },
        "values": {"FY2024": {"opening_debt": entry}},
    }
    files = {
        "calculation.json": json.dumps(calculation).encode(),
        "annual.md": annual,
        "current_synthesis.md": current,
    }
    return replace(
        snapshot,
        handoff_sha256={**snapshot.handoff_sha256, "CP-2": cs.sha256(current)},
        model_files=files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{name}": cs.sha256(raw) for name, raw in files.items()},
        },
    )


def test_retained_model_thousands_amount_is_written_with_the_unit_it_states(full):
    built, snapshot = full
    entry = {"amount": "4500", "unit": "THOUSANDS", "currency": "USD", "scale": "1000"}
    rows = model_rows(retained_snapshot(snapshot, built, {**entry, "reason": None}))
    assert ("Opening debt", "FY2024", "4500") in rows
    assert ("Opening debt", "Unit", "USD thousands") in rows


def test_retained_model_amount_with_no_stated_unit_is_a_gap_and_not_a_bare_figure(full):
    built, snapshot = full
    entry = {"amount": "4500", "unit": "WIDGETS", "currency": "USD", "scale": "1", "reason": None}
    cells = writer._model_output_cells(retained_snapshot(snapshot, built, entry))
    opening = [c for c in cells if c.row == "Opening debt" and c.column == "FY2024"]
    assert [(c.kind, c.text) for c in opening] == [(snap.GAP, "n.a.")]
    assert "unit" in (opening[0].written or "")
    assert "4500" not in {c.text for c in cells}


PERIOD_REGISTER = (
    b"\n### T4.14 Model Period Register\n\n"
    b"| period_id | fiscal_year | fiscal_quarter | period_type | start_date | end_date | "
    b"currency | unit |\n"
    b"| --- | --- | --- | --- | --- | --- | --- | --- |\n"
    b"| fy24 | 2024 |  | FY | 2023-10-01 | 2024-09-30 | USD |  |\n\n"
)


def test_period_register_currency_without_unit_is_kept_as_the_unit_cell(full):
    _, snapshot = full
    addition = PERIOD_REGISTER + (
        b"### T4.17 Adjusted EBITDA Bridge\n\n"
        b"| addback_id | addback_label | addback_classification | realization_status | "
        b"display_priority | period_id | value | status | source_definition | "
        b"source_id | source_locator |\n"
        b"| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
        b"| ab-1 | Restructuring | addback | insufficient information | 1 | fy24 | 20 | "
        b"reported | Plant close costs | src | p.2 |\n"
    )
    blocks = writer._model_handoff_blocks(with_cp1_addition(snapshot, addition))
    rows = triples(blocks[writer.MODEL, writer.ADJUSTMENTS].cells)
    assert ("Restructuring", "FY2024", "20") in rows
    assert ("Restructuring", "Unit", "USD") in rows


def test_long_form_operating_kpi_register_is_an_explicit_gap_naming_the_table(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"].decode()
    raw = raw.replace("T4.10", "T4.10 (replaced)")
    addition = (
        b"\n### T4.10 Operating KPIs\n\n"
        b"| Metric Name | PeriodID | Value |\n| --- | --- | --- |\n| Subscribers | fy24 | 12 |\n"
    )
    changed = with_cp1_addition(replace(snapshot, model_handoffs={"CP-1": raw.encode()}), addition)
    block = writer._model_handoff_blocks(changed)[writer.MODEL, writer.OPERATING_KPIS]
    assert [(c.kind, c.row) for c in block.cells] == [(snap.GAP, "Gap")]
    assert writer.OPERATING_KPIS in block.cells[0].text
    assert "PeriodID" in (block.cells[0].written or "")


def test_segment_register_missing_a_required_field_is_an_explicit_gap(full):
    _, snapshot = full
    addition = PERIOD_REGISTER + (
        b"### T4.16 Segment Revenue Schedule\n\n"
        b"| segment_id | period_id | turnover |\n| --- | --- | --- |\n| pc | fy24 | 3941 |\n"
    )
    blocks = writer._model_handoff_blocks(with_cp1_addition(snapshot, addition))
    block = blocks[writer.MODEL, writer.SEGMENTS]
    assert [(c.kind, c.row) for c in block.cells] == [(snap.GAP, "Gap")]
    assert "segmentname" in (block.cells[0].written or "")


def test_unreadable_debt_facility_table_is_logged_and_becomes_a_gap(full, caplog):
    _, snapshot = full
    table = (
        b"\n### T4.18 Debt Facilities\n\n"
        b"| Facility | Amount |\n| --- | --- |\n| Term loan | 100 |\n"
    )
    changed = with_cp1_addition(snapshot, table)  # the case already has one T4.18 register
    with caplog.at_level("WARNING"):
        blocks = writer._model_handoff_blocks(changed)
    block = blocks[writer.MODEL, writer.DEBT_FACILITIES]
    assert [(c.kind, c.row) for c in block.cells] == [(snap.GAP, "Gap")]
    assert "T4.18" in caplog.text


def test_unreadable_segment_schedule_is_logged_and_becomes_a_gap(full, caplog):
    _, snapshot = full
    section = b"\n## Segment schedule\n\n| Business Unit | FY2025 |\n| --- | --- |\n| A | 1 |\n"
    changed = with_cp1_addition(snapshot, section + section)
    with caplog.at_level("WARNING"):
        blocks = writer._model_handoff_blocks(changed)
    cells = blocks[writer.MODEL, writer.SEGMENTS].cells
    assert [c.kind for c in cells if "Segment schedule" in c.text] == [snap.GAP]
    assert "Segment schedule" in caplog.text


def test_absent_debt_facility_table_is_not_reported_as_a_gap(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    assert (writer.MODEL, writer.DEBT_FACILITIES) in writer._model_handoff_blocks(snapshot)
    changed = replace(snapshot, model_handoffs={"CP-1": raw.replace(b"T4.18", b"T4.99")})
    assert (writer.MODEL, writer.DEBT_FACILITIES) not in writer._model_handoff_blocks(changed)


@pytest.mark.parametrize("unit", [["MILLIONS"], {"a": 1}])
def test_retained_model_amount_with_a_non_text_unit_is_a_gap_and_does_not_crash(full, unit):
    built, snapshot = full
    entry = {"amount": "4500", "unit": unit, "currency": "USD", "scale": "1", "reason": None}
    cells = writer._model_output_cells(retained_snapshot(snapshot, built, entry))
    opening = [c for c in cells if c.row == "Opening debt" and c.column == "FY2024"]
    assert [(c.kind, c.text) for c in opening] == [(snap.GAP, "n.a.")]


def test_retained_model_percent_level_is_not_rescaled_or_called_points(full):
    built, snapshot = full
    entry = {"amount": "25", "unit": "PERCENT", "currency": None, "scale": "1", "reason": None}
    cells = writer._model_output_cells(retained_snapshot(snapshot, built, entry))
    amount = [c for c in cells if c.row == "Opening debt" and c.column == "FY2024"]
    unit = [c for c in cells if c.row == "Opening debt" and c.column == "Unit"]
    assert [(c.kind, c.text, c.number_format) for c in amount] == [(snap.COPIED, "25", None)]
    assert "percent" in unit[0].text
    assert "points" not in unit[0].text


def gap_cells(cells):
    return [c for c in cells if c.kind == snap.GAP]


def test_oversize_debt_facility_table_is_logged_and_becomes_a_gap(full, caplog):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"].replace(b"T4.18", b"T4.99")
    rows = b"".join(b"| Loan %d | 1 |\n" % n for n in range(501))
    table = b"\n### T4.18 Debt Facilities\n\n| Instrument | Amount |\n| --- | --- |\n" + rows
    changed = with_cp1_addition(replace(snapshot, model_handoffs={"CP-1": raw}), table)
    with caplog.at_level("WARNING"):
        block = writer._model_handoff_blocks(changed)[writer.MODEL, writer.DEBT_FACILITIES]
    assert [(c.kind, c.row) for c in block.cells] == [(snap.GAP, "Gap")]
    assert "safe row or column limit" in (block.cells[0].written or "")
    assert "Debt facilities" in caplog.text or writer.DEBT_FACILITIES in caplog.text


def test_dated_debt_table_without_a_name_column_is_a_gap_naming_the_reason(full, caplog):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"].replace(b"T4.18", b"T4.99")
    table = (
        b"\n### T4.18 Debt Facilities\n\n| period_id | carrying_value |\n| --- | --- |\n"
        b"| fy24 | 100 |\n"
    )
    changed = with_cp1_addition(replace(snapshot, model_handoffs={"CP-1": raw}), PERIOD_REGISTER)
    changed = with_cp1_addition(changed, table)
    with caplog.at_level("WARNING"):
        block = writer._model_handoff_blocks(changed)[writer.MODEL, writer.DEBT_FACILITIES]
    assert [(c.kind, c.row) for c in block.cells] == [(snap.GAP, "Gap")]
    assert "name" in (block.cells[0].written or "")
    assert caplog.text


def test_segment_schedule_without_a_period_column_is_a_logged_gap(full, caplog):
    _, snapshot = full
    section = b"\n## Segment schedule\n\n| Business Unit | Notes |\n| --- | --- |\n| A | x |\n"
    with caplog.at_level("WARNING"):
        blocks = writer._model_handoff_blocks(with_cp1_addition(snapshot, section))
    cells = blocks[writer.MODEL, writer.SEGMENTS].cells
    gaps = [c for c in cells if c.kind == snap.GAP and "no explicit period" in (c.written or "")]
    assert len(gaps) == 1
    assert "no explicit period" in caplog.text


def test_oversize_segment_schedule_is_a_logged_gap(full, caplog):
    _, snapshot = full
    rows = b"".join(b"| S%d | 1 |\n" % n for n in range(501))
    section = b"\n## Segment schedule\n\n| Business Unit | Period |\n| --- | --- |\n" + rows
    with caplog.at_level("WARNING"):
        blocks = writer._model_handoff_blocks(with_cp1_addition(snapshot, section))
    cells = blocks[writer.MODEL, writer.SEGMENTS].cells
    assert any("safe row or column limit" in (c.written or "") for c in gap_cells(cells))
    assert "safe row or column limit" in caplog.text


def test_unreadable_source_financial_table_is_logged_and_a_gap_and_absent_one_is_silent(
    full, caplog
):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    assert b"T4.4" in raw
    duplicated = with_cp1_addition(snapshot, b"\n### T4.4 Again\n\n| a |\n| --- |\n| 1 |\n")
    with caplog.at_level("WARNING"):
        cells = writer._model_source_financials(duplicated)
    gaps = gap_cells(cells)
    assert any("T4.4" in (c.row + (c.written or "")) for c in gaps)
    assert "T4.4" in caplog.text
    caplog.clear()
    absent = replace(
        snapshot,
        model_handoffs={"CP-1": raw.replace(b"T4.4", b"T4.94").replace(b"T4.9", b"T4.98")},
    )
    with caplog.at_level("WARNING"):
        writer._model_source_financials(absent)
    assert "T4.4" not in caplog.text


def test_unreadable_calculation_register_is_a_gap(full, caplog):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"].replace(b"T4.9", b"T4.98")
    table = b"\n### T4.9 Calculations\n\n| Metric Name | Notes |\n| --- | --- |\n| x | y |\n"
    changed = with_cp1_addition(replace(snapshot, model_handoffs={"CP-1": raw}), table)
    with caplog.at_level("WARNING"):
        cells = writer._model_source_financials(changed)
    assert any("T4.9" in (c.row + (c.written or "")) for c in gap_cells(cells))
    assert "T4.9" in caplog.text


def no_unit_snapshot(snapshot):
    text = snapshot.model_handoffs["CP-1"].decode()
    request = text.replace("USD millions", "millions")
    changed = replace(
        snapshot,
        model_handoffs={"CP-1": request.encode()},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(request.encode())},
    )
    return forecast_snapshot(changed, 5)


def test_forecast_money_with_no_stated_unit_is_a_logged_gap_and_not_a_bare_figure(full, caplog):
    _, snapshot = full
    snapshot = no_unit_snapshot(snapshot)
    with caplog.at_level("WARNING"):
        cells = writer._model_output_cells(snapshot)
    ebitda = [c for c in cells if c.row == "Adjusted EBITDA" and c.column == "Base FY2026"]
    assert [(c.kind, c.text) for c in ebitda] == [(snap.GAP, "n.a.")]
    assert "unit" in (ebitda[0].written or "")
    assert "400" not in {c.text for c in cells}
    assert "states no unit" in caplog.text
