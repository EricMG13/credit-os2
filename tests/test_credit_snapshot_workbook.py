"""The Credit Snapshot workbook writer: layout and presentation facts the fidelity test does not
cover (`tests/test_credit_snapshot_fidelity.py` holds the content against the answer key).

SYNTHETIC: the runs are the key's invented "Northbridge" cases (`tests/credit_snapshot_case.py`).
"""

from __future__ import annotations

import hashlib
import io
import json
import re
from dataclasses import replace
from pathlib import Path

import credit_snapshot_case as cs
import pytest
from openpyxl import load_workbook
from openpyxl.worksheet.cell_range import CellRange

from deploy_workflow import credit_snapshot as snap
from deploy_workflow import credit_snapshot_workbook as writer
from deploy_workflow.cp2_scorecard import FACTORS, level_text

THREE = ("Snapshot", "Model", "Inputs", "Matrix")


@pytest.fixture(scope="module")
def full(tmp_path_factory):
    built = cs.build_case(tmp_path_factory.mktemp("full"), cs.CASES["full"])
    return built, snap.gather(snap.load_run(built.folder, built.stores.both()))


@pytest.fixture(scope="module")
def book(full):
    return load_workbook(io.BytesIO(writer.workbook_bytes(full[1])))


def sources(book) -> list[dict]:
    sheet = book["Sources"]
    header = [c.value for c in sheet[1]]
    return [
        dict(zip(header, (c.value for c in row), strict=True))
        for row in sheet.iter_rows(min_row=2)
        if any(c.value is not None for c in row)
    ]


def listed(book, block, **where) -> list[dict]:
    """Sources rows of `block` (on Snapshot unless `sheet=` says), narrowed by any of the keyword
    names `row`, `column`, `kind`."""
    want = {"Sheet": where.pop("sheet", "Snapshot"), "Block": block}
    want |= {key.title(): value for key, value in where.items()}
    return [r for r in sources(book) if all(r[k] == v for k, v in want.items())]


def cell_of(book, **where):
    (row,) = listed(book, **where)
    return book[row["Sheet"]][row["Cell"]]


def assert_facility_assumptions(book):
    rate = cell_of(
        book,
        block="Assumptions",
        row="Synthetic revolver interest rate",
        column="Base FY2026",
        sheet="Model",
    )
    assert rate.value == 0.065 and rate.number_format == "0.00%"
    for year, value in ((2026, -0.005), (2027, 0.03), (2028, 0.02)):
        cell = cell_of(
            book,
            block="Assumptions",
            row="Synthetic revolver reference rate",
            column=f"Base FY{year}",
            sheet="Model",
        )
        assert cell.value == value and cell.number_format == "0.00%"
    scheduled = cell_of(
        book,
        block="Assumptions",
        row="Synthetic revolver interest rate",
        column="Base FY2027",
        sheet="Model",
    )
    assert scheduled.value == 0.07


# --- The sheet ------------------------------------------------------------------------------------


def test_snapshot_sheet_is_a_one_page_wide_landscape_page_with_a_frozen_title_band(book):
    sheet = book["Snapshot"]
    assert sheet.sheet_view.showGridLines is False
    assert sheet.freeze_panes == "A3"
    assert sheet.page_setup.orientation == "landscape"
    assert (sheet.page_setup.fitToWidth, sheet.page_setup.fitToHeight) == (1, 0)
    assert sheet.sheet_properties.pageSetUpPr.fitToPage is True
    assert sheet.print_title_rows == "$1:$2"


def test_the_sheets_in_order(book):
    assert book.sheetnames == ["Snapshot", "Model", "Inputs", "Matrix", "Sources"]


def test_synthetic_snapshot_financials_reference_the_model_values(book):
    snapshot_cell = cell_of(book, block="Financials", row="Revenue", column="FY2025")
    model_rows = listed(book, "Financials", sheet="Model", row="Revenue", column="FY2025")
    assert len(model_rows) == 1
    model_cell = book["Model"][model_rows[0]["Cell"]]
    assert model_cell.value == 1234.5
    assert snapshot_cell.data_type == "f"
    assert snapshot_cell.value == f"=Model!${model_cell.column_letter}${model_cell.row}"


def test_synthetic_zero_is_a_number_and_a_missing_dash_stays_text(book):
    zero = cell_of(
        book, block="Financials", row="FX Effect on Cash", column="FY2025", sheet="Model"
    )
    dash = cell_of(book, block="Financials", row="Gross profit", column="FY2024", sheet="Model")
    zero_view = cell_of(book, block="Financials", row="FX Effect on Cash", column="FY2025")
    assert zero.value == 0 and zero.data_type == "n"
    assert zero_view.data_type == "f" and "Model!" in zero_view.value
    assert dash.value == "–" and dash.data_type == "s"


def test_synthetic_add_back_amount_is_shown_with_a_linkage_gap(full):
    _, snapshot = full
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    amount = cell_of(
        book, block="EBITDA bridge", row="Restructuring costs", column="Bridge", sheet="Model"
    )
    status = cell_of(
        book,
        block="EBITDA bridge",
        row="Restructuring costs",
        column="Add-back status",
        sheet="Model",
    )
    assert amount.value == 20 and status.value == snap.NEEDS_ADD_BACK_IDS
    assert status.font.italic and status.data_type == "s"


def test_synthetic_add_back_ids_drive_snapshot_and_model_classification_and_totals():
    cp1 = b"""### Chart data: EBITDA bridge

| Step | Amount | Add-Back ID | Reporting unit | Basis and limitation |
|---|---:|---|---|---|
| Reported EBITDA | 100 | Not applicable | USD millions | Opening EBITDA. |
| Other label one | 20 | AB-1 | USD millions | Signed adjustment. |
| Different description | 30 | AB-2 | USD millions | Signed adjustment. |
| Negative adjustment | -5 | AB-3 | USD millions | Signed adjustment. |
| EBITDA As Defined | 145 | Not applicable | USD millions | Closing EBITDA. |
"""
    cp1d = b"""### T1D.1 Add-Back Register

| Add-Back ID | Description | Amount | Reporting unit |
|---|---|---:|---|
| AB-1 | Description does not match bridge | 20 | USD millions |
| AB-2 | Another CP-1D description | 30 | USD millions |
| AB-3 | Negative claimed adjustment | -5 | USD millions |

### T1D.2 Achievability Assessment

| Add-Back ID | Run-Rate Claimed | Realized To Date | Assessment | Reporting unit |
|---|---:|---:|---|---|
| AB-1 | 20 | 20 | Supported | USD millions |
| AB-2 | 30 | 10 | Challenged | USD millions |
| AB-3 | -5 | -2 | Challenged | USD millions |
"""
    snapshot = snap.gather(
        snap.SnapshotRun(
            issuer="Northbridge Holdings plc",
            as_of="2026-03-31",
            pathway="credit_snapshot",
            run_id="northbridge-2026-03-31-credit_snapshot",
            handoffs={"CP-1": cp1, "CP-1D": cp1d},
            context=None,
            references=(),
        )
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    for sheet, column in (("Snapshot", "Classification"), ("Model", "Add-back status")):
        assert (
            cell_of(
                book, block="EBITDA bridge", row="Different description", column=column, sheet=sheet
            ).value
            == "unrealised"
        )
        assert (
            cell_of(
                book, block="EBITDA bridge", row="Negative adjustment", column=column, sheet=sheet
            ).value
            == "realised"
        )
        assert (
            cell_of(
                book, block="EBITDA bridge", row="Reported EBITDA", column=column, sheet=sheet
            ).value
            == "not applicable"
        )
        assert (
            cell_of(
                book,
                block="EBITDA bridge",
                row="Structuring EBITDA",
                column="Value" if sheet == "Snapshot" else "Bridge",
                sheet=sheet,
            ).value
            == 145
        )
        assert (
            cell_of(
                book,
                block="EBITDA bridge",
                row="House EBITDA",
                column="Value" if sheet == "Snapshot" else "Bridge",
                sheet=sheet,
            ).value
            == 115
        )
        assert (
            cell_of(
                book,
                block="EBITDA bridge",
                row="Less unrealised add-backs",
                column="Value" if sheet == "Snapshot" else "Bridge",
                sheet=sheet,
            ).value
            == -30
        )
        assert (
            cell_of(
                book,
                block="EBITDA bridge",
                row="Negative adjustment",
                column=column,
                sheet=sheet,
            ).value
            == "realised"
        )
    source = listed(
        book,
        "EBITDA bridge",
        sheet="Snapshot",
        row="Different description",
        column="Classification",
    )[0]
    assert source["Module"] == "CP-1D"


def test_tagged_period_addback_uses_cached_cp1d_id_map_without_chart_table():
    cp1 = b"""### T4.14 Period Register

| Period ID | Fiscal Year | Period Type | Start Date | End Date | Unit |
|---|---:|---|---|---|---|
| fy26 | 2026 | FY | 2026-01-01 | 2026-12-31 | USD millions |

### EBITDA Adjustments
<!-- table-id: T4.17 -->

| Add-back label | Add-Back ID | Period ID | Value | Basis |
|---|---|---|---:|---|
| Special item | AB-7 | fy26 | 12 | filed |
"""
    cp1d = b"""### T1D.1 Add-Back Register

| Add-Back ID | Description | Amount | Reporting unit |
|---|---|---:|---|
| **AB-7** | Different description | 12 | USD millions |

### T1D.2 Achievability Assessment

| Add-Back ID | Run-Rate Claimed | Realized To Date | Assessment | Reporting unit |
|---|---:|---:|---|---|
| `AB-7` | 12 | 12 | Supported | USD millions |
"""
    snapshot = snap.gather(
        snap.SnapshotRun(
            issuer="Northbridge Holdings plc",
            as_of="2026-03-31",
            pathway="credit_snapshot",
            run_id="northbridge-2026-03-31-credit_snapshot",
            handoffs={"CP-1": cp1, "CP-1D": cp1d},
            context=None,
            references=(),
        )
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    status = cell_of(
        book,
        block="EBITDA adjustments",
        row="Special item",
        column="FY2026 linked realization",
        sheet="Model",
    )
    assert status.value == "realised"
    source = listed(
        book,
        "EBITDA adjustments",
        sheet="Model",
        row="Special item",
        column="FY2026 linked realization",
    )[0]
    assert (source["Module"], source["Section"]) == ("CP-1D", "T1D.2 Achievability Assessment")


def test_synthetic_pinned_model_json_is_copied_as_history_and_forecast_values(full):
    _, snapshot = full
    forecast = {
        "schema_version": "cpos-forecast-exact/1",
        "consumed": {"CP-1.md": snapshot.handoff_sha256["CP-1"]},
        "units": "GBP millions",
        "scale": "1000000",
        "outputs": {
            "REFERENCE": {
                "years": [
                    {
                        "year": 2026,
                        "planning_start": "2026-01-01",
                        "planning_end": "2026-12-31",
                        "revenue": {"amount": "1300", "reason": None},
                        "ebitda": {"amount": "400", "reason": None},
                        "coverage": {"amount": "2.5", "reason": None},
                        "fcf_to_debt": {"amount": "0.49", "reason": None},
                        "cfo": {"amount": None, "reason": "cash gap"},
                    },
                    {"year": 2027, "revenue": {"amount": "1400", "reason": None}},
                    {"year": 2028, "revenue": {"amount": "1500", "reason": None}},
                ]
            },
            "DOWNSIDE": {
                "years": [
                    {"year": 2026, "revenue": {"amount": "1200", "reason": None}},
                    {"year": 2027, "revenue": {"amount": "1250", "reason": None}},
                    {"year": 2028, "revenue": {"amount": "1300", "reason": None}},
                ]
            },
        },
    }
    forecast_bytes = json.dumps(forecast).encode()
    calculation = {
        "schema_version": "cpos-model/1",
        "forecast_exact_file": "forecast_exact.json",
        "forecast_exact_sha256": hashlib.sha256(forecast_bytes).hexdigest(),
        "history": {
            "schema_version": "cpos-history/1",
            "columns": [
                {
                    "id": "LTM",
                    "kind": "LTM",
                    "label": "LTM 2025",
                    "values": {
                        "revenue": {"amount": "1190.25", "reason": None},
                        "interest": {"amount": None, "reason": "not stated"},
                    },
                }
            ],
        },
    }
    forecast["reference_drivers"] = {
        "revenue_growth": {
            "values": ["0.05", "0.04", "0.03"],
            "category": "contractual",
            "rationale": "Synthetic driver",
            "limitation": None,
        }
    }
    forecast["downside_drivers"] = {
        "revenue_growth": {
            "values": ["0.01", "0.01", "0.01"],
            "category": "contractual",
            "rationale": "Synthetic downside driver",
            "limitation": None,
        }
    }
    forecast["downside_basis"] = "downside_drivers"
    forecast["downside_shock"] = {"ebitda_decline": "0.10", "rate_increase": "0.02"}
    forecast["facilities"] = [
        {
            "name": "Synthetic revolver",
            "reference_rate": ["-0.005", "0.03", "0.02"],
            "years": [{"year": 2026, "rate": "0.065"}],
        }
    ]
    forecast["facility_schedule"] = [
        {"name": "Synthetic revolver", "years": [{"year": 2027, "rate": "0.07"}]}
    ]
    forecast_bytes = json.dumps(forecast).encode()
    calculation["forecast_exact_sha256"] = hashlib.sha256(forecast_bytes).hexdigest()
    model_files = {
        "calculation.json": json.dumps(calculation).encode(),
        "forecast_exact.json": forecast_bytes,
    }
    book = load_workbook(
        io.BytesIO(
            writer.workbook_bytes(
                replace(
                    snapshot,
                    model_files=model_files,
                    source_sha256={
                        **snapshot.source_sha256,
                        **{f"model:{name}": cs.sha256(raw) for name, raw in model_files.items()},
                    },
                )
            )
        )
    )
    hist = cell_of(book, block="Financials", row="Revenue", column="LTM 2025", sheet="Model")
    base = cell_of(book, block="Financials", row="Revenue", column="Base FY2026", sheet="Model")
    downside = cell_of(
        book, block="Financials", row="Revenue", column="Downside FY2026", sheet="Model"
    )
    assert hist.value == 1190.25 and base.value == 1300 and downside.value == 1200
    assert (
        cell_of(book, block="Financials", row="Revenue", column="Unit", sheet="Model").value
        == "GBP millions"
    )
    cover_unit = cell_of(
        book,
        block="Financials",
        row="Interest coverage (EBITDA / interest)",
        column="Unit",
        sheet="Model",
    )
    cash_proxy = cell_of(
        book, block="Financials", row="Cash proxy / debt", column="Base FY2026", sheet="Model"
    )
    cash_proxy_unit = cell_of(
        book, block="Financials", row="Cash proxy / debt", column="Unit", sheet="Model"
    )
    forecast_gap = cell_of(
        book,
        block="Financials",
        row="Model cash from operations",
        column="Base FY2026",
        sheet="Model",
    )
    assert cover_unit.value == "multiple"
    assert cash_proxy.value == 0.49 and cash_proxy.number_format == "0.00%"
    assert cash_proxy_unit.value == "percent"
    assert forecast_gap.value == "n.a." and forecast_gap.data_type == "s"
    gap_source = listed(
        book,
        "Financials",
        sheet="Model",
        row="Model cash from operations",
        column="Base FY2026",
        kind="gap",
    )[0]
    assert gap_source["Kind"] == "gap"
    reason = listed(
        book, "Financials", sheet="Sources", row="Model cash from operations", column="Reason"
    )[0]
    assert reason["Handoff text"] == "cash gap"
    assert reason["Handoff sha256"] == cs.sha256(model_files["forecast_exact.json"])
    assumption = cell_of(
        book, block="Assumptions", row="Revenue growth", column="Base FY2026", sheet="Model"
    )
    assert assumption.value == 0.05 and assumption.data_type == "n"
    assert assumption.number_format == "0.00%"
    assert_facility_assumptions(book)
    assert (
        cell_of(
            book, block="Financials", row="Period dates", column="Base FY2026", sheet="Model"
        ).value
        == "2026-01-01 to 2026-12-31"
    )
    downside_assumption = cell_of(
        book, block="Assumptions", row="Revenue growth", column="Downside FY2026", sheet="Model"
    )
    shock = cell_of(
        book,
        block="Assumptions",
        row="Downside EBITDA decline",
        column="Downside shock",
        sheet="Model",
    )
    assert downside_assumption.value == 0.01 and shock.value == 0.10
    interest_gap = cell_of(
        book, block="Financials", row="Interest", column="LTM 2025", sheet="Model"
    )
    assert interest_gap.value == "n.a."
    assert (
        listed(
            book,
            "Financials",
            sheet="Sources",
            row="Interest",
            column="Reason",
        )[0]["Handoff text"]
        == "not stated"
    )
    forecast_source = listed(
        book,
        "Financials",
        row="Adjusted EBITDA",
        column="Base FY2026",
        sheet="Model",
        kind="copied",
    )[0]
    assert forecast_source["Module"] == "Model output"
    assert forecast_source["Handoff sha256"] == cs.sha256(model_files["forecast_exact.json"])


def test_synthetic_unbound_forecast_json_is_not_drawn(full):
    _, snapshot = full
    model_files = {
        "calculation.json": json.dumps(
            {
                "schema_version": "cpos-model/1",
                "forecast_exact_file": "forecast_exact.json",
                "forecast_exact_sha256": "0" * 64,
            }
        ).encode(),
        "forecast_exact.json": json.dumps(
            {
                "schema_version": "cpos-forecast-exact/1",
                "consumed": {"CP-1.md": snapshot.handoff_sha256["CP-1"]},
                "outputs": {
                    "REFERENCE": {
                        "years": [{"year": 2026, "revenue": {"amount": "1300", "reason": None}}]
                    }
                },
            }
        ).encode(),
    }
    book = load_workbook(
        io.BytesIO(writer.workbook_bytes(replace(snapshot, model_files=model_files)))
    )
    assert not listed(book, "Financials", row="Revenue", column="Base FY2026", sheet="Model")


def test_synthetic_bound_forecast_with_foreign_handoff_pin_is_rejected(full):
    _, snapshot = full
    forecast = {
        "schema_version": "cpos-forecast-exact/1",
        "consumed": {"CP-1.md": "f" * 64},
        "outputs": {
            "REFERENCE": {"years": [{"year": 2026, "revenue": {"amount": "9999", "reason": None}}]}
        },
    }
    forecast_bytes = json.dumps(forecast).encode()
    calculation = {
        "schema_version": "cpos-model/1",
        "forecast_exact_file": "forecast_exact.json",
        "forecast_exact_sha256": hashlib.sha256(forecast_bytes).hexdigest(),
    }
    model_files = {
        "calculation.json": json.dumps(calculation).encode(),
        "forecast_exact.json": forecast_bytes,
    }
    snapshot = replace(
        snapshot,
        model_files=model_files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{name}": cs.sha256(raw) for name, raw in model_files.items()},
        },
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    assert not listed(book, "Financials", row="Revenue", column="Base FY2026", sheet="Model")


def test_synthetic_bound_forecast_requires_cp1_consumed_pin(full):
    _, snapshot = full
    forecast = {
        "schema_version": "cpos-forecast-exact/1",
        "consumed": {"CP-1A.md": snapshot.handoff_sha256["CP-1A"]},
        "outputs": {
            "REFERENCE": {"years": [{"year": 2026, "revenue": {"amount": "9999", "reason": None}}]}
        },
    }
    forecast_bytes = json.dumps(forecast).encode()
    calculation = {
        "schema_version": "cpos-model/1",
        "forecast_exact_file": "forecast_exact.json",
        "forecast_exact_sha256": hashlib.sha256(forecast_bytes).hexdigest(),
    }
    files = {
        "calculation.json": json.dumps(calculation).encode(),
        "forecast_exact.json": forecast_bytes,
    }
    snapshot = replace(
        snapshot,
        model_files=files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{k}": cs.sha256(v) for k, v in files.items()},
        },
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    assert not listed(book, "Financials", row="Revenue", column="Base FY2026", sheet="Model")


def test_synthetic_unbound_modern_history_does_not_guess_the_scaled_unit(full):
    _, snapshot = full
    forecast = {
        "schema_version": "cpos-forecast-exact/1",
        "consumed": {"CP-1.md": "0" * 64},
        "units": "GBP millions",
        "scale": "1000000",
        "outputs": {"REFERENCE": {"years": []}},
    }
    forecast_bytes = json.dumps(forecast).encode()
    calculation = {
        "schema_version": "cpos-model/1",
        "forecast_exact_file": "forecast_exact.json",
        "forecast_exact_sha256": hashlib.sha256(forecast_bytes).hexdigest(),
        "history": {
            "schema_version": "cpos-history/1",
            "columns": [
                {
                    "label": "FY2025",
                    "values": {"revenue": {"amount": "1234", "reason": None}},
                }
            ],
        },
    }
    files = {
        "calculation.json": json.dumps(calculation).encode(),
        "forecast_exact.json": forecast_bytes,
    }
    changed = replace(
        snapshot,
        model_files=files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{name}": cs.sha256(raw) for name, raw in files.items()},
        },
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(changed)))
    model_revenue = cell_of(book, block="Financials", row="Revenue", column="FY2025", sheet="Model")
    assert model_revenue.value != 1234
    assert (
        listed(
            book,
            "Financials",
            sheet="Model",
            row="Revenue",
            column="FY2025",
        )[0]["Handoff sha256"]
        == snapshot.handoff_sha256["CP-1"]
    )


def test_synthetic_retained_model_schema_uses_its_own_values_units_and_input_pins(full):
    built, snapshot = full
    forecast_bytes = b'{"schema_version":"cpos-forecast-exact/1"}\n'
    annual = built.handoff_text["CP-1"].encode()
    current = b"SYNTHETIC CP-2 current synthesis\n"
    snapshot = replace(
        snapshot,
        handoff_sha256={**snapshot.handoff_sha256, "CP-2": cs.sha256(current)},
    )
    calculation = {
        "schema_version": "retained-handoff-model/1",
        "annual_periods": ["FY2024"],
        "inputs": {
            "annual": {"path": "annual.md", "sha256": cs.sha256(annual)},
            "current_synthesis": {
                "path": "current_synthesis.md",
                "sha256": cs.sha256(current),
            },
            "forecast": {"path": "forecast.md", "sha256": cs.sha256(b"synthetic forecast\n")},
            "forecast_exact": {"path": "forecast_exact.json", "sha256": cs.sha256(forecast_bytes)},
        },
        "values": {
            "FY2024": {
                "opening_debt": {
                    "amount": "789.25",
                    "unit": "MILLIONS",
                    "currency": "USD",
                    "scale": "1000000",
                    "reason": None,
                },
                "cfo": {
                    "amount": None,
                    "unit": "MILLIONS",
                    "currency": "USD",
                    "scale": "1000000",
                    "reason": "WINDOW_MISSING",
                },
            }
        },
        "quarters": {
            "Q4 FY2024": {
                "interest": {
                    "amount": "42.5",
                    "unit": "MILLIONS",
                    "currency": "USD",
                    "scale": "1000000",
                    "reason": None,
                }
            }
        },
    }
    model_files = {
        "calculation.json": json.dumps(calculation).encode(),
        "forecast_exact.json": forecast_bytes,
        "forecast.md": b"synthetic forecast\n",
        "annual.md": annual,
        "current_synthesis.md": current,
    }
    snapshot = replace(
        snapshot,
        model_files=model_files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{name}": cs.sha256(raw) for name, raw in model_files.items()},
        },
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    opening_debt = cell_of(
        book, block="Financials", row="Opening debt", column="FY2024", sheet="Model"
    )
    assert opening_debt.value == 789.25 and opening_debt.data_type == "n"
    assert (
        cell_of(book, block="Financials", row="Opening debt", column="Unit", sheet="Model").value
        == "USD millions"
    )
    missing = cell_of(
        book, block="Financials", row="Model cash from operations", column="FY2024", sheet="Model"
    )
    assert missing.value == "n.a." and missing.data_type == "s"
    quarter = cell_of(book, block="Financials", row="Interest", column="Q4 FY2024", sheet="Model")
    assert quarter.value == 42.5 and quarter.data_type == "n"
    source = listed(book, "Financials", sheet="Model", row="Opening debt", column="FY2024")[0]
    assert source["Handoff sha256"] == cs.sha256(model_files["calculation.json"])


def test_synthetic_model_keeps_historical_and_forecast_units_separate(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    old = b"| Revenue | 1,234.5 | 1,180.0 | GBP millions | Reported |"
    changed = raw.replace(old, old.replace(b"GBP millions", b"GBP thousands"))
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": changed},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(changed)},
    )
    forecast = {
        "schema_version": "cpos-forecast-exact/1",
        "consumed": {"CP-1.md": snapshot.handoff_sha256["CP-1"]},
        "units": "GBP millions",
        "scale": "1000000",
        "outputs": {
            "REFERENCE": {"years": [{"year": 2026, "revenue": {"amount": "1.3", "reason": None}}]}
        },
    }
    forecast_bytes = json.dumps(forecast).encode()
    files = {
        "calculation.json": json.dumps(
            {
                "schema_version": "cpos-model/1",
                "forecast_exact_file": "forecast_exact.json",
                "forecast_exact_sha256": hashlib.sha256(forecast_bytes).hexdigest(),
            }
        ).encode(),
        "forecast_exact.json": forecast_bytes,
    }
    blocks = tuple(
        replace(
            block,
            cells=tuple(
                replace(cell, text="GBP thousands")
                if cell.sheet == "Snapshot"
                and block.name == "Financials"
                and cell.row == "Revenue"
                and cell.column == "Unit"
                else cell
                for cell in block.cells
            ),
        )
        for block in snapshot.blocks
    )
    snapshot = replace(
        snapshot,
        blocks=blocks,
        model_files=files,
        source_sha256={
            **snapshot.source_sha256,
            **{f"model:{k}": cs.sha256(v) for k, v in files.items()},
        },
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    historical = cell_of(book, block="Financials", row="Revenue", column="FY2025", sheet="Model")
    forecasted = cell_of(
        book, block="Financials", row="Revenue (GBP millions)", column="Base FY2026", sheet="Model"
    )
    assert (historical.value, forecasted.value) == (1234.5, 1.3)
    assert (
        cell_of(book, block="Financials", row="Revenue", column="Unit", sheet="Model").value
        == "GBP thousands"
    )
    assert (
        cell_of(
            book, block="Financials", row="Revenue (GBP millions)", column="Unit", sheet="Model"
        ).value
        == "GBP millions"
    )
    forecast_unit_source = listed(
        book,
        "Financials",
        sheet="Model",
        row="Revenue (GBP millions)",
        column="Unit",
    )[0]
    assert forecast_unit_source["Handoff sha256"] == cs.sha256(forecast_bytes)


def test_synthetic_model_includes_period_bound_kpis_and_segments(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    addition = (
        b"\n### T4.10 Operating KPIs\n\n"
        b"| KPI | FY2025 | Unit | Basis | Source |\n| --- | --- | --- | --- | --- |\n"
        b"| Orders shipped | 240 | units | Reported | source.pdf p.4 |\n\n"
        b"### T4.16 Segment revenue\n\n"
        b"| Segment | FY2025 | Unit | Basis | Source |\n| --- | --- | --- | --- | --- |\n"
        b"| Components | 510.5 | GBP millions | Reported | source.pdf p.5 |\n"
    )
    changed = raw + addition
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": changed},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(changed)},
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    kpi = cell_of(
        book, block="Operating KPIs", row="Orders shipped", column="FY2025", sheet="Model"
    )
    segment = cell_of(book, block="Segment data", row="Components", column="FY2025", sheet="Model")
    assert (kpi.value, segment.value) == (240, 510.5)
    assert kpi.data_type == segment.data_type == "n"
    debt = cell_of(
        book,
        block="Debt instruments",
        row="Term Loan B",
        column="Maturity",
        sheet="Model",
    )
    assert debt.value == "2031-03-31"
    assert "source.pdf" not in [cell.value for row in book["Model"].iter_rows() for cell in row]


def test_synthetic_model_uses_metric_name_and_long_segment_period_shape(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    addition = (
        b"\n### T4.10 KPI dashboard\n\n"
        b"| KPI Category | Metric Name | FY2024 | Trend Direction | Analyst Note |\n"
        b"| --- | --- | --- | --- | --- |\n"
        b"| Growth | Orders shipped | 240 | Stable | Synthetic |\n\n"
        b"### Segment schedule\n\n"
        b"| Business unit | Period | Net sales | EBITDA As Defined | Unit |\n"
        b"| --- | --- | --- | --- | --- |\n"
        b"| Power & Control | FY2024 | 3941 | 2236 | USD millions |\n"
    )
    changed = raw + addition
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": changed},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(changed)},
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    assert (
        cell_of(
            book, block="Operating KPIs", row="Orders shipped", column="FY2024", sheet="Model"
        ).value
        == 240
    )
    assert (
        cell_of(
            book,
            block="Segment data",
            row="Power & Control · Net sales (USD millions)",
            column="FY2024",
            sheet="Model",
        ).value
        == 3941
    )
    assert (
        cell_of(
            book,
            block="Segment data",
            row="Power & Control · EBITDA As Defined (USD millions)",
            column="FY2024",
            sheet="Model",
        ).value
        == 2236
    )


def test_synthetic_t44_model_source_rows_include_reported_lines_and_bridge_has_separate_unit(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    addition = b"| Cost of sales | 300 | 250 | GBP millions | Reported | Synthetic |\n"
    changed = raw.replace(
        b"\n\n### T4.5 Cash flow statement", b"\n" + addition + b"\n### T4.5 Cash flow statement"
    )
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": changed},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(changed)},
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    # Synthetic T4.4 source rows include metrics outside Snapshot's selected-row subset.
    assert (
        cell_of(
            book, block="Source financials", row="Cost of sales", column="FY2025", sheet="Model"
        ).value
        == 300
    )
    reported = cell_of(
        book, block="Financials", row="EBITDA (Reported)", column="Unit", sheet="Model"
    )
    snapshot_unit = cell_of(book, block="Financials", row="EBITDA (Reported)", column="Unit")
    assert reported.value == "GBP millions"
    assert snapshot_unit.data_type == "f"
    assert snapshot_unit.value == f"=Model!${reported.column_letter}${reported.row}"


def test_real_tdg_2024_cp1_t45_t46_and_t49_lines_are_retained(full):
    _, snapshot = full
    raw = Path("tests/fixtures/live_2026_11_25/CP-1-replay-tdg.md").read_bytes()
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": raw},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(raw)},
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    depreciation = cell_of(
        book, block="Source financials", row="Depreciation", column="FY2024", sheet="Model"
    )
    receivables = cell_of(
        book,
        block="Source financials",
        row="Trade accounts receivable—net",
        column="FY2024",
        sheet="Model",
    )
    cover = cell_of(
        book,
        block="Source financials",
        row="(EBITDA − capex) / cash interest",
        column="FY2024 / 2024-09-30",
        sheet="Model",
    )
    assert (depreciation.value, receivables.value, cover.value) == (149, 1381, 3.15)


def test_synthetic_t416_t417_period_ids_use_t414_and_keep_status_gaps(full):
    _, snapshot = full
    raw = snapshot.model_handoffs["CP-1"]
    addition = (
        b"\n### T4.14 Model Period Register\n\n"
        b"| period_id | fiscal_year | fiscal_quarter | period_type | start_date | end_date | "
        b"currency | unit |\n"
        b"| --- | --- | --- | --- | --- | --- | --- | --- |\n"
        b"| fy24 | 2024 |  | FY | 2023-10-01 | 2024-09-30 | USD | millions |\n\n"
        b"### T4.16 Segment Revenue Schedule\n\n"
        b"| segment_id | segment_name | segment_type | display_priority | period_id | revenue | "
        b"status | source_id | source_locator |\n"
        b"| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
        b"| pc | Power & Control | operating | 1 | fy24 | 3941 | reported | src | p.1 |\n\n"
        b"### T4.17 Adjusted EBITDA Bridge\n\n"
        b"| addback_id | addback_label | addback_classification | realization_status | "
        b"display_priority | period_id | value | status | source_definition | "
        b"source_id | source_locator |\n"
        b"| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
        b"| ab-1 | Restructuring | addback | insufficient information | 1 | fy24 | 20 | "
        b"reported | Plant close costs | src | p.2 |\n"
    )
    changed = raw + addition
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": changed},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(changed)},
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    segment = cell_of(
        book,
        block="Segment data",
        row="Power & Control · Revenue (USD millions)",
        column="FY2024",
        sheet="Model",
    )
    adjustment = cell_of(
        book, block="EBITDA adjustments", row="Restructuring", column="FY2024", sheet="Model"
    )
    realized = cell_of(
        book,
        block="EBITDA adjustments",
        row="Restructuring",
        column="FY2024 linked realization",
        sheet="Model",
    )
    assert (segment.value, adjustment.value) == (3941, 20)
    assert realized.value == snap.UNCLASSIFIED


def test_retained_tdg_bridge_endpoints_keep_their_reported_status(tmp_path):
    case = replace(cs.CASES["full"], handoffs={**cs.CASES["full"].handoffs, "CP-1": cs.TDG_CP1})
    built = cs.build_case(tmp_path, case)
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    for endpoint in ("EBITDA (Reported)", "EBITDA (Adjusted)"):
        assert not listed(
            book,
            "EBITDA bridge",
            sheet="Model",
            row=endpoint,
            column="Add-back status",
            kind="gap",
        )


def test_retained_tdg_kpi_context_stays_on_each_metric_row_as_of_2024_09_30(tmp_path):
    case = replace(cs.CASES["full"], handoffs={**cs.CASES["full"].handoffs, "CP-1": cs.TDG_CP1})
    built = cs.build_case(tmp_path, case)
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    metrics = {
        "EBITDA As Defined margin": ("52.6%", "51.6%"),
        "Power & Control EBITDA As Defined margin": ("56.7%", "56.3%"),
        "Airframe EBITDA As Defined margin": ("51.5%", "50.0%"),
        "Non-aviation EBITDA As Defined margin": ("42.6%", "40.6%"),
    }
    for metric, (fy2024, fy2023) in metrics.items():
        direction = cell_of(
            book,
            block="Operating KPIs",
            row=metric,
            column="Trend Direction",
            sheet="Model",
        )
        assert direction.value == "Higher"
        source = listed(
            book,
            "Operating KPIs",
            sheet="Model",
            row=metric,
            column="Trend Direction",
        )[0]
        assert source["Handoff sha256"] == cs.sha256(cs.TDG_CP1.read_bytes())
        assert (
            cell_of(book, block="Operating KPIs", row=metric, column="FY2024", sheet="Model").value
            == fy2024
        )
        assert (
            cell_of(book, block="Operating KPIs", row=metric, column="FY2023", sheet="Model").value
            == fy2023
        )


@pytest.mark.parametrize(
    ("fixture", "metric", "fy2023", "fy2024"),
    [
        (
            "relative_value-CP-1-draft1.md",
            "Total Power & Control",
            None,
            3941,
        ),
        (
            "distressed-CP-1-draft1.md",
            "Power & Control revenue",
            3316,
            3941,
        ),
    ],
)
def test_retained_tdg_wide_segment_schedule_preserves_periods_units_and_basis(
    full, fixture, metric, fy2023, fy2024
):
    _, snapshot = full
    path = Path(__file__).parent / "fixtures" / "live_2026_11_15" / fixture
    contents = path.read_bytes()
    _, _, body = contents.partition(b"### Segment schedule")
    section = b"### Segment schedule" + body.split(b"\n### ", 1)[0]
    raw = snapshot.model_handoffs["CP-1"] + b"\n" + section
    snapshot = replace(
        snapshot,
        model_handoffs={"CP-1": raw},
        handoff_sha256={**snapshot.handoff_sha256, "CP-1": cs.sha256(raw)},
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    fy2024_cell = cell_of(book, block="Segment data", row=metric, column="FY2024", sheet="Model")
    unit = cell_of(book, block="Segment data", row=metric, column="Unit", sheet="Model")
    basis = cell_of(book, block="Segment data", row=metric, column="Reported basis", sheet="Model")
    assert fy2024_cell.value == fy2024
    assert unit.value == "USD millions"
    assert basis.value in {"Reported external sales", "Reported issuer order"}
    if fy2023 is not None:
        assert (
            cell_of(book, block="Segment data", row=metric, column="FY2023", sheet="Model").value
            == fy2023
        )
    source = listed(book, "Segment data", sheet="Model", row=metric, column="FY2024")[0]
    assert source["Handoff sha256"] == cs.sha256(raw)
    assert all(
        "tdg-20240930.htm.jsonl" not in str(cell.value)
        for row in book["Model"].iter_rows()
        for cell in row
    )


def test_cards_are_bordered_ranges_that_do_not_overlap(book):
    for name in THREE:
        ranges = [CellRange(str(r)) for r in book[name].merged_cells.ranges]
        for i, one in enumerate(ranges):
            assert all(one.isdisjoint(other) for other in ranges[i + 1 :]), (name, one)
    cell = cell_of(book, block="Header", row="Issuer", column="Value")
    assert cell.border.left.style == "thin" and cell.border.top.style == "thin"


def test_nothing_is_written_beyond_the_grid(book, full):
    widths = {layout.sheet: layout.width for layout in writer.LAYOUTS}
    for name in THREE:
        assert book[name].max_column <= widths[name]


# --- The heat strip -------------------------------------------------------------------------------


def test_the_heat_strip_is_one_cell_per_factor_with_a_three_colour_scale_and_no_yellow(book):
    sheet = book["Snapshot"]
    levels = listed(book, "Scorecard", column="Level")
    assert [r["Row"] for r in levels] == list(FACTORS)
    rules = [
        rule
        for item in sheet.conditional_formatting
        for rule in item.rules
        if rule.colorScale is not None
    ]
    assert len(rules) == 1 and len(rules[0].colorScale.color) == 3
    colours = [c.rgb[-6:] for c in rules[0].colorScale.color]
    assert colours == list(writer.HEAT)
    for colour in colours:
        red, green, blue = (int(colour[k : k + 2], 16) for k in (0, 2, 4))
        assert not (red >= 0xF0 and green >= 0xE0 and blue <= min(red, green) - 0x10), colour
    scale = next(item.sqref for item in sheet.conditional_formatting if item.rules[0].colorScale)
    strip = CellRange(str(scale))
    assert {(sheet[r["Cell"]].row, sheet[r["Cell"]].column) for r in levels} == set(strip.cells)
    # Each factor name is a label cell directly above its level.
    for r in levels:
        above = sheet.cell(sheet[r["Cell"]].row - 1, sheet[r["Cell"]].column)
        assert above.value == r["Row"]


def test_the_basis_of_a_factor_is_the_comment_on_its_level(book, full):
    built, _ = full
    lines = cs.physical_lines(built.handoff_text["CP-2"])
    start = next(i for i, line in enumerate(lines) if "T2.13" in line)
    basis = {}
    for line in lines[start:]:
        cells = cs.pipe_cells(line) if line.lstrip().startswith("|") else []
        if len(cells) == 3 and cells[0] in FACTORS:
            basis[cells[0]] = cells[2]
    assert set(basis) == set(FACTORS)
    for factor in FACTORS:
        comment = cell_of(book, block="Scorecard", row=factor, column="Level").comment
        assert comment is not None and comment.text == basis[factor]
        assert "CP-" not in comment.text and ".pdf" not in comment.text
    assessed = cell_of(book, block="Assessments", row="Management", column="View").comment
    assert assessed is not None and assessed.text


def test_a_not_scored_factor_is_text_and_a_scored_one_is_a_number(book):
    assert (
        cell_of(book, block="Scorecard", row="Market share", column="Level").value == "Not scored"
    )
    scale = cell_of(book, block="Scorecard", row="Scale", column="Level")
    assert scale.value == 2 and scale.number_format == "0"


# --- Strengths and weaknesses ---------------------------------------------------------------------


def test_strengths_and_weaknesses_face_each_other_with_glyphs(book):
    sheet = book["Snapshot"]
    glyphs = {r["Row"]: sheet[r["Cell"]] for r in listed(book, writer.STRENGTHS, column="Glyph")}
    assert {k: c.value for k, c in glyphs.items()} == {
        **{f"Strength {n}": "▲" for n in (1, 2)},
        **{f"Weakness {n}": "▼" for n in (1, 2)},
    }
    for row, glyph in glyphs.items():
        label = cell_of(book, block=writer.STRENGTHS, row=row, column="Label")
        assert label.row == glyph.row and label.column > glyph.column
    left, right = glyphs["Strength 1"], glyphs["Weakness 1"]
    assert left.row == right.row and left.column < right.column
    # The glyph is its own cell: the handoff text is not touched.
    assert cell_of(book, block=writer.STRENGTHS, row="Strength 1", column="Label").value == (
        "Aftermarket annuity"
    )


# --- Numbers --------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("row", "column", "value", "number_format"),
    [
        ("Revenue", "FY2025", 1234.5, "#,##0.0;(#,##0.0)"),
        ("Revenue", "FY2024", 1180.0, "#,##0.0;(#,##0.0)"),
        ("Net Cash from Investing Activities", "FY2025", -85.2, "0.0;(0.0)"),
        ("Net Cash from Investing Activities", "FY2024", -70.4, "0.0;(0.0)"),
        ("Opening Cash", "FY2024", 62.0, "0.0;(0.0)"),
    ],
)
def test_financials_figures_keep_their_decimals_and_show_negatives_in_brackets(
    book, row, column, value, number_format
):
    cell = cell_of(book, block="Financials", row=row, column=column, sheet="Model")
    assert (cell.value, cell.number_format) == (value, number_format)


@pytest.mark.parametrize(
    ("row", "column", "text"),
    [
        ("EBITDA (Reported)", "FY2024", "298.12345678901234567"),  # more than 15 digits
        ("Net Cash from Operating Activities", "FY2025", "212.0m"),  # a unit in the cell
        ("Net Cash from Financing Activities", "FY2024", "(40.0)"),  # brackets are text
        ("Gross profit", "FY2024", "–"),  # a period the table has and leaves empty
    ],
)
def test_figures_the_rule_refuses_stay_text(book, row, column, text):
    cell = cell_of(book, block="Financials", row=row, column=column, sheet="Model")
    assert cell.value == text and cell.data_type == "s"


def test_every_number_has_the_format_the_number_rule_chose_and_never_general(book):
    seen = 0
    for row in sources(book):
        if row["Sheet"] not in THREE or row["Kind"] not in (
            "copied",
            "computed",
            "entered at run start",
        ):
            continue
        cell = book[row["Sheet"]][row["Cell"]]
        figure = snap.figure(row["Handoff text"] or "")
        if figure is None:
            assert not isinstance(cell.value, int | float), row
            continue
        seen += 1
        expected = figure.number_format
        if row["Block"] == "Financials":
            expected = f"{expected};({expected})"
        assert (cell.value, cell.number_format) == (figure.value, expected), row
        assert cell.number_format != "General"
    assert seen > 100


def test_only_financials_uses_the_bracket_format(book):
    for row in sources(book):
        if row["Sheet"] in THREE and row["Block"] != "Financials":
            cell = book[row["Sheet"]][row["Cell"]]
            assert ";" not in cell.number_format, row


# --- Analyst cells and Sources --------------------------------------------------------------------


def test_the_investment_thesis_is_a_blank_yellow_analyst_cell(book):
    cell = cell_of(book, block="Investment thesis", row="Thesis", column="Value")
    assert cell.value is None and cell.fill.start_color.rgb[-6:] == writer.ANALYST_FILL
    assert len(listed(book, "Investment thesis", row="Thesis", kind="analyst")) == 1


def test_the_writer_adds_analyst_cells_for_the_fields_no_module_supplies(book, full):
    instruments = [r for r in listed(book, "Instruments", sheet="Inputs") if r["Kind"] == "analyst"]
    names = {
        r["Row"]
        for r in listed(book, "Instruments", column="Instrument", sheet="Inputs", kind="copied")
    }
    assert len(names) == 5
    joined = {"Term Loan B"}  # the one instrument the key's RV worksheet identifies
    assert {(r["Row"], r["Column"]) for r in instruments} == {
        (n, c)
        for n in names
        for c in writer.INSTRUMENT_INPUTS
        if not (n in joined and c in snap.IDENTIFIERS)
    }
    units = listed(book, "Reference unit", column="Unit", sheet="Inputs", kind="analyst")
    assert sorted(r["Row"] for r in units) == ["CLO portfolio", "Loan index fund (LVLN)"]
    assert {r["Kind"] for r in units} == {"analyst"}
    new_issue = [r for r in listed(book, "New issue") if r["Kind"] == "analyst"]
    assert len(new_issue) == 2 * len(writer.NEW_ISSUE_INPUTS)
    assert len(listed(book, "Header", row="Issuer ID", kind="analyst")) == 1
    assert {r["Row"] for r in listed(book, "Confirmation", sheet="Inputs", kind="analyst")} == {
        "Analyst",
        "Confirmation date",
    }


def test_basis_lines_are_copied_text_on_sources_only(book, full):
    built, snapshot = full
    sheet = book["Sources"]
    rows = [r for r in sources(book) if r["Column"] == "Basis"]
    assert len(rows) == len(snapshot.basis_lines) == 5
    for row, line in zip(rows, snapshot.basis_lines, strict=True):
        assert row["Sheet"] == "Sources" and row["Kind"] == "copied"
        assert sheet[row["Cell"]].value == line.text == row["Handoff text"]
        assert row["Handoff sha256"] == cs.sha256(built.handoff_text[line.module].encode())


def test_the_sources_header_is_the_contract_and_the_title_cells_are_labels(book):
    assert tuple(c.value for c in book["Sources"][1]) == cs.SOURCES_HEADER
    banner = listed(book, "Page", row="(title)")
    assert [r["Kind"] for r in banner] == ["label"]


def test_hidden_blocks_leave_no_title_or_row(tmp_path):
    built = cs.build_case(tmp_path, cs.CASES["no_scorecard"])
    snapshot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    book = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    blocks = {r["Block"] for r in sources(book)}
    assert not blocks & {"New issue", "Quotes as entered", "Assessments", "Monitoring triggers"}
    (gap,) = listed(book, "Scorecard", kind="gap")
    assert gap["Row"] == "Gap" and book["Snapshot"][gap["Cell"]].value == gap["Handoff text"]
    assert not listed(book, "Reference unit", sheet="Inputs")  # no stored reference


# --- The rubric -----------------------------------------------------------------------------------


def test_the_matrix_rubric_is_the_methodology_text_one_row_per_factor(book):
    lines = level_text().splitlines()
    header = cs.pipe_cells(lines[0])
    expected = {}
    for line in lines[1:]:
        cells = cs.pipe_cells(line)
        expected.update(
            {(cells[1], name): text for name, text in zip(header[2:], cells[2:], strict=True)}
        )
    shown = {
        (r["Row"], r["Column"]): book["Matrix"][r["Cell"]].value
        for r in listed(book, "Risk rubric", sheet="Matrix")
        if r["Kind"] == "label" and r["Row"] != "(header)" and r["Column"] in header[2:]
    }
    assert len(expected) == 17 * 5
    assert shown == expected
    cell = book["Matrix"][
        listed(book, "Risk rubric", row="Scale", column="1 Excellent", sheet="Matrix")[0]["Cell"]
    ]
    assert cell.value.startswith("EBITDA > $1bn")


# --- Purity and awkward text ----------------------------------------------------------------------


def look_of(book) -> dict:
    out = {}
    for name in book.sheetnames:
        sheet = book[name]
        for row in sheet.iter_rows():
            for c in row:
                out[name, c.coordinate] = (
                    c.value,
                    c.number_format,
                    c.font.b,
                    c.font.i,
                    c.fill.start_color.rgb,
                    c.border.left.style if c.border.left else None,
                    c.alignment.wrap_text,
                    c.comment.text if c.comment else None,
                )
        out[name, "merged"] = sorted(str(r) for r in sheet.merged_cells.ranges)
        out[name, "widths"] = {k: d.width for k, d in sheet.column_dimensions.items()}
        out[name, "heights"] = {k: d.height for k, d in sheet.row_dimensions.items()}
        out[name, "cf"] = sorted(str(i.sqref) for i in sheet.conditional_formatting)
    return out


def test_workbook_bytes_is_a_function_of_its_snapshot(full):
    _, snapshot = full
    one = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    two = load_workbook(io.BytesIO(writer.workbook_bytes(snapshot)))
    assert look_of(one) == look_of(two)
    assert sources(one) == sources(two)


def test_a_different_snapshot_gives_a_different_workbook(full):
    _, snapshot = full
    cells = tuple(
        replace(c, text="Changed Ltd") if (c.block, c.row) == ("Header", "Issuer") else c
        for c in snapshot.cells()
    )
    changed = replace(
        snapshot,
        blocks=tuple(
            replace(b, cells=tuple(c for c in cells if (c.sheet, c.block) == (b.sheet, b.name)))
            for b in snapshot.blocks
        ),
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(changed)))
    assert cell_of(book, block="Header", row="Issuer", column="Value").value == "Changed Ltd"


def test_copied_text_that_looks_like_a_formula_stays_text(full):
    _, snapshot = full
    blocks = tuple(
        replace(
            b, cells=tuple(replace(c, text="=1+1") if c.row == "Issuer" else c for c in b.cells)
        )
        if b.name == "Header"
        else b
        for b in snapshot.blocks
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(replace(snapshot, blocks=blocks))))
    cell = cell_of(book, block="Header", row="Issuer", column="Value")
    assert cell.value == "=1+1" and cell.data_type == "s"
    (row,) = listed(book, "Header", row="Issuer", column="Value")
    assert row["Handoff text"] == "=1+1"


def test_a_table_wider_than_its_card_is_cut_into_slices_and_loses_nothing(full):
    _, snapshot = full
    periods = [f"P{n:02d}" for n in range(1, 31)]
    cells = tuple(
        snap.SnapshotCell(
            "Snapshot", "Financials", row, period, "copied", f"{n}.5", "CP-1", "T4.4", 7
        )
        for n, row in enumerate(("Revenue", "EBITDA"), start=1)
        for period in periods
    )
    blocks = tuple(
        snap.Block("Snapshot", "Financials", cells) if b.name == "Financials" else b
        for b in snapshot.blocks
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(replace(snapshot, blocks=blocks))))
    rows = [
        r
        for r in listed(book, "Financials", sheet="Model")
        if r["Kind"] == "copied" and r["Row"] in {"Revenue", "EBITDA"}
    ]
    assert len(rows) == 60
    assert len({r["Cell"] for r in rows}) == 60
    assert book["Snapshot"].max_column <= 17
    one = cell_of(book, block="Financials", row="Revenue", column="P30", sheet="Model")
    assert (one.value, one.number_format) == (1.5, "0.0;(0.0)")


# --- Fix round 1: leaky Basis, one-sided strengths ------------------------------------------------


def with_basis(snapshot, basis):
    blocks = tuple(
        replace(b, cells=tuple(replace(c, basis=basis) if c.basis else c for c in b.cells))
        for b in snapshot.blocks
    )
    return replace(snapshot, blocks=blocks)


@pytest.mark.parametrize(
    "leaky",
    [
        "CP-1 T4.9; NBG_report_2026.pdf p.3",
        "See CP-2A for the band",
        "from the annual report.htm table",
        "ledger.jsonl line 4",
        "notes.md",
        "model.xlsx",
        "hash " + "a" * 64,
    ],
)
def test_a_basis_naming_a_module_file_or_hash_has_no_comment_but_a_sources_row(full, leaky):
    _, snapshot = full
    book = load_workbook(io.BytesIO(writer.workbook_bytes(with_basis(snapshot, leaky))))
    for block in ("Scorecard", "Assessments"):
        assert all(
            book["Snapshot"][r["Cell"]].comment is None for r in listed(book, block, kind="copied")
        )
    kept = [r for r in sources(book) if r["Column"] == "Row basis"]
    assert len(kept) == 21  # 17 factors and 4 assessments
    assert {r["Handoff text"] for r in kept} == {leaky}
    assert all(r["Sheet"] == "Sources" and r["Module"] == "CP-2" and r["Line"] for r in kept)


def test_a_run_id_in_a_basis_has_no_comment(full):
    _, snapshot = full
    book = load_workbook(
        io.BytesIO(writer.workbook_bytes(with_basis(snapshot, f"run {snapshot.run_id} says")))
    )
    assert (
        book["Snapshot"][listed(book, "Scorecard", row="Scale", column="Level")[0]["Cell"]].comment
        is None
    )


def test_a_clean_basis_keeps_its_comment_and_has_a_sources_row(book):
    comment = cell_of(book, block="Scorecard", row="Scale", column="Level").comment
    assert comment is not None
    rows = [r for r in sources(book) if r["Column"] == "Row basis" and r["Row"] == "Scale"]
    assert [r["Handoff text"] for r in rows] == [comment.text]


@pytest.mark.parametrize(
    ("keep", "drop", "glyph"), [("Weakness", "Strength", "▼"), ("Strength", "Weakness", "▲")]
)
def test_a_one_sided_strengths_block_keeps_the_facing_columns_and_glyphs(full, keep, drop, glyph):
    _, snapshot = full
    blocks = tuple(
        replace(b, cells=tuple(c for c in b.cells if not c.row.startswith(drop)))
        if b.name == writer.STRENGTHS
        else b
        for b in snapshot.blocks
    )
    book = load_workbook(io.BytesIO(writer.workbook_bytes(replace(snapshot, blocks=blocks))))
    glyphs = listed(book, writer.STRENGTHS, column="Glyph")
    assert {book["Snapshot"][r["Cell"]].value for r in glyphs} == {glyph}
    headings = {r["Handoff text"] for r in listed(book, writer.STRENGTHS, column="Heading")}
    assert headings == {"Strengths", "Weaknesses"}


def test_bloomberg_id_sits_beside_figi_and_the_joined_blank_has_no_sources_row(book, full):
    sheet = book["Inputs"]
    header = next(r for r in sheet.iter_rows() if any(c.value == "FIGI" for c in r))
    shown = [c.value for c in header if c.value is not None]  # the Instruments header row
    assert shown[shown.index("FIGI") + 1] == "Bloomberg ID"
    listed_cells = {(r["Sheet"], r["Cell"]) for r in sources(book)}
    place = {
        (r["Row"], r["Column"]): r["Cell"] for r in listed(book, "Instruments", sheet="Inputs")
    }
    assert ("Term Loan B", "FIGI") not in place  # blank: no Sources row
    (loan,) = [
        r
        for r in listed(
            book, "Instruments", row="Term Loan B", column="Bloomberg ID", sheet="Inputs"
        )
    ]
    assert loan["Kind"] == "copied" and loan["Module"] == snap.RV_MODULE
    assert loan["Section"] == "SYNTHETIC-rv-worksheet.csv" and loan["Line"] == 2
    assert loan["Handoff sha256"] == full[1].source_sha256[loan["Section"]]
    blank = sheet.cell(row=int(loan["Cell"][1:]), column=sheet[loan["Cell"]].column - 1)
    assert blank.value is None and blank.fill.fill_type is None
    assert ("Inputs", blank.coordinate) not in listed_cells


# --- A control character reaching the writer by any path (fix round 2) ----------------------------


def _with_control_characters(shot: snap.Snapshot) -> snap.Snapshot:
    """The snapshot with a control character in a Basis line, a cell's section and a gap's text."""
    basis = [replace(line, text=line.text + "\x01") for line in shot.basis_lines[:1]]
    basis += shot.basis_lines[1:]
    marked = {"section": False, "gap": False}
    blocks = []
    for block in shot.blocks:
        cells = []
        for cell in block.cells:
            if cell.section and not marked["section"]:
                cell, marked["section"] = replace(cell, section=cell.section + "\x1b"), True
            elif cell.kind == snap.GAP and not marked["gap"]:
                cell, marked["gap"] = replace(cell, text="no ### \x08 section"), True
            cells.append(cell)
        blocks.append(replace(block, cells=tuple(cells)))
    assert all(marked.values()) and basis
    return replace(shot, basis_lines=tuple(basis), blocks=tuple(blocks))


def test_a_control_character_on_any_path_is_written_as_the_gap_text(full, caplog):
    with caplog.at_level("WARNING", logger="deploy_workflow.credit_snapshot_workbook"):
        opened = load_workbook(io.BytesIO(writer.workbook_bytes(_with_control_characters(full[1]))))
    texts = [c.value for ws in opened for row in ws.iter_rows() for c in row]
    assert not any(isinstance(v, str) and snap.ILLEGAL.search(v) for v in texts)
    assert texts.count(snap.CONTROL_CHARACTER) >= 3
    assert "holds a control character" in caplog.text


# --- Mutation testing of the figure path (PR 4, Task 6) -------------------------------------------


def text_cells(book):
    """(Sources row, worksheet cell) of each copied, computed or entered cell of the sheets."""
    for row in sources(book):
        if row["Sheet"] in THREE and row["Kind"] in ("copied", "computed", "entered at run start"):
            yield row, book[row["Sheet"]][row["Cell"]]


def test_a_number_is_right_aligned_a_title_or_header_centred_and_other_text_left(book):
    numbers = [
        c for row, c in text_cells(book) if snap.figure(row["Handoff text"] or "") is not None
    ]
    assert len(numbers) > 100 and {c.alignment.horizontal for c in numbers} == {"right"}
    words = [c for row, c in text_cells(book) if snap.figure(row["Handoff text"] or "") is None]
    assert len(words) > 100 and {c.alignment.horizontal for c in words} == {"left"}
    banner = book["Snapshot"]["A1"]
    assert banner.value == "Credit Snapshot" and banner.alignment.horizontal == "center"
    headings = listed(book, "Strengths and weaknesses", column="Heading")
    assert headings
    for row in headings:
        assert book[row["Sheet"]][row["Cell"]].alignment.horizontal == "center"
    title = cell_of(book, block="Header", column="Title")
    assert title.alignment.horizontal == "left"


def test_text_keeps_the_general_format_and_no_range_merges_a_single_cell(book):
    words = [c for row, c in text_cells(book) if snap.figure(row["Handoff text"] or "") is None]
    assert words and {c.number_format for c in words} == {"General"}
    for name in THREE:
        for merged in book[name].merged_cells.ranges:
            assert (merged.max_row, merged.max_col) != (merged.min_row, merged.min_col), (
                name,
                str(merged),
            )


def test_a_long_copied_text_makes_its_row_taller_than_a_single_line(book):
    tall = 0
    for row, cell in text_cells(book):
        text = row["Handoff text"] or ""
        sheet = book[row["Sheet"]]
        span = next(
            (m.max_col - m.min_col + 1 for m in sheet.merged_cells.ranges if cell.coordinate in m),
            1,
        )
        width = next(x.column_width for x in writer.LAYOUTS if x.sheet == row["Sheet"])
        if len(text) > span * width * 1.15 and "\n" not in text:
            tall += 1
            assert sheet.row_dimensions[cell.row].height >= 27, row
    assert tall > 0


def test_a_scorecard_level_written_another_way_is_listed_as_written_on_sources(full):
    _, shot = full
    marked = {}
    blocks = []
    for block in shot.blocks:
        cells = []
        for cell in block.cells:
            if cell.basis and cell.block == "Scorecard" and cell.column == "Level":
                cell = replace(cell, written=f"**{cell.text}**")
                marked[cell.row] = cell.written
            cells.append(cell)
        blocks.append(replace(block, cells=tuple(cells)))
    assert marked
    opened = load_workbook(io.BytesIO(writer.workbook_bytes(replace(shot, blocks=tuple(blocks)))))
    shown = {
        r["Row"]: r["Handoff text"]
        for r in sources(opened)
        if r["Block"] == "Scorecard" and r["Sheet"] == "Sources" and r["Column"] == "As written"
    }
    assert shown == marked
    plain = load_workbook(io.BytesIO(writer.workbook_bytes(shot)))
    assert not [r for r in sources(plain) if r["Column"] == "As written"]


def test_put_returns_the_address_of_the_cell_it_wrote(full):
    book = writer._Book(full[1])
    page = writer._Page(book, book.workbook.active, writer.LAYOUTS[0])
    spec = writer._Put("Header", "Title", "Value", snap.COPIED, "Northbridge", writer.LABEL)
    assert page.put(3, 2, 1, spec) == "B3"
    assert book.workbook.active["B3"].value == "Northbridge"


# --- Module codes in copied text (PM-2) -----------------------------------------------------------

CODE_EDITS = {
    "CP-1A": (
        "| Refinancing of the 2027 term loan | Proposed | Extends the maturity wall to 2031. |",
        (
            "| Refinancing of the 2027 term loan | Proposed | Extends the maturity wall to 2031, "
            "as the debt schedule of Financial foundation (CP-1) shows. |"
        ),
    ),
    "CP-2": (
        "| Signals a debt-funded step up in borrowing. |",
        ("| Signals a debt-funded step up in borrowing; CP-2A restates it. |"),
    ),
}


def test_a_module_code_in_copied_text_reads_as_the_modules_name_and_sources_keeps_the_text(
    tmp_path,
):
    handoffs = dict(cs.CASES["full"].handoffs)
    for module, (old, new) in CODE_EDITS.items():
        text = handoffs[module].read_text(encoding="utf-8")
        assert old in text
        handoffs[module] = tmp_path / f"{module}.md"
        handoffs[module].write_text(text.replace(old, new, 1), encoding="utf-8")
    built = cs.build_case(tmp_path / "ws", replace(cs.CASES["full"], handoffs=handoffs))
    shown = load_workbook(
        io.BytesIO(
            writer.workbook_bytes(snap.gather(snap.load_run(built.folder, built.stores.both())))
        )
    )
    values = {
        cell.value
        for name in THREE
        for row in shown[name].iter_rows()
        for cell in row
        if isinstance(cell.value, str)
    }
    event = CODE_EDITS["CP-1A"][1].split("|")[3].strip()
    driver = CODE_EDITS["CP-2"][1].strip(" |")
    assert event.replace(" (CP-1)", "") in values
    assert "Signals a debt-funded step up in borrowing; Downside restates it." in values
    assert not [v for v in values if "CP-" in v]
    written = {r["Handoff text"] for r in sources(shown) if r["Column"] == "As written"}
    assert {event, driver} <= written


def test_an_unreadable_table_is_a_reader_sentence_on_the_sheet_and_its_reason_is_on_sources(
    tmp_path,
):
    handoffs = dict(cs.CASES["full"].handoffs)
    text = handoffs["CP-1C"].read_text(encoding="utf-8")
    assert "| Entity Name |" in text
    handoffs["CP-1C"] = tmp_path / "CP-1C.md"
    handoffs["CP-1C"].write_text(text.replace("| Entity Name |", "| Entity |", 1), "utf-8")
    built = cs.build_case(tmp_path / "ws", replace(cs.CASES["full"], handoffs=handoffs))
    shot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    opened = load_workbook(io.BytesIO(writer.workbook_bytes(shot)))
    (gap,) = [r for r in sources(opened) if r["Block"] == "Peers" and r["Kind"] == "gap"]
    assert gap["Handoff text"] == "The Peer benchmark peer table could not be read."
    (reason,) = [r for r in sources(opened) if r["Block"] == "Peers" and r["Column"] == "Reason"]
    assert reason["Sheet"] == "Sources" and "`Entity Name` column" in reason["Handoff text"]
    shown = [
        c.value
        for name in THREE
        for row in opened[name].iter_rows()
        for c in row
        if isinstance(c.value, str)
    ]
    assert not [v for v in shown if "CP-" in v or "`" in v]


def test_a_file_name_or_page_locator_in_copied_text_is_not_drawn_and_sources_keeps_the_text(
    tmp_path,
):
    """Ruling PM-k: the reader sheets show a cell's own words without its source reference, and
    `Source reference: see Sources` when none remain; the exact text is an `As written` row."""
    old = "| Signals a debt-funded step up in borrowing. |"
    only = "| Signals a debt-funded step up in borrowing (NBG_annual_2025.pdf, page 60). |"
    mixed = "| Leverage is high. See NBG_annual_2025.pdf, page 60. |"
    seen = {}
    for name, new in (("only", only), ("mixed", mixed)):
        handoffs = dict(cs.CASES["full"].handoffs)
        text = handoffs["CP-2"].read_text(encoding="utf-8")
        assert old in text
        handoffs["CP-2"] = tmp_path / f"{name}.md"
        handoffs["CP-2"].write_text(text.replace(old, new, 1), encoding="utf-8")
        built = cs.build_case(tmp_path / name, replace(cs.CASES["full"], handoffs=handoffs))
        shot = snap.gather(snap.load_run(built.folder, built.stores.both()))
        opened = load_workbook(io.BytesIO(writer.workbook_bytes(shot)))
        shown = {
            c.value
            for sheet in THREE
            for row in opened[sheet].iter_rows()
            for c in row
            if isinstance(c.value, str)
        }
        assert not [v for v in shown if ".pdf" in v or "page 60" in v]
        written = {r["Handoff text"] for r in sources(opened) if r["Column"] == "As written"}
        seen[name] = (shown, written)
    assert "Source reference: see Sources" in seen["only"][0]
    assert only.strip("| ") in seen["only"][1]
    assert "Leverage is high." in seen["mixed"][0]
    assert mixed.strip("| ") in seen["mixed"][1]


def test_a_module_code_in_a_first_column_cell_adds_no_row_label_column(tmp_path):
    """M-R2: the first cell of a row that is drawn with a reader name still names itself, so the
    card gains no row-label column showing the raw text."""
    old = "| Net leverage above 5.0x | Two consecutive quarters |"
    new = (
        "| Net leverage above 5.0x, as Financial foundation (CP-1) measures it "
        "| Two consecutive quarters |"
    )
    counts = []
    for name, edit in (("before", old), ("after", new)):
        handoffs = dict(cs.CASES["full"].handoffs)
        text = handoffs["CP-2"].read_text(encoding="utf-8")
        assert old in text
        handoffs["CP-2"] = tmp_path / f"{name}.md"
        handoffs["CP-2"].write_text(text.replace(old, edit, 1), encoding="utf-8")
        built = cs.build_case(tmp_path / name, replace(cs.CASES["full"], handoffs=handoffs))
        shot = snap.gather(snap.load_run(built.folder, built.stores.both()))
        opened = load_workbook(io.BytesIO(writer.workbook_bytes(shot)))
        counts.append(len(listed(opened, "Monitoring triggers", column="Row label")))
        assert not [
            c.value
            for sheet in THREE
            for row in opened[sheet].iter_rows()
            for c in row
            if isinstance(c.value, str) and "CP-" in c.value
        ]
    assert counts[1] == counts[0]


def test_a_missing_pinned_context_puts_no_path_or_hash_on_the_three_sheets(tmp_path, caplog):
    """S1 (ruling PM-l): the reader sentence is on the sheets; the path and hash are logged and on
    Sources."""
    built = cs.build_case(tmp_path, cs.CASES["full"])
    pinned = [p for p in (built.folder / "inputs").iterdir() if len(p.name) == 64]
    assert pinned
    for path in pinned:
        path.unlink()
    with caplog.at_level("WARNING"):
        run = snap.load_run(built.folder, built.stores.both())
    assert isinstance(run.context, snap.ContextGap)
    opened = load_workbook(io.BytesIO(writer.workbook_bytes(snap.gather(run))))
    shown = [
        c.value
        for name in THREE
        for row in opened[name].iter_rows()
        for c in row
        if isinstance(c.value, str)
    ]
    assert not [v for v in shown if re.search(r"inputs/|[0-9a-f]{64}|sha256", v, re.IGNORECASE)]
    sentence = "The run's inputs at run start could not be read."
    assert sum(v == sentence for v in shown) == 3  # ratings, new issue, quotes
    reasons = [
        r
        for r in sources(opened)
        if r["Column"] == "Reason"
        and r["Block"] in {"Corporate ratings", "New issue", "Quotes as entered"}
    ]
    assert len(reasons) == 3 and all("inputs/" in r["Handoff text"] for r in reasons)
    assert any("inputs/" in r.getMessage() for r in caplog.records)


def test_every_as_written_row_is_the_text_of_the_handoff_line_it_names_and_a_reason_row_is_computed(
    tmp_path,
):
    """L14 and L11: `As written` rows are copied text and sit on the line they name; a `Reason`
    row is the app's own sentence about a gap, so kind computed with no handoff line."""
    edits = {
        "CP-2": (
            "| Signals a debt-funded step up in borrowing. |",
            (
                "| Signals a step up in borrowing, as Financial foundation (CP-1) shows "
                "(NBG.pdf, p. 3). |"
            ),
        ),
        "CP-1C": ("| Entity Name |", "| Entity |"),
    }
    handoffs = dict(cs.CASES["full"].handoffs)
    for module, (old, new) in edits.items():
        text = handoffs[module].read_text(encoding="utf-8")
        assert old in text
        handoffs[module] = tmp_path / f"{module}.md"
        handoffs[module].write_text(text.replace(old, new, 1), encoding="utf-8")
    built = cs.build_case(tmp_path / "ws", replace(cs.CASES["full"], handoffs=handoffs))
    shot = snap.gather(snap.load_run(built.folder, built.stores.both()))
    opened = load_workbook(io.BytesIO(writer.workbook_bytes(shot)))
    rows = sources(opened)
    written = [r for r in rows if r["Column"] == "As written"]
    assert written
    for r in written:
        line = handoffs[r["Module"]].read_text(encoding="utf-8").split("\n")[r["Line"] - 1]
        assert r["Kind"] == "copied" and r["Handoff text"] in line, r
    reasons = [r for r in rows if r["Column"] == "Reason"]
    assert reasons and all(r["Kind"] == "computed" and r["Line"] is None for r in reasons)
